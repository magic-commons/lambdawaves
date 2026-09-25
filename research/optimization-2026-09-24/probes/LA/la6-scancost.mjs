/* la6-scancost.mjs — how long one forced (synchronous) period scan takes on the BOX packet under a Zeeman field: the
 * state LA6's timeout road needs (a scan that outruns the worker's 8 s ceiling).
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/la6-scancost.mjs <tag> [bz,bz,…] */
import { page, save } from './lib.mjs';
const bzs = (process.argv[3] || '0,0.001,0.003,0.01,0.03').split(',').map(Number);
const g = await page();
const R = {};
try {
  R.cost = await g.ev(`__LW.setHamiltonian('well'); __LW.setGasBasis('reg'); __LW.launchPacket([-3.3, 0.7, 0.2], [1.1, 0.1, 0], 1.3); __LW.pause(); await __LW.settle();
    const out = []; for (const bz of ${JSON.stringify(bzs)}) { __LW.reg.setField({ Bz: bz }); const t0 = performance.now(); const P = __LW.period;
      out.push({ bz, ms: +(performance.now() - t0).toFixed(0), populated: __LW.reg.populated().length, P: P && { exact: P.exact, count: P.count, pairs: P.pairs, T: P.T } }); }
    __LW.reg.setField({ Bz: 0 }); return out;`);
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
