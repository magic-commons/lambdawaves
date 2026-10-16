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
import { BASIS, radial, modeTable, orbitalFromTable } from './hydrogen.js';
import { getHamiltonian } from './hamiltonian.js';
import { sphericalBessel } from './bessel.js';
import { applyRotor } from './frontier.js';
import { angularDipoleZ, radialDipole } from './dynamics.js';
import { qhoTableFor, qhoFromTable } from './qho.js';

const N = 91, LMAX = 10;
export { sphericalBessel };                                   // lives in bessel.js (shared with the well; no import cycle)
/** Legendre P_L(x) for all L ≤ LMAX by the recurrence */
function legendreAll(x) { const P = new Float64Array(LMAX + 1); P[0] = 1; P[1] = x; for (let l = 1; l < LMAX; l++) P[l + 1] = ((2 * l + 1) * x * P[l] - l * P[l - 1]) / (l + 1); return P; }

/* ── the k-independent tables, built once — and, since wave 45, a row at a time inside a millisecond budget ──
 * The first bow used to pay for them on the pointer (127 ms measured: the angular table is 91 × 2001 orbital samples
 * and 637 m-matched pairs × 11 multipoles × 2001 points).  warmStep(ms) builds the same tables in slices, so the rack
 * can finish them in idle time after boot and the maths worker can build its own copy off the thread; buildTables()
 * is warmStep with no budget — every number is bit-identical whichever road built it. */
let ANG = null;          // ANG[a*N+b] = Float64Array(LMAX+1) of A_L(a,b), only for m_a = m_b
let RAD = null;          // { r, w, wr2, tab[a] = R_a(r_j) } on the log grid
const NR = 3000, R0 = 1e-5, R1 = 300;
const NT = 2000;
let W = null;            // the warm-up in progress: { theta, wT, PL, Th, a (next row), pairsA (next pair row), ang, radId, radRows, rad }
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
export function tablesReady() { const H = getHamiltonian(); return !!(ANG && RAD && RAD.id === H.id); }
function buildTables() { while (!warmStep(1e9)) { /* no budget: to the end */ } }
/** one slice of the build, at most ~budgetMs of wall; true when the tables for the Hamiltonian in force are ready */
export function warmStep(budgetMs = 8) {
  const H = getHamiltonian(), t0 = nowMs();
  if (ANG && RAD && RAD.id === H.id) return true;
  if (!W) W = { theta: null, wT: null, PL: null, Th: [], a: 0, pairsA: 0, ang: null, radId: null, radRows: 0, rad: null, radNL: null };
  const over = () => nowMs() - t0 >= budgetMs;
  if (!ANG) {
    if (!W.theta) {
      /* angular: Θ_a(θ) tabulated on a Simpson grid in x = cos θ (the integrand is a polynomial of degree ≤ 20) */
      W.theta = new Float64Array(NT + 1); W.wT = new Float64Array(NT + 1);
      for (let i = 0; i <= NT; i++) { const x = -1 + 2 * i / NT; W.theta[i] = Math.acos(Math.min(1, Math.max(-1, x))); W.wT[i] = ((i === 0 || i === NT) ? 1 : (i % 2 ? 4 : 2)) * (2 / NT) / 3; }
      W.PL = []; for (let i = 0; i <= NT; i++) W.PL.push(legendreAll(-1 + 2 * i / NT));
      if (over()) return false;
    }
    while (W.a < N) {                                                // the 91 rows Θ_a
      const s = BASIS[W.a], T = modeTable(s.n, s.l, s.m);
      let r0 = 0.7; if (Math.abs(radial(s.n, s.l, r0)) < 1e-6) r0 = 1.3;
      const Rr = radial(s.n, s.l, r0), row = new Float64Array(NT + 1);
      for (let i = 0; i <= NT; i++) row[i] = orbitalFromTable(T, r0 * Math.sin(W.theta[i]), 0, r0 * Math.cos(W.theta[i])).re / Rr;
      W.Th.push(row); W.a++;
      if (over()) return false;
    }
    if (!W.ang) W.ang = new Array(N * N).fill(null);
    while (W.pairsA < N) {                                           // the pair rows A_L(a, b), m_a = m_b
      const a = W.pairsA;
      for (let b = 0; b < N; b++) {
        if (BASIS[a].m !== BASIS[b].m) continue;
        const A = new Float64Array(LMAX + 1);
        for (let L = 0; L <= LMAX; L++) { let s = 0; for (let i = 0; i <= NT; i++) s += W.wT[i] * W.Th[a][i] * W.Th[b][i] * W.PL[i][L]; A[L] = 2 * Math.PI * s; }
        W.ang[a * N + b] = A;
      }
      W.pairsA++;
      if (over()) return false;
    }
    ANG = W.ang; W.ang = null; W.Th = []; W.theta = null; W.wT = null; W.PL = null;
  }
  if (!RAD || RAD.id !== H.id) {
    if (W.radId !== H.id) {
      /* radial: R_a of the Hamiltonian IN FORCE on a log grid, Simpson weights in u = ln r with the Jacobian r folded in */
      const r = new Float64Array(NR + 1), w = new Float64Array(NR + 1), wr2 = new Float64Array(NR + 1), du = Math.log(R1 / R0) / NR;
      for (let j = 0; j <= NR; j++) { r[j] = R0 * Math.exp(j * du); w[j] = ((j === 0 || j === NR) ? 1 : (j % 2 ? 4 : 2)) * du / 3 * r[j]; wr2[j] = w[j] * r[j] * r[j]; }
      W.rad = { id: H.id, r, w, wr2, tab: [] }; W.radId = H.id; W.radRows = 0; W.radNL = new Map();
    }
    while (W.radRows < N) {
      /* 2026-09-24 · ONE ROW PER (n, l) (optimization LB6): a row is H.radial(n, l, r_j) and does not depend on m, so
         the 2l + 1 orbitals of a shell share one array — 21 row builds instead of 91, the same doubles. */
      const s = BASIS[W.radRows], key = s.n * 16 + s.l, r = W.rad.r;
      let row = W.radNL.get(key);
      if (!row) { row = new Float64Array(NR + 1); for (let j = 0; j <= NR; j++) row[j] = H.radial(s.n, s.l, r[j]); W.radNL.set(key, row); }
      W.rad.tab.push(row); W.radRows++;
      if (over() && W.radRows < N) return false;
    }
    RAD = W.rad; W.rad = null; W.radId = null; W.radNL = null;
  }
  W = null;
  return true;
}
/* 2026-09-24 · THE SAME MATRIX, SOONER (optimization LB6; AUDIT-F F13, REFUTE-A's wellPacket lead).  Two changes, both
 * bit-identical (tests: Object.is on every element and on the kicked register, every axis, several k, every
 * Hamiltonian): (1) the radial integral ∫ w r² R_a R_b j_L depends on (n_a, l_a, n_b, l_b, L) only — R is H.radial(n, l)
 * and m never enters it — so it is evaluated once per ordered key, by the same loop in the same order, and the 637
 * m-matched pairs reuse it; (2) the last matrix built is kept, keyed on (k, the radial table, the angular table), so a
 * repeated press of the same impulse — the K key, x, y or z (a kick along x or y is the z-boost between two rotors) —
 * does not rebuild it.  kickMatrixZ still hands every caller arrays of its own. */
const IKEYS = 7 * 6 * 7 * 6 * (LMAX + 1);                       // n ≤ 6, l ≤ 5, L ≤ LMAX
let MZ = null;                                                   // { k, rad, ang, re, im }: the last boost built (read-only)
function boostZ(k) {
  buildTables();
  if (MZ && MZ.k === k && MZ.rad === RAD && MZ.ang === ANG) return MZ;
  const re = new Float64Array(N * N), im = new Float64Array(N * N);
  if (k === 0) { for (let a = 0; a < N; a++) re[a * N + a] = 1; MZ = { k, rad: RAD, ang: ANG, re, im }; return MZ; }
  const J = []; for (let L = 0; L <= LMAX; L++) { const row = new Float64Array(NR + 1); for (let j = 0; j <= NR; j++) row[j] = sphericalBessel(L, k * RAD.r[j]); J.push(row); }
  const IL = [[1, 0], [0, 1], [-1, 0], [0, -1]];                 // i^L
  const Iv = new Float64Array(IKEYS), Ihave = new Uint8Array(IKEYS);
  for (let a = 0; a < N; a++) for (let b = a; b < N; b++) {
    const A = ANG[a * N + b]; if (!A) continue;
    let sr = 0, si = 0;
    const ra = RAD.tab[a], rb = RAD.tab[b], Ba = BASIS[a], Bb = BASIS[b];
    const lo = Math.abs(Ba.l - Bb.l), hi = Ba.l + Bb.l, base = (((Ba.n * 6 + Ba.l) * 7 + Bb.n) * 6 + Bb.l) * (LMAX + 1);
    for (let L = lo; L <= hi; L++) {
      if (Math.abs(A[L]) < 1e-14) continue;
      let I;
      if (Ihave[base + L]) I = Iv[base + L];
      else {
        I = 0; const jl = J[L];
        const wr2 = RAD.wr2; for (let j = 0; j <= NR; j++) I += wr2[j] * ra[j] * rb[j] * jl[j];
        Iv[base + L] = I; Ihave[base + L] = 1;
      }
      const v = (2 * L + 1) * A[L] * I, p = IL[L % 4];
      sr += v * p[0]; si += v * p[1];
    }
    re[a * N + b] = sr; im[a * N + b] = si;
    re[b * N + a] = sr; im[b * N + a] = si;                       // ⟨b|e^{ikz}|a⟩ = ⟨a|e^{ikz}|b⟩ (both real orbitals up to the shared e^{imφ}; symmetric)
  }
  MZ = { k, rad: RAD, ang: ANG, re, im };
  return MZ;
}
/** the boost matrix along z for impulse k: complex, block-diagonal in m.  { re, im } as N×N Float64Arrays (the caller's own) */
export function kickMatrixZ(k) {
  const M = boostZ(k);
  return { re: Float64Array.from(M.re), im: Float64Array.from(M.im) };
}
/** c ↦ M c in place */
export function applyKickZ(re, im, k) {
  const M = boostZ(k), or = new Float64Array(N), oi = new Float64Array(N);
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
/** the two rotations taking a unit direction d = (sinθcosφ, sinθsinφ, cosθ) onto ẑ: about z by −φ, then about y by −θ
    (for d = x̂ this is AXIS_TO_Z.x exactly; for d = ŷ it differs from AXIS_TO_Z.y by a rotation about ẑ, which commutes with the z-kick) */
export function rotorsToZ(d) {
  const n = Math.hypot(d[0], d[1], d[2]) || 1, z = d[2] / n;
  const theta = Math.acos(Math.max(-1, Math.min(1, z))), phi = Math.atan2(d[1], d[0]);
  return [{ axis: 'z', angle: -phi }, { axis: 'y', angle: -theta }];
}
/** a kick of impulse k along ANY unit direction d: R⁻¹ e^{ikz} R with R the rotations above */
export function applyKickAlong(re, im, k, d) {
  const n = Math.hypot(d[0], d[1], d[2]); if (n === 0 || k === 0) return;
  const R = rotorsToZ([d[0] / n, d[1] / n, d[2] / n]);
  for (const r of R) applyRotor(re, im, { which: 'both', axis: r.axis, angle: r.angle });
  applyKickZ(re, im, k);
  for (const r of [...R].reverse()) applyRotor(re, im, { which: 'both', axis: r.axis, angle: -r.angle });
}
/** ⟨p_z⟩ by Heisenberg, p_z = i[H, z]: ⟨a|p_z|b⟩ = i(E_a − E_b)⟨a|z|b⟩ — exact within the register, per unit norm */
export function momentumZ(re, im, ids) {
  const list = ids || BASIS.map((s) => s.index);
  let s = 0, n2 = 0;
  for (const a of list) n2 += re[a] * re[a] + im[a] * im[a];
  for (const a of list) for (const b of list) {
    const A = BASIS[a], B = BASIS[b], ang = angularDipoleZ(A.l, A.m, B.l, B.m);
    if (ang === 0) continue;
    const z = ang * radialDipole(A.n, A.l, B.n, B.l), dE = getHamiltonian().energy(a) - getHamiltonian().energy(b);
    /* Re[ c_a* · i dE z · c_b ] = −dE z · Im(c_a* c_b) */
    s += -dE * z * (re[a] * im[b] - im[a] * re[b]);
  }
  return n2 > 0 ? s / n2 : 0;
}
/** how much of the state the slap knocked out of the register */
export function escaped(norm2Before, norm2After) { return norm2Before > 0 ? 1 - norm2After / norm2Before : 0; }
/* THE SQUEEZE (0.8.0 G2), the OSCILLATOR's: S(r) = e^{r(a_z² − a_z†²)/2}, (Sψ)(x, y, z) = e^{r/2} ψ(x, y, e^r z), so Var(z) ↦ e^{−2r} Var(z).  At fixed ρ a register
 * orbital is a polynomial of degree ≤ 10 in z times e^{−z²/2}, EXACTLY in span{h_0 … h_10(z)}: P_a[n](ρ) is built once (trapezoid in z and in u, ρ = ln(1 + e^u)),
 * S_ab = 2π∫ρdρ Σ P_a[n] S1[n][n′] P_b[n′] with S1 = ⟨n|S|n′⟩ of the infinite operator — unitary on the product basis h_n ⊗ (2-D oscillator), not on n ≤ 6: `escaped` reads the loss. */
export const SQUEEZE_REFUSAL = 'OSCILLATOR only: a squeeze needs the ladder a_z of −½∇² + ½r², which a Coulomb, a well or an atom does not have', SQUEEZE = { said: '' };   // said: METERS' line
const SZ = Float64Array.from({ length: 121 }, (_, k) => (k - 60) * 0.15), NU = 120, RU = Array.from({ length: NU }, (_, j) => -14 + j * 0.2), RHO = RU.map((u) => Math.log1p(Math.exp(u))), WR = RU.map((u, j) => RHO[j] * 0.2 / (1 + Math.exp(-u)));
const hermite = (zs, nmax) => { const H = [zs.map((z) => Math.PI ** -0.25 * Math.exp(-z * z / 2))]; for (let n = 0; n < nmax; n++) H.push(zs.map((z, k) => Math.sqrt(2 / (n + 1)) * z * H[n][k] - (n ? Math.sqrt(n / (n + 1)) * H[n - 1][k] : 0))); return H; };
/** ⟨n|S(r)|n′⟩ for n, n′ ≤ nmax: e^{r/2} ∫ h_n(z) h_n′(e^r z) dz on the grid zs */
export function squeeze1D(r, nmax = 10, zs = SZ) { const A = hermite(zs, nmax), B = hermite(zs.map((z) => z * Math.exp(r)), nmax), f = (zs[1] - zs[0]) * Math.exp(r / 2); return A.map((a) => B.map((b) => f * a.reduce((s, v, k) => s + v * b[k], 0))); }
let SQP = null, SQM = null;   // the r-independent projections; the last S(r) built
export function squeezeMatrix(r) {
  if (SQM && SQM.r === r) return SQM.M;
  if (!SQP) { const H = hermite(SZ, 10); SQP = BASIS.map((s) => { const T = qhoTableFor(s), P = H.map(() => new Float64Array(NU)); for (let j = 0; j < NU; j++) for (let k = 0; k < SZ.length; k++) { const f = qhoFromTable(T, RHO[j], 0, SZ[k]).re * 0.15; for (let n = 0; n <= 10; n++) P[n][j] += H[n][k] * f; } return P; }); }
  const S1 = squeeze1D(r), M = new Float64Array(N * N), Q = SQP.map((P) => S1.map((row) => P[0].map((_, j) => row.reduce((s, v, p) => s + v * P[p][j], 0))));
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (BASIS[a].m === BASIS[b].m) { let s = 0; for (let j = 0; j < NU; j++) for (let n = 0; n <= 10; n++) s += WR[j] * SQP[a][n][j] * Q[b][n][j]; M[a * N + b] = 2 * Math.PI * s; }
  SQM = { r, M }; return M; }
/** c ↦ S(r) c in place along an axis (x and y: the z-squeeze between the slap's rotors); REFUSED off the OSCILLATOR */
export function applySqueeze(re, im, r, axis = 'z') {
  if (getHamiltonian().id !== 'qho') throw new Error(SQUEEZE_REFUSAL);
  const R = AXIS_TO_Z[axis], M = squeezeMatrix(r), turn = (s) => R && applyRotor(re, im, { which: 'both', axis: R.axis, angle: s * R.angle });
  turn(1); const c = [Float64Array.from(re), Float64Array.from(im)];
  for (const [i, out] of [re, im].entries()) for (let a = 0; a < N; a++) { let s = 0; for (let b = 0; b < N; b++) s += M[a * N + b] * c[i][b]; out[a] = s; }
  turn(-1); }
