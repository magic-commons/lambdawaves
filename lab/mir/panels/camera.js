/* panels/camera.js — THE CAMERA PANEL: where the view is, as a rack card an app gets by naming its camera.
 *
 * Harvested from BASINS app/camera-window.js (Josh's two messages about it: a ROTATION knob, a PAN, a NORTH that goes back when pressed
 * again; then "move north as a third button in the row alongside center and pan home; move that row to the very top; remove the divider
 * between motion and the top section; remove the 'motion' text and 'route ORBIT ANGLE for…' text"), for the 2-D camera, and from the kit's
 * plane-model.js and λWAVES' lab/camera-law.js + rack.js (CONTROL · SPIN · FRICTION · DRAG GAIN · FLING · ZOOM · FOV) for the 3-D camera.
 * Built only from the control language (docs/CONTROLS.md): an arc for every angle, a knob for the rest, an XY pad and its two knobs for the
 * pan, a switch with a lamp for a state, a trigger for a verb, a segment for 2–4 modes.
 *
 *   THE ROWS, top down (each only when the port has its ids)
 *     verbs     the app's own (BASINS: CENTER), then PAN HOME and NORTH (2-D) or HOME (3-D) — the row at the very top, no heading, no divider
 *     mode      TURNTABLE · FREE (a segment)
 *     sphere    a direction sphere for yaw / pitch (the plane model's drawing) and its two arcs, the modulation targets
 *     view      ROTATION · ROLL · ZOOM · FOV · FLIP
 *     pan       an XY pad and its two knobs (X, Y)
 *     scales    ROT SCALE · PAN SCALE · ORBIT · ORBIT ANGLE
 *     HAND      DRAG · FRICTION · INERTIA · FLING · AUTO-ROTATE · SPIN · WHEEL: the feel of the hand, only when the app passes them
 *
 *   createCameraPanel({ rack, mode, port | canvas, mod, history, project, … }) → { id, view(), port, params(), sync(), destroy() }   a rack card
 *   createCameraView(parent, options) → { root, port, params(), controls, sync(), northPress(), home(), destroy() }                the rows, anywhere
 *     panWrap   1.5.7-alpha.13 THE PAD WRAPS: 'plane' — the PAN pad's drag and arrows past an edge come back in at the opposite edge (controls/xy.js
 *               padWrap): a pan whose ±1 is the frame's edge carries the picture off one side and in at the other; absent, the pad stops at its edge
 *   createCssPort(canvas, { mode }) → a port that drives a CSS transform on the canvas: the zero-engine camera
 *   directionSphere(options) → { root, svg, yaw, pitch, paint(), destroy() }                                                      the sphere alone
 *
 * THE PORT   an app implements only the ids it has; the panel shows only those (camera-rig.js VOCAB lists every id)
 *   { get(id) → number | boolean | string | undefined,     set(id, v),     subscribe(fn) → off      (the app notifies; nothing is polled)
 *     has?(id), angle?: 'deg' | 'rad', ranges?: { [id]: { min, max, home, log, step, fmt, label, reverse } }, modIds?: { [id]: 'the.apps.id' },
 *     (`reverse`, 1.5.7-alpha.6 THE REVERSED DIAL: that knob turns the other way — a ZOOM whose number is a distance turns clockwise to come near)
 *     verbs?: [{ label, title?, run() → void | Promise }],   home?(), north?(), northMemo?() → degrees | null,   turn?(dyaw, dpitch) }
 * MODULATION  every continuous control is a target under `camera.<id lower-cased>` (camera.rotation, camera.panx …: BASINS' ids), or `modPrefix.<id>` (two cameras on a page), or the
 *   port's `modIds`.  `mod` is installModulation()'s result: the panel adds its targets when it is built, and a hand on a routed dial writes the
 *   base (`mod.hand`), as the law is (the install's `roots` must name the prefix).  Without `mod`, `view.params()` is the list to hand to installModulation({ params }).
 * PROJECT AND HISTORY  the values ride in the project as a part named `part` (default 'camera') unless `project: false` (the app's own part
 *   carries them); with `history` they are one snapshot domain, so a gesture is one row named CONTROL · WINDOW by the kit's own gesture names.
 * IDLE  The panel subscribes; one coalesced frame reads the port after a notice, and nothing runs at rest. */
import { el, svgEl, label, hint, trig, watchTouches, gearOf, tapWatcher, setKnobLaw } from '../kit.js';
import { control } from '../controls/factory.js';
import { arcKnob } from '../controls/arc.js';
import { frame } from '../core/frame.js';
import { setAttr } from '../core/perf.js';
import { registerProjectPart } from '../core/project.js';
import { handWrite } from '../modulation/registry.js';
import {
  HAND_IDS, ANGLE_UNIT, createCameraRig, setCameraValue, atNorth, northStep, wrapDegrees, fmtDeg,
  describe, present, SPHERE, VIEW_FRAME, turnAbout, lookDir, project, depthOf, splitDepth, ballPoint, arcballTurn, sphereTurn, transform2d, transform3d, planeDrag, fromView, toView,
} from './camera-rig.js';

const DEG = Math.PI / 180;
let uid = 0;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const f2 = (n) => (+n).toFixed(2);

/* ═══ THE ZERO-ENGINE CAMERA ══════════════════════════════════════════════════════════════════════════════════════════════════════════
 * A port that drives a CSS transform on a canvas (or any element), so the starter and the gallery show a live camera on any picture.
 * 2-D: ROTATION · PAN X/Y · ZOOM · FLIP · ROT SCALE · PAN SCALE · ORBIT · ORBIT ANGLE through BASINS' rig (cameraPose).
 * 3-D: MODE · YAW · PITCH · ROLL · ZOOM · FOV as a perspective transform on the picture (roll only in FREE). */
export function createCssPort(canvas, { mode = '2d', values } = {}) {
  const key = 'mir.camera.css.' + (++uid), subs = new Set();
  const r = createCameraRig();
  const S3 = { mode: 'turntable', yaw: 0, pitch: 0, roll: 0, zoom: 1, fov: 60 };
  const S2 = { zoom: 1, flip: false };
  const three = mode === '3d';
  const ids = three ? Object.keys(S3) : ['rotation', 'panX', 'panY', 'zoom', 'flip', 'rotationMul', 'panMul', 'orbit', 'orbitAngle'];
  const own = new Set(ids);
  const get = (id) => (!own.has(id) ? undefined : three ? S3[id] : id === 'zoom' || id === 'flip' ? S2[id] : r[id.toLowerCase()]);
  function apply() {
    frame.coalesce(key, () => {
      const w = canvas.offsetWidth || 0, h = canvas.offsetHeight || 0;
      canvas.style.transformOrigin = '50% 50%';
      canvas.style.transform = three ? transform3d({ ...S3, h, free: S3.mode === 'free' }) : transform2d(r, { w, zoom: S2.zoom, flip: S2.flip });
    });
  }
  function set(id, v) {
    if (!own.has(id) || get(id) === v) return;
    if (three) S3[id] = v;
    else if (id === 'zoom' || id === 'flip') S2[id] = v;
    else setCameraValue(r, id.toLowerCase(), v);
    apply(); for (const f of subs) f(id);
  }
  const homeOf = (id) => describe(id, { angle: 'deg' }).home;
  const port = {
    css: true, mode, angle: 'deg', has: (id) => own.has(id), get, set,
    ranges: three ? { zoom: { min: 0.25, max: 4, home: 1 } } : { zoom: { min: 0.25, max: 4, home: 1 } },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    home() { for (const id of three ? ['yaw', 'pitch', 'roll', 'zoom', 'fov'] : []) set(id, id === 'zoom' ? 1 : homeOf(id)); },
    destroy() { frame.cancel(key); canvas.style.transform = ''; subs.clear(); },
  };
  if (values) for (const [id, v] of Object.entries(values)) set(id, v);
  apply();
  return port;
}

/* ═══ THE DIRECTION SPHERE ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
 * plane-model.js's drawing (the same sphere, rings and isometric projection) for a direction: the arrow is where the camera looks and the
 * film plane stands across it, rolled by ROLL.  AUTOMATA's pad contract (a pad for the hand, its two knobs the targets): the sphere PAINTS
 * FROM THE KNOBS (the base, or the modulated value a route shows); the hand turns the BALL and the arrow rides it (1.5.7-alpha.46 THE
 * ARCBALL, camera-rig.js: a tip grabbed inside the disc stays under the finger, a finger past the rim keeps turning it and comes back the
 * way it went, the tip stops at a pole instead of flipping the yaw), under the one knob law (⅛ gear on any modifier or a second finger,
 * a double-tap is home, arrows nudge).
 *   directionSphere({ label, aria, yaw, pitch, unit, roll, turn(dyaw, dpitch) in radians, home(), onChange() })
 *     yaw, pitch   the arc knobs' options ({ min, max, value, wrap, fmt, … }) in the port's unit; `unit` is port-units per degree
 *     roll         () → the roll in degrees now, for the film's turn
 *   → { root, svg, yaw, pitch, paint(), destroy() }   yaw and pitch are the arc knobs: register them as the targets
 * 1.5.7-alpha.7 THE SPHERE TAKES A PLANE — the same drawing for a plane (CLIP's), in place of plane-model.js's canvas:
 *   directionSphere({ plane: { normal() → [x, y, z], pos?() → −1…1, set(n), view?() → bool }, home(), onChange(), label, aria })
 *     the normal is the look line and the tip, the plane the film-like square through n·pos (no camera film), the three world rings, no
 *     letters and no arcs; the drag turns the ball and the normal rides it IN 3-D (the arcball, alpha.46; no yaw / pitch, so no pole — a
 *     plane's home normal z sits exactly there) and hands the new unit normal to set(); the arrows nudge the tip on the screen (planeDrag;
 *     Shift the kit's fine gear);
 *     a double-tap, Home or Delete is home().  view() true: the normal is in the VIEWER's frame (x right, y up, z toward the eye), drawn as
 *     that viewer sees it (camera-rig.js VIEW_FRAME) — a plane that rides with a camera; set() is handed the viewer's frame back.
 *   → { root, svg, body, yaw: null, pitch: null, paint(), setDisabled(on), destroy() }   paint() redraws only when the normal, pos or view
 *     changed, so a frame loop may call it */
/* THE GRAB (alpha.46): the drawing's scale and origin on the screen at the press (the viewBox is centred in a wider box, as λWAVES'
   CAMERA widens it), and the ball point under the finger; fingerAt reads a later event in the drawing's units */
function grab(svg, e) {
  const r = svg.getBoundingClientRect(), s = Math.min(r.width / SPHERE.W, r.height / SPHERE.H) || 1;
  const g = { id: e.pointerId, s, ox: r.left + (r.width - SPHERE.W * s) / 2, oy: r.top + (r.height - SPHERE.H * s) / 2 };
  g.p = ballPoint(...fingerAt(g, e));
  g.x = e.clientX; g.y = e.clientY;
  return g;
}
const fingerAt = (g, e) => [(e.clientX - g.ox) / g.s, (e.clientY - g.oy) / g.s];

/* 1.5.7-alpha.54 THE SPHERE IS THE STAGE'S DRAG — the delta mode: the press-drag's raw pointer step (CSS px since the last move, times
   the gear and the gain) is handed to `fn`, or (fn === true) to the kit's own linear turn `own` */
export const SPHERE_DELTA = Object.freeze({ gain: 1.5, rad: Math.PI / 450 });   // a little more than the stage's hand; the kit's own turn: 0.4° a px
function deltaMove(g, e, o, fn, own) {
  const gear = gearOf(e, g.id), gain = o.gain > 0 ? o.gain : SPHERE_DELTA.gain, dx = (e.clientX - g.x) * gear * gain, dy = (e.clientY - g.y) * gear * gain;
  g.x = e.clientX; g.y = e.clientY;
  if (!dx && !dy) return;
  if (typeof fn === 'function') fn(dx, dy, { gear, gain, event: e }); else own(dx, dy);
}

export function directionSphere(o = {}) {
  const unit = o.unit || 1, toRad = (v) => v * DEG / unit;
  const root = el('div', 'mir-camsphere' + (o.plane ? ' plane' : ''));
  if (o.title) hint(root, o.title);                                               // THE ROOT WEARS THE HINT (1.6.0-alpha.23)
  if (o.label) label(el('div', 'k-lbl', root), o.label);
  const body = el('div', 'mir-camsphere-body', root);
  const svg = svgEl('svg', 'cs-svg', body);
  svg.setAttribute('viewBox', '0 0 ' + SPHERE.W + ' ' + SPHERE.H); svg.setAttribute('role', 'application'); svg.tabIndex = 0;
  svg.setAttribute('aria-roledescription', o.plane ? 'plane sphere' : 'direction sphere');
  if (o.aria || o.label) svg.setAttribute('aria-label', o.aria || o.label);
  const side = o.plane ? null : el('div', 'mir-camsphere-side', body);
  const ball = svgEl('circle', 'cs-ball', svg); ball.setAttribute('cx', SPHERE.cx); ball.setAttribute('cy', SPHERE.cy); ball.setAttribute('r', SPHERE.R);
  for (let axis = 0; axis < 3; axis++) {                                          // the three world rings: fixed on the screen; the half behind the view plane dashed
    const pts = [];
    for (let j = 0; j <= 96; j++) { const a = j * Math.PI / 48, p = [0, 0, 0]; p[(axis + 1) % 3] = Math.cos(a); p[(axis + 2) % 3] = Math.sin(a); pts.push(p); }
    const cut = splitDepth(pts);
    for (const side of ['front', 'back']) for (const run of cut[side]) svgEl('polyline', side === 'back' ? 'cs-ring back' : 'cs-ring', svg).setAttribute('points', run.map((p) => project(p).map(f2).join(',')).join(' '));
  }
  const film = svgEl('polygon', 'cs-film', svg), look = svgEl('line', 'cs-look', svg), tip = svgEl('circle', 'cs-tip', svg);
  tip.setAttribute('r', 5);
  const origin = project([0, 0, 0]);
  look.setAttribute('x1', f2(origin[0])); look.setAttribute('y1', f2(origin[1]));
  if (o.plane) return planeSphere(o, { root, body, svg, film, look, tip });

  const mk = (a) => arcKnob({ ...a, onInput: (v) => { paint(); if (a.onInput) a.onInput(v); }, onChange: (v) => { paint(); if (a.onChange) a.onChange(v); } });
  const ky = mk({ ...o.yaw }), kp = mk({ ...o.pitch });
  side.append(ky.root, kp.root);
  for (const k of [ky, kp]) {                                                      // the sphere paints from the knobs, by every road
    const set0 = k.set, show0 = k.show;
    k.set = function (v, silent) { set0.call(k, v, silent); paint(); };
    k.show = function (v) { show0.call(k, v); paint(); };
  }
  const shown = (k) => (k.shown !== null && k.shown !== undefined ? k.shown : k.get());
  function paint() {
    const yaw = toRad(shown(ky)), pitch = toRad(shown(kp)), roll = (o.roll ? o.roll() : 0) * DEG;
    const d = lookDir(yaw, pitch), t = project(d);
    setAttr(look, 'x2', f2(t[0])); setAttr(look, 'y2', f2(t[1]));
    setAttr(tip, 'cx', f2(t[0])); setAttr(tip, 'cy', f2(t[1]));
    const behind = depthOf(d) < 0; look.classList.toggle('back', behind); tip.classList.toggle('back', behind);   // a look that points behind is dashed
    const ref = Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const nrm = (a) => { const n = Math.hypot(...a) || 1; return a.map((x) => x / n); };
    const u0 = nrm(cr(d, ref)), v0 = cr(d, u0), c = Math.cos(roll), s = Math.sin(roll);
    const u = u0.map((x, i) => x * c + v0[i] * s), v = u0.map((x, i) => -x * s + v0[i] * c);
    setAttr(film, 'points', [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => project(d.map((_, k) => 0.7 * (u[k] * i + v[k] * j))).map(f2).join(',')).join(' '));
    svg.classList.toggle('mod', (ky.shown !== null && ky.shown !== undefined) || (kp.shown !== null && kp.shown !== undefined));
  }

  /* ── the hand ── */
  watchTouches();
  let g = null, homed = false;
  const tap = tapWatcher(() => { homed = true; if (o.home) o.home(); });
  svg.addEventListener('pointerdown', (e) => {
    if (g || e.button || svg.getAttribute('aria-disabled') === 'true') return;
    e.preventDefault(); svg.focus({ preventScroll: true });
    homed = false; tap(e); if (homed) return;                                      // the second tap is home, and starts no drag
    try { svg.setPointerCapture(e.pointerId); } catch (_) { /* a pointer already gone */ }
    g = grab(svg, e);
    svg.classList.add('drag');
    if (o.onStart) o.onStart(e);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    if (o.delta) { deltaMove(g, e, o, o.delta, (dx, dy) => { if (o.turn) o.turn(-dx * SPHERE_DELTA.rad, -dy * SPHERE_DELTA.rad); }); paint(); return; }   // alpha.54: the stage's drag — linear, no pole law
    const p1 = ballPoint(...fingerAt(g, e));                                       // THE ARCBALL (alpha.46): the ball turns from the last point to this one
    const [dy, dp] = sphereTurn(toRad(shown(ky)), toRad(shown(kp)), g.p, p1, gearOf(e, g.id));   // ⅛ on any modifier or a second finger: the turn is scaled, so nothing jumps
    g.p = p1;
    if (o.turn && (dy || dp)) o.turn(dy, dp);
  });
  const end = (e) => { if (!g || (e && e.pointerId !== g.id)) return; g = null; svg.classList.remove('drag'); paint(); if (o.onChange) o.onChange(); };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end); svg.addEventListener('lostpointercapture', end);
  svg.addEventListener('dblclick', (e) => e.preventDefault());                     // the double-tap was taken on the press
  svg.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || svg.getAttribute('aria-disabled') === 'true') return;
    const step = (2 * Math.PI / 100) * (e.code.startsWith('Page') ? 10 : 1) * (e.shiftKey ? setKnobLaw().keyFine : 1);   // the kit's one fine gear
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1], PageUp: [0, 1], PageDown: [0, -1] }[e.code];
    if (!dir && e.code !== 'Home' && e.code !== 'Delete' && e.code !== 'Backspace') return;   // Home and Delete: home, as on a knob
    e.preventDefault(); e.stopPropagation();
    if (dir) { if (o.turn) o.turn(dir[0] * step, dir[1] * step); } else if (o.home) o.home();
    if (o.onChange) o.onChange();
  });
  paint();
  return { root, svg, yaw: ky, pitch: kp, paint,
    setDisabled(on) { root.classList.toggle('disabled', !!on); svg.tabIndex = on ? -1 : 0; svg.setAttribute('aria-disabled', String(!!on)); ky.setDisabled(on); kp.setDisabled(on); },
    destroy() { root.remove(); } };
}

/* 1.5.7-alpha.7 · the plane mode of directionSphere (see its header): the normal drawn as the look and the tip, the plane as the film */
function planeSphere(o, { root, body, svg, film, look, tip }) {
  const P = o.plane, unitOf = (a) => { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
  const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const isView = () => !!(P.view && P.view()), drawn = () => { const n = unitOf(P.normal()); return isView() ? fromView(n) : n; };
  let last = '';
  function paint(force) {
    const d = drawn(), pos = P.pos ? +P.pos() || 0 : 0, key = d.map((v) => v.toFixed(5)).join(',') + '|' + pos.toFixed(5);
    if (!force && key === last) return false;
    last = key;
    const t = project(d), behind = depthOf(d) < 0;
    setAttr(look, 'x2', f2(t[0])); setAttr(look, 'y2', f2(t[1])); setAttr(tip, 'cx', f2(t[0])); setAttr(tip, 'cy', f2(t[1]));
    look.classList.toggle('back', behind); tip.classList.toggle('back', behind);
    const u = unitOf(cr(d, Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), v = cr(d, u);   // the plane's square through d·pos, the film's size
    setAttr(film, 'points', [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => project(d.map((x, k) => x * pos + 0.7 * (u[k] * i + v[k] * j))).map(f2).join(',')).join(' '));
    return true;
  }
  const put = (d) => { P.set(isView() ? toView(d) : d); paint(); };
  /* ── the hand: the tip follows the finger (planeDrag), the one knob law's fine gear, a double-tap is home ── */
  watchTouches();
  let g = null, homed = false;
  const home = () => { if (o.home) o.home(); paint(true); };
  const tap = tapWatcher(() => { homed = true; home(); });
  svg.addEventListener('pointerdown', (e) => {
    if (g || e.button || svg.getAttribute('aria-disabled') === 'true') return;
    e.preventDefault(); svg.focus({ preventScroll: true });
    homed = false; tap(e); if (homed) return;
    try { svg.setPointerCapture(e.pointerId); } catch (_) { /* a pointer already gone */ }
    g = grab(svg, e);
    svg.classList.add('drag');
    if (o.onStart) o.onStart(e);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    if (P.delta) {                                                                 // alpha.54: the stage's drag; the kit's own turn is about the drawing's up and right, so it has no pole
      deltaMove(g, e, o, P.delta, (dx, dy) => { const about = (ax, a, v) => turnAbout(ax, a)(v); put(about(VIEW_FRAME.right, dy * SPHERE_DELTA.rad, about(VIEW_FRAME.up, dx * SPHERE_DELTA.rad, drawn()))); });
      paint(); return;
    }
    const p1 = ballPoint(...fingerAt(g, e));                                       // THE ARCBALL (alpha.46): the normal rides the ball's turn, in 3-D
    put(arcballTurn(drawn(), g.p, p1, gearOf(e, g.id)));
    g.p = p1;
  });
  const end = (e) => { if (!g || (e && e.pointerId !== g.id)) return; g = null; svg.classList.remove('drag'); paint(); if (o.onChange) o.onChange(); };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end); svg.addEventListener('lostpointercapture', end);
  svg.addEventListener('dblclick', (e) => e.preventDefault());
  svg.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || svg.getAttribute('aria-disabled') === 'true') return;
    const step = SPHERE.R * (2 * Math.PI / 100) * (e.code.startsWith('Page') ? 10 : 1) * (e.shiftKey ? setKnobLaw().keyFine : 1);   // the camera sphere's arrow, as a tip step on the drawing
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], PageUp: [0, -1], PageDown: [0, 1] }[e.code];
    if (!dir && e.code !== 'Home' && e.code !== 'Delete' && e.code !== 'Backspace') return;
    e.preventDefault(); e.stopPropagation();
    if (dir) put(planeDrag(drawn(), dir[0] * step, dir[1] * step)); else home();
    if (o.onChange) o.onChange();
  });
  paint(true);
  return { root, svg, body, yaw: null, pitch: null, paint,
    setDisabled(on) { root.classList.toggle('disabled', !!on); svg.tabIndex = on ? -1 : 0; svg.setAttribute('aria-disabled', String(!!on)); },
    destroy() { root.remove(); } };
}

/* ═══ THE VIEW: the rows ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
export function createCameraView(parent, o = {}) {
  const port = o.port || (o.canvas ? createCssPort(o.canvas, { mode: o.mode || '2d' }) : null);
  if (!port || typeof port.get !== 'function' || typeof port.set !== 'function') throw new TypeError('camera panel: needs a port { get, set, subscribe }, or a canvas for the zero-engine camera');
  const ownPort = !o.port;
  const ids = present(port), has_ = (id) => ids.includes(id);
  const mode = o.mode || (has_('yaw') || has_('pitch') ? '3d' : '2d');
  const mod = o.mod || null;
  const key = 'mir.camera.sync.' + (++uid);
  const life = new AbortController();
  const unit = ANGLE_UNIT[port.angle || 'deg'] || 1;                                // port units per degree
  const modId = (id) => (o.modIds && o.modIds[id]) || (port.modIds && port.modIds[id]) || (o.modPrefix || 'camera') + '.' + id.toLowerCase();
  const tgt = new Set();                                                              // the vocabulary ids that are modulation targets
  const routed = (id) => { if (!mod || !tgt.has(id)) return false; try { return !!mod.isModulated(modId(id)); } catch (_) { return false; } };   // the registry throws for an id it has not been given yet
  const base = (id) => (routed(id) ? mod.baseOf(modId(id)) : port.get(id));
  /** the hand: a routed dial's base through the registry (the law), else the app's own number */
  const write = (id, v) => { if (!handWrite(mod, modId(id), v)) port.set(id, v); };
  const D = (id) => describe(id, port);

  const root = el('div', 'mir-camera' + (o.cls ? ' ' + o.cls : ''), parent);
  root.dataset.mode = mode;
  const entries = [], targets = [];                                                  // entries: what sync repaints; targets: the modulation records
  const row = (cls) => el('div', 'cam-row ' + cls, root);

  /* a descriptor for control(): the id is the modulation id; the hand writes through `write` */
  function desc(id, extra) {
    const d = D(id);
    return { id: modId(id), label: d.label, hint: d.hint, min: d.min, max: d.max, home: d.home, log: d.log, step: d.step, fmt: d.fmt,
      wrap: !!d.wrap, angle: d.kind === 'angle', reverse: !!d.reverse, value: port.get(id), get: () => port.get(id), set: (v) => write(id, v), ...extra };   // 1.5.7-alpha.6: a port's range may ask `reverse`
  }
  function add(parentEl, vids, c, read) {
    parentEl.appendChild(c.root);
    entries.push({ vids, c, read });
    if (c.targets && c.targets.length) {
      const recs = c.params();
      recs.forEach((rec, i) => { const vid = vids[i]; tgt.add(vid); targets.push({ ...rec, get: () => port.get(vid), set: (v) => port.set(vid, v) }); });   // the registry writes the app's number; the hand writes through `write`
    }
    return c;
  }
  /* THIS PANEL'S ANGLES ARE ARCS, built directly (its header's own rule): a wrapped one (YAW, ROTATION) turns freely, a bounded one (PITCH) is
     an arc with a gap.  control() draws an angle as a knob since 1.6.0-alpha.24 (arcs are colour); whether these should follow is Josh's to say.
     `desc` is the descriptor the hand writes through, as control()'s is: the rotation's trip north replaces its `set`. */
  function angleArc(id, d, extra) {
    const ds = desc(id, extra), wrap = !!d.wrap;
    const k = arcKnob({ label: d.label, title: d.hint, min: d.min, max: d.max, value: port.get(id), home: d.home, wrap, log: d.log, fmt: d.fmt, step: d.step, onInput: (v) => { ds.set(v); schedule(); }, onChange: (v) => ds.set(v) });
    k.root.dataset.control = 'arc';
    return { kind: 'arc', root: k.root, widget: k, targets: [k], desc: ds, get: () => k.get(), set: (v) => k.set(v),
      params: () => [{ id: modId(id), label: d.label, min: d.min, max: d.max, step: d.step || 0, map: wrap ? 'wrap' : 'linear', hint: d.hint, def: d.home, get: () => port.get(id), set: (v) => port.set(id, v), widget: k }] };
  }
  const single = (id, parentEl, extra) => {
    const d = D(id);
    const c = d.kind === 'switch' ? control({ id: modId(id), label: d.label, hint: d.hint, value: !!port.get(id), get: () => !!port.get(id), set: (v) => write(id, !!v) })
      : d.kind === 'options' ? control({ id: modId(id), label: d.label, options: d.options.map((x) => ({ id: x.id, label: x.label, hint: x.hint })), value: String(port.get(id)), get: () => String(port.get(id)), set: (v) => write(id, v) })
      : d.kind === 'angle' ? angleArc(id, d, extra)
      : control(desc(id, extra));
    return add(parentEl, [id], c, () => (d.kind === 'switch' ? !!port.get(id) : d.kind === 'options' ? String(port.get(id)) : port.get(id)));
  };

  /* ── NORTH's memory, and the verbs ── */
  let memo = null, lastNorth = '';
  const northMemo = () => (typeof port.northMemo === 'function' ? port.northMemo() : memo);
  const rotDeg = () => base('rotation') / unit;
  function northPress() {
    if (!has_('rotation')) return;
    if (typeof port.north === 'function' && !routed('rotation')) port.north();
    else { const s = northStep(rotDeg(), memo); if (s.to !== null) { memo = s.memo; write('rotation', s.to * unit); } }
    paintNorth(); schedule();
  }
  const verbs = row('cam-verbs');
  const verbBtns = [];
  for (const v of port.verbs || []) {
    const b = trig({ label: v.label, title: v.title, cls: 'cam-verb', onFire: () => {
      if (b.root.disabled) return;
      let r; try { r = v.run(); } catch (e) { r = null; throw e; }
      if (r && typeof r.then === 'function') { b.root.disabled = true; const done = () => { b.root.disabled = false; schedule(); }; r.then(done, done); } else schedule();
    } });
    verbs.appendChild(b.root); verbBtns.push(b);
  }
  const homeIds = mode === '3d' ? ['yaw', 'pitch', 'roll', 'zoom', 'fov'].filter(has_) : ['panX', 'panY', 'orbit'].filter(has_);
  const homeAll = () => { for (const id of homeIds) write(id, D(id).home); schedule(); };
  function home() { if (mode === '3d' && typeof port.home === 'function') { port.home(); schedule(); } else homeAll(); }
  let homeBtn = null, northBtn = null;
  if (mode === '3d' ? (homeIds.length || port.home) : homeIds.length) {
    homeBtn = trig({ label: mode === '3d' ? 'HOME' : 'PAN HOME', cls: 'cam-home', title: mode === '3d' ? 'HOME — restore the default view' : 'PAN HOME — reset pan and orbit bases; routed modulation continues', onFire: home });
    verbs.appendChild(homeBtn.root);
  }
  if (mode === '2d' && has_('rotation')) {
    northBtn = trig({ label: 'NORTH', cls: 'cam-north', title: 'NORTH — turn the view to north; press again to go back', onFire: northPress });
    verbs.appendChild(northBtn.root);
  }
  if (!verbs.children.length) verbs.remove();
  verbs.dataset.n = String(verbs.children.length);

  /* ── the mode ── */
  if (has_('mode')) single('mode', row('cam-mode'));

  /* ── the sphere (both of yaw and pitch), else yaw and pitch are arcs in the view row ── */
  let sphere = null;
  const sphereOn = has_('yaw') && has_('pitch');
  if (sphereOn) {
    const dy = D('yaw'), dp = D('pitch');
    const knobOpts = (d, id) => ({ label: d.label, title: d.hint, min: d.min, max: d.max, value: port.get(id), home: d.home, wrap: !!d.wrap, fmt: d.fmt, step: d.step, onInput: (v) => { write(id, v); schedule(); } });
    const turnBy = (dyawRad, dpitchRad) => {
      const toPort = 180 / Math.PI * unit;
      if (typeof port.turn === 'function' && !routed('yaw') && !routed('pitch')) {
        port.turn(dyawRad * toPort, dpitchRad * toPort);
        sphere.yaw.set(port.get('yaw')); sphere.pitch.set(port.get('pitch'));      // alpha.46: the arcs follow the hand per move (sync skips a sphere mid-drag), so the next turn starts from the live arrow, not a stale one (λWAVES 0.5.3 M5 did this app-side)
        schedule(); return;
      }
      const wrapTo = (v, lo, hi) => lo + ((((v - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));
      const yaw = dy.wrap ? wrapTo(base('yaw') + dyawRad * toPort, dy.min, dy.max) : clamp(base('yaw') + dyawRad * toPort, dy.min, dy.max);
      const pitch = clamp(base('pitch') + dpitchRad * toPort, dp.min, dp.max);
      sphere.yaw.set(yaw); sphere.pitch.set(pitch);                                 // the knobs follow the hand whether or not the app notifies
      write('yaw', yaw); write('pitch', pitch); schedule();
    };
    /* alpha.54: a port with drag(dx, dy, info) is turned by the raw step (its own stage's hand); `sphereDelta: true` asks the kit's linear turn */
    const delta = typeof port.drag === 'function' ? (dx, dy, info) => { port.drag(dx, dy, info); sphere.yaw.set(port.get('yaw')); sphere.pitch.set(port.get('pitch')); schedule(); } : !!o.sphereDelta;
    sphere = directionSphere({ label: 'DIRECTION', aria: 'Look direction', unit, yaw: knobOpts(dy, 'yaw'), pitch: knobOpts(dp, 'pitch'), delta, gain: o.sphereGain, onStart: o.onSphereStart,
      roll: has_('roll') ? () => port.get('roll') / unit : null, turn: turnBy, home: () => { write('yaw', dy.home); write('pitch', dp.home); sphere.yaw.set(dy.home); sphere.pitch.set(dp.home); schedule(); } });
    row('cam-sphere').appendChild(sphere.root);
    for (const [k, id, d] of [[sphere.yaw, 'yaw', dy], [sphere.pitch, 'pitch', dp]]) {
      k.root.dataset.param = modId(id);
      const mapOf = d.wrap ? 'wrap' : d.log ? 'log' : 'linear';
      tgt.add(id); targets.push({ id: modId(id), label: d.label, min: d.min, max: d.max, step: d.step || 0, map: mapOf, hint: d.hint, def: d.home, get: () => port.get(id), set: (v) => port.set(id, v), widget: k });
    }
    entries.push({ vids: ['yaw', 'pitch'], c: { root: sphere.root, widget: sphere.svg, set: () => {}, kind: 'sphere' }, read: () => null, sphere });
  }

  /* ── the pan: an XY pad and its two knobs — and, under Y, the ROTATION knob (Josh, 2026-10-06: "could the rotation knob sit
     underneath the Y knob? I think we can save a row that way": BASINS' view row held ROTATION alone) ── */
  let padEntry = null, rotSeat = null;
  if (has_('panX') && has_('panY')) {
    const dx = D('panX'), dy = D('panY');
    const axis = (id, d) => ({ id: modId(id), label: d.label, min: d.min, max: d.max, step: d.step, fmt: d.fmt, hint: d.hint, def: d.home, get: () => port.get(id), set: (v) => write(id, v) });
    const c = control({ id: modId('pan'), label: 'PAN', pair: [axis('panX', dx), axis('panY', dy)], home: [dx.home, dy.home], wrap: o.panWrap, hint: 'PAN — the view moved along the screen\'s axes, as a share of its width; drag the pad, or turn X and Y; double-tap to come home' });   // 1.5.7-alpha.13: `panWrap`
    c.widget.x.setDefault(dx.home); c.widget.y.setDefault(dy.home);
    add(row('cam-pan'), ['panX', 'panY'], c, () => [port.get('panX'), port.get('panY')]);
    padEntry = c;
    rotSeat = c.root.querySelector('.mir-xy-side');                 // the pad's knob column: X, Y, then ROTATION
  }

  /* ── the view row (what the pad did not seat) ── */
  const view = row('cam-view');
  for (const id of ['rotation', 'roll', ...(sphereOn ? [] : ['yaw', 'pitch']), 'zoom', 'fov', 'flip']) {
    if (!has_(id)) continue;
    if (id === 'rotation') {
      const c = single(id, rotSeat || view);
      const d = D(id);
      // BASINS: a double-tap (the arc's home) is a trip north, and remembers where it left
      const set0 = c.desc.set; c.desc.set = (v) => { if (v === d.home) { const b = base('rotation'); if (!atNorth(b / unit)) memo = wrapDegrees(b / unit); } set0(v); paintNorth(); };
    } else single(id, view);
  }
  if (!padEntry) for (const id of ['panX', 'panY']) if (has_(id)) single(id, view);
  if (!view.children.length) view.remove();

  /* ── the scales and the orbit ── */
  const scales = row('cam-scales');
  for (const id of ['rotationMul', 'panMul', 'orbit', 'orbitAngle']) if (has_(id)) single(id, scales);
  if (!scales.children.length) scales.remove();

  /* ── the hand ── */
  let handBox = null;
  const handIds = o.hand === false ? [] : HAND_IDS.filter(has_);
  if (handIds.length) {
    handBox = el('section', 'cam-hand', root);
    label(el('div', 'cam-title', handBox), 'HAND');
    const grid = el('div', 'cam-row cam-handrow', handBox);
    for (const id of handIds) single(id, grid);
  }

  /* ── painting: the notice, and the one frame that follows it ── */
  const busy = (e) => { const w = e.c.widget; if (!w) return false; if (e.sphere) return e.sphere.svg.classList.contains('drag') || e.sphere.yaw.dragging() || e.sphere.pitch.dragging(); if (w.pad) return w.pad.classList.contains('drag') || w.x.dragging() || w.y.dragging(); return typeof w.dragging === 'function' && w.dragging(); };
  let dirty = false;
  function sync() {
    if (!root.isConnected) { dirty = true; return; }
    dirty = false;
    for (const e of entries) {
      if (e.vids.some(routed) || busy(e)) continue;
      if (e.sphere) { e.sphere.yaw.set(port.get('yaw')); e.sphere.pitch.set(port.get('pitch')); e.sphere.paint(); continue; }
      const v = e.read(); if (v === undefined) continue;
      e.c.set(v);
    }
    paintNorth();
  }
  function schedule() { frame.coalesce(key, sync); }
  function paintNorth() {
    if (!northBtn) return;
    const b = rotDeg(), m = northMemo(), at = atNorth(b), s = fmtDeg(b) + '|' + at + '|' + m;
    if (s === lastNorth) return;
    lastNorth = s;
    northBtn.on = at;
    hint(northBtn.root, at ? (m === null || m === undefined ? 'NORTH — the view is at north' : 'NORTH — go back to {deg}') : 'NORTH — turn the view to north; press again to go back to {deg}', { deg: fmtDeg(at ? (m || 0) : b) });
    if (o.status) o.status(at ? (m === null || m === undefined ? 'NORTH' : 'NORTH · back to ' + fmtDeg(m)) : fmtDeg(b));
  }
  const offPort = typeof port.subscribe === 'function' ? port.subscribe(schedule) : null;
  paintNorth();

  /* ── modulation: the targets, added now ── */
  const offMod = [];
  if (mod && typeof mod.add === 'function' && targets.length) offMod.push(mod.add(targets));   // one rebuild of the modulation window (mod.add takes a list)
  const params = () => targets.slice();

  /* ── the project and the history ── */
  const values = () => { const out = {}; for (const id of ids) { const v = port.get(id); if (v !== undefined) out[id] = v; } return out; };
  const put = (saved) => { for (const [id, v] of Object.entries(saved || {})) if (has_(id) && v !== undefined) port.set(id, v); schedule(); };
  const offs = [];
  if (o.project !== false) offs.push(registerProjectPart(o.part || 'camera', {
    capture: () => ({ v: 1, values: values(), north: northMemo() }),
    restore: (saved) => { if (!saved) return; memo = Number.isFinite(saved.north) ? saved.north : null; put(saved.values); },
    subscribe: (fn) => (typeof port.subscribe === 'function' ? port.subscribe(fn) : () => {}),
  }));
  if (o.history && typeof o.history.register === 'function') offs.push(o.history.register(o.part || 'camera', { read: () => ({ values: values(), north: memo }), write: (s) => { memo = s && Number.isFinite(s.north) ? s.north : null; put(s && s.values); } }));

  if (o.sync !== false && root.isConnected) sync();
  const view_ = { root, port, mode, ids, controls: entries, params, targets: () => targets.slice(), sync, northPress, home, schedule, sphere, pad: padEntry, north: northBtn, homeBtn, verbs: verbBtns,
    memo: northMemo,
    destroy() {
      life.abort(); frame.cancel(key);
      if (offPort) offPort();
      for (const f of offMod) f(); for (const f of offs) { try { f(); } catch (_) { /* gone */ } }
      for (const e of entries) { if (e.sphere) e.sphere.destroy(); else if (e.c.widget && e.c.widget.destroy) e.c.widget.destroy(); }
      if (ownPort && port.destroy) port.destroy();
      root.remove();
    } };
  return view_;
}

/* ═══ THE RACK CARD ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
export function createCameraPanel(o = {}) {
  const id = o.id || 'camera';
  const port = o.port || (o.canvas ? createCssPort(o.canvas, { mode: o.mode || '2d' }) : null);
  if (!port) throw new TypeError('camera panel: needs a port, or a canvas for the zero-engine camera');
  let view = null;
  const handle = { id, port, view: () => view, params: () => (view ? view.params() : []), sync: () => view && view.sync(), destroy() { if (view) view.destroy(); view = null; if (!o.port && port.destroy) port.destroy(); } };
  const spec = {
    id, title: o.title || 'CAMERA', side: o.side || 'right', open: o.open, glyph: o.glyph || 'cameraOrbit', action: o.action, hint: o.hint || 'where the view is',
    build(body, api) { view = createCameraView(body, { ...o, port, status: api && api.setStatus ? (s) => api.setStatus(s) : null }); handle.root = view.root; },
    onWake() { if (view) view.sync(); }, onOpen() { if (view) view.sync(); },
    ...(o.spec || {}),
  };
  if (o.rack) o.rack.register(spec);
  handle.spec = spec;
  return handle;
}
