/* lab/node-types.js — NODES' TABLE and MATRIX types, and the one node factory (iteration 019 N2; NODES-DESIGN.md).  Josh (2026-10-27):
 * "basic ones … from photoshop's adjustments/after effects FX and whatnot. Posterize, Threshold, levels, and perhaps a film grain effect".
 * A type is data: { cls, label, hint, knobs: [{ k, label, min, max, home, step?, log?, unit?, colour?, options? }], neutral(v), fn | matrix }.
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

export const TABLE_TYPES = {
  levels: { cls: 'table', label: 'LEVELS', hint: 'input black and white, the middle (gamma), output black and white — Photoshop\'s levels',
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

/** homeOf(T) → a new node's values.  A type with no `neutral` of its own is neutral with every knob at home (the compiler reads `neutral`) */
export const homeOf = (T) => Object.fromEntries(T.knobs.map((K) => [K.k, Array.isArray(K.home) ? K.home.slice() : K.home]));
for (const T of [...Object.values(TABLE_TYPES), ...Object.values(MATRIX_TYPES)]) if (!T.neutral) T.neutral = (v) => T.knobs.every((K) => v[K.k] === K.home);

/** THE NODE FACTORY: the knob list of type T as MIR controls in `parent` */
export function nodeBody(parent, node, T, { idOf, hand }) {
  const ctls = {};
  for (const K of T.knobs) {
    const c = ctls[K.k] = control({ id: idOf(K.k), label: K.label, hint: K.hint, min: K.min, max: K.max, step: K.step, log: K.log, home: K.home, unit: K.unit,
      fmt: K.fmt, colour: K.colour, options: K.options, value: node.values[K.k], onInput: (v) => hand(K.k, v, false), onChange: (v) => hand(K.k, v, true) });
    parent.appendChild(c.root);
    if (c.targets[0]) c.targets[0].root.dataset.param = idOf(K.k);
  }
  return {
    ctls,
    /** paint(k, v, shown): the hand's value (set), or a modulator's painted over the base (show) */
    paint(k, v, shown) { const c = ctls[k]; if (!c || c.root.classList.contains('drag')) return; const w = c.targets[0]; if (shown && w && w.show) w.show(v); else c.set(v); },
  };
}
