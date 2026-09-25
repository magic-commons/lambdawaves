/* probes/AS/as-w125-pause-edge.js — a copy of probes/W125/w125-pause-edge.js for AS (2026-09-25), reading autoQ.k where the
 * built tree has no autoQ.ema (AS judges a window median, not an EMA); otherwise unchanged.
 * W125-2's gate, adapted from probes/A/governor.js (AUDIT-A FA4): the AXIAL GAS at 128³
 * with the gas table OFF (the audit's heavy scene; LW.gasTable(false) in-body so the same body runs in Firefox and Electron),
 * UI hidden, GOVERNOR + AUTO SCALE on.
 *   1. play __W_SECS s (default 20) — the scale drops — then keep playing until autoScale < 1 (≤ 10 s) and PAUSE; frame by
 *      frame: edge frame (1 rAF after the pause) quality.autoScale === 1?  next frame (2 rAF): the canvas at full width, a
 *      PRESENT happened?
 *   2. a PAUSED POINTER-STYLE DRAG, 3 s: the yaw moved and a PRESENT asked every frame, exactly as stage-gestures'
 *      pointermove does (the loop re-arms per event, so AUTO SCALE rarely samples an interval): every frame's autoScale,
 *      how often it changed, whether it went back UP (a per-frame reset would oscillate).
 *   3. paused camera MOTION that keeps the loop armed (AUTO-ROTATE, 3 s), where AUTO SCALE does sample the paused cadence.
 *   4. THE STALE WINDOW AT 1: play 5 s governed (the window's ema fills with playing intervals), put autoScale at 1 by
 *      hand, pause, then the same 3 s drag — the window must have restarted on the edge, or the stale ema walks it down.
 *   5. the control: AUTO SCALE OFF and the governor off, play 5 s, pause — autoScale stays 1, no scale change counted
 *      (autoQ.changes), and the pause's own PRESENT is the only one.
 *   Firefox:  LW_PORT=8729 GD_PORT=5247 node research/optimization-2026-09-24/probes/A/run.mjs <this> <out>
 *   Electron: LW_PORT=8729 node research/optimization-2026-09-24/probes/K/run-electron.mjs <this> <out> */
const LW = __LW, F = LW.field, SECS = globalThis.__W_SECS || 20;
const canvas = document.getElementById('field');
const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
LW.gasTable(false); for (let i = 0; i < 100 && LW.gasTable() !== 'off'; i++) await sleep(10);
LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.enterBox(); LW.pause();
LW.quality.res = 128; LW.quality.steps = 240; LW.quality.scale = 1; LW.schedule(4); await LW.settle();
LW.governor.on = true; LW.quality.auto = true; LW.quality.autoScale = 1;
if (!LW.uiHidden) LW.keys.toggleUI();
await LW.settle(); await raf(); await raf();
const out = { table: LW.gasTable(), fullWidth: canvas.width, budgetMode: LW.perf.mode };
const drag = async (ms = 3000) => {
  const trace = []; let ups = 0, changes = 0, prev = LW.quality.autoScale, frames = 0; const d0 = performance.now(), pd = LW.stats.presents;
  while (performance.now() - d0 < ms) {
    LW.obs.yaw += 0.01; LW.schedule(LW.TIER.PRESENT); await raf(); frames++;
    const s = LW.quality.autoScale; if (s !== prev) { changes++; if (s > prev) ups++; trace.push([frames, s]); prev = s; }
  }
  const r = { frames, presents: LW.stats.presents - pd, fps: +(frames / (ms / 1000)).toFixed(1), scaleChanges: changes, wentUp: ups, trace, end: { autoScale: LW.quality.autoScale, cw: canvas.width }, playing: LW.clock.playing, ema: (LW.autoQ.ema !== undefined ? +LW.autoQ.ema.toFixed(1) : LW.autoQ.k) };
  await LW.settle(); return r;
};
/* 1 · governed play: the scale drops; pause while it is below 1 */
const t0 = performance.now(); LW.play(); const drops = [];
const note = () => { const s = LW.quality.autoScale; if (!drops.length || drops[drops.length - 1][1] !== s) drops.push([+((performance.now() - t0) / 1000).toFixed(2), s, canvas.width]); };
while (performance.now() - t0 < SECS * 1000) { await sleep(250); note(); }
for (let i = 0; i < 400 && LW.quality.autoScale >= 1; i++) { await sleep(25); note(); }
out.play = { secs: SECS, scaleTrace: drops, beforePause: { autoScale: LW.quality.autoScale, cw: canvas.width, res: F.resolution, drop: LW.governor.drop, ema: (LW.autoQ.ema !== undefined ? +LW.autoQ.ema.toFixed(1) : LW.autoQ.k) } };
const p0 = LW.stats.presents, c0 = LW.autoQ.changes;
LW.pause();
await raf(); const edge = { autoScale: LW.quality.autoScale, cw: canvas.width, presents: LW.stats.presents - p0, playing: LW.clock.playing };
await raf(); const next = { autoScale: LW.quality.autoScale, cw: canvas.width, presents: LW.stats.presents - p0 };
for (let i = 0; i < 4; i++) await raf();
out.pause = { edgeFrame: edge, nextFrame: next, after6Frames: { autoScale: LW.quality.autoScale, cw: canvas.width, presents: LW.stats.presents - p0, scheduled: LW.stats.scheduled, res: F.resolution }, autoQChanges: LW.autoQ.changes - c0 };
/* 2 · a paused pointer-style drag */
out.drag = await drag();
/* 3 · paused camera motion that keeps the loop armed */
{ const tr = []; let up = 0, ch = 0, pv = LW.quality.autoScale, fr = 0; const a0 = performance.now(), pa = LW.stats.presents;
  LW.camera.setAutoRotate(true);
  while (performance.now() - a0 < 3000) { await raf(); fr++; const s = LW.quality.autoScale; if (s !== pv) { ch++; if (s > pv) up++; tr.push([fr, s]); pv = s; } }
  LW.camera.setAutoRotate(false); LW.camera.stop();
  out.spin = { frames: fr, presents: LW.stats.presents - pa, scaleChanges: ch, wentUp: up, trace: tr, end: { autoScale: LW.quality.autoScale, cw: canvas.width }, ema: (LW.autoQ.ema !== undefined ? +LW.autoQ.ema.toFixed(1) : LW.autoQ.k), playing: LW.clock.playing };
  await LW.settle(); }
/* 4 · the stale window at 1 */
LW.quality.autoScale = 1; LW.play(); await sleep(5000);
const emaPlaying = (LW.autoQ.ema !== undefined ? +LW.autoQ.ema.toFixed(1) : LW.autoQ.k); LW.quality.autoScale = 1; LW.pause(); for (let i = 0; i < 6; i++) await raf();
out.staleAtOne = { emaWhilePlaying: emaPlaying, emaAfterEdge: (LW.autoQ.ema !== undefined ? +LW.autoQ.ema.toFixed(1) : LW.autoQ.k), drag: await drag() };
/* 5 · the control: AUTO SCALE off */
LW.quality.auto = false; LW.quality.autoScale = 1; LW.governor.on = false; LW.play(); await sleep(5000);
const q0 = LW.stats.presents, k0 = LW.autoQ.changes; LW.pause(); for (let i = 0; i < 6; i++) await raf();
out.autoOff = { autoScale: LW.quality.autoScale, cw: canvas.width, presentsAfterPause: LW.stats.presents - q0, autoQChanges: LW.autoQ.changes - k0 };
LW.quality.auto = true; LW.governor.on = true;
if (LW.uiHidden) LW.keys.toggleUI();
out.errs = (window.__e || []).slice(0, 5);
return out;
