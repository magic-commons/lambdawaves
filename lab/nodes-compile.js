/* lab/nodes-compile.js — THE COMPILER (iteration 019 N1; research/iteration-019/NODES-DESIGN.md).  NODES' graph is not interpreted, it is
 * COMPILED to the kit's one picture filter (`pictureFilter(canvas).setChain(runs)`, kit 1.5.0-alpha.33).  The node classes, by what they
 * compile to:
 *   TABLE      a per-channel transfer y → f(y, channel); contiguous TABLE nodes fold into ONE feComponentTransfer (their functions composed
 *              in graph order, each clamped to 0..1, evaluated at the 256 entries — exact composition, not a table of a table)
 *   MATRIX     a 4 × 5 colour matrix; contiguous MATRIX nodes fold into ONE feColorMatrix (multiplied in graph order)
 *   PRIMITIVE  its own SVG primitives, in graph order: a primitive between two folds starts a new fold
 *   LAYER      not a filter primitive at all: a layer over the stage (lab/node-layers.js), listed in graph order
 *   SHADER     (024 S) a GPU pass over the field's picture in its own canvas (lab/node-shader.js): a LAYER for order (no FADE, no MASK), `gpu`
 * THE ORDER LAW: a TABLE after a MATRIX (or a MATRIX after a TABLE) starts a new run — they do not commute.  A `luma` TABLE node (THRESHOLD)
 * reads luminance: the compiler puts the Rec. 709 luma matrix before it (folded into a MATRIX run that ends just there).
 * A NEUTRAL NODE COSTS NOTHING: a bypassed node, or one whose type says it is at home (`neutral`), emits nothing; a matrix run that
 * multiplies out to the identity is dropped.  A TABLE run is rebuilt only when one of its nodes moved (its key: ids and versions; the
 * tables are handed back BY IDENTITY otherwise, and the kit does not rewrite them).
 *   compile(list, TYPES, cache, { upTo, solo, off }) → { runs, layers, passes }
 *     upTo    VIEW HERE (020 X3): the chain up to and including this node id · solo  this node alone · off  BYPASS ALL: nothing
 *     list    [{ id, type, values, bypass, v }] in graph order (v: a version the owner bumps on every change of the node)
 *     TYPES   { type: { cls: 'table' | 'matrix' | 'prim' | 'layer', neutral?(values, node), fn?(values, node) → (y, ch) → y,
 *               luma?, matrix?(values) → 20 numbers, prim?(values, id) → [[tag, attrs, children?], …] } }
 *     cache   a Map the caller keeps between compiles (the TABLE runs by key)
 *     passes  filter primitives + layers: the cost the card shows
 * 020 X4 FADE AND MASK (THE ROUTE: what a branch is for, without a branch — THE COLUMN IS THE CHAIN).  Every node but a LAYER carries FADE
 * (0–1) and MASK (none · lights · darks · mids · centre · edges, with SOFT).  FADE folds for free: a TABLE y′ = y + a·(f(y) − y), a MATRIX
 * M′ = (1 − a)·I + a·M; a PRIMITIVE's (or a luma TABLE's) is one feComposite arithmetic k2 = a, k3 = 1 − a over its own pass.  A MASKED node
 * ends the fold before it and is its own run of prim markup (`result` / `in` names — generic SVG, no kit change): its table or matrix as
 * feComponentTransfer / feColorMatrix markup on $IN, the mask in an alpha channel (LIGHTS · DARKS · MIDS: the luma into alpha and a soft
 * threshold table; CENTRE · EDGES: an feImage of a radial PNG drawn once on a 64 × 64 canvas, cached by kind + soft, stretched over the
 * picture) times the FADE, then the node's output `in` the mask, `over` the input.  The cost mark follows (ownRun → ···).
 *   Pure helpers: IDENTITY · LUMA · mul(B, A) · isIdentity(m) · tableOf(fns, n) · fadeOf(q, T) · ownRun(q, T) · weight(kind, x, soft) */
import { TABLE_N } from './mir/panels/picture-filter.js';

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const IDENTITY = Object.freeze([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]);
const W = [0.2126, 0.7152, 0.0722];
export const LUMA = Object.freeze([...W, 0, 0, ...W, 0, 0, ...W, 0, 0, 0, 0, 0, 1, 0]);

/** mul(B, A) → the 4 × 5 matrix of B after A (each a 5 × 5 with the row 0 0 0 0 1 left out) */
function mul(B, A) {
  const o = new Array(20);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    let s = c === 4 ? B[r * 5 + 4] : 0;
    for (let k = 0; k < 4; k++) s += B[r * 5 + k] * A[k * 5 + c];
    o[r * 5 + c] = s;
  }
  return o;
}
const isIdentity = (m) => m.every((x, i) => Math.abs(x - IDENTITY[i]) < 1e-9);

/** tableOf(fns, n) → { r, g, b }: y = i / (n − 1) through every function in order, clamped after each */
function tableOf(fns, n = TABLE_N) {
  const out = {};
  for (const [k, ch] of [['r', 'R'], ['g', 'G'], ['b', 'B']]) {
    const a = new Float32Array(n);
    for (let i = 0; i < n; i++) { let y = i / (n - 1); for (const f of fns) y = clamp01(f(y, ch)); a[i] = y; }
    out[k] = a;
  }
  return out;
}

const S = (a) => Array.from(a, (x) => +(+x).toFixed(4)).join(' ');
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
/** over(T): a LAYER or a SHADER — over the stage, in `layers`, without FADE or MASK */
export const over = (T) => T.cls === 'layer' || T.cls === 'shader';
const fadeOf = (q, T) => (over(T) || !Number.isFinite(+q.values.fade) ? 1 : clamp01(+q.values.fade));
const maskOf = (q, T) => (over(T) ? 'none' : q.values.mask || 'none');
/** ownRun(q, T): the node is a run of its own — masked, or a faded PRIMITIVE or luma TABLE (whose fade is a composite, not a fold) */
export const ownRun = (q, T) => maskOf(q, T) !== 'none' || (fadeOf(q, T) < 1 && (T.cls === 'prim' || !!T.luma));
/** weight(kind, x, soft) → 0..1: where a mask lets the node through — x the luma (lights · darks · mids) or the distance from the centre */
function weight(kind, x, soft = 0.5) {
  const h = 0.02 + 0.48 * soft, L = smooth(0.5 - h, 0.5 + h, x), C = 1 - smooth(0.6 - h, 0.6 + h, x);
  return kind === 'lights' ? L : kind === 'darks' ? 1 - L : kind === 'mids' ? 1 - smooth(0.25 - h / 2, 0.25 + h / 2, Math.abs(x - 0.5)) : kind === 'centre' ? C : 1 - C;
}
const shapes = new Map();
/** the radial mask of CENTRE / EDGES: a 64 × 64 PNG (white, alpha = the weight), drawn once per kind + soft */
function shape(kind, soft) {
  const key = kind + ':' + soft.toFixed(2); if (shapes.has(key)) return shapes.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), im = g.createImageData(64, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const o = (y * 64 + x) * 4; im.data.fill(255, o, o + 3); im.data[o + 3] = 255 * weight(kind, Math.hypot(x / 63 - 0.5, y / 63 - 0.5) * 2, soft); }
  g.putImageData(im, 0, 0); if (shapes.size > 32) shapes.clear(); shapes.set(key, c.toDataURL('image/png')); return shapes.get(key);
}
/** a node as its own run: its output named `<id>x`, then the fade (arithmetic) or the mask (`<id>m`, alpha) — in, over its input */
function own(q, T) {
  const id = q.id, X = id + 'x', a = fadeOf(q, T), kind = maskOf(q, T), soft = clamp01(+q.values.soft || 0), out = [];
  if (T.cls === 'table') { if (T.luma) out.push(['feColorMatrix', { in: '$IN', type: 'matrix', values: S(LUMA) }]);
    const t = tableOf([T.fn(q.values, q)]); out.push(['feComponentTransfer', T.luma ? {} : { in: '$IN' }, [['feFuncR', { type: 'table', tableValues: S(t.r) }], ['feFuncG', { type: 'table', tableValues: S(t.g) }], ['feFuncB', { type: 'table', tableValues: S(t.b) }]]]); }
  else if (T.cls === 'matrix') out.push(['feColorMatrix', { in: '$IN', type: 'matrix', values: S(T.matrix(q.values)) }]);
  else out.push(...T.prim(q.values, id));
  out[out.length - 1][1].result = X;
  if (kind === 'none') return [...out, ['feComposite', { in: X, in2: '$IN', operator: 'arithmetic', k1: 0, k2: a, k3: 1 - a, k4: 0 }]];
  const mask = kind === 'centre' || kind === 'edges'
    ? [['feImage', { href: shape(kind, soft), preserveAspectRatio: 'none' }], ['feComponentTransfer', { result: id + 'm' }, [['feFuncA', { type: 'linear', slope: a, intercept: 0 }]]]]
    : [['feColorMatrix', { in: '$IN', type: 'matrix', values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ' + S(LUMA.slice(0, 3)) + ' 0 0' }],
      ['feComponentTransfer', { result: id + 'm' }, [['feFuncA', { type: 'table', tableValues: S(Array.from({ length: 33 }, (_, i) => a * weight(kind, i / 32, soft))) }]]]];
  return [...out, ...mask, ['feComposite', { in: X, in2: id + 'm', operator: 'in' }], ['feComposite', { in2: '$IN', operator: 'over' }]];
}

export function compile(list, TYPES, cache = new Map(), o = {}) {
  const runs = [], layers = [], keep = new Map(), at = o.upTo ? list.findIndex((q) => q.id === o.upTo) : -1;
  list = o.off ? [] : o.solo ? list.filter((q) => q.id === o.solo) : at >= 0 ? list.slice(0, at + 1) : list;
  let tab = null;                                                    // the TABLE run being folded: its nodes
  const close = () => {
    if (!tab) return;
    const key = tab.map((q) => q.id + ':' + q.v).join('|');
    const t = cache.get(key) || tableOf(tab.map((q) => { const T = TYPES[q.type], f = T.fn(q.values, q), a = fadeOf(q, T); return a < 1 ? (y, ch) => y + a * (clamp01(f(y, ch)) - y) : f; }));
    keep.set(key, t); runs.push({ tables: t }); tab = null;
  };
  const matrix = (m) => { close(); const last = runs[runs.length - 1]; if (last && last.matrix) last.matrix = mul(m, last.matrix); else runs.push({ matrix: m }); };
  for (const q of list) {
    const T = TYPES[q.type];
    if (!T || q.bypass || (T.neutral && T.neutral(q.values, q)) || fadeOf(q, T) === 0) continue;
    const a = fadeOf(q, T);
    if (!over(T) && ownRun(q, T)) { close(); const k = 'o' + q.id + ':' + q.v; keep.set(k, cache.get(k) || { prim: own(q, T) }); runs.push(keep.get(k)); }
    else if (T.cls === 'table') { if (T.luma) matrix(LUMA); (tab || (tab = [])).push(q); }
    else if (T.cls === 'matrix') { const m = T.matrix(q.values); matrix(a < 1 ? m.map((x, i) => a * x + (1 - a) * IDENTITY[i]) : m); }
    else if (T.cls === 'prim') { close(); runs.push({ prim: T.prim(q.values, q.id) }); }
    else if (over(T)) layers.push({ id: q.id, type: q.type, values: q.values, ...(T.cls === 'shader' && { gpu: true }) });
  }
  close();
  cache.clear(); for (const [k, t] of keep) cache.set(k, t);
  const out = runs.filter((r) => !r.matrix || !isIdentity(r.matrix));
  return { runs: out, layers, passes: out.reduce((s, r) => s + (r.prim ? r.prim.length : 1), 0) + layers.length };
}

/** transfer(q, T) → (rgb) → rgb, or null: what this node ALONE does to one colour, through the same fn / matrix the compiler folds — the
 *  card's PREVIEW strip (020 X2; A PREVIEW IS THE NODE'S OWN TRANSFER, never a second render).  A PRIMITIVE or a LAYER has none (spatial) */
export function transfer(q, T) {
  const a = fadeOf(q, T), mix = (c, o) => c.map((x, i) => x + a * (o[i] - x));                     // its FADE too (its MASK is where, not what)
  if (T.cls === 'table') { const f = T.fn(q.values, q); return (c) => { const l = T.luma ? W[0] * c[0] + W[1] * c[1] + W[2] * c[2] : null; return mix(c, c.map((x, i) => clamp01(f(l === null ? x : l, 'RGB'[i])))); }; }
  if (T.cls === 'matrix') { const m = T.matrix(q.values); return (c) => mix(c, [0, 1, 2].map((r) => clamp01(m[r * 5] * c[0] + m[r * 5 + 1] * c[1] + m[r * 5 + 2] * c[2] + m[r * 5 + 4]))); }
  return null;
}
