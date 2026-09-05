/* momentum.js — hydrogen in MOMENTUM space, exactly.  Atomic units, Z = 1.
 *
 * STATUS: EXACT ANALYTIC.  The momentum wavefunction of a bound state is the Fourier transform of the position
 * one, and for hydrogen it is closed-form (Podolsky & Pauling 1929):
 *
 *     φ_nlm(p) = (−i)^l · F_nl(p) · Y_lm(p̂),
 *     F_nl(p)  = N_nl · (np)^l / (n²p²+1)^{l+2} · C^{(l+1)}_{n−l−1}( (n²p²−1)/(n²p²+1) ),
 *     N_nl     = [ (2/π) (n−l−1)!/(n+l)! ]^{1/2} · n² · 2^{2l+2} · l!
 *
 * with C a Gegenbauer polynomial.  Writing t = n²p² and clearing the denominator, F takes the SAME shape the GPU
 * kernel already evaluates for position space — a polynomial times an envelope times a power —
 *
 *     F_nl(p) = N_nl · t^{l/2} · P_nl(t) / (1+t)^{n+1},     P_nl(t) = Σ_j c_j (t−1)^j (t+1)^{n−l−1−j}
 *
 * (P_nl has degree n−l−1 ≤ 5, so it fits the six-coefficient record), and only the envelope changes: e^{−ρ/2}
 * becomes (1+t)^{−(n+1)}.  The (−i)^l is a phase per mode and folds into the coefficient.
 *
 * FOCK (1935): with p₀ = 1/n the stereographic map ξ = (2p₀p, p₀²−p²)/(p₀²+p²) sends momentum space to the unit
 * S³, and φ_nlm(p) ∝ (p₀²+p²)² · Y_{n−1,l,m}(ξ): the whole shell is the space of hyperspherical harmonics of one
 * degree, on which SO(4) acts by RIGID rotation.  That is the hidden symmetry, made literal: the rotors that
 * reshape the position-space picture merely TURN the momentum-space one.  `fockPoint` gives ξ; the rotation gate
 * lives in the tests.
 */
import { factorial, ylmNorm, legendreDerivCoeffs, BASIS } from './hydrogen.js';

/** coefficients of the Gegenbauer polynomial C^{(λ)}_k(x) = Σ a_j x^j, by the three-term recurrence */
export function gegenbauerCoeffs(k, lambda) {
  if (k === 0) return [1];
  let c0 = [1], c1 = [0, 2 * lambda];
  for (let j = 2; j <= k; j++) {
    const c2 = new Array(j + 1).fill(0);
    for (let i = 0; i < c1.length; i++) c2[i + 1] += 2 * (j + lambda - 1) * c1[i] / j;
    for (let i = 0; i < c0.length; i++) c2[i] -= (j + 2 * lambda - 2) * c0[i] / j;
    c0 = c1; c1 = c2;
  }
  return c1;
}
const polyMul = (a, b) => { const o = new Array(a.length + b.length - 1).fill(0); for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) o[i + j] += a[i] * b[j]; return o; };
const polyPow = (a, k) => { let o = [1]; for (let i = 0; i < k; i++) o = polyMul(o, a); return o; };
/** P_nl(t) = Σ_j c_j (t−1)^j (t+1)^{k−j}, k = n−l−1: the numerator polynomial in t = n²p² */
export function momentumPoly(n, l) {
  const k = n - l - 1, c = gegenbauerCoeffs(k, l + 1);
  const out = new Array(k + 1).fill(0);
  for (let j = 0; j <= k; j++) {
    const term = polyMul(polyPow([-1, 1], j), polyPow([1, 1], k - j));
    for (let i = 0; i < term.length; i++) out[i] += c[j] * term[i];
  }
  return out;
}
export function momentumNorm(n, l) {
  return Math.sqrt(2 / Math.PI * factorial(n - l - 1) / factorial(n + l)) * n * n * Math.pow(2, 2 * l + 2) * factorial(l);
}
/** F_nl(p): the radial momentum function, real, normalised as ∫ F² p² dp = 1 */
export function momentumRadial(n, l, p) {
  const t = n * n * p * p, P = momentumPoly(n, l);
  let s = 0, tp = 1; for (let j = 0; j < P.length; j++) { s += P[j] * tp; tp *= t; }
  return momentumNorm(n, l) * Math.pow(t, l / 2) * s / Math.pow(1 + t, n + 1);
}
/**
 * The momentum-space twin of hydrogen.js's modeTable: the same record shape, so the kernel needs only a different
 * envelope.  `lag` holds P_nl in t = n²p²; `norm` folds N_nl, the angular norm and the Condon–Shortley sign;
 * `phase` is (−i)^l as a complex number, to be folded into the coefficient.
 */
export function momentumTable(n, l, m) {
  const am = Math.abs(m);
  const leg = legendreDerivCoeffs(l, am);
  const sign = (m >= 0 && (am % 2 === 1)) ? -1 : 1;
  const norm = sign * momentumNorm(n, l) * ylmNorm(l, am);
  const pad = (a) => { const out = new Float64Array(6); for (let i = 0; i < a.length && i < 6; i++) out[i] = a[i]; return out; };
  const ph = [[1, 0], [0, -1], [-1, 0], [0, 1]][l % 4];            // (−i)^l
  return { n, l, m, am, norm, lag: pad(momentumPoly(n, l)), leg: pad(leg), phase: { re: ph[0], im: ph[1] }, space: 'p' };
}
/** φ_nlm(p) from its table, INCLUDING the (−i)^l phase — the CPU twin of the momentum branch of the kernel */
export function momentumFromTable(T, px, py, pz) {
  const p = Math.hypot(px, py, pz);
  const ct = p < 1e-300 ? 1 : pz / p;
  const st = Math.sqrt(Math.max(0, 1 - ct * ct));
  const phi = Math.atan2(py, px);
  const t = T.n * T.n * p * p;
  let L = 0, tp = 1; for (let j = 0; j < 6; j++) { L += T.lag[j] * tp; tp *= t; }
  let D = 0, xp = 1; for (let j = 0; j < 6; j++) { D += T.leg[j] * xp; xp *= ct; }
  let stm = 1; for (let i = 0; i < T.am; i++) stm *= st;
  const f = T.norm * Math.pow(t, T.l / 2) * L / Math.pow(1 + t, T.expo !== undefined ? T.expo : T.n + 1) * stm * D;
  const re0 = f * Math.cos(T.m * phi), im0 = f * Math.sin(T.m * phi);
  return { re: re0 * T.phase.re - im0 * T.phase.im, im: re0 * T.phase.im + im0 * T.phase.re };
}
const cache = new Map();
export function momentumTableFor(s) { let T = cache.get(s.id); if (!T) { T = momentumTable(s.n, s.l, s.m); cache.set(s.id, T); } return T; }
/** φ(p) = Σ_a c_a φ_a(p) over the given basis indices */
export function phiAt(re, im, px, py, pz, indices) {
  let R = 0, I = 0;
  for (const a of indices) {
    const c = re[a], d = im[a]; if (c === 0 && d === 0) continue;
    const v = momentumFromTable(momentumTableFor(BASIS[a]), px, py, pz);
    R += c * v.re - d * v.im; I += c * v.im + d * v.re;
  }
  return { re: R, im: I };
}
/** Fock's map: momentum p (3-vector) and p₀ = 1/n to the unit S³ ⊂ ℝ⁴, ξ = (2p₀p, p₀²−p²)/(p₀²+p²) */
export function fockPoint(p, n) {
  const p0 = 1 / n, p2 = p[0] * p[0] + p[1] * p[1] + p[2] * p[2], d = p0 * p0 + p2;
  return [2 * p0 * p[0] / d, 2 * p0 * p[1] / d, 2 * p0 * p[2] / d, (p0 * p0 - p2) / d];
}
/** the inverse: ξ ∈ S³ back to momentum, p = p₀ ξ_{1..3} / (1 + ξ₄) */
export function fockInverse(xi, n) {
  const p0 = 1 / n, s = p0 / (1 + xi[3]);
  return [xi[0] * s, xi[1] * s, xi[2] * s];
}
/** the momentum-space box: the smallest populated n sets the scale (p ~ 1/n), and the 1s tail needs room */
export function domainForP(nmin) { return Math.min(6, Math.max(0.5, 4 / nmin)); }   // 4/n_min leaves ≈ 0.1% of ‖φ‖² outside (2.6/n_min left 1.2–3.4%, Round 11 C1)
