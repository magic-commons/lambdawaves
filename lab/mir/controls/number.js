/* controls/number.js — THE NUMBER FIELD: drag it, type it, key it.  The tempo field's law, for every typed number.
 *
 * THE LAW IT KEEPS: ONE FIELD FOR A TYPED NUMBER.  The census found a bare `type="number"` in NEBULA's factory, AUTOMATA's WEDGE and
 * the modulation window's route amount, and one good one, the BPM (BASINS tempo-editor.js; shell/transport.js bindTempoField).  This is
 * the good one, generalised:
 *   · DRAG on the number: the whole range in 220 px of rise (320 under a finger), the one knob law's ⅛ fine gear on any modifier or a second
 *     finger, on a virtual point (core/pointer.js carries the gesture: Escape or a lost capture puts the value back).  A number with no
 *     range moves `range` per full travel (default 100 steps).  A drag is not a click.
 *   · CLICK (a press that never travels), or Enter on the face, opens the field: the number as it is, selected.  Enter or leaving it
 *     takes the number, Escape does not (focus goes back to the face); a comma is a decimal point; the text is `chars` long at most.
 *   · KEYS on the face: ↑ → up and ↓ ← down by one `step`, Shift an eighth of it, Page ten.
 * `bindNumber` is that behaviour on a button and an input the caller already has (bindTempoField is now one call to it); `number()` builds
 * the pair and a label.  `numberTravel` and `parseNumber` are the pure parts.
 *   numberTravel(start, p, { min, max, step, range, round }) → the value after a travel `p` (0..1 is the whole range), clamped and rounded
 *   fineSteps(dy) → the steps one frame of a fine-gear drag moves a stepped number (1.5.7-alpha.45: one a pixel while slow, a velocity gear)
 *   parseNumber(text) → a finite number (a comma is a point) or null
 *   bindNumber({ button, input, model, parse, enabled, drag, click, paint, chars, step, range, signal })   (click: false leaves the click to the host)
 *     model  { get(), set(v), commit?(), min?, max?, round?(v) } — what createTempo hands the tempo field, as it is
 *     → { open(), close(take), editing, destroy() }
 *   number({ label, aria, min, max, value, step, snap, digits, fmt, parse, unit, chars, range, drag, onInput, onChange, cls })
 *     → { root, face, input, get, set(x), setDisabled(on), open(), close(take), editing, destroy() }
 *     onInput(v) while a drag or a key moves it; onChange(v) when a gesture, a typed number or a key lands.  set(x) is silent.
 *     snap: false keeps a typed or set number as it is (clamped, not rounded to `step`), as a native number input's value is:
 *     the keys and the drag still move by `step` (the RENDER panel's LENGTH, which an app writes to the millisecond). */
import { el, label, ariaLabel, hint, watchTouches, verticalDrag, setKnobLaw } from '../kit.js';
import { drag as pointerDrag } from '../core/pointer.js';
import { setText, setAttr } from '../core/perf.js';
import { cssZoom } from '../core/zoom.js';

export const NUMBER = Object.freeze({ slop: 4, chars: 8, steps: 100 });   // a drag starts after 4 px; a field holds 8 characters; a range-less number moves 100 steps per full travel

/** parseNumber(text) — a typed number (a comma is a decimal point); null if it is not a number */
export function parseNumber(text) {
  const v = Number.parseFloat(String(text ?? '').trim().replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}
/** the decimals a step needs (0.1 → 1, 0.25 → 2, 1 → 0) */
export const digitsOf = (step) => { if (!(step > 0)) return 0; let d = 0, s = step; while (d < 8 && Math.abs(Math.round(s) - s) > 1e-9) { s *= 10; d++; } return d; };
/** numberTravel(start, p, { min, max, step, range, round }) — start + p of the range, clamped to [min, max] and rounded to the step */
export function numberTravel(start, p, { min = -Infinity, max = Infinity, step = 0, range, round } = {}) {
  const span = Number.isFinite(range) && range > 0 ? range : Number.isFinite(min) && Number.isFinite(max) && max > min ? max - min : (step || 1) * NUMBER.steps;
  let v = start + p * span;
  v = Math.min(max, Math.max(min, v));
  if (round) v = round(v); else if (step > 0) v = Math.round(v / step) * step;
  return Math.min(max, Math.max(min, Number(v.toFixed(10))));
}

/** fineSteps(dy) — THE FINE DRAG LANDS ON THE STEP (1.5.7-alpha.45, λWAVES 040 T8; Josh: "even when I use the shift for fine, I get the annoying
 *  situation where I can't get integers per pixel notch movement like 59.9 to 60.1 … Perhaps a cursor/input acceleration detection would help"):
 *  the steps one frame of a fine-gear drag moves a stepped number — one a pixel while the hand is slow (≤ 2 px a frame: no step is ever
 *  skipped, 59.9 → 60.0 → 60.1), more a pixel as it speeds up (a velocity gear: ×1.5 at 3 px, ×8 from 16 px a frame).  Up is +.  PURE */
export function fineSteps(dy) { const a = Math.abs(dy); return Math.sign(dy) * (a <= 2 ? a : a * Math.min(8, a / 2)); }

/** bindNumber — see the header */
export function bindNumber({ button, input, model, parse = parseNumber, format = String, enabled = () => true, drag: dragToo = true, click = true, paint = () => {}, chars = NUMBER.chars, step = 0, range, signal } = {}) {
  const ctl = new AbortController(); if (signal) signal.addEventListener('abort', () => ctl.abort(), { once: true });
  const on = { signal: ctl.signal };
  watchTouches();
  input.maxLength = chars; input.spellcheck = false; input.inputMode = 'decimal'; input.dir = 'ltr';
  if (!input.type || input.type === 'text') input.type = 'text';
  const lo = () => (Number.isFinite(model.min) ? model.min : -Infinity), hi = () => (Number.isFinite(model.max) ? model.max : Infinity);
  const commit = () => { if (model.commit) model.commit(); };
  let editing = false, dragged = false;
  function open() {
    if (editing || !enabled()) return false;
    /* 1.5.7-alpha.3 · THE EDITOR IS THE BUTTON'S BOX: its width and height, never a flex-basis (in a flex COLUMN a basis is the HEIGHT: the
       CSB's 72 × 34 pill became a 72 × 72 square); measured seen, written in the field's own px (UI SCALE); the value in the button's format */
    const seat = button.getBoundingClientRect(), z = cssZoom(input);
    Object.assign(input.style, { width: seat.width / z + 'px', height: seat.height / z + 'px', flex: 'none' });
    button.hidden = true; input.hidden = false; input.value = format(model.get()); editing = true;
    input.focus({ preventScroll: true }); input.select();
    return true;
  }
  function close(take = true, refocus = false) {
    if (!editing) return; editing = false;
    if (take) { const v = parse(input.value); if (v !== null) { model.set(v); commit(); } }   // the model clamps and rounds what it is given (createTempo's does; number()'s does)
    input.hidden = true; button.hidden = false;
    if (refocus) button.focus({ preventScroll: true });
    paint();
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(e.key === 'Enter', true); }
  }, on);
  input.addEventListener('blur', () => close(true), on);
  let g = null;
  const gesture = dragToo ? pointerDrag(button, { slop: NUMBER.slop,
    onStart: (s) => { if (!enabled()) return; g = { v0: model.get(), p0: 0, y: s.y, acc: 0, vd: verticalDrag({ pointerId: s.pointerId, pointerType: s.pointerType, clientX: s.x0, clientY: s.y0 }) }; },
    // THE FINE DRAG LANDS ON THE STEP (1.5.7-alpha.45): under the fine gear a stepped number counts steps (fineSteps; the slop is not counted),
    // not travel; the coarse drag resumes from where the fine one left it (re-origined); ONE KNOB LAW's ⅛ stands where there is no step
    onMove: (s) => { if (!g) return; const p = g.vd.move({ ...s, clientX: s.x, clientY: s.y }), dy = g.y - s.y, o = { min: lo(), max: hi(), step, range, round: model.round }; g.y = s.y;
      if (step > 0 && g.vd.gear < 1) { g.acc += fineSteps(dy); const k = Math.trunc(g.acc); g.acc -= k; if (k) model.set(numberTravel(model.get() + k * step, 0, o)); g.v0 = model.get(); g.p0 = p; }
      else model.set(numberTravel(g.v0, p - g.p0, o));
      paint(); },
    onEnd: () => { if (!g) return; g = null; dragged = true; commit(); },
    onCancel: () => { if (!g) return; const v = g.v0; g = null; model.set(v); paint(); } }) : null;
  if (dragToo) button.addEventListener('pointerdown', () => { dragged = false; }, on);
  if (click) button.addEventListener('click', () => { if (dragged) { dragged = false; return; } open(); }, on);   // `click: false`: the host decides what a click does (the tempo pill's opens its panel) and calls open() itself
  return { open, close: (take = true) => close(take), get editing() { return editing; }, destroy() { close(false); if (gesture) gesture.destroy(); ctl.abort(); } };
}

/** number — see the header */
export function number(o = {}) {
  const min = Number.isFinite(o.min) ? o.min : -Infinity, max = Number.isFinite(o.max) ? o.max : Infinity, step = o.step > 0 ? o.step : 0;
  const digits = Number.isInteger(o.digits) ? o.digits : digitsOf(step);
  const fmt = o.fmt || ((x) => x.toFixed(digits) + (o.unit || ''));
  const root = el('div', 'mir-num' + (o.cls ? ' ' + o.cls : ''));
  if (o.label) label(el('div', 'k-lbl', root), o.label);
  const box = el('div', 'mir-num-box', root);
  const face = el('button', 'mir-num-face', box); face.type = 'button'; face.dir = 'ltr';
  const input = el('input', 'mir-num-in', box); input.hidden = true;
  if (o.aria || o.label) { ariaLabel(face, o.aria || o.label); ariaLabel(input, o.aria || o.label); }
  face.setAttribute('role', 'spinbutton');
  if (Number.isFinite(min)) face.setAttribute('aria-valuemin', String(min)); if (Number.isFinite(max)) face.setAttribute('aria-valuemax', String(max));
  let v = Number.isFinite(o.value) ? o.value : (Number.isFinite(min) ? min : 0), def = Number.isFinite(o.home) ? o.home : v, disabled = false;   // `home`: where Delete goes (1.6.0-alpha.23)
  if (o.title) hint(root, o.title);
  const settle = (x) => numberTravel(x, 0, { min, max, step: o.snap === false ? 0 : step });
  const paint = () => { setText(face, fmt(v)); setAttr(face, 'aria-valuenow', String(v)); setAttr(face, 'aria-valuetext', fmt(v)); };
  const model = { get: () => v, min, max,
    set(x) { x = settle(x); if (x !== v) { v = x; paint(); if (o.onInput) o.onInput(v); } },
    commit() { if (o.onChange) o.onChange(v); } };
  const binding = bindNumber({ button: face, input, model, parse: o.parse || parseNumber, enabled: () => !disabled, drag: o.drag !== false, paint, chars: o.chars || NUMBER.chars, step, range: o.range });
  /* the keys: ↑ → up and ↓ ← down by one step (one unit when there is none), Page ten; Shift an eighth of a unit where there is NO step
     (1.6.0-alpha.21: on a stepped number an eighth of a step rounded straight back, a dead key; one arrow is one step, as on a stepped knob) */
  const unit = step || (Number.isFinite(min) && Number.isFinite(max) ? (max - min) / NUMBER.steps : 1);
  face.addEventListener('keydown', (e) => {
    if (disabled || e.ctrlKey || e.metaKey || e.altKey) return;
    const dir = e.code === 'ArrowUp' || e.code === 'ArrowRight' || e.code === 'PageUp' ? 1 : e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'PageDown' ? -1 : 0;
    if (dir) { e.preventDefault(); model.set(v + dir * unit * (e.code.startsWith('Page') ? 10 : 1) * (e.shiftKey && !step ? setKnobLaw().keyFine : 1)); model.commit(); return; }   // keyFine, the arrow's own gear (1.6.0-alpha.22: it read the DRAG's divisor)
    if (e.code === 'Home' && Number.isFinite(min)) { e.preventDefault(); model.set(min); model.commit(); } else if (e.code === 'End' && Number.isFinite(max)) { e.preventDefault(); model.set(max); model.commit(); }
    else if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); model.set(def); model.commit(); }
  });
  paint();
  /* THE VALUE DOOR, as the knob's (1.6.0-alpha.26; `input` is the field here, so the door's hand is `write`): home() = Delete, write(x) = a typed value */
  root.mirKnob = { root, get: () => v, home() { if (!disabled) { model.set(def); model.commit(); } }, input(x) { if (!disabled) { model.set(x); model.commit(); } } };
  return { root, face, input, get: () => v, set(x) { v = settle(x); paint(); }, setDefault(x) { def = x; }, home: root.mirKnob.home, write: root.mirKnob.input,
    setDisabled(on) { disabled = !!on; root.classList.toggle('disabled', disabled); face.disabled = disabled; if (disabled) binding.close(false); },
    open: binding.open, close: binding.close, get editing() { return binding.editing; }, destroy() { binding.destroy(); root.remove(); } };
}
