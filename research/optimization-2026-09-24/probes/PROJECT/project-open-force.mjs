/* project-open-force.mjs — the device report's PROJECT OPEN with FORCE (2026-09-25) in headless Firefox, from a DIRTY state:
 * the scene runs over unsaved changes (and over a current project) and puts the current project and the unsaved-changes mark
 * back exactly; everything else project-open.mjs reads (serialize, every localStorage key, the notebook, the focus, the wraps)
 * comes back too, the undo ring being the one thing not put back.  Then, on the same dirty page, the same scene WITHOUT force
 * must skip and say how to run it; and (CASE=current) a SAVE after it must land on the project current as found.
 *   ROAD=flag  the URL flag `?report=1&only=project&force=1&post=0` (&warn=1 holds the report behind the notice while the
 *              state is made dirty; the notice is then dismissed and the report runs)          (default)
 *   ROAD=api   `__LW.report({ only: 'project', gpu: false, force: true })`
 *   CASE=current  a project saved (current) and then edited: dirty, current            (default)
 *   CASE=fresh    NEW (projects.fresh) and then touched: dirty, nothing current — the commissioner's iPad.  NEW focuses the
 *                 notebook text; it is blurred here, because the report's UI hide/show for the display cadence drops that focus
 *                 with or without force (measured 2026-09-25: an unforced run from a focused textarea ends on BODY too)
 *   LW_PORT=8739 GD_PORT=5252 ROAD=flag CASE=current node research/optimization-2026-09-24/probes/PROJECT/project-open-force.mjs [out.json] */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8737';
const ROAD = process.env.ROAD || 'flag', CASE = process.env.CASE || 'current';
const OUT = process.argv[2] || `/tmp/lwR-project-open-force-${ROAD}-${CASE}.json`;
const FLAG = ROAD === 'flag' ? '&report=1&only=project&force=1&post=0&warn=1' : '';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0${FLAG}`, { width: 1600, height: 1000, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
const SNAP = `const snap = () => { const o = __LW.serialize(); delete o.presentation.layout.at; delete o.presentation.quality.autoScale;
  const ls = {}; for (const k of Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).sort()) ls[k] = localStorage.getItem(k);   // by name: Firefox's enumeration order moves after a remove + set
  const nb = document.getElementById('notebook'), q = (x) => nb.querySelector(x);
  return { ser: JSON.stringify(o), settings: localStorage.getItem('lambdawaves.q0.settings'), ls: JSON.stringify(ls),
    hist: JSON.stringify({ c: __LW.history.cursor, d: __LW.history.depth, r: __LW.history.redoDepth, n: __LW.history.entries().length }),
    t: __LW.clock.t, playing: __LW.clock.playing, frost: __LW.frost, card: __LW.cardStyle, ui: __LW.uiHidden, mod: __LW.mod.expanded,
    q: JSON.stringify(__LW.quality), res: __LW.field.resolution, steps: __LW.mat.steps, canvas: [__LW.field.canvas.width, __LW.field.canvas.height],
    notebook: JSON.stringify({ hidden: nb.hidden, face: nb.dataset.face, mode: nb.dataset.mode, style: nb.getAttribute('style'), faces: ['.nb-notes', '.nb-aboutface', '.nb-projectsface'].map((x) => q(x).hidden),
      text: q('.nb-text').value, title: q('.nb-title').value, sub: [q('.nb-subtitle').value, q('.nb-subtitle').hidden], view: q('.nb-view').innerHTML, status: q('.pj-status').textContent }),
    project: JSON.stringify({ current: __LW.projects.current, dirty: __LW.projects.dirty, n: __LW.projects.list().length }),
    focus: document.activeElement ? document.activeElement.tagName + '.' + document.activeElement.className : null,
    caret: document.activeElement && document.activeElement.classList.contains('nb-text') ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null,
    wrapped: JSON.stringify([__LW.projects.open.name, __LW.projects.importText.name, __LW.reg.restore === Object.getPrototypeOf(__LW.reg).restore, __LW.layout.applyLayout.name, JSON.parse.name, JSON.stringify.name, Storage.prototype.setItem.name, __LW.field.setResolution.name, __LW.field.frame.name,
      Object.prototype.hasOwnProperty.call(document.querySelector('#notebook .nb-view'), 'innerHTML')]),
    cls: document.body.className }; };`;
const out = { road: ROAD, case: CASE };
try {
  await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
  out.setup = await g.ev(`__LW.mod.expand(); await __LW.settle(); __LW.mod.collapse(); __LW.pause(); __LW.scrub(0); await __LW.settle(); await new Promise(r => setTimeout(r, 1500));
    return { warningOpen: __LW.warning.open, flagToast: !!document.querySelector('[data-device-report]') };`);
  /* the dirty state: CASE=current saves a project (current, clean) and then edits it; CASE=fresh presses NEW and then touches */
  out.dirtied = await g.ev(`const P = __LW.projects, steps = [];
    ${CASE === 'fresh' ? `steps.push(['fresh', P.fresh(), P.current, P.dirty]); document.activeElement.blur();` : `steps.push(['save PROBE/force', P.save('PROBE/force'), P.current, P.dirty]);`}
    __LW.mat.gamma = Math.round((__LW.mat.gamma + 0.15) * 1000) / 1000; __LW.schedule(__LW.TIER.PRESENT); await __LW.settle();
    steps.push(['gamma +0.15', __LW.mat.gamma, P.current, P.dirty]);
    ${CASE === 'fresh' ? `` : `__LW.notebook.text = 'probe notes — edited after the save'; steps.push(['notebook text', null, P.current, P.dirty]);`}
    await new Promise(r => setTimeout(r, 300));
    return steps;`);
  const t0 = Date.now();
  if (ROAD === 'flag') {
    out.before = await g.ev(`${SNAP} if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); __LW.warning.dismiss(); return snap();`);   // the report starts on the notice's dismissal
    out.waited = await g.waitFor(`(() => { const t = document.querySelector('[data-device-report]'); return t && /report (sent|ready)/.test(t.textContent); })()`, 3600, 100);
    out.toast = await g.ev(`const t = document.querySelector('[data-device-report]'); return t ? t.textContent : null;`);
    out.report = await g.ev('return __LW.lastReport;');
  } else {
    out.before = await g.ev(`${SNAP} return snap();`);
    out.report = await g.ev(`return await __LW.report({ only: 'project', gpu: false, force: true });`);
  }
  out.wallSec = (Date.now() - t0) / 1000;
  await g.ev(`await new Promise(r => setTimeout(r, 1200)); return 1;`);   // a late tail (the ring's quiet window, a notebook flush) would land here
  out.after = await g.ev(`${SNAP} return snap();`);
  out.same = Object.fromEntries(Object.keys(out.before).map((k) => [k, JSON.stringify(out.before[k]) === JSON.stringify(out.after[k])]));
  /* the same page, still dirty: WITHOUT force the scene skips and says how to run it */
  out.noForce = await g.ev(`const R = await __LW.report({ only: 'project', gpu: false }); const s = R.scenes.find((x) => /^project open/.test(x.label)); return { skipped: s && s.skipped, project: R.restored.project };`);
  out.afterNoForce = await g.ev(`return JSON.stringify({ current: __LW.projects.current, dirty: __LW.projects.dirty });`);
  /* a SAVE now lands on the project current as found, and clears the mark */
  if (CASE === 'current') out.saveAfter = await g.ev(`const P = __LW.projects, c = P.current, ok = P.save(); return { current: c, ok, dirty: P.dirty, stored: P.list().some((it) => it.path === c) };`);
  out.errs = await g.ev('return (window.__e || []).map(String).slice(0, 20)');
} catch (e) { out.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const sc = out.report && Array.isArray(out.report.scenes) ? out.report.scenes.find((s) => /^project open/.test(s.label)) : null;
const po = sc && sc.projectOpen;
console.log(JSON.stringify({ road: ROAD, case: CASE, wallSec: out.wallSec, setup: out.setup, dirtied: out.dirtied, toast: out.toast && out.toast.slice(0, 160),
  before: out.before && JSON.parse(out.before.project), after: out.after && JSON.parse(out.after.project), same: out.same,
  diff: Object.keys(out.same || {}).filter((k) => !out.same[k]).map((k) => [k, String(out.before[k]).slice(0, 200), String(out.after[k]).slice(0, 200)]),
  restored: out.report && out.report.restored, errors: out.report && out.report.errors, errs: out.errs, error: out.error,
  scene: sc && { skipped: sc.skipped, error: sc.error, rafFps: sc.rafFps, marks: sc.marks, force: po && po.force },
  open: po && po.open && { ok: po.open.ok, syncMs: po.open.syncMs }, restore: po && po.restore && { ok: po.restore.ok, syncMs: po.restore.syncMs },
  noForce: out.noForce, afterNoForce: out.afterNoForce, saveAfter: out.saveAfter }, null, 1));
