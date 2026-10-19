/* equalizer.js — THE BEAT EQUALIZER's table (0.6.0 B1).  Pure, DOM-free.
 * Γ is a 6 × 6 complex Hermitian SHELL TABLE with unit diagonal (n ≤ 6: a populated n = 7 gates it, iteration 008 A7): the field kernel draws ρ′ = Σ_{nn′} Re Γ_{nn′} acc_n acc̄_{n′} + κ·inc,
 * acc_n = Σ_{a∈n} c_a e^{−iE_a t} ψ_a and inc = Σ_a |c_a ψ_a|².  Γ ⪰ 0 with κ = 0 is a density for every state (Schur); the three
 * splits (κ = −1, or BEATS ONLY) are signed by design.  FLAT with every gain 1 is no table at all: the locked kernel runs.
 * The gains decohere a shell from the others, never dim it: S = ssᵀ + diag(1 − s²), Γ = B∘S.
 */
import { BASIS } from './hydrogen.js';
export const EQ_PRESETS = [
  { id: 'flat', label: 'FLAT', note: 'the plain sum' }, { id: 'gauss', label: 'GAUSSIAN JITTER', note: 'a Gaussian spread of clocks' },
  { id: 'cauchy', label: 'CAUCHY JITTER', note: 'a Lorentzian spread of clocks' }, { id: 'box', label: 'BOX JITTER', note: 'a uniform spread of clocks' },
  { id: 'comb', label: 'COMB', note: 'two clocks 517.016 a.u. apart' }, { id: 'pulse', label: 'PHASE PULSE', note: 'shell n turned by nπ/2: still a pure state' },
  { id: 'beats', label: 'BEATS ONLY', note: 'the shells’ cross terms' }, { id: 'within', label: 'WITHIN-SHELL', note: 'interference inside each shell' },
  { id: 'interference', label: 'INTERFERENCE ONLY', note: 'every cross term, none of the incoherent sum' }];
const PHYSICAL = new Set(['flat', 'gauss', 'cauchy', 'box', 'comb', 'pulse']);
/* every jitter's width makes |g(1↔2)| = ½ at Z = 1, |ω₁₂| = 3/8: σ²ω²/2 = ln 2 · γ|ω| = ln 2 · sin x = x/2 with x = ωw/2 (Newton from 2) */
const W12 = 0.375, SIG = Math.sqrt(2 * Math.LN2) / W12, GAM = Math.LN2 / W12;
let x = 2; for (let k = 0; k < 8; k++) x -= (Math.sin(x) - x / 2) / (Math.cos(x) - 0.5);
const BOXW = 2 * x / W12, COMB = 517.016;
const g = { flat: () => [1, 0], gauss: (w) => [Math.exp(-SIG * SIG * w * w / 2), 0], cauchy: (w) => [Math.exp(-GAM * Math.abs(w)), 0],
  box: (w) => [w ? Math.sin(w * BOXW / 2) / (w * BOXW / 2) : 1, 0], comb: (w) => [(1 + Math.cos(w * COMB)) / 2, Math.sin(w * COMB) / 2] };
/** cyclic Jacobi on an N × N real symmetric M (overwritten): eigenvalues d and the eigenvector columns V */
function jacobi(M, N) {
  const V = new Float64Array(N * N); for (let i = 0; i < N; i++) V[i * N + i] = 1;
  for (let sweep = 0; sweep < 50; sweep++) {
    let off = 0; for (let p = 0; p < N; p++) for (let q = p + 1; q < N; q++) off += M[p * N + q] ** 2;
    if (off < 1e-32) break;
    for (let p = 0; p < N; p++) for (let q = p + 1; q < N; q++) {
      const a = M[p * N + q]; if (!a) continue;
      const th = (M[q * N + q] - M[p * N + p]) / (2 * a), t = (th < 0 ? -1 : 1) / (Math.abs(th) + Math.hypot(th, 1)), c = 1 / Math.hypot(t, 1), s = t * c;
      for (let k = 0; k < N; k++) { const u = M[k * N + p], v = M[k * N + q]; M[k * N + p] = c * u - s * v; M[k * N + q] = s * u + c * v; }
      for (let k = 0; k < N; k++) { const u = M[p * N + k], v = M[q * N + k]; M[p * N + k] = c * u - s * v; M[q * N + k] = s * u + c * v;
        const y = V[k * N + p], z = V[k * N + q]; V[k * N + p] = c * y - s * z; V[k * N + q] = s * y + c * z; }
    }
  }
  return { d: Array.from({ length: N }, (_, i) => M[i * N + i]), V };
}
/* Γ = A + iB as the 12 × 12 real symmetric [[A, −B], [B, A]]: each eigenvalue of Γ twice */
const embed = (G) => { const M = new Float64Array(144); for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const re = G[(i * 6 + j) * 2], im = G[(i * 6 + j) * 2 + 1];
  M[i * 12 + j] = M[(i + 6) * 12 + j + 6] = re; M[(i + 6) * 12 + j] = im; M[i * 12 + j + 6] = -im; } return M; };

/** THE COHERENCE MAP (0.8.2 P2): ρ_ab = c_a c̄_b / Σ|c|² over the twelve largest |c| (kept in their order), each off-diagonal × |Γ_{n_a n_b}| of the
 *  table T (spectrum.js keeps the one in force as eq.last) — the expectation of e^{−iω_ab δt} over the preset's spread of clocks, what the picture applies */
export function coherence(c, T = null) {
  const G = T && T.gamma, s = c.reduce((q, x) => q + x.re ** 2 + x.im ** 2, 0) || 1, keep = new Set([...c].sort((a, b) => b.re ** 2 + b.im ** 2 - a.re ** 2 - a.im ** 2).slice(0, 12)), L = c.filter((x) => keep.has(x));
  const f = (a, b) => { const k = ((a.n - 1) * 6 + b.n - 1) * 2; return G && a !== b && a.n ? Math.hypot(G[k], G[k + 1]) : 1; }, F = L.map((a) => L.map((b) => f(a, b)));
  return { L, F, cut: c.length - L.length, M: L.map((a, i) => L.map((b, j) => Math.hypot(a.re, a.im) * Math.hypot(b.re, b.im) / s * F[i][j])) };
}
export function createEqualizer() {
  const eq = { preset: 'flat', gains: new Float64Array(6).fill(1), last: null,
    setPreset(id) { if (EQ_PRESETS.some((p) => p.id === id)) eq.preset = id; },
    setGain(i, v) { if (i >= 0 && i < 6) eq.gains[i] = Math.min(1, Math.max(0, +v || 0)); },
    birth: () => eq.preset === 'flat' && eq.gains.every((s) => s === 1),
    serialize: () => (eq.birth() ? null : { preset: eq.preset, gains: [...eq.gains] }),
    restore(o) { eq.preset = 'flat'; eq.gains.fill(1); if (!o) return; eq.setPreset(o.preset); (o.gains || []).slice(0, 6).forEach((v, i) => eq.setGain(i, v)); },
    table({ Z = 1, rates = null, populated = [], pops = null } = {}) {
      if (eq.birth()) return null;
      const shell = new Map(), w = new Float64Array(6);                              // the labels gate: one rate per populated shell
      for (const a of populated) { const n = BASIS[a].n, r = rates ? rates[a] : 1;    // w: the shell populations, else equal over the populated shells
        if (n > 6) return { gate: 'the equalizer’s table is six shells: n = 7 is populated', gamma: null };   // iteration 008 A7: the kernel's six accumulators (field.js EQ_WGSL) — n = 7 stands it down, never folds into n = 6
        if (shell.has(n) && shell.get(n) !== r) return { gate: 'one rate per shell for the equalizer', gamma: null };
        shell.set(n, r); if (pops) w[n - 1] += pops[a]; else w[n - 1] = 1; }
      const E = (n) => -Z * Z / (2 * n * n), p = eq.preset, s = eq.gains, k = p === 'within' || p === 'interference' ? -1 : 0;
      let G = new Float64Array(72);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
        let [re, im] = p === 'pulse' ? [Math.cos((i - j) * Math.PI / 2), Math.sin((i - j) * Math.PI / 2)]   // u_n = e^{inπ/2}, B = uu†
          : p === 'beats' ? [+(i !== j), 0] : p === 'within' ? [+(i === j), 0] : (g[p] || g.flat)(E(i + 1) - E(j + 1));
        const S = i === j ? 1 : s[i] * s[j]; G[(i * 6 + j) * 2] = re * S; G[(i * 6 + j) * 2 + 1] = im * S;
      }
      let { d, V } = jacobi(embed(G), 12), big = Math.max(...d.map(Math.abs)), repaired = false;
      if (PHYSICAL.has(p) && Math.min(...d) < -1e-12 * big) {                       // project to the cone, then restore the unit diagonal
        const M = new Float64Array(144); for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) for (let q = 0; q < 12; q++) M[i * 12 + j] += V[i * 12 + q] * Math.max(d[q], 0) * V[j * 12 + q];
        for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const r = Math.sqrt(M[i * 13] * M[j * 13]) || 1; G[(i * 6 + j) * 2] = M[i * 12 + j] / r; G[(i * 6 + j) * 2 + 1] = M[(i + 6) * 12 + j] / r; }
        ({ d } = jacobi(embed(G), 12)); big = Math.max(...d.map(Math.abs)); repaired = true;
      }
      const lambda = d.sort((a, b) => a - b).filter((_, i) => i % 2 === 0), psd = lambda[0] >= -1e-12 * big;
      const unit = G.every((v, i) => i % 2 || Math.abs(Math.hypot(v, G[i + 1]) - 1) < 1e-9);
      const ws = w.reduce((a, b) => a + b, 0) || 1; let purity = 0;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) purity += (G[(i * 6 + j) * 2] ** 2 + G[(i * 6 + j) * 2 + 1] ** 2) * w[i] * w[j] / (ws * ws);
      return { gamma: Float32Array.from(G), kappa: k, mode: k || !psd ? 2 : unit ? 0 : 1, lambdaMin: lambda[0], lambda, purity, repaired, gate: '' };
    } };
  return eq;
}
