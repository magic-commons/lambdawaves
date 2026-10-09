/* controls/arc.js — THE ARC: a ring with round caps in the colour it names, and the knob that wears it.
 *
 * THE LAW IT KEEPS: AN ARC IS A COLOUR (docs/INTENT.md rule 2, docs/CONTROLS-COLOUR.md).  A hue, a colour's phase or
 * amount, an angle: a knob with NO BODY, an SVG ring of vector strokes (no masked conic, so no hard pixel edge) in its
 * own ink.  Josh: "Color knobs needs to be rounded and less pixelated" · "Arcs that show color can primarily be used
 * for color and knobs are for all parameters".  An ordinary parameter stays the kit's solid `knob()`.
 *
 *   arcRing(parent, { from, span })   the ring alone: { svg, set(turn) } — what the GUI's accent dials, the transport and
 *                                     the modulation window draw their arcs with (one build, three used to exist)
 *   arcKnob(o)                        the kit's knob() with the ring: every knob() option, and the same widget contract
 *                                     (root / get / set / show / shown / setBase / paint / setDisabled), so it is a
 *                                     modulation target exactly as a knob is (`params: [{ widget }]`)
 *
 * Built ON the kit's knob(): its DOM, ARIA, keyboard (arrows, Page, Home/End, Delete) and set / show / setBase / paint
 * stay the kit's.  This file adds the HAND (BASINS' colour-controls.js: the old flagship's drag law):
 *   law 'vertical' (default; bounded or wrapping)   p = p0 − g·dy / travel, dx ignored;
 *   law 'angular'  (a free dial: PHASE, HUE)        atan2 about the dial's centre, the shortest way round the ±π seam,
 *       a 7 px dead hub, and FARTHER FROM THE HUB IS FINER, decided once at the press: gain = dist > 34 ? max(.15, 34/dist) : 1.
 * The fine gear g is the kit's one law (controls/gesture.js reads setKnobLaw): any modifier or a second finger gears the
 * hand down on a virtual point, so engaging it moves nothing.  Two presses within 300 ms and 14 px come HOME (the
 * engine's value, `home`, not the one the knob was built with).
 *
 * THE INTERCEPTION.  A capture-phase pointerdown on the knob's ROOT runs first and stops the event there, so the kit's own
 * drag never starts and this law drives the gesture.  Two presses are NOT ours and pass untouched: the modulation window's
 * range ring (.k-ring, inside the dial) and anything outside the dial (the label, the value chip, the RANGE dial seated in
 * the root).  Every press the law takes is FORWARDED (gesture.js forward), so a menu or a pinned ⓘ still closes on it.
 * THE KIT'S GESTURE ENDINGS: the pointer that began the drag owns it; pointercancel, lost capture, Escape and a hidden
 * page END IT AND PUT THE VALUE BACK (BASINS' arc committed on cancel; the kit's core/pointer.js law rolls back).
 * Writes go through core/frame.js (the latest sample wins, one per display frame; the release flushes the last).
 * Harvested from BASINS app/colour-controls.js arcKnob and app/arc-ring.js. */
import { knob, el, watchTouches, gearOf } from '../kit.js';
import { frame } from '../core/frame.js';
import { setVar, setAttr } from '../core/perf.js';
import { clamp01, frac, tapHome, forward, lawNow, valueDrag } from './gesture.js';

const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
let uid = 0;

/** the arc's geometry and the angular law's numbers (BASINS' LAW) */
export const ARC = Object.freeze({
  SWEEP: 300,                  // a bounded arc's degrees: the 60° gap at the bottom (Ableton); a free arc is 360
  DEAD: 7,                     // px about the hub where an angle means nothing (the flagship's KNOB_ROTARY_MIN_RADIUS_PX)
  NEAR: 34, FLOOR: 0.15,       // gain = dist > NEAR ? max(FLOOR, NEAR / dist) : 1, at the press (the flagship's KNOB_FINE)
});

/** arcRing(parent, { from, span }) → { svg, set(turn) }: a track `span` degrees long starting `from` degrees clockwise
 *  from the top, and a value ring `turn` degrees of it (0 hides it: a zero-length round cap would draw a dot) */
export function arcRing(parent, { from = 0, span = 360 } = {}) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'k-arc'); svg.setAttribute('viewBox', '0 0 40 40');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  svg.style.setProperty('--arc-from', from + 'deg');
  svg.style.setProperty('--arc-span', String(span));
  const circle = (cls) => {
    const node = document.createElementNS(NS, 'circle');
    for (const [k, v] of Object.entries({ class: cls, cx: 20, cy: 20, r: 17, pathLength: 360 })) node.setAttribute(k, v);
    svg.appendChild(node); return node;
  };
  circle('k-arc-track');
  const value = circle('k-arc-value');
  parent.appendChild(svg);
  return { svg, set(turn) {
    const amount = Math.max(0, Math.min(span, turn));
    setVar(svg, '--arc-dash', +amount.toFixed(3));
    setAttr(value, 'data-off', amount ? null : '');
  } };
}

/**
 * arcKnob({ law: 'vertical' | 'angular', home, value, ink, onPress, live, size, …every kit knob() option })
 *   home     the engine's own value: where a double-tap, a double-click and Delete go
 *   ink      a CSS colour or (base) → colour, written to --lane-ink on the root (else the lane's, else the accent)
 *   size     'sm' = the lane's 22 px dial with no label (the title and the value chip name it); default the kit's 34 px
 *   onPress  (event) → a hook the host runs on every press the law takes, after the press is forwarded
 *   live     () → the modulated value now, or null: read when the hand lets go, so a routed dial shows its live value
 *            at once (k.set cleared it, and a modulator whose value does not change never repaints the dial by itself)
 * → the kit knob, with set / show / paint wrapped to repaint the arc, plus { law, home, paintArc, arc(), gesture() }
 */
export function arcKnob(o) {
  watchTouches();
  const angular = o.law === 'angular';
  const wrap = !!o.wrap;
  const home = Number.isFinite(o.home) ? o.home : o.value;
  const lo = o.min, hi = o.max, log = !!o.log;
  const norm = (x) => (log ? (Math.log(x) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (x - lo) / (hi - lo));
  const denorm = (p) => (log ? Math.exp(Math.log(lo) + p * (Math.log(hi) - Math.log(lo))) : lo + p * (hi - lo));
  const settle = (nv) => {
    if (o.step) nv = Math.round(nv / o.step) * o.step;
    if (wrap) return lo + ((((nv - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));
    return Math.min(hi, Math.max(lo, nv));
  };
  const pos = (x) => (wrap ? frac(norm(x)) : clamp01(norm(x)));
  const SPAN = wrap ? 360 : ARC.SWEEP, FROM = wrap ? 0 : 180 + (360 - ARC.SWEEP) / 2;   // bounded: 210° → round → 150°

  let paintArc = () => {};
  const k = knob(Object.assign({}, o, {
    value: home,
    onInput: (v) => { paintArc(); if (o.onInput) o.onInput(v); },        // the kit's own writes (keys, Delete) repaint too
    onChange: (v) => { if (o.onChange) o.onChange(v); },
  }));
  k.setDefault(home);
  const root = k.root, dial = root.querySelector('.k-dial');
  root.classList.add('k-arcknob', wrap ? 'k-free' : 'k-bounded');
  if (o.size === 'sm') root.classList.add('k-arc-sm');
  const ring = arcRing(dial, { from: FROM, span: SPAN });
  const liveDot = el('i', 'k-live', dial); liveDot.setAttribute('aria-hidden', 'true');

  paintArc = () => {
    const base = k.get(), sh = k.shown;
    const shownV = sh === null || sh === undefined || root.classList.contains('drag') ? base : sh;
    const turn = pos(base) * SPAN;
    ring.set(turn);
    setVar(root, '--live-turn', +(FROM + pos(shownV) * SPAN).toFixed(3) + 'deg');
    if (o.ink) setVar(root, '--lane-ink', typeof o.ink === 'function' ? o.ink(base) : o.ink);
  };
  const set0 = k.set, show0 = k.show, paint0 = k.paint;
  k.set = function (x, silent) { set0.call(k, x, silent); paintArc(); };
  k.show = function (x) { show0.call(k, x); paintArc(); };
  k.paint = function (fromUser) { paint0.call(k, fromUser); paintArc(); };   // the modulation window repaints a dial by k.paint()
  k.set(Number.isFinite(o.value) ? o.value : home);

  const write = (v) => { const nv = settle(v); if (nv !== k.get()) { k.set(nv); if (o.onInput) o.onInput(nv); } };
  const reshow = () => { if (!o.live) return; let lv = null; try { lv = o.live(); } catch (_) { /* a host that cannot say */ } if (Number.isFinite(lv)) k.show(lv); };
  const goHome = () => { k.set(home); if (o.onInput) o.onInput(home); if (o.onChange) o.onChange(home); reshow(); };

  /* ── the gesture ─────────────────────────────────────────────────────────── */
  const key = 'arc:' + (++uid);
  let g = null;
  const ours = (e) => dial.contains(e.target) && !(e.target.closest && e.target.closest('.k-ring'));
  const pump = (v) => frame.coalesce(key, () => write(v));
  function onMove(ev) {
    if (!g || ev.pointerId !== g.id) return;
    const gain = gearOf(ev, g.id, o.fine);
    if (!angular) {
      g.vy += gain * (ev.clientY - g.ly); g.ly = ev.clientY;               // the virtual point: a gear change moves nothing; dx is ignored
      g.gear = gain;
      const p = g.p0 - (g.vy - g.y0) / (g.touch ? lawNow().touchTravel : (o.travel || lawNow().travel));
      pump(denorm(wrap ? frac(p) : clamp01(p)));
      return;
    }
    const dx = ev.clientX - g.cx, dy = ev.clientY - g.cy;
    if (Math.hypot(dx, dy) < ARC.DEAD) { g.last = null; return; }          // the hub: no angle, and none remembered
    const a = Math.atan2(dy, dx);
    if (g.last !== null) {
      let d = a - g.last;
      while (d > Math.PI) d -= TAU;                                         // SHORTEST WAY ROUND: nine o'clock is not a turn
      while (d < -Math.PI) d += TAU;
      g.gear = gain * g.far;                                                // the press's distance gain, times the fine gear
      g.p += (d * g.gear) / (wrap ? TAU : ARC.SWEEP * Math.PI / 180);
      if (!wrap) g.p = clamp01(g.p);
      pump(denorm(wrap ? frac(g.p) : g.p));
    }
    g.last = a;
  }
  /* the lifecycle (gesture.js valueDrag): the lift commits, any cancel puts the value back where the hand found it */
  const drag = valueDrag(dial, { key, move: onMove,
    release: () => { g = null; root.classList.remove('drag'); setTimeout(() => root.classList.remove('active'), 700); },   // the kit's own 700 ms tooltip tail
    end: () => { paintArc(); if (o.onChange) o.onChange(k.get()); reshow(); },
    abort: (was) => { write(was.v0); paintArc(); reshow(); } });

  const tap = tapHome(goHome);
  root.addEventListener('pointerdown', (e) => {
    if (!ours(e)) return;                                                   // the ring, the label, the RANGE dial: theirs
    e.stopPropagation();                                                    // the kit's dial listener never runs …
    let took = false;
    try { took = take(e); } finally { forward(root, e); }                   // … and the page above the knob still hears the press
    /* the host's hook runs AFTER the forwarded copy: that copy is an outside press to every closer, the modulation
       window's ring focus included, so a hook that focuses this dial (api.selectForTarget) must come last */
    if (took && o.onPress) { try { o.onPress(e); } catch (_) { /* the host's hook is the host's */ } }
  }, true);
  function take(e) {
    if (e.button || root.classList.contains('disabled') || g) return false;   // the law answers the primary press only
    e.preventDefault();
    if (tap(e)) return true;                                                // HOME, and no drag after it
    const base = k.get();
    g = { id: e.pointerId, touch: e.pointerType === 'touch', y0: e.clientY, vy: e.clientY, ly: e.clientY, p0: pos(base), p: pos(base), last: null, gear: 1, far: 1, v0: base };
    if (angular) {
      const r = dial.getBoundingClientRect();                               // one rect per drag
      g.cx = r.left + r.width / 2; g.cy = r.top + r.height / 2;
      const dx = e.clientX - g.cx, dy = e.clientY - g.cy, dist = Math.hypot(dx, dy);
      g.last = dist < ARC.DEAD ? null : Math.atan2(dy, dx);
      g.far = dist > ARC.NEAR ? Math.max(ARC.FLOOR, ARC.NEAR / dist) : 1;   // FARTHER IS FINER, decided once, where the hand came down
    }
    try { dial.setPointerCapture(e.pointerId); } catch (_) { /* a pointer already gone (or a synthetic one) must not abort */ }
    root.classList.add('drag', 'active');
    drag.start(g);
    paintArc();
    return true;
  }
  /* a double-CLICK is the double-tap the law already answered (or refused, past 300 ms / 14 px): the kit's own
     dblclick reset would answer it a second time by a looser rule */
  root.addEventListener('dblclick', (e) => { if (!ours(e)) return; e.stopPropagation(); e.preventDefault(); }, true);

  Object.assign(k, {
    law: angular ? 'angular' : 'vertical', home, paintArc,
    /** the gesture in flight, for a gate: { gear, far, p0, touch } or null */
    gesture: () => (g ? { gear: g.gear, far: g.far, p0: g.p0, touch: g.touch } : null),
    arc: () => ({ from: FROM, span: SPAN, turn: pos(k.get()) * SPAN, live: pos(k.shown === null || k.shown === undefined ? k.get() : k.shown) * SPAN }),
    /** true while the hand is on it: the modulation host does not repaint a dial under the hand (the kit's fader has this; its knob has not) */
    dragging: () => !!g,
    /** take the knob out of the page: its listeners are on its own nodes and the gesture's are removed at its end */
    destroy() { drag.abort(); root.remove(); },
  });
  return k;
}
