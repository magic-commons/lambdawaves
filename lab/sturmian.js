/* sturmian.js — THE SCALE λ: the Coulomb Sturmians on the register's 91 labels, and the eigen-selector.  Atomic units.
 *
 * The register's radial functions are hydrogen's bound states, each with its own exponent 1/n; that set is NOT complete
 * (the continuum is missing — 23.4 % of He⁺ 1s lives there: the −1.5585 floor of the FIELDS AND MOLECULES round).  The
 * COULOMB STURMIANS keep the 91 labels and give every one of them ONE common exponent λ:
 *     S_nlm(λ; r) = N_nl(λ) (2λr)^l e^{−λr} L^{2l+1}_{n−l−1}(2λr) Y_lm(θ, φ),   N_nl(λ) = √((2λ)³ (n−l−1)! / (2n (n+l)!)),
 * normalised here to ⟨S|S⟩ = 1 (the L² norm, NOT the Sturmian's own 1/r-weighted norm), so that at λ = 1/n the Sturmian
 * IS the register's R_nl Y_lm to the last bit (same Laguerre, same prefactor: ρ = 2λr = 2r/n).  They solve the STURMIAN
 * EQUATION  (−½∇² − nλ/r + λ²/2) S_n = 0  — hydrogen with the CHARGE nλ as the eigenvalue at the fixed energy −λ²/2 —
 * and with one common λ they are a complete discrete set (Rotenberg 1962; Avery & Avery 2006).  The angular part and
 * its phase convention are the register's (hydrogen.js: complex Y_lm, Condon–Shortley).
 *
 * CLOSED-FORM MATRICES (KNOWN, re-derived below and judged in tests/sturmian.test.mjs against Γ-function quadrature).
 * For H = −½∇² − Z/r on any subset of the labels, with ⟨·⟩ the L² inner product and every element block-diagonal in
 * (l, m) by the angular orthogonality:
 *   • the Sturmian equation on the ket gives  ⟨S_n|−½∇²|S_n'⟩ = n'λ ⟨S_n|1/r|S_n'⟩ − (λ²/2) ⟨S_n|S_n'⟩;  the Hermiticity
 *     of −½∇² forces (n − n') ⟨S_n|1/r|S_n'⟩ = 0: the POTENTIAL-WEIGHTED ORTHOGONALITY  ⟨S_n|1/r|S_n'⟩ = δ_nn' λ/n
 *     (the diagonal is hydrogen's ⟨1/r⟩ = 1/n² under the dilation r → nλr).
 *   • the overlap is TRIDIAGONAL in n at fixed (l, m) and independent of λ.  With x = 2λr,
 *         ⟨S_n|S_n'⟩ = N N' (2λ)⁻³ ∫ x^{2l+2} e^{−x} L^α_k(x) L^α_k'(x) dx,   α = 2l+1, k = n−l−1, k' = n'−l−1,
 *     one power of x above the Laguerre weight x^α e^{−x}.  The recurrence
 *         x L^α_k = −(k+1) L^α_{k+1} + (2k+α+1) L^α_k − (k+α) L^α_{k−1}
 *     and the orthogonality ∫ x^α e^{−x} L^α_k L^α_k' dx = δ_kk' (k+α)!/k!  leave k' = k (which gives 1, the norm) and
 *     k' = k ± 1 only; with 2k+α+1 = 2n and N² = (2λ)³ k!/(2n (k+α)!) the surviving element collapses to
 *         ⟨S_n|S_{n+1}⟩ = −½ √( (n−l)(n+l+1) / (n(n+1)) ),      ⟨S_n|S_n'⟩ = 0 for |n − n'| ≥ 2.
 *   • hence  T = λ² I − (λ²/2) S,   V ≡ ⟨1/r⟩ = diag(λ/n),   H = T − Z V = −(λ²/2) S + diag(λ² − Zλ/n).
 *     Consequences the tests hold: one 1s Sturmian at λ = Z gives H = λ²/2 − Zλ = −Z²/2 (He⁺ at λ = 2: −2 exactly);
 *     at λ = Z/n₀ the label n₀ satisfies H e = −(λ²/2) S e, so it is an EXACT eigenvector with E = −Z²/2n₀² whatever
 *     other labels share the block — the hydrogen limit is reproduced label by label.
 *
 * THE EIGEN-SELECTOR.  Sturmians are not eigenfunctions of H, so the register's diagonal law c(t) = e^{−iEt} c(0) is
 * replaced by the exact evolution within the basis,  c(t) = exp(−i S⁻¹H t) c(0) = C e^{−iEt} CᵀS c(0),  with H C = S C E
 * and CᵀSC = I — the generalised symmetric eigenproblem, solved by Cholesky S = LLᵀ and Householder + implicit-QL on
 * L⁻¹HL⁻ᵀ (EISPACK tred2/tql2, written here, no dependencies).  The SPECTRUM ladder is E; the populations are the
 * S-metric projections |⟨C_k|S|c⟩|² (they sum to ⟨c|S|c⟩; reported as fractions).  Hylleraas–Undheim–MacDonald: every
 * E_k is an upper bound on the k-th exact level of its (l, m) symmetry — the error bar the UI prints is one-sided.
 *
 * RENDERING.  A Sturmian record is a hydrogen record with n_rec = 1/λ: the kernel's position branch evaluates ρ = 2r/n
 * with n read as a float (field.js: `let n = M.nlm.x; … let rho = 2.0 * r / n`, packed by `buf[o] = T.n` into a
 * Float32Array), and the Laguerre and Legendre tables are the label's own — so sturmianRecord() is drawn by the
 * existing GPU kernel unchanged (the CPU twin orbitalFromTable() agrees, judged to 1e-12).
 *
 * STATUS: EXACT (closed-form S and H — KNOWN: Rotenberg, Ann. Phys. 19, 262 (1962); Avery & Avery, Generalized Sturmians
 * and Atomic Spectra (2006); the tridiagonal overlap DERIVED-HERE from the Laguerre recurrence), VARIATIONAL (the
 * eigenvalues, upper bounds), NUMERICAL only in the eigen-solver (residuals judged to 1e-12 on the 91 × 91 problem).
 */
import { BASIS, BASIS_INDEX, factorial, laguerre, laguerreCoeffs, legendreDerivCoeffs, ylmNorm } from './hydrogen.js';

/* ── the functions ───────────────────────────────────────────────────────────── */
/** N_nl(λ): the L² normalisation of the Sturmian; equals hydrogen.js radialNorm(n, l) at λ = 1/n */
export function sturmianNorm(n, l, lambda) {
  return Math.sqrt(Math.pow(2 * lambda, 3) * factorial(n - l - 1) / (2 * n * factorial(n + l)));
}
/** the radial Sturmian S_nl(λ; r) by the Laguerre three-term recurrence (the CPU oracle) */
export function sturmianRadial(n, l, lambda, r) {
  const x = 2 * lambda * r;
  return sturmianNorm(n, l, lambda) * Math.exp(-x / 2) * Math.pow(x, l) * laguerre(n - l - 1, 2 * l + 1, x);
}
/**
 * The record modeTable() produces, for the Sturmian S_nlm(λ):  ψ = norm · e^{−ρ/2} ρ^l Σ lag_j ρ^j · sin^{|m|}θ Σ leg_j cos^jθ · e^{imφ}
 * with ρ = 2r/n_rec and n_rec = 1/λ.  `norm` folds N_nl(λ) (= the hydrogen norm × (nλ)^{3/2}), the angular norm and the
 * Condon–Shortley sign exactly as modeTable does; `label` keeps the (n, l, m) the scale field no longer names.
 */
export function sturmianRecord(n, l, m, lambda) {
  const am = Math.abs(m);
  const lag = laguerreCoeffs(n - l - 1, 2 * l + 1), leg = legendreDerivCoeffs(l, am);
  const sign = (m >= 0 && (am % 2 === 1)) ? -1 : 1;
  const norm = sign * sturmianNorm(n, l, lambda) * ylmNorm(l, am);
  const pad = (a) => { const out = new Float64Array(6); for (let i = 0; i < a.length && i < 6; i++) out[i] = a[i]; return out; };
  return { n: 1 / lambda, l, m, am, norm, lag: pad(lag), leg: pad(leg), lambda, label: { n, l, m }, sturmian: true };
}

/* ── the closed-form matrices ────────────────────────────────────────────────── */
/** ⟨S_n1 l|S_n2 l⟩ at a common λ (any λ): 1, −½√((n−l)(n+l+1)/(n(n+1))) for n2 = n1 + 1 (n = min), else 0 */
export function sturmianOverlap(n1, n2, l) {
  if (n1 === n2) return 1;
  if (Math.abs(n1 - n2) !== 1) return 0;
  const n = Math.min(n1, n2);
  return -0.5 * Math.sqrt((n - l) * (n + l + 1) / (n * (n + 1)));
}
/** labels: BASIS entries, BASIS indices, ids "h:n:l:m", or plain {n, l, m}; undefined → all 91 */
export function resolveLabels(labels) {
  if (!labels) return BASIS.slice();
  return labels.map((x) => typeof x === 'number' ? BASIS[x] : typeof x === 'string' ? BASIS[BASIS_INDEX.get(x)] : x);
}
/**
 * S, H (and the pieces T = −½∇², V = ⟨1/r⟩ with H = T − Z·V) in the given labels at the common scale λ — real symmetric,
 * Float64Array row-major, every element closed-form (see the header).
 */
export function sturmianMatrices(labels, lambda, { Z = 1 } = {}) {
  const L = resolveLabels(labels), N = L.length, l2 = lambda * lambda;
  const S = new Float64Array(N * N), H = new Float64Array(N * N), T = new Float64Array(N * N), V = new Float64Array(N * N);
  for (let i = 0; i < N; i++) {
    const a = L[i];
    for (let j = i; j < N; j++) {
      const b = L[j];
      if (a.l !== b.l || a.m !== b.m) continue;                       // angular orthogonality
      const same = a.n === b.n;
      const s = sturmianOverlap(a.n, b.n, a.l);
      const t = (same ? l2 : 0) - 0.5 * l2 * s;                        // n'λ⟨1/r⟩ − (λ²/2)⟨·⟩ with ⟨1/r⟩ = δ λ/n
      const v = same ? lambda / a.n : 0;                                // potential-weighted orthogonality
      const h = t - Z * v;
      S[i * N + j] = S[j * N + i] = s; T[i * N + j] = T[j * N + i] = t; V[i * N + j] = V[j * N + i] = v; H[i * N + j] = H[j * N + i] = h;
    }
  }
  return { S, H, T, V, labels: L, n: N, lambda, Z };
}

/* ── the eigen-solver (no dependencies) ──────────────────────────────────────── */
/**
 * symmetricEigen(A, n) — all eigenpairs of a real symmetric n × n matrix (row-major), by Householder reduction to
 * tridiagonal form followed by the implicit-QL algorithm with Wilkinson shifts (EISPACK tred2 + tql2, as in Numerical
 * Recipes §11.2–11.3).  Returns { values (ascending), vectors } with vectors[i*n + k] = component i of eigenvector k.
 */
export function symmetricEigen(Ain, n) {
  const a = Float64Array.from(Ain), d = new Float64Array(n), e = new Float64Array(n);
  /* tred2 */
  for (let i = n - 1; i >= 1; i--) {
    const l = i - 1; let h = 0, scale = 0;
    if (l > 0) {
      for (let k = 0; k <= l; k++) scale += Math.abs(a[i * n + k]);
      if (scale === 0) e[i] = a[i * n + l];
      else {
        for (let k = 0; k <= l; k++) { a[i * n + k] /= scale; h += a[i * n + k] * a[i * n + k]; }
        let f = a[i * n + l];
        const g = f >= 0 ? -Math.sqrt(h) : Math.sqrt(h);
        e[i] = scale * g; h -= f * g; a[i * n + l] = f - g; f = 0;
        for (let j = 0; j <= l; j++) {
          a[j * n + i] = a[i * n + j] / h;
          let gg = 0;
          for (let k = 0; k <= j; k++) gg += a[j * n + k] * a[i * n + k];
          for (let k = j + 1; k <= l; k++) gg += a[k * n + j] * a[i * n + k];
          e[j] = gg / h; f += e[j] * a[i * n + j];
        }
        const hh = f / (h + h);
        for (let j = 0; j <= l; j++) {
          const ff = a[i * n + j], gg = e[j] - hh * ff; e[j] = gg;
          for (let k = 0; k <= j; k++) a[j * n + k] -= (ff * e[k] + gg * a[i * n + k]);
        }
      }
    } else e[i] = a[i * n + l];
    d[i] = h;
  }
  d[0] = 0; e[0] = 0;
  for (let i = 0; i < n; i++) {
    const l = i - 1;
    if (d[i] !== 0) {
      for (let j = 0; j <= l; j++) {
        let g = 0;
        for (let k = 0; k <= l; k++) g += a[i * n + k] * a[k * n + j];
        for (let k = 0; k <= l; k++) a[k * n + j] -= g * a[k * n + i];
      }
    }
    d[i] = a[i * n + i]; a[i * n + i] = 1;
    for (let j = 0; j <= l; j++) { a[j * n + i] = 0; a[i * n + j] = 0; }
  }
  /* tql2 */
  for (let i = 1; i < n; i++) e[i - 1] = e[i];
  e[n - 1] = 0;
  for (let l = 0; l < n; l++) {
    let iter = 0, m;
    do {
      for (m = l; m < n - 1; m++) { const dd = Math.abs(d[m]) + Math.abs(d[m + 1]); if (Math.abs(e[m]) <= Number.EPSILON * dd) break; }
      if (m !== l) {
        if (iter++ === 100) throw new Error('symmetricEigen: QL did not converge');
        let g = (d[l + 1] - d[l]) / (2 * e[l]);
        let r = Math.hypot(g, 1);
        g = d[m] - d[l] + e[l] / (g + (g >= 0 ? r : -r));
        let s = 1, c = 1, p = 0, i;
        for (i = m - 1; i >= l; i--) {
          const f = s * e[i], b = c * e[i];
          r = Math.hypot(f, g); e[i + 1] = r;
          if (r === 0) { d[i + 1] -= p; e[m] = 0; break; }
          s = f / r; c = g / r;
          g = d[i + 1] - p;
          r = (d[i] - g) * s + 2 * c * b;
          p = s * r; d[i + 1] = g + p;
          g = c * r - b;
          for (let k = 0; k < n; k++) { const fk = a[k * n + i + 1]; a[k * n + i + 1] = s * a[k * n + i] + c * fk; a[k * n + i] = c * a[k * n + i] - s * fk; }
        }
        if (r === 0 && i >= l) continue;
        d[l] -= p; e[l] = g; e[m] = 0;
      }
    } while (m !== l);
  }
  /* sort ascending */
  const order = Array.from({ length: n }, (_, k) => k).sort((x, y) => d[x] - d[y]);
  const values = new Float64Array(n), vectors = new Float64Array(n * n);
  for (let k = 0; k < n; k++) { const src = order[k]; values[k] = d[src]; for (let i = 0; i < n; i++) vectors[i * n + k] = a[i * n + src]; }
  return { values, vectors };
}
/** the lower Cholesky factor L of a symmetric positive-definite S (S = LLᵀ), or null if a pivot is not positive */
export function cholesky(S, n) {
  const L = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = S[i * n + j];
      for (let k = 0; k < j; k++) sum -= L[i * n + k] * L[j * n + k];
      if (i === j) { if (!(sum > 0)) return null; L[i * n + i] = Math.sqrt(sum); }
      else L[i * n + j] = sum / L[j * n + j];
    }
  }
  return L;
}
/**
 * generalisedEigen(S, H, { thresh }) — H C = S C E with CᵀSC = I, E ascending.  thresh = 0 (default): Cholesky
 * reduction (S must be positive definite).  thresh > 0: canonical orthogonalisation instead — eigenvectors of S with
 * eigenvalue < thresh · max are dropped, and C has `rank` columns (row-major n × rank).  Returns { E, C, rank, n }.
 */
export function generalisedEigen(S, H, { thresh = 0 } = {}) {
  const n = Math.round(Math.sqrt(S.length));
  const L = thresh > 0 ? null : cholesky(S, n);
  if (L) {
    /* Hp = L⁻¹ H L⁻ᵀ:  Y = L⁻¹H (forward substitution on the columns of H), then Hp = (L⁻¹ Yᵀ)ᵀ */
    const Y = new Float64Array(n * n);
    for (let c = 0; c < n; c++) for (let i = 0; i < n; i++) { let s = H[i * n + c]; for (let k = 0; k < i; k++) s -= L[i * n + k] * Y[k * n + c]; Y[i * n + c] = s / L[i * n + i]; }
    const W = new Float64Array(n * n);
    for (let c = 0; c < n; c++) for (let i = 0; i < n; i++) { let s = Y[c * n + i]; for (let k = 0; k < i; k++) s -= L[i * n + k] * W[k * n + c]; W[i * n + c] = s / L[i * n + i]; }
    const Hp = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Hp[i * n + j] = 0.5 * (W[i * n + j] + W[j * n + i]);
    const { values, vectors } = symmetricEigen(Hp, n);
    /* C = L⁻ᵀ V: back substitution on every column */
    const C = new Float64Array(n * n);
    for (let c = 0; c < n; c++) for (let i = n - 1; i >= 0; i--) { let s = vectors[i * n + c]; for (let k = i + 1; k < n; k++) s -= L[k * n + i] * C[k * n + c]; C[i * n + c] = s / L[i * n + i]; }
    return { E: values, C, rank: n, n };
  }
  /* canonical orthogonalisation: X = U_k / √s_k on the kept eigenvectors of S */
  const es = symmetricEigen(S, n);
  const smax = es.values[n - 1], keep = [];
  for (let k = 0; k < n; k++) if (es.values[k] > Math.max(thresh, 1e-300) * smax) keep.push(k);
  const M = keep.length, X = new Float64Array(n * M);
  for (let c = 0; c < M; c++) { const k = keep[c], f = 1 / Math.sqrt(es.values[k]); for (let i = 0; i < n; i++) X[i * M + c] = es.vectors[i * n + k] * f; }
  const HX = new Float64Array(n * M);
  for (let i = 0; i < n; i++) for (let c = 0; c < M; c++) { let s = 0; for (let j = 0; j < n; j++) s += H[i * n + j] * X[j * M + c]; HX[i * M + c] = s; }
  const Hp = new Float64Array(M * M);
  for (let a = 0; a < M; a++) for (let b = 0; b < M; b++) { let s = 0; for (let i = 0; i < n; i++) s += X[i * M + a] * HX[i * M + b]; Hp[a * M + b] = s; }
  for (let a = 0; a < M; a++) for (let b = a + 1; b < M; b++) { const v = 0.5 * (Hp[a * M + b] + Hp[b * M + a]); Hp[a * M + b] = v; Hp[b * M + a] = v; }
  const { values, vectors } = symmetricEigen(Hp, M);
  const C = new Float64Array(n * M);
  for (let i = 0; i < n; i++) for (let c = 0; c < M; c++) { let s = 0; for (let a = 0; a < M; a++) s += X[i * M + a] * vectors[a * M + c]; C[i * M + c] = s; }
  return { E: values, C, rank: M, n };
}

/* ── the eigen-selector ──────────────────────────────────────────────────────── */
/**
 * createSturmian(labels, λ, { Z }) → { S, H, T, V, E, C, CtS, evolve, populations, energyOf, norm, eigenstate, records }
 *   evolve(c0, t)     c(t) = C e^{−iEt} CᵀS c0,  c0 = { re, im } Float64Arrays over the labels (returns a new { re, im })
 *   populations(c)    the S-metric projections |⟨C_k|S|c⟩|² / ⟨c|S|c⟩ onto the eigenvectors (Σ = 1)
 *   energyOf(c)       ⟨c|H|c⟩ / ⟨c|S|c⟩ (real: H is real symmetric)
 *   norm(c)           ⟨c|S|c⟩ — conserved by evolve
 *   eigenstate(k)     the k-th eigenvector as a complex coefficient vector (im = 0)
 *   records()         the sturmianRecord of every label, for the FIELD to draw
 */
export function createSturmian(labels, lambda, { Z = 1, thresh = 0 } = {}) {
  const M0 = sturmianMatrices(labels, lambda, { Z });
  const { S, H, T, V, n: N } = M0;
  const { E, C, rank: M } = generalisedEigen(S, H, { thresh });
  const CtS = new Float64Array(M * N);                                  // CᵀS: the projector rows
  for (let k = 0; k < M; k++) for (let i = 0; i < N; i++) { let s = 0; for (let j = 0; j < N; j++) s += C[j * M + k] * S[j * N + i]; CtS[k * N + i] = s; }
  const project = (c) => {                                              // d = CᵀS c (complex)
    const dre = new Float64Array(M), dim = new Float64Array(M);
    for (let k = 0; k < M; k++) { let sr = 0, si = 0; for (let i = 0; i < N; i++) { const w = CtS[k * N + i]; sr += w * c.re[i]; si += w * c.im[i]; } dre[k] = sr; dim[k] = si; }
    return { re: dre, im: dim };
  };
  const quad = (A, c) => { let s = 0; for (let i = 0; i < N; i++) { let ar = 0, ai = 0; for (let j = 0; j < N; j++) { const w = A[i * N + j]; ar += w * c.re[j]; ai += w * c.im[j]; } s += c.re[i] * ar + c.im[i] * ai; } return s; };
  const norm = (c) => quad(S, c);
  function evolve(c0, t) {
    const d = project(c0);
    for (let k = 0; k < M; k++) { const ph = -E[k] * t, cs = Math.cos(ph), sn = Math.sin(ph), r = d.re[k], i = d.im[k]; d.re[k] = r * cs - i * sn; d.im[k] = r * sn + i * cs; }
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) { let sr = 0, si = 0; for (let k = 0; k < M; k++) { const w = C[i * M + k]; sr += w * d.re[k]; si += w * d.im[k]; } re[i] = sr; im[i] = si; }
    return { re, im };
  }
  function populations(c) {
    const d = project(c), nn = norm(c) || 1, p = new Float64Array(M);
    for (let k = 0; k < M; k++) p[k] = (d.re[k] * d.re[k] + d.im[k] * d.im[k]) / nn;
    return p;
  }
  const energyOf = (c) => quad(H, c) / quad(S, c);
  const eigenstate = (k) => { const re = new Float64Array(N), im = new Float64Array(N); for (let i = 0; i < N; i++) re[i] = C[i * M + k]; return { re, im }; };
  const records = () => M0.labels.map((s) => sturmianRecord(s.n, s.l, s.m, lambda));
  return { labels: M0.labels, lambda, Z, n: N, rank: M, S, H, T, V, E, C, CtS, evolve, populations, energyOf, norm, eigenstate, records };
}
