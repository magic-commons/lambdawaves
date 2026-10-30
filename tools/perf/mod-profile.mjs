/* tools/perf/mod-profile.mjs — 029 M0 THE INSTRUMENT: where the milliseconds of a MODULATED frame go, per frame, on the RTX.
 *
 *   node tools/perf/mod-profile.mjs [--scenes idle,a,b,bh,bf,c,c2,d,e] [--secs 30] [--audio <star.mp3>] [--json out.json] [--no-mo]
 *   node tools/perf/mod-profile.mjs --chromium b|c [--secs 30] [--json out.json]      (ONE headed Chromium on DISPLAY=:0, CDP trace)
 *
 * Nothing under lab/ is touched.  The tool builds a SHADOW ROOT in .tmp/mod-profile/root (every top-level entry of the tree a
 * symlink; lab/ a directory of symlinks whose one copied file is index.html, with one classic <script src="../mp-probe.js"> put
 * first in <head>), serves it with tools/gate/server.py on a free port in 9801–9889 (GD = port − 4000; the pid stopped at the end)
 * and drives headless Firefox through tools/gate/gatekit.mjs at 1920 × 1080.  The probe runs BEFORE the app's modules, so it sees
 * the boot's own timers and observers.  It wraps, and only times:
 *   · requestAnimationFrame — the app's frame loop (rack.js `loop`, known by its body) opens a FRAME; every other callback is summed
 *   · setTimeout / setInterval / requestIdleCallback · ResizeObserver / IntersectionObserver / MutationObserver callbacks ·
 *     every addEventListener listener (a worker's 'message' included) — by name, and into the frame they land in
 *   · __LW.field.frame (the present's CPU encode), the modulation registry's '*' notice (every target write: count, distinct ids,
 *     first write), the clock's onAdvance (the tick's end), the modulation window's own paint meter (window.js performance())
 *   · one MutationObserver of its own on <html> (subtree, attributes, characterData, childList: records per frame, the distinct
 *     routed knobs `[data-param]` whose DOM moved, the region written) — its own callback time is kept apart (`moSelf`)
 *   · long tasks (PerformanceObserver, where the browser has them), the JS heap each second (performance.memory, where present)
 * A FRAME is [one loop entry, the next).  `unattributed` = span − every timed callback − moSelf: the browser's own style, layout,
 * paint, compositing, GC and the microtasks nobody wraps.
 * SCENES (each a fresh page, the demo opened by its DEMOS road __LW.projects.demo, modulation armed, the governor as shipped):
 *   idle  WAVE DANCER, PAUSED, window OPEN, 15 s — does IDLE COST NOTHING?
 *   a     WAVE DANCER, PLAY, window CLOSED                 b  the same, window OPEN
 *   c     b + the AUDIO device LIVE: getUserMedia answered with a MediaStream of media/star.mp3 s 36–66 (the drop), decoded in the
 *         page — the kit's own capture (audio-capture.js: analyser, FFT 2,048, read() per feed) runs unchanged on it
 *   c2    c with the window CLOSED                          d  STAR LOOP (27 timeline lanes, its own layout)
 *   e     the 028 stress: WAVE DANCER + 4 LFOs routed to every non-action target (73 on 028's tree, 54 on 029's) + FEEDBACK ·
 *         REFRACT · FLOW + CURVES (MASTER S), window OPEN
 *   bh    b with the interface HIDDEN (H)                   bf  b with FROST OFF
 * After c, c2 and e, THE PRICE OF ONE WRITE: every routed target written 20× through the registry (paused), median JS ms and JS +
 * a forced layout; and the tick's parts alone (the applyAll walk, one audio feed, the capture's read).  Scene a also reads
 * __LW.gpuFrameMs(120).  Everything lands in --json (default .tmp/mod-profile/firefox.json); one summary line per scene on stdout.
 * Every metric is reported p50 · p95 · p99; frames over 17.5 ms (one vsync + 0.8 ms jitter) and over 34 ms (two).
 * --chromium b|c: /snap/bin/chromium HEADED (--enable-unsafe-webgpu --ignore-gpu-blocklist --enable-features=Vulkan --use-angle=vulkan
 * --ozone-platform=x11), the same probe by Page.addScriptToEvaluateOnNewDocument, the scene, then 30 s of Tracing (devtools.timeline,
 * v8.execute, blink.user_timing, disabled-by-default-devtools.timeline.frame) + a Profiler sample: main-thread self time by category
 * and the top self-time functions.  THE WINDOW APPEARS ON THE SCREEN for the run; the pid is closed at the end.
 * One browser at a time (the GPU is shared); nice -n 10 is the caller's. */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import net from 'node:net';
import { spawn, execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const ROOT = process.cwd(), TMP = path.join(ROOT, '.tmp/mod-profile'), SH = path.join(TMP, 'root');
const SECS = Number(opt('--secs', 30)), CHROM = opt('--chromium', null), MO = !argv.includes('--no-mo');
const SCENES = (opt('--scenes', 'idle,a,b,bh,bf,c,c2,d,e')).split(',');
const AUDIO = opt('--audio', process.env.STAR || path.join(ROOT, 'media/star.mp3'));
const JSON_OUT = opt('--json', path.join(TMP, (CHROM ? 'chromium-' + CHROM : 'firefox') + '.json'));
const W = 1920, H = 1080;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── THE PROBE (page side; a classic script, first in <head>) ───────────────────────────────────────────────────────────── */
const PROBE = String.raw`(() => {
  if (window.__MP) return;
  const now = () => performance.now(), MO0 = window.MutationObserver, PO0 = window.PerformanceObserver;
  const R = { on: false, frames: [], cur: null, by: { raf: {}, timer: {}, obs: {}, ev: {} }, long: [], heap: [], pres: [], regions: {}, reasons: {} };
  const key = new WeakMap(), src = (fn) => { let k = key.get(fn); if (!k) { k = fn.name || String(fn).replace(/\s+/g, ' ').slice(0, 72); key.set(fn, k); } return k; };
  const add = (b, name, d) => { if (!R.on) return; if (R.cur) R.cur[b] += d; const e = R.by[b][name] || (R.by[b][name] = [0, 0]); e[0] += d; e[1]++; };
  let ids = new Set(), knobs = new Set(), lastWin = null, lastHeap = 0, V = null, F = null;
  const blank = (ts, t0) => ({ ts, t0, span: 0, loop: 0, raf: 0, timer: 0, obs: 0, ev: 0, mut: 0, moSelf: 0, knobs: 0, writes: 0, ids: 0, w0: -1, adv: -1, ticks: 0, field: 0, pres: 0, win: 0, inflight: -1, fft: 0 });
  function frameEdge(ts) {
    if (!R.on) return;
    const t0 = now(), c = R.cur;
    if (c) {
      c.span = t0 - c.t0; c.ids = ids.size; c.knobs = knobs.size; ids.clear(); knobs.clear();
      if (V && V.performance) { const p = V.performance().ms; if (lastWin !== null) c.win = p - lastWin; lastWin = p; }
      R.frames.push(c);
    }
    R.cur = blank(ts, t0); if (F) R.cur.inflight = F.inFlight;
    if (performance.memory && t0 - lastHeap >= 1000) { lastHeap = t0; R.heap.push([t0, performance.memory.usedJSHeapSize]); }
  }
  const isLoop = new WeakMap(), loopy = (cb) => { let v = isLoop.get(cb); if (v === undefined) { v = cb.name === 'loop' && String(cb).includes('tLoop0'); isLoop.set(cb, v); } return v; };
  const raf0 = window.requestAnimationFrame;
  window.requestAnimationFrame = function (cb) {
    if (typeof cb !== 'function') return raf0.call(window, cb);
    return raf0.call(window, function (ts) {
      if (loopy(cb)) { frameEdge(ts); const a = now(); try { return cb(ts); } finally { if (R.on && R.cur) R.cur.loop = now() - a; } }
      const a = now(); try { return cb(ts); } finally { add('raf', src(cb), now() - a); }
    });
  };
  const wrapT = (orig, tag) => function (fn, ms, ...rest) {
    if (typeof fn !== 'function') return orig.call(window, fn, ms, ...rest);
    return orig.call(window, function (...a) { const t = now(); try { return fn.apply(this, a); } finally { add('timer', tag + src(fn), now() - t); } }, ms, ...rest);
  };
  window.setTimeout = wrapT(window.setTimeout, 'T:'); window.setInterval = wrapT(window.setInterval, 'I:');
  if (window.requestIdleCallback) { const ric = window.requestIdleCallback; window.requestIdleCallback = function (fn, o) { return ric.call(window, function (d) { const t = now(); try { return fn(d); } finally { add('timer', 'idle:' + src(fn), now() - t); } }, o); }; }
  for (const K of ['ResizeObserver', 'IntersectionObserver', 'MutationObserver']) {
    const C = window[K]; if (!C) continue;
    window[K] = class extends C { constructor(cb, o) { super(function (...a) { const t = now(); try { return cb.apply(this, a); } finally { add('obs', K + ':' + src(cb), now() - t); } }, o); } };
  }
  if (window.AnalyserNode) for (const m of ['getFloatFrequencyData', 'getFloatTimeDomainData']) { const f = AnalyserNode.prototype[m];   // the capture's two native reads (inside the loop: a sub-bucket)
    AnalyserNode.prototype[m] = function (a) { const t = now(); try { return f.call(this, a); } finally { if (R.on && R.cur) R.cur.fft += now() - t; } }; }
  const AEL = EventTarget.prototype.addEventListener, REL = EventTarget.prototype.removeEventListener, WR = new WeakMap();
  EventTarget.prototype.addEventListener = function (type, fn, o) {
    if (typeof fn !== 'function') return AEL.call(this, type, fn, o);
    let w = WR.get(fn); if (!w) { w = function (e) { const t = now(); try { return fn.call(this, e); } finally { add('ev', e.type + ':' + src(fn), now() - t); } }; WR.set(fn, w); }
    return AEL.call(this, type, w, o);
  };
  EventTarget.prototype.removeEventListener = function (type, fn, o) { return REL.call(this, type, (fn && WR.get(fn)) || fn, o); };
  const region = (el) => { const d = el.closest('.dev'); if (d) return 'dev:' + (d.dataset.id || d.id || '?'); if (el.closest('[class^="m2"],[class*=" m2"]')) return 'modwin';
    const f = el.closest('[id]'); return f ? '#' + f.id : el.tagName; };
  let mo = null, unsub = null, offAdv = null, f0 = null, po = null;
  window.__MP = {
    start() {
      R.frames = []; R.long = []; R.heap = []; R.pres = []; R.regions = {}; R.reasons = {}; for (const b in R.by) R.by[b] = {};
      R.cur = null; lastWin = null; ids.clear(); knobs.clear();
      V = __LW.mod && __LW.mod.view; F = __LW.field;
      const Hh = __LW.mod && __LW.mod.host;
      if (Hh) {
        unsub = Hh.registry.subscribe('*', (ev) => { const c = R.cur; if (!c || !R.on) return; if (c.w0 < 0) c.w0 = now() - c.t0; c.writes++; ids.add(ev.id); R.reasons[ev.reason] = (R.reasons[ev.reason] || 0) + 1; });
        offAdv = Hh.clock.onAdvance((kind) => { const c = R.cur; if (c && R.on) { c.adv = now() - c.t0; c.ticks++; } });
      }
      if (F && F.frame) { f0 = F.frame; F.frame = function (a) { const t = now(); try { return f0.call(this, a); } finally { const c = R.cur; if (R.on) { R.pres.push(t); if (c) { c.field += now() - t; c.pres++; } } } }; }
      if (window.__MP_MO !== false) {
        mo = new MO0((recs) => { const t = now(), c = R.cur; if (!c || !R.on) return; c.mut += recs.length;
          for (const r of recs) { const el = r.target.nodeType === 1 ? r.target : r.target.parentElement; if (!el || !el.closest) continue;
            const k = el.closest('[data-param]'); if (k) knobs.add(k.dataset.param); const g = region(el); R.regions[g] = (R.regions[g] || 0) + 1; }
          c.moSelf += now() - t; });
        mo.observe(document.documentElement, { subtree: true, attributes: true, characterData: true, childList: true });
      }
      try { po = new PO0((l) => { for (const e of l.getEntries()) R.long.push([e.startTime, e.duration]); }); po.observe({ type: 'longtask' }); R.longOk = true; } catch (_) { R.longOk = false; }
      R.on = true; R.t0 = now(); return true;
    },
    stop() {
      R.on = false; R.t1 = now();
      if (unsub) unsub(); if (offAdv) offAdv(); if (f0) { F.frame = f0; f0 = null; } if (mo) mo.disconnect(); if (po) po.disconnect(); unsub = offAdv = mo = po = null;
      const K = ['ts', 'span', 'loop', 'raf', 'timer', 'obs', 'ev', 'mut', 'moSelf', 'knobs', 'writes', 'ids', 'w0', 'adv', 'ticks', 'field', 'pres', 'win', 'inflight', 'fft'];
      return { secs: (R.t1 - R.t0) / 1000, keys: K, frames: R.frames.map((f) => K.map((k) => +(+f[k]).toFixed(3))), by: R.by, long: R.long, longOk: R.longOk, heap: R.heap,
        pres: R.pres.map((t) => +t.toFixed(3)), regions: R.regions, reasons: R.reasons };
    },
  };
})();`;

/* ── THE SCENES (the page side, as __LW calls) ───────────────────────────────────────────────────────────────────────────── */
const SCENE = {
  idle: { demo: 'wave-dancer', win: true, play: false, secs: 15 },
  a: { demo: 'wave-dancer', win: false }, b: { demo: 'wave-dancer', win: true },
  c: { demo: 'wave-dancer', win: true, audio: true }, c2: { demo: 'wave-dancer', win: false, audio: true },
  d: { demo: 'star-loop', win: null }, e: { demo: 'wave-dancer', win: true, stress: true },
  bh: { demo: 'wave-dancer', win: true, setup: 'if (!__LW.uiHidden) __LW.keys.toggleUI();' },   // b with the interface HIDDEN (H): the modulation without the glass
  bf: { demo: 'wave-dancer', win: true, setup: "__LW.setFrost('off');" },                          // b with FROST OFF: the blur's share
};
const PREP = (s) => `window.confirm = () => true; window.__w = (n) => new Promise((r) => setTimeout(r, n));
  try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
  const P = __LW.projects; try { P.folders.close(); } catch (_) {} await __w(300);
  await P.demo(${JSON.stringify(s.demo)}); await __w(1500); await __LW.settle();
  __LW.pause(); __LW.mod.arm(true); ${s.win === true ? '__LW.mod.expand();' : s.win === false ? '__LW.mod.collapse();' : ''} await __w(800);
  return { current: P.status, armed: __LW.mod.armed, open: __LW.mod.expanded, routes: __LW.mod.model.routeList().length, sources: __LW.mod.model.sourceList().map((q) => [q.id, q.kind, q.on]),
    targets: __LW.mod.model.routeList().map((r) => [r.macroId, r.targetId, __LW.mod.registry.has(r.targetId)]), running: __LW.mod.running,
    tl: (() => { try { const t = typeof __LW.timeline === 'function' ? __LW.timeline() : __LW.timeline; return !!(t && (typeof t.isOpen === 'function' ? t.isOpen() : t.isOpen)); } catch (_) { return null; } })(),
    cards: document.querySelectorAll('.dev:not(.closed)').length, frost: __LW.frostLive, card: __LW.cardStyle, errs: (window.__e || []).slice(0, 5) };`;
const FAKE_MIC = `window.__fakeMic = null;
  navigator.mediaDevices.getUserMedia = async () => {
    const ac = new AudioContext(); try { await ac.resume(); } catch (_) {}
    const buf = await ac.decodeAudioData(await (await fetch('/star-drop.wav')).arrayBuffer());
    const dst = ac.createMediaStreamDestination();
    const M = { ac, buf, dst, src: null, restart() { if (this.src) { try { this.src.stop(); } catch (_) {} } const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(dst); s.start(); this.src = s; this.at = performance.now(); } };
    M.restart(); window.__fakeMic = M; return dst.stream;
  }; return 1;`;
const STRESS = `const L = __LW.mod, M = L.model, T = L.targets();
  const list = (Array.isArray(T) ? T : Object.values(T)).filter((d) => d && d.id && !/^action\\./.test(d.id) && d.map !== 'trigger' && d.map !== 'toggle');
  const macs = []; for (let i = 0; i < 4; i++) { const s = L.addSource('lfo'); const m = L.addMacro(); L.bind(m, s); macs.push(m); }
  let n = 0; for (const d of list) { if (L.route(macs[n % 4], d.id, 0, 0.35)) n++; }
  __LW.nodes.setHas(true); __LW.curves.preset('MASTER', 'S'); for (const t of ['feedback', 'refract', 'flow']) __LW.nodes.add(t);
  await __w(600); await __LW.settle();
  return { targets: list.length, routed: n, routes: M.routeList().length, nodes: __LW.nodes.nodes().map((q) => q.type), errs: (window.__e || []).slice(0, 5) };`;
/* THE PRICE OF ONE WRITE, per routed target (paused, after the scene): 20 forced writes alternating ±0.05 around the base through the
   registry's own door (applyModulatedNorm → publish → the adapter's set → setKnob / the app's setter), the median JS ms, then the same
   with a forced style + layout read after each (document.body.offsetHeight) — what that write leaves the browser to recompute */
const WCOST = `const H = __LW.mod.host, R = H.registry, out = [];
  const ids = [...new Set(__LW.mod.model.routeList().map((r) => r.targetId))].filter((id) => R.has(id));
  const med = (a) => { a.sort((x, y) => x - y); return +a[a.length >> 1].toFixed(3); };
  for (const id of ids) {
    const b = R.state(id).baseNorm, u = [Math.min(1, b + 0.05), Math.max(0, b - 0.05)], js = [], lay = [];
    for (let i = 0; i < 20; i++) { const a = performance.now(); R.applyModulatedNorm(id, u[i & 1], true); js.push(performance.now() - a); }
    for (let i = 0; i < 20; i++) { const a = performance.now(); R.applyModulatedNorm(id, u[i & 1], true); void document.body.offsetHeight; lay.push(performance.now() - a); }
    R.restoreBase(id, true); out.push([id, med(js), med(lay)]);
    await new Promise((r) => requestAnimationFrame(() => r()));
  }
  /* and the tick's other parts, alone: the applyAll walk over every registered target (paused: nothing written), one model feed of
     a microphone packet, and the capture's read (the two native reads + its 1,024-bin loop, copied) on an analyser of the same stream */
  const T = (f, n = 50) => { const a = []; for (let i = 0; i < n; i++) { const t = performance.now(); f(i); a.push(performance.now() - t); } return med(a); };
  const M = __LW.mod.model, aud = M.sourceList().find((q) => q.kind === 'audio'), micro = { targets: R.list().length, walk: T(() => H.clock.applyAll(false)) };
  if (aud && M.modFeedAudio) micro.feed = T((i) => M.modFeedAudio(aud.id, { feedHz: 60, capturedAt: performance.now() / 1000, now: performance.now() / 1000, sampleRate: 48000,
    inputLatencyMs: null, analysisLatencyMs: 21, visualLatencyMs: 8, latencyMs: 29, latencyEstimated: true, rms: 0.1 + 0.05 * (i & 1), bandPower: [1e-3, 1e-4, 1e-5], flux: 2 + (i & 3) }));
  if (window.__fakeMic) { const F = __fakeMic, an = F.ac.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0; F.src.connect(an);
    const fd = new Float32Array(an.frequencyBinCount), td = new Float32Array(2048), prev = new Float32Array(an.frequencyBinCount);
    micro.read = T(() => { an.getFloatTimeDomainData(td); an.getFloatFrequencyData(fd); let s = 0; for (let i = 0; i < td.length; i++) s += td[i] * td[i];
      let fl = 0; const p = [0, 0, 0]; for (let i = 0; i < fd.length; i++) { const db = fd[i], m = db > -160 && Number.isFinite(db) ? Math.pow(10, db / 20) : 0; const d = m - prev[i]; if (d > 0) fl += d; prev[i] = m; p[i % 3] += m * m; } return s + fl; }); }
  return { writes: out.sort((x, y) => y[2] - x[2]), micro };`;
const ENV = `return { inner: [innerWidth, innerHeight], canvas: (() => { const c = document.getElementById('field') || document.querySelector('canvas'); return c ? [c.width, c.height] : null; })(),
  adapter: __LW.field.adapterInfo, fieldOk: __LW.field.ok, res: __LW.field.resolution, lock: __LW.fieldRate.lock, cadence: __LW.mod.cadence,
  governor: __LW.governor.state, autoScale: __LW.quality.autoScale, auto: __LW.quality.auto, scale: __LW.quality.scale, presents: __LW.stats.presents, skipped: __LW.stats.skipped,
  build: __LW.build, modPaint: __LW.mod.view && __LW.mod.view.performance ? __LW.mod.view.performance() : null, errs: (window.__e || []).slice(0, 8) };`;

/* ── THE NUMBERS ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
const pct = (a, p) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))].toFixed(2); };
const trio = (a) => ({ p50: pct(a, 0.5), p95: pct(a, 0.95), p99: pct(a, 0.99), max: a.length ? +a.reduce((m, v) => Math.max(m, v), -Infinity).toFixed(2) : null, mean: a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3) : null });
function summarise(r) {
  const K = r.keys, col = (k) => r.frames.map((f) => f[K.indexOf(k)]);
  const F = r.frames.slice(1);   // the first frame's span opens before the window
  const g = (k) => F.map((f) => f[K.indexOf(k)]);
  const ts = col('ts'), gap = ts.slice(1).map((t, i) => t - ts[i]);
  const piv = r.pres.slice(1).map((t, i) => t - r.pres[i]);
  const js = F.map((f) => ['loop', 'raf', 'timer', 'obs', 'ev'].reduce((s, k) => s + f[K.indexOf(k)], 0));
  const un = F.map((f, i) => f[K.indexOf('span')] - js[i] - f[K.indexOf('moSelf')]);
  const pre = F.map((f) => { const w0 = f[K.indexOf('w0')], adv = f[K.indexOf('adv')]; return w0 >= 0 ? w0 : adv >= 0 ? adv : null; }).filter((v) => v !== null);
  const apply = F.map((f) => { const w0 = f[K.indexOf('w0')], adv = f[K.indexOf('adv')]; return w0 >= 0 && adv >= 0 ? adv - w0 : null; }).filter((v) => v !== null);
  const ticked = F.filter((f) => f[K.indexOf('ticks')] > 0), tk = (k) => ticked.map((f) => f[K.indexOf(k)]);
  const top = (m, n = 8) => Object.entries(m).map(([k, [ms, c]]) => ({ k, msPerSec: +(ms / r.secs).toFixed(3), calls: c })).sort((x, y) => y.msPerSec - x.msPerSec).slice(0, n);
  const heap = r.heap.length > 1 ? { mb0: +(r.heap[0][1] / 1048576).toFixed(1), mb1: +(r.heap[r.heap.length - 1][1] / 1048576).toFixed(1), max: +(Math.max(...r.heap.map((h) => h[1])) / 1048576).toFixed(1) } : null;
  return {
    secs: +r.secs.toFixed(1), loopFrames: r.frames.length, presents: r.pres.length, fps: +(r.pres.length / r.secs).toFixed(1),
    present: { ...trio(piv), over17: piv.filter((v) => v > 17.5).length, over33: piv.filter((v) => v > 34).length },
    rafGap: { ...trio(gap), over17: gap.filter((v) => v > 17.5).length, over33: gap.filter((v) => v > 34).length },
    loopMs: trio(g('loop')), jsMs: trio(js), unattributedMs: trio(un), fieldMs: trio(g('field').filter((v, i) => F[i][K.indexOf('pres')] > 0)),
    tick: { frames: ticked.length, tickMs: trio(tk('adv')), preMs: trio(pre), applyMs: trio(apply), writes: trio(tk('writes')), ids: trio(tk('ids')), fftMs: trio(tk('fft')),
      loopTicked: trio(tk('loop')), loopUnticked: trio(F.filter((f) => f[K.indexOf('ticks')] === 0).map((f) => f[K.indexOf('loop')])) },
    winPaintMs: trio(g('win')), rafOtherMs: trio(g('raf')), timerMs: trio(g('timer')), obsMs: trio(g('obs')), evMs: trio(g('ev')),
    mutations: trio(g('mut')), knobsDom: trio(g('knobs')), moSelfMs: trio(g('moSelf')), inflight: trio(g('inflight').filter((v) => v >= 0)),
    perSec: { loop: +(g('loop').reduce((a, b) => a + b, 0) / r.secs).toFixed(1), js: +(js.reduce((a, b) => a + b, 0) / r.secs).toFixed(1), win: +(g('win').reduce((a, b) => a + b, 0) / r.secs).toFixed(1),
      field: +(g('field').reduce((a, b) => a + b, 0) / r.secs).toFixed(1), mutations: Math.round(g('mut').reduce((a, b) => a + b, 0) / r.secs), writes: Math.round(g('writes').reduce((a, b) => a + b, 0) / r.secs) },
    long: { supported: r.longOk, n: r.long.length, maxMs: r.long.length ? +Math.max(...r.long.map((l) => l[1])).toFixed(1) : 0 },
    heap, top: { raf: top(r.by.raf), timer: top(r.by.timer), obs: top(r.by.obs), ev: top(r.by.ev) },
    regions: Object.entries(r.regions).sort((x, y) => y[1] - x[1]).slice(0, 10).map(([k, v]) => [k, Math.round(v / r.secs)]), reasons: r.reasons,
  };
}

/* ── THE SHADOW ROOT + THE SERVER ────────────────────────────────────────────────────────────────────────────────────────── */
const free = (p) => new Promise((res) => { const s = net.createServer(); s.once('error', () => res(false)); s.listen(p, '127.0.0.1', () => s.close(() => res(true))); });
const FORBID = new Set([8721, 8731, 8735, 8741, 9241, 9261, 9491, 8790, 9651, 5651, 9695, 8799, 9443, 9671, 5681]);
async function pickPort() { for (let p = 9801; p <= 9889; p++) if (!FORBID.has(p) && !FORBID.has(p - 4000) && await free(p) && await free(p - 4000)) return p; throw new Error('no free port pair in 9801–9889'); }
function shadow() {
  fs.rmSync(SH, { recursive: true, force: true }); fs.mkdirSync(path.join(SH, 'lab'), { recursive: true });
  for (const e of fs.readdirSync(ROOT)) if (!e.startsWith('.') && e !== 'lab') fs.symlinkSync(path.join(ROOT, e), path.join(SH, e));
  for (const e of fs.readdirSync(path.join(ROOT, 'lab'))) if (e !== 'index.html') fs.symlinkSync(path.join(ROOT, 'lab', e), path.join(SH, 'lab', e));
  const html = fs.readFileSync(path.join(ROOT, 'lab/index.html'), 'utf8');
  if (!/<head>/.test(html)) throw new Error('lab/index.html has no <head>');
  fs.writeFileSync(path.join(SH, 'lab/index.html'), html.replace('<head>', '<head>\n<script src="../mp-probe.js"></script>'));
  fs.writeFileSync(path.join(SH, 'mp-probe.js'), PROBE);
  if (fs.existsSync(AUDIO)) execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '36', '-t', '30', '-i', AUDIO, '-ac', '2', '-ar', '48000', path.join(SH, 'star-drop.wav')]);   // a decoded COPY of the drop; the mp3 is only read
  else console.log('NO AUDIO at ' + AUDIO + ' — scenes c/c2 will report the capture refused');
}
async function serve(dir) {
  const port = await pickPort();
  const p = spawn('python3', [path.join(ROOT, 'tools/gate/server.py'), dir, String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  for (let i = 0; i < 50; i++) { await sleep(200); if (!(await free(port))) break; }
  console.log(`gate server pid ${p.pid} on ${port} (GD ${port - 4000}) → ${dir}`);
  return { port, stop: () => { try { process.kill(p.pid, 'SIGTERM'); } catch (_) {} } };
}

/* ── FIREFOX ─────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
async function firefox(srv) {
  process.env.GD_PORT = String(srv.port - 4000);
  const { open } = await import('../gate/gatekit.mjs');
  const url = `https://127.0.0.1:${srv.port}/lab/?sw=0&warn=0`;
  const out = { at: new Date().toISOString(), browser: 'firefox-headless', viewport: [W, H], secs: SECS, mo: MO, scenes: {} };
  /* ONE BROWSER PER SCENE: a second navigation of the same page in one headless Firefox here leaves the new page with NO animation
     frames at all (measured 2026-10-30: 0 rAF in 3 s, "Render did not settle"), so every scene opens and closes its own */
  for (const name of SCENES) {
    const s = SCENE[name]; if (!s) { console.log('no scene ' + name); continue; }
    const g = await open(url, { width: W, height: H, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false, 'media.autoplay.default': 0,
      'media.autoplay.block-webaudio': false, 'media.autoplay.blocking_policy': 0, 'media.navigator.permission.disabled': true } });
    try {
      const rd = await g.waitFor('window.__LW && __LW.ready && window.__MP', 900, 100);
      if (!rd.ok) { out.scenes[name] = { error: 'not ready' }; continue; }
      const res = { scene: name, spec: s };
      res.prep = await g.ev(PREP(s)); if (!MO) await g.ev('window.__MP_MO = false; return 1;');
      if (s.stress) res.stress = await g.ev(STRESS);
      if (s.setup) res.setup = await g.ev(s.setup + ' await __w(600); return { uiHidden: __LW.uiHidden, frost: __LW.frostLive };');
      if (s.audio) {
        await g.ev(FAKE_MIC);
        if (!s.win) await g.ev('__LW.mod.expand(); await __w(600); return 1;');
        await g.ev(`const b = [...document.querySelectorAll('.m2audsrc')].find((x) => x.offsetParent); if (b) b.scrollIntoView({ block: 'center' }); await __w(300); return !!b;`);
        const t = await g.tap('.m2audsrc');   // a real pointer first; covered (the notebook can lie over the window) → the element's own click
        if (!t || !t.ok) await g.ev(`const b = [...document.querySelectorAll('.m2audsrc')].find((x) => x.offsetParent); if (b) b.click(); return !!b;`);
        await g.ev(`for (let i = 0; i < 60 && !(window.__fakeMic && __LW.mod.view && document.querySelector('.m2audsrc.on')); i++) await __w(100); return 1;`);
        res.audio = await g.ev(`return { tap: ${JSON.stringify(t)}, fake: !!window.__fakeMic, ctx: window.__fakeMic ? window.__fakeMic.ac.state : null, live: !!document.querySelector('.m2audsrc.on'), errs: (window.__e || []).slice(0, 5) };`);
        if (!s.win) await g.ev('__LW.mod.collapse(); await __w(600); return 1;');
      }
      await g.ev('__LW.pause(); await __LW.settle(); await __w(1000); return 1;');
      const secs = s.secs || SECS;
      res.raw = await g.ev(`__MP.start(); ${s.audio ? 'if (window.__fakeMic) __fakeMic.restart();' : ''} ${s.play === false ? '' : '__LW.play();'}
        await __w(${secs * 1000}); const r = __MP.stop(); ${s.play === false ? '' : '__LW.pause();'} return r;`);
      res.env = await g.ev(ENV);
      if (name === 'a') res.gpu = await g.ev('await __LW.settle(); const r = await __LW.gpuFrameMs(120); return r;');
      if (s.audio || s.stress) res.wcost = await g.ev(WCOST);
      res.sum = res.raw && res.raw.frames ? summarise(res.raw) : { error: res.raw };
      if (res.raw) delete res.raw.frames;
      out.scenes[name] = res;
      const m = res.sum;
      console.log(`${name}: fps ${m.fps} · present p50/p95/p99 ${m.present?.p50}/${m.present?.p95}/${m.present?.p99} ms · >17.5 ${m.present?.over17} >34 ${m.present?.over33} · loop p95 ${m.loopMs?.p95} · js p95 ${m.jsMs?.p95} · tick pre/apply p95 ${m.tick?.preMs.p95}/${m.tick?.applyMs.p95} · writes p50 ${m.tick?.writes.p50} · win p95 ${m.winPaintMs?.p95} · mut p50 ${m.mutations?.p50}`);
      fs.mkdirSync(TMP, { recursive: true }); fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
    } finally { await g.close(); }
  }
  return out;
}

/* ── HEADED CHROMIUM (one run, CDP trace + profile) ──────────────────────────────────────────────────────────────────────── */
const MAIN_SELF = (events) => {
  /* main-thread SELF time by category: the renderer main thread's complete events, nested by a stack, each one's self time to the
     category of its name (DevTools' own split, coarsened) */
  const meta = events.filter((e) => e.ph === 'M' && e.name === 'thread_name');
  const main = meta.find((e) => e.args && e.args.name === 'CrRendererMain' && events.some((x) => x.pid === e.pid && x.tid === e.tid && x.name === 'FireAnimationFrame'));
  if (!main) return { error: 'no CrRendererMain with frames' };
  const ev = events.filter((e) => e.pid === main.pid && e.tid === main.tid && e.ph === 'X' && e.dur > 0).sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const CAT = (n) => /GC|Sweep|Mark|Scavenge|Finaliz/i.test(n) ? 'gc'
    : /UpdateLayoutTree|RecalculateStyles|Layout|UpdateLayerTree|PrePaint|IntersectionObserver|HitTest|ScheduleStyleRecalculation|InvalidateLayout/.test(n) ? 'style/layout'
    : /Paint|Composite|Layerize|Commit|Raster|Decode|Draw/.test(n) ? 'paint/composite'
    : /GPU|WebGPU|Dawn|Canvas|SwapBuffers|GpuTask/i.test(n) ? 'gpu'
    : /FunctionCall|EvaluateScript|v8|V8|TimerFire|FireAnimationFrame|EventDispatch|RunMicrotasks|ParseHTML|Compile|XHR|ResourceReceive|Profile|MajorGC|MinorGC|JS|Script|callback|Task/.test(n) ? 'scripting' : 'other';
  const self = {}, byName = {}, stack = [];
  const push = (e) => { self[e.__c] = (self[e.__c] || 0) + e.__self; byName[e.name] = (byName[e.name] || 0) + e.__self; };
  for (const e of ev) {
    e.__c = CAT(e.name); e.__self = e.dur;
    while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) push(stack.pop());
    if (stack.length) stack[stack.length - 1].__self -= Math.min(e.dur, stack[stack.length - 1].ts + stack[stack.length - 1].dur - e.ts);
    stack.push(e);
  }
  while (stack.length) push(stack.pop());
  const t0 = ev.length ? ev[0].ts : 0, t1 = ev.reduce((m, e) => Math.max(m, e.ts + e.dur), 0), wall = (t1 - t0) / 1000;
  const frames = events.filter((e) => e.name === 'DrawFrame').length, dropped = events.filter((e) => e.name === 'DroppedFrame').length;
  const busy = Object.values(self).reduce((a, b) => a + b, 0) / 1000;
  return { wallMs: +wall.toFixed(0), busyMs: +busy.toFixed(0), idleMs: +(wall - busy).toFixed(0), drawFrames: frames, droppedFrames: dropped,
    byCategoryMs: Object.fromEntries(Object.entries(self).map(([k, v]) => [k, +(v / 1000).toFixed(1)]).sort((a, b) => b[1] - a[1])),
    topEvents: Object.entries(byName).map(([k, v]) => [k, +(v / 1000).toFixed(1)]).sort((a, b) => b[1] - a[1]).slice(0, 14),
    threads: (() => { const T = {}; const name = new Map(meta.map((m) => [m.pid + ':' + m.tid, m.args && m.args.name]));
      for (const e of events) { if (e.ph !== 'X' || !(e.dur > 0)) continue; const k = e.pid + ':' + e.tid; (T[k] || (T[k] = [])).push(e); }
      return Object.entries(T).map(([k, list]) => { list.sort((a, b) => a.ts - b.ts); let end = -1, busy = 0;
        for (const e of list) { const a = Math.max(e.ts, end), b = e.ts + e.dur; if (b > a) busy += b - a; end = Math.max(end, b); }
        return [(name.get(k) || '?') + ' ' + k, +(busy / 1000).toFixed(0)]; }).sort((a, b) => b[1] - a[1]).slice(0, 12); })(),
    gpuProcess: (() => { const gm = meta.find((e) => e.args && /CrGpuMain/.test(e.args.name)); if (!gm) return null;
      const g = events.filter((e) => e.pid === gm.pid && e.tid === gm.tid && e.ph === 'X'); return { events: g.length, topLevelMs: +(g.reduce((a, e) => a + (e.dur || 0), 0) / 1000).toFixed(0) }; })() };
};
function profileTop(p, n = 12) {
  const self = new Map(), byId = new Map(p.nodes.map((q) => [q.id, q]));
  for (let i = 0; i < p.samples.length; i++) self.set(p.samples[i], (self.get(p.samples[i]) || 0) + (p.timeDeltas[i] || 0));
  const agg = {};
  for (const [id, us] of self) { const q = byId.get(id); const cf = q.callFrame; const k = (cf.functionName || '(anon)') + ' ' + (cf.url ? cf.url.replace(/^.*\/lab\//, 'lab/') + ':' + (cf.lineNumber + 1) : ''); agg[k] = (agg[k] || 0) + us; }
  const tot = Object.values(agg).reduce((a, b) => a + b, 0);
  return { totalMs: +(tot / 1000).toFixed(0), top: Object.entries(agg).filter(([k]) => !/^\((idle|program|garbage collector)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, +(v / 1000).toFixed(1)]),
    special: Object.fromEntries(Object.entries(agg).filter(([k]) => /^\((idle|program|garbage collector)\)/.test(k)).map(([k, v]) => [k.trim(), +(v / 1000).toFixed(0)])) };
}
async function chromium(srv) {
  const s = SCENE[CHROM]; if (!s) throw new Error('--chromium takes a scene name');
  if (!process.env.DISPLAY) process.env.DISPLAY = ':0';
  let cport = 9300; for (let p = 9301; p < 9399; p++) if (await free(p)) { cport = p; break; }
  const base = path.join(os.homedir(), 'snap/chromium/common'); fs.mkdirSync(base, { recursive: true });
  const prof = fs.mkdtempSync(path.join(base, 'lw-m0-'));
  console.log(`>>> A HEADED CHROMIUM WINDOW WILL APPEAR ON DISPLAY ${process.env.DISPLAY} FOR ABOUT ${SECS + 40} s (029 M0, scene ${CHROM}); it is closed by pid at the end.`);
  const proc = spawn('/snap/bin/chromium', ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--enable-features=Vulkan', '--use-angle=vulkan', '--ozone-platform=x11',
    '--no-first-run', '--no-default-browser-check', '--ignore-certificate-errors', '--autoplay-policy=no-user-gesture-required', '--enable-precise-memory-info',
    `--remote-debugging-port=${cport}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`, '--window-position=0,0', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let errText = ''; proc.stderr.on('data', (d) => { errText += d; if (errText.length > 20000) errText = errText.slice(-20000); });
  const out = { at: new Date().toISOString(), browser: 'chromium-headed', scene: CHROM, secs: SECS, pid: proc.pid };
  try {
    let ver = null; for (let i = 0; i < 80 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${cport}/json/version`)).json(); } catch { await sleep(250); } }
    if (!ver) throw new Error('chromium did not open its DevTools port (display access?): ' + errText.slice(-600));
    const tgt = (await (await fetch(`http://127.0.0.1:${cport}/json/list`)).json()).find((t) => t.type === 'page');
    const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const pend = new Map(), trace = []; let traceDone = null;
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); return; }
      if (d.method === 'Tracing.dataCollected') for (const e of d.params.value) trace.push(e); else if (d.method === 'Tracing.tracingComplete' && traceDone) traceDone(); };
    const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (body) => { const r = await send('Runtime.evaluate', { expression: `(async () => { ${body} })()`, awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) return { E: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text }; return r.result ? r.result.result.value : r.error; };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
    const url = `https://127.0.0.1:${srv.port}/lab/?sw=0&warn=0&starter=home`;
    const ready = async () => { for (let i = 0; i < 900; i++) { const v = await ev('try { if (window.__LW && __LW.warning && __LW.warning.open) __LW.warning.dismiss(); } catch (_) {} return !!(window.__LW && __LW.ready);').catch(() => false); if (v === true) return true; await sleep(100); } return false; };
    for (const pass of [0, 1]) { await send('Page.navigate', { url }); await sleep(1500); out['ready' + pass] = await ready(); }   // main-thread.mjs' warm-up: a fresh browser loses its first device
    out.prep = await ev(PREP(s));
    if (s.setup) out.setup = await ev(s.setup + ' await __w(600); return { uiHidden: __LW.uiHidden, frost: __LW.frostLive };');
    if (s.audio) {
      await ev(FAKE_MIC);
      out.audio = await ev(`const b = [...document.querySelectorAll('.m2audsrc')].find((x) => x.offsetParent); if (!b) return { found: false }; b.scrollIntoView({ block: 'center' }); await __w(300); b.click();
        for (let i = 0; i < 60 && !document.querySelector('.m2audsrc.on'); i++) await __w(100); return { found: true, live: !!document.querySelector('.m2audsrc.on'), ctx: window.__fakeMic ? __fakeMic.ac.state : null };`);
    }
    await ev('__LW.pause(); await __LW.settle(); await __w(1000); return 1;');
    out.envBefore = await ev(ENV);
    await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 200 });
    await ev(`__MP.start(); ${s.audio ? 'if (window.__fakeMic) __fakeMic.restart();' : ''} __LW.play(); return 1;`);
    await sleep(1500);                                                   // the play's own edge out of the record
    await send('Tracing.start', { categories: 'devtools.timeline,v8.execute,blink.user_timing,disabled-by-default-devtools.timeline.frame,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
    await send('Profiler.start');
    await sleep(SECS * 1000);
    const prof0 = await send('Profiler.stop');
    const done = new Promise((r) => { traceDone = r; }); await send('Tracing.end'); await Promise.race([done, sleep(60000)]);
    const raw = await ev('const r = __MP.stop(); __LW.pause(); return r;');
    out.env = await ev(ENV);
    try { fs.mkdirSync(TMP, { recursive: true }); const fd = fs.openSync(path.join(TMP, 'chromium-' + CHROM + '.trace.ndjson'), 'w');
      for (let i = 0; i < trace.length; i += 5000) fs.writeSync(fd, trace.slice(i, i + 5000).map((e) => JSON.stringify(e)).join('\n') + '\n'); fs.closeSync(fd);
      fs.writeFileSync(path.join(TMP, 'chromium-' + CHROM + '.cpuprofile'), JSON.stringify(prof0.result ? prof0.result.profile : {})); } catch (e) { out.saveError = String(e); }   // the raw record first: a summariser fault never costs the run
    const safe = (f) => { try { return f(); } catch (e) { return { error: String(e && e.stack || e).slice(0, 400) }; } };
    out.sum = raw && raw.frames ? safe(() => summarise(raw)) : { error: raw };
    out.trace = { events: trace.length, ...safe(() => MAIN_SELF(trace)) };
    out.profile = prof0.result ? safe(() => profileTop(prof0.result.profile)) : { error: prof0.error };
    ws.close();
  } finally {
    try { process.kill(proc.pid, 'SIGTERM'); } catch (_) {}
    await sleep(1500); try { process.kill(proc.pid, 'SIGKILL'); } catch (_) {}
    try { fs.rmSync(prof, { recursive: true, force: true }); } catch (_) {}
  }
  return out;
}

/* ── RUN ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
shadow();
const srv = await serve(SH);
let out;
try { out = CHROM ? await chromium(srv) : await firefox(srv); }
catch (e) { console.error('MOD-PROFILE ERROR', e); out = { error: String(e && e.stack || e) }; }
finally { srv.stop(); }
fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true }); fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
console.log('wrote ' + JSON_OUT);
if (CHROM && out.trace) console.log(JSON.stringify({ sum: { fps: out.sum.fps, present: out.sum.present, loop: out.sum.loopMs, js: out.sum.jsMs }, trace: out.trace, profile: out.profile }, null, 1));
