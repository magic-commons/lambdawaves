/* tests/camera-shift.test.mjs — THE LENS SHIFT's maths (0.4.0 S2, research/release-0.4.0/BRIEF-S2-CAMERA.md §1), node only.
 *   node tests/camera-shift.test.mjs
 * obs.shift = [px, py] is where the pivot appears on the frame (NDC, +y up).  The law: the on-axis picture translated by p.
 * Judged here over the shipped helpers — cameraEye, toScreen (at and its inverse ray, the pointer's), lensShift (writeView's
 * lane and principal point), perspective and lookAt (lab/field.js) and the camera law (lab/camera-law.js).  The GPU half — one
 * FRAME corner on one pixel through the line pass, the ray pass and the pointer — is tests/camera-shift.browser-test.mjs. */
import assert from 'node:assert/strict';
import { cameraEye, toScreen, lensShift, perspective, lookAt, quatFromYawPitch } from '../lab/field.js';
import { clampShift } from '../lab/camera-law.js';

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
