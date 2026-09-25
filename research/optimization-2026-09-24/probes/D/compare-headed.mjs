/* compare-headed.mjs — FD1 in a HEADED Firefox (Gecko's GPU process on the real GPU): shipped lab-i vs prestart lab-p.
 *   DISPLAY=:0 LW_PORT=8721 GD_PORT=5234 node research/optimization-2026-09-24/probes/D/compare-headed.mjs [runs] [out.json]
 * Each run is a fresh profile.  In each session the lab boots TWICE: the first boot is cold (new Firefox process), the
 * second is a navigation in the SAME process (warm GPU process), so the adapter's warm-process dependence is read too. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const RUNS = +(process.argv[2] || 4);
const OUT = process.argv[3] || 'research/optimization-2026-09-24/probes/D/compare-headed.json';
const prefs = { 'privacy.reduceTimerPrecision': false };
const V = [['A', 'research/optimization-2026-09-24/probes/D/lab-i/'], ['B', 'research/optimization-2026-09-24/probes/D/lab-p/']];
const READ = `for (let k = 0; k < 6000; k++) { if (window.__LW && __LW.ready && __LW.stats.presents > 0) break; await new Promise(r => requestAnimationFrame(r)); }
  const first = +performance.now().toFixed(1);
  const m = Object.fromEntries(performance.getEntriesByType('mark').map(e => [e.name, +e.startTime.toFixed(1)]));
  const d = (a, b) => (m[a] !== undefined && m[b] !== undefined) ? +(m[b] - m[a]).toFixed(1) : null;
  return { first, ready: m['lw-ready'], boot: m['boot-start'], fieldStart: m['field-start'], fieldEnd: m['field-end'],
    createField: d('field-start', 'field-end'), adapter: d('f:adapter', 'f:adapter-done'), device: d('f:device', 'f:device-done'),
    earlyAdapter: d('early:adapter', 'early:adapter-done'), earlyDevice: d('early:adapter-done', 'early:device-done'),
    earlyStart: m['early:adapter'], ok: __LW.field.ok, digest: (await __LW.fieldDigest() || {}).hash, limits: __LW.field.limitsRequested, errs: window.__e, ua: navigator.userAgent };`;
const res = { runs: [] };
for (let i = 0; i < RUNS; i++) for (const [tag, p] of V) {
  const url = `https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`;
  const g = await open(url, { width: 1600, height: 900, prefs, headless: false });
  try {
    const cold = await g.ev(READ);
    await g.ev(`location.href = ${JSON.stringify(url + '&warm=1')}; return 1;`).catch(() => {});
    await new Promise((r) => setTimeout(r, 400));
    const warm = await g.ev(READ);
    for (const [kind, r] of [['cold', cold], ['warm', warm]]) {
      r.tag = tag; r.i = i; r.kind = kind; res.runs.push(r);
      console.log(tag, i, kind, 'ready', r.ready, 'first', r.first, 'boot', r.boot, 'createField', r.createField, 'adapter', r.adapter, 'device', r.device, 'early', r.earlyStart, r.earlyAdapter, r.earlyDevice, 'digest', r.digest, 'errs', (r.errs || []).length);
    }
  } finally { await g.close(); }
}
const med = (a) => { const v = a.filter((x) => x !== null && x !== undefined).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : null; };
const S = {};
for (const [tag] of V) for (const kind of ['cold', 'warm']) {
  const rs = res.runs.filter((r) => r.tag === tag && r.kind === kind);
  S[tag + ' ' + kind] = { ready: med(rs.map((r) => r.ready)), first: med(rs.map((r) => r.first)), createField: med(rs.map((r) => r.createField)),
    adapter: med(rs.map((r) => r.earlyAdapter ?? r.adapter)), device: med(rs.map((r) => r.earlyDevice ?? r.device)), fieldWaitAdapter: med(rs.map((r) => r.adapter)),
    readyRange: [Math.min(...rs.map((r) => r.ready)), Math.max(...rs.map((r) => r.ready))] };
}
res.summary = S; res.ua = res.runs[0] && res.runs[0].ua;
console.log(JSON.stringify(S, null, 1));
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
