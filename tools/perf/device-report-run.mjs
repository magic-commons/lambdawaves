/* tools/perf/device-report-run.mjs — THE DEVICE REPORT, driven from this desk (0.4.0 S2).  The report itself is
 * tools/perf/device-report.js (`__LW.report(opts)`); this opens the lab in the gate's Firefox on LW_PORT / GD_PORT, runs
 * it once and writes the JSON, so a before/after pair on the 3070 is two commands:
 *   LW_PORT=8747 GD_PORT=5215 node tools/perf/device-report-run.mjs out.json [--gpu]
 * The GPU rows are off unless --gpu (they rebuild grids and take minutes); the scenes, the 30 s long play included, run.
 * One line per report is printed: the long play's rAF fps, presents, held frames and loop median, and every scene's fps. */
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';

const args = process.argv.slice(2), out = args.find((a) => !a.startsWith('--'));
if (!out) { console.error('usage: node tools/perf/device-report-run.mjs out.json [--gpu]'); process.exit(2); }
const PORT = process.env.LW_PORT || '8721';
const g = await open(`https://127.0.0.1:${PORT}/lab/?sw=0&warn=0`, { width: 1600, height: 1000, script: 900000 });
try {
  if (!(await g.waitFor('window.__LW && __LW.ready', 3000, 20)).ok) throw new Error('the lab never became ready');
  const R = await g.ev(`return await __LW.report({ gpu: ${args.includes('--gpu')} });`);
  if (!R || R.E) throw new Error('the report threw: ' + (R && R.E));
  fs.writeFileSync(out, JSON.stringify(R, null, 1));
  const lp = (R.scenes || []).find((s) => /^long play/.test(s.label)) || {};
  console.log('long play: ' + lp.rafFps + ' fps · ' + lp.presents + ' presents · ' + lp.skipped + ' held · loop median ' + lp.loopMedianMs + ' ms · field ' + lp.fieldEmaMs + ' ms · frame median ' + lp.medianFrameMs + ' / p95 ' + lp.p95FrameMs + ' / max ' + lp.maxGapMs + ' ms');
  console.log('scenes: ' + (R.scenes || []).map((s) => s.label.split(' (')[0] + ' ' + (s.skipped ? 'skip' : s.rafFps)).join(' · '));
  console.log('errors: ' + JSON.stringify(R.errors || []));
} finally { await g.close(); }
