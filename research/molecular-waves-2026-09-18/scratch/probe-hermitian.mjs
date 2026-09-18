// Scratch — is hermitianEigen's V unitary on the matrices benzene's RT actually hands it?
import fs from 'node:fs';
import { moleculeRHF, registerRecord } from '../../../lab/rhf-molecule.js';
import { moleculeAtoms } from '../../../lab/molecules.js';
import { hermitianEigen as newEig, cmat, cmul, cadj, creal, sandwich, loewdin, unitaryOf } from '../../../lab/density.js';
import { hermitianEigen as oldEig, unitaryOf as oldUnitary } from './old/lab/density.js';
registerRecord('sto-3g', JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const sol = moleculeRHF({ atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', charge: 0, detect: false, stability: false, hessian: false });
const I = sol.integrals, n = I.n, { X } = loewdin(I.S, n);
/* the matrices the propagator diagonalises: the Löwdin Fock at t = 0, and the Löwdin z-dipole the kick uses */
const D0 = creal(sol.D, n);
const F = (() => { const Fm = cmat(n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let f = I.h[i * n + j];
    for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) f += D0.re[k * n + l] * (I.eri[((i * n + j) * n + k) * n + l] - 0.5 * I.eri[((i * n + l) * n + k) * n + j]);
    Fm.re[i * n + j] = f; } return sandwich(X, Fm); })();
const Zt = sandwich(X, creal(I.Z, n));
const defect = (V) => { const G = cmul(cadj(V), V); let d = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d = Math.max(d, Math.abs(G.re[i * n + j] - (i === j ? 1 : 0)), Math.abs(G.im[i * n + j])); return d; };
const resid = (A, e) => { const AV = cmul(A, e.V); let d = 0;
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) d = Math.max(d, Math.abs(AV.re[i * n + k] - e.w[k] * e.V.re[i * n + k]), Math.abs(AV.im[i * n + k] - e.w[k] * e.V.im[i * n + k])); return d; };
const uDefect = (U) => { const G = cmul(U, cadj(U)); let d = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d = Math.max(d, Math.abs(G.re[i * n + j] - (i === j ? 1 : 0)), Math.abs(G.im[i * n + j])); return d; };
for (const [tag, A] of [['Löwdin Fock', F], ['Löwdin z dipole', Zt]]) {
  const eN = newEig(A), eO = oldEig(A);
  /* how degenerate is it?  count eigenvalues within 1e-9 of a neighbour */
  let deg = 0; for (let k = 1; k < n; k++) if (Math.abs(eN.w[k] - eN.w[k - 1]) < 1e-9) deg++;
  console.log(`${tag.padEnd(18)} degenerate neighbours ${deg}/${n - 1}  | NEW V†V−I ${defect(eN.V).toExponential(2)} resid ${resid(A, eN).toExponential(2)}`
    + `  UU†−I ${uDefect(unitaryOf(A, 0.01)).toExponential(2)}  | OLD V†V−I ${defect(eO.V).toExponential(2)} resid ${resid(A, eO).toExponential(2)}`
    + `  UU†−I ${uDefect(oldUnitary(A, 0.01)).toExponential(2)}`);
}
