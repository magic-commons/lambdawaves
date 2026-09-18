/* canon-gauge.js — THE CANONICAL GAUGE OF A DEGENERATE CLUSTER (MOLECULAR WAVES, REGISTER-WINDOW-SPEC §7).
 * Dependency-free.  Float64Array in, Float64Array out.  Proved and tested in
 * research/molecular-waves-2026-09-18/proving/LEDGER.md (Definition 8, Propositions 9 and 10, Lemma 13); the
 * worker's `chem.states` op is the caller, so a register lane means the same state on every solve and with
 * every eigensolver.
 *
 * THE RULE (Definition 1 of the ledger).  A cluster is g vectors V_0 … V_{g−1} in R^d with ORTHONORMAL rows,
 * spanning a subspace whose only meaning is the subspace itself: any eigensolver may hand back V Q for an
 * arbitrary Q ∈ O(g).  Fix, once and for all, an ORDERED list of LINEAR functionals f_0, f_1, … on R^d (for a
 * state cluster: the three lab transition-dipole axes √2 r^q_{ia}, then the amplitude coordinates; for an orbital
 * cluster: the Löwdin-AO coordinates).  Gram–Schmidt the projections P f_q onto the cluster span, in that order,
 * skipping any whose residual is below the family's threshold, and stop at g vectors.  The result depends only on
 * the SPAN and on the fixed functionals, so it is invariant under every Q (Proposition 6 of the ledger), and it is
 * the unique orthonormal basis u_0 … u_{g−1} of the span with ⟨f_{q_j}, u_l⟩ = 0 for l > j and ⟨f_{q_j}, u_j⟩ > 0.
 *
 * All the work happens in R^g: with orthonormal rows, (P f)'s coordinates are c_k = ⟨V_k, f⟩.
 *
 * WHAT THE RULE DOES NOT DO.  For an E or T cluster the dipoles are mutually orthogonal and of equal length in
 * EVERY gauge (Proposition 7), so "rotate until the dipoles are orthogonal" fixes nothing there; the identity of a
 * lane comes entirely from the ordered functionals and the positive-pivot sign.
 *
 * CONDITIONING.  The output is Lipschitz in the span with constant 1/δ, δ = the smallest accepted residual norm
 * (Lemma 8).  `pivots[].norm` is that diagnostic; a cluster whose smallest pivot norm is near its threshold has no
 * stable identity and should be reported, not silently canonicalised.
 */

/** Maximal runs of a sorted spectrum whose consecutive gaps are below tol: [[start, end), …]. */
export function clusterRanges(omega, tol = 1e-8) {
  const out = [];
  let start = 0;
  for (let k = 1; k <= omega.length; k++) {
    if (k === omega.length || Math.abs(omega[k] - omega[k - 1]) >= tol) { out.push([start, k]); start = k; }
  }
  return out;
}

/**
 * A functional family: { rows, count, tol, label }.
 * `rows` is a Float64Array(count·d) of functional vectors, or null for the standard coordinate basis e_0 … e_{d−1}
 * (count = d, no storage).  `tol` is the absolute threshold on the Gram–Schmidt residual norm in R^g.
 */
export const coordinateFamily = (d, tol = 1e-8, label = 'coordinate', theta = 0.5) =>
  ({ rows: null, count: d, tol, label, theta });

/** The three lab transition-dipole functionals of the singlet CIS pair space: f_q(X) = √2 Σ_ia X_ia r^q_ia. */
export function dipoleFamily(rMO, n, nocc, nvir, tol = 1e-3) {
  const d = nocc * nvir, rows = new Float64Array(3 * d), s = Math.SQRT2;
  for (let q = 0; q < 3; q++) {
    for (let i = 0; i < nocc; i++) for (let a = 0; a < nvir; a++) rows[q * d + i * nvir + a] = s * rMO[q][i * n + nocc + a];
  }
  return { rows, count: 3, tol, label: 'dipole' };
}

/** max |V Vᵀ − 1|, the precondition of canonicalRotation. */
export function orthonormalityDefect(V, d, g) {
  let e = 0;
  for (let k = 0; k < g; k++) for (let l = 0; l < g; l++) {
    let s = 0;
    for (let p = 0; p < d; p++) s += V[k * d + p] * V[l * d + p];
    e = Math.max(e, Math.abs(s - (k === l ? 1 : 0)));
  }
  return e;
}

/**
 * canonicalRotation(V, d, g, families) → { W, pivots }
 * V[k·d + p] = component p of cluster vector k, rows orthonormal.  W[j·g + k] is the orthogonal g×g matrix with
 * u_j = Σ_k W[j·g + k] V_k.  `pivots[j] = { family, index, norm }` names the functional that fixed u_j and the
 * residual norm it was accepted with.  Throws only if the families cannot supply g independent directions, which
 * cannot happen when a coordinate family is present.
 */
export function canonicalRotation(V, d, g, families) {
  const W = new Float64Array(g * g), pivots = [], c = new Float64Array(g), r = new Float64Array(g);
  let found = 0;
  for (let fam = 0; fam < families.length && found < g; fam++) {
    const { rows, count, tol, label, theta } = families[fam];
    for (let q = 0; q < count && found < g; q++) {
      /* A COORDINATE family carries a guarantee: with j directions already found, Σ_q ‖Π_j e_q‖² = g − j, so some
       * coordinate has residual ≥ √((g−j)/count).  Raising the threshold to θ√((g−j)/count), θ < 1, therefore
       * never empties the family and bounds the conditioning constant 1/δ by √(count/(g−j))/θ (Lemma 9). */
      const bar = rows === null && theta ? Math.max(tol, theta * Math.sqrt((g - found) / count)) : tol;
      for (let k = 0; k < g; k++) {                                       // c_k = ⟨V_k, f_q⟩
        if (rows === null) { c[k] = V[k * d + q]; continue; }
        let s = 0;
        for (let p = 0; p < d; p++) s += V[k * d + p] * rows[q * d + p];
        c[k] = s;
      }
      r.set(c);
      for (let j = 0; j < found; j++) {                                   // modified Gram–Schmidt, twice for stability
        let dot = 0;
        for (let k = 0; k < g; k++) dot += W[j * g + k] * r[k];
        for (let k = 0; k < g; k++) r[k] -= dot * W[j * g + k];
      }
      for (let j = 0; j < found; j++) {
        let dot = 0;
        for (let k = 0; k < g; k++) dot += W[j * g + k] * r[k];
        for (let k = 0; k < g; k++) r[k] -= dot * W[j * g + k];
      }
      let nrm = 0;
      for (let k = 0; k < g; k++) nrm += r[k] * r[k];
      nrm = Math.sqrt(nrm);
      if (!(nrm > bar)) continue;                                          // skipped: this functional is blind here
      for (let k = 0; k < g; k++) W[found * g + k] = r[k] / nrm;           // positive pivot ⟨f_q, u_found⟩ = nrm > 0
      pivots.push({ family: label, index: q, norm: nrm });
      found++;
    }
  }
  if (found < g) throw new Error(`canon-gauge: the functional families span only ${found} of ${g} cluster directions`);
  return { W, pivots };
}

/** U[j·d + p] = Σ_k W[j·g + k] V[k·d + p]. */
export function applyRotation(W, V, d, g) {
  const U = new Float64Array(g * d);
  for (let j = 0; j < g; j++) for (let k = 0; k < g; k++) {
    const w = W[j * g + k];
    if (w === 0) continue;
    for (let p = 0; p < d; p++) U[j * d + p] += w * V[k * d + p];
  }
  return U;
}

/** The whole rule: canonicaliseCluster(V, d, g, families) → { U, W, pivots }. */
export function canonicaliseCluster(V, d, g, families) {
  const { W, pivots } = canonicalRotation(V, d, g, families);
  return { U: applyRotation(W, V, d, g), W, pivots };
}

/**
 * The sign rule for a single (non-degenerate) state or orbital: the g = 1 case of the same rule.  Returns +1 or −1,
 * the factor that makes the first functional value above its threshold positive.
 */
export function canonicalSign(v, d, families) {
  const { W } = canonicalRotation(v, d, 1, families);
  return W[0] >= 0 ? 1 : -1;
}

/**
 * canonicaliseSpectrum({ X, omega, d, families, tol }) → { X: Float64Array(nStates·d), clusters, pivots }
 * X[k·d + p] is state k's amplitude vector.  Every cluster (including the singletons, which get the sign rule) is
 * replaced by its canonical basis, in place of a copy.
 */
export function canonicaliseSpectrum({ X, omega, d, families, tol = 1e-8 }) {
  const out = new Float64Array(X.length), ranges = clusterRanges(omega, tol), allPivots = [];
  for (const [s, e] of ranges) {
    const g = e - s, V = X.subarray(s * d, e * d);
    const { U, pivots } = canonicaliseCluster(V, d, g, families);
    out.set(U, s * d);
    allPivots.push({ range: [s, e], pivots });
  }
  return { X: out, clusters: ranges, pivots: allPivots };
}
