/* slice.js — the COMPLEX SLICE: a 2-plane through the wavefunction, domain-coloured, and rotatable by a rotor pair.
 *
 * STATUS: EXACT ANALYTIC sampling (ψ from the closed forms), DESIGN CHOICE colouring (the phase palette).
 *
 * Two planes are offered, and they are different objects:
 *   SPACE  a 2-plane through the origin of ordinary ℝ³, spanned by two orthonormal vectors carried by the rotor.
 *          ψ on it is a complex function of two real coordinates: the ordinary domain-coloured slice.
 *   KS     a 2-plane through the origin of the FOUR-dimensional Kustaanheimo–Stiefel space, mapped down to ℝ³ by
 *          the KS map  x = (u₁²−u₂²−u₃²+u₄², 2(u₁u₂−u₃u₄), 2(u₁u₃+u₂u₄)),  r = |u|².
 *          This is the plane the 4D engine's grand tour rotates, now carrying hydrogen's own 4-space: the rotor
 *          pair moves a genuine point of Gr⁺(2,4).  What the KS map does to that plane is now a THEOREM (Round 10
 *          §2, gated in tests/rotor4.test.mjs): KS(u) = A·(u k ū) with A a fixed half-turn, so the KS fibres are
 *          RIGHT multiplication by k, and the image of the plane is a CONE over a circle — axis A·n₊, half-angle
 *          arccos|n₋z| — with Jacobian singular values 2ρ and 2ρ√(1−n₋z²) at every point.  It never folds: there
 *          is no caustic at any rotor.  It collapses to a single ray iff n₋ = ±ê₃ (the minus sphere at a pole) and
 *          flattens to a whole plane at the minus sphere's equator.  The structure one sees is the modulus contours
 *          of ψ pulled back through a two-to-one quadratic map, plus the exact central symmetry ψ(KS(−u)) = ψ(KS(u)).
 *          (An earlier version of this comment claimed folds "like the Buddhabrot's caustics"; the round refuted it.)
 *
 * The rotor is the 4D engine's (q_L, q_R); driving q_R alone is a HOLOMORPHIC (U(2)) motion — n₊ stands still.
 */
import { BASIS } from './hydrogen.js';
import { psiAndGrad } from './dynamics.js';
import { visibleFrame, adjoint, spherePoint, isHolomorphic } from './rotor4.js';

/** the Kustaanheimo–Stiefel map ℝ⁴ → ℝ³ (r = |u|²) */
export function ksMap(u) {
  return [u[0] * u[0] - u[1] * u[1] - u[2] * u[2] + u[3] * u[3],
    2 * (u[0] * u[1] - u[2] * u[3]),
    2 * (u[0] * u[2] + u[1] * u[3])];
}
/**
 * Sample ψ on the plane and return { re, im, absMax } on an N×N grid over [−half, half]².
 * mode 'space': x = a·e₁ + b·e₂ with (e₁, e₂) = Ad(q_L) of two axes — a plane in ℝ³.
 * mode 'ks'   : u = a·f₁ + b·f₂ with the rotor's visible frame — a plane in the KS 4-space, then x = KS(u).
 */
export function sampleSlice(reg, t, rotor, { mode = 'space', half = 8, N = 96, ids = null }) {
  const c = reg.at(t), list = ids || reg.renderSet().ids;
  const re = new Float64Array(N * N), im = new Float64Array(N * N);
  const { f1, f2 } = visibleFrame(rotor.qL, rotor.qR);
  const e1 = adjoint(rotor.qL, [1, 0, 0]), e2 = adjoint(rotor.qL, [0, 1, 0]);
  let mx = 0;
  const scale = mode === 'ks' ? Math.sqrt(half) : half;      // KS is quadratic: |x| = |u|², so sample √half
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const a = (2 * (i + 0.5) / N - 1) * scale, b = (2 * (j + 0.5) / N - 1) * scale;
    let x, y, z;
    if (mode === 'ks') {
      const u = [a * f1[0] + b * f2[0], a * f1[1] + b * f2[1], a * f1[2] + b * f2[2], a * f1[3] + b * f2[3]];
      const X = ksMap(u); x = X[0]; y = X[1]; z = X[2];
    } else { x = a * e1[0] + b * e2[0]; y = a * e1[1] + b * e2[1]; z = a * e1[2] + b * e2[2]; }
    const s = psiAndGrad(c.re, c.im, list, x, y, z);
    const k = j * N + i;
    if (s) { re[k] = s.re; im[k] = s.im; const m = Math.hypot(s.re, s.im); if (m > mx) mx = m; }
  }
  return { re, im, N, absMax: mx, mode, half };
}
/**
 * Domain-colour a sample into an ImageData: hue from arg ψ through the palette LUT (or the built-in wheel),
 * brightness from |ψ| through the same bounded knee the field uses, so turning the gain up deepens the picture
 * instead of flooding it.  `contours` adds the modulus contour lines that make a domain colouring readable.
 */
export function paintSlice(sample, img, { lut = null, gain = 1, knee = 0.6, contours = true, invert = false }) {
  const { re, im, N, absMax } = sample, d = img.data, mx = absMax || 1;
  for (let k = 0; k < N * N; k++) {
    const x = re[k], y = im[k], m = Math.hypot(x, y) / mx;
    const w = gain * m, v = w / (1 + knee * w);               // the bounded transfer
    let R, G, B;
    const h = (Math.atan2(y, x) / (2 * Math.PI) + 0.5) % 1;
    if (lut) { const u = h * 256, i0 = Math.floor(u) % 256, i1 = (i0 + 1) % 256, f = u - Math.floor(u);
      R = lut[i0 * 4] * (1 - f) + lut[i1 * 4] * f; G = lut[i0 * 4 + 1] * (1 - f) + lut[i1 * 4 + 1] * f; B = lut[i0 * 4 + 2] * (1 - f) + lut[i1 * 4 + 2] * f;
    } else { const q = h * 6, c1 = Math.abs((q % 6) - 3) - 1, c2 = Math.abs(((q + 4) % 6) - 3) - 1, c3 = Math.abs(((q + 2) % 6) - 3) - 1;
      const cl = (u) => Math.min(1, Math.max(0, u)); R = 0.15 + 0.85 * cl(c1); G = 0.15 + 0.85 * cl(c2); B = 0.15 + 0.85 * cl(c3); }
    let s = v / (1 / (1 + knee));                             // normalise the ceiling to 1
    if (contours && m > 1e-9) { const l = Math.log2(m * mx + 1e-30); s *= 0.82 + 0.18 * Math.abs(2 * (l - Math.floor(l)) - 1); }
    let rr = R * s, gg = G * s, bb = B * s;
    if (invert) { rr = 1 - rr; gg = 1 - gg; bb = 1 - bb; }
    d[k * 4] = Math.round(255 * Math.min(1, rr)); d[k * 4 + 1] = Math.round(255 * Math.min(1, gg));
    d[k * 4 + 2] = Math.round(255 * Math.min(1, bb)); d[k * 4 + 3] = 255;
  }
  return img;
}
/** a one-line description of where the plane is looking, for the readout */
export function planeReport(rotor) {
  const { nP, nM } = spherePoint(rotor.qL, rotor.qR);
  return { nP, nM, holomorphic: isHolomorphic(rotor.qL),
    text: `n₊ (${nP.map((v) => v.toFixed(2)).join(', ')})  n₋ (${nM.map((v) => v.toFixed(2)).join(', ')})` };
}
