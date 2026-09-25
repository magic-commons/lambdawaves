/* molopen.mjs — lane M · M6(c): the forced layout reads inside open() of a CURRENT-format project (it carries
 * instruments.molecule, so restore → molecule.load → setR → refresh ran paint() on the hidden legacy card), no-M6 vs M6
 * slow-read copies, interleaved fresh headless Firefox.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/molopen.mjs [runs] */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8723';
const M = 'research/optimization-2026-09-24/probes/M/';
const RUNS = +(process.argv[2] || 3);
const V = [['noM6', 'lab-noM6-pre'], ['M6', 'lab-pre']];
const acc = { noM6: [], M6: [] };
for (let i = 0; i < RUNS; i++) for (const [tag, d] of (i % 2 ? [...V].reverse() : V)) {
  const g = await open(`https://127.0.0.1:${PORT}/${M}${d}/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    const r = await g.ev(`__LW.schedule(4); await __LW.settle(); const P = __LW.layout.projects; __LW.molecule.setR(2.6); P.save('m6/mol'); __LW.molecule.setR(1.4); await __LW.settle();
      const out = [];
      for (let k = 0; k < 3; k++) { const n0 = __P.slow.length, t0 = performance.now(); P.open('m6/mol'); const ms = performance.now() - t0; const s = __P.slow.slice(n0);
        out.push({ ms: +ms.toFixed(1), mol: +s.filter((x) => /moleculeview/.test(x[3])).reduce((a, x) => a + x[2], 0).toFixed(2), all: +s.reduce((a, x) => a + x[2], 0).toFixed(2) }); await __LW.settle(); }
      return out;`);
    acc[tag].push(...r); console.log(tag, i, JSON.stringify(r));
  } finally { await g.close(); }
}
const med = (a) => { const v = a.slice().sort((x, y) => x - y); return v[v.length >> 1]; };
for (const t of ['noM6', 'M6']) console.log('MEDIAN', t, JSON.stringify({ openMs: med(acc[t].map((r) => r.ms)), moleculeviewSlowMs: med(acc[t].map((r) => r.mol)), allSlowMs: med(acc[t].map((r) => r.all)) }));
