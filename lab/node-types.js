/* lab/node-types.js — NODES' TABLE and MATRIX types, and the one node factory (iteration 019 N2; NODES-DESIGN.md).  Josh (2026-10-27):
 * "basic ones … from photoshop's adjustments/after effects FX and whatnot. Posterize, Threshold, levels, and perhaps a film grain effect".
 * A type is data: { cls, label, hint, knobs: [{ k, label, min, max, home, step?, log?, unit?, colour?, options?, stops? }], neutral(v), fn | matrix }.
 * 038 P1 · THE ARC WEARS A GRADIENT (MIR 1.5.7-alpha.15): a knob's `stops` (CSS colours, evenly spaced) make it the kit's arc with that track and a thumb.
 *   TABLE   (lab/nodes-compile.js folds them into one feComponentTransfer)  LEVELS · POSTERIZE · THRESHOLD (on luma) · INVERT · GAMMA ·
 *           EXPOSURE · CONTRAST — fn(values) → (y, channel) → y, the same on every channel
 *   MATRIX  (folded into one feColorMatrix)  HUE · SATURATION · LUMA · TINT (a colour and an amount) · TEMPERATURE — matrix(values) → 20
 * A NEUTRAL NODE COSTS NOTHING: `neutral(v)` is true where the node is the identity (INVERT at 0, HUE at 0° …); POSTERIZE and THRESHOLD are
 * never the identity; a type with no `neutral` is neutral with every knob at home.  homeOf(type) → the values a new node starts from.
 *   nodeBody(parent, node, T, { idOf(k), hand(k, v, done) }) → { ctls: { k: control }, paint(k, v, shown) }: each knob a MIR control
 *   (controls/factory.js — the kind of value chooses it), a number knob stamped `data-param` with its stable modulation target id
 *   `nodes.<node>.<knob>` (idOf), so it is a drop target like any rack dial; the hand's write goes to `hand`. */
import { control } from './mir/controls/factory.js';
import { colourMatrix } from './mir/panels/picture-filter.js';
import { IDENTITY, LUMA } from './nodes-compile.js';

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const mix = (A, B, t) => A.map((a, i) => a + (B[i] - a) * t);
const W = [0.2126, 0.7152, 0.0722];
const AMOUNT = (home = 1) => ({ k: 'amount', label: 'AMOUNT', min: 0, max: 1, home });
const BW = ['#000', '#fff'];
/** a ±100 readout as Photoshop writes it: +12, 0, −40 */
const signed = (x) => { const r = Math.round(x); return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r); };
/** a LEVELS value (0–1, read 0–255 as Photoshop does) on a black → white track, its name in the readout (the face is bare) */
const lv = (k, label, home, what) => ({ k, label, min: 0, max: 1, home, stops: BW, hint: label + ' — ' + what, fmt: (x) => label + ' ' + Math.round(x * 255) });
/** LEVELS' strip (038 P2): the input histogram's place, with no tap of the stage — the node's own curve (f, its transfer) as a silhouette, and
 *  Photoshop's three input marks under it: black at IN BLACK, grey where mid-grey lands (ib + (iw − ib)·½^γ), white at IN WHITE */
function levelsStrip(g, v, f) {
  const c = g.canvas, W = (c.width = Math.round(2 * (c.clientWidth || 220))), H = (c.height = 48), B = 34;
  g.fillStyle = 'rgba(150,150,150,.75)'; g.beginPath(); g.moveTo(0, B);
  for (let i = 0; i <= 64; i++) g.lineTo((i / 64) * W, B - f([i / 64, i / 64, i / 64])[0] * (B - 2));
  g.lineTo(W, B); g.closePath(); g.fill();
  const mark = (x, fill) => { const p = 6 + Math.min(1, Math.max(0, x)) * (W - 12); g.beginPath(); g.moveTo(p, B + 3); g.lineTo(p - 6, H - 1.5); g.lineTo(p + 6, H - 1.5); g.closePath();
    g.fillStyle = fill; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(128,128,128,.9)'; g.stroke(); };
  mark(v.inblack, '#000'); mark(v.inblack + (v.inwhite - v.inblack) * Math.pow(0.5, v.gamma), '#808080'); mark(v.inwhite, '#fff');
}

export const TABLE_TYPES = {
  levels: { cls: 'table', label: 'LEVELS', hint: 'input and output black/white, gamma (levels)', menu: false,   // 038 P2: kept for every saved graph; the + menu adds levels2
    knobs: [{ k: 'inblack', label: 'IN BLACK', min: 0, max: 1, home: 0 }, { k: 'inwhite', label: 'IN WHITE', min: 0, max: 1, home: 1 },
      { k: 'gamma', label: 'GAMMA', min: 0.1, max: 10, home: 1, log: true }, { k: 'outblack', label: 'OUT BLACK', min: 0, max: 1, home: 0 },
      { k: 'outwhite', label: 'OUT WHITE', min: 0, max: 1, home: 1 }],
    fn: (v) => (y) => { y = clamp01((y - v.inblack) / Math.max(1e-4, v.inwhite - v.inblack)); if (v.gamma !== 1) y = Math.pow(y, 1 / Math.max(1e-3, v.gamma)); return v.outblack + y * (v.outwhite - v.outblack); } },
  posterize: { cls: 'table', label: 'POSTERIZE', hint: 'so many flat steps per channel',
    knobs: [{ k: 'steps', label: 'STEPS', min: 2, max: 32, step: 1, home: 4, fmt: (x) => String(Math.round(x)) }], neutral: () => false,
    fn: (v) => { const n = Math.max(2, Math.round(v.steps)); return (y) => Math.min(n - 1, Math.floor(y * n)) / (n - 1); } },
  threshold: { cls: 'table', label: 'THRESHOLD', hint: 'black below the level, white above it — on the luminance', luma: true,
    knobs: [{ k: 'level', label: 'LEVEL', min: 0, max: 1, home: 0.5 }], neutral: () => false, fn: (v) => (y) => (y >= v.level ? 1 : 0) },
  invert: { cls: 'table', label: 'INVERT', hint: 'the negative', knobs: [AMOUNT()], neutral: (v) => v.amount === 0, fn: (v) => (y) => y + (1 - 2 * y) * v.amount },
  gamma: { cls: 'table', label: 'GAMMA', hint: 'above 1 lifts the middle tones', knobs: [{ k: 'gamma', label: 'GAMMA', min: 0.1, max: 10, home: 1, log: true }],
    fn: (v) => (y) => Math.pow(y, 1 / Math.max(1e-3, v.gamma)) },
  exposure: { cls: 'table', label: 'EXPOSURE', hint: 'stops of light: each one doubles it', knobs: [{ k: 'stops', label: 'STOPS', min: -4, max: 4, home: 0 }],
    fn: (v) => { const m = Math.pow(2, v.stops); return (y) => y * m; } },
  contrast: { cls: 'table', label: 'CONTRAST', hint: 'about mid-grey', knobs: [{ k: 'contrast', label: 'CONTRAST', min: 0, max: 3, home: 1 }],
    fn: (v) => (y) => (y - 0.5) * v.contrast + 0.5 },
  /* 038 P2 · LEVELS, Photoshop's (Josh: "design a new layout inspired by photoshop's level controls while still being compact. (no numbers or texts, only
     during knob edit do they show)"): `levels`' five keys and table on a BARE face — IN BLACK · GAMMA · IN WHITE under the strip (the curve as a
     silhouette over PS's three input marks), OUT BLACK · OUT WHITE below — every track the grey it stands for (GAMMA's: what mid-grey becomes); the
     readout, in Photoshop's 0–255, only while a knob is edited */
  levels2: { cls: 'table', group: 'tone', label: 'LEVELS', hint: 'Photoshop\'s levels: input black, gamma, white; output', bare: true,
    face: [['inblack', 'gamma', 'inwhite'], ['outblack', 'outwhite']],
    knobs: [lv('inblack', 'IN BLACK', 0, 'the input that turns black'), lv('inwhite', 'IN WHITE', 1, 'the input that turns white'),
      { k: 'gamma', label: 'GAMMA', min: 0.1, max: 10, home: 1, log: true, hint: 'GAMMA — above 1 lifts the middle tones', stops: ['#000', '#1d1d1d', '#808080', '#cdcdcd', '#eee'],
        fmt: (x) => 'GAMMA ' + x.toFixed(2) },
      lv('outblack', 'OUT BLACK', 0, 'what black becomes'), lv('outwhite', 'OUT WHITE', 1, 'what white becomes')],
    fn: (v) => TABLE_TYPES.levels.fn(v), draw: levelsStrip },
  /* 038 P3 · EXPOSURE with SHADOWS and HIGHLIGHTS (Josh: "Photoshop uses 'Shadows' and 'Highlights', perhaps we can add these two knobs independent of the
     main exposure knob?"): the one-knob's y·2^stops, clamped, then two bumps — S·y(1−y)² peaks at ⅓, H·y²(1−y) at ⅔ — scaled .945, so at ±100 each moves
     its tone by ±.14 while black and white stay put and the curve stays monotone (its least slope .055); the tracks sit where they act */
  exposure2: { cls: 'table', group: 'tone', label: 'EXPOSURE', hint: 'exposure, then the shadows and the highlights apart',
    knobs: [{ k: 'stops', label: 'EXPOSURE', min: -4, max: 4, home: 0, stops: BW, hint: 'EXPOSURE — stops of light: each one doubles it', fmt: (x) => (x >= 0.005 ? '+' : x <= -0.005 ? '−' : '') + Math.abs(x).toFixed(2) + ' EV' },
      { k: 'shadows', label: 'SHADOWS', min: -100, max: 100, home: 0, stops: ['#000', '#6b6b6b'], hint: 'SHADOWS — the dark tones lifted or deepened', fmt: signed },
      { k: 'highlights', label: 'HIGHLIGHTS', min: -100, max: 100, home: 0, stops: ['#949494', '#fff'], hint: 'HIGHLIGHTS — the light tones raised or dimmed', fmt: signed }],
    fn: (v) => { const m = Math.pow(2, v.stops), S = v.shadows / 100, H = v.highlights / 100;
      return (y) => { y = clamp01(y * m); return y + 0.945 * (S * y * (1 - y) * (1 - y) + H * y * y * (1 - y)); }; } },
};
export const MATRIX_TYPES = {
  hue: { cls: 'matrix', label: 'HUE', hint: 'turn every colour round the wheel', knobs: [{ k: 'hue', label: 'HUE', min: -180, max: 180, home: 0, unit: '°' }],
    neutral: (v) => ((v.hue % 360) + 360) % 360 === 0, matrix: (v) => colourMatrix(1, v.hue) },
  saturation: { cls: 'matrix', label: 'SATURATION', hint: '0 is grey, above 1 is more vivid', knobs: [{ k: 'saturation', label: 'SATURATION', min: 0, max: 3, home: 1 }],
    matrix: (v) => colourMatrix(v.saturation, 0) },
  luma: { cls: 'matrix', label: 'LUMA', hint: 'the luminance alone: greyscale', knobs: [AMOUNT()], neutral: (v) => v.amount === 0, matrix: (v) => mix(IDENTITY, LUMA, v.amount) },
  tint: { cls: 'matrix', label: 'TINT', hint: 'the luminance in one colour, sepia\'s way', knobs: [{ k: 'colour', label: 'COLOUR', colour: true, home: [1, 0.78, 0.52] }, AMOUNT(0.6)],
    neutral: (v) => v.amount === 0,
    matrix: (v) => { const c = v.colour; return mix(IDENTITY, [...W.map((w) => w * c[0]), 0, 0, ...W.map((w) => w * c[1]), 0, 0, ...W.map((w) => w * c[2]), 0, 0, 0, 0, 0, 1, 0], v.amount); } },
  temperature: { cls: 'matrix', label: 'TEMPERATURE', hint: 'warm (amber) ↔ cool (blue)', knobs: [{ k: 'warmth', label: 'WARMTH', min: -1, max: 1, home: 0 }],
    matrix: (v) => { const w = v.warmth * 0.25; return [1 + w, 0, 0, 0, 0, 0, 1 + w * 0.15, 0, 0, 0, 0, 0, 1 - w, 0, 0, 0, 0, 0, 1, 0]; } },
};

/** 020 X4 · FADE AND MASK: the foot of every node but a LAYER (whose AMOUNT is its fade) — lab/nodes-compile.js folds FADE; a MASK makes the
 *  node its own run.  FADE and SOFT are knobs, so modulation targets (`nodes.<node>.fade`, `.soft`) */
export const FOOT = [{ k: 'fade', label: 'FADE', min: 0, max: 1, home: 1, hint: 'the node mixed back with its input: 100 % is all of it', fmt: (x) => Math.round(x * 100) + ' %' },
  { k: 'mask', label: 'MASK', home: 'none', options: ['none', 'lights', 'darks', 'mids', 'centre', 'edges'].map((id) => ({ id, label: id.toUpperCase() })) },
  { k: 'soft', label: 'SOFT', min: 0, max: 1, home: 0.5, hint: 'the mask\'s edge: 0 hard, 1 a long ramp' },
  /* 038 N6 · A NODE HAS A TARGET (nodes-compile.js): BOTH · STAGE · OBJECT (the balls and sticks), appended — a file without it reads BOTH */
  { k: 'target', label: 'TARGET', home: 'both', hint: 'where it acts: the stage, the balls and sticks, or both', options: ['both', 'stage', 'object'].map((id) => ({ id, label: id.toUpperCase() })) }];
/** homeOf(T) → a new node's values.  A type with no `neutral` of its own is neutral with every knob at home (the compiler reads `neutral`) */
export const homeOf = (T) => Object.fromEntries((T.cls && T.cls !== 'layer' && T.cls !== 'shader' ? [...T.knobs, ...FOOT] : T.knobs).map((K) => [K.k, Array.isArray(K.home) ? K.home.slice() : K.home]));
for (const T of [...Object.values(TABLE_TYPES), ...Object.values(MATRIX_TYPES)]) if (!T.neutral) T.neutral = (v) => T.knobs.every((K) => v[K.k] === K.home);

/** THE NODE FACTORY: the knob list of type T as MIR controls in `parent` */
export function nodeBody(parent, node, T, { idOf, hand }) {
  const ctls = {}, at = {};
  /* 038 P2 · A FULL NODE'S FACE: `face` lays the knobs out one fit row per line (a knob it does not name joins the last); `bare` hides the labels,
     and the readout (its name in `fmt`) shows only while a knob is edited (nodes.css) */
  if (T.face) for (const keys of T.face) { const r = document.createElement('div'); r.className = 'nodes-face row fit'; parent.appendChild(r); for (const k of keys) at[k] = r; at[''] = r; }
  if (T.bare) parent.classList.add('nodes-bare');
  const order = T.face ? [...T.face.flat(), ...T.knobs.map((K) => K.k)].filter((k, i, a) => a.indexOf(k) === i) : T.knobs.map((K) => K.k);
  for (const K of order.map((k) => T.knobs.find((J) => J.k === k))) {
    const c = ctls[K.k] = control({ id: idOf(K.k), label: K.label, hint: K.hint, min: K.min, max: K.max, step: K.step, log: K.log, home: K.home, unit: K.unit,
      fmt: K.fmt, colour: K.colour, options: K.options, stops: K.stops, value: node.values[K.k], onInput: (v) => hand(K.k, v, false), onChange: (v) => hand(K.k, v, true) });
    (at[K.k] || at[''] || parent).appendChild(c.root);
    if (c.targets[0]) c.targets[0].root.dataset.param = idOf(K.k);
  }
  return {
    ctls,
    /** paint(k, v, shown): the hand's value (set), or a modulator's painted over the base (show) */
    paint(k, v, shown) { const c = ctls[k]; if (!c || c.root.classList.contains('drag')) return; const w = c.targets[0]; if (shown && w && w.show) w.show(v); else c.set(v); },
  };
}
