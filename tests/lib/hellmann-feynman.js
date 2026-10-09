/* tests/lib/hellmann-feynman.js — the Hellmann–Feynman force on a proton of the 1s-LCAO H₂⁺, its Pulay term and the Pulay
 * bound.  It shipped in lab/electrostatics.js (the ELECTROSTATICS window), which 0.5.0 D9b deleted; since H₂⁺ left (D9) it
 * served only tests, so it is kept here VERBATIM as tests/mo.test.mjs's oracle (G0 judges it, G2 lands the general
 * machinery of tests/lib/mo.js on it).  No lab file imports it.  Atomic units throughout.
 *
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
 * STATUS: EXACT up to two smooth 1-D quadratures (~1e-10) and one central difference (~1e-9).  KNOWN: the Hellmann–Feynman
 * theorem (Feynman 1939), the Pulay force (Pulay 1969), Gauss's law.
 */
import { overlapS, coulombJ, resonanceK, energies } from '../../lab/molecule.js';

const PI = Math.PI;

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
