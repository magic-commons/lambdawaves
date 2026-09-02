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
  const muteTap = await g.tap('.sp-row .mute');
  const muted = await g.ev('await __LW.settle(); const m = __LW.meters(); const on = __LW.reg.muted[__LW.reg.populated()[0]]; __LW.setMute(__LW.reg.populated()[0], false); await __LW.settle(); return { on: !!on, rendered: m.rendered };');
  judge('B11 tapping a lane\'s M mutes it through the same road', muteTap.ok === 1 && muted.on && muted.rendered === 1, { muteTap, muted });

  /* ── round trip ─────────────────────────────────────────────────────────── */
  const rt = await g.ev(`__LW.scrub(5.5); await __LW.settle(); const d0 = __LW.stateDigest(), t0 = __LW.clock.t; const s = JSON.parse(JSON.stringify(__LW.serialize()));
    __LW.loadPreset('1s'); await __LW.settle(); const mid = __LW.stateDigest(); __LW.restore(s); await __LW.settle();
    return { same: d0 === __LW.stateDigest(), t: __LW.clock.t === t0, changedInBetween: mid !== d0, status: s.experiment.status, basis: s.experiment.basis };`);
  judge('B12 Q7: serialize → load another preset → restore reproduces the state and the logical time, with its status label', rt.same && rt.t && rt.changedInBetween && rt.status === 'EXACT ANALYTIC', rt);

  /* ── the end: no errors, a last look ───────────────────────────────────── */
  const errs = await g.ev('return { errs: window.__e, gpu: __LW.field.lastGpuError || null, frames: __LW.stats.frames, recon: __LW.stats.reconstructs, presents: __LW.stats.presents };');
  judge('B13 no page errors, no uncaptured GPU errors after the whole run', errs.errs.length === 0 && !errs.gpu, errs);
  await g.ev(`__LW.loadPreset('rydberg'); __LW.scrub(300); await __LW.settle(); return 1;`);
  fs.writeFileSync(ROOT + '/.tmp/boot-final.png', Buffer.from(await g.snap(), 'base64'));
} finally { await g.close(); }
process.exit(done('boot.browser-test'));
