/* lab/summon.js — THE SUMMONS (037 T2; Josh, BRIEF.md STAGE FX: "a rack window can trigger another rack window … it will show the stage window
 * *appearing just below* the settings window … the pill of settings seemingly do a 'mitosis' … and it rushes to the new Stage window's title bar.
 * If called during the oldschool way like the finders/add window, then let it add to the rack as normal").
 * summon(rk, fromId, id) — `id` opens DIRECTLY BELOW `fromId`, in fromId's rack (the kit's open(id, { side, index }), the informational.js
 * precedent; already open, it is docked or moved there and unfolded, nothing raised), then THE MITOSIS plays once: a clone of fromId's title
 * bar is laid over it and a second pill wearing id's title slides out from under it (the pill doubles, the title passing to the new window's)
 * for 180 ms, then that lower half rushes down to id's title bar and dissolves as the real one fades in — 360 ms in all, the kit's easing;
 * nothing moves under reduced motion (the kit's policy).  A `fromId` not seated in a rack (closed, hidden, floating): `id` opens as from the
 * FINDER.  The FINDER never comes here.  The pills are the cards' own nodes copied (their glass and words), in one fixed layer drawn at the UI
 * scale, gone when the motion lands.  Chain L's CAMERA → LIGHTING reuses it. */
import { motionPolicy, motionToken } from './mir/core/motion.js';
import { cssZoom } from './mir/core/zoom.js';
const STEP = 180;
const devOf = (id) => document.querySelector('.dev[data-id="' + id + '"]');
const seated = (d) => !!d && !d.hidden && !d.classList.contains('closed') && !d.classList.contains('floating') && !!d.parentElement && 'mirRack' in d.parentElement.dataset;
export function summon(rk, fromId, id) {
  const from = devOf(fromId), to = devOf(id);
  if (!rk || !to) return false;
  if (!seated(from)) return rk.reveal(id);
  const rack = from.parentElement, side = rack.dataset.side;
  const index = [...rack.children].filter((c) => c !== to && c.classList.contains('dev') && !c.hidden && !c.classList.contains('closed')).indexOf(from) + 1;
  if (to.classList.contains('floating')) rk.dock(id, { side, index });
  else if (to.classList.contains('closed')) rk.open(id, { side, index });
  else rk.move(id, { side, index });
  if (to.classList.contains('folded')) rk.fold(id, false);
  to.scrollIntoView({ block: 'nearest' });
  if (motionPolicy() === 'full' && to.parentElement === rack) mitosis(from, to);
  return true;
}
/** the two pills: fromId's title bar over itself, id's under it; offsets in the rack's own px (the layer wears the same zoom) */
function mitosis(from, to) {
  const fh = from.querySelector(':scope > .dev-head'), th = to.querySelector(':scope > .dev-head');
  if (!fh || !th || typeof th.animate !== 'function') return;
  const z = cssZoom(from), r = from.getBoundingClientRect(), h = fh.offsetHeight, dy = to.offsetTop - from.offsetTop;
  const layer = document.createElement('div'); layer.className = 'lw-mitosis'; layer.setAttribute('aria-hidden', 'true'); layer.inert = true;
  const pill = (card, head) => {
    const p = document.createElement('section'); p.className = 'dev folded lw-mitosis-pill' + (card.classList.contains('native-clean') ? ' native-clean' : '');
    if (card.dataset.kind) p.dataset.kind = card.dataset.kind;
    const c = head.cloneNode(true); for (const n of c.querySelectorAll('[id]')) n.removeAttribute('id'); p.appendChild(c);
    Object.assign(p.style, { left: r.left / z + 'px', top: r.top / z + 'px', width: from.offsetWidth + 'px' });
    return layer.appendChild(p);
  };
  const B = pill(to, th), A = pill(from, fh), ease = motionToken('out'), T = 2 * STEP;
  document.body.appendChild(layer);
  const runs = [
    B.animate([{ translate: '0 0', opacity: 0.35, easing: ease }, { translate: `0 ${h}px`, opacity: 1, offset: 0.5, easing: ease }, { translate: `0 ${dy}px`, opacity: 0.85, offset: 0.85 }, { translate: `0 ${dy}px`, opacity: 0 }], { duration: T, fill: 'forwards' }),
    A.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: T, fill: 'forwards' }),
    ...[th, to.querySelector(':scope > .dev-body')].filter(Boolean).map((n) => n.animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: T })),   // the window materialises where the pill lands
  ];
  Promise.all(runs.map((a) => a.finished.catch(() => {}))).then(() => layer.remove());
}
/** 039 V2 · A SUMMONED WINDOW CLEARS THE BAR, THE LOGO AND THE OPEN WORK BAR (the walks: NODES over the logo and 17 bar buttons, RENDER over the bar's
 *  right half, FOLDERS over CAMERA and the timeline).  clearSeat(box, { avoid, view, top, gap }) — the seat NEAREST the one a window opened in (`box`,
 *  its seen rect, its rail included) that meets none of the rects in `avoid`, `gap` px clear of each and of the screen's edges, never above `top` (the
 *  menu row's band); a window already clear stays where it is.  → { left, top } (seen px), or null when no seat on the screen clears them.  Pure. */
export function clearSeat(box, { avoid = [], view, top = 52, gap = 8 }) {
  const w = box.right - box.left, h = box.bottom - box.top, hiX = view.width - gap - w, hiY = view.height - gap - h;
  if (hiX < gap || hiY < top) return null;
  const cx = (x) => Math.min(hiX, Math.max(gap, x)), cy = (y) => Math.min(hiY, Math.max(top, y));
  const meets = (a, b) => a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;
  const xs = new Set([box.left, ...avoid.flatMap((o) => [o.right + gap, o.left - gap - w])].map(cx)), ys = new Set([box.top, ...avoid.flatMap((o) => [o.bottom + gap, o.top - gap - h])].map(cy));
  let best = null, d = Infinity;
  for (const x of xs) for (const y of ys) {
    const r = { left: x, top: y, right: x + w, bottom: y + h }, e = Math.hypot(x - box.left, y - box.top);
    if (e < d && !avoid.some((o) => meets(r, o))) { d = e; best = { left: Math.round(x), top: Math.round(y) }; }
  }
  return best;
}
