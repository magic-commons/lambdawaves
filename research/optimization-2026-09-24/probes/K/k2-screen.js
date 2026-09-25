/* probes/K/k2-screen.js — K2 on the SCREEN's own road: field.frame() into the canvas (its preferred format, bgra8unorm
 * here), copied out in the same task, specialised (warmed, unpinned) against generic (pinRenderPipeline) — every view ×
 * {cloud, grain, bands, dust} plus palette-on, invert, matte, dither, a slice, and the bow / glass-finish / lit styles
 * (which must fall back to generic: they read the same bytes by construction).  Then the export pin is checked live: a
 * render-exact verify() while the keys are compiled reports which pipeline its frames took (the ledger's `pinned`). */
const LW = __LW, F = LW.field, d = F.device, canvas = F.canvas, ctx = canvas.getContext('webgpu');
LW.pause(); LW.governor.on = false; LW.quality.auto = false; LW.quality.autoScale = 1; LW.quality.scale = 1;
LW.quality.res = 96; LW.quality.steps = 160; LW.schedule(4); await LW.settle(); await LW.settle();
const fm = await import('/lab/field.js');
const base = { device: d, format: F.format, alphaMode: 'opaque' };
ctx.configure(Object.assign({}, base, { usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC }));
const W = canvas.width, H = canvas.height, bpr = Math.ceil(W * 4 / 256) * 256;
async function shot(pinned) {
  if (pinned) F.pinRenderPipeline(true);
  const k = F.stats.presents; F.stats.presents = 13;
  F.frame({ obs: LW.obs, mat: LW.mat });
  F.stats.presents = k;
  if (pinned) F.pinRenderPipeline(false);
  const tex = ctx.getCurrentTexture(), buf = d.createBuffer({ size: bpr * H, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
  const enc = d.createCommandEncoder(); enc.copyTextureToBuffer({ texture: tex }, { buffer: buf, bytesPerRow: bpr }, [W, H]); d.queue.submit([enc.finish()]);
  await buf.mapAsync(GPUMapMode.READ); const px = new Uint8Array(buf.getMappedRange()); let h = 2166136261 >>> 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = y * bpr + x * 4; h = Math.imul(h ^ (px[o] + (px[o + 1] << 8) + (px[o + 2] << 16)), 16777619) >>> 0; }
  buf.unmap(); buf.destroy(); return h.toString(16);
}
const mat0 = JSON.parse(JSON.stringify({ view: LW.mat.view, style: LW.mat.style, paletteOn: LW.mat.paletteOn, invert: LW.mat.invert, finish: LW.mat.finish, dither: LW.mat.dither, slice: LW.mat.slice, boost: LW.mat.boost }));
const reset = () => { Object.assign(LW.mat, JSON.parse(JSON.stringify(mat0))); if (mat0.finish === undefined) delete LW.mat.finish; };
const rows = {}; let differ = 0, specRows = 0;
const run = async (name, set) => {
  reset(); set();
  const eligible = await F.renderPipelineReady(LW.mat);
  const a = await shot(false), b = await shot(true);
  if (a !== b) differ++; if (eligible) specRows++;
  rows[name] = { eligible, same: a === b };
};
for (let v = 0; v < 6; v++) for (const s of fm.SPEC_STYLES) await run(fm.VIEW_NAMES[v] + '/' + fm.STYLE_NAMES[s], () => { LW.mat.view = v; LW.mat.style = s; });
const FL = { 'palette-on': { paletteOn: true }, invert: { invert: true }, matte: { finish: 'matte' }, dither: { dither: 1 }, slab: { slice: { mode: 2, axis: 0, pos: -0.2, thick: 0.08 } },
  bow: { boost: { on: true, k: [0, 0.4, 1.2] } }, 'finish-glass': { finish: 'glass' }, solid: { style: 1 }, glass: { style: 6 }, additive: { style: 7 }, signed: { style: 3 } };
for (const [k, o] of Object.entries(FL)) for (const v of [0, 1, 2]) await run(k + ':' + fm.VIEW_NAMES[v], () => { LW.mat.view = v; LW.mat.style = 0; Object.assign(LW.mat, JSON.parse(JSON.stringify(o))); });
reset();
ctx.configure(base);
/* the export pin, live: verify() renders the same short schedule twice through grabExact → field.frame */
let pinnedSeen = 0, unpinnedSeen = 0; const origFrame = F.frame;
F.frame = function (a) { if (F.renderPipelines.pinned) pinnedSeen++; else unpinnedSeen++; return origFrame.call(this, a); };
let verify = null; try { const rex = LW.captureUI && LW.captureUI.exact; if (rex && rex.verify) { const r = await rex.verify({ frames: 3, width: 160 }); verify = { ok: r.ok, message: r.message }; } } catch (e) { verify = { error: String(e) }; }
F.frame = origFrame;
LW.schedule(2); await LW.settle();
return { W, H, format: F.format, rows: Object.keys(rows).length, specRows, differ, ledger: F.renderPipelines, exportPin: { verify, framesPinned: pinnedSeen, framesUnpinned: unpinnedSeen }, detail: rows };
