/* stark.js — INTER-SHELL STARK (0.8.0 G3): H = diag(E) + F·z over the register's 91 labels, eigensolved once per F, as the propagator
 * Register.setPropagator takes (S = I: the labels are orthonormal, so evolve(c, t) = C e^{−iEt} Cᵀ c and the S-norm is ‖c‖²).  z couples every
 * shell, so it is exact WITHIN the n ≤ 6 basis; the continuum is absent, so ionisation is SAID: the classical saddle F_c = 1/(16 n⁴) is printed
 * and a shell past it would ionise — this basis holds it.  The basis's polarizability is its own sum over states (≈ 81 % of the exact 9/2). */
import { BASIS, radial } from './hydrogen.js';
import { eigSymQL } from './linalg.js';
/* THE SONG's z (0.6.4 S1, moved here from mathworker.js, which re-exports it: ONE build for the frame thread and the worker).  z = δ_mm' ∫R_nl R_n'l' r³ dr
 * (trapezoid, 20 000 points to r = 400) × √(((l+1)² − m²)/((2l+1)(2l+3))), eigensolved once (eigSymQL — what the tree's eigSym runs at n = 91). */
let hzOp = null;
export function hydrogenZ() {
  if (hzOp) return hzOp;
  const N = BASIS.length, M = 20000, dr = 400 / M, Z = new Float64Array(N * N), R = new Map(), tab = (n, l) => R.get(n * 10 + l) || R.set(n * 10 + l, Float64Array.from({ length: M + 1 }, (_, i) => radial(n, l, i * dr))).get(n * 10 + l);
  for (const a of BASIS) for (const b of BASIS) if (b.m === a.m && b.l === a.l + 1) { const A = tab(a.n, a.l), B = tab(b.n, b.l); let s = 0.5 * A[M] * B[M] * 400 ** 3; for (let i = 1; i < M; i++) s += A[i] * B[i] * (i * dr) ** 3; Z[a.index * N + b.index] = Z[b.index * N + a.index] = s * dr * Math.sqrt(((a.l + 1) ** 2 - a.m ** 2) / ((2 * a.l + 1) * (2 * a.l + 3))); }
  const e = eigSymQL(Z, N); return (hzOp = { N, values: Float64Array.from(e.values), U: e.vectors, R: Z });
}
/** the classical saddle: past F_c = 1/(16 n⁴) shell n would field-ionise */
export const saddle = (n) => 1 / (16 * n ** 4);
/** α of the basis: 2 Σ_k |⟨1s|z|k⟩|² / (E_k − E_1s), the n ≤ 6 sum over states (every number computed; the exact hydrogen α is 9/2) */
export function polarizability(E = Float64Array.from(BASIS, (s) => s.E)) { const z = hydrogenZ().R; let a = 0; for (let k = 1; k < BASIS.length; k++) a += 2 * z[k] ** 2 / (E[k] - E[0]); return a; }
/** starkPropagator(F, E) → the object Register.setPropagator takes: H = diag(E) + F·z, its eigenpairs, evolve, norm (S = I) */
export function starkPropagator(F, E = Float64Array.from(BASIS, (s) => s.E)) {
  const N = BASIS.length, z = hydrogenZ().R, H = new Float64Array(N * N), S = new Float64Array(N * N), t0 = performance.now();
  for (let i = 0; i < N * N; i++) H[i] = F * z[i];
  for (let a = 0; a < N; a++) { H[a * N + a] = E[a]; S[a * N + a] = 1; }
  const { values: Ev, vectors: C } = eigSymQL(H, N), CtS = new Float64Array(N * N), mK = new Int8Array(N), ms = performance.now() - t0;
  for (let k = 0; k < N; k++) { let w = 0; for (let a = 0; a < N; a++) { CtS[k * N + a] = C[a * N + k]; if (Math.abs(C[a * N + k]) > w) { w = Math.abs(C[a * N + k]); mK[k] = BASIS[a].m; } } }
  const norm = (c) => { let s = 0; for (let a = 0; a < N; a++) s += c.re[a] ** 2 + c.im[a] ** 2; return s; };
  function evolve(c, t) {
    const dr = new Float64Array(N), di = new Float64Array(N), re = new Float64Array(N), im = new Float64Array(N);
    for (let k = 0; k < N; k++) { let r = 0, i = 0; for (let a = 0; a < N; a++) { const w = CtS[k * N + a]; r += w * c.re[a]; i += w * c.im[a]; } const cs = Math.cos(Ev[k] * t), sn = -Math.sin(Ev[k] * t); dr[k] = r * cs - i * sn; di[k] = r * sn + i * cs; }
    for (let a = 0; a < N; a++) { let r = 0, i = 0; for (let k = 0; k < N; k++) { const w = C[a * N + k]; r += w * dr[k]; i += w * di[k]; } re[a] = r; im[a] = i; }
    return { re, im };
  }
  return { stark: true, F, ms, n: N, rank: N, H, S, E: Ev, C, CtS, mK, evolve, norm };
}
