/* ff-run.mjs — wave 127: evaluate one expression file in headless Firefox (gatekit) and print the value as JSON.
 *   LW_PORT=8740 GD_PORT=5253 node research/optimization-2026-09-24/probes/P127/ff-run.mjs <expr.js> [out.json] [path=/lab/] [query] */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const [EXPR, OUT, PAGE = '/lab/', QUERY = ''] = process.argv.slice(2);
const PORT = process.env.LW_PORT || '8740';
const g = await open(`https://127.0.0.1:${PORT}${PAGE}?preset=1s%2B2pz&sw=0${QUERY}`, { width: 1600, height: 1000, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
let out = null;
try {
  await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
  out = await g.ev('return await (' + fs.readFileSync(EXPR, 'utf8').trim().replace(/;$/, '') + ');');
} catch (e) { out = { error: String(e && e.stack || e) }; }
finally { await g.close(); }
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, Number(process.env.PRINT || 6000)));
