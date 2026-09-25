/* probes/K/k2-variants.js — K2's three specialisation variants, measured BEFORE building (lead ruling 5).
 * Run with PREFILE=probes/K/k2-head.js (present3's exact replica: psi rebuilt by the shipped kernel from the bytes field.js
 * writes, rendered by the shipped RENDER_WGSL; `replicaExact` = its hash equals field.readPixels()' own).
 *   V1  view × style folded to constants; bow, finish, palette, invert stay uniform branches
 *   V2  V1 + the bow line and the glass-FINISH block deleted (valid only when bow is off and finish ≠ glass — the key)
 *   V3  everything folded as AUDIT-A's present3 did (palette, invert, bow, finish → constants: 4× the pipeline keys)
 * Every variant compared byte-for-byte against the generic pipeline on the replica, then timed: n grown until a batch is
 * ≥ 2.5 s, interleaved rounds, min. */
const out = { scen: SC, grid: GRID, n, count, W, H, steps: V0[15], appReadPixelsHash: rp.hash };
{ const r0 = await readBack(rpipes.ship, BG4, W, H, V0); out.replicaExact = fnv(r0.px, W, H, r0.bpr) === rp.hash; }
const BOW = '    if (V.p4.w > 0.5) { let ph = dot(V.p4.xyz, p); let cs = cos(ph); let sn = sin(ph); s = vec2<f32>(s.x * cs - s.y * sn, s.x * sn + s.y * cs); }';
const GLASSF = `    if (V.p6.w > .5 && V.p6.w < 1.5 && style != 6u) {
      // A glass finish on the selected shape, including signed nodal lobes.
      wEff *= .22;
      if (wEff > 0.0) { c = mix(c, vec3<f32>(1.0), clamp(litAt(uvw) * .45, 0.0, .65)); }
    }`;
const cut = (s, from) => { const i = s.indexOf(from); if (i < 0) throw new Error('anchor missing: ' + from.slice(0, 60)); const j = s.indexOf('\n', i + from.length - 1); return s.slice(0, i) + s.slice(j + 1); };
const fold = (s, v, st) => must(must(s, 'let mode = u32(V.p0.x);', `let mode = ${v}u;`), 'let style = u32(V.p3.x);', `let style = ${st}u;`);
const VAR = {
  v1: (v, st) => fold(RW, v, st),
  v2: (v, st) => cut(cut(fold(RW, v, st), BOW), GLASSF),
  v3: (v, st) => fold(RW, v, st).split('V.p2.z > 0.5').join('false').split('V.p2.y > 0.5').join('false').split('V.p4.w > 0.5').join('false').split('V.p6.w').join('0.0'),
};
const VN = { density: 0, phase: 1, real: 2, imag: 3, diff: 4, reim: 5 }, SN = { cloud: 0, grain: 2, bands: 4, dust: 5 };
const cases = globalThis.__K2_CASES || [['phase', 'cloud'], ['density', 'cloud'], ['real', 'cloud'], ['phase', 'grain'], ['density', 'dust'], ['phase', 'bands']];
const P = {};
for (const [v, st] of cases) {
  const view = V0.slice(); view[16] = VN[v]; view[28] = SN[st]; view[26] = 0; view[25] = 0; view[35] = 0; view[39] = 0;
  P[v + '/' + st] = { view, gen: rpipes.ship };
  for (const [k, f] of Object.entries(VAR)) P[v + '/' + st][k] = rp8(f(VN[v], SN[st]));
}
out.pixels = {};
for (const [k, c] of Object.entries(P)) {
  const a = await readBack(c.gen, BG4, W, H, c.view); out.pixels[k] = { generic: fnv(a.px, W, H, a.bpr) };
  for (const vk of Object.keys(VAR)) { const b = await readBack(c[vk], BG4, W, H, c.view); let dif = 0, mx = 0; for (let i = 0; i < a.px.length; i++) { const dd = Math.abs(a.px[i] - b.px[i]); if (dd) { dif++; mx = Math.max(mx, dd); } } out.pixels[k][vk] = { bytesDiffering: dif, maxLevelDiff: mx }; }
}
if (!globalThis.__K2_NOTIME) {
  const cfgs = []; for (const k of Object.keys(P)) for (const w of ['gen', ...Object.keys(VAR)]) cfgs.push([k, w]);
  const NN = {}, TT = {};
  for (const [k, w] of cfgs) { const c = P[k]; let nn = 8; for (;;) { const T = (await renderN(c[w], BG4, T1, nn, c.view)) * nn; if (T >= 2500 || nn >= 40000) break; nn = T < 400 ? nn * 4 : Math.ceil(nn * 3000 / T); } NN[k + ':' + w] = nn; TT[k + ':' + w] = []; }
  for (let rd = 0; rd < (globalThis.__K2_ROUNDS || 3); rd++) for (const [k, w] of cfgs) TT[k + ':' + w].push(+(await renderN(P[k][w], BG4, T1, NN[k + ':' + w], P[k].view)).toFixed(3));
  out.timing = {}; for (const k of Object.keys(P)) { out.timing[k] = {}; for (const w of ['gen', ...Object.keys(VAR)]) out.timing[k][w] = Math.min(...TT[k + ':' + w]); }
}
{ const t0 = performance.now(); const m = d.createShaderModule({ code: VAR.v2(1, 0) }); await d.createRenderPipelineAsync({ layout, vertex: { module: m, entryPoint: 'vs' }, fragment: { module: m, entryPoint: 'fs', targets: [{ format: 'rgba8unorm' }] }, primitive: { topology: 'triangle-list' } }); out.v2CompileMs = +(performance.now() - t0).toFixed(1); }
for (const t of [psi, ref, rgTex, T1, T2, TI]) t.destroy(); for (const b of [params, modesBuf, stats, radial, rgBuf, palBuf, viewBuf]) b.destroy();
LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('1s+2pz'); LW.pause();
return out;
