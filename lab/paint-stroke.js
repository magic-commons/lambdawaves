/* paint-stroke.js — THE PAINT GESTURE (2026-10, Josh), one law for every register ladder: MOLECULES' ORBITAL and STATES
 * ladders (canvases) and SPECTRUM's state grid (buttons) — and the EMPTY ↔ FILL ALL button the three heads share (fillButton) and the
 * plain level line the three ladders draw (levelLine).
 *
 *   LEFT press  ADDS:    a click adds the item under the pointer; a drag adds every item it crosses.
 *   RIGHT press REMOVES: a right-click removes the item under the pointer; a right-drag removes every item it crosses.
 *   Alt/Option + left is RIGHT (a trackpad's way to remove); a finger is LEFT.
 *
 * A press that travels under 4 px is a click.  Every press is answered HERE, on pointerup, and the browser's own click
 * that follows it is swallowed in the capture phase, so a window's existing click handler only ever sees clicks no
 * pointer made (the keyboard's Enter/Space on a button).  The context menu is refused on the surface.  rack.js holds
 * history from pointerdown to pointerup, so one stroke, of any length, is one undo row.
 *
 * The window supplies its geometry:
 *   local(e)       → p        the pointer in whatever space `at` and `across` read (default: client px)
 *   at(p)          → keys[]   the item(s) under p (usually zero or one)
 *   across(a, b)   → keys[]   every item the segment a→b crosses (it need not repeat at(b))
 *   apply(keys, add) → n      add or remove them, in ONE pass (one rebuild, one repaint); n = how many it changed
 *   ready()        → bool     optional: false ignores the press (nothing to paint yet)
 *   onEnd(add)               optional: the stroke is over and CHANGED something (the applies' n summed > 0) — still inside the
 *                            pointerup, so whatever it does (iteration 008: every ladder normalises here) joins the stroke's one undo row
 *   mode()         → 'buttons' | 'paint'   036 P1: read at each press (the three ladders hand `strokeMode`); absent = PAINT
 *   isOn(key)      → bool     036 P1: the item is in the register (BUTTONS' toggle reads it)
 *
 * 036 P1 · BUTTONS · PAINT (Josh: "a 'Paint' vs 'Buttons' toggle … the original control of a left-click only feature"): the gesture above is
 * PAINT; BUTTONS (the default) is the left click alone — a press released on the item it began on TOGGLES it (apply([key], !isOn(key)), then
 * onEnd, in the same undo row), a drag sweeps nothing, the right button is the context menu's.  The mode is the PREFERENCE record
 * `lambdawaves.q0.stroke` { mode }; `strokeSeg` is its seat on each ladder's head, every seat in step.
 */
import { el, seg } from './mir/kit.js'; import { glyphSvg } from './mir/glyph.js';
const STROKE_KEY = 'lambdawaves.q0.stroke', MODES = ['buttons', 'paint'], watchers = new Set();
let mode = null;
/** the reader's stroke mode now: 'buttons' (the default) or 'paint' */
export function strokeMode() {
  if (mode === null) { let r = null; try { r = JSON.parse(localStorage.getItem(STROKE_KEY) || 'null'); } catch (_) {} mode = r && MODES.includes(r.mode) ? r.mode : 'buttons'; }
  return mode;
}
export function setStrokeMode(m) {
  if (!MODES.includes(m) || m === strokeMode()) return; mode = m;
  try { localStorage.setItem(STROKE_KEY, JSON.stringify({ mode })); } catch (_) { /* refused: the choice lasts the page */ }
  for (const f of watchers) f(mode);
}
/** watchStroke(fn) — fn(mode) on every change (a surface's hint follows it) */
export function watchStroke(fn) { watchers.add(fn); fn(strokeMode()); }
/** strokeSeg() — the BUTTONS · PAINT seat (a pointing hand · a paintbrush) a ladder's head carries */
export function strokeSeg() {
  const s = seg({ aria: 'stroke mode', cls: 'sp-stroke', value: strokeMode(), onChange: setStrokeMode, options: [
    { id: 'buttons', label: '', title: 'BUTTONS · a click toggles one' }, { id: 'paint', label: '', title: 'PAINT · drag adds, right-drag removes' }] });
  for (const [id, g, w] of [['buttons', 'hand', 'BUTTONS'], ['paint', 'brush', 'PAINT']]) { const b = s.button(id); b.innerHTML = glyphSvg(g, 'gly', 16); b.setAttribute('aria-label', w); }
  watchStroke((m) => { if (s.get() !== m) s.set(m); });
  return s;
}
export function paintStroke(surface, o) {
  const local = o.local || ((e) => ({ x: e.clientX, y: e.clientY }));
  const buttons = () => !!o.mode && o.mode() === 'buttons';
  let stroke = null, eatUntil = 0;
  surface.style.touchAction = 'none';                                  // a finger paints here instead of scrolling the rack
  surface.addEventListener('contextmenu', (e) => { if (!buttons()) e.preventDefault(); });   // BUTTONS: the right button is the context menu's
  surface.addEventListener('pointerdown', (e) => {
    eatUntil = 0;
    if (o.ready && !o.ready()) return;
    const tog = buttons();
    if (tog && e.pointerType === 'mouse' && e.button !== 0) return;
    const right = !tog && e.pointerType === 'mouse' ? e.button === 2 || (e.button === 0 && e.altKey) : false;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
    const p = local(e);
    stroke = { id: e.pointerId, start: p, last: p, cx: e.clientX, cy: e.clientY, add: !right, moved: false, n: 0, tog };
    try { surface.setPointerCapture(e.pointerId); } catch (_) {}
    if (right) e.preventDefault();
  });
  /* capture phase: a live stroke keeps a surface's own hover readers (graphHover's tooltip) out of the way */
  surface.addEventListener('pointermove', (e) => {
    if (!stroke || e.pointerId !== stroke.id || stroke.tog) return;
    const p = local(e);
    if (!stroke.moved) {
      if (Math.hypot(e.clientX - stroke.cx, e.clientY - stroke.cy) < 4) return;
      stroke.moved = true;
      if (o.onStart) o.onStart();
      const k0 = o.at(stroke.start); if (k0.length) stroke.n += +o.apply(k0, stroke.add) || 0;
    }
    e.stopImmediatePropagation();
    const keys = o.across(stroke.last, p).concat(o.at(p));
    stroke.last = p;
    if (keys.length) stroke.n += +o.apply(keys, stroke.add) || 0;
  }, { capture: true });
  const end = (e, tap) => {
    if (!stroke || (e && e.pointerId !== stroke.id)) return;
    const s = stroke; stroke = null; eatUntil = performance.now() + 500;
    if (tap && s.tog) { const up = new Set(o.at(local(e))); for (const k of o.at(s.start)) if (up.has(k)) s.n += +o.apply([k], !(o.isOn && o.isOn(k))) || 0; }   // BUTTONS: released where it began
    else if (tap && !s.moved) { const k = o.at(s.start); if (k.length) s.n += +o.apply(k, s.add) || 0; }
    if (s.n > 0 && o.onEnd) o.onEnd(s.add);
  };
  surface.addEventListener('pointerup', (e) => end(e, true));
  surface.addEventListener('pointercancel', (e) => end(e, false));
  surface.addEventListener('lostpointercapture', (e) => end(e, false));
  /* the click a pointer press leaves behind has already been answered */
  surface.addEventListener('click', (e) => { if (performance.now() < eatUntil) { eatUntil = 0; e.stopImmediatePropagation(); e.preventDefault(); } }, { capture: true });
  return { get painting() { return !!(stroke && stroke.moved); } };
}

/* iteration 008 U · EMPTY <-> FILL ALL, the one two-state button the three ladders' heads carry (SPECTRUM, ORBITAL, STATES): an empty register
   shows FILL ALL, any other EMPTY.  The glyphs are 24-unit outline drawings in the kit's hand (glyph.js: stroke 1.9, round caps; the kit's
   registry is not ours to extend, so they are drawn here), designed by Gemini 3.8 Flash (High) — the prompt and its answer are in
   research/iteration-008/U-BUILD.md.  Iteration 009 F2 (Josh, Yan's call 8): SPECTRUM wears the glyph too — one look, no words mode.
   Iteration 015 S2 (Josh: "users can't tell which clears all and fills all"): two glyphs nobody confuses — FILL ALL is the frame with every rung
   solid and a filled disc at its foot, EMPTY the same frame with no rungs and a ∅ in it; the hint and the aria label lead with the word
   (`FILL ALL · …` / `EMPTY · …`), each ladder handing its own tail. */
/* 021 V2: the two drawings live in the one table (lab/icons.js `fillAll`, `emptyAll`) */
export function fillButton(row, titles, onPress) {
  const b = el('button', 'trig reg-fill', row); b.type = 'button';
  let empty = null;
  const draw = (v) => {
    b.innerHTML = glyphSvg(v ? 'fillAll' : 'emptyAll', 'gly', 20);
    const word = v ? 'FILL ALL' : 'EMPTY'; b.setAttribute('aria-label', word); b.title = word + ' · ' + (v ? titles.fill : titles.empty); b.dataset.state = v ? 'fill' : 'empty';
  };
  b.addEventListener('click', () => onPress(empty));
  return { root: b, set(v, ok = true) { const e = !!v; if (e !== empty) { empty = e; draw(e); } b.disabled = !ok; }, get empty() { return empty; } };
}

/* iteration 008 A (Josh: "simple lines that's dark when off and full vivid color when on") · THE LEVEL LINE, written once for the three
   ladders (iteration 009 F2 lifted it here from spectrum.js, Yan's call 8): an empty level is `rgb` at 0.42 and `w` px; a `lit` one is
   at full strength and `w + 1` px — no population bar, no halo, no glow (the share is the line's hover).  `rgb` is [r, g, b].
   SPECTRUM: lit, the shell's colour, else the theme's ink; w = 1.  ORBITAL: the level's accent (A occupied, B virtual) both ways.
   STATES: w is the oscillator strength's weight (1–3 px, S₀ 2), the colour its axis's.  `fade` steps a mark back (it multiplies the alpha):
   ORBITAL's register under VIEW ORBITAL 0.5, a level this record does not carry 0.25; STATES' dark states 0.7.
   Iteration 016 E6: `vertical` turns the same line upright — (x0, x1) are then its two y ends and `y` its x — for EMISSION SPECTRA's lit lines. */
export function levelLine(g, x0, x1, y, c, lit, w = 1, fade = 1, vertical = false) {
  g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(lit ? 1 : 0.42) * fade})`; g.lineWidth = lit ? w + 1 : w;
  g.beginPath(); if (vertical) { g.moveTo(y, x0); g.lineTo(y, x1); } else { g.moveTo(x0, y); g.lineTo(x1, y); } g.stroke();
}

/** THE FOOTNOTE (iteration 016 R1, Josh: "the maths text at the foot of MOLECULES' register ladders and of SPECTRUM's registry … shows only on
 *  mouse-over"): footLine(cv) → set(text, x, W, H) — the ladder's law line as a DOM `.reg-foot` beside its canvas, laid over the canvas' foot
 *  (from x to W − 4, the old fitText box), so one unlayered lab.css rule hides it until the window is hovered or focused.  The canvas no longer
 *  paints it; the place stays its. */
export function footLine(cv) {
  const foot = el('div', 'reg-foot'); foot.setAttribute('aria-hidden', 'true'); cv.after(foot);
  let at = '';
  return (text, x, W, H) => {
    if (foot.textContent !== text) foot.textContent = text;
    const k = (cv.offsetLeft + x) + '|' + (cv.offsetTop + H - 12) + '|' + Math.max(0, W - 4 - x);
    if (k === at) return; at = k; const [l, t, w] = k.split('|');
    foot.style.left = l + 'px'; foot.style.top = t + 'px'; foot.style.width = w + 'px';
  };
}
