/* bootreaders.mjs — lane M · M6(e) follow-up: EVERY layout read (gBCR, clientWidth, offsetWidth/Height, scrollHeight,
 * getPropertyValue) inside the boot task, by call site, from probes/M/lab-pre-all (pre.js with the 1 ms threshold
 * removed).  Each call site that runs after a DOM mutation can be the boot's first full flush once the earlier ones
 * are guarded — this is the whole list the "move the flush" chain would have to clear.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/bootreaders.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8723';
const g = await open(`https://127.0.0.1:${PORT}/research/optimization-2026-09-24/probes/M/${process.env.COPY || 'lab-pre-all'}/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false } });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  const r = await g.ev(`const ready = performance.getEntriesByName('lw-ready')[0].startTime, boot = (performance.getEntriesByName('boot-start')[0] || { startTime: 0 }).startTime;
    const who = (s) => (s[3].split(' < ')[0] || '').replace(/^(\\w+)@.*\\/([\\w.-]+\\.js):(\\d+).*$/, '$1@$2:$3');
    const by = new Map(); for (const s of __P.slow.filter((s) => s[1] < ready)) { const k = s[0] + ' ' + who(s); const o = by.get(k) || { n: 0, ms: 0, first: s[1] }; o.n++; o.ms += s[2]; by.set(k, o); }
    return [...by.entries()].sort((a, b) => a[1].first - b[1].first).map(([k, o]) => k + '  ×' + o.n + '  ' + o.ms.toFixed(2) + ' ms  first@' + o.first.toFixed(0));`);
  console.log(r.join('\n'));
} finally { await g.close(); }
