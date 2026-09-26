// VERIFIER PROBE · wave 133 — ATTACK `untouched` (rack.js ≈ 2966).  Automation mode (no worker): `untouched(false)` is read
// through its only observable act — LW.sw.buildReady(take) calls take({ alone: true }) synchronously iff untouched(false) — with
// every sw field put back afterwards.  For each scene: the ring, dirty, playing, t, and whether a real location.reload() loses
// what the scene made.   LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/untouched-attack.mjs
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
  window.__read = () => { const h = __LW.history; return { rows: h.entries().map((r) => r.label), canUndo: h.canUndo, pending: h.pendingLabel, holding: h.holding,
    dirty: __LW.projects.dirty, playing: __LW.clock.playing, t: +__LW.clock.t.toFixed(3), active: document.activeElement ? document.activeElement.tagName + '.' + document.activeElement.className : null,
    warnOpen: __LW.warning.open, yaw: +__LW.obs.yaw.toFixed(4), hash: location.hash.slice(0, 24) }; };
  window.__untouched = () => { const sw = __LW.sw; let took = null; const rl = sw.reload; sw.reload = () => {};
    sw.state = 'idle'; sw.asked = false; sw.pending = { build: 'probe-' + Math.random() };
    sw.buildReady((o) => { took = o || {}; });
    const quiet = !!(took && took.alone), offered = !took && !document.getElementById('offer').hidden;
    sw.state = 'idle'; sw.asked = false; sw.take = null; sw.pending = null; sw.offered = null;
    document.getElementById('offer').hidden = true; const b = document.querySelector('#badges > .badge.build'); if (b) b.hidden = true; sw.reload = rl;
    return { untouchedFalse: quiet, offered }; };
  window.__settle = async () => { await __LW.settle(); await __w(700); await __LW.settle(); };
  return 1;`;

const g = await open(BASE, { width: 1400, height: 950, prefs: { 'privacy.reduceTimerPrecision': false } });
const ev = g.ev;
const go = async (url) => { await drv.go(g.s, url); const r = await g.waitFor('window.__LW && __LW.ready', 400, 100); await ev(HELP); await ev('await __settle(); return 1;'); return r; };
const reloadRead = async (expr) => { await ev('setTimeout(() => location.reload(), 10); return 1;'); await sleep(600); await g.waitFor('window.__LW && __LW.ready', 400, 100); await ev(HELP); await ev('await __settle(); return 1;'); return ev(`return (${expr})`); };
const pointer = (acts) => drv.actions(g.s, [{ type: 'pointer', id: 'p' + Math.random(), parameters: { pointerType: 'mouse' }, actions: acts }]);
const keys = (acts) => drv.actions(g.s, [{ type: 'key', id: 'k' + Math.random(), actions: acts }]);
const centre = (sel) => ev(`const e = ${sel}; if (!e) return null; const b = e.getBoundingClientRect(); const x = Math.round(b.left + b.width / 2), y = Math.round(b.top + b.height / 2);
  const h = document.elementFromPoint(x, y); return { x, y, hit: h === e || e.contains(h), by: h ? (h.id || String(h.className).slice(0, 40) || h.tagName) : null };`);
const FIELD_PT = `(() => { for (const [x, y] of [[innerWidth / 2, innerHeight / 2], [innerWidth / 2, innerHeight * 0.7], [innerWidth * 0.4, innerHeight * 0.6]]) { const h = document.elementFromPoint(x, y); if (h && h.id === 'field') return { x: Math.round(x), y: Math.round(y) }; } return null; })()`;

try {
  /* S0 · the baseline */
  await go(BASE);
  say('S0 boot', { read: await ev('return __read()'), u: await ev('return __untouched()') });

  /* S1 · played, then paused on a frame */
  await ev('__LW.play(); await __w(1500); __LW.pause(); await __settle(); return 1;');
  const s1 = { read: await ev('return __read()'), u: await ev('return __untouched()') };
  s1.afterReload = await reloadRead('{ t: __LW.clock.t, rows: __LW.history.entries().map((r) => r.label) }');
  say('S1 played 1.5 s then paused', s1);

  /* S1b · scrubbed the playhead (no play) */
  await ev('__LW.scrub(137); await __settle(); return 1;');
  say('S1b scrub to t=137', { read: await ev('return __read()'), u: await ev('return __untouched()') });

  /* S2 · a real camera orbit on the stage */
  await go(BASE);
  const fp = await ev(`return ${FIELD_PT}`);
  const yaw0 = await ev('return __LW.obs.yaw');
  if (fp) { await pointer([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: fp.x, y: fp.y }, { type: 'pointerDown', button: 0 },
    { type: 'pointerMove', duration: 250, origin: 'viewport', x: fp.x + 120, y: fp.y + 30 }, { type: 'pointerUp', button: 0 }]); await drv.relActions(g.s); }
  await ev('await __w(1500); await __settle(); return 1;');
  const s2 = { fieldPoint: fp, yaw0, read: await ev('return __read()'), u: await ev('return __untouched()') };
  s2.afterReload = await reloadRead('{ yaw: __LW.obs.yaw }');
  say('S2 real orbit drag', s2);

  /* S3 · WASD orbit (real keys, eased) */
  await go(BASE);
  await ev(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
  const y3 = await ev('return __LW.obs.yaw');
  await keys([{ type: 'keyDown', value: 'a' }, { type: 'pause', duration: 400 }, { type: 'keyUp', value: 'a' }]); await drv.relActions(g.s);
  await ev('await __w(1500); await __settle(); return 1;');
  say('S3 WASD orbit (a, 400 ms)', { yaw0: y3, read: await ev('return __read()'), u: await ev('return __untouched()') });

  /* S4 · auto-rotate switched on (paused) */
  await go(BASE);
  await ev('__LW.camera.setAutoRotate(true); await __w(1200); return 1;');
  const s4 = { read: await ev('return __read()'), u: await ev('return __untouched()') };
  await ev('__LW.camera.setAutoRotate(false); return 1;');
  say('S4 auto-rotate on, paused', s4);

  /* S5 · a window moved (the notebook, by its header, real pointer) — WORKSPACE */
  await go(BASE);
  await ev('__LW.layout.notebook.open(); await __settle(); return 1;');
  const nbHead = await centre(`document.querySelector('#notebook .nb-head, #notebook .kwin-head, #notebook header, #notebook .nb-bar') || document.querySelector('#notebook')`);
  const set0 = await ev(`return localStorage.getItem('lambdawaves.q0.settings')`);
  const nbR0 = await ev(`const r = document.getElementById('notebook').getBoundingClientRect(); return [r.left, r.top];`);
  const hd = await ev(`const h = document.querySelector('#notebook .nb-head') || document.querySelector('#notebook [class*=head]') || document.querySelector('#notebook [class*=bar]'); if (!h) return null; const b = h.getBoundingClientRect(); return { cls: h.className, x: Math.round(b.left + 30), y: Math.round(b.top + b.height / 2) };`);
  if (hd) { await pointer([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: hd.x, y: hd.y }, { type: 'pointerDown', button: 0 },
    { type: 'pointerMove', duration: 250, origin: 'viewport', x: hd.x + 90, y: hd.y + 60 }, { type: 'pointerUp', button: 0 }]); await drv.relActions(g.s); }
  await ev('await __settle(); return 1;');
  const nbR1 = await ev(`const r = document.getElementById('notebook').getBoundingClientRect(); return [r.left, r.top];`);
  const set1 = await ev(`return localStorage.getItem('lambdawaves.q0.settings')`);
  const s5 = { head: hd, moved: [nbR0, nbR1], settingsChanged: set0 !== set1, read: await ev('return __read()'), u: await ev('return __untouched()') };
  s5.afterReload = await reloadRead(`(() => { const n = document.getElementById('notebook'); const r = n.getBoundingClientRect(); return { open: !n.hidden && !n.classList.contains('closed') && r.width > 0, at: [r.left, r.top] }; })()`);
  say('S5 notebook opened and moved', s5);

  /* S6 · the notebook typed in, then blurred */
  await go(BASE);
  await ev(`__LW.layout.notebook.open(); await __settle(); const ta = document.querySelector('#notebook .nb-text'); ta.focus(); return !!ta;`);
  await keys([...'hello'].flatMap((c) => [{ type: 'keyDown', value: c }, { type: 'keyUp', value: c }])); await drv.relActions(g.s);
  const s6pre = await ev('return { typing: __read(), u: __untouched() }');
  await ev(`document.activeElement.blur(); await __settle(); return 1;`);
  const s6 = { whileFocused: s6pre, read: await ev('return __read()'), u: await ev('return __untouched()') };
  s6.afterReload = await reloadRead(`document.querySelector('#notebook .nb-text').value.slice(-12)`);
  say('S6 notebook typed then blurred', s6);
  await ev(`localStorage.removeItem('lambdawaves.q0.notebook'); return 1;`);

  /* S7 · the modulation window edited (an LFO added) */
  await go(BASE);
  await ev(`__LW.mod.addSource('lfo'); await __settle(); return 1;`);
  say('S7 modulation: add an LFO', { read: await ev('return __read()'), u: await ev('return __untouched()') });

  /* S8 · a demo opened (WAVE DANCER) */
  await go(BASE);
  await ev(`const c0 = window.confirm; window.confirm = () => true; document.querySelector('.pj-demo').click(); for (let i = 0; i < 80; i++) { if (/DEMOS/.test(__LW.layout.projects.current || '')) break; await __w(50); } window.confirm = c0; await __w(1200); await __settle(); return 1;`);
  say('S8 demo opened', { current: await ev('return __LW.layout.projects.current'), read: await ev('return __read()'), u: await ev('return __untouched()') });

  /* S9 · NEW */
  await go(BASE);
  await ev(`await __LW.layout.projects.requestFresh(); await __w(1200); await __settle(); return 1;`);
  say('S9 NEW', { read: await ev('return __read()'), u: await ev('return __untouched()') });

  /* S10 · a LINK boot: does the fragment survive boot, is it untouched, and does a reload bring the scene back? */
  await go(BASE);
  const href = await ev(`__LW.mat.exposure = 2.5; __LW.setStage && __LW.setStage(0.3); return __LW.link.mint().href;`);
  await go(href);
  const s10 = { hrefLen: href.length, read: await ev('return __read()'), u: await ev('return __untouched()'),
    scene: await ev('return { exposure: __LW.mat.exposure, hashKept: location.hash.length > 3 }') };
  s10.afterReload = await reloadRead('{ exposure: __LW.mat.exposure, rows: __LW.history.entries().map((r) => r.label), hashKept: location.hash.length > 3 }');
  say('S10 link boot', s10);

  /* S11 · ?preset=2pz */
  await go(BASE + '?preset=2pz');
  say('S11 ?preset=2pz', { read: await ev('return __read()'), u: await ev('return __untouched()'), search: await ev('return location.search') });

  /* S12 · the photosensitivity notice up (?warn=1 under the driver) */
  await go(BASE + '?warn=1');
  const s12 = { paneVisible: await ev(`const p = document.getElementById('warnPane'); return !!p && !p.hidden;`), read: await ev('return __read()'), u: await ev('return __untouched()') };
  say('S12 notice up', s12);

  /* S13 · a knob mid-drag (pointer held) */
  await go(BASE);
  const kn = await ev(`const ks = [...document.querySelectorAll('#rack .k .k-dial, #rack .k svg, #rack .k')].filter((k) => { const b = k.getBoundingClientRect(); if (b.width < 8) return false; const h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return h && (h === k || k.contains(h)); });
    const k = ks[0]; if (!k) return null; const b = k.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2), lbl: (k.closest('.k').querySelector('.k-lbl') || {}).textContent };`);
  let s13 = { knob: kn };
  if (kn) {
    await pointer([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: kn.x, y: kn.y }, { type: 'pointerDown', button: 0 }, { type: 'pointerMove', duration: 150, origin: 'viewport', x: kn.x, y: kn.y - 25 }]);
    s13.held = { read: await ev('return __read()'), u: await ev('return __untouched()') };
    await pointer([{ type: 'pointerUp', button: 0 }]); await drv.relActions(g.s);
    await ev('await __settle(); return 1;');
    s13.released = { read: await ev('return __read()'), u: await ev('return __untouched()') };
  }
  say('S13 knob mid-drag', s13);

  /* S14 · a keyboard edit read inside the 400 ms coalescing window */
  await go(BASE);
  const kf = await ev(`const k = [...document.querySelectorAll('#rack .k[tabindex], #rack .k [tabindex]')].find((e) => e.getBoundingClientRect().width > 8); if (!k) return null; k.focus(); return { tag: k.tagName, cls: String(k.className).slice(0, 30), focused: document.activeElement === k };`);
  await keys([{ type: 'keyDown', value: '' }, { type: 'keyUp', value: '' }]);
  const s14now = await ev('return { read: __read(), u: __untouched() }');
  await ev('await __settle(); return 1;');
  say('S14 keyboard ArrowUp on a focused knob', { knob: kf, within400ms: s14now, settled: await ev('return { read: __read(), u: __untouched() }') });

  /* S15 · A/B: needs storeA/storeB (edits); the mix itself runs on the clock */
  await go(BASE);
  await ev(`__LW.ab.storeA(); __LW.ab.storeB(); await __settle(); return 1;`);
  say('S15 A/B stored (no preset change)', { read: await ev('return __read()'), u: await ev('return __untouched()'), ab: await ev('return { on: __LW.ab.on }') });

  /* S16 · an AUDIO source (microphone stubbed to refuse, so nothing real is asked) */
  await go(BASE);
  await ev(`const md = navigator.mediaDevices; if (md) md.getUserMedia = () => Promise.reject(new Error('probe: no microphone')); __LW.mod.addSource('audio'); await __settle(); return 1;`);
  say('S16 AUDIO source added', { read: await ev('return __read()'), u: await ev('return __untouched()') });

  /* S17 · EXPORT FRAMES in flight (the exact renderer) */
  await go(BASE);
  await ev(`window.__exp = __LW.captureUI.exportFrames({ download: false }); await __w(600); return 1;`);
  const s17 = { busy: await ev('return __LW.captureUI.busy'), progress: await ev(`return (document.querySelector('.dev') && [...document.querySelectorAll('.ro')].map((r) => r.textContent).find((t) => /frames/.test(t))) || null`),
    read: await ev('return __read()'), u: await ev('return __untouched()') };
  await ev(`__LW.captureUI.exportFrames(); const r = await window.__exp; return r && (r.stopped || r.ok);`);
  say('S17 EXPORT FRAMES running', s17);

  /* S18 · RECORD in flight (live clip) */
  await go(BASE);
  await ev(`window.__rec = __LW.captureUI.record(); await __w(600); return 1;`);
  const s18 = { busy: await ev('return __LW.captureUI.busy'), read: await ev('return __read()'), u: await ev('return __untouched()') };
  await ev(`__LW.captureUI.record(); await Promise.race([window.__rec, __w(4000)]); return 1;`);
  say('S18 RECORD running', s18);

  /* S19 · a PREFERENCE (theme) — device-remembered at once? */
  await go(BASE);
  const th0 = await ev('return document.body.dataset.theme');
  await ev(`__LW.setTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light'); await __settle(); return 1;`);
  const s19 = { theme0: th0, read: await ev('return __read()'), u: await ev('return __untouched()'), stored: await ev(`return JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}').theme`) };
  s19.afterReload = await reloadRead('document.body.dataset.theme');
  await ev(`__LW.setTheme('${th0}'); return 1;`);
  say('S19 theme flipped', s19);

  say('errors', await g.errors());
} catch (e) {
  say('PROBE ERROR', String(e && e.stack || e));
} finally {
  writeFileSync(new URL('./untouched-attack.out.json', import.meta.url), JSON.stringify(out, null, 1));
  await g.close();
}
