/* bloch-model.js — BLOCH's qubit (0.8.1 T1), DOM-free: |ψ⟩ = a|↑⟩ + b|↓⟩ under H(t) = (ω₀/2)σ_z + (Ω/2)(cos φ σ_x + sin φ σ_y), φ = ∫ω dt, ω = ω₀ + δ + βt.
 * The frame turning with the drive, |ψ⟩ = e^{−iφσ_z/2}|ψ′⟩, takes it EXACTLY (the drive is circular: no rotating-wave approximation) to H′ = −(δ + βt)/2 σ_z + (Ω/2)σ_x,
 * constant at β = 0, so one step e^{−iH′dt} = cos|n| − i sin|n| n̂·σ is exact over any t; at β ≠ 0 n is the fourth-order Magnus exponent of H′ (linear in t) over steps of dt. */
export const PRESETS = { flop: { O: 0.2, d: 0, b: 0, th: 0, ph: 0 }, larmor: { O: 0, d: 0, b: 0, th: Math.PI / 2, ph: 0 }, rabi: { O: 0.2, d: 0, b: 0, th: 0, ph: 0 }, lz: { O: 0.3, d: -4.5, b: 0.05, th: 0, ph: 0 } };
export const DEFAULTS = { preset: 'flop', w0: 1, ...PRESETS.flop }, DT = 0.05;
export const pulse = (P) => (P.preset === 'flop' && P.O > 0 ? Math.PI / P.O : Infinity);   // FLOP: a π-pulse, Ω on for π/Ω and then off
export const init = (P) => [Math.cos(P.th / 2), 0, Math.sin(P.th / 2) * Math.cos(P.ph), Math.sin(P.th / 2) * Math.sin(P.ph)];   // [Re a, Im a, Re b, Im b] = ψ′(0) = ψ(0)
export function step([ar, ai, br, bi], P, t, dt) {
  const O = t < pulse(P) ? P.O : 0, nx = O * dt / 2, ny = -P.b * O * dt ** 3 / 24, nz = -(P.d + P.b * (t + dt / 2)) * dt / 2, m = Math.hypot(nx, ny, nz), c = Math.cos(m), q = m ? Math.sin(m) / m : 0;
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
