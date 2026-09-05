/* molecule.js — H₂⁺, the first molecular orbital: one electron, two protons, in the 1s LCAO basis.  Atomic units.
 *
 * STATUS: EXACT integrals, VARIATIONAL energies (an upper bound at every R), exact evolution within the LCAO
 * space, KNOWN exact reference energies (Bates–Ledsham–Stewart 1953) drawn beside the bound.
 *
 * Protons at ±(R/2)ẑ; atomic orbitals a = 1s on A, b = 1s on B.  The three two-centre integrals are closed-form:
 *     S = ⟨a|b⟩ = e^{−R}(1 + R + R²/3)              overlap
 *     J = ⟨a|−1/r_B|a⟩ = −1/R + e^{−2R}(1 + 1/R)     Coulomb (the electron on A feels proton B)
 *     K = ⟨a|−1/r_A|b⟩ = −e^{−R}(1 + R)              resonance
 * With H = −½∇² − 1/r_A − 1/r_B and (−½∇² − 1/r_A)|a⟩ = −½|a⟩:  H_aa = −½ + J,  H_ab = −½S + K, and the two
 * molecular orbitals of the 2×2 secular problem are
 *     σg = (a + b)/√(2(1+S)),  E_g(R) = −½ + (J + K)/(1 + S) + 1/R      bonding
 *     σu = (a − b)/√(2(1−S)),  E_u(R) = −½ + (J − K)/(1 − S) + 1/R      antibonding (a nodal plane at z = 0)
 * LCAO gives R_e = 2.49 a₀ and D_e = 1.76 eV; the exact answer is R_e = 2.00 a₀, D_e = 2.79 eV — the bound is
 * honest about how much the frozen 1s orbitals miss (they should contract toward the bond).
 *
 * THE FIRST MOLECULAR DYNAMICS.  A state c_g σg + c_u σu evolves exactly within the space: c_g e^{−iE_g t},
 * c_u e^{−iE_u t}.  "The electron on A" is (σg√(1+S) + σu√(1−S))/√2, and it TUNNELS to B and back with period
 * T = 2π/(E_u − E_g): at R = 2 that is 2π/0.3929 = 16.0 a.u.  Hydrogen's electron hopping between two protons.
 */
import { modeTable } from './hydrogen.js';

export const EV = 27.211386;                                       // hartree → eV
export const overlapS = (R) => Math.exp(-R) * (1 + R + R * R / 3);
export const coulombJ = (R) => -1 / R + Math.exp(-2 * R) * (1 + 1 / R);
export const resonanceK = (R) => -Math.exp(-R) * (1 + R);
export function energies(R) {
  const S = overlapS(R), J = coulombJ(R), K = resonanceK(R);
  return { S, J, K, Eg: -0.5 + (J + K) / (1 + S) + 1 / R, Eu: -0.5 + (J - K) / (1 - S) + 1 / R };
}
/** KNOWN: the exact 1sσg total energies (electronic + 1/R) of Bates, Ledsham & Stewart 1953, at four separations */
export const EXACT_REFERENCE = [
  { R: 1, E: -0.45179 }, { R: 2, E: -0.60263 }, { R: 3, E: -0.57756 }, { R: 4, E: -0.54608 },
];
export const EXACT_RE = 2.00, EXACT_DE_EV = 2.79;
/** the LCAO equilibrium: minimise E_g(R) by golden section on [1, 5] */
export function equilibrium() {
  let a = 1, b = 5; const gr = (Math.sqrt(5) - 1) / 2;
  let c = b - gr * (b - a), d = a + gr * (b - a);
  for (let i = 0; i < 120; i++) { if (energies(c).Eg < energies(d).Eg) b = d; else a = c; c = b - gr * (b - a); d = a + gr * (b - a); }
  const Re = (a + b) / 2, E = energies(Re).Eg;
  return { Re, E, De: -0.5 - E, DeEV: (-0.5 - E) * EV };
}
/** MO coefficients (c_g, c_u) for the three named states */
export function moState(kind, R) {
  const S = overlapS(R);
  if (kind === 'sigma_g') return { g: [1, 0], u: [0, 0] };
  if (kind === 'sigma_u') return { g: [0, 0], u: [1, 0] };
  /* the electron on A: a = (σg√(1+S) + σu√(1−S))/√2  (normalised: ⟨a|a⟩ = 1) */
  return { g: [Math.sqrt((1 + S) / 2), 0], u: [Math.sqrt((1 - S) / 2), 0] };
}
/** the MO amplitudes at time t, exactly */
export function moAt(state, R, t) {
  const { Eg, Eu } = energies(R);
  const rot = (c, E) => [c[0] * Math.cos(E * t) + c[1] * Math.sin(E * t), c[1] * Math.cos(E * t) - c[0] * Math.sin(E * t)];   // e^{−iEt}
  return { g: rot(state.g, Eg), u: rot(state.u, Eu) };
}
/** the AO amplitudes (c_a, c_b) from the MO ones: a = (σg/√(2(1+S)) + σu/√(2(1−S))) etc. */
export function aoAmplitudes(mo, R) {
  const S = overlapS(R), ng = 1 / Math.sqrt(2 * (1 + S)), nu = 1 / Math.sqrt(2 * (1 - S));
  return { a: [mo.g[0] * ng + mo.u[0] * nu, mo.g[1] * ng + mo.u[1] * nu], b: [mo.g[0] * ng - mo.u[0] * nu, mo.g[1] * ng - mo.u[1] * nu] };
}
/** the probability of finding the electron on A (Mulliken: |c_a|² + S·Re(c_a c_b*)) */
export function populationA(ao, R) {
  const S = overlapS(R);
  const na = ao.a[0] ** 2 + ao.a[1] ** 2, cross = ao.a[0] * ao.b[0] + ao.a[1] * ao.b[1];
  return na + S * cross;
}
export const tunnelPeriod = (R) => { const { Eg, Eu } = energies(R); return 2 * Math.PI / (Eu - Eg); };
/** the modes the FIELD draws: two 1s tables, centred on the protons, with the AO amplitudes */
const T1S = modeTable(1, 0, 0);
export function fieldModes(state, R, t) {
  const ao = aoAmplitudes(moAt(state, R, t), R);
  return [{ table: T1S, re: ao.a[0], im: ao.a[1], center: [0, 0, -R / 2] }, { table: T1S, re: ao.b[0], im: ao.b[1], center: [0, 0, R / 2] }];
}
/** the CPU twin: ψ(x) = c_a φ_1s(x − A) + c_b φ_1s(x − B) */
export function psiAt(state, R, t, x, y, z) {
  const ao = aoAmplitudes(moAt(state, R, t), R);
  const phi = (dz) => Math.exp(-Math.hypot(x, y, z - dz)) / Math.sqrt(Math.PI);
  const fa = phi(-R / 2), fb = phi(R / 2);
  return { re: ao.a[0] * fa + ao.b[0] * fb, im: ao.a[1] * fa + ao.b[1] * fb };
}
export const domainFor = (R) => R / 2 + 6;
