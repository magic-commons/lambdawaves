// Scratch — open problem 8 of MATH-H2O: "Jacobi at n = 72 leaves idempotency 8e-8 after 400 MMUT steps".
// n = 72 is the REALIFIED size of benzene's 36-AO Hermitian step.  Old tree vs new, same kick, same Δt.
//   node research/molecular-waves-2026-09-18/scratch/probe-idempotency.mjs
import fs from 'node:fs';
import { moleculeRHF as oldRHF, registerRecord as oldRegister } from './old/lab/rhf-molecule.js';
import { createRTHF as oldRT } from './old/lab/density.js';
import { moleculeRHF, registerRecord } from '../../../lab/rhf-molecule.js';
import { createRTHF } from '../../../lab/density.js';
import { moleculeAtoms } from '../../../lab/molecules.js';
const rec = JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8'));
oldRegister('sto-3g', rec); registerRecord('sto-3g', rec);
const STEPS = 400, dt = 0.01, kappa = 1e-3;
const run = (tag, RHF, RT, restartEvery) => {
  const sol = RHF({ atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', charge: 0, detect: false, stability: false, hessian: false });
  const I = sol.integrals, n = I.n;
  const e = RT({ n, S: I.S, h: I.h, eri: I.eri, Z: I.Z, mu: [I.X, I.Y, I.Z], Enuc: I.Enuc,
    nuclearDipole: I.nuclearDipole[2], nElectrons: sol.nElectrons, D0: sol.D, dt, integrator: 'mmut', restartEvery });
  e.kickAlong('z', kappa);
  const t0 = performance.now();
  for (let k = 0; k < STEPS; k++) e.step();
  const ms = performance.now() - t0, o = e.observables();
  console.log(`${tag.padEnd(34)} n ${n} (realified ${2 * n})  idempotency ${o.idempotency.toExponential(3)}  Tr(DS) ${o.electrons.toFixed(12)}`
    + `  E ${o.fieldFreeTotal.toFixed(9)}  dipole ${e.dipoleAlong('z').toExponential(6)}  ${(ms / STEPS).toFixed(2)} ms/step`);
  return { idempotency: o.idempotency, electrons: o.electrons, energy: o.fieldFreeTotal, msPerStep: ms / STEPS };
};
const a = run('OLD Jacobi, restartEvery 50', oldRHF, oldRT, 50);
const b = run('OLD Jacobi, unrestarted', oldRHF, oldRT, Infinity);
const c = run('NEW QL, restartEvery 50', moleculeRHF, createRTHF, 50);
const d = run('NEW QL, unrestarted (the card)', moleculeRHF, createRTHF, 0);
fs.writeFileSync(new URL('./idempotency.json', import.meta.url), JSON.stringify({ steps: STEPS, dt, kappa,
  oldRestart50: a, oldUnrestarted: b, newRestart50: c, newUnrestarted: d }, null, 1));
