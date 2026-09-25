/* PACE · P1's Firefox gate (headless, gatekit): the capability must read NOT paced (Firefox resolves onSubmittedWorkDone on
 * a ~100 ms poll, AUDIT-A FA5), so the loop never holds a frame: skipped 0, inFlight 0, presents = loop frames.
 *   LW_PORT=8734 GD_PORT=5250 node research/optimization-2026-09-24/probes/PACE/pace-firefox.mjs [tag] */
import { page, save } from '../LA/lib.mjs';
const g = await page();
try {
  const out = await g.ev(`await new Promise(r=>setTimeout(r,4000));   /* the capability chain ends on its own (≤ 30 tries) */
    const f=__LW.field, S=__LW.stats;
    const boot={ paced:f.paced, inFlight:f.inFlight, waits:f.paceWaits||null, skippedDefined:S.skipped!==undefined };
    __LW.pause(); await __LW.settle(); await new Promise(r=>setTimeout(r,300));
    const p0=S.presents, fr0=S.frames, k0=S.skipped||0; let n=0, inMax=0; __LW.play(); const t0=performance.now();
    await new Promise(r=>{ const g=()=>{ n++; inMax=Math.max(inMax, f.inFlight||0); if(performance.now()-t0<3000) requestAnimationFrame(g); else r(); }; requestAnimationFrame(g); });
    const dt=(performance.now()-t0)/1000; __LW.pause();
    return { boot, play:{ seconds:+dt.toFixed(2), rafPerS:+(n/dt).toFixed(1), loopFramesPerS:+((S.frames-fr0)/dt).toFixed(1), presentsPerS:+((S.presents-p0)/dt).toFixed(1), skipped:(S.skipped||0)-k0, inFlightMax:inMax, paced:f.paced }, ua:navigator.userAgent };`);
  console.log(JSON.stringify(out, null, 1));
  console.log('wrote', save(import.meta.url, out));
} finally { await g.close(); }
