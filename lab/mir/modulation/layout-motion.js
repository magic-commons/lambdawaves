/* modulation/layout-motion.js — THE MODULATION WINDOW'S LAYOUT MOTION (harvested from BASINS app/rack-motion.js
 * createLayoutMotion, branch basins-ui-fixes-2026-10-01, 2026-10-02; Josh: "Rack is going to have a drag animation
 * effect. Copy the same thing to the modulation window devices and macros").
 *
 * Explicit layout TRANSACTIONS for the modulation shelf: change(fn) reads every node's place and size, runs fn (a fold,
 * COMPACT, the macro rail folding, a reorder's DOM move), reads them again, and animates each node from where it was
 * to where it now lays out — real widths and heights (so neighbouring devices move with a shrinking rail; text is never
 * scaled) and a `translate` for the travel.  A reorder keeps the original DOM nodes, live curve editors included: the
 * held node follows the hand (hold / follow / release) and is never animated by a change; on release it settles from
 * the hand into its slot.
 *
 * Why not the rack's createRackMotion (shell/rack.js): that one OBSERVES its cards (any size change anywhere animates)
 * and moves vertical `.dev` cards; this window rebuilds its devices on edits and lays them out sideways, so it moves only
 * inside a transaction the controller opens.  BASINS ships the two for the same reason.
 *
 * THE LAWS IT KEEPS: BASINS' numbers are the kit's tokens (320 ms --motion-structural, cubic-bezier(.22, 1, .36, 1)
 * --ease-out); reduced motion, `off` and the flat tier (duration 0) jump; every animation joins core/motion.js's
 * registry (own) except the window's own box, whose placement waits on it otherwise; no loop: idle costs nothing.
 *   createLayoutMotion(nodes, { skipOwn? }) → { change(fn, sizing = true), hold(node), follow(node, x, y), layoutRect(node),
 *                                              release(node), holding, destroy() }
 *   wireReorder(grip, node, { host, selector, axis, motion, commit, … }) → the drag — THE REORDER ENGINE, below */
import { motionPolicy, motionToken, own } from '../core/motion.js';
import { drag as pointerDrag } from '../core/pointer.js';

/** wireReorder(grip, node, o) — THE REORDER ENGINE (BASINS modwindow.js wireReorder + rack-motion.js; the modulation
 *  window's devices and macro rows since 1.5.0-alpha.9, the transport's macro tiles since wave 22 — Josh's call 21).
 *  The grip's drag is core/pointer.js (the last sample flushed before the commit; Escape, a lost capture, a blur or a
 *  hidden page cancel it).  The held node follows the hand by `translate` (motion.hold / follow / release) and is NEVER
 *  moved in the DOM while it is held: re-inserting the node that holds the pointer releases its capture, and on touch
 *  the finger is lost.  Crossing a neighbour moves the NEIGHBOURS past it inside motion.change, so they glide; nothing is
 *  rebuilt during the drag.  Release commits the order and the node settles into its slot; a cancel puts it back.  A
 *  press that never travels is a tap.
 *    host, selector  the list and its items (`:scope > .m2slot`)
 *    axis       'x' or 'y': a row or a column, a neighbour crossed 8 px past its middle; 'grid': a wrapping grid in
 *               reading order (the transport's two columns), a neighbour crossed when the held node's centre is inside it
 *               by 8 px (a quarter of a small tile)
 *    motion     a createLayoutMotion over the items
 *    commit(index)  the node's place on release · tap(e)  a press that never travelled (its lift) · slop  px before a drag (3)
 *    began(cancel)  a drag starts, with its cancel (one reorder at a time is the caller's) · ended()  it is over
 *    settle()   after either end (the window applies, paints and persists) */
export function wireReorder(grip, node, { host, selector, axis = 'y', motion, commit, tap = () => {}, began = () => {}, ended = () => {}, settle = () => {}, slop = 3 } = {}) {
  let d = null, dragged = false;
  grip.addEventListener('pointerdown', (e) => { if (!e.button) { e.stopPropagation(); dragged = false; } });   // the grip's press is not the device's nor the window's
  const gd = pointerDrag(grip, { slop,
    onStart(st) {
      began(() => gd.cancel());
      dragged = true;
      const r = node.getBoundingClientRect();
      d = { dx: st.x0 - r.left, dy: st.y0 - r.top, left: r.left, top: r.top, next: node.nextSibling };
      node.classList.add(axis === 'x' ? 'm2drag' : 'm2reorder');
      motion.hold(node);
    },
    onMove(st) {
      if (!d) return;
      const r = motion.layoutRect(node), rows = [...host.querySelectorAll(selector)], at = rows.indexOf(node);
      let crossed = null, backward = false;
      if (axis === 'grid') {
        const cx = st.x - d.dx + r.width / 2, cy = st.y - d.dy + r.height / 2;
        for (const other of rows) {
          if (other === node) continue;
          const q = motion.layoutRect(other), ix = Math.min(8, q.width / 4), iy = Math.min(8, q.height / 4);
          if (cx > q.left + ix && cx < q.left + q.width - ix && cy > q.top + iy && cy < q.top + q.height - iy) { crossed = other; break; }
        }
        backward = !!crossed && rows.indexOf(crossed) < at;
      } else {
        const center = axis === 'x' ? st.x - d.dx + r.width / 2 : st.y - d.dy + r.height / 2;
        const natural = axis === 'x' ? r.left + r.width / 2 : r.top + r.height / 2;
        backward = center < natural;
        const candidates = backward ? rows.slice(0, at).reverse() : rows.slice(at + 1);
        for (const other of candidates) {
          const q = motion.layoutRect(other), mid = axis === 'x' ? q.left + q.width / 2 : q.top + q.height / 2;
          if (backward ? center < mid - 8 : center > mid + 8) crossed = other;
          else break;
        }
      }
      /* the NEIGHBOURS move, never the held node */
      if (crossed) motion.change(() => {
        const ci = rows.indexOf(crossed);
        if (backward) { const ref = node.nextSibling; for (const n of rows.slice(ci, at)) host.insertBefore(n, ref); }
        else for (const n of rows.slice(at + 1, ci + 1)) host.insertBefore(n, node);
      }, false);
      motion.follow(node, axis === 'y' ? d.left : st.x - d.dx, axis === 'x' ? d.top : st.y - d.dy);
    },
    onEnd() { finish(false); },
    onCancel() { finish(true); },
  });
  function finish(cancel) {
    if (!d) return;
    const old = d; d = null; ended();
    node.classList.remove('m2drag', 'm2reorder');
    if (cancel) motion.change(() => host.insertBefore(node, old.next && old.next.parentElement === host ? old.next : null), false);
    else commit([...host.querySelectorAll(selector)].indexOf(node));
    motion.release(node); settle();
  }
  grip.addEventListener('pointerup', (e) => { if (!e.button && !dragged) tap(e); });   // the event: a tapWatcher's 14 px half
  return gd;
}

export function createLayoutMotion(nodes, { skipOwn = () => false } = {}) {
  const animations = new Map();
  let held = null;
  const timing = () => ({ duration: motionToken('structural'), easing: motionToken('out') });
  const live = () => motionPolicy() === 'full' && timing().duration > 0;
  const list = () => [...nodes()].filter((n) => n && n.getClientRects().length);
  const point = (n) => {
    const r = n.getBoundingClientRect(), p = n.parentElement.getBoundingClientRect();
    return { x: r.left - p.left + n.parentElement.scrollLeft, y: r.top - p.top + n.parentElement.scrollTop, w: r.width, h: r.height };
  };
  const stop = (n) => { for (const a of animations.get(n) || []) a.cancel(); animations.delete(n); };
  const animate = (n, frames) => {
    const a = n.animate(frames, timing());
    const bag = animations.get(n) || []; bag.push(a); animations.set(n, bag);
    if (!skipOwn(n)) own(n, a);
    a.finished.then(() => { const now = animations.get(n); if (!now) return;
      const i = now.indexOf(a); if (i >= 0) now.splice(i, 1); if (!now.length) animations.delete(n);
    }).catch(() => { /* cancelled: a newer change took the node */ });
  };
  /** change(fn, sizing) — the transaction: measure, fn(), measure, animate (sizes too unless sizing is false) */
  function change(fn, sizing = true) {
    const before = new Map(list().map((n) => [n, point(n)]));
    for (const n of animations.keys()) stop(n);
    fn();
    if (!live()) return;
    const after = new Map(list().map((n) => [n, point(n)]));
    if (sizing) for (const [n, r] of after) {
      const b = before.get(n); if (!b || n === (held && held.node)) continue;
      const from = {}, to = {};
      if (Math.abs(b.w - r.w) > 0.5) { from.width = b.w + 'px'; to.width = r.w + 'px'; }
      if (Math.abs(b.h - r.h) > 0.5) { from.height = b.h + 'px'; to.height = r.h + 'px'; }
      if (Object.keys(from).length) animate(n, [from, to]);
    }
    for (const [n] of after) {
      const b = before.get(n); if (!b || n === (held && held.node)) continue;
      const r = point(n), dx = b.x - r.x, dy = b.y - r.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) animate(n, [{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }]);
    }
  }
  return {
    change,
    /** hold(node) — the hand takes it: no change animates it, its place is the hand's */
    hold(node) { stop(node); held = { node, x: 0, y: 0 }; },
    /** follow(node, x, y) — the node's top-left SEEN at (x, y) */
    follow(node, x, y) {
      if (!held || held.node !== node) return;
      const r = node.getBoundingClientRect();
      held.x = x - (r.left - held.x); held.y = y - (r.top - held.y);
      node.style.translate = `${held.x}px ${held.y}px`;
    },
    /** layoutRect(node) — where it LAYS OUT, without the hand's or a travel's translate */
    layoutRect(node) {
      const r = node.getBoundingClientRect();
      let x = 0, y = 0;
      if (held && held.node === node) { x = held.x; y = held.y; }
      else if (animations.has(node)) { const t = getComputedStyle(node).translate.split(' '); x = parseFloat(t[0]) || 0; y = parseFloat(t[1]) || 0; }
      return { left: r.left - x, top: r.top - y, width: r.width, height: r.height };
    },
    /** release(node) — the hand lets go: it settles from where it is seen into its slot */
    release(node) {
      if (!held || held.node !== node) return;
      const from = `${held.x}px ${held.y}px`; held = null; node.style.removeProperty('translate');
      if (live()) animate(node, [{ translate: from }, { translate: '0px 0px' }]);
    },
    get holding() { return held ? held.node : null; },
    destroy() { if (held) held.node.style.removeProperty('translate'); held = null; for (const n of [...animations.keys()]) stop(n); },
  };
}
