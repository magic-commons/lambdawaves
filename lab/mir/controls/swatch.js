/* controls/swatch.js — THE HUE SWATCH: a colour the user picks, as a circle of that colour.
 *
 * A TAP reaches a transparent <input type=color> laid over the circle (the platform's own chooser, opened by the
 * platform, inside the gesture); a press-drag of ≥ 8 px up or down TURNS ITS HUE, h = h0 + (−dy / 220)·360, saturation and
 * value kept; a hue ring of the colour's own ink rides round it (no glow: Josh, 2026-10-07).  Josh: "Color sliders for
 * color related things" · "A colour the user picks" is a swatch (docs/CONTROLS-COLOUR.md).
 *
 *   hueSwatch({ rgb, label, title, onInput(rgb), onChange() }) → { root, button, input, arc, set(rgb), get(), dragging() }
 *   rgb is [r, g, b] in 0..1.  `root` is a seat holding the round .mir-swatch button and, over it, the transparent
 *   input the tap lands on.  onInput runs on every change (the chooser's and the drag's); onChange once per drag and
 *   once per chooser close.  Pure helpers: rgbToHsv, hsvToRgb, rgbCss (and the kit's own hexToRgb / rgbToHex, palette.js).
 *
 * The fine gear is the kit's one law (controls/gesture.js): any modifier or a second finger gears the turn down on a
 * virtual point.  The press is the platform's, so the gesture follows the kit's endings: pointercancel, lost capture and
 * Escape end it and put the colour back.  A drag's own click opens nothing (the chooser is for a TAP).
 * Harvested from BASINS app/colour-controls.js hueSwatch (flagship colors.js:850). */
import { el, ariaLabel, hint, watchTouches, gearOf } from '../kit.js';
import { frame } from '../core/frame.js';
import { setVar } from '../core/perf.js';
import { hexToRgb, rgbToHex } from '../palette.js';
import { arcRing } from './arc.js';
import { clamp01, frac, valueDrag } from './gesture.js';

/** the swatch's numbers: px of travel before a press becomes a hue turn, and px for one full turn of hue (BASINS') */
export const SWATCH = Object.freeze({ ARM: 8, TRAVEL: 220 });
let uid = 0;

export function rgbToHsv(rgb) {
  const [r, g, b] = rgb, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
    h = frac(h / 6);
  }
  return [h, mx > 0 ? d / mx : 0, mx];
}
export function hsvToRgb(h, s, v) {
  const hh = frac(h) * 6, i = Math.floor(hh), f = hh - i, p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f));
  return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6].map(clamp01);
}
export const rgbCss = (rgb) => 'rgb(' + rgb.map((c) => +(clamp01(c) * 255).toFixed(2)).join(' ') + ')';

export function hueSwatch(o) {
  watchTouches();
  const root = el('span', 'mir-swatch-seat');
  const button = el('button', 'mir-swatch', root); button.type = 'button'; button.tabIndex = -1; button.setAttribute('aria-hidden', 'true');
  const arc = arcRing(root);
  const input = el('input', 'mir-swatch-pick', root); input.type = 'color';
  if (o.label) ariaLabel(input, o.label);
  if (o.title) hint(input, o.title);                 // no hint of its own (Josh, 2026-10-07, call 16): an app's title only
  const key = 'swatch:' + (++uid);
  let rgb = (o.rgb || [1, 1, 1]).slice(), d = null, swallow = 0;
  function set(next) {
    if (!Array.isArray(next) || next.length !== 3) return;
    rgb = next.slice();
    const css = rgbCss(rgb), hx = rgbToHex(rgb);
    setVar(root, '--swatch', css);
    const turn = rgbToHsv(rgb)[0] * 360;
    arc.set(turn);
    if (input.value !== hx && document.activeElement !== input) input.value = hx;
  }
  input.addEventListener('input', () => { const c = hexToRgb(input.value); if (c) { set(c); if (o.onInput) o.onInput(c); } });
  input.addEventListener('change', () => { if (o.onChange) o.onChange(); });
  const apply = (next) => { set(next); if (o.onInput) o.onInput(next); };
  const move = (e) => {
    if (!d || e.pointerId !== d.id) return;
    d.vy += gearOf(e, d.id, o.fine) * (e.clientY - d.ly); d.ly = e.clientY;
    if (!d.armed) {
      if (Math.abs(e.clientY - d.y0) < SWATCH.ARM) return;
      d.armed = true; root.classList.add('drag');
      try { input.setPointerCapture(d.id); } catch (_) { /* a pointer already gone */ }
    }
    e.preventDefault();
    const next = hsvToRgb(d.h0 + (-(d.vy - d.y0) / SWATCH.TRAVEL), d.s, d.v);
    frame.coalesce(key, () => apply(next));
  };
  /* the lifecycle (gesture.js valueDrag); the swatch's own rule: a press that never armed is a TAP, and its click goes on
     to the chooser; a drag's lift persists once and swallows the click it ends in; a cancelled drag puts the colour back */
  const drag = valueDrag(input, { key, move,
    release: () => { d = null; root.classList.remove('drag'); },
    end: (was) => { if (!was.armed) return; swallow = performance.now(); if (o.onChange) o.onChange(); },
    abort: (was) => { if (was.armed) { apply(was.rgb0); swallow = performance.now(); } } });
  input.addEventListener('pointerdown', (e) => {
    if (e.button || d) return;
    const [h, s, v] = rgbToHsv(rgb);
    /* a grey has no hue to turn: it is given full saturation (and a black full value) so the turn shows */
    d = drag.start({ id: e.pointerId, y0: e.clientY, vy: e.clientY, ly: e.clientY, h0: h, s: s < 0.0005 ? 1 : s, v: v < 0.0005 ? 1 : v, armed: false, rgb0: rgb.slice() });
  });
  input.addEventListener('click', (e) => { if (swallow && performance.now() - swallow < 600) { swallow = 0; e.preventDefault(); e.stopPropagation(); } }, true);
  set(rgb);
  return { root, button, input, arc, set, get: () => rgb.slice(), dragging: () => !!(d && d.armed), destroy() { drag.abort(); root.remove(); } };
}
