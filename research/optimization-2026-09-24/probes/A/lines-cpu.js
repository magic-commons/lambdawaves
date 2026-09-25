/* lines-cpu.js — the CPU half of the FRAME: field.frame() encode ms while the camera turns every frame.
 * The shipped camera is FREE (rack.js obs.mode = 'free'), so the turn goes through the rotor (field.js turnFree), not yaw. */
const LW = __LW, F = LW.field, d = F.device, Q = d.queue;
const fm = await import('/lab/field.js');
LW.governor.on = false; LW.quality.auto = false;
LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('1s+2pz'); LW.pause();
LW.quality.res = 96; LW.quality.steps = 160; LW.quality.scale = 1; LW.schedule(4); await LW.settle();
const MODES = [['off', { frame: false }], ['box', { frame: true, frameMode: 'box' }], ['dots', { frame: true, frameMode: 'dots' }], ['lattice', { frame: true, frameMode: 'lattice' }]];
const out = { camMode: LW.obs.mode, cpuMoving: {} };
const q0 = LW.obs.quat.slice(), mat0 = { frame: LW.mat.frame, frameMode: LW.mat.frameMode };
for (let rep = 0; rep < 2; rep++) for (const [name, m] of MODES) {
  Object.assign(LW.mat, m); const w0 = F.stats.chromeWrites, enc = [];
  await Q.onSubmittedWorkDone();
  for (let i = 0; i < 300; i++) { LW.obs.quat = fm.turnFree(q0, 0.002 * (i + 1), 0); const t0 = performance.now(); F.frame({ obs: LW.obs, mat: LW.mat }); enc.push(performance.now() - t0); if ((i % 20) === 19) await Q.onSubmittedWorkDone(); }
  LW.obs.quat = q0.slice(); enc.sort((a, b) => a - b);
  out.cpuMoving[name + (rep ? '#2' : '')] = { medianEncodeMs: +enc[enc.length >> 1].toFixed(3), p90: +enc[Math.floor(enc.length * 0.9)].toFixed(3), chromeWrites: F.stats.chromeWrites - w0, frames: 300 };
}
Object.assign(LW.mat, mat0); LW.schedule(2); await LW.settle();
return out;
