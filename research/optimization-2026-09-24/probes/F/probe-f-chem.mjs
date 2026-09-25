/* probe-f-chem.mjs — LANE F: CHEMISTRY's real-time pump under a growing trace, in the gate's headless Firefox.
 *   LW_PORT=8721 GD_PORT=5236 node research/optimization-2026-09-24/probes/F/probe-f-chem.mjs
 * Claims under test: (a) chem.rt.spectrum is re-requested every ≥ 500 ms over the WHOLE accumulated trace, in the SAME
 * worker queue as chem.rt.run, so once the trace is long the run starves (steps delivered per second collapse);
 * (b) the pole fit (response-fit.js fitPoles) runs on the frame thread every 2 s once the fit window has 400+ samples. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 1000, script: 900000, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = {};
const ev = (s) => g.ev(s);
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  await ev(`__LW.layout.reopen('chem', 'R'); await __LW.settle(); return 1;`);
  R.solve = await ev(`const t = performance.now(); await __LW.chem.solve('H2O'); __LW.chem.setOn(true); await __LW.settle(); return { ms: +(performance.now() - t).toFixed(0), state: __LW.chem.state().stage };`);
  console.log('solve', JSON.stringify(R.solve));
  /* a window of the live pump: steps delivered per second, rAF gaps, and the longest main-thread stall seen by a 4 ms MessageChannel heartbeat */
  const WINDOW = `async (ms) => { const c = __LW.chem; const s0 = c.state().steps, t0 = performance.now(); const raf = []; let last = 0, on = true;
    const f = (t) => { if (last) raf.push(t - last); last = t; if (on) requestAnimationFrame(f); }; requestAnimationFrame(f);
    let beatLast = performance.now(), worst = 0; const mc = new MessageChannel(); mc.port1.onmessage = () => { const n = performance.now(); worst = Math.max(worst, n - beatLast); beatLast = n; if (on) setTimeout(() => mc.port2.postMessage(0), 4); }; mc.port2.postMessage(0);
    await new Promise((r) => setTimeout(r, ms)); on = false;
    raf.sort((a, b) => a - b); const st = c.state();
    return { stepsPerSec: +((st.steps - s0) / ((performance.now() - t0) / 1000)).toFixed(0), traceSamples: st.trace, fitWindow: st.fitWindow, fitted: !!st.fitted,
      rafMedian: +raf[raf.length >> 1].toFixed(1), rafMax: +raf[raf.length - 1].toFixed(1), rafOver100: raf.filter((x) => x > 100).length, frames: raf.length, worstStallMs: +worst.toFixed(1) }; }`;
  await ev(`window.__Fwin = ${WINDOW}; return 1;`);
  R.early = await ev(`__LW.chem.setSpeed(20); await __LW.chem.kick(); __LW.chem.setRun(true); const r = await __Fwin(8000); return r;`);
  console.log('early', JSON.stringify(R.early));
  R.later = await ev(`__LW.chem.setRun(false); const t = performance.now(); await __LW.chem.run(120000); const grow = performance.now() - t; __LW.chem.setRun(true); const r = await __Fwin(8000); r.growMs = +grow.toFixed(0); return r;`);
  console.log('later', JSON.stringify(R.later));
  await ev(`__LW.chem.setRun(false); return 1;`);
  R.errs = await ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
fs.writeFileSync('research/optimization-2026-09-24/probes/F/probe-f-chem.json', JSON.stringify(R, null, 1));
console.log('wrote research/optimization-2026-09-24/probes/F/probe-f-chem.json');
