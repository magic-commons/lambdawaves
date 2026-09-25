/* probes/W125/w125-k7-speed.js — probes/K/k7-speed.js with ONE change: the opening wait for 'on' is gone (on the W125 tree the
 * table is armed at boot and builds at the first AXIAL launch, so the loop below waits for each state itself). Default query. */
/* probes/K/k7-speed.js — K7's speed, the app's own road (query 'preset=1s%2B2pz&sw=0&gastab=1'): field.throughput
 * ({ targetMs: 2500 }).reconstructMs with the table ON and OFF (LW.gasTable), the axial gas at t = 2.0, 64/96/128,
 * interleaved twice, min.  The mode count is read with every number (a gas that went off would time an empty list). */
const LW = __LW, F = LW.field;
LW.governor.on = false; LW.quality.auto = false; LW.quality.autoScale = 1;
LW.pause(); LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.clock.scrub(0); LW.enterBox(); LW.pause(); LW.clock.scrub(2.0);
const out = { table: LW.gasTable(), rows: {} };
for (const n of [64, 96, 128]) {
  LW.quality.res = n; LW.quality.steps = { 64: 110, 96: 160, 128: 240 }[n]; LW.quality.scale = 1; LW.schedule(4); await LW.settle(); await LW.settle();
  const row = { gasOn: LW.gas.on };
  for (const on of [true, false, true, false]) {
    LW.gasTable(on); for (let i = 0; i < 100 && LW.gasTable() !== (on ? 'on' : 'off'); i++) await new Promise((r) => setTimeout(r, 20));
    const modes = LW.modesAt(LW.clock.t);
    const r = await F.throughput({ modes, obs: LW.obs, mat: LW.mat, targetMs: 2500 });
    const k = on ? 'table' : 'recurrence'; row[k] = Math.min(row[k] || Infinity, r.reconstructMs); row.modes = r.modes; row.n = r.nReconstruct;
  }
  out.rows[n] = row;
}
LW.gasTable(true);
return out;
