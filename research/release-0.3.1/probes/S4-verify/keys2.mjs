// S4 VERIFY item 4 follow-up: C then V ~150 ms apart gave ONE row named for V — instrument each step (style, view, rows, pending)
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/keys2.mjs
import { lab } from '../S3-verify/kit.mjs';
const g = await lab();
const out = [];
const blur = () => g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
const snap = (tag) => g.run(`const H = __LW.history, S = __LW.serialize({ scope: 'edit' }).presentation.mat; return { tag: ${JSON.stringify(tag)}, style: S.style, view: S.view, paletteOn: S.paletteOn, rows: H.entries().slice(window.__n0).map((e) => e.label), pending: H.pendingLabel, depth: H.depth, cursor: H.cursor };`);
try {
  for (const [a, b, gap] of [['c', 'v', 150], ['v', 'c', 150], ['c', 'p', 150], ['c', 'v', 700]]) {
    await g.run(`await __settle(); __LW.history.clear('probe'); window.__n0 = 1; return 1;`);
    out.push(await snap('start'));
    await blur(); await g.key(a); out.push(await snap('after ' + a));
    await g.run(`await __w(${gap}); return 1;`);
    await blur(); await g.key(b); out.push(await snap('after ' + b + ' (' + gap + ' ms)'));
    await g.run(`await __w(600); return 1;`); out.push(await snap('+600 ms'));
    await g.run(`__LW.history.undo(); await __w(100); return 1;`); out.push(await snap('undo #1'));
    await g.run(`__LW.history.undo(); await __w(100); return 1;`); out.push(await snap('undo #2'));
    out.push({ tag: '----' });
  }
  for (const r of out) console.log(JSON.stringify(r));
  console.log('errs', JSON.stringify(await g.run(`return __e.slice();`)));
} catch (e) { console.error(e); }
finally { await g.close(); }
