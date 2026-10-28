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
    F.setOcclusion([]);   /* S2-VERIFY S1: a frame between the two readbacks puts the racks' mask back; clear it again just before the line pass */
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
  await check('…and at p = (−0.35, 0.3) — the corner over the LEFT rack — line pass = ray pass = pointer (S2-VERIFY S1: the mask, not the engine, once read 207 px here)', 'const P = [-0.35, 0.3];' + CORNER, (v) => {
    assert.ok(v.rayErr <= 1 && v.lineErr <= 1 && v.pointerMissPx <= 1, 'one pixel over the rack');
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
  await g.ev(`__LW.camera.reset(); document.getElementById('field').focus(); window.__altArrow = []; window.addEventListener('keydown', (e) => { if (e.altKey && e.key.startsWith('Arrow')) window.__altArrow.push(e.defaultPrevented); }); return 1;`);
  for (const [keys] of [[[ALT, '']], [[ALT, '']], [[ALT, SHIFT, '']]]) {
    await actions(g.s, [{ type: 'key', id: 'kk', actions: [...keys.map((k) => ({ type: 'keyDown', value: k })), { type: 'pause', duration: 30 }, ...keys.slice().reverse().map((k) => ({ type: 'keyUp', value: k }))] }]);
    await relActions(g.s);
  }
  await check('Alt+→, Alt+↑ and Shift+Alt+↑ step the shift 0.05, 0.05 and 0.0125 (and every Alt+Arrow keydown is defaultPrevented — the driver cannot reach Firefox\'s Back, so the href check was vacuous; S2-VERIFY N1)', `
    await __LW.settle(); return { shift: __LW.obs.shift, href: location.href, altArrow: window.__altArrow, active: document.activeElement && document.activeElement.id };`, (v) => {
    assert.ok(Math.abs(v.shift[0] - 0.05) < 1e-12 && Math.abs(v.shift[1] - 0.0625) < 1e-12); assert.equal(v.href, box.href);
    assert.equal(v.altArrow.length, 3, 'three Alt+Arrow keydowns were seen'); assert.ok(v.altArrow.every((x) => x === true), 'each one defaultPrevented');
  });
  await check('a double-click (RESET VIEW) brings the pivot home', `
    const cv = document.getElementById('field'), b = cv.getBoundingClientRect(); __LW.camera.setShift(0.3, 0.2); cv.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 }));   // 0.5.0 C3/C9: a double-click at the canvas ORIGIN now falls in the rack column's UI space and the scene guard keeps it; a real double-click lands on the open stage
    return { shift: __LW.obs.shift };`, (v) => assert.deepEqual(v.shift, [0, 0]));

  /* ── 4 · THE PANEL, THE SCOPE, THE LINK (K3) ── */
  await check('CAMERA\'s PAN X / PAN Y follow every hand and drive the shift; PAN HOME centres it; neither is a history row', `
    const LW = __LW, kx = document.querySelector('[data-param="observer.panx"]'), ky = document.querySelector('[data-param="observer.pany"]');
    const home = [...document.querySelectorAll('.dev[data-id="camera"] :is(button, [role="button"])')].find((b) => /PAN HOME/.test(b.textContent));   /* 022 E0: CAMERA's own verb (MAPPING's rows read PAN HOME too since 022 H1) */
    LW.camera.reset(); const cursor = LW.history.cursor;
    LW.camera.setShift(0.25, -0.5); await new Promise((r) => setTimeout(r, 120));   /* C1: the kit panel reads the port on the frame after the notice */
    const shown = [kx.querySelector('.k-val').textContent, ky.querySelector('.k-val').textContent];
    kx.focus(); kx.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true, cancelable: true }));
    const afterKey = LW.obs.shift.slice(); home.click(); await new Promise((r) => setTimeout(r, 500));
    return { shown, afterKey, homed: LW.obs.shift, registry: LW.mod.registry ? [LW.mod.registry.has('observer.panx'), LW.mod.registry.has('observer.pany')] : null, rows: LW.history.cursor - cursor };`, (v) => {
    assert.deepEqual(v.shown, ['+0.25', '-0.50']); assert.ok(v.afterKey[0] > 0.25 && v.afterKey[1] === -0.5, 'the PAN X dial moves x alone');
    assert.deepEqual(v.homed, [0, 0]); assert.equal(v.rows, 0, 'a view is not an edit');
  });
  /* 0.5.3 M5 · THE SPHERE RINGS ANSWER LIVE: dragged from the rack, the sphere's arrow and its YAW · PITCH arcs follow every move
     BEFORE the release (the kit's port.turn road never set them and its sync skips a sphere mid-drag: they froze until a later
     notice, and each step turned from the stale arrow), and the stage presents on each move */
  await check('the SPHERE answers live (0.5.3 M5): its arrow, the YAW · PITCH arcs, the pose and the stage move on every step before the release', `
    const LW = __LW, S = document.querySelector('.dev[data-id="camera"]'); S.classList.remove('closed'); if (S.classList.contains('folded')) S.querySelector('.dev-fold').click();
    LW.camera.reset(); LW.camera.stop(); const svg = document.querySelector('.mir-camsphere svg.cs-svg'); svg.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 300)); await LW.settle();
    const tip = () => { const t = svg.querySelector('.cs-tip'); return t.getAttribute('cx') + ',' + t.getAttribute('cy'); }, arc = (id) => document.querySelector('[data-param="' + id + '"] .k-val').textContent;
    const b = svg.querySelector('.cs-tip').getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
    const ptr = (type, dx, dy) => svg.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 61, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x + dx, clientY: y + dy }));
    const read = () => ({ tip: tip(), yaw: arc('observer.yaw'), pitch: arc('observer.pitch'), p: LW.stats.presents, frames: LW.stats.frames, skipped: LW.stats.skipped, pose: [LW.obs.yaw, LW.obs.pitch] });
    const s0 = read(), held = []; ptr('pointerdown', 0, 0);
    for (let i = 1; i <= 3; i++) { const p0 = LW.stats.presents; ptr('pointermove', -6 * i, -4 * i); for (let k = 0; k < 60 && LW.stats.presents === p0; k++) await new Promise((r) => setTimeout(r, 20)); held.push(read()); }   /* a present within 1.2 s, the button still down */
    ptr('pointerup', -18, -12); LW.camera.reset();
    return { s0, held };`, (v) => {
    for (let i = 0; i < 3; i++) { const p = i ? v.held[i - 1] : v.s0, s = v.held[i];
      assert.notEqual(s.tip, p.tip, 'the arrow moved on step ' + (i + 1)); assert.notDeepEqual(s.pose, p.pose, 'the pose moved on step ' + (i + 1)); assert.ok(s.p > p.p, 'the stage presented on step ' + (i + 1)); }
    assert.ok(v.held.some((s) => s.yaw !== v.s0.yaw) && v.held.some((s) => s.pitch !== v.s0.pitch), 'the YAW and PITCH arcs followed before the release');
  });
  await check('a project carries the shift, and an older project without one opens centred', `
    const LW = __LW; LW.camera.reset(); LW.camera.setShift(0.3, 0.2); const S = LW.serialize(), saved = S.presentation.obs.shift.slice();
    LW.camera.setShift(-0.7, 0.1); LW.restore(JSON.parse(JSON.stringify(S))); const back = LW.obs.shift.slice();
    const older = JSON.parse(JSON.stringify(S)); delete older.presentation.obs.shift; LW.camera.setShift(0.5, 0.5); LW.restore(older);
    const res = { saved, back, older: LW.obs.shift.slice() }; LW.camera.reset(); return res;`, (v) => {
    assert.deepEqual(v.saved, [0.3, 0.2]); assert.deepEqual(v.back, [0.3, 0.2]); assert.deepEqual(v.older, [0, 0]);
  });
  await check('THE LINK CARRIES THE SHOT: "1b₁ of water, framed in the gap" is one link — the shift, the molecule, and the orbital by its name (which wins over the index)', `
    const LW = __LW, sl = await import('/lab/statelink.js');
    await LW.chem.solve('H2O'); LW.chem.setOn(true); LW.chem.setView('orbital'); LW.chem.orbital(5); await LW.settle();
    LW.camera.reset(); LW.camera.setShift(0.4, -0.3);
    const key = LW.chem.orbitalKey(), m = LW.link.mint();
    /* the same shot with a WRONG index: the name must win */
    const S = LW.serialize(); S.presentation.instruments.chem.orbital = 3; const forged = sl.linkFor(S, { orbitalKey: key }).href;
    const land = async (href) => { LW.camera.reset(); await LW.chem.solve('NH3'); LW.chem.orbital(2); LW.chem.setOn(false); await LW.settle();
      const r = LW.link.open(href); await LW.chem.prepare(); await LW.settle(); await new Promise((q) => setTimeout(q, 300));
      return { ok: r.ok, warnings: r.warnings, shift: LW.obs.shift.map((v) => +v.toFixed(6)), on: LW.chem.on, preset: LW.chem.save().preset, view: LW.chem.save().view, orbital: LW.chem.orbital(), key: LW.chem.orbitalKey() }; };
    const a = await land(m.href), b = await land(forged);
    LW.camera.reset(); LW.chem.setOn(false); await LW.settle();
    return { key, chars: m.chars, a, b };`, (v) => {
    assert.ok(v.key && v.key.group === 'C2v', 'water is named');
    for (const r of [v.a, v.b]) {
      assert.ok(r.ok && r.on && r.preset === 'H2O' && r.view === 'orbital'); assert.deepEqual(r.shift, [0.4, -0.3]);
      assert.equal(r.orbital, 5, 'the orbital by its name'); assert.deepEqual(r.key, v.key);
    }
  });

  /* ── 5 · 0.5.3 M6 THE LOCK, the classic camera (R3: the pan only) — the switch, then every pan road with the real inputs ── */
  const LOCKSW = `const card = document.querySelector('.dev[data-id="camera"]'); card.classList.remove('closed'); if (card.classList.contains('folded')) card.querySelector('.dev-fold').click();
    const sw = [...card.querySelectorAll('button.sw')].find((b) => b.textContent.trim() === 'LOCK'), pad = card.querySelector('.mir-camera .mir-xy');`;
  await check('THE LOCK (0.5.3 M6): a LOCK switch among the CAMERA verbs (SET Δρ REF left with the WAVE Δρ at iteration 008); pressed, it centres the pivot, rests the PAN pad, is saved as the PREFERENCE camLock and is no history row', `
    const LW = __LW; ${LOCKSW}
    LW.camera.reset(); LW.camera.setShift(0.3, -0.2); await new Promise((r) => setTimeout(r, 150)); LW.history.flush(); const cursor = LW.history.cursor; sw.scrollIntoView({ block: 'center' });   /* the LINK check's edits are flushed first */
    sw.click(); await new Promise((r) => setTimeout(r, 150)); LW.history.flush();
    return { lock: LW.camera.lock, port: LW.camera.lock, shift: LW.obs.shift.slice(), pressed: sw.getAttribute('aria-pressed'), padOff: pad.classList.contains('disabled'), sameRow: !!sw.closest('.cam-verbs'),
      saved: LW.settings.camLock, rows: LW.history.cursor - cursor, inProject: 'camLock' in LW.serialize().presentation.camera };`, (v) => {
    assert.deepEqual([v.lock, v.pressed, v.padOff, v.sameRow, v.saved], [true, 'true', true, true, true]); assert.deepEqual(v.shift, [0, 0], 'engaged: PAN HOME');
    assert.equal(v.rows, 0, 'a PREFERENCE is not an edit'); assert.equal(v.inProject, false, 'never in a project');
  });
  const CTRL = '', RIGHT = '';
  await g.ev(`__LW.camera.reset(); window.__d0 = [__LW.obs.dist, __LW.obs.fov]; document.getElementById('field').focus(); return 1;`);
  await actions(g.s, [
    { type: 'key', id: 'lk', actions: [{ type: 'keyDown', value: ALT }, { type: 'pause', duration: 0 }, { type: 'pause', duration: 0 }, { type: 'pause', duration: 0 }, { type: 'pause', duration: 0 }, { type: 'keyUp', value: ALT }] },
    { type: 'pointer', id: 'lm', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pause', duration: 0 }, { type: 'pointerMove', duration: 0, origin: 'viewport', x: box.x, y: box.y },
      { type: 'pointerDown', button: 0 }, { type: 'pointerMove', duration: 120, origin: 'viewport', x: box.x + 40, y: box.y - 30 }, { type: 'pointerUp', button: 0 }, { type: 'pause', duration: 0 }] },
  ]);
  await relActions(g.s);
  await g.ev(`document.getElementById('field').focus(); return 1;`);
  for (const keys of [[ALT, RIGHT], [CTRL, SHIFT, 'q'], [CTRL, SHIFT, 'q']]) {
    await actions(g.s, [{ type: 'key', id: 'lkk', actions: [...keys.map((k) => ({ type: 'keyDown', value: k })), { type: 'pause', duration: 30 }, ...keys.slice().reverse().map((k) => ({ type: 'keyUp', value: k }))] }]);
    await relActions(g.s);
  }
  await check('under the LOCK the real Alt-drag and Alt+→ slide nothing, and Ctrl+Shift+Q twice (the dolly zoom) keeps the shift at 0 and the size', `
    await __LW.settle(); const o = __LW.obs; return { shift: o.shift.slice(), dist: o.dist, fov: o.fov, d0: window.__d0, yaw: o.yaw, inv: [o.dist * Math.tan(o.fov / 2), window.__d0[0] * Math.tan(window.__d0[1] / 2)] };`, (v) => {
    assert.deepEqual(v.shift, [0, 0]); assert.equal(v.yaw, box.yaw, 'the Alt-drag did not orbit');
    assert.ok(v.dist < v.d0[0] && v.fov > v.d0[1], 'the dolly zoom ran'); assert.ok(Math.abs(v.inv[0] - v.inv[1]) < 1e-9, 'd·tan(fov/2) held');
  });
  await check('under the LOCK a wheel at a cursor, a two-finger pinch about an off-centre point, an anchored FOV step, the PAN X dial and a route on observer.panx all leave the pivot centred, while the zoom answers from the centre', `
    const LW = __LW, cv = document.getElementById('field'), r = cv.getBoundingClientRect(), R = LW.mod.registry, C = [0.62 * r.width, 0.58 * r.height], out = {};
    const ptr = (type, id, x, y) => cv.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch', button: 0, clientX: r.left + x, clientY: r.top + y }));
    LW.camera.reset(); const d0 = LW.obs.dist;
    cv.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, deltaMode: 0, clientX: r.left + C[0], clientY: r.top + C[1], cancelable: true, bubbles: true })); out.wheel = [LW.obs.shift.slice(), LW.obs.dist < d0];
    const d1 = LW.obs.dist; ptr('pointerdown', 71, C[0] - 60, C[1]); ptr('pointerdown', 72, C[0] + 60, C[1]); ptr('pointermove', 71, C[0] - 90, C[1] + 20); ptr('pointermove', 72, C[0] + 90, C[1] + 20); ptr('pointerup', 71, C[0] - 90, C[1] + 20); ptr('pointerup', 72, C[0] + 90, C[1] + 20);
    out.pinch = [LW.obs.shift.slice(), LW.obs.dist < d1]; LW.camera.setFov(LW.obs.fov * 1.3, [0.5, -0.5]); out.fov = LW.obs.shift.slice();
    const kx = document.querySelector('[data-param="observer.panx"]'); kx.focus(); kx.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true, cancelable: true })); kx.blur(); out.dial = LW.obs.shift.slice();
    R.applyModulated('observer.panx', 0.5); R.applyModulated('observer.pany', -0.5); out.route = LW.obs.shift.slice(); R.restoreBase('observer.panx'); R.restoreBase('observer.pany');
    ${LOCKSW} sw.click(); await new Promise((q) => setTimeout(q, 100)); out.released = [LW.camera.lock, pad.classList.contains('disabled'), LW.settings.camLock];
    R.applyModulated('observer.panx', 0.5); out.routeFree = LW.obs.shift.slice(); R.restoreBase('observer.panx'); LW.camera.reset();
    cv.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, deltaMode: 0, clientX: r.left + C[0], clientY: r.top + C[1], cancelable: true, bubbles: true })); out.wheelFree = LW.obs.shift.slice(); LW.camera.reset();
    return out;`, (v) => {
    for (const k of ['fov', 'dial', 'route']) assert.deepEqual(v[k], [0, 0], k);
    assert.deepEqual(v.wheel, [[0, 0], true], 'the wheel zoomed from the centre'); assert.deepEqual(v.pinch, [[0, 0], true], 'the pinch zoomed, from the centre');
    assert.deepEqual(v.released, [false, false, false], 'released: the pad answers, the settings say so');
    assert.equal(v.routeFree[0], 0.5, 'and a route moves the pivot again'); assert.ok(v.wheelFree[0] !== 0 && v.wheelFree[1] !== 0, 'and the wheel zooms at the cursor again');
  });

  const errs = await g.errors();
  if (errs.errs.length) { failed++; console.error('FAIL page errors', errs.errs); }
} finally {
  await g.ev(`try { __LW.camera.reset(); } catch (_) {} return 1;`).catch(() => {});
  await g.close();
}
console.log(failed ? `RED camera-shift.browser-test — ${failed} failing` : 'GREEN camera-shift.browser-test');
process.exit(failed ? 1 : 0);
