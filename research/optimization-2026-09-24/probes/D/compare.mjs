/* compare.mjs — interleaved A/B boot timing of two copies of the lab, each run a fresh headless Firefox.
 *   LW_PORT=8721 GD_PORT=5234 node research/optimization-2026-09-24/probes/D/compare.mjs <pathA> <pathB> [runs] [out.json]
 * paths are served paths, e.g. research/optimization-2026-09-24/probes/D/lab-i/ and …/lab-p/.
 * Reads: the marks, the first presented frame, and the field digest + serialize() bytes after settle (neutrality). */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const [A, B] = [process.argv[2], process.argv[3]];
const RUNS = +(process.argv[4] || 4);
const OUT = process.argv[5] || 'research/optimization-2026-09-24/probes/D/compare.json';
const prefs = { 'privacy.reduceTimerPrecision': false };
const res = { A, B, runs: [] };
for (let i = 0; i < RUNS; i++) for (const [tag, p] of [['A', A], ['B', B]]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, prefs });
  try {
    const first = await g.ev(`for (let k = 0; k < 6000; k++) { if (window.__LW && __LW.ready && __LW.stats.presents > 0) return +performance.now().toFixed(1); await new Promise(r => requestAnimationFrame(r)); } return -1;`);
    const r = await g.ev(`await __LW.settle(); await __LW.settle();
      const m = Object.fromEntries(performance.getEntriesByType('mark').map(e => [e.name, +e.startTime.toFixed(1)]));
      const ser = JSON.stringify(__LW.serialize());
      let h = 2166136261 >>> 0; for (let i = 0; i < ser.length; i++) { h = (h ^ ser.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; }
      return { m, digest: await __LW.fieldDigest(), serHash: h, serLen: ser.length, ok: __LW.field.ok, limits: __LW.field.limitsRequested, adapter: __LW.field.adapterInfo, errs: window.__e };`);
    r.firstPresent = first; r.tag = tag; r.i = i;
    const m = r.m;
    console.log(tag, i, 'ready', m['lw-ready'], 'firstPresent', first, 'boot', m['boot-start'], 'field', m['field-start'], '→', m['field-end'], 'early', m['early:adapter'], m['early:adapter-done'], m['early:device-done'], 'digest', JSON.stringify(r.digest).slice(0, 80), 'ser', r.serHash, r.serLen, 'errs', (r.errs || []).length);
    res.runs.push(r);
  } finally { await g.close(); }
}
const stat = (tag, k) => { const v = res.runs.filter((r) => r.tag === tag).map((r) => (k === 'firstPresent' ? r.firstPresent : r.m[k])).sort((a, b) => a - b); return { median: v[v.length >> 1], min: v[0], max: v[v.length - 1] }; };
res.summary = { A: { ready: stat('A', 'lw-ready'), firstPresent: stat('A', 'firstPresent') }, B: { ready: stat('B', 'lw-ready'), firstPresent: stat('B', 'firstPresent') } };
console.log(JSON.stringify(res.summary));
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
