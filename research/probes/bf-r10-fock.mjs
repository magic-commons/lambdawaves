/* bf-r10-fock.mjs — Round 10 (Fable), Task 1(d): the Fock statement made exact, and the rotor pair as a RIGID
 * rotation of the momentum picture.
 *
 *   phi_nlm(p) = chi_l · F_nl(p) · Y_lm(p^),  chi_l the FT phase ((-i)^l is the true Fourier transform, bf-r10-momentum.py)
 *   xi(p) = (2 p0 p, p0^2 - p^2)/(p0^2 + p^2) ∈ S^3,  p0 = 1/n;   p = p0 xi_{1..3}/(1 + xi_4)  (inverse)
 *   claim: F_nl Y_lm = [4 p0^{5/2}/(p0^2+p^2)^2] · Y_{n-1,l,m}(xi) up to a sign to be measured
 *   rotor check: coefficients c' = applyRotor(c) ⇒ phi'(xi) (p0^2+p^2)^2 = phi(R^{-1} xi) (p0^2+p'^2)^2 for the 4D rotation
 *   R x = q_L x conj(q_R) on x = xi_4 + xi_1 i + xi_2 j + xi_3 k, with (q_L, q_R) read off the rotor — the candidates
 *   (sign of the half-angle, which rotor is which, which pole is xi_4) are all tried and the one that closes is reported.
 * run: node bf-r10-fock.mjs   (from research/probes)
 */
import { BASIS, stateOf, ylm, factorial } from '../../lab/hydrogen.js';
import { applyRotor } from '../../lab/frontier.js';
import { qmul, qconj, expPure } from '../../lab/rotor4.js';

const N = BASIS.length;
function gegenbauer(k, lam, x) {          // C^lam_k(x) by the three-term recurrence
  if (k === 0) return 1;
  let c0 = 1, c1 = 2 * lam * x;
  for (let i = 1; i < k; i++) { const c2 = (2 * x * (i + lam) * c1 - (i + 2 * lam - 1) * c0) / (i + 1); c0 = c1; c1 = c2; }
  return c1;
}
/** Podolsky–Pauling F_nl(p), verified normalised and equal to the Hankel transform of the lab's R_nl (bf-r10-momentum.py) */
function F(n, l, p) {
  const x = (n * n * p * p - 1) / (n * n * p * p + 1);
  const pref = Math.sqrt(2 / Math.PI * factorial(n - l - 1) / factorial(n + l)) * n * n * Math.pow(2, 2 * l + 2) * factorial(l);
  return pref * Math.pow(n, l) * Math.pow(p, l) / Math.pow(n * n * p * p + 1, l + 2) * gegenbauer(n - l - 1, l + 1, x);
}
/** hyperspherical harmonic radial part: Y_{Nlm}(chi,theta,phi) = Nn_l sin^l chi C^{l+1}_{N-l}(cos chi) Y_lm */
function hyperNorm(Nn, l) { return Math.pow(2, l) * factorial(l) * Math.sqrt(2 * (Nn + 1) * factorial(Nn - l) / (Math.PI * factorial(Nn + l + 1))); }
function hyperRadial(Nn, l, cosChi) { const s = Math.sqrt(Math.max(0, 1 - cosChi * cosChi)); return hyperNorm(Nn, l) * Math.pow(s, l) * gegenbauer(Nn - l, l + 1, cosChi); }

/* ── (i) the Fock identity, sign measured ───────────────────────────────────── */
console.log('== Fock identity: F_nl(p) vs 4 p0^{5/2}/(p0^2+p^2)^2 · [radial part of Y_{n-1,l}](cos chi = (p0^2-p^2)/(p0^2+p^2)) ==');
for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2], [4, 1], [5, 3], [6, 0], [6, 5]]) {
  const p0 = 1 / n; let worst = 0, sign = 0;
  for (let i = 1; i <= 20; i++) {
    const p = 0.02 + 0.12 * i, cosChi = (p0 * p0 - p * p) / (p0 * p0 + p * p);
    const rhs = 4 * Math.pow(p0, 2.5) / Math.pow(p0 * p0 + p * p, 2) * hyperRadial(n - 1, l, cosChi);
    const lhs = F(n, l, p);
    if (Math.abs(rhs) > 1e-9) { const s = Math.sign(lhs / rhs); if (sign === 0) sign = s; else if (s !== sign) sign = NaN; }
    worst = Math.max(worst, Math.abs(Math.abs(lhs) - Math.abs(rhs)));
  }
  console.log(`  (n,l)=(${n},${l}): max ||F| - |Fock|| = ${worst.toExponential(2)}   sign F/Fock = ${sign}   (-1)^(n-l-1) = ${(-1) ** (n - l - 1)}`);
}

/* ── (ii) the rigid rotation ────────────────────────────────────────────────── */
function phiAt(re, im, n, p3, chi) {          // momentum-space value of the shell-n state at p3, phase chi_l ∈ {1, (-i)^l, i^l}
  const p = Math.hypot(p3[0], p3[1], p3[2]);
  const theta = Math.acos(Math.max(-1, Math.min(1, p3[2] / p))), phi = Math.atan2(p3[1], p3[0]);
  let pr = 0, pi = 0;
  for (const s of BASIS) {
    if (s.n !== n) continue;
    const cr = re[s.index], ci = im[s.index]; if (cr === 0 && ci === 0) continue;
    const Y = ylm(s.l, s.m, theta, phi), f = F(n, s.l, p);
    let ar = f * Y.re, ai = f * Y.im;                 // × chi_l
    const ph = chi === 'none' ? 0 : (chi === '(-i)^l' ? -s.l : s.l) * Math.PI / 2;
    const c = Math.cos(ph), sn = Math.sin(ph), br = ar * c - ai * sn, bi = ar * sn + ai * c;
    pr += cr * br - ci * bi; pi += cr * bi + ci * br;
  }
  return [pr, pi];
}
const xiOf = (p3, p0, pole) => { const p2 = p3[0] ** 2 + p3[1] ** 2 + p3[2] ** 2, d = p0 * p0 + p2;
  return [pole * (p0 * p0 - p2) / d, 2 * p0 * p3[0] / d, 2 * p0 * p3[1] / d, 2 * p0 * p3[2] / d]; };  // quaternion (real, i, j, k)
const pOf = (xi, p0, pole) => { const x4 = pole * xi[0]; return [p0 * xi[1] / (1 + x4), p0 * xi[2] / (1 + x4), p0 * xi[3] / (1 + x4)]; };
function rand() { return Math.random() * 2 - 1; }
const AX = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

function rigidTest(n, which, axis, angle, chi, cand) {
  // random shell-n state
  const re = new Float64Array(N), im = new Float64Array(N);
  for (const s of BASIS) if (s.n === n) { re[s.index] = rand(); im[s.index] = rand(); }
  const re2 = Float64Array.from(re), im2 = Float64Array.from(im);
  applyRotor(re2, im2, { which, axis, angle });
  // candidate 4D rotation: (qL, qR) with half-angle sign sg, roles swapped or not, pole ±
  const { sg, swap, pole } = cand;
  const h = expPure(AX[axis].map((v) => v * sg * angle / 2)), one = [1, 0, 0, 0];
  let qL = one, qR = one;
  if (which === '+') { qL = h; } else if (which === '−') { qR = h; } else if (which === 'both') { qL = h; qR = h; } else if (which === 'K') { qL = h; qR = qconj(h); }
  if (swap) { const t = qL; qL = qR; qR = t; }
  const p0 = 1 / n; let worst = 0;
  for (let i = 0; i < 40; i++) {
    const p3 = [rand() * 0.8, rand() * 0.8, rand() * 0.8];
    const xi = xiOf(p3, p0, pole);
    // phi'(xi) = phi(R^{-1} xi):  R^{-1} x = conj(qL) x qR
    const xiBack = qmul(qmul(qconj(qL), xi), qR);
    const pBack = pOf(xiBack, p0, pole);
    const a = phiAt(re2, im2, n, p3, chi), b = phiAt(re, im, n, pBack, chi);
    const ja = Math.pow(p0 * p0 + p3[0] ** 2 + p3[1] ** 2 + p3[2] ** 2, 2), jb = Math.pow(p0 * p0 + pBack[0] ** 2 + pBack[1] ** 2 + pBack[2] ** 2, 2);
    worst = Math.max(worst, Math.hypot(a[0] * ja - b[0] * jb, a[1] * ja - b[1] * jb));
  }
  return worst;
}
console.log('\n== rigid rotation: which (sign, swap, pole, phase) makes phi\'(xi)·J = phi(R^{-1}xi)·J\' — max error over 40 random momenta ==');
const cands = [];
for (const sg of [1, -1]) for (const swap of [false, true]) for (const pole of [1, -1]) cands.push({ sg, swap, pole });
for (const chi of ['(-i)^l', 'i^l', 'none']) {
  for (const which of ['both', 'K', '+', '−']) {
    const rows = [];
    for (const cand of cands) {
      let w = 0;
      for (const axis of ['x', 'y', 'z']) for (const n of [2, 3, 4]) w = Math.max(w, rigidTest(n, which, axis, 0.7 + 0.3 * n, chi, cand));
      rows.push({ cand, w });
    }
    rows.sort((a, b) => a.w - b.w);
    const best = rows[0];
    console.log(`  phase ${chi.padEnd(7)} which ${which.padEnd(5)}: best = (sg ${best.cand.sg > 0 ? '+' : '-'}, swap ${best.cand.swap}, pole ${best.cand.pole > 0 ? '+' : '-'}) err ${best.w.toExponential(2)};  all: ` + rows.map((r) => r.w.toExponential(1)).join(' '));
  }
}
/* the same, with the rotation angle scanned, to see the sign law is not an angle accident */
console.log('\n== the closing candidate, angles 0.3 .. 2.9, shells 2..6, mixed drives ==');
let worstAll = 0;
for (const n of [2, 3, 4, 5, 6]) for (const which of ['+', '−', 'both', 'K']) for (const axis of ['x', 'y', 'z']) for (const ang of [0.3, 1.1, 2.9]) {
  const w = rigidTest(n, which, axis, ang, '(-i)^l', { sg: 1, swap: false, pole: 1 });
  worstAll = Math.max(worstAll, w);
}
console.log(`  candidate (sg +, no swap, pole +, phase (-i)^l): max error ${worstAll.toExponential(2)}`);
let worstAlt = 0;
for (const n of [2, 3, 4, 5, 6]) for (const which of ['+', '−', 'both', 'K']) for (const axis of ['x', 'y', 'z']) for (const ang of [0.3, 1.1, 2.9]) {
  const w = rigidTest(n, which, axis, ang, '(-i)^l', { sg: -1, swap: false, pole: 1 });
  worstAlt = Math.max(worstAlt, w);
}
console.log(`  candidate (sg -, no swap, pole +, phase (-i)^l): max error ${worstAlt.toExponential(2)}`);
for (const cand of [{ sg: 1, swap: true, pole: 1 }, { sg: 1, swap: false, pole: -1 }, { sg: -1, swap: true, pole: -1 }, { sg: -1, swap: true, pole: 1 }, { sg: 1, swap: true, pole: -1 }, { sg: -1, swap: false, pole: -1 }]) {
  let w = 0;
  for (const n of [2, 3, 4, 5, 6]) for (const which of ['+', '−', 'both', 'K']) for (const axis of ['x', 'y', 'z']) for (const ang of [0.3, 1.1, 2.9]) w = Math.max(w, rigidTest(n, which, axis, ang, '(-i)^l', cand));
  console.log(`  candidate (sg ${cand.sg > 0 ? '+' : '-'}, swap ${cand.swap}, pole ${cand.pole > 0 ? '+' : '-'}, phase (-i)^l): max error ${w.toExponential(2)}`);
}
