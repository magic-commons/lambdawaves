/* state.js — the 91-mode register: THE authoritative quantum state.
 *
 * STATUS: EXACT ANALYTIC (DIAGONAL MODE).  Field-free hydrogen has a diagonal H, so
 *   c_a(t) = e^{-iE_a t} c_a(0).
 * The register stores the anchor c(0) and evaluates c(t) in closed form; that is the same
 * law as c_a(t+Δt) = e^{-iE_aΔt}c_a(t) with no accumulated rounding and an exact scrub.
 *
 * POLICIES (documented, deterministic):
 *   • Edits happen AT the current logical time: set(a, value, t) re-anchors c_a(0) = e^{+iE_a t}·value.
 *   • Nothing is silently renormalized.  NORMALIZE is an explicit act.  Presets are stored normalized.
 *   • MUTE / SOLO are a reconstruction mask, not a state edit: c is untouched, the field is
 *     rebuilt from the unmuted set, and the meters report the rendered fraction of the norm.
 *   • The render set is capped (RENDER_CAP); when the populated set exceeds it the largest
 *     populations are rendered and the truncation is reported, never hidden.
 * Nothing in here knows about the DOM, the GPU or wall-clock time.
 */
import { BASIS, BASIS_INDEX, energy } from './hydrogen.js';

export const N = BASIS.length;          // 91
export const RENDER_CAP = 32;           // the WGSL kernel's mode-array capacity
export const EPS_POP = 1e-14;

export class Register {
  constructor() {
    this.re0 = new Float64Array(N);     // anchor c(0), real
    this.im0 = new Float64Array(N);     // anchor c(0), imag
    this.muted = new Uint8Array(N);
    this.solo = new Uint8Array(N);
    this.E = new Float64Array(N);
    for (const s of BASIS) this.E[s.index] = s.E;
    this.version = 0;                   // bumps on every state mutation (not on time)
    this.preset = null;                 // id of the last loaded preset, for provenance
  }

  /* ── time evaluation ─────────────────────────────────────────────────── */
  /** c(t) into the supplied arrays (or fresh ones) */
  at(t, re, im) {
    re = re || new Float64Array(N); im = im || new Float64Array(N);
    for (let a = 0; a < N; a++) {
      const r0 = this.re0[a], i0 = this.im0[a];
      if (r0 === 0 && i0 === 0) { re[a] = 0; im[a] = 0; continue; }
      const ph = -this.E[a] * t, c = Math.cos(ph), s = Math.sin(ph);
      re[a] = r0 * c - i0 * s;
      im[a] = r0 * s + i0 * c;
    }
    return { re, im };
  }
  /** one coefficient at time t */
  coeffAt(a, t) {
    const ph = -this.E[a] * t, c = Math.cos(ph), s = Math.sin(ph);
    return { re: this.re0[a] * c - this.im0[a] * s, im: this.re0[a] * s + this.im0[a] * c };
  }

  /* ── mutations (all bump version) ─────────────────────────────────────── */
  /** set c_a(t) = re + i·im at logical time t (re-anchors c_a(0)) */
  set(a, re, im, t = 0) {
    const ph = this.E[a] * t, c = Math.cos(ph), s = Math.sin(ph);   // e^{+iE t}
    this.re0[a] = re * c - im * s;
    this.im0[a] = re * s + im * c;
    this.version++;
  }
  setPolar(a, mag, phase, t = 0) { this.set(a, mag * Math.cos(phase), mag * Math.sin(phase), t); }
  clear() { this.re0.fill(0); this.im0.fill(0); this.muted.fill(0); this.solo.fill(0); this.preset = null; this.version++; }
  normalize() {
    const n = Math.sqrt(this.norm2());
    if (n > 0) { for (let a = 0; a < N; a++) { this.re0[a] /= n; this.im0[a] /= n; } }
    this.version++;
    return n;
  }
  setMute(a, on) { this.muted[a] = on ? 1 : 0; this.version++; }
  setSolo(a, on) { this.solo[a] = on ? 1 : 0; this.version++; }
  /**
   * STATE ROTATE about z by angle α (exact): c_{nlm} → e^{-imα} c_{nlm}.
   * This is D(R_z(α)) on the state — a physical operation, NOT a camera move.
   */
  rotateZ(alpha) {
    for (const s of BASIS) {
      if (s.m === 0) continue;
      const a = s.index, ph = -s.m * alpha, c = Math.cos(ph), sn = Math.sin(ph);
      const r0 = this.re0[a], i0 = this.im0[a];
      this.re0[a] = r0 * c - i0 * sn;
      this.im0[a] = r0 * sn + i0 * c;
    }
    this.version++;
  }
  /** load a preset: coefficients at t = 0, normalized as stored */
  load(preset) {
    this.clear();
    for (const m of preset.modes) {
      const a = BASIS_INDEX.get(`h:${m.n}:${m.l}:${m.m}`);
      if (a === undefined) throw new Error('preset mode outside the n ≤ 6 register: ' + JSON.stringify(m));
      const ph = m.phase || 0;
      this.re0[a] += m.amp * Math.cos(ph);
      this.im0[a] += m.amp * Math.sin(ph);
    }
    if (preset.normalize !== false) this.normalize();
    this.preset = preset.id;
    this.version++;
  }

  /* ── observables (all from the full authoritative state) ──────────────── */
  norm2() { let s = 0; for (let a = 0; a < N; a++) s += this.re0[a] ** 2 + this.im0[a] ** 2; return s; }
  norm() { return Math.sqrt(this.norm2()); }
  population(a) { return this.re0[a] ** 2 + this.im0[a] ** 2; }
  /** ⟨H⟩ = c†Hc (diagonal H) — divided by the norm² so an unnormalized edit still reads as an energy */
  energy() {
    let e = 0, n = 0;
    for (let a = 0; a < N; a++) { const p = this.re0[a] ** 2 + this.im0[a] ** 2; e += p * this.E[a]; n += p; }
    return n > 0 ? e / n : 0;
  }
  /** A(t) = ⟨ψ(0)|ψ(t)⟩ = Σ |c_a|² e^{-iE_a t}  (per unit norm) → { re, im, abs } */
  autocorrelation(t) {
    let r = 0, i = 0, n = 0;
    for (let a = 0; a < N; a++) {
      const p = this.re0[a] ** 2 + this.im0[a] ** 2;
      if (p === 0) continue;
      n += p; const ph = -this.E[a] * t;
      r += p * Math.cos(ph); i += p * Math.sin(ph);
    }
    if (n > 0) { r /= n; i /= n; }
    return { re: r, im: i, abs: Math.hypot(r, i) };
  }
  /** indices with non-negligible population, in register order */
  populated() {
    const out = [];
    for (let a = 0; a < N; a++) if (this.re0[a] ** 2 + this.im0[a] ** 2 > EPS_POP) out.push(a);
    return out;
  }
  nmax() { let n = 1; for (const a of this.populated()) n = Math.max(n, BASIS[a].n); return n; }
  /**
   * The set the field is reconstructed from: populated, unmuted (solo wins), sorted by
   * population, capped.  Reports what was left out so the UI can say so.
   */
  renderSet(cap = RENDER_CAP) {
    const pop = this.populated();
    const anySolo = pop.some((a) => this.solo[a]);
    const eligible = pop.filter((a) => anySolo ? this.solo[a] : !this.muted[a]);
    eligible.sort((x, y) => this.population(y) - this.population(x));
    const ids = eligible.slice(0, cap);
    const total = this.norm2();
    let covered = 0; for (const a of ids) covered += this.population(a);
    return {
      ids, populated: pop.length, rendered: ids.length, masked: pop.length - eligible.length,
      truncated: eligible.length - ids.length, coveredFraction: total > 0 ? covered / total : 0
    };
  }
  /** a stable digest of the authoritative state (anchor, mask) — time is not part of it */
  digest() {
    let h = 2166136261 >>> 0;
    const mix = (v) => { const s = v.toPrecision(15); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } };
    for (let a = 0; a < N; a++) { if (this.re0[a] || this.im0[a]) { mix(a); mix(this.re0[a]); mix(this.im0[a]); } mix(this.muted[a] * 2 + this.solo[a]); }
    return h.toString(16).padStart(8, '0');
  }
  /* ── persistence ───────────────────────────────────────────────────────── */
  serialize(t = 0) {
    const modes = [];
    for (let a = 0; a < N; a++) if (this.re0[a] || this.im0[a] || this.muted[a] || this.solo[a]) {
      const s = BASIS[a];
      modes.push({ id: s.id, n: s.n, l: s.l, m: s.m, re: this.re0[a], im: this.im0[a], muted: !!this.muted[a], solo: !!this.solo[a] });
    }
    return { format: 'lambdawaves/qwave-0/state', system: 'hydrogen', basis: 'n<=6 complex Y_lm, Condon-Shortley', units: 'atomic', t, preset: this.preset, modes, status: 'EXACT ANALYTIC' };
  }
  restore(obj) {
    this.clear();
    for (const m of obj.modes || []) {
      const a = BASIS_INDEX.get(m.id || `h:${m.n}:${m.l}:${m.m}`);
      if (a === undefined) continue;
      this.re0[a] = +m.re || 0; this.im0[a] = +m.im || 0;
      this.muted[a] = m.muted ? 1 : 0; this.solo[a] = m.solo ? 1 : 0;
    }
    this.preset = obj.preset || null;
    this.version++;
    return +obj.t || 0;
  }
}

/* ── presets (§18): exact coefficients, basis convention as above, visual defaults kept apart ── */
const E = energy;
export const T_BEAT_12 = 2 * Math.PI / (E(2) - E(1));   // 16.755… a.u. — the 1s/2s (and 1s/2p) beat
function gauss(nbar, sigma, ns) { return ns.map((n) => ({ n, w: Math.exp(-((n - nbar) ** 2) / (4 * sigma * sigma)) })); }

export const PRESETS = [
  { id: '1s', label: '1s', note: 'ground state · stationary density', status: 'EXACT ANALYTIC',
    modes: [{ n: 1, l: 0, m: 0, amp: 1 }], visual: { rate: 4, window: 2 * Math.PI / 0.5, view: 'density' } },
  { id: '2pz', label: '2p_z', note: 'stationary · one nodal plane', status: 'EXACT ANALYTIC',
    modes: [{ n: 2, l: 1, m: 0, amp: 1 }], visual: { rate: 4, window: 2 * Math.PI / 0.125, view: 'real' } },
  { id: '1s+2s', label: '1s + 2s  beat', note: 'radial breathing · T = 2π/(E₂−E₁) = 16.755 a.u.', status: 'EXACT ANALYTIC',
    modes: [{ n: 1, l: 0, m: 0, amp: 1 }, { n: 2, l: 0, m: 0, amp: 1 }], visual: { rate: 4, window: T_BEAT_12, view: 'density' } },
  { id: '1s+2pz', label: '1s + 2p_z  dipole', note: 'the dipole beat: density sloshes along z at T = 16.755 a.u.', status: 'EXACT ANALYTIC',
    modes: [{ n: 1, l: 0, m: 0, amp: 1 }, { n: 2, l: 1, m: 0, amp: 1 }], visual: { rate: 4, window: T_BEAT_12, view: 'density' } },
  { id: '2p+', label: '2p₊ = (2p_x + i·2p_y)/√2', note: 'circular current · stationary torus, the current lives in arg ψ = φ', status: 'EXACT ANALYTIC',
    modes: [{ n: 2, l: 1, m: 1, amp: 1 }], visual: { rate: 4, window: 2 * Math.PI / 0.125, view: 'phase' } },
  { id: '2s+2pz', label: '2s + 2p_z  (degenerate)', note: 'same energy → no motion: an sp hybrid is stationary', status: 'EXACT ANALYTIC',
    modes: [{ n: 2, l: 0, m: 0, amp: 1 }, { n: 2, l: 1, m: 0, amp: 1 }], visual: { rate: 4, window: 2 * Math.PI / 0.125, view: 'density' } },
  { id: '3dz2', label: '3d_z²', note: 'stationary · two conical nodes', status: 'EXACT ANALYTIC',
    modes: [{ n: 3, l: 2, m: 0, amp: 1 }], visual: { rate: 4, window: 2 * Math.PI / (1 / 18), view: 'real' } },
  { id: 'rydberg', label: 'Rydberg packet n = 4…6', note: 'circular states |n,n−1,n−1⟩, Gaussian in n about n̄ = 5 · orbits in xy, T_cl = 2π n̄³ ≈ 785 a.u.', status: 'EXACT ANALYTIC',
    modes: gauss(5, 1, [4, 5, 6]).map(({ n, w }) => ({ n, l: n - 1, m: n - 1, amp: w })),
    visual: { rate: 160, window: 2 * Math.PI * 125, view: 'density' } },
  { id: 'shadow-pair', label: '1s + 2s + 3s  (shadow trio)', note: 'three uncoupled oscillators at ω = ½, ⅛, 1⁄18 — watch SHADOW', status: 'EXACT ANALYTIC',
    modes: [{ n: 1, l: 0, m: 0, amp: 1 }, { n: 2, l: 0, m: 0, amp: 1 }, { n: 3, l: 0, m: 0, amp: 1 }], visual: { rate: 4, window: 2 * Math.PI / (1 / 18 - 0) * 1, view: 'density' } },
];
export const PRESET_BY_ID = new Map(PRESETS.map((p) => [p.id, p]));
