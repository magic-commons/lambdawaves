import assert from 'node:assert/strict';
import { createMO } from '../lab/mo.js';
import { generalisedEigen } from '../lab/sturmian.js';
import { kick, fieldFreeTrace, spectrum, peaks, integrate, kickSpectrum } from '../lab/absorb.js';

const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) < tol, `${what}: ${a} vs ${b} (tol ${tol})`);

/* 1. The transform alone: a pure sinusoid δμ = A sin(ω₀t) peaks at ω₀ with ∫S dω = A ω₀ / κ. */
{
  const dt = 0.05, M = 40001, w0 = 0.4321, A = 2e-3, kappa = 1e-3, trace = new Float64Array(M);
  for (let n = 0; n < M; n++) trace[n] = 0.7 + A * Math.sin(w0 * n * dt);
  const spec = spectrum(trace, { dt, kappa, tau: 500, wMin: 0.05, wMax: 1.0, dw: 5e-4 }), pk = peaks(spec);
  assert.equal(pk.length, 1, 'one peak'); close(pk[0].omega, w0, 1e-5, 'synthetic peak position (finite window e^{-T/τ} = 0.018 and the counter-rotating term bias it at the 1e-6 level)');
  close(integrate(spec), A * w0 / kappa, 0.01 * A * w0 / kappa, 'synthetic strength (finite window, damped)');
  console.log(`PASS transform: peak ${pk[0].omega.toFixed(7)} for ω₀ = ${w0}; strength ${integrate(spec).toFixed(5)} vs ${(A * w0 / kappa).toFixed(5)}.`);
}

/* 2. Two-level laws on H₂⁺ in the 1s LCAO Slater basis at R = 2: peak at E₁ − E₀, amplitude 2κ z₀₁², ∫S = 2ω z₀₁². */
{
  const mo = createMO({ kind: 'lcao1s' }), R = 2, M = mo.basisAt(R).M, S = M.S, H = M.H, Z = M.positionZ, n = 2;
  const { E, C } = generalisedEigen(S, H), gap = E[1] - E[0];
  let z01 = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) z01 += C[i * n + 0] * Z[i * n + j] * C[j * n + 1];
  const c0 = { re: Float64Array.from(mo.vector(mo.solve(R))), im: new Float64Array(n) }, kappa = 1e-3;
  const run = kickSpectrum({ S, H, Z }, c0, { kappa, dt: 0.05, T: 2000, tau: 500, wMin: 0.05, wMax: 1.2 });
  assert.equal(run.peaks.length, 1, 'a two-level system has one peak');
  close(run.peaks[0].omega, gap, 1e-5, 'peak at the eigenvalue gap');
  let amp = 0; for (const v of run.trace) amp = Math.max(amp, Math.abs(v - run.trace[0]));
  close(amp, 2 * kappa * z01 * z01, 2 * kappa * kappa, 'δμ amplitude 2κz₀₁² to O(κ²)');
  close(run.strength, 2 * gap * z01 * z01, 0.01 * 2 * gap * z01 * z01, 'oscillator strength 2ω z₀₁² (finite window)');
  const nrm = (c) => { let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += S[i * n + j] * (c.re[i] * c.re[j] + c.im[i] * c.im[j]); return s; };
  close(nrm(run.c), 1, 1e-13, 'the kick is S-unitary');
  const back = kick({ S, Z }, run.c, -kappa); for (let i = 0; i < n; i++) { close(back.re[i], c0.re[i], 1e-13, 'kick reversal re'); close(back.im[i], 0, 1e-13, 'kick reversal im'); }
  console.log(`PASS H₂⁺ 1s-LCAO: peak ${run.peaks[0].omega.toFixed(7)} vs gap ${gap.toFixed(7)}; amplitude ${amp.toExponential(6)} vs ${(2 * kappa * z01 * z01).toExponential(6)}; strength ${run.strength.toFixed(5)} vs ${(2 * gap * z01 * z01).toFixed(5)}.`);
}

/* 3. A many-level basis (Sturmian n ≤ 3, 12 functions): every peak sits on a gap E_k − E₀, and each strong line's
      integrated strength is 2 ω_k0 z_k0². The trace is damped to e^{−T/τ} ≈ 4e-6 so the window's sinc ripple
      (spacing 2π/T) stays below the weakest line — the ripple was a forest of false peaks at T/τ = 5. */
{
  const mo = createMO({ kind: 'sturmian', nMax: 3 }), R = 2, M = mo.basisAt(R).M, S = M.S, H = M.H, Z = M.positionZ, n = mo.n;
  const { E, C } = generalisedEigen(S, H);
  const c0 = { re: Float64Array.from(mo.vector(mo.solve(R))), im: new Float64Array(n) };
  const T = 4000, tau = 320, run = kickSpectrum({ S, H, Z }, c0, { kappa: 1e-3, dt: 0.02, T, tau, wMin: 0.05, wMax: 4.5, dw: 5e-4, fraction: 1e-3 });
  const gaps = Array.from(E).map((e) => e - E[0]), z0 = [];
  for (let k = 0; k < n; k++) { let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += C[i * n + 0] * Z[i * n + j] * C[j * n + k]; z0.push(s); }
  assert.ok(run.peaks.length >= 3, `expected several dipole-allowed levels, found ${run.peaks.length}`);
  for (const p of run.peaks) { const d = Math.min(...gaps.map((g) => Math.abs(g - p.omega))); assert.ok(d < 3e-4, `peak ${p.omega} is ${d} from the nearest gap`); }
  const lines = gaps.map((g, k) => ({ k, omega: g, strength: 2 * g * z0[k] * z0[k] })).filter((l) => l.k > 0 && l.omega < 4.4 && l.strength > 5e-3);
  for (const l of lines) {
    const found = run.peaks.find((p) => Math.abs(p.omega - l.omega) < 3e-4); assert.ok(found, `line k = ${l.k} at ${l.omega} not found`);
    let s = 0; const { omega, S: Sw } = run.spec, half = 12 / tau;                    // ±12γ window around the line
    for (let i = 1; i < omega.length; i++) if (Math.abs(omega[i] - l.omega) < half) s += 0.5 * (Sw[i] + Sw[i - 1]) * (omega[i] - omega[i - 1]);
    close(s, l.strength, 0.06 * l.strength, `strength of line k = ${l.k}`);
  }
  console.log(`PASS Sturmian n ≤ 3: ${run.peaks.length} peaks on gaps; lines ${lines.map((l) => l.omega.toFixed(4)).join(', ')} carry 2ωz² to 6 %; total ${run.strength.toFixed(4)}.`);
}
