/* probe-f-scanstorm.mjs — the period-scan queue under a register that changes every frame without a pointer or a
 * rotation drive (what a modulator routed to a register-affecting control does).  periodNow() posts a NEW 2e6-step
 * scan whenever the key moves and never cancels the old one, so the scan worker's FIFO can only grow.
 *   LW_PORT=8721 GD_PORT=5236 node research/optimization-2026-09-24/probes/F/probe-f-scanstorm.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 300000 });
const R = {};
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.storm = await g.ev(`__LW.setHamiltonian('well'); __LW.setGasBasis('reg'); __LW.launchPacket([-3.3, 0.7, 0.2], [1.1, 0.1, 0], 1.3); __LW.pause(); await __LW.settle();
    __LW.period;   /* warm the scan worker (a forced read runs here; the worker starts on the next frame read) */
    const stat = () => __LW.background.workerStat().then((s) => s.scan);
    await new Promise((r) => setTimeout(r, 1500)); const s0 = await stat();
    /* 4 s of a register that moves every frame (a Zeeman field nudged per rAF), transport PAUSED: periodText runs every frame */
    let on = true, n = 0; const f = () => { if (!on) return; n++; __LW.reg.setField({ Bz: 1e-4 * (1 + (n % 50)) }); __LW.schedule(__LW.TIER.PRESENT); requestAnimationFrame(f); }; requestAnimationFrame(f);
    await new Promise((r) => setTimeout(r, 4000)); on = false; const s1 = await stat();
    /* how long until the scan worker answers a bookkeeping stat again (it queues behind every posted scan) */
    const t0 = performance.now(); let s2 = null, tries = 0, busyShown = 0;
    while (performance.now() - t0 < 120000) { tries++; const m = document.querySelector('#title .mark'); if (m && m.classList.contains('busy')) busyShown++; s2 = await stat(); if (s2 && !s2.error) break; }
    const drainMs = +(performance.now() - t0).toFixed(0);
    return { framesOfStimulus: n, before: s0, afterStimulus: s1, drained: s2, drainMsAfterStimulus: drainMs, statTries: tries, busyMarkUpOnPolls: busyShown, jobsTotal: s2 && s0 ? s2.jobs - s0.jobs : null, busyMsTotal: s2 && s0 ? s2.busyMs - s0.busyMs : null };`);
  console.log(JSON.stringify(R.storm));
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
fs.writeFileSync('research/optimization-2026-09-24/probes/F/probe-f-scanstorm.json', JSON.stringify(R, null, 1));
