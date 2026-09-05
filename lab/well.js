/* well.js — the infinite spherical well: a particle in a BOX, exactly.  ħ = m = 1, radius a.
 *
 * STATUS: EXACT ANALYTIC (the zeros of the spherical Bessel functions are found numerically to 1e-13, then
 * everything is closed-form).
 *
 *     V = 0 for r < a, ∞ outside.   ψ_{n_r l m} = N_{n_r l} · j_l(k r) · Y_lm  for r < a,  0 outside,
 *     k a = z_{n_r+1, l}  (the (n_r+1)-th zero of j_l),   E = k²/2 = z²/(2a²),
 *     N² = 2 / (a³ j_{l+1}(z)²).
 *
 * The register's 91 labels are reused through n_r = n − l − 1.  The wall is hard: ψ vanishes at r = a and the
 * kernel draws nothing outside.  A slap on the ground state makes a packet that BOUNCES off the wall and
 * disperses (no Ehrenfest miracle here — the box is not quadratic), and with the DRAG toy it settles.
 */
import { BASIS, ylmNorm, legendreDerivCoeffs } from './hydrogen.js';
import { sphericalBessel } from './bessel.js';

const ZEROS = new Map();
/** the first k zeros of j_l, by bracketing on a fine grid then bisection */
export function besselZeros(l, count) {
  const key = l + ':' + count; if (ZEROS.has(key)) return ZEROS.get(key);
  const out = []; let x0 = l + 1e-3 + (l > 0 ? l * 0.5 : 0), f0 = sphericalBessel(l, x0);
  const h = 0.01;
  while (out.length < count) {
    const x1 = x0 + h, f1 = sphericalBessel(l, x1);
    if (f0 === 0) out.push(x0);
    else if (f0 * f1 < 0) { let a = x0, b = x1, fa = f0; for (let i = 0; i < 80; i++) { const m = (a + b) / 2, fm = sphericalBessel(l, m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } out.push((a + b) / 2); }
    x0 = x1; f0 = f1;
    if (x0 > 400) throw new Error('bessel zeros: ran away');
  }
  ZEROS.set(key, out); return out;
}
export const wellZ = (n, l) => besselZeros(l, n - l)[n - l - 1];
export const wellK = (n, l, a) => wellZ(n, l) / a;
export const wellEnergyOf = (n, l, a) => { const k = wellK(n, l, a); return k * k / 2; };
export function wellNorm(n, l, a) { const z = wellZ(n, l); return Math.sqrt(2 / (a * a * a * sphericalBessel(l + 1, z) ** 2)); }
/** R_{nl}(r) = N j_l(k r) inside, 0 outside; ∫ R² r² dr = 1 */
export function wellRadial(n, l, r, a) { if (r >= a) return 0; return wellNorm(n, l, a) * sphericalBessel(l, wellK(n, l, a) * r); }
/** the kernel record for the well: lag0 = (k, a, 0…) — the kernel evaluates j_l itself; the envelope is the wall */
export function wellTable(n, l, m, a) {
  const am = Math.abs(m), leg = legendreDerivCoeffs(l, am);
  const sign = (m >= 0 && (am % 2 === 1)) ? -1 : 1;
  const norm = sign * wellNorm(n, l, a) * ylmNorm(l, am);
  const pad = (v) => { const o = new Float64Array(6); for (let i = 0; i < v.length && i < 6; i++) o[i] = v[i]; return o; };
  return { n, l, m, am, norm, lag: pad([wellK(n, l, a), a, 0, 0, 0, 0]), leg: pad(leg), space: 'well', a };
}
export function wellFromTable(T, x, y, z) {
  const r = Math.hypot(x, y, z);
  if (r >= T.lag[1]) return { re: 0, im: 0 };
  const ct = r < 1e-300 ? 1 : z / r, st = Math.sqrt(Math.max(0, 1 - ct * ct)), phi = Math.atan2(y, x);
  let D = 0, xp = 1; for (let j = 0; j < 6; j++) { D += T.leg[j] * xp; xp *= ct; }
  let stm = 1; for (let i = 0; i < T.am; i++) stm *= st;
  const f = T.norm * sphericalBessel(T.l, T.lag[0] * r) * stm * D;
  return { re: f * Math.cos(T.m * phi), im: f * Math.sin(T.m * phi) };
}
/** the well's radius is a setting; tables and energies are cached per radius */
let RADIUS = 10;
const tcache = new Map();
export function setWellRadius(a) { if (a !== RADIUS) { RADIUS = a; tcache.clear(); } }
export const wellRadius = () => RADIUS;
export function wellTableFor(s) { const key = s.id; let T = tcache.get(key); if (!T) { T = wellTable(s.n, s.l, s.m, RADIUS); tcache.set(key, T); } return T; }
export function wellEnergy(a) { const s = BASIS[a]; return wellEnergyOf(s.n, s.l, RADIUS); }
export function wellPsiAt(re, im, x, y, z, indices) {
  let R = 0, I = 0;
  for (const a of indices) { const c = re[a], d = im[a]; if (c === 0 && d === 0) continue; const v = wellFromTable(wellTableFor(BASIS[a]), x, y, z); R += c * v.re - d * v.im; I += c * v.im + d * v.re; }
  return { re: R, im: I };
}
export const wellDomainFor = () => RADIUS * 1.08;
export const wellRadialFor = (n, l, r) => wellRadial(n, l, r, RADIUS);
/* ── THE GAS: a localised packet in the box.  A Gaussian of width σ at x₀ with momentum k, projected onto the well's
   91 eigenstates on a grid; `captured` is how much of it the register can hold (the box resolves nothing sharper
   than ≈ a/6, the wavelength of its highest state).  The packet is a NEW state — normalised — and it moves and
   bounces by the exact evolution of the truncated register. ── */
export function wellPacket(x0, k, sigma, { G = 36 } = {}) {
  const a = RADIUS, h = 2 * a / G, w = h * h * h;
  const re = new Float64Array(91), im = new Float64Array(91);
  const A = Math.pow(2 * Math.PI * sigma * sigma, -0.75);
  const tabs = BASIS.map((s) => wellTableFor(s));
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) for (let l = 0; l < G; l++) {
    const x = -a + (i + 0.5) * h, y = -a + (j + 0.5) * h, z = -a + (l + 0.5) * h;
    if (x * x + y * y + z * z >= a * a) continue;
    const dx = x - x0[0], dy = y - x0[1], dz = z - x0[2];
    const g = A * Math.exp(-(dx * dx + dy * dy + dz * dz) / (4 * sigma * sigma)), ph = k[0] * x + k[1] * y + k[2] * z;
    const pr = g * Math.cos(ph), pi = g * Math.sin(ph);
    for (let q = 0; q < 91; q++) {
      const v = wellFromTable(tabs[q], x, y, z);                   // ⟨q|packet⟩ = ∫ ψ_q* packet
      if (v.re === 0 && v.im === 0) continue;
      re[q] += w * (v.re * pr + v.im * pi); im[q] += w * (v.re * pi - v.im * pr);
    }
  }
  let captured = 0; for (let q = 0; q < 91; q++) captured += re[q] * re[q] + im[q] * im[q];
  const s = captured > 0 ? 1 / Math.sqrt(captured) : 0;
  for (let q = 0; q < 91; q++) { re[q] *= s; im[q] *= s; }
  return { re, im, captured };
}
/** the centroid ⟨x⟩ of a coefficient vector on the well, by a grid — for the tests and the readouts */
export function wellCentroid(re, im, ids, { G = 40 } = {}) {
  const a = RADIUS, h = 2 * a / G; let sx = 0, sy = 0, sz = 0, den = 0;
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) for (let l = 0; l < G; l++) {
    const x = -a + (i + 0.5) * h, y = -a + (j + 0.5) * h, z = -a + (l + 0.5) * h;
    if (x * x + y * y + z * z >= a * a) continue;
    const v = wellPsiAt(re, im, x, y, z, ids), d = v.re * v.re + v.im * v.im;
    sx += x * d; sy += y * d; sz += z * d; den += d;
  }
  return den > 0 ? [sx / den, sy / den, sz / den] : [0, 0, 0];
}
