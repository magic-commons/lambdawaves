/* nogpu.mjs — L6: boot with WebGPU switched off (Firefox pref dom.webgpu.enabled=false), shipped vs guarded.
 *   LW_PORT=8721 GD_PORT=5234 node research/optimization-2026-09-24/probes/D/nogpu.mjs
 * lab/ is the shipped build; probes/D/lab-g/ is lab-i + `field.setDprCap && field.setDprCap(…)` at every call site
 * (instrument.py --nogpu-guard).  Reads: whether LW.ready came up, the boot error, the banner, what else throws. */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8721';
for (const [tag, p] of [['shipped', 'lab/'], ['guarded', 'research/optimization-2026-09-24/probes/D/lab-g/']]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, prefs: { 'dom.webgpu.enabled': false } });
  try {
    await g.ev(`for (let i = 0; i < 100; i++) { if ((window.__LW && __LW.ready) || (window.__e && __e.some(e => /BOOT/.test(e)))) break; await new Promise(r => setTimeout(r, 50)); } return 1;`);
    /* then poke what a visitor does: a resize (syncPhone is on 'resize'), a play/pause, a theme flip, a project save/open */
    const r = await g.ev(`const out = { gpu: !!navigator.gpu, ready: !!(window.__LW && __LW.ready), banner: (() => { const b = document.getElementById('banner'); return b && !b.hidden ? b.querySelector('h3').textContent + ' — ' + b.querySelector('p').textContent.slice(0, 120) : null; })(), errs0: (window.__e || []).map(e => e.slice(0, 200)) };
      if (out.ready) { try { dispatchEvent(new Event('resize')); await new Promise(r => setTimeout(r, 50)); __LW.play(); await new Promise(r => setTimeout(r, 300)); __LW.pause(); __LW.setTheme('dark'); __LW.layout.projects.save('nogpu/one'); __LW.layout.projects.open('nogpu/one'); await new Promise(r => setTimeout(r, 300)); out.poked = true; } catch (e) { out.pokeErr = String(e && e.message || e); } }
      out.errs = (window.__e || []).map(e => e.slice(0, 200)); out.frames = window.__LW ? __LW.stats.frames : null; return out;`);
    console.log(tag, JSON.stringify(r, null, 1));
  } finally { await g.close(); }
}
