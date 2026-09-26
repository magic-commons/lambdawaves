// VERIFIER PROBE · wave 133 — ATTACK `untouched`, part 3 (P1 and P7 of part 2, re-run with a settle that tolerates a stalled rAF): the transport played and paused,
// a window really moved, a pointer held with no value change, a SHORT exact export and a RECORD in flight, a preference, and WHY a
// link boot reads dirty (a diff of serialize() at LW.ready against the settled state).
//   LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/untouched-attack-3.mjs
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
  window.__read = () => { const h = __LW.history; return { rows: h.entries().map((r) => r.label), canUndo: h.canUndo, pending: h.pendingLabel,
    dirty: __LW.projects.dirty, playing: __LW.clock.playing, t: +__LW.clock.t.toFixed(3), active: document.activeElement ? document.activeElement.tagName + '.' + String(document.activeElement.className).slice(0, 20) : null, yaw: +__LW.obs.yaw.toFixed(4) }; };
  window.__untouched = () => { const sw = __LW.sw; let took = null; const rl = sw.reload; sw.reload = () => {};
    sw.state = 'idle'; sw.asked = false; sw.pending = { build: 'probe-' + Math.random() };
    sw.buildReady((o) => { took = o || {}; });
    const quiet = !!(took && took.alone);
    sw.state = 'idle'; sw.asked = false; sw.take = null; sw.pending = null; sw.offered = null;
    document.getElementById('offer').hidden = true; const b = document.querySelector('#badges > .badge.build'); if (b) b.hidden = true; sw.reload = rl;
    return quiet; };
  window.__settle = async () => { try { await __LW.settle(); } catch (e) {} await __w(700); try { await __LW.settle(); } catch (e) {} };
  return 1;`;

const g = await open(BASE, { width: 1400, height: 950, script: 120000, prefs: { 'privacy.reduceTimerPrecision': false } });
const ev = g.ev;
const go = async (url) => { await drv.go(g.s, url); await g.waitFor('window.__LW && __LW.ready', 400, 100); await ev(HELP); await ev('await __settle(); return 1;'); };
const reloadRead = async (expr) => { await ev('setTimeout(() => location.reload(), 10); return 1;'); await sleep(800); await g.waitFor('window.__LW && __LW.ready', 400, 100); await ev(HELP); await ev('await __settle(); return 1;'); return ev(`return (${expr})`); };
const pointer = (acts) => drv.actions(g.s, [{ type: 'pointer', id: 'p' + Math.random(), parameters: { pointerType: 'mouse' }, actions: acts }]);
const step = async (name, fn) => { try { say(name, await fn()); } catch (e) { say(name + ' ERROR', String(e && e.message || e).slice(0, 300)); } };

try {
  /* P1 · played, read while playing, paused */
  await step('P1 play 2 s, pause', async () => {
    await go(BASE);
    const r = await ev(`const t0 = __LW.clock.t; __LW.play(); await __w(2000); const mid = { t: __LW.clock.t, playing: __LW.clock.playing, rate: __LW.clock.rate };
      __LW.pause(); await __settle(); return { t0, mid, read: __read(), untouchedFalse: __untouched() };`);
    r.afterReload = await reloadRead('{ t: __LW.clock.t }');
    return r;
  });

  /* P7 · WHY a link boot reads dirty: serialize() at LW.ready vs settled, keys that moved */
  for (const [name, setup] of [['exposure only', `__LW.mat.exposure = 2.5;`], ['nothing changed', ``]]) {
    await step('P7 link boot · ' + name, async () => {
      await go(BASE);
      const href = await ev(`${setup} await __settle(); return __LW.link.mint().href;`); if (typeof href !== 'string') throw new Error('mint: ' + JSON.stringify(href));
      await drv.go(g.s, href);
      const early = await ev(`for (let i = 0; i < 600; i++) { if (window.__LW && __LW.ready) break; await new Promise((r) => setTimeout(r, 5)); }
        return { dirty: __LW.projects.dirty, S: JSON.stringify(__LW.serialize()) };`);
      await ev(HELP); await ev('await __settle(); await __w(1500); await __settle(); return 1;');
      const late = await ev(`return { dirty: __LW.projects.dirty, S: JSON.stringify(__LW.serialize()), rows: __LW.history.entries().map((r) => r.label), untouchedFalse: __untouched() }`);
      const flat = (o, p = '', acc = {}) => { if (o && typeof o === 'object') { for (const k of Object.keys(o)) flat(o[k], p + '.' + k, acc); } else acc[p] = o; return acc; };
      const A = flat(JSON.parse(early.S)), B = flat(JSON.parse(late.S));
      const moved = [...new Set([...Object.keys(A), ...Object.keys(B)])].filter((k) => JSON.stringify(A[k]) !== JSON.stringify(B[k]) && !/\.t$|layout|modwin|notebook|quality|autoScale|steps|\.half$/.test(k));
      const reclean = await ev(`__LW.projects.markClean(); await __w(1500); await __settle(); return __LW.projects.dirty;`);
      return { earlyDirty: early.dirty, lateDirty: late.dirty, rows: late.rows, untouchedFalse: late.untouchedFalse, movedKeys: moved.slice(0, 20).map((k) => [k, A[k], B[k]]), dirtyAgainAfterMarkClean: reclean };
    });
  }
  /* P7b · the same for a plain boot (control) */
  await step('P7b plain boot (control)', async () => {
    await drv.go(g.s, BASE);
    const early = await ev(`for (let i = 0; i < 600; i++) { if (window.__LW && __LW.ready) break; await new Promise((r) => setTimeout(r, 5)); } return __LW.projects.dirty;`);
    await ev(HELP); await ev('await __settle(); await __w(1500); await __settle(); return 1;');
    return { earlyDirty: early, lateDirty: await ev('return __LW.projects.dirty') };
  });

  say('errors', await g.errors());
} catch (e) {
  say('PROBE ERROR', String(e && e.stack || e));
} finally {
  writeFileSync(new URL('./untouched-attack-3.out.json', import.meta.url), JSON.stringify(out, null, 1));
  await g.close();
}
