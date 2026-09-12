/* eigcost.mjs — MEASURED: lab/h2ci.js eigSym's stopping test `off < 1e-34` is ABSOLUTE, so for H₂O's Löwdin Fock
 * matrix (‖F̃‖_F ≈ 29) the attainable Jacobi floor straddles it and most RT steps exhaust the 100-sweep cap. */
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
function jacobiSweeps(A, N, thresh) {                                        // eigSym's loop, instrumented
  const a = Array.from(A); let off = 0;
  for (let sweep = 0; sweep < 100; sweep++) {
    off = 0; for (let p = 0; p < N; p++) for (let q = p + 1; q < N; q++) off += a[p * N + q] ** 2;
    if (off < thresh) return { sweeps: sweep + 1, off };
    for (let p = 0; p < N; p++) for (let q = p + 1; q < N; q++) {
      const apq = a[p * N + q]; if (Math.abs(apq) < 1e-300) continue;
      const th = (a[q * N + q] - a[p * N + p]) / (2 * apq), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), sn = t * c;
      for (let k = 0; k < N; k++) { const x = a[k * N + p], y = a[k * N + q]; a[k * N + p] = c * x - sn * y; a[k * N + q] = sn * x + c * y; }
      for (let k = 0; k < N; k++) { const x = a[p * N + k], y = a[q * N + k]; a[p * N + k] = c * x - sn * y; a[q * N + k] = sn * x + c * y; }
    }
  }
  return { sweeps: 100, off };
}
const hist = [], rel = [];
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
  hist.push(jacobiSweeps(R, m, 1e-34).sweeps);
  rel.push(jacobiSweeps(R, m, Math.pow(1e-14 * Math.sqrt(fro), 2)).sweeps);
  rt.step(0.01);
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`absolute test off<1e-34 : mean sweeps ${mean(hist).toFixed(1)}, at the 100 cap in ${hist.filter((x) => x === 100).length}/200 steps`);
console.log(`scale-free test off<(1e-14‖A‖_F)² : mean sweeps ${mean(rel).toFixed(1)}, cap hit ${rel.filter((x) => x === 100).length}/200`);
console.log(`⇒ the RT step pays ${(mean(hist) / mean(rel)).toFixed(1)}× more Jacobi work than it needs; the extra sweeps are no-ops`);
