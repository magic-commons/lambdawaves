/* fx/parallax.js — the small pointer parallax, once for the kit.
 *
 * The apps carry three (survey A §5.3): the opener's covers (a rect read per frame), the SAVE gallery's thumbnails (a
 * rect read on EVERY pointermove, no frame at all) and the About logo (a rect per frame plus two observers).  This is
 * one helper for all of them, and it reads no element's layout at all.
 *
 * THE MODEL.  The pointer's place in the VIEWPORT, −1 … 1 on each axis from the centre, moves every `[data-parallax]`
 * element against the pointer by up to its depth in px: `data-parallax="6"` travels ±6 px.  Elements at different
 * depths separate as the hand moves, which is the whole effect.  The viewport's size is read once per resize (the only
 * layout change it depends on), never per move.
 *
 * THE LAWS IT KEEPS
 *   · ONE HANDLER, ONE FRAME.  A delegated pointermove; the write is one coalesced job of the one frame
 *     (core/frame.js) that sets `--plx-x/--plx-y` on each element through core/perf.js.  The movement is a transform
 *     (`translate`, in mir/fx/fx.css), eased by a transition, so layout is never touched.
 *   · STILL COSTS NOTHING, OFF COSTS NOTHING: no move, no frame; off, no listener, and every element is put back.
 *   · THE SAME OFF RULES AS THE GLOW (fx/pointer-light.js fxAllowed): not on a coarse pointer, not under a motion policy
 *     that is not 'full', not in the flat tier, not when the app's switch (the GUI's PARALLAX) is off.
 *   · `<html data-parallax-live>` is present exactly while it is live.
 *   · The pointer leaving the page eases everything home.
 *
 * createParallax({ doc, enabled }) → { refresh(), destroy(), get live() }
 * Pure: parallaxOffset(px, py, view, depth) → { x, y } in px. */
import { frame } from '../core/frame.js';
import { setVar, setAttr } from '../core/perf.js';
import { fxAllowed, fxEnv, watchFxMedia } from './pointer-light.js';

/** parallaxOffset(px, py, view, depth) — the travel for a pointer at (px, py) in a view { width, height } */
export function parallaxOffset(px, py, view, depth) {
  const u = Math.max(-1, Math.min(1, (px / Math.max(1, view.width)) * 2 - 1)), v = Math.max(-1, Math.min(1, (py / Math.max(1, view.height)) * 2 - 1));
  return { x: Math.round(-u * depth * 100) / 100, y: Math.round(-v * depth * 100) / 100 };
}

export function createParallax({ doc = document, enabled = () => true } = {}) {
  const html = doc.documentElement, win = doc.defaultView, KEY = 'fx:parallax';
  let live = false, life = null, view = null, x = 0, y = 0, home = false, els = null;

  /* THE ELEMENTS ARE LOOKED FOR ONCE, NOT PER MOVE (wave 18: a page query every frame of a pan, 4 ms/s, in an app with
     nothing to move).  The list is read again on the frame after anything that can add one: a press, a release (a click
     opens a window or a page), a key, and refresh() (a skin change).  One inside a [hidden] ancestor (a closed window,
     a page not shown: the GUI's ABOUT logo) is not on screen and is left out; with none left, a move books no frame at
     all.  An element an app adds or shows with no hand in it (a timer, a load) calls refresh() to be found. */
  const all = () => doc.querySelectorAll('[data-parallax]');
  const stale = () => { els = null; };
  const each = (fn) => { if (!els) els = [...all()].filter((el) => !el.closest('[hidden]')); for (const el of els) fn(el, parseFloat(el.dataset.parallax) || 0); };
  const paint = () => {
    if (!view) view = { width: win.innerWidth, height: win.innerHeight };     // the one read, once per resize
    each((el, depth) => {
      const o = home ? { x: 0, y: 0 } : parallaxOffset(x, y, view, depth);
      setVar(el, '--plx-x', o.x + 'px'); setVar(el, '--plx-y', o.y + 'px');
    });
  };
  const move = (e) => { if (e.pointerType === 'touch') return; x = e.clientX; y = e.clientY; home = false; if (!els || els.length) frame.coalesce(KEY, paint); };
  const rest = () => { home = true; if (!els || els.length) frame.coalesce(KEY, paint); };
  const resized = () => { view = null; };

  function on() {
    if (live) return;
    live = true; life = new AbortController();
    const o = { passive: true, signal: life.signal };
    doc.addEventListener('pointermove', move, o);
    html.addEventListener('pointerleave', rest, o);
    win.addEventListener('blur', rest, o);
    win.addEventListener('resize', resized, o);
    for (const t of ['pointerdown', 'pointerup', 'keydown']) doc.addEventListener(t, stale, { ...o, capture: true });
    setAttr(html, 'data-parallax-live', '');
  }
  function off() {
    if (!live) return;
    live = false; life.abort(); life = null; frame.cancel(KEY);
    for (const el of all()) { setVar(el, '--plx-x', null); setVar(el, '--plx-y', null); }
    setAttr(html, 'data-parallax-live', null);
  }
  function refresh() { stale(); if (enabled() && fxAllowed(fxEnv(doc))) on(); else off(); return live; }
  const unwatch = watchFxMedia(doc, refresh);
  refresh();
  return { refresh, destroy() { unwatch(); off(); }, get live() { return live; } };
}
