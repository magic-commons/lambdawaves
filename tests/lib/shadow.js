/* shadow.js — the EXACT CLASSICAL SHADOW of a finite Hermitian MODE system (§7).
 *
 * STATUS: EXACT REAL REPRESENTATION OF FINITE UNITARY AMPLITUDE DYNAMICS.
 * Not a claim that the atom is classical oscillators: the mapping is exact at the equation
 * level; its interpretation is separate (firewall §42.1).
 *
 * Convention (frozen):  c_a = (q_a + i p_a)/√2.
 * With H = A + iB (Aᵀ = A, Bᵀ = −B), iċ = Hc is exactly
 *      q̇ = A p + B q,    ṗ = −A q + B p,
 * and the classical Hamiltonian  H_C = ½ qᵀAq + ½ pᵀAp + pᵀBq  equals  c†Hc  EXACTLY
 * under this √2 normalisation (so the shadow's energy readout IS ⟨H⟩).
 * For diagonal H (field-free hydrogen) A = diag(E_a), B = 0: each mode is an uncoupled
 * harmonic oscillator  q̇_a = E_a p_a, ṗ_a = −E_a q_a,  i.e. rotation of (q_a, p_a) at angular
 * velocity −E_a (positive = counter-clockwise for bound states, E_a < 0).
 *
 * The lab never integrates these equations for display — the shadow view READS (q,p) from the
 * same c(t) the field is built from (one state, one time).  The integrators below exist so the
 * test can check the realification independently (RK4 of the real system vs the closed form).
 */

export const SQRT2 = Math.SQRT2;

/** (q, p) from complex amplitudes */
export function toQP(re, im, out) {
  const n = re.length;
  const q = (out && out.q) || new Float64Array(n), p = (out && out.p) || new Float64Array(n);
  for (let a = 0; a < n; a++) { q[a] = SQRT2 * re[a]; p[a] = SQRT2 * im[a]; }
  return { q, p };
}
/** complex amplitudes from (q, p) */
export function fromQP(q, p, out) {
  const n = q.length;
  const re = (out && out.re) || new Float64Array(n), im = (out && out.im) || new Float64Array(n);
  for (let a = 0; a < n; a++) { re[a] = q[a] / SQRT2; im[a] = p[a] / SQRT2; }
  return { re, im };
}
/** split H (dense complex, {re: n×n, im: n×n} row-major) into A = Re H, B = Im H */
export function splitH(Hre, Him, n) {
  const A = new Float64Array(n * n), B = new Float64Array(n * n);
  for (let i = 0; i < n * n; i++) { A[i] = Hre[i]; B[i] = Him ? Him[i] : 0; }
  return { A, B, n };
}
/** the real generator G = [[B, A], [−A, B]] (2n × 2n, row-major); antisymmetric for Hermitian H */
export function realGenerator({ A, B, n }) {
  const G = new Float64Array(4 * n * n), N2 = 2 * n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    G[i * N2 + j] = B[i * n + j];            // q̇ ← B q
    G[i * N2 + n + j] = A[i * n + j];        // q̇ ← A p
    G[(n + i) * N2 + j] = -A[i * n + j];     // ṗ ← −A q
    G[(n + i) * N2 + n + j] = B[i * n + j];  // ṗ ← B p
  }
  return G;
}
/** H_C(q, p) = ½ qᵀAq + ½ pᵀAp + pᵀBq */
export function classicalEnergy(q, p, { A, B, n }) {
  let e = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    e += 0.5 * q[i] * A[i * n + j] * q[j] + 0.5 * p[i] * A[i * n + j] * p[j] + p[i] * B[i * n + j] * q[j];
  }
  return e;
}
/** the vector field of the real system: ẋ = G x, x = (q, p) */
export function flow({ A, B, n }, x, dx) {
  dx = dx || new Float64Array(2 * n);
  for (let i = 0; i < n; i++) {
    let dq = 0, dp = 0;
    for (let j = 0; j < n; j++) {
      dq += A[i * n + j] * x[n + j] + B[i * n + j] * x[j];
      dp += -A[i * n + j] * x[j] + B[i * n + j] * x[n + j];
    }
    dx[i] = dq; dx[n + i] = dp;
  }
  return dx;
}
/** classical RK4 integration of the real system (the TEST's independent path, not the lab's) */
export function integrateRK4(sys, x0, T, steps) {
  const n2 = x0.length, x = Float64Array.from(x0);
  const k1 = new Float64Array(n2), k2 = new Float64Array(n2), k3 = new Float64Array(n2), k4 = new Float64Array(n2), tmp = new Float64Array(n2);
  const h = T / steps;
  for (let s = 0; s < steps; s++) {
    flow(sys, x, k1);
    for (let i = 0; i < n2; i++) tmp[i] = x[i] + 0.5 * h * k1[i];
    flow(sys, tmp, k2);
    for (let i = 0; i < n2; i++) tmp[i] = x[i] + 0.5 * h * k2[i];
    flow(sys, tmp, k3);
    for (let i = 0; i < n2; i++) tmp[i] = x[i] + h * k3[i];
    flow(sys, tmp, k4);
    for (let i = 0; i < n2; i++) x[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  return x;
}
/** diagonal hydrogen system for a list of energies */
export function diagonalSystem(energies) {
  const n = energies.length, A = new Float64Array(n * n), B = new Float64Array(n * n);
  for (let i = 0; i < n; i++) A[i * n + i] = energies[i];
  return { A, B, n };
}
