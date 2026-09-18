// Scratch bench — warm timings of the preparation path.  node research/molecular-waves-2026-09-18/scratch/bench-chem.mjs <tag>
import fs from 'node:fs';
import { moleculeRHF, registerRecord } from '../../../lab/rhf-molecule.js';
import { moleculeAtoms, moleculeCharge } from '../../../lab/molecules.js';
import { rpa } from '../../../lab/rpa-inspector.js';

const tag = process.argv[2] || 'run';
registerRecord('sto-3g', JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const clock = (fn) => { const t = performance.now(), value = fn(); return { value, ms: performance.now() - t }; };
const solve = (id) => {
  const atoms = moleculeAtoms(id), charge = moleculeCharge(id);
  const g = clock(() => moleculeRHF({ atoms, basis: 'sto-3g', charge }));
  const sol = g.value, I = sol.integrals;
  const r = clock(() => rpa({ S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: sol.C, eps: sol.orbitalEnergies, nocc: sol.nocc }));
  const roots = r.value.roots;
  return { moleculeRHF: +g.ms.toFixed(1), rpa: +r.ms.toFixed(1), total: +(g.ms + r.ms).toFixed(1),
    integrals: sol.timings ? sol.timings.integrals : null, energy: sol.energy,
    omega0: roots[0].omega, f0: roots[0].f, nRoots: roots.length };
};
for (const id of ['H2O', 'C2H4']) solve(id);                        // warm the JIT before anything is timed
const out = { tag, node: process.version, date: new Date().toISOString(), runs: {} };
for (const id of ['H2O', 'C2H4', 'C6H6']) {
  const passes = [solve(id), solve(id)];
  const best = passes.reduce((a, b) => (b.total < a.total ? b : a));
  out.runs[id] = { ...best, passes: passes.map((p) => p.total) };
  console.log(id, JSON.stringify(out.runs[id]));
}
fs.writeFileSync(new URL(`./bench-${tag}.json`, import.meta.url), JSON.stringify(out, null, 2));
