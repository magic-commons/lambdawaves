// VERIFIER PROBE · wave 133 — ATTACK `untouched`, part 2 (the scenes part 1 could not settle): the transport played and paused,
// a window really moved, a pointer held with no value change, a SHORT exact export and a RECORD in flight, a preference, and WHY a
// link boot reads dirty (a diff of serialize() at LW.ready against the settled state).
//   LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/untouched-attack-2.mjs
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
  window.__settle = async () => { await __LW.settle(); await __w(700); await __LW.settle(); };
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

  /* P2 · a window really moved: the notebook dragged by a non-input spot of its head */
  await step('P2 notebook moved by its head', async () => {
    await go(BASE);
    await ev('__LW.layout.notebook.open(); await __settle(); document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;');
    const spot = await ev(`const h = document.querySelector('#notebook .nb-head'); const r = h.getBoundingClientRect();
      for (let x = r.right - 6; x > r.left; x -= 4) for (const y of [r.top + 4, r.top + r.height / 2, r.bottom - 4]) { const e = document.elementFromPoint(x, y); if (e && (e === h || (h.contains(e) && !/INPUT|BUTTON|TEXTAREA/.test(e.tagName) && !e.closest('button, .trig, input')))) return { x: Math.round(x), y: Math.round(y), on: e.className || e.tagName }; }
      return null;`);
    const r0 = await ev(`const r = document.getElementById('notebook').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)];`);
    const s0 = await ev(`return localStorage.getItem('lambdawaves.q0.settings')`);
    if (spot) { await pointer([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: spot.x, y: spot.y }, { type: 'pointerDown', button: 0 },
      { type: 'pointerMove', duration: 300, origin: 'viewport', x: spot.x - 120, y: spot.y + 70 }, { type: 'pointerUp', button: 0 }]); await drv.relActions(g.s); }
    await ev('await __settle(); return 1;');
    const r1 = await ev(`const r = document.getElementById('notebook').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)];`);
    const s1 = await ev(`return localStorage.getItem('lambdawaves.q0.settings')`);
    const res = { spot, before: r0, after: r1, settingsChanged: s0 !== s1, read: await ev('return __read()'), untouchedFalse: await ev('return __untouched()') };
    res.afterReload = await reloadRead(`(() => { const n = document.getElementById('notebook'); const r = n.getBoundingClientRect(); return { shown: r.width > 0 && getComputedStyle(n).display !== 'none' && !n.hidden, at: [Math.round(r.left), Math.round(r.top)] }; })()`);
    return res;
  });

  /* P2b · the modulation window expanded (WORKSPACE) */
  await step('P2b modulation window expanded', async () => {
    await go(BASE);
    const before = await ev(`return !!document.querySelector('#modwin') && getComputedStyle(document.querySelector('#modwin')).display`);
    await ev('__LW.layout.modulation.expand(); await __settle(); return 1;');
    const r = { before, read: await ev('return __read()'), untouchedFalse: await ev('return __untouched()') };
    r.afterReload = await reloadRead(`(() => { const m = document.querySelector('#modwin'); return m ? { cls: String(m.className).slice(0, 60), h: Math.round(m.getBoundingClientRect().height) } : null; })()`);
    return r;
  });

  /* P3 · a pointer HELD on the stage with no movement (pointerHeld, nothing changed yet) */
  await step('P3 pointer held on the stage, no move', async () => {
    await go(BASE);
    const fp = await ev(`for (const [x, y] of [[innerWidth / 2, innerHeight / 2], [innerWidth / 2, innerHeight * 0.7]]) { const h = document.elementFromPoint(x, y); if (h && h.id === 'field') return { x: Math.round(x), y: Math.round(y) }; } return null;`);
    await pointer([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: fp.x, y: fp.y }, { type: 'pointerDown', button: 0 }]);
    const held = { read: await ev('return __read()'), untouchedFalse: await ev('return __untouched()') };
    await pointer([{ type: 'pointerUp', button: 0 }]); await drv.relActions(g.s);
    await ev('await __settle(); return 1;');
    return { fp, held, released: { read: await ev('return __read()'), untouchedFalse: await ev('return __untouched()') } };
  });

  /* P4 · a SHORT exact export in flight (fps 2 × 6 s) */
  await step('P4 EXPORT FRAMES in flight (short)', async () => {
    await go(BASE);
    return ev(`const t0 = performance.now(); const p = __LW.captureUI.exportFrames({ download: false, fps: 2, seconds: 6 }); let seen = null, polls = 0;
      for (let i = 0; i < 400; i++) { await __w(15); polls++; if (__LW.captureUI.busy) { seen = { atMs: Math.round(performance.now() - t0), read: __read(), untouchedFalse: __untouched() }; break; } }
      const r = await Promise.race([p, __w(90000).then(() => 'timeout')]);
      return { seen, polls, result: r && typeof r === 'object' ? { ok: r.ok, stopped: r.stopped, frames: r.frames, message: String(r.message || r.error || '').slice(0, 120) } : r, totalMs: Math.round(performance.now() - t0) };`);
  });

  /* P5 · RECORD in flight (live clip) */
  await step('P5 RECORD in flight', async () => {
    await go(BASE);
    return ev(`const p = __LW.captureUI.record(); let seen = null;
      for (let i = 0; i < 100; i++) { await __w(20); if (__LW.captureUI.busy) { seen = { read: __read(), untouchedFalse: __untouched() }; break; } }
      __LW.captureUI.record(); await Promise.race([p, __w(5000)]); return { seen, busyAfterStop: __LW.captureUI.busy };`);
  });

  /* P6 · a preference flipped */
  await step('P6 theme flipped', async () => {
    await go(BASE);
    const th0 = await ev('return document.body.dataset.theme');
    await ev(`__LW.setTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light'); await __settle(); return 1;`);
    const r = { theme0: th0, read: await ev('return __read()'), untouchedFalse: await ev('return __untouched()'), stored: await ev(`return JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}').theme`) };
    r.afterReload = await reloadRead('document.body.dataset.theme');
    await ev(`__LW.setTheme('${th0}'); return 1;`);
    return r;
  });

  /* P7 · WHY a link boot reads dirty: serialize() at LW.ready vs settled, keys that moved */
  for (const [name, setup] of [['exposure only', `__LW.mat.exposure = 2.5;`], ['nothing changed', ``]]) {
    await step('P7 link boot · ' + name, async () => {
      await go(BASE);
      const href = await ev(`${setup} await __settle(); return __LW.link.mint().href;`);
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
  writeFileSync(new URL('./untouched-attack-2.out.json', import.meta.url), JSON.stringify(out, null, 1));
  await g.close();
}
