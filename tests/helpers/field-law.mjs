/* tests/helpers/field-law.mjs — THE FIELD LAW'S CONSTANTS (0.5.4 P7c, ruled in research/release-0.5.4/PLAN.md §J-2).  ONE place the
 * picture's numbers live: tests/field-law.browser-test.mjs asserts them on the shipped texels, README's sentence and lab/field.js' texel
 * comment state them, and P4's statusOf table test reads them from here — nobody types them twice.
 *
 * THE LAW is what the texel IS: every stored rgba16float component lies within ONE f16 ulp (the f16 grid's spacing at the value; 2⁻²⁴ in
 * the subnormal range) of the kernel's f32 value — so of its f64 value to one ulp plus the kernel's own f32 error, `f32` (relative; lab/field.js:
 * "f32-accurate to about 1e-6 relative"), which is all that separates the 46 of 1,048,576 components found 1.0005–1.0008 ulp from their f64
 * value.  A per-voxel "good to 2e-5" is not what an f16 store gives — this rig's store rounds TOWARD ZERO (measured), so a full ulp, not half
 * of one, is the per-component bound (≤ 2⁻¹⁰ ≈ 1e-3 of a normal value).  The readings are each stated in their own metric:
 *   hydrogen (1s+2pz at 64³, t = 3.7 a.u., ψ against the CPU closed form):  |Δψ| RMS · the 99.8 %-of-voxels figure · the worst voxel ·
 *            the worst voxel over max|ψ|;
 *   density  (H₂O STO-3G at 64³, ρ = .r² against lab/molecular-field.js' f64 evaluator of a CPU solve):  |Δρ|/ρ RMS · 99.8 %-of-voxels ·
 *            the worst voxel (f16-normal √ρ) · the worst |Δρ| over ρmax.
 * Each constant is an upper bound the gate asserts, rounded up from the reading on the rig (RTX 3070, Firefox; PAIR-B-BUILD.md §4). */
export const FIELD_LAW = Object.freeze({
  ulps: 1, f32: 1e-6,            // THE LAW: |stored − f64| ≤ 1 f16 ulp + f32·|f64|, every component, both molecules
  p: 0.998,                      // the "99.8 % of voxels" quantile
  hydrogen: Object.freeze({ preset: '1s+2pz', N: 64, t: 3.7, rms: 3e-6, p998: 2e-5, worst: 2e-4, relToMax: 1e-3 }),     // read 2.34e-6 · 1.88e-5 · 1.68e-4 · 6.42e-4
  density: Object.freeze({ molecule: 'H2O', N: 64, rms: 1e-3, p998: 2e-3, worst: 2e-3, relToRhoMax: 3e-4 }),         // read 8.31e-4 · 1.85e-3 · 1.94e-3 · 2.86e-4
});

/* the f16 arithmetic, written as plain function declarations so the gate can inject their source into the page (`${f16}`) */
/** an f16 bit pattern → its value */
export function f16(h) { const s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 31, m = h & 1023; return e === 0 ? s * m * 2 ** -24 : e === 31 ? (m ? NaN : s * Infinity) : s * (1 + m / 1024) * 2 ** (e - 15); }
/** the f16 grid's spacing at |x|: 2^(⌊log₂|x|⌋ − 10) for a normal value, 2⁻²⁴ below 2⁻¹⁴ */
export function ulp16(x) { const a = Math.abs(x); if (a < 2 ** -14) return 2 ** -24; let e = Math.floor(Math.log2(a)); if (2 ** e > a) e--; else if (2 ** (e + 1) <= a) e++; return 2 ** (e - 10); }
/** x's f16 value under a rounding mode: 'rtz' (toward zero) or 'rne' (to nearest, ties to even) */
export function toF16(x, mode) { const a = Math.abs(x); if (!(a > 0) || !Number.isFinite(a)) return x; const u = ulp16(a); let q = Math.floor(a / u) * u; const r = a - q;
  if (mode === 'rne' && (r > u / 2 || (r === u / 2 && Math.floor(q / u) % 2 === 1))) q += u; return Math.sign(x) * q; }
