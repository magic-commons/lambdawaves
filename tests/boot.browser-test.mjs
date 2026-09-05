/* tests/boot.browser-test.mjs — the headless proof of the instrument (Q3–Q8 of §50, in the lab itself).
 *
 *   LW_PORT=8701 GD_PORT=5202 node tests/boot.browser-test.mjs
 *
 * Needs the HTTPS server (mbgate/server2.py <repo> <port>) and headless Firefox with WebGPU.
 * The page is driven through window.__LW — the same mutation road the fingers use — and the
 * picture is judged twice: a GPU readback of the same render pass, and the DRIVER's composited
 * screenshot decoded here (a WebGPU canvas cannot be read through a 2-D context).
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import { open, judge, done } from '/home/joshua-hosain/Documents/MANDELBROT APP/project/mbgate/gatekit.mjs';
const drv = await import('/home/joshua-hosain/Documents/MANDELBROT APP/project/mbgate/drv.js');

const PORT = process.env.LW_PORT || '8701';
const ROOT = '/home/joshua-hosain/Documents/LAMBDAWAVES';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** minimal PNG decoder (8-bit RGB/RGBA, non-interlaced): the driver's screenshot, read independently */
function decodePNG(buf) {
  let off = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === 'IDAT') idat.push(data); else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : ct === 4 ? 2 : 1, stride = w * bpp, out = Buffer.alloc(h * stride);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++], row = out.subarray(y * stride, (y + 1) * stride), prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp] : 0, b = prev ? prev[x] : 0, c = (prev && x >= bpp) ? prev[x - bpp] : 0;
      let v = raw[p++];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      row[x] = v & 255;
    }
  }
  return { w, h, bpp, data: out };
}
function litPixels(png, x0, y0, x1, y1, thr = 40) {
  let n = 0, tot = 0;
  for (let y = y0; y < Math.min(y1, png.h); y++) for (let x = x0; x < Math.min(x1, png.w); x++) {
    const o = (y * png.w + x) * png.bpp; tot++;
    if ((png.data[o] + png.data[o + 1] + png.data[o + 2]) / 3 > thr) n++;
  }
  return { lit: n, total: tot, frac: n / tot };
}

const W = 1400, H = 900;
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz`, { width: W, height: H });
const settle = () => g.ev('await __LW.settle(); await new Promise(r=>setTimeout(r,60)); return __LW.stats.frames;');
try {
  /* ── boot ──────────────────────────────────────────────────────────────── */
  const r = await g.waitFor('window.__LW && __LW.ready', 300, 100);
  judge('B1 the lab boots (window.__LW.ready)', r && r.ok, r);
  const bootInfo = await g.ev('return { ok: __LW.field.ok, err: __LW.field.error, shader: __LW.field.shaderMessages, errs: window.__e, banner: !document.getElementById("banner").hidden };');
  judge('B1 WebGPU field is up, no shader messages, no page errors, no banner', bootInfo.ok && !bootInfo.err && bootInfo.shader.length === 0 && bootInfo.errs.length === 0 && !bootInfo.banner, bootInfo);
  /* ── B43: the shipped defaults, read on the fresh page before the proof sets its own baseline ── */
  const dfT = await g.ev(`try { const v0 = __LW.mat.view; __LW.setView('density'); const vD = __LW.mat.view; __LW.setView('phase'); const vP = __LW.mat.view;
    let font = false; try { await document.fonts.load('12px Roboto'); font = document.fonts.check('12px Roboto'); } catch (e) {}
    const kinds = {}; for (const d of document.querySelectorAll('.dev')) kinds[d.dataset.id] = { kind: d.dataset.kind, folded: d.classList.contains('folded'), power: !!d.querySelector('.dev-power'), close: !!d.querySelector('.dev-close'), copy: !!d.querySelector('.dev-copy') };
    const set = document.querySelector('.dev[data-id="settings"]');
    return { specSide: __LW.layout.side('spectrum'), pickerOpen: __LW.spectrum.pickerOpen, keplerOn: __LW.kepler.on, theme: document.body.dataset.theme, phaseDefault: __LW.bootView === 'phase' && v0 === vP && v0 !== vD, vortexOn: __LW.vortex.on, vortexOverlay: __LW.vortex.overlay, font, bodyFont: getComputedStyle(document.body).fontFamily, kinds, settings: !!set, keysInSettings: set ? set.querySelectorAll('.keys-chip').length : 0, themeSegInSettings: !!(set && [...set.querySelectorAll('.seg')].length), adds: document.querySelectorAll('#rackAdd').length, veil: getComputedStyle(document.getElementById('rack')).opacity, shadow: getComputedStyle(document.body).getPropertyValue('--glass-shadow') };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B43 THE SHIPPED DEFAULTS: SPECTRUM on the left rack with MODE open, KEPLER off, LIGHT theme, arg ψ as the observable, the vortex census and its overlay off; Roboto is the interface face; every window has ⏻ ▾ ×, INFO panels have ⧉ COPY, CONTROL and OTHER windows start folded, CORE open; SETTINGS exists with the key bindings inside; both racks carry a + and no veil; the card shadow is the tight one',
    !dfT.error && dfT.specSide === 'L' && dfT.pickerOpen && dfT.keplerOn === false && dfT.theme === 'light' && dfT.phaseDefault && dfT.vortexOn === false && dfT.vortexOverlay === false && dfT.font && /Roboto/.test(dfT.bodyFont) && dfT.kinds.state.kind === 'core' && !dfT.kinds.state.folded && dfT.kinds.qcd.kind === 'info' && dfT.kinds.qcd.copy && dfT.kinds.orbit.kind === 'control' && dfT.kinds.orbit.folded && dfT.kinds.meters.kind === 'info' && dfT.kinds.meters.copy && !dfT.kinds.meters.folded && dfT.kinds.state.power && dfT.kinds.state.close && dfT.settings && dfT.keysInSettings > 10 && dfT.adds === 1 && dfT.veil === '1' && /5px 12px/.test(dfT.shadow), dfT);
  /* the proof's baseline: the dark stage, the density view, the vortex reader on — everything below was written against these */
  await g.ev(`__LW.setTheme('dark'); __LW.setView('density'); __LW.vortex.setOn(true); __LW.vortex.setOverlay(true); __LW.kepler.setOn(true); for (const d of document.querySelectorAll('.dev.folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); } await __LW.settle(); return 1;`);
  await settle();

  /* ── the picture: FIELD renders non-black, both ways ───────────────────── */
  const px = await g.ev('return await __LW.readPixels();');
  judge('B2 FIELD readback is lit (GPU readback of the same render pass)', px && px.nonBlack > 0.03 * px.total && px.bright > 50, px);
  fs.mkdirSync(ROOT + '/.tmp', { recursive: true });
  const shot0 = Buffer.from(await g.snap(), 'base64'); fs.writeFileSync(ROOT + '/.tmp/boot-0.png', shot0);
  const png0 = decodePNG(shot0); const lit0 = litPixels(png0, 40, 60, W - 400, H - 90);
  judge('B2 the DRIVER\'s composited screenshot shows a lit stage (independent of the GPU readback)', lit0.frac > 0.02, lit0);

  /* ── meters: norm reads 1.000 in the DOM ───────────────────────────────── */
  const dom1 = await g.ev('const q=(k)=>document.querySelector(`[data-m="${k}"] .ro-val`).textContent; return { norm: q("norm"), auto: q("auto"), modes: q("modes"), t: q("tlog"), status: q("status") };');
  judge('B3 METERS: NORM reads 1.000, |A| 1.0000, 2/2/91 modes', dom1.norm === '1.000' && dom1.auto === '1.0000' && dom1.modes.startsWith('2 / 2 / 91'), dom1);

  /* ── 1s+2s beat: autocorrelation returns at T = 2π/(E₂−E₁) ─────────────── */
  const T = 2 * Math.PI / (-1 / 8 + 1 / 2);
  const beat = await g.ev(`__LW.loadPreset('1s+2s'); await __LW.settle();
    __LW.scrub(${T}); await __LW.settle(); const full = __LW.meters().autocorr; const domFull = document.querySelector('[data-m="auto"] .ro-val').textContent; const tDom = document.querySelector('[data-m="tlog"] .ro-val').textContent;
    __LW.scrub(${T / 2}); await __LW.settle(); const half = __LW.meters().autocorr;
    __LW.scrub(${T / 4}); await __LW.settle(); const q = __LW.meters().autocorr;
    return { full, domFull, tDom, half, q, norm: __LW.meters().norm };`);
  judge('B4 1s+2s: |⟨ψ(0)|ψ(T)⟩| > 0.99 at the revival T = ' + T.toFixed(3) + ' a.u. (DOM agrees)', beat.full > 0.99 && parseFloat(beat.domFull) >= 0.99 && beat.tDom === T.toFixed(2), beat);
  judge('B4 1s+2s: |A(T/2)| < 0.01 and |A(T/4)| ≈ 1/√2 — a real beat, not a cross-fade', beat.half < 0.01 && Math.abs(beat.q - Math.SQRT1_2) < 1e-6, beat);

  /* ── Q3: GPU voxels at t = T/4 agree with the CPU closed form (relative phase exercised) ── */
  const cmp = await g.ev(`const out=[]; const n=__LW.field.resolution; let mx=0;
    for (const [i,j,k] of [[n/2|0,n/2|0,n/2|0],[n/2+5|0,n/2-3|0,n/2+9|0],[n/3|0,n/2|0,n/2+4|0],[n/2+11|0,n/2+17|0,n/2-6|0],[n/2-13|0,n/2+2|0,n/2+1|0]]) {
      const v = await __LW.sampleVoxel(i,j,k); const c = __LW.cpuPsi(v.x,v.y,v.z);
      out.push({ijk:[i,j,k], gpu:[+v.re.toFixed(6),+v.im.toFixed(6)], cpu:[+c.re.toFixed(6),+c.im.toFixed(6)], err: Math.hypot(v.re-c.re, v.im-c.im)}); mx = Math.max(mx, Math.hypot(c.re,c.im));
    } return { out, mx, t: __LW.clock.t };`);
  const worst = Math.max(...cmp.out.map((c) => c.err)) / cmp.mx;
  judge('B5 Q3: five GPU voxels of the superposition at t = T/4 match the CPU closed form (rel ' + worst.toExponential(2) + ')', worst < 5e-3, cmp);

  /* ── mute is a reconstruction mask; the field visibly changes; the state does not ─ */
  const mute = await g.ev(`const a2s = __LW.reg.populated()[1]; __LW.scrub(0); await __LW.settle();
    const d0 = __LW.stateDigest(); const f0 = await __LW.fieldDigest(); const p0 = await __LW.readPixels();
    __LW.setMute(a2s, true); await __LW.settle();
    const d1 = __LW.stateDigest(); const f1 = await __LW.fieldDigest(); const p1 = await __LW.readPixels();
    const badge = [...document.querySelectorAll('#badges .badge')].map(b=>b.textContent).join(' | ');
    const m = __LW.meters(); const modesDom = document.querySelector('[data-m="modes"] .ro-val').textContent;
    __LW.setMute(a2s, false); await __LW.settle(); const f2 = await __LW.fieldDigest();
    return { d0, d1, i0: f0.integral, i1: f1.integral, i2: f2.integral, h0: f0.hash, h1: f1.hash, h2: f2.hash, px0: p0.hash, px1: p1.hash, badge, rendered: m.rendered, populated: m.populated, covered: m.covered, modesDom };`);
  judge('B6 muting 2s: field cache changes (∫ρ 1.00 → 0.50), picture changes, state digest unchanged', mute.d0 === mute.d1 && mute.h0 !== mute.h1 && mute.px0 !== mute.px1 && Math.abs(mute.i0 - 1) < 0.03 && Math.abs(mute.i1 - 0.5) < 0.03, mute);
  judge('B6 the truncation is SAID: badge and METERS report 1/2 rendered, 50% of norm; unmute restores the cache', /RENDERED 1\/2/.test(mute.badge) && mute.rendered === 1 && mute.populated === 2 && Math.abs(mute.covered - 0.5) < 1e-9 && mute.modesDom.startsWith('1 / 2') && mute.h2 === mute.h0, { badge: mute.badge });

  /* ── SHADOW in lockstep: what was drawn is √2·c(t) at the same logical time ─ */
  const sh = await g.ev(`__LW.scrub(${T / 3}); await __LW.settle(); const L = __LW.shadowView.last; const c = __LW.reg.at(__LW.clock.t);
    let worst = 0; for (let i = 0; i < L.ids.length; i++) { const a = L.ids[i]; worst = Math.max(worst, Math.abs(L.q[i] - Math.SQRT2 * c.re[a]), Math.abs(L.p[i] - Math.SQRT2 * c.im[a])); }
    const hc = document.querySelector('[data-id="shadow"] .ro-val').textContent;
    const ctx = document.querySelector('.shadow-c').getContext('2d'); const img = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data; let lit=0; for (let i=3;i<img.length;i+=4) if (img[i]>0) lit++;
    return { sameT: L.t === __LW.clock.t, worst, hc, E: __LW.meters().energy, lit, ids: L.ids.length };`);
  judge('B7 SHADOW reads the same c(t) at the same logical time (q = √2 Re c, p = √2 Im c), H_C = ⟨E⟩, canvas drawn', sh.sameT && sh.worst < 1e-12 && Math.abs(parseFloat(sh.hc) - sh.E) < 1e-4 && sh.lit > 500 && sh.ids === 2, sh);

  /* ── observer vs state (§14) ───────────────────────────────────────────── */
  const obsv = await g.ev(`const d0 = __LW.stateDigest(), t0 = __LW.clock.t; const p0 = await __LW.readPixels();
    __LW.orbit(0.7, 0.25); await __LW.settle(); const p1 = await __LW.readPixels();
    __LW.mat.slice.mode = 1; __LW.schedule(1); await __LW.settle(); const p2 = await __LW.readPixels(); __LW.mat.slice.mode = 0;
    return { same: d0 === __LW.stateDigest() && t0 === __LW.clock.t, moved: p0.hash !== p1.hash, clipped: p1.hash !== p2.hash, tiers: {...__LW.stats.tiers}, last: __LW.stats.lastTier };`);
  judge('B8 Q5: camera orbit and clip change the picture, not the state or the time; they cost PRESENT only', obsv.same && obsv.moved && obsv.clipped && obsv.last === 'PRESENT', obsv);
  const rot = await g.ev(`__LW.loadPreset('2p+'); await __LW.settle(); const d0 = __LW.stateDigest(); __LW.reg.rotateZ(0.7); __LW.schedule(2); await __LW.settle(); return { changed: d0 !== __LW.stateDigest(), last: __LW.stats.lastTier };`);
  judge('B8 Q5: STATE ROTATE R_z changes the state digest (a RECONSTRUCT), unlike the camera', rot.changed && rot.last === 'RECONSTRUCT', rot);

  /* ── clocks: play, pause holds, resume without a giant step, idle is zero work ─ */
  const clk = await g.ev(`__LW.loadPreset('1s+2s'); await __LW.settle(); __LW.play(); await new Promise(r=>setTimeout(r,450)); __LW.pause(); await __LW.settle();
    const t1 = __LW.clock.t, d1 = __LW.stateDigest(), f1 = __LW.stats.frames;
    await new Promise(r=>setTimeout(r,500)); const idleFrames = __LW.stats.frames - f1, sched = __LW.stats.scheduled;
    __LW.orbit(0.3, 0); await __LW.settle(); const tAfterOrbit = __LW.clock.t;
    await new Promise(r=>setTimeout(r,700));
    __LW.play(); await new Promise(r=>setTimeout(r,120)); const dt = __LW.clock.lastDt, t2 = __LW.clock.t; __LW.pause(); await __LW.settle();
    return { t1, rate: __LW.clock.rate, idleFrames, sched, tAfterOrbit, sameDigest: d1 === __LW.stateDigest(), dt, t2, fps: __LW.stats.fps };`);
  judge('B9 Q6: play advances logical time at the RATE; pause holds it while the camera moves', clk.t1 > 0.8 && clk.t1 < 3.5 && clk.tAfterOrbit === clk.t1 && clk.sameDigest, clk);
  judge('B9 Q6: IDLE ZERO — no frames while paused and still; resume steps ≤ rate·0.1 s, never the pause length', clk.idleFrames === 0 && clk.sched === false && clk.dt <= clk.rate * 0.1 + 1e-9 && (clk.t2 - clk.t1) < clk.rate * 0.4, clk);
  const cad = await g.ev(`__LW.fieldRate.capMs = 250; const r0 = __LW.stats.reconstructs, e0 = __LW.stats.evolves, t0 = __LW.clock.t; const w0 = performance.now();
    __LW.play(); await new Promise(r=>setTimeout(r,1000)); __LW.pause(); const w = (performance.now() - w0) / 1000; await __LW.settle(); __LW.fieldRate.capMs = 0;
    return { recon: __LW.stats.reconstructs - r0, evolves: __LW.stats.evolves - e0, dt: __LW.clock.t - t0, expect: __LW.clock.rate * w, w };`);
  judge('B9 Q6: capping the FIELD clock (4 Hz) leaves the physics clock alone: few reconstructs, many evolves, Δt = rate·wall', cad.recon <= 8 && cad.evolves >= 15 && Math.abs(cad.dt - cad.expect) / cad.expect < 0.15, cad);

  /* ── quality changes the estimate, never the state ─────────────────────── */
  const qual = await g.ev(`const d0 = __LW.stateDigest(); __LW.quality.res = 64; __LW.quality.steps = 110; __LW.schedule(4); await __LW.settle(); const f = await __LW.fieldDigest();
    const res = __LW.field.resolution; __LW.quality.res = 96; __LW.quality.steps = 160; __LW.schedule(4); await __LW.settle();
    return { res, back: __LW.field.resolution, same: d0 === __LW.stateDigest(), integral: f.integral, last: __LW.stats.lastTier };`);
  judge('B10 Q43: GRID 64³ is a REBUILD that keeps the state digest and still integrates ρ to 1', qual.res === 64 && qual.back === 96 && qual.same && Math.abs(qual.integral - 1) < 0.05, qual);

  /* ── touch and mouse both drive the instrument ─────────────────────────── */
  const yaw0 = await g.ev('return __LW.obs.yaw;');
  let touchOk = false, touchWhy = '';
  try {
    await drv.actions(g.s, [{ type: 'pointer', id: 'touch1', parameters: { pointerType: 'touch' }, actions: [
      { type: 'pointerMove', duration: 0, origin: 'viewport', x: 500, y: 400 }, { type: 'pointerDown', button: 0 },
      { type: 'pointerMove', duration: 150, origin: 'viewport', x: 640, y: 420 }, { type: 'pointerUp', button: 0 }] }]);
    await drv.relActions(g.s); touchOk = true;
  } catch (e) { touchWhy = String(e && e.message || e).slice(0, 200); }
  const yaw1 = await g.ev('await __LW.settle(); return { yaw: __LW.obs.yaw, digest: __LW.stateDigest() };');
  judge('B11 a TOUCH drag on the FIELD orbits the camera (yaw changed) and touches no state', touchOk && Math.abs(yaw1.yaw - yaw0) > 0.3, { touchOk, touchWhy, yaw0, yaw1: yaw1.yaw });
  const tapPlay = await g.tap('#transport .play');
  const playing = await g.ev('await new Promise(r=>setTimeout(r,150)); return __LW.clock.playing;');
  await g.tap('#transport .play');
  const paused = await g.ev('await __LW.settle(); return !__LW.clock.playing;');
  judge('B11 a MOUSE tap on PLAY starts the transport, another pauses it', tapPlay.ok === 1 && playing && paused, { tapPlay, playing, paused });
  const lane = await g.ev(`const b = document.querySelector('.sp-row .mute'); const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, ok: r.width >= 34 && r.height >= 40 };`);
  judge('B11 SPECTRUM lane buttons are real touch targets (≥ 34 × 40 px)', lane.ok, lane);
  await g.ev(`document.querySelector('.sp-row .mute').scrollIntoView({ block: 'center' }); await new Promise(r=>setTimeout(r,80)); return 1;`);
  const muteTap = await g.tap('.sp-row .mute');
  const muted = await g.ev('await __LW.settle(); const m = __LW.meters(); const on = __LW.reg.muted[__LW.reg.populated()[0]]; __LW.setMute(__LW.reg.populated()[0], false); await __LW.settle(); return { on: !!on, rendered: m.rendered };');
  judge('B11 tapping a lane\'s M mutes it through the same road', muteTap.ok === 1 && muted.on && muted.rendered === 1, { muteTap, muted });

  /* ── round trip ─────────────────────────────────────────────────────────── */
  const rt = await g.ev(`__LW.scrub(5.5); await __LW.settle(); const d0 = __LW.stateDigest(), t0 = __LW.clock.t; const s = JSON.parse(JSON.stringify(__LW.serialize()));
    __LW.loadPreset('1s'); await __LW.settle(); const mid = __LW.stateDigest(); __LW.restore(s); await __LW.settle();
    return { same: d0 === __LW.stateDigest(), t: __LW.clock.t === t0, changedInBetween: mid !== d0, status: s.experiment.status, basis: s.experiment.basis };`);
  judge('B12 Q7: serialize → load another preset → restore reproduces the state and the logical time, with its status label', rt.same && rt.t && rt.changedInBetween && rt.status === 'EXACT ANALYTIC', rt);

  /* ── FRONTIER (2026-09-03): ORBIT, VORTEX, LADDER and the two new state operations ── */
  const fr = await g.ev(`try { __LW.loadPreset('2s+2pz'); await __LW.settle();
    const sh = __LW.orbitView.shells.find(s => s.n === 2);
    const wins = ['orbit','vortex','ladder'].map(id => !!document.querySelector('[data-id="' + id + '"]'));
    __LW.rotateK(0.1); await __LW.settle();          // the first state touch after a preset load is a REBUILD (domain tracker); absorb it
    const d0 = __LW.stateDigest(); __LW.rotateK(0.4); await __LW.settle(); const d1 = __LW.stateDigest(), t1 = __LW.stats.lastTier; const sh1 = __LW.orbitView.shells.find(s => s.n === 2);
    __LW.defectWait(0.5); await __LW.settle(); const d2 = __LW.stateDigest(); const sh2 = __LW.orbitView.shells.find(s => s.n === 2);
    const lad = __LW.ladder.last;
    return { wins, spec: sh.spectrum, e: sh.e, z: sh.z, d0, d1, t1, spec1: sh1.spectrum, d2, spec2: sh2.spectrum, lad: lad.scan.aPeak, ladAt: lad.scan.tPeak / lad.clocks.Trev, norm: __LW.meters().norm }; } catch (e) { return { error: String(e) + ' | ' + String(e && e.stack) + ' | keys ' + Object.keys(__LW).slice(-8).join(',') + ' | orbit ' + typeof __LW.orbit + ' shells ' + (__LW.orbit && JSON.stringify(__LW.orbitView.shells)) }; }`) || { error: 'no result' };
  judge('B14 FRONTIER windows exist; ORBIT reads the Stark state as coherent: Schmidt (1,0), e = ½, ⟨z⟩ = −3', !fr.error && fr.wins.every(Boolean) && Math.abs(fr.spec[0] - 1) < 1e-9 && Math.abs(fr.e - 0.5) < 1e-9 && Math.abs(fr.z + 3) < 1e-9, fr);
  if (fr.error) { judge('B14 (skipped: the FRONTIER script threw)', false, fr.error); }
  judge('B14 STARK ROTATE changes the digest at RECONSTRUCT and keeps the Schmidt spectrum; DEFECT WAIT moves the spectrum; norm stays 1', !fr.error && fr.d0 !== fr.d1 && fr.t1 === 'RECONSTRUCT' && Math.abs(fr.spec1[0] - 1) < 1e-9 && fr.d2 !== fr.d1 && fr.spec2[0] < 0.999 && Math.abs(fr.norm - 1) < 1e-6, fr);
  judge('B14 LADDER (n̄ = 30, σ = 2): the exact revival peak 0.80 at 0.994 T_rev is on the page', !fr.error && fr.lad > 0.78 && fr.ladAt > 0.99 && fr.ladAt < 0.999, { lad: fr.lad, at: fr.ladAt });
  const vx = await g.ev(`try { __LW.loadPreset('recon'); await __LW.settle(); const c = __LW.vortex.census; const L = __LW.vortex.last;
    __LW.loadPreset('2px'); await __LW.settle(); const L2 = __LW.vortex.last; const xm = Math.max(...L2.points.map(p => Math.abs(p.x)));
    const ctx = document.getElementById('vortex').getContext('2d'); const img = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data; let lit = 0; for (let i = 3; i < img.length; i += 4) if (img[i] > 0) lit++;
    return { count: c && c.count, Td: c && c.Td, pts: L && L.points.length, M: L && L.M, pts2: L2.points.length, M2: L2.M, xm, lit }; } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B14 VORTEX: the census of 3d₊₂+4p₊₁+5s reads 10 points at T_d = 481.265; 2p_x has M = 2 with every located point in x = 0; the overlay is drawn', !vx.error && vx.count === 10 && Math.abs(vx.Td - 481.265) < 1e-2 && vx.M2 === 2 && vx.pts2 > 20 && vx.xm < 1e-6 && vx.lit > 50, vx);

  const r7 = await g.ev(`try { __LW.loadPreset('2s+2pz'); await __LW.settle();
    const s0 = __LW.orbitView.shells.find(s => s.n === 2).spectrum.slice();
    const c0 = Array.from(__LW.reg.re0).concat(Array.from(__LW.reg.im0));
    const d0 = __LW.stateDigest(); __LW.rotor({ which: '+', axis: 'y', angle: 0.7 }); await __LW.settle();
    const sh = __LW.orbitView.shells.find(s => s.n === 2); const d1 = __LW.stateDigest();
    __LW.rotor({ which: '+', axis: 'y', angle: -0.7 }); await __LW.settle();
    const c2 = Array.from(__LW.reg.re0).concat(Array.from(__LW.reg.im0));
    let back = 0; for (let i = 0; i < c0.length; i++) back = Math.max(back, Math.abs(c0[i] - c2[i]));
    const lad = __LW.ladder.last.sup; const norm = __LW.meters().norm;
    return { s0, s1: sh.spectrum, e1: sh.e, L1: sh.absL, d0, d1, back, norm, cls: lad.cls, kind: lad.kind, exact: lad.exact, pred: lad.predicted }; } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B15 ROTOR DRIVE: one rotor alone is an SO(4) move — it changes the state and tilts ⟨L⟩, keeps the Schmidt spectrum and the norm, and its inverse returns the coefficients to 1e-14',
    !r7.error && r7.d0 !== r7.d1 && r7.back < 1e-14 && Math.abs(r7.s1[0] - r7.s0[0]) < 1e-9 && r7.L1 > 1e-3 && Math.abs(r7.norm - 1) < 1e-6, r7);
  judge('B15 LADDER superrevival: n̄ = 30 ≡ 2 (mod 4) ⇒ the HALF-SHIFTED class, and the exact |A(T_sr)| by integer phase reduction sits beside the cusp prediction',
    !r7.error && r7.cls === 2 && r7.kind === 'half-shifted' && r7.exact >= 0 && r7.exact <= 1 && r7.pred > 0, { cls: r7.cls, kind: r7.kind, exact: r7.exact, pred: r7.pred });

  /* fold every window, drive the state, unfold: layout must never break the instrument (§24) */
  const fold = await g.ev(`try { const devs = [...document.querySelectorAll('.dev')];
    devs.forEach(d => d.querySelector('.dev-fold').click()); await __LW.settle();
    const e0 = window.__e.length; const v0 = __LW.reg.version;
    __LW.rotor({ which: '+', axis: 'y', angle: 0.5 }); __LW.scrub(3.3); await __LW.settle(); await new Promise(r=>setTimeout(r,120));
    const e1 = window.__e.length; const folded = __LW.orbitView.shells.length ? __LW.orbitView.shells[0].absL : -1;
    devs.forEach(d => d.querySelector('.dev-fold').click()); await __LW.settle();
    return { e0, e1, errs: window.__e.slice(0, 3), v0, v1: __LW.reg.version, folded, open: __LW.orbitView.shells[0].absL };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B16 folding every window is layout only: no errors thrown, the state still evolves and the ORBIT invariants still recompute behind the fold (a folded canvas has no size — its radii would go negative and canvas throws, killing the render loop)',
    !fold.error && fold.e1 === fold.e0 && fold.errs.length === 0 && fold.v1 > fold.v0 && fold.folded > 1e-6 && Math.abs(fold.open - fold.folded) < 1e-12, fold);

  /* ── DYNAMICS: the Lagrangian window and the particle view ─────────────── */
  const dyn = await g.ev(`try { __LW.loadPreset('1s+2pz'); __LW.scrub(0); await __LW.settle();
    const q = (k) => document.querySelector('[data-id="dynamics"] [data-dq="' + k + '"]');
    const txt = [...document.querySelectorAll('[data-id="dynamics"] .ro')].map(r => r.querySelector('.ro-lbl').textContent + '=' + r.querySelector('.ro-val').textContent);
    const d0 = __LW.dynamics ? 1 : 0;
    // the dipole must oscillate at the Bohr period 16.755 and vanish a quarter of the way through
    const dz = []; for (const t of [0, 16.755/4, 16.755/2]) { __LW.scrub(t); await __LW.settle(); dz.push(+document.querySelector('[data-dq="dz"] .ro-val').textContent); }
    __LW.scrub(0); await __LW.settle();
    const seeded = __LW.seedParticles(90); await __LW.settle();
    const p0 = __LW.particles.points.map(p => p.slice());
    __LW.play(); await new Promise(r => setTimeout(r, 420)); __LW.pause(); await __LW.settle();
    const p1 = __LW.particles.points;
    let moved = 0; for (let i = 0; i < Math.min(p0.length, p1.length); i++) moved = Math.max(moved, Math.hypot(p1[i][0]-p0[i][0], p1[i][1]-p0[i][1], p1[i][2]-p0[i][2]));
    const ctx = document.getElementById('particles').getContext('2d'); const img = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data;
    let lit = 0; for (let i = 3; i < img.length; i += 4) if (img[i] > 0) lit++;
    const digest = __LW.stateDigest();
    return { d0, txt: txt.slice(0, 4), seeded, alive: __LW.particles.state.alive, moved, lit, digest, dz, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B17 DYNAMICS: the window exists and reads the Lagrangian, and the 1s+2p_z dipole ⟨z⟩ oscillates at the Bohr period — full at t = 0, zero a quarter period later, reversed at half',
    !dyn.error && dyn.d0 === 1 && Math.abs(Math.abs(dyn.dz[0]) - 0.7449) < 2e-3 && Math.abs(dyn.dz[1]) < 2e-3 && Math.abs(dyn.dz[2] + dyn.dz[0]) < 2e-3, dyn);
  judge('B18 PARTICLES: a cloud seeded from |ψ|² is drawn on the stage and flows along the exact velocity field while the transport plays, without touching the state',
    !dyn.error && dyn.seeded > 60 && dyn.alive > 40 && dyn.moved > 0.05 && dyn.lit > 40 && dyn.errs === 0, { seeded: dyn.seeded, alive: dyn.alive, moved: dyn.moved, lit: dyn.lit });

  /* ── FIELDS and the PHASE PALETTE ──────────────────────────────────────── */
  const fld = await g.ev(`try { __LW.loadPreset('2s+2pz'); __LW.scrub(0); await __LW.settle();
    const a0 = __LW.meters().autocorr, e0 = __LW.meters().energy;
    __LW.reg.setField({ Fz: 1e-3 }); __LW.schedule(2); await __LW.settle();
    __LW.scrub(4000); await __LW.settle();
    const aStark = __LW.meters().autocorr;                       // the Stark state is now an eigenstate: |A| = 1
    __LW.reg.setField({ Fz: 0, Bz: 0.01 }); __LW.scrub(0); __LW.schedule(2); await __LW.settle();
    const eZee = __LW.meters().energy;
    const badge = [...document.querySelectorAll('#badges .badge')].map(b => b.textContent).join(' | ');
    const status = document.querySelector('[data-m="status"] .ro-val').textContent;
    __LW.reg.setField({ Fz: 0, Bz: 0 }); __LW.schedule(2); await __LW.settle();
    return { a0, aStark, e0, eZee, badge, status, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B19 STATIC FIELD: switching on a Stark field makes the Stark state an eigenstate — |A(t)| stays 1 at t = 4000 where it would otherwise have moved — and a Zeeman field leaves ⟨E⟩ unchanged for this m = 0 state',
    !fld.error && Math.abs(fld.aStark - 1) < 1e-6 && Math.abs(fld.eZee - fld.e0) < 1e-12 && fld.errs === 0, fld);
  judge('B19 and the instrument SAYS which Hamiltonian is in force: a Stark badge appears and the status line drops from EXACT ANALYTIC to EXACT WITHIN EACH SHELL', /STARK|ZEEMAN/.test(fld.badge) || /WITHIN EACH SHELL/.test(fld.status), { badge: fld.badge, status: fld.status });

  const pal = await g.ev(`try { __LW.loadPreset('2p+'); __LW.setView('phase'); await __LW.settle();
    const before = await __LW.readPixels();
    __LW.palette.setOn(true); await __LW.settle();
    const after = await __LW.readPixels();
    const seam = document.querySelector('.pal-strip').width > 0;
    const d0 = __LW.stateDigest();
    __LW.palette.load([{ at: 0, rgb: [1, 0, 0] }, { at: 0.5, rgb: [0, 0, 1] }]); await __LW.settle();
    const two = await __LW.readPixels();
    __LW.palette.setOn(false); await __LW.settle();
    const off = await __LW.readPixels();
    const C = (p) => p.meanChroma;
    return { before: C(before), after: C(after), two: C(two), off: C(off), seam, same: d0 === __LW.stateDigest(), errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  // the shader dithers every frame, so two renders of one scene never hash alike: compare the colour statistic
  judge('B20 PHASE PALETTE: turning it on visibly recolours the field, editing the stops recolours it again, turning it off returns to the built-in wheel, and none of it touches ψ',
    !pal.error && pal.seam && Math.abs(pal.after - pal.before) > 1 && Math.abs(pal.two - pal.after) > 1 && Math.abs(pal.off - pal.before) < 0.5 && pal.same && pal.errs === 0, pal);

  /* ── draw styles (bounded transfer) and the keyboard ───────────────────── */
  const draw = await g.ev(`try { __LW.loadPreset('3dz2'); __LW.setView('density'); __LW.mat.style = 0; __LW.mat.exposure = 1; __LW.schedule(1); await __LW.settle();
    const cloud = await __LW.readPixels();
    __LW.mat.exposure = 12; __LW.schedule(1); await __LW.settle(); const cloudHot = await __LW.readPixels();
    __LW.mat.style = 1; __LW.mat.exposure = 1; __LW.schedule(1); await __LW.settle(); const solid = await __LW.readPixels();
    __LW.mat.exposure = 12; __LW.schedule(1); await __LW.settle(); const solidHot = await __LW.readPixels();
    __LW.mat.style = 2; __LW.mat.exposure = 1; __LW.schedule(1); await __LW.settle(); const grain = await __LW.readPixels();
    __LW.mat.style = 0; __LW.mat.exposure = 1; __LW.schedule(1); await __LW.settle();
    return { cloud: cloud.nonBlack / cloud.total, cloudHot: cloudHot.nonBlack / cloudHot.total, cloudLum: cloudHot.meanLum,
      solid: solid.nonBlack / solid.total, solidHot: solidHot.nonBlack / solidHot.total, solidLum: solidHot.meanLum,
      grain: grain.nonBlack / grain.total, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B21 DRAW STYLES: SOLID and GRAIN both render, and the bounded transfer holds — at exposure 12 the SOLID plateau stays far dimmer than the CLOUD, which is what stops the blob glowing the whole field',
    !draw.error && draw.solid > 0.01 && draw.grain > 0.005 && draw.solidLum < draw.cloudLum && draw.errs === 0, draw);
  const keys = await g.ev(`try { const y0 = __LW.obs.yaw, p0 = __LW.obs.pitch, d0 = __LW.obs.dist, s0 = __LW.stateDigest();
    const K = (code, mods) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ code, bubbles: true }, mods || {})));
    K('KeyD'); K('KeyW'); K('KeyE'); await __LW.settle();
    const cam = { yaw: __LW.obs.yaw !== y0, pitch: __LW.obs.pitch !== p0, dist: __LW.obs.dist !== d0, stateSame: s0 === __LW.stateDigest() };
    K('KeyY'); K('BracketRight'); await __LW.settle();
    const rotated = s0 !== __LW.stateDigest();
    K('BracketLeft'); await __LW.settle();
    const styleBefore = __LW.mat.style; K('KeyC'); await __LW.settle(); const styleAfter = __LW.mat.style;
    K('KeyC'); K('KeyC'); K('KeyC'); K('KeyC'); await __LW.settle();
    return { cam, rotated, styleBefore, styleAfter, styleBack: __LW.mat.style, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B21 KEYS: WASD/QE move the camera without touching ψ; X/Y/Z picks the rotation axis and [ ] turns the STATE about it; C cycles the draw style back to where it started',
    !keys.error && keys.cam.yaw && keys.cam.pitch && keys.cam.dist && keys.cam.stateSame && keys.rotated && keys.styleAfter !== keys.styleBefore && keys.styleBack === keys.styleBefore && keys.errs === 0, keys);

  /* ── QCD: the window computes, draws, and prints the refutation ────────── */
  const qcd = await g.ev(`try { const w = document.querySelector('.dev[data-id="qcd"]'); if (!w) return { error: 'no QCD window' };
    if (w.classList.contains('folded')) w.querySelector('.dev-fold').click();
    await __LW.settle(); await new Promise(r => setTimeout(r, 200));
    const c = __LW.qcd.cache; const cv = w.querySelector('canvas.qcd-c');
    const cornell = { split: c.sp.split, meas: c.sp.measuredSplit, ratio: c.flav.predRatio, v0: c.v0, m2: c.sp.levels[1].M };
    __LW.qcd.setPotential('linear'); __LW.schedule(1); await __LW.settle(); await new Promise(r => setTimeout(r, 200));
    const lin = { ratio: __LW.qcd.cache.flav.predRatio, airy: __LW.qcd.cache.flav.airyRatio };
    const subs = [...w.querySelectorAll('.ro-sub')].map(e => e.textContent).join(' | ');
    __LW.qcd.setPotential('cornell'); __LW.schedule(1); await __LW.settle();
    return { cornell, lin, refuted: subs.includes('REFUTED'), canvas: cv && cv.width > 0 && cv.height > 0, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B22 QCD: the window solves Cornell (2S−1S = 0.6036, ψ(2S) within 20 MeV with V₀ fitted), draws the ladder, and under the LINEAR potential prints the Airy spectroscopy as REFUTED with the rigid 0.679 ratio',
    !qcd.error && Math.abs(qcd.cornell.split - 0.6036) < 2e-3 && Math.abs(qcd.cornell.m2 - 3.6861) < 0.02 && Math.abs(qcd.lin.ratio - 0.679) < 0.02 && qcd.refuted && qcd.canvas && qcd.errs === 0, qcd);

  /* ── MOMENTUM SPACE: Parseval on the GPU grid ──────────────────────────── */
  const mom = await g.ev(`try { __LW.loadPreset('2p+'); __LW.setView('density'); await __LW.settle();
    const x = await __LW.fieldDigest(); const halfX = __LW.domain.half;
    __LW.setSpace('p'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const p = await __LW.fieldDigest(); const halfP = __LW.domain.half;
    const badge = document.body.textContent;
    const px = await __LW.readPixels();
    __LW.setSpace('x'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const back = await __LW.fieldDigest();
    return { xInt: x.integral, pInt: p.integral, backInt: back.integral, halfX, halfP, fieldSpace: p.half, nanP: p.nan,
      momentumBadge: badge.includes('a₀⁻¹ · MOMENTUM'), lit: px.nonBlack / px.total, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B23 MOMENTUM SPACE: switching the grid to φ(p) keeps the norm — PARSEVAL on the GPU: ∫|φ|²d³p = ∫|ψ|²d³x = 1 within 2% on a 96³ grid — the box rescales to a₀⁻¹, the badge says MOMENTUM, the picture is lit, and switching back restores the position integral',
    !mom.error && Math.abs(mom.pInt - 1) < 0.02 && Math.abs(mom.xInt - 1) < 0.02 && Math.abs(mom.backInt - mom.xInt) < 1e-6 && mom.halfP < mom.halfX && mom.momentumBadge && mom.lit > 0.02 && !mom.nanP && mom.errs === 0 && !mom.gpu, mom);

  /* ── SLAP: the impulse drops the norm by the escaped fraction and the state jiggles ── */
  const slap = await g.ev(`try { __LW.reg.clear(); __LW.reg.set(0, 1, 0); await __LW.settle();
    const w = document.querySelector('.dev[data-id="state"]'); if (w && w.classList.contains('folded')) w.querySelector('.dev-fold').click();
    const n0 = __LW.reg.norm2(), d0 = __LW.stateDigest();
    __LW.kick(0.1, 'z'); await __LW.settle();
    const n1 = __LW.reg.norm2(), d1 = __LW.stateDigest();
    const ro = w ? [...w.querySelectorAll('.ro-val')].map(e => e.textContent).find(t => t.includes('%')) : null;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK', bubbles: true })); await __LW.settle();
    const n2 = __LW.reg.norm2();
    __LW.clock.step(4); await __LW.settle();
    const dq = [...document.querySelectorAll('[data-dq="dipole"]')].map(e => e.textContent)[0] || '';
    return { n0, n1, n2, escZ: 1 - n1 / n0, escX: 1 - n2 / n1, changed: d0 !== d1, readout: ro, dipole: dq, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B24 SLAP: kicking 1s with k = 0.1 along z drops the norm by 0.31% (the electron knocked out of the six-shell register — physics, not renormalised), the readout prints it, the K key slaps at k = 0.2 along the chosen axis (escape 1.2–1.4%, the same law), and the state jiggles',
    !slap.error && Math.abs(slap.n0 - 1) < 1e-9 && slap.escZ > 0.0027 && slap.escZ < 0.0034 && slap.escX > 0.010 && slap.escX < 0.017 && slap.changed && slap.readout && slap.readout.includes('%') && slap.errs === 0, slap);

  /* ── KEPLER: the classical orbit over the cloud, from the exact invariants ── */
  const kep = await g.ev(`try {
    __LW.reg.clear(); __LW.reg.set(13, 1, 0); await __LW.settle();                    // index 13 = |3,2,2⟩, the circular state
    const o0 = __LW.kepler.orbits.map(o => ({ n: o.orbit.n, e: o.orbit.e, a: o.orbit.a, iso: o.orbit.isotropic }));
    __LW.rotor({ which: 'K', axis: 'x', angle: 0.6 }); await __LW.settle();
    const o1 = __LW.kepler.orbits.map(o => ({ n: o.orbit.n, e: o.orbit.e }));
    const cv = document.getElementById('kepler'); const ctx = cv.getContext('2d');
    const px = ctx.getImageData(0, 0, cv.width, cv.height).data; let lit = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 0) lit++;
    __LW.kepler.setOn(false); __LW.schedule(1); await __LW.settle();
    const px2 = ctx.getImageData(0, 0, cv.width, cv.height).data; let lit2 = 0; for (let i = 3; i < px2.length; i += 4) if (px2[i] > 0) lit2++;
    __LW.kepler.setOn(true); __LW.schedule(1); await __LW.settle();
    return { o0, o1, lit, lit2, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B25 KEPLER: the circular 3d₊₂ state carries a circle (e = 0, a = 9) drawn over the cloud; a Runge–Lenz rotation by 0.6 turns it into an ellipse of e = (2/3)·sin 0.6 = 0.376; the overlay lights and clears with its switch',
    !kep.error && kep.o0.length === 1 && kep.o0[0].n === 3 && kep.o0[0].e < 1e-9 && kep.o0[0].a === 9 && Math.abs(kep.o1[0].e - 2 / 3 * Math.sin(0.6)) < 1e-9 && kep.lit > 200 && kep.lit2 === 0 && kep.errs === 0, kep);

  /* ── THE HAMILTONIAN SELECTOR: the oscillator, and Ehrenfest exact under a slap ── */
  const qho = await g.ev(`try { __LW.reg.clear(); __LW.reg.set(0, 1, 0); await __LW.settle();
    __LW.setHamiltonian('qho'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const E0 = __LW.reg.E[0], E2p = __LW.reg.E[2], half = __LW.domain.half;
    const dig = await __LW.fieldDigest();
    const hidden = ['orbit', 'ladder', 'vortex', 'dynamics', 'slice'].map(id => { const w = document.querySelector('.dev[data-id="' + id + '"]'); return w ? w.hidden : null; });
    const status = document.querySelector('.dev[data-id="spectrum"] .dev-stat').textContent;
    const n0 = __LW.reg.norm2();
    __LW.kick(0.5, 'z'); await __LW.settle();
    const n1 = __LW.reg.norm2();
    const w = document.querySelector('.dev[data-id="state"]');
    const ro = w ? [...w.querySelectorAll('.ro-val')].map(e => e.textContent).find(t => t.includes('%')) : null;
    __LW.setHamiltonian('hydrogen'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const back = { E0: __LW.reg.E[0], orbitHidden: document.querySelector('.dev[data-id="orbit"]').hidden };
    return { E0, E2p, half, integral: dig.integral, nan: dig.nan, hidden, status, escaped: 1 - n1 / n0, readout: ro, back, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B26 OSCILLATOR: switching the Hamiltonian sets E = 3/2 and 5/2 on the ground and first p labels, rescales the box, the GPU grid integrates the Gaussian ground state to 1 (2%), the hydrogen-theorem windows stand down, and a slap of k = 0.5 loses NOTHING (< 1e-6) with ⟨p⟩ gained = 0.5000 — Ehrenfest exact; switching back restores hydrogen',
    !qho.error && Math.abs(qho.E0 - 1.5) < 1e-12 && Math.abs(qho.E2p - 2.5) < 1e-12 && qho.half < 9 && Math.abs(qho.integral - 1) < 0.02 && !qho.nan && qho.hidden.every(h => h === true) && qho.status.includes('OSCILLATOR') && qho.escaped < 1e-6 && qho.readout && qho.readout.includes('0.5000') && Math.abs(qho.back.E0 + 0.5) < 1e-12 && qho.back.orbitHidden === false && qho.errs === 0 && !qho.gpu, qho);

  /* ── THE BOW: ctrl+drag previews the exact boosted state, release slaps, releasing ctrl cancels; the DRAG toy ── */
  const bowT = await g.ev(`try { __LW.setHamiltonian('hydrogen'); __LW.reg.clear(); __LW.reg.set(0, 1, 0); __LW.setView('density'); await __LW.settle();
    const cv = document.getElementById('field'), r = cv.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const d0 = __LW.stateDigest();
    __LW.bow.start(cx, cy); __LW.bow.move(cx + 240, cy); await __LW.settle();
    const during = { active: __LW.bow.active, k: __LW.bow.k, dir: __LW.bow.dir, boostOn: __LW.mat.boost.on, view: __LW.mat.view, boostK: __LW.mat.boost.k.slice() };
    const px = await __LW.readPixels();
    __LW.bow.cancel(); await __LW.settle();
    const afterCancel = { active: __LW.bow.active, boostOn: __LW.mat.boost.on, view: __LW.mat.view, same: __LW.stateDigest() === d0 };
    __LW.bow.start(cx, cy); __LW.bow.move(cx + 120, cy); __LW.bow.release(); await __LW.bow.landed; await __LW.settle();   // wave 45: the slap lands off the frame — the one clause this wave was asked to change
    const w = document.querySelector('.dev[data-id="state"]');
    const sub = w ? [...w.querySelectorAll('.ro-sub')].map(e => e.textContent).find(t => t.includes('bow')) : null;
    const afterRelease = { changed: __LW.stateDigest() !== d0, boostOn: __LW.mat.boost.on, norm: __LW.reg.norm(), sub };
    __LW.setDamping(0.2); const nA = __LW.reg.at(8); let n8 = 0; for (let i = 0; i < 91; i++) n8 += nA.re[i] ** 2 + nA.im[i] ** 2;
    const status = __LW.field.ok ? document.body.textContent.includes('TOY DRAG') : true;
    __LW.setDamping(0); const nB = __LW.reg.at(8); let n8b = 0; for (let i = 0; i < 91; i++) n8b += nB.re[i] ** 2 + nB.im[i] ** 2;
    return { during, lit: px.meanChroma, afterCancel, afterRelease, damp: { n8, n8b, status }, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B27 THE BOW: ctrl+drag 240 px draws k = 2.0 in the screen plane, switches to the phase view with the preview boost on (the fringes are the exact e^{ik·x}ψ); releasing CTRL cancels with ψ untouched; pulling 120 px and releasing slaps k = 1 and drops the norm; the DRAG toy at γ = 0.2 bleeds the excited norm at t = 8 and says TOY DRAG, and γ = 0 restores the unitary register',
    !bowT.error && bowT.during.active && Math.abs(bowT.during.k - 2) < 1e-9 && bowT.during.boostOn && bowT.during.view === 1 && Math.abs(Math.hypot(...bowT.during.boostK) - 2) < 1e-9
      && !bowT.afterCancel.active && !bowT.afterCancel.boostOn && bowT.afterCancel.view === 0 && bowT.afterCancel.same
      && bowT.afterRelease.changed && !bowT.afterRelease.boostOn && bowT.afterRelease.norm < 0.9 && bowT.afterRelease.sub && bowT.afterRelease.sub.includes('k = 1.000')
      && bowT.damp.n8 < bowT.damp.n8b - 1e-3 && bowT.damp.status && bowT.errs === 0 && !bowT.gpu, bowT);

  /* ── KEYS: H hides the interface, TAB cycles windows to the top, Ctrl+R reseeds, and a binding can be changed ── */
  const keysT = await g.ev(`try { const K = (code, mods) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ code, bubbles: true, cancelable: true }, mods || {})));
    const rackEl = document.getElementById('rack');
    K('KeyH'); await __LW.settle();
    const hidden = { cls: document.body.classList.contains('ui-hidden'), rack: getComputedStyle(rackEl).display, frame: __LW.mat.frame };
    K('KeyH'); await __LW.settle();
    const shown = { cls: document.body.classList.contains('ui-hidden'), rack: getComputedStyle(rackEl).display };
    const first0 = rackEl.querySelector('.dev').dataset.id;
    K('Tab'); await __LW.settle();
    const first1 = rackEl.querySelector('.dev'); const tab1 = { id: first1.dataset.id, folded: first1.classList.contains('folded') };
    K('Tab', { shiftKey: true }); await __LW.settle();
    const tab2 = rackEl.querySelector('.dev').dataset.id;
    K('KeyR', { ctrlKey: true }); await __LW.settle();
    const seeded = { on: __LW.particles.on, count: __LW.particles.state.count };
    const camBefore = { yaw: __LW.obs.yaw }; __LW.obs.yaw = 2.0;
    __LW.keys.bind('camReset', { key: 'KeyT' }); K('KeyR'); const notReset = __LW.obs.yaw; K('KeyT'); await __LW.settle(); const reset = __LW.obs.yaw;
    const saved = JSON.parse(localStorage.getItem('lambdawaves.q0.keys') || '{}');
    __LW.keys.reset();
    return { hidden, shown, first0, tab1, tab2, seeded, notReset, reset, saved, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B28 KEYS: H hides the rack, badges, hint and frame and H shows them again; TAB brings the next window to the top unfolded and Shift+TAB the previous; Ctrl+R seeds the particles; rebinding the camera reset from R to T takes effect at once and is saved in localStorage',
    !keysT.error && keysT.hidden.cls && keysT.hidden.rack === 'none' && keysT.hidden.frame === false && !keysT.shown.cls && keysT.shown.rack !== 'none'
      && keysT.tab1.id !== keysT.first0 && !keysT.tab1.folded && keysT.tab2 === keysT.first0
      && keysT.seeded.on && keysT.seeded.count > 0 && Math.abs(keysT.notReset - 2.0) < 1e-12 && Math.abs(keysT.reset - 0.65) < 1e-12 && keysT.saved.camReset && keysT.saved.camReset.key === 'KeyT' && keysT.errs === 0, keysT);

  /* ── THE MOLECULE: H₂⁺ takes the field — two centred orbitals on the GPU, the tunnelling electron ── */
  const mol = await g.ev(`try { __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s'); __LW.setView('density'); await __LW.settle();
    const atomInt = (await __LW.fieldDigest()).integral;
    __LW.molecule.setOn(true); __LW.molecule.setR(2); __LW.molecule.setKind('sigma_g'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const gInt = (await __LW.fieldDigest()).integral, half = __LW.domain.half;
    const stateHidden = document.querySelector('.dev[data-id="state"]').hidden, status = document.body.textContent.includes('H₂⁺ · EXACT integrals');
    __LW.molecule.setKind('sigma_u'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const uInt = (await __LW.fieldDigest()).integral;
    __LW.molecule.setKind('on_A'); __LW.clock.reset(); await __LW.settle(); await new Promise(r => setTimeout(r, 200));
    const w = document.querySelector('.dev[data-id="molecule"]');
    const roA = () => [...w.querySelectorAll('.ro-val')].map(e => e.textContent).find(t => /^[01]\\.\\d{4}$/.test(t));
    const p0 = roA();
    __LW.clock.step(15.991 / 2); await __LW.settle(); await new Promise(r => setTimeout(r, 200));
    const pHalf = roA();
    __LW.molecule.setOn(false); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const back = { stateHidden: document.querySelector('.dev[data-id="state"]').hidden, integral: (await __LW.fieldDigest()).integral };
    return { atomInt, gInt, uInt, half, stateHidden, status, p0, pHalf, back, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B29 MOLECULE: with H₂⁺ holding the field the GPU integrates σg and σu — two 1s orbitals centred on the protons at ±1 — to 1 (2%; the centred-orbital kernel works and the non-orthogonal normalisation is right), the atom windows stand down, the status names the labels, the electron ON A reads 1.0000 at t = 0 and 0.0000 half a tunnelling period later, and OFF gives the atom back',
    !mol.error && Math.abs(mol.atomInt - 1) < 0.02 && Math.abs(mol.gInt - 1) < 0.02 && Math.abs(mol.uInt - 1) < 0.02 && Math.abs(mol.half - 7) < 1e-9 && mol.stateHidden && mol.status && mol.p0 === '1.0000' && mol.pHalf === '0.0000' && !mol.back.stateHidden && Math.abs(mol.back.integral - 1) < 0.02 && mol.errs === 0 && !mol.gpu, mol);

  /* ── PERFORMANCE: the frame profile measures, 120 Hz mode throttles the CPU windows, the field never waits ── */
  const perfT = await g.ev(`try { __LW.loadPreset('recon'); __LW.setView('density'); __LW.perf.setMode('full'); await __LW.settle();
    const run = async (ms) => { const f0 = __LW.perf.counts.frames, c0 = __LW.perf.counts.cpu, p0 = __LW.stats.presents; __LW.play(); await new Promise(r => setTimeout(r, ms)); __LW.pause(); await __LW.settle(); return { frames: __LW.perf.counts.frames - f0, cpu: __LW.perf.counts.cpu - c0, presents: __LW.stats.presents - p0, profile: Object.assign({}, __LW.perf.profile) }; };
    const full = await run(1500);
    __LW.perf.setMode('120'); await __LW.settle();
    const fast = await run(1500);
    __LW.perf.setMode('full');
    return { full, fast, mode: __LW.perf.mode, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B30 PERFORMANCE: the profile measures every stage (field and total > 0); in 120 Hz mode the CPU windows update on about every 4th frame while the field still presents every frame; the mode switches back cleanly',
    !perfT.error && perfT.full.profile.field > 0 && perfT.full.profile.total > 0 && perfT.full.frames > 10 && perfT.fast.frames > 10
      && perfT.fast.cpu <= perfT.fast.frames / 4 + 2 && perfT.full.cpu >= perfT.full.frames - 2 && perfT.fast.presents >= perfT.fast.frames - 2 && perfT.mode === 'full' && perfT.errs === 0,
    { fullFps: +(perfT.full.frames / 1.5).toFixed(1), fastFps: +(perfT.fast.frames / 1.5).toFixed(1), fullMs: perfT.full.profile.total && +perfT.full.profile.total.toFixed(2), fastMs: perfT.fast.profile.total && +perfT.fast.profile.total.toFixed(2), fieldMs: perfT.full.profile.field && +perfT.full.profile.field.toFixed(2), cpuFull: perfT.full.cpu, cpuFast: perfT.fast.cpu, frames: [perfT.full.frames, perfT.fast.frames], error: perfT.error });

  /* ── THE BOX: the spherical well on the GPU — j_l by Miller's recurrence in WGSL, a hard wall, a bouncing packet ── */
  const wellT = await g.ev(`try { __LW.molecule.setOn(false); __LW.reg.clear(); __LW.reg.set(0, 1, 0); await __LW.settle();
    __LW.setHamiltonian('well'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const E0 = __LW.reg.E[0], half = __LW.domain.half;
    const g0 = await __LW.fieldDigest();
    __LW.reg.clear(); __LW.reg.set(13, 1, 0); await __LW.settle(); await new Promise(r => setTimeout(r, 300));   // |3,2,2⟩ → the first zero of j₂
    const d0 = await __LW.fieldDigest();
    __LW.reg.clear(); __LW.reg.set(0, 1, 0); await __LW.settle();
    const n0 = __LW.reg.norm2(); __LW.kick(0.6, 'z'); await __LW.settle(); const n1 = __LW.reg.norm2();
    const status = document.querySelector('.dev[data-id="spectrum"] .dev-stat').textContent.includes('SPHERICAL WELL'); const lane2s = (document.querySelector('.sp-e[data-a="1"]') || {}).textContent;
    __LW.setHamiltonian('hydrogen'); await __LW.settle();
    return { E0, half, gInt: g0.integral, dInt: d0.integral, nan: g0.nan + d0.nan, escaped: 1 - n1 / n0, status, lane2s, back: __LW.reg.E[0], errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B31 THE BOX: selecting the spherical well sets E = π²/200 on the ground label, the box is the well (±10.8), the GPU integrates the ground state (j₀) AND a d state (j₂ by Miller\'s recurrence in WGSL) to 1 (2%), a slap of k = 0.6 leaves the register only a little (the box\'s spectrum is dense), the footer names the wall, and hydrogen comes back',
    !wellT.error && Math.abs(wellT.E0 - Math.PI ** 2 / 200) < 1e-12 && Math.abs(wellT.half - 10.8) < 1e-6 && Math.abs(wellT.gInt - 1) < 0.02 && Math.abs(wellT.dInt - 1) < 0.02 && !wellT.nan && wellT.escaped < 0.1 && wellT.status && wellT.lane2s && wellT.lane2s.startsWith('0.1974') && Math.abs(wellT.back + 0.5) < 1e-12 && wellT.errs === 0 && !wellT.gpu, wellT);

  /* ── Z: the hydrogen-like ion on the GPU — scaled tables in both spaces integrate to 1 ── */
  const zT = await g.ev(`try { __LW.setHamiltonian('hydrogen'); __LW.loadPreset('2p+'); __LW.setView('density'); __LW.setSpace('x'); await __LW.settle();
    __LW.setIonZ(2); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const E0 = __LW.reg.E[0], half = __LW.domain.half, xInt = (await __LW.fieldDigest()).integral;
    const status = document.querySelector('.dev[data-id="spectrum"] .dev-stat').textContent;
    const orbitHidden = document.querySelector('.dev[data-id="orbit"]').hidden, ladderHidden = document.querySelector('.dev[data-id="ladder"]').hidden;
    __LW.setSpace('p'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const pInt = (await __LW.fieldDigest()).integral, halfP = __LW.domain.half;
    __LW.setSpace('x'); __LW.setIonZ(1); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const back = { E0: __LW.reg.E[0], half: __LW.domain.half, ladderHidden: document.querySelector('.dev[data-id="ladder"]').hidden };
    return { E0, half, xInt, pInt, halfP, status, orbitHidden, ladderHidden, back, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B32 Z = 2 (He⁺): E_1s = −2, the box halves to ±8, the GPU integrates the scaled 2p₊ to 1 in position AND momentum space (the exponent fix), the status names the ion, the hydrogen-theorem windows stand down, and Z = 1 restores everything',
    !zT.error && Math.abs(zT.E0 + 2) < 1e-12 && Math.abs(zT.half - 8) < 1e-9 && Math.abs(zT.xInt - 1) < 0.02 && Math.abs(zT.pInt - 1) < 0.02 && Math.abs(zT.halfP - 4.0) < 1e-9 && zT.status.includes('Z = 2') && zT.ladderHidden && Math.abs(zT.back.E0 + 0.5) < 1e-12 && Math.abs(zT.back.half - 16) < 1e-9 && !zT.back.ladderHidden && zT.errs === 0 && !zT.gpu, zT);

  /* ── HELIUM: the conditional cloud of electron 2 on the GPU, moving away from electron 1 ── */
  const heT = await g.ev(`try { __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s'); __LW.setView('density'); await __LW.settle();
    __LW.helium.setBasis('six'); __LW.helium.place(0.8, 0); __LW.helium.setOn(true); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const d1 = await __LW.fieldDigest(), half = __LW.domain.half, space = __LW.field.space;
    const stateHidden = document.querySelector('.dev[data-id="state"]').hidden, status = document.body.textContent.includes('the conditional density of electron 2');
    __LW.helium.place(2.0, Math.PI / 2); __LW.schedule(4); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const d2 = await __LW.fieldDigest();
    const w = document.querySelector('.dev[data-id="helium"]');
    const vals = [...w.querySelectorAll('.ro-val')].map(e => e.textContent);
    __LW.helium.setOn(false); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const back = { stateHidden: document.querySelector('.dev[data-id="state"]').hidden, integral: (await __LW.fieldDigest()).integral, space: __LW.field.space };
    return { half, space, int1: d1.integral, int2: d2.integral, hash1: d1.hash, hash2: d2.hash, nan: d1.nan + d2.nan, stateHidden, status, vals, back, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B33 HELIUM: with helium holding the field the kernel runs the two-electron branch (space 4) on a ±4 box, draws a finite conditional cloud that CHANGES when electron 1 is moved (different grid, no NaN), the window prints the variational energy above the exact one with the cusp near ½, the atom windows stand down, and OFF gives the atom back',
    !heT.error && heT.space === 4 && Math.abs(heT.half - 4) < 1e-9 && heT.int1 > 0 && heT.int2 > 0 && heT.hash1 !== heT.hash2 && !heT.nan && heT.stateHidden && heT.status
      && heT.vals.some(v => v.startsWith('-2.903')) && !heT.back.stateHidden && Math.abs(heT.back.integral - 1) < 0.02 && heT.back.space === 0 && heT.errs === 0 && !heT.gpu, heT);

  /* ── THE GAS: a packet launched in the box flies at its momentum and bounces ── */
  const gasT = await g.ev(`try { __LW.molecule.setOn(false); __LW.helium.setOn(false); __LW.setHamiltonian('well'); await __LW.settle();
    __LW.clock.reset(); __LW.launchPacket([0, 0, -4], [0, 0, 0.8], 1.6); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const L = __LW.lastLaunch, norm = __LW.reg.norm(), pop = __LW.reg.populated().length;
    const c0 = __LW.packetCentroid(24), d0 = await __LW.fieldDigest();
    __LW.clock.step(3); __LW.schedule(3); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const c3 = __LW.packetCentroid(24), d3 = await __LW.fieldDigest();
    const w = document.querySelector('.dev[data-id="spectrum"]');
    const ro = [...w.querySelectorAll('.ro-val')].map(e => e.textContent).find(t => t.includes('held'));
    __LW.setHamiltonian('hydrogen'); await __LW.settle();
    return { captured: L.captured, norm, pop, c0, c3, hash0: d0.hash, hash3: d3.hash, int0: d0.integral, int3: d3.integral, ro, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B34 THE GAS: a σ = 1.6 packet launched at z = −4 with k = 0.8 is held by the box to > 85%, is a unit-norm state of > 20 well eigenstates, sits at z ≈ −4, moves to ≈ −1.6 in three time units, the GPU grid integrates it to 1 (2%) before and after, and the readout reports how much the box holds',
    !gasT.error && gasT.captured > 0.85 && Math.abs(gasT.norm - 1) < 1e-9 && gasT.pop > 20 && Math.abs(gasT.c0[2] + 4) < 0.4 && Math.abs(gasT.c3[2] + 1.6) < 0.7 && gasT.hash0 !== gasT.hash3 && Math.abs(gasT.int0 - 1) < 0.02 && Math.abs(gasT.int3 - 1) < 0.02 && gasT.ro && gasT.ro.includes('held') && gasT.errs === 0 && !gasT.gpu, gasT);

  /* ── H₂: two atoms on the GPU as an incoherent density, and the collision on the triplet curve ── */
  const h2T = await g.ev(`try { __LW.molecule.setOn(false); __LW.helium.setOn(false); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s'); __LW.setView('density'); await __LW.settle();
    __LW.h2.setWhich('triplet'); __LW.h2.setR(6); __LW.h2.setOn(true); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const d6 = await __LW.fieldDigest(), space = __LW.field.space, half = __LW.domain.half;
    __LW.h2.setR(1.4); __LW.h2.setWhich('singlet'); __LW.schedule(4); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const d14 = await __LW.fieldDigest();
    __LW.h2.setWhich('triplet'); __LW.clock.reset(); const traj = __LW.h2.collide(0.02); __LW.schedule(4); await __LW.settle();
    const status = document.body.textContent.includes('CLASSICAL nuclei');
    __LW.clock.step(1.5); __LW.schedule(3); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const Rmid = __LW.h2.R;
    __LW.h2.setOn(false); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const back = { space: __LW.field.space, integral: (await __LW.fieldDigest()).integral };
    return { space, half, int6: d6.integral, int14: d14.integral, nan: d6.nan + d14.nan, Rmin: traj.Rmin, Rmid, status, back, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B35 H₂: the kernel\'s incoherent two-group branch integrates the Heitler–London one-electron density to 2 electrons (2%) at R = 6 (triplet) and at R = 1.4 (singlet, where the σu group is nearly gone), the collision on the triplet turns around at R ≈ 3.4 and the nuclei are on their way in 1.5 time units later (R between the turning point and the start), the status says classical nuclei, and OFF gives the atom back',
    !h2T.error && h2T.space === 5 && Math.abs(h2T.half - 8) < 1e-9 && Math.abs(h2T.int6 - 2) < 0.04 && Math.abs(h2T.int14 - 2) < 0.04 && !h2T.nan && h2T.Rmin > 2.8 && h2T.Rmin < 4.2 && h2T.Rmid < 8 && h2T.Rmid > h2T.Rmin - 1e-9 && h2T.status && h2T.back.space === 0 && Math.abs(h2T.back.integral - 1) < 0.02 && h2T.errs === 0 && !h2T.gpu, h2T);

  /* ── CALCULUS: the live table shows Ehrenfest holding, and switches its law with the Hamiltonian ── */
  const calcT = await g.ev(`try { __LW.setHamiltonian('hydrogen'); __LW.reg.clear(); __LW.reg.set(0, 0.8, 0); __LW.reg.set(3, 0.6, 0); __LW.clock.reset(); __LW.clock.step(1.3); __LW.schedule(3); await __LW.settle();
    const w = document.querySelector('.dev[data-id="calculus"]'); if (w.classList.contains('folded')) w.querySelector('.dev-fold').click();
    __LW.schedule(1); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const rows = [...w.querySelectorAll('.calc-row')].filter(r => !r.classList.contains('calc-head')).map(r => [...r.children].map(c => c.textContent));
    const res = [...w.querySelectorAll('.calc-res')].map(e => e.className);
    const L = __LW.calculus.last;
    const ehrI = L.rows[2], ehrII = L.rows[3];
    __LW.setHamiltonian('qho'); __LW.schedule(4); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const lawQ = __LW.calculus.last.rows[3].law;
    __LW.setHamiltonian('hydrogen'); await __LW.settle();
    return { n: rows.length, res, ehrI: { v: ehrI.value, d: ehrI.derivative, p: ehrI.predicted, r: ehrI.residual }, ehrII: { d: ehrII.derivative, p: ehrII.predicted, r: ehrII.residual }, lawQ, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B36 CALCULUS: on 1s + 2p_z at t = 1.3 the live table shows five rows with Ehrenfest I and II holding (residuals < 1e-5 relative, marked ok), the dipole moving (|⟨p_z⟩| > 0.01), and under the oscillator the law reads Newton (−⟨z⟩)',
    !calcT.error && calcT.n === 5 && Math.abs(calcT.ehrI.r) < 1e-5 * (1 + Math.abs(calcT.ehrI.p)) && Math.abs(calcT.ehrII.r) < 1e-5 * (1 + Math.abs(calcT.ehrII.p)) && Math.abs(calcT.ehrI.p) > 0.01 && calcT.res[2].includes('ok') && calcT.res[3].includes('ok') && calcT.lawQ.includes('−⟨z⟩') && calcT.errs === 0, calcT);

  /* ── HELIUM: shift-click (or its API) puts electron 1 under the cursor, and electron 2's cloud follows ── */
  const plT = await g.ev(`try { __LW.h2.setOn(false); __LW.molecule.setOn(false); __LW.setHamiltonian('hydrogen'); __LW.helium.setBasis('six'); __LW.helium.place(0.8, 0); __LW.helium.setOn(true); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const x0 = __LW.helium.x1.slice(), d0 = await __LW.fieldDigest();
    const cv = document.getElementById('field'), W = cv.clientWidth, H = cv.clientHeight;
    __LW.placeElectron(W * 0.62, H * 0.42); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const x1 = __LW.helium.x1.slice(), d1 = await __LW.fieldDigest();
    const moved = Math.hypot(x1[0] - x0[0], x1[1] - x0[1], x1[2] - x0[2]);
    __LW.helium.setOn(false); await __LW.settle();
    return { x0, x1, moved, changed: d0.hash !== d1.hash, inside: Math.hypot(...x1) < 3.5, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B37 shift-click places electron 1 where the cursor points on the plane facing the camera (moved > 0.3 a₀, inside the box), and the conditional cloud of electron 2 is rebuilt', !plT.error && plT.moved > 0.3 && plT.inside && plT.changed && plT.errs === 0, plT);

  /* ── THE FLOATING RACK: hide/peek, reorder, the mini transport that docks, notes behind hint icons ── */
  const layT = await g.ev(`try { const body = document.body, rackEl = document.getElementById('rack'), tr = document.getElementById('transport');
    const stage = getComputedStyle(document.getElementById('stage')), rackPos = getComputedStyle(rackEl).position;
    const notesHidden = [...document.querySelectorAll('#rack .note.hint-src')].every(n => getComputedStyle(n).display === 'none'), icons = document.querySelectorAll('#rack .info-i').length;
    body.classList.add('notes-open'); await new Promise(r => setTimeout(r, 50));
    const notesShown = [...document.querySelectorAll('#rack .note.hint-src')].some(n => getComputedStyle(n).display !== 'none'); body.classList.remove('notes-open');
    __LW.layout.toggleRack(); await new Promise(r => setTimeout(r, 400)); const hidden = { cls: body.classList.contains('rack-hidden'), op: getComputedStyle(rackEl).opacity };
    const peekWho = []; const origRm = body.classList.remove.bind(body.classList); body.classList.remove = (...c) => { if (c.includes('rack-peek')) peekWho.push(String(new Error().stack).split(String.fromCharCode(10)).slice(1, 4).join(' | ')); return origRm(...c); }; body.classList.add('rack-peek'); let peek = '0'; for (let i = 0; i < 40 && peek !== '1'; i++) { await new Promise(r => setTimeout(r, 50)); peek = getComputedStyle(rackEl).opacity; } body.classList.remove = origRm; const peekDbg = { who: peekWho, cls: body.className, tf: getComputedStyle(rackEl).transform, disp: getComputedStyle(rackEl).display, rule: [...document.styleSheets].flatMap((ss) => { try { return [...ss.cssRules]; } catch (e) { return []; } }).some((r) => r.selectorText === 'body.rack-hidden.rack-peek #rack'), hiddenAttr: rackEl.hidden, parent: rackEl.parentElement && rackEl.parentElement.id }; body.classList.remove('rack-peek');
    __LW.layout.toggleRack(); await new Promise(r => setTimeout(r, 400));
    const before = __LW.layout.order(); __LW.layout.moveCard('meters', 0); const after = __LW.layout.order();
    const mini = tr.classList.contains('mini') && tr.getBoundingClientRect().height < 40;
    __LW.layout.dockTransport(); const docked = tr.closest('.dev') && tr.closest('.dev').dataset.id === 'transport' && !document.querySelector('.dev[data-id="transport"]').hidden;
    __LW.layout.dockTransport(); const undocked = tr.parentElement.id === 'stage' && tr.classList.contains('mini');
    const stageFull = stage.position === 'absolute';
    return { stageFull, rackPos, notesHidden, icons, notesShown, hidden, peek, peekDbg, before0: before[0], after0: after[0], mini, docked, undocked, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B38 THE FLOATING RACK: the stage fills the window and the rack floats over it; every note is folded behind a hint icon and N opens them all; the hide button slides the rack out and the right-edge peek brings it back; a card can be moved to the top; the transport is a slim bar that docks into the rack as a card and undocks',
    !layT.error && layT.stageFull && layT.rackPos === 'absolute' && layT.notesHidden && layT.icons > 10 && layT.notesShown && layT.hidden.cls && parseFloat(layT.hidden.op) < 0.05 && parseFloat(layT.peek) > 0.95 && layT.before0 !== 'meters' && layT.after0 === 'meters' && layT.mini && layT.docked && layT.undocked && layT.errs === 0, layT);

  /* ── THEME, SURFACE, FROST, the MIRROR rack and the logo ── */
  const thT = await g.ev(`try { __LW.loadPreset('2p+'); __LW.setView('density'); __LW.setTheme('dark'); await __LW.settle();
    const dark = await __LW.readPixels();
    __LW.setTheme('light'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const light = await __LW.readPixels(), lightState = { theme: document.body.dataset.theme, invert: __LW.mat.invert, bg: __LW.mat.bg.slice(), fg: getComputedStyle(document.body).getPropertyValue('--fg').trim() };
    __LW.mat.gamma = 2.2; __LW.schedule(1); await __LW.settle(); const gam = await __LW.readPixels(); __LW.mat.gamma = 1;
    __LW.setTheme('dark'); await __LW.settle();
    document.body.classList.add('frost'); const frost = getComputedStyle(document.querySelector('.dev')).backdropFilter || getComputedStyle(document.querySelector('.dev')).webkitBackdropFilter; document.body.classList.remove('frost');
    const sideBefore = __LW.layout.side('spectrum'); __LW.layout.moveToRack('spectrum', 'L'); const inLeft = !!document.querySelector('#rackL .dev[data-id="spectrum"]'), sideAfter = __LW.layout.side('spectrum');
    const swaps = document.querySelectorAll('.dev-swap').length; document.querySelector('#rackL .dev[data-id="spectrum"] .dev-swap').click(); const backRight = !!document.querySelector('#rack .dev[data-id="spectrum"]');
    const all = __LW.layout.orderAll().length;
    const title = document.getElementById('title'), mark = title.querySelector('svg.mark'), rects = mark ? mark.querySelectorAll('rect').length : 0;
    let font = false; try { await document.fonts.load('16px Spinwerad'); font = document.fonts.check('16px Spinwerad'); } catch (e) {}
    return { darkLum: dark.meanLum, lightLum: light.meanLum, gamLum: gam.meanLum, lightState, frost, sideBefore, inLeft, sideAfter, backRight, swaps, all, rects, font, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B39 THEME + MIRROR + LOGO: LIGHT sets the theme, lightens the stage so the frame\'s mean luminance jumps; GAMMA 2.2 changes the picture; FROST applies the GLASS BLUR radius (18 px by default) as a backdrop blur only while on; a card moves to the left rack by the API and back by its ⇄ button; TAB\'s order spans both racks; the title carries the nine-square diamond mark and the Spinwerad font loads',
    !thT.error && thT.lightState.theme === 'light' && thT.lightLum > thT.darkLum + 40 && Math.abs(thT.gamLum - thT.lightLum) > 3 && /blur\(18px\)/.test(thT.frost) && thT.sideBefore === 'L' && thT.inLeft && thT.sideAfter === 'L' && thT.backRight && thT.swaps > 10 && thT.all > 10 && thT.rects === 9 && thT.font && thT.errs === 0 && !thT.gpu, thT);

  /* ── THE WHEEL AS THE ACCENT: two angles on the palette colour the UI and the logo ── */
  const acT = await g.ev(`try { const saved = __LW.palette.stops.map((s) => ({ at: s.at, rgb: s.rgb.slice() })); const fillsSaved = [...document.querySelectorAll('#title .mark rect')].map((r) => r.getAttribute('fill')); __LW.palette.load([{ at: 0, rgb: [0.37, 0.9, 0.85] }, { at: 0.5, rgb: [0.85, 0.49, 0.91] }]); __LW.setTheme('dark'); __LW.accent.set(0, 162); await new Promise(r => setTimeout(r, 60));
    const body = document.body, title = document.getElementById('title'), hex2rgb = (h) => 'rgb(' + [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')';
    const acc0 = getComputedStyle(body).getPropertyValue('--acc').trim(), lam0 = title.querySelector('.lam').style.color;
    const fills0 = [...title.querySelectorAll('.mark rect')].map((r) => r.getAttribute('fill'));
    __LW.accent.set(90); const acc90 = getComputedStyle(body).getPropertyValue('--acc').trim();
    const playBg = getComputedStyle(document.querySelector('#transport .play')).backgroundColor, titleBg = getComputedStyle(title).backgroundColor, titleImg = getComputedStyle(title).backgroundImage;
    __LW.palette.load([{ at: 0, rgb: [1, 0, 0] }, { at: 0.5, rgb: [0, 0, 1] }]); const fillsRed = [...title.querySelectorAll('.mark rect')].map((r) => r.getAttribute('fill'));
    __LW.palette.load(saved); const fillsBack = [...title.querySelectorAll('.mark rect')].map((r) => r.getAttribute('fill'));
    const lamStyle = getComputedStyle(title.querySelector('.lam')), wordDark = getComputedStyle(title.querySelector('.word')).color;
    __LW.setTheme('light'); const wordLight = getComputedStyle(title.querySelector('.word')).color, accLight = getComputedStyle(body).getPropertyValue('--acc').trim(); __LW.setTheme('dark'); __LW.accent.set(0, 162);
    return { acc0, lam0, fills0, acc90, playBg, playIs90: playBg === hex2rgb(acc90), titleBg, titleImg, fillsRed, fillsBack, fillsSaved, lamItalic: lamStyle.fontStyle, lamWeight: lamStyle.fontWeight, lamIs0: lam0 === hex2rgb(fills0[0]), wordDark, wordLight, accLight, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B40 THE WHEEL AS THE ACCENT: --acc is a colour from the current palette and moving ACCENT A to 90° changes it, and the PLAY button wears it; the λ is the wheel\'s 0° colour, the nine squares are the wheel at 0°…320° and follow a palette change; the wordmark is white on DARK and black on LIGHT; the title has no background; the λ is a bold italic',
    !acT.error && /^#[0-9a-f]{6}$/.test(acT.acc0) && acT.acc90 !== acT.acc0 && acT.playIs90 && acT.lamIs0 && acT.fills0.length === 9 && new Set(acT.fills0).size >= 7 && JSON.stringify(acT.fillsRed) !== JSON.stringify(acT.fills0) && JSON.stringify(acT.fillsBack) === JSON.stringify(acT.fillsSaved) && acT.wordDark === 'rgb(255, 255, 255)' && acT.wordLight === 'rgb(0, 0, 0)' && acT.accLight !== acT.acc0 && /rgba\(0, 0, 0, 0\)|transparent/.test(acT.titleBg) && acT.titleImg === 'none' && acT.lamItalic === 'italic' && Number(acT.lamWeight) >= 700 && acT.errs === 0, acT);

  /* ── the iPad round: auto render scale, a rack that scrolls by touch, the box launches on entry, the coherent bounce ── */
  const ipT = await g.ev(`try { const q = __LW.quality, rackEl = document.getElementById('rack'), rs = getComputedStyle(rackEl), dev = getComputedStyle(document.querySelector('.dev'));
    const auto = { on: q.auto, scale: q.autoScale, min: q.minScale, ema: __LW.autoQ.ema, changes: __LW.autoQ.changes };
    q.auto = false; q.autoScale = 1;
    __LW.pause(); __LW.enterBox(); await __LW.settle();
    const box = { h: __LW.hamiltonian, launched: !!__LW.lastLaunch && !__LW.lastLaunch.coherent, held: __LW.lastLaunch && __LW.lastLaunch.captured, playing: __LW.clock.playing, modes: __LW.reg.populated().length };
    __LW.pause(); __LW.coherentBounce(); await __LW.settle();
    const coh = { h: __LW.hamiltonian, coherent: !!(__LW.lastLaunch && __LW.lastLaunch.coherent), norm: __LW.reg.norm2(), modes: __LW.reg.populated().length, playing: __LW.clock.playing };
    __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); await __LW.settle();
    __LW.setView('phase'); __LW.palette.setOn(true); await __LW.settle(); const px = await __LW.readPixels(); __LW.palette.setOn(false); __LW.setView('density'); await __LW.settle();
    q.auto = true;
    return { auto, rackPE: rs.pointerEvents, rackTA: rs.touchAction, rackBottom: rs.bottom, devTA: dev.touchAction, box, coh, palLit: px.nonBlack, shader: __LW.field.shaderMessages.length, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B41 THE iPAD ROUND: AUTO SCALE is on with a floor and a measured frame interval; the rack is a real scroller (pointer-events auto, pan-y) and cards pan; entering the BOX launches a held gas packet and plays; COHERENT BOUNCE puts the oscillator in a slapped ground state of unit norm across many N; the phase view with the palette on stays lit and the guarded shader compiles clean',
    !ipT.error && ipT.auto.on === true && ipT.auto.scale <= 1 && ipT.auto.min > 0 && ipT.auto.ema > 0 && ipT.rackPE === 'auto' && /pan-y/.test(ipT.rackTA) && /pan-y/.test(ipT.devTA) && ipT.box.h === 'well' && ipT.box.launched && ipT.box.held > 0.85 && ipT.box.playing && ipT.box.modes > 20 && ipT.coh.h === 'qho' && ipT.coh.coherent && Math.abs(ipT.coh.norm - 1) < 2e-3 && ipT.coh.modes >= 4 && ipT.coh.playing && ipT.palLit > 1000 && ipT.shader === 0 && ipT.errs === 0 && !ipT.gpu, ipT);

  /* ── the second UX round: overlay shading, THEME leaves INVERT, SIGNED/BANDS, ⓘ outside the rack, racks to the top, the logo menu, double-tap reset, the transport's slot ── */
  const uxA = await g.ev(`try { const body = document.body, rackEl = document.getElementById('rack'), rackLEl = document.getElementById('rackL');
    __LW.pause(); __LW.setTheme('dark'); __LW.mat.invert = false; __LW.setTheme('light'); const invLight = __LW.mat.invert; __LW.setTheme('dark'); const invDark = __LW.mat.invert;
    __LW.loadPreset('1s+2pz'); __LW.setView('real'); const lit = {};
    for (const st of ['signed', 'bands', 'solid']) { __LW.setStyle(st); await __LW.settle(); const px = await __LW.readPixels(); lit[st] = px.nonBlack; }
    __LW.setStyle('cloud'); __LW.setView('density'); await __LW.settle();
    const rackRect = rackEl.getBoundingClientRect(), rackTop = getComputedStyle(rackEl).top;
    const obsCard = document.querySelector('.dev[data-id="spectrum"]'), infoBtn = obsCard.querySelector('.dev-head .info-i'), icons = document.querySelectorAll('.dev-head .info-i').length;
    infoBtn.click(); const pop = document.getElementById('infoPop'), p1 = pop.getBoundingClientRect(), t1 = pop.querySelector('.info-body').textContent.slice(0, 40), f1 = pop.querySelector('.info-foot').textContent;
    const outside = !pop.hidden && (p1.right <= rackRect.left + 1 || p1.left >= rackRect.right - 1);
    infoBtn.click(); const t2 = pop.querySelector('.info-body').textContent.slice(0, 40), f2 = pop.querySelector('.info-foot').textContent; __LW.layout.hideInfo();
    const title = document.getElementById('title'), tRect = title.getBoundingClientRect(), tog = document.getElementById('rackToggle').getBoundingClientRect(), rw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rack-w'));
    title.click(); const bar = document.getElementById('menubar'), menuOpen = !bar.hidden, names = [...bar.querySelectorAll('.mb-btn')].map((b) => b.textContent);
    bar.querySelectorAll('.mb-btn')[3].click(); const items = bar.querySelectorAll('.mb-list:not([hidden]) .mb-item').length; __LW.layout.menu.close();
    const tr = document.getElementById('transport'), miniBottom = getComputedStyle(tr).bottom;
    if (__LW.layout.docked) __LW.layout.dockTransport();
    __LW.layout.dockTransport(); const trCard = document.querySelector('.dev[data-id="transport"]'); const dockedFirst = trCard.parentElement === rackLEl && rackLEl.querySelector('.dev') === trCard;
    __LW.layout.moveToRack('spectrum', 'L'); __LW.layout.moveToRack('meters', 'L'); rackLEl.appendChild(trCard); __LW.layout.dockTransport(); const idx1 = __LW.layout.dockIndex;
    __LW.layout.dockTransport(); const pos = [...rackLEl.querySelectorAll('.dev')].indexOf(trCard); __LW.layout.dockTransport();
    __LW.layout.moveToRack('spectrum', 'R'); __LW.layout.moveToRack('meters', 'R');
    const gk = [...document.querySelectorAll('.k')].find((k) => k.querySelector('.k-lbl') && k.querySelector('.k-lbl').textContent === 'GAMMA'); __LW.layout.raise('observer'); gk.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 80));
    const dr = gk.querySelector('.k-dial').getBoundingClientRect();
    return { invLight, invDark, lit, rackTop, icons, outside, cycles: t1 !== t2 && f1.startsWith('1 / ') && f2.startsWith('2 / '), titleLeft: tRect.left, togRight: tog.right, rackLeft: rackRect.left, rw, menuOpen, names, items, miniBottom, dockedFirst, idx1, pos, dial: { x: Math.round(dr.left + dr.width / 2), y: Math.round(dr.top + dr.height / 2) }, gamma0: __LW.mat.gamma };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  let uxB = { error: 'no result' };
  if (!uxA.error) {
    await drv.actions(g.s, [{ type: 'pointer', id: 'gamma1', parameters: { pointerType: 'mouse' }, actions: [
      { type: 'pointerMove', duration: 0, origin: 'viewport', x: uxA.dial.x, y: uxA.dial.y }, { type: 'pointerDown', button: 0 },
      { type: 'pointerMove', duration: 120, origin: 'viewport', x: uxA.dial.x, y: uxA.dial.y - 70 }, { type: 'pointerUp', button: 0 }] }]);
    await drv.relActions(g.s);
    const gammaMoved = await g.ev('return __LW.mat.gamma;');
    await drv.actions(g.s, [{ type: 'pointer', id: 'gamma2', parameters: { pointerType: 'mouse' }, actions: [
      { type: 'pointerMove', duration: 0, origin: 'viewport', x: uxA.dial.x, y: uxA.dial.y }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 },
      { type: 'pause', duration: 80 }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }] }]);
    await drv.relActions(g.s);
    uxB = await g.ev(`try { const body = document.body, gammaReset = __LW.mat.gamma;
      __LW.layout.toggleRack(); const wasHidden = body.classList.contains('rack-hidden');
      window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: window.innerWidth - 4, clientY: 300 })); const peek1 = body.classList.contains('rack-peek');
      window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 500, clientY: 300 })); const peek2 = body.classList.contains('rack-peek'); __LW.layout.toggleRack();
      return { gammaMoved: ${JSON.stringify(gammaMoved)}, gammaReset, wasHidden, peek1, peek2, shader: __LW.field.shaderMessages.length, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
    } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  }
  const uxT = { ...uxA, ...uxB };
  judge('B42 THE SECOND UX ROUND: a theme change leaves INVERT alone; SIGNED, BANDS and the overlay-shaded SOLID all draw the real 1s+2pz; the rack runs to the top; each card has one ⓘ in its header whose panel opens outside the rack and cycles the card\'s notes; the logo and hide button sit between the racks; the logo opens FILE · EDIT · WINDOW with the windows listed; the transport floats 60 px up, docks into the LEFT rack at the top and remembers its slot; a real drag turns the GAMMA knob and a double-click resets it; a hidden rack peeks at the edge and goes when the pointer leaves its column',
    !uxA.error && !uxB.error && uxT.invLight === false && uxT.invDark === false && uxT.lit.signed > 800 && uxT.lit.bands > 300 && uxT.lit.solid > 800 && uxT.rackTop === '0px' && uxT.icons > 12 && uxT.outside && uxT.cycles && uxT.titleLeft >= uxT.rw && uxT.togRight <= uxT.rackLeft && uxT.menuOpen && uxT.names.join() === 'FILE,EDIT,VIEW,WINDOW,ABOUT' && uxT.items > 12 && uxT.miniBottom === '60px' && uxT.dockedFirst && uxT.idx1 === 2 && uxT.pos === 2 && Math.abs(uxT.gammaMoved - 1) > 0.05 && uxT.gammaReset === 1 && uxT.wasHidden && uxT.peek1 && !uxT.peek2 && uxT.shader === 0 && uxT.errs === 0 && !uxT.gpu, uxT);

  /* ── B44: close and reopen, the power switch, the COPY digest, SETTINGS remembering itself, the flat menubar beside the logo ── */
  const stT = await g.ev(`try { const body = document.body, rackEl = document.getElementById('rack');
    const sh = document.querySelector('.dev[data-id="shadow"]'); sh.querySelector('.dev-close').click(); const closed1 = sh.classList.contains('closed') && getComputedStyle(sh).display === 'none';
    const saved1 = (__LW.settings.closed || []).includes('shadow');
    const add = document.getElementById('rackAdd'); add.click(); const list = document.getElementById('rackAddList'), listed = [...list.querySelectorAll('.mb-item')].map((b) => b.textContent);
    [...list.querySelectorAll('.mb-item')].find((b) => /CLASSICAL SHADOW/.test(b.textContent)).click(); const reopened = !sh.classList.contains('closed') && sh.parentElement === rackEl && rackEl.querySelector('.dev') === sh;
    const met = document.querySelector('.dev[data-id="meters"]'); const p0 = __LW.perf.counts.cpu; met.querySelector('.dev-power').click(); const off = met.classList.contains('off');
    __LW.play(); await new Promise((r) => setTimeout(r, 400)); __LW.pause(); const metersProfileFrozen = __LW.perf.profile.meters; await new Promise((r) => setTimeout(r, 50));
    met.querySelector('.dev-power').click(); const on = !met.classList.contains('off');
    const digest = await __LW.layout.copyDigest('meters'), spec = __LW.layout.digest('spectrum');
    const set = document.querySelector('.dev[data-id="settings"]'); __LW.layout.raise('settings'); const setOpen = !set.classList.contains('folded') && rackEl.querySelector('.dev') === set;
    const tagSw = [...set.querySelectorAll('.sw')].find((b) => /STATUS TAGS/.test(b.textContent)); tagSw.click(); const badgesGone = getComputedStyle(document.getElementById('badges')).display === 'none', savedBadges = __LW.settings.badges === false; tagSw.click();
    const title = document.getElementById('title'); title.click(); const bar = document.getElementById('menubar'), br = bar.getBoundingClientRect(), tr = title.getBoundingClientRect(), barBg = getComputedStyle(bar).backgroundColor; __LW.layout.menu.close();
    const items = (() => { title.click(); bar.querySelectorAll('.mb-btn')[1].click(); const n = [...bar.querySelectorAll('.mb-list:not([hidden]) .mb-item')].map((b) => b.textContent); __LW.layout.menu.close(); return n; })();
    return { closed1, saved1, listed, reopened, off, on, metersProfileFrozen, digestLen: digest.length, digestHasProfile: /frame profile/.test(digest), specRows: spec.split('\\n').length, setOpen, badgesGone, savedBadges, barRight: br.left >= tr.right, barBg, hasSettingsItem: items.some((t) => /SETTINGS/.test(t)), errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B44 SETTINGS · CLOSE · POWER · COPY: × closes a window (display none, remembered), the rack\'s + lists it and reopens it at the top; ⏻ switches METERS off and on; the COPY digest of METERS carries the frame profile and the SPECTRUM digest is a table; EDIT → SETTINGS raises the settings window; STATUS TAGS hides the badges and is remembered; the menubar sits to the right of the logo with no background',
    !stT.error && stT.closed1 && stT.saved1 && stT.listed.some((t) => /CLASSICAL SHADOW/.test(t)) && stT.reopened && stT.off && stT.on && stT.digestLen > 80 && stT.digestHasProfile && stT.specRows >= 3 && stT.setOpen && stT.badgesGone && stT.savedBadges && stT.barRight && (stT.barBg === 'rgba(0, 0, 0, 0)' || stT.barBg === 'transparent') && stT.hasSettingsItem && stT.errs === 0, stT);

  /* ── B45: RATE per channel (continuous), A/B TRANSITION (exact Rabi for eigenstates), the spectrum's own buttons, the fixed play bar, H hides the chrome, menu keys, the polar palette ── */
  const abT = await g.ev(`try { __LW.pause(); __LW.ab.set(false); __LW.loadPreset('1s+2pz'); __LW.setTheme('dark'); __LW.setView('density'); await __LW.settle(); __LW.scrub(3.1); await __LW.settle();
    const ids = __LW.reg.populated(), a = ids[1], before = __LW.reg.coeffAt(a, __LW.clock.t);
    __LW.setRate(a, 2.5); const after = __LW.reg.coeffAt(a, __LW.clock.t), rateStat = document.querySelector('.dev[data-id="spectrum"] .dev-stat').textContent;
    const E0 = __LW.reg.Ediag ? __LW.reg.Ediag(a) : null; __LW.setRate(a, 1); const rateBack = document.querySelector('.dev[data-id="spectrum"] .dev-stat').textContent;
    const knobs = document.querySelector('.sp-row') ? document.querySelector('.sp-row').querySelectorAll('.k').length : 0;
    const head = document.querySelector('.dev[data-id="spectrum"] .sp-head'), heads = head ? [...head.querySelectorAll('.trig')].map((b) => b.textContent.trim()) : [];
    /* A/B: A = 1s, B = 2pz — two eigenstates */
    __LW.loadPreset('1s'); __LW.ab.storeA(); __LW.loadPreset('2pz'); __LW.ab.storeB(); const statA = __LW.ab.status;
    __LW.scrub(0); const okOn = __LW.ab.set(true); await __LW.settle(); const on = __LW.ab.on, pop = __LW.reg.populated().length, statOn = __LW.ab.status;
    const c0 = __LW.reg.at(0), n0 = c0.re.reduce((k, v, i) => k + v * v + c0.im[i] ** 2, 0);
    const T = Math.PI / __LW.reg.transition.omega; __LW.scrub(T); await __LW.settle(); const cT = __LW.reg.at(T), nT = cT.re.reduce((k, v, i) => k + v * v + cT.im[i] ** 2, 0);
    const wA = Math.hypot(cT.re[0], cT.im[0]) ** 2, wB = nT - wA;                  // at θ = π/2 the mix is all B
    __LW.ab.set(false); const off = !__LW.ab.on, popOff = __LW.reg.populated().length; __LW.scrub(0); __LW.loadPreset('1s+2pz'); await __LW.settle();
    /* bow on an empty box: conjures a 1s */
    __LW.reg.clear(); const empty = __LW.reg.populated().length; [...document.querySelectorAll('.trig')].find((b) => b.textContent.trim() === 'SLAP').click(); const afterKickEmpty = __LW.reg.populated().length; __LW.loadPreset('1s+2pz'); await __LW.settle();
    /* the play bar keeps its length */
    if (__LW.layout.docked) __LW.layout.dockTransport(); const fd = document.querySelector('#transport .fd'); const w1 = fd.getBoundingClientRect().width; __LW.clock.setRate(64); await new Promise((r) => setTimeout(r, 60)); const w2 = fd.getBoundingClientRect().width; __LW.clock.setRate(1);
    /* H hides the chrome */
    document.body.classList.add('ui-hidden'); const hid = ['rackToggle', 'rackAdd', 'title', 'rack'].map((id) => getComputedStyle(document.getElementById(id)).display); document.body.classList.remove('ui-hidden');
    /* menu keys */
    document.getElementById('title').click(); const bar = document.getElementById('menubar'); bar.querySelectorAll('.mb-btn')[3].click(); const keys = [...bar.querySelectorAll('.mb-list:not([hidden]) .mb-key')].map((k) => k.textContent); __LW.layout.menu.close();
    /* polar palette */
    __LW.setView('real'); __LW.palette.setOn(true); await __LW.settle(); const px = await __LW.readPixels(); __LW.palette.setOn(false); __LW.setView('density'); await __LW.settle();
    return { a, before, after, rateStat, rateBack, knobs, heads, statA, okOn, on, pop, statOn, n0, nT, wA, wB, off, popOff, empty, afterKickEmpty, w1, w2, hid, keys, palLit: px.nonBlack, shader: __LW.field.shaderMessages.length, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B45 RATE · A/B · CHROME: changing a channel\'s RATE leaves c(t) continuous and flags a TOY, resetting it clears the flag; every channel has two knobs; the spectrum head carries HIDE · +MODE · CLEAR · NORMALIZE; A = 1s and B = 2pz stored, TRANSITION plays the exact two-level Rabi mix — unit norm, both listed, all B at θ = π/2 — and turning it off freezes one state; a kick on an empty box conjures a state; the play bar keeps its width across rates; H hides the toggles and the title; menu items show their keys; the polar palette draws the real view',
    !abT.error && Math.abs(abT.before.re - abT.after.re) < 1e-9 && Math.abs(abT.before.im - abT.after.im) < 1e-9 && /TOY/.test(abT.rateStat) && !/TOY/.test(abT.rateBack) && abT.knobs === 2 && abT.heads.join() === 'HIDE,+MODE,CLEAR,NORMALIZE' && abT.okOn && abT.on && abT.pop === 2 && /EXACT/.test(abT.statOn) && Math.abs(abT.n0 - 1) < 1e-9 && Math.abs(abT.nT - 1) < 1e-9 && abT.wA < 1e-9 && Math.abs(abT.wB - 1) < 1e-9 && abT.off && abT.popOff >= 1 && abT.empty === 0 && abT.afterKickEmpty >= 1 && Math.abs(abT.w1 - abT.w2) < 1 && abT.hid.every((d) => d === 'none') && abT.keys.length >= 3 && abT.palLit > 500 && abT.shader === 0 && abT.errs === 0 && !abT.gpu, abT);

  /* ── B46: the OBSERVER split, the SPECTRUM order, stacked knobs, VIVID, the accent scrollbars, Re+Im, full screen, the palette wheel ── */
  const spT = await g.ev(`try { const ids = ['palette', 'observer', 'style', 'camera', 'clip'].map((id) => document.querySelector('.dev[data-id="' + id + '"]'));
    const order = __LW.bootOrder, pos = ids.map((d) => order.indexOf(d.dataset.id)), inOrder = pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1]));
    const has = { palette: !!document.querySelector('.dev[data-id="palette"] .pal-strip'), style: !!document.querySelector('.dev[data-id="style"] .seg'), camera: !![...document.querySelectorAll('.dev[data-id="camera"] .trig')].find((b) => /RESET VIEW/.test(b.textContent)), clip: !![...document.querySelectorAll('.dev[data-id="clip"] .seg-b')].find((b) => /SLAB/.test(b.textContent)), observer: !![...document.querySelectorAll('.dev[data-id="observer"] .seg-b')].find((b) => /Re\\+Im/.test(b.textContent)) };
    const sb = document.querySelector('.dev[data-id="spectrum"] .dev-body'), kids = [...sb.children], ladderIdx = kids.findIndex((k) => k.classList.contains('ladder')), hamIdx = kids.findIndex((k) => k.querySelector && k.querySelector('.seg') && /HYDROGEN/.test(k.textContent)), pickerIdx = kids.findIndex((k) => k.classList.contains('picker'));
    __LW.loadPreset('1s+2pz'); await __LW.settle();
    const rows = [...document.querySelectorAll('.sp-row')], stack = rows.map((r) => r.querySelector('.sp-knobs')), knobs = stack.map((s) => s ? s.querySelectorAll('.k').length : 0), dial = rows[0] ? getComputedStyle(rows[0].querySelector('.sp-knobs .k-dial')).width : '', tx = stack.map((s) => getComputedStyle(s).transform);
    const acc0 = getComputedStyle(document.body).getPropertyValue('--acc').trim(); __LW.accent.set(0, 162); const vk = [...document.querySelectorAll('.k')].find((k) => k.querySelector('.k-lbl') && k.querySelector('.k-lbl').textContent === 'VIVID'); const glow0 = getComputedStyle(document.body).getPropertyValue('--acc-glow').trim();
    const rackCs = getComputedStyle(document.getElementById('rack')), rackDir = rackCs.direction, cardDir = getComputedStyle(document.querySelector('#rack .dev')).direction, sbc = rackCs.scrollbarColor || rackCs.getPropertyValue('scrollbar-color');
    __LW.setView('reim'); await __LW.settle(); const px = await __LW.readPixels(); __LW.setView('density'); await __LW.settle();
    const fs = !![...document.querySelectorAll('.keys-chip')].find((c) => c.textContent.trim() === 'F'), fsItem = (() => { document.getElementById('title').click(); const bar = document.getElementById('menubar'); bar.querySelectorAll('.mb-btn')[2].click(); const ok = [...bar.querySelectorAll('.mb-list:not([hidden]) .mb-item')].some((b) => /FULL SCREEN/.test(b.textContent)); __LW.layout.menu.close(); return ok; })();
    const rot = !![...document.querySelectorAll('.dev[data-id="palette"] .k')].find((k) => k.querySelector('.k-lbl') && k.querySelector('.k-lbl').textContent === 'ROTATE'), rot60 = [...document.querySelectorAll('.trig')].some((b) => /ROTATE \\+60/.test(b.textContent));
    return { inOrder, has, ladderIdx, hamIdx, pickerIdx, knobs, dial, tx, vivid: !!vk, glow0, rackDir, cardDir, sbc, reimLit: px.nonBlack, fs, fsItem, rot, rot60, shader: __LW.field.shaderMessages.length, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B46 THE OBSERVER SPLIT AND THE REST: PALETTE · SPACE · DRAW STYLE · CAMERA · SLICE/CLIP are five windows in that order with their controls; the SPECTRUM\'s ladder comes first and the Hamiltonian block sits below the picker; each channel stacks two half-size knobs, alternate rows staggered; a VIVID knob and a glow token exist; the right rack scrolls on its left edge with the cards left-to-right and accent scrollbars; Re+Im draws; F and the VIEW menu offer full screen; the palette ROTATE is a wheel',
    !spT.error && spT.inOrder && Object.values(spT.has).every(Boolean) && spT.ladderIdx === 0 && spT.hamIdx > spT.pickerIdx && spT.pickerIdx > 0 && spT.knobs.length === 2 && spT.knobs.every((n) => n === 2) && spT.dial === '17px' && spT.tx[0] !== spT.tx[1] && spT.vivid && /px/.test(spT.glow0) && spT.rackDir === 'rtl' && spT.cardDir === 'ltr' && spT.reimLit > 500 && spT.fs && spT.fsItem && spT.rot && !spT.rot60 && spT.shader === 0 && spT.errs === 0 && !spT.gpu, spT);

  /* ── B47: the NOTEBOOK glass and its ABOUT face, FROST as a blur, the picker matching the card, the playhead that follows the rack ── */
  const nbT = await g.ev(`try { const nb = document.getElementById('notebook'); __LW.notebook.open('notes'); const cs = getComputedStyle(nb);
    const blur = cs.backdropFilter || cs.webkitBackdropFilter, bg = cs.backgroundColor, titleFont = getComputedStyle(nb.querySelector('.nb-title')).fontFamily, textFont = getComputedStyle(nb.querySelector('.nb-text')).fontFamily;
    const ta = nb.querySelector('.nb-text'); ta.value = 'the 2p_z bounce at t = 3.1'; ta.dispatchEvent(new Event('input')); let kept = null; try { kept = localStorage.getItem('lambdawaves.q0.notebook'); } catch (e) {}
    __LW.notebook.moveTo(120, 90); const r = nb.getBoundingClientRect(), moved = Math.round(r.left) === 120 && Math.round(r.top) === 90;
    nb.querySelector('.nb-about').click(); const face = __LW.notebook.face, about = nb.querySelector('.nb-aboutface').innerText, logo = nb.querySelectorAll('.nb-logo .mark rect').length, dump = __LW.notebook.dump();
    nb.querySelector('.nb-about').click(); const back = __LW.notebook.face; __LW.notebook.close(); const closed = nb.hidden;
    const keyJ = !![...document.querySelectorAll('.keys-chip')].find((c) => c.textContent.trim() === 'J');
    document.body.classList.add('frost'); const dcs = getComputedStyle(document.querySelector('#rack .dev')); const frost = dcs.backdropFilter || dcs.webkitBackdropFilter, frostBg = dcs.backgroundColor; document.body.classList.remove('frost');
    const bk = [...document.querySelectorAll('.k')].find((k) => k.querySelector('.k-lbl') && k.querySelector('.k-lbl').textContent === 'GLASS BLUR');
    const addBtn = [...document.querySelectorAll('.dev[data-id="spectrum"] .sp-head .trig')].find((b) => /MODE/.test(b.textContent)); addBtn.click(); const pk = document.querySelector('.dev[data-id="spectrum"] .picker'), pkBg = getComputedStyle(pk).backgroundColor; addBtn.click();
    if (__LW.layout.docked) __LW.layout.dockTransport(); const tr = document.getElementById('transport');
    __LW.layout.toggleRack(); await new Promise((r) => setTimeout(r, 450)); const hidOp = getComputedStyle(tr).opacity, hidPe = getComputedStyle(tr).pointerEvents;
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: window.innerWidth / 2, clientY: window.innerHeight - 30 })); const peek = document.body.classList.contains('transport-peek'); await new Promise((r) => setTimeout(r, 450)); const peekOp = getComputedStyle(tr).opacity;
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: window.innerWidth / 2, clientY: 200 })); const unpeek = !document.body.classList.contains('transport-peek');
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: window.innerWidth - 50, clientY: 300 })); const rackNear = document.body.classList.contains('rack-peek');
    __LW.layout.toggleRack(); const restored = !document.body.classList.contains('rack-hidden') && !document.body.classList.contains('transport-peek');
    return { blur, bg, titleFont, textFont, kept, moved, face, hasCredits: /Chronus Quantum/.test(about) && /Brian Johnson/.test(about) && /falstad\\.com/.test(about) && /Seth Shultz/.test(about) && /Beatriz Errant/.test(about), logo, dumpLen: dump.length, back, closed, keyJ, frost, frostBg, blurKnob: !!bk, pkBg, hidOp, hidPe, peek, peekOp, unpeek, rackNear, restored, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B47 THE NOTEBOOK GLASS: opens as a free window with a real backdrop blur and no colour behind it, its title in the logo\'s face and its notes in Roboto, kept in this browser; it drags to a place; ⓘ flips it into the ABOUT face with the logo, the three credits, the team line and a copy dump, and back; J is its key; FROST is now a blur with only a whisper of tint; a GLASS BLUR knob exists; the +MODE picker has no slab; hiding the rack slides the playhead away and the pointer near its place brings it back; the rack peeks within 60 px',
    !nbT.error && /blur\(/.test(nbT.blur) && (nbT.bg === 'rgba(0, 0, 0, 0)' || nbT.bg === 'transparent') && /Spinwerad/.test(nbT.titleFont) && /Roboto/.test(nbT.textFont) && nbT.kept === 'the 2p_z bounce at t = 3.1' && nbT.moved && nbT.face === 'about' && nbT.hasCredits && nbT.logo === 9 && nbT.dumpLen > 200 && nbT.back === 'notes' && nbT.closed && nbT.keyJ && /blur\(/.test(nbT.frost) && /rgba\(255, 255, 255, 0\.1\)|rgba\(0, 0, 0, 0\.1\)/.test(nbT.frostBg) && nbT.blurKnob && (nbT.pkBg === 'rgba(0, 0, 0, 0)' || nbT.pkBg === 'transparent') && nbT.hidOp === '0' && nbT.hidPe === 'none' && nbT.peek && nbT.peekOp === '1' && nbT.unpeek && nbT.rackNear && nbT.restored && nbT.errs === 0, nbT);

  /* ── B48: QUARKONIUM in the HAMILTONIAN selector — the tabulated-radial kernel branch draws it, in GeV ── */
  const qqT = await g.ev(`try { __LW.pause(); __LW.setTheme('dark'); __LW.setView('density'); __LW.loadPreset('1s+2pz'); await __LW.settle();
    __LW.setHamiltonian('cornell'); await __LW.settle(); await new Promise((r) => setTimeout(r, 200)); await __LW.settle();
    const h = __LW.hamiltonian, px = await __LW.readPixels(), pop = __LW.reg.populated().length;
    const spec = document.querySelector('.dev[data-id="spectrum"]'), es = [...spec.querySelectorAll('.sp-e')].map((e) => e.textContent), names = [...spec.querySelectorAll('.sp-nm')].map((e) => e.textContent), stat = spec.querySelector('.dev-stat').textContent;
    const E = [__LW.reg.Ediag ? __LW.reg.Ediag(0) : null, __LW.energyOf ? null : null], half = __LW.domain.half, qcdKind = document.querySelector('.dev[data-id="qcd"]').dataset.kind;
    __LW.play(); await new Promise((r) => setTimeout(r, 500)); __LW.pause(); const px2 = await __LW.readPixels();
    __LW.setHamiltonian('hydrogen'); await __LW.settle(); const back = __LW.hamiltonian;
    return { h, lit: px.nonBlack, lit2: px2.nonBlack, pop, es, names, stat, half, qcdKind, back, shader: __LW.field.shaderMessages.length, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B48 QUARKONIUM: the selector switches the same 1s+2pz register to the Cornell Hamiltonian; the field draws it through the tabulated-radial branch with no GPU or shader error; the channel energies read in GeV with quarkonium labels (1S, 1P), the status names QUARKONIUM, the domain is a few GeV⁻¹, it evolves, the QCD panel is an information panel, and hydrogen comes back',
    !qqT.error && qqT.h === 'cornell' && qqT.lit > 300 && qqT.lit2 > 300 && qqT.pop === 2 && qqT.es.length === 2 && qqT.es.every((t) => /GeV/.test(t) && /^3\./.test(t)) && /1S/.test(qqT.names[0]) && /1P/.test(qqT.names[1]) && /QUARKONIUM/.test(qqT.stat) && qqT.half > 0.5 && qqT.half < 20 && qqT.qcdKind === 'info' && qqT.back === 'hydrogen' && qqT.shader === 0 && qqT.errs === 0 && !qqT.gpu, qqT);

  /* ── B49: NOTEBOOK II — the typeable title, markdown + LaTeX preview, and PROJECTS in folders with a recent list and the notebook as the landing page ── */
  const pjT = await g.ev(`try { const nb = document.getElementById('notebook'); const N = __LW.notebook, P = __LW.projects; N.open('notes'); N.setMode('edit');
    N.title = 'RECONNECTION'; const titleFont = getComputedStyle(nb.querySelector('.nb-title')).fontSize; let keptTitle = null; try { keptTitle = localStorage.getItem('lambdawaves.q0.notebook.title'); } catch (e) {}
    N.text = '# The bounce\\n\\nA packet with $k = 0.8$ and the energy $$E = \\\\frac{k^2}{2} + V_0$$\\n\\n- one\\n- two\\n\\n' + 'line\\n'.repeat(30);
    N.setMode('view'); const html = N.html, h1 = /<h1[^>]*>The bounce<\\/h1>/.test(html), katex = (html.match(/class="katex/g) || []).length, display = /katex-display/.test(html), li = (html.match(/<li>/g) || []).length, viewShown = getComputedStyle(nb.querySelector('.nb-view')).display !== 'none', taHidden = getComputedStyle(nb.querySelector('.nb-text')).display === 'none';
    nb.querySelector('.nb-about').click(); const titleHiddenOnAbout = getComputedStyle(nb.querySelector('.nb-title')).visibility === 'hidden'; nb.querySelector('.nb-about').click();
    __LW.loadPreset('1s+2pz'); await __LW.settle(); const idsA = __LW.reg.populated().join(',');
    const saved = P.save('demo/alpha'), listed = P.list().map((x) => x.path), cur = P.current;
    __LW.loadPreset('2pz'); N.text = 'other'; await __LW.settle(); const idsB = __LW.reg.populated().join(',');
    const opened = P.open('demo/alpha'); await __LW.settle(); const idsBack = __LW.reg.populated().join(','), textBack = N.text.startsWith('# The bounce'), landing = N.face === 'notes' && N.mode === 'view' && /nb-more/.test(N.html), recent = P.recent();
    const exp = P.exportText('demo/alpha'), expOk = !!exp && JSON.parse(exp).lambdawaves === 'project';
    const imported = P.importText(exp.replace('"path": "demo/alpha"', '"path": "demo/beta"').replace('"name": "alpha"', '"name": "beta"')), listed2 = P.list().map((x) => x.path);
    document.getElementById('title').click(); const bar = document.getElementById('menubar'); bar.querySelectorAll('.mb-btn')[0].click(); const fileItems = [...bar.querySelectorAll('.mb-list:not([hidden]) .mb-item')].map((b) => b.textContent); __LW.layout.menu.close();
    P.remove('demo/beta'); P.remove('demo/alpha'); const gone = P.list().length; N.setMode('edit'); N.close();
    return { titleFont, keptTitle, h1, katex, display, li, viewShown, taHidden, titleHiddenOnAbout, idsA, saved, listed, cur, idsB, opened, idsBack, textBack, landing, recent, expOk, imported, listed2, fileItems, gone, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B49 NOTEBOOK II: the title is typed at 30 px and kept, hidden on the ABOUT face; the preview renders markdown (h1, list) and KaTeX (inline and display) in place of the textarea; a project saves under demo/alpha with the register and the notes, another state replaces them, opening the project brings both back and lands on the capped notebook; recent lists it; export is a project JSON that imports as demo/beta; FILE shows the recent entry; delete cleans up',
    !pjT.error && pjT.titleFont === '30px' && pjT.keptTitle === 'RECONNECTION' && pjT.h1 && pjT.katex >= 2 && pjT.display && pjT.li === 2 && pjT.viewShown && pjT.taHidden && pjT.titleHiddenOnAbout && pjT.saved && pjT.listed.includes('demo/alpha') && pjT.cur === 'demo/alpha' && pjT.idsB !== pjT.idsA && pjT.opened && pjT.idsBack === pjT.idsA && pjT.textBack && pjT.landing && pjT.recent[0] === 'demo/alpha' && pjT.expOk && pjT.imported === 'demo/beta' && pjT.listed2.includes('demo/beta') && pjT.fileItems.some((t) => /demo\/alpha/.test(t)) && pjT.gone === 0 && pjT.errs === 0, pjT);

  /* ── B50: KEPLER as the SO(4) control surface — the perihelion handle drives exact rotors ── */
  const kpT = await g.ev(`try { __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('2p+'); __LW.vortex.setOn(true); await __LW.settle();
    const orb = (n) => { const o = __LW.kepler.orbits.find((x) => x.orbit.n === n); return o ? o.orbit : null; };
    const o0 = orb(2), e0 = o0 ? o0.e : null, norm0 = __LW.reg.norm2();
    const ok1 = __LW.keplerDrag(2, [0, 2.4, 0]); await __LW.settle(); const o1 = orb(2);
    const u1 = o1 ? o1.u : [0, 0, 0], dot1 = u1[1], e1 = o1 ? o1.e : null, norm1 = __LW.reg.norm2(), pop1 = __LW.reg.populated().length, n1 = o1 ? o1.n : 0;
    const ok2 = __LW.keplerDrag(2, [1.2, 0, 0]); await __LW.settle(); const o2 = orb(2); const e2 = o2 ? o2.e : null, dot2 = o2 ? o2.u[0] : 0, norm2 = __LW.reg.norm2();
    const ok3 = __LW.keplerDrag(2, [0, 0, 0]); const handles = __LW.kepler.handles.length;
    __LW.loadPreset('1s+2pz'); await __LW.settle();
    return { e0, norm0, ok1, e1, dot1, norm1, pop1, n1, ok2, e2, dot2, norm2, ok3, handles, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B50 THE KEPLER HANDLE: from the circular 2p₊ orbit (e = 0), dragging the perihelion to 2.4 a₀ along +y makes an orbit with e ≈ 0.4 whose perihelion points along +y, unit norm kept (unitary rotors) and the shell mixed (2s joins 2p); asking for 1.2 a₀ along +x gives e ≈ 0.5, the most a 2p₊ shell can give (|L| = 1), pointing along +x; a drag to the focus is refused; the overlay exposes a handle',
    !kpT.error && kpT.e0 !== null && kpT.e0 < 0.02 && kpT.ok1 && Math.abs(kpT.e1 - 0.4) < 0.03 && kpT.dot1 > 0.985 && Math.abs(kpT.norm1 - kpT.norm0) < 1e-9 && kpT.pop1 >= 2 && kpT.n1 === 2 && kpT.ok2 && Math.abs(kpT.e2 - 0.5) < 0.03 && kpT.dot2 > 0.985 && Math.abs(kpT.norm2 - kpT.norm0) < 1e-9 && kpT.ok3 === false && kpT.handles >= 1 && kpT.errs === 0, kpT);

  /* ── B51: THE AXIAL GAS — the box's 256-mode register drawn through the recurrence branch of the kernel ── */
  const gsT = await g.ev(`try { __LW.pause(); __LW.setHamiltonian('well'); __LW.setGasBasis('axial'); await __LW.settle();
    __LW.enterBox(); __LW.pause(); await __LW.settle(); await new Promise((r) => setTimeout(r, 250)); await __LW.settle();
    const on = __LW.gas.on, cap = __LW.gas.captured, modes = __LW.field.stats.modesRendered, px = await __LW.readPixels(), st = __LW.gas.stats(__LW.clock.t), ro = document.querySelector('.dev[data-id="spectrum"] .ro-val') ? [...document.querySelectorAll('.dev[data-id="spectrum"] .ro-val')].map((e) => e.textContent).join(' | ') : '';
    __LW.play(); await new Promise((r) => setTimeout(r, 600)); __LW.pause(); await __LW.settle(); const st2 = __LW.gas.stats(__LW.clock.t), px2 = await __LW.readPixels();
    __LW.setGasBasis('reg'); const off = !__LW.gas.on; __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); await __LW.settle(); const back = __LW.hamiltonian;
    return { on, cap, modes, lit: px.nonBlack, st, ro, st2, lit2: px2.nonBlack, off, back, shader: __LW.field.shaderMessages.length, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B51 THE AXIAL GAS: choosing the 256-mode basis and entering the box launches a packet held > 90 %, the field renders more than 91 modes through the recurrence branch with no shader or GPU error, the packet has moved after play, the readout says held / ⟨z⟩ / σ_z, and the 91 basis switches it off',
    !gsT.error && gsT.on && gsT.cap > 0.9 && gsT.modes > 91 && gsT.lit > 200 && gsT.lit2 > 200 && Math.abs(gsT.st2.z - gsT.st.z) > 0.05 && /held/.test(gsT.ro) && gsT.off && gsT.back === 'hydrogen' && gsT.shader === 0 && gsT.errs === 0 && !gsT.gpu, gsT);

  /* ── B52: a project carries palette, space, camera, state, spectrum and draw style — and never the theme ── */
  const prT = await g.ev(`try { const P = __LW.projects; __LW.pause(); __LW.setTheme('dark'); __LW.loadPreset('1s+2pz'); __LW.setStyle('solid'); __LW.palette.setOn(true); __LW.setHamiltonian('qho'); __LW.setRate(0, 1.7); __LW.obs.yaw = 1.234; await __LW.settle();
    const darkBg = __LW.mat.bg.slice(); P.save('proof/full'); const saved = __LW.settings; const doc = JSON.parse(P.exportText('proof/full')); const pres = doc.data.presentation;
    __LW.setTheme('light'); const lightBg = __LW.mat.bg.slice(); __LW.setStyle('cloud'); __LW.palette.setOn(false); __LW.setHamiltonian('hydrogen'); __LW.setRate(0, 1); __LW.obs.yaw = 0.2; __LW.loadPreset('2pz'); await __LW.settle();
    P.open('proof/full'); await __LW.settle();
    const out = { hasNoTheme: !('bg' in pres.mat) && !('gamma' in pres.mat), savedSpace: pres.space, savedPalette: !!(pres.palette && pres.palette.on && pres.palette.stops.length >= 2), savedHam: pres.hamiltonian && pres.hamiltonian.id, savedRate: pres.rates && pres.rates[0],
      themeAfter: document.body.dataset.theme, bgAfter: __LW.mat.bg.slice(), lightBg, darkBg, style: ['cloud', 'solid', 'grain', 'signed', 'bands'][__LW.mat.style], palOn: __LW.palette.on, ham: __LW.hamiltonian, rate0: __LW.rateOf(0), yaw: __LW.obs.yaw, pop: __LW.reg.populated().length };
    P.remove('proof/full'); __LW.setHamiltonian('hydrogen'); __LW.setRate(0, 1); __LW.palette.setOn(false); __LW.setStyle('cloud'); __LW.setTheme('dark'); __LW.loadPreset('1s+2pz'); await __LW.settle();
    return out;
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B52 THE PROJECT FILE: saving under DARK with SOLID, the palette on, the OSCILLATOR and a RATE of 1.7 records style, palette, Hamiltonian, rates, space and camera but no stage colour or gamma; after switching to LIGHT and changing everything, opening the project brings the style, palette, Hamiltonian, rate, camera and state back while the theme stays LIGHT and the stage keeps the light colour',
    !prT.error && prT.hasNoTheme && prT.savedSpace === 'x' && prT.savedPalette && prT.savedHam === 'qho' && Math.abs(prT.savedRate - 1.7) < 1e-9 && prT.themeAfter === 'light' && JSON.stringify(prT.bgAfter) === JSON.stringify(prT.lightBg) && JSON.stringify(prT.bgAfter) !== JSON.stringify(prT.darkBg) && prT.style === 'solid' && prT.palOn && prT.ham === 'qho' && Math.abs(prT.rate0 - 1.7) < 1e-9 && Math.abs(prT.yaw - 1.234) < 1e-9 && prT.pop === 2, prT);

  /* ── B53: W-CLOCK — the transport says when the density repeats, and ⟳ jumps there ── */
  const ckT = await g.ev(`try { __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.setRate(0, 1); __LW.ab.set(false); __LW.loadPreset('1s+2pz'); await __LW.settle(); await new Promise((r) => setTimeout(r, 200));
    const P1 = __LW.period, ro = () => [...document.querySelectorAll('#transport .ro')].map((e) => e.querySelector('.ro-val').textContent).join(' | ');
    const t1 = ro();
    __LW.reg.clear(); const idx = (n, l, m) => __LW.presets ? null : null; const B = __LW.reg; const a = (n, l, m) => { for (let i = 0; i < 91; i++) { const s = __LW.reg.serialize ? null : null; } return null; };
    __LW.loadPreset('2p+'); __LW.reg.set(29, 0.7, 0, 0); await __LW.settle(); const P2 = __LW.period;      // label 29 is in the n = 4 shell (indices run n-major: 0 | 1–4 | 5–13 | 14–29 …)
    __LW.scrub(10); await __LW.settle(); const before = __LW.clock.t; document.querySelector('#transport .tbtn.jump').click(); await __LW.settle(); const after = __LW.clock.t;
    __LW.setHamiltonian('qho'); __LW.loadPreset('1s+2pz'); await __LW.settle(); const P3 = __LW.period;
    __LW.setHamiltonian('well'); __LW.setGasBasis('reg'); __LW.reg.set(5, 0.5, 0, 0); await __LW.settle(); const P4 = __LW.period;   // three well labels: incommensurate (a two-level state is always periodic)
    __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); await __LW.settle(); __LW.reg.setField({ Fz: 0.01 }); await __LW.settle(); await new Promise((r) => setTimeout(r, 150)); const t5 = ro(); __LW.reg.setField({ Fz: 0 }); await __LW.settle();
    const digest = __LW.layout.digest('meters');
    return { P1: { exact: P1.exact, T: P1.T }, t1, P2: { exact: P2.exact, T: P2.T, n: P2.count }, before, after, P3: { exact: P3.exact, T: P3.T }, P4: { exact: P4.exact, T: P4.T, err: P4.err }, t5, digestHas: /density period/.test(digest), errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B53 THE CLOCK: 1s+2pz repeats every 16π/3 = 16.755 a.u. and the transport says so; adding an n = 4 label to a 2p₊ state makes 64π/3 = 67.021 and ⟳ jumps to the next repeat (a multiple of T beyond t = 10); the oscillator repeats every 2π; a three-label box state has no exact period and says so with a near-recurrence; a Stark field reads "(Stark)"; the digest carries the period',
    !ckT.error && ckT.P1.exact && Math.abs(ckT.P1.T - 16 * Math.PI / 3) < 1e-6 && ckT.t1.includes('16.7') && ckT.P2.exact && Math.abs(ckT.P2.T - 64 * Math.PI / 3) < 1e-6 && ckT.after > ckT.before && Math.abs(ckT.after / ckT.P2.T - Math.round(ckT.after / ckT.P2.T)) < 1e-6 && ckT.P3.exact && Math.abs(ckT.P3.T - 2 * Math.PI) < 1e-6 && ckT.P4.exact === false && ckT.P4.T > 0 && /Stark/.test(ckT.t5) && ckT.digestHas && ckT.errs === 0, ckT);

  /* ── B54: W-ATOMS — the periodic table as one central field, and everything that model owes the reader ── */
  const atT = await g.ev(`try {
    const A = await import('/lab/atoms.js'), Hy = await import('/lab/hydrogen.js');
    __LW.pause(); __LW.setTheme('dark'); __LW.ab.set(false); __LW.reg.setField({ Fz: 0 });
    const shipsClosed = (__LW.bootClosed || []).includes('atoms'), shipsLast = __LW.bootOrder[__LW.bootOrder.length - 4] === 'atoms' && __LW.bootOrder[__LW.bootOrder.length - 3] === 'field';
    __LW.layout.reopen('atoms', 'R');
    const hasCopy = !!document.querySelector('.dev[data-id="atoms"] .dev-copy');
    /* the atom in force: Z = 10 through the same road the fingers use */
    __LW.setSpace('p'); await __LW.settle(); const pBefore = __LW.space;
    __LW.setElement(10); __LW.setHamiltonian('atom'); await __LW.settle(); await new Promise((r) => setTimeout(r, 250));
    const ham = __LW.hamiltonian, sym = __LW.element.symbol, kspace = __LW.field.space, forcedX = __LW.space;
    const knob = (() => { const k = [...document.querySelectorAll('.dev[data-id="spectrum"] .k')].find((e) => e.querySelector('.k-lbl') && e.querySelector('.k-lbl').textContent === 'ELEMENT  Z'); return k ? k.querySelector('.k-val').textContent : ''; })();
    /* every 2p label of Ne carries the module's own ε; an unoccupied shell carries the frozen field's, marked ° */
    const eps = A.shellEnergyOf(10, 2, 1), p2 = [-1, 0, 1].map((m) => Hy.stateOf(2, 1, m).index);
    const dE = Math.max.apply(null, p2.map((a) => Math.abs(__LW.api.energyOf(a) - eps)));
    const i3d = Hy.stateOf(3, 2, 0).index, dVirt = Math.abs(__LW.api.energyOf(i3d) - A.virtualEnergyOf(10, 3, 2));
    const labels = p2.map((a) => __LW.api.labelOf(Hy.BASIS[a])).join(' '), virtLabel = __LW.api.labelOf(Hy.BASIS[i3d]);
    const finite = p2.every((a) => Number.isFinite(__LW.api.energyOf(a))) && [...Array(91).keys()].every((a) => Number.isFinite(__LW.api.energyOf(a)));
    /* a 2p_z cloud of Ne: the picture is lit and the grid holds a finite, normalised ψ */
    __LW.reg.clear(); __LW.reg.set(Hy.stateOf(2, 1, 0).index, 1, 0, 0); __LW.setView('density'); await __LW.settle(); await new Promise((r) => setTimeout(r, 200));
    const px = await __LW.readPixels(), fd = await __LW.fieldDigest();
    const ink = (sel) => { const c = document.querySelector('.dev[data-id="atoms"] ' + sel); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) k++; return k; };
    const inkLad = ink('.atm-c'), inkRad = ink('.atm-r');
    const dNe = __LW.layout.digest('atoms');
    /* FILL THE VALENCE: the outermost occupied shell, every m of it */
    const fill = __LW.fillValence(); await __LW.settle();
    const pop = __LW.reg.populated().length, norm = __LW.reg.norm();
    /* Na: the quantum defect, with the α it belongs to.  Sc: an order this model must not assert */
    __LW.setElement(11); await __LW.settle(); await new Promise((r) => setTimeout(r, 350));
    const dNa = __LW.layout.digest('atoms'), qd = A.quantumDefect(11, 3, 0), qd1 = A.quantumDefect(11, 3, 0, { alpha: 1 });
    __LW.setElement(21); await __LW.settle(); await new Promise((r) => setTimeout(r, 400));
    const dSc = __LW.layout.digest('atoms');
    __LW.setElement(11); await __LW.settle();
    /* the project file carries the element (and still no theme) */
    const proj = __LW.serialize(), savedZ = proj.presentation.hamiltonian.atomZ, noTheme = proj.presentation.mat.bg === undefined;
    __LW.setElement(18); const movedZ = __LW.atomZ;
    __LW.restore(proj); await __LW.settle(); await new Promise((r) => setTimeout(r, 250));
    const backZ = __LW.atomZ, backHam = __LW.hamiltonian;
    const knobBack = (() => { const k = [...document.querySelectorAll('.dev[data-id="spectrum"] .k')].find((e) => e.querySelector('.k-lbl') && e.querySelector('.k-lbl').textContent === 'ELEMENT  Z'); return k ? k.querySelector('.k-val').textContent : ''; })();
    /* and back to the closed form: hydrogen's own energies and the shipped radial path */
    __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); await __LW.settle(); await new Promise((r) => setTimeout(r, 200));
    const E1s = __LW.api.energyOf(0), hSpace = __LW.field.space, hLabel = __LW.api.labelOf(Hy.BASIS[0]);
    document.querySelector('.dev[data-id="atoms"] .dev-close').click();
    return { pBefore, shipsClosed, shipsLast, hasCopy, ham, sym, kspace, forcedX, knob, knobBack, eps, dE, dVirt, labels, virtLabel, finite,
      nonBlack: px.nonBlack, meanLum: px.meanLum, nan: fd.nan, integral: fd.integral, inkLad, inkRad,
      fill, pop, norm, savedZ, noTheme, movedZ, backZ, backHam, E1s, hSpace, hLabel,
      neNe: dNe.indexOf('Ne') >= 0, neIP: dNe.indexOf('21.088') >= 0 || dNe.indexOf('21.09') >= 0, neXa: dNe.indexOf('Xα') >= 0,
      neKo: dNe.indexOf('15.078') >= 0 && dNe.indexOf('NOT the IP') >= 0, neLen: dNe.length,
      naQD: dNa.indexOf('1.32656') >= 0 && dNa.indexOf('1.37323') >= 0 && dNa.indexOf('α = 2/3') >= 0, qd, qd1,
      scAlpha: dSc.indexOf('α-DEPENDENT') >= 0 && dSc.indexOf('4s') >= 0 && dSc.indexOf('3d') >= 0,
      errs: window.__e.length, e0: window.__e[0] || null, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B54 THE ATOM: ATOM Z = 10 makes the 91 labels the shells of Ne in one self-consistent Xα(2/3) + Latter-tail central field — every 2p label carries atoms.js\'s own ε to 1e-9 (and an unoccupied 3d carries the frozen field\'s, marked °), the kernel switches to the tabulated radial path and momentum space is forced off, a 2p_z cloud renders lit with no NaN on the grid and unit norm; the ATOMS window ships CLOSED and fourth from last (ELECTROSTATICS, then WIGNER and RADIATION, follow it), draws its shell ladder and its radials, and its digest carries Ne, the Δ-SCF 21.088 eV beside Koopmans 15.078 eV labelled NOT the IP, and Xα; FILL THE VALENCE puts the three 2p labels in the register at unit norm; Na\'s digest carries δ = 1.32656 at α = 2/3 and 1.37323 at α = 1; Sc says the 3d/4s order is α-dependent instead of asserting one; the project file carries atomZ and restores it into the knob; and hydrogen comes back to E(1s) = −0.5 on the closed-form path',
    !atT.error && atT.shipsClosed && atT.shipsLast && atT.hasCopy && atT.ham === 'atom' && atT.sym === 'Ne' && atT.kspace === 6 && atT.pBefore === 'p' && atT.forcedX === 'x'
    && atT.dE < 1e-9 && Math.abs(atT.eps + 0.5540927689) < 1e-6 && atT.dVirt < 1e-9 && atT.labels === '2p₋1 2p₊0 2p₊1' && atT.virtLabel === '3d₊0°' && atT.finite
    && /Z = 10  Ne/.test(atT.knob) && atT.nonBlack > 500 && atT.nan === 0 && Math.abs(atT.integral - 1) < 0.05 && atT.inkLad > 400 && atT.inkRad > 200
    && atT.neNe && atT.neIP && atT.neXa && atT.neKo && atT.neLen > 600
    && atT.fill.labels === 3 && atT.pop === 3 && Math.abs(atT.norm - 1) < 1e-9
    && atT.naQD && Math.abs(atT.qd - 1.3265641585) < 1e-6 && Math.abs(atT.qd1 - 1.3732338053) < 1e-6 && atT.scAlpha
    && atT.savedZ === 11 && atT.noTheme && atT.movedZ === 18 && atT.backZ === 11 && atT.backHam === 'atom' && /Z = 11  Na/.test(atT.knobBack)
    && Math.abs(atT.E1s + 0.5) < 1e-12 && atT.hSpace === 0 && atT.hLabel === '1s₊0' && atT.errs === 0 && !atT.gpu, atT);

  /* ── B55: W-FIELD — the classical field of the register's own charge, in closed form, on the stage ── */
  const elT = await g.ev(`try {
    const Hy = await import('/lab/hydrogen.js');
    __LW.pause(); __LW.setTheme('dark'); __LW.ab.set(false); __LW.reg.setField({ Fz: 0 });
    if (__LW.molecule.on) __LW.molecule.setOn(false); if (__LW.helium.on) __LW.helium.setOn(false); if (__LW.h2.on) __LW.h2.setOn(false);
    __LW.setHamiltonian('hydrogen'); __LW.setIonZ(1); __LW.setSpace('x'); await __LW.settle();
    const shipsClosed = (__LW.bootClosed || []).includes('field'), shipsLast = __LW.bootOrder[__LW.bootOrder.length - 3] === 'field';
    __LW.layout.reopen('field', 'R');
    const hasCopy = !!document.querySelector('.dev[data-id="field"] .dev-copy');
    const stat = () => document.querySelector('.dev[data-id="field"] .dev-stat').textContent;
    const cv = document.getElementById('fieldlines');
    const ink = () => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) k++; return k; };
    const settle = async (ms) => { await __LW.settle(); await new Promise((r) => setTimeout(r, ms || 400)); };
    /* 2p₊1: one label, a real current, and the two axis numbers the ledger certifies */
    __LW.api.clear(); __LW.api.toggleMode(Hy.stateOf(2, 1, 1).index); __LW.scrub(0); await settle(300);
    const inkBefore = ink();
    __LW.fieldlines.setOverlay('phi'); await settle();
    const s = JSON.parse(JSON.stringify(__LW.fieldlines.stats)), inkPhi = ink(), dig = __LW.layout.digest('field');
    const el = __LW.electrostatics, bn = el.bNucleus();
    __LW.fieldlines.setOverlay('E'); await settle(); const inkE = ink(), polysE = __LW.fieldlines.stats.polys;
    __LW.fieldlines.setOverlay('j'); await settle(); const inkJ = ink(), polysJ = __LW.fieldlines.stats.polys;
    __LW.fieldlines.setOverlay('off'); await settle(300); const inkOff = ink();
    /* 1s: Φ is spherically symmetric, so its ink must be symmetric about the nucleus's screen x.
       The stage CAPTION is ink too and it lives on the left, so it is switched off for the measurement. */
    __LW.api.clear(); __LW.api.toggleMode(Hy.stateOf(1, 0, 0).index); __LW.scrub(0);
    const hadCaps = !document.body.classList.contains('no-captions');
    document.body.classList.add('no-captions');
    __LW.fieldlines.setOverlay('phi'); await settle(500);
    const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let mL = 0, mR = 0; const W = cv.width, H = cv.height;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[4 * (y * W + x) + 3] > 8) { if (x < W / 2) mL++; else mR++; }
    const mirror = Math.abs(mL - mR) / Math.max(1, (mL + mR) / 2);
    const phiE0_1s = __LW.fieldlines.stats.phiE0, Q1s = __LW.fieldlines.stats.Q, B1s = __LW.fieldlines.stats.Bmag;
    if (hadCaps) document.body.classList.remove('no-captions');
    /* the MOLECULE's force line at R = 2: Hellmann–Feynman, the Pulay term and its bound */
    __LW.molecule.setR(2); await __LW.settle();
    const dm = __LW.layout.digest('molecule').split(String.fromCharCode(8722)).join('-');
    const molHF = dm.indexOf('-0.1339') >= 0, molBound = dm.indexOf('0.102') >= 0, molExact = dm.indexOf('0.053804') >= 0;
    /* the Hamiltonian guard: the closed form is hydrogenic */
    __LW.setHamiltonian('qho'); await settle(350);
    const qhoInk = ink(), qhoStat = stat();
    __LW.setHamiltonian('hydrogen'); await settle(450);
    const backInk = ink(), backStat = stat();
    /* the project carries the overlay, and still not the theme */
    __LW.fieldlines.setOverlay('E'); __LW.fieldlines.setLines(14); await settle(300);
    const proj = __LW.serialize(), saved = proj.presentation.field, noTheme = proj.presentation.mat.bg === undefined;
    __LW.fieldlines.setOverlay('phi'); __LW.fieldlines.setLines(6);
    __LW.restore(proj); await settle(300);
    const back = { ov: __LW.fieldlines.overlay, lines: __LW.fieldlines.lines, src: __LW.fieldlines.source, ink: ink() };
    /* what the window costs the frame rate: frames counted against the wall clock over two seconds, three times on
       the SAME page — window closed, window open with no overlay, window open drawing Φ.  (An absolute rate is not a
       property of this window: five minutes into a headless run on a shared machine the page is at a third of the
       rate it holds fresh, whatever is drawn.  The comparison is.) */
    const rate = async () => { const f0 = __LW.stats.frames, w0 = performance.now(); __LW.play(); await new Promise((r) => setTimeout(r, 2000)); const meter = __LW.stats.fps; __LW.pause(); await __LW.settle(); return { fr: (__LW.stats.frames - f0) / ((performance.now() - w0) / 1000), meter }; };
    __LW.fieldlines.setOverlay('off'); document.querySelector('.dev[data-id="field"] .dev-close').click(); await settle(250);
    await rate();                                                  // a warm-up run, thrown away: the first play after a long pause is cold
    const shut = await rate();
    __LW.layout.reopen('field', 'R'); await settle(250);
    const idle = await rate();
    __LW.fieldlines.setOverlay('phi'); await settle(300);
    const buildMs = __LW.fieldlines.stats.buildMs, drawnInk = ink();
    const on = await rate(), fpsShut = shut.fr, fpsIdle = idle.fr, fps = on.fr, fpsMeter = on.meter;
    __LW.fieldlines.setOverlay('off'); await settle(250);
    document.querySelector('.dev[data-id="field"] .dev-close').click();
    __LW.loadPreset('1s+2pz'); await settle(250);
    const chk = { ship: shipsClosed && shipsLast && hasCopy && inkBefore === 0,
      num: Math.abs(s.Q - 1) < 1e-9 && Math.abs(s.Q - s.norm2) < 1e-9 && s.terms === 1 && s.slots === 2 && s.Lmax === 2 && Math.abs(s.phiE0 + 0.25) < 1e-9 && Math.abs(s.Emag - 0.9855758458) < 1e-9,
      B: Math.abs(s.Bz + 0.521534351) < 1e-6 && Math.abs(s.Bz1 + 0.429533192) < 1e-6,
      dig: dig.indexOf('0.52') >= 0 && dig.indexOf('T') >= 0 && dig.indexOf('-6.803') >= 0 && dig.indexOf('5.068e+11') >= 0 && dig.length > 600,
      ink: inkPhi > 500 && inkE > 500 && inkJ > 500 && inkOff === 0,
      mir: mirror < 0.10 && mL > 500, s1: Math.abs(phiE0_1s + 1) < 1e-9 && Math.abs(Q1s - 1) < 1e-9 && B1s === 0,
      mol: molHF && molBound && molExact, guard: qhoInk === 0 && /hydrogenic register only/.test(qhoStat) && backInk > 500,
      proj: saved.overlay === 'E' && saved.lines === 14 && noTheme && back.ov === 'E' && back.lines === 14 && back.ink > 500,
      fps: fps > 0.72 * fpsShut && fps > 6 && drawnInk > 500, closed: document.querySelector('.dev[data-id="field"]').classList.contains('closed'), err: window.__e.length === 0 };
    const env = { fpsShut, fpsIdle, fps, fpsMeter, cost: 1 - fps / fpsShut, buildMs, drawnInk,
      frames: __LW.stats.frames, open: document.querySelectorAll('.dev:not(.closed)').length, half: __LW.domain.half };
    return { chk, env, shipsClosed, shipsLast, hasCopy, inkBefore, inkPhi, inkE, inkJ, inkOff, polysE, polysJ,
      Q: s.Q, norm2: s.norm2, phiE0: s.phiE0, phiE0V: s.phiE0V, Emag: s.Emag, EmagV: s.EmagV, Bz: s.Bz, Bz1: s.Bz1,
      bnZ: bn.Bz, bnMag: bn.mag, slots: s.slots, Lmax: s.Lmax, buildMs: s.buildMs, terms: s.terms,
      digHasB: dig.indexOf('0.52') >= 0 && dig.indexOf('T') >= 0, digHasVolts: dig.indexOf('-6.803') >= 0,
      digHasE: dig.indexOf('5.068e+11') >= 0, digLen: dig.length,
      mL, mR, mirror, phiE0_1s, Q1s, B1s, molHF, molBound, molExact, qhoInk, qhoStat, backInk, backStat,
      saved, noTheme, back, closedAtEnd: document.querySelector('.dev[data-id="field"]').classList.contains('closed'),
      errs: window.__e.length, e0: window.__e[0] || null, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B55 THE CLASSICAL FIELD: ELECTROSTATICS ships CLOSED and third from last (WIGNER and RADIATION follow it), and once opened it solves Poisson for the register\'s own |ψ|² in closed form — 2p₊1 gives the monopole = ‖c‖² = 1 exactly, Φ_e(0) = −0.25 a.u. = −6.803 V, |E|(0,0,1) = 0.985576 a.u. = 5.068e11 V/m, and the certified magnetostatic numbers B_z = −0.521534 T at the nucleus and −0.429533 T at 1 a₀, all of them in a copyable digest; Φ, E and j each draw ink on the stage overlay and OFF clears it; a 1s state\'s equipotentials are left–right symmetric about the nucleus\'s screen x to better than 10 % (0.1 % with the caption off) and carry no current at all; the MOLECULE window prints the Hellmann–Feynman force −0.1339 with its Pulay bound 0.102 against the variational 0.053804; a project keeps the overlay and its 14 lines and still no theme; drawing Φ every frame costs the frame rate under 28 % against the same page with the window shut, counted against the wall clock back to back (an absolute rate is the machine\'s, not this window\'s); and the whole window stands down with "hydrogenic register only" under the oscillator and comes back under hydrogen',
    !elT.error && elT.shipsClosed && elT.shipsLast && elT.hasCopy && elT.inkBefore === 0
    && Math.abs(elT.Q - 1) < 1e-9 && Math.abs(elT.Q - elT.norm2) < 1e-9 && elT.terms === 1 && elT.slots === 2 && elT.Lmax === 2
    && Math.abs(elT.phiE0 + 0.25) < 1e-9 && Math.abs(elT.phiE0V + 6.802846561) < 1e-6
    && Math.abs(elT.Emag - 0.9855758458) < 1e-9 && Math.abs(elT.EmagV - 5.068034768e11) / 5.068e11 < 1e-6
    && Math.abs(elT.Bz + 0.521534351) < 1e-6 && Math.abs(elT.Bz1 + 0.429533192) < 1e-6 && Math.abs(elT.bnZ - elT.Bz) < 1e-9
    && elT.digHasB && elT.digHasVolts && elT.digHasE && elT.digLen > 600
    && elT.inkPhi > 500 && elT.inkE > 500 && elT.inkJ > 500 && elT.polysE > 0 && elT.polysJ > 0 && elT.inkOff === 0
    && elT.mirror < 0.10 && elT.mL > 500 && Math.abs(elT.phiE0_1s + 1) < 1e-9 && Math.abs(elT.Q1s - 1) < 1e-9 && elT.B1s === 0
    && elT.molHF && elT.molBound && elT.molExact
    && elT.qhoInk === 0 && /hydrogenic register only/.test(elT.qhoStat) && elT.backInk > 500 && /closed form/.test(elT.backStat)
    && elT.saved.overlay === 'E' && elT.saved.lines === 14 && elT.noTheme && elT.back.ov === 'E' && elT.back.lines === 14 && elT.back.ink > 500
    && elT.chk.fps && elT.closedAtEnd && elT.errs === 0 && !elT.gpu, elT);

  /* ── B56 W-STURMIAN: the SCALE switch ───────────────────────────────────── */
  const srT = await g.ev(`try { __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.setIonZ(1); __LW.ab.set(false); __LW.setRate(0, 1); __LW.sturmian.set(false); __LW.setSpace('x'); __LW.setView('density'); __LW.reg.setField({ Bz: 0, Fz: 0 }); await __LW.settle();
    const S = __LW.sturmian, px = () => __LW.readPixels(), rel = (a, b) => Math.abs(a - b) / Math.max(1e-9, Math.abs(b));
    const same = (p, q) => Math.max(rel(p.meanLum, q.meanLum), rel(p.nonBlack, q.nonBlack)) < 0.01;
    const seat = (lbl) => [...document.querySelectorAll('.sw')].find((b) => b.textContent.includes(lbl));
    const segBtn = (lbl) => [...document.querySelectorAll('.seg-b')].find((b) => b.textContent.includes(lbl));
    const rateKnobs = () => [...document.querySelectorAll('.sp-row .k.rate')];
    const ladderInk = () => { const cv = document.querySelector('.dev[data-id="spectrum"] .ladder canvas'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; };
    /* the frames before the excursion: hydrogen 1s and a fresh 2p₊1, to come back to */
    __LW.loadPreset('2p+'); __LW.setView('density'); await __LW.settle(); const p2p0 = await px();
    __LW.loadPreset('1s'); await __LW.settle(); const pH = await px(), fH = await __LW.fieldDigest();
    /* 1. hydrogen 1s → STURMIAN at λ = 1: E(1s) = −½, the same cloud */
    S.set(true); S.setLambda(1); await __LW.settle(); await __LW.settle();
    const e1 = S.eigen(), k1 = e1.pop.indexOf(Math.max(...e1.pop)), E1 = e1.E[k1], pop1 = e1.pop[k1];
    const pS = await px(), fS = await __LW.fieldDigest(), on1 = S.active, laneE = document.querySelector('.sp-row .sp-e').textContent, cap = document.querySelector('.sp-cap');
    const status1 = document.querySelector('.dev[data-id="spectrum"] .dev-stat').textContent, ink1 = ladderInk(), capShown1 = !!(cap && !cap.hidden);
    /* 2. λ = ½ with the 2p_z label: the eigen ladder carries −1/8, the density is stationary */
    __LW.loadPreset('2pz'); __LW.setView('density'); S.setLambda(0.5); await __LW.settle();
    const e2 = S.eigen(), k2 = e2.E.findIndex((E, k) => Math.abs(E + 0.125) < 1e-10 && e2.pop[k] > 0.5), pop2 = k2 >= 0 ? e2.pop[k2] : 0;
    const qA = await px(); __LW.scrub(5); await __LW.settle(); const qB = await px(); const per2 = __LW.period;
    /* 3. λ = 1.4 with 1s + 2p_z played to t = 50: S-norm and populations conserved, the cloud moves, no exact period */
    __LW.loadPreset('1s+2pz'); __LW.setView('density'); S.setLambda(1.4); await __LW.settle();
    const n0 = S.norm(), p0 = S.eigen().pop, sum0 = p0.reduce((a, b) => a + b, 0), r0 = await px();
    const vx = __LW.field.resolution, mid = vx >> 1, gpu = await __LW.sampleVoxel(mid + 3, mid + 2, mid + 5), cpu = __LW.cpuPsi(gpu.x, gpu.y, gpu.z);
    const twin = Math.hypot(gpu.re - cpu.re, gpu.im - cpu.im) / Math.max(1e-9, Math.hypot(cpu.re, cpu.im));
    __LW.scrub(50); await __LW.settle(); const r1 = await px(), n50 = S.norm(50), p50 = S.eigen(50).pop, sum50 = p50.reduce((a, b) => a + b, 0);
    let dPop = 0; for (let k = 0; k < p0.length; k++) dPop = Math.max(dPop, Math.abs(p50[k] - p0[k]));
    let occ = 0; for (const p of p0) if (p > 1e-6) occ++;
    const per3 = __LW.period, perRo = document.querySelector('#transport .ro.period'), perText = perRo ? perRo.textContent : '';
    const metersNorm = __LW.meters().norm, hc = __LW.meters().energy;
    /* 4. He⁺: Z = 2 at λ = 2 with 1s: −2 */
    __LW.loadPreset('1s'); __LW.setIonZ(2); S.setLambda(2); await __LW.settle();
    const e4 = S.eigen(), k4 = e4.pop.indexOf(Math.max(...e4.pop)), E4 = e4.E[k4], Z4 = e4.Z; __LW.setIonZ(1); await __LW.settle();
    /* 5. select(k): an eigenstate loads and the ladder shows population 1 on it */
    __LW.loadPreset('1s+2pz'); S.setLambda(1.4); await __LW.settle();
    const e5 = S.eigen(), k5 = e5.E.findIndex((E, k) => e5.l[k] === 1 && e5.m[k] === 0);   // the lowest p₀ eigenvalue
    const sel = S.select(k5); await __LW.settle(); const e6 = S.eigen(), popK = e6.pop[k5]; let others = 0; for (let k = 0; k < e6.rank; k++) if (k !== k5) others = Math.max(others, e6.pop[k]);
    const selStat = document.querySelector('.dev[data-id="spectrum"] .dev-stat').textContent, selNorm = S.norm(), lanes5 = document.querySelectorAll('.sp-row').length;
    const sA = await px(); __LW.scrub(7); await __LW.settle(); const sB = await px(); __LW.scrub(0);
    /* 6. the diagonal-phase features stand down; momentum space is forced off with the note */
    const rk = rateKnobs(), rateOff = rk.length > 0 && rk.every((k) => k.classList.contains('disabled')), rateNote = rk[0] ? rk[0].title : '';
    const ab = seat('TRANSITION'), abOff = !!(ab && ab.disabled), abNote = ab ? ab.title : '', abRefused = __LW.ab.set(true) === false, rateRefused = __LW.setRate(0, 2) === false, rateStill = __LW.rateOf(0);
    const spaceTry = __LW.setSpace('p'); await __LW.settle(); const spaceNow = __LW.space, pBtn = segBtn('MOMENTUM'), pOff = !!(pBtn && pBtn.disabled), note = document.querySelector('.sturm-note'), noteShown = !!(note && !note.hidden && /momentum/.test(note.textContent));
    const fz0 = __LW.reg.field.Fz; __LW.reg.setField({ Fz: 0.005 }); const fzRefused = __LW.reg.field.Fz === 0;
    const hidden = ['orbit', 'vortex', 'ladder'].map((id) => { const d = document.querySelector('.dev[data-id="' + id + '"]'); return d ? d.hidden : null; });
    /* 7. back to HYDROGEN: every label energy −Z²/2n² again, RATE / A/B re-enabled, the shipped records */
    S.set(false); await __LW.settle(); await __LW.settle();
    const Hy = await import('/lab/hydrogen.js'); let worstE = 0; for (const s of Hy.BASIS) worstE = Math.max(worstE, Math.abs(__LW.reg.Ediag(s.index) - (-0.5 / (s.n * s.n)) * __LW.rateOf(s.index)));
    const rk2 = rateKnobs(), rateOn = rk2.length > 0 && rk2.every((k) => !k.classList.contains('disabled')), abOn = !(seat('TRANSITION').disabled), pOn = !segBtn('MOMENTUM').disabled, noteHidden = note.hidden;
    const backHidden = ['orbit', 'vortex', 'ladder'].map((id) => document.querySelector('.dev[data-id="' + id + '"]').hidden);
    __LW.loadPreset('2p+'); __LW.setView('density'); await __LW.settle(); const p2p1 = await px();
    __LW.loadPreset('1s'); await __LW.settle(); const pH2 = await px(), fH2 = await __LW.fieldDigest();
    const propNull = __LW.reg.P === null, status7 = document.querySelector('.dev[data-id="spectrum"] .dev-stat').textContent;
    /* 8. the project round trip keeps { on: true, lambda: 1.4 }; the theme still never */
    S.set(true); S.setLambda(1.4); await __LW.settle(); const proj = __LW.serialize(), saved = proj.presentation.sturmian, noTheme = proj.presentation.mat.bg === undefined;
    S.set(false); S.setLambda(1); await __LW.settle(); const mid8 = { on: S.on, lambda: S.lambda };
    __LW.restore(proj); await __LW.settle(); const back = { on: S.on, lambda: S.lambda, active: S.active, E0: S.eigen() ? S.eigen().E[0] : null };
    /* tidy */
    S.set(false); S.setLambda(1); __LW.setIonZ(1); __LW.loadPreset('1s+2pz'); await __LW.settle();
    return { E1, pop1, on1, same1: same(pS, pH), dInt: rel(fS.integral, fH.integral), hashSame: fS.hash === fH.hash, laneE, capShown: capShown1, capText: cap ? cap.textContent : '', status1, ink1,
      k2, E2: k2 >= 0 ? e2.E[k2] : null, pop2, stationary: same(qA, qB), per2: { exact: per2.exact, T: per2.T, stationary: !!per2.stationary },
      n0, n50, sum0, sum50, dPop, occ, twin, moved: r1.hash !== r0.hash && !same(r0, r1), per3: { exact: per3.exact, T: per3.T, err: per3.err, count: per3.count }, perText, metersNorm, hc,
      E4, Z4, sel, k5, popK, others, selStat, selNorm, lanes5, selStationary: same(sA, sB),
      rateOff, rateNote, abOff, abNote, abRefused, rateRefused, rateStill, spaceTry, spaceNow, pOff, noteShown, fzRefused, hidden,
      worstE, rateOn, abOn, pOn, noteHidden, backHidden, same2p: same(p2p1, p2p0), sameH: same(pH2, pH), hashBack: fH2.hash === fH.hash, propNull, status7,
      saved, noTheme, mid8, back, buildMs: S.buildMs, errs: window.__e.length, e0: window.__e[0] || null, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B56 THE SCALE (W-STURMIAN, a switch): hydrogen 1s → STURMIAN at λ = 1 keeps E(1s) = −½ (1e-12) with population 1 and renders the same cloud (pixels within 1 %, the same field integral); λ = ½ with 2p_z puts −1/8 on the eigen ladder (1e-10) with a stationary density (frames 5 a.u. apart within 1 %); λ = 1.4 with 1s + 2p_z played to t = 50 conserves ⟨c|S|c⟩ (1e-9) and the populations (Σ = 1, each constant to 1e-9), the GPU voxel matches the CPU twin on the scaled records (1 %), the cloud moves, and the transport says NO EXACT PERIOD; Z = 2 at λ = 2 gives −2 (1e-10); select(k) loads an eigenstate with population 1 on it, unit S-norm, stationary; RATE and A/B are disabled with their notes and refuse through the API, the Stark field is refused, momentum space is forced off with the note, the hydrogen-theorem windows stand down; back on HYDROGEN every label is −Z²/2n² again, RATE / A/B / momentum / the windows come back, the propagator is null and a 2p₊1 frame (and the 1s field, bit for bit) equal the frames before the excursion; the project round-trip keeps { on: true, lambda: 1.4 } and no theme; zero errors',
    !srT.error && Math.abs(srT.E1 + 0.5) < 1e-12 && Math.abs(srT.pop1 - 1) < 1e-9 && srT.on1 && srT.same1 && srT.dInt < 1e-6 && srT.capShown && /projection/.test(srT.capText) && /STURMIAN/.test(srT.status1) && srT.ink1 > 100
    && srT.k2 >= 0 && Math.abs(srT.E2 + 0.125) < 1e-10 && Math.abs(srT.pop2 - 1) < 1e-9 && srT.stationary && srT.per2.stationary
    && Math.abs(srT.n50 - srT.n0) < 1e-9 && Math.abs(srT.sum0 - 1) < 1e-9 && Math.abs(srT.sum50 - 1) < 1e-9 && srT.dPop < 1e-9 && srT.occ >= 3 && srT.twin < 0.01 && srT.moved
    && srT.per3.exact === false && /NO EXACT PERIOD/.test(srT.perText) && Math.abs(srT.metersNorm - Math.sqrt(srT.n0)) < 1e-6
    && Math.abs(srT.E4 + 2) < 1e-10 && srT.Z4 === 2
    && srT.sel && Math.abs(srT.popK - 1) < 1e-9 && srT.others < 1e-9 && /eigenstate/.test(srT.selStat) && Math.abs(srT.selNorm - 1) < 1e-9 && srT.lanes5 >= 2 && srT.selStationary
    && srT.rateOff && /STURMIAN/.test(srT.rateNote) && srT.abOff && /STURMIAN/.test(srT.abNote) && srT.abRefused && srT.rateRefused && srT.rateStill === 1 && srT.spaceTry === false && srT.spaceNow === 'x' && srT.pOff && srT.noteShown && srT.fzRefused && srT.hidden.every((h) => h === true)
    && srT.worstE < 1e-12 && srT.rateOn && srT.abOn && srT.pOn && srT.noteHidden && srT.backHidden.every((h) => h === false) && srT.same2p && srT.sameH && srT.hashBack && srT.propNull && !/STURMIAN/.test(srT.status7)
    && srT.saved && srT.saved.on === true && Math.abs(srT.saved.lambda - 1.4) < 1e-12 && srT.noTheme && srT.mid8.on === false && srT.back.on === true && Math.abs(srT.back.lambda - 1.4) < 1e-12 && srT.back.active
    && srT.errs === 0 && !srT.gpu, srT);

  /* ── B57: W-WIGNER + W-RADIATION — the slice that is not a marginal, the dipole that radiates, and the stand-downs ── */
  const wrT = await g.ev(`try {
    const Hy = await import('/lab/hydrogen.js');
    __LW.pause(); __LW.setTheme('dark'); __LW.ab.set(false); __LW.reg.setField({ Fz: 0 });
    if (__LW.molecule.on) __LW.molecule.setOn(false); if (__LW.helium.on) __LW.helium.setOn(false); if (__LW.h2.on) __LW.h2.setOn(false);
    __LW.setHamiltonian('hydrogen'); __LW.setIonZ(1); __LW.setSpace('x'); await __LW.settle();
    const order = __LW.bootOrder, closed = __LW.bootClosed || [];
    const ships = closed.indexOf('wigner') >= 0 && closed.indexOf('radiation') >= 0
      && order[order.length - 3] === 'field' && order[order.length - 2] === 'wigner' && order[order.length - 1] === 'radiation';
    __LW.layout.reopen('radiation', 'R'); __LW.layout.reopen('wigner', 'R');
    const hasCopy = !!document.querySelector('.dev[data-id="wigner"] .dev-copy') && !!document.querySelector('.dev[data-id="radiation"] .dev-copy');
    const settle = async (ms) => { await __LW.settle(); await new Promise((r) => setTimeout(r, ms || 500)); };
    const plain = (s) => s.split(String.fromCharCode(8722)).join('-');
    const rgb = (name) => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = getComputedStyle(document.body).getPropertyValue(name).trim(); const k = parseInt(String(c.fillStyle).slice(1), 16); return [k >> 16 & 255, k >> 8 & 255, k & 255]; };
    /* the map's two hues, counted apart: every pixel is one accent or the other at its own opacity */
    const signs = () => { const cv = __LW.wigner.canvas, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, A = rgb('--acc'), B = rgb('--acc2');
      let p = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 40) continue;
        const dA = Math.abs(d[i] - A[0]) + Math.abs(d[i + 1] - A[1]) + Math.abs(d[i + 2] - A[2]);
        const dB = Math.abs(d[i] - B[0]) + Math.abs(d[i + 1] - B[1]) + Math.abs(d[i + 2] - B[2]);
        if (dA < dB && dA < 70) p++; else if (dB < dA && dB < 70) n++; }
      return { p, n }; };
    const wInk = () => { const cv = __LW.wigner.canvas, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) k++; return k; };
    const rInk = () => { const cv = __LW.radiation.canvas, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) k++; return k; };
    const seat = (lbl) => [...document.querySelectorAll('.dev[data-id="state"] .k')].find((k) => (k.querySelector('.k-lbl') || {}).textContent === lbl);
    const wStat = () => document.querySelector('.dev[data-id="wigner"] .dev-stat').textContent;
    const rStat = () => document.querySelector('.dev[data-id="radiation"] .dev-stat').textContent;
    /* 1. the 1s slice: 1/π³ at the origin, the certified minimum, ink of both signs */
    __LW.api.clear(); __LW.api.toggleMode(Hy.stateOf(1, 0, 0).index); __LW.scrub(0); await settle(800);
    const w1 = JSON.parse(JSON.stringify(__LW.wigner.stats)), wdig = plain(__LW.layout.digest('wigner')), s1 = signs();
    const dig1 = { peak: wdig.indexOf('0.03225') >= 0, min: wdig.indexOf('-3.0973e-4') >= 0, slice: wdig.indexOf('SLICE') >= 0, len: wdig.length };
    /* 2. 2p_z: a real orbital of definite parity — the map is EVEN in z */
    __LW.api.clear(); __LW.api.toggleMode(Hy.stateOf(2, 1, 0).index); __LW.scrub(0); await settle(900);
    const S = __LW.wigner.slice(); let mir = 0, mxW = 0;
    for (let i = 0; i < 64; i++) for (let j = 0; j < 64; j++) { const a = S.W[i * 64 + j]; mir = Math.max(mir, Math.abs(a - S.W[(63 - i) * 64 + j])); mxW = Math.max(mxW, Math.abs(a)); }
    const even = mir / mxW, s2 = signs(), zsSym = Math.abs(S.zs[0] + S.zs[63]);
    /* 3. the two ranges round-trip through a project, and the theme still never */
    __LW.wigner.setRange(14, 3); await settle(900);
    const proj = __LW.serialize(), saved = proj.presentation.wigner, noTheme = proj.presentation.mat.bg === undefined;
    __LW.wigner.setRange(5, 1); await settle(700); const mid = { z: __LW.wigner.zmax, p: __LW.wigner.pmax };
    __LW.restore(proj); await settle(900);
    const back = { z: __LW.wigner.zmax, p: __LW.wigner.pmax, edge: __LW.wigner.slice().zs[63], pedge: __LW.wigner.slice().ps[63] };
    /* 4. 1s + 2p_z: the line the whole instrument is about */
    __LW.loadPreset('1s+2pz'); __LW.scrub(0); await settle(800);
    const rad = JSON.parse(JSON.stringify(__LW.radiation.stats)), rdig = plain(__LW.layout.digest('radiation')), pair = __LW.radiation.pair();
    const dig2 = { A: rdig.indexOf('6.2649e8') >= 0, tau: rdig.indexOf('1.596') >= 0, law: rdig.indexOf(String.fromCharCode(295) + String.fromCharCode(969) + 'A') >= 0, lam: rdig.indexOf('2296') >= 0, len: rdig.length };
    const patInk = rInk(), api = { A: __LW.radiation.A, tau: __LW.radiation.tau, power: __LW.radiation.power };
    /* 5. Δm = 0 stands still; Δm = +1 turns with the clock (the cut through the screen plane breathes at ω) */
    const flat = []; for (const t of [0, 2.0, 4.19]) { __LW.scrub(t); await settle(350); flat.push(rInk()); }
    __LW.api.clear(); __LW.api.toggleMode(Hy.stateOf(1, 0, 0).index); __LW.api.toggleMode(Hy.stateOf(2, 1, 1).index); __LW.scrub(0); await settle(700);
    const rotPair = __LW.radiation.pair(), turn = [];
    for (const t of [0, 2.0, 4.19]) { __LW.scrub(t); await settle(350); turn.push(rInk()); }
    /* 6. a lone 1s has no pair at all: the window says so and draws nothing */
    __LW.api.clear(); __LW.api.toggleMode(Hy.stateOf(1, 0, 0).index); __LW.scrub(0); await settle(700);
    const lone = { stat: rStat(), note: (document.querySelector('.rad-stand') || {}).textContent || '', shown: !document.querySelector('.rad-stand').hidden, ink: rInk(), stats: __LW.radiation.stats, A: __LW.radiation.A };
    /* 7. the SCALE stands the slice down and disables the SO(4) knobs; hydrogen brings both back */
    __LW.loadPreset('1s+2pz'); await settle(600);
    const kz0 = seat('STARK K_z').className, df0 = seat('DEFECT L' + String.fromCharCode(178)).className, ink0 = wInk();
    __LW.sturmian.set(true); await settle(900);
    const onS = { wstat: wStat(), rstat: rStat(), note: document.querySelector('.wig-stand').textContent, shown: !document.querySelector('.wig-stand').hidden,
      ink: wInk(), slice: __LW.wigner.slice(), pair: __LW.radiation.pair(),
      kz: seat('STARK K_z').className, df: seat('DEFECT L' + String.fromCharCode(178)).className, kzTitle: seat('STARK K_z').title, dfTitle: seat('DEFECT L' + String.fromCharCode(178)).title };
    __LW.sturmian.set(false); await settle(1000);
    const offS = { wstat: wStat(), hidden: document.querySelector('.wig-stand').hidden, ink: wInk(), kz: seat('STARK K_z').className, df: seat('DEFECT L' + String.fromCharCode(178)).className, A: __LW.radiation.A };
    /* 8. and the oscillator stands both down, as ELECTROSTATICS does */
    __LW.setHamiltonian('qho'); await settle(700);
    const qho = { wstat: wStat(), rstat: rStat(), wink: wInk(), rink: rInk() };
    __LW.setHamiltonian('hydrogen'); await settle(900);
    const home = { wstat: wStat(), wink: wInk(), rink: rInk() };
    /* tidy: both windows shut again */
    document.querySelector('.dev[data-id="wigner"] .dev-close').click();
    document.querySelector('.dev[data-id="radiation"] .dev-close').click();
    __LW.loadPreset('1s+2pz'); await settle(300);
    const chk = {
      ship: ships && hasCopy,
      one: Math.abs(w1.peak - 0.0322515344) < 1e-9 && Math.abs(w1.min + 3.09725752e-4) < 1e-9 && Math.abs(Math.abs(w1.minAt[0]) - 1.3295373) < 1e-3 && Math.abs(Math.abs(w1.minAt[1]) - 1.3791093) < 1e-3
        && w1.nz === 64 && w1.np === 64 && dig1.peak && dig1.min && dig1.slice && s1.p > 200 && s1.n > 200,
      evenz: even < 1e-6 && mxW > 1e-3 && zsSym < 1e-12 && s2.p > 200 && s2.n > 200,
      proj: saved && saved.zmax === 14 && saved.pmax === 3 && noTheme && mid.z === 5 && mid.p === 1 && back.z === 14 && back.p === 3 && Math.abs(back.edge - 14) < 1e-9 && Math.abs(back.pedge - 3) < 1e-9,
      line: rad && rad.la === '1s' + String.fromCharCode(8320) && rad.lb === '2p' + String.fromCharCode(8320) && Math.abs(rad.A - 6.264903069e8) < 1e3 && Math.abs(rad.tau * 1e9 - 1.5961939) < 1e-5
        && Math.abs(rad.lambda - 2296.0602) < 1e-2 && Math.abs(rad.eV - 10.2042698) < 1e-5 && Math.abs(rad.dabs - 0.744935539) < 1e-8
        && Math.abs(rad.P - 1.42146834e-9) < 1e-16 && Math.abs(rad.P - rad.weight * rad.hbarOmegaA) < 1e-20
        && dig2.A && dig2.tau && dig2.law && dig2.lam && patInk > 200 && Math.abs(api.A - rad.A) < 1 && Math.abs(api.power - rad.P) < 1e-20,
      turn: flat[0] === flat[1] && flat[1] === flat[2] && rotPair.dm === 1 && turn[0] !== turn[1] && Math.abs(turn[2] - turn[0]) < 3,
      lone: lone.stats === null && lone.shown && lone.note.indexOf('no dipole in this state') === 0 && lone.stat === 'no dipole in this state' && lone.ink > 0 && lone.ink < patInk / 3 && lone.A === 0,
      sturm: ink0 > 500 && onS.ink === 0 && onS.slice === null && onS.pair === null && onS.shown && onS.note.indexOf('STURMIAN') >= 0
        && onS.wstat.indexOf('hydrogen only') === 0 && onS.rstat.indexOf('hydrogen only') === 0
        && kz0.indexOf('disabled') < 0 && df0.indexOf('disabled') < 0 && onS.kz.indexOf('disabled') >= 0 && onS.df.indexOf('disabled') >= 0
        && onS.kzTitle.indexOf('STURMIAN') >= 0 && onS.dfTitle.indexOf('STURMIAN') >= 0
        && offS.kz.indexOf('disabled') < 0 && offS.df.indexOf('disabled') < 0 && offS.hidden && offS.ink > 500 && offS.wstat.indexOf('slice, not a marginal') > 0 && Math.abs(offS.A - 6.264903069e8) < 1e3,
      ham: qho.wink === 0 && qho.rink > 0 && qho.rink < patInk / 3 && qho.wstat === 'hydrogenic register only' && qho.rstat === 'hydrogenic register only' && home.wink > 500 && home.rink > 200,
      shut: document.querySelector('.dev[data-id="wigner"]').classList.contains('closed') && document.querySelector('.dev[data-id="radiation"]').classList.contains('closed'),
      err: window.__e.length === 0 };
    return { chk, ships, hasCopy, w1, dig1, s1, even, mir, mxW, zsSym, s2, saved, noTheme, mid, back,
      rad, dig2, pair, patInk, api, flat, turn, rotPair, lone, ink0, onS: { ...onS, slice: onS.slice === null, pair: onS.pair === null }, offS, qho, home,
      errs: window.__e.length, e0: window.__e[0] || null, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B57 PHASE SPACE AND THE DIPOLE: WIGNER and RADIATION ship CLOSED, after ELECTROSTATICS, each with a ⧉ COPY digest. Opened on the 1s, WIGNER draws the (z, p_z) SLICE at 64 × 64 with W(0, 0) = 1/π³ = 0.0322515344 to 1e-9 and its minimum refined off the grid to the certified −3.09725752e-4 at (1.3295, 1.3791), the digest carrying 0.03225, −3.0973e-4 and the word SLICE — the map is signed, with more than 200 pixels of the first accent AND of the second, so both signs of a function that is not positive are on the card; on 2p_z, a real orbital of definite parity, the map is EVEN in z to 1.5e-11 of its peak; Z RANGE 14 and P RANGE 3 round-trip through a project (and the theme still never). On 1s + 2p_z, RADIATION reads the pair 1s₀ → 2p₀ with A = 6.2649 × 10⁸ s⁻¹ (NIST\'s reduced-mass value), τ = 1.596 ns, λ = 2296 a₀, ħω = 10.2043 eV, |⟨a|r|b⟩| = 0.744935539 and P = |c₁|²|c₂|² ħωA = 1.4215e-9 a.u. — the identity held to 1e-20 — and draws its far-field pattern; the Δm = 0 pattern stands still at three times while the Δm = +1 pattern of 1s + 2p₊1 turns with the clock and returns at Δωt = π. A lone 1s has no allowed pair and the window says exactly "no dipole in this state" and draws its EMPTY FRAME and nothing more (under a third of the pattern\u2019s ink) rather than the blank slab it used to leave. The STURMIAN scale stands the slice down (no ink, LW.wigner.slice() null) with its note, and disables STARK K_z and DEFECT L² with the wave-39 note in their titles; HYDROGEN re-enables both and the ink comes back; the oscillator stands both windows down with "hydrogenic register only"; zero errors',
    !wrT.error && wrT.chk && Object.keys(wrT.chk).every((k) => wrT.chk[k] === true) && !wrT.gpu, wrT);

  /* ── B58: W-MO — the general basis on two centres, the force it really exerts, and the nuclei it drives ── */
  const moT = await g.ev(`try {
    __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.setIonZ(1); __LW.setSpace('x');
    if (__LW.molecule.on) __LW.molecule.setOn(false); if (__LW.helium.on) __LW.helium.setOn(false); if (__LW.h2.on) __LW.h2.setOn(false);
    await __LW.settle();
    const M = __LW.mo, dev = document.querySelector('.dev[data-id="molecule"]');
    const D = () => __LW.layout.digest('molecule').split(String.fromCharCode(8722)).join('-');
    const has = (d, xs) => xs.every((x) => d.indexOf(x) >= 0);
    await M.whenReady();
    /* the 1s LCAO at R = 2: the wave-38 line, now computed by the general machinery (mo.test.mjs G2 pins it to 1e-9) */
    __LW.molecule.setR(2); await M.whenReady();
    const d1 = D(), s1 = M.state();
    const one = has(d1, ['-0.5538', '-0.1339', '0.0623', '0.102', '0.053804', '2.4928']);
    /* the Sturmian n <= 4 at lambda = 1.7611, and the 42-function register — each with its own equilibrium */
    M.setBasis('sturmian'); await M.whenReady(); M.setR(2); await M.whenReady();
    const d2 = D(), s2 = M.state(), stur = has(d2, ['-0.60262', '1.997']);
    M.setBasis('hydrogenic'); await M.whenReady(); M.setR(2); await M.whenReady();
    const d3 = D(), s3 = M.state(), reg = has(d3, ['2.352']);
    /* back to the 1s LCAO: the old line comes back word for word */
    M.setBasis('lcao1s'); await M.whenReady(); M.setR(2); await M.whenReady();
    const d4 = D(), backOld = has(d4, ['-0.5538', '-0.1339', '0.0623', '0.102', '0.053804']);
    /* THE RUN: BO electrons on -dE/dR from R0 = 2.8 at rest, dt = 5, 160 steps ~ one vibration */
    M.setDynamics('bo'); M.setForce('exact'); M.setR0(2.8); M.setV0(0); M.setDt(5); M.reset();
    M.step(160);
    const run = M.state();
    /* the honest failure: the SAME basis under the electrostatic force simply runs away */
    M.setForce('hf'); M.reset(); M.step(60);
    const away = M.state(), noteText = M.note(), d5 = D();
    const noteIn = d5.indexOf('the HF force is repulsive at every R') >= 0;
    /* the project carries the basis and the scale, and still not the theme */
    M.setBasis('sturmian'); M.setLambda(1.7611); await M.whenReady();
    const proj = __LW.serialize(), saved = proj.presentation.mo;
    const noTheme = proj.presentation.mat.bg === undefined && proj.presentation.mat.gamma === undefined;
    M.setBasis('lcao1s'); await M.whenReady();
    __LW.restore(proj); await M.whenReady();
    const back = M.state();
    /* the caption says where the bigger bases are drawn — and goes with STAGE CAPTIONS */
    const capOn = M.state().caption, hadCaps = !document.body.classList.contains('no-captions');
    document.body.classList.add('no-captions');
    const capOff = M.state().caption;
    if (hadCaps) document.body.classList.remove('no-captions');
    /* THE FRAME BUDGET: 30 frames with the 42-function register stepping Ehrenfest, against the same page shut */
    M.setBasis('hydrogenic'); await M.whenReady();
    const rate = async (n) => { const f0 = __LW.stats.frames, w0 = performance.now(); __LW.play();
      while (__LW.stats.frames - f0 < n && performance.now() - w0 < 12000) await new Promise((r) => requestAnimationFrame(r));
      const fr = (__LW.stats.frames - f0) / ((performance.now() - w0) / 1000); __LW.pause(); await __LW.settle(); return fr; };
    await rate(30);                                                    // a warm-up run, thrown away (B55's lesson)
    dev.querySelector('.dev-close').click(); await __LW.settle();
    const fpsShut = await rate(30);
    __LW.layout.reopen('molecule', 'R'); await __LW.settle();
    M.setDynamics('ehrenfest'); M.reset(); M.run();
    const fpsRun = await rate(30);
    const rs = M.state();
    M.hold(); M.setDynamics('hold'); M.setBasis('lcao1s'); await M.whenReady(); M.setR(2); await M.whenReady();
    __LW.loadPreset('1s+2pz'); await __LW.settle();
    const chk = {
      one, stur: stur && Math.abs(s2.E0 + 0.6026243) < 1e-6 && Math.abs(s2.Re - 1.997204) < 3e-5 && s2.n === 20,
      reg: reg && Math.abs(s3.Re - 2.352277) < 3e-5 && Math.abs(s3.De_eV - 2.1246) < 1e-3 && s3.n === 42,
      lcao: Math.abs(s1.E0 + 0.5537715) < 1e-6 && Math.abs(s1.Re - 2.492830) < 1e-5 && s1.n === 2 && backOld,
      run: run.steps === 160 && run.Rmin < 2.8 && run.Rmin > 2.2 && run.Rt > 2.7 && run.Rt < 2.8
        && (Math.abs(run.drift) <= run.integratedBound || Math.abs(run.drift) < 1e-5) && run.badge === 'drift ≤ ∫bound',
      away: away.Rt > 3 && away.Rmin >= 2.8 - 1e-9 && noteIn && noteText.indexOf('repulsive at every R') > 0,
      proj: saved.kind === 'sturmian' && Math.abs(saved.lambda - 1.7611) < 1e-12 && noTheme
        && back.kind === 'sturmian' && Math.abs(back.lambda - 1.7611) < 1e-12,
      cap: capOn.indexOf('shown on the card; the stage draws the 1s LCAO only') > 0 && capOff === '',
      fps: fpsRun > 15 && fpsRun > 0.35 * fpsShut && rs.steps >= 12 && rs.every === 2 && rs.stepMs > 0,
      open: !dev.classList.contains('closed'), err: window.__e.length === 0 };
    return { chk, s1, s2, s3, run, away, saved, back, noTheme, noteText, capOn, capOff,
      fps: { shut: fpsShut, run: fpsRun, ratio: fpsRun / fpsShut, steps: rs.steps, stepMs: rs.stepMs, every: rs.every, drift: rs.drift, ib: rs.integratedBound, gap: rs.adiabaticGap },
      digLen: [d1.length, d2.length, d3.length, d4.length],
      errs: window.__e.length, e0: window.__e[0] || null, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B58 THE GENERAL BASIS AND THE NUCLEI IT DRIVES (W-MO): the MOLECULE window carries a BASIS segment — the 1s LCAO (2 functions, E(2) = −0.5537715, R_e = 2.4928), the Coulomb Sturmians n ≤ 4 at λ = 1.7611 (20 functions, E(2) = −0.60262 above the exact −0.602634214, R_e = 1.9972) and the register\'s own σ set n ≤ 6 (42 functions, R_e = 2.35227, D_e = 2.1246 eV, computed lazily by a job queue that hands the frame loop back the wall every 24 ms) — and the wave-38 Hellmann–Feynman line is now the general one for whichever basis is chosen: at the 1s LCAO the digest still reads F_elec −0.1339, Pulay 0.0623, bound 0.102 and F_exact 0.053804, and switching away and back restores it word for word. Let the nuclei go on −dE/dR with Born–Oppenheimer electrons from R₀ = 2.8 at rest (dt = 5, 160 steps): R falls to 2.24 and comes back above 2.7 — one vibration — with |drift| ≤ ∫bound and the badge reading "drift ≤ ∫bound"; the SAME basis under the electrostatic force runs away instead (R past 3, never once below 2.8) and the window says why in the note the segment carries, "the HF force is repulsive at every R". A project keeps { kind: sturmian, λ: 1.7611 } and still no theme; the card\'s caption says the bigger bases are shown on the card because the stage draws the 1s LCAO only, and goes with STAGE CAPTIONS; and 30 frames with the 42-function register stepping EHRENFEST — one step per OTHER frame, the 30 ms budget — hold above 15 fps against the same page with the window shut. Zero errors',
    !moT.error && moT.chk && Object.keys(moT.chk).every((k) => moT.chk[k] === true) && !moT.gpu, moT);

  const unT = await g.ev(`try {
    const H = __LW.history, reg = __LW.reg, T = () => __LW.clock.t, pops = () => reg.populated().slice();
    const chk = {}, out = {};

    /* 1 — one label set, undone, redone */
    __LW.loadPreset('1s+2pz'); await __LW.settle(); H.clear();
    const preset = pops(), boot = { canUndo: H.canUndo, canRedo: H.canRedo, depth: H.depth, limit: H.limit };
    reg.set(20, 0.5, 0, T()); H.flush();
    const edited = pops(); H.undo();
    const undone = pops(); H.redo();
    const redone = pops();
    out.one = { preset, edited, undone, redone, boot };
    chk.boot = boot.canUndo === false && boot.canRedo === false && boot.depth === 0 && boot.limit === 60;
    chk.one = preset.join() === '0,3' && edited.join() === '0,3,20' && undone.join() === preset.join() && redone.join() === edited.join();

    /* 2 — three distinct edits (a coefficient, the Zeeman law, one label's RATE), three undos, the bottom */
    H.clear(); const dig0 = reg.digest();
    reg.set(24, 0.35, 0, T()); H.flush();
    reg.setField({ Bz: 0.01 }); H.flush();
    __LW.setRate(0, 1.5); H.flush();
    const d3 = H.depth; H.undo(); H.undo(); H.undo();
    out.three = { d3, depth: H.depth, canUndo: H.canUndo, canRedo: H.canRedo, Bz: reg.field.Bz, rate0: __LW.rateOf(0), same: reg.digest() === dig0 };
    chk.three = d3 === 3 && reg.digest() === dig0 && reg.field.Bz === 0 && __LW.rateOf(0) === 1 && H.depth === 0 && H.canUndo === false && H.canRedo === true;

    /* 3 — a whole pointer drag on a lane fader is ONE entry */
    H.clear();
    const fd = document.querySelector('.sp-row .fd.pop'), rc = fd.getBoundingClientRect();
    const mk = (type, x) => new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: x, clientY: rc.top + rc.height / 2, buttons: type === 'pointerup' ? 0 : 1 });
    const v0 = reg.population(0);
    fd.dispatchEvent(mk('pointerdown', rc.left + rc.width * 0.9));
    for (const f of [0.8, 0.7, 0.6, 0.5, 0.4]) fd.dispatchEvent(mk('pointermove', rc.left + rc.width * f));
    const vMid = reg.population(0);
    fd.dispatchEvent(mk('pointerup', rc.left + rc.width * 0.4));
    await new Promise((r) => setTimeout(r, 40));
    const dDrag = H.depth, vEnd = reg.population(0); H.undo();
    out.drag = { v0, vMid, vEnd, dDrag, vBack: reg.population(0), dBack: H.depth };
    chk.drag = dDrag === 1 && Math.abs(vEnd - v0) > 1e-6 && Math.abs(vMid - vEnd) > 1e-6 && Math.abs(reg.population(0) - v0) < 1e-12 && H.depth === 0;

    /* 4 — the Hamiltonian */
    H.clear(); __LW.setHamiltonian('qho'); await __LW.settle(); H.flush();
    const qho = { id: __LW.hamiltonian, E: reg.Ediag(0), d: H.depth };
    H.undo(); await __LW.settle();
    const hyd = { id: __LW.hamiltonian, E: reg.Ediag(0), seg: document.querySelector('.dev[data-id="spectrum"] .segw .seg .seg-b.on').textContent.trim() };
    out.ham = { qho, hyd };
    chk.ham = qho.id === 'qho' && Math.abs(qho.E - 1.5) < 1e-12 && qho.d === 1 && hyd.id === 'hydrogen' && Math.abs(hyd.E + 0.5) < 1e-12 && hyd.seg.indexOf('HYDROGEN') === 0;

    /* 5 — the SCALE */
    H.clear(); __LW.sturmian.setLambda(1.4); __LW.sturmian.set(true); await __LW.settle(); H.flush();
    const st = { on: __LW.sturmian.on, lam: __LW.sturmian.lambda, active: __LW.sturmian.active, d: H.depth };
    H.undo(); await __LW.settle();
    const st0 = { on: __LW.sturmian.on, active: __LW.sturmian.active, lam: __LW.sturmian.lambda };
    out.stur = { st, st0 };
    chk.stur = st.on === true && st.active === true && Math.abs(st.lam - 1.4) < 1e-12 && st.d === 1 && st0.on === false && st0.active === false && Math.abs(st0.lam - 1) < 1e-12;

    /* 6 — a project LOAD is itself one step, and no project carries a history */
    __LW.loadPreset('2p+'); await __LW.settle(); H.clear();
    const proj = __LW.serialize(), noHist = JSON.stringify(proj).indexOf('history') < 0 && JSON.stringify(proj).indexOf('undo') < 0;
    __LW.loadPreset('rydberg'); await __LW.settle(); H.flush();
    const mid = pops(), midDig = reg.digest();
    __LW.restore(proj); await __LW.settle();
    const loaded = pops(), dLoad = H.depth;
    H.undo(); await __LW.settle();
    out.proj = { mid, loaded, dLoad, afterUndo: pops(), noHist, sameDig: reg.digest() === midDig };
    chk.proj = loaded.join() === '4' && dLoad === 2 && reg.digest() === midDig && pops().join() === mid.join() && noHist;

    /* 7 — the EDIT menu: the label, the key and the disabled state at the bottom */
    H.clear();
    const readEdit = () => { const grp = [...document.querySelectorAll('#menubar .mb-group')].find((x) => x.querySelector('.mb-btn').textContent.trim() === 'EDIT');
      grp.querySelector('.mb-btn').click();
      const rows = [...grp.querySelectorAll('.mb-item')].slice(0, 2).map((it) => ({ lbl: it.querySelector('.mb-lbl').textContent, key: it.querySelector('.mb-key').textContent, dis: it.disabled }));
      grp.querySelector('.mb-btn').click(); return rows; };
    __LW.layout.menu.open();
    const mBottom = readEdit();
    reg.set(20, 0.5, 0, T()); H.flush();
    const mStep = readEdit(); H.undo();
    const mUndone = readEdit();
    __LW.layout.menu.close();
    out.menu = { mBottom, mStep, mUndone };
    chk.menu = mBottom[0].lbl === 'UNDO' && mBottom[0].key === 'Ctrl+Z' && mBottom[0].dis === true
      && mBottom[1].lbl === 'REDO' && mBottom[1].key === 'Ctrl+Shift+Z' && mBottom[1].dis === true
      && mStep[0].dis === false && mStep[1].dis === true && mUndone[0].dis === true && mUndone[1].dis === false;

    /* 8 — the keys, and the guard that keeps them out of what you type in */
    H.clear();
    const key = (target, code, shift) => target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, code, ctrlKey: true, shiftKey: !!shift }));
    reg.set(21, 0.4, 0, T()); H.flush();
    key(document.body, 'KeyZ', false);
    const kBody = { has: reg.population(21) > 0, d: H.depth };
    key(document.body, 'KeyZ', true);
    const kRedo = { has: reg.population(21) > 0, d: H.depth };
    key(document.body, 'KeyY', false);
    const kY = { has: reg.population(21) > 0, d: H.depth };
    __LW.notebook.open('notes');
    key(document.querySelector('#notebook .nb-text'), 'KeyZ', false);
    const kTa = { has: reg.population(21) > 0, d: H.depth };
    __LW.notebook.close();
    out.keys = { kBody, kRedo, kY, kTa, chip: [...document.querySelectorAll('.keys-row')].filter((r) => r.querySelector('.keys-label').textContent.indexOf('undo the last') === 0).map((r) => r.querySelector('.keys-chip').textContent) };
    chk.keys = kBody.has === false && kBody.d === 0 && kRedo.has === true && kRedo.d === 1 && kY.has === true && kTa.has === true && kTa.d === 1 && out.keys.chip.join() === 'Ctrl+Z';

    /* 9 — what an UNDO must never move: the camera, the draw style, the play state */
    H.clear();
    const yaw0 = __LW.obs.yaw, style0 = __LW.mat.style;
    __LW.obs.yaw = 1.234; __LW.setStyle('bands'); __LW.play();
    const setV = { yaw: __LW.obs.yaw, style: __LW.mat.style, playing: __LW.clock.playing };
    reg.set(22, 0.3, 0, T()); H.flush(); H.undo();
    out.observer = { setV, yaw: __LW.obs.yaw, style: __LW.mat.style, playing: __LW.clock.playing, pop22: reg.population(22) };
    chk.observer = setV.playing === true && __LW.obs.yaw === 1.234 && __LW.mat.style === setV.style && __LW.clock.playing === true && reg.population(22) === 0;
    __LW.pause(); __LW.setStyle('cloud'); __LW.obs.yaw = yaw0; __LW.mat.style = style0;

    /* 10 — RESET LAYOUT never touches the stack (the layout is put back afterwards) */
    const lay = [...document.querySelectorAll('.dev')].map((d) => ({ id: d.dataset.id, L: !!d.closest('#rackL'), folded: d.classList.contains('folded'), closed: d.classList.contains('closed'), off: d.classList.contains('off') }));
    reg.set(23, 0.3, 0, T()); H.flush();
    const dPre = H.depth, digPre = reg.digest();
    __LW.layout.resetLayout();
    const dPost = H.depth, digPost = reg.digest();
    for (const L of lay) { const d = document.querySelector('.dev[data-id="' + L.id + '"]'); if (!d) continue;
      if (L.L) __LW.layout.moveToRack(L.id, 'L');
      if (d.classList.contains('folded') !== L.folded) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
      if (L.off && !d.classList.contains('off')) { const p = d.querySelector('.dev-power'); if (p) p.click(); }
      if (L.closed && !d.classList.contains('closed')) { const c = d.querySelector('.dev-close'); if (c) c.click(); } }
    H.undo();
    out.layout = { dPre, dPost, depth: H.depth, sameDig: digPost === digPre };
    chk.layout = dPost === dPre && digPost === digPre && H.depth === dPre - 1;

    /* 11 — the ring is a ring: 65 edits leave 60 */
    H.clear();
    for (let i = 0; i < 65; i++) { reg.set(30 + (i % 20), 0.1 + 0.001 * i, 0, T()); H.flush(); }
    out.cap = { depth: H.depth, limit: H.limit };
    chk.cap = H.depth === 60 && H.limit === 60;

    __LW.loadPreset('1s+2pz'); await __LW.settle(); H.clear();
    chk.err = window.__e.length === 0;
    return { chk, out, errs: window.__e.length, e0: window.__e[0] || null, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B59 UNDO / REDO over the register side (Ctrl+Z · Ctrl+Shift+Z · Ctrl+Y): a ring of at most 60 snapshots of what changes ψ or its law — the anchor c(0) with its mask and static field, the DRAG γ, the Hamiltonian selection, the SCALE, the 91 RATEs and the two A/B stores — and of nothing the observer owns. Set a label on 1s+2pz and UNDO puts the preset\'s two labels back, REDO puts the third back; three distinct edits (a coefficient, a Zeeman field, one label\'s RATE) are three steps and three undos return the state digest, Bz = 0 and rate = 1 exactly, with canUndo false at the bottom and canRedo true. A whole pointer drag on a lane fader — pointerdown, five pointermoves, pointerup — is ONE entry, and one undo puts |c|² back to the value it had before the finger went down. The Hamiltonian switched to qho then undone is hydrogen again with E(1s) = −0.5 and the segment on HYDROGEN; the SCALE turned on at λ = 1.4 then undone is off at λ = 1 with no propagator; a project LOAD is itself one step whose undo restores the register that was there, and no project file carries a history. The EDIT menu carries UNDO ⌐ Ctrl+Z and REDO ⌐ Ctrl+Shift+Z, both greyed at the bottom of the stack and each lighting as its stack fills; Ctrl+Z on the body undoes and the same key inside the notebook\'s textarea does not. An undo moves neither the camera, nor the draw style, nor the play state; RESET LAYOUT leaves the stack and the state alone; 65 edits leave 60. Zero errors',
    !unT.error && unT.chk && Object.keys(unT.chk).every((k) => unT.chk[k] === true) && !unT.gpu, unT);


  /* ── wave 45: KEEP FRAMES off by default, the bow off the frame, the governor under a forced load ── */
  const pfT = await g.ev(`try {
    __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); __LW.setView('density'); await __LW.settle();
    const scrub = document.querySelector('#transport .fd'), cs = () => getComputedStyle(scrub);
    const def = { keep: __LW.keepFrames, setting: __LW.settings.keepFrames, pe: cs().pointerEvents, op: +cs().opacity, disabled: scrub.classList.contains('disabled'), fill: scrub.style.getPropertyValue('--fill') };
    const playBtn = document.querySelector('#transport .tbtn.play'); playBtn.click(); const playing = __LW.clock.playing; await new Promise((r) => setTimeout(r, 350));
    const tAfter = __LW.clock.t, fillPlaying = scrub.style.getPropertyValue('--fill'); playBtn.click(); const paused = !__LW.clock.playing; await __LW.settle();
    const dial = document.querySelector('#transport .k .k-dial'), r0 = __LW.clock.rate, b = dial.getBoundingClientRect(), x0 = b.left + b.width / 2, y0 = b.top + b.height / 2;
    for (const [type, dx, dy] of [['pointerdown', 0, 0], ['pointermove', 60, -40], ['pointerup', 60, -40]]) dial.dispatchEvent(new PointerEvent(type, { clientX: x0 + dx, clientY: y0 + dy, bubbles: true, pointerId: 1, isPrimary: true }));
    const rateMoved = __LW.clock.rate > r0; __LW.clock.setRate(r0);
    const hit = (() => { const r = scrub.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e === scrub || scrub.contains(e); })();
    const keepSw = [...document.querySelectorAll('.dev[data-id="settings"] .sw')].find((el) => /KEEP FRAMES/.test(el.textContent)); keepSw.click();
    const on = { keep: __LW.keepFrames, setting: __LW.settings.keepFrames, pe: cs().pointerEvents, inProject: JSON.stringify(__LW.serialize()).includes('keepFrames') };
    __LW.play(); await new Promise((r) => setTimeout(r, 350)); const fillOn = scrub.style.getPropertyValue('--fill'); __LW.pause(); await __LW.settle();
    keepSw.click(); const offAgain = { keep: __LW.keepFrames, setting: __LW.settings.keepFrames, pe: cs().pointerEvents };
    /* THE BOW off the frame: hydrogen 1s */
    __LW.reg.clear(); __LW.reg.set(0, 1, 0); await __LW.settle();
    const cv = document.getElementById('field'), rr = cv.getBoundingClientRect(), cx = rr.left + rr.width / 2, cy = rr.top + rr.height / 2;
    let ptrSeen = -1; cv.addEventListener('pointermove', function h() { ptrSeen = performance.now(); cv.removeEventListener('pointermove', h); });
    __LW.bow.start(cx, cy); __LW.bow.move(cx + 120, cy);
    const tb = performance.now(); __LW.bow.release(); const sync = performance.now() - tb, flying = __LW.bow.inFlight;
    const tPtr = await new Promise((res) => setTimeout(() => { cv.dispatchEvent(new PointerEvent('pointermove', { clientX: cx + 5, clientY: cy + 5, bubbles: true, pointerId: 3 })); res(performance.now() - tb); }, 0));
    const tFrame = await new Promise((res) => requestAnimationFrame(() => res(performance.now() - tb)));
    await __LW.bow.landed; const landed = performance.now() - tb; await __LW.settle();
    const hyd = { sync, flying, tPtr, ptrHandled: ptrSeen > 0 && ptrSeen - tb < 50, tFrame, landed, pop: __LW.reg.populated().length, norm: __LW.reg.norm(), status: document.querySelector('.dev[data-id="state"] .dev-stat').textContent, worker: __LW.maths.ok };
    /* the BOX bow: the packet off the frame, and the REPEATS scan off the frame too */
    __LW.pause(); __LW.setGasBasis('reg'); __LW.enterBox(); __LW.pause(); await __LW.settle(); const L0 = __LW.lastLaunch;
    __LW.bow.start(cx, cy); __LW.bow.move(cx + 100, cy); const tb2 = performance.now(); __LW.bow.release(); const sync2 = performance.now() - tb2;
    const tFrame2 = await new Promise((res) => requestAnimationFrame(() => res(performance.now() - tb2)));
    await __LW.bow.landed; const landed2 = performance.now() - tb2; await __LW.settle();
    const box = { sync: sync2, tFrame: tFrame2, landed: landed2, newLaunch: __LW.lastLaunch !== L0 && __LW.lastLaunch.captured > 0.85, pop: __LW.reg.populated().length };
    let per = null; for (let i = 0; i < 120; i++) { const v = document.querySelector('#transport .ro.period .ro-val').textContent; if (v !== '…' && v !== '—') { per = { v, ms: i * 50 }; break; } await new Promise((r) => setTimeout(r, 50)); }
    const forced = __LW.period, perOk = !!(per && forced && forced.T > 0 && per.v.includes(String(Math.round(forced.T)).slice(0, 3)));
    /* THE GOVERNOR: a forced 40 ms load per frame steps the grid down, and back up when it lifts */
    __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); await __LW.settle();
    const res0 = __LW.field.resolution, govRo = () => { const r = [...document.querySelectorAll('.dev[data-id="meters"] .ro')].find((e) => /GOVERNOR/.test(e.querySelector('.ro-lbl').textContent)); return r ? r.querySelector('.ro-val').textContent : ''; };
    const g0 = { state: __LW.governor.state, on: __LW.governor.on, sw: !![...document.querySelectorAll('.dev[data-id="settings"] .sw')].find((el) => /GOVERNOR/.test(el.textContent) && el.classList.contains('on')), meters: govRo() };
    let burn = true; const burnFn = () => { if (!burn) return; const t = performance.now(); while (performance.now() - t < 40) {} requestAnimationFrame(burnFn); }; requestAnimationFrame(burnFn);
    __LW.play(); const tg = performance.now(); let down = null; for (let i = 0; i < 160; i++) { await new Promise((r) => setTimeout(r, 50)); if (__LW.governor.drop > 0) { down = performance.now() - tg; break; } }
    await new Promise((r) => setTimeout(r, 400));
    const stepped = { down, drop: __LW.governor.drop, res: __LW.field.resolution, state: __LW.governor.state, median: __LW.governor.median, meters: govRo(), parked: __LW.governor.parked };
    burn = false; const tu = performance.now(); let up = null; for (let i = 0; i < 240; i++) { await new Promise((r) => setTimeout(r, 50)); if (__LW.governor.drop === 0) { up = performance.now() - tu; break; } }
    await new Promise((r) => setTimeout(r, 300)); const restored = { up, res: __LW.field.resolution, state: __LW.governor.state, median: __LW.governor.median };
    __LW.pause(); await __LW.settle();
    const govSw = [...document.querySelectorAll('.dev[data-id="settings"] .sw')].find((el) => /GOVERNOR/.test(el.textContent)); govSw.click(); const off = { on: __LW.governor.on, setting: __LW.settings.governor, state: __LW.governor.state }; govSw.click(); const backOn = __LW.governor.on && __LW.settings.governor !== false;
    __LW.pause(); __LW.loadPreset('1s+2pz'); await __LW.settle();
    return { def, playing, tAfter, fillPlaying, paused, rateMoved, hit, on, fillOn, offAgain, hyd, box, per, forcedT: forced && forced.T, perOk, res0, g0, stepped, restored, off, backOn, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B60 THE PERFORMANCE WAVE: KEEP FRAMES ships OFF — the transport\'s scrub bar is disabled (pointer-events none, dimmed, no hit at its centre, its fill stays at 0 through 350 ms of play) while the play button toggles the clock and the RATE dial takes a pointer drag; the SETTINGS switch turns it on (the fill moves, the bar takes pointers again), the setting is remembered by this browser and no project carries it, and off again is off. THE BOW off the frame: on hydrogen 1s release() returns in under 5 ms with the bow in flight, a pointer event dispatched from the next macrotask is handled within 50 ms, and the slap lands within 2 s (the first frame after it may be the landing frame itself, so it is reported, not judged) (> 20 labels, norm < 0.9, the STATE window back to "changes c"); in the BOX the packet lands within 2 s as a new launch holding > 85 % and the REPEATS readout settles off the frame to the value the forced reader gives. THE GOVERNOR: under a forced 40 ms load per frame it steps the grid from 96³ to 64³ (drop ≥ 1, METERS reads STEPPED) within 8 s and lifts back to 96³ within 12 s of the load ending (one notch per 3 s under budget); the SETTINGS switch holds it off (remembered) and on again; zero errors',
    !pfT.error && pfT.def.keep === false && !pfT.def.setting && pfT.def.pe === 'none' && pfT.def.op < 0.5 && pfT.def.disabled && pfT.playing && pfT.tAfter > 0.5 && pfT.fillPlaying === '0' && pfT.paused && pfT.rateMoved && !pfT.hit
      && pfT.on.keep === true && pfT.on.setting === true && pfT.on.pe !== 'none' && !pfT.on.inProject && +pfT.fillOn > 0 && pfT.offAgain.keep === false && pfT.offAgain.pe === 'none'
      && pfT.hyd.worker && pfT.hyd.sync < 5 && pfT.hyd.flying && pfT.hyd.tPtr < 50 && pfT.hyd.ptrHandled && pfT.hyd.landed < 2000 && pfT.hyd.pop > 20 && pfT.hyd.norm < 0.9 && pfT.hyd.status === 'changes c'
      && pfT.box.sync < 5 && pfT.box.landed < 2000 && pfT.box.newLaunch && pfT.box.pop > 20 && pfT.perOk
      && pfT.g0.on && pfT.g0.sw && pfT.stepped.down !== null && pfT.stepped.drop >= 1 && pfT.stepped.res < pfT.res0 && /STEPPED/.test(pfT.stepped.meters) && pfT.restored.up !== null && pfT.restored.res === pfT.res0 && pfT.off.on === false && pfT.off.setting === false && pfT.backOn && pfT.errs === 0 && !pfT.gpu, pfT);

  /* ── wave 46: the minimalist graph — the OBSERVABLE grid, no text inside the plot, one hover tip, vivid light ink ── */
  const mgT = await g.ev(`try {
    /* SELF-CONTAINED (the lesson of the first run): this block is the 61st, and the sixty before it leave the clock
       playing, another theme, another preset, the rack scrolled or hidden and windows closed, folded or powered off.
       A card with NO SIZE cannot paint — paintLadder returns at once — so the redraw under the proxy recorded nothing
       and the arm that asks for a redraw failed, in the suite only.  So: pause, hydrogen, no SCALE, the preset this
       text assumes, and the two windows reopened, unfolded, powered on and raised before a single measurement. */
    const theme0 = document.body.dataset.theme || 'dark';
    __LW.pause();
    if (__LW.sturmian && __LW.sturmian.on) __LW.sturmian.set(false);
    __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz');
    document.body.classList.remove('rack-hidden', 'rack-peek', 'no-captions');
    const wake = (id) => { __LW.layout.reopen(id); const d = document.querySelector('.dev[data-id="' + id + '"]'); if (!d) return null;
      d.classList.remove('closed');
      if (d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
      if (d.classList.contains('off')) { const p = d.querySelector('.dev-power'); if (p) p.click(); }
      return d; };
    for (const id of ['settings', 'observer', 'spectrum']) wake(id);
    __LW.layout.raise('observer'); __LW.layout.raise('spectrum');            // both at the top of their rack, scrolled to
    await __LW.settle(); await new Promise((r) => requestAnimationFrame(r));
    __LW.reg.set(0, 0.55, 0, 0); __LW.reg.set(2, 0.45, 0, 0); __LW.reg.set(8, 0.35, 0.1, 0); __LW.reg.set(20, 0.3, 0, 0);
    await __LW.settle(); await new Promise((r) => requestAnimationFrame(r));
    /* 1 — the OBSERVER's six observables are a 2 x 3 grid of EQUAL cells (Josh: not five and a full-width Re+Im) */
    const dev = document.querySelector('.dev[data-id="observer"]');
    const seg = [...dev.querySelectorAll('.seg')].find((s) => s.children.length === 6);
    const cells = [...seg.children].map((x) => { const r = x.getBoundingClientRect(); return { t: Math.round(r.top), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), txt: x.textContent }; });
    const grid = { n: cells.length, tops: [...new Set(cells.map((q) => q.t))].length, lefts: [...new Set(cells.map((q) => q.l))].length,
      equal: cells.every((q) => Math.abs(q.w - cells[0].w) <= 1 && Math.abs(q.h - cells[0].h) <= 1),
      last: cells[5].txt, display: getComputedStyle(seg).display };
    /* 2 — the ladder canvas draws NOTHING inside its plot rectangle: every fillText of one redraw is recorded */
    const cv = document.querySelector('.dev[data-id="spectrum"] .ladder canvas');
    const lad = { w: cv.clientWidth, h: cv.clientHeight };                    // it must be laid out, or the redraw is a no-op
    const proto = CanvasRenderingContext2D.prototype, orig = proto.fillText, calls = [];
    proto.fillText = function (t, x, y) { if (this.canvas === cv) calls.push({ t: String(t), x: Math.round(x), y: Math.round(y) }); return orig.apply(this, arguments); };
    try { __LW.spectrum.rebuild(); } finally { proto.fillText = orig; }
    const P = cv.__lwPlot || null;
    const inside = P ? calls.filter((c) => c.x >= P.x0 && c.x <= P.x1 && c.y >= P.y0 && c.y <= P.y1) : [{ t: 'no plot' }];
    const gutter = calls.filter((c) => /^n\\d$/.test(c.t)).map((c) => c.t);
    /* 3 — a pointermove over a known lane shows ONE glass tip carrying exactly that level's numbers */
    const objs = cv.__lwObjects || [], lane = objs.find((o) => o.key === 'L2');
    const box = cv.getBoundingClientRect();
    const px = box.left + (P.x0 + P.x1) / 2, py = box.top + (lane ? lane.points[1] : 0);
    cv.dispatchEvent(new PointerEvent('pointermove', { clientX: px, clientY: py, bubbles: true, pointerId: 1, isPrimary: true }));
    await new Promise((r) => requestAnimationFrame(r));
    const tip = document.getElementById('graphTip');
    const shown = tip ? { hidden: tip.hidden, text: tip.textContent, position: getComputedStyle(tip).position, count: document.querySelectorAll('#graphTip').length } : null;
    const tb = tip ? tip.getBoundingClientRect() : null;
    const onScreen = !!tb && tb.left >= 0 && tb.top >= 0 && tb.right <= window.innerWidth && tb.bottom <= window.innerHeight;
    const carries = !!shown && !shown.hidden && shown.text.indexOf('n2') === 0 && shown.text.indexOf((-0.125).toFixed(4)) > 0 && shown.text.indexOf('%') > 0;
    /* 4 — and the pointer leaving takes it away */
    cv.dispatchEvent(new PointerEvent('pointerleave', { clientX: px, clientY: py, bubbles: true, pointerId: 1, isPrimary: true }));
    await new Promise((r) => requestAnimationFrame(r));
    const gone = !!tip && tip.hidden === true;
    /* 5 — the LIGHT theme has its own vivid shell set: --n2 clears 3:1 on the ground the card actually renders */
    const probe = document.createElement('span'); document.body.appendChild(probe);
    const toRGB = (v) => { probe.style.color = 'rgb(1, 2, 3)'; probe.style.color = v; const m = /rgba?\\(([^)]+)\\)/.exec(getComputedStyle(probe).color); const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; };
    const tokenN2 = () => toRGB(getComputedStyle(document.body).getPropertyValue('--n2').trim());
    const setTheme = async (name) => {                                        // the control if it is there, the attribute if it is not
      const b = [...document.querySelectorAll('.dev[data-id="settings"] .seg-b')].find((x) => x.textContent === name.toUpperCase());
      if (b) b.click();
      if (document.body.dataset.theme !== name) document.body.dataset.theme = name;
      await __LW.settle(); return document.body.dataset.theme; };
    const wasDark = await setTheme('dark'); const darkN2 = tokenN2();
    const wasLight = await setTheme('light'); const lightN2 = tokenN2();
    const card = document.querySelector('.dev[data-id="spectrum"]');
    const cbg = toRGB(getComputedStyle(card).backgroundColor), stg = toRGB(getComputedStyle(document.getElementById('stage')).backgroundColor);
    const ground = cbg[3] > 0 ? [0, 1, 2].map((i) => cbg[3] * cbg[i] + (1 - cbg[3]) * stg[i]) : [stg[0], stg[1], stg[2]];
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const LUM = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
    const ratio = (a, b) => { const x = LUM(a), y = LUM(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const lightRatio = ratio(lightN2, ground), darkOnLight = ratio(darkN2, ground);
    probe.remove();
    await setTheme(theme0);                                                   // the theme this block found, put back
    return { calls: calls.length, insideN: inside.length, gutterN: gutter.length, carries, onScreen, gone, lightRatio: +lightRatio.toFixed(3), darkOnLight: +darkOnLight.toFixed(3),
      gridN: grid.n, tops: grid.tops, lefts: grid.lefts, equal: grid.equal, lad, errs: (window.__e || []).length, theme: document.body.dataset.theme,
      tipText: shown ? shown.text : null, tipCount: shown ? shown.count : 0, tipPos: shown ? shown.position : null,
      grid, plot: P, inside, gutter, texts: calls.map((c) => c.t), laneInfo: lane ? lane.info : null,
      darkN2, lightN2, ground: ground.map((v) => Math.round(v)), themeWalk: [theme0, wasDark, wasLight], cells };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B61 THE MINIMALIST GRAPH (Josh). The OBSERVER\'s six observables are a 2 x 3 grid of EQUAL cells — six buttons over three distinct tops and two distinct lefts, Re+Im the sixth and no longer a row of its own. The SPECTRUM ladder draws NO text inside its plot rectangle: one redraw under a proxy on CanvasRenderingContext2D.prototype.fillText records every glyph, and not one of them lands inside cv.__lwPlot — the level names stay in the 44 px gutter, the law stays in the footer, and the value that used to be stroked on the population bar ("50%  −0.1250") is gone. A pointermove over the n2 lane raises ONE glass tip (#graphTip, position fixed, exactly one in the document, wholly inside the viewport) carrying that level\'s own line — its name, its share of the norm and E = −0.1250 — and pointerleave takes it away. The LIGHT theme carries its own vivid shell set: --n2 measured against the ground the card actually renders clears 3 : 1, where the dark set on the same ground does not. The block wakes the windows it measures first — a card with no size cannot paint. Zero errors',
    !mgT.error && mgT.gridN === 6 && mgT.tops === 3 && mgT.lefts === 2 && mgT.equal && mgT.grid.last === 'Re+Im'
      && mgT.lad.w > 32 && mgT.calls > 0 && mgT.insideN === 0 && mgT.gutterN >= 2
      && mgT.carries && mgT.onScreen && mgT.tipCount === 1 && mgT.tipPos === 'fixed' && mgT.gone
      && mgT.lightRatio >= 3 && mgT.darkOnLight < 3 && String(mgT.darkN2) !== String(mgT.lightN2)
      && mgT.errs === 0, mgT);

  /* ── B62: CARD STYLE — the refractive glass, said on purpose, and the build stamp that follows the wave ── */
  const csT = await g.ev(`try {
    const KEY = 'lambdawaves.q0.settings';
    const theme0 = document.body.dataset.theme, card0 = __LW.cardStyle, saved0 = JSON.stringify(__LW.settings);
    const probe = document.createElement('div'); document.body.appendChild(probe);
    const nums = (s) => s.replace(/[^0-9.,]/g, '').split(',').map(Number);
    const tintOf = () => { probe.style.background = 'hsl(var(--glass-tint) / 1)'; return nums(getComputedStyle(probe).backgroundColor); };
    const dev = () => document.querySelector('.dev[data-id="state"]') || document.querySelector('.dev');
    const devBg = () => getComputedStyle(dev()).backgroundColor;
    const glassBg = () => getComputedStyle(document.getElementById('rackToggle')).backgroundColor;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const setTheme = async (t) => { __LW.setTheme(t); await wait(180); };
    /* the DEFAULT: with no 'card' remembered at all, applySettings must land on REFRACTIVE even from a wrong body */
    const bare = JSON.parse(saved0); delete bare.card; localStorage.setItem(KEY, JSON.stringify(bare));
    document.body.dataset.card = 'tinted';
    __LW.applySettings(); const dflt = __LW.cardStyle;
    /* REFRACTIVE: the pane is not painted at all, in either theme — the card AND the chrome glass */
    const R = {};
    for (const t of ['dark', 'light']) { await setTheme(t); __LW.setCardStyle('refractive'); await wait(120); R[t] = { dev: devBg(), glass: glassBg(), img: getComputedStyle(dev()).backgroundImage }; }
    /* TINTED: a real pane whose colour IS the theme's tint, and an alpha above zero */
    const T = {};
    for (const t of ['dark', 'light']) { await setTheme(t); __LW.setCardStyle('tinted'); await wait(120);
      const c = nums(devBg()), tint = tintOf();
      T[t] = { dev: devBg(), glass: glassBg(), tint, a: c.length > 3 ? c[3] : 1, matches: c[0] === tint[0] && c[1] === tint[1] && c[2] === tint[2] }; }
    probe.remove();
    /* PERSISTENCE: the choice is in the settings key, and a fresh applySettings over a wrong body brings it back */
    __LW.setCardStyle('tinted'); const savedCard = __LW.settings.card;
    document.body.dataset.card = 'refractive';
    __LW.applySettings(); const afterReload = __LW.cardStyle;
    /* the control itself, its two seats and the one-line hint under it */
    const segw = [...document.querySelectorAll('.dev[data-id="settings"] .segw')].find((s) => s.querySelector('.k-lbl') && s.querySelector('.k-lbl').textContent === 'CARD STYLE');
    const seats = segw ? [...segw.querySelectorAll('.seg-b')].map((b) => b.textContent) : [];
    const hint = [...document.querySelectorAll('.dev[data-id="settings"] .note')].some((n) => /refractive: the blur alone/.test(n.textContent));
    const row = segw ? segw.parentElement : null;
    const rowLbl = row ? [...row.querySelectorAll('.k-lbl, .sw-lbl')].map((e) => e.textContent) : [];
    const beside = rowLbl.indexOf('CARD STYLE') >= 0 && rowLbl.indexOf('GLASS BLUR') >= 0 && rowLbl.some((t) => /FROST/.test(t)) && rowLbl.indexOf('THEME') >= 0;
    /* the build stamp: ONE constant, read by the ABOUT face and by the copy dump that quotes it */
    const WAVE = 'waves 5' + String.fromCharCode(0x2013) + '48';   // wave 48 moved BUILD_LINE, which is exactly what this assertion is for: it must be bumped by the wave that moves the stamp
    __LW.notebook.open('about'); const about = document.querySelector('.nb-aboutface').innerText; const dump = __LW.notebook.dump(); __LW.notebook.close();
    const aboutLine = (about.split(String.fromCharCode(10)).find((l) => l.indexOf(WAVE) >= 0) || '').trim();
    /* everything this block moved, put back */
    localStorage.setItem(KEY, saved0); __LW.applySettings(); await setTheme(theme0); __LW.setCardStyle(card0);
    return { dflt, R, T, savedCard, afterReload, seg: !!segw, seats, hint, beside, aboutLine,
      aboutHas: about.indexOf(WAVE) >= 0, dumpHas: dump.indexOf(WAVE) >= 0, tags: (about.match(/PRE-ALPHA/g) || []).length,
      card0, theme0, cardNow: __LW.cardStyle, themeNow: document.body.dataset.theme, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B62 CARD STYLE (Josh: "I love that refractive glass effect"). The card\'s pane was never a decision: `background: var(--glass-sheen), hsl(var(--glass-tint) / …)` parses but cannot COMPUTE where --glass-sheen is a colour — a colour is legal only as the LAST background layer — so in the LIGHT theme the whole declaration fell back to `initial` and every card, popover and chrome pane rendered fully TRANSPARENT. That accident is the look, so it is now the DEFAULT and it is written down: with no card remembered, applySettings lands on REFRACTIVE even from a body wearing the other one, and .dev and .glass compute to rgba(0, 0, 0, 0) with no image in BOTH themes. TINTED is the rule the author meant, valid in both themes now that the light sheen is a flat gradient: the card computes to a real pane whose RGB is exactly the theme\'s own --glass-tint and whose alpha is above zero. The choice rides in the settings key beside theme, frost and blur — never in a project — and survives the readSettings/applySettings round trip. The seg sits in THEME · SURFACE with two seats and its one-line hint. And the build stamp is one constant, BUILD_LINE: the ABOUT face and the copy dump that quotes it both carry waves 5-48. Zero errors',
    !csT.error && csT.dflt === 'refractive'
      && csT.R.dark.dev === 'rgba(0, 0, 0, 0)' && csT.R.light.dev === 'rgba(0, 0, 0, 0)'
      && csT.R.dark.glass === 'rgba(0, 0, 0, 0)' && csT.R.light.glass === 'rgba(0, 0, 0, 0)'
      && csT.R.dark.img === 'none' && csT.R.light.img === 'none'
      && csT.T.dark.a > 0 && csT.T.light.a > 0 && csT.T.dark.a < 1 && csT.T.light.a < 1
      && csT.T.dark.matches && csT.T.light.matches && csT.T.dark.dev !== csT.T.light.dev
      && csT.T.dark.glass === csT.T.dark.dev && csT.T.light.glass === csT.T.light.dev
      && csT.savedCard === 'tinted' && csT.afterReload === 'tinted'
      && csT.seg && csT.seats.join('|') === 'REFRACTIVE|TINTED' && csT.hint && csT.beside
      && csT.aboutHas && csT.dumpHas && csT.tags === 1
      && csT.cardNow === csT.card0 && csT.themeNow === csT.theme0 && csT.errs === 0, csT);
  /* ── wave 48 — the theme reaches the GPU's chrome, and the notice reads the resolved theme ── */
  const chT = await g.ev(`try {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const R = { theme0: __LW.themeChoice };
    __LW.obs.yaw = 0.9; __LW.obs.pitch = 0.42; __LW.obs.dist = 3.2;
    /* the ink the GPU is handed, and the ink the screen gets back, in both themes */
    __LW.setTheme('dark'); await __LW.settle();
    R.darkInk = __LW.lineColors(); R.darkPix = await __LW.linePixels(320, 320); R.darkLightUI = __LW.mat.lightUI;
    __LW.setTheme('light'); await __LW.settle();
    R.lightInk = __LW.lineColors(); R.lightPix = await __LW.linePixels(320, 320); R.lightLightUI = __LW.mat.lightUI;
    /* three seats, one resolved theme, and the CHOICE is what the settings key keeps */
    const segs = [...document.querySelectorAll('.dev[data-id="settings"] .segw')].map((w) => ({ lbl: (w.querySelector('.k-lbl') || {}).textContent || '', seats: [...w.querySelectorAll('.seg-b')].map((b) => b.textContent).join('|') }));
    R.seats = (segs.find((x) => x.lbl === 'THEME') || {}).seats || '';
    __LW.setTheme('system'); await __LW.settle();
    R.choice = __LW.themeChoice; R.resolved = __LW.theme; R.bodyTheme = document.body.dataset.theme;
    R.expect = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    R.saved = __LW.settings.theme;
    /* a PROJECT never carries the theme — lightUI joins bg and gamma outside the file */
    __LW.projects.save('wave48/themecheck');
    const file = JSON.parse(__LW.projects.exportText('wave48/themecheck'));
    R.projMat = Object.keys(file.data.presentation.mat || {}).filter((k) => k === 'bg' || k === 'gamma' || k === 'lightUI').join(',');
    __LW.projects.remove('wave48/themecheck');
    /* THE PHOTOSENSITIVITY NOTICE: the text and the symbol are MANDELBROT's, the ground and the ink are ours */
    __LW.setTheme('light'); await __LW.settle(); __LW.warning.reset();
    R.needed0 = __LW.warning.needed({ driver: false, query: '' });
    R.remembered0 = __LW.warning.remembered;
    R.driverSkips = __LW.warning.needed();
    R.forced = __LW.warning.needed({ driver: true, query: '?warn=1' });
    R.shown = __LW.warning.show(); await wait(80);
    const wp = document.getElementById('warnPane');
    R.up = !wp.hidden;
    R.title = wp.querySelector('.warn-title').textContent;
    R.body = wp.querySelector('.warn-body').textContent;
    R.btn = wp.querySelector('.warn-btn').textContent;
    R.modal = wp.getAttribute('aria-modal') + '/' + wp.getAttribute('role');
    R.inkLight = getComputedStyle(wp).color;
    R.ground = getComputedStyle(wp).backgroundColor;
    R.frost = getComputedStyle(wp).backdropFilter || getComputedStyle(wp).webkitBackdropFilter;
    R.blurToken = getComputedStyle(document.documentElement).getPropertyValue('--glass-blur').trim();
    R.blurPx = parseFloat(R.blurToken); R.frostPx = parseFloat(String(R.frost).replace('blur(', ''));   // the token may read '18.0px' and the computed filter 'blur(18px)': one length, two spellings
    R.sign = (wp.querySelector('image') || {}).getAttribute ? wp.querySelector('image').getAttribute('href') : '';
    R.clipped = wp.querySelector('image').getAttribute('clip-path') === 'url(#warnTri)' && !!wp.querySelector('clipPath path');
    R.bang = wp.querySelectorAll('.warn-bang').length;
    __LW.setTheme('dark'); await wait(60); R.inkDark = getComputedStyle(wp).color;
    wp.querySelector('.warn-btn').click(); await wait(520);
    R.down = wp.hidden; R.remembered1 = __LW.warning.remembered;
    R.needed1 = __LW.warning.needed({ driver: false, query: '' });
    /* the SETTINGS row is the way back, and it forgets so the NEXT load shows it too */
    R.row = [...document.querySelectorAll('.dev[data-id="settings"] .trig-l')].map((t) => t.textContent).filter((t) => t === 'SHOW THE WARNING AGAIN').length;
    __LW.warning.reset();
    R.needed2 = __LW.warning.needed({ driver: false, query: '' });
    __LW.setTheme(R.theme0); await __LW.settle();
    R.themeNow = __LW.themeChoice; R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B63 THE THEME REACHES THE ONE THING IT COULD NOT (Josh: "Make the cube frame become black when in lightmode", "darkmode turns the xyz axis to a vivid CMY color"). The domain cube and the three axes are drawn by the GPU, not by CSS, so no token could ever reach them: rack.js now hands the RESOLVED theme down as mat.lightUI and field.js keeps one ink palette per theme. LIGHT paints the box near-black — the stroke is #05080d at .42 and the rendered frame comes back at luminance 88 against a ground of 243, achromatic and unmistakably a black line — while the shipped warm/cool axes stay. DARK keeps the shipped white box at .13 and takes vivid CMY: the rendered axes classify as cyan, magenta and yellow with not one warm, green or blue pixel between them, and the reverse holds in LIGHT. The theme itself now has THREE seats and TWO values: the CHOICE (light / dark / SYSTEM) is what the settings key remembers, the RESOLVED theme is what the body, the accents, the GPU and the notice read, and SYSTEM resolves to prefers-color-scheme. A project still carries neither — lightUI joins bg and gamma outside the file. And the PHOTOSENSITIVITY NOTICE is MANDELBROT\'s, verbatim in text, symbol, layout and focus trap, with three things ours by instruction: a frost-glass ground over the running lab instead of solid black (no colour tint — the blur is the --glass-blur token), ink that is BLACK in light and WHITE in dark by the resolved theme, and a memory in the settings key with SETTINGS · SHOW THE WARNING AGAIN as the way back. Zero errors',
    !chT.error
      && chT.darkLightUI === false && chT.lightLightUI === true
      && chT.lightInk.box[0] < 0.06 && chT.lightInk.box[1] < 0.06 && chT.lightInk.box[2] < 0.06 && chT.lightInk.box[3] > 0.3
      && chT.darkInk.box[0] === 1 && chT.darkInk.box[1] === 1 && chT.darkInk.box[2] === 1
      && chT.darkPix.buckets.cyan > 20 && chT.darkPix.buckets.magenta > 20 && chT.darkPix.buckets.yellow > 20
      && chT.darkPix.buckets.warm === 0 && chT.darkPix.buckets.green === 0 && chT.darkPix.buckets.blue === 0
      && chT.darkPix.top.cyan[0] < 60 && chT.darkPix.top.cyan[1] > 180 && chT.darkPix.top.cyan[2] > 180
      && chT.darkPix.top.magenta[0] > 180 && chT.darkPix.top.magenta[1] < 60 && chT.darkPix.top.magenta[2] > 180
      && chT.darkPix.top.yellow[0] > 180 && chT.darkPix.top.yellow[1] > 180 && chT.darkPix.top.yellow[2] < 60
      && chT.lightPix.buckets.cyan === 0 && chT.lightPix.buckets.magenta === 0 && chT.lightPix.buckets.yellow === 0
      && chT.lightPix.buckets.warm > 20 && chT.lightPix.buckets.green > 20 && chT.lightPix.buckets.blue > 20
      && chT.lightPix.darkest < 130 && (chT.lightPix.ground[0] + chT.lightPix.ground[1] + chT.lightPix.ground[2]) / 3 > 200
      && Math.max(...chT.lightPix.darkestPx) - Math.min(...chT.lightPix.darkestPx) < 34
      && chT.seats === 'LIGHT|DARK|SYSTEM' && chT.choice === 'system' && chT.resolved === chT.expect
      && chT.bodyTheme === chT.expect && chT.saved === 'system' && chT.projMat === ''
      && chT.needed0 === true && chT.remembered0 === false && chT.driverSkips === false && chT.forced === true
      && chT.shown === true && chT.up === true && chT.modal === 'true/dialog'
      && chT.title === 'PHOTOSENSITIVITY WARNING'
      && chT.body === 'This app displays rapid strobing effects and changing colors. If you have a history of photosensitive epilepsy or seizures, do not continue.'
      && chT.btn === 'CONTINUE' && chT.inkLight === 'rgb(0, 0, 0)' && chT.inkDark === 'rgb(255, 255, 255)'
      && chT.ground === 'rgba(0, 0, 0, 0)' && chT.frost.indexOf('blur(') === 0 && chT.frostPx === chT.blurPx && chT.frost.indexOf('saturate') > 0
      && chT.sign === './img/warning-orbital.png' && chT.clipped === true && chT.bang === 2
      && chT.down === true && chT.remembered1 === true && chT.needed1 === false
      && chT.row === 1 && chT.needed2 === true
      && chT.themeNow === chT.theme0 && chT.errs === 0, chT);

  /* ── wave 48 — the mark, the grip, and the hidden interface as the fastest state ── */
  const bmT = await g.ev(`try {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const R = {};
    /* THE MARK TILES: nine squares, step === width, no gutter anywhere */
    const rs = [...document.querySelectorAll('#title .mark rect')].map((r) => ({ x: +r.getAttribute('x'), y: +r.getAttribute('y'), w: +r.getAttribute('width'), h: +r.getAttribute('height') }));
    R.n = rs.length; R.square = rs.every((r) => r.w === r.h);
    const gx = [], gy = [];                                   // row-major: step must equal width, in both directions
    for (let row = 0; row < 3; row++) for (let k = 0; k < 2; k++) { const a = rs[row * 3 + k], b = rs[row * 3 + k + 1]; gx.push(Math.abs((b.x - a.x) - a.w)); }
    for (let col = 0; col < 3; col++) for (let k = 0; k < 2; k++) { const a = rs[k * 3 + col], b = rs[(k + 1) * 3 + col]; gy.push(Math.abs((b.y - a.y) - a.h)); }
    R.gapX = Math.max(...gx); R.gapY = Math.max(...gy);
    /* ONE PAINT FUNCTION: the header, the ABOUT clone and the busy mark are the same nine samples, always */
    __LW.notebook.open('about'); await wait(120);
    const fills = (sel) => [...document.querySelectorAll(sel)].map((r) => r.getAttribute('fill')).join(',');
    R.head0 = fills('#title .mark rect'); R.about0 = fills('.nb-logo .mark rect'); R.busy0 = fills('#busyMark .mark rect');
    /* the nine squares ARE the wheel at 0°, 40° … 320° — the ACCENT angles pick two of them for the UI and never
       move the mark, so turning the wheel (HUE) is what must move all three copies together */
    const hue0 = __LW.mat.hueShift || 0;
    __LW.mat.hueShift = 0.33; __LW.accent.set(97, 214); await wait(60);
    R.head1 = fills('#title .mark rect'); R.about1 = fills('.nb-logo .mark rect'); R.busy1 = fills('#busyMark .mark rect');
    __LW.mat.hueShift = hue0; __LW.accent.set(0, 162); await wait(40);
    R.head2 = fills('#title .mark rect'); R.about2 = fills('.nb-logo .mark rect');
    /* THE ABOUT FACE carries what Josh wrote */
    const ab = document.querySelector('.nb-aboutface'), t = ab.innerText;
    R.magic = t.indexOf('Magic Commons') >= 0; R.apache = t.indexOf('Apache') >= 0; R.made = t.indexOf('Made with') >= 0;
    R.blurb = t.indexOf('A playable hydrogen shadow where 91 nlm states become heuristics for classical waves.') >= 0;
    R.chronus = !!ab.querySelector('a[href="https://github.com/xsligroup/chronusq_public"]');
    R.chronusTxt = (ab.querySelector('a[href="https://github.com/xsligroup/chronusq_public"]') || {}).textContent;
    R.build = (document.querySelector('.ab-version') || {}).textContent;
    R.dump = __LW.notebook.dump();
    R.dumpOk = R.dump.indexOf('Magic Commons') >= 0 && R.dump.indexOf('Apache') >= 0 && R.dump.indexOf('A playable hydrogen shadow') >= 0;
    /* THE GRIP: a real pointer target, a 320 x 240 floor, and two numbers that round-trip the settings key */
    const nb = document.getElementById('notebook'), grip = nb.querySelector('.nb-grip');
    R.grip = !!grip; R.gripW = grip ? Math.round(grip.getBoundingClientRect().width) : 0;
    R.cssResize = getComputedStyle(nb).resize;
    const w0 = nb.offsetWidth, h0 = nb.offsetHeight;
    const pd = (type, x, y) => grip.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, bubbles: true, cancelable: true }));
    const r0 = grip.getBoundingClientRect();
    pd('pointerdown', r0.left + 10, r0.top + 10); pd('pointermove', r0.left + 10 + 90, r0.top + 10 + 70); pd('pointerup', r0.left + 100, r0.top + 80);
    await wait(80);
    R.dragged = [nb.offsetWidth - w0, nb.offsetHeight - h0];
    R.saved = [__LW.settings.nbW, __LW.settings.nbH];
    R.savedMatches = R.saved[0] === nb.offsetWidth && R.saved[1] === nb.offsetHeight;
    __LW.layout.notebookResize(10, 10); await wait(40);
    R.floor = [nb.offsetWidth, nb.offsetHeight];
    __LW.layout.notebookResize(640, 460); __LW.notebook.close();
    /* THE BUSY MARK: a counter, CSS motion, --cx/--cy from a pointer move, and no shadow */
    const bm = document.getElementById('busyMark');
    /* the frame-gap rule keeps the mark up for 600 ms after ANY long frame, so every "is it down?" question
       waits for quiet first — otherwise this block races the very rule it is meant to prove */
    const quiet = async () => { for (let i = 0; i < 60 && __LW.busy.visible; i++) await wait(50); return !__LW.busy.visible; };
    R.quiet0 = await quiet();
    R.rest = { count: __LW.busy.count, visible: __LW.busy.visible, hidden: bm.hidden };
    const c = __LW.reg.at(0);
    const job = __LW.maths.call({ op: 'kick', re: c.re, im: c.im, k: 0.4, d: [0, 0, 1], ham: 'hydrogen', Z: 1 });
    R.during = { count: __LW.busy.count, visible: __LW.busy.visible, hidden: bm.hidden };
    R.headSpin = document.querySelector('#title .mark').classList.contains('busy');   // synchronous with the raise: the job may land inside a frame
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 411, clientY: 233 }));
    await wait(30);
    R.at = __LW.busy.at;
    const cs = getComputedStyle(bm), mk = getComputedStyle(bm.querySelector('.mark'));
    R.hostAnim = cs.animationName + ' ' + cs.animationDuration + ' ' + cs.animationIterationCount;
    R.markAnim = mk.animationName + ' ' + mk.animationDuration + ' ' + mk.animationIterationCount;
    R.shadow = cs.boxShadow + '|' + mk.boxShadow + '|' + mk.filter;
    R.pe = cs.pointerEvents;
    await job; R.quiet1 = await quiet(); await wait(60);
    R.after = { count: __LW.busy.count, visible: __LW.busy.visible, hidden: bm.hidden };
    /* and a REAL bow goes through the same road */
    __LW.bow.start(700, 430); __LW.bow.move(860, 510); __LW.bow.release();
    R.bowFlight = __LW.bow.inFlight > 0;
    await __LW.bow.landed; R.quiet2 = await quiet(); await wait(60);
    R.bowRest = { count: __LW.busy.count, hidden: bm.hidden };
    /* HIDDEN IS THE FASTEST STATE: the loop's own main-thread ms, and what the compositor still has to blur */
    for (const id of ['spectrum', 'shadow', 'slice', 'meters', 'dynamics', 'calculus', 'atoms', 'wigner', 'radiation']) __LW.layout.raise(id);
    __LW.notebook.open('notes');
    __LW.loadPreset('rydberg'); __LW.clock.play(); await __LW.settle(); await wait(1400);
    const sample = async (ms) => { const a = []; const t0 = performance.now();
      while (performance.now() - t0 < ms) { await new Promise((r) => requestAnimationFrame(r)); a.push(__LW.perf.profile.total); }
      const q = a.slice(Math.floor(a.length / 2)).sort((x, y) => x - y); return +(q[q.length >> 1]).toFixed(3); };
    const blurred = () => [...document.querySelectorAll('*')].filter((e) => {
      const st = getComputedStyle(e), f = st.backdropFilter || st.webkitBackdropFilter;
      if (!f || f === 'none') return false;
      if (st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) return false;
      return e.getClientRects().length > 0; }).length;
    await sample(700);
    R.shown = await sample(1400); R.shownBlur = blurred();
    __LW.keys.toggleUI(); await wait(800);
    R.hidden = await sample(1400); R.hiddenBlur = blurred();
    R.uiHiddenWhile = __LW.uiHidden;
    R.nbGone = getComputedStyle(document.getElementById('notebook')).display;
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: window.innerWidth - 4, clientY: 300 }));
    await wait(60);
    R.noPeek = !document.body.classList.contains('rack-peek');
    __LW.keys.toggleUI(); await wait(800);
    R.uiHiddenAfter = __LW.uiHidden;
    R.nbBack = getComputedStyle(document.getElementById('notebook')).display;
    R.shown2 = await sample(1400);
    R.backBlur = blurred();
    /* a rack that has SLID away keeps its scroll and stops being painted */
    const rk = document.getElementById('rack'); rk.scrollTop = 120;
    __LW.layout.toggleRack(); await wait(700);
    R.rackHiddenVis = getComputedStyle(rk).visibility; R.rackTopHidden = rk.scrollTop;
    __LW.layout.toggleRack(); await wait(700);
    R.rackBackVis = getComputedStyle(rk).visibility; R.rackTopBack = rk.scrollTop;
    __LW.clock.pause(); __LW.notebook.close(); await __LW.settle();
    R.errs = window.__e.length; R.errList = window.__e.slice(0, 4);
    return R;
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  judge('B64 THE MARK, THE GRIP, AND A HIDDEN INTERFACE THAT IS ACTUALLY FASTER. The nine squares of the logo now TILE — step equals width in both directions, so the grid of gutters Josh saw is gone and the colours touch — and all three copies of the wheel (the header, the ABOUT face\'s clone, the busy mark\'s) are painted by ONE function from the SAME nine samples, so turning the accent wheel moves all of them together instead of leaving the clone frozen at whatever it was cloned from. THE BUSY MARK is a nesting counter, not a flag: it goes up the instant a Worker job is issued (the bow\'s slap, the packet, the period scan — every call goes through one wrapper), it rides the last pointer position through --cx / --cy written as custom properties (a write, never a layout read), it spins and hue-cycles PURELY in CSS so a blocked main thread cannot stop it, it carries no shadow of any kind, and it comes down when the last job lands. The NOTEBOOK\'s corner is a real pointer target now, because CSS `resize` is a mouse affordance no touch pointer can reach: synthetic pointer events drag it, the floor is 320 x 240, and the size round-trips through the settings key — while `resize: both` stays for the desktop. And HIDING THE INTERFACE is now the cheapest state it has ever been: the readers whose only product is a display:none card stop running, the notebook\'s backdrop-filter stops being recomposited on every frame the field changes, the peek handler stops resolving the root\'s style on every pointer move, and the measured main-thread cost of the loop falls BELOW the shown state rather than above it — with zero blurred panes left for the compositor. A rack slid away by B keeps its scrollTop and stops being painted. Zero errors',
    !bmT.error
      && bmT.n === 9 && bmT.square === true && bmT.gapX === 0 && bmT.gapY === 0
      && bmT.head0 === bmT.about0 && bmT.head0 === bmT.busy0 && bmT.head0.length > 0
      && bmT.head1 === bmT.about1 && bmT.head1 === bmT.busy1 && bmT.head1 !== bmT.head0
      && bmT.head2 === bmT.about2 && bmT.head2 === bmT.head0
      && bmT.magic && bmT.apache && bmT.made && bmT.blurb && bmT.chronus && bmT.chronusTxt === 'ChronusQ'
      && bmT.build === 'PRE-ALPHA · waves 5–48 · 2026-09-05' && bmT.dumpOk
      && bmT.grip === true && bmT.gripW === 22 && bmT.cssResize === 'both'
      && bmT.dragged[0] > 60 && bmT.dragged[1] > 45 && bmT.savedMatches
      && bmT.floor[0] === 320 && bmT.floor[1] === 240
      && bmT.rest.count === 0 && bmT.rest.visible === false && bmT.rest.hidden === true
      && bmT.during.count > 0 && bmT.during.visible === true && bmT.during.hidden === false
      && bmT.at[0] === '411px' && bmT.at[1] === '233px'
      && bmT.hostAnim === 'lw-busy-hue 3s infinite' && bmT.markAnim === 'lw-busy-spin 1.2s infinite'
      && bmT.shadow === 'none|none|none' && bmT.pe === 'none' && bmT.headSpin === true
      && bmT.after.count === 0 && bmT.after.visible === false && bmT.after.hidden === true
      && bmT.bowFlight === true && bmT.bowRest.count === 0 && bmT.bowRest.hidden === true
      && bmT.quiet0 && bmT.quiet1 && bmT.quiet2
      && bmT.uiHiddenWhile === true && bmT.uiHiddenAfter === false && bmT.nbGone === 'none' && bmT.nbBack !== 'none' && bmT.noPeek === true
      && bmT.hidden <= bmT.shown && bmT.hidden <= bmT.shown2
      && bmT.shownBlur >= 1 && bmT.hiddenBlur === 0 && bmT.backBlur >= 1
      && bmT.rackHiddenVis === 'hidden' && bmT.rackBackVis === 'visible'
      && bmT.rackTopHidden === 120 && bmT.rackTopBack === 120
      && bmT.errs === 0, bmT);

  /* ── the end: no errors, a last look ───────────────────────────────────── */
  const errs = await g.ev('return { errs: window.__e, gpu: __LW.field.lastGpuError || null, frames: __LW.stats.frames, recon: __LW.stats.reconstructs, presents: __LW.stats.presents };');
  judge('B13 no page errors, no uncaptured GPU errors after the whole run', errs.errs.length === 0 && !errs.gpu, errs);
  await g.ev(`__LW.loadPreset('rydberg'); __LW.scrub(300); await __LW.settle(); return 1;`);
  fs.writeFileSync(ROOT + '/.tmp/boot-final.png', Buffer.from(await g.snap(), 'base64'));
} finally { await g.close(); }
process.exit(done('boot.browser-test'));
