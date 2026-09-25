/* boot-sections.mjs — where boot() spends its time, section by section, on an INSTRUMENTED COPY of lab/
 * (probes/E/lab-inst/, built by instrument.mjs; lab/ is never edited). Also counts the DOM the boot builds.
 *   LW_PORT=8721 GD_PORT=5235 node research/optimization-2026-09-24/probes/E/boot-sections.mjs [runs]
 */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const RUNS = +(process.argv[2] || 5);
const URL_INST = `https://127.0.0.1:${PORT}/research/optimization-2026-09-24/probes/E/lab-inst/?preset=1s%2B2pz&sw=0`;
const all = [];
for (let r = 0; r < RUNS; r++) {
  const g = await open(URL_INST, { width: 1920, height: 1080, script: 120000, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    const res = await g.ev(`
      const B = window.__LWBOOT; const nav = performance.getEntriesByType('navigation')[0] || {};
      const devs = [...document.querySelectorAll('.dev')];
      const count = (el) => el ? el.querySelectorAll('*').length + 1 : 0;
      const perDev = devs.map((d) => ({ id: d.dataset.id, closed: d.classList.contains('closed'), hidden: d.hidden, folded: d.classList.contains('folded'), nodes: count(d) }));
      const closedNodes = perDev.filter((d) => d.closed || d.hidden).reduce((s, d) => s + d.nodes, 0);
      const openNodes = perDev.filter((d) => !d.closed && !d.hidden).reduce((s, d) => s + d.nodes, 0);
      return { bootT0: +B.t0.toFixed(1), marks: B.marks, domInteractive: +(nav.domInteractive||0).toFixed(1), readyAt: +performance.now().toFixed(1),
        nodesTotal: document.querySelectorAll('*').length, devices: devs.length, closedNodes, openNodes,
        modwinNodes: count(document.getElementById('modwin')), transportNodes: count(document.getElementById('transport')),
        molecule: perDev.find((d) => d.id === 'molecule'), perDev, errs: window.__e, fieldOk: __LW.field.ok };`);
    all.push(res);
    console.log('run', r, 'ready', res.readyAt, 'boot t0', res.bootT0, 'nodes', res.nodesTotal, 'errs', JSON.stringify(res.errs));
  } finally { await g.close(); }
  await new Promise((r) => setTimeout(r, 3000));      // let the driver port go before the next open
}
/* medians per mark and per section (delta to the next mark) */
const names = all[0].marks.map((m) => m[0]);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const rows = names.map((n, i) => {
  const at = med(all.map((R) => R.marks[i][1]));
  const next = i + 1 < names.length ? med(all.map((R) => R.marks[i + 1][1] - R.marks[i][1])) : 0;
  return { mark: n, atMs: at, sectionMs: +next.toFixed(2) };
});
const summary = { url: URL_INST, runs: RUNS, bootT0Median: med(all.map((R) => R.bootT0)), readyMedian: med(all.map((R) => R.readyAt)),
  nodesTotal: all[0].nodesTotal, devices: all[0].devices, closedNodes: all[0].closedNodes, openNodes: all[0].openNodes,
  modwinNodes: all[0].modwinNodes, transportNodes: all[0].transportNodes, molecule: all[0].molecule, sections: rows, perDev: all[0].perDev };
fs.writeFileSync('research/optimization-2026-09-24/probes/E/boot-sections.json', JSON.stringify({ summary, runs: all }, null, 1));
console.log(JSON.stringify(summary, null, 1));
