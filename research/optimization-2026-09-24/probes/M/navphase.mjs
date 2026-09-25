/* navphase.mjs — lane M · M1 risk probe: WHEN in page 1's boot a navigation lands, and whether page 2's
 * requestAnimationFrame then fires (headless Firefox).  midboot.mjs found a stalled refresh driver after some
 * navigations, in the base build too (reload20.mjs on lab-base); this measures the stall rate by the phase page 1 was in.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/navphase.mjs <served path> <sessions> <delay ms,...>
 * Per session: open (page 1, returns at `load`), sleep d, read page 1's phase (t, ready, presents, field present),
 * navigate (page 2), wait ready, rAF within 2 s? */
import { open } from '../../../../tools/gate/gatekit.mjs';
import * as driver from '../../../../tools/gate/drv.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8723';
const P = process.argv[2] || 'lab/';
const N = +(process.argv[3] || 2);
const D = (process.argv[4] || '0,200,400,800').split(',').map(Number);
const url = `https://127.0.0.1:${PORT}/${P}?preset=1s%2B2pz&sw=0`;
const rows = [];
for (let n = 0; n < N; n++) for (const d of D) {
  const g = await open(url, { width: 1200, height: 850, script: 30000 });
  const row = { d };
  try {
    await driver.setTO(g.s, { script: 30000, pageLoad: 30000 });
    if (d) await new Promise((r) => setTimeout(r, d));
    row.p1 = await g.ev('return { t: +performance.now().toFixed(0), ready: !!(window.__LW && __LW.ready), presents: window.__LW ? __LW.stats.presents : -1 }');
    await driver.go(g.s, url);
    const w = await g.waitFor('window.__LW&&__LW.ready', 200, 100);
    row.ready2 = !!w.ok;
    const s = await g.ev(`const raf = await Promise.race([new Promise(r => requestAnimationFrame(() => r('raf'))), new Promise(r => setTimeout(() => r('timeout'), 2000))]);
      return { raf, frames: __LW.stats.frames, ok: __LW.field.ok, errs: __e.length };`);
    Object.assign(row, s);
  } catch (e) { row.error = String(e && e.message || e).slice(0, 120); }
  finally { await g.close(); }
  rows.push(row);
  console.log(P, n, JSON.stringify(row));
}
const by = {};
for (const r of rows) { const k = r.p1 ? (r.p1.presents > 0 ? 'after-first-present' : r.p1.ready ? 'ready-no-present' : 'booting') : 'unknown'; (by[k] = by[k] || { n: 0, stalled: 0 }).n++; if (r.raf !== 'raf') by[k].stalled++; }
console.log('SUMMARY ' + P + ' ' + JSON.stringify(by));
fs.writeFileSync('/tmp/lwM-navphase-' + P.replace(/\W+/g, '_') + '.json', JSON.stringify(rows, null, 1));
