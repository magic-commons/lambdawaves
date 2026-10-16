/* lattice-model.js — LATTICE's model (0.7.2 L1), DOM-free: the tight-binding H on ≤ 256 sites from a preset and its knobs (H_ij = −t on a bond, the
 * Peierls phase e^{iΦ/N} on the AB ring), its eigensolve (real → eigSymQL, Hermitian → hermitianEigen), the exact evolution ψ(t) = C e^{−iEt} C†ψ₀
 * and the closed forms the window prints beside what it measures.  J = 1 is the energy unit and 1/J the time unit. */
import { eigSymQL } from './linalg.js'; import { hermitianEigen } from './density.js'; import AB from './ab-patch.json' with { type: 'json' };   // L2: tools/lattice/ammann-beenker.mjs
export const PRESETS = [['chain', 'CHAIN', 'N'], ['ring', 'RING', 'N'], ['square', 'SQUARE', 'L'], ['ssh', 'SSH', 'N J1 J2'], ['anderson', 'ANDERSON', 'N W seed'], ['aa', 'AUBRY–ANDRÉ', 'N lam phi'],
  ['ab', 'AB RING', 'N Phi'], ['graphene', 'GRAPHENE', 'rings'], ['benzene', 'HÜCKEL BENZENE', ''], ['tunnel', 'TUNNEL', 'N V nb'], ['patch', 'AB PATCH', '']].map(([id, label, k]) => ({ id, label, knobs: k ? k.split(' ') : [] }));
export const DEFAULTS = { preset: 'chain', N: 64, L: 8, J1: 0.5, J2: 1, W: 2, seed: 1, lam: 1, phi: 0, Phi: 0, rings: 2, V: 1, nb: 1, state: 'packet', x0: 0.25, sig: 3, k0: 1.5708, idx: 0 }; export const BETA = (Math.sqrt(5) - 1) / 2;
/** the honeycomb flake of m rings of hexagons around one (6m² sites: benzene, coronene 24, circumcoronene 54, 96), bond length 1 */
function flake(m, xy, hop) {
  const at = new Map(), s3 = Math.sqrt(3);
  for (let q = 1 - m; q < m; q++) for (let r = 1 - m; r < m; r++) if (Math.abs(q + r) < m) for (let k = 0; k < 6; k++) {
    const a = Math.PI / 6 + k * Math.PI / 3, x = s3 * (q + r / 2) + Math.cos(a), y = 1.5 * r + Math.sin(a), K = Math.round(x * 1e4) + ',' + Math.round(y * 1e4);
    if (!at.has(K)) at.set(K, xy.push([x, y]) - 1); }
  bonds(xy, hop); }
const bonds = (xy, hop) => { for (let i = 0; i < xy.length; i++) for (let j = 0; j < i; j++) if (Math.abs(Math.hypot(xy[i][0] - xy[j][0], xy[i][1] - xy[j][1]) - 1) < 1e-6) hop.push([j, i, 1]); };
/** build(p) → { n, re, im (null unless a flux), xy (sites in bond lengths), hop [[i, j, t]] } */
export function build(p) {
  const id = p.preset, xy = [], hop = [];
  if (id === 'graphene' || id === 'benzene') flake(id === 'benzene' ? 1 : p.rings, xy, hop);
  else if (id === 'patch') { for (const r of AB.xy) xy.push(r); bonds(xy, hop); }
  else if (id === 'square') for (let a = 0; a < p.L; a++) for (let b = 0; b < p.L; b++) { const i = xy.push([b, a]) - 1; if (b) hop.push([i - 1, i, 1]); if (a) hop.push([i - p.L, i, 1]); }
  else { const N = p.N, R = N / (2 * Math.PI), round = id === 'ring' || id === 'ab';
    for (let i = 0; i < N; i++) { const th = 2 * Math.PI * i / N + Math.PI / 2; xy.push(round ? [R * Math.cos(th), R * Math.sin(th)] : [i, 0]); if (i) hop.push([i - 1, i, id === 'ssh' ? (i % 2 ? p.J1 : p.J2) : 1]); }
    if (round) hop.push([N - 1, 0, 1]); }
  const n = xy.length, re = new Float64Array(n * n), im = id === 'ab' ? new Float64Array(n * n) : null, th = im ? p.Phi / n : 0;
  for (const [i, j, t] of hop) { re[i * n + j] = re[j * n + i] = -t * Math.cos(th); if (im) { im[j * n + i] = -t * Math.sin(th); im[i * n + j] = t * Math.sin(th); } }   // H_{j,i} = −t e^{iΦ/N} forward
  let s = (p.seed >>> 0) || 1; const rnd = () => { s = (s + 0x6D2B79F5) | 0; let z = Math.imul(s ^ (s >>> 15), 1 | s); z ^= z + Math.imul(z ^ (z >>> 7), 61 | z); return ((z ^ (z >>> 14)) >>> 0) / 4294967296; };   // mulberry32
  for (let i = 0; i < n; i++) re[i * n + i] = id === 'anderson' ? p.W * (rnd() - 0.5) : id === 'aa' ? p.lam * Math.cos(2 * Math.PI * (p.beta || BETA) * i + p.phi) : id === 'tunnel' && i > (n >> 1) - p.nb && i <= n >> 1 ? p.V : 0;
  return { n, re, im, xy, hop }; }
/** the eigenpairs { n, E ascending, re, im } with vectors[i·n + k] = component i of eigenvector k */
export function solveLattice({ n, re, im }) {
  if (!im) { const e = eigSymQL(re, n); return { n, E: e.values, re: e.vectors, im: null }; }
  const { w, V } = hermitianEigen({ re, im, n }); return { n, E: w, re: V.re, im: V.im }; }
/** ψ₀: an eigenstate (GROUND is m = 0), one SITE, or a Gaussian PACKET of width σ and momentum k₀ along x at the site nearest x0 of the way along */
export function psi0(p, S, xy) {
  const n = S.n, re = new Float64Array(n), im = new Float64Array(n), m = Math.min(n - 1, p.idx | 0);
  if (p.state === 'site') re[m] = 1;
  else if (p.state === 'packet') { const c = xy[Math.round(p.x0 * (n - 1))]; let z = 0;
    for (let i = 0; i < n; i++) { const dx = xy[i][0] - c[0], g = Math.exp(-(dx * dx + (xy[i][1] - c[1]) ** 2) / (2 * p.sig * p.sig)); re[i] = g * Math.cos(p.k0 * dx); im[i] = g * Math.sin(p.k0 * dx); z += g * g; }
    z = 1 / Math.sqrt(z); for (let i = 0; i < n; i++) { re[i] *= z; im[i] *= z; } }
  else { const k = p.state === 'ground' ? 0 : m; for (let i = 0; i < n; i++) { re[i] = S.re[i * n + k]; im[i] = S.im ? S.im[i * n + k] : 0; } }
  return { re, im };
}
/** evolver(S, ψ₀) → { a: C†ψ₀ (re, im), at(t) → ψ(t) } — N² complex multiply-adds a call, exact for any t */
export function evolver(S, p0) {
  const { n, E, re: Cr, im: Ci } = S, ar = new Float64Array(n), ai = new Float64Array(n), br = new Float64Array(n), bi = new Float64Array(n), re = new Float64Array(n), im = new Float64Array(n);
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) { const cr = Cr[i * n + k], ci = Ci ? Ci[i * n + k] : 0; ar[k] += cr * p0.re[i] + ci * p0.im[i]; ai[k] += cr * p0.im[i] - ci * p0.re[i]; }
  return { ar, ai, at(t) {
    for (let k = 0; k < n; k++) { const c = Math.cos(E[k] * t), s = Math.sin(E[k] * t); br[k] = ar[k] * c + ai[k] * s; bi[k] = ai[k] * c - ar[k] * s; }
    for (let i = 0, o = 0; i < n; i++, o += n) { let xr = 0, xi = 0; for (let k = 0; k < n; k++) { const cr = Cr[o + k], ci = Ci ? Ci[o + k] : 0; xr += cr * br[k] - ci * bi[k]; xi += cr * bi[k] + ci * br[k]; } re[i] = xr; im[i] = xi; }
    return { re, im }; } }; }
/** the inverse participation ratio Σ|ψᵢ|⁴ / (Σ|ψᵢ|²)²: 1 on one site, 1/N spread evenly */
export function ipr({ re, im }) { let a = 0, b = 0; for (let i = 0; i < re.length; i++) { const q = re[i] * re[i] + im[i] * im[i]; a += q; b += q * q; } return b / (a * a); }
/** TUNNEL: T(k) = 4 sin²k / (4 sin²k + V²u²) through a barrier V on nb sites (u = 1; u = V + 2 cos k on two, T = 1 at cos k = −V/2), and the norm
 * split at the barrier: R left of its sites, T from them on, B on them — "passed" once B has stayed under 1e-4 for 2/J after the packet reached it */
export const tunnelT = (k, V, nb) => { const s = 4 * Math.sin(k) ** 2, u = nb === 2 ? V + 2 * Math.cos(k) : 1; return s / (s + V * V * u * u); };
export function split({ re, im }, p) { const c = re.length >> 1; let R = 0, T = 0, B = 0; for (let i = 0; i < re.length; i++) { const q = re[i] * re[i] + im[i] * im[i]; if (i <= c - p.nb) R += q; else T += q; if (i > c - p.nb && i <= c) B += q; } return { R, T, B }; }
/** closed(p) → { levels (the closed form's, ascending) | null, line }: what the window prints beside the measured levels */
export function closed(p) {
  const cs = (m, f) => Float64Array.from({ length: m }, (_, k) => -2 * Math.cos(f(k))).sort(), g = Math.log(p.lam / 2);
  switch (p.preset) {
    case 'chain': return { levels: cs(p.N, (k) => Math.PI * (k + 1) / (p.N + 1)), line: 'E_k = −2J cos(πk/(N+1))' };
    case 'ring': return { levels: cs(p.N, (k) => 2 * Math.PI * k / p.N), line: 'E_k = −2J cos(2πk/N)' };
    case 'ab': return { levels: cs(p.N, (k) => (2 * Math.PI * k + p.Phi) / p.N), line: 'E_k = −2J cos((2πk + Φ)/N)' };
    case 'benzene': return { levels: cs(6, (k) => Math.PI * k / 3), line: 'E = α + 2β cos(2πk/6): ±2β, ±β, ±β (β = −J)' };
    case 'square': { const c = cs(p.L, (k) => Math.PI * (k + 1) / (p.L + 1)); return { levels: Float64Array.from([...c].flatMap((a) => [...c].map((b) => a + b))).sort(), line: 'E = −2J[cos(πa/(n+1)) + cos(πb/(n+1))]' }; }
    case 'ssh': return { levels: null, line: `bands ±|J₁ + J₂e^{ik}| · gap 2|J₁ − J₂| = ${(2 * Math.abs(p.J1 - p.J2)).toFixed(3)} J` + (p.J1 < p.J2 ? ' · two edge states' : '') };
    case 'aa': return { levels: null, line: `self-dual λ = 2J · Lyapunov γ = ln(λ/2J) = ${g > 0 ? g.toFixed(4) + ' (localised, ξ = ' + (1 / g).toFixed(1) + ' sites)' : '0 (extended)'}` };
    case 'anderson': return { levels: null, line: `1-D: every state localised · ξ(0) ≈ 105 J²/W² = ${p.W > 0 ? (105 / p.W ** 2).toFixed(1) : '∞'} sites (Kappus–Wegner)` };
    case 'tunnel': { const kr = Math.acos(-p.V / 2), sk = 1 / (p.sig * Math.SQRT2); let a = 0, w = 0; for (let k = 5e-4; k < Math.PI; k += 1e-3) { const g = Math.exp(-(((k - p.k0) / sk) ** 2) / 2); a += g * tunnelT(k, p.V, p.nb); w += g; }
      return { levels: null, line: `T(k₀) = ${tunnelT(p.k0, p.V, p.nb).toFixed(4)} · the packet’s own ⟨T⟩ over its momenta (σ_k = ${sk.toFixed(3)}) ${(a / w).toFixed(4)}` + (p.nb !== 2 ? '' : p.V >= 2 ? ' · no resonance inside the band for V ≥ 2J' : ` · resonance cos k = −V/2J at k = ${kr.toFixed(3)} (T = 1)${Math.abs(p.k0 - kr) < sk ? ' · ON IT' : ''}`), sub: 'the prediction; T · R is the measurement' }; }
    case 'patch': return { levels: null, line: `a patch of ${AB.n} vertices, 8-fold · as computed: the first Bragg orbit |q| = π(1 + √2) = ${AB.peaks[0].q.toFixed(4)}, S = ${AB.peaks[0].S.toFixed(3)}`, sub: 'lab/ab-patch.json, from tools/lattice/ammann-beenker.mjs' };
    default: return { levels: null, line: 'the sheet: E(k) = ±J|1 + e^{ik·a₁} + e^{ik·a₂}| ∈ [−3J, 3J] — the flake’s levels, not the sheet’s' };
  }
}
