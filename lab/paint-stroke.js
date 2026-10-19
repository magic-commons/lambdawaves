/* paint-stroke.js — THE PAINT GESTURE (2026-10, Josh), one law for every register ladder: MO-REGISTRY's ORBITAL and STATES
 * ladders (canvases) and SPECTRUM's state grid (buttons).
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
 *   apply(keys, add)          add or remove them, in ONE pass (one rebuild, one repaint)
 *   ready()        → bool     optional: false ignores the press (nothing to paint yet)
 *   onEnd(add)               optional: the stroke is over and painted something — still inside the pointerup, so whatever it
 *                            does (iteration 008: MOLECULES' register normalises here) joins the stroke's one undo row
 */
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
    stroke = { id: e.pointerId, start: p, last: p, cx: e.clientX, cy: e.clientY, add: !right, moved: false, hit: false };
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
      const k0 = o.at(stroke.start); if (k0.length) { stroke.hit = true; o.apply(k0, stroke.add); }
    }
    e.stopImmediatePropagation();
    const keys = o.across(stroke.last, p).concat(o.at(p));
    stroke.last = p;
    if (keys.length) { stroke.hit = true; o.apply(keys, stroke.add); }
  }, { capture: true });
  const end = (e, tap) => {
    if (!stroke || (e && e.pointerId !== stroke.id)) return;
    const s = stroke; stroke = null; eatUntil = performance.now() + 500;
    if (tap && !s.moved) { const k = o.at(s.start); if (k.length) { s.hit = true; o.apply(k, s.add); } }
    if (s.hit && o.onEnd) o.onEnd(s.add);
  };
  surface.addEventListener('pointerup', (e) => end(e, true));
  surface.addEventListener('pointercancel', (e) => end(e, false));
  surface.addEventListener('lostpointercapture', (e) => end(e, false));
  /* the click a pointer press leaves behind has already been answered */
  surface.addEventListener('click', (e) => { if (performance.now() < eatUntil) { eatUntil = 0; e.stopImmediatePropagation(); e.preventDefault(); } }, { capture: true });
  return { get painting() { return !!(stroke && stroke.moved); } };
}
