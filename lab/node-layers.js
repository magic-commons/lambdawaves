/* lab/node-layers.js — NODES' LAYER types and the one layer host (iteration 019 N3; NODES-DESIGN.md).  A LAYER node is not a filter primitive:
 * it is one absolutely placed div over the stage, blended by the GPU (`mix-blend-mode`): no main-thread work a frame, a fixed GPU cost (019 N,
 * headless rig: VIGNETTE nothing measurable, FILM GRAIN ≈ −20 % presents — a full-screen blended noise layer; research/iteration-019/N-BUILD.md).
 *   FILM GRAIN  a 256² noise tile drawn ONCE per kind (MONO | COLOUR) and repeated; it jumps to a fresh offset 24 times a second by a CSS
 *               stepped animation (`transform` only, keyframes in percentages; none under reduced motion); AMOUNT is its
 *               opacity, SIZE the tile's scale, SOFT (soft-light) | OVERLAY its blend
 *   VIGNETTE    a radial gradient, multiplied: AMOUNT · FEATHER (where the dark starts) · ROUNDNESS (the frame's ellipse → a circle)
 *   SCANLINES   a repeating gradient, multiplied: PITCH (px) · AMOUNT
 * THE HOST (`#nodeLayers`, built on the first layer) sits in #stage over the stage canvases and under the stage text, the atom labels and the
 * racks (z 8), pointer-events none, never in the occlusion mask (it registers nothing with lab/occlusion.js): it is part of the picture, not
 * a window.  Layers are composited over the whole stage in graph order, after the filter: a layer between two filter nodes still sits on top.
 *   createLayerHost(stage) → { set(layers) }   layers: compile()'s [{ id, type, values }] — a div per node, kept while the node lives
 * 025 B1 · RENDER BAKES THE GRAPH: `paintLayer(g, l, w, h, k, i)` paints the same layer onto a film frame's 2-D canvas at the film's scale k (film px per
 * stage CSS px) — the tile is SEEDED (one tile per kind, the same on the stage and in every film), FILM GRAIN's offset hashed from the frame index i (the
 * CSS animation's jumps are the wall's), VIGNETTE's ellipse and SCANLINES' pitch as the CSS draws them, × k. */
const AMOUNT = (home) => ({ k: 'amount', label: 'AMOUNT', min: 0, max: 1, home });
const off = (v) => v.amount === 0;
export const LAYER_TYPES = {
  grain: { cls: 'layer', label: 'FILM GRAIN', hint: 'grain over the picture, fresh every frame', neutral: off,
    knobs: [AMOUNT(0.35), { k: 'size', label: 'SIZE', min: 0.5, max: 4, home: 1, log: true },
      { k: 'kind', label: 'KIND', home: 'mono', options: [{ id: 'mono', label: 'MONO' }, { id: 'colour', label: 'COLOUR' }] },
      { k: 'blend', label: 'BLEND', home: 'soft-light', options: [{ id: 'soft-light', label: 'SOFT' }, { id: 'overlay', label: 'OVERLAY' }] }] },
  vignette: { cls: 'layer', label: 'VIGNETTE', hint: 'the edges darkened, as a lens does', neutral: off,
    knobs: [AMOUNT(0.6), { k: 'feather', label: 'FEATHER', min: 0, max: 1, home: 0.5 }, { k: 'round', label: 'ROUNDNESS', min: 0, max: 1, home: 0.5 }] },
  scanlines: { cls: 'layer', label: 'SCANLINES', hint: 'a CRT\'s lines', neutral: off,
    knobs: [{ k: 'pitch', label: 'PITCH', min: 2, max: 12, step: 1, home: 3, unit: ' px' }, AMOUNT(0.3)] },
};

const tiles = {}, canvases = {};
/** a 32-bit integer hash (the shader node's own, lab/node-shader.js) → 0 … 2³² − 1 */
export const hash32 = (x) => { const v = (Math.imul(x >>> 0, 747796405) + 2891336453) >>> 0, w = Math.imul(((v >>> ((v >>> 28) + 4)) ^ v) >>> 0, 277803737) >>> 0; return ((w >>> 22) ^ w) >>> 0; };
/** one 256² noise tile per kind, SEEDED (025 B1: a film and the stage draw the same grain), drawn the first time it is asked for */
function tileCanvas(kind) {
  if (canvases[kind]) return canvases[kind];
  const c = document.createElement('canvas'); c.width = c.height = 256;
  let s = kind === 'colour' ? 0xc0105 : 0x6a1e; const r = () => (s = hash32(s)) / 4294967296;
  const g = c.getContext('2d'), im = g.createImageData(256, 256), d = im.data, n = () => (r() + r() + r()) * 85;   // ≈ a bell round mid-grey
  for (let i = 0; i < d.length; i += 4) { const m = n(); d[i] = m; d[i + 1] = kind === 'colour' ? n() : m; d[i + 2] = kind === 'colour' ? n() : m; d[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  return (canvases[kind] = c);
}
const tile = (kind) => tiles[kind] || (tiles[kind] = 'url(' + tileCanvas(kind).toDataURL() + ')');
const PAINT = {
  grain: (s, v) => { const px = Math.round(256 * v.size); s.backgroundImage = tile(v.kind === 'colour' ? 'colour' : 'mono'); s.backgroundSize = px + 'px ' + px + 'px'; s.mixBlendMode = v.blend === 'overlay' ? 'overlay' : 'soft-light'; },
  vignette: (s, v) => { const r = v.round, a = (71 * (1 - r)).toFixed(1) + '% + ' + (60 * r).toFixed(1) + 'vmax', in0 = Math.round((1 - v.feather) * 100);
    s.backgroundImage = `radial-gradient(ellipse calc(${a}) calc(${a}) at 50% 50%, #fff ${Math.min(in0, 99)}%, #000 100%)`; s.mixBlendMode = 'multiply'; },
  scanlines: (s, v) => { const p = Math.max(2, Math.round(v.pitch)); s.backgroundImage = `repeating-linear-gradient(to bottom, #000 0 ${p / 2}px, #fff ${p / 2}px ${p}px)`; s.mixBlendMode = 'multiply'; },
};

/** paintLayer(g, l, w, h, k, i) — a LAYER node on a film frame (025 B1): the stage's PAINT law at the film's scale k, the grain's jump hashed from i */
export function paintLayer(g, l, w, h, k, i) {
  const v = l.values; g.save(); g.globalAlpha = Math.max(0, Math.min(1, +v.amount || 0));
  if (l.type === 'grain') {
    const px = Math.max(1, 256 * v.size * k), pat = g.createPattern(tileCanvas(v.kind === 'colour' ? 'colour' : 'mono'), 'repeat'), a = hash32(i * 2 + 1), b = hash32(a ^ 0x9e3779b9);
    pat.setTransform(new DOMMatrix([px / 256, 0, 0, px / 256, (a / 4294967296) * px, (b / 4294967296) * px]));
    g.globalCompositeOperation = v.blend === 'overlay' ? 'overlay' : 'soft-light'; g.fillStyle = pat; g.fillRect(0, 0, w, h);
  } else if (l.type === 'vignette') {
    const r = v.round, M = 0.6 * r * Math.max(w, h), rx = 0.71 * (1 - r) * w + M, ry = 0.71 * (1 - r) * h + M, in0 = Math.min(99, Math.round((1 - v.feather) * 100)) / 100;
    g.globalCompositeOperation = 'multiply'; g.translate(w / 2, h / 2); g.scale(rx, ry);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1); grad.addColorStop(in0, '#fff'); grad.addColorStop(1, '#000');
    g.fillStyle = grad; g.fillRect(-w / 2 / rx, -h / 2 / ry, w / rx, h / ry);
  } else if (l.type === 'scanlines') {
    const p = Math.max(2, Math.round(v.pitch)) * k;
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#000';
    for (let y = 0; y < h; y += p) g.fillRect(0, y, w, p / 2);
  }
  g.restore();
}

export function createLayerHost(stage, gpu = null) {   // 024 S2: a `gpu` layer (a SHADER node) is the canvas of `gpu`, lab/node-shader.js
  let host = null; const divs = new Map();
  return {
    set(layers) {
      if (!host && !layers.length) return;
      if (!host) { host = document.createElement('div'); host.id = 'nodeLayers'; host.setAttribute('aria-hidden', 'true'); const sk = stage.querySelector('#skeleton'); stage.insertBefore(host, sk ? sk.nextSibling : stage.firstChild); }
      const live = new Set(layers.map((l) => l.id));
      for (const [id, d] of divs) if (!live.has(id)) { d.remove(); if (gpu) gpu.drop(d); divs.delete(id); }
      layers.forEach((l, i) => {
        let d = divs.get(l.id);
        if (!d || d.dataset.type !== l.type) { if (d) { d.remove(); if (gpu) gpu.drop(d); } d = l.gpu && gpu ? gpu.make(l) : document.createElement('div'); d.className = 'node-layer'; d.dataset.type = l.type; divs.set(l.id, d); }
        if (host.children[i] !== d) host.insertBefore(d, host.children[i] || null);   // graph order: a later layer over an earlier one (moved only when it is not there)
        if (l.gpu) { if (gpu) gpu.paint(d, l); return; }
        const s = d.style, { amount, ...look } = l.values, key = JSON.stringify(look);
        if (s.opacity !== String(amount)) s.opacity = String(amount);    // a modulated AMOUNT writes one number
        if (d.dataset.key !== key) { d.dataset.key = key; PAINT[l.type](s, l.values); }
      });
    },
  };
}
