/* linalg.test.mjs — lab/linalg.js's two kernels, on their own.
 *
 *   node tests/linalg.test.mjs
 *
 * `eigSymQL` has the SAME contract as lab/h2ci.js's Jacobi — values ascending, eigenvector k in column k — so the
 * gate is the contract and not the algorithm: the residual ‖AV − VΛ‖, orthonormality ‖VᵀV − I‖, agreement with
 * Jacobi's eigenvalues, exact degeneracies, the 1 × 1 and 2 × 2 cases, a diagonal matrix (which drives the
 * `scale === 0` branch of the Householder reduction on every row), and the zero matrix.  `cholesky` is gated on
 * L Lᵀ = A and on the fact that its NULL is a verdict: it must refuse exactly the matrices that are not positive
 * definite, which is what lab/rhf-molecule.js's stability test now rests on.
 */
import assert from 'node:assert/strict';
import { eigSymQL, cholesky } from '../lab/linalg.js';
import { eigSym, eigSymJacobi } from '../lab/h2ci.js';

let fails = 0, checks = 0;
const judge = (ok, what, detail) => { checks++; if (ok) console.log('GREEN ' + what); else { fails++; console.log('RED   ' + what + '\n      ' + JSON.stringify(detail)); } };
let seed = 20260918;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32 - 0.5;
const symRandom = (n) => { const A = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { const v = rnd(); A[i * n + j] = A[j * n + i] = v; } return A; };
/** max residual ‖AV − VΛ‖_max and max |VᵀV − I| */
function quality(A, n, e) {
  let res = 0, orth = 0;
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) {
    let s = 0; for (let j = 0; j < n; j++) s += A[i * n + j] * e.vectors[j * n + k];
    res = Math.max(res, Math.abs(s - e.values[k] * e.vectors[i * n + k]));
  }
  for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) {
    let s = 0; for (let i = 0; i < n; i++) s += e.vectors[i * n + p] * e.vectors[i * n + q];
    orth = Math.max(orth, Math.abs(s - (p === q ? 1 : 0)));
  }
  return { res, orth };
}

/* 1. Random symmetric matrices at the sizes the chemistry path uses. */
{
  const rows = [];
  let worstRes = 0, worstOrth = 0, worstVal = 0, worstScale = 0;
  for (const n of [3, 7, 10, 23, 36, 72, 120]) {
    const A = symRandom(n), q = eigSymQL(A, n), j = eigSymJacobi(A, n), Q = quality(A, n, q);
    let scale = 0; for (let k = 0; k < n; k++) scale = Math.max(scale, Math.abs(q.values[k]));
    let dv = 0; for (let k = 0; k < n; k++) dv = Math.max(dv, Math.abs(q.values[k] - j.values[k]));
    for (let k = 1; k < n; k++) assert.ok(q.values[k] >= q.values[k - 1], `n = ${n}: values ascending`);
    worstRes = Math.max(worstRes, Q.res / scale); worstOrth = Math.max(worstOrth, Q.orth);
    worstVal = Math.max(worstVal, dv / scale); worstScale = Math.max(worstScale, scale);
    rows.push(`n=${n} res ${(Q.res / scale).toExponential(1)} orth ${Q.orth.toExponential(1)} vs jacobi ${(dv / scale).toExponential(1)}`);
  }
  judge(worstRes < 1e-13 && worstOrth < 1e-13 && worstVal < 1e-12,
    `QL on random symmetric matrices, n = 3 … 120: ‖AV − VΛ‖/‖Λ‖ ${worstRes.toExponential(2)}, ‖VᵀV − I‖ ${worstOrth.toExponential(2)},`
    + ` eigenvalues equal to Jacobi's within ${worstVal.toExponential(2)} relative`, rows);
}

/* 2. EXACT degeneracies: a matrix with three eigenvalues of multiplicity 3, built as Q diag Qᵀ from a random Q. */
{
  const n = 9, w = [-2, -2, -2, 0.5, 0.5, 0.5, 4, 4, 4];
  const M = symRandom(n), G = new Float64Array(n * n);                       // Gram–Schmidt M into an orthogonal Q
  for (let c = 0; c < n; c++) {
    const v = new Float64Array(n); for (let i = 0; i < n; i++) v[i] = M[i * n + c];
    for (let p = 0; p < c; p++) { let d = 0; for (let i = 0; i < n; i++) d += G[i * n + p] * v[i];
      for (let i = 0; i < n; i++) v[i] -= d * G[i * n + p]; }
    let nn = 0; for (let i = 0; i < n; i++) nn += v[i] * v[i]; nn = Math.sqrt(nn);
    for (let i = 0; i < n; i++) G[i * n + c] = v[i] / nn;
  }
  const A = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0;
    for (let k = 0; k < n; k++) s += G[i * n + k] * w[k] * G[j * n + k]; A[i * n + j] = s; }
  const e = eigSymQL(A, n), Q = quality(A, n, e);
  let dv = 0; for (let k = 0; k < n; k++) dv = Math.max(dv, Math.abs(e.values[k] - w[k]));
  judge(dv < 1e-13 && Q.res < 1e-13 && Q.orth < 1e-13,
    `QL on exact degeneracies (three eigenvalues of multiplicity 3): |Δλ| ${dv.toExponential(2)}, residual ${Q.res.toExponential(2)},`
    + ` and the vectors are still orthonormal inside each cluster to ${Q.orth.toExponential(2)}`, { values: [...e.values].map((v) => +v.toFixed(12)) });
}

/* 3. The small and the structurally degenerate: 1 × 1, 2 × 2, a diagonal matrix (the scale === 0 branch), zero. */
{
  const one = eigSymQL(Float64Array.from([3.5]), 1);
  const two = eigSymQL(Float64Array.from([2, 1, 1, 2]), 2);
  const diag = Float64Array.from([5, 0, 0, 0, 0, -1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0.25]);
  const d = eigSymQL(diag, 4), dq = quality(diag, 4, d);
  const zero = eigSymQL(new Float64Array(9), 3), zq = quality(new Float64Array(9), 3, zero);
  const okOne = one.values.length === 1 && Math.abs(one.values[0] - 3.5) < 1e-15 && Math.abs(Math.abs(one.vectors[0]) - 1) < 1e-15;
  const okTwo = Math.abs(two.values[0] - 1) < 1e-15 && Math.abs(two.values[1] - 3) < 1e-15
    && Math.abs(Math.abs(two.vectors[0]) - Math.SQRT1_2) < 1e-14;
  const okDiag = [-1, 0.25, 2, 5].every((v, k) => Math.abs(d.values[k] - v) < 1e-15) && dq.res < 1e-15 && dq.orth < 1e-15;
  const okZero = [...zero.values].every((v) => v === 0) && zq.orth < 1e-15;
  judge(okOne && okTwo && okDiag && okZero,
    'QL on 1 × 1 (3.5), 2 × 2 ([[2,1],[1,2]] → 1, 3), a diagonal matrix — every Householder row takes the scale === 0 branch —'
    + ' and the zero matrix: eigenvalues exact, vectors orthonormal',
    { one: [...one.values], two: [...two.values], diag: [...d.values], zero: [...zero.values] });
}

/* 4. The dispatcher is the same function twice: lab/h2ci.js's eigSym is Jacobi below n = 8 and QL from 8 up. */
{
  const rows = [];
  let worst = 0;
  for (const n of [4, 7, 8, 16]) {
    const A = symRandom(n), e = eigSym(A, n), j = eigSymJacobi(A, n), q = eigSymQL(A, n);
    const isQL = [...e.values].every((v, k) => v === q.values[k]), isJ = [...e.values].every((v, k) => v === j.values[k]);
    let dv = 0; for (let k = 0; k < n; k++) dv = Math.max(dv, Math.abs(j.values[k] - q.values[k]));
    worst = Math.max(worst, dv);
    rows.push(`n=${n} ${n < 8 ? (isJ ? 'jacobi' : 'NOT jacobi') : (isQL ? 'QL' : 'NOT QL')} |Δλ| ${dv.toExponential(1)}`);
    assert.equal(n < 8 ? isJ : isQL, true, `eigSym dispatch at n = ${n}`);
  }
  judge(worst < 1e-13, `eigSym dispatches Jacobi below n = 8 and QL from 8 up, and the two agree to ${worst.toExponential(2)}`, rows);
}

/* 5. Cholesky: L Lᵀ = A where A ≻ 0, and NULL — the verdict — where it is not. */
{
  const n = 12, M = symRandom(n), A = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0;                    // A = M Mᵀ + 0.5 I ≻ 0
    for (let k = 0; k < n; k++) s += M[i * n + k] * M[j * n + k]; A[i * n + j] = s + (i === j ? 0.5 : 0); }
  const L = cholesky(A, n);
  let worst = 0, upper = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    let s = 0; for (let k = 0; k <= Math.min(i, j); k++) s += L[i * n + k] * L[j * n + k];
    worst = Math.max(worst, Math.abs(s - A[i * n + j]));
    if (j > i) upper = Math.max(upper, Math.abs(L[i * n + j]));
  }
  const lowest = eigSymQL(A, n).values[0];
  const shiftedBy = (s) => { const M2 = Float64Array.from(A); for (let i = 0; i < n; i++) M2[i * n + i] -= lowest + s; return M2; };
  const negative = Float64Array.from([-1]);
  /* THE VERDICT HAS A ROUND-OFF FLOOR, and it is measured rather than assumed: a matrix whose lowest eigenvalue is
     −δ factorises or refuses by round-off once δ is down at ε‖A‖.  Bisect for the smallest δ this A is refused at
     and print it — the RHF instabilities the verdict is used on are at −7e-3 (CuH) and −1.9e-2 (ZnH₂), eleven
     orders of magnitude above it, so nothing real sits in the grey band. */
  let lo = 0, hi = 1e-3;
  for (let it = 0; it < 80; it++) { const mid = 0.5 * (lo + hi); if (cholesky(shiftedBy(mid), n) === null) hi = mid; else lo = mid; }
  judge(!!L && worst < 1e-13 && upper === 0 && cholesky(shiftedBy(1e-6), n) === null && cholesky(negative, 1) === null && hi < 1e-9,
    `Cholesky: L Lᵀ = A to ${worst.toExponential(2)} with a strictly lower L, and NULL — the positive-definiteness verdict — for`
    + ` [−1] and for A shifted 1e-6 past its lowest eigenvalue ${lowest.toFixed(9)}; the refusal threshold measured by bisection is`
    + ` δ = ${hi.toExponential(2)}, the round-off floor`,
    { lowest, reproduction: worst, upperTriangle: upper, refusalThreshold: hi });
}

console.log(`\nGREEN linalg.test — ${fails} failing of ${checks}`);
process.exit(fails ? 1 : 0);
