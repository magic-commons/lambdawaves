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
 * createAccent(options) → { apply, set, wheelColor, accentColor, paintMarks, turn, busy, hueSat, a, b, vivid, bright, model }
 * accentPart({ get, set, subscribe }) → a project part (core/project.js) carrying ACCENT A, B, VIVID and BRIGHTNESS
 * towardWhite(rgb, k) → rgb mixed toward white in OKLCH
 *   options.accentStops  palette stops the two UI accents read          (default: palette 'lambda')
 *   options.wheelStops   palette stops the mark and a `paletteOn` app read (default: palette 'prism')
 *   options.paletteOn    true: the accents read the wheel palette too  (default false, as λWAVES ships)
 *   options.a, .b, .vivid, .hueShift, .bright                           (defaults 30, 300, 0.1, 0, 0)
 *   options.model        'palette' (default: the angles read the palette, held legible, VIVID pushes chroma) or 'hsl'
 *                        (1.5.0-alpha.14, BASINS' accent engine, skin.js createAccentEngine: an angle is an HSL hue, VIVID
 *                        sets both the saturation and the lightness — `hsl(A, 20 + 80·v %, 28 + 36·v %)` — so at A = 180°,
 *                        v = 1 the accent is `hsl(180 100% 64%)`, where the palette's is #e000ff.  It writes BASINS' six
 *                        tokens on <body> (--hue-acc --sat-acc --lum-acc and the three for B) and lets the sheets derive
 *                        --acc / --acc2 from them; BRIGHTNESS mixes toward white in OKLCH as `--acc: color-mix(…)`.  No
 *                        legibility hold: the light theme's lightness is the sheets' (skin.css), as in BASINS)
 *   BRIGHTNESS (BASINS skin.js, Josh 2026-10-01: "a new knob that's 'brightness' to make accent color shift to white"):
 *                        both accents mixed toward white in OKLCH, 0 as chosen … 1 white, after the legibility hold and
 *                        VIVID, so --acc, --acc2 and every token derived from them follow; while it is above 0, <body>
 *                        carries --acc-white (BASINS' name, the percentage) for a sheet that builds a tint from the hue
 *                        numbers and must mix it the same way.
 *   options.stageGround  () => [r,g,b] 0…1 under the header mark         (default: the theme's stage ground)
 *   options.gamut        (rgb) => CSS colour string                      (default: sRGB hex)
 *   options.onAccent     (hueSatA, hueSatB) => void — hand the angles to a window that derives its own tints
 *                        (the modulation window's `setAccent`) */
import { PRESET_BY_ID, toLUT, rgbToOklab, oklabToRgb, rgbToHex, visibleInk, contrastRatio, hslToRgb01, rgbToHsl } from '../palette.js';
import { setAccentRGB, lightTheme } from '../kit.js';

/* the two stage grounds λWAVES ships (rack.js THEMES.bg) — #070a0f and a hair under #eef1f6 */
export const STAGE_GROUND = { dark: [0.028, 0.038, 0.058], light: [0.93, 0.95, 0.975] };
/* the CARD measured in the page, and the dark card at its sheen's brightest corner (rack.js MARK_GROUND) */
export const CARD_GROUND = { light: [236, 239, 243].map((v) => v / 255), dark: [41, 45, 50].map((v) => v / 255) };
export const MARK_SELECTOR = '#title .mark rect, .nb-logo .mark rect, #busyMark .mark rect, .mod-logo .mark rect, .dev-loading .mark rect';
const MARK_N = 9, MARK_STEP = 40, MARK_FLOOR = 3, TURN_STOPS = 36;
const wrapDeg = (d) => ((d % 360) + 360) % 360;
const unit = (v) => Math.max(0, Math.min(1, +v || 0));
const themeOf = () => (lightTheme() ? 'light' : 'dark');

/** an accent as a window that derives tints wants it: [hue°, saturation %] of the same rgb the house wears */
export function hueSat(rgb) {
  if (Math.max(rgb[0], rgb[1], rgb[2]) - Math.min(rgb[0], rgb[1], rgb[2]) < 1e-9) return [0, 0];
  const [h, sat] = rgbToHsl(rgb);
  return [Math.round(h), Math.round(100 * Math.min(1, sat))];
}

/** towardWhite(rgb, k) — BASINS' `color-mix(in oklch, c, white k)`: white has no chroma and takes the colour's hue, so in
 *  OKLab the lightness goes k of the way to 1 and the chroma shrinks by (1 − k) */
export function towardWhite(rgb, k) {
  if (!(k > 0)) return rgb;
  const t = Math.min(1, k), lab = rgbToOklab(rgb);
  return oklabToRgb([lab[0] + (1 - lab[0]) * t, lab[1] * (1 - t), lab[2] * (1 - t)]).map((v) => Math.max(0, Math.min(1, v)));
}

/** hslVivid(v) → { sat, lum } in percent: BASINS' VIVID scale for the 'hsl' model (vividSat 20 + 80·v, vividLum 28 + 36·v) */
export const hslVivid = (v) => { const u = unit(v); return { sat: +(20 + 80 * u).toFixed(1), lum: +(28 + 36 * u).toFixed(1) }; };
/** hslToRgb(deg, sat%, lum%) → [r, g, b] 0…1 */
export const hslToRgb = (deg, sat, lum) => hslToRgb01(((deg % 360) + 360) % 360, sat / 100, lum / 100);
/* the light theme re-derives --acc inside a card (skin.css); with BRIGHTNESS up the same law, mixed (BASINS skin.js) */
const BRIGHT_LAW = 'body[data-theme="light"].acc-bright .dev { --acc: color-mix(in oklch, hsl(var(--hue-acc) calc(var(--sat-acc) - 10%) var(--lum-acc)), white var(--acc-white)); }';

export function createAccent(options = {}) {
  const o = { a: 30, b: 300, vivid: 0.1, hueShift: 0, paletteOn: false, bright: 0, model: 'palette', ...options };
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

  /* the 'hsl' model: BASINS' tokens, nothing derived here but the glow, the drawn-canvas RGB and the hand-over to a tinting window */
  function applyHsl() {
    const k = unit(o.bright), st = document.body.style, { sat, lum } = hslVivid(o.vivid), white = Math.round(k * 1000) / 10;
    const hA = Math.round(wrapDeg(o.a)), hB = Math.round(wrapDeg(o.b));
    if (!document.getElementById('acc-bright-law')) { const law = document.createElement('style'); law.id = 'acc-bright-law'; law.textContent = BRIGHT_LAW; document.head.appendChild(law); }
    st.setProperty('--hue-acc', String(hA)); st.setProperty('--sat-acc', sat + '%'); st.setProperty('--lum-acc', lum + '%');
    st.setProperty('--hue-acc2', String(hB)); st.setProperty('--sat-acc2', sat + '%'); st.setProperty('--lum-acc2', lum + '%');
    document.body.classList.toggle('acc-bright', white > 0);
    if (white > 0) {
      st.setProperty('--acc-white', white + '%');
      st.setProperty('--acc', 'color-mix(in oklch, hsl(var(--hue-acc) var(--sat-acc) var(--lum-acc)), white ' + white + '%)');
      st.setProperty('--acc2', 'color-mix(in oklch, hsl(var(--hue-acc2) var(--sat-acc2) var(--lum-acc2)), white ' + white + '%)');
    } else { st.removeProperty('--acc-white'); st.removeProperty('--acc'); st.setProperty('--acc2', 'hsl(var(--hue-acc2) var(--sat-acc2) var(--lum-acc2))'); }
    st.setProperty('--acc-glow', '0 0 ' + (8 + 18 * o.vivid).toFixed(0) + 'px color-mix(in srgb, var(--acc) ' + Math.round(55 + 40 * o.vivid) + '%, transparent)');
    const A = towardWhite(hslToRgb(hA, sat, lum), k), B = towardWhite(hslToRgb(hB, sat, lum), k);
    setAccentRGB(A.map((v) => Math.round(v * 255)), B.map((v) => Math.round(v * 255)));
    if (o.onAccent) o.onAccent([hA, Math.round(sat)], [hB, Math.round(sat)]);
    paintMarks();
  }
  function apply() {
    if (o.model === 'hsl') return applyHsl();
    const k = Math.max(0, Math.min(1, +o.bright || 0)), st = document.body.style;
    const A = towardWhite(boost(legible(accentColor(o.a))), k), B = towardWhite(boost(legible(accentColor(o.b))), k);
    if (k > 0) st.setProperty('--acc-white', Math.round(k * 1000) / 10 + '%'); else st.removeProperty('--acc-white');
    st.setProperty('--acc-glow', '0 0 ' + (8 + 18 * o.vivid).toFixed(0) + 'px color-mix(in srgb, var(--acc) ' + Math.round(55 + 40 * o.vivid) + '%, transparent)');
    st.setProperty('--acc', gamut(A)); st.setProperty('--acc2', gamut(B)); st.setProperty('--acc-ink', rgbToOklab(A)[0] > 0.6 ? '#071114' : '#f2f5f7');
    setAccentRGB(A.map((v) => Math.round(v * 255)), B.map((v) => Math.round(v * 255)));
    if (o.onAccent) o.onAccent(hueSat(A), hueSat(B));
    paintMarks();
  }
  /** change any of: a, b, vivid, bright, hueShift, paletteOn, accentStops, wheelStops — then the house is repainted */
  function set(patch = {}) {
    for (const k of ['a', 'b', 'vivid', 'bright', 'hueShift', 'paletteOn']) if (patch[k] !== undefined) o[k] = patch[k];
    if (patch.accentStops) accentLUT = toLUT(patch.accentStops);
    if (patch.wheelStops) wheelLUT = toLUT(patch.wheelStops);
    apply();
  }
  return { apply, set, wheelColor, accentColor, markInk, paintMarks, turn, busy, hueSat,
    get a() { return o.a; }, get b() { return o.b; }, get vivid() { return o.vivid; }, get bright() { return o.bright; }, get hueShift() { return o.hueShift; }, get paletteOn() { return o.paletteOn; }, get model() { return o.model; } };
}

/* ── THE ACCENTS RIDE THE PROJECT ─────────────────────────────────────────────────────────────────────────────────
   Josh, 2026-10-01: "let Accent A and Accent B from the settings be the only thing that gets saved from settings into
   project information.  Let it change the UI."  BASINS skin.js accentProject: capture → { a, b, vivid, bright }; restore
   applies them live (and they become the browser's accents too, as BASINS' setAccent persists them); a project saved
   before the accents rode it restores null and leaves the UI alone; the signature is the four numbers to four places. */
/** accentPart({ get() → { a, b, vivid, bright }, set({ a, b, vivid, bright }), subscribe?(fn) → off }) → the part
 *  `registerProjectPart('accent', …)` takes.  The GUI window registers one over its look store (shell/gui.js). */
export function accentPart({ get, set, subscribe }) {
  const now = () => { const v = get() || {}; return { a: wrapDeg(+v.a || 0), b: wrapDeg(+v.b || 0), vivid: +v.vivid || 0, bright: +v.bright || 0 }; };
  return {
    capture: () => now(),
    restore(saved) {
      if (!saved || typeof saved !== 'object' || ![saved.a, saved.b].every((v) => v !== null && v !== '' && Number.isFinite(+v))) return false;
      const cur = now();
      set({ a: wrapDeg(+saved.a), b: wrapDeg(+saved.b), vivid: Number.isFinite(+saved.vivid) && saved.vivid !== null ? unit(saved.vivid) : cur.vivid,
        bright: Number.isFinite(+saved.bright) && saved.bright !== null ? unit(saved.bright) : 0 });
      return true;
    },
    signature: () => { const v = now(); return [v.a, v.b, v.vivid, v.bright].map((x) => (+x).toFixed(4)).join(','); },
    ...(typeof subscribe === 'function' ? { subscribe } : {}),
  };
}
