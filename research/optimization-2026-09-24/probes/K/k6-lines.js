/* probes/K/k6-lines.js — K6(b) gate: with the camera out of the box/axes cache key, a camera move never leaves a stale
 * buffer.  For every FRAME mode × axis mode: linePixels at pose A, turn the camera to pose B, linePixels through the cache,
 * then force a fresh write at pose B (lightUI flipped and back) and read again — the cached and the fresh bytes must match;
 * the chrome-write counter says which modes rewrote on the turn.  Bytes hashed as they are mapped (the lock's road). */
const LW = __LW, F = LW.field, d = F.device;
const fm = await import('/lab/field.js');
LW.pause(); LW.governor.on = false; LW.quality.auto = false;
const fnv = (px, w, h, bpr) => { let hs = 2166136261 >>> 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * bpr + x * 4; hs = Math.imul(hs ^ (px[o] + (px[o + 1] << 8) + (px[o + 2] << 16)), 16777619) >>> 0; } return hs.toString(16); };
async function lp(w = 480, h = 360) {
  F.setOcclusion([[30, 30, 200, 120]]);                  // before EVERY read: a rack frame may have refreshed the block (the lock does the same)
  let bytes = null; const own = Object.prototype.hasOwnProperty.call(d, 'createBuffer'), orig = d.createBuffer;
  d.createBuffer = function (desc) { const b = orig.call(d, desc); if (desc.usage & GPUBufferUsage.MAP_READ) { const g = b.getMappedRange.bind(b); b.getMappedRange = (...a) => { const r = g(...a); bytes = new Uint8Array(r.slice(0)); return r; }; } return b; };
  let p; try { p = F.linePixels(LW.obs, LW.mat, w, h); } finally { if (own) d.createBuffer = orig; else delete d.createBuffer; }
  await p; return fnv(bytes, w, h, Math.ceil(w * 4 / 256) * 256);
}
F.setOcclusion([[30, 30, 200, 120]]);
const q0 = LW.obs.quat.slice(), mat0 = JSON.parse(JSON.stringify({ frame: LW.mat.frame, frameMode: LW.mat.frameMode, axis: LW.mat.axis, axisMode: LW.mat.axisMode, lightUI: LW.mat.lightUI }));
const out = { rows: {}, stale: 0 };
for (const [fk, fmode] of [['off', { frame: false }], ['box', { frame: true, frameMode: 'box' }], ['lattice', { frame: true, frameMode: 'lattice' }], ['dots', { frame: true, frameMode: 'dots' }]])
  for (const [ak, amode] of [['axes', { axis: true, axisMode: 'box' }], ['corner', { axis: true, axisMode: 'corner', cornerX: 0.8, cornerY: -0.8, cornerScaleX: 0.04, cornerScaleY: 0.064 }], ['noaxes', { axis: false }]]) {
    Object.assign(LW.mat, fmode, amode); LW.obs.quat = q0.slice();
    const a = await lp();
    const w0 = F.stats.chromeWrites;
    LW.obs.quat = fm.turnFree(q0, 0.4, 0.15);
    const b = await lp();
    const rewrote = F.stats.chromeWrites - w0;
    LW.mat.lightUI = !LW.mat.lightUI; await lp(); LW.mat.lightUI = !LW.mat.lightUI;
    const c = await lp();
    if (b !== c) out.stale++;
    out.rows[fk + '+' + ak] = { poseA: a, poseB: b, fresh: c, same: b === c, moved: a !== b, rewroteOnTurn: rewrote };
  }
LW.obs.quat = q0; Object.assign(LW.mat, mat0); F.setOcclusion([]); LW.schedule(2); await LW.settle();
return out;
