/* la10-calc.mjs — LA10's gate: the CALCULUS table updated in place must be the SAME DOM a fresh rebuild makes, and
 * cheaper.  (a) paused, five scrubbed times in a row: the table's innerHTML hash after each (compare trees);
 * (b) playing 3 s: ms and mutation records per update (the window's own update(), wrapped).
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/la10-calc.mjs <tag> */
import { page, save, FNV } from './lib.mjs';
const g = await page();
const R = {};
try {
  R.dom = await g.ev(`${FNV} __LW.layout.reopen('calculus', 'R'); __LW.windowActivity.presentOffscreen(true); __LW.loadPreset('1s+2pz'); __LW.pause(); await __LW.settle(); await __LW.settle();
    const tbl = () => document.querySelector('.calc-table'); const out = [];
    for (const t of [0, 1.25, 7.5, 33.3, 120.01]) { __LW.scrub(t); await __LW.settle(); await __LW.settle(); const h = tbl().innerHTML; out.push({ t, rows: tbl().querySelectorAll('.calc-row').length, bytes: h.length, fnv: fnv(h) }); }
    /* a state change that changes the ROW SET (BOX: the wall force row) and back */
    __LW.setHamiltonian('well'); __LW.setGasBasis('reg'); __LW.launchPacket([-3.3, 0.7, 0.2], [1.1, 0.1, 0], 1.3); __LW.pause(); __LW.scrub(2); await __LW.settle(); await __LW.settle();
    { const h = tbl().innerHTML; out.push({ t: 'box@2', rows: tbl().querySelectorAll('.calc-row').length, bytes: h.length, fnv: fnv(h) }); }
    __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); __LW.pause(); __LW.scrub(3); await __LW.settle(); await __LW.settle();
    { const h = tbl().innerHTML; out.push({ t: 'back@3', rows: tbl().querySelectorAll('.calc-row').length, bytes: h.length, fnv: fnv(h) }); }
    return out;`);
  R.cost = await g.ev(`const C = __LW.calculus, orig = C.update, tbl = document.querySelector('.calc-table'); const mo = new MutationObserver(() => {}); mo.observe(tbl, { childList: true, subtree: true, characterData: true, attributes: true });
    const rows = []; C.update = function (reg, t) { mo.takeRecords(); const t0 = performance.now(); const r = orig.call(this, reg, t); const ms = performance.now() - t0; const recs = mo.takeRecords().length; if (recs) rows.push({ ms, recs }); return r; };
    __LW.play(); await new Promise((r) => setTimeout(r, 3000)); __LW.pause(); await __LW.settle(); C.update = orig; mo.disconnect();
    const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? +s[s.length >> 1].toFixed(3) : null; };
    return { updates: rows.length, msMedian: med(rows.map((r) => r.ms)), recordsMedian: med(rows.map((r) => r.recs)) };`);
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
