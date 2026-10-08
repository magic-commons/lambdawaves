/* panels/picture-filter.js — THE PICTURE FILTER: the zero-engine road for GRADE and CURVES (docs/PANEL-GRADE.md, docs/PANEL-CURVES.md).
 *
 * One inline SVG filter on the app's canvas (or any element), so the master grade and the curves work on any picture with no app code:
 *
 *   feColorMatrix        SATURATION and HUE, composed into one 4 × 5 matrix (the CSS saturate() and hue-rotate() matrices, Rec. 709 weights)
 *   feComponentTransfer  one 256-entry table per channel: EXPOSURE → BLACK / WHITE → GAMMA → CONTRAST, then the MASTER curve, then the
 *                        channel's own curve (R, G, B), then INVERT — every per-channel transfer composed into ONE table, so the whole
 *                        grade is two primitives at most
 *   CSS                  `opacity` (OPACITY) and `mix-blend-mode` (BLEND) on the element itself
 *
 * THE LAWS IT KEEPS
 *   · ONE FILTER PER PICTURE.  `pictureFilter(canvas)` hands every caller the same instance (counted): GRADE writes the grade, CURVES the
 *     tables, and they land in the one filter.  The last `release()` puts the element's own filter, opacity and blend back.
 *   · NEUTRAL COSTS NOTHING.  A primitive that would do nothing is not in the filter, and when nothing is left the element's filter is
 *     `none`: the default grade adds no filter pass at all.
 *   · ONE WRITE PER FRAME.  Every change marks what it touched and the write is coalesced on core/frame.js: a modulated HUE rewrites the
 *     matrix's twenty numbers once a frame and never rebuilds a table; a table is rebuilt only when the tone, a curve or INVERT moved.
 *   · sRGB.  The filter works in sRGB (`color-interpolation-filters`), as CSS filters do, so a table read on the screen is the table written.
 *
 *   pictureFilter(el) → { el, id, setGrade(partial), setTable(channel, table | null), grade(), tables(), describe(), flush(), release() }
 *     channel   'MASTER' | 'R' | 'G' | 'B' (any case); a table is 256 numbers in 0..1 (a Float32Array, an array), null is identity
 *   Pure, for tests and for an app that takes the values into its own shader:
 *     GRADE_HOME · BLEND_MODES · TABLE_N · toneAt(x, g) · toneTable(g, n) · colourMatrix(saturation, hueDeg) · isNeutralTone(g)
 *     isNeutralMatrix(g) · lookup(table, x) · composeTables(g, tables, n) → { r, g, b } | null */
import { frame } from '../core/frame.js';
import { setAttr } from '../core/perf.js';

export const TABLE_N = 256;
/** the grade's neutral values: every one of them leaves the picture as it was */
export const GRADE_HOME = Object.freeze({ exposure: 1, contrast: 1, gamma: 1, saturation: 1, hue: 0, black: 0, white: 1, opacity: 1, blend: 'normal', invert: false });
/** the CSS blend modes, in the order the platform lists them */
export const BLEND_MODES = Object.freeze(['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn',
  'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']);

const NS = 'http://www.w3.org/2000/svg';
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const num = (v, d) => (Number.isFinite(+v) ? +v : d);

/** toneAt(x, g) — one channel through EXPOSURE (a multiplier), BLACK / WHITE (the input levels), GAMMA (out = in^(1/γ): above 1 lifts the
 *  middle) and CONTRAST (about mid-grey), clamped to 0..1 */
export function toneAt(x, g) {
  let y = x * num(g.exposure, 1);
  const b = num(g.black, 0), w = num(g.white, 1);
  y = clamp01((y - b) / Math.max(1e-4, w - b));
  const gm = Math.max(1e-3, num(g.gamma, 1));
  if (gm !== 1) y = Math.pow(y, 1 / gm);
  const c = num(g.contrast, 1);
  if (c !== 1) y = clamp01((y - 0.5) * c + 0.5);
  return y;
}
/** toneTable(g, n) → Float32Array(n), the tone as a table */
export function toneTable(g, n = TABLE_N) { const out = new Float32Array(n); for (let i = 0; i < n; i++) out[i] = toneAt(i / (n - 1), g); return out; }
export const isNeutralTone = (g) => num(g.exposure, 1) === 1 && num(g.black, 0) === 0 && num(g.white, 1) === 1 && num(g.gamma, 1) === 1 && num(g.contrast, 1) === 1;
export const isNeutralMatrix = (g) => num(g.saturation, 1) === 1 && (((num(g.hue, 0) % 360) + 360) % 360) === 0;

/** colourMatrix(s, hueDeg) → the 20 numbers of feColorMatrix type="matrix": saturate(s) after hue-rotate(hueDeg) (the CSS matrices) */
export function colourMatrix(s, hueDeg) {
  const a = (num(hueDeg, 0) * Math.PI) / 180, c = Math.cos(a), n = Math.sin(a);
  const H = [0.213 + c * 0.787 - n * 0.213, 0.715 - c * 0.715 - n * 0.715, 0.072 - c * 0.072 + n * 0.928,
    0.213 - c * 0.213 + n * 0.143, 0.715 + c * 0.285 + n * 0.140, 0.072 - c * 0.072 - n * 0.283,
    0.213 - c * 0.213 - n * 0.787, 0.715 - c * 0.715 + n * 0.715, 0.072 + c * 0.928 + n * 0.072];
  const S = [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
    0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
    0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s];
  const M = [];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) M.push(S[r * 3] * H[k] + S[r * 3 + 1] * H[3 + k] + S[r * 3 + 2] * H[6 + k]);
  return [M[0], M[1], M[2], 0, 0, M[3], M[4], M[5], 0, 0, M[6], M[7], M[8], 0, 0, 0, 0, 0, 1, 0];
}

/** lookup(table, x) — a table read the way feComponentTransfer reads one: linear between its entries */
export function lookup(t, x) {
  if (!t || !t.length) return x;
  const n = t.length - 1, p = clamp01(x) * n, i = Math.min(n - 1, Math.floor(p)), f = p - i;
  return n === 0 ? t[0] : t[i] + (t[i + 1] - t[i]) * f;
}

/** composeTables(g, tables, n) → { r, g, b } (Float32Arrays) for the one feComponentTransfer, or null when it would do nothing.
 *  tables: { MASTER, R, G, B } (null / absent = identity) */
export function composeTables(g, tables = {}, n = TABLE_N) {
  const T = tables || {}, inv = !!g.invert;
  if (isNeutralTone(g) && !inv && !T.MASTER && !T.R && !T.G && !T.B) return null;
  const tone = isNeutralTone(g) ? null : toneTable(g, n);
  const out = {};
  for (const [k, ch] of [['r', 'R'], ['g', 'G'], ['b', 'B']]) {
    const a = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let y = i / (n - 1);
      if (tone) y = tone[i];
      if (T.MASTER) y = lookup(T.MASTER, y);
      if (T[ch]) y = lookup(T[ch], y);
      a[i] = clamp01(inv ? 1 - y : y);
    }
    out[k] = a;
  }
  return out;
}

const str = (a) => { let s = ''; for (let i = 0; i < a.length; i++) s += (i ? ' ' : '') + (+a[i]).toFixed(4).replace(/\.?0+$/, ''); return s || '0'; };
const CH = (c) => { const k = String(c || '').toUpperCase(); return k === 'MASTER' || k === 'RGB' ? 'MASTER' : k === 'R' || k === 'RED' ? 'R' : k === 'G' || k === 'GREEN' ? 'G' : k === 'B' || k === 'BLUE' ? 'B' : null; };

let uid = 0, host = null;
const live = new WeakMap();
function svgHost() {
  if (host && host.isConnected) return host;
  host = document.createElementNS(NS, 'svg');
  host.setAttribute('class', 'mir-picture-filters'); host.setAttribute('aria-hidden', 'true'); host.setAttribute('focusable', 'false');
  host.setAttribute('width', '0'); host.setAttribute('height', '0');
  host.style.position = 'absolute'; host.style.width = '0'; host.style.height = '0'; host.style.overflow = 'hidden'; host.style.pointerEvents = 'none';   // not display:none: a filter in a display:none svg is not drawn everywhere
  document.body.appendChild(host);
  return host;
}

/** pictureFilter(el) — the one filter on this element (made on the first call, shared by every later one until the last release) */
export function pictureFilter(target) {
  if (!target || !target.style) throw new TypeError('pictureFilter: needs an element (the app\'s canvas)');
  const had = live.get(target);
  if (had) { had.refs++; return had.api; }
  const id = 'mir-picture-' + (++uid), key = 'mir.picture.filter.' + uid;
  const before = { filter: target.style.filter, opacity: target.style.opacity, blend: target.style.mixBlendMode };
  const G = { ...GRADE_HOME }, T = { MASTER: null, R: null, G: null, B: null };
  const f = document.createElementNS(NS, 'filter');
  f.setAttribute('id', id); f.setAttribute('color-interpolation-filters', 'sRGB');
  f.setAttribute('x', '0'); f.setAttribute('y', '0'); f.setAttribute('width', '1'); f.setAttribute('height', '1');   // the element's own box: nothing outside it is filtered
  const mx = document.createElementNS(NS, 'feColorMatrix'); mx.setAttribute('type', 'matrix');
  const ct = document.createElementNS(NS, 'feComponentTransfer');
  const fn = {};
  for (const c of ['R', 'G', 'B']) { const e = document.createElementNS(NS, 'feFunc' + c); e.setAttribute('type', 'table'); ct.appendChild(e); fn[c] = e; }
  svgHost().appendChild(f);
  let dirtyMatrix = true, dirtyTable = true, dirtyCss = true, on = { matrix: false, table: false };

  function write() {
    if (dirtyMatrix) {
      dirtyMatrix = false;
      on.matrix = !isNeutralMatrix(G);
      if (on.matrix) setAttr(mx, 'values', str(colourMatrix(num(G.saturation, 1), num(G.hue, 0))));
    }
    if (dirtyTable) {
      dirtyTable = false;
      const t = composeTables(G, T);
      on.table = !!t;
      if (t) { setAttr(fn.R, 'tableValues', str(t.r)); setAttr(fn.G, 'tableValues', str(t.g)); setAttr(fn.B, 'tableValues', str(t.b)); }
    }
    const want = [on.matrix ? mx : null, on.table ? ct : null].filter(Boolean);
    if (want.length !== f.childNodes.length || want.some((n, i) => f.childNodes[i] !== n)) f.replaceChildren(...want);
    const css = want.length ? 'url(#' + id + ')' + (before.filter ? ' ' + before.filter : '') : (before.filter || '');   // the element's own filter, if it had one, still runs after
    if (target.style.filter !== css) target.style.filter = css;
    if (dirtyCss) {
      dirtyCss = false;
      const o = clamp01(num(G.opacity, 1));
      target.style.opacity = o === 1 ? before.opacity : String(o);
      target.style.mixBlendMode = !G.blend || G.blend === 'normal' ? before.blend : G.blend;
    }
  }
  const schedule = () => frame.coalesce(key, write);

  const api = {
    el: target, id,
    /** setGrade({ exposure, contrast, gamma, saturation, hue, black, white, opacity, blend, invert }) — any subset */
    setGrade(p) {
      if (!p) return api;
      for (const [k, v] of Object.entries(p)) {
        if (!(k in GRADE_HOME) || G[k] === v) continue;
        G[k] = v;
        if (k === 'saturation' || k === 'hue') dirtyMatrix = true;
        else if (k === 'opacity' || k === 'blend') dirtyCss = true;
        else dirtyTable = true;
      }
      schedule(); return api;
    },
    /** setTable(channel, table | null) — a curve's 256 entries for MASTER, R, G or B */
    setTable(channel, table) {
      const c = CH(channel); if (!c) return api;
      T[c] = table && table.length ? Float32Array.from(table) : null;
      dirtyTable = true; schedule(); return api;
    },
    grade: () => ({ ...G }),
    tables: () => ({ ...T }),
    /** what the filter is doing now: { matrix, table, css } (after the last write) */
    describe: () => ({ matrix: on.matrix, table: on.table, css: target.style.filter, opacity: target.style.opacity, blend: target.style.mixBlendMode }),
    /** write now (a test, or an export that must see this frame's grade) */
    flush() { frame.cancel(key); write(); return api; },
    release() {
      const rec = live.get(target); if (!rec) return;
      if (--rec.refs > 0) return;
      live.delete(target); frame.cancel(key); f.remove();
      target.style.filter = before.filter; target.style.opacity = before.opacity; target.style.mixBlendMode = before.blend;
      if (host && !host.childNodes.length) { host.remove(); host = null; }
    },
  };
  live.set(target, { refs: 1, api });
  schedule();
  return api;
}
