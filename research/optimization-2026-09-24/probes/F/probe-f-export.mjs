/* probe-f-export.mjs — a REBUILD asked for DURING an export (schedule() returns before raising `pending` while
 * exportLocked) is dropped: after the export, the GRID the control shows is not the grid the field marches.
 *   LW_PORT=8721 GD_PORT=5236 node research/optimization-2026-09-24/probes/F/probe-f-export.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 300000 });
const R = {};
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.exportDropsRebuild = await g.ev(`__LW.pause(); __LW.quality.res = 64; __LW.schedule(4); await __LW.settle();
    const before = __LW.field.resolution;
    const run = __LW.captureUI.exportFrames({ download: false, fps: 12 });
    await new Promise((r) => setTimeout(r, 1500));
    /* the GRID segment's own road: quality.res + a REBUILD (rack.js gridSeg onChange) */
    __LW.quality.res = 96; __LW.quality.steps = 160; __LW.quality.scale = 1; __LW.schedule(__LW.TIER.REBUILD);
    const pendingDuring = __LW.stats.scheduled;
    await __LW.captureUI.exportFrames();          // a second press is STOP EXPORT
    const r = await run;
    await __LW.settle(); await new Promise((res) => setTimeout(res, 300));
    return { before, askedDuringExport: 96, afterExport: __LW.field.resolution, qualityRes: __LW.quality.res, exportResult: r && (r.ok ? 'ok' : r.stopped ? 'stopped' : (r.message || r.error || 'refused')), scheduledDuring: pendingDuring };`);
  console.log(JSON.stringify(R.exportDropsRebuild));
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
fs.writeFileSync('research/optimization-2026-09-24/probes/F/probe-f-export.json', JSON.stringify(R, null, 1));
