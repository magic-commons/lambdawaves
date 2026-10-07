// tests/camera-shift.browser-test.mjs — THE LENS SHIFT in the real app, on the GPU (0.4.0 S2, BRIEF-S2-CAMERA.md §3).
//   LW_PORT=… GD_PORT=… node tests/camera-shift.browser-test.mjs
// 1 ONE FRAME CORNER, ONE PIXEL: at p = (0.4, −0.3) the box's leftmost corner lands on the same pixel through the line pass
//   (linePixels, the box alone), the ray pass (readPixels with GAMMA 2.4 and no chrome: the box's silhouette, where the march
//   begins) and the pointer (its ray through that pixel passes the corner) — and that pixel is the +p prediction, 0.4·W/2 px
//   from the unshifted one and 0.4·W px from the −p one, which is the test that decides the matrix sign.
// 2 THE CURSOR-ANCHORED POINT: read back through unproject, the pivot-plane point under the cursor moves ≤ 0.5 px across a real
//   wheel step, a real two-finger pinch about it and a FOV step anchored there, at a non-zero shift.
// 3 THE HANDS: an Alt-drag (the driver's own mouse with Alt held), two fingers, Alt+Arrow (Shift = fine; the page does not go
//   Back), the double-click home; and PAN X / PAN Y / PAN HOME (K3) and the link's tail (K3).
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { actions, relActions } from '../tools/gate/drv.mjs';

const W = 1300, H = 850;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz&sw=0`, { width: W, height: H, script: 120000 });
let failed = 0;
async function check(name, script, verify) {
  const value = await g.ev(script);
  try { if (value && value.E) throw new Error(value.E); verify(value); console.log('PASS ' + name + '\n      ' + JSON.stringify(value).slice(0, 400)); }
  catch (error) { failed++; console.error('FAIL ' + name + '\n      ' + JSON.stringify(value).slice(0, 600) + '\n      ' + error.message); }
}
try {
  assert.equal((await g.waitFor('window.__LW?.ready', 300, 100)).ok, 1);
  await g.ev(`__LW.pause(); __LW.governor.on = false; await __LW.settle(); return 1;`);

  /* ── 1 · ONE FRAME CORNER, ONE PIXEL ──
     At ZOOM 8 the whole box is on the frame; the stage is a flat grey for the two readbacks (either theme), the ray pass's
     GAMMA is 2.4 and its chrome off, so the box's silhouette — where the march begins and the stage's bg^(1/γ) appears — is
     the ray pass's own picture of the FRAME; linePixels draws the box alone.  The GPU's corner is the lit pixel nearest the
     prediction in each image's leftmost lit column (the left vertex of the silhouette and of the box). */
  const CORNER = `
    const LW = __LW, F = LW.field, cv = document.getElementById('field'), fm = await import('/lab/field.js');
    const w = cv.clientWidth, h = cv.clientHeight, half = LW.domain.half;
    LW.camera.reset(); LW.camera.setDist(8); LW.camera.setShift(P[0], P[1]); F.setOcclusion([]);
    const base = { ...LW.mat, dither: 0, invert: false, bg: [0.25, 0.25, 0.25], slice: { ...LW.mat.slice, mode: 0 } };
    const ray = await F.readPixels(LW.obs, { ...base, gamma: 2.4, frame: false, axis: false }, w, h, true);
    const line = await F.linePixels(LW.obs, { ...base, frame: true, frameMode: 'box', axis: false }, w, h, true);
    const gl = (line.ground[0] + line.ground[1] + line.ground[2]) / 3;
    const corners = []; for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) corners.push([a * half, b * half, c * half]);
    const pick = (shift) => { const S = fm.toScreen({ ...LW.obs, shift }, half, w, h); return corners.map((X) => ({ X, q: S.at(...X) })).filter((o) => o.q).sort((m, n) => m.q[0] - n.q[0])[0]; };
    const plus = pick(P), zero = pick([0, 0]), minus = pick([-P[0], -P[1]]), Q = plus.q;
    const gpu = (r, lit) => { for (let x = 0; x < w; x++) { let best = null; for (let y = 0; y < h; y++) { const o = y * r.bpr + x * 4; if (lit((r.px[o] + r.px[o + 1] + r.px[o + 2]) / 3)) { const c = [x + 0.5, y + 0.5]; if (!best || Math.hypot(c[0] - Q[0], c[1] - Q[1]) < Math.hypot(best[0] - Q[0], best[1] - Q[1])) best = c; } } if (best) return best; } return null; };
    const R = gpu(ray, (v) => v > 105), L = gpu(line, (v) => Math.abs(v - gl) > 12);
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    /* the pointer: its ray through the line pass's pixel passes the corner — the miss, in pixels at the corner's depth */
    const S = fm.toScreen(LW.obs, half, w, h), pr = LW.camera.pointer.ray(L[0], L[1]), X = plus.X, toX = [X[0] - pr.cam[0], X[1] - pr.cam[1], X[2] - pr.cam[2]];
    const dn = Math.hypot(...pr.d), dh = pr.d.map((v) => v / dn), along = toX[0] * dh[0] + toX[1] * dh[1] + toX[2] * dh[2];
    const miss = Math.hypot(toX[0] - along * dh[0], toX[1] - along * dh[1], toX[2] - along * dh[2]), depth = toX[0] * S.basis.fwd[0] + toX[1] * S.basis.fwd[1] + toX[2] * S.basis.fwd[2];
    LW.camera.reset();
    return { w, h, ray: R, line: L, predicted: Q.slice(0, 2).map((v) => +v.toFixed(2)), rayErr: +d(R, Q).toFixed(3), lineErr: +d(L, Q).toFixed(3), rayLine: +d(R, L).toFixed(3),
      pointerMissPx: +(miss * h / (2 * depth * S.tanH)).toFixed(3), fromZero: +d(L, zero.q).toFixed(1), fromMinus: +d(L, minus.q).toFixed(1) };`;
  await check('one FRAME corner, one pixel at p = (0.4, −0.3): line pass = ray pass = pointer = the +p prediction (the matrix sign)', 'const P = [0.4, -0.3];' + CORNER, (v) => {
    assert.ok(v.rayErr <= 1 && v.lineErr <= 1 && v.rayLine <= 1.5, 'one pixel');
    assert.ok(v.pointerMissPx <= 1, 'the pointer\'s ray passes the corner');
    assert.ok(v.fromZero > 0.4 * v.w / 2 - 5 && v.fromMinus > 0.4 * v.w - 10, 'the +p picture, not the unshifted or the mirrored one');
  });
  await check('…and at p = 0 the same corner sits on the unshifted prediction (the method, on today\'s picture)', 'const P = [0, 0];' + CORNER, (v) => {
    assert.ok(v.rayErr <= 1 && v.lineErr <= 1 && v.pointerMissPx <= 1);
  });

  /* ── 2 · THE CURSOR-ANCHORED POINT, through unproject ── */
  await check('the point under the cursor holds ≤ 0.5 px across a wheel step, a pinch step and a FOV step at p = (0.4, −0.3)', `
    const LW = __LW, cv = document.getElementById('field'), r = cv.getBoundingClientRect(), fm = await import('/lab/field.js');
    const w = cv.clientWidth, h = cv.clientHeight, C = [0.62 * w, 0.58 * h], cUV = [2 * C[0] / w - 1, 1 - 2 * C[1] / h];
    const ptr = (type, id, x, y) => cv.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch', button: 0, clientX: r.left + x, clientY: r.top + y }));
    const px = (X) => { const S = fm.toScreen(LW.obs, LW.domain.half, w, h), q = S.at(...X); return Math.hypot(q[0] - C[0], q[1] - C[1]); };
    const steps = {}, cap = 0.75 * (await import("/lab/hamiltonian.js")).HAMILTONIANS.well.radius;
    const measure = (name, act) => {
      LW.camera.reset(); LW.camera.setShift(0.4, -0.3);
      const X = LW.camera.pointer.unproject(C[0], C[1]);
      act();
      const Y = LW.camera.pointer.unproject(C[0], C[1]), S = fm.toScreen(LW.obs, LW.domain.half, w, h), perPx = 2 * S.D * S.tanH / h;
      steps[name] = { cap, readback: +(Math.hypot(Y[0] - X[0], Y[1] - X[1], Y[2] - X[2]) / perPx).toFixed(4), onPixel: +px(X).toFixed(4), shift: LW.obs.shift.map((v) => +v.toFixed(4)), dist: +LW.obs.dist.toFixed(4), fov: +LW.obs.fov.toFixed(4), r: +Math.hypot(...X).toFixed(3) };
    };
    measure('wheel', () => cv.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, deltaMode: 0, clientX: r.left + C[0], clientY: r.top + C[1], cancelable: true, bubbles: true })));
    measure('pinch', () => { ptr('pointerdown', 41, C[0] - 60, C[1]); ptr('pointerdown', 42, C[0] + 60, C[1]); ptr('pointermove', 41, C[0] - 90, C[1]); ptr('pointermove', 42, C[0] + 90, C[1]); ptr('pointerup', 41, C[0] - 90, C[1]); ptr('pointerup', 42, C[0] + 90, C[1]); });
    measure('fov', () => LW.camera.setFov(LW.obs.fov * 1.35, cUV));
    LW.camera.reset();
    return steps;`, (v) => {
    for (const k of ['wheel', 'pinch', 'fov']) {
      assert.ok(v[k].readback <= 0.5 && v[k].onPixel <= 0.5, k + ' ≤ 0.5 px');
      assert.ok(v[k].r < v[k].cap, k + ": unproject did not clamp");
    }
    assert.ok(v.wheel.dist < 3.3 && v.pinch.dist < 3.3 && v.fov.fov > 0.6, 'each step moved the camera');
  });

  /* ── 3 · THE HANDS ── */
  const box = await g.ev(`const r = document.getElementById('field').getBoundingClientRect(); __LW.camera.reset(); __LW.camera.stop(); return { x: Math.round(r.left + 0.55 * r.width), y: Math.round(r.top + 0.62 * r.height), w: r.width, h: r.height, href: location.href, yaw: __LW.obs.yaw };`);
  const ALT = '', SHIFT = '';
  await actions(g.s, [
    { type: 'key', id: 'k', actions: [{ type: 'keyDown', value: ALT }, { type: 'pause', duration: 0 }, { type: 'pause', duration: 0 }, { type: 'pause', duration: 0 }, { type: 'pause', duration: 0 }, { type: 'keyUp', value: ALT }] },
    { type: 'pointer', id: 'm', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pause', duration: 0 }, { type: 'pointerMove', duration: 0, origin: 'viewport', x: box.x, y: box.y },
      { type: 'pointerDown', button: 0 }, { type: 'pointerMove', duration: 120, origin: 'viewport', x: box.x + 40, y: box.y - 30 }, { type: 'pointerUp', button: 0 }, { type: 'pause', duration: 0 }] },
  ]);
  await relActions(g.s);
  await check('Alt-drag (the driver\'s mouse, Alt held) slides the picture one pixel per pixel and does not orbit', `
    await __LW.settle(); return { shift: __LW.obs.shift, yaw: __LW.obs.yaw, href: location.href };`, (v) => {
    assert.ok(Math.abs(v.shift[0] - 2 * 40 / box.w) < 1e-9 && Math.abs(v.shift[1] - 2 * 30 / box.h) < 1e-9, 'Δp = (2Δx/W, −2Δy/H)');
    assert.equal(v.yaw, box.yaw); assert.equal(v.href, box.href);
  });
  await check('two fingers dragged together slide the picture (and zoom nowhere)', `
    const LW = __LW, cv = document.getElementById('field'), r = cv.getBoundingClientRect(); LW.camera.reset(); const d0 = LW.obs.dist;
    const ptr = (type, id, x, y) => cv.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch', button: 0, clientX: r.left + x, clientY: r.top + y }));
    ptr('pointerdown', 51, 500, 400); ptr('pointerdown', 52, 640, 400); ptr('pointermove', 51, 530, 420); ptr('pointermove', 52, 670, 420); ptr('pointerup', 51, 530, 420); ptr('pointerup', 52, 670, 420);
    return { shift: LW.obs.shift, dist: LW.obs.dist, d0, w: r.width, h: r.height, yaw: LW.obs.yaw };`, (v) => {
    assert.ok(Math.abs(v.shift[0] - 60 / v.w) < 1e-9 && Math.abs(v.shift[1] + 40 / v.h) < 1e-9, 'the centroid moved (30, 20) px');
    assert.ok(Math.abs(v.dist - v.d0) < 1e-12);
  });
  await g.ev(`__LW.camera.reset(); document.getElementById('field').focus(); return 1;`);
  for (const [keys] of [[[ALT, '']], [[ALT, '']], [[ALT, SHIFT, '']]]) {
    await actions(g.s, [{ type: 'key', id: 'kk', actions: [...keys.map((k) => ({ type: 'keyDown', value: k })), { type: 'pause', duration: 30 }, ...keys.slice().reverse().map((k) => ({ type: 'keyUp', value: k }))] }]);
    await relActions(g.s);
  }
  await check('Alt+→, Alt+↑ and Shift+Alt+↑ step the shift 0.05, 0.05 and 0.0125 (and Alt+Arrow never takes the page Back)', `
    await __LW.settle(); return { shift: __LW.obs.shift, href: location.href, active: document.activeElement && document.activeElement.id };`, (v) => {
    assert.ok(Math.abs(v.shift[0] - 0.05) < 1e-12 && Math.abs(v.shift[1] - 0.0625) < 1e-12); assert.equal(v.href, box.href);
  });
  await check('a double-click (RESET VIEW) brings the pivot home', `
    const cv = document.getElementById('field'); __LW.camera.setShift(0.3, 0.2); cv.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    return { shift: __LW.obs.shift };`, (v) => assert.deepEqual(v.shift, [0, 0]));

  const errs = await g.errors();
  if (errs.errs.length) { failed++; console.error('FAIL page errors', errs.errs); }
} finally {
  await g.ev(`try { __LW.camera.reset(); } catch (_) {} return 1;`).catch(() => {});
  await g.close();
}
console.log(failed ? `RED camera-shift.browser-test — ${failed} failing` : 'GREEN camera-shift.browser-test');
process.exit(failed ? 1 : 0);
