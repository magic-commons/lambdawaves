/* lab/node-prims.js — NODES' PRIMITIVE types (iteration 019 N4; NODES-DESIGN.md).  A PRIMITIVE node is a real pass: its own SVG primitives in
 * the picture filter's chain, in graph order (a PRIMITIVE between two folds starts a new fold — lab/nodes-compile.js).  prim(values, id) →
 * the kit's run spec [[tag, attrs, children?], …] (`setChain`, kit alpha.33): '$IN' is the run's input (the picture as it reaches the node);
 * a node's inner results are named after the node id, so two nodes of one type never meet.  Neutral (nothing emitted): RADIUS / AMOUNT /
 * SHIFT / SCALE at 0.
 *   BLUR        feGaussianBlur (RADIUS, px)
 *   SHARPEN     feConvolveMatrix 3 × 3, the unsharp cross (AMOUNT)
 *   CHROMATIC ABERRATION  red and blue offset opposite ways (AMOUNT px · ANGLE °), screened back over green — 7 primitives, one blur's worth;
 *               038 P7 MODE PERSPECTIVE: radial from the centre, Procreate's (8 primitives; below)
 *   BLOOM       HEAVY: the highlights (above mid-grey, doubled) blurred and added back (RADIUS · AMOUNT) — the dearest: a full-screen blur
 *   DISPLACE    HEAVY: fractal noise displacing the picture (SCALE px · FREQUENCY · SEED); a still seed (an animated one is heavier still)
 * Josh's call 2 (019, default): BLOOM and DISPLACE ship behind the "heavy" mark and a hint; no governor yet. */
const H = 'HEAVY — a full-screen pass every frame: it costs on a slow card';
const CH = (r, g, b) => `${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`;
const lin = (slope, intercept) => ['R', 'G', 'B'].map((c) => ['feFunc' + c, { type: 'linear', slope, intercept }]);
/* 038 P7 · CHROMATIC ABERRATION's PERSPECTIVE (Josh: "have a toggle where it can shift to perspective mode similar to 'Procreate's chrom-aberration"):
   MODE SHIFT (the home: red and blue offset opposite ways along ANGLE, as before) · PERSPECTIVE — red pushed out and blue pulled in from the centre,
   still at the middle and AMOUNT px at the corners, growing as r²: an feImage of a 64² ramp (R = ½ + ½·u·r/√2, G = ½ + ½·v·r/√2, u and v from the
   centre, drawn once) read by two feDisplacementMaps of scale ±2·AMOUNT, then screened over green as SHIFT is — 8 primitives, the same ··· class;
   AMOUNT stays px, so the film's × k holds */
let RAMP = null;
const ramp = () => { if (RAMP) return RAMP; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), im = g.createImageData(64, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const u = x / 31.5 - 1, v = y / 31.5 - 1, r = Math.hypot(u, v) / Math.SQRT2, o = (y * 64 + x) * 4;
    im.data[o] = 127.5 + 127.5 * u * r; im.data[o + 1] = 127.5 + 127.5 * v * r; im.data[o + 2] = 128; im.data[o + 3] = 255; }
  g.putImageData(im, 0, 0); return (RAMP = c.toDataURL('image/png')); };
const perspective = (s, id) => { const map = (scale, rgb, n) => [['feDisplacementMap', { in: '$IN', in2: id + 'm', scale, xChannelSelector: 'R', yChannelSelector: 'G', result: id + 'o' + n }],
  ['feColorMatrix', { in: id + 'o' + n, type: 'matrix', values: CH(...rgb), result: id + (n === 1 ? 'r' : 'b') }]];
  return [['feImage', { href: ramp(), preserveAspectRatio: 'none', result: id + 'm' }], ...map(+(2 * s).toFixed(2), [1, 0, 0], 1), ...map(+(-2 * s).toFixed(2), [0, 0, 1], 2),
    ['feColorMatrix', { in: '$IN', type: 'matrix', values: CH(0, 1, 0), result: id + 'g' }],
    ['feBlend', { in: id + 'r', in2: id + 'g', mode: 'screen', result: id + 'rg' }], ['feBlend', { in: id + 'rg', in2: id + 'b', mode: 'screen' }]]; };
export const PRIM_TYPES = {
  blur: { cls: 'prim', label: 'BLUR', hint: 'a gaussian blur', knobs: [{ k: 'radius', label: 'RADIUS', min: 0, max: 24, home: 2, unit: ' px' }], neutral: (v) => v.radius === 0,
    prim: (v) => [['feGaussianBlur', { stdDeviation: v.radius, edgeMode: 'duplicate' }]] },
  sharpen: { cls: 'prim', label: 'SHARPEN', hint: 'edges crisper', knobs: [{ k: 'amount', label: 'AMOUNT', min: 0, max: 2, home: 0.5 }], neutral: (v) => v.amount === 0,
    prim: (v) => { const a = -v.amount; return [['feConvolveMatrix', { order: 3, kernelMatrix: `0 ${a} 0 ${a} ${1 + 4 * v.amount} ${a} 0 ${a} 0`, preserveAlpha: 'true', edgeMode: 'duplicate' }]]; } },
  aberration: { cls: 'prim', label: 'CHROMATIC ABERRATION', hint: 'red and blue pulled apart, as a cheap lens does', face: [['mode'], ['shift', 'angle']],
    knobs: [{ k: 'shift', label: 'AMOUNT', min: 0, max: 16, home: 2, unit: ' px', hint: 'AMOUNT — how far red and blue part, in px' },
      { k: 'angle', label: 'ANGLE', min: 0, max: 360, home: 0, unit: '°', hint: 'ANGLE — which way they part (SHIFT only)' },
      { k: 'mode', label: 'MODE', home: 'shift', hint: 'SHIFT one way · PERSPECTIVE out from the centre', options: [{ id: 'shift', label: 'SHIFT' }, { id: 'perspective', label: 'PERSPECTIVE' }] }],
    neutral: (v) => v.shift === 0,
    prim: (v, id) => { if (v.mode === 'perspective') return perspective(v.shift, id);
      const a = (v.angle * Math.PI) / 180, dx = +(v.shift * Math.cos(a)).toFixed(2), dy = +(v.shift * Math.sin(a)).toFixed(2);
      return [['feOffset', { in: '$IN', dx, dy, result: id + 'o1' }], ['feColorMatrix', { in: id + 'o1', type: 'matrix', values: CH(1, 0, 0), result: id + 'r' }],
        ['feOffset', { in: '$IN', dx: -dx, dy: -dy, result: id + 'o2' }], ['feColorMatrix', { in: id + 'o2', type: 'matrix', values: CH(0, 0, 1), result: id + 'b' }],
        ['feColorMatrix', { in: '$IN', type: 'matrix', values: CH(0, 1, 0), result: id + 'g' }],
        ['feBlend', { in: id + 'r', in2: id + 'g', mode: 'screen', result: id + 'rg' }], ['feBlend', { in: id + 'rg', in2: id + 'b', mode: 'screen' }]]; } },
  bloom: { cls: 'prim', label: 'BLOOM', hint: 'the highlights glow · ' + H, heavy: true,
    knobs: [{ k: 'radius', label: 'RADIUS', min: 1, max: 40, home: 10, unit: ' px' }, { k: 'amount', label: 'AMOUNT', min: 0, max: 2, home: 0.6 }], neutral: (v) => v.amount === 0,
    prim: (v, id) => [['feComponentTransfer', { in: '$IN', result: id + 'h' }, lin(2, -1)], ['feGaussianBlur', { in: id + 'h', stdDeviation: v.radius, result: id + 'g' }],
      ['feComposite', { in: '$IN', in2: id + 'g', operator: 'arithmetic', k1: 0, k2: 1, k3: v.amount, k4: 0 }]] },
  displace: { cls: 'prim', label: 'DISPLACE', hint: 'the picture pushed about by noise · ' + H, heavy: true,
    knobs: [{ k: 'scale', label: 'SCALE', min: 0, max: 80, home: 12, unit: ' px' }, { k: 'freq', label: 'FREQUENCY', min: 0.001, max: 0.1, home: 0.01, log: true },
      { k: 'seed', label: 'SEED', min: 0, max: 99, step: 1, home: 1, fmt: (x) => String(Math.round(x)) }], neutral: (v) => v.scale === 0,
    prim: (v, id) => [['feTurbulence', { type: 'fractalNoise', baseFrequency: v.freq, numOctaves: 2, seed: Math.round(v.seed), result: id + 't' }],
      ['feDisplacementMap', { in: '$IN', in2: id + 't', scale: v.scale, xChannelSelector: 'R', yChannelSelector: 'G' }]] },
};
