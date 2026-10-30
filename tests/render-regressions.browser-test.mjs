// Regressions for paused modulation edits and the impulse overlay's canvas lifecycle.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, {
  width: 1280, height: 900, script: 20000,
});

try {
  assert.equal((await g.waitFor('window.__LW?.ready', 150, 100)).ok, 1);

  const curve = await g.ev(`
    __LW.pause();
    __LW.mod.stop();
    __LW.mod.reset();
    if (!__LW.mod.expanded) __LW.mod.expand();
    const M = __LW.mod.model, V = __LW.mod.view;
    const id = __LW.mod.addSource('lfo');
    V.sync();
    const svg = document.querySelector('.m2dev[data-id="' + id + '"] .m2svg');
    const defaultMode = M.sourceOf(id).shapeMode;
    const defaultPreset = V.shapes(id).find(s => s.name === 'sine').on;
    M.setSource(id, { wave: 'sine', shapeMode: 'wave' });
    V.sync();
    const analytic = V.curve(id), p = V.at(id, 0.5, 0.8);
    const send = (type, button, at = p, extra = {}) => svg.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 81, pointerType: 'mouse', button,
      buttons: type === 'pointerup' ? 0 : (button === 2 ? 2 : 1),
      clientX: at.x, clientY: at.y, ...extra,
    }));
    send('pointerdown', 0); send('pointerup', 0);
    const afterLeft = { mode: M.sourceOf(id).shapeMode, points: M.sourceOf(id).points.length };
    send('pointerdown', 2); send('pointerup', 2);
    const afterRight = V.curve(id);
    const shiftAt = V.at(id, 0.37, 0.05), shiftExpected = V.evalAt(afterRight.points, 0.37);
    send('pointerdown', 2, shiftAt, { shiftKey: true }); send('pointerup', 2, shiftAt, { shiftKey: true });
    const afterShift = V.curve(id), shifted = afterShift.points.reduce((best, q) => Math.abs(q.t - 0.37) < Math.abs(best.t - 0.37) ? q : best);
    const i = afterShift.hseg[0], a = afterShift.points[i], b = afterShift.points[i + 1];
    const t = (a.t + b.t) / 2, handle = V.at(id, t, V.evalAt(afterShift.points, t));
    const beforeTension = M.sourceOf(id).points[i].tension, beforeCount = M.sourceOf(id).points.length;
    send('pointerdown', 0, handle);
    send('pointermove', 0, { x: handle.x, y: handle.y + 36 });
    send('pointerup', 0, { x: handle.x, y: handle.y + 36 });
    const afterTension = M.sourceOf(id).points[i].tension;
    const after = V.curve(id);
    return { defaultMode, defaultPreset, analyticMode: analytic.mode, afterLeft, afterRightMode: afterRight.mode,
      rightAdded: afterRight.points.length, model: M.sourceOf(id).points.length,
      shiftAddedAtLevel: Math.abs(shifted.v - shiftExpected) < 1e-9,
      tensionMoved: afterTension !== beforeTension, countHeld: M.sourceOf(id).points.length === beforeCount,
      painted: after.points.length, pathChanged: afterRight.sig !== after.sig, errors: __e.slice() };
  `);
  assert.deepEqual(curve, { defaultMode: 'curve', defaultPreset: true,
    analyticMode: 'wave', afterLeft: { mode: 'wave', points: 5 },
    afterRightMode: 'curve', rightAdded: 6, model: 7, shiftAddedAtLevel: true, tensionMoved: true, countHeld: true,
    painted: 7, pathChanged: true, errors: [] });
  console.log('PASS FL curve gestures: left-empty is inert, right-empty materializes/adds, Shift-right preserves level, and a handle drag bends without adding');

  const impulse = await g.ev(`
    __LW.mod.reset();
    __LW.layout.modulation.collapse();
    __LW.setSpace('p');   // outside the hydrogen overlay domain (momentum space; the H₂⁺ card this used left in 0.5.0 D9)
    await __LW.settle();
    const canvas = document.getElementById('kepler'), ctx = canvas.getContext('2d');
    const clearRect = ctx.clearRect.bind(ctx);
    let clears = 0;
    ctx.clearRect = (...args) => { clears++; return clearRect(...args); };
    const r = document.getElementById('field').getBoundingClientRect();
    __LW.bow.start(r.left + 180, r.top + 180);
    await __LW.settle();
    const afterStart = clears;
    clears = 0;
    __LW.bow.move(r.left + 280, r.top + 230);
    await __LW.settle();
    const afterMove = clears;
    __LW.bow.cancel();
    await __LW.settle();
    ctx.clearRect = clearRect;
    __LW.setSpace('x');
    return { afterStart, afterMove, active: __LW.bow.active, errors: __e.slice() };
  `);
  assert.ok(impulse.afterStart > 0, `impulse start did not clear its overlay: ${JSON.stringify(impulse)}`);
  assert.ok(impulse.afterMove > 0, `impulse move did not clear its overlay: ${JSON.stringify(impulse)}`);
  assert.equal(impulse.active, false);
  assert.deepEqual(impulse.errors, []);
  console.log('PASS the impulse overlay clears every frame outside the hydrogen overlay domain');

  /* 028 R-11 · A FAULT THAT REPEATS IS SAID: a frame that throws the same message twice running puts the banner up (one word, no throw) */
  const fault = await g.ev(`
    const mat = __LW.mat, axis = mat.axis, pane = () => document.getElementById('mir-banner');
    const before = !!(pane() && !pane().hidden && pane().textContent.includes('a frame could not be drawn'));
    Object.defineProperty(mat, 'axis', { get() { throw new Error('R-11 probe fault'); }, configurable: true, enumerable: true });
    __LW.play();
    for (let i = 0; i < 100 && !(pane() && !pane().hidden); i++) await new Promise((q) => setTimeout(q, 20));
    Object.defineProperty(mat, 'axis', { value: axis, writable: true, configurable: true, enumerable: true });
    __LW.pause(); await __LW.settle();
    const p = pane(), shown = !!(p && !p.hidden && p.textContent.includes('a frame could not be drawn') && p.textContent.includes('R-11 probe fault'));
    if (p) p.querySelector('.mir-banner-x').click();
    const errs = __e.filter((e) => !e.includes('R-11 probe fault'));
    return { before, shown, errs };
  `);
  assert.deepEqual(fault, { before: false, shown: true, errs: [] }, JSON.stringify(fault));
  console.log('PASS a frame fault that repeats puts the banner up: "a frame could not be drawn" with the message (028 R-11)');
} finally {
  await g.close();
}
