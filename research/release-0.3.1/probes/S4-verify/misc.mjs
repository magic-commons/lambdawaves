// S4 VERIFY misc: (a) REAL right-clicks where nothing suppresses the context menu (the stage canvas, the rack's empty space, a
// HISTORY row) — does the ring still commit an API edit 100 ms and 600 ms later, or is it held?  (b) goto while the HISTORY
// card is closed, then open it: is the current row in view?  (c) phone width 390×844: the card, the list, horizontal overflow.
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/misc.mjs
import { lab } from '../S3-verify/kit.mjs';
import { actions, relActions } from '../../../../tools/gate/drv.mjs';
const out = {};
let g = await lab();
let n = 0;
const rclick = async (x, y) => { await actions(g.s, [{ type: 'pointer', id: 'm' + (++n), parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }, { type: 'pointerDown', button: 2 }, { type: 'pause', duration: 40 }, { type: 'pointerUp', button: 2 }] }]); await relActions(g.s); };
try {
  await g.run(`__LW.layout.modulation.collapse(); await __w(400); return 1;`);
  const spots = await g.run(`const c = document.getElementById('field'); let st = null; for (let y = 200; y < innerHeight - 100 && !st; y += 40) for (let x = 300; x < innerWidth - 400 && !st; x += 40) if (document.elementFromPoint(x, y) === c) st = [x, y];
    const list = document.querySelector('.dev[data-id="history"] .hist-list'); __LW.layout.reopen('history'); await __w(200); __show(list); await __w(100); const row = __at(list.querySelector('.hist-row'));
    return { stage: st, row };`);
  for (const [label, at] of Object.entries(spots)) {
    if (!at) { out[label] = 'no spot'; continue; }
    await g.run(`await __settle(); window.__n0 = __LW.history.entries().length; return 1;`);
    await rclick(at[0], at[1]);
    out[label] = await g.run(`const H = __LW.history; await __w(100); __LW.setStage(0.2 + Math.random() * 0.5); H.note(); await __w(650); const r1 = H.entries().length - window.__n0;
      const name = H.entries().at(-1).label; __LW.setStage(0.2 + Math.random() * 0.5); H.note(); await __w(650); return { edit100msLater: r1, name, secondEdit: H.entries().length - window.__n0 - r1 };`);
  }
  console.log('(a) right-clicks where the page does not suppress the menu', JSON.stringify(out));
  /* (b) */
  out.closed = await g.run(`const H = __LW.history, d = document.querySelector('.dev[data-id="history"]'), list = d.querySelector('.hist-list'); await __settle(); H.clear();
    for (let i = 1; i <= 30; i++) { __LW.setStage(0.2 + i / 100); H.flush(); } await new Promise((r) => requestAnimationFrame(r));
    d.classList.add('closed'); await __w(50); H.goto(2); await new Promise((r) => requestAnimationFrame(r)); await __w(50);
    __LW.layout.reopen('history'); await __w(300); __show(list); await __w(100);
    const c = list.querySelector('[aria-current="true"]'), L = list.getBoundingClientRect(), R = c.getBoundingClientRect();
    return { current: +c.dataset.i, inView: R.top >= L.top - 0.5 && R.bottom <= L.bottom + 0.5, listTop: list.scrollTop };`);
  console.log('(b) goto(2) while closed, then opened', JSON.stringify(out.closed));
  await g.close();
  /* (c) phone */
  g = await lab(undefined, { width: 390, height: 844 });
  out.phone = await g.run(`const H = __LW.history, d = document.querySelector('.dev[data-id="history"]'), list = d.querySelector('.hist-list'); await __settle(); H.clear();
    __LW.layout.reopen('history'); await __w(300);
    for (let i = 1; i <= 30; i++) { __LW.setStage(0.2 + i / 100); H.flush(); } await new Promise((r) => requestAnimationFrame(r)); __show(list); await __w(200);
    const b = d.getBoundingClientRect(), lb = list.getBoundingClientRect();
    return { phone: document.body.classList.contains('phone'), card: [Math.round(b.width), Math.round(b.height)], list: [Math.round(lb.width), Math.round(list.clientHeight), list.scrollHeight], hOverflow: document.scrollingElement.scrollWidth > innerWidth, rows: list.children.length,
      rowOverflow: [...list.children].some((r) => r.scrollWidth > r.clientWidth + 1), status: d.querySelector('.dev-stat')?.textContent };`);
  console.log('(c) phone 390×844', JSON.stringify(out.phone));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
