// LANE B: what does __LW.perf.median actually hold? Record, after every loop frame, the whole-loop ms (shim) and
// LW.perf.median read in the same task, in FULL mode on the 64³ axial gas (a 10 ms reader every 6th frame).
//   LW_PORT=8721 GD_PORT=5232 node research/optimization-2026-09-24/probes/B/ring-check.mjs
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const g = await open('https://127.0.0.1:8721/lab/?preset=1s%2B2pz&sw=0', { width: 1920, height: 1080, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  const r = await g.ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause(); __LW.quality.res=64; __LW.quality.steps=110; __LW.perf.setMode('full'); __LW.schedule(4); await __LW.settle();
    const rows=[]; const o=window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame=function(cb){ return o((ts)=>{ if(cb.name!=='loop'){cb(ts);return;} const t0=performance.now(); cb(ts); rows.push({ms:+(performance.now()-t0).toFixed(2), lw:+__LW.perf.median.toFixed(2), f:__LW.perf.counts.frames}); }); };
    __LW.perf.resetRing(); __LW.play(); await new Promise(r=>setTimeout(r,2500)); __LW.pause(); await __LW.settle();
    return rows;`);
  const rows = r.slice(0, 40);
  // hypothesis: lw after frame k === spent of frame k (the only nonzero slot) — so it tracks ms_k, not a 60-frame median
  let tracksSelf = 0, tracksPrev = 0;
  for (let k = 1; k < r.length; k++) { if (Math.abs(r[k].lw - r[k].ms) < Math.abs(r[k].lw - r[k - 1].ms)) tracksSelf++; else tracksPrev++; }
  const out = { n: r.length, tracksSelf, tracksPrev, rows };
  fs.writeFileSync('research/optimization-2026-09-24/probes/B/ring-check.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ n: r.length, tracksSelf, tracksPrev, first: rows.slice(0, 16) }));
} finally { await g.close(); }
