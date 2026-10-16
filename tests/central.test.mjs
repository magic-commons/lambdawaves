/* tests/central.test.mjs — CENTRAL (0.8.0 G1), the generic central Hamiltonian, against the closed forms it prints.   node tests/central.test.mjs
 * The confined atom's oracle is built HERE, independently of lab/central.js: the series of M(1 − 1/κ, 2, z) and a bisection on its first zero. */
import { createHash } from 'node:crypto';
import { solveCentral, DEFAULTS, POTENTIALS, CENTRAL, configure, save } from '../lab/central.js';
import { numerov, configure as qq, solved as qqSolved, cornellRadialTable } from '../lab/cornell.js';
import { HAMILTONIANS } from '../lab/hamiltonian.js'; import { BASIS } from '../lab/hydrogen.js';
let FAILED = 0, TOTAL = 0;
const judge = (name, ok, detail) => { TOTAL++; if (!ok) FAILED++; console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 400))); };
const M = (a, z) => { let t = 1, s = 1; for (let k = 0; k < 400; k++) { t *= (a + k) * z / ((2 + k) * (k + 1)); s += t; } return s; };
const bisect = (f, a, b) => { const fa = f(a); for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (fa * f(m) <= 0) b = m; else a = m; } return (a + b) / 2; };
const confined1s = (R) => { const F = (E) => { const k = Math.sqrt(-2 * E); return M(1 - 1 / k, 2 * k * R); }; let E = -0.5 + 1e-14; while (F(E) * F(E + 1e-4) > 0) E += 1e-4; return bisect(F, E, E + 1e-4); };
const C = (R) => (r) => -1 / r, fine = (V, R, N = 48000) => numerov(V, 1, 0, 1, { rmax: R, N }).E;
{ const rows = [2, 4, 8].map((R) => { const c = confined1s(R), S = solveCentral('confined', { Rc: R }); return { R, closed: c, shipped: Math.abs(S.E[0] - c), fine: Math.abs(fine(C(R), R) - c), printed: S.oracle.d }; });
  judge('CONFINED 1s vs the zero of M(1 − 1/κ, 2, 2κR_c) at R_c = 2, 4, 8 a₀: the shipped grid within 1e-6, Numerov at 8× the grid within 1e-9, the card prints its own distance',
    rows.every((r) => r.shipped < 1e-6 && r.fine < 1e-9 && Math.abs(r.printed - r.shipped) < 1e-9), rows);
  const Rc = bisect((R) => fine(C(R), R, 24000), 1.7, 2.0);
  judge('CONFINED: the 1s leaves the bound spectrum at R_c = 1.835246 a₀ (j²₁,₁/8, the zero of the E = 0 solution √r J₁(√8r)) to 1e-6', Math.abs(Rc - 1.835246) < 1e-6, { Rc, closed: 3.8317059702075123 ** 2 / 8 }); }
{ const ys = [2, 5, 20].map((lam) => ({ lam, d: solveCentral('yukawa', { lam }).oracle.d })), inf = solveCentral('yukawa', { lam: 1e6 }).E[0], E2 = solveCentral('yukawa', { lam: 0.86 }).E[0], E1 = solveCentral('yukawa', { lam: 0.82 }).E[0];
  judge('YUKAWA 1s at λ = 2, 5, 20 vs Numerov at 2N within 1e-4; λ → ∞ is hydrogen\'s −0.5 (2e-4, the grid); the 1s is bound at λ = 0.86 and unbound at 0.82 (λ_c = 0.839908, δ_c = 1.190612 inverted)',
    ys.every((y) => y.d < 1e-4) && Math.abs(inf + 0.5) < 2e-4 && E2 < 0 && Number.isNaN(E1), { ys, inf, E2, E1 }); }
{ const p = { V0: 5, a: 4 }, S = solveCentral('well', p), g = (E) => { const k = Math.sqrt(2 * (p.V0 + E)), q = Math.sqrt(-2 * E); return k * Math.cos(k * p.a) + q * Math.sin(k * p.a); }, roots = [];
  for (let E = -p.V0 + 1e-9, h = 1e-4; E + h < 0; E += h) if (g(E) * g(E + h) <= 0) roots.push(bisect(g, E, E + h));
  const s = [1, 2, 3, 4, 5, 6].map((n) => S.E[n - 1]).filter((E) => E < 0), worst = Math.max(...s.map((E, i) => Math.abs(E - roots[i])));
  judge('FINITE WELL V₀ = 5, a = 4: every bound s level matches k cos ka + κ sin ka = 0 within 1e-3, as many levels as roots', s.length === roots.length && worst < 1e-3, { s, roots, worst }); }
{ const d = solveCentral('softcore', { a: 0.5 }).oracle.d, lim = [0.1, 0.01, 0.001].map((a) => fine((r) => -1 / Math.sqrt(r * r + a * a), 30, 60000) + 0.5);
  judge('SOFT-CORE a = 0.5 vs Numerov at 2N within 1e-6; a → 0 is hydrogen: E₁ₛ + ½ falls with a, below 1e-4 at a = 10⁻³', d < 1e-6 && lim[0] > lim[1] && lim[1] > lim[2] && lim[2] < 1e-4 && lim[2] > 0, { d, lim }); }
{ const n = Object.entries(DEFAULTS).map(([k, p]) => { const S = solveCentral(k, p); return [k, Array.from(S.E).filter((E) => E < 0).length, S.bound, S.ms]; });
  judge('≥ 10 bound rows at every preset\'s defaults (rows · labels of 91 · solve ms)', n.every((r) => r[1] >= 10), n); }
{ configure({ preset: 'confined', params: { Rc: 3 } }); const a2s = BASIS.findIndex((s) => s.n === 2 && s.l === 0), a1s = 0, re = new Float64Array(91), im = new Float64Array(91); re[a2s] = 1; re[a1s] = 0.5;
  const T = CENTRAL.tableFor(BASIS[a2s]), row = Array.from(CENTRAL.radialTable().subarray(T.row * 256, T.row * 256 + 256)), psi = CENTRAL.psiAt(re, im, 0, 0, 0.5, [a2s]), saved = save();
  judge('UNBOUND at R_c = 3: the 2s has no energy (NaN), a zero row and lag, ψ ≡ 0, the spectrum lists only the 1s; saved as { preset, params }, absent at the defaults',
    Number.isNaN(CENTRAL.energy(a2s)) && CENTRAL.energy(a1s) < 0 && row.every((v) => v === 0) && T.lag[2] === 0 && psi.re === 0 && CENTRAL.spectrum.levels.length === 1 && saved.params.Rc === 3 && configure({}) && save() === undefined, { saved, levels: CENTRAL.spectrum.levels }); }
{ const h = createHash('sha256'); for (const k of ['charm', 'bottom']) { qq(k); const S = qqSolved(); h.update(Buffer.from(S.M.buffer)); h.update(Buffer.from(S.table.buffer)); } qq('charm');
  const hex = h.digest('hex');
  judge('QUARKONIUM byte-identical to cornell.js before G1 (masses and the kernel table, cc̄ and bb̄); the `cornell` preset has no generic solve — the table the kernel receives while QQ̄ is in force is cornell.js\' own',
    hex === 'ff9e1d16e73c1c05f1249dbda5dd10b5563a758ea0deddf22128471fd7a3a90a' && !POTENTIALS.cornell.V && HAMILTONIANS.cornell.radialTable() === cornellRadialTable() && HAMILTONIANS.central === CENTRAL, hex); }
console.log((FAILED ? 'RED ' : 'GREEN ') + 'central.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
