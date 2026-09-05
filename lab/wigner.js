/* wigner.js — the WIGNER SLICE: the one joint object of position and momentum, cut through the axis.
 *
 * THIS IS A SLICE, NOT A MARGINAL.  What the window draws is
 *
 *     W(z, p_z)  =  W(r, p)  at  x = y = 0,  p_x = p_y = 0,
 *
 * a two-dimensional CUT through the six-dimensional phase-space function
 *
 *     W(r, p) = π⁻³ ∫ ψ*(r + s) ψ(r − s) e^{2i p·s} d³s          (atomic units, ħ = 1)
 *
 * — equivalently Praxmeyer's ∫ d³q/(2π)³ ψ*(r + q/2) e^{iq·p} ψ(r − q/2) with q = 2s.  W is real for every state,
 * it is NOT positive (Dahl & Springborg 1982; the 1s has negative regions), and its exact marginals are ∫W d³p =
 * |ψ(r)|² and ∫W d³r = |φ(p)|².  The double integral OVER THE SLICE is neither: for 1s
 *
 *     ∫∫ W(z, p_z) dz dp_z = 1/π² = 0.10132…,   not 1.
 *
 * The two one-dimensional reductions of the slice ARE certifiable, and they are what the tests judge (DERIVED-HERE):
 *
 *     ∫ W(z, p_z) dp_z = π⁻² ∫ d²s_⊥ ψ*(r + s_⊥) ψ(r − s_⊥)      [ the p_z integral collapses e^{2ip_z s_z} to δ(s_z) ]
 *     ∫ W(z, p_z) dz   = π⁻² ∫ d²k_⊥ φ*(p + k_⊥) φ(p − k_⊥)      [ the dual statement in momentum space ]
 *
 * and for 1s both are closed forms:  ∫W dp_z = e^{−2|z|}(1 + 2|z|)/(2π²),  ∫W dz = 8/(3π³(1 + p_z²)³).
 *
 * THE QUADRATURE (DERIVED-HERE; this is what makes the slice cheap enough to draw).
 * Write s in cylindrical coordinates about the z axis, s = (s_ρ cos φ, s_ρ sin φ, s_z).  With r = (0,0,z) on the
 * axis the two evaluation points are P± = r ± s with
 *     |P±| = d± = √(s_ρ² + w±²),   w± = z ± s_z,   cos θ± = w±/d±,   azimuth(P₊) = φ,  azimuth(P₋) = φ + π.
 * Every register function factorises as ψ_a(P) = A_a(d, cos θ) · s_ρ^{|m|} · e^{i m φ}, so the AZIMUTH IS ANALYTIC:
 *     ∫₀^{2π} e^{−i m_a φ} e^{i m_b (φ+π)} dφ = 2π (−1)^{m} δ_{m_a m_b}
 * — on the axis of the slice ONLY EQUAL-m PAIRS RADIATE INTO W; every |Δm| ≥ 1 pair contributes exactly zero.  What
 * is left is a chord function and one Fourier integral,
 *
 *     W(z, p_z) = Σ_{ab} c_a* c_b ∫ g_ab(z, s_z) e^{2i p_z s_z} ds_z,
 *     g_ab(z, s_z) = (2/π²) (−1)^{m} δ_{m_a m_b} ∫₀^∞ s_ρ^{1+2|m|} A_a(d₊, cos θ₊) A_b(d₋, cos θ₋) ds_ρ,
 *
 * and g does not depend on p_z: ONE chord per (z, s_z) serves the whole momentum row.  The integrand of g has a cusp
 * wherever an evaluation point hits the nucleus (s_ρ = 0 and s_z = ∓z), so the inner integral is taken in the radial
 * variable of the NEARER point — d_N ∈ [|w_N|, ∞), s_ρ ds_ρ = d_N dd_N, the far radius d_F = √(d_N² − w_N² + w_F²)
 * staying smooth — by Gauss–Laguerre scaled to the pair's decay λ = 1/n_a + 1/n_b, and the s_z integral is split at
 * the two cusps: Gauss–Legendre on [−|z|, |z|] (its order raised with the oscillation 4 p_max |z|) and Gauss–Laguerre
 * on each tail.  Cusps become endpoints, nothing is integrated across a kink, and the rule is exponentially
 * convergent in every smooth direction.
 *
 * CONVERGED DIGITS (order 'fine', judged in tests/wigner.test.mjs against Praxmeyer's independent 1-D generator):
 *     W_1s(0, 0)      = 0.0322515344  = 1/π³            to 1e-12
 *     W_1s minimum    = −3.09725752e-4 at (z, p_z) = (1.3295373, 1.3791093)   (Sol Q6, Opus Q6 — both labs)
 * OFF-AXIS (wignerAt) the azimuth is not analytic and the same (s_z, d_N) rule carries a trapezoid in φ, which is
 * spectrally accurate because the integrand is periodic; the axial path is the special case and the two are judged
 * against each other.
 *
 * STATUS: NUMERICAL (quadrature), on EXACT ANALYTIC inputs — the register's own closed-form ψ.  The convention is
 * KNOWN (Wigner 1932; Praxmeyer–Mostowski–Wódkiewicz quant-ph/0504038 for the 1s generator); the pair/chord
 * factorisation, the cusp-adapted rule, the two 1-D slice reductions, the extent cut and the half rule (wave 42:
 * the s_z range is set by the state's peak, not each row's plateau, and g(z, −s) = g(z, s)* halves the chords — the
 * six-term n ≤ 6 slice at the knob's extreme fell from 300 ms to under 100) are DERIVED-HERE.  What is NOT converged
 * at order 'normal': a state with n = 6 labels is truncated at R_ext = 12 n_max = 72 a₀ while r⁵e^{−r/6} still carries
 * 5e-4 of its peak there, so such a slice agrees with the converged rule to ~5e-5 absolute (0.3 % of its maximum) —
 * invisible in ink, stated here, and judged in the tests.
 */
import { BASIS, radialNorm, ylmNorm, laguerreCoeffs, legendreDerivCoeffs, modeTable, orbitalFromTable } from './hydrogen.js';

const PI = Math.PI, PI3 = PI * PI * PI;

/* ── Gauss rules, Newton on the recurrences, cached by order ─────────────────────────────────────────────── */
const LEG_CACHE = new Map(), LAG_CACHE = new Map();
/** Gauss–Legendre on [−1, 1]: ∫f ≈ Σ w_i f(x_i) */
export function gaussLegendre(n) {
  const hit = LEG_CACHE.get(n); if (hit) return hit;
  const x = new Float64Array(n), w = new Float64Array(n), m = (n + 1) >> 1;
  for (let i = 0; i < m; i++) {
    let z = Math.cos(PI * (i + 0.75) / (n + 0.5)), pp = 0;
    for (let it = 0; it < 100; it++) {
      let p1 = 1, p2 = 0;
      for (let j = 0; j < n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j + 1) * z * p2 - j * p3) / (j + 1); }
      pp = n * (z * p1 - p2) / (z * z - 1);
      const z1 = z; z = z1 - p1 / pp;
      if (Math.abs(z - z1) < 1e-15) break;
    }
    x[i] = -z; x[n - 1 - i] = z;
    w[i] = w[n - 1 - i] = 2 / ((1 - z * z) * pp * pp);
  }
  const r = { x, w }; LEG_CACHE.set(n, r); return r;
}
/** Gauss–Laguerre: ∫₀^∞ f(t) e^{−t} dt ≈ Σ w_i f(t_i).  `we` = w_i e^{t_i} (the weight with e^{−t} divided out). */
export function gaussLaguerre(n) {
  const hit = LAG_CACHE.get(n); if (hit) return hit;
  const t = new Float64Array(n), w = new Float64Array(n), we = new Float64Array(n);
  let z = 0;
  for (let i = 0; i < n; i++) {
    if (i === 0) z = 3 / (1 + 2.4 * n);
    else if (i === 1) z += 15 / (1 + 2.5 * n);
    else { const ai = i - 1; z += ((1 + 2.55 * ai) / (1.9 * ai)) * (z - t[i - 2]); }
    let p1 = 1, p2 = 0, pp = 0;
    for (let it = 0; it < 100; it++) {
      p1 = 1; p2 = 0;
      for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1 - z) * p2 - (j - 1) * p3) / j; }
      pp = (n * p1 - n * p2) / z;
      const z1 = z; z = z1 - p1 / pp;
      if (Math.abs(z - z1) < 1e-14 * Math.abs(z)) break;
    }
    /* one final pass to recover p2 = L_{n−1}(z) at the converged node */
    { let a = 1, b = 0; for (let j = 1; j <= n; j++) { const c = b; b = a; a = ((2 * j - 1 - z) * b - (j - 1) * c) / j; } pp = (n * a - n * b) / z; p2 = b; }
    t[i] = z; w[i] = -1 / (pp * n * p2);
    we[i] = -Math.sign(pp * p2) * Math.exp(z - Math.log(Math.abs(pp * n * p2)));   // w e^t without the overflow
  }
  const r = { t, w, we }; LAG_CACHE.set(n, r); return r;
}

/* ── the register's functions, in the form the chord needs ──────────────────────────────────────────────── */
/* ψ_a(P) = A_a(d, c) · s_ρ^{|m|} · e^{i m φ},   A = norm · (2/n)^l · d^{l−|m|} · L^{2l+1}_{n−l−1}(2d/n) · D_{l|m|}(c) · e^{−d/n},
   with norm, L and D exactly hydrogen.js's modeTable record (Condon–Shortley folded into the sign). */
const REC = new Map();
function recOf(a) {
  let R = REC.get(a); if (R) return R;
  const s = BASIS[a], am = Math.abs(s.m);
  const sign = (s.m >= 0 && (am % 2 === 1)) ? -1 : 1;
  R = { a, n: s.n, l: s.l, m: s.m, am, inv: 1 / s.n,
        norm: sign * radialNorm(s.n, s.l) * ylmNorm(s.l, am) * Math.pow(2 / s.n, s.l),
        lag: laguerreCoeffs(s.n - s.l - 1, 2 * s.l + 1), leg: legendreDerivCoeffs(s.l, am) };
  REC.set(a, R); return R;
}
/** A_a(d, c) — the real amplitude with the azimuth and the s_ρ^{|m|} stripped off (see the header); e = e^{−d/n}, computed
 *  once per distinct n of the state and handed in (the chord's inner loop, wave 42) */
function amp(R, d, c, e) {
  const rho = 2 * d * R.inv;
  let L = 0, rp = 1; for (let j = 0; j < R.lag.length; j++) { L += R.lag[j] * rp; rp *= rho; }
  let D = 0, cp = 1; for (let j = 0; j < R.leg.length; j++) { D += R.leg[j] * cp; cp *= c; }
  const k = R.l - R.am;                                   // ≥ 0 always; d^{l−|m|} keeps the d → 0 limit finite
  let dk = 1; for (let i = 0; i < k; i++) dk *= d;
  return R.norm * dk * L * D * e;
}

/* ── the pair list of a state ───────────────────────────────────────────────────────────────────────────── */
/**
 * terms = [{ a, re, im }] → { recs, pairs, axial, lam }.  `pairs` carries the raw coefficient product c_a* c_b for
 * every ordered pair; `axial` is the sub-list with m_a = m_b, already multiplied by the analytic azimuth's
 * 2π(−1)^m/π³ = (2/π²)(−1)^m — every other pair is exactly zero on the slice.
 */
function prepare(terms) {
  const recs = terms.map((t) => recOf(t.a));
  const pairs = [], axial = [];
  let nmax = 1;
  const nset = [], ni = new Int32Array(recs.length);                      // the distinct n of the state: one e^{−d/n} per n per point
  for (let i = 0; i < recs.length; i++) { let k = nset.indexOf(recs[i].n); if (k < 0) { k = nset.length; nset.push(recs[i].n); } ni[i] = k; }
  for (let i = 0; i < terms.length; i++) {
    nmax = Math.max(nmax, recs[i].n);
    for (let j = 0; j < terms.length; j++) {
      const ca = terms[i], cb = terms[j];
      const re = ca.re * cb.re + (ca.im || 0) * (cb.im || 0);                 // Re(c_a* c_b)
      const im = ca.re * (cb.im || 0) - (ca.im || 0) * cb.re;                 // Im(c_a* c_b)
      if (re === 0 && im === 0) continue;
      pairs.push({ i, j, re, im, am: recs[i].am });
      if (recs[i].m === recs[j].m) {                                          // ⟵ the azimuth's δ_{m_a m_b}
        const f = (2 / (PI * PI)) * (recs[i].am % 2 ? -1 : 1);                // (2/π²)(−1)^m
        axial.push({ i, j, re: re * f, im: im * f, am: recs[i].am });
      }
    }
  }
  return { recs, pairs, axial, lam: 2 / nmax, nset, ni };
}

/* ── the chord g(z, s_z) = Σ_ab c_a* c_b g_ab, complex, for the AXIAL slice ─────────────────────────────── */
function chordAxial(S, z, sz, nd, out) {
  const wp = z + sz, wm = z - sz, awp = Math.abs(wp), awm = Math.abs(wm);
  const near = awp <= awm;                                    // integrate in the radius of the NEARER point
  const wN = near ? awp : awm, wF = near ? awm : awp, wN2 = wN * wN, wF2 = wF * wF;
  const { t, we } = gaussLaguerre(nd), lam = S.lam, k = S.recs.length, nn = S.nset.length, nset = S.nset, ni = S.ni;
  let gr = 0, gi = 0;
  /* the scratch arrays are sized to the STATE: a fixed 16 let a 17th term write past the end and W was NaN (wave 42) */
  const Ap = S._Ap || (S._Ap = new Float64Array(k)), Am = S._Am || (S._Am = new Float64Array(k));
  const eP = S._eP || (S._eP = new Float64Array(nn)), eM = S._eM || (S._eM = new Float64Array(nn));
  for (let q = 0; q < nd; q++) {
    const dN = wN + t[q] / lam, sr2 = Math.max(0, dN * dN - wN2), dF = Math.sqrt(sr2 + wF2);
    const dp = near ? dN : dF, dm = near ? dF : dN;
    const cp = dp > 0 ? wp / dp : 1, cm = dm > 0 ? wm / dm : 1;
    for (let j = 0; j < nn; j++) { eP[j] = Math.exp(-dp / nset[j]); eM[j] = Math.exp(-dm / nset[j]); }
    for (let a = 0; a < k; a++) { const ia = ni[a]; Ap[a] = amp(S.recs[a], dp, cp, eP[ia]); Am[a] = amp(S.recs[a], dm, cm, eM[ia]); }
    const base = we[q] / lam * dN;
    for (let e = 0; e < S.axial.length; e++) {
      const P = S.axial[e];
      let sp = 1; for (let i = 0; i < P.am; i++) sp *= sr2;    // s_ρ^{2|m|}
      const v = base * sp * Ap[P.i] * Am[P.j];
      gr += P.re * v; gi += P.im * v;
    }
  }
  out[0] = gr; out[1] = gi;
}

/* ── the s_z rule: PANELS of Gauss–Legendre, broken at the two cusps s_z = ±|z| ─────────────────────────────
 * The chord is smooth inside each of [−|z|−L, −|z|], [−|z|, |z|], [|z|, |z|+L] and carries the whole oscillation
 * e^{2i p s_z}, so the panel length is set by BOTH scales at once: the decay 1/λ and the wavelength π/p.  A panel of
 * length h at frequency ω = 2p needs order q ≳ ωh/2, hence h = min(hdec/λ, hosc/(p_max + ¼)).
 * THE EXTENT (wave 42).  The two chord points sit at distances d± ≥ |z ± s_z| from the nucleus and the chord is the
 * product of the state at both, so its slowest pair decays as e^{−(d₊+d₋)/n_max} ≤ e^{−λ·max(|z|, |s_z|)}: a plateau
 * e^{−λ|z|} for |s_z| ≤ |z| and the tail e^{−λ|s_z|} beyond.  The old tails ran to |z| + L, i.e. to e^{−tail} of EACH
 * ROW'S OWN plateau — for the window's z_max = 40 that is s_z = 40 + L, chasing a row whose whole plateau is already
 * e^{−λ·40} of the peak.  The rule now cuts where the chord is e^{−tail} of the STATE'S PEAK (what the colour scale
 * is normalised to): |s_z| ≤ R_ext = tail/λ, and a row with |z| ≥ R_ext is exactly zero.  At z = 0 this is the old
 * [−L, L] to the point; the cost no longer grows with |z|.
 * THE HALF RULE (wave 42).  Swapping s_z → −s_z swaps the two chord points, and with them a ↔ b in Σ c_a* c_b ψ_a*ψ_b:
 * g(z, −s_z) = g(z, s_z)* exactly — the statement that W is real.  So Re[g e^{2ips}] at −s equals that at +s, and the
 * rule holds only the nodes s_z > 0 with DOUBLED weights: the panels of [−|z|, |z|] are laid symmetrically (an even
 * count, 2⌈|z|/h⌉) so that this is the same node set as before, half of it.  Off the axis the identity needs the
 * azimuth trapezoid to contain φ + π with every φ, which an even nphi guarantees (wignerAt rounds it up).
 */
function szRule(z, lam, pmax, o) {
  const R = Math.abs(z), Rext = o.tail / lam, s = [], w = [];
  if (R >= Rext) return { s, w };                                          // the row's plateau is below e^{−tail} of the peak: W = 0
  const h = Math.min(o.hdec / lam, o.hosc / (pmax + 0.25)), G = gaussLegendre(o.q);
  const span = (a, b, np) => {
    const hh = (b - a) / np;
    for (let k = 0; k < np; k++) { const c = a + hh * (k + 0.5), r = hh / 2;
      for (let i = 0; i < o.q; i++) { s.push(c + r * G.x[i]); w.push(2 * r * G.w[i]); } }   // ×2: the mirror node s_z < 0
  };
  if (R > 1e-13) span(0, R, Math.ceil(R / h));                            // the positive half of [−|z|, |z|]
  span(R, Rext, Math.max(1, Math.ceil((Rext - R) / h)));                   // the positive tail
  return { s, w };
}
/* 'normal' is the window's order.  Wave 42 re-tuned it against a converged reference (nd 48, q 24, tail 60): 16-point
   panels at hosc = 14 (a half-phase of 13 rad per panel, Gauss–Legendre error ~2e-9) cost 25 % fewer chords than 12 at
   hosc = 8 for the same digits, and nd = 12 Laguerre nodes hold the 1s anchors to 1e-11 (W(0,0)) and 6e-11 (the minimum)
   and a 1s+2p₀+3d₀ state to 5e-8 — the 64 × 64 slice of a six-term n ≤ 6 state runs under 150 ms at every knob setting. */
const PRESET = {
  fast:   { nd: 12, q: 10, tail: 18, hdec: 7, hosc: 7 },
  normal: { nd: 12, q: 16, tail: 24, hdec: 6, hosc: 14 },
  fine:   { nd: 24, q: 16, tail: 32, hdec: 5, hosc: 10 },
  ultra:  { nd: 36, q: 22, tail: 42, hdec: 4, hosc: 13 }
};
function preset(o) { return typeof o === 'string' ? (PRESET[o] || PRESET.normal) : Object.assign({}, PRESET.normal, o || {}); }

/**
 * wignerAxial(terms, z, pz, opts) — W at one point of the SLICE (x = y = p_x = p_y = 0), by the analytic azimuth.
 * `opts.order` is 'fast' | 'normal' | 'fine' | 'ultra' or { nd, nIn, nOut }.
 */
export function wignerAxial(terms, z, pz, opts = {}) {
  const S = prepare(terms); if (!S.axial.length) return 0;
  const o = preset(opts.order);
  const R = szRule(z, S.lam, Math.abs(pz), o), g = [0, 0];
  let acc = 0;
  for (let i = 0; i < R.s.length; i++) {
    chordAxial(S, z, R.s[i], o.nd, g);
    const ph = 2 * pz * R.s[i], c = Math.cos(ph), sn = Math.sin(ph);
    acc += R.w[i] * (g[0] * c - g[1] * sn);                    // Im part cancels pairwise: W is real
  }
  return acc;
}

/**
 * wignerSlice(terms, { z: [zmin, zmax, nz], p: [pmin, pmax, np], order }) — the (z, p_z) SLICE.
 * Returns { W: Float32Array(nz·np) row-major in z (W[i·np + j] at zs[i], ps[j]), zs, ps, min, max, argmin, ms }.
 * One chord per (z, s_z) serves the whole momentum row: the p loop is a phase recurrence, no transcendentals.
 */
export function wignerSlice(terms, { z = [-8, 8, 64], p = [-4, 4, 64], order = 'normal' } = {}) {
  const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const [z0, z1, nz] = z, [p0, p1, np] = p;
  const zs = new Float64Array(nz), ps = new Float64Array(np);
  for (let i = 0; i < nz; i++) zs[i] = nz > 1 ? z0 + (z1 - z0) * i / (nz - 1) : z0;
  for (let j = 0; j < np; j++) ps[j] = np > 1 ? p0 + (p1 - p0) * j / (np - 1) : p0;
  const W = new Float32Array(nz * np);
  const S = prepare(terms);
  let min = Infinity, max = -Infinity, argmin = { i: 0, j: 0, z: 0, p: 0 };
  if (!S.axial.length) return { W, zs, ps, min: 0, max: 0, argmin, ms: 0 };
  const pmax = Math.max(Math.abs(p0), Math.abs(p1)), dp = np > 1 ? (p1 - p0) / (np - 1) : 0;
  const g = [0, 0], accR = new Float64Array(np), accI = new Float64Array(np);
  for (let i = 0; i < nz; i++) {
    const zz = zs[i], o = preset(order), R = szRule(zz, S.lam, pmax, o);
    accR.fill(0); accI.fill(0);
    for (let q = 0; q < R.s.length; q++) {
      chordAxial(S, zz, R.s[q], o.nd, g);
      const gr = g[0] * R.w[q], gi = g[1] * R.w[q];
      /* e^{2i p_j s} by a rotation recurrence in j: exact to rounding, no cos/sin in the inner loop */
      let cr = Math.cos(2 * p0 * R.s[q]), ci = Math.sin(2 * p0 * R.s[q]);
      const er = Math.cos(2 * dp * R.s[q]), ei = Math.sin(2 * dp * R.s[q]);
      for (let j = 0; j < np; j++) {
        accR[j] += gr * cr - gi * ci; accI[j] += gr * ci + gi * cr;
        const nr = cr * er - ci * ei; ci = cr * ei + ci * er; cr = nr;
      }
    }
    for (let j = 0; j < np; j++) {
      const v = accR[j]; W[i * np + j] = v;
      if (v < min) { min = v; argmin = { i, j, z: zz, p: ps[j] }; }
      if (v > max) max = v;
    }
  }
  const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
  return { W, zs, ps, min, max, argmin, ms };
}

/* ── off the axis: the same rule with the azimuth done by trapezoid (periodic ⇒ spectral) ───────────────── */
/**
 * wignerAt(terms, r, p, opts) — W(r, p) at ONE arbitrary phase-space point, r and p 3-vectors (a.u.).
 * The frame is ê₃ = r̂ and ê₁ along the component of p perpendicular to r, so the phase is
 * e^{2i(p·ê₃)s_z} e^{2i|p_⊥| s_ρ cos φ} and only the register functions carry φ.  `opts.nphi` (default 32) is the
 * trapezoid order; the axial case (p_⊥ = 0 and r on the axis) is delegated to the analytic-azimuth path.
 */
export function wignerAt(terms, r, p, opts = {}) {
  const rx = r[0], ry = r[1], rz = r[2], px = p[0], py = p[1], pz = p[2];
  const Rr = Math.hypot(rx, ry, rz);
  const axial = Math.hypot(rx, ry) < 1e-12 && Math.hypot(px, py) < 1e-12;
  if (axial && !opts.general) return wignerAxial(terms, rz, pz, opts);   // opts.general forces the φ trapezoid (the cross-check)
  /* the frame: ê₃ = r̂, ê₁ along the part of p perpendicular to r (so p·ê₂ = 0) */
  const e3 = Rr > 1e-12 ? [rx / Rr, ry / Rr, rz / Rr] : [0, 0, 1];
  const ppar = px * e3[0] + py * e3[1] + pz * e3[2];
  const q = [px - ppar * e3[0], py - ppar * e3[1], pz - ppar * e3[2]];
  const pperp = Math.hypot(q[0], q[1], q[2]);
  let e1 = pperp > 1e-12 ? [q[0] / pperp, q[1] / pperp, q[2] / pperp]
                         : (Math.abs(e3[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]);
  { const d = e1[0] * e3[0] + e1[1] * e3[1] + e1[2] * e3[2];                 // Gram–Schmidt (only bites in the fallback)
    e1 = [e1[0] - d * e3[0], e1[1] - d * e3[1], e1[2] - d * e3[2]];
    const n = Math.hypot(e1[0], e1[1], e1[2]); e1 = [e1[0] / n, e1[1] / n, e1[2] / n]; }
  const e2 = [e3[1] * e1[2] - e3[2] * e1[1], e3[2] * e1[0] - e3[0] * e1[2], e3[0] * e1[1] - e3[1] * e1[0]];
  const S = prepare(terms), k = terms.length;
  const tabs = terms.map((t) => { const b = BASIS[t.a]; return modeTable(b.n, b.l, b.m); });
  const o = preset(opts.order), nphi = (opts.nphi || 64) + ((opts.nphi || 64) % 2);   // even: the half rule needs φ + π in the trapezoid
  const rule = szRule(Rr, S.lam, Math.hypot(ppar, pperp), o), { t, we } = gaussLaguerre(o.nd), lam = S.lam;
  const cosp = new Float64Array(nphi), sinp = new Float64Array(nphi);
  for (let f = 0; f < nphi; f++) { const ph = 2 * PI * f / nphi; cosp[f] = Math.cos(ph); sinp[f] = Math.sin(ph); }
  const Pr = new Float64Array(k), Pi = new Float64Array(k), Mr = new Float64Array(k), Mi = new Float64Array(k);
  let accR = 0;
  for (let u = 0; u < rule.s.length; u++) {
    const sz = rule.s[u], wp = Rr + sz, wm = Rr - sz, awp = Math.abs(wp), awm = Math.abs(wm);
    const near = awp <= awm, wN = near ? awp : awm, wF = near ? awm : awp, wN2 = wN * wN, wF2 = wF * wF;
    const phz = 2 * ppar * sz, cz = Math.cos(phz), sz2 = Math.sin(phz);
    let sr = 0, si = 0;                                                      // the (s_ρ, φ) integral at this s_z
    for (let g = 0; g < o.nd; g++) {
      const dN = wN + t[g] / lam, sr2 = Math.max(0, dN * dN - wN2), srho = Math.sqrt(sr2);
      const base = we[g] / lam * dN * (2 * PI / nphi) / PI3;                 // dφ trapezoid and the π⁻³ of the definition
      for (let f = 0; f < nphi; f++) {
        /* the two points in LAB Cartesian coordinates, and ψ there from hydrogen.js's own table evaluator */
        const ux = srho * (cosp[f] * e1[0] + sinp[f] * e2[0]), uy = srho * (cosp[f] * e1[1] + sinp[f] * e2[1]),
              uz = srho * (cosp[f] * e1[2] + sinp[f] * e2[2]);
        const Ax = wp * e3[0] + ux, Ay = wp * e3[1] + uy, Az = wp * e3[2] + uz;
        const Bx = wm * e3[0] - ux, By = wm * e3[1] - uy, Bz = wm * e3[2] - uz;
        for (let a = 0; a < k; a++) {
          const A = orbitalFromTable(tabs[a], Ax, Ay, Az), B = orbitalFromTable(tabs[a], Bx, By, Bz);
          Pr[a] = A.re; Pi[a] = A.im; Mr[a] = B.re; Mi[a] = B.im;
        }
        let ar = 0, ai = 0;                                                  // Σ_ab c_a* c_b ψ_a*(P₊) ψ_b(P₋)
        for (let e = 0; e < S.pairs.length; e++) {
          const P = S.pairs[e], i = P.i, j = P.j;
          const vr = Pr[i] * Mr[j] + Pi[i] * Mi[j], vi = Pr[i] * Mi[j] - Pi[i] * Mr[j];   // ψ_a* ψ_b
          ar += P.re * vr - P.im * vi; ai += P.re * vi + P.im * vr;
        }
        const phr = 2 * pperp * srho * cosp[f], cr = Math.cos(phr), ci = Math.sin(phr);
        sr += base * (ar * cr - ai * ci); si += base * (ar * ci + ai * cr);
      }
    }
    accR += rule.w[u] * (sr * cz - si * sz2);                                // the imaginary part cancels: W is real
  }
  return accR;
}

/**
 * sliceMomentumMarginal(terms, z, opts) — ∫ W(z, p_z) dp_z, EXACTLY (no p quadrature): the p_z integral collapses
 * e^{2ip_z s_z} to π δ(s_z), so this is π · g(z, 0), one chord.  For 1s it is e^{−2|z|}(1 + 2|z|)/(2π²).
 */
export function sliceMomentumMarginal(terms, z, opts = {}) {
  const S = prepare(terms); if (!S.axial.length) return 0;
  const o = preset(opts.order), g = [0, 0];
  chordAxial(S, z, 0, o.nd, g);
  return PI * g[0];
}

/** the 1s anchors, closed form — the header's two reductions and the peak (DERIVED-HERE, judged in the tests) */
export const ONE_S = {
  peak: 1 / PI3,
  momentumMarginal: (z) => Math.exp(-2 * Math.abs(z)) * (1 + 2 * Math.abs(z)) / (2 * PI * PI),
  positionMarginal: (p) => 8 / (3 * PI3 * Math.pow(1 + p * p, 3)),
  sliceIntegral: 1 / (PI * PI),
  min: -3.09725752458e-4, minAt: [1.32953725, 1.37910926]
};
