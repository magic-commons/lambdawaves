// VERIFIER PROBE · wave 133 — ABOUT › UPDATE APP (LW.sw.refresh) in an UNTOUCHED tab while a SECOND window is open, on the real
// worker.  refresh() → reg.update() → `updatefound` → main.js watch → buildReady → (untouched) a QUIET TAKE posts {alone:true};
// refresh() then posts its own press.  The worker answers the quiet one LW_SW_BUSY (two windows), which resets `asked` to false —
// does the tab that PRESSED UPDATE APP still reload, or is it told "replaced in another tab"?  Restores lab/ bytes in `finally`.
//   LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/e2e-refresh-race.mjs
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
const out = [];
const say = (k, v) => { out.push([k, v]); console.log(k, JSON.stringify(v)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bump = (tag) => { writeFileSync(ABS, Buffer.concat([ORIG.abs, Buffer.from('// v133-verify ' + tag + '\n')])); const log = execFileSync('node', ['tests/pwa.test.mjs', '--write'], { cwd: ROOT, encoding: 'utf8' }); return (/Cache name (lw-lab-[0-9a-z]+)/.exec(log) || [])[1]; };
const wd = async (method, path, body) => { const r = await fetch(`http://127.0.0.1:${GD}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(path + ' ' + r.status); return j.value; };
const A = (b) => `const d=arguments[arguments.length-1];(async()=>{try{d(await (async()=>{${b}})())}catch(e){d({E:String(e&&e.message||e)})}})();`;
const HOOK = `if (!window.__LW || !__LW.sw) return 'no LW'; const sw = __LW.sw; if (sw.__hooked) return 'hooked'; sw.__hooked = true;
  const log = (ev, x) => { try { const L = JSON.parse(sessionStorage.getItem('__v133') || '[]'); L.push({ ev, at: Date.now(), state: sw.state, asked: sw.asked, x: x === undefined ? null : x }); sessionStorage.setItem('__v133', JSON.stringify(L)); } catch (e) {} };
  for (const k of ['buildReady', 'message', 'accept', 'controllerChanged', 'reload']) { const f = sw[k]; sw[k] = function (...a) { log(k + ':in', k === 'message' ? (a[0] && a[0].type) : k === 'accept' ? (a[0] || null) : null); const r = f.apply(this, a); log(k + ':out', r && typeof r === 'object' ? 'obj' : r); return r; }; }
  return 'installed';`;
const SNAP = `return { origin: performance.timeOrigin, ready: !!(window.__LW && __LW.ready), build: window.__LW && __LW.sw ? __LW.sw.build : null, state: window.__LW && __LW.sw ? __LW.sw.state : null,
  badge: (() => { const b = document.querySelector('#badges > .badge.build'); return b && !b.hidden ? b.lastChild.textContent : null; })() };`;

let s = null, gd = null;
try {
  gd = await drv.startDriver();
  s = await drv.newSession({ width: 1300, height: 850 });
  await drv.setTO(s, { script: 120000, pageLoad: 120000 });
  const ev = (b) => drv.evalA(s, A(b));
  const snap = async () => { for (let i = 0; i < 30; i++) { try { const v = await drv.evalS(s, SNAP); if (v && typeof v === 'object') return v; } catch (e) {} await sleep(100); } return { err: 1 }; };
  const ready = async () => { for (let i = 0; i < 600; i++) { const x = await snap(); if (x.ready) return x; await sleep(100); } };
  await drv.go(s, URL_); await ready();
  await ev(`for (let i = 0; i < 300 && __LW.sw.mode === 'arming'; i++) await new Promise((r) => setTimeout(r, 100)); await navigator.serviceWorker.ready; return 1;`);
  await drv.go(s, URL_); await ready();
  const b1 = await ev(`for (let i = 0; i < 300 && !__LW.sw.build; i++) await new Promise((r) => setTimeout(r, 100)); return __LW.sw.build;`);
  const hA = await wd('GET', `/session/${s}/window`);
  const nw = await wd('POST', `/session/${s}/window/new`, { type: 'tab' });
  await wd('POST', `/session/${s}/window`, { handle: nw.handle });
  await drv.go(s, URL_); await ready();
  await ev(`for (let i = 0; i < 300 && !__LW.sw.build; i++) await new Promise((r) => setTimeout(r, 100)); return 1;`);
  await wd('POST', `/session/${s}/window`, { handle: hA });
  await drv.evalS(s, `sessionStorage.removeItem('__v133'); return (function(){${HOOK}})()`);
  const cache2 = bump('R');
  const before = await snap();
  const t0 = Date.now();
  await drv.evalS(s, `window.__rr = 'pending'; __LW.sw.refresh().then((r) => { window.__rr = r; }); return 1;`);   // what ABOUT › UPDATE APP calls
  let result = null;
  for (let i = 0; i < 300; i++) {
    const x = await snap();
    if (x.origin && x.origin !== before.origin && x.build) { result = { outcome: 'reloaded', ms: Date.now() - t0, build: x.build }; break; }
    if (x.state === 'replaced') { result = { outcome: 'told replaced (did NOT reload)', ms: Date.now() - t0, badge: x.badge }; break; }
    await sleep(100);
  }
  await sleep(500);
  const L = await ev(`return JSON.parse(sessionStorage.getItem('__v133') || '[]');`);
  say('UPDATE APP in an untouched tab with a second window open', { build1: b1, cache2, result, final: await snap(),
    log: (L || []).map((e) => [e.at - t0, e.ev, e.state, e.asked, e.x && typeof e.x === 'object' ? JSON.stringify(e.x) : e.x]) });
  await ev(`for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); for (const k of await caches.keys()) await caches.delete(k); return 1;`);
} catch (e) {
  say('PROBE ERROR', String(e && e.stack || e));
} finally {
  writeFileSync(ABS, ORIG.abs); writeFileSync(SWJS, ORIG.sw);
  say('restored lab/ bytes', { abs: sha(readFileSync(ABS)) === H0.abs, sw: sha(readFileSync(SWJS)) === H0.sw });
  if (s) await drv.quit(s).catch(() => {});
  if (gd) gd.kill();
  writeFileSync(new URL('./e2e-refresh-race.out.json', import.meta.url), JSON.stringify(out, null, 1));
}
