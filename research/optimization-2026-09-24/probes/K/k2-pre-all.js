/* PREFILE for the Electron correctness run of k2-variants: every view × {cloud, grain, bands, dust}, no timing */
globalThis.__K2_NOTIME = true;
globalThis.__K2_CASES = []; for (const v of ['density', 'phase', 'real', 'imag', 'diff', 'reim']) for (const s of ['cloud', 'grain', 'bands', 'dust']) globalThis.__K2_CASES.push([v, s]);
/* present.js — LANE A probe body: THE PRESENT PASS, on an exact replica.
 * 1. Capture, by wrapping queue.writeBuffer for one synchronous call, the bytes field.js itself writes: the mode records +
 *    params of a reconstruct, and the 176-byte VIEW block readPixels writes for a w×h target.
 * 2. Rebuild psi with the shipped COMPUTE_WGSL (copied as text) and render with the shipped RENDER_WGSL into rgba8unorm;
 *    the replica is EXACT when its FNV hash equals field.readPixels()' own hash for the same view (lines off).
 * 3. Time variants on that replica: steps, styles, views, 2x pixels, an rg16float copy of the volume (the texture-format
 *    question), a texture-only floor, and an instrumented copy that counts marched samples per pixel.
 * PRE: globalThis.__A_PSCEN = 'default' | 'h91' | 'box' | 'gas';  __A_GRID = 64 | 96 | 128;  __A_ROUNDS. */
const LW = __LW, F = LW.field, d = F.device, Q = d.queue;
const src = await (await fetch('/lab/field.js', { cache: 'no-store' })).text();
const grab = (name) => { const i = src.indexOf('const ' + name + ' = /* wgsl */`'); const a = src.indexOf('`', i) + 1, b = src.indexOf('`;', a); return src.slice(a, b); };
const CW = grab('COMPUTE_WGSL'), RW = grab('RENDER_WGSL');
const must = (s, from, to) => { if (s.indexOf(from) < 0) throw new Error('patch anchor missing: ' + from.slice(0, 70)); return s.replace(from, to); };
const SC = globalThis.__A_PSCEN || 'default', GRID = globalThis.__A_GRID || 96, ROUNDS = globalThis.__A_ROUNDS || 2;
LW.governor.on = false; LW.quality.auto = false; LW.quality.autoScale = 1;
if (SC === 'default') { LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('1s+2pz'); }
if (SC === 'h91') { LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('1s'); for (let a = 0; a < 91; a++) LW.reg.set(a, 1, 0, 0); LW.reg.normalize(); }
if (SC === 'box') { LW.loadPreset('1s'); LW.setHamiltonian('well'); LW.setGasBasis('reg'); LW.enterBox(); }
if (SC === 'gas') { LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.enterBox(); }
LW.pause();
LW.quality.res = GRID; LW.quality.steps = { 64: 110, 96: 160, 128: 240 }[GRID]; LW.quality.scale = { 64: 0.75, 96: 1, 128: 1 }[GRID];
LW.schedule(4); await LW.settle(); await LW.settle();
const canvas = document.getElementById('field'), W = canvas.width, H = canvas.height;

/* ── capture ── */
const orig = Q.writeBuffer.bind(Q); let cap = null;
Q.writeBuffer = function (buf, off, data, dOff, size) {
  if (cap) { const ta = ArrayBuffer.isView(data) ? data : new Uint8Array(data); const bpe = ta.BYTES_PER_ELEMENT || 1; const s0 = dOff || 0; const len = size !== undefined ? size : ta.length - s0;
    cap.push({ buf, off, bytes: new Uint8Array(ta.buffer, ta.byteOffset + s0 * bpe, len * bpe).slice() }); }
  return orig(buf, off, data, dOff, size);
};
const matNC = Object.assign({}, LW.mat, { frame: false, axis: false });
cap = []; F.frame({ modes: LW.modesAt(LW.clock.t), obs: LW.obs, mat: matNC }); const capR = cap; cap = null;
cap = []; const rpP = F.readPixels(LW.obs, matNC, W, H); const capV = cap; cap = null; const rp = await rpP;
Q.writeBuffer = orig;
const paramsB = capR.find((c) => c.bytes.length === 32 && new Uint32Array(c.bytes.buffer)[0] === F.resolution);
const pu = new Uint32Array(paramsB.bytes.buffer), count = pu[1];
const modesB = capR.find((c) => c.bytes.length === Math.max(1, count) * 112);
const viewB = capV.find((c) => c.bytes.length === 176);
const V0 = new Float32Array(viewB.bytes.buffer.slice(0));
const n = pu[0];

/* ── the replica: compute ── */
const cpipe = d.createComputePipeline({ layout: 'auto', compute: { module: d.createShaderModule({ code: CW }), entryPoint: 'main' } });
const psi = d.createTexture({ size: [n, n, n], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC });
const ref = d.createTexture({ size: [n, n, n], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING });
const mk = (bytes, usage) => { const b = d.createBuffer({ size: Math.max(16, bytes.byteLength), usage: usage | GPUBufferUsage.COPY_DST }); orig(b, 0, bytes); return b; };
const params = mk(paramsB.bytes, GPUBufferUsage.UNIFORM), modesBuf = mk(modesB.bytes, GPUBufferUsage.STORAGE);
const stats = d.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
const radial = d.createBuffer({ size: 40 * 256 * 4, usage: GPUBufferUsage.STORAGE });
{ const enc = d.createCommandEncoder(), p = enc.beginComputePass(); p.setPipeline(cpipe); p.setBindGroup(0, d.createBindGroup({ layout: cpipe.getBindGroupLayout(0), entries: [
  { binding: 0, resource: { buffer: params } }, { binding: 1, resource: { buffer: modesBuf } }, { binding: 2, resource: psi.createView({ dimension: '3d' }) }, { binding: 3, resource: { buffer: stats } }, { binding: 4, resource: { buffer: radial } }] }));
  p.dispatchWorkgroups(Math.ceil(n / 4), Math.ceil(n / 4), Math.ceil(n / 4)); p.end(); Q.submit([enc.finish()]); }
/* the rg16float copy: textureLoad → pack2x16float into a buffer → copyBufferToTexture (rg16float is not a core storage format) */
const bprRG = Math.ceil(n * 4 / 256) * 256;
const rgBuf = d.createBuffer({ size: bprRG * n * n, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
const packCode = `@group(0) @binding(0) var src: texture_3d<f32>; @group(0) @binding(1) var<storage, read_write> dst: array<u32>;
@compute @workgroup_size(4,4,4) fn main(@builtin(global_invocation_id) g: vec3<u32>) { if (all(g < vec3<u32>(${n}u))) { let v = textureLoad(src, vec3<i32>(g), 0);
  dst[(g.z * ${n}u + g.y) * ${bprRG / 4}u + g.x] = pack2x16float(v.xy); } }`;
const ppipe = d.createComputePipeline({ layout: 'auto', compute: { module: d.createShaderModule({ code: packCode }), entryPoint: 'main' } });
const rgTex = d.createTexture({ size: [n, n, n], dimension: '3d', format: 'rg16float', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST });
{ const enc = d.createCommandEncoder(), p = enc.beginComputePass(); p.setPipeline(ppipe); p.setBindGroup(0, d.createBindGroup({ layout: ppipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: psi.createView({ dimension: '3d' }) }, { binding: 1, resource: { buffer: rgBuf } }] }));
  p.dispatchWorkgroups(Math.ceil(n / 4), Math.ceil(n / 4), Math.ceil(n / 4)); p.end();
  enc.copyBufferToTexture({ buffer: rgBuf, bytesPerRow: bprRG, rowsPerImage: n }, { texture: rgTex }, [n, n, n]); Q.submit([enc.finish()]); }
/* is the rg16 copy bit-identical to psi's .rg?  read both back */
const readRG = async () => { const b = d.createBuffer({ size: bprRG * n * n, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }); const enc = d.createCommandEncoder(); enc.copyBufferToBuffer(rgBuf, 0, b, 0, bprRG * n * n); Q.submit([enc.finish()]); await b.mapAsync(GPUMapMode.READ); const u = new Uint16Array(b.getMappedRange().slice(0)); b.unmap(); b.destroy(); return u; };
const readPsi = async () => { const bpr = n * 8, b = d.createBuffer({ size: bpr * n * n, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }); const enc = d.createCommandEncoder(); enc.copyTextureToBuffer({ texture: psi }, { buffer: b, bytesPerRow: bpr, rowsPerImage: n }, [n, n, n]); Q.submit([enc.finish()]); await b.mapAsync(GPUMapMode.READ); const u = new Uint16Array(b.getMappedRange().slice(0)); b.unmap(); b.destroy(); return u; };
const U4 = await readPsi(), U2 = await readRG(); let rgDiff = 0;
for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const a = ((z * n + y) * n + x) * 4, b = ((z * n + y) * (bprRG / 4) + x) * 2; if (U4[a] !== U2[b] || U4[a + 1] !== U2[b + 1]) rgDiff++; }

/* ── the replica: render ── */
const BGL = d.createBindGroupLayout({ entries: [
  { binding: 0, visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
  { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '3d' } },
  { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '3d' } },
  { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
  { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
  { binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }] });
const layout = d.createPipelineLayout({ bindGroupLayouts: [BGL] });
const sampler = d.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge', addressModeW: 'clamp-to-edge' });
const pal = new Float32Array(1024).fill(1); const palBuf = mk(pal, GPUBufferUsage.STORAGE);
const viewBuf = d.createBuffer({ size: 176, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
const bgFor = (tex) => d.createBindGroup({ layout: BGL, entries: [{ binding: 0, resource: { buffer: viewBuf } }, { binding: 1, resource: tex.createView({ dimension: '3d' }) }, { binding: 2, resource: ref.createView({ dimension: '3d' }) }, { binding: 3, resource: sampler }, { binding: 4, resource: { buffer: stats } }, { binding: 5, resource: { buffer: palBuf } }] });
const BG4 = bgFor(psi), BG2 = bgFor(rgTex);
const rpipes = {};
const rp8 = (code, fmt = 'rgba8unorm') => { const m = d.createShaderModule({ code }); return d.createRenderPipeline({ layout, vertex: { module: m, entryPoint: 'vs' }, fragment: { module: m, entryPoint: 'fs', targets: [{ format: fmt }] }, primitive: { topology: 'triangle-list' } }); };
rpipes.ship = rp8(RW);
/* the texture-only floor: same ray, same steps, same sample, no shading and no early exit */
const LOOP_A = '    var w = 0.0; var c = vec3<f32>(0.0);';
const floorCode = must(RW, LOOP_A, '    col += vec3<f32>(dot(s, s)) * 1e-9; t += ds; continue;\n' + LOOP_A);
rpipes.texFloor = rp8(floorCode);
/* instrumented: marched samples and negligible samples per pixel, into rgba32float */
let instr = must(RW, '  for (var i = 0u; i < 512u; i++) {', '  var nIt = 0.0; var nNeg = 0.0;\n  for (var i = 0u; i < 512u; i++) {');
instr = must(instr, '    let a = 1.0 - exp(-wEff * sigma * stepN * 4.0);', '    let a = 1.0 - exp(-wEff * sigma * stepN * 4.0);\n    nIt += 1.0; if (a < 1e-5) { nNeg += 1.0; }');
instr = must(instr, '  if (tf <= t0) { return vec4<f32>(bg, 1.0); }', '  if (tf <= t0) { return vec4<f32>(0.0, 0.0, 0.0, 0.0); }');
instr = must(instr, '  return vec4<f32>(o, 1.0);\n}', '  return vec4<f32>(nIt, nNeg, 1.0, alpha);\n}');
rpipes.instr = rp8(instr, 'rgba32float');
const target = (w, h, fmt = 'rgba8unorm') => d.createTexture({ size: [w, h], format: fmt, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
const T1 = target(W, H), T2 = target(2 * W, 2 * H), TI = target(W, H, 'rgba32float');
const renderN = async (pipe, bg, tex, nn, view) => {
  orig(viewBuf, 0, view); await Q.onSubmittedWorkDone(); const t0 = performance.now();
  const enc = d.createCommandEncoder(), tv = tex.createView();
  for (let i = 0; i < nn; i++) { const p = enc.beginRenderPass({ colorAttachments: [{ view: tv, loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store' }] }); p.setPipeline(pipe); p.setBindGroup(0, bg); p.draw(3); p.end(); }
  Q.submit([enc.finish()]); await Q.onSubmittedWorkDone(); return (performance.now() - t0) / nn;
};
const timeIt = async (pipe, bg, tex, view) => { let nn = 8; for (;;) { const T = (await renderN(pipe, bg, tex, nn, view)) * nn; if (T >= 2500 || nn >= 40000) break; nn = T < 400 ? nn * 4 : Math.ceil(nn * 3000 / T); }
  const r = []; for (let k = 0; k < ROUNDS; k++) r.push(+(await renderN(pipe, bg, tex, nn, view)).toFixed(3)); return { min: Math.min(...r), rounds: r, n: nn, tickErrMs: +(100 / nn).toFixed(3) }; };
const readBack = async (pipe, bg, w, h, view, fmt = 'rgba8unorm') => {
  orig(viewBuf, 0, view); const tex = target(w, h, fmt), bpp = fmt === 'rgba8unorm' ? 4 : 16, bpr = Math.ceil(w * bpp / 256) * 256;
  const b = d.createBuffer({ size: bpr * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
  const enc = d.createCommandEncoder(); const p = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store' }] }); p.setPipeline(pipe); p.setBindGroup(0, bg); p.draw(3); p.end();
  enc.copyTextureToBuffer({ texture: tex }, { buffer: b, bytesPerRow: bpr }, [w, h]); Q.submit([enc.finish()]); await b.mapAsync(GPUMapMode.READ);
  const px = fmt === 'rgba8unorm' ? new Uint8Array(b.getMappedRange().slice(0)) : new Float32Array(b.getMappedRange().slice(0)); b.unmap(); b.destroy(); tex.destroy(); return { px, bpr, bpp };
};
const fnv = (px, w, h, bpr) => { let hsh = 2166136261 >>> 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * bpr + x * 4; hsh = Math.imul(hsh ^ (px[o] + (px[o + 1] << 8) + (px[o + 2] << 16)), 16777619) >>> 0; } return hsh.toString(16); };
const vWith = (patch) => { const v = V0.slice(); for (const [i, x] of Object.entries(patch)) v[+i] = x; return v; };
