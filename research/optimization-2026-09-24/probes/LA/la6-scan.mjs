/* la6-scan.mjs — LA6's gate: one period scan in flight, latest key coalesced, a timed-out scan tracked to the worker's
 * real completion.
 *   STORM (probes/F/probe-f-scanstorm.mjs on the LA server): the BOX packet, Bz nudged every frame for 4 s, paused →
 *     how long until the scan worker answers a bookkeeping `stat` again, and how many scans it ran.
 *   TIMEOUT (Sol §5.8): a radius-7 Zeeman box state whose scan measured 13.6 s (past the 8 s ceiling); two newer keys
 *     arrive while it runs → the queue (worker jobs), when the readout shows the LATEST key's answer, the stat latency.
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/la6-scan.mjs <tag> [storm|timeout|both] */
import { page, save } from './lib.mjs';
const which = process.argv[3] || 'both';
const R = {};
const RO = `const ro = () => { const e = document.querySelector('.ro.period .ro-val'); return e ? e.textContent : null; };`;
if (which !== 'timeout') {
  const g = await page('preset=1s%2B2pz&sw=0', { width: 1400, height: 900 });
  try {
    R.storm = await g.ev(`${RO} __LW.setHamiltonian('well'); __LW.setGasBasis('reg'); __LW.launchPacket([-3.3, 0.7, 0.2], [1.1, 0.1, 0], 1.3); __LW.pause(); await __LW.settle();
      const stat = () => __LW.background.workerStat().then((s) => s.scan);
      __LW.schedule(__LW.TIER.PRESENT); await new Promise((r) => setTimeout(r, 1500)); const s0 = await stat();
      let on = true, n = 0; const f = () => { if (!on) return; n++; __LW.reg.setField({ Bz: 1e-4 * (1 + (n % 50)) }); __LW.schedule(__LW.TIER.PRESENT); requestAnimationFrame(f); }; requestAnimationFrame(f);
      await new Promise((r) => setTimeout(r, 4000)); on = false; const lastBz = __LW.reg.field.Bz; const tEnd = performance.now();
      let s2 = null, tries = 0; while (performance.now() - tEnd < 150000) { tries++; s2 = await stat(); if (s2 && !s2.error) break; }
      const statMs = +(performance.now() - tEnd).toFixed(0);
      /* and the readout: does it land on the LAST key, and when? */
      let landedMs = null; while (performance.now() - tEnd < 150000) { const v = ro(); if (v && v !== '…') { landedMs = +(performance.now() - tEnd).toFixed(0); break; } await new Promise((r) => setTimeout(r, 100)); }
      const s3 = await stat(); const shown = ro();
      const P = landedMs === null ? null : __LW.period; const expect = P ? P.T : null;   /* the oracle for the LAST key, forced here, after the readout was read */
      return { readoutMatchesLastKey: !!(P && shown && shown.includes(String(expect.toFixed(expect >= 1000 ? 0 : expect >= 100 ? 1 : 2)))), expectT: expect, framesOfStimulus: n, statAnswersAfterMs: statMs, statTries: tries, scansRunDuringAndAfter: s3 && s0 ? s3.jobs - s0.jobs : null, workerBusyMs: s3 && s0 ? +(s3.busyMs - s0.busyMs).toFixed(0) : null, readoutLandsAfterMs: landedMs, readout: shown, lastBz };`);
    R.stormErrs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
  } catch (e) { R.stormError = String(e && e.stack || e); console.error(e); }
  finally { await g.close(); }
  console.log('storm', JSON.stringify(R.storm || R.stormError));
}
if (which !== 'storm') {
  const g = await page('preset=1s%2B2pz&sw=0', { width: 1400, height: 900 });
  try {
    R.timeout = await g.ev(`${RO} __LW.setHamiltonian('well'); __LW.setGasBasis('reg');
      const S = __LW.serialize(); const h = Object.assign({}, S.presentation.hamiltonian, { id: 'well', well: 7 });
      __LW.restore({ experiment: S.experiment, presentation: { hamiltonian: h } }, { keepTime: true });
      __LW.launchPacket([-2.3, 0.5, 0.2], [1.1, 0.1, 0], 1.0); __LW.pause(); await __LW.settle(); await new Promise((r) => setTimeout(r, 1200));
      const stat = () => __LW.background.workerStat().then((s) => s.scan);
      const s0 = await stat(); const t0 = performance.now(), log = [];
      const at = () => +(performance.now() - t0).toFixed(0);
      __LW.reg.setField({ Bz: 0.003 }); __LW.schedule(__LW.TIER.PRESENT); log.push(['key 1 (Bz .003)', at()]);
      await new Promise((r) => setTimeout(r, 1500)); __LW.reg.setField({ Bz: 0.004 }); __LW.schedule(__LW.TIER.PRESENT); log.push(['key 2 (Bz .004)', at()]);
      await new Promise((r) => setTimeout(r, 1500)); __LW.reg.setField({ Bz: 0.005 }); __LW.schedule(__LW.TIER.PRESENT); log.push(['key 3 (Bz .005)', at()]);
      /* the readout must end on key 3's answer; poll it (never __LW.period, which would scan here) */
      let last = ro(), landed = null; while (performance.now() - t0 < 110000) { const v = ro(); if (v !== last) { log.push(['readout ' + v, at()]); last = v; } if (v && v !== '…' && v !== '—') { landed = at(); break; } await new Promise((r) => setTimeout(r, 200)); }
      /* then the worker must be idle: a stat answers at once */
      const ts = performance.now(); const s1 = await stat(); const statMs = +(performance.now() - ts).toFixed(0);
      /* the oracle: key 3's answer, computed here (synchronously) — the readout must print it */
      const P = __LW.period; const expect = P.T; await __LW.settle();
      return { log, readoutLandsAtMs: landed, readout: ro(), expectT: expect, readoutMatchesKey3: !!(ro() && ro().includes(String(expect.toFixed(expect >= 1000 ? 0 : expect >= 100 ? 1 : 2)))), scansRun: s1 && s0 ? s1.jobs - s0.jobs : null, workerBusyMs: s1 && s0 ? +(s1.busyMs - s0.busyMs).toFixed(0) : null, statAfterLandingMs: statMs };`);
    R.timeoutErrs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
  } catch (e) { R.timeoutError = String(e && e.stack || e); console.error(e); }
  finally { await g.close(); }
  console.log('timeout', JSON.stringify(R.timeout || R.timeoutError));
}
save(import.meta.url, R);
