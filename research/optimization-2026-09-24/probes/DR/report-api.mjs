/* report-api.mjs — __LW.report() in headless Firefox: the object it returns, and the instrument before/after
 * (serialize bytes with layout.at / quality.autoScale masked, the settings key, every localStorage key, the undo ring).
 *   LW_PORT=8730 GD_PORT=5248 node research/optimization-2026-09-24/probes/DR/report-api.mjs [out.json] [query] */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8730';
const OUT = process.argv[2] || '/tmp/lwR-report-api.json';
const QUERY = process.argv[3] || '';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0${QUERY}`, { width: 1600, height: 1000, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
const SNAP = `const snap = () => { const o = __LW.serialize(); delete o.presentation.layout.at; delete o.presentation.quality.autoScale;
  const ls = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
  return { ser: JSON.stringify(o), settings: localStorage.getItem('lambdawaves.q0.settings'), ls: JSON.stringify(ls),
    hist: JSON.stringify({ c: __LW.history.cursor, d: __LW.history.depth, r: __LW.history.redoDepth, n: __LW.history.entries().length }),
    t: __LW.clock.t, playing: __LW.clock.playing, frost: __LW.frost, card: __LW.cardStyle, ui: __LW.uiHidden, mod: __LW.mod.expanded,
    q: JSON.stringify(__LW.quality), res: __LW.field.resolution, steps: __LW.mat.steps, canvas: [__LW.field.canvas.width, __LW.field.canvas.height],
    cls: document.body.className }; };`;
const out = {};
try {
  await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
  /* a returning user: one preference already saved, and the modulation window opened once (so it has a place) */
  out.setup = await g.ev(`__LW.mod.expand(); await __LW.settle(); __LW.mod.collapse(); __LW.pause(); __LW.scrub(0); await __LW.settle(); await new Promise(r => setTimeout(r, 1500)); return { settings: !!localStorage.getItem('lambdawaves.q0.settings') };`);
  out.before = await g.ev(`${SNAP} return snap();`);
  const t0 = Date.now();
  out.report = await g.ev(`return await __LW.report();`);
  out.wallSec = (Date.now() - t0) / 1000;
  out.after = await g.ev(`${SNAP} return snap();`);
  out.lastReportSame = await g.ev(`return !!__LW.lastReport && __LW.lastReport.at === ${JSON.stringify(out.report && out.report.at)};`);
  out.same = Object.fromEntries(Object.keys(out.before).map((k) => [k, JSON.stringify(out.before[k]) === JSON.stringify(out.after[k])]));
  out.errs = await g.ev('return (window.__e || []).map(String).slice(0, 20)');
} catch (e) { out.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ wallSec: out.wallSec, same: out.same, restored: out.report && out.report.restored, errors: out.report && out.report.errors, errs: out.errs }, null, 1));
