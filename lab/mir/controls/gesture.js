/* controls/gesture.js — what the colour controls share: the fine gear, the double-tap home and the forwarded press.
 *
 * THE LAW IT KEEPS: ONE HAND LAW PER KIT.  The kit's knob law lives in kit.js (`setKnobLaw`: travel, touch travel and
 * the fine divisor); this file READS it, never owns a copy of its numbers, so Josh's "Shift is an eighth" is one
 * number that the arc knob, the hue swatch and the lane slider all follow.  What is here is what BASINS'
 * colour-controls.js added around that law and the kit had not got:
 *   · the FINE GEAR is engaged by ANY modifier (Shift, Alt, Ctrl, Meta) or by a SECOND FINGER down while one drags
 *     (BASINS window.js fineTouchHeld); engaging it moves nothing (the controls keep a virtual point);
 *   · the DOUBLE-TAP is two presses within 300 ms and 14 px, taken on the press itself;
 *   · a press a control stops is FORWARDED, so the menus, the rack's + list and the float layer's raise still hear
 *     "a press happened outside you".
 * (Harvested from BASINS app/colour-controls.js wireTouches, fineHeld, forward.)  `fineHeld` and `fineGain` are re-exports
 * of kit.js's one law (watchTouches, fineHeld, gearOf). */
import { setKnobLaw } from '../kit.js';
import { frame } from '../core/frame.js';

/** THE DOUBLE-TAP is the kit's one law (kit.js TAP, tapWatcher: 300 ms and 14 px, BASINS' numbers; Josh, 2026-10-07, call 20):
 *  TAP is read here, and tapHome(onHome) → (e) → true when this press is the second of a double-tap (and home has been taken)
 *  is tapWatcher under the name the colour controls use. */
export { TAP, tapWatcher as tapHome } from '../kit.js';

/** the kit's drag law as it stands now: { travel, fine, keyFine, faderFine, touchTravel } (setKnobLaw() with no argument only reads) */
export const lawNow = () => setKnobLaw();

/* THE SECOND FINGER and the fine gear's one decision are the kit's own (kit.js watchTouches, fineHeld, gearOf): one law, one tracker.
   The controls import them from kit.js by those names; `fineGain` is `gearOf` under the name the colour-controls test reads. */
export { fineHeld, gearOf as fineGain } from '../kit.js';

/** forward(root, e) — a press the control stopped, handed on to the page: a copy dispatched on the control root's
 *  PARENT (so the root's own capture listener never meets it again), bubbling to the document's outside-press
 *  closers and the float layer's raise. This copy is informational, even when the control is disabled: a window
 *  must not take it as a second drag on empty glass. */
export function forward(root, e) {
  const up = root.parentElement; if (!up) return;
  try { const copy = new PointerEvent(e.type, e); copy.preventDefault(); up.dispatchEvent(copy); }
  catch (_) { /* a press that cannot be copied is not forwarded */ }
}

/** valueDrag(el, { key, move, release, end, abort }) → { start(g), abort() } — THE VALUE-DRAG LIFECYCLE the arc knob, the
 *  lane slider and the hue swatch share.  start(g) follows the pointer g.id (g is the control's own gesture record):
 *  move(ev) for its moves; on its lift the frame job `key` is flushed (the last sample before the commit), the listeners
 *  and `el`'s pointer capture let go, release(g) runs, then end(g, ev); on any cancel — pointercancel, the capture lost,
 *  Escape, the page hidden — the job is dropped, the same release(g), then abort(g, ev): the control puts its value back.
 *  abort() with no event cancels from outside (a destroy). */
export function valueDrag(el, { key, move, release, end, abort: undo }) {
  let g = null;
  const doc = () => el.ownerDocument;
  const onMove = (ev) => { if (g && ev.pointerId === g.id) move(ev); };
  function stop() {
    const was = g; g = null; listen(false);
    try { el.releasePointerCapture(was.id); } catch (_) { /* already released */ }
    if (release) release(was);
    return was;
  }
  function up(ev) { if (!g || ev.pointerId !== g.id) return; frame.flush(key); const was = stop(); if (end) end(was, ev); }
  function abort(ev) {
    if (!g || (ev && ev.pointerId !== undefined && ev.pointerId !== g.id)) return;
    frame.cancel(key); const was = stop(); if (undo) undo(was, ev);
  }
  const lost = (ev) => { if (g && ev.target === el && ev.pointerId === g.id) abort(ev); };
  const esc = (ev) => { if (g && ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); abort(); } };
  const hidden = () => { if (g && doc().visibilityState === 'hidden') abort(); };
  function listen(on) {
    const f = on ? 'addEventListener' : 'removeEventListener', d = doc();
    d[f]('pointermove', onMove, true); d[f]('pointerup', up, true); d[f]('pointercancel', abort, true);
    d[f]('lostpointercapture', lost, true); d[f]('keydown', esc, true); d[f]('visibilitychange', hidden);
  }
  return { start(state) { g = state; listen(true); return state; }, abort: () => abort() };
}

/** the pure helpers the controls and their tests share */
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const frac = (v) => v - Math.floor(v);
