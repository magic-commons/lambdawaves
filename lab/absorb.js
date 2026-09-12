/* absorb.js — the δ-kick absorption spectrum, PORT 1 of the ChronusQ map (research/chronusq-2026-09-11/A §7).
 * Atomic units.  STATUS: EXACT within the finite basis; the transform is the standard damped sine transform of the
 * induced dipole (Yabana–Bertsch 1996; the layer ChronusQ's paper leaves as "post processing at the users'
 * discretion").  DERIVED-HERE: the two-level laws tests/absorb.test.mjs holds it against.
 *
 * The kick.  A state c in a non-orthogonal basis (metric S) is struck by the impulse exp(−iκ ẑ):
 *     c ← V e^{−iκζ} Vᵀ S c ,   Z V = S V ζ ,   VᵀSV = I ,
 * exactly, by the generalised eigenproblem of the dipole matrix (the same machine modrive.js steps with).
 * The trace.  Field-free evolution is closed in the eigenbasis (H C = S C E, CᵀSC = I, a = CᵀSc):
 *     μ(t) = −⟨z⟩(t) = −Σ_kl ā_k a_l Z^{eig}_kl e^{i(E_k − E_l)t} ,   Z^{eig} = Cᵀ Z C ,
 * so no time stepping is needed for a kicked bound state; a driven or many-electron trace (density.js) is a
 * Float64Array of the same meaning and goes through the same transform.
 * The spectrum.  With δμ(t) = μ(t) − μ(0),
 *     Im α_zz(ω) = (1/κ) ∫₀ᵀ δμ(t) e^{−t/τ} sin(ωt) dt ,     S(ω) = (2ω/π) Im α_zz(ω) ,
 * and to first order in κ a level k reachable from the ground state gives δμ = 2κ z_k0² sin(ω_k0 t): a peak at the
 * exact gap with ∫S dω = 2 ω_k0 z_k0², which sums to the Thomas–Reiche–Kuhn value N_e only in a complete basis.
 * The sine over a uniform grid runs by the recurrence s_{n+1} = 2cos(ωΔt) s_n − s_{n−1} (no transcendental per sample).
 */
import { generalisedEigen } from './sturmian.js';

const dim = (S) => Math.round(Math.sqrt(S.length));

/** exp(−iκ ẑ) c, exactly, in the S metric; c = { re, im } */
export function kick({ S, Z }, c, kappa) {
  const n = dim(S), { E: zeta, C: V, rank } = generalisedEigen(S, Z);
  if (rank !== n) throw new Error('absorb: singular metric in the kick');
  const sr = new Float64Array(n), si = new Float64Array(n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { sr[i] += S[i * n + j] * c.re[j]; si[i] += S[i * n + j] * (c.im ? c.im[j] : 0); }
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    let ar = 0, ai = 0; for (let i = 0; i < n; i++) { ar += V[i * n + k] * sr[i]; ai += V[i * n + k] * si[i]; }
    const ph = -kappa * zeta[k], cs = Math.cos(ph), sn = Math.sin(ph), br = ar * cs - ai * sn, bi = ar * sn + ai * cs;
    for (let i = 0; i < n; i++) { re[i] += V[i * n + k] * br; im[i] += V[i * n + k] * bi; }
  }
  return { re, im };
}

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

/**
 * spectrum(trace, { dt, kappa, tau, wMin, wMax, dw }) → { omega, S, ImAlpha }
 * trace = μ(t) on a uniform grid; τ = Infinity for no damping.
 */
export function spectrum(trace, { dt, kappa, tau = Infinity, wMin = 0.0005, wMax = 1.5, dw = 0.0005 } = {}) {
  if (!(dt > 0) || !(kappa !== 0) || !(wMax > wMin) || !(dw > 0)) throw new Error('absorb: bad spectrum arguments');
  const M = trace.length, d = new Float64Array(M), mu0 = trace[0];
  for (let n = 0; n < M; n++) d[n] = (trace[n] - mu0) * (tau === Infinity ? 1 : Math.exp(-n * dt / tau));
  const count = Math.floor((wMax - wMin) / dw + 1e-9) + 1, omega = new Float64Array(count), S = new Float64Array(count), ImAlpha = new Float64Array(count);
  for (let w = 0; w < count; w++) {
    const om = wMin + w * dw, th = om * dt, c2 = 2 * Math.cos(th);
    let s0 = 0, s1 = Math.sin(th), acc = d[1] * s1;                          // s_n = sin(nθ) by recurrence
    for (let n = 2; n < M; n++) { const s2 = c2 * s1 - s0; acc += d[n] * s2; s0 = s1; s1 = s2; }
    const ImA = acc * dt / kappa;
    omega[w] = om; ImAlpha[w] = ImA; S[w] = (2 * om / Math.PI) * ImA;
  }
  return { omega, S, ImAlpha };
}

/**
 * the local maxima above `fraction` of the highest, refined by a parabola through three samples, tallest first.
 * Positions are read from Im α (a symmetric Lorentzian per level); the ω prefactor of S skews a peak by O(γ²/ω),
 * which is 1e-5 at γ = 1/τ = 2e-3 — so S supplies the height only.
 */
export function peaks({ omega, S, ImAlpha }, { fraction = 0.05 } = {}) {
  const Y = ImAlpha || S; let top = 0; for (let i = 0; i < Y.length; i++) top = Math.max(top, Y[i]);
  const out = [], dw = omega[1] - omega[0];
  for (let i = 1; i < Y.length - 1; i++) {
    if (!(Y[i] > Y[i - 1] && Y[i] >= Y[i + 1] && Y[i] >= fraction * top)) continue;
    const y0 = Y[i - 1], y1 = Y[i], y2 = Y[i + 1], den = y0 - 2 * y1 + y2, off = den !== 0 ? 0.5 * (y0 - y2) / den : 0;
    out.push({ omega: omega[i] + off * dw, height: S[i], imAlpha: y1 - 0.25 * (y0 - y2) * off });
  }
  return out.sort((a, b) => b.height - a.height);
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
