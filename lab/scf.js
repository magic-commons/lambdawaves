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
function solveLinear(Ain, bin, n) {
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

/** the exchange matrix K[D]_ij = Σ_kl D_kl (il|kj) — fockReal(D) is h + J[D] − ½K[D], left as it was so every closed shell keeps its bits */
function exchange({ eri, n }, D) {
  const K = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let f = 0; for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) f += D[k * n + l] * eri[((i * n + l) * n + k) * n + j]; K[i * n + j] = f; }
  return K;
}
/**
 * uhf(basis, { nAlpha, nBeta, diis = 8, maxIter = 200, tol = 1e-10, guess = 'core', mix = 0 }) — UNRESTRICTED HF (Pople–Nesbet 1954): rhf's loop with
 * two densities.  Fσ = h + J[Dα + Dβ] − K[Dσ] = fockReal(D) ∓ ½K[Ds], D = Dα + Dβ (Tr DS = N, as rhf's), Ds = Dα − Dβ; one DIIS over the two error
 * vectors end to end; rhf's round-off floor.  guess: 'core' or an n × n total density split nα : nβ.  mix: the α HOMO takes tan θ = mix of the α LUMO
 * on the first build — the broken-symmetry seed a singlet needs to leave the RHF point, with DIIS held until ‖ẽ‖ < 1e-4 (sooner, it extrapolates back onto the RHF saddle: H₂ at 3 bohr).  ⟨S²⟩ = Sz(Sz + 1) + nβ − Σ_ij |Cαᵢᵀ S Cβⱼ|².
 */
export function uhf(basis, { nAlpha, nBeta, diis = 8, maxIter = 200, tol = 1e-10, guess = 'core', mix = 0 } = {}) {
  const { n, S, h, Enuc = 0 } = basis, nn = n * n, { X } = loewdin(S, n), Xt = tr(X, n), N = nAlpha + nBeta, sp = [nAlpha, nBeta];
  if (!(nAlpha >= nBeta && nBeta >= 0 && N > 0 && nAlpha <= n)) throw new Error('scf: uhf needs n ≥ nα ≥ nβ ≥ 0');
  let Ds = sp.map((k) => (guess === 'core' ? new Float64Array(nn) : Float64Array.from(guess, (v) => v * k / N)));
  let F = null, C = null, eps = null, energy = NaN, converged = false, iterations = 0, errMax = Infinity, best = Infinity, stall = 0, floor = null;
  const Fs = [], Es = [];
  for (let it = 0; it < maxIter; it++) {
    const D = Ds[0].map((v, k) => v + Ds[1][k]), G = fockReal(basis, D), Kh = exchange(basis, Ds[0].map((v, k) => (v - Ds[1][k]) / 2));
    F = [G.map((v, k) => v - Kh[k]), G.map((v, k) => v + Kh[k])];
    let Enow = Enuc; for (let k = 0; k < nn; k++) Enow += 0.5 * (D[k] * h[k] + Ds[0][k] * F[0][k] + Ds[1][k] * F[1][k]);
    const et = F.map((Fq, q) => { const e = mm(mm(Fq, Ds[q], n), S, n), e2 = mm(mm(S, Ds[q], n), Fq, n); for (let k = 0; k < nn; k++) e[k] -= e2[k]; return mm(mm(Xt, e, n), X, n); });
    errMax = 0; for (const e of et) for (const v of e) errMax = Math.max(errMax, Math.abs(v));
    if (it > 0 && errMax < tol && Math.abs(Enow - energy) < tol) { energy = Enow; converged = true; iterations = it; break; }
    if (errMax < best * (1 - 1e-3)) { best = errMax; stall = 0; } else stall++;
    if (it > 0 && stall >= 25 && best < 1e-6 && Math.abs(Enow - energy) < tol) { energy = Enow; converged = true; iterations = it; floor = best; break; }
    energy = Enow; iterations = it + 1;
    let Fuse = F;
    if (diis > 0 && it > 0 && (!mix || errMax < 1e-4)) {
      Fs.push(F); Es.push(et); if (Fs.length > diis) { Fs.shift(); Es.shift(); }
      while (Fs.length >= 2) {
        const m = Fs.length, B = new Float64Array((m + 1) * (m + 1)), rhs = new Float64Array(m + 1);
        for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) { let s = 0; for (let q = 0; q < 2; q++) for (let k = 0; k < nn; k++) s += Es[i][q][k] * Es[j][q][k]; B[i * (m + 1) + j] = s; }
        for (let i = 0; i < m; i++) { B[i * (m + 1) + m] = -1; B[m * (m + 1) + i] = -1; }
        rhs[m] = -1;
        let c; try { c = solveLinear(B, rhs, m + 1); } catch { Fs.shift(); Es.shift(); continue; }
        Fuse = [0, 1].map((q) => { const A = new Float64Array(nn); for (let i = 0; i < m; i++) for (let k = 0; k < nn; k++) A[k] += c[i] * Fs[i][q][k]; return A; });
        break;
      }
    }
    const eig = Fuse.map((Fq) => eigSym(mm(mm(X, Fq, n), X, n), n));
    eps = eig.map((e) => e.values); C = eig.map((e) => mm(X, e.vectors, n));
    if (it === 0 && mix && nAlpha < n) { const c = 1 / Math.hypot(1, mix), H = nAlpha - 1;      // the broken-symmetry seed, once
      for (let i = 0; i < n; i++) { const a = C[0][i * n + H], b = C[0][i * n + H + 1]; C[0][i * n + H] = c * (a + mix * b); C[0][i * n + H + 1] = c * (b - mix * a); } }
    Ds = C.map((Cq, q) => { const P = new Float64Array(nn); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0; for (let o = 0; o < sp[q]; o++) s += Cq[i * n + o] * Cq[j * n + o]; P[i * n + j] = s; } return P; });
  }
  const SCb = mm(S, C[1], n); let ov = 0;
  for (let i = 0; i < nAlpha; i++) for (let j = 0; j < nBeta; j++) { let s = 0; for (let k = 0; k < n; k++) s += C[0][k * n + i] * SCb[k * n + j]; ov += s * s; }
  const Sz = (nAlpha - nBeta) / 2;
  return { energy, electronic: energy - Enuc, Calpha: C[0], Cbeta: C[1], epsAlpha: eps[0], epsBeta: eps[1], Dalpha: Ds[0], Dbeta: Ds[1], Falpha: F[0], Fbeta: F[1],
    D: Ds[0].map((v, k) => v + Ds[1][k]), Ds: Ds[0].map((v, k) => v - Ds[1][k]), s2: Sz * (Sz + 1) + nBeta - ov, iterations, converged, floor, error: errMax, nAlpha, nBeta };
}
/** slaterVwn(ρ) → { exc, vxc }: ε_xc per electron and v_xc = d(ρε_xc)/dρ, paramagnetic.  Slater exchange, α = 2/3: ε_x = −¾(3ρ/π)^{1/3}, v_x = (4/3)ε_x.
 *  VWN5 correlation (Vosko, Wilk & Nusair, Can. J. Phys. 58, 1200 (1980), the Ceperley–Alder fit; PySCF's 'vwn' = libxc LDA_C_VWN, not VWN3/RPA), x = √r_s:
 *  A = 0.0310907, b = 3.72744, c = 12.9352, x₀ = −0.10498, Q = √(4c − b²), X(x) = x² + bx + c; v_c = ε_c − (x/6) dε_c/dx. */
const VA = 0.0310907, VB = 3.72744, VC = 12.9352, V0 = -0.10498, VQ = Math.sqrt(4 * VC - VB * VB), VX0 = V0 * V0 + VB * V0 + VC;
function slaterVwn(rho) {
  const ex = -0.75 * Math.cbrt(3 * rho / Math.PI), x = Math.sqrt(Math.cbrt(3 / (4 * Math.PI * rho))), X = x * x + VB * x + VC, t = 2 * x + VB, at = Math.atan(VQ / t), q = t * t + VQ * VQ;
  const ec = VA * (Math.log(x * x / X) + 2 * VB / VQ * at - VB * V0 / VX0 * (Math.log((x - V0) ** 2 / X) + 2 * (VB + 2 * V0) / VQ * at));
  const de = VA * (2 / x - t / X - 4 * VB / q - VB * V0 / VX0 * (2 / (x - V0) - t / X - 4 * (VB + 2 * V0) / q));
  return { exc: ex + ec, vxc: 4 / 3 * ex + ec - x / 6 * de };
}
/**
 * rks(basis, { nElectrons, grid, aoAt, xc = 'lda', diis = 8, maxIter = 200, tol = 1e-10, guess = 'core' }) — RESTRICTED KOHN–SHAM, LDA (0.7.3 K1): rhf's loop
 * with one change of Fock, F = h + J[D] + V_xc[ρ] = fockReal(D) + ½K[D] + V_xc (no exact exchange; fockReal untouched), E = Σ D(h + J/2) + E_xc + E_nuc.
 * grid = { w } (lab/dft-grid.js); aoAt[g·n + p] = χ_p at point g, built once per molecule; ρ_g = Σ D_pq χ_p χ_q, V_xc,pq = Σ_g w_g v_xc(ρ_g) χ_p χ_q.
 */
export function rks(basis, { nElectrons, grid, aoAt, xc = 'lda', diis = 8, maxIter = 200, tol = 1e-10, guess = 'core' } = {}) {
  const { n, S, h, Enuc = 0 } = basis, nn = n * n, nocc = nElectrons / 2, { X } = loewdin(S, n), Xt = tr(X, n), w = grid.w, P = w.length;
  if (xc !== 'lda' || !Number.isInteger(nocc) || nocc < 1) throw new Error('scf: rks is closed-shell LDA');
  let D = guess === 'core' ? new Float64Array(nn) : Float64Array.from(guess), F, C, eps, energy = NaN, exc = 0, intRho = 0, converged = false, iterations = 0;
  let errMax = Infinity, best = Infinity, stall = 0, floor = null;
  const Fs = [], Es = [], V = new Float64Array(nn);
  for (let it = 0; it < maxIter; it++) {
    V.fill(0); exc = 0; intRho = 0;
    for (let g = 0, o = 0; g < P; g++, o += n) {
      let rho = 0;
      for (let p = 0; p < n; p++) { const cp = aoAt[o + p]; let s = 0.5 * D[p * n + p] * cp; for (let q = 0; q < p; q++) s += D[p * n + q] * aoAt[o + q]; rho += 2 * cp * s; }
      if (!(rho > 1e-30)) continue;
      const { exc: e, vxc: v } = slaterVwn(rho), wv = w[g] * v; exc += w[g] * rho * e; intRho += w[g] * rho;
      for (let p = 0; p < n; p++) { const a = wv * aoAt[o + p]; for (let q = 0; q <= p; q++) V[p * n + q] += a * aoAt[o + q]; }
    }
    for (let p = 0; p < n; p++) for (let q = 0; q < p; q++) V[q * n + p] = V[p * n + q];
    const G = fockReal(basis, D), K = exchange(basis, D);
    F = G.map((v, k) => v + 0.5 * K[k] + V[k]);
    let Enow = Enuc + exc; for (let k = 0; k < nn; k++) Enow += 0.5 * D[k] * (h[k] + G[k] + 0.5 * K[k]);
    const e = mm(mm(F, D, n), S, n), e2 = mm(mm(S, D, n), F, n); for (let k = 0; k < nn; k++) e[k] -= e2[k];
    const et = mm(mm(Xt, e, n), X, n); errMax = 0; for (const v of et) errMax = Math.max(errMax, Math.abs(v));
    if (it > 0 && errMax < tol && Math.abs(Enow - energy) < tol) { energy = Enow; converged = true; iterations = it; break; }
    if (errMax < best * (1 - 1e-3)) { best = errMax; stall = 0; } else stall++;
    if (it > 0 && stall >= 25 && best < 1e-6 && Math.abs(Enow - energy) < tol) { energy = Enow; converged = true; iterations = it; floor = best; break; }
    energy = Enow; iterations = it + 1;
    let Fuse = F;
    if (diis > 0 && it > 0) {
      Fs.push(F); Es.push(et); if (Fs.length > diis) { Fs.shift(); Es.shift(); }
      while (Fs.length >= 2) {
        const m = Fs.length, B = new Float64Array((m + 1) * (m + 1)), rhs = new Float64Array(m + 1);
        for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) { let s = 0; for (let k = 0; k < nn; k++) s += Es[i][k] * Es[j][k]; B[i * (m + 1) + j] = s; }
        for (let i = 0; i < m; i++) { B[i * (m + 1) + m] = -1; B[m * (m + 1) + i] = -1; }
        rhs[m] = -1;
        let c; try { c = solveLinear(B, rhs, m + 1); } catch { Fs.shift(); Es.shift(); continue; }
        Fuse = new Float64Array(nn); for (let i = 0; i < m; i++) for (let k = 0; k < nn; k++) Fuse[k] += c[i] * Fs[i][k];
        break;
      }
    }
    const eig = eigSym(mm(mm(X, Fuse, n), X, n), n); eps = eig.values; C = mm(X, eig.vectors, n);
    D = new Float64Array(nn); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0; for (let o = 0; o < nocc; o++) s += C[i * n + o] * C[j * n + o]; D[i * n + j] = 2 * s; }
  }
  return { energy, electronic: energy - Enuc, exc, intRho, orbitalEnergies: eps, C, D, F, iterations, converged, floor, error: errMax, nocc };
}
