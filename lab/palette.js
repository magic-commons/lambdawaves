/* palette.js — a colouring of the COMPLEX PLANE: the hue cycle that arg ψ runs through.
 *
 * STATUS: a DESIGN CHOICE, and labelled as one.  A palette is a list of stops around the phase circle,
 *   { at: 0..1, rgb: [r, g, b] }   with at = 0 ↔ arg ψ = −π, at = 0.5 ↔ 0, wrapping at 1,
 * interpolated to a 256-entry lookup table which the FIELD's phase view samples.  Interpolation is done in
 * OKLab, not RGB: a straight RGB blend between two saturated hues passes through a grey, muddy middle, and on a
 * cyclic scale that reads as a false dark band at a phase where nothing is happening.  The palette never touches
 * ψ — it is an observer product, like the camera — and the instrument's own default is the HSV wheel it has
 * always used, so turning the palette OFF restores exactly the old picture.
 *
 * A cyclic palette should return to where it started: `cyclic()` reports the seam size, and the editor shows it,
 * because a discontinuity at the seam draws a false nodal line at arg ψ = ±π.
 */
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

/* ── sRGB ↔ OKLab (Ottosson 2020) ─────────────────────────────────────────── */
function srgbToLinear(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function linearToSrgb(c) { return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }
export function rgbToOklab(rgb) {
  const r = srgbToLinear(rgb[0]), g = srgbToLinear(rgb[1]), b = srgbToLinear(rgb[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
export function oklabToRgb(lab) {
  const l_ = lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2];
  const m_ = lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2];
  const s_ = lab[0] - 0.0894841775 * lab[1] - 1.2914855480 * lab[2];
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return [clamp01(linearToSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    clamp01(linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    clamp01(linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s))];
}
export const hexToRgb = (h) => { const s = h.replace('#', ''); return [parseInt(s.slice(0, 2), 16) / 255, parseInt(s.slice(2, 4), 16) / 255, parseInt(s.slice(4, 6), 16) / 255]; };
export const rgbToHex = (c) => '#' + c.map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0')).join('');

/* ── the palette ──────────────────────────────────────────────────────────── */
/** normalise, sort and de-duplicate a stop list */
export function normalize(stops) {
  const s = stops.map((x) => ({ at: ((x.at % 1) + 1) % 1, rgb: x.rgb.slice(0, 3).map(clamp01) })).sort((a, b) => a.at - b.at);
  return s.length ? s : [{ at: 0, rgb: [1, 1, 1] }];
}
/** the 256×RGBA lookup table, interpolated in OKLab around the circle (index 0 ↔ arg ψ = −π) */
export function toLUT(stops, out) {
  const s = normalize(stops), lut = out || new Float32Array(256 * 4);
  const labs = s.map((x) => rgbToOklab(x.rgb));
  for (let i = 0; i < 256; i++) {
    const u = i / 256;
    let k = -1;
    for (let j = 0; j < s.length; j++) if (s[j].at <= u) k = j;
    const a = k < 0 ? s.length - 1 : k, b = (a + 1) % s.length;
    let span = s[b].at - s[a].at; if (span <= 0) span += 1;
    let d = u - s[a].at; if (d < 0) d += 1;
    const f = span > 0 ? d / span : 0;
    const c = oklabToRgb([labs[a][0] + (labs[b][0] - labs[a][0]) * f, labs[a][1] + (labs[b][1] - labs[a][1]) * f, labs[a][2] + (labs[b][2] - labs[a][2]) * f]);
    lut[i * 4] = c[0]; lut[i * 4 + 1] = c[1]; lut[i * 4 + 2] = c[2]; lut[i * 4 + 3] = 1;
  }
  return lut;
}
/** the seam: how far the palette is from closing on itself (0 = perfectly cyclic) */
export function cyclic(stops) {
  const lut = toLUT(stops);
  const a = [lut[255 * 4], lut[255 * 4 + 1], lut[255 * 4 + 2]], b = [lut[0], lut[1], lut[2]];
  const la = rgbToOklab(a), lb = rgbToOklab(b);
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}
/** the built-in wheel the instrument has always used, as stops (so the editor can start from it) */
export function hsvWheel(n = 6, s = 0.85, v = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const h = i / n, k = [h * 6 % 6, (h * 6 + 4) % 6, (h * 6 + 2) % 6];
    const c = k.map((x) => clamp01(Math.abs(x - 3) - 1));
    out.push({ at: h, rgb: c.map((x) => v * (1 - s + s * x)) });
  }
  return out;
}
export const PRESETS = [
  { id: 'wheel', label: 'HSV wheel (the built-in)', stops: hsvWheel() },
  { id: 'twilight', label: 'twilight', stops: [{ at: 0, rgb: hexToRgb('#e2d9e2') }, { at: 0.25, rgb: hexToRgb('#7c5fa8') }, { at: 0.5, rgb: hexToRgb('#1c2140') }, { at: 0.75, rgb: hexToRgb('#3f8fa0') }] },
  { id: 'ember', label: 'ember', stops: [{ at: 0, rgb: hexToRgb('#fff0c8') }, { at: 0.25, rgb: hexToRgb('#ff8a3d') }, { at: 0.5, rgb: hexToRgb('#8c1f4a') }, { at: 0.75, rgb: hexToRgb('#2a1b4a') }] },
  { id: 'sea', label: 'sea', stops: [{ at: 0, rgb: hexToRgb('#eafff4') }, { at: 0.25, rgb: hexToRgb('#37c1a8') }, { at: 0.5, rgb: hexToRgb('#0b3d63') }, { at: 0.75, rgb: hexToRgb('#7a5cc0') }] },
  { id: 'lambda', label: 'λWAVES', stops: [{ at: 0, rgb: hexToRgb('#5ee7d8') }, { at: 0.2, rgb: hexToRgb('#f5f7fa') }, { at: 0.45, rgb: hexToRgb('#d97ce8') }, { at: 0.62, rgb: hexToRgb('#2b3f7a') }, { at: 0.82, rgb: hexToRgb('#ffb35c') }] },
  { id: 'bipolar', label: 'bipolar (Re/Im legible)', stops: [{ at: 0, rgb: hexToRgb('#2b7fff') }, { at: 0.25, rgb: hexToRgb('#f2f2f2') }, { at: 0.5, rgb: hexToRgb('#ff8a29') }, { at: 0.75, rgb: hexToRgb('#111417') }] },
];
export const PRESET_BY_ID = new Map(PRESETS.map((p) => [p.id, p]));
