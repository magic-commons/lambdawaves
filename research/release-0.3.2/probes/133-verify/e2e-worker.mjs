// VERIFIER PROBE · wave 133 THE OFFER — the REAL worker, end to end (the builder drove LW.sw by hand only).
// Needs the verifier's own gate server:  LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/e2e-worker.mjs
// It changes ONE comment byte in lab/absorb.js (precached, harmless), runs `node tests/pwa.test.mjs --write` so sw.js §1 and the
// cache name move, and navigates an UNTOUCHED page: does the update install, does LW_SW_WAITING arrive, does the quiet take fire,
// does a controllerchange reload happen, and does the reloaded page report the new build?  Then two windows (the refusal), the
// 'replaced' tab's badge press, and the READER (a foreground return after >30 min, driven by a patched performance.now) taking a
// build with NO navigation.  Every lab/ byte is restored in `finally` (original bytes written back, then sha-256 compared).
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as drv from '../../../../tools/gate/drv.mjs';

const ROOT = new URL('../../../../', import.meta.url).pathname;
const PORT = process.env.LW_PORT || 8732, GD = process.env.GD_PORT || 5232;
const URL_ = `https://127.0.0.1:${PORT}/lab/?sw=1`;
const ABS = ROOT + 'lab/absorb.js', SWJS = ROOT + 'lab/sw.js';
const ORIG = { abs: readFileSync(ABS), sw: readFileSync(SWJS) };
const sha = (b) => createHash('sha256').update(b).digest('hex');
const H0 = { abs: sha(ORIG.abs), sw: sha(ORIG.sw) };
const out = { steps: [] };
const say = (k, v) => { out.steps.push([k, v]); console.log(k, JSON.stringify(v)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function bump(tag) {                       // one comment line appended to absorb.js, then the regenerated precache
  writeFileSync(ABS, Buffer.concat([ORIG.abs, Buffer.from('// v133-verify ' + tag + '\n')]));
  const log = execFileSync('node', ['tests/pwa.test.mjs', '--write'], { cwd: ROOT, encoding: 'utf8' });
  const m = /Cache name (lw-lab-[0-9a-z]+)/.exec(log);
  return m ? m[1] : null;
}
function restore() {
  writeFileSync(ABS, ORIG.abs); writeFileSync(SWJS, ORIG.sw);
  return { abs: sha(readFileSync(ABS)) === H0.abs, sw: sha(readFileSync(SWJS)) === H0.sw };
}

const wd = async (method, path, body) => {
  const r = await fetch(`http://127.0.0.1:${GD}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(method + ' ' + path + ' ' + r.status + ' ' + JSON.stringify(j).slice(0, 300)); return j.value;
};
const A = (b) => `const d=arguments[arguments.length-1];(async()=>{try{d(await (async()=>{${b}})())}catch(e){d({E:String(e&&e.message||e)})}})();`;

const HOOK = `
  if (!window.__LW || !__LW.sw) return 'no LW';
  const sw = __LW.sw; if (sw.__hooked) return 'hooked';
  sw.__hooked = true;
  const log = (ev, x) => { try { const L = JSON.parse(sessionStorage.getItem('__v133') || '[]');
    L.push({ ev, at: Date.now(), origin: performance.timeOrigin, state: sw.state, asked: sw.asked, x: x === undefined ? null : x });
    sessionStorage.setItem('__v133', JSON.stringify(L)); } catch (e) {} };
  window.__v133log = log;
  log('hooked', { build: sw.build, mode: sw.mode, ready: !!__LW.ready, controlled: !!navigator.serviceWorker.controller });
  for (const k of ['buildReady', 'message', 'accept', 'offer', 'controllerChanged', 'reload']) {
    const f = sw[k]; sw[k] = function (...a) {
      log(k + ':in', k === 'message' ? a[0] : k === 'accept' ? (a[0] || null) : null);
      const r = f.apply(this, a); log(k + ':out', r && typeof r === 'object' ? 'obj' : r); return r; };
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => log('controllerchange-event', null));
  return 'installed';`;
const SNAP = `return { origin: performance.timeOrigin, now: Date.now(), ready: !!(window.__LW && __LW.ready),
  build: window.__LW && __LW.sw ? __LW.sw.build : null, state: window.__LW && __LW.sw ? __LW.sw.state : null,
  mode: window.__LW && __LW.sw ? __LW.sw.mode : null, hooked: !!(window.__LW && __LW.sw && __LW.sw.__hooked),
  controlled: !!navigator.serviceWorker.controller, vis: document.visibilityState,
  pane: (() => { const p = document.getElementById('offer'); return p ? !p.hidden : null; })(),
  badge: (() => { const b = document.querySelector('#badges > .badge.build'); return b && !b.hidden ? b.lastChild.textContent : null; })(),
  checks: window.__LW && __LW.sw ? __LW.sw.checks : null };`;

let s = null, gd = null;
try {
  gd = await drv.startDriver();
  s = await drv.newSession({ width: 1300, height: 850, prefs: { 'privacy.reduceTimerPrecision': false } });
  await drv.setTO(s, { script: 600000, pageLoad: 120000 });
  const ev = (body) => drv.evalA(s, A(body));
  const snap = async () => { for (let i = 0; i < 30; i++) { try { const v = await drv.evalS(s, SNAP); if (v && typeof v === 'object') return v; } catch (e) { if (i === 29) return { err: String(e.message).slice(0, 120) }; } await sleep(100); } return { err: 'null snapshot' }; };
  const waitReady = async (ms = 60000) => { const t = Date.now(); for (;;) { const x = await snap(); if (x.ready) return x; if (Date.now() - t > ms) return x; await sleep(100); } };

  /* ── 1 · first visit installs, second is controlled ── */
  await drv.go(s, URL_); await waitReady();
  const first = await ev(`for (let i = 0; i < 300 && __LW.sw.mode === 'arming'; i++) await new Promise((r) => setTimeout(r, 100));
    const reg = await navigator.serviceWorker.ready; return { mode: __LW.sw.mode, active: !!reg.active, controlled: !!navigator.serviceWorker.controller, scope: reg.scope };`);
  say('visit 1 (installs)', first);
  await drv.go(s, URL_); await waitReady();
  const second = await ev(`for (let i = 0; i < 300 && !__LW.sw.build; i++) await new Promise((r) => setTimeout(r, 100));
    return { controlled: !!navigator.serviceWorker.controller, build: __LW.sw.build, cache: __LW.sw.cache, files: __LW.sw.files, mode: __LW.sw.mode,
      untouched: (() => { const h = __LW.history; return { rows: h.entries().map((r) => r.label), canUndo: h.canUndo, dirty: __LW.projects.dirty, playing: __LW.clock.playing }; })() };`);
  say('visit 2 (controlled)', second);
  const build1 = second.build;

  /* ── 2 · ONE BYTE, then an untouched navigation ── */
  const cache2 = bump('A');
  say('bumped absorb.js; sw.js §1 regenerated', { newCache: cache2 });
  await ev(`sessionStorage.removeItem('__v133'); return 1;`);
  const t0 = Date.now();
  await drv.go(s, URL_);
  const tLoad = Date.now();
  let o1 = null, hookedAt = null, reloadSeen = null, readyAt = null, buildAt = null, last = null;
  const series = [];
  while (Date.now() - t0 < 90000) {
    const x = await snap(); last = x;
    if (x.origin && o1 === null) o1 = x.origin;
    if (x.origin === o1 && !x.hooked && !x.err) { const r = await drv.evalS(s, `return (function(){${HOOK}})()`).catch((e) => String(e.message)); if (r === 'installed') hookedAt = Date.now(); }
    if (x.origin && o1 !== null && x.origin !== o1) {
      if (!reloadSeen) reloadSeen = { at: Date.now(), newOrigin: x.origin };
      if (x.ready && !readyAt) readyAt = Date.now();
      if (x.build && !buildAt) { buildAt = Date.now(); series.push(x); break; }
    }
    if (series.length < 400) series.push({ t: Date.now() - t0, o: x.origin === o1 ? 'o1' : 'o2', st: x.state, b: x.build, pane: x.pane, badge: x.badge, err: x.err });
    await sleep(100);
  }
  const L = await ev(`return JSON.parse(sessionStorage.getItem('__v133') || '[]');`);
  const fin = await snap();
  say('untouched navigation → result', {
    build1, build2: fin.build, changed: !!fin.build && fin.build !== build1, cacheExpected: cache2, buildMatchesCache: cache2 === 'lw-lab-' + fin.build,
    goReturnedMs: tLoad - t0, hookedMs: hookedAt && hookedAt - t0, reloadNavStartMs: reloadSeen && Math.round(reloadSeen.newOrigin - t0),
    reloadedPageReadyMs: readyAt && readyAt - t0, newBuildKnownMs: buildAt && buildAt - t0, finalState: fin.state, finalMode: fin.mode, badge: fin.badge, pane: fin.pane });
  say('event log (ms after navigation)', (L || []).map((e) => [e.at - t0, e.ev, e.state, e.asked, e.origin === o1 ? 'o1' : 'o2', e.x && typeof e.x === 'object' ? e.x.type || JSON.stringify(e.x).slice(0, 80) : e.x]));
  say('state series (first 60)', series.slice(0, 60).map((x) => [x.t, x.o, x.st, x.b && x.b.slice(0, 6), x.pane, x.badge && x.badge.slice(0, 22), x.err && x.err.slice(0, 40)]));

  /* ── 3 · TWO WINDOWS: the quiet take must be refused (LW_SW_BUSY) and both offered ── */
  const hA = await wd('GET', `/session/${s}/window`);
  const nw = await wd('POST', `/session/${s}/window/new`, { type: 'tab' });
  await wd('POST', `/session/${s}/window`, { handle: nw.handle });
  await drv.go(s, URL_); await waitReady();
  const bReady = await ev(`for (let i = 0; i < 300 && !__LW.sw.build; i++) await new Promise((r) => setTimeout(r, 100)); return { controlled: !!navigator.serviceWorker.controller, build: __LW.sw.build, vis: document.visibilityState };`);
  say('window B opened', bReady);
  await drv.evalS(s, `sessionStorage.removeItem('__v133'); return (function(){${HOOK}})()`);
  const cache3 = bump('B');
  say('bumped again', { newCache: cache3 });
  await wd('POST', `/session/${s}/window`, { handle: hA });
  await ev(`sessionStorage.removeItem('__v133'); return 1;`);
  const t1 = Date.now();
  await drv.go(s, URL_);
  let oA = null;
  for (let i = 0; i < 600; i++) {       // hook A early, then wait for its decision
    const x = await snap(); if (x.origin && oA === null) oA = x.origin;
    if (!x.hooked && x.origin === oA) await drv.evalS(s, `return (function(){${HOOK}})()`).catch(() => {});
    const Lx = await ev(`return JSON.parse(sessionStorage.getItem('__v133') || '[]');`).catch(() => []);
    if (Array.isArray(Lx) && Lx.some((e) => e.ev === 'message:in' && e.x && e.x.type === 'LW_SW_BUSY')) break;
    if (x.origin && oA !== null && x.origin !== oA) break;
    await sleep(100);
  }
  await sleep(1500);
  const LA = await ev(`return JSON.parse(sessionStorage.getItem('__v133') || '[]');`);
  const sA = await snap();
  say('window A after navigation (2 windows)', { reloaded: sA.origin !== oA, state: sA.state, pane: sA.pane, badge: sA.badge, build: sA.build,
    log: (LA || []).map((e) => [e.at - t1, e.ev, e.state, e.x && typeof e.x === 'object' ? (e.x.type || '') + (e.x.windows ? ' windows=' + e.x.windows : '') : e.x]) });
  await wd('POST', `/session/${s}/window`, { handle: nw.handle });
  await sleep(300);
  const LB = await ev(`return JSON.parse(sessionStorage.getItem('__v133') || '[]');`);
  const sB = await snap();
  say('window B meanwhile', { state: sB.state, pane: sB.pane, badge: sB.badge, build: sB.build, vis: sB.vis,
    log: (LB || []).map((e) => [e.at - t1, e.ev, e.state, e.x && typeof e.x === 'object' ? (e.x.type || '') + (e.x.windows ? ' windows=' + e.x.windows : '') : e.x]) });

  /* ── 4 · a PRESS in A takes it; B is told 'replaced'; B's badge press is tested ── */
  await wd('POST', `/session/${s}/window`, { handle: hA });
  await sleep(300);
  const tapAt = async (sel) => {
    const r = await drv.evalS(s, `const e = ${sel}; if (!e) return { ok: 0, why: 'none' }; const b = e.getBoundingClientRect();
      const x = Math.round(b.left + b.width / 2), y = Math.round(b.top + b.height / 2); const h = document.elementFromPoint(x, y);
      return { ok: h === e || e.contains(h) ? 1 : 0, x, y, w: b.width, h: b.height, by: h ? (h.id || h.className || h.tagName) : null };`);
    if (!r.ok) return r;
    await drv.actions(s, [{ type: 'pointer', id: 'p' + Math.random(), parameters: { pointerType: 'mouse' }, actions: [
      { type: 'pointerMove', duration: 0, origin: 'viewport', x: r.x, y: r.y }, { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 40 }, { type: 'pointerUp', button: 0 }] }]);
    await drv.relActions(s).catch(() => {});
    return r;
  };
  const before = await snap();
  const t2 = Date.now();
  const tapped = await tapAt(`[...document.querySelectorAll('#offer .offer-row .trig')].find((b) => b.textContent.trim() === 'UPDATE')`);
  let aReload = null;
  for (let i = 0; i < 300; i++) { const x = await snap(); if (x.origin && x.origin !== before.origin && x.build) { aReload = { ms: Date.now() - t2, build: x.build, state: x.state }; break; } await sleep(100); }
  say('A: a real press on UPDATE', { tapped, aReload, cache3, buildMatches: aReload && cache3 === 'lw-lab-' + aReload.build });
  await wd('POST', `/session/${s}/window`, { handle: nw.handle });
  await sleep(500);
  const sB2 = await snap();
  const LB2 = await ev(`return JSON.parse(sessionStorage.getItem('__v133') || '[]');`);
  say('B after A pressed', { reloaded: sB2.origin !== sB.origin, state: sB2.state, badge: sB2.badge, pane: sB2.pane, build: sB2.build,
    lastEvents: (LB2 || []).slice(-6).map((e) => [e.ev, e.state, e.asked]) });
  const bTap = await tapAt(`document.querySelector('#badges > .badge.build')`);
  await sleep(1500);
  const sB3 = await snap();
  const LB3 = await ev(`return JSON.parse(sessionStorage.getItem('__v133') || '[]');`);
  say("B: a real press on the 'replaced' badge", { bTap, reloaded: sB3.origin !== sB2.origin, state: sB3.state, badge: sB3.badge,
    acceptResult: (LB3 || []).filter((e) => e.ev === 'accept:out').slice(-1).map((e) => e.x) });
  await wd('DELETE', `/session/${s}/window`);          // close B
  await wd('POST', `/session/${s}/window`, { handle: hA });

  /* ── 5 · THE READER, real: throttle, then a >30 min foreground return finds a new build with NO navigation ── */
  await drv.evalS(s, `sessionStorage.removeItem('__v133'); return (function(){${HOOK}})()`);
  const rd = await ev(`const sw = __LW.sw, reg = sw.registration; let ups = 0; const real = reg.update.bind(reg); reg.update = () => { ups++; return real(); };
    window.__ups = () => ups;
    const fire = (vis) => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => vis }); document.dispatchEvent(new Event('visibilitychange')); delete document.visibilityState; };
    window.__fire = fire;
    fire('hidden'); fire('visible'); fire('hidden'); fire('visible');
    return { checks: sw.checks, updates: ups, mode: sw.mode };`);
  say('reader within 30 min (4 visibility flips)', rd);
  const cache4 = bump('C');
  const t3 = Date.now();
  const rd2 = await ev(`const pn = performance.now.bind(performance); performance.now = () => pn() + 31 * 60e3;
    __fire('hidden'); __fire('visible'); const c1 = __LW.sw.checks, u1 = __ups(); __fire('visible'); const c2 = __LW.sw.checks;
    delete performance.now; return { checksAfter31min: c1, updatesAfter31min: u1, checksAfterSecondFlip: c2 };`);
  say('reader after a patched +31 min', rd2);
  const oR = (await snap()).origin;
  let rReload = null;
  for (let i = 0; i < 600; i++) { const x = await snap(); if (x.origin && x.origin !== oR && x.build) { rReload = { ms: Date.now() - t3, build: x.build, state: x.state }; break; } await sleep(100); }
  const LR = await ev(`return JSON.parse(sessionStorage.getItem('__v133') || '[]');`);
  say('reader → install → quiet take → reload (no navigation)', { rReload, cache4, buildMatches: rReload && cache4 === 'lw-lab-' + rReload.build,
    log: (LR || []).map((e) => [e.at - t3, e.ev, e.state, e.x && typeof e.x === 'object' ? e.x.type || '' : e.x]) });

  /* leave nothing on the origin */
  await ev(`for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); for (const k of await caches.keys()) await caches.delete(k); return 1;`);
} catch (e) {
  say('PROBE ERROR', String(e && e.stack || e));
} finally {
  const r = restore();
  say('restored lab/ bytes', r);
  const chk = execFileSync('node', ['tests/pwa.test.mjs'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter((l) => /Cache name/.test(l)).map((l) => /Cache name (lw-lab-[0-9a-z]+)/.exec(l)[1]);
  say('pwa.test after restore (no --write)', chk);
  if (s) await drv.quit(s).catch(() => {});
  if (gd) gd.kill();
  writeFileSync(new URL('./e2e-worker.out.json', import.meta.url), JSON.stringify(out, null, 1));
}
