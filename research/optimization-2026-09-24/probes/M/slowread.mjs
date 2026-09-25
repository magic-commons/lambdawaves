/* slowread.mjs — lane M · M6: forced layout reads (> 1 ms each, with the reader) inside the boot task, interleaved
 * fresh headless-Firefox boots of two slow-read-logging copies (mk-pre.py), and the same around a project open.
 *   LW_PORT=8723 GD_PORT=5242 VARIANTS=a:lab-noM6-pre,b:lab-pre node research/optimization-2026-09-24/probes/M/slowread.mjs [runs]
 * Per boot: Σ ms of slow reads before the lw-ready mark, their readers, and Σ ms in the 1.5 s after ready; then
 * WAVE DANCER imported and opened: Σ ms of slow reads inside open(). */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8723';
const M = 'research/optimization-2026-09-24/probes/M/';
const RUNS = +(process.argv[2] || 4);
const V = (process.env.VARIANTS || 'a:lab-noM6-pre,b:lab-pre').split(',').map((s) => s.split(':'));
const rows = [];
for (let i = 0; i < RUNS; i++) for (const [tag, d] of (i % 2 ? [...V].reverse() : V)) {
  const g = await open(`https://127.0.0.1:${PORT}/${M}${d}/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    const r = await g.ev(`await new Promise((r) => setTimeout(r, 1500));
      const ready = performance.getEntriesByName('lw-ready')[0].startTime;
      const who = (s) => (s[3].split(' < ')[0] || '').replace(/^(\\w+)@.*\\/([\\w.-]+\\.js):(\\d+).*$/, '$1@$2:$3');
      const S = (__P.slow || []).slice();
      const pre = S.filter((s) => s[1] < ready), post = S.filter((s) => s[1] >= ready);
      const P = __LW.layout.projects; const res = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' }); const path = P.importText(await res.text());
      const n0 = __P.slow.length, t0 = performance.now(); P.open(path); const openMs = performance.now() - t0; const during = __P.slow.slice(n0);
      const sum = (a) => +a.reduce((x, s) => x + s[2], 0).toFixed(2);
      return { ready: +ready.toFixed(1), preMs: sum(pre), pre: pre.map((s) => who(s) + ' ' + s[2]), postMs: sum(post), post: post.map((s) => who(s) + ' ' + s[2]), openMs: +openMs.toFixed(1), openSlowMs: sum(during), open: during.map((s) => who(s) + ' ' + s[2]) };`);
    r.tag = tag; rows.push(r);
    console.log(tag, i, 'ready', r.ready, 'pre-ready slow', r.preMs, JSON.stringify(r.pre), '| post', r.postMs, '| open', r.openMs, 'slow', r.openSlowMs, JSON.stringify(r.open));
  } finally { await g.close(); }
}
const med = (a) => { const v = a.slice().sort((x, y) => x - y); return v[v.length >> 1]; };
for (const [tag] of V) { const R = rows.filter((r) => r.tag === tag); console.log('MEDIAN', tag, JSON.stringify({ ready: med(R.map((r) => r.ready)), preMs: med(R.map((r) => r.preMs)), postMs: med(R.map((r) => r.postMs)), openMs: med(R.map((r) => r.openMs)), openSlowMs: med(R.map((r) => r.openSlowMs)) })); }
fs.writeFileSync('/tmp/lwM-slowread.json', JSON.stringify(rows, null, 1));
