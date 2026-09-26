// S4 VERIFY item 3/4: does a TRAVEL leave a name standing for the next unnamed edit?  REAL input for the travel (Ctrl+Z,
// Ctrl+Shift+Z, Ctrl+Y, the UNDO / REDO buttons, a click on a HISTORY row), then an unnamed edit (LW.setStage + note) `gap` ms
// later.  The row it makes is read as the ring's LAST row (a travel truncates the future, so counting rows would lie).
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/travel-names.mjs
import { lab } from '../S3-verify/kit.mjs';
const g = await lab();
const out = {};
const blur = () => g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
const prep = () => g.run(`await __settle(); __LW.history.clear('probe'); for (let i = 1; i <= 3; i++) { __LW.setStage(0.2 + i / 10); __LW.history.flush(); } await new Promise((r) => requestAnimationFrame(r)); return 1;`);
const after = (gap) => g.run(`await __w(${gap}); __LW.setStage(0.77); __LW.history.note(); await __w(560); __LW.history.flush(); const E = __LW.history.entries(); return { last: E.at(-1).label, rows: E.map((e) => e.label + (e.state === 'current' ? '*' : '')) };`);
const trigXY = (t) => g.run(`const e = __trig(${JSON.stringify(t)}); __LW.layout.reopen('history'); await __w(150); __show(e); await __w(100); return __at(e);`);
try {
  for (const gap of [100, 300, 500]) {
    await prep(); await blur(); await g.key('z', ['']); out['Ctrl+Z · ' + gap] = await after(gap);
    await prep(); await g.run(`__LW.history.undo(); return 1;`); await blur(); await g.key('z', ['', '']); out['Ctrl+Shift+Z · ' + gap] = await after(gap);
    await prep(); await g.run(`__LW.history.undo(); return 1;`); await blur(); await g.key('y', ['']); out['Ctrl+Y · ' + gap] = await after(gap);
    await prep(); let t = await trigXY('UNDO'); await g.click(t[0], t[1]); out['UNDO button · ' + gap] = await after(gap);
    await prep(); await g.run(`__LW.history.undo(); return 1;`); t = await trigXY('REDO'); await g.click(t[0], t[1]); out['REDO button · ' + gap] = await after(gap);
    await prep(); t = await g.run(`const list = document.querySelector('.dev[data-id="history"] .hist-list'); __show(list); await __w(100); return __at([...list.querySelectorAll('.hist-row')].find((b) => +b.dataset.i === 1));`);
    await g.click(t[0], t[1]); out['row click (goto 1) · ' + gap] = await after(gap);
  }
  for (const [k, v] of Object.entries(out)) console.log(k.padEnd(28), JSON.stringify(v));
  console.log('errs', JSON.stringify(await g.run(`return __e.slice();`)));
} catch (e) { console.error(e); }
finally { await g.close(); }
