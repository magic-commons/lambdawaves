import assert from 'node:assert/strict';
import { bindStageGestures, STAGE_BINDINGS } from '../lab/stage-gestures.js';
import { createCameraLaw } from '../lab/camera-law.js';

function stage(bindings, ui, over = {}) {   // `over`: callbacks taken from a real camera law (0.5.3 M6)
  const canvas = new EventTarget(), doc = new EventTarget(), win = new EventTarget(), classes = new Set();
  canvas.ownerDocument = doc; doc.defaultView = win;
  canvas.classList = { add: name => classes.add(name), remove: name => classes.delete(name) };
  const captured = new Set();
  canvas.setPointerCapture = id => captured.add(id);
  canvas.hasPointerCapture = id => captured.has(id);
  canvas.releasePointerCapture = id => { captured.delete(id); send('lostpointercapture', id); };
  canvas.focus = () => {}; canvas.clientHeight = 800;
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 800 });
  let time = 0;
  const travel = { yaw: 0, pitch: 0 }, result = { distance: 3, held: false, resets: 0, flings: [], moved: 0, ended: 0, canceled: 0, anchors: [], pans: [] };
  bindStageGestures(canvas, {
    camera: { dragGain: 1, stop() {}, fling: (...v) => result.flings.push(v) }, travel,
    law: { HIST_MS: 80, STALE_MS: 120, REST: .003, SENS: .0065, FINE: .25, TAP_MS: 320 },
    getDistance: () => result.distance, zoomAt: (c, v) => { result.anchors.push(c); result.distance = v; },
    pan: (du, dv) => result.pans.push([du, dv]),
    orbitBy: (yaw, pitch) => { travel.yaw += yaw; travel.pitch += pitch; },
    resetView: () => result.resets++, setDragging: v => { result.held = v; }, present() {}, hover() {}, now: () => time,
    startSpecial: e => e.ctrlKey ? { move: () => result.moved++, end: () => result.ended++, cancel: () => result.canceled++ } : null, bindings, ui, ...over,
  });
  function send(type, id = 1, x = 100, y = 100, extra = {}) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { pointerId: id, clientX: x, clientY: y, pointerType: 'touch', button: 0, shiftKey: false, ...extra });
    canvas.dispatchEvent(event);
  }
  return { send, result, travel, classes, win, doc, canvas, captured, advance: ms => { time += ms; } };
}

// Drag keeps the original sensitivity and releases the measured pose velocity.
{
  const s = stage(); s.send('pointerdown'); s.advance(20); s.send('pointermove', 1, 120, 110); s.send('pointerup', 1, 120, 110);
  assert.equal(s.travel.yaw, -.13); assert.equal(s.travel.pitch, .065);
  assert.deepEqual(s.result.flings, [[-6.5, 3.25]]); assert.equal(s.result.held, false);
}
// Fine drag changes gain without a pose jump or inheriting a coarse fling.
{
  const s = stage(); s.send('pointerdown'); s.advance(20); s.send('pointermove', 1, 120);
  s.advance(20); s.send('pointermove', 1, 140, 100, { shiftKey: true });
  s.advance(20); s.send('pointermove', 1, 160, 100, { shiftKey: true }); s.send('pointerup', 1, 160);
  assert.ok(Math.abs(s.travel.yaw + .195) < 1e-12);
  assert.ok(Math.abs(s.result.flings[0][0] + 1.625) < 1e-12);
}
// Every interruption clears ownership and suppresses fling and tap activation.
for (const interruption of ['pointercancel', 'lostpointercapture', 'blur', 'pagehide', 'hidden']) {
  const s = stage(); s.send('pointerdown'); s.advance(20); s.send('pointermove', 1, 150);
  if (interruption === 'hidden') { s.doc.hidden = true; s.doc.dispatchEvent(new Event('visibilitychange')); }
  else if (interruption === 'blur' || interruption === 'pagehide') s.win.dispatchEvent(new Event(interruption));
  else s.send(interruption);
  s.send('pointerup');
  assert.equal(s.result.held, false, interruption); assert.deepEqual(s.result.flings, [], interruption);
  assert.equal(s.result.resets, 0, interruption);
}
// A stale stationary finger cannot fling; a canceled special action cannot commit.
{
  const s = stage(); s.send('pointerdown'); s.advance(20); s.send('pointermove', 1, 150); s.advance(130); s.send('pointerup', 1, 150);
  assert.deepEqual(s.result.flings, []);
  s.send('pointerdown', 1, 100, 100, { ctrlKey: true }); s.send('pointerdown', 2);
  s.send('pointermove', 2); s.send('pointerup', 2); assert.equal(s.result.moved, 0); assert.equal(s.result.ended, 0);
  s.send('pointermove', 1); s.send('pointercancel', 1); s.send('pointerup', 1);
  assert.equal(s.result.moved, 1); assert.equal(s.result.canceled, 1); assert.equal(s.result.ended, 0);
  s.send('pointerdown', 3, 100, 100, { ctrlKey: true }); s.send('pointerup', 3);
  assert.equal(s.result.ended, 1); // Explicit release still commits exactly once.
}
// Pinching zooms without rotating; lifting either finger then dragging is continuous.
for (const lifted of [1, 2]) {
  const s = stage(); s.send('pointerdown', 1, 100); s.send('pointerdown', 2, 200);
  s.send('pointermove', 2, 300); assert.equal(s.result.distance, 1.5); assert.equal(s.travel.yaw, 0);
  s.send('pointerdown', 3, 900); s.send('pointermove', 3, 950); s.send('pointerup', 3, 950);
  assert.equal(s.result.distance, 1.5); assert.equal(s.result.held, true);
  s.send('pointerup', lifted, lifted === 1 ? 100 : 300);
  const remaining = lifted === 1 ? 2 : 1, x = remaining === 1 ? 100 : 300;
  s.advance(20); s.send('pointermove', remaining, x + 10); s.send('pointerup', remaining, x + 10);
  assert.equal(s.travel.yaw, -.065); assert.equal(s.result.resets, 0);
}
// Only two short unmoved touches reset: pinches and out-and-back drags are not taps.
{
  const s = stage(); s.send('pointerdown'); s.send('pointerup'); s.advance(100); s.send('pointerdown'); s.send('pointerup');
  assert.equal(s.result.resets, 1);
  s.advance(400); s.send('pointerdown'); s.send('pointermove', 1, 150); s.send('pointermove', 1, 100); s.send('pointerup');
  s.advance(100); s.send('pointerdown'); s.send('pointerup'); assert.equal(s.result.resets, 1);
  s.advance(400); s.send('pointerdown', 1); s.send('pointerdown', 2); s.send('pointerup', 1); s.send('pointerup', 2);
  s.advance(100); s.send('pointerdown'); s.send('pointerup'); assert.equal(s.result.resets, 1);
}
// 0.4.0 S2 · the wheel zooms at the cursor and the pinch at the fingers' centroid, both in uv (+y up).
{
  const s = stage(), wheel = Object.assign(new Event('wheel', { cancelable: true }), { deltaY: 100, deltaMode: 0, clientX: 750, clientY: 200 });
  s.canvas.dispatchEvent(wheel);
  assert.ok(Math.abs(s.result.distance - 3.3) < 1e-12); assert.deepEqual(s.result.anchors, [[0.5, 0.5]]); assert.equal(wheel.defaultPrevented, true);
}
{
  const s = stage(); s.send('pointerdown', 1, 100); s.send('pointerdown', 2, 200); s.send('pointermove', 2, 300);
  assert.equal(s.result.distance, 1.5); assert.deepEqual(s.result.anchors, [[-0.6, 0.75]]);   // the centroid (200, 100) the fingers ended on
  assert.equal(s.result.pans.length, 1); assert.equal(s.result.pans[0][0], 0.1); assert.equal(s.result.pans[0][1] + 0, 0);   // the centroid moved 50 px: 2·50/1000
}
// Two fingers dragged together slide the picture one pixel per pixel and zoom nowhere; the picture never turns.
{
  const s = stage(); s.send('pointerdown', 1, 100, 100); s.send('pointerdown', 2, 200, 100);
  s.send('pointermove', 1, 100, 140); s.send('pointermove', 2, 200, 140);
  const dv = s.result.pans.reduce((t, p) => t + p[1], 0), du = s.result.pans.reduce((t, p) => t + p[0], 0);
  assert.ok(Math.abs(dv + 2 * 40 / 800) < 1e-12 && du === 0, 'down 40 px = −0.1 of the frame in uv');
  assert.equal(s.result.distance, 3); assert.equal(s.travel.yaw, 0); assert.equal(s.travel.pitch, 0);
}
// Alt-drag on a mouse slides the picture (no orbit, no fling, no tap); Ctrl+Alt is still the instrument's special.
{
  const s = stage(); s.send('pointerdown', 1, 100, 100, { altKey: true, pointerType: 'mouse' }); s.advance(20);
  s.send('pointermove', 1, 110, 90, { pointerType: 'mouse' }); s.send('pointerup', 1, 110, 90, { pointerType: 'mouse' });
  assert.deepEqual(s.result.pans, [[0.02, 0.025]]); assert.equal(s.travel.yaw, 0); assert.deepEqual(s.result.flings, []); assert.equal(s.result.held, false);
  s.send('pointerdown', 2, 100, 100, { altKey: true, ctrlKey: true }); s.send('pointermove', 2, 150); s.send('pointerup', 2, 150);
  assert.equal(s.result.moved, 1); assert.equal(s.result.ended, 1); assert.equal(s.result.pans.length, 1);
  // 0.5.3 M7 (R8): Alt+Shift-drag is the same pan, one pixel per pixel — Shift is the orbit's fine step, never a fine pan.
  const f = stage(), shift = { shiftKey: true, pointerType: 'mouse' }; f.send('pointerdown', 1, 100, 100, { ...shift, altKey: true }); f.advance(20);
  f.send('pointermove', 1, 110, 90, shift); f.send('pointerup', 1, 110, 90, shift);
  assert.deepEqual(f.result.pans, [[0.02, 0.025]], 'Alt+Shift-drag pans as Alt-drag does'); assert.equal(f.travel.yaw, 0); assert.deepEqual(f.result.flings, []); assert.equal(f.result.held, false);
}
console.log('PASS stage gestures: drag, fine gain, fling, interruption, special ownership, pinch handoff, deliberate double taps — and (S2) the wheel and the pinch zoom at the cursor / centroid, two fingers and Alt(+Shift)-drag slide the picture one pixel per pixel');
// 0.5.0 A8 · THE BINDINGS ARE DATA: the table is today's (R5-C1), frozen, and an edited row is what the stage does.
{
  assert.deepEqual(JSON.parse(JSON.stringify(STAGE_BINDINGS)), { pointer: { button: 0, slide: { altKey: true, ctrlKey: false }, fine: 'shiftKey' },
    wheel: { line: 16, page: null, base: 1.1, per: 100, atCursor: true }, pinch: { slide: true, atCentroid: true }, tap: { ms: 300, px: 8 },
    doubleTap: { ms: null, px: 40 }, dblclick: true, nudge: 0.05 });
  assert.ok(Object.isFrozen(STAGE_BINDINGS) && Object.isFrozen(STAGE_BINDINGS.pointer.slide) && Object.isFrozen(STAGE_BINDINGS.wheel));
  const row = (o) => ({ ...STAGE_BINDINGS, ...o });
  const quick = stage(row({ doubleTap: { ms: 150, px: 40 } })); quick.send('pointerdown'); quick.send('pointerup'); quick.advance(200); quick.send('pointerdown'); quick.send('pointerup');
  assert.equal(quick.result.resets, 0, 'a 200 ms double tap is too slow for a 150 ms row');
  const shift = stage(row({ pointer: { button: 0, slide: { shiftKey: true }, fine: 'altKey' } })); shift.send('pointerdown', 1, 100, 100, { shiftKey: true, pointerType: 'mouse' });
  shift.send('pointermove', 1, 110, 100, { pointerType: 'mouse' }); shift.send('pointerup', 1, 110, 100, { pointerType: 'mouse' });
  assert.deepEqual(shift.result.pans.map(([u, v]) => [u, v + 0]), [[0.02, 0]], 'Shift-drag slides when the row says so'); assert.equal(shift.travel.yaw, 0);
  const centre = stage(row({ wheel: { ...STAGE_BINDINGS.wheel, atCursor: false } }));
  centre.canvas.dispatchEvent(Object.assign(new Event('wheel', { cancelable: true }), { deltaY: 100, deltaMode: 1, clientX: 750, clientY: 200 }));
  assert.deepEqual(centre.result.anchors, [[0, 0]]); assert.ok(Math.abs(centre.result.distance - 3 * Math.pow(1.1, 16)) < 1e-12, 'a line is 16 px');
}
console.log('PASS the bindings are one data table: STAGE_BINDINGS is today\'s (pointer, wheel, pinch, tap, double tap, double-click, nudge), frozen, and an edited row (a quicker double tap, Shift to slide, the wheel at the centre) is what the stage does');
// 0.5.0 C9 · THE SCENE GUARD: in UI space (a kit window's gap) a press, a touch tap, a double-click and a wheel start nothing on the
// stage (the wheel is swallowed: this region has no scroller); the same press on the stage orbits, and dragged INTO the UI keeps it.
{
  const s = stage(undefined, () => [{ left: 0, top: 0, right: 200, bottom: 200 }]), mouse = { pointerType: 'mouse' };
  s.send('pointerdown', 1, 100, 100, mouse); s.advance(20); s.send('pointermove', 1, 150, 120, mouse); s.send('pointerup', 1, 150, 120, mouse);
  assert.equal(s.travel.yaw, 0); assert.equal(s.result.held, false); assert.deepEqual(s.result.flings, []);
  s.send('pointerdown', 2); s.send('pointerup', 2); s.advance(100); s.send('pointerdown', 3); s.send('pointerup', 3);
  s.canvas.dispatchEvent(Object.assign(new Event('dblclick'), { clientX: 100, clientY: 100 })); assert.equal(s.result.resets, 0);
  const wheel = Object.assign(new Event('wheel', { cancelable: true }), { deltaY: 100, deltaMode: 0, clientX: 100, clientY: 100 });
  s.canvas.dispatchEvent(wheel); assert.equal(s.result.distance, 3); assert.equal(wheel.defaultPrevented, true);
  s.send('pointerdown', 4, 500, 500, mouse); s.advance(20); s.send('pointermove', 4, 100, 100, mouse); s.send('pointerup', 4, 100, 100, mouse);
  assert.ok(Math.abs(s.travel.yaw - 2.6) < 1e-12); assert.equal(s.result.held, false);
  s.canvas.dispatchEvent(Object.assign(new Event('dblclick'), { clientX: 500, clientY: 500 })); assert.equal(s.result.resets, 1);
}
console.log('PASS the scene guard (C9): a press, a tap, a double-click and a wheel in UI space start nothing on the stage; a stage drag keeps its pointer across the UI');
// 0.5.3 M4 · THE LIVE STAGE: a release the browser never delivers (a Linux context menu or a window-manager grab mid-drag) must not
// leave the stage refusing every later press.  The heal runs on a NEW press only (AUDIT-OPUS-1 B §8 risk 3): a held drag of the SAME
// id ends first, as cancelled (no fling, no commit); a mouse move with no button down ends a held mouse drag the same way.
{
  const s = stage(), mouse = { pointerType: 'mouse', buttons: 1 }, up = { pointerType: 'mouse', buttons: 0 };
  s.send('pointerdown', 1, 100, 100, mouse); s.advance(20); s.send('pointermove', 1, 150, 100, mouse);   // ...and its pointerup is lost
  s.advance(500); s.send('pointerdown', 1, 500, 500, mouse); assert.equal(s.result.held, true, 'the next press of the same mouse is taken');
  s.advance(20); s.send('pointermove', 1, 520, 500, mouse); s.send('pointerup', 1, 520, 500, up);
  assert.ok(Math.abs(s.travel.yaw + 70 * .0065) < 1e-12, 'both drags orbit: 50 px, then 20 px'); assert.equal(s.result.held, false);
  assert.equal(s.result.flings.length, 1, 'only the drag that was released flings');
  s.send('pointerdown', 1, 100, 100, { ...mouse, ctrlKey: true }); s.send('pointermove', 1, 120, 100, mouse);   // a held special (the bow), its release lost
  s.send('pointerdown', 1, 300, 300, mouse); assert.equal(s.result.canceled, 1, 'the lost special ends cancelled'); assert.equal(s.result.ended, 0, 'and never commits');
  assert.equal(s.result.held, true, 'the new press orbits'); s.send('pointerup', 1, 300, 300, up);
  s.send('pointerdown', 1, 100, 100, mouse); s.advance(20); s.send('pointermove', 1, 130, 100, mouse);
  s.send('pointermove', 1, 140, 100, up);   // the button is up and its pointerup never came
  assert.equal(s.result.held, false, 'a buttonless mouse move ends the held drag'); assert.equal(s.result.flings.length, 1, 'cancelled: no fling');
  const yaw = s.travel.yaw; s.send('pointermove', 1, 200, 100, up); assert.equal(s.travel.yaw, yaw, 'then the mouse only hovers');
}
// A lost TOUCH, then a new finger: a new touch has a NEW id, so the heal keys on the lost one's capture being gone.  The new finger
// orbits alone (no pinch against a ghost); a second finger while the first still holds its capture still pinches.
{
  const s = stage(); s.send('pointerdown', 1, 100, 100); s.advance(20); s.send('pointermove', 1, 130, 100);
  s.captured.delete(1);   // the browser dropped the touch: no pointerup, no pointercancel, no lostpointercapture
  s.advance(500); s.send('pointerdown', 2, 400, 400); s.advance(20); s.send('pointermove', 2, 420, 400);
  assert.equal(s.result.distance, 3, 'no pinch against the lost finger'); assert.deepEqual(s.result.pans, [], 'and no slide');
  assert.ok(Math.abs(s.travel.yaw + 50 * .0065) < 1e-12, 'the new finger orbits alone'); s.send('pointerup', 2, 420, 400);
  assert.equal(s.result.held, false); assert.equal(s.result.resets, 0);
  s.send('pointerdown', 3, 100, 100); s.send('pointerdown', 4, 200, 100); s.send('pointermove', 4, 300, 100);
  assert.equal(s.result.distance, 1.5, 'two live fingers still pinch');
  const synthetic = stage(); synthetic.canvas.setPointerCapture = () => {};   // a synthetic pointer is never captured (the browser suites' pinches; risk 3)
  synthetic.send('pointerdown', 1, 100, 100); synthetic.send('pointerdown', 2, 200, 100); synthetic.send('pointermove', 2, 300, 100);
  assert.equal(synthetic.result.distance, 1.5, 'a first finger the stage never held is not a lost one: the pinch still pinches');
}
console.log('PASS the live stage (0.5.3 M4): a lost pointerup, a lost special and a buttonless mouse move free the stage, cancelled; a lost touch then a new id orbits alone; a live pinch is untouched');
// 0.5.3 M6 · THE LOCK on the stage's own roads, through the REAL camera law: the wheel's atCursor, the pinch (its two-finger slide and
// its centroid) and the Alt-drag leave the shift at 0 under the lock, and the zoom still answers — from the centre.  Unlocked, the
// same gestures move the shift (the wheel zooms at the cursor), so the cases are not vacuous.
{
  const lawStage = (lock) => { const obs = { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6, mode: 'turntable', shift: [0, 0] };
    const L = createCameraLaw({ obs, present() {}, modHand: () => false, resetWall() {} }); L.camera.setLock(lock);
    return { obs, s: stage(undefined, undefined, { getDistance: () => obs.dist, zoomAt: L.zoomAt, pan: L.panBy }) }; };
  const wheel = () => Object.assign(new Event('wheel', { cancelable: true }), { deltaY: -100, deltaMode: 0, clientX: 750, clientY: 200 });
  const u = lawStage(false), k = lawStage(true); u.s.canvas.dispatchEvent(wheel()); k.s.canvas.dispatchEvent(wheel());
  assert.ok(u.obs.shift[0] !== 0 && u.obs.shift[1] !== 0 && u.obs.dist < 3.3, 'unlocked: the wheel zooms at the cursor (atCursor)');
  assert.deepEqual(k.obs.shift, [0, 0], 'locked: atCursor is answered from the centre'); assert.equal(k.obs.dist, u.obs.dist, 'and the zoom is the same zoom');
  for (const t of [u, k]) { t.s.send('pointerdown', 1, 100, 100); t.s.send('pointerdown', 2, 200, 100); t.s.send('pointermove', 2, 300, 140); t.s.send('pointerup', 1, 100, 100); t.s.send('pointerup', 2, 300, 140); }
  assert.notDeepEqual(u.obs.shift, k.obs.shift, 'unlocked, the pinch slid and zoomed at its centroid');
  assert.deepEqual(k.obs.shift, [0, 0], 'locked: the pinch neither slides nor anchors'); assert.equal(k.obs.dist, u.obs.dist, 'and zooms as far');
  const mouse = { pointerType: 'mouse' }, d0 = k.obs.dist;
  k.s.send('pointerdown', 3, 100, 100, { ...mouse, altKey: true }); k.s.send('pointermove', 3, 140, 70, mouse); k.s.send('pointerup', 3, 140, 70, mouse);
  assert.deepEqual(k.obs.shift, [0, 0], 'locked: Alt-drag slides nothing'); assert.equal(k.obs.dist, d0); assert.equal(k.s.travel.yaw, 0, 'and does not orbit');
}
console.log('PASS the LOCK (0.5.3 M6) on the stage, through the real law: the wheel at the cursor, the pinch at its centroid (and its two-finger slide) and the Alt-drag keep the shift at 0, and the zoom answers from the centre');
