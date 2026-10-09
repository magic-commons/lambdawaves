/* tools/perf/film-probe.mjs (0.5.0 C7, the film verifier's harness; D5 reuses it) — C7's film, produced through the rack's own verbs with the hand-over stubbed:
 * a PNG (TAKE A PICTURE's road), a loop (ONE PERIOD), a video (RECORD), EXPORT FRAMES, each decoded and measured.
 *   LW_PORT=8813 GD_PORT=5283 node tools/perf/film-probe.mjs [out.json or -] [steps: picture,loop,video,frames,verify]
 */
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8813';
const OUT = process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : null;
const STEPS = (process.argv[3] || 'picture,loop,video,frames,verify').split(',');
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 900000,
  prefs: { 'privacy.reduceTimerPrecision': false, 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true } });
const res = { steps: STEPS };
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  await g.ev(`
    try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    window.__P = {
      fnv: (b) => { let h = 2166136261 >>> 0; for (let i = 0; i < b.length; i++) h = Math.imul(h ^ b[i], 16777619) >>> 0; return h.toString(16); },
      async pixels(blob) { const bm = await createImageBitmap(blob); const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; const x = c.getContext('2d'); x.drawImage(bm, 0, 0); const d = x.getImageData(0, 0, bm.width, bm.height).data; let lit = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 72) lit++; return { w: bm.width, h: bm.height, hash: __P.fnv(d), lit: +(lit / (d.length / 4)).toFixed(4) }; },
      saved: [],
    };
    const F = __LW.captureUI.exact; F.save = (r) => { __P.saved.push(r); return true; };
    __LW.pause(); __LW.scrub(0); await __LW.settle(); await __LW.settle();
    return true;`);
  res.canvas = await g.ev(`return [__LW.field.canvas.width, __LW.field.canvas.height, navigator.userAgent];`);
  const step = async (name, body) => {
    if (!STEPS.includes(name)) return;
    const t = Date.now();
    try { res[name] = await g.ev(body); } catch (e) { res[name] = { E: String(e && e.stack || e) }; }
    if (res[name] && typeof res[name] === 'object') res[name].wallMs = Date.now() - t;
    console.log(name, JSON.stringify(res[name]).slice(0, 900));
  };
  await step('picture', `try { const C = __LW.captureUI.capture;
    const p1 = await C.picture({ scale: 1, caption: false }), p2 = await C.picture({ scale: 1, caption: false });
    const b1 = new Uint8Array(await p1.blob.arrayBuffer()), b2 = new Uint8Array(await p2.blob.arrayBuffer());
    return { name: p1.name, w: p1.w, h: p1.h, bytes: p1.bytes, same: __P.fnv(b1) === __P.fnv(b2), hash: __P.fnv(b1), px: await __P.pixels(p1.blob) };
    } catch (e) { return { E: String(e && e.stack || e) }; }`);
  const film = (verb, kind) => `try { const UI = __LW.captureUI; let err = null;
    try { await UI.${verb}(); } catch (e) { err = String(e && e.stack || e); }
    const r = __P.saved.pop();
    const ro = [...document.querySelectorAll('.readout, .ro')].map((e) => e.textContent.replace(/\\s+/g, ' ').trim()).filter((x) => /LOOP|CLIP|PERIOD|refused|error|stopped|FAILED|ABORT/i.test(x)).slice(0, 3);
    if (!r) return { none: true, err, ro };
    const head = new Uint8Array(await r.blob.slice(0, 12).arrayBuffer());
    let decoded = null;
    try { const v = document.createElement('video'); v.muted = true; v.src = URL.createObjectURL(r.blob);
      await new Promise((ok, no) => { v.onloadeddata = ok; v.onerror = () => no(new Error('decode failed')); setTimeout(() => no(new Error('timeout')), 8000); });
      decoded = { w: v.videoWidth, h: v.videoHeight, duration: v.duration }; URL.revokeObjectURL(v.src); } catch (e) { decoded = { E: String(e.message || e) }; }
    return { kind: '${kind}', name: r.name, ok: r.ok, frames: r.frames, w: r.w, h: r.h, fps: r.fps, bytes: r.bytes, files: r.files.map((f) => [f.name, f.bytes]),
      box: new TextDecoder().decode(head.slice(4, 8)), decoded, contended: r.contended, report: r.report.human, mode: r.mode,
      first: r.manifest.frames[0], last: r.manifest.frames[r.manifest.frames.length - 1], err, ro,
      digests: r.manifest.frames.map((f) => f.digest), times: r.manifest.frames.map((f) => f.t) };   /* 0.5.0 C7b: every frame, for film-compare */
    } catch (e) { return { E: String(e && e.stack || e) }; }`;
  await step('loop', film('loop', 'ONE PERIOD'));
  await step('video', film('record', 'RECORD'));
  await step('frames', `try { const UI = __LW.captureUI;
    const ex = await UI.exportFrames({ download: false, fps: 24, seconds: 1, scale: 1 });
    let zip = null;
    const OLD = !!(ex && ex.manifest && ex.manifest.format === 'lambdawaves/render-exact@1');
    if (ex && ex.files && ex.files.length && !OLD) {
      const z = await import('/lab/mir/core/zip.js');
      const m = z.readStoredZip(new Uint8Array(await ex.files[0].blob.arrayBuffer()));
      const names = [...m.keys()], frames = [];
      for (const n of names.filter((n) => /\\.png$/.test(n))) frames.push(await __P.pixels(new Blob([m.get(n)], { type: 'image/png' })));
      const rj = JSON.parse(new TextDecoder().decode(m.get('recording.json')));
      zip = { name: ex.name, part: ex.files[0].name, bytes: ex.bytes, entries: names.length, first: names[0], frames: frames.length, hashes: frames.map((f) => f.hash), lit0: frames[0] && frames[0].lit, size: frames[0] && [frames[0].w, frames[0].h],
        recording: { kind: rj.kind, fps: rj.fps, frames: rj.frames, motion: rj.motion, app: !!rj.app, schedule: rj.app && rj.app.film && rj.app.film.schedule && rj.app.film.schedule.mode } };
    } else if (ex && ex.files) {
      /* the pre-C7 road: PNG files in the result */
      const frames = []; for (const f of ex.files) frames.push(await __P.pixels(new Blob([f.bytes], { type: 'image/png' })));
      zip = { old: true, bytes: ex.bytes, frames: frames.length, hashes: frames.map((f) => f.hash), lit0: frames[0] && frames[0].lit, size: frames[0] && [frames[0].w, frames[0].h] };
    }
    return { ok: ex && ex.ok, message: ex && (ex.message || ex.error), mode: ex && ex.mode, N: ex && ex.requested, times: ex && ex.manifest && ex.manifest.frames.map((f) => f.t), zip };
    } catch (e) { return { E: String(e && e.stack || e) }; }`);
  await step('verify', `try { const v = await __LW.captureUI.exact.verify({ frames: 6, width: 160 }); return { ok: v.ok, frames: v.frames, message: v.message, mismatches: v.mismatches, digests: v.digests }; } catch (e) { return { E: String(e && e.stack || e) }; }`);
  res.after = await g.ev(`return { t: __LW.clock.t, playing: __LW.clock.playing, canvas: [__LW.field.canvas.width, __LW.field.canvas.height], scheduled: __LW.stats.scheduled, errors: (window.__e || []).slice(0, 5) };`);
  console.log('after', JSON.stringify(res.after));
} finally { await g.close(); }
if (OUT) fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
