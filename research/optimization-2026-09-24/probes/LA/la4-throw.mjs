/* la4-throw.mjs — LA4's gate: one exception on the frame path must not end the loop, must be reported once, and a
 * throw that repeats every frame must not hot-loop a paused instrument.
 *   A  playing: field.frame throws ONCE            → stats.frames keeps rising, __e gains exactly one entry
 *   B  paused:  a throw BEFORE the tier read, on EVERY frame (a throwing mat.axisMode getter)  → a handful of loop
 *      calls, not sixty a second; one entry; the instrument frames again once the fault is gone
 *   C  playing: field.frame throws on EVERY frame for 1.5 s → the loop keeps its cadence, one entry
 *   D  paused:  field.frame throws on EVERY frame (after the tier read) → no hot loop
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/la4-throw.mjs <tag> */
import { page, save } from './lib.mjs';
const g = await page();
const R = {};
const SHIM = `if (!window.__lc) { window.__lc = 0; const o = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) { return o((ts) => { if (cb.name === 'loop') window.__lc++; cb(ts); }); }; } return 1;`;
const wait = (ms) => `await new Promise((r) => setTimeout(r, ${ms}));`;
try {
  await g.ev(SHIM);
  await g.ev(`__LW.pause(); await __LW.settle(); return 1;`);
  R.A = await g.ev(`const F = __LW.field, orig = F.frame; let n = 0; const e0 = __e.length;
    F.frame = function (...a) { if (n++ === 0) throw new Error('probe A: one throw in field.frame'); return orig.apply(this, a); };
    const f0 = __LW.stats.frames, c0 = __lc; __LW.play(); ${wait(1500)} const f1 = __LW.stats.frames, c1 = __lc; __LW.pause(); ${wait(300)}
    F.frame = orig; return { framesDuring: f1 - f0, loopCalls: c1 - c0, errsAdded: __e.slice(e0).map(String), stillScheduling: __LW.stats.frames > f0 };`);
  R.B = await g.ev(`const M = __LW.mat, e0 = __e.length; const wasAxis = M.axis, wasMode = M.axisMode;
    __LW.pause(); ${wait(300)} M.axis = true;
    Object.defineProperty(M, 'axisMode', { configurable: true, enumerable: true, get() { throw new Error('probe B: a throw before the tier read, every frame'); } });
    const f0 = __LW.stats.frames, c0 = __lc; __LW.schedule(__LW.TIER.PRESENT); ${wait(1500)} const f1 = __LW.stats.frames, c1 = __lc;
    delete M.axisMode; M.axisMode = wasMode; M.axis = wasAxis;
    __LW.schedule(__LW.TIER.PRESENT); ${wait(500)} const f2 = __LW.stats.frames;
    return { loopCallsIn1500ms: c1 - c0, framesDuring: f1 - f0, framesAfterFix: f2 - f1, errsAdded: __e.slice(e0).map(String) };`);
  R.C = await g.ev(`const F = __LW.field, orig = F.frame, e0 = __e.length;
    F.frame = function () { throw new Error('probe C: field.frame throws every frame'); };
    const c0 = __lc; __LW.play(); ${wait(1500)} const c1 = __lc; __LW.pause(); ${wait(200)} F.frame = orig; __LW.schedule(__LW.TIER.PRESENT); ${wait(400)}
    return { loopCallsIn1500ms: c1 - c0, errsAdded: __e.slice(e0).map(String) };`);
  R.D = await g.ev(`const F = __LW.field, orig = F.frame, e0 = __e.length; __LW.pause(); ${wait(300)}
    F.frame = function () { throw new Error('probe D: field.frame throws every frame, paused'); };
    const c0 = __lc; __LW.schedule(__LW.TIER.PRESENT); ${wait(1500)} const c1 = __lc; F.frame = orig;
    const f1 = __LW.stats.frames; __LW.schedule(__LW.TIER.PRESENT); ${wait(400)}
    return { loopCallsIn1500ms: c1 - c0, framesAfterFix: __LW.stats.frames - f1, errsAdded: __e.slice(e0).map(String) };`);
  R.errsAll = await g.ev('return (window.__e || []).map(String).slice(0, 20)');
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
