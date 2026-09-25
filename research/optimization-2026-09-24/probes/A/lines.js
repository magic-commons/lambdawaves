/* lines.js — LANE A probe body: what the FRAME costs (OFF / BOX / DOTS / LATTICE).
 *  (a) GPU: field.throughput() present-only ms with the line cache warm (the camera does not move inside a batch);
 *  (b) CPU: field.frame() encode ms while the camera MOVES every frame (writeLines regenerates + uploads each time);
 *  (c) the live loop: auto-rotate for 3 s, UI hidden, the loop's own field-tick EMA and main-thread median;
 *  (d) the cost of one queue.writeBuffer by size (Firefox sends each over IPC). */
const LW = __LW, F = LW.field, d = F.device, Q = d.queue;
LW.governor.on = false; LW.quality.auto = false; LW.quality.autoScale = 1;
LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('1s+2pz'); LW.pause();
LW.quality.res = 96; LW.quality.steps = 160; LW.quality.scale = 1; LW.schedule(4); await LW.settle(); await LW.settle();
const MODES = [['off', { frame: false }], ['box', { frame: true, frameMode: 'box' }], ['dots', { frame: true, frameMode: 'dots' }], ['lattice', { frame: true, frameMode: 'lattice' }]];
const out = { W: document.getElementById('field').width, H: document.getElementById('field').height, gpu: {}, cpuMoving: {}, live: {}, writeBuffer: {} };
const mat0 = { frame: LW.mat.frame, frameMode: LW.mat.frameMode };
/* (a) */
for (const [name, m] of MODES) {
  Object.assign(LW.mat, m); LW.schedule(2); await LW.settle();
  const r = []; for (let k = 0; k < 2; k++) { const t = await F.throughput({ modes: LW.modesAt(LW.clock.t), obs: LW.obs, mat: LW.mat, n: 1000 }); r.push(t.presentMs); }
  out.gpu[name] = { presentMs: Math.min(...r), rounds: r, tickErrMs: 0.1 };
}
/* (b) */
for (const [name, m] of MODES) {
  Object.assign(LW.mat, m); const y0 = LW.obs.yaw, w0 = F.stats.chromeWrites; const enc = [];
  await Q.onSubmittedWorkDone();
  for (let i = 0; i < 240; i++) { LW.obs.yaw = y0 + 0.002 * (i + 1); const t0 = performance.now(); F.frame({ obs: LW.obs, mat: LW.mat }); enc.push(performance.now() - t0); if ((i % 30) === 29) await Q.onSubmittedWorkDone(); }
  LW.obs.yaw = y0; enc.sort((a, b) => a - b);
  out.cpuMoving[name] = { medianEncodeMs: +enc[enc.length >> 1].toFixed(3), p90: +enc[Math.floor(enc.length * 0.9)].toFixed(3), chromeWrites: F.stats.chromeWrites - w0, frames: 240 };
  /* and with the camera STILL: the cache must hold */
  const w1 = F.stats.chromeWrites; const enc2 = []; for (let i = 0; i < 120; i++) { const t0 = performance.now(); F.frame({ obs: LW.obs, mat: LW.mat }); enc2.push(performance.now() - t0); if ((i % 30) === 29) await Q.onSubmittedWorkDone(); }
  enc2.sort((a, b) => a - b); out.cpuMoving[name].stillMedianEncodeMs = +enc2[enc2.length >> 1].toFixed(3); out.cpuMoving[name].stillChromeWrites = F.stats.chromeWrites - w1;
}
await Q.onSubmittedWorkDone();
/* (c) */
if (!LW.uiHidden) LW.keys.toggleUI();
for (const [name, m] of MODES) {
  Object.assign(LW.mat, m); LW.perf.resetRing(); for (const k of Object.keys(LW.perf.profile)) LW.perf.profile[k] = 0;
  LW.camera.setAutoRotate(true); const f0 = LW.stats.frames, t0 = performance.now(); await new Promise((r) => setTimeout(r, 3000));
  const dt = (performance.now() - t0) / 1000; const prof = LW.perf.profile.field; LW.camera.setAutoRotate(false); LW.camera.stop();
  out.live[name] = { fps: +((LW.stats.frames - f0) / dt).toFixed(1), fieldTickEmaMs: +prof.toFixed(3), loopMedianMs: +LW.perf.median.toFixed(3) };
  await LW.settle();
}
if (LW.uiHidden) LW.keys.toggleUI();
Object.assign(LW.mat, mat0); LW.schedule(2); await LW.settle();
/* (d) */
const scratch = d.createBuffer({ size: 1 << 20, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM });
for (const bytes of [16, 64, 176, 28672, 776832]) { const data = new Uint8Array(bytes); const N = bytes > 100000 ? 200 : 2000; await Q.onSubmittedWorkDone(); const t0 = performance.now(); for (let i = 0; i < N; i++) Q.writeBuffer(scratch, 0, data); const ms = (performance.now() - t0) / N; await Q.onSubmittedWorkDone(); out.writeBuffer[bytes] = +(ms * 1000).toFixed(2) + ' µs'; }
scratch.destroy();
return out;
