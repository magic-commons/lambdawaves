/* probe-f-busy.mjs — does the frame-gap rule (rack.js: a >250 ms gap between loop frames → busyFlash(600)) raise the
 * BUSY mark in a GPU-bound scene whose main thread is idle?  Headless Firefox, the axial gas at 128³, glass style.
 * Also: HELIUM basis change while HELIUM is ON and PLAYING (modesAt → helium.fieldModes → ensureSol, sync).
 *   LW_PORT=8721 GD_PORT=5236 node research/optimization-2026-09-24/probes/F/probe-f-busy.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, script: 300000, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = {};
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.busyInGpuBoundScene = await g.ev(`__LW.governor.on = false; __LW.quality.auto = false; __LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause();
    __LW.quality.res = 128; __LW.quality.steps = 240; __LW.quality.scale = 1.5; __LW.setStyle('glass'); __LW.schedule(4); await __LW.settle();
    const m = document.querySelector('#title .mark'), h = document.getElementById('busyMark'); let busySamples = 0, n = 0; const gaps = []; let last = 0, on = true;
    const f = (t) => { if (last) gaps.push(t - last); last = t; if (on) requestAnimationFrame(f); }; requestAnimationFrame(f);
    const iv = setInterval(() => { n++; if ((m && m.classList.contains('busy')) || (h && !h.hidden)) busySamples++; }, 50);
    const P = __LW.perf.profile; let v = P.total; const tot = []; Object.defineProperty(P, 'total', { configurable: true, enumerable: true, get() { return v; }, set(nv) { tot.push((nv - 0.9 * v) / 0.1); v = nv; } });
    __LW.play(); await new Promise((r) => setTimeout(r, 6000)); __LW.pause(); on = false; clearInterval(iv);
    gaps.sort((a, b) => a - b); tot.sort((a, b) => a - b);
    return { busyFraction: +(busySamples / n).toFixed(2), samples: n, rafMedian: +gaps[gaps.length >> 1].toFixed(0), rafMax: +gaps[gaps.length - 1].toFixed(0), gapsOver250: gaps.filter((x) => x > 250).length, frames: gaps.length, loopMedianMs: +tot[tot.length >> 1].toFixed(2), loopMaxMs: +tot[tot.length - 1].toFixed(2) };`);
  console.log('busy', JSON.stringify(R.busyInGpuBoundScene));
  R.heliumBasisPlaying = await g.ev(`__LW.setStyle('cloud'); __LW.quality.scale = 1; __LW.quality.res = 64; __LW.quality.steps = 110; __LW.setHamiltonian('hydrogen'); __LW.setGasBasis('reg'); __LW.loadPreset('1s+2pz'); __LW.pause(); __LW.schedule(4); await __LW.settle();
    __LW.layout.reopen('helium', 'R'); await __LW.settle(); for (let i = 0; i < 200 && !__LW.helium.computed; i++) await new Promise((r) => setTimeout(r, 25));
    __LW.helium.setOn(true); __LW.play(); await new Promise((r) => setTimeout(r, 600));
    const meas = async (basis) => { let last = performance.now(), worst = 0, on = true; const mc = new MessageChannel(); mc.port1.onmessage = () => { const n = performance.now(); worst = Math.max(worst, n - last); last = n; if (on) setTimeout(() => mc.port2.postMessage(0), 2); }; mc.port2.postMessage(0);
      await new Promise((r) => setTimeout(r, 200)); worst = 0; __LW.helium.setBasis(basis); await new Promise((r) => setTimeout(r, 800)); on = false; return { basis, worstStallMs: +worst.toFixed(1), computed: __LW.helium.computed }; };
    const a = await meas('ten'), b = await meas('six'), c = await meas('ten'); __LW.pause(); __LW.helium.setOn(false); return [a, b, c];`);
  console.log('heliumBasisPlaying', JSON.stringify(R.heliumBasisPlaying));
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
fs.writeFileSync('research/optimization-2026-09-24/probes/F/probe-f-busy.json', JSON.stringify(R, null, 1));
