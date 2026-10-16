/* tools/lattice/ammann-beenker.mjs — THE AB PATCH (0.7.2 L2): writes lab/ab-patch.json, the LATTICE window's AB PATCH preset.
 * Cut and project from ℤ⁴: a point n is kept when its perpendicular image P⊥n = Σ nₖ e⊥ₖ (e⊥ₖ = (cos 3kπ/4, sin 3kπ/4)) falls in the
 * octagon P⊥([−½, ½]⁴), centred on 0 — no lattice point lies on its edges (an edge's line is a + b/√2 = ½ + 1/√2, a, b integers), so the
 * set is a true tiling and exactly 8-fold about the origin.  The physical image r = Σ nₖ eₖ (eₖ = (cos kπ/4, sin kπ/4)) is kept inside the
 * largest disc that holds ≤ 256 vertices; the edges are the lifts differing by ±eₖ, all of length 1 (the window finds them by distance).
 * The diffraction S(q) = |Σⱼ e^{iq·rⱼ}|² / N² is computed in f64 on the Fourier module q = π Σ mₖ eₖ (|m|∞ ≤ 5), and the first six
 * 8-fold orbits by |q| with S ≥ 0.1 are written with |q|, S and the index m — "a patch", never "the quasicrystal".
 *   node tools/lattice/ammann-beenker.mjs [--check] */
import fs from 'node:fs';
const OUT = new URL('../../lab/ab-patch.json', import.meta.url), C = Math.cos, S = Math.sin, PI = Math.PI;
const e = [0, 1, 2, 3].map((k) => [C(k * PI / 4), S(k * PI / 4)]), ep = [0, 1, 2, 3].map((k) => [C(3 * k * PI / 4), S(3 * k * PI / 4)]);
const dot = (n, b) => [n.reduce((s, v, k) => s + v * b[k][0], 0), n.reduce((s, v, k) => s + v * b[k][1], 0)];
/* the octagon as the zonotope Σ tₖ e⊥ₖ, t ∈ [−½, ½]: |u · ν| ≤ ½ Σⱼ |e⊥ⱼ · ν| for each edge normal ν ⟂ e⊥ₖ */
const inOct = (u) => ep.every(([a, b]) => Math.abs(-b * u[0] + a * u[1]) <= 0.5 * ep.reduce((s, [x, y]) => s + Math.abs(-b * x + a * y), 0));
const all = [], M = 7;
for (let a = -M; a <= M; a++) for (let b = -M; b <= M; b++) for (let c = -M; c <= M; c++) for (let d = -M; d <= M; d++) {
  const n = [a, b, c, d]; if (!inOct(dot(n, ep))) continue; const r = dot(n, e); all.push({ n, r, d: Math.hypot(r[0], r[1]) }); }
all.sort((x, y) => x.d - y.d);
let cut = 256; while (cut < all.length && all[cut].d - all[cut - 1].d < 1e-9) cut--;   // whole shells only, so the disc stays 8-fold
while (cut > 0 && all[cut].d - all[cut - 1].d < 1e-9) cut--;
const V = all.slice(0, cut), xy = V.map(({ r }) => r.map((v) => +v.toFixed(15)));
let edges = 0; for (let i = 0; i < V.length; i++) for (let j = 0; j < i; j++) { const dn = V[i].n.map((v, k) => v - V[j].n[k]); if (dn.reduce((s, v) => s + Math.abs(v), 0) === 1) edges++; }
const Sq = (q) => { let re = 0, im = 0; for (const [x, y] of xy) { re += C(q[0] * x + q[1] * y); im += S(q[0] * x + q[1] * y); } return (re * re + im * im) / (xy.length ** 2); };
const orbit = new Map();
for (let a = -5; a <= 5; a++) for (let b = -5; b <= 5; b++) for (let c = -5; c <= 5; c++) for (let d = -5; d <= 5; d++) {
  const m = [a, b, c, d]; if (!a && !b && !c && !d) continue; const q = dot(m, e).map((v) => PI * v), k = Math.hypot(q[0], q[1]);
  const key = k.toFixed(6) + ':' + Sq(q).toFixed(9); if (!orbit.has(key)) orbit.set(key, { q: k, S: Sq(q), m, at: q }); }
const peaks = [...orbit.values()].filter((p) => p.S >= 0.1).sort((x, y) => x.q - y.q).slice(0, 6);   // the first six Bragg orbits by |q| with S ≥ 0.1 (below it, the patch's finite-size ripple: every orbit under 7.58 reads S < 0.05)
const out = JSON.stringify({ note: 'a patch of the Ammann–Beenker tiling by cut and project from Z^4 (tools/lattice/ammann-beenker.mjs): vertices in bond lengths; the first six 8-fold orbits by |q| with S >= 0.1 of S(q) = |sum exp(i q.r)|^2 / N^2, q = pi sum m_k e_k',
  n: xy.length, edges, xy, peaks }) + '\n';
if (process.argv.includes('--check')) { const ok = fs.readFileSync(OUT, 'utf8') === out; console.log(ok ? 'lab/ab-patch.json in step' : 'lab/ab-patch.json STALE'); process.exit(ok ? 0 : 1); }
fs.writeFileSync(OUT, out);
console.log(`lab/ab-patch.json: ${xy.length} vertices, ${edges} edges, radius ${V[V.length - 1].d.toFixed(4)}; peaks:`);
for (const p of peaks) console.log(`  |q| ${p.q.toFixed(6)}  S ${p.S.toExponential(6)}  m ${p.m.join(',')}`);
