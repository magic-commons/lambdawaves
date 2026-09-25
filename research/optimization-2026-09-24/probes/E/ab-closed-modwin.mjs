/* ab-closed-modwin.mjs — A/B on the instrumented COPY: does letting a CLOSED modulation window skip its own
 * layout reads (place()) and its device/transport paint (paint(true) keeps paintRings, which draws on the house
 * knobs) shorten boot, and what happens to the first two frames?  lab/ is never edited.
 *   node research/optimization-2026-09-24/probes/E/ab-closed-modwin.mjs prepare   (adds first-frame marks: A)
 *   node research/optimization-2026-09-24/probes/E/ab-closed-modwin.mjs patch     (B: the closed-window skip)
 *   LW_PORT=8721 GD_PORT=5235 node research/optimization-2026-09-24/probes/E/ab-closed-modwin.mjs run <label> [runs]
 */
import fs from 'node:fs';
const DIR = 'research/optimization-2026-09-24/probes/E/lab-inst/';
const mode = process.argv[2];
if (mode === 'prepare') {
  let r = fs.readFileSync(DIR + 'rack.js', 'utf8');
  if (!r.includes('__LWBOOT.f1')) r = r.replace('  LW.ready = true; window.__LW_READY_SEEN = true;\n',
    '  LW.ready = true; window.__LW_READY_SEEN = true; { const B = window.__LWBOOT; B.ready = performance.now() - B.t0; requestAnimationFrame(() => { B.f1 = performance.now() - B.t0; requestAnimationFrame(() => { B.f2 = performance.now() - B.t0; }); }); }\n');
  fs.writeFileSync(DIR + 'rack.js', r); console.log('prepared');
} else if (mode === 'patch') {
  let m = fs.readFileSync(DIR + 'modwindow.js', 'utf8');
  m = m.replace('  function place__inner() {\n', '  function place__inner() {\n    if (!P.open) return;   /* PROBE B: a closed window lays nothing out */\n');
  m = m.replace("    lastPaint = t;\n", "    lastPaint = t;\n    if (!P.open) { if (force) paintRings(routeIndex()); paintRuns++; return true; }   /* PROBE B */\n");
  if (!m.includes('PROBE B: a closed') || !m.includes('/* PROBE B */')) throw new Error('patch anchors missing');
  fs.writeFileSync(DIR + 'modwindow.js', m); console.log('patched');
} else if (mode === 'run') {
  const { open } = await import('../../../../tools/gate/gatekit.mjs');
  const label = process.argv[3] || 'A', RUNS = +(process.argv[4] || 6), PORT = process.env.LW_PORT || '8721';
  const rows = [];
  for (let i = 0; i < RUNS; i++) {
    const g = await open(`https://127.0.0.1:${PORT}/research/optimization-2026-09-24/probes/E/lab-inst/?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, script: 120000, prefs: { 'privacy.reduceTimerPrecision': false } });
    try {
      await g.waitFor('window.__LW && __LW.ready && window.__LWBOOT && window.__LWBOOT.f2', 3000, 20);
      rows.push(await g.ev(`const B = window.__LWBOOT, at = (n) => (B.marks.find((m) => m[0] === n) || [0, NaN])[1];
        return { field: at('field created'), ready: +B.ready.toFixed(2), f1: +B.f1.toFixed(2), f2: +B.f2.toFixed(2),
          afterField: +(B.ready - at('field created')).toFixed(2), mod: +(at('windows: ATOMS..RADIATION start') - at('modulation: start')).toFixed(2),
          applySettings: +(at('go: openLink') - at('go: applySettings')).toFixed(2), errs: window.__e.length,
          modwinNodes: document.getElementById('modwin').querySelectorAll('*').length, rings: document.querySelectorAll('.k-ring').length };`));
    } finally { await g.close(); }
    await new Promise((r) => setTimeout(r, 3000));
  }
  const med = (k) => { const s = rows.map((r) => r[k]).sort((a, b) => a - b); return s[s.length >> 1]; };
  const summary = { label, runs: RUNS, median: Object.fromEntries(['afterField', 'mod', 'applySettings', 'ready', 'f1', 'f2'].map((k) => [k, med(k)])), rows };
  fs.writeFileSync(`research/optimization-2026-09-24/probes/E/ab-closed-modwin.${label}.json`, JSON.stringify(summary, null, 1));
  console.log(JSON.stringify(summary.median), 'errs', rows.map((r) => r.errs).join(','), 'modwinNodes', rows[0].modwinNodes);
}
