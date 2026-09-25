/* projects.mjs — LANE D: what one project open() / restore() is made of, and the storage traffic around it.
 *   LW_PORT=8721 GD_PORT=5234 node research/optimization-2026-09-24/probes/D/projects.mjs [copyPath] [out.json]
 * Runs against the INSTRUMENTED copy (default probes/D/lab-i/): restore() carries a performance.mark before every
 * sub-step, saveSettings/schedule/paintMarks/applyAccent/serialize/projectKey/hLiveKey are counted and timed, and
 * pre.js logs every layout read over 1 ms with its stack.  Scenarios: the default boot state, the WAVE DANCER demo,
 * restore(serialize()), and the dirty check. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const COPY = process.argv[2] || 'research/optimization-2026-09-24/probes/D/lab-i/';
const OUT = process.argv[3] || 'research/optimization-2026-09-24/probes/D/projects.json';
const g = await open(`https://127.0.0.1:${PORT}/${COPY}?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = { copy: COPY, scenarios: [] };
/* one measured call: marks cleared first, counters diffed, slow reads captured; `body` returns nothing */
const MEASURE = (label, body, reps = 3) => `
  const out = [];
  for (let rep = 0; rep < ${reps}; rep++) {
    await __LW.settle(); await new Promise(r => setTimeout(r, 150));
    performance.clearMarks(); const c0 = JSON.parse(JSON.stringify(__P.cnt)), t0 = JSON.parse(JSON.stringify(__P.t)), s0 = __P.slow.length; __P.log.length = 0; __P.trace = true;
    const a = performance.now(); ${body}; const wall = performance.now() - a; __P.trace = false;
    const marks = performance.getEntriesByType('mark').map(m => [m.name, +(m.startTime - a).toFixed(2)]);
    const dc = {}, dt = {}; for (const k of Object.keys(__P.cnt)) { const d = __P.cnt[k] - (c0[k] || 0); if (d) dc[k] = d; }
    for (const k of Object.keys(__P.t)) { const d = __P.t[k] - (t0[k] || 0); if (d > 0.005) dt[k] = +d.toFixed(2); }
    const slow = __P.slow.slice(s0).map(s => [s[0], +(s[1] - a).toFixed(1), s[2], s[3]]);
    /* the frame the restore scheduled: how long until it has run, and what it cost */
    const f0 = __LW.stats.rebuilds, fr0 = performance.now(); await __LW.settle(); const frameMs = performance.now() - fr0;
    out.push({ label: ${JSON.stringify(label)}, rep, wall: +wall.toFixed(2), frameMs: +frameMs.toFixed(1), rebuilds: __LW.stats.rebuilds - f0, marks, cnt: dc, t: dt, slow, saves: __P.log.slice(0, 40) });
  }
  return out;`;
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  await g.ev('await __LW.settle(); return 1;');
  R.boot = await g.ev(`return { settingsBytes: (localStorage.getItem('lambdawaves.q0.settings')||'').length, lsBytes: JSON.stringify(localStorage).length };`);
  /* A: the default boot state, saved and re-opened */
  await g.ev(`__LW.layout.projects.save('bench/one'); return 1;`);
  R.scenarios.push(...await g.ev(MEASURE('open(default)', `__LW.layout.projects.open('bench/one')`)));
  R.scenarios.push(...await g.ev(MEASURE('restore(serialize())', `__LW.restore(__LW.serialize())`)));
  R.scenarios.push(...await g.ev(MEASURE('dirty check', `for (let i = 0; i < 20; i++) __LW.layout.projects.dirty`, 1)));
  R.scenarios.push(...await g.ev(MEASURE('saveSettings ×50', `for (let i = 0; i < 50; i++) __LW.saveSettings()`, 1)));
  R.scenarios.push(...await g.ev(MEASURE('setTheme dark', `__LW.setTheme('dark')`, 1)));
  R.scenarios.push(...await g.ev(MEASURE('setTheme light', `__LW.setTheme('light')`, 1)));
  R.scenarios.push(...await g.ev(MEASURE('history: hLiveKey via canUndo ×50', `for (let i = 0; i < 50; i++) __LW.history.canRedo`, 1)));
  /* B: the bundled WAVE DANCER demo (a real project: modulation rack, layout, notebook) */
  const demo = await g.ev(`const r = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' }); const p = __LW.layout.projects.importText(await r.text()); return p;`);
  R.demoPath = demo;
  R.scenarios.push(...await g.ev(MEASURE('open(WAVE DANCER)', `__LW.layout.projects.open(${JSON.stringify(demo)})`)));
  R.scenarios.push(...await g.ev(MEASURE('dirty check (WAVE DANCER)', `for (let i = 0; i < 20; i++) __LW.layout.projects.dirty`, 1)));
  R.scenarios.push(...await g.ev(MEASURE('save(WAVE DANCER)', `__LW.layout.projects.save('bench/dancer-copy')`, 1)));
  R.after = await g.ev(`return { settingsBytes: (localStorage.getItem('lambdawaves.q0.settings')||'').length, projectsBytes: (localStorage.getItem('lambdawaves.q0.projects')||'').length, lsBytes: JSON.stringify(localStorage).length, errs: window.__e };`);
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
for (const s of R.scenarios) console.log(s.label, 'rep', s.rep, 'wall', s.wall, 'frame', s.frameMs, 'saves', s.cnt.saveSettings || 0, 'sched', ['schedule1', 'schedule2', 'schedule3', 'schedule4'].map(k => s.cnt[k] || 0).join('/'), 'paintMarks', s.cnt.paintMarks || 0, 'slow', s.slow.length, s.slow.reduce((a, x) => a + x[2], 0).toFixed(1));
console.log('wrote', OUT, JSON.stringify(R.boot), JSON.stringify(R.after));
