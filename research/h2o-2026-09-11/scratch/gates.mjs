/* gates.mjs — ROUND 4 · OPUS: the field and inspector gate numbers of B-H2O-4 and B-H2O-7, re-measured. */
import { readFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n;
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
const bfs = mol.basis.bfs, shells = mol.basis.shells;
function ao(r) {                                                              // all n contracted AO values at r
  const v = new Float64Array(n);
  for (const sh of shells) { const dx = r[0] - sh.c[0], dy = r[1] - sh.c[1], dz = r[2] - sh.c[2], r2 = dx * dx + dy * dy + dz * dz;
    const ex = sh.exps.map((a) => Math.exp(-a * r2));
    for (const b of sh.bfs) { let acc = 0;
      for (let i = 0; i < sh.exps.length; i++) acc += b.d[i] * ex[i];
      v[b.idx] = acc * Math.pow(dx, b.l[0]) * Math.pow(dy, b.l[1]) * Math.pow(dz, b.l[2]); } }
  return v;
}
const rho = (r) => { const v = ao(r); let d = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d += s.D[i * n + j] * v[i] * v[j]; return d; };
const O = mol.atoms[0].c, H1 = mol.atoms[1].c;
const mid = O.map((x, k) => 0.5 * (x + H1[k]));
console.log(`B-H2O-4 gate numbers, re-measured with the converged D:`);
console.log(`  rho(O nucleus)      = ${rho(O).toFixed(6)}   (Sol/round 2 pin 193.3139; Δ = ${(rho(O) - 193.3139).toExponential(2)})`);
console.log(`  rho(H nucleus)      = ${rho(H1).toFixed(6)}   (pin 0.3627; Δ = ${(rho(H1) - 0.3627).toExponential(2)})`);
console.log(`  rho(O–H midpoint)   = ${rho(mid).toFixed(6)}   (round 2 pin 0.492165)`);
console.log(`  rho at 12 bohr out  = ${rho([0, 0, O[2] + 12]).toExponential(4)}   (round 2 pin 1.8e-28)`);
console.log(`  96³ voxels = ${96 ** 3}; seven r32float layers = ${7 * 96 ** 3 * 4} bytes = ${(7 * 96 ** 3 * 4 / 1e6).toFixed(3)} MB`);
/* a numerical electron count on the grid, as a check that the evaluator is the same object as the density matrix */
let sum = 0; const L = 24, N = 120, dv = (2 * L / N) ** 3;
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++)
  sum += rho([-L + (i + 0.5) * 2 * L / N, -L + (j + 0.5) * 2 * L / N, -L + (k + 0.5) * 2 * L / N]);
console.log(`  ∫ρ dV on a ${N}³ midpoint grid over [−${L},${L}]³ bohr = ${(sum * dv).toFixed(6)} electrons (exact 10; the O 1s cusp is unresolved)`);
for (const [NN, LL2] of [[96, 10.3], [96, 24], [192, 10.3]]) {
  let a = 0; const dv2 = (2 * LL2 / NN) ** 3;
  for (let i = 0; i < NN; i++) for (let j = 0; j < NN; j++) for (let k = 0; k < NN; k++)
    a += rho([-LL2 + (i + 0.5) * 2 * LL2 / NN, -LL2 + (j + 0.5) * 2 * LL2 / NN, -LL2 + (k + 0.5) * 2 * LL2 / NN]);
  console.log(`  ∫ρ dV on ${NN}³ over [−${LL2},${LL2}]³ (spacing ${(2 * LL2 / NN).toFixed(4)} bohr) = ${(a * dv2).toFixed(6)} electrons`);
}
