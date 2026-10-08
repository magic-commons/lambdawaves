/* panels/camera-rig.js — THE CAMERA'S MATHS: no DOM, no storage, node-testable.  Harvested from BASINS app/camera-rig.js
 * (rotation, pan, orbit, the two scales, the unwrapped composition) and app/camera-window.js (NORTH and its memory, the formats),
 * and generalised for the 3-D mode from the kit's plane-model.js (a direction on a sphere) and λWAVES' lab/camera-law.js.
 *
 *   BASINS' rig, as it is      CAMERA · CAMERA_DEFAULTS · turn · wrapDegrees · createCameraRig · setCameraValue · cameraPose
 *   THE VOCABULARY            VOCAB — every id a port may implement, with its words, its range and its kind; the panel shows only
 *                             the ids the port has.  describe(id, port) merges the port's own range over it and resolves the unit.
 *   NORTH                     atNorth · northStep: off north → go there and remember; at north → go back (BASINS' one-button law)
 *   THE SPHERE                lookDir · anglesOf · project · sphereDrag: the arrow's tip follows the finger, with no gimbal lock
 *   THE CSS CAMERA            transform2d · transform3d: the zero-engine default (a picture turned by a CSS transform)
 *
 * Angles in a port's own unit (`port.angle`: 'deg' by default, or 'rad'); every readout is in degrees. */

/* ── BASINS' rig (app/camera-rig.js), unchanged ── */
export const CAMERA = Object.freeze({ rotation: 'camera.rotation', panx: 'camera.panx', pany: 'camera.pany',
  rotationmul: 'camera.rotationmul', panmul: 'camera.panmul', orbit: 'camera.orbit', orbitangle: 'camera.orbitangle' });
export const CAMERA_DEFAULTS = Object.freeze({ rotation: 0, panx: 0, pany: 0, rotationmul: 1, panmul: 1, orbit: 0, orbitangle: 0 });
export const turn = (a, b) => ((((a - b) % 360) + 540) % 360) - 180;
export const wrapDegrees = (a) => ((a % 360) + 360) % 360;

export function createCameraRig(values = {}) {
  const rig = { ...CAMERA_DEFAULTS, ...values };
  rig.unwrapped = rig.rotation;
  return rig;
}

export function setCameraValue(rig, field, value, absolute = false) {
  if (field === 'rotation') rig.unwrapped = absolute ? value : rig.unwrapped + turn(value, rig.rotation);
  rig[field] = value;
}

/** Multiply the continuous modulation excursion, leaving the authored north/base alone.
 * Unwrapping before scaling keeps a 359° → 0° seam continuous even at 1/16×. */
export function cameraPose(rig, baseRotation = rig.rotation) {
  const angle = rig.orbitangle * Math.PI / 180;
  return { rotation: baseRotation + (rig.unwrapped - baseRotation) * rig.rotationmul,
    panx: rig.panx * rig.panmul + rig.orbit * Math.cos(angle),
    pany: rig.pany * rig.panmul + rig.orbit * Math.sin(angle) };
}

/* ── NORTH (app/gestures.js NORTH_EPS, northToggle; app/camera-window.js signed, atNorth) ── */
export const NORTH_EPS = 0.002;                                       // rad: "at north"
export const NORTH_EPS_DEG = NORTH_EPS * 180 / Math.PI;
/** [0, 360) → [−180, 180) */
export const signed = (deg) => ((((deg + 180) % 360) + 360) % 360) - 180;
export const atNorth = (deg) => Math.abs(signed(deg)) <= NORTH_EPS_DEG;
/** NORTH, and back.  `angle` is the rotation's base now (degrees), `memo` the rotation north last left (or null).
 *  → { to, memo }: `to` is where to turn (degrees), or null when at north with nothing remembered.  The memory is kept after
 *  the trip back, so the next press goes north again (BASINS: `northFrom` is never cleared). */
export function northStep(angle, memo) {
  if (!atNorth(angle)) return { to: 0, memo: wrapDegrees(angle) };
  if (memo === null || memo === undefined || !Number.isFinite(memo)) return { to: null, memo: null };
  return { to: memo, memo };
}

/* ── the formats (BASINS' camera-window.js, and λWAVES' for the hand) ── */
export const fmtDeg = (deg) => { const s = signed(deg); return (s < 0 ? '−' : '') + Math.abs(s).toFixed(0) + '°'; };
export const fmtScale = (v) => Math.abs(v - 1) < 1e-8 ? '1:1' : v < 1 && v > 0 ? '1/' + (1 / v).toFixed(1).replace(/\.0$/, '') + '×' : v.toFixed(2).replace(/\.?0+$/, '') + '×';
export const fmtPan = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v * 100).toFixed(0) + '%';
const FMT = {
  dsigned: (k) => (v) => fmtDeg(v / k),
  deg: (k) => (v) => (v / k).toFixed(0) + '°',
  degs: (k) => (v) => (v / k).toFixed(0) + '°/s',
  pan: () => fmtPan, scale: () => fmtScale,
  zoom: () => (v) => '×' + (v >= 10 ? v.toFixed(1) : v.toFixed(2)),
  gain: () => (v) => '×' + v.toFixed(2),
  mu: () => (v) => (v > 0 ? 'μ ' + v.toFixed(2) + ' /s' : '∞ · forever'),
  pct: () => (v) => Math.round(v * 100) + '%',
};

/* ── THE VOCABULARY.  A port implements only the ids it has; the panel shows only those.  `angle: true` means the range is in the
 *    port's angle unit (so 'rad' scales it); `group` is the row it sits in; `hint` is BASINS' words where it has them. ── */
export const VOCAB = Object.freeze({
  /* the view */
  rotation:    { group: 'view', kind: 'angle', label: 'ROTATION', min: 0, max: 360, home: 0, wrap: true, angle: true, fmt: 'dsigned',
    hint: 'ROTATION — drag up or down to turn the view about its centre; double-tap for north' },
  panX:        { group: 'pan', kind: 'knob', label: 'X', min: -1, max: 1, home: 0, fmt: 'pan',
    hint: 'PAN X — the view moved sideways, as a share of its width; drag up or down; double-tap to come home' },
  panY:        { group: 'pan', kind: 'knob', label: 'Y', min: -1, max: 1, home: 0, fmt: 'pan',
    hint: 'PAN Y — the view moved up or down, as a share of its width; drag up or down; double-tap to come home' },
  zoom:        { group: 'view', kind: 'knob', label: 'ZOOM', min: 0.25, max: 64, home: 1, log: true, fmt: 'zoom', hint: 'ZOOM — how near the view is; double-tap for home' },
  flip:        { group: 'view', kind: 'switch', label: 'FLIP', hint: 'FLIP — mirror the view' },
  rotationMul: { group: 'scale', kind: 'knob', label: 'ROT SCALE', min: 1 / 16, max: 16, home: 1, log: true, fmt: 'scale',
    hint: 'ROT SCALE — multiply rotation modulation from 1/16× to 16×; middle and double-tap are 1:1' },
  panMul:      { group: 'scale', kind: 'knob', label: 'PAN SCALE', min: 0, max: 4, home: 1, fmt: 'scale',
    hint: 'PAN SCALE — multiply both pan axes; zero mutes pan; double-tap restores 1:1' },
  orbit:       { group: 'scale', kind: 'knob', label: 'ORBIT', min: 0, max: 1, home: 0, fmt: 'pan',
    hint: 'ORBIT — radius in view widths; modulate ORBIT ANGLE to circle the camera anchor' },
  orbitAngle:  { group: 'scale', kind: 'angle', label: 'ORBIT ANGLE', min: 0, max: 360, home: 0, wrap: true, angle: true, fmt: 'dsigned',
    hint: 'ORBIT ANGLE — 0° right, 90° up; route a full-turn ramp for a continuous orbit' },
  /* the 3-D camera */
  mode:        { group: 'mode', kind: 'options', label: 'CONTROL', options: [{ id: 'turntable', label: 'TURNTABLE', hint: 'Orbit with a level horizon' }, { id: 'free', label: 'FREE', hint: 'Unrestricted rotation, with roll' }] },
  yaw:         { group: 'sphere', kind: 'angle', label: 'YAW', min: -180, max: 180, home: 0, wrap: true, angle: true, fmt: 'dsigned', hint: 'YAW — the look direction about the vertical; drag the sphere or turn this' },
  pitch:       { group: 'sphere', kind: 'angle', label: 'PITCH', min: -90, max: 90, home: 0, angle: true, fmt: 'deg', hint: 'PITCH — the look direction up or down' },
  roll:        { group: 'view', kind: 'angle', label: 'ROLL', min: -180, max: 180, home: 0, wrap: true, angle: true, fmt: 'dsigned', hint: 'ROLL — turn the picture about the look direction' },
  fov:         { group: 'view', kind: 'knob', label: 'FOV', min: 10, max: 120, home: 60, angle: true, fmt: 'deg', hint: 'FOV — the vertical field of view' },
  /* the hand: the feel of the drag */
  drag:        { group: 'hand', kind: 'knob', label: 'DRAG', min: 0.2, max: 8, home: 1, log: true, fmt: 'gain', hint: 'DRAG — how far the view turns for a drag; Shift is finer; double-tap resets' },
  friction:    { group: 'hand', kind: 'knob', label: 'FRICTION', min: 0, max: 12, home: 1, step: 0.05, fmt: 'mu', hint: 'FRICTION — how fast a released view slows; at 0 it never stops' },
  inertia:     { group: 'hand', kind: 'knob', label: 'INERTIA', min: 0, max: 1, home: 0.5, fmt: 'pct', hint: 'INERTIA — how far a released view coasts' },
  fling:       { group: 'hand', kind: 'knob', label: 'FLING', min: 0, max: 2, home: 1, step: 0.01, fmt: 'gain', hint: 'FLING — the speed a released view keeps; at 0 it stops dead' },
  autoRotate:  { group: 'hand', kind: 'switch', label: 'AUTO-ROTATE', hint: 'AUTO-ROTATE — turn the view on its own' },
  spin:        { group: 'hand', kind: 'knob', label: 'SPIN', min: 1, max: 120, home: 15, log: true, angle: true, fmt: 'degs', hint: 'SPIN — the auto-rotate speed' },
  wheel:       { group: 'hand', kind: 'options', label: 'WHEEL', options: [{ id: 'smooth', label: 'SMOOTH', hint: 'The wheel zooms continuously' }, { id: 'step', label: 'STEP', hint: 'The wheel zooms a notch at a time' }] },
});
export const IDS = Object.freeze(Object.keys(VOCAB));
export const HAND_IDS = Object.freeze(IDS.filter((i) => VOCAB[i].group === 'hand'));
export const ANGLE_UNIT = Object.freeze({ deg: 1, rad: Math.PI / 180 });

/** has(port, id): the port implements the id when it says so (`port.has`) or when `get(id)` answers with anything but undefined */
export function has(port, id) {
  if (!port || !VOCAB[id]) return false;
  if (typeof port.has === 'function') return !!port.has(id);
  return typeof port.get === 'function' && port.get(id) !== undefined;
}
/** the ids a port has, in vocabulary order */
export const present = (port) => IDS.filter((id) => has(port, id));

/** describe(id, port) → the descriptor the panel builds from: the vocabulary's entry, the port's own range laid over it (`port.ranges[id]`:
 *  { min, max, home, log, step, fmt, label, wrap }, in the port's unit), the angle unit applied, `fmt` resolved to a function. */
export function describe(id, port) {
  const v = VOCAB[id];
  if (!v) return null;
  const k = ANGLE_UNIT[(port && port.angle) || 'deg'] || 1;
  const own = (port && port.ranges && port.ranges[id]) || {};
  const scale = (n) => (v.angle && Number.isFinite(n) ? n * k : n);
  const d = { ...v, id, ...own };
  for (const f of ['min', 'max', 'home']) if (!(f in own) && v[f] !== undefined) d[f] = scale(v[f]);
  d.unit = v.angle ? k : 1;
  const fmt = own.fmt !== undefined ? own.fmt : v.fmt;
  d.fmt = typeof fmt === 'function' ? fmt : fmt && FMT[fmt] ? FMT[fmt](d.unit) : undefined;
  return d;
}

/* ── THE SPHERE (the kit's plane-model.js drawing and projection, for a direction) ── */
export const SPHERE = Object.freeze({ W: 400, H: 280, cx: 200, cy: 140, R: 85 });
const S2 = Math.SQRT1_2, S6 = 1 / Math.sqrt(6), S23 = Math.sqrt(2 / 3);
/** the look direction for yaw (about z) and pitch (up from the horizon), radians */
export const lookDir = (yaw, pitch) => [Math.cos(pitch) * Math.cos(yaw), Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch)];
/** the inverse: { yaw, pitch } of a direction (any length) */
export function anglesOf(d) { const n = Math.hypot(d[0], d[1], d[2]) || 1; return { yaw: Math.atan2(d[1], d[0]), pitch: Math.asin(Math.max(-1, Math.min(1, d[2] / n))) }; }
/** plane-model.js `project`: a point of the unit ball → the 400 × 280 drawing (isometric) */
export const project = (p) => [SPHERE.cx + SPHERE.R * S2 * (p[0] - p[1]), SPHERE.cy + SPHERE.R * ((p[0] + p[1]) * S6 - p[2] * S23)];
const linear = (p) => [SPHERE.R * S2 * (p[0] - p[1]), SPHERE.R * ((p[0] + p[1]) * S6 - p[2] * S23)];

/** sphereDrag(yaw, pitch, dsx, dsy) → [dyaw, dpitch] (radians): the turn that moves the arrow's TIP by the screen step (dsx, dsy) (in the
 *  drawing's units), the least-squares answer when the tip points at the eye (a damped pseudo-inverse: it never jumps, never locks). */
export function sphereDrag(yaw, pitch, dsx, dsy) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const a = linear([-cp * sy, cp * cy, 0]), b = linear([-sp * cy, -sp * sy, cp]);       // ∂tip/∂yaw, ∂tip/∂pitch on screen
  const lam = 1e-3 * SPHERE.R * SPHERE.R;
  const m00 = a[0] * a[0] + a[1] * a[1] + lam, m01 = a[0] * b[0] + a[1] * b[1], m11 = b[0] * b[0] + b[1] * b[1] + lam;
  const r0 = a[0] * dsx + a[1] * dsy, r1 = b[0] * dsx + b[1] * dsy, det = m00 * m11 - m01 * m01;
  return [(r0 * m11 - r1 * m01) / det, (m00 * r1 - m01 * r0) / det];
}

/* ── THE CSS CAMERA: what a picture does with no engine ── */
/** transform2d(rig, { w, zoom, flip }) → a CSS transform: pan is a share of the width (up is +y), the picture turns clockwise by the rotation */
export function transform2d(rig, { w = 0, zoom = 1, flip = false } = {}) {
  const p = cameraPose(rig);
  return 'translate(' + (p.panx * w).toFixed(2) + 'px, ' + (-p.pany * w).toFixed(2) + 'px) rotate(' + p.rotation.toFixed(3) + 'deg) scale(' + (flip ? -zoom : zoom).toFixed(5) + ', ' + zoom.toFixed(5) + ')';
}
/** transform3d({ yaw, pitch, roll, zoom, fov, h, free }) (degrees) → a CSS transform: the picture on a plane, seen through a perspective
 *  whose field of view is `fov`; roll only when FREE */
export function transform3d({ yaw = 0, pitch = 0, roll = 0, zoom = 1, fov = 60, h = 400, free = true } = {}) {
  const f = Math.max(5, Math.min(170, fov)) * Math.PI / 180, dist = (h / 2) / Math.tan(f / 2);
  return 'perspective(' + dist.toFixed(1) + 'px) rotateX(' + (-pitch).toFixed(3) + 'deg) rotateY(' + yaw.toFixed(3) + 'deg) rotateZ(' + (free ? roll : 0).toFixed(3) + 'deg) scale(' + zoom.toFixed(5) + ')';
}
