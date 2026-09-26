// S4 VERIFY items 1 + 2 (fresh context): the HISTORY card — every row, origin at the bottom, aria-current kept in view WITHIN the
// list (the rack must not scroll), the card's height fixed from 13 to 26 rows, status and note text, REAL clicks on rows landing
// byte-identical, the flush and the repaint cost at a full ring, and a click on a row while an edit is still pending.
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/card.mjs
import { lab } from '../S3-verify/kit.mjs';
const g = await lab();
const out = {};
try {
  out.fresh = await g.run(`const list = document.querySelector('.dev[data-id="history"] .hist-list'); const rows = [...list.querySelectorAll('.hist-row')];
    return { n: rows.length, bottom: rows.at(-1)?.querySelector('.hist-lbl')?.textContent, hasI: rows.every((b) => b.querySelector('.hist-i')),
      cur: rows.filter((b) => b.getAttribute('aria-current') === 'true').length, closed: list.closest('.dev').classList.contains('closed'), folded: list.closest('.dev').classList.contains('folded') };`);
  console.log('fresh', JSON.stringify(out.fresh));
  /* open the card where it sits on the rack; find every scrolling ancestor */
  out.geom = await g.run(`const H = __LW.history, list = document.querySelector('.dev[data-id="history"] .hist-list'), dev = list.closest('.dev');
    dev.classList.remove('closed'); dev.hidden = false; if (dev.classList.contains('folded')) dev.querySelector('.dev-fold').click(); await __w(200);
    dev.scrollIntoView({ block: 'center', behavior: 'instant' }); await __w(100);
    const scrollers = []; for (let e = dev.parentElement; e; e = e.parentElement) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) || /(auto|scroll)/.test(cs.overflowX)) scrollers.push(e); }
    window.__scrollers = [document.scrollingElement, ...scrollers];
    window.__sc = () => __scrollers.map((e) => [e.id || String(e.className).slice(0, 30) || e.tagName, Math.round(e.scrollTop), Math.round(e.scrollLeft)]);
    await __settle(); H.clear(); await __w(50);
    const hs = {}, readings = [__ser()];
    const sc0 = __sc(), devTop0 = dev.getBoundingClientRect().top;
    for (let i = 1; i <= 30; i++) { __LW.setStage(0.2 + i / 100); H.flush(); readings.push(__ser()); if (i === 12 || i === 25 || i === 30) { await new Promise((r) => requestAnimationFrame(r)); hs[i + 1] = { card: dev.getBoundingClientRect().height, list: list.clientHeight, sh: list.scrollHeight }; } }
    await new Promise((r) => requestAnimationFrame(r));
    const sc30 = __sc(), devTop30 = dev.getBoundingClientRect().top;
    const rows = [...list.querySelectorAll('.hist-row')], idx = (b) => +b.querySelector('.hist-i').textContent;
    const inView = (b) => { const L = list.getBoundingClientRect(), R = b.getBoundingClientRect(); return R.top >= L.top - 0.5 && R.bottom <= L.bottom + 0.5; };
    const cur = () => [...list.querySelectorAll('[aria-current="true"]')];
    const top = { n: rows.length, first: idx(rows[0]), last: idx(rows.at(-1)), bottomName: rows.at(-1).querySelector('.hist-lbl').textContent, cur: cur().map(idx), curInView: inView(cur()[0]), status: dev.querySelector('.dev-status, .status, [class*=status]')?.textContent?.trim(), listTop: list.scrollTop };
    H.goto(3); await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r));
    const g3 = { cur: cur().map(idx), curInView: inView(cur()[0]), listTop: Math.round(list.scrollTop), sc: __sc(), devTop: dev.getBoundingClientRect().top, lands: __ser() === readings[3], status: dev.querySelector('.dev-status, .status, [class*=status]')?.textContent?.trim() };
    H.goto(30); await new Promise((r) => requestAnimationFrame(r));
    const note = dev.querySelector('.note')?.textContent;
    window.__readings = readings;
    return { sc0, sc30, devTop0, devTop30, hs, top, g3, note, statusEls: [...dev.querySelectorAll('*')].filter((e) => /kept/.test(e.textContent) && e.children.length === 0).map((e) => e.className + ': ' + e.textContent) };`);
  console.log('geom', JSON.stringify(out.geom, null, 1));

  /* REAL clicks on rows 5, 22, 0 (scrolled into the list's view by setting the list's own scrollTop) */
  out.clicks = [];
  for (const k of [5, 22, 0, 30]) {
    const at = await g.run(`const list = document.querySelector('.dev[data-id="history"] .hist-list'); const b = [...list.querySelectorAll('.hist-row')].find((x) => +x.dataset.i === ${k});
      list.scrollTop += b.getBoundingClientRect().top - list.getBoundingClientRect().top - 40; await __w(50); window.__sc0 = __sc(); return __at(b);`);
    if (!at) { out.clicks.push({ k, E: 'covered ' + (await g.run('return window.__coveredBy')) }); continue; }
    await g.click(at[0], at[1]);
    out.clicks.push(await g.run(`await new Promise((r) => requestAnimationFrame(r)); await __w(60); const list = document.querySelector('.dev[data-id="history"] .hist-list'), H = __LW.history;
      const c = list.querySelector('[aria-current="true"]'), L = list.getBoundingClientRect(), R = c.getBoundingClientRect();
      return { k: ${k}, cursor: H.cursor, lands: __ser() === __readings[${k}], curIdx: +c.dataset.i, inView: R.top >= L.top - 0.5 && R.bottom <= L.bottom + 0.5, rows: H.entries().length, scMoved: JSON.stringify(__sc()) !== JSON.stringify(window.__sc0), sc: __sc() };`));
  }
  console.log('clicks', JSON.stringify(out.clicks));

  /* A CLICK ON A ROW WHILE AN EDIT IS STILL PENDING (inside its 400 ms quiet window): the press commits it, the list repaints */
  out.pendingClick = [];
  for (const delay of [60, 250]) {
    const at = await g.run(`const H = __LW.history; await __settle(); H.clear(); window.__rd = [__ser()]; for (let i = 1; i <= 8; i++) { __LW.setStage(0.5 + i / 100); H.flush(); __rd.push(__ser()); }
      await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r));
      const list = document.querySelector('.dev[data-id="history"] .hist-list'); list.scrollTop = 0; const b = [...list.querySelectorAll('.hist-row')].find((x) => +x.dataset.i === 3);
      const xy = __at(b); __LW.setStage(0.9); __LW.history.note(); window.__afterEdit = __ser(); await __w(${delay}); return xy;`);
    await g.click(at[0], at[1]);
    out.pendingClick.push(await g.run(`await __w(600); const H = __LW.history; return { delay: ${delay}, rows: H.entries().map((e) => e.i + ':' + e.label).join(' | '), cursor: H.cursor, landsOn3: __ser() === __rd[3], stillOnEdit: __ser() === __afterEdit };`));
  }
  console.log('pendingClick', JSON.stringify(out.pendingClick, null, 1));

  /* item 2 — the paint at a FULL ring: flush after an edit (median of 20), the synchronous repaint, and a whole frame */
  out.paint = await g.run(`const H = __LW.history, med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
    await __settle(); H.clear(); for (let i = 1; i <= 62; i++) { __LW.setStage(0.1 + i / 200); H.flush(); } await new Promise((r) => requestAnimationFrame(r));
    const n = H.entries().length, fl = [], rn = [], rl = [], fr = [];
    for (let i = 0; i < 20; i++) { __LW.setStage(0.45 + (i % 2) * 0.1 + i / 1000); let t = performance.now(); H.flush(); fl.push(performance.now() - t);
      t = performance.now(); H.render(); rn.push(performance.now() - t); t = performance.now(); void document.querySelector('.hist-list').lastChild.getBoundingClientRect().top; rl.push(performance.now() - t);
      const t0 = performance.now(); await new Promise((r) => requestAnimationFrame(() => r())); fr.push(performance.now() - t0); await __w(30); }
    /* the frame the ring moved: flush WITHOUT render(), then time the next rAF callback's own work via a second rAF */
    const moved = []; for (let i = 0; i < 12; i++) { await new Promise((r) => requestAnimationFrame(r)); __LW.setStage(0.3 + i / 500); H.flush(); const t0 = performance.now(); await new Promise((r) => requestAnimationFrame(() => r())); moved.push(performance.now() - t0); await __w(30); }
    const still = []; for (let i = 0; i < 12; i++) { await new Promise((r) => requestAnimationFrame(r)); const t0 = performance.now(); await new Promise((r) => requestAnimationFrame(() => r())); still.push(performance.now() - t0); await __w(30); }
    return { rows: n, flushMed: +med(fl).toFixed(3), flushMax: +Math.max(...fl).toFixed(3), renderMed: +med(rn).toFixed(3), renderMax: +Math.max(...rn).toFixed(3), layoutMed: +med(rl).toFixed(3), frameGapMovedMed: +med(moved).toFixed(2), frameGapStillMed: +med(still).toFixed(2) };`);
  console.log('paint', JSON.stringify(out.paint));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
