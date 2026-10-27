/* lab/node-prims.js — NODES' PRIMITIVE types (iteration 019 N4; NODES-DESIGN.md).  A PRIMITIVE node is a real pass: its own SVG primitives in
 * the picture filter's chain, in graph order (a PRIMITIVE between two folds starts a new fold — lab/nodes-compile.js).  prim(values, id) →
 * the kit's run spec [[tag, attrs, children?], …] (`setChain`, kit alpha.33): '$IN' is the run's input (the picture as it reaches the node);
 * a node's inner results are named after the node id, so two nodes of one type never meet.  Neutral (nothing emitted): RADIUS / AMOUNT /
 * SHIFT / SCALE at 0.
 *   BLUR        feGaussianBlur (RADIUS, px)
 *   SHARPEN     feConvolveMatrix 3 × 3, the unsharp cross (AMOUNT)
 *   CHROMATIC ABERRATION  red and blue offset opposite ways (SHIFT px · ANGLE °), screened back over green — 7 primitives, one blur's worth
 *   BLOOM       HEAVY: the highlights (above mid-grey, doubled) blurred and added back (RADIUS · AMOUNT) — the dearest: a full-screen blur
 *   DISPLACE    HEAVY: fractal noise displacing the picture (SCALE px · FREQUENCY · SEED); a still seed (an animated one is heavier still)
 * Josh's call 2 (019, default): BLOOM and DISPLACE ship behind the "heavy" mark and a hint; no governor yet. */
const H = 'HEAVY — a full-screen pass every frame: it costs on a slow card';
const CH = (r, g, b) => `${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`;
const lin = (slope, intercept) => ['R', 'G', 'B'].map((c) => ['feFunc' + c, { type: 'linear', slope, intercept }]);
export const PRIM_TYPES = {
  blur: { cls: 'prim', label: 'BLUR', hint: 'a gaussian blur', knobs: [{ k: 'radius', label: 'RADIUS', min: 0, max: 24, home: 2, unit: ' px' }], neutral: (v) => v.radius === 0,
    prim: (v) => [['feGaussianBlur', { stdDeviation: v.radius, edgeMode: 'duplicate' }]] },
  sharpen: { cls: 'prim', label: 'SHARPEN', hint: 'edges crisper', knobs: [{ k: 'amount', label: 'AMOUNT', min: 0, max: 2, home: 0.5 }], neutral: (v) => v.amount === 0,
    prim: (v) => { const a = -v.amount; return [['feConvolveMatrix', { order: 3, kernelMatrix: `0 ${a} 0 ${a} ${1 + 4 * v.amount} ${a} 0 ${a} 0`, preserveAlpha: 'true', edgeMode: 'duplicate' }]]; } },
  aberration: { cls: 'prim', label: 'CHROMATIC ABERRATION', hint: 'red and blue pulled apart, as a cheap lens does',
    knobs: [{ k: 'shift', label: 'SHIFT', min: 0, max: 16, home: 2, unit: ' px' }, { k: 'angle', label: 'ANGLE', min: 0, max: 360, home: 0, unit: '°' }], neutral: (v) => v.shift === 0,
    prim: (v, id) => { const a = (v.angle * Math.PI) / 180, dx = +(v.shift * Math.cos(a)).toFixed(2), dy = +(v.shift * Math.sin(a)).toFixed(2);
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
