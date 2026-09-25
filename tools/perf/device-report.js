/* tools/perf/device-report.js — THE DEVICE REPORT (2026-09-25).  The instrument measures itself on the device it runs on
 * and hands the numbers over, for a device nobody can drive from a desk (the commissioner's iPad: no Mac, so no Safari
 * Web Inspector).  A DIAGNOSTIC, so it lives in tools/ and is never precached: lab/rack.js carries one line —
 *     LW.report = (o, t = performance.now()) => import('../tools/perf/device-report.js').then((m) => m.run(LW, o, t));
 *     if (q.get('report') === '1') LW.report(q);
 * so `__LW.report()` and the URL flag `?report=1` both land in run() below, and a normal boot fetches nothing (idle is
 * zero).  The LAN server (serve-lan.py) and the gate server serve the repo root, so the relative URL resolves there;
 * on a host that serves lab/ alone the import 404s and nothing happens.
 *
 * WHAT IT MEASURES, and the reading each number needs:
 *   boot       at the very start, before anything is touched: the scaling state (the fields below) and the time since
 *              __LW.ready (exact on the flag's road; `sinceNavigationMs` always).
 *   platform   UA, touch/hover/pointer, dpr, screen, viewport, reduced motion, the phone/tablet flags, dprCap, the step
 *              cap at rest, the timer's resolution.
 *   display    rAF for 1 s with NOTHING playing, the UI as found and again with it hidden: the display's own cadence
 *              (60 vs 120 Hz — Safari's "Prefer Page Rendering Updates near 60fps" flag, iPadOS' Limit Frame Rate and Low
 *              Power Mode cap it), median and p95 Δt: the ceiling every scene's fps is read against.  Taken at the start
 *              (`display`, which carries whatever the boot is still doing) and again at the end (`displayEnd`).
 *   adapter    adapterInfo, limitsRequested, features (shader-f16 / timestamp-query / texture-formats-tier1 flagged),
 *              navigator.gpu.wgslLanguageFeatures, getPreferredCanvasFormat(), the limits the field leans on.
 *   settings   card · frost · blur · theme · quality {res, steps, scale, auto, autoScale} · governor — as found.
 *   scenes     plays at the CURRENT settings, each from the same t, each put back after: rAF fps, LW.perf.loopMedian, the
 *              worst gap, and a TIME SERIES — rAF frames binned per 250 ms, each bin carrying the state at its first frame
 *              (canvas backing size, dprCap, devicePixelRatio, tablet/phone, stepCap, autoScale/scale/auto, quality.res,
 *              field.resolution, governor state + drop, body classes) and the presents / reconstructs the loop ran in
 *              it — so a ramp (AUTO SCALE climbing +0.05 per 24 frames, a governor rung rebuilding textures), a present
 *              without a reconstruct, or a class that changes the compositor's work is visible, not averaged away.
 *              In order, so the first plays meet the state the page OPENED in: as found · CARD EDGE · FROST EDGE ·
 *              AUTOSCALE EDGE · STYLE EDGE (cloud → grain) · VIEW EDGE (phase → density) — each 3 s as found → the change
 *              → 3 s → back → 4 s; the last two catch Safari 26's stall on a render pipeline's compile and first use
 *              (K2 specialises one per view × style; WEBKIT-FPS-RESEARCH §1.4) as a long gap in a bin · UI hidden (H) ·
 *              HIDE EDGE (3 s shown → H → 4 s) · frost flipped · card flipped · the modulation window flipped · and LAST the
 *              GRID EDGE (three GRID switches by the segment, playing, then again paused, each with its sub-timeline —
 *              runGridEdges below; `only: 'grid'` / `&only=grid` runs those two alone) · then the PROJECT OPEN (the WAVE DANCER
 *              demo clicked open while playing, the state as found restored 4 s later, each timed and broken down —
 *              runProjectOpen below; `only: 'project'` / `&only=project`).
 *   long play  (PACE P3) right after the first scene: 30 s as found in 1 s bins — the iPad's cycle (well for a few seconds, ~5 fps
 *              for a while, then back) is longer than any 3 s scene.  Every bin of every scene also carries THE PACING: frames
 *              the loop held because four were still on the GPU (LW.stats.skipped), the most in flight (field.inFlight), the
 *              worst submit → done (field.queueMs, the backlog, read off the frame's own completion — null where completion is
 *              not prompt and nothing is counted) and the rAF gaps over 100 ms.  `pace` records the boot probe's answer.
 *   gpu        AFTER the scenes: `field.throughput({ targetMs })` (K9) at 64³/96³/128³ with the GRID segment's pairing
 *              (110 steps × 0.75 · 160 × 1 · 240 × 1, rack.js ui.gridSeg), plus the current quality when it is not one of
 *              the three.  Each road's batch grows until it lasts ≥ targetMs, so a completion TICK (Firefox resolves
 *              onSubmittedWorkDone on ~100 ms, AUDIT-A FA5; WebKit's is unknown) cannot pose as a GPU time: `n` and the
 *              batch length ride beside the ms, and `tick` measures the empty wait.  The axial gas is measured only when
 *              the instrument is ALREADY in it (its rows are then the gas): entering the box rewrites the register and
 *              the undo ring, which is not a thing to put back.
 *   backdrops  rendered elements (and ::before/::after) with a computed backdrop-filter and their on-screen area —
 *              AUDIT-C FC2's inventory (the bill is per LAYER in WebRender, per layer + area on a tile GPU); as found and
 *              again in every scene.
 *   dom        the element count (the report's own toast excluded).
 *
 * THE LAW: it never saves and never leaves the instrument in a different state than it found it.  Every setting it
 * touches is read → changed → restored in a finally, through the app's own public roads (the ones a hand's press takes);
 * while it runs a write of the settings key is HELD (dropped and counted in `held`; other keys pass), so no setter's
 * saveSettings() can land; CARD STYLE goes through setCardStyle only on a browser that has already chosen one (the
 * settings key's cardSet) — on one that has not, only the surface attribute moves, because setCardStyle would record a
 * first choice; AUTO SCALE goes through its own switch.  The report proves the put-back: `restored` compares
 * __LW.serialize() (layout.at / quality.autoScale masked), every localStorage key and the undo ring, before and after.
 * The modulation window's remembered presentation is put back exactly after its scene (its first open prunes rows for sources
 * that no longer exist), and the CAMERA's pose, which nothing here turns, is put back — a still camera stopped again — when a
 * hand or a never-decaying fling moved it while the report ran (`restored.camera` says so); then the loop is let run the frame
 * that drops its own body classes (tablet-motion, frost-hold) before the classes are compared.
 * What it cannot put back, and says so: the traces a play leaves (the SHADOW trail, the dynamics history, particles).
 *
 * WEBKIT: no Firefox prefs, no timestamp queries, no assumption about when onSubmittedWorkDone resolves.
 */

import { VIEW_NAMES, STYLE_NAMES } from '../../lab/field.js';                     // the instance the app already loaded (same URL): constants only

const SETTINGS_KEY = 'lambdawaves.q0.settings';                                    // rack.js SETTINGS_KEY
const PAIR = { 64: { steps: 110, scale: 0.75 }, 96: { steps: 160, scale: 1 }, 128: { steps: 240, scale: 1 } };   // rack.js ui.gridSeg's onChange
const BIN_MS = 250;
const LOOPBACK = /^(127\.\d+\.\d+\.\d+|localhost|\[?::1\]?)$/i;
const PRIVATE_LAN = /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-z0-9-]+\.local)$/i;

const r3 = (v) => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : v === Infinity ? 'Infinity' : null);
const r1 = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : null);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safe = (f, d = null) => { try { const v = f(); return v === undefined ? d : v; } catch (_) { return d; } };
const mm = (q) => safe(() => matchMedia(q).matches, null);
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };

/** a short, filesystem-safe name for the device — the LAN server names the file after it */
export function deviceLabel() {
  const ua = navigator.userAgent || '', touch = (navigator.maxTouchPoints || 0) > 1;
  const os = /iPad/.test(ua) || (/Macintosh/.test(ua) && touch) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android'
    : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux|X11/.test(ua) ? 'Linux' : 'device';
  const br = /Firefox\//.test(ua) ? 'Firefox' : /Edg\//.test(ua) ? 'Edge' : /Electron\//.test(ua) ? 'Electron' : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari' : 'browser';
  return os + '-' + br;
}

/* ── the proof's readers ── */
function storageSnapshot() {
  const o = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } } catch (_) {}
  return o;
}
function storageDiff(a, b) {
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) out.push(k);
  return out;
}
function maskedSerialize(LW) {
  const o = LW.serialize();
  if (o && o.presentation) {
    if (o.presentation.layout) delete o.presentation.layout.at;          // a wall-clock stamp (captureLayout)
    if (o.presentation.quality) delete o.presentation.quality.autoScale; // runtime (AUTO SCALE), never a composition
  }
  return JSON.stringify(o);
}
function historyState(LW) {
  const h = safe(() => LW.history);
  return h ? { cursor: safe(() => h.cursor), depth: safe(() => h.depth), redoDepth: safe(() => h.redoDepth), rows: safe(() => h.entries().length) } : null;
}
function firstDiff(a, b) {
  if (!a || !b) return null;
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  return { at: i, before: a.slice(Math.max(0, i - 60), i + 60), after: b.slice(Math.max(0, i - 60), i + 60) };
}

/** THE HOLD: while the report runs, a write of the SETTINGS KEY is dropped and counted — so no setter's saveSettings()
 *  (FROST, CARD STYLE, AUTO SCALE, the modulation window's persist) can land.  Every other key passes untouched (a
 *  notebook flush queued before the report must still be written) and is counted beside it.  Released in a finally. */
function holdStorage() {
  const P = Storage.prototype, set = P.setItem, rem = P.removeItem, held = { settingsWritesHeld: 0, otherWritesPassed: {} };
  const settingsKey = (s, k) => { try { return s === window.localStorage && String(k) === SETTINGS_KEY; } catch (_) { return false; } };
  P.setItem = function (k, v) {
    if (settingsKey(this, k)) { held.settingsWritesHeld++; return undefined; }
    try { if (this === window.localStorage) held.otherWritesPassed[k] = (held.otherWritesPassed[k] || 0) + 1; } catch (_) {}
    return set.call(this, k, v);
  };
  P.removeItem = function (k) { if (settingsKey(this, k)) { held.settingsWritesHeld++; return undefined; } return rem.call(this, k); };
  return { held, release() { P.setItem = set; P.removeItem = rem; } };
}

/** AUDIT-C FC2's method: every rendered element (and pseudo-element) with a computed backdrop-filter, and the area it
 *  covers on screen.  `declared` counts the ones inside display:none subtrees too (they cost nothing). */
function backdropInventory(skip) {
  const vw = innerWidth, vh = innerHeight, kinds = {};
  let layers = 0, pseudo = 0, declared = 0, offscreen = 0, area = 0;
  const bfOf = (cs) => { const v = cs.getPropertyValue('backdrop-filter') || cs.getPropertyValue('-webkit-backdrop-filter'); return v && v !== 'none' ? v : null; };
  const onScreen = (r) => Math.max(0, Math.min(vw, r.right) - Math.max(0, r.left)) * Math.max(0, Math.min(vh, r.bottom) - Math.max(0, r.top));
  for (const el of [document.documentElement, document.body, ...document.body.getElementsByTagName('*')]) {
    if (skip && skip.contains(el)) continue;
    const cs = getComputedStyle(el);
    const rendered = el.getClientRects().length > 0;
    if (bfOf(cs)) {
      declared++;
      if (rendered) {
        layers++;
        const a = onScreen(el.getBoundingClientRect());
        if (a <= 0) offscreen++; area += a;
        const k = el.id ? '#' + el.id : el.classList.length ? '.' + el.classList[0] : el.tagName.toLowerCase();
        kinds[k] = (kinds[k] || 0) + 1;
      }
    }
    if (!rendered) continue;
    for (const pe of ['::before', '::after']) {
      const c = getComputedStyle(el, pe);
      if (c.content && c.content !== 'none' && c.content !== 'normal' && bfOf(c)) {
        pseudo++; declared++;
        const k = (el.classList.length ? '.' + el.classList[0] : el.tagName.toLowerCase()) + pe;
        kinds[k] = (kinds[k] || 0) + 1;
      }
    }
  }
  const top = Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => k + '×' + n);
  return { layers: layers + pseudo, elements: layers, pseudo, declared, offscreen, areaPx: Math.round(area), areaPct: r1(100 * area / Math.max(1, vw * vh)), top };
}

/** the timer's granularity (Safari coarsens performance.now) — the smallest non-zero step seen */
function timerResolution() {
  let best = Infinity;
  for (let i = 0; i < 12; i++) { const a = performance.now(); let b = a; for (let g = 0; g < 2e5 && b === a; g++) b = performance.now(); if (b > a) best = Math.min(best, b - a); }
  return r3(best);
}

/** the scaling state, as one bin (and the boot) records it */
function stateSample(LW) {
  const f = LW.field, q = LW.quality;
  return {
    canvas: safe(() => [f.canvas.width, f.canvas.height]), dprCap: safe(() => f.dprCap), dpr: window.devicePixelRatio || 1,
    tablet: !!safe(() => LW.layout.tablet.on), phone: !!safe(() => LW.layout.phone.on), stepCap: r3(safe(() => f.stepCap)),
    autoScale: q.autoScale, scale: q.scale, auto: q.auto, res: q.res, field: safe(() => f.resolution),
    gov: safe(() => LW.governor.state), drop: safe(() => LW.governor.drop), pipesPending: safe(() => f.renderPipelines.pending),
    view: VIEW_NAMES[LW.mat.view], style: STYLE_NAMES[LW.mat.style], cls: document.body.className,
  };
}

/* ── the levers, each by the road a hand takes ── */
const autoSwitch = () => [...document.querySelectorAll('button.sw')].find((b) => ((b.querySelector('.sw-lbl') || {}).textContent || '').trim() === 'AUTO SCALE') || null;
/** AUTO SCALE through its own switch (rack.js ui.autoSw: quality.auto = v, autoScale = 1 when off, the switch painted) */
function setAuto(LW, v) {
  if (LW.quality.auto === v) return 'unchanged';
  const b = autoSwitch();
  if (b) { b.click(); if (LW.quality.auto === v) return 'switch'; }
  LW.quality.auto = v; if (!v) LW.quality.autoScale = 1;                     // no switch in the DOM: the onChange's own two writes
  return 'direct';
}
/** CARD STYLE: the tap's own road (setCardStyle) when this browser has already chosen a card; otherwise the surface alone */
function setCard(LW, found, c) {
  if (found.cardChosen) { LW.setCardStyle(c); return 'setCardStyle'; }
  document.body.dataset.card = c; return 'data-card';
}
/** GRID through its own segment (rack.js ui.gridSeg: a click on `96³` paints the group and runs its onChange — quality.res,
 *  the pairing's steps and scale, schedule(REBUILD)); with no segment in the DOM, the onChange's own writes */
const gridButton = (g) => { const r = document.querySelector('.seg[role="radiogroup"][aria-label="GRID"]'); return r ? [...r.querySelectorAll('button.seg-b')].find((b) => b.textContent.trim() === g + '³') || null : null; };
function setGrid(LW, g) {
  const q = LW.quality;
  if (q.res === g) return 'unchanged';
  const b = gridButton(g);
  if (b && !b.disabled) { b.click(); if (q.res === g) return 'segment'; }
  q.res = g; q.steps = PAIR[g].steps; q.scale = PAIR[g].scale; LW.schedule(LW.TIER.REBUILD);
  return 'direct';
}

/** THE GRID PROBE (grid edge, 2026-09-25): field.setResolution and field.frame are plain properties the loop calls through
 *  (rack.js applyRebuild → `field.setResolution(want)`, the loop → `field.frame({...})`), so they are WRAPPED from here for the
 *  scene and put back after — no hook in lab/.  A TAP is armed before it is made; the next setResolution is its rebuild at
 *  whatever grid the field takes (`fieldTo`: below `to` when the governor has stepped the grid ladder), and a tap whose loop
 *  frame rebuilt nothing says so (`noRebuild`: the field already held that grid).  A setResolution nobody tapped for (the
 *  governor's rung, a hand) is armed at its own call (`by: 'unarmed'`) and timed the same way.  Each record, from its t:
 *    rebuildAfterMs    tap → applyRebuild's setResolution (the loop's next frame, later when PACE held it: `heldBeforeRebuild`)
 *    setResolutionMs   its synchronous part: 2 × destroy + 2 × createTexture (n³ rgba16float 3D) + the bind groups
 *    allocDoneMs       onSubmittedWorkDone asked right after it returns: the queue as it stood (inFlightAtAlloc frames still on
 *                      the GPU) plus anything the implementation enqueued at creation — paused, that is the allocation alone
 *    firstFrame        the first field.frame at the new grid: encodeMs (its synchronous part, submit included), whether it
 *                      reconstructed and presented, gpuDoneMs (its submit → onSubmittedWorkDone: the first dispatch into the
 *                      new textures, any lazy zero-fill, and the ray march), and when it ended after t (afterMs)
 *    secondFrame       the same for the frame after it (paused: a present alone at the new grid)
 *    firstPresentMs / firstReconstructMs   t → the end of the first frame at the new grid that presented / reconstructed
 *  Firefox resolves onSubmittedWorkDone on a ~100 ms poll (AUDIT-A FA5): there a GPU ms is a tick, not a time; WebKit's is prompt. */
function gridProbe(LW) {
  const field = LW.field, dev = field.device;
  const origSet = field.setResolution, origFrame = field.frame;
  const all = [];
  let t0 = performance.now();
  const done = () => dev.queue.onSubmittedWorkDone();
  const record = (from, to, by, t) => ({ by, from, to, fieldTo: null, firstSight: null, t, atMs: r1(t - t0), via: null, callMs: null,
    before: { field: field.resolution, inFlight: safe(() => field.inFlight), queueMs: safe(() => field.paced) ? r1(safe(() => field.queueMs)) : null, pipesPending: safe(() => field.renderPipelines.pending), pipesReady: safe(() => field.renderPipelines.ready), stepCap: r3(safe(() => field.stepCap)), autoScale: LW.quality.autoScale, gov: safe(() => LW.governor.state) },
    skipped0: safe(() => LW.stats.skipped, 0), rebuilt: false, noRebuild: null, frames: 0, pending: [],
    rebuildAfterMs: null, setResolutionMs: null, inFlightAtAlloc: null, heldBeforeRebuild: null, allocDoneMs: null,
    firstFrame: null, secondFrame: null, firstPresentMs: null, firstReconstructMs: null, firstReconstruct: null });
  field.setResolution = function (n) {
    const from = field.resolution, fl = safe(() => field.inFlight, 0), t = performance.now();
    let sw = all.find((s) => s.by === 'tap' && !s.rebuilt && !s.noRebuild);
    if (!sw) { sw = record(from, n, 'unarmed', t); all.push(sw); }
    const r = origSet.call(this, n);
    const t1 = performance.now();
    sw.rebuilt = true; sw.fieldTo = n;
    sw.rebuildAfterMs = r1(t - sw.t); sw.setResolutionMs = r3(t1 - t); sw.inFlightAtAlloc = fl;
    sw.heldBeforeRebuild = safe(() => LW.stats.skipped - sw.skipped0, null);
    if (from !== n) sw.pending.push(done().then(() => { sw.allocDoneMs = r1(performance.now() - t1); }, () => {}));
    return r;
  };
  field.frame = function (a) {
    const st = field.stats, p = st.presents, rc = st.reconstructs, t = performance.now(), fl = safe(() => field.inFlight, 0);
    const r = origFrame.call(this, a);
    const t1 = performance.now(), res = field.resolution;
    for (const sw of all) {
      if (sw.frames >= 2 || t < sw.t || (sw.noRebuild && !sw.anyFrame)) continue;
      if (!sw.rebuilt && !sw.noRebuild) { sw.noRebuild = { field: res, gov: safe(() => LW.governor.state), afterMs: r1(t1 - sw.t) }; if (!sw.anyFrame) continue; }   // this loop frame ran its REBUILD first, and nothing was rebuilt
      if (sw.rebuilt && res !== sw.fieldTo) { sw.frames = 2; continue; }                                                           // another rebuild came first: this record is closed
      const fr = { afterMs: r1(t1 - sw.t), encodeMs: r3(t1 - t), reconstructed: st.reconstructs > rc, presented: st.presents > p, inFlightAtSubmit: fl, gpuDoneMs: null };
      sw.pending.push(done().then(() => { fr.gpuDoneMs = r1(performance.now() - t1); }, () => {}));
      if (sw.frames === 0) sw.firstFrame = fr; else sw.secondFrame = fr;
      sw.frames++;
      if (fr.presented && sw.firstPresentMs === null) sw.firstPresentMs = fr.afterMs;
      if (fr.reconstructed && sw.firstReconstructMs === null) { sw.firstReconstructMs = fr.afterMs; sw.firstReconstruct = fr; }
    }
    return r;
  };
  return {
    all,
    start() { t0 = performance.now(); },
    /** a tap about to be made: the state around it, read before it.  `anyFrame`: time the next two frames whether or not
     *  the grid changes (a project open: its REBUILD frame rebuilds the grid only when the file's grid differs) */
    arm(from, to, firstSight, anyFrame = false) { const sw = record(from, to, 'tap', performance.now()); sw.firstSight = firstSight; sw.anyFrame = anyFrame; all.push(sw); return sw; },
    /** the GPU answers for every record so far, waited at most `ms` (a lost device never answers) */
    settled(ms = 3000) { return Promise.race([Promise.all(all.flatMap((s) => s.pending)), sleep(ms)]); },
    release() { field.setResolution = origSet; field.frame = origFrame; },
    /** one record as the report keeps it (the working fields dropped) */
    out(sw) {
      const { t, skipped0, rebuilt, frames, pending, firstReconstruct, anyFrame, ...o } = sw;
      o.firstReconstructGpuMs = firstReconstruct ? firstReconstruct.gpuDoneMs : null;
      return o;
    },
  };
}

/**
 * deviceReport(LW, opts) → one JSON-safe object.
 *   opts.targetMs     the throughput batch floor (1500)          opts.sceneMs   one scene's play (3000)
 *   opts.grids        [64, 96, 128]                              opts.scenes / opts.gpu   false skips that part
 *   opts.only         'grid': the scenes are the two grid edges alone · 'project': the project open alone
 *   opts.readyAt      performance.now() at __LW.ready (the flag's road passes it)
 *   opts.onProgress   (text) → void, between steps (the flag's toast)          opts.skipEl   the toast (left out of dom/backdrops)
 */
let inFlight = null;
export function deviceReport(LW, opts = {}) {
  if (inFlight) return inFlight;
  inFlight = measure(LW, opts).finally(() => { inFlight = null; });
  return inFlight;
}

async function measure(LW, opts) {
  const o = { targetMs: 1500, sceneMs: 3000, longMs: 30000, grids: [64, 96, 128], scenes: true, gpu: true, ...opts };
  const say = typeof o.onProgress === 'function' ? (t) => { try { o.onProgress(t); } catch (_) {} } : () => {};
  const skipEl = o.skipEl || null;
  const errors = [];
  const err = (where, e) => errors.push(where + ': ' + String(e && e.message || e).slice(0, 300));
  const e0 = (window.__e || []).length;
  const tStart = performance.now();
  const field = LW.field, q = LW.quality, mat = LW.mat, clock = LW.clock;
  const R = { v: 1, kind: 'lambdawaves-device-report', device: deviceLabel(), at: new Date().toISOString(), build: safe(() => LW.build), url: location.href.split('#')[0] };

  /* ── the boot state, before anything is touched ── */
  R.boot = { sinceReadyMs: Number.isFinite(o.readyAt) ? Math.round(tStart - o.readyAt) : null, sinceNavigationMs: Math.round(tStart), playing: !!clock.playing, ...stateSample(LW) };

  /* ── what was found, for the put-back and for the proof ── */
  const stored = safe(() => JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'), {});
  const found = {
    playing: !!clock.playing, t: clock.t,
    quality: { res: q.res, steps: q.steps, scale: q.scale }, matSteps: mat.steps, auto: q.auto,
    frost: safe(() => LW.frost), card: safe(() => LW.cardStyle), cardChosen: !!(stored && stored.cardSet === true), uiHidden: !!safe(() => LW.uiHidden),
    view: VIEW_NAMES[mat.view], style: STYLE_NAMES[mat.style],
    rackHidden: document.body.classList.contains('rack-hidden'), modOpen: !!safe(() => LW.mod.expanded),
    bodyClass: document.body.className,
    /* PACE P3 · the camera as found: nothing in the report turns it, so a pose that moves while it runs is put back */
    camera: { moving: !!safe(() => LW.camera.moving), obs: safe(() => { const O = LW.obs; return { yaw: O.yaw, pitch: O.pitch, dist: O.dist, fov: O.fov, mode: O.mode, quat: O.quat ? Array.from(O.quat) : null }; }) },
  };
  const proofBefore = { serialize: safe(() => maskedSerialize(LW)), storage: storageSnapshot(), history: historyState(LW) };
  const hold = holdStorage();

  try {
    /* ── the static half: nothing here changes anything ── */
    R.platform = {
      ua: navigator.userAgent, platform: navigator.platform || null, vendor: navigator.vendor || null,
      maxTouchPoints: navigator.maxTouchPoints || 0, touch: ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0,
      hover: mm('(hover: hover)') ? 'hover' : mm('(hover: none)') ? 'none' : null,
      pointer: mm('(pointer: fine)') ? 'fine' : mm('(pointer: coarse)') ? 'coarse' : mm('(pointer: none)') ? 'none' : null,
      anyPointerCoarse: mm('(any-pointer: coarse)'), reducedMotion: mm('(prefers-reduced-motion: reduce)'),
      reducedTransparency: mm('(prefers-reduced-transparency: reduce)'), gamutP3: mm('(color-gamut: p3)'), hdr: mm('(dynamic-range: high)'),
      standalone: mm('(display-mode: standalone)') || navigator.standalone === true,
      dpr: window.devicePixelRatio || 1, screen: [screen.width, screen.height], avail: [screen.availWidth, screen.availHeight],
      viewport: [innerWidth, innerHeight], visualViewport: window.visualViewport ? { w: r1(visualViewport.width), h: r1(visualViewport.height), scale: visualViewport.scale } : null,
      orientation: safe(() => screen.orientation.type), cores: navigator.hardwareConcurrency || null, memoryGB: navigator.deviceMemory || null,
      phone: !!safe(() => LW.layout.phone.on), tablet: !!safe(() => LW.layout.tablet.on),
      dprCap: safe(() => field.dprCap), stepCapAtRest: r3(safe(() => field.stepCap)),
      motion: safe(() => LW.motion), timerResolutionMs: timerResolution(), crossOriginIsolated: !!window.crossOriginIsolated,
      canvas: safe(() => { const c = field.canvas; return { css: [c.clientWidth, c.clientHeight], px: [c.width, c.height] }; }),
    };
    R.adapter = field && field.adapter ? {
      info: safe(() => field.adapterInfo), limitsRequested: safe(() => field.limitsRequested), format: safe(() => field.format),
      fallback: safe(() => field.adapter.isFallbackAdapter ?? (field.adapter.info && field.adapter.info.isFallbackAdapter), null),
      features: safe(() => [...field.adapter.features].sort(), []),
      featureFlags: safe(() => { const F = field.adapter.features; return { shaderF16: F.has('shader-f16'), timestampQuery: F.has('timestamp-query'), textureFormatsTier1: F.has('texture-formats-tier1'), textureFormatsTier2: F.has('texture-formats-tier2') }; }),
      wgslLanguageFeatures: safe(() => [...navigator.gpu.wgslLanguageFeatures].sort(), []),
      preferredFormat: safe(() => navigator.gpu.getPreferredCanvasFormat()),
      limits: safe(() => { const L = field.device.limits, o2 = {}; for (const k of ['maxTextureDimension2D', 'maxTextureDimension3D', 'maxStorageBufferBindingSize', 'maxBufferSize', 'maxComputeWorkgroupStorageSize', 'maxComputeInvocationsPerWorkgroup', 'maxStorageTexturesPerShaderStage']) o2[k] = L[k]; return o2; }),
      gamut: safe(() => LW.gamut.state()), ok: !!field.ok,
    } : { ok: false, error: safe(() => field.error) };
    R.settings = {
      card: found.card, cardChosen: found.cardChosen, frost: found.frost, frostLive: safe(() => LW.frostLive), blur: safe(() => getComputedStyle(document.documentElement).getPropertyValue('--glass-blur').trim()),
      theme: safe(() => LW.theme), disconnected: safe(() => LW.disconnected), uiHidden: found.uiHidden,
      quality: { res: q.res, steps: q.steps, scale: q.scale, auto: q.auto, autoScale: q.autoScale },
      fieldResolution: safe(() => field.resolution), matSteps: mat.steps, view: VIEW_NAMES[mat.view] || mat.view, style: STYLE_NAMES[mat.style] || mat.style,
      renderPipelines: safe(() => field.renderPipelines),
      governor: { on: safe(() => LW.governor.on), state: safe(() => LW.governor.state) }, perfMode: safe(() => LW.perf.mode),
      modCadence: safe(() => LW.mod.cadence), modWindowOpen: found.modOpen, gasTable: safe(() => LW.gasTable()),
      hamiltonian: safe(() => LW.hamiltonian), gasOn: !!safe(() => LW.gas.on), preset: safe(() => LW.reg.preset), modes: safe(() => LW.reg.populated().length),
      playing: found.playing, rate: clock.rate, frame: mat.frame !== false, frameMode: mat.frameMode || null, axis: mat.axis !== false,
      openWindows: document.querySelectorAll('.dev:not(.closed)').length, floating: document.querySelectorAll('#floats .dev:not(.closed)').length,
      palette: safe(() => LW.paletteId),
    };
    /* PACE P1 · the loop waits for the GPU only where completion is prompt: the boot probe's answer and its waits */
    R.pace = { paced: safe(() => field.paced), inFlight: safe(() => field.inFlight), skipped: safe(() => LW.stats.skipped), waits: safe(() => field.paceWaits) };
    R.dom = { elements: document.getElementsByTagName('*').length - (skipEl ? skipEl.getElementsByTagName('*').length + 1 : 0) };
    R.backdrops = safe(() => backdropInventory(skipEl), null);

    /* ── the transport down, the picture settled, the specialised pipelines compiled (K2) ── */
    if (found.playing) LW.pause();
    await LW.settle();
    for (let i = 0; i < 50 && safe(() => field.renderPipelines.pending, 0) > 0; i++) await sleep(100);

    /* ── the display's own cadence, NOTHING playing (the loop is idle; only this rAF runs) ── */
    say('the display cadence');
    const cadence = async () => {
      const ts = []; const t0 = performance.now();
      await new Promise((res) => { const g = setTimeout(res, 2500); const f = (t) => { ts.push(t); if (performance.now() - t0 < 1000) requestAnimationFrame(f); else { clearTimeout(g); res(); } }; requestAnimationFrame(f); });
      const iv = ts.slice(1).map((t, i) => t - ts[i]), m = median(iv);
      return { rafHz: m ? r1(1000 / m) : null, frames: ts.length, medianMs: r3(m), p95Ms: r3(pct(iv, 0.95)), maxMs: r3(iv.length ? Math.max(...iv) : null) };
    };
    R.display = await cadence();
    if (!found.uiHidden) { LW.keys.toggleUI(); try { await LW.settle(); R.display.uiHidden = await cadence(); } finally { LW.keys.toggleUI(); await LW.settle(); } }

    /* ── the scenes FIRST: the opening state is what the commissioner sees, and the grid rows below rebuild it ── */
    if (o.scenes) {
      if (safe(() => LW.warning.open)) R.scenes = { skipped: 'the photosensitivity notice is up — nothing plays until it has been read' };
      else R.scenes = await runScenes(LW, o, found, say, err, skipEl);
    }

    /* ── the GPU: the completion tick, then the grids ── */
    if (o.gpu && field && field.ok) {
      say('the GPU completion tick');
      R.gpu = { targetMs: o.targetMs, pairing: 'GRID segment (64³ 110×0.75 · 96³ 160×1 · 128³ 240×1)', preset: (safe(() => LW.hamiltonian) || '?') + (safe(() => LW.gas.on) ? ' · axial gas' : ''), rows: [] };
      try {
        const w = [];
        for (let i = 0; i < 5; i++) { const t = performance.now(); await field.device.queue.onSubmittedWorkDone(); w.push(performance.now() - t); }
        R.gpu.tick = { emptyWaitMs: w.map(r3), medianMs: r3(median(w)) };
      } catch (e) { err('tick', e); }
      const row = async (label, res, steps, scale) => {
        const modes = LW.modesAt(clock.t);
        if (!modes) return { label, grid: res, skipped: 'no mode list (a molecular field owns the volume)' };
        field.resize(scale);                         // paused: AUTO SCALE is 1 (W125-2), so the picture's canvas is scale × dpr
        const t = await field.throughput({ modes, obs: LW.obs, mat, n: 30, targetMs: o.targetMs });
        return { label, grid: res, steps: t.steps, scale, w: t.w, h: t.h, modes: t.modes,
          frameMs: t.frameMs, reconstructMs: t.reconstructMs, presentMs: t.presentMs,
          n: t.n, nReconstruct: t.nReconstruct, nPresent: t.nPresent,
          batchMs: { frame: r1(t.frameMs * t.n), reconstruct: r1(t.reconstructMs * t.nReconstruct), present: r1(t.presentMs * t.nPresent) } };
      };
      const current = Object.keys(PAIR).find((g) => +g === found.quality.res && PAIR[g].steps === found.quality.steps && PAIR[g].scale === found.quality.scale);
      try {
        if (!current) {
          say('GPU · the current quality');
          R.gpu.rows.push(await row('current', found.quality.res, found.quality.steps, found.quality.scale));
        }
        for (const g of o.grids) {
          const P = PAIR[g]; if (!P) continue;
          say('GPU · ' + g + '³');
          q.res = g; q.steps = P.steps; q.scale = P.scale;
          LW.schedule(LW.TIER.REBUILD); await LW.settle();
          for (let i = 0; i < 20 && field.resolution !== g; i++) await LW.settle();
          const r = await row(String(g) + '³' + (+current === g ? ' (current)' : ''), g, P.steps, P.scale);
          if (+current === g) r.current = true;
          R.gpu.rows.push(r);
        }
      } catch (e) { err('gpu', e); }
      finally { await putQuality(LW, found); }
      R.gpu.gas128 = safe(() => LW.gas.on) ? (R.gpu.rows.find((r) => r.grid === 128) || null)
        : { skipped: 'not in the axial gas — entering the box rewrites the register and the undo ring, so it is not done for you; open OPERATOR → BOX with the AXIAL basis and run the report again to measure it' };
    } else R.gpu = { skipped: field && field.ok ? 'off' : 'no WebGPU field' };

    /* ── the display cadence again, at the end: the start's reading carries whatever the boot was still doing ── */
    say('the display cadence, again');
    R.displayEnd = await cadence();
    if (!found.uiHidden) { LW.keys.toggleUI(); try { await LW.settle(); R.displayEnd.uiHidden = await cadence(); } finally { LW.keys.toggleUI(); await LW.settle(); } }
  } catch (e) { err('report', e); }
  finally {
    /* ── put everything back, whatever threw; then let the page write again ── */
    try { await putBack(LW, found); } catch (e) { err('put-back', e); }
    hold.release();
  }

  /* ── the proof ── */
  const proofAfter = { serialize: safe(() => maskedSerialize(LW)), storage: storageSnapshot(), history: historyState(LW) };
  const changedKeys = storageDiff(proofBefore.storage, proofAfter.storage);
  R.held = hold.held;
  R.restored = {
    serialize: found.playing ? 'not comparable (the transport was playing when the report began)' : found.camera.moving ? 'not comparable (the camera was turning when the report began)' : proofBefore.serialize === proofAfter.serialize ? 'identical' : 'DIFFERENT',
    camera: found.camera.moving ? 'not comparable (turning when the report began)' : found.cameraPutBack ? 'put back (' + found.cameraPutBack + ')' : 'identical',
    serializeBytes: proofAfter.serialize ? proofAfter.serialize.length : null,
    settingsKey: proofBefore.storage[SETTINGS_KEY] === proofAfter.storage[SETTINGS_KEY] ? 'identical' : 'DIFFERENT',
    localStorage: changedKeys.length ? 'DIFFERENT: ' + changedKeys.join(', ') : 'identical',
    history: JSON.stringify(proofBefore.history) === JSON.stringify(proofAfter.history) ? 'identical'
      : found.projectScene ? 'CLEARED by the project open to one row (' + JSON.stringify(proofBefore.history) + ' → ' + JSON.stringify(proofAfter.history) + ') — the one thing that scene cannot put back'
      : 'DIFFERENT',
    card: LW.cardStyle === found.card ? 'identical' : 'DIFFERENT',
    cardRoad: found.cardChosen ? 'setCardStyle (this browser had already chosen a card)' : 'the data-card attribute only (setCardStyle would have recorded a first choice)',
    frost: LW.frost === found.frost ? 'identical' : 'DIFFERENT',
    viewStyle: VIEW_NAMES[LW.mat.view] === found.view && STYLE_NAMES[LW.mat.style] === found.style ? 'identical' : 'DIFFERENT',
    autoScaleSwitch: LW.quality.auto === found.auto && (!autoSwitch() || autoSwitch().classList.contains('on') === !!found.auto) ? 'identical' : 'DIFFERENT',
    bodyClass: document.body.className === found.bodyClass ? 'identical' : 'DIFFERENT: ' + document.body.className,
    traces: 'a play advances the SHADOW trail, the dynamics history and particles; none is project state',
  };
  if (R.restored.serialize === 'DIFFERENT') R.restored.serializeFirstDiff = firstDiff(proofBefore.serialize, proofAfter.serialize);
  if (found.projectScene) R.restored.projectOpen = found.projectScene.residue;   // what the project open put back by hand, and what it could not
  R.errors = errors.concat((window.__e || []).slice(e0).map(String)).slice(0, 40);
  R.wallMs = Math.round(performance.now() - tStart);
  return R;
}

/* the grid, the steps and the scale as found; the REBUILD runs even when the numbers already agree, because a
   throughput row resized the canvas to its own pairing and only the loop's next present resizes it back */
async function putQuality(LW, found) {
  const q = LW.quality;
  q.res = found.quality.res; q.steps = found.quality.steps; q.scale = found.quality.scale;
  LW.schedule(LW.TIER.REBUILD); await LW.settle();
  if (LW.mat.steps !== found.matSteps) { LW.mat.steps = found.matSteps; LW.schedule(LW.TIER.PRESENT); await LW.settle(); }
}

/** idempotent: every lever back where it was found (each scene also restores its own in its own finally) */
async function putBack(LW, found) {
  if (LW.clock.playing) LW.pause();
  if (!!LW.uiHidden !== found.uiHidden) LW.keys.toggleUI();
  if (LW.frost !== found.frost) LW.setFrost(found.frost);
  if (LW.cardStyle !== found.card) setCard(LW, found, found.card);
  if (LW.quality.auto !== found.auto) setAuto(LW, found.auto);
  if (found.style && STYLE_NAMES[LW.mat.style] !== found.style) LW.setStyle(found.style);
  if (found.view && VIEW_NAMES[LW.mat.view] !== found.view) LW.setView(found.view);
  if (!!LW.mod.expanded !== found.modOpen) { if (found.modOpen) LW.mod.expand(); else LW.mod.collapse(); }
  if (document.body.classList.contains('rack-hidden') !== found.rackHidden) document.body.classList.toggle('rack-hidden', found.rackHidden);
  await putQuality(LW, found);
  /* PACE P3 · THE CAMERA.  The report never turns it, so a pose that moved while it ran was a hand on the glass (or a fling that
     never decays: CAMERA friction 0) — the pose goes back and a still camera is stopped again, or serialize() differs and the
     loop keeps `tablet-motion` on the body (the second iPad run: yaw 0.65 → 1186.9) */
  const C = found.camera, O = LW.obs;
  if (C && C.obs && !C.moving && O) {
    const moved = O.yaw !== C.obs.yaw || O.pitch !== C.obs.pitch || O.dist !== C.obs.dist || O.fov !== C.obs.fov || O.mode !== C.obs.mode || String(O.quat ? Array.from(O.quat) : null) !== String(C.obs.quat);
    const turning = !!safe(() => LW.camera.moving);
    if (turning) LW.camera.stop();
    if (moved) {
      Object.assign(O, { yaw: C.obs.yaw, pitch: C.obs.pitch, mode: C.obs.mode }); if (C.obs.quat) O.quat = C.obs.quat.slice();
      if (O.dist !== C.obs.dist) LW.camera.setDist(C.obs.dist); if (O.fov !== C.obs.fov) LW.camera.setFov(C.obs.fov);
      LW.schedule(LW.TIER.PRESENT);
    }
    if (moved || turning) found.cameraPutBack = (turning ? 'still turning — stopped' : '') + (moved && turning ? '; ' : '') + (moved ? 'the pose had moved — a touch?' : '');
  }
  if (!found.playing) { if (LW.clock.t !== found.t) LW.scrub(found.t); }
  else LW.play();
  /* the loop owns two body classes (tablet-motion while anything moves, frost-hold while playing under STILL frost) and drops
     them on its next frame: settle until it has run that frame, so the class list is read after it */
  await LW.settle(); await LW.settle(); await LW.settle();
  /* a class toggled off and on comes back at the END of the list; the same set is put back in the order it was found */
  const now = document.body.className, a = now.split(/\s+/).filter(Boolean).sort().join(' '), b = found.bodyClass.split(/\s+/).filter(Boolean).sort().join(' ');
  if (now !== found.bodyClass && a === b) document.body.className = found.bodyClass;
}

/** one play, binned: rAF frames per `binMs` (BIN_MS unless the scene says), each bin with the state at its first frame and
 *  the loop's presents / reconstructs inside it, and THE PACING (PACE P3): the frames the loop held because four were still on
 *  the GPU (LW.stats.skipped), the most frames in flight, the worst submit → done (field.queueMs — the backlog, read off the
 *  frame's own completion, so measuring it perturbs nothing; null where completion is not prompt and nothing is counted) and
 *  the rAF gaps over 100 ms; `at` = [{ ms, what, fn }] fired once each, from inside the rAF */
async function play(LW, ms, at = [], binMs = BIN_MS, tap = null) {
  const field = LW.field, q = LW.quality, gov = LW.governor, st = LW.stats;
  const nb = Math.ceil(ms / binMs);
  const bins = Array.from({ length: nb }, () => ({ n: 0, maxMs: 0, presents: 0, reconstructs: 0, skipped: 0, inFlightMax: 0, queueMsMax: null, gaps100: 0, s: null }));
  const iv = []; let last = null;
  const f0 = st.frames, p0 = st.presents, rc0 = st.reconstructs, k0 = st.skipped || 0, g0 = safe(() => gov.changes, 0);
  let lp = st.presents, lr = st.reconstructs, lk = st.skipped || 0, inMax = 0, qMax = null;
  const paced = !!safe(() => field.paced);
  const fired = new Set(), marks = [];
  let minScale = q.autoScale, frostSeen = null;
  LW.perf.resetRing();
  LW.play();
  const t0 = performance.now();
  await new Promise((res) => {
    const guard = setTimeout(res, ms + 2000);                                   // a hidden tab stops rAF: the scene ends anyway
    const f = (ts) => {
      const el = performance.now() - t0;
      if (last !== null) iv.push(ts - last);
      last = ts;
      const B = bins[Math.min(nb - 1, Math.floor(el / binMs))];
      B.n++;
      if (iv.length) { const g = iv[iv.length - 1]; B.maxMs = Math.max(B.maxMs, g); if (g > 100) B.gaps100++; }
      B.presents += st.presents - lp; B.reconstructs += st.reconstructs - lr; lp = st.presents; lr = st.reconstructs;
      B.skipped += (st.skipped || 0) - lk; lk = st.skipped || 0;
      const fl = safe(() => field.inFlight, 0) || 0; if (fl > B.inFlightMax) B.inFlightMax = fl; if (fl > inMax) inMax = fl;
      if (paced) { const qm = safe(() => field.queueMs, null); if (Number.isFinite(qm)) { if (B.queueMsMax === null || qm > B.queueMsMax) B.queueMsMax = qm; if (qMax === null || qm > qMax) qMax = qm; } }
      if (!B.s) B.s = stateSample(LW);
      if (q.autoScale < minScale) minScale = q.autoScale;
      if (frostSeen === null && el > ms / 2) frostSeen = safe(() => LW.frostLive);
      if (tap) try { tap(performance.now(), iv.length ? iv[iv.length - 1] : 0); } catch (_) {}   // before `at`: a switch's own frame is not after it
      for (let i = 0; i < at.length; i++) if (!fired.has(i) && el >= at[i].ms) {
        fired.add(i); let via = null; try { via = at[i].fn(); } catch (e) { via = 'threw: ' + String(e && e.message || e); }
        marks.push({ ms: Math.round(el), what: at[i].what || 'mark', via: typeof via === 'string' ? via : null });
      }
      if (el < ms) requestAnimationFrame(f); else { clearTimeout(guard); res(); }
    };
    requestAnimationFrame(f);
  });
  const dt = (performance.now() - t0) / 1000;
  const out = {
    rafFps: r1(iv.length / Math.max(1e-3, dt)), appFps: r1((st.frames - f0) / Math.max(1e-3, dt)),
    presents: st.presents - p0, reconstructs: st.reconstructs - rc0,
    loopMedianMs: r3(safe(() => LW.perf.loopMedian)), perfMedianMs: r3(safe(() => LW.perf.median)), fieldEmaMs: r3(safe(() => LW.perf.profile.field)),
    medianFrameMs: r3(median(iv)), p95FrameMs: r3(pct(iv, 0.95)), maxGapMs: r3(iv.length ? Math.max(...iv) : null),
    over2x: (() => { const m = median(iv) || 0; return iv.filter((v) => v > 2 * m).length; })(),
    gaps100: iv.filter((v) => v > 100).length, paced, skipped: (st.skipped || 0) - k0, inFlightMax: inMax, queueMsMax: r1(qMax),
    minAutoScale: minScale, governorChanges: safe(() => gov.changes, 0) - g0, governorEnd: safe(() => gov.state), frostLiveMidScene: frostSeen,
    stepCapInPlay: r3(safe(() => field.stepCap)), fieldResolutionEnd: safe(() => field.resolution),
    binMs,
    bins: bins.map((B) => ({ fps: Math.round(B.n / (binMs / 1000)), maxMs: r1(B.maxMs), presents: B.presents, reconstructs: B.reconstructs,
      skipped: B.skipped, inFlightMax: B.inFlightMax, queueMsMax: r1(B.queueMsMax), gaps100: B.gaps100, ...(B.s || { gap: true }) })),
    marks, seconds: r3(dt),
  };
  LW.pause();
  return out;
}

async function runScenes(LW, o, found, say, err, skipEl) {
  const S = [];
  const start = async () => {                                                  // every scene from the same t, paused, settled
    LW.pause(); if (LW.clock.t !== found.t) LW.scrub(found.t);
    await LW.settle(); await sleep(400);
  };
  const scene = async (label, apply, undo, ms, at, binMs, tap) => {
    say('scene · ' + label);
    const s = { label };
    try {
      if (apply) { const why = await apply(); if (typeof why === 'string' && why.startsWith('skip:')) { s.skipped = why.slice(5).trim(); return S.push(s); } if (typeof why === 'string') s.via = why; }
      await start();
      s.backdrops = safe(() => backdropInventory(skipEl));
      Object.assign(s, await play(LW, ms || o.sceneMs, at, binMs, tap));
    } catch (e) { err('scene ' + label, e); s.error = String(e && e.message || e); }
    finally {
      try { LW.pause(); if (undo) await undo(); } catch (e) { err('undo ' + label, e); }
    }
    return S.push(s);
  };
  const toggleUI = () => LW.keys.toggleUI();
  const cardTo = found.card === 'tinted' ? 'refractive' : 'tinted';
  const frostTo = found.frost === 'off' ? 'always' : 'off';
  const autoTo = !found.auto;
  /* an EDGE: 3 s as found → the change → 3 s → back → 4 s, in one binned series (10 s) */
  const EDGE = 10000;

  const gridEdges = () => runGridEdges(LW, found, S, scene, start, say, err);
  const projectOpen = () => runProjectOpen(LW, found, S, scene, say, err);
  if (o.only === 'grid') { await gridEdges(); return S; }                 // `__LW.report({ only: 'grid' })`, `?report=1&only=grid`
  if (o.only === 'project') { await projectOpen(); return S; }           // `__LW.report({ only: 'project' })`, `?report=1&only=project`

  await scene(found.uiHidden ? 'as found (UI hidden)' : 'as found (UI shown)');
  /* PACE P3 · THE LONG PLAY: 30 s as found in 1 s bins.  The iPad played well for a few seconds, fell to ~5 fps for a while and
     came back, over and over — frames queued faster than its GPU finished them, then the page stalled while they drained — and a
     3 s scene cannot see that cycle.  Each bin carries the pacing beside the fps (held frames, frames in flight, submit → done). */
  if (o.longMs > 0) await scene('long play (' + Math.round(o.longMs / 1000) + ' s as found, 1 s bins)', null, null, o.longMs, [], 1000);
  /* THE THREE EDGES (the commissioner: "tap CARD STYLE → tinted and fps jumps to 60 and STAYS at 60 even after tapping back
     to refractive; same with FROST; AUTO SCALE off → laggy, back on → still slow for 3–5 s") — first, so they start from
     the state the page opened in */
  await scene('card edge (3 s → ' + cardTo + ' → 3 s → ' + found.card + ' → 4 s)', null, () => { if (LW.cardStyle !== found.card) setCard(LW, found, found.card); }, EDGE,
    [{ ms: 3000, what: 'card ' + cardTo, fn: () => setCard(LW, found, cardTo) }, { ms: 6000, what: 'card ' + found.card, fn: () => setCard(LW, found, found.card) }]);
  await scene('frost edge (3 s → ' + frostTo + ' → 3 s → ' + found.frost + ' → 4 s)', null, () => { if (LW.frost !== found.frost) LW.setFrost(found.frost); }, EDGE,
    [{ ms: 3000, what: 'frost ' + frostTo, fn: () => { LW.setFrost(frostTo); return 'setFrost'; } }, { ms: 6000, what: 'frost ' + found.frost, fn: () => { LW.setFrost(found.frost); return 'setFrost'; } }]);
  await scene('autoscale edge (3 s → AUTO SCALE ' + (autoTo ? 'on' : 'off') + ' → 3 s → ' + (found.auto ? 'on' : 'off') + ' → 4 s)', null, () => { if (LW.quality.auto !== found.auto) setAuto(LW, found.auto); }, EDGE,
    [{ ms: 3000, what: 'AUTO SCALE ' + (autoTo ? 'on' : 'off'), fn: () => setAuto(LW, autoTo) }, { ms: 6000, what: 'AUTO SCALE ' + (found.auto ? 'on' : 'off'), fn: () => setAuto(LW, found.auto) }]);
  /* STYLE and VIEW: each new (view, style) pair is a specialised render pipeline compiled on first sight (K2); Safari 26
     stalls rendering during the compile AND on the first use after its promise resolves (WebKit bug 324043) — a stall
     shows as a bin with a long max gap and few presents */
  {
    const to = found.style === 'grain' ? 'cloud' : 'grain';
    await scene('style edge (3 s → ' + to + ' → 3 s → ' + found.style + ' → 4 s)', null, () => { if (STYLE_NAMES[LW.mat.style] !== found.style) LW.setStyle(found.style); }, EDGE,
      [{ ms: 3000, what: 'style ' + to, fn: () => { LW.setStyle(to); return 'setStyle'; } }, { ms: 6000, what: 'style ' + found.style, fn: () => { LW.setStyle(found.style); return 'setStyle'; } }]);
  }
  {
    const to = found.view === 'density' ? 'phase' : 'density';
    await scene('view edge (3 s → ' + to + ' → 3 s → ' + found.view + ' → 4 s)', null, () => { if (VIEW_NAMES[LW.mat.view] !== found.view) LW.setView(found.view); }, EDGE,
      [{ ms: 3000, what: 'view ' + to, fn: () => { LW.setView(to); return 'setView'; } }, { ms: 6000, what: 'view ' + found.view, fn: () => { LW.setView(found.view); return 'setView'; } }]);
  }
  await scene(found.uiHidden ? 'UI shown' : 'UI hidden (H)', toggleUI, toggleUI);
  /* THE HIDE EDGE (the commissioner: "I hide the interface but there's still a 1 second period of incredibly low FPS"):
     one series, 3 s with the UI shown, H, then 4 s — the bins show what the second after the press costs */
  await scene('hide edge (3 s shown → H → 4 s)', found.uiHidden ? toggleUI : null, () => { if (LW.uiHidden !== found.uiHidden) toggleUI(); }, 7000,
    [{ ms: 3000, what: 'H (UI hidden)', fn: () => { if (!LW.uiHidden) toggleUI(); return 'toggleUI'; } }]);
  await scene('frost ' + frostTo.toUpperCase(), () => { LW.setFrost(frostTo); return 'setFrost'; }, () => { LW.setFrost(found.frost); });
  await scene('card ' + cardTo, () => setCard(LW, found, cardTo), () => { setCard(LW, found, found.card); });
  {
    const pres = safe(() => LW.serialize().presentation.modwin);
    /* PACE P3 · the window's remembered presentation goes back EXACTLY: its first open prunes remembered rows for sources that no
       longer exist (modwindow.js rebuildDevices) — the first iPad run lost `modes.s3` that way */
    const modPres = safe(() => LW.mod.presentation());
    const putPres = () => { if (modPres) safe(() => LW.mod.restorePresentation(modPres)); };
    if (found.modOpen) {
      await scene('modulation window closed', () => { LW.mod.collapse(); }, () => { LW.mod.expand(); putPres(); if (found.rackHidden) document.body.classList.add('rack-hidden'); });
    } else {
      /* a window that has never been placed centres itself on its FIRST open (modwindow.js place()); spending that here
         would move where the commissioner's own first open lands, so a never-opened window is not opened for him */
      const neverPlaced = !pres || (pres.x === 0 && pres.y === 0);
      await scene('modulation window open', () => { if (neverPlaced) return 'skip: the modulation window has never been opened here — its first placement is left for the hand'; LW.mod.expand(); },
        () => { if (!neverPlaced) { LW.mod.collapse(); putPres(); if (found.rackHidden) document.body.classList.add('rack-hidden'); } });
    }
  }
  /* THE GRID EDGE and THE PROJECT OPEN LAST, so every scene above stays comparable with the earlier reports; both precede the GPU rows */
  await gridEdges();
  await projectOpen();
  return S;
}

/** a bare rAF sampler for a paused scene: every interval, stamped with the wall time it ended, until stop() */
function rafWatch() {
  const rows = []; let last = null, on = true;
  const f = (ts) => { if (last !== null) rows.push([performance.now(), ts - last]); last = ts; if (on) requestAnimationFrame(f); };
  requestAnimationFrame(f);
  return { stop() { on = false; return rows; } };
}

/** the per-frame record a played scene keeps for its windows: wall time, the rAF interval, the loop's presents / reconstructs /
 *  held frames, frames in flight, the backlog (only where completion is prompt) and the specialised pipelines pending; win(t, ms)
 *  reads the frames that ended in (t, t + ms] */
function tapRecorder(LW) {
  const field = LW.field, paced = !!safe(() => field.paced), rows = [];
  const tap = (t, gap) => rows.push([t, gap, LW.stats.presents, LW.stats.reconstructs, LW.stats.skipped || 0, safe(() => field.inFlight, 0) || 0, paced ? safe(() => field.queueMs, null) : null, safe(() => field.renderPipelines.pending, 0) || 0]);
  const win = (t0, ms) => {
    const w = rows.filter(([t]) => t > t0 && t <= t0 + ms);
    if (!w.length) return null;
    const prev = rows.filter(([t]) => t <= t0).pop() || w[0], last = w[w.length - 1];
    const qs = w.map((r) => r[6]).filter(Number.isFinite);
    return { ms, frames: w.length, maxGapMs: r1(Math.max(...w.map((r) => r[1]))), gaps100: w.filter((r) => r[1] > 100).length,
      presents: last[2] - prev[2], reconstructs: last[3] - prev[3], held: last[4] - prev[4], inFlightMax: Math.max(...w.map((r) => r[5])),
      queueMsMax: qs.length ? r1(Math.max(...qs)) : null, pipesPendingMax: Math.max(...w.map((r) => r[7])) };
  };
  return { rows, tap, win };
}

/**
 * THE GRID EDGE (2026-09-25).  The third iPad report froze the page 1.46 s (card edge, bins 15–19 empty) across a 128³ → 96³
 * change, where a grid change costs 12–35 ms on the desktop.  Three switches by the GRID segment's own road — to 96³ (64³ when
 * found at 96³), to 128³ (64³ when found at 128³), back to the grid as found — first PLAYING (3 s → A → 4 s → B → 4 s → back →
 * 4 s, 250 ms bins) and then PAUSED (500 ms quiet before each tap, the rebuild frame, then one still present), each with its
 * sub-timeline from gridProbe: the tap's synchronous part, tap → setResolution and its own ms, the queue drain behind it, the
 * first frame at the new grid (encode, reconstruct?, GPU done), the first present and reconstruct, and over the next 2 s
 * (paused 1.5 s) the worst rAF gap, the frames PACE held, in flight, the backlog and the specialised pipelines pending.
 * `firstSight`: this grid had not been on the field earlier in the report (a first allocation of that size in the run).
 * Only on a tablet or a desktop with AUTO SCALE on (a phone holds 64³).  The grid, steps and scale go back exactly (putQuality);
 * the segment is left painted on the grid as found.
 */
async function runGridEdges(LW, found, S, scene, start, say, err) {
  const field = LW.field, f0 = found.quality.res;
  const why = safe(() => LW.layout.phone.on) ? 'a phone holds 64³ (rack.js enterPhone) — the grid edge is read on a tablet or a desktop'
    : !found.auto ? 'AUTO SCALE is off here — the grid edge is read with AUTO SCALE on, as the governor meets it'
    : !PAIR[f0] ? 'the grid as found (' + f0 + '³) is not one of the GRID segment\'s options'
    : !(field && field.ok) ? 'no WebGPU field' : null;
  if (why) { S.push({ label: 'grid edge', skipped: why }, { label: 'grid edge paused', skipped: why }); return; }
  const a = f0 === 96 ? 64 : 96, b = f0 === 128 ? 64 : 128, plan = [a, b, f0], cube = (g) => g + '³';
  const seen = new Set([f0]);
  for (const s of S) for (const x of s.bins || []) if (Number.isFinite(x.field)) seen.add(x.field);
  const putGrid = async () => { if (LW.quality.res !== f0) setGrid(LW, f0); await putQuality(LW, found); };
  const tapSwitch = (P, g) => {
    const sw = P.arm(LW.quality.res, g, !seen.has(g));
    const t = performance.now(); sw.via = setGrid(LW, g); sw.callMs = r3(performance.now() - t);
    return sw;
  };
  /* every record out in the order it happened: the taps, and the rebuilds nobody tapped for (the governor's rung) */
  const records = (P, win) => P.all.map((sw) => ({ ...P.out(sw), window: win(sw) }));
  const saw = (P) => { for (const r of P.all) if (r.fieldTo) seen.add(r.fieldTo); };      // `firstSight` counts what the field took, not what was asked

  /* ── PLAYING ── */
  {
    const P = gridProbe(LW), T = tapRecorder(LW), WIN = 2000;
    let started = false;
    const tap = (t, gap) => { if (!started) { started = true; P.start(); } T.tap(t, gap); };
    const win = (sw) => T.win(sw.t, WIN);
    const at = plan.map((g, i) => ({ ms: 3000 + 4000 * i, what: 'grid ' + cube(g), fn: () => tapSwitch(P, g).via }));
    try { await scene('grid edge (3 s → ' + plan.map(cube).join(' → 4 s → ') + ' → 4 s)', null, null, 15000, at, BIN_MS, tap); }
    finally {
      await P.settled(3000);
      P.release(); saw(P);
      try { await putGrid(); } catch (e) { err('undo grid edge', e); }
    }
    const s = S[S.length - 1];                                                     // scene() always pushes its record
    if (s && /^grid edge/.test(s.label) && typeof s.skipped !== 'string') s.switches = records(P, win);   // a play's own `skipped` is the NUMBER of frames PACE held
  }

  /* ── PAUSED: the allocation apart from a play's backlog; the rebuild frame, then a present alone ── */
  {
    const label = 'grid edge paused (' + [f0, ...plan].map(cube).join(' → ') + ', the transport stopped)';
    say('scene · ' + label);
    const s = { label };
    let watch = null, P = null;
    try {
      await start();                                                   // paused and settled: the pause edge has put the governor's grid back
      P = gridProbe(LW); watch = rafWatch(); P.start();
      for (const g of plan) {
        await sleep(500);
        const sw = tapSwitch(P, g);
        await LW.settle(); sw.settleMs = r1(performance.now() - sw.t);   // the loop's REBUILD frame (rebuild · reconstruct · present), painted
        await P.settled(3000);
        await LW.settle();                                               // one still present at the new grid
        await P.settled(3000);
        saw(P);
      }
      await sleep(300);
    } catch (e) { err('scene ' + label, e); s.error = String(e && e.message || e); }
    finally {
      const rows = watch ? watch.stop() : [];
      if (P) P.release();
      try { await putGrid(); } catch (e) { err('undo ' + label, e); }
      if (P) s.switches = records(P, (sw) => {
        const w = rows.filter(([t]) => t > sw.t && t <= sw.t + 1500);
        return w.length ? { ms: 1500, frames: w.length, maxGapMs: r1(Math.max(...w.map((r) => r[1]))), gaps100: w.filter((r) => r[1] > 100).length } : null;
      });
      s.fieldResolutionEnd = field.resolution;
    }
    S.push(s);
  }
}

/**
 * THE PROFILER (project open, 2026-09-25): a stack of timed wrappers over whatever is reachable from tools/, recording only
 * inside a PHASE (run(name, fn): the synchronous extent of one call).  Each label keeps calls, INCLUSIVE ms, SELF ms (minus the
 * wrapped calls inside it) and bytes; the phase's own label is its root, so the root's self is what no wrapper could name
 * (in a project open: restore()'s control writes, the theme / card / frost / accent, the modulation window's rebuild, the
 * notebook's Markdown, serialize() — closures rack.js does not expose).  run() also wraps, for its extent only, JSON.parse /
 * JSON.stringify (bytes), localStorage getItem / setItem / removeItem (bytes) and the notebook preview's innerHTML, and takes
 * them off again before it returns.  Method wraps (wrap()) stay for the scene and pass straight through outside a phase.
 */
function profiler() {
  const acc = {}, stack = [], undo = [];
  let phase = null;
  const add = (label, incl, self, bytes) => {
    const A = acc[phase] || (acc[phase] = {}), a = A[label] || (A[label] = { n: 0, ms: 0, selfMs: 0, bytes: 0 });
    a.n++; a.ms += incl; a.selfMs += self; a.bytes += bytes || 0;
  };
  const timed = (label, orig, size) => function (...args) {
    if (!phase) return orig.apply(this, args);
    const f = { t: performance.now(), child: 0 }; stack.push(f);
    let r;
    try { r = orig.apply(this, args); return r; }
    finally {
      stack.pop(); const incl = performance.now() - f.t;
      if (stack.length) stack[stack.length - 1].child += incl;
      let b = 0; if (size) try { b = size(args, r) || 0; } catch (_) {}
      add(label, incl, incl - f.child, b);
    }
  };
  /** replace obj[key] with a timed pass-through; the undo puts the exact property back (an own one, or none) */
  const install = (list, obj, key, label, size) => {
    try {
      if (!obj || typeof obj[key] !== 'function') return false;
      const orig = obj[key], own = Object.prototype.hasOwnProperty.call(obj, key), w = timed(label, orig, size);
      obj[key] = w; if (obj[key] !== w) return false;
      list.push(() => { if (own) obj[key] = orig; else delete obj[key]; });
      return true;
    } catch (_) { return false; }
  };
  const len = (v) => (typeof v === 'string' ? v.length : 0);
  return {
    acc,
    wrap(obj, key, label) { return install(undo, obj, key, label); },
    /** fn under the phase `name`, with the per-call wraps on for its extent; returns fn's value */
    run(name, fn, previewEl) {
      const inner = [];
      const J = JSON, SP = window.Storage && Storage.prototype;
      install(inner, J, 'parse', 'JSON.parse', (a) => len(a[0]));
      install(inner, J, 'stringify', 'JSON.stringify', (a, r) => len(r));
      if (SP) {
        install(inner, SP, 'getItem', 'localStorage.getItem', (a, r) => len(r));
        install(inner, SP, 'setItem', 'localStorage.setItem', (a) => len(a[1]));
        install(inner, SP, 'removeItem', 'localStorage.removeItem');
      }
      if (previewEl) try {
        const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        const set = timed('notebook preview innerHTML', function (v) { d.set.call(this, v); }, (a) => len(a[0]));
        Object.defineProperty(previewEl, 'innerHTML', { configurable: true, get() { return d.get.call(this); }, set(v) { set.call(this, v); } });
        inner.push(() => { delete previewEl.innerHTML; });
      } catch (_) {}
      const was = phase; phase = name;
      const root = timed(name, fn);
      try { return root(); }
      finally { phase = was; for (let i = inner.length - 1; i >= 0; i--) try { inner[i](); } catch (_) {} }
    },
    release() { for (let i = undo.length - 1; i >= 0; i--) try { undo[i](); } catch (_) {} undo.length = 0; },
    /** a phase's labels, heaviest SELF first, rounded */
    out(name) {
      const A = acc[name] || {};
      return Object.entries(A).map(([label, a]) => ({ label, n: a.n, ms: r3(a.ms), selfMs: r3(a.selfMs), bytes: a.bytes || undefined }))
        .sort((x, y) => y.selfMs - x.selfMs);
    },
  };
}

/** the notebook as the page shows it — nothing of it is in serialize(), and a project open rewrites all of it (show('notes'),
 *  the file's text / title / subtitle, the rendered preview, the PROJECTS status line, the focus) */
function notebookSnapshot() {
  const nb = document.getElementById('notebook'); if (!nb) return null;
  const q = (x) => nb.querySelector(x), sub = q('.nb-subtitle');
  return { nb, hidden: nb.hidden, face: nb.dataset.face, mode: nb.dataset.mode, style: nb.getAttribute('style'),
    faces: ['.nb-notes', '.nb-aboutface', '.nb-projectsface'].map((x) => { const e = q(x); return e ? [e, e.hidden] : null; }),
    text: q('.nb-text') ? q('.nb-text').value : null, title: q('.nb-title') ? q('.nb-title').value : null, sub: sub ? [sub.value, sub.hidden] : null,
    view: q('.nb-view') ? q('.nb-view').innerHTML : null, status: q('.pj-status') ? q('.pj-status').textContent : null, active: document.activeElement };
}
function notebookPut(S) {
  if (!S) return;
  const { nb } = S, q = (x) => nb.querySelector(x);
  nb.hidden = S.hidden;
  if (S.face === undefined) delete nb.dataset.face; else nb.dataset.face = S.face;
  if (S.mode === undefined) delete nb.dataset.mode; else nb.dataset.mode = S.mode;
  if (S.style === null) nb.removeAttribute('style'); else nb.setAttribute('style', S.style);
  for (const f of S.faces) if (f) f[0].hidden = f[1];
  if (S.text !== null) q('.nb-text').value = S.text;
  if (S.title !== null) q('.nb-title').value = S.title;
  if (S.sub) { q('.nb-subtitle').value = S.sub[0]; q('.nb-subtitle').hidden = S.sub[1]; }
  if (S.view !== null && q('.nb-view').innerHTML !== S.view) q('.nb-view').innerHTML = S.view;
  if (S.status !== null) q('.pj-status').textContent = S.status;
  if (document.activeElement !== S.active) { try { if (S.active && S.active !== document.body && S.active.focus) S.active.focus({ preventScroll: true }); else if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (_) {} }
}

/**
 * THE PROJECT OPEN (2026-09-25).  The third and fourth iPad reports each froze 1.3–1.5 s where a hand opened NOTEBOOK →
 * PROJECTS → WAVE DANCER mid-run (the four keys it writes, the register → 2s, the look → phase/signed, the transport stopped).
 * Played as found: at 3 s the WAVE DANCER button is CLICKED (the demo's own road: fetch → projects.importText → projects.open →
 * restore(file, { project: true })), at 7 s the state as found goes back through __LW.restore(snapshot) — a second open — then 4 s.
 * Each of the two is timed: its synchronous ms, the style + layout it left to the next frame (forced and timed right after it),
 * the loop's REBUILD frame after it (gridProbe: the grid rebuilt or not, encode, GPU done), and over the next 2 s the worst rAF
 * gap, presents / reconstructs, held, in flight, the backlog and LW.perf.loopMedian before and after; plus the breakdown of the
 * synchronous ms by the profiler above.  THE PUT-BACK, and what it cannot do: serialize() comes back through the restore; the
 * stored projects and the three notebook keys go back byte for byte; the notebook's face, size, text, preview, status and the
 * focus go back as found; the demo stops being the CURRENT project (projects.remove of the copy the open made current, then the
 * stored collection as found); the unsaved-changes mark is re-armed against the state as found (projects.markClean — a page
 * that never opened a project had none armed, so that guard now asks after a later edit); and THE UNDO RING is cleared to one
 * row, the state as found (a project open clears it and its rows cannot be written back from outside: the one thing this
 * scene cannot put back, and `restored.history` says so).  Skipped on a phone, while a project is current (opening another
 * would change the file SAVE writes) or dirty, and where the button is not in the page.
 */
async function runProjectOpen(LW, found, S, scene, say, err) {
  const label = 'project open (3 s → WAVE DANCER → 4 s → the state as found → 4 s)';
  const P0 = safe(() => LW.projects), field = LW.field;
  const demo = () => document.querySelector('#notebook .pj-demo[data-file="wave-dancer"]');
  const why = safe(() => LW.layout.phone.on) ? 'a phone — the project open is read on a tablet or a desktop'
    : !P0 || typeof P0.open !== 'function' ? 'no projects (NOTEBOOK) in this page'
    : !demo() ? 'no WAVE DANCER button in the page'
    : P0.current ? 'a project is current here (' + P0.current + ') — opening another would change the file SAVE writes, which cannot be put back'
    : P0.dirty ? 'the project has unsaved changes — the report does not open another over them'
    : !(field && field.ok) ? 'no WebGPU field' : null;
  if (why) { S.push({ label, skipped: why }); return; }
  const KEYS = ['lambdawaves.q0.projects', 'lambdawaves.q0.notebook', 'lambdawaves.q0.notebook.title', 'lambdawaves.q0.notebook.subtitle'];
  const stored = Object.fromEntries(KEYS.map((k) => [k, safe(() => localStorage.getItem(k))]));
  const nbFound = notebookSnapshot(), ringFound = historyState(LW);
  const snap = JSON.stringify(LW.serialize());
  const preview = document.querySelector('#notebook .nb-view');
  const P = gridProbe(LW), T = tapRecorder(LW), prof = profiler(), WIN = 2000;
  const ev = { click: null, importText: null, open: null, restore: null };
  let opened = null; const openDone = new Promise((r) => { opened = r; });

  /* the reachable seams restore() calls through an object (the rest are closures — they land in the phase's own self ms; MIR's
     modulation host objects are frozen, so their four refuse the wrap and stay in the self ms too — `seams` lists what took) */
  const host = safe(() => LW.mod.host), pal = safe(() => LW.palette);
  const seams = [
    [LW.reg, 'restore', 'reg.restore'], [LW.layout, 'applyLayout', 'layout.applyLayout'], [LW.layout, 'captureLayout', 'layout.captureLayout (in serialize)'],
    [LW.layout, 'notebookResize', 'layout.notebookResize'], [LW.ladder, 'load', 'ladder.load'], [LW.molecule, 'load', 'molecule.load'],
    [LW.helium, 'load', 'helium.load'], [LW.h2, 'load', 'h2.load'], [LW.chem, 'load', 'chem.load'], [LW.qcd, 'load', 'qcd.load'], [LW.slice, 'load', 'slice.load'],
    [LW.spectrum, 'select', 'spectrum.select'], [LW.spectrum, 'setDials', 'spectrum.setDials'],
    [pal, 'select', 'palette.select'], [pal, 'load', 'palette.load'], [pal, 'setOn', 'palette.setOn'],
    [LW.fieldlines, 'setOverlay', 'fieldlines.setOverlay'], [LW.fieldlines, 'setLines', 'fieldlines.setLines'], [LW.fieldlines, 'setSource', 'fieldlines.setSource'],
    [LW.particles, 'setOn', 'particles.setOn'], [LW.particles, 'seed', 'particles.seed'], [LW.particles, 'resetClock', 'particles.resetClock'],
    [LW.dynamics, 'clearHistory', 'dynamics.clearHistory'], [LW.shadowView, 'clearTrail', 'shadowView.clearTrail'], [LW.shadowView, 'setMode', 'shadowView.setMode'],
    [LW.camera, 'setAutoRotate', 'camera.setAutoRotate'], [LW.vortex, 'setOn', 'vortex.setOn'], [LW.kepler, 'setOn', 'kepler.setOn'],
    [host && host.model, 'deserialize', 'modulation model.deserialize'], [host && host.registry, 'restoreAll', 'modulation registry.restoreAll'],
    [host && host.targets, 'sync', 'modulation targets.sync'], [host && host.clock, 'applyAll', 'modulation clock.applyAll'],
  ];
  const wrapped = seams.filter(([o, k, l]) => prof.wrap(o, k, l)).map((x) => x[2]);

  /* the demo's own road: the button's handler calls projects.importText then projects.open — both through the object */
  const reading = () => ({ loopMedianMs: r3(safe(() => LW.perf.loopMedian)), inFlight: safe(() => field.inFlight), queueMs: safe(() => field.paced) ? r1(safe(() => field.queueMs)) : null,
    field: field.resolution, gov: safe(() => LW.governor.state), autoScale: LW.quality.autoScale, playing: !!LW.clock.playing, pipesPending: safe(() => field.renderPipelines.pending) });
  const origImport = P0.importText, origOpen = P0.open, ownImport = Object.prototype.hasOwnProperty.call(P0, 'importText'), ownOpen = Object.prototype.hasOwnProperty.call(P0, 'open');
  P0.importText = function (text) {
    const t = performance.now(); ev.importText = { afterClickMs: ev.click ? r1(t - ev.click.t) : null, bytes: typeof text === 'string' ? text.length : null };
    const r = prof.run('importText', () => origImport.call(this, text));
    ev.importText.syncMs = r3(performance.now() - t); ev.importText.path = r; return r;
  };
  P0.open = function (path) {
    const rec = ev.open = { t: performance.now(), path, afterClickMs: ev.click ? r1(performance.now() - ev.click.t) : null, before: reading() };
    rec.sw = P.arm(field.resolution, null, null, true);
    let ok = false;
    try { ok = prof.run('open', () => origOpen.call(this, path), preview); }
    finally {
      rec.syncMs = r3(performance.now() - rec.t);
      const t1 = performance.now(); void document.body.offsetHeight; rec.styleLayoutMs = r3(performance.now() - t1);   // what the open left to the next frame's style + layout
      rec.ok = ok; opened(rec);
    }
    return ok;
  };
  /* THE A/B TRANSITION: WAVE DANCER leaves one running, and restore() writes the file's register FIRST and turns the transition
     off AFTER (`ui.ab.set(pr.ab)`), which freezes the demo's mix over the register it has just restored — measured: the modes came
     back as the demo's.  The undo road stands the transition down before it restores (rack.js hWrite: "freeze the mix first: the
     anchor restored below is the truth"); the put-back takes that road (LW.ab.set(false)), timed apart.  restore() also writes
     mat.finish = 'lit' where the state as found had no finish (the same look): the key goes back to absent. */
  const foundMat = safe(() => JSON.parse(snap).presentation.mat, {}) || {};
  const restoreFound = (why) => {
    const rec = { t: performance.now(), why, before: reading() };
    const obj = JSON.parse(snap), ab = safe(() => LW.ab);
    if (safe(() => LW.reg.transition) && ab && typeof ab.set === 'function') { const t = performance.now(); ab.set(false); rec.abStoodDownMs = r3(performance.now() - t); }
    rec.sw = P.arm(field.resolution, null, null, true);
    const t0 = performance.now();
    let ok = false;
    try { ok = prof.run('restore', () => LW.restore(obj), preview); }
    finally {
      rec.syncMs = r3(performance.now() - t0); const t1 = performance.now(); void document.body.offsetHeight; rec.styleLayoutMs = r3(performance.now() - t1); rec.ok = ok;
      if (!('finish' in foundMat) && LW.mat.finish === 'lit') delete LW.mat.finish;
    }
    return rec;
  };

  let started = false, s = null;
  const tap = (t, gap) => {
    if (!started) { started = true; P.start(); }
    T.tap(t, gap);
    for (const rec of [ev.open, ev.restore]) if (rec && rec.after === undefined && t >= rec.t + WIN) rec.after = reading();   // LW.perf.loopMedian 2 s on
  };
  const at = [
    { ms: 3000, what: 'WAVE DANCER', fn: () => { ev.click = { t: performance.now(), before: reading() }; demo().click(); ev.click.syncMs = r3(performance.now() - ev.click.t); return 'pj-demo'; } },
    { ms: 7000, what: 'the state as found', fn: () => { if (!ev.open || !ev.open.ok) return 'skipped: the demo had not opened'; ev.restore = restoreFound('in play'); return '__LW.restore'; } },
  ];
  try { await scene(label, null, null, 11000, at, BIN_MS, tap); s = S[S.length - 1]; }
  finally {
    try {
      /* the handler's fetch may still be in flight: the open lands first, then everything goes back */
      if (ev.click && !ev.open) await Promise.race([openDone, sleep(10000)]);
      if (ev.open && ev.open.ok && !(ev.restore && ev.restore.ok)) { await LW.settle(); ev.restore = restoreFound('after the play (the open came late)'); }
      await P.settled(3000);
      await sleep(600);                                                          // the restore's own tails (a deferred scan, the ring's quiet window)
    } catch (e) { err('put back ' + label, e); }
    prof.release(); P.release();
    if (P0.importText !== origImport) { if (ownImport) P0.importText = origImport; else delete P0.importText; }
    if (P0.open !== origOpen) { if (ownOpen) P0.open = origOpen; else delete P0.open; }
    const residue = {};
    try {
      if (P0.current) { residue.current = 'the open made ' + P0.current + ' current — removed, then the stored collection as found'; P0.remove(P0.current); }
      for (const k of KEYS) { const v = stored[k]; if (localStorage.getItem(k) !== v) { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } }
      if (nbFound && nbFound.face === 'projects' && !nbFound.hidden && LW.notebook) LW.notebook.open('projects');   // its list re-renders from the collection as found
      notebookPut(nbFound);
      if (LW.history) { LW.history.clear(); residue.undoRing = 'cleared to one row, the state as found (' + (ringFound ? ringFound.rows + ' row' + (ringFound.rows === 1 ? '' : 's') + ', cursor ' + ringFound.cursor : '?') + ' before) — a project open clears it and its rows cannot be written back'; }
      P0.markClean(); residue.unsavedGuard = 're-armed against the state as found (projects.markClean)';
      residue.after = { current: P0.current, dirty: P0.dirty, storage: KEYS.every((k) => safe(() => localStorage.getItem(k)) === stored[k]) ? 'identical' : 'DIFFERENT' };
    } catch (e) { err('put back ' + label, e); }
    found.projectScene = { ringFound, residue };
  }
  if (!s || typeof s.skipped === 'string') return;
  const one = (rec) => (rec ? { why: rec.why, path: rec.path, ok: rec.ok, afterClickMs: rec.afterClickMs, abStoodDownMs: rec.abStoodDownMs, syncMs: rec.syncMs, styleLayoutMs: rec.styleLayoutMs, before: rec.before, after: rec.after || null,
    rebuildFrame: rec.sw ? P.out(rec.sw) : null, window: T.win(rec.t, WIN) } : null);
  s.projectOpen = { demo: 'wave-dancer', click: ev.click ? { syncMs: ev.click.syncMs } : null, importText: ev.importText, open: one(ev.open), restore: one(ev.restore),
    breakdown: { importText: prof.out('importText'), open: prof.out('open'), restore: prof.out('restore') }, seams: wrapped, residue: found.projectScene.residue };
}

/** one line for the console and the toast */
export function summaryLine(R, bytes) {
  const a = R.adapter && R.adapter.info ? [R.adapter.info.vendor, R.adapter.info.architecture].filter(Boolean).join(' ') || 'adapter (no info)' : 'no adapter';
  const g = R.gpu && R.gpu.rows ? R.gpu.rows.filter((r) => r.frameMs !== undefined).map((r) => r.grid + ':' + r.frameMs.toFixed(2)).join(' ') : 'gpu —';
  const sc = Array.isArray(R.scenes) ? R.scenes.map((s) => (s.skipped ? s.label.split(' (')[0] + ' skip' : [s.label.split(' (')[0].replace('modulation window', 'mod'),
    s.error ? 'error' : s.rafFps !== undefined ? s.rafFps : null,
    Array.isArray(s.switches) ? '[worst gap ms ' + s.switches.map((w) => (w.window ? Math.round(w.window.maxGapMs) : '—')).join('/') + ']' : null,
    s.projectOpen ? '[open ' + (s.projectOpen.open ? Math.round(s.projectOpen.open.syncMs) : '—') + ' ms · restore ' + (s.projectOpen.restore ? Math.round(s.projectOpen.restore.syncMs) : '—') + ' ms]' : null].filter((x) => x !== null).join(' '))).join(' · ') : 'scenes —';
  const s = R.settings && R.settings.quality ? R.settings.quality : {};
  const lp = Array.isArray(R.scenes) ? R.scenes.find((x) => /^long play/.test(x.label) && !x.skipped && !x.error) : null;
  return 'λWAVES device report · ' + R.device + ' · ' + a + ' · dpr ' + (R.platform && R.platform.dpr) + ' cap ' + (R.platform && R.platform.dprCap)
    + ' · display ' + (R.display ? R.display.rafHz : '?') + ' Hz · ' + s.res + '³/' + s.steps + '/' + s.scale + ' · paced ' + (R.pace ? R.pace.paced : '?')
    + (lp ? ' · long play ' + lp.rafFps + ' fps, ' + lp.presents + ' presents, ' + lp.skipped + ' held, queue ≤ ' + (lp.queueMsMax === null ? '—' : lp.queueMsMax + ' ms') : '') + ' · fps ' + sc + ' · gpu ms ' + g
    + ' · ' + (R.backdrops ? R.backdrops.layers : '?') + ' backdrops · ' + (R.dom ? R.dom.elements : '?') + ' els · restored ' + (R.restored ? R.restored.serialize + '/' + R.restored.settingsKey : '?')
    + (bytes ? ' · ' + bytes + ' B' : '');
}

/**
 * run(LW, params, t) — the one door rack.js opens.  `params` a URLSearchParams = the flag's road (`?report=1`, t is the
 * moment __LW.ready was set); anything else = `__LW.report(opts)` from a console (resolves the object, logs one line).
 */
export async function run(LW, params, t) {
  if (params instanceof URLSearchParams) return runFromFlag(LW, params, t);
  const R = await deviceReport(LW, { ...(params || {}) });
  LW.lastReport = R;
  try { console.log(summaryLine(R)); } catch (_) {}
  return R;
}

/* ══ THE FLAG · `?report=1` ═══════════════════════════════════════════════════════════════════════════════
 * Runs once, after __LW.ready AND after the photosensitivity notice has been accepted (nothing plays before it);
 * under prefers-reduced-motion it waits for a RUN press instead of starting the field by itself (?play=1's law).
 * THE POST RULE: `post=1` always POSTs the JSON to `${origin}/report`; `post=0` never does; with neither, it POSTs
 * only when the page was served from a private-LAN address (10/8, 172.16/12, 192.168/16, *.local) — the LAN dev
 * server (serve-lan.py) — and never from loopback or a public host, where nothing is listening and a device's
 * details have no business going.  Either way the toast offers COPY, so a device with no POST route can still
 * hand the report over by pasting it. */
let flagRan = false;
async function runFromFlag(LW, qs, readyAt) {
  if (flagRan) return null; flagRan = true;
  const host = location.hostname;
  const post = qs.get('post') === '1' ? true : qs.get('post') === '0' ? false : PRIVATE_LAN.test(host) && !LOOPBACK.test(host);
  const toast = makeToast();
  toast.say('device report · waiting for the instrument…');
  for (let i = 0; i < 600 && !LW.ready; i++) await sleep(50);
  await new Promise((r) => { try { LW.warning.onAccept(r); } catch (_) { r(); } });
  if (safe(() => LW.motion.reduced)) await toast.ask('reduced motion is on — the report plays the field for about a minute. Press RUN to measure.', 'RUN');
  const only = ['grid', 'project'].includes(qs.get('only')) ? { only: qs.get('only'), gpu: false } : {};   // `&only=grid` (~25 s) · `&only=project` (~15 s): that scene alone, no GPU rows
  toast.say('device report · measuring — hands off the screen for about ' + (only.only ? 'half a minute' : 'three minutes'));
  let R;
  try { R = await deviceReport(LW, { readyAt, skipEl: toast.root, onProgress: (t) => toast.say('device report · ' + t + ' — hands off'), ...only }); }
  catch (e) { R = { kind: 'lambdawaves-device-report', device: deviceLabel(), at: new Date().toISOString(), errors: ['report threw: ' + String(e && e.message || e)] }; }
  LW.lastReport = R;
  const json = JSON.stringify(R);
  const bytes = new TextEncoder().encode(json).length;
  try { console.log(summaryLine(R, bytes)); } catch (_) {}
  let sent = false, why = post ? '' : 'no POST (post=1 sends it)';
  if (post) {
    try {
      const res = await fetch(location.origin + '/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json, cache: 'no-store' });
      sent = res.ok; if (!sent) why = 'POST answered ' + res.status;
    } catch (e) { why = 'POST failed: ' + String(e && e.message || e); }
  }
  toast.done(sent ? 'report sent · ' + bytes + ' bytes' : 'report ready · ' + bytes + ' bytes (' + why + ') — press COPY and paste it to Claude', json, summaryLine(R));
  return R;
}

/* the toast: a plain, transient status line that exists only while the flag is in the URL — no stylesheet, no glass */
function makeToast() {
  const root = document.createElement('div');
  root.setAttribute('role', 'status'); root.dataset.deviceReport = '1';
  root.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;max-width:min(92vw,620px);box-sizing:border-box;'
    + 'padding:10px 12px;border-radius:10px;background:rgba(10,14,22,.94);color:#e9eef7;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;'
    + 'box-shadow:0 4px 18px rgba(0,0,0,.35);pointer-events:auto;';
  const line = document.createElement('div'); line.style.cssText = 'white-space:pre-wrap;word-break:break-word;';
  const row = document.createElement('div'); row.style.cssText = 'display:none;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap;';
  const btn = (t) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.style.cssText = 'font:inherit;font-weight:700;padding:6px 12px;border-radius:7px;border:1px solid #6f86b8;background:#1d2a44;color:#fff;cursor:pointer;'; return b; };
  root.append(line, row); document.body.appendChild(root);
  const say = (t) => { line.textContent = t; };
  return {
    root, say,
    ask(text, label) { say(text); row.textContent = ''; row.style.display = 'flex'; const b = btn(label); row.appendChild(b); return new Promise((r) => b.addEventListener('click', () => { row.style.display = 'none'; r(); }, { once: true })); },
    done(text, json, summary) {
      say(text + (summary ? '\n' + summary : ''));
      row.textContent = ''; row.style.display = 'flex';
      const copy = btn('COPY'), close = btn('×');
      const area = document.createElement('textarea');
      area.readOnly = true; area.value = json; area.style.cssText = 'display:none;width:100%;height:120px;font:11px/1.3 ui-monospace,monospace;background:#0b0f18;color:#cfd8e8;border:1px solid #33415f;border-radius:6px;';
      copy.addEventListener('click', async () => {
        let ok = false;
        try { await navigator.clipboard.writeText(json); ok = true; } catch (_) {}
        if (!ok) { area.style.display = 'block'; area.focus(); area.select(); area.setSelectionRange(0, json.length); try { ok = document.execCommand('copy'); } catch (_) {} }
        say(ok ? 'report copied — paste it to Claude' : 'select the text below and copy it — then paste it to Claude');
      });
      close.addEventListener('click', () => root.remove());
      row.append(copy, close, area);
    },
  };
}
