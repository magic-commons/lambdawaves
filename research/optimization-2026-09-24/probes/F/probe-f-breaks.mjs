/* probe-f-breaks.mjs — LANE F: the two BREAK cases, in the gate's headless Firefox.
 *   LW_PORT=8721 GD_PORT=5236 node research/optimization-2026-09-24/probes/F/probe-f-breaks.mjs
 * (a) NO WEBGPU (dom.webgpu.enabled = false): does boot() reach LW.ready, and does the "WebGPU unavailable" banner show?
 * (b) A LOST DEVICE while idle: does the loop go quiet again (idle = zero work), and what does the next boot-level call do?
 * (c) perf.median vs the last frame: the ring's head/tail index mismatch, read from outside. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const R = {};
/* (a) */
{
  const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 120000, prefs: { 'dom.webgpu.enabled': false } });
  try {
    await new Promise((r) => setTimeout(r, 6000));
    R.noGpu = await g.ev(`const b = document.getElementById('banner'); return { gpu: !!navigator.gpu, lw: !!window.__LW, ready: !!(window.__LW && __LW.ready),
      errs: (window.__e || []).map(String).slice(0, 6), banner: b ? { hidden: b.hidden, title: (b.querySelector('h3') || {}).textContent, text: ((b.querySelector('p') || {}).textContent || '').slice(0, 200) } : null,
      devs: document.querySelectorAll('.dev').length, fieldOk: window.__LW && __LW.field ? __LW.field.ok : null, fieldErr: window.__LW && __LW.field ? __LW.field.error : null };`);
  } catch (e) { R.noGpu = { probeError: String(e && e.message || e) }; }
  finally { await g.close(); }
  console.log('noGpu', JSON.stringify(R.noGpu));
}
/* (b) + (c) */
{
  const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 120000, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    R.medianIsLastFrame = await g.ev(`const P = __LW.perf.profile; let v = P.total, last = null; Object.defineProperty(P, 'total', { configurable: true, enumerable: true, get() { return v; }, set(nv) { last = (nv - 0.9 * v) / 0.1; v = nv; } });
      const out = []; __LW.loadPreset('sim-ladder'); for (let i = 0; i < 4; i++) { __LW.perf.resetRing(); __LW.play(); await new Promise((r) => setTimeout(r, 700 + 150 * i)); __LW.pause(); out.push({ median: +__LW.perf.median.toFixed(4), lastFrameMs: +last.toFixed(4) }); await __LW.settle(); }
      return out;`);
    console.log('medianIsLastFrame', JSON.stringify(R.medianIsLastFrame));
    R.idleBeforeLoss = await g.ev(`__LW.pause(); await __LW.settle(); await new Promise((r) => setTimeout(r, 500)); const f0 = __LW.stats.frames; await new Promise((r) => setTimeout(r, 1500)); return { frames: __LW.stats.frames - f0, scheduled: __LW.stats.scheduled, modRunning: __LW.modulation ? __LW.modulation.running : null };`);
    R.idleAfterLoss = await g.ev(`__LW.field.device.destroy(); for (let i = 0; i < 100 && __LW.field.ok; i++) await new Promise((r) => setTimeout(r, 20));
      __LW.play(); await new Promise((r) => setTimeout(r, 500)); __LW.pause(); await new Promise((r) => setTimeout(r, 600));
      const f0 = __LW.stats.frames; await new Promise((r) => setTimeout(r, 1500)); const f1 = __LW.stats.frames;
      return { ok: __LW.field.ok, framesIn1500msIdle: f1 - f0, scheduled: __LW.stats.scheduled, playing: __LW.clock.playing, camMoving: __LW.camera.moving, errs: (window.__e || []).map(String).slice(0, 6) };`);
    console.log('idle', JSON.stringify(R.idleBeforeLoss), JSON.stringify(R.idleAfterLoss));
  } catch (e) { R.lost = { probeError: String(e && e.message || e) }; }
  finally { await g.close(); }
}
fs.writeFileSync('research/optimization-2026-09-24/probes/F/probe-f-breaks.json', JSON.stringify(R, null, 1));
console.log('wrote research/optimization-2026-09-24/probes/F/probe-f-breaks.json');
