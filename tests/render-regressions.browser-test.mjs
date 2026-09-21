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
    M.setSource(id, { preset: 'sawup' });
    V.sync();
    const svg = document.querySelector('.m2dev[data-id="' + id + '"] .m2svg');
    const before = V.curve(id);
    const p = V.at(id, 0.5, 0.8);
    const send = type => svg.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 81, pointerType: 'mouse', button: 0,
      clientX: p.x, clientY: p.y,
    }));
    send('pointerdown');
    send('pointerup');
    const after = V.curve(id);
    return { before: before.points.length, model: M.sourceOf(id).points.length,
      painted: after.points.length, pathChanged: before.sig !== after.sig, errors: __e.slice() };
  `);
  assert.deepEqual(curve, { before: 2, model: 3, painted: 3, pathChanged: true, errors: [] });
  console.log('PASS a paused curve tap paints the new point synchronously');

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
