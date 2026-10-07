/* benzene-retime.mjs — 0.4.0 S0 MEASURE §2 (node half): the worker path, ground AND spectrum, against the cost model.
 *   node tools/perf/benzene-retime.mjs [runs=5] [out.json]
 *
 * TWO PASSES PER MOLECULE, both through lab code only (read, never edited):
 *   A · THE WORKER'S OWN FUNCTIONS.  lab/mathworker.js is importable in node (its onmessage is installed only inside a
 *       real worker), so chemRegister → chemGround → chemSpectrum is the exact code the `chem` worker runs for
 *       `chem.ground` then `chem.spectrum`; their walls are timed here and their own `timings` ({ integrals, scf, rpa })
 *       are read back.  The worker caches one solve on (atoms, basis, charge): the molecules are cycled, so every call
 *       is a fresh solve, never a cache hit.
 *   B · THE SPECTRUM, DECOMPOSED.  `rpa()` is the RPA roots; its TDA ladder is a LAZY getter that mathworker's
 *       canonicalStates reads, so the worker's `rpa` timing excludes it.  Pass B repeats the stage two road with each
 *       piece timed on its own: moleculeRHF (the ensureSolve call) · rpa() · R.tda · canonicalStates (copied verbatim
 *       below from mathworker.js — it is not exported) — so TDA and the canonical gauge are measured, not subtracted.
 * The model: lab/molecules.js predictMs(eriWork, rpaWork) — fitted 2026-09-12 to the WHOLE worker path (integrals +
 * moleculeRHF at defaults + RPA), so it is compared with ground + spectrum.  Run 0 is the cold (JIT) pass and is kept
 * apart; the table is the median of `runs` warm passes with min–max. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import { chemRegister, chemGround, chemSpectrum } from '../../lab/mathworker.js';
import { moleculeRHF } from '../../lab/rhf-molecule.js';
import { rpa } from '../../lab/rpa-inspector.js';
import { canonicaliseSpectrum, dipoleFamily, coordinateFamily } from '../../lab/canon-gauge.js';
import { MOLECULE_BY_ID, moleculeAtoms, moleculeCharge, counts, eriWork, rpaWork, predictMs, COST, CAP_MS } from '../../lab/molecules.js';
import { ANGSTROM } from '../../lab/md.js';

const RUNS = +(process.argv[2] || 5);
const OUT = process.argv[3] || 'research/release-0.4.0/measure/benzene-node.json';
const rec = (f) => JSON.parse(readFileSync(new URL('../../lab/vendor/bse/' + f, import.meta.url), 'utf8'));
const RECS = { 'sto-3g': rec('sto-3g-v1.json'), '6-31+g-star': rec('6-31+g-star-v1.json') };   // parsed once, outside every timed region
chemRegister('sto-3g', RECS['sto-3g']);
chemRegister('6-31+g-star', RECS['6-31+g-star']);

/* NAPHTHALENE, beyond the library (58 AO, the "≤ 64 AO" question S4 asks): two ideal hexagons, C–C 1.40 Å,
   C–H 1.09 Å along the outward bisector.  An idealised geometry, labelled as one; it is a timing point, not a record. */
function naphthalene() {
  const a = 1.40, h = 1.09, s3 = Math.sqrt(3) / 2, C = [];
  for (const cx of [-a * s3, a * s3]) for (let k = 0; k < 6; k++) { const t = Math.PI / 6 + k * Math.PI / 3; C.push([cx + a * Math.cos(t), a * Math.sin(t)]); }
  const uniq = []; for (const p of C) if (!uniq.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6)) uniq.push(p);
  const atoms = uniq.map(([x, y]) => ({ Z: 6, x, y, z: 0 }));
  for (const c of uniq) {
    const nb = uniq.filter((q) => q !== c && Math.hypot(q[0] - c[0], q[1] - c[1]) < a + 1e-6);
    if (nb.length !== 2) continue;                                          // the two fusion carbons carry no H
    const bx = 2 * c[0] - nb[0][0] - nb[1][0], by = 2 * c[1] - nb[0][1] - nb[1][1], n = Math.hypot(bx, by);
    atoms.push({ Z: 1, x: c[0] + h * bx / n, y: c[1] + h * by / n, z: 0 });
  }
  return atoms.map((p) => ({ Z: p.Z, x: p.x * ANGSTROM, y: p.y * ANGSTROM, z: p.z * ANGSTROM }));
}
const NAPH = naphthalene();
const naphPred = (() => { const ang = NAPH.map((p) => [p.Z]); const c = counts(ang), nocc = c.nElec / 2;
  return { nAO: c.nAO, nocc, predictedMs: Math.round(predictMs(eriWork(c.widths), rpaWork(c.nAO, nocc))) }; })();

const CASES = [
  { id: 'H2O', basis: 'sto-3g', atoms: moleculeAtoms('H2O'), charge: moleculeCharge('H2O'), predictedMs: MOLECULE_BY_ID.get('H2O').predictedMs },
  { id: 'N2', basis: 'sto-3g', atoms: moleculeAtoms('N2'), charge: moleculeCharge('N2'), predictedMs: MOLECULE_BY_ID.get('N2').predictedMs },
  { id: 'C6H6', basis: 'sto-3g', atoms: moleculeAtoms('C6H6'), charge: moleculeCharge('C6H6'), predictedMs: MOLECULE_BY_ID.get('C6H6').predictedMs },
  /* benzene is NOT offered in 6-31+G* (126 AO > BASIS_631.maxAO 46): the one 6-31+G* row is the cap itself, C₂H₄ at 46 AO */
  { id: 'C2H4', basis: '6-31+g-star', atoms: moleculeAtoms('C2H4'), charge: moleculeCharge('C2H4'), predictedMs: null },
  { id: 'C10H8 (ideal, beyond the library)', basis: 'sto-3g', atoms: NAPH, charge: 0, predictedMs: naphPred.predictedMs },
];

/* mathworker.js canonicalStates, VERBATIM (2026-10-07, 61f7c2c) — not exported there, so copied to be timed on its own */
function canonicalStates(sol, I, R) {
  const n = I.n, nocc = sol.nocc, nvir = n - nocc, d = nocc * nvir, C = sol.C, tda = R.tda;
  const rMO = [I.X, I.Y, I.Z].map((M) => {
    const half = new Float64Array(n * n), T = new Float64Array(n * n);
    for (let u = 0; u < n; u++) for (let q = 0; q < n; q++) { let s = 0; for (let w = 0; w < n; w++) s += M[u * n + w] * C[w * n + q]; half[u * n + q] = s; }
    for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) { let s = 0; for (let u = 0; u < n; u++) s += C[u * n + p] * half[u * n + q]; T[p * n + q] = s; }
    return T;
  });
  const X0 = new Float64Array(d * d), omega = new Float64Array(d);
  tda.forEach((r, k) => { X0.set(r.X, k * d); omega[k] = r.omega; });
  const dip = dipoleFamily(rMO, n, nocc, nvir);
  const canon = canonicaliseSpectrum({ X: X0, omega, d, families: [dip, coordinateFamily(d)] });
  const X = canon.X, mu = new Float64Array(3 * d), f = new Float64Array(d), cluster = new Int32Array(d), size = new Int32Array(d), pivot = new Float64Array(d);
  for (let k = 0; k < d; k++) {
    let m2 = 0;
    for (let q = 0; q < 3; q++) { let s = 0; for (let p = 0; p < d; p++) s += dip.rows[q * d + p] * X[k * d + p]; mu[3 * k + q] = s; m2 += s * s; }
    f[k] = (2 / 3) * omega[k] * m2;
  }
  canon.clusters.forEach(([s0, e0], ci) => {
    let least = Infinity; for (const pv of canon.pivots[ci].pivots) least = Math.min(least, pv.norm);
    for (let k = s0; k < e0; k++) { cluster[k] = ci; size[k] = e0 - s0; pivot[k] = least; }
  });
  return { n, nocc, nvir, d, omega, f, mu, cluster, size, pivot, X, rMO };
}

const now = () => performance.now();
const r2 = (x) => +x.toFixed(2);
function passA(c) {
  const msg = { atoms: c.atoms, basis: c.basis, charge: c.charge };
  const t0 = now(); const g = chemGround(msg); const tG = now() - t0;
  const t1 = now(); const s = chemSpectrum(msg); const tS = now() - t1;
  return { groundMs: r2(tG), spectrumMs: r2(tS), totalMs: r2(tG + tS), integralsMs: r2(g.timings.integrals), scfMs: r2(s.timings.scf), rpaMs: r2(s.timings.rpa),
    nAO: g.nAO, nocc: g.nocc, energy: g.energy, converged: g.converged, roots: s.roots.length };
}
function passB(c) {
  const t0 = now(); const sol = moleculeRHF({ atoms: c.atoms, basis: c.basis, charge: c.charge, record: RECS[c.basis] }); const tG = now() - t0;
  const I = sol.integrals;
  const t1 = now(); const R = rpa({ S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: sol.C, eps: sol.orbitalEnergies, nocc: sol.nocc }); const tR = now() - t1;
  const t2 = now(); const T = R.tda; const tT = now() - t2;
  const t3 = now(); canonicalStates(sol, I, R); const tC = now() - t3;
  return { solveMs: r2(tG), integralsMs: r2(sol.timings.integrals), rpaMs: r2(tR), tdaMs: r2(tT), canonMs: r2(tC), tdaRoots: T.length };
}
const med = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const stat = (rows, k) => { const v = rows.map((r) => r[k]); return { median: r2(med(v)), min: r2(Math.min(...v)), max: r2(Math.max(...v)) }; };

const R = { at: new Date().toISOString(), node: process.version, cpu: os.cpus()[0].model, kernel: os.release(), runs: RUNS,
  model: { fitted: COST.fitted, formula: COST.model, a: COST.a, b: COST.b, c: COST.c, capMs: CAP_MS, anchors: COST.anchors }, cases: {} };
for (const c of CASES) R.cases[c.id] = { basis: c.basis, predictedMs: c.predictedMs, cold: null, A: [], B: [] };
/* the cold pass (run 0), then RUNS warm passes; molecules cycled so the worker cache never answers */
for (let run = 0; run <= RUNS; run++) {
  for (const c of CASES) {
    const a = passA(c), e = R.cases[c.id];
    if (run === 0) e.cold = a; else e.A.push(a);
    console.log(`run ${run} A ${c.id} [${c.basis}] nAO ${a.nAO}: ground ${a.groundMs} (int ${a.integralsMs}) spectrum ${a.spectrumMs} (rpa ${a.rpaMs}) total ${a.totalMs} ms`);
  }
}
for (let run = 0; run < RUNS; run++) {
  for (const c of CASES) {
    const b = passB(c); R.cases[c.id].B.push(b);
    console.log(`run ${run} B ${c.id}: solve ${b.solveMs} rpa ${b.rpaMs} tda ${b.tdaMs} canon ${b.canonMs} ms`);
  }
}
console.log('\n| molecule | basis | nAO | integrals ms | ground (SCF wall) ms | RPA ms | TDA ms | canon ms | spectrum wall ms | total ms | predicted ms | predicted / total |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const [id, e] of Object.entries(R.cases)) {
  const s = { integrals: stat(e.A, 'integralsMs'), ground: stat(e.A, 'groundMs'), rpa: stat(e.A, 'rpaMs'), spectrum: stat(e.A, 'spectrumMs'), total: stat(e.A, 'totalMs'),
    tda: stat(e.B, 'tdaMs'), canon: stat(e.B, 'canonMs'), rpaB: stat(e.B, 'rpaMs'), solveB: stat(e.B, 'solveMs') };
  e.summary = s; e.nAO = e.A[0].nAO; e.nocc = e.A[0].nocc; e.energy = e.A[0].energy;
  e.ratio = e.predictedMs ? r2(e.predictedMs / s.total.median) : null;
  const f = (x) => `${x.median} (${x.min}–${x.max})`;
  console.log(`| ${id} | ${e.basis} | ${e.nAO} | ${f(s.integrals)} | ${f(s.ground)} | ${f(s.rpa)} | ${f(s.tda)} | ${f(s.canon)} | ${f(s.spectrum)} | ${f(s.total)} | ${e.predictedMs ?? '—'} | ${e.ratio ?? '—'} |`);
}
mkdirSync('research/release-0.4.0/measure', { recursive: true });
writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT);
