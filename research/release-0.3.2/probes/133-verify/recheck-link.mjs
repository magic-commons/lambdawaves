// VERIFIER RE-CHECK · wave 133 item 8 — settle the link reading.  (1) A FRESH gate page opened DIRECTLY at a `#s=…` link (a new
// open(), a new profile — a real boot): projects.dirty at LW.ready, 1 s later and after register() would have run, the ring's
// origin, untouched(false).  (2) The hashchange road: an unedited boot, then `location.hash = link` — dirty?  ring?  untouched?
// and a reload of that page (now a real boot at the link) — dirty?  (3) The same road over an EDITED session: is anything asked
// before the edit is replaced, and is the undo ring kept?   LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/recheck-link.mjs
import { writeFileSync } from 'node:fs';
import { open } from '../../../../tools/gate/gatekit.mjs';

const PORT = process.env.LW_PORT || 8732;
const BASE = `https://127.0.0.1:${PORT}/lab/`;
const out = [];
const say = (k, v) => { out.push([k, v]); console.log(k, JSON.stringify(v)); };
const HELP = `
  window.__w = (n) => new Promise((r) => setTimeout(r, n));
  window.__untouched = () => { const sw = __LW.sw; let took = null; const rl = sw.reload; sw.reload = () => {};
    sw.state = 'idle'; sw.asked = false; sw.pending = { build: 'probe-' + Math.random() };
    sw.buildReady((o) => { took = o || {}; }); const quiet = !!(took && took.alone);
    sw.state = 'idle'; sw.asked = false; sw.take = null; sw.pending = null; sw.offered = null;
    document.getElementById('offer').hidden = true; const b = document.querySelector('#badges > .badge.build'); if (b) b.hidden = true; sw.reload = rl; return quiet; };
  window.__r = () => ({ dirty: __LW.projects.dirty, rows: __LW.history.entries().map((e) => e.label), exposure: __LW.mat.exposure, hash: location.hash.slice(0, 16), t: __LW.clock.t });
  return 1;`;

/* the link */
let href;
{ const g = await open(BASE); try { await g.waitFor('window.__LW && __LW.ready', 400, 100);
  href = await g.ev(`__LW.mat.exposure = 2.5; await new Promise((r) => setTimeout(r, 300)); return __LW.link.mint().href;`); } finally { await g.close(); } }
say('minted', { len: href.length, head: href.slice(0, 60) });

/* (1) a real boot at the link */
{ const g = await open(href); try {
  const early = await g.ev(`for (let i = 0; i < 4000; i++) { if (window.__LW && __LW.ready) break; await new Promise((r) => setTimeout(r, 5)); }
    return { dirty: __LW.projects.dirty, rows: __LW.history.entries().map((e) => e.label), exposure: __LW.mat.exposure };`);
  await g.ev(HELP);
  const oneSec = await g.ev(`await __w(1000); return __r();`);
  const afterRegister = await g.ev(`await __w(2500); return Object.assign(__r(), { untouchedFalse: __untouched(), swMode: __LW.sw.mode });`);
  say('(1) a real boot at the link (fresh open())', { atReady: early, oneSecondLater: oneSec, afterRegisterWindow: afterRegister });
} finally { await g.close(); } }

/* (2) the hashchange road over an unedited boot, then a reload of that page */
{ const g = await open(BASE); try {
  await g.waitFor('window.__LW && __LW.ready', 400, 100); await g.ev(HELP);
  const before = await g.ev(`await __w(1200); return Object.assign(__r(), { untouchedFalse: __untouched() });`);
  const after = await g.ev(`window.__confirms = 0; const c0 = window.confirm; window.confirm = () => { window.__confirms++; return true; };
    location.hash = new URL(${JSON.stringify(href)}).hash; await __w(1500); window.confirm = c0; return Object.assign(__r(), { untouchedFalse: __untouched(), confirms: window.__confirms });`);
  await g.ev(`setTimeout(() => location.reload(), 10); return 1;`);
  await new Promise((r) => setTimeout(r, 800));
  await g.waitFor('window.__LW && __LW.ready', 400, 100); await g.ev(HELP);
  const reloaded = await g.ev(`await __w(1200); return Object.assign(__r(), { untouchedFalse: __untouched() });`);
  say('(2) hashchange over an unedited boot', { before, afterHashchange: after, afterReloadOfThatPage: reloaded });
} finally { await g.close(); } }

/* (3) the hashchange road over an EDITED session */
{ const g = await open(BASE); try {
  await g.waitFor('window.__LW && __LW.ready', 400, 100); await g.ev(HELP);
  const edited = await g.ev(`__LW.loadPreset('2pz'); __LW.history.flush(); await __w(600); return Object.assign(__r(), { canUndo: __LW.history.canUndo });`);
  const after = await g.ev(`window.__confirms = 0; const c0 = window.confirm; window.confirm = () => { window.__confirms++; return false; };
    location.hash = new URL(${JSON.stringify(href)}).hash; await __w(1500); window.confirm = c0; return Object.assign(__r(), { canUndo: __LW.history.canUndo, confirmsAsked: window.__confirms });`);
  say('(3) hashchange over an edited session (confirm would answer NO)', { edited, afterHashchange: after });
} finally { await g.close(); } }
writeFileSync(new URL('./recheck-link.out.json', import.meta.url), JSON.stringify(out, null, 1));
