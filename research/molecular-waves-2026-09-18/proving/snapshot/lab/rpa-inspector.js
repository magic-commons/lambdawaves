/* rpa-inspector.js — the singlet RPA/TDA excitation inspector, B-H2O-7 of research/MATH-H2O-2026-09-11.md.
 * Atomic units.  STATUS: KNOWN equations (Casida 1995; Szabo–Ostlund §13.7), DERIVED-HERE assembly, gated by
 * tests/rpa-inspector.test.mjs against PySCF TDHF/TDA (tests/fixtures/h2o-response.json) and, for H₂ STO-3G,
 * against the two-level closed form tests/density.test.mjs holds lab/density.js to.
 *
 * From the converged RHF orbitals C (C[ao·n + mo], ascending ε) the occupied–virtual pair basis (i, a) carries the
 * singlet blocks
 *     A_{ia,jb} = δ_ij δ_ab (ε_a − ε_i) + 2(ia|jb) − (ij|ab) ,     B_{ia,jb} = 2(ia|jb) − (ib|ja)
 * in chemists' notation, both real symmetric.  TDA is A alone: A X = ω X, ⟨X|X⟩ = 1.  RPA (TDHF) is the paired
 * problem [[A, B], [B, A]] (X; Y) = ω (1, −1)(X; Y), solved through the Hermitian half-size route (Chandrasekhar
 * 1955; Stratmann–Scuseria–Frisch 1998): with A − B positive definite,
 *     M = (A−B)^{1/2} (A+B) (A−B)^{1/2} ,   M Z = ω² Z ,   ⟨Z|Z⟩ = 1 ,
 *     X + Y = ω^{−1/2} (A−B)^{1/2} Z ,      X − Y = ω^{+1/2} (A−B)^{−1/2} Z ,
 * which gives ⟨X+Y|X−Y⟩ = XᵀX − YᵀY = 1, the left/right normalisation of the paired problem.  Transition dipoles
 * take the spin-adaptation factor √2 of the singlet combination, and only X+Y enters:
 *     μ_q = √2 Σ_ia (X_ia + Y_ia) ⟨φ_i| q |φ_a⟩ ,      f = (2/3) ω |μ|² .
 * MUST NOT CLAIM: correlated excited states, double excitations, Rydberg completeness, experimental line positions.
 */
import { eigSym } from './h2ci.js';

/** the four-index transform (pq|rs) = Σ C_ip C_jq C_kr C_ls (ij|kl), O(n⁵), full tensor */
function moEri(eri, C, n) {
  const g = (A, B) => {                                                      // contract the leading AO index of A
    for (let k = 0; k < B.length; k++) B[k] = 0;
    for (let i = 0; i < n; i++) for (let p = 0; p < n; p++) {
      const c = C[i * n + p]; if (c === 0) continue;
      for (let r = 0; r < n * n * n; r++) B[p * n * n * n + r] += c * A[i * n * n * n + r];
    }
  };
  const roll = (A, B) => {                                                   // (p, j, k, l) → (j, k, l, p)
    for (let p = 0; p < n; p++) for (let r = 0; r < n * n * n; r++) B[r * n + p] = A[p * n * n * n + r];
  };
  let a = Float64Array.from(eri), b = new Float64Array(n ** 4);
  for (let pass = 0; pass < 4; pass++) { g(a, b); roll(b, a); }               // four contract-and-rotate passes
  return a;
}

/** U diag(f(λ)) Uᵀ for a real symmetric positive matrix, from the Jacobi eigenpairs */
function symFunc(A, m, f) {
  const e = eigSym(A, m), out = new Float64Array(m * m);
  if (!(e.values[0] > 0)) throw new Error('rpa: A − B is not positive definite; the RHF reference is not a minimum');
  for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
    let s = 0; for (let k = 0; k < m; k++) s += e.vectors[i * m + k] * f(e.values[k]) * e.vectors[j * m + k];
    out[i * m + j] = s;
  }
  return out;
}
const matmul = (A, B, m) => { const C = new Float64Array(m * m); for (let i = 0; i < m; i++) for (let k = 0; k < m; k++) { const a = A[i * m + k]; if (a === 0) continue; for (let j = 0; j < m; j++) C[i * m + j] += a * B[k * m + j]; } return C; };

/**
 * rpa({ S, h, eri, X, Y, Z, C, eps, nocc }) → { roots, A, B, nocc, nvir, pairs, orthonormality, scfResidual }
 * X, Y, Z are the three AO dipole (position) matrices; C[ao·n + mo]; eps ascending; eri[((i n + j) n + k) n + l].
 * roots is ascending in ω, one entry per occupied–virtual pair:
 *     { omega, omegaTDA, f, mu: [x, y, z], muTDA: [x, y, z], fTDA, X, Y, dominant: [{ i, a, x, y }] }
 */
export function rpa({ S, h, eri, X, Y, Z, C, eps, nocc } = {}) {
  const n = eps && eps.length;
  if (!n || !C || C.length !== n * n) throw new Error('rpa: C (n×n, C[ao·n + mo]) and eps (length n) required');
  if (!Number.isInteger(nocc) || nocc < 1 || nocc >= n) throw new Error('rpa: nocc must be an integer in [1, n)');
  if (!eri || eri.length !== n ** 4) throw new Error('rpa: eri must be the full n⁴ chemists tensor');
  const nvir = n - nocc, m = nocc * nvir, dips = [X, Y, Z];
  for (const M of dips) if (!M || M.length !== n * n) throw new Error('rpa: three n×n AO dipole matrices required');
  /* the reference is the caller's: check it against the metric, and report the Roothaan residual it implies */
  let orthonormality = 0;
  if (S) for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) {
    let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += C[i * n + p] * S[i * n + j] * C[j * n + q];
    orthonormality = Math.max(orthonormality, Math.abs(s - (p === q ? 1 : 0)));
  }
  if (orthonormality > 1e-8) throw new Error(`rpa: CᵀSC ≠ I (max deviation ${orthonormality}); C is not the metric's orbital set`);
  const g = moEri(eri, C, n), G = (p, q, r, s) => g[((p * n + q) * n + r) * n + s];
  /* A = Δε + 2(ia|jb) − (ij|ab),  B = 2(ia|jb) − (ib|ja) */
  const A = new Float64Array(m * m), B = new Float64Array(m * m), pairs = [];
  for (let i = 0; i < nocc; i++) for (let a = nocc; a < n; a++) pairs.push({ i, a });
  for (let p = 0; p < m; p++) for (let q = 0; q < m; q++) {
    const { i, a } = pairs[p], { i: j, a: b } = pairs[q], iajb = G(i, a, j, b);
    A[p * m + q] = (i === j && a === b ? eps[a] - eps[i] : 0) + 2 * iajb - G(i, j, a, b);
    B[p * m + q] = 2 * iajb - G(i, b, j, a);
  }
  /* TDA first: A alone */
  const tda = eigSym(A, m);
  /* RPA by the Hermitian half-size route */
  const AmB = new Float64Array(m * m), ApB = new Float64Array(m * m);
  for (let k = 0; k < m * m; k++) { AmB[k] = A[k] - B[k]; ApB[k] = A[k] + B[k]; }
  const half = symFunc(AmB, m, Math.sqrt), halfInv = symFunc(AmB, m, (x) => 1 / Math.sqrt(x));
  const Mh = matmul(matmul(half, ApB, m), half, m);
  for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) { const v = 0.5 * (Mh[i * m + j] + Mh[j * m + i]); Mh[i * m + j] = Mh[j * m + i] = v; }
  const sq = eigSym(Mh, m);
  /* MO dipoles ⟨φ_i| q |φ_a⟩ for the pair basis */
  const muMO = dips.map((M) => {
    const v = new Float64Array(m);
    for (let p = 0; p < m; p++) { const { i, a } = pairs[p]; let s = 0;
      for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) s += C[u * n + i] * M[u * n + w] * C[w * n + a];
      v[p] = s; }
    return v;
  });
  const R2 = Math.SQRT2, roots = [];
  for (let k = 0; k < m; k++) {
    if (!(sq.values[k] > 0)) throw new Error(`rpa: non-positive RPA eigenvalue ω² = ${sq.values[k]} (unstable reference)`);
    const omega = Math.sqrt(sq.values[k]), rw = Math.sqrt(omega);
    const Xv = new Float64Array(m), Yv = new Float64Array(m), XpY = new Float64Array(m);
    for (let p = 0; p < m; p++) {
      let hp = 0, hi = 0;
      for (let q = 0; q < m; q++) { hp += half[p * m + q] * sq.vectors[q * m + k]; hi += halfInv[p * m + q] * sq.vectors[q * m + k]; }
      const plus = hp / rw, minus = hi * rw;                                 // X+Y and X−Y
      XpY[p] = plus; Xv[p] = 0.5 * (plus + minus); Yv[p] = 0.5 * (plus - minus);
    }
    const mu = muMO.map((v) => { let s = 0; for (let p = 0; p < m; p++) s += R2 * XpY[p] * v[p]; return s; });
    const f = (2 / 3) * omega * mu.reduce((s, x) => s + x * x, 0);
    const xt = new Float64Array(m); for (let p = 0; p < m; p++) xt[p] = tda.vectors[p * m + k];
    const muT = muMO.map((v) => { let s = 0; for (let p = 0; p < m; p++) s += R2 * xt[p] * v[p]; return s; });
    const dominant = pairs.map((pr, p) => ({ i: pr.i, a: pr.a, x: Xv[p], y: Yv[p] }))
      .sort((u, w) => (w.x * w.x + w.y * w.y) - (u.x * u.x + u.y * u.y));
    roots.push({ omega, omegaTDA: tda.values[k], f, mu, fTDA: (2 / 3) * tda.values[k] * muT.reduce((s, x) => s + x * x, 0),
      muTDA: muT, X: Xv, Y: Yv, XTDA: xt, dominant });
  }
  /* the Roothaan residual max|F C − S C ε| of the reference the caller supplied, as a diagnostic only */
  let scfResidual = null;
  if (S && h) {
    const D = new Float64Array(n * n);
    for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) { let s = 0; for (let o = 0; o < nocc; o++) s += C[u * n + o] * C[w * n + o]; D[u * n + w] = 2 * s; }
    scfResidual = 0;
    for (let u = 0; u < n; u++) for (let p = 0; p < n; p++) {
      let fc = 0, sce = 0;
      for (let w = 0; w < n; w++) {
        let F = h[u * n + w];
        for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) F += D[k * n + l] * (eri[((u * n + w) * n + k) * n + l] - 0.5 * eri[((u * n + l) * n + k) * n + w]);
        fc += F * C[w * n + p]; sce += S[u * n + w] * C[w * n + p] * eps[p];
      }
      scfResidual = Math.max(scfResidual, Math.abs(fc - sce));
    }
  }
  return { roots, A, B, nocc, nvir, pairs, orthonormality, scfResidual };
}
