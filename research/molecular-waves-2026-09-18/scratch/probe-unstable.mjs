// Scratch — CuH/ZnH2: which solution does the SCF land on, and what do the two eigensolvers say about A ± B there?
import fs from 'node:fs';
import { moleculeRHF, registerRecord, stabilityHessian } from '../../../lab/rhf-molecule.js';
import { hessianBlocks } from '../../../lab/rpa-inspector.js';
import { moleculeAtoms, moleculeCharge, MOLECULE_BY_ID } from '../../../lab/molecules.js';
import { eigSym, eigSymJacobi } from '../../../lab/h2ci.js';
registerRecord('sto-3g', JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const LIB = JSON.parse(fs.readFileSync(new URL('../../../lab/oracles/sto-3g-v1.json', import.meta.url), 'utf8')).library;
for (const id of ['CuH', 'ZnH2']) {
  for (const detect of [false, true]) {
    const sol = moleculeRHF({ atoms: moleculeAtoms(id), basis: 'sto-3g', charge: moleculeCharge(id), detect });
    const I = sol.integrals, n = I.n, nocc = sol.nocc, nov = nocc * (n - nocc);
    const { A, B } = hessianBlocks({ eri: I.eri, C: sol.C, eps: sol.orbitalEnergies, nocc, n });
    const ApB = new Float64Array(nov * nov), AmB = new Float64Array(nov * nov);
    for (let p = 0; p < nov; p++) for (let q = 0; q < nov; q++) {
      const s = 0.5 * (A[p * nov + q] + A[q * nov + p]), d = 0.5 * (B[p * nov + q] + B[q * nov + p]);
      ApB[p * nov + q] = s + d; AmB[p * nov + q] = s - d; }
    const H = stabilityHessian(I, sol, nocc);
    console.log(id, 'detect=' + detect, 'E', sol.energy.toFixed(9), 'oracleE', LIB[id].energy.toFixed(9),
      'conv', sol.converged, 'iters', sol.iterations, 'guess', sol.guess, 'nov', nov,
      '| QL A+B', eigSym(ApB, nov).values[0].toExponential(4), 'jacobi A+B', eigSymJacobi(ApB, nov).values[0].toExponential(4),
      '| QL A-B', eigSym(AmB, nov).values[0].toExponential(4), 'jacobi A-B', eigSymJacobi(AmB, nov).values[0].toExponential(4),
      '| chol', JSON.stringify(H.positiveDefinite), 'table', JSON.stringify(MOLECULE_BY_ID.get(id).instability));
  }
}
