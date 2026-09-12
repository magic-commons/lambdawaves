import { readFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { fockReal } from '../../../lab/scf.js';
import { loewdin } from '../../../lab/density.js';
import { eigSym } from '../../../lab/h2ci.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const R = 1.09768 / 0.52917721092;
const mol = molecule(bse, [{ Z: 7, c: [0, 0, 0] }, { Z: 7, c: [0, 0, R] }]), n = mol.n, nocc = 7;
const { X } = loewdin(mol.S, n);
const mm = (A, B) => { const C = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const a = A[i * n + k]; if (!a) continue; for (let j = 0; j < n; j++) C[i * n + j] += a * B[k * n + j]; } return C; };
let D = new Float64Array(n * n);
for (let it = 0; it < 8; it++) {
  const F = fockReal({ h: mol.h, eri: mol.eri, n }, D);
  let E = mol.Enuc; for (let i = 0; i < n * n; i++) E += 0.5 * D[i] * (mol.h[i] + F[i]);
  const Ft = mm(mm(X, F), X), e = eigSym(Ft, n), C = mm(X, e.vectors);
  console.log(`it ${it} E=${E.toFixed(9).padStart(16)} eps=${[...e.values].map(x => x.toFixed(6).padStart(11)).join('')}`);
  const Dn = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0; for (let o = 0; o < nocc; o++) s += C[i * n + o] * C[j * n + o]; Dn[i * n + j] = 2 * s; }
  D = Dn;
}
