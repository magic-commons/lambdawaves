/* MIR · core/ink.js — ADAPTIVE INK: under glass, each label is white or black from what is beneath it.
 *
 * Harvested from BASINS app/adaptive-ink.js (2026-09-18 … 10-01) and ink.css §1.  Josh, 2026-09-18: "can we just have the
 * text simply invert the color underneath and bias towards darkness and lightness depending on which is underneath?  I
 * don't want too much of a tint on the glass … I just asked to change the text color not the glass."
 *
 * WHAT IT IS.  The app hands a sampler of its picture; the kit does the rest:
 *   THE SAMPLE   the app's: `sample() → { luma, w, h, rect? }` (or a Promise of it): a small grid of the picture's luma,
 *                0…1, row by row (BASINS: a 64 × 36 GPU read of its present pass, 4 times a second).  `rect` is the screen
 *                box the grid covers (default: the `stage` element's box, else the viewport).  `canvasSample(canvas)`
 *                below is the same for a 2D canvas.
 *   THE CELLS    every small visible thing in the interface (a label, a row, a knob face, a chip, a button), found by
 *                walking the page, not by a list, so a new window is covered the day it lands.  A big surface that prints
 *                text of its own is a cell too; so is a text field with text in it.
 *   THE GROUND   the mean luma of the sample under the cell, composited up through every fill between the picture and
 *                the label (a pale .86 card over a black picture is a LIGHT ground).
 *   THE BIAS     ground < .45 → white ink · ground > .55 → black ink · between, it keeps what it had; and a flip has to be
 *                seen twice running, so a modulated or moving picture does not make the labels flicker.
 *   THE INK      `data-ink="w|k"` on the cell, and `data-ink-live` on <body> while it runs.  skin.css re-seats the pure
 *                ladder (1 · .96 · .86 · .82 · .70) on that attribute.  Accents never read it, so they never move.
 *
 * THE LAWS IT KEEPS
 *   · THE GLASS IS JOSH'S.  This writes one attribute per label and nothing else: no fill, no veil, no text shadow, no
 *     blend mode (a blend cannot reach the canvas through a stacking context: BASINS measured it, 2026-09-16).
 *   · THE GATE.  REFRACTIVE, or FROST on a pane that is not SOLID.  A TINTED pane with frost off is an opaque pane with
 *     the ordinary ink: no sample, no attribute.  `mode('off')` (TEXT · LIGHT · DARK: the ink is chosen, the kit's
 *     body[data-text] seats say it) stops it the same way.
 *   · NO POLLER.  A sample is taken only when the app says its picture changed (`update()`), at most `hz` times a second
 *     (one one-shot timer keeps the trailing edge), and only while the document is visible and the UI is not hidden.
 *     A scroll, a release or a key re-walks the cells against the last sample, once, 140 ms later.  The DOM reads run
 *     in the frame core's read phase and the attribute writes in its write phase.  Idle costs nothing.
 *
 * createInkSampler({ sample, doc, stage, skip, hz, law }) → { update(), poke(), mode(m?), tick(), explain(el), state(),
 *                                                             stat, destroy() }
 * canvasSample(canvas, { w, h }) → sample()
 * Pure, for tests: INK, parseFill, over, paintOf, summedArea, meanUnder, groundOf, decide, walkCells, domIO. */
import { frame as sharedFrame } from './frame.js';

/** BASINS' numbers (adaptive-ink.js INK): the grid, the cadence, the bias, the cell size, the frost's reach */
export const INK = Object.freeze({ GW: 64, GH: 36, HZ: 4, REBUILD_MS: 1200, TO_WHITE: 0.45, TO_BLACK: 0.55, CELL_W: 300, CELL_H: 72, FROST_PAD: 10, POKE_MS: 140 });
/** what is never a cell: BASINS' list less its own ids (an app adds its own with `skip`), plus the kit's toast */
export const INK_SKIP = 'script, style, svg *, option, #mir-toast, [data-ink-skip]';

/* ── the arithmetic (pure) ─────────────────────────────────────────────────────────────────────────────────────────── */
const RGBA = /rgba?\(([^)]+)\)/g;
/** parseFill('r, g, b[, a]' | 'r g b / a') → { l, a }: Rec. 601 luma 0…1 and alpha (BASINS `parse`) */
export function parseFill(txt) {
  const p = String(txt).split(/[ ,/]+/).filter(Boolean).map(Number);
  return { l: (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255, a: p.length > 3 ? p[3] : 1 };
}
/** over(top, bottom) — `top` laid over `bottom`, both { l, a } */
export function over(top, bottom) {
  if (!bottom) return top;
  const a = top.a + bottom.a * (1 - top.a);
  return { l: (top.l * top.a + bottom.l * bottom.a * (1 - top.a)) / a, a };
}
/** paintOf({ backgroundColor, backgroundImage }) → one layer { l, a } or null: the colour, then a gradient as the mean of
 *  its stops laid over it (BASINS `paintOf`); a url() image is unknown and ignored */
export function paintOf(cs) {
  let out = null;
  const m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor || '');
  if (m) { const c = parseFill(m[1]); if (c.a > 0.01) out = c; }
  const img = cs.backgroundImage || '';
  if (img && img !== 'none' && img.indexOf('url(') < 0) {
    let k = 0, l = 0, a = 0, g; RGBA.lastIndex = 0;
    while ((g = RGBA.exec(img))) { const c = parseFill(g[1]); l += c.l * c.a; a += c.a; k++; }
    if (k && a > 0.01) out = over({ l: l / a, a: a / k }, out);
  }
  return out;
}
/** summedArea(luma, W, H) → the (W+1)·(H+1) summed-area table, so any box's mean is four reads */
export function summedArea(luma, W, H) {
  const sat = new Float64Array((W + 1) * (H + 1));
  for (let y = 1; y <= H; y++) { let row = 0; for (let x = 1; x <= W; x++) { row += luma[(y - 1) * W + (x - 1)]; sat[y * (W + 1) + x] = sat[(y - 1) * (W + 1) + x] + row; } }
  return sat;
}
/** meanUnder(sat, W, H, box, area, pad) → the picture's mean luma under a screen box (grown by `pad` px), or null when the
 *  sample covers nothing (BASINS `under`).  `area` is the screen box the sample covers. */
export function meanUnder(sat, W, H, box, area, pad = 0) {
  if (!sat || !area || !(area.width >= 2)) return null;
  let x0 = Math.floor((box.left - pad - area.left) / area.width * W), x1 = Math.ceil((box.right + pad - area.left) / area.width * W);
  let y0 = Math.floor((box.top - pad - area.top) / area.height * H), y1 = Math.ceil((box.bottom + pad - area.top) / area.height * H);
  x0 = Math.max(0, Math.min(W - 1, x0)); y0 = Math.max(0, Math.min(H - 1, y0));
  x1 = Math.max(x0 + 1, Math.min(W, x1)); y1 = Math.max(y0 + 1, Math.min(H, y1));
  const S = (x, y) => sat[y * (W + 1) + x];
  return (S(x1, y1) - S(x0, y1) - S(x1, y0) + S(x0, y0)) / ((x1 - x0) * (y1 - y0));
}
/** groundOf(picture, stack) — the picture's luma with every fill between it and the label laid over, outermost first */
export function groundOf(picture, stack) { let g = picture; for (const f of stack) g = f.l * f.a + g * (1 - f.a); return g; }
/** decide(cell, ground, law) — THE BIAS and THE HYSTERESIS, on a cell { ink, pending }: mutates it, returns true when the
 *  label's ink changed.  A first look takes the nearer pole; after that a flip needs the ground past the far threshold and
 *  the same answer twice running. */
export function decide(cell, g, law = INK) {
  let want = cell.ink;
  if (cell.ink == null) want = g < 0.5 ? 'w' : 'k';
  else if (g < law.TO_WHITE) want = 'w';
  else if (g > law.TO_BLACK) want = 'k';
  if (want !== cell.ink) {
    if (cell.ink == null || cell.pending === want) { cell.ink = want; cell.pending = null; return true; }
    cell.pending = want; return false;                                // seen once: it has to be seen again
  }
  cell.pending = null; return false;
}

/* ── the walk ──────────────────────────────────────────────────────────────────────────────────────────────────────
   Over an `io` so a test can hand plain objects: kids(n), rect(n), style(n, pseudo?) → { display, visibility,
   backgroundColor, backgroundImage, content, width, height }, skip(n), isSvg(n), field(n) (a text field's value),
   text(n) (its whole text, trimmed), ownText(n) (it prints text of its own), glyph(n) (it holds an svg, i, input or
   canvas), all(n) (every descendant, outside svg), holdsStage(n). */
/** fillOf(n, io, cache) — an element's own paint as one layer: a hidden box paints nothing; a ::before of 12 px or more
 *  that has content is a face and lies over the element's own background (BASINS: the rail chip's disc) */
function fillOf(n, io, cache) {
  if (cache.has(n)) return cache.get(n);
  const cs = io.style(n);
  let out = cs.visibility === 'hidden' ? null : paintOf(cs);
  const b = io.style(n, '::before');
  if (b && b.content && b.content !== 'none' && b.content !== 'normal' && b.display !== 'none' && b.visibility !== 'hidden' && parseFloat(b.width) >= 12 && parseFloat(b.height) >= 12) {
    const f = paintOf(b); if (f) out = over(f, out);
  }
  cache.set(n, out);
  return out;
}
/** walkCells(root, io, { vw, vh, law, keep }) → [{ el, stack, ink, pending }] — BASINS `rebuild` */
export function walkCells(root, io, { vw, vh, law = INK, keep = new Map() } = {}) {
  const fills = new Map(), found = [];
  const facesInside = (n) => {
    for (const d of io.all(n)) { const f = fillOf(d, io, fills); if (f && f.a >= 0.25) { const q = io.rect(d); if (q.width >= 20 && q.height >= 12) return true; } }
    return false;
  };
  const walk = (n, stack) => {
    for (const ch of io.kids(n)) {
      if (io.skip(ch)) continue;
      const r = io.rect(ch);
      if (r.width < 2 || r.height < 2) { if (io.kids(ch).length && io.style(ch).display === 'contents') walk(ch, stack); continue; }
      if (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) continue;
      const cs = io.style(ch);
      if (cs.display === 'none' || (cs.visibility === 'hidden' && !io.kids(ch).length)) continue;
      /* a fill on something that CONTAINS the picture lies under the picture, not between it and a label */
      const f = io.holdsStage(ch) ? null : fillOf(ch, io, fills), st = f ? stack.concat([f]) : stack;
      const svg = io.isSvg(ch);
      const take = () => { const old = keep.get(ch); found.push({ el: ch, stack: st, ink: old ? old.ink : null, pending: old ? old.pending : null }); };
      if (io.field(ch) && (r.width > law.CELL_W || r.height > law.CELL_H)) { take(); continue; }   // a big text field with text: a label of its own
      if (svg || (r.width <= law.CELL_W && r.height <= law.CELL_H)) {
        /* a small thing is ONE cell unless it carries faces of its own: then each face becomes its own cell, with its own
           fills above the picture (a clear strip holding a pale card holding a raised button) */
        if (svg || !facesInside(ch)) { if (svg || io.text(ch) || io.glyph(ch)) take(); continue; }
      }
      if (io.ownText(ch)) take();                                     // a big surface that prints text of its own
      walk(ch, st);
    }
  };
  walk(root, []);
  return found;
}
/** domIO(doc, { skip, stage }) — the walk's io over a real document */
export function domIO(doc, { skip = '', stage = null } = {}) {
  const win = doc.defaultView, SKIP = skip ? INK_SKIP + ', ' + skip : INK_SKIP;
  return {
    kids: (n) => n.children,
    rect: (n) => n.getBoundingClientRect(),
    style: (n, pseudo) => win.getComputedStyle(n, pseudo || null),
    skip: (n) => n.hidden || n.matches(SKIP) || n === stage,
    isSvg: (n) => n.tagName.toLowerCase() === 'svg',
    field: (n) => (n.tagName === 'TEXTAREA' || n.tagName === 'INPUT') && !!n.value,
    text: (n) => !!n.textContent.trim(),
    ownText: (n) => [...n.childNodes].some((t) => t.nodeType === 3 && t.textContent.trim()),
    glyph: (n) => !!n.querySelector('svg, i, input, canvas'),
    all: (n) => [...n.querySelectorAll('*')].filter((d) => !d.closest('svg')),
    holdsStage: (n) => !!stage && n.contains(stage),
  };
}

/** canvasSample(canvas, { w, h }) → sample() for a 2D-drawable source (a canvas, an image, a video): the source drawn into
 *  a w × h grid and its luma read back.  A WebGPU app samples its own present pass instead (BASINS). */
export function canvasSample(src, { w = INK.GW, h = INK.GH } = {}) {
  let c = null, g = null;
  return () => {
    if (!c) { c = (globalThis.OffscreenCanvas ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h })); g = c.getContext('2d', { willReadFrequently: true }); }
    g.clearRect(0, 0, w, h); g.drawImage(src, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, luma = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) luma[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
    return { luma, w, h, rect: src.getBoundingClientRect ? src.getBoundingClientRect() : null };
  };
}

/* ── the sampler ───────────────────────────────────────────────────────────────────────────────────────────────────── */
export function createInkSampler({ sample, doc = globalThis.document, stage = null, skip = '', hz = INK.HZ, law = INK, frame = sharedFrame } = {}) {
  if (typeof sample !== 'function') throw new TypeError('createInkSampler needs sample() → { luma, w, h }');
  const win = doc.defaultView, body = () => doc.body, now = () => win.performance.now();
  const io = domIO(doc, { skip, stage });
  const stat = { samples: 0, fails: 0, cells: 0, white: 0, black: 0, flips: 0, sampleMs: 0, applyMs: 0, rebuilds: 0, rebuildMs: 0, active: false, why: '' };
  let mode = 'auto', cells = [], pic = null;                         // pic: { sat, W, H, area }
  let last = -1e9, timer = 0, busy = false, again = false, dead = 0, pokeTimer = 0;
  let lastRebuild = 0, lastShape = '', stale = true, booked = false, destroyed = false;

  const glass = () => { const b = body(); return b.dataset.card === 'refractive' || (b.classList.contains('frost') && b.dataset.card !== 'solid'); };
  const on = () => !destroyed && mode === 'auto' && glass() && !doc.hidden && !body().classList.contains('ui-hidden');
  const shape = () => { const b = body(); return b.className + '|' + b.dataset.card + '|' + b.dataset.theme + '|' + doc.getElementsByTagName('*').length + '|' + win.innerWidth + 'x' + win.innerHeight; };

  function clear() {
    for (const c of cells) c.el.removeAttribute('data-ink');
    cells = []; lastRebuild = 0;
    body().removeAttribute('data-ink-live'); stat.active = false;
  }
  function rebuild() {
    const t0 = now();
    const keep = new Map(cells.map((c) => [c.el, c]));
    const found = walkCells(body(), io, { vw: win.innerWidth, vh: win.innerHeight, law, keep });
    const kept = new Set(found.map((c) => c.el));
    const gone = cells.filter((c) => !kept.has(c.el)).map((c) => c.el);
    cells = found; lastRebuild = now(); stale = false; lastShape = shape();
    stat.cells = cells.length; stat.rebuilds++; stat.rebuildMs = +(lastRebuild - t0).toFixed(2);
    return gone;
  }
  /** the read phase: walk if the page changed shape, then each cell's ground and its verdict; the writes follow */
  function measure() {
    booked = false;
    if (!on() || !pic) return;
    const t0 = now(), age = t0 - lastRebuild;
    let gone = [];
    if (stale || !lastRebuild || (shape() !== lastShape && age > 250) || age > law.REBUILD_MS * 5) gone = rebuild();
    const pad = body().classList.contains('frost') ? law.FROST_PAD : 0, flips = [];
    let w = 0, k = 0;
    for (const c of cells) {
      if (!c.el.isConnected) continue;
      const r = io.rect(c.el); if (r.width < 2) continue;
      const p = meanUnder(pic.sat, pic.W, pic.H, r, pic.area, pad); if (p == null) continue;
      if (decide(c, groundOf(p, c.stack), law)) flips.push(c);
      if (c.ink === 'w') w++; else k++;
    }
    stat.white = w; stat.black = k; stat.applyMs = +(now() - t0).toFixed(2);
    frame.write(() => {
      if (!on()) return;
      if (!stat.active) { stat.active = true; body().setAttribute('data-ink-live', ''); }
      for (const el of gone) el.removeAttribute('data-ink');
      for (const c of flips) { c.el.setAttribute('data-ink', c.ink); stat.flips++; }
    });
  }
  const book = () => { if (!booked) { booked = true; frame.read(measure); } };

  /** take a sample now (the app's cadence has already been honoured) */
  function go() {
    if (busy) { again = true; return; }
    if (!on() || now() < dead) return;
    busy = true; last = now();
    const t0 = now();
    Promise.resolve().then(() => sample()).then((s) => {
      if (!s || !s.luma || !(s.w > 0) || !(s.h > 0)) { stat.why = 'the sample was empty'; return; }
      const area = s.rect || (stage ? stage.getBoundingClientRect() : { left: 0, top: 0, width: win.innerWidth, height: win.innerHeight });
      pic = { sat: summedArea(s.luma, s.w, s.h), W: s.w, H: s.h, area: { left: area.left, top: area.top, width: area.width, height: area.height } };
      stat.samples++; stat.sampleMs = +(now() - t0).toFixed(2);
      book();
    }).catch((e) => { stat.fails++; stat.why = String((e && e.message) || e); dead = now() + 5000; })
      .finally(() => { busy = false; if (again) { again = false; update(); } });
  }
  /** update() — the app's picture changed: sample it, at most `hz` times a second (the trailing edge is kept) */
  function update() {
    if (!on()) { if (stat.active || cells.length) clear(); return; }
    const wait = last + 1000 / hz - now();
    if (wait <= 0) go();
    else if (!timer) timer = win.setTimeout(() => { timer = 0; go(); }, wait);
  }
  /** poke() — something opened, closed or changed: walk the cells again now, against the last sample, and ask for a new one */
  function poke() { stale = true; if (!on()) { if (stat.active || cells.length) clear(); return; } if (pic) book(); update(); }
  const soon = () => { if (pokeTimer) return; pokeTimer = win.setTimeout(() => { pokeTimer = 0; if (on() && pic) { stale = true; book(); } }, law.POKE_MS); };

  const life = new AbortController(), o = { capture: true, passive: true, signal: life.signal };
  doc.addEventListener('scroll', soon, o);
  doc.addEventListener('pointerup', soon, o);
  doc.addEventListener('keyup', soon, o);
  doc.addEventListener('visibilitychange', () => { if (!doc.hidden) poke(); }, { signal: life.signal });
  /* the gate is read from <body>: a change of card style, frost, theme or the hidden UI turns it on or off at once (the
     walk itself waits for its own shape test: a class that comes and goes with a gesture does not re-walk the page) */
  const mo = new win.MutationObserver(() => { if (!on()) { if (stat.active || cells.length) clear(); return; } if (pic) book(); update(); });
  mo.observe(doc.body, { attributes: true, attributeFilter: ['class', 'data-card', 'data-theme'] });

  /** explain(el) — why a label wears the ink it wears: the picture under it, each fill above that, the ground they make */
  function explain(el) {
    const c = cells.find((q) => q.el === el || q.el.contains(el)); if (!c || !pic) return null;
    const r = io.rect(c.el), p = meanUnder(pic.sat, pic.W, pic.H, r, pic.area, body().classList.contains('frost') ? law.FROST_PAD : 0);
    const g = p == null ? null : groundOf(p, c.stack);
    return { cell: c.el.tagName.toLowerCase() + '.' + String(c.el.getAttribute('class') || '').split(' ').slice(0, 2).join('.'), box: [r.left | 0, r.top | 0, r.width | 0, r.height | 0],
      picture: +(p == null ? -1 : p).toFixed(3), fills: c.stack.map((f) => [+f.l.toFixed(2), +f.a.toFixed(2)]), ground: +(g == null ? -1 : g).toFixed(3), ink: c.ink, pending: c.pending };
  }
  return {
    update, poke, stat, explain,
    /** mode('auto' | 'off') — AUTO samples; OFF (TEXT · LIGHT · DARK) takes no sample and clears every cell */
    mode(m) { if (m === undefined) return mode; mode = m === 'off' ? 'off' : 'auto'; poke(); return mode; },
    /** tick() — sample now, ignoring the cadence (a test, or a one-off) */
    tick() { last = -1e9; update(); },
    state: () => ({ ...stat, mode, on: on(), grid: pic ? [pic.W, pic.H] : null }),
    destroy() { destroyed = true; life.abort(); mo.disconnect(); if (timer) win.clearTimeout(timer); if (pokeTimer) win.clearTimeout(pokeTimer); clear(); },
  };
}
