/* eigsym-gate.mjs — ROUND 4 · OPUS, B-H2O-3.  Does the LANDED stop `off < 1e-34*max(1,‖A‖_F²)` in lab/h2ci.js
 * actually deliver Sol's gate (mean 8.7 sweeps, zero 100-caps)?  Same 200 H₂O RT Focks as eigcost.mjs, the same
 * instrumented Jacobi loop, several candidate constants, and the eigenvalue agreement between them. */
import { readFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
import { createRTHF, sandwich, loewdin } from '../../../lab/density.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n;
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
const { X } = loewdin(mol.S, n);
const rt = createRTHF({ n, S: mol.S, h: mol.h, eri: mol.eri, Z: mol.M[2], Enuc: mol.Enuc, nuclearDipole: mol.nuclearDipole[2], nElectrons: 10, D0: s.D, dt: 0.01 });
rt.kick(1e-3);
function jacobi(A, N, thresh) {
  const a = Array.from(A), v = new Float64Array(N * N);
  for (let i = 0; i < N; i++) v[i * N + i] = 1;
  let off = 0, sweeps = 100;
  for (let sweep = 0; sweep < 100; sweep++) {
    off = 0; for (let p = 0; p < N; p++) for (let q = p + 1; q < N; q++) off += a[p * N + q] ** 2;
    if (off < thresh) { sweeps = sweep + 1; break; }
    for (let p = 0; p < N; p++) for (let q = p + 1; q < N; q++) {
      const apq = a[p * N + q]; if (Math.abs(apq) < 1e-300) continue;
      const th = (a[q * N + q] - a[p * N + p]) / (2 * apq), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), sn = t * c;
      for (let k = 0; k < N; k++) { const x = a[k * N + p], y = a[k * N + q]; a[k * N + p] = c * x - sn * y; a[k * N + q] = sn * x + c * y; }
      for (let k = 0; k < N; k++) { const x = a[p * N + k], y = a[q * N + k]; a[p * N + k] = c * x - sn * y; a[q * N + k] = sn * x + c * y; }
      for (let k = 0; k < N; k++) { const x = v[k * N + p], y = v[k * N + q]; v[k * N + p] = c * x - sn * y; v[k * N + q] = sn * x + c * y; }
    }
  }
  const vals = []; for (let i = 0; i < N; i++) vals.push(a[i * N + i]);
  vals.sort((x, y) => x - y);
  return { sweeps, off, vals };
}
const RULES = [
  ['absolute 1e-34 (pre-fix)',        (f2) => 1e-34],
  ['LANDED 1e-34*max(1,‖A‖_F²)',      (f2) => 1e-34 * Math.max(1, f2)],
  ['(1e-14‖A‖_F)² = 1e-28‖A‖_F²',     (f2) => 1e-28 * f2],
  ['(1e-15‖A‖_F)² = 1e-30‖A‖_F²',     (f2) => 1e-30 * f2],
  ['(1e-16‖A‖_F)² = 1e-32‖A‖_F²',     (f2) => 1e-32 * f2],
];
const sweeps = RULES.map(() => []), caps = RULES.map(() => 0), offs = RULES.map(() => 0);
let dEigMax = 0, froMax = 0, refVals = null;
for (let step = 0; step < 200; step++) {
  const D = sandwich(X, rt.P), F = { re: new Float64Array(n * n), im: new Float64Array(n * n), n };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let fr = mol.h[i * n + j], fi = 0;
    for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) { const J = mol.eri[((i * n + j) * n + k) * n + l], K = 0.5 * mol.eri[((i * n + l) * n + k) * n + j];
      fr += D.re[k * n + l] * J - D.re[l * n + k] * K; fi += D.im[k * n + l] * J - D.im[l * n + k] * K; }
    F.re[i * n + j] = fr; F.im[i * n + j] = fi; }
  const Ft = sandwich(X, F), m = 2 * n, R = new Float64Array(m * m);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = Ft.re[i * n + j], b = Ft.im[i * n + j];
    R[i * m + j] = a; R[(i + n) * m + (j + n)] = a; R[i * m + (j + n)] = -b; R[(i + n) * m + j] = b; }
  let fro = 0; for (const v of R) fro += v * v;
  froMax = Math.max(froMax, Math.sqrt(fro));
  const res = RULES.map(([, f]) => jacobi(R, m, f(fro)));
  res.forEach((r, i) => { sweeps[i].push(r.sweeps); if (r.sweeps === 100) caps[i]++; offs[i] = Math.max(offs[i], r.off); });
  // eigenvalue agreement: the loosest rule against the strictest
  for (let k = 0; k < m; k++) dEigMax = Math.max(dEigMax, Math.abs(res[2].vals[k] - res[1].vals[k]));
  if (step === 0) refVals = res[1].vals;
  rt.step(0.01);
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`‖A‖_F (realified 14x14) max over 200 steps = ${froMax.toFixed(4)};  ‖A‖_F² = ${(froMax*froMax).toFixed(1)}`);
RULES.forEach(([name], i) => console.log(`  ${name.padEnd(32)} mean sweeps ${mean(sweeps[i]).toFixed(2).padStart(6)}   100-caps ${String(caps[i]).padStart(3)}/200   max off at exit ${offs[i].toExponential(3)}`));
console.log(`max |Δλ| between the (1e-14‖A‖_F)² rule and the LANDED rule over 200 Focks × 14 eigenvalues = ${dEigMax.toExponential(3)}`);
