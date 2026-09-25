/* probes/A/run.mjs — LANE A harness: open the lab headless (Firefox, the gate's own driver), run ONE in-page probe body
 * (a file holding the body of an async function: it may await and must return JSON), write the result.
 *   LW_PORT=8721 GD_PORT=5231 node research/optimization-2026-09-24/probes/A/run.mjs <probe-body.js> [out.json] [query]
 * The probe reads the app only through window.__LW and fetches lab/field.js as TEXT to copy its WGSL; nothing under lab/ is edited. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const body = (process.env.PRE || '') + fs.readFileSync(process.argv[2], 'utf8');
const OUT = process.argv[3] || process.argv[2].replace(/\.js$/, '.out.json');
const query = process.argv[4] || 'preset=1s%2B2pz&sw=0';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const t0 = Date.now();
const g = await open(`https://127.0.0.1:${PORT}/lab/?${query}`, { width: W, height: H, script: 1800000, prefs: { 'privacy.reduceTimerPrecision': false } });
let R;
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R = await g.ev(body);
} catch (e) { R = { E: String(e && e.stack || e) }; }
finally { await g.close(); }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log(JSON.stringify(R).slice(0, 4000));
console.log('wrote', OUT, 'in', ((Date.now() - t0) / 1000).toFixed(1), 's');
