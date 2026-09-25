/* la8-export.mjs — LA8's gate (a copy of probes/F/probe-f-export.mjs on the LA server): a REBUILD asked for DURING an
 * export must not be dropped — after the export the field marches the grid the control shows.
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/la8-export.mjs <tag> */
import { page, save } from './lib.mjs';
const g = await page('preset=1s%2B2pz&sw=0', { width: 1400, height: 900, prefs: undefined });
const R = {};
try {
  R.exportDropsRebuild = await g.ev(`__LW.pause(); __LW.quality.res = 64; __LW.schedule(4); await __LW.settle();
    const before = __LW.field.resolution;
    const run = __LW.captureUI.exportFrames({ download: false, fps: 12 });
    await new Promise((r) => setTimeout(r, 1500));
    __LW.quality.res = 96; __LW.quality.steps = 160; __LW.quality.scale = 1; __LW.schedule(__LW.TIER.REBUILD);
    const scheduledDuring = __LW.stats.scheduled;
    await __LW.captureUI.exportFrames();          // a second press is STOP EXPORT
    const r = await run;
    await __LW.settle(); await new Promise((res) => setTimeout(res, 300));
    return { before, askedDuringExport: 96, afterExport: __LW.field.resolution, qualityRes: __LW.quality.res, exportResult: r && (r.ok ? 'ok' : r.stopped ? 'stopped' : (r.message || r.error || 'refused')), scheduledDuring };`);
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
