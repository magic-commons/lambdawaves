/* molecular-register.js — THE STATE REGISTER'S MATHEMATICS (MOLECULAR WAVES stages 3–4; JUDGMENT.md §3).
 *
 * No DOM, no WebGPU, no worker: the pure half of the REGISTER window's STATES mode, so node can gate it.
 *
 * THE MODEL.  Φ₀ is the converged RHF determinant, Ψ_K = Σ_ia X^K_ia (1/√2) E_ai Φ₀ the singlet CIS (TDA) states at
 * ω_K above it, and the register is a genuine N-electron wavefunction in their span,
 *
 *     Ψ(t) = b₀ Φ₀ + Σ_K b_K e^{−iω_K t} Ψ_K ,
 *
 * which by Brillouin's theorem solves i∂Ψ/∂t = PHP Ψ exactly, in closed form, for every t (Proposition 1).  That is
 * why this register may be played at ANY amplitude: its one-particle density matrix is N-representable always,
 * where a linear-response overlay ρ₀ + g·ρ^tr is not (measured: occupations −0.12 … 2.12 for benzene at g = 0.6).
 *
 * THE PAIR FORM (certified against PySCF's determinant-space transition RDMs, proving/LEDGER.md).  With the
 * normalised c₀ = b₀/‖b‖ and Z(t) = Σ_K b_K e^{−iω_K t} X^K / ‖b‖ ∈ C^{n_o × n_v}, and D_pq = ⟨a†_p a_q⟩,
 *
 *     D_oo = 2·1 − Z Z†        D_vv = Z† Z        D_ov = √2 c̄₀ Z        D_vo = D_ov†
 *
 * so the CHANGE from the ground state is ΔD_MO = (−Z Z†) ⊕ (Z† Z) plus the ov block, and its AO image C ΔD Cᵀ is
 * ONE real symmetric matrix: the `signed` product the molecular session takes.  About 10⁵ multiply–adds a frame for
 * benzene; time is evaluated in closed form, so scrubbing and reversal are exact.
 *
 * THE MEAN REFERENCE.  The stationary part of D(t) is the sum over EQUAL-ENERGY pairs of states: the oo and vv
 * blocks of each degenerate cluster's own Z_c (its common phase cancels).  The ov block always turns at ω_K > 0.
 * Subtracting it leaves exactly the interference terms on screen.
 *
 * Prior art, so nothing is claimed as new: this is time-dependent CIS (Krause, Klamroth, Saalfrank, J. Chem. Phys.
 * 123, 074105, 2005).  What it is not: no doubles, no orbital relaxation, TDA line positions, no ionisation.
 */

export const GROUND = -1;                                  // the register key of Φ₀
export const AU_TIME_AS = 24.188843265857;                 // one atomic unit of time, in attoseconds
const TAU = 2 * Math.PI;
const SAME = 1e-8;                                         // |Δω| below this is one level — canon-gauge.js's own cluster tolerance

/**
 * The normalised geodesic between two registers (REGISTER-WINDOW-SPEC §5).  A, B: Map key → { re, im } at the same
 * epoch.  Both evolve under the same diagonal generator, so ⟨A(t)|B(t)⟩ is constant and the path may be taken on
 * the t = 0 coefficients.  For orthogonal anchors this is cos(sπ/2) A + sin(sπ/2) B — hydrogen's TRANSITION envelope.
 */
export function slerpCoefficients(A, B, s) {
  const keys = new Set([...A.keys(), ...B.keys()]), out = new Map();
  let na = 0, nb = 0; for (const c of A.values()) na += c.re * c.re + c.im * c.im; for (const c of B.values()) nb += c.re * c.re + c.im * c.im;
  na = Math.sqrt(na); nb = Math.sqrt(nb);
  if (!(na > 0) || !(nb > 0)) { for (const [k, c] of (na > 0 ? A : B)) out.set(k, { re: c.re, im: c.im }); return out; }
  let ore = 0, oim = 0;                                    // ⟨A|B⟩ = Σ ā b
  for (const k of keys) { const a = A.get(k), b = B.get(k); if (!a || !b) continue; ore += (a.re * b.re + a.im * b.im) / (na * nb); oim += (a.re * b.im - a.im * b.re) / (na * nb); }
  const mag = Math.min(1, Math.hypot(ore, oim)), pr = mag > 1e-14 ? ore / mag : 1, pi = mag > 1e-14 ? oim / mag : 0;   // e^{iα}; B is turned by e^{−iα}
  const th = Math.acos(mag), t = Math.min(1, Math.max(0, s));
  let wa, wb;
  if (th < 1e-7) { wa = 1 - t; wb = t; } else { const sn = Math.sin(th); wa = Math.sin((1 - t) * th) / sn; wb = Math.sin(t * th) / sn; }
  let n2 = 0;
  for (const k of keys) {
    const a = A.get(k), b = B.get(k);
    const are = a ? a.re / na : 0, aim = a ? a.im / na : 0, b0r = b ? b.re / nb : 0, b0i = b ? b.im / nb : 0;
    const bre = b0r * pr + b0i * pi, bim = b0i * pr - b0r * pi;                    // b · e^{−iα}
    const re = wa * are + wb * bre, im = wa * aim + wb * bim;
    out.set(k, { re, im }); n2 += re * re + im * im;
  }
  const inv = n2 > 0 ? 1 / Math.sqrt(n2) : 1;               // the θ → 0 branch is a chord: put it back on the sphere
  for (const c of out.values()) { c.re *= inv; c.im *= inv; }
  return out;
}

/** the strongest beats of a register: every pair of distinct-energy entries, weighted by |b_A||b_B| */
export function beatsOf(entries) {
  const out = [];
  for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
    const a = entries[i], b = entries[j], dE = Math.abs(a.energy - b.energy), w = a.amp * b.amp;
    if (dE > SAME && w > 0) out.push({ a: a.key, b: b.key, dE, period: TAU / dE, weight: w });
  }
  return out.sort((p, q) => q.weight - p.weight || p.dE - q.dE);
}

/**
 * Presets BY RULE, so each exists for every molecule or is refused with a sentence (REGISTER-WINDOW-SPEC §9).
 * ladder = { omega, f, mu (3 per state), size, cluster }; returns { lanes: [{ key, amp, phase }], why } or { lanes: null, why }.
 * CORE is the window above which a line is a core excitation: a preset should slosh the valence, not the O 1s.
 */
export const PRESETS = ['BEAT', 'RING', 'LISSAJOUS', 'DARK', 'KICK X', 'KICK Y', 'KICK Z'];
export function presetLanes(name, ladder, { core = 3, bright = 0.02, lanes = 8 } = {}) {
  const m = ladder.omega.length, ks = [...Array(m).keys()].filter((k) => ladder.omega[k] < core);
  const axisOf = (k) => { let b = 0; for (let q = 1; q < 3; q++) if (Math.abs(ladder.mu[3 * k + q]) > Math.abs(ladder.mu[3 * k + b])) b = q; return b; };
  const byF = ks.filter((k) => ladder.f[k] > bright).sort((p, q) => ladder.f[q] - ladder.f[p] || p - q);
  const g = (amp) => ({ key: GROUND, amp, phase: 0 });
  if (name === 'BEAT') {
    if (!byF.length) return { lanes: null, why: 'no bright valence state in this ladder' };
    return { lanes: [g(0.8), { key: byF[0], amp: 0.6, phase: 0 }], why: 'S₀ + the brightest valence state' };
  }
  if (name === 'RING') {
    const k = ks.find((q) => ladder.f[q] > bright && ladder.size[q] >= 2 && (q === 0 || ladder.cluster[q - 1] !== ladder.cluster[q]));
    if (k === undefined) return { lanes: null, why: 'no bright degenerate pair: a ring current needs a twofold level (try LISSAJOUS)' };
    return { lanes: [g(0.8), { key: k, amp: 0.42, phase: 0 }, { key: k + 1, amp: 0.42, phase: Math.PI / 2 }], why: 'S₀ + the lowest bright pair, a quarter turn apart' };
  }
  if (name === 'LISSAJOUS') {
    for (let i = 0; i < byF.length; i++) for (let j = i + 1; j < byF.length; j++) {
      const a = byF[i], b = byF[j];
      if (axisOf(a) !== axisOf(b) && Math.abs(ladder.omega[a] - ladder.omega[b]) > SAME) return { lanes: [g(0.8), { key: a, amp: 0.42, phase: 0 }, { key: b, amp: 0.42, phase: 0 }], why: 'S₀ + two bright lines of different axis and different ω' };
    }
    return { lanes: null, why: 'no two bright lines of different axis and different ω' };
  }
  if (name === 'DARK') {
    const k = ks.find((q) => ladder.f[q] < 1e-8 && ladder.size[q] === 1);
    if (k === undefined) return { lanes: null, why: 'no non-degenerate dark state below the core window' };
    return { lanes: [g(0.8), { key: k, amp: 0.6, phase: 0 }], why: 'S₀ + the lowest dark state: charge moves, the dipole does not' };
  }
  if (name.startsWith('KICK')) {
    const q = { X: 0, Y: 1, Z: 2 }[name.slice(5)]; if (q === undefined) return { lanes: null, why: 'unknown axis' };
    const along = ks.filter((k) => Math.abs(ladder.mu[3 * k + q]) > 1e-4).sort((a, b) => Math.abs(ladder.mu[3 * b + q]) - Math.abs(ladder.mu[3 * a + q])).slice(0, lanes - 1);
    if (!along.length) return { lanes: null, why: `no state is bright along ${name.slice(5).toLowerCase()}` };
    let s2 = 0; for (const k of along) s2 += ladder.mu[3 * k + q] ** 2;
    const scale = Math.sqrt(0.25 / s2);                                          // a quarter of the norm leaves the ground state
    /* b_K = −iκ μ_Kq (Proposition 2): amplitude κ|μ|, phase −90° for μ > 0 and +90° for μ < 0 */
    return { lanes: [g(Math.sqrt(0.75)), ...along.sort((a, b) => a - b).map((k) => ({ key: k, amp: scale * Math.abs(ladder.mu[3 * k + q]), phase: ladder.mu[3 * k + q] > 0 ? 1.5 * Math.PI : 0.5 * Math.PI }))],
      why: `a δ-kick along ${name.slice(5).toLowerCase()} at performance strength: b_K = −iκ μ_K over the ${along.length} brightest states` };
  }
  return { lanes: null, why: `no preset '${name}'` };
}

/** a strictly monotone y-map for a ladder: every gap to scale up to `cap` × the median gap, clamped beyond it */
export function softCapLevels(values, cap = 3) {
  const m = values.length, gaps = [];
  for (let i = 0; i < m - 1; i++) gaps.push(values[i + 1] - values[i]);
  const pos = gaps.filter((d) => d > 0).sort((a, b) => a - b), med = pos.length ? pos[pos.length >> 1] : 0, lim = med > 0 ? cap * med : Infinity;
  let tot = 0; const w = gaps.map((d) => { const x = Math.min(Math.max(d, 0), lim); tot += x; return x; });
  const out = new Float64Array(m); let acc = 0;
  for (let i = 0; i < m; i++) { out[i] = tot > 0 ? acc / tot : (m > 1 ? i / (m - 1) : 0.5); if (i < m - 1) acc += w[i]; }
  return out;                                                                    // 0 at the lowest level, 1 at the highest
}

/**
 * createStatesModel({ n, nocc, C, D0, rMO }) — C[ao·n + mo], D0 the ground AO density (n²), rMO the three MO position
 * matrices back to back (3 n²).  Vectors arrive later, one state at a time (`addState`), because they live in the worker.
 */
export function createStatesModel({ n, nocc, C, D0, rMO }) {
  const nvir = n - nocc, d = nocc * nvir;
  if (!(nocc >= 1) || !(nvir >= 1)) throw new Error('molecular-register: needs at least one occupied and one virtual orbital');
  const vectors = new Map(), energies = new Map([[GROUND, 0]]);
  const Zr = new Float64Array(d), Zi = new Float64Array(d), Cr = new Float64Array(d), Ci = new Float64Array(d);
  const dMO = new Float64Array(n * n), sMO = new Float64Array(n * n), half = new Float64Array(n * n), dAO = new Float64Array(n * n);
  const out32 = new Float32Array(n * n);
  const state = { norm2: 0, c0re: 1, c0im: 0, dipole: [0, 0, 0], peak: 0, scale: 1, excited: 0 };

  /** −Z Z† into oo and +Z† Z into vv of `M`, accumulating (Re parts only: the density sees nothing else) */
  function blocks(M, zr, zi, sign) {
    for (let i = 0; i < nocc; i++) for (let j = i; j < nocc; j++) {
      let s = 0; const ri = i * nvir, rj = j * nvir;
      for (let a = 0; a < nvir; a++) s += zr[ri + a] * zr[rj + a] + zi[ri + a] * zi[rj + a];
      M[i * n + j] -= sign * s; if (j !== i) M[j * n + i] -= sign * s;
    }
    for (let a = 0; a < nvir; a++) for (let b = a; b < nvir; b++) {
      let s = 0;
      for (let i = 0; i < nocc; i++) s += zr[i * nvir + a] * zr[i * nvir + b] + zi[i * nvir + a] * zi[i * nvir + b];
      M[(nocc + a) * n + nocc + b] += sign * s; if (b !== a) M[(nocc + b) * n + nocc + a] += sign * s;
    }
  }
  /**
   * evaluate(lanes, t, ref) — lanes: [{ key, re, im }] at t = 0 (muted lanes left out by the caller); ref 'ground' | 'mean'.
   * Fills ΔD_MO (against the chosen reference) and the dipole change; returns the shared state record.
   */
  function evaluate(lanes, t, ref = 'ground') {
    let n2 = 0; for (const c of lanes) if (energies.has(c.key) && (c.key === GROUND || vectors.has(c.key))) n2 += c.re * c.re + c.im * c.im;
    state.norm2 = n2; dMO.fill(0); Zr.fill(0); Zi.fill(0); state.c0re = 1; state.c0im = 0; state.excited = 0;
    if (!(n2 > 0)) { state.dipole[0] = state.dipole[1] = state.dipole[2] = 0; return state; }
    const inv = 1 / Math.sqrt(n2); let c0r = 0, c0i = 0, ex = 0;
    for (const c of lanes) {
      if (c.key === GROUND) { c0r += c.re * inv; c0i += c.im * inv; continue; }
      const X = vectors.get(c.key); if (!X) continue;
      const ph = -energies.get(c.key) * t, cs = Math.cos(ph), sn = Math.sin(ph);
      const br = (c.re * cs - c.im * sn) * inv, bi = (c.re * sn + c.im * cs) * inv;
      ex += br * br + bi * bi;
      for (let p = 0; p < d; p++) { Zr[p] += br * X[p]; Zi[p] += bi * X[p]; }
    }
    state.c0re = c0r; state.c0im = c0i; state.excited = ex;
    blocks(dMO, Zr, Zi, 1);
    const r2 = Math.SQRT2;
    for (let i = 0; i < nocc; i++) for (let a = 0; a < nvir; a++) {               // √2 Re(c̄₀ Z), symmetric
      const v = r2 * (c0r * Zr[i * nvir + a] + c0i * Zi[i * nvir + a]);
      dMO[i * n + nocc + a] = v; dMO[(nocc + a) * n + i] = v;
    }
    for (let q = 0; q < 3; q++) { let s = 0; const r = q * n * n; for (let k = 0; k < n * n; k++) s -= dMO[k] * rMO[r + k]; state.dipole[q] = s; }   // electronic dipole = −Tr(ΔD r)
    if (ref === 'mean') {                                                         // subtract the stationary part: each level's own Z_c
      sMO.fill(0);
      const seen = new Set();
      for (const c of lanes) {
        if (c.key === GROUND || seen.has(c.key) || !vectors.has(c.key)) continue;
        const E = energies.get(c.key); Cr.fill(0); Ci.fill(0);
        for (const e of lanes) {
          if (e.key === GROUND || seen.has(e.key) || !vectors.has(e.key) || Math.abs(energies.get(e.key) - E) > SAME) continue;
          seen.add(e.key); const X = vectors.get(e.key), br = e.re * inv, bi = e.im * inv;
          for (let p = 0; p < d; p++) { Cr[p] += br * X[p]; Ci[p] += bi * X[p]; }
        }
        blocks(sMO, Cr, Ci, 1);
      }
      for (let k = 0; k < n * n; k++) dMO[k] -= sMO[k];
    }
    return state;
  }
  /** ΔD_AO = C ΔD_MO Cᵀ into the f64 buffer; returns max |ΔD_AO| */
  function toAO() {
    for (let u = 0; u < n; u++) for (let q = 0; q < n; q++) { let s = 0; const r = u * n; for (let p = 0; p < n; p++) s += C[r + p] * dMO[p * n + q]; half[r + q] = s; }
    let peak = 0;
    for (let u = 0; u < n; u++) for (let w = u; w < n; w++) { let s = 0; for (let q = 0; q < n; q++) s += half[u * n + q] * C[w * n + q]; dAO[u * n + w] = dAO[w * n + u] = s; const a = Math.abs(s); if (a > peak) peak = a; }
    state.peak = peak; return peak;
  }
  /**
   * The field's product.  'signed': ΔD_AO / max|ΔD_AO| — NORMALISED, because the signed texel is half precision and
   * holds its value absolutely (stage 1 measured 4.9e-3 at a peak of 2e-5); the `real` view divides by the volume's
   * own maximum anyway, so the picture is identical and `state.scale` carries the factor for any reader that wants Δρ.
   * 'density': D0 + ΔD_AO, against the ground reference only (call evaluate(…, 'ground') first).
   */
  function product(kind) {
    const peak = toAO();
    if (kind === 'density') { state.scale = 1; for (let k = 0; k < n * n; k++) out32[k] = D0[k] + dAO[k]; return out32; }
    const s = peak > 0 ? 1 / peak : 1; state.scale = peak > 0 ? peak : 1;
    for (let k = 0; k < n * n; k++) out32[k] = dAO[k] * s;
    return out32;
  }
  /** Im D_MO for the current Z — the carrier of the current j (stage 6); D_pq = ⟨a†_p a_q⟩ throughout */
  function imagMO(out = new Float64Array(n * n)) {
    out.fill(0); const r2 = Math.SQRT2, c0r = state.c0re, c0i = state.c0im;
    for (let i = 0; i < nocc; i++) for (let j = 0; j < nocc; j++) { let s = 0; for (let a = 0; a < nvir; a++) s += Zi[i * nvir + a] * Zr[j * nvir + a] - Zr[i * nvir + a] * Zi[j * nvir + a]; out[i * n + j] = -s; }
    for (let a = 0; a < nvir; a++) for (let b = 0; b < nvir; b++) { let s = 0; for (let i = 0; i < nocc; i++) s += Zr[i * nvir + a] * Zi[i * nvir + b] - Zi[i * nvir + a] * Zr[i * nvir + b]; out[(nocc + a) * n + nocc + b] = s; }
    for (let i = 0; i < nocc; i++) for (let a = 0; a < nvir; a++) { const v = r2 * (c0r * Zi[i * nvir + a] - c0i * Zr[i * nvir + a]); out[i * n + nocc + a] = v; out[(nocc + a) * n + i] = -v; }
    return out;
  }
  return {
    n, nocc, nvir, d,
    addState(key, omega, X) { if (!(X && X.length === d)) throw new Error(`molecular-register: state ${key} needs ${d} amplitudes`); vectors.set(key, Float64Array.from(X)); energies.set(key, +omega); },
    has: (key) => key === GROUND || vectors.has(key),
    energy: (key) => energies.get(key),
    clear() { vectors.clear(); energies.clear(); energies.set(GROUND, 0); },
    evaluate, product, imagMO, toAO,
    get deltaMO() { return dMO; }, get deltaAO() { return dAO; }, get state() { return state; },
  };
}
