// Scratch — every enabled entry, new code vs the PySCF oracle; convergence, energy, gap. node ... sweep-all.mjs
import fs from 'node:fs';
import { moleculeRHF, registerRecord } from '../../../lab/rhf-molecule.js';
import { MOLECULES, moleculeAtoms, moleculeCharge } from '../../../lab/molecules.js';
registerRecord('sto-3g', JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const LIB = JSON.parse(fs.readFileSync(new URL('../../../lab/oracles/sto-3g-v1.json', import.meta.url), 'utf8')).library;
const out = [];
for (const m of MOLECULES) {
  const t = performance.now();
  let rec;
  try {
    const sol = moleculeRHF({ atoms: moleculeAtoms(m.id), basis: 'sto-3g', charge: moleculeCharge(m.id), detect: false, stability: false, hessian: false });
    rec = { id: m.id, nAO: m.nAO, ms: +(performance.now() - t).toFixed(0), E: sol.energy, dE: sol.energy - LIB[m.id].energy,
      conv: sol.converged, iters: sol.iterations, gap: sol.aufbau.gap, disabled: !!m.disabled };
  } catch (e) { rec = { id: m.id, error: String(e.message).slice(0, 60), disabled: !!m.disabled }; }
  out.push(rec);
  console.log(JSON.stringify(rec));
}
fs.writeFileSync(new URL('./sweep-all.json', import.meta.url), JSON.stringify(out, null, 1));
