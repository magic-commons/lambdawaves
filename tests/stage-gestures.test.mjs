import assert from 'node:assert/strict';
import { bindStageGestures } from '../lab/stage-gestures.js';

function stage() {
  const canvas = new EventTarget(), doc = new EventTarget(), win = new EventTarget(), classes = new Set();
  canvas.ownerDocument = doc; doc.defaultView = win;
  canvas.classList = { add: name => classes.add(name), remove: name => classes.delete(name) };
  const captured = new Set();
  canvas.setPointerCapture = id => captured.add(id);
  canvas.hasPointerCapture = id => captured.has(id);
  canvas.releasePointerCapture = id => { captured.delete(id); send('lostpointercapture', id); };
  canvas.focus = () => {}; canvas.clientHeight = 800;
  let time = 0;
  const travel = { yaw: 0, pitch: 0 }, result = { distance: 3, held: false, resets: 0, flings: [], moved: 0, ended: 0, canceled: 0 };
  bindStageGestures(canvas, {
    camera: { dragGain: 1, stop() {}, fling: (...v) => result.flings.push(v) }, travel,
    law: { HIST_MS: 80, STALE_MS: 120, REST: .003, SENS: .0065, FINE: .25, TAP_MS: 320 },
    getDistance: () => result.distance, setDistance: v => { result.distance = v; },
    orbitBy: (yaw, pitch) => { travel.yaw += yaw; travel.pitch += pitch; },
    resetView: () => result.resets++, setDragging: v => { result.held = v; }, present() {}, hover() {}, now: () => time,
    startSpecial: e => e.ctrlKey ? { move: () => result.moved++, end: () => result.ended++, cancel: () => result.canceled++ } : null,
  });
  function send(type, id = 1, x = 100, y = 100, extra = {}) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { pointerId: id, clientX: x, clientY: y, pointerType: 'touch', button: 0, shiftKey: false, ...extra });
    canvas.dispatchEvent(event);
  }
  return { send, result, travel, classes, win, doc, advance: ms => { time += ms; } };
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
console.log('PASS stage gestures: drag, fine gain, fling, interruption, special ownership, pinch handoff and deliberate double taps');
