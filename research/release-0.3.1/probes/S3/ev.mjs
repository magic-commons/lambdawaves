// S3 probe runner: open the lab on the gate server, wait for ready, evaluate each body file in turn, print its JSON.
//   LW_PORT=8737 GD_PORT=5237 node research/release-0.3.1/probes/S3/ev.mjs body1.js [body2.js …]
// LW_QUERY appends a query/fragment to the lab URL (e.g. '?sw=0').
import { readFileSync } from 'node:fs';
import { open } from '../../../../tools/gate/gatekit.mjs';
const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8737}/lab/${process.env.LW_QUERY || ''}`;
const g = await open(LAB, { width: 1500, height: 1000, script: 180000, prefs: { 'privacy.reduceTimerPrecision': false } });   // µs timers: the budget is measured in ms
try {
  const r = await g.waitFor('window.__LW&&__LW.ready', 200, 100);
  if (!r.ok) throw new Error('not ready');
  for (const f of process.argv.slice(2)) {
    const out = await g.ev(readFileSync(f, 'utf8'));
    console.log('── ' + f + '\n' + (typeof out === 'string' ? out : JSON.stringify(out, null, 1)));
  }
} catch (e) { console.error(e); process.exitCode = 1; }
finally { await g.close(); }
