/* P1 — the three-lobed object, and how fast an orbital goes round.
 * Josh's state (from the 12:05 screencast): 2p₋1 + 2p₊1 + 4p₋1 + 4d₊2.  Claim: the density's azimuthal harmonics are the
 * pairwise |m − m'| of the populated labels — {0, 1, 2, 3} here — and the 3-fold lobes are the (4d₊2, 2p₋1) and
 * (4d₊2, 4p₋1) interference; the pure pair 4d₊2 + 2p₋1 has EXACTLY three maxima in φ.
 * Second claim: the azimuthal speed of an eigenstate |n l m⟩ is v_φ = m/(r sin θ) — faster near the axis, Kepler-like.
 */
import { BASIS, psiAt } from '../../lab/hydrogen.js';
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
function densityPhi(coeffs, r, theta, N = 720) {
  const re = new Float64Array(91), im = new Float64Array(91); const ids = [];
  for (const [a, c] of coeffs) { re[a] = c; ids.push(a); }
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++) { const phi = 2 * Math.PI * i / N; const x = r * Math.sin(theta) * Math.cos(phi), y = r * Math.sin(theta) * Math.sin(phi), z = r * Math.cos(theta); const p = psiAt(re, im, x, y, z, ids); out[i] = p.re * p.re + p.im * p.im; }
  return out;
}
function maxima(d) { let n = 0; const N = d.length; for (let i = 0; i < N; i++) { const a = d[(i - 1 + N) % N], b = d[i], c = d[(i + 1) % N]; if (b > a && b >= c && b > 1e-12) n++; } return n; }
function harmonics(d, K = 6) { const N = d.length, out = []; for (let k = 0; k <= K; k++) { let cr = 0, ci = 0; for (let i = 0; i < N; i++) { const phi = 2 * Math.PI * i / N; cr += d[i] * Math.cos(k * phi); ci -= d[i] * Math.sin(k * phi); } out.push(Math.hypot(cr, ci) / N * (k ? 2 : 1)); } return out; }
const pair = [[idx(4, 2, 2), 1 / Math.SQRT2], [idx(2, 1, -1), 1 / Math.SQRT2]];
const josh = [[idx(2, 1, -1), 0.5], [idx(2, 1, 1), 0.5], [idx(4, 1, -1), 0.5], [idx(4, 2, 2), 0.5]];
for (const [name, c] of [['4d+2 + 2p-1', pair], ['Josh: 2p-1 + 2p+1 + 4p-1 + 4d+2', josh]]) {
  for (const r of [3, 6]) { const d = densityPhi(c, r, Math.PI / 2.4); const h = harmonics(d); console.log(name, 'r =', r, 'maxima in φ:', maxima(d), 'harmonics |ρ_k|/ρ_0:', h.map((v) => (v / h[0]).toFixed(3)).join(' ')); }
}
/* the azimuthal speed: v_φ = j_φ / ρ = m / (r sin θ) for e^{imφ}; check by finite differences of the phase of ψ */
{
  const re = new Float64Array(91), im = new Float64Array(91); const a = idx(2, 1, 1); re[a] = 1;
  for (const rho of [1, 2, 4, 8]) { const dphi = 1e-4; const p0 = psiAt(re, im, rho, 0, 0, [a]), p1 = psiAt(re, im, rho * Math.cos(dphi), rho * Math.sin(dphi), 0, [a]); const dS0 = Math.atan2(p1.im, p1.re) - Math.atan2(p0.im, p0.re), dS = Math.atan2(Math.sin(dS0), Math.cos(dS0)); const v = dS / dphi / rho; console.log('2p+1 at ρ =', rho, ': v_φ =', v.toFixed(4), '(m/ρ =', (1 / rho).toFixed(4) + ')'); }
  console.log('phase rates |E_n| (a.u.): n=1..6 →', [1, 2, 3, 4, 5, 6].map((n) => (0.5 / n / n).toFixed(4)).join(' '), '; Kepler ω_n = 1/n³ →', [1, 2, 3, 4, 5, 6].map((n) => (1 / n ** 3).toFixed(4)).join(' '));
}
