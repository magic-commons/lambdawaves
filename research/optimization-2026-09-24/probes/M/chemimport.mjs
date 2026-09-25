/* chemimport.mjs — lane M · M8 gate: BASE (lab-base) vs built lab/, a fresh headless Firefox per road.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/chemimport.mjs
 * (1) which of molecule-state.js and its five imports are fetched by the boot (resource timing, ready + 2 s);
 * (2) for each road into a first solve — prepare(), setOn(true), the molecule dropdown, the basis control,
 *     __LW.chem.solve — record() right before and right after the solve resolves (non-null after, as base). */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8723';
const MODS = ['molecule-state.js', 'rhf-molecule.js', 'scf.js', 'density.js', 'rpa-inspector.js', 'canon-gauge.js'];
const ROADS = {
  prepare: `await C.prepare();`,
  setOn: `C.setOn(true); for (let k = 0; k < 200 && !(C.solution() && C.solution().roots); k++) await w(50);`,
  dropdown: `const sel = document.querySelector('.dev[data-id="chem"] select'); sel.value = [...sel.options].map((o) => o.value).find((v) => v !== C.preset()) ; sel.dispatchEvent(new Event('change')); for (let k = 0; k < 200 && !(C.solution() && C.solution().roots); k++) await w(50);`,
  basis: `await C.setBasis('sto-3g'); if (!C.solution()) await C.solve();`,
  api: `await C.solve('h2o');`,
};
const out = {};
for (const [tag, p] of [['base', 'research/optimization-2026-09-24/probes/M/lab-base/'], ['built', 'lab/']]) {
  out[tag] = {};
  for (const [road, js] of Object.entries(ROADS)) {
    const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900 });
    try {
      await g.waitFor('window.__LW && __LW.ready', 3000, 20);
      out[tag][road] = await g.ev(`const w = (n) => new Promise((r) => setTimeout(r, n)); const C = __LW.chem;
        await w(2000);
        const fetched = performance.getEntriesByType('resource').map((e) => e.name.split('/').pop()).filter((n) => ${JSON.stringify(MODS)}.includes(n));
        const before = C.record();
        ${js}
        const rec = C.record();
        return { bootFetched: fetched, recordBefore: before === null ? null : typeof before, recordAfter: rec === null ? null : (rec.error ? 'error: ' + rec.error : Object.keys(rec).slice(0, 4).join(',')), preset: C.preset(), energy: C.solution() && C.solution().energy, errs: window.__e };`);
      console.log(tag, road, JSON.stringify(out[tag][road]));
    } finally { await g.close(); }
  }
}
const b = out.built, a = out.base;
const pass = Object.keys(ROADS).every((r) => b[r].recordBefore === null && b[r].recordAfter && b[r].recordAfter === a[r].recordAfter && b[r].energy === a[r].energy && b[r].errs.length === 0)
  && b.prepare.bootFetched.length === 0;
console.log('boot fetched base', JSON.stringify(a.prepare.bootFetched), '→ built', JSON.stringify(b.prepare.bootFetched));
console.log((pass ? 'GREEN' : 'RED') + ' M8: no chemistry record modules at boot; record() null before and non-null after the first solve on all five roads, same energy as base');
process.exit(pass ? 0 : 1);
