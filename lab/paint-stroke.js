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
 */
import { el } from './mir/kit.js';
export function paintStroke(surface, o) {
  const local = o.local || ((e) => ({ x: e.clientX, y: e.clientY }));
  let stroke = null, eatUntil = 0;
  surface.style.touchAction = 'none';                                  // a finger paints here instead of scrolling the rack
  surface.addEventListener('contextmenu', (e) => e.preventDefault());
  surface.addEventListener('pointerdown', (e) => {
    eatUntil = 0;
    if (o.ready && !o.ready()) return;
    const right = e.pointerType === 'mouse' ? e.button === 2 || (e.button === 0 && e.altKey) : false;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
    const p = local(e);
    stroke = { id: e.pointerId, start: p, last: p, cx: e.clientX, cy: e.clientY, add: !right, moved: false, n: 0 };
    try { surface.setPointerCapture(e.pointerId); } catch (_) {}
    if (right) e.preventDefault();
  });
  /* capture phase: a live stroke keeps a surface's own hover readers (graphHover's tooltip) out of the way */
  surface.addEventListener('pointermove', (e) => {
    if (!stroke || e.pointerId !== stroke.id) return;
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
    if (tap && !s.moved) { const k = o.at(s.start); if (k.length) s.n += +o.apply(k, s.add) || 0; }
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
const GS = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const GLYPH = {
  fill: '<rect ' + GS + ' x="5" y="2.5" width="14" height="19" rx="3"/><path ' + GS + ' d="M8.5 6.5h7M8.5 10h7M8.5 13.5h7"/><circle cx="12" cy="17.6" r="1.9" fill="currentColor"/>',
  empty: '<rect ' + GS + ' x="5" y="2.5" width="14" height="19" rx="3"/><circle ' + GS + ' cx="12" cy="12" r="3.6"/><path ' + GS + ' d="M8.6 16.4 15.4 7.6"/>',
};
export function fillButton(row, titles, onPress) {
  const b = el('button', 'trig reg-fill', row); b.type = 'button';
  let empty = null;
  const draw = (v) => {
    b.innerHTML = '<svg class="gly" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' + GLYPH[v ? 'fill' : 'empty'] + '</svg>';
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
   ORBITAL's register under VIEW ORBITAL 0.5, a level this record does not carry 0.25; STATES' dark states 0.7. */
export function levelLine(g, x0, x1, y, c, lit, w = 1, fade = 1) {
  g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(lit ? 1 : 0.42) * fade})`; g.lineWidth = lit ? w + 1 : w;
  g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
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
