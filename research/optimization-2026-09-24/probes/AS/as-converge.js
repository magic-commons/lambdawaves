/* probes/AS/as-converge.js — the AUTO SCALE rule's gate (AS, 2026-09-25), adapted from probes/W125/w125-pause-edge.js:
 * the AXIAL GAS at 128³ with the gas table OFF (the slow frame) + GLASS, UI hidden, AUTO SCALE on, GOVERNOR OFF.
 *   A. from a paused picture at scale 1: PLAY and trace every rAF for __AS_SECS s (default 12): the interval, autoScale;
 *      when a rolling median of 9 intervals first meets budget·4/3 (read the same way on both trees); every scale change.
 *   B. PAUSE → the edge puts autoScale back to 1 (W125-2 kept) → PLAY: the first decision after play (time, scale) against
 *      the scale A settled on.
 *   C. AUTO SCALE switch OFF (the real button) → autoScale 1 while playing 1.5 s → ON: the first decision (time, scale).
 *   E. an exact export (captureUI.exact, 3 frames 160×90) with AUTO SCALE on and autoScale forced to 0.5: the frame digests
 *      (H3 pins quality.auto off for the run, so the base and the built tree must agree byte for byte).
 *   PRE="globalThis.__AS_TAB=true;" runs the same scenes with the shipped gas table ON (a present-bound frame in headless
 *   Firefox: 66–83 ms at scales 1/0.7, 17 ms at 0.5 — a scale that meets the budget exists, so A's meet times are real).
 *   Firefox: LW_PORT=<port> GD_PORT=5249 node research/optimization-2026-09-24/probes/A/run.mjs <this> <out> */
const LW = __LW, SECS = globalThis.__AS_SECS || 12;
const canvas = document.getElementById('field');
const raf = () => new Promise((r) => requestAnimationFrame((t) => r(t)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BUDGET = 1000 / 60, OVER = BUDGET * 4 / 3;       // headless Firefox delivers 60 Hz: both modes' budget is 16.7 ms
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const TAB = !!globalThis.__AS_TAB;                        // default: the table OFF (?gastab=0's scene); __AS_TAB = true: the shipped table
if (!TAB) { LW.gasTable(false); for (let i = 0; i < 100 && LW.gasTable() !== 'off'; i++) await sleep(10); }
LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.enterBox(); LW.pause();
if (TAB) for (let i = 0; i < 300 && LW.gasTable() !== 'on'; i++) await sleep(50);   // the table builds in idle slices after the first AXIAL launch
LW.quality.res = 128; LW.quality.steps = 240; LW.quality.scale = 1; LW.schedule(4); await LW.settle();
LW.setStyle('glass');
LW.governor.on = false; LW.quality.auto = true; LW.quality.autoScale = 1;
if (!LW.uiHidden) LW.keys.toggleUI();
await LW.settle(); await raf(); await raf();
const out = { table: LW.gasTable(), style: LW.mat.style, fullWidth: canvas.width, budgetMode: LW.perf.mode, budgetMs: +BUDGET.toFixed(2) };
/* trace(ms): play-time series from NOW; returns the decisions and the first-meet times */
async function trace(ms, t0) {
  const iv = [], changes = []; let last = await raf(), prev = LW.quality.autoScale, medMeet = null, firstDecision = null; const c0 = LW.autoQ.changes;
  while (performance.now() - t0 < ms) {
    const t = await raf(); const d = t - last; last = t; iv.push(d);
    const s = LW.quality.autoScale, tt = +(performance.now() - t0).toFixed(0);
    if (s !== prev) { changes.push([tt, s, canvas.width]); prev = s; }
    if (firstDecision === null && LW.autoQ.changes !== c0) firstDecision = { t: tt, scale: s };
    if (medMeet === null && iv.length >= 9 && med(iv.slice(-9)) <= OVER) medMeet = { t: tt, scale: s };
  }
  const tail = iv.slice(-Math.min(60, iv.length));
  return { frames: iv.length, changes, firstDecision, medianMeet: medMeet, end: { autoScale: LW.quality.autoScale, cw: canvas.width, k: LW.autoQ.k, tailMedianMs: +med(tail).toFixed(1) } };
}
/* A */
{ const t0 = performance.now(); LW.play(); out.A = await trace(SECS * 1000, t0); }
const settled = out.A.end.autoScale;
/* B */
LW.pause(); await raf(); out.B = { edgeAutoScale: LW.quality.autoScale }; for (let i = 0; i < 5; i++) await raf();
out.B.pausedAutoScale = LW.quality.autoScale; out.B.pausedCw = canvas.width;
{ const t0 = performance.now(); LW.play(); await raf(); out.B.firstPlayFrameAutoScale = LW.quality.autoScale; const r = await trace(4000, t0); Object.assign(out.B, r); out.B.settledInA = settled; out.B.firstDecisionWithinOneStep = r.firstDecision ? Math.abs(r.firstDecision.scale - settled) <= 0.05 + 1e-9 : null; }
/* C */
const btn = [...document.querySelectorAll('button.sw')].find((b) => b.textContent.trim() === 'AUTO SCALE');
out.C = { button: !!btn, before: LW.quality.autoScale };
if (btn) {
  btn.click(); out.C.afterOff = { auto: LW.quality.auto, autoScale: LW.quality.autoScale };
  await sleep(1500); out.C.offPlaying = { autoScale: LW.quality.autoScale, cw: canvas.width, auto: LW.quality.auto };
  const t0 = performance.now(); btn.click(); out.C.afterOn = { auto: LW.quality.auto, autoScale: LW.quality.autoScale };
  const r = await trace(3000, t0); Object.assign(out.C, r);
}
LW.pause(); await LW.settle();
/* E */
try {
  LW.quality.auto = true; LW.quality.autoScale = 0.5;
  const ex = LW.captureUI.exact;
  const sched = { N: 3, fps: 12, mode: 'given', at: (k) => k * 0.25, off: (k) => k * 0.25 };
  const r = await ex.render({ schedule: sched, width: 160, height: 90, deflate: 'stored', label: 'as' }).done;
  out.E = r.ok ? { ok: true, digests: r.manifest.frames.map((f) => f.digest).join(','), autoAfter: LW.quality.auto, autoScaleAfter: LW.quality.autoScale } : { ok: false, err: r.message || r.error };
} catch (e) { out.E = { threw: String(e) }; }
if (LW.uiHidden) LW.keys.toggleUI();
out.errs = (window.__e || []).map(String).slice(0, 5);
return out;
