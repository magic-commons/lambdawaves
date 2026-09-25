/* probes/W125/w125-k7-gates.js — probes/K/k7-gates.js UNCHANGED below this header, run on the W125 tree with the DEFAULT query
 * ('preset=1s%2B2pz&sw=0', no gastab): the table is armed at boot ('building'), built at the first AXIAL launch. */
/* probes/K/k7-gates.js — K7's gates WITH THE FLAG ON (run with query 'preset=1s%2B2pz&sw=0&gastab=1'):
 *  1. the first AXIAL press while the table is still building, and once it is on (no press waits for the table);
 *  2. the ORACLE: the app's own kernel (COMPUTE_WGSL copied from /lab/field.js, records from LW.modesAt, the table from the
 *     same gas.js module instance the app uploaded) on a replica volume — proved equal to field.fieldDigest() — against an
 *     f64 ψ = Σ c·norm·j_l(k r)·P_l(cos θ) at 3000 in-sphere voxels, in fp16 ulps from the correctly rounded value; the
 *     same for the recurrence (records with lag[3] = 0) as the yardstick;
 *  3. the PICTURE: RENDER_WGSL on both volumes with readPixels' own view block, density/phase/real × cloud, pixels that
 *     differ, against the shipped renderer's own next-present jitter;
 *  4. the SPEED: field.throughput({ targetMs: 2500 }).reconstructMs with the table on and off, 64/96/128. */
const LW = __LW, F = LW.field, d = F.device, Q = d.queue;
const out = {};
const t0 = performance.now();
LW.pause(); LW.governor.on = false; LW.quality.auto = false; LW.quality.autoScale = 1; LW.setHamiltonian('well');
out.tableAtReady = LW.gasTable();
{ const a = performance.now(); LW.setGasBasis('axial'); LW.enterBox(); out.firstAxialPressMs = +(performance.now() - a).toFixed(2); out.tableAtPress = LW.gasTable(); }
for (let i = 0; i < 200 && LW.gasTable() !== 'on'; i++) await new Promise((r) => setTimeout(r, 50));
out.tableOnAfterMs = +(performance.now() - t0).toFixed(0); out.table = LW.gasTable();
if (out.table !== 'on') return Object.assign(out, { E: 'the table never came on' });
LW.pause(); LW.clock.scrub(0); { const a = performance.now(); LW.enterBox(); out.pressWithTableOnMs = +(performance.now() - a).toFixed(2); } LW.pause();   // enterBox PLAYS: pause at once (AUDIT-A gas-pixels did the same)
const src = await (await fetch('/lab/field.js', { cache: 'no-store' })).text();
const grab = (name) => { const i = src.indexOf('const ' + name + ' = /* wgsl */`'); const a = src.indexOf('`', i) + 1, b = src.indexOf('`;', a); return src.slice(a, b); };
const CW = grab('COMPUTE_WGSL'), RW = grab('RENDER_WGSL');
const fm = await import('/lab/field.js'), gasjs = await import('/lab/gas.js');
const TAB = gasjs.gasRadialTable(), gtab = d.createBuffer({ size: TAB.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); Q.writeBuffer(gtab, 0, TAB);
const cpipe = d.createComputePipeline({ layout: 'auto', compute: { module: d.createShaderModule({ code: CW }), entryPoint: 'main' } });
const radial = d.createBuffer({ size: 40 * 256 * 4, usage: GPUBufferUsage.STORAGE });
const f16 = (h) => { const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff; if (e === 0) return s * Math.pow(2, -14) * (f / 1024); if (e === 31) return f ? NaN : s * Infinity; return s * Math.pow(2, e - 15) * (1 + f / 1024); };
const F32 = new Float32Array(1), U32 = new Uint32Array(F32.buffer);
const toF16 = (v) => { F32[0] = v; const x = U32[0], sign = (x >>> 16) & 0x8000; let e = ((x >>> 23) & 0xff) - 127 + 15, m = x & 0x7fffff;
  if (e >= 31) return sign | 0x7c00; if (e <= 0) { if (e < -10) return sign; m |= 0x800000; const sh = 14 - e; let h = m >>> sh; const rem = m & ((1 << sh) - 1), hw = 1 << (sh - 1); if (rem > hw || (rem === hw && (h & 1))) h++; return sign | h; }
  let h = (e << 10) | (m >>> 13); const rem = m & 0x1fff; if (rem > 0x1000 || (rem === 0x1000 && (h & 1))) h++; return sign | h; };
const key = (h) => (h & 0x8000) ? -(h & 0x7fff) : (h & 0x7fff);
const fill = (n, recs, half, space) => {
  const tex = d.createTexture({ size: [n, n, n], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC });
  const pa = new ArrayBuffer(32), pu = new Uint32Array(pa), pf = new Float32Array(pa); pu[0] = n; pu[1] = recs.length / 28; pu[3] = space; pf[4] = half;
  const params = d.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }); Q.writeBuffer(params, 0, pa);
  const mb = d.createBuffer({ size: recs.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); Q.writeBuffer(mb, 0, recs);
  const stats = d.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const enc = d.createCommandEncoder(), p = enc.beginComputePass(); p.setPipeline(cpipe);
  p.setBindGroup(0, d.createBindGroup({ layout: cpipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: params } }, { binding: 1, resource: { buffer: mb } }, { binding: 2, resource: tex.createView({ dimension: '3d' }) }, { binding: 3, resource: { buffer: stats } }, { binding: 4, resource: { buffer: radial } }, { binding: 5, resource: { buffer: gtab } }] }));
  p.dispatchWorkgroups(n / 4, n / 4, n / 4); p.end(); Q.submit([enc.finish()]);
  return { tex, stats, destroy() { tex.destroy(); params.destroy(); mb.destroy(); stats.destroy(); } };
};
const readTex = async (A, n) => { const bpr = n * 8, b = d.createBuffer({ size: bpr * n * n, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }); const enc = d.createCommandEncoder(); enc.copyTextureToBuffer({ texture: A.tex }, { buffer: b, bytesPerRow: bpr, rowsPerImage: n }, [n, n, n]); Q.submit([enc.finish()]); await b.mapAsync(GPUMapMode.READ); const u = new Uint16Array(b.getMappedRange().slice(0)); b.unmap(); b.destroy(); return u; };
const digestOf = (u) => { let h = 2166136261 >>> 0; for (let v = 0; v < u.length / 4; v++) h = (Math.imul(h ^ u[v * 4], 16777619) ^ u[v * 4 + 1]) >>> 0; return h.toString(16); };
out.oracle = {}; out.pixels = {};
const trace = []; out.trace = trace;
for (const TT of [0, 2.0]) for (const n of [64, 96, 128]) {
  trace.push([TT, n, LW.gas.on, LW.hamiltonian, LW.gasBasis]);
  LW.pause(); LW.clock.scrub(TT);   // TT = 0: the launch (AUDIT-A gas-pixels conditions); 2.0: the DIGEST LOCK gas state
  LW.quality.res = n; LW.quality.steps = { 64: 110, 96: 160, 128: 240 }[n]; LW.quality.scale = 1; LW.schedule(4); await LW.settle(); await LW.settle();
  const t = LW.clock.t, half = LW.domain.half, space = F.space, A = LW.gas.radius;
  const pk = fm.packModes(LW.modesAt(t)), count = pk.count, recsOn = pk.buf.slice(0, count * 28), recsOff = recsOn.slice();
  let rowsSet = 0; for (let m = 0; m < count; m++) { if (recsOff[m * 28 + 11] > 0.5) rowsSet++; recsOff[m * 28 + 11] = 0; }
  const V1 = fill(n, recsOn, half, space), V0 = fill(n, recsOff, half, space);
  const U1 = await readTex(V1, n), U0 = await readTex(V0, n), app = await F.fieldDigest();
  /* the oracle, inputs = the f32 records the GPU reads */
  let seed = 12345; const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296;
  let ampMax = 0; for (let v = 0; v < U1.length; v += 4) { const a = Math.hypot(f16(U1[v]), f16(U1[v + 1])); if (a > ampMax) ampMax = a; }
  const S = { tab: { max: 0, sum: 0, exact: 0 }, rec: { max: 0, sum: 0, exact: 0 } }; let ns = 0;
  while (ns < 3000) {
    const i = Math.floor(rnd() * n), j = Math.floor(rnd() * n), k = Math.floor(rnd() * n);
    const x = (i + 0.5) / n * 2 * half - half, y = (j + 0.5) / n * 2 * half - half, z = (k + 0.5) / n * 2 * half - half, r = Math.hypot(x, y, z);
    if (r >= A * 0.999) continue; const ct = r < 1e-9 ? 1 : z / r; let re = 0, im = 0;
    for (let m = 0; m < count; m++) { const o = m * 28, l = recsOn[o + 1], kk = recsOn[o + 8], v = recsOn[o + 6] * gasjs.sphj(l, kk * r) * gasjs.legP(l, ct); re += recsOn[o + 4] * v; im += recsOn[o + 5] * v; }
    const idx = (k * n * n + j * n + i) * 4; ns++;
    for (const [c, val] of [[0, re], [1, im]]) { const want = toF16(val);
      for (const [nm, U] of [['tab', U1], ['rec', U0]]) { const du = Math.abs(key(U[idx + c]) - key(want)); S[nm].max = Math.max(S[nm].max, du); S[nm].sum += du; if (!du) S[nm].exact++; } }
  }
  let differ = 0; for (let v = 0; v < U1.length; v += 4) for (const c of [0, 1]) if (U1[v + c] !== U0[v + c]) differ++;
  (out.oracle[TT] = out.oracle[TT] || {})[n] = { rowsSet, count, replicaIsApp: digestOf(U1) === app.hash, recurrenceReplicaDigest: digestOf(U0),
    table: { maxUlp: S.tab.max, meanUlp: +(S.tab.sum / 6000).toFixed(3), exactF16: +(S.tab.exact / 6000).toFixed(4) },
    recurrence: { maxUlp: S.rec.max, meanUlp: +(S.rec.sum / 6000).toFixed(3), exactF16: +(S.rec.exact / 6000).toFixed(4) },
    texelComponentsDiffering: differ, of: U1.length / 2 };
  /* the picture, at the canvas' size with readPixels' own view block (cloud, frame/axes off) */
  if (n !== 96) {
    const orig = Q.writeBuffer.bind(Q); let cap = null;
    Q.writeBuffer = function (buf, off, data, dOff, size) { if (cap) { const ta = ArrayBuffer.isView(data) ? data : new Uint8Array(data); const bpe = ta.BYTES_PER_ELEMENT || 1; const s0 = dOff || 0; const len = size !== undefined ? size : ta.length - s0; cap.push(new Uint8Array(ta.buffer, ta.byteOffset + s0 * bpe, len * bpe).slice()); } return orig(buf, off, data, dOff, size); };
    const W = F.canvas.width, H = F.canvas.height, matNC = Object.assign({}, LW.mat, { frame: false, axis: false });
    cap = []; const rpP = F.readPixels(LW.obs, matNC, W, H); const capV = cap; cap = null; await rpP; Q.writeBuffer = orig;
    const VV = new Float32Array(capV.find((b) => b.length === 176).buffer.slice(0));
    const BGL = d.createBindGroupLayout({ entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }, { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '3d' } }, { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '3d' } }, { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } }, { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }, { binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }] });
    const rm = d.createShaderModule({ code: RW });
    const rpipe = d.createRenderPipeline({ layout: d.createPipelineLayout({ bindGroupLayouts: [BGL] }), vertex: { module: rm, entryPoint: 'vs' }, fragment: { module: rm, entryPoint: 'fs', targets: [{ format: 'rgba8unorm' }] }, primitive: { topology: 'triangle-list' } });
    const sampler = d.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge', addressModeW: 'clamp-to-edge' });
    const pal = d.createBuffer({ size: 4096, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); Q.writeBuffer(pal, 0, new Float32Array(1024).fill(1));
    const viewBuf = d.createBuffer({ size: 176, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const render = async (A, view) => { Q.writeBuffer(viewBuf, 0, view); const tex = d.createTexture({ size: [W, H], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC }); const bpr = Math.ceil(W * 4 / 256) * 256;
      const b = d.createBuffer({ size: bpr * H, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
      const bg = d.createBindGroup({ layout: BGL, entries: [{ binding: 0, resource: { buffer: viewBuf } }, { binding: 1, resource: A.tex.createView({ dimension: '3d' }) }, { binding: 2, resource: A.tex.createView({ dimension: '3d' }) }, { binding: 3, resource: sampler }, { binding: 4, resource: { buffer: A.stats } }, { binding: 5, resource: { buffer: pal } }] });
      const enc = d.createCommandEncoder(), p = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store' }] }); p.setPipeline(rpipe); p.setBindGroup(0, bg); p.draw(3); p.end();
      enc.copyTextureToBuffer({ texture: tex }, { buffer: b, bytesPerRow: bpr }, [W, H]); Q.submit([enc.finish()]); await b.mapAsync(GPUMapMode.READ); const px = new Uint8Array(b.getMappedRange().slice(0)); b.unmap(); b.destroy(); tex.destroy(); return { px, bpr }; };
    const cmp = (a, b) => { let px = 0, mx = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = y * a.bpr + x * 4; let any = false; for (let c = 0; c < 3; c++) { const dd = Math.abs(a.px[o + c] - b.px[o + c]); if (dd) { any = true; mx = Math.max(mx, dd); } } if (any) px++; } return { pixelsDiffering: px, fraction: +(px / (W * H)).toExponential(3), maxLevelDiff: mx }; };
    const P = { W, H };
    for (const [name, v] of [['density', 0], ['phase', 1], ['real', 2]]) { const view = VV.slice(); view[16] = v; view[28] = 0; view[39] = 0; view[35] = 0; P[name] = cmp(await render(V0, view), await render(V1, view)); }
    { const v2 = VV.slice(); v2[19] = ((Math.round(VV[19] * 97) + 1) % 97) / 97; P.shippedNextPresent = cmp(await render(V0, VV), await render(V0, v2)); }
    (out.pixels[TT] = out.pixels[TT] || {})[n] = P; viewBuf.destroy(); pal.destroy();
  }
  V1.destroy(); V0.destroy();
}
/* the speed, the app's own road */
out.reconstructMs = {}; out.beforeSpeed = { gpuError: F.lastGpuError || null, pageErrors: (window.__e || []).slice(0, 5), writeBufferIsOwn: Object.prototype.hasOwnProperty.call(Q, "writeBuffer"), gasOn: LW.gas.on, hamiltonian: LW.hamiltonian, basis: LW.gasBasis, playing: LW.clock.playing, t: LW.clock.t, radius: LW.gas.radius, last: LW.gas.last };
for (const n of [64, 96, 128]) {
  LW.quality.res = n; LW.quality.steps = { 64: 110, 96: 160, 128: 240 }[n]; LW.schedule(4); await LW.settle(); await LW.settle();
  const row = {};
  for (const on of [true, false, true, false]) {
    LW.gasTable(on); for (let i = 0; i < 100 && LW.gasTable() !== (on ? 'on' : 'off'); i++) await new Promise((r) => setTimeout(r, 20));
    const r = await F.throughput({ modes: LW.modesAt(LW.clock.t), obs: LW.obs, mat: LW.mat, targetMs: 2500 });
    const k = on ? 'table' : 'recurrence'; row[k] = Math.min(row[k] || Infinity, r.reconstructMs); row.modes = r.modes; row.nR = r.nReconstruct; row.frameMs = r.frameMs; row.presentMs = r.presentMs;
  }
  out.reconstructMs[n] = row;
}
LW.gasTable(true); gtab.destroy(); radial.destroy();
return out;
