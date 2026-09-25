/* probe-f-l6fix.mjs — does the MINIMAL L6 fix (guard the three field.setDprCap calls) let a no-WebGPU boot finish?
 * Serves probes/F/lab-l6/ = symlinks to every lab/ file except rack.js, which is lab/rack.js with
 *   field.setDprCap(   →   field.setDprCap && field.setDprCap(
 * applied by sed (3 sites).  lab/ itself is untouched.
 *   LW_PORT=8721 GD_PORT=5236 node research/optimization-2026-09-24/probes/F/probe-f-l6fix.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const R = {};
for (const [name, path, prefs] of [['patched_noGpu', 'research/optimization-2026-09-24/probes/F/lab-l6/', { 'dom.webgpu.enabled': false }],
  ['patched_gpu', 'research/optimization-2026-09-24/probes/F/lab-l6/', {}]]) {
  const g = await open(`https://127.0.0.1:${PORT}/${path}?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 120000, prefs });
  try {
    for (let i = 0; i < 80; i++) { const ok = await g.ev('return !!(window.__LW && __LW.ready) || !!(window.__e && window.__e.length)'); if (ok) break; await new Promise((r) => setTimeout(r, 100)); }
    R[name] = await g.ev(`const b = document.getElementById('banner'); const out = { ready: !!(window.__LW && __LW.ready), fieldOk: window.__LW ? __LW.field.ok : null,
      banner: b ? { hidden: b.hidden, title: (b.querySelector('h3') || {}).textContent } : null, errsAtReady: (window.__e || []).map(String).slice(0, 6) };
      if (out.ready) { const f0 = __LW.stats.frames; __LW.play(); await new Promise((r) => setTimeout(r, 1200)); __LW.pause(); await new Promise((r) => setTimeout(r, 300));
        out.framesWhilePlaying = __LW.stats.frames - f0; out.t = +__LW.clock.t.toFixed(3); out.energyRo = (document.querySelector('.dev[data-id="shadow"]') || document.body).textContent.length > 0;
        window.dispatchEvent(new Event('resize')); __LW.layout.phone.sync(); out.phoneDprCap = __LW.layout.phone.dprCap === undefined ? 'undefined' : __LW.layout.phone.dprCap;
        out.errsAfterPlay = (window.__e || []).map(String).slice(0, 6); }
      return out;`);
  } catch (e) { R[name] = { probeError: String(e && e.message || e) }; }
  finally { await g.close(); }
  console.log(name, JSON.stringify(R[name]));
}
fs.writeFileSync('research/optimization-2026-09-24/probes/F/probe-f-l6fix.json', JSON.stringify(R, null, 1));
