// VERIFY follow-ups: (1) do keyboard edits arm the ring themselves (a row with NO flush, 700 ms after the key)?  (2) a LEFT drag of a
// curve point inside the LFO editor (.m2edit .m2pt): does the model move, and is it one named row?  (3) Shift-right-click and a
// double-click on a tension handle (MIR 1.4.2/1.4.3 gestures): rows and names.
import { lab } from './kit.mjs';
const g = await lab();
const out = {};
const clean = () => g.run(`await __settle(); __LW.history.clear('probe'); return 1;`);
const model = () => g.run(`return JSON.stringify(__LW.mod.model.serialize().sources);`);
try {
  out.keys = {};
  for (const [name, key] of [['C', 'c'], ['V', 'v'], ['P', 'p'], [']', ']'], ['K', 'k']]) {
    await clean(); await g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
    const s0 = await g.run(`return __ser();`); await g.key(key);
    const r = await g.run(`await __w(700); return { rowsNoFlush: __rows(), editMoved: __ser() !== ${JSON.stringify('x')} };`);
    r.editMoved = (await g.run(`return __ser();`)) !== s0; out.keys[name] = r; console.log('key', name, JSON.stringify(r));
  }
  await g.run(`__LW.layout.modulation.expand(); await __w(600); return 1;`);
  const pts = await g.ev(`return [...document.querySelectorAll('#modwin .m2edit .m2pt, #modwin .m2edit circle')].map((e) => { const b = e.getBoundingClientRect(); const h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return { cls: String(e.className.baseVal ?? e.className), x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, top: !!(h && (h === e || e.contains(h))) }; });`);
  console.log('editor points', JSON.stringify(pts).slice(0, 600));
  const p = (pts || []).find((q) => q.top && q.w > 0);
  if (p) {
    await clean(); let m0 = await model();
    await g.realDrag(g.line(p.x, p.y, 10, 14, 10), 0, 30);
    out.leftDrag = { rowsNoFlush: await g.run(`await __w(700); return __rows();`), modelMoved: (await model()) !== m0 };
    console.log('left drag of a curve point', JSON.stringify(out.leftDrag));
    /* same point, slower: 20 moves 40 ms apart */
    const pts2 = await g.ev(`return [...document.querySelectorAll('#modwin .m2edit .m2pt, #modwin .m2edit circle')].map((e) => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, b.width]; }).filter((q) => q[2] > 0);`);
    await clean(); m0 = await model();
    await g.realDrag(g.line(pts2[1][0], pts2[1][1], -6, 20, 20), 0, 40);
    out.leftDrag2 = { rowsNoFlush: await g.run(`await __w(700); return __rows();`), modelMoved: (await model()) !== m0 };
    console.log('left drag of another point (20 moves)', JSON.stringify(out.leftDrag2));
  }
  /* Shift-right-click on empty curve space (adds at the curve's current value) */
  const e = await g.ev(`const e = document.querySelector('#modwin .m2edit'); const b = e.getBoundingClientRect(); return [b.left + b.width * 0.61, b.top + b.height * 0.8];`);
  await clean(); let m1 = await model();
  await g.realDrag([[e[0], e[1]]], 2, 0, ['']);
  out.shiftRight = { rowsNoFlush: await g.run(`await __w(700); return __rows();`), modelMoved: (await model()) !== m1 };
  console.log('shift-right-click', JSON.stringify(out.shiftRight));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
