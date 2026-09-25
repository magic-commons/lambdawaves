/* probes/K/k9-throughput.js — K9: field.throughput with the default n = 60 (Firefox's 100 ms completion tick divided
 * by 60) against targetMs 2500 (n grown until one batch lasts ≥ 2.5 s), 1s+2pz at 96³/160 steps, three times each. */
const LW = __LW, F = LW.field;
LW.governor.on = false; LW.quality.auto = false; LW.pause();
LW.quality.res = 96; LW.quality.steps = 160; LW.quality.scale = 1; LW.schedule(4); await LW.settle(); await LW.settle();
const call = (o) => F.throughput(Object.assign({ modes: LW.modesAt(LW.clock.t), obs: LW.obs, mat: LW.mat }, o));
const out = { n60: [], target2500: [] };
for (let i = 0; i < 3; i++) {
  const a = await call({}); out.n60.push({ frameMs: a.frameMs, reconstructMs: a.reconstructMs, presentMs: a.presentMs, n: a.n });
  const b = await call({ targetMs: 2500 }); out.target2500.push({ frameMs: b.frameMs, reconstructMs: b.reconstructMs, presentMs: b.presentMs, n: b.n });
}
return out;
