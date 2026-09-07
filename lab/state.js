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
 *   • THE PROPAGATOR HOOK (W-STURMIAN): setPropagator(P) swaps the diagonal law for c(t) = P.evolve(c(0), t) in a
 *     non-orthogonal basis (the norm is ⟨c|S|c⟩, the normal modes P's eigenvectors, edits still happen AT time t);
 *     setPropagator(null) restores the diagonal law — every line above is then the code path, unchanged.
 * Nothing in here knows about the DOM, the GPU or wall-clock time.
 */
import { BASIS, BASIS_INDEX, energy, stateOf } from './hydrogen.js';
import { applyRotateK, applyDefectWait, applyRotor, kzElement, symEig } from './frontier.js';
import { applyKick, applyKickAlong } from './kick.js';

/* ── static external fields ────────────────────────────────────────────────
 * ZEEMAN  H = H₀ + (B/2)L_z  is still DIAGONAL: E_a → E_a + B·m_a/2.  Exact, no approximation, no caveat
 *   (orbital only — this register has no spin, so there is no anomalous term and no fine structure).
 * STARK   H = H₀ + F·z  is not diagonal.  Within one shell it is exactly solvable, because on the shell
 *   z = −(3n/2)K_z, so the (n, m) block is E_n + (B m/2) + F·Z with Z the tridiagonal matrix of z; its
 *   eigenvectors are the parabolic (Stark) states and are FIELD-INDEPENDENT, so they are computed once and the
 *   eigenvalues just scale with F.  What is neglected is coupling between shells, which is valid while
 *   F ≪ ΔE/⟨z⟩ ≈ 1/(3n⁵); the badge says so and `field.validUpTo` prints the number.
 */
const ZBLOCK = new Map();
function starkBlock(n, m) {
  const key = n + ':' + m;
  if (ZBLOCK.has(key)) return ZBLOCK.get(key);
  const ls = []; for (let l = Math.abs(m); l < n; l++) ls.push(l);
  const B = ls.length, Z = new Float64Array(B * B);
  for (let i = 0; i + 1 < B; i++) {
    const v = -1.5 * n * kzElement(n, ls[i], m);       // ⟨n l+1 m|z|n l m⟩ = −(3n/2)·K_z element
    Z[i * B + i + 1] = v; Z[(i + 1) * B + i] = v;
  }
  const { values, vectors } = symEig(Z, B);
  const out = { B, idx: ls.map((l) => stateOf(n, l, m).index), V: vectors, lam: values };
  ZBLOCK.set(key, out);
  return out;
}
/** every (n, m) block of the register, with its Stark eigenvectors and eigenvalues (cached, field-independent) */
function allBlocks() {
  if (allBlocks._c) return allBlocks._c;
  const out = [];
  for (let n = 1; n <= 6; n++) for (let m = -(n - 1); m <= n - 1; m++) out.push({ n, m, ...starkBlock(n, m) });
  allBlocks._c = out;
  return out;
}

export const N = BASIS.length;          // 91
export const RENDER_CAP = 91;           // the WGSL kernel's mode-array capacity
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
    this.field = { Bz: 0, Fz: 0 };      // magnetic (exact) and electric (exact within each shell)
    this.damping = 0;                   // the DRAG toy (see setDamping): 0 = off = the exact unitary register
    this.P = null;                      // the PROPAGATOR (W-STURMIAN, see setPropagator): null = the diagonal law above
    /* scratch for the per-frame observables (wave 45): energy(), autocorrelation() and normalAmplitudes() used to
       allocate two Float64Array(91) and four arrays per call, several times a frame — the meters, the badges and the
       SHADOW readout — so the frame loop was a steady allocator.  They read c(t) into these instead. */
    this._sr = new Float64Array(N); this._si = new Float64Array(N);
    this._na = { E: [], re: [], im: [], label: [] };
  }

  /* ── the Hamiltonian in force ────────────────────────────────────────── */
  /** E_a + B m_a / 2 — the diagonal part, exact whatever the electric field is */
  Ediag(a) { return (this.P ? this.P.H[a * N + a] / this.P.S[a * N + a] : this.E[a]) + this.field.Bz * BASIS[a].m / 2; }   // under a PROPAGATOR: the label's ⟨a|H|a⟩/⟨a|S|a⟩, NOT an eigenvalue
  /** the HAMILTONIAN switch: refill the eigenvalues the 91 labels carry (hydrogen −1/2n², oscillator N + 3/2, …) */
  setEnergies(fn) { for (const s of BASIS) this.E[s.index] = fn(s.index); this.version++; }
  /** the largest electric field for which neglecting inter-shell coupling is defensible: ≈ 1/(3n⁵) */
  fieldValidUpTo() { const n = this.nmax(); return 1 / (3 * Math.pow(Math.max(1, n), 5)); }
  setField(f) {
    if (f.Bz !== undefined) this.field.Bz = f.Bz;
    if (f.Fz !== undefined) this.field.Fz = this.P ? 0 : f.Fz;   // the Stark field is a theorem about hydrogen's shells: refused under a PROPAGATOR
    this.version++;
  }
  /**
   * THE PROPAGATOR HOOK (W-STURMIAN).  P = null restores the diagonal law.  Otherwise P is an object over the 91 labels
   * with evolve(c, t) = C e^{−iEt} CᵀS c, norm(c) = ⟨c|S|c⟩, populations(c), eigenstate(k), E, C, CtS, rank, H, S and
   * mK (the m of eigenvector k): at(t) becomes P.evolve(anchor, t); edits still happen AT the current logical time
   * (set / anchorFrom re-anchor by P.evolve(·, −t)); the norm is the S-norm; the normal modes are P's eigenvectors;
   * the Zeeman term — diagonal in the labels, commuting with a block-diagonal P — is the per-label phase e^{−iBm t/2}
   * applied after evolve, exactly; the Stark field is refused (it is a theorem about hydrogen's shells).  Nothing here
   * is Sturmian-specific: any propagator in a non-orthogonal basis with that interface plugs in.
   */
  setPropagator(P) { this.P = P || null; if (this.P) this.field.Fz = 0; this.version++; }
  /**
   * The normal modes of the Hamiltonian in force, with the state's amplitude in each, at time t.
   * With no electric field these ARE the register's modes; with one they are the Stark (parabolic) states —
   * which is why the action–angle chart in DYNAMICS switches to them automatically.
   */
  normalAmplitudes(t = 0, scratch = false) {
    const out = scratch ? this._na : { E: [], re: [], im: [], label: [] };
    if (scratch) { out.E.length = 0; out.re.length = 0; out.im.length = 0; out.label.length = 0; }
    if (this.P) {                                       // a PROPAGATOR: its S-orthonormal eigenvectors are the normal modes, d = CᵀS c(t)
      const P = this.P, M = P.rank, c = this.at(t, this._sr, this._si);
      for (let k = 0; k < M; k++) {
        let r = 0, i = 0;
        for (let a = 0; a < N; a++) { const w = P.CtS[k * N + a]; if (w === 0) continue; r += w * c.re[a]; i += w * c.im[a]; }
        if (r === 0 && i === 0) continue;
        out.E.push(P.E[k] + this.field.Bz * (P.mK ? P.mK[k] : 0) / 2); out.re.push(r); out.im.push(i); out.label.push('ε' + k);
      }
      return out;
    }
    if (this.field.Fz === 0) {
      const c = this.at(t, this._sr, this._si);
      for (let a = 0; a < N; a++) if (this.re0[a] || this.im0[a]) { out.E.push(this.Ediag(a)); out.re.push(c.re[a]); out.im.push(c.im[a]); out.label.push(BASIS[a].label); }
      return out;
    }
    const c = this.at(t, this._sr, this._si);
    for (const b of allBlocks()) {
      let any = false; for (const a of b.idx) if (this.re0[a] || this.im0[a]) { any = true; break; }
      if (!any) continue;
      for (let k = 0; k < b.B; k++) {
        let r = 0, i = 0;
        for (let j = 0; j < b.B; j++) { const v = b.V[j * b.B + k]; r += v * c.re[b.idx[j]]; i += v * c.im[b.idx[j]]; }
        if (r === 0 && i === 0) continue;
        out.E.push(this.E[b.idx[0]] + this.field.Bz * b.m / 2 + this.field.Fz * b.lam[k]);
        out.re.push(r); out.im.push(i);
        out.label.push(`n${b.n} m${b.m} k${k}`);
      }
    }
    return out;
  }
  /** propagate a coefficient vector by e^{∓iHt} (dir = −1 forward, +1 back to the anchor) */
  _propagate(reIn, imIn, t, dir, reOut, imOut) {
    reOut = reOut || new Float64Array(N); imOut = imOut || new Float64Array(N);
    if (this.P) return this._propagateP(reIn, imIn, t, dir, reOut, imOut);
    if (this.field.Fz === 0) {
      for (let a = 0; a < N; a++) {
        const r0 = reIn[a], i0 = imIn[a];
        if (r0 === 0 && i0 === 0) { reOut[a] = 0; imOut[a] = 0; continue; }
        const ph = dir * this.Ediag(a) * t, c = Math.cos(ph), s = Math.sin(ph);
        const g = (this.damping > 0 && dir < 0 && t > 0) ? Math.exp(-this.damping * Math.max(0, this.Ediag(a) - this.E[0]) * t) : 1;   // never amplify (Round 11 B6)   // the DRAG toy, forward only
        reOut[a] = g * (r0 * c - i0 * s); imOut[a] = g * (r0 * s + i0 * c);
      }
      return { re: reOut, im: imOut };
    }
    reOut.fill(0); imOut.fill(0);
    for (const b of allBlocks()) {
      let any = false; for (const a of b.idx) if (reIn[a] || imIn[a]) { any = true; break; }
      if (!any) continue;
      const E0 = this.E[b.idx[0]] + this.field.Bz * b.m / 2;
      for (let k = 0; k < b.B; k++) {
        let r = 0, i = 0;
        for (let j = 0; j < b.B; j++) { const v = b.V[j * b.B + k]; r += v * reIn[b.idx[j]]; i += v * imIn[b.idx[j]]; }
        if (r === 0 && i === 0) continue;
        const Ek = E0 + this.field.Fz * b.lam[k], ph = dir * Ek * t, c = Math.cos(ph), s = Math.sin(ph);
        const g = (this.damping > 0 && dir < 0 && t > 0) ? Math.exp(-this.damping * Math.max(0, Ek - this.E[0]) * t) : 1;   // the toy acts under Stark too (Round 11 A3)
        const yr = g * (r * c - i * s), yi = g * (r * s + i * c);
        for (let j = 0; j < b.B; j++) { const v = b.V[j * b.B + k]; reOut[b.idx[j]] += v * yr; imOut[b.idx[j]] += v * yi; }
      }
    }
    return { re: reOut, im: imOut };
  }

  /** the PROPAGATOR's law, forward (dir = −1) or back to the anchor (dir = +1): P.evolve, then the Zeeman phase per label;
   *  the DRAG toy acts in P's eigenbasis, forward only, never amplifying — the same toy as the diagonal one */
  _propagateP(reIn, imIn, t, dir, reOut, imOut) {
    const P = this.P;
    if (this.damping > 0 && dir < 0 && t > 0) {
      const M = P.rank, dre = new Float64Array(M), dim = new Float64Array(M), E0 = P.E[0];
      for (let k = 0; k < M; k++) {
        let r = 0, i = 0;
        for (let a = 0; a < N; a++) { const w = P.CtS[k * N + a]; if (w === 0) continue; r += w * reIn[a]; i += w * imIn[a]; }
        const ph = -P.E[k] * t, c = Math.cos(ph), s = Math.sin(ph), g = Math.exp(-this.damping * Math.max(0, P.E[k] - E0) * t);
        dre[k] = g * (r * c - i * s); dim[k] = g * (r * s + i * c);
      }
      reOut.fill(0); imOut.fill(0);
      for (let a = 0; a < N; a++) { let sr = 0, si = 0; for (let k = 0; k < M; k++) { const w = P.C[a * M + k]; if (w === 0) continue; sr += w * dre[k]; si += w * dim[k]; } reOut[a] = sr; imOut[a] = si; }
    } else {
      const r = P.evolve({ re: reIn, im: imIn }, dir < 0 ? t : -t);
      reOut.set(r.re); imOut.set(r.im);
    }
    if (this.field.Bz !== 0) for (let a = 0; a < N; a++) {
      const r0 = reOut[a], i0 = imOut[a]; if (r0 === 0 && i0 === 0) continue;
      const ph = dir * this.field.Bz * BASIS[a].m / 2 * t, c = Math.cos(ph), s = Math.sin(ph);
      reOut[a] = r0 * c - i0 * s; imOut[a] = r0 * s + i0 * c;
    }
    return { re: reOut, im: imOut };
  }

  /* ── time evaluation ─────────────────────────────────────────────────── */
  /** c(t) into the supplied arrays (or fresh ones) */
  at(t, re, im) {
    if (this.mix) {                                   // A ↔ B TRANSITION: the played state is the Rabi mix of two exact evolutions
      const m = this.mix, A = this._propagate(m.reA, m.imA, t, -1, m._ra, m._ia), B = this._propagate(m.reB, m.imB, t, -1, m._rb, m._ib);
      const th = this.mixAngle(t), c = Math.cos(th), s = Math.sin(th);
      re = re || new Float64Array(N); im = im || new Float64Array(N);
      for (let a = 0; a < N; a++) { re[a] = c * A.re[a] + s * B.re[a]; im[a] = c * A.im[a] + s * B.im[a]; }
      return { re, im };
    }
    return this._propagate(this.re0, this.im0, t, -1, re || new Float64Array(N), im || new Float64Array(N));
  }
  /* ── A ↔ B TRANSITION (Rabi) ────────────────────────────────────────────
   * c(t) = cos(Ω(t−t₀)/2)·A(t) + sin(Ω(t−t₀)/2)·B(t), with A(t), B(t) the EXACT evolutions of two stored anchors.
   * For two eigenstates under a resonant drive this is the exact two-level Rabi solution in the rotating-wave
   * approximation; the density then breathes at E_B − E_A — the radiating dipole of a transition.  With composite A or
   * B the same envelope is a TOY, and the instrument labels it so.  While a transition plays, edits act on the stored
   * anchors (re0/im0 hold the union so the listing shows both); clearing it freezes the mix as the new state. */
  setTransition(A, B, omega, t0) {
    this.mix = { reA: Float64Array.from(A.re), imA: Float64Array.from(A.im), reB: Float64Array.from(B.re), imB: Float64Array.from(B.im), omega, t0,
      _ra: new Float64Array(N), _ia: new Float64Array(N), _rb: new Float64Array(N), _ib: new Float64Array(N) };
    for (let a = 0; a < N; a++) { this.re0[a] = A.re[a] + B.re[a]; this.im0[a] = A.im[a] + B.im[a]; }
    this.version++;
  }
  clearTransition(t) { if (!this.mix) return; const c = this.at(t); this.mix = null; this.anchorFrom(c.re, c.im, t); }
  get transition() { return this.mix; }
  mixAngle(t) { return this.mix ? this.mix.omega * (t - this.mix.t0) / 2 : 0; }
  /** one coefficient at time t */
  coeffAt(a, t) {
    if (this.mix) { const c = this.at(t); return { re: c.re[a], im: c.im[a] }; }
    if (this.field.Fz === 0 && !this.P) {
      const ph = -this.Ediag(a) * t, c = Math.cos(ph), s = Math.sin(ph);
      return { re: this.re0[a] * c - this.im0[a] * s, im: this.re0[a] * s + this.im0[a] * c };
    }
    const c = this.at(t);
    return { re: c.re[a], im: c.im[a] };
  }
  /** land a vector computed off the thread as the state AT time t — exactly the road _op takes for a non-commuting
      operator (wave 45, the bow): at t = 0 it IS the anchor; otherwise it is carried back to t = 0 */
  setAnchorAt(re, im, t) {
    if (!t) { this.re0.set(re); this.im0.set(im); this.version++; return; }
    this.anchorFrom(re, im, t);
  }
  /** re-anchor from a whole coefficient vector given at time t (the general form of an edit-at-time) */
  anchorFrom(re, im, t) {
    const a = this._propagate(re, im, t, +1);
    this.re0.set(a.re); this.im0.set(a.im);
    this.version++;
  }

  /* ── mutations (all bump version) ─────────────────────────────────────── */
  /** set c_a(t) = re + i·im at logical time t (re-anchors c_a(0)) */
  set(a, re, im, t = 0) {
    if (this.field.Fz !== 0 || this.P) {             // H mixes l (or the labels are not eigenstates): set the component AT time t, then re-anchor
      const c = this.at(t); c.re[a] = re; c.im[a] = im;
      this.anchorFrom(c.re, c.im, t);
      return;
    }
    const ph = this.Ediag(a) * t, c = Math.cos(ph), s = Math.sin(ph);   // e^{+iE t}
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
  /**
   * STARK ROTATE: e^{-iθ K_z} on the state, K the Runge–Lenz vector scaled to the shell (K_z = -(2/3n) z on the shell).
   * An SO(4) rotation that mixes l at fixed (n, m): the Schmidt spectrum of every shell is invariant (print, Theorem B.1).
   * Exact (eigendecomposition of the tridiagonal K_z blocks); commutes with H, so it acts on the anchor at any time.
   */
  rotateK(theta) { applyRotateK(this.re0, this.im0, theta); this.version++; }
  /**
   * DEFECT WAIT: e^{iα L²}, c_nlm → e^{iα l(l+1)} c_nlm — a wait under an l-dependent phase (a quantum defect, which
   * hydrogen's degeneracy switches off).  Unitary, in-shell, NOT an SO(4) element: it changes the orbit invariants
   * (print, Theorem B.3), and with the rotors it is a universal gate set on the shell.
   */
  defectWait(alpha, t = 0) { this._op((re, im) => applyDefectWait(re, im, alpha), t); }
  /**
   * ROTOR DRIVE: the full SO(4) = (SU(2)₊ × SU(2)₋)/Z₂ on every populated shell, exactly (Theorem B.7).
   *   which 'both' → the ordinary spatial rotation D^l(R) about the axis — the general Wigner rotation
   *   which 'K'    → e^{−iθK_axis}, the Stark rotation about any axis (z reproduces rotateK)
   *   which '+'/'−' → one rotor alone: an SO(4) element that is NOT a spatial rotation. All keep the Schmidt spectrum.
   */
  rotor({ which = 'both', axis = 'z', angle = 0, t = 0 }) { this._op((re, im) => applyRotor(re, im, { which, axis, angle }), t); }
  /**
   * SLAP: a sudden momentum impulse k along an axis — ψ ↦ e^{ik·x}ψ, the impulsive Stark limit (Δp = −∫E dt).  Exact
   * as an operator; the register keeps only its n ≤ 6 image, so the norm DROPS by the probability the electron was
   * knocked out of the first six shells or ionised.  That loss is physics and is never renormalised away here.
   */
  kick(k, axis = 'z', t = 0) { this._op((re, im) => applyKick(re, im, k, axis), t, false); }
  /** the same slap along any unit direction (the BOW) */
  kickAlong(k, d, t = 0) { this._op((re, im) => applyKickAlong(re, im, k, d), t, false); }
  /** the DRAG toy: γ ≥ 0; NON-UNITARY, not physics — excited amplitudes decay as e^{−γ(E_a−E_0)t}, forward in time only, under no electric field */
  setDamping(g) { this.damping = Math.max(0, g || 0); this.version++; }
  /**
   * Apply a unitary to the state AT the current logical time.  With no electric field every operator here commutes
   * with H (L_z, K_z and L² all do), so acting on the anchor is the same thing and we take the fast path; with a
   * Stark field L² does NOT commute, so the operator is applied at time t and the state re-anchored — which is the
   * register's documented policy ("edits happen at the current logical time") made to hold in general.
   */
  _op(fn, t = 0, commutes = true) {
    if ((commutes && this.field.Fz === 0 && !this.P) || !t) { fn(this.re0, this.im0); this.version++; return; }   // a slap does NOT commute with H: it must act at time t
    const c = this.at(t); fn(c.re, c.im); this.anchorFrom(c.re, c.im, t);
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
  norm2() { if (this.P) return this.P.norm({ re: this.re0, im: this.im0 }); let s = 0; for (let a = 0; a < N; a++) s += this.re0[a] ** 2 + this.im0[a] ** 2; return s; }   // under a PROPAGATOR: ⟨c|S|c⟩ (conserved, so the anchor's)
  norm() { return Math.sqrt(this.norm2()); }
  population(a) { return this.re0[a] ** 2 + this.im0[a] ** 2; }
  /** ⟨H⟩ = c†Hc (diagonal H) — divided by the norm² so an unnormalized edit still reads as an energy */
  energy() {
    const na = this.normalAmplitudes(0, true);
    let e = 0, n = 0;
    for (let k = 0; k < na.E.length; k++) { const p = na.re[k] ** 2 + na.im[k] ** 2; e += p * na.E[k]; n += p; }
    return n > 0 ? e / n : 0;
  }
  /** A(t) = ⟨ψ(0)|ψ(t)⟩ = Σ |c_a|² e^{-iE_a t}  (per unit norm) → { re, im, abs } */
  autocorrelation(t) {
    const na = this.normalAmplitudes(0, true);
    let r = 0, i = 0, n = 0;
    for (let k = 0; k < na.E.length; k++) {
      const p = na.re[k] ** 2 + na.im[k] ** 2;
      if (p === 0) continue;
      n += p; const ph = -na.E[k] * t;
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
  /** the largest populated n; with minFrac > 0, only states carrying at least that fraction of the norm count (so a slap's 1e-4 tails do not blow the box up to the n = 6 scale) */
  nmax(minFrac = 0) { const n2 = this.norm2(); let n = 1; for (const a of this.populated()) if (minFrac === 0 || this.population(a) >= minFrac * n2) n = Math.max(n, BASIS[a].n); return n; }
  nmin() { let n = 99; for (const a of this.populated()) n = Math.min(n, BASIS[a].n); return n === 99 ? 1 : n; }
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
  /** a stable digest of the PHYSICAL state (the anchor coefficients) — neither time nor the render mask is part of it */
  digest() {
    let h = 2166136261 >>> 0;
    const mix = (v) => { const s = v.toPrecision(15); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } };
    for (let a = 0; a < N; a++) if (this.re0[a] || this.im0[a]) { mix(a); mix(this.re0[a]); mix(this.im0[a]); }
    return h.toString(16).padStart(8, '0');
  }
  /** the reconstruction mask, separately */
  maskDigest() { let h = 0; for (let a = 0; a < N; a++) h = (h * 3 + this.muted[a] * 2 + this.solo[a]) >>> 0; return h.toString(16); }
  /* ── persistence ───────────────────────────────────────────────────────── */
  serialize(t = 0, _f) {
    const modes = [];
    for (let a = 0; a < N; a++) if (this.re0[a] || this.im0[a] || this.muted[a] || this.solo[a]) {
      const s = BASIS[a];
      modes.push({ id: s.id, n: s.n, l: s.l, m: s.m, re: this.re0[a], im: this.im0[a], muted: !!this.muted[a], solo: !!this.solo[a] });
    }
    return { format: 'lambdawaves/qwave-0/state', system: 'hydrogen', basis: 'n<=6 complex Y_lm, Condon-Shortley', units: 'atomic', t, preset: this.preset, modes,
      field: { ...this.field }, status: this.P ? 'EXACT IN THE PROPAGATOR\'S BASIS (Sturmian: VARIATIONAL eigenvalues, S-norm)' : this.field.Fz !== 0 ? 'EXACT WITHIN EACH SHELL (Stark)' : 'EXACT ANALYTIC' };
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
    this.field = { Bz: (obj.field && +obj.field.Bz) || 0, Fz: (obj.field && +obj.field.Fz) || 0 };
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
  { id: '2s+2pz', label: '2s + 2p_z  (Stark, degenerate)', note: 'same energy → no motion: the Stark state, a coherent state of the two rotors (ORBIT: Schmidt (1,0), e = ½, ⟨z⟩ = −3)', status: 'EXACT ANALYTIC',
    modes: [{ n: 2, l: 0, m: 0, amp: 1 }, { n: 2, l: 1, m: 0, amp: 1 }], visual: { rate: 4, window: 2 * Math.PI / 0.125, view: 'density' } },
  { id: '2px', label: '2p_x = (Y₁⁻¹ − Y₁¹)/√2', note: 'one nodal plane x = 0 · VORTEX: two unimodular roots at φ = ±π/2 on every coaxial circle', status: 'EXACT ANALYTIC',
    modes: [{ n: 2, l: 1, m: -1, amp: Math.SQRT1_2 }, { n: 2, l: 1, m: 1, amp: -Math.SQRT1_2 }], visual: { rate: 4, window: 2 * Math.PI / 0.125, view: 'real' } },
  { id: 'recon', label: '3d₊₂ + 4p₊₁ + 5s  (reconnection)', note: 'three stretched modes: vortex lines reconnect at ten points, at two phases of the discriminant beat T_d = 481.27 a.u. (VORTEX census)', status: 'EXACT ANALYTIC',
    modes: [{ n: 3, l: 2, m: 2, amp: 1 }, { n: 4, l: 1, m: 1, amp: 1 }, { n: 5, l: 0, m: 0, amp: 1 }], visual: { rate: 60, window: 2 * Math.PI / Math.abs(E(3) + E(5) - 2 * E(4)), view: 'phase' } },
  { id: '3dz2', label: '3d_z²', note: 'stationary · two conical nodes', status: 'EXACT ANALYTIC',
    modes: [{ n: 3, l: 2, m: 0, amp: 1 }], visual: { rate: 4, window: 2 * Math.PI / (1 / 18), view: 'real' } },
  { id: 'rydberg', label: 'Rydberg packet n = 4…6', note: 'circular states |n,n−1,n−1⟩, Gaussian in n about n̄ = 5 · orbits in xy, T_cl = 2π n̄³ ≈ 785 a.u.', status: 'EXACT ANALYTIC',
    modes: gauss(5, 1, [4, 5, 6]).map(({ n, w }) => ({ n, l: n - 1, m: n - 1, amp: w })),
    visual: { rate: 160, window: 2 * Math.PI * 125, view: 'density' } },
  { id: 'shadow-pair', label: '1s + 2s + 3s  (shadow trio)', note: 'three uncoupled oscillators at ω = ½, ⅛, 1⁄18 — watch SHADOW', status: 'EXACT ANALYTIC',
    modes: [{ n: 1, l: 0, m: 0, amp: 1 }, { n: 2, l: 0, m: 0, amp: 1 }, { n: 3, l: 0, m: 0, amp: 1 }], visual: { rate: 4, window: 2 * Math.PI / (1 / 18 - 0) * 1, view: 'density' } },

  /* ══ WAVE 106 · THE PRESET SUITE (Josh, and a collaboration with Gemini 3.8 at high effort) ═════
     Josh: "Create a suite of presets (now you get a chance to mathematically shine and show me all
     the realistic atoms, shapes, demonstrations and simulations and also perhaps personal debugging
     presets so that when we finally return to QCD or Molecules or whatever, we flesh it out and have
     the preset essentially be our 'reset button'."
       Drafted by the second lab and then CHECKED HERE rather than taken on trust, twice:
         · every mode is inside the register — 1 ≤ n ≤ 6, l < n, |m| ≤ l.  0 violations of 20 entries.
         · every `window` was recomputed from its OWN modes in exact rational arithmetic: T = 2π
           divided by the gcd of all pairwise |E_i − E_j| (one phase cycle 2π/|E_n| for a stationary
           state), with E_n = −1/(2n²).  ALL TWENTY land on that recurrence exactly, so each of these
           animations closes on itself instead of drifting.
       The five groups are Josh's: realistic orbitals · shapes · demonstrations · simulations · and the
       DEBUG set, whose notes say what a correct render should look like — those are the reset buttons,
       and a note that names what you should see is what makes a preset a test. */
  /* Physics justification: Linear combination (Y₂² + Y₂⁻²)/√2 ∝ sin²θ cos(2φ) = (x²−y²)/r² forms the canonical real d_x²-y² orbital with four lobes lying directly along the x and y Cartesian axes. As a single-energy eigenstate (E₃ = −1/18 a.u.), its density is strictly stationary; the display window is set to one quantum phase cycle 2π/|E₃| = 36π ≈ 113.097 a.u. */
  {
    id: '3dx2y2',
    label: '3d_x²-y²',
    note: 'the textbook dx2-y2 orbital · 4 lobes on x and y axes · stationary · phase cycle T = 2π/|E₃| = 36π = 113.097 a.u.',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 3, l: 2, m: -2, amp: Math.SQRT1_2 },
      { n: 3, l: 2, m: 2, amp: Math.SQRT1_2 }
    ],
    visual: { rate: 4, window: 36 * Math.PI, view: 'real' }
  },
  /* Physics justification: Complex combination i(Y₂² − Y₂⁻²)/√2 ∝ sin²θ sin(2φ) = 2xy/r² rotates the cloverleaf by 45° so its four lobes bisect the x and y axes. Like 3d_x²-y², it is an exact stationary eigenstate at E₃ = −1/18 a.u., closing its real-amplitude cycle at T = 2π/|E₃| = 36π ≈ 113.097 a.u. */
  {
    id: '3dxy',
    label: '3d_xy',
    note: 'cloverleaf orbital bisecting x and y axes · stationary · phase cycle T = 2π/|E₃| = 36π = 113.097 a.u.',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 3, l: 2, m: -2, amp: Math.SQRT1_2, phase: Math.PI / 2 },
      { n: 3, l: 2, m: 2, amp: Math.SQRT1_2, phase: -Math.PI / 2 }
    ],
    visual: { rate: 4, window: 36 * Math.PI, view: 'real' }
  },
  /* Physics justification: The cubic f-orbital f_xyz ∝ xyz/r³ = ½ sin²θ cos θ sin(2φ) is formed from i(Y₃² − Y₃⁻²)/√2. It possesses three mutually orthogonal planar nodes (x=0, y=0, z=0), dividing space into eight sign-alternating octant lobes; stationary at E₄ = −1/32 a.u. with phase recurrence T = 2π/|E₄| = 64π ≈ 201.062 a.u. */
  {
    id: '4fxyz',
    label: '4f_xyz',
    note: 'cubic octupole: 8 alternating lobes in the 8 octants · stationary · phase cycle T = 2π/|E₄| = 64π = 201.062 a.u.',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 4, l: 3, m: -2, amp: Math.SQRT1_2, phase: Math.PI / 2 },
      { n: 4, l: 3, m: 2, amp: Math.SQRT1_2, phase: -Math.PI / 2 }
    ],
    visual: { rate: 4, window: 64 * Math.PI, view: 'real' }
  },
  /* Physics justification: Explicit superposition ½(|2s⟩ + |2p_z⟩ + |2p_x⟩ + |2p_y⟩) creates a single hybrid lobe directed toward (1,1,1). Because all four basis states belong to the n=2 shell (E₂ = −1/8 a.u.), accidental Coulomb SO(4) degeneracy ensures the density is strictly stationary (|A(t)| ≡ 1) without requiring molecular bonding; display window is T = 2π/|E₂| = 16π ≈ 50.265 a.u. */
  {
    id: '2sp3',
    label: '2sp³  tetrahedral',
    note: 'directed tetrahedral hybrid along (1,1,1) · n=2 Coulomb degeneracy freezes density (|A(t)| = 1) · phase cycle T = 16π = 50.265 a.u.',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 2, l: 0, m: 0, amp: 0.5 },
      { n: 2, l: 1, m: 0, amp: 0.5 },
      { n: 2, l: 1, m: -1, amp: 0.5, phase: Math.PI / 4 },
      { n: 2, l: 1, m: 1, amp: 0.5, phase: 3 * Math.PI / 4 }
    ],
    visual: { rate: 4, window: 16 * Math.PI, view: 'density' }
  },
  /* Physics justification: The extremal state |6, 5, 5⟩ has radial wave R₆₅(r) ∝ r⁵ e^{−r/6} (0 radial nodes, peak at r = n² = 36 a.u.) and angular wave Y₅⁵ ∝ sin⁵θ e^{5iφ} (0 polar nodes). It forms a razor-thin circular Bohr orbit in the xy plane with a central phase vortex of topological charge m = +5; stationary at E₆ = −1/72 a.u. with phase period T = 2π/|E₆| = 144π ≈ 452.389 a.u. */
  {
    id: '6h-circ',
    label: '6h₅  circular torus',
    note: 'maximum angular momentum in n≤6: razor-thin equatorial torus with winding number m = +5 vortex in arg ψ',
    status: 'EXACT ANALYTIC',
    modes: [{ n: 6, l: 5, m: 5, amp: 1 }],
    visual: { rate: 8, window: 144 * Math.PI, view: 'phase' }
  },
  /* Physics justification: With l = 0 and m = 0, the state possesses zero angular nodes and the maximum possible radial node count in the register: n − l − 1 = 5 spherical nodes given by the roots of Laguerre L¹₅(2r/6). In 'real' view it renders as five nested onion-skin shells of alternating sign extending past r = 80 a.u.; phase period T = 2π/|E₆| = 144π ≈ 452.389 a.u. */
  {
    id: '6s-onion',
    label: '6s  nested shells',
    note: 'pure radial nodal structure: five concentric spherical nodal shells (n−l−1 = 5) out to r ≈ 80 a.u. · stationary',
    status: 'EXACT ANALYTIC',
    modes: [{ n: 6, l: 0, m: 0, amp: 1 }],
    visual: { rate: 4, window: 144 * Math.PI, view: 'real' }
  },
  /* Physics justification: Real combination (Y₃⁻³ − Y₃³)/√2 ∝ sin³θ cos(3φ) = x(x²−3y²)/r³ creates a 6-petaled rosette in the xy plane with D₃ₕ point group symmetry and three vertical planar nodes at φ = π/6, π/2, 5π/6; stationary at E₄ = −1/32 a.u. with phase cycle T = 2π/|E₄| = 64π ≈ 201.062 a.u. */
  {
    id: '4f-hex',
    label: '4f_x(x²-3y²)',
    note: 'hexagonal 6-petaled planar rosette with D₃ₕ symmetry · 3 vertical nodal planes slicing through z · stationary',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 4, l: 3, m: -3, amp: Math.SQRT1_2 },
      { n: 4, l: 3, m: 3, amp: -Math.SQRT1_2 }
    ],
    visual: { rate: 4, window: 64 * Math.PI, view: 'real' }
  },
  /* Physics justification: Interfering the spherical 3s orbital with the quadrupole 3d_z² within the same n=3 shell cancels the outer lobe along the z-axis while reinforcing amplitude in the xy plane, folding the spherical nodal shell into an isolated doughnut-shaped toroidal nodal surface; stationary at E₃ = −1/18 a.u. with phase period T = 2π/|E₃| = 36π ≈ 113.097 a.u. */
  {
    id: '3s-3dz2',
    label: '3s − 3d_z²  toroidal node',
    note: 'Coulomb l-interference: polar lobes cancel while equatorial ring reinforces, pinching a closed toroidal nodal bubble',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 3, l: 0, m: 0, amp: Math.SQRT1_2 },
      { n: 3, l: 2, m: 0, amp: -Math.SQRT1_2 }
    ],
    visual: { rate: 4, window: 36 * Math.PI, view: 'real' }
  },
  /* Physics justification: In an arbitrary central potential, states of different l precess at different frequencies. In Coulomb hydrogen, the Runge-Lenz vector enforces exact l-degeneracy. Although this parity-mixed state breaks inversion symmetry and strongly displaces charge along +z, its probability density |ψ|² is rigorously frozen (|A(t)| ≡ 1); display window T = 2π/|E₃| = 36π ≈ 113.097 a.u. */
  {
    id: 'demo-degen',
    label: '3s + 3p_z + 3d_z²  degeneracy',
    note: 'degeneracy means no motion: 3s + 3p_z + 3d_z² shares E = −1/18 a.u. · strongly polar density is frozen (|A(t)| = 1)',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 3, l: 0, m: 0, amp: 1 },
      { n: 3, l: 1, m: 0, amp: 1 },
      { n: 3, l: 2, m: 0, amp: 1 }
    ],
    visual: { rate: 4, window: 36 * Math.PI, view: 'density' }
  },
  /* Physics justification: An electric-dipole allowed pair (Δl = +1, Δm = 0) between n=2 and n=3. With E₂ = −1/8 and E₃ = −1/18, the energy difference is ΔE = 5/72 a.u. (1.8898 eV), yielding an exact beat period T = 2π/(5/72) = 144π/5 = 28.8π ≈ 90.477868 a.u. The oscillating charge density directly visualizes the atomic antenna emitting hydrogen's famous 656.3 nm H-α red line. */
  {
    id: 'demo-rabi',
    label: '2p_z + 3d_z²  Balmer-α beat',
    note: 'the microscopic Balmer-α radiator: density sloshes at T = 2π/(E₃−E₂) = 144π/5 = 90.478 a.u. (1.89 eV, 656.3 nm photon)',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 2, l: 1, m: 0, amp: 1 },
      { n: 3, l: 2, m: 0, amp: 1 }
    ],
    visual: { rate: 8, window: 144 * Math.PI / 5, view: 'density' }
  },
  /* Physics justification: For an eigenstate with m = +2, the density is an azimuthally symmetric torus, but the wavefunction carries phase factor e^{2iφ}. In 'phase' view, the hue cycles twice around the z-axis, directly revealing the quantum probability current j = (ℏ/m_e) Im(ψ* ∇ψ) = (m / r sin θ) |ψ|² φ̂; stationary at E₃ = −1/18 a.u. with phase cycle T = 36π ≈ 113.097 a.u. */
  {
    id: 'demo-current',
    label: '3d₊₂  circulating current',
    note: 'angular momentum as current: arg ψ = 2φ winds twice around z · probability current j = 2|ψ|²/(r sin θ) φ̂',
    status: 'EXACT ANALYTIC',
    modes: [{ n: 3, l: 2, m: 2, amp: 1 }],
    visual: { rate: 6, window: 36 * Math.PI, view: 'phase' }
  },
  /* Physics justification: Energies E₂ = −9/72, E₃ = −4/72, E₆ = −1/72 have pairwise differences ΔE₂₃ = 5/72, ΔE₃₆ = 3/72, ΔE₂₆ = 8/72. Their greatest common divisor is exactly 1/72 a.u., producing a rigorous full revival at T_rev = 2π/(1/72) = 144π ≈ 452.389 a.u. Fractional revivals occur where sub-pairs re-phase: T/8 = 18π ≈ 56.549 a.u. (2–6), T/5 = 28.8π ≈ 90.478 a.u. (2–3), and T/3 = 48π ≈ 150.796 a.u. (3–6). */
  {
    id: 'demo-revival',
    label: '2p_z + 3p_z + 6p_z  packet revival',
    note: 'rational packet revival at T_rev = 2π/(1/72) = 144π = 452.389 a.u. · fractional revivals at T/8 (56.5 a.u.), T/5 (90.5 a.u.), T/3 (150.8 a.u.)',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 2, l: 1, m: 0, amp: 1 },
      { n: 3, l: 1, m: 0, amp: 1 },
      { n: 6, l: 1, m: 0, amp: 1 }
    ],
    visual: { rate: 20, window: 144 * Math.PI, view: 'density' }
  },
  /* Physics justification: Demonstrates Bohr's correspondence limit using adjacent extremal circular states (l = m = n − 1). With E₅ = −1/50 and E₆ = −1/72, the transition energy is ΔE = 11/1800 a.u., giving quantum period T_beat = 3600π/11 ≈ 1028.157 a.u. This agrees within 1.6% with the classical Kepler orbital period T_cl = 2π n̄³ ≈ 1045.36 a.u. at n̄ = 5.5, showing a localized clump orbiting like a classical particle. */
  {
    id: 'demo-corresp',
    label: '5g₄ + 6h₅  Bohr correspondence',
    note: 'circular wavepacket revolving at T = 2π/(11/1800) = 3600π/11 = 1028.157 a.u. · matches classical Kepler orbit T_cl = 2π·n̄³ = 1045.36 a.u. to 1.6%',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 5, l: 4, m: 4, amp: 1 },
      { n: 6, l: 5, m: 5, amp: 1 }
    ],
    visual: { rate: 120, window: 3600 * Math.PI / 11, view: 'density' }
  },
  /* Physics justification: An alternating-parity dipole cascade across n = 1, 2, 3, 4. Over a common denominator of 288, the energies are E₁ = −144/288, E₂ = −36/288, E₃ = −16/288, E₄ = −9/288 with differences ΔE₁₂ = 108/288, ΔE₂₃ = 20/288, ΔE₃₄ = 7/288. Since gcd(108, 20, 7) = 1, the base recurrence frequency is 1/288 a.u., yielding an exact grand recurrence period T = 2π/(1/288) = 576π ≈ 1809.557 a.u. In this window, the 1–2 beat executes 108 cycles, 2–3 executes 20 cycles, and 3–4 executes 7 cycles, cleanly dephasing and perfectly re-forming. */
  {
    id: 'sim-ladder',
    label: '1s + 2p_z + 3s + 4p_z  dipole cascade',
    note: 'four-shell dipole ladder: multi-harmonic slosh disperses into fine interferogram and collapses at grand period T = 576π = 1809.557 a.u.',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 1, l: 0, m: 0, amp: 1 },
      { n: 2, l: 1, m: 0, amp: 1 },
      { n: 3, l: 0, m: 0, amp: 1 },
      { n: 4, l: 1, m: 0, amp: 1 }
    ],
    visual: { rate: 60, window: 576 * Math.PI, view: 'density' }
  },
  /* Physics justification: Superposition of m = +2 quadrupole states across n = 3, 4, 6. The energies are E₃ = −16/288, E₄ = −9/288, E₆ = −4/288, with differences ΔE₃₄ = 7/288, ΔE₄₆ = 5/288, and ΔE₃₆ = 12/288. All differences are exact multiples of 1/288 a.u., yielding an exact recurrence window T = 2π/(1/288) = 576π ≈ 1809.557 a.u. The double vortex remains stationary in azimuth while the concentric radial shells beat, shear, and periodically re-crystallize. */
  {
    id: 'sim-churn',
    label: '3d₊₂ + 4d₊₂ + 6d₊₂  quadrupole churn',
    note: 'three-mode m=2 vortex: radial breathing and shear across shells with exact rational recurrence at T = 576π = 1809.557 a.u.',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 3, l: 2, m: 2, amp: 1 },
      { n: 4, l: 2, m: 2, amp: 1 },
      { n: 6, l: 2, m: 2, amp: 1 }
    ],
    visual: { rate: 60, window: 576 * Math.PI, view: 'diff' }
  },
  /* Physics justification: Mixing adjacent shells n=4 and n=5 with mixed m values breaks azimuthal symmetry, creating an eccentric, banana-shaped Keplerian wavepacket that orbits the nucleus. Because E₄ = −25/800 and E₅ = −16/800, the energy difference between the two populated shells is ΔE = 9/800 a.u., giving a rigorous density recurrence period T = 2π/(9/800) = 1600π/9 ≈ 558.505 a.u. */
  {
    id: 'sim-kepler',
    label: '4f₊₃ + 5f₊₂ + 5g₊₄  eccentric orbit',
    note: 'azimuthally asymmetric Keplerian clump revolving and breathing with exact closed recurrence at T = 2π/(9/800) = 1600π/9 = 558.505 a.u.',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 4, l: 3, m: 3, amp: 1 },
      { n: 5, l: 3, m: 2, amp: 1 },
      { n: 5, l: 4, m: 4, amp: 1 }
    ],
    visual: { rate: 40, window: 1600 * Math.PI / 9, view: 'density' }
  },
  /* Physics justification: Ground truth test of unitary stationary propagation. For a single eigenstate (E₄ = −1/32 a.u.), ψ(t) = e^{−iE₄t} ψ(0), so |ψ(t)|² ≡ |ψ(0)|² for all t. Any temporal fluctuation, flickering, or drift in 'density' view immediately exposes a regression in the time-propagation kernel; the real component oscillates with period T = 2π/|E₄| = 64π ≈ 201.062 a.u. */
  {
    id: 'debug-stat',
    label: '4f₀  [TEST: density invariance]',
    note: 'WHAT AN OBSERVER SHOULD SEE: volume in density view is 100% frozen for all t; phase and real view rotate at T = 64π = 201.062 a.u. · any density motion is a bug',
    status: 'EXACT ANALYTIC',
    modes: [{ n: 4, l: 3, m: 0, amp: 1 }],
    visual: { rate: 10, window: 64 * Math.PI, view: 'density' }
  },
  /* Physics justification: Benchmark for the logical clock and transport engine. E₂ = −1/8, E₄ = −1/32, so ΔE = 3/32 a.u., giving beat period T = 2π/(3/32) = 64π/3 ≈ 67.020643 a.u. Specifying playback rate = (64π/3)/10 ≈ 6.702064328 a.u./s ensures that exactly one beat cycle elapses every 10.000 wall seconds, allowing precise calibration against an external physical stopwatch. */
  {
    id: 'debug-clock',
    label: '2s + 4s  [TEST: clock & stopwatch]',
    note: 'beat period T = 2π/(E₄−E₂) = 64π/3 = 67.021 a.u. · at rate 6.702064 a.u./s, 1 beat cycle = exactly 10.000 wall seconds · WHAT AN OBSERVER SHOULD SEE: stopwatch reads 10.00 s peak to peak',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 2, l: 0, m: 0, amp: 1 },
      { n: 4, l: 0, m: 0, amp: 1 }
    ],
    visual: { rate: 6.70206432766, window: 64 * Math.PI / 3, view: 'diff' }
  },
  /* Physics justification: Diagnostic for raymarching isosurface precision and nodal topology. With n = 5, l = 2, m = 0, the state possesses exactly n − l − 1 = 2 radial spherical nodes (at r = 5(3 ± √3) ≈ 6.34 a.u. and 23.66 a.u.) and l − |m| = 2 angular conical nodes (cos²θ = 1/3, θ ≈ 54.74° and 125.26°). The volume is partitioned into 9 sign-alternating domains; any nodal fuzziness or dislocation flags raymarcher step inaccuracy. */
  {
    id: 'debug-nodes',
    label: '5d₀  [TEST: node count]',
    note: 'WHAT AN OBSERVER SHOULD SEE: in real view, exactly 2 radial spherical nodes and 2 angular conical nodes partition space into 3×3 = 9 sign-alternating cells; nodes must never drift',
    status: 'EXACT ANALYTIC',
    modes: [{ n: 5, l: 2, m: 0, amp: 1 }],
    visual: { rate: 4, window: 100 * Math.PI, view: 'real' }
  },
  /* Physics justification: Minimal two-mode state for bisecting rendering regressions. Both modes have l = 0 and m = 0, so the state is rigorously isotropic in 3D (Y₀⁰ = 1/√4π everywhere). Energy difference ΔE = −1/18 − (−1/2) = 4/9 a.u. sets the breathing period to T = 2π/(4/9) = 9π/2 ≈ 14.137167 a.u. Any angular asymmetry, directional artifacts, or lobe pinching isolates a bug in spatial volume evaluation. */
  {
    id: 'debug-bisect',
    label: '1s + 3s  [TEST: bisection baseline]',
    note: 'purely isotropic radial beat at T = 9π/2 = 14.137 a.u. · WHAT AN OBSERVER SHOULD SEE: perfect spherical symmetry at all times; any angular variation isolates a renderer bug',
    status: 'EXACT ANALYTIC',
    modes: [
      { n: 1, l: 0, m: 0, amp: 1 },
      { n: 3, l: 0, m: 0, amp: 1 }
    ],
    visual: { rate: 4, window: 4.5 * Math.PI, view: 'diff' }
  },
];
export const PRESET_BY_ID = new Map(PRESETS.map((p) => [p.id, p]));
