/* lab/picker-fx.js — THE PICKER'S MOTION KERNEL (iteration 004, Josh 2026-10-17: "upgrade the new system with the machinery from the
 * 'SynchroSpectre' webpage effects").  Ported from the survey DATABASE/CLAUDE/APPS/LAMBDAWAVES/PLANS/IT004-SYNCHROSPECTRE-EFFECTS.md §3:
 *   R0  the kernel — ONE pointer frame per root (one pointermove, one rAF, mouse only), ONE cancellable WAAPI animation per element;
 *   R2  the spring tilt (k 640, c 34, 120 Hz substeps, 8°), applied to a tile's PICTURE only (no spotlight, no lit edge, no tint);
 *   032 THE CARD'S LIGHT — the album art's whole treatment (tilt, cursor glow, edge and approach glow, holographic rim, foil) on `.mm-holo`;
 *   R3  the staggered entrance and the "develop" of a lazy picture;
 *   R6  the caption swap (the old line leaves up 18 px / 120 ms and is gone, then the newest rises 14 px / 280 ms: one line in flight);
 *   R7  the install ring (an SVG circle, pathLength 100, the dash its progress).
 * Every effect honours prefers-reduced-motion: animate() does nothing under it, the pointer frame never fires, the CSS has its own block.
 * A plain module: no app, no state outside the elements it is handed. */
export const RM = matchMedia('(prefers-reduced-motion: reduce)');
const FINE = matchMedia('(hover: hover) and (pointer: fine)');
const EASE = 'cubic-bezier(.22,.7,.25,1)';
const T = { response: 170, enter: 280, leave: 200, titleLeave: 220, titleSwap: 120, reorder: 340 };
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const calm = () => RM.matches || document.hidden;
/** 032: the page asks for stillness — the media query, or the kit's motion policy on <html data-motion> (core/motion.js) */
export const still = () => RM.matches || /^(reduced|off)$/.test(document.documentElement.dataset.motion || '');

/* ── R0 · one cancellable native animation per element; null (and nothing happens) when motion is off.
   A lone keyframe is an ENTRANCE: it is the FROM (offset 0) and the element eases to its own style.  Web Animations reads a lone keyframe
   without an offset as the END state — the element faded OUT and snapped back (iteration 018 A1, Josh's "fake out" flicker); a leave
   passes its own `offset: 1`. ── */
const owners = new WeakMap();
export function animate(el, frames, duration = T.enter, delay = 0, easing = EASE) {
  if (!el) return null; const was = owners.get(el); if (was) was.cancel();
  if (calm() || !el.getClientRects().length) return null;
  if (frames.length === 1 && frames[0].offset == null) frames = [{ ...frames[0], offset: 0 }];
  const a = el.animate(frames, { duration, delay, easing, fill: 'backwards' });   // backwards: a delayed tile holds its FROM (invisible) until it starts
  owners.set(el, a); a.finished.then(() => { if (owners.get(el) === a) owners.delete(el); }, () => {});
  return a;
}
/* ── R0 · one pointer frame for a root, many clients (a fine mouse only); fn(null) on leave ── */
const hubs = new WeakMap();
export function pointerFrame(root, fn) {
  let h = hubs.get(root);
  if (!h) {
    hubs.set(root, h = { fns: new Set(), pf: 0, p: null });
    root.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || RM.matches || !FINE.matches) return;
      h.p = { x: e.clientX, y: e.clientY, target: e.target };
      if (!h.pf) h.pf = requestAnimationFrame(() => { h.pf = 0; if (!root.hidden && h.p) for (const f of h.fns) f(h.p); });
    }, { passive: true });
    root.addEventListener('pointerleave', () => { h.p = null; for (const f of h.fns) f(null); });
  }
  h.fns.add(fn); return () => h.fns.delete(fn);
}

/* ── R2 · the spring (effects.js:217-289: k 640, c 34, 120 Hz substeps): aim(el, x, y) eases el's --tilt-x / --tilt-y there, [data-tilt]
   while it moves; the CSS turns them into a perspective rotation.  One per client: the tiles' pictures and the cards (032). ── */
const K = 640, C = 34, DEPTH = 8;
function springs(ok) {
  const live = new Map(); let sf = 0, last = 0;
  const put = (el, x, y) => { el.style.setProperty('--tilt-x', x.toFixed(3) + 'deg'); el.style.setProperty('--tilt-y', y.toFixed(3) + 'deg'); };
  function aim(el, x, y) {
    let s = live.get(el);
    if (!s) { if (!x && !y && !el.dataset.tilt) return; live.set(el, s = { x: parseFloat(el.style.getPropertyValue('--tilt-x')) || 0, y: parseFloat(el.style.getPropertyValue('--tilt-y')) || 0, vx: 0, vy: 0 }); }
    s.tx = x; s.ty = y; el.dataset.tilt = ''; if (!sf) { last = performance.now(); sf = requestAnimationFrame(step); }
  }
  function step(now) {
    sf = 0; if (!ok()) { reset(); return; }
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016), n = Math.ceil(dt * 120), h = dt / n; last = now;
    for (const [el, s] of live) {
      for (let i = 0; i < n; i++) { s.vx += (K * (s.tx - s.x) - C * s.vx) * h; s.vy += (K * (s.ty - s.y) - C * s.vy) * h; s.x += s.vx * h; s.y += s.vy * h; }
      if (Math.abs(s.x - s.tx) + Math.abs(s.y - s.ty) < 0.012 && Math.abs(s.vx) + Math.abs(s.vy) < 0.025) { s.x = s.tx; s.y = s.ty; live.delete(el); if (!s.tx && !s.ty) delete el.dataset.tilt; }
      put(el, s.x, s.y);
    }
    if (live.size) sf = requestAnimationFrame(step);
  }
  function reset() { cancelAnimationFrame(sf); sf = 0; for (const el of live.keys()) { put(el, 0, 0); delete el.dataset.tilt; } live.clear(); }
  document.addEventListener('visibilitychange', reset); RM.addEventListener('change', reset); addEventListener('blur', reset);
  return { aim, reset };
}
/* the PICTURE of the tile under the mouse leans toward it (effects.js:263-266) */
export function tiltPictures(root, { tile = '.mm-tile:not(.off)', pic = '.mm-pic', on = () => true } = {}) {
  const ok = () => FINE.matches && !RM.matches && !document.hidden && on(), S = springs(ok); let cur = null;
  const release = () => { if (cur) { S.aim(cur, 0, 0); cur = null; } };
  pointerFrame(root, (p) => {
    if (!p || !ok()) { release(); return; }
    const t = p.target.closest ? p.target.closest(tile) : null, img = t ? t.querySelector(pic) : null;
    if (cur && cur !== img) release();
    if (!img) return; cur = img;
    const r = t.getBoundingClientRect(), px = clamp((p.x - r.left) / r.width), py = clamp((p.y - r.top) / r.height);
    S.aim(img, -(py * 2 - 1) * DEPTH, (px * 2 - 1) * DEPTH);
  });
  return { reset: S.reset };
}

/* ── 032 · THE CARD'S LIGHT (Josh 11-01: "the same card design for the album art from our 'SynchroSpectre' … the 3D effect, Cursor Glow and
   Edge-Approach Glow and the holographic card effect"; effects.js:232-317 and visual-materials.css's foil, its numbers).  Every `.mm-holo`
   under the root — a volume's portrait card, the tip jar's QR — is ONE spring-tilted shell (8°) whose CSS draws four lights from the
   variables written here: the cursor glow (--mx/--my, --pointer-on), the edge glow (--edge-strength: the nearest edge closer than about half
   the card), the holographic rim and its halo (--glow-x/--glow-y, --glow-active, --border-activation, --holo-angle) and the foil sheen.  The
   rim lights BEFORE the pointer arrives: within 150 px outside the card it wakes toward the pointer's nearest point (the edge approach).
   A fine mouse only, never under reduced motion; ≤ 6 cards are measured a frame, and only while the pointer moves. ── */
export function holoCards(root, { depth = DEPTH, reach = 150 } = {}) {
  const ok = () => FINE.matches && !still() && !document.hidden, S = springs(ok), cards = root.getElementsByClassName('mm-holo'), lit = new Set();
  const put = (el, o) => { for (const k in o) el.style.setProperty(k, o[k]); };
  const dark = (el) => { put(el, { '--glow-active': '0', '--pointer-on': '0', '--border-activation': '0', '--edge-strength': '0' }); lit.delete(el); S.aim(el, 0, 0); };
  pointerFrame(root, (p) => {
    if (!p || !ok()) { for (const el of [...lit]) dark(el); return; }
    for (const el of cards) {
      const r = el.getBoundingClientRect();
      if (!r.width) { if (lit.has(el)) dark(el); continue; }
      const cx = clamp(p.x, r.left, r.right), cy = clamp(p.y, r.top, r.bottom), d = Math.hypot(p.x - cx, p.y - cy), inside = d === 0;
      const s = inside ? 1 : Math.pow(clamp(1 - d / reach), 1.4);
      if (!s) { if (lit.has(el)) dark(el); continue; }
      const edge = Math.min(cx - r.left, r.right - cx, cy - r.top, r.bottom - cy), u = (cx - r.left) / r.width, v = (cy - r.top) / r.height;
      lit.add(el);
      put(el, { '--glow-x': (cx - r.left).toFixed(1) + 'px', '--glow-y': (cy - r.top).toFixed(1) + 'px', '--mx': (u * 100).toFixed(2) + '%', '--my': (v * 100).toFixed(2) + '%',
        '--glow-active': s.toFixed(3), '--pointer-on': inside ? '1' : '0',
        '--border-activation': (inside ? Math.max(0.35, Math.pow(clamp(1 - edge / Math.min(105, r.width * 0.42)), 1.55)) : s).toFixed(3),
        '--edge-strength': inside ? Math.pow(clamp(1 - edge / Math.min(240, Math.max(125, r.width * 0.52))), 1.15).toFixed(3) : '0',
        '--holo-angle': (20 + ((u - v) * 2) * 30).toFixed(1) + 'deg' });
      S.aim(el, inside ? -(v * 2 - 1) * depth : 0, inside ? (u * 2 - 1) * depth : 0);
    }
  });
  return { reset() { for (const el of [...lit]) dark(el); S.reset(); } };
}

/* ── R3 · the staggered entrance (210 ms, 20 ms a step, at most 9 steps) and the develop of a picture that loads late ── */
export function enterTiles(tiles, rank = (t, i) => i, dir = 0) {   // dir: −1 the previous page, +1 the next, 0 a section or the open
  tiles.forEach((t, i) => animate(t, [{ opacity: 0, translate: dir ? `${dir * 14}px 0` : '0 8px' }], 210, Math.min(rank(t, i), 9) * 20));
}
export function develop(img) {
  const t0 = performance.now();   // a picture the cache hands back at once is not "developed": only one that arrives late is
  img.addEventListener('load', () => { if (performance.now() - t0 > 60) animate(img, [{ opacity: 0.3, scale: '.988' }], 500); }, { once: true });
}

/* ── R6 · the caption line swap — ONE LINE IN FLIGHT (iteration 008 P: a fast sweep across the tiles stacked an exit per hover, and the foot
   stuttered or showed two names).  The swap is sequential: the line on show leaves (up 18 px, 120 ms), is REMOVED, and only then the newest
   line asked for is built and rises (14 px, 280 ms).  A call while a line is leaving only replaces what will be built — so a sweep of twenty
   tiles in 400 ms builds a handful of lines, never two at once, and the last name asked for is the one standing.  A blank line leaves at once;
   under reduced motion (animate() → null) the new line simply replaces the old. ── */
const swaps = new WeakMap();
export function swapLine(host, make) {
  let w = swaps.get(host); if (!w) swaps.set(host, w = { make: null, leaving: false });
  w.make = make;
  if (w.leaving) return null;                                            // the line on show is leaving: the newest make is taken when it has gone
  const prev = host.querySelector('.mm-line');
  const a = prev && prev.childNodes.length ? animate(prev, [{ opacity: 0, translate: '0 -18px', offset: 1 }], T.titleSwap) : null;
  if (!a) { if (prev) prev.remove(); return build(host, w); }
  a.effect.updateTiming({ fill: 'both' });   // iteration 012 L2: the leaving line HOLDS its end (gone) until it is removed — it used to snap back for a frame and flash
  w.leaving = true; prev.classList.add('out');
  const next = () => { prev.remove(); w.leaving = false; build(host, w); };
  a.finished.then(next, next);
  return null;
}
function build(host, w) {
  const make = w.make; w.make = null;
  const line = document.createElement('div'); line.className = 'mm-line'; make(line); host.append(line);
  if (line.childNodes.length) animate(line, [{ opacity: 0, translate: '0 14px' }], T.enter);
  return line;
}

/* ── R7 · the install ring: { set(p, state) } — p 0…1, state 'idle' | 'busy' | 'done' ── */
const NS = 'http://www.w3.org/2000/svg';
export function installRing(host) {
  const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('class', 'mm-ring'); s.setAttribute('aria-hidden', 'true');
  const c = (cls) => { const e = document.createElementNS(NS, 'circle'); for (const [k, v] of Object.entries({ cx: 50, cy: 50, r: 46, pathLength: 100, class: cls })) e.setAttribute(k, v); s.append(e); return e; };
  c('mm-ring-track'); const ink = c('mm-ring-ink'); host.append(s);
  return {
    set(p, state = 'busy') {
      p = clamp(p); ink.style.strokeDasharray = `${(p * 100).toFixed(1)} 100`;
      const was = host.dataset.state; host.dataset.state = state;
      if (was !== 'done' && state === 'done') animate(s, [{ scale: '1.08', opacity: 0.5 }], 170);   // the completion pulse (ui-motion.js:145)
    },
  };
}
