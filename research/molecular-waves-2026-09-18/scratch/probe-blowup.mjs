// Scratch — WHEN does benzene's RT run lose idempotency?  Print the defect every 10 steps for four configurations.
import fs from 'node:fs';
import { moleculeRHF as oldRHF, registerRecord as oldRegister } from './old/lab/rhf-molecule.js';
import { createRTHF as oldRT } from './old/lab/density.js';
import { moleculeRHF, registerRecord } from '../../../lab/rhf-molecule.js';
import { createRTHF } from '../../../lab/density.js';
import { moleculeAtoms } from '../../../lab/molecules.js';
const rec = JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8'));
oldRegister('sto-3g', rec); registerRecord('sto-3g', rec);
const STEPS = 120, dt = 0.01;
for (const [tag, RHF, RT, restartEvery] of [['OLD Jacobi r50', oldRHF, oldRT, 50], ['OLD Jacobi unrestarted', oldRHF, oldRT, Infinity],
  ['NEW QL unrestarted', moleculeRHF, createRTHF, 0]]) {
  const sol = RHF({ atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', charge: 0, detect: false, stability: false, hessian: false });
  const I = sol.integrals, n = I.n;
  const e = RT({ n, S: I.S, h: I.h, eri: I.eri, Z: I.Z, mu: [I.X, I.Y, I.Z], Enuc: I.Enuc,
    nuclearDipole: I.nuclearDipole[2], nElectrons: sol.nElectrons, D0: sol.D, dt, integrator: 'mmut', restartEvery });
  e.kickAlong('z', 1e-3);
  const marks = [];
  for (let k = 1; k <= STEPS; k++) { e.step(); if (k % 10 === 0 || k <= 3) { const o = e.observables(); marks.push(`${k}:${o.idempotency.toExponential(1)}`); } }
  console.log(tag.padEnd(24), marks.join(' '));
}
