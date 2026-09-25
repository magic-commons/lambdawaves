/* probes/K/k2-present.js — K2 in the app: field.throughput({ targetMs: 2500 }).presentMs with the specialised pipeline
 * (warmed) against the generic one (pinRenderPipeline), 1s+2pz at 96³/160 steps, the canvas' own size; interleaved
 * rounds, min.  Headless Firefox (≥ 2.5 s batches: its completion tick is 100 ms). */
const LW = __LW, F = LW.field;
const fm = await import('/lab/field.js');
LW.pause(); LW.governor.on = false; LW.quality.auto = false; LW.quality.autoScale = 1; LW.quality.scale = 1;
LW.quality.res = 96; LW.quality.steps = 160; LW.schedule(4); await LW.settle(); await LW.settle();
const cases = globalThis.__K2P_CASES || [['phase', 'cloud'], ['density', 'cloud'], ['real', 'cloud'], ['phase', 'grain'], ['density', 'dust'], ['phase', 'bands']];
const v0 = LW.mat.view, s0 = LW.mat.style, T = {};
for (let rd = 0; rd < (globalThis.__K2P_ROUNDS || 2); rd++) for (const [v, s] of cases) for (const pin of [false, true]) {
  LW.mat.view = fm.VIEW[v]; LW.mat.style = fm.STYLE[s];
  await F.renderPipelineReady(LW.mat);
  if (pin) F.pinRenderPipeline(true);
  let r; try { r = await F.throughput({ modes: LW.modesAt(LW.clock.t), obs: LW.obs, mat: LW.mat, targetMs: 2500 }); } finally { if (pin) F.pinRenderPipeline(false); }
  const k = v + '/' + s + (pin ? ':generic' : ':specialised'); (T[k] = T[k] || []).push(r.presentMs);
}
LW.mat.view = v0; LW.mat.style = s0; LW.schedule(2); await LW.settle();
const out = { canvas: [F.canvas.width, F.canvas.height], steps: 160, res: 96, present: {} };
for (const [v, s] of cases) { const g = Math.min(...T[v + '/' + s + ':generic']), p = Math.min(...T[v + '/' + s + ':specialised']); out.present[v + '/' + s] = { genericMs: g, specialisedMs: p, saved: +(1 - p / g).toFixed(3) }; }
return out;
