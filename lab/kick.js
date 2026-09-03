/* kick.js — the SLAP: a sudden momentum impulse on the electron, exactly.
 *
 * STATUS: EXACT operator, NUMERICAL matrix elements (1-D quadratures), with the truncation reported as physics.
 *
 * A sudden impulse k is the unitary  ψ ↦ e^{i k·x} ψ  (a boost: φ(p) ↦ φ(p − k)).  It is also exactly what a
 * delta-pulse electric field does — Δp = −∫E dt — so the slap is the impulsive Stark limit, and the "magnetic slap"
 * is a rotation of the state, which the rotor drive already is.  On the register the boost becomes the matrix
 *
 *     M_ab = ⟨a| e^{ikz} |b⟩ = Σ_L i^L (2L+1) · A_L(a,b) · ∫ R_a R_b j_L(kr) r² dr,
 *     A_L(a,b) = 2π δ_{m_a m_b} ∫ Θ_a Θ_b P_L(cos θ) sin θ dθ,
 *
 * (the plane wave's multipole expansion), so every element is a k-independent angular integral times a radial
 * integral, both one-dimensional.  The boost is unitary on the full Hilbert space but the register holds only
 * n ≤ 6, so |Mc|² < |c|²: the lost norm is the probability the electron was knocked out of the first six shells
 * or ionised — reported, never renormalised away ("cull the observation, never the state").  After the slap the
 * state is a superposition and JIGGLES by the exact evolution; the dipole shows the ringing.
 *
 * A kick along x or y is the z-kick conjugated by a spatial rotation: R⁻¹ e^{ikz} R = e^{i k (R⁻¹ẑ)·x}.
 */
import { BASIS, radial, modeTable, orbitalFromTable, energy } from './hydrogen.js';
import { applyRotor } from './frontier.js';
import { angularDipoleZ, radialDipole } from './dynamics.js';

const N = 91, LMAX = 10;
/** spherical Bessel j_L(x) for L ≤ 12: series near zero, upward recurrence for x > L, Miller's downward otherwise */
export function sphericalBessel(L, x) {
  if (x < 1e-6) { let s = 1; for (let i = 1; i <= L; i++) s *= x / (2 * i + 1); return s; }
  const j0 = Math.sin(x) / x;
  if (L === 0) return j0;
  const j1 = j0 / x - Math.cos(x) / x;
  if (L === 1) return j1;
  if (x > L + 1) { let a = j0, b = j1; for (let l = 1; l < L; l++) { const c = (2 * l + 1) / x * b - a; a = b; b = c; } return b; }
  const start = L + 30 + Math.ceil(x);                          // Miller: downward from a high order, then scale by j0
  let b = 0, a = 1e-300, out = 0;
  for (let l = start; l >= 1; l--) { const c = (2 * l + 1) / x * a - b; b = a; a = c; if (l - 1 === L) out = c; if (Math.abs(a) > 1e250) { a *= 1e-250; b *= 1e-250; out *= 1e-250; } }
  return out * j0 / a;                                           // a now holds the unnormalised j_0
}
/** Legendre P_L(x) for all L ≤ LMAX by the recurrence */
function legendreAll(x) { const P = new Float64Array(LMAX + 1); P[0] = 1; P[1] = x; for (let l = 1; l < LMAX; l++) P[l + 1] = ((2 * l + 1) * x * P[l] - l * P[l - 1]) / (l + 1); return P; }

/* ── the k-independent tables, built once ─────────────────────────────────── */
let ANG = null;          // ANG[a*N+b] = Float64Array(LMAX+1) of A_L(a,b), only for m_a = m_b
let RAD = null;          // { r, w, tab[a] = R_a(r_j) } on the log grid
const NR = 3000, R0 = 1e-5, R1 = 300;
function buildTables() {
  if (ANG) return;
  /* angular: Θ_a(θ) tabulated on a Simpson grid in x = cos θ (the integrand is a polynomial of degree ≤ 20) */
  const NT = 2000, theta = new Float64Array(NT + 1), Th = [];
  const wT = new Float64Array(NT + 1);
  for (let i = 0; i <= NT; i++) { const x = -1 + 2 * i / NT; theta[i] = Math.acos(Math.min(1, Math.max(-1, x))); wT[i] = ((i === 0 || i === NT) ? 1 : (i % 2 ? 4 : 2)) * (2 / NT) / 3; }
  const PL = []; for (let i = 0; i <= NT; i++) PL.push(legendreAll(-1 + 2 * i / NT));
  for (let a = 0; a < N; a++) {
    const s = BASIS[a], T = modeTable(s.n, s.l, s.m);
    let r0 = 0.7; if (Math.abs(radial(s.n, s.l, r0)) < 1e-6) r0 = 1.3;
    const Rr = radial(s.n, s.l, r0), row = new Float64Array(NT + 1);
    for (let i = 0; i <= NT; i++) row[i] = orbitalFromTable(T, r0 * Math.sin(theta[i]), 0, r0 * Math.cos(theta[i])).re / Rr;
    Th.push(row);
  }
  ANG = new Array(N * N).fill(null);
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    if (BASIS[a].m !== BASIS[b].m) continue;
    const A = new Float64Array(LMAX + 1);
    for (let L = 0; L <= LMAX; L++) { let s = 0; for (let i = 0; i <= NT; i++) s += wT[i] * Th[a][i] * Th[b][i] * PL[i][L]; A[L] = 2 * Math.PI * s; }
    ANG[a * N + b] = A;
  }
  /* radial: R_a on a log grid, Simpson weights in u = ln r with the Jacobian r folded in */
  const r = new Float64Array(NR + 1), w = new Float64Array(NR + 1), du = Math.log(R1 / R0) / NR;
  for (let j = 0; j <= NR; j++) { r[j] = R0 * Math.exp(j * du); w[j] = ((j === 0 || j === NR) ? 1 : (j % 2 ? 4 : 2)) * du / 3 * r[j]; }
  const tab = [];
  for (let a = 0; a < N; a++) { const s = BASIS[a], row = new Float64Array(NR + 1); for (let j = 0; j <= NR; j++) row[j] = radial(s.n, s.l, r[j]); tab.push(row); }
  RAD = { r, w, tab };
}
/** the boost matrix along z for impulse k: complex, block-diagonal in m.  { re, im } as N×N Float64Arrays */
export function kickMatrixZ(k) {
  buildTables();
  const re = new Float64Array(N * N), im = new Float64Array(N * N);
  if (k === 0) { for (let a = 0; a < N; a++) re[a * N + a] = 1; return { re, im }; }
  const J = []; for (let L = 0; L <= LMAX; L++) { const row = new Float64Array(NR + 1); for (let j = 0; j <= NR; j++) row[j] = sphericalBessel(L, k * RAD.r[j]); J.push(row); }
  const IL = [[1, 0], [0, 1], [-1, 0], [0, -1]];                 // i^L
  for (let a = 0; a < N; a++) for (let b = a; b < N; b++) {
    const A = ANG[a * N + b]; if (!A) continue;
    let sr = 0, si = 0;
    const ra = RAD.tab[a], rb = RAD.tab[b];
    const lo = Math.abs(BASIS[a].l - BASIS[b].l), hi = BASIS[a].l + BASIS[b].l;
    for (let L = lo; L <= hi; L++) {
      if (Math.abs(A[L]) < 1e-14) continue;
      let I = 0; const jl = J[L];
      for (let j = 0; j <= NR; j++) I += RAD.w[j] * ra[j] * rb[j] * jl[j] * RAD.r[j] * RAD.r[j];
      const v = (2 * L + 1) * A[L] * I, p = IL[L % 4];
      sr += v * p[0]; si += v * p[1];
    }
    re[a * N + b] = sr; im[a * N + b] = si;
    re[b * N + a] = sr; im[b * N + a] = si;                       // ⟨b|e^{ikz}|a⟩ = ⟨a|e^{ikz}|b⟩ (both real orbitals up to the shared e^{imφ}; symmetric)
  }
  return { re, im };
}
/** c ↦ M c in place */
export function applyKickZ(re, im, k) {
  const M = kickMatrixZ(k), or = new Float64Array(N), oi = new Float64Array(N);
  for (let a = 0; a < N; a++) {
    let sr = 0, si = 0;
    for (let b = 0; b < N; b++) { const mr = M.re[a * N + b], mi = M.im[a * N + b]; if (mr === 0 && mi === 0) continue; sr += mr * re[b] - mi * im[b]; si += mr * im[b] + mi * re[b]; }
    or[a] = sr; oi[a] = si;
  }
  re.set(or); im.set(oi);
}
/** rotations taking the axis to z, so that R⁻¹ e^{ikz} R kicks along the axis (sign fixed by the momentum oracle in the tests) */
export const AXIS_TO_Z = { z: null, x: { axis: 'y', angle: -Math.PI / 2 }, y: { axis: 'x', angle: Math.PI / 2 } };
export function applyKick(re, im, k, axis = 'z') {
  const R = AXIS_TO_Z[axis];
  if (!R) return applyKickZ(re, im, k);
  applyRotor(re, im, { which: 'both', axis: R.axis, angle: R.angle });
  applyKickZ(re, im, k);
  applyRotor(re, im, { which: 'both', axis: R.axis, angle: -R.angle });
}
/** ⟨p_z⟩ by Heisenberg, p_z = i[H, z]: ⟨a|p_z|b⟩ = i(E_a − E_b)⟨a|z|b⟩ — exact within the register, per unit norm */
export function momentumZ(re, im, ids) {
  const list = ids || BASIS.map((s) => s.index);
  let s = 0, n2 = 0;
  for (const a of list) n2 += re[a] * re[a] + im[a] * im[a];
  for (const a of list) for (const b of list) {
    const A = BASIS[a], B = BASIS[b], ang = angularDipoleZ(A.l, A.m, B.l, B.m);
    if (ang === 0) continue;
    const z = ang * radialDipole(A.n, A.l, B.n, B.l), dE = energy(A.n) - energy(B.n);
    /* Re[ c_a* · i dE z · c_b ] = −dE z · Im(c_a* c_b) */
    s += -dE * z * (re[a] * im[b] - im[a] * re[b]);
  }
  return n2 > 0 ? s / n2 : 0;
}
/** how much of the state the slap knocked out of the register */
export function escaped(norm2Before, norm2After) { return norm2Before > 0 ? 1 - norm2After / norm2Before : 0; }
