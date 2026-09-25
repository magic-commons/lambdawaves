/* ── present3: SPECIALISATION.  The present pass is ALU-bound (present2: the texture-only floor is 1.7 ms of 3.7, the
   no-fetch floor 3.3).  Does a copy of RENDER_WGSL with the uniform switches folded to constants (view, style, finish,
   palette, invert, bow) render the SAME BYTES faster?  Same replica, same view block, interleaved rounds, min. ── */
const out = { scen: SC, grid: GRID, n, count, W, H, steps: V0[15], appReadPixelsHash: rp.hash };
const ROUNDS2 = globalThis.__A_ROUNDS2 || 5;
const spec = (mode, style) => {
  let s = RW;
  s = must(s, 'let mode = u32(V.p0.x);', `let mode = ${mode}u;`);
  s = must(s, 'let style = u32(V.p3.x);', `let style = ${style}u;`);
  s = s.split('V.p2.z > 0.5').join('false').split('V.p2.y > 0.5').join('false').split('V.p4.w > 0.5').join('false').split('V.p6.w').join('0.0');
  return s;
};
const VIEWS = { density: 0, phase: 1, real: 2 }, STY = { cloud: 0, solid: 1, glass: 6, additive: 7 };
const cases = [['density', 'cloud'], ['phase', 'cloud'], ['real', 'cloud'], ['density', 'solid'], ['density', 'glass'], ['phase', 'additive']];
const P = {};
for (const [v, st] of cases) {
  const view = V0.slice(); view[16] = VIEWS[v]; view[28] = STY[st]; view[26] = 0; view[25] = 0; view[35] = 0; view[39] = 0;
  P[v + '/' + st] = { view, gen: rpipes.ship, spec: rp8(spec(VIEWS[v], STY[st])) };
}
out.pixels = {};
for (const [k, c] of Object.entries(P)) { const a = await readBack(c.gen, BG4, W, H, c.view), b = await readBack(c.spec, BG4, W, H, c.view); let dif = 0, mx = 0;
  for (let i = 0; i < a.px.length; i++) { const dd = Math.abs(a.px[i] - b.px[i]); if (dd) { dif++; mx = Math.max(mx, dd); } }
  out.pixels[k] = { generic: fnv(a.px, W, H, a.bpr), specialised: fnv(b.px, W, H, b.bpr), bytesDiffering: dif, maxLevelDiff: mx }; }
const cfgs = []; for (const k of Object.keys(P)) { cfgs.push([k, 'gen']); cfgs.push([k, 'spec']); }
const NN = {}, TT = {};
for (const [k, w] of cfgs) { const c = P[k]; let nn = 8; for (;;) { const T = (await renderN(c[w], BG4, T1, nn, c.view)) * nn; if (T >= 2500 || nn >= 40000) break; nn = T < 400 ? nn * 4 : Math.ceil(nn * 3000 / T); } NN[k + ':' + w] = nn; TT[k + ':' + w] = []; }
for (let rd = 0; rd < ROUNDS2; rd++) for (const [k, w] of cfgs) TT[k + ':' + w].push(+(await renderN(P[k][w], BG4, T1, NN[k + ':' + w], P[k].view)).toFixed(3));
out.timing = Object.fromEntries(Object.keys(TT).map((k) => [k, { min: Math.min(...TT[k]), rounds: TT[k], tickErrMs: +(100 / NN[k]).toFixed(3) }]));
/* compile cost of one specialised pipeline (what a lazy per-(view,style) cache would pay once) */
{ const t0 = performance.now(); const m = d.createShaderModule({ code: spec(4, 3) }); await d.createRenderPipelineAsync({ layout, vertex: { module: m, entryPoint: 'vs' }, fragment: { module: m, entryPoint: 'fs', targets: [{ format: 'rgba8unorm' }] }, primitive: { topology: 'triangle-list' } }); out.specCompileMs = +(performance.now() - t0).toFixed(1); }
for (const t of [psi, ref, rgTex, T1, T2, TI]) t.destroy(); for (const b of [params, modesBuf, stats, radial, rgBuf, palBuf, viewBuf]) b.destroy();
LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('1s+2pz'); LW.pause();
return out;
