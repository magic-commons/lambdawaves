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
    K('KeyC'); K('KeyC'); await __LW.settle();
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

  /* ── the end: no errors, a last look ───────────────────────────────────── */
  const errs = await g.ev('return { errs: window.__e, gpu: __LW.field.lastGpuError || null, frames: __LW.stats.frames, recon: __LW.stats.reconstructs, presents: __LW.stats.presents };');
  judge('B13 no page errors, no uncaptured GPU errors after the whole run', errs.errs.length === 0 && !errs.gpu, errs);
  await g.ev(`__LW.loadPreset('rydberg'); __LW.scrub(300); await __LW.settle(); return 1;`);
  fs.writeFileSync(ROOT + '/.tmp/boot-final.png', Buffer.from(await g.snap(), 'base64'));
} finally { await g.close(); }
process.exit(done('boot.browser-test'));
