/* n2iter2.mjs — ROUND 4 OPUS: lab/scf.js's own Roothaan loop (diis off) on N2, 200 iterations, no early stop:
 * does the Jacobi eigensolver leave the higher stationary point the way LAPACK does? */
import { readFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { fockReal } from '../../../lab/scf.js';
import { loewdin } from '../../../lab/density.js';
import { eigSym } from '../../../lab/h2ci.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const mol = molecule(bse, [{ Z: 7, c: [0, 0, 0] }, { Z: 7, c: [0, 0, 1.09768 / 0.52917721092] }]), n = mol.n, nocc = 7;
const { X } = loewdin(mol.S, n);
const mm = (A, B) => { const C = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const a = A[i * n + k]; if (!a) continue; for (let j = 0; j < n; j++) C[i * n + j] += a * B[k * n + j]; } return C; };
let D = new Float64Array(n * n);
for (let it = 0; it <= 200; it++) {
  const F = fockReal({ h: mol.h, eri: mol.eri, n }, D);
  let E = mol.Enuc; for (let i = 0; i < n * n; i++) E += 0.5 * D[i] * (mol.h[i] + F[i]);
  const e1 = mm(mm(F, D), mol.S), e2 = mm(mm(mol.S, D), F), e = Float64Array.from(e1, (v, k) => v - e2[k]);
  const et = mm(mm(X, e), X); let err = 0; for (const v of et) err = Math.max(err, Math.abs(v));
  if (it < 16 || it % 10 === 0) console.log(`  it ${String(it).padStart(3)} E=${E.toFixed(12)} ‖e‖∞=${err.toExponential(3)}`);
  const eg = eigSym(mm(mm(X, F), X), n), C = mm(X, eg.vectors), Dn = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let sm = 0; for (let o = 0; o < nocc; o++) sm += C[i * n + o] * C[j * n + o]; Dn[i * n + j] = 2 * sm; }
  D = Dn;
}
