/* bf-r8-verify-kill.mjs — Round 8 (Fable): verify Round 6's kill of stretchedCensus before fixing anything.
 * Opus: (3d₊₂, 4p₊₁, 5s) with moduli (1, 76241.394354, 3.7179689892) makes the instrument print 0 reconnections;
 * the truth is 8, with roots near 5.52779176, 5.52793632, 14.47210203, 14.47216989 — the radial nodes of the
 * MIDDLE mode (R_41: 5.527864, 14.472136), which the fine scan never covers.
 */
import { stretchedCensus } from '../../lab/frontier.js';
import { radial, ylm } from '../../lab/hydrogen.js';
const modes = [
  { n: 3, l: 2, m: 2, re: 1, im: 0 },
  { n: 4, l: 1, m: 1, re: 76241.394354, im: 0 },
  { n: 5, l: 0, m: 0, re: 3.7179689892, im: 0 },
];
const cen = stretchedCensus(modes, 60);
console.log('what the instrument prints:', { roots: cen.roots.map((r) => +r.toFixed(6)), admissible: cen.admissible, census: cen.count });

/* the truth, by a brute scan at 1e-6 on Φ(r) = a₀² − 4|a₊a₋| */
const sig = (l, m) => ylm(l, m, Math.PI / 2, 0).re;
const A = (s, r) => radial(s.n, s.l, r) * sig(s.l, s.m) * Math.hypot(s.re, s.im);
const [P, Z, N] = [modes[0], modes[1], modes[2]];
const Phi = (r) => A(Z, r) ** 2 - 4 * Math.abs(A(P, r) * A(N, r));
const xi = (r) => Math.abs(A(Z, r)) / (2 * Math.abs(A(P, r)));
const truth = [];
let pr = 1e-3, pv = Phi(pr);
for (let i = 2; i <= 60000000; i++) {
  const r = i * 1e-6; if (r > 60) break;
  const v = Phi(r);
  if (pv * v < 0) { let a = pr, b = r, fa = pv; for (let k = 0; k < 80; k++) { const m = (a + b) / 2, fm = Phi(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } truth.push((a + b) / 2); }
  pv = v; pr = r;
}
console.log('the truth (1e-6 brute scan):', truth.map((r) => +r.toFixed(8)), '→ admissible', truth.filter((r) => xi(r) <= 1).length, '→ census', 2 * truth.filter((r) => xi(r) <= 1).length);
console.log('ξ at each root:', truth.map((r) => +xi(r).toFixed(6)));
/* the radial nodes of each of the three modes, to see which ones generate the pairs */
for (const s of [P, Z, N]) {
  const nodes = []; let p0 = 0.02, v0 = radial(s.n, s.l, p0);
  for (let r = 0.03; r <= 60; r += 0.005) { const v = radial(s.n, s.l, r); if (v0 * v < 0) nodes.push(+((p0 + r) / 2).toFixed(6)); v0 = v; p0 = r; }
  console.log(`  nodes of R_${s.n}${s.l} (m = ${s.m}):`, nodes, '| Φ there:', nodes.map((r) => (Phi(r) > 0 ? '+' : '−')).join(''));
}
