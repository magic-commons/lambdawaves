/* grid-edge.mjs — the device report's two GRID EDGES alone (`__LW.report({ only: 'grid' })`) in headless Firefox: the
 * sub-timeline of each switch, playing and paused, and the instrument before/after on every count report-api.mjs reads
 * (serialize with layout.at / quality.autoScale masked, the settings key, every localStorage key, the undo ring, the grid,
 * the steps, the canvas, the GRID segment's painted option, field.setResolution / field.frame put back).
 *   LW_PORT=8737 GD_PORT=5251 node research/optimization-2026-09-24/probes/GRID/grid-edge.mjs [out.json] [query] */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8737';
const OUT = process.argv[2] || '/tmp/lwR-grid-edge.json';
const QUERY = process.argv[3] || '';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0${QUERY}`, { width: 1600, height: 1000, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
const SNAP = `const snap = () => { const o = __LW.serialize(); delete o.presentation.layout.at; delete o.presentation.quality.autoScale;
  const ls = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
  const seg = document.querySelector('.seg[role="radiogroup"][aria-label="GRID"]');
  return { ser: JSON.stringify(o), settings: localStorage.getItem('lambdawaves.q0.settings'), ls: JSON.stringify(ls),
    hist: JSON.stringify({ c: __LW.history.cursor, d: __LW.history.depth, r: __LW.history.redoDepth, n: __LW.history.entries().length }),
    t: __LW.clock.t, playing: __LW.clock.playing, frost: __LW.frost, card: __LW.cardStyle, ui: __LW.uiHidden, mod: __LW.mod.expanded,
    q: JSON.stringify(__LW.quality), res: __LW.field.resolution, steps: __LW.mat.steps, canvas: [__LW.field.canvas.width, __LW.field.canvas.height],
    seg: seg ? [...seg.querySelectorAll('button.seg-b')].map((b) => b.textContent.trim() + (b.classList.contains('on') ? '*' : '') + b.tabIndex).join(' ') : null,
    setRes: __LW.field.setResolution.name, frame: __LW.field.frame.name,
    cls: document.body.className }; };`;
const out = {};
try {
  await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
  out.setup = await g.ev(`__LW.mod.expand(); await __LW.settle(); __LW.mod.collapse(); __LW.pause(); __LW.scrub(0); await __LW.settle(); await new Promise(r => setTimeout(r, 1500)); return { settings: !!localStorage.getItem('lambdawaves.q0.settings') };`);
  out.before = await g.ev(`${SNAP} return snap();`);
  const t0 = Date.now();
  out.report = await g.ev(`return await __LW.report({ only: 'grid', gpu: false });`);
  out.wallSec = (Date.now() - t0) / 1000;
  out.after = await g.ev(`${SNAP} return snap();`);
  out.same = Object.fromEntries(Object.keys(out.before).map((k) => [k, JSON.stringify(out.before[k]) === JSON.stringify(out.after[k])]));
  out.errs = await g.ev('return (window.__e || []).map(String).slice(0, 20)');
} catch (e) { out.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const sw = (s) => (s.switches || []).map((w) => ({ by: w.by, at: w.atMs, from: w.from, to: w.to, fieldTo: w.fieldTo, noRebuild: w.noRebuild, before: w.before, via: w.via, first: w.firstSight, callMs: w.callMs, rebuildAfterMs: w.rebuildAfterMs, setResolutionMs: w.setResolutionMs,
  allocDoneMs: w.allocDoneMs, inFlightAtAlloc: w.inFlightAtAlloc, firstFrame: w.firstFrame, secondFrame: w.secondFrame, firstPresentMs: w.firstPresentMs, firstReconstructMs: w.firstReconstructMs,
  settleMs: w.settleMs, window: w.window, pipes: [w.before && w.before.pipesPending, w.after && w.after.pipesPending] }));
console.log(JSON.stringify({ wallSec: out.wallSec, same: out.same, restored: out.report && out.report.restored, errors: out.report && out.report.errors, errs: out.errs, error: out.error,
  scenes: out.report && Array.isArray(out.report.scenes) ? out.report.scenes.map((s) => ({ label: s.label, skipped: s.skipped, error: s.error, rafFps: s.rafFps, maxGapMs: s.maxGapMs, switches: sw(s) })) : null }, null, 1));
