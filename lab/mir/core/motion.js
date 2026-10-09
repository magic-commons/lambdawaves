/* core/motion.js — the one motion primitive.
 *
 * THE LAW IT KEEPS: ONE WRITER PER ELEMENT.  While a motion holds an element, nothing else may place it:
 * `owns(el)` says so, and `settled(el)` resolves once the LAST motion on it has landed, so a caller defers its
 * own placement instead of fighting the animation (survey B §4, risk 1: WAAPI animated left/top/width/height
 * while place() rewrote them, and the window jumped at the end).
 *
 * And four rules every function here obeys:
 *   1. MOVE BY TRANSFORM, NEVER BY LAYOUT.  Movement animates the individual `translate`/`scale` properties;
 *      layout is written once (tweenRect commits it at the end, flip measures it after the caller's mutate).
 *   2. INTERRUPTIBLE.  Called again mid-flight, each function reads the CURRENT visual state, cancels the old
 *      animation and continues from there to the newest target.  Ten calls in a row end on the tenth target.
 *   3. NO TIMERS.  Endings ride `Animation.finished`, which always settles (finished or cancelled).
 *   4. ONE REDUCED-MOTION SIGNAL.  motionPolicy() is 'full' | 'reduced' | 'off': the OS preference unless the app
 *      set a policy, mirrored onto <html data-motion> for CSS.  Under 'reduced' nothing MOVES (flip and tweenRect
 *      land at once) and presence keeps only its opacity fade — fewer and gentler, never zero (MOTION-LAW
 *      §Accessibility).  Under 'off' nothing animates at all.
 *
 * Tokens come from CSS (`--motion-micro|ui|structural`, `--ease-out`, `--ease-in`, declared in core.css) with the
 * same numbers here as the fallback, so a page without the sheet still moves the same way.
 */
import { rect, setVar, count } from './perf.js';

export const MOTION = Object.freeze({ micro: 80, ui: 160, structural: 320,
  out: 'cubic-bezier(.22, 1, .36, 1)', in: 'cubic-bezier(.55, 0, 1, .45)' });
const TOKEN = { micro: '--motion-micro', ui: '--motion-ui', structural: '--motion-structural', out: '--ease-out', in: '--ease-in' };

/** parseDuration('160ms' | '.16s' | 160) → ms, or the fallback when it is not a duration */
export function parseDuration(s, fallback) {
  if (typeof s === 'number') return s;
  const m = /^\s*(-?[\d.]+)\s*(ms|s)?\s*$/.exec(String(s || ''));
  if (!m || Number.isNaN(parseFloat(m[1]))) return fallback;
  return parseFloat(m[1]) * (m[2] === 's' ? 1000 : 1);
}

/** motionToken('ui' | 'micro' | 'structural' | 'out' | 'in') — the page's token, or the fallback */
export function motionToken(name) {
  const root = globalThis.document && document.documentElement;
  const raw = root ? getComputedStyle(root).getPropertyValue(TOKEN[name]).trim() : '';
  if (name === 'out' || name === 'in') return raw || MOTION[name];
  return parseDuration(raw, MOTION[name]);
}

/* ── the policy ─────────────────────────────────────────────────────────────────────────────────────────── */
const POLICIES = ['full', 'reduced', 'off'];
const MQ = globalThis.matchMedia ? globalThis.matchMedia('(prefers-reduced-motion: reduce)') : null;
let setting = 'auto';

/** resolvePolicy(setting, mediaReduced) — the app's setting wins; 'auto' follows the OS */
export function resolvePolicy(set, mediaReduced) {
  return POLICIES.includes(set) ? set : (mediaReduced ? 'reduced' : 'full');
}
/** motionPolicy() — 'full' | 'reduced' | 'off', live */
export const motionPolicy = () => resolvePolicy(setting, !!(MQ && MQ.matches));
const mirror = () => { const root = globalThis.document && document.documentElement; if (root) root.dataset.motion = motionPolicy(); };
/** setMotionPolicy('auto' | 'full' | 'reduced' | 'off') — returns what it resolves to */
export function setMotionPolicy(set) { setting = POLICIES.includes(set) ? set : 'auto'; mirror(); return motionPolicy(); }
if (MQ && MQ.addEventListener) MQ.addEventListener('change', mirror);
mirror();

/* ── ownership ──────────────────────────────────────────────────────────────────────────────────────────── */
const held = new Map();                                             // el → { anim, waiters }

/** owns(el) — true while a motion holds the element */
export const owns = (el) => held.has(el);
/** settled(el) — resolves when the element's last motion has landed (at once if none holds it) */
export const settled = (el) => (held.has(el) ? new Promise((r) => held.get(el).waiters.push(r)) : Promise.resolve());

const release = (el) => { const rec = held.get(el); if (!rec) return; held.delete(el); for (const r of rec.waiters) r(); };
/** take the element: stop what holds it (after the caller has read the visual state) */
const take = (el) => { const rec = held.get(el); if (rec && rec.anim) rec.anim.cancel(); return rec; };
/** hold(el, anim, land) — the promise is true when THIS motion landed, false when it was superseded or cancelled */
function hold(el, anim, land) {
  const prev = held.get(el);
  const rec = { anim, waiters: prev ? prev.waiters : [] };
  held.set(el, rec);
  return anim.finished.then(() => {
    if (held.get(el) !== rec) return false;
    if (land) land();
    release(el); return true;
  }, () => { if (held.get(el) === rec) release(el); return false; });
}
/** own(el, anim) — a motion made elsewhere joins the one-writer registry: owns(el) is true until it lands and
 *  settled(el) waits for it.  For the rack's card motion (shell/rack.js, BASINS' rack-motion.js: a card's height and
 *  its neighbours' travel — the one sanctioned layout animation, docs/MOTION-LAW.md).  → Promise<boolean>, as above */
export const own = (el, anim) => hold(el, anim);
const animates = () => motionPolicy() === 'full' && typeof Element !== 'undefined' && !!Element.prototype.animate;
const opts = (o, dur, ease) => ({ duration: o.duration ?? motionToken(dur), easing: o.easing ?? motionToken(ease) });

/* ── flip ───────────────────────────────────────────────────────────────────────────────────────────────── */
/** flip(nodes, mutate, opts) — measure, let the caller change the layout, then animate each node by `translate`
 *  from where it WAS SEEN to where it now lays out.  nodes: an array, or a function read before and after mutate
 *  (so nodes the mutation adds or removes are handled).  Resolves when every moved node has landed. */
export function flip(nodes, mutate, o = {}) {
  const list = () => [...(typeof nodes === 'function' ? nodes() : nodes)].filter((n) => n && n.isConnected);
  const before = new Map();
  for (const n of list()) if (n.getClientRects().length) before.set(n, rect(n));    // the visual position
  for (const n of before.keys()) take(n);                           // waiters stay: settled() means the LAST landing
  mutate();
  const after = list(), moving = [], moved = new Set();
  if (animates()) {
    const o2 = opts(o, 'structural', 'out');
    for (const n of after) {
      const b = before.get(n); if (!b || !n.getClientRects().length) continue;
      const r = rect(n), dx = b.left - r.left, dy = b.top - r.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      const a = n.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }], o2);
      count('writes'); moved.add(n); moving.push(hold(n, a));
    }
  }
  for (const n of before.keys()) if (!moved.has(n)) release(n);
  return Promise.all(moving).then((r) => r.every(Boolean));
}

/* ── tweenRect ──────────────────────────────────────────────────────────────────────────────────────────── */
const box = (r) => ({ left: r.left ?? r.x, top: r.top ?? r.y, width: r.width, height: r.height });
/** the default commit: shift the inline left/top/width/height by the distance between the layout and the target,
 *  which is right for fixed and absolute boxes alike, content-box or border-box */
export function commitRect(el, to, base) {
  const cs = getComputedStyle(el);
  setVar(el, 'left', `${parseFloat(cs.left) + to.left - base.left}px`);
  setVar(el, 'top', `${parseFloat(cs.top) + to.top - base.top}px`);
  setVar(el, 'width', `${parseFloat(cs.width) + to.width - base.width}px`);
  setVar(el, 'height', `${parseFloat(cs.height) + to.height - base.height}px`);
}

/** tweenRect(el, toRect, { duration, easing, commit }) — move/resize a positioned box to a viewport rect.  The layout
 *  is committed ONCE, FIRST (commit(el, to, layoutRect); the default writes inline left/top/width/height), so the box
 *  is its resting self from the first frame; then it TRAVELS by `translate` from where it was seen, and a side that
 *  grew is revealed by `clip-path` as it goes (a side that shrank snaps: nothing can paint outside the resting box).
 *  Nothing is scaled — Josh, 2026-10-06, on the iPad: the old transform tween "squashes it horizontally, before
 *  readjusting"; a window must never be shown as a stretched picture of another layout.  Retargeting mid-flight
 *  starts from the box's current visual rect. */
export function tweenRect(el, toRect, o = {}) {
  const to = box(toRect), commit = o.commit || commitRect;
  const visual = rect(el);
  take(el);
  const base = rect(el);                                            // the layout, with the old motion gone
  const near = (r) => ['left', 'top', 'width', 'height'].every((k) => Math.abs(r[k] - to[k]) < 0.5);
  if (!near(base)) commit(el, to, base);                             // the one layout write: it rests where it will land
  if (!animates() || near(visual) || base.width <= 0 || base.height <= 0) { release(el); return Promise.resolve(true); }
  const now = rect(el);                                             // the resting box (≈ to; the commit may have been clamped)
  if (now.width <= 0 || now.height <= 0) { release(el); return Promise.resolve(true); }
  const dx = visual.left - now.left, dy = visual.top - now.top;
  const grewR = Math.max(0, now.width - visual.width), grewB = Math.max(0, now.height - visual.height);
  const from = { translate: `${dx}px ${dy}px`, clipPath: `inset(0px ${grewR}px ${grewB}px 0px)` };
  const rest = { translate: '0px 0px', clipPath: 'inset(0px 0px 0px 0px)' };
  const a = el.animate([from, rest], { ...opts(o, 'structural', 'out'), fill: 'forwards' });
  count('writes');
  return hold(el, a, () => a.cancel());                               // it landed: the travel goes, the layout was already there
}

/* ── presence ───────────────────────────────────────────────────────────────────────────────────────────── */
const AWAY = { opacity: 0, translate: '0px 6px', scale: '0.98' };
const HERE = { opacity: 1, translate: '0px 0px', scale: '1' };
/** presence(el, show, { duration }) — open or close with an entrance and an exit.  It toggles `hidden`: shown
 *  before the entrance, hidden after the exit.  Reversed mid-flight it turns around from where it is. */
export function presence(el, show, o = {}) {
  const policy = motionPolicy(), rec = held.get(el);
  const visible = !el.hidden;
  if (!rec && visible === !!show) return Promise.resolve(true);    // already there
  let from = show ? AWAY : HERE;
  if (rec) { const cs = getComputedStyle(el); from = { opacity: +cs.opacity, translate: cs.translate === 'none' ? '0px 0px' : cs.translate, scale: cs.scale === 'none' ? '1' : cs.scale }; }
  take(el);
  if (show) el.hidden = false;
  if (policy === 'off' || typeof el.animate !== 'function') { el.hidden = !show; release(el); return Promise.resolve(true); }
  const to = show ? HERE : AWAY;
  const frames = policy === 'reduced' ? [{ opacity: from.opacity }, { opacity: to.opacity }] : [from, to];
  const a = el.animate(frames, { ...opts(o, 'ui', show ? 'out' : 'in'), fill: 'forwards' });
  count('writes');
  return hold(el, a, () => { if (!show) el.hidden = true; a.cancel(); });
}

/* ── sequence ───────────────────────────────────────────────────────────────────────────────────────────── */
/** sequence(steps) — run steps one after another; a step returns an Animation, a promise, or nothing.  Each waits
 *  on the last one's `finished`, never a timer.  → { finished: Promise<boolean>, cancel() }: cancel stops the
 *  running animation and no later step runs; finished is true only if every step ran to its end. */
export function sequence(steps) {
  let cancelled = false, current = null;
  const finished = (async () => {
    for (const step of steps) {
      if (cancelled) return false;
      current = step();
      try { await (current && current.finished ? current.finished : current); } catch { return false; }
      if (cancelled) return false;
    }
    return true;
  })();
  return { finished, cancel() { if (cancelled) return; cancelled = true; if (current && typeof current.cancel === 'function') current.cancel(); } };
}
