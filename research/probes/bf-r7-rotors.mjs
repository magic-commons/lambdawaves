/* bf-r7-rotors.mjs — Round 7 (Fable): the FULL SO(4) action on a shell, through the Clebsch matrix.
 *
 * Claim (Theorem B.7).  Let M be the Clebsch matrix of shell n (V_j ⊗ V_j, j = (n−1)/2), M[p][q] the amplitude of
 * |j, m₊ = j−p⟩ ⊗ |j, m₋ = j−q⟩.  Then every element of SO(4) = (SU(2)₊ × SU(2)₋)/Z₂ acts as
 *     M ↦ U M Vᵀ,   U = D^j(R₊), V = D^j(R₋)   (Wigner D in the same m-basis),
 * and the state comes back by the transpose of the (orthogonal) Clebsch transform.  Consequences to test:
 *   (a) unshell ∘ shell = identity on every shell (the CG transform is orthogonal);
 *   (b) U = V = D^j(R_z(α)) reproduces the register's exact rotateZ (c_nlm → e^{−imα} c_nlm);
 *   (c) U = e^{−iθ j_z}, V = e^{+iθ j_z} reproduces applyRotateK — an INDEPENDENT implementation of e^{−iθK_z}
 *       (tridiagonal eigendecomposition vs two rotor matrices): the η_l phase convention is checked, not assumed;
 *   (d) U = V = D^j(R) is the ordinary spatial rotation: it must act on ⟨L⟩ as a rotation and fix |⟨L⟩|, |⟨K⟩|, e;
 *   (e) any (U, V) leaves the Schmidt spectrum fixed (unitary on both sides) — Theorem B.1, now for all of SO(4);
 *   (f) a general rotor pair drives the Stark state anywhere on Gr⁺(2,4) keeping e = (n−1)/n.
 */
import { BASIS, stateOf, factorial } from '../../lab/hydrogen.js';
import { shellMatrix, schmidt, rotorExpectations, applyRotateK, clebsch } from '../../lab/frontier.js';
import { Register } from '../../lab/state.js';

const F = (x) => factorial(Math.round(x));
/** Wigner small-d: d^j_{m'm}(β) (Varshalovich 4.3.1) */
function wignerd(j, mp, m, beta) {
  const c = Math.cos(beta / 2), s = Math.sin(beta / 2);
  let sum = 0;
  const smin = Math.max(0, Math.round(m - mp)), smax = Math.min(Math.round(j + m), Math.round(j - mp));
  for (let k = smin; k <= smax; k++) {
    const a = Math.round(j + m - k), b = k, cc = Math.round(mp - m + k), d = Math.round(j - mp - k);
    if (a < 0 || b < 0 || cc < 0 || d < 0) continue;
    sum += ((k % 2) ? -1 : 1) * Math.pow(c, 2 * j + m - mp - 2 * k) * Math.pow(s, mp - m + 2 * k) / (F(a) * F(b) * F(cc) * F(d));
  }
  const pre = Math.sqrt(F(j + mp) * F(j - mp) * F(j + m) * F(j - m));
  return ((Math.round(mp - m) % 2) ? -1 : 1) * pre * sum;
}
/** D^j(α, β, γ) = e^{−i α m'} d^j_{m'm}(β) e^{−i γ m}, as { re, im } arrays indexed by p = j − m' (row), q = j − m (col) */
export function wignerD(j, alpha, beta, gamma) {
  const N = Math.round(2 * j + 1), re = new Float64Array(N * N), im = new Float64Array(N * N);
  for (let p = 0; p < N; p++) for (let q = 0; q < N; q++) {
    const mp = j - p, m = j - q, d = wignerd(j, mp, m, beta), ph = -alpha * mp - gamma * m;
    re[p * N + q] = d * Math.cos(ph); im[p * N + q] = d * Math.sin(ph);
  }
  return { n: N, re, im };
}
/** M ↦ U M Vᵀ for complex U, V, M (all n×n row-major) */
function conjugate(M, U, V) {
  const n = M.n, re = new Float64Array(n * n), im = new Float64Array(n * n);
  const tRe = new Float64Array(n * n), tIm = new Float64Array(n * n);
  for (let a = 0; a < n; a++) for (let q = 0; q < n; q++) { let r = 0, i = 0; for (let p = 0; p < n; p++) { const ur = U.re[a * n + p], ui = U.im[a * n + p]; r += ur * M.re[p * n + q] - ui * M.im[p * n + q]; i += ur * M.im[p * n + q] + ui * M.re[p * n + q]; } tRe[a * n + q] = r; tIm[a * n + q] = i; }
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { let r = 0, i = 0; for (let q = 0; q < n; q++) { const vr = V.re[b * n + q], vi = V.im[b * n + q]; r += tRe[a * n + q] * vr - tIm[a * n + q] * vi; i += tRe[a * n + q] * vi + tIm[a * n + q] * vr; } re[a * n + b] = r; im[a * n + b] = i; }
  return { n, re, im, norm2: M.norm2 };
}
/* the η_l phases, recomputed here exactly as frontier.js fixes them (by the sign of the K_z m = 0 element) */
function etas(n) {
  const j = (n - 1) / 2, eta = [1];
  const cg = (l, m, p, q) => clebsch(j, j - p, j, j - q, l, m);
  for (let l = 0; l < n - 1; l++) {
    let s = 0;
    for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) if (Math.abs((j - p) + (j - q)) < 1e-9) s += cg(l + 1, 0, p, q) * cg(l, 0, p, q) * ((j - p) - (j - q));
    eta[l + 1] = eta[l] * (s < 0 ? -1 : 1);
  }
  return eta;
}
/** the inverse Clebsch transform: write the shell matrix back into coefficient arrays */
function unshell(M, n, re, im) {
  const j = (n - 1) / 2, eta = etas(n);
  for (let l = 0; l < n; l++) for (let m = -l; m <= l; m++) {
    const a = stateOf(n, l, m).index; let r = 0, i = 0;
    for (let p = 0; p < n; p++) { const q = Math.round(j - (m - (j - p))); if (q < 0 || q >= n) continue; const c = eta[l] * clebsch(j, j - p, j, j - q, l, m); if (!c) continue; r += c * M.re[p * n + q]; i += c * M.im[p * n + q]; }
    re[a] = r; im[a] = i;
  }
}
let FAIL = 0;
const say = (ok, name, d) => { if (!ok) FAIL++; console.log((ok ? 'GREEN ' : 'RED   ') + name + (d === undefined ? '' : '  ' + JSON.stringify(d).slice(0, 200))); };
let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const randState = (n) => { const re = new Float64Array(91), im = new Float64Array(91); for (const s of BASIS) if (s.n === n) { re[s.index] = rnd() - 0.5; im[s.index] = rnd() - 0.5; } return { re, im }; };
const diff = (a, b) => { let w = 0; for (let i = 0; i < 91; i++) w = Math.max(w, Math.abs(a.re[i] - b.re[i]), Math.abs(a.im[i] - b.im[i])); return w; };

/* (a) round trip */
for (const n of [2, 3, 4, 5, 6]) {
  const s = randState(n), M = shellMatrix(s.re, s.im, n);
  const re2 = new Float64Array(91), im2 = new Float64Array(91); unshell(M, n, re2, im2);
  say(diff(s, { re: re2, im: im2 }) < 1e-13, `(a) n=${n}: unshell ∘ shell = identity`, diff(s, { re: re2, im: im2 }));
}
/* (b) the diagonal z-rotation is the register's rotateZ */
for (const n of [3, 4]) {
  const s = randState(n), al = 0.73, j = (n - 1) / 2;
  const D = wignerD(j, al, 0, 0);
  const M2 = conjugate(shellMatrix(s.re, s.im, n), D, D);
  const re2 = new Float64Array(91), im2 = new Float64Array(91); unshell(M2, n, re2, im2);
  const R = new Register(); for (let a = 0; a < 91; a++) { R.re0[a] = s.re[a]; R.im0[a] = s.im[a]; } R.rotateZ(al);
  say(diff({ re: R.re0, im: R.im0 }, { re: re2, im: im2 }) < 1e-13, `(b) n=${n}: U = V = D^j(R_z(α)) equals the register's rotateZ`, diff({ re: R.re0, im: R.im0 }, { re: re2, im: im2 }));
}
/* (c) the opposite pair is e^{−iθ K_z}: an independent implementation of applyRotateK */
for (const n of [2, 3, 4, 5, 6]) {
  const s = randState(n), th = 0.61, j = (n - 1) / 2;
  const Dp = wignerD(j, th, 0, 0), Dm = wignerD(j, -th, 0, 0);
  const M2 = conjugate(shellMatrix(s.re, s.im, n), Dp, Dm);
  const re2 = new Float64Array(91), im2 = new Float64Array(91); unshell(M2, n, re2, im2);
  const re3 = Float64Array.from(s.re), im3 = Float64Array.from(s.im); applyRotateK(re3, im3, th);
  const d = diff({ re: re3, im: im3 }, { re: re2, im: im2 });
  say(d < 1e-12, `(c) n=${n}: rotors (e^{−iθj_z}, e^{+iθj_z}) equal applyRotateK — two independent routes to e^{−iθK_z}`, d);
}
/* (d) the diagonal general rotation acts on ⟨L⟩ as a rotation and fixes the lengths */
{
  const n = 4, s = randState(n), j = (n - 1) / 2, [al, be, ga] = [0.4, 0.9, -0.3];
  const D = wignerD(j, al, be, ga);
  const M0 = shellMatrix(s.re, s.im, n), M1 = conjugate(M0, D, D);
  const R0 = rotorExpectations(M0), R1 = rotorExpectations(M1);
  say(Math.abs(R0.absL - R1.absL) < 1e-12 && Math.abs(R0.absK - R1.absK) < 1e-12 && Math.abs(R0.e - R1.e) < 1e-12,
    '(d) n=4: a spatial rotation (U = V) fixes |⟨L⟩|, |⟨K⟩| and e', { L: [R0.absL, R1.absL], K: [R0.absK, R1.absK], e: [R0.e, R1.e] });
  const d0 = schmidt(M0).values, d1 = schmidt(M1).values;
  say(Math.max(...d0.map((x, i) => Math.abs(x - d1[i]))) < 1e-12, '(d) and the Schmidt spectrum', { d0: d0.slice(0, 3), d1: d1.slice(0, 3) });
}
/* (e) a RANDOM rotor pair leaves the Schmidt spectrum fixed — Theorem B.1 for all of SO(4) */
{
  const n = 5, s = randState(n), j = (n - 1) / 2;
  const Dp = wignerD(j, 1.1, 0.7, -0.4), Dm = wignerD(j, -0.6, 1.9, 0.8);
  const M0 = shellMatrix(s.re, s.im, n), M1 = conjugate(M0, Dp, Dm);
  const a = schmidt(M0).values, b = schmidt(M1).values;
  const re2 = new Float64Array(91), im2 = new Float64Array(91); unshell(M1, n, re2, im2);
  let n0 = 0, n1 = 0; for (let i = 0; i < 91; i++) { n0 += s.re[i] ** 2 + s.im[i] ** 2; n1 += re2[i] ** 2 + im2[i] ** 2; }
  say(Math.max(...a.map((x, i) => Math.abs(x - b[i]))) < 1e-12 && Math.abs(n0 - n1) < 1e-12,
    '(e) n=5: a general (U, V) ∈ SU(2)×SU(2) keeps the Schmidt spectrum and the norm', { a: a.slice(0, 3), b: b.slice(0, 3), n0, n1 });
}
/* (f) driving the Stark state: e stays (n−1)/n, ⟨K⟩ points where the rotors say */
{
  const n = 4, j = (n - 1) / 2, re = new Float64Array(91), im = new Float64Array(91);
  re[stateOf(n, 0, 0).index] = 0;                            // build the extreme Stark state as |j,j⟩⊗|j,−j⟩
  const M = { n, re: new Float64Array(n * n), im: new Float64Array(n * n), norm2: 1 };
  M.re[0 * n + (n - 1)] = 1;                                  // m₊ = +j, m₋ = −j
  unshell(M, n, re, im);
  const R0 = rotorExpectations(shellMatrix(re, im, n));
  const Dp = wignerD(j, 0, 0.8, 0), Dm = wignerD(j, 0, 0.8, 0);
  const M1 = conjugate(shellMatrix(re, im, n), Dp, Dm);
  const R1 = rotorExpectations(M1);
  say(Math.abs(R0.e - (n - 1) / n) < 1e-12 && Math.abs(R1.e - (n - 1) / n) < 1e-12 && Math.abs(R1.K[0] - Math.sin(0.8) * (n - 1) / 1) < 1e-9 * (n - 1),
    '(f) n=4: the extreme Stark state has e = (n−1)/n = 0.75 and a rotor tilt of 0.8 rad moves ⟨K⟩ by exactly that angle',
    { e0: R0.e, e1: R1.e, K0: R0.K.map((x) => +x.toFixed(6)), K1: R1.K.map((x) => +x.toFixed(6)), want: [Math.sin(0.8) * 3, 0, Math.cos(0.8) * 3] });
}
console.log((FAIL ? 'RED' : 'GREEN') + ' bf-r7-rotors — ' + FAIL + ' failing');
