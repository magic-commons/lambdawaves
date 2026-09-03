/* qcd.js — the confining side: Cornell, Airy, and the flux tube.  Units GeV and GeV⁻¹ throughout.
 *
 * STATUS: NUMERICAL (Numerov shooting) for the spectra; EXACT for the Airy limit, the Regge slope and the Lüscher
 * term; MODEL for anything about the tube's interior.  Round 9 (`research/adversarial-2026-09-02/09-opus-qcd.md`)
 * is the audit these numbers are anchored on.
 *
 * THE AIRY BRIDGE, AND WHY IT FAILS.  For a purely linear potential V = σr the l = 0 radial equation IS Airy's
 * equation, with no approximation at all: u'' = 2μ(σr − E)u, so the levels are
 *     E_n = (σ²/2μ)^{1/3} |a_n| ,   a_n the zeros of Ai
 * — the same function that governs the revival envelope in Thread A of the print.  The OPERATOR statement is
 * exact.  The SPECTROSCOPY is refuted: the ratio E₂/E₁ = |a₂|/|a₁| = 1.7484 is rigid and every splitting scales
 * as μ^{−1/3}, so charmonium and bottomonium should differ by (m_c/m_b)^{1/3} = 0.679 — while the measured
 * 2S−1S splittings differ by 0.956.  Fitting Δ ∝ μ^{−p} to the data gives p ≈ 0.04: not a power at all but a
 * LOGARITHM, which is why V ∝ ln r reproduces both systems with one constant.  The Coulomb term does not shift
 * the Airy zeros; it removes the boundary condition that selected them.
 */
export const AIRY_ZEROS = [-2.33810741, -4.08794944, -5.52055983, -6.78670809, -7.94413359, -9.02265085];
export const HBARC_FM = 0.1973269804;                 // GeV·fm
/** the standard potential models, all in GeV / GeV⁻¹ */
export const POTENTIALS = {
  cornell: { label: 'Cornell  −4α_s/3r + σr + V₀', f: (r, p) => -4 * p.alphaS / (3 * r) + p.sigma * r + (p.V0 || 0) },
  linear: { label: 'linear  σr + V₀  (the Airy limit)', f: (r, p) => p.sigma * r + (p.V0 || 0) },
  coulomb: { label: 'Coulomb  −4α_s/3r', f: (r, p) => -4 * p.alphaS / (3 * r) + (p.V0 || 0) },
  log: { label: 'logarithmic  C ln(r/r₀) + V₀', f: (r, p) => p.C * Math.log(r / p.r0) + (p.V0 || 0) },
};
export const DEFAULTS = { alphaS: 0.39, sigma: 0.18, C: 0.733, r0: 1.0, V0: 0 };
/** the measured levels this is judged against (PDG; GeV) */
export const MEASURED = {
  charm: { label: 'charmonium (cc̄)', m: 1.5, levels: [{ n: 1, name: 'J/ψ(1S)', M: 3.0969 }, { n: 2, name: 'ψ(2S)', M: 3.6861 }, { n: 3, name: 'ψ(3S)', M: 4.039 }] },
  bottom: { label: 'bottomonium (bb̄)', m: 4.8, levels: [{ n: 1, name: 'Υ(1S)', M: 9.4603 }, { n: 2, name: 'Υ(2S)', M: 10.0234 }, { n: 3, name: 'Υ(3S)', M: 10.3552 }] },
};
/**
 * Numerov shooting for the radial equation u'' = [2μ(V(r) − E) + l(l+1)/r²] u, u = rR.
 * The eigenvalue is found by bisection on the NODE COUNT, which is monotone in E — robust where matching
 * conditions are not.  Returns { E, u, r, nodes }.
 */
export function numerov(V, mu, l, level, opt = {}) {
  const rmax = opt.rmax || 12 / Math.sqrt(mu * 0.2), N = opt.N || 4000, h = rmax / N;
  const r = new Float64Array(N + 1), u = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) r[i] = (i + 1e-9) * h;
  const kOf = (E) => { const k = new Float64Array(N + 1); for (let i = 0; i <= N; i++) k[i] = 2 * mu * (V(r[i]) - E) + l * (l + 1) / (r[i] * r[i]); return k; };
  function shoot(E) {
    const k = kOf(E);
    u[0] = Math.pow(r[0], l + 1); u[1] = Math.pow(r[1], l + 1);
    let nodes = 0;
    const f = (i) => 1 - h * h * k[i] / 12;
    for (let i = 1; i < N; i++) {
      u[i + 1] = ((2 + 10 * h * h * k[i] / 12) * u[i] - f(i - 1) * u[i - 1]) / f(i + 1);
      if (u[i + 1] * u[i] < 0) nodes++;
      if (Math.abs(u[i + 1]) > 1e30) { for (let j = 0; j <= i + 1; j++) u[j] *= 1e-30; }
    }
    return nodes;
  }
  let lo = opt.eMin === undefined ? -4 : opt.eMin, hi = opt.eMax === undefined ? 40 : opt.eMax;
  for (let it = 0; it < 200; it++) {
    const mid = (lo + hi) / 2;
    if (shoot(mid) >= level) hi = mid; else lo = mid;
    if (hi - lo < 1e-12) break;
  }
  const E = (lo + hi) / 2;
  const nodes = shoot(E);
  let nrm = 0; for (let i = 0; i <= N; i++) nrm += u[i] * u[i] * h;
  if (nrm > 0) { const s = 1 / Math.sqrt(nrm); for (let i = 0; i <= N; i++) u[i] *= s; }
  return { E, u, r, nodes, h };
}
/** the S-wave spectrum of one system: M_n = 2m + E_n */
export function spectrum(kind, potential, params, count = 3) {
  const sys = MEASURED[kind], mu = sys.m / 2, V = (r) => POTENTIALS[potential].f(r, params);
  const out = [];
  for (let n = 1; n <= count; n++) {
    const s = numerov(V, mu, 0, n, { rmax: 40 / Math.sqrt(mu), N: 4000 });
    out.push({ n, E: s.E, M: 2 * sys.m + s.E, u: s.u, r: s.r, measured: sys.levels[n - 1] });
  }
  return { kind, label: sys.label, m: sys.m, mu, levels: out,
    split: out.length > 1 ? out[1].E - out[0].E : 0,
    measuredSplit: sys.levels.length > 1 ? sys.levels[1].M - sys.levels[0].M : 0 };
}
/**
 * A potential model predicts SPLITTINGS; the absolute masses need the constant V₀ that every such model carries
 * (equivalently, quark masses fitted to absorb it).  This returns the V₀ that puts the ground state exactly on
 * its measured mass — so the 2S mass then becomes a genuine prediction, and the instrument must say which is which.
 */
export function fitOffset(kind, potential, params) {
  const s = spectrum(kind, potential, { ...params, V0: 0 }, 1);
  return MEASURED[kind].levels[0].M - s.levels[0].M;
}
/** the Airy limit in closed form, for the same system (exact for V = σr) */
export function airyLevels(mu, sigma, count = 3) {
  const s = Math.cbrt(sigma * sigma / (2 * mu));
  return AIRY_ZEROS.slice(0, count).map((a, i) => ({ n: i + 1, E: s * Math.abs(a) }));
}
/**
 * The flavour-independence test that kills the Airy spectroscopy: a power-law potential V ∝ r^k gives
 * Δ ∝ μ^{−k/(k+2)}, so linear (k = 1) predicts μ^{−1/3} = 0.679 for bottom/charm while the measurement is 0.956;
 * the exponent that fits is p ≈ 0, i.e. a logarithm — for which the spacing is mass-independent exactly.
 */
export function flavourIndependence(potential, params) {
  const c = spectrum('charm', potential, params, 2), b = spectrum('bottom', potential, params, 2);
  const predRatio = b.split / c.split, measRatio = b.measuredSplit / c.measuredSplit;
  const muC = MEASURED.charm.m / 2, muB = MEASURED.bottom.m / 2;
  const p = -Math.log(measRatio) / Math.log(muB / muC);            // the exponent the DATA wants
  return { predRatio, measRatio, airyRatio: Math.pow(muC / muB, 1 / 3), fittedExponent: p,
    charmSplit: c.split, bottomSplit: b.split, charmMeasured: c.measuredSplit, bottomMeasured: b.measuredSplit };
}
/* ── the string, exactly ─────────────────────────────────────────────────── */
/** the Regge slope of the relativistic string: α′ = 1/(2πσ) — the NR linear potential gives E ∝ L^{2/3}, no line */
export const reggeSlope = (sigma) => 1 / (2 * Math.PI * sigma);
/** the Lüscher term: the universal −π(d−2)/(24r) correction to the static potential (d = 4 ⇒ −π/12r) */
export const luscher = (r, d = 4) => -Math.PI * (d - 2) / (24 * r);
/** the tube's width grows logarithmically: w²(r) = (d−2)/(2πσ) · ln(r/r₀); the coefficient in fm² per e-fold */
export function widthCoefficient(sigma, d = 4) {
  const gev2 = (d - 2) / (2 * Math.PI * sigma);
  return { gev2, fm2: gev2 * HBARC_FM * HBARC_FM };
}
/** the static potential a lattice would measure: Cornell plus the universal string correction */
export const staticPotential = (r, p) => -4 * p.alphaS / (3 * r) + p.sigma * r + luscher(r);
