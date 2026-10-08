/* controls/lane.js — THE LANE SLIDER and the lane's ink.
 *
 * THE LAW IT KEEPS: A THING'S ONE PRINCIPAL PARAMETER IS A SLIDER IN THAT THING'S INK (docs/CONTROLS-COLOUR.md).  A colour's
 * FREQUENCY, a lane's gain, a layer's opacity: a long pill with a disc thumb (no glow), in the colour of the thing it belongs to,
 * horizontal or vertical.  Josh: "Arcs that show color can primarily be used for color and knobs are for all parameters,
 * and things with a unique parameter; (Like Basins color frequency) those are sliders."
 *
 *   laneSlider({ home, value, orient: 'h' | 'v', ink, …every kit fader() option }) → the kit fader, plus { home, orient }
 *   laneInk(node, css)     the lane's colour, written to --lane-ink on the node that wears class `mir-lane` (the lane's
 *                          root); every control of this folder inside (arc, swatch, slider, list item) reads it, and
 *                          falls back to the accent
 *
 * IT IS A MODULATION TARGET NATIVELY.  It is the kit's own fader() with the lane's skin, so the widget contract is the
 * fader's (root / get / set / show / shown / setBase / setDisabled / paint / dragging) and a route onto it moves the thumb
 * and draws the modulation window's RANGE bar (.m2fdrange, the 2 px line and the live dot) along the pill, in either
 * orientation.  NEBULA needed a native range and SOLEIL an invisible knob laid over its pill to get this; neither is
 * needed.  The route's range dial and × come with the routed control as they do on every fader.
 *
 * THE HAND.  The press is taken here, in capture, for both orientations, so there is ONE law: a press jumps the value to
 * where it came down (the kit fader's), a drag then follows on a VIRTUAL POINT, so engaging the fine gear (any modifier or a
 * second finger: the kit's one law, controls/gesture.js) moves nothing; two presses within 300 ms and 14 px come HOME (the
 * kit fader's own double-tap resets before the press's absolute map, which writes the press over the reset; a double-click
 * is the double-tap already answered).  The press is forwarded to the page, and pointercancel, lost capture, Escape and a
 * hidden page end the drag and put the value back.  A vertical slider has its top at the maximum.
 * Harvested from BASINS app/colour-controls.js laneFader and colour.css (.colour-lane .fd).  The fader's own RANGE bar
 * and dot of BASINS (.fd-range, .fd-range-dot) are the modulation window's (.m2fdrange) since alpha.12: not built twice. */
import { fader, watchTouches, gearOf } from '../kit.js';
import { frame } from '../core/frame.js';
import { setVar } from '../core/perf.js';
import { clamp01, tapHome, forward, valueDrag } from './gesture.js';

let uid = 0;

/** laneInk(node, css) — the lane's colour: any CSS colour, or null to fall back to the accent */
export function laneInk(node, css) { setVar(node, '--lane-ink', css === undefined ? null : css); return node; }

export function laneSlider(o) {
  watchTouches();
  const vertical = o.orient === 'v';
  const home = Number.isFinite(o.home) ? o.home : o.value;
  const f = fader(Object.assign({}, o, { value: home, cls: 'mir-lane-slider' + (o.cls ? ' ' + o.cls : '') }));
  f.setDefault(home);
  f.set(Number.isFinite(o.value) ? o.value : home);
  const root = f.root;
  root.dataset.orient = vertical ? 'v' : 'h';
  if (vertical) root.setAttribute('aria-orientation', 'vertical');
  if (o.ink) setVar(root, '--lane-ink', o.ink);

  const lo = o.min, hi = o.max;
  const log = !!o.log && lo > 0 && hi > lo;
  const norm = (x) => (log ? clamp01(Math.log(x / lo) / Math.log(hi / lo)) : clamp01((x - lo) / (hi - lo)));
  const denorm = (u) => (log ? lo * Math.pow(hi / lo, clamp01(u)) : lo + clamp01(u) * (hi - lo));
  const write = (v) => { if (v !== f.get()) { f.set(v); if (o.onInput) o.onInput(v); } };
  const goHome = () => { f.set(home); if (o.onInput) o.onInput(home); if (o.onChange) o.onChange(home); };

  const key = 'lane:' + (++uid);
  let g = null;
  const ours = (e) => !(e.target.closest && e.target.closest('.k-ring, .k-route-depth, .k-route-x'));   // the route's own badges are theirs
  /** where a pointer is along the track, in px from its minimum end */
  const along = (ev) => (vertical ? g.r.bottom - ev.clientY : ev.clientX - g.r.left);
  function move(ev) {
    if (!g || ev.pointerId !== g.id) return;
    const c = along(ev);
    g.vp += gearOf(ev, g.id, o.fine) * (c - g.last); g.last = c;
    const v = denorm(g.vp / g.len);
    frame.coalesce(key, () => write(v));
  }
  /* the lifecycle (gesture.js valueDrag): the lift commits, any cancel puts the value back where the hand found it */
  const drag = valueDrag(root, { key, move,
    release: () => { g = null; root.classList.remove('drag'); },
    end: () => { if (o.onChange) o.onChange(f.get()); },
    abort: (was) => write(was.v0) });

  const tap = tapHome(goHome);
  function take(e) {
    if (e.button || root.classList.contains('disabled') || g) return false;
    e.preventDefault();
    if (tap(e)) return true;                                                // HOME, and no drag after it
    const r = root.getBoundingClientRect();                                 // one rect per drag
    const len = Math.max(1, vertical ? r.height : r.width);
    g = { id: e.pointerId, r, len, v0: f.get(), vp: 0, last: 0 };
    const c = along(e);
    /* a press jumps the value to the pointer, unless the fine gear is already engaged: then it only holds the value
       (the kit fader's Shift-press) and the first move is relative */
    g.vp = gearOf(e, e.pointerId, o.fine) < 1 ? norm(g.v0) * len : c;
    g.last = c;
    try { root.setPointerCapture(e.pointerId); } catch (_) { /* a pointer already gone (or a synthetic one) must not abort */ }
    root.classList.add('drag');
    drag.start(g);
    write(denorm(g.vp / len));
    return true;
  }
  root.addEventListener('pointerdown', (e) => {
    if (!ours(e)) return;
    e.stopPropagation();                                                    // the kit fader's own press never runs …
    let took = false;
    try { took = take(e); } finally { forward(root, e); }                   // … and the page above the lane still hears it
    if (took && o.onPress) { try { o.onPress(e); } catch (_) { /* the host's hook is the host's */ } }
  }, true);
  /* a double-CLICK is the double-tap the capture above already answered (or refused, past 300 ms / 14 px): the kit
     fader's own dblclick reset would write home, and persist, a second time */
  root.addEventListener('dblclick', (e) => { if (!ours(e)) return; e.stopPropagation(); e.preventDefault(); }, true);

  return Object.assign(f, { home, orient: vertical ? 'v' : 'h', dragging: () => !!g });
}

