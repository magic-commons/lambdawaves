/* probes/K/k12-occ.js — K12 gate: the occlusion block after a render-scale change with no window moved.
 * The app's own rectangles are recorded through a wrapper on field.setOcclusion (one refresh forced by a window 'resize'
 * event at scale 1).  Then quality.scale 1 → 0.5 through the rack's own loop (refreshOcclusion runs BEFORE field.resize
 * there, and the rectangles did not move), and linePixels at the canvas' own size is read twice: as the rack left the
 * block, and after a FRESH upload of the same CSS rectangles at the new size.  Before the fix the two differ (the
 * device-pixel rectangles kept the old scale); after it they must be the same bytes. */
const LW = __LW, F = LW.field, d = F.device;
const fnv = (px, w, h, bpr) => { let hs = 2166136261 >>> 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * bpr + x * 4; hs = Math.imul(hs ^ (px[o] + (px[o + 1] << 8) + (px[o + 2] << 16)), 16777619) >>> 0; } return hs.toString(16); };
async function lp() {
  const w = F.canvas.width, h = F.canvas.height;
  let bytes = null; const own = Object.prototype.hasOwnProperty.call(d, 'createBuffer'), orig = d.createBuffer;
  d.createBuffer = function (desc) { const b = orig.call(d, desc); if (desc.usage & GPUBufferUsage.MAP_READ) { const g = b.getMappedRange.bind(b); b.getMappedRange = (...a) => { const r = g(...a); bytes = new Uint8Array(r.slice(0)); return r; }; } return b; };
  let p; try { p = F.linePixels(LW.obs, LW.mat, w, h); } finally { if (own) d.createBuffer = orig; else delete d.createBuffer; }
  const r = await p; return { hash: fnv(bytes, w, h, Math.ceil(w * 4 / 256) * 256), grey: r.buckets.grey, w, h };
}
LW.pause(); LW.governor.on = false; LW.quality.auto = false; LW.quality.autoScale = 1; LW.quality.scale = 1;
LW.setFrame(true); LW.mat.frameMode = 'box'; LW.setAxis(true); LW.mat.axisMode = 'box';
let last = null; const orig = F.setOcclusion;
F.setOcclusion = function (rects) { last = rects.map((r) => r.slice()); return orig.call(this, rects); };
window.dispatchEvent(new Event('resize'));
for (let i = 0; i < 3; i++) await LW.settle();
const R = last ? last.map((r) => r.slice()) : null;
const s1 = await lp();
orig.call(F, []); orig.call(F, R); const s1f = await lp();
LW.quality.scale = 0.5; LW.schedule(LW.TIER.PRESENT);
for (let i = 0; i < 3; i++) await LW.settle();
const movedRects = JSON.stringify(last) !== JSON.stringify(R);
const s2 = await lp();
orig.call(F, []); orig.call(F, R); const s2f = await lp();
F.setOcclusion = orig;
LW.quality.scale = 1; LW.schedule(LW.TIER.PRESENT); await LW.settle();
return { rects: R ? R.length : 0, rectsMovedDuringScale: movedRects, scale1: { rack: s1.hash, fresh: s1f.hash, same: s1.hash === s1f.hash, w: s1.w },
  scaleHalf: { rack: s2.hash, fresh: s2f.hash, same: s2.hash === s2f.hash, w: s2.w, h: s2.h } };
