/* n8-reads.mjs — lane N · N8's gate, after probes/M/bootreaders.mjs + slowread.mjs: fresh headless-Firefox first visits of
 * two slow-read-logging copies (probes/M/mk-pre.py: probes/D/pre.js first in index.html, a `lw-ready` mark), interleaved;
 * per boot every layout read over 1 ms before `lw-ready`, with its reader, their sum, and the lw-ready time.
 *   python3 research/optimization-2026-09-24/probes/M/mk-pre.py lab research/optimization-2026-09-24/probes/N/lab-n8-after
 *   LW_PORT=8726 GD_PORT=5245 VARIANTS=before:lab-n8-before,after:lab-n8-after node research/optimization-2026-09-24/probes/N/n8-reads.mjs [runs] */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8726';
const N = 'research/optimization-2026-09-24/probes/N/';
const RUNS = +(process.argv[2] || 6);
const V = (process.env.VARIANTS || 'before:lab-n8-before,after:lab-n8-after').split(',').map((s) => s.split(':'));
const rows = [];
for (let i = 0; i < RUNS; i++) for (const [tag, d] of (i % 2 ? [...V].reverse() : V)) {
  const g = await open(`https://127.0.0.1:${PORT}/${N}${d}/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    const r = await g.ev(`const ready = performance.getEntriesByName('lw-ready')[0].startTime;
      const who = (s) => (s[3].split(' < ')[0] || '').replace(/^(\\w+)@.*\\/([\\w.-]+\\.js):(\\d+).*$/, '$1@$2:$3');
      const pre = (__P.slow || []).filter((s) => s[1] < ready);
      return { ready: +ready.toFixed(1), preMs: +pre.reduce((x, s) => x + s[2], 0).toFixed(2), n: pre.length, pre: pre.map((s) => who(s) + ' ' + s[2]), errors: (window.__e || []).slice(0, 3) };`);
    r.tag = tag; rows.push(r);
    console.log(tag, i, 'ready', r.ready, 'slow-before-ready', r.preMs, 'ms in', r.n, JSON.stringify(r.pre));
  } finally { await g.close(); }
}
const med = (a) => { const v = a.slice().sort((x, y) => x - y); return v[v.length >> 1]; };
const summary = {};
for (const [tag] of V) { const R = rows.filter((r) => r.tag === tag); summary[tag] = { runs: R.length, ready: med(R.map((r) => r.ready)), preMs: med(R.map((r) => r.preMs)), reads: med(R.map((r) => r.n)) }; }
console.log('MEDIAN', JSON.stringify(summary));
fs.writeFileSync(N + 'n8-reads.json', JSON.stringify({ at: new Date().toISOString(), summary, rows }, null, 1));
