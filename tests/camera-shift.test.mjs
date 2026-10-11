/* tests/camera-shift.test.mjs — THE LENS SHIFT's maths (0.4.0 S2, research/release-0.4.0/BRIEF-S2-CAMERA.md §1), node only.
 *   node tests/camera-shift.test.mjs
 * obs.shift = [px, py] is where the pivot appears on the frame (NDC, +y up).  The law: the on-axis picture translated by p.
 * Judged here over the shipped helpers — cameraEye, toScreen (at and its inverse ray, the pointer's), lensShift (writeView's
 * lane and principal point), perspective and lookAt (lab/field.js) and the camera law (lab/camera-law.js).  The GPU half — one
 * FRAME corner on one pixel through the line pass, the ray pass and the pointer — is tests/camera-shift.browser-test.mjs. */
import assert from 'node:assert/strict';
import { cameraEye, toScreen, lensShift, perspective, lookAt, quatFromYawPitch } from '../lab/field.js';
import { clampShift, createCameraLaw, CAM } from '../lab/camera-law.js';

const pass = (s) => console.log('PASS ' + s);
const HALF = 7, W = 1300, H = 850, aspect = W / H;
const POSES = [
  { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6, mode: 'turntable' },
  { yaw: -2.1, pitch: -1.2, dist: 1.4, fov: 1.1, mode: 'turntable' },
  { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6, mode: 'free', quat: quatFromYawPitch(0.65, 0.38) },
  { yaw: 0, pitch: 0, dist: 6.2, fov: 0.3, mode: 'free', quat: (() => { const q = [0.3, -0.5, 0.7, 0.4], n = Math.hypot(...q); return q.map((v) => v / n); })() },
];
const SHIFTS = [[0.4, -0.3], [-1, 1], [0.05, 0], [0, -0.75]];
const POINTS = [[0, 0, 0], [7, 7, 7], [-7, 7, -7], [3.2, -1.1, 0.4], [-5, 2, 6.5]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => Math.hypot(a[0], a[1], a[2]);
/** column-major M · [x, y, z, 1] */
const apply = (M, p) => [0, 1, 2, 3].map((r) => M[r] * p[0] + M[4 + r] * p[1] + M[8 + r] * p[2] + M[12 + r]);
/** writeView's two matrices, in float64 so the maths is judged and not the f32 rounding: perspective, the shift, lookAt */
function lineMatrix(obs, E) {
  const P = perspective(obs.fov || 0.6, aspect, 0.05 * HALF, 20 * HALF, new Float64Array(16)), lane = new Float64Array(44);
  lane.set(E.basis.fwd, 12); lensShift(E, aspect, lane, 12, P);
  const L = lookAt(E.eye, E.target, E.basis.up, new Float64Array(16));
  return { P, L, lane, ndc: (p) => { const v = apply(L, p), c = apply(P, v); return [c[0] / c[3], c[1] / c[3]]; } };
}
/** the ray pass's direction for the pixel at uv (u, v): the WGSL `V.fwd + u·V.right.w·V.right + v·V.up.w·V.up` */
const rayPass = (E, lane, u, v) => [0, 1, 2].map((i) => lane[12 + i] + u * E.tanH * aspect * E.basis.right[i] + v * E.tanH * E.basis.up[i]);
const parallel = (a, b) => norm(cross(a, b)) / (norm(a) * norm(b));

/* 1 · AT p = 0 EVERY BYTE IS TODAY'S.  lensShift writes nothing (the lane stays fwd, the matrix perspective()'s), and toScreen.at
   and its inverse are the pre-S2 expressions operand for operand (copied here from bd9b0e5's toScreen and pointerRay). */
for (const obs of POSES) for (const shift of [undefined, [0, 0], [-0, 0]]) {
  const o = { ...obs, shift }, E = cameraEye(o, HALF);
  const lane = new Float32Array(44); lane.set(E.basis.fwd, 12);
  const P = perspective(o.fov, aspect, 0.05 * HALF, 20 * HALF, new Float32Array(16));
  const lane0 = lane.slice(), P0 = P.slice();
  assert.equal(lensShift(E, aspect, lane, 12, P), false, 'nothing is written at p = 0');
  assert.deepEqual(new Uint8Array(lane.buffer), new Uint8Array(lane0.buffer)); assert.deepEqual(new Uint8Array(P.buffer), new Uint8Array(P0.buffer));
  const S = toScreen(o, HALF, W, H), { fwd, right, up } = E.basis, c = E.eye, tanH = E.tanH;
  for (const X of POINTS) {
    const dx = X[0] - c[0], dy = X[1] - c[1], dz = X[2] - c[2], depth = dx * fwd[0] + dy * fwd[1] + dz * fwd[2];
    const u = (dx * right[0] + dy * right[1] + dz * right[2]) / (depth * tanH * aspect), v = (dx * up[0] + dy * up[1] + dz * up[2]) / (depth * tanH);
    assert.deepEqual(S.at(...X), [(u + 1) / 2 * W, (1 - v) / 2 * H, depth], 'the overlays\' pixel is today\'s');
  }
  for (const [px, py] of [[0, 0], [650, 425], [17.5, 801.25], [1299, 3]]) {
    const u = 2 * px / W - 1, v = 1 - 2 * py / H;
    const today = [fwd[0] + u * tanH * aspect * right[0] + v * tanH * up[0], fwd[1] + u * tanH * aspect * right[1] + v * tanH * up[1], fwd[2] + u * tanH * aspect * right[2] + v * tanH * up[2]];
    assert.deepEqual(S.ray(px, py), today, 'the pointer\'s ray is today\'s');
  }
}
pass('p = 0: lensShift writes nothing (the forward lane is fwd and the perspective matrix perspective()\'s, byte for byte), and toScreen.at and the pointer\'s ray are the pre-S2 expressions bit for bit — 4 poses × {absent, [0,0], [−0,0]}');

/* 2 · THE PIVOT APPEARS AT p, through every seat: the line pass (P·L), the ray pass (the lane), the overlays (at) and the pointer (ray). */
for (const obs of POSES) for (const shift of SHIFTS) {
  const o = { ...obs, shift }, E = cameraEye(o, HALF), M = lineMatrix(o, E), S = toScreen(o, HALF, W, H);
  const ndc = M.ndc([0, 0, 0]);
  assert.ok(Math.abs(ndc[0] - shift[0]) < 1e-12 && Math.abs(ndc[1] - shift[1]) < 1e-12, `line pass: the pivot at ${ndc} for ${shift}`);
  assert.ok(parallel(rayPass(E, M.lane, shift[0], shift[1]), E.basis.fwd) < 1e-12, 'ray pass: the pixel at uv p marches the axis');
  const q = S.at(0, 0, 0);
  assert.ok(Math.abs(q[0] - (shift[0] + 1) / 2 * W) < 1e-9 && Math.abs(q[1] - (1 - shift[1]) / 2 * H) < 1e-9, 'overlays: the pivot\'s pixel');
  assert.ok(parallel(S.ray(q[0], q[1]), E.basis.fwd) < 1e-12, 'pointer: the pivot\'s pixel looks down the axis');
}
pass('p ≠ 0: the pivot projects to p through the line pass\'s matrix, the ray pass\'s lane, the overlays\' at() and the pointer\'s ray — 4 poses × 4 shifts, to 1e-12');

/* 3 · ONE PICTURE: every world point lands on the same pixel through all four, and the shift is a pure translation of it. */
let worst = 0;
for (const obs of POSES) for (const shift of SHIFTS) {
  const o = { ...obs, shift }, E = cameraEye(o, HALF), M = lineMatrix(o, E), S = toScreen(o, HALF, W, H), S0 = toScreen({ ...obs }, HALF, W, H);
  for (const X of POINTS) {
    const q = S.at(...X); if (!q) continue;
    const n = M.ndc(X), u = 2 * q[0] / W - 1, v = 1 - 2 * q[1] / H, q0 = S0.at(...X), toX = sub(X, E.eye);
    worst = Math.max(worst, Math.abs(n[0] - u), Math.abs(n[1] - v));
    assert.ok(Math.abs(n[0] - u) < 1e-9 && Math.abs(n[1] - v) < 1e-9, 'line pass = overlays');
    assert.ok(parallel(rayPass(E, M.lane, u, v), toX) < 1e-12, 'ray pass = overlays');
    assert.ok(parallel(S.ray(q[0], q[1]), toX) < 1e-12, 'pointer = overlays');
    assert.ok(Math.abs(q[0] - q0[0] - shift[0] * W / 2) < 1e-9 && Math.abs(q[1] - q0[1] + shift[1] * H / 2) < 1e-9, 'a translation by (px·W/2, −py·H/2)');
  }
}
pass(`one picture: ${POSES.length * SHIFTS.length * POINTS.length} (pose, shift, point) triples land on one pixel through the line matrix, the ray lane, at() and the pointer (worst NDC gap ${worst.toExponential(1)}), each the unshifted pixel moved by exactly (px·W/2, −py·H/2)`);

/* 4 · THE CLAMP: the pivot reaches the frame's edge and never leaves it. */
assert.deepEqual(clampShift([2, -3]), [1, -1]);
assert.deepEqual(clampShift([0.4, -0.3]), [0.4, -0.3]);
assert.deepEqual(clampShift([NaN, Infinity]), [0, 0]);
assert.deepEqual(clampShift(undefined), [0, 0]);
assert.deepEqual(clampShift(null), [0, 0]);
assert.ok(Object.is(clampShift([-0, 0])[0], 0), 'no negative zero');
const s0 = [0.2, 0.1]; assert.notEqual(clampShift(s0), s0, 'a fresh array: never the caller\'s');
pass('clampShift: each component in [−1, 1], a non-number reads 0, no −0, a fresh array');

/* ── THE CAMERA LAW (lab/camera-law.js), built here as rack.js builds it: the pose, present, modHand (C1: no dials — the panel reads the port) ── */
const BOOT = () => ({ yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6, mode: 'free', quat: quatFromYawPitch(0.65, 0.38), shift: [0, 0] });   // rack.js's boot pose
function law(pose, held = () => false) {
  const obs = pose, writes = [];
  const L = createCameraLaw({ obs, present() {}, modHand: (id, v) => { if (held(id)) { writes.push([id, v]); return true; } return false; }, resetWall() {} });
  return { obs, writes, ...L };
}
/** the point of the pivot plane under uv c: the pointer's ray met with the plane through the target ⟂ fwd (rack.js unproject, unclamped) */
function planeUnder(obs, c) {
  const S = toScreen(obs, HALF, W, H), d = S.ray((c[0] + 1) / 2 * W, (1 - c[1]) / 2 * H), e = S.eye, f = S.basis.fwd, lam = dot(sub(S.target, e), f) / dot(d, f);
  return [e[0] + lam * d[0], e[1] + lam * d[1], e[2] + lam * d[2]];
}
const pixelOf = (obs, X) => toScreen(obs, HALF, W, H).at(...X);

/* 5 · ZOOM TO THE CURSOR: p′ = c − (c − p)·k holds the pivot-plane point under the hand still — a wheel or pinch step (zoomAt,
   k = D/D′), a FOV step (setFov(v, c), k = tanH/tanH′), and the dials and keys about the frame's centre (setDist, setFov(v)). */
let drift = 0;
for (const pose of [BOOT(), { ...BOOT(), mode: 'turntable', yaw: -1.3, pitch: -0.7 }]) for (const c of [[-0.5, 0.6], [0.9, -0.85], [0, 0]]) {
  const L = law({ ...pose, shift: [0.4, -0.3] }), o = L.obs;
  for (const step of [() => L.zoomAt(c, o.dist * 0.8), () => L.zoomAt(c, o.dist * 1.25), () => L.setFov(o.fov * 1.3, c), () => L.setFov(o.fov * 0.7, c)]) {
    const X = planeUnder(o, c), before = pixelOf(o, X); step(); const after = pixelOf(o, X);
    drift = Math.max(drift, Math.hypot(after[0] - before[0], after[1] - before[1]));
    assert.ok(Math.hypot(after[0] - (c[0] + 1) / 2 * W, after[1] - (1 - c[1]) / 2 * H) < 1e-6, `the point under ${c} stays under it`);
  }
  assert.ok(Math.abs(o.shift[0]) <= 1 && Math.abs(o.shift[1]) <= 1);
}
{
  const L = law({ ...BOOT(), shift: [0.4, -0.3] }), o = L.obs, X = planeUnder(o, [0, 0]);
  L.setDist(2.2); L.setFov(0.9);
  const q = pixelOf(o, X); assert.ok(Math.hypot(q[0] - W / 2, q[1] - H / 2) < 1e-6, 'the dials and the keys anchor at the centre');
  assert.ok(Math.abs(o.shift[0] - 0.4 * (3.3 / 2.2) * (Math.tan(0.3) / Math.tan(0.45))) < 1e-12, 'p′ = p·k about the centre');
  const s = o.shift; L.zoomAt([0.5, 0.5], CAM.DIST[1] * 10); const s1 = o.shift; L.zoomAt([0.5, 0.5], CAM.DIST[1] * 10);
  assert.equal(o.shift, s1, 'a zoom held at the DIST limit (k = 1) leaves the shift alone'); assert.notEqual(s1, s);
  const d0 = o.dist, z = law({ ...BOOT(), shift: [0.4, -0.3] }, (id) => id === 'observer.dist'); z.zoomAt([0.5, 0.5], 2);
  assert.deepEqual(z.obs.shift, [0.4, -0.3], 'a modulated ZOOM moves its base, and the shift with the picture stays put'); assert.equal(d0, o.dist);
}
pass(`zoom to the cursor: the pivot-plane point under the hand stays on its pixel across wheel/pinch (zoomAt) and FOV steps at a non-zero shift, 2 poses × 3 cursors × 4 steps (worst ${drift.toExponential(1)} px — the gate's bound is 0.5); the dials and keys anchor at the centre (p′ = p·k); a zoom at the limit and a modulated ZOOM leave the shift alone`);

/* 6 · THE PAN LAW and SHIFT THEN RESET = IDENTITY (the pose's bytes). */
{
  const L = law(BOOT()), o = L.obs;
  L.panBy(0.05, 0); L.panBy(0, -0.05 * 0.25); assert.deepEqual(o.shift, [0.05, -0.0125]);
  assert.deepEqual(L.setShift(5, -5), [1, -1], 'the pivot reaches the frame\'s edge and never leaves it'); L.panBy(0.3, -0.3); assert.deepEqual(o.shift, [1, -1]);
  const held = law(BOOT(), (id) => id === 'observer.panx'); held.setShift(0.6, 0.2);
  assert.deepEqual(held.obs.shift, [0, 0.2], 'a modulated PAN X moves its base (modHand), the other axis moves'); assert.deepEqual(held.writes, [['observer.panx', 0.6]]);
  const boot = JSON.stringify(BOOT()), R = law(BOOT());
  R.setShift(0.4, -0.3); R.zoomAt([-0.2, 0.7], 2.1); R.setFov(1.0, [0.3, 0.3]); R.panBy(0.1, 0); R.orbitBy(0.4, -0.2); R.resetView();
  assert.equal(JSON.stringify(R.obs), boot, 'shift, zoom, FOV, pan and orbit, then RESET VIEW, is the boot pose byte for byte');
  assert.deepEqual(CAM.HOME.shift, [0, 0]); assert.ok(Object.isFrozen(CAM.HOME.shift), 'HOME\'s shift cannot be written through obs');
}
pass('the pan law: panBy adds in uv, setShift clamps at the frame\'s edge, a modulated PAN axis moves its base; shift then RESET VIEW = the boot pose, byte for byte (JSON)');

/* 7 · THE CAMERA PORT (0.5.0 A8): the object MIR 1.5's CAMERA panel takes.  Its ids read the law's numbers, `set` takes a hand's road
   (a routed axis moves its base), every pose change is a notice, and an id the law does not have reads undefined (the panel hides it). */
{
  const L = law(BOOT(), (id) => id === 'observer.yaw'), P = L.port, o = L.obs; let told = 0; const off = P.subscribe(() => told++);
  assert.deepEqual(['mode', 'zoom', 'fov', 'panX', 'panY', 'yaw', 'pitch', 'autoRotate', 'spin', 'friction', 'drag', 'fling'].map((id) => P.get(id)),
    ['free', 3.3, 0.6, 0, 0, 0.65, 0.38, false, 0.25, CAM.MU_DEF, CAM.GAIN_DEF, CAM.FLING_DEF], 'the law\'s own numbers, in its own units');
  assert.equal(P.get('roll'), undefined); assert.equal(P.get('wheel'), undefined); assert.equal(P.angle, 'rad');
  P.set('panX', 0.4); P.set('panY', -0.3); assert.deepEqual(o.shift, [0.4, -0.3], 'PAN X and PAN Y are the one setShift');
  P.set('zoom', 2.2); assert.equal(o.dist, 2.2); P.set('fov', 0.9); assert.equal(o.fov, 0.9);
  P.set('yaw', 1.5); assert.equal(o.yaw, 0.65, 'a routed YAW moves its base, not the pose'); assert.deepEqual(L.writes, [['observer.yaw', 1.5]]);
  const n = told; P.set('pitch', 0.1); assert.ok(Math.abs(o.pitch - 0.1) < 1e-12 && told > n, 'PITCH by the turn road, and told');
  P.set('mode', 'turntable'); P.set('drag', 2); P.set('friction', 3); P.set('fling', 0.5); P.set('spin', 0.5); P.set('autoRotate', true);
  assert.deepEqual([L.camera.dragGain, L.camera.friction, L.camera.flingGain, L.camera.speed, L.camera.autoRotate], [2, 3, 0.5, 0.5, true]);
  const m = told; L.cameraStep(0.016); assert.ok(told > m, 'a moving step is a notice'); L.camera.setAutoRotate(false); L.camera.stop();
  const q = told; assert.equal(L.cameraStep(0.016), false); assert.equal(told, q, 'a still camera tells nobody');
  P.home(); assert.deepEqual([o.dist, o.fov, o.shift], [3.3, 0.6, [0, 0]], 'HOME is RESET VIEW');
  off(); const r = told; P.set('zoom', 4); assert.equal(told, r, 'unsubscribed');
  assert.deepEqual(P.modIds, { yaw: 'observer.yaw', pitch: 'observer.pitch', zoom: 'observer.dist', fov: 'observer.fov', panX: 'observer.panx', panY: 'observer.pany' });
  assert.deepEqual([P.ranges.zoom.min, P.ranges.zoom.max, P.ranges.zoom.home, P.ranges.zoom.log, P.ranges.pitch.max, P.ranges.drag.log], [1.2, 8, 3.3, true, CAM.PITCH, false]);
  for (const k of ['setShift', 'zoomAt', 'panBy', 'turn', 'subscribe']) assert.equal(typeof P[k], 'function', k);
}
pass('the camera port: get reads the law\'s numbers (12 ids, radians), set takes the hand\'s road (a routed YAW moves its base), subscribe hears every pose change and a still camera tells nobody, HOME is RESET VIEW, modIds name the saved observer.* routes');

/* 8 · THE PORT AS THE KIT PANEL'S (0.5.0 C1): a dial is ONE axis — a hand on PAN Y never writes a routed PAN X's base (brief 2's
   acceptance); the feel setters are notices (the panel has no dial the law could move); `notify` is the modulation's door; PAN HOME
   is the port's verb and centres the pivot alone; the PAN readout is the shift in NDC; SPIN's range is CAM's, once. */
{
  const L = law(BOOT(), (id) => id === 'observer.panx'), P = L.port, o = L.obs; let told = 0; P.subscribe(() => told++);
  P.set('panY', 0.3); assert.deepEqual(o.shift, [0, 0.3], 'PAN Y moves y'); assert.deepEqual(L.writes, [], 'and never writes the routed PAN X\'s base');
  P.set('panX', 0.7); assert.deepEqual(L.writes, [['observer.panx', 0.7]], 'a hand on the routed PAN X writes its base'); assert.deepEqual(o.shift, [0, 0.3]);
  const both = law(BOOT(), (id) => id === 'observer.panx'); both.setShift(0.2, 0.1); assert.deepEqual(both.writes, [['observer.panx', 0.2]], 'setShift(x, y), a two-axis hand, still moves both');
  for (const [id, v] of [['drag', 2], ['fling', 0.5]]) { const n = told; P.set(id, v); assert.ok(told > n, id + ' is a notice'); }
  const n = told; P.notify(); assert.equal(told, n + 1, 'notify tells every subscriber');
  P.setShift(0.4, -0.2); P.zoomAt([0, 0], 2.5); const [verb] = P.verbs; assert.equal(verb.label, 'PAN HOME'); verb.run();
  assert.deepEqual([o.shift, o.dist], [[0, 0], 2.5], 'PAN HOME centres the shift and nothing else (the routed X\'s pose is the modulation\'s)');
  assert.deepEqual([P.ranges.panX.fmt(0.25), P.ranges.panY.fmt(-0.5), P.ranges.panX.fmt(0)], ['+0.25', '-0.50', '0.00']);
  assert.deepEqual([P.ranges.spin.min, P.ranges.spin.max, P.ranges.spin.home, L.camera.speed], [...CAM.SPIN, CAM.SPIN_DEF, CAM.SPIN_DEF]);
}
pass('the port as the kit panel\'s: a dial is one axis (a routed PAN X keeps its base under a hand on PAN Y), the feel setters and notify are notices, PAN HOME is the port\'s verb, PAN reads NDC, SPIN\'s range is CAM\'s');

/* 9 · THE LOCK (0.5.3 M6, R3: the classic camera holds the PAN only).  Engaged, the shift goes to 0 raw (a routed axis's base is
   not written), and every road that moves the shift answers with a notice and moves nothing: setShift, panBy (Alt-drag, two fingers,
   Alt+Arrows), PAN X / PAN Y / PAN HOME on the port, and the anchors of zoomAt (the wheel at the cursor, the pinch at the centroid)
   and setFov — so every zoom is from the centre.  ZOOM, FOV, the mode and the turn stay live; released, the pan answers again. */
{
  const L = law(BOOT(), (id) => id === 'observer.panx'), P = L.port, o = L.obs; let told = 0; P.subscribe(() => told++);
  assert.equal(L.camera.lock, false); assert.equal(P.get('lock'), false, 'off by default');
  o.shift = [0.4, -0.3];   /* a project's shift, or a route's output */
  P.set('lock', true); assert.deepEqual([L.camera.lock, P.get('lock'), o.shift], [true, true, [0, 0]], 'engaged: the pivot goes home');
  assert.deepEqual(L.writes, [], 'raw: the routed PAN X keeps its base');
  const n = told; L.setShift(0.5, 0.5); L.panBy(0.1, -0.1); P.set('panX', 0.7); P.set('panY', -0.2); P.verbs[0].run();
  assert.deepEqual(o.shift, [0, 0], 'setShift, panBy and the PAN dials move nothing'); assert.deepEqual(L.writes, [], 'and write no base'); assert.ok(told >= n + 5, 'each answers with a notice (the PAN pad springs back)');
  L.zoomAt([0.6, -0.4], 2.0); assert.deepEqual([o.shift, o.dist], [[0, 0], 2.0], 'the wheel at a cursor: the zoom is from the centre');
  L.setFov(0.9, [-0.5, 0.5]); assert.deepEqual([o.shift, o.fov], [[0, 0], 0.9], 'an anchored FOV step: from the centre');
  /* the dolly zoom (Ctrl+Shift+Q/E, shell/keys.js): setDist then setFov with d·tan(fov/2) held */
  const inv = o.dist * Math.tan(o.fov / 2); L.setDist(o.dist * 1.1); L.setFov(2 * Math.atan(inv / o.dist));
  assert.deepEqual(o.shift, [0, 0], 'the dolly zoom keeps the shift at 0'); assert.ok(Math.abs(o.dist * Math.tan(o.fov / 2) - inv) < 1e-12, 'and the size');
  L.setCamMode('turntable', { now: true }); const y0 = o.yaw; P.turn(0.3, 0); assert.ok(Math.abs(o.yaw - y0 - 0.3) < 1e-9, 'the turn stays live');
  P.set('mode', 'free'); assert.equal(o.mode, 'free', 'the mode stays live'); assert.deepEqual(o.shift, [0, 0]);
  L.resetView(); assert.deepEqual(o.shift, [0, 0]); assert.equal(L.camera.lock, true, 'RESET VIEW is a pose, not the lock');
  L.camera.setLock(false); L.setShift(0.25, 0.1); assert.deepEqual(o.shift, [0, 0.1], 'released: the pan answers again (the routed X writes its base, Y moves)');
  assert.deepEqual(L.writes, [['observer.panx', 0.25]]);
  const free = law(BOOT()); free.setShift(0.4, -0.3); free.zoomAt([0.6, -0.4], 2.0); assert.notDeepEqual(free.obs.shift, [0.4, -0.3], 'unlocked, the wheel still zooms at the cursor');
}
pass('the LOCK (0.5.3 M6): engaged it centres the pivot raw (a routed base untouched); setShift, panBy, PAN X / Y and PAN HOME move nothing and say so; the wheel, an anchored FOV and the dolly zoom are from the centre; the turn, ZOOM, FOV and the mode stay live; released, the pan answers');
