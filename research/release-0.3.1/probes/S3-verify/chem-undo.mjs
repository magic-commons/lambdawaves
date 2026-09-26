// VERIFY item 1's MOLECULES ON edge, as a hand meets it: a real click on MOLECULES ON, 1.5 s, then UNDO (Ctrl+Z, a real key) — what
// does the first undo do, and how many rows does the switch leave?
import { lab } from './kit.mjs';
const g = await lab();
try {
  await g.run(`const d = document.querySelector('.dev[data-id="chem"]'); d.classList.remove('closed'); await __settle(); return 1;`);
  const p = await g.run(`const s = __sw('MOLECULES ON'); __show(s); await __w(80); return __at(s.querySelector('button') || s) || { E: 'covered' };`);
  await g.click(p[0], p[1]);
  const a = await g.run(`await __w(1500); return { rows: __rows(), depth: __LW.history.depth, cursor: __LW.history.cursor, chemOn: __LW.chem.on };`);
  await g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
  await g.key('z', ['']);
  const b = await g.run(`await __w(1500); return { rows: __rows(), cursor: __LW.history.cursor, chemOn: __LW.chem.on, canRedo: __LW.history.canRedo };`);
  await g.key('z', ['']);
  const c = await g.run(`await __w(1500); return { rows: __rows(), cursor: __LW.history.cursor, chemOn: __LW.chem.on, canRedo: __LW.history.canRedo, errs: __e.slice() };`);
  console.log(JSON.stringify({ afterClick: a, afterFirstCtrlZ: b, afterSecondCtrlZ: c }, null, 1));
} finally { await g.close(); }
