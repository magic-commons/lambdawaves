// VERIFIER RE-CHECK · wave 133 fix pass (6ac486f) — `untouched` attacked again.  Automation mode; untouched(false) is read through
// its one act (buildReady → take({alone:true}) synchronously), every sw field put back.  New scenes: a capture in flight (a short
// EXPORT FRAMES, RECORD), paused at t ≠ 0 in the foreground, the same session then hidden, and LATER pressed before the hide.
//   LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/recheck-untouched.mjs
import { writeFileSync } from 'node:fs';
import * as drv from '../../../../tools/gate/drv.mjs';
import { open } from '../../../../tools/gate/gatekit.mjs';

const PORT = process.env.LW_PORT || 8732;
const BASE = `https://127.0.0.1:${PORT}/lab/`;
const out = [];
const say = (k, v) => { out.push([k, v]); console.log(k, JSON.stringify(v)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HELP = `
  window.__w = (n) => new Promise((r) => setTimeout(r, n));
  window.__read = () => { const h = __LW.history; return { rows: h.entries().map((r) => r.label), canUndo: h.canUndo, dirty: __LW.projects.dirty, playing: __LW.clock.playing,
    t: +__LW.clock.t.toFixed(3), busy: __LW.captureUI ? __LW.captureUI.busy : null, active: document.activeElement ? document.activeElement.tagName : null }; };
  window.__untouched = () => { const sw = __LW.sw; let took = null; const rl = sw.reload; sw.reload = () => {};
    sw.state = 'idle'; sw.asked = false; sw.pending = { build: 'probe-' + Math.random() };
    const r = sw.buildReady((o) => { took = o || {}; });
    const quiet = !!(took && took.alone), pane = !document.getElementById('offer').hidden;
    sw.state = 'idle'; sw.asked = false; sw.take = null; sw.pending = null; sw.offered = null;
    document.getElementById('offer').hidden = true; const b = document.querySelector('#badges > .badge.build'); if (b) b.hidden = true; sw.reload = rl;
    return { untouchedFalse: quiet, offeredWithPane: !took && pane, returned: r }; };
  window.__hide = () => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));
    delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); };
  window.__settle = async () => { try { await __LW.settle(); } catch (e) {} await __w(700); try { await __LW.settle(); } catch (e) {} };
  return 1;`;

const g = await open(BASE, { width: 1400, height: 950, script: 180000, prefs: { 'privacy.reduceTimerPrecision': false } });
const ev = g.ev;
const go = async (url) => { await drv.go(g.s, 'about:blank'); await drv.go(g.s, url); await g.waitFor('window.__LW && __LW.ready', 400, 100); await ev(HELP); await ev('await __settle(); return 1;'); };
const pointer = (acts) => drv.actions(g.s, [{ type: 'pointer', id: 'p' + Math.random(), parameters: { pointerType: 'mouse' }, actions: acts }]);
const step = async (name, fn) => { try { say(name, await fn()); } catch (e) { say(name + ' ERROR', String(e && e.message || e).slice(0, 300)); } };
const U = async () => ({ read: await ev('return __read()'), u: await ev('return __untouched()') });

try {
  await step('R0 plain boot', async () => { await go(BASE); return U(); });
  await step('R1 scrubbed to t=137 (foreground)', async () => { await go(BASE); await ev('__LW.scrub(137); await __settle(); return 1;'); return U(); });
  await step('R2 played then paused (foreground)', async () => { await go(BASE); await ev('__LW.play(); await __w(1500); __LW.pause(); await __settle(); return 1;'); return U(); });

  /* R3 · the moved-clock session, then hidden: offered now, taken on the hide */
  await step('R3 t=137, offered, then the page hides', async () => {
    await go(BASE);
    return ev(`__LW.scrub(137); await __settle(); const sw = __LW.sw; sw.reload = () => {}; window.__took = null; sw.state = 'idle'; sw.pending = { build: 'r3' };
      const r = sw.buildReady((o) => { window.__took = o || {}; }); const now = { r, took: window.__took, state: sw.state, pane: !document.getElementById('offer').hidden };
      __hide(); const hidden = { took: window.__took, state: sw.state, t: __LW.clock.t };
      return { now, hidden };`);
  });

  /* R4 · the same, but the reader pressed LATER first (a real pointer on LATER) */
  await step('R4 t=137, offered, LATER pressed, then the page hides', async () => {
    await go(BASE);
    await ev(`__LW.scrub(137); await __settle(); const sw = __LW.sw; sw.reload = () => {}; window.__took = null; sw.state = 'idle'; sw.pending = { build: 'r4' };
      sw.buildReady((o) => { window.__took = o || {}; }); await __w(200); return 1;`);
    const t = await g.tap('#offer .offer-row .trig:last-child');
    const afterLater = await ev(`return { pane: !document.getElementById('offer').hidden, took: window.__took, state: __LW.sw.state }`);
    const hidden = await ev(`__hide(); return { took: window.__took, state: __LW.sw.state };`);
    return { tap: t, afterLater, hidden };
  });

  /* R5 · a short EXPORT FRAMES in flight, then after STOP EXPORT */
  await step('R5 EXPORT FRAMES in flight', async () => {
    await go(BASE);
    return ev(`const p = __LW.captureUI.exportFrames({ download: false, fps: 2, seconds: 6 }); let during = null;
      for (let i = 0; i < 400; i++) { await __w(15); if (__LW.captureUI.busy) { during = { read: __read(), u: __untouched() }; break; } }
      __LW.captureUI.exportFrames(); const r = await Promise.race([p, __w(60000).then(() => 'timeout')]); await __settle();
      return { during, stopResult: r && typeof r === 'object' ? { ok: r.ok, stopped: r.stopped } : r, after: { read: __read(), u: __untouched() } };`);
  });

  /* R6 · RECORD in flight, then stopped */
  await step('R6 RECORD in flight', async () => {
    await go(BASE);
    return ev(`const p = __LW.captureUI.record(); let during = null;
      for (let i = 0; i < 100; i++) { await __w(20); if (__LW.captureUI.busy) { during = { read: __read(), u: __untouched() }; break; } }
      __LW.captureUI.record(); await Promise.race([p, __w(6000)]); await __settle();
      return { during, after: { read: __read(), u: __untouched() } };`);
  });

  /* R7 · the unchanged roads, once more */
  await step('R7 real orbit drag', async () => {
    await go(BASE);
    const fp = await ev(`for (const [x, y] of [[innerWidth / 2, innerHeight / 2], [innerWidth / 2, innerHeight * 0.7]]) { const h = document.elementFromPoint(x, y); if (h && h.id === 'field') return { x: Math.round(x), y: Math.round(y) }; } return null;`);
    await pointer([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: fp.x, y: fp.y }, { type: 'pointerDown', button: 0 }, { type: 'pointerMove', duration: 250, origin: 'viewport', x: fp.x + 120, y: fp.y + 30 }, { type: 'pointerUp', button: 0 }]);
    await drv.relActions(g.s); await ev('await __w(1500); await __settle(); return 1;');
    return U();
  });
  await step('R8 pointer held on the stage (no move)', async () => {
    await go(BASE);
    const fp = await ev(`for (const [x, y] of [[innerWidth / 2, innerHeight / 2], [innerWidth / 2, innerHeight * 0.7]]) { const h = document.elementFromPoint(x, y); if (h && h.id === 'field') return { x: Math.round(x), y: Math.round(y) }; } return null;`);
    await pointer([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: fp.x, y: fp.y }, { type: 'pointerDown', button: 0 }]);
    const held = await U(); await pointer([{ type: 'pointerUp', button: 0 }]); await drv.relActions(g.s); await ev('await __settle(); return 1;');
    return { held, released: await U() };
  });
  await step('R9 notebook typed then blurred', async () => {
    await go(BASE);
    await ev(`__LW.layout.notebook.open(); await __settle(); document.querySelector('#notebook .nb-text').focus(); return 1;`);
    await drv.actions(g.s, [{ type: 'key', id: 'k' + Math.random(), actions: [...'abc'].flatMap((c) => [{ type: 'keyDown', value: c }, { type: 'keyUp', value: c }]) }]); await drv.relActions(g.s);
    await ev(`document.activeElement.blur(); await __settle(); return 1;`);
    const r = await U(); await ev(`const ta = document.querySelector('#notebook .nb-text'); ta.value = ''; ta.dispatchEvent(new Event('input', { bubbles: true })); localStorage.removeItem('lambdawaves.q0.notebook'); return 1;`);
    return r;
  });
  await step('R10 LFO added', async () => { await go(BASE); await ev(`__LW.mod.addSource('lfo'); await __settle(); return 1;`); return U(); });
  await step('R11 demo opened', async () => { await go(BASE); await ev(`const c0 = window.confirm; window.confirm = () => true; document.querySelector('.pj-demo').click(); for (let i = 0; i < 80; i++) { if (/DEMOS/.test(__LW.layout.projects.current || '')) break; await __w(50); } window.confirm = c0; await __w(1200); await __settle(); return 1;`); return U(); });
  await step('R12 NEW', async () => { await go(BASE); await ev(`await __LW.layout.projects.requestFresh(); await __w(1200); await __settle(); return 1;`); return U(); });
  await step('R13 ?preset=2pz', async () => { await go(BASE + '?preset=2pz'); return U(); });
  await step('R14 notice up (?warn=1)', async () => { await go(BASE + '?warn=1'); return U(); });
  await step('R15 AUDIO source', async () => { await go(BASE); await ev(`const md = navigator.mediaDevices; if (md) md.getUserMedia = () => Promise.reject(new Error('probe')); __LW.mod.addSource('audio'); await __settle(); return 1;`); return U(); });
  await step('R16 theme flipped', async () => { await go(BASE); const th = await ev('return document.body.dataset.theme'); await ev(`__LW.setTheme('${'dark'}' === document.body.dataset.theme ? 'light' : 'dark'); await __settle(); return 1;`); const r = await U(); await ev(`__LW.setTheme('${th}'); return 1;`); return r; });
  say('errors', await g.errors());
} catch (e) { say('PROBE ERROR', String(e && e.stack || e)); }
finally { writeFileSync(new URL('./recheck-untouched.out.json', import.meta.url), JSON.stringify(out, null, 1)); await g.close(); }
