/* tests/momentum.test.mjs — the node proof of hydrogen in momentum space.
 *   node tests/momentum.test.mjs
 * The oracle is the Fourier transform itself: the closed form must equal the Hankel transform of the lab's own
 * position-space radial functions, be normalised, be orthogonal across n, and its table twin must agree with it.
 */
import { radial, modeTable, orbitalFromTable, BASIS } from '../lab/hydrogen.js';
import { momentumRadial, momentumPoly, momentumTable, momentumFromTable, phiAt, fockPoint, fockInverse, gegenbauerCoeffs } from '../lab/momentum.js';
import { applyRotor } from '../lab/frontier.js';
import { qmul, qconj, expPure } from '../lab/rotor4.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 280)));
}
function simpson(f, a, b, N) { const h = (b - a) / N; let s = f(a) + f(b); for (let i = 1; i < N; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; }
/* spherical Bessel functions for l ≤ 2, with series guards near zero */
function jl(l, x) {
  if (l === 0) return x < 1e-4 ? 1 - x * x / 6 : Math.sin(x) / x;
  if (l === 1) return x < 1e-3 ? x / 3 - x * x * x / 30 : Math.sin(x) / (x * x) - Math.cos(x) / x;
  return x < 2e-2 ? x * x / 15 - x * x * x * x / 210 : (3 / (x * x * x) - 1 / x) * Math.sin(x) - 3 * Math.cos(x) / (x * x);
}
/* Gegenbauer sanity: C^{(1)}_k = U_k (Chebyshev II), C^{(λ)}_1 = 2λx */
{
  const u3 = gegenbauerCoeffs(3, 1);                 // U_3 = 8x³ − 4x
  judge('P Gegenbauer recurrence: C^{(1)}_3 = U_3 = 8x³ − 4x and C^{(λ)}_1 = 2λx', Math.abs(u3[3] - 8) < 1e-12 && Math.abs(u3[1] + 4) < 1e-12 && Math.abs(gegenbauerCoeffs(1, 2.5)[1] - 5) < 1e-12, u3);
}
/* normalisation for every (n, l) with n ≤ 6 */
{
  let worst = 0, where = null;
  for (let n = 1; n <= 6; n++) for (let l = 0; l < n; l++) {
    const I = simpson((p) => { const F = momentumRadial(n, l, p); return F * F * p * p; }, 0, 60 / n, 40000);
    if (Math.abs(I - 1) > worst) { worst = Math.abs(I - 1); where = [n, l, I]; }
  }
  judge('P the closed form is normalised, ∫F²p²dp = 1, for all 21 (n,l) with n ≤ 6 (1e-7)', worst < 1e-7, { worst, where });
  const o = simpson((p) => momentumRadial(2, 0, p) * momentumRadial(3, 0, p) * p * p, 0, 40, 40000);
  const o2 = simpson((p) => momentumRadial(3, 1, p) * momentumRadial(5, 1, p) * p * p, 0, 40, 40000);
  judge('P and orthogonal across n at fixed l: ⟨F₂₀|F₃₀⟩ and ⟨F₃₁|F₅₁⟩ vanish (1e-7)', Math.abs(o) < 1e-7 && Math.abs(o2) < 1e-7, [o, o2]);
}
/* THE ORACLE: F_nl(p) = √(2/π) ∫ j_l(pr) R_nl(r) r² dr, the Hankel transform of the lab's own radial functions */
{
  let worst = 0, where = null, signFlip = false;
  for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 1], [3, 2], [4, 2], [5, 0], [6, 2]]) {
    let peak = 0; const errs = [];
    for (let i = 1; i <= 10; i++) {
      const p = i * 0.35 / n;
      const H = Math.sqrt(2 / Math.PI) * simpson((r) => jl(l, p * r) * radial(n, l, r) * r * r, 0, 14 * n * n + 20, 30000);
      const F = momentumRadial(n, l, p);
      peak = Math.max(peak, Math.abs(F)); errs.push([Math.abs(F - H), Math.abs(F + H)]);
    }
    const e = Math.max(...errs.map((x) => x[0])) / peak, eFlip = Math.max(...errs.map((x) => x[1])) / peak;
    if (eFlip < e) signFlip = true;
    if (Math.min(e, eFlip) > worst) { worst = Math.min(e, eFlip); where = [n, l]; }
  }
  judge('P THE FOURIER ORACLE: the closed form equals the Hankel transform √(2/π)∫j_l(pr)R_nl(r)r²dr of the lab\'s position functions for eight (n,l), to 1e-6 of the peak', worst < 1e-6, { worst, where });
  judge('P and with the SAME sign — so φ_nlm = (−i)^l F_nl Y_lm with no extra (−1) anywhere', !signFlip, { signFlip });
}
/* the table twin: momentumFromTable = (−i)^l F_nl(p) Y_lm(p̂) with the lab's own angular convention */
{
  let worst = 0;
  let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
  for (const s of BASIS) {
    if (s.n > 4 && (s.n + s.l + s.m) % 3) continue;
    const T = momentumTable(s.n, s.l, s.m), Tp = modeTable(s.n, s.l, s.m);
    for (let k = 0; k < 3; k++) {
      const x = rnd() * 2, y = rnd() * 2, z = rnd() * 2, r = Math.hypot(x, y, z);
      const ang = orbitalFromTable(Tp, x, y, z), R = radial(s.n, s.l, r);
      if (Math.abs(R) < 1e-6) continue;
      const Y = { re: ang.re / R, im: ang.im / R };
      const F = momentumRadial(s.n, s.l, r);
      const ph = [[1, 0], [0, -1], [-1, 0], [0, 1]][s.l % 4];
      const e0 = { re: F * Y.re, im: F * Y.im }, exp = { re: e0.re * ph[0] - e0.im * ph[1], im: e0.re * ph[1] + e0.im * ph[0] };
      const got = momentumFromTable(T, x, y, z);
      worst = Math.max(worst, Math.abs(got.re - exp.re), Math.abs(got.im - exp.im));
    }
  }
  judge('P the table twin (what the kernel evaluates) equals (−i)^l F_nl Y_lm with the lab\'s angular convention, over the basis (1e-12)', worst < 1e-12, worst);
  const P = momentumPoly(6, 0);
  judge('P the numerator polynomial has degree n−l−1 (five for 6s), so it fits the six-coefficient record', P.length === 6 && momentumPoly(3, 2).length === 1, P.map((v) => +v.toFixed(3)));
}
/* superposition and the Fock map */
{
  const re = new Float64Array(91), im = new Float64Array(91);
  const a = BASIS.findIndex((s) => s.n === 2 && s.l === 1 && s.m === 1), b = BASIS.findIndex((s) => s.n === 1 && s.l === 0 && s.m === 0);
  re[a] = 0.6; im[b] = 0.8;
  const v = phiAt(re, im, 0.3, -0.2, 0.5, [a, b]);
  const ta = momentumFromTable(momentumTable(2, 1, 1), 0.3, -0.2, 0.5), tb = momentumFromTable(momentumTable(1, 0, 0), 0.3, -0.2, 0.5);
  judge('P phiAt superposes with complex coefficients', Math.abs(v.re - (0.6 * ta.re - 0.8 * tb.im)) < 1e-15 && Math.abs(v.im - (0.6 * ta.im + 0.8 * tb.re)) < 1e-15);
  let worst = 0;
  for (const p of [[0.1, 0.2, -0.3], [1, 0, 0], [0, 0, 0], [2, -1, 0.5]]) for (const n of [1, 2, 5]) {
    const xi = fockPoint(p, n), back = fockInverse(xi, n);
    worst = Math.max(worst, Math.abs(Math.hypot(...xi) - 1), ...p.map((c, i) => Math.abs(c - back[i])));
  }
  judge('P Fock\'s map lands on the unit S³ and inverts (1e-14); p = 0 is the north pole and p = p₀ the equator', worst < 1e-14 && Math.abs(fockPoint([0, 0, 0], 3)[3] - 1) < 1e-15 && Math.abs(fockPoint([1 / 3, 0, 0], 3)[3]) < 1e-15, worst);
}

/* THE RIGID-ROTATION GATE (Round 10 §1.4): after ANY rotor drive of a shell, the momentum picture on Fock's S³
   has merely TURNED.  Identify ξ ∈ S³ with the quaternion x = [ξ₄, ξ₁, ξ₂, ξ₃]; a drive of angle θ about â is
   h = exp(θâ/2), with '+' = (h,1), '−' = (1,h), 'both' = (h,h), 'K' = (h,h̄); then
       φ'(p)·(p₀²+p²)² = φ(p_back)·(p₀²+p_back²)²,   ξ(p_back) = q̄_L ξ(p) q_R. */
{
  let seed = 99; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  let worst = 0, where = null, checks = 0;
  for (const n of [2, 3, 4, 6]) for (const which of ['+', '−', 'both', 'K']) for (const axis of ['x', 'y', 'z']) for (const theta of [0.3, 1.1]) {
    const re = new Float64Array(91), im = new Float64Array(91), ids = [];
    for (const s of BASIS) if (s.n === n) { ids.push(s.index); re[s.index] = rnd() - 0.5; im[s.index] = rnd() - 0.5; }
    const pts = []; for (let k = 0; k < 6; k++) pts.push([(rnd() - 0.5) * 2 / n, (rnd() - 0.5) * 2 / n, (rnd() - 0.5) * 2 / n]);
    const before = pts.map((p) => phiAt(re, im, p[0], p[1], p[2], ids));
    const re2 = Float64Array.from(re), im2 = Float64Array.from(im);
    applyRotor(re2, im2, { which, axis, angle: theta });
    const a = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[axis].map((v) => v * theta / 2);
    const h = expPure(a), hb = qconj(h), one = [1, 0, 0, 0];
    const [qL, qR] = which === '+' ? [h, one] : which === '−' ? [one, h] : which === 'both' ? [h, h] : [h, hb];
    const p0 = 1 / n;
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k], xi = fockPoint(p, n), x = [xi[3], xi[0], xi[1], xi[2]];
      const xb = qmul(qmul(qconj(qL), x), qR);
      const pb = fockInverse([xb[1], xb[2], xb[3], xb[0]], n);
      const after = phiAt(re2, im2, p[0], p[1], p[2], ids), back = before[k];
      /* compare φ'(p)(p₀²+p²)² with φ(p_back)(p₀²+p_back²)² — φ(p_back) must be evaluated on the ORIGINAL state */
      const fb = phiAt(re, im, pb[0], pb[1], pb[2], ids);
      const wA = Math.pow(p0 * p0 + p[0] ** 2 + p[1] ** 2 + p[2] ** 2, 2), wB = Math.pow(p0 * p0 + pb[0] ** 2 + pb[1] ** 2 + pb[2] ** 2, 2);
      const d = Math.hypot(after.re * wA - fb.re * wB, after.im * wA - fb.im * wB);
      const scale = Math.hypot(after.re * wA, after.im * wA) + 1e-300;
      if (d / scale > worst) { worst = d / scale; where = { n, which, axis, theta }; }
      checks++;
    }
  }
  judge(`P THE RIGID-ROTATION GATE (Round 10 §1.4): after every rotor drive ('+', '−', 'both', 'K'; three axes; two angles; shells 2, 3, 4, 6; ${checks} momenta) the momentum picture on Fock's S³ has merely TURNED — φ'(p)(p₀²+p²)² = φ(p_back)(p₀²+p_back²)² with ξ(p_back) = q̄_L ξ(p) q_R, to 1e-11`, worst < 1e-11, { worst, where });
}
console.log((FAILED ? 'RED' : 'GREEN') + ' momentum.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
