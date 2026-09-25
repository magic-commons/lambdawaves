/* kernel-variants.js — LANE A probe body: the eigenmode kernel's BIT-IDENTICAL variants on three states
 * (91 hydrogen labels · the BOX 91-label packet · the AXIAL GAS), timed and compared texel-for-texel against the shipped
 * kernel copied out of lab/field.js as text.  PRE may set globalThis.__A_SCEN = ['h91','box','gas'], __A_RES, __A_ROUNDS.
 * Timing: n dispatches / one pass / one wait, n grown until a batch is >= 2.5 s (Firefox's 100 ms completion tick);
 * the MIN over rounds is reported beside every round, because other lanes share this GPU. */
const LW = __LW, F = LW.field, d = F.device;
const src = await (await fetch('/lab/field.js', { cache: 'no-store' })).text();
const grab = (name) => { const i = src.indexOf('const ' + name + ' = /* wgsl */`'); const a = src.indexOf('`', i) + 1, b = src.indexOf('`;', a); return src.slice(a, b); };
const CW = grab('COMPUTE_WGSL');
const must = (s, from, to) => { if (s.indexOf(from) < 0) throw new Error('patch anchor missing: ' + from.slice(0, 70)); return s.replace(from, to); };
const SCEN = globalThis.__A_SCEN || ['h91', 'box', 'gas'], RES = globalThis.__A_RES || [64, 96, 128], ROUNDS = globalThis.__A_ROUNDS || 3;

const SHIP_SEL = 'f = select(0.0, M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw, r < aa);';
const EARLY = 'if (r < aa) { f = M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw; }';
const GEO_FROM = `      let M = modes[a];
      let q = pos - M.ctr.xyz;                               // geometry relative to the mode's centre
      let r = length(q);
      let ct = select(q.z / max(r, 1e-12), 1.0, r < 1e-9);
      let st = sqrt(max(0.0, 1.0 - ct * ct));
      let phi = atan2(q.y, q.x);`;
const GEO_TO = `      let M = modes[a];
      if (a == 0u || any(M.ctr.xyz != gC)) { gC = M.ctr.xyz; gq = pos - gC; gr = length(gq); gct = select(gq.z / max(gr, 1e-12), 1.0, gr < 1e-9); gst = sqrt(max(0.0, 1.0 - gct * gct)); gphi = atan2(gq.y, gq.x); gL = 999u; gMM = -1e30; gN = -1.0; }
      let q = gq; let r = gr; let ct = gct; let st = gst; let phi = gphi;`;
const LOOP_FROM = '    for (var a = 0u; a < P.count; a++) {';
const LOOP_TO = '    var gC = vec3<f32>(0.0); var gq = vec3<f32>(0.0); var gr = 0.0; var gct = 1.0; var gst = 0.0; var gphi = 0.0; var gL = 999u; var gP = 0.0; var gMM = -1e30; var gE = vec2<f32>(1.0, 0.0); var gN = -1.0; var gRho = 0.0; var gEx = 0.0;\n' + LOOP_FROM;
const DW_FROM = 'let Dw = select(D, legP(l, ct), M.lag0.z > 0.5);';
const DW_TO = 'var Dw = D; if (M.lag0.z > 0.5) { if (l != gL) { gL = l; gP = legP(l, ct); } Dw = gP; }';
const E_FROM = 'let e = vec2<f32>(cos(mm * phi), sin(mm * phi));';
const E_TO = 'if (mm != gMM) { gMM = mm; gE = vec2<f32>(cos(mm * phi), sin(mm * phi)); } let e = gE;';
const H_FROM = `        let rho = 2.0 * r / n;
        let L = M.lag0.x + rho * (M.lag0.y + rho * (M.lag0.z + rho * (M.lag0.w + rho * (M.lag1.x + rho * M.lag1.y))));
        f = M.c.z * exp(-0.5 * rho) * ipow(rho, l) * L * ipow(st, am) * D;`;
const H_TO = `        if (n != gN) { gN = n; gRho = 2.0 * r / n; gEx = exp(-0.5 * gRho); }
        let rho = gRho;
        let L = M.lag0.x + rho * (M.lag0.y + rho * (M.lag0.z + rho * (M.lag0.w + rho * (M.lag1.x + rho * M.lag1.y))));
        f = M.c.z * gEx * ipow(rho, l) * L * ipow(st, am) * D;`;
const memo = (s) => must(must(must(must(s, LOOP_FROM, LOOP_TO), GEO_FROM, GEO_TO), DW_FROM, DW_TO), E_FROM, E_TO);
/* CHUNK: stage 64 records at a time through workgroup memory (every workgroup is whole at n = 64/96/128, so the barrier
   sits in uniform control flow once the bounds test moves onto the store) */
const chunk = (s) => {
  s = must(s, 'var<workgroup> wmax: atomic<u32>;', 'var<workgroup> wmax: atomic<u32>;\nvar<workgroup> wm: array<Mode, 64>;');
  s = must(s, '  if (all(gid < vec3<u32>(P.n, P.n, P.n))) {', '  let inb = all(gid < vec3<u32>(P.n, P.n, P.n));\n  {');
  s = must(s, LOOP_FROM, '    for (var cb = 0u; cb < P.count; cb += 64u) {\n    workgroupBarrier();\n    if (cb + lid < P.count) { wm[lid] = modes[cb + lid]; }\n    workgroupBarrier();\n    let cn = min(64u, P.count - cb);\n    for (var a = 0u; a < cn; a++) {');
  s = must(s, '      let M = modes[a];', '      let M = wm[a];');
  s = must(s, '      if (P.space == 5u && M.ctr.w > 0.5) { psiB += f * ce; } else { psi += f * ce; }\n    }', '      if (P.space == 5u && M.ctr.w > 0.5) { psiB += f * ce; } else { psi += f * ce; }\n    }\n    }');
  s = must(s, '    textureStore(outTex, vec3<i32>(gid), vec4<f32>(psi.x, psi.y, 0.0, 0.0));\n    dens = dot(psi, psi);', '    if (inb) { textureStore(outTex, vec3<i32>(gid), vec4<f32>(psi.x, psi.y, 0.0, 0.0));\n    dens = dot(psi, psi); }');
  return s;
};
const V = { ship: CW, early: must(CW, SHIP_SEL, EARLY) };
V.memo = memo(CW);
V.earlyMemo = memo(V.early);
V.earlyMemoExp = must(V.earlyMemo, H_FROM, H_TO);
V.chunk = chunk(CW);
V.chunkEarlyMemoExp = chunk(V.earlyMemoExp);

const msgs = {}, pipes = {};
for (const [k, code] of Object.entries(V)) {
  const mod = d.createShaderModule({ code }); const ci = await mod.getCompilationInfo();
  const errs = ci.messages.filter((m) => m.type === 'error'); if (errs.length) { msgs[k] = errs.map((m) => m.lineNum + ':' + m.message); continue; }
  pipes[k] = d.createComputePipeline({ layout: 'auto', compute: { module: mod, entryPoint: 'main' } });
}
const order = Object.keys(pipes);
const dispatchN = async (R, k, n) => {
  await d.queue.onSubmittedWorkDone(); const t0 = performance.now();
  const enc = d.createCommandEncoder(), pass = enc.beginComputePass(); pass.setPipeline(pipes[k]); pass.setBindGroup(0, R.bg[k]);
  const g = Math.ceil(R.n / 4); for (let i = 0; i < n; i++) pass.dispatchWorkgroups(g, g, g); pass.end(); d.queue.submit([enc.finish()]);
  await d.queue.onSubmittedWorkDone(); return (performance.now() - t0) / n;
};
const readTex = async (R, k) => {
  await dispatchN(R, k, 1);
  const bpr = R.n * 8, buf = d.createBuffer({ size: bpr * R.n * R.n, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
  const enc = d.createCommandEncoder(); enc.copyTextureToBuffer({ texture: R.tex }, { buffer: buf, bytesPerRow: bpr, rowsPerImage: R.n }, [R.n, R.n, R.n]); d.queue.submit([enc.finish()]);
  await buf.mapAsync(GPUMapMode.READ); const u = new Uint16Array(buf.getMappedRange().slice(0)); buf.unmap(); buf.destroy(); return u;
};
const fm = await import('/lab/field.js');
const setup = {
  h91: async () => { LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('1s'); for (let a = 0; a < 91; a++) LW.reg.set(a, 1, 0, 0); LW.reg.normalize(); LW.pause(); LW.schedule(4); await LW.settle(); },
  box: async () => { LW.loadPreset('1s'); LW.setHamiltonian('well'); LW.setGasBasis('reg'); LW.enterBox(); LW.pause(); LW.schedule(4); await LW.settle(); },
  gas: async () => { LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.enterBox(); LW.pause(); LW.schedule(4); await LW.settle(); },
};
const out = { compileErrors: msgs, variants: order, scen: {} };
for (const sc of SCEN) {
  await setup[sc]();
  const modes = LW.modesAt(LW.clock.t), pk = fm.packModes(modes), count = pk.count, recs = pk.buf.slice(0, Math.max(1, count) * 28);
  const half = LW.domain.half, space = F.space;
  out.scen[sc] = { count, half, space, res: {} };
  for (const n of RES) {
    const tex = d.createTexture({ size: [n, n, n], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC });
    const params = d.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const pa = new ArrayBuffer(32), pu = new Uint32Array(pa), pf = new Float32Array(pa); pu[0] = n; pu[1] = count; pu[2] = 0; pu[3] = space; pf[4] = half; d.queue.writeBuffer(params, 0, pa);
    const mb = d.createBuffer({ size: recs.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); d.queue.writeBuffer(mb, 0, recs);
    const stats = d.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    const radial = d.createBuffer({ size: 40 * 256 * 4, usage: GPUBufferUsage.STORAGE });
    const R = { n, tex, bg: {} };
    for (const [k, p] of Object.entries(pipes)) R.bg[k] = d.createBindGroup({ layout: p.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: params } }, { binding: 1, resource: { buffer: mb } }, { binding: 2, resource: tex.createView({ dimension: '3d' }) }, { binding: 3, resource: { buffer: stats } }, { binding: 4, resource: { buffer: radial } }] });
    const NN = {}, T = {};
    for (const k of order) { let n0 = 4; for (;;) { const T0 = (await dispatchN(R, k, n0)) * n0; if (T0 >= 2500 || n0 >= 40000) break; n0 = T0 < 400 ? n0 * 4 : Math.ceil(n0 * 3000 / T0); } NN[k] = n0; T[k] = []; }
    for (let rd = 0; rd < ROUNDS; rd++) for (const k of order) T[k].push(+(await dispatchN(R, k, NN[k])).toFixed(3));
    const base = await readTex(R, 'ship'), cmp = {};
    for (const k of order) { const u = await readTex(R, k); let diff = 0; for (let v = 0; v < u.length; v++) if (u[v] !== base[v]) diff++; cmp[k] = { min: Math.min(...T[k]), rounds: T[k], n: NN[k], tickErrMs: +(100 / NN[k]).toFixed(3), differFromShip: diff }; }
    out.scen[sc].res[n] = cmp;
    tex.destroy(); params.destroy(); mb.destroy(); stats.destroy(); radial.destroy();
  }
}
LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('1s+2pz'); LW.pause();
return out;
