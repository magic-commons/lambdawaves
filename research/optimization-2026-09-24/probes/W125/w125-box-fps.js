/* probes/W125/w125-box-fps.js — the BOX › AXIAL 256 scene playing, governor and AUTO SCALE off (fixed grid, full canvas),
 * frames and reconstructs per second over 4 s, the gas table ON (the W125 default) vs OFF, interleaved twice, best of two.
 * Run in Electron on the RTX (probes/K/run-electron.mjs), default query: the table lands at the first AXIAL launch. */
const LW = __LW, out = { canvas: null, rows: {} };
LW.governor.on = false; LW.quality.auto = false; LW.quality.autoScale = 1;
LW.pause(); LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.clock.scrub(0); LW.enterBox(); LW.pause();
for (let i = 0; i < 400 && LW.gasTable() === 'building'; i++) await new Promise((r) => setTimeout(r, 10));
out.landed = LW.gasTable();
for (const n of [128, 96, 64]) {
  LW.quality.res = n; LW.quality.steps = { 64: 110, 96: 160, 128: 240 }[n]; LW.quality.scale = 1; LW.schedule(4); await LW.settle(); await LW.settle();
  for (const on of [true, false, true, false]) {
    LW.gasTable(on); for (let i = 0; i < 200 && LW.gasTable() !== (on ? 'on' : 'off'); i++) await new Promise((r) => setTimeout(r, 10));
    LW.clock.scrub(0); LW.enterBox(); await new Promise((r) => setTimeout(r, 1000));
    const f0 = LW.stats.frames, r0 = LW.stats.reconstructs, t0 = performance.now();
    await new Promise((r) => setTimeout(r, 4000));
    const s = (performance.now() - t0) / 1000, k = n + (on ? ':table' : ':recurrence');
    const fps = +((LW.stats.frames - f0) / s).toFixed(1), rps = +((LW.stats.reconstructs - r0) / s).toFixed(1);
    out.rows[k] = out.rows[k] ? { fps: Math.max(out.rows[k].fps, fps), reconstructsPerS: Math.max(out.rows[k].reconstructsPerS, rps), res: LW.field.resolution } : { fps, reconstructsPerS: rps, res: LW.field.resolution };
    LW.pause(); await LW.settle();
  }
}
out.canvas = [LW.field.canvas.width, LW.field.canvas.height];
LW.gasTable(true);
return out;
