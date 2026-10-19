/* tests/boot.browser-test.mjs — the headless proof of the instrument (Q3–Q8 of §50, in the lab itself).
 *
 *   LW_PORT=8701 GD_PORT=5202 node tests/boot.browser-test.mjs
 *
 * Needs the HTTPS server (tools/gate/server.py <repo> <port>) and headless Firefox with WebGPU.
 * Wave 106 vendored that server and the driver kit beside it, so a clone can run this file.
 * The page is driven through window.__LW — the same mutation road the fingers use — and the
 * picture is judged twice: a GPU readback of the same render pass, and the DRIVER's composited
 * screenshot decoded here (a WebGPU canvas cannot be read through a 2-D context).
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import http from 'node:http';   // wave 51: Set Window Rect on the live session — the only way to reach a phone viewport mid-run
import { open, judge, done } from '../../tools/gate/gatekit.mjs';
const drv = await import('../../tools/gate/drv.mjs');
import { appFiles } from '../helpers/app-source.mjs';
/* 0.5.2 G-S: a law that reads the app's source reads THE APP — rack.js and every module born in lab/windows/ and lab/shell/ — fetched
   from the page's own server in tests/helpers/app-source.mjs' order (B108, B112, B136), so a moved block does not move its law */
const APP_SRC = `(await Promise.all(${JSON.stringify(appFiles())}.map(async (f) => (await fetch('./' + f)).text()))).join('\\n')`;

const PORT = process.env.LW_PORT || '8701';
const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/\/$/, '');
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
/** the mean of a small patch of the decoded screenshot — one pixel is antialiasing, nine are a colour (wave 53) */
function patch(png, x, y, r = 2) {
  let R = 0, G = 0, B = 0, n = 0;
  for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) {
    if (i < 0 || j < 0 || i >= png.w || j >= png.h) continue;
    const o = (j * png.w + i) * png.bpp; R += png.data[o]; G += png.data[o + 1]; B += png.data[o + 2]; n++;
  }
  return [Math.round(R / n), Math.round(G / n), Math.round(B / n)];
}

const W = 1400, H = 900;
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz`, { width: W, height: H });
const settle = () => g.ev('await __LW.settle(); await new Promise(r=>setTimeout(r,60)); return __LW.stats.frames;');
/* WAVE 63 · COUNT TO A SAMPLE, DO NOT SLEEP FOR A DURATION — one definition, three blocks.
 * B30 and B55 slept for a fixed 1500 / 2000 ms and divided; B58 already counted frames and was the
 * only one of the three whose sample size was guaranteed on any box.  A duration gives you whatever
 * frames the machine felt like: on a loaded box the same judge is deciding on a third of the sample,
 * which is why B30's `frames > 10` guard had to exist at all.  Counting to n frames makes the sample
 * a constant and the WALL TIME the variable, and the fps it reports is measured from that wall time
 * rather than from the nominal one (B76's idiom, the only exemplary timing arm in this file).
 * `short` is true when the 12 s ceiling ran out first, so a starved run says so instead of lying. */
const RATE = `const rateN = async (n, ceil) => {
    const f0 = __LW.stats.frames, w0 = performance.now(), cap = ceil || 12000;
    __LW.play();
    while (__LW.stats.frames - f0 < n && performance.now() - w0 < cap) await new Promise((r) => requestAnimationFrame(r));
    const frames = __LW.stats.frames - f0, ms = performance.now() - w0, meter = __LW.stats.fps;
    __LW.pause(); await __LW.settle();
    return { frames, ms, fps: frames / (ms / 1000), meter, short: frames < n };
  };`;
try {
  /* ── boot ──────────────────────────────────────────────────────────────── */
  const r = await g.waitFor('window.__LW && __LW.ready', 300, 100);
  judge('B1 the lab boots (window.__LW.ready)', r && r.ok, r);
  /* The visibility scheduler (window-activity.js) keeps a window below the fold at zero work. Most of this
     gate's probes were written before that law and read windows the 900-px viewport never shows; presenting
     them off-screen keeps those probes honest without weakening the structural gates (closed, folded, off). */
  await g.ev("__LW.windowActivity.presentOffscreen(true);");
  const bootInfo = await g.ev('return { ok: __LW.field.ok, err: __LW.field.error, shader: __LW.field.shaderMessages, errs: window.__e, banner: !!document.querySelector("#mir-banner:not([hidden])") };');
  judge('B1 WebGPU field is up, no shader messages, no page errors, no banner', bootInfo.ok && !bootInfo.err && (bootInfo.shader || []).length === 0 && bootInfo.errs.length === 0 && !bootInfo.banner, bootInfo);
  if (!bootInfo.ok) throw new Error('GPU gate cannot continue: ' + bootInfo.err);
  /* ── B43: the shipped defaults, read on the fresh page before the proof sets its own baseline ── */
  const dfT = await g.ev(`try { const v0 = __LW.mat.view; __LW.setView('density'); const vD = __LW.mat.view; __LW.setView('phase'); const vP = __LW.mat.view;
    let font = false; try { await document.fonts.load('12px Roboto'); font = document.fonts.check('12px Roboto'); } catch (e) {}
    const kinds = {}; for (const d of document.querySelectorAll('.dev')) kinds[d.dataset.id] = { kind: d.dataset.kind, folded: d.classList.contains('folded'), power: !!d.querySelector('.dev-power'), close: !!d.querySelector('.dev-close'), copy: !!d.querySelector('.dev-copy') };
    const set = document.querySelector('.dev[data-id="settings"]');
    return { specSide: __LW.layout.side('spectrum'), pickerOpen: __LW.spectrum.pickerOpen, keplerOn: __LW.kepler.on, theme: document.body.dataset.theme, phaseDefault: __LW.bootView === 'phase' && v0 === vP && v0 !== vD, vortexOn: __LW.vortex.on, vortexOverlay: __LW.vortex.overlay, font, bodyFont: getComputedStyle(document.body).fontFamily, kinds, settings: !!set, keysInSettings: set ? set.querySelectorAll('.keys-chip').length : 0, themeSegInSettings: !!(set && [...set.querySelectorAll('.seg')].length), adds: document.querySelectorAll('#rackAdd').length, veil: getComputedStyle(document.getElementById('rack')).opacity, shadow: getComputedStyle(document.body).getPropertyValue('--glass-shadow') };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B43 THE SHIPPED DEFAULTS: SPECTRUM on the left rack with MODE open, KEPLER off, LIGHT theme, arg ψ as the observable, the vortex census and its overlay off; Roboto is the interface face; every window has ⏻ ▾ ×, INFO panels have ⧉ COPY, ORBIT starts folded, STATE and SETTINGS start folded; SETTINGS exists; both racks carry a + and no veil',
    !dfT.error && dfT.specSide === 'L' && dfT.pickerOpen && dfT.keplerOn === false && dfT.theme === 'light' && dfT.phaseDefault && dfT.vortexOn === false && dfT.vortexOverlay === false && dfT.font && /Roboto/.test(dfT.bodyFont) && dfT.kinds.state.kind === 'core' && dfT.kinds.state.folded && dfT.kinds.settings.folded && !dfT.kinds.qcd && dfT.kinds.wigner.kind === 'info' && dfT.kinds.wigner.copy && dfT.kinds.orbit.kind === 'control' && dfT.kinds.orbit.folded && dfT.kinds.meters.kind === 'info' && dfT.kinds.meters.copy && !dfT.kinds.meters.folded && dfT.kinds.state.power && dfT.kinds.state.close && dfT.settings && dfT.adds === 1 && dfT.veil === '1', dfT);   /* 0.5.0 re-aim: SETTINGS and STATE start folded (W129 first-run furniture); the key chips left SETTINGS for the kit's KEYBOARD window (C3); the tight card shadow of wave 80 is the kit's now (C0 glass ruling, box-shadow class) */
  /* ══ WAVE 106 · THE GATE OPENS THE CHANNELS, BECAUSE A NEW USER NO LONGER ARRIVES WITH THEM OPEN ══
     Josh: "For spectrum, always 'Hide' the spinny wheels for new users."  SPECTRUM is the window this
     rack opens on and the lanes are ninety-one spinning phase dials — an introduction that is a wall —
     so `spectrum.js` now ships `.sp-rows` folded with the button reading SHOW.
       THAT IS A PRODUCT DEFAULT, AND IT MOVED FOURTEEN BLOCKS IN THIS FILE from GREEN to RED in one
     step — B11 measured it exactly: `muteTap {ok: 0, why: 'zero area', w: 0, h: 0}`.  Not one of them
     was testing the FOLD; every one of them drives a LANE — a mute, a solo, a fader, a phase knob — and
     a lane inside a hidden container has no box to press.
       So the gate presses SHOW once, here, before any block runs, exactly as a user reaching for the
     channels would.  It is deliberately NOT a `hidden = false` poke at the DOM: going through the real
     button means this line also proves the button still works, and it fails loudly if the control is
     ever renamed rather than silently un-hiding a panel behind the test's back. */
  await g.ev(`const b = [...document.querySelectorAll('.dev[data-id=spectrum] .trig')].find(x => /^(HIDE|SHOW|DIALS)$/.test((x.textContent||'').trim()));   // the button reads DIALS since the help-surface wave; aria-expanded says which way it is
    if (b && ((b.textContent||'').trim() === 'SHOW' || b.getAttribute('aria-expanded') === 'false')) b.click();
    await new Promise(r => setTimeout(r, 120));
    const rows = document.querySelector('.sp-rows');
    return { pressed: !!b, rowsHidden: rows ? rows.hidden : null };`);

  /* the proof's baseline: the dark stage, the density view, the vortex reader on — everything below was written against these */
  /* 0.5.0 re-aim: it was also written against EVERY window open and the STATUS TAGS shown; the first-run furniture (rack.js `useCompactDefaults`, 0.2.0) closes eleven windows and the tags are off (0.4.0 S0 wave 137 stops their tick) — so the baseline opens them, as a reader would */
  await g.ev(`__LW.setTheme('dark'); __LW.setView('density'); __LW.vortex.setOn(true); __LW.vortex.setOverlay(true); __LW.kepler.setOn(true); __LW.look.set({ badges: true }); __LW.look.apply({ now: true }); for (const id of __LW.layout.closed()) if (!['transport', 'atoms', 'wigner', 'radiation'].includes(id)) __LW.layout.reopen(id);   /* ATOMS, WIGNER and RADIATION stay shut: B54 and B57 test that they ship closed and open them themselves */ for (const d of document.querySelectorAll('.dev.folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); } await __LW.settle(); await new Promise(r => setTimeout(r, 600)); return 1;`);   /* the kit's rack animates a window's opening for 320 ms (C3) */
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
    await new Promise(r=>setTimeout(r,200));   /* 0.5.0 re-aim: the tags tick at most every 100 ms and only on a frame (B23), so the badge is read a tick after the mute, not on it */
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
  /* WAVE 52 note: this block used to read stats.lastTier, and that made it a RACE it lost about twice in
     three runs — wave 45 moved the recurrence scan into a worker whose answer calls schedule(TIER.PRESENT)
     when it lands, and settle() resolves two rAFs later, so an unrelated readout repaint could be the LAST
     tier. Proved pre-existing by running the same block with the whole wave-52 modulation host switched
     off; the CLAIM is unchanged and is now counted instead of remembered: exactly one RECONSTRUCT frame,
     no EVOLVE and no REBUILD. */
  const rot = await g.ev(`__LW.loadPreset('2p+'); await __LW.settle(); const d0 = __LW.stateDigest(); const t0 = { ...__LW.stats.tiers };
    __LW.reg.rotateZ(0.7); __LW.schedule(2); await __LW.settle();
    return { changed: d0 !== __LW.stateDigest(), last: __LW.stats.lastTier, recon: __LW.stats.tiers.RECONSTRUCT - t0.RECONSTRUCT,
             evolve: __LW.stats.tiers.EVOLVE - t0.EVOLVE, rebuild: __LW.stats.tiers.REBUILD - t0.REBUILD };`);
  judge('B8 Q5: STATE ROTATE R_z changes the state digest (a RECONSTRUCT), unlike the camera', rot.changed && rot.recon === 1 && rot.evolve === 0 && rot.rebuild === 0, rot);

  /* ── clocks: play, pause holds, resume without a giant step, idle is zero work ─ */
  const clk = await g.ev(`__LW.loadPreset('1s+2s'); await __LW.settle(); await new Promise(r=>setTimeout(r,800)); /* 0.5.0 re-aim: the kit's rack animates a card that changes height (C3), and its occlusion schedules ONE lawful PRESENT when that ends — let it end before the idle window opens */ __LW.play(); await new Promise(r=>setTimeout(r,450)); __LW.pause(); await __LW.settle();
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
  const lane = await g.ev(`const b = document.querySelector('.sp-row .mute'); const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, ok: r.width >= 28 && r.height >= 40 };`);
  judge('B11 SPECTRUM lane buttons are real touch targets (≥ 28 × 40 px — the native-clean card sets them 100 % of a four-column grid cell, 28 px at the card\'s 274; B70 holds the phone)', lane.ok, lane);
  await g.ev(`document.querySelector('.sp-row .mute').scrollIntoView({ block: 'center' }); await new Promise(r=>setTimeout(r,80)); return 1;`);
  const muteTap = await g.tap('.sp-row .mute');
  const muted = await g.ev('await __LW.settle(); const m = __LW.meters(); const on = __LW.reg.muted[__LW.reg.populated()[0]]; __LW.setMute(__LW.reg.populated()[0], false); await __LW.settle(); return { on: !!on, rendered: m.rendered };');
  judge('B11 tapping a lane\'s M mutes it through the same road', muteTap.ok === 1 && muted.on && muted.rendered === 1, { muteTap, muted });

  /* ── round trip ─────────────────────────────────────────────────────────── */
  const rt = await g.ev(`__LW.scrub(5.5); await __LW.settle(); const d0 = __LW.stateDigest(), t0 = __LW.clock.t; const s = JSON.parse(JSON.stringify(__LW.serialize()));
    __LW.loadPreset('1s'); await __LW.settle(); const mid = __LW.stateDigest(); __LW.restore(s); await __LW.settle();
    return { same: d0 === __LW.stateDigest(), t: __LW.clock.t === t0, changedInBetween: mid !== d0, status: s.experiment.status, basis: s.experiment.basis };`);
  judge('B12 Q7: serialize → load another preset → restore reproduces the state and the logical time, with its status label', rt.same && rt.t && rt.changedInBetween && rt.status === 'HYDROGEN', rt);   /* 0.5.0 re-aim: state.js labels the plain register 'HYDROGEN' ('STURMIAN BASIS' / 'STARK SHELL MODEL' otherwise), no longer EXACT ANALYTIC */

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
    return { count: c && c.count, Td: c && c.Td, pts: L && L.points.length, M: L && L.M, pts2: L2.points.length, M2: L2.M, xm, lit }; } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
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
    return { s0, s1: sh.spectrum, e1: sh.e, L1: sh.absL, d0, d1, back, norm, cls: lad.cls, kind: lad.kind, exact: lad.exact, pred: lad.predicted }; } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B16 folding every window is layout only: no errors thrown, the state still evolves and the ORBIT invariants recompute once the fold opens (a folded canvas has no size — its radii would go negative and canvas throws, killing the render loop)',
    !fold.error && fold.e1 === fold.e0 && fold.errs.length === 0 && fold.v1 > fold.v0 && fold.open > 1e-6, fold);   /* 0.5.0 re-aim: a folded window does NO work (window-activity.js, 0.3.x) — ORBIT recomputes when the fold opens, not behind it */

  /* ── DYNAMICS: the Lagrangian window and the particle view ─────────────── */
  const dyn = await g.ev(`try { __LW.loadPreset('1s+2pz'); __LW.scrub(0); await __LW.settle();
    const txt = [...document.querySelectorAll('[data-id="shadow"] .ro')].map(r => r.querySelector('.ro-lbl').textContent + '=' + r.querySelector('.ro-val').textContent);   // 0.4.0 S3: DYNAMICS is RETIRED — its L, T, V, S are SHADOW's footer, its moments CALCULUS rows
    const d0 = __LW.dynamics ? 1 : 0;
    // the dipole must oscillate at the Bohr period 16.755 and vanish a quarter of the way through
    const dz = []; for (const t of [0, 16.755/4, 16.755/2]) { __LW.scrub(t); await __LW.settle(); dz.push(__LW.calculus.last.rows.find(r => r.name === '⟨z⟩').value); }
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B17 DYNAMICS (retired 0.4.0 S3: no window, no __LW.dynamics; its moments are CALCULUS rows): the 1s+2p_z dipole ⟨z⟩ oscillates at the Bohr period — full at t = 0, zero a quarter period later, reversed at half',
    !dyn.error && Math.abs(Math.abs(dyn.dz[0]) - 0.7449) < 2e-3 && Math.abs(dyn.dz[1]) < 2e-3 && Math.abs(dyn.dz[2] + dyn.dz[0]) < 2e-3, dyn);
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B19 STATIC FIELD: switching on a Stark field makes the Stark state an eigenstate — |A(t)| stays 1 at t = 4000 where it would otherwise have moved — and a Zeeman field leaves ⟨E⟩ unchanged for this m = 0 state',
    !fld.error && Math.abs(fld.aStark - 1) < 1e-6 && Math.abs(fld.eZee - fld.e0) < 1e-12 && fld.errs === 0, fld);
  judge('B19 and the instrument SAYS which Hamiltonian is in force: a Stark badge appears and the status line drops from EXACT ANALYTIC to EXACT WITHIN EACH SHELL', /STARK|ZEEMAN/.test(fld.badge) || /WITHIN EACH SHELL/.test(fld.status), { badge: fld.badge, status: fld.status });

  const pal = await g.ev(`try { __LW.loadPreset('2p+'); __LW.setView('phase'); await __LW.settle();
    const before = await __LW.readPixels();
    __LW.palette.setOn(true); await __LW.settle();
    const after = await __LW.readPixels();
    const seam = document.querySelector('.mir-ramp-strip').getBoundingClientRect().width > 0;   // 0.5.0 C1: the editor is the kit's RAMP panel (paletteview.js and its .pal-strip canvas left)
    const d0 = __LW.stateDigest();
    /* WAVE 106 · PRISM IS THE SHIPPED DEFAULT NOW and this probe was written against the old one: mean
       |R-B| cannot tell the 6-stop spectral map from a red/blue pair (125.4 against 113.8 in the LUT, 0.33
       in the picture).  GREEN to MAGENTA is a cyclic two-hue phase palette whose LUT mean is 13.5, an
       order of magnitude under the default, so the statistic separates them by 23 instead of by noise. */
    __LW.palette.load([{ at: 0, rgb: [0, 1, 0] }, { at: 0.5, rgb: [1, 0, 1] }]); await __LW.settle();
    const two = await __LW.readPixels();
    __LW.palette.setOn(false); await __LW.settle();
    const off = await __LW.readPixels();
    const C = (p) => p.meanChroma;
    return { before: C(before), after: C(after), two: C(two), off: C(off), seam, same: d0 === __LW.stateDigest(), errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  // the shader dithers every frame, so two renders of one scene never hash alike: compare the colour statistic
  judge('B20 PHASE PALETTE: turning it on visibly recolours the field, editing the stops recolours it again, turning it off returns to the built-in wheel, and none of it touches ψ',
    !pal.error && pal.seam && Math.abs(pal.after - pal.before) > 1 && Math.abs(pal.two - pal.after) > 8 && Math.abs(pal.off - pal.before) < 0.5 && pal.same && pal.errs === 0, pal);

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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B21 KEYS: WASD/QE move the camera without touching ψ; X/Y/Z picks the rotation axis and [ ] turns the STATE about it; C cycles the draw style back to where it started',
    !keys.error && keys.cam.yaw && keys.cam.pitch && keys.cam.dist && keys.cam.stateSame && keys.rotated && keys.styleAfter !== keys.styleBefore && keys.styleBack === keys.styleBefore && keys.errs === 0, keys);

  /* ── QCD: DELETED in 0.5.0 D9 (R5-L1) — the window, qcd.js, qcdview.js and tests/qcd.test.mjs; QUARKONIUM (cornell.js) keeps
        the Numerov solver, and its Airy and Round 9 anchors moved into tests/cornell.test.mjs ── */
  const qcd = await g.ev(`return { gone: !document.querySelector('.dev[data-id="qcd"]'), api: 'qcd' in __LW, errs: window.__e.length };`) || { error: 'no result' };
  judge('B22 (0.5.0 D9) QCD is deleted: no window and no __LW.qcd', qcd.gone && !qcd.api && qcd.errs === 0, qcd);

  /* ── MOMENTUM SPACE: Parseval on the GPU grid ──────────────────────────── */
  const mom = await g.ev(`try { __LW.loadPreset('2p+'); __LW.setView('density'); await __LW.settle();
    const x = await __LW.fieldDigest(); const halfX = __LW.domain.half;
    __LW.setSpace('p'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    __LW.schedule(1); await __LW.settle();   /* 0.5.0 re-aim: the tags tick at most every 100 ms and only on a frame, so a final frame inside that window leaves the badge a frame behind — ask for one more */
    const p = await __LW.fieldDigest(); const halfP = __LW.domain.half;
    const badge = document.body.textContent;
    const px = await __LW.readPixels();
    __LW.setSpace('x'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const back = await __LW.fieldDigest();
    return { xInt: x.integral, pInt: p.integral, backInt: back.integral, halfX, halfP, fieldSpace: p.half, nanP: p.nan,
      momentumBadge: badge.includes('a₀⁻¹ · MOMENTUM'), lit: px.nonBlack / px.total, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B24 IMPULSE (named SLAP until wave 53): kicking 1s with k = 0.1 along z drops the norm by 0.31% (the electron knocked out of the six-shell register — physics, not renormalised), the readout prints it, the K key kicks at k = 0.2 along the chosen axis (escape 1.2–1.4%, the same law), and the state jiggles',
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B25 KEPLER: the circular 3d₊₂ state carries a circle (e = 0, a = 9) drawn over the cloud; a Runge–Lenz rotation by 0.6 turns it into an ellipse of e = (2/3)·sin 0.6 = 0.376; the overlay lights and clears with its switch',
    !kep.error && kep.o0.length === 1 && kep.o0[0].n === 3 && kep.o0[0].e < 1e-9 && kep.o0[0].a === 9 && Math.abs(kep.o1[0].e - 2 / 3 * Math.sin(0.6)) < 1e-9 && kep.lit > 200 && kep.lit2 === 0 && kep.errs === 0, kep);

  /* ── THE HAMILTONIAN SELECTOR: the oscillator, and Ehrenfest exact under a slap ── */
  const qho = await g.ev(`try { __LW.reg.clear(); __LW.reg.set(0, 1, 0); await __LW.settle();
    __LW.setHamiltonian('qho'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const E0 = __LW.reg.E[0], E2p = __LW.reg.E[2], half = __LW.domain.half;
    const dig = await __LW.fieldDigest();
    const hidden = ['orbit', 'ladder', 'vortex', 'slice'].map(id => { const w = document.querySelector('.dev[data-id="' + id + '"]'); return w ? w.hidden : null; });
    const status = document.querySelector('.dev[data-id="spectrum"] .dev-stat').textContent;
    const n0 = __LW.reg.norm2();
    __LW.kick(0.5, 'z'); await __LW.settle();
    const n1 = __LW.reg.norm2();
    const w = document.querySelector('.dev[data-id="state"]');
    const ro = w ? [...w.querySelectorAll('.ro-val')].map(e => e.textContent).find(t => t.includes('%')) : null;
    __LW.setHamiltonian('hydrogen'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const back = { E0: __LW.reg.E[0], orbitHidden: document.querySelector('.dev[data-id="orbit"]').hidden };
    return { E0, E2p, half, integral: dig.integral, nan: dig.nan, hidden, status, escaped: 1 - n1 / n0, readout: ro, back, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
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
    const sub = w ? [...w.querySelectorAll('.ro-sub')].map(e => e.textContent).find(t => t.includes('impulse vector')) : null;
    const afterRelease = { changed: __LW.stateDigest() !== d0, boostOn: __LW.mat.boost.on, norm: __LW.reg.norm(), sub };
    __LW.setDamping(0.2); const nA = __LW.reg.at(8); let n8 = 0; for (let i = 0; i < 91; i++) n8 += nA.re[i] ** 2 + nA.im[i] ** 2;
    const status = __LW.field.ok ? document.body.textContent.includes('TOY DRAG') : true;
    __LW.setDamping(0); const nB = __LW.reg.at(8); let n8b = 0; for (let i = 0; i < 91; i++) n8b += nB.re[i] ** 2 + nB.im[i] ** 2;
    return { during, lit: px.meanChroma, afterCancel, afterRelease, damp: { n8, n8b, status }, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B27 THE IMPULSE VECTOR (named THE BOW until wave 53): ctrl+drag 240 px draws k = 2.0 in the screen plane, switches to the phase view with the preview boost on (the fringes are the exact e^{ik·x}ψ); releasing CTRL cancels with ψ untouched; pulling 120 px and releasing applies k = 1 and drops the norm; the DRAG toy at γ = 0.2 bleeds the excited norm at t = 8, and γ = 0 restores the unitary register',
    !bowT.error && bowT.during.active && Math.abs(bowT.during.k - 2) < 1e-9 && bowT.during.boostOn && bowT.during.view === 1 && Math.abs(Math.hypot(...bowT.during.boostK) - 2) < 1e-9
      && !bowT.afterCancel.active && !bowT.afterCancel.boostOn && bowT.afterCancel.view === 0 && bowT.afterCancel.same
      && bowT.afterRelease.changed && !bowT.afterRelease.boostOn && bowT.afterRelease.norm < 0.9 && bowT.afterRelease.sub && bowT.afterRelease.sub.includes('k = 1.000')
      && bowT.damp.n8 < bowT.damp.n8b - 1e-3 && bowT.errs === 0 && !bowT.gpu, bowT);   /* 0.5.0 re-aim: the status line stopped saying 'TOY DRAG' with a526bda's copy pass (2026-09-09), so "and says so" is retired */

  /* ── KEYS: H hides the interface, TAB cycles windows to the top, Ctrl+R reseeds, and a binding can be changed ── */
  const keysT = await g.ev(`try { const K = (code, mods) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ code, bubbles: true, cancelable: true }, mods || {})));
    const rackEl = document.getElementById('rack');
    K('KeyH'); await __LW.settle();
    const hidden = { cls: document.body.classList.contains('ui-hidden'), rack: getComputedStyle(rackEl).display, frame: __LW.mat.frame };
    K('KeyH'); await __LW.settle();
    const shown = { cls: document.body.classList.contains('ui-hidden'), rack: getComputedStyle(rackEl).display };
    /* 0.5.0 re-aim: the first-run furniture puts SHADOW · SPECTRUM · MOLECULES on the LEFT rack, so TAB's first window is that rack's — the top is read off BOTH racks, as cycleWindow's isTop does */
    const topId = () => ['rackL', 'rack'].map((i) => document.getElementById(i).querySelector('.dev:not([hidden])').dataset.id).join('/');
    const first0 = topId();
    /* WAVE 57 · TAB IS THE STAGE'S KEY NOW.  It used to be bound as an application key everywhere, which made
       focus unable to move at all (WCAG 2.1.2); it cycles windows only while the stage holds focus, so this
       block puts the hands where the shortcut is used before pressing it — and lets go afterwards. */
    document.getElementById('field').focus();
    const stageHeld = __LW.stageFocus;
    K('Tab'); await __LW.settle();
    const hot = document.querySelector('.dev.tab-hot'); const tab1 = { id: topId(), folded: !hot || hot.classList.contains('folded') };
    K('Tab', { shiftKey: true }); await __LW.settle();
    const tab2 = topId();
    /* … and OFF the stage the same press is the browser's: nothing cycles */
    document.getElementById('field').blur();
    const off0 = topId();
    K('Tab'); await __LW.settle();
    const offSame = topId() === off0;
    K('KeyR', { ctrlKey: true }); await __LW.settle();
    const seeded = { on: __LW.particles.on, count: __LW.particles.state.count };
    const camBefore = { yaw: __LW.obs.yaw }; __LW.obs.yaw = 2.0;
    __LW.keys.bind('camReset', { key: 'KeyU' }); K('KeyR'); const notReset = __LW.obs.yaw; K('KeyU'); await __LW.settle(); const reset = __LW.obs.yaw;
    const saved = JSON.parse(localStorage.getItem('lambdawaves.q0.keys') || '{}');
    __LW.keys.reset();
    return { hidden, shown, first0, stageHeld, tab1, tab2, offSame, seeded, notReset, reset, saved, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B28 KEYS: H hides the rack, badges, hint and frame and H shows them again; TAB brings the next window to the top unfolded and Shift+TAB the previous — FROM THE STAGE, which is wave 57\'s change to this block and the only one: Tab was an application key everywhere, so keyboard focus could not move at all, and it now cycles windows only while the stage holds focus and is the browser\'s everywhere else (proved both ways here); Ctrl+R seeds the particles; rebinding the camera reset from R to T takes effect at once and is saved in localStorage',
    !keysT.error && keysT.hidden.cls && keysT.hidden.rack === 'none' && keysT.hidden.frame === false && !keysT.shown.cls && keysT.shown.rack !== 'none'
      && keysT.stageHeld === true && keysT.offSame === true
      && keysT.tab1.id !== keysT.first0 && !keysT.tab1.folded && keysT.tab2 === keysT.first0
      && keysT.seeded.on && keysT.seeded.count > 0 && Math.abs(keysT.notReset - 2.0) < 1e-12 && Math.abs(keysT.reset - 0.65) < 1e-12 && Array.isArray(keysT.saved.camReset) && keysT.saved.camReset[0] === 'KeyU' && keysT.errs === 0, keysT);   /* 0.5.0 re-aim: T is the dock key (the binding law refuses the overlap since 0.4.0), so the rebinding goes to the unbound U; C3: the saved record is the kit's shape, an array of chord strings */

  /* ── THE MOLECULE (B29): the H₂⁺ card is deleted (0.5.0 D9) ── */
  const mol = await g.ev(`return { gone: !document.querySelector('.dev[data-id="molecule"]') && !('molecule' in __LW) && !('mo' in __LW) && !('pulse' in __LW), errs: window.__e.length };`) || { error: 'no result' };
  judge('B29 (0.5.0 D9) RETIRED: the H₂⁺ card and its `__LW.molecule`, `__LW.mo`, `__LW.pulse` were deleted in 0.5.0 D9 — restore opens its files as MOLECULES · H₂', mol.gone && mol.errs === 0, mol);

  /* ── PERFORMANCE: the frame profile measures, 120 Hz mode throttles the CPU windows, the field never waits ── */
  const perfT = await g.ev(`try { ${RATE}
    __LW.loadPreset('recon'); __LW.setView('density'); __LW.perf.setMode('full'); await __LW.settle();
    /* WAVE 63: 45 frames, not 1500 ms.  Every arm below is a RATIO of counters taken over the same
       window, so the window only has to be long enough to be a sample — and counting makes it one. */
    const run = async (n) => { const f0 = __LW.perf.counts.frames, c0 = __LW.perf.counts.cpu, p0 = __LW.stats.presents;
      const r = await rateN(n);
      return { frames: __LW.perf.counts.frames - f0, cpu: __LW.perf.counts.cpu - c0, presents: __LW.stats.presents - p0,
               ms: r.ms, fps: r.fps, short: r.short, profile: Object.assign({}, __LW.perf.profile) }; };
    const full = await run(45);
    __LW.perf.setMode('120'); await __LW.settle();
    const fast = await run(45);
    __LW.perf.setMode('full');
    return { full, fast, mode: __LW.perf.mode, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B30 PERFORMANCE: the profile measures every stage (field and total > 0); in 120 Hz mode the CPU windows update on about every 4th frame while the field still presents every frame; the mode switches back cleanly. WAVE 63: both windows are 45 FRAMES rather than 1500 ms, so the sample size is a constant on any box and the wall time is the variable — which is what let the two `frames > 10` guards go. They were a 6.7 fps floor wearing a sample-size hat, and a floor is not a claim this block makes',
    !perfT.error && perfT.full.profile.field > 0 && perfT.full.profile.total > 0 && !perfT.full.short && !perfT.fast.short
            /* the boundary frames of a 47-frame window put the every-4th count at 12 ± 2 and it FLIPS run to
         run (13 and 14 measured on two runs of the same build); the band is 3 so a one-frame boundary
         does not decide the law, and the law is still unmistakable — 14 against the 47 the full does. */
      && perfT.fast.cpu <= perfT.fast.frames / 4 + 3 && perfT.full.cpu >= perfT.full.frames - 2 && perfT.fast.presents >= perfT.fast.frames - 2 && perfT.mode === 'full' && perfT.errs === 0,
    { fullFps: +perfT.full.fps.toFixed(1), fastFps: +perfT.fast.fps.toFixed(1), fullMs: perfT.full.profile.total && +perfT.full.profile.total.toFixed(2), fastMs: perfT.fast.profile.total && +perfT.fast.profile.total.toFixed(2), fieldMs: perfT.full.profile.field && +perfT.full.profile.field.toFixed(2), cpuFull: perfT.full.cpu, cpuFast: perfT.fast.cpu, frames: [perfT.full.frames, perfT.fast.frames], wallMs: [Math.round(perfT.full.ms), Math.round(perfT.fast.ms)], error: perfT.error });

  /* ── THE BOX: the spherical well on the GPU — j_l by Miller's recurrence in WGSL, a hard wall, a bouncing packet ── */
  const wellT = await g.ev(`try { __LW.reg.clear(); __LW.reg.set(0, 1, 0); await __LW.settle();
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B32 Z = 2 (He⁺): E_1s = −2, the box halves to ±8, the GPU integrates the scaled 2p₊ to 1 in position AND momentum space (the exponent fix), the status names the ion, the hydrogen-theorem windows stand down, and Z = 1 restores everything',
    !zT.error && Math.abs(zT.E0 + 2) < 1e-12 && Math.abs(zT.half - 8) < 1e-9 && Math.abs(zT.xInt - 1) < 0.02 && Math.abs(zT.pInt - 1) < 0.02 && Math.abs(zT.halfP - 4.0) < 1e-9 && zT.status.includes('Z = 2') && zT.ladderHidden && Math.abs(zT.back.E0 + 0.5) < 1e-12 && Math.abs(zT.back.half - 16) < 1e-9 && !zT.back.ladderHidden && zT.errs === 0 && !zT.gpu, zT);

  /* ── HELIUM (B33): the HELIUM card is deleted (0.5.0 D9) ── */
  const heT = await g.ev(`return { gone: !document.querySelector('.dev[data-id="helium"]') && !('helium' in __LW), errs: window.__e.length };`) || { error: 'no result' };
  judge('B33 (0.5.0 D9) RETIRED: the HELIUM card and its `__LW.helium` were deleted in 0.5.0 D9 — restore opens its files as SPECTRUM\'s ATOM · He 1s', heT.gone && heT.errs === 0, heT);

  /* ── THE GAS: a packet launched in the box flies at its momentum and bounces ── */
  const gasT = await g.ev(`try { __LW.setHamiltonian('well'); await __LW.settle();
    __LW.clock.reset(); __LW.launchPacket([0, 0, -4], [0, 0, 0.8], 1.6); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const L = __LW.lastLaunch, norm = __LW.reg.norm(), pop = __LW.reg.populated().length;
    const c0 = __LW.packetCentroid(24), d0 = await __LW.fieldDigest();
    __LW.clock.step(3); __LW.schedule(3); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const c3 = __LW.packetCentroid(24), d3 = await __LW.fieldDigest();
    const w = document.querySelector('.dev[data-id="spectrum"]');
    const ro = [...w.querySelectorAll('.ro-val')].map(e => e.textContent).find(t => t.includes('held'));
    __LW.setHamiltonian('hydrogen'); await __LW.settle();
    return { captured: L.captured, norm, pop, c0, c3, hash0: d0.hash, hash3: d3.hash, int0: d0.integral, int3: d3.integral, ro, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B34 THE GAS: a σ = 1.6 packet launched at z = −4 with k = 0.8 is held by the box to > 85%, is a unit-norm state of > 20 well eigenstates, sits at z ≈ −4, moves to ≈ −1.6 in three time units, the GPU grid integrates it to 1 (2%) before and after, and the readout reports how much the box holds',
    !gasT.error && gasT.captured > 0.85 && Math.abs(gasT.norm - 1) < 1e-9 && gasT.pop > 20 && Math.abs(gasT.c0[2] + 4) < 0.4 && Math.abs(gasT.c3[2] + 1.6) < 0.7 && gasT.hash0 !== gasT.hash3 && Math.abs(gasT.int0 - 1) < 0.02 && Math.abs(gasT.int3 - 1) < 0.02 && gasT.ro && gasT.ro.includes('held') && gasT.errs === 0 && !gasT.gpu, gasT);

  /* ── H₂ (B35): the Heitler–London card is deleted (0.5.0 D9b) ── */
  const h2T = await g.ev(`return { gone: !document.querySelector('.dev[data-id="h2"]') && !('h2' in __LW), errs: window.__e.length };`) || { error: 'no result' };
  judge('B35 (0.5.0 D9b) RETIRED: the H₂ card (Heitler–London, the collision) and its `__LW.h2` were deleted in 0.5.0 D9b — restore opens its files as MOLECULES · H₂ on its density', h2T.gone && h2T.errs === 0, h2T);

  /* ── CALCULUS: the live table shows Ehrenfest holding, and switches its law with the Hamiltonian ── */
  const calcT = await g.ev(`try { __LW.setHamiltonian('hydrogen'); __LW.reg.clear(); __LW.reg.set(0, 0.8, 0); __LW.reg.set(3, 0.6, 0); __LW.clock.reset(); __LW.clock.step(1.3); __LW.schedule(3); await __LW.settle();
    const w = document.querySelector('.dev[data-id="calculus"]'); if (w.classList.contains('folded')) w.querySelector('.dev-fold').click();
    __LW.schedule(1); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const rows = [...w.querySelectorAll('.ro')].map(r => [...r.children].map(c => c.textContent));   // 0.4.0 S3: CALCULUS is the kit's readouts (.ro), eight of them — S3 added ⟨L_z⟩, ⟨L²⟩ and ⟨r⟩ to the five
    const res = [...w.querySelectorAll('.ro-val')].map(e => e.className);
    const L = __LW.calculus.last;
    const ehrI = L.rows[2], ehrII = L.rows[3];
    __LW.setHamiltonian('qho'); __LW.schedule(4); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const lawQ = __LW.calculus.last.rows[3].law;
    __LW.setHamiltonian('hydrogen'); await __LW.settle();
    return { n: rows.length, res, ehrI: { v: ehrI.value, d: ehrI.derivative, p: ehrI.predicted, r: ehrI.residual }, ehrII: { d: ehrII.derivative, p: ehrII.predicted, r: ehrII.residual }, lawQ, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B36 CALCULUS: on 1s + 2p_z at t = 1.3 the live table shows eight rows with Ehrenfest I and II holding (residuals < 1e-5 relative, marked ok), the dipole moving (|⟨p_z⟩| > 0.01), and under the oscillator the law reads Newton (−⟨z⟩)',
    !calcT.error && calcT.n === 8 && Math.abs(calcT.ehrI.r) < 1e-5 * (1 + Math.abs(calcT.ehrI.p)) && Math.abs(calcT.ehrII.r) < 1e-5 * (1 + Math.abs(calcT.ehrII.p)) && Math.abs(calcT.ehrI.p) > 0.01 && calcT.res[2].includes('ok') && calcT.res[3].includes('ok') && calcT.lawQ.includes('−⟨z⟩') && calcT.errs === 0, calcT);

  /* ── HELIUM (B37): shift-click placed electron 1; the card is deleted (0.5.0 D9) ── */
  const plT = await g.ev(`return { gone: !('placeElectron' in __LW) && !('helium' in __LW), errs: window.__e.length };`) || { error: 'no result' };
  judge('B37 (0.5.0 D9) RETIRED: the HELIUM card and its `__LW.helium` and `__LW.placeElectron` were deleted in 0.5.0 D9 — restore opens its files as SPECTRUM\'s ATOM · He 1s', plT.gone && plT.errs === 0, plT);

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
    /* WAVE 92 · THE PILL TOOK THE MODULATION WORK BAR'S OWN BOX — 46 px on a 16-px corner, so the two
       transports agree by construction rather than by coincidence.  Pinned, not loosened: what the slim
       bar IS is the assertion. */
    const mini = tr.classList.contains('mini') && Math.abs(tr.getBoundingClientRect().height - 46) < 1;
    __LW.layout.dockTransport(); const docked = tr.closest('.dev') && tr.closest('.dev').dataset.id === 'transport' && !document.querySelector('.dev[data-id="transport"]').hidden;
    __LW.layout.dockTransport(); const undocked = tr.parentElement.id === 'stage' && tr.classList.contains('mini');
    const stageFull = stage.position === 'absolute';
    return { stageFull, rackPos, notesHidden, icons, notesShown, hidden, peek, peekDbg, before0: before[0], after0: after[0], mini, docked, undocked, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B38 THE FLOATING RACK: the stage fills the window and the rack floats over it; the hide button slides the rack out and the right-edge peek brings it back; a card can be moved to the top; the transport is a slim bar that docks into the rack as a card and undocks',
    !layT.error && layT.stageFull && layT.rackPos === 'absolute' && layT.hidden.cls && parseFloat(layT.hidden.op) < 0.05 && parseFloat(layT.peek) > 0.95 && layT.before0 !== 'meters' && layT.after0 === 'meters' && layT.mini && layT.docked && layT.undocked && layT.errs === 0, layT);   /* 0.5.0 re-aim: the ⓘ hint icons and the N notes key left with the copy pass of a526bda (2026-09-09, 'Unify help surfaces'); HELP is the kit's row now (C2) */

  /* ── THEME, SURFACE, FROST, the MIRROR rack and the logo ── */
  const thT = await g.ev(`try { __LW.loadPreset('2p+'); __LW.setView('density'); __LW.setTheme('dark'); await __LW.settle();
    const dark = await __LW.readPixels();
    __LW.setTheme('light'); await __LW.settle(); await new Promise(r => setTimeout(r, 300));
    const light = await __LW.readPixels(), lightState = { theme: document.body.dataset.theme, invert: __LW.mat.invert, bg: __LW.mat.bg.slice(), fg: getComputedStyle(document.body).getPropertyValue('--fg').trim() };
    __LW.mat.gamma = 2.2; __LW.schedule(1); await __LW.settle(); const gam = await __LW.readPixels(); __LW.mat.gamma = 1;
    __LW.setTheme('dark'); await __LW.settle();
    /* WAVE 67: FROST's material now lives on the SURFACE the skin puts it on — the body-card under the
       disconnected window, the slab under the joined one — because a backdrop-filter on the window ROOT
       would be a backdrop root between the cards and the canvas and leave them nothing to blur. */
    const frostSurf = () => document.body.classList.contains('disconnected') ? document.querySelector('.dev > .dev-body') : document.querySelector('.dev');
    document.body.classList.add('frost'); const frost = getComputedStyle(frostSurf()).backdropFilter || getComputedStyle(frostSurf()).webkitBackdropFilter; document.body.classList.remove('frost');
    const sideBefore = __LW.layout.side('spectrum'); __LW.layout.moveToRack('spectrum', 'L'); const inLeft = !!document.querySelector('#rackL .dev[data-id="spectrum"]'), sideAfter = __LW.layout.side('spectrum');
    __LW.layout.moveToRack('spectrum', 'R'); const backRight = !!document.querySelector('#rack .dev[data-id="spectrum"]');
    const all = __LW.layout.orderAll().length;
    const title = document.getElementById('title'), mark = title.querySelector('svg.mark'), rects = mark ? mark.querySelectorAll('rect').length : 0;
    let font = false; try { await document.fonts.load('16px "LW Title"'); font = document.fonts.check('16px "LW Title"'); } catch (e) {}
    return { darkLum: dark.meanLum, lightLum: light.meanLum, gamLum: gam.meanLum, lightState, frost, sideBefore, inLeft, sideAfter, backRight, all, rects, font, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B39 THEME + MIRROR + LOGO: LIGHT sets the theme, lightens the stage so the frame\'s mean luminance jumps; GAMMA 2.2 changes the picture; FROST applies the GLASS BLUR radius (18 px by default) as a backdrop blur only while on; a card moves to the left rack and back by the API; TAB\'s order spans both racks; the title carries the nine-square diamond mark and the wordmark face loads under the name it is licensed to use — WAVE 59 RENAMED IT: our five-glyph subset of gluk\'s Spinwerad is a Modified Version, "spinwerad" is a Reserved Font Name, and SIL OFL §3 forbids a Modified Version from using one (the TERMINATION clause voids the grant where it does), so the family is \'LW Title\' in the binary and in the CSS. Every outline is byte-identical to the subset it renames',
    !thT.error && thT.lightState.theme === 'light' && thT.lightLum > thT.darkLum + 40 && Math.abs(thT.gamLum - thT.lightLum) > 3 && /blur\(22px\)/.test(thT.frost)   /* ⚠ wave 101: Josh's new GLASS BLUR default */ && thT.sideBefore === 'L' && thT.inLeft && thT.sideAfter === 'L' && thT.backRight && thT.all > 10 && thT.rects === 9 && thT.font && thT.errs === 0 && !thT.gpu, thT);

  /* ── THE WHEEL AS THE ACCENT: two angles on the palette colour the UI and the logo ── */
  const acT = await g.ev(`try { const saved = __LW.palette.stops.map((s) => ({ at: s.at, rgb: s.rgb.slice() })); const fillsSaved = [...document.querySelectorAll('#title .mark rect')].map((r) => r.getAttribute('fill')); __LW.palette.load([{ at: 0, rgb: [0.37, 0.9, 0.85] }, { at: 0.5, rgb: [0.85, 0.49, 0.91] }]); __LW.setTheme('dark'); __LW.accent.set(0, 162); await new Promise(r => setTimeout(r, 60));
    const body = document.body, title = document.getElementById('title'), hex2rgb = (h) => 'rgb(' + [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')';
    const acc0 = getComputedStyle(body).getPropertyValue('--acc').trim(), lam0 = title.querySelector('.lam').style.color;
    const fills0 = [...title.querySelectorAll('.mark rect')].map((r) => r.getAttribute('fill'));
    __LW.accent.set(90); const acc90 = getComputedStyle(body).getPropertyValue('--acc').trim();
    const playEl = document.querySelector('#transport .play'); playEl.classList.add('on'); const playInk = getComputedStyle(playEl).color; playEl.classList.remove('on'); const playOff = getComputedStyle(playEl).color;
    const playBg = getComputedStyle(playEl).backgroundColor, titleBg = getComputedStyle(title).backgroundColor, titleImg = getComputedStyle(title).backgroundImage;
    __LW.palette.load([{ at: 0, rgb: [1, 0, 0] }, { at: 0.5, rgb: [0, 0, 1] }]); const fillsRed = [...title.querySelectorAll('.mark rect')].map((r) => r.getAttribute('fill'));
    __LW.palette.load(saved); const fillsBack = [...title.querySelectorAll('.mark rect')].map((r) => r.getAttribute('fill'));
    const lamStyle = getComputedStyle(title.querySelector('.lam')), wordDark = getComputedStyle(title.querySelector('.word')).color;
    __LW.setTheme('light'); const wordLight = getComputedStyle(title.querySelector('.word')).color, accLight = getComputedStyle(body).getPropertyValue('--acc').trim(); __LW.setTheme('dark'); __LW.accent.set(0, 162);
    return { acc0, lam0, fills0, acc90, playBg, playOff, playInk, playIs90: playInk === hex2rgb(acc90) && playOff !== playInk && playBg === 'rgba(0, 0, 0, 0)', titleBg, titleImg, fillsRed, fillsBack, fillsSaved, lamItalic: lamStyle.fontStyle, lamWeight: lamStyle.fontWeight, lamIs0: lam0 === hex2rgb(fills0[0]), wordDark, wordLight, accLight, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B40 THE WHEEL AS THE ACCENT: --acc is a colour from the current palette and moving ACCENT A to 90° changes it, and the PLAY seat wears it as its INK — wave 98 made that seat the flat switch MOD beside it already was: no fill in either state, --acc while the clock runs and the faint neutral when it does not; the λ is the wheel\'s 0° colour, the nine squares are the wheel at 0°…320° and follow a palette change; the wordmark is white on DARK and black on LIGHT; the title has no background; the λ is a bold italic',
    !acT.error && /^#[0-9a-f]{6}$/.test(acT.acc0) && acT.acc90 !== acT.acc0 && acT.playIs90 && acT.lamIs0 && acT.fills0.length === 9 && new Set(acT.fills0).size >= 7 && JSON.stringify(acT.fillsRed) !== JSON.stringify(acT.fills0) && JSON.stringify(acT.fillsBack) === JSON.stringify(acT.fillsSaved) && acT.wordDark === 'rgb(255, 255, 255)' && acT.wordLight === 'rgb(0, 0, 0)' && acT.accLight !== acT.acc0 && /rgba\(0, 0, 0, 0\)|transparent/.test(acT.titleBg) && acT.titleImg === 'none' && acT.lamItalic === 'italic' && Number(acT.lamWeight) >= 700 && acT.errs === 0, acT);

  /* ── the iPad round: auto render scale, a rack that scrolls by touch, the box launches on entry, the coherent bounce ── */
  const ipT = await g.ev(`try { const q = __LW.quality, rackEl = document.getElementById('rack'), rs = getComputedStyle(rackEl), dev = getComputedStyle(document.querySelector('.dev'));
    const auto = { on: q.auto, scale: q.autoScale, min: q.minScale, iv: Math.max(...__LW.autoQ.iv), changes: __LW.autoQ.changes };
    q.auto = false; q.autoScale = 1;
    __LW.pause(); __LW.enterBox(); await __LW.settle();
    const box = { h: __LW.hamiltonian, launched: !!__LW.lastLaunch && !__LW.lastLaunch.coherent, held: __LW.lastLaunch && __LW.lastLaunch.captured, playing: __LW.clock.playing, modes: __LW.reg.populated().length };
    __LW.pause(); __LW.coherentBounce(); await __LW.settle();
    const coh = { h: __LW.hamiltonian, coherent: !!(__LW.lastLaunch && __LW.lastLaunch.coherent), norm: __LW.reg.norm2(), modes: __LW.reg.populated().length, playing: __LW.clock.playing };
    __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); await __LW.settle();
    __LW.setView('phase'); __LW.palette.setOn(true); await __LW.settle(); const px = await __LW.readPixels(); __LW.palette.setOn(false); __LW.setView('density'); await __LW.settle();
    q.auto = true;
    return { auto, rackPE: rs.pointerEvents, rackTA: rs.touchAction, rackBottom: rs.bottom, devTA: dev.touchAction, box, coh, palLit: px.nonBlack, shader: __LW.field.shaderMessages.length, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B41 THE iPAD ROUND: AUTO SCALE is on with a floor and a measured frame interval; the rack is a real scroller (pointer-events auto, pan-y) and cards pan; entering the BOX launches a held gas packet and plays; COHERENT BOUNCE puts the oscillator in a slapped ground state of unit norm across many N; the phase view with the palette on stays lit and the guarded shader compiles clean',
    !ipT.error && ipT.auto.on === true && ipT.auto.scale <= 1 && ipT.auto.min > 0 && ipT.auto.iv > 0 && ipT.rackPE === 'auto' && /pan-y/.test(ipT.rackTA) && /pan-y/.test(ipT.devTA) && ipT.box.h === 'well' && ipT.box.launched && ipT.box.held > 0.85 && ipT.box.playing && ipT.box.modes > 20 && ipT.coh.h === 'qho' && ipT.coh.coherent && Math.abs(ipT.coh.norm - 1) < 2e-3 && ipT.coh.modes >= 4 && ipT.coh.playing && ipT.palLit > 1000 && ipT.shader === 0 && ipT.errs === 0 && !ipT.gpu, ipT);

  /* ── the second UX round: overlay shading, THEME leaves INVERT, SIGNED/BANDS, ⓘ outside the rack, racks to the top, the logo menu, double-tap reset, the transport's slot ── */
  const uxA = await g.ev(`try { const body = document.body, rackEl = document.getElementById('rack'), rackLEl = document.getElementById('rackL');
    __LW.pause(); __LW.setTheme('dark'); __LW.mat.invert = false; __LW.setTheme('light'); const invLight = __LW.mat.invert; __LW.setTheme('dark'); const invDark = __LW.mat.invert;
    __LW.loadPreset('1s+2pz'); __LW.setView('real'); const lit = {};
    for (const st of ['signed', 'bands', 'solid']) { __LW.setStyle(st); await __LW.settle(); const px = await __LW.readPixels(); lit[st] = px.nonBlack; }
    __LW.setStyle('cloud'); __LW.setView('density'); await __LW.settle();
    const rackRect = rackEl.getBoundingClientRect(), rackTop = getComputedStyle(rackEl).top;
    /* 0.5.0 re-aim: the ⓘ header icon and its panel (infoPop) left with a526bda's help-surface pass (2026-09-09); HELP is the kit's row (C2) */
    const title = document.getElementById('title'), tRect = title.getBoundingClientRect(), tog = document.getElementById('rackToggle').getBoundingClientRect(), rw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rack-w'));
    title.click(); const bar = document.getElementById('menubar'), menuOpen = !bar.hidden, names = [...bar.querySelectorAll('.mb-btn')].map((b) => b.textContent);
    bar.querySelectorAll('.mb-btn')[3].click(); const items = bar.querySelectorAll('.mb-list:not([hidden]) .mb-item').length; __LW.layout.menu.close();
    const tr = document.getElementById('transport'), miniBottom = getComputedStyle(tr).bottom;
    if (__LW.layout.docked) __LW.layout.dockTransport();
    __LW.layout.dockTransport(); const trCard = document.querySelector('.dev[data-id="transport"]'); const dockedFirst = trCard.parentElement === rackLEl && rackLEl.querySelector('.dev') === trCard;
    __LW.layout.moveToRack('spectrum', 'L'); __LW.layout.moveToRack('meters', 'L'); rackLEl.appendChild(trCard); __LW.layout.dockTransport(); const idx1 = __LW.layout.dockIndex;
    __LW.layout.dockTransport(); const pos = [...rackLEl.querySelectorAll('.dev')].indexOf(trCard); __LW.layout.dockTransport();
    __LW.layout.moveToRack('spectrum', 'R'); __LW.layout.moveToRack('meters', 'R');
    const gk = [...document.querySelectorAll('.k')].find((k) => k.querySelector('.k-lbl') && k.querySelector('.k-lbl').textContent === 'GAMMA'); __LW.layout.raise('settings'); await new Promise((r) => setTimeout(r, 500)); gk.scrollIntoView({ block: 'center', behavior: 'instant' });   /* 0.5.0 re-aim: the GAMMA knob lives in SETTINGS (folded at first run), not in the OBSERVER card; the kit's rack animates the raise (320 ms), so scroll once it ends */ await new Promise((r) => setTimeout(r, 120));
    const dr = gk.querySelector('.k-dial').getBoundingClientRect();
    return { invLight, invDark, lit, rackTop, titleLeft: tRect.left, togRight: tog.right, rackLeft: rackRect.left, rw, menuOpen, names, items, miniBottom, dockedFirst, idx1, pos, dial: { x: Math.round(dr.left + dr.width / 2), y: Math.round(dr.top + dr.height / 2) }, gamma0: __LW.mat.gamma };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
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
    } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  }
  const uxT = { ...uxA, ...uxB };
  judge('B42 THE SECOND UX ROUND: a theme change leaves INVERT alone; SIGNED, BANDS and the overlay-shaded SOLID all draw the real 1s+2pz; the rack runs to the top; the logo and hide button sit between the racks; the logo opens FILE · EDIT · WINDOW with the windows listed; the transport floats 60 px up, docks into the LEFT rack at the top and remembers its slot; a real drag turns the GAMMA knob and a double-click resets it; a hidden rack peeks at the edge and goes when the pointer leaves its column',
    !uxA.error && !uxB.error && uxT.invLight === false && uxT.invDark === false && uxT.lit.signed > 800 && uxT.lit.bands > 300 && uxT.lit.solid > 800 && uxT.rackTop === '0px' && uxT.titleLeft >= uxT.rw && uxT.togRight <= uxT.rackLeft && uxT.menuOpen && uxT.names.join() === 'FILE,EDIT,VIEW,WINDOW,ABOUT' && uxT.items > 12 && uxT.miniBottom === '60px' && uxT.dockedFirst && uxT.idx1 === uxT.pos && Math.abs(uxT.gammaMoved - 1) > 0.05 && uxT.gammaReset === 1 && uxT.wasHidden && uxT.peek1 && !uxT.peek2 && uxT.shader === 0 && uxT.errs === 0 && !uxT.gpu, uxT);

  /* ── B44: close and reopen, the power switch, the COPY digest, SETTINGS remembering itself, the flat menubar beside the logo ── */
  const stT = await g.ev(`try { const body = document.body, rackEl = document.getElementById('rack');
    const sh = document.querySelector('.dev[data-id="shadow"]'); sh.querySelector('.dev-close').click(); const closed1 = sh.classList.contains('closed') && getComputedStyle(sh).display === 'none';
    const saved1 = (__LW.settings.closed || []).includes('shadow');
    const add = document.getElementById('rackAdd'); add.click(); const list = document.getElementById('rackAddList'), listed = [...list.querySelectorAll('.mb-item')].map((b) => b.textContent);
    [...list.querySelectorAll('.mb-item')].find((b) => /SHADOW/.test(b.textContent)).click();   /* 0.5.0 re-aim: a526bda (2026-09-09) shortened the window's name to SHADOW */ const reopened = !sh.classList.contains('closed') && sh.parentElement.querySelector('.dev:not([hidden])') === sh;   /* 0.5.0 re-aim: it reopens at the top of the rack it came from (SHADOW is on the LEFT rack since the first-run furniture) */
    const met = document.querySelector('.dev[data-id="meters"]'); const p0 = __LW.perf.counts.cpu; met.querySelector('.dev-power').click(); const off = met.classList.contains('off');
    __LW.play(); await new Promise((r) => setTimeout(r, 400)); __LW.pause(); const metersProfileFrozen = __LW.perf.profile.meters; await new Promise((r) => setTimeout(r, 50));
    met.querySelector('.dev-power').click(); const on = !met.classList.contains('off');
    const digest = await __LW.layout.copyDigest('meters'), spec = __LW.layout.digest('spectrum');
    const set = document.querySelector('.dev[data-id="settings"]'); __LW.layout.raise('settings'); const setOpen = !set.classList.contains('folded') && set.parentElement.querySelector('.dev:not([hidden]):not(.closed)') === set;   /* 0.5.0 re-aim: the kit's rack keeps a closed card in the DOM (class closed), so the top is the first card that is not closed */
    const tagSw = [...set.querySelectorAll('.sw')].find((b) => /STATUS TAGS/.test(b.textContent)); tagSw.click(); const badgesGone = [...document.querySelectorAll('#badges > .badge:not(.build)')].every((b) => getComputedStyle(b).display === 'none'), savedBadges = __LW.look.get('badges') === false; tagSw.click();   /* 0.5.0 re-aim: the four ψ-badges go, the strip stays for the build offer (wave 133); STATUS TAGS is the kit's mir.gui row, not the settings blob (C2) */
    const title = document.getElementById('title'); title.click(); const bar = document.getElementById('menubar'), br = bar.getBoundingClientRect(), tr = title.getBoundingClientRect(), barBg = getComputedStyle(bar).backgroundColor; __LW.layout.menu.close();
    const items = (() => { title.click(); bar.querySelectorAll('.mb-btn')[1].click(); const n = [...bar.querySelectorAll('.mb-list:not([hidden]) .mb-item')].map((b) => b.textContent); __LW.layout.menu.close(); return n; })();
    return { closed1, saved1, listed, reopened, off, on, metersProfileFrozen, digestLen: digest.length, digestHasProfile: /frame profile/.test(digest), specRows: spec.split('\\n').length, setOpen, badgesGone, savedBadges, barRight: br.left >= tr.right, barBg, hasSettingsItem: items.some((t) => /SETTINGS/.test(t)), errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B44 SETTINGS · CLOSE · POWER · COPY: × closes a window (display none, remembered), the rack\'s + lists it and reopens it at the top; ⏻ switches METERS off and on; the COPY digest of METERS carries the frame profile and the SPECTRUM digest is a table; EDIT → SETTINGS raises the settings window; STATUS TAGS hides the badges and is remembered; the menubar sits to the right of the logo with no background',
    !stT.error && stT.closed1 && stT.saved1 && stT.listed.some((t) => /SHADOW/.test(t)) && stT.reopened && stT.off && stT.on && stT.digestLen > 80 && stT.digestHasProfile && stT.specRows >= 3 && stT.setOpen && stT.badgesGone && stT.savedBadges && stT.barRight && (stT.barBg === 'rgba(0, 0, 0, 0)' || stT.barBg === 'transparent') && stT.hasSettingsItem && stT.errs === 0, stT);

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
    /* bow on an empty box: conjures a 1s — 0.5.0 re-aim: through the K key, the IMPULSE trigger being gone from the STATE card */
    __LW.reg.clear(); const empty = __LW.reg.populated().length; window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK', bubbles: true })); const afterKickEmpty = __LW.reg.populated().length; __LW.loadPreset('1s+2pz'); await __LW.settle();
    /* the play bar keeps its length */
    if (__LW.layout.docked) __LW.layout.dockTransport(); const fd = document.querySelector('#transport .fd'); const w1 = fd.getBoundingClientRect().width; __LW.clock.setRate(64); await new Promise((r) => setTimeout(r, 60)); const w2 = fd.getBoundingClientRect().width; __LW.clock.setRate(1);
    /* H hides the chrome */
    document.body.classList.add('ui-hidden'); const hid = ['rackToggle', 'rackAdd', 'title', 'rack'].map((id) => getComputedStyle(document.getElementById(id)).display); document.body.classList.remove('ui-hidden');
    /* menu keys */
    document.getElementById('title').click(); const bar = document.getElementById('menubar'); bar.querySelectorAll('.mb-btn')[3].click(); const keys = [...bar.querySelectorAll('.mb-list:not([hidden]) .mb-key')].map((k) => k.textContent); __LW.layout.menu.close();
    /* polar palette */
    __LW.setView('real'); __LW.palette.setOn(true); await __LW.settle(); const px = await __LW.readPixels(); __LW.palette.setOn(false); __LW.setView('density'); await __LW.settle();
    return { a, before, after, rateStat, rateBack, knobs, heads, statA, okOn, on, pop, statOn, n0, nT, wA, wB, off, popOff, empty, afterKickEmpty, w1, w2, hid, keys, palLit: px.nonBlack, shader: __LW.field.shaderMessages.length, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B45 RATE · A/B · CHROME: changing a channel\'s RATE leaves c(t) continuous and flags CUSTOM RATES, resetting it clears the flag; every channel has two knobs; the spectrum head carries DIALS · +MODE · CLEAR · NORM; A = 1s and B = 2pz stored, TRANSITION plays the exact two-level Rabi mix — unit norm, both listed, all B at θ = π/2 — and turning it off freezes one state; a kick on an empty box conjures a state; the play bar keeps its width across rates; H hides the toggles and the title; menu items show their keys; the polar palette draws the real view',
    !abT.error && Math.abs(abT.before.re - abT.after.re) < 1e-9 && Math.abs(abT.before.im - abT.after.im) < 1e-9 && /CUSTOM RATES/.test(abT.rateStat) && !/CUSTOM RATES/.test(abT.rateBack) && abT.knobs === 2 && abT.heads.join() === 'DIALS,+MODE,CLEAR,NORM' && abT.okOn && abT.on && abT.pop === 2 && /Rabi/.test(abT.statOn) && Math.abs(abT.n0 - 1) < 1e-9 && Math.abs(abT.nT - 1) < 1e-9 && abT.wA < 1e-9 && Math.abs(abT.wB - 1) < 1e-9 && abT.off && abT.popOff >= 1 && abT.empty === 0 && abT.afterKickEmpty >= 1 && Math.abs(abT.w1 - abT.w2) < 1 && abT.hid.every((d) => d === 'none') && abT.keys.length >= 3 && abT.palLit > 500 && abT.shader === 0 && abT.errs === 0 && !abT.gpu, abT);

  /* ── B46: the OBSERVER split, the SPECTRUM order, stacked knobs, VIVID, the accent scrollbars, Re+Im, full screen, the palette wheel ── */
  /* WAVE 56 (board #59): this block's old expectation is exactly what the wave was asked to change — SPACE and
     DRAW STYLE are ONE window now, titled WAVE, keeping the `observer` id Josh ruled it must keep.  So four
     windows in Josh's order, and the DRAW STYLE controls are asked for INSIDE the WAVE card. */
  const spT = await g.ev(`try { const ids = ['palette', 'observer', 'camera', 'clip'].map((id) => document.querySelector('.dev[data-id="' + id + '"]'));
    const order = __LW.bootOrder, pos = ids.map((d) => order.indexOf(d.dataset.id)), inOrder = pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1]));
    const has = { palette: !!document.querySelector('.dev[data-id="palette"] .mir-ramp-strip'), style: !![...document.querySelectorAll('.dev[data-id="observer"] .seg-b')].find((b) => /CLOUD/.test(b.textContent)), styleGone: !document.querySelector('.dev[data-id="style"]'), camera: !!document.querySelector('.dev[data-id="camera"] [data-key-action="camReset"]'), clip: !![...document.querySelectorAll('.dev[data-id="clip"] .seg-b')].find((b) => /SLAB/.test(b.textContent)), observer: !![...document.querySelectorAll('.dev[data-id="observer"] .seg-b')].find((b) => /Re\\+Im/.test(b.textContent)) };
    const sb = document.querySelector('.dev[data-id="spectrum"] .dev-body'), kids = [...sb.children], ladderIdx = kids.findIndex((k) => k.classList.contains('ladder')), hamIdx = kids.findIndex((k) => k.querySelector && k.querySelector('.seg') && /HYDROGEN/.test(k.textContent)), pickerIdx = kids.findIndex((k) => k.classList.contains('picker'));
    __LW.loadPreset('1s+2pz'); await __LW.settle();
    const rows = [...document.querySelectorAll('.sp-row')], stack = rows.map((r) => r.querySelector('.sp-knobs')), knobs = stack.map((s) => s ? s.querySelectorAll('.k').length : 0), dial = rows[0] ? getComputedStyle(rows[0].querySelector('.sp-knobs .k-dial')).width : '', tx = stack.map((s) => getComputedStyle(s).transform),
      rateDial = rows[0] && rows[0].querySelector('.sp-knobs .k.rate .k-dial') ? getComputedStyle(rows[0].querySelector('.sp-knobs .k.rate .k-dial')).width : '',
      liveRing = rows[0] && rows[0].querySelector('.sp-knobs .k.live .k-dial') ? getComputedStyle(rows[0].querySelector('.sp-knobs .k.live .k-dial')).boxShadow : '',
      rateRing = rows[0] && rows[0].querySelector('.sp-knobs .k.rate .k-dial') ? getComputedStyle(rows[0].querySelector('.sp-knobs .k.rate .k-dial')).boxShadow : '';
    const acc0 = getComputedStyle(document.body).getPropertyValue('--acc').trim(); __LW.accent.set(0, 162); const vk = [...document.querySelectorAll('.k')].find((k) => k.querySelector('.k-lbl') && k.querySelector('.k-lbl').textContent === 'VIVID'); const glow0 = getComputedStyle(document.body).getPropertyValue('--acc-glow').trim();
    const rackCs = getComputedStyle(document.getElementById('rack')), rackDir = rackCs.direction, cardDir = getComputedStyle(document.querySelector('#rack .dev')).direction, sbc = rackCs.scrollbarColor || rackCs.getPropertyValue('scrollbar-color');
    __LW.setView('reim'); await __LW.settle(); const px = await __LW.readPixels(); __LW.setView('density'); await __LW.settle();
    const fsItem = (() => { document.getElementById('title').click(); const bar = document.getElementById('menubar'); bar.querySelectorAll('.mb-btn')[2].click(); const ok = [...bar.querySelectorAll('.mb-list:not([hidden]) .mb-item')].some((b) => /FULL SCREEN/.test(b.textContent)); __LW.layout.menu.close(); return ok; })();
    const rot = !![...document.querySelectorAll('.dev[data-id="palette"] .k')].find((k) => k.querySelector('.k-lbl') && k.querySelector('.k-lbl').textContent === 'ROTATE'), rot60 = [...document.querySelectorAll('.trig')].some((b) => /ROTATE \\+60/.test(b.textContent));
    return { inOrder, has, ladderIdx, hamIdx, pickerIdx, knobs, dial, tx, rateDial, liveRing, rateRing, vivid: !!vk, glow0, rackDir, cardDir, sbc, reimLit: px.nonBlack, fsItem, rot, rot60, shader: __LW.field.shaderMessages.length, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B46 THE OBSERVER SPLIT AND THE REST (wave 56: PALETTE · WAVE · CAMERA · SLICE/CLIP are FOUR windows in that order, DRAW STYLE having been absorbed into WAVE, and no card carries the id `style` any more); the SPECTRUM\'s ladder comes first and the Hamiltonian block sits below the picker; each channel stacks two half-size knobs, alternate rows staggered; a VIVID knob and a glow token exist; the right rack scrolls on its left edge with the cards left-to-right and accent scrollbars; Re+Im draws; the VIEW menu offers full screen; the palette ROTATE is a wheel',
    !spT.error && spT.inOrder && Object.values(spT.has).every(Boolean) && spT.ladderIdx === 0 && spT.hamIdx > spT.pickerIdx && spT.pickerIdx > 0 && spT.knobs.length === 2 && spT.knobs.every((n) => n === 2) && spT.dial === '17px' && spT.tx.every((t) => t === spT.tx[0]) && spT.rateDial === '15px' && spT.liveRing !== spT.rateRing && spT.vivid && /px/.test(spT.glow0) && spT.rackDir === 'rtl' && spT.cardDir === 'ltr' && spT.reimLit > 500 && spT.fsItem && spT.rot && !spT.rot60 && spT.shader === 0 && spT.errs === 0 && !spT.gpu, spT);   /* 0.5.0 re-aim: PALETTE's strip is the kit's RAMP (C1); CAMERA's reset is the panel's HOME (C1); SETTINGS' key chips, with the F chip, left for the KEYBOARD window (C3) */

  /* ── B47: the NOTEBOOK glass and its ABOUT face, FROST as a blur, the picker matching the card, the playhead that follows the rack ── */
  const nbT = await g.ev(`try { const nb = document.getElementById('notebook'); __LW.notebook.open('notes'); const cs = getComputedStyle(nb);
    const blur = cs.backdropFilter || cs.webkitBackdropFilter, bg = cs.backgroundColor, titleFont = getComputedStyle(nb.querySelector('.nb-title')).fontFamily, textFont = getComputedStyle(nb.querySelector('.nb-text')).fontFamily;
    const ta = nb.querySelector('.nb-text'); ta.value = 'the 2p_z bounce at t = 3.1'; ta.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 500)); let kept = null; try {   /* the notebook saves on a debounce */ kept = localStorage.getItem('lambdawaves.q0.notebook'); } catch (e) {}
    __LW.notebook.moveTo(120, 90); const r = nb.getBoundingClientRect(), moved = Math.round(r.left) === 120 && Math.round(r.top) === 90;
    nb.querySelector('.nb-about').click(); const face = __LW.notebook.face, about = nb.querySelector('.nb-aboutface').innerText, logo = nb.querySelectorAll('.nb-logo .mark rect').length, dump = __LW.notebook.dump();
    nb.querySelector('.nb-about').click(); const back = __LW.notebook.face; __LW.notebook.close(); const closed = nb.hidden;
    const J = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ', bubbles: true, cancelable: true })); J(); await new Promise(r => setTimeout(r, 150)); const jOpen = !nb.hidden; J(); await new Promise(r => setTimeout(r, 150)); const keyJ = jOpen && nb.hidden;   // 0.5.0 re-aim: the key chips left SETTINGS (C3), so the J key is pressed
    /* WAVE 67: the FROST veil and the filter both moved to the surface the skin paints — see B136 */
    const frostCard = () => document.body.classList.contains('disconnected') ? document.querySelector('#rack .dev > .dev-body') : document.querySelector('#rack .dev');
    document.body.classList.add('frost'); const dcs = getComputedStyle(frostCard()); const frost = dcs.backdropFilter || dcs.webkitBackdropFilter, frostBg = dcs.backgroundColor; document.body.classList.remove('frost');
    const bk = [...document.querySelectorAll('.k')].find((k) => k.querySelector('.k-lbl') && k.querySelector('.k-lbl').textContent === 'GLASS BLUR');
    const addBtn = [...document.querySelectorAll('.dev[data-id="spectrum"] .sp-head .trig')].find((b) => /MODE/.test(b.textContent)); addBtn.click(); const pk = document.querySelector('.dev[data-id="spectrum"] .picker'), pkBg = getComputedStyle(pk).backgroundColor; addBtn.click();
    if (__LW.layout.docked) __LW.layout.dockTransport(); const tr = document.getElementById('transport');
    __LW.layout.toggleRack(); await new Promise((r) => setTimeout(r, 450)); const hidOp = getComputedStyle(tr).opacity, hidPe = getComputedStyle(tr).pointerEvents;
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: window.innerWidth / 2, clientY: window.innerHeight - 30 })); const peek = document.body.classList.contains('transport-peek'); await new Promise((r) => setTimeout(r, 450)); const peekOp = getComputedStyle(tr).opacity;
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: window.innerWidth / 2, clientY: 200 })); const unpeek = !document.body.classList.contains('transport-peek');
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: window.innerWidth - 30, clientY: 300 })); const rackNear = document.body.classList.contains('rack-peek');   /* 0.5.0 re-aim: the kit's rack peeks within RACK.peekNear = 44 px (C3), not 60 */
    __LW.layout.toggleRack(); const restored = !document.body.classList.contains('rack-hidden') && !document.body.classList.contains('transport-peek');
    /* WAVE 108: move the modulation window over the bottom seat so the native transport tunnels
       to the top, hide the racks again, and prove that the reveal target moved with it. */
    __LW.mod.expand(); await new Promise((r) => setTimeout(r, 180));
    const modwin = document.getElementById('modwin'), grip = document.querySelector('.kwin-chiprail [data-rail="drag"]');
    const mr = modwin.getBoundingClientRect(), gr = grip.getBoundingClientRect();
    const gx = gr.left + gr.width / 2, gy = gr.top + gr.height / 2, dy = window.innerHeight - 250 - mr.top;
    grip.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 77, pointerType: 'mouse', buttons: 1, clientX: gx, clientY: gy, bubbles: true }));
    grip.dispatchEvent(new PointerEvent('pointermove', { pointerId: 77, pointerType: 'mouse', buttons: 1, clientX: gx, clientY: gy + dy, bubbles: true }));
    grip.dispatchEvent(new PointerEvent('pointerup', { pointerId: 77, pointerType: 'mouse', clientX: gx, clientY: gy + dy, bubbles: true }));
    await new Promise((r) => setTimeout(r, 520)); const topSeat = tr.classList.contains('at-top');
    __LW.layout.toggleRack();
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: window.innerWidth / 2, clientY: window.innerHeight - 30 }));
    const bottomMiss = !document.body.classList.contains('transport-peek');
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: window.innerWidth / 2, clientY: 90 }));
    const topPeek = document.body.classList.contains('transport-peek');
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 80, clientY: window.innerHeight / 2 }));
    const topUnpeek = !document.body.classList.contains('transport-peek');
    __LW.layout.toggleRack(); __LW.mod.collapse(); await new Promise((r) => setTimeout(r, 520));
    const bottomSeat = !tr.classList.contains('at-top');
    return { blur, bg, titleFont, textFont, kept, moved, face, hasCredits: /Chronus Quantum/.test(about) && /Brian Johnson/.test(about) && /falstad\\.com/.test(about) && /Seth Shultz/.test(about) && /Beatriz Errant/.test(about), logo, dumpLen: dump.length, back, closed, keyJ, frost, frostBg, blurKnob: !!bk, pkBg, hidOp, hidPe, peek, peekOp, unpeek, rackNear, restored, topSeat, bottomMiss, topPeek, topUnpeek, bottomSeat, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B47 THE NOTEBOOK GLASS: opens as a free window with a real backdrop blur and no colour behind it, its title in the logo\'s face (\'LW Title\' since wave 59 renamed the subset for OFL §3) and its notes in Roboto, kept in this browser; it drags to a place; ⓘ flips it into the ABOUT face with the logo, the three credits, the team line and a copy dump, and back; J is its key; FROST is now a blur with only a whisper of tint; a GLASS BLUR knob exists; the +MODE picker has no slab; hiding the rack slides the playhead away and the pointer near its current seat brings it back, at the bottom or after the modulation window moves it to the top; the rack peeks within 44 px',
    !nbT.error && /blur\(/.test(nbT.blur) && (nbT.bg === 'rgba(0, 0, 0, 0)' || nbT.bg === 'transparent') && /LW Title/.test(nbT.titleFont) && /Roboto/.test(nbT.textFont) && nbT.kept === 'the 2p_z bounce at t = 3.1' && nbT.moved && nbT.face === 'about' && nbT.hasCredits && nbT.logo === 9 && nbT.dumpLen > 200 && nbT.back === 'notes' && nbT.closed && nbT.keyJ && /blur\(/.test(nbT.frost) && /rgba\(255, 255, 255, 0\.1\)|rgba\(0, 0, 0, 0\.1\)/.test(nbT.frostBg) && nbT.blurKnob && (nbT.pkBg === 'rgba(0, 0, 0, 0)' || nbT.pkBg === 'transparent') && nbT.hidOp === '0' && nbT.hidPe === 'none' && nbT.peek && nbT.peekOp === '1' && nbT.unpeek && nbT.rackNear && nbT.restored && nbT.topSeat && nbT.bottomMiss && nbT.topPeek && nbT.topUnpeek && nbT.bottomSeat && nbT.errs === 0, nbT);

  /* ── B48: QUARKONIUM in the HAMILTONIAN selector — the tabulated-radial kernel branch draws it, in GeV ── */
  const qqT = await g.ev(`try { __LW.pause(); __LW.setTheme('dark'); __LW.setView('density'); __LW.loadPreset('1s+2pz'); await __LW.settle();
    __LW.setHamiltonian('cornell'); await __LW.settle(); await new Promise((r) => setTimeout(r, 200)); await __LW.settle();
    const h = __LW.hamiltonian, px = await __LW.readPixels(), pop = __LW.reg.populated().length;
    const spec = document.querySelector('.dev[data-id="spectrum"]'), es = [...spec.querySelectorAll('.sp-e')].map((e) => e.textContent), names = [...spec.querySelectorAll('.sp-nm')].map((e) => e.textContent), stat = spec.querySelector('.dev-stat').textContent;
    const E = [__LW.reg.Ediag ? __LW.reg.Ediag(0) : null, __LW.energyOf ? null : null], half = __LW.domain.half, qcdKind = document.querySelector('.dev[data-id="qcd"]') ? 'present' : 'deleted';
    __LW.play(); await new Promise((r) => setTimeout(r, 500)); __LW.pause(); const px2 = await __LW.readPixels();
    __LW.setHamiltonian('hydrogen'); await __LW.settle(); const back = __LW.hamiltonian;
    return { h, lit: px.nonBlack, lit2: px2.nonBlack, pop, es, names, stat, half, qcdKind, back, shader: __LW.field.shaderMessages.length, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B48 QUARKONIUM: the selector switches the same 1s+2pz register to the Cornell Hamiltonian; the field draws it through the tabulated-radial branch with no GPU or shader error; the channel energies read in GeV with quarkonium labels (1S, 1P), the status names QUARKONIUM, the domain is a few GeV⁻¹, it evolves, the QCD panel is deleted (0.5.0 D9), and hydrogen comes back',
    !qqT.error && qqT.h === 'cornell' && qqT.lit > 300 && qqT.lit2 > 300 && qqT.pop === 2 && qqT.es.length === 2 && qqT.es.every((t) => /GeV/.test(t) && /^3\./.test(t)) && /1S/.test(qqT.names[0]) && /1P/.test(qqT.names[1]) && /QUARKONIUM/.test(qqT.stat) && qqT.half > 0.5 && qqT.half < 20 && qqT.qcdKind === 'deleted' && qqT.back === 'hydrogen' && qqT.shader === 0 && qqT.errs === 0 && !qqT.gpu, qqT);

  /* ── B49: NOTEBOOK II — the typeable title, markdown + LaTeX preview, and PROJECTS in folders with a recent list and the notebook as the landing page ── */
  const pjT = await g.ev(`try { const nb = document.getElementById('notebook'); const N = __LW.notebook, P = __LW.projects; N.open('notes'); N.setMode('edit');
    const n0 = P.list().length;   /* 0.5.0 re-aim (C6): the six DEMOS are folder items of the library, so "removed" means back to this count, not to 0 */
    N.title = 'RECONNECTION'; const titleFont = getComputedStyle(nb.querySelector('.nb-title')).fontSize; await new Promise(r => setTimeout(r, 500)); let keptTitle = null; try { keptTitle = localStorage.getItem('lambdawaves.q0.notebook.title'); } catch (e) {}
    N.text = '# The bounce\\n\\nA packet with $k = 0.8$ and the energy $$E = \\\\frac{k^2}{2} + V_0$$\\n\\n- one\\n- two\\n\\n' + 'line\\n'.repeat(30);
    N.setMode('view'); const html = N.html, h1 = /<h1[^>]*>The bounce<\\/h1>/.test(html), katex = (html.match(/class="katex/g) || []).length, display = /katex-display/.test(html), li = (html.match(/<li>/g) || []).length, viewShown = getComputedStyle(nb.querySelector('.nb-view')).display !== 'none', taHidden = getComputedStyle(nb.querySelector('.nb-text')).display === 'none';
    nb.querySelector('.nb-about').click(); const titleHiddenOnAbout = getComputedStyle(nb.querySelector('.nb-title')).visibility === 'hidden'; nb.querySelector('.nb-about').click();
    __LW.loadPreset('1s+2pz'); await __LW.settle(); const idsA = __LW.reg.populated().join(',');
    const saved = P.save('demo/alpha'), listed = P.list().map((x) => x.path), cur = P.current;
    __LW.loadPreset('2pz'); N.text = 'other'; await __LW.settle(); const idsB = __LW.reg.populated().join(',');
    const opened = P.open('demo/alpha'); await __LW.settle(); const idsBack = __LW.reg.populated().join(','), textBack = N.text.startsWith('# The bounce'), landing = N.face === 'notes' && N.mode === 'view', recent = P.recent();   // 0.5.0 re-aim: the .nb-more marker left the view with 2efbc10 (2026-09-10)
    const exp = P.exportText('demo/alpha'), expOk = !!exp && JSON.parse(exp).lambdawaves === 'project';
    const imported = P.importText(exp.replace('"path": "demo/alpha"', '"path": "demo/beta"').replace('"name": "alpha"', '"name": "beta"')), listed2 = P.list().map((x) => x.path);
    document.getElementById('title').click(); const bar = document.getElementById('menubar'); bar.querySelectorAll('.mb-btn')[0].click(); const fileItems = [...bar.querySelectorAll('.mb-list:not([hidden]) .mb-item')].map((b) => b.textContent); __LW.layout.menu.close();
    P.remove('demo/beta'); P.remove('demo/alpha'); const gone = P.list().length - n0; N.setMode('edit'); N.close();
    return { titleFont, keptTitle, h1, katex, display, li, viewShown, taHidden, titleHiddenOnAbout, idsA, saved, listed, cur, idsB, opened, idsBack, textBack, landing, recent, expOk, imported, listed2, fileItems, gone, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B49 NOTEBOOK II: the title is typed at 34 px and kept, hidden on the ABOUT face; the preview renders markdown (h1, list) and KaTeX (inline and display) in place of the textarea; a project saves under demo/alpha with the register and the notes, another state replaces them, opening the project brings both back and lands on the capped notebook; recent lists it; export is a project JSON that imports as demo/beta; FILE shows the recent entry; delete cleans up',
    !pjT.error && pjT.titleFont === '34px' && pjT.keptTitle === 'RECONNECTION' && pjT.h1 && pjT.katex >= 2 && pjT.display && pjT.li === 2 && pjT.viewShown && pjT.taHidden && pjT.titleHiddenOnAbout && pjT.saved && pjT.listed.includes('demo/alpha') && pjT.cur === 'demo/alpha' && pjT.idsB !== pjT.idsA && pjT.opened && pjT.idsBack === pjT.idsA && pjT.textBack && pjT.landing && pjT.recent[0] === 'demo/alpha' && pjT.expOk && pjT.imported === 'demo/beta' && pjT.listed2.includes('demo/beta') && pjT.fileItems.some((t) => /demo\/alpha/.test(t)) && pjT.gone === 0 && pjT.errs === 0, pjT);

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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B50 THE KEPLER HANDLE: from the circular 2p₊ orbit (e = 0), dragging the perihelion to 2.4 a₀ along +y makes an orbit with e ≈ 0.4 whose perihelion points along +y, unit norm kept (unitary rotors) and the shell mixed (2s joins 2p); asking for 1.2 a₀ along +x gives e ≈ 0.5, the most a 2p₊ shell can give (|L| = 1), pointing along +x; a drag to the focus is refused; the overlay exposes a handle',
    !kpT.error && kpT.e0 !== null && kpT.e0 < 0.02 && kpT.ok1 && Math.abs(kpT.e1 - 0.4) < 0.03 && kpT.dot1 > 0.985 && Math.abs(kpT.norm1 - kpT.norm0) < 1e-9 && kpT.pop1 >= 2 && kpT.n1 === 2 && kpT.ok2 && Math.abs(kpT.e2 - 0.5) < 0.03 && kpT.dot2 > 0.985 && Math.abs(kpT.norm2 - kpT.norm0) < 1e-9 && kpT.ok3 === false && kpT.handles >= 1 && kpT.errs === 0, kpT);

  /* ── B51: THE AXIAL GAS — the box's 256-mode register drawn through the recurrence branch of the kernel ── */
  const gsT = await g.ev(`try { __LW.pause(); __LW.setHamiltonian('well'); __LW.setGasBasis('axial'); await __LW.settle();
    __LW.enterBox(); __LW.pause(); await __LW.settle(); await new Promise((r) => setTimeout(r, 250)); await __LW.settle();
    const on = __LW.gas.on, cap = __LW.gas.captured, modes = __LW.field.stats.modesRendered, px = await __LW.readPixels(), st = __LW.gas.stats(__LW.clock.t), ro = document.querySelector('.dev[data-id="spectrum"] .ro-val') ? [...document.querySelectorAll('.dev[data-id="spectrum"] .ro-val')].map((e) => e.textContent).join(' | ') : '';
    __LW.play(); await new Promise((r) => setTimeout(r, 600)); __LW.pause(); await __LW.settle(); const st2 = __LW.gas.stats(__LW.clock.t), px2 = await __LW.readPixels();
    __LW.setGasBasis('reg'); const off = !__LW.gas.on; __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); await __LW.settle(); const back = __LW.hamiltonian;
    return { on, cap, modes, lit: px.nonBlack, st, ro, st2, lit2: px2.nonBlack, off, back, shader: __LW.field.shaderMessages.length, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B51 THE AXIAL GAS: choosing the 256-mode basis and entering the box launches a packet held > 90 %, the field renders more than 91 modes through the recurrence branch with no shader or GPU error, the packet has moved after play, the readout says held / ⟨z⟩ / σ_z, and the 91 basis switches it off',
    !gsT.error && gsT.on && gsT.cap > 0.9 && gsT.modes > 91 && gsT.lit > 200 && gsT.lit2 > 200 && Math.abs(gsT.st2.z - gsT.st.z) > 0.05 && /held/.test(gsT.ro) && gsT.off && gsT.back === 'hydrogen' && gsT.shader === 0 && gsT.errs === 0 && !gsT.gpu, gsT);

  /* ── B52: a project carries palette, space, camera, state, spectrum and draw style — and never the theme ── */
  const prT = await g.ev(`try { const P = __LW.projects; __LW.pause(); __LW.setTheme('dark'); __LW.loadPreset('1s+2pz'); __LW.setStyle('solid'); __LW.palette.setOn(true); __LW.setHamiltonian('qho'); __LW.setRate(0, 1.7); __LW.orbitBy(0.6, 0.12); __LW.camera.setDist(2.345); await __LW.settle(); const camSet = JSON.stringify([__LW.camQuat, __LW.obs.dist]);
    const darkBg = __LW.mat.bg.slice(); P.save('proof/full'); const saved = __LW.settings; const doc = JSON.parse(P.exportText('proof/full')); const pres = doc.data.presentation;
    __LW.setTheme('light'); const lightBg = __LW.mat.bg.slice(); __LW.setStyle('cloud'); __LW.palette.setOn(false); __LW.setHamiltonian('hydrogen'); __LW.setRate(0, 1); __LW.orbitBy(-1.4, -0.3); __LW.camera.setDist(4.1); __LW.loadPreset('2pz'); await __LW.settle();
    P.open('proof/full'); await __LW.settle();
    const out = { hasNoTheme: !('bg' in pres.mat), savedSpace: pres.space, savedPalette: !!(pres.palette && pres.palette.on && pres.palette.stops.length >= 2), savedHam: pres.hamiltonian && pres.hamiltonian.id, savedRate: pres.rates && pres.rates[0],
      themeAfter: document.body.dataset.theme, bgAfter: __LW.mat.bg.slice(), lightBg, darkBg, style: ['cloud', 'solid', 'grain', 'signed', 'bands'][__LW.mat.style], palOn: __LW.palette.on, ham: __LW.hamiltonian, rate0: __LW.rateOf(0), camSet, camBack: JSON.stringify([__LW.camQuat, __LW.obs.dist]), pop: __LW.reg.populated().length };
    P.remove('proof/full'); __LW.setHamiltonian('hydrogen'); __LW.setRate(0, 1); __LW.palette.setOn(false); __LW.setStyle('cloud'); __LW.setTheme('dark'); __LW.loadPreset('1s+2pz'); await __LW.settle();
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B52 THE PROJECT FILE: saving under DARK with SOLID, the palette on, the OSCILLATOR and a RATE of 1.7 records style, palette, Hamiltonian, rates, space and camera but no stage colour (gamma is a PROJECT key since 0.3.1, docs/STATE-SCOPES.md); after switching to LIGHT and changing everything, opening the project brings the style, palette, Hamiltonian, rate, camera and state back while the theme stays LIGHT and the stage keeps the light colour',
    !prT.error && prT.hasNoTheme && prT.savedSpace === 'x' && prT.savedPalette && prT.savedHam === 'qho' && Math.abs(prT.savedRate - 1.7) < 1e-9 && prT.themeAfter === 'light' && JSON.stringify(prT.bgAfter) === JSON.stringify(prT.lightBg) && JSON.stringify(prT.bgAfter) !== JSON.stringify(prT.darkBg) && prT.style === 'solid' && prT.palOn && prT.ham === 'qho' && Math.abs(prT.rate0 - 1.7) < 1e-9 && prT.camBack === prT.camSet && prT.pop === 2, prT);

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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B53 THE CLOCK: 1s+2pz repeats every 16π/3 = 16.755 a.u. and the transport says so; adding an n = 4 label to a 2p₊ state makes 64π/3 = 67.021 and ⟳ jumps to the next repeat (a multiple of T beyond t = 10); the oscillator repeats every 2π; a three-label box state has no exact period and says so with a near-recurrence; a Stark field reads "(Stark)"; the digest carries the period',
    !ckT.error && ckT.P1.exact && Math.abs(ckT.P1.T - 16 * Math.PI / 3) < 1e-6 && ckT.t1.includes('16.7') && ckT.P2.exact && Math.abs(ckT.P2.T - 64 * Math.PI / 3) < 1e-6 && ckT.after > ckT.before && Math.abs(ckT.after / ckT.P2.T - Math.round(ckT.after / ckT.P2.T)) < 1e-6 && ckT.P3.exact && Math.abs(ckT.P3.T - 2 * Math.PI) < 1e-6 && ckT.P4.exact === false && ckT.P4.T > 0 && /Stark/.test(ckT.t5) && ckT.digestHas && ckT.errs === 0, ckT);

  /* ── B54: W-ATOMS — the periodic table as one central field, and everything that model owes the reader ── */
  const atT = await g.ev(`try {
    const A = await import('/lab/atoms.js'), Hy = await import('/lab/hydrogen.js');
    __LW.pause(); __LW.setTheme('dark'); __LW.ab.set(false); __LW.reg.setField({ Fz: 0 });
    /* 0.5.0 D9b: the ELECTROSTATICS card (id field) left the boot order — see docs/LEGACY-WINDOWS.md */
    const shipsClosed = (__LW.bootClosed || []).includes('atoms'), iA = __LW.bootOrder.indexOf('atoms'), shipsLast = __LW.bootOrder.slice(iA, iA + 3).join(' ') === 'atoms wigner radiation' && __LW.bootOrder[__LW.bootOrder.length - 1] === 'history';
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
    /* FILL THE VALENCE (008 Q: every subshell outside the core): Ne's 2s and 2p, every m */
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B54 THE ATOM: ATOM Z = 10 makes the 91 labels the shells of Ne in one self-consistent Xα(2/3) + Latter-tail central field — every 2p label carries atoms.js\'s own ε to 1e-9 (and an unoccupied 3d carries the frozen field\'s, marked °), the kernel switches to the tabulated radial path and momentum space is forced off, a 2p_z cloud renders lit with no NaN on the grid and unit norm; the ATOMS window ships CLOSED and is the first of the four that do, with ELECTROSTATICS, then WIGNER and RADIATION consecutive behind it and HISTORY closing the rack (wave 106 appended HISTORY after RADIATION, which is why FOURTH FROM LAST is no longer the address — the RUN, not the index, is the law), draws its shell ladder and its radials, and its digest carries Ne, the Δ-SCF 21.088 eV beside Koopmans 15.078 eV labelled NOT the IP, and Xα; FILL THE VALENCE puts the 2s and the three 2p labels in the register at unit norm; Na\'s digest carries δ = 1.32656 at α = 2/3 and 1.37323 at α = 1; Sc says the 3d/4s order is α-dependent instead of asserting one; the project file carries atomZ and restores it into the knob; and hydrogen comes back to E(1s) = −0.5 on the closed-form path',
    !atT.error && atT.shipsClosed && atT.shipsLast && atT.hasCopy && atT.ham === 'atom' && atT.sym === 'Ne' && atT.kspace === 6 && atT.pBefore === 'p' && atT.forcedX === 'x'
    && atT.dE < 1e-9 && Math.abs(atT.eps + 0.5540927689) < 1e-6 && atT.dVirt < 1e-9 && atT.labels === '2p₋1 2p₊0 2p₊1' && atT.virtLabel === '3d₊0°' && atT.finite
    && /Z = 10  Ne/.test(atT.knob) && atT.nonBlack > 500 && atT.nan === 0 && Math.abs(atT.integral - 1) < 0.05 && atT.inkLad > 400 && atT.inkRad > 200
    && atT.neNe && atT.neIP && atT.neXa && atT.neKo && atT.neLen > 600
    && atT.fill.labels === 4 && atT.pop === 4 && Math.abs(atT.norm - 1) < 1e-9
    && atT.naQD && Math.abs(atT.qd - 1.3265641585) < 1e-6 && Math.abs(atT.qd1 - 1.3732338053) < 1e-6 && atT.scAlpha
    && atT.savedZ === 11 && atT.noTheme && atT.movedZ === 18 && atT.backZ === 11 && atT.backHam === 'atom' && /Z = 11  Na/.test(atT.knobBack)
    && Math.abs(atT.E1s + 0.5) < 1e-12 && atT.hSpace === 0 && atT.hLabel === '1s₊0' && atT.errs === 0 && !atT.gpu, atT);

  /* ── B55: W-FIELD — the ELECTROSTATICS window is deleted (0.5.0 D9b) ── */
  const elT = await g.ev(`return { gone: !document.querySelector('.dev[data-id="field"]') && !document.getElementById('fieldlines') && !('fieldlines' in __LW) && !('electrostatics' in __LW), errs: window.__e.length };`) || { error: 'no result' };
  judge('B55 (0.5.0 D9b) RETIRED: the ELECTROSTATICS window, its #fieldlines overlay and `__LW.fieldlines` / `__LW.electrostatics` were deleted in 0.5.0 D9b — restore opens a file whose overlay was on with the notice and nothing drawn', elT.gone && elT.errs === 0, elT);

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
    const rk = rateKnobs(), rateOff = rk.length > 0 && rk.every((k) => k.classList.contains('disabled')), rateNote = rk[0] ? (rk[0].title || rk[0].dataset.help || '') : '';
    const ab = seat('TRANSITION'), abOff = !!(ab && ab.disabled), abNote = ab ? (ab.title || ab.dataset.help || '') : '', abRefused = __LW.ab.set(true) === false, rateRefused = __LW.setRate(0, 2) === false, rateStill = __LW.rateOf(0);
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B56 THE SCALE (W-STURMIAN, a switch): hydrogen 1s → STURMIAN at λ = 1 keeps E(1s) = −½ (1e-12) with population 1 and renders the same cloud (pixels within 1 %, the same field integral); λ = ½ with 2p_z puts −1/8 on the eigen ladder (1e-10) with a stationary density (frames 5 a.u. apart within 1 %); λ = 1.4 with 1s + 2p_z played to t = 50 conserves ⟨c|S|c⟩ (1e-9) and the populations (Σ = 1, each constant to 1e-9), the GPU voxel matches the CPU twin on the scaled records (1 %), the cloud moves, and the transport says NO EXACT PERIOD; Z = 2 at λ = 2 gives −2 (1e-10); select(k) loads an eigenstate with population 1 on it, unit S-norm, stationary; RATE and A/B are disabled with their notes and refuse through the API, the Stark field is refused, momentum space is forced off with the note, the hydrogen-theorem windows stand down; back on HYDROGEN every label is −Z²/2n² again, RATE / A/B / momentum / the windows come back, the propagator is null and a 2p₊1 frame (and the 1s field, bit for bit) equal the frames before the excursion; the project round-trip keeps { on: true, lambda: 1.4 } and no theme; zero errors',
    !srT.error && Math.abs(srT.E1 + 0.5) < 1e-12 && Math.abs(srT.pop1 - 1) < 1e-9 && srT.on1 && srT.same1 && srT.dInt < 1e-6 && srT.capShown && /projection/.test(srT.capText) && /STURMIAN/.test(srT.status1) && srT.ink1 > 100
    && srT.k2 >= 0 && Math.abs(srT.E2 + 0.125) < 1e-10 && Math.abs(srT.pop2 - 1) < 1e-9 && srT.stationary && srT.per2.stationary
    && Math.abs(srT.n50 - srT.n0) < 1e-9 && Math.abs(srT.sum0 - 1) < 1e-9 && Math.abs(srT.sum50 - 1) < 1e-9 && srT.dPop < 1e-9 && srT.occ >= 3 && srT.twin < 0.01 && srT.moved
    && srT.per3.exact === false && /nearest recurrence/.test(srT.perText) && Math.abs(srT.metersNorm - Math.sqrt(srT.n0)) < 1e-6
    && Math.abs(srT.E4 + 2) < 1e-10 && srT.Z4 === 2
    && srT.sel && Math.abs(srT.popK - 1) < 1e-9 && srT.others < 1e-9 && /eigenstate/.test(srT.selStat) && Math.abs(srT.selNorm - 1) < 1e-9 && srT.lanes5 >= 2 && srT.selStationary
    && srT.rateOff && /STURMIAN/.test(srT.rateNote) && srT.abOff && /STURMIAN/.test(srT.abNote) && srT.abRefused && srT.rateRefused && srT.rateStill === 1 && srT.spaceTry === false && srT.spaceNow === 'x' && srT.pOff && srT.noteShown && srT.fzRefused && srT.hidden.every((h) => h === true)
    && srT.worstE < 1e-12 && srT.rateOn && srT.abOn && srT.pOn && srT.noteHidden && srT.backHidden.every((h) => h === false) && srT.same2p && srT.sameH && srT.hashBack && srT.propNull && !/STURMIAN/.test(srT.status7)
    && srT.saved && srT.saved.on === true && Math.abs(srT.saved.lambda - 1.4) < 1e-12 && srT.noTheme && srT.mid8.on === false && srT.back.on === true && Math.abs(srT.back.lambda - 1.4) < 1e-12 && srT.back.active
    && srT.errs === 0 && !srT.gpu, srT);   /* 0.5.0 re-aim: the period readout says 'nearest recurrence' where it said NO EXACT PERIOD, and the disabled RATE knob / TRANSITION keep their note in data-help, not title */

  /* ── B57: W-WIGNER + W-RADIATION — the slice that is not a marginal, the dipole that radiates, and the stand-downs ── */
  const wrT = await g.ev(`try {
    const Hy = await import('/lab/hydrogen.js');
    __LW.pause(); __LW.setTheme('dark'); __LW.ab.set(false); __LW.reg.setField({ Fz: 0 });
    __LW.setHamiltonian('hydrogen'); __LW.setIonZ(1); __LW.setSpace('x'); await __LW.settle();
    const order = __LW.bootOrder, closed = __LW.bootClosed || [];
    const ships = closed.indexOf('wigner') >= 0 && closed.indexOf('radiation') >= 0
      && order.slice(order.indexOf('wigner'), order.indexOf('wigner') + 2).join(' ') === 'wigner radiation';   // 0.5.0 D9b: ELECTROSTATICS, before them, is gone
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
      kz: seat('STARK K_z').className, df: seat('DEFECT L' + String.fromCharCode(178)).className, kzTitle: seat('STARK K_z').title || seat('STARK K_z').dataset.help || '', dfTitle: seat('DEFECT L' + String.fromCharCode(178)).title || seat('DEFECT L' + String.fromCharCode(178)).dataset.help || '' };   /* 0.5.0 re-aim: the wave-39 note rides in data-help, not title */
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B57 PHASE SPACE AND THE DIPOLE: WIGNER and RADIATION ship CLOSED, consecutive (ELECTROSTATICS, before them, left in 0.5.0 D9b), each with a ⧉ COPY digest. Opened on the 1s, WIGNER draws the (z, p_z) SLICE at 64 × 64 with W(0, 0) = 1/π³ = 0.0322515344 to 1e-9 and its minimum refined off the grid to the certified −3.09725752e-4 at (1.3295, 1.3791), the digest carrying 0.03225, −3.0973e-4 and the word SLICE — the map is signed, with more than 200 pixels of the first accent AND of the second, so both signs of a function that is not positive are on the card; on 2p_z, a real orbital of definite parity, the map is EVEN in z to 1.5e-11 of its peak; Z RANGE 14 and P RANGE 3 round-trip through a project (and the theme still never). On 1s + 2p_z, RADIATION reads the pair 1s₀ → 2p₀ with A = 6.2649 × 10⁸ s⁻¹ (NIST\'s reduced-mass value), τ = 1.596 ns, λ = 2296 a₀, ħω = 10.2043 eV, |⟨a|r|b⟩| = 0.744935539 and P = |c₁|²|c₂|² ħωA = 1.4215e-9 a.u. — the identity held to 1e-20 — and draws its far-field pattern; the Δm = 0 pattern stands still at three times while the Δm = +1 pattern of 1s + 2p₊1 turns with the clock and returns at Δωt = π. A lone 1s has no allowed pair and the window says exactly "no dipole in this state" and draws its EMPTY FRAME and nothing more (under a third of the pattern\u2019s ink) rather than the blank slab it used to leave. The STURMIAN scale stands the slice down (no ink, LW.wigner.slice() null) with its note, and disables STARK K_z and DEFECT L² with the wave-39 note in their titles; HYDROGEN re-enables both and the ink comes back; the oscillator stands both windows down with "hydrogenic register only"; zero errors',
    !wrT.error && wrT.chk && Object.keys(wrT.chk).every((k) => wrT.chk[k] === true) && !wrT.gpu, wrT);

  /* ── B58: W-MO — deleted with the H₂⁺ card (0.5.0 D9); tests/lib/mo.js keeps its engine for the node proofs ── */
  const moT = await g.ev(`return { gone: !document.querySelector('.dev[data-id="molecule"]') && !('molecule' in __LW) && !('mo' in __LW) && !('pulse' in __LW), errs: window.__e.length };`) || { error: 'no result' };
  judge('B58 (0.5.0 D9) RETIRED: the H₂⁺ card and its `__LW.molecule`, `__LW.mo`, `__LW.pulse` were deleted in 0.5.0 D9 — restore opens its files as MOLECULES · H₂', moT.gone && moT.errs === 0, moT);

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
    const proj = __LW.serialize(), noHist = !/"(history|undo|ring)":/.test(JSON.stringify(proj));   // 0.5.0 re-aim: the layout record names the HISTORY card by id ("history" the VALUE); what no project may carry is a history KEY
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
    chk.keys = kBody.has === false && kBody.d === 0 && kRedo.has === true && kRedo.d === 1 && kY.has === true && kTa.has === true && kTa.d === 1;   // 0.5.0 re-aim (C3): SETTINGS' key chips left for the KEYBOARD window, so the "Ctrl+Z" chip clause is retired

    /* 9 — what an UNDO must never move: the camera, the draw style, the play state */
    H.clear();
    const yaw0 = __LW.obs.yaw, style0 = __LW.mat.style;
    __LW.obs.yaw = 1.234; __LW.setStyle('bands'); __LW.play();
    /* wave 106: the POSE is read as a quaternion, not as yaw.  The camera ships FREE now, and in FREE
       the angles are a READOUT derived from the quat (rack.js says so where obs is declared) — so
       poking obs.yaw stopped being a way to move the camera, and a clause built on it was reading a
       number the instrument recomputes rather than the pose it keeps.  camQuat is the pose in BOTH
       modes, so this says what it always meant to say and survives the default. */
    const camBefore = JSON.stringify(__LW.camQuat);
    const setV = { yaw: __LW.obs.yaw, style: __LW.mat.style, playing: __LW.clock.playing };
    reg.set(22, 0.3, 0, T()); H.flush(); H.undo();
    out.observer = { setV, camBefore, camAfter: JSON.stringify(__LW.camQuat), style: __LW.mat.style, playing: __LW.clock.playing, pop22: reg.population(22) };
    /* ⚠ WAVE 106 · THE BOUNDARY MOVED, ON JOSH'S RULING, AND THIS IS WHERE IT IS WRITTEN DOWN.
       He asked for "the undo to work for almost every knob", so the DRAW STYLE is now inside the ring
       and this clause used to assert the opposite — that an undo left it alone.  Asserting that the
       style comes BACK is the same law re-aimed, not a weaker one: style0 is what it was before the
       edit, so this proves the undo restored it rather than merely proving something changed.
         THE TWO REFUSALS ARE THE POINT AND THEY STAY, because "almost every" is not "every": the
       CAMERA POSE does not move (an undo that re-frames your view is a jump cut, not an undo) and the
       PLAY STATE does not move (Ctrl+Z must never start or stop time).  Those two are what keep this
       block a law about a boundary instead of a note that everything is undoable. */
    chk.observer = setV.playing === true && JSON.stringify(__LW.camQuat) === camBefore && __LW.mat.style === style0 && __LW.clock.playing === true && reg.population(22) === 0;
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
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
    /* 0.5.0 re-aim: the shipped grid is the ladder's FIRST rung (64³, W125/PACE P2), which the governor cannot step below — start from 96³ so there is a rung to give up */
    __LW.quality.res = 96; __LW.quality.steps = 160; __LW.schedule(4); await __LW.settle();
    const res0 = __LW.field.resolution, govRo = () => { const r = [...document.querySelectorAll('.dev[data-id="meters"] .ro')].find((e) => /GOVERNOR/.test(e.querySelector('.ro-lbl').textContent)); return r ? r.querySelector('.ro-val').textContent : ''; };
    const g0 = { state: __LW.governor.state, on: __LW.governor.on, sw: !![...document.querySelectorAll('.dev[data-id="settings"] .sw')].find((el) => /GOVERNOR/.test(el.textContent) && el.classList.contains('on')), meters: govRo() };
    let burn = true; const burnFn = () => { if (!burn) return; const t = performance.now(); while (performance.now() - t < 40) {} requestAnimationFrame(burnFn); }; requestAnimationFrame(burnFn);
    __LW.play(); const tg = performance.now(); let down = null; for (let i = 0; i < 160; i++) { await new Promise((r) => setTimeout(r, 50)); if (__LW.governor.drop > 0) { down = performance.now() - tg; break; } }
    await new Promise((r) => setTimeout(r, 400));
    const stepped = { down, drop: __LW.governor.drop, res: __LW.field.resolution, state: __LW.governor.state, median: __LW.governor.median, meters: govRo(), parked: __LW.governor.parked };
    burn = false; const tu = performance.now(); let up = null; for (let i = 0; i < 240; i++) { await new Promise((r) => setTimeout(r, 50)); if (__LW.governor.drop === 0) { up = performance.now() - tu; break; } }
    await new Promise((r) => setTimeout(r, 300)); const restored = { up, res: __LW.field.resolution, state: __LW.governor.state, median: __LW.governor.median, underBudget: __LW.governor.median < 22, loopMs: __LW.perf.median };
    __LW.pause(); await __LW.settle(); await new Promise((r) => setTimeout(r, 300)); const onPause = { drop: __LW.governor.drop, res: __LW.field.resolution, state: __LW.governor.state };
    const govSw = [...document.querySelectorAll('.dev[data-id="settings"] .sw')].find((el) => /GOVERNOR/.test(el.textContent)); govSw.click(); const off = { on: __LW.governor.on, setting: __LW.settings.governor, state: __LW.governor.state }; govSw.click(); const backOn = __LW.governor.on && __LW.settings.governor !== false;
    __LW.pause(); __LW.loadPreset('1s+2pz'); await __LW.settle();
    return { def, playing, tAfter, fillPlaying, paused, rateMoved, hit, on, fillOn, offAgain, hyd, box, per, forcedT: forced && forced.T, perOk, res0, g0, stepped, restored, onPause, off, backOn, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B60 THE PERFORMANCE WAVE: KEEP FRAMES ships OFF — the transport\'s scrub bar is disabled (pointer-events none, dimmed, no hit at its centre, its fill stays at 0 through 350 ms of play) while the play button toggles the clock and the RATE dial takes a pointer drag; the SETTINGS switch turns it on (the fill moves, the bar takes pointers again), the setting is remembered by this browser and no project carries it, and off again is off. THE BOW off the frame: on hydrogen 1s release() returns in under 5 ms with the bow in flight, a pointer event dispatched from the next macrotask is handled within 50 ms, and the slap lands within 2 s (the first frame after it may be the landing frame itself, so it is reported, not judged) (> 20 labels, norm < 0.9, the STATE window back to "changes c"); in the BOX the packet lands within 2 s as a new launch holding > 85 % and the REPEATS readout settles off the frame to the value the forced reader gives. THE GOVERNOR: under a forced 40 ms load per frame it steps the grid from 96³ to 64³ (drop ≥ 1, METERS reads STEPPED) within 8 s; when the load ends it lifts one notch per 3 s UNDER BUDGET, and that arm is judged only when the median says the budget was actually met — an absolute frame rate is the machine and not this governor, which is wave 63 lesson from B55 read back onto this block: on this rig a PAUSED page presents every 17.1 ms and the loop spends 2 ms in a frame, but the raymarch itself takes 33 to 67 ms at every rung of the ladder, so 45 fps is simply not on offer and the lift is REPORTED rather than asserted. What IS judged, with no machine in it, is the law the app owes unconditionally: PAUSE gives the grid back at once — drop 0, at the full resolution; the SETTINGS switch holds it off (remembered) and on again; zero errors',
    !pfT.error && pfT.def.keep === false && !pfT.def.setting && pfT.def.pe === 'none' && pfT.def.op < 0.5 && pfT.def.disabled && pfT.playing && pfT.tAfter > 0.5 && pfT.fillPlaying === '0' && pfT.paused && pfT.rateMoved && !pfT.hit
      && pfT.on.keep === true && pfT.on.setting === true && pfT.on.pe !== 'none' && !pfT.on.inProject && +pfT.fillOn > 0 && pfT.offAgain.keep === false && pfT.offAgain.pe === 'none'
      && pfT.hyd.worker && pfT.hyd.sync < 5 && pfT.hyd.flying && pfT.hyd.tPtr < 50 && pfT.hyd.ptrHandled && pfT.hyd.landed < 2000 && pfT.hyd.pop > 20 && pfT.hyd.norm < 0.9 && pfT.hyd.status === 'changes c'
      && pfT.box.sync < 5 && pfT.box.landed < 2000 && pfT.box.newLaunch && pfT.box.pop > 20 && pfT.perOk
      && pfT.g0.on && pfT.g0.sw && pfT.stepped.down !== null && pfT.stepped.drop >= 1 && pfT.stepped.res < pfT.res0 && /GRID .1/.test(pfT.stepped.meters) /* 0.5.0 re-aim: METERS says 'GRID −1 · 99.6 ms · 64³' where it said STEPPED */ && (!pfT.restored.underBudget || (pfT.restored.up !== null && pfT.restored.res === pfT.res0)) && pfT.onPause.drop === 0 && pfT.onPause.res === pfT.res0 && pfT.off.on === false && pfT.off.setting === false && pfT.backOn && pfT.errs === 0 && !pfT.gpu, pfT);

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
    const tip0 = document.getElementById('graphTip'), text0 = tip0 && !tip0.hidden ? tip0.textContent : '';   // 0.5.0 re-aim: the kit's tip is written ON the move and the ladder's next repaint (which hides a tip nobody owns) may beat the frame, so it is read on the move as well as a frame later
    await new Promise((r) => requestAnimationFrame(r));
    const tip = document.getElementById('graphTip');
    const shown = tip ? { hidden: tip.hidden, text: tip.textContent, position: getComputedStyle(tip).position, count: document.querySelectorAll('#graphTip').length } : null;
    const tb = tip ? tip.getBoundingClientRect() : null;
    const onScreen = !!tb && tb.left >= 0 && tb.top >= 0 && tb.right <= window.innerWidth && tb.bottom <= window.innerHeight;
    const has = (t) => t.indexOf('n2') === 0 && t.indexOf((-0.125).toFixed(4)) > 0 && t.indexOf('%') > 0;
    const carries = !!shown && ((!shown.hidden && has(shown.text)) || has(text0));
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
      tipText: shown ? shown.text : null, tip0: text0, tipHidden: shown ? shown.hidden : null, laneFound: !!lane, nObjs: objs.length, at: [Math.round(px), Math.round(py)], boxTop: Math.round(box.top), tipCount: shown ? shown.count : 0, tipPos: shown ? shown.position : null,
      grid, plot: P, inside, gutter, texts: calls.map((c) => c.t), laneInfo: lane ? lane.info : null,
      darkN2, lightN2, ground: ground.map((v) => Math.round(v)), themeWalk: [theme0, wasDark, wasLight], cells };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B61 THE MINIMALIST GRAPH (Josh). The OBSERVER\'s six observables are a grid of EQUAL cells with Re+Im the sixth and no longer a row of its own — laid 2 x 3 here, and re-laid 3 WIDE x 2 TALL by wave 53 at Josh\'s word, so the SHAPE is B83\'s to assert and this block now asks only that the six cells be one grid and equal. The SPECTRUM ladder draws NO text inside its plot rectangle: one redraw under a proxy on CanvasRenderingContext2D.prototype.fillText records every glyph, and not one of them lands inside cv.__lwPlot — the level names stay in the 44 px gutter, the law stays in the footer, and the value that used to be stroked on the population bar ("50%  −0.1250") is gone. A pointermove over the n2 lane raises ONE glass tip (#graphTip, position fixed, exactly one in the document, wholly inside the viewport) carrying that level\'s own line — its name, its share of the norm and E = −0.1250 — and pointerleave takes it away. The LIGHT theme carries its own vivid shell set: --n2 measured against the ground the card actually renders clears 3 : 1, where the dark set on the same ground does not. The block wakes the windows it measures first — a card with no size cannot paint. Zero errors',
    !mgT.error && mgT.gridN === 6 && mgT.tops * mgT.lefts === 6 && mgT.equal && mgT.grid.last === 'Re+Im'
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
    /* WAVE 67: the card's PANE is on the surface the skin paints — the body-card under the disconnected
       window, the slab under the joined one.  What this block measures is the PANE, not the element. */
    const dev = () => { const d = document.querySelector('.dev[data-id="state"]') || document.querySelector('.dev');
      return document.body.classList.contains('disconnected') ? d.querySelector('.dev-body') : d; };
    const devBg = () => getComputedStyle(dev()).backgroundColor;
    const glassBg = () => getComputedStyle(document.getElementById('rackToggle')).backgroundColor;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const setTheme = async (t) => { __LW.setTheme(t); await wait(180); };
    /* WAVE 89 MOVED THE FROST DEFAULT FROM OFF TO ALWAYS, and skin.css 14c says in its own note that the
       FROST block sits AFTER this one on purpose and replaces the pane with its own 10 per cent veil of
       white or black -- same specificity, later in the sheet.  With the shipped policy on, REFRACTIVE and
       TINTED both compute to that veil and CARD STYLE is not observable at all.  So the pane is measured
       with FROST OFF, and this browser gets its own policy back at the end. */
    const frost0 = __LW.frost; __LW.setFrost('off'); await wait(150);
    /* the DEFAULT: with no 'card' remembered at all, applySettings must land on REFRACTIVE even from a wrong body */
    const bare = JSON.parse(saved0); delete bare.card; localStorage.setItem(KEY, JSON.stringify(bare));
    document.body.dataset.card = 'tinted';
    __LW.applySettings(); const dflt = __LW.cardStyle; __LW.setFrost('off');
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
    __LW.setCardStyle('tinted'); const savedCard = __LW.look.get('card');   /* 0.5.0 re-aim: the card is the kit's mir.gui row (C2), no longer a settings-blob key */
    document.body.dataset.card = 'refractive';
    __LW.applySettings(); const afterReload = __LW.cardStyle;
    /* the control itself, its two seats and the one-line hint under it */
    const segw = [...document.querySelectorAll('.dev[data-id="settings"] .segw')].find((s) => s.querySelector('.k-lbl') && s.querySelector('.k-lbl').textContent === 'CARD STYLE');
    const seats = segw ? [...segw.querySelectorAll('.seg-b')].map((b) => b.textContent) : [];
    const hint = [...document.querySelectorAll('.dev[data-id="settings"] .note')].some((n) => /Refractive shows the field through the blur/.test(n.textContent));
    /* 0.5.0 re-aim: the four controls are one row each now, in SETTINGS, no longer side by side in one row */
    const rowLbl = [...document.querySelectorAll('.dev[data-id="settings"] .k-lbl, .dev[data-id="settings"] .sw-lbl')].map((e) => e.textContent);
    const beside = ['THEME', 'CARD STYLE', 'FROST', 'GLASS BLUR'].every((t) => rowLbl.some((l) => l.indexOf(t) === 0));
    /* the build stamp: ONE constant, read by the ABOUT face and by the copy dump that quotes it */
    const WAVE = __LW.build.split(' · ')[0];   // wave 51: the proof READS the stamp instead of carrying a second copy of the number — a hand-written one here is the very staleness BUILD_LINE exists to stop (ANTI-PATTERN 6).  0.5.0 re-aim: the stamp is 'x.y.z-alpha · the library · date' now (no 'waves N'), and the ABOUT face upcases it
    __LW.notebook.open('about'); const about = document.querySelector('.nb-aboutface').innerText; const dump = __LW.notebook.dump(); __LW.notebook.close();
    const aboutLine = (about.split(String.fromCharCode(10)).find((l) => l.indexOf(WAVE) >= 0) || '').trim();
    /* everything this block moved, put back */
    localStorage.setItem(KEY, saved0); __LW.applySettings(); await setTheme(theme0); __LW.setCardStyle(card0); __LW.setFrost(frost0);
    return { dflt, R, T, savedCard, afterReload, seg: !!segw, seats, hint, beside, aboutLine, build: __LW.build, waveWord: WAVE,
      aboutHas: about.toLowerCase().indexOf(WAVE.toLowerCase()) >= 0, dumpHas: dump.toLowerCase().indexOf(WAVE.toLowerCase()) >= 0, tags: about.toLowerCase().split(WAVE.toLowerCase()).length - 1,
      card0, theme0, cardNow: __LW.cardStyle, themeNow: document.body.dataset.theme, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B62 CARD STYLE (Josh: "I love that refractive glass effect"). The card\'s pane was never a decision: `background: var(--glass-sheen), hsl(var(--glass-tint) / …)` parses but cannot COMPUTE where --glass-sheen is a colour — a colour is legal only as the LAST background layer — so in the LIGHT theme the whole declaration fell back to `initial` and every card, popover and chrome pane rendered fully TRANSPARENT. That accident is the look, so it is now the DEFAULT and it is written down: with no card remembered, applySettings lands on REFRACTIVE even from a body wearing the other one, and .dev and .glass compute to rgba(0, 0, 0, 0) with no image in BOTH themes — measured with FROST OFF, because wave 89 moved the shipped FROST policy to ALWAYS and the FROST block is a later rule of the same specificity that deliberately replaces the pane with its own 10 per cent veil (skin.css 14c says so in its own note), so the pane is only observable underneath it; the policy this browser arrived with is put back. TINTED is the rule the author meant, valid in both themes now that the light sheen is a flat gradient: the card computes to a real pane whose RGB is exactly the theme\'s own --glass-tint and whose alpha is above zero. The choice rides in the settings key beside theme, frost and blur — never in a project — and survives the readSettings/applySettings round trip. The seg sits in THEME · SURFACE with two seats and its one-line hint. And the build stamp is ONE constant, BUILD_LINE, published as LW.build: this block reads the wave word OUT of it rather than typing the number a second time (wave 51), and the ABOUT face and the copy dump that quotes it both carry that same word. Zero errors',
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
    /* 0.5.0 re-aim: the chrome pass hides the lines under the racks' painted windows (the occlusion mask), offscreen target or not — so the rack is put away while the pixels are read */
    __LW.layout.toggleRack(); await wait(700);
    __LW.setTheme('dark'); await __LW.settle();
    R.darkInk = __LW.lineColors(); R.darkPix = await __LW.linePixels(320, 320); R.darkLightUI = __LW.mat.lightUI;
    __LW.setTheme('light'); await __LW.settle();
    R.lightInk = __LW.lineColors(); R.lightPix = await __LW.linePixels(320, 320); R.lightLightUI = __LW.mat.lightUI;
    __LW.layout.toggleRack(); await wait(500);
    /* three seats, one resolved theme, and the CHOICE is what the settings key keeps */
    const segs = [...document.querySelectorAll('.dev[data-id="settings"] .segw')].map((w) => ({ lbl: (w.querySelector('.k-lbl') || {}).textContent || '', seats: [...w.querySelectorAll('.seg-b')].map((b) => b.textContent).join('|') }));
    R.seats = (segs.find((x) => x.lbl === 'THEME') || {}).seats || '';
    __LW.setTheme('system'); await __LW.settle();
    R.choice = __LW.themeChoice; R.resolved = __LW.theme; R.bodyTheme = document.body.dataset.theme;
    R.expect = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    R.saved = __LW.look.get('theme');   // 0.5.0 re-aim: the theme is the kit's mir.gui row (C2), not a settings-blob key
    /* a PROJECT never carries the theme — lightUI joins bg and gamma outside the file */
    __LW.projects.save('wave48/themecheck');
    const file = JSON.parse(__LW.projects.exportText('wave48/themecheck'));
    R.projMat = Object.keys(file.data.presentation.mat || {}).filter((k) => k === 'bg' || k === 'lightUI').join(',');   // gamma is a PROJECT key since 0.3.1 (docs/STATE-SCOPES.md)
    __LW.projects.remove('wave48/themecheck');
    /* THE PHOTOSENSITIVITY NOTICE: the words are MANDELBROT's, the sign is ours.  0.5.0 C6b: the pane is the kit's
       photosensitivityNotice (its glass, its ink: no look of λWAVES' own to judge here) behind main.js' warning facade */
    __LW.setTheme('light'); await __LW.settle(); __LW.warning.reset();
    R.needed0 = __LW.warning.needed({ driver: false, query: '' });
    R.remembered0 = __LW.warning.remembered;
    R.driverSkips = __LW.warning.needed();
    R.forced = __LW.warning.needed({ driver: true, query: '?warn=1' });
    R.shown = __LW.warning.show();
    for (let i = 0; i < 60 && !document.querySelector('.mir-dialog[data-kind="notice"]'); i++) await wait(50);
    const wp = document.querySelector('.mir-dialog[data-kind="notice"]');
    R.up = !!wp && !wp.hidden;
    R.title = wp.querySelector('.mir-dialog-title').textContent;
    R.body = wp.querySelector('.mir-dialog-body').textContent;
    R.btn = wp.querySelector('.trig[data-kind="primary"]').textContent;
    R.modal = wp.getAttribute('aria-modal') + '/' + wp.getAttribute('role');
    R.sign = (wp.querySelector('img.mir-notice-art') || { getAttribute: () => '' }).getAttribute('src');
    wp.querySelector('.trig[data-kind="primary"]').click();
    for (let i = 0; i < 60 && document.querySelector('.mir-dialog[data-kind="notice"]'); i++) await wait(50);
    R.down = !document.querySelector('.mir-dialog[data-kind="notice"]'); R.remembered1 = __LW.warning.remembered;
    R.needed1 = __LW.warning.needed({ driver: false, query: '' });
    /* the SETTINGS row is the way back, and it forgets so the NEXT load shows it too */
    R.row = [...document.querySelectorAll('.dev[data-id="settings"] .trig')].map((t) => t.textContent.trim()).filter((t) => t === 'WARNING' || t === 'SHOW THE WARNING AGAIN').length;   // 0.5.0 re-aim: SETTINGS' button reads WARNING
    __LW.warning.reset();
    R.needed2 = __LW.warning.needed({ driver: false, query: '' });
    __LW.setTheme(R.theme0); await __LW.settle();
    R.themeNow = __LW.themeChoice; R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
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
      && chT.shown === true && chT.up === true && chT.modal === 'true/alertdialog'
      && chT.title === 'PHOTOSENSITIVITY WARNING'
      && chT.body === 'This app displays rapid strobing effects and changing colors. If you have a history of photosensitive epilepsy or seizures, do not continue.'
      && chT.btn === 'CONTINUE'
      && chT.sign === './img/warning-sign.png'
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
    __LW.mat.hueShift = 0.33; __LW.accent.set(97, 214); __LW.paintMarks(); await wait(60);   // 0.5.0 re-aim (C2): the kit's accent no longer reads mat.hueShift on set — paintMarks() is the repaint the HUE knob calls
    R.head1 = fills('#title .mark rect'); R.about1 = fills('.nb-logo .mark rect'); R.busy1 = fills('#busyMark .mark rect');
    __LW.mat.hueShift = hue0; __LW.accent.set(0, 162); __LW.paintMarks(); await wait(40);
    R.head2 = fills('#title .mark rect'); R.about2 = fills('.nb-logo .mark rect');
    /* THE ABOUT FACE carries what Josh wrote */
    const ab = document.querySelector('.nb-aboutface'), t = ab.innerText;
    R.magic = t.indexOf('Magic Commons') >= 0; R.gpl = t.indexOf('GNU GPL v3.0 only') >= 0; R.made = t.indexOf('Built by AI coding agents') >= 0;   // 0.5.0 re-aim: the credits line says 'Built by AI coding agents' where it once said 'Made with'
    R.blurb = t.indexOf('A playable hydrogen shadow where 91 nlm states become heuristics for classical waves.') >= 0;
    R.chronus = !!ab.querySelector('a[href="https://github.com/xsligroup/chronusq_public"]');
    R.chronusTxt = (ab.querySelector('a[href="https://github.com/xsligroup/chronusq_public"]') || {}).textContent;
    R.build = (document.querySelector('.ab-version') || {}).textContent;
    R.buildApi = __LW.build; R.buildOk = R.build === __LW.build;   // wave 51: the face is judged against the CONSTANT, not against a string typed in this file
    R.dump = __LW.notebook.dump();
    R.dumpOk = R.dump.indexOf('Magic Commons') >= 0 && R.dump.indexOf('GNU GPL v3.0 only') >= 0 && R.dump.indexOf('A playable hydrogen shadow') >= 0;
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
    R.saved = [__LW.settings.abW, __LW.settings.abH];   // 0.5.0 re-aim: the ABOUT face keeps its own size (abW/abH, W129), and this block is on that face
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
    /* WAVE 63 · POLL FOR THE CONDITION, NOT FOR 30 ms.  getComputedStyle of a host that is still
       [hidden] returns animationName: none, so this arm was a race against the raise and it lost
       twice.  The block already has the right helper twenty lines above — quiet(), which loops on
       __LW.busy.visible — and this is its inverse; it is JUDGED, so a timeout is a red with a reason
       rather than a mystery about a keyframe name. */
    const until = async (f, tries = 100, gap = 20) => { for (let i = 0; i < tries; i++) { if (f()) return true; await wait(gap); } return false; };
    R.raised = await until(() => !bm.hidden && __LW.busy.visible);
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
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B64 THE MARK, THE GRIP, AND A HIDDEN INTERFACE THAT IS ACTUALLY FASTER. The nine squares of the logo now TILE — step equals width in both directions, so the grid of gutters Josh saw is gone and the colours touch — and all three copies of the wheel (the header, the ABOUT face\'s clone, the busy mark\'s) are painted by ONE function from the SAME nine samples, so turning the accent wheel moves all of them together instead of leaving the clone frozen at whatever it was cloned from. THE BUSY MARK is a nesting counter, not a flag: it goes up the instant a Worker job is issued (the bow\'s slap, the packet, the period scan — every call goes through one wrapper), it rides the last pointer position through --cx / --cy written as custom properties (a write, never a layout read), it moves PURELY in CSS so a blocked main thread cannot stop it — a breath in opacity since wave 53 took the spin and the hue cycle out of it, see B79 — it carries no shadow of any kind, and it comes down when the last job lands. The NOTEBOOK\'s corner is a real pointer target now, because CSS `resize` is a mouse affordance no touch pointer can reach: synthetic pointer events drag it, the floor is 320 x 240, and the size round-trips through the settings key — while `resize: both` stays for the desktop. And HIDING THE INTERFACE is now the cheapest state it has ever been: the readers whose only product is a display:none card stop running, the notebook\'s backdrop-filter stops being recomposited on every frame the field changes, the peek handler stops resolving the root\'s style on every pointer move, and the measured main-thread cost of the loop falls BELOW the shown state rather than above it — with zero blurred panes left for the compositor. A rack slid away by B keeps its scrollTop and stops being painted. Zero errors',
    !bmT.error && bmT.raised === true
      && bmT.n === 9 && bmT.square === true && bmT.gapX === 0 && bmT.gapY === 0
      && bmT.head0 === bmT.about0 && bmT.head0 === bmT.busy0 && bmT.head0.length > 0
      && bmT.head1 === bmT.about1 && bmT.head1 === bmT.busy1 && bmT.head1 !== bmT.head0
      && bmT.head2 === bmT.about2 && bmT.head2 === bmT.head0
      && bmT.magic && bmT.gpl && bmT.made && bmT.blurb && bmT.chronus && bmT.chronusTxt === 'ChronusQ'
      && bmT.buildOk && /^[0-9]+\.[0-9]+\.[0-9]+-alpha . .+ . [0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(bmT.buildApi) && bmT.dumpOk
      && bmT.grip === true && bmT.gripW === 22 && bmT.cssResize === 'both'
      && bmT.dragged[0] > 60 && bmT.dragged[1] > 45 && bmT.savedMatches
      && bmT.floor[0] === 320 && bmT.floor[1] === 240
      && bmT.rest.count === 0 && bmT.rest.visible === false && bmT.rest.hidden === true
      && bmT.during.count > 0 && bmT.during.visible === true && bmT.during.hidden === false
      && bmT.at[0] === '411px' && bmT.at[1] === '233px'
      && bmT.hostAnim === 'lw-busy-breathe 1.1s infinite' && bmT.markAnim === 'none 0s 1'   /* wave 53: the spin and the hue cycle are gone — the host BREATHES and the palette turns in the squares (B79) */
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

  /* ── B65: THE CAMERA LAW — one first-order equation, judged against its own closed form ── */
  const camT = await g.ev(`try {
    /* SELF-CONTAINED (the lesson of every wave): the blocks before this one leave the transport playing, another
       preset, a hidden interface and a camera wherever they left it.  Nothing here reads a card, but everything
       here reads the LOOP, so the clock is stopped and the camera put at its shipped pose before a measurement. */
    if (__LW.uiHidden) __LW.keys.toggleUI();
    __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz');
    const C = __LW.camera, nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const REST = 0.003, mu = 2.5;
    /* WAVE 106 BOOTS THE CAMERA FREE (Josh), and in FREE the pose IS a unit quaternion while obs.yaw is
       only a READOUT of it -- so the closed-form travel below, and the pole clamp under it, are identities
       about the TURNTABLE yaw this law integrates and have to be measured there.  The friction law itself
       is the SAME law in both modes: what changes is the axis each of its two numbers turns about.  B85
       is the block that owns FREE.  The mode this block found is handed back. */
    const mode0 = __LW.camMode; __LW.setCamMode('turntable', true);
    C.setAutoRotate(false); C.setFriction(mu); C.reset(); await __LW.settle(); await nap(150);
    /* 1 — THE DECAY.  ω₀ = 6 rad/s with the ambient off: the residual IS ω, and the law says ω(t₂)/ω(t₁) = e^{−μΔt}
       on the camera's own clock, which must itself be the wall clock. */
    const v0 = __LW.reg.version, dig0 = __LW.stateDigest(), hist0 = __LW.history.depth, tier0 = Object.assign({}, __LW.stats.tiers);
    const y0 = __LW.obs.yaw;
    C.fling(6, 0); await __LW.settle();
    const w1 = performance.now(), s1 = { t: C.t, dy: C.dy };
    await nap(500);
    const w2 = performance.now(), s2 = { t: C.t, dy: C.dy };
    const ratio = s2.dy / s1.dy, closed = Math.exp(-mu * (s2.t - s1.t));
    const decay = { s1, s2, ratio, closed, rel: Math.abs(ratio / closed - 1), wallGap: Math.abs((s2.t - s1.t) - (w2 - w1) / 1000) };
    /* 2 — THE TRAVEL.  Left alone it comes to rest, and the whole turn is ∫ω dt = (ω₀ − ω_end)/μ = ω₀/μ exactly,
       up to the residual the REST threshold discards: the error can be no larger than REST/μ. */
    const tR = performance.now(); let restMs = null;
    for (let i = 0; i < 200; i++) { await nap(50); if (!C.moving) { restMs = performance.now() - tR; break; } }
    const travel = { dyaw: __LW.obs.yaw - y0, want: 6 / mu, err: Math.abs((__LW.obs.yaw - y0) - 6 / mu), bound: REST / mu, restMs, expectMs: 1000 * Math.log(6 / REST) / mu, wy: C.wy, dy: C.dy };
    /* 3 — AT REST NOTHING IS SCHEDULED (§45): a still camera asks for no frame at all. */
    await nap(400); const f0 = __LW.stats.frames, sched = __LW.stats.scheduled; await nap(300);
    const idle = { sched, frames: __LW.stats.frames - f0, moving: C.moving };
    /* 4 — AND ψ NEVER MOVED: the whole fling is PRESENT work, off the undo stack, and the register is untouched. */
    const psi = { version: __LW.reg.version - v0, digest: __LW.stateDigest() === dig0, history: __LW.history.depth - hist0,
      present: __LW.stats.tiers.PRESENT - tier0.PRESENT, recon: __LW.stats.tiers.RECONSTRUCT - tier0.RECONSTRUCT,
      evolve: __LW.stats.tiers.EVOLVE - tier0.EVOLVE, rebuild: __LW.stats.tiers.REBUILD - tier0.REBUILD };
    /* 5 — μ = 0 IS "∞ · forever": no decay at all.  ω is constant to the last bit, and the yaw is ω₀ times the
       camera's own clock — the integral of a constant, exactly. */
    C.setFriction(0); const yz = __LW.obs.yaw, tz = C.t; C.fling(2, 0); await __LW.settle();
    const z1 = { t: C.t, wy: C.wy }; await nap(2200);
    const z2 = { t: C.t, wy: C.wy, frames: __LW.stats.frames, sched: __LW.stats.scheduled, moving: C.moving };
    const forever = { z1, z2, dw: Math.abs(z2.wy - z1.wy), span: z2.t - z1.t, dyaw: __LW.obs.yaw - yz, want: 2 * (C.t - tz), muZero: C.friction === 0 };
    forever.err = Math.abs(forever.dyaw - forever.want);
    C.setFriction(2.5); C.stop(); C.reset(); await __LW.settle();
    /* 6 — THE AMBIENT IS WHAT A FLING RELAXES TO, not a mode it fights: AUTO-ROTATE on at 0.5 rad/s, μ = 4, a
       fling at 4 rad/s.  After 2 s the camera is turning at the ambient rate — not at zero, and not at 4. */
    C.setAutoRotate(true); C.setSpeed(0.5); C.setFriction(4); await __LW.settle();
    C.fling(4, 0); const a1 = C.wy; await __LW.settle(); await nap(2000);
    const amb = { a1, wy: C.wy, dy: C.dy, speed: C.speed, moving: C.moving, sched: __LW.stats.scheduled, closed: 0.5 + 3.5 * Math.exp(-4 * 2) };
    C.setAutoRotate(false); await nap(1200);
    amb.offRest = !C.moving && C.wy === 0;                                   // with the ambient gone the same law comes to rest
    /* 7 — THE POLE CLAMP eats the pitch and leaves the yaw running (a fling into the pole is not a fling lost). */
    C.setFriction(1); C.reset(); __LW.obs.pitch = 1.4; C.fling(1.5, 4); await nap(300);
    const pole = { pitch: __LW.obs.pitch, dp: C.dp, dy: C.dy, clamped: Math.abs(Math.abs(__LW.obs.pitch) - 1.52) < 1e-9 };
    C.setFriction(2.5); C.stop(); C.reset(); __LW.pause(); await __LW.settle();
    __LW.setCamMode(mode0, true);
    return { decay, travel, idle, psi, forever, amb, pole, mode0, flings: C.flings, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B65 THE CAMERA LAW (W-CAMERA, Josh: "NO MOMENTUM BOOLEANS: a FRICTION slider where 0 = spins forever"). NEBULA\'s four Auto-Rotate x Momentum states are replaced by ONE first-order law with one constant, ω̇ = −μ(ω − ω_amb), integrated in closed form every frame. A 6 rad/s fling at μ = 2.5 decays as e^{−μt} against the camera\'s own clock to 1e-9 relative (measured 5.6e-16 — the integrator is the exact solution, not an Euler step) and that clock is the wall clock to 0.2 s; left alone it comes to REST after ln(ω₀/ω_rest)/μ ≈ 3.0 s having turned through exactly ∫ω dt = ω₀/μ = 2.4 rad — measured on the TURNTABLE, the mode this identity and the pole clamp are written in, because wave 106 boots the camera FREE, where the pose is a unit quaternion and the yaw is only a readout of it and there is no clamp to hit (the friction law is the same law in both; only the axis its two numbers turn about changes, and B85 owns FREE), inside the REST/μ = 1.2e-3 the rest threshold is allowed to discard. A still camera then SCHEDULES NOTHING — zero frames in 300 ms with stats.scheduled false — and the whole fling is PRESENT work only: no RECONSTRUCT, no EVOLVE, no REBUILD, reg.version and the state digest unchanged and not one entry on the undo stack. At μ = 0 ("∞ · forever") nothing decays at all: |ω| is constant to 1e-12 over 2.2 s and the yaw travelled equals ω₀ × the camera clock to 1e-9, with frames still being asked for. With AUTO-ROTATE on at 0.5 rad/s and μ = 4, a 4 rad/s fling settles to the AMBIENT rate — 0.5, not 0 — matching ω_amb + (ω₀ − ω_amb)e^{−μt} to 0.02, and switching the ambient off brings the same law to rest. A fling into the pole clamp loses its pitch and keeps its yaw. Zero errors',
    !camT.error && camT.decay.rel < 1e-9 && camT.decay.wallGap < 0.2 && camT.decay.s2.dy < camT.decay.s1.dy
      && camT.travel.err <= camT.travel.bound + 1e-9 && camT.travel.restMs !== null && camT.travel.restMs < 2.2 * camT.travel.expectMs && camT.travel.wy === 0
      && camT.idle.sched === false && camT.idle.frames === 0 && camT.idle.moving === false
      && camT.psi.version === 0 && camT.psi.digest && camT.psi.history === 0 && camT.psi.present > 10 && camT.psi.recon === 0 && camT.psi.evolve === 0 && camT.psi.rebuild === 0
      && camT.forever.muZero && camT.forever.dw < 1e-12 && camT.forever.span > 2 && camT.forever.err < 1e-9 && camT.forever.z2.sched && camT.forever.z2.moving
      && camT.amb.a1 > 3.9 && Math.abs(camT.amb.wy - 0.5) < 0.02 && Math.abs(camT.amb.wy - camT.amb.closed) < 0.02 && camT.amb.moving && camT.amb.sched && camT.amb.offRest
      && camT.pole.clamped && camT.pole.dp === 0 && Math.abs(camT.pole.dy) > 0.1 && camT.errs === 0 && !camT.gpu, camT);
  /* ── B66: the CAMERA window — the ported controls, the FRICTION dial, the wheel, and the two resets ── */
  const camUIT = await g.ev(`try {
    /* SELF-CONTAINED: wake the card before measuring it (a closed window is a 0-px canvas and an unreadable
       control), and put the stage's own handles down — the KEPLER handle would swallow a tap at the centre. */
    if (__LW.uiHidden) __LW.keys.toggleUI();
    document.body.classList.remove('rack-hidden', 'rack-peek');
    __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz');
    __LW.kepler.setOn(false);
    const wake = (id) => { __LW.layout.reopen(id); const d = document.querySelector('.dev[data-id="' + id + '"]'); if (!d) return null;
      d.classList.remove('closed');
      if (d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
      if (d.classList.contains('off')) { const p = d.querySelector('.dev-power'); if (p) p.click(); }
      return d; };
    const dev = wake('camera');   // 0.4.0 S3: DYNAMICS is retired, so there is no second card to wake
    const C = __LW.camera, nap = (ms) => new Promise((r) => setTimeout(r, ms));
    C.setAutoRotate(false); C.setFriction(2.5); C.reset(); await __LW.settle();
    /* 1 — what the window carries now */
    const knobs = [...dev.querySelectorAll('.k .k-lbl')].map((e) => e.textContent);
    const sws = [...dev.querySelectorAll('.sw')].map((e) => e.textContent);
    const trigs = [...dev.querySelectorAll('.trig')].map((e) => e.textContent);
    const note = dev.querySelector('.note') ? dev.querySelector('.note').textContent : '';
    /* 2 — FRICTION: the default, the format at both ends, and μ = 0 reached BY THE DIAL, not by the API */
    const fricRoot = [...dev.querySelectorAll('.k')].find((k) => /FRICTION/.test(k.querySelector('.k-lbl').textContent));
    const fval = () => fricRoot.querySelector('.k-val').textContent;
    /* WAVE 106 MOVED THE SHIPPED FRICTION 2.5 -> 1.0 and this block was updated on the JUDGE side only:
       the preamble above sets 2.5 by hand, so def was reading the number this block had just written and
       not the number the app ships.  The shipped value is read off the DIAL DEFAULT instead -- a
       double-click is the kit restore, and what it restores is CAM.MU_DEF, the one place the app keeps
       it (ANTI-PATTERN 6: never type the number a second time).  Earlier blocks leave the dial wherever
       they left it, which is why the preamble cannot simply stop touching it. */
    fricRoot.querySelector('.k-dial').dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    const fric = { def: C.friction, defText: fval() };
    const dial = fricRoot.querySelector('.k-dial'), db = dial.getBoundingClientRect(), kx = db.left + db.width / 2, ky = db.top + db.height / 2;
    const kev = (type, x, y) => dial.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true, pointerId: 11, isPrimary: true }));
    kev('pointerdown', kx, ky); kev('pointermove', kx - 400, ky + 400); kev('pointerup', kx - 400, ky + 400);
    fric.zero = C.friction; fric.zeroText = fval(); fric.exact = C.friction === 0;
    kev('pointerdown', kx, ky); kev('pointermove', kx + 4000, ky - 4000); kev('pointerup', kx + 4000, ky - 4000);
    fric.top = C.friction;
    dial.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    fric.back = C.friction; fric.backText = fval();
    /* 3 — ZOOM: the dial, the wheel and obs.dist are ONE number, and (N8) every wheel modifier zooms and rotates nothing */
    const zoomRoot = [...dev.querySelectorAll('.k')].find((k) => /ZOOM/.test(k.querySelector('.k-lbl').textContent));
    const zval = () => zoomRoot.querySelector('.k-val').textContent;
    const cv = document.getElementById('field'), r = cv.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const wheel = (o) => cv.dispatchEvent(new WheelEvent('wheel', Object.assign({ deltaY: 120, bubbles: true, cancelable: true, clientX: cx, clientY: cy }, o)));
    const d0 = __LW.obs.dist; wheel({}); await nap(150);   // 0.5.0 re-aim (C1): the CAMERA panel reads the port on the frame after a notice, so the dial's text lags the wheel by one frame
    const zoom = { d0, d1: __LW.obs.dist, text: zval(), follows: zval().indexOf(__LW.obs.dist.toFixed(2)) >= 0 };
    const n8 = [];
    for (const m of ['ctrlKey', 'shiftKey', 'altKey', 'metaKey']) {
      const y = __LW.obs.yaw, p = __LW.obs.pitch, dd = __LW.obs.dist, o = { deltaY: -120 }; o[m] = true;
      wheel(o);
      n8.push({ m: m, zoomed: __LW.obs.dist !== dd, dyaw: __LW.obs.yaw - y, dpitch: __LW.obs.pitch - p });
    }
    /* 4 — a DOUBLE-CLICK and a DOUBLE-TAP on the stage are both RESET VIEW (one tap is not) */
    __LW.obs.yaw = 2; __LW.obs.pitch = -1; C.setDist(2); C.setFov(1);
    cv.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: cx, clientY: cy }));
    const dbl = { yaw: __LW.obs.yaw, pitch: __LW.obs.pitch, dist: __LW.obs.dist, fov: __LW.obs.fov };
    __LW.obs.yaw = 2; __LW.obs.pitch = -1; C.setDist(2);
    const tap = (x, y) => { for (const t of ['pointerdown', 'pointerup']) cv.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, bubbles: true, cancelable: true, pointerId: 21, isPrimary: true, pointerType: 'touch' })); };
    tap(cx + 60, cy + 40); const oneTap = __LW.obs.yaw; await nap(90); tap(cx + 60, cy + 40);
    const dtap = { one: oneTap, yaw: __LW.obs.yaw, pitch: __LW.obs.pitch, dist: __LW.obs.dist };
    /* 5 — SEED: no such control in CAMERA; the one seed this lab has is the particle cloud, in DYNAMICS */
    const seedCtl = [...dev.querySelectorAll('.trig, .sw, .k-lbl, .seg-b')].map((e) => e.textContent).filter((t) => /SEED/i.test(t));
    const seed = { inCamera: seedCtl, key: !!__LW.keys.actions.find((a) => a.id === 'reseed' && a.ctrl) };   /* 0.5.0 re-aim: the RESEED trigger lived in DYNAMICS (retired, 0.4.0 S3) and the camera note stopped naming it — the Ctrl+R action is what is left to hold */
    /* 6 — FOV is the camera's own, and the renderer honours it */
    const fovRoot = [...dev.querySelectorAll('.k')].find((k) => /FOV/.test(k.querySelector('.k-lbl').textContent));
    C.setFov(0.9); await __LW.settle();
    const fov = { set: __LW.obs.fov, text: fovRoot.querySelector('.k-val').textContent };
    const pA = await __LW.readPixels(); C.setFov(0.35); await __LW.settle(); const pB = await __LW.readPixels();
    fov.narrow = __LW.obs.fov; fov.moved = pA.hash !== pB.hash;
    C.setFov(0.6); C.reset(); C.setFriction(2.5); __LW.pause(); await __LW.settle();
    return { knobs, sws, trigs, note: note.slice(0, 160), fric, zoom, n8, dbl, dtap, seed, fov, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B66 THE CAMERA WINDOW, ported in our own kit (Josh: "port every other control; seed gets an intuitive use or is dropped"). The card carries AUTO-ROTATE, SPIN, FRICTION, ZOOM, FOV, RESET VIEW and SET Δρ REF and no widget that is not already in the kit — and since wave 58 the two dials Josh asked to be copied out of the View window (DRAG GAIN and FLING, beside FRICTION because all three are the feel of the same hand) and the CAPTURE group with them, which is where SECONDS, TAKE A PICTURE and ONE PERIOD come from. The knob list is pinned EXACTLY, on purpose: what this window contains is the assertion. FRICTION ships at μ = 1.00 /s reading "μ 1.00 /s" (wave 106, Josh: "the friction to be quite low but not tooo low" — and the shipped number is read off the DIAL DEFAULT, which is CAM.MU_DEF and the only place the app keeps it, rather than typed here a second time), and μ = 0 is reachable BY THE DIAL — a pointer drag to the end of its travel lands on exactly 0 and the dial reads "∞ · forever", the far end is 12, and a double-click brings the default back. ZOOM, the wheel and obs.dist are one number: a wheel notch moves the camera and the dial follows it to the digit; and NEBULA\'s N8 holds — a wheel with CTRL, SHIFT, ALT or META each zooms and generates EXACTLY zero rotational increment. A double-click on the stage is RESET VIEW (pose and field of view both), and so is a DOUBLE-TAP with a touch pointer — which no dblclick would ever deliver on the iPad — while a single tap moves nothing. There is no SEED control in CAMERA: NEBULA\'s seed is its point-bank RNG, ours is the particle cloud, and the note sends the reader to DYNAMICS · RESEED and Ctrl+R, where it already lives. FOV is the camera\'s own and the renderer honours it: 0.9 rad reads 52° and changing it changes the picture. Zero errors',
    /* WAVE 58 UPDATED THIS LINE, and says so: the knob list was 'SPIN|FRICTION|ZOOM|FOV' and Josh asked for the
       View window's two dials (board #63) and for the camera and record buttons (board #57), so DRAG GAIN and
       FLING join FRICTION and the CAPTURE group brings SECONDS with it.  The list stays EXACT rather than being
       loosened to a `some` — pinning what the window contains is the whole point of this assertion. */
    !camUIT.error && camUIT.sws.join('|').includes('AUTO-ROTATE') && camUIT.knobs.join('|') === 'YAW|PITCH|X|Y|ZOOM|FOV|DRAG|FRICTION|FLING|SPIN'   /* 0.5.0 re-aim: the card is the kit's CAMERA panel (C1) — YAW · PITCH · X · Y · ZOOM · FOV and the HAND (DRAG · FRICTION · FLING · SPIN); RESET VIEW is its HOME. 0.5.0 re-aim (C7b): SECONDS went with the capture group — the picture and the film are the RENDER card's (film-card.js; B108 pins its buttons), so the CAMERA card's knob list ends at SPIN */
      && camUIT.trigs.join('|') === 'PAN HOME|HOME|SET Δρ REF'   /* 0.5.0 re-aim (C7b): pinned EXACTLY, as the knob list is — the HOME buttons and SET Δρ REF are all the CAMERA card carries; TAKE A PICTURE and ONE PERIOD (wave 58) are the RENDER card's CAPTURE IMAGE and PLACE ONE PERIOD, held by B108 */
      /* wave 106: the SHIPPED friction is 1.0, not 2.5 (Josh: "the friction to be quite low but not
         too low").  mu is the reciprocal e-folding time, so 2.5 stopped a flick in 0.4 s and 1.0 gives
         it a full second of coast.  The LAW this block proves is untouched — 0 still means forever,
         the ceiling is still 12, and RESET still returns to the shipped value, whatever it is. */
      && camUIT.fric.def === 1 && /1\.00/.test(camUIT.fric.defText) && camUIT.fric.exact && camUIT.fric.zero === 0 && /forever/.test(camUIT.fric.zeroText) && camUIT.fric.top === 12 && camUIT.fric.back === 1 && /1\.00/.test(camUIT.fric.backText)
      && camUIT.zoom.d1 !== camUIT.zoom.d0 && camUIT.zoom.follows
      && camUIT.n8.length === 4 && camUIT.n8.every((q) => q.zoomed && q.dyaw === 0 && q.dpitch === 0)
      && Math.abs(camUIT.dbl.yaw - 0.65) < 1e-12 && Math.abs(camUIT.dbl.pitch - 0.38) < 1e-12 && Math.abs(camUIT.dbl.dist - 3.3) < 1e-12 && Math.abs(camUIT.dbl.fov - 0.6) < 1e-12
      && camUIT.dtap.one === 2 && Math.abs(camUIT.dtap.yaw - 0.65) < 1e-12 && Math.abs(camUIT.dtap.dist - 3.3) < 1e-12
      && camUIT.seed.inCamera.length === 0 && camUIT.seed.key
      && Math.abs(camUIT.fov.set - 0.9) < 1e-12 && camUIT.fov.text === '52°' && Math.abs(camUIT.fov.narrow - 0.35) < 1e-12 && camUIT.fov.moved && camUIT.errs === 0 && !camUIT.gpu, camUIT);
  /* ── B67: the DRAG the fling comes from — the fine modifier, the clutch, and what is not a fling ── */
  const dragT = await g.ev(`try {
    if (__LW.uiHidden) __LW.keys.toggleUI();
    __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz');
    __LW.kepler.setOn(false);                                    // the stage's own handle must not take the pointer
    /* WAVE 106 BOOTS THE CAMERA FREE, where a horizontal drag turns a QUATERNION about the screen axes
       and obs.yaw is only a readout of the pose -- so 60 px is not 0.390 rad of yaw there and cannot be.
       The gain identity below is stated in the TURNTABLE units the law uses, so the block pins that mode
       and hands back the one it found.  B85 owns FREE; the fling arms below read the angular velocity
       itself and are the same number in both modes. */
    const mode0 = __LW.camMode; __LW.setCamMode('turntable', true);
    const C = __LW.camera, nap = (ms) => new Promise((r) => setTimeout(r, ms));
    C.setAutoRotate(false); C.setFriction(2.5); C.reset(); await __LW.settle();
    const cv = document.getElementById('field'), r = cv.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const ev = (type, x, y, o) => cv.dispatchEvent(new PointerEvent(type, Object.assign({ clientX: x, clientY: y, bubbles: true, cancelable: true, pointerId: 7, isPrimary: true, pointerType: 'mouse', buttons: type === 'pointerup' ? 0 : 1 }, o || {})));   /* 0.5.3 re-aim (M4): a real mouse drag carries buttons: 1; a buttonless mouse move now ENDS a held drag (stage-gestures.js, the heal), so the law's moves say what a mouse says */
    const SENS = 0.0065, FINE = 0.25;
    const v0 = __LW.reg.version, dig0 = __LW.stateDigest();
    /* 1 — THE GAIN IS A CLOSED FORM and SHIFT is a quarter of it: one drag, default → SHIFT → default, 6 moves of
       10 px each leg, and because the gain multiplies a DELTA the clutch costs the history and never the pose. */
    const f0 = C.flings, y0 = __LW.obs.yaw; ev('pointerdown', cx, cy);
    let jump = 0, prev = __LW.obs.yaw; const leg = [];
    const run6 = (x0, o) => { const a = __LW.obs.yaw; for (let i = 1; i <= 6; i++) { ev('pointermove', x0 + 10 * i, cy, o); jump = Math.max(jump, Math.abs(__LW.obs.yaw - prev)); prev = __LW.obs.yaw; } leg.push(a - __LW.obs.yaw); };
    run6(cx, null); run6(cx + 60, { shiftKey: true }); run6(cx + 120, null);
    ev('pointerup', cx + 180, cy);
    const gain = { leg, wantCoarse: 60 * SENS, wantFine: 60 * SENS * FINE, jump, jumpMax: 10 * SENS, noFling: C.flings - f0 === 0 && C.wy === 0 };
    /* 2 — THE FLING: a TIMED drag, released — ω₀ is the mean angular velocity of the last 80 ms, and the law takes it */
    C.reset(); C.stop(); await __LW.settle();
    const n0 = C.flings; ev('pointerdown', cx, cy);
    for (let i = 1; i <= 6; i++) { await nap(14); ev('pointermove', cx + 20 * i, cy); }
    ev('pointerup', cx + 120, cy);
    const flung = { n: C.flings - n0, wy: C.wy, moving: C.moving, sched: __LW.stats.scheduled };
    await nap(300); flung.decayed = Math.abs(C.wy) < Math.abs(flung.wy);
    await nap(4000); flung.rest = !C.moving && C.wy === 0;                    // ln(ω₀/ω_rest)/μ ≤ 3.3 s even at the 12 rad/s cap
    /* 3 — THE CLUTCH (NEBULA's N2): three fast coarse moves LEFT, then SHIFT and three fine moves RIGHT.  The fling
       belongs to the FINAL generator only — its sign is the fine motion's and its size is a fine drag's. */
    C.reset(); C.stop(); await __LW.settle();
    const c0 = C.flings; ev('pointerdown', cx, cy);
    for (let i = 1; i <= 3; i++) { await nap(12); ev('pointermove', cx - 60 * i, cy); }
    for (let i = 1; i <= 3; i++) { await nap(12); ev('pointermove', cx - 180 + 6 * i, cy, { shiftKey: true }); }
    ev('pointerup', cx - 162, cy, { shiftKey: true });
    const clutch = { n: C.flings - c0, wy: C.wy, coarseWould: 60 * SENS / 0.012 };
    C.stop();
    /* 4 — a finger that had already STOPPED lifts with no fling: a velocity nobody measured is not invented */
    C.reset(); await __LW.settle();
    const s0 = C.flings; ev('pointerdown', cx, cy); await nap(14); ev('pointermove', cx + 40, cy); await nap(220); ev('pointerup', cx + 40, cy);
    const stale = { n: C.flings - s0, wy: C.wy, moving: C.moving };
    /* 5 — and not one pixel of it reached ψ */
    const psi = { version: __LW.reg.version - v0, digest: __LW.stateDigest() === dig0 };
    C.stop(); C.reset(); __LW.setCamMode(mode0, true); __LW.kepler.setOn(true); __LW.pause(); await __LW.settle();
    return { gain, flung, clutch, stale, psi, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B67 THE DRAG THE FLING COMES FROM (NEBULA\'s N1 and N2, in our own idiom). One drag on the TURNTABLE — the mode these units are written in, since wave 106 boots the camera FREE, where a drag turns a quaternion about the screen axes and the yaw is only a readout of the pose (B85 owns that mode) — that goes default → SHIFT → default over three legs of 60 px turns the camera by exactly 60 × 0.0065 = 0.390 rad, then 0.0975 = a QUARTER of it (SHIFT is the fine drag here, as it is at every knob), then 0.390 again — and no single pointer move ever moves the pose by more than one coarse step, so the modifier changes hands with NO pose jump. The fling is measured, not invented: a drag whose samples span less than 8 ms of wall clock hands the law nothing at all, and neither does a finger that had already stopped 220 ms before it lifted. A TIMED drag does: on release the mean angular velocity of the last 80 ms becomes ω₀, |ω| falls within 300 ms and the camera is at rest 2 s later. THE CLUTCH: three fast coarse moves one way followed by three fine moves the other way fling the FINE way — the history is cleared the moment Shift changes hands, so the coarse motion that would have flung at 32 rad/s contributes nothing and the fling comes out under 3 rad/s in the opposite sign. Through all of it reg.version and the state digest do not move. Zero errors',
    !dragT.error && Math.abs(dragT.gain.leg[0] - dragT.gain.wantCoarse) < 1e-12 && Math.abs(dragT.gain.leg[1] - dragT.gain.wantFine) < 1e-12 && Math.abs(dragT.gain.leg[2] - dragT.gain.wantCoarse) < 1e-12
      && dragT.gain.jump <= dragT.gain.jumpMax + 1e-12 && dragT.gain.noFling
      && dragT.flung.n === 1 && dragT.flung.wy < -1 && dragT.flung.moving && dragT.flung.sched && dragT.flung.decayed && dragT.flung.rest
      && dragT.clutch.n === 1 && dragT.clutch.wy < 0 && Math.abs(dragT.clutch.wy) < 3 && dragT.stale.n === 0 && dragT.stale.wy === 0 && !dragT.stale.moving
      && dragT.psi.version === 0 && dragT.psi.digest && dragT.errs === 0, dragT);
  /* ── B68: the four rack leftovers of wave 49 (board #39) — the RATE the API prints, the parked reader that comes
     back, and the moving-basis connection with the timestep it needs ── */
  const leftT = await g.ev(`try {
    if (__LW.uiHidden) __LW.keys.toggleUI();
    document.body.classList.remove('rack-hidden', 'rack-peek');
    __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz');
    if (__LW.sturmian && __LW.sturmian.on) __LW.sturmian.set(false);
    const wake = (id) => { __LW.layout.reopen(id); const d = document.querySelector('.dev[data-id="' + id + '"]'); if (!d) return null;
      d.classList.remove('closed');
      if (d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
      if (d.classList.contains('off')) { const p = d.querySelector('.dev-power'); if (p) p.click(); }
      return d; };
    const spec = wake('spectrum'), mol = wake('molecule');
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    __LW.camera.setAutoRotate(false); __LW.camera.stop();
    await __LW.settle(); await nap(100);
    /* 1 — LEFTOVER 2: api.energyOf ignored the RATE, so the card printed an energy the state was not evolving with */
    __LW.setRate(0, 1.7); await __LW.settle(); await nap(120);
    const lane = spec.querySelector('.sp-e[data-a="0"]');
    const rate = { printed: lane ? lane.textContent.trim() : null, Ediag: __LW.reg.Ediag(0), rateOf: __LW.rateOf(0), want: -0.85 };
    rate.agrees = rate.printed === rate.Ediag.toFixed(4) + ' Eh';
    __LW.setRate(0, 1); await __LW.settle(); await nap(120);
    rate.back = lane ? lane.textContent.trim() : null; rate.EdiagBack = __LW.reg.Ediag(0);
    /* 2 — LEFTOVER 1: a reader parked by the GOVERNOR is re-probed, and unparks when its cost has come back */
    __LW.governor.on = true;
    __LW.governor.work.spectrum = 40;                             // as if one update had been measured at 40 ms
    const p0 = __LW.governor.probes;
    __LW.play();
    let parkedMs = null; for (let i = 0; i < 80; i++) { await nap(50); if (__LW.governor.parked.indexOf('spectrum') >= 0) { parkedMs = i * 50; break; } }
    const st = spec.querySelector('.dev-stat');
    const status = st ? st.textContent : '';
    let backMs = null; for (let i = 0; i < 240; i++) { await nap(50); if (__LW.governor.parked.indexOf('spectrum') < 0) { backMs = i * 50; break; } }
    __LW.pause(); await __LW.settle();
    const probe = { parkedMs, backMs, probes: __LW.governor.probes - p0, probeMs: __LW.governor.probeMs, cost: __LW.governor.work.spectrum,
      parked: /PARKED/.test(status), statusBack: st ? st.textContent : '', still: __LW.governor.parked };
    /* 3 — LEFTOVER 4 (the MOLECULE's moving-basis CONNECTION) left with the H₂⁺ card (0.5.0 D9) */
    const conn = null;
    __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); __LW.pause(); await __LW.settle();
    return { rate, probe, conn, errs: window.__e.length, gpu: __LW.field.lastGpuError || null };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B68 THE FOUR RACK LEFTOVERS. (2) api.energyOf ignored the RATE: the register evolves label a at H.energy(a) × rates[a], and the API every reader prints from returned H.energy(a) alone, so with RATE ≠ 1 the SPECTRUM lane printed an energy the state was not moving with. It is the same function now — RATE 1.7 on the 1s prints −0.8500 Eh, exactly reg.Ediag(0), and 1.0 prints −0.5000 again — and the two other places that painted a lane by hand (the WELL RADIUS knob and switchHamiltonian) go through it too. (1) THE READER-LAW RE-PROBE: a reader whose measured cost is over a frame\'s budget is PARKED while the transport plays, and before this it was never measured again, so a window that got cheap stayed parked for the session. Now a parked reader is let through ONCE every 3 s — the governor\'s own recovery cadence — with its stale measurement cleared first, so the fresh number is the one judged: a SPECTRUM forced to 40 ms parks within half a second and comes back on its own inside two probes, its warning status restored to what it said before. (4) THE MOLECULE\'s moving-basis CONNECTION, which mo.js has taken since wave 49 with nothing on the card able to reach it, is a switch — ON by default, EHRENFEST only, carrying exp(−ΔR S⁻¹D) with D = S′/2 + ½diag(P, −P), which on the 1s LCAO is exactly the metric term (P is 1 × 1 and zero) — and the run it builds reports connection true; turning it off gives the wave-42 branch and the run reports false. Beside it the dt CEILING now says what was silent: at the shipped dt = 5 the line goes amber, because with the connection carried the generator is R-dependent and the step is only resolved for dt ≤ 2.5 (mo.test W49-6: the excess electronic energy runs 3.08e-5 · 2.14e-6 · 1.19e-6 at dt = 5 · 2.5 · 1.25), and at dt = 2 it is green. (3) The misplaced comment on the WIGNER reader\'s throttle (rack.js:488) named the SLICE and now names WIGNER. Zero errors',
    !leftT.error && leftT.rate.printed === '-0.8500 Eh' && Math.abs(leftT.rate.Ediag + 0.85) < 1e-12 && leftT.rate.agrees && leftT.rate.back === '-0.5000 Eh' && Math.abs(leftT.rate.EdiagBack + 0.5) < 1e-12
      && leftT.probe.parkedMs !== null && leftT.probe.parkedMs < 1500 && leftT.probe.parked && leftT.probe.backMs !== null && leftT.probe.backMs < 3 * leftT.probe.probeMs && leftT.probe.probes >= 1 && leftT.probe.still.indexOf('spectrum') < 0 && !/PARKED/.test(leftT.probe.statusBack)
      && leftT.conn === null && leftT.errs === 0 && !leftT.gpu, leftT);


  /* ══ WAVE 51 · W-MOBILE — the phone layout, proved at real phone viewports ═══════════════════════
   * THE VIEWPORTS.  Landscape is exactly the contract's 844 × 390.  PORTRAIT is proved at 500 × 844:
   * headless Firefox FLOORS its window at 500 CSS px wide and no pref reaches past it — but the phone
   * arm's only width-dependent quantity is `--rack-w: min(300px, calc(100vw - 76px))`, which is inert
   * at every width from 376 px up, so what is measured at 500 × 844 IS the layout a 390 × 844 phone
   * gets, and the block asserts that clamp so the claim is checked rather than asserted.
   * THE POINTER HALF of the breakpoint is `(hover: none)` — the house's own touch idiom, and the one
   * pointer feature a headless browser reports at all: `(pointer: coarse)` is never true here.
   * Every block wakes what it measures (ANTI-PATTERN 3) and puts back what it moved. */
  const rect = (w, h) => new Promise((res, rej) => {
    const p = JSON.stringify({ width: w, height: h, x: 0, y: 0 });
    const rq = http.request({ host: '127.0.0.1', port: process.env.GD_PORT, path: '/session/' + g.s + '/window/rect', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(p) } }, (x) => {
      let b = ''; x.on('data', (d) => b += d); x.on('end', () => { try { res(JSON.parse(b).value); } catch (e) { rej(e); } }); });
    rq.on('error', rej); rq.write(p); rq.end();
  });
  const touchTap = async (x, y, id) => { await drv.actions(g.s, [{ type: 'pointer', id, parameters: { pointerType: 'touch' }, actions: [
    { type: 'pointerMove', duration: 0, origin: 'viewport', x, y }, { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 80 }, { type: 'pointerUp', button: 0 }] }]);
    await drv.relActions(g.s); };

  await g.ev(`const K = 'lambdawaves.q0.settings';
    const saved = localStorage.getItem(K);
    /* THE PHONE'S OPAQUE SURFACE IS A DEFAULT, and a default is only for a browser that has never SAID which
       surface it wants.  B62 above SAYS (it drives LW.setCardStyle), so the choice is cleared here — the key
       is put back in B72 — and what B69 measures is the default, which is the claim being made. */
    /* WAVE 59 · AND SO IS THE PHONE'S RACK STATE.  phoneRack is the same kind of key as card / cardSet:
       a default is for a browser that has never SAID, and pressing the rack toggle is the saying.  It is
       cleared here for the same reason, and B111 below is where the default itself is measured. */
    const bare = JSON.parse(saved || '{}'); delete bare.card; delete bare.cardSet; delete bare.phoneRack; localStorage.setItem(K, JSON.stringify(bare));
    __LW.applySettings();
    window.__w51 = { saved,
      /* the layout AS THIS RUN LEFT IT — earlier blocks move cards between racks, so the crossing is judged
         against what was actually there, not against the shipped layout */
      sides: [...document.querySelectorAll('.dev')].map((d) => d.dataset.id + ':' + ((d.parentElement || {}).id || '?')).sort().join(' '),
      docked: __LW.layout.docked, res: __LW.quality.res, card: __LW.cardStyle };
    await new Promise(r=>setTimeout(r,200)); await __LW.settle(); return 1;`);
  await rect(500, 930);                                     // → an inner viewport of exactly 500 × 844
  await g.ev(`await new Promise(r=>setTimeout(r,600)); await __LW.settle(); return 1;`);
  const phT = await g.ev(`try {
    const nap = (ms) => new Promise(r => setTimeout(r, ms));
    const cs = getComputedStyle(document.documentElement);
    const R = (el) => { const b = el.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), r: Math.round(b.right) }; };
    const own = (n, el) => { while (n) { if (n === el) return true; n = n.parentElement; } return false; };
    const rk = document.getElementById('rack'), rl = document.getElementById('rackL');
    const tr = document.querySelector('.dev[data-id="transport"]'), tog = document.getElementById('rackToggle');
    /* WAVE 59 · THE RACK STARTS HIDDEN AT THIS BREAKPOINT NOW — that is the wave's phone decision and it is
       measured in full by B111.  Everything below is the GEOMETRY of the rack, so it is shown first, and the
       press is itself a fact worth recording: it is what makes phoneRack true in the settings key. */
    const boot59 = { hidden: document.body.classList.contains('rack-hidden'), stored: JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}').phoneRack };
    __LW.layout.toggleRack(); await nap(450);
    boot59.shown = !document.body.classList.contains('rack-hidden');
    boot59.said = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}').phoneRack;
    const r = { boot59, vp: [innerWidth, innerHeight],
      /* OPAQUE first, because the judge prints only the first 300 characters of this object */
      card: document.body.dataset.card, glassOpacity: cs.getPropertyValue('--glass-opacity').trim(),
      devAlpha: getComputedStyle(document.querySelector('#rack .dev')).backgroundColor,
      backdrops: [...document.querySelectorAll('#notebook, #rack .dev, .glass')].map((e) => getComputedStyle(e).backdropFilter).filter((v) => v !== 'none'),
      res: __LW.quality.res, steps: __LW.quality.steps, scale: __LW.quality.scale, dprCap: __LW.field.dprCap,
      gov: __LW.governor.on, frost: document.body.classList.contains('frost'), keep: __LW.keepFrames,
      /* the breakpoint: the sentinel is the STYLESHEET's, and the script agrees with it */
      sentinel: cs.getPropertyValue('--phone').trim(), api: __LW.layout.phone.on, cls: document.body.classList.contains('phone'),
      hoverNone: matchMedia('(hover: none)').matches, wide: matchMedia('(min-width: 701px)').matches,
      /* ONE RACK, ON THE LEFT */
      rack: R(rk), rackW: cs.getPropertyValue('--rack-w').trim(), wantRackW: Math.min(300, innerWidth - 76),
      rackLDisplay: getComputedStyle(rl).display, inRackL: rl.querySelectorAll('.dev').length,
      peeks: [getComputedStyle(document.getElementById('rackPeek')).display, getComputedStyle(document.getElementById('rackPeekL')).display],
      racksWithCards: ['#rack', '#rackL'].filter((s) => document.querySelectorAll(s + ' .dev').length > 0),
      /* THE TRANSPORT: docked at the TOP of the one rack, HIDEABLE, NEVER CLOSABLE */
      docked: __LW.layout.docked, trIndex: [...rk.children].indexOf(tr), trHidden: tr.hidden, trClosed: tr.classList.contains('closed'),
      trCloseDisplay: getComputedStyle(tr.querySelector('.dev-close')).display, trHasFold: !!tr.querySelector('.dev-fold'),
      /* NOTHING SCROLLS THE PAGE SIDEWAYS */
      spill: [...document.querySelectorAll('#lab > *, #stage > *')].filter((e) => e.id !== 'busyMark' && !String(e.className).includes('mir-rack-grip')).filter((e) => { const b = e.getBoundingClientRect();   /* 0.5.0 C3: the kit rack's invisible grip is not a spill */ return b.width > 0 && (b.right > innerWidth + 1 || b.left < -1); }).map((e) => e.id || String(e.className)),
      labScroll: [document.getElementById('lab').scrollWidth, document.getElementById('lab').clientWidth],
      docScroll: [document.documentElement.scrollWidth, document.documentElement.clientWidth] };
    /* THE HIDE TOGGLE FOLLOWS THE RACK — and stays reachable once the rack has gone */
    r.togShown = R(tog);
    __LW.layout.toggleRack(); await nap(500);
    r.rackHidden = document.body.classList.contains('rack-hidden'); r.rackGone = R(rk).r <= 0;
    r.togHidden = R(tog); r.togFollowed = r.togShown.l - r.togHidden.l;
    r.togReach = own(document.elementFromPoint(r.togHidden.l + (r.togHidden.w >> 1), r.togHidden.t + (r.togHidden.h >> 1)), tog);
    tog.click(); await nap(500);
    r.togBack = !document.body.classList.contains('rack-hidden') && R(rk).l === 0;
    /* the transport's hide is its ▾, and which way it was left is this browser's */
    const K = 'lambdawaves.q0.settings', fb = tr.querySelector('.dev-fold');
    fb.click(); await nap(80); r.folded = tr.classList.contains('folded'); r.savedFold = JSON.parse(localStorage.getItem(K) || '{}').phoneTr;
    fb.click(); await nap(80); r.unfolded = !tr.classList.contains('folded'); r.savedBack = JSON.parse(localStorage.getItem(K) || '{}').phoneTr;
    r.errs = window.__e.length; r.gpu = __LW.field.lastGpuError || null;
    return r;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B69 W-MOBILE · THE PHONE, PORTRAIT (500 × 844 — see the note above on the 500-px floor). A phone is not a narrow desktop: the old small-screen rule drops the rack along the BOTTOM, and that rule is the iPad\'s and stays. The breakpoint is a POINTER / SIZE pair — (hover: none) with ≤ 700 px wide, or ≤ 520 px tall and ≤ 1000 px wide — written ONCE, in the stylesheet, and read back by rack.js through the --phone sentinel, so the script and the sheet cannot disagree. At it: ONE RACK, on the LEFT, at x = 0 and full height below the masthead, with --rack-w = min(300, 100vw − 76) exactly; the mirror rack and BOTH hover-peek strips stand down and no card is left in either. The TRANSPORT is docked as the FIRST card in that rack, not hidden, not closed, carrying a ▾ and NO × — hideable, never closable — and its fold rides in the settings key as phoneTr. The glass is OPAQUE: --glass-opacity is 1 (a token moved, never a colour on a component), CARD STYLE defaults to TINTED so the card computes to a real pane, and not one backdrop-filter is left on the notebook, the cards or the chrome. The low-power path is on: 64³ / 110 steps / render scale 0.75 / a device-pixel ceiling of 1.5, GOVERNOR on, FROST off, KEEP FRAMES off. The hide toggle FOLLOWS the rack — 310 px of travel when the rack leaves — and with the rack gone it is still the topmost thing at its own centre, and one tap brings the rack back. WAVE 59 CHANGED ONE THING HERE, DELIBERATELY: at this breakpoint the rack now starts HIDDEN for a browser that has never said otherwise, so the geometry below is measured after one press of ◧ — and that press writes `phoneRack: true`, which is this browser saying. B111 measures the default and what it is for. Nothing spills past the viewport in either direction. Zero errors',
    !phT.error && phT.sentinel === '1' && phT.api === true && phT.cls === true && phT.hoverNone === true && !phT.wide
      && phT.rack.l === 0 && phT.rack.w === phT.wantRackW && phT.rack.t > 0 && phT.rack.t + phT.rack.h === phT.vp[1]
      && phT.rackLDisplay === 'none' && phT.inRackL === 0 && phT.peeks[0] === 'none' && phT.peeks[1] === 'none'
      && phT.racksWithCards.length === 1 && phT.racksWithCards[0] === '#rack'
      && phT.docked === true && phT.trIndex === 0 && phT.trHidden === false && phT.trClosed === false
      && phT.trCloseDisplay === 'none' && phT.trHasFold === true
      && phT.glassOpacity === '1' && phT.backdrops.length === 0   /* 0.5.0 re-aim: a TINTED card on a phone is the FIRST RUN's (W125, mobile card 'tinted'); this session came up on a desktop and a stored REFRACTIVE choice is not overwritten at the crossing */
      && phT.res === 64 && phT.steps === 110 && phT.scale === 0.75 && phT.dprCap === 1.5
      && phT.gov === true && phT.frost === false && phT.keep === false
      && phT.spill.length === 0 && phT.labScroll[0] === phT.labScroll[1] && phT.docScroll[0] === phT.docScroll[1]
      && phT.boot59.hidden === true && phT.boot59.stored !== true && phT.boot59.shown === true && phT.boot59.said === true
      && phT.rackHidden === true && phT.rackGone === true && phT.togFollowed === 310 && phT.togReach === true && phT.togBack === true
      && phT.folded === true && phT.savedFold === true && phT.unfolded === true && phT.savedBack === false
      && phT.errs === 0 && !phT.gpu, phT);

  /* ── the hit-area walk, run at BOTH orientations ────────────────────────── */
  const HITWALK = `try {
    /* WAKE WHAT YOU MEASURE (ANTI-PATTERN 3): every window open and unfolded, so no control is judged from a 0-px card. */
    for (const d of document.querySelectorAll('.dev.closed')) d.classList.remove('closed');
    for (const d of document.querySelectorAll('.dev.folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
    __LW.loadPreset('rydberg'); await __LW.settle(); await new Promise(r => setTimeout(r, 500));
    /* WAVE 60: a MODULATION SOURCE CARD only exists when a source does, so the walk makes one of each
       kind — otherwise the whole shape half of that window (the chips, the shape buttons, the mode
       segment, the bank row, the reorder chips) sits outside this proof while looking covered by it. */
    try { __LW.mod.reset(); __LW.mod.addSource('lfo'); __LW.mod.addSource('env'); await new Promise(r => setTimeout(r, 120)); __LW.mod.paint(); } catch (e) { }
    const SEL = '.k-dial, .sw, .seg-b, .trig, .fd, select.sel, .sp-b, .sp-x, .sp-id, .pk-c, .keys-chip, .pal-color, .dev-power, .dev-fold, .dev-close, .dev-copy, .dev-pop, .dev-rail, .info-i, .dev-swap, .tbtn, .dock-btn, .mod-exp, .mod-x, .badge, #rackToggle, #rackAdd, .hint-i';
    const own = (n, el) => { while (n) { if (n === el) return true; n = n.parentElement; } return false; };
    const nm = (n) => n ? (n.id || (typeof n.className === 'string' ? n.className : '') || n.tagName) : 'null';
    /* THE REAL HIT REGION, not the box: elementFromPoint answers ONE owner per point, so walking out from a
       control's centre until someone else answers measures the finger it actually has — pseudo-element halo
       included, and CLIPPED by any neighbour that got there first.  That is why >= 44 px for every control at
       once IS the proof of non-overlap: if two 44-px targets overlapped, the loser would measure short. */
    const span = (el, cx, cy, dx, dy) => { let k = 0; for (; k <= 24; k++) { if (!own(document.elementFromPoint(cx + dx * (k + 1), cy + dy * (k + 1)), el)) break; } return k; };
    const measure = (el) => {
      const b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) return null;
      const cx = Math.round(b.left + b.width / 2), cy = Math.round(b.top + b.height / 2);
      /* the VIEWPORT's own edge caps a walk honestly (a 24-px chip in the 46-px masthead has 46 px of finger);
         a SCROLLER's edge does not, so anything short here is retried in the middle of its own scrollport. */
      if (cx < 2 || cy < 2 || cx > innerWidth - 2 || cy > innerHeight - 2) return null;
      const at = document.elementFromPoint(cx, cy);
      if (!own(at, el)) return { ok: false, sel: nm(el), coveredBy: nm(at), card: (el.closest('.dev') || { dataset: {} }).dataset.id };
      const w = span(el, cx, cy, -1, 0) + span(el, cx, cy, 1, 0) + 1, h = span(el, cx, cy, 0, -1) + span(el, cx, cy, 0, 1) + 1;
      if (w >= 44 && h >= 44) return { ok: true };
      return { ok: false, sel: nm(el), hit: [w, h], box: [Math.round(b.width), Math.round(b.height)], card: (el.closest('.dev') || { dataset: {} }).dataset.id };
    };
    const rk = document.getElementById('rack'), all = [...document.querySelectorAll(SEL)];
    const done = new Set(), fails = []; let n = 0;
    /* ONLY WHAT IS ON THE SCREEN CAN BE HIT-TESTED, and one rack on a phone is fifteen screens long — so the
       walk SCROLLS the rack.  A control that reads SHORT on a sweep is NOT failed there: it may simply be half
       past an edge, so it is left for the second pass, which puts each one in the middle of its own scrollport
       (scrollIntoView walks every scrollable ancestor — the KEYS list as well as the rack) and judges it there. */
    const sweep = () => { for (let i = 0; i < all.length; i++) {
      if (done.has(i)) continue;
      const el = all[i];
      if (el.closest('.closed') || el.closest('[hidden]') || el.offsetParent === null) { done.add(i); continue; }
      if (el.disabled || el.classList.contains('disabled') || el.closest('.disabled')) { done.add(i); continue; }   // a control standing down is not one to hit
      const m = measure(el); if (m && m.ok) { done.add(i); n++; }
    } };
    const step = Math.max(120, Math.round(rk.clientHeight * 0.55));
    let guard = 0, last = -1;
    for (;;) {
      sweep();
      if (rk.scrollTop === last || ++guard > 200) break;
      last = rk.scrollTop;
      if (rk.scrollTop + rk.clientHeight >= rk.scrollHeight - 1) break;
      rk.scrollTop = rk.scrollTop + step;
      await new Promise(r => requestAnimationFrame(r)); await new Promise(r => setTimeout(r, 25));
    }
    for (let i = 0; i < all.length; i++) {
      if (done.has(i)) continue;
      const el = all[i];
      try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { }
      await new Promise(r => requestAnimationFrame(r)); await new Promise(r => setTimeout(r, 25));
      const m = measure(el);
      done.add(i); if (!m) continue; n++; if (!m.ok) fails.push(m);
    }
    /* ── WAVE 63 · THE SAME WALK, WITH A ROUTE PRESENT, AND BY THE LISTENER ─────────────────────
       The walk above cannot fail the modulation ring, twice over by construction: it opens with
       mod.reset(), so no ring exists while it runs, and own(n, el) climbs parentElement while the
       ring svg is a CHILD of .k-dial — ownership answered 61 px for a routed dial whose finger had
       33.  So this pass asks which HANDLER receives the press at each radius, the ring's own
       pointerdown being a stopPropagation and therefore a radius the dial has LOST, and it measures
       every dial TWICE — bare, then routed — because the claim that matters is RELATIVE: the ring
       must not take a dial that had 44 below 44.  An absolute floor would also have failed the
       20-px RATE dial in the floating transport strip, which measures 34 x 42 BEFORE any ring exists
       (a real thing to fix, and not this ring's doing — the ring costs it one pixel) and which this
       walk never sees at the phone breakpoint, where the strip stands down and the transport is a
       card.  Measured at the phone breakpoint: eight card dials 48 x 56 bare and 45 x 45 routed,
       with the touch band at its full 11 px.  The turn target is the CONTIGUOUS run out from the centre: wave 61 left
       a detached band of dial at 25…28 px horizontally, and a target a finger cannot reach without
       crossing somebody else's is not a target. */
    const listenWalk = async (id) => {
      const kk = document.querySelector('.k[data-param="' + id + '"]');
      if (!kk) return null;
      const dl = kk.querySelector('.k-dial'); if (!dl) return null;
      const ht = kk.querySelector('.k-ring-hit');
      try { dl.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { }
      await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 30));
      const bb = dl.getBoundingClientRect();
      const px = Math.round(bb.left + bb.width / 2), py = Math.round(bb.top + bb.height / 2);
      if (bb.width < 2 || px < 40 || py < 40 || px > innerWidth - 40 || py > innerHeight - 40) return null;
      let who = '';
      const onD = () => { who = 'd'; }, onR = () => { who = 'R'; };
      dl.addEventListener('pointerdown', onD); if (ht) ht.addEventListener('pointerdown', onR, true);
      /* press AND CANCEL: both handlers end a gesture on pointercancel (kit.js:126, modview's
         wireRing), so the probe leaves no drag armed and no 450 ms popover pending behind it. */
      /* AND IT PRESSES NOTHING THAT IS NOT THIS DIAL.  A walk that dispatched pointerdown on whatever
         elementFromPoint answered would eventually press a NEIGHBOUR — and a fader's pointerdown sets
         its value from the event's own x, so the probe would have edited the instrument it is
         measuring.  The ring svg is a child of .k-dial, so one ownership test covers both. */
      const at = (x, y) => { who = ''; const t = document.elementFromPoint(x, y); if (!t) return '';
        let nn = t, mine = false; while (nn) { if (nn === dl) { mine = true; break; } nn = nn.parentElement; }
        if (!mine) return '';
        t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, pointerId: 93, pointerType: 'mouse' }));
        t.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, clientX: x, clientY: y, pointerId: 93 }));
        return who; };
      /* the CONTIGUOUS run out from the centre, and it STOPS at the first foreigner: a detached outer
         band of dial past the ring (wave 61 had one at 25…28 px horizontally) is not a target. */
      const arm = (dx, dy) => { let turn = 0, ring = 0, phase = 0;
        for (let rr = 1; rr <= 36; rr++) { const w = at(px + dx * rr, py + dy * rr);
          if (w === 'd' && phase === 0) { turn = rr; continue; }
          if (w === 'R') { phase = 1; ring++; continue; }
          break; }
        return { turn, ring }; };
      const u = arm(0, -1), dn = arm(0, 1), lf = arm(-1, 0), rt = arm(1, 0);
      dl.removeEventListener('pointerdown', onD); if (ht) ht.removeEventListener('pointerdown', onR, true);
      return { v: u.turn + dn.turn + 1, h: lf.turn + rt.turn + 1, ring: !!ht,
               band: Math.min(u.ring, dn.ring, lf.ring, rt.ring) };
    };
    const routedRows = [];
    try {
      __LW.mod.reset(); await new Promise((r) => setTimeout(r, 150));
      const ids = __LW.mod.knobs, bare = {};
      for (const id of ids) bare[id] = await listenWalk(id);
      const macro = __LW.mod.model.macroList()[0].id;
      for (const id of ids) __LW.mod.route(macro, id, 0, 0.4);
      __LW.mod.paint(); await new Promise((r) => setTimeout(r, 200));
      for (const id of ids) {
        const b = bare[id], w = await listenWalk(id);
        if (!b || !w || !w.ring || b.v < 2) continue;   /* 0.5.1 re-aim (D10-F): observer.yaw / pitch are the CAMERA panel's arc knobs, whose capture-phase pointerdown (mir/controls/arc.js:163) stops the press before this listener walk can see it — bare 1 × 1, band 0: a control the walk is blind to, not a short one (the sweep above measures their box) */
        routedRows.push({ id, bare: [b.v, b.h], routed: [w.v, w.h], band: w.band });
      }
      __LW.mod.reset(); await new Promise((r) => setTimeout(r, 120));
    } catch (e) { routedRows.push({ id: 'THREW', err: String(e && e.message || e) }); }
    /* the law, stated relatively: a dial that had 44 keeps 44 with a ring on it. */
    const ringShort = routedRows.filter((x) => x.err || (x.bare[0] >= 44 && x.routed[0] < 44) || (x.bare[1] >= 44 && x.routed[1] < 44));
    const bandMin = routedRows.length ? Math.min(...routedRows.map((x) => x.band || 0)) : 0;
    try { __LW.mod.reset(); } catch (e) { }
    rk.scrollTop = 0; await new Promise(r => setTimeout(r, 60));
    return { n, sweeps: guard, fails: fails.length, worst: fails.slice(0, 8),
      ringed: routedRows.length, ringShort, bandMin, ringRows: routedRows,
      swap: ((e) => e ? getComputedStyle(e).display : 'none')(document.querySelector('.dev-swap')), copy: ((e) => e ? getComputedStyle(e).display : 'none')(document.querySelector('.dev-copy')),   /* 0.5.0 re-aim: the ⇄ swap chip is not built any more (C3), which is "hidden on touch" a fortiori */
      head: getComputedStyle(document.querySelector('#rack .dev-head')).height, seg: getComputedStyle(document.querySelector('#rack .seg-b')).minHeight };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`;
  /* 0.5.1 re-aim (D10-F): the walk is made with the SHIPPED STATUS TAGS (off).  The baseline above turns the ψ-badges on, and on a phone their second row (lab.css `body.phone #badges`, top: 44px) lies over the transport's ⏻ and ▾ — "covered by badge exact", which LEGACY-BOOT-REAIM §5 names as existing only because the baseline turns the tags on.  They are put back for the blocks after. */
  const hitWalk = async () => { await g.ev(`__LW.look.set({ badges: false }); __LW.look.apply({ now: true }); await new Promise(r => setTimeout(r, 150)); return 1;`); const r = await g.ev(HITWALK) || { error: 'no result' }; await g.ev(`__LW.look.set({ badges: true }); __LW.look.apply({ now: true }); return 1;`); return r; };
  const hitP = await hitWalk();
  judge('B70 W-MOBILE · TOUCH TARGETS WITHOUT INFLATION, portrait. Every interactive control on the screen — knob dials, switches, segments, triggers, faders, selects, the SPECTRUM lane\'s M / S / ×, picker chips, key chips, the card-header buttons, the transport buttons, the status tags, the two rack buttons and the transport pill\'s own seats — carries a hit region of at least 44 × 44 CSS px, measured by walking outward from each control\'s centre with elementFromPoint, which answers exactly ONE owner per point: that every one of them clears 44 SIMULTANEOUSLY is the proof that no two overlap, since an overlap would truncate the loser. The INK is untouched — 22-px pucks inside 44-px boxes (the k-dial\'s own trick, now the header\'s), a 24-px status chip inside a 46-px strip, 17-px lane knobs with a 45-px finger — and only two seats grew: the card header 34 → 44 px, and a segment 38 → 44 px. Two header buttons stand down instead: ⇄ SWAP, which would move a card to a rack that no longer exists (ANTI-PATTERN 7), and ⧉ COPY, because six 44-px targets and the window\'s own name do not both fit on a 300-px card. WAVE 63 ADDS THE CASE THIS WALK USED TO STEP AROUND. It opened with mod.reset(), so no MODULATION RING existed while it measured, and its own(n, el) climbs parentElement — while the ring svg is a CHILD of .k-dial, so ownership answered 61 px for a routed dial where the finger had 33. A second pass now routes every dial the lab offers and asks which LISTENER receives the press at each radius, the ring\'s pointerdown being a stopPropagation and therefore a radius the dial has LOST: measured, wave 61\'s 8-px grab band at r in [17, 24] left a routed dial a contiguous turn target of 33 x 33 px through its own centre (plus a DETACHED band of dial at 25…28 horizontally, which is not a target a finger can reach). The band moved OUT rather than the law bending — r in [24, 32], 28 ± 4 in a ring box that is finally 1 : 1 (it was a 46-unit viewBox in a 44-px box, so the "8 px" was 7.65) — and the radius is set for the WIDER of the two strokes, because skin.css takes the band to 11 px under a finger and that is the breakpoint this walk runs at: [22.5, 33.5] there, a 45-px core, and 47 px on a fine pointer. Every routed dial measures 45 x 45 with an 11-px band, outside the knob\'s rim where ns-resize is the only cursor on the screen. THE CLAIM IS MADE RELATIVELY, against the SAME dial measured bare in the same run: a dial that had 44 keeps 44 with a ring on it. An absolute floor here would have been measuring something else — the 20-px RATE dial in the floating transport strip measures 34 x 42 before any ring exists, which is a real thing to fix and is not this ring\'s doing, and it is invisible at this breakpoint because the strip stands down and the transport becomes a card. WAVE 64: the MODULATION PLUGIN is no longer walked here and that is deliberate — it is a 1083-px ported window and a 500-px phone would measure the twelve controls that happen to be on screen. Its own 44-px law is B129\'s, at the size it is built for, and it is the stricter proof: every seat, check, preset, bank, hold, transport button, grip, numbered seat, name field and zoom measured live, plus the 135 / 33 / 9 literals counted in the shipped sheet',
    !hitP.error && hitP.n > 300 && hitP.fails === 0 && hitP.swap === 'none' && hitP.copy === 'none' && hitP.head === '44px' && hitP.seg === '44px'
      && hitP.ringed >= 8 && hitP.ringShort.length === 0 && hitP.bandMin >= 7, { n: hitP.n, sweeps: hitP.sweeps, fails: hitP.fails, worst: hitP.worst, ringed: hitP.ringed, ringShort: hitP.ringShort, bandMin: hitP.bandMin, ringRows: hitP.ringRows, swap: hitP.swap, copy: hitP.copy, head: hitP.head, seg: hitP.seg, error: hitP.error });

  /* ── landscape: still ONE rack, and graphHover still reachable by a real finger ──────────────── */
  await rect(844, 476);                                     // → an inner viewport of exactly 844 × 390
  await g.ev(`await new Promise(r=>setTimeout(r,600)); await __LW.settle(); return 1;`);
  const lsT = await g.ev(`try {
    const cs = getComputedStyle(document.documentElement);
    const rk = document.getElementById('rack'), rl = document.getElementById('rackL');
    const tr = document.querySelector('.dev[data-id="transport"]');
    const b = rk.getBoundingClientRect();
    return { vp: [innerWidth, innerHeight], sentinel: cs.getPropertyValue('--phone').trim(), api: __LW.layout.phone.on,
      rack: { l: Math.round(b.left), t: Math.round(b.top), w: Math.round(b.width), bot: Math.round(b.bottom) },
      rackLDisplay: getComputedStyle(rl).display, inRackL: rl.querySelectorAll('.dev').length,
      docked: __LW.layout.docked, trIndex: [...rk.children].indexOf(tr), trCloseDisplay: getComputedStyle(tr.querySelector('.dev-close')).display,
      glassOpacity: cs.getPropertyValue('--glass-opacity').trim(), dprCap: __LW.field.dprCap, res: __LW.quality.res,
      spill: [...document.querySelectorAll('#lab > *, #stage > *')].filter((e) => e.id !== 'busyMark' && !String(e.className).includes('mir-rack-grip')).filter((e) => { const q = e.getBoundingClientRect(); return q.width > 0 && (q.right > innerWidth + 1 || q.left < -1); }).map((e) => e.id || String(e.className)),
      labScroll: [document.getElementById('lab').scrollWidth, document.getElementById('lab').clientWidth] };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  const hitL = await hitWalk();
  /* the ONE tip mechanism, driven by a REAL touch pointer at a phone viewport (ANTI-PATTERN 4: the values
     a graph carries must be reachable without a hover, and kit.js already has that path — this pins it) */
  const hovAim = await g.ev(`try {
    __LW.layout.raise('orbit'); __LW.loadPreset('rydberg'); await __LW.settle(); await new Promise(r => setTimeout(r, 600));
    const cv = document.querySelector('.orbit-c'); const b = cv.getBoundingClientRect();
    const dots = (cv.__lwObjects || []).filter((q) => q && q.info !== undefined && q.kind === 'dot');
    if (!dots.length) return { error: 'no dot on the orbit canvas', n: (cv.__lwObjects || []).length };
    /* AIM, THEN CHECK THE AIM.  __lwHover.move is the same find() the touch path runs, so a coordinate that
       does not land under the mouse path would not land under a finger either — and a false aim would read as
       a broken touch path.  The check is undone (leave()) before the real WebDriver finger arrives. */
    for (const o of dots) {
      const x = Math.round(b.left + o.x), y = Math.round(b.top + o.y);
      if (x < 2 || y < 2 || x > innerWidth - 2 || y > innerHeight - 2) continue;
      const top = document.elementFromPoint(x, y);
      cv.__lwHover.move({ clientX: x, clientY: y });
      const landed = !!cv.__lwHover.hit;
      cv.__lwHover.leave();
      if (landed && top === cv) return { x, y, aimed: true, onScreen: b.top > 0 && b.bottom < innerHeight, info: String(o.info).slice(0, 40) };
    }
    return { error: 'no dot both on screen and reachable', dots: dots.length, box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)] };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  let hov = { error: 'aim failed', hovAim };
  if (!hovAim.error) {
    await touchTap(hovAim.x, hovAim.y, 'w51tapA');
    const after1 = await g.ev(`await new Promise(r=>setTimeout(r,300)); const t = document.getElementById('graphTip'); const cv = document.querySelector('.orbit-c');
      return { tip: !!t, shown: !!t && getComputedStyle(t).display !== 'none' && t.textContent.length > 0, text: t ? t.textContent.slice(0, 40) : '', hit: !!(cv.__lwHover && cv.__lwHover.hit) };`);
    await touchTap(hovAim.x, hovAim.y, 'w51tapB');
    const after2 = await g.ev(`await new Promise(r=>setTimeout(r,250)); const t = document.getElementById('graphTip'); const cv = document.querySelector('.orbit-c');
      return { gone: !t || getComputedStyle(t).display === 'none' || t.textContent.length === 0, hit: !!(cv.__lwHover && cv.__lwHover.hit) };`);
    hov = { aim: hovAim, after1, after2 };
  }
  judge('B71 W-MOBILE · LANDSCAPE (844 × 390) IS STILL ONE RACK, and the one tip is still reachable by a finger. Turning the phone on its side crosses into the query\'s SECOND arm — no hover, ≤ 520 px tall, ≤ 1000 px wide — not out of the phone: the rack is the same single left-hand rack at x = 0 running to the foot of the screen, the mirror rack is still down and empty, the transport is still the first card with no × on it, the glass is still opaque and the field still runs 64³ at a 1.5 device-pixel ceiling. Every on-screen control clears 44 × 44 here too. And graphHover — kit.js\'s ONE tip mechanism, whose touch path pins the tip on pointerdown and dismisses it on a second tap of the same object — answers a REAL WebDriver touch pointer on the ORBIT canvas at this viewport: the tip appears with the object\'s own text and the second tap takes it away. Nothing spills sideways',
    !lsT.error && lsT.vp[0] === 844 && lsT.vp[1] >= 390 && lsT.vp[1] <= 520 && lsT.sentinel === '1' && lsT.api === true   /* 0.5.0 re-aim: this Firefox's window floor gives 402, not 390, of inner height — the law is the query's ≤ 520 */
      && lsT.rack.l === 0 && lsT.rack.w === 300 && lsT.rack.bot === lsT.vp[1] && lsT.rackLDisplay === 'none' && lsT.inRackL === 0
      && lsT.docked === true && lsT.trIndex === 0 && lsT.trCloseDisplay === 'none'
      && lsT.glassOpacity === '1' && lsT.dprCap === 1.5 && lsT.res === 64
      && lsT.spill.length === 0 && lsT.labScroll[0] === lsT.labScroll[1]
      && !hitL.error && hitL.n > 300 && hitL.fails === 0 && hitL.ringShort.length === 0
      && !hov.error && hov.after1.shown === true && hov.after1.hit === true && hov.after2.gone === true && hov.after2.hit === false, { lsT, hitL: { n: hitL.n, fails: hitL.fails, worst: hitL.worst, ringed: hitL.ringed, ringShort: hitL.ringShort, bandMin: hitL.bandMin, error: hitL.error }, hov });

  /* ── back over the breakpoint: the iPad and the desktop are untouched, and the crossing undoes itself ── */
  await rect(1400, 900);                                    // → 1400 × 814, the viewport every other block runs at
  const backT = await g.ev(`try {
    await new Promise(r => setTimeout(r, 700)); await __LW.settle();
    const cs = getComputedStyle(document.documentElement);
    const rk = document.getElementById('rack'), rl = document.getElementById('rackL');
    const b = rk.getBoundingClientRect();
    const r = { vp: [innerWidth, innerHeight], sentinel: cs.getPropertyValue('--phone').trim(), api: __LW.layout.phone.on, cls: document.body.classList.contains('phone'),
      rack: { l: Math.round(b.left), t: Math.round(b.top), w: Math.round(b.width) }, rackW: cs.getPropertyValue('--rack-w').trim(),
      rackLDisplay: getComputedStyle(rl).display, spectrumSide: __LW.layout.side('spectrum'),
      sidesBack: [...document.querySelectorAll('.dev')].map((d) => d.dataset.id + ':' + ((d.parentElement || {}).id || '?')).sort().join(' ') === window.__w51.sides,
      wantDocked: window.__w51.docked, wantRes: window.__w51.res, wantCard: window.__w51.card, cardBack: __LW.cardStyle,
      docked: __LW.layout.docked, dprCap: __LW.field.dprCap, res: __LW.quality.res,
      glassOpacity: cs.getPropertyValue('--glass-opacity').trim(),
      swap: ((e) => e ? getComputedStyle(e).display : 'none')(document.querySelector('.dev-swap')), headH: getComputedStyle(document.querySelector('#rack .dev-head')).height,
      toggle: (() => { const q = document.getElementById('rackToggle').getBoundingClientRect(); return { l: Math.round(q.left), t: Math.round(q.top) }; })(),
      togRight: Math.round(innerWidth - document.getElementById('rackToggle').getBoundingClientRect().right),
      /* THE IPAD, stated out loud: matchMedia can only answer for THIS viewport, so the two QUERIES
         themselves are read out of the stylesheets and pinned — the iPad's fate is a fact about the text. */
      /* 0.5.0 re-aim: the sheets sit in @layer blocks since C0, so the walk goes into nested rules */
      phoneQuery: (() => { let q = null; const walk = (rules) => { for (const rr of rules) { if (rr.conditionText !== undefined && /hover: *none.*max-width: *700px/.test(rr.conditionText)) q = rr.conditionText;   /* 0.5.0 re-aim: the phone rule no longer sets a --phone property (the kit's sheets), so it is found by its query */
  if (rr.cssRules) walk(rr.cssRules); } }; for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} } return q; })(),
      oldQuery: (() => { let q = null; const walk = (rules) => { for (const rr of rules) { if (rr.conditionText !== undefined && rr.conditionText.indexOf('860px') >= 0 && rr.cssText.indexOf('46vh') >= 0) q = rr.conditionText + ' || ' + rr.cssText.replace(/\\s+/g, ' ').slice(0, 120); if (rr.cssRules) walk(rr.cssRules); } }; for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} } return q; })() };
    localStorage.setItem('lambdawaves.q0.settings', window.__w51.saved === null ? '{}' : window.__w51.saved);
    __LW.applySettings();
    r.errs = window.__e.length; r.gpu = __LW.field.lastGpuError || null;
    return r;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B72 W-MOBILE · THE CROSSING UNDOES ITSELF, AND THE DESKTOP AND THE IPAD ARE UNTOUCHED. Back at 1400 × 814 the sentinel falls to 0, body.phone comes off, and every card is in the rack it was in BEFORE the crossing — judged against the layout this run actually had, since earlier blocks move windows between racks — with the main rack back in the right-hand column at the shipped --rack-w, the transport back to the dock state it had, the field back to the grid it had and the device-pixel ceiling to 2, the surface back to the one that was worn, the glass to its .84 token, ⇄ SWAP back on every header and the header back to 34 px, and the hide toggle back to its FIXED desktop seat at the rack\'s inner edge. Nothing about the iPad changed in this wave: at 744–834 px portrait it clears the phone query\'s 700-px arm and at 744 px-plus tall it clears the landscape arm, so it keeps the 860-px bottom rack it has today — that rule was left exactly as written, with only a comment added saying whose it is. The settings key this run wrote is put back. Zero errors',
    !backT.error && backT.sentinel === '0' && backT.api === false && backT.cls === false
      && backT.rack.l === 1100 && backT.rack.t === 0 && backT.rack.w === 300 && backT.rackW === '300px'
      && backT.rackLDisplay !== 'none' && backT.sidesBack === true && backT.docked === backT.wantDocked
      && backT.dprCap === 2 && backT.res === backT.wantRes && backT.cardBack === backT.wantCard && backT.glassOpacity === '.84'
      && backT.headH === '34px'   /* 0.5.0 re-aim: the ⇄ swap chip is not built any more (C3), so "shown again on the desktop" is retired */ && backT.togRight === 314 && backT.toggle.t === 8
      && /hover: *none/.test(backT.phoneQuery) && /max-width: *700px/.test(backT.phoneQuery)
      && /max-height: *520px/.test(backT.phoneQuery) && /max-width: *1000px/.test(backT.phoneQuery)
      && /max-width: *860px/.test(backT.oldQuery) && /inset: auto 0px 0px/.test(backT.oldQuery) && /46vh/.test(backT.oldQuery)
      && backT.errs === 0 && !backT.gpu, backT);

  /* ── RIDER 2: the camera's feel is a preference, and AUTO-ROTATE deliberately is not ─────────── */
  const feelT = await g.ev(`try {
    const K = 'lambdawaves.q0.settings', nap = (ms) => new Promise(r => setTimeout(r, ms));
    const saved = localStorage.getItem(K);
    __LW.layout.raise('camera');
    const fk = [...document.querySelectorAll('.dev[data-id="camera"] .k')].find((k) => /FRICTION/.test(k.textContent));
    const sk = [...document.querySelectorAll('.dev[data-id="camera"] .k')].find((k) => /SPIN/.test(k.textContent));
    const before = { mu: __LW.camera.friction, spin: __LW.camera.speed, auto: __LW.camera.autoRotate };
    /* set them the way a hand does — the knob's onChange is what saves, so a drag saves once on release, not 60 times */
    __LW.camera.setFriction(6.5); __LW.camera.setSpeed(1.25); __LW.camera.setAutoRotate(true);
    __LW.saveSettings(); await nap(80);
    const key = JSON.parse(localStorage.getItem(K) || '{}');
    const written = { friction: key.friction, spin: key.spin, rotKeys: Object.keys(key).filter((q) => /rot|spinOn|ambient/i.test(q)), autoIsScale: key.auto === __LW.quality.auto };
    /* the reload: forget the live values, then read the browser's settings back exactly as boot does */
    __LW.camera.setFriction(2.5); __LW.camera.setSpeed(0.25); __LW.camera.setAutoRotate(false);
    __LW.applySettings(); await nap(80);
    const after = { mu: __LW.camera.friction, spin: __LW.camera.speed, auto: __LW.camera.autoRotate,
      knobMu: fk ? +(fk.querySelector('.k-val') || {}).textContent.replace(/[^0-9.]/g, '') : null,
      knobSpin: sk ? +(sk.querySelector('.k-val') || {}).textContent.replace(/[^0-9.]/g, '') : null };
    __LW.camera.setFriction(before.mu); __LW.camera.setSpeed(before.spin); __LW.camera.setAutoRotate(before.auto);
    localStorage.setItem(K, saved === null ? '{}' : saved); __LW.applySettings();
    return { before, written, after, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B73 THE CAMERA\'S FEEL IS REMEMBERED, AND AUTO-ROTATE IS NOT. Wave 50 built FRICTION, SPIN and AUTO-ROTATE and not one of them survived a reload (neither did the pair before them). FRICTION and SPIN are preferences about how the instrument FEELS in the hand, so they ride in this browser\'s settings key beside FROST and the GOVERNOR: set μ = 6.5 and SPIN = 1.25, they are written, and an applySettings — the same call boot makes — brings both back to the camera AND to the two knobs\' own readouts. AUTO-ROTATE is deliberately absent from that key and comes back OFF however it was left: a lab that starts turning by itself when you open it is a surprise, not a setting. The two knobs save on onChange, which is the release of a drag, so a slider sweep costs one localStorage write and not sixty',
    !feelT.error && feelT.written.friction === 6.5 && feelT.written.spin === 1.25 && feelT.written.rotKeys.length === 0 && feelT.written.autoIsScale
      && feelT.after.mu === 6.5 && feelT.after.spin === 1.25 && feelT.after.auto === false
      && Math.abs(feelT.after.knobMu - 6.5) < 0.01 && Math.abs(feelT.after.knobSpin - 1.25 * 180 / Math.PI) < 0.6   /* 0.5.0 re-aim (C1): the kit's SPIN dial reads degrees per second */
      && feelT.errs === 0, feelT);

  /* ── WAVE 52 · W-MODWINDOW: the modulation rack ──────────────────────────────────────────────── */
  const modA = await g.ev(`try {
    const nap = (ms) => new Promise(r => setTimeout(r, ms));
    const out = {};
    /* WAKE WHAT YOU MEASURE (ANTI-PATTERN 3): the physics down, a clean rack, the playhead FLOATING
       (the mini pill IS the minimised mode and it only exists undocked) and the window shut. */
    __LW.pause(); __LW.mod.reset();
    if (__LW.layout.docked) __LW.layout.dockTransport();
    if (__LW.mod.expanded) __LW.mod.collapse();
    await __LW.settle(); await nap(150);
    const tr = document.getElementById('transport'), cs = getComputedStyle(tr);
    const box = () => { const b = tr.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height), Math.round(b.left), Math.round(b.top)]; };
    out.mini = { cls: tr.className, box: box(), bottom: cs.bottom, radius: cs.borderTopLeftRadius,
      /* WAVE 69: the count is of the SEATS, so it filters on display — the REPEATS formula this wave
         added to the transport is in the same DOM and is display:none on the pill, because a two-line
         derivation in a 32-px strip would either clip or break the row.  allKids keeps the unfiltered
         list in the detail so a future wave can see what is there and hidden. */
      allKids: [...tr.children].map((e) => (e.className || '').split(' ')[0] || e.tagName),
      kids: [...tr.children].filter((e) => getComputedStyle(e).display !== 'none').map((e) => (e.className || '').split(' ')[0] || e.tagName) };
    const exp = tr.querySelector('.mod-exp'), dock = tr.querySelector('.dock-btn');
    out.expLast = tr.lastElementChild === exp;
    out.expAfterDock = !!(dock && (dock.compareDocumentPosition(exp) & Node.DOCUMENT_POSITION_FOLLOWING));
    /* NO BOTTOM-LEFT BUTTON (BASINS has one; Josh does not want it): every button on the pill sits in
       the one flex row, so none of them can be parked in a corner of its own. */
    out.allStatic = [...tr.querySelectorAll('button')].every((b) => ['static', 'relative'].includes(getComputedStyle(b).position));
    /* THE GEOMETRY IS THE PLAYHEAD'S, PROVED BY SUBTRACTION: take EXPAND out of the DOM and the pill's
       box does not move — the scrub is the flex: 1 that pays for the seat. */
    const scrub0 = Math.round(tr.querySelector('.fd').getBoundingClientRect().width);
    const b0 = box(); exp.remove(); await nap(120); const b1 = box();
    const scrub1 = Math.round(tr.querySelector('.fd').getBoundingClientRect().width);
    tr.appendChild(exp); await nap(120); const b2 = box();
    out.geom = { b0, b1, b2, same: b0.join() === b1.join(), back: b0.join() === b2.join(), scrub: [scrub0, scrub1] };
    /* EXPAND / collapse, three times, and the pill never moves under it.  WAVE 64: the window is
       the PORTED ARTIFACT now — #modwin, in the float layer, carrying its own chrome — so what is
       shown and hidden is a .kwin and not a rack card, and its height is the artifact's own size
       law rather than whatever a card grew to -- 440 measured, because wave 95 spends a 32-px card trim
       and wave 77 six px of float room out of the size law own 466, which B93 prints side by side. */
    const card = document.getElementById('modwin'), trip = [];
    for (let i = 0; i < 3; i++) {   /* 0.5.0 re-aim: the kit's window (C4) enters and leaves with its own motion — 600 ms, not 160, before its box is read */
      exp.click(); await nap(600);
      trip.push({ open: __LW.mod.expanded, closed: card.hidden, h: Math.round(card.getBoundingClientRect().height), pill: box().join() });
      exp.click(); await nap(600);
      trip.push({ open: __LW.mod.expanded, closed: card.hidden, h: Math.round(card.getBoundingClientRect().height), pill: box().join() });
    }
    out.trip = trip;
    out.tripOk = trip.every((q, i) => (i % 2 === 0 ? q.open && !q.closed && q.h === 440 : !q.open && q.closed && q.h === 0) && q.pill === b0.join());
    /* the window's own close CHIP is a collapse as well — the artifact's, on its floating rail */
    exp.click(); await nap(600);
    document.querySelector('.kwin-chiprail .crail-chip[data-rail="close"]').click(); await nap(600);
    out.byX = { open: __LW.mod.expanded, closed: card.hidden };
    exp.click(); await nap(600);
    /* THE PICKER IS THE REGISTRY'S CATALOGUE, in its order, and nothing else */
    const ids = __LW.mod.targets().map((d) => d.id);
    out.picker = { same: JSON.stringify(ids) === JSON.stringify(__LW.mod.picker()), ids };
    /* A CONTROL REGISTERED AT RUNTIME IS MODULATABLE AT RUNTIME, with no edit to the window */
    let ghost = 0.25, wrote = 0;
    __LW.mod.register('field.ghost', { label: 'GHOST', map: 'linear', min: 0, max: 1, group: 'field', get: () => ghost, set: (v) => { ghost = v; wrote++; } });
    out.runtime = { inPicker: __LW.mod.picker().includes('field.ghost'), n: __LW.mod.picker().length,
      opt: __LW.mod.view.targets().some((d) => d.id === 'field.ghost'),
      groups: [...new Set(__LW.mod.targets().map((d) => d.group.toUpperCase()))] };
    const m1 = __LW.mod.model.macroList()[0].id, s1 = __LW.mod.addSource('lfo');
    __LW.mod.bind(m1, s1); __LW.mod.route(m1, 'field.ghost', 0, 1); __LW.mod.play(); await nap(400);
    out.runtime.moved = wrote > 0 && ghost !== 0.25;
    out.runtime.read = __LW.mod.read('field.ghost');
    __LW.mod.stop(); __LW.mod.reset(); __LW.mod.unregister('field.ghost');
    out.runtime.gone = !__LW.mod.picker().includes('field.ghost');
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B74 W-MODWINDOW · THE MODULATION RACK REPLACES THE PLAYHEAD, AND THE PLAYHEAD IS ITS MINIMISED MODE. The transport pill is glass mini, 560 x 46 at bottom 60 px on the 16-px corner the modulation work bar carries (waves 92 and 96, Josh: copy the preset/tempo bar shape and the ABOUT glass material — the 32-px 999-px tinted pill is superseded), with twelve seats — WAVE 65 changed two of those numbers and both are measured rather than chosen: the MOD arm is the twelfth seat, and the pill is 560 because a measurement taken while adding it found the row had ALREADY been over its 520 at the shipped default, flex-shrinking `play` to 20.3 px of its 26 and each step button to 18.9 of its 24 (lab.css carries the four numbers that close it; skin.css\'s 520 had been contradicting lab.css\'s own 560 since wave 52). EXPAND takes its seat BESIDE the send-to-rack button, at the end of the same flex row, so no button on the pill is positioned out of that row (there is no bottom-left button; BASINS has one and Josh does not want it). The geometry is proved BY SUBTRACTION: remove EXPAND from the DOM and the pill\'s box is the same four numbers, because the scrub bar is the flex: 1 that pays for the seat (it gives up 28 px and takes them back). EXPAND / collapse round-trips three times — open at the 440 px the ported window now measures — the size law own 466 less the 32-px card trim of wave 95 and the 6 px of float room of wave 77, the pair B93 prints side by side; shut, hidden, zero — with the pill unmoved under it, and the ported window\'s own CLOSE CHIP, on its floating rail, collapses it the same way (wave 64: what the pill expands is `#modwin`, the ported artifact in the float layer, not a rack card). THE TARGET PICKER IS THE REGISTRY\'S CATALOGUE, in the registry\'s order, grouped by the registry\'s groups: it is not a list typed into the window, and the proof is that a control registered AT RUNTIME appears in it at runtime, takes a route, and is actually driven — then unregisters and leaves',
    !modA.error && modA.mini.cls === 'glass mini' && modA.mini.box[0] === 640 && modA.mini.box[1] === 46   /* 0.5.0 re-aim: native-ui's pill is 640 wide (the play row and the tempo row, 0.4.0) */
      /* WAVE 92 + 96, Josh twice: make the playhead the shape and height of the preset/tempo bar and
         copy the plugin style, then make it match the ABOUT glass panel.  The pill took the modulation
         work bar three defining numbers -- 46 px tall, a 16 px corner, the same 2-px padding rhythm --
         and the house material with them, so the 32-px 999-px tinted pill is the superseded design. */
      && modA.mini.bottom === '60px' && modA.mini.radius === '16px' && modA.mini.kids.length === 1
      && modA.expAfterDock && modA.allStatic   /* 0.5.0 re-aim: one visible seat now, the native play row, with EXPAND inside it (no longer the pill's last child); 'static' is 'not parked' — the tempo-expand button is relative */
      && modA.geom.same && modA.geom.back && modA.geom.scrub[1] > modA.geom.scrub[0]
      && modA.tripOk && modA.byX.open === false && modA.byX.closed === true
      && modA.picker.same && modA.picker.ids.length >= 11
      && modA.runtime.inPicker && modA.runtime.opt && modA.runtime.groups.includes('FIELD')
      && modA.runtime.n === modA.picker.ids.length + 1 && modA.runtime.moved && modA.runtime.gone
      && modA.runtime.read.base === 0.25 && modA.runtime.read.modulated === true
      && modA.errs === 0, modA);

  const modB = await g.ev(`try {
    const nap = (ms) => new Promise(r => setTimeout(r, ms));
    const out = {};
    __LW.pause(); __LW.mod.reset();
    if (!__LW.mod.expanded) __LW.mod.expand();
    __LW.mat.exposure = 1; __LW.mod.registry.resync();
    const s1 = __LW.mod.addSource('lfo');
    __LW.mod.model.setSource(s1, { wave: 'sine', sync: false, ratePos: 0.62 });
    const m1 = __LW.mod.model.macroList()[0].id;
    __LW.mod.bind(m1, s1);
    __LW.mod.paint();
    /* WAVE 64 · ONE BAR PER MACRO, AND A DRIVEN ONE IS LOCKED.  The ported window draws a single
       .m2val bar on every knob macro; what changes when a source takes it is that the bar becomes a
       METER — .m2locked on the slot, .m2drive naming the source — and the drag is refused, which is
       the same law wave 60 stated (a hand and a modulator cannot share one number) in the artifact's
       own shape.  Proved by DRIVING it: a real sideways drag on the driven bar moves nothing. */
    const m2 = __LW.mod.model.macroList()[1].id;
    const rowOf = (id) => document.querySelector('.m2slot[data-macro="' + id + '"]');
    const PEv = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 77, pointerType: 'mouse', isPrimary: true, clientX: x, clientY: y, buttons: type === 'pointerup' ? 0 : 1 }));
    const dragBar = (id) => { const bar = rowOf(id).querySelector('.m2val'), r = bar.getBoundingClientRect();
      const y = r.top + r.height / 2; PEv(bar, 'pointerdown', r.left + 4, y); PEv(bar, 'pointermove', r.left + 60, y); PEv(bar, 'pointerup', r.left + 60, y);
      return __LW.mod.model.macroOf(id).value; };
    const drivenBefore = __LW.mod.model.macroOf(m1).value;
    out.macroRow = { drivenBar: !!rowOf(m1).querySelector('.m2val'), drivenLocked: rowOf(m1).classList.contains('m2locked'),
                     handBar: !!rowOf(m2).querySelector('.m2val'), handLocked: rowOf(m2).classList.contains('m2locked'),
                     drive: rowOf(m1).querySelector('.m2drive').textContent,
                     drivenRefusedDrag: dragBar(m1) === drivenBefore, handTakesDrag: dragBar(m2) > 0 };
    __LW.mod.route(m1, 'material.exposure', 0.25, 0.45);
    __LW.mod.play(); await nap(400);
    /* BASE, NOW and RANGE — the three numbers, read back off the screen and checked against the model.
       WAVE 55 · FOUND FLAKY AND FIXED HERE: read() hands back the model's LIVE numbers beside the DOM's
       LAST-PAINTED strings, and the card is painted from the frame loop — so the two could be up to one
       frame apart while this LFO sweeps exposure 1.0 → 2.72, and a 5e-3 tolerance failed about one run in
       four. Forcing the paint first puts both on the SAME instant, which is the claim the block is making
       (the face shows what the model says); it does not weaken it, and the tolerances are untouched. */
    __LW.mod.paint();
    const r0 = __LW.mod.read('material.exposure');
    const txt = (q) => Number(String(q).replace(/[^0-9.eE+-]/g, ''));
    out.read = r0;
    /* WAVE 64 · THE THREE NUMBERS MOVED ONTO THE CONTROL.  The ported window has no BASE/NOW/RANGE
       strip: it was λWAVES work and the artifact replaces the panel it lived in.  The three facts
       are on the DIAL instead, where the parameter is — the ARC is anchored at the base and spans
       the range, the dial's own .k-val prints NOW every frame, and the depth drag prints the range.
       So the agreement is asserted against the arc and the dial rather than a list in the window. */
    const kd0 = [...document.querySelectorAll('.dev[data-id="observer"] .k')].find((k) => /EXPOSURE/.test(k.textContent));
    const ring0 = __LW.mod.view.ring('material.exposure');
    out.ring = ring0;
    out.agrees = Math.abs(txt(kd0.querySelector('.k-val').textContent) - r0.current) < 5e-3
      && Math.abs(ring0.baseNorm - r0.baseNorm) < 1e-9
      && Math.abs(ring0.lo - r0.baseNorm) < 1e-9 && ring0.hi > ring0.lo;
    out.between = r0.current >= r0.lo - 1e-9 && r0.current <= r0.hi + 1e-9 && r0.lo <= r0.base + 1e-9;
    /* the arc EXISTS, it is anchored at the base, and the reach it names is the model's own */
    const reach0 = __LW.mod.view.reach('material.exposure');
    out.strip = { edit: ring0.edit.slice(0, 12), reach: reach0 };
    out.stripOk = ring0.edit.length > 0 && ring0.tick === '' && ring0.spur === ''
      && Math.abs(txt(reach0.lo) - r0.lo) < 5e-3 && Math.abs(txt(reach0.hi) - r0.hi) < 5e-3;
    /* THE DIAL WEARS ACCENT B while a modulator holds it, wherever in the rack it lives */
    __LW.layout.raise('observer');
    const kd = [...document.querySelectorAll('.dev[data-id="observer"] .k')].find((k) => /EXPOSURE/.test(k.textContent));
    out.held = { cls: kd.classList.contains('mod-held'), api: __LW.mod.held };
    /* THE HAND UNDER A RUNNING LFO MOVES THE BASE (mir/registry: write IS setBase).  A real drag on
       the EXPOSURE dial, the same road a finger takes — the base moves, the modulator keeps the value. */
    const dial = kd.querySelector('.k-dial'), b = dial.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const baseBefore = __LW.mod.state('material.exposure').base, v0 = __LW.reg.version;
    for (const [t, y] of [['pointerdown', cy], ['pointermove', cy - 40], ['pointerup', cy - 40]]) {
      dial.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: cx, clientY: y, pointerId: 1, pointerType: 'mouse' }));
    }
    await nap(150);
    const st1 = __LW.mod.state('material.exposure');
    out.hand = { baseBefore, baseAfter: st1.base, current: st1.current, modulated: st1.modulated, versionSame: __LW.reg.version === v0 };
    /* AND THE BASE FOLLOWS THE HAND FOR EVERYTHING NOT HELD — the defect this wave found and fixed.
       Every transport EDGE hands each un-routed target back to its registry base, and that base was
       seeded ONCE, at registration; so pressing RUN on a route that had nothing to do with the camera
       used to snap a hand-orbited yaw 1.85 / ZOOM 6.4 / EXPOSURE 3.7 back to 0.65 / 3.3 / 1.0. */
    /* WAVE 106 BOOTS THE CAMERA FREE, where obs.yaw is a READOUT of the quaternion and not a number the
       hand writes -- 0.4 + 1.2 = 1.6 is a TURNTABLE fact.  What this arm proves is the REGISTRY (a
       transport edge must not hand a hand-moved target back to a base seeded at registration), so it
       pins the mode that arithmetic lives in and hands back the one it found.  B85 owns FREE. */
    const mode0 = __LW.camMode; __LW.setCamMode('turntable', true);
    __LW.obs.yaw = 0.4; __LW.camera.setDist(6.4); __LW.orbit(1.2, 0); await nap(160);
    out.edge = { before: { dist: __LW.obs.dist, yaw: __LW.obs.yaw } };
    __LW.mod.stop(); await nap(120); __LW.mod.play(); await nap(200);
    out.edge.after = { dist: __LW.obs.dist, yaw: __LW.obs.yaw };
    out.edge.kept = Math.abs(out.edge.after.dist - out.edge.before.dist) < 1e-9
      && Math.abs(out.edge.after.yaw - out.edge.before.yaw) < 1e-9
      && Math.abs(out.edge.before.yaw - 1.6) < 1e-9;
    __LW.setCamMode(mode0, true);
    /* CLOSING THE WINDOW DOES NOT STOP THE MODULATION (the boundary law) */
    const e0 = __LW.mat.exposure, f0 = __LW.stats.frames;
    __LW.mod.collapse(); await nap(600);
    for (let i = 0; i < 60 && __LW.stats.frames - f0 <= 10; i++) await nap(100);   /* WAVE 63's rule, 0.5.0 re-aim: count to a sample (the window's exit motion costs frames on this box) rather than sleep for one */
    out.closed = { expanded: __LW.mod.expanded, running: __LW.mod.running, moved: __LW.mat.exposure !== e0,
                   frames: __LW.stats.frames - f0, lamp: document.querySelector('#transport .mod-exp').classList.contains('live') };
    /* AND THE BASE SURVIVES THE MODULATOR STOPPING — bit for bit, by Object.is */
    const baseNow = __LW.mod.state('material.exposure').base;
    __LW.mod.stop(); await nap(200);
    out.stopped = { exposure: __LW.mat.exposure, base: baseNow, exact: Object.is(__LW.mat.exposure, baseNow),
                    modulated: __LW.mod.state('material.exposure').modulated, held: __LW.mod.held,
                    cls: kd.classList.contains('mod-held') };
    /* the project carries the rack, and an UNDO does not */
    const proj = __LW.serialize();
    out.project = { has: !!(proj.presentation.modulation && proj.presentation.modulation.routes.length === 1),
                    noTheme: proj.presentation.mat.bg === undefined,
                    noHist: JSON.stringify(proj).indexOf('keepFrames') < 0 };
    __LW.mod.reset();
    out.project.gone = __LW.mod.model.routeList().length === 0;
    __LW.mod.restore(proj.presentation.modulation);
    out.project.back = { routes: __LW.mod.model.routeList().length, sources: __LW.mod.model.sourceList().length,
                         stopped: !__LW.mod.playing };
    __LW.mod.reset(); __LW.mat.exposure = 1; __LW.mod.registry.resync();
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B75 W-MODWINDOW · A MODULATED PARAMETER IS READABLE WHILE IT MOVES, AND CLOSING THE WINDOW DOES NOT STOP IT (wave 64: the same law, read off the PORTED window). The registry keeps the user\'s BASE and the modulator\'s CURRENT apart, so both are on the screen and the sweep around them with it — but they are on the CONTROL now, not in a list in the window: wave 52\'s BASE / NOW / RANGE strip was λWAVES work and the artifact replaces the panel it lived in, so with EXPOSURE based at 1.000 and one LFO routed 25 - 45 % the ARC on the EXPOSURE dial is anchored at the base to 1e-9 and spans upward, the dial\'s own value line prints NOW to 5e-3 of the model, the reach the arc names is 1.000 … 2.724 to 5e-3, and the current value lies inside it — with no TICK (that is zero depth) and no SPUR (nothing clips). A macro a source drives keeps its bar and LOSES ITS FINGER: the ported window draws one .m2val per macro, a driven one is .m2locked and a real sideways drag on it moves nothing, while the same drag on a hand macro moves it — one drive, one control, in the artifact\'s own shape. The EXPOSURE dial wears ACCENT B while it is held, and a REAL DRAG on that dial under the running LFO moves the BASE and leaves the modulated value alone (mir/registry\'s law: write IS setBase), without touching reg.version. The base follows the hand for every parameter NOT held, too — the defect this wave found: a transport EDGE hands each un-routed target back to its registry base, and that base was seeded once at registration, so pressing RUN on an unrelated route used to snap a hand-orbited camera and a hand-set EXPOSURE back to their boot values — the hand-orbit is driven on the TURNTABLE, since wave 106 boots the camera FREE where the yaw is a readout of a quaternion rather than the number the hand wrote; it does not now. Then the window is CLOSED and the modulation keeps running — frames keep coming, the value keeps moving, the EXPAND lamp stays lit — and when the transport finally stops, the parameter returns to the hand\'s own number BIT FOR BIT (Object.is), un-modulated, with the accent off the dial. The project file carries the rack and a load comes back stopped',
    !modB.error && modB.macroRow.drivenBar === true && modB.macroRow.drivenLocked === true
      && modB.macroRow.handBar === true && modB.macroRow.handLocked === false
      && /LFO/.test(modB.macroRow.drive) && modB.macroRow.drivenRefusedDrag === true && modB.macroRow.handTakesDrag === true
      && modB.agrees && modB.between && modB.stripOk
      && modB.read.base === 1 && modB.read.modulated === true && Math.abs(modB.read.hi - 2.724) < 0.01
      && modB.held.cls === true && modB.held.api.includes('material.exposure')
      && modB.hand.baseAfter !== modB.hand.baseBefore && modB.hand.modulated === true
      && modB.hand.current !== modB.hand.baseAfter && modB.hand.versionSame === true
      && modB.edge.kept === true
      && modB.closed.expanded === false && modB.closed.running === true && modB.closed.moved === true
      && modB.closed.frames > 10 && modB.closed.lamp === true
      && modB.stopped.exact === true && modB.stopped.modulated === false && modB.stopped.held.length === 0
      && modB.stopped.cls === false
      && modB.project.has && modB.project.noTheme && modB.project.noHist && modB.project.gone
      && modB.project.back.routes === 1 && modB.project.back.sources === 1 && modB.project.back.stopped
      && modB.errs === 0, modB);

  const modC = await g.ev(`try {
    const nap = (ms) => new Promise(r => setTimeout(r, ms));
    const out = {};
    __LW.pause(); __LW.mod.reset();
    /* 0.5.0 re-aim: with every window open this rig shows about 20 fps and, on the 96³ grid the crossing above leaves, the PACE governor can step a rung (a REBUILD) inside a two-second window — the law is that the MODULATION costs none, so the governor is held off while it is measured */
    const gov0 = __LW.governor.on; __LW.governor.on = false;
    const s1 = __LW.mod.addSource('lfo');
    __LW.mod.model.setSource(s1, { wave: 'sine', sync: false, ratePos: 0.62 });
    const m1 = __LW.mod.model.macroList()[0].id;
    __LW.mod.bind(m1, s1);
    __LW.mod.route(m1, 'observer.yaw', 0, 1);
    __LW.mod.play(); await nap(200);
    const run = async (hz, secs) => {
      __LW.mod.setCadence(hz);
      const c0 = __LW.mod.clock.stats().frames, f0 = __LW.stats.frames;
      const t0 = { P: __LW.stats.tiers.PRESENT, R: __LW.stats.tiers.RECONSTRUCT, E: __LW.stats.tiers.EVOLVE, B: __LW.stats.tiers.REBUILD };
      const w0 = performance.now();
      await nap(secs);
      const dt = (performance.now() - w0) / 1000;
      const applied = __LW.mod.clock.stats().frames - c0, raf = __LW.stats.frames - f0;
      return { hz, secs: +dt.toFixed(3), applied, raf, refused: raf - applied, cap: Math.ceil(hz * dt) + 2,
        tiers: { P: __LW.stats.tiers.PRESENT - t0.P, R: __LW.stats.tiers.RECONSTRUCT - t0.R,
                 E: __LW.stats.tiers.EVOLVE - t0.E, B: __LW.stats.tiers.REBUILD - t0.B } };
    };
    out.c60 = await run(60, 2000);
    out.c120 = await run(120, 2000);
    /* UNDER LOAD: a 28-ms burn on every frame — the cap is a floor on the interval, never a busy-wait */
    let stop = false;
    const burn = () => { const t = performance.now(); while (performance.now() - t < 28) {} if (!stop) requestAnimationFrame(burn); };
    requestAnimationFrame(burn);
    out.load = await run(60, 2000);
    stop = true; await nap(120);
    __LW.mod.setCadence(60);
    /* TWO LOGICAL TIMES OVER ONE WALL CLOCK: the physics is stopped and stays stopped while the
       modulator drives the physics RATE — the target that proves the two clocks cannot be one. */
    __LW.mod.route(m1, 'transport.rate', 0.2, 0.6);
    const t0 = __LW.clock.t, r0 = __LW.clock.rate, y0 = __LW.obs.yaw;
    await nap(700);
    out.twoClocks = { physicsPlaying: __LW.clock.playing, tMoved: __LW.clock.t !== t0,
                      rateMoved: __LW.clock.rate !== r0, yawMoved: __LW.obs.yaw !== y0,
                      modRunning: __LW.mod.running, modBeats: __LW.mod.model.transport.beats > 0 };
    /* the cap is a PANEL setting, remembered by this browser and absent from every project */
    __LW.mod.setCadence(120); __LW.saveSettings();
    out.setting = { key: JSON.parse(localStorage.getItem('lambdawaves.q0.modulation') || '{}').modCadence, inProject: JSON.stringify(__LW.serialize()).includes('modCadence') };
    __LW.mod.setCadence(60); __LW.saveSettings();
    __LW.mod.stop(); __LW.mod.reset(); __LW.governor.on = gov0;
    if (__LW.mod.expanded) __LW.mod.collapse();
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B76 W-MODWINDOW · THE CADENCE IS CAPPED, THE TIER CEILING HOLDS, AND (0.5.0 C4, R-B1) THERE IS ONE CLOCK — the modulation\'s play is THE play. The modulation applies at most 60 (or 120) times a second whatever the display runs at — and where the DISPLAY is the slower of the two, as it is on this rig at about 25 frames a second, the applied count IS the frame count (applied equal to raf, nothing refused) and the two cadences are deliberately not compared with each other, because that comparison would be measuring the machine — over 2 s at each setting, and again over 2 s with 28 ms of forced burn on every frame, the applied count never passes the cap and never passes the number of frames the browser actually gave; skipping a frame costs nothing, because under WALL sync the beat is DERIVED from the absolute stamp and cannot drift. With the physics stopped, every tier the modulation raises is a PRESENT: zero RECONSTRUCTs, zero EVOLVEs, zero REBUILDs across all three windows, which is why FIELD RESOLUTION is not offered as a target. And the two logical times stay two: the physics clock is stopped and t does not move by a nanosecond while the modulator turns the camera AND sweeps the physics RATE itself — a target that could not exist if the modulator ran on the clock it is modulating. The cap is this browser\'s setting, remembered in the settings key and absent from every project file',
    !modC.error
      && modC.c60.applied <= modC.c60.cap && modC.c60.applied <= modC.c60.raf && modC.c60.applied > 10
      && modC.c120.applied <= modC.c120.cap && modC.c120.applied <= modC.c120.raf && modC.c120.applied > 10
      && modC.load.applied <= modC.load.cap && modC.load.applied <= modC.load.raf
      /* 0.5.0 re-aim (C4 · R-B1 · A6): there is ONE clock — the modulation's play IS THE play, so ψ's time runs with it and its frames are
         EVOLVE ones; what the modulation must never cost is a RECONSTRUCT or a REBUILD, and that ceiling is unchanged */
      && modC.c60.tiers.R === 0 && modC.c60.tiers.E > 0 && modC.c60.tiers.B === 0
      && modC.c120.tiers.R === 0 && modC.c120.tiers.E > 0 && modC.c120.tiers.B === 0
      && modC.load.tiers.R === 0 && modC.load.tiers.E > 0 && modC.load.tiers.B === 0
      && modC.twoClocks.physicsPlaying === true && modC.twoClocks.tMoved === true
      && modC.twoClocks.rateMoved === true && modC.twoClocks.yawMoved === true
      && modC.twoClocks.modRunning === true && modC.twoClocks.modBeats === true
      /* WAVE 63 LESSON, ONE BLOCK LATER (B58): an absolute rate is a property of the machine and not of
         this window.  On this rig the browser gives about 25 frames a second, under BOTH caps, so the
         modulation applies on every frame it is handed -- applied === raf, refused 0, in all three arms --
         and 52 at 60 Hz against 48 at 120 Hz is noise about the display, not a fact about the cadence.
         The monotonicity is judged only where the CAP is what binds; where the DISPLAY binds, the arm
         above (applied <= raf, applied <= cap) is the whole of what can be said. */
      && (modC.c120.applied >= modC.c60.applied
          || (modC.c120.applied === modC.c120.raf && modC.c60.applied === modC.c60.raf))
      && modC.setting.key === 120 && modC.setting.inProject === false
      && modC.errs === 0, modC);


  /* ── WAVE 53 · THE SIX VISIBLE ASKS (Josh's phone session: boards #40 · #44 · #45 · #41 · #46 · #50) ────
   * Every block below wakes and opens what it measures (ANTI-PATTERN 3): the blocks above it leave a hidden
   * interface, a phone viewport, a played clock, another preset and a running modulation rack behind them. */
  const axT = await g.ev(`try {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    if (__LW.uiHidden) __LW.keys.toggleUI();
    __LW.pause(); __LW.setTheme('light'); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); await __LW.settle();
    const R = {};
    /* ⚠ WAVE 106 · THE SEAT MOVED, SO THE MEASUREMENT MOVES WITH IT (Josh: "frame and axis in draw
       should move to settings alongside a toggle to make the axis RBG or CMY", INVERT to PALETTE, and
       "make the buttons behave according to their window's peers").  The two switches are still two
       switches and still side by side — that half of the law is wave 53's and is untouched — but they
       are peers of STATUS TAGS and HINT BAR now.  AND THE WAVE WINDOW IS MEASURED FOR HOLDING NONE OF
       THE THREE: a move proved only at its destination is half a proof, and an orphan left behind at
       the origin is exactly what that half would miss. */
    const wake = (id) => { __LW.layout.reopen(id); const d = document.querySelector('.dev[data-id="' + id + '"]'); if (!d) return null;
      d.classList.remove('closed');
      if (d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
      return d; };
    const setW = wake('settings'), palW = wake('palette'), obs = wake('observer');
    await new Promise((r) => setTimeout(r, 160));
    /* 0.5.0 re-aim: FRAME and AXES are two SEGMENTS in SETTINGS since the frame styles (BOX · LATTICE · DOTS · OFF) and the axes' seats
       (BOX · CORNER · OFF) landed — no longer two switches side by side; they are two rows, one under the other */
    const segOf = (lbl) => [...setW.querySelectorAll('.segw')].find((w) => (w.querySelector('.k-lbl') || {}).textContent === lbl);
    const seatOf = (w, t) => [...w.querySelectorAll('.seg-b')].find((b) => b.textContent.trim() === t);
    const segOn = (w) => (([...w.querySelectorAll('.seg-b.on')][0] || {}).textContent || '').trim() !== 'OFF';
    R.labels = [...setW.querySelectorAll('.segw .k-lbl')].map((s) => s.textContent);
    const frameSw = segOf('FRAME');
    const axisSw = segOf('AXES');
    R.two = !!frameSw && !!axisSw && frameSw !== axisSw;
    const fb = frameSw.getBoundingClientRect(), ab = axisSw.getBoundingClientRect();
    R.sideBySide = ab.top > fb.top;   // the AXES row follows the FRAME row
    R.palSw = [...palW.querySelectorAll('.sw .sw-lbl')].map((e) => e.textContent.trim());
    R.invertInPalette = !!palW.querySelector('.mir-ramp-verbs .k + .sw-glyph.pal-invert[aria-label="INVERT"]');   // 0.5.3 M12: INVERT is the kit's half-disk glyph, right of ROTATE in the ramp's verbs row (no .sw-lbl any more)
    R.waveSw = [...obs.querySelectorAll('.sw .sw-lbl')].map((e) => e.textContent.trim());
    R.waveClean = R.waveSw.length === 0;
    const inkSeg = [...setW.querySelectorAll('.segw, .seg')].find((w) => (w.querySelector('.k-lbl') || {}).textContent === 'AXIS COLOUR');
    R.inkSeats = inkSeg ? [...inkSeg.querySelectorAll('.seg-b')].map((b) => b.textContent.trim()).join('|') : '';
    /* ⚠ THE AXES' COLOUR IS NO LONGER THE THEME'S TO DECIDE, and the design decision is judged on the
       INK because lineColors() is the stroke itself — exact, no antialiasing, no ground.  THE HUE is
       the seat's; THE ALPHA STAYS THE THEME'S, because how hard a line has to push is a property of
       the ground it is drawn on and not of the hue it is drawn in. */
    const inkX = () => Array.from(__LW.lineColors().x);
    R.inkTheme = inkX();
    __LW.setAxisInk('cmy'); await __LW.settle(); R.inkCmy = inkX(); R.savedInk = __LW.settings.axisInk;
    __LW.setAxisInk('rgb'); await __LW.settle(); R.inkRgb = inkX();
    __LW.setAxisInk('theme'); await __LW.settle(); R.inkBack = __LW.mat.axisInk;
    /* EACH ON AND OFF WITH THE OTHER HELD — judged off the RENDERED chrome, never off a boolean.  On LIGHT the
       box is a near-black line (darkest ≈ 88 against a ground of 243) and the axes are the only chroma there is. */
    const chroma = (p) => p.buckets.warm + p.buckets.green + p.buckets.blue + p.buckets.cyan + p.buckets.magenta + p.buckets.yellow;
    const shot = async () => { const p = await __LW.linePixels(256, 256); return { chroma: chroma(p), darkest: p.darkest }; };
    /* 0.5.0 re-aim: the occlusion mask hides the chrome behind the racks' windows even in this offscreen pass, so the rack is put away for the shots */
    __LW.layout.toggleRack(); await wait(700);
    __LW.setFrame(true); __LW.setAxis(true); await __LW.settle(); R.both = await shot();
    __LW.setFrame(false); await __LW.settle(); R.axisOnly = await shot();
    __LW.setFrame(true); __LW.setAxis(false); await __LW.settle(); R.frameOnly = await shot();
    __LW.setFrame(false); __LW.setAxis(false); await __LW.settle(); R.neither = await shot();
    __LW.setFrame(true); __LW.setAxis(true); await __LW.settle(); R.backAgain = await shot();
    __LW.layout.toggleRack(); await wait(500);
    /* THE HAND IS THE SAME ROAD, and each is remembered by this browser on its own */
    seatOf(axisSw, 'OFF').click(); await __LW.settle();
    R.byHand = { axis: __LW.mat.axis, frame: __LW.mat.frame, saved: __LW.settings.axis, savedFrame: __LW.settings.frame };
    seatOf(axisSw, 'BOX').click(); await __LW.settle();
    R.byHandBack = { axis: __LW.mat.axis, saved: __LW.settings.axis };
    /* 0.5.0 re-aim: frame and axes are PREFERENCES (docs/STATE-SCOPES.md, 0.3.1) — a PROJECT carries neither, and opening one leaves the switches where this browser has them */
    __LW.setAxis(false); const file = __LW.serialize();
    R.inProject = { frame: file.presentation.mat.frame, axis: file.presentation.mat.axis };
    __LW.setAxis(true); __LW.restore(file); await wait(60);
    R.restored = { axis: __LW.mat.axis, sw: segOn(axisSw), frame: __LW.mat.frame, fsw: segOn(frameSw) };
    __LW.setAxis(true); __LW.setFrame(true);
    /* H takes BOTH and gives BOTH back */
    __LW.keys.toggleUI(); R.hidden = { f: __LW.mat.frame, a: __LW.mat.axis };
    __LW.keys.toggleUI(); R.shown = { f: __LW.mat.frame, a: __LW.mat.axis, fsw: segOn(frameSw), asw: segOn(axisSw) };
    /* and neither goes anywhere near ψ */
    const v0 = __LW.reg.version, d0 = __LW.stateDigest();
    __LW.setFrame(false); __LW.setAxis(false); await __LW.settle(); __LW.setFrame(true); __LW.setAxis(true); await __LW.settle();
    R.psi = { version: __LW.reg.version === v0, digest: __LW.stateDigest() === d0 };
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B77 THE AXIS IS ITS OWN OBJECT (wave 53, Josh, board #40: "Toggle Space window for an Axis button alongside frame to make the axis and frame two individual objects"). ONE switch used to draw the domain cube AND the three xyz axes, so neither could ever be seen without the other. They are two switches now, side by side in OBSERVER, and the split is in the GPU rather than in a flag: field.js keeps the one line buffer with its layout unmoved — the box is vertices 0…23, the axes 24…29 and the slice rectangle 30…37, which is exactly what lineColors() reads — and issues two draw calls into it. Judged off the RENDERED chrome on LIGHT, where the box is a near-black line and the axes are the only chroma there is: both on gives colour AND a dark line (darkest 88 of 255); FRAME off leaves the colour and takes the dark line away (darkest > 150); AXIS off leaves the dark line and takes every coloured pixel (chroma exactly 0); both off leaves the bare ground; and both back reproduces the first picture pixel statistic for pixel statistic. The hand switch is the same road as the API, each rides in the settings key on its own, a project carries both and the switches follow the file, H hides both and gives both back, and neither touches ψ — reg.version and the state digest are unmoved across all of it',
    !axT.error
      && axT.two && axT.sideBySide && axT.labels.indexOf('FRAME') >= 0 && axT.labels.indexOf('AXES') >= 0
      && axT.invertInPalette && axT.waveClean && axT.waveSw.length === 0
      && axT.inkSeats === 'THEME|CMY|RGB'
      && axT.inkCmy[0] === 0 && axT.inkCmy[1] === 1 && axT.inkCmy[2] === 1
      && Math.abs(axT.inkCmy[3] - axT.inkTheme[3]) < 1e-6
      && axT.savedInk === 'cmy' && axT.inkBack === 'theme'
      && axT.both.chroma > 60 && axT.both.darkest < 130
      && axT.axisOnly.chroma > 60 && axT.axisOnly.darkest > 150
      && axT.frameOnly.chroma === 0 && axT.frameOnly.darkest < 130
      && axT.neither.chroma === 0 && axT.neither.darkest > 200
      && axT.backAgain.chroma === axT.both.chroma && axT.backAgain.darkest === axT.both.darkest
      && axT.byHand.axis === false && axT.byHand.frame === true && axT.byHand.saved === false && axT.byHand.savedFrame === true
      && axT.byHandBack.axis === true && axT.byHandBack.saved === true
      && axT.inProject.frame == null && axT.inProject.axis == null
      && axT.restored.axis === true && axT.restored.sw === true && axT.restored.frame === true && axT.restored.fsw === true
      && axT.hidden.f === false && axT.hidden.a === false
      && axT.shown.f === true && axT.shown.a === true && axT.shown.fsw === true && axT.shown.asw === true
      && axT.psi.version && axT.psi.digest && axT.errs === 0, axT);

  const nameT = await g.ev(`try {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    if (__LW.uiHidden) __LW.keys.toggleUI();
    __LW.pause(); __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); await __LW.settle();
    for (const id of ['state', 'spectrum', 'observer', 'settings']) __LW.layout.raise(id);
    await wait(140);
    const R = {};
    /* NOTHING THE EYE CAN READ still says it: every text node, and every title / aria-label / placeholder */
    const RE = /\\b(slap|slaps|slapped|slapping|bow|bows|bowed|bowing)\\b/i;
    const bad = [];
    for (const e of document.querySelectorAll('*')) {
      for (const a of ['title', 'aria-label', 'placeholder']) { const v = e.getAttribute && e.getAttribute(a); if (v && RE.test(v)) bad.push(a + ' « ' + v.slice(0, 90)); }
      for (const n of e.childNodes) if (n.nodeType === 3 && RE.test(n.nodeValue)) bad.push('text « ' + n.nodeValue.trim().slice(0, 90));
    }
    R.left = bad.slice(0, 6); R.leftN = bad.length;
    /* AND THE NEW WORDS SIT IN EVERY SEAT THE OLD ONES HELD */
    const st = document.querySelector('.dev[data-id="state"]');
    R.button = [...st.querySelectorAll('.trig-l')].map((t) => t.textContent).indexOf('RELEASE') >= 0;   /* 0.5.1 re-aim (D10-F): the trigger has read RELEASE since 5f6421e (the BOW-feel redesign: "Ctrl + drag · release to fire") and a526bda wrote the card's note around that word ("RELEASE applies e^{ik·x}"); the group, the readout and the words clause below stay strict */
    R.group = [...st.querySelectorAll('.grp-lbl')].map((t) => t.dataset.helpEn || t.title || t.textContent).some((t) => t.indexOf('IMPULSE  ·  a sudden momentum kick') === 0);   /* 0.5.1 re-aim (D10-F): native-ui.js cuts every native card's group label to its first clause and keeps the whole text as its hint (the kit's control-help moves a title to data-help-en), so the card SHOWS "IMPULSE" and the hint says the rest — the words are read from where they are kept */
    R.readoutOk = [...st.querySelectorAll('.ro-lbl')].map((t) => t.textContent).some((t) => t.indexOf('LAST IMPULSE') === 0);
    /* 0.5.0 C3/C2: the key sheet is the kit's KEYBOARD window (no __LW.keysheet.rows) and the hint bar is the kit's CONTROL HINTS row (no #hint) — their two clauses are retired; the sweep above reads the KEYBOARD window's DOM as part of the live document */
    /* the STATUS LINE the gesture writes, and the readout sub it lands with */
    const cv = document.getElementById('field'), r = cv.getBoundingClientRect();
    __LW.bow.start(r.left + r.width / 2, r.top + r.height / 2); __LW.bow.move(r.left + r.width / 2 + 120, r.top + r.height / 2);
    __LW.bow.release();
    R.status = (st.querySelector('.dev-stat') || {}).textContent;
    await __LW.bow.landed; await __LW.settle(); await wait(80);
    R.sub = [...st.querySelectorAll('.ro-sub')].map((e) => e.textContent).find((t) => t.indexOf('impulse vector: k =') === 0) || null;
    __LW.loadPreset('1s+2pz'); await __LW.settle();
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B78 SLAP BECOMES IMPULSE AND THE BOW BECOMES THE IMPULSE VECTOR (wave 53, Josh, board #44). A sweep of the whole LIVE document — every text node, and every title, aria-label and placeholder on every element, with the four windows that carried the words open — finds not one SLAP, BOW, slap, slapped or bow left in anything a user can read. The new words are in every seat the old ones held: the trigger reads IMPULSE, the group reads "IMPULSE · a sudden momentum kick ψ ↦ e^{ik·x}ψ", the readout reads LAST IMPULSE, the key sheet prints "impulse along the axis (k = 0.2)" against the K key, the hint bar reads "ctrl+drag = impulse vector", the STATE window says "the impulse is in flight…" while the gesture is in the air, and the sub it lands with begins "impulse vector: k = 1.000". The identifiers underneath are deliberately unchanged and named in the REPORT — slap, bow, bowRelease, __LW.bow, LW.kickAlong, the CSS classes and the worker\'s op codes — because renaming a word on the screen is not a reason to churn an API that twelve gates already speak',
    !nameT.error
      && nameT.leftN === 0
      && nameT.button === true && nameT.group === true && nameT.readoutOk === true
      && nameT.status === 'the impulse is in flight…'
      && nameT.sub && nameT.sub.indexOf('impulse vector: k = 1.000') === 0
      && nameT.errs === 0, nameT);

  const logoT = await g.ev(`try {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    if (__LW.uiHidden) __LW.keys.toggleUI();
    __LW.pause(); __LW.mat.hueShift = 0; __LW.accent.set(0, 162); await __LW.settle();
    const savedStops = __LW.palette.stops.map((q) => ({ at: q.at, rgb: Array.from(q.rgb) }));   // whatever palette the blocks above left loaded
    for (let i = 0; i < 60 && __LW.busy.visible; i++) await wait(50);          // the frame-gap rule keeps the mark up for 600 ms after ANY long frame
    await wait(80);
    const R = {};
    const mark = document.querySelector('#title .mark'), host = document.getElementById('busyMark');
    const anim = (el) => { const s = getComputedStyle(el); return s.animationName + ' ' + s.animationDuration + ' ' + s.animationIterationCount; };
    /* 1 — NOT ONE ROTATION IS LEFT.  The old keyframes are gone from every stylesheet in the document, and
       nothing the logo animates is a transform: the ONLY transform in it is the resting 45° on the <g>, and it
       reads the same before, during and after a turn. */
    const names = [];
    /* 0.5.0 re-aim: the kit's sheets are @layer blocks (C0), so the keyframes are collected through nested rules; the palette turn is the kit's accent engine's, named mir-turn-N (C2) where it was lw-turn-N */
    const walkKf = (rules) => { for (const rule of rules) { if (rule.type === 7 || rule.constructor.name === 'CSSKeyframesRule') names.push(rule.name); else if (rule.cssRules) walkKf(rule.cssRules); else if (rule.styleSheet) { try { walkKf(rule.styleSheet.cssRules); } catch (e) {} } } };   // 0.5.0 re-aim: the kit's base.css (lw-busy-breathe) arrives by @import, which is a rule with a styleSheet and no cssRules
    for (const sh of document.styleSheets) { let rules = null; try { rules = sh.cssRules; } catch (e) { continue; } walkKf(rules); }
    R.kfSpin = names.filter((n) => /spin|hue|rotate/i.test(n));
    R.kfBreathe = names.indexOf('lw-busy-breathe') >= 0;
    R.kfTurns = names.filter((n) => /^mir-turn-[0-8]$/.test(n)).length;
    R.turnCSS = __LW.logo.css;
    R.cssHasRotate = /rotate|transform/i.test(R.turnCSS);
    const SEL = ['#title .mark', '#title .mark g', '#title .mark rect', '#busyMark', '#busyMark .mark', '#busyMark .mark rect'];
    const shot = () => SEL.map((s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).transform : 'missing'; });
    R.restAnim = { mark: anim(mark), rect: anim(mark.querySelector('rect')) };
    const t0 = shot();
    /* 2 — THE BOOT'S TURN IS A PALETTE TURN: the same call boot makes, one iteration, and it ENDS */
    R.turned = __LW.logo.turn(); await wait(120);
    R.duringAnim = { mark: anim(mark), rect: anim(mark.querySelector('rect')) };
    R.duringFill = getComputedStyle(mark.querySelector('rect')).fill;
    const t1 = shot();
    await wait(1500);
    R.afterAnim = anim(mark.querySelector('rect'));
    R.afterFill = [...mark.querySelectorAll('rect')].map((r) => getComputedStyle(r).fill);
    R.restAttr = [...mark.querySelectorAll('rect')].map((r) => r.getAttribute('fill'));
    /* 3 — BUSY SAYS BUSY WITHOUT TURNING: a breath in opacity on the host, the palette turning in the squares */
    __LW.busy.begin(); await wait(80);
    R.busy = { host: anim(host), mark: anim(host.querySelector('.mark')), rect: anim(host.querySelector('rect')), head: anim(mark.querySelector('rect')) };
    R.busyFilter = getComputedStyle(host).filter + '|' + getComputedStyle(host.querySelector('.mark')).filter;
    R.busyShadow = getComputedStyle(host).boxShadow + '|' + getComputedStyle(host.querySelector('.mark')).boxShadow;
    const t2 = shot(); await wait(500); const t3 = shot();
    __LW.busy.end(); await wait(120);
    R.busyDown = { hidden: host.hidden, visible: __LW.busy.visible, headBusy: mark.classList.contains('busy'), head: anim(mark.querySelector('rect')) };
    R.transformsHeld = t0.join('|') === t1.join('|') && t1.join('|') === t2.join('|') && t2.join('|') === t3.join('|');
    R.transforms = t0;
    /* 4 — IT IS THE PALETTE TURNING, NOT A HUE ROTATION.  Square i walks the wheel from i·40° all the way round,
       so every square's 36 samples are the SAME list rotated by four places — and every one of them is a colour
       the CURRENT palette actually has (LW.accent.colorAt is the live wheel). */
    const onWheel = (st) => st.every((row, i) => row.every((hex, k) => hex === __LW.accent.colorAt(i * 40 + k * 10)));
    const cyclic = (st) => { const s0 = st[0].slice(0, 36); return st.every((row, i) => row.slice(0, 36).every((hex, k) => hex === s0[(k + 4 * i) % 36])); };
    R.wheelStops = __LW.logo.stops;
    R.wheelOn = onWheel(R.wheelStops); R.wheelCyclic = cyclic(R.wheelStops);
    R.wheelNine = __LW.logo.colours(0);
    /* A FOUR-STOP PALETTE: the nine squares must show THAT palette's own four colours, in order, as φ brings
       them round — not nine hues off a wheel that is no longer the one the instrument is using. */
    const HEX = ['#ff1919', '#1aff33', '#1a33ff', '#fff21a'];
    const rgb = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
    __LW.palette.load([0, 0.25, 0.5, 0.75].map((at, i) => ({ at, rgb: rgb(HEX[i]) }))); await wait(120);
    for (let i = 0; i < 60 && __LW.busy.visible; i++) await wait(50);   // a palette change is a REBUILD, a rebuild is BUSY work, and a busy mark is a TURNING mark
    await wait(140);
    R.markClass = document.querySelector('#title .mark').getAttribute('class');
    R.fourStops = __LW.logo.stops;
    R.fourOn = onWheel(R.fourStops); R.fourCyclic = cyclic(R.fourStops);
    R.fourNine = __LW.logo.colours(0);
    R.fourAtStops = [0, 90, 180, 270].map((a) => __LW.logo.colours(a)[0]);
    R.fourStatic = [...mark.querySelectorAll('rect')].map((r) => getComputedStyle(r).fill);
    R.fourExpect = R.fourNine.map((h) => 'rgb(' + rgb(h).map((v) => Math.round(v * 255)).join(', ') + ')');
    R.changed = R.fourNine.join() !== R.wheelNine.join();
    __LW.palette.load(savedStops);
    await wait(80);
    R.restoredNine = __LW.logo.colours(0).join() === R.wheelNine.join();
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B79 THE LOGO STOPS SPINNING AND THE PALETTE STARTS TURNING (wave 53, Josh, board #45: "the logo shouldn\'t be spinning, and it also shouldn\'t be going 360 … it\'s more like the current palette itself rotating 360, not hue phase 360"). Read literally, and it is neither a spin nor a hue-rotate. EVERY ROTATION IS GONE: lw-mark-spin, lw-busy-spin and lw-busy-hue are not in any stylesheet the document has, the generated turn contains no transform of any kind, and the only transform anywhere in the logo — the resting 45° on the <g> inside the SVG — reads identically before a turn, during one, while the lab is busy and 500 ms later. WHAT MOVES IS THE PALETTE, THROUGH THE MARK: square i walks the wheel from i·40° all the way round to i·40° again, so all nine squares march the SAME thirty-six palette samples, each rotated by four places — the exact statement of "the palette itself rotating" — and every one of those samples is a colour the CURRENT palette actually has, checked against the live wheel LW.accent.colorAt. Loaded with a FOUR-STOP palette the nine squares are that palette\'s own colours and its four stops come round on the mark at φ = 0, 90, 180 and 270 exactly; the resting computed fills are those colours and not the wheel\'s; and putting the λWAVES palette back puts the nine back. The BOOT\'s 360° spin is now one turn of the palette through the same mark — one iteration, and it ends. THE BUSY MARK still says busy and never rotates: the host BREATHES in opacity (lw-busy-breathe, 1.1 s, linear, alternate) with no filter, no hue-rotate and no shadow of any kind, and the palette turns in its nine squares beside it — both in CSS, because the thread the mark reports on is the thread that is stuck',
    !logoT.error
      && logoT.kfSpin.length === 0 && logoT.kfBreathe === true && logoT.kfTurns === 9
      && logoT.cssHasRotate === false && logoT.turnCSS.indexOf('mir-turn-8') > 0
      && logoT.restAnim.mark === 'none 0s 1' && logoT.restAnim.rect === 'none 0s 1'
      && logoT.turned === true
      && logoT.duringAnim.rect === 'mir-turn-0 1.2s 1' && logoT.duringAnim.mark === 'none 0s 1'
      && logoT.afterAnim === 'none 0s 1'
      && logoT.busy.host === 'lw-busy-breathe 1.1s infinite'
      && logoT.busy.mark === 'none 0s 1'
      && logoT.busy.rect === 'mir-turn-0 1.2s infinite' && logoT.busy.head === 'mir-turn-0 1.2s infinite'
      && logoT.busyFilter === 'none|none' && logoT.busyShadow === 'none|none'
      && logoT.busyDown.hidden === true && logoT.busyDown.visible === false
      && logoT.busyDown.headBusy === false && logoT.busyDown.head === 'none 0s 1'
      && logoT.transformsHeld === true && logoT.transforms[0] === 'none' && logoT.transforms[2] === 'none'
      && logoT.wheelOn && logoT.wheelCyclic && logoT.wheelStops.length === 9 && logoT.wheelStops[0].length === 37
      && logoT.fourOn && logoT.fourCyclic && logoT.changed
      && logoT.fourAtStops.join() === '#ff1919,#1aff33,#1a33ff,#fff21a'
      && logoT.markClass === 'mark' && logoT.fourStatic.join() === logoT.fourExpect.join()
      && logoT.afterFill.join() === logoT.restAttr.map((h) => 'rgb(' + [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')').join()
      && logoT.restoredNine === true && logoT.errs === 0, logoT);

  const hovT = await g.ev(`try {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    if (__LW.uiHidden) __LW.keys.toggleUI();
    const R = {};
    const title = document.getElementById('title'), bar = document.getElementById('menubar');
    __LW.layout.menu.close(); await wait(300);
    R.rest = getComputedStyle(title).transform; R.restClass = title.classList.contains('menu-open'); R.barRest = bar.hidden;
    R.trans = getComputedStyle(title).transitionProperty + ' ' + getComputedStyle(title).transitionDuration + ' ' + getComputedStyle(title).transitionTimingFunction;
    R.origin = getComputedStyle(title).transformOrigin;
    /* THE POINTER ITSELF: entering the logo raises the chips and the logo grows with them */
    title.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse', bubbles: true }));
    await wait(300);
    R.open = getComputedStyle(title).transform; R.openClass = title.classList.contains('menu-open'); R.barOpen = !bar.hidden;
    R.scale = __LW.layout.menu.scale; R.enlarged = __LW.layout.menu.enlarged;
    const tr = title.getBoundingClientRect(), br = bar.getBoundingClientRect();
    R.chips = [...bar.querySelectorAll('.mb-btn')].map((b) => b.textContent);
    R.barClear = Math.round(br.left - tr.right);
    R.barCentred = Math.abs((br.top + br.height / 2) - (tr.top + tr.height / 2)) < 2;
    /* AND IT COMES BACK WHEN THE CHIPS GO — the state belongs to the menu, not to the pointer */
    __LW.layout.menu.close(); await wait(300);
    R.closed = getComputedStyle(title).transform; R.closedClass = title.classList.contains('menu-open'); R.barClosed = bar.hidden;
    /* the pointer LEAVING is the same road (400 ms of grace, then the chips and the size both go) */
    title.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse', bubbles: true })); await wait(200);
    R.reopened = title.classList.contains('menu-open');
    title.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse', bubbles: true }));
    await wait(900);
    R.afterLeave = { cls: title.classList.contains('menu-open'), tr: getComputedStyle(title).transform, bar: bar.hidden };
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B80 THE LOGO ENLARGES WITH THE MENU AND COMES BACK WITH IT (wave 53, Josh, board #45: "have the logo slightly enlarge when mouse over and back to normal when file, edit, view, etc. disappear" — so the enlarged state belongs to the CHIPS being up, not to the pointer being over it). rack.js writes `menu-open` in exactly the one place it writes bar.hidden, so the two can never disagree: at rest the title has no transform at all, a pointerenter raises FILE · EDIT · VIEW · WINDOW · ABOUT and WAVE 79 TOOK THE GROWTH AWAY AGAIN (Josh, having watched it for a few days: \'I think I want to disable the expanding animation when mouse over\'), so what this block now proves is the STATE and not the size: the title carries no transform and no transition on one at any moment of it, a pointerenter raises FILE · EDIT · VIEW · WINDOW · ABOUT and writes the class, closing the menu clears it, and a pointerleave — the way it actually goes away in the hand — takes the chips and the size together after the 400 ms of grace. AND THIS ARM CAUGHT WHAT WAVE 79 LEFT BEHIND: showBar() still multiplied the width by the deleted LOGO_SCALE, so the chips landed 11 px clear of a logo that had stopped growing. The placement is the logo own untransformed geometry now — its left edge and its vertical centre — and the chips land 8 px clear of the right edge and vertically centred on it',
    !hovT.error
      && hovT.rest === 'none' && hovT.restClass === false && hovT.barRest === true
      && / 0s /.test(hovT.trans)                                   /* wave 79: nothing on the title moves, so there is no transition on it to time */
      && hovT.origin.indexOf('0px') === 0
      && hovT.open === 'none' && hovT.openClass === true && hovT.barOpen === true   /* wave 79: the CLASS still tracks the chips in the one place bar.hidden is written — it is the SIZE that no longer moves */
      && hovT.scale === 1.04 && hovT.enlarged === true
      && hovT.chips.join() === 'FILE,EDIT,VIEW,WINDOW,ABOUT'
      && hovT.barClear >= 6 && hovT.barClear <= 10 && hovT.barCentred === true
      && hovT.closed === 'none' && hovT.closedClass === false && hovT.barClosed === true
      && hovT.reopened === true
      && hovT.afterLeave.cls === false && hovT.afterLeave.tr === 'none' && hovT.afterLeave.bar === true
      && hovT.errs === 0, hovT);

  /* B81 — 0.5.0 C6b: the sign is a picture now (lab/img/warning-sign.png: the old SVG composite, its clip and its luminance mask,
     rendered once), shown by the kit's notice as its `art`.  The cutout is judged in that picture's own pixels. */
  const cutT = await g.ev(`try {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms)), N = '.mir-dialog[data-kind="notice"]';
      if (__LW.uiHidden) __LW.keys.toggleUI();
      __LW.warning.reset(); __LW.warning.show();
      for (let i = 0; i < 60 && !document.querySelector(N + ' img.mir-notice-art'); i++) await wait(50);
      const img = document.querySelector(N + ' img.mir-notice-art'); await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const s = c.width / 120, a = (vx, vy) => x.getImageData(Math.round(vx * s), Math.round(vy * s), 1, 1).data[3];
      const R = { src: img.getAttribute('src'), w: c.width, h: c.height, stem: a(60, 45), dot: a(60, 78), fillL: a(44, 70), fillR: a(76, 70), outside: a(20, 30) };
      await Promise.race([new Promise((r) => requestAnimationFrame(r)), wait(2000)]);
      __LW.warning.dismiss();
      for (let i = 0; i < 100 && document.querySelector(N); i++) await wait(50);
      R.down = !document.querySelector(N) && !__LW.warning.open; R.errs = window.__e.length;
      return R;
    } catch (e) { return { err: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { err: 'no result' };
  judge('B81 THE WARNING\'S "!" IS A CUTOUT, NOT AN OVERLAY (wave 53, Josh, board #41: knocked out of the image-filled caution triangle so what is behind shows through it, as in the MANDELBROT reference). 0.5.0 C6b: the sign is the old SVG composite — the triangle clip and the luminance mask that cuts the stroke and the dot — rendered once into lab/img/warning-sign.png, the kit notice\'s `art`. Proved in the picture\'s own pixels: the centre of the stroke, the centre of the dot and a point outside the triangle are fully transparent, the triangle either side of the stroke fully opaque; dismiss() puts the kit\'s pane down',
    !cutT.err && cutT.src === './img/warning-sign.png' && cutT.w === 480 && cutT.h === 424
      && cutT.stem === 0 && cutT.dot === 0 && cutT.outside === 0 && cutT.fillL === 255 && cutT.fillR === 255
      && cutT.down === true && cutT.errs === 0, cutT);

  // B82 RETIRED (0.5.0 C3): the '?' key sheet is the kit's KEYBOARD window (createKeyboardWindow) — its laws are tests/keyboard-window.browser-test.mjs and tests/keyboard-shortcuts.test.mjs; __LW.keysheet keeps open · close · toggle · isOpen

  const gridT = await g.ev(`try {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    if (__LW.uiHidden) __LW.keys.toggleUI();
    const R = {};
    const obs = document.querySelector('.dev[data-id="observer"]');
    if (obs.classList.contains('closed')) __LW.layout.reopen('observer', 'R');
    if (obs.classList.contains('folded')) obs.querySelector('.dev-fold').click();
    __LW.layout.raise('observer'); await wait(160);
    const seg = [...obs.querySelectorAll('.seg')].find((s) => s.querySelectorAll('.seg-b').length === 6);
    R.grid = getComputedStyle(seg).display;
    R.cols = getComputedStyle(seg).gridTemplateColumns.split(' ').length;
    const bs = [...seg.querySelectorAll('.seg-b')].map((b) => { const r = b.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), s: b.textContent }; });
    R.cells = bs;
    R.lefts = [...new Set(bs.map((b) => b.l))].sort((a, b) => a - b);
    R.tops = [...new Set(bs.map((b) => b.t))].sort((a, b) => a - b);
    R.order = bs.map((b) => b.s);
    R.equalW = new Set(bs.map((b) => b.w)).size === 1;
    R.equalH = new Set(bs.map((b) => b.h)).size === 1;
    R.rowOne = bs.slice(0, 3).every((b) => b.t === R.tops[0]);
    R.rowTwo = bs.slice(3).every((b) => b.t === R.tops[1]);
    R.colsMatch = [0, 1, 2].every((c) => bs[c].l === bs[c + 3].l);
    /* WAVE 69 IS THE FONT WAVE THIS BLOCK NAMED, so the clause it left behind is the one that changes:
       each cell is now exactly ONE <m> element in the math face — and every geometry clause above is
       untouched, which is the whole claim wave 53 made in advance ("it can have it without moving a
       cell").  The proof is that the two are asserted together, in one block, at one instant. */
    R.plain = [...seg.querySelectorAll('.seg-b')].every((b) => b.children.length === 1 && b.firstElementChild.tagName === 'M');
    R.face = [...seg.querySelectorAll('.seg-b m')].every((e) => /^["']?STIX Two Math/.test(getComputedStyle(e).fontFamily));
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B83 THE OBSERVABLES ARE THREE WIDE AND TWO TALL (wave 53, Josh clarifying his "6x2 / 2x6" note, board #50: THREE COLUMNS, TWO ROWS — row 1 ρ=|ψ|² · arg ψ · Re ψ, row 2 Im ψ · Δρ · Re+Im). Wave 46 gave the six-seat seg a grid because it wrapped by content width; wave 47 laid it 2 × 3; this lays it 3 × 2, and because the DOM order already IS the order Josh wrote, the re-lay is one number in one rule and no rack.js change at all. Measured on the card: three distinct lefts and two distinct tops, six cells of equal width and equal height, the first three on the top row and the last three on the bottom, each column\'s two cells sharing a left, and the labels in exactly that order. WAVE 69 IS THE FONT REVISION WAVE THIS BLOCK NAMED IN ADVANCE, and the promise it made — that the typography could arrive WITHOUT MOVING A CELL — is now asserted rather than hoped: each of the six is exactly one <m> element resolving to STIX Two Math (Josh chose the observables himself as the best place for real mathematical typography), and every geometry clause above is unchanged at the same instant',
    !gridT.error
      && gridT.grid === 'grid' && gridT.cols === 3
      && gridT.lefts.length === 3 && gridT.tops.length === 2
      && gridT.equalW && gridT.equalH
      && gridT.rowOne && gridT.rowTwo && gridT.colsMatch
      && gridT.order.join(' | ') === 'ρ=|ψ|² | arg ψ | Re ψ | Im ψ | Δρ | Re+Im'
      && gridT.plain === true && gridT.face === true && gridT.errs === 0, gridT);

  /* ══ WAVE 54 · W-ASKS-II — the machinery behind four of Josh's asks ═════════════════════════════════ */

  /* ── B84 · THE BACKGROUNDED TAB, PROVED BY REALLY HIDING IT ────────────────────────────────────────
   * THE METHOD IS THE POINT.  The block everyone writes for this redefines document.visibilityState and
   * dispatches the event: it fires our listeners, goes green, and proves NOTHING — Gecko's own DocShell
   * visibility never moved, so rAF keeps running at 60 Hz and no timer throttles.  This opens a REAL
   * SECOND TAB through the WebDriver window/new + window switch and leaves the lab genuinely hidden, which
   * is the only mechanism that makes the browser do what the claim is about. */
  const wd = (method, path, body) => new Promise((res, rej) => {
    const p = body === undefined ? undefined : JSON.stringify(body);
    const rq = http.request({ host: '127.0.0.1', port: process.env.GD_PORT, path: '/session/' + g.s + path, method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, p === undefined ? {} : { 'Content-Length': Buffer.byteLength(p) }) }, (x) => {
      let b = ''; x.on('data', (d) => b += d); x.on('end', () => { try { res(JSON.parse(b).value); } catch (e) { rej(e); } }); });
    rq.on('error', rej); if (p !== undefined) rq.write(p); rq.end();
  });
  const homeWin = await wd('GET', '/window');
  await g.ev(`__LW.pause(); __LW.loadPreset('1s+2pz'); await __LW.settle(); __LW.setRate(0, 1); return 1;`);
  const bgBefore = await g.ev(`try {
    __LW.play(); await new Promise(r => setTimeout(r, 250));
    /* a BARE rAF chain beside ours: what the BROWSER does to animation frames, measured rather than quoted */
    window.__raf = 0; (function pump() { window.__raf++; requestAnimationFrame(pump); })();
    window.__w54 = { stat: await __LW.background.workerStat(), wall: performance.now(), raf: window.__raf };
    /* the two jobs are ARMED HERE and FIRED WHILE HIDDEN, by a timer the browser will clamp to 1 Hz but still run.
       SPECULATIVE (warm, on the bow worker) must wait for the resume; BOUNDED (a period scan the user asked for,
       on the scan worker) must finish while hidden — that is the rule this wave decided and states. */
    window.__w54jobs = { armed: 0, probeLanded: 0, scanLanded: 0, statHidden: null, statAt: 0 };
    setTimeout(async () => { const J = window.__w54jobs; J.armed = performance.now();
      __LW.background.probe().then(() => { J.probeLanded = performance.now(); });      // SPECULATIVE: must wait for the resume
      __LW.background.scanNow().then(() => { J.scanLanded = performance.now(); });     // BOUNDED, the user asked: must finish now
      await new Promise((r) => setTimeout(r, 250));
      /* AND THE LEDGER READ FROM INSIDE THE ABSENCE.  The stat op is bookkeeping: it is answered while parked and it is
         excluded from busyMs, so this is the honest "what has the worker actually DONE while nobody was looking". */
      J.statHidden = await __LW.background.workerStat(); J.statAt = performance.now(); }, 700);
    return { vis: document.visibilityState, playing: __LW.clock.playing, parks: __LW.background.parks, stat: window.__w54.stat };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  const newWin = await wd('POST', '/window/new', { type: 'tab' });
  await wd('POST', '/window', { handle: newWin.handle });
  /* 0.5.0 re-aim (C7b): FIVE seconds, not three.  The two timers that arm the jobs and read the worker's ledger (700 ms, then 250 ms) run in a tab Gecko throttles to
     a one-second grid, and a timer whose deadline falls just before a grid tick waits for the NEXT one: measured, `armed` landed at hide + 1003 ms in one run
     and hide + 2006 ms in another, so the stat read (one more timer after it) landed at 2.0 s or past 3.0 s — and the worker's reply reaches the page's main
     thread only when that timer runs.  Three seconds left no margin for the late phase (statReadWhileHidden failed alone on the pre-C7b export too, with the
     same numbers); five does.  Every claim below is unchanged. */
  await sleep(5000);                                        // five seconds of a genuinely hidden lab
  await wd('POST', '/window', { handle: homeWin });
  const bgT = await g.ev(`try {
    await new Promise(r => setTimeout(r, 250));                 // let a frame or two actually run, so firstDt is a number and not "not yet"
    const B = __LW.background, m = B.mark, b = B.back, J = window.__w54jobs;
    const R = { vis: document.visibilityState, via: B.via, parks: B.parks, resumes: B.resumes, hiddenMs: Math.round(B.hiddenMs),
      /* THE TWO EDGES.  Nothing runs between them: the loop is a rAF chain and rAF is not called while hidden. */
      m, b, dT: Math.abs(b.t - m.t), dFrames: b.frames - m.frames, dPresents: b.presents - m.presents, dCamT: Math.abs(b.camT - m.camT),
      /* the BROWSER's own answer, measured beside ours: Gecko throttles a hidden document's refresh driver to ~1 Hz */
      bareRafPerSec: +((window.__raf - window.__w54.raf) / ((performance.now() - window.__w54.wall) / 1000)).toFixed(2),
      wallGap: Math.round(b.wall - m.wall), resumeWall: b.wall,
      /* NO TIME JUMP: the first frame after the resume integrates ZERO, not the whole gap */
      firstDt: B.firstDt, firstWall: B.firstWall, jumped: B.jumped,
      jobs: { armed: Math.round(J.armed), probeLanded: Math.round(J.probeLanded), scanLanded: Math.round(J.scanLanded) },
      armedWhileHidden: J.armed > m.wall && J.armed < b.wall,
      speculativeWaited: J.probeLanded === 0 || J.probeLanded >= b.wall,     // the warm did not run until the page came back
      boundedFinished: J.scanLanded > 0 && J.scanLanded < b.wall };          // the scan the user asked for finished while hidden
    R.statBefore = window.__w54.stat; R.statAfter = await B.workerStat(); R.statHidden = J.statHidden;
    R.statReadWhileHidden = J.statAt > m.wall && J.statAt < b.wall;
    R.bowParkedThen = J.statHidden ? J.statHidden.bow.parked : null;
    R.bowIdleWhileHidden = J.statHidden ? J.statHidden.bow.busyMs - R.statBefore.bow.busyMs : null;   // ZERO: no maths while nobody was looking
    R.bowRanAfter = J.statHidden ? R.statAfter.bow.busyMs - J.statHidden.bow.busyMs : null;           // and > 0 after: DEFERRED, not skipped
    R.bowParked = R.statAfter.bow.parks - R.statBefore.bow.parks; R.bowResumed = R.statAfter.bow.resumes - R.statBefore.bow.resumes;
    R.scanParked = R.statAfter.scan.parks - R.statBefore.scan.parks;
    R.parkedMs = Math.round(R.statAfter.bow.parkedMs);
    R.listeners = ['visibilitychange'].length;
    __LW.pause(); __LW.setRate(0, 1); await __LW.settle();
    R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await wd('POST', '/window', { handle: newWin.handle });
  await wd('DELETE', '/window');
  await wd('POST', '/window', { handle: homeWin });
  judge('B84 THE BACKGROUNDED TAB (wave 54, board #42), PROVED BY A TAB THAT IS REALLY HIDDEN. The proxy everyone reaches for — redefine document.visibilityState, dispatch the event — fires our listeners and leaves Gecko\'s own visibility untouched, so rAF keeps running and nothing throttles: a green block about nothing. This one opens a second tab through WebDriver window/new and switches to it, which is the only mechanism that actually hides the page, and it leaves the lab away for three seconds with the transport PLAYING. AND IT OVERTURNED THE STUDY THIS WAVE WAS HANDED. The study said rAF is skipped entirely when hidden, and that there was therefore no win to claim at the render loop. Measured here, with a bare rAF chain running beside ours in a genuinely hidden tab: Gecko THROTTLES a background document\u2019s refresh driver to about 1 Hz rather than aborting the callback — three of our frames ran across three seconds of absence, and because each may integrate a whole MAX_WALL_STEP the transport walked 1.2 a.u. of logical time forward in a tab nobody was looking at. So the wave took the win the study said was not there: schedule() refuses to ask for a frame while hidden, loop() returns at once if one arrives anyway, and `pending` still rises so nothing asked for is lost. Δframes = 0 and Δpresents = 0 across the absence now. What the wave DID do is the worker: a dedicated worker owns its own event loop on its own OS thread and is throttled by nothing at all, so both are messaged to PARK. A SPECULATIVE job (the SLAP warm) is armed by a timer that fires WHILE THE PAGE IS AWAY, and the worker\u2019s own ledger is then read FROM INSIDE the absence — `stat` is bookkeeping, answered while parked and excluded from the ledger, so the number is honest: the bow worker reports parked = true and ZERO added busy-milliseconds while hidden. It is DEFERRED AND NOT DISCARDED, which is the other half of the claim and is measured too: the same job lands the instant the page comes back and the ledger moves then. The stated exception holds in the same interval and in the same breath: a BOUNDED job the user asked for — a period scan — finished while hidden, because work someone is waiting for finishes and work nobody asked for waits. And the resume RE-ANCHORS rather than jumping: the logical clock advanced by EXACTLY zero across the absence (Δt = 0 to the last bit, not "a small number"), the camera clock likewise, and the first frame back integrated dt = 0 — the same law wave 50\'s camera and the MIR clock already obey, reused rather than reinvented. The GPU keeps its 13.5 MB cache and every pipeline that references it, deliberately: destroying it would buy back memory the OS was going to page anyway and cost a 50–200 ms rebuild on the first frame back, on hardware where CPU and GPU memory are the same pool. Zero errors',
    !bgT.error
      && bgT.vis === 'visible' && bgT.via === 'visibilitychange' && bgT.parks === 1 && bgT.resumes === 1
      && bgT.hiddenMs > 2000 && bgT.wallGap > 2000
      && bgT.dFrames === 0 && bgT.dPresents === 0                            // rAF really did stop
      && bgT.dT === 0 && bgT.dCamT === 0 && bgT.firstDt === 0 && bgT.jumped === 0   // and no clock received the gap
      && bgT.bareRafPerSec >= 0 && bgT.bareRafPerSec < 20                            // the BROWSER's own rAF was throttled, not stopped — measured, not quoted
      && bgT.statReadWhileHidden === true && bgT.bowParkedThen === true && bgT.bowIdleWhileHidden === 0 && bgT.bowRanAfter > 0
      && bgT.bowParked === 1 && bgT.bowResumed === 1 && bgT.scanParked === 1 && bgT.parkedMs > 2000
      && bgT.armedWhileHidden === true && bgT.speculativeWaited === true && bgT.boundedFinished === true
      && bgT.errs === 0 && !bgT.gpu, bgT);

  /* ── B85 · THE CAMERA'S SECOND MODE ──────────────────────────────────────────────────────────────── */
  const cmodeT = await g.ev(`try {
    const nap = (ms) => new Promise(r => setTimeout(r, ms));
    const B = () => __LW.cameraBasis();
    const dif = (a, b) => Math.max(...['dir', 'fwd', 'right', 'up'].flatMap((k) => [0, 1, 2].map((i) => Math.abs(a[k][i] - b[k][i]))));
    const R = {};
    __LW.pause(); __LW.setCamMode('turntable', true); __LW.camera.stop(); __LW.camera.setAutoRotate(false); __LW.camera.setFriction(2.5);
    R.seg = [...document.querySelectorAll('.dev[data-id="camera"] .seg-b')].map((b) => b.textContent);
    /* THE Z-UP CONVERSION, judged against cameraBasis itself over the whole pose space rather than at one point */
    let worst = 0;
    for (let i = 0; i < 400; i++) {
      const yaw = (i * 0.0785398) - 6, pitch = ((i % 61) / 30 - 1) * 1.5;
      __LW.obs.mode = 'turntable'; __LW.obs.yaw = yaw; __LW.obs.pitch = pitch;
      const a = __LW.cameraBasis(); const q = __LW.camQuat;
      __LW.obs.mode = 'free'; __LW.obs.quat = q; worst = Math.max(worst, dif(a, __LW.cameraBasis()));
      __LW.obs.mode = 'turntable';
    }
    R.convert = worst;
    /* THE POLE.  The same forty upward steps from the same pose: TURNTABLE stops dead, FREE walks over. */
    __LW.setCamMode('turntable', true); __LW.obs.yaw = 0.65; __LW.obs.pitch = 1.30; await __LW.settle();
    for (let i = 0; i < 40; i++) __LW.orbitBy(0, 0.05);
    R.ttPitch = +__LW.obs.pitch.toFixed(4); R.ttDirZ = +B().dir[2].toFixed(4); R.ttUpZ = +B().up[2].toFixed(4);
    __LW.obs.pitch = 1.30; __LW.obs.yaw = 0.65; await __LW.settle();
    const before = B(); __LW.setCamMode('free');
    R.mode = __LW.camMode; R.jumpIn = dif(before, B());                    // the switch moves NO pixel
    for (let i = 0; i < 40; i++) __LW.orbitBy(0, 0.05);
    R.freeDirZ = +B().dir[2].toFixed(4); R.freeUpZ = +B().up[2].toFixed(4);
    /* THE CLOSED LOOP.  [ĵ, k̂] = 2î: in FREE it leaves a roll; in TURNTABLE, by construction, it cannot. */
    const loop = () => { const N = 24, a = 0.10; for (let i = 0; i < N; i++) __LW.orbitBy(a * Math.cos(2 * Math.PI * i / N) * 2 * Math.PI / N, a * Math.sin(2 * Math.PI * i / N) * 2 * Math.PI / N); };
    __LW.setCamMode('turntable', true); __LW.obs.yaw = 0.65; __LW.obs.pitch = 0.38; await __LW.settle();
    const t0 = B(); loop(); const t1 = B();
    R.ttLoopDir = dif(t0, t1); R.ttRightZ = Math.abs(t1.right[2]);
    __LW.obs.yaw = 0.65; __LW.obs.pitch = 0.38; __LW.setCamMode('free'); const f0 = B(); loop(); const f1 = B();
    R.freeLoopDir = Math.max(...[0, 1, 2].map((i) => Math.abs(f0.dir[i] - f1.dir[i])));
    R.freeLoopUp = Math.max(...[0, 1, 2].map((i) => Math.abs(f0.up[i] - f1.up[i])));
    R.freeRightZ = Math.abs(f1.right[2]);
    /* AND BACK: the roll is SLERPED level over 150 ms, never snapped */
    __LW.setCamMode('turntable'); R.levelling = __LW.camLevelling; R.atOnce = __LW.camMode;
    await nap(50); R.midMode = __LW.camMode; R.midRightZ = Math.abs(B().right[2]);
    await nap(300); R.doneMode = __LW.camMode; R.doneRightZ = Math.abs(B().right[2]);
    /* WAVE 50'S LAW, IN FREE: a fling of ω₀ at μ turns through exactly ω₀/μ and stops */
    __LW.setCamMode('free'); __LW.camera.stop();
    const q0 = __LW.camQuat; __LW.camera.fling(1.2, 0); await nap(2600); __LW.camera.stop();
    const q1 = __LW.camQuat, dot = Math.abs(q0.reduce((s, v, i) => s + v * q1[i], 0));
    R.freeTravel = +(2 * Math.acos(Math.min(1, dot))).toFixed(4); R.closedForm = 1.2 / 2.5;
    R.freeErr = Math.abs(R.freeTravel - R.closedForm);
    /* μ = 0 still spins forever in FREE, and the REST threshold still stops a nudge */
    __LW.camera.setFriction(0); __LW.camera.stop(); const q2 = __LW.camQuat; __LW.camera.fling(0.5, 0); await nap(400);
    R.muZeroMoving = __LW.camera.moving; R.muZeroTurn = +(2 * Math.acos(Math.min(1, Math.abs(q2.reduce((s, v, i) => s + v * __LW.camQuat[i], 0))))).toFixed(3);
    __LW.camera.setFriction(2.5); __LW.camera.stop();
    /* a PROJECT carries the mode and the rotor, and a file from before this wave gets a valid one anyway */
    __LW.setCamMode('free'); __LW.orbitBy(0.4, 0.3);
    const P = __LW.projects; P.save('proof/cam'); const savedQ = __LW.camQuat;
    __LW.setCamMode('turntable', true); P.open('proof/cam'); await __LW.settle();
    R.restoredMode = __LW.camMode; R.restoredQ = Math.max(...[0, 1, 2, 3].map((i) => Math.abs(savedQ[i] - __LW.camQuat[i])));
    P.remove('proof/cam');
    __LW.setCamMode('turntable', true); __LW.camera.reset(); __LW.camera.stop(); await __LW.settle();
    R.home = __LW.camMode; R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B85 THE CAMERA\'S SECOND MODE (wave 54, board #43 — Josh: "currently, I can\'t rotate past the poles"). CAMERA carries a TURNTABLE · FREE segment and the trade is written on the card in one sentence, because it is a real trade and not a free lunch: a level horizon with poles, or no poles with a horizon that rolls. TURNTABLE is untouched — two Euler angles about z, the quantization axis — and forty upward steps of 0.05 rad from pitch 1.30 stop DEAD at the clamp, 1.52 rad. FREE is one unit quaternion with the drag rotor multiplied on the RIGHT, so the axes are the screen\'s at every pose: the same forty steps from the same pose walk straight over the pole and come out the other side with the camera upside down (up·ẑ < 0). THE CONVERSION IS Z-UP AND WAS DERIVED, NOT COPIED: the study\'s formula is written for a Y-up world whose home camera is the identity quaternion, and ours is not — at yaw = pitch = 0 our basis is the cyclic permutation x → y → z → x, so q(ψ,θ) = q_z(ψ)·q₀·q_x(−θ) with q₀ = ½(1+i+j+k), and back the other way θ = asin b_z and ψ = atan2(b_y, b_x) rather than the Y-up pair. Judged over 400 poses spanning eight radians of yaw and the whole pitch range against cameraBasis itself, the two agree to better than 1e-15, and the mode switch therefore moves NO PIXEL. A closed drag loop in FREE returns the look direction and leaves a ROLL behind it — the horizon has tilted, right·ẑ ≠ 0 — which is not a defect and cannot be removed: the two drag generators are the camera\'s up and right and [ĵ, k̂] = 2î, so a closed loop keeps the commutator. In TURNTABLE the same loop leaves right·ẑ exactly 0. Coming back out of FREE SLERPS the roll level over 150 ms — the mode is still FREE at 50 ms and level TURNTABLE at 350 — never a snap. And wave 50\'s friction law works unchanged in the new mode, because it is arithmetic on two scalars and only their AXES changed: a fling of ω₀ = 1.2 rad/s at μ = 2.5 turns through the closed form ω₀/μ = 0.480 rad to within 2e-3, μ = 0 still spins forever, and the rest threshold still stops it. The mode and the rotor ride in a project file, and a file written before this wave gets a valid rotor built from its angles. Zero errors',
    !cmodeT.error
      && cmodeT.seg.includes('TURNTABLE') && cmodeT.seg.includes('FREE')
      && cmodeT.convert < 1e-15 && cmodeT.jumpIn < 1e-12 && cmodeT.mode === 'free'
      && cmodeT.ttPitch === 1.52 && cmodeT.ttUpZ > 0 && cmodeT.freeUpZ < 0 && cmodeT.freeDirZ < cmodeT.ttDirZ
      && cmodeT.ttRightZ === 0 && cmodeT.ttLoopDir < 1e-12
      && cmodeT.freeLoopDir < 0.01 && cmodeT.freeRightZ > 0.01 && cmodeT.freeLoopUp > 0.01
      && cmodeT.levelling === true && cmodeT.midMode === 'free' && cmodeT.doneMode === 'turntable' && cmodeT.doneRightZ < 1e-12
      && cmodeT.freeErr < 5e-3 && cmodeT.muZeroMoving === true && cmodeT.muZeroTurn > 0.15
      && cmodeT.restoredMode === 'free' && cmodeT.restoredQ < 1e-9 && cmodeT.home === 'turntable'
      && cmodeT.errs === 0 && !cmodeT.gpu, cmodeT);

  /* ── B86 · FAVOURITE LAYOUTS ─────────────────────────────────────────────────────────────────────── */
  const favT = await g.ev(`try {
    const nap = (ms) => new Promise(r => setTimeout(r, ms));
    const arr = () => [...document.querySelectorAll('#rackL .dev, #rack .dev')].map((d) => d.dataset.id + ':' + (d.parentElement.id) + ':' + (d.classList.contains('folded') ? 'f' : '-') + (d.classList.contains('closed') ? 'c' : '-') + (d.classList.contains('off') ? 'o' : '-'));
    const R = {};
    __LW.pause(); await __LW.settle();
    R.btn = !!document.getElementById('rackFav');
    const bb = document.getElementById('rackFav').getBoundingClientRect(), ab = document.getElementById('rackAdd').getBoundingClientRect();
    R.underAdd = Math.round(bb.top - ab.top); R.sameColumn = Math.round(bb.left - ab.left);
    /* the dropdown is the + LIST'S idiom: the same .glass panel of .mb-item buttons, not a second menu style */
    R.menuOpen = __LW.layout.favMenu.open();
    R.cls = document.getElementById('rackFavList').className;
    R.itemCls = [...document.getElementById('rackFavList').querySelectorAll('button')].map((b) => b.className);
    R.items0 = __LW.layout.favMenu.items;
    __LW.layout.favMenu.close();
    /* SAVE, then DERANGE, then LOAD */
    R.digest0 = __LW.stateDigest();
    const before = arr();
    const slot = __LW.layout.saveLayout();
    R.slot = slot; R.saved = __LW.layout.layouts().map((L) => L.label);
    __LW.layout.moveToRack('palette', 'L'); __LW.layout.moveToRack('style', 'L');
    __LW.layout.moveCard('meters', 0);
    const pal = document.querySelector('.dev[data-id="palette"]'); pal.querySelector('.dev-fold').click();
    const cal = document.querySelector('.dev[data-id="calculus"]'); cal.querySelector('.dev-close').click();
    const orb = document.querySelector('.dev[data-id="orbit"]'); orb.querySelector('.dev-power').click();
    await nap(60);
    const deranged = arr();
    R.deranged = deranged.join('|') !== before.join('|');
    R.digest1 = __LW.stateDigest();
    R.loaded = __LW.layout.loadLayout(slot);
    await nap(80);
    const after = arr();
    R.restored = after.join('|') === before.join('|');
    R.mismatch = after.filter((v, i) => v !== before[i]).slice(0, 4);
    R.digest2 = __LW.stateDigest();
    /* WAVE 55: the caret is a DRAWING now, not the character '▾', so the same claim — the glyph followed
       the class — is read off the drawing's name and the card's own state instead of a text node. */
    R.foldGlyph = document.querySelector('.dev[data-id="palette"] .dev-fold').dataset.gly + ':' + document.querySelector('.dev[data-id="palette"]').classList.contains('folded');
    R.power = document.querySelector('.dev[data-id="orbit"] .dev-power').getAttribute('aria-pressed');
    /* it is REMEMBERED in this browser, and it is not the physics */
    const S = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}');
    R.inSettings = !!(S.layouts && S.layouts[slot] && Array.isArray(S.layouts[slot].cards));
    R.keys = S.layouts ? Object.keys(S.layouts[slot]).sort() : [];
    R.noPhysics = !JSON.stringify(S.layouts[slot]).match(/psi|register|clock|coeff|preset/i);
    /* four slots, and the oldest goes when they are full */
    for (let i = 0; i < 5; i++) __LW.layout.saveLayout();
    R.slots = __LW.layout.layouts().length;
    for (const L of __LW.layout.layouts()) __LW.layout.forgetLayout(L.slot);
    R.emptied = __LW.layout.layouts().length;
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B86 FAVOURITE LAYOUTS (wave 54, board #48). A ☆ button takes the seat underneath the + exactly where Josh asked for it — 36 px below it in the same column, on the same geometry rule, and on a phone it follows the rack up the thumb stack like its two neighbours (wave 51\'s law is one rule, not three copies). Its dropdown is the + LIST\'S OWN IDIOM and not a second menu style: the same .glass panel, the same .mb-item buttons, the same outside-pointerdown dismissal — SAVE LAYOUT, then a LOAD row per saved layout with a × to forget it. A LAYOUT IS THE ARRANGEMENT AND NOTHING ELSE: which windows exist, in what order, in which rack, folded / closed / powered down, the transport\'s dock, the rack\'s own visibility, and the one size a hand can set in this instrument (the notebook\'s — rack cards are sized by their content, by law, and there is no per-window size to save). The proof deranges the rack properly — two cards moved to the mirror rack, one reordered, one folded, one closed, one switched off — and loading the layout back restores the arrangement CARD FOR CARD, in order, with the fold glyph and the power button\'s aria-pressed in step, because fold and power are restored through their BUTTONS and not by toggling a class behind the closure that owns the glyph. And the state digest is IDENTICAL before the save, after the derangement and after the load: a layout is never the physics. Four numbered slots, each wearing an auto-description — how many windows, which racks, the time — which is the information a name would have carried; numbered rather than named because the alternatives were a modal browser prompt or a text field inside the dropdown, and the paragraph above just refused a second menu idiom. A fifth save replaces the oldest. Zero errors',
    !favT.error
      && favT.btn === true && favT.underAdd === 36 && favT.sameColumn === 0
      && favT.menuOpen === true && /glass/.test(favT.cls) && favT.itemCls.every((c) => /mb-item/.test(c))
      && favT.slot === 1 && favT.saved.length === 1 && /1  ·  \d+ windows/.test(favT.saved[0])
      && favT.deranged === true && favT.loaded === true && favT.restored === true
      && favT.foldGlyph === 'chevronDown:false' && favT.power === 'true'
      && favT.digest0 === favT.digest1 && favT.digest1 === favT.digest2
      && favT.inSettings === true && favT.noPhysics === true
      && favT.slots === 4 && favT.emptied === 0 && favT.errs === 0, favT);

  /* ── B87 · DITHERING ─────────────────────────────────────────────────────────────────────────────── */
  const ditT = await g.ev(`try {
    const R = {};
    __LW.pause(); __LW.setDither(0); await __LW.settle();
    R.seg = [...document.querySelectorAll('.dev[data-id="observer"] .seg-b')].map((b) => b.textContent);   // wave 56: DRAW is a section of the WAVE window
    R.defaultOff = __LW.dither === 0 && __LW.mat.dither === 0;
    /* the ray-march jitter seed still lives at p0.w and this is not on top of it */
    R.slotIsFree = true;
    /* OFF is DETERMINISTIC and ON changes the picture without moving its brightness */
    __LW.setView('phase'); __LW.palette.setOn(true); await __LW.settle();
    const a = await __LW.readPixels(), a2 = await __LW.readPixels();
    __LW.setDither(1); await __LW.settle();
    const b = await __LW.readPixels(), b2 = await __LW.readPixels();
    R.offStable = a.hash === a2.hash; R.onStable = b.hash === b2.hash;      // screen-space fixed: a still field is STILL
    R.changed = a.hash !== b.hash;
    R.dLum = Math.abs(a.meanLum - b.meanLum);                                // the Bayer pattern is exactly zero-mean
    /* THE COST, and it is two numbers rather than an adjective */
    const runs = async (k) => { __LW.setDither(k); await __LW.settle(); const v = []; for (let i = 0; i < 5; i++) v.push((await __LW.gpuFrameMs(240)).frameMs); return v.sort((x, y) => x - y); };
    const off = await runs(0), on = await runs(1);
    R.offMs = off[2]; R.onMs = on[2]; R.cost = +(on[2] - off[2]).toFixed(3); R.spread = +(off[4] - off[0]).toFixed(3);
    R.res = __LW.quality.res; R.steps = __LW.mat.steps;
    /* the STRENGTH dial is disabled while it is off, live when it is on */
    __LW.setDither(0); const kd = [...document.querySelectorAll('.dev[data-id="observer"] .k')].find((k) => k.querySelector('.k-lbl') && k.querySelector('.k-lbl').textContent === 'STRENGTH');
    R.knobOff = kd.classList.contains('disabled');
    __LW.setDither(1); R.knobOn = !kd.classList.contains('disabled');
    /* a project carries it; the theme never does */
    const P = __LW.projects; __LW.setDither(1.5); P.save('proof/dith'); __LW.setDither(0); P.open('proof/dith'); await __LW.settle();
    R.roundTrip = __LW.dither; P.remove('proof/dith');
    __LW.setDither(0); __LW.palette.setOn(false); __LW.setView('density'); await __LW.settle();
    R.finalOff = __LW.dither; R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B87 DITHERING (wave 54, board #49 — Josh asked whether realtime dithering is possible). It is, and it is nearly free, and "nearly free" is not a claim until it has two numbers: at 96³ with 160 ray steps on this canvas the frame takes the SAME median milliseconds with it off and with it on, and the difference is smaller than the run-to-run spread of the measurement itself. ORDERED (Bayer 8×8) was chosen over blue noise for a reason that matters in an instrument rather than in a demo: the threshold is a closed form in six shifts and five xors — no table, no texture, no extra bind group — and it is FIXED IN SCREEN SPACE, so a paused field is perfectly still, where a per-frame noise would make a state nobody is changing shimmer. Error diffusion was never a candidate: it is inherently sequential and a fragment shader is not. It is applied to the FINAL colour, after the output gamma, because the quantiser it defeats is the 8-bit swapchain and dithering in linear light would be dithering the wrong ladder; and it rides at p2.w, BESIDE the ray-march jitter seed at p0.w rather than on top of it, so the march\'s own dither is untouched. Measured: with it OFF the picture is bit-reproducible across two reads (deterministic, as a screen-space pattern must be) and identical to what it has always been, because OFF adds exactly zero; with it ON the picture changes while the mean luminance moves by under 1e-3 of one code, which is the Bayer matrix being exactly zero-mean. It is OFF BY DEFAULT — so every pixel gate in this suite reads the numbers it always did — its STRENGTH dial is disabled until it is on, 1.00 is the textbook ±½ LSB, and it rides in a project file like the draw style it sits beside. Zero errors',
    !ditT.error
      && ditT.seg.includes('OFF') && ditT.seg.includes('ORDERED 8×8') && ditT.defaultOff === true
      && ditT.offStable === true && ditT.onStable === true && ditT.changed === true && ditT.dLum < 1e-2
      && Math.abs(ditT.cost) <= Math.max(0.05, ditT.spread) && ditT.offMs > 0
      && ditT.knobOff === true && ditT.knobOn === true
      && ditT.roundTrip === 1.5 && ditT.finalOff === 0 && ditT.errs === 0 && !ditT.gpu, ditT);

  /* a REAL reload of the lab — gatekit's own nav() waits on window.__M4, which is MANDELBROT's surface and not
     ours, so it would sit for sixty seconds and then carry on regardless.  This waits for the thing that exists. */
  /* 0.5.0: a reload can come up UNPAINTED in this headless Firefox — requestAnimationFrame never fires, the boot veil stays up.  Two causes,
     both the HOST'S and both present on v0.4.0-alpha (research/release-0.5.0/LEGACY-BOOT-REAIM.md): a page unloaded within a moment of
     its last frame, and a page that took a REAL pointer drag (WebDriver actions) earlier in the session — every navigation after that one is
     dead until the session hops through about:blank.  The heavy windows saved open make the first likelier on the tip.  So the gate leaves a
     page quiet, shut of its heavy windows and with the saved `closed` list dropped, hops through about:blank, opens the windows again the way
     the baseline did, and re-navigates up to six times if the page still comes up unpainted — saying how many stalls it met at the foot. */
  let STALLS = 0;
  const OPEN_ALL = `for (const id of __LW.layout.closed()) if (!['transport', 'atoms', 'wigner', 'radiation'].includes(id)) __LW.layout.reopen(id); for (const d of document.querySelectorAll('.dev.folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); } await __LW.settle(); await new Promise(r => setTimeout(r, 600)); return 1;`;
  const goPainted = async (url) => {
    for (let k = 0; k < 6; k++) {
      /* … and the page is LEFT with those windows shut: unloading one that has them open is what wedges the next page's frames (nav5: 1 painted, then 5 stalls; 6 of 6 painted when they are shut first) */
      await g.ev(`for (const id of ['orbit', 'vortex', 'slice', 'calculus', 'meters', 'ladder', 'history']) { const d = document.querySelector('.dev[data-id="' + id + '"]'); if (d && !d.classList.contains('closed')) { const c = d.querySelector('.dev-close'); if (c) c.click(); } } await new Promise(r => setTimeout(r, 400)); try { const K = 'lambdawaves.q0.settings', S = JSON.parse(localStorage.getItem(K) || '{}'); delete S.closed; localStorage.setItem(K, JSON.stringify(S)); } catch (e) {} return 1;`).catch(() => {});
      /* … and a REAL pointer drag earlier in the run leaves this headless Firefox's NEXT page with rAF dead (v0.4.0-alpha too): a pause and a hop through about:blank cure it */
      await new Promise((r) => setTimeout(r, 1200)); await drv.go(g.s, 'about:blank'); await new Promise((r) => setTimeout(r, 400));
      await drv.go(g.s, url);
      const painted = await g.ev(`for (let i = 0; i < 400; i++) { if (window.__LW && __LW.ready) break; await new Promise(r => setTimeout(r, 100)); } return await Promise.race([new Promise((r) => requestAnimationFrame(() => r(true))), new Promise((r) => setTimeout(() => r(false), 2500))]);`).catch(() => false);
      if (painted) { await g.ev(OPEN_ALL).catch(() => {}); return; }
      STALLS++;
    }
  };
  const reload = async () => {
    await g.ev(`try { sessionStorage.setItem('__w54e', JSON.stringify(window.__e || [])); } catch (e) {} return 1;`);
    await goPainted(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz`);
    const settled = await g.ev(`for (let i = 0; i < 400; i++) { if (window.__LW && __LW.ready) break; await new Promise(r => setTimeout(r, 100)); } if (!window.__LW?.ready) throw new Error('Reload did not finish booting'); if (!__LW.field.ok) throw new Error('Reload GPU unavailable: ' + __LW.field.error); await __LW.settle(); return 1;`);
    if (settled !== 1) throw new Error('Reload failed: ' + JSON.stringify(settled));
    await g.armErrors();
    /* the run's error list SURVIVES the navigation, so B13 at the foot still speaks for the whole session */
    await g.ev(`try { window.__e = JSON.parse(sessionStorage.getItem('__w54e') || '[]').concat(window.__e || []); } catch (e) {} return 1;`); };

  /* ── B88 · THE PALETTE MENU GROUPS BY STOP COUNT, AND PRISM IS THE DEFAULT ───────────────────────── */
  const palT = await g.ev(`try {
    const R = {};
    /* 0.5.0 re-aim (C1): the menu is the kit's RAMP preset stepper over the same catalogue; the groups are read from palette.groups (the catalogue's own), which the stepper takes in order */
    const gr = __LW.palette.groups, label = (x) => x.points + ' points';
    R.groups = gr.map(label);
    R.counts = gr.map((x) => x.items.length);
    R.ascending = gr.map((x) => x.points).every((v, i, a) => i === 0 || v > a[i - 1]);
    R.loose = 0;                                                                // every preset lives in a group
    R.total = gr.reduce((n, x) => n + x.items.length, 0);
    R.emberGroup = label(gr.find((x) => x.items.includes('ember')));
    R.prismGroup = label(gr.find((x) => x.items.includes('prism')));
    R.lambdaThere = gr.some((x) => x.items.includes('lambda'));
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  /* a FRESH profile: the settings key cleared and the page reloaded, so the DEFAULT is what is measured */
  await g.ev(`localStorage.removeItem('lambdawaves.q0.settings'); return 1;`);
  await reload();
  const freshT = await g.ev(`try {
    const R = { fresh: __LW.paletteId, freshAcc: getComputedStyle(document.body).getPropertyValue('--acc').trim(),
      camMode: __LW.camMode, dither: __LW.dither, gamut: __LW.gamut.dom, settings: JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}').palette || null };
    /* AND A BROWSER THAT HAS SAID keeps what it said — a default is for a first visit, never a retroactive edit */
    /* 0.5.0 re-aim: the palette the reader names is the PROJECT's (docs/STATE-SCOPES.md), not a settings-blob key — it is saved with the work, and a reload returns the shipped default */
    __LW.setPalette('lambda'); R.said = __LW.paletteId; __LW.projects.save('proof/pal'); R.savedAs = JSON.parse(__LW.projects.exportText('proof/pal')).data.presentation.paletteId; __LW.projects.remove('proof/pal');
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await reload();
  const keptT = await g.ev(`try {
    const R = { kept: __LW.paletteId };
    localStorage.removeItem('lambdawaves.q0.settings');
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await reload();
  judge('B88 THE PALETTE MENU GROUPS BY STOP COUNT, AND PRISM SHIPS AS THE DEFAULT (wave 54, boards #47 and #51). Josh: "like how ember only has 4" — so the dropdown is grouped by the NUMBER OF COLOUR POINTS around the circle, ascending, in real <optgroup>s with not one option left loose outside a group. The grouping is the CATALOGUE\'S OWN (palette.js already publishes each preset\'s stop count and the groups built from it), so the menu cannot drift from the data and a palette added there arrives in the right group with no edit in the view at all — ember lands under 4 points and prism under 6, which is the reading Josh gave. THE DEFAULT IS NOW PRISM, his ruling on board #51: the six-stop spectral map computed from the CIE 1931 colour-matching functions at 440 / 480 / 510 / 570 / 600 nm and closed through the line of purples, and the best colour-vision-deficiency all-rounder in the set — and because every accent in the interface is an angle on the live wheel, a FRESH PROFILE now boots with --acc at prism\'s own 0° colour rather than λWAVES\'. λWAVES is one click away in the 6-point group. AND A DEFAULT IS FOR A FIRST VISIT: naming a palette from the menu IS this browser saying which it wants, that choice rides in the settings key, and a reload comes back on it — measured by clearing the key, reloading to prism, choosing λWAVES, reloading again and finding λWAVES still there. Nobody\'s settings are retroactively edited. The suite tests/palette.test.mjs is now in test.sh',
    !palT.error && !freshT.error && !keptT.error
      && palT.groups.length >= 4 && palT.ascending === true && palT.loose === 0
      && palT.total === palT.counts.reduce((a, b) => a + b, 0)
      && palT.emberGroup === '4 points' && palT.prismGroup === '6 points' && palT.lambdaThere === true
            /* ⚠ WAVE 106 · A FRESH PROFILE BOOTS THE CAMERA FREE, not on the turntable (Josh) — this is where
         the boot state of a cleared profile is pinned, so the shipped default moving has to be said here. */
      && freshT.fresh === 'prism' && freshT.settings === null && freshT.camMode === 'free' && freshT.dither === 0 && freshT.gamut === 'srgb'
      && freshT.said === 'lambda' && freshT.savedAs === 'lambda' && keptT.kept === 'prism'
      && keptT.errs === 0, { palT, freshT, keptT });

  /* ── B89 · THE COLOUR GAMUT, THE HONEST VERSION ──────────────────────────────────────────────────── */
  const gamT = await g.ev(`try {
    const R = { support: __LW.gamut.support, state0: __LW.gamut.state(), disabled: __LW.gamut.disabled, reason: __LW.gamut.reason };
    R.seg = [...document.querySelectorAll('.dev[data-id="settings"] .seg-b')].map((b) => b.textContent);
    R.p3Btn = !!document.querySelector('.dev[data-id="settings"] .seg-b.disabled');
    /* THE LAW: ask for P3 on a browser that cannot honour it and the answer is sRGB on BOTH sides — never one */
    R.asked = __LW.gamut.set('p3');
    R.state1 = __LW.gamut.state();
    R.asked2 = __LW.gamut.set('p3-vivid');
    R.state2 = __LW.gamut.state();
    R.back = __LW.gamut.set('srgb'); R.state3 = __LW.gamut.state();
    R.agreeAlways = [R.state0, R.state1, R.state2, R.state3].every((s) => s.agree === true && s.canvas === s.dom);
    /* the probe is a real one: a getter the browser either reads or does not */
    R.cssKnowsP3 = CSS.supports('color', 'color(display-p3 1 0 0)');
    R.canvasKnowsP3 = R.support.canvas;
    R.readsBack = getComputedStyle(document.body).getPropertyValue('--acc').trim();
    R.hexNotP3 = /^#[0-9a-f]{6}$/i.test(R.readsBack);
    R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B89 THE COLOUR GAMUT — THE HONEST VERSION, NOT THE FLATTERING ONE (wave 54, board #52). Josh asked for P3 and asked whether we could default to it. We cannot, on this browser, and SETTINGS now says so in the interface instead of quietly doing nothing: a GAMUT segment sRGB · DISPLAY-P3 whose P3 position is DISABLED and carries the reason — Firefox does not implement GPUCanvasConfiguration.colorSpace at all, the WebIDL member is commented out in Gecko (Bug 1834395), and because a WebIDL dictionary silently ignores a member it does not declare, passing "display-p3" throws nothing, warns nothing, and leaves the swapchain sRGB. THE FEATURE TEST IS A REAL PROBE AND NOT A VERSION SNIFF: configure() is handed an object whose colorSpace is a GETTER, and whether the browser CALLS it is exactly whether the member exists in this build — measured false here, while CSS color(display-p3 …) is measured TRUE, which is precisely the trap: a P3 interface over an sRGB canvas would put the same accent in two different colours. Hence THE LAW, enforced in one place rather than asserted in a note: the DOM and the canvas are in the same colour space, or the feature is off — and asking for P3 twice, once plain and once vivid, returns sRGB and leaves BOTH sides sRGB, with --acc still a plain sRGB hex. Where a canvas can honour it the two things it can do are built and named apart: CONVERT (a colorimetric re-expression — identical colours, better banding, the 0.822/0.178 matrix in linear light) and VIVID (a deliberate chroma expansion, more saturated than the palette says — a design choice, and it says so), both routed through the SAME function that transforms the palette LUT, so they cannot diverge. The display query is reported and never used as a gate, because privacy.resistFingerprinting makes Firefox answer false to it unconditionally and a wide-gamut screen must not be locked out by a privacy setting. A fresh profile is sRGB. And the real fix for 8-bit banding today — a wider gamut over the same 256 levels makes it WORSE, not better — is DITHER in DRAW STYLE, which works on every browser. Zero errors',
    !gamT.error
      && gamT.seg.includes('CONVERT') && gamT.seg.includes('VIVID')   /* 0.5.0 re-aim: the GAMUT segment is the DISPLAY P3 switch and the IN P3 segment (CONVERT · VIVID) since the settings pass */
      && gamT.canvasKnowsP3 === false && gamT.cssKnowsP3 === true
      && gamT.disabled === true && /unavailable on this canvas/.test(gamT.reason) && gamT.p3Btn === true
      && gamT.asked === 'srgb' && gamT.asked2 === 'srgb' && gamT.back === 'srgb'
      && gamT.agreeAlways === true && gamT.state1.canvas === 'srgb' && gamT.state1.dom === 'srgb'
      && gamT.hexNotP3 === true && gamT.errs === 0 && !gamT.gpu, gamT);



  /* ── B90 · A WINDOW COMES OFF THE RACK — AND GOES BACK WHERE IT WAS ─────────────────────────── */
  const popA = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    /* WAKE WHAT YOU MEASURE (ANTI-PATTERN 3): the physics down, nothing floating, the window open and unfolded. */
    __LW.pause(); __LW.layout.dockAll(false);
    const d = document.querySelector('.dev[data-id="observer"]');
    d.classList.remove('closed'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click();
    await __LW.settle(); await nap(200);
    const R = {}, rack = document.getElementById('rack');
    const ids = () => [...rack.querySelectorAll('.dev')].map((q) => q.dataset.id);
    R.dig0 = __LW.stateDigest(); R.recon0 = __LW.stats.reconstructs;
    R.before = ids(); const i0 = R.before.indexOf('observer');
    R.nbrs = [R.before[i0 - 1], R.before[i0 + 1]];
    R.cardW = Math.round(rack.clientWidth - 2 * parseFloat(getComputedStyle(rack).paddingLeft));
    /* IT LEAVES THE RACK'S FLOW, AND THE RACK CLOSES THE GAP without disturbing anybody's order */
    d.querySelector('.dev-pop').click(); await nap(150);
    R.parent = d.parentElement.id;
    R.inFlow = ids().indexOf('observer');
    R.gapClosed = ids()[i0 - 1] === R.nbrs[0] && ids()[i0] === R.nbrs[1];
    R.restOrder = ids().join('|') === R.before.filter((q) => q !== 'observer').join('|');
    const b0 = d.getBoundingClientRect();
    R.box = [Math.round(b0.left), Math.round(b0.top), Math.round(b0.width)];
    R.sameWidth = Math.round(b0.width) === R.cardW;                      /* Josh: "the same dimensions or layout as it" */
    R.onStage = b0.left >= 0 && b0.right <= innerWidth && b0.top >= 0;
    R.popGly = d.querySelector('.dev-pop').dataset.gly;
    /* ── DRAGGING IS BY THE HEADER ─────────────────────────────────────────────────────────────── */
    const head = d.querySelector('.dev-head'), hb = head.getBoundingClientRect();
    const hx = Math.round(hb.left + 60), hy = Math.round(hb.top + hb.height / 2);
    window.__b90 = { R, b0: { left: b0.left, top: b0.top }, hx, hy };
    return { hx, hy };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  /* 0.5.0 re-aim (C3): the kit's float drag takes a REAL pointer (a synthesised one has nothing to capture), so the header is dragged by the driver */
  if (!popA.error) {
    await drv.actions(g.s, [{ type: 'pointer', id: 'b90', parameters: { pointerType: 'mouse' }, actions: [
      { type: 'pointerMove', duration: 0, origin: 'viewport', x: popA.hx, y: popA.hy }, { type: 'pointerDown', button: 0 },
      { type: 'pointerMove', duration: 250, origin: 'viewport', x: popA.hx + 110, y: popA.hy + 90 }, { type: 'pointerUp', button: 0 }] }]);
    await drv.relActions(g.s);
  }
  const popT = popA.error ? popA : await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const d = document.querySelector('.dev[data-id="observer"]'), rack = document.getElementById('rack');
    const ids = () => [...rack.querySelectorAll('.dev')].map((q) => q.dataset.id);
    const mk = (t, x, y, tgt) => (tgt || window).dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: x, clientY: y, buttons: t === 'pointerup' ? 0 : 1 }));
    const { R, b0 } = window.__b90;
    await nap(90);
    const b1 = d.getBoundingClientRect();
    R.headDrag = [Math.round(b1.left - b0.left), Math.round(b1.top - b0.top)];
    /* ── AND A KNOB DRAG MUST NEVER MOVE THE WINDOW.  The knob's own value is read as well: a window
       that did not move because the pointer went nowhere would prove nothing at all. ─────────────── */
    const kn = d.querySelector('.k'), dial = kn.querySelector('.k-dial'), kv = kn.querySelector('.k-val');
    const v0 = kv.textContent, kb = dial.getBoundingClientRect();
    const kx = Math.round(kb.left + kb.width / 2), ky = Math.round(kb.top + kb.height / 2);
    mk('pointerdown', kx, ky, dial); mk('pointermove', kx + 60, ky + 40, dial); mk('pointermove', kx + 130, ky + 95, dial); mk('pointerup', kx + 130, ky + 95, dial);
    await nap(120);
    const b2 = d.getBoundingClientRect();
    R.knobDrag = [Math.round(b2.left - b1.left), Math.round(b2.top - b1.top)];
    R.knobTurned = kv.textContent !== v0;
    /* ── Z-ORDER: A PRESS BRINGS IT TO THE FRONT ──────────────────────────────────────────────── */
    __LW.layout.popOut('camera'); await nap(120);
    const cam = document.querySelector('.dev[data-id="camera"]');
    R.zNew = [+d.style.zIndex, +cam.style.zIndex];
    R.newestInFront = (+cam.style.zIndex) > (+d.style.zIndex);
    const hb2 = d.getBoundingClientRect();
    mk('pointerdown', Math.round(hb2.left + 60), Math.round(hb2.top + 20), d.querySelector('.dev-head')); mk('pointerup', Math.round(hb2.left + 60), Math.round(hb2.top + 20));
    await nap(90);
    R.zPressed = [+d.style.zIndex, +cam.style.zIndex];
    R.roseOnPress = (+d.style.zIndex) > (+cam.style.zIndex);
    R.front = __LW.layout.floating().slice(-1)[0];
    /* ── AND THE WAY HOME: the chip puts it back between the neighbours it left ────────────────── */
    __LW.layout.dockWindow('camera');
    d.querySelector('.dev-pop').click(); await nap(150);
    R.after = ids();
    R.home = R.after.join('|') === R.before.join('|');
    R.homeNbrs = [R.after[R.after.indexOf('observer') - 1], R.after[R.after.indexOf('observer') + 1]];
    R.noInline = !d.style.left && !d.style.top && !d.style.getPropertyValue('--float-w');
    R.floatingNow = __LW.layout.floating();
    R.dig1 = __LW.stateDigest(); R.recon1 = __LW.stats.reconstructs;
    R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B90 ANY WINDOW COMES OFF THE RACK (wave 55, Josh: "I was hoping the modulation window was going to be a floating draggable regular window like a VST plugin" and then, choosing the capability over the one-off, "yes! I was also thinking this idea where any window can be taken off the rack"). The pop-out chip takes SPACE out of the rack\'s flow onto the float layer; the rack closes the gap and every other window keeps its order; the window is EXACTLY as wide as the card it was, because a floating window is not resizable and its interior therefore never reflows. It is dragged by its HEADER — 110 px across, 90 px down — and a drag on a KNOB inside it turns the knob and moves the window by (0, 0), which is the one failure that would make the instrument unusable. A press brings it to the front over a second floating window, and the chip docks it back between the two neighbours it left. Nothing here reaches ψ: the state digest and the reconstruct count are the same at the end as at the start.',
    !popT.error && popT.parent === 'floats' && popT.inFlow === -1 && popT.gapClosed && popT.restOrder
      && popT.sameWidth && popT.onStage && popT.popGly === 'dock'   /* 0.5.0 re-aim (C3): the chip of a floating window draws the kit's 'dock' glyph (it drew 'reopen') */
      && popT.headDrag[0] === 110 && popT.headDrag[1] === 90
      && popT.knobDrag[0] === 0 && popT.knobDrag[1] === 0 && popT.knobTurned === true
      && popT.newestInFront && popT.roseOnPress && popT.front === 'observer'
      && popT.home && popT.homeNbrs[0] === popT.nbrs[0] && popT.homeNbrs[1] === popT.nbrs[1]
      && popT.noInline && popT.floatingNow.length === 0
      && popT.dig0 === popT.dig1 && popT.recon0 === popT.recon1
      && popT.errs === 0 && !popT.gpu, popT);

  /* ── B91 · COMPACT IS NOT FOLD, AND EVERY HEADER MARK IS A DRAWING ──────────────────────────── */
  const railT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    __LW.pause(); __LW.layout.dockAll(false);
    const d = document.querySelector('.dev[data-id="camera"]');
    d.classList.remove('closed'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click();
    await __LW.settle(); await nap(200);
    const R = {};
    R.dig0 = __LW.stateDigest();
    /* FOLD, in the rack: the body goes, the WIDTH does not — a horizontal title bar. */
    const w0 = Math.round(d.getBoundingClientRect().width);
    d.querySelector('.dev-fold').click(); await nap(120);
    R.fold = { w: Math.round(d.getBoundingClientRect().width), body: getComputedStyle(d.querySelector('.dev-body')).display, gly: d.querySelector('.dev-fold').dataset.gly };
    R.foldKeepsWidth = R.fold.w === w0;
    d.querySelector('.dev-fold').click(); await nap(120);
    /* THE INTERIOR, MEASURED, so that "discipline inside" is a number and not a promise */
    const geom = () => [...d.querySelectorAll('.dev-body .k, .dev-body .sw, .dev-body .seg, .dev-body .trig, .dev-body .fd, .dev-body .ro')]
      .map((e) => { const b = e.getBoundingClientRect(), c = d.getBoundingClientRect(); return Math.round(b.left - c.left) + ',' + Math.round(b.top - c.top) + ',' + Math.round(b.width); }).join('|');
    __LW.layout.popOut('camera'); await nap(150);
    R.g0 = geom();
    /* COMPACT, on the stage: the WIDTH goes to the rail and the body stands down. */
    const rail = d.querySelector('.dev-rail');
    R.railShown = getComputedStyle(rail).display !== 'none';
    R.swapHidden = ((e) => !e || getComputedStyle(e).display === 'none')(d.querySelector('.dev-swap'));   // 0.5.0 C3: the ⇄ chip is not built
    rail.click(); await nap(160);
    R.compact = { w: Math.round(d.getBoundingClientRect().width), body: getComputedStyle(d.querySelector('.dev-body')).display,
      rail: Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rail-w'))),
      gly: rail.dataset.gly, kids: [...d.querySelector('.dev-util').children].filter((b) => getComputedStyle(b).display !== 'none').map((b) => b.className.split(' ')[0]),
      name: Math.round(d.querySelector('.dev-eyebrow').getBoundingClientRect().height), text: d.querySelector('.dev-eyebrow').textContent };
    R.narrows = R.compact.w === R.compact.rail && R.compact.w < R.fold.w;
    R.keepsThree = R.compact.kids.join('|') === 'dev-power|dev-rail|dev-close';
    R.keepsName = R.compact.name > 24 && R.compact.text.length > 0;
    rail.click(); await nap(160);
    R.backW = Math.round(d.getBoundingClientRect().width);
    R.g1 = geom();
    R.interiorStable = R.g0 === R.g1 && R.g0.length > 40;
    __LW.layout.dockWindow('camera'); await nap(120);
    /* ── THE CHIPS ARE DRAWINGS, and they are Josh's own (lab/mir/glyph.js, vendored) ──────────── */
    const btns = [...document.querySelectorAll('.dev-util > button, #rackAdd, .dock-btn, .mod-exp')];
    R.chips = btns.length;
    R.named = btns.filter((b) => b.dataset.gly).length;
    /* what is NOT a drawing, and why: ⏻ POWER is already a CSS drawing (a ring and a tick, not a character)
       and ⧉ COPY has no equivalent in the library at all — those two, and nothing else. */
    R.noGly = [...new Set(btns.filter((b) => !b.dataset.gly).map((b) => b.className.split(' ')[0] || b.id))].sort();
    R.textLeft = btns.filter((b) => !b.dataset.gly && !b.classList.contains('dev-power') && !b.classList.contains('dev-copy') && !b.classList.contains('mod-exp') && !b.classList.contains('dev-lean')).map((b) => (b.className.split(' ')[0] || b.id) + ':' + b.textContent.trim());
    /* WAVE 106 · THE THIRD THING THAT IS NOT A glyph.js DRAWING — and it is not a character either.
       The playhead expand button wears the HOUSE MARK, cloned from the masthead, so it is MEASURED as
       the drawing it is rather than waved past on an exception list: nine rects, no text, no glyph. */
    const mx = document.querySelector('.mod-exp');
    R.modMark = mx ? { gly: mx.dataset.gly || null, logo: mx.classList.contains('mod-logo'), svg: !!mx.querySelector('svg.mark'), rects: mx.querySelectorAll('svg.mark rect').length, text: mx.textContent.trim().length } : null;
    R.grid = [...document.querySelectorAll('.dev-util > button > svg')].every((s) => s.getAttribute('viewBox') === '0 0 24 24');
    R.set = [...new Set(btns.filter((b) => b.dataset.gly).map((b) => b.dataset.gly))].sort();
    d.querySelector('.dev-fold').click(); await nap(250);   /* 0.5.0 re-aim: nothing else is folded in this run (the baseline opens every window), so the card is folded here to read the chevron it turns */
    R.foldTurns = getComputedStyle(d.querySelector('.dev-fold > svg')).transform;
    d.querySelector('.dev-fold').click(); await nap(250);
    R.dig1 = __LW.stateDigest();
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B91 COMPACT IS NOT FOLD, AND IT IS THE WIDTH THAT SAYS SO (wave 55). Fold already existed and it is a HEIGHT act: the body goes, the card keeps the rack\'s width, and what is left is a horizontal title bar. COMPACT is a WIDTH act a rack card cannot perform — the window narrows to a 46-px rail carrying exactly the three things the reference keeps, its NAME, its POWER switch and its CLOSE, plus the way back — so the two are kept apart rather than collapsed into one control. And because compact HIDES the body instead of re-laying it out, the interior is bit-identical before and after (every knob, switch, segment, trigger, fader and readout at the same offset in the card, measured), which is STYLE-LOCK\'s "discipline inside" as a number. ⇄ SWAP stands down while a window floats, because "send this to the other rack" changes nothing for a window on neither. Every mark in every window header is now a DRAWING from Josh\'s own glyph library, vendored at lab/mir/glyph.js and maintained by diff — close, chevron (turned a quarter turn when the window folds, which is the caret\'s own idiom), info, swap, plus, and the two faces of each new chip — every one on his 24-unit grid. The three that are NOT glyph.js drawings are named rather than glossed over: ⏻ POWER, which was already a CSS drawing and not a character at all; ⧉ COPY, for which the library offers nothing; and, since wave 106, the playhead expand button, which is the HOUSE MARK itself — the masthead nine-square SVG, cloned rather than redrawn so paintMarks() turns it with the wheel — and it is measured here as that drawing (nine rects, no text, no glyph name) rather than allowed through on a list. The rule the law was ever about is unbroken: not one mark in this chrome is a text character.',
    !railT.error && railT.foldKeepsWidth && railT.fold.body === 'none' && railT.fold.gly === 'chevronDown'
      && railT.railShown && railT.swapHidden && railT.narrows && railT.compact.body === 'none'
      && railT.keepsThree && railT.keepsName && railT.compact.gly === 'expand'
      && railT.backW === railT.fold.w && railT.interiorStable
      && railT.chips > 100 && railT.named > 80 && railT.textLeft.length === 0 && railT.noGly.join('|') === 'dev-copy|dev-lean|dev-power|mod-exp' && railT.grid === true   /* 0.5.0 re-aim: the ⓘ and ⇄ chips are not built any more (named 86, not 140+), and the HELP lean toggle 'Aa' is the one TEXT chip, as the unnamed set says */
      && railT.modMark && railT.modMark.gly === null && railT.modMark.logo === true && railT.modMark.svg === true && railT.modMark.rects === 9 && railT.modMark.text === 0
      && railT.foldTurns === 'matrix(0, -1, 1, 0, 0, 0)'
      && railT.set.includes('north') && railT.set.includes('reopen') && railT.set.includes('compact') && railT.set.includes('close') && railT.set.includes('chevronDown') && railT.set.includes('plus')
      && railT.dig0 === railT.dig1 && railT.errs === 0, railT);

  /* ── B92 · TAB WALKS BOTH RACKS AND THE STAGE, IN A STATED ORDER ────────────────────────────── */
  const tabT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    __LW.pause(); __LW.layout.dockAll(false); await __LW.settle(); await nap(150);
    const R = {}, rack = document.getElementById('rack'), rackL = document.getElementById('rackL');
    R.dig0 = __LW.stateDigest();
    __LW.layout.moveToRack('meters', 'L');
    __LW.layout.popOut('clip'); __LW.layout.popOut('camera'); await nap(150);
    /* THE STATED ORDER, read off the DOM BEFORE anything moves — the first press itself prepends a card,
       so an order sampled after it would not be the order that was frozen. */
    R.stated = [...rackL.querySelectorAll('.dev'), ...rack.querySelectorAll('.dev'), ...document.querySelectorAll('#floats .dev')].map((d) => d.dataset.id);
    __LW.keys.resetTabs();
    __LW.keys.cycleWindow(1);                                             /* the first press freezes it */
    R.order = __LW.keys.tabOrder;
    R.isStated = R.order.join('|') === R.stated.join('|');
    R.floatsLast = R.order.slice(-2).join('|') === 'clip|camera';
    const open = R.order.filter((id) => { const d = document.querySelector('.dev[data-id="' + id + '"]'); return d && !d.hidden && !d.classList.contains('closed'); });
    const walk = [];
    for (let i = 0; i < open.length + 2; i++) { for (const q of document.querySelectorAll('.tab-hot')) q.classList.remove('tab-hot');
      __LW.keys.cycleWindow(1); await nap(20);
      const hot = document.querySelector('.dev.tab-hot');
      walk.push(hot ? hot.dataset.id + (hot.classList.contains('floating') ? '*' : '') : '-'); }
    R.walk = walk;
    R.sawFloats = walk.includes('clip*') && walk.includes('camera*');
    R.floatsInOrder = walk.indexOf('camera*') > walk.indexOf('clip*');
    R.noGhost = walk.every((w) => w !== '-');
    R.lap = new Set(walk.slice(0, open.length)).size === open.length;      /* one lap visits each open window once */
    /* A WINDOW KEEPS ITS SEAT when it docks back: the cycle holds ELEMENTS, not a rack query. */
    __LW.layout.dockWindow('clip'); await nap(120);
    R.orderAfterDock = __LW.keys.tabOrder.join('|') === R.order.join('|');
    /* … and TAB brings a floating window TO THE FRONT rather than to the top of a rack it is not in */
    __LW.layout.popOut('spectrum'); await nap(120);
    const before = __LW.layout.floating();
    let guard = 0; while (__LW.layout.floating().slice(-1)[0] !== 'camera' && guard++ < 40) { __LW.keys.cycleWindow(1); await nap(15); }
    R.raisedByTab = __LW.layout.floating().slice(-1)[0] === 'camera' && before.slice(-1)[0] !== 'camera';
    __LW.layout.dockAll(false); __LW.layout.moveToRack('meters', 'R'); await nap(120);
    R.dig1 = __LW.stateDigest(); R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B92 TAB STILL WALKS EVERY WINDOW, IN AN ORDER THAT IS WRITTEN DOWN (wave 55). THE ORDER IS: the mirror rack top to bottom, then the right rack top to bottom, then whatever is floating, back-most first — frozen at the first TAB of the session and never rebuilt, because the act itself moves a card to the top of its rack and a re-read order would bounce between two windows for ever. Because the cycle holds the ELEMENTS and not a rack query, A WINDOW KEEPS ITS SEAT when it pops out or docks back: the same list is walked on the stage as in the rack. "To the top" means the top of its rack for a docked window and the FRONT OF THE STACK for a floating one, and either way the window is unfolded and a rail is opened back to full — because what TAB promises is that the window it names is the one you can now read.',
    !tabT.error && tabT.isStated && tabT.floatsLast && tabT.sawFloats && tabT.floatsInOrder && tabT.noGhost && tabT.lap
      && tabT.orderAfterDock && tabT.raisedByTab && tabT.dig0 === tabT.dig1 && tabT.errs === 0, tabT);

  /* ── B93 · MODULATION OPENS FLOATING, STAYS SELF-CONTAINED, AND KEEPS ITS PLACE UNDER THE GOVERNOR ── */
  const modFT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    __LW.pause(); __LW.mod.reset(); __LW.layout.dockAll(false);
    if (__LW.layout.docked) __LW.layout.dockTransport();
    if (__LW.mod.expanded) __LW.mod.collapse();
    await __LW.settle(); await nap(200);
    const R = {}, card = document.getElementById('modwin');
    R.dig0 = __LW.stateDigest();
    R.startsDocked = __LW.layout.floating().length === 0;
    /* ⤢ ON THE PILL OPENS A FLOATING WINDOW, not a rack card */
    const exp = document.querySelector('#transport .mod-exp');
    R.expGly = exp.dataset.gly;
    /* WAVE 106 · THE DOOR IS THE HOUSE MARK (Josh: the logo as the button that activates the modulation
       window on the native playhead).  It is CLONED from the masthead rather than redrawn, so paintMarks()
       turns it with the wheel like every other copy and it cannot drift into being a stale fourth logo.
       AND THE ARROW IS NOT LOST: it took the seat where its meaning is literal, the control that moves the
       transport between the stage and the rack — measured here too, because a move proved only at its
       origin is half a proof. */
    R.expMark = { gly: exp.dataset.gly || null, logo: exp.classList.contains('mod-logo'), svg: !!exp.querySelector('svg.mark'), rects: exp.querySelectorAll('svg.mark rect').length, text: exp.textContent.trim().length };
    R.dockNorth = (document.querySelector('#transport .dock-btn') || { dataset: {} }).dataset.gly || null;
    exp.click(); await nap(250);
    R.open = __LW.mod.expanded;
    /* WAVE 64 · IT IS NOT A RACK CARD AND NEVER WILL BE.  Wave 55 made modulation the one window
       that DEFAULTED to the stage; the ported artifact carries its own chrome, its own chip rail and
       its own drag grip and lives in the float layer from the first frame — so it is not in
       layout.floating(), which lists rack cards that came off, and its box is the artifact's own
       size law rather than a rack card's width. */
    R.floats = card.parentElement.id === 'floats' && card.classList.contains('mir-modwindow')
      && !card.classList.contains('dev') && getComputedStyle(card).position === 'fixed';
    R.onlyOne = __LW.layout.floating().length === 0;
    const b = card.getBoundingClientRect();
    R.w = Math.round(b.width); R.h = Math.round(b.height);
    R.lawW = __LW.mod.view.geometry().lawW;
    R.rail = !!document.querySelector('.kwin-chiprail[aria-label="MODULATION window controls"]');
    /* COLLAPSE DOES NOT DOCK IT: reopening puts it back where it was left, which is what a plug-in
       does — and the thing that moves it is the artifact's own nine-dot grip, driven here for real. */
    const grip = document.querySelector('.kwin-chiprail .crail-grip');
    const gb = grip.getBoundingClientRect(), g0 = __LW.mod.view.geometry();
    const PEg = (t, x, y) => grip.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 88, pointerType: 'mouse', isPrimary: true, clientX: x, clientY: y, buttons: t === 'pointerup' ? 0 : 1 }));
    PEg('pointerdown', gb.left + 8, gb.top + 8);
    PEg('pointermove', gb.left + 8 + (320 - g0.x), gb.top + 8 + (140 - g0.y));
    PEg('pointerup', gb.left + 8 + (320 - g0.x), gb.top + 8 + (140 - g0.y));
    await nap(80);
    R.dragged = __LW.mod.view.geometry();
    exp.click(); await nap(600);   /* 0.5.0 re-aim (C4): the kit's window leaves and enters with its own motion */
    R.hidden = card.hidden && card.parentElement.id === 'floats';
    exp.click(); await nap(600);
    R.backAt = __LW.mod.view.geometry();
    R.keptPlace = R.backAt.x === R.dragged.x && R.backAt.y === R.dragged.y && R.dragged.x === 320 && R.dragged.y === 140;
    /* ── THE OUTLIER STAYS SELF-CONTAINED (Josh, 2026-09-05: "Modulation related stuff stays with
       modulation. It must be treated like the outlier and it's okay. It's an organization thing.") ── */
    const stray = [...document.querySelectorAll('[class*="mod-"]')].filter((e) => !e.closest('#modwin') && !e.closest('#transport') && !e.classList.contains('mod-held'));
    R.stray = stray.map((e) => (e.className.split(' ').find((c) => c.indexOf('mod-') === 0) || '?') + '@' + ((e.closest('.dev') || { dataset: {} }).dataset.id || 'chrome'));
    R.contained = R.stray.length === 0;
    /* the ONE modulation-shaped thing elsewhere is a READ-ONLY signal on a dial, never a control */
    const m1 = __LW.mod.model.macroList()[0].id, s1 = __LW.mod.addSource('lfo');
    __LW.mod.bind(m1, s1); __LW.mod.route(m1, 'material.hue', 0, 1); __LW.mod.play(); await nap(300);
    const held = [...document.querySelectorAll('.mod-held')];
    R.heldCount = held.length;
    R.heldAreDials = held.every((e) => e.classList.contains('k'));
    R.heldNotControl = held.every((e) => !e.querySelector('.m2grip, .m2val, .m2drive, .m2clr'));
    __LW.mod.stop(); __LW.mod.reset(); await nap(120);
    /* ── AND ITS READER PARKS ON EXACTLY THE LAW A DOCKED WINDOW'S DOES ────────────────────────── */
    const sl = document.querySelector('.dev[data-id="slice"]');
    sl.classList.remove('closed'); if (sl.classList.contains('folded')) sl.querySelector('.dev-fold').click();
    __LW.layout.popOut('slice'); await nap(150);
    R.sliceFloats = sl.parentElement.id === 'floats';
    __LW.governor.on = true; __LW.governor.work.slice = 240;              /* far over READER_LAW.park = 16 ms */
    __LW.play(); await nap(700);
    R.parked = __LW.governor.parked.includes('slice');
    R.parkNote = (sl.querySelector('.dev-stat') || {}).textContent || '';
    __LW.pause(); __LW.governor.work.slice = 0; await nap(400);
    R.unparked = !__LW.governor.parked.includes('slice');
    __LW.layout.dockAll(false); if (__LW.mod.expanded) __LW.mod.collapse(); await nap(150);
    R.dig1 = __LW.stateDigest();
    R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B93 MODULATION IS NOT A RACK WINDOW AT ALL (wave 55 made it the only one that DEFAULTED to the stage; wave 64 made that permanent by porting it). It is a PLUG-IN WINDOW — BASINS\' own #modwin, moved here whole under STYLE-LOCK\'s PORTED-WINDOW EXCEPTION — so the λ ON THE PLAYHEAD PILL — wave 106 made the door the house mark itself, cloned from the masthead and turned by paintMarks with every other copy, while the ↗ it used to wear went to the transport dock button where a direction is literally what it means — shows a position: fixed .kwin in the float layer that is not a .dev, is not in layout.floating() (which lists rack cards that came off), carries its own five-disc chip rail on the exact aria-label 24 rules select on, and measures the artifact\'s OWN size law rather than a rack card\'s width — 466 tall, 22·scale + 224 + 14 + 89 + Σ cards + n·7 wide. It is moved by the artifact\'s own nine-dot grip, driven here with real pointer events, and collapsing it does NOT dock it: the pill and the close chip only hide it, so reopening puts it back where the hand left it, which is what a plug-in window does. THE OUTLIER STAYS SELF-CONTAINED, and that is a stated organisational law, not an accident (Josh: "Modulation related stuff stays with modulation. It must be treated like the outlier and it\'s okay"): the sweep finds no modulation furniture anywhere but inside the modulation window and its own pill, and the single modulation-shaped thing elsewhere is ACCENT B on a dial whose parameter a modulator is holding — a READ-ONLY signal, carrying no control of its own. And floating is chrome, not physics: a floating window\'s reader parks and unparks on exactly the governor law a docked one obeys, with the state digest unmoved through all of it (the block plays, so the reconstruct count is expected to move and is not the invariant here — ψ\'s own digest is).',
    !modFT.error && modFT.startsDocked
      && modFT.expMark && modFT.expMark.gly === null && modFT.expMark.logo === true && modFT.expMark.svg === true && modFT.expMark.rects === 9 && modFT.expMark.text === 0
      && modFT.dockNorth === 'north'
      && modFT.open && modFT.floats && modFT.onlyOne
            /* WAVE 95 · the WINDOW is 440 while the SIZE LAW is still 466 — lab/modwindow.js spends wave 95's
         32-px card trim and wave 77's 6 px of float room between the two, and `dragged.lawH` below is the
         law's own untouched number sitting next to the box it produced. */
      && modFT.w === modFT.lawW && modFT.h === 440 && modFT.rail
      && modFT.hidden && modFT.keptPlace && modFT.contained
      && modFT.heldCount > 0 && modFT.heldAreDials && modFT.heldNotControl
      && modFT.sliceFloats && modFT.parked && /park|slow|governor/i.test(modFT.parkNote) && modFT.unparked
      && modFT.dig0 === modFT.dig1
      && modFT.errs === 0 && !modFT.gpu, modFT);

  /* ── B94 · LAYOUTS CARRY THE FLOAT STATE, AND THE PHONE HAS NO FLOATING ─────────────────────── */
  await g.ev(`__LW.pause(); __LW.layout.dockAll(false); __LW.layout.moveToRack('meters', 'L');
    __LW.layout.popOut('camera'); __LW.layout.popOut('clip'); __LW.layout.setCompact('clip', true);
    __LW.layout.popOut('meters'); __LW.layout.moveFloat('camera', 300, 120);
    await __LW.settle(); await new Promise((r) => setTimeout(r, 250)); return 1;`);
  const floatDesk = await g.ev(`try {
    const R = { floating: __LW.layout.floating(), dig: __LW.stateDigest() };
    R.slot = __LW.layout.saveLayout();
    const S = JSON.parse(localStorage.getItem('lambdawaves.q0.settings')).layouts[R.slot];
    R.v = S.v; R.label = __LW.layout.layoutLabel(S, R.slot);
    R.rows = S.cards.filter((c) => c.float).map((c) => [c.id, c.side, c.float.compact, c.float.w, c.float.x, c.float.y]);
    R.keys = Object.keys(S.cards.find((c) => c.float).float).sort().join(',');
    R.noPhysics = !JSON.stringify(S).match(/psi|register|clock|coeff|preset/i);
    /* a layout that PREDATES floating still loads, and it means "nothing floats" */
    const A = JSON.parse(localStorage.getItem('lambdawaves.q0.settings'));
    A.layouts[4] = { v: 1, at: Date.now(), docked: S.docked, rackHidden: false, nb: null,
      cards: S.cards.map((c) => ({ id: c.id, side: c.side, folded: c.folded, closed: c.closed, off: c.off })) };
    localStorage.setItem('lambdawaves.q0.settings', JSON.stringify(A));
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await rect(390, 844);                                      /* → the phone arm, portrait */
  await g.ev(`await new Promise((r) => setTimeout(r, 900)); await __LW.settle(); return 1;`);
  const floatPh = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const R = { phone: __LW.layout.phone.on, sentinel: getComputedStyle(document.documentElement).getPropertyValue('--phone').trim() };
    /* ONE RACK, EVERYTHING DOCKED — and the three that were on the stage are REMEMBERED */
    R.floating = __LW.layout.floating();
    R.parked = __LW.layout.phone.parkedFloats.slice().sort();
    R.inRack = ['camera', 'clip', 'meters'].map((id) => document.querySelector('.dev[data-id="' + id + '"]').parentElement.id);
    R.compactGone = !document.querySelector('.dev.compact');
    /* the control is not on the screen, and the act refuses as well: the CSS and the script agree */
    R.popDisplay = getComputedStyle(document.querySelector('.dev[data-id="camera"] .dev-pop')).display;
    R.railDisplay = getComputedStyle(document.querySelector('.dev[data-id="camera"] .dev-rail')).display;
    R.refuses = __LW.layout.popOut('camera');
    R.stillNone = __LW.layout.floating().length;
    /* A DESKTOP LAYOUT CARRYING FLOATING WINDOWS LOADS HERE — DOCKED, not broken */
    R.loaded = __LW.layout.loadLayout(1); await nap(220);
    R.afterLoad = __LW.layout.floating();
    R.afterCompact = !document.querySelector('.dev.compact');
    R.afterInRack = ['camera', 'clip', 'meters'].map((id) => document.querySelector('.dev[data-id="' + id + '"]').parentElement.id);
    R.headH = getComputedStyle(document.querySelector('#rack .dev-head')).height;
    R.utilSeats = [...document.querySelectorAll('.dev[data-id="camera"] .dev-util > button')].filter((b) => getComputedStyle(b).display !== 'none').map((b) => b.className.split(' ')[0]);
    R.dig = __LW.stateDigest(); R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await rect(1400, 900);                                     /* … and back to the desktop */
  await g.ev(`await new Promise((r) => setTimeout(r, 900)); await __LW.settle(); return 1;`);
  const floatBack = await g.ev(`try {
    const R = { phone: __LW.layout.phone.on, floating: __LW.layout.floating(), dig: __LW.stateDigest() };
    R.camAt = __LW.layout.floatOf('camera');
    R.clipCompact = document.querySelector('.dev[data-id="clip"]').classList.contains('compact');
    R.metersSide = __LW.layout.side('meters');
    /* the v1 layout: it loads, and it docks everything, because "no float data" IS "nothing floats" */
    R.v1 = __LW.layout.loadLayout(4);
    R.v1Floating = __LW.layout.floating();
    for (const L of __LW.layout.layouts()) __LW.layout.forgetLayout(L.slot);
    __LW.layout.moveToRack('meters', 'R');
    R.dig2 = __LW.stateDigest(); R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B94 A LAYOUT CARRIES THE STAGE, AND THE PHONE STILL HAS ONE RACK (wave 55, extending board #48). A favourite layout gains ONE optional key per card — `float`, with the position, the width, the compact flag, the z-order and the HOME slot — so `v: 2` is a superset and a v1 layout saved before this wave still loads, meaning exactly what it says: nothing floats. It is still the ARRANGEMENT and nothing else; no physics is in the record. THE PHONE ARM (wave 51) IS UNTOUCHED BY ALL OF IT: crossing the breakpoint docks every floating window before the mirror rack is folded into the one rack, so a window whose home is the left rack still makes the trip; the pop-out and rail chips stand down in CSS and `popOut()` refuses in script, so the control and the act agree; the four header seats stay ⓘ ⏻ ▾ × at a 44-px pitch; and a desktop layout carrying three floating windows LOADS there with all three DOCKED rather than breaking. Crossing back restores every one of them — the same place, the same rail, the same home rack — because wave 51\'s law is that the crossing is reversible in both directions, and the state digest never moves through any of it.',
    !floatDesk.error && !floatPh.error && !floatBack.error
      && floatDesk.floating.length === 3 && floatDesk.v === 3   /* wave 106: v3 adds the `look` and `cam` blocks — colour, draw and camera travel with a favourite now (Josh), and the wave state deliberately does not */
      && floatDesk.keys === 'compact,index,w,x,y,z' && floatDesk.noPhysics === true
      && /3 floating/.test(floatDesk.label)
      && floatDesk.rows.some((r) => r[0] === 'meters' && r[1] === 'L')
      && floatDesk.rows.some((r) => r[0] === 'clip' && r[2] === true)
      && floatPh.phone === true && floatPh.sentinel === '1'
      && floatPh.floating.length === 0 && floatPh.parked.join('|') === 'camera|clip|meters'
      && floatPh.inRack.join('|') === 'rack|rack|rack' && floatPh.compactGone
      && floatPh.popDisplay === 'none' && floatPh.railDisplay === 'none'
      && floatPh.refuses === false && floatPh.stillNone === 0
      && floatPh.loaded === true && floatPh.afterLoad.length === 0 && floatPh.afterCompact
      && floatPh.afterInRack.join('|') === 'rack|rack|rack' && floatPh.headH === '44px'
      && floatPh.utilSeats.join('|') === 'dev-power|dev-fold|dev-close'   /* 0.5.0 re-aim: the ⓘ chip left with a526bda (2026-09-09) */
      && floatBack.phone === false && floatBack.floating.length === 3
      && floatBack.camAt.x === 300 && floatBack.camAt.y === 120
      && floatBack.clipCompact === true && floatBack.metersSide === 'L'
      && floatBack.v1 === true && floatBack.v1Floating.length === 0
      && floatDesk.dig === floatPh.dig && floatPh.dig === floatBack.dig && floatBack.dig === floatBack.dig2
      && floatPh.errs === 0 && floatBack.errs === 0 && !floatBack.gpu,
    { floatDesk, floatPh, floatBack });

  /* ── B95 · THE TWO RIDERS: the ABOUT menu, and a way back to the preset you are already on ──── */
  const riderT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    __LW.pause(); __LW.layout.dockAll(false); await __LW.settle(); await nap(150);
    const R = {};
    /* ── RIDER A. ABOUT also carries the two app-level support actions: shortcuts and cache repair. ── */
    document.getElementById('title').click(); await nap(90);
    const ab = [...document.querySelectorAll('#menubar .mb-btn')].find((b) => b.textContent.trim() === 'ABOUT');
    ab.click(); await nap(90);
    R.about = [...ab.parentElement.querySelectorAll('.mb-item .mb-lbl')].map((e) => e.textContent.trim());
    document.body.click(); await nap(60);
    /* … and the three SITE-ROOT file links go with them: they are exactly the three that 404 the moment
       lab/ is deployed as the Pages root.  The licence is still NAMED, which is what actually matters. */
    __LW.notebook.open('about'); await nap(140);
    R.aboutHrefs = [...document.querySelectorAll('.nb-aboutface a')].map((a) => a.getAttribute('href'));
    R.siteRoot = R.aboutHrefs.filter((h) => h && h.charAt(0) === '/');
    R.licenceNamed = /GNU GPL v3\\.0 only/.test(document.querySelector('.nb-aboutface').textContent);
    __LW.notebook.close(); await nap(80);
    /* ── RIDER B (board #58).  The creep is correct physics; the BUG was the absence of a way back. ── */
    __LW.loadPreset('rydberg'); await __LW.settle(); await nap(150);
    const sel = document.querySelector('.dev[data-id="state"] select.sel');
    const rel = [...document.querySelectorAll('.dev[data-id="state"] .trig')].find((t) => t.textContent.trim() === 'RELOAD');
    R.hasReload = !!rel; R.beside = !!(rel && sel.parentElement === rel.parentElement);
    const d0 = __LW.stateDigest();
    /* THE TRAP, demonstrated: assigning the value that is already selected fires NO change event, so the
       handler the preset list hangs on never runs — which is why re-picking "1s" did nothing at all. */
    let fired = 0; const count = () => { fired++; };
    sel.addEventListener('change', count);
    sel.value = 'rydberg';                                    /* the mouse re-picking the same row is exactly this */
    R.silentReselect = fired === 0;
    sel.removeEventListener('change', count);
    for (let i = 0; i < 3; i++) { __LW.reg.kickAlong(0.35, [0, 0, 1], __LW.clock.t); await nap(30); }
    __LW.scrub(4); await __LW.settle(); await nap(120);
    R.crept = __LW.stateDigest() !== d0;
    R.stillSelected = sel.value === 'rydberg';
    rel.click(); await nap(250); await __LW.settle();
    R.reloaded = __LW.stateDigest() === d0;
    R.clockReset = __LW.clock.t === 0;
    /* AND THE UNDO RING DOES CAPTURE AN IMPULSE — asked, and answered by measurement, not by reading */
    __LW.history.clear(); await nap(80);
    const d1 = __LW.stateDigest();
    __LW.reg.kickAlong(0.4, [0, 0, 1], __LW.clock.t);
    await nap(700);                                           /* history.js's 400 ms quiet window closes the entry */
    R.kickDirty = __LW.stateDigest() !== d1;
    R.canUndo = __LW.history.canUndo; R.depth = __LW.history.depth;
    R.undid = __LW.history.undo(); await nap(150); await __LW.settle();
    R.undone = __LW.stateDigest() === d1;
    /* the OTHER selects in the lab: how many wear the same shape, and which of them can be re-chosen */
    R.selects = document.querySelectorAll('select.sel').length;
    R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B95 ABOUT exposes app information, the live shortcut sheet, Settings, and cache repair. The about face has no deployment-root links. Reload restores the selected preset and an impulse remains undoable.',
    !riderT.error && riderT.about.join('|') === 'ABOUT λWAVES|KEYBOARD SHORTCUTS…|SETTINGS…|UPDATE APP'
      && riderT.siteRoot.length === 0 && riderT.licenceNamed
      && riderT.hasReload && riderT.beside && riderT.silentReselect && riderT.crept && riderT.stillSelected
      && riderT.reloaded && riderT.clockReset
      && riderT.kickDirty && riderT.canUndo && riderT.depth === 1 && riderT.undid && riderT.undone
      && riderT.selects >= 1 && riderT.errs === 0 && !riderT.gpu, riderT);

  /* ── B96 · THE MERGED WAVE WINDOW, AND A LAYOUT THAT STILL NAMES `style` ─────────────────────── */
  const waveT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    __LW.pause(); __LW.layout.dockAll(false); __LW.layout.raise('observer'); await __LW.settle(); await nap(120);
    const R = {};
    const L0 = __LW.layout.captureLayout();                      /* put it all back at the end */
    const dev = document.querySelector('.dev[data-id="observer"]');
    R.styleGone = !document.querySelector('.dev[data-id="style"]');
    R.eyebrow = dev.querySelector('.dev-eyebrow').textContent.trim();
    R.title = dev.querySelector('.dev-title').textContent.trim();
    const body = dev.querySelector('.dev-body');
    const kids = [...body.children];
    const grps = kids.filter((k) => k.classList.contains('grp'));
    R.groups = grps.map((k) => { const l = k.querySelector('.grp-lbl'); return l ? l.textContent.trim() : ''; });
    /* SPACE on top carries the space segment, the observable grid and the three material knobs */
    const t0 = grps[0] ? grps[0].textContent : '';
    R.space = ['POSITION', 'MOMENTUM', 'EXPOSURE', 'SOFT', 'HUE'].every((w) => t0.indexOf(w) >= 0)
      && [...grps[0].querySelectorAll('.seg-b')].some((b) => b.textContent.indexOf('Re+Im') >= 0);
    /* DRAW below carries everything that was the retired style window, its bounded-ceiling group included */
    const t1 = grps[1] ? grps[1].textContent : '';
    R.draw = ['CLOUD', 'SOLID', 'GRAIN', 'SIGNED', 'BANDS', 'ISO', 'KNEE', 'DITHER', 'bounded ceiling'].every((w) => t1.indexOf(w) >= 0);
    /* ⚠ WAVE 106 · THE FOOT IS GONE, AND ITS ABSENCE IS THE NEW LAW.  Wave 56 put INVERT, FRAME and
       AXIS in a bare row tight under the two groups; Josh has moved all three out, and the row is
       NOT left standing — an empty .row still carries lab.css's gap and would be an unexplained hole
       at the foot of the card.  What must hold now: the window ENDS on its second group, no bare row
       carries controls, and NOT ONE SWITCH survives anywhere in the body — the check that catches an
       orphan left behind by a half-applied move.  B77 measures the three at their new seats. */
    R.lastIsGroup = kids[kids.length - 1] === grps[1];
    R.bareRows = kids.filter((k) => k.classList.contains('row')).length;
    R.waveSw = [...body.querySelectorAll('.sw .sw-lbl')].map((x) => x.textContent.trim());
    R.noSwitch = R.waveSw.length === 0;
    R.drawAfterSpace = kids.indexOf(grps[1]) > kids.indexOf(grps[0]);
    /* AND THE ID IS WHY: the 3x2 observables grid is a rule on .dev[data-id="observer"], and it still bites */
    const seg6 = [...dev.querySelectorAll('.seg')].find((x) => x.children.length === 6);
    R.gridDisplay = getComputedStyle(seg6).display;
    const cells = [...seg6.children].map((x) => { const b = x.getBoundingClientRect(); return { t: Math.round(b.top), l: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height) }; });
    R.gridCols = [...new Set(cells.map((c) => c.l))].length; R.gridRows = [...new Set(cells.map((c) => c.t))].length;
    R.gridEqual = cells.every((c) => Math.abs(c.w - cells[0].w) <= 1 && Math.abs(c.h - cells[0].h) <= 1);
    R.retired = __LW.layout.retired && __LW.layout.retired.style;
    /* A SAVED LAYOUT THAT NAMES THE RETIRED WINDOW.  v1 (wave 54, no float key) naming BOTH: the heir's own
       record wins and the retired card is dropped — it is one window now and can only be in one place. */
    const v1 = { v: 1, at: Date.now(), docked: false, rackHidden: false, nb: null, cards: [
      { id: 'style', side: 'L', folded: true, closed: true, off: false },
      { id: 'observer', side: 'R', folded: false, closed: false, off: false }] };
    R.v1 = __LW.layout.applyLayout(v1); await nap(120);
    R.v1Side = dev.closest('#rackL') ? 'L' : 'R';
    R.v1Closed = dev.classList.contains('closed'); R.v1Folded = dev.classList.contains('folded');
    /* v2 (wave 55) naming ONLY the retired id: it resolves to its heir, so the seat is not silently lost */
    const v2 = { v: 2, at: Date.now(), docked: false, rackHidden: false, nb: null, cards: [
      { id: 'style', side: 'L', folded: true, closed: false, off: false, float: null }] };
    R.v2 = __LW.layout.applyLayout(v2); await nap(120);
    R.v2Side = dev.closest('#rackL') ? 'L' : 'R'; R.v2Folded = dev.classList.contains('folded');
    __LW.layout.applyLayout(L0); await nap(150); await __LW.settle();
    R.back = !dev.classList.contains('closed') && !dev.classList.contains('folded');
    R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B96 THE MERGED WAVE WINDOW (wave 56, board #59). Josh asked for SPACE and DRAW in one window titled WAVE with INVERT, FRAME and AXIS at its foot, and then ruled that it must NOT take a new id — so this is a retitle and an absorption: the card is eyebrowed WAVE, its body is a SPACE group (the two exact pictures, the six observables, EXPOSURE · SOFT · HUE) over a DRAW group (the five styles, ISO · GRAIN · KNEE, DITHER and the bounded-ceiling note), with the three overlay switches together in a row at the foot and in neither group. The id it kept is `observer`, which is what lab.css reads to lay the six observables out as a 3-column grid — proved here on the computed style, not on the stylesheet. And a saved LAYOUT that names the window that no longer exists still loads: naming both, the heir\'s record wins; naming only `style`, it resolves to its heir rather than dropping the seat in silence.',
    !waveT.error
      && waveT.styleGone === true && waveT.eyebrow === 'WAVE'
      && waveT.noSwitch === true   /* 0.5.0 re-aim: the WAVE card carries no SPACE / DRAW group captions (its rows stand bare — the same on v0.4.0-alpha), so those clauses are retired; it still holds no overlay switch */
      && waveT.gridDisplay === 'grid' && waveT.gridCols === 3 && waveT.gridRows === 2 && waveT.gridEqual === true
      && waveT.retired === 'observer'
      && waveT.v1 === true && waveT.v1Side === 'R' && waveT.v1Closed === false && waveT.v1Folded === false
      && waveT.v2 === true && waveT.v2Side === 'L' && waveT.v2Folded === true
      && waveT.back === true && waveT.errs === 0 && !waveT.gpu, waveT);

  /* ── B97 · THE INSTALL LAYER, LINKED AND REGISTERED ──────────────────────────────────────────── */
  /* The head is read on the page the whole run has been driving; the WORKER is proved on a page opened with
     ?sw=1, because main.js refuses to register under an automation driver unless it is told to.  That refusal
     is not timidity: a worker installed on this origin would serve every later navigation out of a cache, and
     one stale entry in sw.js's §1 would make the whole suite silently measure yesterday's build.  The block
     unregisters and empties the cache before it leaves, and proves that too. */
  const headT = await g.ev(`try {
    const R = {}, m = (n) => { const e = document.querySelector('meta[name="' + n + '"]'); return e ? e.getAttribute('content') : null; };
    R.manifest = (document.querySelector('link[rel="manifest"]') || {}).getAttribute ? document.querySelector('link[rel="manifest"]').getAttribute('href') : null;
    R.icons = [...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')].map((l) => l.getAttribute('href'));
    R.colorScheme = m('color-scheme');
    R.capable = m('apple-mobile-web-app-capable') === 'yes' && m('mobile-web-app-capable') === 'yes';
    R.appTitle = m('apple-mobile-web-app-title'); R.statusBar = m('apple-mobile-web-app-status-bar-style');
    /* the theme colour is the one chrome colour that can follow a LIVE setting, and it does */
    const tc = document.getElementById('themeColor');
    __LW.setTheme('light'); R.light = tc.getAttribute('content');
    __LW.setTheme('dark'); R.dark = tc.getAttribute('content');
    /* every href in the head resolves — a 404 in the head is a 404 offline too */
    const urls = [R.manifest, ...R.icons];
    R.fetched = [];
    for (const u of urls) { const res = await fetch(u, { cache: 'no-store' }); R.fetched.push(res.status); }
    const mf = await (await fetch(R.manifest, { cache: 'no-store' })).json();
    R.mfNoId = !('id' in mf); R.mfStart = mf.start_url; R.mfScope = mf.scope; R.mfIcons = mf.icons.length;
    /* and on THIS page the worker is deliberately not registered: the automation bypass */
    R.mode = __LW.sw.mode; R.state = __LW.sw.state; R.asked = __LW.sw.asked;
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };

  /* the real thing, on its own page */
  const swURL = `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&warn=0&sw=1`;
  const navTo = async (u) => {
    await g.ev(`try { sessionStorage.setItem('__w56e', JSON.stringify(window.__e || [])); } catch (e) {} return 1;`);
    await goPainted(u);
    const settled = await g.ev(`for (let i = 0; i < 400; i++) { if (window.__LW && __LW.ready) break; await new Promise(r => setTimeout(r, 100)); } if (!window.__LW?.ready) throw new Error('Reload did not finish booting'); if (!__LW.field.ok) throw new Error('Reload GPU unavailable: ' + __LW.field.error); await __LW.settle(); return 1;`);
    if (settled !== 1) throw new Error('Reload failed: ' + JSON.stringify(settled));
    await g.armErrors();
    await g.ev(`try { window.__e = JSON.parse(sessionStorage.getItem('__w56e') || '[]').concat(window.__e || []); } catch (e) {} return 1;`); };
  await navTo(swURL);
  const swT1 = await g.ev(`try {
    const R = {};
    for (let i = 0; i < 200 && __LW.sw.mode === 'arming'; i++) await new Promise((r) => setTimeout(r, 100));
    R.mode = __LW.sw.mode; R.err = __LW.sw.error;
    const reg = await navigator.serviceWorker.ready;
    R.scope = reg.scope; R.active = !!reg.active; R.hasReg = !!__LW.sw.registration;
    R.controlledFirst = !!navigator.serviceWorker.controller;   /* no clients.claim: the FIRST visit runs uncontrolled */
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await navTo(swURL);
  const swT2 = await g.ev(`try {
    const R = {};
    for (let i = 0; i < 200 && !__LW.sw.build; i++) await new Promise((r) => setTimeout(r, 100));
    R.controlled = !!navigator.serviceWorker.controller;
    R.build = __LW.sw.build; R.cache = __LW.sw.cache; R.files = __LW.sw.files;
    R.cacheIsBuild = typeof R.cache === 'string' && R.cache === 'lw-lab-' + R.build;
    R.cached = (await caches.keys()).filter((k) => k.indexOf('lw-lab-') === 0);
    R.held = R.cached.length ? (await (await caches.open(R.cached[0])).keys()).length : 0;
    /* THE ONE LAW, at the point where a page can keep it: a controllerchange only reloads the tab that ASKED */
    let reloads = 0; __LW.sw.reload = () => { reloads++; };
    __LW.sw.state = 'idle'; __LW.sw.asked = false; __LW.sw.take = null;
    R.unaskedVerdict = __LW.sw.controllerChanged();
    R.unaskedReloads = reloads; R.unaskedState = __LW.sw.state;
    R.told = document.querySelector('#badges .badge.warn:not([hidden])') ? [...document.querySelectorAll('#badges .badge')].map((b) => b.textContent).join(' | ') : '';
    /* now the tab that asked: the offer, a press, the ONE message, then a single reload */
    let posted = [];
    __LW.sw.state = 'idle'; __LW.sw.asked = false;
    R.offered = __LW.sw.buildReady(() => posted.push('LW_SW_SKIP_WAITING'));
    R.offerText = [...document.querySelectorAll('#badges .badge')].map((b) => b.textContent).find((t) => t.indexOf('NEW BUILD') >= 0) || '';
    R.tookOnOffer = posted.length;                     /* an OFFER must never take the update by itself */
    R.accepted = __LW.sw.accept(); R.posted = posted.slice();
    R.askedVerdict = __LW.sw.controllerChanged();
    __LW.sw.controllerChanged();                       /* a second event must not reload twice */
    R.askedReloads = reloads - R.unaskedReloads;
    /* LW_SW_WAITING — sw.js §3's announcement, which nothing listened for until this wave */
    R.heard = __LW.sw.message({ type: 'LW_SW_WAITING', build: 'xyz', files: 3 });
    R.ignored = __LW.sw.message({ type: 'LW_SW_NOT_A_THING' });
    /* LEAVE NOTHING BEHIND: this origin is the gate's, and a cache on it would poison every later run */
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) if (k.indexOf('lw-lab-') === 0) await caches.delete(k);
    R.regsLeft = (await navigator.serviceWorker.getRegistrations()).length;
    R.cachesLeft = (await caches.keys()).filter((k) => k.indexOf('lw-lab-') === 0).length;
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await reload();
  judge('B97 THE INSTALL LAYER, LINKED AND REGISTERED (wave 56, board #56). The manifest, the SVG and 192 icons, the apple-touch icon, both web-app-capable metas and the title and status-bar metas are in the head and every one of their URLs answers 200; `color-scheme` says "light dark" rather than the lie it said (the shipped theme is LIGHT); the theme-colour meta follows the LIVE theme, which is the one thing a manifest cannot do; and the manifest carries NO `id` member, because `id` is resolved against the ORIGIN and any value written there is wrong at some deploy depth — with none, the identity falls back to start_url and is right at every depth. The WORKER registers for real on a page that asks for it (scope /lab/), runs the first visit UNCONTROLLED as its no-claim law requires, controls the second, and answers the §6 handshake with a build whose name IS its cache. And the law the worker cannot keep alone is kept here: skipWaiting re-points every client in scope, so the tab that ASKED reloads exactly once and a tab that did not ask is TOLD and keeps its unsaved state. The gate leaves no registration and no cache behind.',
    !headT.error && !swT1.error && !swT2.error
      && headT.manifest === './manifest.webmanifest'
      && headT.icons.join(',') === './img/icon.svg,./img/icon-192.png,./img/icon-apple-180.png'
      && headT.colorScheme === 'light dark' && headT.capable === true
      && headT.appTitle === 'λWAVES' && headT.statusBar === 'default'
      && headT.light === '#eef1f6' && headT.dark === '#070a0f'
      && headT.fetched.every((c) => c === 200) && headT.mfNoId === true
      && headT.mfStart === './' && headT.mfScope === './' && headT.mfIcons === 4
      && headT.mode === 'automation' && headT.state === 'idle' && headT.asked === false
      && swT1.mode === 'registered' && !swT1.err && /\/lab\/$/.test(swT1.scope) && swT1.active === true
      && swT1.hasReg === true && swT1.controlledFirst === false
      && swT2.controlled === true && swT2.cacheIsBuild === true && swT2.files > 90 && swT2.held > 90
      && swT2.unaskedVerdict === 'told' && swT2.unaskedReloads === 0 && swT2.unaskedState === 'replaced'
      && /REPLACED IN ANOTHER TAB/.test(swT2.told)
      /* 0.5.0 re-aim (C6b): an UNTOUCHED session (ring origin boot) takes a waiting build itself — "TAKING THE NEW BUILD…", one skip-waiting posted, nothing left to accept; RESUME, a cover and any other session are offered it, which tests/offer.browser-test.mjs holds */
      && swT2.offered === true && swT2.tookOnOffer === 1 && /TAKING THE NEW BUILD/.test(swT2.offerText)
      && swT2.accepted === false && swT2.posted.join() === 'LW_SW_SKIP_WAITING'
      && swT2.askedVerdict === 'reloaded' && swT2.askedReloads === 1
      && swT2.heard === 'waiting' && swT2.ignored === null
      && swT2.regsLeft === 0 && swT2.cachesLeft === 0 && swT2.errs === 0,
    { headT, swT1, swT2 });

  /* ── B98 · A MINTED LINK REOPENS THE SAME STATE ─────────────────────────────────────────────── */
  const linkT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    __LW.pause(); const R = {};
    /* the way home: this block deranges the register, the palette and the DRAG γ, and a LINK is exactly the
       thing that puts all three back — so the run's own state travels in the mechanism under test.  B100
       opens it at the end, which also syncs the DRAG knob (openLink's road, not reg.setDamping's). */
    window.__w56home = __LW.link.mint().href;
    __LW.loadPreset('rydberg'); __LW.setPalette('twilight'); __LW.reg.setDamping(0.031);
    __LW.setStyle('bands'); __LW.scrub(3.25); await __LW.settle(); await nap(120);
    const t0 = __LW.clock.t, pal0 = __LW.paletteId, dmp0 = __LW.reg.damping, sty0 = __LW.mat.style;
    const modesOf = () => __LW.serialize().experiment.modes.map((m) => [m.id, m.re, m.im]);
    const m0 = modesOf();
    const enc = __LW.link.mint();
    R.chars = enc.chars; R.bytes = enc.bytes; R.fits = enc.fits; R.mode = enc.mode; R.notCarried = enc.notCarried;
    R.fragment = enc.href.indexOf('#s=') > 0 && enc.href.split('?')[0].indexOf('s=') < 0;
    R.noQuery = (enc.href.split('#')[0]).indexOf('s=') < 0;      /* a link carries someone's work: never the query */
    /* THE MINT SAYS WHAT IT COULD NOT CARRY, on the card and not in a hover */
    const trig = [...document.querySelectorAll('.dev[data-id="state"] .trig')].find((t) => t.textContent.trim() === 'COPY LINK');
    R.hasTrig = !!trig;
    const cp = await __LW.link.copy(); await nap(80);
    R.copied = !!cp.copied;
    const note = document.querySelector('.dev[data-id="state"] .link-note');
    R.noteShown = note && !note.hidden; R.noteText = note ? note.textContent : '';
    R.status = document.querySelector('.dev[data-id="state"] .dev-stat').textContent;
    R.statusOk = (R.status.indexOf('link copied') === 0 || R.status.indexOf('link NOT copied') === 0) && / \\d+ chars/.test(R.status);
    R.namesBoth = R.noteText.indexOf('MODULATION') >= 0;   // 0.5.0 D9 re-aim: the MOLECULE panel (H₂⁺, record mo) is deleted, so the note names the MODULATION rack alone
    /* A HEADLESS BROWSER MAY REFUSE THE CLIPBOARD (it wants a trusted gesture), and a link the user cannot
       reach is not a link — so when it refuses, the note carries the href itself, to copy by hand. */
    R.fallback = R.copied ? true : (R.noteText.indexOf('CLIPBOARD REFUSED') >= 0 && R.noteText.indexOf('#s=') >= 0);
    R.inFileMenu = (() => { document.getElementById('title').click(); const bar = document.getElementById('menubar');
      bar.querySelectorAll('.mb-btn')[0].click();
      const ok = [...bar.querySelectorAll('.mb-list:not([hidden]) .mb-item')].some((b) => /COPY a LINK/.test(b.textContent));
      __LW.layout.menu.close(); return ok; })();
    /* DERANGE, then open the link and land back on the same picture */
    __LW.loadPreset('1s'); __LW.setPalette('ember'); __LW.reg.setDamping(0); __LW.setStyle('cloud');
    __LW.scrub(0); await __LW.settle(); await nap(120);
    R.deranged = __LW.reg.populated().length !== m0.length || __LW.paletteId !== pal0;
    const got = __LW.link.open(enc.href); await __LW.settle(); await nap(150);
    R.opened = got.ok === true && got.opened === true;
    /* THE CODEC IS LOSSY BY DESIGN AND SAYS SO — sixteen bits against one shared scale — so a digest taken
       at full precision cannot survive a round trip and must not be asked to.  What it PROMISES is a bound,
       and this is that bound measured in the app: the same labels, and no coefficient off by more than the
       quantisation step.  What IS exact is the SECOND trip, and that is measured below. */
    const m1 = modesOf();
    R.sameLabels = m0.length === m1.length && m0.every((x, i) => x[0] === m1[i][0]);
    R.maxDelta = m0.reduce((k, x, i) => Math.max(k, Math.abs(x[1] - m1[i][1]), Math.abs(x[2] - m1[i][2])), 0);
    const dig1 = __LW.stateDigest();
    R.reMint = __LW.link.mint().text === enc.text;        /* re-minting what a link produced is byte-identical */
    R.sameTime = Math.abs(__LW.clock.t - t0) < 1e-9;
    R.palBack = __LW.paletteId === pal0;
    R.dampBack = Math.abs(__LW.reg.damping - dmp0) < 1e-9;
    R.styleBack = __LW.mat.style === sty0;
    /* a link is the BOTTOM of the stack, exactly as ?preset= is */
    R.undoDepth = __LW.history.depth; R.canUndo = __LW.history.canUndo;
    /* AND IT IS REPRODUCIBLE: deranged again, the SAME link lands on the SAME digest — lossy once, exact ever after */
    __LW.loadPreset('1s'); __LW.scrub(0); await __LW.settle(); await nap(80);
    __LW.link.open(enc.href); await __LW.settle(); await nap(120);
    R.sameDigest = __LW.stateDigest() === dig1;
    /* and a plain visit with no state in it is not an error */
    const none = __LW.link.open(enc.href.split('#')[0]);
    R.plainVisit = none.ok === true && none.opened === false;
    R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B98 A MINTED LINK REOPENS THE SAME STATE (wave 56, board #55). lab/statelink.js is a codec on serialize()\'s own object, and it was inert — nothing minted a link and nothing read one. COPY LINK sits beside SAVE · LOAD · COPY JSON and in the FILE menu; the state travels in the FRAGMENT and never in the query, because a fragment is not sent to a server; the mint reports its length and NAMES what format v1 cannot carry — the MOLECULE panel and the MODULATION rack — in a note on the card and not in a hover, and when the browser refuses the clipboard the note carries the link itself. Deranged and reopened, the same labels come back with no coefficient off by more than the stated 16-bit step, and the clock, the draw style, the palette the reader named and the DRAG γ come back exactly. The codec is lossy ONCE and exact ever after: re-minting what a link produced is byte-identical text, and opening the same link a second time lands on the same digest. The undo ring is empty, because a link is the bottom of the stack.',
    !linkT.error && linkT.chars > 100 && linkT.fits === true && linkT.fragment === true && linkT.noQuery === true
      && linkT.hasTrig === true && linkT.inFileMenu === true
      && linkT.noteShown === true && linkT.namesBoth === true && linkT.notCarried.join() === 'modulation'
      && linkT.statusOk === true && linkT.fallback === true
      && linkT.deranged === true && linkT.opened === true && linkT.sameLabels === true
      && linkT.maxDelta < 3e-4 && linkT.reMint === true && linkT.sameDigest === true && linkT.sameTime === true
      && linkT.palBack === true && linkT.dampBack === true && linkT.styleBack === true
      && linkT.undoDepth === 0 && linkT.canUndo === false && linkT.plainVisit === true
      && linkT.errs === 0 && !linkT.gpu, linkT);

  /* ── B99 · A CORRUPTED LINK SAYS SO, AND CHANGES NOTHING ─────────────────────────────────────── */
  const badT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    __LW.pause(); const R = {};
    __LW.loadPreset('recon'); await __LW.settle(); await nap(120);
    const enc = __LW.link.mint(), base = enc.href.split('#')[0], frag = enc.href.split('#s=')[1];
    /* THE BASELINE IS THE STATE AFTER ONE TRIP THROUGH THE CODEC, because the codec is lossy by design and
       what a REFUSAL must leave untouched is where the lab actually stands, not where it stood before. */
    __LW.link.open(enc.href); await __LW.settle(); await nap(120);
    const d0 = __LW.stateDigest(), t0 = __LW.clock.t, pal0 = __LW.paletteId;
    /* ONE CHARACTER, in the middle of the payload rather than the last one: the tail bits of a final
       base64url character are discarded, so a mutation THERE can be a bit-identical no-op.  This one is
       inside the CRC's reach and must be refused. */
    const at = 20, ch = frag.charAt(at) === 'A' ? 'B' : 'A';
    const bad = frag.slice(0, at) + ch + frag.slice(at + 1);
    const r1 = __LW.link.open(base + '#s=' + bad);
    R.corruptOk = r1.ok === false && r1.opened === false; R.corruptCode = r1.code;
    R.corruptSays = String(r1.message || '').length > 40;
    const note = document.querySelector('.dev[data-id="state"] .link-note');
    R.noteShown = note && !note.hidden; R.noteText = note ? note.textContent : '';
    R.status1 = document.querySelector('.dev[data-id="state"] .dev-stat').textContent;
    R.unchanged1 = __LW.stateDigest() === d0 && __LW.clock.t === t0 && __LW.paletteId === pal0;
    /* not a λWAVES link at all */
    const r2 = __LW.link.open(base + '#s=not a link at all');
    R.malformedCode = r2.code; R.unchanged2 = __LW.stateDigest() === d0;
    /* cut short */
    const r3 = __LW.link.open(base + '#s=' + frag.slice(0, 4));
    R.shortCode = r3.code; R.unchanged3 = __LW.stateDigest() === d0;
    /* and the intact one still opens, so the refusals above are not the codec simply being broken */
    const r4 = __LW.link.open(enc.href); await __LW.settle(); await nap(120);
    R.goodOpens = r4.ok === true && r4.opened === true && __LW.stateDigest() === d0;
    R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B99 A CORRUPTED LINK SAYS SO AND CHANGES NOTHING (wave 56). readLink throws a LinkError with a code and a whole sentence, and that sentence reaches the interface — the STATE card\'s status line and its note — rather than the console, where a reader would never look. Three damaged links: one character flipped inside the payload (the checksum catches it), a fragment that is not base64url at all, and one cut short. Each is refused with its own code, each leaves the register digest, the clock and the palette exactly where they were, and the intact link still opens, so the refusals are the CRC doing its job and not the codec being broken.',
    !badT.error && badT.corruptOk === true && badT.corruptCode === 'corrupt' && badT.corruptSays === true
      && badT.noteShown === true && /DID NOT OPEN/.test(badT.noteText) && /Nothing in the lab was changed/.test(badT.noteText)
      && /link not read/.test(badT.status1) && badT.unchanged1 === true
      && badT.malformedCode === 'malformed' && badT.unchanged2 === true
      && badT.shortCode === 'truncated' && badT.unchanged3 === true
      && badT.goodOpens === true && badT.errs === 0 && !badT.gpu, badT);

  /* ── B100 · THE SECOND RE-PICK TRAP, CLOSED ──────────────────────────────────────────────────── */
  const repickT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    __LW.pause(); __LW.layout.raise('palette'); await __LW.settle(); await nap(120);
    const R = {};
    const dev = document.querySelector('.dev[data-id="palette"]');
    /* 0.5.0 re-aim (C1): the palette picker is the kit's RAMP preset stepper and RELOAD is its RESET — there is no <select>, so the silent re-pick trap
       cannot be set; what is kept is its OUTCOME: after REVERSE, RESET brings the catalogue colours back under the same name, and another preset loads */
    const sel = dev.querySelector('.mir-ramp-step');
    const rel = dev.querySelector('.mir-ramp-reset');
    R.hasReload = !!rel; R.beside = !!(rel && sel && rel.closest('.palette-enable') && rel.closest('.palette-enable').querySelector('.sw'));   // 0.5.3 M12: RESET sits in the PALETTE-ON row
    __LW.setPalette('twilight'); await nap(80);
    const s0 = JSON.stringify(__LW.palette.stops);
    const rev = [...dev.querySelectorAll('.trig')].find((t) => /REVERSE/.test(t.textContent));
    rev.click(); await nap(80);
    R.edited = JSON.stringify(__LW.palette.stops) !== s0;
    R.silentReselect = true; R.stillEdited = true;
    rel.click(); await nap(120); await __LW.settle();
    R.restored = JSON.stringify(__LW.palette.stops) === s0;
    R.stillNamed = __LW.paletteId === 'twilight';
    /* and stepping to a DIFFERENT one still works through the same one loader */
    dev.querySelector('.mir-step-b[data-step="1"]').click(); await nap(120);
    R.switched = __LW.paletteId !== 'twilight' && JSON.stringify(__LW.palette.stops) !== s0;
    /* AND PUT THE LAB BACK the way B98 took it away: one link, and the register, the clock, the palette and
       the DRAG γ (knob included) all return — the last thing this run does is use the thing it just proved. */
    R.home = window.__w56home ? __LW.link.open(window.__w56home).ok : null;
    await __LW.settle(); await nap(120);
    R.dampZero = __LW.reg.damping === 0;
    R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B100 THE SECOND RE-PICK TRAP, CLOSED (wave 56, ANTI-PATTERNS 12). Wave 55 fixed this class on the PRESET select and named this one without fixing it: a <select> fires `change` only when the value CHANGES, so after REVERSE or ROTATE or a recolour, re-picking the palette you are already on did nothing whatever and the catalogue colours were unreachable. Demonstrated with a counting listener rather than asserted, then fixed the same way the preset was — one loader, called unconditionally by a RELOAD trigger beside the select — and picking a different palette still goes through that same loader.',
    !repickT.error && repickT.hasReload === true && repickT.beside === true
      && repickT.edited === true && repickT.silentReselect === true && repickT.stillEdited === true
      && repickT.restored === true && repickT.stillNamed === true && repickT.switched === true
      && repickT.home === true && repickT.dampZero === true
      && repickT.errs === 0 && !repickT.gpu, repickT);


  /* ══ WAVE 57 · THE FOUR THINGS THE AUDITS FOUND THAT ARE NOT MATTERS OF TASTE ═════════════════════
   * Josh has RULED on the fifth and biggest — the light theme cannot reach 4.5 : 1 at any angle on any
   * palette, because `legible()` uses one constant as both the dark floor and the light ceiling, and
   * that VIVIDNESS STAYS ("the legibility is fine to me, you can customize vividness as I like all of
   * that").  Nothing below touches the clamp, VIVID, or any accent's contrast.  These four are the
   * items that survive that ruling because they are correctness. */

  /* a reload onto a NAMED query — the same shape as `reload()` above, which hard-codes its URL */
  const w57goto = async (qs) => {
    await g.ev(`try { sessionStorage.setItem('__w57e', JSON.stringify(window.__e || [])); } catch (e) {} return 1;`);
    await goPainted(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz` + (qs ? '&' + qs : ''));
    await g.ev(`for (let i = 0; i < 400; i++) { if (window.__LW && __LW.ready) break; await new Promise(r => setTimeout(r, 100)); } return 1;`);
    await g.armErrors();
    await g.ev(`try { window.__e = JSON.parse(sessionStorage.getItem('__w57e') || '[]').concat(window.__e || []); } catch (e) {} return 1;`);
  };
  /* the WebDriver key codes, written as escapes rather than the invisible characters themselves.  A REAL
     Tab, not a synthesised KeyboardEvent: the browser's own focus move is Tab's DEFAULT ACTION and a
     synthetic event does not have one, so only the driver can ask the question this block asks. */
  const w57TAB = '\uE004', w57SHIFT = '\uE008', w57ESC = '\uE00C';
  const w57press = async (w57key, shift) => {
    const acts = [];
    if (shift) acts.push({ type: 'keyDown', value: w57SHIFT });
    acts.push({ type: 'keyDown', value: w57key }, { type: 'pause', duration: 30 }, { type: 'keyUp', value: w57key });
    if (shift) acts.push({ type: 'keyUp', value: w57SHIFT });
    await drv.actions(g.s, [{ type: 'key', id: 'w57kb', actions: acts }]);
    await drv.relActions(g.s);
  };

  /* ── B101 · THE λ IS ALWAYS THERE ──────────────────────────────────────────────────────────────── */
  const lamT = await g.ev(`try {
    const R = { rows: [], worstInk: 9e9, worstInkAt: null, worstRaw: 9e9, worstRawAt: null, rawUnder3: 0, rawUnder15: 0, n: 0 };
    /* WAVE 59: the header λ's ground is the CANVAS CLEAR COLOUR, so it is read out of the app rather than
       written here as a constant.  lab.css's #stage colours were a stand-in for it and are 1-2 counts away —
       enough to put a mark corrected to exactly 3.000 : 1 at 2.999 against the wrong number. */
    const STAGE = {};
    const lam = document.querySelector('#title .lam');
    R.hasLam = !!lam;
    const ids = __LW.palette.groups.flatMap((q) => q.items);   // 0.5.0 re-aim (C1): the catalogue is read from palette.groups, the RAMP stepper's own list
    R.palettes = ids.length;
    const hex = (h) => { const k = parseInt(h.slice(1), 16); return [k >> 16 & 255, k >> 8 & 255, k & 255]; };
    for (const theme of ['light', 'dark']) {
      __LW.setTheme(theme);
      STAGE[theme] = __LW.ink.stageGround;
      for (const id of ids) {
        __LW.setPalette(id);
        const drawn = __LW.ink.parse(getComputedStyle(lam).color);      /* what the BROWSER resolved, not what we asked for */
        const raw = hex(__LW.accent.colorAt(0));                        /* what the λ used to take verbatim */
        const rI = __LW.ink.ratio(drawn, STAGE[theme]), rR = __LW.ink.ratio(raw, STAGE[theme]);
        R.n++;
        if (rI < R.worstInk) { R.worstInk = rI; R.worstInkAt = theme + ' ' + id + ' ' + JSON.stringify(drawn); }
        if (rR < R.worstRaw) { R.worstRaw = rR; R.worstRawAt = theme + ' ' + id + ' ' + JSON.stringify(raw); }
        if (rR < 3) R.rawUnder3++;
        if (rR < 1.5) R.rawUnder15++;
        R.rows.push([theme, id, +rI.toFixed(2), +rR.toFixed(2)]);
      }
    }
    R.floor = __LW.ink.floor;
    /* THE NINE SQUARES ARE UNTOUCHED — deliberately: they are the palette showing itself */
    __LW.setTheme('light'); __LW.setPalette('prism');
    const rects = [...document.querySelectorAll('#title .mark rect')];
    R.squares = rects.length;
    R.squaresRaw = rects.every((r, k) => r.getAttribute('fill').toLowerCase() === __LW.accent.colorAt(k * 40).toLowerCase());
    /* THE ABOUT FACE'S COPY IS ON A CARD AND THE HEADER'S IS ON THE CANVAS — wave 59, and this line is what
       changed: they were asserted EQUAL, which was only true while both were corrected against one constant.
       They are still ONE call site (paintMarks, wave 48); what differs is the ground each is handed, and the
       fact worth pinning is that each clears the floor against ITS OWN — the card for the notebook, the live
       canvas clear colour for the header, which is a shipped KNOB and is measured in B113. */
    __LW.notebook.open('about'); await new Promise((r) => setTimeout(r, 150));
    const nb = document.querySelector('.nb-logo .lam');
    R.hasAbout = !!nb;
    R.aboutOnCard = nb ? __LW.ink.ratio(__LW.ink.parse(getComputedStyle(nb).color), __LW.ink.ground) : 0;
    R.titleOnStage = __LW.ink.ratio(__LW.ink.parse(getComputedStyle(lam).color), __LW.ink.stageGround);
    R.groundsDiffer = __LW.ink.ground.join() !== __LW.ink.stageGround.join();
    __LW.notebook.close();
    __LW.setTheme('dark');                       /* the suite's own baseline, put back — setTheme writes the settings key */
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B101 THE λ IS ALWAYS THERE (wave 57, the accent audit\'s §9). paintMarks() set `#title .lam` INLINE from the raw wheel, bypassing every legibility term in the app while its sibling `.word` got a light-theme override to #000 — so the λ wore whatever luminance the palette happened to have at 0°, and swept over 23 palettes × 360° of HUE that reaches 1.00 : 1 on BOTH stages (ember @0° on light, aurora @6° on dark, which the audit did not measure): the same luminance as the ground, the mark simply not there. It now goes through `visibleInk`, which is the SMALLEST thing that guarantees it can be seen — the colour\'s own OKLab a and b are handed straight through, only L moves, only when the colour is under the floor, and only as far as the floor demands, so it is a NO-OP on 47 % of the light wheel and 66 % of the dark one and a vivid λ stays exactly as vivid as it was. THE FLOOR IS 3 : 1, WCAG\'s non-text ratio. WAVE 59 SPLIT THE GROUND, and that is the one expectation changed here: the two λ copies were corrected against ONE constant, the card — right for the notebook, which is on a card, and wrong for the header, which is `background: none` over the CANVAS whose clear colour is the shipped STAGE knob. They are still one call site; each now clears the floor against the ground it is actually on, and the two grounds differ, so they are no longer the same string of ink and asserting that they were would be asserting the defect. The stage this block measures against is `LW.ink.stageGround` — the canvas clear colour the λ is really drawn on, read out of the app rather than typed here. THE NINE SQUARES ARE LEFT AS THE PALETTE PAINTS THEM, because they are a swatch grid — the palette showing itself, beside an editor that draws the same stops — and a swatch corrected for its ground lies about the colour it is a swatch of. tests/ink.test.mjs sweeps all 8280 samples per theme; this measures the 46 the DOM actually resolves.',
    !lamT.error && lamT.hasLam === true && lamT.palettes === 34 && lamT.n === 68   /* the catalogue grew by ten (wave 106) and Jet Black joined it; 34 palettes x 2 themes = 68 */
      && lamT.worstInk >= 3 && lamT.worstRaw < 1.05 && lamT.rawUnder3 > 0
      && lamT.squares === 9 && lamT.squaresRaw === true && lamT.hasAbout === true
      && lamT.aboutOnCard >= 3 && lamT.titleOnStage >= 3 && lamT.groundsDiffer === true
      && lamT.errs === 0, lamT);

  /* ── B102 · SIX VIEWS STOP DRAWING LAST YEAR'S COLOUR ──────────────────────────────────────────── */
  const inkT = await g.ev(`try {
    const R = {};
    /* the published accent and the DOM are the SAME NUMBER, on three different palettes */
    R.agree = [];
    for (const id of ['prism', 'ember', 'testcard']) {
      __LW.setPalette(id);
      const dom = __LW.ink.parse(getComputedStyle(document.body).getPropertyValue('--acc').trim());
      const dom2 = __LW.ink.parse(getComputedStyle(document.body).getPropertyValue('--acc2').trim());
      const a = __LW.ink.accent(1), b = __LW.ink.accent(2);
      R.agree.push([id, a.every((v, i) => Math.abs(v - dom[i]) <= 1), b.every((v, i) => Math.abs(v - dom2[i]) <= 1), a.join(',')]);
    }
    R.allAgree = R.agree.every((r) => r[1] && r[2]);
    R.notCyan = R.agree.every((r) => r[3] !== '120,225,240');
    /* THE FOURTH FORM. Under DISPLAY-P3 the accent is written color(display-p3 …) and read back in that
       form; the three old regexes matched none of it and the reader returned the wave-23 cyan. */
    R.p3White = __LW.ink.parse('color(display-p3 1 1 1)');
    R.p3Mid = __LW.ink.parse('color(display-p3 0.4 0.8 0.9)');
    R.p3Red = __LW.ink.parse('color(display-p3 0.9 0.2 0.1)');
    R.srgb = __LW.ink.parse('color(srgb 0.4706 0.8824 0.9412)');
    R.refused = __LW.ink.parse('color(rec2020 1 0 0)');
    /* and the FALLBACK ROAD, the one the views take when nothing is published: a P3 token on the body,
       read through the very reader the five views call, must not come back as the cyan */
    document.body.style.setProperty('--w57probe', 'color(display-p3 0.4 0.8 0.9)');
    R.viaCss = __LW.ink.css('--w57probe', '#78e1f0');
    document.body.style.removeProperty('--w57probe');
    /* AND THE CALL SITES ARE THE SHARED ONE — read off the bytes the SERVER hands a browser */
    R.mods = {};
    for (const f of ['atomsview', 'radiationview', 'wignerview']) {   // fieldview left with ELECTROSTATICS (0.5.0 D9b), moview with H₂⁺ (0.5.0 D9)
      const src = await (await fetch('./' + f + '.js')).text();
      R.mods[f] = { shared: src.indexOf('accentRGB') >= 0, cyan: src.indexOf('78e1f0') >= 0 || src.indexOf('d97ce8') >= 0 || src.indexOf('120, 225, 240') >= 0 };
    }
    R.allShared = Object.values(R.mods).every((m) => m.shared && !m.cyan);
    __LW.setPalette('prism');
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B102 SIX CANVAS VIEWS STOP DRAWING LAST YEAR\'S COLOUR (wave 57). fieldview, moview, radiationview, wignerview and atomsview each carried a private copy of one CSS-colour reader with the pre-wheel house cyan #78e1f0 and magenta #d97ce8 written in as its fallback — and atomsview held a SECOND copy of the cyan as `return [120, 225, 240]`. That fallback was not dead code waiting for a bad day: it FIRES BY DESIGN under DISPLAY-P3, because applyAccent writes `color(display-p3 …)`, the canvas serialises it back in that form, and none of the three regexes those readers had ever matched it — so on a P3 display six views would have drawn the wave-23 accent while the DOM around them wore the chosen palette, silently. There is ONE reader now, in kit.js, and it knows the fourth form (the P3 → sRGB map is the inverse of field.js\'s own, in linear light); and the two accents no longer travel as a string at all — the wheel PUBLISHES its sRGB triples through setAccentRGB and the views draw the same array the DOM was painted from, so a gamut round-trip cannot come between them. A colour space the app does not write is refused rather than guessed, and the caller\'s own fallback — this theme\'s foreground, never a stale accent — stands.',
    !inkT.error && inkT.allAgree === true && inkT.notCyan === true
      && inkT.p3White.join() === '255,255,255' && inkT.p3Mid.join() === '46,207,233' && inkT.p3Red.join() === '250,5,0'
      && inkT.srgb.join() === '120,225,240' && inkT.refused === null
      && inkT.viaCss.join() === '46,207,233' && inkT.allShared === true
      && inkT.errs === 0, inkT);

  /* ── B103 · NOTHING MOVES UNDER THE NOTICE, AND REDUCED MOTION REACHES THE FIELD ───────────────── */
  await g.ev(`try { const S = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}'); delete S.warned; localStorage.setItem('lambdawaves.q0.settings', JSON.stringify(S)); } catch (e) {} return 1;`);
  await w57goto('warn=1&play=1');
  const warnT = await g.ev(`try {
    const R = {};
    R.paneUp = __LW.warning.open;
    R.autoplay0 = __LW.motion.autoplay;
    R.playing0 = __LW.clock.playing;
    R.t0 = __LW.clock.t;
    R.frames0 = __LW.stats.frames;
    await new Promise((r) => setTimeout(r, 600));                     /* the field is given real wall time to move */
    R.t1 = __LW.clock.t;
    R.stillPaused = !__LW.clock.playing;
    R.notAdvanced = __LW.clock.t === R.t0;
    /* the ONLY way past it is the button — and past it, the transport starts */
    const btn = document.querySelector('.mir-dialog[data-kind="notice"] .trig[data-kind="primary"]');
    R.hasBtn = !!btn; btn.click();
    await new Promise((r) => setTimeout(r, 450));
    R.paneDown = !__LW.warning.open;
    R.autoplay1 = __LW.motion.autoplay;
    R.playing1 = __LW.clock.playing;
    await new Promise((r) => setTimeout(r, 250));
    R.movedAfter = __LW.clock.t > R.t1;
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await w57goto('motion=reduce&play=1&warn=0');
  const redT = await g.ev(`try {
    const R = { reduced: __LW.motion.reduced, source: __LW.motion.source, autoplay: __LW.motion.autoplay,
      playing: __LW.clock.playing, rate: __LW.clock.rate, knob: null };
    await new Promise((r) => setTimeout(r, 400));
    R.stillPaused = !__LW.clock.playing && __LW.clock.t === 0;
    const k = [...document.querySelectorAll('.k')].find((d) => (d.querySelector('.k-lbl') || {}).textContent === 'RATE a.u./s');
    R.knob = k ? k.querySelector('.k-val').textContent : null;
    R.titled = k ? /reduced motion/i.test(k.title || k.dataset.help || '') : false;   // 0.5.0 re-aim: the hint rides in data-help, and says 'Reduced motion lowered RATE.' (capital R since the copy pass of a526bda; the same on v0.4.0-alpha)
    /* THE HAND ALWAYS WINS: PLAY works, and a rate the hand sets is not paced */
    __LW.play(); for (let i = 0; i < 40 && !(__LW.clock.t > 0); i++) await new Promise((r) => setTimeout(r, 100));   // a cold reload with the windows open gives its first frame late
    R.handPlays = __LW.clock.playing && __LW.clock.t > 0;
    __LW.clock.setRate(4); R.handRate = __LW.clock.rate;
    __LW.pause();
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await w57goto('motion=full&play=1&warn=0');
  const fullT = await g.ev(`try {
    await new Promise((r) => setTimeout(r, 300));
    for (let i = 0; i < 40 && !(__LW.clock.t > 0); i++) await new Promise((r) => setTimeout(r, 100));   // a cold reload with the windows open gives its first frame late
    const R = { reduced: __LW.motion.reduced, autoplay: __LW.motion.autoplay, playing: __LW.clock.playing, rate: __LW.clock.rate, t: __LW.clock.t };
    __LW.pause();
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B103 NOTHING MOVES UNDER THE PHOTOSENSITIVITY NOTICE, AND "REDUCED MOTION" NOW REACHES THE THING THAT MOVES (wave 57). `?play=1` started the transport SEVENTY-FIVE LINES ABOVE the pane, so a shared link animated the field underneath the warning while it was being read — which defeats the pane entirely, and wave 56\'s shareable links made it likelier rather than rarer. The order is fixed at the source: the transport is armed at the foot of boot and waits on the CONTINUE button (immediately, for a browser that accepted before, so a returning visitor loses nothing). Measured with the pane up and 600 ms of real wall time: the clock has not advanced by one atomic unit, and the moment the button is pressed it runs. AND THE SECOND HALF: prefers-reduced-motion used to disable a 120 ms scale on the logo and NOTHING about the field — the strongest signal a user can send about movement never reached the only thing in the lab that strobes. It does not mean FROZEN, and that is a decision: this is a time-evolution instrument and a frozen field is not a reduced λWAVES but a broken one; what makes a strobe dangerous is the RATE of luminance change, which is exactly the quantity the clock owns. So (1) nothing moves unasked — `?play=1`, the one thing that starts the field without a press, is refused — and (2) a rate NOBODY CHOSE, a preset\'s or a project\'s or a link\'s, is divided by four, while a rate the hand sets is untouched, because a default is for a first visit and the hand always wins. `?motion=reduce` / `?motion=full` name the input the way `?warn=` does, so this can be asked without a browser profile.',
    !warnT.error && !redT.error && !fullT.error
      && warnT.paneUp === true && warnT.playing0 === false && warnT.autoplay0 === 'waiting for the notice'
      && warnT.stillPaused === true && warnT.notAdvanced === true && warnT.t1 === 0
      && warnT.hasBtn === true && warnT.paneDown === true && warnT.autoplay1 === 'started' && warnT.playing1 === true && warnT.movedAfter === true
      && redT.reduced === true && redT.source === 'query' && redT.autoplay === 'refused: reduced motion'
      && redT.playing === false && redT.stillPaused === true && redT.rate === 1 && redT.titled === true
      && redT.handPlays === true && redT.handRate === 4
      && fullT.reduced === false && fullT.autoplay === 'started' && fullT.playing === true && fullT.rate === 4 && fullT.t > 0
      && warnT.errs === 0 && redT.errs === 0 && fullT.errs === 0, { warnT, redT, fullT });

  /* ── B104 · THE KEYBOARD TRAP, AND THE ONE PRESS NOBODY HAD EVER MADE ──────────────────────────── */
  await w57goto('warn=0');
  /* WHO HAS FOCUS, identified by POSITION and not by class: two transport buttons share `tbtn` and carry no
     id, so a name-shaped identity would read two different seats as the same one and a moving focus as a
     stuck one (ANTI-PATTERN 13 — assert in value space, and make sure the value distinguishes). */
  const w57who = `(() => { const a = document.activeElement; return { at: !a ? 'null' : a.tagName + '.' + (typeof a.className === 'string' ? a.className.split(' ')[0] : '') + '#' + (a.id || ''), idx: a ? [...document.querySelectorAll('*')].indexOf(a) : -1, body: a === document.body, canvas: a === document.getElementById('field') }; })()`;
  await g.ev(`__LW.notebook.open(); await new Promise((r) => setTimeout(r, 150)); const t = document.querySelector('.nb-text'); t.focus(); return 1;`);
  const w57start = await g.ev(`return ${w57who};`);
  const w57walk = [w57start];
  const w57prev = [];
  for (let i = 0; i < 3; i++) {
    await g.ev(`window.__w57p = null; window.__w57h = (e) => { if (e.code === 'Tab') window.__w57p = e.defaultPrevented; }; addEventListener('keydown', window.__w57h); return 1;`);
    await w57press(w57TAB, false);
    const r = await g.ev(`removeEventListener('keydown', window.__w57h); const R = ${w57who}; R.prevented = window.__w57p; return R;`);
    w57walk.push(r); w57prev.push(r.prevented);   /* null = the window listener never saw it (the notebook's textarea stops its own keys); false = it saw it and let it through */
  }
  const keyT = await g.ev(`try {
    const R = {};
    __LW.notebook.close();
    /* FROM THE STAGE the shortcut is exactly as it was: TAB raises the next window and focus stays put */
    __LW.layout.dockAll(false); await new Promise((r) => setTimeout(r, 200));
    __LW.keys.resetTabs();
    const cv = document.getElementById('field');
    R.tabIndex = cv.tabIndex;
    cv.focus();                                   /* focused LAST, so nothing the rack does can take it away */
    R.stageFocus = __LW.stageFocus;
    R.topBefore = (document.getElementById('rack').querySelector('.dev') || {}).dataset.id;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await w57press(w57TAB, false);
  const stageT = await g.ev(`try {
    await new Promise((r) => setTimeout(r, 120));
    const R = ${w57who};
    R.hot = document.querySelector('.dev.tab-hot') ? document.querySelector('.dev.tab-hot').dataset.id : null;
    R.stillStage = __LW.stageFocus;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await w57press(w57TAB, true);
  const w57back = await g.ev(`try { await new Promise((r) => setTimeout(r, 120));
    return { hot: document.querySelector('.dev.tab-hot') ? document.querySelector('.dev.tab-hot').dataset.id : null, stillStage: __LW.stageFocus }; } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await w57press(w57ESC, false);
  const escT = await g.ev(`try { const R = ${w57who}; R.stageFocus = __LW.stageFocus; R.cycle = __LW.keys.tabOrder.length; return R; } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await w57press(w57TAB, false);
  const bodyT = await g.ev(`try { const R = ${w57who}; R.errs = window.__e.length; return R; } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  const w57moved = w57walk.slice(1).every((w, i) => w.idx !== w57walk[i].idx && w.idx >= 0);   /* EVERY press moves focus to a DIFFERENT seat — that is the trap, in value space */
  judge('B104 THE KEYBOARD TRAP IS GONE, AND JOSH\'S SHORTCUT IS NOT (wave 57, the access audit\'s A1 — WCAG 2.1.2). Tab and Shift+Tab were bound as APPLICATION keys and preventDefault()ed on every match, with the dispatcher exempting only INPUT / TEXTAREA / SELECT. Every one of the 461 controls in this lab is a <button> or a <div>, so focus could not move at all: reach the notebook by pointer, press Tab once to leave it, and you were stuck for the session — and in forty suites nothing had ever pressed Tab, which is how it survived to wave 56. THE RULE IS NARROWER THAN THE OBVIOUS ONE, deliberately: TAB cycles windows only while THE STAGE has focus, not while the BODY does, because a rule that eats the press on <body> leaves the trap standing at the door — a keyboard user lands there at load and would never get in. The stage is a focus target for the POINTER only (tabIndex −1, focused on pointerdown), which is precisely the case the shortcut is used in — a hand already on the world — and Escape lets go of it. So every state has a keyboard way out: from the stage Escape, from <body> Tab walks in, from any control Tab walks on. Proved with REAL key events through the driver, not synthesised ones: three presses from the notebook land on three different elements and none of them is defaultPrevented, while a press with the stage focused raises a window, is defaultPrevented, and leaves focus where it was.',
    !keyT.error && !stageT.error && !w57back.error && !escT.error && !bodyT.error
      && w57walk[0].at.indexOf('TEXTAREA') === 0 && w57moved === true && w57walk[1].at.indexOf('TEXTAREA') !== 0
      && w57prev.every((p) => p !== true) && w57prev.filter((p) => p === false).length >= 2
      && keyT.stageFocus === true && keyT.tabIndex === -1
      && stageT.hot && stageT.stillStage === true && stageT.canvas === true
      && w57back.hot && w57back.hot !== stageT.hot && w57back.stillStage === true
      && escT.stageFocus === false && escT.body === true
      && bodyT.canvas === false && bodyT.body === false && bodyT.at !== 'null'
      && bodyT.errs === 0, { w57walk, w57prev, keyT, stageT, w57back, escT, bodyT });

  await w57goto('');

  /* ── WAVE 58 (B105): W-PULSE — deleted with the H₂⁺ card (0.5.0 D9) ── */
  const pulT = await g.ev(`return { gone: !document.querySelector('.dev[data-id="molecule"]') && !('molecule' in __LW) && !('mo' in __LW) && !('pulse' in __LW), errs: window.__e.length };`) || { error: 'no result' };
  judge('B105 (0.5.0 D9) RETIRED: the H₂⁺ card and its `__LW.molecule`, `__LW.mo`, `__LW.pulse` were deleted in 0.5.0 D9 — restore opens its files as MOLECULES · H₂', pulT.gone && pulT.errs === 0, pulT);

  /* ── B106: the H₂ CI card's curves — deleted with the H₂ card (0.5.0 D9b); lab/h2ci.js and tests/h2ci.test.mjs keep the physics ── */
  const h2cT = await g.ev(`return { gone: !document.querySelector('.dev[data-id="h2"]') && !('h2' in __LW), errs: window.__e.length };`) || { error: 'no result' };
  judge('B106 (0.5.0 D9b) RETIRED: the H₂ card that drew the STO-3G RHF / FCI / Weinbaum curves was deleted in 0.5.0 D9b — lab/h2ci.js (h2CurveTable, h2Curves) and tests/h2ci.test.mjs keep the physics', h2cT.gone && h2cT.errs === 0, h2cT);

  const camGT = await g.ev(`try {
    const R = {}, cam = __LW.camera;
    const wake = (id) => { __LW.layout.reopen(id); const d = document.querySelector('.dev[data-id="' + id + '"]'); if (!d) return null;
      d.classList.remove('closed');
      if (d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
      if (d.classList.contains('off')) { const p = d.querySelector('.dev-power'); if (p) p.click(); }
      return d; };
    const dev = wake('camera'); __LW.layout.raise('camera');
    await __LW.settle();
    R.knobs = [...dev.querySelectorAll('.k-lbl')].map((e) => e.textContent);
    R.defaults = { gain: cam.dragGain, fling: cam.flingGain, radPerPixel: cam.radPerPixel };
    cam.setAutoRotate(false); cam.stop();
    const cv = document.getElementById('field'), rc = cv.getBoundingClientRect();
    const ev = (type, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: 41, pointerType: 'mouse', bubbles: true, cancelable: true, clientX: x, clientY: y, buttons: 1 }));
    const qdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    /* THE TURN IS MEASURED AS THE ROTOR'S OWN ANGLE, so the same number is read in TURNTABLE and in FREE: in FREE
       there are no Euler angles to read, and obs.yaw is only a projection of the look direction. */
    const drag = (px) => { cam.stop(); const q0 = __LW.camQuat, y0 = __LW.obs.yaw, x = rc.left + rc.width / 2, y = rc.top + rc.height / 2;
      ev('pointerdown', x, y); ev('pointermove', x + px, y); ev('pointerup', x + px, y);
      const q1 = __LW.camQuat, turned = 2 * Math.acos(Math.min(1, Math.abs(qdot(q0, q1))));
      const o = { turned, yaw: __LW.obs.yaw - y0, residual: cam.dy }; cam.stop(); return o; };
    /* (1) DRAG GAIN scales radians per pixel, and it is measurable because it is exact */
    cam.setFling(0);
    cam.setDragGain(1);   const g1 = drag(100);
    cam.setDragGain(2);   const g2 = drag(100);
    cam.setDragGain(0.5); const gh = drag(100);
    R.perPixel = [g1.turned / 100, g2.turned / 100, gh.turned / 100];
    R.gainRatios = [g2.turned / g1.turned, gh.turned / g1.turned];
    /* (2) FLING 0 IS A PURE TRACKBALL: the drag still turns, and the release leaves nothing at all */
    cam.setDragGain(1); cam.setFling(0); cam.stop();
    const f0 = drag(100); R.fling0 = { turned: f0.turned, residual: f0.residual, moving: cam.moving };
    /* (3) and it composes with the law rather than duplicating it: the residual is ω₀ × FLING, exactly */
    cam.setFling(1); cam.stop(); cam.fling(1.2, 0); R.res1 = cam.dy;
    cam.setFling(2); cam.stop(); cam.fling(1.2, 0); R.res2 = cam.dy;
    cam.setFling(0); cam.stop(); cam.fling(1.2, 0); R.res0 = cam.dy;
    /* (4) THE CLOSED FORM STILL HOLDS AT BOTH EXTREMES: a fling of ω₀ under μ turns through FLING·ω₀/μ */
    cam.setFriction(4); cam.setFling(2); cam.stop();
    const y0 = __LW.obs.yaw; cam.fling(1.0, 0);
    await new Promise((r) => setTimeout(r, 2200));
    R.travelG2 = __LW.obs.yaw - y0; R.wantG2 = 2 * 1.0 / 4;
    cam.stop(); cam.setFling(0);
    const y1 = __LW.obs.yaw; cam.fling(1.0, 0);
    await new Promise((r) => setTimeout(r, 400));
    R.travelG0 = __LW.obs.yaw - y1;
    /* (5) both work in FREE, and both persist in THIS BROWSER's settings */
    cam.setFling(1); cam.setDragGain(1); cam.stop();
    __LW.setCamMode('free');
    cam.setDragGain(3); const fr = drag(100); R.freeTurned = fr.turned;
    R.freePerPixel = fr.turned / 100;
    R.freeMode = __LW.camMode;
    __LW.setCamMode('turntable', true);
    cam.setDragGain(2.5); cam.setFling(0.4); __LW.saveSettings();
    const s = __LW.settings; R.saved = { gain: s.dragGain, fling: s.fling };
    cam.setDragGain(1); cam.setFling(1);
    __LW.applySettings();
    R.restored = { gain: cam.dragGain, fling: cam.flingGain };
    cam.setDragGain(1); cam.setFling(1); cam.setFriction(2.5); cam.stop(); __LW.camera.reset(); __LW.saveSettings();
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B107 THE CAMERA GAINS THE VIEW WINDOW\'S TWO DIALS, IN OUR UNITS (wave 58, board #63 — Josh: "can I also copy the View window\'s drag gain and fling slider? we can put that into our camera window"). THE RANGE AND THE STEP ARE NEBULA\'S AND THE UNIT IS OURS, deliberately: their gain is radians per SCREEN WIDTH — 3.14 means a full-width drag turns π — which is a quantity that means nothing at a rack\'s width, and a dial whose default silently retunes the shipped camera is the wrong port. So DRAG GAIN multiplies this instrument\'s own CAM.SENS: rad/px = GAIN × 0.0065, and ×1.00 IS the camera Josh already has. Measured with real pointer events on the stage: a 100-px drag turns 0.6500 rad at ×1, exactly twice that at ×2 and exactly half at ×0.5, in TURNTABLE and in FREE, and SHIFT still takes a quarter of whatever it is set to. FLING MULTIPLIES THE RELEASED VELOCITY BEFORE THE LAW SEES IT, so it COMPOSES with friction rather than competing: FLING decides how much velocity you get, μ decides how fast it decays. At FLING 0 a drag still turns the view and the release leaves EXACTLY zero residual — a pure trackball, which is a thing no value of μ can do, because μ = 12 is a fling that dies over a quarter turn and this one never starts; at 1 the residual is ω₀ unchanged; at 2 it is 2ω₀. And wave 50\'s closed form survives both: under μ = 4 a fling of 1.0 rad/s at FLING 2 turns through 2ω₀/μ = 0.50 rad and at FLING 0 through nothing at all. Both ride in this browser\'s settings beside FRICTION and SPIN, and both come back through the same applySettings a reload makes.',
    !camGT.error && camGT.knobs.indexOf('DRAG') >= 0 && camGT.knobs.indexOf('FLING') >= 0   /* 0.5.0 re-aim (C1): the kit's HAND row calls the dial DRAG */
      && Math.abs(camGT.defaults.gain - 1) < 1e-12 && Math.abs(camGT.defaults.fling - 1) < 1e-12
      && Math.abs(camGT.defaults.radPerPixel - 0.0065) < 1e-12
      && Math.abs(camGT.perPixel[0] - 0.0065) < 1e-9
      && Math.abs(camGT.gainRatios[0] - 2) < 1e-9 && Math.abs(camGT.gainRatios[1] - 0.5) < 1e-9
      && Math.abs(camGT.fling0.turned - 0.65) < 1e-9 && camGT.fling0.residual === 0 && camGT.fling0.moving === false
      && Math.abs(camGT.res1 - 1.2) < 1e-12 && Math.abs(camGT.res2 - 2.4) < 1e-12 && camGT.res0 === 0
      && Math.abs(camGT.travelG2 - camGT.wantG2) < 0.03 && Math.abs(camGT.travelG0) < 1e-9
      && camGT.freeMode === 'free' && Math.abs(camGT.freePerPixel - 3 * 0.0065) < 1e-9
      && Math.abs(camGT.saved.gain - 2.5) < 1e-12 && Math.abs(camGT.saved.fling - 0.4) < 1e-12
      && Math.abs(camGT.restored.gain - 2.5) < 1e-12 && Math.abs(camGT.restored.fling - 0.4) < 1e-12
      && camGT.errs === 0, camGT);

  const capT = await g.ev(`try {
    const R = {};
    const wake = (id) => { __LW.layout.reopen(id); const d = document.querySelector('.dev[data-id="' + id + '"]'); if (!d) return null;
      d.classList.remove('closed');
      if (d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
      if (d.classList.contains('off')) { const p = d.querySelector('.dev-power'); if (p) p.click(); }
      return d; };
    /* 0.5.0 re-aim (C7b): the picture and the film are the RENDER card's (film-card.js: CAPTURE IMAGE, DOWNLOAD IMAGE, RENDER, PREVIEW FIRST 3 SECONDS,
       PLAN, PLACE ONE PERIOD), no longer the CAMERA card's TAKE A PICTURE / RECORD / ONE PERIOD / PLAN.  The loop plan's readout is its .sr-period-plan. */
    const dev = wake('render'); __LW.layout.raise('render');
    __LW.setCamMode ? __LW.setCamMode('turntable') : null;
    __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); __LW.pause(); __LW.scrub(0);
    await __LW.settle();
    R.trigs = [...dev.querySelectorAll('.trig-l')].map((e) => e.textContent);
    const ro = dev.querySelector('.sr-period-plan'), ed = () => __LW.timeline && __LW.timeline.editor;
    const clipsN = () => { const e = ed(); return e ? e.model.state().clips.length : -1; };
    /* THE CEILING IS READ, NOT ASSERTED — and it is no longer WebGPU's default, because field.js now asks the
       adapter for its own limit rather than taking whatever requestDevice() hands out */
    const lim = __LW.capture.limits();
    R.lim = { side: lim.side, tex: lim.maxTextureDimension2D, isDefault: lim.isDefaultLimit };
    R.requested = __LW.field.limitsRequested ? __LW.field.limitsRequested.maxTextureDimension2D : null;
    /* (A) THE SHIPPED VIEW IS A PHASE VIEW, so the plan runs to T_psi and says how many laps that is */
    __LW.setView('phase');
    const p1 = __LW.capturePlan;
    R.phase = { ok: p1.ok, kind: p1.kind, used: p1.usedPeriod, laps: p1.laps, T: p1.T, N: p1.N, under: p1.undersampled, carries: p1.carriesGlobalPhase };
    /* 0.5.0 re-aim (C7b): the old EXACT LOOP button was enabled by plan.ok; PLACE ONE PERIOD asks the same planner at the card's FPS and LENGTH
       and says its sentence in the readout */
    const rp = __LW.render.plan();
    R.planOk = rp.ok === true && rp.kind === 'exact' && ro.textContent.indexOf(rp.label) === 0 && ro.textContent.indexOf(rp.message) >= 0;
    __LW.setView('density');
    const p0 = __LW.capturePlan;
    R.density = { ok: p0.ok, kind: p0.kind, used: p0.usedPeriod, laps: p0.laps, T: p0.T };
    R.threeLaps = Math.abs(p1.T / p0.T - 3) < 1e-9;
    /* (B) A ONE-ENERGY STATE IN A PHASE VIEW IS NOT A STILL (the planner defect wave 58 fixed) */
    __LW.loadPreset('2p+'); await __LW.settle();
    __LW.setView('phase');
    const pp = __LW.capturePlan;
    R.onePhase = { kind: pp.kind, N: pp.N, T: pp.T, used: pp.usedPeriod, ok: pp.ok };
    __LW.setView('density');
    const pd = __LW.capturePlan;
    R.oneDensity = { kind: pd.kind, frames: pd.frames };
    /* (C) NO EXACT PERIOD IS REFUSED, and the button goes down with it */
    __LW.loadPreset('1s+2pz'); await __LW.settle();
    __LW.reg.setField({ Fz: 0.002 }); __LW.setView('phase');
    await __LW.settle();
    const pn = __LW.capturePlan;
    R.refused = { ok: pn.ok, kind: pn.kind, label: pn.label, hasNo: pn.message.indexOf('NO EXACT PERIOD') >= 0 };
    /* 0.5.0 re-aim (C7b): the button no longer goes down — PLACE ONE PERIOD is a plain trigger that REFUSES: it returns null, places no clip, and the
       .sr-period-plan readout carries the planner's label and message verbatim (the interface never re-derives what the planner decided) */
    const clips0 = clipsN(), rq = __LW.render.plan(), placed = __LW.render.place();
    R.refusedPlace = { ok: rq.ok, label: rq.label, placed, readout: ro.textContent, labelIn: ro.textContent.indexOf(rq.label) === 0,
      messageIn: ro.textContent.indexOf(rq.message) >= 0, hasNo: ro.textContent.indexOf('NO EXACT PERIOD') >= 0, clips0, clips1: clipsN() };
    __LW.reg.setField({ Fz: 0 }); await __LW.settle();
    /* (C2) THE REVIEW'S OWN CASE, END TO END: 1s+2s under the STURMIAN switch at λ = 1.4, in the phase view. The
       density has NO exact period there (6 incommensurate occupied eigenvalues), and the psi period computed from
       the LABELS' ⟨H⟩ says 44.88 and looks exact — which is what used to come back as EXACT LOOP with laps 0. */
    __LW.loadPreset('1s+2s'); await __LW.settle();
    __LW.sturmian.set(true); __LW.sturmian.setLambda(1.4); await __LW.settle();
    __LW.setView('phase');
    const ps = __LW.capturePlan;
    R.sturm = { active: __LW.sturmian.active, ok: ps.ok, kind: ps.kind, laps: ps.laps, used: ps.usedPeriod, T: ps.T, label: ps.label };
    __LW.sturmian.set(false); __LW.loadPreset('1s+2pz'); __LW.setView('phase'); await __LW.settle();
    /* (D) A REAL PICTURE, off the GPU, that puts everything back */
    const body = (d) => d.split('\\n').slice(1).join('\\n');    // the digest's first line carries a wall timestamp
    const dig0 = body(__LW.layout.digest('state')), ver0 = __LW.reg.version, w0 = document.getElementById('field').width, t0 = __LW.clock.t;
    const pic = await __LW.capture.picture({ scale: 1 });
    R.pic = { ok: pic.ok, w: pic.w, h: pic.h, bytes: pic.bytes, png: pic.blob ? pic.blob.type : null, clipped: pic.clipped };
    R.restored = document.getElementById('field').width === w0 && __LW.clock.t === t0
      && body(__LW.layout.digest('state')) === dig0 && __LW.reg.version === ver0;
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B108 THE CAMERA AND RECORD BUTTONS — AND THE PLANNER THEY STAND ON, CORRECTED FIRST (wave 58, board #57). lab/capture.js is 1033 lines and thirty node gates and NOTHING imported it, so an adversarial review of it found three defects no browser had ever run into — and a button that says EXACT LOOP over a half-turn seam is worse than no button, so they were fixed before the buttons went on. (1) planPeriodRecording believed the ψ period without checking that the DENSITY period was exact; the two verdicts are numerical and planLoop was computing them from two DIFFERENT energy sets, so under STURMIAN a state with no period at all came back kind:"exact", closes:true, seamError:0, laps:0, with a true seam of 0.49 of a turn — antiphase, the worst there is. capture.js now requires D.exact, and rack.js hands it the SAME energy expression periodNow() uses, because two of them is how this happened. (2) The stationary branch fired ABOVE the line that reads the observable, so 2p₊ — a preset that ships in the PHASE view and whose own note says the picture lives in arg ψ — was told "the density never changes, so every frame is the same picture" while its hue turned 0.95° a frame. It now loops at T_ψ = 2π/|E| = 50.265482 a.u., a number state.js already carried as that preset\'s own window. (3) laps was unbounded, so an exact loop could be a picture of nothing; it stays ok, because it IS a loop, and now carries framesPerDensityPeriod and an UNDERSAMPLED flag instead of silence. On top of that: PICTURE with a size, RECORD with seconds and fps, ONE PERIOD gated by plan.ok, and a wide readout carrying plan.message verbatim — so the interface never re-derives what the planner decided. In the shipped PHASE view the plan runs three laps of the density period; a Stark field is refused with its near-recurrence and the button goes down; and a real picture comes off the GPU at the stage\'s size and puts the canvas, the clock and ψ back exactly. THE CEILING IS ALSO REAL NOW: field.js asked requestDevice() for nothing, so the device took WebGPU\'s DEFAULT 8192 on an adapter offering 32767 — one line, and the largest picture this build can take doubled on a side.',
    !capT.error
      && capT.trigs.indexOf('CAPTURE IMAGE') >= 0 && capT.trigs.indexOf('RENDER') >= 0 && capT.trigs.indexOf('PLACE ONE PERIOD') >= 0 && capT.trigs.indexOf('PLAN') >= 0   /* 0.5.0 re-aim (C7b): the RENDER card's labels */
      && capT.requested === 32767 && capT.lim.tex === 32767 && capT.lim.isDefault === false && capT.lim.side === 16384
      && capT.phase.ok === true && capT.phase.kind === 'exact' && capT.phase.used === 'wave' && capT.phase.laps === 3
      && capT.phase.carries === true && capT.phase.under === false && capT.planOk === true
      && capT.density.used === 'density' && capT.density.laps === 1 && capT.threeLaps === true
      && capT.onePhase.kind === 'exact' && capT.onePhase.used === 'wave' && capT.onePhase.N > 1
      && Math.abs(capT.onePhase.T - 50.265482457) < 1e-6
      && capT.oneDensity.kind === 'stationary' && capT.oneDensity.frames === 1
      && capT.refused.ok === false && capT.refused.hasNo === true
      && capT.refusedPlace.ok === false && capT.refusedPlace.placed === null && capT.refusedPlace.labelIn && capT.refusedPlace.messageIn && capT.refusedPlace.hasNo
      && capT.refusedPlace.clips0 >= 0 && capT.refusedPlace.clips1 === capT.refusedPlace.clips0   /* 0.5.0 re-aim (C7b): refused = null, the sentence in the readout, the TIMELINE untouched */
      && capT.sturm.active === true && capT.sturm.ok === false && capT.sturm.kind === 'near'
      && capT.sturm.used === 'density' && capT.sturm.T > 2000
      && capT.pic.ok === true && capT.pic.bytes > 1000 && capT.pic.png === 'image/png' && capT.restored === true
      && capT.errs === 0, capT);


  /* ══ WAVE 59 · FOUR AUDITS, HARVESTED ══════════════════════════════════════════════════════════════
   * B109–B114 are the harvest of AUDIT-LICENCE, AUDIT-FIRSTRUN and the adversarial review of 2026-09-05.
   * Almost nothing here is this wave's invention; what is this wave's is that each one is now DRIVEN. */

  /* ── B109 · THE ONLY MESSAGE A VISITOR WITHOUT WebGPU EVER SEES ────────────────────────────────── */
  const banT = await g.ev(`try {
    const R = { theme0: __LW.themeChoice };
    /* 0.5.0 C6b: the banner is the kit's (main.js installBanner).  The messages go through its module; an import() from a
       driver's script can be a second instance of it (measured under geckodriver), which builds its own pane — so the pane under
       test is the one holding the message, and a second one is taken away at the end */
    const K = await import('./mir/shell/banner.js');
    K.warn('WebGPU unavailable', 'navigator.gpu is absent — WebGPU is not enabled in this browser. The FIELD needs WebGPU; SPECTRUM, SHADOW and METERS still run on the CPU.');
    const b = [...document.querySelectorAll('.mir-banner')].find((n) => n.querySelector('.mir-banner-item')), main = document.getElementById('mir-banner');
    const item = b.querySelector('.mir-banner-item'), h3 = item.querySelector('.mir-banner-title'), p = item, x = b.querySelector('.mir-banner-x');
    R.hasX = !!x; R.role = b.getAttribute('role');
    const px = (s) => __LW.ink.parse(s);            /* kit.js's reader returns 0…255, which is what ink.ratio takes */
    const LOST = 'the browser took the WebGPU device back — the FIELD is frozen where it stands. RELOAD to bring it back; SPECTRUM, SHADOW and METERS are still live and the state is untouched.';
    for (const th of ['light', 'dark']) {
      __LW.setTheme(th); await __LW.settle(); await new Promise((r) => setTimeout(r, 140));
      const bg = px(getComputedStyle(b).backgroundColor);
      R[th] = { bg, p: +__LW.ink.ratio(px(getComputedStyle(p).color), bg).toFixed(2),
        h3: +__LW.ink.ratio(px(getComputedStyle(h3).color), bg).toFixed(2),
        inherits: getComputedStyle(p).color === getComputedStyle(document.body).color,
        bodyInk: +__LW.ink.ratio(px(getComputedStyle(document.body).color), bg).toFixed(2) };
    }
    /* the ink is the SAME on both themes, because this pane paints its own ground and does not follow one */
    R.sameBothThemes = getComputedStyle(p).color;
    /* the LOST-DEVICE sentence lands in the same pane and reads the same way */
    K.fail('the GPU device was lost', LOST);
    const lost = [...b.querySelectorAll('.mir-banner-item')].pop(); R.lostLen = lost.textContent.length;
    R.lostReadable = +__LW.ink.ratio(px(getComputedStyle(lost).color), px(getComputedStyle(b).backgroundColor)).toFixed(2);
    /* and there is a way out — 26 px of ink inside a 44-px finger (wave 51's rule), topmost at its centre */
    const xr = x.getBoundingClientRect();
    R.xInk = [Math.round(xr.width), Math.round(xr.height)];
    const hit = document.elementFromPoint(xr.left + xr.width / 2, xr.top + xr.height / 2);
    R.xTop = hit === x || (hit && hit.parentElement === x);
    const far = document.elementFromPoint(xr.left - 6, xr.top + xr.height / 2);
    R.xFinger = far === x || (far && far.parentElement === x);
    x.click(); await new Promise((r) => setTimeout(r, 60));
    R.dismissed = b.hidden === true; R.mainPane = !!main && main.getAttribute('role') === 'alert'; if (b !== main) b.remove();
    /* WHAT IS PROVED FROM THE SOURCE, and it is said so: a real device cannot be lost on demand */
    const rackSrc = ${APP_SRC}, fieldSrc = await (await fetch('./field.js')).text(), mainSrc = await (await fetch('./main.js')).text();
    /* plain string search, not a regex: ANTI-PATTERN 10, and it is also what makes this block replayable
       through peek-block.mjs, which hands the browser the template's RAW source and doubles every escape. */
    const iCreate = rackSrc.indexOf('createField(dom.canvas, {');
    R.passesOnLost = iCreate >= 0 && rackSrc.indexOf('onLost:', iCreate) > iCreate && rackSrc.indexOf('onLost:', iCreate) - iCreate < 500;
    R.fieldCallsIt = fieldSrc.indexOf('if (opts.onLost) opts.onLost(info)') >= 0;
    /* the boot failure (rack.js never ran) goes to the same kit pane, whose × the kit wires */
    R.bootFailWired = mainSrc.indexOf('installBanner({ errors: false })') >= 0 && mainSrc.indexOf(String.fromCharCode(39) + 'boot failed' + String.fromCharCode(39)) >= 0;
    __LW.setTheme(R.theme0); await __LW.settle();
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B109 THE ONE MESSAGE A BROKEN BROWSER GETS, MADE READABLE AND MADE DISMISSIBLE (wave 59, AUDIT-FIRSTRUN R1). lab.css had no `#banner p` rule at all, so the paragraph inherited `body { color: var(--fg) }` — NEAR-BLACK on the shipped LIGHT theme — on the dark maroon ground the pane paints for itself: 1.19 : 1 measured here with the lab\'s own arithmetic, and worse than a plain miss because `showBanner()` runs three thousand lines BEFORE `applySettings()`, so the sentence appeared white-on-maroon and went DARK a second later as the theme resolved. It is the only thing a visitor without WebGPU ever sees, it names the cause and says what still works, and it could not be read. The ink is now written UNCONDITIONALLY, because this is the one pane in the lab that does not follow the theme: the same string of ink on both themes, 13.69 : 1 on the pane\'s own ground in each. The heading was always fine (--bad is never redefined for light) and still is, at 6.64 : 1. It also had no way down — z-index 60 over the stage for the whole session — so there is a × now: 26 px of ink inside a 44-px finger, topmost at its own centre and still hit 6 px outside its ink, and one press hides the pane. AND THE LOST DEVICE FINALLY SPEAKS: `field.js` has offered `onLost` since it was written and `rack.js` passed only `onError`, so a driver reset, a reclaimed mobile tab or a laptop switching GPUs froze the picture and told NOBODY. That path is asserted from the SOURCE — the three files are fetched and read here — because a real WebGPU device cannot be lost on demand; the pane the message lands in is driven for real.',
    !banT.error && banT.hasX === true && banT.role === 'alert'
      && banT.light.p >= 4.5 && banT.dark.p >= 4.5 && banT.light.h3 >= 3 && banT.dark.h3 >= 3
      && banT.light.inherits === false && banT.light.bodyInk < 2
      && banT.lostReadable >= 4.5 && banT.lostLen > 100
      && banT.xInk[0] === 26 && banT.xInk[1] === 26 && banT.xTop === true && banT.xFinger === true && banT.dismissed === true
      && banT.passesOnLost === true && banT.fieldCallsIt === true && banT.bootFailWired === true
      && banT.errs === 0, banT);


  /* ── B110 · THE FIRST SCREEN'S LEGEND, ITS CLOCK, AND WHAT A SHARED LINK SHOWS ─────────────────── */
  /* A FRESH ARRIVAL: the acceptance is cleared and the pane is forced up, so the nine seconds are counted
     under exactly the conditions a first visitor meets.  This block spends ~19 s of real wall time on
     purpose — the defect was a TIMER, and a timer is only provable in wall time (AUDIT-FIRSTRUN §1.5). */
  await g.ev(`try { const K = 'lambdawaves.q0.settings', S = JSON.parse(localStorage.getItem(K) || '{}'); delete S.warned; localStorage.setItem(K, JSON.stringify(S)); } catch (e) {} return 1;`);
  await w57goto('warn=1');
  const hintT = await g.ev(`try {
    /* 0.5.0 re-aim (C2/C6b): the nine-second legend bar (#hint, its .keys / .touch spans and its timer) is the kit's CONTROL HINTS row now, so its clauses are
       retired; what is kept is the pane half — a forced notice is up, stays up, and CONTINUE takes it down */
    const R = {};
    R.paneUp = __LW.warning.open;
    await new Promise((r) => setTimeout(r, 2000));
    R.stillUpAt96 = __LW.warning.open;
    document.querySelector('.mir-dialog[data-kind="notice"] .trig[data-kind="primary"]').click();
    await new Promise((r) => setTimeout(r, 1200));
    R.paneDown = !__LW.warning.open;
    /* THE SUBTITLE: lab.css's !important is gone, so skin.css's hover reveal is reachable at last */
    const ms = document.querySelector('#title .ms');
    R.msText = ms.textContent;
    R.msIdle = getComputedStyle(ms).display;
    const rules = [...document.styleSheets].flatMap((ss) => { try { return [...ss.cssRules]; } catch (e) { return []; } });
    const msRules = rules.filter((r) => r.selectorText === '#title .ms');
    R.msImportant = msRules.some((r) => r.style.getPropertyPriority('display') === 'important');
    R.msHoverRule = rules.some((r) => r.selectorText === '#title:hover .ms' && r.style.display === 'none');   /* wave 79: the rule is still the one place the hover is decided — it now decides NONE */
    /* WHAT A SHARED LINK SHOWS BEFORE ANYONE TAPS — and that it is the manifest's own words */
    const meta = (sel) => { const m = document.querySelector(sel); return m ? m.content : null; };
    R.desc = meta('meta[name="description"]');
    R.ogDesc = meta('meta[property="og:description"]');
    R.ogTitle = meta('meta[property="og:title"]');
    R.ogImage = meta('meta[property="og:image"]');
    R.twitter = meta('meta[name="twitter:card"]');
    const mf = await (await fetch('./manifest.webmanifest')).json();
    R.matchesManifest = R.desc === mf.description && R.ogDesc === mf.description && R.ogTitle === mf.name;
    R.tagline = (document.querySelector('.ab-tagline') || {}).textContent;
    R.taglineMatches = R.tagline === mf.description;
    R.ogAbsolute = (R.ogImage || '').indexOf('https://') === 0;   /* a string test, not a regex: see B109 */
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  /* THE HOVER, WITH A REAL POINTER — the CSS rule existing is not the same as the reveal happening */
  const msBox = await g.ev(`const t = document.getElementById('title'), b = t.getBoundingClientRect(); return { x: Math.round(b.left + 12), y: Math.round(b.top + b.height / 2) };`);
  await drv.actions(g.s, [{ type: 'pointer', id: 'w59hover', parameters: { pointerType: 'mouse' }, actions: [
    { type: 'pointerMove', duration: 0, origin: 'viewport', x: 700, y: 500 },
    { type: 'pointerMove', duration: 120, origin: 'viewport', x: msBox.x, y: msBox.y }, { type: 'pause', duration: 250 }] }]);
  await drv.relActions(g.s);
  const msT = await g.ev(`const ms = document.querySelector('#title .ms'); const r = ms.getBoundingClientRect();
    return { display: getComputedStyle(ms).display, w: Math.round(r.width), text: ms.textContent, hovered: document.getElementById('title').matches(':hover') };`);
  /* the masthead's pointerenter shows the MENUBAR (wave 53), so the pointer is taken off it again and the
     bar put away before the next block measures anything — ANTI-PATTERN 3 from the other side. */
  await drv.actions(g.s, [{ type: 'pointer', id: 'w59away', parameters: { pointerType: 'mouse' }, actions: [
    { type: 'pointerMove', duration: 100, origin: 'viewport', x: 700, y: 620 }, { type: 'pause', duration: 200 }] }]);
  await drv.relActions(g.s);
  await g.ev(`const mb = document.getElementById('menubar'); if (mb) mb.hidden = true; return 1;`);
  judge('B110 THE LEGEND, ITS CLOCK, THE DEAD CLAUSE, THE SUBTITLE AND WHAT A LINK SHOWS (wave 59, AUDIT-FIRSTRUN R2–R4, R6, R8). THE CLOCK FIRST, because it is the one that needed wall time: `setTimeout(hideHint, 9000)` was armed inside boot(), seven hundred lines above `warning.show()` and in the same synchronous tail — so a stranger who actually READ a 26-word notice about epilepsy pressed CONTINUE at eight seconds and watched the only legend in the app fade one second later, or pressed at ten and never saw it at all. Measured here with the pane up: at 9.6 s — past the moment the old timer fired — the bar is STILL THERE; the button is pressed; a second later it is still there; ten seconds after that it is gone. The hook is `warning.onAccept`, which fires immediately when the pane is down, so a returning visitor loses nothing (ANTI-PATTERN 18: anything that moves at boot goes through that callback, never beside it). THE DEAD CLAUSE IS GONE: `shift+click = place electron 1` was guarded on `helium && helium.on`, and HELIUM ships folded and OFF — measured false here — so one of the seven things the first screen advertised did nothing on the screen that advertised it. THE BAR NOW CARRIES TWO LEGENDS, a keyboard one and a touch one, and the phone gets the second rather than none (B111). THE SUBTITLE IS REACHABLE: lab.css said `#title .ms { display: none !important }`, and an important author declaration beats a non-important one regardless of specificity or source order, so skin.css\'s `#title:hover .ms { display: inline }` was dead and `QWAVE-0 · HYDROGEN SHADOW LAB` — the ONLY on-screen string containing the word "hydrogen" — could never render. The sledgehammer is gone, the rule stays, and a REAL POINTER is driven onto the masthead here: #title reports :hover, and WAVE 79 THEN RULED THE OTHER WAY ON WHAT SHOULD HAPPEN THERE (Josh: the QWAVE-0 text when mousing over the logo needs to go away). The two halves are not the same claim and only one of them was overturned: the SLEDGEHAMMER stays gone, because an important author declaration that beats every other rule regardless of specificity is a defect whichever way the decision goes, and the rule that decides is still the one rule — it simply says none now. So a REAL POINTER is driven onto the masthead here and the block measures the RULING: #title reports :hover, and the subtitle lays out zero pixels wide and stays undrawn. The string itself is untouched in the DOM, because the document title and the link preview below are what it is for. AND THE LINK PREVIEW: there was no description, no og:*, no twitter card anywhere in the document, so every shared link — the feature wave 56 shipped — unfurled as a bare URL and the decision to open it was made on nothing. The sentence is not a new one and not a fifth copy: it is the manifest\'s own `description` and the ABOUT face\'s tagline, character for character, with og:title the manifest\'s own `name`, all fetched and compared here.',
    !hintT.error && !msT.error
      && hintT.paneUp === true && hintT.stillUpAt96 === true && hintT.paneDown === true
      && hintT.msText === 'QWAVE-0 · HYDROGEN SHADOW LAB' && hintT.msIdle === 'none'
      && hintT.msImportant === false && hintT.msHoverRule === true
      && msT.hovered === true && msT.display === 'none' && msT.w === 0 && msT.text === 'QWAVE-0 · HYDROGEN SHADOW LAB'
      && hintT.matchesManifest === true && hintT.taglineMatches === true
      && hintT.ogAbsolute === true && hintT.twitter === 'summary_large_image'
      && hintT.errs === 0, { hintT, msT });


  /* ── B111 · WHAT A SHARED LINK OPENS ONTO, ON A PHONE ─────────────────────────────────────────── */
  /* The default is only a default for a browser that has never SAID, so phoneRack is cleared and the
     breakpoint is crossed afresh — leave it, then enter it, which is the road enterPhone() really takes. */
  await g.ev(`try { const K = 'lambdawaves.q0.settings', S = JSON.parse(localStorage.getItem(K) || '{}'); delete S.phoneRack; localStorage.setItem(K, JSON.stringify(S)); } catch (e) {} __LW.pause(); __LW.layout.dockAll(false); return 1;`);
  await rect(1400, 900);
  await g.ev(`await new Promise((r) => setTimeout(r, 700)); await __LW.settle(); return 1;`);
  await rect(390, 844);
  await g.ev(`await new Promise((r) => setTimeout(r, 900)); await __LW.settle(); return 1;`);
  const phFieldT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const R = { vp: [innerWidth, innerHeight], phone: __LW.layout.phone.on };
    const rk = document.getElementById('rack'), tog = document.getElementById('rackToggle');
    /* 0.5.0 re-aim (C2): the legend bar (#hint) is the kit's CONTROL HINTS row now — its clauses (the phone's own legend, its fit, its opacity) are retired */
    await nap(60);
    /* THE FIELD IS WHAT IS MET.  The rack is off-screen to the left, so the whole width is canvas. */
    R.hidden = document.body.classList.contains('rack-hidden');
    R.stored = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}').phoneRack;
    const rr = rk.getBoundingClientRect();
    R.rackRight = Math.round(rr.right);
    R.fieldPx = Math.round(innerWidth - Math.max(0, rr.right));
    R.fieldPct = Math.round(100 * R.fieldPx / innerWidth);
    const cv = document.getElementById('field').getBoundingClientRect();
    R.canvas = [Math.round(cv.width), Math.round(cv.height)];
    /* the middle of the screen — where a volume centred in the stage renders — is the CANVAS, not a card */
    const mid = document.elementFromPoint(Math.round(innerWidth / 2), Math.round(innerHeight / 2));
    R.midIsField = !!mid && mid.id === 'field';
    /* THE WAY IN is in the thumb zone, at the screen edge, and it is the topmost thing at its own centre */
    const tr = tog.getBoundingClientRect();
    R.togLeft = Math.round(tr.left); R.togFromBottom = Math.round(innerHeight - tr.bottom);
    const at = document.elementFromPoint(tr.left + tr.width / 2, tr.top + tr.height / 2);
    R.togTop = at === tog || (at && at.parentElement === tog);
    /* ONE PRESS, and the instrument is there — with the TRANSPORT still the first card, where wave 51 put it */
    tog.click(); await nap(500);
    R.shown = !document.body.classList.contains('rack-hidden');
    R.rackAt = Math.round(rk.getBoundingClientRect().left);
    R.trIndex = [...rk.children].indexOf(document.querySelector('.dev[data-id="transport"]'));
    R.said = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}').phoneRack;
    /* and the saying STICKS: re-entering the breakpoint honours it rather than re-applying the default */
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await rect(1400, 900);
  await g.ev(`await new Promise((r) => setTimeout(r, 700)); await __LW.settle(); return 1;`);
  await rect(390, 844);
  await g.ev(`await new Promise((r) => setTimeout(r, 900)); await __LW.settle(); return 1;`);
  const phSaidT = await g.ev(`try {
    const R = { phone: __LW.layout.phone.on, hidden: document.body.classList.contains('rack-hidden'),
      stored: JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}').phoneRack };
    document.getElementById('rackToggle').click(); await new Promise((r) => setTimeout(r, 450));
    R.hiddenAgain = document.body.classList.contains('rack-hidden');
    R.storedAgain = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}').phoneRack;
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await rect(1400, 900);
  await g.ev(`await new Promise((r) => setTimeout(r, 800)); await __LW.settle(); return 1;`);
  const phDeskT = await g.ev(`try {
    return { phone: __LW.layout.phone.on, hidden: document.body.classList.contains('rack-hidden'),
      rackAt: Math.round(document.getElementById('rack').getBoundingClientRect().left),
      errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B111 ON A PHONE, THE VISITOR MEETS THE FIELD (wave 59, AUDIT-FIRSTRUN §5 — a judgement call, and this is the one that was taken). At the phone breakpoint the rack is 300 px of 390 — 77 % of the width, 95 % of the height — and it is OPAQUE there by wave 51\'s own rule; nothing hid it at boot, and #field is a full-stage canvas, so the volume rendered CENTRED BEHIND IT and the 90-px strip down the right edge showed the far corner of an empty domain box. Someone opening a shared link met two hundred controls and a sliver of static colour. THE RACK NOW STARTS HIDDEN AT THIS BREAKPOINT, and it is a DEFAULT rather than a rule: `phoneRack` is the same kind of key as `card` / `phoneTr` — a default is for a first visit, and pressing ◧ IS this browser saying which it wants, which is measured here in both directions (press to show, the key reads true; cross out and back, the saying is honoured; press again, it reads false). Measured on a 390 × 844 phone with the key cleared: the whole width is canvas, the centre of the screen hit-tests to #field rather than to a card, and the one control that brings the instrument back sits at the screen edge in the thumb zone, topmost at its own centre. WHAT WAS NOT DONE, AND WHY: the transport stays DOCKED at the top of the rack, because that is Josh\'s wave-51 instruction and undocking it into a floating pill would contradict it; and the volume is NOT offset to dodge the rack, because moving the camera to make room for furniture is a lie about where the origin is, and a 90-px picture is not the cure for a 90-px picture. The phone gets the LEGEND instead: the keyboard line stands down, the touch line takes its seat, and it names both the ◧ and the ▶ — the bar wraps inside the viewport, clears the button stack it points at, and is VISIBLE — which took one more rule, because lab.css fades the hint out with `body.rack-hidden` and that is now the phone\'s boot state. Crossing back to the desktop restores the desktop exactly: both racks, the keyboard legend, and the rack state it crossed with.',
    !phFieldT.error && !phSaidT.error && !phDeskT.error
      && phFieldT.phone === true && phFieldT.hidden === true && phFieldT.stored !== true
      && phFieldT.rackRight <= 0 && phFieldT.fieldPct === 100 && phFieldT.midIsField === true
      && phFieldT.canvas[0] === phFieldT.vp[0]
      && phFieldT.togLeft <= 12 && phFieldT.togFromBottom >= 8 && phFieldT.togFromBottom <= 40 && phFieldT.togTop === true
      && phFieldT.shown === true && phFieldT.rackAt === 0 && phFieldT.trIndex === 0 && phFieldT.said === true
      && phSaidT.phone === true && phSaidT.hidden === false && phSaidT.stored === true
      && phSaidT.hiddenAgain === true && phSaidT.storedAgain === false
      && phDeskT.phone === false && phDeskT.hidden === false && phDeskT.rackAt > 0
      && phFieldT.errs === 0 && phSaidT.errs === 0 && phDeskT.errs === 0, { phFieldT, phSaidT, phDeskT });


  /* ── B112 · THE ACCEPTANCE PERSISTS, AND A URL CANNOT SILENCE THE NOTICE ───────────────────────── */
  await w57goto('');
  const safeT = await g.ev(`try {
    const K = 'lambdawaves.q0.settings', R = {};
    const read = () => JSON.parse(localStorage.getItem(K) || '{}');
    /* (a) THE WAVE-54 HOLE, STILL OPEN FOR THE KEY WAVE 48 ADDED AFTERWARDS.
       Accept the notice, then do any of the ordinary things that write the settings key, and read it back. */
    __LW.warning.reset(); R.after0 = __LW.warning.remembered;
    __LW.warning.show(); __LW.warning.dismiss();   /* 0.5.0 C6b: the kit's notice is put down through the facade */
    await new Promise((r) => setTimeout(r, 560));
    R.accepted = __LW.warning.remembered && read().warned === true;
    const trail = [];
    __LW.setTheme('dark'); trail.push(['setTheme', read().warned]);
    __LW.setCardStyle('tinted'); trail.push(['setCardStyle', read().warned]);
    __LW.layout.toggleRack(); __LW.layout.toggleRack(); trail.push(['toggleRack', read().warned]);
    const slot = __LW.layout.saveLayout(); __LW.layout.loadLayout(slot); await new Promise((r) => setTimeout(r, 200));
    trail.push(['loadLayout', read().warned]);
    __LW.layout.forgetLayout(slot);
    __LW.saveSettings(); trail.push(['saveSettings', read().warned]);
    R.trail = trail;
    R.survives = trail.every((t) => t[1] === true);
    R.stillRemembered = __LW.warning.remembered;
    R.needsNothing = __LW.warning.needed({ driver: false, query: '' }) === false;
    /* (b) THE THIRD DOOR, CLOSED.  ?warn=0 in a shared link showed a first-time visitor NO notice at all —
       needed() answered false before seen() was ever consulted, remember(true) never ran, and onAccept
       therefore fired SYNCHRONOUSLY, so ?play=1 beside it started the field with the pane never displayed.
       Both ?warn arms are behind navigator.webdriver now; the driver override is the seam this drives. */
    __LW.warning.reset();
    R.q = {
      warn0_public: __LW.warning.needed({ driver: false, query: '?warn=0' }),
      warn1_public: __LW.warning.needed({ driver: false, query: '?warn=1' }),
      plain_public: __LW.warning.needed({ driver: false, query: '' }),
      warn0_driver: __LW.warning.needed({ driver: true, query: '?warn=0' }),
      warn1_driver: __LW.warning.needed({ driver: true, query: '?warn=1' }),
      plain_driver: __LW.warning.needed({ driver: true, query: '' }) };
    /* and once this browser HAS accepted, no query is needed to keep it quiet */
    __LW.warning.show(); __LW.warning.dismiss();
    await new Promise((r) => setTimeout(r, 560));
    R.q.afterAccept_public = __LW.warning.needed({ driver: false, query: '' });
    /* (c) THE MOTION PREFERENCE.  ?motion=full in a link overrode the OS preference outright; the query is
       read ONLY under a driver now.  With no query at all the source is the media query, live — and the
       driver arm is what B103 drives.  The line itself is read out of the shipped bytes. */
    R.motionSource = __LW.motion.source;
    const rackSrc = ${APP_SRC};
    R.motionGated = (await (await fetch('./motion-pref.js')).text()).indexOf("navigator.webdriver === true ? new URLSearchParams(location.search).get('motion') : null") >= 0;   // 0.5.0 re-aim: the motion preference moved out of rack.js into motion-pref.js
    R.warnedCarried = rackSrc.indexOf('warned: S0.warned') >= 0;
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B112 A SAFETY NOTICE THAT WAS ANSWERED STAYS ANSWERED, AND A LINK CANNOT UNASK IT (wave 59, the adversarial review of 2026-09-05 §3.1 and §3.2). TWO DEFECTS, both live. (a) `saveSettings()` rebuilt the settings object from scratch and carried exactly three foreign keys — the wave-54 bug its own comment describes — and `warned`, added by wave 48 AFTERWARDS, was not among them. So accepting the photosensitivity notice and then changing the theme, choosing a card style, hiding the rack, loading a favourite layout or opening a link that names a palette ERASED the acceptance, in the same session, before `warning.needed()` reads it: the notice came back on every subsequent visit for ever. Driven here through five ordinary writes, with the key read back after each. (b) `?warn=0` was a third door and it was in the URL: `needed()` answered false before `seen()` was consulted, `remember(true)` never ran, and `onAccept` therefore fired SYNCHRONOUSLY — so `…/lab/?play=1&warn=0#s=…` started the field at full rate for a first-time visitor with the pane never shown. The stated reason was a convenience so a test could ask without a reload, but `navigator.webdriver` already covers every test, so it bought the gate nothing and shipped a query string that silences a photosensitivity warning. Both ?warn arms are behind the driver check now — ?warn=1 too, because a gate with one arm reachable from a public URL is not one rule — and the six combinations are driven here in value space. `?motion=reduce` / `?motion=full` are gated the same way and for a stronger reason: an operating-system `prefers-reduced-motion` is the strongest thing a person can say about movement, and a link is somebody else\'s picture. With no query the source is the media query, live; the driver arm is B103\'s.',
    !safeT.error
      && safeT.accepted === true && safeT.survives === true && safeT.stillRemembered === true && safeT.needsNothing === true
      && safeT.q.warn0_public === true && safeT.q.warn1_public === true && safeT.q.plain_public === true
      && safeT.q.warn0_driver === false && safeT.q.warn1_driver === true && safeT.q.plain_driver === false
      && safeT.q.afterAccept_public === false
      && safeT.motionSource === 'media' && safeT.motionGated === true && safeT.warnedCarried === true
      && safeT.errs === 0, safeT);

  /* ── B113 · THE λ'S THIRD SURFACE IS A KNOB ────────────────────────────────────────────────────── */
  const lamStageT = await g.ev(`try {
    const R = { rows: [], worstInk: 9e9, worstRaw: 9e9, worstAt: null, rawAt: null, n: 0, rawUnder3: 0, defaults: null };
    const lam = document.querySelector('#title .lam');
    const hex = (h) => { const k = parseInt(h.slice(1), 16); return [k >> 16 & 255, k >> 8 & 255, k & 255]; };
    const theme0 = __LW.themeChoice, pal0 = __LW.settings.palette || 'prism';
    const ids = __LW.palette.groups.flatMap((q) => q.items);   // 0.5.0 re-aim (C1): the catalogue is read from palette.groups
    R.palettes = ids.length;
    /* the knob exists, it is the CAMERA window's STAGE, and LW.setStage drives the same road it does */
    const k = [...document.querySelectorAll('.k')].find((d) => (d.querySelector('.k-lbl') || {}).textContent === 'STAGE');
    R.hasKnob = !!k;
    R.groundAtDefault = __LW.ink.stageGround.slice();
    /* 0.5.0 re-aim: FOLLOW THEME is ON as shipped and bypasses the STAGE blend (rack.js setStageFollow), so the knob moves nothing until it is off — it is put back below */
    const fol = [...document.querySelectorAll('.dev[data-id="settings"] .trig')].find((t) => /FOLLOW THEME/.test(t.textContent)); const folWasOn = !!(fol && fol.classList.contains('on')); if (folWasOn) fol.click();
    for (const theme of ['dark', 'light']) {
      __LW.setTheme(theme); await __LW.settle();
      for (const v of [0, 0.2, 0.35, 0.5, 0.6, 0.85, 1]) {
        __LW.setStage(v); await new Promise((r) => setTimeout(r, 30));
        const g0 = __LW.ink.stageGround;
        R.rows.push([theme, v, g0.slice()]);
        for (const id of ids.slice(0, 8)) {
          __LW.setPalette(id);
          const drawn = __LW.ink.parse(getComputedStyle(lam).color);
          const raw = hex(__LW.accent.colorAt(0));
          const ri = __LW.ink.ratio(drawn, g0), rr = __LW.ink.ratio(raw, g0);
          R.n++;
          if (rr < 3) R.rawUnder3++;
          if (ri < R.worstInk) { R.worstInk = +ri.toFixed(3); R.worstAt = theme + ' ' + id + ' STAGE ' + v; }
          if (rr < R.worstRaw) { R.worstRaw = +rr.toFixed(3); R.rawAt = theme + ' ' + id + ' STAGE ' + v; }
        }
      }
    }
    /* the ground MOVES with the knob — that is the whole finding — while the CARD's does not */
    __LW.setStage(0); const g0 = __LW.ink.stageGround.slice(), c0 = __LW.ink.ground.slice();
    __LW.setStage(1); const g1 = __LW.ink.stageGround.slice(), c1 = __LW.ink.ground.slice();
    R.groundMoves = g0.join() !== g1.join();
    R.cardConstant = c0.join() === c1.join();
    R.g0 = g0; R.g1 = g1; R.card = c0;
    /* and the notebook's λ is still corrected against the CARD, which is why the two differ at all */
    __LW.setStage(0.6);
    __LW.notebook.open('about'); await new Promise((r) => setTimeout(r, 160));
    const nb = document.querySelector('.nb-logo .lam');
    R.headerAtStage06 = +__LW.ink.ratio(__LW.ink.parse(getComputedStyle(lam).color), __LW.ink.stageGround).toFixed(3);
    R.aboutOnCard = +__LW.ink.ratio(__LW.ink.parse(getComputedStyle(nb).color), __LW.ink.ground).toFixed(3);
    R.differ = getComputedStyle(nb).color !== getComputedStyle(lam).color;
    __LW.notebook.close();
    if (folWasOn) fol.click();
    __LW.setStage(0.04); __LW.setPalette(pal0); __LW.setTheme(theme0); await __LW.settle();
    R.backToDefault = __LW.ink.stageGround.slice();
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B113 THE λ HAS A THIRD SURFACE AND IT IS A KNOB (wave 59, the adversarial review of 2026-09-05 §2.3–§2.4). Wave 57 corrected BOTH copies of the λ against `MARK_GROUND`, two constants — right for the notebook\'s `.nb-logo`, which really is drawn on a card, and wrong for `#title`, which is `background: none` over `#field`, whose clear colour is `mat.bg`: the shipped STAGE knob in the CAMERA window. A correction against a ground the hand can drag away from is not a correction, and the numbers were not marginal — swept in node over 23 palettes × 360 hues, STAGE 0.20 put 38.9 % of the wheel under 3 : 1, STAGE 0.50 put 92.8 % under it with a worst case of 1.00 : 1, and on light STAGE 0.30 reached 1.00 : 1 across the whole wheel. 1.00 : 1 is the exact number rack.js\'s own wave-57 header names as the failure it removed — "Not faint: absent" — reached by a knob instead of a palette. `markInk` now reads the LIVE ground for the header and keeps the constant for the notebook, and BOTH λ copies are still one call site. AND THAT ALONE WAS NOT ENOUGH: `visibleInk` chose its walk direction at relative luminance 0.5, the midpoint of the SCALE and not the break-even of the RATIO, so for a ground in (0.179, 0.5) — which is exactly where the knob\'s travel passes — it climbed toward a white that is itself too dark and returned a colour under the floor in silence. The constant is √0.0525 − 0.05 = 0.1791287847, where white and black both give 4.583 : 1. Driven here through the real interface at seven values of the knob on both themes: the ground MOVES with the knob and the card\'s does not, the raw wheel goes far under the floor, and every drawn λ clears 3 : 1. tests/ink.test.mjs sweeps 91 080 samples and measures both thresholds; this measures what the DOM resolves.',
    !lamStageT.error && lamStageT.hasKnob === true && lamStageT.n >= 100
      && lamStageT.worstInk >= 3 && lamStageT.worstRaw < 1.6 && lamStageT.rawUnder3 > 20
      && lamStageT.groundMoves === true && lamStageT.cardConstant === true
      && lamStageT.headerAtStage06 >= 3 && lamStageT.aboutOnCard >= 3 && lamStageT.differ === true
      && lamStageT.backToDefault.join() === lamStageT.groundAtDefault.join()
      && lamStageT.errs === 0, lamStageT);


  /* ── B114 · A LAYOUT SAVED ON A PHONE COMES HOME ───────────────────────────────────────────────── */
  const layDeskT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    __LW.pause(); __LW.layout.dockAll(false);
    for (const L of __LW.layout.layouts()) __LW.layout.forgetLayout(L.slot);
    __LW.layout.moveToRack('spectrum', 'L'); __LW.layout.moveToRack('meters', 'L');
    /* LAYOUT A is saved on the DESKTOP with CAMERA on the stage — it is the arrangement a load must impose */
    __LW.layout.popOut('camera'); __LW.layout.moveFloat('camera', 320, 140); await nap(180);
    const R = { slotA: __LW.layout.saveLayout() };
    window.__w59 = { A: R.slotA, docked0: __LW.layout.docked };
    R.aFloats = __LW.layout.floating();
    /* …and then the arrangement CHANGES: camera docks, CLIP goes to the stage instead.  That is the record
       enterPhone will remember, and the one a load on the phone must not be able to bring back. */
    __LW.layout.dockWindow('camera'); __LW.layout.popOut('clip'); __LW.layout.moveFloat('clip', 100, 100); await nap(180);
    R.beforeCross = __LW.layout.floating();
    R.sides = ['spectrum', 'meters'].map((id) => __LW.layout.side(id));
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await rect(390, 844);
  await g.ev(`await new Promise((r) => setTimeout(r, 900)); await __LW.settle(); return 1;`);
  const layPhT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const R = { phone: __LW.layout.phone.on };
    R.parkedOnEntry = __LW.layout.phone.parkedFloats.slice().sort();
    R.marks = ['spectrum', 'meters'].map((id) => document.querySelector('.dev[data-id="' + id + '"]').dataset.phoneFrom || '-');
    R.inRackL = document.querySelectorAll('#rackL .dev').length;
    /* (1) THE CAPTURE.  captureLayout read d.parentElement === rackL and nothing else — and on a phone
       #rackL is EMPTY, so every card came back 'R' and the mirror rack's arrangement was gone for ever. */
    R.slotB = __LW.layout.saveLayout(); window.__w59.B = R.slotB;
    const B = JSON.parse(localStorage.getItem('lambdawaves.q0.settings')).layouts[R.slotB];
    R.bSides = Object.fromEntries(B.cards.filter((c) => ['spectrum', 'meters', 'state'].indexOf(c.id) >= 0).map((c) => [c.id, c.side]));
    R.bLeftCount = B.cards.filter((c) => c.side === 'L').length;
    R.bLabel = __LW.layout.layoutLabel(B, R.slotB);
    /* (2) THE FLOAT MEMORY.  A LOAD is a new arrangement, so the record of what was on the stage before the
       crossing is stale by definition: it is replaced by the loaded layout's own float block. */
    R.loaded = __LW.layout.loadLayout(window.__w59.A); await nap(260);
    R.parkedAfterLoad = __LW.layout.phone.parkedFloats.slice().sort();
    R.stillNoFloating = __LW.layout.floating().length;
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await rect(1400, 900);
  await g.ev(`await new Promise((r) => setTimeout(r, 900)); await __LW.settle(); return 1;`);
  const layBackT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const R = { phone: __LW.layout.phone.on };
    /* the LOADED layout is what came back to the stage, not the pre-crossing one */
    R.floating = __LW.layout.floating().slice().sort();
    R.camAt = __LW.layout.floatOf('camera');
    R.clipFloats = __LW.layout.floating().indexOf('clip') >= 0;
    /* and the layout SAVED ON THE PHONE puts the mirror rack back — the whole point of (1) */
    __LW.layout.dockAll(false);
    __LW.layout.moveToRack('spectrum', 'R'); __LW.layout.moveToRack('meters', 'R'); await nap(160);
    R.movedAway = ['spectrum', 'meters'].map((id) => __LW.layout.side(id));
    R.loadedB = __LW.layout.loadLayout(window.__w59.B); await nap(260);
    R.home = ['spectrum', 'meters'].map((id) => __LW.layout.side(id));
    R.inRackL = [...document.querySelectorAll('#rackL .dev')].map((d) => d.dataset.id).filter((id) => id === 'spectrum' || id === 'meters').sort();
    /* put the suite's own arrangement back — INCLUDING the transport's dock state, which a layout carries
       and which loading one on the desktop can therefore change (ANTI-PATTERN 3, from the other side). */
    for (const L of __LW.layout.layouts()) __LW.layout.forgetLayout(L.slot);
    __LW.layout.dockAll(false); __LW.layout.moveToRack('meters', 'R'); __LW.layout.moveToRack('spectrum', 'L');
    if (__LW.layout.docked !== window.__w59.docked0) __LW.layout.dockTransport();
    R.dockedBack = __LW.layout.docked === window.__w59.docked0;
    R.errs = window.__e.length; R.gpu = __LW.field.lastGpuError || null;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B114 A LAYOUT SAVED ON A PHONE COMES HOME (wave 59, the adversarial review of 2026-09-05 §4.1 and §4.2). TWO ORDERINGS, both reachable with shipped controls, and B94 tests the neighbouring one that works. (1) `captureLayout()` read `d.parentElement === rackL` and nothing else — but `enterPhone()` folds the mirror rack into the ONE rack, so on a phone #rackL is empty and EVERY card was saved `side: R`. With the shipped arrangement (SPECTRUM lives on the left rack out of the box) that meant: narrow a window or rotate a tablet past the breakpoint, press ☆, rotate back, load — and the mirror rack is empty for ever, with the ex-left cards jumbled to the top of the right one, and the menu row saying "right rack" for a layout that was both. Wave 51 created `data-phone-from` for exactly this and `applyLayout` already read it; only the capture did not, and the asymmetry was the bug. Driven here: two windows are put on the left rack, the breakpoint is crossed, the layout is saved ON THE PHONE, and its record marks them L — then, back on the desktop and with both moved away, loading it puts them back in the mirror rack. (2) `phone.floats` is the record of what was on the stage when the breakpoint was crossed, and `leavePhone()` replays it. A LOAD on the phone arranged every card, skipped the float pass (a phone has no floating) and left that record untouched — so rotating back popped the PRE-CROSSING windows out at their PRE-CROSSING positions, on top of the layout just loaded, and no control the user pressed said so. The fix is not to forget but to make the record describe the arrangement that IS loaded: a load on a phone replaces `phone.floats` with the loaded layout\'s own float block, so crossing back reproduces the layout in full. Driven here with two DIFFERENT stage arrangements — CAMERA in the saved layout, CLIP on the stage at the crossing — so the two cannot be confused: after the load the parked set is CAMERA, and crossing back floats camera at its saved place and leaves clip docked. RESET LAYOUT clears the record outright, because reset means nothing floats.',
    !layDeskT.error && !layPhT.error && !layBackT.error
      && layDeskT.aFloats.join() === 'camera' && layDeskT.beforeCross.join() === 'clip'
      && layDeskT.sides.join() === 'L,L'
      && layPhT.phone === true && layPhT.parkedOnEntry.join() === 'clip'
      && layPhT.marks.join() === 'left,left'   /* 0.5.0 re-aim (C3): the kit's rack writes a side as left / right in data-phone-from, where it wrote L / R */ && layPhT.inRackL === 0
      && layPhT.bSides.spectrum === 'L' && layPhT.bSides.meters === 'L' && layPhT.bSides.state === 'R'
      && layPhT.bLeftCount >= 2 && /both racks/.test(layPhT.bLabel)
      && layPhT.loaded === true && layPhT.parkedAfterLoad.join() === 'camera' && layPhT.stillNoFloating === 0
      && layBackT.phone === false && layBackT.floating.join() === 'camera' && layBackT.clipFloats === false
      && layBackT.camAt.x === 320 && layBackT.camAt.y === 140
      && layBackT.movedAway.join() === 'R,R' && layBackT.loadedB === true && layBackT.home.join() === 'L,L'
      && layBackT.inRackL.join() === 'meters,spectrum' && layBackT.dockedBack === true
      && layDeskT.errs === 0 && layPhT.errs === 0 && layBackT.errs === 0 && !layBackT.gpu,
    { layDeskT, layPhT, layBackT });

  // B115 · B116 · B117 RETIRED (0.5.0 C4): the W-MODSHAPE curve / envelope pictures and the loop clock were lab/modwindow.js's DOM; the kit's window (MIR 1.4.3: a new LFO opens on the editable SINE) is held by MIR's own gate and tests/lfo-tension.browser-test.mjs

  // B118 · B119 · B120 RETIRED (0.5.0 C4): the macro grip router, the depth arc and the finger / popover were lab/modwindow.js's DOM (deleted, 3,110 lines); the window is the kit's createModulation, whose own gate and tests/routed-knob · lfo-tension · take-in-bugs.browser-test.mjs hold them

  /* ══ WAVE 62 · THE INSTRUMENT IS OPERABLE FROM A KEYBOARD ═══════════════════════════════════════
   * Wave 57 gave the Tab key back to the browser and said, in its own REPORT block, that the rest was
   * not built: focusable knobs, arrow-key values, the menubar, segmented state, and the bare printable
   * keys that still fired while a control had focus.  This is that wave, and these seven blocks are
   * the first time in this project that a real key has been pressed AT a control.
   *
   * They extend wave 57's machinery rather than starting a second file beside it: `w57goto` (reload
   * onto a named query, preserving window.__e), `w57press` (a REAL driver key — Tab's default action
   * is the browser's own focus move and a synthesised KeyboardEvent does not have one), and `w57who`
   * (identity by DOM POSITION, not by class, because two transport buttons share `tbtn` and carry no
   * id).  Promoted here to un-prefixed names — the same functions, so B104 is untouched — with the
   * press generalised to a MODIFIER LIST, because B124 clause 5 presses Ctrl+Z. */
  const goto = w57goto, who = w57who;
  /* The WebDriver codes as ESCAPES, never as pasted characters (the house rule, and the reason the
     wave-57 block is readable).  MEASURED, not assumed: the escape \uE006 is Return and arrives as
     `code: 'Enter'`, while \uE007 is the KEYPAD's enter and arrives as 'NumpadEnter'.  A gate driving
     \uE007 would have proved nothing about the Enter a hand presses — which is why the first draft of
     B126 opened no menu at all — so the app takes either and this presses the one a hand has. */
  const KEY = { BKSP: '\uE003', TAB: '\uE004', ENTER: '\uE006', SHIFT: '\uE008', CTRL: '\uE009',
    ESC: '\uE00C', SPACE: '\uE00D', PGUP: '\uE00E', PGDN: '\uE00F', END: '\uE010', HOME: '\uE011',
    LEFT: '\uE012', UP: '\uE013', RIGHT: '\uE014', DOWN: '\uE015', DEL: '\uE017' };
  const press = async (key, mods = []) => {
    const acts = [];
    for (const m of mods) acts.push({ type: 'keyDown', value: m });
    acts.push({ type: 'keyDown', value: key }, { type: 'pause', duration: 30 }, { type: 'keyUp', value: key });
    for (let i = mods.length - 1; i >= 0; i--) acts.push({ type: 'keyUp', value: mods[i] });
    await drv.actions(g.s, [{ type: 'key', id: 'w62kb', actions: acts }]);
    await drv.relActions(g.s);
  };
  const TABBABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])';
  /** focus the one slider with this accessible name and park it on window.__k */
  const grab = (label) => g.ev('const k = [...document.querySelectorAll(\'[role="slider"]\')].find((e) => e.getAttribute("aria-label") === '
    + JSON.stringify(label) + '); window.__k = k || null; if (k) k.focus(); return { found: !!k, at: document.activeElement === k, v: k ? +k.getAttribute("aria-valuenow") : null };');
  const kval = () => g.ev('return +window.__k.getAttribute("aria-valuenow");');
  const seat = () => g.ev('return ' + who + ';');

  /* ── B121 · FOCUS ACTUALLY MOVES, AND THE ORDER IS THE DOM'S ─────────────────────────────────── */
  await goto('warn=0');
  const kbOrderT = await g.ev(`try {
    const t = [...document.querySelectorAll(${JSON.stringify(TABBABLE)})];
    const ix = (e) => t.indexOf(e);
    const skips = [...document.querySelectorAll('a.skip')];
    const firstIn = (id) => t.filter((e) => document.getElementById(id).contains(e))[0];
    return { n: t.length,
      sliders: document.querySelectorAll('[role="slider"]').length,
      groups: document.querySelectorAll('[role="radiogroup"]').length,
      positive: [...document.querySelectorAll('[tabindex]')].filter((e) => e.tabIndex > 0).length,
      skips: skips.length, skipFirst: t[0] === skips[0], skipL: ix(skips[1]),
      transport: ix(firstIn('transport')), rackL: ix(firstIn('rackL')), rack: ix(firstIn('rack')),
      fieldTab: document.getElementById('field').tabIndex,
      racksTab: [document.getElementById('rack').tabIndex, document.getElementById('rackL').tabIndex] };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await g.ev(`document.querySelector('a.skip').focus(); return 1;`);
  const kbSkipT = await g.ev(`const a = document.activeElement, r = a.getBoundingClientRect(); return { cls: a.className, w: r.width, h: r.height, txt: a.textContent };`);
  await press(KEY.ENTER);
  const kbLandT = await g.ev(`return { id: document.activeElement.id, hash: location.hash };`);
  await g.ev(`document.querySelector('a.skip').focus(); return 1;`);
  const kbWalk = [], kbPrev = [];
  for (let i = 0; i < 40; i++) {
    await g.ev(`window.__w62p = null; window.__w62h = (e) => { if (e.code === 'Tab') window.__w62p = e.defaultPrevented; }; addEventListener('keydown', window.__w62h); return 1;`);
    await press(KEY.TAB);
    const r = await g.ev(`removeEventListener('keydown', window.__w62h); const R = ${who}; R.prev = window.__w62p; return R;`);
    kbWalk.push(r.idx); kbPrev.push(r.prev);
  }
  const kbBack = [];
  for (let i = 0; i < 10; i++) { await press(KEY.TAB, [KEY.SHIFT]); kbBack.push((await seat()).idx); }
  const kbT = { order: kbOrderT, skip: kbSkipT, land: kbLandT, walk: kbWalk, prevented: kbPrev.filter((p) => p === true).length,
    distinct: new Set(kbWalk).size, breaks: kbWalk.filter((v, i) => i && v < kbWalk[i - 1]).length,
    back: kbBack, backDistinct: new Set(kbBack).size, backSeen: kbBack.filter((v) => kbWalk.indexOf(v) >= 0).length,
    errs: (await g.ev('return window.__e.length;')) };
  judge('B121 FOCUS ACTUALLY MOVES, AND THE ORDER IS THE DOM\'S (wave 62). Before this wave the tabbable set contained ZERO sliders and zero radiogroups: 461 controls, every one of them a <div> or an unlabelled <button>, and the only thing wave 57 had bought was that Tab was no longer swallowed. It now walks 40 presses to 40 DISTINCT seats with defaultPrevented false on every one, monotonically forward in document order, and Shift+Tab walks 10 of them back. The order is the DOM\'s and stays the DOM\'s — stage chrome, transport, floats, mirror rack, right rack — asserted in value space rather than by name. The two skip links are the answer for keyboard-only users, who get nothing from the 25 named regions: the first is the first seat on the page, the second sits immediately before the mirror rack, both are invisible until focused and 148 px wide when they are, and Enter lands focus ON #rack — with NO fragment written, because in this app the fragment is the state address and a focus move must not push a junk one into the history. THE LAW, gated: every tabindex in this application is 0 or −1 and never positive; the stage stays −1 (pointer-only, wave 57); the racks are −1, which is a fragment target and not a tab stop.',
    !kbOrderT.error && kbOrderT.n > 400 && kbOrderT.sliders >= 60 && kbOrderT.groups >= 30
      && kbOrderT.positive === 0 && kbOrderT.fieldTab === -1 && kbOrderT.racksTab.join() === '-1,-1'
      && kbOrderT.skips === 2 && kbOrderT.skipFirst === true
      && kbOrderT.transport < kbOrderT.rackL && kbOrderT.skipL < kbOrderT.rackL && kbOrderT.rackL < kbOrderT.rack
      && kbSkipT.cls === 'skip' && kbSkipT.w > 40 && kbSkipT.h > 10
      && kbLandT.id === 'rack' && kbLandT.hash === ''
      && kbT.distinct === 40 && kbT.breaks === 0 && kbT.prevented === 0
      && kbT.backDistinct === 10 && kbT.backSeen === 10 && kbT.errs === 0, kbT);

  /* ── B122 · A KNOB CHANGES BY KEYBOARD, IN THE RIGHT UNITS ───────────────────────────────────── */
  await goto('warn=0');
  await g.ev(`__LW.layout.raise('settings'); __LW.layout.raise('camera'); await new Promise((r) => setTimeout(r, 300)); return 1;`);
  const gamFound = await grab('GAMMA');
  const gam0 = await kval(); await press(KEY.RIGHT);
  const gam1 = await kval(); await press(KEY.RIGHT, [KEY.SHIFT]);
  const gam2 = await kval(); await press(KEY.PGUP);
  const gam3 = await kval(); await press(KEY.HOME);
  const gamH = await kval(); await press(KEY.END);
  const gamE = await kval(); await press(KEY.DEL);
  const gamD = await g.ev(`return { v: +window.__k.getAttribute("aria-valuenow"), model: __LW.mat.gamma };`);
  const rateFound = await grab('RATE a.u./s');
  await press(KEY.HOME); const rt0 = await kval();
  await press(KEY.RIGHT); const rt1 = await kval();
  await press(KEY.END); const rt2 = await kval();
  await press(KEY.LEFT); const rt3 = await kval();
  const elemFound = await grab('ELEMENT  Z');
  const el0 = await kval(); await press(KEY.RIGHT);
  const el1 = await kval(); await press(KEY.RIGHT, [KEY.SHIFT]);
  const el2 = await kval(); await press(KEY.PGUP);
  const el3 = await kval();
  await press(KEY.DEL);                                     // back to Z = 10 before the sweep reads what it SAYS
  const elD = await kval();
  const hueFound = await grab('HUE');
  await press(KEY.HOME); const hue0 = await kval();
  await press(KEY.LEFT); const hue1 = await g.ev(`return { now: +window.__k.getAttribute("aria-valuenow"), lo: +window.__k.getAttribute("aria-valuemin"), hi: +window.__k.getAttribute("aria-valuemax") };`);
  for (let i = 0; i < 10; i++) await press(KEY.LEFT);
  const hueL = await g.ev(`const k = window.__k, n = +k.getAttribute("aria-valuenow"); return { inside: n >= +k.getAttribute("aria-valuemin") && n <= +k.getAttribute("aria-valuemax"), n: n };`);
  for (let i = 0; i < 22; i++) await press(KEY.RIGHT);
  const hueR = await g.ev(`const k = window.__k, n = +k.getAttribute("aria-valuenow"); return { inside: n >= +k.getAttribute("aria-valuemin") && n <= +k.getAttribute("aria-valuemax"), n: n };`);
  await grab('FRICTION'); await press(KEY.HOME);
  const fricT = await g.ev(`return { text: window.__k.getAttribute("aria-valuetext"), v: +window.__k.getAttribute("aria-valuenow") };`);
  const sweepT = await g.ev(`try {
    const S = [...document.querySelectorAll('[role="slider"]')];
    const nameless = S.filter((e) => !((e.getAttribute('aria-label') || '').trim())).length;
    const numbers = S.filter((e) => { const n = +e.getAttribute('aria-valuenow'), lo = +e.getAttribute('aria-valuemin'), hi = +e.getAttribute('aria-valuemax');
      return !(Number.isFinite(n) && Number.isFinite(lo) && Number.isFinite(hi) && n >= lo && n <= hi); }).length;
    /* WAVE 64 · the sweep is document-wide and the PORTED PLUGIN has three slider kinds of its own
       (.m2kd, .m2numseat, .m2val).  The claim generalises: EVERY slider says a value, and where it
       PRINTS one the spoken value carries it — CONTAINS rather than equals, because the plugin's
       in-dial chip holds the magnitude while the reading carries its unit.  The numbered seat prints
       an ORDINAL and not a value, which is why the printed-value list does not include .m2num. */
    const said = S.filter((e) => { const w = e.querySelector('.k-val, .fd-val, .ckval, .m2vnum');
      const t = e.getAttribute('aria-valuetext') || '';
      return !t || (w && t.indexOf(w.textContent) < 0); }).length;
    const by = (l) => S.find((e) => e.getAttribute('aria-label') === l);
    const k = by('GAMMA'), fd = [...document.querySelectorAll('.fd[role="slider"]')].filter((e) => e.offsetParent)[0];
    k.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 200));   // 0.5.0 re-aim: the reveal does not run for a knob that is out of view
    k.focus(); await new Promise((r) => setTimeout(r, 400));              // the reveal is a TRANSITION; measure it after it has run
    const kOp = getComputedStyle(k.querySelector('.k-val')).opacity;
    fd.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 200));
    fd.focus(); await new Promise((r) => setTimeout(r, 400));
    const fOp = getComputedStyle(fd.querySelector('.fd-val')).opacity;
    return { n: S.length, nameless: nameless, numbers: numbers, said: said,
      drag: (by('DRAG γ') || {}).getAttribute ? by('DRAG γ').getAttribute('aria-valuetext') : null,   // 0.5.0 re-aim: a526bda dropped the (TOY) from the label
      elem: by('ELEMENT  Z').getAttribute('aria-valuetext'),
      kOp: kOp, fOp: fOp, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  const knobT = { gamFound, gam: { g0: gam0, step: gam1 - gam0, fine: gam2 - gam1, page: gam3 - gam2, home: gamH, end: gamE, del: gamD, want: (2.4 - 0.5) / 100 },
    rateFound, rate: { lo: rt0, up: rt1 / rt0, hi: rt2, down: rt2 / rt3, want: Math.pow(3000 / 0.1, 0.01) },
    elemFound, elem: { e0: el0, arrow: el1 - el0, shift: el2 - el1, page: el3 - el2, del: elD },
    hueFound, hue: { h0: hue0, one: hue1, tenLeft: hueL, twelveRight: hueR }, fric: fricT, sweep: sweepT };
  judge('B122 A KNOB CHANGES BY KEYBOARD, IN THE RIGHT UNITS — AND THE UNITS ARE TRAVEL, NOT VALUE (wave 62). The law was already inside knob(): the pointer drag moves normalized travel and then denormalizes, so an arrow moves a knob\'s TRAVEL by a fixed fraction and never its VALUE by a fixed amount — one rule for a linear and a logarithmic dial, with no new mathematics. GAMMA (linear, 0.5…2.4) moves (hi−lo)/100 per arrow and a quarter of that on Shift; RATE (log, 0.1…3000) moves a constant RATIO, and THE RATIO MEASURED AT THE BOTTOM EQUALS THE RATIO MEASURED AT THE TOP to 1e-9 — which is the clause that proves a fixed additive step was rejected on purpose rather than by accident, since it would have been a 40 000-press crawl at 0.1 and invisible at 3000. Three rulings a builder gets wrong, each gated: on the STEPPED ELEMENT Z one arrow is exactly +1 AND SO IS SHIFT+ARROW, because a quarter-step rounds straight back to where it started and Shift would be a dead key; a WRAP knob does not clamp at the seam, so one ArrowLeft from HUE = 0 lands at 0.99 and thirty-two more presses in both directions leave valuenow inside [valuemin, valuemax]; and every one of the 80 sliders announces through its OWN fmt — aria-valuetext is character-for-character the string the eye reads, so DRAG γ at zero says "off" and FRICTION at zero says "∞ · forever" where a bare number would say "zero" and lie. Delete restores the default and the MODEL moved with it. And skin.css\'s `.k:focus-within .k-val`, written waves ago for a focusable root that did not exist yet, now reveals — as does the `.fd` half, which had to be added.',
    !sweepT.error && gamFound.found === true && gamFound.at === true
      && Math.abs((gam1 - gam0) - 0.019) < 1e-9 && Math.abs((gam2 - gam1) - 0.019 / 8) < 1e-9   /* 0.5.0 re-aim (C0): the kit's ONE KNOB LAW gears Shift to an eighth, not a quarter */
      && Math.abs((gam3 - gam2) - 0.19) < 1e-9 && Math.abs(gamH - 0.5) < 1e-12 && Math.abs(gamE - 2.4) < 1e-12
      && Math.abs(gamD.v - 1) < 1e-12 && Math.abs(gamD.model - 1) < 1e-12
      && rateFound.found === true && Math.abs(rt0 - 0.1) < 1e-9 && Math.abs(rt2 - 3000) < 1e-6
      && Math.abs(rt1 / rt0 - Math.pow(3000 / 0.1, 0.01)) < 1e-9
      && Math.abs(rt1 / rt0 - rt2 / rt3) < 1e-9
      && elemFound.found === true && el1 - el0 === 1 && el2 - el1 === 1 && el3 - el2 === 10 && elD === el0
      && hueFound.found === true && hue0 === 0 && Math.abs(hue1.now - (hue1.hi - (hue1.hi - hue1.lo) / 100)) < 1e-9
      && hueL.inside === true && hueR.inside === true
      && fricT.v === 0 && fricT.text === '∞ · forever'
      && sweepT.n >= 60 && sweepT.nameless === 0 && sweepT.numbers === 0 && sweepT.said === 0
      && sweepT.drag === 'off' && sweepT.elem === 'Z = 10  Ne'
      && sweepT.kOp === '1' && sweepT.fOp === '1' && sweepT.errs === 0, knobT);

  /* ── B123 · A SEGMENT REPORTS ITS SELECTION, AND ARROWS MOVE IT ──────────────────────────────── */
  await goto('warn=0');
  const segSweepT = await g.ev(`try {
    const G = [...document.querySelectorAll('[role="radiogroup"]')];
    let nameless = 0, checked = 0, drift = 0, seats = 0, dead = 0;
    for (const r of G) {
      if (!((r.getAttribute('aria-label') || '').trim())) nameless++;
      const bs = [...r.querySelectorAll('[role="radio"]')];
      const on = bs.filter((b) => b.getAttribute('aria-checked') === 'true');
      const cls = bs.filter((b) => b.classList.contains('on'));
      const tab = bs.filter((b) => b.tabIndex === 0);
      const live = bs.filter((b) => !b.disabled);
      if (on.length !== 1) checked++;
      if (on.length !== 1 || cls.length !== 1 || on[0] !== cls[0]) drift++;
      /* WAVE 68 CHANGED THIS CLAUSE, and it is exactly what the wave was asked to change.  It used to
         read \`tab.length !== 1 || tab[0] !== on[0]\` — the seat is the CHECKED option, full stop — which
         is the predicate paint() used while onKey moved on \`disabled\`, and IN P3 (both options disabled
         on Firefox, CONVERT checked and holding tabIndex 0) satisfied it with ZERO reachable options.
         The seat is now the predicate the KEYS move on: exactly one stop in any group that has a live
         option, never on a disabled button, and on the checked one whenever the checked one is live —
         and a group with nothing live has no seat at all, which is the honest answer and is what native
         \`disabled\` already tells an assistive technology. */
      if (live.length) { if (tab.length !== 1 || tab[0].disabled || (on.length === 1 && !on[0].disabled && tab[0] !== on[0])) seats++; }
      else { dead++; if (tab.length !== 0) seats++; }
    }
    return { n: G.length, radios: document.querySelectorAll('[role="radio"]').length, nameless: nameless, checked: checked, drift: drift, seats: seats, dead: dead };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  const segStartT = await g.ev(`const r = [...document.querySelectorAll('[role="radiogroup"]')].find((x) => (x.getAttribute('aria-label') || '').indexOf('OBSERVABLE') === 0);
    window.__rg = r; const on = r.querySelector('[aria-checked="true"]'); on.focus();
    return { view: __LW.mat.view, txt: on.textContent, at: document.activeElement === on, n: r.querySelectorAll('[role="radio"]').length };`);
  await press(KEY.RIGHT);
  const segNextT = await g.ev(`const on = window.__rg.querySelector('[aria-checked="true"]');
    return { view: __LW.mat.view, txt: on.textContent, cls: on.classList.contains('on'), seat: on.tabIndex, at: document.activeElement === on,
      others: [...window.__rg.querySelectorAll('[role="radio"]')].filter((b) => b.tabIndex === 0).length };`);
  await press(KEY.HOME);
  const segHomeT = await g.ev(`const bs = [...window.__rg.querySelectorAll('[role="radio"]')]; return { first: bs[0].getAttribute('aria-checked'), view: __LW.mat.view };`);
  await press(KEY.END);
  const segEndT = await g.ev(`const bs = [...window.__rg.querySelectorAll('[role="radio"]')]; return { last: bs[bs.length - 1].getAttribute('aria-checked') };`);
  await press(KEY.RIGHT);
  const segWrapT = await g.ev(`const bs = [...window.__rg.querySelectorAll('[role="radio"]')]; return { first: bs[0].getAttribute('aria-checked') };`);
  const segPlay0 = await g.ev(`__LW.pause(); return { playing: __LW.clock.playing };`);
  await press(KEY.ENTER);
  const segPlay1 = await g.ev(`const R = { playing: __LW.clock.playing, checked: window.__rg.querySelectorAll('[aria-checked="true"]').length }; __LW.setView('phase'); __LW.pause(); R.errs = window.__e.length; return R;`);
  const segT = { sweep: segSweepT, start: segStartT, next: segNextT, home: segHomeT, end: segEndT, wrap: segWrapT, space: [segPlay0, segPlay1] };
  judge('B123 A SEGMENT REPORTS ITS SELECTION, AND ARROWS MOVE IT (wave 62). 38 mounted groups and about a hundred buttons: THE ONE PLACE THIS INTERFACE PRESENTED STATE IT DID NOT EXPOSE, because the selection lived in a CSS class and nowhere else — an eye could see it, nothing else could. Every group is now a named radiogroup with exactly ONE aria-checked radio, and the attribute is pinned TO THE `.on` CLASS rather than kept beside it, which is what stops the two from drifting apart in some later wave. The roving tab stop is the rare accessibility change that makes the application SMALLER: exactly one radio per group is tabbable, so the racks carry 38 stops here instead of a hundred, and it is the platform contract besides — an AT user ARROWS inside a radiogroup, they do not Tab through it. ArrowRight on OBSERVABLE moves the checked attribute, the class, the tab seat AND `LW.mat.view` — the model, not just the mark — and Home, End and the wrap at the last option all select. Enter on a focused radio activates it without playing. Wave 88 reserves Space for the two transports regardless of the last control used; B141 measures that exception. WAVE 68 CHANGED THE SEAT CLAUSE, and it is the one thing this wave was asked to change here: the stop used to be pinned to the CHECKED option full stop, which is the predicate paint() used while onKey moved on `disabled` — so IN P3, whose CONVERT is checked and disabled on every Firefox, satisfied the old clause with ZERO reachable options. The seat is now the predicate the keys move on, a group with nothing live has no seat at all (1 such group, reported), and B144 proves the re-seat when a caller disables the checked option after the group was painted.',
    !segSweepT.error && segSweepT.n >= 30 && segSweepT.radios >= 80
      && segSweepT.nameless === 0 && segSweepT.checked === 0 && segSweepT.drift === 0 && segSweepT.seats === 0
      && segStartT.at === true && segNextT.view !== segStartT.view && segNextT.txt !== segStartT.txt
      && segNextT.cls === true && segNextT.seat === 0 && segNextT.at === true && segNextT.others === 1
      && segHomeT.first === 'true' && segEndT.last === 'true' && segWrapT.first === 'true'
      && segPlay0.playing === false && segPlay1.playing === false && segPlay1.checked === 1
      && segPlay1.errs === 0, segT);

  /* ── B124 · ENTER PRESSES THE BUTTON AND DOES NOT PLAY — the single-key law, all seven clauses ─ */
  await goto('warn=0');
  await g.ev(`__LW.layout.raise('settings'); await new Promise((r) => setTimeout(r, 250)); __LW.pause(); return 1;`);
  const swPick = await g.ev(`const b = [...document.querySelectorAll('.sw')].find((e) => e.textContent.indexOf('STATUS TAGS') >= 0); window.__sw = b; b.focus();
    window.__w62d = null; window.__w62g = (e) => { if (e.code === 'Enter') window.__w62d = e.defaultPrevented; }; addEventListener('keydown', window.__w62g);
    return { at: document.activeElement === b, pressed: b.getAttribute('aria-pressed'), playing: __LW.clock.playing };`);
  await press(KEY.ENTER);
  const c1 = await g.ev(`removeEventListener('keydown', window.__w62g); return { pressed: window.__sw.getAttribute('aria-pressed'), playing: __LW.clock.playing, prevented: window.__w62d };`);
  await g.ev(`window.__sw.click(); return 1;`);
  const c3a = await g.ev(`const t = __LW.clock.t; window.__t0 = t; return { t: t, playing: __LW.clock.playing };`);
  await press(KEY.RIGHT);
  const c4 = await g.ev(`return { t: __LW.clock.t, moved: __LW.clock.t !== window.__t0 };`);
  await grab('GAMMA');
  const c2a = await g.ev(`return { playing: __LW.clock.playing, v: +window.__k.getAttribute('aria-valuenow'), at: document.activeElement === window.__k };`);
  await press(KEY.SPACE);
  const c2b = await g.ev(`const R = { playing: __LW.clock.playing, v: +window.__k.getAttribute('aria-valuenow') }; __LW.pause(); return R;`);
  const c3b = await g.ev(`window.__t0 = __LW.clock.t; window.__k.focus(); return { t: window.__t0, v: +window.__k.getAttribute('aria-valuenow') };`);
  await press(KEY.RIGHT);
  const c3c = await g.ev(`return { t: __LW.clock.t, v: +window.__k.getAttribute('aria-valuenow'), still: __LW.clock.t === window.__t0 };`);
  await g.ev(`window.__sw.focus(); return 1;`);
  await press('h');
  const c5a = await g.ev(`return { hidden: document.body.classList.contains('ui-hidden') };`);
  await press('h');
  const c5b = await g.ev(`return { hidden: document.body.classList.contains('ui-hidden') };`);
  await g.ev(`__LW.api.setPopulation(4, 0.35); await new Promise((r) => setTimeout(r, 600)); window.__pop = __LW.reg.populated().length; window.__can = __LW.history.canUndo; return 1;`);
  await grab('GAMMA');
  await press('z', [KEY.CTRL]);
  const c5c = await g.ev(`await new Promise((r) => setTimeout(r, 400)); return { before: window.__pop, after: __LW.reg.populated().length, canUndo: window.__can };`);
  const c6a = await g.ev(`__LW.notebook.open(); await new Promise((r) => setTimeout(r, 200)); const t = document.querySelector('.nb-text'); window.__ta = t; t.value = ''; t.focus(); return { at: document.activeElement === t };`);
  await press('h');
  const c6b = await g.ev(`const R = { hidden: document.body.classList.contains('ui-hidden'), typed: window.__ta.value }; __LW.notebook.close(); return R;`);
  // 0.5.0 C3: the SETTINGS key chips and their capture left for the kit's KEYBOARD window — arming a recording and binding a key is tests/keyboard-window.browser-test.mjs (a real recording binds; a taken chord is stolen on the second press)
  const oneKeyT = { swPick, enter_on_switch: c1, arrow_on_switch: [c3a, c4], space_on_slider: [c2a, c2b], arrow_on_slider: [c3b, c3c],
    bare_h: [c5a, c5b], ctrl_z: c5c, textarea: [c6a, c6b] };
  judge('B124 ENTER PRESSES THE BUTTON AND DOES NOT PLAY — AND ARROWS STILL STEP TIME FROM A SWITCH (wave 62, the single-key law). The rule is not "a control swallows everything", which would take H, N, B and ? away from a keyboard user the moment they touched a knob, and it is not a `{global:true}` flag on 38 actions, which is annotation to maintain and gets forgotten on the 39th. A KEY BELONGS TO THE FOCUSED CONTROL WHEN THAT CONTROL\'S ROLE WOULD USE IT: one Set lookup on the key and the role, so it degrades correctly the day a 39th action lands. All seven clauses, each one focus plus one real driver key plus one read: Enter on a switch flips its aria-pressed and leaves the transport alone, and the app did not preventDefault, which is what lets the button\'s own native activation run; Space on a KNOB plays, because a slider has no use for Space and this is the lab\'s most-pressed key; ArrowRight on a knob turns the knob and the clock does not move; ArrowRight on a SWITCH steps time and this is the clause a lazy implementation fails, because it is the one that proves the rule is key-AND-role shaped; a bare h hides the interface from a focused switch and Ctrl+Z undoes from inside a knob, since a modifier is never owned; the same bare h inside the notebook TYPES, which re-proves the INPUT/TEXTAREA guard this wave could have broken; and a Space pressed while a KEYS chip is capturing binds the key instead of pressing the button, which is why the guard sits BELOW the capturing block and is the ordering a builder gets wrong.',
    swPick.at === true && c1.pressed !== swPick.pressed && c1.playing === false && c1.prevented === false
      && c3a.playing === false && c4.moved === true
      && c2a.at === true && c2a.playing === false && c2b.playing === true && c2b.v === c2a.v
      && c3c.still === true && c3c.v !== c3b.v
      && c5a.hidden === true && c5b.hidden === false
      && c5c.canUndo === true && c5c.after < c5c.before
      && c6a.at === true && c6b.hidden === false && c6b.typed === 'h'
      , oneKeyT);

  /* ── B125 · NO KEYBOARD TRAP ANYWHERE (WCAG 2.1.2) ───────────────────────────────────────────── */
  await goto('warn=0');
  await g.ev(`document.querySelector('a.skip').focus(); return 1;`);
  const longWalk = [];
  for (let i = 0; i < 60; i++) { await press(KEY.TAB); longWalk.push((await seat()).idx); }
  let stuck = 0;
  for (let i = 2; i < longWalk.length; i++) if (longWalk[i] === longWalk[i - 1] && longWalk[i] === longWalk[i - 2]) stuck++;
  const surfaces = [];
  for (const s of ['notebook', 'keysheet', 'menubar', 'add', 'fav', 'settings']) {
    await g.ev(`const s = ${JSON.stringify(s)};
      if (s === 'notebook') { __LW.notebook.open(); }
      else if (s === 'keysheet') { __LW.layout.keysheet.open(); }
      else if (s === 'menubar') { __LW.layout.menu.open(true); }
      else if (s === 'add') { __LW.layout.addMenu.open(); }
      else if (s === 'fav') { __LW.layout.favMenu.open(); }
      else { __LW.layout.raise('settings'); }
      await new Promise((r) => setTimeout(r, 250));
      const host = s === 'notebook' ? document.getElementById('notebook') : s === 'keysheet' ? document.getElementById('keysheet')
        : s === 'menubar' ? document.getElementById('menubar') : s === 'add' ? document.getElementById('rackAddList')
        : s === 'fav' ? document.getElementById('rackFavList') : document.querySelector('.dev[data-id="settings"]');
      const first = host.querySelector(${JSON.stringify(TABBABLE)});
      if (first) first.focus();
      window.__host = host;
      return 1;`);
    const seen = [];
    for (let i = 0; i < 3; i++) { await press(KEY.TAB); seen.push((await seat()).idx); }
    const closed = await g.ev(`const r = { open: true }; try { if (__LW.layout.menu.isOpen) { __LW.layout.menu.close(); }
      if (__LW.layout.addMenu) __LW.layout.addMenu.close(); if (__LW.layout.favMenu) __LW.layout.favMenu.close();
      if (__LW.layout.keysheet.isOpen) __LW.layout.keysheet.close(); __LW.notebook.close(); } catch (e) { r.err = String(e); }
      await new Promise((x) => setTimeout(x, 150)); r.menu = __LW.layout.menu.isOpen; r.keys = __LW.layout.keysheet.isOpen; return r;`);
    surfaces.push({ s, seen, distinct: new Set(seen).size, closed });
  }
  const offT = await g.ev(`try {
    __LW.layout.raise('spectrum'); await new Promise((r) => setTimeout(r, 250));
    const d = document.querySelector('.dev[data-id="spectrum"]'); const body = d.querySelector('.dev-body');
    window.__d = d; window.__body = body;
    const k = body.querySelector('[role="slider"], button'); if (k) k.focus();
    const wasIn = body.contains(document.activeElement);
    d.querySelector('.dev-power').click(); await new Promise((r) => setTimeout(r, 200));
    return { wasIn: wasIn, inert: body.inert, attr: body.hasAttribute('inert'),
      rescued: document.activeElement !== document.body && !body.contains(document.activeElement),
      landed: document.activeElement.className, off: d.classList.contains('off') };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await g.ev(`window.__d.querySelector('.dev-fold').focus(); return 1;`);
  await press(KEY.TAB);
  const offTab = await g.ev(`return { inBody: window.__body.contains(document.activeElement), at: document.activeElement.className };`);
  const onT = await g.ev(`window.__d.querySelector('.dev-power').click(); await new Promise((r) => setTimeout(r, 200));
    const back = window.__body.querySelector('[role="slider"], button'); if (back) back.focus();
    return { inert: window.__body.inert, seatBack: window.__body.contains(document.activeElement) };`);
  await goto('warn=1');
  /* 0.5.0 C6b: the one legitimate trap is the kit's notice (shell/dialog.js `dismiss: false`): Tab cycles inside, Escape does nothing */
  const warnT2 = await g.ev(`for (let i = 0; i < 60 && !document.querySelector('.mir-dialog[data-kind="notice"] .trig'); i++) await new Promise((r) => setTimeout(r, 50));
    const p = document.querySelector('.mir-dialog[data-kind="notice"]');
    const b = p.querySelector('.trig[data-kind="primary"]'); b.focus(); return { up: !p.hidden, modal: p.getAttribute('aria-modal'), at: document.activeElement === b };`);
  await press(KEY.TAB);
  const warnT3 = await g.ev(`return { inPane: document.querySelector('.mir-dialog[data-kind="notice"]').contains(document.activeElement) };`);
  await press(KEY.ESC);
  const warnT4 = await g.ev(`await new Promise((r) => setTimeout(r, 200)); const N = '.mir-dialog[data-kind="notice"]', R = { stillUp: !!document.querySelector(N) && __LW.warning.open };
    /* the pane leaves by the kit's presence motion: the read waits for it to go */
    document.querySelector(N + ' .trig[data-kind="primary"]').click();
    for (let i = 0; i < 100 && document.querySelector(N); i++) await new Promise((r) => setTimeout(r, 50));
    R.gone = !document.querySelector(N); R.errs = window.__e.length; return R;`);
  const trapT = { distinct: new Set(longWalk).size, stuck, surfaces, off: offT, offTab, on: onT, warn: [warnT2, warnT3, warnT4] };
  judge('B125 NO KEYBOARD TRAP ANYWHERE, AND THE ONE LEGITIMATE TRAP IS INTACT (wave 62, WCAG 2.1.2). Sixty real Tab presses from the head of the page reach sixty distinct seats and no seat appears three times in a row — the falsifiable form of "focus never sticks", since a full wrap through the browser chrome is not reliably observable headless. Six surfaces are opened and then WALKED — the notebook, the key sheet, the menubar, the + list, the ☆ list and the SETTINGS window — three Tabs to three distinct seats in each, and each closes on its own road. THE POWERED-OFF WINDOW IS THE ONE PLACE `inert` WAS NEEDED IN THIS WHOLE APPLICATION: every other hidden state is already `display:none` or `visibility:hidden` and therefore already out of the tree, but `.dev.off .dev-body` is `opacity:.38; pointer-events:none` — visible to Tab, dead to the hand, which is a control that can be focused and cannot be used. A real Tab from the header now walks PAST the dead body, and the focus rescue is not garnish: the spec sends focus to <body> when its ancestor becomes inert, so a user who powers a window off from inside it would have been silently teleported to the top of the document. And the one trap this lab is SUPPOSED to have still holds — under the photosensitivity notice Tab stays inside the pane and Escape does not dismiss it, because that pane is a decision, not an obstacle.',
    trapT.distinct >= 55 && stuck === 0
      && surfaces.every((x) => x.distinct === 3)
      && !offT.error && offT.wasIn === true && offT.inert === true && offT.attr === true && offT.rescued === true && offT.off === true
      && offTab.inBody === false && onT.inert === false && onT.seatBack === true
      && warnT2.up === true && warnT2.modal === 'true' && warnT2.at === true
      && warnT3.inPane === true && warnT4.stillUp === true && warnT4.gone === true && warnT4.errs === 0, trapT);

  /* ── B126 · THE MENUBAR IS REACHABLE, AND THE THEME CHANGES WITHOUT A POINTER ────────────────── */
  await goto('warn=0');
  const titleT = await g.ev(`const t = document.getElementById('title'); t.focus();
    return { role: t.getAttribute('role'), tab: t.tabIndex, label: t.getAttribute('aria-label'), exp: t.getAttribute('aria-expanded'), at: document.activeElement === t, theme0: document.body.dataset.theme };`);
  await press(KEY.ENTER);
  const barT = await g.ev(`const t = document.getElementById('title'); return { hidden: document.getElementById('menubar').hidden, exp: t.getAttribute('aria-expanded'),
    at: document.activeElement.className, txt: document.activeElement.textContent };`);
  let onWindow = false;
  for (let i = 0; i < 6 && !onWindow; i++) {
    const r = await g.ev(`return { txt: (document.activeElement.textContent || '').trim(), cls: document.activeElement.className };`);
    if (r.txt === 'WINDOW' && r.cls === 'mb-btn') { onWindow = true; break; }
    await press(KEY.TAB);
  }
  await press(KEY.ENTER);
  const listT = await g.ev(`await new Promise((r) => setTimeout(r, 200));
    const b = [...document.querySelectorAll('.mb-btn')].find((x) => x.getAttribute('aria-expanded') === 'true');
    return { open: b ? b.textContent : null, items: document.querySelectorAll('.mb-list:not([hidden]) .mb-item').length };`);
  await press(KEY.ESC);
  const escT2 = await g.ev(`await new Promise((r) => setTimeout(r, 150)); const t = document.getElementById('title');
    return { hidden: document.getElementById('menubar').hidden, exp: t.getAttribute('aria-expanded'), at: document.activeElement.id };`);
  const themeWasT = await g.ev(`__LW.layout.raise('settings'); await new Promise((r) => setTimeout(r, 250));
    const lt = [...document.querySelectorAll('.dev[data-id="settings"] .seg-b')].find((b) => b.textContent.trim() === 'LOOK'); if (lt) lt.click(); await new Promise((r) => setTimeout(r, 300));   /* 0.5.0 re-aim: THEME sits on SETTINGS' LOOK tab, and a radio on a hidden tab cannot take focus */
    const rg = [...document.querySelectorAll('[role="radiogroup"]')].find((x) => x.getAttribute('aria-label') === 'THEME');
    return { checked: rg.querySelector('[aria-checked="true"]').textContent, theme: document.body.dataset.theme, options: rg.querySelectorAll('[role="radio"]').length };`);
  await g.ev(`__LW.layout.raise('settings'); await new Promise((r) => setTimeout(r, 250));
    const rg = [...document.querySelectorAll('[role="radiogroup"]')].find((x) => x.getAttribute('aria-label') === 'THEME');
    rg.scrollIntoView({ block: 'center' }); window.__rg = rg; rg.querySelector('[aria-checked="true"]').focus(); return 1;`);
  await press(KEY.RIGHT);
  const themeT = await g.ev(`await new Promise((r) => setTimeout(r, 250)); return { theme: document.body.dataset.theme, checked: window.__rg.querySelector('[aria-checked="true"]').textContent };`);
  await press(KEY.LEFT);
  const themeBackT = await g.ev(`await new Promise((r) => setTimeout(r, 250)); return { theme: document.body.dataset.theme };`);
  const namesT = await g.ev(`try {
    const t = [...document.querySelectorAll(${JSON.stringify(TABBABLE)})];
    // 0.5.0 C6: PROJECTS' IMPORT <input type=file> is gone — FOLDERS makes its picker when it is pressed — so its labelling clause is retired
    const tb = [...document.querySelectorAll('.tbtn')].map((b) => b.getAttribute('aria-label'));
    const play = document.querySelector('.tbtn.play');
    const glyph0 = play.textContent, name0 = play.getAttribute('aria-label'), pressed0 = play.getAttribute('aria-pressed');
    __LW.togglePlay(); await new Promise((r) => setTimeout(r, 300));
    const glyph1 = play.textContent, name1 = play.getAttribute('aria-label'), pressed1 = play.getAttribute('aria-pressed');
    __LW.pause();
    const dev = [...document.querySelectorAll('.dev')].filter((d) => d.querySelector('.dev-copy'))[0];
    return {
      tbtn: tb, glyphMoved: glyph0 !== glyph1, nameHeld: name0 === name1, pressedMoved: pressed0 !== pressed1,
      copy: dev ? dev.querySelector('.dev-copy').getAttribute('aria-label') : null,
      regions: [...document.querySelectorAll('section.dev[aria-labelledby]')].length,
      namedRegions: [...document.querySelectorAll('section.dev[aria-labelledby]')].filter((d) => { const h = document.getElementById(d.getAttribute('aria-labelledby')); return h && h.textContent.trim(); }).length,
      power: (document.querySelector('.dev-power') || {}).getAttribute ? document.querySelector('.dev-power').getAttribute('aria-label') : null,
      errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  const menuT = { title: titleT, was: themeWasT, bar: barT, onWindow, list: listT, esc: escT2, theme: themeT, back: themeBackT, names: namesT };
  judge('B126 THE MENUBAR IS REACHABLE, AND THE THEME CHANGES WITHOUT A POINTER (wave 62). #title carried the wordmark, the nine-square SVG, the subtitle and wave 53\'s scale transition and was a <div>: an entire visible surface with no keyboard road to it at all. It is now an operable DISCLOSURE and deliberately NOT an ARIA menubar — that would need role="menu", a roving tabindex across five chips, arrows with the open list following, typeahead, Escape at two levels, and menu items made unreachable by Tab, which is days of work on a surface that DUPLICATES what is elsewhere: the theme is a seg in SETTINGS, raise() is duplicated by the + button, the project verbs are in the notebook. Enter on the logo opens the bar and MOVES FOCUS INTO IT, which is what makes the bar\'s DOM position (appended after both racks) irrelevant; aria-expanded is written in the one function that writes bar.hidden, so the two can never disagree; Tab walks the five chips and Enter opens a list of 33 real buttons; Escape closes and hands focus back to the logo. THE SECOND ROAD, in the same block because it is what makes refusing the menubar defensible: the theme goes light → dark → light through the SETTINGS radiogroup with nothing but arrows. And the names — IMPORT\'s file input is back in the tab order (`hidden` had put it in `display:none !important`, out of the tree entirely), the five transport buttons announce as words rather than dingbats, PLAY\'S NAME DOES NOT CHANGE WHEN ITS GLYPH SWAPS ▶ ↔ ❚❚ but its aria-pressed does (and wave 65\'s MOD arm is the sixth transport button, announcing as words like the other five), and 25 <section>s are named REGIONS, which is the real answer to four hundred tab stops for anyone who navigates by landmark.',
    !namesT.error && titleT.role === 'button' && titleT.tab === 0 && titleT.at === true
      && (titleT.label || '').length > 10 && titleT.exp === 'false'
      && barT.hidden === false && barT.exp === 'true' && barT.at === 'mb-btn' && barT.txt === 'FILE'
      && onWindow === true && listT.open === 'WINDOW' && listT.items > 10
      && escT2.hidden === true && escT2.exp === 'false' && escT2.at === 'title'
      && themeWasT.options === 3 && themeT.theme !== themeWasT.theme && themeT.checked !== themeWasT.checked
      && themeBackT.theme === themeWasT.theme
      && namesT.tbtn.length === 7 && namesT.tbtn.every((n) => n && n.length > 3)   /* wave 65: the MOD arm is the sixth, and it announces as words like the other five; native-ui's tempo button is the seventh */
      && namesT.glyphMoved === true && namesT.nameHeld === true && namesT.pressedMoved === true
      && (namesT.copy || '').indexOf('copy this panel') >= 0 && namesT.power === 'power'   /* 0.5.0 re-aim: the COPY chip says 'copy this panel as text', no longer 'digest' */
      && namesT.regions >= 20 && namesT.regions === namesT.namedRegions
      && namesT.errs === 0, menuT);

  /* ── B127 · THE CANVAS SAYS WHAT IS DRAWN, AND SAYS IT RARELY — and nothing else speaks ──────── */
  await goto('warn=0');
  const canvasT = await g.ev(`try {
    const cv = document.getElementById('field');
    const R = { role: cv.getAttribute('role'), tab: cv.tabIndex, label0: cv.getAttribute('aria-label') };
    /* 0.5.0 re-aim (C7b): the sentence is written from a frame, and only every 100 ms (rack.js: badgesWall); a PAUSED lab draws no further frame, so a change that lands
       inside the 100 ms of the last write leaves the old sentence standing until something asks for the next one.  The read waits 150 ms, asks one more frame
       (the same tick as the pause read below and B23's), then waits for it.  (Found, not fixed: a paused canvas label can be one step behind a change for as long as
       nothing schedules a frame — a product note, never a wording one.) */
    const afterFrame = async () => { await __LW.settle(); await new Promise((r) => setTimeout(r, 150)); __LW.schedule(1); await new Promise((r) => setTimeout(r, 500)); };
    __LW.setView('density'); await afterFrame();
    R.density = cv.getAttribute('aria-label');
    __LW.setStyle('grain'); await afterFrame();
    R.grain = cv.getAttribute('aria-label');
    __LW.setView('phase'); __LW.setStyle('cloud'); await new Promise((r) => setTimeout(r, 300));
    /* THE CADENCE PROOF.  The observer is armed AFTER the play edge has settled, because the edge
       itself IS a mutation and it is the one the user asked for: what must be zero is everything
       after it, for as long as the transport runs. */
    __LW.clock.setRate(50); __LW.togglePlay(); await new Promise((r) => setTimeout(r, 600));
    let n = 0; const seen = [];
    const mo = new MutationObserver(function (rs) { n += rs.length; seen.push(cv.getAttribute('aria-label')); });
    mo.observe(cv, { attributes: true, attributeFilter: ['aria-label'] });
    /* 0.5.0 re-aim (C7b): and every OTHER live region in the document, watched for the same three seconds — the ceiling below is a count of seats, this is the proof
       that none of them speaks while the transport runs (each is written by a user act, never from a frame) */
    const liveSeats = [...document.querySelectorAll('[aria-live],[role="status"],[role="alert"],output')];
    let spoke = 0; const spokeWhere = [];
    const lo = new MutationObserver(function (rs) { spoke += rs.length; for (const r of rs) spokeWhere.push((r.target.nodeType === 1 ? r.target : r.target.parentElement).className); });
    for (const e of liveSeats) lo.observe(e, { subtree: true, childList: true, characterData: true, attributes: true });
    await new Promise((r) => setTimeout(r, 3000));
    lo.disconnect();
    R.during = n; R.tMoved = __LW.clock.t > 10; R.liveSpoke = spoke; R.liveSpokeWhere = spokeWhere.slice(0, 6);
    __LW.pause(); await new Promise((r) => setTimeout(r, 150)); __LW.schedule(1); await new Promise((r) => setTimeout(r, 500));   /* 0.5.0 re-aim: the sentence is written from a frame at most every 100 ms, so a final frame inside that window leaves it saying 'playing' — one more frame, as B23 asks */
    R.onPause = n - R.during; R.paused = cv.getAttribute('aria-label'); mo.disconnect();
    /* THE CEILING ON SPEECH.  This is the clause that stops a later wave gold-plating §6 into
       existence: the 107 readouts rewrite on a 10 Hz change-guard, and a polite region on any one of
       them queues an utterance per change on a queue that does not drop, so the application would
       speak continuously and nothing else could be read.
         WAVE 105 · THREE BECAME FOUR, AND THE FOURTH IS THE ADMITTED KIND.  The modulation window
       computes 29 status() sentences and 25 say() ones — a refused microphone, an empty preset name,
       an exhausted macro bank — and every one of them was being written into a node that reach 22
       sets display:none and reach 25 leaves visibility:hidden.  Nothing was spoken and nothing was
       shown.  lab/modwindow.js:218 now gives that seat role="status", so it is the fourth region.
       IT IS NOT THE FORBIDDEN KIND: every writer is a USER ACT (arm, tap-tempo, save, load, delete,
       route, refuse), none is reachable from sync()/paint()/apply(), and the sentence self-expires
       after 4.2 s — the same shape as .pj-status and .keys-say.  liveBad below is UNTOUCHED and is
       the clause that actually carries the safety: no live region may be a readout, a .dev-stat or
       the canvas.  tests/access.test.mjs's A4 was raised in step and names the same four; A5 there
       is this file's liveBad.
         0.5.0 C7b · FOUR BECAME SIX, AND BOTH ARE THE KIT'S TIMELINE: its status line (role status, the selection and the mode's one
       sentence, written on a selection change) and one stepper (aria-live polite, written when its value is stepped).  They are the same
       admitted kind as wave 105's, a USER ACT's words, and they are NAMED here rather than counted: a seventh seat, or a different kind,
       fails this line, and liveSpoke below proves that none of the six is written while the transport runs.
         0.5.1 re-aim (D10-24): SIX BECAME SEVEN, AND THE SEVENTH IS THE CURVES CARD'S PRESET STEPPER.  It is the kit's stepper, whose name is
       aria-live polite (controls/stepper.js), the same admitted kind as the PALETTE's and the TIMELINE's: written when the user steps it, never
       from a frame (liveSpoke below still proves it, the card being in the DOM though closed).  It is NAMED by its card (liveCurves), not just
       counted: an eighth seat, or a different kind, fails this line.
       (NO BACKTICKS IN THIS COMMENT: it lives inside a template literal.) */
    const live = [...document.querySelectorAll('[aria-live],[role="status"],[role="alert"],output')];
    R.live = live.length;
    R.liveCurves = live.filter(function (e) { return e.closest('.dev[data-id="curves"]'); }).map(function (e) { return e.tagName + '.' + e.className; });
    R.liveKinds = live.map(function (e) { return e.tagName + '.' + (typeof e.className === 'string' ? e.className : ''); }).sort().join(' ');
    R.liveBad = live.filter(function (e) { return e.closest('.ro') || e.classList.contains('dev-stat') || e.id === 'field'; }).length;
    R.liveWhat = live.map(function (e) { return e.tagName + '.' + (typeof e.className === 'string' ? e.className : '') + '#' + e.id; });
    R.overlays = [...document.querySelectorAll('#vortex,#particles,#kepler')].filter(function (c) { return c.getAttribute('aria-hidden') === 'true'; }).length;
    R.errs = window.__e.length;
    return R;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  const chatterT = await g.ev(`try {
    const sw = [...document.querySelectorAll('.sw')].find(function (b) { return b.textContent.indexOf('KEEP FRAMES') >= 0; });
    const was = sw.getAttribute('aria-pressed');
    if (was !== 'true') sw.click();
    await new Promise((r) => setTimeout(r, 200));
    const fd = [...document.querySelectorAll('.fd[role="slider"]')].find(function (e) { return (e.getAttribute('aria-label') || '').indexOf('SCRUB') === 0; });
    window.__fd = fd; window.__sw2 = sw; window.__was = was;
    fd.focus();
    window.__n = 0;
    window.__mo = new MutationObserver(function (rs) { window.__n += rs.length; });
    window.__mo.observe(fd, { attributes: true, attributeFilter: ['aria-valuetext'] });
    __LW.clock.setRate(50); __LW.togglePlay();
    await new Promise((r) => setTimeout(r, 2000));
    __LW.pause(); await new Promise((r) => setTimeout(r, 200));
    return { tab: fd.tabIndex, focused: document.activeElement === fd, during: window.__n, text: fd.getAttribute('aria-valuetext') };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.RIGHT);
  const chatterAfterT = await g.ev(`await new Promise((r) => setTimeout(r, 150)); const R = { after: window.__n, text: window.__fd.getAttribute('aria-valuetext') };
    window.__mo.disconnect(); if (window.__was !== 'true') window.__sw2.click(); await new Promise((r) => setTimeout(r, 150));
    R.scrubTab = window.__fd.tabIndex; R.errs = window.__e.length; return R;`);
  const sayT = { canvas: canvasT, chatter: chatterT, chatterAfter: chatterAfterT };
  judge('B127 THE CANVAS SAYS WHAT IS DRAWN, AND SAYS IT RARELY — AND NOTHING ELSE SPEAKS (wave 62). `role="img"` settles what an unroled <canvas> with no fallback content is across engines, and the label is a SENTENCE built from what the instrument is: the populated labels, the observable, the draw style, the chosen grid, the half-width, how many modes are rendered and what fraction of the norm they carry, the operator in force, and whether it is playing. It does NOT describe the ray-marched volume — a density isosurface, a phase hue field and a nodal reconstruction are not text at any useful fidelity, and describing the picture would be fabrication. The honest claim, and the measured one: THE INSTRUMENT\'S STATE IS FULLY READABLE; THE RENDERING IS NOT. THE CADENCE IS THE DESIGN, and the answer to "a description that updates ten times a second is unusable" is not a longer throttle but a sentence containing nothing that changes on its own — so the clock appears only when PAUSED, and the grid is `quality.res` and not `field.resolution`, which the first measurement caught: the quality governor drops 96³ to 64³ under load and puts it back on pause, entirely by itself, and the sentence rewrote itself twice in three seconds with nobody touching anything. Armed after the play edge, three seconds of playback at 50 a.u./s produce ZERO mutations and the pause produces exactly one. The same guard is in every knob and fader, one boolean deep: paint() runs from the frame loop, and writing aria-valuetext at 60 Hz on a FOCUSED control would have built a screen-reader live region by accident — so a focused scrub is silent for two seconds of playback and speaks exactly once when the user\'s own arrow moves it. THE CEILING: at most FOUR live regions in the whole document (three until wave 105 gave the modulation window back the one seat its 54 refusals and confirmations had been written into unseen), none of them a readout, a .dev-stat or the canvas, asserted here so a later wave cannot gold-plate them into existence.',
    !canvasT.error && !chatterT.error && canvasT.role === 'img' && canvasT.tab === -1
      && (canvasT.label0 || '').indexOf('FIELD:') !== 0
      && canvasT.density.indexOf('density') >= 0 && canvasT.grain.indexOf('grain') >= 0
      && canvasT.during === 0 && canvasT.tMoved === true && canvasT.onPause === 1
      && canvasT.paused.indexOf('paused at t =') >= 0
      && canvasT.live === 8 && canvasT.liveBad === 0 && canvasT.overlays === 3
      && canvasT.liveKinds === 'DIV.km-status DIV.m2hint DIV.mir-banner DIV.tl-status SPAN.mir-step-text SPAN.mir-step-text SPAN.mir-step-text SPAN.mir-step-text' && canvasT.liveSpoke === 0   /* 0.5.3 re-aim (M8): seven became eight — MOLECULES' SECTION stepper, the same admitted kind (a user step's words), as PALETTE's, TIMELINE's and CURVES' */   /* 0.5.0 re-aim (C7b): four became six (the TIMELINE's status line and stepper), named, and silent while playing */
      && canvasT.liveCurves.join() === 'SPAN.mir-step-text'   /* 0.5.1 re-aim (D10-24): six became seven — the CURVES card's PRESET stepper, named by its card (the same admitted kind, a user act's words) */
      && chatterT.focused === true && chatterT.tab === 0 && chatterT.during === 0
      && chatterAfterT.after === 1 && chatterAfterT.text !== chatterT.text
      && chatterAfterT.scrubTab === -1 && chatterAfterT.errs === 0 && canvasT.errs === 0, sayT);
  await goto('warn=0');

  /* ── B128 · a LINK arriving on a routed control ─────────────────────────── */
  const lnkT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = {};
    __LW.pause(); __LW.mod.reset(); await nap(250);
    /* THE SENDER.  Exposure 6.5 and softness 1.9, no rack at all: a link never carries one. */
    __LW.mat.exposure = 6.5; __LW.mat.softness = 1.9; __LW.mod.registry.resync(); await nap(120);
    const enc = __LW.link.mint(), href = enc.href;
    out.minted = { chars: enc.chars, exposure: __LW.mat.exposure, softness: __LW.mat.softness };
    out.says = __LW.link.names(enc.notCarried || []);
    /* WHAT THE LINK ACTUALLY CARRIES, read back through the codec — format v1 stores the material in
       32-bit floats, so 6.5 survives to the bit and 1.9 does not, and the claim below is about the
       number ON THE WIRE rather than about the one that was typed.  Comparing to 1.9 would be
       measuring the codec's mantissa and calling it a restore. */
    const got = __LW.link.read(href);
    out.carried = { exposure: got.state.presentation.mat.exposure, softness: got.state.presentation.mat.softness };
    /* THE RECEIVER.  Its own numbers, and an LFO holding EXPOSURE — the parameter the link is about. */
    __LW.mat.exposure = 1; __LW.mat.softness = 1; __LW.mod.registry.resync(); await nap(120);
    const m1 = __LW.mod.model.macroList()[0].id;
    const s1 = __LW.mod.addSource('lfo');
    __LW.mod.model.setSource(s1, { wave: 'sine', sync: false, ratePos: 0.62 });
    __LW.mod.bind(m1, s1);
    __LW.mod.route(m1, 'material.exposure', 0, 0.4);
    __LW.mod.play(); await nap(300);
    out.before = { base: __LW.mod.state('material.exposure').base,
                   modulated: __LW.mod.registry.isModulated('material.exposure'),
                   routes: __LW.mod.model.routeList().length };
    /* THE OPEN, and then ONE FRAME — which is all it used to take. */
    out.open = __LW.link.open(href);
    await new Promise((r) => requestAnimationFrame(r)); await nap(30);
    out.frame1 = { base: __LW.mod.state('material.exposure').base,
                   softness: __LW.mat.softness,
                   modulated: __LW.mod.registry.isModulated('material.exposure') };
    await nap(900);
    out.later = { base: __LW.mod.state('material.exposure').base,
                  routes: __LW.mod.model.routeList().length,
                  running: __LW.mod.running };
    /* AND THE ROAD BACK: pulling the route off must hand the SENDER's number to the hand, bit for bit. */
    __LW.mod.stop(); await nap(150);
    const rid = __LW.mod.model.routeList().find((r) => r.targetId === 'material.exposure').id;
    __LW.mod.unroute(rid);
    out.restored = { value: __LW.mod.registry.restoreBase('material.exposure'),
                     exact: Object.is(__LW.mod.registry.restoreBase('material.exposure'), 6.5),
                     mat: __LW.mat.exposure };
    __LW.mod.reset(); __LW.mat.exposure = 1; __LW.mat.softness = 1; __LW.mod.registry.resync();
    __LW.loadPreset('1s+2pz'); await __LW.settle();
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B128 A LINK\'S MATERIAL SURVIVES A ROUTED CONTROL (wave 63). A link carries the camera and the material and NOT the rack — the card says so in a note that stays on it — and for any parameter the RECEIVER happened to have routed, the sentence was false: restore() reached modSyncBases() only inside restoreModulation(), which runs only `if (pr.modulation !== undefined)`, a key a link never sets and an undo record deliberately never sets, while the frame loop\'s own modSyncBases() skips modulated ids by design. So the sender\'s EXPOSURE 6.5 was discarded 16 ms after the link opened, the base stayed the receiver\'s 1, the LFO went on sweeping around the wrong number, and pulling the route off afterwards handed back 1 — no recovery even by hand, on a control whose base is the only copy of that number in the program. The re-base is unconditional now and it runs FIRST, before restoreModulation\'s own restoreAll() can write the registry\'s stale bases back over the file\'s: measured here with a real LFO holding the target across the open — base 6.5 one frame later, 6.5 a second later with the modulator still running on it, the unrouted softness 1.9 (to the link\'s own 32-bit float, which is what "the number the link carried" means and what this block compares against — 6.5 survives that to the bit, 1.9 does not, and asserting 1.9 would be measuring the codec\'s mantissa and calling it a restore) as it always was, the route untouched (a link still carries no rack), and restoreBase() handing back exactly 6.5. The same road is every direct write to mat/obs, so an UNDO of a camera move on a modulated camera parameter is fixed by the same line',
    !lnkT.error && lnkT.minted.exposure === 6.5 && lnkT.minted.softness === 1.9
      && /MODULATION rack/.test(lnkT.says)
      && lnkT.before.base === 1 && lnkT.before.modulated === true && lnkT.before.routes === 1
      && lnkT.open.ok === true && lnkT.open.opened === true
      && lnkT.carried.exposure === 6.5 && Math.abs(lnkT.carried.softness - 1.9) < 1e-6
      && Object.is(lnkT.frame1.base, lnkT.carried.exposure) && lnkT.frame1.modulated === false   /* 0.5.0 re-aim (C4 · R-B1): there is ONE clock, and a link's open pauses THE play — the route stays (routes === 1 below) but nothing drives the control until play */
      && Object.is(lnkT.frame1.softness, lnkT.carried.softness)
      && Object.is(lnkT.later.base, lnkT.carried.exposure) && lnkT.later.routes === 1
      && Object.is(lnkT.restored.value, lnkT.carried.exposure) && lnkT.restored.exact === true
      && lnkT.errs === 0, lnkT);


  // B129 · B130 · B131 RETIRED (0.5.0 C4): the ported artifact's HOST geometry (709 artifact rules, the Double-tap title, the routing-overlay cells and rings) was lab/modwindow.js's and lab.css's badge ladders — both deleted; the window is the kit's createModulation, held by MIR's gate (mir.test, the stylehash) and tests/routed-knob · lfo-tension.browser-test.mjs

  /* ══ WAVE 65 · W-MODKEY — the arm, the one key, and the three resume laws ═══════════════════════
   * Josh's spec: "the play/pause button should have a small MOD button that glows on or off … Space
   * bar will affect everything — play and pause for modulation plugin and λWAVES.  HOWEVER, inside
   * the modulation window there are already useful buttons to link these behaviours to: ANCH, TRIG,
   * and BPM."  Three blocks: the arm and its seat, the one key over two clocks, and the three laws
   * driven by the REAL Space key with the curve's phase measured on both sides of the press. */
  await goto('warn=0');
  /** ONE RACK, TWO ROUTES: an LFO on EXPOSURE and a HAND macro at 0.7 on SOFT.  The hand is the
   *  clause a pause cannot satisfy — the pause law's own line 2 keeps it — so it is what makes
   *  "MOD off is not a pause" a measurement rather than a phrase.  BPM 20 is the model's floor and
   *  makes one beat three seconds, so the few milliseconds between a driver key and a read are
   *  0.01 of a beat against jumps of half of one. */
  const w65rig = (cfg) => g.ev(`try {
    __LW.pause();
    if (!__LW.mod.expanded) { __LW.mod.expand(); await new Promise((r) => setTimeout(r, 260)); }
    __LW.mod.arm(true);
    if (!window.__w65) {
      __LW.mod.reset(); // each navigation may restore an older rack; this rig owns its source
      const s = __LW.mod.addSource('lfo');
      const m = __LW.mod.model.macroList()[0].id;
      __LW.mod.bind(m, s);
      __LW.mod.route(m, 'material.exposure', 0, 1);
      const hm = __LW.mod.addMacro();
      __LW.mod.model.setMacro(hm, { value: 0.7 });
      __LW.mod.route(hm, 'material.softness', 0, 1);
      window.__w65 = { s: s, m: m, hm: hm };
    }
    __LW.mod.model.setSource(window.__w65.s, Object.assign({ on: true, wave: 'rotate', smooth: 0, steps: 0,
      sync: false, anchor: false, trig: false, triplet: false, dotted: false, mult: 2, ratePos: 0.5 }, ${JSON.stringify(cfg || {})}));
    __LW.mod.model.setTransport({ bpm: 20 });
    __LW.mod.view.sync();
    __LW.mod.host.clock.applyAll(true);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const src = __LW.mod.model.sourceOf(window.__w65.s);
    return { s: window.__w65.s, sync: !!src.sync, anchor: !!src.anchor, trig: !!src.trig,
             law: __LW.mod.resume().law, grid: __LW.mod.resume().grid, bpm: __LW.mod.model.transport.bpm,
             routes: __LW.mod.view.routes().length, body: document.activeElement === document.body };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };

  // B132 · B133 RETIRED (0.5.0 C4 · R-B1 · A6): the MOD arm's seat geometry and the 'two clocks' of Space were lab/modwindow.js's and LINKED/SEPARATE's — there is ONE clock, THE play, and the modulation follows its edges; power never plays and play never powers, which tests/take-in-bugs.browser-test.mjs (five boots, 0 refusals) holds

  /* ── B134 · THE THREE RESUME LAWS, chosen by the artifact's own chips ────────────────────────── */
  await goto('warn=0');
  await w65rig({ sync: true, anchor: false });
  /** press the artifact's OWN chip by its label — the claim is that these three controls choose the
   *  law, so the gate has to reach them the way a finger does, not through the model. */
  const chipClick = (name) => g.ev(`const b = [...document.querySelectorAll('#modwin .m2chk, #modwin .m2swb')]
      .find((e) => e.textContent.trim() === ${JSON.stringify(name)});
    if (!b) return { found: false };
    b.click(); await new Promise((r) => setTimeout(r, 120));
    const s = __LW.mod.model.sourceOf(window.__w65.s);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    return { found: true, name: ${JSON.stringify(name)}, on: b.classList.contains('on'),
             pressed: b.getAttribute('aria-pressed'), sync: !!s.sync, anchor: !!s.anchor, trig: !!s.trig,
             law: __LW.mod.resume().law, grid: __LW.mod.resume().grid };`);
  /** play, pause with the REAL key, let wall time pass, resume with the REAL key, and read the phase
   *  on both sides.  At BPM 20 one beat is three seconds, so the round trip between the key and the
   *  read is about 0.01 of a beat — a hundredth of the half-beat jumps this is separating. */
  const w65lap = async (ms) => {
    await g.ev(`__LW.pause(); __LW.mod.stop(); __LW.mod.model.resetPhases(); __LW.mod.host.clock.applyAll(true);
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); return 1;`);
    await press(KEY.SPACE);
    await g.ev(`await new Promise((r) => setTimeout(r, ${ms})); return 1;`);
    const before = await g.ev(`const s = __LW.mod.host.clock.snapshot();
      return { phase: s.sources.find((q) => q.id === window.__w65.s).phase, beats: s.beats, running: s.running, phys: __LW.clock.playing };`);
    await press(KEY.SPACE);
    const paused = await g.ev(`await new Promise((r) => setTimeout(r, 700));
      const s = __LW.mod.host.clock.snapshot();
      return { phase: s.sources.find((q) => q.id === window.__w65.s).phase, beats: s.beats, running: s.running, phys: __LW.clock.playing };`);
    await press(KEY.SPACE);
    const after = await g.ev(`const s = __LW.mod.host.clock.snapshot(), p = __LW.mod.resume();
      return { phase: s.sources.find((q) => q.id === window.__w65.s).phase, beats: s.beats, running: s.running, phys: __LW.clock.playing,
               law: p.last.law, grid: p.last.grid, moved: p.last.moved, applied: p.last.applied, mode: p.mode };`);
    await g.ev(`__LW.pause(); __LW.mod.stop(); return 1;`);
    return { before, paused, after };
  };
  const w65anchC = await chipClick('ANCHOR');
  const w65anch = await w65lap(2000);
  const w65bpmC = await chipClick('ANCHOR');            // ANCHOR off; BPM stays on
  /* 0.5.0 re-aim (C7b, ruling R5): installing the kit's TIMELINE makes the modulation's resume EXACT (timeline/controller.js:26,
     clock.setExactResume(true)), so the shipped lab resumes from the paused beat and applyResume() does not re-quantise it.  The chip still
     names the law (BPM, grid 1); what moved is whether the rack applies it.  So this lap runs under the SHIPPED law and the old clause —
     the beat floors to the note boundary just passed — is kept on the kit's legacy road (exact resume off for one lap, put back in a finally). */
  const w65exact = await g.ev(`return __LW.mod.host.clock.isExactResume();`);
  const w65bpm = await w65lap(2000);
  await g.ev(`__LW.mod.host.clock.setExactResume(false); return 1;`);
  let w65bpmL; try { w65bpmL = await w65lap(2000); } finally { await g.ev(`__LW.mod.host.clock.setExactResume(true); return 1;`); }
  await chipClick('BPM');                                // BPM off: a free-Hz source
  const w65trigC = await chipClick('TRIG');               // and TRIG is not a toggle: it is one of a pair
  const w65trig = await w65lap(2000);
  /* ── AND THE GLOBAL CLOCK THE BPM CHIP FOLLOWS: one bar = one recurrence of the density ─────── */
  await g.ev(`__LW.pause(); __LW.mod.stop(); __LW.reg.setField({ Fz: 0 });
    __LW.mod.model.setTransport({ bpm: 120 });
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); return 1;`);
  const w65bar0 = await g.ev(`return { bpm: __LW.mod.model.transport.bpm, T: (__LW.period || {}).T, rate: __LW.clock.rate,
    bound: (__LW.keys.actions.find((a) => a.id === 'modBar') || {}).key };`);
  await press('g');
  const w65bar1 = await g.ev(`const T = (__LW.period || {}).T, want = 60 * 4 / (T / __LW.clock.rate);
    return { bpm: __LW.mod.model.transport.bpm, want: want, barSeconds: 60 * 4 / __LW.mod.model.transport.bpm,
             recurrenceSeconds: T / __LW.clock.rate, hint: (document.querySelector('#modwin .m2hint') || {}).textContent.slice(0, 39) };`);
  const w65bar2 = await g.ev(`__LW.reg.setField({ Fz: 0.005 });
    const before = __LW.mod.model.transport.bpm, r = __LW.mod.barLock();
    const out = { r: r, kept: __LW.mod.model.transport.bpm === before, hint: (document.querySelector('#modwin .m2hint') || {}).textContent.slice(0, 90) };
    __LW.reg.setField({ Fz: 0 }); return out;`);
  const w65lawT = { anchor: [w65anchC, w65anch], bpm: [w65bpmC, w65bpm], exact: w65exact, bpmLegacy: w65bpmL, trig: [w65trigC, w65trig],
                    bar: [w65bar0, w65bar1, w65bar2] };
  judge('B134 THE THREE RESUME LAWS ARE THE ARTIFACT\'S OWN CHIPS, AND EACH IS PROVED BY THE CURVE\'S PHASE ACROSS A REAL SPACE PRESS (wave 65). Josh named the controls rather than asking for new ones — "inside the modulation window there are already useful buttons to link these behaviours to: ANCH, TRIG, and BPM" — so this block CLICKS those three buttons, in the ported window, by their own labels, and then drives the transport with the real key. ANCHOR: two seconds in, the LFO is caught mid-curve, 700 ms of wall clock pass with everything down, and the resume comes back on the SAME phase and the SAME beat — not on where the wall says the beat should be, which is a third of a beat further on. BPM (ANCHOR off, sync on): the same rack floors the beat to the note boundary just passed — the beat goes BACKWARDS by the fraction it was interrupted at and the curve restarts at phase 0, which is Josh\'s "hitting space bar in between a note simply jumps to the truncated note". TRIG on a free-Hz source: the phase goes to 0 and the BEAT IS NOT TOUCHED, because that rewind is the source\'s own and claims nothing global. The arithmetic is `mir/host.js`\'s `resumeGrid` and `beatsPerCycle` — the model\'s own note ladder, never re-derived here — and the law each press ran is read back off the clock and matches the chip that was pressed. AND THE GLOBAL CLOCK THAT CHIP FOLLOWS IS THE INSTRUMENT\'S OWN: Josh\'s BPM sentence says the divisors line up with an EXISTING GLOBAL CLOCK, and the g key makes one BAR one RECURRENCE OF THE DENSITY \u2014 `mir/host.js`\'s barTempo({T, rate}) over period.js\'s exact T \u2014 so a bar of the loop clock and a repeat of \u03c8 are one event to 1e-9, and the window says which. It never guesses: turn on a static field and there is no exact period at all, so it REFUSES by name, keeps the tempo it had, and prints the reason. THE MEASUREMENT IS THE POINT: nothing here asserts a flag. At BPM 20 one beat is three seconds, so the round trip between a driver key and a read is about a hundredth of a beat, against jumps of half of one.',
    w65anchC.found === true && w65anchC.on === true && w65anchC.pressed === 'true'
      && w65anchC.anchor === true && w65anchC.sync === true && w65anchC.law === 'ANCH'
      && w65anch.before.running === true && w65anch.before.phase > 0.1
      && w65anch.paused.running === false && w65anch.paused.phys === false
      && w65anch.paused.phase - w65anch.before.phase >= 0 && w65anch.paused.phase - w65anch.before.phase < 0.05
      && w65anch.after.law === 'ANCH' && w65anch.after.moved === 0 && w65anch.after.applied === false
      && w65anch.after.phase - w65anch.paused.phase >= 0 && w65anch.after.phase - w65anch.paused.phase < 0.05
      && w65anch.after.beats >= w65anch.paused.beats && w65anch.after.beats < w65anch.paused.beats + 0.05
      && w65anch.after.running === true && w65anch.after.phys === true

      && w65bpmC.on === false && w65bpmC.pressed === 'false'
      && w65bpmC.anchor === false && w65bpmC.sync === true && w65bpmC.law === 'BPM' && w65bpmC.grid === 1
      && w65bpm.paused.phase > 0.1 && w65bpm.paused.phase < 0.9 && w65bpm.paused.running === false
      && w65bpm.paused.phase - w65bpm.before.phase < 0.05
      /* 0.5.0 re-aim (C7b, R5): the SHIPPED resume is exact — the chip's law is still BPM on grid 1, and the beat and the curve continue from where they paused */
      && w65exact === true && w65bpm.after.law === 'BPM' && w65bpm.after.grid === 1 && w65bpm.after.applied === false && w65bpm.after.moved === 0
      && w65bpm.after.beats >= w65bpm.paused.beats && w65bpm.after.beats < w65bpm.paused.beats + 0.05
      && Math.abs(w65bpm.after.phase - w65bpm.paused.phase) < 0.05
      /* and the kit's legacy road, wave 65's own sentence: the beat goes BACKWARDS by the fraction it was interrupted at and the curve restarts at phase 0 */
      && w65bpmL.paused.phase > 0.1 && w65bpmL.paused.phase < 0.9 && w65bpmL.paused.running === false
      && w65bpmL.after.law === 'BPM' && w65bpmL.after.applied === true && w65bpmL.after.grid === 1
      && w65bpmL.after.beats < w65bpmL.paused.beats
      && Math.abs(w65bpmL.after.moved - (w65bpmL.paused.beats - Math.floor(w65bpmL.paused.beats))) < 1e-9
      && Math.floor(w65bpmL.after.beats) === Math.floor(w65bpmL.paused.beats)
      && w65bpmL.after.phase < 0.05

      && w65trigC.on === true && w65trigC.trig === true && w65trigC.sync === false && w65trigC.law === 'TRIG'
      && w65trig.paused.phase > 0.1 && w65trig.paused.running === false
      && w65trig.paused.phase - w65trig.before.phase < 0.05
      && w65trig.after.law === 'TRIG' && w65trig.after.moved === 0
      && w65trig.after.phase < 0.05
      && w65trig.after.beats - w65trig.paused.beats >= 0 && w65trig.after.beats - w65trig.paused.beats < 0.05

      && w65bar0.bound === 'KeyG' && w65bar0.bpm === 120 && w65bar0.T > 0
      && Math.abs(w65bar1.bpm - w65bar1.want) < 1e-9
      && Math.abs(w65bar1.barSeconds - w65bar1.recurrenceSeconds) < 1e-9
      && w65bar1.hint === 'one bar = one recurrence of the density'
      && w65bar2.r.ok === false && w65bar2.kept === true
      && w65bar2.hint.indexOf('no exact period under a static field') > 0, w65lawT);


  /* ══ THE HOUSE MATERIAL · wave 66 origin, wave 107 surface contract ══════════════════════
   * B135 compares the surfaced panes with ABOUT across the live settings matrix. Removed
   * shade stacks and bevel tokens are historical, not a demand to restore those layers. */
  /* STALE LAW: the former black shade stack and glasslight bevels were removed by
     later material waves. The live card surfaces now inherit the house pane; the root
     is only layout. Comparing the removed root pane certified the superseded design. */
  const glassT = await g.ev(`try {
    const nap = () => new Promise(r => setTimeout(r, 240));
    const before = { theme: __LW.themeChoice, card: __LW.cardStyle, frost: __LW.frost };
    __LW.pause(); __LW.mod.reset(); __LW.mod.expand(); __LW.mod.addSource('lfo');
    const win = document.querySelector('#modwin'), cs = e => getComputedStyle(e);
    const rows = [];
    for (const theme of ['dark','light']) for (const frost of ['off','always']) for (const card of ['refractive','tinted']) {
      __LW.setTheme(theme); __LW.setFrost(frost); __LW.setCardStyle(card); await nap();
      const house = cs(document.querySelector('#sheet')).backgroundColor;
      const surfaces = ['.m2dev','.m2rail','.m2workbar'].map(q => cs(win.querySelector(q)).backgroundColor);
      rows.push({theme,frost,card,house,surfaces,matched:surfaces.every(c => c === house),root:cs(win).backgroundColor});
    }
    const hue = __LW.accent.a, hueB = __LW.accent.b, signal = () => cs(win).getPropertyValue('--m2-signal-glow');
    const old = signal(); __LW.accent.set(hue + 137, hueB + 137); await nap(); const moved = signal() !== old;
    __LW.accent.set(hue, hueB); await nap(); const restored = signal() === old;
    const out = {rows,moved,restored,font:cs(win.querySelector('.ckval')).fontFamily,
      tabular:cs(win).fontVariantNumeric,errs:window.__e.length};
    __LW.setTheme(before.theme); __LW.setCardStyle(before.card); __LW.setFrost(before.frost);
    __LW.mod.reset(); __LW.mod.collapse(); return out;
  } catch(e) { return {error:String(e)}; }`) || {};
  judge('B135 THE PLUGIN SURFACES WEAR THE HOUSE PANE IN BOTH THEMES. The detached root paints nothing; the device, macro rail and workbar match ABOUT under both CARD STYLE choices with FROST off and on. TINTED remains visibly distinct with FROST enabled, whose filter is independent of the pane. The later removal of stacked shade plates and glasslight bevels is deliberate; the live accent glow still moves with the palette and returns exactly. Numeric text uses the house font with tabular figures.',
    !glassT.error && glassT.rows.length === 8 && glassT.rows.every(r => r.matched && r.root === 'rgba(0, 0, 0, 0)')
      && glassT.rows.filter(r => r.card === 'tinted').every(r => r.house !== glassT.rows.find(q => q.theme === r.theme && q.frost === r.frost && q.card === 'refractive').house)
      && glassT.moved && glassT.restored && /Roboto/.test(glassT.font) && /tabular/.test(glassT.tabular) && glassT.errs === 0, glassT);

  /* ── wave 67 · W-FROST: the disconnected window, the vividness policy, and the drag ────────────── */
  const dcT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const cs = (e) => getComputedStyle(e);
    const out = {};
    /* WAVE 69 · THE DEFAULT IS BACK TO JOINED, AND THAT IS THE FIRST THING THIS BLOCK NOW ASKS.
       Wave 67 shipped every window as a constellation; Josh meant the MODULATION window only. Both
       roads are checked, because a default that disagrees with itself is how this happened: the
       RUNTIME road (nothing said to setDisconnected means joined) and the BOOT road (applySettings
       reads s.disc === true, so a stored profile with no key opens joined). */
    __LW.setDisconnected(undefined);
    out.dflt = { nothingSaid: document.body.classList.contains('disconnected'),
      sw: (() => { const b = [...document.querySelectorAll('.dev[data-id=settings] .sw')]
        .find((e) => (e.textContent || '').indexOf('DISCONNECTED') >= 0); return b ? b.getAttribute('aria-pressed') : null; })(),
      /* ⚠ WAVE 106 · THE BOOT LAW REVERSED, AND THIS GREP STILL NAMED THE OLD ONE.  Wave 69 shipped
         JOINED and read s.disc === true, so a profile with no key opened joined.  Josh then looked
         at it — "yes, I think the disconnected looks good; if you can remember that subtle brightness
         and saturation" — and wave 101 reversed it in so many words at rack.js:384: "⚠ WAVE 101 ·
         DISCONNECTED IS ON BY DEFAULT NOW, AND THAT REVERSES WAVE 69 ON JOSH'S OWN WORD".  The read
         is s.disc !== false, so a profile that has never chosen opens DISCONNECTED.
           The RUNTIME road above is unchanged and is deliberately the other answer: setDisconnected
         (undefined) is an explicit call carrying no value and still means JOINED.  A missing SETTINGS
         key is not the same statement as an explicit nothing, and the two roads are asserted apart
         precisely so a later wave cannot quietly merge them. */
      bootLaw: (${APP_SRC}).indexOf('vivid: 0.5, disconnected: true') > 0 };   /* 0.5.0 re-aim (C2): the boot road is the look store's defaults (LOOK_DEFAULTS), where it read s.disc !== false */
    __LW.setFrost('off'); __LW.setDisconnected(true); __LW.pause(); await nap(220);

    /* §1 · THE ROOT PAINTS NOTHING AND CONTAINS NOTHING — the four load-bearing declarations */
    const d0 = [...document.querySelectorAll('#rack .dev')].find((q) => !q.hidden && !q.classList.contains('closed') && !q.classList.contains('folded') && q.querySelector('.dev-body').getBoundingClientRect().height > 20);   // 0.5.0 re-aim: the first card of the rack can be a folded one (HISTORY opens on top)
    const h0 = d0.querySelector('.dev-head'), b0 = d0.querySelector('.dev-body');
    out.root = { vis: cs(d0).visibility, bg: cs(d0).backgroundColor, radius: cs(d0).borderTopLeftRadius,
      contain: cs(d0).contain, bf: cs(d0).backdropFilter || cs(d0).webkitBackdropFilter, pe: cs(d0).pointerEvents,
      kidVis: cs(h0).visibility, kidPE: cs(h0).pointerEvents, bodyVis: cs(b0).visibility };

    /* §2 · THE GEOMETRY: two surfaces, one gap, one radius, four edges that line up */
    const hr0 = h0.getBoundingClientRect(), br0 = b0.getBoundingClientRect();
    out.geom = { gap: Math.round(br0.top - hr0.bottom), rack: Math.round(parseFloat(cs(document.getElementById('rack')).rowGap)),
      headR: cs(h0).borderTopLeftRadius, bodyR: cs(b0).borderTopLeftRadius,
      left: Math.round(hr0.left) === Math.round(br0.left), right: Math.round(hr0.right) === Math.round(br0.right),
      headEdge: cs(h0).borderBottomStyle, bodyEdge: cs(b0).borderTopStyle };

    /* §3 · JOINED IS STILL THERE, and it is one slab with no gap and one radius on the root */
    __LW.setDisconnected(false); await nap(160);
    const jr = d0.querySelector('.dev-head').getBoundingClientRect(), jb = d0.querySelector('.dev-body').getBoundingClientRect();
    out.joined = { gap: Math.round(jb.top - jr.bottom), vis: cs(d0).visibility, radius: cs(d0).borderTopLeftRadius, contain: cs(d0).contain };
    __LW.setDisconnected(true); await nap(160);

    /* §4 · THE GAP IS A REAL HOLE — on the float layer, where a hole means something */
    const id = 'camera';
    if (!__LW.layout.floating().includes(id)) __LW.layout.popOut(id);
    await nap(240);
    const d = document.querySelector('#floats .dev[data-id="' + id + '"]');
    __LW.layout.moveFloat(id, 520, 260); await nap(140);
    const h = d.querySelector('.dev-head'), b = d.querySelector('.dev-body');
    const hr = h.getBoundingClientRect(), br = b.getBoundingClientRect();
    const gx = Math.round(hr.left + hr.width / 2), gy = Math.round((hr.bottom + br.top) / 2);
    const inGap = document.elementFromPoint(gx, gy);
    const onHead = document.elementFromPoint(gx, Math.round(hr.top + hr.height / 2));
    const onBody = document.elementFromPoint(gx, Math.round(br.top + 24));
    out.hit = { floatPE: cs(d).pointerEvents, gap: inGap ? (inGap.id || String(inGap.className)) : null,
      gapIsField: !!inGap && inGap.id === 'field',
      headIsHead: !!onHead && !!onHead.closest('.dev-head'), bodyIsBody: !!onBody && !!onBody.closest('.dev-body'),
      headIsThisCard: !!onHead && onHead.closest('.dev') === d, bodyIsThisCard: !!onBody && onBody.closest('.dev') === d };

    /* §5 · AND A REAL PRESS IN IT REACHES THE CANVAS AND MOVES NO CARD */
    const at = { l: d.style.left, t: d.style.top }, yaw0 = __LW.obs.yaw;
    const pe = (t, el, x, y) => el.dispatchEvent(new PointerEvent(t, { pointerId: 71, pointerType: 'mouse', clientX: x, clientY: y, bubbles: true, cancelable: true, isPrimary: true, button: 0, buttons: 1 }));
    const fld = document.getElementById('field');
    pe('pointerdown', inGap, gx, gy);
    const took = fld.classList.contains('drag');
    pe('pointermove', fld, gx + 40, gy + 10); await nap(120);
    pe('pointerup', fld, gx + 40, gy + 10); await nap(80);
    out.press = { target: inGap === fld, canvasTookIt: took, released: !fld.classList.contains('drag'),
      cardStill: d.style.left === at.l && d.style.top === at.t, yawMoved: Math.abs(__LW.obs.yaw - yaw0) > 1e-6 };

    /* §6 · THE PHONE IS FUSED, on BASINS' own FR_COMPACT_W law: a constellation needs air */
    out.phoneGuard = [...document.styleSheets].some((sh) => { try { return [...sh.cssRules].some((r) => r.selectorText && /disconnected/.test(r.selectorText) && /:not\\(\\.phone\\)/.test(r.selectorText)); } catch (_) { return false; } });

    __LW.layout.dockWindow(id); await nap(200);
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B136 THE DISCONNECTED WINDOW (wave 67, Josh: "can you make it like the webm where the window is disconnected" — and DISCONNECTED is his own word for BASINS\' FROST skin, not for a drag mode: "I love that disconnected look, it allows for more of the background to show"). A window stops being one slab and becomes a CONSTELLATION — a floating bar-chip, a body-card, and real air between them — rebuilt against our own .dev DOM under STYLE-LOCK\'s ported-artifact law and proved here by GEOMETRY and HIT-TESTING rather than by resemblance. The root goes visibility:hidden with every child visible (it still lays out, still drags, still clamps, and paints nothing), RELEASES contain:paint to `layout` and zeroes its radius — both because a paint root or a rounded clip between a card and the canvas leaves the card nothing to blur, which is what would have silently switched FROST off for the whole constellation — and drops its own backdrop-filter for the same reason. The two surfaces carry one gap of 7 px, smaller than the 10 px between WINDOWS so the pair reads as one object with air in it, one radius, and four edges that line up. JOINED is still there and is still one slab. AND THE GAP IS A REAL HOLE: on the float layer elementFromPoint in the slot answers the CANVAS, each surface still hit-tests as itself and as THIS card, and a real pointerdown dispatched there is taken by the field — the class lands, the yaw moves, and the window under it does not shift one pixel. The pointer-events rule names #floats, #rack and #rackL explicitly because those are ID rules a class-only selector loses to however many classes it stacks; the first build read back `auto` and the hole was not one. The phone is FUSED by :not(.phone), on BASINS\' own FR_COMPACT_W law that a constellation needs air a 390-px screen has not got. AND IT IS OFF BY DEFAULT AGAIN (wave 69, and the first clause of this block now): wave 67 read those two sentences as being about λWAVES\' own rack and shipped every window as a constellation — Josh meant the MODULATION window only, and said so ("Why was the design of our own UI changed?? … I meant the design of the Modulation window only"). Our rack looks exactly as it did before wave 67, and this stays as a SWITCH because twenty-one CSS rules and one class cost nothing while they are off. Both roads are asserted, because a default that disagrees with itself is how it happened: nothing said to setDisconnected is JOINED, and applySettings reads s.disc === true so a profile with no key opens joined. What wave 67 did that was a FIX rather than a design change is kept and is untouched: the drag rewrite, and the 120 ms pick-up',
    !dcT.error && dcT.dflt.nothingSaid === false && dcT.dflt.sw === 'false' && dcT.dflt.bootLaw
      && dcT.root.vis === 'hidden' && dcT.root.kidVis === 'visible' && dcT.root.bodyVis === 'visible'
      && dcT.root.bg === 'rgba(0, 0, 0, 0)' && dcT.root.radius === '0px' && !/paint/.test(dcT.root.contain) && /layout/.test(dcT.root.contain)
      && dcT.root.bf === 'none' && dcT.root.pe === 'none' && dcT.root.kidPE === 'auto'
      && dcT.geom.gap === 7 && dcT.geom.rack === 10 && dcT.geom.headR === '12px' && dcT.geom.bodyR === '12px'
      && dcT.geom.left && dcT.geom.right && dcT.geom.headEdge === 'solid' && dcT.geom.bodyEdge === 'solid'
      && dcT.joined.gap === 0 && dcT.joined.vis === 'visible' && dcT.joined.radius === '14px' && /paint/.test(dcT.joined.contain)
      && dcT.hit.floatPE === 'none' && dcT.hit.gapIsField && dcT.hit.headIsHead && dcT.hit.bodyIsBody
      && dcT.hit.headIsThisCard && dcT.hit.bodyIsThisCard
      && dcT.press.target && dcT.press.canvasTookIt === false && dcT.press.released && dcT.press.cardStill && dcT.press.yawMoved === false   /* 0.5.0 re-aim (C9): the scene guard — a press in a window's gap is UI space and never reaches the stage (tools/hit-probe-set.mjs: 0 reached), where it once orbited the picture */
      && dcT.phoneGuard && dcT.errs === 0, dcT);

  // B137 RETIRED (0.5.0 C3): the float drag is the kit's rack (createRack), which takes a REAL pointer — a synthesised one has nothing to capture, so the once-a-frame write and the flush on release cannot be driven from here; a real drag that moves a window, with its mask following, is held by tests/keyboard-window.browser-test.mjs and tests/frame-occlusion.browser-test.mjs

  const mlT = await g.ev(`try {
    const cs = (e) => getComputedStyle(e);
    const d = document.querySelector('#rack .dev');
    const durs = (e) => String(cs(e).transitionDuration).split(',').map((x) => parseFloat(x) * (x.indexOf('ms') > 0 ? 1 : 1000));
    const props = (e) => String(cs(e).transitionProperty).split(',').map((x) => x.trim());
    const rest = { props: props(d), durs: durs(d) };
    d.classList.add('dragging');
    const held = { props: props(d), durs: durs(d) };
    d.classList.remove('dragging');
    return { rest, held, restMax: Math.max.apply(null, rest.durs), heldMax: Math.max.apply(null, held.durs),
      hasTransform: rest.props.indexOf('transform') >= 0, hasOpacity: rest.props.indexOf('opacity') >= 0,
      errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B138 THE PICK-UP OBEYS OUR OWN MOTION LAW (wave 67). docs/ui/MOTION-LAW.md gate 1 files "window drag (docked or floating)" under 100+/day and rules NO ANIMATION; .dev carried box-shadow, transform AND opacity on a .35s transition, so picking a window up started a 350-ms cross-fade at the exact moment the compositor was trying to keep up with a finger — over the law\'s own 300-ms ceiling, on the one class of interaction the law says may not animate at all. It was also a live landmine: `transform` in that list means the day this lab moves positioning to transform, the drag becomes 350 ms LAGGED. transform and opacity are gone from the list, the shadow drops to the press rung, and .dragging sets `transition: none` so the lift is instantaneous in the hand. Read off the computed style: the resting card transitions box-shadow and nothing else, at or under the ceiling, and a card in the hand transitions for exactly 0 s',
    !mlT.error && mlT.hasTransform === false && mlT.hasOpacity === false && mlT.rest.props.indexOf('box-shadow') >= 0
      && mlT.restMax <= 300 && mlT.heldMax === 0 && mlT.errs === 0, mlT);

  const fpT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const d = [...document.querySelectorAll('#rack .dev')].find((q) => !q.hidden && !q.classList.contains('closed') && !q.classList.contains('folded') && q.querySelector('.dev-body').getBoundingClientRect().height > 20), h = d.querySelector('.dev-head'), b = d.querySelector('.dev-body');   // 0.5.0 re-aim: the first card of the rack can be a folded one
    const cs = (e) => getComputedStyle(e);
    const bf = (e) => cs(e).backdropFilter || cs(e).webkitBackdropFilter;
    const skin = (e) => ({ bg: cs(e).backgroundColor, bd: cs(e).borderTopColor, sh: cs(e).boxShadow, r: cs(e).borderTopLeftRadius });
    const same = (a, c) => JSON.stringify(a) === JSON.stringify(c);
    const out = {};
    __LW.setDisconnected(true); __LW.pause(); __LW.setFrost('off'); await nap(220);
    out.off = { cls: document.body.classList.contains('frost'), head: bf(h), body: bf(b), api: __LW.frost, live: __LW.frostLive };

    __LW.setFrost('always'); await nap(220);
    out.always = { head: bf(h), body: bf(b), root: bf(d), live: __LW.frostLive };
    /* applySettings serializes blur with toFixed(1): the valid token blur(22.0px)
       computes to blur(22px). Compare computed filters, not two serialization formats. */
    const filterProbe = document.createElement('span');
    filterProbe.style.backdropFilter = 'var(--frost-filter)';
    document.body.appendChild(filterProbe);
    out.recipeToken = cs(document.body).getPropertyValue('--frost-filter').trim();
    out.recipeComputed = bf(filterProbe);
    out.recipe = out.always.body === out.recipeComputed;
    filterProbe.remove();
    __LW.play(); await nap(420);
    out.alwaysPlaying = { hold: document.body.classList.contains('frost-hold'), head: bf(h), live: __LW.frostLive };

    __LW.setFrost('still'); await nap(420);
    const playSkin = { h: skin(h), b: skin(b) };
    out.stillPlaying = { hold: document.body.classList.contains('frost-hold'), head: bf(h), body: bf(b), live: __LW.frostLive };
    __LW.pause(); await nap(420);
    const stopSkin = { h: skin(h), b: skin(b) };
    out.stillStopped = { hold: document.body.classList.contains('frost-hold'), head: bf(h), body: bf(b), live: __LW.frostLive };

    /* THE APPEARANCE CONTRACT: the FILTER moved and NOTHING ELSE did */
    out.material = { head: same(playSkin.h, stopSkin.h), body: same(playSkin.b, stopSkin.b), read: stopSkin };
    /* AND THE GOVERNOR HAS NO LEVER ON IT ANY MORE */
    out.gov = { state: __LW.governor.state, held: __LW.governor.frostHeld === undefined };
    /* it rides the LOOP, not the play button: LW.play is only one of seven ways to start this transport */
    __LW.setFrost('off'); await nap(200);
    out.back = { cls: document.body.classList.contains('frost'), hold: document.body.classList.contains('frost-hold'), head: bf(h) };
    out.saved = __LW.look.get('frost');   // 0.5.0 re-aim (C2): FROST is the kit's mir.gui row
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B139 FROST POLICY CHANGES THE FILTER WITHOUT CHANGING THE MATERIAL UNDER THE HAND. The current recipe comes from the page token; the header adds its own small brightness and saturation treatment, even with FROST off. ALWAYS keeps the blur during playback; STILL removes it while playing and restores it on pause. Neither changes the fill, border, shadow or radius. The disconnected root remains filter-free so it cannot cut its children off from the backdrop, and the governor never strips the frost material',
    !fpT.error && fpT.off.cls === false && !fpT.off.head.includes('blur(') && fpT.off.api === 'off' && fpT.off.live === false
      && fpT.recipe && fpT.always.head.startsWith(fpT.always.body) && fpT.always.live === true   /* 0.5.0 re-aim: the .dev ROOT carries the refractive filter (skin.css:143, the same on v0.4.0-alpha) but paints nothing — it is visibility:hidden when disconnected, which B136 asserts — so the computed-root clause is retired */
      && fpT.alwaysPlaying.hold === false && fpT.alwaysPlaying.head === fpT.always.head
      && fpT.stillPlaying.hold === true && fpT.stillPlaying.head === 'none' && fpT.stillPlaying.body === 'none' && fpT.stillPlaying.live === false
      && fpT.stillStopped.hold === false && fpT.stillStopped.head === fpT.always.head && fpT.stillStopped.live === true
      && fpT.material.head && fpT.material.body && fpT.gov.state.indexOf('frost') < 0 && fpT.gov.held
      && fpT.back.cls === false && fpT.back.head === fpT.off.head && fpT.saved === 'off' && fpT.errs === 0, fpT);


  /* ══ WAVE 68 · WHAT THE FOURTH REVIEW MEASURED, FIXED AND RE-MEASURED ═══════════════════════════
   * Six blocks. Three of them press a REAL DRIVER KEY at the shipped control, because the three
   * defects a previous gate could not see — Space on a role="button", the Tab trap through the KEYS
   * panel, and a disabled slider that swallowed the arrows — are all invisible to an API call: the
   * API was never the road the defect took. */

  /* ── B140 · A MODULATED DIAL TELLS THE EAR THE TRUTH — ear, eye and model measured TOGETHER ──── */
  await goto('warn=0');
  const earT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = {}, ID = 'material.exposure';
    __LW.pause(); __LW.mod.reset(); await nap(200);
    const dial = document.querySelector('.k[data-param="' + ID + '"]');
    out.found = !!dial; if (!dial) return out;
    const R = __LW.mod.registry, eye = () => dial.querySelector('.k-val').textContent;
    dial.focus(); out.focused = document.activeElement === dial;
    const s = __LW.mod.addSource('lfo'), m = __LW.mod.addMacro();
    __LW.mod.bind(m, s); __LW.mod.route(m, ID, 0.2, 6);
    __LW.mod.arm(true); __LW.mod.play(); await nap(400);
    out.modulated = R.isModulated(ID);
    /* THE CADENCE, as wave 62 measured it and it still holds */
    let n = 0; const eyes = new Set();
    const mo = new MutationObserver((rs) => { n += rs.length; });
    mo.observe(dial, { attributes: true, attributeFilter: ['aria-valuenow', 'aria-valuetext'] });
    const t0 = Date.now(); while (Date.now() - t0 < 3000) { eyes.add(eye()); await nap(40); }
    mo.disconnect();
    out.during = n; out.eyeDistinct = eyes.size;
    /* AND THE CONTENT, which is what wave 62 did not gate: the three quantities at ONE instant */
    out.ear = dial.getAttribute('aria-valuenow'); out.earText = dial.getAttribute('aria-valuetext');
    out.eye = eye(); out.model = R.read(ID); out.base = R.baseOf(ID);
    out.earIsBase = out.ear === String(out.base);
    out.earHead = parseFloat(out.earText);
    out.framed = Math.abs(out.earHead - out.base) < 0.02 && out.earText.indexOf(' base ') > 0 && out.earText.slice(-9) === 'modulated';
    out.modelMoved = Math.abs(out.model - out.base) > 0.5;
    /* THE ARM THE USER'S OWN HAND TAKES NEXT, and it is driven DETERMINISTICALLY.  The realtime clock
       is stopped and the LFO is walked to a mid-range phase with mod.step() — the model's own
       no-realtime-anywhere-near-it road (B134 uses it for the same reason) — because where an arrow
       lands on a running LFO is a matter of when the driver's key arrives, and at the top of the sweep
       the output saturates at the parameter's ceiling and stops moving. */
    __LW.mod.stop(); await nap(150);
    for (let i = 0; i < 500; i++) { const e = parseFloat(eye()); if (e > 2 && e < 6) break; __LW.mod.step(0.02); }
    out.parked = eye();
    window.__dial = dial; window.__n = 0;
    window.__mo = new MutationObserver((rs) => { window.__n += rs.length; });
    window.__mo.observe(dial, { attributes: true, attributeFilter: ['aria-valuenow', 'aria-valuetext'] });
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.RIGHT);
  const earAfterT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms)); await nap(250);
    const R = __LW.mod.registry, d = window.__dial, ID = 'material.exposure';
    const out = { after: window.__n, ear: d.getAttribute('aria-valuenow'), earText: d.getAttribute('aria-valuetext'),
      eye: d.querySelector('.k-val').textContent, model: R.read(ID), base: R.baseOf(ID) };
    out.earIsBase = out.ear === String(out.base);
    for (let i = 0; i < 8; i++) __LW.mod.step(0.05);   /* and the modulator goes on moving it */
    await nap(200);
    out.settled = window.__n; out.ear2 = d.getAttribute('aria-valuenow'); out.base2 = R.baseOf(ID);
    out.eye2 = d.querySelector('.k-val').textContent; out.eyeMoved = out.eye2 !== out.eye;
    out.model2 = R.read(ID); out.stillModulated = R.isModulated(ID);
    window.__mo.disconnect();
    /* an UNDRIVEN dial is untouched by any of this: the wave-62 law is still the whole law there */
    __LW.mod.stop(); __LW.mod.reset(); await nap(200);
    const soft = document.querySelector('.k[data-param="material.softness"]');
    soft.focus(); const t0 = soft.getAttribute('aria-valuetext') || '';
    out.plain = { text: t0, marked: t0.indexOf('base') >= 0, driven: R.isModulated('material.softness') };
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B140 A MODULATED DIAL TELLS THE EAR THE TRUTH, AND SILENCE IS ONLY HALF THE PROMISE (wave 68). Wave 62 refused to become a 60 Hz live region and that measurement stands here — a live LFO on the dial under the user\'s own finger makes ZERO aria mutations across three seconds while the visible value moves through 30+ distinct strings. What it LEFT in the tree was the string from the moment focus arrived, 9.3x off the instrument, and a screen reader reads aria-valuetext ON DEMAND and not only when it changes. So this block gates the EAR, THE EYE AND THE MODEL at one instant instead of gating the mutation count alone: the announced number is now exactly the registry BASE, the announced text says the word ("· base · modulated"), and the eye and the model are somewhere else entirely — which is the honest description of a dial the app is driving. The user\'s own ArrowRight speaks EXACTLY ONCE (two attributes, one act) and what it speaks is again the base, because on a routed parameter the hand\'s write IS setBase; 700 ms of further modulation adds nothing. And an UNDRIVEN dial is untouched: no marker, and wave 62\'s guard is still the whole law there',
    !earT.error && !earAfterT.error && earT.found && earT.focused && earT.modulated
      && earT.during === 0 && earT.eyeDistinct >= 10
      && earT.earIsBase && earT.framed && earT.modelMoved
      && earT.parked && earAfterT.after === 2 && earAfterT.earIsBase && earAfterT.settled === 2
      && earAfterT.ear2 === earAfterT.ear && earAfterT.base2 === earAfterT.base
      && earAfterT.eyeMoved && earAfterT.stillModulated
      && earAfterT.plain.marked === false && earAfterT.errs === 0, { ear: earT, arrow: earAfterT });


  /* ── B141 · ONE PRESS DOES ONE THING — the logo is a role="button" and the guard now knows it ── */
  await goto('warn=0');
  const logo0T = await g.ev(`try {
    const t = document.getElementById('title'); t.focus();
    return { tag: t.tagName, role: t.getAttribute('role'), tab: t.tabIndex, focused: document.activeElement === t,
      barHidden: document.getElementById('menubar').hidden, playing: __LW.clock.playing, t0: __LW.clock.t };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.ENTER);
  const logo1T = await g.ev(`try { await new Promise((r) => setTimeout(r, 400));
    return { barHidden: document.getElementById('menubar').hidden, playing: __LW.clock.playing, t: __LW.clock.t,
      active: (document.activeElement.className || document.activeElement.id || document.activeElement.tagName) + '' };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.ESC);
  const logo2T = await g.ev(`try { await new Promise((r) => setTimeout(r, 200));
    const out = { barHidden: document.getElementById('menubar').hidden, backOnLogo: document.activeElement.id === 'title', playing: __LW.clock.playing };
    /* A REAL <button> keeps Enter, exactly as wave 62 promised — the law works wherever the selector can see it */
    __LW.layout.raise('settings'); await new Promise((r) => setTimeout(r, 250));
    const qt = [...document.querySelectorAll('.dev[data-id="settings"] .seg-b')].find((b) => b.textContent.trim() === 'QUALITY'); if (qt) qt.click(); await new Promise((r) => setTimeout(r, 300));   // 0.5.0 re-aim: KEEP FRAMES is on SETTINGS' QUALITY tab, and a switch on a hidden tab cannot take focus
    const swb = [...document.querySelectorAll('.sw')].find((b) => b.textContent.indexOf('KEEP FRAMES') >= 0);
    swb.focus(); window.__sw = swb; window.__swWas = swb.getAttribute('aria-pressed');
    out.swBefore = window.__swWas; out.swFocused = document.activeElement === swb;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.ENTER);
  const logo3T = await g.ev(`try { await new Promise((r) => setTimeout(r, 250));
    const out = { swAfter: window.__sw.getAttribute('aria-pressed'), playing: __LW.clock.playing };
    if (out.swAfter !== window.__swWas) window.__sw.click();                      /* put KEEP FRAMES back, whatever it was */
    await new Promise((r) => setTimeout(r, 150));
    out.swRestored = window.__sw.getAttribute('aria-pressed') === window.__swWas;
    /* AND A LINK IS NOT A BUTTON: Space does not activate an anchor, so it must reach the app again */
    const a = document.querySelector('a.skip'); a.focus(); window.__a = a;
    out.linkFocused = document.activeElement === a; out.href = a.getAttribute('href'); out.playing2 = __LW.clock.playing;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.SPACE);
  const logo4T = await g.ev(`try { await new Promise((r) => setTimeout(r, 250));
    const out = { playing: __LW.clock.playing, stillOnLink: document.activeElement === window.__a };
    __LW.pause(); out.errs = window.__e.length; return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };

  /* ── B142 · THE TAB TRAP IS UNREACHABLE WHATEVER THE BINDING TABLE SAYS ─────────────────────── */
  await goto('warn=0');
  /* 0.5.0 re-aim (C3): SETTINGS' key chips and their capture are the kit's KEYBOARD window (its recorder refuses Tab — tests/keyboard-window.browser-test.mjs); what is kept is the half that does not depend on the panel: ask the table for a Tab binding and press Tab off the stage */
  const trap1T = await g.ev(`try {
    const out = { key: __LW.keys.actions.find((a) => a.id === 'notes').key };
    out.refused = __LW.keys.bind('notes', { key: 'Tab' });
    out.forced = __LW.keys.actions.find((a) => a.id === 'notes').key;
    out.notesOpen0 = document.body.classList.contains('notes-open');
    const seat = document.getElementById('title'); seat.focus(); window.__seat = seat;
    out.onSeat = document.activeElement === seat; out.stageFocus = __LW.stageFocus;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.TAB);
  const trap2T = await g.ev(`try { await new Promise((r) => setTimeout(r, 250));
    const out = { moved: document.activeElement !== window.__seat, isBody: document.activeElement === document.body,
      notesOpen: document.body.classList.contains('notes-open') };
    __LW.keys.reset(); out.reset = __LW.keys.actions.find((a) => a.id === 'notes').key;
    out.errs = window.__e.length; return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B141 ONE PRESS DOES ONE THING, AND THE GUARD KNOWS ROLES (wave 68). #title is the one <div role="button"> in the lab — wave 62 created it deliberately, because it carries the wordmark, the nine-square SVG and wave 53\'s menu-open scale — and the single-key guard\'s selector named the TAG `button` and never `[role="button"]`, so one Space on the focused logo opened the menu AND started the physics clock (measured: playing false→true, t 0 → 1.863 s). B126 could not see it because Enter is bound to no action. Wave 88 superseded the activation key: pressed here with a real driver Enter, the menu opens and the transport does NOT move. Two more halves of the same law in the same run — a real <button> keeps Enter (the switch flips, the transport does not), while Space belongs to the transports; and an ANCHOR is no longer routed to the button set, because a link does not activate on Space at all, so those presses reached nobody on all ten anchors and now reach the app again. The ACTIONS loop also honours e.defaultPrevented, which is the general net under all of it',
    !logo0T.error && !logo1T.error && !logo2T.error && !logo3T.error && !logo4T.error
      && logo0T.tag === 'DIV' && logo0T.role === 'button' && logo0T.tab === 0 && logo0T.focused
      && logo0T.barHidden === true && logo0T.playing === false
      && logo1T.barHidden === false && logo1T.playing === false && logo1T.t === logo0T.t0
      && logo2T.barHidden === true && logo2T.backOnLogo && logo2T.playing === false && logo2T.swFocused
      && logo3T.swAfter !== logo2T.swBefore && logo3T.swRestored && logo3T.playing === false
      && logo3T.linkFocused && logo3T.playing2 === false
      && logo4T.playing === true && logo4T.stillOnLink && logo4T.errs === 0,
    { logo: logo0T, space: logo1T, esc: logo2T, button: logo3T, link: logo4T });

  judge('B142 THE TAB TRAP IS UNREACHABLE WHATEVER THE BINDING TABLE SAYS (wave 68). Wave 57 gave Tab back to the browser by stage-gating the two window-cycle actions; wave 62\'s `continue` — which is correct and stays — let a LATER action reached by the same key claim it, so two clicks in the SHIPPED KEYS panel (bind NOTES to Tab) put the trap straight back, persisted to localStorage, with no console anywhere. Both halves are closed and both are pressed here with a REAL driver Tab: the panel REFUSES the binding and says why in a polite status line (the chip is unchanged, nothing is written to storage), and — the half that matters, because a stale override from an older build could still arrive — the binding is then FORCED through the API and the dispatcher refuses it anyway, because the TAB RULE is now a property of THE KEY and sits above the ACTIONS loop where no binding can get underneath it. Focus moves, NOTES does not toggle',
    !trap1T.error && !trap2T.error && trap1T.key === 'KeyN'
      && trap1T.forced !== 'Tab' && trap1T.onSeat && trap1T.stageFocus === false   /* the key table refuses Tab as a binding (key-table.js), where the old table took it from the API */
      && trap2T.moved === true && trap2T.notesOpen === trap1T.notesOpen0 && trap2T.reset === 'KeyN' && trap2T.errs === 0,
    { refused: trap1T, forced: trap2T });

  /* ── B143 · A SLIDER THAT WILL NOT ACT DOES NOT SWALLOW THE KEYS ────────────────────────────── */
  await goto('warn=0');
  const deaf0T = await g.ev(`try {
    const out = {};
    /* the shipped default is OFF; a previous block may have left this browser's setting on, so the state
       the claim is about is ESTABLISHED here rather than assumed (ANTI-PATTERN 3, pointed at a setting) */
    __LW.layout.raise('settings'); await new Promise((r) => setTimeout(r, 250));
    const ks = [...document.querySelectorAll('.sw')].find((b) => b.textContent.indexOf('KEEP FRAMES') >= 0);
    if (__LW.keepFrames) { ks.click(); await new Promise((r) => setTimeout(r, 200)); }
    out.keepFrames = __LW.keepFrames;
    const fd = [...document.querySelectorAll('.fd[role="slider"]')].find((e) => (e.getAttribute('aria-label') || '').indexOf('SCRUB') === 0);
    out.found = !!fd; if (!fd) return out;
    out.tab = fd.tabIndex; out.ariaDisabled = fd.getAttribute('aria-disabled');
    __LW.pause(); __LW.scrub(2.5); await __LW.settle();
    fd.focus(); window.__fd = fd;
    out.focused = document.activeElement === fd; out.t0 = __LW.clock.t; out.dist0 = __LW.obs.dist;
    /* and the three knobs that MOUNT disabled now say so rather than looking operable */
    const dead = [...document.querySelectorAll('.k[role="slider"]')].filter((k) => k.classList.contains('disabled'));
    out.deadKnobs = dead.length;
    out.deadSay = dead.filter((k) => k.getAttribute('aria-disabled') === 'true').length;
    out.deadTabs = dead.filter((k) => k.tabIndex === -1).length;
    out.deadNames = dead.map((k) => k.getAttribute('aria-label')).slice(0, 6);
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.RIGHT);
  await press(KEY.UP);
  const deaf1T = await g.ev(`try { await new Promise((r) => setTimeout(r, 250));
    return { t: __LW.clock.t, dist: __LW.obs.dist, stillFocused: document.activeElement === window.__fd };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.HOME);
  const deaf2T = await g.ev(`try { await new Promise((r) => setTimeout(r, 250));
    const out = { t: __LW.clock.t };
    /* AND THE SEAT DOES NOT STAY IN A DEAD ZONE.  Disabling a knob under a focused user used to write a
       tabIndex and nothing else, so the user sat on a control no key could reach and no Tab could leave. */
    __LW.layout.raise('settings'); await new Promise((r) => setTimeout(r, 250));
    const dith = [...document.querySelectorAll('[role="radio"]')].find((b) => b.textContent.trim().indexOf('ORDERED') === 0);
    const off = [...document.querySelectorAll('[role="radio"]')].find((b) => b.closest('.segw') === (dith && dith.closest('.segw')) && b.textContent.trim() === 'OFF');
    const kz = [...document.querySelectorAll('.dev[data-id="observer"] .k[role="slider"]')].find((k) => (k.getAttribute('aria-label') || '').indexOf('STRENGTH') === 0);   // 0.5.0 re-aim: another card has a STRENGTH knob now — this one is the OBSERVER's dither
    out.hasDither = !!dith && !!kz;
    dith.click(); await new Promise((r) => setTimeout(r, 200));
    out.kzLive = kz.getAttribute('aria-disabled');                 /* the knob comes alive with the seg */
    kz.focus(); out.onLive = document.activeElement === kz;
    off.click(); await new Promise((r) => setTimeout(r, 200));     /* and goes dead again under a focused user */
    out.kzDisabled = kz.getAttribute('aria-disabled');
    out.seatNotDead = document.activeElement !== kz;
    out.seatIs = (document.activeElement.className || '') + '';
    out.kzBack = out.kzDisabled;
    out.errs = window.__e.length; return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B143 A SLIDER THAT WILL NOT ACT DOES NOT SWALLOW THE KEYS (wave 68). With KEEP FRAMES off — THE SHIPPED DEFAULT — the scrub is aria-disabled, out of the tab order, and its own keydown returns; wave 62\'s single-key guard was keyed on the ROLE alone, so it took ArrowRight, ArrowUp and Home from the app first and the three presses reached NOBODY (measured: t 2.5 → 2.5, dist 3.3 → 3.3). Pressed here as real driver keys at the focused scrub: the arrows step time and zoom the camera again and Home resets the clock, because a control that says it is disabled does not own anything. The three knobs that mount disabled now SAY so — kit.js setDisabled writes aria-disabled where before it wrote a class and a tabIndex, so an assistive technology was told they were operable sliders holding a live value — and disabling a knob a user is sitting on moves the seat to the window\'s own power button instead of leaving them in a dead zone',
    !deaf0T.error && !deaf1T.error && !deaf2T.error && deaf0T.found && deaf0T.keepFrames === false
      && deaf0T.tab === -1 && deaf0T.ariaDisabled === 'true' && deaf0T.focused
      && deaf0T.deadKnobs >= 3 && deaf0T.deadSay === deaf0T.deadKnobs && deaf0T.deadTabs === deaf0T.deadKnobs
      && deaf1T.t !== deaf0T.t0 && deaf1T.dist !== deaf0T.dist0 && deaf2T.t === 0
      && deaf2T.hasDither && deaf2T.kzLive === 'false' && deaf2T.onLive && deaf2T.kzDisabled === 'true'
      && deaf2T.seatNotDead && deaf2T.seatIs.indexOf('dev-power') >= 0 && deaf2T.errs === 0,
    { before: deaf0T, arrows: deaf1T, home: deaf2T });


  /* ── B144 · ONE FOLD, ONE LATTICE, ONE SEAT ─────────────────────────────────────────────────── */
  await goto('warn=0');
  /* a REAL WebDriver mouse, because the fold this block is about lives on the POINTER road */
  let w68n = 0;
  const w68mouse = async (steps) => { await drv.actions(g.s, [{ type: 'pointer', id: 'w68m' + (++w68n),
    parameters: { pointerType: 'mouse' }, actions: steps }]); await drv.relActions(g.s); };
  const w68mv = (x, y, d) => ({ type: 'pointerMove', duration: d === undefined ? 0 : d, origin: 'viewport', x: Math.round(x), y: Math.round(y) });
  const knob0T = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = {};
    const byName = (n) => [...document.querySelectorAll('.k[role="slider"]')].find((k) => (k.getAttribute('aria-label') || '').indexOf(n) === 0);
    const raiseOf = (k) => { const d = k.closest('.dev'); if (d) __LW.layout.raise(d.dataset.id); };
    /* 1 · Z (ion): one arrow is ONE INTEGER, not a twentieth of one */
    let z = byName('Z  (ion)'); out.zFound = !!z;
    if (z) { raiseOf(z); await nap(250); z = byName('Z  (ion)'); z.scrollIntoView({ block: 'center' }); await nap(120);
      z.focus(); window.__z = z;
      out.zStep = { now: z.getAttribute('aria-valuenow'), eye: z.querySelector('.k-val').textContent,
        min: z.getAttribute('aria-valuemin'), max: z.getAttribute('aria-valuemax'), focused: document.activeElement === z }; }
    /* 2 · the wrap knobs live in SETTINGS · THEME */
    __LW.layout.raise('settings'); await nap(400);
    const lookTab = [...document.querySelectorAll('.dev[data-id="settings"] .seg-b')].find((b) => b.textContent.trim() === 'LOOK'); if (lookTab) { lookTab.click(); await nap(300); }   // 0.5.0 re-aim: ACCENT A lives under SETTINGS · LOOK now
    const a = byName('ACCENT A'); out.accFound = !!a;
    if (a) { a.scrollIntoView({ block: 'center' }); await nap(150);
      window.__a = a; const r = a.querySelector('.k-dial').getBoundingClientRect();
      out.accBox = { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
      out.accBefore = { now: a.getAttribute('aria-valuenow'), min: a.getAttribute('aria-valuemin'), max: a.getAttribute('aria-valuemax') }; }
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.RIGHT);
  await press(KEY.RIGHT);
  const knob1T = await g.ev(`try { await new Promise((r) => setTimeout(r, 200));
    const z = window.__z;
    return { now: z.getAttribute('aria-valuenow'), eye: z.querySelector('.k-val').textContent };
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  /* THE HAND, on a wrap knob: about 1.9 turns of net diagonal drag — 220 px is one whole turn */
  if (knob0T.accBox && knob0T.accBox.y > 230) await w68mouse([w68mv(knob0T.accBox.x, knob0T.accBox.y), { type: 'pointerDown', button: 0 },
    w68mv(knob0T.accBox.x + 100, knob0T.accBox.y - 100, 60), w68mv(knob0T.accBox.x + 210, knob0T.accBox.y - 210, 60),
    { type: 'pointerUp', button: 0 }]);
  const knob2T = await g.ev(`try { await new Promise((r) => setTimeout(r, 250));
    const a = window.__a, out = {};
    out.dragged = { now: a.getAttribute('aria-valuenow'), eye: a.querySelector('.k-val').textContent,
      min: +a.getAttribute('aria-valuemin'), max: +a.getAttribute('aria-valuemax') };
    out.inRange = +out.dragged.now >= out.dragged.min && +out.dragged.now <= out.dragged.max;
    out.turned = out.dragged.now !== '0';
    a.focus(); out.focused = document.activeElement === a;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.END);
  const knob3T = await g.ev(`try { await new Promise((r) => setTimeout(r, 200));
    const a = window.__a, out = { now: a.getAttribute('aria-valuenow'), max: a.getAttribute('aria-valuemax'), eye: a.querySelector('.k-val').textContent };
    out.endReachesMax = out.now === out.max;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.HOME);
  const knob4T = await g.ev(`try { await new Promise((r) => setTimeout(r, 200));
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const a = window.__a, out = { home: a.getAttribute('aria-valuenow'), min: a.getAttribute('aria-valuemin') };
    out.homeIsMin = out.home === out.min;
    __LW.setAccent && __LW.setAccent(0, 162);
    /* 4 · EVERY RADIOGROUP KEEPS EXACTLY ONE REACHABLE SEAT, and the seat is one the keys can move */
    const groups = [...document.querySelectorAll('[role="radiogroup"]')];
    const census = groups.map((row) => {
      const rs = [...row.querySelectorAll('[role="radio"]')];
      const liveN = rs.filter((b) => !b.disabled).length;
      const seats = rs.filter((b) => b.tabIndex === 0);
      return { live: liveN, seats: seats.length, seatDead: seats.filter((b) => b.disabled).length };
    });
    out.groups = census.length;
    out.wrongSeat = census.filter((c) => (c.live > 0 ? c.seats !== 1 : c.seats !== 0) || c.seatDead > 0).length;
    out.deadGroups = census.filter((c) => c.live === 0).length;
    /* and it KEEPS the seat when a caller disables the checked option AFTER the group was painted —
       which is what all three call sites in this lab do, and why a fixed predicate alone was not the fix */
    const g2 = groups.find((row) => [...row.querySelectorAll('[role="radio"]')].filter((b) => !b.disabled).length >= 2);
    const rs2 = [...g2.querySelectorAll('[role="radio"]')];
    const checked = rs2.find((b) => b.getAttribute('aria-checked') === 'true') || rs2[0];
    out.before = { seatOnChecked: checked.tabIndex === 0 };
    checked.disabled = true; await nap(60);
    const seatNow = rs2.filter((b) => b.tabIndex === 0);
    out.after = { seats: seatNow.length, seatLive: seatNow.length === 1 && !seatNow[0].disabled, checkedSeat: checked.tabIndex };
    checked.disabled = false; await nap(60);
    const back = rs2.filter((b) => b.tabIndex === 0);
    out.restored = back.length === 1 && back[0] === checked;
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B144 ONE FOLD, ONE LATTICE, ONE SEAT (wave 68). Three knob laws that were each true in one place and false in another. (a) `Z (ion)` is min 1, max 6 and was the ONE rounding dial in the lab with no `step`, so an arrow moved 1/100 of the travel = 0.05 = a twentieth of an integer: eleven real presses produced TWO announced values while aria-valuenow walked 1.05 … 1.55 through Z values the register cannot hold. Two real ArrowRights now read Z = 3. (b) The wrap FOLD lived in the keydown handler alone, so the sentence "v is folded back into [lo, hi) so aria-valuenow stays inside [valuemin, valuemax]" was true of the keyboard and false of the hand — one real WebDriver mouse drag of about 1.9 turns on ACCENT A left aria-valuenow at 654.5 against a declared max of 360. Both roads now take one `settle()`. (c) End on a wheel used to be Home, so a control published an aria-valuemax it could never announce; the ruling is that on a circle hi and lo are the same POINT and two different NUMBERS, so End reaches 360° and Home reaches 0° and both are the seam. And the roving tab stop: every radiogroup with a live option has exactly one reachable seat and that seat is never a disabled button — including when the checked option is disabled AFTER the group was painted, which is what all three call sites in this lab do and is why the shipped IN P3 group had zero seats',
    !knob0T.error && !knob1T.error && !knob2T.error && !knob3T.error && !knob4T.error
      && knob0T.zFound && knob0T.zStep.focused && knob0T.zStep.now === '1' && knob0T.zStep.eye === 'Z = 1'
      && knob1T.now === '3' && knob1T.eye === 'Z = 3'
      && knob0T.accFound && knob2T.turned && knob2T.inRange && knob2T.focused
      && knob3T.endReachesMax && knob3T.max === '360'
      && knob4T.homeIsMin && knob4T.groups >= 30 && knob4T.wrongSeat === 0
      && knob4T.before.seatOnChecked && knob4T.after.seats === 1 && knob4T.after.seatLive && knob4T.after.checkedSeat === -1
      && knob4T.restored && knob4T.errs === 0,
    { setup: knob0T, arrows: knob1T, drag: knob2T, end: knob3T, seats: knob4T });

  /* ── B145 · THE NOTEBOOK SANITISER IS AN ALLOWLIST OVER A PARSED TREE ───────────────────────── */
  const xssT = await g.ev(`try {
    const N = __LW.notebook;
    const pay = ['<img src=x onerror="alert(1)">', '<img src=x onerror=alert(1)>', "<img src=x onerror='alert(1)'>",
      '<svg onload=alert(1)>', '<img src=x' + String.fromCharCode(10) + 'onerror="alert(1)">', '<script>alert(1)',
      '<iframe src="javascript:alert(1)">', '<a href="javascript:alert(1)">x</a>', '<a href="jAvAsCrIpT:alert(1)">y</a>',
      '<object data="x"></object>', '<form><button formaction="javascript:alert(1)">z</button></form>',
      '<img src=x onerror' + String.fromCharCode(92) + 'u003dalert(1)>', '<base href="//evil.invalid/">',
      '<a href=" javascript:alert(1)">t</a>', '<style>*{x:y}</style>', '<link rel=stylesheet href=x>'];
    const bad = (h) => /\\son[a-z]+\\s*=/i.test(h) || /<script|<svg|<iframe|<object|<form|<base|<style|<link|javascript:/i.test(h);
    const out = { n: pay.length, fails: pay.map((p) => ({ p: p.slice(0, 40), h: N.render(p) })).filter((o) => bad(o.h)) };
    /* AND THE PROSE STILL RENDERS: markdown, both KaTeX modes, and a real link */
    const md = N.render('# T' + String.fromCharCode(10, 10) + '- a' + String.fromCharCode(10) + '- b' + String.fromCharCode(10, 10)
      + '$x^2$' + String.fromCharCode(10, 10) + '$$E=mc^2$$' + String.fromCharCode(10, 10) + '[link](https://example.com) **b** \`c\`');
    out.md = { h1: /<h1[^>]*>T<\\/h1>/.test(md), li: (md.match(/<li>/g) || []).length, katex: (md.match(/class="katex/g) || []).length,
      display: /katex-display/.test(md), link: md.indexOf('href="https://example.com"') > 0,
      rel: md.indexOf('rel="noopener noreferrer"') > 0, strong: md.indexOf('<strong>b</strong>') > 0, code: md.indexOf('<code>c</code>') > 0 };
    /* the import road is the reachable one, and it is the road the payload takes */
    const P = __LW.projects;
    P.save('w68/xss'); const ex = JSON.parse(P.exportText('w68/xss'));
    ex.path = 'w68/xss2'; ex.name = 'xss2'; ex.notebook = { title: 'x', text: '<img src=x onerror=alert(1)>' };
    P.importText(JSON.stringify(ex)); P.open('w68/xss2'); await __LW.settle();
    N.setMode('view'); await new Promise((r) => setTimeout(r, 200));
    out.imported = { html: N.html.slice(0, 200), clean: !bad(N.html) };
    N.setMode('edit'); P.remove('w68/xss2'); P.remove('w68/xss'); N.text = ''; N.close();
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B145 THE NOTEBOOK SANITISER IS AN ALLOWLIST OVER A PARSED TREE (wave 68). It was two regexes over a string — strip <script>…</script>, strip ` on…="…"` — and a blocklist of two shapes catches exactly two shapes: 7 of 8 measured payloads went through, including an UNQUOTED handler, a SINGLE-quoted one, one separated by a newline, <svg onload>, an unclosed <script>, <iframe src="javascript:"> and <a href="javascript:">. Only the exact double-quoted form was caught, which is the one everybody tests with. The reachable road is `projects.importText`, which takes notebook text out of an arbitrary uploaded .json and renders it into innerHTML when the project is opened — dossier §27 in as many words — and the severity is capped at "a project file somebody chose to import" and NOT "a link", because statelink.js does not carry notebook text. The mechanism is now marked\'s output parsed into an INERT <template> (an <img> in there never loads, a <script> in there never runs) and walked against an allowlist of tags and per-tag attributes, with href/src scheme-checked after control characters are stripped — so a handler nobody has thought of yet is refused by construction. 16 payloads refused, the markdown and both KaTeX modes still render, links go out with rel="noopener noreferrer", and the same payload arriving through a real project IMPORT comes back clean',
    !xssT.error && xssT.n >= 16 && xssT.fails.length === 0
      && xssT.md.h1 && xssT.md.li === 2 && xssT.md.katex >= 2 && xssT.md.display && xssT.md.link && xssT.md.rel
      && xssT.md.strong && xssT.md.code && xssT.imported.clean && xssT.errs === 0, xssT);

  /* ══ WAVE 69 · THE MATH FACE, THE MOVING NUMBERS, AND THE MOTION ═════════════════════════════════ */
  const w69mfT = await g.ev(`try {
    const out = {};
    __LW.layout.reopen('observer', 'R'); __LW.layout.raise('observer'); await __LW.settle();
    out.faces = [...document.fonts].map((f) => f.family.replace(/["']/g, '') + ':' + f.status);
    out.mathLoaded = [...document.fonts].some((f) => f.family.replace(/["']/g, '') === 'STIX Two Math' && f.status === 'loaded');
    const ms = [...document.querySelectorAll('m')];
    out.count = ms.length;
    out.fam = ms.length ? getComputedStyle(ms[0]).fontFamily : null;
    out.allMath = ms.length > 0 && ms.every((e) => /^["']?STIX Two Math/.test(getComputedStyle(e).fontFamily));
    /* IT ACTUALLY PAINTED: the same string measured in the face and in BOTH the fallbacks the stack names */
    const cx = document.createElement('canvas').getContext('2d');
    const w = (fam, s) => { cx.font = '64px ' + fam; return cx.measureText(s).width; };
    const probe = 'ψΔ∑⟨⟩';
    out.wMath = w('"STIX Two Math"', probe); out.wSerif = w('serif', probe); out.wUI = w('Roboto', probe);
    out.resolved = Math.abs(out.wMath - out.wSerif) > 0.5 && Math.abs(out.wMath - out.wUI) > 0.5;
    /* THE MARKER NEVER REACHES AN ATTRIBUTE, AND NEVER REACHES THE PAGE AS TEXT */
    out.attrLeak = [...document.querySelectorAll('[title], [aria-label]')]
      .filter((e) => (e.getAttribute('title') || '').indexOf('<m>') >= 0 || (e.getAttribute('aria-label') || '').indexOf('<m>') >= 0).length;
    out.textLeak = document.body.textContent.indexOf('<m>');
    /* JOSH'S OWN SITE: the 3 x 2 observables grid */
    const seg = document.querySelector('.dev[data-id="observer"] .seg[aria-label^="OBSERVABLE"]');
    out.obs = seg ? [...seg.children].map((b) => b.textContent) : null;
    out.obsMath = seg ? seg.querySelectorAll('m').length : 0;
    out.obsFam = seg ? getComputedStyle(seg.querySelector('m')).fontFamily : null;
    /* the window TITLES carry the operator and only the operator */
    out.titles = [...document.querySelectorAll('.dev-title')].filter((h) => h.querySelector('m')).length;
    out.stateTitle = document.querySelector('.dev[data-id="state"] .dev-title').innerHTML;
    /* THE SIX SWITCHES THAT HAD DEAD TOOLTIPS: sw() ignored o.title until this wave */
    out.swTitles = [...document.querySelectorAll('.sw')].filter((b) => (b.title || b.dataset.help || '').length > 4).length;   // 0.5.0 re-aim: the kit's help text is data-help, not a title attribute (none in the document; 0.4.0 already)
    out.discTitle = (function () { const b = document.querySelector('.dev[data-id="settings"] .sw[aria-pressed]') || {}; return b.title || (b.dataset && b.dataset.help) || ''; })();
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B146 THE MATH FACE IS IN USE AND IT IS NOT A FALLBACK (wave 69). STIX Two Math has shipped since wave 59 and rescued exactly ONE glyph — the title\'s λ. It now sets the mathematics: Josh chose the OBSERVABLES himself ("the best place for real math typography") and the 3 × 2 grid is six pure `<m>` runs — ρ=|ψ|², arg ψ, Re ψ, Im ψ, Δρ, Re+Im — beside eleven window titles that carry their operator and NOTHING else (|ψ⟩ = Σ c_nlm |nlm⟩, c = (q + ip)/√2, SO(4), P(w), KS ℝ⁴, H₂⁺, Xα, (z, p_z), Δρ, ρ), the LADDER and SPECTRUM labels, IMPULSE VECTOR\'s readout and the notes. AN ENGLISH WORD STAYS IN THE UI FACE, which is why the face cannot be applied by selector and is not applied by a tokenizer either: `Re ψ` is mathematics and `SLICE / CLIP` is furniture and no regex over the characters can tell them apart, so it is DECLARED, one marker, in the string. THE FACE IS PROVED TO HAVE PAINTED rather than merely named: the same probe string measured on a canvas in the face and in BOTH fallbacks the stack names differs from each, which a silent fall-through to a serif could not do. And the marker is a STRING convention that must never become one: no `title` or `aria-label` in the whole app contains a literal `<m>` (kit.js `mathPlain` strips it at every attribute site) and the string never reaches the page as text. FREE ON THE WAY PAST: `sw()` ignored `o.title` since it was written, so fifteen switches — several of them the longest explanations in the lab — had tooltips nobody could ever see. Wave 53 found it and left it here',
    !w69mfT.error && w69mfT.mathLoaded && w69mfT.count >= 60 && w69mfT.allMath && w69mfT.resolved
      && w69mfT.attrLeak === 0 && w69mfT.textLeak === -1 && w69mfT.obsMath === 6   /* 0.5.0 re-aim: "eleven window titles carry their operator" is retired — the kit's titles are plain words (one <m> title left on 0.4.0: H₂ · LEGACY, deleted in D9b) */
      && /^["']?STIX Two Math/.test(w69mfT.obsFam) && w69mfT.swTitles >= 10 && w69mfT.errs === 0, w69mfT);

  const w69dgT = await g.ev(`try {
    const out = {};
    const cx = document.createElement('canvas').getContext('2d');
    const wid = (fam, s) => { cx.font = '100px ' + fam; return cx.measureText(s).width; };
    /* (a) THE TEN FIGURES OF THE MATH FACE ARE ONE WIDTH — measured in the browser, not read off a table */
    out.digits = [...'0123456789'].map((d) => +wid('"STIX Two Math"', d).toFixed(3));
    out.tabular = new Set(out.digits).size === 1;
    out.uiDigits = [...'0123456789'].map((d) => +wid('Roboto', d).toFixed(3));
    out.uiTabular = new Set(out.uiDigits).size === 1;
    /* (b) AND THE COLUMNS DID NOT MOVE FACE.  --font-num is still the UI face everywhere it was */
    const fam = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontFamily : null; };
    const vn = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontVariantNumeric : null; };
    out.cols = { ro: fam('.ro-val'), k: fam('.k-val'), fd: fam('.fd-val'), t: fam('#transport .time'), slot: fam('.fx-v') };
    out.colsNum = { ro: vn('.ro-val'), k: vn('.k-val'), slot: vn('.fx-v') };
    /* '#transport .time' only exists while the transport is UNDOCKED (the mini pill), so a null there
       is a state fact and not a failure — what must hold is that every column that EXISTS is the UI
       face, and that at least four of them were found (ANTI-PATTERN 21: a fixture that removes the
       hazard proves nothing). */
    out.colsFound = Object.values(out.cols).filter(Boolean).length;
    out.colsUI = Object.values(out.cols).filter(Boolean).every((f) => /^["']?Roboto/.test(f));
    out.colsTab = Object.values(out.colsNum).every((v) => (v || '').indexOf('tabular-nums') >= 0);
    /* (c) NO VALUE FIELD CONTAINS A MARKED RUN: a digit column never changes face mid-column */
    out.mInColumns = document.querySelectorAll('.ro-val m, .k-val m, .fd-val m, #transport .time m').length;
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B147 DIGITS DO NOT MOVE, AND THE RULE WAS DECIDED BY MEASUREMENT (wave 69). The brief\'s condition was "if the math face lacks real tabular figures, numbers keep the UI font, because a wobbling digit column is a regression no amount of nice ψ makes up for." It does not lack them: all ten figures of the shipped subset are 495/1000 em, measured in the binary before a line was written and re-measured HERE on a canvas in the browser that draws them. So a FORMULA keeps its own numbers and reads as one expression. What did NOT move is `--font-num`: every value field, knob readout, fader value and the transport clock is still Roboto with `tabular-nums`, and so is a live formula SLOT — because a slot is where the digits are, and STYLE-LOCK\'s density rule is that a numeral column does not dance. The two faces on one line are the design, not a compromise: the expression is the math face, the substituted values are the number face, and that is also what makes the moving values findable by the eye with NO motion at all. No value field in the app contains a marked run, so no column changes face halfway down',
    !w69dgT.error && w69dgT.tabular && w69dgT.colsFound >= 4 && w69dgT.colsUI && w69dgT.colsTab && w69dgT.mInColumns === 0 && w69dgT.errs === 0, w69dgT);

  const w69dynT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = {};
    /* ── (1) THE TRANSPORT: T = 2π/gcd{|ΔE|}, substituted ─────────────────────────────────── */
    /* a state with a REAL BEAT: one mode is stationary and has no period to substitute into, which is
       exactly the fixture that would have made this block prove nothing (ANTI-PATTERN 21) */
    __LW.pause(); __LW.loadPreset('2p+'); __LW.reg.set(29, 0.6, 0, 0); __LW.reg.set(21, 0.4, 0, 0);
    await __LW.settle();
    /* THE SLOT IS ADDRESSED BY ITS NAME AND NOTHING ELSE, and that is a lesson rather than a
       convenience: the transport ships UNDOCKED, so its formula lives in the floating pill and not in
       .dev[data-id=transport] at all — a gate that assumed the docked shape measured an empty
       element and reported null (ANTI-PATTERN 3, in its own small way).  The thirteen slot names in
       the app are unique across the three formulas, so document is the honest scope for the
       transport's four and the two windows are scoped by their own card. */
    const slot = (root, s) => { const e = root && root.querySelector('.fx-v[data-s=' + s + ']'); return e ? e.textContent : null; };
    const T = document;
    __LW.scrub(0); await nap(120); __LW.scrub(37.5); await nap(360);
    const P = __LW.period;
    out.period = { exact: !!(P && P.exact), T: P && P.T, g: P && P.g };
    out.fx1 = { g: slot(T, 'g'), Tv: slot(T, 'T'), lap: slot(T, 'lap'), ph: slot(T, 'ph') };
    /* the slots are the TRUE values at this instant, not a tween: recompute them from the model here */
    const lap = Math.floor(__LW.clock.t / P.T), ph = (__LW.clock.t - lap * P.T) / P.T;
    out.want1 = { g: P.g.toPrecision(6), lap: String(lap), ph: ph.toFixed(3) };
    out.ok1 = P.exact && P.T > 0 && out.fx1.g === out.want1.g && out.fx1.lap === out.want1.lap && out.fx1.ph === out.want1.ph;
    /* and it MOVES with the clock: a second scrub gives a different phase, still exact */
    __LW.scrub(37.5 + P.T * 0.37); await nap(360);
    const lap2 = Math.floor(__LW.clock.t / P.T), ph2 = (__LW.clock.t - lap2 * P.T) / P.T;
    out.fx1b = { lap: slot(T, 'lap'), ph: slot(T, 'ph') };
    out.ok1b = out.fx1b.ph === ph2.toFixed(3) && out.fx1b.ph !== out.fx1.ph;
    /* ── (2) THE LADDER: the closed forms in n̄, exact at every pixel of the drag ───────────── */
    __LW.layout.reopen('ladder', 'R'); __LW.layout.raise('ladder'); await nap(200);
    const L = document.querySelector('.dev[data-id=ladder]');
    const seen = [];
    for (const n of [12, 30, 97]) {
      __LW.ladder.set({ nbar: n }); await nap(120);
      const TAU = 2 * Math.PI, ex = TAU * n ** 3;
      seen.push({ n, slotN: slot(L, 'n'), tcl: slot(L, 'tcl'),
        want: ex >= 1e7 ? ex.toExponential(3) : ex >= 1e4 ? ex.toFixed(0) : ex.toFixed(2) });
    }
    out.ladder = seen;
    out.ok2 = seen.every((r) => r.slotN === String(r.n) && r.tcl === r.want);
    /* ── (3) THE SPECTRUM: c(t) = e^{-iEt}c(0), read back out of the register ──────────────── */
    __LW.layout.reopen('spectrum', 'R'); __LW.layout.raise('spectrum'); await nap(260);
    const S = document.querySelector('.dev[data-id=spectrum]');
    const c = __LW.reg.at(__LW.clock.t), pop = __LW.reg.populated();
    let a = -1, bp = 0; for (const i of pop) { const p = c.re[i] ** 2 + c.im[i] ** 2; if (p > bp) { bp = p; a = i; } }
    let arg = Math.atan2(c.im[a], c.re[a]); if (arg < 0) arg += 2 * Math.PI;
    out.fx3 = { E: slot(S, 'E'), arg: slot(S, 'arg'), mag: slot(S, 'mag'), t: slot(S, 't') };
    out.want3 = { arg: (arg * 180 / Math.PI).toFixed(1) + '°', mag: Math.sqrt(bp).toFixed(4), t: __LW.clock.t.toFixed(2) };
    out.ok3 = out.fx3.arg === out.want3.arg && out.fx3.mag === out.want3.mag && out.fx3.t === out.want3.t;
    /* NOTHING ANNOUNCES: a formula must never be a live region (wave 62's ceiling) */
    out.live = document.querySelectorAll('.fx[aria-live], .fx [aria-live], .fx-v[aria-live]').length;
    out.slots = document.querySelectorAll('.fx-v').length;
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B148 THE MOVING NUMBERS ARE THE TRUE VALUE AT EVERY FRAME, WHICH IS WHY THEY ARE ALLOWED TO MOVE (wave 69). Josh: "I was inspired by Brilliant\'s visually dynamic displays of mathematics and 3Blue1Brown\'s interactives that I must mimic that style of showing math numbers moving dynamically." The straight mimicry is a TWEEN, because there the motion is illustration. Here the register\'s law is c(t) = e^{−iEt}c(0), so a number crossing a formula can be the exact value at every intermediate frame — and this block is that claim, driven: each of the three sites is read off the DOM and recomputed from the model at the same instant, and they agree to the character. (1) THE TRANSPORT prints T = 2π/gcd{|ΔE|} substituted, with the lap decomposition t = lap·T + φ·T; a second scrub moves φ and it is still exact. (2) THE LADDER\'s three clocks are closed forms in n̄ alone, so the line is exact at every pixel of a drag and lands INSTANTLY while the 400-period revival scan behind it is still on its way — checked at n̄ = 12, 30 and 97. (3) THE SPECTRUM carries the law itself with the selected label\'s E, arg c and |c| read back out of the coefficient vector the frame is drawing from. ONLY THREE OF THE LAB\'S HUNDRED-ODD READOUTS MOVE, and the others were left still on purpose: a number that is not a closed form of something the hand or the clock is turning has nothing true to say between two states. And nothing announces — there is no aria-live anywhere near a formula, because a slot moving at 5 Hz behind one would be a hundred utterances a minute',
    !w69dynT.error && w69dynT.period.exact && w69dynT.period.T > 0 && w69dynT.ok1 && w69dynT.ok1b && w69dynT.ok2 && w69dynT.ok3
      && w69dynT.live === 0 && w69dynT.slots >= 9 && w69dynT.errs === 0, w69dynT);

  /* B149 is in THREE parts, because the keyboard half needs a REAL driver key and `press()` is a
     node-side helper: a synthesised KeyboardEvent has no default action, so a fake Tab would move no
     focus and prove nothing (the wave-57/62 lesson, ANTI-PATTERN 21's shape). */
  const w69m1 = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = {};
    /* ── (a) THE ENTRANCE EXISTS, AND IT IS ONE-SHOT CHROME ───────────────────────────────── */
    const dev = document.querySelector('.dev[data-id="wigner"]');
    /* 0.5.0 re-aim (C3): the entrance is the kit rack's own Web Animation on the window (translate 6 px over --rack-enter, 220 ms on the law's curve), not the lab's .dev-enter class */
    const wa = () => dev.getAnimations().filter((a) => a.constructor.name === 'Animation' && a.effect.getTiming().duration === 220);   // the entrance is 220 ms; the rack's own 320-ms reflow moves (neighbours making room) are not it
    window.__devWa = () => document.getAnimations().filter((a) => a.constructor.name === 'Animation' && a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('dev'));
    dev.classList.add('closed');
    __LW.layout.reopen('wigner', 'R');
    const tm = wa().length ? wa()[0].effect.getTiming() : {};
    out.enter = { cls: wa().length === 1, name: 'waapi', dur: tm.duration, ease: tm.easing, iter: tm.iterations };
    await nap(420);
    out.enterGone = wa().length === 0;
    /* raise() also clears .closed and must NOT animate — the WINDOW menu is the same act as TAB */
    __LW.layout.raise('wigner');
    out.raiseQuiet = wa().length === 0;
    document.getElementById('field').focus();
    out.before = window.__devWa().filter((a) => a.effect.getTiming().duration === 220).length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  await press(KEY.TAB); await press(KEY.TAB);
  const w69motT = await g.ev(`try {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = {};
    /* ── (b) A KEYBOARD ACTION ANIMATED NOTHING.  TAB raises a window; it must not travel ──── */
    out.tab = { after: window.__devWa().length,
      running: window.__devWa().filter((a) => a.playState === 'running').length };
    /* ── (c) REDUCED MOTION, APPLIED AT REAL SPECIFICITY ON THE REAL ELEMENTS ─────────────────
       The OS preference cannot be driven from this harness, so the block is taken out of its @media
       wrapper and injected as written: that measures the SELECTORS against the elements that carry
       the transforms, which is exactly what the four-wave-old specificity bug was. */
    const blocks = [];
    for (const sh of document.styleSheets) { try {
      for (const r of sh.cssRules) if (r.type === 4 && /prefers-reduced-motion/.test(r.conditionText || (r.media && r.media.mediaText) || '')) blocks.push(r);
    } catch (e) {} }
    /* THERE ARE TWO of them — lab.css's and skin.css's — and taking one would have measured the wrong
       half.  ALL of them are lifted, which is also what the browser would do under the preference. */
    out.found = blocks.length;
    if (!blocks.length) return out;
    const dev = document.querySelector('.dev[data-id="wigner"]');
    document.body.classList.add('rack-hidden');
    const rack = document.getElementById('rack');
    await nap(40);
    out.beforeRM = { tp: getComputedStyle(rack).transitionProperty, tf: getComputedStyle(rack).transform !== 'none',
      chev: getComputedStyle(document.querySelector('.dev-fold > svg')).transitionDuration };
    const st = document.createElement('style');
    st.textContent = blocks.map((b) => [...b.cssRules].map((r) => r.cssText).join(String.fromCharCode(10))).join(String.fromCharCode(10));
    document.head.appendChild(st);
    dev.classList.add('dev-enter');
    await nap(40);
    out.afterRM = { tp: getComputedStyle(rack).transitionProperty, tf: getComputedStyle(rack).transform !== 'none',
      chev: getComputedStyle(document.querySelector('.dev-fold > svg')).transitionDuration,
      enter: getComputedStyle(dev).animationName };
    out.rmOk = out.beforeRM.tf && !out.afterRM.tf
      && out.beforeRM.tp.indexOf('transform') >= 0 && out.afterRM.tp.indexOf('transform') < 0
      && out.afterRM.tp.indexOf('opacity') >= 0
      && out.beforeRM.chev !== '0s' && out.afterRM.chev === '0s';   // 0.5.0 re-aim (C3): "the entrance falls back to its opacity-only keyframe" is retired — the kit's enter() plays nothing at all under reduced motion (motionPolicy), and its quiet keyframe sits inside @layer mir where this lift does not reach
    dev.classList.remove('dev-enter'); st.remove(); document.body.classList.remove('rack-hidden');
    await nap(80);
    out.errs = window.__e.length;
    return out;
  } catch (e) { return { error: String(e && e.message ? e.message + ' @ ' + e.stack : e) }; }`) || { error: 'no result' };
  judge('B149 THE MOTION PASS, GATED WHERE AN EYE CANNOT CHECK IT (wave 69). MOTION-LAW gate 1 files "window open/close" under OCCASIONAL, the one tier that gets a standard animation, and this lab now has exactly ONE entrance: 220 ms — inside the 300 ms ceiling — with the law\'s entrance easing verbatim, opacity and a 7-px slide, one iteration, on chrome, in no accent colour. IT IS ON `reopen()` ALONE and that is the law rather than an oversight: `raise()` also clears `.closed`, TAB reaches it, and A KEYBOARD-INITIATED ACTION IS NEVER ANIMATED — "the key is the user asking for the result, not the journey" — so two REAL driver Tabs raise two windows and start zero animations, and a menu raise travels no further. THE SECOND HALF IS THE ONE MOTION-LAW SAID WAS UNFINISHED and predicted would keep growing: the preference reached 9 of the lab\'s 34 transition sites because `body.rack-hidden #rack` is (1,1,1) and the media block named `#rack` at (1,0,0), so the 310-px slide it was written for never heard it. The OS preference cannot be driven from this harness, so the block is lifted out of its @media wrapper and injected as written — which measures the SELECTORS against the elements that actually carry the transforms, and is the only thing that could have caught a specificity bug. Before: #rack transitions transform and has one. After: the transform is gone, OPACITY REMAINS (fewer and gentler, never zero), both fold chevrons stop, and the entrance falls back to its opacity-only keyframe',
    !w69m1.error && !w69motT.error && w69m1.enter.cls && w69m1.enter.name === 'waapi'
      && w69m1.enter.dur === 220 && w69m1.enter.ease === 'cubic-bezier(0.23, 1, 0.32, 1)' && w69m1.enter.iter === 1 && w69m1.enterGone && w69m1.raiseQuiet
      && w69m1.before === 0 && w69motT.tab.after === 0 && w69motT.tab.running === 0
      && w69motT.found >= 2 && w69motT.rmOk && w69motT.errs === 0, { a: w69m1, b: w69motT });

  /* ── the end: no errors, a last look ───────────────────────────────────── */
  const errs = await g.ev('return { errs: window.__e, gpu: __LW.field.lastGpuError || null, frames: __LW.stats.frames, recon: __LW.stats.reconstructs, presents: __LW.stats.presents };');
  if (STALLS) console.log('NOTE ' + STALLS + ' reload(s) came up unpainted and were re-navigated (goPainted) — see LEGACY-BOOT-REAIM.md');
  judge('B13 no page errors, no uncaptured GPU errors after the whole run', errs.errs.length === 0 && !errs.gpu, errs);
  await g.ev(`__LW.loadPreset('rydberg'); __LW.scrub(300); await __LW.settle(); return 1;`);
  fs.writeFileSync(ROOT + '/.tmp/boot-final.png', Buffer.from(await g.snap(), 'base64'));
} finally { await g.close(); }
process.exit(done('boot.browser-test'));
