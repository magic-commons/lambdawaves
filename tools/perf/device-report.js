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
 *              HIDE EDGE (3 s shown → H → 4 s) · frost flipped · card flipped · the modulation window flipped.
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

/**
 * deviceReport(LW, opts) → one JSON-safe object.
 *   opts.targetMs     the throughput batch floor (1500)          opts.sceneMs   one scene's play (3000)
 *   opts.grids        [64, 96, 128]                              opts.scenes / opts.gpu   false skips that part
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
  const o = { targetMs: 1500, sceneMs: 3000, grids: [64, 96, 128], scenes: true, gpu: true, ...opts };
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
      playing: found.playing, rate: clock.rate, frame: mat.frame !== false, frameMode: mat.frameMode, axis: mat.axis !== false,
      openWindows: document.querySelectorAll('.dev:not(.closed)').length, floating: document.querySelectorAll('#floats .dev:not(.closed)').length,
      palette: safe(() => LW.paletteId),
    };
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
    serialize: found.playing ? 'not comparable (the transport was playing when the report began)' : proofBefore.serialize === proofAfter.serialize ? 'identical' : 'DIFFERENT',
    serializeBytes: proofAfter.serialize ? proofAfter.serialize.length : null,
    settingsKey: proofBefore.storage[SETTINGS_KEY] === proofAfter.storage[SETTINGS_KEY] ? 'identical' : 'DIFFERENT',
    localStorage: changedKeys.length ? 'DIFFERENT: ' + changedKeys.join(', ') : 'identical',
    history: JSON.stringify(proofBefore.history) === JSON.stringify(proofAfter.history) ? 'identical' : 'DIFFERENT',
    card: LW.cardStyle === found.card ? 'identical' : 'DIFFERENT',
    cardRoad: found.cardChosen ? 'setCardStyle (this browser had already chosen a card)' : 'the data-card attribute only (setCardStyle would have recorded a first choice)',
    frost: LW.frost === found.frost ? 'identical' : 'DIFFERENT',
    viewStyle: VIEW_NAMES[LW.mat.view] === found.view && STYLE_NAMES[LW.mat.style] === found.style ? 'identical' : 'DIFFERENT',
    autoScaleSwitch: LW.quality.auto === found.auto && (!autoSwitch() || autoSwitch().classList.contains('on') === !!found.auto) ? 'identical' : 'DIFFERENT',
    bodyClass: document.body.className === found.bodyClass ? 'identical' : 'DIFFERENT: ' + document.body.className,
    traces: 'a play advances the SHADOW trail, the dynamics history and particles; none is project state',
  };
  if (R.restored.serialize === 'DIFFERENT') R.restored.serializeFirstDiff = firstDiff(proofBefore.serialize, proofAfter.serialize);
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
  if (!found.playing) { if (LW.clock.t !== found.t) LW.scrub(found.t); }
  else LW.play();
  await LW.settle(); await LW.settle();
  /* a class toggled off and on comes back at the END of the list; the same set is put back in the order it was found */
  const now = document.body.className, a = now.split(/\s+/).filter(Boolean).sort().join(' '), b = found.bodyClass.split(/\s+/).filter(Boolean).sort().join(' ');
  if (now !== found.bodyClass && a === b) document.body.className = found.bodyClass;
}

/** one play, binned: rAF frames per BIN_MS, each bin with the state at its first frame and the loop's presents /
 *  reconstructs inside it; `at` = [{ ms, what, fn }] fired once each, from inside the rAF */
async function play(LW, ms, at = []) {
  const field = LW.field, q = LW.quality, gov = LW.governor, st = LW.stats;
  const nb = Math.ceil(ms / BIN_MS);
  const bins = Array.from({ length: nb }, () => ({ n: 0, maxMs: 0, presents: 0, reconstructs: 0, s: null }));
  const iv = []; let last = null;
  const f0 = st.frames, p0 = st.presents, rc0 = st.reconstructs, g0 = safe(() => gov.changes, 0);
  let lp = st.presents, lr = st.reconstructs;
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
      const B = bins[Math.min(nb - 1, Math.floor(el / BIN_MS))];
      B.n++;
      if (iv.length) B.maxMs = Math.max(B.maxMs, iv[iv.length - 1]);
      B.presents += st.presents - lp; B.reconstructs += st.reconstructs - lr; lp = st.presents; lr = st.reconstructs;
      if (!B.s) B.s = stateSample(LW);
      if (q.autoScale < minScale) minScale = q.autoScale;
      if (frostSeen === null && el > ms / 2) frostSeen = safe(() => LW.frostLive);
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
    minAutoScale: minScale, governorChanges: safe(() => gov.changes, 0) - g0, governorEnd: safe(() => gov.state), frostLiveMidScene: frostSeen,
    stepCapInPlay: r3(safe(() => field.stepCap)), fieldResolutionEnd: safe(() => field.resolution),
    binMs: BIN_MS,
    bins: bins.map((B) => ({ fps: Math.round(B.n / (BIN_MS / 1000)), maxMs: r1(B.maxMs), presents: B.presents, reconstructs: B.reconstructs, ...(B.s || { gap: true }) })),
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
  const scene = async (label, apply, undo, ms, at) => {
    say('scene · ' + label);
    const s = { label };
    try {
      if (apply) { const why = await apply(); if (typeof why === 'string' && why.startsWith('skip:')) { s.skipped = why.slice(5).trim(); return S.push(s); } if (typeof why === 'string') s.via = why; }
      await start();
      s.backdrops = safe(() => backdropInventory(skipEl));
      Object.assign(s, await play(LW, ms || o.sceneMs, at));
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

  await scene(found.uiHidden ? 'as found (UI hidden)' : 'as found (UI shown)');
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
    if (found.modOpen) {
      await scene('modulation window closed', () => { LW.mod.collapse(); }, () => { LW.mod.expand(); if (found.rackHidden) document.body.classList.add('rack-hidden'); });
    } else {
      /* a window that has never been placed centres itself on its FIRST open (modwindow.js place()); spending that here
         would move where the commissioner's own first open lands, so a never-opened window is not opened for him */
      const neverPlaced = !pres || (pres.x === 0 && pres.y === 0);
      await scene('modulation window open', () => { if (neverPlaced) return 'skip: the modulation window has never been opened here — its first placement is left for the hand'; LW.mod.expand(); },
        () => { if (!neverPlaced) { LW.mod.collapse(); if (found.rackHidden) document.body.classList.add('rack-hidden'); } });
    }
  }
  return S;
}

/** one line for the console and the toast */
export function summaryLine(R, bytes) {
  const a = R.adapter && R.adapter.info ? [R.adapter.info.vendor, R.adapter.info.architecture].filter(Boolean).join(' ') || 'adapter (no info)' : 'no adapter';
  const g = R.gpu && R.gpu.rows ? R.gpu.rows.filter((r) => r.frameMs !== undefined).map((r) => r.grid + ':' + r.frameMs.toFixed(2)).join(' ') : 'gpu —';
  const sc = Array.isArray(R.scenes) ? R.scenes.map((s) => (s.skipped ? s.label.split(' (')[0] + ' skip' : s.label.split(' (')[0].replace('modulation window', 'mod') + ' ' + s.rafFps)).join(' · ') : 'scenes —';
  const s = R.settings && R.settings.quality ? R.settings.quality : {};
  return 'λWAVES device report · ' + R.device + ' · ' + a + ' · dpr ' + (R.platform && R.platform.dpr) + ' cap ' + (R.platform && R.platform.dprCap)
    + ' · display ' + (R.display ? R.display.rafHz : '?') + ' Hz · ' + s.res + '³/' + s.steps + '/' + s.scale + ' · fps ' + sc + ' · gpu ms ' + g
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
  toast.say('device report · measuring — hands off the screen for about three minutes');
  let R;
  try { R = await deviceReport(LW, { readyAt, skipEl: toast.root, onProgress: (t) => toast.say('device report · ' + t + ' — hands off') }); }
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
