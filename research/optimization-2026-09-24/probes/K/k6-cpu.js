/* probes/K/k6-cpu.js — the FRAME's CPU cost per camera-moving frame, as a MEAN over 300 frames (the median of lines-cpu is
 * quantised to the timer's 20 µs), min over 5 interleaved rounds per mode; field.frame({ obs, mat }) with the FREE rotor
 * turning every frame, exactly lines-cpu's road. */
const LW = __LW, F = LW.field, d = F.device, Q = d.queue;
const fm = await import('/lab/field.js');
LW.governor.on = false; LW.quality.auto = false;
LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('1s+2pz'); LW.pause();
LW.quality.res = 96; LW.quality.steps = 160; LW.quality.scale = 1; LW.schedule(4); await LW.settle();
const MODES = [['off', { frame: false }], ['box', { frame: true, frameMode: 'box' }], ['dots', { frame: true, frameMode: 'dots' }], ['lattice', { frame: true, frameMode: 'lattice' }]];
const q0 = LW.obs.quat.slice(), mat0 = { frame: LW.mat.frame, frameMode: LW.mat.frameMode };
const R = {}; for (const [n] of MODES) R[n] = [];
let turn = 0;
for (let rd = 0; rd < 5; rd++) for (const [name, m] of MODES) {
  Object.assign(LW.mat, m); await Q.onSubmittedWorkDone();
  let sum = 0;
  for (let i = 0; i < 300; i++) { LW.obs.quat = fm.turnFree(q0, 0.002 * (++turn % 900), 0); const t0 = performance.now(); F.frame({ obs: LW.obs, mat: LW.mat }); sum += performance.now() - t0; if ((i % 20) === 19) await Q.onSubmittedWorkDone(); }
  R[name].push(+(sum / 300).toFixed(4));
}
LW.obs.quat = q0.slice(); Object.assign(LW.mat, mat0); LW.schedule(2); await LW.settle();
const out = {}; for (const [n] of MODES) out[n] = { minMeanMs: Math.min(...R[n]), rounds: R[n] };
return out;
