/* w125-table.mjs — W125-1's gates on the default tree (the gas table ON by default, armed at boot):
 *   1. IDLE (the LA5 pattern): a default boot that never opens AXIAL 256 schedules ZERO idle callbacks and ZERO timers in
 *      10 s once boot's own warm-ups are done, the table reads 'building' (armed) — and it was NEVER BUILT: the cached
 *      gasRadialTable() of the app's own gas.js instance still costs a full build when the probe finally asks for it.
 *      The same boot with ?gastab=0 is the control (same idle-callback count since ready: the K4 warm only).
 *   2. THE FIRST AXIAL PRESS (setGasBasis('axial') + enterBox(), after boot's K4 warm, as a hand would), its synchronous
 *      cost with the table armed vs off, the time until the table is 'on', the longest single idle callback while it
 *      builds (the frame thread never waits for it), then three more presses with the table on.
 *   3. THE BOX SCENE (AXIAL 256 playing, governor and AUTO SCALE off) at 64³ and 128³: frames per second over 5 s with the
 *      table on and off (headless Firefox, GPU-bound).
 *   LW_PORT=8729 GD_PORT=5247 node research/optimization-2026-09-24/probes/W125/w125-table.mjs <tag> */
import { page, save } from '../LA/lib.mjs';
const R = {};
const COUNTERS = `window.__t = { st: 0, ric: 0, since: 0, cbN: 0, cbMax: 0, on: false };
  const st = window.setTimeout; window.setTimeout = function (...a) { if (__t.on) __t.st++; return st.apply(window, a); };
  const ric = window.requestIdleCallback;
  window.requestIdleCallback = function (cb, o) { __t.since++; if (__t.on) __t.ric++;
    return ric.call(window, (dl) => { const a = performance.now(); try { return cb(dl); } finally { const d = performance.now() - a; __t.cbN++; if (d > __t.cbMax) __t.cbMax = d; } }, o); };
  return 1;`;
const IDLE = `__LW.pause(); await __LW.settle(); await new Promise((r) => setTimeout(r, 9000));
  const f0 = __LW.stats.frames; __t.st = 0; __t.ric = 0; __t.on = true; await new Promise((r) => setTimeout(r, 10000)); __t.on = false;
  const out = { table: __LW.gasTable(), gasOn: __LW.gas.on, setTimeout: __t.st - 1, requestIdleCallback: __t.ric, frames: __LW.stats.frames - f0, idleCallbacksSinceReady: __t.since };
  const gj = await import('/lab/gas.js'); const a = performance.now(); gj.gasRadialTable(); out.firstGasRadialTableMs = +(performance.now() - a).toFixed(1);
  const b = performance.now(); gj.gasRadialTable(); out.secondGasRadialTableMs = +(performance.now() - b).toFixed(2);
  return out;`;
for (const [mode, q] of [['default', 'preset=1s%2B2pz&sw=0'], ['off', 'preset=1s%2B2pz&sw=0&gastab=0']]) {
  let g = await page(q);
  try { await g.ev(COUNTERS); R['idle-' + mode] = await g.ev(IDLE); } catch (e) { R['idle-' + mode] = { E: String(e && e.stack || e) }; }
  finally { await g.close(); }
  g = await page(q);
  try {
    await g.ev(COUNTERS);
    R['press-' + mode] = await g.ev(`const LW = __LW; LW.pause(); await LW.settle(); await new Promise((r) => setTimeout(r, 6000));
      LW.governor.on = false; LW.quality.auto = false; LW.quality.autoScale = 1; LW.setHamiltonian('well'); await LW.settle();
      const T = (f) => { const a = performance.now(); f(); return +(performance.now() - a).toFixed(2); };
      __t.cbN = 0; __t.cbMax = 0; const t0 = performance.now();
      const out = { tableBefore: LW.gasTable(), firstPressMs: T(() => { LW.setGasBasis('axial'); LW.enterBox(); }), tableAtPress: LW.gasTable() };
      LW.pause();
      for (let i = 0; i < 400 && LW.gasTable() === 'building'; i++) await new Promise((r) => setTimeout(r, 5));
      out.table = LW.gasTable(); out.settledAfterMs = +(performance.now() - t0).toFixed(0); out.idleCallbacksDuringBuild = __t.cbN; out.longestIdleCallbackMs = +__t.cbMax.toFixed(2);
      await LW.settle();
      out.laterPressesMs = []; for (let i = 0; i < 3; i++) { LW.clock.scrub(0); out.laterPressesMs.push(T(() => LW.enterBox())); LW.pause(); await LW.settle(); }
      out.errs = (window.__e || []).slice(0, 5);
      return out;`);
    if (mode === 'default') R.box = await g.ev(`const LW = __LW, out = {};
      for (const n of [64, 128]) {
        LW.quality.res = n; LW.quality.steps = { 64: 110, 96: 160, 128: 240 }[n]; LW.quality.scale = 1; LW.schedule(4); await LW.settle(); await LW.settle();
        for (const on of [true, false, true, false]) {
          LW.gasTable(on); for (let i = 0; i < 200 && LW.gasTable() !== (on ? 'on' : 'off'); i++) await new Promise((r) => setTimeout(r, 10));
          LW.clock.scrub(0); LW.enterBox(); await new Promise((r) => setTimeout(r, 1000));
          const f0 = LW.stats.frames, r0 = LW.stats.reconstructs, t0 = performance.now();
          await new Promise((r) => setTimeout(r, 5000));
          const s = (performance.now() - t0) / 1000, k = n + (on ? ':table' : ':recurrence');
          const fps = +((LW.stats.frames - f0) / s).toFixed(1), rps = +((LW.stats.reconstructs - r0) / s).toFixed(1);
          out[k] = out[k] ? { fps: Math.max(out[k].fps, fps), reconstructsPerS: Math.max(out[k].reconstructsPerS, rps), res: LW.field.resolution } : { fps, reconstructsPerS: rps, res: LW.field.resolution };
          LW.pause(); await LW.settle();
        }
      }
      LW.gasTable(true); return out;`);
  } catch (e) { R['press-' + mode] = { E: String(e && e.stack || e) }; }
  finally { await g.close(); }
}
console.log(JSON.stringify(R, null, 1));
save(import.meta.url, R);
