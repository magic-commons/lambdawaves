/* core/zoom.js — 1.5.7-alpha.2 · UI SCALE's one helper (λWAVES 036).
 *
 * MIR OPTIONS › WINDOWS › UI SCALE puts CSS `zoom` on the UI roots (css/base.css), never on the stage.  Under a zoom an element's numbers
 * come in two kinds (CSS Viewport §4.1, Firefox 126+ / Chrome 128+):
 *   SEEN   — getBoundingClientRect, getClientRects, a pointer's clientX / clientY, innerWidth / innerHeight: the viewport's px;
 *   OWN    — offset*, client*, scroll*, getComputedStyle, and every length the element is GIVEN (left, top, width, height, translate):
 *            the element's px, drawn × its zoom.
 * A place written from a seen number divides by the element's zoom; a seen number compared with an own one multiplies.  Two seen numbers
 * (a pointer against a rect) or two own numbers need nothing.  At UI SCALE 100 % every function here is the identity. */

/** cssZoom(el) — the zoom el is drawn at (its own times its roots'); 1 for null.  A hidden element (no box: `currentCSSZoom` reads 1)
 *  reads the --in-zoom its root hands down, so a menu measured before it shows still knows its scale */
export function cssZoom(el) {
  if (!el) return 1;
  const z = el.currentCSSZoom;
  if (z && z !== 1) return z;
  if (z === undefined || el.getClientRects().length) return z || 1;
  const v = parseFloat(getComputedStyle(el).getPropertyValue('--in-zoom'));
  return v > 0 ? v : 1;
}
/** ownRect(el, r?) — a seen rect (el's own, by default) in el's px */
export function ownRect(el, r = el.getBoundingClientRect()) {
  const z = cssZoom(el);
  return z === 1 ? r : { left: r.left / z, top: r.top / z, right: r.right / z, bottom: r.bottom / z, width: r.width / z, height: r.height / z, x: r.left / z, y: r.top / z };
}
/** viewIn(el, view) — the viewport in el's px */
export function viewIn(el, view = globalThis) {
  const z = cssZoom(el);
  return { width: view.innerWidth / z, height: view.innerHeight / z };
}
