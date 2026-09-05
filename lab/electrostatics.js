/* electrostatics.js — THE FIELD of the register's charge: the Coulomb potential of |ψ|² in closed form, the field
 * lines of E = −∇Φ and of the probability current j = Im(ψ*∇ψ), the Biot–Savart field of j at the nucleus and on the
 * axis, and the Hellmann–Feynman force on a proton of the lab's H₂⁺ with its Pulay term and the Pulay bound.  Atomic
 * units throughout (Φ in hartree/e, E in hartree/(e·a₀), j in 1/(a₀²·t_au)); B in tesla.
 *
 * THE MATHS (research/MATH-FIELDS-AND-MOLECULES-2026-09-04.md: Round 1 A.2, Sol Q1, Sol Q5, Round 3 §3.2, SYNTHESIS).
 *   The register's radial functions are exactly  R_a(r) = e^{−r/n_a} Σ_j p^{(a)}_j r^{l_a+j},  p_j = N_{nl} (−1)^j/j! ·
 *   C(n+l, k−j) (2/n)^{l+j}, k = n−l−1  — the coefficients are taken from hydrogen.js's own laguerreCoeffs/radialNorm, so
 *   the convention is the register's by construction.  The density of Σ c_a ψ_a is Σ_ab c_a c_b* R_a R_b Y_a Y_b*, and
 *   Y_a Y_b* = Σ_L G^{LM}_{ab} Y_LM (Gaunt, M = m_a − m_b, |l_a−l_b| ≤ L ≤ l_a+l_b, l_a+l_b+L even) — G is computed here
 *   as 2π ∫ Θ_a Θ_b Θ_LM dx by Gauss–Legendre on the register's own Θ_lm (exact: the integrand is a polynomial of degree
 *   ≤ 20).  So ρ = Σ_LM ρ_LM(r) Y_LM with ρ_LM = Σ_β e^{−βr} Σ_q C^{LM}_{βq} r^q, β = 1/n_a + 1/n_b, q ≤ 10, L ≤ 10, and
 *   at most 121 complex slots (M ≥ 0 stored; ρ real gives ρ_{L,−M} = (−1)^M ρ_LM*).  The electron potential is then
 *       Φ_e(r) = −Σ_LM (4π/(2L+1)) Y_LM(r̂) Σ_βq C^{LM}_{βq} [ I_{q+L+3}(r) r^{−L−1} + r^L J_{q+2−L}(r) ],
 *   I_n(r) = ∫₀^r t^{n−1}e^{−βt}dt = γ(n,βr)/βⁿ,  J_n(r) = ∫_r^∞ t^{n−1}e^{−βt}dt = Γ(n,βr)/βⁿ — integer orders, so
 *   exponential × finite polynomial.  I_n is taken by the convergent series at the top order and the (stable) downward
 *   recurrence, J_n by the upward one: the "1 − e^{−x}Σ" form of γ loses every digit at small βr for L ~ 10 and is not
 *   used.  dΦ_LM/dr = Σ_q C_q [ −(L+1) I r^{−L−2} + L r^{L−1} J ] (the two e^{−βr} terms cancel exactly), so E is analytic.
 *   Z ≠ 1 is the dilation ψ → Z^{3/2} ψ(Zx): p_j → Z^{3/2+l+j} p_j, β → Zβ; the nucleus contributes +Z/r.
 *   ∇ψ is analytic too: ψ_a = e^{−βr}P_a(r) Θ_a(θ) e^{imφ} with Θ = ±ylmNorm · sin^{|m|}θ · (d^{|m|}P_l/dx^{|m|})(cos θ)
 *   (the modeTable record), so ∂_θΘ and Θ/sin θ are polynomials in (sin θ, cos θ) — no division on the axis.
 *   Biot–Savart for an electron (charge −e):  B(x) = (μ₀e/4π) ∫ j(x′) × (x′ − x)/|x′ − x|³ d³x′; in a.u. the prefactor is
 *   μ₀eħ/(4π m_e a₀³) = 12.516824431 T (CODATA 2018).  The 1/|x′−x|² singularity is removed by a spherical quadrature
 *   CENTRED ON THE OBSERVATION POINT, x′ = x + s ŝ, where d³x′/|x′−x|² = ds dΩ (the same trick P7 used for the force).
 *   For 2p₊1 the ledger's closed form is B_z(z) = −12.516824431/24 · [γ(5,z)/z³ + Γ(2,z)] T: −0.521534351 T at the
 *   nucleus (the orbital hyperfine field), −0.429533192 T at 1 a₀ — the gates.
 *   H₂⁺ (lab/molecule.js: 1s LCAO, protons at ±R/2 ẑ, S, J, K, E_g).  The force on proton B from the electron density
 *   F_elec = ∫ ρ (z − z_B)/r_B³ d³x = [ −q_enc(R)/R² + 2 F_ab ]/(2(1+S)) with q_enc = 1 − e^{−2R}(1 + 2R + 2R²) (Gauss's
 *   law for |1s_A|²; |1s_B|² exerts nothing) and the cross term by the identity F_ab = d⟨a|1/r_B|b⟩/dR − ⟨a|cos θ_B/r_B|b⟩
 *   = −R e^{−R} + (R²/2) I_ξ(R),  I_ξ = ∫₁^∞ e^{−Rξ} [2(2ξ²−1) − 2ξ(ξ²−1) ln((ξ+1)/(ξ−1))] dξ (prolate coordinates).
 *   The variational force is −dE_g/dR (central differences of energies(R)); the Pulay term F_HF − (−dE/dR) is also
 *   computed INDEPENDENTLY as 2⟨∂_Rψ|(H − E)ψ⟩ = −(2/N²)[⟨∂_z a|a/r_B⟩ + ⟨∂_z a|b/r_A⟩] − 2S′(J+K)/(N²(1+S)) with
 *   ⟨∂_z a|a/r_B⟩ = −q_enc/(2R²), ⟨∂_z a|b/r_A⟩ = −(R²/2) I_ξ, N² = 2(1+S), for the symmetric motion (nuclei at ±R/2).
 *   Opus's bound |Pulay| ≤ 2‖∂_Rψ‖‖(H−E)ψ‖ (Cauchy–Schwarz) uses ‖∂_Rψ‖² = (2/3 + 2S″)/(4N²) − (S′/N²)² (the component
 *   orthogonal to ψ, i.e. the normalised derivative) and ‖(H−E)ψ‖² = [2⟨a|1/r_B²|a⟩ + 4e^{−R}]/N² − (½ + E_el)², with
 *   ⟨a|1/(r_A r_B)|b⟩ = 2e^{−R} exactly and ⟨a|1/r_B²|a⟩ = (2/R)∫₀^∞ r e^{−2r} ln((r+R)/|r−R|) dr (one quadrature).
 *   At R = 2: F_elec = −0.13390616, −dE/dR = 0.05380439, Pulay = 0.06228945, bound = 0.10202406 — the ledger's numbers.
 *
 * STATUS: EXACT ANALYTIC for Φ, E, j and the multipole table (finite closed forms; DERIVED-HERE, Sol Q1 / Round 1 A.2);
 * NUMERICAL for B (observation-centred Gauss–Legendre quadrature, ~1e-9 T for n ≤ 2 on the axis; the near/far orders of
 * wave 42 hold a 12-term state's B_z to 1e-9 T at a third of the cost), for the contours
 * (marching squares with secant-polished crossings) and the streamlines (RK4); the H₂⁺ numbers are EXACT up to two
 * smooth 1-D quadratures (~1e-10) and one central difference (~1e-9).  KNOWN: the Hellmann–Feynman theorem (Feynman
 * 1939), the Pulay force (Pulay 1969), Gauss's law; the B prefactor from CODATA 2018.
 */
import { BASIS, radialNorm, laguerreCoeffs, legendreDerivCoeffs, ylmNorm, legendreP, factorial } from './hydrogen.js';
import { overlapS, coulombJ, resonanceK, energies } from './molecule.js';

const PI = Math.PI, FOUR_PI = 4 * Math.PI;
/* CODATA 2018: μ₀, e, ħ, m_e, a₀ → the tesla of a unit atomic current moment, μ₀eħ/(4π m_e a₀³) */
const MU0 = 1.25663706212e-6, E_CH = 1.602176634e-19, HBAR = 1.054571817e-34, M_E = 9.1093837139e-31, A0 = 5.29177210544e-11;
export const B_TESLA = MU0 * E_CH * HBAR / (4 * PI * M_E * A0 ** 3);       // 12.516824431 T

/* ── Gauss–Legendre nodes on [−1, 1] (Newton on P_n; cached) ─────────────────────────────────────────────────────── */
const GL = new Map();
export function gaussLegendre(n) {
  if (GL.has(n)) return GL.get(n);
  const x = new Float64Array(n), w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let z = Math.cos(PI * (i + 0.75) / (n + 0.5)), dp = 0;
    for (let it = 0; it < 100; it++) {
      let p0 = 1, p1 = z;
      for (let k = 2; k <= n; k++) { const p2 = ((2 * k - 1) * z * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; }
      dp = n * (z * p1 - p0) / (z * z - 1);
      const dz = p1 / dp; z -= dz; if (Math.abs(dz) < 1e-15) break;
    }
    x[i] = z; w[i] = 2 / ((1 - z * z) * dp * dp);
  }
  const out = { x, w }; GL.set(n, out); return out;
}
/** ∫_a^b f by n-point Gauss–Legendre on the panels [b₀,b₁], [b₁,b₂], … */
function panelIntegral(f, bounds, n) {
  const { x, w } = gaussLegendre(n); let s = 0;
  for (let p = 0; p + 1 < bounds.length; p++) { const a = bounds[p], b = bounds[p + 1], h = (b - a) / 2, c = (a + b) / 2; for (let i = 0; i < n; i++) s += w[i] * h * f(c + h * x[i]); }
  return s;
}

/* ── the register's radial and angular polynomials ────────────────────────────────────────────────────────────────── */
/** R_nl(r) = e^{−βr} Σ_j p[j] r^{l+j} with the dilation Z: p_j → Z^{3/2+l+j} p_j, β = Z/n */
export function radialPoly(n, l, Z = 1) {
  const lag = laguerreCoeffs(n - l - 1, 2 * l + 1), N = radialNorm(n, l), p = new Float64Array(lag.length);
  for (let j = 0; j < lag.length; j++) p[j] = N * lag[j] * Math.pow(2 / n, l + j) * Math.pow(Z, 1.5 + l + j);
  return { n, l, beta: Z / n, p };
}
/** Θ_lm(x = cos θ), the real part of Y_lm with e^{imφ} removed, in the register's convention (Y_l^{−m} = (−1)^m Y_l^{m*}) */
function thetaLM(l, m, x) { const am = Math.abs(m); const v = ylmNorm(l, am) * legendreP(l, am, x); return (m < 0 && am % 2) ? -v : v; }
/** the angular record of modeTable: Θ = norm · sin^{|m|}θ · Q(cos θ), Q = d^{|m|}P_l/dx^{|m|} */
function angularRecord(l, m) {
  const am = Math.abs(m), Q = legendreDerivCoeffs(l, am), sign = (m >= 0 && am % 2 === 1) ? -1 : 1;
  return { l, m, am, Q, norm: sign * ylmNorm(l, am) };
}
/** Θ, ∂Θ/∂θ and Θ/sin θ from the record at (cos θ, sin θ) — polynomials in (ct, st), finite on the axis */
function thetaFuncs(A, ct, st) {
  let Qv = 0, Qd = 0, xp = 1;
  for (let k = 0; k < A.Q.length; k++) { Qv += A.Q[k] * xp; if (k + 1 < A.Q.length) Qd += (k + 1) * A.Q[k + 1] * xp; xp *= ct; }
  let sm1 = 1; for (let i = 1; i < A.am; i++) sm1 *= st;                       // sin^{|m|−1}θ (1 when |m| ≤ 1)
  const sm = A.am ? sm1 * st : 1;                                             // sin^{|m|}θ
  const T = A.norm * sm * Qv;
  const dT = A.am ? A.norm * (A.am * sm1 * ct * Qv - sm * st * Qd) : -A.norm * st * Qd;
  const Ts = A.am ? A.norm * sm1 * Qv : 0;
  return { T, dT, Ts };
}
/** the Gaunt coefficient G^{LM}_{ab} = ∫ Y_a Y_b* Y_LM* dΩ, M = m_a − m_b (exact: 16-point GL on a degree ≤ 20 polynomial) */
export function gaunt(la, ma, lb, mb, L) {
  const M = ma - mb; if (Math.abs(M) > L) return 0;
  const { x, w } = gaussLegendre(16); let s = 0;
  for (let i = 0; i < 16; i++) s += w[i] * thetaLM(la, ma, x[i]) * thetaLM(lb, mb, x[i]) * thetaLM(L, M, x[i]);
  return 2 * PI * s;
}

/* ── the multipole table ρ_LM(r) = Σ_β e^{−βr} Σ_q C_q r^q ───────────────────────────────────────────────────────── */
/**
 * multipoles(terms, {Z}) — terms = [{ a, re, im }], a the index in BASIS, (re, im) the complex coefficient.
 * Returns { Z, slots: [{ L, M, key, terms: [{ na, nb, beta, qmin, qmax, re: Float64Array, im: Float64Array }] }], … }
 * with M ≥ 0 only (the M < 0 slots are the conjugates: ρ_{L,−M} = (−1)^M ρ_LM*), sorted by (L, M).
 */
export function multipoles(terms, { Z = 1 } = {}) {
  const T = terms.map((t) => { const s = BASIS[t.a]; if (!s) throw new Error('electrostatics: bad label index ' + t.a); return { s, re: +t.re || 0, im: +t.im || 0, R: radialPoly(s.n, s.l, Z) }; });
  const slots = new Map();
  for (const A of T) for (const B of T) {
    const M = A.s.m - B.s.m; if (M < 0) continue;
    const cr = A.re * B.re + A.im * B.im, ci = A.im * B.re - A.re * B.im;        // c_a c_b*
    if (cr === 0 && ci === 0) continue;
    const la = A.s.l, lb = B.s.l, qlo = la + lb, pa = A.R.p, pb = B.R.p;
    const D = new Float64Array(pa.length + pb.length - 1);                       // D_q, q = qlo + j + k
    for (let j = 0; j < pa.length; j++) for (let k = 0; k < pb.length; k++) D[j + k] += pa[j] * pb[k];
    const na = A.s.n, nb = B.s.n, bkey = Math.min(na, nb) + ':' + Math.max(na, nb), beta = A.R.beta + B.R.beta;
    for (let L = Math.abs(la - lb); L <= la + lb; L += 2) {
      if (L < M) continue;
      const G = gaunt(la, A.s.m, lb, B.s.m, L); if (Math.abs(G) < 1e-15) continue;
      const key = L + ':' + M;
      let slot = slots.get(key); if (!slot) { slot = { L, M, key, terms: new Map() }; slots.set(key, slot); }
      let tm = slot.terms.get(bkey);
      if (!tm) { tm = { na: Math.min(na, nb), nb: Math.max(na, nb), beta, qmin: 99, qmax: -1, re: new Float64Array(11), im: new Float64Array(11) }; slot.terms.set(bkey, tm); }
      for (let d = 0; d < D.length; d++) { const q = qlo + d, v = G * D[d]; if (v === 0) continue; tm.re[q] += cr * v; tm.im[q] += ci * v; if (q < tm.qmin) tm.qmin = q; if (q > tm.qmax) tm.qmax = q; }
    }
  }
  const out = [...slots.values()].sort((p, q) => p.L - q.L || p.M - q.M).map((s) => ({ L: s.L, M: s.M, key: s.key, terms: [...s.terms.values()].filter((t) => t.qmax >= 0) }));
  let Lmax = 0, Mmax = 0, nTerms = 0; for (const s of out) { Lmax = Math.max(Lmax, s.L); Mmax = Math.max(Mmax, s.M); nTerms += s.terms.length; }
  return { Z, slots: out, count: out.length, Lmax, Mmax, nTerms, labels: T.map((t) => t.s.label) };
}

/** I_n(r) = ∫₀^r t^{n−1}e^{−βt}dt for n = 1…N and J_n(r) = ∫_r^∞ for n = 1…NJ, filled into I[1..N], J[1..NJ] (stable) */
function shellIntegrals(beta, r, N, NJ, I, J) {
  const x = beta * r, ex = Math.exp(-x);
  /* J upward: J_1 = e^{−βr}/β, J_n = r^{n−1}e^{−βr}/β + (n−1)/β · J_{n−1} — every term positive */
  let rp = 1; J[1] = ex / beta;
  const top = Math.max(NJ, N);
  for (let n = 2; n <= top; n++) { rp *= r; J[n] = (rp * ex + (n - 1) * J[n - 1]) / beta; }
  /* I_N: the series γ(N,x) = x^N e^{−x} Σ_k x^k/(N(N+1)…(N+k)) for x < N, else (N−1)!/βᴺ − J_N (no cancellation there) */
  if (x < N) {
    let term = 1 / N, sum = term;
    for (let k = 1; k < 400; k++) { term *= x / (N + k); sum += term; if (term < 1e-17 * sum) break; }
    I[N] = Math.pow(r, N) * ex * sum;
  } else I[N] = factorial(N - 1) / Math.pow(beta, N) - J[N];
  /* downward: I_{n−1} = (β I_n + r^{n−1} e^{−βr})/(n−1) — positive terms */
  let rn = Math.pow(r, N - 1);
  for (let n = N; n >= 2; n--) { I[n - 1] = (beta * I[n] + rn * ex) / (n - 1); rn /= r; }
}

/** the radial panels of an observation-centred quadrature: fine around s = d (the sphere through the nucleus), then out to d + rMax */
export function radialPanels(d, rMax) {
  const b = [0]; if (d > 1e-9) for (const dl of [-1, -0.3, 0, 0.3, 1]) if (d + dl > 0) b.push(d + dl);
  for (const s of [3, 8, 20, 45, 90, 180]) if (s < rMax) b.push(d + s);
  b.push(d + rMax);
  return [...new Set(b)].sort((p, q) => p - q);
}

/* ── the field object ─────────────────────────────────────────────────────────────────────────────────────────────── */
/**
 * createElectrostatics(terms, {Z}) → { phi, phiE, E, j, psi, B, bNucleus, bAxis, contours, streamlines, table, meta }
 *   phi(x,y,z)   total potential  +Z/r + Φ_e   (a.u.);   phiE(x,y,z)  the electron part alone
 *   E(x,y,z)     [Ex, Ey, Ez] = −∇phi, analytic;       j(x,y,z)  [jx, jy, jz] = Im(ψ*∇ψ), analytic ∇ψ
 *   B(x,y,z)     [Bx, By, Bz] in tesla by quadrature;  bNucleus() → { Bx, By, Bz, mag };  bAxis(z) → B_z(0,0,z)
 */
export function createElectrostatics(terms, { Z = 1 } = {}) {
  const table = multipoles(terms, { Z });
  /* per β-class: the slots that carry it, with the orders their I/J tables need */
  const classes = new Map();
  const slots = table.slots.map((s) => ({ ...s, ang: angularRecord(s.L, s.M), pref: FOUR_PI / (2 * s.L + 1) }));
  for (const s of slots) for (const t of s.terms) {
    const key = t.na + ':' + t.nb; let c = classes.get(key);
    if (!c) { c = { beta: t.beta, N: 1, NJ: 1, list: [] }; classes.set(key, c); }
    c.N = Math.max(c.N, t.qmax + s.L + 3); c.NJ = Math.max(c.NJ, t.qmax + 2 - s.L); c.list.push({ slot: s, t });
  }
  const CL = [...classes.values()];
  const I = new Float64Array(32), J = new Float64Array(32);
  const nS = slots.length, fr = new Float64Array(nS), fi = new Float64Array(nS), dr = new Float64Array(nS), di = new Float64Array(nS);
  const idx = new Map(slots.map((s, i) => [s.key, i]));
  for (const c of CL) for (const e of c.list) e.i = idx.get(e.slot.key);
  const TT = terms.map((t) => { const s = BASIS[t.a]; return { s, re: +t.re || 0, im: +t.im || 0, R: radialPoly(s.n, s.l, Z), A: angularRecord(s.l, s.m) }; });
  let nmax = 1, mabs = 0; for (const t of TT) { nmax = Math.max(nmax, t.s.n); mabs = Math.max(mabs, Math.abs(t.s.m)); }
  const Lmax = table.Lmax, Mmax = Math.max(table.Mmax, mabs);                 // e^{iMφ} tables serve the slots AND the terms
  const rl = new Float64Array(Lmax + 2), rml = new Float64Array(Lmax + 3);     // r^L, r^{−L−1}
  const cM = new Float64Array(Mmax + 1), sM = new Float64Array(Mmax + 1);
  /** the radial slot functions f_LM(r) and f′_LM(r) (complex) at r — fills fr, fi, dr, di */
  function radialSlots(r) {
    fr.fill(0); fi.fill(0); dr.fill(0); di.fill(0);
    rl[0] = 1; for (let L = 1; L <= Lmax + 1; L++) rl[L] = rl[L - 1] * r;
    rml[0] = 1 / r; for (let L = 1; L <= Lmax + 2; L++) rml[L] = rml[L - 1] / r;
    for (const c of CL) {
      shellIntegrals(c.beta, r, c.N, c.NJ, I, J);
      for (const e of c.list) {
        const L = e.slot.L, t = e.t, i = e.i; let ar = 0, ai = 0, br = 0, bi = 0;
        for (let q = t.qmin; q <= t.qmax; q++) { const In = I[q + L + 3], Jn = J[q + 2 - L]; ar += t.re[q] * In; ai += t.im[q] * In; br += t.re[q] * Jn; bi += t.im[q] * Jn; }
        fr[i] += ar * rml[L] + br * rl[L]; fi[i] += ai * rml[L] + bi * rl[L];
        dr[i] += -(L + 1) * ar * rml[L + 1] + (L ? L * br * rl[L - 1] : 0);
        di[i] += -(L + 1) * ai * rml[L + 1] + (L ? L * bi * rl[L - 1] : 0);
      }
    }
  }
  function geometry(x, y, z) {
    let r = Math.hypot(x, y, z); if (r < 1e-10) r = 1e-10;
    const ct = Math.max(-1, Math.min(1, z / r)), st = Math.sqrt(Math.max(0, 1 - ct * ct));
    const rho = Math.hypot(x, y), cp = rho > 0 ? x / rho : 1, sp = rho > 0 ? y / rho : 0;
    cM[0] = 1; sM[0] = 0; for (let m = 1; m <= Mmax; m++) { cM[m] = cM[m - 1] * cp - sM[m - 1] * sp; sM[m] = sM[m - 1] * cp + cM[m - 1] * sp; }
    return { r, ct, st, cp, sp };
  }
  /** Ψ = Σ (4π/(2L+1)) Re[f_LM Y_LM] (so Φ_e = −Ψ) and its spherical gradient (∂_rΨ, (1/r)∂_θΨ, (1/(r sinθ))∂_φΨ) */
  function sum(g, withGrad) {
    radialSlots(g.r);
    let P = 0, Gr = 0, Gt = 0, Gp = 0;
    for (let i = 0; i < nS; i++) {
      const s = slots[i], M = s.M, A = thetaFuncs(s.ang, g.ct, g.st), c = cM[M], sn = sM[M], k = s.pref * (M ? 2 : 1);
      const ur = fr[i] * c - fi[i] * sn;                                     // Re(f e^{iMφ})
      P += k * A.T * ur;
      if (withGrad) {
        Gr += k * A.T * (dr[i] * c - di[i] * sn);
        Gt += k * A.dT * ur;
        Gp += k * A.Ts * (-M) * (fr[i] * sn + fi[i] * c);                     // ∂_φ Re(f e^{iMφ}) = −M Im(f e^{iMφ})
      }
    }
    return { P, Gr, Gt: Gt / g.r, Gp: Gp / g.r };
  }
  const phiE = (x, y, z) => -sum(geometry(x, y, z), false).P;
  const phi = (x, y, z) => { const g = geometry(x, y, z); return Z / g.r - sum(g, false).P; };
  function E(x, y, z) {
    const g = geometry(x, y, z), S = sum(g, true);
    const Er = S.Gr + Z / (g.r * g.r), Et = S.Gt, Ep = S.Gp;                  // −∇Φ_e = +∇Ψ;  −∇(Z/r) = Z r̂/r²
    return [Er * g.st * g.cp + Et * g.ct * g.cp - Ep * g.sp, Er * g.st * g.sp + Et * g.ct * g.sp + Ep * g.cp, Er * g.ct - Et * g.st];
  }
  /* ψ and ∇ψ, analytic, from the terms; e^{−βr} once per distinct β = Z/n of the state (Biot–Savart calls this ~10⁵ times) */
  const BETAS = [...new Set(TT.map((t) => t.R.beta))], BI = TT.map((t) => BETAS.indexOf(t.R.beta)), EXB = new Float64Array(BETAS.length);
  function psiGrad(x, y, z) {
    const g = geometry(x, y, z), r = g.r;
    let pr = 0, pi = 0, gr_r = 0, gi_r = 0, gr_t = 0, gi_t = 0, gr_p = 0, gi_p = 0;
    for (let k = 0; k < BETAS.length; k++) EXB[k] = Math.exp(-BETAS[k] * r);
    for (let q = 0; q < TT.length; q++) {
      const t = TT[q], { p } = t.R, l = t.s.l, m = t.s.m, ex = EXB[BI[q]];
      let P = 0, dP = 0, rp = 1; for (let i = 0; i < l; i++) rp *= r;      // r^l
      for (let j = 0; j < p.length; j++) { P += p[j] * rp; dP += p[j] * (l + j) * rp; rp *= r; }
      dP /= r;                                                                  // Σ p_j (l+j) r^{l+j−1}
      const R = ex * P, dR = ex * (dP - t.R.beta * P), Rr = l ? R / r : 0;      // R, R′, R/r (∝ r^{l−1}; unused for l = 0)
      const A = thetaFuncs(t.A, g.ct, g.st), am = Math.abs(m);
      const c = cM[am], sn = m >= 0 ? sM[am] : -sM[am];                          // e^{imφ}
      const cr = t.re * c - t.im * sn, ci = t.re * sn + t.im * c;                 // c_a e^{imφ}
      pr += R * A.T * cr; pi += R * A.T * ci;
      gr_r += dR * A.T * cr; gi_r += dR * A.T * ci;
      gr_t += Rr * A.dT * cr; gi_t += Rr * A.dT * ci;
      gr_p += Rr * A.Ts * (-m * ci); gi_p += Rr * A.Ts * (m * cr);               // i m · (c e^{imφ})
    }
    const toCart = (vr, vt, vp) => [vr * g.st * g.cp + vt * g.ct * g.cp - vp * g.sp, vr * g.st * g.sp + vt * g.ct * g.sp + vp * g.cp, vr * g.ct - vt * g.st];
    return { re: pr, im: pi, gre: toCart(gr_r, gr_t, gr_p), gim: toCart(gi_r, gi_t, gi_p) };
  }
  const psi = (x, y, z) => { const p = psiGrad(x, y, z); return { re: p.re, im: p.im }; };
  /** j = Im(ψ*∇ψ) = Re ψ · Im ∇ψ − Im ψ · Re ∇ψ */
  function j(x, y, z) { const p = psiGrad(x, y, z); return [p.re * p.gim[0] - p.im * p.gre[0], p.re * p.gim[1] - p.im * p.gre[1], p.re * p.gim[2] - p.im * p.gre[2]]; }
  /* Biot–Savart by the observation-centred quadrature: B(x) = B_TESLA ∫ (j(x + sŝ) × ŝ) ds dΩ, the pole toward the nucleus.
     On a sphere of radius s ≈ d the cloud is a spike of angular width ~1/(2ds) in cos θ, so cos θ = 1 − 2v⁴, v ∈ [0, 1]:
     then |x + sŝ|² = (d − s)² + 4ds·v⁴ is smooth and even in v and 48 Gauss nodes in v resolve it at any distance. */
  const rMax = nmax * (15 + 2.25 * nmax);                                       // the tail ∫_R^∞ r^{2n}e^{−2r/n} < 1e−9 of the whole
  /* THE ORDERS (wave 42).  The only non-analytic feature of the integrand is the cusp of ψ at the nucleus, which the
     spheres s ≈ d pass through: the NEAR panels (lower edge inside d + 1) take the v⁴ rule in the polar angle with 32
     points; the FAR panels see a smooth cloud and take 24.  In s the integrand is C¹ at s = d (a panel edge) and
     analytic elsewhere, so 10 Gauss points per panel resolve it (a panel is at most a few decay lengths).  On the axis
     the azimuth is exact by trapezoid with 2|m|_max + 4 points: the integrand's highest harmonic is 2|m|_max + 2.  With
     20 × 48 everywhere the two readouts the window asks for cost 200 ms per rebuild on a 12-term state; under these
     orders B_z moves by < 1e-13 T on that state, on 6h₊5, 5g₋4, mixed-m pairs and the whole n = 6 shell at d = 0 … 4,
     and the 2p₊1 anchors by < 1e-12 T (the tests judge the readouts at 1e-9 T against the 20 × 48 rule). */
  function B(x, y, z, { nTheta = 32, nThetaFar = 24, nPhi, nRad = 10, nRadFar = 10 } = {}) {
    if (!TT.length) return [0, 0, 0];
    const d = Math.hypot(x, y, z), onAxis = Math.hypot(x, y) < 1e-12;
    const e3 = d > 1e-12 ? [-x / d, -y / d, -z / d] : [0, 0, 1];
    const a = Math.abs(e3[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    let e1 = [a[1] * e3[2] - a[2] * e3[1], a[2] * e3[0] - a[0] * e3[2], a[0] * e3[1] - a[1] * e3[0]]; const n1 = Math.hypot(...e1); e1 = e1.map((v) => v / n1);
    const e2 = [e3[1] * e1[2] - e3[2] * e1[1], e3[2] * e1[0] - e3[0] * e1[2], e3[0] * e1[1] - e3[1] * e1[0]];
    const NP = nPhi || (onAxis ? 2 * mabs + 4 : 48);
    const bounds = radialPanels(d, rMax);
    let Bx = 0, By = 0, Bz = 0;
    for (let p = 0; p + 1 < bounds.length; p++) {
      const near = bounds[p] < d + 1 - 1e-12, nr = near ? nRad : nRadFar, nt = near ? nTheta : nThetaFar;
      const { x: gx, w: gw } = gaussLegendre(nr), { x: tx, w: tw } = gaussLegendre(nt);
      const h = (bounds[p + 1] - bounds[p]) / 2, c = (bounds[p] + bounds[p + 1]) / 2;
      for (let i = 0; i < nr; i++) { const s = c + h * gx[i], ws = gw[i] * h;
        for (let k = 0; k < nt; k++) { const v = 0.5 + 0.5 * tx[k], ct = 1 - 2 * v ** 4, st = Math.sqrt(Math.max(0, 1 - ct * ct)), wk = ws * 0.5 * tw[k] * 8 * v * v * v * (2 * PI / NP);
          for (let q = 0; q < NP; q++) { const ph = 2 * PI * (q + 0.5) / NP, cp = Math.cos(ph), sp = Math.sin(ph);
            const sx = st * cp * e1[0] + st * sp * e2[0] + ct * e3[0], sy = st * cp * e1[1] + st * sp * e2[1] + ct * e3[1], sz = st * cp * e1[2] + st * sp * e2[2] + ct * e3[2];
            const J = j(x + s * sx, y + s * sy, z + s * sz);
            Bx += wk * (J[1] * sz - J[2] * sy); By += wk * (J[2] * sx - J[0] * sz); Bz += wk * (J[0] * sy - J[1] * sx);
          } } }
    }
    return [B_TESLA * Bx, B_TESLA * By, B_TESLA * Bz];
  }
  const bNucleus = (opts) => { const v = B(0, 0, 0, opts); return { Bx: v[0], By: v[1], Bz: v[2], mag: Math.hypot(v[0], v[1], v[2]) }; };
  const bAxis = (z, opts) => B(0, 0, z, opts)[2];
  const self = { phi, phiE, E, j, psi, B, bNucleus, bAxis, table, Z, terms: TT.map((t) => ({ a: t.s.index, label: t.s.label, re: t.re, im: t.im })), rMax,
    meta: { slots: table.count, Lmax: table.Lmax, Mmax: table.Mmax, betaClasses: CL.length, radialTerms: table.nTerms } };
  self.contours = (plane, levels, opts) => contours(self, plane, levels, opts);
  self.streamlines = (plane, field, seeds, opts) => streamlines(self, plane, field, seeds, opts);
  return self;
}

/* ── the stage: a plane {origin, u, v, half, n} → orthonormal frame, world(s, t) ───────────────────────────────────── */
export function planeFrame(plane) {
  const o = plane.origin || [0, 0, 0]; let u = plane.u || [1, 0, 0], v = plane.v || [0, 0, 1];
  const nu = Math.hypot(...u); u = u.map((c) => c / nu);
  const d = v[0] * u[0] + v[1] * u[1] + v[2] * u[2]; v = v.map((c, i) => c - d * u[i]); const nv = Math.hypot(...v); v = v.map((c) => c / nv);
  const half = plane.half ?? plane.halfWidth ?? plane['half-width'] ?? 16, n = plane.n || 96;
  return { o, u, v, half, n, world: (s, t) => [o[0] + s * u[0] + t * v[0], o[1] + s * u[1] + t * v[1], o[2] + s * u[2] + t * v[2]] };
}

/** contours(field, plane, levels, {which:'phi'|'phiE', polish}) → { levels: [{ level, lines: [[[s,t],…],…] }], samples, n, half }
 *  Marching squares on an n×n sample of Φ in the plane (plane coordinates s, t ∈ [−half, half]); each crossing is linearly
 *  interpolated and then polished by two secant steps on Φ itself, so the polylines sit on the level set to ~1e-8. */
export function contours(field, plane, levels, { which = 'phi', polish = true } = {}) {
  const F = planeFrame(plane), n = F.n, half = F.half, f = which === 'phiE' ? field.phiE : field.phi;
  const coord = (i) => -half + 2 * half * i / (n - 1), val = (s, t) => f(...F.world(s, t));
  const samples = new Float64Array(n * n);
  for (let jy = 0; jy < n; jy++) for (let ix = 0; ix < n; ix++) samples[jy * n + ix] = val(coord(ix), coord(jy));
  const at = (i, jy) => samples[jy * n + i];
  const SEG = [[], [[3, 0]], [[0, 1]], [[3, 1]], [[1, 2]], null, [[0, 2]], [[3, 2]], [[2, 3]], [[0, 2]], null, [[1, 2]], [[1, 3]], [[0, 1]], [[3, 0]], []];
  const out = [];
  for (const lv of (Array.isArray(levels) ? levels : [levels])) {
    const pts = new Map(), segs = [];
    const cross = (key, i0, j0, i1, j1) => {
      if (pts.has(key)) return;
      const f0 = at(i0, j0) - lv, f1 = at(i1, j1) - lv; let tt = f0 / (f0 - f1);
      const s0 = coord(i0), t0 = coord(j0), s1 = coord(i1), t1 = coord(j1);
      if (polish) { let a = 0, b = 1, fa = f0, fb = f1; for (let it = 0; it < 3; it++) { const fm = val(s0 + tt * (s1 - s0), t0 + tt * (t1 - t0)) - lv; if (!isFinite(fm) || fm === 0) break; if ((fm < 0) === (fa < 0)) { a = tt; fa = fm; } else { b = tt; fb = fm; } const nt = a + (b - a) * fa / (fa - fb); if (!(nt > a && nt < b)) break; tt = nt; } }
      pts.set(key, [s0 + tt * (s1 - s0), t0 + tt * (t1 - t0)]);
    };
    for (let jy = 0; jy + 1 < n; jy++) for (let i = 0; i + 1 < n; i++) {
      const c0 = at(i, jy), c1 = at(i + 1, jy), c2 = at(i + 1, jy + 1), c3 = at(i, jy + 1);
      if (![c0, c1, c2, c3].every(isFinite)) continue;
      const code = (c0 > lv ? 1 : 0) | (c1 > lv ? 2 : 0) | (c2 > lv ? 4 : 0) | (c3 > lv ? 8 : 0);
      if (code === 0 || code === 15) continue;
      let list = SEG[code];
      if (!list) { const centre = (c0 + c1 + c2 + c3) / 4 > lv; list = code === 5 ? (centre ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]]) : (centre ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]]); }
      const ekey = (e) => e === 0 ? 'h' + i + ',' + jy : e === 1 ? 'v' + (i + 1) + ',' + jy : e === 2 ? 'h' + i + ',' + (jy + 1) : 'v' + i + ',' + jy;
      const mk = (e) => { const k = ekey(e); if (e === 0) cross(k, i, jy, i + 1, jy); else if (e === 1) cross(k, i + 1, jy, i + 1, jy + 1); else if (e === 2) cross(k, i, jy + 1, i + 1, jy + 1); else cross(k, i, jy, i, jy + 1); return k; };
      for (const [ea, eb] of list) segs.push([mk(ea), mk(eb)]);
    }
    /* chain the segments into polylines through their shared edge keys */
    const adj = new Map(); segs.forEach((sg, id) => { for (const k of sg) { if (!adj.has(k)) adj.set(k, []); adj.get(k).push(id); } });
    const used = new Uint8Array(segs.length), lines = [];
    const walk = (id, key) => { const chain = []; let cur = id, k = key; while (true) { used[cur] = 1; const sg = segs[cur]; k = sg[0] === k ? sg[1] : sg[0]; chain.push(k); const nxt = (adj.get(k) || []).find((o) => !used[o]); if (nxt === undefined) break; cur = nxt; } return chain; };
    for (let id = 0; id < segs.length; id++) {
      if (used[id]) continue;
      const [ka, kb] = segs[id]; used[id] = 1;
      const fwd = walk(id, ka), keys = [ka, ...fwd];
      used[id] = 0; const back = walk(id, kb); used[id] = 1;
      const all = [...back.slice(1).reverse(), ...keys].filter((k, i, arr) => i === 0 || k !== arr[i - 1]);
      const closed = all.length > 2 && all[0] === all[all.length - 1];
      lines.push({ closed, points: all.map((k) => pts.get(k)) });
    }
    out.push({ level: lv, lines: lines.map((l) => l.points), closed: lines.map((l) => l.closed) });
  }
  return { levels: out, samples, n, half, frame: F };
}

/** streamlines(field, plane, 'E'|'j', seeds, {step, maxSteps, dir: 1|−1|'both', rmin}) → [{ seed, points: [[s,t],…], closed, stop }]
 *  RK4 on the unit tangent of the field's in-plane projection (so each step advances `step` a₀ along the line), from
 *  seeds in plane coordinates; stops at the stage edge, at a null of the field, within rmin of the nucleus, on closing. */
export function streamlines(field, plane, which, seeds, { step, maxSteps = 4000, dir = 'both', rmin = 0.05, eps = 1e-14 } = {}) {
  const F = planeFrame(plane), h = step || F.half / 150, fn = which === 'j' ? field.j : field.E;
  const tangent = (s, t) => { const P = F.world(s, t), v = fn(P[0], P[1], P[2]); const a = v[0] * F.u[0] + v[1] * F.u[1] + v[2] * F.u[2], b = v[0] * F.v[0] + v[1] * F.v[1] + v[2] * F.v[2]; const m = Math.hypot(a, b); return !(m >= eps) ? null : [a / m, b / m]; };
  const trace = (s, t, sign) => {
    const pts = [[s, t]]; let stop = 'steps', closed = false;
    for (let k = 0; k < maxSteps; k++) {
      const k1 = tangent(s, t); if (!k1) { stop = 'null'; break; }
      const k2 = tangent(s + sign * h / 2 * k1[0], t + sign * h / 2 * k1[1]); if (!k2) { stop = 'null'; break; }
      const k3 = tangent(s + sign * h / 2 * k2[0], t + sign * h / 2 * k2[1]); if (!k3) { stop = 'null'; break; }
      const k4 = tangent(s + sign * h * k3[0], t + sign * h * k3[1]); if (!k4) { stop = 'null'; break; }
      s += sign * h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); t += sign * h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      pts.push([s, t]);
      if (Math.abs(s) > F.half || Math.abs(t) > F.half) { stop = 'edge'; break; }
      const P = F.world(s, t); if (Math.hypot(P[0], P[1], P[2]) < rmin) { stop = 'nucleus'; break; }
      if (k > 10 && Math.hypot(s - pts[0][0], t - pts[0][1]) < h) { closed = true; stop = 'closed'; pts.push(pts[0]); break; }
    }
    return { pts, stop, closed };
  };
  return seeds.map(([s, t]) => {
    if (dir === 'both') { const f = trace(s, t, 1), b = trace(s, t, -1); if (f.closed) return { seed: [s, t], points: f.pts, closed: true, stop: f.stop }; return { seed: [s, t], points: [...b.pts.slice(1).reverse(), ...f.pts], closed: false, stop: [b.stop, f.stop] }; }
    const r = trace(s, t, dir < 0 ? -1 : 1); return { seed: [s, t], points: r.pts, closed: r.closed, stop: r.stop };
  });
}

/* ── H₂⁺: the Hellmann–Feynman force on a proton, the Pulay term, the Pulay bound ──────────────────────────────────── */
/** I_ξ(R) = ∫₁^∞ e^{−Rξ} [2(2ξ²−1) − 2ξ(ξ²−1) ln((ξ+1)/(ξ−1))] dξ — the η-integrated prolate kernel of ⟨a|cos θ_B/r_B|b⟩ */
export function xiIntegral(R) {
  const g = (xi) => Math.exp(-R * xi) * (2 * (2 * xi * xi - 1) - 2 * xi * (xi * xi - 1) * Math.log((xi + 1) / (xi - 1)));
  const top = 1 + 60 / R, b = [1, 1.005, 1.02, 1.06, 1.15, 1.35, 1.7, 2.4, 3.6, 5.5, 8.5, 13, 20, 32, 50];
  return panelIntegral(g, [...b.filter((v) => v < top), top], 24);
}
/** ⟨1s_A|1/r_B²|1s_A⟩ = (2/R)∫₀^∞ r e^{−2r} ln((r+R)/|r−R|) dr, the log singularity absorbed by r = R ∓ t².  On the left
 *  branch r = R − t² the density r e^{−2r} lives at r ≲ 5, i.e. at t ∈ [√(R−5), √R] — a sliver of width ~2.5/√R at the
 *  END of the t range, which the fixed edges 0.02 … 0.6 never saw: 1.6e-4 relative at R = 40, 8e-3 at R = 60, and the
 *  Pulay bound clipped to 0 there (the reviewer's finding, wave 42).  Panel edges now sit at t = √(R − r) for r = 8, 2, 0. */
export function inverseSquareIntegral(R) {
  const f = (r) => r * Math.exp(-2 * r) * Math.log((r + R) / Math.abs(r - R));
  const sR = Math.sqrt(R), edges = [0, 0.02, 0.1, 0.3, 0.6, ...[8, 2].filter((v) => v < R).map((v) => Math.sqrt(R - v)), sR];
  const left = panelIntegral((t) => 2 * t * f(R - t * t), edges.map((v) => Math.min(v, sR)).filter((v, i, a) => i === 0 || v > a[i - 1]), 24);
  const right = panelIntegral((t) => 2 * t * f(R + t * t), [0, 0.02, 0.1, 0.3, 0.6, 1, 1.6, 2.5, 4, 6], 24);
  return (2 / R) * (left + right);
}
/**
 * hellmannFeynman(R, {dR}) — H₂⁺ in the lab's 1s LCAO, protons at ±R/2 ẑ, the force on proton B (positive = apart):
 *   F_elec  the electrostatic pull of the electron density on B (closed form + I_ξ), F_nuc = 1/R², F_HF = F_elec + F_nuc,
 *   F_exact = −dE_g/dR by central differences of molecule.js energies(R),
 *   pulay   = 2⟨∂_Rψ|(H−E)ψ⟩ analytic (independent of F_exact); pulayByDifference = F_HF − F_exact (must agree),
 *   bound   = 2‖∂_Rψ‖·‖(H−E)ψ‖ (Cauchy–Schwarz; Opus), with residual = ‖(H−E)ψ‖ and dpsiNorm = ‖∂_Rψ‖.
 */
export function hellmannFeynman(R, { dR = 1e-4 } = {}) {
  const S = overlapS(R), J = coulombJ(R), K = resonanceK(R), N2 = 2 * (1 + S), eR = Math.exp(-R);
  const Eel = -0.5 + (J + K) / (1 + S), Eg = Eel + 1 / R;
  const Sp = eR * (-R / 3 - R * R / 3), Spp = eR * (R * R / 3 - R / 3 - 1 / 3);
  const qenc = 1 - Math.exp(-2 * R) * (1 + 2 * R + 2 * R * R);
  const Ixi = xiIntegral(R);
  const Faa = -qenc / (R * R), Fab = -R * eR + 0.5 * R * R * Ixi;            // |1s_A|² by Gauss; the cross density by the identity
  const F_elec = (Faa + 2 * Fab) / N2, F_nuc = 1 / (R * R), F_HF = F_elec + F_nuc;
  const F_exact = -(energies(R + dR).Eg - energies(R - dR).Eg) / (2 * dR);
  const pulay = -(2 / N2) * (Faa / 2 - 0.5 * R * R * Ixi) - 2 * Sp * (J + K) / (N2 * (1 + S));
  const I2 = inverseSquareIntegral(R), gg = (2 * I2 + 4 * eR) / N2;
  const residual = Math.sqrt(Math.max(0, gg - (0.5 + Eel) * (0.5 + Eel)));
  const dpsiNorm = Math.sqrt(Math.max(0, (2 / 3 + 2 * Spp) / (4 * N2) - (Sp / N2) * (Sp / N2)));
  return { R, Eg, F_elec, F_nuc, F_HF, F_exact, pulay, pulayByDifference: F_HF - F_exact, bound: 2 * dpsiNorm * residual, residual, dpsiNorm, S, J, K, Ixi, I2 };
}
