/* project-open.mjs — the device report's PROJECT OPEN alone (`__LW.report({ only: 'project' })`) in headless Firefox: WAVE DANCER
 * clicked open while playing, the state as found restored, each timed and broken down; and the instrument before/after on every
 * count report-api.mjs reads, plus what a project open touches outside serialize(): the notebook (face, mode, size, text, title,
 * subtitle, preview, status), the current project, the unsaved-changes mark, the stored collection and the notebook keys, the
 * focus, and the methods the scene wrapped (put back).
 *   LW_PORT=8737 GD_PORT=5251 node research/optimization-2026-09-24/probes/PROJECT/project-open.mjs [out.json] [query] */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8737';
const OUT = process.argv[2] || '/tmp/lwR-project-open.json';
const QUERY = process.argv[3] || '';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0${QUERY}`, { width: 1600, height: 1000, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
const SNAP = `const snap = () => { const o = __LW.serialize(); delete o.presentation.layout.at; delete o.presentation.quality.autoScale;
  const ls = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
  const nb = document.getElementById('notebook'), q = (x) => nb.querySelector(x);
  return { ser: JSON.stringify(o), settings: localStorage.getItem('lambdawaves.q0.settings'), ls: JSON.stringify(ls),
    hist: JSON.stringify({ c: __LW.history.cursor, d: __LW.history.depth, r: __LW.history.redoDepth, n: __LW.history.entries().length }),
    t: __LW.clock.t, playing: __LW.clock.playing, frost: __LW.frost, card: __LW.cardStyle, ui: __LW.uiHidden, mod: __LW.mod.expanded,
    q: JSON.stringify(__LW.quality), res: __LW.field.resolution, steps: __LW.mat.steps, canvas: [__LW.field.canvas.width, __LW.field.canvas.height],
    notebook: JSON.stringify({ hidden: nb.hidden, face: nb.dataset.face, mode: nb.dataset.mode, style: nb.getAttribute('style'), faces: ['.nb-notes', '.nb-aboutface', '.nb-projectsface'].map((x) => q(x).hidden),
      text: q('.nb-text').value, title: q('.nb-title').value, sub: [q('.nb-subtitle').value, q('.nb-subtitle').hidden], view: q('.nb-view').innerHTML, status: q('.pj-status').textContent }),
    project: JSON.stringify({ current: __LW.projects.current, dirty: __LW.projects.dirty, n: __LW.projects.list().length }),
    focus: document.activeElement ? document.activeElement.tagName + '.' + document.activeElement.className : null,
    wrapped: JSON.stringify([__LW.projects.open.name, __LW.projects.importText.name, __LW.reg.restore === Object.getPrototypeOf(__LW.reg).restore, __LW.layout.applyLayout.name, JSON.parse.name, JSON.stringify.name, Storage.prototype.setItem.name, __LW.field.setResolution.name, __LW.field.frame.name,
      Object.prototype.hasOwnProperty.call(document.querySelector('#notebook .nb-view'), 'innerHTML')]),
    cls: document.body.className }; };`;
const out = {};
try {
  await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
  out.setup = await g.ev(`__LW.mod.expand(); await __LW.settle(); __LW.mod.collapse(); __LW.pause(); __LW.scrub(0); await __LW.settle(); await new Promise(r => setTimeout(r, 1500)); return { settings: !!localStorage.getItem('lambdawaves.q0.settings') };`);
  out.before = await g.ev(`${SNAP} return snap();`);
  const t0 = Date.now();
  out.report = await g.ev(`return await __LW.report({ only: 'project', gpu: false });`);
  out.wallSec = (Date.now() - t0) / 1000;
  await g.ev(`await new Promise(r => setTimeout(r, 1200)); return 1;`);   // a late tail (the ring's quiet window, a notebook flush) would land here
  out.after = await g.ev(`${SNAP} return snap();`);
  out.same = Object.fromEntries(Object.keys(out.before).map((k) => [k, JSON.stringify(out.before[k]) === JSON.stringify(out.after[k])]));
  out.errs = await g.ev('return (window.__e || []).map(String).slice(0, 20)');
} catch (e) { out.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const sc = out.report && Array.isArray(out.report.scenes) ? out.report.scenes.find((s) => /^project open/.test(s.label)) : null;
const po = sc && sc.projectOpen;
const one = (r) => r && { ok: r.ok, afterClickMs: r.afterClickMs, syncMs: r.syncMs, styleLayoutMs: r.styleLayoutMs, loop: [r.before && r.before.loopMedianMs, r.after && r.after.loopMedianMs],
  rebuild: r.rebuildFrame && { fieldTo: r.rebuildFrame.fieldTo, noRebuild: r.rebuildFrame.noRebuild, setResolutionMs: r.rebuildFrame.setResolutionMs, f1: r.rebuildFrame.firstFrame, f2: r.rebuildFrame.secondFrame }, window: r.window };
console.log(JSON.stringify({ wallSec: out.wallSec, same: out.same, diff: Object.keys(out.same || {}).filter((k) => !out.same[k]).map((k) => [k, String(out.before[k]).slice(0, 300), String(out.after[k]).slice(0, 300)]),
  restored: out.report && out.report.restored, errors: out.report && out.report.errors, errs: out.errs, error: out.error,
  scene: sc && { label: sc.label, skipped: sc.skipped, error: sc.error, rafFps: sc.rafFps, maxGapMs: sc.maxGapMs, marks: sc.marks },
  importText: po && po.importText, open: po && one(po.open), restore: po && one(po.restore),
  breakdown: po && Object.fromEntries(Object.entries(po.breakdown).map(([k, v]) => [k, v.slice(0, 12).map((x) => x.label + ' ' + x.selfMs + '/' + x.ms + ' ×' + x.n + (x.bytes ? ' ' + x.bytes + 'B' : ''))])), residue: po && po.residue }, null, 1));
