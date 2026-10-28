/* play-lock-probe.mjs — 020 L3 THE PROOF (a diagnostic, not a gate): 10 s of play under WALL, LOCKED 60 and LOCKED DISPLAY, logging per
 * present [nowMs, clock.t, Δt, presents, autoScale, canvas.width], and printing per mode the coefficient of variation of Δt (logical) and of
 * the present interval (wall), the count of each > 1.5 × its median, the canvas reallocations, presents/s and reconstructs/s.
 *   LW_PORT=9677 GD_PORT=5677 node tools/perf/play-lock-probe.mjs [--headed] [--sec 10] [--preset 1s%2B2pz] [--res 64] [--out file.json]
 * Headless Firefox's ceiling is the compositor's (017 P0), so a headless run says whether time steps evenly, not how fast a screen draws.
 * 021 R3 · ONE TIME: an LFO routed to HUE (MACRO 1 ← SOURCE 1, 0…0.1) runs beside ψ, and each row also logs the modulation clock's seconds
 * (the beat's clock, `LW.mod.diagnostics().clock.seconds`); per mode the probe prints its step's CV and distinct values beside Δt's. */
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = process.env.LW_PORT || '9677', HEADED = process.argv.includes('--headed');
const SEC = +arg('--sec', 10), PRESET = arg('--preset', '1s%2B2pz'), RES = +arg('--res', 64), OUT = arg('--out', '');
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=${PRESET}&sw=0`, { width: 1600, height: 1000, script: 600000, headless: !HEADED, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = { at: new Date().toISOString(), headed: HEADED, sec: SEC, preset: decodeURIComponent(PRESET), res: RES, modes: [] };
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
const cv = (a) => { if (a.length < 2) return 0; const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)) / m; };
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.boot = await g.ev(`return { adapter: __LW.field.adapterInfo, dpr: devicePixelRatio, w: innerWidth, h: innerHeight }`);
  await g.ev(`__LW.pause(); __LW.quality.res = ${RES}; __LW.schedule(4); await __LW.settle();
    __LW.mod.bind('m1', 's1'); window.__probeRoute = __LW.mod.route('m1', 'material.hue', 0, 0.1);`);
  for (const [label, lock, hz] of [['WALL', false, 0], ['LOCKED 60', true, 60], ['LOCKED DISPLAY', true, 0]]) {
    const rows = await g.ev(`const LW = __LW, cv = document.getElementById('field');
      LW.fieldRate.lock = ${lock}; LW.fieldRate.hz = ${hz}; LW.quality.autoScale = 1;
      await LW.settle(); await new Promise((r) => setTimeout(r, 400));
      const rows = [], r0 = LW.stats.reconstructs; let last = LW.stats.presents, t0 = 0;
      LW.play();
      await new Promise((done) => { const f = (now) => { if (!t0) t0 = now;
        if (LW.stats.presents !== last) { last = LW.stats.presents; rows.push([now, LW.clock.t, LW.clock.lastDt, last, LW.quality.autoScale, cv.width, LW.mod.diagnostics().clock.seconds]); }
        if (now - t0 < ${SEC * 1000}) requestAnimationFrame(f); else done(); }; requestAnimationFrame(f); });
      LW.pause(); LW.fieldRate.lock = false; LW.fieldRate.hz = 0;
      return { rows, recon: LW.stats.reconstructs - r0, rate: LW.clock.rate, errs: window.__e || null };`);
    const P = rows.rows, n = P.length, span = n > 1 ? (P[n - 1][0] - P[0][0]) / 1000 : 1;
    const dts = P.map((p) => p[2]).filter((d) => d > 0), ivs = P.slice(1).map((p, i) => p[0] - P[i][0]);
    const mdt = med(dts), miv = med(ivs);
    const mds = P.slice(1).map((p, i) => +(p[6] - P[i][6]).toPrecision(9)).filter((d, i) => d > 0 && P[i + 1][2] > 0);   // the beat's clock, on the presents ψ stepped
    let realloc = 0; for (let i = 1; i < n; i++) if (P[i][5] !== P[i - 1][5]) realloc++;
    const m = { label, presents: n, presentsPerSec: +(n / span).toFixed(1), reconPerSec: +(rows.recon / span).toFixed(1),
      dtMedian: +mdt.toPrecision(6), dtCV: +cv(dts).toFixed(4), dtOver: dts.filter((d) => d > 1.5 * mdt).length, dtDistinct: new Set(dts).size,
      ivMedianMs: +miv.toFixed(2), ivCV: +cv(ivs).toFixed(4), ivOver: ivs.filter((d) => d > 1.5 * miv).length, ivMaxMs: +Math.max(0, ...ivs).toFixed(1),
      modDtMedian: +med(mds).toPrecision(6), modDtCV: +cv(mds).toFixed(4), modDtDistinct: new Set(mds).size,
      realloc, scales: [...new Set(P.map((p) => p[4]))], widths: [...new Set(P.map((p) => p[5]))], rate: rows.rate, errs: rows.errs };
    if (hz) m.expectDt = rows.rate / hz;
    R.modes.push({ ...m, rows: P });
    console.log(JSON.stringify(m));
  }
  await g.ev(`__LW.mod.unroute(window.__probeRoute); __LW.mod.bind('m1', null); return 1;`);
  R.gpu = await g.ev(`return await __LW.gpuFrameMs(24)`);   // the field's own GPU cost per frame (reconstruct + march): can it meet the cadence at all?
  console.log('gpu', JSON.stringify(R.gpu));
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
if (OUT) fs.writeFileSync(OUT, JSON.stringify(R));
