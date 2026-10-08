/* core/proximity.js — one "drop here" primitive.
 *
 * THE LAW IT KEEPS: THE GUIDE IS DRAWN AT THE EXACT RECT WHERE RELEASE WOULD LAND.  The caller computes the
 * landing rect with the same function its commit uses and hands it here; this module never derives a rect of its
 * own.  (In BASINS the modulation window's guide came from one function and its commit from another, so the guide
 * showed a box the window never landed in — survey B §3a, "the dock feels off".)
 *
 * While something is dragged, every candidate target gets a strength from 0 to 1 by distance: 0 beyond `reach`,
 * rising to 1 at `capture`, and inside `capture` the nearest target is CAPTURED — release lands there.  The paint is
 * two writes per target: `--prox` (the strength) and `data-prox="far|near|capture"`; core.css draws the rest.
 * The geometry is pure and node-tested; the writes go through the one frame.  It ends one of two ways, like a
 * gesture: end() fades the guides out, cancel() (also on blur, a hidden page or Escape) clears them at once.
 * `enabled()` is the user's Display switch: off, the strengths are still computed (snapping still works) and
 * nothing is drawn.
 *
 * A target is { id, rect, hit?, shape?, el? }:
 *   rect   the landing rect, viewport px — where the guide is drawn
 *   hit    what distance is measured to: a rect, a line (a rect of zero height or width) or a point; default rect
 *   shape  'rect' (the dock guide) · 'slot' (an insertion line between cards) · 'ring' (a round target, a knob)
 *   el     paint on this element instead of a pooled overlay (a ring around an existing knob)
 */
import { frame } from './frame.js';
import { setVar, setAttr } from './perf.js';

const isRect = (p) => p && p.width !== undefined;
const L = (r) => r.left ?? r.x, T = (r) => r.top ?? r.y;

/** distance(probe, hit) — 0 inside or overlapping; a point to a rect is the distance to its nearest edge */
export function distance(p, h) {
  if (!isRect(p) && !isRect(h)) return Math.hypot(p.x - h.x, p.y - h.y);
  if (!isRect(p)) return distance(h, p);
  const hx = isRect(h) ? L(h) : h.x, hy = isRect(h) ? T(h) : h.y, hw = isRect(h) ? h.width : 0, hh = isRect(h) ? h.height : 0;
  const dx = Math.max(0, hx - (L(p) + p.width), L(p) - (hx + hw));
  const dy = Math.max(0, hy - (T(p) + p.height), T(p) - (hy + hh));
  return Math.hypot(dx, dy);
}

/** strength(d, reach, capture) — 0 at reach and beyond, 1 at capture and inside, smoothstep between */
export function strength(d, reach, capture) {
  if (d <= capture) return 1;
  if (d >= reach) return 0;
  const t = (reach - d) / (reach - capture);
  return t * t * (3 - 2 * t);
}

/** measure(probe, targets, { reach, capture }) — every target's distance, strength and state, and the best one.
 *  Only the nearest target inside `capture` is captured; a tie goes to the earlier target. */
export function measure(probe, targets, { reach = 96, capture = 32 } = {}) {
  const list = targets.map((t) => { const d = distance(probe, t.hit || t.rect); return { target: t, distance: d, strength: strength(d, reach, capture), state: 'far' }; });
  let best = null;
  for (const m of list) if (!best || m.distance < best.distance) best = m;
  for (const m of list) m.state = m === best && m.distance <= capture ? 'capture' : m.strength > 0 ? 'near' : 'far';
  return { list, best: best && best.strength > 0 ? best.target : null, distance: best ? best.distance : Infinity,
    strength: best ? best.strength : 0, captured: !!best && best.distance <= capture ? best.target : null };
}

/** createProximity({ layer, reach, capture, enabled, onCancel })
 *  → { update(probe, targets) → measure(), end(), cancel(), destroy(), last } */
export function createProximity({ layer = globalThis.document && document.body, reach = 96, capture = 32,
  enabled = () => true, onCancel } = {}) {
  const key = Symbol('prox'), pool = [], hosts = new Set();
  let last = null, live = false;
  const win = layer && layer.ownerDocument.defaultView, doc = layer && layer.ownerDocument;

  const overlay = (i) => {
    while (pool.length <= i) { const o = doc.createElement('div'); o.className = 'mir-prox'; o.setAttribute('aria-hidden', 'true'); layer.appendChild(o); pool.push(o); }
    return pool[i];
  };
  const rest = (node) => { setAttr(node, 'data-prox', null); setVar(node, '--prox', null); };
  const paint = (m) => {
    let used = 0; const seen = new Set();
    if (enabled()) for (const e of m.list) {
      const t = e.target;
      const node = t.el || overlay(used++);
      seen.add(node);
      if (t.el) { hosts.add(t.el); t.el.classList.add('mir-prox-host'); }
      else {
        setVar(node, 'left', `${L(t.rect)}px`); setVar(node, 'top', `${T(t.rect)}px`);
        setVar(node, 'width', `${t.rect.width}px`); setVar(node, 'height', `${t.rect.height}px`);
      }
      setAttr(node, 'data-shape', t.shape || (t.el ? 'ring' : 'rect'));
      setVar(node, '--prox', e.strength.toFixed(3));
      setAttr(node, 'data-prox', e.state);
    }
    for (const n of [...pool, ...hosts]) if (!seen.has(n)) rest(n);
  };
  const clear = () => { for (const n of [...pool, ...hosts]) rest(n); };
  const keys = (e) => { if (e.key === 'Escape') cancel(); };
  const hidden = () => { if (doc.visibilityState === 'hidden') cancel(); };
  const listen = (on) => {
    if (live === on || !win) return; live = on;
    const f = on ? 'addEventListener' : 'removeEventListener';
    win[f]('blur', cancel); win[f]('keydown', keys, true); doc[f]('visibilitychange', hidden);
  };

  function update(probe, targets) {
    last = measure(probe, targets, { reach, capture });
    listen(true);
    const m = last; frame.coalesce(key, () => paint(m));
    return last;
  }
  /** end() — the drag is over: the guides fade out (core.css), the last measurement is returned for the commit */
  function end() { const m = last; listen(false); frame.coalesce(key, clear); return m; }
  /** cancel() — the drag was abandoned: cleared now, and onCancel told */
  function cancel() {
    const wasLive = live; listen(false); last = null;
    frame.cancel(key); clear();
    if (wasLive && onCancel) onCancel();
  }
  return {
    update, end, cancel,
    get last() { return last; },
    destroy() { listen(false); frame.cancel(key); for (const o of pool) o.remove(); for (const h of hosts) { rest(h); h.classList.remove('mir-prox-host'); } pool.length = 0; hosts.clear(); },
  };
}
