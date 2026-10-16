/* tests/lib/absorb-extra.js — the three roads tests use and the app does not (moved out of lab/absorb.js in 0.7.2 L0, Josh's dial: no gate code in lab/):
 * fieldFreeTrace (the closed-form μ(t) of a bound state), integrate (∫ S dω), kickSpectrum (the whole experiment). */
import { kick, spectrum, peaks } from '../../lab/absorb.js';
import { generalisedEigen } from '../../lab/sturmian.js';
/** the field-free electron-dipole trace μ(t) = −⟨z⟩(t) of a state c on the grid t = 0, Δt, …, steps·Δt (closed form) */
export function fieldFreeTrace({ S, H, Z }, c, { dt, steps }) {
  const n = dim(S), { E, C, rank } = generalisedEigen(S, H);
  if (rank !== n) throw new Error('absorb: singular metric in the trace');
  const sr = new Float64Array(n), si = new Float64Array(n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { sr[i] += S[i * n + j] * c.re[j]; si[i] += S[i * n + j] * (c.im ? c.im[j] : 0); }
  const ar = new Float64Array(n), ai = new Float64Array(n);
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) { ar[k] += C[i * n + k] * sr[i]; ai[k] += C[i * n + k] * si[i]; }
  const Ze = new Float64Array(n * n);                                        // Cᵀ Z C
  for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) { let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += C[i * n + k] * Z[i * n + j] * C[j * n + l]; Ze[k * n + l] = s; }
  let norm = 0; for (let k = 0; k < n; k++) norm += ar[k] ** 2 + ai[k] ** 2;
  const trace = new Float64Array(steps + 1);
  for (let s = 0; s <= steps; s++) {
    const t = s * dt; let z = 0;
    for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) {
      const ph = (E[k] - E[l]) * t;                                          // ā_k a_l e^{i(E_k−E_l)t}, real part
      z += Ze[k * n + l] * ((ar[k] * ar[l] + ai[k] * ai[l]) * Math.cos(ph) - (ar[k] * ai[l] - ai[k] * ar[l]) * Math.sin(ph));
    }
    trace[s] = -z / norm;
  }
  return trace;
}

/** ∫ S dω by the trapezoid rule — the oscillator-strength sum of the window */
export function integrate({ omega, S }) {
  let s = 0; for (let i = 1; i < omega.length; i++) s += 0.5 * (S[i] + S[i - 1]) * (omega[i] - omega[i - 1]);
  return s;
}

/** the whole experiment for a bound state: kick c0, record the closed-form trace, transform, find the peaks */
export function kickSpectrum(M, c0, { kappa = 1e-3, dt = 0.05, T = 2000, tau = 500, wMin, wMax, dw, fraction } = {}) {
  const c = kick(M, c0, kappa), steps = Math.round(T / dt);
  const trace = fieldFreeTrace(M, c, { dt, steps });
  const spec = spectrum(trace, { dt, kappa, tau, wMin, wMax, dw });
  return { c, trace, spec, peaks: peaks(spec, { fraction }), strength: integrate(spec) };
}
