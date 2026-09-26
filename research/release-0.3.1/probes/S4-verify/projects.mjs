// S4 VERIFY — what a person playing for ten minutes meets: NEW, save, open, and the history across them; the unsaved-changes
// mark after an undo back to the bottom row (a knob drag undone; MOLECULES ON undone — the recorded limit's visible cost?).
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/projects.mjs
import { lab } from '../S3-verify/kit.mjs';
const g = await lab();
const out = {};
const blur = () => g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
const read = (tag) => g.run(`await __w(700); const H = __LW.history, P = __LW.layout.projects;
  return { tag: ${JSON.stringify(tag)}, rows: H.entries().map((e) => e.label + (e.state === 'current' ? '*' : '')), dirty: P.dirty, current: P.current, canUndo: H.canUndo, canRedo: H.canRedo, chemOn: __LW.chem.on,
    card: [...document.querySelectorAll('.dev[data-id="history"] .hist-row')].map((b) => b.querySelector('.hist-lbl').textContent).slice(0, 4), undoBtn: document.querySelector('.dev[data-id="history"] .trig')?.disabled };`);
const knobDrag = async (dy = -50) => { const kn = await g.run(`const k = __knob('EXPOSURE'); __LW.layout.reopen && 0; __show(k); await __w(80); return __at(k);`); await g.realDrag(g.line(kn[0], kn[1], 0, dy, 10), 0, 40); };
const molClick = async () => { const xy = await g.run(`const s = __sw('MOLECULES ON'); __LW.layout.reopen('chem'); await __w(200); __show(s); await __w(150); return __at(s.querySelector('button') || s);`); await g.click(xy[0], xy[1]); };
try {
  await g.run(`window.__asked = 0; window.confirm = () => { __asked++; return true; }; return 1;`);
  await g.run(`await __LW.layout.projects.fresh(); await __w(800); return 1;`);
  out.s = [await read('after NEW')];
  await knobDrag(); out.s.push(await read('knob drag'));
  await blur(); await g.key('z', ['']); out.s.push(await read('Ctrl+Z'));
  await molClick(); await g.run(`await __w(1200); return 1;`); out.s.push(await read('MOLECULES ON'));
  await blur(); await g.key('z', ['']); out.s.push(await read('Ctrl+Z (MOLECULES off)'));
  out.diffAfterMolUndo = await g.run(`return 0;`);
  out.askNew = await g.run(`const a0 = __asked; await __LW.layout.projects.requestFresh(); await __w(600); return { asked: __asked - a0 };`);
  out.s.push(await read('requestFresh after MOLECULES ON + undo'));
  /* save, edit, undo: clean again? */
  out.saved = await g.run(`return __LW.layout.projects.save('probe-s4-verify');`);
  out.s.push(await read('saved'));
  await knobDrag(40); out.s.push(await read('knob drag after save'));
  await blur(); await g.key('z', ['']); out.s.push(await read('Ctrl+Z after save'));
  await blur(); await g.key('z', ['', '']); out.s.push(await read('Ctrl+Shift+Z'));
  await g.run(`__LW.layout.projects.open('probe-s4-verify'); return 1;`); out.s.push(await read('open probe-s4-verify'));
  await blur(); await g.key('z', ['']); out.s.push(await read('Ctrl+Z right after open'));
  /* the demo */
  out.demo = await g.run(`const P = __LW.layout.projects; const r = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' }); const path = P.importText(await r.text()); P.open(path); return path;`);
  out.s.push(await read('open WAVE DANCER'));
  await knobDrag(-30); out.s.push(await read('knob drag in the demo'));
  await g.run(`__LW.history.goto(0); return 1;`); out.s.push(await read('goto(0) in the demo'));
  await g.run(`__LW.history.historyUndo(); return 1;`); out.s.push(await read('HISTORY UNDO'));
  for (const s of out.s) console.log(JSON.stringify(s));
  console.log('askNew', JSON.stringify(out.askNew), 'saved', JSON.stringify(out.saved));
  out.cleanup = await g.run(`try { __LW.layout.projects.remove && __LW.layout.projects.remove('probe-s4-verify'); } catch (_) {} return __e.slice();`);
  console.log('errs', JSON.stringify(out.cleanup));
} catch (e) { console.error(e); out.error = String(e && e.stack || e); console.log(out.error); }
finally { await g.close(); }
