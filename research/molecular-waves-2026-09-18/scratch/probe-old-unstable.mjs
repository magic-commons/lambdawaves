// Scratch — the SHIPPED (HEAD) code on CuH/ZnH2 and on three energies, for an old-vs-new comparison.
import fs from 'node:fs';
import { moleculeRHF, registerRecord, stabilityHessian } from './old/lab/rhf-molecule.js';
import { moleculeAtoms, moleculeCharge } from './old/lab/molecules.js';
registerRecord('sto-3g', JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
for (const id of ['CuH', 'ZnH2']) {
  const sol = moleculeRHF({ atoms: moleculeAtoms(id), basis: 'sto-3g', charge: moleculeCharge(id), detect: false });
  const H = stabilityHessian(sol.integrals, sol, sol.nocc);
  console.log('OLD', id, 'E', sol.energy.toFixed(9), 'conv', sol.converged, 'A+B', H.lowestApB.toExponential(4), 'A-B', H.lowestAmB.toExponential(4));
}
for (const id of ['H2O', 'C2H4', 'C6H6']) {
  const sol = moleculeRHF({ atoms: moleculeAtoms(id), basis: 'sto-3g', charge: moleculeCharge(id) });
  console.log('OLD', id, 'E', sol.energy.toFixed(12), 'eps0', sol.orbitalEnergies[0].toFixed(12));
}
