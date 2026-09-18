// Scratch — the matrix the FIRST Magnus-2 step diagonalises: F̃ built from the KICKED complex density.
import fs from 'node:fs';
import { moleculeRHF, registerRecord } from '../../../lab/rhf-molecule.js';
import { moleculeAtoms } from '../../../lab/molecules.js';
import { createRTHF, hermitianEigen as newEig, cmat, cmul, cadj, creal, sandwich, loewdin, idempotencyDefect } from '../../../lab/density.js';
import { createRTHF as oldRT, hermitianEigen as oldEig } from './old/lab/density.js';
registerRecord('sto-3g', JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const sol = moleculeRHF({ atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', charge: 0, detect: false, stability: false, hessian: false });
const I = sol.integrals, n = I.n, { X } = loewdin(I.S, n);
const args = { n, S: I.S, h: I.h, eri: I.eri, Z: I.Z, mu: [I.X, I.Y, I.Z], Enuc: I.Enuc, nuclearDipole: I.nuclearDipole[2],
  nElectrons: sol.nElectrons, D0: sol.D, dt: 0.01, integrator: 'mmut' };
for (const [tag, RT] of [['OLD', oldRT], ['NEW', createRTHF]]) {
  const e = RT({ ...args, restartEvery: tag === 'OLD' ? Infinity : 0 });
  const before = idempotencyDefect(e.P, 2);
  e.kickAlong('z', 1e-3);
  const kicked = idempotencyDefect(e.P, 2);
  e.step();
  console.log(tag, 'idempotency: ground', before.toExponential(2), 'after kick', kicked.toExponential(2), 'after one Magnus-2 step', idempotencyDefect(e.P, 2).toExponential(2));
}
/* the Fock matrix of the kicked state, in the Löwdin frame, and what the two eigensolvers make of it */
const e0 = createRTHF({ ...args, restartEvery: 0 }); e0.kickAlong('z', 1e-3);
const P = e0.P, D = sandwich(X, P), F = cmat(n);
for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let fr = I.h[i * n + j], fi = 0;
  for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) { const J = I.eri[((i * n + j) * n + k) * n + l], K = 0.5 * I.eri[((i * n + l) * n + k) * n + j];
    fr += D.re[k * n + l] * J - D.re[l * n + k] * K; fi += D.im[k * n + l] * J - D.im[l * n + k] * K; }
  F.re[i * n + j] = fr; F.im[i * n + j] = fi; }
const Ft = sandwich(X, F);
const defect = (V) => { const G = cmul(cadj(V), V); let d = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d = Math.max(d, Math.abs(G.re[i * n + j] - (i === j ? 1 : 0)), Math.abs(G.im[i * n + j])); return d; };
const eN = newEig(Ft), eO = oldEig(Ft);
let deg = 0; for (let k = 1; k < n; k++) if (Math.abs(eN.w[k] - eN.w[k - 1]) < 1e-9) deg++;
console.log('kicked Löwdin Fock: degenerate neighbours', deg + '/' + (n - 1), 'NEW V†V−I', defect(eN.V).toExponential(2), 'OLD V†V−I', defect(eO.V).toExponential(2));
