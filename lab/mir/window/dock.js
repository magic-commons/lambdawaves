/* window/dock.js — snapping a window between the racks.
 *
 * THE LAW IT KEEPS: THE GUIDE IS THE LANDING.  One function, dockGeometry(), says where a docked window lands — the
 * free span between the racks, the window's own height, and a lane on the CHIPS' side so the rail never sits on the
 * racks — and the same function draws the guide (core/proximity.js paints exactly the rect it is handed).  In BASINS
 * the modulation window's guide came from an older snapTarget() that always reserved the lane on the left, while its
 * commit used this geometry with the real chip side: the guide showed a box the window never landed in (survey B §3a).
 *
 * The span is the host's: { left, right, top, bottom } of the room the racks leave.  observeSpan() is a small helper
 * that watches the rack elements; a host makes ONE and hands it to every window (BASINS ran two, each with its own
 * observers and its own 350 ms rAF loop on the same two racks).  It does no work when nothing moves: a resize or a
 * ResizeObserver books one read, and a rack's own transition is followed frame by frame through the one frame only
 * until it ends.
 *
 * Harvested from BASINS timeline-dock.js (the geometry), mod-window-snap.js (SNAP), rack-bounds.js (the span).
 */
import { frame } from '../core/frame.js';
import { rect } from '../core/perf.js';
import { createProximity } from '../core/proximity.js';

export const DOCK = Object.freeze({ edge: 8, lane: 64, reach: 96, capture: 32, minWidth: 320, minHeight: 52 });
const SIDES = ['left', 'right', 'top', 'bottom'];

/** dockGeometry({ span, side, dock, height, railSizes, viewport }) — the exact rect a window docked at `dock`
 *  ('top' | 'bottom') lands in, with the chip lane on `side`.  If the preferred side has no room the others are
 *  tried in order (the preference is the caller's and is not changed).  → { left, top, width, height, side } | null */
export function dockGeometry({ span, side = 'left', dock = 'bottom', height, railSizes, viewport, edge = DOCK.edge, lane = DOCK.lane, minWidth = DOCK.minWidth }) {
  const vw = viewport.width, vh = viewport.height;
  for (const eff of [side, ...SIDES.filter((s) => s !== side)]) {
    const v = eff === 'left' || eff === 'right', size = railSizes[v ? 'vertical' : 'horizontal'];
    if (size.w > vw - edge * 2 || size.h > vh - edge * 2) continue;
    const room = v ? Math.max(lane, size.w) : size.h + edge;
    const left = Math.max(edge, span.left) + (eff === 'left' ? room : 0);
    const right = Math.min(vw - edge, span.right) - (eff === 'right' ? room : 0);
    const top = Math.max(edge, span.top ?? edge) + (eff === 'top' ? room : 0);
    const bottom = Math.min(vh - edge, span.bottom ?? vh - edge) - (eff === 'bottom' ? room : 0);
    if (right - left < minWidth || bottom - top < DOCK.minHeight) continue;
    const h = Math.min(height, bottom - top);
    return { left: Math.round(left), top: Math.round(dock === 'top' ? top : bottom - h), width: Math.floor(right - left), height: Math.floor(h), side: eff };
  }
  return null;
}

/** dockTargets(o) — the two docks as proximity targets: `rect` IS dockGeometry() (the guide = the landing), `hit` is
 *  the landing's leading edge, so a window is captured as its top (or bottom) edge comes within reach of it */
export function dockTargets(o) {
  const out = [];
  for (const dock of ['top', 'bottom']) {
    const g = dockGeometry({ ...o, dock });
    if (!g) continue;
    const y = dock === 'top' ? g.top : g.top + g.height;
    out.push({ id: dock, rect: { left: g.left, top: g.top, width: g.width, height: g.height }, hit: { left: g.left, top: y, width: g.width, height: 0 }, shape: 'rect', side: g.side });
  }
  return out;
}

/** anchorTarget(box, seat, { reach }) — BASINS mod-window-snap.js anchorTarget (Josh's fix: the PATTERN window seated on
 *  its ENV device): another element's rect is a dock target too.  The landing is the seat's left, top and width with the
 *  window's own height; distance is measured CORNER TO CORNER (the window's top-left to the seat's), with the same reach
 *  and capture as an edge dock.  → a proximity target, or null when there is no seat or it is out of reach */
export function anchorTarget(box, seat, { reach = DOCK.reach } = {}) {
  if (!seat || !(seat.width > 0)) return null;
  const L = box.left ?? box.x, T = box.top ?? box.y, sl = seat.left ?? seat.x, st = seat.top ?? seat.y;
  if (Math.hypot(L - sl, T - st) >= reach) return null;
  return { id: 'anchor', rect: anchorBox(seat, box.height), hit: { x: sl, y: st }, shape: 'rect', side: null };
}
/** anchorBox(seat, height) — where a window docked on an anchor lands: the seat's left, top and width, its own height */
export const anchorBox = (seat, height) => ({ left: Math.round(seat.left ?? seat.x), top: Math.round(seat.top ?? seat.y), width: Math.round(seat.width), height: Math.round(height) });

/** createDockGuide({ layer, enabled, window, cls }) — the drop-here guide for the two edge docks and, when the host
 *  gives one, an anchor seat (reach 96, capture 32, as BASINS has it).  track(box, geometryInputs, seat?) measures
 *  and paints (the edges by the window's box, the anchor corner to corner); end() → the captured target or null
 *  (release lands there; the nearer one wins when both capture); cancel() clears at once (Escape, blur, a hidden page
 *  — proximity.js listens).  enabled() false is the host's Display switch: nothing is drawn and the snap still works.
 *  ONE DRAWING: the kit's proximity guide (core.css .mir-prox).  Its overlays carry stable hooks so an adopting app's
 *  rigs keep their selectors: `data-mir-guide="dock"`, `data-window="<window>"`, `data-edge="top|bottom|anchor"` while
 *  lit, and the classes in `cls` (BASINS: { window: 'patternwin', cls: 'mod-snap-guide' } keeps its rigs'
 *  `.mod-snap-guide[data-window="patternwin"]`). */
export function createDockGuide({ layer, enabled = () => true, window: owner = '', cls = '' } = {}) {
  /* both proximities paint into the host's layer, as before (an app or a test may select `#floats > .mir-prox`).  Which
     pooled overlays are this guide's is learnt by the one thing that is exact: an overlay lit at one of THIS guide's
     landing rects is this guide's, and stays so (a proximity never lends its pool) */
  const edges = createProximity({ layer, reach: DOCK.reach, capture: DOCK.capture, enabled });
  const seat = createProximity({ layer, reach: DOCK.reach, capture: DOCK.capture, enabled });
  const classes = String(cls || '').split(/\s+/).filter(Boolean);
  const mine = new Set();
  let lit = [];                                                      // [{ id, rect }] painted by the last track
  const at = (o, r) => o.style.left === `${r.left}px` && o.style.top === `${r.top}px` && o.style.width === `${r.width}px` && o.style.height === `${r.height}px`;
  const tag = () => {
    for (const o of layer.querySelectorAll(':scope > .mir-prox[data-prox]')) {
      if (mine.has(o) || o.dataset.mirGuide || !lit.some((t) => at(o, t.rect))) continue;
      mine.add(o); o.dataset.mirGuide = 'dock'; if (owner) o.dataset.window = owner; for (const c of classes) o.classList.add(c);
    }
    for (const o of mine) {
      const t = o.dataset.prox ? lit.find((x) => at(o, x.rect)) : null;
      if (t) { if (o.dataset.edge !== t.id) o.dataset.edge = t.id; } else if (o.dataset.edge) delete o.dataset.edge;
    }
  };
  return {
    track(box, o, anchor) {
      const t = dockTargets(o);
      const m = edges.update(box, t);
      const a = anchor ? anchorTarget(box, anchor) : null;
      if (a) seat.update({ x: box.left ?? box.x, y: box.top ?? box.y }, [a]); else seat.end();
      lit = [...t, ...(a ? [a] : [])].map((x) => ({ id: x.id, rect: x.rect }));
      frame.write(tag);
      return m;
    },
    end() {
      const me = edges.end(), ma = seat.end();
      const e = me && me.captured ? me : null, a = ma && ma.captured ? ma : null;
      lit = []; frame.write(tag);
      if (e && a) return a.distance <= e.distance ? a.captured : e.captured;
      return (a || e) ? (a || e).captured : null;
    },
    cancel() { edges.cancel(); seat.cancel(); lit = []; tag(); },
    destroy() { edges.destroy(); seat.destroy(); mine.clear(); },
  };
}

/** observeSpan({ left, right, edge, view, occupied, narrow, active }) — the free span between two rack elements
 *  (either may be null) as { read(), subscribe(fn) → off, setActive(on), destroy() }.  It is BASINS' observeRackBounds
 *  (rack-bounds.js), the one BASINS docks its windows against, so a window docks where BASINS docked it:
 *    · a rack's edge is its LOGICAL edge: the shadow gutter (`--rack-shadow-gutter`, BASINS' 48 px paint space) is
 *      subtracted, on the left rack's right and the right rack's left;
 *    · a rack is ABSENT (the span reaches the screen edge, `edge` px in) when it is missing or `hidden`, when it holds
 *      no open window (`occupied`, default `.dev:not(.closed):not([hidden])`; pass false to count any rack), when it is
 *      `display: none` or `visibility: hidden` (a hidden rack, once its slide ends), when the body is `phone` or
 *      `ui-hidden`, or when the viewport is `narrow` (860) px wide or less (the rack runs along the bottom there);
 *    · `setActive(false)` stops it publishing (BASINS turns it on while a docking window is open); `read()` always
 *      answers.  `active` is the starting state (default true).
 *  It does no work while idle: a resize, a ResizeObserver tick or a class / membership change books one read through
 *  the one frame, and a rack's own transition is followed frame by frame only until it ends.  Make ONE per page.
 *  → read() gives { left, right, width, top, bottom }. */
export function observeSpan({ left = null, right = null, edge = DOCK.edge, view = globalThis.window,
  occupied = '.dev:not(.closed):not([hidden])', narrow = 860, active = true } = {}) {
  const doc = view.document, body = doc.body, fns = new Set(), racks = [left, right].filter(Boolean);
  let last = '', following = 0, on = !!active;
  /** the logical inner edge of one rack, or null when it is absent */
  const edgeOf = (n, side) => {
    if (!n || !n.isConnected || n.hidden || view.innerWidth <= narrow) return null;
    if (body.classList.contains('phone') || body.classList.contains('ui-hidden')) return null;
    if (occupied && !n.querySelector(occupied)) return null;
    const cs = view.getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || !n.getClientRects().length) return null;
    const r = rect(n), gutter = parseFloat(cs.getPropertyValue('--rack-shadow-gutter')) || 0;
    return side === 'left' ? r.right - gutter : r.left + gutter;
  };
  function read() {
    const vw = view.innerWidth, vh = view.innerHeight, clamp = (v) => Math.min(vw - edge, Math.max(edge, v));
    const l = edgeOf(left, 'left'), r = edgeOf(right, 'right');
    const L = l === null ? edge : clamp(l), R = r === null ? vw - edge : clamp(r);
    return { left: L, right: R, width: Math.max(0, R - L), top: edge, bottom: vh - edge };
  }
  const publish = () => {
    if (!on) return;
    const s = read(), key = `${s.left.toFixed(1)}:${s.right.toFixed(1)}:${s.bottom}`;
    if (key !== last) { last = key; for (const fn of fns) fn(s); }
  };
  const book = () => { if (on) frame.read(publish); };
  const tick = () => { publish(); if (following && on) frame.read(tick); };
  const transition = (e) => {
    if (!racks.includes(e.target)) return;
    if (e.type === 'transitionrun') { if (!following++ && on) frame.read(tick); }
    else { following = Math.max(0, following - 1); book(); }
  };
  const ro = view.ResizeObserver ? new view.ResizeObserver(book) : null;
  for (const n of racks) if (ro) ro.observe(n);
  /* a window opening into an empty rack, a hide, H, the phone: membership and classes change the span */
  const mo = view.MutationObserver ? new view.MutationObserver(book) : null;
  if (mo) {
    mo.observe(body, { attributes: true, attributeFilter: ['class'] });
    for (const n of racks) mo.observe(n, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  }
  view.addEventListener('resize', book, { passive: true });
  for (const t of ['transitionrun', 'transitionend', 'transitioncancel']) doc.addEventListener(t, transition);
  return {
    read,
    subscribe(fn) { fns.add(fn); return () => fns.delete(fn); },
    /** setActive(on) — publish or stand down (BASINS: on while a docking window is open); on again republishes */
    setActive(v) { on = !!v; if (on) { last = ''; book(); } else { following = 0; } return on; },
    get active() { return on; },
    destroy() {
      fns.clear(); following = 0; on = false; if (ro) ro.disconnect(); if (mo) mo.disconnect();
      view.removeEventListener('resize', book);
      for (const t of ['transitionrun', 'transitionend', 'transitioncancel']) doc.removeEventListener(t, transition);
    },
  };
}
