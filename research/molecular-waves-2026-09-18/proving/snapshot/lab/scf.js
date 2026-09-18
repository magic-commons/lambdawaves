/* scf.js — the restricted Hartree–Fock self-consistent field with Pulay's commutator DIIS, PORT 3 of the ChronusQ map.
 * Atomic units.  STATUS: KNOWN method (Roothaan 1951; Pulay 1980, 1982), DERIVED-HERE assembly, gated by
 * tests/scf.test.mjs against Szabo–Ostlund's anchors and h2ci.js's independent homonuclear integrals.
 *
 * Closed shell, N electrons in N/2 doubly occupied orbitals.  In the AO basis with overlap S and X = S^{−1/2}:
 *     F[D] = h + Σ_kl D_kl [ (ij|kl) − ½ (il|kj) ] ,   D = 2 Σ_occ c cᵀ ,   E = ½ Σ_ij D_ij (h_ij + F_ij) + E_nuc
 *     F̃ = X F X ,   F̃ C̃ = C̃ ε ,   C = X C̃ .
 * The stationarity condition is [F, D S] = 0; Pulay's error vector is e = F D S − S D F carried to the orthonormal
 * frame, ẽ = Xᵀ e X, and CDIIS extrapolates the Fock matrix as F = Σ_i c_i F_i with the c_i minimising ‖Σ c_i ẽ_i‖
 * subject to Σ c_i = 1 — the Lagrangian system  [ B  −1 ; −1ᵀ  0 ] [ c ; λ ] = [ 0 ; −1 ],  B_ij = ⟨ẽ_i, ẽ_j⟩.
 * Fock damping F ← (1 − d) F_new + d F_old is the cheap alternative for the first cycles.  No ChronusQ paper
 * prints these equations; Pulay does.  The projection trick h2ci.js uses for homonuclear H₂ is not needed here
 * because DIIS damps the a↔b instability it was written for.
 */
import { eigSym } from './h2ci.js';
import { loewdin } from './density.js';

/** Gaussian elimination with partial pivoting, A x = b, A row-major n × n; returns x */
export function solveLinear(Ain, bin, n) {
  const A = Float64Array.from(Ain), b = Float64Array.from(bin);
  let scale = 0; for (const v of A) scale = Math.max(scale, Math.abs(v)); scale = scale || 1;
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r * n + c]) > Math.abs(A[piv * n + c])) piv = r;
    if (piv !== c) { for (let k = 0; k < n; k++) { const t = A[c * n + k]; A[c * n + k] = A[piv * n + k]; A[piv * n + k] = t; } const t = b[c]; b[c] = b[piv]; b[piv] = t; }
    const d = A[c * n + c]; if (Math.abs(d) < 1e-13 * scale) throw new Error('scf: singular DIIS system');
    for (let r = c + 1; r < n; r++) { const f = A[r * n + c] / d; if (f === 0) continue; for (let k = c; k < n; k++) A[r * n + k] -= f * A[c * n + k]; b[r] -= f * b[c]; }
  }
  const x = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) { let s = b[r]; for (let k = r + 1; k < n; k++) s -= A[r * n + k] * x[k]; x[r] = s / A[r * n + r]; }
  return x;
}

const mm = (A, B, n) => { const C = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const a = A[i * n + k]; if (a === 0) continue; for (let j = 0; j < n; j++) C[i * n + j] += a * B[k * n + j]; } return C; };
const tr = (A, n) => { const T = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) T[j * n + i] = A[i * n + j]; return T; };

/** the closed-shell Fock matrix F[D] for a real density D, with the chemist's tensor g */
export function fockReal({ h, eri, n }, D) {
  const F = Float64Array.from(h);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let f = 0;
    for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) f += D[k * n + l] * (eri[((i * n + j) * n + k) * n + l] - 0.5 * eri[((i * n + l) * n + k) * n + j]);
    F[i * n + j] += f; }
  return F;
}

/**
 * rhf(basis, { nElectrons, diis = 8, damping = 0, maxIter = 200, tol = 1e-10, guess = 'core' })
 *   → { energy, electronic, orbitalEnergies, C, D, F, iterations, converged, history, diisUsed }
 * basis = { n, S, h, eri, Enuc } (gaussian.js's sBasis, or any real basis in the same shape).
 * guess: 'core' (D = 0, so F = h) or an n × n starting density — N₂/STO-3G needs a non-core guess, because every
 * option of this module started from the core converges on a SECOND aufbau RHF solution 0.7298 hartree up
 * (MATH-H2O ROUND 4 · OPUS §5, and PySCF's init_guess='hcore' agrees).  lab/rhf-molecule.js supplies SAD.
 */
export function rhf(basis, { nElectrons, diis = 8, damping = 0, maxIter = 200, tol = 1e-10, guess = 'core' } = {}) {
  const { n, S, h, Enuc = 0 } = basis;
  if (!Number.isInteger(nElectrons) || nElectrons < 2 || nElectrons % 2) throw new Error('scf: rhf needs an even electron count ≥ 2');
  const nocc = nElectrons / 2, { X } = loewdin(S, n), Xt = tr(X, n);
  if (guess && guess !== 'core' && guess.length !== n * n) throw new Error('scf: rhf guess must be "core" or an n × n density');
  let D = guess && guess !== 'core' ? Float64Array.from(guess) : new Float64Array(n * n);
  let Fprev = null, energy = NaN, converged = false, iterations = 0, diisUsed = 0;
  const history = [], Fs = [], Es = [];
  const energyOf = (Dm, F) => { let E = Enuc; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) E += 0.5 * Dm[i * n + j] * (h[i * n + j] + F[i * n + j]); return E; };
  let C = null, eps = null, F = null, errMax = Infinity;
  /* ── THE ROUND-OFF FLOOR, and why `errMax < tol` alone cannot be the whole test ──────────────────────────────
   * `tol` is compared against an ABSOLUTE commutator residual, and the residual's floor is set by the size of F.
   * H₂O's |F|max is 20 and it reaches 1e-12 in a dozen iterations; Br₂'s |F|max is 485 (the Br 1s sits near −490
   * hartree), its residual bottoms out at 8e-12 by iteration 14 and then WANDERS in the 1e-11 band for ever — so at
   * tol = 1e-12 the heavy molecules burned all 200 iterations, reported `converged: false`, and cost 13× what the
   * answer cost, with the energy already right to 1e-12 from iteration 20.  So a second test: once the residual has
   * stopped improving on its own best for STALL iterations, and the energy has stopped moving, this IS convergence
   * at the arithmetic's floor, and the floor is reported.  It can only fire where the first test never would — a
   * light molecule reaches tol first and exits at exactly the iteration it always did, with the same energy. */
  const STALL = 25, FLOOR_MAX = 1e-6;
  let best = Infinity, stall = 0, floor = null;
  for (let it = 0; it < maxIter; it++) {
    F = fockReal(basis, D);
    const Enow = energyOf(D, F);
    const e = mm(mm(F, D, n), S, n), e2 = mm(mm(S, D, n), F, n);
    for (let k = 0; k < n * n; k++) e[k] -= e2[k];
    const et = mm(mm(Xt, e, n), X, n);
    errMax = 0; for (let k = 0; k < n * n; k++) errMax = Math.max(errMax, Math.abs(et[k]));
    history.push({ energy: Enow, error: errMax });
    if (it > 0 && errMax < tol && Math.abs(Enow - energy) < tol) { energy = Enow; converged = true; iterations = it; break; }
    if (errMax < best * (1 - 1e-3)) { best = errMax; stall = 0; } else stall++;
    if (it > 0 && stall >= STALL && best < FLOOR_MAX && Math.abs(Enow - energy) < tol) {
      energy = Enow; converged = true; iterations = it; floor = best; break;           // the residual's round-off floor
    }
    energy = Enow; iterations = it + 1;
    let Fuse = F;
    if (diis > 0 && it > 0) {
      Fs.push(Float64Array.from(F)); Es.push(et); if (Fs.length > diis) { Fs.shift(); Es.shift(); }
      /* In an n-function basis the antisymmetric ẽ has n(n−1)/2 independent entries, so more than that many error
         vectors are collinear and B is singular (n = 2: ONE component).  Drop the oldest and retry, down to two. */
      while (Fs.length >= 2) {
        const m = Fs.length, B = new Float64Array((m + 1) * (m + 1)), rhs = new Float64Array(m + 1);
        for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) { let s = 0; for (let k = 0; k < n * n; k++) s += Es[i][k] * Es[j][k]; B[i * (m + 1) + j] = s; }
        for (let i = 0; i < m; i++) { B[i * (m + 1) + m] = -1; B[m * (m + 1) + i] = -1; }
        rhs[m] = -1;
        let c; try { c = solveLinear(B, rhs, m + 1); } catch { Fs.shift(); Es.shift(); continue; }
        Fuse = new Float64Array(n * n);
        for (let i = 0; i < m; i++) for (let k = 0; k < n * n; k++) Fuse[k] += c[i] * Fs[i][k];
        diisUsed++; break;
      }
    } else if (damping > 0 && Fprev) {
      Fuse = Float64Array.from(F, (v, k) => (1 - damping) * v + damping * Fprev[k]);
    }
    Fprev = F;
    const Ft = mm(mm(X, Fuse, n), X, n), eig = eigSym(Ft, n);
    eps = eig.values; C = mm(X, eig.vectors, n);                             // C[ao * n + mo]
    const Dn = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0; for (let o = 0; o < nocc; o++) s += C[i * n + o] * C[j * n + o]; Dn[i * n + j] = 2 * s; }
    D = Dn;
  }
  return { energy, electronic: energy - Enuc, orbitalEnergies: eps, C, D, F, iterations, converged, history, diisUsed, error: errMax, floor, nocc };
}
