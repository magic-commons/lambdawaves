/* P8 — Fable, for Round 3: (a) Opus's Q12 answered — the exact density period of every subset of shells from {1..6}:
 *      every ΔE is an integer multiple of 1/7200 (E_n = −1/2n², lcm(1..6)² = 3600), so T = 2π·7200/gcd; the table is the
 *      CLOCK's specification.  (b) The outer cloud of Josh's state: h2 vs h3 (static + turning) at r = 12, 16, 20.
 */
import { BASIS, psiAt } from '../../lab/hydrogen.js';
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const AU_FS = 0.02418884;
{
  const shells = [1, 2, 3, 4, 5, 6], rows = [];
  for (let mask = 1; mask < 64; mask++) {
    const S = shells.filter((n, i) => mask & (1 << i)); if (S.length < 2) continue;
    let g = 0; for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) { const a = S[i], b = S[j]; const k = (7200 / (2 * a * a)) - (7200 / (2 * b * b)); g = gcd(g, Math.round(Math.abs(k))); }   // ΔE·7200 is an integer
    rows.push({ S: S.join(''), g, T: 2 * Math.PI * 7200 / g });
  }
  rows.sort((p, q) => q.T - p.T);
  console.log('period table (a.u. | fs) for shell subsets, longest first:');
  for (const r of rows.slice(0, 12)) console.log('  shells', r.S.padEnd(6), 'gcd·7200 =', String(r.g).padStart(5), ' T =', r.T.toFixed(3).padStart(10), 'a.u. =', (r.T * AU_FS).toFixed(4), 'fs');
  console.log('  …');
  for (const r of rows.filter((x) => ['24', '12', '123456', '56', '1234'].includes(x.S))) console.log('  shells', r.S.padEnd(6), 'gcd·7200 =', String(r.g).padStart(5), ' T =', r.T.toFixed(3).padStart(10), 'a.u. =', (r.T * AU_FS).toFixed(4), 'fs');
  console.log('longest possible period: shells', rows[0].S, '→', rows[0].T.toFixed(2), 'a.u. =', (rows[0].T * AU_FS / 1000).toFixed(4), 'ps; the four-channel state (shells 2,4) → 67.021 a.u.');
}
{
  const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
  const ids = [idx(2, 1, -1), idx(2, 1, 1), idx(4, 1, -1), idx(4, 2, 2)];
  const harm = (r, t) => { const re = new Float64Array(91), im = new Float64Array(91); const E = (a) => -0.5 / (BASIS[a].n * BASIS[a].n);
    for (const a of ids) { re[a] = 0.5 * Math.cos(-E(a) * t); im[a] = 0.5 * Math.sin(-E(a) * t); }
    const N = 360, th = Math.PI / 2.4, h = [0, 0, 0, 0]; const cr = [0, 0, 0, 0], ci = [0, 0, 0, 0];
    for (let i = 0; i < N; i++) { const phi = 2 * Math.PI * i / N; const p = psiAt(re, im, r * Math.sin(th) * Math.cos(phi), r * Math.sin(th) * Math.sin(phi), r * Math.cos(th), ids); const d = p.re * p.re + p.im * p.im; for (let k = 0; k < 4; k++) { cr[k] += d * Math.cos(k * phi); ci[k] -= d * Math.sin(k * phi); } }
    for (let k = 0; k < 4; k++) h[k] = (k ? 2 : 1) * Math.hypot(cr[k], ci[k]) / N; return h; };
  for (const r of [6, 12, 16, 20]) { const h0 = harm(r, 0), hT = harm(r, 33.51); console.log('Josh\'s state, r =', r, ': |h_k|/h_0 at t = 0 →', h0.slice(1).map((v) => (v / h0[0]).toFixed(3)).join(' '), '; at t = T/2 = 33.51 →', hT.slice(1).map((v) => (v / hT[0]).toFixed(3)).join(' '), '(k = 1, 2, 3)'); }
}
