/* ── present2: INTERLEAVED timing (every round visits every variant, min over rounds — other lanes share this GPU),
   a no-fetch ALU floor, and an OCCUPANCY-SKIP prototype (brick max ρ over 8³ texels + the trilinear halo) ── */
const out = { scen: SC, grid: GRID, n, count, W, H, steps: V0[15], view: V0[16], style: V0[28], appReadPixelsHash: rp.hash, rgCopyTexelsDiffering: rgDiff };
const ROUNDS2 = globalThis.__A_ROUNDS2 || 5;
/* the occupancy volume */
const NB = Math.ceil(n / 8);
const occTex = d.createTexture({ size: [NB, NB, NB], dimension: '3d', format: 'r32float', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING });
const occCode = `@group(0) @binding(0) var src: texture_3d<f32>; @group(0) @binding(1) var dst: texture_storage_3d<r32float, write>;
@compute @workgroup_size(4,4,4) fn main(@builtin(global_invocation_id) b: vec3<u32>) { if (any(b >= vec3<u32>(${NB}u))) { return; }
  var m = 0.0; let lo = b * 8u; let hi = min(lo + vec3<u32>(8u), vec3<u32>(${n - 1}u));
  for (var z = lo.z; z <= hi.z; z++) { for (var y = lo.y; y <= hi.y; y++) { for (var x = lo.x; x <= hi.x; x++) { let s = textureLoad(src, vec3<i32>(vec3<u32>(x, y, z)), 0).rg; m = max(m, dot(s, s)); } } }
  textureStore(dst, vec3<i32>(b), vec4<f32>(m, 0.0, 0.0, 0.0)); }`;
const opipe = d.createComputePipeline({ layout: 'auto', compute: { module: d.createShaderModule({ code: occCode }), entryPoint: 'main' } });
{ const enc = d.createCommandEncoder(), p = enc.beginComputePass(); p.setPipeline(opipe); p.setBindGroup(0, d.createBindGroup({ layout: opipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: psi.createView({ dimension: '3d' }) }, { binding: 1, resource: occTex.createView({ dimension: '3d' }) }] }));
  p.dispatchWorkgroups(Math.ceil(NB / 4), Math.ceil(NB / 4), Math.ceil(NB / 4)); p.end(); Q.submit([enc.finish()]); }
/* the occupancy build's own cost */
const occTime = async (nn) => { await Q.onSubmittedWorkDone(); const t0 = performance.now(); const enc = d.createCommandEncoder(), p = enc.beginComputePass(); p.setPipeline(opipe);
  p.setBindGroup(0, d.createBindGroup({ layout: opipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: psi.createView({ dimension: '3d' }) }, { binding: 1, resource: occTex.createView({ dimension: '3d' }) }] }));
  for (let i = 0; i < nn; i++) p.dispatchWorkgroups(Math.ceil(NB / 4), Math.ceil(NB / 4), Math.ceil(NB / 4)); p.end(); Q.submit([enc.finish()]); await Q.onSubmittedWorkDone(); return (performance.now() - t0) / nn; };
out.occBuildMs = +(await occTime(4000)).toFixed(4);
/* the skip: per step, the brick's max ρ bounds this sample's ρ (|trilinear mix|² ≤ max |texel|²), so it bounds w, wEff and a;
   a step whose bound is under THR is not fetched or shaded — t still advances by the same += ds, so the march is unchanged */
const BGLo = d.createBindGroupLayout({ entries: [
  { binding: 0, visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
  { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '3d' } },
  { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '3d' } },
  { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
  { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
  { binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
  { binding: 6, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '3d' } }] });
const layoutO = d.createPipelineLayout({ bindGroupLayouts: [BGLo] });
const BGO = d.createBindGroup({ layout: BGLo, entries: [{ binding: 0, resource: { buffer: viewBuf } }, { binding: 1, resource: psi.createView({ dimension: '3d' }) }, { binding: 2, resource: ref.createView({ dimension: '3d' }) }, { binding: 3, resource: sampler }, { binding: 4, resource: { buffer: stats } }, { binding: 5, resource: { buffer: palBuf } }, { binding: 6, resource: occTex.createView({ dimension: '3d' }) }] });
const occSkip = (thr) => {
  let s = must(RW, '@group(0) @binding(5) var<storage, read> pal: array<vec4<f32>, 256>;', '@group(0) @binding(5) var<storage, read> pal: array<vec4<f32>, 256>;\n@group(0) @binding(6) var occ: texture_3d<f32>;');
  s = must(s, '    var s = textureSampleLevel(psiTex, samp, uvw, 0.0).rg;',
    `    { let tx = clamp(vec3<i32>(floor(uvw * ${n}.0 - vec3<f32>(0.5))), vec3<i32>(0), vec3<i32>(${n - 1})) / vec3<i32>(8);
      let wb = pow(textureLoad(occ, tx, 0).r / rhoMax, soft); let ab = 1.0 - exp(-(wb / (1.0 + max(V.p3.w, 1e-4) * wb)) * sigma * stepN * 4.0);
      if (ab < ${thr}) { t += ds; continue; } }
    var s = textureSampleLevel(psiTex, samp, uvw, 0.0).rg;`);
  const m = d.createShaderModule({ code: s }); return d.createRenderPipeline({ layout: layoutO, vertex: { module: m, entryPoint: 'vs' }, fragment: { module: m, entryPoint: 'fs', targets: [{ format: 'rgba8unorm' }] }, primitive: { topology: 'triangle-list' } });
};
const aluCode = must(RW, '    var s = textureSampleLevel(psiTex, samp, uvw, 0.0).rg;', '    var s = vec2<f32>(uvw.x, uvw.y) * 1e-3;');
const P = { ship: [rpipes.ship, BG4], rg16: [rpipes.ship, BG2], texFloor: [rpipes.texFloor, BG4], aluFloor: [rp8(aluCode), BG4], occ1e5: [occSkip('1e-5'), BGO], occ1e4: [occSkip('1e-4'), BGO] };
/* pixels: each variant against the shipped render, rgba8 */
const base = await readBack(rpipes.ship, BG4, W, H, V0); out.replicaExact = fnv(base.px, W, H, base.bpr) === rp.hash;
out.pixels = {};
for (const k of ['rg16', 'occ1e5', 'occ1e4']) { const r = await readBack(P[k][0], P[k][1], W, H, V0); let dif = 0, mx = 0, px = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = y * base.bpr + x * 4; let any = false; for (let c = 0; c < 3; c++) { const dd = Math.abs(base.px[o + c] - r.px[o + c]); if (dd) { dif++; mx = Math.max(mx, dd); any = true; } } if (any) px++; }
  out.pixels[k] = { pixelsDiffering: px, fractionOfPixels: +(px / (W * H)).toExponential(3), channelBytesDiffering: dif, maxLevelDiff: mx }; }
/* interleaved timing at 1x and 2x */
const TT = {}, NN = {};
const cfgs = []; for (const k of Object.keys(P)) { cfgs.push([k, T1]); if (['ship', 'rg16', 'occ1e5'].includes(k)) cfgs.push([k + '@2x', T2]); }
for (const [k, tex] of cfgs) { const [pp, bg] = P[k.replace('@2x', '')]; let nn = 8; for (;;) { const T = (await renderN(pp, bg, tex, nn, V0)) * nn; if (T >= 2500 || nn >= 40000) break; nn = T < 400 ? nn * 4 : Math.ceil(nn * 3000 / T); } NN[k] = nn; TT[k] = []; }
for (let rd = 0; rd < ROUNDS2; rd++) for (const [k, tex] of cfgs) { const [pp, bg] = P[k.replace('@2x', '')]; TT[k].push(+(await renderN(pp, bg, tex, NN[k], V0)).toFixed(3)); }
out.timing = Object.fromEntries(cfgs.map(([k]) => [k, { min: Math.min(...TT[k]), rounds: TT[k], n: NN[k], tickErrMs: +(100 / NN[k]).toFixed(3) }]));
out.note = 'interleaved rounds (' + ROUNDS2 + '), min reported; 1x = ' + W + 'x' + H + ', 2x = ' + (2 * W) + 'x' + (2 * H) + '; occ = brick-max skip at a-bound 1e-5 / 1e-4 (cloud style), the march t unchanged';
for (const t of [psi, ref, rgTex, T1, T2, TI, occTex]) t.destroy(); for (const b of [params, modesBuf, stats, radial, rgBuf, palBuf, viewBuf]) b.destroy();
LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('1s+2pz'); LW.pause();
return out;
