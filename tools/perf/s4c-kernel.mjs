/* tools/perf/s4c-kernel.mjs — 0.4.0 S4c THE ENGINE UPGRADES: the molecular kernel's checks and numbers, read from the SHIPPED
 * pipelines through the booted lab (__LW.field) — no copied WGSL.
 *   python3 tools/gate/server.py "$PWD" 8759 &
 *   LW_PORT=8759 GD_PORT=5227 node tools/perf/s4c-kernel.mjs [firefox] [chromium] [--only tiers,records,fallback,c60,timing]
 * (1) TIERS     the workgroup memory asked (limitsRequested) and granted, each tier's lanes, no shader message of type error.
 * (2) RECORDS   tests/fixtures/record-tryptophan.json (87 AO) and record-C20H20.json (120 AO), written by
 *               `node tools/orbital-library.mjs --fixture <id>`: the density through the cap-128 χ tile and the HOMO through the
 *               orbital-only kernel, read back at 96³ and compared at 256 sampled voxels with the GENERATOR'S OWN f64 — the
 *               record's D and C on lab/molecular-field.js's evaluator.  The bar is the rgba16float figure (MEASURE.md §3).
 * (3) FALLBACK  a second field whose device is refused the 32 KiB (requestDevice wrapped to drop the one limit, so the cap-128
 *               tier is built with 32 lanes): the same density, texel for texel (fieldDigest's hash).
 * (4) C₆₀       the library record's HOMO set and LUMO set (lab/library.json row C60) through the orbital-only kernel, against
 *               PySCF's own orbital at the same voxel centres (research/release-0.4.0/measure/c60-voxels-pyscf.json, written
 *               by `~/bin/scipython -I tools/perf/c60-voxels.py`) — skipped until both exist.
 * (5) VALENCE   MOLECULES' switch on DENSITY, through the app: lysine and benzene, the texel against the f64 √ρ of
 *               D − 2 Σ_core C_c C_cᵀ (lab/names.js coreCount), and max ρ with the core and without it.
 * (6) TIMING    the shipped kernels at 96³, n dispatches in one pass and one wait, n grown until a batch lasts 2.5 s (Firefox's
 *               ~100 ms completion tick, MEASURE.md §3), 5 batches: the density at 87 / 120 AO (cap-128 tile), the orbital at
 *               87 / 120 / 300 AO (ORB_WGSL) — and ORB_WGSL at 300 AO PLAIN (every shell's cut at +∞) beside SCREENED, on the
 *               field's own device with the module the field compiled from (field.js exports ORB_WGSL and packMolecule).
 * Writes research/release-0.4.0/measure/s4c-kernel.json (per browser; an --only run replaces only its own sections). */
import { launch, sleep } from './cdp.mjs';
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = process.env.LW_PORT || '8759';
const ORIGIN = `https://127.0.0.1:${PORT}`;
const OUT = 'research/release-0.4.0/measure/s4c-kernel.json';
const PW = path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const CHROME_ARGS = ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=Vulkan', '--use-angle=vulkan', '--enable-webgpu-developer-features'];
const argv = process.argv.slice(2), oi = argv.indexOf('--only');
const ONLY = oi >= 0 ? argv[oi + 1].split(',') : ['tiers', 'records', 'fallback', 'c60', 'valence', 'timing'];
const BROWSERS = argv.filter((a, i) => !a.startsWith('--') && (oi < 0 || i !== oi + 1));

const PAGE = (only) => `
const ONLY = ${JSON.stringify(only)}, f = __LW.field;
if (!f || !f.ok) return { skip: (f && f.error) || 'no WebGPU' };
try { __LW.pause(); } catch (_) {}
try { if (__LW.chem.state().on) __LW.chem.setOn(false); } catch (_) {}
const [{ basisFrom }, { fieldShells, evaluator }, { decodeRecord }, FM] = await Promise.all([import('./md.js'), import('./molecular-field.js'), import('./library.js'), import('./field.js')]);
const sto = await (await fetch('./vendor/bse/sto-3g-v1.json')).json();
const json = async (u) => { const r = await fetch(u); return r.ok ? r.json() : null; };
const f16 = (h) => { const s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 31, m = h & 1023; return e === 0 ? s * m * 2 ** -24 : e === 31 ? (m ? NaN : s * Infinity) : s * (1 + m / 1024) * 2 ** (e - 15); };
const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const med = (a) => { const s = [...a].sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const RES = 96;
/* n is GROWN until one batch itself lasts 2.5 s: an estimate from a short batch inherits Firefox's ~100 ms completion tick
   (a 20-dispatch batch of 1.2 ms reads as 5 ms) and the batches it sizes come out a whole number of ticks */
const grow = async (run) => { let n = 20; for (;;) { const ms = await run(n); if (ms * n >= 2500 || n >= 20000) return n; n = Math.min(20000, Math.max(2 * n, Math.ceil(2700 / ms))); } };
/** the worker's own road from atoms (bohr) to the field's spec: basisFrom → fieldShells, half = extent + 6 (mathworker ensureSolve) */
function specOf(atoms) {
  const basis = basisFrom(atoms, sto, { cart: true });
  const shells = fieldShells(basis).map((s) => ({ center: s.center, l: s.l, ao: s.ao, prims: s.prims.map((p) => ({ alpha: p.alpha, w: Array.from(p.w) })) }));
  const half = atoms.reduce((m, a) => Math.max(m, Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)), 0) + 6;
  return { basis, spec: { nAO: basis.n, half, shells }, ev: evaluator(basis.shells) };
}
/** 256 voxels: half within ±2 voxels of a random nucleus (where the field is large), half anywhere — deterministic */
function voxels(atoms, half, seed, count = 256) {
  const pick = rng(seed), out = [], at = (q) => Math.max(0, Math.min(RES - 1, Math.round((q + half) / (2 * half) * RES - 0.5 + (pick() * 4 - 2))));
  for (let k = 0; k < count; k++) {
    if (k % 2 === 0) { const a = atoms[Math.floor(pick() * atoms.length)]; out.push([at(a.x), at(a.y), at(a.z)]); }
    else out.push([0, 0, 0].map(() => Math.floor(pick() * RES)));
  }
  return out;
}
const posOf = (v, half) => v.map((i) => (i + 0.5) / RES * 2 * half - half);
/** draw one matrix, read the grid back, and compare the texels at the voxels with \`cpu(p)\` (the texel's own quantity) */
async function compare(M, kind, vox, half, cpu) {
  f.setMoleculeMatrix(M, { kind }); f.reconstructMolecule();
  const G = await f.readGrid(), info = f.moleculeInfo;
  let worst = 0, big = 0, worstRel = 0; const probes = [];
  const vals = vox.map((v) => { const p = posOf(v, half), c = cpu(p), g = f16(G.texels[((v[2] * RES + v[1]) * RES + v[0]) * 4]); big = Math.max(big, Math.abs(c)); return { v, c, g }; });
  for (const { v, c, g } of vals) {
    worst = Math.max(worst, Math.abs(c - g));
    if (Math.abs(c) >= 0.01 * big) worstRel = Math.max(worstRel, Math.abs(c - g) / Math.abs(c));
    if (probes.length < 8) probes.push([...v, +c.toExponential(5), +g.toExponential(5)]);
  }
  const gridMax = Math.sqrt(G.rhoMax);
  return { kind, path: info.path, cap: info.cap, wg: info.wg, nAO: info.nAO, voxels: vox.length, maxAbsErr: +worst.toExponential(3), maxSampled: +big.toExponential(4), gridMax: +gridMax.toExponential(4),
    relToMax: +(worst / gridMax).toExponential(3), maxRelAbove1pc: +worstRel.toExponential(3), pass: worst / gridMax <= 1e-3 && worstRel <= 2 ** -10, probes };
}
const out = { ua: navigator.userAgent, adapter: f.adapterInfo, res: RES };
f.setResolution(RES);
if (ONLY.includes('tiers')) out.tiers = { requested: f.limitsRequested, ...f.moleculeTiers, shaderErrors: (f.shaderMessages || []).filter((m) => m.type === 'error') };

const recs = {};
for (const id of ['tryptophan', 'C20H20']) { const r = await json('../tests/fixtures/record-' + id + '.json'); if (r) recs[id] = decodeRecord(r); }
if (ONLY.includes('records')) {
  out.records = {};
  for (const [id, R] of Object.entries(recs)) {
    const atoms = R.atoms, n = R.ground.nAO, nocc = R.ground.nocc, { spec, ev } = specOf(atoms);
    if (spec.nAO !== n) { out.records[id] = { error: 'basis ' + spec.nAO + ' ≠ record ' + n }; continue; }
    f.setMolecule(spec);
    const vox = voxels(atoms, spec.half, 11 + n), D = R.D, C = R.C;
    const rho = (p) => { const a = ev.ao(p); let s = 0; for (let i = 0; i < n; i++) { let t = 0; for (let j = 0; j < n; j++) t += D[i * n + j] * a[j]; s += a[i] * t; } return Math.sqrt(Math.max(s, 0)); };
    const homo = Float64Array.from({ length: n }, (_, i) => C[i * n + nocc - 1]);
    const psi = (p) => { const a = ev.ao(p); let s = 0; for (let i = 0; i < n; i++) s += homo[i] * a[i]; return s; };
    out.records[id] = { nAO: n, nocc, half: spec.half, energy: R.ground.energy,
      density: await compare(Float32Array.from(D), 'density', vox, spec.half, rho),
      homo: await compare(Float32Array.from(homo), 'orbital', vox, spec.half, psi) };
  }
}
if (ONLY.includes('fallback') && recs.tryptophan) {
  const R = recs.tryptophan, { spec } = specOf(R.atoms), D = Float32Array.from(R.D);
  /* the wrap is installed by a <script> in the PAGE's realm: Firefox runs WebDriver scripts in a sandbox whose view of a DOM
     prototype is an Xray, so an assignment made here would never reach the page's requestGpu() */
  const s = document.createElement('script');
  s.textContent = 'window.__s4cCalls = 0; window.__s4cRefuse = (() => { const p = GPUAdapter.prototype, o = p.requestDevice; return (on) => { p.requestDevice = on ? function (d = {}) { window.__s4cCalls++; const L = Object.assign({}, d.requiredLimits || {}); delete L.maxComputeWorkgroupStorageSize; return o.call(this, Object.assign({}, d, { requiredLimits: L })); } : o; }; })();';
  document.head.appendChild(s);
  /* …and Firefox's sandbox imports its OWN instance of the module graph, whose gpu-boot.js made its early request at import,
     before the wrap: that one is taken and destroyed first, so createField below asks requestGpu() through the wrap */
  const early = (await import('./gpu-boot.js')).gpuBoot(); if (early) { const e = await early; try { e.device.destroy(); } catch (_) {} }
  let f2 = null;
  try { window.__s4cRefuse(true); const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; f2 = await FM.createField(cv, { resolution: RES }); }
  finally { window.__s4cRefuse(false); }
  if (!f2 || !f2.ok) out.fallback = { error: f2 && f2.error };
  else {
    const one = async (F) => { F.setResolution(RES); F.setMolecule(spec); F.setMoleculeMatrix(D, { kind: 'density' }); F.reconstructMolecule(); return { digest: (await F.fieldDigest()).hash, info: F.moleculeInfo, tiers: F.moleculeTiers }; };
    const a = await one(f), b = await one(f2);
    out.fallback = { full: { digest: a.digest, wg: a.info.wg, granted: a.tiers.granted }, refused: { digest: b.digest, wg: b.info.wg, granted: b.tiers.granted, requested: f2.limitsRequested, wrapCalls: window.__s4cCalls }, identical: a.digest === b.digest };
    /* what the 32 KiB buys: the same 87-AO density on 64 lanes (32 KiB tile) and on 32 lanes (16 KiB), each n grown to 2.5 s */
    const tm = async (F) => { await F.moleculeThroughput({ n: 10 }); const n = await grow(async (m) => (await F.moleculeThroughput({ n: m })).msPerDispatch); const r = []; for (let k = 0; k < 3; k++) r.push((await F.moleculeThroughput({ n })).msPerDispatch); return +med(r).toFixed(3); };
    out.fallback.densityMs = { lanes64: await tm(f), lanes32: await tm(f2) };
    try { f2.dispose(); } catch (_) {}
  }
}
/* C₆₀: the library record when lab/library.json carries it, else Sol's dump itself (research/…/c60-frontier.json) — same numbers */
const lib = await json('./library.json'), c60row = lib && lib.rows.find((r) => r.id === 'C60');
let c60 = c60row ? decodeRecord(await json('./library/' + c60row.hash + '.json')) : null, c60from = c60 ? 'lab/library/' + c60row.hash + '.json' : null;
if (!c60) {
  const F = await json('../research/release-0.4.0/library-census/c60-frontier.json'), A = 1 / 0.52917721092;
  if (F) { const cols = [...F.frontier.HOMO.indices, ...F.frontier.LUMO.indices], all = [...F.frontier.HOMO.coefficientColumns, ...F.frontier.LUMO.coefficientColumns], n = all[0].length, C = new Float64Array(n * n);
    cols.forEach((k, j) => { for (let i = 0; i < n; i++) C[i * n + k] = all[j][i]; });
    c60 = { atoms: F.geometry.atomsAngstrom.map(([Z, x, y, z]) => ({ Z, x: x * A, y: y * A, z: z * A })), cols, C, ground: { nocc: 180, nAO: n } }; c60from = 'research/release-0.4.0/library-census/c60-frontier.json'; }
}
if (ONLY.includes('c60') && c60) {
  const ref = await json('../research/release-0.4.0/measure/c60-voxels-pyscf.json');
  const { spec, ev } = specOf(c60.atoms), n = spec.nAO, cols = c60.cols, vox = ref ? ref.voxels : voxels(c60.atoms, spec.half, 60);
  f.setMolecule(spec);
  out.c60 = { from: c60from, nAO: n, half: spec.half, refHalf: ref ? ref.half : null, against: ref ? 'PySCF GTOval_cart at the voxel centres' : 'the app f64 evaluator (no PySCF file yet)', cols, orbitals: [] };
  for (const [j, k] of cols.entries()) {
    const c = Float32Array.from({ length: n }, (_, i) => c60.C[i * n + k]);
    f.setMoleculeMatrix(c, { kind: 'orbital' }); f.reconstructMolecule();
    const G = await f.readGrid(), gridMax = Math.sqrt(G.rhoMax);
    let worst = 0, worstApp = 0, big = 0;
    vox.forEach((v, q) => {
      const g = f16(G.texels[((v[2] * RES + v[1]) * RES + v[0]) * 4]);
      const a = ev.ao(posOf(v, spec.half)); let app = 0; for (let i = 0; i < n; i++) app += c60.C[i * n + k] * a[i];
      const want = ref ? ref.values[q][j] : app;
      worst = Math.max(worst, Math.abs(g - want)); worstApp = Math.max(worstApp, Math.abs(app - want)); big = Math.max(big, Math.abs(want));
    });
    out.c60.orbitals.push({ k, set: k < c60.ground.nocc ? 'HOMO' : 'LUMO', path: f.moleculeInfo.path, voxels: vox.length, maxAbsErr: +worst.toExponential(3),
      relToMax: +(worst / gridMax).toExponential(3), appF64VsRef: +worstApp.toExponential(3), maxPsi: +big.toExponential(4), gridMax: +gridMax.toExponential(4), pass: worst / gridMax <= 1e-3 });
  }
}
/* VALENCE through the APP (MOLECULES' switch on DENSITY): lysine from its record, the field read back, and the texel compared with
   the f64 √ρ of D − 2 Σ_core C_c C_cᵀ (lab/names.js coreCount) on the CPU; and how far the core had drowned it (max ρ, both) */
if (ONLY.includes('valence')) {
  const { coreCount } = await import('./names.js'), { moleculeAtoms } = await import('./molecules.js'), c = __LW.chem, settle = async () => { for (let i = 0; i < 4; i++) await __LW.settle(); };
  out.valence = {};
  for (const id of ['lysine', 'C6H6']) {
    await c.solve(id); c.setOn(true); c.setView('density'); c.setValence(false); await settle();
    const total = await f.readStats(); c.setValence(true); await settle();
    const G = await f.readGrid(), N = G.N, s = c.solution(), n = s.nAO, atoms = moleculeAtoms(id), nc = Math.min(coreCount(atoms), s.nocc), { ev } = specOf(atoms);
    const Dv = Float64Array.from(s.D); for (let k = 0; k < nc; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Dv[i * n + j] -= 2 * s.C[i * n + k] * s.C[j * n + k];
    let worst = 0, big = 0; const vox = voxels(atoms, G.half, 7 + n).map((v) => v.map((q) => Math.min(N - 1, Math.round(q * N / RES))));
    for (const v of vox) { const p = v.map((i) => (i + 0.5) / N * 2 * G.half - G.half), a = ev.ao(p); let r = 0; for (let i = 0; i < n; i++) { let t = 0; for (let j = 0; j < n; j++) t += Dv[i * n + j] * a[j]; r += a[i] * t; }
      const cpu = Math.sqrt(Math.max(r, 0)), g = f16(G.texels[((v[2] * N + v[1]) * N + v[0]) * 4]); worst = Math.max(worst, Math.abs(cpu - g)); big = Math.max(big, cpu); }
    out.valence[id] = { nAO: n, core: nc, res: N, rhoMaxTotal: +total.rhoMax.toExponential(4), rhoMaxValence: +G.rhoMax.toExponential(4), drownedBy: +(total.rhoMax / G.rhoMax).toFixed(1),
      voxels: vox.length, maxAbsErr: +worst.toExponential(3), relToMax: +(worst / Math.sqrt(G.rhoMax)).toExponential(3), pass: worst / Math.sqrt(G.rhoMax) <= 1e-3, state: c.state().valence };
    c.setValence(false);
  }
  c.setOn(false);
}
if (ONLY.includes('timing')) {
  try { __LW.quality.res = RES; } catch (_) {} f.setResolution(RES);          // the VALENCE section ran the app, whose loop sets its own grid (64³ here)
  out.timing = [];
  const time = async (label) => {
    await f.moleculeThroughput({ n: 10 });
    const n = await grow(async (m) => (await f.moleculeThroughput({ n: m })).msPerDispatch);
    const runs = []; let r; for (let b = 0; b < 5; b++) { r = await f.moleculeThroughput({ n }); runs.push(r.msPerDispatch); }
    out.timing.push({ label, res: r.res, nAO: r.nAO, kind: r.kind, path: r.path, cap: r.cap, wg: r.wg, n, median: +med(runs).toFixed(3), min: Math.min(...runs), max: Math.max(...runs) });
  };
  for (const [id, R] of Object.entries(recs)) {
    const { spec } = specOf(R.atoms), n = R.ground.nAO; f.setMolecule(spec);
    f.setMoleculeMatrix(Float32Array.from(R.D), { kind: 'density' }); await time(id + ' density');
    f.setMoleculeMatrix(Float32Array.from({ length: n }, (_, i) => R.C[i * n + R.ground.nocc - 1]), { kind: 'orbital' }); await time(id + ' HOMO');
  }
  if (c60) {
    const { spec } = specOf(c60.atoms), n = spec.nAO, k = c60.ground.nocc - 1, c = Float32Array.from({ length: n }, (_, i) => c60.C[i * n + k]);
    f.setMolecule(spec); f.setMoleculeMatrix(c, { kind: 'orbital' }); await time('C60 HOMO (field, screened)');
    /* PLAIN vs SCREENED on the field's device with the shipped module: the same inputs, the cut table at +∞ or as packed */
    const d = f.device, pk = FM.packMolecule(spec), mod = d.createShaderModule({ code: FM.ORB_WGSL }), pipe = d.createComputePipeline({ layout: 'auto', compute: { module: mod, entryPoint: 'main' } });
    const buf = (data, usage = GPUBufferUsage.STORAGE) => { const b = d.createBuffer({ size: Math.max(16, Math.ceil(data.byteLength / 16) * 16), usage: usage | GPUBufferUsage.COPY_DST }); d.queue.writeBuffer(b, 0, data); return b; };
    const P = new ArrayBuffer(32), Pu = new Uint32Array(P), Pf = new Float32Array(P); Pu[0] = RES; Pu[1] = n; Pu[2] = pk.nShell; Pu[3] = 1; Pf[4] = spec.half; Pu[5] = 0;
    const tex = d.createTexture({ size: [RES, RES, RES], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING });
    const bufs = [buf(new Uint8Array(P), GPUBufferUsage.UNIFORM), buf(pk.shell.slice(0, pk.nShell * 8)), buf(pk.alpha.slice(0, pk.nPrim)), buf(pk.weight.slice(0, pk.nWeight)), buf(c), buf(new Uint32Array(4))];
    const cuts = { plain: new Float32Array(pk.nShell).fill(3.4e38), screened: pk.cut.slice(0, pk.nShell) };
    for (const [label, cut] of Object.entries(cuts)) {
      const cb = buf(cut), bind = d.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: [0, 1, 2, 3, 4].map((b) => ({ binding: b, resource: { buffer: bufs[b] } }))
        .concat([{ binding: 5, resource: tex.createView() }, { binding: 6, resource: { buffer: bufs[5] } }, { binding: 7, resource: { buffer: cb } }]) });
      const g = Math.ceil(RES / 4), batch = async (m) => { await d.queue.onSubmittedWorkDone(); const t0 = performance.now(); const e = d.createCommandEncoder(), p = e.beginComputePass();
        p.setPipeline(pipe); p.setBindGroup(0, bind); for (let i = 0; i < m; i++) p.dispatchWorkgroups(g, g, g); p.end(); d.queue.submit([e.finish()]); await d.queue.onSubmittedWorkDone(); return (performance.now() - t0) / m; };
      await batch(4); const m = await grow(batch);
      const runs = []; for (let b = 0; b < 5; b++) runs.push(await batch(m));
      out.timing.push({ label: 'C60 HOMO ORB_WGSL ' + label + ' (own pass, the shipped module)', nAO: n, path: 'orbital', n: m, median: +med(runs).toFixed(3), min: +Math.min(...runs).toFixed(3), max: +Math.max(...runs).toFixed(3) });
      cb.destroy();
    }
    bufs.forEach((b) => b.destroy()); tex.destroy();
  }
}
f.setMolecule(null);
return out;`;

async function firefox() {
  const g = await open(`${ORIGIN}/lab/?sw=0`, { width: 1200, height: 900, script: 1800000, prefs: { 'privacy.reduceTimerPrecision': false } });
  try { await g.waitFor('window.__LW && __LW.ready', 900, 100); return await g.ev(PAGE(ONLY)); } finally { await g.close(); }
}
async function chromium() {
  process.env.CHROMIUM = PW; process.env.LW_CDP_TIMEOUT = '1800000';
  const b = await launch({ width: 1200, height: 900, gpu: true, args: CHROME_ARGS });
  try {
    /* a fresh headless Chromium on Vulkan can answer the lab's very first requestAdapter (top of <head>) with null; one adapter
       asked for on another page first brings the GPU process up (the S0 orbital-dispatch run went there first, too) */
    await b.goto(`${ORIGIN}/tools/perf/limits.html`, 1500);
    await b.goto(`${ORIGIN}/lab/?sw=0`, 1000);
    for (let i = 0; i < 600; i++) { try { if (await b.eval('!!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
    return await b.eval(`(async()=>{ ${PAGE(ONLY)} })()`);
  } finally { await b.close(); }
}

let prev = {}; try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
const res = prev.browsers || {};
for (const k of BROWSERS.length ? BROWSERS : ['firefox']) {
  const t0 = Date.now();
  try { res[k] = { ...(res[k] || {}), ...await (k === 'chromium' ? chromium() : firefox()) }; } catch (e) { res[k] = { error: String(e && e.stack || e) }; }   // an --only run replaces its own sections, keeps the rest
  res[k].wallSec = +((Date.now() - t0) / 1000).toFixed(1); res[k].at = new Date().toISOString();
  console.log(`\n── ${k} (${res[k].wallSec} s)`);
  console.log(JSON.stringify(res[k], (key, v) => (key === 'probes' ? undefined : v), 1));
}
fs.writeFileSync(OUT, JSON.stringify({ host: os.hostname(), browsers: res }, null, 1) + '\n');
console.log('wrote', OUT);
