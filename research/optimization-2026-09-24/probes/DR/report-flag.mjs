/* report-flag.mjs — the URL flag end to end in headless Firefox: open <base>/lab/?report=1&post=1, wait for the toast's
 * verdict, read __LW.lastReport and its in-page proof, and (with EXPECT_DIR) show the JSON file that landed there.
 *   BASE=https://127.0.0.1:8712 EXPECT_DIR=research/device-reports GD_PORT=5248 \
 *     node research/optimization-2026-09-24/probes/DR/report-flag.mjs [out.json] [extra query]
 * Also proves the flag's absence: the same page without ?report loads no device-report.js and paints no toast. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
import path from 'node:path';
const BASE = process.env.BASE || 'https://127.0.0.1:8712';
const OUT = process.argv[2] || '/tmp/lwR-report-flag.json';
const EXTRA = process.argv[3] || '';
const DIR = process.env.EXPECT_DIR || '';
const list = () => (DIR && fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.json')) : []);
const before = new Set(list());
const out = { base: BASE };
const g = await open(`${BASE}/lab/?preset=1s%2B2pz&sw=0&report=1&post=1${EXTRA}`, { width: 1600, height: 1000, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  out.toastEarly = await g.ev(`const t = document.querySelector('[data-device-report]'); return t ? t.textContent : null;`);
  const w = await g.waitFor(`(() => { const t = document.querySelector('[data-device-report]'); return t && /report (sent|ready)/.test(t.textContent); })()`, 1800, 100);
  out.waited = w;
  out.toast = await g.ev(`const t = document.querySelector('[data-device-report]'); return t ? { text: t.textContent, buttons: [...t.querySelectorAll('button')].map((b) => b.textContent) } : null;`);
  out.report = await g.ev('return __LW.lastReport;');
  out.errs = await g.ev('return (window.__e || []).map(String).slice(0, 20)');
} catch (e) { out.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
/* the absence of the flag, in a fresh session: no module fetched, no toast */
const g2 = await open(`${BASE}/lab/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 1000, script: 120000 });
try {
  await g2.waitFor('window.__LW && __LW.ready', 3000, 20);
  await g2.ev('await new Promise((r) => setTimeout(r, 2500)); return 1;');
  out.noFlag = await g2.ev(`return { toast: !!document.querySelector('[data-device-report]'),
    fetched: performance.getEntriesByType('resource').filter((e) => /device-report\\.js/.test(e.name)).map((e) => e.name) };`);
} catch (e) { out.error2 = String(e && e.stack || e); }
finally { await g2.close(); }
const landed = list().filter((f) => !before.has(f));
out.landed = landed.map((f) => { const p = path.join(DIR, f); return { file: p, bytes: fs.statSync(p).size, same: fs.readFileSync(p, 'utf8') === JSON.stringify(out.report) }; });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ toast: out.toast, landed: out.landed, restored: out.report && out.report.restored, errors: out.report && out.report.errors, errs: out.errs, noFlag: out.noFlag, error: out.error }, null, 1));
