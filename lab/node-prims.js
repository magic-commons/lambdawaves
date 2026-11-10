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
   MODE SHIFT (the home: red and blue offset opposite ways along ANGLE, as before) · PERSPECTIVE — red pushed out and blue pulled in from a point,
   an feImage ramp read by two feDisplacementMaps, then screened over green as SHIFT is; AMOUNT stays px, so the film's × k holds.
   040 N1 · THE FOCAL POINT AND THE BLUR BLEND (Josh: "Chromatic abberation should have a blur blend knob. Perspective chromatic abberation also doesn't
   work; it's supposed to come with a movable focal point; show focal point when editing the node"): PERSPECTIVE parts the colours from a FOCAL POINT
   (FOCUS X · FOCUS Y, stage fractions, home the centre — targets like every knob; a handle on the stage while the node is edited, lab/node-focus.js)
   and grows LINEARLY with the distance from it — 038's r² law hid the effect in the corners, so a centred orbital never moved: AMOUNT px at the
   stage's corner from a centred point (twice that at the far corner from a point on an edge).  The ramp is 128², R = ½ + u/4, G = ½ + v/4 with
   u = 2(x − fx), v = 2(y − fy), read at scale ±4·AMOUNT (041 N3: one centred ramp, the focal point an offset; below).  BLUR BLEND softens the parted red and blue (one
   feGaussianBlur each, px, × k in a film) before they screen back over green — SHIFT and PERSPECTIVE alike; at 0 it adds nothing */
/* 041 N3 · ONE RAMP (Josh, call 1: "the perspective mode is SUPER laggy and often doesn't work").  Every FOCUS write drew a new 128² ramp, encoded
   it as a PNG data URL and gave the filter a new feImage to decode — while a hand or a modulator moved the point the map was a picture not yet
   loaded.  A displacement linear in (p − focus) is the centred ramp's plus a constant, so the ramp is drawn ONCE (centred) and the focal point is an
   feOffset before each map: red reads 2·AMOUNT·(½ − focus) px further, blue as far back.  The picture is the same; a FOCUS write changes two numbers */
let RAMP = '';
const ramp = () => { if (RAMP) return RAMP;
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const o = (y * N + x) * 4;
    im.data[o] = 127.5 + 127.5 * (x / (N - 1) - 0.5); im.data[o + 1] = 127.5 + 127.5 * (y / (N - 1) - 0.5); im.data[o + 2] = 128; im.data[o + 3] = 255; }
  g.putImageData(im, 0, 0); return (RAMP = c.toDataURL('image/png')); };
const f01 = (x, d) => (Number.isFinite(+x) ? Math.min(1, Math.max(0, +x)) : d);
const perspective = (v, id) => { const s = v.shift, cx = +(2 * s * (0.5 - f01(v.fx, 0.5))).toFixed(2), cy = +(2 * s * (0.5 - f01(v.fy, 0.5))).toFixed(2), off = cx !== 0 || cy !== 0;
  const map = (scale, rgb, n, k) => [...(off ? [['feOffset', { in: '$IN', dx: -k * cx, dy: -k * cy, result: id + 'f' + n }]] : []),
    ['feDisplacementMap', { in: off ? id + 'f' + n : '$IN', in2: id + 'm', scale, xChannelSelector: 'R', yChannelSelector: 'G', result: id + 'o' + n }],
    ['feColorMatrix', { in: id + 'o' + n, type: 'matrix', values: CH(...rgb), result: id + (n === 1 ? 'r' : 'b') }]];
  return [['feImage', { href: ramp(), preserveAspectRatio: 'none', result: id + 'm' }], ...map(+(4 * s).toFixed(2), [1, 0, 0], 1, 1), ...map(+(-4 * s).toFixed(2), [0, 0, 1], 2, -1), ...screen(v, id)]; };
/** the parted red (`<id>r`) and blue (`<id>b`), each softened by BLUR BLEND when it is on, screened back over the picture's green */
const screen = (v, id) => { const b = +(+v.blur || 0).toFixed(2), on = b > 0;
  return [...(on ? ['r', 'b'].map((c) => ['feGaussianBlur', { in: id + c, stdDeviation: b, edgeMode: 'duplicate', result: id + c + 's' }]) : []),
    ['feColorMatrix', { in: '$IN', type: 'matrix', values: CH(0, 1, 0), result: id + 'g' }],
    ['feBlend', { in: id + (on ? 'rs' : 'r'), in2: id + 'g', mode: 'screen', result: id + 'rg' }], ['feBlend', { in: id + 'rg', in2: id + (on ? 'bs' : 'b'), mode: 'screen' }]]; };
const pct = (x) => Math.round(x * 100) + ' %';
export const PRIM_TYPES = {
  blur: { cls: 'prim', label: 'BLUR', hint: 'a gaussian blur', knobs: [{ k: 'radius', label: 'RADIUS', min: 0, max: 24, home: 2, unit: ' px' }], neutral: (v) => v.radius === 0,
    prim: (v) => [['feGaussianBlur', { stdDeviation: v.radius, edgeMode: 'duplicate' }]] },
  sharpen: { cls: 'prim', label: 'SHARPEN', hint: 'edges crisper', knobs: [{ k: 'amount', label: 'AMOUNT', min: 0, max: 2, home: 0.5 }], neutral: (v) => v.amount === 0,
    prim: (v) => { const a = -v.amount; return [['feConvolveMatrix', { order: 3, kernelMatrix: `0 ${a} 0 ${a} ${1 + 4 * v.amount} ${a} 0 ${a} 0`, preserveAlpha: 'true', edgeMode: 'duplicate' }]]; } },
  aberration: { cls: 'prim', label: 'CHROMATIC ABERRATION', hint: 'red and blue pulled apart, as a cheap lens does', face: [['mode'], ['shift', 'angle', 'blur'], ['fx', 'fy']],
    knobs: [{ k: 'shift', label: 'AMOUNT', min: 0, max: 16, home: 2, unit: ' px', hint: 'AMOUNT — how far red and blue part, in px' },
      { k: 'angle', label: 'ANGLE', min: 0, max: 360, home: 0, unit: '°', hint: 'ANGLE — which way they part (SHIFT only)', off: (v) => v.mode === 'perspective' },
      { k: 'blur', label: 'BLUR BLEND', min: 0, max: 8, home: 0, unit: ' px', hint: 'BLUR BLEND — the parted red and blue softened, in px' },
      { k: 'fx', label: 'FOCUS X', min: 0, max: 1, home: 0.5, fmt: pct, hint: 'FOCUS X — the focal point across the stage (PERSPECTIVE)', off: (v) => v.mode !== 'perspective' },
      { k: 'fy', label: 'FOCUS Y', min: 0, max: 1, home: 0.5, fmt: pct, hint: 'FOCUS Y — the focal point down the stage (PERSPECTIVE)', off: (v) => v.mode !== 'perspective' },
      { k: 'mode', label: 'MODE', home: 'shift', hint: 'SHIFT one way · PERSPECTIVE out from the focal point', options: [{ id: 'shift', label: 'SHIFT' }, { id: 'perspective', label: 'PERSPECTIVE' }] }],
    focus: { x: 'fx', y: 'fy', when: (v) => v.mode === 'perspective' },   // 040 N1: the stage handle (lab/node-focus.js)
    neutral: (v) => v.shift === 0,
    prim: (v, id) => { if (v.mode === 'perspective') return perspective(v, id);
      const a = (v.angle * Math.PI) / 180, dx = +(v.shift * Math.cos(a)).toFixed(2), dy = +(v.shift * Math.sin(a)).toFixed(2);
      return [['feOffset', { in: '$IN', dx, dy, result: id + 'o1' }], ['feColorMatrix', { in: id + 'o1', type: 'matrix', values: CH(1, 0, 0), result: id + 'r' }],
        ['feOffset', { in: '$IN', dx: -dx, dy: -dy, result: id + 'o2' }], ['feColorMatrix', { in: id + 'o2', type: 'matrix', values: CH(0, 0, 1), result: id + 'b' }], ...screen(v, id)]; } },
  bloom: { cls: 'prim', label: 'BLOOM', hint: 'the highlights glow · ' + H, heavy: true,
    knobs: [{ k: 'radius', label: 'RADIUS', min: 1, max: 40, home: 10, unit: ' px', hint: 'RADIUS — how far the glow spreads, in px' }, { k: 'amount', label: 'AMOUNT', min: 0, max: 2, home: 0.6, hint: 'AMOUNT — how bright the glow' }], neutral: (v) => v.amount === 0,
    prim: (v, id) => [['feComponentTransfer', { in: '$IN', result: id + 'h' }, lin(2, -1)], ['feGaussianBlur', { in: id + 'h', stdDeviation: v.radius, result: id + 'g' }],
      ['feComposite', { in: '$IN', in2: id + 'g', operator: 'arithmetic', k1: 0, k2: 1, k3: v.amount, k4: 0 }]] },
  displace: { cls: 'prim', label: 'DISPLACE', hint: 'the picture pushed about by noise · ' + H, heavy: true,
    knobs: [{ k: 'scale', label: 'SCALE', min: 0, max: 80, home: 12, unit: ' px', hint: 'SCALE — how far the noise pushes, in px' }, { k: 'freq', label: 'FREQUENCY', min: 0.001, max: 0.1, home: 0.01, log: true, hint: 'FREQUENCY — how fine the noise' },
      { k: 'seed', label: 'SEED', min: 0, max: 99, step: 1, home: 1, fmt: (x) => String(Math.round(x)), hint: 'SEED — another noise of the same kind' }], neutral: (v) => v.scale === 0,
    prim: (v, id) => [['feTurbulence', { type: 'fractalNoise', baseFrequency: v.freq, numOctaves: 2, seed: Math.round(v.seed), result: id + 't' }],
      ['feDisplacementMap', { in: '$IN', in2: id + 't', scale: v.scale, xChannelSelector: 'R', yChannelSelector: 'G' }]] },
};
