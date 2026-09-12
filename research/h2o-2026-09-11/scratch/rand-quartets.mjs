/* rand-quartets.mjs — ten random 3-D s/p four-shell systems: md.mjs integrals + the spec PySCF must reproduce. */
import { writeFileSync } from 'node:fs';
import { buildBasis, oneElectron, twoElectron, nuclearRepulsion } from './md.mjs';
let seed = 20260911;                                                          // xorshift, so the fixture is reproducible
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const cases = [];
for (let c = 0; c < 10; c++) {
  const specs = [], atoms = [];
  for (let s = 0; s < 4; s++) {
    const ctr = [0, 1, 2].map(() => (rnd() * 4 - 2));
    const l = rnd() < 0.5 ? 0 : 1, np = 1 + Math.floor(rnd() * 3);
    const exps = Array.from({ length: np }, () => 0.15 * Math.exp(rnd() * 4.6));   // 0.15 … 15
    const coefs = Array.from({ length: np }, () => rnd() * 2 - 1);
    specs.push({ c: ctr, l, exps, coefs }); atoms.push({ Z: 1, c: ctr });
  }
  const basis = buildBasis(specs, atoms), { S, T, V, M } = oneElectron(basis), eri = twoElectron(basis), n = basis.nbf;
  // the eightfold permutation symmetry, tested on independently computed orderings
  const gi = (i, j, k, l) => ((i * n + j) * n + k) * n + l;
  let sym = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) {
    const v = eri[gi(i, j, k, l)];
    for (const o of [[j, i, k, l], [i, j, l, k], [j, i, l, k], [k, l, i, j], [l, k, i, j], [k, l, j, i], [l, k, j, i]])
      sym = Math.max(sym, Math.abs(v - eri[gi(...o)]));
  }
  cases.push({ specs, atoms, n, S: [...S], T: [...T], V: [...V], Mx: [...M[0]], My: [...M[1]], Mz: [...M[2]],
    eri: [...eri], Enuc: nuclearRepulsion(atoms), sym });
}
writeFileSync(new URL('./rand-quartets.json', import.meta.url), JSON.stringify(cases));
console.log('cases', cases.length, 'worst in-engine 8-fold symmetry |Δ| =', Math.max(...cases.map((c) => c.sym)).toExponential(3),
  'shapes', cases.map((c) => c.specs.map((s) => 'spd'[s.l] + s.exps.length).join('')).join(' '));
