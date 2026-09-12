import { readFileSync, writeFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { rhf } from '../../../lab/scf.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const R = 1.09768 / 0.52917721092;
const atoms = [{ Z: 7, c: [0, 0, 0] }, { Z: 7, c: [0, 0, R] }];
const mol = molecule(bse, atoms), n = mol.n;
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 14, tol: 1e-12 });
writeFileSync('n2-engine.json', JSON.stringify({ n, S: [...mol.S], T: [...mol.T], V: [...mol.V], eri: [...mol.eri], Enuc: mol.Enuc,
  E: s.energy, eps: [...s.orbitalEnergies], D: [...s.D], iters: s.iterations, hist: s.history.slice(-3) }));
console.log('engine E', s.energy, 'eps', [...s.orbitalEnergies].map(x=>x.toFixed(6)).join(' '));
