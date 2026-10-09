/* research/release-0.5.0/measure/c7-verify/c7v-probe.mjs — the C7 film verifier's own probe (not shipped).
 *   LW_PORT=8853 GD_PORT=5323 node research/release-0.5.0/measure/c7-verify/c7v-probe.mjs <scenario> <out.json>
 * scenarios:
 *   lead1   a REAL tap on RECORD (trusted click) with navigator.share/canShare stubbed to the Web Share spec's rule
 *           (share() without transient activation rejects NotAllowedError); logs navigator.userActivation at the click and
 *           at save time; records whether any <a download> fell back.  Then TAKE A PICTURE by a real tap, then the
 *           direct saveBlob controls (inside a trusted click, outside one, and an iPad user agent).
 *   cancel  a real tap on RECORD, STOP tapped (under the kit's input guard) before the first checkpoint; then RECORD,
 *           Escape after the first checkpoint; OPFS lambdawaves-recordings listed after each.  Then the 2-minute
 *           discard: a saved film's OPFS copy listed right after save.
 *   mp4     RECORD with AUTO-ROTATE on (turntable), the MP4 written to <out>.mp4 for ffprobe/ffmpeg.
 */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8853';
const SCEN = process.argv[2] || 'lead1';
const OUT = process.argv[3] || '.tmp/c7v-' + SCEN + '.json';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 900000,
  prefs: { 'privacy.reduceTimerPrecision': false, 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true } });
const res = { scenario: SCEN };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (k, v) => { res[k] = v; console.log(k, JSON.stringify(v).slice(0, 1500)); };
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  log('setup', await g.ev(`
    try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    const UA = () => ({ isActive: navigator.userActivation ? navigator.userActivation.isActive : 'no-api', hasBeenActive: navigator.userActivation ? navigator.userActivation.hasBeenActive : 'no-api' });
    window.__V = { UA, log: [], push(k, o) { __V.log.push(Object.assign({ k, at: Math.round(performance.now()) }, UA(), o || {})); } };
    /* opfs lister */
    __V.opfs = async () => { const out = [];
      try { const root = await navigator.storage.getDirectory(); let d; try { d = await root.getDirectoryHandle('lambdawaves-recordings'); } catch (_) { return { none: true }; }
        for await (const [id, h] of d.entries()) { const files = []; if (h.kind === 'directory') for await (const [n, f] of h.entries()) { let size = null; try { size = (await f.getFile()).size; } catch (_) {} files.push([n, size]); }
          let state = null; try { state = JSON.parse(await (await (await h.getFileHandle('job.json')).getFile()).text()); state = { state: state.state, files: state.files, checkpoint: state.checkpoint ? { frames: state.checkpoint.frames, samples: state.checkpoint.samples ? state.checkpoint.samples.length : null } : null, token: state.spec && state.spec.app ? state.spec.app.token : null }; } catch (_) {}
          out.push({ id, kind: h.kind, files, job: state }); } } catch (e) { return { E: String(e) }; }
      return out; };
    __V.prog = () => { const m = [...document.querySelectorAll('.ro, .readout')].map((e) => e.textContent).join(' | ').match(/(\\d+) \\/ (\\d+) frames/); return m ? [+m[1], +m[2]] : null; };
    /* a capture-phase listener: the activation state AT the real click */
    document.addEventListener('click', (e) => { const t = e.target && e.target.closest ? e.target.closest('.trig, button, [data-render-cancel], #vtap') : null; __V.push('click', { trusted: e.isTrusted, on: t ? (t.id || t.textContent.trim().slice(0, 24)) : String(e.target && e.target.tagName) }); }, true);
    /* every <a download> recorded and NOT followed (no file leaves the headless page) */
    const aclick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download) { __V.push('anchor-download', { name: this.download }); return; } return aclick.call(this); };
    __LW.pause(); __LW.scrub(0); await __LW.settle(); await __LW.settle();
    return { ua: navigator.userAgent, hasUA: !!navigator.userActivation, share: typeof navigator.share, canShare: typeof navigator.canShare, canvas: [__LW.field.canvas.width, __LW.field.canvas.height] };`));
  const stubShare = `
    /* THE WEB SHARE SPEC'S RULE (W3C Web Share §share(): "If this's relevant global object does not have transient activation,
       return a promise rejected with NotAllowedError"), stubbed so Linux Firefox takes the share road Chrome/Safari take.
       canShare is PERMISSIVE (Safari-like: any file); Chrome's allowlist admits .mp4 and .png, not .zip. */
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: (d) => { __V.push('canShare', { files: d && d.files ? d.files.map((f) => f.name + ' ' + f.type + ' ' + f.size) : null }); return true; } });
    Object.defineProperty(navigator, 'share', { configurable: true, value: (d) => { const a = navigator.userActivation.isActive;
      __V.push('share', { files: d && d.files ? d.files.map((f) => f.name + ' ' + f.size) : null });
      const p = a ? Promise.resolve() : Promise.reject(new DOMException('Must be handling a user gesture to perform a share request.', 'NotAllowedError'));
      p.then(() => __V.push('share-resolved'), (e) => __V.push('share-REJECTED', { name: e.name, message: e.message })); return p; } });
    const F = __LW.captureUI.exact, C = __LW.captureUI.capture;
    const fs0 = F.save, cs0 = C.save;
    F.save = (r) => { __V.push('film.save', { name: r && r.name, files: r && r.files ? r.files.length : 0, bytes: r && r.bytes }); const v = fs0(r); __V.push('film.save returned', { v }); return v; };
    C.save = (r) => { __V.push('capture.save', { name: r && r.name, bytes: r && r.bytes }); const v = cs0(r); __V.push('capture.save returned', { v }); return v; };
    return true;`;
  const showRec = `const S = document.querySelector('.dev[data-id="camera"]'); S.classList.remove('closed'); if (S.classList.contains('folded')) S.querySelector('.dev-fold').click();
    const rec = [...S.querySelectorAll('[data-render-cancel]')].find((b) => /RECORD|STOP/.test(b.textContent)); rec.id = 'vrec';
    const pic = [...S.querySelectorAll('.trig, button')].find((b) => /TAKE A PICTURE/.test(b.textContent)); if (pic) pic.id = 'vpic';
    rec.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise((r) => setTimeout(r, 300));
    return { rec: rec.textContent.trim(), cancelAttr: rec.hasAttribute('data-render-cancel'), pic: !!pic };`;
  const pollUntil = async (expr, ms, gap = 500) => { const t0 = Date.now(); for (;;) { const v = await g.ev(`try { return (${expr}); } catch (e) { return null; }`); if (v) return { v, ms: Date.now() - t0 }; if (Date.now() - t0 > ms) return { v: null, ms: Date.now() - t0, timeout: true }; await wait(gap); } };

  if (SCEN === 'lead1') {
    log('stub', await g.ev(stubShare));
    log('show', await g.ev(showRec));
    const t0 = Date.now();
    log('tapRecord', await g.tap('#vrec'));
    log('started', await pollUntil(`__LW.captureUI.busy`, 5000, 100));
    const end = await pollUntil(`__V.log.some((x) => x.k === 'film.save') && !__LW.captureUI.busy`, 240000, 1000);
    await wait(1500);
    log('filmDone', { wallMs: Date.now() - t0, end });
    log('filmLog', await g.ev(`return __V.log.splice(0);`));
    /* TAKE A PICTURE by a real tap: its save comes after ~1 s of awaits */
    await g.ev(`const p = document.getElementById('vpic'); p.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise((r) => setTimeout(r, 300)); return 1;`);
    log('tapPicture', await g.tap('#vpic'));
    await pollUntil(`__V.log.some((x) => x.k === 'capture.save returned')`, 30000, 300);
    await wait(800);
    log('pictureLog', await g.ev(`return __V.log.splice(0);`));
    /* the direct controls on the kit's saveBlob itself */
    log('direct', await g.ev(`
      const { saveBlob, prefersVideoDownload } = await import('/lab/mir/folders/save-blob.js');
      const zip = new Blob([new Uint8Array(1000)], { type: 'application/zip' }), mp4 = new Blob([new Uint8Array(1000)], { type: 'video/mp4' });
      const out = {};
      /* (a) outside any tap: what a film's save is */
      out.outside = { ret: saveBlob(mp4, 'outside.mp4'), ua: __V.UA() };
      await new Promise((r) => setTimeout(r, 200));
      out.outsideLog = __V.log.splice(0);
      /* (c) an iPad user agent: a video takes the download road, a ZIP (EXPORT FRAMES) the share road */
      const ua0 = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent');
      Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
      out.ipad = { prefersVideoDownload: prefersVideoDownload(), mp4: saveBlob(mp4, 'ipad.mp4'), zip: saveBlob(zip, 'ipad-frames.zip') };
      await new Promise((r) => setTimeout(r, 200));
      out.ipadLog = __V.log.splice(0);
      delete navigator.userAgent;
      out.uaBack = navigator.userAgent.slice(0, 40);
      /* (b) inside a trusted tap: the overlay button calls saveBlob synchronously in its handler */
      const b = document.createElement('button'); b.id = 'vtap'; b.textContent = 'VTAP';
      Object.assign(b.style, { position: 'fixed', left: '600px', top: '400px', width: '120px', height: '60px', zIndex: 2147483647 });
      b.addEventListener('click', () => { window.__inside = { ret: saveBlob(zip, 'inside.zip'), ua: __V.UA() }; });
      document.body.appendChild(b);
      return out;`));
    log('tapInside', await g.tap('#vtap'));
    await wait(500);
    log('inside', await g.ev(`return { inside: window.__inside, log: __V.log.splice(0) };`));
  }

  if (SCEN === 'cancel') {
    log('show', await g.ev(showRec));
    log('opfs0', await g.ev(`return await __V.opfs();`));
    /* A · STOP tapped before the first checkpoint (frame 60 at 30 fps) */
    log('tapRecordA', await g.tap('#vrec'));
    log('progressA', await pollUntil(`(() => { const p = __V.prog(); return p && p[0] >= 15 ? p : null; })()`, 60000, 200));
    log('labelA', await g.ev(`return document.getElementById('vrec').textContent.trim();`));
    log('tapStopA', await g.tap('#vrec'));
    log('idleA', await pollUntil(`!__LW.captureUI.busy`, 30000, 200));
    await wait(1500);
    log('readoutA', await g.ev(`return [...document.querySelectorAll('.ro, .readout')].map((e) => e.textContent.replace(/\\s+/g, ' ').trim()).filter((x) => /stopped|STOPPED|refused|error/i.test(x)).slice(0, 2);`));
    log('opfsA', await g.ev(`return await __V.opfs();`));
    await wait(4000);
    /* B · Escape after the first checkpoint */
    log('tapRecordB', await g.tap('#vrec'));
    log('progressB', await pollUntil(`(() => { const p = __V.prog(); return p && p[0] >= 75 ? p : null; })()`, 90000, 200));
    await g.press('');
    log('idleB', await pollUntil(`!__LW.captureUI.busy`, 30000, 200));
    await wait(1500);
    log('readoutB', await g.ev(`return [...document.querySelectorAll('.ro, .readout')].map((e) => e.textContent.replace(/\\s+/g, ' ').trim()).filter((x) => /stopped|STOPPED|refused|error/i.test(x)).slice(0, 2);`));
    log('opfsB', await g.ev(`return await __V.opfs();`));
    await wait(2000);
    /* C · a SAVED film: its OPFS copy stays for 2 minutes after the hand-over (a tab closed now keeps it forever) */
    await g.ev(`const F = __LW.captureUI.exact; const s0 = F.save; window.__savedAt = null; F.save = (r) => { window.__savedAt = performance.now(); return s0(r); }; return 1;`);
    log('tapRecordC', await g.tap('#vrec'));
    log('savedC', await pollUntil(`window.__savedAt && !__LW.captureUI.busy`, 240000, 1000));
    await wait(1000);
    log('opfsC', await g.ev(`return await __V.opfs();`));
  }

  if (SCEN === 'persist') {
    /* a saved film, then the tab reloads inside the 2 minutes: does anything sweep the store at boot, or later? */
    log('show', await g.ev(showRec));
    await g.ev(`const F = __LW.captureUI.exact; const s0 = F.save; window.__savedAt = null; F.save = (r) => { window.__savedAt = performance.now(); return s0(r); }; return 1;`);
    log('tapRecord', await g.tap('#vrec'));
    log('saved', await pollUntil(`window.__savedAt && !__LW.captureUI.busy`, 240000, 1000));
    log('opfsSaved', await g.ev(`return await __V.opfs();`));
    await g.nav();
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    await wait(3000);
    const lister = `const root = await navigator.storage.getDirectory(); let d; try { d = await root.getDirectoryHandle('lambdawaves-recordings'); } catch (_) { return { none: true }; } const out = []; for await (const [id, h] of d.entries()) { const files = []; for await (const [n, f] of h.entries()) files.push([n, (await f.getFile()).size]); out.push({ id, files }); } return out;`;
    log('opfsAfterReload', await g.ev(lister));
    await wait(130000);
    log('opfsReload130s', await g.ev(lister));
  }

  if (SCEN === 'mp4') {
    log('setupMp4', await g.ev(`
      const cam = __LW.camera; const before = { autoRotate: cam.autoRotate, ambient: cam.ambient, mode: __LW.obs && __LW.obs.mode, yaw: __LW.obs && __LW.obs.yaw };
      if (${JSON.stringify(process.argv[4] || '')} === 'turntable') { const b = [...document.querySelectorAll('.seg-b')].find((x) => x.textContent.trim() === 'TURNTABLE'); if (b) b.click(); for (let i = 0; i < 40; i++) { await __LW.settle(); await new Promise((r) => setTimeout(r, 50)); } before.modeNow = __LW.obs.mode; }
      if (cam.setAutoRotate) cam.setAutoRotate(true); else cam.autoRotate = true;
      const F = __LW.captureUI.exact; window.__res = null; F.save = (r) => { window.__res = r; return true; };
      return { before, after: { autoRotate: cam.autoRotate, ambient: cam.ambient, moving: cam.moving } };`));
    const t0 = Date.now();
    log('record', await g.ev(`await __LW.captureUI.record(); const r = window.__res; return r ? { name: r.name, frames: r.frames, bytes: r.bytes, ok: r.ok, pins: r.pins, first: r.manifest.frames[0], last: r.manifest.frames[r.manifest.frames.length - 1] } : { none: true, ro: [...document.querySelectorAll('.ro, .readout')].map((e) => e.textContent.replace(/\\s+/g, ' ').trim()).filter((x) => /CLIP|refused|error|stopped/i.test(x)).slice(0, 2) };`));
    res.recordMs = Date.now() - t0;
    const b64 = await g.ev(`const r = window.__res; if (!r) return null; const u = new Uint8Array(await r.blob.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s);`);
    if (b64) { fs.writeFileSync(OUT.replace(/\.json$/, '') + '.mp4', Buffer.from(b64, 'base64')); log('wrote', OUT.replace(/\.json$/, '') + '.mp4'); }
  }
  log('errors', await g.ev(`return (window.__e || []).slice(0, 8);`));
} catch (e) { log('FATAL', String(e && e.stack || e)); }
finally { await g.close(); }
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
