/* probe-f-lostearly.mjs — REFUTE-F: what createField does with a device that is ALREADY lost when it starts (the window
 * FD1's early <head> request widens). Serves probes/F/lab-lostearly/ = lab/ symlinks + field.js with ONE added line
 * (`device.destroy()` right after requestDevice). field.js:698 registers `device.lost.then(() => out.ok = false …)`, then
 * awaits getCompilationInfo (757), then `Object.assign(out, { ok: true, … })` (1402).
 *   LW_PORT=8721 GD_PORT=5236 node research/optimization-2026-09-24/probes/F/probe-f-lostearly.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const g = await open(`https://127.0.0.1:${PORT}/research/optimization-2026-09-24/probes/F/lab-lostearly/?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 120000 });
const R = {};
try {
  for (let i = 0; i < 100; i++) { if (await g.ev('return !!(window.__LW && __LW.ready) || !!(window.__e && window.__e.length)')) break; await new Promise((r) => setTimeout(r, 100)); }
  R.lostBeforeListeners = await g.ev(`const b = document.getElementById('banner'); const f = __LW.field;
    let px = null; try { px = await __LW.readPixels(); } catch (e) { px = { threw: String(e && e.message || e) }; }
    return { ready: !!__LW.ready, fieldOk: f.ok, error: f.error, bannerShown: b ? !b.hidden : null, bannerTitle: b ? (b.querySelector('h3') || {}).textContent : null,
      readPixels: px && (px.threw || { nonBlack: px.nonBlack, total: px.total }), errs: (window.__e || []).map(String).slice(0, 5) };`);
  console.log(JSON.stringify(R.lostBeforeListeners));
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
fs.writeFileSync('research/optimization-2026-09-24/probes/F/probe-f-lostearly.json', JSON.stringify(R, null, 1));
