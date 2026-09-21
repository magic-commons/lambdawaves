/* MIR · shell/accent.js — THE WHEEL AS THE UI's ACCENT, and the mark that shows the wheel.
 *
 * Ported from λWAVES rack.js (applyAccent · legible · markInk · paintMarks · the turn), 2026-09-16.
 *
 *   ACCENT A and ACCENT B are two ANGLES on a palette.  The colour at each angle becomes --acc / --acc2 on <body>,
 *   so turning an angle (or changing the palette) recolours the whole interface.  For legibility each accent's
 *   OKLab lightness is held to its theme (≥ 0.62 on DARK, ≤ 0.62 on LIGHT), and VIVID pushes chroma toward neon.
 *   Josh's law (λWAVES OFFICIAL YO): "Accent Color 1 and 2 are based of the current palette of a system … From
 *   center, Accent 1 will be 60 degrees and Accent 2 will be 300 degrees."  λWAVES ships A = 30°, B = 300°; the
 *   angles are options, so an app states its own.
 *
 *   THE MARK is the same wheel: the λ is the colour at 0°, the nine squares are the wheel at 0°, 40° … 320° in
 *   reading order.  The squares take the wheel verbatim; the λ is walked in OKLab lightness only until it clears a
 *   3 : 1 floor against the ground it is drawn on (palette.js visibleInk) — the header's over the STAGE, the
 *   notebook's over the CARD.  A TURN is one pass of the palette through the squares; BUSY loops it.
 *
 * createAccent(options) → { apply, set, wheelColor, accentColor, paintMarks, turn, busy, hueSat, a, b, vivid }
 *   options.accentStops  palette stops the two UI accents read          (default: palette 'lambda')
 *   options.wheelStops   palette stops the mark and a `paletteOn` app read (default: palette 'prism')
 *   options.paletteOn    true: the accents read the wheel palette too  (default false, as λWAVES ships)
 *   options.a, .b, .vivid, .hueShift                                    (defaults 30, 300, 0.1, 0)
 *   options.stageGround  () => [r,g,b] 0…1 under the header mark         (default: the theme's stage ground)
 *   options.gamut        (rgb) => CSS colour string                      (default: sRGB hex)
 *   options.onAccent     (hueSatA, hueSatB) => void — hand the angles to a window that derives its own tints
 *                        (the modulation window's `setAccent`) */
import { PRESET_BY_ID, toLUT, rgbToOklab, oklabToRgb, rgbToHex, visibleInk, contrastRatio } from '../palette.js';
import { setAccentRGB } from '../kit.js';

/* the two stage grounds λWAVES ships (rack.js THEMES.bg) — #070a0f and a hair under #eef1f6 */
export const STAGE_GROUND = { dark: [0.028, 0.038, 0.058], light: [0.93, 0.95, 0.975] };
/* the CARD measured in the page, and the dark card at its sheen's brightest corner (rack.js MARK_GROUND) */
export const CARD_GROUND = { light: [236, 239, 243].map((v) => v / 255), dark: [41, 45, 50].map((v) => v / 255) };
export const MARK_SELECTOR = '#title .mark rect, .nb-logo .mark rect, #busyMark .mark rect, .mod-logo .mark rect, .dev-loading .mark rect';
const MARK_N = 9, MARK_STEP = 40, MARK_FLOOR = 3, TURN_STOPS = 36;
const themeOf = () => (document.body.dataset.theme === 'light' ? 'light' : 'dark');

/** an accent as a window that derives tints wants it: [hue°, saturation %] of the same rgb the house wears */
export function hueSat(rgb) {
  const r = rgb[0], g = rgb[1], b = rgb[2];
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d < 1e-9) return [0, 0];
  const sat = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60; if (h < 0) h += 360;
  return [Math.round(h), Math.round(100 * Math.min(1, sat))];
}

export function createAccent(options = {}) {
  const o = { a: 30, b: 300, vivid: 0.1, hueShift: 0, paletteOn: false, ...options };
  let accentLUT = toLUT(o.accentStops || PRESET_BY_ID.get('lambda').stops);
  let wheelLUT = toLUT(o.wheelStops || PRESET_BY_ID.get('prism').stops);
  const gamut = o.gamut || ((rgb) => rgbToHex(rgb));
  const stageGround = o.stageGround || (() => STAGE_GROUND[themeOf()]);

  const sample = (lut, u) => { const i = Math.min(255, Math.floor(u * 256)) * 4; return [lut[i], lut[i + 1], lut[i + 2]]; };
  function wheelColor(deg) { return sample(wheelLUT, ((deg / 360 + (o.hueShift || 0)) % 1 + 1) % 1); }
  function accentColor(deg) { return o.paletteOn ? wheelColor(deg) : sample(accentLUT, ((deg / 360) % 1 + 1) % 1); }
  function legible(rgb) { const lab = rgbToOklab(rgb), L = themeOf() === 'light' ? Math.min(lab[0], 0.62) : Math.max(lab[0], 0.62); return L === lab[0] ? rgb : oklabToRgb([L, lab[1], lab[2]]); }
  const boost = (rgb) => { if (!o.vivid) return rgb; const lab = rgbToOklab(rgb), k = 1 + 2.2 * o.vivid; return oklabToRgb([lab[0], lab[1] * k, lab[2] * k]); };

  /* the ink of the λ: the floor is on the colour the browser actually draws, so it is quantised and re-asked */
  const q8 = (c) => c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255) / 255);
  function markInk(deg, ground) {
    const g = ground || CARD_GROUND[themeOf()], raw = wheelColor(deg);
    for (let f = MARK_FLOOR; f < MARK_FLOOR + 0.06; f += 0.01) {
      const c = visibleInk(raw, g, f);
      if (contrastRatio(q8(c), q8(g)) >= MARK_FLOOR) return c;
    }
    return visibleInk(raw, g, MARK_FLOOR + 0.06);
  }

  let turnSheet = null, turnDirty = true;
  function paintMarks() {
    for (const lam of document.querySelectorAll('#title .lam')) lam.style.color = gamut(markInk(0, stageGround()));
    for (const lam of document.querySelectorAll('.nb-logo .lam')) lam.style.color = gamut(markInk(0));
    document.querySelectorAll(MARK_SELECTOR).forEach((r, i) => {
      const k = i % MARK_N;
      r.setAttribute('fill', gamut(wheelColor(k * MARK_STEP)));
      if (!r.classList.contains('sq' + k)) r.classList.add('sq' + k);
    });
    turnDirty = true;
  }
  function ensureTurnCSS() {
    if (turnSheet && !turnDirty) return turnSheet;
    if (!turnSheet) { turnSheet = document.createElement('style'); turnSheet.id = 'mirTurn'; document.head.appendChild(turnSheet); }
    const css = [];
    for (let i = 0; i < MARK_N; i++) {
      const row = []; for (let k = 0; k <= TURN_STOPS; k++) row.push(rgbToHex(wheelColor(i * MARK_STEP + k * (360 / TURN_STOPS))));
      css.push('@keyframes mir-turn-' + i + '{' + row.map((hex, k) => (100 * k / TURN_STOPS).toFixed(3) + '%{fill:' + hex + '}').join('') + '}');
      css.push('#title .mark.turn rect.sq' + i + ',#title .mark.busy rect.sq' + i + ',#busyMark .mark rect.sq' + i + ',.dev-loading .mark rect.sq' + i + '{animation-name:mir-turn-' + i + '}');
    }
    turnSheet.textContent = css.join('\n'); turnDirty = false;
    return turnSheet;
  }
  /** one turn of the palette through the header mark (λWAVES runs it once at boot) */
  function turn() {
    const m = document.querySelector('#title .mark'); if (!m) return false;
    ensureTurnCSS();
    m.classList.remove('turn'); void m.offsetWidth;
    m.classList.add('turn');
    const off = () => m.classList.remove('turn');
    m.addEventListener('animationend', off, { once: true }); setTimeout(off, 2200);
    return true;
  }
  /** the mark loops while the app is working */
  function busy(want) { if (want) ensureTurnCSS(); const m = document.querySelector('#title .mark'); if (m) m.classList.toggle('busy', !!want); }

  function apply() {
    const A = boost(legible(accentColor(o.a))), B = boost(legible(accentColor(o.b))), st = document.body.style;
    st.setProperty('--acc-glow', '0 0 ' + (8 + 18 * o.vivid).toFixed(0) + 'px color-mix(in srgb, var(--acc) ' + Math.round(55 + 40 * o.vivid) + '%, transparent)');
    st.setProperty('--acc', gamut(A)); st.setProperty('--acc2', gamut(B)); st.setProperty('--acc-ink', rgbToOklab(A)[0] > 0.6 ? '#071114' : '#f2f5f7');
    setAccentRGB(A.map((v) => Math.round(v * 255)), B.map((v) => Math.round(v * 255)));
    if (o.onAccent) o.onAccent(hueSat(A), hueSat(B));
    paintMarks();
  }
  /** change any of: a, b, vivid, hueShift, paletteOn, accentStops, wheelStops — then the house is repainted */
  function set(patch = {}) {
    for (const k of ['a', 'b', 'vivid', 'hueShift', 'paletteOn']) if (patch[k] !== undefined) o[k] = patch[k];
    if (patch.accentStops) accentLUT = toLUT(patch.accentStops);
    if (patch.wheelStops) wheelLUT = toLUT(patch.wheelStops);
    apply();
  }
  return { apply, set, wheelColor, accentColor, markInk, paintMarks, turn, busy, hueSat,
    get a() { return o.a; }, get b() { return o.b; }, get vivid() { return o.vivid; }, get hueShift() { return o.hueShift; }, get paletteOn() { return o.paletteOn; } };
}
