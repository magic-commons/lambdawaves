/* gas-pixels.js — what the TABULATED gas kernel does to the PICTURE: the shipped kernel and the Hermite-256 table kernel
 * each fill their own volume (and their own stats max), and the shipped RENDER_WGSL presents both with the view block
 * field.readPixels itself writes, at the canvas size, for density/phase/real × cloud.  rgba8 bytes compared.
 * PRE: globalThis.__A_GRID = 64 | 96 | 128. */
const LW = __LW, F = LW.field, d = F.device, Q = d.queue;
const src = await (await fetch('/lab/field.js', { cache: 'no-store' })).text();
const grab = (name) => { const i = src.indexOf('const ' + name + ' = /* wgsl */`'); const a = src.indexOf('`', i) + 1, b = src.indexOf('`;', a); return src.slice(a, b); };
const CW = grab('COMPUTE_WGSL'), RW = grab('RENDER_WGSL');
const must = (s, from, to) => { if (s.indexOf(from) < 0) throw new Error('patch anchor missing: ' + from.slice(0, 70)); return s.replace(from, to); };
const GRID = globalThis.__A_GRID || 128;
LW.governor.on = false; LW.quality.auto = false; LW.quality.autoScale = 1;
LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.enterBox(); LW.pause();
LW.quality.res = GRID; LW.quality.steps = { 64: 110, 96: 160, 128: 240 }[GRID]; LW.quality.scale = { 64: 0.75, 96: 1, 128: 1 }[GRID]; LW.schedule(4); await LW.settle(); await LW.settle();
const canvas = document.getElementById('field'), W = canvas.width, H = canvas.height;
const modes = LW.modesAt(LW.clock.t), fm = await import('/lab/field.js'), gasjs = await import('/lab/gas.js');
const pk = fm.packModes(modes), count = pk.count, recs = pk.buf.slice(0, count * 28), recsT = recs.slice(); for (let m = 0; m < count; m++) recsT[m * 28 + 11] = m;
const n = F.resolution, half = LW.domain.half;
/* the Hermite table, from gas.js' own f64 j_l */
const N = 256, sphj = gasjs.sphj, h = 1 / (N - 1), tab = new Float32Array(count * N * 2);
const jprime = (l, x) => { if (x < 1e-6) return l === 1 ? 1 / 3 : 0; return l === 0 ? -sphj(1, x) : sphj(l - 1, x) - (l + 1) / x * sphj(l, x); };
const tb0 = performance.now();
for (let m = 0; m < count; m++) { const l = modes[m].table.l, z = modes[m].table.lag[0] * modes[m].table.lag[1]; for (let j = 0; j < N; j++) { const u = j * h; tab[(m * N + j) * 2] = sphj(l, z * u); tab[(m * N + j) * 2 + 1] = h * z * jprime(l, z * u); } }
const tableMs = performance.now() - tb0;
const SHIP_SEL = 'f = select(0.0, M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw, r < aa);';
const TABDECL = '@group(0) @binding(4) var<storage, read> radial: array<f32>;';
const TW = must(must(CW, TABDECL, TABDECL + '\n@group(0) @binding(5) var<storage, read> gtab: array<vec2<f32>>;'), SHIP_SEL,
  `if (r < aa) { let xq = clamp(r / aa, 0.0, 1.0) * ${N - 1}.0; let i0 = min(u32(floor(xq)), ${N - 2}u); let s = xq - f32(i0); let rb = u32(M.lag0.w) * ${N}u;
        let p0 = gtab[rb + i0]; let p1 = gtab[rb + i0 + 1u]; let s2 = s * s; let s3 = s2 * s;
        let R = (2.0 * s3 - 3.0 * s2 + 1.0) * p0.x + (s3 - 2.0 * s2 + s) * p0.y + (3.0 * s2 - 2.0 * s3) * p1.x + (s3 - s2) * p1.y; f = M.c.z * R * ipow(st, am) * Dw; }`);
const mkB = (bytes, usage) => { const b = d.createBuffer({ size: Math.max(16, bytes.byteLength), usage: usage | GPUBufferUsage.COPY_DST }); Q.writeBuffer(b, 0, bytes); return b; };
const pa = new ArrayBuffer(32), pu = new Uint32Array(pa), pf = new Float32Array(pa); pu[0] = n; pu[1] = count; pu[3] = F.space; pf[4] = half;
const params = mkB(new Uint8Array(pa), GPUBufferUsage.UNIFORM), radial = d.createBuffer({ size: 40 * 256 * 4, usage: GPUBufferUsage.STORAGE }), gtab = mkB(tab, GPUBufferUsage.STORAGE);
const fill = (code, rec, withTab) => {
  const pipe = d.createComputePipeline({ layout: 'auto', compute: { module: d.createShaderModule({ code }), entryPoint: 'main' } });
  const tex = d.createTexture({ size: [n, n, n], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING });
  const stats = d.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }), mb = mkB(rec, GPUBufferUsage.STORAGE);
  const e = [{ binding: 0, resource: { buffer: params } }, { binding: 1, resource: { buffer: mb } }, { binding: 2, resource: tex.createView({ dimension: '3d' }) }, { binding: 3, resource: { buffer: stats } }, { binding: 4, resource: { buffer: radial } }];
  if (withTab) e.push({ binding: 5, resource: { buffer: gtab } });
  const enc = d.createCommandEncoder(), p = enc.beginComputePass(); p.setPipeline(pipe); p.setBindGroup(0, d.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: e })); p.dispatchWorkgroups(n / 4, n / 4, n / 4); p.end(); Q.submit([enc.finish()]);
  return { tex, stats };
};
const A0 = fill(CW, recs, false), A1 = fill(TW, recsT, true);
/* the view block readPixels writes */
const orig = Q.writeBuffer.bind(Q); let cap = null;
Q.writeBuffer = function (buf, off, data, dOff, size) { if (cap) { const ta = ArrayBuffer.isView(data) ? data : new Uint8Array(data); const bpe = ta.BYTES_PER_ELEMENT || 1; const s0 = dOff || 0; const len = size !== undefined ? size : ta.length - s0; cap.push(new Uint8Array(ta.buffer, ta.byteOffset + s0 * bpe, len * bpe).slice()); } return orig(buf, off, data, dOff, size); };
const matNC = Object.assign({}, LW.mat, { frame: false, axis: false });
cap = []; const rpP = F.readPixels(LW.obs, matNC, W, H); const capV = cap; cap = null; const rp = await rpP; Q.writeBuffer = orig;
const V0 = new Float32Array(capV.find((b) => b.length === 176).buffer.slice(0));
const BGL = d.createBindGroupLayout({ entries: [
  { binding: 0, visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
  { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '3d' } },
  { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '3d' } },
  { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
  { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
  { binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }] });
const m = d.createShaderModule({ code: RW });
const rpipe = d.createRenderPipeline({ layout: d.createPipelineLayout({ bindGroupLayouts: [BGL] }), vertex: { module: m, entryPoint: 'vs' }, fragment: { module: m, entryPoint: 'fs', targets: [{ format: 'rgba8unorm' }] }, primitive: { topology: 'triangle-list' } });
const sampler = d.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge', addressModeW: 'clamp-to-edge' });
const pal = mkB(new Float32Array(1024).fill(1), GPUBufferUsage.STORAGE), viewBuf = d.createBuffer({ size: 176, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
const render = async (A, view) => { Q.writeBuffer(viewBuf, 0, view); const tex = d.createTexture({ size: [W, H], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC }); const bpr = Math.ceil(W * 4 / 256) * 256;
  const b = d.createBuffer({ size: bpr * H, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
  const bg = d.createBindGroup({ layout: BGL, entries: [{ binding: 0, resource: { buffer: viewBuf } }, { binding: 1, resource: A.tex.createView({ dimension: '3d' }) }, { binding: 2, resource: A.tex.createView({ dimension: '3d' }) }, { binding: 3, resource: sampler }, { binding: 4, resource: { buffer: A.stats } }, { binding: 5, resource: { buffer: pal } }] });
  const enc = d.createCommandEncoder(), p = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store' }] }); p.setPipeline(rpipe); p.setBindGroup(0, bg); p.draw(3); p.end();
  enc.copyTextureToBuffer({ texture: tex }, { buffer: b, bytesPerRow: bpr }, [W, H]); Q.submit([enc.finish()]); await b.mapAsync(GPUMapMode.READ); const px = new Uint8Array(b.getMappedRange().slice(0)); b.unmap(); b.destroy(); tex.destroy(); return { px, bpr }; };
const fnv = (px, bpr) => { let hsh = 2166136261 >>> 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = y * bpr + x * 4; hsh = Math.imul(hsh ^ (px[o] + (px[o + 1] << 8) + (px[o + 2] << 16)), 16777619) >>> 0; } return hsh.toString(16); };
const out = { grid: n, W, H, count, tableMs: +tableMs.toFixed(1), tableBytes: tab.byteLength, appReadPixelsHash: rp.hash, views: {} };
for (const [name, v] of [['density', 0], ['phase', 1], ['real', 2]]) {
  const view = V0.slice(); view[16] = v; view[28] = 0; view[39] = 0;
  const a = await render(A0, view), b = await render(A1, view); let px = 0, bytes = 0, mx = 0; const hist = {};
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = y * a.bpr + x * 4; let any = false; for (let c = 0; c < 3; c++) { const dd = Math.abs(a.px[o + c] - b.px[o + c]); if (dd) { bytes++; any = true; mx = Math.max(mx, dd); hist[dd] = (hist[dd] || 0) + 1; } } if (any) px++; }
  out.views[name] = { shipHash: fnv(a.px, a.bpr), tabHash: fnv(b.px, b.bpr), replicaIsApp: name === 'density' ? undefined : undefined, pixelsDiffering: px, fraction: +(px / (W * H)).toExponential(3), channelBytesDiffering: bytes, maxLevelDiff: mx, levelHist: hist };
}
/* the yardstick: the SHIPPED renderer on the SHIPPED volume, one present later (the jitter seed (presents+1) % 97) */
{ const v1 = V0.slice(), v2 = V0.slice(); v2[19] = ((Math.round(V0[19] * 97) + 1) % 97) / 97; const a = await render(A0, v1), b = await render(A0, v2); let px = 0, mx = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = y * a.bpr + x * 4; let any = false; for (let c = 0; c < 3; c++) { const dd = Math.abs(a.px[o + c] - b.px[o + c]); if (dd) { any = true; mx = Math.max(mx, dd); } } if (any) px++; }
  out.shippedNextPresent = { pixelsDiffering: px, fraction: +(px / (W * H)).toExponential(3), maxLevelDiff: mx }; }
out.replicaMatchesApp =out.views[['density', 'phase', 'real'][LW.mat.view] || 'phase'] ? (out.views[['density', 'phase', 'real'][LW.mat.view]].shipHash === rp.hash) : null;
A0.tex.destroy(); A1.tex.destroy();
LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('1s+2pz'); LW.pause();
return out;
