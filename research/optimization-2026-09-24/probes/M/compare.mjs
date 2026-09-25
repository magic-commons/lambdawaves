/* compare.mjs — lane M · M1/K10 A/B (after probes/D/compare.mjs): interleaved boots of the two MARKED copies built by
 * mk-marks.py, each in a fresh headless Firefox, and the neutrality reads after settle.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/compare.mjs [runs] [out.json]
 * Reads per boot: the marks (boot-start, field-start/-end, lw-ready, first-present, sm/ci/pl in createField, the early
 * gb-* request), fieldDigest(), limitsRequested, adapterInfo, serialize() hash with layout.at zeroed, errors. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8723';
const M = 'research/optimization-2026-09-24/probes/M/';
const RUNS = +(process.argv[2] || 5);
const OUT = process.argv[3] || '/tmp/lwM-compare.json';
const V = (process.env.VARIANTS || 'base:lab-base-mk,built:lab-mk').split(',').map((s) => { const [t, d] = s.split(':'); return [t, M + d + '/']; });   // VARIANTS=tag:dir,tag:dir (the first is 'base', the second 'built')
const prefs = { 'privacy.reduceTimerPrecision': false };
const res = { runs: [] };
for (let i = 0; i < RUNS; i++) for (const [tag, p] of (i % 2 ? [...V].reverse() : V)) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, prefs });
  try {
    const r = await g.ev(`for (let k = 0; k < 6000; k++) { if (window.__LW && __LW.ready && __LW.stats.presents > 0) break; await new Promise(r => setTimeout(r, 20)); }
      await __LW.settle(); await __LW.settle();
      const m = Object.fromEntries(performance.getEntriesByType('mark').map(e => [e.name, +e.startTime.toFixed(1)]));
      const o = __LW.serialize(); if (o.presentation && o.presentation.layout) o.presentation.layout.at = 0; const ser = JSON.stringify(o);
      let h = 2166136261 >>> 0; for (let i = 0; i < ser.length; i++) { h = (h ^ ser.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; }
      const d = await __LW.fieldDigest();
      return { m, digest: d && d.hash, integral: d && d.integral, serHash: h, serLen: ser.length, ok: __LW.field.ok, limits: __LW.field.limitsRequested, adapter: __LW.field.adapterInfo, shaderMsgs: (__LW.field.shaderMessages || []).length, errs: window.__e };`);
    r.tag = tag; r.i = i;
    const m = r.m;
    console.log(tag, i, 'ready', m['lw-ready'], 'first', m['first-present'], 'boot', m['boot-start'], 'field', m['field-start'], '→', m['field-end'], 'ci', m['ci-start'], '→', m['ci-end'], 'gb', m['gb-start'], m['gb-adapter'], m['gb-device'], 'digest', r.digest, 'ser', r.serHash, r.serLen, 'errs', (r.errs || []).length);
    res.runs.push(r);
  } finally { await g.close(); }
}
const med = (a) => { const v = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y); return v.length ? { median: v[v.length >> 1], min: v[0], max: v[v.length - 1], n: v.length } : null; };
const col = (tag, f) => med(res.runs.filter((r) => r.tag === tag).map(f));
res.summary = {};
for (const tag of ['base', 'built']) res.summary[tag] = {
  ready: col(tag, (r) => r.m['lw-ready']), firstPresent: col(tag, (r) => r.m['first-present']),
  createField: col(tag, (r) => r.m['field-end'] - r.m['field-start']), compileInfo: col(tag, (r) => r.m['ci-end'] - r.m['ci-start']),
  bootStart: col(tag, (r) => r.m['boot-start']),
  digests: [...new Set(res.runs.filter((r) => r.tag === tag).map((r) => r.digest + '/' + r.integral))],
  ser: [...new Set(res.runs.filter((r) => r.tag === tag).map((r) => r.serHash + ':' + r.serLen))],
  limits: [...new Set(res.runs.filter((r) => r.tag === tag).map((r) => JSON.stringify(r.limits)))],
  adapter: [...new Set(res.runs.filter((r) => r.tag === tag).map((r) => JSON.stringify(r.adapter)))],
  errs: res.runs.filter((r) => r.tag === tag).reduce((s, r) => s + (r.errs || []).length, 0) };
console.log(JSON.stringify(res.summary, null, 1));
const S = res.summary, same = (k) => S.base[k].length === 1 && S.built[k].length === 1 && S.base[k][0] === S.built[k][0];
const neutral = same('digests') && same('ser') && same('limits') && same('adapter') && S.built.errs === 0;
console.log((neutral ? 'GREEN' : 'RED') + ' neutrality: digest, serialize, limitsRequested, adapterInfo identical across all boots; 0 errors');
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
process.exit(neutral ? 0 : 1);
