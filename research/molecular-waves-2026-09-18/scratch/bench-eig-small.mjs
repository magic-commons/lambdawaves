// Scratch bench — small-n Jacobi vs QL, heavily warmed.
import { eigSym } from '../../../lab/h2ci.js';
import { eigSymQL } from '../../../lab/linalg.js';
let seed = 7;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32 - 0.5;
const dense = (n) => { const A = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { const v = rnd(); A[i * n + j] = A[j * n + i] = v; } return A; };
const fockLike = (n) => { const A = dense(n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) A[i * n + j] *= (i === j ? 1 : 0.08); for (let i = 0; i < n; i++) A[i * n + i] = -20 + 40 * i / n; return A; };
for (const [kind, make] of [['dense', dense], ['fock', fockLike]]) {
  const sizes = [2, 3, 4, 6, 7, 8, 10, 12, 14, 16, 18, 20, 23];
  const As = sizes.map(make);
  for (let w = 0; w < 200; w++) sizes.forEach((n, i) => { eigSym(As[i], n); eigSymQL(As[i], n); });   // warm every size together
  sizes.forEach((n, i) => {
    const A = As[i], reps = 2000;
    let j = Infinity, q = Infinity;
    for (let r = 0; r < reps; r++) { let t = performance.now(); eigSym(A, n); j = Math.min(j, performance.now() - t); t = performance.now(); eigSymQL(A, n); q = Math.min(q, performance.now() - t); }
    console.log(`${kind} n=${String(n).padStart(2)}  jacobi ${(j * 1000).toFixed(2)} µs  QL ${(q * 1000).toFixed(2)} µs  ratio ${(j / q).toFixed(2)}`);
  });
}
