/* sw.mjs — LANE D: the service worker's two costs, measured in one fresh headless Firefox profile.
 *   LW_PORT=8721 GD_PORT=5234 node research/optimization-2026-09-24/probes/D/sw.mjs [reloads]
 * 1. INSTALL: boot /lab/?sw=1 (the gate's own opt-in), wait for the deferred registration (1.5 s + idle), time the
 *    precache (register → activated) and count what the cache holds.
 * 2. STEADY STATE: navigate again (now controlled), `reloads` times, and read LW.ready + the resource timings
 *    (workerStart, transferSize) against the same boot with ?sw=0 in the same profile. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const N = +(process.argv[2] || 3);
const BASE = `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz`;
const R = { install: null, controlled: [], uncontrolled: [] };
const READY = `for (let i = 0; i < 4000; i++) { if (window.__LW && __LW.ready) break; await new Promise(r => setTimeout(r, 2)); }
  const t = +performance.now().toFixed(1); const res = performance.getEntriesByType('resource'); const nav = performance.getEntriesByType('navigation')[0] || {};
  const js = res.filter(r => /\\.js(\\?|$)/.test(r.name));
  return { ready: t, controlled: !!navigator.serviceWorker.controller, dcl: +(nav.domContentLoadedEventEnd||0).toFixed(1), navWorkerStart: +(nav.workerStart||0).toFixed(1), n: res.length,
    viaWorker: res.filter(r => r.workerStart > 0).length, transfer: res.reduce((s, r) => s + (r.transferSize || 0), 0), jsLastEnd: +Math.max(...js.map(r => r.responseEnd)).toFixed(1),
    medianFetchMs: (() => { const d = js.map(r => r.responseEnd - r.startTime).sort((a, b) => a - b); return +d[d.length >> 1].toFixed(2); })() };`;
const g = await open(BASE + '&sw=1', { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false } });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.install = await g.ev(`const t0 = performance.now(); let reg = null;
    for (let i = 0; i < 400 && !reg; i++) { reg = await navigator.serviceWorker.getRegistration('./'); if (!reg) await new Promise(r => setTimeout(r, 25)); }
    if (!reg) return { error: 'no registration after 10 s', mode: __LW.sw.mode };
    const tReg = performance.now();
    for (let i = 0; i < 1200 && !reg.active; i++) await new Promise(r => setTimeout(r, 25));
    const tAct = performance.now();
    const names = await caches.keys(); const c = await caches.open(names.find(n => n.startsWith('lw-lab-')));
    const keys = await c.keys(); let bytes = 0; for (const k of keys) { const r = await c.match(k); bytes += (await r.clone().arrayBuffer()).byteLength; }
    return { mode: __LW.sw.mode, registeredAtMs: +tReg.toFixed(0), registeredAfterReadyMs: +(tReg - t0).toFixed(0), installToActiveMs: +(tAct - tReg).toFixed(0), entries: keys.length, bytes, cache: names };`);
  console.log('install', JSON.stringify(R.install));
  for (let i = 0; i < N; i++) {
    await g.ev(`location.href = ${JSON.stringify(BASE + '&sw=1&r=' + i)}; return 1;`).catch(() => {});
    await new Promise((r) => setTimeout(r, 300));
    const r = await g.ev(READY); R.controlled.push(r); console.log('controlled', JSON.stringify(r));
  }
  for (let i = 0; i < N; i++) {
    /* ?sw=0 declines REGISTRATION, but a page in scope is still CONTROLLED by the installed worker; so the
       uncontrolled comparison bypasses the worker with a query the worker does not know… it cannot: the fetch
       handler keys on the PATH.  The honest comparison is therefore a fresh profile (no worker at all). */
    break;
  }
} finally { await g.close(); }
/* COLD: a fresh profile per run, no worker, first boot of the process (GPU process cold too) */
R.cold = [];
for (let i = 0; i < 2; i++) {
  const h = await open(BASE + '&sw=0&fresh=' + i, { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false } });
  try { const r = await h.ev(READY); R.cold.push(r); console.log('cold uncontrolled', JSON.stringify(r)); } finally { await h.close(); }
}
/* WARM, NO WORKER: one fresh profile booted once (the GPU process is now warm), then N navigations.  The controlled
   runs above are warm as well, so THIS is the fair comparison for the worker's own cost. */
{ const h = await open(BASE + '&sw=0', { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false } });
  try { await h.waitFor('window.__LW && __LW.ready', 3000, 20);
    for (let i = 0; i < N; i++) {
      await h.ev(`location.href = ${JSON.stringify(BASE + '&sw=0&r=')} + ${i}; return 1;`).catch(() => {});
      await new Promise((r) => setTimeout(r, 300));
      const r = await h.ev(READY); R.uncontrolled.push(r); console.log('warm uncontrolled', JSON.stringify(r)); }
  } finally { await h.close(); } }
fs.writeFileSync('research/optimization-2026-09-24/probes/D/sw.json', JSON.stringify(R, null, 1));
