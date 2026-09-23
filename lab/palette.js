/* palette.js — a colouring of the COMPLEX PLANE: the hue cycle that arg ψ runs through.
 *
 * STATUS: a DESIGN CHOICE, and labelled as one.  A palette is a list of stops around the phase circle,
 *   { at: 0..1, rgb: [r, g, b] }   with at = 0 ↔ arg ψ = −π, at = 0.5 ↔ 0, wrapping at 1,
 * interpolated to a 256-entry lookup table which WAVE's phase, density, signed and difference views sample.
 * Density uses the zero-phase seat; signed and difference views use the opposite ±π/2 seats. Interpolation is done in
 * OKLab, not RGB: a straight RGB blend between two saturated hues passes through a grey, muddy middle, and on a
 * cyclic scale that reads as a false dark band at a phase where nothing is happening.  The palette never touches
 * ψ — it is an observer product, like the camera — and turning the palette OFF restores each view's original colours.
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

/* ── WAVE 57 · A FLOOR FOR A MARK DRAWN IN A COLOUR NOBODY CHOSE ────────────────────────────────────
 * A palette sample is a colour picked for a PHASE, not for a ground, and any wheel angle can land on the
 * luminance of the surface it is about to be drawn on.  Measured over 23 palettes × 360° the header λ —
 * which takes `wheelColor(0)` verbatim — reaches 1.00 : 1 on BOTH stages (`ember` @0° on light,
 * `aurora` @6° on dark): the same luminance as the ground, i.e. the mark is not there at all.
 * `legible()` in rack.js is the wrong instrument for this: it CLAMPS every colour into a lightness band
 * whether it needed it or not, which is a blanket flattening, and its band is not a contrast guarantee.
 * This is the smallest thing that guarantees the mark can be SEEN:
 *   — HUE AND CHROMA ARE NEVER TOUCHED.  Only OKLab L moves, so the palette's character is exactly kept.
 *   — IT IS A NO-OP when the colour already clears the floor (about half the wheel on light, two thirds
 *     on dark), so a vivid mark stays exactly as vivid as it was.
 *   — WHEN IT DOES MOVE it stops at the FIRST L that clears the floor and no further: away from the
 *     ground (down on a light ground, up on a dark one), 0.005 L at a time.
 * `floor` is a WCAG 2.x ratio.  3 : 1 is the non-text / graphical-object floor and the right one for a
 * logotype (1.4.11 exempts logotypes outright — this floor is a choice, not a debt). */
const RGB_LIN = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
/** WCAG 2.x relative luminance of an rgb triple in 0…1 */
export const relLuminance = (c) => 0.2126 * RGB_LIN(clamp01(c[0])) + 0.7152 * RGB_LIN(clamp01(c[1])) + 0.0722 * RGB_LIN(clamp01(c[2]));
/** the WCAG contrast ratio between two rgb triples in 0…1 */
export function contrastRatio(a, b) { const x = relLuminance(a), y = relLuminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
/* ── WAVE 59 · WHICH WAY IS "AWAY FROM THE GROUND" ────────────────────────────────────────────────────
 * The walk's direction was chosen at relative luminance 0.5, which is the midpoint of the SCALE and not
 * the break-even of the RATIO.  White and black give equal contrast where 1.05/(x + 0.05) = (x + 0.05)/0.05,
 * i.e. x = √0.0525 − 0.05 = 0.1791287847, and at that ground BOTH reach 4.58 : 1 — so with this constant
 * the better direction is always taken and a 3 : 1 floor is reachable from EVERY ground.  With 0.5 a
 * ground in (0.179, 0.5) sent the walk UP toward white, where the best available contrast is under the
 * floor, and the function returned a colour that did not clear it AND SAID NOTHING.
 * Both real grounds of wave 57 (0.0029 and 0.85) sit far outside that band, which is why the defect was
 * invisible then — but wave 59 makes one of the two grounds the LIVE STAGE knob, whose travel runs
 * straight through it (STAGE 0.6 is luminance 0.30), so the band became reachable by a drag.
 * MEASURED, both thresholds, over 23 palettes × 360 hues × 11 stage values × 2 themes = 91 080 samples:
 *   0.5              7 416 under the floor, worst 1.686 : 1  (wheel @301°, STAGE 0.6)
 *   0.1791287847         0 under the floor, worst 3.000 : 1  — the floor, exactly, which is what a floor is
 * and nothing on the card grounds moves (0 under the floor before and after, worst 3.000 : 1 both ways). */
const INK_BREAKEVEN = Math.sqrt(0.0525) - 0.05;                              // 0.1791287847 — where white and black tie
/** visibleInk(rgb, ground, floor) — the same hue and chroma, at the nearest lightness that clears `floor` */
export function visibleInk(rgb, ground, floor = 3) {
  if (contrastRatio(rgb, ground) >= floor) return rgb;
  const lab = rgbToOklab(rgb), up = relLuminance(ground) < INK_BREAKEVEN ? 1 : -1;   // a dark ground wants a lighter mark, a light ground a darker one
  for (let k = 1; k <= 200; k++) {
    const L = clamp01(lab[0] + up * k * 0.005), c = oklabToRgb([L, lab[1], lab[2]]);
    if (contrastRatio(c, ground) >= floor) return c;
    if (L <= 0 || L >= 1) break;
  }
  return oklabToRgb([up > 0 ? 1 : 0, lab[1], lab[2]]);                        // the end of the walk: never reached in the 23 × 360 × 2 sweep, and it is still this hue
}

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
/* ── the catalogue ─────────────────────────────────────────────────────────
 * Every preset carries, beside its stops, four claims the proof checks (tests/palette.test.mjs):
 *   points  the number of stops — the MENU GROUPS ON THIS, 3 · 4 · 5 · 6 · 8 points round the circle
 *   constL  the OKLab lightness is the same all the way round (hue alone carries phase, the honest
 *           choice for a phase map and the reason `phase`-type maps exist); the proof holds L to 0.01
 *   harsh   deliberately high-contrast, for reading nodal structure rather than for looking at
 *   cvd     opposite phases still differ by ≥ 0.10 in OKLab under a DEUTERANOPE simulation
 *           (Viénot–Brettel–Mollon 1999).  Measured, not asserted: most palettes are `false`, and an
 *           isoluminant one is necessarily false — hue is all it has, and red-green is what is gone.
 * Provenance is on every palette in one line.  Where a real scheme is named it has been ADAPTED —
 * re-seated in OKLab, re-spaced, closed on itself — never lifted whole; where a spectral line is named
 * the colour was computed from the CIE 1931 colour-matching functions, not eyeballed.
 */
/** a cyclic palette from evenly spaced hex stops — the count IS the `points` the menu groups on */
const ring = (...hex) => hex.map((h, i) => ({ at: i / hex.length, rgb: hexToRgb(h) }));

export const PRESETS = [
  /* ── the six the instrument shipped with (stops untouched; the claims below are measured) ────── */
  { id: 'wheel', label: 'HSV wheel (the built-in)', points: 6, constL: false, harsh: false, cvd: true,
    note: 'the built-in HSV cycle, written out as stops',
    stops: hsvWheel() },
  { id: 'twilight', label: 'twilight', points: 4, constL: false, harsh: false, cvd: false,
    note: 'pale · violet · night · teal', stops: [{ at: 0, rgb: hexToRgb('#e2d9e2') }, { at: 0.25, rgb: hexToRgb('#7c5fa8') }, { at: 0.5, rgb: hexToRgb('#1c2140') }, { at: 0.75, rgb: hexToRgb('#3f8fa0') }] },
  { id: 'ember', label: 'ember', points: 4, constL: false, harsh: false, cvd: false,
    note: 'the fire scale, closed through indigo', stops: [{ at: 0, rgb: hexToRgb('#fff0c8') }, { at: 0.25, rgb: hexToRgb('#ff8a3d') }, { at: 0.5, rgb: hexToRgb('#8c1f4a') }, { at: 0.75, rgb: hexToRgb('#2a1b4a') }] },
  { id: 'sea', label: 'sea', points: 4, constL: false, harsh: false, cvd: false,
    note: 'foam · shallows · deep · violet', stops: [{ at: 0, rgb: hexToRgb('#eafff4') }, { at: 0.25, rgb: hexToRgb('#37c1a8') }, { at: 0.5, rgb: hexToRgb('#0b3d63') }, { at: 0.75, rgb: hexToRgb('#7a5cc0') }] },
  { id: 'lambda', label: 'λWAVES', points: 5, constL: false, harsh: false, cvd: true,
    note: 'the house palette', stops: [{ at: 0, rgb: hexToRgb('#5ee7d8') }, { at: 0.2, rgb: hexToRgb('#f5f7fa') }, { at: 0.45, rgb: hexToRgb('#d97ce8') }, { at: 0.62, rgb: hexToRgb('#2b3f7a') }, { at: 0.82, rgb: hexToRgb('#ffb35c') }] },
  { id: 'bipolar', label: 'bipolar (Re/Im legible)', points: 4, constL: false, harsh: false, cvd: true,
    note: 'the real axis white↔black, the imaginary axis blue↔orange', stops: [{ at: 0, rgb: hexToRgb('#2b7fff') }, { at: 0.25, rgb: hexToRgb('#f2f2f2') }, { at: 0.5, rgb: hexToRgb('#ff8a29') }, { at: 0.75, rgb: hexToRgb('#111417') }] },

  /* ── 3 points ───────────────────────────────────────────────────────────────────────────────── */
  /* PROVENANCE: the display's own three primaries (sRGB red, green, blue) dragged to ONE OKLab lightness,
     L 0.62 at chroma 0.165 — the isoluminant triad behind the CET isoluminant cyclic maps.  CONSTANT
     LIGHTNESS (measured 0.001).  A triangle cuts the chroma circle, so saturation dips to about half
     between stops while L holds — the price of three points, and the reason the 6-point `carousel` exists.
     CVD: NOT safe — opposite phases differ by 0.006 under a deuteranope simulation. */
  { id: 'beacon', label: 'beacon', points: 3, constL: true, harsh: false, cvd: false,
    note: 'the three primaries at one lightness — hue alone carries phase', stops: ring('#d75748', '#3e9e39', '#5280e8') },
  /* PROVENANCE: the pale end of the same isoluminant family — a pastel triad at L 0.82, chroma 0.09.
     CONSTANT LIGHTNESS (measured 0.001).  The quietest palette here: opposite phases differ by only 0.117,
     which is the point (nothing shouts) and also its limit.  CVD: NOT safe — 0.003 to a deuteranope. */
  { id: 'opal', label: 'opal', points: 3, constL: true, harsh: false, cvd: false,
    note: 'a pale isoluminant triad — the quietest phase map here', stops: ring('#f9adac', '#a5d39b', '#a2c5ff') },
  /* PROVENANCE: the three discharge lines a lab actually owns — sodium D 589.0 nm, mercury 546.1 nm and
     mercury 435.8 nm — rendered from the CIE 1931 colour-matching functions (the Wyman–Sloan–Shirley
     Gaussian fits), desaturated into sRGB, then re-seated at a cycle's lightnesses (0.80 / 0.72 / 0.42:
     sodium is the bright one, as it is on the bench).  CVD: NOT safe — 0.028 to a deuteranope. */
  { id: 'gaslamp', label: 'gas lamp', points: 3, constL: false, harsh: false, cvd: false,
    note: 'sodium 589 · mercury 546 · mercury 436, from the CIE 1931 CMFs', stops: ring('#fca864', '#54bf5c', '#5c10b4') },

  /* ── 4 points ───────────────────────────────────────────────────────────────────────────────── */
  /* PROVENANCE: the magenta–yellow–green–blue hue order of CET-C2 (Peter Kovesi's cyclic set), evenly
     spaced round the circle and held at one OKLab lightness, L 0.72 chroma 0.155.  CONSTANT LIGHTNESS
     (measured 0.001).  CVD: NOT safe — 0.006 to a deuteranope. */
  { id: 'pinwheel', label: 'pinwheel', points: 4, constL: true, harsh: false, cvd: false,
    note: 'CET-C2\'s magenta–yellow–green–blue, at one lightness', stops: ring('#da7ed2', '#e98a29', '#4fbf6e', '#26affb') },
  /* PROVENANCE: the four quadrants of the complex plane put at the display's own extremes — white,
     magenta, black, green — a deliberately harsher sibling of the shipped `bipolar`.  HARSH: lightness
     runs the full range (0.900) and the π jump across a node lands on white↔black, so a nodal surface
     snaps rather than fades.  CVD: SAFE — 0.174 to a deuteranope (white↔black survives everything). */
  { id: 'quadrant', label: 'quadrant', points: 4, constL: false, harsh: true, cvd: true,
    note: 'white · magenta · black · green — harsh, for reading nodal structure', stops: ring('#ffffff', '#b716b2', '#020309', '#43c251') },
  /* PROVENANCE: the auroral emission lines — O I 557.7 nm green, O I 630.0 nm red, N₂⁺ 427.8 nm violet —
     rendered from the CIE 1931 CMFs over a night sky.  HONEST NOTE: 557.7 nm renders yellow-green
     (#99ff00) from the CMFs; the stop is pulled toward the green a dark-adapted eye actually reports,
     which is mesopic vision, not colorimetry.  CVD: NOT safe — 0.089, just under the 0.10 gate. */
  { id: 'aurora', label: 'aurora', points: 4, constL: false, harsh: false, cvd: false,
    note: 'night · 427.8 nm violet · 630.0 nm red · 557.7 nm green', stops: ring('#01051b', '#6421bf', '#cc243d', '#7fec66') },
  /* PROVENANCE: the earthy cyclic scientific colour maps (Fabio Crameri's romaO family) — red-brown,
     sand, green, deep blue — re-seated in OKLab at low chroma so nothing in it can shout.
     CVD: NOT safe — 0.065 to a deuteranope. */
  { id: 'terra', label: 'terra', points: 4, constL: false, harsh: false, cvd: false,
    note: 'the earthy cyclic maps: brown · sand · green · deep blue', stops: ring('#753a24', '#e9ca89', '#579766', '#143c62') },
  /* PROVENANCE: colour-negative film — the three subtractive dye layers (cyan, magenta, yellow) and the
     orange base mask that sits under all of them.  The narrowest lightness range of the sixteen (0.350),
     which is what makes it read as film rather than as relief.
     CVD: SAFE — 0.181 to a deuteranope (the mask and the cyan sit on the blue-yellow axis). */
  { id: 'emulsion', label: 'emulsion', points: 4, constL: false, harsh: false, cvd: true,
    note: 'the film dyes and the orange base mask', stops: ring('#c56c21', '#f7e04f', '#39b7cb', '#b73095') },

  /* ── 5 points ───────────────────────────────────────────────────────────────────────────────── */
  /* PROVENANCE: the FLIR-style ironbow thermal ramp (a 433-entry table), sampled at five anchors and
     re-seated in OKLab — black-indigo, violet, magenta, orange, gold.  A thermal ramp is not cyclic, so
     the long fall from gold back to black is the cold half of the circle: it is the biggest leg in the
     catalogue (0.809 stop-to-stop) but it is a neutral ramp, and the LUT still moves by only 0.016 a
     step.  CVD: SAFE — 0.130 to a deuteranope. */
  { id: 'hotiron', label: 'hot iron', points: 5, constL: false, harsh: false, cvd: true,
    note: 'the thermal ironbow, closed through its own cold end', stops: ring('#030113', '#3b0788', '#b40290', '#f17119', '#fbd530') },
  /* PROVENANCE: CRT phosphor colours from the tube tables — P31 green (the oscilloscope), P1 yellow-green,
     P12 orange (radar's long persistence) and P7's blue flash — laid round a dark screen.
     CVD: NOT safe — 0.048 to a deuteranope (green and orange are the whole quarrel). */
  { id: 'phosphor', label: 'phosphor', points: 5, constL: false, harsh: false, cvd: false,
    note: 'dark screen · P31 · P1 · P12 · P7 — the tube phosphors', stops: ring('#091a11', '#31d96d', '#e8f865', '#fc9e47', '#6741ca') },
  /* PROVENANCE: a 12th-century rose window — Chartres cobalt, ruby, amber, emerald, and the lead came
     between them.  The lead is a real stop, not a seam: it is the dark quarter of the circle.
     CVD: NOT safe — 0.019 to a deuteranope, the worst of the sixteen (ruby and emerald sit on the axis
     that is gone, and they are antipodal here). */
  { id: 'rosewindow', label: 'rose window', points: 5, constL: false, harsh: false, cvd: false,
    note: 'ruby · amber · emerald · lead · cobalt', stops: ring('#a00e1c', '#f3b94c', '#1c985a', '#031222', '#1f47bc') },
  /* PROVENANCE: the five colours of the international maritime signal flags — white, blue, black, red,
     yellow — a set chosen to stay apart at a distance, at sea, in bad light.  Their ORDER round the
     circle is not the flags': of the 24 distinct orders it is the one whose opposite phases stay
     furthest apart under a deuteranope simulation.  HARSH: lightness range 0.821.
     CVD: SAFE — 0.220 to a deuteranope. */
  { id: 'signalflag', label: 'signal flag', points: 5, constL: false, harsh: true, cvd: true,
    note: 'the five maritime flag colours — harsh, and legible at a distance', stops: ring('#ffffff', '#0a2f8f', '#111111', '#cf142b', '#f9d616') },

  /* ── 6 points ───────────────────────────────────────────────────────────────────────────────── */
  /* PROVENANCE: the visible spectrum itself — 440, 480, 510, 570 and 600 nm rendered from the CIE 1931
     CMFs and desaturated into sRGB — closed through the non-spectral line of purples, which is the only
     way a spectrum can be made cyclic at all.  Its lightness swing is the spectrum's own (yellow is
     bright, violet is dark), so it paints a real brightness structure the phase does not have.
     CVD: SAFE — 0.213 to a deuteranope. */
  { id: 'prism', label: 'prism', points: 6, constL: false, harsh: false, cvd: true,
    note: '440 · 480 · 510 · 570 · 600 nm, closed through the purples', stops: ring('#813ae6', '#2bb0f7', '#46fdbe', '#feff4b', '#f95f24', '#c61583') },
  /* PROVENANCE: the hue circle at six even steps, all at one OKLab lightness (L 0.70, chroma 0.112 — the
     most chroma the sRGB gamut allows at that L for the worst hue on the ring, which is the blue-cyan).
     CONSTANT LIGHTNESS (measured 0.001), and with six points the chroma dip between stops is small, so
     this is the most honest phase map in the catalogue: hue is the ONLY thing that moves.
     CVD: NOT safe — 0.004 to a deuteranope, which is the price of that honesty. */
  { id: 'carousel', label: 'carousel', points: 6, constL: true, harsh: false, cvd: false,
    note: 'the hue circle at one lightness — hue is the only thing that moves', stops: ring('#db8181', '#c39645', '#78b06c', '#25b3ba', '#759fe4', '#bd87ca') },
  /* PROVENANCE: the oxidation sequence of copper — tenorite black, cuprite red, bright metal, brass,
     verdigris, azurite: a real material running through a real order.
     CVD: SAFE — 0.125 to a deuteranope. */
  { id: 'patina', label: 'patina', points: 6, constL: false, harsh: false, cvd: true,
    note: 'copper oxidising: tenorite · cuprite · metal · brass · verdigris · azurite', stops: ring('#180806', '#742f25', '#d78951', '#e9d487', '#65b090', '#194f81') },

  /* ── 8 points ───────────────────────────────────────────────────────────────────────────────── */
  /* PROVENANCE: the EBU 75 % colour bars, verbatim (#bf0000, #bfbf00, #00bf00, #bfbfbf, #00bfbf,
     #0000bf, #000000, #bf00bf), REORDERED round the hue circle with the pattern's own white and black
     dropped in where the ramp needs a break — in the broadcast order the path crosses itself twice
     through grey and two opposite phases come out the same colour.  HARSH and deliberately
     un-perceptual: the steps are what a test pattern is for, and a nodal line has nowhere to hide.
     CVD: SAFE — 0.224 to a deuteranope, the best of the sixteen. */
  { id: 'testcard', label: 'test card', points: 8, constL: false, harsh: true, cvd: true,
    note: 'the EBU 75 % bars, reordered round the circle — harsh on purpose', stops: ring('#bf0000', '#bfbf00', '#00bf00', '#bfbfbf', '#00bfbf', '#0000bf', '#000000', '#bf00bf') },
  /* PROVENANCE: the pigments of Edo-period woodblock printing — beni (safflower), tan (red lead), ukon
     (turmeric), moegi, asagi, bero-ai (Prussian blue, in quantity from about 1829), sumi ink and
     murasaki — put in hue order round the circle.  Eight points and low chroma: the smoothest of the
     catalogue at 0.311 stop-to-stop.  CVD: NOT safe — 0.081 to a deuteranope, under the 0.10 gate. */
  { id: 'ukiyo', label: 'ukiyo', points: 8, constL: false, harsh: false, cvd: false,
    note: 'the woodblock pigments: beni · tan · ukon · moegi · asagi · bero-ai · sumi · murasaki',
    stops: ring('#cb5e73', '#ce7a3b', '#e8cd62', '#668e4f', '#49a8b3', '#10427b', '#0f1624', '#723c7e') },


  /* PROVENANCE: the three subtractive process printing primaries (process cyan, process yellow, process magenta)
     pushed to maximum sRGB gamut saturation at each hue angle.
     MEASURED: seam 0.0052, LUT step 0.0055, leg 0.458, L range 0.287, anti 0.210, anti(deut) 0.171.
     CVD: SAFE — opposite phases separated by 0.171 under deuteranope simulation (cyan-magenta lands on the blue-yellow axis).
     FOR: high-visibility tracking of phase singularities and circulating vortex cores in low-density wavepacket skirts. */
  {
    id: 'cym',
    label: 'cym',
    points: 3,
    constL: false,
    harsh: false,
    cvd: true,
    note: 'cyan · yellow · magenta — the pure process primary triad, maximally saturated',
    stops: ring('#00e5ff', '#ffee00', '#ff007f')
  },
  /* PROVENANCE: the core-collapse supernova shock breakout sequence — ionizing extreme-UV/X-ray flash (#280456),
     radioactive Co-56/Fe-56 decay gold (#ffd000), H-α circumstellar blast magenta (#ff0055), and cold outer interstellar cyan (#00f5d4).
     MEASURED: seam 0.0104, LUT step 0.0109, leg 0.695, L range 0.627, anti 0.140, anti(deut) 0.133.
     CVD: SAFE — opposite phases separated by 0.133 under deuteranope simulation.
     FOR: high-velocity Rydberg wavepacket collisions and violent multi-harmonic radial breathing beats. */
  {
    id: 'supernova',
    label: 'supernova',
    points: 4,
    constL: false,
    harsh: false,
    cvd: true,
    note: 'X-ray breakout violet · Co-56 gold · H-α blast magenta · circumstellar cyan',
    stops: ring('#280456', '#ffd026', '#ff0055', '#00f5d4')
  },
  /* PROVENANCE: the standard ISO 2846 four-colour process printing set with key black anchoring the fourth quadrant.
     HARSH: lightness range 0.778 (≥ 0.75) and maximum stop step 0.805 (≥ 0.60) — snaps sharply across phase quadrants.
     MEASURED: seam 0.0110, LUT step 0.0126, leg 0.805, L range 0.778, anti 0.198, anti(deut) 0.206.
     CVD: SAFE — 0.206 to a deuteranope (black and yellow provide unshakeable lightness contrast).
     FOR: harsh, unambiguous delineation of phase quadrant boundaries and sharp nodal intersections. */
  {
    id: 'cmyk',
    label: 'cmyk',
    points: 4,
    constL: false,
    harsh: true,
    cvd: true,
    note: 'process cyan · process magenta · process yellow · key black — high-contrast print quadrant',
    stops: ring('#00e5ff', '#ff007f', '#ffee00', '#0b0c10')
  },
  /* PROVENANCE: shortwave ultraviolet (254 nm / 365 nm) mineral luminescence under Wood\'s lamp —
     Franklin willemite (#00ff7f), Terlingua calcite (#ff3c00), scheelite (#00d4ff), and dark filter glass (#1a023b).
     MEASURED: seam 0.0099, LUT step 0.0118, leg 0.754, L range 0.682, anti 0.160, anti(deut) 0.116.
     CVD: SAFE — 0.116 under deuteranope simulation.
     FOR: highlighting faint outer orbital lobes and subtle phase fringes against dark backgrounds. */
  {
    id: 'ultraviolet',
    label: 'ultraviolet',
    points: 4,
    constL: false,
    harsh: false,
    cvd: true,
    note: 'Wood\'s glass deep UV · willemite green · calcite flame · scheelite sky cyan',
    stops: ring('#1a023b', '#00ff7f', '#ff3c00', '#00d4ff')
  },
  /* PROVENANCE: the four visible emission lines of atomic hydrogen\'s Balmer series rendered from the CIE 1931 CMFs
     (H-α 656.3 nm, H-β 486.1 nm, H-γ 434.0 nm, H-δ 410.2 nm), completed around the hue circle via the non-spectral purple line.
     MEASURED: seam 0.0076, LUT step 0.0076, leg 0.389, L range 0.274, anti 0.332, anti(deut) 0.144.
     CVD: SAFE — 0.144 to a deuteranope.
     FOR: hydrogen dipole transition beats and radiating state demonstrations. */
  {
    id: 'balmer',
    label: 'balmer',
    points: 5,
    constL: false,
    harsh: false,
    cvd: true,
    note: 'H-α 656.3 nm · H-β 486.1 nm · H-γ 434.0 nm · H-δ 410.2 nm, closed through the purple line',
    stops: ring('#ff1844', '#a300ba', '#1b2ae8', '#00b4d8', '#02c39a')
  },
  /* PROVENANCE: cold-cathode noble gas discharge tube spectra — pure neon 640.2 nm red, helium 587.6 nm yellow-gold,
     argon-mercury 435.8 nm cyan, krypton 557.0 nm green, and xenon 467.1 nm violet.
     MEASURED: seam 0.0063, LUT step 0.0094, leg 0.474, L range 0.342, anti 0.283, anti(deut) 0.191.
     CVD: SAFE — 0.191 under deuteranope simulation.
     FOR: circulating probability currents, phase vortices, and angular momentum demonstrations. */
  {
    id: 'neon',
    label: 'neon',
    points: 5,
    constL: false,
    harsh: false,
    cvd: true,
    note: 'neon orange-red · helium gold · argon-mercury cyan · krypton green · xenon violet',
    stops: ring('#ff007f', '#7f00ff', '#00f0ff', '#39ff14', '#ffb72a')
  },
  /* PROVENANCE: standard laboratory continuous-wave laser wavelengths (405.0 nm, 488.0 nm, 532.0 nm, 577.0 nm, 632.8 nm)
     matched to their perceived monochromatic sRGB chromaticities and closed across the purple boundary.
     MEASURED: seam 0.0080, LUT step 0.0082, leg 0.411, L range 0.451, anti 0.310, anti(deut) 0.175.
     CVD: SAFE — 0.175 under deuteranope simulation.
     FOR: two-level Rabi oscillations, Stark rotations, and coherent laser-driven superpositions. */
  {
    id: 'lasers',
    label: 'lasers',
    points: 5,
    constL: false,
    harsh: false,
    cvd: true,
    note: '405 nm GaN diode · 488 nm Ar⁺ · 532 nm Nd:YAG · 577 nm OPSL yellow · 633 nm HeNe',
    stops: ring('#6400e4', '#00c3ff', '#00e676', '#ffea00', '#ff1744')
  },
  /* PROVENANCE: bathypelagic marine and terrestrial bioluminescent emission spectra — Aequorea victoria GFP 509 nm,
     bacterial luciferase 490 nm, dinoflagellate 470 nm, firefly luciferin 560 nm, and ocean abyss midnight black.
     MEASURED: seam 0.0052, LUT step 0.0137, leg 0.702, L range 0.728, anti 0.157, anti(deut) 0.105.
     CVD: SAFE — 0.105 to a deuteranope.
     FOR: high-|m| extremal toroids, levitating rings, and delicate topological reconnection filaments. */
  {
    id: 'biolum',
    label: 'biolum',
    points: 5,
    constL: false,
    harsh: false,
    cvd: true,
    note: 'abyssal black · dinoflagellate cyan · GFP green · firefly luciferin · coelenterazine indigo',
    stops: ring('#020b1e', '#00e5ff', '#00ff88', '#ffd166', '#3a0ca3')
  },
  /* PROVENANCE: medieval cloisonné vitreous enamel pastes — colloidal gold-ruby glass, lead-antimonate amber,
     copper oxide emerald, cobalt smalt lapis, manganese purple, and gilded leaf flux.
     MEASURED: seam 0.0115, LUT step 0.0145, leg 0.620, L range 0.553, anti 0.131, anti(deut) 0.092.
     CVD: NOT safe — measured anti(deut) = 0.092, sitting just below the 0.100 gate (ruby and emerald are antipodal).
     FOR: volumetric inspection of high-order multipole orbitals (d and f sets) with rich jewel-toned clarity. */
  {
    id: 'enamel',
    label: 'enamel',
    points: 6,
    constL: false,
    harsh: false,
    cvd: false,
    note: 'Byzantine vitreous enamels: gold-ruby · amber · copper emerald · smalt lapis · amethyst · gilded leaf',
    stops: ring('#b80036', '#ffaa20', '#008f4c', '#12309e', '#661188', '#ffea75')
  },
  /* PROVENANCE: transition metal optical absorption-transmission bands in precious natural crystals
     (Cr³⁺ in ruby and beryl, Fe³⁺/Ti⁴⁺ in sapphire, Cu²⁺ in turquoise, and Mn³⁺/Li⁺ in elbaite tourmaline).
     MEASURED: seam 0.0040, LUT step 0.0093, leg 0.298, L range 0.551, anti 0.313, anti(deut) 0.109.
     CVD: SAFE — 0.109 under deuteranope simulation.
     FOR: complex multi-mode wavepacket revivals with dense, smoothly graduating phase structures. */
  {
    id: 'gemstone',
    label: 'gemstone',
    points: 8,
    constL: false,
    harsh: false,
    cvd: true,
    note: 'ruby · padparadscha · citrine · emerald · turquoise · sapphire · amethyst · tourmaline',
    stops: ring('#d90429', '#f77f00', '#ffd166', '#06d6a0', '#118ab2', '#073b4c', '#7209b7', '#f72585')
  },
];
export const PRESET_BY_ID = new Map(PRESETS.map((p) => [p.id, p]));
/** the catalogue grouped by stop count, ascending — the menu's optgroups (a later wave wires this in) */
export const PRESET_GROUPS = [...new Set(PRESETS.map((p) => p.points))].sort((a, b) => a - b)
  .map((points) => ({ points, label: points + ' points', items: PRESETS.filter((p) => p.points === points) }));
