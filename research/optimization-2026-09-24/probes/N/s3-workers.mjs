/* s3-workers.mjs — seam 3's behaviour read: no worker at boot; the bow, the period scan and a card solve each start their
 * own worker and answer; the busy mark counts the jobs; parking the page parks the started workers.
 *   LW_PORT=8726 GD_PORT=5245 node research/optimization-2026-09-24/probes/N/s3-workers.mjs <tag> */
import { page, save } from './lib.mjs';
const g = await page();
const R = {};
try {
  R.read = await g.ev(`const out = { boot: __LW.maths.started, ok: __LW.maths.ok };
    const pw = __LW.maths.call({ op: 'warm', ham: 'hydrogen', Z: 1 }); out.busyDuring = __LW.busy.count; const w = await pw; out.warm = !!w && !w.error;
    const s = await __LW.background.scanNow(); out.scan = !!s && !s.error && Number.isFinite(s.T);
    await __LW.helium.prepare(); out.helium = __LW.helium.computed;
    out.after = __LW.maths.started; out.busyAfter = __LW.busy.count;
    out.stat = await __LW.background.workerStat();
    out.errors = (window.__e || []).slice(); return out;`);
} catch (e) { R.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
