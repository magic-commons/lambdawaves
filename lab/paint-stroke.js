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
 * `lambdawaves.q0.stroke` { mode, mol } (041 H1: SPECTRUM's and MOLECULES' own, homes BUTTONS and PAINT); `strokeButton` (037 H6: one toggle
 * button) is its seat on each ladder's head, the seats of one family in step.
 */
import { el, hint, trig } from './mir/kit.js'; import { setGlyph } from './mir/glyph.js';
const STROKE_KEY = 'lambdawaves.q0.stroke', MODES = ['buttons', 'paint'];
/* 041 H1 · PAINT IN MOLECULES, BUTTONS IN SPECTRUM (Josh 11-09: "Let paint be the default for molecules and 'buttons' for default for spectrum"):
   the one record holds a mode per family — `mode` SPECTRUM's (its old field, so an older record is SPECTRUM's choice), `mol` the ORBITAL and
   STATES ladders' — each with its own home; a seat names its family (`where`: 'spectrum' | 'mol') and the seats of one family move in step. */
const HOME = { spectrum: 'buttons', mol: 'paint' }, FIELD = { spectrum: 'mode', mol: 'mol' }, watchers = { spectrum: new Set(), mol: new Set() };
let rec = null;
const read = () => { if (!rec) { let r = null; try { r = JSON.parse(localStorage.getItem(STROKE_KEY) || 'null'); } catch (_) {} rec = {}; for (const k in HOME) rec[k] = r && MODES.includes(r[FIELD[k]]) ? r[FIELD[k]] : HOME[k]; } return rec; };
/** the reader's stroke mode now for a family: 'buttons' or 'paint' (home: SPECTRUM buttons, MOLECULES paint) */
export function strokeMode(where = 'spectrum') { return read()[HOME[where] ? where : 'spectrum']; }
export function setStrokeMode(m, where = 'spectrum') {
  if (!MODES.includes(m) || !HOME[where] || m === strokeMode(where)) return; rec[where] = m;
  try { localStorage.setItem(STROKE_KEY, JSON.stringify({ mode: rec.spectrum, mol: rec.mol })); } catch (_) { /* refused: the choice lasts the page */ }
  for (const f of watchers[where]) f(m);
}
/** watchStroke(fn, where) — fn(mode) on every change of that family (a surface's hint follows it) */
export function watchStroke(fn, where = 'spectrum') { watchers[HOME[where] ? where : 'spectrum'].add(fn); fn(strokeMode(where)); }
/** strokeButton(where) — the BUTTONS · PAINT seat a ladder's head carries.  037 H6 · THE TOGGLE BUTTON (Josh: "The Paint vs Add thing should behave
 *  the same way [as FILL / EMPTY] instead of an extremely narrow switch"): ONE `.trig` whose glyph swaps — a pointing hand (BUTTONS: a click
 *  toggles one) ↔ a paintbrush (PAINT: drag adds, right-drag removes) — with its word as aria-label, its hint and `data-state`, every seat of its
 *  family in step through watchStroke; a press flips the PREFERENCE `lambdawaves.q0.stroke`.  The face is the mode in force;
 *  it replaced 036 P1's two-cell segmented control (strokeSeg). */
export function strokeButton(where = 'spectrum') {
  const t = trig({ label: 'BUTTONS', glyph: 'hand', word: false, cls: 'sp-stroke', onFire: () => setStrokeMode(strokeMode(where) === 'paint' ? 'buttons' : 'paint', where) }), b = t.root;   // 044 L89: the kit's glyph form
  let shown = null;
  watchStroke((m) => {
    if (m === shown) return; shown = m; const paint = m === 'paint';
    t.setGlyph(paint ? 'brush' : 'hand'); t.setLabel(paint ? 'PAINT' : 'BUTTONS'); b.dataset.state = m;   // no aria-pressed: the face is not lit, the glyph alone swaps (FILL ALL ↔ EMPTY's law); the word says the mode
    b.title = paint ? 'PAINT · drag adds, right-drag removes · press: BUTTONS' : 'BUTTONS · a click toggles one · press: PAINT';
  }, where);
  return { root: b };
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
  let empty = null;
  const t = trig({ label: 'EMPTY', glyph: 'emptyAll', word: false, cls: 'reg-fill', onFire: () => onPress(empty) }), b = t.root; row.appendChild(b);   // 044 L89: the kit's glyph form
  const draw = (v) => {
    const word = v ? 'FILL ALL' : 'EMPTY'; t.setGlyph(v ? 'fillAll' : 'emptyAll'); t.setLabel(word); b.title = word + ' · ' + (v ? titles.fill : titles.empty); b.dataset.state = v ? 'fill' : 'empty';
  };
  return { root: b, set(v, ok = true) { const e = !!v; if (e !== empty) { empty = e; draw(e); } b.disabled = !ok; }, get empty() { return empty; } };
}

/** 044 A3.2 · THE LANE'S STRIP (L109, REVIEW-B B14: M · S · × was built three times, its hints already apart), written once for the three
 *  registers' lanes — SPECTRUM and STATES carry all three, ORBITAL the × alone.  `name` is the lane's own (its aria names: "mute 2p₀");
 *  a press of M or S runs the lane's own road (a reconstruction mask, never an edit) and the caller paints `.on` and aria-pressed as it
 *  reads its register; `pinned` is the lane that cannot leave (STATES' S₀): its × is empty and dead.
 *    laneStrip(row, { name, onMute, onSolo, onRemove, remove: the ×'s hint, pinned }) → { mute, solo, x }   (mute and solo null without onMute) */
export function laneStrip(row, { name, onMute, onSolo, onRemove, remove = 'Take this lane out of the register', pinned = '' }) {
  const b = (cls, text, word, tip, run) => { const x = el('button', cls, row, text); x.type = 'button'; hint(x, tip); x.setAttribute('aria-label', word + ' ' + name); x.addEventListener('click', run); return x; };
  const tog = (cls, text, word, tip, run) => { const x = b(cls, text, word, tip, run); x.setAttribute('aria-pressed', 'false'); return x; };
  const mute = onMute ? tog('sp-b mute', 'M', 'mute', 'Mute: leave this lane out of the FIELD', onMute) : null;
  const solo = onSolo ? tog('sp-b solo', 'S', 'solo', 'Solo: play this lane alone', onSolo) : null;
  const x = b('sp-x', '', 'remove', pinned || remove, onRemove); x.disabled = !!pinned; if (!pinned) setGlyph(x, 'close', { size: 16 });
  return { mute, solo, x };
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
