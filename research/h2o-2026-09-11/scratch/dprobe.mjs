/* dprobe.mjs — an l=2 shell against PySCF cart=True: the Cartesian normalisation trap, measured. */
import { writeFileSync } from 'node:fs';
import { buildBasis, oneElectron, twoElectron, nuclearRepulsion } from './md.mjs';
const specs = [
  { c: [0, 0, 0], l: 2, exps: [1.7, 0.43], coefs: [0.32, 0.71] },            // a contracted d shell
  { c: [0.4, -0.9, 1.3], l: 1, exps: [0.8], coefs: [1.0] },
  { c: [-1.1, 0.6, 0.2], l: 0, exps: [2.3, 0.55], coefs: [0.41, 0.66] },
];
const atoms = specs.map((s) => ({ Z: 1, c: s.c }));
const basis = buildBasis(specs, atoms), { S, T, V, M } = oneElectron(basis), eri = twoElectron(basis), n = basis.nbf;
writeFileSync(new URL('./dprobe.json', import.meta.url), JSON.stringify({ specs, atoms, n,
  S: [...S], T: [...T], V: [...V], Mx: [...M[0]], My: [...M[1]], Mz: [...M[2]], eri: [...eri], Enuc: nuclearRepulsion(atoms) }));
console.log('n =', n, 'S diagonal =', [...Array(n).keys()].map((i) => S[i * n + i].toFixed(12)).join(' '));
