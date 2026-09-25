/* la5-idle.mjs — LA5's gate: idle is literally zero (no timer, no idle callback), and the kick tables are still warm
 * by the time a hand reaches the K key after an OPERATOR switch.
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/la5-idle.mjs <tag> */
import { page, save } from './lib.mjs';
const g = await page();
const R = {};
try {
  await g.ev(`window.__t = { st: 0, ric: 0, on: false };
    const st = window.setTimeout; window.setTimeout = function (...a) { if (__t.on) __t.st++; return st.apply(window, a); };
    const ric = window.requestIdleCallback; if (ric) window.requestIdleCallback = function (...a) { if (__t.on) __t.ric++; return ric.apply(window, a); };
    return 1;`);
  /* boot's warm-up finishes (the 3 s arm + the idle slices), then 10 s of a paused, untouched instrument */
  R.idle = await g.ev(`__LW.pause(); await __LW.settle(); await new Promise((r) => setTimeout(r, 9000));
    const f0 = __LW.stats.frames; __t.st = 0; __t.ric = 0; __t.on = true; await new Promise((r) => setTimeout(r, 10000)); __t.on = false;
    return { setTimeout: __t.st - 1, requestIdleCallback: __t.ric, frames: __LW.stats.frames - f0 };`);   // −1: the probe's own 10 s wait
  /* an OPERATOR switch, then the K key ~5 s later: warm tables (tens of ms) or the cold build (~100+ ms)? */
  R.afterSwitch = await g.ev(`const T = (f) => { const t0 = performance.now(); f(); return +(performance.now() - t0).toFixed(1); };
    __LW.setHamiltonian('qho'); await __LW.settle(); __t.st = 0; __t.ric = 0; __t.on = true; await new Promise((r) => setTimeout(r, 5000)); __t.on = false;
    const warm = T(() => __LW.kick(0.2, 'z')); const timersDuring5s = { setTimeout: __t.st - 1, requestIdleCallback: __t.ric };
    __LW.setHamiltonian('cornell'); await __LW.settle(); const cold = T(() => __LW.kick(0.2, 'z'));
    await new Promise((r) => setTimeout(r, 6000)); __t.st = 0; __t.ric = 0; __t.on = true; await new Promise((r) => setTimeout(r, 6000)); __t.on = false;
    return { kickMsFiveSecondsAfterSwitch: warm, kickMsRightAfterSwitch: cold, timersIn5sAfterSwitch: timersDuring5s, timersIn6sOnceWarm: { setTimeout: __t.st - 1, requestIdleCallback: __t.ric } };`);
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
