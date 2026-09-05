/* h2.js — H₂, two electrons and two protons: Heitler–London (1927), the first bond, and the honest collision.
 *
 * STATUS: EXACT integrals (closed forms; Sugiura's exchange integral with the exponential integral), VARIATIONAL
 * energies (the singlet is an upper bound), classical nuclei on the curve (Born–Oppenheimer, labelled).
 *
 * With a, b the 1s orbitals on protons A, B at separation R, the singlet and triplet spatial functions
 *     Ψ± = [a(1)b(2) ± b(1)a(2)] / √(2(1 ± S²))
 * have energies
 *     E±(R) = 2E_1s + 1/R + [ 2J + J′ ± (2SK + K′) ] / (1 ± S²),        E_1s = −½,
 * with the one-electron integrals of H₂⁺ (S, J = ⟨a|−1/r_B|a⟩, K = ⟨a|−1/r_A|b⟩) and the two-electron ones
 *     J′ = ⟨ab|1/r₁₂|ab⟩ = 1/R − e^{−2R}(1/R + 11/8 + 3R/4 + R²/6)                       (the Coulomb integral)
 *     K′ = ⟨ab|1/r₁₂|ba⟩ = ⅕{ −e^{−2R}(−25/8 + 23R/4 + 3R² + R³/3)
 *                            + (6/R)[ S²(γ + ln R) + S′² Ei(−4R) − 2SS′ Ei(−2R) ] },  S′ = e^{R}(1 − R + R²/3)
 * (Sugiura 1927; γ Euler's constant).  Heitler–London gives R_e = 1.64 a₀ and D_e = 3.156 eV against the exact
 * 1.40 a₀ and 4.75 eV; the triplet is repulsive at every R.  Two hydrogen atoms thrown at each other on the
 * triplet curve BOUNCE (Pauli repulsion — electrostatics of the exchange density); on the singlet they bind and
 * vibrate.  The nuclei are classical here (mass m_p/2 per relative coordinate = 918.08 electron masses) on the
 * variational curve: the Born–Oppenheimer collision, and the instrument says so.
 */
import { overlapS, coulombJ, resonanceK } from './molecule.js';

export const EULER_GAMMA = 0.5772156649015329, EV = 27.211386, MU_H2 = 918.0764;
/** the exponential integral E₁(x) = ∫_x^∞ e^{−t}/t dt for x > 0 (series below 1, continued fraction above) */
export function expint1(x) {
  if (x <= 0) throw new Error('E1 needs x > 0');
  if (x < 1) { let s = 0, term = 1; for (let k = 1; k < 60; k++) { term *= -x / k; s += -term / k; } return -EULER_GAMMA - Math.log(x) + s; }
  /* Lentz continued fraction: E1(x) = e^{−x} / (x + 1/(1 + 1/(x + 2/(1 + 2/(x + …))))) */
  let b = x + 1, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 200; i++) { const an = -i * i; b += 2; d = 1 / (an * d + b); c = b + an / c; const del = c * d; h *= del; if (Math.abs(del - 1) < 1e-16) break; }
  return h * Math.exp(-x);
}
export const Ei = (x) => -expint1(-x);                            // Ei(−R) = −E₁(R)
export const coulombJ2 = (R) => 1 / R - Math.exp(-2 * R) * (1 / R + 11 / 8 + 3 * R / 4 + R * R / 6);
export function exchangeK2(R) {
  const S = overlapS(R), Sp = Math.exp(R) * (1 - R + R * R / 3);
  const A = -Math.exp(-2 * R) * (-25 / 8 + 23 * R / 4 + 3 * R * R + R * R * R / 3);
  const B = (6 / R) * (S * S * (EULER_GAMMA + Math.log(R)) + Sp * Sp * Ei(-4 * R) - 2 * S * Sp * Ei(-2 * R));
  return (A + B) / 5;
}
export function h2Energies(R) {
  const S = overlapS(R), J = coulombJ(R), K = resonanceK(R), J2 = coulombJ2(R), K2 = exchangeK2(R);
  const Ecoul = 2 * J + J2, Eexch = 2 * S * K + K2;
  return { S, J, K, J2, K2, singlet: -1 + 1 / R + (Ecoul + Eexch) / (1 + S * S), triplet: -1 + 1 / R + (Ecoul - Eexch) / (1 - S * S) };
}
export const KNOWN_HL = { Re: 1.64, DeEV: 3.1557 }, EXACT_H2 = { Re: 1.40, DeEV: 4.75, E: -1.1745 };
export function h2Equilibrium() {
  let a = 0.8, b = 4; const gr = (Math.sqrt(5) - 1) / 2; let c = b - gr * (b - a), d = a + gr * (b - a);
  const E = (r) => h2Energies(r).singlet;
  for (let i = 0; i < 100; i++) { if (E(c) < E(d)) b = d; else a = c; c = b - gr * (b - a); d = a + gr * (b - a); }
  const Re = (a + b) / 2, Emin = E(Re);
  return { Re, E: Emin, De: -1 - Emin, DeEV: (-1 - Emin) * EV };
}
/** dE/dR by a symmetric difference — the force on the relative coordinate */
export const h2Force = (R, which) => { const h = 1e-4; const E = (r) => h2Energies(r)[which]; return -(E(R + h) - E(R - h)) / (2 * h); };
/**
 * THE COLLISION: classical relative motion on the curve, velocity Verlet.  R, v in atomic units; μ = 918.08.
 * Two atoms thrown at each other with relative speed v (R decreasing).  On the triplet they bounce; on the singlet
 * they bind if the energy is below the dissociation limit — captured only if something takes the energy away,
 * which nothing does here, so they oscillate through the well and come back out.
 */
export function collide(R0, v0, which, { dt = 2, steps = 5000 } = {}) {
  let R = R0, v = v0, a = h2Force(R, which) / MU_H2; const track = [[0, R, v]]; let Rmin = R;
  for (let i = 1; i <= steps; i++) {
    R += v * dt + 0.5 * a * dt * dt; if (R < 0.2) R = 0.2;
    const a2 = h2Force(R, which) / MU_H2; v += 0.5 * (a + a2) * dt; a = a2;
    Rmin = Math.min(Rmin, R);
    if (i % 10 === 0) track.push([i * dt, R, v]);
    if (R > R0 * 1.05 && v > 0) break;
  }
  return { track, Rmin, Rend: R, vend: v };
}
/**
 * the one-electron density of the Heitler–London state: ρ(x) = [a² + b² ± 2S·ab] / (1 ± S²)  — NOT the square of a
 * single orbital (that is correlation).  As an incoherent sum of two orbitals: w_g|σg|² + w_u|σu|² with
 * σg,u = (a ± b)/√(2(1 ± S)) and w_g = (1+S)(1 ± S)/(1 ± S²), w_u = (1−S)(1 ∓ S)/(1 ± S²) — for the singlet:
 * w_g = (1+S)²/(1+S²), w_u = (1−S)²/(1+S²); for the triplet: w_g = w_u = (1−S²)/(1−S²) = 1 each.
 */
export function hlDensityWeights(R, which) {
  const S = overlapS(R);
  if (which === 'singlet') return { wg: (1 + S) * (1 + S) / (1 + S * S), wu: (1 - S) * (1 - S) / (1 + S * S) };
  return { wg: 1, wu: 1 };
}
