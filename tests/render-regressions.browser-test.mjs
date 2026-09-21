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
    return { analyticMode: analytic.mode, afterLeft, afterRightMode: afterRight.mode,
      rightAdded: afterRight.points.length, model: M.sourceOf(id).points.length,
      shiftAddedAtLevel: Math.abs(shifted.v - shiftExpected) < 1e-9,
      tensionMoved: afterTension !== beforeTension, countHeld: M.sourceOf(id).points.length === beforeCount,
      painted: after.points.length, pathChanged: afterRight.sig !== after.sig, errors: __e.slice() };
  `);
  assert.deepEqual(curve, { analyticMode: 'wave', afterLeft: { mode: 'wave', points: 5 },
    afterRightMode: 'curve', rightAdded: 6, model: 7, shiftAddedAtLevel: true, tensionMoved: true, countHeld: true,
    painted: 7, pathChanged: true, errors: [] });
  console.log('PASS FL curve gestures: left-empty is inert, right-empty materializes/adds, Shift-right preserves level, and a handle drag bends without adding');

  const impulse = await g.ev(`
    __LW.mod.reset();
    __LW.layout.modulation.collapse();
    __LW.molecule.setOn(true);
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
    __LW.molecule.setOn(false);
    return { afterStart, afterMove, active: __LW.bow.active, errors: __e.slice() };
  `);
  assert.ok(impulse.afterStart > 0, `impulse start did not clear its overlay: ${JSON.stringify(impulse)}`);
  assert.ok(impulse.afterMove > 0, `impulse move did not clear its overlay: ${JSON.stringify(impulse)}`);
  assert.equal(impulse.active, false);
  assert.deepEqual(impulse.errors, []);
  console.log('PASS the impulse overlay clears every frame outside the hydrogen overlay domain');
} finally {
  await g.close();
}
