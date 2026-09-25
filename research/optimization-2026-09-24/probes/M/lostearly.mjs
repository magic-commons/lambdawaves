/* lostearly.mjs — lane M · M1 gate (after REFUTE-F's probe-f-lostearly): a WebGPU device destroyed at three moments,
 * headless Firefox.  Copies are made by probes/M/mk-lost.py (one planted `device.destroy()` each):
 *   base-lostearly  91c90bc, destroyed right after requestDevice (inside createField's old block)
 *   lostearly       built, destroyed inside gpu-boot.js (lost while the module graph loads)
 *   lostcompile     built, destroyed inside createField after the early check (lost during the compile stretch)
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/lostearly.mjs
 * PASS (built copies): LW.ready true, field.ok false, error "device lost: …", the lost banner up, 0 errors. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8723';
const M = 'research/optimization-2026-09-24/probes/M/';
const R = {};
for (const tag of ['base-lostearly', 'lostearly', 'lostcompile']) {
  const g = await open(`https://127.0.0.1:${PORT}/${M}lab-${tag}/?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 120000 });
  try {
    for (let i = 0; i < 150; i++) { if (await g.ev('return !!(window.__LW && __LW.ready) || !!(window.__e && window.__e.some(e => /BOOT/.test(e)))')) break; await new Promise((r) => setTimeout(r, 100)); }
    await new Promise((r) => setTimeout(r, 600));
    R[tag] = await g.ev(`const b = document.getElementById('banner'); const f = window.__LW && __LW.field;
      let px = null; try { px = window.__LW && __LW.ready ? await __LW.readPixels() : null; } catch (e) { px = { threw: String(e && e.message || e).slice(0, 80) }; }
      if (window.__LW && __LW.ready) { try { dispatchEvent(new Event('resize')); __LW.play(); await new Promise(r => setTimeout(r, 300)); __LW.pause(); } catch (e) { (window.__e = window.__e || []).push('POKE ' + e.message); } }
      return { ready: !!(window.__LW && __LW.ready), fieldOk: f ? f.ok : null, error: f ? f.error : null, hasMethods: !!(f && f.setDprCap),
        bannerShown: b ? !b.hidden : null, bannerTitle: b ? (b.querySelector('h3') || {}).textContent : null,
        readPixels: px && (px.threw || { nonBlack: px.nonBlack, total: px.total }), errs: (window.__e || []).map(String).map(s => s.slice(0, 160)).slice(0, 5) };`);
    console.log(tag, JSON.stringify(R[tag]));
  } catch (e) { console.error('PROBE ERROR', tag, e); R[tag] = { probeError: String(e && e.message || e) }; }
  finally { await g.close(); }
}
const ok = (r) => r && r.ready === true && r.fieldOk === false && /^device lost/.test(r.error || '') && r.bannerShown && /lost/.test(r.bannerTitle || '') && (r.errs || []).length === 0;
const pass = ok(R.lostearly) && ok(R.lostcompile);
fs.writeFileSync('/tmp/lwM-lostearly-firefox.json', JSON.stringify(R, null, 1));
console.log((pass ? 'GREEN' : 'RED') + ' lost-early Firefox: built copies ready + ok:false + lost banner + 0 errors');
process.exit(pass ? 0 : 1);
