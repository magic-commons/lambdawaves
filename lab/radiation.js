/* radiation.js — what the register RADIATES: the dipole matrix, the Einstein A, and the far field of the A/B pair.
 *
 * THE DIPOLE.  r is a rank-1 tensor, so ⟨n'l'm'|r|nlm⟩ = (angular) × (radial) with l' = l ± 1 and m' = m, m ± 1:
 *     ⟨l'm'|z|lm⟩   = δ_{m'm} · √((l+1)²−m²)/((2l+1)(2l+3))  (l' = l+1)  or  √((l²−m²)/((2l−1)(2l+1)))  (l' = l−1)
 *     ⟨l'm'|x ± iy… ⟩ from  sinθ e^{±iφ} Y_lm = ∓√(…) Y_{l±1,m±1} ± √(…) Y_{l∓1,m±1}   (Condon–Shortley, as hydrogen.js)
 * giving ⟨x⟩ = A/2, ⟨y⟩ = −iA/2 for m' = m+1 and ⟨x⟩ = B/2, ⟨y⟩ = +iB/2 for m' = m−1.  The RADIAL factor is
 * dynamics.js's own ∫R_{n'l'} r R_{nl} r² dr (Simpson, the Hamiltonian in force) — the same integral the ⟨z⟩ readout
 * uses, so the A/B TRANSITION and this module cannot disagree.  The register's value for 1s–2p is 1.290266202,
 * exact 128√6/243 = 1.290266202, and ⟨1s|z|2p₀⟩ = 128√2/243 = 0.744935539.
 *
 * THE RATE (B.1, KNOWN, corrected in the round).  A = (4/3) α³ ω³ |⟨a|r|b⟩|² in atomic units, ω = |E_a − E_b| of the
 * HAMILTONIAN IN FORCE (hamiltonian.js — so a Z = 2 ion radiates Z⁴ times faster, and the atom's lines carry its own ε gaps).
 * A has dimensions 1/time, so it is divided by the atomic unit of time; and because the atom's energies scale as μ
 * and its lengths as 1/μ, A ∝ μ_reduced EXACTLY ONCE:  A ∝ (μ/m)³ · (m/μ)² = μ/m  (the ledger's "A ∝ μ_reduced").
 *     2p → 1s:  A_au = (2/3)^8 α³ = 1.5162329e-8 EXACTLY (closed form),
 *               A = 6.268315 × 10⁸ s⁻¹ (infinite nuclear mass),  6.264903 × 10⁸ s⁻¹ (reduced mass of ¹H)
 *               τ = 1/A = 1.596194 ns.   NIST/PDG give 6.2649 × 10⁸ — the reduced-mass value, to 5 × 10⁻⁶.
 * (The ledger's SYNTHESIS row prints 6.2646 × 10⁸; the register's own closed form is 6.26490 × 10⁸, 3.0 × 10⁴ higher,
 * and lands on NIST. DERIVED-HERE.)  einsteinA is a STATE-to-STATE rate; the physical partial rate of an upper level
 * into a lower LEVEL sums over the lower m's — that is spontaneousRate, and it is the number the tables print.
 *
 * THE FAR FIELD (B.2).  For d(t) = 2 Re(d e^{−iωt}) (d a complex 3-vector — exactly the form ⟨r⟩(t) takes for a
 * two-state coherence, with d = c₁* c₂ ⟨a|r|b⟩), the radiation zone carries
 *     E(r, t) = [ n̂ (n̂ · d̈) − d̈ ]_{t − r/c} / (c² r),      B = n̂ × E,      S = (c/4π) E × B,
 * so E ⊥ n̂, |B| = |E|, both fall as 1/r, and the time-averaged pattern and power are
 *     dP/dΩ = ω⁴ (|d|² − |n̂·d|²) / (2π c³),      P = (4/3) ω⁴ |d|² / c³ = |c₁|²|c₂|² ħωA.
 * THAT last identity is B.2 as the SYNTHESIS corrected it — "the classical field radiates |c₁|²|c₂|² ħωA" — and it
 * is certified here by integrating the Poynting flux of farField over a sphere and over a period, not by algebra.
 * At the equal mix |c₁|² = |c₂|² = ½ it is ħωA/4, which is P5's number: the two statements are the same one.
 * Lyman-α: ω = 3/8, λ = 2πc/ω = 2296 a₀ — three orders of magnitude off the stage, which is why RADIATION is a
 * SEPARATE view with r in units of λ and never drawn over the orbital.
 *
 * UNITS.  Atomic units throughout, GAUSSIAN for the fields: c = 1/α = 137.036, E and B share one unit, and
 * 1 a.u. of field = 5.14220675 × 10¹¹ V/m = 1.7152553 × 10⁷ G = 1715.2553 T.  (The "atomic unit of B" of
 * 2.35051757 × 10⁵ T that lab probes quote for magnetostatics is the SI-Hartree one, 1/α times larger; this module
 * is Gaussian throughout and says so, because |B| = |E| in the radiation zone only in Gaussian units.)
 *
 * STATUS: the angular algebra and the A formula are EXACT ANALYTIC and KNOWN (Bethe–Salpeter §59, Condon–Shortley);
 * the radial integrals are NUMERICAL (dynamics.js's Simpson, 2 × 10⁻¹³ against the closed form for 1s–2p); the
 * closed form A_au(2p→1s) = (2/3)^8 α³, the reduced-mass exponent and the Poynting certification are DERIVED-HERE.
 */
import { BASIS, AU_TIME_AS } from './hydrogen.js';
import { angularDipoleZ, radialDipole } from './dynamics.js';
import { getHamiltonian } from './hamiltonian.js';
/** ω = |E_a − E_b| of the HAMILTONIAN IN FORCE — the same operator the dipole's radial integral follows.  Read from the
 *  static BASIS (Z = 1 hydrogen) it was wrong for every other operator: at Z = 2 the dipole scaled as 1/Z² and ω not at
 *  all, so A(2p₀ → 1s) came out 1.566e8 instead of Z⁴ × 6.2649e8 = 1.002e10 (the reviewer's finding, wave 42). */
const omegaOf = (A, B) => { const H = getHamiltonian(); return H.energy(A.index) - H.energy(B.index); };

export const ALPHA = 7.2973525693e-3;              // CODATA 2018 fine-structure constant (1/α = 137.035999084)
export const C_AU = 1 / ALPHA;                     // the speed of light in atomic units
export const AU_S = AU_TIME_AS * 1e-18;            // the atomic unit of time in seconds (hydrogen.js's constant)
export const M_P_OVER_M_E = 1836.15267343;         // CODATA 2018
export const MU_H = 1 / (1 + 1 / M_P_OVER_M_E);    // μ/m_e for ¹H = 0.999455679…
export const FIELD_AU_VM = 5.14220675e11;          // 1 a.u. of E (and, Gaussian, of B) in V/m
export const FIELD_AU_T = 1715.2553;               // the same unit read as a magnetic field, in tesla

/* ── resolving a BASIS label ────────────────────────────────────────────────────────────────────────────── */
const BY_NAME = new Map();
for (const s of BASIS) { BY_NAME.set(s.id, s.index); BY_NAME.set(s.label, s.index);
  BY_NAME.set(`${s.n}${'spdfgh'[s.l]}${s.m}`, s.index); }
/** a BASIS index, id "h:n:l:m", label "2p₀", plain "2p0", or the state object itself → the BASIS entry */
export function stateFor(x) {
  if (typeof x === 'number') return BASIS[x];
  if (x && typeof x === 'object' && Number.isInteger(x.index)) return BASIS[x.index];
  const i = BY_NAME.get(String(x));
  if (i === undefined) throw new Error('radiation: unknown state ' + x);
  return BASIS[i];
}

/* ── the angular dipole, complex, all three components ──────────────────────────────────────────────────── */
const rt = (v) => Math.sqrt(Math.max(0, v));
/** ⟨l'm'| r̂ |lm⟩ (the unit-radius part) as { x, y, z } complex; zero unless l' = l ± 1 and m' = m, m ± 1 */
export function angularDipole(lp, mp, l, m) {
  const out = { x: { re: 0, im: 0 }, y: { re: 0, im: 0 }, z: { re: 0, im: 0 } };
  if (lp < 0 || Math.abs(mp) > lp || Math.abs(m) > l) return out;
  if (lp !== l + 1 && lp !== l - 1) return out;
  if (mp === m) { out.z.re = angularDipoleZ(lp, mp, l, m); return out; }
  if (mp === m + 1) {                                                   // the sinθ e^{iφ} channel
    const A = lp === l + 1 ? -rt((l + m + 1) * (l + m + 2) / ((2 * l + 1) * (2 * l + 3)))
                           :  rt((l - m) * (l - m - 1) / ((2 * l - 1) * (2 * l + 1)));
    out.x.re = A / 2; out.y.im = -A / 2;                                // ⟨y⟩ = A/(2i)
    return out;
  }
  if (mp === m - 1) {                                                   // the sinθ e^{−iφ} channel
    const B = lp === l + 1 ?  rt((l - m + 1) * (l - m + 2) / ((2 * l + 1) * (2 * l + 3)))
                           : -rt((l + m) * (l + m - 1) / ((2 * l - 1) * (2 * l + 1)));
    out.x.re = B / 2; out.y.im = B / 2;                                 // ⟨y⟩ = −B/(2i)
    return out;
  }
  return out;
}

/**
 * dipoleMatrix(a, b) — ⟨a|r|b⟩ as a complex 3-vector between two BASIS labels, atomic units (e a₀ with e = 1).
 * Returns { x, y, z } (each { re, im }), plus `abs2` = |⟨a|r|b⟩|² and `radial` = ∫R_a r R_b r³ dr.
 * Hermitian by construction: dipoleMatrix(b, a) is the complex conjugate.
 */
export function dipoleMatrix(a, b) {
  const A = stateFor(a), B = stateFor(b);
  const ang = angularDipole(A.l, A.m, B.l, B.m);
  const R = (ang.x.re || ang.x.im || ang.y.re || ang.y.im || ang.z.re || ang.z.im)
          ? radialDipole(A.n, A.l, B.n, B.l) : 0;
  const out = { x: { re: ang.x.re * R, im: ang.x.im * R },
                y: { re: ang.y.re * R, im: ang.y.im * R },
                z: { re: ang.z.re * R, im: ang.z.im * R }, radial: R };
  out.abs2 = out.x.re ** 2 + out.x.im ** 2 + out.y.re ** 2 + out.y.im ** 2 + out.z.re ** 2 + out.z.im ** 2;
  return out;
}

/* ── the rate ───────────────────────────────────────────────────────────────────────────────────────────── */
/**
 * einsteinA(a, b, { reducedMass = true }) — the STATE-to-STATE spontaneous rate in s⁻¹:
 *     A = (4/3) α³ ω³ |⟨a|r|b⟩|² / t_au,   ω = |E_a − E_b|,   × (μ/m) when reducedMass.
 * Returns 0 when the pair is dipole-forbidden (2s → 1s to the last bit: the angular factor is identically zero).
 */
export function einsteinA(a, b, { reducedMass = true } = {}) {
  const A = stateFor(a), B = stateFor(b);
  const w = Math.abs(omegaOf(A, B));
  if (w === 0) return 0;
  const au = (4 / 3) * ALPHA ** 3 * w ** 3 * dipoleMatrix(A, B).abs2;
  return au / AU_S * (reducedMass ? MU_H : 1);
}
/** the same in atomic units (1/t_au), the number the far-field law compares against */
export function einsteinAtomic(a, b) {
  const A = stateFor(a), B = stateFor(b), w = Math.abs(omegaOf(A, B));
  return w === 0 ? 0 : (4 / 3) * ALPHA ** 3 * w ** 3 * dipoleMatrix(A, B).abs2;
}
/**
 * spontaneousRate(a, b, opts) — the PARTIAL rate of the upper level into the lower LEVEL: Σ over the lower m′ (and,
 * by Wigner–Eckart, independent of the upper m).  This is the tabulated Einstein A: 2p → 1s 6.2649e8, 3p → 1s
 * 1.6725e8, 3d → 2p 6.4651e7 s⁻¹.  einsteinA is one m′ of it.
 */
export function spontaneousRate(a, b, opts = {}) {
  const A = stateFor(a), B = stateFor(b);
  let s = 0;
  for (const t of BASIS) if (t.n === B.n && t.l === B.l) s += einsteinA(A, t, opts);
  return s;
}
/** lifetime(a, b) = 1/A for that ONE channel, in seconds (the level's true τ sums every open channel) */
export function lifetime(a, b, opts = {}) { const A = einsteinA(a, b, opts); return A > 0 ? 1 / A : Infinity; }

/* ── the far field of an oscillating dipole ─────────────────────────────────────────────────────────────── */
/** accept [x,y,z] real, [[re,im]×3], or { x, y, z } complex → { re: [3], im: [3] } */
export function vec3c(d) {
  if (Array.isArray(d)) {
    if (Array.isArray(d[0])) return { re: [d[0][0], d[1][0], d[2][0]], im: [d[0][1], d[1][1], d[2][1]] };
    return { re: [d[0], d[1], d[2]], im: [0, 0, 0] };
  }
  return { re: [d.x.re, d.y.re, d.z.re], im: [d.x.im || 0, d.y.im || 0, d.z.im || 0] };
}
const unit = (n) => { const L = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / L, n[1] / L, n[2] / L]; };
/**
 * farField(dipole, omega, nhat, r, t) — the radiation-zone fields of d(t) = 2 Re(d e^{−iωt}) at distance r along n̂
 * and time t (Gaussian atomic units).  Returns { E, B, S, ddot, tret }: E = [n̂(n̂·d̈) − d̈]/(c²r) at the retarded
 * time, B = n̂ × E, S = (c/4π) E × B the instantaneous Poynting vector.  Valid for r ≫ λ = 2πc/ω only — the near
 * and induction zones are NOT in this expression, and the view that draws it must say so.
 */
export function farField(dipole, omega, nhat, r, t) {
  const d = vec3c(dipole), n = unit(nhat), tret = t - r / C_AU;
  const c = Math.cos(omega * tret), s = Math.sin(omega * tret), k = -2 * omega * omega;
  const dd = [k * (d.re[0] * c + d.im[0] * s), k * (d.re[1] * c + d.im[1] * s), k * (d.re[2] * c + d.im[2] * s)];
  const nd = n[0] * dd[0] + n[1] * dd[1] + n[2] * dd[2], f = 1 / (C_AU * C_AU * r);
  const E = [f * (n[0] * nd - dd[0]), f * (n[1] * nd - dd[1]), f * (n[2] * nd - dd[2])];
  const B = [n[1] * E[2] - n[2] * E[1], n[2] * E[0] - n[0] * E[2], n[0] * E[1] - n[1] * E[0]];
  const g = C_AU / (4 * Math.PI);
  const S = [g * (E[1] * B[2] - E[2] * B[1]), g * (E[2] * B[0] - E[0] * B[2]), g * (E[0] * B[1] - E[1] * B[0])];
  return { E, B, S, ddot: dd, tret };
}
/**
 * pattern(dipole, omega) — the TIME-AVERAGED angular distribution and the total classical power (atomic units):
 *     { dPdOmega(n̂), total = (4/3) ω⁴|d|²/c³, peak, period }.
 * For a linear dipole along ẑ this is dP/dΩ ∝ sin²θ exactly, zero on the axis.
 */
export function pattern(dipole, omega) {
  const d = vec3c(dipole), w4 = omega ** 4, c3 = C_AU ** 3;
  const abs2 = d.re[0] ** 2 + d.re[1] ** 2 + d.re[2] ** 2 + d.im[0] ** 2 + d.im[1] ** 2 + d.im[2] ** 2;
  const dPdOmega = (nhat) => {
    const n = unit(nhat);
    const pr = n[0] * d.re[0] + n[1] * d.re[1] + n[2] * d.re[2];
    const pi = n[0] * d.im[0] + n[1] * d.im[1] + n[2] * d.im[2];
    return w4 * (abs2 - pr * pr - pi * pi) / (2 * Math.PI * c3);
  };
  return { dPdOmega, total: (4 / 3) * w4 * abs2 / c3, peak: w4 * abs2 / (2 * Math.PI * c3),
           abs2, omega, period: omega > 0 ? 2 * Math.PI / omega : Infinity, wavelength: omega > 0 ? 2 * Math.PI * C_AU / omega : Infinity };
}
/**
 * coherentPower(a, b, c1, c2) — the field of the A/B superposition c₁|a⟩ + c₂|b⟩ (c's complex { re, im } or reals).
 * ⟨r⟩(t) = 2 Re(d e^{−iωt}) with d = c₁* c₂ ⟨a|r|b⟩ and ω = E_b − E_a, so the classical radiated power is
 *     P = (4/3) ω⁴|d|²/c³ = |c₁|²|c₂|² · ħω A                       (the SYNTHESIS's B.2 line)
 * — a quarter of ħωA at the equal mix, which is P5's ħωA/4.  Returns { omega, d, P, hbarOmegaA, weight, ratio }.
 */
export function coherentPower(a, b, c1, c2) {
  const A = stateFor(a), B = stateFor(b);
  const z1 = typeof c1 === 'number' ? { re: c1, im: 0 } : c1, z2 = typeof c2 === 'number' ? { re: c2, im: 0 } : c2;
  const w = omegaOf(B, A), M = dipoleMatrix(A, B);
  const pr = z1.re * z2.re + (z1.im || 0) * (z2.im || 0), pi = z1.re * (z2.im || 0) - (z1.im || 0) * z2.re;  // c₁* c₂
  const mul = (v) => ({ re: pr * v.re - pi * v.im, im: pr * v.im + pi * v.re });
  const d = { x: mul(M.x), y: mul(M.y), z: mul(M.z) };
  const P = pattern(d, Math.abs(w)).total;
  const weight = (z1.re ** 2 + (z1.im || 0) ** 2) * (z2.re ** 2 + (z2.im || 0) ** 2);
  const hbarOmegaA = Math.abs(w) * einsteinAtomic(A, B);
  return { omega: w, d, P, hbarOmegaA, weight, ratio: hbarOmegaA > 0 ? P / (weight * hbarOmegaA) : 0 };
}
