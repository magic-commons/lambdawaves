/* run-inst.mjs — boot the INSTRUMENTED copy (probes/E/lab-inst/) or the real lab and run one snippet.
 *   LW_PORT=8721 GD_PORT=5235 node research/optimization-2026-09-24/probes/E/run-inst.mjs inst|lab '<js returning JSON>'
 */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8721';
const which = process.argv[2] || 'inst';
const js = process.argv[3] || 'return 1';
const base = which === 'lab' ? '/lab/' : '/research/optimization-2026-09-24/probes/E/lab-inst/';
const g = await open(`https://127.0.0.1:${PORT}${base}?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, script: 180000, prefs: { 'privacy.reduceTimerPrecision': false } });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  console.log(JSON.stringify(await g.ev(js), null, 1));
} finally { await g.close(); }
