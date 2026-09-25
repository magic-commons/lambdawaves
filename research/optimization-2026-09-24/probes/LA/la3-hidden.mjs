/* la3-hidden.mjs — LA3's gate: with the interface hidden (H) the occlusion burst reads no layout and hands the line
 * pass the same (empty) rectangle list; the frame's lines are identical over a hide → show round trip.
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/la3-hidden.mjs <tag> */
import { page, save, FNV } from './lib.mjs';
const g = await page();
const R = {};
const H = `document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', key: 'h', bubbles: true }));`;
try {
  await g.ev(`${FNV}
    window.__cnt = { gbcr: 0, gcs: 0, occ: [], on: false };
    const gb = Element.prototype.getBoundingClientRect; Element.prototype.getBoundingClientRect = function () { if (__cnt.on) __cnt.gbcr++; return gb.call(this); };
    const gc = window.getComputedStyle; window.getComputedStyle = function (...a) { if (__cnt.on) __cnt.gcs++; return gc.apply(window, a); };
    const F = __LW.field, so = F.setOcclusion; F.setOcclusion = function (rects) { const ch = so.call(this, rects); if (__cnt.on) __cnt.occ.push({ n: rects.length, changed: ch, sig: JSON.stringify(rects.map((r) => r.map(Math.round))) }); return ch; };
    window.__rows = []; const o = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (cb) { return o((ts) => { if (cb.name !== 'loop') { cb(ts); return; } const n0 = __cnt.occ.length, t0 = performance.now(); cb(ts); if (__cnt.on) __rows.push({ ms: +(performance.now() - t0).toFixed(3), occ: __cnt.occ.length > n0 }); }); };
    window.__lp = async () => { const p = await __LW.linePixels(); return fnv(JSON.stringify(p)); };
    window.__px = async () => { const p = await __LW.readPixels(); return p && p.hash !== undefined ? p.hash : fnv(JSON.stringify(p)); };
    return 1;`);
  R.shownBefore = await g.ev(`__LW.pause(); __LW.scrub(0); await __LW.settle(); await __LW.settle(); await new Promise((r) => setTimeout(r, 900));
    __cnt.on = true; __cnt.occ = []; window.dispatchEvent(new Event('resize')); await __LW.settle(); await __LW.settle(); __cnt.on = false;
    return { frame: __LW.mat.frame, axis: __LW.mat.axis, lines: await __lp(), pixels: await __px(), occ: __cnt.occ.slice(-1)[0] || null };`);
  R.hidden = await g.ev(`${H} await __LW.settle(); await __LW.settle();
    __cnt.gbcr = 0; __cnt.gcs = 0; __cnt.occ = []; __rows.length = 0; __cnt.on = true;
    __LW.play(); await new Promise((r) => setTimeout(r, 3000)); __LW.pause(); await __LW.settle(); __cnt.on = false;
    const rows = __rows.slice(), occRows = rows.filter((r) => r.occ).map((r) => r.ms), rest = rows.filter((r) => !r.occ).map((r) => r.ms);
    const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
    return { uiHidden: __LW.uiHidden, frames: rows.length, occBursts: __cnt.occ.length, occLens: [...new Set(__cnt.occ.map((o) => o.n))], occChanged: __cnt.occ.filter((o) => o.changed).length,
      gbcr: __cnt.gbcr, gcs: __cnt.gcs, loopMsOccFrames: med(occRows), loopMsOtherFrames: med(rest), linesHidden: await __lp() };`);
  R.shownAfter = await g.ev(`${H} __LW.scrub(0); await __LW.settle(); await __LW.settle();
    const firstBack = await __lp(); await new Promise((r) => setTimeout(r, 900));
    __cnt.on = true; __cnt.occ = []; window.dispatchEvent(new Event('resize')); await __LW.settle(); await __LW.settle(); __cnt.on = false;
    return { uiHidden: __LW.uiHidden, frame: __LW.mat.frame, axis: __LW.mat.axis, firstBack, lines: await __lp(), pixels: await __px(), occ: __cnt.occ.slice(-1)[0] || null };`);
  R.roundTrip = { linesEqual: R.shownBefore.lines === R.shownAfter.lines, pixelsEqual: R.shownBefore.pixels === R.shownAfter.pixels,
    occEqual: !!(R.shownBefore.occ && R.shownAfter.occ && R.shownBefore.occ.sig === R.shownAfter.occ.sig) };
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify({ hidden: R.hidden, roundTrip: R.roundTrip, before: R.shownBefore && { lines: R.shownBefore.lines, occN: R.shownBefore.occ && R.shownBefore.occ.n }, after: R.shownAfter && { firstBack: R.shownAfter.firstBack, lines: R.shownAfter.lines, occN: R.shownAfter.occ && R.shownAfter.occ.n, frame: R.shownAfter.frame, axis: R.shownAfter.axis }, errs: R.errs, error: R.error }));
save(import.meta.url, R);
