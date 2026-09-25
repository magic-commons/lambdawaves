/* probes/K/k1-variants.js — lane K builder probe body (run with probes/A/run.mjs): which of K1's memos are bit-identical
 * on EVERY space, not only hydrogen/box/gas.  The shipped (base 91c90bc) COMPUTE_WGSL is read from probes/K/field-base.js;
 * each variant is one memo applied alone to it.  Texels compared u16-for-u16 against the base kernel on the app's device,
 * with the app's own records (packModes of LW.modesAt), space, half and radial table.
 * PRE may set globalThis.__K_STATES, __K_RES, __K_VARIANTS (a map name → function(base, cur) → code) */
const LW = __LW, F = LW.field, d = F.device;
const grabW = (src, name) => { const i = src.indexOf('const ' + name + ' = /* wgsl */`'); const a = src.indexOf('`', i) + 1, b = src.indexOf('`;', a); return src.slice(a, b); };
const BASE = grabW(await (await fetch('/research/optimization-2026-09-24/probes/K/field-base.js', { cache: 'no-store' })).text(), 'COMPUTE_WGSL');
const CUR = grabW(await (await fetch('/lab/field.js', { cache: 'no-store' })).text(), 'COMPUTE_WGSL');
const must = (s, from, to) => { if (s.indexOf(from) < 0) throw new Error('patch anchor missing: ' + from.slice(0, 70)); return s.replace(from, to); };
const SHIP_SEL = 'f = select(0.0, M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw, r < aa);';
const EARLY = 'if (r < aa) { f = M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw; }';
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
const V = globalThis.__K_VARIANTS ? globalThis.__K_VARIANTS({ BASE, CUR, must, SHIP_SEL, EARLY, GEO_FROM, GEO_TO, LOOP_FROM, LOOP_TO, DW_FROM, DW_TO, E_FROM, E_TO }) : {
  ship: BASE,
  early: must(BASE, SHIP_SEL, EARLY),
  geo: must(must(BASE, LOOP_FROM, LOOP_TO), GEO_FROM, GEO_TO),
  dw: must(must(BASE, LOOP_FROM, LOOP_TO), DW_FROM, DW_TO),
  e: must(must(BASE, LOOP_FROM, LOOP_TO), E_FROM, E_TO),
  cur: CUR,
};
const pipes = {}, msgs = {};
for (const [k, code] of Object.entries(V)) {
  const mod = d.createShaderModule({ code }); const ci = await mod.getCompilationInfo();
  const errs = ci.messages.filter((m) => m.type === 'error'); if (errs.length) { msgs[k] = errs.map((m) => m.lineNum + ':' + m.message); continue; }
  pipes[k] = d.createComputePipeline({ layout: 'auto', compute: { module: mod, entryPoint: 'main' } });
}
let radialArr = new Float32Array(40 * 256);
const origSRT = F.setRadialTable; F.setRadialTable = function (arr) { radialArr = new Float32Array(arr); return origSRT.call(this, arr); };
const settle = async (n = 2) => { for (let i = 0; i < n; i++) await LW.settle(); };
async function base() {
  try { if (LW.chem.state && LW.chem.state().on) LW.chem.setOn(false); } catch (_) {}
  for (const c of [LW.helium, LW.h2, LW.molecule]) if (c && c.on) c.setOn(false);
  if (LW.sturmian.on) LW.sturmian.set(false);
  if (LW.space !== 'x') LW.setSpace('x');
  LW.setGasBasis('reg');
  if (LW.hamiltonian !== 'hydrogen') LW.setHamiltonian('hydrogen');
  LW.pause(); LW.clock.scrub(0); LW.loadPreset('1s+2pz'); LW.pause(); LW.clock.scrub(0); await settle(2);
}
const freeze = async (t) => { LW.pause(); LW.clock.scrub(t); LW.schedule(4); await settle(2); };
const STATES = {
  '1s+2pz': async () => { await freeze(3.7); },
  rydberg: async () => { LW.loadPreset('rydberg'); LW.pause(); LW.clock.scrub(0); await freeze(3.7); },
  h91: async () => { LW.loadPreset('1s'); LW.pause(); LW.clock.scrub(0); for (let a = 0; a < 91; a++) LW.reg.set(a, 1, 0, 0); LW.reg.normalize(); await freeze(3.7); },
  box: async () => { LW.loadPreset('1s'); LW.setHamiltonian('well'); LW.setGasBasis('reg'); LW.pause(); LW.clock.scrub(0); LW.enterBox(); await freeze(2.0); },
  gas: async () => { LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.pause(); LW.clock.scrub(0); LW.enterBox(); await freeze(2.0); },
  helium: async () => { LW.helium.load({ on: true, x1: [0.3, 0.4, 0.5] }); await freeze(3.7); },
  h2: async () => { LW.h2.load({ on: true, R: 1.4, which: 'singlet' }); await freeze(3.7); },
  momentum: async () => { LW.setSpace('p'); await freeze(3.7); },
  oscillator: async () => { LW.setHamiltonian('qho'); LW.loadPreset('1s+2pz'); LW.pause(); LW.clock.scrub(0); await freeze(1.3); },
  quarkonium: async () => { LW.setHamiltonian('cornell'); LW.loadPreset('1s+2pz'); LW.pause(); LW.clock.scrub(0); await freeze(3.7); },
  sturmian: async () => { LW.sturmian.set(true); LW.sturmian.setLambda(1.4); await freeze(3.7); },
  h2plus: async () => { LW.molecule.load({ on: true, R: 2.0, kind: 'sigma_g' }); await freeze(3.7); },
};
const SL = globalThis.__K_STATES || Object.keys(STATES), RES = globalThis.__K_RES || [96];
const fm = await import('/lab/field.js');
const out = { compileErrors: msgs, variants: Object.keys(pipes), states: {} };
for (const sn of SL) {
  await base(); await STATES[sn]();
  const modes = LW.modesAt(LW.clock.t); if (!modes) { out.states[sn] = 'no modes'; continue; }
  const pk = fm.packModes(modes), count = pk.count, recs = pk.buf.slice(0, Math.max(1, count) * 28);
  const half = LW.domain.half, space = F.space;
  const row = { count, space, half, res: {} };
  for (const n of RES) {
    const tex = d.createTexture({ size: [n, n, n], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC });
    const params = d.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const pa = new ArrayBuffer(32), pu = new Uint32Array(pa), pf = new Float32Array(pa); pu[0] = n; pu[1] = count; pu[2] = 0; pu[3] = space; pf[4] = half; d.queue.writeBuffer(params, 0, pa);
    const mb = d.createBuffer({ size: recs.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); d.queue.writeBuffer(mb, 0, recs);
    const stats = d.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    const radial = d.createBuffer({ size: 40 * 256 * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); d.queue.writeBuffer(radial, 0, radialArr);
    const read = async (k) => {
      const bg = d.createBindGroup({ layout: pipes[k].getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: params } }, { binding: 1, resource: { buffer: mb } }, { binding: 2, resource: tex.createView({ dimension: '3d' }) }, { binding: 3, resource: { buffer: stats } }, { binding: 4, resource: { buffer: radial } }] });
      const enc = d.createCommandEncoder(), pass = enc.beginComputePass(); pass.setPipeline(pipes[k]); pass.setBindGroup(0, bg);
      const g = Math.ceil(n / 4); pass.dispatchWorkgroups(g, g, g); pass.end();
      const bpr = n * 8, buf = d.createBuffer({ size: bpr * n * n, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
      enc.copyTextureToBuffer({ texture: tex }, { buffer: buf, bytesPerRow: bpr, rowsPerImage: n }, [n, n, n]); d.queue.submit([enc.finish()]);
      await buf.mapAsync(GPUMapMode.READ); const u = new Uint16Array(buf.getMappedRange().slice(0)); buf.unmap(); buf.destroy(); return u;
    };
    const ref = await read('ship'), cmp = {};
    for (const k of Object.keys(pipes)) { if (k === 'ship') continue; const u = await read(k); let diff = 0; for (let v = 0; v < u.length; v++) if (u[v] !== ref[v]) diff++; cmp[k] = diff; }
    if (globalThis.__K_TIME) {                                  // n dispatches / one pass / one wait, n grown until a batch is >= 2.5 s; interleaved rounds, min
      const bgs = {}; for (const k of Object.keys(pipes)) bgs[k] = d.createBindGroup({ layout: pipes[k].getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: params } }, { binding: 1, resource: { buffer: mb } }, { binding: 2, resource: tex.createView({ dimension: '3d' }) }, { binding: 3, resource: { buffer: stats } }, { binding: 4, resource: { buffer: radial } }] });
      const run = async (k, m) => { await d.queue.onSubmittedWorkDone(); const t0 = performance.now(); const enc = d.createCommandEncoder(), pass = enc.beginComputePass(); pass.setPipeline(pipes[k]); pass.setBindGroup(0, bgs[k]); const g = Math.ceil(n / 4); for (let i = 0; i < m; i++) pass.dispatchWorkgroups(g, g, g); pass.end(); d.queue.submit([enc.finish()]); await d.queue.onSubmittedWorkDone(); return (performance.now() - t0) / m; };
      const NN = {}, T = {}, target = globalThis.__K_TIME;
      for (const k of Object.keys(pipes)) { let m = 4; for (;;) { const T0 = (await run(k, m)) * m; if (T0 >= target || m >= 40000) break; m = T0 < target / 6 ? m * 4 : Math.ceil(m * target * 1.2 / T0); } NN[k] = m; T[k] = []; }
      for (let rd = 0; rd < (globalThis.__K_ROUNDS || 3); rd++) for (const k of Object.keys(pipes)) T[k].push(+(await run(k, NN[k])).toFixed(3));
      cmp.ms = {}; for (const k of Object.keys(pipes)) cmp.ms[k] = { min: Math.min(...T[k]), rounds: T[k], n: NN[k] };
    }
    row.res[n] = cmp;
    tex.destroy(); params.destroy(); mb.destroy(); stats.destroy(); radial.destroy();
  }
  out.states[sn] = row;
}
F.setRadialTable = origSRT;
await base();
return out;
