/* boot-quality.js — what a FIRST VISIT actually marches (fresh headless profile), against what the GRID segment's own
 * 64³ row pairs it with (110 steps, 0.75 scale), and the GPU cost of each.  Read-only: the probe restores nothing it did not touch. */
const LW = __LW, F = LW.field;
const canvas = document.getElementById('field');
const boot = { res: F.resolution, qres: LW.quality.res, steps: LW.mat.steps, qsteps: LW.quality.steps, scale: LW.quality.scale, auto: LW.quality.auto, autoScale: LW.quality.autoScale, gov: LW.governor.on, view: LW.mat.view, style: LW.mat.style, perfMode: LW.perf.mode, cw: canvas.width, ch: canvas.height, gridSeg: document.querySelector('.dev[data-id="settings"]') ? 'present' : 'n/a', frost: LW.frost, card: LW.cardStyle };
LW.governor.on = false; LW.quality.auto = false; LW.pause(); await LW.settle();
const g1 = await LW.gpuFrameMs(1000);
LW.quality.res = 64; LW.quality.steps = 110; LW.quality.scale = 0.75; LW.schedule(4); await LW.settle();
const g2 = await LW.gpuFrameMs(1000);
return { boot, bootGpu: { presentMs: g1.presentMs, w: g1.w, h: g1.h, steps: g1.steps, res: g1.res }, segment64Gpu: { presentMs: g2.presentMs, w: g2.w, h: g2.h, steps: g2.steps, res: g2.res }, tickErrMs: 0.1 };
