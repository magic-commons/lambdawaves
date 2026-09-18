// Scratch — warm before/after in ONE process, alternating, best of three.
//   node research/molecular-waves-2026-09-18/scratch/bench-both.mjs
import fs from 'node:fs';
import { moleculeRHF as oldRHF, registerRecord as oldReg } from './old/lab/rhf-molecule.js';
import { rpa as oldRpa } from './old/lab/rpa-inspector.js';
import { moleculeRHF, registerRecord } from '../../../lab/rhf-molecule.js';
import { rpa } from '../../../lab/rpa-inspector.js';
import { moleculeAtoms, moleculeCharge } from '../../../lab/molecules.js';
const rec = JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8'));
oldReg('sto-3g', rec); registerRecord('sto-3g', rec);
const clock = (fn) => { const t = performance.now(), v = fn(); return { v, ms: performance.now() - t }; };
const once = (id, RHF, RPA) => {
  const atoms = moleculeAtoms(id), charge = moleculeCharge(id);
  const g = clock(() => RHF({ atoms, basis: 'sto-3g', charge }));                 // the card's own call: detect, stability, hessian
  const sol = g.v, I = sol.integrals;
  const r = clock(() => RPA({ S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: sol.C, eps: sol.orbitalEnergies, nocc: sol.nocc }));
  return { ground: g.ms, rpa: r.ms, total: g.ms + r.ms, energy: sol.energy, omega0: r.v.roots[0].omega, roots: r.v.roots.length };
};
for (let w = 0; w < 4; w++) for (const id of ['H2O', 'C2H4']) { once(id, oldRHF, oldRpa); once(id, moleculeRHF, rpa); }   // warm both trees
const out = {};
for (const id of ['H2O', 'C2H4', 'C6H6']) {
  const reps = id === 'C6H6' ? 2 : 5, best = { old: null, now: null };
  for (let k = 0; k < reps; k++) {
    const o = once(id, oldRHF, oldRpa), n2 = once(id, moleculeRHF, rpa);
    if (!best.old || o.total < best.old.total) best.old = o;
    if (!best.now || n2.total < best.now.total) best.now = n2;
  }
  const f = (x) => ({ ground: +x.ground.toFixed(1), rpa: +x.rpa.toFixed(1), total: +x.total.toFixed(1) });
  out[id] = { before: f(best.old), after: f(best.now), speedup: +(best.old.total / best.now.total).toFixed(2),
    energyDelta: best.now.energy - best.old.energy, omegaDelta: best.now.omega0 - best.old.omega0, roots: best.now.roots };
  console.log(id, JSON.stringify(out[id]));
}
fs.writeFileSync(new URL('./bench-both.json', import.meta.url), JSON.stringify(out, null, 1));
