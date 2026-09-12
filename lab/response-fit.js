/* response-fit.js — fitted poles of a δ-kick response trace, B-H2O-6 of research/MATH-H2O-2026-09-11.md.
 * Atomic units.  STATUS: Sol's exact discrete kernel and 4ε/σ certificate (ROUND 3 · SOL, answer 7), verified in
 * ROUND 4 · OPUS §3 and gated by tests/response-fit.test.mjs.  Variable projection is KNOWN (Golub–Pereyra 1973).
 *
 * A peak of lab/absorb.js's transform is NOT a pole: at T/τ = 12 the window bias of neighbouring lines displaces
 * the parabolic maximum of H₂O's 0.702205382 line by +2.34e-3.  The bias is not an error to correct afterwards,
 * because the sampled transform is exact in closed form.  With t_n = n h, q = e^{−γh}, γ = 1/τ, M the sample count,
 *     I_M(x) = h Σ_{n=1}^{M−1} q^n cos(x n h) = h Re[ z (1 − z^{M−1}) / (1 − z) ] ,   z = q e^{i x h} ,
 *     K_M(ω, Ω) = I_M(ω − Ω) − I_M(ω + Ω) ,
 * and a linear-response trace δμ_n = 2κ Σ_k A_k sin(Ω_k t_n) transforms to Im α(ω_r) = Σ_k A_k K_M(ω_r, Ω_k)
 * EXACTLY — neighbour overlap, the negative-frequency image, the finite endpoint and the rectangle rule all live
 * inside K_M.  So the estimator is a fit, not a correction series: for ordered trial poles solve the nonnegative
 * least-squares problem for A, then minimise the reduced residual over Ω (Levenberg–Marquardt, analytic dK/dΩ).
 *
 * The certificate.  With J = [ ∂y/∂Ω | (∂y/∂A) diag(α) ] the model Jacobian, α_k equalising the column norms so the
 * frequency block stays in hartree, σ = σ_min(J), ε = ‖residual‖₂ and L_J a Lipschitz surrogate for J,
 *     ε ≤ σ²/(8 L_J)   ⟹   ‖θ̂ − θ‖₂ ≤ 4ε/σ ,
 * so a pole is certified to a precision only when the precondition holds and 4ε/σ is below it.  MEASURED on the
 * four y-bright H₂O lines at T = 600, τ = 50, h = 0.02: noiseless 4ε/σ = 1.18e-10 (ROUND 4's 3.1e-12 with an exact
 * transform; the difference is the O(M ε) drift of absorb.js's sine recurrence, which this fit inherits because it
 * fits what the instrument displays); real RT-RHF at Δt = 0.005 gives ε = 2.345e-4, 4ε/σ = 1.45e-5, so 1e-7 is
 * REFUSED and what the fit exposes is the propagator's own C_j Δt² shift (ROUND 4 §2), which closes to 2e-8.  At
 * Δt = 0.01 even the precondition fails (ε = 1.75e-3 > 3.11e-4) and nothing is certified.
 * MUST NOT CLAIM: a certified pole when the bound fails, resolution beyond the trace's conditioning, or removal of
 * the RT timestep error — L_J is a sampled surrogate, not a proved Lipschitz constant.
 */
import { spectrum, peaks } from './absorb.js';
import { eigSym } from './h2ci.js';

/** I_M(x) and dI_M/dx together, in closed form; falls back to the literal sum when 1 − z cancels */
function imKernel(x, h, q, N, qN) {
  const th = x * h, sh = Math.sin(0.5 * th);
  const dr = (1 - q) + q * 2 * sh * sh, di = -q * Math.sin(th);              // 1 − z, both parts exact
  if (dr * dr + di * di < 1e-24) {                                           // q = 1 and x = 0: sum it
    let I = 0, dI = 0;
    for (let n = 1; n < N + 1; n++) { const p = Math.pow(q, n), a = x * n * h; I += p * Math.cos(a); dI -= p * n * h * Math.sin(a); }
    return [h * I, h * dI];
  }
  const zr = q * Math.cos(th), zi = q * Math.sin(th);
  const aN = N * th, zNr = qN * Math.cos(aN), zNi = qN * Math.sin(aN);       // z^N
  const d2r = dr * dr - di * di, d2i = 2 * dr * di;                          // (1 − z)²
  /* S = z(1 − z^N)/(1 − z) */
  const nr = zr * (1 - zNr) + zi * zNi, ni = zr * (-zNi) + zi * (1 - zNr);
  const q1 = dr * dr + di * di, Sr = (nr * dr + ni * di) / q1;                // Re[z(1 − z^N)/(1 − z)]
  /* S'(z) = [ (1 − (N+1) z^N)(1 − z) + (z − z^{N+1}) ] / (1 − z)² */
  const kr = 1 - (N + 1) * zNr, ki = -(N + 1) * zNi;
  const zN1r = zNr * zr - zNi * zi, zN1i = zNr * zi + zNi * zr;              // z^{N+1}
  const tr = kr * dr - ki * di + (zr - zN1r), ti = kr * di + ki * dr + (zi - zN1i);
  const q2 = d2r * d2r + d2i * d2i, Pr = (tr * d2r + ti * d2i) / q2, Pi = (ti * d2r - tr * d2i) / q2;
  const zPi = zr * Pi + zi * Pr;                                             // Im[z S'(z)] = Σ n q^n sin(x n h)
  return [h * Sr, -h * h * zPi];
}

/** K_M(ω, Ω) and ∂K_M/∂Ω for one pole over the whole grid */
function column(grid, Om, h, q, N, qN, dest, ddest) {
  for (let r = 0; r < grid.length; r++) {
    const [im, dm] = imKernel(grid[r] - Om, h, q, N, qN), [ip, dp] = imKernel(grid[r] + Om, h, q, N, qN);
    dest[r] = im - ip; if (ddest) ddest[r] = -dm - dp;
  }
}

/** Lawson–Hanson nonnegative least squares on the normal equations of an (R × m) design */
function nnls(Phi, y, R, m, maxIter = 60) {
  const G = new Float64Array(m * m), c = new Float64Array(m);
  for (let i = 0; i < m; i++) { for (let j = i; j < m; j++) { let s = 0; for (let r = 0; r < R; r++) s += Phi[i][r] * Phi[j][r]; G[i * m + j] = G[j * m + i] = s; }
    let s = 0; for (let r = 0; r < R; r++) s += Phi[i][r] * y[r]; c[i] = s; }
  const a = new Float64Array(m), free = new Array(m).fill(false);
  for (let pass = 0; pass < maxIter; pass++) {
    const w = Float64Array.from(c);                                          // w = c − G a, the negative gradient
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) w[i] -= G[i * m + j] * a[j];
    let best = -1, top = 0;
    for (let i = 0; i < m; i++) if (!free[i] && w[i] > top) { top = w[i]; best = i; }
    if (best < 0) break;
    free[best] = true;
    for (let inner = 0; inner < m + 2; inner++) {
      const idx = []; for (let i = 0; i < m; i++) if (free[i]) idx.push(i);
      const k = idx.length, sub = new Float64Array(k * k), rhs = new Float64Array(k);
      for (let i = 0; i < k; i++) { for (let j = 0; j < k; j++) sub[i * k + j] = G[idx[i] * m + idx[j]]; rhs[i] = c[idx[i]]; }
      const z = cholSolve(sub, rhs, k);
      if (!z) { free[best] = false; break; }
      let worst = -1, alpha = Infinity;
      for (let i = 0; i < k; i++) if (z[i] <= 0) { const t = a[idx[i]] / (a[idx[i]] - z[i]); if (t < alpha) { alpha = t; worst = i; } }
      if (worst < 0) { for (let i = 0; i < m; i++) a[i] = 0; for (let i = 0; i < k; i++) a[idx[i]] = z[i]; break; }
      for (let i = 0; i < k; i++) a[idx[i]] += alpha * (z[i] - a[idx[i]]);
      free[idx[worst]] = false; a[idx[worst]] = 0;
    }
  }
  return a;
}
/** Cholesky solve for a symmetric positive definite k×k system; null if not positive definite */
function cholSolve(A, b, k) {
  const L = new Float64Array(k * k);
  for (let i = 0; i < k; i++) for (let j = 0; j <= i; j++) {
    let s = A[i * k + j]; for (let p = 0; p < j; p++) s -= L[i * k + p] * L[j * k + p];
    if (i === j) { if (!(s > 0)) return null; L[i * k + i] = Math.sqrt(s); } else L[i * k + j] = s / L[j * k + j];
  }
  const x = Float64Array.from(b);
  for (let i = 0; i < k; i++) { for (let p = 0; p < i; p++) x[i] -= L[i * k + p] * x[p]; x[i] /= L[i * k + i]; }
  for (let i = k - 1; i >= 0; i--) { for (let p = i + 1; p < k; p++) x[i] -= L[p * k + i] * x[p]; x[i] /= L[i * k + i]; }
  return x;
}
/** the smallest and largest singular values of a column-major stack of vectors, through its Gram matrix */
function extremeSingular(cols, R) {
  const m = cols.length, G = new Float64Array(m * m);
  for (let i = 0; i < m; i++) for (let j = i; j < m; j++) { let s = 0; for (let r = 0; r < R; r++) s += cols[i][r] * cols[j][r]; G[i * m + j] = G[j * m + i] = s; }
  const e = eigSym(G, m);
  return { min: Math.sqrt(Math.max(e.values[0], 0)), max: Math.sqrt(Math.max(e.values[m - 1], 0)) };
}

/** the local maximum of y nearest `near`, refined by a parabola through three samples */
function localMax(grid, y, near, radius) {
  let best = null;
  for (let i = 1; i < y.length - 1; i++) {
    if (Math.abs(grid[i] - near) > radius) continue;
    if (!(y[i] > y[i - 1] && y[i] >= y[i + 1])) continue;
    const y0 = y[i - 1], y1 = y[i], y2 = y[i + 1], den = y0 - 2 * y1 + y2;
    const w = grid[i] + (den !== 0 ? 0.5 * (y0 - y2) / den : 0) * (grid[1] - grid[0]);
    if (best === null || Math.abs(w - near) < Math.abs(best - near)) best = w;
  }
  return best === null ? near : best;
}

/**
 * fitPoles(trace, { dt, kappa, tau, init, wMin, wMax, dw, span, fraction, count, snap, maxIter })
 *   → { poles: [{ omega, amplitude, bound, rawOmega, bias }], epsilon, sigma, LJ, precondition, bound,
 *       certified(precision) → boolean, refusal(precision) → string | null, raw: peaks, spec, iterations }
 * `trace` is μ(t) on a uniform grid of spacing dt (lab/density.js's dipole readout, or a closed-form trace).
 * `init` are the trial lines, snapped to the nearest parabolic maximum of the transform before the fit; omitted,
 * they are lab/absorb.js's peaks above `fraction` (at most `count` of them).  A REAL RT trace must be given `init`
 * from lab/rpa-inspector.js: its window ripple reaches 0.5 % of the strongest H₂O line, so no peak fraction isolates
 * the true lines — MEASURED, y-polarised Δt = 0.01, T = 300, τ = 50: fraction 0.01 finds 3 of 4 lines and 0.005
 * finds 8 maxima for 4 lines.  `raw` is the uncertified reading the instrument shows beside the fitted poles.
 */
export function fitPoles(trace, { dt, kappa, tau = Infinity, init = null, wMin = 0.05, wMax = 21, dw = 1e-3,
  span = 0.02, fraction = 0.05, count = Infinity, snap = true, maxIter = 80 } = {}) {
  if (!(dt > 0) || !(kappa !== 0)) throw new Error('response-fit: dt > 0 and a non-zero kappa are required');
  const spec = spectrum(trace, { dt, kappa, tau, wMin, wMax, dw }), grid = spec.omega, y = spec.ImAlpha, R = grid.length;
  const raw = peaks(spec, { fraction });
  const M = trace.length, N = M - 1, h = dt, gam = tau === Infinity ? 0 : 1 / tau;
  const q = Math.exp(-gam * h), qN = Math.exp(-gam * h * N);
  let Om = Float64Array.from(init && init.length ? init : raw.slice(0, count).map((p) => p.omega));
  const m = Om.length;
  if (!m) throw new Error('response-fit: no trial poles — absorb.js found no peak above the fraction');
  if (snap) for (let k = 0; k < m; k++) Om[k] = localMax(grid, y, Om[k], span);
  Om.sort();
  const lo = Float64Array.from(Om, (w) => Math.max(w - span, 1e-9)), hi = Float64Array.from(Om, (w) => Math.min(w + span, Math.PI / h - 1e-9));
  const Phi = [], dPhi = [];
  for (let k = 0; k < m; k++) { Phi.push(new Float64Array(R)); dPhi.push(new Float64Array(R)); }
  const build = (w) => { for (let k = 0; k < m; k++) column(grid, w[k], h, q, N, qN, Phi[k], dPhi[k]); };
  const resid = (a) => { const r = new Float64Array(R); for (let i = 0; i < R; i++) { let s = -y[i]; for (let k = 0; k < m; k++) s += a[k] * Phi[k][i]; r[i] = s; } return r; };
  const norm = (v) => { let s = 0; for (const x of v) s += x * x; return Math.sqrt(s); };
  build(Om);
  let a = nnls(Phi, y, R, m), r = resid(a), eps = norm(r), lam = 1e-3, iterations = 0, stale = false;
  for (let it = 0; it < maxIter; it++) {
    iterations = it + 1;
    /* Kaufman's variable-projection Jacobian: the frequency columns projected off range(Φ) */
    const Jc = [];
    for (let k = 0; k < m; k++) { const c = new Float64Array(R); for (let i = 0; i < R; i++) c[i] = a[k] * dPhi[k][i]; Jc.push(c); }
    const G = new Float64Array(m * m), rhsP = new Float64Array(m * m);
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) { let s = 0; for (let p = 0; p < R; p++) s += Phi[i][p] * Phi[j][p]; G[i * m + j] = s; }
    for (let k = 0; k < m; k++) { const b = new Float64Array(m); for (let i = 0; i < m; i++) { let s = 0; for (let p = 0; p < R; p++) s += Phi[i][p] * Jc[k][p]; b[i] = s; }
      const z = cholSolve(G, b, m); if (z) for (let i = 0; i < m; i++) rhsP[k * m + i] = z[i]; }
    for (let k = 0; k < m; k++) for (let i = 0; i < m; i++) { const c = rhsP[k * m + i]; if (!c) continue; for (let p = 0; p < R; p++) Jc[k][p] -= c * Phi[i][p]; }
    const JJ = new Float64Array(m * m), Jr = new Float64Array(m);
    for (let i = 0; i < m; i++) { for (let j = i; j < m; j++) { let s = 0; for (let p = 0; p < R; p++) s += Jc[i][p] * Jc[j][p]; JJ[i * m + j] = JJ[j * m + i] = s; }
      let s = 0; for (let p = 0; p < R; p++) s += Jc[i][p] * r[p]; Jr[i] = -s; }
    let improved = false;
    for (let tries = 0; tries < 24 && !improved; tries++) {
      const A2 = Float64Array.from(JJ); for (let i = 0; i < m; i++) A2[i * m + i] *= (1 + lam);
      const d = cholSolve(A2, Jr, m);
      if (!d) { lam *= 10; continue; }
      const trial = Float64Array.from(Om, (w, k) => Math.min(Math.max(w + d[k], lo[k]), hi[k]));
      trial.sort();
      build(trial);
      const a2 = nnls(Phi, y, R, m), r2 = resid(a2), e2 = norm(r2);
      if (e2 < eps) { Om = trial; a = a2; r = r2; eps = e2; lam = Math.max(lam * 0.1, 1e-12); improved = true; }
      else { lam *= 10; stale = true; }
    }
    if (stale) { build(Om); stale = false; }
    if (!improved || lam > 1e12) break;
  }
  /* the certificate: the separable model Jacobian, column-scaled so the frequency block is in hartree */
  const jacobian = (w, amp) => {
    const cols = [];
    for (let k = 0; k < m; k++) { const f = new Float64Array(R), df = new Float64Array(R);
      column(grid, w[k], h, q, N, qN, f, df);
      const c = new Float64Array(R); for (let i = 0; i < R; i++) c[i] = amp[k] * df[i];
      cols.push({ f, c }); }
    const al = cols.map(({ f, c }) => norm(c) / Math.max(norm(f), 1e-300));
    return { cols: cols.map(({ c }) => c).concat(cols.map(({ f }, k) => Float64Array.from(f, (v) => v * al[k]))), al };
  };
  const J0 = jacobian(Om, a), sv = extremeSingular(J0.cols, R), sigma = sv.min;
  /* L_J: the largest sampled ‖J(θ + d) − J(θ)‖₂/‖d‖₂ over the m coordinate directions and the diagonal, |d| = 1e-5 */
  const dirs = [];
  for (let k = 0; k < m; k++) { const v = new Float64Array(m); v[k] = 1e-5; dirs.push(v); }
  { const v = new Float64Array(m).fill(1e-5 / Math.sqrt(m)); dirs.push(v); }
  { const v = new Float64Array(m); for (let k = 0; k < m; k++) v[k] = (k % 2 ? -1 : 1) * 1e-5 / Math.sqrt(m); dirs.push(v); }
  let LJ = 0;
  for (const d of dirs) {
    const w2 = Float64Array.from(Om, (w, k) => w + d[k]);
    for (let k = 0; k < m; k++) column(grid, w2[k], h, q, N, qN, Phi[k], dPhi[k]);
    const a2 = nnls(Phi, y, R, m), J2 = jacobian(w2, a2);
    const diff = J2.cols.map((c, k) => Float64Array.from(c, (v, i) => v - J0.cols[k][i]));
    LJ = Math.max(LJ, extremeSingular(diff, R).max / norm(d));
  }
  build(Om);
  const precondition = sigma * sigma / (8 * LJ), holds = eps <= precondition, bound = 4 * eps / sigma;
  const poles = [];
  for (let k = 0; k < m; k++) {
    const rawOmega = localMax(grid, y, Om[k], Math.max(3 * dw, 0.06));
    poles.push({ omega: Om[k], amplitude: a[k], bound, rawOmega, bias: rawOmega - Om[k] });
  }
  const refusal = (precision) => {
    if (!(precision > 0)) return 'response-fit: a precision must be positive';
    if (!holds) return `response-fit: the certificate's precondition fails — ε = ${eps.toExponential(3)} > σ²/(8 L_J) = ${precondition.toExponential(3)}; lengthen the trace`;
    if (bound > precision) return `response-fit: 4ε/σ = ${bound.toExponential(3)} exceeds the requested ${precision.toExponential(3)}; lengthen or refine the trace, or declare the C_j Δt² shift instead`;
    return null;
  };
  return { poles, epsilon: eps, sigma, sigmaMax: sv.max, LJ, precondition, bound, iterations, raw, spec,
    certified: (precision) => refusal(precision) === null, refusal,
    kernel: (om, Om2) => imKernel(om - Om2, h, q, N, qN)[0] - imKernel(om + Om2, h, q, N, qN)[0] };
}

/** K_M(ω, Ω) on its own, for the kernel identity against lab/absorb.js's transform */
export function kernel({ dt, tau = Infinity, M }) {
  const N = M - 1, gam = tau === Infinity ? 0 : 1 / tau, q = Math.exp(-gam * dt), qN = Math.exp(-gam * dt * N);
  return (omega, Omega) => imKernel(omega - Omega, dt, q, N, qN)[0] - imKernel(omega + Omega, dt, q, N, qN)[0];
}
