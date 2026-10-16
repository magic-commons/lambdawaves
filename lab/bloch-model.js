/* bloch-model.js — BLOCH's qubit (0.8.1 T1), DOM-free: |ψ⟩ = a|↑⟩ + b|↓⟩ under H(t) = (ω₀/2)σ_z + (Ω/2)(cos φ σ_x + sin φ σ_y), φ = ∫ω dt, ω = ω₀ + δ + βt.
 * The frame turning with the drive, |ψ⟩ = e^{−iφσ_z/2}|ψ′⟩, takes it EXACTLY (the drive is circular: no rotating-wave approximation) to H′ = −(δ + βt)/2 σ_z + (Ω/2)σ_x,
 * constant at β = 0, so one step e^{−iH′dt} = cos|n| − i sin|n| n̂·σ is exact over any t; at β ≠ 0 n is the fourth-order Magnus exponent of H′ (linear in t) over steps of dt. */
export const PRESETS = { flop: { O: 0.2, d: 0, b: 0, th: 0, ph: 0 }, larmor: { O: 0, d: 0, b: 0, th: Math.PI / 2, ph: 0 }, rabi: { O: 0.2, d: 0, b: 0, th: 0, ph: 0 }, lz: { O: 0.3, d: -4.5, b: 0.05, th: 0, ph: 0 } };
export const DEFAULTS = { preset: 'flop', w0: 1, ...PRESETS.flop, mode: 'one', bell: 'phip' }, DT = 0.05;
export const pulse = (P) => (P.preset === 'flop' && P.O > 0 ? Math.PI / P.O : Infinity);   // FLOP: a π-pulse, Ω on for π/Ω and then off
export const init = (P) => [Math.cos(P.th / 2), 0, Math.sin(P.th / 2) * Math.cos(P.ph), Math.sin(P.th / 2) * Math.sin(P.ph)];   // [Re a, Im a, Re b, Im b] = ψ′(0) = ψ(0)
export function step(s, P, t, dt) { const O = t < pulse(P) ? P.O : 0; return su2(s, O * dt / 2, -P.b * O * dt ** 3 / 24, -(P.d + P.b * (t + dt / 2)) * dt / 2); }
export function su2([ar, ai, br, bi], nx, ny, nz) {   // e^{−i n·σ} = cos|n| − i sin|n| n̂·σ on [Re a, Im a, Re b, Im b]: the one 2 × 2 exponential
  const m = Math.hypot(nx, ny, nz), c = Math.cos(m), q = m ? Math.sin(m) / m : 0;
  const ur = nz * ar + nx * br + ny * bi, ui = nz * ai + nx * bi - ny * br, vr = nx * ar - ny * ai - nz * br, vi = nx * ai + ny * ar - nz * bi;
  return [c * ar + q * ui, c * ai - q * ur, c * br + q * vi, c * bi - q * vr];
}
export function run(P, t, dt = DT, from = null) {   // ψ′(t) from ψ′(0), or onward from a kept { t, s }; the pulse's end is a step's edge
  let { t: u, s } = from || { t: 0, s: init(P) }; const tp = pulse(P);
  while (u < t) { const e = Math.min(t, u < tp ? tp : Infinity, P.b ? u + dt : Infinity); s = step(s, P, u, e - u); u = e; }
  return { t: u, s };
}
export const phase = (P, t) => (P.w0 + P.d) * t + P.b * t * t / 2;
export function vec(P, [ar, ai, br, bi], t) {   // the lab's Bloch vector (⟨σ_x⟩, ⟨σ_y⟩, ⟨σ_z⟩): the turning frame's, turned by φ(t) about ẑ
  const f = phase(P, t), x = 2 * (ar * br + ai * bi), y = 2 * (ar * bi - ai * br), c = Math.cos(f), q = Math.sin(f);
  return [c * x - q * y, q * x + c * y, ar * ar + ai * ai - br * br - bi * bi];
}
const rot = (r, O, d, w) => { const W = Math.hypot(O, d); if (!W) return r; const n = [O / W, 0, -d / W], c = Math.cos(W * w), s = Math.sin(W * w), k = (n[0] * r[0] + n[2] * r[2]) * (1 - c);
  return [r[0] * c - n[2] * r[1] * s + n[0] * k, r[1] * c + (n[2] * r[0] - n[0] * r[2]) * s, r[2] * c + n[0] * r[1] * s + n[2] * k]; };
export function closed(P, t) {   // β = 0: the Bloch vector by Rodrigues about 2h′ = (Ω, 0, −δ), the pulse's two pieces, then φ(t) about ẑ — no spinor in it
  const tp = pulse(P), r0 = [Math.sin(P.th) * Math.cos(P.ph), Math.sin(P.th) * Math.sin(P.ph), Math.cos(P.th)]; let r = rot(r0, P.O, P.d, Math.min(t, tp)); if (t > tp) r = rot(r, 0, P.d, t - tp);
  const f = phase(P, t), c = Math.cos(f), q = Math.sin(f); return [c * r[0] - q * r[1], q * r[0] + c * r[1], r[2]];
}
export const lzP = (P) => 1 - Math.exp(-Math.PI * P.O ** 2 / (2 * Math.abs(P.b)));   // the Landau–Zener flip, swept from −∞ to +∞
export const span = (P) => Math.min(2000, Math.max(2 * Math.PI, P.b ? -2 * P.d / P.b : 0));   // the re-solve's run: the sweep to resonance and as far past it (≤ 2000), else one turn
export function halve(P) { const T = span(P), a = run(P, T).s, b = run(P, T, DT / 2).s; return { T, d: Math.hypot(...a.map((x, i) => x - b[i])) }; }
/* THE BELL PAIR (0.8.1 T2): [c↑↑, c↑↓, c↓↑, c↓↓] as [Re, Im] pairs.  (θ₀, φ₀) turn qubit A alone, U ⊗ 1 with U = e^{−i(θ/2)(−sin φ σ_x + cos φ σ_y)} (↑ → (θ, φ));
 * ρ_A = ½(1 + r_A·σ), ρ_B likewise, S_A from |r| (a pure pair: |r_A| = |r_B| = √(1 − C²)); CHSH on the drawn axes: A ẑ, x̂ · B (±s_x x̂ + s_z ẑ)/√2, the preset's signs. */
const h = Math.SQRT1_2, X = [1, 0], Zx = [0, 1], M = ([x, z]) => [[z, x], [x, -z]], H2 = (x) => (x > 0 ? -x * Math.log(x) : 0), r1 = (q) => vec(DEFAULTS, q, 0);
export const BELL = { phip: [h, 0, 0, h], phim: [h, 0, 0, -h], psip: [0, h, h, 0], psim: [0, h, -h, 0], prod: [1, 0, 0, 0] };
export function pair(id, th, ph) { const c = BELL[id], u = (x) => su2([c[x], 0, c[2 + x], 0], -th / 2 * Math.sin(ph), th / 2 * Math.cos(ph), 0), p = u(0), q = u(1); return [p[0], p[1], q[0], q[1], p[2], p[3], q[2], q[3]]; }
export const corr = (s, a, b) => { let e = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) e += M(a)[i >> 1][j >> 1] * M(b)[i & 1][j & 1] * (s[2 * i] * s[2 * j] + s[2 * i + 1] * s[2 * j + 1]); return e; };   // ⟨(a·σ) ⊗ (b·σ)⟩, a and b in the x–z plane
export function bell(s, id) {
  const add = (u, v) => u.map((x, i) => x + v[i]), rA = add(r1([s[0], s[1], s[4], s[5]]), r1([s[2], s[3], s[6], s[7]])), rB = add(r1(s.slice(0, 4)), r1(s.slice(4))), r = Math.min(1, Math.hypot(...rA));
  const c0 = pair(id, 0, 0), sx = corr(c0, X, X) < 0 ? -1 : 1, sz = corr(c0, Zx, Zx) < 0 ? -1 : 1, b = [sx * h, sz * h], b2 = [-sx * h, sz * h];
  return { rA, rB, r, S: H2((1 + r) / 2) + H2((1 - r) / 2), chsh: corr(s, Zx, b) + corr(s, Zx, b2) + corr(s, X, b) - corr(s, X, b2), max: 2 * Math.sqrt(2 - r * r), axes: [Zx, X, b, b2].map(([x, z]) => [x, 0, z]) };
}
