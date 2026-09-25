/* la1-ring.mjs — LA1's gate: does __LW.perf.median hold the median of the last 60 frames or the last frame alone?
 * Adapted from probes/B/ring-check.mjs: the 64³ axial gas in FULL mode (gas.stats, ~10 ms, every 6th CPU tick), a shim
 * around the rAF callback named `loop` recording its whole cost, and after every frame what the getters say.
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/la1-ring.mjs <tag> */
import { page, save } from './lib.mjs';
const g = await page();
const R = {};
try {
  const rows = await g.ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause(); __LW.quality.res=64; __LW.quality.steps=110; __LW.perf.setMode('full'); __LW.schedule(4); await __LW.settle();
    const rows=[]; const o=window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame=function(cb){ return o((ts)=>{ if(cb.name!=='loop'){cb(ts);return;} const t0=performance.now(); cb(ts); rows.push({ms:+(performance.now()-t0).toFixed(3), lw:+__LW.perf.median.toFixed(3), loop: typeof __LW.perf.loopMedian === 'number' ? +__LW.perf.loopMedian.toFixed(3) : null, f:__LW.perf.counts.frames}); }); };
    __LW.perf.resetRing(); __LW.play(); await new Promise(r=>setTimeout(r,9000)); __LW.pause(); await __LW.settle();
    return rows;`);
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
  let equalsOwn = 0;
  for (const r of rows) if (Math.abs(r.lw - r.ms) < 0.02 * Math.max(0.5, r.ms)) equalsOwn++;
  /* at each row k ≥ 60: the whole-loop median of the last 60 shim rows vs what loopMedian says */
  const lagErr = [], lwVsShim = [];
  for (let k = 60; k < rows.length; k++) { const m = med(rows.slice(k - 59, k + 1).map((r) => r.ms)); if (rows[k].loop !== null) lagErr.push(+(rows[k].loop - m).toFixed(3)); lwVsShim.push(+(rows[k].lw - m).toFixed(3)); }
  const big = rows.filter((r) => r.ms > 5).length;
  /* the tell: right after a > 5 ms (gas.stats) frame, the last-frame getter reads ~that frame; a median does not move */
  const afterBig = rows.filter((r) => r.ms > 5).map((r) => ({ ms: r.ms, lw: r.lw, loop: r.loop }));
  let tracksSelf = 0; for (let k = 1; k < rows.length; k++) if (Math.abs(rows[k].lw - rows[k].ms) < Math.abs(rows[k].lw - rows[k - 1].ms)) tracksSelf++;
  R.summary = { frames: rows.length, framesOver5ms: big, lwEqualsOwnFrame: equalsOwn, lwEqualsOwnFrac: +(equalsOwn / Math.max(1, rows.length)).toFixed(3),
    shimMedianAll: med(rows.map((r) => r.ms)), lwAtEnd: rows.length ? rows[rows.length - 1].lw : null, loopMedianAtEnd: rows.length ? rows[rows.length - 1].loop : null,
    loopMinusShimMedian60: lagErr.length ? { median: med(lagErr), max: Math.max(...lagErr.map(Math.abs)) } : null,
    lwMinusShimMedian60: lwVsShim.length ? { median: med(lwVsShim), maxAbs: Math.max(...lwVsShim.map(Math.abs)) } : null,
    lwDistinctValues: new Set(rows.map((r) => r.lw)).size, tracksSelf, afterBig };
  R.first = rows.slice(0, 24);
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R.summary || R));
save(import.meta.url, R);
