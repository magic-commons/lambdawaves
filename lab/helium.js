/* helium.js — HELIUM, the first many-body atom, the hard way: Hylleraas's variational ground state in (s, t, u).
 *
 * STATUS: EXACT integrals (algebraic — every matrix element is a finite sum of factorials), VARIATIONAL energy
 * (a rigorous upper bound on the true ground state −2.903724 hartree), KNOWN anchors at every basis size.
 *
 * Two electrons, a nucleus of charge 2, H = −½∇₁² − ½∇₂² − 2/r₁ − 2/r₂ + 1/r₁₂.  Hylleraas (1929) wrote the
 * S-state wavefunction in s = r₁ + r₂, t = r₁ − r₂, u = r₁₂ and expanded ψ = e^{−ζs} Σ c_k s^a t^b u^c (b even,
 * for the exchange symmetry of the singlet).  In these coordinates the volume element is ∝ u(s²−t²) ds dt du, the
 * potential is V·u(s²−t²) = −8su + (s²−t²), and the kinetic energy is the functional
 *     ⟨T⟩ = ∫ [ u(s²−t²)(ψ_s² + ψ_t² + ψ_u²) + 2s(u²−t²)ψ_sψ_u + 2t(s²−u²)ψ_tψ_u ] ds dt du
 * (no ½: a single term e^{−ζs} gives ⟨T⟩ = ζ², two electrons of ζ²/2 each).  Every integral that appears is
 *     ∫₀^∞ ds e^{−2ζs} ∫₀^s du ∫₋u^u dt  s^a t^b u^c  =  [2/(b+1)] · [1/(b+c+2)] · (a+b+c+2)! / (2ζ)^{a+b+c+3}
 * so the whole problem is polynomial algebra plus a small generalised eigenproblem.  Anchors (KNOWN):
 *     1 term  {1}                  E = ζ² − 27ζ/8, ζ = 27/16 → −2.847656
 *     3 terms {1, u, t²}           −2.90243  (Hylleraas 1929)
 *     6 terms {1, u, t², s, s², u²} −2.90324
 *     exact                        −2.903724
 *
 * WHAT THIS BUYS THE INSTRUMENT.  ψ(x₁, x₂) is a genuinely entangled two-electron state.  Fix electron 1 at a
 * point and the CONDITIONAL amplitude ψ(x₂ | x₁) is a closed-form function of x₂ — s = r₁ + r₂, t = r₁ − r₂,
 * u = |x₂ − x₁| — which the kernel can draw with one Mode per Hylleraas term.  The SHAPE of that picture is the
 * Born rule with no interpretation added (the displayed brightness is normalised to the frame's ρmax, a rendering
 * choice, so it does not track the true conditional normalisation as x₁ moves — Round 11 B2): electron 2's cloud moves as electron 1 is placed, which is electron correlation made
 * visible, and the Kato cusp (∂ψ/∂u = ψ/2 at u = 0) is the two electrons feeling each other.
 */

/* ── polynomials in (s, t, u): Map 'a,b,c' → coefficient ─────────────────── */
const key = (a, b, c) => a + ',' + b + ',' + c;
const unkey = (k) => k.split(',').map(Number);
function padd(P, k, v) { P.set(k, (P.get(k) || 0) + v); }
function pmul(P, Q) { const R = new Map(); for (const [k1, v1] of P) for (const [k2, v2] of Q) { const [a1, b1, c1] = unkey(k1), [a2, b2, c2] = unkey(k2); padd(R, key(a1 + a2, b1 + b2, c1 + c2), v1 * v2); } return R; }
function pscale(P, f) { const R = new Map(); for (const [k, v] of P) R.set(k, v * f); return R; }
function psum(...Ps) { const R = new Map(); for (const P of Ps) for (const [k, v] of P) padd(R, k, v); return R; }
const mono = (a, b, c, v = 1) => new Map([[key(a, b, c), v]]);
/** ∂/∂s, ∂/∂t, ∂/∂u of P·e^{−ζs}, returned as the polynomial factor (the e^{−ζs} stays implicit) */
function dS(P, zeta) { const R = new Map(); for (const [k, v] of P) { const [a, b, c] = unkey(k); if (a > 0) padd(R, key(a - 1, b, c), a * v); padd(R, key(a, b, c), -zeta * v); } return R; }
function dT(P) { const R = new Map(); for (const [k, v] of P) { const [a, b, c] = unkey(k); if (b > 0) padd(R, key(a, b - 1, c), b * v); } return R; }
function dU(P) { const R = new Map(); for (const [k, v] of P) { const [a, b, c] = unkey(k); if (c > 0) padd(R, key(a, b, c - 1), c * v); } return R; }
const FACT = [1]; for (let i = 1; i <= 40; i++) FACT[i] = FACT[i - 1] * i;
/** ∫₀^∞ ds e^{−2ζs} ∫₀^s du ∫₋u^u dt s^a t^b u^c  (zero for odd b) */
export function monomialIntegral(a, b, c, zeta) {
  if (b % 2) return 0;
  const n = a + b + c + 2;
  return 2 / (b + 1) / (b + c + 2) * FACT[n] / Math.pow(2 * zeta, n + 1);
}
function integrate(P, zeta) { let s = 0; for (const [k, v] of P) { const [a, b, c] = unkey(k); s += v * monomialIntegral(a, b, c, zeta); } return s; }
const WEIGHT = psum(mono(2, 0, 1), mono(0, 2, 1, -1));                 // u(s² − t²)
const VPOT = psum(mono(1, 0, 1, -8), mono(2, 0, 0), mono(0, 2, 0, -1)); // V · u(s²−t²) = −8su + s² − t²

/** the Hylleraas matrices for basis terms [[a,b,c], …] at exponent ζ: S, T, V (all symmetric) */
export function hylleraasMatrices(terms, zeta) {
  const n = terms.length, P = terms.map(([a, b, c]) => mono(a, b, c));
  const Ps = P.map((p) => dS(p, zeta)), Pt = P.map(dT), Pu = P.map(dU);
  const S = [], T = [], V = [];
  const A = psum(mono(1, 0, 2), mono(1, 2, 0, -1));   // s(u² − t²)
  const B = psum(mono(2, 1, 0), mono(0, 1, 2, -1));   // t(s² − u²)
  for (let i = 0; i < n; i++) { S.push([]); T.push([]); V.push([]); for (let j = 0; j < n; j++) {
    S[i][j] = integrate(pmul(WEIGHT, pmul(P[i], P[j])), zeta);
    V[i][j] = integrate(pmul(VPOT, pmul(P[i], P[j])), zeta);
    const kin = psum(
      pmul(WEIGHT, psum(pmul(Ps[i], Ps[j]), pmul(Pt[i], Pt[j]), pmul(Pu[i], Pu[j]))),
      pmul(A, psum(pmul(Ps[i], Pu[j]), pmul(Pu[i], Ps[j]))),
      pmul(B, psum(pmul(Pt[i], Pu[j]), pmul(Pu[i], Pt[j]))));
    T[i][j] = integrate(kin, zeta);
  } }
  return { S, T, V };
}
/* ── a small symmetric eigen-solver (Jacobi) and the generalised problem H c = E S c ───────────────────── */
function jacobi(M) {
  const n = M.length, A = M.map((r) => r.slice()), Vv = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if (off < 1e-30) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = Vv[k][p], vkq = Vv[k][q]; Vv[k][p] = c * vkp - s * vkq; Vv[k][q] = s * vkp + c * vkq; }
    }
  }
  return { values: A.map((r, i) => r[i]), vectors: Vv };   // vectors[k][i] = component k of eigenvector i
}
function cholesky(S) { const n = S.length, L = S.map(() => new Array(n).fill(0)); for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) { let s = S[i][j]; for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k]; L[i][j] = i === j ? Math.sqrt(s) : s / L[j][j]; } return L; }
function solveLower(L, b) { const n = L.length, x = new Array(n); for (let i = 0; i < n; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * x[k]; x[i] = s / L[i][i]; } return x; }
/** the lowest generalised eigenpair of (T + V) c = E S c */
export function hylleraasSolve(terms, zeta) {
  const { S, T, V } = hylleraasMatrices(terms, zeta), n = terms.length;
  const H = T.map((r, i) => r.map((v, j) => v + V[i][j]));
  const L = cholesky(S);
  /* C = L⁻¹ H L⁻ᵀ */
  const HLt = H.map((row) => solveLower(L, row));                      // (L⁻¹ Hᵀ)ᵀ rows … H symmetric: L⁻¹ H
  const C = Array.from({ length: n }, (_, i) => new Array(n));
  for (let j = 0; j < n; j++) { const col = solveLower(L, HLt.map((r) => r[j])); for (let i = 0; i < n; i++) C[i][j] = col[i]; }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) C[i][j] = (C[i][j] + C[j][i]) / 2;
  const eig = jacobi(C);
  let best = 0; for (let i = 1; i < n; i++) if (eig.values[i] < eig.values[best]) best = i;
  const y = eig.vectors.map((row) => row[best]);
  /* c = L⁻ᵀ y */
  const c = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= L[k][i] * c[k]; c[i] = s / L[i][i]; }
  const norm2 = c.reduce((acc, ci, i) => acc + ci * c.reduce((a2, cj, j) => a2 + cj * S[i][j], 0), 0);
  const cn = c.map((v) => v / Math.sqrt(norm2));
  return { E: eig.values[best], c: cn, zeta, terms, S, T, V };
}
/** optimise ζ by golden section for a basis */
export function hylleraas(terms, zlo = 1.2, zhi = 2.6) {
  const gr = (Math.sqrt(5) - 1) / 2; let a = zlo, b = zhi, c = b - gr * (b - a), d = a + gr * (b - a);
  const E = (z) => hylleraasSolve(terms, z).E;
  for (let i = 0; i < 80; i++) { if (E(c) < E(d)) b = d; else a = c; c = b - gr * (b - a); d = a + gr * (b - a); }
  return hylleraasSolve(terms, (a + b) / 2);
}
export const BASES = {
  one: [[0, 0, 0]],
  three: [[0, 0, 0], [0, 0, 1], [0, 2, 0]],
  six: [[0, 0, 0], [0, 0, 1], [0, 2, 0], [1, 0, 0], [2, 0, 0], [0, 0, 2]],
  ten: [[0, 0, 0], [0, 0, 1], [0, 2, 0], [1, 0, 0], [2, 0, 0], [0, 0, 2], [1, 0, 1], [0, 2, 1], [3, 0, 0], [1, 2, 0]],
};
export const EXACT_E = -2.903724, KNOWN = { one: -2.847656, three: -2.90243, six: -2.90324 };
/** the 1-term closed form: E(ζ) = ζ² − 27ζ/8 */
export const oneTermEnergy = (zeta) => zeta * zeta - 27 * zeta / 8;
/** ψ(x₁, x₂) of a solution, unnormalised in ℝ⁶ but consistent between points (the kernel normalises to ρmax) */
export function psiPair(sol, x1, x2) {
  const r1 = Math.hypot(...x1), r2 = Math.hypot(...x2), u = Math.hypot(x1[0] - x2[0], x1[1] - x2[1], x1[2] - x2[2]);
  const s = r1 + r2, t = r1 - r2;
  let v = 0; for (let k = 0; k < sol.terms.length; k++) { const [a, b, c] = sol.terms[k]; v += sol.c[k] * Math.pow(s, a) * Math.pow(t, b) * Math.pow(u, c); }
  return v * Math.exp(-sol.zeta * s);
}
/** the Kato cusp at coalescence: ∂ψ/∂u / ψ at u = 0 should be ½ */
export function cuspRatio(sol) {
  let num = 0, den = 0;
  for (let k = 0; k < sol.terms.length; k++) { const [a, b, c] = sol.terms[k]; if (a === 0 && b === 0) { if (c === 1) num += sol.c[k]; if (c === 0) den += sol.c[k]; } }
  return den !== 0 ? num / den : NaN;
}
/**
 * the FIELD modes of the conditional amplitude ψ(x | x₁): one record per term — nlm = (a, b, c, ζ), c = (coef, 0, 1, 0),
 * ctr = x₁; the kernel's branch computes s, t, u itself.  The overall scale is the kernel's business (ρmax).
 */
export function conditionalModes(sol, x1) {
  return sol.terms.map(([a, b, c], k) => ({ table: { n: a, l: b, am: c, m: sol.zeta, norm: 1, lag: new Float64Array(6), leg: new Float64Array(6), pair: true }, re: sol.c[k], im: 0, center: x1 }));
}
