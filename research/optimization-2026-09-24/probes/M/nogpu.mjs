/* nogpu.mjs — lane M · M3 gate (adapted from probes/D/nogpu.mjs): boot with WebGPU switched off
 * (Firefox pref dom.webgpu.enabled=false), the BASE copy (probes/M/lab-base = 91c90bc) vs the built lab/.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/nogpu.mjs
 * Reads: LW.ready, the banner, every error before and after the visitor's pokes (resize → syncPhone, play/pause,
 * theme, project save + open). */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8723';
const out = {};
for (const [tag, p] of [['base', 'research/optimization-2026-09-24/probes/M/lab-base/'], ['built', 'lab/']]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, prefs: { 'dom.webgpu.enabled': false } });
  try {
    await g.ev(`for (let i = 0; i < 200; i++) { if ((window.__LW && __LW.ready) || (window.__e && __e.some(e => /BOOT/.test(e)))) break; await new Promise(r => setTimeout(r, 50)); } return 1;`);
    const r = await g.ev(`const out = { gpu: !!navigator.gpu, ready: !!(window.__LW && __LW.ready), banner: (() => { const b = document.getElementById('banner'); return b && !b.hidden ? b.querySelector('h3').textContent + ' — ' + b.querySelector('p').textContent.slice(0, 120) : null; })(), errs0: (window.__e || []).map(e => e.slice(0, 200)) };
      if (out.ready) { try { dispatchEvent(new Event('resize')); await new Promise(r => setTimeout(r, 50)); __LW.play(); await new Promise(r => setTimeout(r, 300)); __LW.pause(); __LW.setTheme('dark'); __LW.layout.projects.save('nogpu/one'); __LW.layout.projects.open('nogpu/one'); dispatchEvent(new Event('resize')); await new Promise(r => setTimeout(r, 300)); out.poked = true; } catch (e) { out.pokeErr = String(e && e.message || e); } }
      out.errs = (window.__e || []).map(e => e.slice(0, 200)); out.frames = window.__LW ? __LW.stats.frames : null; return out;`);
    out[tag] = r;
    console.log(tag, JSON.stringify(r));
  } finally { await g.close(); }
}
const b = out.built || {};
const pass = b.ready === true && /^WebGPU unavailable/.test(b.banner || '') && b.poked === true && (b.errs || []).length === 0;
console.log((pass ? 'GREEN' : 'RED') + ' nogpu built: ready ' + b.ready + ', banner ' + JSON.stringify((b.banner || '').slice(0, 60)) + ', errors ' + (b.errs || []).length);
process.exit(pass ? 0 : 1);
