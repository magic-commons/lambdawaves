/* bf-r11-kepler.mjs — Round 11 audit §3: is the drawn ELLIPSE a classical orbit at all?
 * Run:  node research/probes/bf-r11-kepler.mjs
 *
 * (a) Pauli's replacement on a NON-COHERENT shell state |3,1,0> + |3,2,0>: does <z> = -(3n/2)<K_z> still hold?
 * (b) the consistency of the drawn ellipse: a classical orbit of semi-major a and eccentricity e has
 *     angular momentum L_orb = sqrt(a(1-e^2)) = sqrt(p).  Does that equal |<L>|?  Pauli says
 *     <L^2> + <K^2> = n^2 - 1, and |<L>|^2 <= <L^2>, |<K>|^2 <= <K^2>, so |<L>|^2 + |<K>|^2 <= n^2 - 1 < n^2:
 *     the drawn orbit ALWAYS carries more angular momentum than the state.  Measure the gap.
 */
import { BASIS } from '../../lab/hydrogen.js';
import { shellMatrix, rotorExpectations, applyRotor } from '../../lab/frontier.js';
import { dipoleZ } from '../../lab/dynamics.js';
import { keplerOrbit } from '../../lab/kepler.js';

const N = 91;
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
const orbitOf = (re, im, n) => keplerOrbit(n, rotorExpectations(shellMatrix(re, im, n)));

console.log('=== (a) PAULI ON A NON-COHERENT SHELL STATE ===');
for (const [tag, build] of [
  ['|3,1,0> + |3,2,0>  (equal, real)', () => { const re = new Float64Array(N), im = new Float64Array(N); re[idx(3,1,0)] = Math.SQRT1_2; re[idx(3,2,0)] = Math.SQRT1_2; return [re, im]; }],
  ['|3,1,0> + i|3,2,0> (quadrature)', () => { const re = new Float64Array(N), im = new Float64Array(N); re[idx(3,1,0)] = Math.SQRT1_2; im[idx(3,2,0)] = Math.SQRT1_2; return [re, im]; }],
  ['|3,0,0> + |3,1,0> + |3,2,0>',     () => { const re = new Float64Array(N), im = new Float64Array(N); const s = 1/Math.sqrt(3); re[idx(3,0,0)] = s; re[idx(3,1,0)] = s; re[idx(3,2,0)] = s; return [re, im]; }],
  ['|4,0,0> + |4,3,0>',               () => { const re = new Float64Array(N), im = new Float64Array(N); re[idx(4,0,0)] = Math.SQRT1_2; re[idx(4,3,0)] = Math.SQRT1_2; return [re, im]; }],
]) {
  const [re, im] = build();
  const n = tag.includes('|4') ? 4 : 3;
  const ids = []; for (const s of BASIS) if (s.n === n) ids.push(s.index);
  const o = orbitOf(re, im, n), z = dipoleZ(re, im, ids).value;
  console.log(`${tag}\n   <z> exact dipole = ${z.toExponential(12)}   -(3n/2)<K_z> = ${o.meanPosition[2].toExponential(12)}   |diff| = ${Math.abs(z - o.meanPosition[2]).toExponential(3)}`);
  console.log(`   |<L>| = ${o.absL.toFixed(10)}   |<K>| = ${o.absK.toFixed(10)}   e = ${o.e.toFixed(10)}   eL = ${o.eL.toFixed(10)}   coherence = ${o.coherence.toFixed(6)}`);
}

console.log('\n=== (b) IS THE DRAWN ELLIPSE A CLASSICAL ORBIT? ===');
console.log('a classical orbit with a = n^2 and eccentricity e has L_orb = sqrt(a(1-e^2)); the state has |<L>|.');
console.log('state                                   n   |<K>|      |<L>|      e=|K|/n   L_orb=sqrt(p)  L_orb-|<L>|   |<L>|^2+|<K>|^2   n^2-1   n^2');
const show = (tag, re, im, n) => {
  const o = orbitOf(re, im, n);
  const Lorb = o.isotropic ? 0 : Math.sqrt(o.p);
  const sq = o.absL ** 2 + o.absK ** 2;
  console.log(`${tag.padEnd(38)} ${n}   ${o.absK.toFixed(6)}   ${o.absL.toFixed(6)}   ${o.e.toFixed(6)}   ${Lorb.toFixed(6)}      ${(Lorb - o.absL).toFixed(6)}       ${sq.toFixed(6)}       ${n*n-1}      ${n*n}`);
  return { Lorb, absL: o.absL, sq, n };
};
const rows = [];
{ const re = new Float64Array(N), im = new Float64Array(N); re[idx(6,5,5)] = 1; rows.push(show('circular |6,5,5>  (max coherence)', re, im, 6)); }
{ const re = new Float64Array(N), im = new Float64Array(N); re[idx(3,2,2)] = 1; rows.push(show('circular |3,2,2>', re, im, 3)); }
{ const re = new Float64Array(N), im = new Float64Array(N); re[idx(6,5,5)] = 1; applyRotor(re, im, { which: 'K', axis: 'x', angle: 0.9 }); rows.push(show('Stark-rotated circular n=6, th=0.9', re, im, 6)); }
{ const re = new Float64Array(N), im = new Float64Array(N); re[idx(3,1,0)] = Math.SQRT1_2; re[idx(3,2,0)] = Math.SQRT1_2; rows.push(show('|3,1,0>+|3,2,0> (non-coherent)', re, im, 3)); }
{ const re = new Float64Array(N), im = new Float64Array(N); re[idx(4,1,0)] = 1; rows.push(show('|4,1,0>  (a bare p state)', re, im, 4)); }
{ let seed = 7; const rnd = () => { seed = (seed*1664525+1013904223)>>>0; return seed/4294967296 - 0.5; };
  for (let t = 0; t < 4; t++) { const re = new Float64Array(N), im = new Float64Array(N); for (const s of BASIS) if (s.n === 5) { re[s.index] = rnd(); im[s.index] = rnd(); } rows.push(show(`random n=5 shell state #${t+1}`, re, im, 5)); } }

console.log('\nworst |L_orb - |<L>|| over the sample:', Math.max(...rows.map(r => Math.abs(r.Lorb - r.absL))).toFixed(6));
console.log('is |<L>|^2 + |<K>|^2 <= n^2 - 1 in every case?',
  rows.every(r => r.sq <= r.n*r.n - 1 + 1e-9), ' (Pauli bound)');
console.log('is |<L>|^2 + |<K>|^2 == n^2 (what the drawn ellipse needs) in ANY case?',
  rows.some(r => Math.abs(r.sq - r.n*r.n) < 1e-6));
