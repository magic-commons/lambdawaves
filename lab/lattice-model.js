/* lattice-model.js — LATTICE's model (0.7.2 L1), DOM-free: the tight-binding H on ≤ 256 sites from a preset and its knobs (H_ij = −t on a bond, the
 * Peierls phase e^{iΦ/N} on the AB ring), its eigensolve (real → eigSymQL, Hermitian → hermitianEigen), the exact evolution ψ(t) = C e^{−iEt} C†ψ₀
 * and the closed forms the window prints beside what it measures.  J = 1 is the energy unit and 1/J the time unit.  0.8.1 T3: HOFSTADTER (the Peierls phase
 * per bond), the QUANTUM WALK (a map: `walker`, no eigensolve) and the XX SPIN CHAIN (2^N basis states, `spinView` its ⟨σ_z⟩ and half-chain entropy). */
import { eigSymQL } from './linalg.js'; import { hermitianEigen } from './density.js'; import AB from './ab-patch.json' with { type: 'json' };   // L2: tools/lattice/ammann-beenker.mjs
export const PRESETS = [['chain', 'CHAIN', 'N'], ['ring', 'RING', 'N'], ['square', 'SQUARE', 'L'], ['ssh', 'SSH', 'N J1 J2'], ['anderson', 'ANDERSON', 'N L W seed d seeds'], ['aa', 'AUBRY–ANDRÉ', 'N lam phi'],
  ['ab', 'AB RING', 'N Phi'], ['graphene', 'GRAPHENE', 'rings'], ['benzene', 'HÜCKEL BENZENE', ''], ['tunnel', 'TUNNEL', 'N V nb'], ['patch', 'AB PATCH', ''],
  ['hofstadter', 'HOFSTADTER', 'L fp fq'], ['walk', 'QUANTUM WALK', 'N'], ['spin', 'SPIN CHAIN', 'ns']].map(([id, label, k]) => ({ id, label, knobs: k ? k.split(' ') : [] }));
export const DEFAULTS = { preset: 'chain', N: 64, L: 8, J1: 0.5, J2: 1, W: 2, seed: 1, lam: 1, phi: 0, Phi: 0, rings: 2, V: 1, nb: 1, fp: 1, fq: 3, ns: 8, d: 1, seeds: 1, state: 'packet', x0: 0.25, sig: 3, k0: 1.5708, idx: 0 }; export const BETA = (Math.sqrt(5) - 1) / 2;
/** the honeycomb flake of m rings of hexagons around one (6m² sites: benzene, coronene 24, circumcoronene 54, 96), bond length 1 */
function flake(m, xy, hop) {
  const at = new Map(), s3 = Math.sqrt(3);
  for (let q = 1 - m; q < m; q++) for (let r = 1 - m; r < m; r++) if (Math.abs(q + r) < m) for (let k = 0; k < 6; k++) {
    const a = Math.PI / 6 + k * Math.PI / 3, x = s3 * (q + r / 2) + Math.cos(a), y = 1.5 * r + Math.sin(a), K = Math.round(x * 1e4) + ',' + Math.round(y * 1e4);
    if (!at.has(K)) at.set(K, xy.push([x, y]) - 1); }
  bonds(xy, hop); }
const gcd = (a, b) => (b ? gcd(b, a % b) : a), bonds = (xy, hop) => { for (let i = 0; i < xy.length; i++) for (let j = 0; j < i; j++) if (Math.abs(Math.hypot(xy[i][0] - xy[j][0], xy[i][1] - xy[j][1]) - 1) < 1e-6) hop.push([j, i, 1]); };
/** build(p) → { n, re, im (null unless a flux), xy (sites in bond lengths), hop [[i, j, t]] } */
export function build(p) {
  const id = p.preset, xy = [], hop = [];
  if (id === 'graphene' || id === 'benzene') flake(id === 'benzene' ? 1 : p.rings, xy, hop);
  else if (id === 'patch') { for (const r of AB.xy) xy.push(r); bonds(xy, hop); }
  else if (id === 'hofstadter') { const L = Math.min(12, p.L), per = L > 2 && (p.fp * L) % p.fq === 0;   // a torus when Φ·L is whole; the y-bond from (x, y) carries e^{2πiΦx}
    for (let a = 0; a < L; a++) for (let b = 0; b < L; b++) { const i = xy.push([b, a]) - 1; if (b || per) hop.push([b ? i - 1 : i + L - 1, i, 1]); if (a || per) hop.push([a ? i - L : i + L * (L - 1), i, 1, 2 * Math.PI * p.fp / p.fq * b]); } }
  else if (id === 'spin') for (let i = 0; i < p.ns; i++) { xy.push([i, 0]); if (i) hop.push([i - 1, i, 1]); }   // the picture's N spins; H lives on their 2^N states
  else if (id === 'square' || (id === 'anderson' && p.d > 1)) { const L = id === 'square' ? p.L : Math.min(p.d > 2 ? 6 : 16, p.L), Z = id === 'square' || p.d < 3 ? 1 : L;   // it005 P4: ANDERSON's cube (L ≤ 6), its L layers side by side
    for (let c = 0; c < Z; c++) for (let a = 0; a < L; a++) for (let b = 0; b < L; b++) { const i = xy.push([b + c * (L + 1), a]) - 1; if (b) hop.push([i - 1, i, 1]); if (a) hop.push([i - L, i, 1]); if (c) hop.push([i - L * L, i, 1]); } }
  else { const N = id === 'walk' ? Math.min(128, p.N) : p.N, R = N / (2 * Math.PI), round = id === 'ring' || id === 'ab';
    for (let i = 0; i < N; i++) { const th = 2 * Math.PI * i / N + Math.PI / 2; xy.push(round ? [R * Math.cos(th), R * Math.sin(th)] : [i, 0]); if (i) hop.push([i - 1, i, id === 'ssh' ? (i % 2 ? p.J1 : p.J2) : 1]); }
    if (round) hop.push([N - 1, 0, 1]); }
  const n = id === 'spin' ? 1 << p.ns : xy.length, re = new Float64Array(n * n), im = id === 'ab' || id === 'hofstadter' ? new Float64Array(n * n) : null, th = id === 'ab' ? p.Phi / n : 0;
  if (id === 'spin') { for (let s = 0; s < n; s++) for (let i = 1; i < p.ns; i++) if (((s >> i) ^ (s >> (i - 1))) & 1) re[s * n + (s ^ (3 << (i - 1)))] = 1; }   // J(σ⁺σ⁻ + h.c.): an ↑↓ pair flips
  else for (const [i, j, t, th1 = th] of hop) { re[i * n + j] = re[j * n + i] = -t * Math.cos(th1); if (im) { im[j * n + i] = -t * Math.sin(th1); im[i * n + j] = t * Math.sin(th1); } }   // H_{j,i} = −t e^{iΦ/N} forward
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
/** THE QUANTUM WALK — a MAP, not a Hamiltonian: a step is the Hadamard coin, then the shift (↑ right, ↓ left), on a ring of N sites from (|↑⟩ + i|↓⟩)/√2 at the
 * centre.  at(t) → after ⌊t⌋ steps the site view: |ψ|² summed over the coin the height, the coin's balance (P↑ − P↓)/P the phase ×π/2 */
export function walker(N) {
  const u = new Float64Array(4 * N), w = new Float64Array(4 * N), re = new Float64Array(N), im = new Float64Array(N), h = Math.SQRT1_2; let k = -1;   // [↑re ↑im ↓re ↓im] a site
  return { at(t) { const m = Math.max(0, Math.floor(t)); if (k < 0 || m < k) { u.fill(0); u[4 * (N >> 1)] = u[4 * (N >> 1) + 3] = h; k = 0; }
    for (; k < m; k++) { w.fill(0); for (let x = 0, o = 0; x < N; x++, o += 4) for (let c = 0, r = 4 * ((x + 1) % N), l = 4 * ((x + N - 1) % N) + 2; c < 2; c++) { w[r + c] += h * (u[o + c] + u[o + 2 + c]); w[l + c] += h * (u[o + c] - u[o + 2 + c]); } u.set(w); }
    for (let x = 0, o = 0; x < N; x++, o += 4) { const a = u[o] ** 2 + u[o + 1] ** 2, b = u[o + 2] ** 2 + u[o + 3] ** 2, g = Math.PI / 2 * (a - b) / (a + b || 1); re[x] = Math.sqrt(a + b) * Math.cos(g); im[x] = Math.sqrt(a + b) * Math.sin(g); }
    return { re, im, steps: k }; } }; }
/** THE SPIN CHAIN's view of ψ on its 2^N states (bit i set = spin i ↑): ⟨σ_zᵢ⟩ (as re = sign·√|z|, so the bar is |z| and the hue its sign) and the half-chain entropy
 * S = −Tr ρ_A ln ρ_A of the first ⌊N/2⌋ spins, ρ_A = MM† (M[a][b] = ψ(a + b·2^{N_A})) solved as its real embedding [[Re, −Im], [Im, Re]], every level twice */
export function spinView({ re, im }, N) {
  const n = re.length, d = 1 << (N >> 1), D = 2 * d, z = new Float64Array(N), R = new Float64Array(D * D); let S = 0;
  for (let s = 0; s < n; s++) { const q = re[s] ** 2 + im[s] ** 2; for (let i = 0; i < N; i++) z[i] += (s >> i) & 1 ? q : -q; }
  for (let a = 0; a < d; a++) for (let c = 0; c < d; c++) { let x = 0, y = 0; for (let u = a, v = c; u < n; u += d, v += d) { x += re[u] * re[v] + im[u] * im[v]; y += im[u] * re[v] - re[u] * im[v]; } R[a * D + c] = R[(a + d) * D + c + d] = x; R[(a + d) * D + c] = y; R[a * D + c + d] = -y; }
  for (const l of eigSymQL(R, D).values) if (l > 1e-15) S -= l * Math.log(l) / 2;
  return { re: Float64Array.from(z, (v) => Math.sign(v) * Math.sqrt(Math.abs(v))), im: new Float64Array(N), z, S }; }
/** THE MOBILITY EDGE's two statistics (it005 P4): ⟨r⟩ = ⟨min(s_k, s_{k+1})/max(s_k, s_{k+1})⟩ over the middle third of the levels (Oganesyan–Huse: GOE 0.5307
 * extended, Poisson 0.3863 localised) and the band-centre eigenstate's (|E| least) IPR × N: 1 spread evenly, N on one site */
export function levelStats({ n, E, re }) { let r = 0, m = 0, c = 0, a = 0, b = 0;
  for (let k = (n / 3) | 0; k < ((2 * n / 3) | 0) - 1; k++) { const s1 = E[k + 1] - E[k], s2 = E[k + 2] - E[k + 1], M = Math.max(s1, s2); if (M > 1e-12) { r += Math.min(s1, s2) / M; m++; } }
  for (let k = 1; k < n; k++) if (Math.abs(E[k]) < Math.abs(E[c])) c = k; for (let i = 0; i < n; i++) { const q = re[i * n + c] ** 2; a += q; b += q * q; } return { r: m ? r / m : NaN, iprN: n * b / (a * a) }; }
/** the inverse participation ratio Σ|ψᵢ|⁴ / (Σ|ψᵢ|²)²: 1 on one site, 1/N spread evenly */
export function ipr({ re, im }) { let a = 0, b = 0; for (let i = 0; i < re.length; i++) { const q = re[i] * re[i] + im[i] * im[i]; a += q; b += q * q; } return b / (a * a); }
/** TUNNEL: T(k) = 4 sin²k / (4 sin²k + V²u²) through a barrier V on nb sites (u = 1; u = V + 2 cos k on two, T = 1 at cos k = −V/2), and the norm
 * split at the barrier: R left of its sites, T from them on, B on them — "passed" once B has stayed under 1e-4 for 2/J after the packet reached it */
export const tunnelT = (k, V, nb) => { const s = 4 * Math.sin(k) ** 2, u = nb === 2 ? V + 2 * Math.cos(k) : 1; return s / (s + V * V * u * u); };
export function split({ re, im }, p) { const c = re.length >> 1; let R = 0, T = 0, B = 0; for (let i = 0; i < re.length; i++) { const q = re[i] * re[i] + im[i] * im[i]; if (i <= c - p.nb) R += q; else T += q; if (i > c - p.nb && i <= c) B += q; } return { R, T, B }; }
/** closed(p) → { levels (the closed form's, ascending) | null, line }: what the window prints beside the measured levels */
export function closed(p, E) {
  const cs = (m, f) => Float64Array.from({ length: m }, (_, k) => -2 * Math.cos(f(k))).sort(), g = Math.log(p.lam / 2);
  switch (p.preset) {
    case 'chain': return { levels: cs(p.N, (k) => Math.PI * (k + 1) / (p.N + 1)), line: 'E_k = −2J cos(πk/(N+1))' };
    case 'ring': return { levels: cs(p.N, (k) => 2 * Math.PI * k / p.N), line: 'E_k = −2J cos(2πk/N)' };
    case 'ab': return { levels: cs(p.N, (k) => (2 * Math.PI * k + p.Phi) / p.N), line: 'E_k = −2J cos((2πk + Φ)/N)' };
    case 'benzene': return { levels: cs(6, (k) => Math.PI * k / 3), line: 'E = α + 2β cos(2πk/6): ±2β, ±β, ±β (β = −J)' };
    case 'square': { const c = cs(p.L, (k) => Math.PI * (k + 1) / (p.L + 1)); return { levels: Float64Array.from([...c].flatMap((a) => [...c].map((b) => a + b))).sort(), line: 'E = −2J[cos(πa/(n+1)) + cos(πb/(n+1))]' }; }
    case 'ssh': return { levels: null, line: `bands ±|J₁ + J₂e^{ik}| · gap 2|J₁ − J₂| = ${(2 * Math.abs(p.J1 - p.J2)).toFixed(3)} J` + (p.J1 < p.J2 ? ' · two edge states' : '') };
    case 'aa': return { levels: null, line: `self-dual λ = 2J · Lyapunov γ = ln(λ/2J) = ${g > 0 ? g.toFixed(4) + ' (localised, ξ = ' + (1 / g).toFixed(1) + ' sites)' : '0 (extended)'}` };
    case 'anderson': if (p.d > 2) return { levels: null, line: `3-D: the mobility edge W_c ≈ 16.5 J at the band centre (box disorder; Slevin–Ohtsuki) · W = ${p.W.toFixed(1)} J, ${p.W < 16.5 ? 'below: extended' : p.W > 16.5 ? 'above: localised' : 'at it'}`,
      sub: `finite: ${Math.min(6, p.L)}³ sites — the statistics drift toward the limits as L grows, the transition is the infinite lattice’s` };
      if (p.d > 1) return { levels: null, line: '2-D: every state localised, ξ exponentially large at weak disorder' }; return { levels: null, line: `1-D: every state localised · ξ(0) ≈ 105 J²/W² = ${p.W > 0 ? (105 / p.W ** 2).toFixed(1) : '∞'} sites (Kappus–Wegner)` };
    case 'tunnel': { const kr = Math.acos(-p.V / 2), sk = 1 / (p.sig * Math.SQRT2); let a = 0, w = 0; for (let k = 5e-4; k < Math.PI; k += 1e-3) { const g = Math.exp(-(((k - p.k0) / sk) ** 2) / 2); a += g * tunnelT(k, p.V, p.nb); w += g; }
      return { levels: null, line: `T(k₀) = ${tunnelT(p.k0, p.V, p.nb).toFixed(4)} · the packet’s own ⟨T⟩ over its momenta (σ_k = ${sk.toFixed(3)}) ${(a / w).toFixed(4)}` + (p.nb !== 2 ? '' : p.V >= 2 ? ' · no resonance inside the band for V ≥ 2J' : ` · resonance cos k = −V/2J at k = ${kr.toFixed(3)} (T = 1)${Math.abs(p.k0 - kr) < sk ? ' · ON IT' : ''}`), sub: 'the prediction; T · R is the measurement' }; }
    case 'patch': return { levels: null, line: `a patch of ${AB.n} vertices, 8-fold · as computed: the first Bragg orbit |q| = π(1 + √2) = ${AB.peaks[0].q.toFixed(4)}, S = ${AB.peaks[0].S.toFixed(3)}`, sub: 'lab/ab-patch.json, from tools/lattice/ammann-beenker.mjs' };
    case 'hofstadter': { const g = gcd(p.fp, p.fq), q = p.fq / g, L = Math.min(12, p.L), G = E ? [...E].slice(1).map((e, k) => [e - E[k], (e + E[k]) / 2]).sort((a, b) => b[0] - a[0]).slice(0, q - 2 + (q % 2)) : [];
      return { levels: null, line: `Φ = ${p.fp / g}/${q} · Harper: ${q} band${q > 1 ? 's' : ''}${q > 1 && q % 2 === 0 ? ' (the middle two touch)' : ''} · ${L > 2 && (p.fp * L) % p.fq === 0 ? 'torus' : 'open edges: q ∤ L'}`, sub: G.length ? 'measured, the largest gaps ' + G.map(([w, e]) => `${w.toFixed(3)} at E = ${e.toFixed(2)}`).join(' · ') : 'no open gap' }; }
    case 'walk': return { levels: null, line: 'a map: σ² → (1 − 1/√2) t² ≈ 0.2929 t², the fronts at ±t/√2 (Konno 2002) · a coin-tossing walker σ² = t', sub: 'no levels: the step’s quasi-energies sin ω = sin k/√2 are a band' };
    case 'spin': { const N = p.ns, A = N >> 1, e = Array.from({ length: N }, (_, k) => 2 * Math.cos(Math.PI * (k + 1) / (N + 1)));
      return { levels: Float64Array.from({ length: 1 << N }, (_, s) => e.reduce((a, x, k) => a + ((s >> k) & 1 ? x : 0), 0)).sort(), line: `Jordan–Wigner: E = Σ_occupied 2J cos(πk/(N+1)) · Page’s mean ${(A * Math.LN2 - 2 ** (2 * A - N - 1)).toFixed(3)} · the most ${A} ln 2 = ${(A * Math.LN2).toFixed(3)}` }; }
    default: return { levels: null, line: 'the sheet: E(k) = ±J|1 + e^{ik·a₁} + e^{ik·a₂}| ∈ [−3J, 3J] — the flake’s levels, not the sheet’s' };
  }
}
