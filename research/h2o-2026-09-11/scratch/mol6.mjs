/* mol6.mjs — ROUND 4 · OPUS, B-H2O-2 engine side: md.mjs integrals → lab/scf.js rhf() for the six pinned molecules.
 * Geometries identical (to the bit) to mol6.py; energies compared against mol6-pyscf.json and against Sol's pins. */
import { readFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { rhf } from '../../../lab/scf.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const ref = JSON.parse(readFileSync(new URL('./mol6-pyscf.json', import.meta.url), 'utf8'));
const names = ['H2O', 'LiH', 'HF', 'NH3', 'CH4', 'N2'];
console.log('mol   nao nelec   E(engine)            E(PySCF)             Δ vs PySCF   Δ vs Sol pin   iters  ms   max|Δε|');
for (const name of names) {
  const r = ref[name], atoms = r.atoms_bohr.map(([Z, x, y, z]) => ({ Z, c: [x, y, z] }));
  const t0 = Date.now();
  const mol = molecule(bse, atoms), n = mol.n;
  const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: r.nelec, tol: 1e-12 });
  const ms = Date.now() - t0;
  let de = 0; for (let k = 0; k < n; k++) de = Math.max(de, Math.abs(s.orbitalEnergies[k] - r.eps[k]));
  const dnuc = mol.Enuc - r.Enuc;
  console.log(`${name.padEnd(5)} ${String(n).padStart(3)} ${String(r.nelec).padStart(5)}   ${s.energy.toFixed(12)}  ${r.E.toFixed(12)}  ${(s.energy - r.E).toExponential(3).padStart(11)}  ${(s.energy - r.pinned).toExponential(3).padStart(11)}   ${String(s.iterations).padStart(3)} ${String(ms).padStart(5)}  ${de.toExponential(2)}   ΔEnuc ${dnuc.toExponential(2)}  conv ${s.converged}`);
}
