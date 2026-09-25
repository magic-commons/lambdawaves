/* gas-kernel.js — LANE A probe body: THE AXIAL GAS KERNEL, shipped vs throwaway variants, timed and bit-compared.
 * The shipped COMPUTE_WGSL is copied out of lab/field.js AS TEXT (fetch), so V0 is byte-for-byte the kernel that ships.
 * Variants are string edits of that copy, compiled into THIS probe's own pipelines on the app's device; nothing in lab/ changes.
 * Timing = n dispatches in one pass, one submit, one wait (field.js' own moleculeThroughput method), n sized to >= ~2 s so
 * Firefox's ~100 ms completion poll is <= 5 %; variants interleaved per round (other lanes share the GPU). */
const LW = __LW, F = LW.field, d = F.device;
const src = await (await fetch('/lab/field.js', { cache: 'no-store' })).text();
const grab = (name) => { const i = src.indexOf('const ' + name + ' = /* wgsl */`'); if (i < 0) throw new Error('no ' + name); const a = src.indexOf('`', i) + 1, b = src.indexOf('`;', a); return src.slice(a, b); };
const CW = grab('COMPUTE_WGSL');
const must = (s, from, to) => { if (s.indexOf(from) < 0) throw new Error('patch anchor missing: ' + from.slice(0, 60)); return s.replace(from, to); };
LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.enterBox(); LW.pause(); await LW.settle();
const t = LW.clock.t, modes = LW.modesAt(t);
const fm = await import('/lab/field.js');
const pk = fm.packModes(modes), count = pk.count, recs = pk.buf.slice(0, count * 28);
const half = LW.domain.half, space = F.space, A = LW.gas.radius;
const gasjs = await import('/lab/gas.js');
const RES = (globalThis.__A_RES || [64, 96, 128]), ROUNDS = globalThis.__A_ROUNDS || 3, ONLY = globalThis.__A_ONLY || null;
const info = { count, half, space, A, fieldRes: F.resolution, t, adapterFeatures: [...(F.adapter && F.adapter.features || [])] };

/* ── the variants ── */
const SHIP_SEL = 'f = select(0.0, M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw, r < aa);';
const EARLY = 'if (r < aa) { f = M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw; }';
const V = {};
const LOOP_FROM_0 = '    for (var a = 0u; a < P.count; a++) {';
V.ship = CW;
V.early = must(CW, SHIP_SEL, EARLY);
V.empty = must(CW, LOOP_FROM_0, '    for (var a = 0u; a < 0u; a++) {');   // TIMING FLOOR ONLY: no modes at all (the dispatch + textureStore + reduction)
V.stub = must(CW, SHIP_SEL,'if (r < aa) { let xx = max(kk * r, 1e-5); f = M.c.z * (sin(xx) / xx) * ipow(st, am) * Dw; }');   // TIMING FLOOR ONLY: j_l replaced by j_0 (wrong numbers)
/* memo: geometry keyed on the mode's centre, P_l keyed on l, e^{imφ} keyed on m — the SAME expressions on the SAME inputs, skipped when repeated */
const GEO_FROM = `      let M = modes[a];
      let q = pos - M.ctr.xyz;                               // geometry relative to the mode's centre
      let r = length(q);
      let ct = select(q.z / max(r, 1e-12), 1.0, r < 1e-9);
      let st = sqrt(max(0.0, 1.0 - ct * ct));
      let phi = atan2(q.y, q.x);`;
const GEO_TO = `      let M = modes[a];
      if (a == 0u || any(M.ctr.xyz != gC)) { gC = M.ctr.xyz; gq = pos - gC; gr = length(gq); gct = select(gq.z / max(gr, 1e-12), 1.0, gr < 1e-9); gst = sqrt(max(0.0, 1.0 - gct * gct)); gphi = atan2(gq.y, gq.x); gL = 999u; gMM = -1e30; }
      let q = gq; let r = gr; let ct = gct; let st = gst; let phi = gphi;`;
const LOOP_FROM = '    for (var a = 0u; a < P.count; a++) {';
const LOOP_TO = '    var gC = vec3<f32>(0.0); var gq = vec3<f32>(0.0); var gr = 0.0; var gct = 1.0; var gst = 0.0; var gphi = 0.0; var gL = 999u; var gP = 0.0; var gMM = -1e30; var gE = vec2<f32>(1.0, 0.0);\n' + LOOP_FROM;
const DW_FROM = 'let Dw = select(D, legP(l, ct), M.lag0.z > 0.5);';
const DW_TO = 'var Dw = D; if (M.lag0.z > 0.5) { if (l != gL) { gL = l; gP = legP(l, ct); } Dw = gP; }';
const E_FROM = 'let e = vec2<f32>(cos(mm * phi), sin(mm * phi));';
const E_TO = 'if (mm != gMM) { gMM = mm; gE = vec2<f32>(cos(mm * phi), sin(mm * phi)); } let e = gE;';
const memo = (s) => must(must(must(must(s, LOOP_FROM, LOOP_TO), GEO_FROM, GEO_TO), DW_FROM, DW_TO), E_FROM, E_TO);
V.memo = memo(CW);
V.earlyMemo = memo(V.early);
/* the TABULATED radial road: row = mode index (lag0.w), u = r/a on [0,1], linear or cubic Hermite */
const TABDECL = '@group(0) @binding(4) var<storage, read> radial: array<f32>;';
const tabLin = (N) => must(must(memo(CW), TABDECL, TABDECL + '\n@group(0) @binding(5) var<storage, read> gtab: array<f32>;'), SHIP_SEL,
  `if (r < aa) { let xq = clamp(r / aa, 0.0, 1.0) * ${N - 1}.0; let i0 = min(u32(floor(xq)), ${N - 2}u); let fr = xq - f32(i0); let rb = u32(M.lag0.w) * ${N}u;
        let R = mix(gtab[rb + i0], gtab[rb + i0 + 1u], fr); f = M.c.z * R * ipow(st, am) * Dw; }`);
const tabHerm = (N) => must(must(memo(CW), TABDECL, TABDECL + '\n@group(0) @binding(5) var<storage, read> gtab: array<vec2<f32>>;'), SHIP_SEL,
  `if (r < aa) { let xq = clamp(r / aa, 0.0, 1.0) * ${N - 1}.0; let i0 = min(u32(floor(xq)), ${N - 2}u); let s = xq - f32(i0); let rb = u32(M.lag0.w) * ${N}u;
        let p0 = gtab[rb + i0]; let p1 = gtab[rb + i0 + 1u]; let s2 = s * s; let s3 = s2 * s;
        let R = (2.0 * s3 - 3.0 * s2 + 1.0) * p0.x + (s3 - 2.0 * s2 + s) * p0.y + (3.0 * s2 - 2.0 * s3) * p1.x + (s3 - s2) * p1.y; f = M.c.z * R * ipow(st, am) * Dw; }`);
const TABS = { lin1024: ['lin', 1024], lin2048: ['lin', 2048], lin4096: ['lin', 4096], herm256: ['herm', 256], herm512: ['herm', 512] };
for (const [k, [kind, N]] of Object.entries(TABS)) V['tab_' + k] = kind === 'lin' ? tabLin(N) : tabHerm(N);
if (ONLY) for (const k of Object.keys(V)) if (!ONLY.includes(k)) delete V[k];

/* ── the tables, in f64, from gas.js' own j_l ── */
const sphj = gasjs.sphj;
const jprime = (l, x) => { if (x < 1e-6) return l === 1 ? 1 / 3 : 0; return l === 0 ? -sphj(1, x) : sphj(l - 1, x) - (l + 1) / x * sphj(l, x); };
const tabBuf = {};
const tb0 = performance.now();
for (const [k, [kind, N]] of Object.entries(TABS)) {
  if (!V['tab_' + k]) continue;
  const w = kind === 'lin' ? 1 : 2, arr = new Float32Array(count * N * w), h = 1 / (N - 1);
  for (let m = 0; m < count; m++) { const l = modes[m].table.l, z = modes[m].table.lag[0] * modes[m].table.lag[1];
    for (let j = 0; j < N; j++) { const u = j * h; arr[(m * N + j) * w] = sphj(l, z * u); if (w === 2) arr[(m * N + j) * 2 + 1] = h * z * jprime(l, z * u); } }
  const b = d.createBuffer({ size: arr.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); d.queue.writeBuffer(b, 0, arr); tabBuf[k] = { b, bytes: arr.byteLength };
}
info.tableBuildMsAll = +(performance.now() - tb0).toFixed(1);
const recsTab = recs.slice(); for (let m = 0; m < count; m++) recsTab[m * 28 + 11] = m;     // lag0.w = the row

/* ── pipelines ── */
const msgs = {};
const pipes = {};
for (const [k, code] of Object.entries(V)) {
  const mod = d.createShaderModule({ code }); const ci = await mod.getCompilationInfo();
  const errs = ci.messages.filter((m) => m.type === 'error'); if (errs.length) { msgs[k] = errs.map((m) => m.lineNum + ':' + m.message); continue; }
  pipes[k] = d.createComputePipeline({ layout: 'auto', compute: { module: mod, entryPoint: 'main' } });
}
const mkRes = (n) => {
  const tex = d.createTexture({ size: [n, n, n], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC });
  const params = d.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const pa = new ArrayBuffer(32), pu = new Uint32Array(pa), pf = new Float32Array(pa); pu[0] = n; pu[1] = count; pu[2] = 0; pu[3] = space; pf[4] = half; d.queue.writeBuffer(params, 0, pa);
  const mb = d.createBuffer({ size: recs.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); d.queue.writeBuffer(mb, 0, recs);
  const mbT = d.createBuffer({ size: recs.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); d.queue.writeBuffer(mbT, 0, recsTab);
  const stats = d.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
  const radial = d.createBuffer({ size: 40 * 256 * 4, usage: GPUBufferUsage.STORAGE });
  const bg = {};
  for (const [k, p] of Object.entries(pipes)) {
    const tab = k.startsWith('tab_') ? tabBuf[k.slice(4)] : null;
    const e = [{ binding: 0, resource: { buffer: params } }, { binding: 1, resource: { buffer: tab ? mbT : mb } }, { binding: 2, resource: tex.createView({ dimension: '3d' }) }, { binding: 3, resource: { buffer: stats } }, { binding: 4, resource: { buffer: radial } }];
    if (tab) e.push({ binding: 5, resource: { buffer: tab.b } });
    bg[k] = d.createBindGroup({ layout: p.getBindGroupLayout(0), entries: e });
  }
  return { n, tex, stats, bg, destroy() { tex.destroy(); params.destroy(); mb.destroy(); mbT.destroy(); stats.destroy(); radial.destroy(); } };
};
const dispatchN = async (R, k, n) => {
  await d.queue.onSubmittedWorkDone(); const t0 = performance.now();
  const enc = d.createCommandEncoder(), pass = enc.beginComputePass(); pass.setPipeline(pipes[k]); pass.setBindGroup(0, R.bg[k]);
  const g = Math.ceil(R.n / 4); for (let i = 0; i < n; i++) pass.dispatchWorkgroups(g, g, g); pass.end(); d.queue.submit([enc.finish()]);
  await d.queue.onSubmittedWorkDone(); return (performance.now() - t0) / n;
};
const readTex = async (R, k) => {
  d.queue.writeBuffer(R.stats, 0, new Uint32Array(4));
  await dispatchN(R, k, 1);
  const bpr = R.n * 8, buf = d.createBuffer({ size: bpr * R.n * R.n, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
  const enc = d.createCommandEncoder(); enc.copyTextureToBuffer({ texture: R.tex }, { buffer: buf, bytesPerRow: bpr, rowsPerImage: R.n }, [R.n, R.n, R.n]); d.queue.submit([enc.finish()]);
  await buf.mapAsync(GPUMapMode.READ); const u = new Uint16Array(buf.getMappedRange().slice(0)); buf.unmap(); buf.destroy(); return u;
};
const f16 = (h) => { const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff; if (e === 0) return s * Math.pow(2, -14) * (f / 1024); if (e === 31) return f ? NaN : s * Infinity; return s * Math.pow(2, e - 15) * (1 + f / 1024); };
const F32 = new Float32Array(1), U32 = new Uint32Array(F32.buffer);
const toF16 = (v) => { F32[0] = v; const x = U32[0], sign = (x >>> 16) & 0x8000; let e = ((x >>> 23) & 0xff) - 127 + 15, m = x & 0x7fffff;
  if (e >= 31) return sign | 0x7c00; if (e <= 0) { if (e < -10) return sign; m |= 0x800000; const sh = 14 - e; let h = m >>> sh; const rem = m & ((1 << sh) - 1), hw = 1 << (sh - 1); if (rem > hw || (rem === hw && (h & 1))) h++; return sign | h; }
  let h = (e << 10) | (m >>> 13); const rem = m & 0x1fff; if (rem > 0x1000 || (rem === 0x1000 && (h & 1))) h++; return sign | h; };
const key = (h) => (h & 0x8000) ? -(h & 0x7fff) : (h & 0x7fff);

/* the f64 oracle at sampled voxels: ψ = Σ c_a norm_a j_l(k r) P_l(cos θ), r < a — the inputs are the f32 records the GPU reads */
const oracle = (n, samples) => { let seed = 12345; const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296; const out = [];
  while (out.length < samples) { const i = Math.floor(rnd() * n), j = Math.floor(rnd() * n), k = Math.floor(rnd() * n);
    const x = (i + 0.5) / n * 2 * half - half, y = (j + 0.5) / n * 2 * half - half, z = (k + 0.5) / n * 2 * half - half, r = Math.hypot(x, y, z);
    if (r >= A * 0.999) continue; const ct = r < 1e-9 ? 1 : z / r; let re = 0, im = 0;
    for (let m = 0; m < count; m++) { const o = m * 28, l = recs[o + 1], kk = recs[o + 8], v = recs[o + 6] * sphj(l, kk * r) * gasjs.legP(l, ct); re += recs[o + 4] * v; im += recs[o + 5] * v; }
    out.push({ idx: (k * n * n + j * n + i) * 4, re, im }); }
  return out; };

const order = Object.keys(pipes);
const out = { info, compileErrors: msgs, variants: order, res: {} };
for (const n of RES) {
  const R = mkRes(n), T = {}; for (const k of order) T[k] = [];
  /* SIZE n ON THE TOTAL, not on a pilot: Firefox resolves onSubmittedWorkDone on a 100 ms tick (dispatch-floor.out.json:
     even an idle wait is 100 ms), so a pilot of 2 dispatches reads 50 ms whatever the kernel costs.  Grow n until one
     batch takes >= 2.5 s, so the tick is <= 4 % of the reading. */
  const NN = {};
  for (const k of order) { let n0 = 4; for (;;) { const T0 = (await dispatchN(R, k, n0)) * n0; if (T0 >= 2500 || n0 >= 40000) break; n0 = T0 < 400 ? n0 * 4 : Math.ceil(n0 * 3000 / T0); } NN[k] = n0; }
  for (let rd = 0; rd < ROUNDS; rd++) for (const k of order) T[k].push(+(await dispatchN(R, k, NN[k])).toFixed(3));
  const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
  const U = {}; for (const k of order) U[k] = await readTex(R, k);
  const base = U.ship || U[order[0]], ORC = oracle(n, 3000);
  let ampMax = 0; for (let v = 0; v < base.length; v += 4) { const a = Math.hypot(f16(base[v]), f16(base[v + 1])); if (a > ampMax) ampMax = a; }
  let inside = 0; for (let v = 0; v < base.length; v += 4) if (base[v] || base[v + 1]) inside++;
  const cmp = {};
  for (const k of order) {
    const u = U[k]; let diff = 0, maxUlp = 0, maxAbs = 0; const hist = {};
    for (let v = 0; v < u.length; v += 4) for (const c of [0, 1]) { const a = base[v + c], b = u[v + c]; if (a !== b) { diff++; const du = Math.abs(key(a) - key(b)); maxUlp = Math.max(maxUlp, du); const bin = du <= 1 ? '1' : du <= 4 ? '2-4' : du <= 16 ? '5-16' : du <= 256 ? '17-256' : '>256'; hist[bin] = (hist[bin] || 0) + 1; maxAbs = Math.max(maxAbs, Math.abs(f16(a) - f16(b))); } }
    /* against the oracle: fp16 ulps from the correctly rounded exact value, and |error| / max|ψ| */
    let exact = 0, ulpSum = 0, ulpMax = 0, relMax = 0, relSq = 0;
    for (const s of ORC) for (const [c, val] of [[0, s.re], [1, s.im]]) { const hb = u[s.idx + c], want = toF16(val), du = Math.abs(key(hb) - key(want)); if (!du) exact++; ulpSum += du; ulpMax = Math.max(ulpMax, du); const rel = Math.abs(f16(hb) - val) / ampMax; relMax = Math.max(relMax, rel); relSq += rel * rel; }
    const m2 = ORC.length * 2;
    cmp[k] = { ms: med(T[k]), rounds: T[k], n: NN[k], tickErrMs: +(100 / NN[k]).toFixed(3), vsShip: { texelComponents: base.length / 2, differ: diff, maxUlp, hist, maxAbsOverAmpMax: +(maxAbs / ampMax).toExponential(3) },
      vsOracle: { samples: m2, exactF16: +(exact / m2).toFixed(4), meanUlp: +(ulpSum / m2).toFixed(3), maxUlp: ulpMax, maxErrOverAmpMax: +relMax.toExponential(3), rmsErrOverAmpMax: +Math.sqrt(relSq / m2).toExponential(3) } };
  }
  out.res[n] = { ampMax, nonzeroVoxelFraction: +(inside / (base.length / 4)).toFixed(4), cmp };
  R.destroy();
}
out.tables = Object.fromEntries(Object.entries(tabBuf).map(([k, v]) => [k, v.bytes]));
for (const v of Object.values(tabBuf)) v.b.destroy();
return out;
