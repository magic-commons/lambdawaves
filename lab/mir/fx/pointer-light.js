/* fx/pointer-light.js — the opener's cursor glow, as a kit helper: a soft light that follows the pointer over a surface.
 *
 * Taken from BASINS' opener (startup.js:107-150, startup.css:96-101): one pointer handler, coalesced to one frame, writes
 * the pointer's place into the surface under it, and CSS draws a 105 px radial light there.  Here the surfaces opt in
 * with `data-light` (tiles, chips, window heads, the logo), and the light is drawn by mir/fx/fx.css.
 *
 * THE LAWS IT KEEPS
 *   · ONE HANDLER FOR THE PAGE.  A delegated pointermove on the document finds the `[data-light]` surface under the
 *     pointer; the surface's box is read once when the pointer enters it (and again only after a scroll, a resize or a
 *     press, which may start a drag), never per move.  The place is written as `--light-x/--light-y` in px, through
 *     core/perf.js, in one coalesced job of the one frame.  `data-lit` marks the surface while the pointer is on it.
 *   · STILL COSTS NOTHING.  No move, no event, no frame: there is no timer and no rAF of its own.
 *   · OFF COSTS NOTHING.  While it is off there is no listener at all.  It is off on a coarse pointer (touch), under a
 *     motion policy that is not 'full' (core/motion.js), in the flat tier (`data-ui-tier="flat"`), and when the app's
 *     switch says so (`enabled()`, the GUI's POINTER GLOW).  `refresh()` re-asks all four; the live input mode
 *     (core/kbm.js: touch vs precision, by the pointer in use, not the device) and the motion media query re-ask by
 *     themselves.
 *   · `<html data-pointer-light>` is present exactly while it is live, so the CSS draws nothing when it is not.
 *
 * createPointerLight({ doc, enabled }) → { refresh(), destroy(), get live() }
 *   enabled   () => boolean — the app's switch (default: on)
 * Pure: fxAllowed({ coarse, motion, tier }) — the off rules, shared with fx/parallax.js. */
import { frame } from '../core/frame.js';
import { rect, setVar, setAttr } from '../core/perf.js';
import { motionPolicy } from '../core/motion.js';
import { kbm, pointerCoarse } from '../core/kbm.js';

/** fxAllowed({ coarse, motion, tier }) — may a pointer effect run?  Not on touch, not under reduced or no motion, not flat */
export const fxAllowed = ({ coarse, motion, tier }) => !coarse && motion === 'full' && tier !== 'flat';

/** what the page says right now, for fxAllowed.  `coarse` is the LIVE pointer (core/kbm.js, 1.5.0 wave 21): a trackpad
 *  on an iPad is a cursor although its primary pointer reports coarse; with no input layer, the media query as before */
export function fxEnv(doc = document) {
  return { coarse: pointerCoarse(doc), motion: motionPolicy(), tier: doc.documentElement.dataset.uiTier || 'full' };
}

/** watch what an effect's off rules hang on — the live input mode and the two media queries; → unwatch */
export function watchFxMedia(doc, fn) {
  const win = doc.defaultView, qs = win.matchMedia ? ['(pointer: coarse)', '(prefers-reduced-motion: reduce)'].map((q) => win.matchMedia(q)) : [];
  for (const q of qs) q.addEventListener && q.addEventListener('change', fn);
  const offMode = kbm.onChange((s, why) => { if (why === 'mode' || why === 'pref') fn(); });
  return () => { offMode(); for (const q of qs) q.removeEventListener && q.removeEventListener('change', fn); };
}

export function createPointerLight({ doc = document, enabled = () => true } = {}) {
  const html = doc.documentElement, KEY = 'fx:light';
  let live = false, cur = null, box = null, reading = false, x = 0, y = 0, life = null;

  const paint = () => {
    if (!cur || !box) return;
    setVar(cur, '--light-x', Math.round(x - box.left) + 'px');
    setVar(cur, '--light-y', Math.round(y - box.top) + 'px');
    setAttr(cur, 'data-lit', '');
  };
  const leave = () => {
    const was = cur; cur = null; box = null; frame.cancel(KEY);
    if (was) frame.write(() => { if (cur === was) return; setAttr(was, 'data-lit', null); });
  };
  const forget = () => { box = null; };                                // the box moved: read it again on the next move
  const move = (e) => {
    if (e.pointerType === 'touch') return;
    const t = e.target && e.target.closest ? e.target.closest('[data-light]') : null;
    if (t !== cur) { leave(); cur = t; }
    if (!cur) return;
    x = e.clientX; y = e.clientY;
    if (!box && !reading) { reading = true; const at = cur; frame.read(() => { reading = false; if (cur === at) box = rect(at); }); }
    frame.coalesce(KEY, paint);
  };

  function on() {
    if (live) return;
    live = true; life = new AbortController();
    const o = { passive: true, signal: life.signal };
    doc.addEventListener('pointermove', move, o);
    doc.addEventListener('pointerdown', forget, o);
    html.addEventListener('pointerleave', leave, o);
    doc.defaultView.addEventListener('scroll', forget, { ...o, capture: true });
    doc.defaultView.addEventListener('resize', forget, o);
    doc.defaultView.addEventListener('blur', leave, o);
    setAttr(html, 'data-pointer-light', '');
  }
  function off() {
    if (!live) return;
    live = false; life.abort(); life = null; leave();
    setAttr(html, 'data-pointer-light', null);
  }
  /** refresh() — re-ask the switch, the pointer, the motion policy and the tier */
  function refresh() { if (enabled() && fxAllowed(fxEnv(doc))) on(); else off(); return live; }
  const unwatch = watchFxMedia(doc, refresh);
  refresh();
  return { refresh, destroy() { unwatch(); off(); }, get live() { return live; } };
}
