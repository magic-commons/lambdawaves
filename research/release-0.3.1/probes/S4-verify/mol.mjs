// S4 VERIFY item 9 (fresh context): MOLECULES ON by a REAL click; undo / redo by the REAL keys (Ctrl+Z, Ctrl+Shift+Z — through
// keyEdit, which arms a named quiet window after the travel) and by the REAL UNDO / REDO buttons; then a MOLECULES press followed
// by a fast unrelated edit (the C key 100 ms later; a knob drag starting 100 ms later), and what undo/redo do to that pair.
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/mol.mjs
import { lab } from '../S3-verify/kit.mjs';
const g = await lab();
const out = {};
const blur = () => g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
const state = (tag) => g.run(`await __w(1200); const H = __LW.history, I = __LW.serialize({ scope: 'edit' }).presentation.instruments;
  return { tag: ${JSON.stringify(tag)}, rows: H.entries().map((e) => e.i + ':' + e.label + (e.state === 'current' ? '*' : '')).slice(-5), cursor: H.cursor, n: H.entries().length, chemOn: __LW.chem.on,
    orbital: I.chem && I.chem.orbital, sel: JSON.stringify(I.orbitals && I.orbitals.selection), lanes: (I.states && I.states.lanes || []).length, dirty: H.depth > H.cursor, canRedo: H.canRedo, style: __LW.serialize().presentation.mat.style };`);
const molXY = () => g.run(`const s = __sw('MOLECULES ON'); __LW.layout.reopen('chem'); await __w(200); __show(s); await __w(150); return __at(s.querySelector('button') || s);`);
const trigXY = (t) => g.run(`const e = __trig(${JSON.stringify(t)}); __LW.layout.reopen('history'); await __w(150); __show(e); await __w(100); return __at(e);`);
try {
  /* ── A · the switch, the real keys ── */
  await g.run(`await __settle(); __LW.history.clear('probe'); return 1;`);
  let xy = await molXY(); if (!xy) throw new Error('MOLECULES covered: ' + await g.run('return window.__coveredBy'));
  await g.click(xy[0], xy[1]);
  out.A = [await state('after real click ON')];
  await blur(); await g.key('z', ['']); out.A.push(await state('after real Ctrl+Z'));
  await blur(); await g.key('z', ['', '']); out.A.push(await state('after real Ctrl+Shift+Z'));
  await g.run(`await __w(800); __LW.history.flush(); return 1;`); out.A.push(await state('+0.8 s, flushed'));
  await blur(); await g.key('z', ['']); out.A.push(await state('after a 2nd real Ctrl+Z'));
  await blur(); await g.key('y', ['']); out.A.push(await state('after real Ctrl+Y'));
  for (const s of out.A) console.log('A', JSON.stringify(s));
  /* turn it off by the switch again and settle */
  xy = await molXY(); await g.click(xy[0], xy[1]); await g.run(`await __w(700); await __settle(); return 1;`);

  /* ── B · the same by the REAL UNDO / REDO buttons ── */
  await g.run(`await __settle(); __LW.history.clear('probe'); return 1;`);
  xy = await molXY(); await g.click(xy[0], xy[1]);
  out.B = [await state('after real click ON')];
  let t = await trigXY('UNDO'); await g.click(t[0], t[1]); out.B.push(await state('after UNDO button'));
  t = await trigXY('REDO'); await g.click(t[0], t[1]); out.B.push(await state('after REDO button'));
  await g.run(`await __w(800); __LW.history.flush(); return 1;`); out.B.push(await state('+0.8 s, flushed'));
  for (const s of out.B) console.log('B', JSON.stringify(s));
  xy = await molXY(); await g.click(xy[0], xy[1]); await g.run(`await __w(700); await __settle(); return 1;`);

  /* ── C · a MOLECULES press, then the C key 100 ms later (before the solve lands) ── */
  await g.run(`await __settle(); __LW.history.clear('probe'); return 1;`);
  xy = await molXY(); await g.click(xy[0], xy[1]);
  await g.run(`await __w(60); return 1;`); await blur(); await g.key('c');
  out.C = [await state('MOLECULES then C ~100 ms later')];
  await blur(); await g.key('z', ['']); out.C.push(await state('Ctrl+Z #1'));
  await blur(); await g.key('z', ['']); out.C.push(await state('Ctrl+Z #2'));
  await blur(); await g.key('z', ['', '']); out.C.push(await state('Ctrl+Shift+Z #1'));
  await blur(); await g.key('z', ['', '']); out.C.push(await state('Ctrl+Shift+Z #2'));
  for (const s of out.C) console.log('C', JSON.stringify(s));
  out.C2 = [];
  /* the same pair walked by the API (H.undo / H.redo: no keyEdit note) */
  await g.run(`__LW.history.undo(); __LW.history.undo(); return 1;`); out.C2.push(await state('API undo ×2'));
  await g.run(`__LW.history.redo(); return 1;`); out.C2.push(await state('API redo #1'));
  await g.run(`__LW.history.redo(); return 1;`); out.C2.push(await state('API redo #2'));
  for (const s of out.C2) console.log('C2', JSON.stringify(s));
  xy = await molXY(); if (await g.run('return __LW.chem.on')) { await g.click(xy[0], xy[1]); await g.run(`await __w(700); await __settle(); return 1;`); }

  /* ── D · a MOLECULES press, then a real knob drag starting ~100 ms later ── */
  await g.run(`await __settle(); __LW.history.clear('probe'); return 1;`);
  const kn = await g.run(`const k = __knob('EXPOSURE'); __show(k); await __w(80); return __at(k);`);
  xy = await molXY();
  await g.click(xy[0], xy[1]);
  const kn2 = await g.run(`const k = __knob('EXPOSURE'); return __at(k);`);
  await g.realDrag(g.line((kn2 || kn)[0], (kn2 || kn)[1], 0, -40, 10), 0, 40);
  out.D = [await state('MOLECULES then a knob drag')];
  await g.run(`__LW.history.undo(); return 1;`); out.D.push(await state('API undo #1'));
  await g.run(`__LW.history.undo(); return 1;`); out.D.push(await state('API undo #2'));
  await g.run(`__LW.history.redo(); return 1;`); out.D.push(await state('API redo #1'));
  await g.run(`__LW.history.redo(); return 1;`); out.D.push(await state('API redo #2'));
  for (const s of out.D) console.log('D', JSON.stringify(s));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
