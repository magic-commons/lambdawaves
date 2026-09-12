/* b631.mjs — ROUND 4 · OPUS, Q16: does the md.mjs engine (l ≤ 2, already built and tested on one d fixture in
 * round 2) hold on a REAL d-containing molecular basis?  H₂O / 6-31+G* / 23 Cartesian AOs, engine + lab/scf.js. */
import { readFileSync, writeFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
const bse = JSON.parse(readFileSync(new URL('../6-31+gs.bse.json', import.meta.url), 'utf8'));
const t0 = Date.now();
const mol = molecule(bse, H2O), n = mol.n;
const tInt = Date.now() - t0;
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
console.log(`nao = ${n}   integrals ${tInt} ms   SCF ${s.iterations} cycles   E = ${s.energy.toFixed(12)}   Enuc = ${mol.Enuc.toFixed(12)}`);
console.log('eps[0:8] =', [...s.orbitalEnergies].slice(0, 8).map((x) => x.toFixed(6)).join(' '));
writeFileSync(new URL('./b631-engine.json', import.meta.url), JSON.stringify({ n, E: s.energy, Enuc: mol.Enuc,
  eps: [...s.orbitalEnergies], C: [...s.C], D: [...s.D], S: [...mol.S], h: [...mol.h], eri: [...mol.eri],
  M: mol.M.map((m) => [...m]), nuclearDipole: mol.nuclearDipole, order: mol.basis.bfs.map((b) => b.l) }));
console.log('wrote b631-engine.json');
