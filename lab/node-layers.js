/* lab/node-layers.js — NODES' LAYER types and the one layer host (iteration 019 N3; NODES-DESIGN.md).  A LAYER node is not a filter primitive:
 * it is one absolutely placed div over the stage, blended by the GPU (`mix-blend-mode`): no main-thread work a frame, a fixed GPU cost (019 N,
 * headless rig: VIGNETTE nothing measurable, FILM GRAIN ≈ −20 % presents — a full-screen blended noise layer; research/iteration-019/N-BUILD.md).
 *   FILM GRAIN  a 256² noise tile drawn ONCE per kind (MONO | COLOUR) and repeated; it jumps to a fresh offset 6 times per unit of the
 *               clock's t (24 a second at the home rate; 040 N2 THE GRAIN KEEPS TIME: `tick(t)`, so a paused clock holds a still grain and a
 *               scrub moves it; none under reduced motion); AMOUNT is its
 *               opacity, SIZE the tile's scale, SOFT (soft-light) | OVERLAY its blend
 *   VIGNETTE    a radial gradient, multiplied: AMOUNT · FEATHER (where the dark starts) · ROUNDNESS (the frame's ellipse → a circle)
 *   SCANLINES   a repeating gradient, multiplied: PITCH (px) · AMOUNT
 * THE HOST (`#nodeLayers`, built on the first layer) sits in #stage over the stage canvases and under the stage text, the atom labels and the
 * racks, pointer-events none, never in the occlusion mask (it registers nothing with lab/occlusion.js): it is part of the picture, not
 * a window.  039 V5 THE LAYERS LIE UNDER THE WINDOWS: the picture's layers are INK UNDER GLASS too — every layer is cut where a window stands
 * (`--lw-glass-cut` on the host, shell/ink.js: the line pass's own rects), so a window's glass shows the field, not a vignette or grain over it;
 * FILM GRAIN's tile and its jumps are a child `i`, so the layer itself stays still and its cut stays where the windows are.  038 P8 THE LAYERS BLEND WITH THE STAGE: the host is no stacking context (z-index auto) and each layer sits at z 8 (nodes.css) — at
 * z 8 the host was an isolated blend group, so every layer's blend met nothing (grain at AMOUNT 1 painted flat grey, a vignette a white centre).  Layers are composited over the whole stage in graph order, after the filter: a layer between two filter nodes still sits on top.
 *   createLayerHost(stage) → { set(layers) }   layers: compile()'s [{ id, type, values }] — a div per node, kept while the node lives
 * 025 B1 · RENDER BAKES THE GRAPH: `paintLayer(g, l, w, h, k, i)` paints the same layer onto a film frame's 2-D canvas at the film's scale k (film px per
 * stage CSS px) — the tile is SEEDED (one tile per kind, the same on the stage and in every film), FILM GRAIN's offset hashed from the frame index i (the
 * CSS animation's jumps are the wall's), VIGNETTE's ellipse and SCANLINES' pitch as the CSS draws them, × k. */
const AMOUNT = (home) => ({ k: 'amount', label: 'AMOUNT', min: 0, max: 1, home });
const off = (v) => v.amount === 0;
export const LAYER_TYPES = {
  /* 038 P8 (Josh: "Film Grain's Kind and Blend switches could be on the same row in the layout. Add a third knob that controls lightness and darkness and
     also affected by the blend mode"): AMOUNT · SIZE · TONE over KIND · BLEND; TONE (appended, −1 … 1, home 0) veils the tile with white or black at
     alpha .85·|tone| before its blend, so SOFT and OVERLAY read it and the grain survives at the ends — the stage's PAINT and the film's paintLayer alike */
  grain: { cls: 'layer', label: 'FILM GRAIN', hint: 'Grain over the picture, fresh every frame', neutral: off, face: [['amount', 'size', 'tone'], ['kind', 'blend']],
    knobs: [{ ...AMOUNT(0.35), hint: 'AMOUNT — how much grain' }, { k: 'size', label: 'SIZE', min: 0.5, max: 4, home: 1, log: true, hint: 'SIZE — the grain\'s scale' },
      { k: 'kind', label: 'KIND', home: 'mono', hint: 'MONO grey grain · COLOUR grain', options: [{ id: 'mono', label: 'MONO' }, { id: 'colour', label: 'COLOUR' }] },
      { k: 'blend', label: 'BLEND', home: 'soft-light', hint: 'How the grain meets the picture', options: [{ id: 'soft-light', label: 'SOFT' }, { id: 'overlay', label: 'OVERLAY' }] },
      { k: 'tone', label: 'TONE', min: -1, max: 1, home: 0, hint: 'TONE — the grain darker or lighter, through its blend', fmt: (x) => (x >= 0.005 ? '+' : x <= -0.005 ? '−' : '') + Math.round(Math.abs(x) * 100) }] },
  vignette: { cls: 'layer', label: 'VIGNETTE', hint: 'The edges darkened, as a lens does', neutral: off,
    knobs: [{ ...AMOUNT(0.6), hint: 'AMOUNT — how dark the edges' }, { k: 'feather', label: 'FEATHER', min: 0, max: 1, home: 0.5, hint: 'FEATHER — where the dark begins' },
      { k: 'round', label: 'ROUNDNESS', min: 0, max: 1, home: 0.5, hint: 'ROUNDNESS — the frame\'s ellipse to a circle' }] },
  scanlines: { cls: 'layer', label: 'SCANLINES', hint: 'A CRT\'s lines', neutral: off,
    knobs: [{ k: 'pitch', label: 'PITCH', min: 2, max: 12, step: 1, home: 3, unit: ' px', hint: 'PITCH — the lines\' spacing, in px' }, { ...AMOUNT(0.3), hint: 'AMOUNT — how dark the lines' }] },
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
/** 038 P8 · TONE: −1 … 1 → [r, g, b, a] of the veil over the tile (white above 0, black below), or null at 0; 038 P11 its alpha is .85·|tone|, so at the
 *  ends 15 % of the tile still shows and the grain survives (at 1 the veil hid it: a flat darken or lighten) */
const veil = (t) => { t = Math.max(-1, Math.min(1, +t || 0)); return t ? [t > 0 ? 255 : 0, t > 0 ? 255 : 0, t > 0 ? 255 : 0, +(0.85 * Math.abs(t)).toFixed(3)] : null; };
const toned = new Map();
/** the film's tile under its TONE's veil (paintLayer), one canvas per kind and tone */
function tonedTile(kind, t) {
  const c = tileCanvas(kind), w = veil(t); if (!w) return c;
  const key = kind + w.join(); if (toned.has(key)) return toned.get(key);
  const d = document.createElement('canvas'); d.width = d.height = 256; const g = d.getContext('2d'); g.drawImage(c, 0, 0); g.fillStyle = `rgba(${w})`; g.fillRect(0, 0, 256, 256);
  if (toned.size > 8) toned.clear(); toned.set(key, d); return d;
}
const PAINT = {
  grain: (s, v, d) => { const px = Math.round(256 * v.size), w = veil(v.tone), V = w ? `linear-gradient(rgba(${w}), rgba(${w})), ` : '', t = d.firstElementChild.style;   // 039 V5: the tile and its jumps are the child's
    t.backgroundImage = V + tile(v.kind === 'colour' ? 'colour' : 'mono'); t.backgroundSize = (V ? 'auto, ' : '') + px + 'px ' + px + 'px'; s.mixBlendMode = v.blend === 'overlay' ? 'overlay' : 'soft-light'; },
  vignette: (s, v) => { const r = v.round, a = (71 * (1 - r)).toFixed(1) + '% + ' + (60 * r).toFixed(1) + 'vmax', in0 = Math.round((1 - v.feather) * 100);
    s.backgroundImage = `radial-gradient(ellipse calc(${a}) calc(${a}) at 50% 50%, #fff ${Math.min(in0, 99)}%, #000 100%)`; s.mixBlendMode = 'multiply'; },
  scanlines: (s, v) => { const p = Math.max(2, Math.round(v.pitch)); s.backgroundImage = `repeating-linear-gradient(to bottom, #000 0 ${p / 2}px, #fff ${p / 2}px ${p}px)`; s.mixBlendMode = 'multiply'; },
};

/** paintLayer(g, l, w, h, k, i) — a LAYER node on a film frame (025 B1): the stage's PAINT law at the film's scale k, the grain's jump hashed from i */
export function paintLayer(g, l, w, h, k, i) {
  const v = l.values; g.save(); g.globalAlpha = Math.max(0, Math.min(1, +v.amount || 0));
  if (l.type === 'grain') {
    const px = Math.max(1, 256 * v.size * k), pat = g.createPattern(tonedTile(v.kind === 'colour' ? 'colour' : 'mono', v.tone), 'repeat'), a = hash32(i * 2 + 1), b = hash32(a ^ 0x9e3779b9);
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
  let host = null, j = 0; const divs = new Map();
  /* 040 N2 · THE GRAIN KEEPS TIME (Josh: "Film grain always plays despite play/pause modes"): the tile's jump is the clock's — jump j = ⌊6·t⌋ hashed
     to an offset of up to a third of the 1.5 × tile (the film's paintLayer hashes its frame index the same way); written as two custom properties the
     CSS reads, so reduced motion keeps the tile still */
  const jump = (i) => { const a = hash32(j * 2 + 1), b = hash32(a ^ 0x9e3779b9), s = i.style; s.setProperty('--gx', ((a / 4294967296) * 33).toFixed(1) + '%'); s.setProperty('--gy', ((b / 4294967296) * 33).toFixed(1) + '%'); };
  return {
    /** the loop's CPU frame (rack.js, beside the widgets): a new jump only when ⌊6·t⌋ moves */
    tick(t) { const n = Math.floor(6 * t); if (n === j) return; j = n; for (const d of divs.values()) if (d.dataset.type === 'grain') jump(d.firstElementChild); },
    set(layers) {
      if (!host && !layers.length) return;
      if (!host) { host = document.createElement('div'); host.id = 'nodeLayers'; host.setAttribute('aria-hidden', 'true'); const sk = stage.querySelector('#skeleton'); stage.insertBefore(host, sk ? sk.nextSibling : stage.firstChild); }
      const live = new Set(layers.map((l) => l.id));
      for (const [id, d] of divs) if (!live.has(id)) { d.remove(); if (gpu) gpu.drop(d); divs.delete(id); }
      layers.forEach((l, i) => {
        let d = divs.get(l.id);
        if (!d || d.dataset.type !== l.type) { if (d) { d.remove(); if (gpu) gpu.drop(d); } d = l.gpu && gpu ? gpu.make(l) : document.createElement('div'); d.className = 'node-layer'; d.dataset.type = l.type; if (l.type === 'grain') jump(d.appendChild(document.createElement('i'))); divs.set(l.id, d); }
        if (host.children[i] !== d) host.insertBefore(d, host.children[i] || null);   // graph order: a later layer over an earlier one (moved only when it is not there)
        if (l.gpu) { if (gpu) gpu.paint(d, l); return; }
        const s = d.style, { amount, ...look } = l.values, key = JSON.stringify(look);
        if (s.opacity !== String(amount)) s.opacity = String(amount);    // a modulated AMOUNT writes one number
        if (d.dataset.key !== key) { d.dataset.key = key; PAINT[l.type](s, l.values, d); }
      });
    },
  };
}
