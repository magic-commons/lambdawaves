/* bf-r11-zdefect.mjs — Round 11 audit §8/§10: does the CALCULUS window print a NEGATIVE kinetic
 * energy at Z != 1, and is radialDipole's cache Z-blind?
 * Run:  node research/probes/bf-r11-zdefect.mjs
 */
import { BASIS } from '../../lab/hydrogen.js';
import { setHamiltonian, setZ, getHamiltonian } from '../../lab/hamiltonian.js';
import { radialObservables, radialDipole, dipoleZ } from '../../lab/dynamics.js';
import { Register } from '../../lab/state.js';
import { stats } from '../../lab/calculus.js';

const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);

console.log('=== (1) EXACT hydrogenic values for reference ===');
console.log('  |n,l,m>=|1,0,0> at nuclear charge Z:  E = -Z^2/2,  <1/r> = Z,  <V> = -Z^2,  <T> = +Z^2/2,  2<T>+<V> = 0');
console.log('  |2,1,0> at Z:  E = -Z^2/8, <1/r> = Z/4, <V> = -Z^2/4, <T> = Z^2/8');

console.log('\n=== (2) what the lab computes ===');
for (const Z of [1, 2, 3]) {
  setHamiltonian('hydrogen'); setZ(Z);
  const H = getHamiltonian();
  const re = new Float64Array(91), im = new Float64Array(91); re[idx(1, 0, 0)] = 1;
  const ids = [idx(1, 0, 0)];
  const E = H.energy(idx(1, 0, 0));
  const ro = radialObservables(re, im, ids, E);
  console.log(`Z = ${Z}:  E = ${E.toFixed(8)} (exact ${(-Z*Z/2).toFixed(8)})`);
  console.log(`   lab <1/r> = ${ro.rinv.toFixed(8)}   exact ${Z.toFixed(8)}`);
  console.log(`   lab <r>   = ${ro.r.toFixed(8)}   exact ${(1.5/Z).toFixed(8)}`);
  console.log(`   lab <V>   = ${ro.V.toFixed(8)}   exact ${(-Z*Z).toFixed(8)}`);
  console.log(`   lab <T>   = ${ro.T.toFixed(8)}   exact ${(Z*Z/2).toFixed(8)}    <-- NEGATIVE?  ${ro.T < 0}`);
  console.log(`   lab virial row 2<T>+<V> = ${(2*ro.T + ro.V).toFixed(8)}   law says 0   RESIDUAL = ${(2*ro.T+ro.V).toFixed(6)}`);
}

console.log('\n=== (3) radialDipole cache: is it Z-blind? (order-dependence test) ===');
// exact <1s|z|2p0> at charge Z = (128 sqrt2/243)/Z
const EXACT = 128*Math.SQRT2/243;
console.log('exact <1s|z|2p0> at charge Z = (128*sqrt2/243)/Z =', EXACT.toFixed(10), '/ Z');
// fresh process ordering A: Z=1 first, then Z=2
for (const Z of [1, 2, 3]) {
  setHamiltonian('hydrogen'); setZ(Z);
  const v = radialDipole(1, 0, 2, 1);
  console.log(`   after setZ(${Z}) in the order 1,2,3:  radialDipole(1s,2p) = ${v.toFixed(10)}   exact ${(EXACT*Math.sqrt(3)/Z).toFixed(10)} (radial part; ratio ${(v/(EXACT*Math.sqrt(3)/Z)).toFixed(6)})`);
}
console.log('   (a ratio that stays 1.000 at Z=1 and drifts to Z at higher Z is the frozen cache)');

console.log('\n=== (4) the CALCULUS table as the window would print it, Z = 2, 1s+2p0 ===');
for (const Z of [1, 2]) {
  setHamiltonian('hydrogen'); setZ(Z);
  const R = new Register();
  R.setEnergies((a) => getHamiltonian().energy(a));
  R.clear(); R.set(idx(1,0,0), 0.6, 0); R.set(idx(2,1,0), 0.8, 0); R.normalize();
  const S = stats(R, 0.7);
  console.log(`Z = ${Z}`);
  for (const r of S.rows) console.log(`   ${String(r.name).padEnd(14)} value=${Number(r.value).toFixed(8).padStart(14)}  predicted=${r.predicted === undefined ? '-' : Number(r.predicted).toFixed(8).padStart(14)}  residual=${r.residual === undefined ? '-' : Number(r.residual).toExponential(3)}   [${r.formula || ''}]`);
}
setZ(1);
