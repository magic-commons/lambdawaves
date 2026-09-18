/* rpa-inspector.js — the singlet RPA/TDA excitation inspector, B-H2O-7 of research/MATH-H2O-2026-09-11.md.
 * Atomic units.  STATUS: KNOWN equations (Casida 1995; Szabo–Ostlund §13.7), DERIVED-HERE assembly, gated by
 * tests/rpa-inspector.test.mjs against PySCF TDHF/TDA (tests/fixtures/h2o-response.json) and, for H₂ STO-3G,
 * against the two-level closed form tests/density.test.mjs holds lab/density.js to.
 *
 * From the converged RHF orbitals C (C[ao·n + mo], ascending ε) the occupied–virtual pair basis (i, a) carries the
 * singlet blocks
 *     A_{ia,jb} = δ_ij δ_ab (ε_a − ε_i) + 2(ia|jb) − (ij|ab) ,     B_{ia,jb} = 2(ia|jb) − (ib|ja)
 * in chemists' notation, both real symmetric.  TDA is A alone: A X = ω X, ⟨X|X⟩ = 1.  RPA (TDHF) is the paired
 * problem [[A, B], [B, A]] (X; Y) = ω (1, −1)(X; Y).
 *
 * THE ROUTE (2026-09-18, JUDGMENT.md Proposition 3).  With A − B = L Lᵀ (Cholesky) and W = Lᵀ(A + B)L,
 *     W u = ω² u ,  ‖u‖ = 1  ⇒  X + Y = L u / √ω ,   X − Y = (A + B)(X + Y)/ω ,   (X+Y)ᵀ(X−Y) = 1 ,
 * which is ONE symmetric eigenproblem and one factorisation.  The route this file shipped with — Chandrasekhar
 * 1955 / Stratmann–Scuseria–Frisch 1998, M = (A−B)^{1/2}(A+B)(A−B)^{1/2} — needs THREE (two to form (A−B)^{±1/2},
 * one for M) and is kept behind `route: 'halves'` as the reference tests/chem-sweep.test.mjs compares against.
 * For benzene's 315 × 315 pair space the two agree to 1.4e-13 in ω and 6.0e-13 in f (that test's own printout).
 * A − B ≻ 0 is exactly the Cholesky's success, so the refusal for an unstable reference is unchanged in meaning.
 *
 * Transition dipoles take the spin-adaptation factor √2 of the singlet combination, and only X+Y enters:
 *     μ_q = √2 Σ_ia (X_ia + Y_ia) ⟨φ_i| q |φ_a⟩ ,      f = (2/3) ω |μ|² .
 * THE TDA LADDER IS ITS OWN ASCENDING LIST, `tda`, and it is computed ONLY IF SOMETHING ASKS (a lazy getter): the
 * k-th TDA root is NOT the partner of the k-th RPA root — for benzene RPA root 2 is the bright line and TDA root 2
 * is dark, the two ladders having crossed.  `roots[k].omegaTDA` and friends are kept for the callers that had
 * them, and each one is the k-th TDA ROOT BY INDEX, never a partner.  A character-based matching is open
 * (JUDGMENT.md §8.3) and is not invented here.
 * MUST NOT CLAIM: correlated excited states, double excitations, Rydberg completeness, experimental line positions.
 */
import { eigSym, eigSymJacobi } from './h2ci.js';
import { cholesky } from './linalg.js';

/** the occupied–virtual pair list, i outer and a inner — the row order of A, B and of every vector below */
const pairList = (n, nocc) => {
  const pairs = [];
  for (let i = 0; i < nocc; i++) for (let a = nocc; a < n; a++) pairs.push({ i, a });
  return pairs;
};

/**
 * hessianBlocks({ eri, C, eps, nocc, n }) → { A, B, pairs, nvir, nOv }
 * The singlet orbital-rotation Hessian blocks in the pair basis, from the three MO integral blocks (ia|jb),
 * (ij|ab) and (ib|ja).  ONE implementation, shared with lab/rhf-molecule.js's stabilityHessian, which needs
 * exactly A + B and A − B: four quarter transforms restricted to the occupied and virtual ranges, so the cost is
 * O(n³·nocc) rather than the full n⁵ AO→MO tensor this file used to build (benzene: 89M multiply-adds against
 * 242M, and no 36⁴ intermediate).
 */
export function hessianBlocks({ eri, C, eps, nocc, n }) {
  const nv = n - nocc, m = nocc * nv;
  const A1 = new Float64Array(nocc * n * n * n);                             // (i ν λ σ)
  for (let i = 0; i < nocc; i++) for (let nu = 0; nu < n; nu++) for (let la = 0; la < n; la++) for (let si = 0; si < n; si++) {
    let s = 0; for (let mu = 0; mu < n; mu++) s += C[mu * n + i] * eri[((mu * n + nu) * n + la) * n + si];
    A1[((i * n + nu) * n + la) * n + si] = s; }
  const half = (second, third, fourth, d2, d3, d4) => {                      // three contractions on ν, λ, σ
    const B2 = new Float64Array(nocc * d2 * n * n);
    for (let i = 0; i < nocc; i++) for (let p = 0; p < d2; p++) for (let la = 0; la < n; la++) for (let si = 0; si < n; si++) {
      let s = 0; for (let nu = 0; nu < n; nu++) s += C[nu * n + second(p)] * A1[((i * n + nu) * n + la) * n + si];
      B2[((i * d2 + p) * n + la) * n + si] = s; }
    const B3 = new Float64Array(nocc * d2 * d3 * n);
    for (let i = 0; i < nocc; i++) for (let p = 0; p < d2; p++) for (let q = 0; q < d3; q++) for (let si = 0; si < n; si++) {
      let s = 0; for (let la = 0; la < n; la++) s += C[la * n + third(q)] * B2[((i * d2 + p) * n + la) * n + si];
      B3[((i * d2 + p) * d3 + q) * n + si] = s; }
    const B4 = new Float64Array(nocc * d2 * d3 * d4);
    for (let i = 0; i < nocc; i++) for (let p = 0; p < d2; p++) for (let q = 0; q < d3; q++) for (let r = 0; r < d4; r++) {
      let s = 0; for (let si = 0; si < n; si++) s += C[si * n + fourth(r)] * B3[((i * d2 + p) * d3 + q) * n + si];
      B4[((i * d2 + p) * d3 + q) * d4 + r] = s; }
    return B4;
  };
  const v = (a) => nocc + a, o = (i) => i;
  const G = half(v, o, v, nv, nocc, nv), Q = half(o, v, v, nocc, nv, nv);    // (ia|jb) and (ij|ab)
  const gAt = (i, a, j, b) => G[((i * nv + a) * nocc + j) * nv + b];
  const qAt = (i, j, a, b) => Q[((i * nocc + j) * nv + a) * nv + b];
  const A = new Float64Array(m * m), B = new Float64Array(m * m);
  for (let i = 0; i < nocc; i++) for (let a = 0; a < nv; a++) for (let j = 0; j < nocc; j++) for (let b = 0; b < nv; b++) {
    const row = i * nv + a, col = j * nv + b, d = row === col ? eps[v(a)] - eps[i] : 0;
    const coul = gAt(i, a, j, b), x1 = qAt(i, j, a, b), x2 = gAt(i, b, j, a);
    A[row * m + col] = d + 2 * coul - x1;
    B[row * m + col] = 2 * coul - x2;
  }
  return { A, B, pairs: pairList(n, nocc), nvir: nv, nOv: m };
}

/** U diag(f(λ)) Uᵀ for a real symmetric positive matrix, from its eigenpairs — the 'halves' route only */
function symFunc(A, m, f, eigSym) {
  const e = eigSym(A, m), out = new Float64Array(m * m);
  if (!(e.values[0] > 0)) throw new Error('rpa: A − B is not positive definite; the RHF reference is not a minimum');
  for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
    let s = 0; for (let k = 0; k < m; k++) s += e.vectors[i * m + k] * f(e.values[k]) * e.vectors[j * m + k];
    out[i * m + j] = s;
  }
  return out;
}
const matmul = (A, B, m) => { const C = new Float64Array(m * m); for (let i = 0; i < m; i++) for (let k = 0; k < m; k++) { const a = A[i * m + k]; if (a === 0) continue; for (let j = 0; j < m; j++) C[i * m + j] += a * B[k * m + j]; } return C; };
const transpose = (A, m) => { const T = new Float64Array(m * m); for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) T[j * m + i] = A[i * m + j]; return T; };
const symmetrise = (M, m) => { for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) { const v = 0.5 * (M[i * m + j] + M[j * m + i]); M[i * m + j] = M[j * m + i] = v; } return M; };

/** Proposition 3: one Cholesky and one symmetric eigenproblem → ω, X+Y and X−Y, each as m × m with root k in column k */
function solveCholesky(A, B, m, eigSym) {
  const AmB = new Float64Array(m * m), ApB = new Float64Array(m * m);
  for (let k = 0; k < m * m; k++) { AmB[k] = A[k] - B[k]; ApB[k] = A[k] + B[k]; }
  const L = cholesky(symmetrise(AmB, m), m);
  if (!L) throw new Error('rpa: A − B is not positive definite; the RHF reference is not a minimum');
  const W = symmetrise(matmul(matmul(transpose(L, m), ApB, m), L, m), m);
  const e = eigSym(W, m), omega = new Float64Array(m);
  for (let k = 0; k < m; k++) {
    if (!(e.values[k] > 0)) throw new Error(`rpa: non-positive RPA eigenvalue ω² = ${e.values[k]} (unstable reference)`);
    omega[k] = Math.sqrt(e.values[k]);
  }
  const XpY = matmul(L, e.vectors, m);
  for (let k = 0; k < m; k++) { const s = 1 / Math.sqrt(omega[k]); for (let p = 0; p < m; p++) XpY[p * m + k] *= s; }
  const XmY = matmul(ApB, XpY, m);
  for (let k = 0; k < m; k++) { const s = 1 / omega[k]; for (let p = 0; p < m; p++) XmY[p * m + k] *= s; }
  return { omega, XpY, XmY };
}
/** the 2026-09-11 route, kept as the reference: M = (A−B)^{1/2}(A+B)(A−B)^{1/2}, three diagonalisations */
function solveHalves(A, B, m, eigSym) {
  const AmB = new Float64Array(m * m), ApB = new Float64Array(m * m);
  for (let k = 0; k < m * m; k++) { AmB[k] = A[k] - B[k]; ApB[k] = A[k] + B[k]; }
  const half = symFunc(AmB, m, Math.sqrt, eigSym), halfInv = symFunc(AmB, m, (x) => 1 / Math.sqrt(x), eigSym);
  const Mh = symmetrise(matmul(matmul(half, ApB, m), half, m), m);
  const sq = eigSym(Mh, m), omega = new Float64Array(m);
  const XpY = new Float64Array(m * m), XmY = new Float64Array(m * m);
  for (let k = 0; k < m; k++) {
    if (!(sq.values[k] > 0)) throw new Error(`rpa: non-positive RPA eigenvalue ω² = ${sq.values[k]} (unstable reference)`);
    omega[k] = Math.sqrt(sq.values[k]);
    const rw = Math.sqrt(omega[k]);
    for (let p = 0; p < m; p++) {
      let hp = 0, hi = 0;
      for (let q = 0; q < m; q++) { hp += half[p * m + q] * sq.vectors[q * m + k]; hi += halfInv[p * m + q] * sq.vectors[q * m + k]; }
      XpY[p * m + k] = hp / rw; XmY[p * m + k] = hi * rw;
    }
  }
  return { omega, XpY, XmY };
}

/**
 * rpa({ S, h, eri, X, Y, Z, C, eps, nocc, route }) → { roots, tda, A, B, nocc, nvir, pairs, orthonormality, scfResidual }
 * X, Y, Z are the three AO dipole (position) matrices; C[ao·n + mo]; eps ascending; eri[((i n + j) n + k) n + l].
 * `route` is 'cholesky' (the default) or 'halves' (the reference); `solver` is 'auto' (lab/h2ci.js's dispatch, QL
 * at these sizes) or 'jacobi' (the cyclic Jacobi everywhere), so that { route: 'halves', solver: 'jacobi' } is the
 * 2026-09-11 arithmetic and tests/chem-sweep.test.mjs can hold the new road to it.  roots is ascending in ω:
 *     { omega, f, mu: [x, y, z], X, Y, dominant: [{ i, a, x, y }],
 *       omegaTDA, fTDA, muTDA, XTDA }   ← the k-th TDA ROOT BY INDEX, not this root's partner
 * `tda` is the same ladder as a list of its own, ascending: [{ omega, f, mu, X }].  Both are lazy: nothing
 * diagonalises A until a TDA field is read.
 */
export function rpa({ S, h, eri, X, Y, Z, C, eps, nocc, route = 'cholesky', solver = 'auto' } = {}) {
  const n = eps && eps.length;
  if (!n || !C || C.length !== n * n) throw new Error('rpa: C (n×n, C[ao·n + mo]) and eps (length n) required');
  if (!Number.isInteger(nocc) || nocc < 1 || nocc >= n) throw new Error('rpa: nocc must be an integer in [1, n)');
  if (!eri || eri.length !== n ** 4) throw new Error('rpa: eri must be the full n⁴ chemists tensor');
  if (route !== 'cholesky' && route !== 'halves') throw new Error(`rpa: route must be 'cholesky' or 'halves', got '${route}'`);
  if (solver !== 'auto' && solver !== 'jacobi') throw new Error(`rpa: solver must be 'auto' or 'jacobi', got '${solver}'`);
  const eig = solver === 'jacobi' ? eigSymJacobi : eigSym;
  const nvir = n - nocc, m = nocc * nvir, dips = [X, Y, Z];
  for (const M of dips) if (!M || M.length !== n * n) throw new Error('rpa: three n×n AO dipole matrices required');
  /* the reference is the caller's: check it against the metric, and report the Roothaan residual it implies */
  let orthonormality = 0;
  if (S) for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) {
    let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += C[i * n + p] * S[i * n + j] * C[j * n + q];
    orthonormality = Math.max(orthonormality, Math.abs(s - (p === q ? 1 : 0)));
  }
  if (orthonormality > 1e-8) throw new Error(`rpa: CᵀSC ≠ I (max deviation ${orthonormality}); C is not the metric's orbital set`);
  const { A, B, pairs } = hessianBlocks({ eri, C, eps, nocc, n });
  /* MO dipoles ⟨φ_i| q |φ_a⟩ for the pair basis */
  const muMO = dips.map((M) => {
    const v = new Float64Array(m);
    for (let p = 0; p < m; p++) { const { i, a } = pairs[p]; let s = 0;
      for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) s += C[u * n + i] * M[u * n + w] * C[w * n + a];
      v[p] = s; }
    return v;
  });
  const R2 = Math.SQRT2;
  const dipoleOf = (vec) => muMO.map((v) => { let s = 0; for (let p = 0; p < m; p++) s += R2 * vec[p] * v[p]; return s; });
  const strength = (w, mu) => (2 / 3) * w * mu.reduce((s, x) => s + x * x, 0);
  /* THE TDA LADDER, ON DEMAND.  A 315 × 315 diagonalisation is not spent unless a TDA number is read. */
  let tdaMemo = null;
  const tdaLadder = () => {
    if (tdaMemo) return tdaMemo;
    const e = eig(A, m);
    tdaMemo = [];
    for (let k = 0; k < m; k++) {
      const xt = new Float64Array(m); for (let p = 0; p < m; p++) xt[p] = e.vectors[p * m + k];
      const mu = dipoleOf(xt);
      tdaMemo.push({ omega: e.values[k], f: strength(e.values[k], mu), mu, X: xt });
    }
    return tdaMemo;
  };
  const { omega, XpY, XmY } = route === 'cholesky' ? solveCholesky(A, B, m, eig) : solveHalves(A, B, m, eig);
  const roots = [];
  for (let k = 0; k < m; k++) {
    const Xv = new Float64Array(m), Yv = new Float64Array(m), plus = new Float64Array(m);
    for (let p = 0; p < m; p++) {
      const pl = XpY[p * m + k], mi = XmY[p * m + k];
      plus[p] = pl; Xv[p] = 0.5 * (pl + mi); Yv[p] = 0.5 * (pl - mi);
    }
    const mu = dipoleOf(plus);
    const dominant = pairs.map((pr, p) => ({ i: pr.i, a: pr.a, x: Xv[p], y: Yv[p] }))
      .sort((u, w) => (w.x * w.x + w.y * w.y) - (u.x * u.x + u.y * u.y));
    roots.push({ omega: omega[k], f: strength(omega[k], mu), mu, X: Xv, Y: Yv, dominant,
      /* the k-th TDA root, NOT the partner of RPA root k — the two ladders cross (JUDGMENT.md §8.3) */
      get omegaTDA() { return tdaLadder()[k].omega; },
      get fTDA() { return tdaLadder()[k].f; },
      get muTDA() { return tdaLadder()[k].mu; },
      get XTDA() { return tdaLadder()[k].X; } });
  }
  /* the Roothaan residual max|F C − S C ε| of the reference the caller supplied, as a diagnostic only */
  let scfResidual = null;
  if (S && h) {
    const D = new Float64Array(n * n);
    for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) { let s = 0; for (let o = 0; o < nocc; o++) s += C[u * n + o] * C[w * n + o]; D[u * n + w] = 2 * s; }
    /* ONE Fock matrix, built once.  It used to be rebuilt inside the per-column loop, which made an n⁵ pass of a
       diagnostic that is n⁴ (benzene: 60M contractions against 1.7M). */
    const F = new Float64Array(n * n);
    for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) {
      let f = h[u * n + w];
      for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) f += D[k * n + l] * (eri[((u * n + w) * n + k) * n + l] - 0.5 * eri[((u * n + l) * n + k) * n + w]);
      F[u * n + w] = f;
    }
    scfResidual = 0;
    for (let u = 0; u < n; u++) for (let p = 0; p < n; p++) {
      let fc = 0, sce = 0;
      for (let w = 0; w < n; w++) { fc += F[u * n + w] * C[w * n + p]; sce += S[u * n + w] * C[w * n + p] * eps[p]; }
      scfResidual = Math.max(scfResidual, Math.abs(fc - sce));
    }
  }
  return { roots, get tda() { return tdaLadder(); }, A, B, nocc, nvir, pairs, orthonormality, scfResidual, route, solver };
}
