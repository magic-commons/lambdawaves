// Scratch bench — warm Jacobi vs Householder–QL crossover.  node research/molecular-waves-2026-09-18/scratch/bench-eig.mjs
import { eigSym } from '../../../lab/h2ci.js';
import { eigSymQL } from '../../../lab/linalg.js';

let seed = 20260918;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32 - 0.5;
const dense = (n) => { const A = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { const v = rnd(); A[i * n + j] = A[j * n + i] = v; } return A; };
const fockLike = (n) => { const A = dense(n);                                   // small off-diagonals, spread diagonal
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) A[i * n + j] *= (i === j ? 1 : 0.08);
  for (let i = 0; i < n; i++) A[i * n + i] = -20 + 40 * i / n; return A; };
const best = (fn, reps) => { let m = Infinity; for (let r = 0; r < reps; r++) { const t = performance.now(); fn(); m = Math.min(m, performance.now() - t); } return m; };
for (const [kind, make] of [['dense', dense], ['fock', fockLike]]) {
  for (const n of [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 72, 96, 128, 200, 315]) {
    const A = make(n), reps = n <= 48 ? 40 : n <= 128 ? 8 : 3;
    eigSym(A, n); eigSymQL(A, n);                                              // warm this size
    const j = best(() => eigSym(A, n), reps), q = best(() => eigSymQL(A, n), reps);
    const a = eigSym(A, n).values, b = eigSymQL(A, n).values;
    let d = 0; for (let k = 0; k < n; k++) d = Math.max(d, Math.abs(a[k] - b[k]));
    console.log(`${kind} n=${String(n).padStart(3)}  jacobi ${j.toFixed(4)} ms  QL ${q.toFixed(4)} ms  ratio ${(j / q).toFixed(2)}  max|Δλ| ${d.toExponential(2)}`);
  }
}
