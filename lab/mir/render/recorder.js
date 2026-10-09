/* render/recorder.js — THE RECORDER: deterministic film frames from any canvas app, to an MP4 or to lossless PNG frames.
 *
 * Harvested from BASINS app/deterministic-export.js (the runner), app/render-snapshot.js (the signature) and the film half of
 * app/export.js; the order of operations, the checkpoints and the refusals are BASINS'.  The kit takes the mechanism; the
 * frame itself is the app's: it is handed `frame(i, ctx)` and returns a canvas, an ImageBitmap or `{ rgba, width, height }`.
 *
 *   const rec = createRecorder({ host: mod.host, frame, editor: tl.editor, app: 'basins', wake: app.wakeLock.hold,
 *                                motions: { zoom: { label: 'ZOOM', prepare } }, … });
 *   const result = await rec.run({ motion: 'timeline-active', fps: 30, format: 'png', resolution: '1080p', onProgress });
 *   → { files: [{ name, blob, bytes, firstFrame, lastFrame }], width, height, fps, frames, motion, durationS, offsetS, format, … }
 *
 * THE LAWS
 *   1. FRAME ZERO IS THE PLAY EDGE, and every frame moves musical time by exactly 1/fps (render/clock.js).  Wall time only
 *      decides when a finished frame can be read.  A render is repeatable to the bit, in a hidden tab as in a visible one.
 *   2. THE LIVE RACK COMES BACK.  The runtime is captured before frame zero and restored in one operation after the last
 *      frame, a cancel or a failure.  The picture's own state (camera, crawl, budgets) is the app's: `frame()` and the
 *      `before` / `after` hooks hold it.
 *   3. THE RUN OWNS THE PAGE.  Pointer, wheel, click and key events are swallowed for its length (Escape cancels; a
 *      `[data-render-cancel]` button works); the screen is held awake (`wake`); one render at a time per page.
 *   4. NOTHING IS LOST TO A FAILURE.  Encoded payloads go to disk (render/store.js) with a checkpoint every two seconds of
 *      video; a failed or cancelled run keeps its completed frames, to RECOVER or RESUME after a reload.
 *   5. THE ENCODER IS PROVEN BEFORE THE RUN (render/encoder.js verifyEncoder): two frames encoded and decoded, 60 s timeout;
 *      a browser that cannot fails in seconds with "Choose PNG frames", not at frame 9,000.
 *   6. A MOTION IS DATA.  STILL, TIMELINE · ACTIVE and TIMELINE · SELECTION are the kit's; an app registers its own
 *      (BASINS: ZOOM) as `{ label, prepare(ctx) → { view(i), durationS?, spec? } }`: `view(i)` is handed to `frame()` as `ctx.view`.
 *
 * createRecorder(options) → rec
 *   host            the modulation host ({ clock, model, registry, present }), or null: then nothing is stepped
 *   frame(i, ctx)   → Promise<canvas | ImageBitmap | OffscreenCanvas | ImageData | { rgba, width, height }>: draw frame i at
 *                   ctx.width × ctx.height.  ctx = { i, frame (the clock's index), beat, time, fps, width, height, view, signal }.
 *                   The clock has already stepped and the host has applied every parameter; settle the picture and return it.
 *   motions         { id: { label, prepare(ctx), restore? } }: the app's (ctx = { width, height, fps, durationS, offsetS, options, spec })
 *   editor          the timeline's editor ({ range(), activeRange(), model }): TIMELINE · SELECTION reads range(), ACTIVE reads activeRange()
 *   app             names the files and the manifest ("basins-frames-…zip"); default "mir"
 *   dir, storage    the OPFS directory of recordings (BASINS: "basins-recordings") and the storage object (default navigator.storage)
 *   wake(reason)    → release: hold the screen awake (installWakeLock's `hold`); called inside the RENDER tap, before any await
 *   check()         throws to stop the run (a lost graphics device); polled before every frame
 *   before(spec), after()   the picture's own state: before the clock enters, after it exits (always)
 *   signature()     JSON the app adds to the project signature (BASINS: the look and the colour space); a resume refuses when it changed
 *   canonical(s)    maps ids and strings that do not survive a reload to stable ones (BASINS: its palette ids); default identity
 *   describe()      JSON the app stores in the manifest under `app` (BASINS: its look, camera and cache policy)
 *   currentSize()   → { w, h }: the CURRENT DEVICE WINDOW resolution
 *   colorSpace      'display-p3' when the app draws in it
 *   hidden()        whether the page is hidden now (default document.hidden); pauseWhileHidden (default true) waits for the page
 *   guard           swallow the page's input during a run (default true)
 *   calib           { read(), write(v) } the device's measured ms per frame (default localStorage "mir.render.calib")
 *
 * rec.run(options) → result
 *   motion       'still' | 'timeline-active' | 'timeline-selection' | an app motion id (default 'still')
 *   fps          24 | 30 | 48 | 60         durationS · offsetS   seconds (ignored by the timeline motions: the range sets them)
 *   format       'mp4' (high bitrate, WebCodecs) | 'png' (lossless frames in ZIP parts)
 *   resolution   '1080p' | '1440p' | '2160p' | 'current'   or  size: { w, h } (even, ≥ 16)
 *   modulation   true (ON · FROM FIRST SPACE) | false (OFF · FREEZE THIS LOOK)
 *   timeline     true (ON · FROM BEAT ZERO) | false (OFF · BYPASS AUTOMATION); a timeline motion always plays it
 *   previewS     render only this many seconds (the panel's 3 s preview)
 *   motionOptions   handed to the app motion as ctx.options (stored in the manifest, so it must be JSON)
 *   onProgress(p)   { phase, frame, frames, renderedFrames, elapsedMs, queuedBytes, writtenBytes, seek, seekTotal }
 * rec.plan(options) → { plan, size, bitrate, range, rangeKind, motion }          the numbers a panel shows before the tap (throws a sentence)
 * rec.estimate(options) → { …plan, est: estimateFilm(), warning }
 * rec.cancel() · rec.running() · rec.state() · rec.discard(result)
 * rec.recoveries() → [{ store, files, frames, spec }]      rec.recover(job, { onProgress }) → resume a checkpointed run
 * rec.encoderPath(options) → the path preflight would take       rec.selfTest(options) → render/selftest.js
 * rec.dumpLines() (also registered with core/describe.js)         rec.destroy() */
import { registerDumpLines } from '../core/describe.js';
import { StoredZip } from '../core/zip.js';
import { createRecordClock } from './clock.js';
import { WcSink, decideEncoderPath, verifyEncoder, pngBytes } from './encoder.js';
import { RenderStore, DEFAULT_DIR } from './store.js';
import { recordingPlan, timelinePlan, pickHighBitrate, estimateFilm, ceilingWarning, RECORD_SIZES, RECORD_RESOLUTIONS, RECORD_FORMATS, MAX_FRAMES, RUN_CEILING_MS, fmtMs, fmtBytes, fmtClock } from './plan.js';
import { renderSelfTest, selfTestLines } from './selftest.js';

const MP4_ESTIMATE_MAX = 128e6;   // bounded memory fallback when OPFS is unavailable
const PNG_PART_MAX = 128e6;
const PNG_MEMORY_MAX = 480e6;
const CALIB_KEY = 'mir.render.calib';
const TIMELINE_MOTIONS = ['timeline-active', 'timeline-selection'];
const yieldTask = () => new Promise((resolve) => setTimeout(resolve, 0));
const rangeSentence = (kind, missing) => missing ? 'TIMELINE · ' + kind.toUpperCase() + ' needs the TIMELINE window — open it first'
  : kind === 'active' ? 'TIMELINE · ACTIVE: there is no active range — mark one with ACTIVE in the TIMELINE first'
  : 'TIMELINE · SELECTION: nothing is selected on the ruler — drag a range on the TIMELINE strip first';

let busy = null;   // the one recorder running on this page

export function createRecorder(options = {}) {
  const o = options;
  const host = o.host || null, app = String(o.app || 'mir'), dirName = o.dir || DEFAULT_DIR;
  const motions = o.motions || {};
  const doc = typeof document !== 'undefined' ? document : null;
  const isHidden = typeof o.hidden === 'function' ? o.hidden : () => !!(doc && doc.hidden);
  const pauseHidden = o.pauseWhileHidden !== false;
  const canonical = typeof o.canonical === 'function' ? o.canonical : (s) => s;
  const calib = o.calib || { read: () => { try { return JSON.parse(localStorage.getItem(CALIB_KEY) || 'null'); } catch (_) { return null; } },
    write: (v) => { try { localStorage.setItem(CALIB_KEY, JSON.stringify(v)); } catch (_) { /* storage refused */ } } };
  const clock = host ? createRecordClock({ host, hidden: isHidden }) : null;
  const state = { running: false, phase: 'idle', progress: null, path: null, last: null, lastError: null, runs: 0, cancelled: 0, errors: 0, selfTest: null };
  const watchers = new Set();
  let live = null;
  const say = () => { for (const fn of watchers) { try { fn(state); } catch (e) { (globalThis.reportError || console.error)(e); } } };

  /* ── what a run will be ───────────────────────────────────────────────── */
  function sizeOf(resolution, size) {
    if (size) return { w: size.w, h: size.h };
    if (RECORD_SIZES[resolution]) return { w: RECORD_SIZES[resolution][0], h: RECORD_SIZES[resolution][1] };
    if (resolution === 'current' || resolution == null) {
      if (typeof o.currentSize !== 'function') throw new Error('This app has no current window size: choose a resolution');
      const c = o.currentSize();
      return { w: Math.max(16, Math.round(c.w) & ~1), h: Math.max(16, Math.round(c.h) & ~1) };
    }
    throw new Error('unknown recording resolution');
  }
  function rangeOf(motion) {
    const kind = motion === 'timeline-active' ? 'active' : 'selection', ed = o.editor;
    const read = ed && (kind === 'active' ? ed.activeRange : ed.range);
    let r = null; try { r = typeof read === 'function' ? read.call(ed) : null; } catch (_) { /* no range */ }
    const ok = r && Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start && r.start >= 0;
    return { kind, range: ok ? { start: r.start, end: r.end } : null, missing: typeof read !== 'function' };
  }
  function plan(opts = {}) {
    const motion = opts.motion || 'still';
    if (motion !== 'still' && !TIMELINE_MOTIONS.includes(motion) && !motions[motion]) throw new Error('Unknown camera motion');
    const resolution = opts.resolution || (opts.size ? null : '1080p'), format = opts.format || 'mp4';
    if ((resolution && !RECORD_RESOLUTIONS.includes(resolution)) || !RECORD_FORMATS.includes(format)) throw new Error('Unknown recording format or resolution');
    const fps = Number(opts.fps || 30);
    let p, range = null, rangeKind = null;
    if (TIMELINE_MOTIONS.includes(motion)) {
      const r = rangeOf(motion);
      if (!r.range) throw new Error(rangeSentence(r.kind, r.missing));
      const bpm = opts.bpm ?? host?.model?.transport?.bpm;
      p = timelinePlan({ range: r.range, bpm, fps }); range = r.range; rangeKind = r.kind;
    } else p = recordingPlan({ fps, durationS: opts.durationS ?? 10, offsetS: opts.offsetS ?? 0 });
    if (!p) throw new Error('Choose a valid frame rate and length');
    if (p.frames > MAX_FRAMES || p.startFrame > MAX_FRAMES) throw new Error('Choose a valid duration, offset and frame rate (up to 3600 seconds)');
    const fullDurationS = p.durationS;
    if (opts.previewS > 0) p = { ...p, frames: Math.min(p.frames, Math.max(1, Math.round(opts.previewS * p.fps))) };
    const size = sizeOf(resolution, opts.size);
    return { plan: p, size, bitrate: pickHighBitrate(size.w, size.h, p.fps), range, rangeKind, motion, format, fullDurationS };
  }
  function estimate(opts = {}) {
    const p = plan(opts), c = calib.read();
    const est = estimateFilm({ frames: p.plan.frames, fps: p.plan.fps, width: p.size.w, height: p.size.h, format: p.format, bitrate: p.bitrate, msPerFrame: c && c.capMs > 0 ? c.capMs : 0 });
    return { ...p, est, learned: !!(c && c.capMs > 0), warning: ceilingWarning(est.renderMs, o.ceilingMs || RUN_CEILING_MS) };
  }
  const encoderPath = async (opts = {}) => { const p = plan(opts); return decideEncoderPath(p.size.w, p.size.h, p.plan.fps, p.bitrate); };

  /* ── the project signature: what must be the same for a resume to be the same render ── */
  function runtimeSnapshot() {
    if (!host) return { signature: JSON.stringify({ app: o.signature ? o.signature() : null }), values: {} };
    const reg = host.registry, bases = {}, values = {};
    for (const id of reg.list()) { bases[canonical(id)] = reg.baseOf(id); values[canonical(id)] = reg.read(id); }
    const fix = (_, v) => (typeof v === 'string' ? canonical(v) : v);
    const rack = JSON.parse(JSON.stringify(host.model.serializeRack(), fix));
    const c = host.clock.snapshot();
    const doc_ = o.editor?.model ? JSON.parse(JSON.stringify(o.editor.model.serialize(), fix)) : null;
    const signature = JSON.stringify({ ...(doc_ && doc_.clips && doc_.clips.length ? { timeline: doc_ } : {}), app: o.signature ? o.signature() : null, rack,
      bases: Object.fromEntries(Object.entries(bases).sort(([a], [b]) => a.localeCompare(b))), bpm: c.bpm, sync: c.sync });
    return { signature, values, rack, arrangement: doc_ };
  }
  /** the saved frozen values, back under this page's own ids */
  const localValues = (values) => (host ? Object.fromEntries(host.registry.list().filter((id) => Object.hasOwn(values, canonical(id))).map((id) => [id, values[canonical(id)]])) : {});

  /* ── a run ────────────────────────────────────────────────────────────── */
  async function start(opts, resume, runId) {
    if (busy) throw new Error('Another render is already running');
    // CLAIM SYNCHRONOUSLY: capability probing must not let a second UI race this run, and the wake lock must be asked for
    // inside the RENDER tap (a gesture), before the first await.
    busy = rec; state.running = true; state.runs++; state.lastError = null; state.phase = 'prepare';
    const releaseWake = typeof o.wake === 'function' ? (() => { try { return o.wake('render'); } catch (_) { return null; } })() : null;
    let cancelled = false, waker = null;
    const ctl = new AbortController();
    const run = { cancel() { cancelled = true; ctl.abort(); if (waker) waker(); }, get cancelled() { return cancelled; } };
    live = run;
    say();
    const wallStart = performance.now();
    let store = null, sink = null, clockEntered = false, canvas = null, hooked = false, files = [], lastErr = null, exitErr = null, done = false;
    const progress = (phase, frame, frames, more = {}) => {
      state.phase = phase; state.progress = { phase, frame, frames, ...more };
      if (typeof opts.onProgress === 'function') { try { opts.onProgress(state.progress); } catch (_) { /* a spectator */ } }
      say();
    };
    const check = () => {
      if (cancelled) throw new Error('Recording cancelled');
      if (typeof o.check === 'function') o.check();
    };
    const visible = async (frame, frames) => {
      while (pauseHidden && isHidden()) {
        check(); progress('paused', frame, frames);
        await new Promise((resolve) => { waker = resolve; doc?.addEventListener('visibilitychange', resolve, { once: true, signal: ctl.signal }); });
        waker = null;
      }
    };
    const guard = (e) => {
      if (e.key === 'Escape') { run.cancel(); e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (e.target?.closest?.('[data-render-cancel]')) return;
      e.preventDefault(); e.stopImmediatePropagation();
    };
    try {
      const p = resume ? null : plan(opts);
      const spec0 = resume ? resume.spec : null;
      const motionId = resume ? (spec0.motion === 'timeline' ? 'timeline-' + (spec0.rangeKind || 'active') : spec0.motion) : p.motion;
      const format = resume ? (spec0.format || 'mp4') : p.format;
      const size = resume ? { w: spec0.width, h: spec0.height } : p.size;
      const { w, h } = size;
      if (![w, h].every((n) => Number.isInteger(n) && n >= 16 && !(n & 1))) throw new Error('Output dimensions must be even positive integers');
      const modulation = resume ? !!spec0.modulation : !!opts.modulation;
      const isTimeline = TIMELINE_MOTIONS.includes(motionId);
      const timelineOn = isTimeline || (resume ? spec0.timeline !== false : opts.timeline !== false);
      const fp = resume ? recordingPlan({ fps: spec0.fps, durationS: spec0.planDurationS, offsetS: spec0.offsetS }) : p.plan;
      const frames = resume ? spec0.frames : fp.frames;
      const { fps, startFrame } = fp;
      const bitrate = resume ? spec0.bitrate : p.bitrate;
      const range = resume ? spec0.range || null : p.range, rangeKind = resume ? spec0.rangeKind || null : p.rangeKind;
      if (modulation && host && host.model.sourceList().some((s) => s.kind === 'audio' && s.on !== false))
        throw new Error('Live audio cannot be replayed deterministically. Choose modulation OFF or disable the audio sources.');
      const resumeFrames = resume ? resume.store.manifest.checkpoint?.samples?.length || resume.store.manifest.checkpoint?.frames || 0 : 0;
      if (resumeFrames >= frames) throw new Error('All frames are complete. Recover the finished recording instead.');
      check();
      const snap = runtimeSnapshot();
      if (resume && snap.signature !== spec0.signature) throw new Error('The project’s colours, rack or parameter bases changed. Open the original project to resume, or recover the completed frames.');
      /* the app's motion (ZOOM): prepared before the clock enters, so a refusal costs nothing */
      const motion = motions[motionId] || null;
      const prepared = motion ? await motion.prepare({ width: w, height: h, fps, durationS: fp.durationS, offsetS: fp.offsetS, frames,
        options: resume ? spec0.motionOptions ?? null : opts.motionOptions ?? null, spec: spec0 }) : null;
      check();
      /* the manifest's spec (BASINS' field names, so a job BASINS left on disk resumes here).  A resume keeps its original. */
      const spec = resume ? spec0 : { width: w, height: h, fps, frames, durationS: frames / fps, offsetS: startFrame / fps, rendererVersion: 1, signature: snap.signature,
        frozenValues: snap.values, planDurationS: p.fullDurationS, motion: isTimeline ? 'timeline' : motionId, modulation, timeline: timelineOn, format,
        range: range || undefined, rangeKind: rangeKind || undefined, motionOptions: opts.motionOptions, motionSpec: prepared?.spec, bitrate,
        rack: snap.rack, arrangement: snap.arrangement, app: o.describe ? o.describe() : undefined };
      run.spec = spec;
      for (const type of ['pointerdown', 'click', 'wheel', 'keydown']) if (o.guard !== false && doc) doc.addEventListener(type, guard, { capture: true, passive: false });
      hooked = true;
      if (typeof o.before === 'function') await o.before(spec);
      if (clock) { clock.enter(fps, { modulation, timeline: timelineOn, frozenValues: resume ? localValues(resume.spec.frozenValues || {}) : null }); clockEntered = true; }
      /* the encoder is proven before the run */
      let path = null;
      if (format === 'mp4') {
        path = await decideEncoderPath(w, h, fps, bitrate);
        if (path.kind !== 'webcodecs') throw new Error('Deterministic MP4 is unavailable at this size/FPS. Choose PNG frames or a smaller size.');
        check(); progress('encoder check', 0, frames);
        await verifyEncoder(w, h, fps, path, check);
      }
      const storeOpts = { dir: dirName, storage: o.storage };
      if (resume) { store = resume.store; await store.resume(); files = (await RenderStore.recoveries(storeOpts)).find((j) => j.store.id === store.id)?.files || []; }
      else if (format === 'mp4') {
        store = await RenderStore.create(runId, spec, bitrate / 8 * frames / fps, storeOpts);
        if (!store && bitrate / 8 * frames / fps > MP4_ESTIMATE_MAX) throw new Error('This browser has no temporary file storage. Keep MP4 below 128 MB or use an HTTPS connection with file storage enabled.');
      } else {
        store = await RenderStore.create(runId, spec, w * h * 4 * frames, storeOpts);
        if (!store && w * h * 4 * frames > PNG_MEMORY_MAX) throw new Error('This PNG recording needs temporary file storage. Use HTTPS or shorten the recording.');
      }
      state.path = path || { kind: 'png-zip', why: 'lossless PNG frames' };
      progress('prepare', 0, frames, { width: w, height: h, diskBacked: !!store });
      if (path) sink = new WcSink(w, h, fps, path.codec, { bitrate: path.bitrate, asBlob: true, store, resume: resume?.store.manifest.checkpoint, maxQueueSize: 1,
        maxBytes: store ? Infinity : MP4_ESTIMATE_MAX, colorSpace: o.colorSpace, name: app + '-render.mp4', handler: o.handler });
      canvas = doc.createElement('canvas'); canvas.width = w; canvas.height = h;
      const ctx2d = o.colorSpace === 'display-p3' ? canvas.getContext('2d', { colorSpace: 'display-p3', willReadFrequently: true }) : canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx2d) throw new Error('Could not create a frame canvas');
      const pngSpace = o.colorSpace === 'display-p3' ? 'display-p3' : undefined;
      const readFrame = (src) => {
        if (src && src.rgba) {
          if (src.width !== w || src.height !== h) throw new Error('The frame is ' + src.width + '×' + src.height + ', not ' + w + '×' + h);
          return src.rgba instanceof Uint8ClampedArray ? src.rgba : new Uint8ClampedArray(src.rgba.buffer, src.rgba.byteOffset, src.rgba.length);
        }
        ctx2d.globalCompositeOperation = 'source-over'; ctx2d.fillStyle = '#000'; ctx2d.fillRect(0, 0, w, h);   // an opaque ground: a frame has no alpha
        if (typeof ImageData !== 'undefined' && src instanceof ImageData) ctx2d.putImageData(src, 0, 0); else ctx2d.drawImage(src, 0, 0, w, h);
        return ctx2d.getImageData(0, 0, w, h).data;
      };
      let zip = null, partNo = files.length + 1, partStart = resumeFrames;
      const storePart = async (part, ordinal, firstFrame, lastFrame) => {
        if (!part.entries.length) return;
        part.add('recording.json', new TextEncoder().encode(JSON.stringify({ ...spec, kind: app + '-deterministic-png', firstFrame, lastFrame, framesTotal: frames }, null, 2)));
        const name = app + '-frames-' + runId + '-' + String(ordinal).padStart(3, '0') + '.zip';
        const blob = part.finish();
        if (store) files.push({ ...(await store.savePart(name, blob, lastFrame + 1)), firstFrame, lastFrame });
        else files.push({ name, blob, bytes: blob.size, firstFrame, lastFrame });
      };
      if (!sink) zip = new StoredZip();
      /* the seek: step the clock to the first frame (the rack and the arrangement replay exactly) */
      if (clock) for (let i = 0; i < startFrame + resumeFrames; i++) {
        check(); clock.frame(i);
        if ((i & 127) === 127) { progress('seek', resumeFrames, frames, { seek: i + 1, seekTotal: startFrame + resumeFrames }); await visible(resumeFrames, frames); await yieldTask(); }
      }
      const pad = (n) => String(n).padStart(6, '0');
      for (let i = resumeFrames; i < frames; i++) {
        check(); await visible(i, frames);
        if (clock) clock.frame(startFrame + i);
        const fctx = { i, frame: startFrame + i, beat: host ? host.model.transport.beats : 0, time: (startFrame + i) / fps, fps, width: w, height: h,
          view: prepared?.view ? prepared.view(i) : null, signal: ctl.signal };
        progress('resolve', i, frames);
        const src = await o.frame(i, fctx); check();
        progress('capture', i, frames);
        const rgba = readFrame(src);
        if (sink) {
          await sink.add(rgba, i);
          if (store && (i + 1) % (fps * 2) === 0 && i + 1 < frames) { progress('checkpoint', i + 1, frames); await sink.checkpoint(); }
        } else {
          const bytes = await pngBytes(rgba, w, h, canvas, ctx2d, pngSpace);
          if (zip.bytes && zip.bytes + bytes.length + 1024 > PNG_PART_MAX) { await storePart(zip, partNo++, partStart, i - 1); zip = new StoredZip(); partStart = i; }
          zip.add('frame_' + pad(i) + '.png', bytes);
        }
        progress('capture', i + 1, frames, { elapsedMs: performance.now() - wallStart, renderedFrames: i - resumeFrames + 1,
          queuedBytes: store?.pendingBytes || 0, writtenBytes: store?.bytes || 0 });
      }
      progress('finish', frames, frames);
      if (sink) {
        const out = await sink.finish(); check();
        files.push({ name: store ? out.name : app + '-' + (isTimeline ? 'timeline' : motionId) + '-' + w + 'x' + h + '-' + fps + 'fps.mp4', blob: out.blob, bytes: out.blob.size, firstFrame: 0, lastFrame: frames - 1 });
      } else {
        await storePart(zip, partNo, partStart, frames - 1);
        await store?.finishParts();
      }
      const wallMs = performance.now() - wallStart;
      const result = { files, width: w, height: h, fps, frames, motion: motionId, modulation, timeline: timelineOn, range: range || null, rangeKind, durationS: frames / fps,
        offsetS: startFrame / fps, format, bitrate: sink ? sink.bitrate : null, diskBacked: !!store, wallMs, id: runId };
      if (frames > 1) calib.write({ capMs: Math.round(wallMs / Math.max(1, frames - resumeFrames) * 10) / 10, at: Date.now() });
      state.last = { ...result, files: files.map(({ name, bytes }) => ({ name, bytes })), bytes: files.reduce((n, f) => n + f.bytes, 0) };
      done = true;
      progress('done', frames, frames);
      return result;
    } catch (e) {
      lastErr = e;
      state.lastError = String(e.message || e); state.phase = cancelled ? 'cancelled' : 'error';
      if (cancelled) state.cancelled++; else state.errors++;
      // a committed checkpoint survives failures and may be recovered after reload
      if (store) await store.interrupt().catch(() => {});
      throw e;
    } finally {
      if (hooked && doc) for (const type of ['pointerdown', 'click', 'wheel', 'keydown']) doc.removeEventListener(type, guard, true);
      if (clockEntered) try { clock.exit(); } catch (e) { exitErr = e; }
      if (typeof o.after === 'function') try { await o.after(); } catch (_) { /* the picture's own restore */ }
      if (sink && !done) try { sink.abort(); } catch (_) { /* gone */ }
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      try { releaseWake && releaseWake(); } catch (_) { /* released */ }
      live = null; busy = null; state.running = false; say();
      if (exitErr && !lastErr) throw exitErr;
    }
  }
  const newId = () => 'render-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);

  /** The same run, again, from its checkpoint (BASINS: RESUME WITH MATCHING PROJECT) */
  function recover(job, opts = {}) {
    const spec = job.spec;
    if (spec.rendererVersion !== 1) return Promise.reject(new Error('This checkpoint belongs to a different renderer. Recover its completed frames instead.'));
    return start({ onProgress: opts.onProgress }, { store: job.store, spec }, job.store.id);
  }
  function run(opts = {}) { return start(opts, null, newId()); }

  const rec = {
    run, recover, plan, estimate, encoderPath,
    cancel() { if (live) live.cancel(); },
    running: () => state.running,
    state: () => ({ ...state }),
    subscribe(fn) { watchers.add(fn); return () => watchers.delete(fn); },
    recoveries: () => RenderStore.recoveries({ dir: dirName, storage: o.storage }),
    /** a finished run's temporary files, discarded (BASINS DISCARD RENDER) */
    async discard(result) {
      if (!result) return;
      const job = (await RenderStore.recoveries({ dir: dirName, storage: o.storage })).find((j) => j.store.id === result.id);
      if (job) await job.store.discard();
    },
    /** RUN SELF-TEST at the size and rate of the film as configured (`opts` is a run's options); `stages` adds the app's own */
    async selfTest(opts = {}) {
      let p = null, projection = null;
      try { p = estimate(opts); projection = p.plan.frames.toLocaleString() + ' frames · ' + fmtClock(p.plan.durationS) + ' of video · projected ' + fmtMs(p.est.renderMs) + ' to render' +
        (p.est.bytes ? ' · ≈ ' + fmtBytes(p.est.bytes) + ' held before the file exists' : ' · numbered lossless PNG frames') + p.warning; } catch (_) { /* no plan: the default size is tested */ }
      const res = await renderSelfTest({ width: p?.size.w, height: p?.size.h, fps: p?.plan.fps, frame: o.frame, projection, stages: [...(o.selfTestStages || []), ...(opts.stages || [])],
        dir: dirName, storage: o.storage, wake: o.wake });
      state.selfTest = res; say(); return res;
    },
    selfTestLines: (res) => selfTestLines(res || state.selfTest),
    motions: () => ({ still: { label: 'STILL' }, ...Object.fromEntries(Object.entries(motions).map(([id, m]) => [id, { label: m.label || id.toUpperCase() }])),
      'timeline-active': { label: 'TIMELINE · ACTIVE' }, 'timeline-selection': { label: 'TIMELINE · SELECTION' } }),
    rangeOf, app, hasCurrentSize: () => typeof o.currentSize === 'function', onRange: (fn) => (o.editor?.model?.subscribe ? o.editor.model.subscribe(fn) : () => {}),
    dumpLines() {
      const L = [], s = state;
      L.push('render      ' + (s.running ? 'RUNNING ' + s.phase : s.phase) + ' · runs ' + s.runs + ' · cancelled ' + s.cancelled + ' · errors ' + s.errors + (s.path ? ' · ' + s.path.kind : ''));
      if (s.lastError) L.push('            last error: ' + s.lastError);
      if (s.last) L.push('            last: ' + s.last.width + '×' + s.last.height + ' · ' + s.last.frames + ' frames @ ' + s.last.fps + ' · ' + s.last.format + ' · ' + fmtMs(s.last.wallMs) + ' · ' + fmtBytes(s.last.bytes));
      L.push(...selfTestLines(s.selfTest).slice(0, 1));
      return L;
    },
    destroy() { if (live) live.cancel(); off(); watchers.clear(); },
  };
  const off = registerDumpLines('render:' + app, () => rec.dumpLines());
  return rec;
}
