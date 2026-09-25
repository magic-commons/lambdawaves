/* probes/AS/as-desktop.js — the desktop default scene must never leave scale 1 under AUTO SCALE's rule (AS, 2026-09-25):
 * the shipped default preset (96³, UI shown, AUTO SCALE + governor as shipped), PLAY 5 s, every rAF: autoScale, the canvas
 * width, autoQ.changes; then PAUSE.  PRE='globalThis.__AS_RES=96; globalThis.__AS_HIDE=true;' sets the grid / hides the UI.  Firefox: LW_PORT=<port> GD_PORT=5249 node research/optimization-2026-09-24/probes/A/run.mjs <this> <out> */
const LW = __LW, canvas = document.getElementById('field');
const raf = () => new Promise((r) => requestAnimationFrame((t) => r(t)));
if (globalThis.__AS_RES) { LW.quality.res = __AS_RES; LW.quality.steps = { 64: 110, 96: 160, 128: 240 }[__AS_RES]; LW.quality.scale = { 64: 0.75, 96: 1, 128: 1 }[__AS_RES]; LW.schedule(LW.TIER.REBUILD); }   // the GRID segment's own road
if (globalThis.__AS_HIDE && !LW.uiHidden) LW.keys.toggleUI();   // headless Firefox composites the shown UI in software (~83 ms a frame): hide it to judge the GPU path
await LW.settle(); await raf(); await raf();
const out = { res: LW.quality.res, auto: LW.quality.auto, governor: LW.governor.on, mode: LW.perf.mode, uiHidden: !!LW.uiHidden, startScale: LW.quality.autoScale, startCw: canvas.width };
const c0 = LW.autoQ.changes, iv = []; let minScale = LW.quality.autoScale, minCw = canvas.width, frames = 0;
LW.play(); let last = await raf(); const t0 = performance.now();
while (performance.now() - t0 < 5000) {
  const t = await raf(); iv.push(t - last); last = t; frames++;
  minScale = Math.min(minScale, LW.quality.autoScale); minCw = Math.min(minCw, canvas.width);
}
LW.pause(); await LW.settle();
if (globalThis.__AS_HIDE && LW.uiHidden) LW.keys.toggleUI();
iv.sort((a, b) => a - b);
Object.assign(out, { frames, medianMs: +iv[iv.length >> 1].toFixed(1), p90Ms: +iv[Math.floor(iv.length * 0.9)].toFixed(1), k: LW.autoQ.k, minScale, minCw, endScale: LW.quality.autoScale, scaleChanges: LW.autoQ.changes - c0, governorDrop: LW.governor.drop, errs: (window.__e || []).map(String).slice(0, 5) });
return out;
