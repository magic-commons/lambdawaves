/* bf-r11-wall.mjs — Round 11 audit §7 and §9.
 *   §7  "in the box the residual IS the wall's force" — is it?  Compare
 *         (i)  d<p_z>/dt inside the register  = -sum c_a* c_b (E_a-E_b)^2 z_ab   [what CALCULUS prints]
 *         (ii) the TRUE hard-wall force  F_z = -(1/2) a^2 \oint |d(psi)/dr|^2 cos(theta) dOmega
 *              (independent: a surface integral, never a matrix element)
 *       For an infinite well R'_{nl}(a) = -N k j_{l+1}(z) with N^2 = 2/(a^3 j_{l+1}^2), so
 *       R'(a)^2 = 2 k^2 / a^3 exactly, and F_z = -(1/2) a^2 sum c_a*c_b R'_a R'_b A_ab
 *       with A_ab = <l'm'|cos th|lm> the SAME angular factor the dipole uses.
 *   §9  the DRAG toy: does it ever AMPLIFY, and what is the ground-state population doing?
 */
import { BASIS, energy as hEnergy } from '../../lab/hydrogen.js';
import { setHamiltonian, getHamiltonian } from '../../lab/hamiltonian.js';
import { wellZ, wellEnergyOf, wellPacket, setWellRadius, wellRadius } from '../../lab/well.js';
import { sphericalBessel } from '../../lab/bessel.js';
import { angularDipoleZ, dipoleZ } from '../../lab/dynamics.js';
import { momentumZ } from '../../lab/kick.js';
import { Register } from '../../lab/state.js';

const N = 91;
setHamiltonian('well'); setWellRadius(10);
const a = wellRadius();
const H = getHamiltonian();

/* the register's z matrix in the well, by radial quadrature (Simpson, 20000 panels) */
import { wellRadialFor } from '../../lab/well.js';
const ZCACHE = new Map();
function zrad(np, lp, n, l) {
  const k = `${np}:${lp}:${n}:${l}`; if (ZCACHE.has(k)) return ZCACHE.get(k);
  const M = 20000, h = a / M; let s = 0;
  for (let i = 0; i <= M; i++) { const r = i * h, w = (i === 0 || i === M) ? 1 : (i % 2 ? 4 : 2); s += w * wellRadialFor(np, lp, r) * wellRadialFor(n, l, r) * r * r * r; }
  const v = s * h / 3; ZCACHE.set(k, v); return v;
}
const zEl = (A, B) => { const ang = angularDipoleZ(A.l, A.m, B.l, B.m); return ang === 0 ? 0 : ang * zrad(A.n, A.l, B.n, B.l); };
/* R'(a) for the well: -N k j_{l+1}(z), with N^2 k^2 j_{l+1}^2 = 2 k^2 / a^3 */
const dR = (n, l) => { const z = wellZ(n, l), k = z / a, jn = sphericalBessel(l + 1, z), Nn = Math.sqrt(2 / (a * a * a * jn * jn)); return -Nn * k * jn; };

console.log('=== §7  THE WALL.  well radius a =', a, '===');
console.log('sanity: R\'(a)^2 should equal 2k^2/a^3 exactly');
for (const [n, l] of [[1,0],[2,1],[3,2],[6,0],[6,5]]) {
  const k = wellZ(n,l)/a, d = dR(n,l);
  console.log(`   |${n}${'spdfgh'[l]}> : R'(a)^2 = ${(d*d).toExponential(10)}   2k^2/a^3 = ${(2*k*k/(a*a*a)).toExponential(10)}`);
}

const P = wellPacket([0, 0, -4], [0, 0, 0.8], 1.6);
const ids = []; for (let q = 0; q < N; q++) if (Math.hypot(P.re[q], P.im[q]) > 1e-10) ids.push(q);
console.log(`\npacket: captured = ${P.captured.toFixed(6)}, ${ids.length} states populated`);

const R = new Register(); R.setEnergies((q) => H.energy(q)); R.clear();
for (const q of ids) R.set(q, P.re[q], P.im[q], 0);

function bothForces(t) {
  const c = R.at(t);
  let commutator = 0, surface = 0, n2 = 0;
  for (const q of ids) n2 += c.re[q] * c.re[q] + c.im[q] * c.im[q];
  for (const p of ids) for (const q of ids) {
    const A = BASIS[p], B = BASIS[q];
    const ang = angularDipoleZ(A.l, A.m, B.l, B.m); if (ang === 0) continue;
    const rr = c.re[p] * c.re[q] + c.im[p] * c.im[q];       // Re(c_p* c_q)
    const dE = H.energy(p) - H.energy(q);
    commutator += -(dE * dE) * (ang * zrad(A.n, A.l, B.n, B.l)) * rr;
    surface   += -0.5 * a * a * dR(A.n, A.l) * dR(B.n, B.l) * ang * rr;
  }
  return { commutator: commutator / n2, surface: surface / n2, n2 };
}
console.log('\n   t     d<p_z>/dt  (register, -sum (dE)^2 z_ab)     F_z (SURFACE INTEGRAL, independent)      ratio       |diff|');
for (const t of [0, 1, 3, 6, 10, 14, 20]) {
  const b = bothForces(t);
  console.log(`${String(t).padStart(5)}   ${b.commutator.toExponential(12).padStart(22)}   ${b.surface.toExponential(12).padStart(22)}   ${(b.commutator/b.surface).toFixed(9)}   ${Math.abs(b.commutator-b.surface).toExponential(3)}`);
}
console.log('\n(if the ratio is 1 the CALCULUS residual really IS the wall force; anything else and it is the truncation)');

/* the same for a SINGLE eigenstate: both must be exactly 0 by parity/stationarity */
{
  const re = new Float64Array(N), im = new Float64Array(N); re[BASIS.findIndex(s=>s.n===2&&s.l===1&&s.m===0)] = 1;
  const R2 = new Register(); R2.setEnergies((q) => H.energy(q)); R2.clear(); R2.set(BASIS.findIndex(s=>s.n===2&&s.l===1&&s.m===0), 1, 0, 0);
  console.log('single eigenstate |2p0>: both sides must vanish (stationary, and the wall pressure is symmetric)');
}

/* ===================== §9  THE DRAG TOY ===================== */
console.log('\n=== §9  THE DRAG TOY ===');
setHamiltonian('hydrogen');
const i1s = BASIS.findIndex(s=>s.n===1&&s.l===0&&s.m===0), i2p = BASIS.findIndex(s=>s.n===2&&s.l===1&&s.m===0);
const D = new Register(); D.setEnergies(hEnergy ? (q)=>getHamiltonian().energy(q) : null); D.clear();
D.set(i1s, Math.SQRT1_2, 0, 0); D.set(i2p, Math.SQRT1_2, 0, 0);
D.damping = 0.1;
console.log('  gamma = 0.1, state = (|1s> + |2p0>)/sqrt2');
console.log('    t      |c_1s|^2      |c_2p|^2       norm^2      1s SHARE of norm    what real emission would give for |c_1s|^2');
for (const t of [0, 2, 5, 10, 20, 40]) {
  const c = D.at(t);
  const p1 = c.re[i1s]**2 + c.im[i1s]**2, p2 = c.re[i2p]**2 + c.im[i2p]**2;
  const real1s = 1 - p2;                    // a true two-level cascade conserves probability
  console.log(`  ${String(t).padStart(4)}   ${p1.toFixed(9)}   ${p2.toFixed(9)}   ${(p1+p2).toFixed(9)}   ${(p1/(p1+p2)).toFixed(9)}          ${real1s.toFixed(9)}`);
}
console.log(`  check: |c_2p|^2 at t = 10 vs e^{-0.75} = ${Math.exp(-0.75).toFixed(12)} (times the initial 0.5)`);
{
  const c = D.at(10); console.log(`     lab: ${(c.re[i2p]**2+c.im[i2p]**2).toFixed(12)}   0.5*e^{-0.75} = ${(0.5*Math.exp(-0.75)).toFixed(12)}`);
}
console.log('\n  DOES IT AMPLIFY?  the exponent is gamma*(Ediag(a) - E[0]) with Ediag = E_a + Bz*m/2 but E[0] UNSHIFTED.');
const B_TEST = [0.05, 0.1, 0.2, 0.5];
for (const B of B_TEST) {
  let worst = 0, where = null;
  for (let q = 0; q < N; q++) { const e = hEnergyOfIdx(q) + B * BASIS[q].m / 2 - hEnergyOfIdx(0); if (e < worst) { worst = e; where = BASIS[q].id; } }
  console.log(`   Bz = ${B}: min over the register of (Ediag(a) - E[0]) = ${worst.toFixed(6)} at ${where}  -> g = e^{-g*(that)*t} > 1 (AMPLIFIES): ${worst < -1e-12}`);
}
function hEnergyOfIdx(q) { return -0.5 / (BASIS[q].n * BASIS[q].n); }
