/* MIR · shell/scene-guard.js — THE SCENE INPUT GUARD: the UI's space never lets input fall through to the picture.
 *
 * Josh, 2026-10-01: "the scroll still works on the fractal instead of not doing anything because we're in UI space."
 * Harvested from BASINS (app/scene-input-guard.js and its hook in app/gestures.js; docs/SCENE-INPUT-2026-10-01.md,
 * docs/ui-fixes-2026-10-01 §3).  The kit's floating windows, racks and rails sit in pointer-transparent hosts: the
 * gaps between a window's parts and its round corners are hit-tested as the canvas underneath.  BASINS' fix is not a
 * shield or a backdrop: the canvas's own handlers ask "is this point UI space?" before they act.
 *
 * THE LAWS IT KEEPS (BASINS', value for value)
 *   1. A RECT, NOT A TARGET.  UI space is a list of rects (`rects()`), read when an event arrives — never a permanent
 *      measurement loop, never an element laid over the picture, no CSS.
 *   2. A WHEEL IN UI SPACE NEVER ZOOMS THE PICTURE.  It is re-dispatched as a synthetic wheel to that region's scroller
 *      (its own handler keeps its zoom, conversion and modifier semantics); when nobody took it (not defaultPrevented)
 *      and no Ctrl/⌘ is held, the scroller is scrolled by hand along each axis whose overflow is auto or scroll (a
 *      synthetic event scrolls nothing natively).  A region with no scroller just swallows it.
 *   3. A PRESS IN UI SPACE STARTS NOTHING: a touch tap in a gap cannot start navigation, and a swipe from a gap is not
 *      turned into scrolling (the press is cancelled where it lands; no touch is forwarded).
 *   4. A DRAG BEGUN ON THE PICTURE KEEPS ITS CAPTURE across the UI: moves, ups and cancels of a pointer that went down
 *      outside UI space always reach the picture.  A new HOVER in UI space (no button down) is held back only when the
 *      app asks (`hover: true`; BASINS: a cruise cannot be steered through a gap).
 *   5. HIDDEN UI RELEASES ITS SPACE: with `body.ui-hidden` nothing is UI space, and uiSpace() reads only what is visible.
 *   6. The rack's SHADOW GUTTER is paint, not UI: the picture beside a rack (and beside a float) still takes the wheel.
 *
 * createSceneGuard({ canvas, rects, hover = false, install = true, view, doc }) → { hit(e), wheel(e, region), destroy() }
 *   canvas   the picture's element (the target the guard watches)
 *   rects    () → [{ left, top, right, bottom } | { left, top, width, height }, …]; an entry may carry `scroll`: the
 *            element a wheel there goes to, or (event) → element | null.  uiSpace() below makes this list for an app.
 *   install  true: the guard listens on the window in the CAPTURE phase and stops an event aimed at `canvas` in UI space
 *            before any of the app's own listeners see it (pointerdown, mousedown, touchstart, click, dblclick,
 *            contextmenu, wheel, and hover moves with `hover`), so an app's gesture code needs no edit.
 *            false: nothing is installed; the app's gesture engine calls hit(e) and wheel(e, region) itself (BASINS:
 *            `const r = guard.hit(e); if (r) guard.wheel(e, r); else onWheel(e)`, and `if (guard.hit(e)) return` on a press).
 *   hit(e) → the region { left, top, right, bottom, scroll } under the event, or null
 *
 * uiSpace({ rack, layer, extra }) → rects(): the kit's UI space in one call (the rack's two columns without their shadow
 *   gutter, each with the rack as its scroller; every visible thing in the float layer — a floating rack window, a kit
 *   window and its rail, the modulation window with its work bars — by its whole rect; and `extra()` rects of the
 *   app's own).  createApp() makes the guard with this list for the stage's canvas: `app.sceneGuard`. */

/* the kit's own scrollers inside a floating thing: the modulation window's device row (the whole window scrolls it,
   BASINS: the modwin's `.m2run`), then the timeline's viewport (only under it, BASINS: `.tl-viewport`) */
const ROW = '.m2run', VIEWPORT = '.tl-viewport', BARS = '.m2workbar';

const inside = (r, e) => !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
/** box(r) → { left, top, right, bottom } from a DOMRect, a { left, top, width, height } or a { left, top, right, bottom } */
export function box(r) {
  if (!r) return null;
  const left = +r.left, top = +r.top;
  const right = Number.isFinite(+r.right) && r.right !== undefined ? +r.right : left + (+r.width || 0);
  const bottom = Number.isFinite(+r.bottom) && r.bottom !== undefined ? +r.bottom : top + (+r.height || 0);
  if (![left, top, right, bottom].every(Number.isFinite) || right <= left || bottom <= top) return null;
  return { left, top, right, bottom };
}
/** regionAt(list, e) → the first entry whose rect holds the point (pure, node-tested) */
export function regionAt(list, e) {
  for (const r of list || []) { const b = box(r); if (b && inside(b, e)) return { ...b, scroll: r.scroll || null }; }
  return null;
}
/** wheelStep(deltaMode, pageHeight) → px per delta unit (BASINS: line 16 px, page = the scroller's height) */
export const wheelStep = (mode, page) => (mode === 1 ? 16 : mode === 2 ? page : 1);

export function createSceneGuard({ canvas, rects, hover = false, install = true, view = globalThis.window, doc = globalThis.document } = {}) {
  const read = typeof rects === 'function' ? rects : () => rects || [];
  const life = new AbortController();
  function hit(e) {
    if (doc && doc.body && doc.body.classList.contains('ui-hidden')) return null;
    let list; try { list = read() || []; } catch (_) { list = []; }
    const r = regionAt(list, e);
    if (r && typeof r.scroll === 'function') { try { r.scroll = r.scroll(e) || null; } catch (_) { r.scroll = null; } }
    return r;
  }
  function wheel(e, region) {
    e.preventDefault();
    const node = region && region.scroll;
    if (!node) return;
    /* synthetic events do not scroll natively: first let the scroller's own wheel handler own the conversion, the zoom and
       the modifiers */
    const fwd = new view.WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY,
      deltaX: e.deltaX, deltaY: e.deltaY, deltaZ: e.deltaZ, deltaMode: e.deltaMode,
      ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, altKey: e.altKey });
    node.dispatchEvent(fwd);
    if (fwd.defaultPrevented || e.ctrlKey || e.metaKey) return;
    const css = view.getComputedStyle(node), step = wheelStep(e.deltaMode, node.clientHeight);
    if (/^(auto|scroll)$/.test(css.overflowY)) node.scrollTop += e.deltaY * step;
    if (/^(auto|scroll)$/.test(css.overflowX)) node.scrollLeft += e.deltaX * step;
  }

  if (install && canvas && view) {
    const mine = (e) => e.target === canvas;
    const down = new Set();                                 // pointers that went down on the picture: their drag is the picture's
    const blocked = new Set();                              // pointers whose press landed in UI space
    const stop = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
    const o = { capture: true, passive: false, signal: life.signal };
    view.addEventListener('pointerdown', (e) => {
      if (!mine(e)) return;
      if (hit(e)) { blocked.add(e.pointerId); stop(e); } else down.add(e.pointerId);
    }, o);
    view.addEventListener('pointermove', (e) => {
      if (!mine(e)) return;
      if (blocked.has(e.pointerId)) { stop(e); return; }     // a swipe from a gap is nobody's
      if (hover && !down.has(e.pointerId) && !e.buttons && hit(e)) stop(e);
    }, o);
    for (const k of ['pointerup', 'pointercancel']) view.addEventListener(k, (e) => {
      down.delete(e.pointerId);
      if (blocked.delete(e.pointerId) && mine(e)) stop(e);
    }, o);
    /* the compatibility mouse and touch events and the click a gap tap would still make */
    for (const k of ['mousedown', 'touchstart', 'click', 'dblclick', 'contextmenu']) view.addEventListener(k, (e) => {
      if (!mine(e)) return;
      const p = k === 'touchstart' && e.touches && e.touches[0] ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } : e;
      if (hit(p)) stop(e);
    }, o);
    view.addEventListener('wheel', (e) => { if (!mine(e)) return; const r = hit(e); if (r) { e.stopImmediatePropagation(); wheel(e, r); } }, o);
  }
  return { hit, wheel, destroy: () => life.abort() };
}

/* ── the kit's UI space ─────────────────────────────────────────────────────────────────────────────────────── */
/** a rack column: shown, laid out and not faded (BASINS visibleBox: one style read) */
function visibleBox(node, view) {
  if (!node || node.hidden || !node.getClientRects().length) return null;
  const css = view.getComputedStyle(node);
  if (css.display === 'none' || css.visibility === 'hidden' || +css.opacity === 0) return null;
  const r = node.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? r : null;
}
/** a floating thing: its rect alone decides (a closed one is display: none or hidden) — no style read (BASINS §3) */
function rectOf(node) {
  if (!node || node.hidden || !node.getClientRects().length) return null;
  const r = node.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? r : null;
}
const union = (list) => (list.length ? { left: Math.min(...list.map((r) => r.left)), top: Math.min(...list.map((r) => r.top)),
  right: Math.max(...list.map((r) => r.right)), bottom: Math.max(...list.map((r) => r.bottom)) } : null);

export function uiSpace({ rack = null, layer = null, extra = null, view = globalThis.window } = {}) {
  return () => {
    const out = [];
    /* the rack's columns: the shadow gutter (--rack-shadow-gutter, on the inner side) is paint, not UI; the column follows
       its real transform while it hides or reveals; an empty column is no space at all */
    const racks = rack && rack.el && rack.el.racks ? rack.el.racks : {};
    for (const side of ['left', 'right']) {
      const node = racks[side], r = visibleBox(node, view);
      if (!r || !node.querySelector('.dev:not(.closed):not([hidden])')) continue;
      const g = parseFloat(view.getComputedStyle(node).getPropertyValue('--rack-shadow-gutter')) || 0;
      out.push({ left: r.left + (side === 'right' ? g : 0), right: r.right - (side === 'left' ? g : 0), top: r.top, bottom: r.bottom, scroll: node });
    }
    /* the float layer: every visible thing in it is a window (a floating rack window, a kit window, its rail, the
       modulation window) and its WHOLE rect is UI space; a closed one is display: none, so its rect alone decides */
    const L = layer || (rack && rack.el && rack.el.floats) || null;
    if (L) for (const node of L.children) {
      const r = rectOf(node); if (!r) continue;
      const bars = [...node.querySelectorAll(BARS)].map(rectOf).filter(Boolean);   // work bars can sit outside the root's box
      const b = bars.length ? union([r, ...bars]) : r;
      const row = node.querySelector(ROW), port = node.querySelector(VIEWPORT);
      out.push({ left: b.left, top: b.top, right: b.right, bottom: b.bottom,
        scroll: row || (port ? (e) => (inside(rectOf(port), e) ? port : null) : null) });
    }
    if (typeof extra === 'function') { try { for (const r of extra() || []) out.push(r); } catch (_) { /* an app's list that threw adds nothing */ } }
    return out;
  };
}
