/* linalg.js — the dense real-symmetric kernels the chemistry path lives on: Householder–QL and Cholesky.
 * STATUS: KNOWN algorithms (EISPACK `tred2`/`tql2`, Martin–Reinsch–Wilkinson 1968, as transcribed in JAMA; the
 * Cholesky factorisation is textbook), ported here and gated by tests/linalg.test.mjs against lab/h2ci.js's cyclic
 * Jacobi, against a matrix with exact degeneracies, and on the residual ‖AV − VΛ‖ and orthonormality ‖VᵀV − I‖.
 *
 * WHY THIS FILE EXISTS.  Jacobi is the lab's original eigensolver and it is honest, but it sweeps: benzene's RPA
 * works in a 315-dimensional occupied–virtual pair space, and one Jacobi diagonalisation of a 315 × 315 matrix cost
 * 0.73 s against Householder–QL's 0.126 s on this machine (research/molecular-waves-2026-09-18/JUDGMENT.md §5).
 * The eigenvalues agree to 6e-13 there.  lab/h2ci.js's `eigSym` dispatches on n, so every caller gets whichever is
 * faster at its own size and the RETURN CONTRACT IS THE SAME: values ascending, `vectors[i * n + k]` = component i
 * of eigenvector k, i.e. eigenvector k in COLUMN k.
 *
 * WHAT IS NOT PROMISED.  Neither routine is a substitute for a shifted, deflating LAPACK driver: `eigSymQL` throws
 * rather than returning a wrong answer if a QL sweep does not converge in 60 iterations, and it is written for
 * dense matrices that fit in one Float64Array.  The eigenvectors inside a DEGENERATE cluster are an arbitrary
 * orthonormal basis of that eigenspace and differ between the two solvers; anything that reads one vector of a
 * degenerate pair must say which basis it means.
 */

/**
 * eigSymQL(A, n) → { values (ascending), vectors } for a real symmetric A (row-major, n × n).
 * Householder tridiagonalisation (`tred2`) followed by the implicit-shift QL with accumulated vectors (`tql2`).
 * A is not modified.  `vectors[i * n + k]` is component i of eigenvector k — the same layout `eigSym` returns.
 */
export function eigSymQL(A, n) {
  const V = Float64Array.from(A), d = new Float64Array(n), e = new Float64Array(n);
  /* ── tred2: reduce to a symmetric tridiagonal (d, e) and accumulate the orthogonal transform in V ── */
  for (let j = 0; j < n; j++) d[j] = V[(n - 1) * n + j];
  for (let i = n - 1; i > 0; i--) {
    let scale = 0, h = 0;
    for (let k = 0; k < i; k++) scale += Math.abs(d[k]);
    if (scale === 0) {                                                       // the row is already zero: nothing to reflect
      e[i] = d[i - 1];
      for (let j = 0; j < i; j++) { d[j] = V[(i - 1) * n + j]; V[i * n + j] = 0; V[j * n + i] = 0; }
    } else {
      for (let k = 0; k < i; k++) { d[k] /= scale; h += d[k] * d[k]; }
      let f = d[i - 1], g = Math.sqrt(h); if (f > 0) g = -g;
      e[i] = scale * g; h -= f * g; d[i - 1] = f - g;
      for (let j = 0; j < i; j++) e[j] = 0;
      for (let j = 0; j < i; j++) {
        f = d[j]; V[j * n + i] = f; g = e[j] + V[j * n + j] * f;
        for (let k = j + 1; k <= i - 1; k++) { g += V[k * n + j] * d[k]; e[k] += V[k * n + j] * f; }
        e[j] = g;
      }
      f = 0;
      for (let j = 0; j < i; j++) { e[j] /= h; f += e[j] * d[j]; }
      const hh = f / (h + h);
      for (let j = 0; j < i; j++) e[j] -= hh * d[j];
      for (let j = 0; j < i; j++) {
        f = d[j]; g = e[j];
        for (let k = j; k <= i - 1; k++) V[k * n + j] -= f * e[k] + g * d[k];
        d[j] = V[(i - 1) * n + j]; V[i * n + j] = 0;
      }
    }
    d[i] = h;
  }
  for (let i = 0; i < n - 1; i++) {
    V[(n - 1) * n + i] = V[i * n + i]; V[i * n + i] = 1;
    const h = d[i + 1];
    if (h !== 0) {
      for (let k = 0; k <= i; k++) d[k] = V[k * n + i + 1] / h;
      for (let j = 0; j <= i; j++) {
        let g = 0;
        for (let k = 0; k <= i; k++) g += V[k * n + i + 1] * V[k * n + j];
        for (let k = 0; k <= i; k++) V[k * n + j] -= g * d[k];
      }
    }
    for (let k = 0; k <= i; k++) V[k * n + i + 1] = 0;
  }
  for (let j = 0; j < n; j++) { d[j] = V[(n - 1) * n + j]; V[(n - 1) * n + j] = 0; }
  V[(n - 1) * n + n - 1] = 1; e[0] = 0;
  /* ── tql2: the implicit QL, shifted by the Wilkinson value, with the plane rotations applied to V ── */
  for (let i = 1; i < n; i++) e[i - 1] = e[i];
  e[n - 1] = 0;
  let f = 0, tst1 = 0; const eps = 2 ** -52;
  for (let l = 0; l < n; l++) {
    tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
    let m = l; while (m < n) { if (Math.abs(e[m]) <= eps * tst1) break; m++; }
    if (m > l) {
      let iter = 0;
      do {
        /* A tridiagonal QL with this shift converges in a handful of iterations; 60 is a refusal, not a tolerance */
        if (++iter > 60) throw new Error(`linalg: QL did not converge on eigenvalue ${l} of ${n} in 60 iterations`);
        let g = d[l], p = (d[l + 1] - g) / (2 * e[l]), r = Math.hypot(p, 1); if (p < 0) r = -r;
        d[l] = e[l] / (p + r); d[l + 1] = e[l] * (p + r);
        const dl1 = d[l + 1]; let h = g - d[l];
        for (let i = l + 2; i < n; i++) d[i] -= h;
        f += h;
        p = d[m]; let c = 1, c2 = 1, c3 = 1, s = 0, s2 = 0; const el1 = e[l + 1];
        for (let i = m - 1; i >= l; i--) {
          c3 = c2; c2 = c; s2 = s;
          g = c * e[i]; h = c * p; r = Math.hypot(p, e[i]); e[i + 1] = s * r; s = e[i] / r; c = p / r;
          p = c * d[i] - s * g; d[i + 1] = h + s * (c * g + s * d[i]);
          for (let k = 0; k < n; k++) { const kk = k * n + i; h = V[kk + 1]; V[kk + 1] = s * V[kk] + c * h; V[kk] = c * V[kk] - s * h; }
        }
        p = -s * s2 * c3 * el1 * e[l] / dl1; e[l] = s * p; d[l] = c * p;
      } while (Math.abs(e[l]) > eps * tst1);
    }
    d[l] += f; e[l] = 0;
  }
  const idx = [...Array(n).keys()].sort((i, j) => d[i] - d[j]);
  const values = idx.map((k) => d[k]), vectors = new Float64Array(n * n);
  idx.forEach((k, col) => { for (let i = 0; i < n; i++) vectors[i * n + col] = V[i * n + k]; });
  return { values, vectors };
}

/**
 * cholesky(A, n) → the lower triangular L with A = L Lᵀ (row-major, zero above the diagonal), or NULL when A is
 * not positive definite.  The null IS the verdict: A ≻ 0 exactly when the factorisation runs to the end, which is
 * the whole of the RHF stability test and costs n³/6 multiply-adds instead of a diagonalisation.
 */
export function cholesky(A, n) {
  const L = new Float64Array(n * n);
  for (let j = 0; j < n; j++) {
    let s = A[j * n + j]; for (let k = 0; k < j; k++) s -= L[j * n + k] ** 2;
    if (!(s > 0)) return null;                                               // a non-positive pivot: not positive definite
    const d = Math.sqrt(s); L[j * n + j] = d;
    for (let i = j + 1; i < n; i++) {
      let t = A[i * n + j]; for (let k = 0; k < j; k++) t -= L[i * n + k] * L[j * n + k];
      L[i * n + j] = t / d;
    }
  }
  return L;
}
