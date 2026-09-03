/* frontier.js — the mathematics of BEYOND THE FRONTIER (print of 2026-09-03), in the instrument.
 *
 * STATUS: EXACT ANALYTIC unless a function says otherwise.  Nothing here knows about the DOM or the GPU;
 * every function is pure and is held by tests/frontier.test.mjs against anchors the OTHER lab produced
 * (the print's numbers), table values, and quadrature — never against itself (§18.1).
 *
 * Thread A — the revival.  I(α,β) = (1/√2π)∫e^{-u²/2+iαu+iβu³}du = √(2π)(3β)^{-1/3} e^{α/6β+1/108β²} Ai((α+1/12β)/(3β)^{1/3});
 *   the maximiser α*(β) = Σ C_k β^{2k-1} (integers), the height |I|max = Σ D_k β^{2k} (rationals), both Gevrey-1
 *   with Borel pole β² = -1/54 (optimal truncation at k* ≈ 1/(54β²)); the Rydberg ladder as a Poisson sum of
 *   Airy envelopes; the deaf comb (b | 6 ⇔ m³ ≡ m mod b, Fermat/Korselt); the Parseval floor.
 * Thread B — the two rotors.  A shell n is V_j ⊗ V_j, j = (n-1)/2; the Clebsch matrix M of a shell state has
 *   singular values that are complete SO(4)-orbit invariants; ⟨J±⟩ = ⟨L ± K⟩/2 live on two spheres; the
 *   eccentricity e = |⟨K⟩|/n; K_z = -(2/3n) z on the shell (Pauli); e^{-iθK_z} is an SO(4) rotation, e^{iαL²} is not.
 * Thread C — the vortex lines.  On the coaxial circle (r,θ): ψ = Σ_m g_m e^{imφ}, so the nodal set is the set of
 *   unimodular roots of P(w) = Σ g_m w^{m-m_min}; degree bound, dominance lemma; three stretched modes reconnect
 *   only at the roots of Φ(r) = Â₀² - 4|Â₊Â₋| with ξ = |Â₀|/2|Â₊| ≤ 1, at two phases of the discriminant beat.
 */
import { BASIS, factorial, radial, ylm, energy, stateOf } from './hydrogen.js';

const PI = Math.PI, TWO_PI = 2 * Math.PI, SQRT_PI = Math.sqrt(Math.PI);

/* ── Airy Ai on the real line ──────────────────────────────────────────────── */
const AI0 = 0.355028053887817239, AIP0 = -0.258819403792806798;      // Ai(0), Ai'(0) (DLMF 9.2.3–4)
const U = [1];                                                        // u_k = Γ(3k+½)/(54^k k! Γ(k+½)), DLMF 9.7.2
for (let k = 1; k <= 40; k++) U[k] = U[k - 1] * (6 * k - 1) * (6 * k - 3) * (6 * k - 5) / (216 * k * (2 * k - 1));

function aiSeries(x) {
  const x3 = x * x * x; let f = 1, g = x, tf = 1, tg = x;
  for (let k = 1; k < 120; k++) {
    tf *= x3 / ((3 * k - 1) * (3 * k)); tg *= x3 / ((3 * k) * (3 * k + 1));
    f += tf; g += tg;
    if (Math.abs(tf) < 1e-18 * Math.abs(f) && Math.abs(tg) < 1e-18 * Math.abs(g)) break;
  }
  return AI0 * f + AIP0 * g;
}
/** log Ai(x) for x > 0 large: -ζ - log(2√π) - ¼ log x + log Σ(-1)^k u_k ζ^{-k}, optimally truncated */
export function logAiryAiPos(x) {
  const zeta = (2 / 3) * Math.pow(x, 1.5);
  let s = 1, term = 1, last = 1;
  for (let k = 1; k < 40; k++) {
    term *= -U[k] / U[k - 1] / zeta;
    if (Math.abs(term) >= Math.abs(last)) break;
    s += term; last = term;
  }
  return -zeta - Math.log(2 * SQRT_PI) - 0.25 * Math.log(x) + Math.log(s);
}
function aiNegAsym(x) {                 // Ai(-x), x > 0 large (DLMF 9.7.9)
  const zeta = (2 / 3) * Math.pow(x, 1.5);
  let P = 0, Q = 0, last = Infinity;
  for (let k = 0; 2 * k + 1 < U.length; k++) {
    const tp = ((k % 2) ? -1 : 1) * U[2 * k] / Math.pow(zeta, 2 * k);
    const tq = ((k % 2) ? -1 : 1) * U[2 * k + 1] / Math.pow(zeta, 2 * k + 1);
    if (Math.abs(tp) >= last) break;
    P += tp; Q += tq; last = Math.abs(tp);
  }
  return (Math.cos(zeta - PI / 4) * P + Math.sin(zeta - PI / 4) * Q) / (SQRT_PI * Math.pow(x, 0.25));
}
/**
 * Ai(x), real x: power series on [−x*, x*], optimally truncated asymptotics beyond, x* = 5.746.
 * The switch point is where the two representations agree best: Round 6 measured the crossing and found the
 * optimum 1.05e-8 there, and that **1e-8 is not achievable anywhere** — at the old switch (x = 6) the series has
 * already lost 1.06e-7 to cancellation while the asymptotic series has not yet earned it back. The honest claim
 * is a relative accuracy of ≈1.1e-8, which is what the tests now assert.
 */
export const AI_SWITCH = 5.746;
export function airyAi(x) {
  if (x > AI_SWITCH) return Math.exp(logAiryAiPos(x));
  if (x < -AI_SWITCH) return aiNegAsym(-x);
  return aiSeries(x);
}

/* ── Thread A: the revival envelope and its laws ───────────────────────────── */
/** I(α,β) (real): the revival envelope integral in closed form; log-space where the exponent is large */
export function envelopeI(alpha, beta) {
  const c = Math.cbrt(3 * beta), z = (alpha + 1 / (12 * beta)) / c;
  const ex = alpha / (6 * beta) + 1 / (108 * beta * beta);
  if (z > 6) return Math.exp(0.5 * Math.log(TWO_PI) - Math.log(c) + ex + logAiryAiPos(z));
  return Math.sqrt(TWO_PI) / c * Math.exp(ex) * airyAi(z);
}
/** the exact series of the maximiser (integers) and of the height (rationals), print Theorems A.2 and A.3 */
export const ALPHA_STAR_C = [-3, 54, -4860, 769824, -169746192, 47259985248, -15778134664704, 6120926902333440];
export const HEIGHT_D = [1, -3, 279 / 2, -29331 / 2, 19280619 / 8, -21368014569 / 40, 11848476936159 / 80, -27510190036247097 / 560];
/** Σ a_k β^{p(k)} with optimal truncation: stop before the first term that grows; returns { value, k, next } */
function optimalSeries(coeffs, beta, power) {
  let v = 0, last = Infinity, k = 0, next = 0;
  for (; k < coeffs.length; k++) {
    const t = coeffs[k] * Math.pow(beta, power(k));
    if (Math.abs(t) >= last) { next = Math.abs(t); break; }
    v += t; last = Math.abs(t); next = Math.abs(t);
  }
  return { value: v, terms: k, next };
}
/**
 * The peak law at cubic strength β: α* from the integer series (with its first omitted term as the error),
 * the height from the rational series, and both by direct numerical maximisation of |I(α,β)| (any β).
 */
export function peakLaw(beta) {
  const a = optimalSeries(ALPHA_STAR_C, beta, (k) => 2 * k + 1);
  const h = optimalSeries(HEIGHT_D, beta, (k) => 2 * k);
  // numerical: the tallest lobe of |I| sits between Airy argument z = -3.2 (the first lobe, large β) and the
  // Gaussian regime α ≈ 0, z ≈ 1/(12β c) (small β); grid then golden refinement
  const c = Math.cbrt(3 * beta), zmax = (3 + 1 / (12 * beta)) / c, NG = 800;
  let best = -1, zb = 0;
  for (let i = 0; i <= NG; i++) { const z = -3.2 + (zmax + 3.2) * i / NG; const v = Math.abs(envelopeI(z * c - 1 / (12 * beta), beta)); if (v > best) { best = v; zb = z; } }
  const dz = (zmax + 3.2) / NG;
  let lo = zb - dz, hi = zb + dz; const gr = (Math.sqrt(5) - 1) / 2;
  const f = (z) => Math.abs(envelopeI(z * c - 1 / (12 * beta), beta));
  let x1 = hi - gr * (hi - lo), x2 = lo + gr * (hi - lo), f1 = f(x1), f2 = f(x2);
  for (let i = 0; i < 60; i++) { if (f1 > f2) { hi = x2; x2 = x1; f2 = f1; x1 = hi - gr * (hi - lo); f1 = f(x1); } else { lo = x1; x1 = x2; f1 = f2; x2 = lo + gr * (hi - lo); f2 = f(x2); } }
  const zStar = (lo + hi) / 2;
  return { beta, alphaStar: a.value, alphaStarTerms: a.terms, alphaStarError: a.next, height: h.value, heightTerms: h.terms, heightError: h.next,
    // where the OPTIMALLY TRUNCATED series is still better than the numerical maximiser's own precision.
    // Round 6 measured the true boundary: at β = 0.319 the series height is 0.69472 against the truth 0.89878,
    // so the old 0.32 was far too generous; the series and the maximiser part company at β ≈ 0.0555.
    alphaStarNum: zStar * c - 1 / (12 * beta), heightNum: f(zStar), seriesUsable: beta < 0.0555 };
}
/** the three Rydberg clocks and the two dimensionless strengths (print §1) */
export function revivalClocks(nbar, sigma = 1) {
  return { Tcl: TWO_PI * nbar ** 3, Trev: (4 * PI / 3) * nbar ** 4, Tsr: PI * nbar ** 5,
    beta3: 8 * PI * sigma ** 3 / (3 * nbar), beta4: 10 * PI * sigma ** 4 / (3 * nbar * nbar) };
}
/**
 * A packet on the Rydberg ladder: populations p_n ∝ exp(-(n-n̄)²/2σ²) on every n (d = 0) or on a comb
 * n = n̄ + d·m, |m| ≤ teeth (d ≥ 1).  Returns [{ n, m, p }] normalised to Σp = 1 (n ≥ 1 only).
 */
export function packet({ nbar, sigma, d = 0, teeth = 8 }) {
  const out = [];
  if (d >= 1) { for (let m = -teeth; m <= teeth; m++) { const n = nbar + d * m; if (n >= 1) out.push({ n, m, p: Math.exp(-((d * m) ** 2) / (2 * sigma * sigma)) }); } }
  else { const lo = Math.max(1, Math.round(nbar - 6 * sigma)), hi = Math.round(nbar + 6 * sigma); for (let n = lo; n <= hi; n++) out.push({ n, m: n - nbar, p: Math.exp(-((n - nbar) ** 2) / (2 * sigma * sigma)) }); }
  let s = 0; for (const x of out) s += x.p; for (const x of out) x.p /= s;
  return out;
}
/** A(t) = Σ p_n e^{-iE_n t} of a packet (the exact autocorrelation of a Rydberg ladder state) → { re, im, abs } */
export function ladderAutocorr(pops, t) {
  let re = 0, im = 0;
  for (const { n, p } of pops) { const ph = t / (2 * n * n); re += p * Math.cos(ph); im += p * Math.sin(ph); }
  return { re, im, abs: Math.hypot(re, im) };
}
/**
 * The revival landscape of a packet: the maximum of |A| inside each classical period up to 1.15·T_rev
 * (capped at 600 periods), the fine structure across ±1.5 T_cl about T_rev, and the measured peak.
 */
export function revivalScan(pops, nbar, opts = {}) {
  const { Tcl, Trev } = revivalClocks(nbar);
  const periods = Math.min(opts.maxPeriods || 600, Math.ceil(1.15 * Trev / Tcl));
  const per = opts.perPeriod || 24, land = new Float64Array(periods);
  for (let k = 0; k < periods; k++) { let mx = 0; for (let i = 0; i < per; i++) mx = Math.max(mx, ladderAutocorr(pops, (k + i / per) * Tcl).abs); land[k] = mx; }
  const nf = opts.fine || 801, half = (opts.fineHalf || 1.5) * Tcl, fineT = new Float64Array(nf), fineA = new Float64Array(nf);
  let ib = 0;
  for (let i = 0; i < nf; i++) { fineT[i] = Trev - half + 2 * half * i / (nf - 1); fineA[i] = ladderAutocorr(pops, fineT[i]).abs; if (fineA[i] > fineA[ib]) ib = i; }
  let tPeak = fineT[ib], aPeak = fineA[ib];
  if (ib > 0 && ib < nf - 1) {             // parabolic refinement then a short golden search on the exact sum
    const y0 = fineA[ib - 1], y1 = fineA[ib], y2 = fineA[ib + 1], den = y0 - 2 * y1 + y2;
    if (den < 0) tPeak = fineT[ib] + 0.5 * (y0 - y2) / den * (fineT[1] - fineT[0]);
    let lo = tPeak - (fineT[1] - fineT[0]), hi = tPeak + (fineT[1] - fineT[0]); const gr = (Math.sqrt(5) - 1) / 2;
    const f = (t) => ladderAutocorr(pops, t).abs;
    let x1 = hi - gr * (hi - lo), x2 = lo + gr * (hi - lo), f1 = f(x1), f2 = f(x2);
    for (let i = 0; i < 40; i++) { if (f1 > f2) { hi = x2; x2 = x1; f2 = f1; x1 = hi - gr * (hi - lo); f1 = f(x1); } else { lo = x1; x1 = x2; f1 = f2; x2 = lo + gr * (hi - lo); f2 = f(x2); } }
    tPeak = (lo + hi) / 2; aPeak = f(tPeak);
  }
  return { Tcl, Trev, periods, landscape: land, fineT, fineA, tPeak, aPeak, aAtTrev: ladderAutocorr(pops, Trev).abs };
}
/**
 * Print Theorem A.4: at t = T_rev + x·T_cl the ladder sum is a Poisson sum of Airy envelopes,
 *   |A| = |Σ_j I(α_j, β₃)| / Σ_j e^{-2π²σ²j²},  α_j = -Lσ - 2πσj,  L = -(4πn̄/3) - 2πx  (mod 2π),
 * exact to cubic order in the level expansion (the quartic β₄ is the neglected term).  PREDICTION.
 */
/**
 * The general envelope (1/√2π)∫e^{−u²/2 + iαu + iδu² + iβu³ + iγu⁴}du, complex, by Simpson with a step chosen from
 * the largest phase gradient on the Gaussian's support.  δ is the CHIRP: away from the revival the quadratic phase
 * does not vanish, and Round 6 measured that residue at 67× the quartic — so the term the fold prediction actually
 * neglects off x = 0 is this one, not β₄.
 */
export function envelope4C(alpha, delta, beta, gamma, R = 6.5) {
  const grad = Math.abs(alpha) + 2 * Math.abs(delta) * R + 3 * Math.abs(beta) * R * R + 4 * Math.abs(gamma) * R * R * R;
  let N = Math.ceil(Math.max(2000, 26 * grad) / 2) * 2;
  const h = 2 * R / N; let sr = 0, si = 0;
  for (let i = 0; i <= N; i++) {
    const u = -R + i * h, w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    const g = Math.exp(-u * u / 2), ph = alpha * u + delta * u * u + beta * u * u * u + gamma * u * u * u * u;
    sr += w * g * Math.cos(ph); si += w * g * Math.sin(ph);
  }
  const f = h / 3 / Math.sqrt(TWO_PI);
  return { re: sr * f, im: si * f };
}
/**
 * Theorem A.4 with the chirp restored: at t = T_rev + x·T_cl the quadratic phase leaves a residue
 *   δ = 2πσ²x·T_cl/T_rev = 3πxσ²/n̄,
 * which vanishes only at the revival itself.  This is the honest prediction curve away from x = 0.
 */
export function poissonAiryChirped(nbar, sigma, x, J = 6) {
  const beta = revivalClocks(nbar, sigma).beta3, delta = 3 * PI * x * sigma * sigma / nbar;
  let L = -(4 * PI * nbar / 3) - TWO_PI * x; L -= TWO_PI * Math.round(L / TWO_PI);
  const a0 = -L * sigma;
  let re = 0, im = 0, nrm = 0;
  for (let j = -J; j <= J; j++) {
    const c = envelope4C(a0 - TWO_PI * sigma * j, delta, beta, 0);
    re += c.re; im += c.im; nrm += Math.exp(-2 * PI * PI * sigma * sigma * j * j);
  }
  return Math.hypot(re, im) / nrm;
}
export function poissonAiry(nbar, sigma, x, J = 24) {
  const beta = revivalClocks(nbar, sigma).beta3;
  let L = -(4 * PI * nbar / 3) - TWO_PI * x; L -= TWO_PI * Math.round(L / TWO_PI);
  const a0 = -L * sigma;
  let s = 0, norm = 0;
  for (let j = -J; j <= J; j++) { s += envelopeI(a0 - TWO_PI * sigma * j, beta); norm += Math.exp(-2 * PI * PI * sigma * sigma * j * j); }
  return Math.abs(s) / norm;
}
/** the comb's arithmetic: a/b = 4d³/(3n̄) reduced; deaf (peak 1) iff b | 6 — Fermat: m³ ≡ m (mod b) for all m */
export function combVerdict(nbar, d) {
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  const num = 4 * d * d * d, den = 3 * nbar, g = gcd(num, den) || 1;
  const a = num / g, b = den / g;
  return { a, b, deaf: 6 % b === 0, fraction: `${a}/${b}` };
}
/**
 * The cubic-level revival height of a comb with tooth weights p_m: A(p; a/b) = max_x |Σ p_m e(a m³/b + x m)| / Σp,
 * and the Parseval floor ‖p‖₂/‖p‖₁ (print Theorems A.5, A.6).  x on a 4001 grid, then golden refinement.
 */
export function cubicPeak(teeth, a, b) {
  const ms = teeth.map((t) => t.m), ps = teeth.map((t) => t.p);
  const ph = ms.map((m) => { const r = (((a * m * m * m) % b) + b) % b; return TWO_PI * r / b; });
  const s1 = ps.reduce((x, y) => x + y, 0), s2 = Math.sqrt(ps.reduce((x, y) => x + y * y, 0));
  const f = (x) => { let re = 0, im = 0; for (let i = 0; i < ms.length; i++) { const t = ph[i] + TWO_PI * x * ms[i]; re += ps[i] * Math.cos(t); im += ps[i] * Math.sin(t); } return Math.hypot(re, im) / s1; };
  let best = -1, xb = 0; const N = 4001;
  for (let i = 0; i < N; i++) { const v = f(i / N); if (v > best) { best = v; xb = i / N; } }
  let lo = xb - 1 / N, hi = xb + 1 / N; const gr = (Math.sqrt(5) - 1) / 2;
  let x1 = hi - gr * (hi - lo), x2 = lo + gr * (hi - lo), f1 = f(x1), f2 = f(x2);
  for (let i = 0; i < 50; i++) { if (f1 > f2) { hi = x2; x2 = x1; f2 = f1; x1 = hi - gr * (hi - lo); f1 = f(x1); } else { lo = x1; x1 = x2; f1 = f2; x2 = lo + gr * (hi - lo); f2 = f(x2); } }
  return { peak: Math.max(best, f((lo + hi) / 2)), x: (lo + hi) / 2, floor: s2 / s1 };
}

/* ── Thread B: Clebsch–Gordan, the shell matrix, the two rotors ────────────── */
/** ⟨j1 m1 j2 m2 | J M⟩, Condon–Shortley convention (Racah's closed form) */
export function clebsch(j1, m1, j2, m2, J, M) {
  if (Math.abs(m1 + m2 - M) > 1e-9) return 0;
  if (J > j1 + j2 + 1e-9 || J < Math.abs(j1 - j2) - 1e-9 || Math.abs(M) > J + 1e-9) return 0;
  const F = (x) => factorial(Math.round(x));
  const pre = Math.sqrt((2 * J + 1) * F(j1 + j2 - J) * F(j1 - j2 + J) * F(-j1 + j2 + J) / F(j1 + j2 + J + 1))
    * Math.sqrt(F(J + M) * F(J - M) * F(j1 - m1) * F(j1 + m1) * F(j2 - m2) * F(j2 + m2));
  let s = 0;
  const kmin = Math.max(0, Math.round(j2 - J - m1), Math.round(j1 - J + m2)), kmax = Math.min(Math.round(j1 + j2 - J), Math.round(j1 - m1), Math.round(j2 + m2));
  for (let k = kmin; k <= kmax; k++) {
    s += ((k % 2) ? -1 : 1) / (F(k) * F(j1 + j2 - J - k) * F(j1 - m1 - k) * F(j2 + m2 - k) * F(J - j2 + m1 + k) * F(J - j1 - m2 + k));
  }
  return pre * s;
}
/** Pauli: ⟨n l+1 m | K_z | n l m⟩ on the shell, K = -(2/3n)·r, with the CS/positive-R_nl conventions of hydrogen.js */
export function kzElement(n, l, m) {
  if (l + 1 > n - 1 || Math.abs(m) > l) return 0;
  return Math.sqrt(n * n - (l + 1) * (l + 1)) * Math.sqrt(((l + 1) * (l + 1) - m * m) / ((2 * l + 1) * (2 * l + 3)));
}
/* the l-phases η_{n,l} that align the coupled (CG) basis with the hydrogen |nlm⟩, fixed by the sign of K_z's m = 0 element */
const ETA = [], CGT = [];
for (let n = 1; n <= 6; n++) {
  const j = (n - 1) / 2, eta = [1];
  const cg = (l, m, p, q) => clebsch(j, j - p, j, j - q, l, m);        // p, q index m₊ = j-p, m₋ = j-q
  for (let l = 0; l < n - 1; l++) {
    let s = 0;
    for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) if (Math.abs((j - p) + (j - q)) < 1e-9) s += cg(l + 1, 0, p, q) * cg(l, 0, p, q) * ((j - p) - (j - q));
    eta[l + 1] = eta[l] * (s < 0 ? -1 : 1);
  }
  ETA[n] = eta; CGT[n] = cg;
}
/** the CG-basis element ⟨l+1 0 | J₊z − J₋z | l 0⟩ (for the proof that the coupled picture reproduces Pauli) */
export function kzElementCG(n, l) {
  const j = (n - 1) / 2; let s = 0;
  for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) if (Math.abs((j - p) + (j - q)) < 1e-9) s += CGT[n](l + 1, 0, p, q) * CGT[n](l, 0, p, q) * ((j - p) - (j - q));
  return s;
}
/**
 * The Clebsch matrix of shell n at coefficients (re, im) (Float64Array(91)): M[p][q] = Σ_{l,m} η_{nl} c_{nlm} ⟨j m₊ j m₋ | l m⟩,
 * m₊ = j - p, m₋ = j - q.  Returns { n, re, im } (n×n, row-major) and the shell norm².
 */
export function shellMatrix(re, im, n) {
  const j = (n - 1) / 2, N = n, Mre = new Float64Array(N * N), Mim = new Float64Array(N * N);
  let norm2 = 0;
  for (let l = 0; l < n; l++) for (let m = -l; m <= l; m++) {
    const a = stateOf(n, l, m).index, cr = re[a], ci = im[a];
    if (cr === 0 && ci === 0) continue;
    norm2 += cr * cr + ci * ci;
    const eta = ETA[n][l];
    for (let p = 0; p < N; p++) { const qq = Math.round(j - (m - (j - p)));      // m₋ = m − m₊, m₊ = j − p, q = j − m₋
      if (qq < 0 || qq >= N) continue;
      const c = eta * CGT[n](l, m, p, qq); if (c === 0) continue;
      Mre[p * N + qq] += c * cr; Mim[p * N + qq] += c * ci; }
  }
  return { n, re: Mre, im: Mim, norm2 };
}
/** eigenvalues of a real symmetric matrix (Jacobi); returns { values, vectors (column-major in a flat array) } */
export function symEig(A, n) {
  const a = Float64Array.from(A), v = new Float64Array(n * n);
  for (let i = 0; i < n; i++) v[i * n + i] = 1;
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p * n + q] ** 2;
    if (off < 1e-30) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p * n + q]; if (Math.abs(apq) < 1e-300) continue;
      const theta = (a[q * n + q] - a[p * n + p]) / (2 * apq);
      const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k * n + p], akq = a[k * n + q]; a[k * n + p] = c * akp - s * akq; a[k * n + q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p * n + k], aqk = a[q * n + k]; a[p * n + k] = c * apk - s * aqk; a[q * n + k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = v[k * n + p], vkq = v[k * n + q]; v[k * n + p] = c * vkp - s * vkq; v[k * n + q] = s * vkp + c * vkq; }
    }
  }
  const values = new Float64Array(n); for (let i = 0; i < n; i++) values[i] = a[i * n + i];
  return { values, vectors: v };
}
/** the Schmidt spectrum (singular values, descending, normalised to the shell norm) of a shell matrix */
export function schmidt(M) {
  const n = M.n, H = new Float64Array(4 * n * n);        // realified M†M: [[A, -B], [B, A]] for A + iB
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) {
    let ar = 0, ai = 0;
    for (let p = 0; p < n; p++) { const xr = M.re[p * n + i], xi = -M.im[p * n + i], yr = M.re[p * n + k], yi = M.im[p * n + k]; ar += xr * yr - xi * yi; ai += xr * yi + xi * yr; }
    H[i * 2 * n + k] = ar; H[(i + n) * 2 * n + (k + n)] = ar; H[i * 2 * n + (k + n)] = -ai; H[(i + n) * 2 * n + k] = ai;
  }
  const ev = Array.from(symEig(H, 2 * n).values).sort((x, y) => y - x);
  const s = []; for (let i = 0; i < 2 * n; i += 2) s.push(Math.sqrt(Math.max(0, ev[i])));
  const norm = Math.sqrt(M.norm2) || 1;
  return { values: s.map((x) => x / norm), raw: s };
}
/** ⟨J₊⟩, ⟨J₋⟩ (three-vectors), ⟨L⟩ = ⟨J₊⟩ + ⟨J₋⟩, ⟨K⟩ = ⟨J₊⟩ − ⟨J₋⟩, e = |⟨K⟩|/n, per unit shell norm */
export function rotorExpectations(M) {
  const n = M.n, j = (n - 1) / 2, N2 = M.norm2 || 1;
  // spin matrices in the basis m = j - p: (j_+)[p-1][p] = sqrt(j(j+1) - m(m+1)), j_z = diag(m)
  const jp = new Float64Array(n * n); for (let p = 1; p < n; p++) { const m = j - p; jp[(p - 1) * n + p] = Math.sqrt(j * (j + 1) - m * (m + 1)); }
  const jx = new Float64Array(n * n), jyIm = new Float64Array(n * n), jz = new Float64Array(n * n);
  for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) { jx[p * n + q] = (jp[p * n + q] + jp[q * n + p]) / 2; jyIm[p * n + q] = -(jp[p * n + q] - jp[q * n + p]) / 2; }   // j_y = (j₊ − j₋)/(2i) = -i(j₊ − j₋)/2
  for (let p = 0; p < n; p++) jz[p * n + p] = j - p;
  // G₊ = M M† (⟨A⊗1⟩ = Σ A[p][p'] G₊[p'][p]),  G₋ = M† M (⟨1⊗B⟩ = Σ B[q][q'] G₋[q][q'])
  const Gp = { re: new Float64Array(n * n), im: new Float64Array(n * n) }, Gm = { re: new Float64Array(n * n), im: new Float64Array(n * n) };
  for (let p = 0; p < n; p++) for (let p2 = 0; p2 < n; p2++) { let r = 0, i = 0; for (let q = 0; q < n; q++) { const ar = M.re[p * n + q], ai = M.im[p * n + q], br = M.re[p2 * n + q], bi = -M.im[p2 * n + q]; r += ar * br - ai * bi; i += ar * bi + ai * br; } Gp.re[p * n + p2] = r; Gp.im[p * n + p2] = i; }
  for (let q = 0; q < n; q++) for (let q2 = 0; q2 < n; q2++) { let r = 0, i = 0; for (let p = 0; p < n; p++) { const ar = M.re[p * n + q], ai = -M.im[p * n + q], br = M.re[p * n + q2], bi = M.im[p * n + q2]; r += ar * br - ai * bi; i += ar * bi + ai * br; } Gm.re[q * n + q2] = r; Gm.im[q * n + q2] = i; }
  const expect = (Are, Aim, G, transpose) => { let s = 0; for (let p = 0; p < n; p++) for (let p2 = 0; p2 < n; p2++) { const gr = transpose ? G.re[p2 * n + p] : G.re[p * n + p2], gi = transpose ? G.im[p2 * n + p] : G.im[p * n + p2]; s += Are[p * n + p2] * gr - Aim[p * n + p2] * gi; } return s / N2; };
  const zero = new Float64Array(n * n);
  const Jp = [expect(jx, zero, Gp, true), expect(zero, jyIm, Gp, true), expect(jz, zero, Gp, true)];
  const Jm = [expect(jx, zero, Gm, false), expect(zero, jyIm, Gm, false), expect(jz, zero, Gm, false)];
  const L = [Jp[0] + Jm[0], Jp[1] + Jm[1], Jp[2] + Jm[2]], K = [Jp[0] - Jm[0], Jp[1] - Jm[1], Jp[2] - Jm[2]];
  const absK = Math.hypot(...K), absL = Math.hypot(...L), absJp = Math.hypot(...Jp), absJm = Math.hypot(...Jm);
  return { Jp, Jm, L, K, absL, absK, e: absK / n, j, coherence: j > 0 ? Math.min(absJp, absJm) / j : 1, z: -1.5 * n * K[2] };
}
/**
 * e^{-iθ K_z} on the anchor coefficients (re, im), shell by shell and m-block by m-block (K_z conserves n and m):
 * an SO(4) rotation — the Schmidt spectrum is invariant.  Exact by eigendecomposition of the tridiagonal block.
 */
export function applyRotateK(re, im, theta) {
  for (let n = 2; n <= 6; n++) for (let m = -(n - 1); m <= n - 1; m++) {
    const ls = []; for (let l = Math.abs(m); l < n; l++) ls.push(l);
    const B = ls.length, K = new Float64Array(B * B);
    for (let i = 0; i + 1 < B; i++) { const k = kzElement(n, ls[i], m); K[i * B + i + 1] = k; K[(i + 1) * B + i] = k; }
    const idx = ls.map((l) => stateOf(n, l, m).index);
    let any = false; for (const a of idx) if (re[a] !== 0 || im[a] !== 0) any = true;
    if (!any) continue;
    const { values, vectors } = symEig(K, B);
    // c' = V diag(e^{-iθλ}) Vᵀ c
    const yr = new Float64Array(B), yi = new Float64Array(B);
    for (let k = 0; k < B; k++) { let r = 0, i = 0; for (let a = 0; a < B; a++) { r += vectors[a * B + k] * re[idx[a]]; i += vectors[a * B + k] * im[idx[a]]; } const ph = -theta * values[k], c = Math.cos(ph), s = Math.sin(ph); yr[k] = r * c - i * s; yi[k] = r * s + i * c; }
    for (let a = 0; a < B; a++) { let r = 0, i = 0; for (let k = 0; k < B; k++) { r += vectors[a * B + k] * yr[k]; i += vectors[a * B + k] * yi[k]; } re[idx[a]] = r; im[idx[a]] = i; }
  }
}
/** e^{iα L²}: c_nlm → e^{iα l(l+1)} c_nlm — the DEFECT WAIT (a wait under an l-dependent phase; not an SO(4) element) */
export function applyDefectWait(re, im, alpha) {
  for (const s of BASIS) { const a = s.index; if (re[a] === 0 && im[a] === 0) continue; const ph = alpha * s.l * (s.l + 1), c = Math.cos(ph), sn = Math.sin(ph); const r0 = re[a], i0 = im[a]; re[a] = r0 * c - i0 * sn; im[a] = r0 * sn + i0 * c; }
}

/* ── Thread C: the vortex lines ────────────────────────────────────────────── */
/** roots of a complex polynomial Σ c_k w^k (c = [{re, im}], ascending) by Durand–Kerner; leading zeros trimmed */
export function polyRoots(c) {
  let deg = c.length - 1; while (deg > 0 && Math.hypot(c[deg].re, c[deg].im) === 0) deg--;
  if (deg <= 0) return [];
  const lr = c[deg].re, li = c[deg].im, l2 = lr * lr + li * li;
  const a = []; for (let k = 0; k <= deg; k++) a.push({ re: (c[k].re * lr + c[k].im * li) / l2, im: (c[k].im * lr - c[k].re * li) / l2 });   // monic
  const z = []; let scale = 0; for (let k = 0; k < deg; k++) scale = Math.max(scale, Math.hypot(a[k].re, a[k].im) ** (1 / (deg - k)));
  scale = Math.max(1e-3, scale); const ang = 0.4;
  for (let k = 0; k < deg; k++) z.push({ re: scale * Math.cos(ang + TWO_PI * k / deg + 0.1), im: scale * Math.sin(ang + TWO_PI * k / deg + 0.1) });
  const P = (x) => { let r = 1, i = 0; for (let k = deg - 1; k >= 0; k--) { const nr = r * x.re - i * x.im + a[k].re, ni = r * x.im + i * x.re + a[k].im; r = nr; i = ni; } return { re: r, im: i }; };
  for (let it = 0; it < 200; it++) {
    let mv = 0;
    for (let k = 0; k < deg; k++) {
      const pv = P(z[k]); let dr = 1, di = 0;
      for (let j = 0; j < deg; j++) if (j !== k) { const xr = z[k].re - z[j].re, xi = z[k].im - z[j].im; const nr = dr * xr - di * xi, ni = dr * xi + di * xr; dr = nr; di = ni; }
      const d2 = dr * dr + di * di || 1e-300; const qr = (pv.re * dr + pv.im * di) / d2, qi = (pv.im * dr - pv.re * di) / d2;
      z[k].re -= qr; z[k].im -= qi; mv = Math.max(mv, Math.hypot(qr, qi));
    }
    if (mv < 1e-14) break;
  }
  return z;
}
/** the coaxial polynomial at (r, θ): g_m = Σ_{n,l} c_nlm R_nl(r) Θ_lm(θ) over the given mode indices; P(w) = Σ g_m w^{m - mmin} */
export function coaxialPolynomial(re, im, ids, r, theta) {
  let mmin = Infinity, mmax = -Infinity;
  for (const a of ids) { const s = BASIS[a]; mmin = Math.min(mmin, s.m); mmax = Math.max(mmax, s.m); }
  if (!ids.length) return { mmin: 0, mmax: 0, coeffs: [], gAbs: [] };
  const M = mmax - mmin, coeffs = []; for (let k = 0; k <= M; k++) coeffs.push({ re: 0, im: 0 });
  for (const a of ids) {
    const s = BASIS[a]; const f = radial(s.n, s.l, r) * ylm(s.l, s.m, theta, 0).re;     // Θ_lm(θ) = Y_lm(θ, 0), real
    const k = s.m - mmin; coeffs[k].re += f * re[a]; coeffs[k].im += f * im[a];
  }
  return { mmin, mmax, coeffs, gAbs: coeffs.map((c) => Math.hypot(c.re, c.im)) };
}
/**
 * Vortex points of the state (re, im on the mode set ids) on nr spheres between rMin and rMax: on each sphere
 * the roots of P are tracked across nth polar samples and every crossing of the unit circle is refined by
 * bisection in θ.  Returns { points: [{x, y, z, r, theta, phi, m}], M, circles, skipped, axis }.
 * EXACT on the refined circles (a point is an exact zero of the sampled polynomial); the drawing is a sampling.
 */
export function vortexPoints(re, im, ids, opts = {}) {
  const nr = opts.nr || 40, nth = opts.nth || 96, rMin = opts.rMin || 0.15, rMax = opts.rMax || 20, tol = opts.tol || 1e-9;
  const points = []; let circles = 0, skipped = 0, M = 0;
  const hasM0 = ids.some((a) => BASIS[a].m === 0);
  let mAbsMin = Infinity; for (const a of ids) mAbsMin = Math.min(mAbsMin, Math.abs(BASIS[a].m));
  const axis = hasM0 || !ids.length ? 0 : mAbsMin;          // no m = 0 mode: the z-axis is itself a nodal line
  const dominant = (g) => { let mx = 0, sum = 0; for (const v of g) { sum += v; mx = Math.max(mx, v); } return sum === 0 || mx > sum - mx; };
  const unit = (z) => Math.hypot(z.re, z.im) - 1;
  for (let ir = 0; ir < nr; ir++) {
    const r = rMin + (rMax - rMin) * (ir + 0.5) / nr;
    let prev = null, prevTh = 0;
    for (let it = 0; it <= nth; it++) {
      const th = 1e-3 + (PI - 2e-3) * it / nth;
      const P = coaxialPolynomial(re, im, ids, r, th); M = Math.max(M, P.mmax - P.mmin);
      let roots = null;
      if (P.mmax > P.mmin && !dominant(P.gAbs)) { roots = polyRoots(P.coeffs); circles++; } else { skipped++; if (P.mmax > P.mmin) circles++; }
      if (roots && prev) {
        // match each current root to the nearest previous one; a sign change of |w| - 1 brackets a crossing
        for (const z of roots) {
          let best = null, bd = Infinity; for (const p of prev) { const d = Math.hypot(z.re - p.re, z.im - p.im); if (d < bd) { bd = d; best = p; } }
          if (!best || bd > 0.6) continue;
          const u0 = unit(best), u1 = unit(z);
          if (u0 * u1 < 0 || Math.abs(u1) < tol) {
            let a = prevTh, b = th, za = best, zb = z;
            for (let k = 0; k < 40 && Math.abs(unit(zb)) > tol; k++) {
              const mid = (a + b) / 2, Pm = coaxialPolynomial(re, im, ids, r, mid), rm = polyRoots(Pm.coeffs);
              let zm = null, dm = Infinity; for (const q of rm) { const d = Math.hypot(q.re - zb.re, q.im - zb.im); if (d < dm) { dm = d; zm = q; } }
              if (!zm) break;
              if (unit(zm) * unit(za) < 0) { b = mid; zb = zm; } else { a = mid; za = zm; }
            }
            const zr = zb, thr = b, phi = Math.atan2(zr.im, zr.re);
            points.push({ x: r * Math.sin(thr) * Math.cos(phi), y: r * Math.sin(thr) * Math.sin(phi), z: r * Math.cos(thr), r, theta: thr, phi, residual: Math.abs(unit(zr)) });
          }
        }
      }
      if (roots) { prev = roots; prevTh = th; } else if (!roots && P.mmax > P.mmin && dominant(P.gAbs)) { prev = null; }
    }
  }
  return { points, M, circles, skipped, axis };
}
/**
 * Print Theorem C.3 for a stretched three-mode state (m₀+1, m₀, m₀-1 with l = |m|): the reconnection census as the
 * roots of Φ(r) = Â₀² - 4|Â₊Â₋| with ξ = |Â₀|/2|Â₊| ≤ 1, each firing at t₀ = arg((c₀Â₀)²/4c₊Â₊c₋Â₋)/(2E₀-E₊-E₋) mod T_d.
 * Input: [{ n, l, m, re, im }] (three modes).  Returns null when the state is not of this form.
 */
export function stretchedCensus(modes, rMax = 60) {
  if (modes.length !== 3) return null;
  const sorted = modes.slice().sort((x, y) => y.m - x.m);
  const [P, Z, N] = sorted;
  if (P.m - Z.m !== 1 || Z.m - N.m !== 1) return null;
  for (const s of sorted) if (s.l !== Math.abs(s.m)) return null;
  const sig = (s) => ylm(s.l, s.m, PI / 2, 0).re;
  const A = (s, r) => radial(s.n, s.l, r) * sig(s) * Math.hypot(s.re, s.im);
  const Phi = (r) => A(Z, r) ** 2 - 4 * Math.abs(A(P, r) * A(N, r));
  const xi = (r) => Math.abs(A(Z, r)) / (2 * Math.abs(A(P, r)));
  const om = energy(P.n) + energy(N.n) - 2 * energy(Z.n);
  const degenerate = Math.abs(om) < 1e-15;                 // equal beats: the discriminant never turns, T_d = ∞
  const Td = degenerate ? Infinity : TWO_PI / Math.abs(om);
  /**
   * The roots of Φ are the level set 4|Â₊Â₋| = Â₀², i.e. of G = 4|Â₊Â₋|/Â₀².  G's POLES are the radial nodes of the
   * MIDDLE mode and its ZEROS are the nodes of the outer two, so every radial node of ANY of the three modes is a
   * place where Φ takes the sign opposite to the ambient one — at a node of Â₊ or Â₋, Φ = Â₀² > 0; at a node of Â₀,
   * Φ = −4|Â₊Â₋| < 0 — and is therefore straddled by a PAIR of roots.  That pair can be arbitrarily narrow:
   * Round 6 exhibited (3d₊₂, 4p₊₁, 5s) with moduli (1, 76241.394354, 3.7179689892) whose pairs are 1.4e-4 wide at
   * the 4p nodes, where the old scan (uniform 1e-3, refined only around the OUTER modes' nodes) printed 0 for a
   * true census of 8.  So: take the nodes of ALL THREE modes, scan each gap between consecutive nodes with the ends
   * clustered, and walk out from every node geometrically to 1e-9, so no dip is too narrow to be seen.
   */
  const roots = [];
  const bisect = (f, a, b, fa) => { for (let k = 0; k < 80; k++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; };
  const nodes = [];
  for (const s of sorted) {
    const R = (r) => radial(s.n, s.l, r);
    let pr = 1e-3, prev = R(pr);
    for (let r = 3e-3; r <= rMax; r += 2e-3) { const v = R(r); if (prev * v < 0) nodes.push(bisect(R, pr, r, prev)); prev = v; pr = r; }
  }
  nodes.sort((a, b) => a - b);
  const add = (a, b, fa) => { const r = bisect(Phi, a, b, fa); if (r > 0 && !roots.some((x) => Math.abs(x - r) < 1e-9)) roots.push(r); };
  const marks = [1e-4, ...nodes.filter((r) => r > 1e-4 && r < rMax), rMax];
  for (let i = 0; i + 1 < marks.length; i++) {            // every gap, ends clustered: roots crowd toward the nodes
    const a = marks[i], b = marks[i + 1], M = 400;
    let pr = a + (b - a) * 1e-6, prev = Phi(pr);
    for (let k = 1; k <= M; k++) {
      const u = (1 - Math.cos(PI * k / M)) / 2, r = a + (b - a) * (1e-6 + (1 - 2e-6) * u), v = Phi(r);
      if (prev * v < 0) add(pr, r, prev);
      prev = v; pr = r;
    }
  }
  for (const nd of nodes) for (const sgn of [-1, 1]) {     // and out from every node, geometrically, down to 1e-9
    let pd = 1e-9, prev = Phi(nd + sgn * pd);
    for (let e = -9; e <= -0.5; e += 0.125) {
      const d = Math.pow(10, e), r = nd + sgn * d;
      if (r <= 0 || r > rMax) break;
      const v = Phi(r), lo = Math.min(nd + sgn * pd, r), hi = Math.max(nd + sgn * pd, r);
      if (prev * v < 0) add(lo, hi, Phi(lo));
      prev = v; pd = d;
    }
  }
  roots.sort((a, b) => a - b);
  for (let i = roots.length - 1; i > 0; i--) if (Math.abs(roots[i] - roots[i - 1]) < 1e-8) roots.splice(i, 1);
  const points = [];
  for (const r of roots) {
    const x = xi(r), adm = x <= 1;
    // the discriminant phase: (c₀Â₀)² e^{-2iE₀t} = 4 (c₊Â₊)(c₋Â₋) e^{-i(E₊+E₋)t}  ⇒  e^{-iω' t} = ratio, ω' = 2E₀ − E₊ − E₋
    const cz = { re: Z.re, im: Z.im }, cp = { re: P.re, im: P.im }, cn = { re: N.re, im: N.im };
    const az = radial(Z.n, Z.l, r) * sig(Z), ap = radial(P.n, P.l, r) * sig(P), an = radial(N.n, N.l, r) * sig(N);
    const num = { re: (cz.re * cz.re - cz.im * cz.im) * az * az, im: 2 * cz.re * cz.im * az * az };
    const den = { re: 4 * (cp.re * cn.re - cp.im * cn.im) * ap * an, im: 4 * (cp.re * cn.im + cp.im * cn.re) * ap * an };
    const arg = Math.atan2(num.im, num.re) - Math.atan2(den.im, den.re);
    // degenerate beats (2E₀ = E₊ + E₋, e.g. three modes of one shell): the discriminant's phase never turns, so
    // either the condition holds for all t or for none — there is no firing time, and t₀ is reported as null.
    let t0 = degenerate ? null : ((-arg / (2 * energy(Z.n) - energy(P.n) - energy(N.n)) % Td) + Td) % Td;
    const th = adm ? Math.asin(Math.min(1, x)) : NaN;
    points.push({ r, xi: x, admissible: adm, theta: th, rho: adm ? r * x : NaN, z: adm ? r * Math.cos(th) : NaN, t0, sign: Math.sign(ap * an) });
  }
  return { roots, points, admissible: points.filter((p) => p.admissible).length, count: 2 * points.filter((p) => p.admissible).length, Td, modes: sorted };
}
/** convenience: the three-mode description of a register state at time t, for the census */
export function threeModes(re, im, ids) {
  return ids.map((a) => { const s = BASIS[a]; return { n: s.n, l: s.l, m: s.m, re: re[a], im: im[a] }; });
}

/* ── Round 7 (2026-09-03): the full rotor action, the cusp, the exact clocks, the Korselt law ──────────────
 * All EXACT ANALYTIC, all held by tests/frontier.test.mjs against INDEPENDENT routes: the rotor pair reproduces
 * applyRotateK by a different computation, and the clock evaluator uses integer arithmetic where floating point
 * would lose the phase.
 */

/** Wigner small-d, d^j_{m'm}(β) (Varshalovich 4.3.1); j may be half-integer, j ± m are always integers */
export function wignerSmalld(j, mp_, m, beta) {
  const c = Math.cos(beta / 2), s = Math.sin(beta / 2), F = (x) => factorial(Math.round(x));
  let sum = 0;
  const kmin = Math.max(0, Math.round(m - mp_)), kmax = Math.min(Math.round(j + m), Math.round(j - mp_));
  for (let k = kmin; k <= kmax; k++) {
    const a = Math.round(j + m - k), b = k, cc = Math.round(mp_ - m + k), d = Math.round(j - mp_ - k);
    if (a < 0 || b < 0 || cc < 0 || d < 0) continue;
    sum += ((k % 2) ? -1 : 1) * Math.pow(c, 2 * j + m - mp_ - 2 * k) * Math.pow(s, mp_ - m + 2 * k) / (F(a) * F(b) * F(cc) * F(d));
  }
  return ((Math.round(mp_ - m) % 2) ? -1 : 1) * Math.sqrt(F(j + mp_) * F(j - mp_) * F(j + m) * F(j - m)) * sum;
}
/** D^j(α, β, γ) = e^{−iαm'} d^j_{m'm}(β) e^{−iγm}, rows p = j − m', columns q = j − m */
export function wignerD(j, alpha, beta, gamma) {
  const N = Math.round(2 * j + 1), re = new Float64Array(N * N), im = new Float64Array(N * N);
  for (let p = 0; p < N; p++) for (let q = 0; q < N; q++) {
    const mp_ = j - p, m = j - q, d = wignerSmalld(j, mp_, m, beta), ph = -alpha * mp_ - gamma * m;
    re[p * N + q] = d * Math.cos(ph); im[p * N + q] = d * Math.sin(ph);
  }
  return { n: N, re, im };
}
/** D^j for a rotation by `angle` about a Cartesian axis ('x' | 'y' | 'z') */
export function wignerAxis(j, axis, angle) {
  if (axis === 'z') return wignerD(j, angle, 0, 0);
  if (axis === 'y') return wignerD(j, 0, angle, 0);
  return wignerD(j, -PI / 2, angle, PI / 2);                       // R_x(θ) = R_z(−π/2) R_y(θ) R_z(π/2)
}
/** the inverse Clebsch transform: write a shell matrix back into the coefficient arrays (the transform is orthogonal) */
export function shellCoefficients(M, n, re, im) {
  const j = (n - 1) / 2;
  for (let l = 0; l < n; l++) for (let m = -l; m <= l; m++) {
    const a = stateOf(n, l, m).index; let r = 0, i = 0;
    for (let p = 0; p < n; p++) {
      const q = Math.round(j - (m - (j - p))); if (q < 0 || q >= n) continue;
      const c = ETA[n][l] * CGT[n](l, m, p, q); if (!c) continue;
      r += c * M.re[p * n + q]; i += c * M.im[p * n + q];
    }
    re[a] = r; im[a] = i;
  }
}
/**
 * Theorem B.7: every element of SO(4) = (SU(2)₊ × SU(2)₋)/Z₂ acts on a shell as M ↦ U M Vᵀ, U = D^j(R₊), V = D^j(R₋).
 * The diagonal U = V is the ordinary spatial rotation D^l(R) (so this also supplies the general Wigner rotation the
 * register lacked); the opposite pair (e^{−iθj_z}, e^{+iθj_z}) is e^{−iθK_z}; every (U, V) fixes the Schmidt spectrum.
 */
export function applyShellRotors(re, im, n, U, V) {
  const M = shellMatrix(re, im, n);
  if (M.norm2 === 0) return;
  const N = n, tRe = new Float64Array(N * N), tIm = new Float64Array(N * N), oRe = new Float64Array(N * N), oIm = new Float64Array(N * N);
  for (let a = 0; a < N; a++) for (let q = 0; q < N; q++) { let r = 0, i = 0; for (let p = 0; p < N; p++) { const ur = U.re[a * N + p], ui = U.im[a * N + p]; r += ur * M.re[p * N + q] - ui * M.im[p * N + q]; i += ur * M.im[p * N + q] + ui * M.re[p * N + q]; } tRe[a * N + q] = r; tIm[a * N + q] = i; }
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { let r = 0, i = 0; for (let q = 0; q < N; q++) { const vr = V.re[b * N + q], vi = V.im[b * N + q]; r += tRe[a * N + q] * vr - tIm[a * N + q] * vi; i += tRe[a * N + q] * vi + tIm[a * N + q] * vr; } oRe[a * N + b] = r; oIm[a * N + b] = i; }
  shellCoefficients({ n: N, re: oRe, im: oIm }, n, re, im);
}
/**
 * Drive one rotor, or both, about a Cartesian axis, on every populated shell:
 *   'both' → the ordinary spatial rotation D^l(R)   ·   'K' → the opposite pair, e^{−iθK_axis}
 *   '+' / '−' → one rotor alone: a genuine SO(4) element that is NOT a spatial rotation (it moves ⟨L⟩ and ⟨K⟩ apart).
 */
export function applyRotor(re, im, { which = 'both', axis = 'z', angle = 0 }) {
  for (let n = 2; n <= 6; n++) {
    let any = false;
    for (const s of BASIS) if (s.n === n && (re[s.index] !== 0 || im[s.index] !== 0)) { any = true; break; }
    if (!any) continue;
    const j = (n - 1) / 2, I = wignerAxis(j, axis, 0);
    const Rp = (which === '+' || which === 'both' || which === 'K') ? wignerAxis(j, axis, angle) : I;
    const Rm = (which === 'both' || which === '−') ? wignerAxis(j, axis, angle) : which === 'K' ? wignerAxis(j, axis, -angle) : I;
    applyShellRotors(re, im, n, Rp, Rm);
  }
}

/* ── the clocks, evaluated EXACTLY (integer arithmetic where floating point loses the phase) ─────────────── */
/**
 * |A(t)| at t = (A/B)·π·n̄^M — every clock of the ladder has that form (T_cl: 2,1,3 · T_rev: 4,3,4 · T_sr: 1,1,5 ·
 * T_4: 4,5,6).  The phase of mode n is t/(2n²), and t/(4πn²) = A n̄^M/(4B n²) is RATIONAL, so its fractional part is
 * exact in BigInt: no phase is lost however large n̄ is (at n̄ = 2000 the naive double loses six digits of it).
 */
export function clockAutocorr(pops, nbar, A, B, M) {
  let re = 0, im = 0, den = 0;
  const AN = BigInt(A) * BigInt(nbar) ** BigInt(M);
  for (const { n, p } of pops) {
    const d = 4n * BigInt(B) * BigInt(n) * BigInt(n);
    const r = ((AN % d) + d) % d;
    const ph = TWO_PI * Number(r) / Number(d);
    re += p * Math.cos(ph); im += p * Math.sin(ph); den += p;
  }
  if (den > 0) { re /= den; im /= den; }
  return { re, im, abs: Math.hypot(re, im) };
}
/** the quartic envelope (1/√2π)∫e^{−u²/2 + iαu + iγu⁴}du, complex — Simpson, the Gaussian cutting the tail at u = 8 */
export function quarticEnvelopeC(alpha, gamma, R = 8, N = 20000) {
  const h = 2 * R / N; let sr = 0, si = 0;
  for (let i = 0; i <= N; i++) {
    const u = -R + i * h, w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    const g = Math.exp(-u * u / 2), ph = alpha * u + gamma * u * u * u * u;
    sr += w * g * Math.cos(ph); si += w * g * Math.sin(ph);
  }
  const f = h / 3 / Math.sqrt(TWO_PI);
  return { re: sr * f, im: si * f };
}
export function quarticEnvelope(alpha, gamma, R = 8, N = 20000) { const c = quarticEnvelopeC(alpha, gamma, R, N); return Math.hypot(c.re, c.im); }
/**
 * The CUSP envelope: the Poisson sum Σ_j I₄(α − 2πσj, γ) / Σ_j e^{−2π²σ²j²}, complex.  The aliases are NOT
 * Gaussian-suppressed — the quartic phase rescues them exactly as the cubic one does at the fold (Theorem A.4) —
 * and at (n̄, σ) = (2000, 3) they carry 2% of the answer: j = 0 alone gives 0.7832 where the truth is 0.7672.
 */
export function cuspEnvelopeC(alpha, gamma, sigma, J = 6) {
  let re = 0, im = 0, nrm = 0;
  for (let j = -J; j <= J; j++) {
    const c = quarticEnvelopeC(alpha - TWO_PI * sigma * j, gamma);
    re += c.re; im += c.im; nrm += Math.exp(-2 * PI * PI * sigma * sigma * j * j);
  }
  return { re: re / nrm, im: im / nrm };
}
/**
 * Theorem A.10 (the cusp).  At t = T_sr = πn̄⁵ the cubic phase is an exact multiple of 2π for every integer k, and
 * the quadratic one is too iff 4 | n̄; what survives is the QUARTIC, strength γ_sr = 5πσ⁴/2n̄, so the superrevival
 * envelope is a Pearcey function (cusp caustic) where the revival's is an Airy function (fold).
 *   n̄ ≡ 0 (mod 4): full — the plain quartic envelope (MEASURED to 1.3e-6 at n̄ = 2000, σ = 3).
 *   n̄ ≡ 2 (mod 4): the quadratic collapses to (−1)^k = a shift of the classical phase by π: two lobes half a
 *                  classical period apart, envelope at α = πσ (MEASURED to ~10%: the quintic is the residue).
 *   n̄ odd:         the quadratic is a quarter-integer and k² mod 4 is not affine in k — a fractional revival.
 * The neglected term is the quintic, strength γ₅ = 3πσ⁵/n̄²; the cusp picture is trustworthy while γ₅ ≲ 0.02.
 */
export function superrevival(nbar, sigma) {
  const cls = ((nbar % 4) + 4) % 4;
  const gamma = 5 * PI * Math.pow(sigma, 4) / (2 * nbar), quintic = 3 * PI * Math.pow(sigma, 5) / (nbar * nbar);
  const E0 = cuspEnvelopeC(0, gamma, sigma), Eh = cuspEnvelopeC(PI * sigma, gamma, sigma);
  let predicted;
  if (cls === 0) predicted = Math.hypot(E0.re, E0.im);
  else if (cls === 2) predicted = Math.hypot(Eh.re, Eh.im);
  else {
    // odd n̄: TWO phases survive at T_sr.  The quadratic is e^{i(π/2)wk²}, w = 3n̄ mod 4 ∈ {1, 3}; since k² ≡ k
    // (mod 2) its Gauss sum splits exactly, e^{i(π/2)wk²} = A + B(−1)^k with A = (1 + i^w)/2, B = (1 − i^w)/2.
    // The LINEAR phase −πn̄²k is also π·k for odd n̄ — one more (−1)^k — so A pairs with the shifted envelope and
    // B with the plain one: two lobes half a classical period apart, and w decides which is the taller.
    const s = ((3 * nbar) % 4 === 1) ? 1 : -1;                  // i^w = ±i
    const ar = 0.5, ai = 0.5 * s, br = 0.5, bi = -0.5 * s;
    predicted = Math.hypot(ar * Eh.re - ai * Eh.im + br * E0.re - bi * E0.im, ar * Eh.im + ai * Eh.re + br * E0.im + bi * E0.re);
  }
  return { Tsr: PI * Math.pow(nbar, 5), T4: 4 * PI * Math.pow(nbar, 6) / 5, gamma, quintic, cls,
    kind: cls === 0 ? 'full' : cls === 2 ? 'half-shifted' : 'fractional', predicted,
    trustworthy: quintic < 0.02,
    note: cls === 0 ? 'quadratic and cubic phases both vanish: the pure cusp'
      : cls === 2 ? 'the quadratic collapses to (−1)^k: two lobes half a classical period apart'
      : 'the quadratic is a quarter-integer: k² mod 4 is not affine in k — a fractional revival' };
}
/**
 * Theorem A.11 (the Korselt law of deafness).  A degree-p phase 2π(a/b)m^p is affine on ℤ — invisible to the revival,
 * absorbed by the classical phase — iff m^p ≡ m (mod b) for every m, iff b is squarefree with (q−1) | (p−1) for every
 * prime q | b.  For odd p that modulus is the DENOMINATOR OF B_{p−1} (von Staudt–Clausen):
 *   p = 2 → 2 · p = 3 → 6 (the print's Theorem A.5) · p = 5 → 30 · p = 7 → 42.
 */
export function korseltModulus(p) {
  let b = 1;
  for (let q = 2; q <= 64; q++) {
    let prime = true; for (let d = 2; d * d <= q; d++) if (q % d === 0) { prime = false; break; }
    if (prime && (p - 1) % (q - 1) === 0) b *= q;
  }
  return b;
}
/** the deafness verdict of the degree-p clock for a comb of spacing d at centre n̄ (p = 3 is the print's Theorem A.5) */
export function clockDeafness(nbar, d, p = 3) {
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  const num = { 2: 3 * d * d, 3: 4 * d * d * d, 4: 5 * d * d * d * d }[p] || 0;
  const den = { 2: 4 * nbar, 3: 3 * nbar, 4: 4 * nbar * nbar }[p] || 1;
  const g = gcd(num, den) || 1, a = num / g, b = den / g, K = korseltModulus(p);
  return { p, a, b, K, deaf: K % b === 0, fraction: `${a}/${b}` };
}
/**
 * Theorem A.9 (the saddle ladder).  The envelope ∫e^{−u²/2 + iγ u^p} has the Gaussian saddle u = 0 and the saddles
 * u^{p−2} = 1/(ipγ); their action difference is the singulant that fixes the large-order growth of EVERY observable
 * of the integral (which is why Ω₄′ holds):  ΔS_p = (1/2 − 1/p)u₂²,  |ΔS_p| = ((p−2)/2p)(pγ)^{−2/(p−2)}.
 * p = 3 gives 1/(54β²) — the print's Borel pole at β² = −1/54, DERIVED here rather than fitted — and p = 4 gives i/(16γ).
 */
export function saddleSingulant(p, gamma) {
  return { abs: ((p - 2) / (2 * p)) * Math.pow(p * gamma, -2 / (p - 2)),
    constant: p === 3 ? 54 : p === 4 ? 16 : (2 * p / (p - 2)) * Math.pow(p, 2 / (p - 2)) };
}
