/* lab/nodes-compile.js — THE COMPILER (iteration 019 N1; research/iteration-019/NODES-DESIGN.md).  NODES' graph is not interpreted, it is
 * COMPILED to the kit's one picture filter (`pictureFilter(canvas).setChain(runs)`, kit 1.5.0-alpha.33).  The node classes, by what they
 * compile to:
 *   TABLE      a per-channel transfer y → f(y, channel); contiguous TABLE nodes fold into ONE feComponentTransfer (their functions composed
 *              in graph order, each clamped to 0..1, evaluated at the 256 entries — exact composition, not a table of a table)
 *   MATRIX     a 4 × 5 colour matrix; contiguous MATRIX nodes fold into ONE feColorMatrix (multiplied in graph order)
 *   PRIMITIVE  its own SVG primitives, in graph order: a primitive between two folds starts a new fold
 *   LAYER      not a filter primitive at all: a layer over the stage (lab/node-layers.js), listed in graph order
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
 *   Pure helpers: IDENTITY · LUMA · mul(B, A) · isIdentity(m) · tableOf(fns, n) */
import { TABLE_N } from './mir/panels/picture-filter.js';

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const IDENTITY = Object.freeze([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]);
const W = [0.2126, 0.7152, 0.0722];
export const LUMA = Object.freeze([...W, 0, 0, ...W, 0, 0, ...W, 0, 0, 0, 0, 0, 1, 0]);

/** mul(B, A) → the 4 × 5 matrix of B after A (each a 5 × 5 with the row 0 0 0 0 1 left out) */
export function mul(B, A) {
  const o = new Array(20);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    let s = c === 4 ? B[r * 5 + 4] : 0;
    for (let k = 0; k < 4; k++) s += B[r * 5 + k] * A[k * 5 + c];
    o[r * 5 + c] = s;
  }
  return o;
}
export const isIdentity = (m) => m.every((x, i) => Math.abs(x - IDENTITY[i]) < 1e-9);

/** tableOf(fns, n) → { r, g, b }: y = i / (n − 1) through every function in order, clamped after each */
export function tableOf(fns, n = TABLE_N) {
  const out = {};
  for (const [k, ch] of [['r', 'R'], ['g', 'G'], ['b', 'B']]) {
    const a = new Float32Array(n);
    for (let i = 0; i < n; i++) { let y = i / (n - 1); for (const f of fns) y = clamp01(f(y, ch)); a[i] = y; }
    out[k] = a;
  }
  return out;
}

export function compile(list, TYPES, cache = new Map(), o = {}) {
  const runs = [], layers = [], keep = new Map(), at = o.upTo ? list.findIndex((q) => q.id === o.upTo) : -1;
  list = o.off ? [] : o.solo ? list.filter((q) => q.id === o.solo) : at >= 0 ? list.slice(0, at + 1) : list;
  let tab = null;                                                    // the TABLE run being folded: its nodes
  const close = () => {
    if (!tab) return;
    const key = tab.map((q) => q.id + ':' + q.v).join('|');
    const t = cache.get(key) || tableOf(tab.map((q) => TYPES[q.type].fn(q.values, q)));
    keep.set(key, t); runs.push({ tables: t }); tab = null;
  };
  const matrix = (m) => { close(); const last = runs[runs.length - 1]; if (last && last.matrix) last.matrix = mul(m, last.matrix); else runs.push({ matrix: m }); };
  for (const q of list) {
    const T = TYPES[q.type];
    if (!T || q.bypass || (T.neutral && T.neutral(q.values, q))) continue;
    if (T.cls === 'table') { if (T.luma) matrix(LUMA); (tab || (tab = [])).push(q); }
    else if (T.cls === 'matrix') matrix(T.matrix(q.values));
    else if (T.cls === 'prim') { close(); runs.push({ prim: T.prim(q.values, q.id) }); }
    else if (T.cls === 'layer') layers.push({ id: q.id, type: q.type, values: q.values });
  }
  close();
  cache.clear(); for (const [k, t] of keep) cache.set(k, t);
  const out = runs.filter((r) => !r.matrix || !isIdentity(r.matrix));
  return { runs: out, layers, passes: out.reduce((s, r) => s + (r.prim ? r.prim.length : 1), 0) + layers.length };
}

/** transfer(q, T) → (rgb) → rgb, or null: what this node ALONE does to one colour, through the same fn / matrix the compiler folds — the
 *  card's PREVIEW strip (020 X2; A PREVIEW IS THE NODE'S OWN TRANSFER, never a second render).  A PRIMITIVE or a LAYER has none (spatial) */
export function transfer(q, T) {
  if (T.cls === 'table') { const f = T.fn(q.values, q); return (c) => { const l = T.luma ? W[0] * c[0] + W[1] * c[1] + W[2] * c[2] : null; return c.map((x, i) => clamp01(f(l === null ? x : l, 'RGB'[i]))); }; }
  if (T.cls === 'matrix') { const m = T.matrix(q.values); return (c) => [0, 1, 2].map((r) => clamp01(m[r * 5] * c[0] + m[r * 5 + 1] * c[1] + m[r * 5 + 2] * c[2] + m[r * 5 + 4])); }
  return null;
}
