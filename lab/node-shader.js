/* lab/node-shader.js — NODES' SHADER class and its one host (iteration 024 S2–S3; research/iteration-024/PLAN.md, RESEARCH.md §2 · §5).
 * A SHADER node is a real GPU pass over the field's presented picture (`field.tap`, lab/field.js), on the field's own device, drawn into its
 * own canvas in `#nodeLayers` (the layer host hands a `gpu` layer to this host).  It draws on each tap (a present) and on each knob change
 * from the kept tap texture — never on a clock of its own: a still instrument is still, motion is PHASE routed from a MIR LFO.
 *   DECOHERE   the lines decohere into caustics: every bright point of the picture (or of its edges) is moved by a smooth noise field and
 *              DEPOSITED additively where it lands (a `point-list` splat, one/one into rgba16float); where the map folds the deposits pile
 *              up — the bright sheets are fold caustics.  Then TONE: 1 − exp(−5·GAIN·ρ) → INK (white) · PICTURE (the sampled rgb) · PALETTE
 *              (the WAVE palette's LUT between its first and last stop, ROTATE and INVERT as the ESP bar reads them; with FRINGE the
 *              three channel densities take three palette picks, ⅙ · ½ · ⅚).  GROUND BLACK replaces the picture; STAGE lets it show.
 *              AMOUNT 0 is neutral: no canvas, no tap.  The grid pitch is automatic: 1 px under 1 Mpx, 2, 3 above 4 Mpx.
 * The stage canvas's CSS filter (the chain's grade) is mirrored onto each SHADER canvas, so the column's colour nodes dress it too.
 *   createShaderHost({ device, canvas, palette, tap, present }) → { make(l), paint(el, l), drop(el) }
 *     palette() → { lut: Float32Array(256·4) | null, span, on, invert, hue } · tap: field.tap · present: ask the field for one frame */
const opt = (...a) => a.map((id) => ({ id, label: id.toUpperCase() }));
export const SHADER_TYPES = {
  decohere: { cls: 'shader', label: 'DECOHERE', hint: 'the lines decohere into caustics — a splat through noise', heavy: true, neutral: (v) => v.amount === 0,
    knobs: [{ k: 'amount', label: 'AMOUNT', min: 0, max: 120, home: 24, unit: ' px', hint: 'how far each point is pushed: 0 = the lines as they are' },
      { k: 'scale', label: 'SCALE', min: 20, max: 600, home: 160, log: true, unit: ' px', hint: 'the noise field\'s wavelength' },
      { k: 'samples', label: 'SAMPLES', min: 1, max: 32, step: 1, home: 8, hint: 'copies per point: few = grain, many = smooth (the cost)' },
      { k: 'spread', label: 'SPREAD', min: 0, max: 1, home: 0.35, hint: 'the copies\' fields: 0 = the pure fold, 1 = a soft wash' },
      { k: 'fringe', label: 'FRINGE', min: 0, max: 1, home: 0.25, hint: 'the three channels pushed apart, as a prism does' },
      { k: 'gain', label: 'GAIN', min: 0.1, max: 8, home: 1, log: true, hint: 'the exposure of the deposits' },
      { k: 'phase', label: 'PHASE', min: 0, max: 1, home: 0, hint: 'the field\'s drift — route an LFO here for motion' },
      { k: 'source', label: 'SOURCE', home: 'edges', options: opt('picture', 'edges') },
      { k: 'colour', label: 'COLOUR', home: 'palette', options: opt('ink', 'picture', 'palette') },
      { k: 'ground', label: 'GROUND', home: 'black', options: opt('black', 'stage') }] },
};

/* the uniforms (20 f32): size · grid (gw, step) · amount freq spread fringe · gain phase src colour · nch samples ground hue · pal (a, b) · invert palOn */
const COMMON = /* wgsl */ `
struct U { size: vec2f, grid: vec2f, amount: f32, freq: f32, spread: f32, fringe: f32, gain: f32, phase: f32, src: f32, colour: f32,
  nch: f32, samples: f32, ground: f32, hue: f32, pal: vec2f, invert: f32, palOn: f32 };
@group(0) @binding(0) var<uniform> u: U;
`;
const SPLAT = COMMON + /* wgsl */ `
@group(0) @binding(1) var tap: texture_2d<f32>;
struct VO { @builtin(position) pos: vec4f, @location(0) col: vec4f };
fn hash(x: u32) -> u32 { let v = x * 747796405u + 2891336453u; let w = ((v >> ((v >> 28u) + 4u)) ^ v) * 277803737u; return (w >> 22u) ^ w; }
fn rnd(x: u32) -> f32 { return f32(hash(x)) * 2.3283064e-10; }
fn grad(c: vec2f) -> vec2f { let a = 6.2831853 * rnd((bitcast<u32>(i32(c.x)) * 73856093u) ^ (bitcast<u32>(i32(c.y)) * 19349663u)); return vec2f(cos(a), sin(a)); }
fn noise(p: vec2f) -> f32 {
  let i = floor(p); let f = p - i; let s = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  let a = dot(grad(i), f); let b = dot(grad(i + vec2f(1.0, 0.0)), f - vec2f(1.0, 0.0));
  let c = dot(grad(i + vec2f(0.0, 1.0)), f - vec2f(0.0, 1.0)); let d = dot(grad(i + vec2f(1.0, 1.0)), f - vec2f(1.0, 1.0));
  return mix(mix(a, b, s.x), mix(c, d, s.x), s.y) * 1.4;
}
fn fbm(p: vec2f) -> f32 { return (noise(p) + 0.5 * noise(p * 2.03 + 17.0) + 0.25 * noise(p * 4.01 - 9.0)) / 1.75; }
fn field(p: vec2f, o: vec2f) -> vec2f { return vec2f(fbm(p + o), fbm(p + o + vec2f(31.4, 17.9))); }
fn lum(c: vec3f) -> f32 { return dot(c, vec3f(0.2126, 0.7152, 0.0722)); }
fn at(q: vec2i) -> vec3f { return textureLoad(tap, clamp(q, vec2i(0), vec2i(u.size) - 1), 0).rgb; }
@vertex fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VO {
  var o: VO; o.pos = vec4f(2.0, 2.0, 0.0, 1.0); o.col = vec4f(0.0);
  let gw = u32(u.grid.x); let st = u.grid.y; let nch = u32(u.nch); let ch = ii % nch; let s = ii / nch;
  let seed = hash(vi ^ hash(s * 6271u + u32(u.phase * 4096.0) * 7919u));
  let p = (vec2f(f32(vi % gw), f32(vi / gw)) + vec2f(rnd(seed), rnd(seed ^ 0x9e3779b9u))) * st;   // a point anywhere in its cell
  let q = vec2i(p); let c = at(q);
  var v = lum(c);
  if (u.src > 0.5) {                                                   // EDGES: the gradient's length, 4 reads
    let g = vec2f(lum(at(q + vec2i(1, 0))) - lum(at(q - vec2i(1, 0))), lum(at(q + vec2i(0, 1))) - lum(at(q - vec2i(0, 1))));
    v = clamp(length(g) * 3.0, 0.0, 1.0);
  }
  if (v < 0.02) { return o; }                                          // a dark point lands nowhere
  let ph = 6.2831853 * u.phase; let o0 = vec2f(cos(ph), sin(ph)) * 2.5;   // PHASE walks a circle in the field: 1 is 0 again
  let pn = p * u.freq;
  // the copies are ONE family of fields, t ∈ [−½, ½] along it (SPREAD: how far it reaches); each point draws its own t in its copy's stratum —
  // a Monte-Carlo sample of the family's density: few SAMPLES = grain, many = the smooth sheet with its bright envelopes (the caustics)
  let t = (f32(s) + rnd(seed ^ 0x51ed27u)) / u.samples - 0.5;
  let d = field(pn, o0 + vec2f(1.0, 0.6) * (t * u.spread * 4.0));
  let k = 1.0 + 0.6 * u.fringe * (f32(ch) - 1.0) * f32(nch > 1u);  // FRINGE: R · G · B pushed 1 ∓ 0.6·FRINGE as far
  let y = p + d * u.amount * k;
  var col = vec3f(v);
  if (u.colour > 0.5 && u.colour < 1.5) { col = c / max(max(c.r, max(c.g, c.b)), 0.001) * v; }   // PICTURE carries its hue
  if (nch > 1u) { col = col * vec3f(f32(ch == 0u), f32(ch == 1u), f32(ch == 2u)); }
  o.col = vec4f(col * (st * st / u.samples), 0.0);
  o.pos = vec4f((y.x + 0.5) / u.size.x * 2.0 - 1.0, 1.0 - (y.y + 0.5) / u.size.y * 2.0, 0.0, 1.0);
  return o;
}
@fragment fn fs(i: VO) -> @location(0) vec4f { return i.col; }
`;
const TONE = COMMON + /* wgsl */ `
@group(0) @binding(1) var acc: texture_2d<f32>;
@group(0) @binding(2) var lut: texture_2d<f32>;
@group(0) @binding(3) var smp: sampler;
@vertex fn vt(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f { return vec4f(f32((i << 1u) & 2u) * 2.0 - 1.0, f32(i & 2u) * 2.0 - 1.0, 0.0, 1.0); }
fn pal(x: f32) -> vec3f {
  var t = u.pal.x + (u.pal.y - u.pal.x) * x + u.hue; t = t - floor(t);
  let c = textureSampleLevel(lut, smp, vec2f(t, 0.5), 0.0).rgb;
  return select(c, 1.0 - c, u.invert > 0.5);
}
@fragment fn ft(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let r = textureLoad(acc, vec2i(fc.xy), 0).rgb;
  let t = 1.0 - exp(-5.0 * u.gain * r);
  var c = t;
  if (u.colour > 1.5 && u.palOn > 0.5) {
    if (u.nch > 1.5) { c = (pal(mix(t.r, 0.1667, u.fringe)) * t.r + pal(mix(t.g, 0.5, u.fringe)) * t.g + pal(mix(t.b, 0.8333, u.fringe)) * t.b) * (0.3333 + 0.6667 * u.fringe); }
    else { c = pal(t.r) * t.r; }
  }
  c = min(c, vec3f(1.0));
  return vec4f(c, select(1.0, max(c.r, max(c.g, c.b)), u.ground > 0.5));   // premultiplied: BLACK is opaque, STAGE lets the picture through
}
`;
const COL = { ink: 0, picture: 1, palette: 2 };
const ADD = { srcFactor: 'one', dstFactor: 'one', operation: 'add' };

export function createShaderHost({ device, canvas: stage, palette = null, tap = null, present = null }) {
  const recs = new Map(), U = typeof GPUTextureUsage !== 'undefined' ? GPUTextureUsage : {};
  let last = null, P = null;
  const fmt = () => navigator.gpu.getPreferredCanvasFormat();
  function pipes() {
    if (P) return P;
    const ms = device.createShaderModule({ code: SPLAT }), mt = device.createShaderModule({ code: TONE });
    P = { splat: device.createRenderPipeline({ layout: 'auto', vertex: { module: ms, entryPoint: 'vs' }, primitive: { topology: 'point-list' },
      fragment: { module: ms, entryPoint: 'fs', targets: [{ format: 'rgba16float', blend: { color: ADD, alpha: ADD } }] } }),
    tone: device.createRenderPipeline({ layout: 'auto', vertex: { module: mt, entryPoint: 'vt' }, fragment: { module: mt, entryPoint: 'ft', targets: [{ format: fmt() }] } }),
    lut: device.createTexture({ size: [256, 1], format: 'rgba8unorm', usage: U.TEXTURE_BINDING | U.COPY_DST }),
    smp: device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'repeat' }), lutOf: null, lutBytes: new Uint8Array(1024) };
    return P;
  }
  /** the WAVE palette as the LUT texture (uploaded when the field's LUT changed) → [a, b, hue, invert, on] */
  function pal(p) {
    const q = palette && palette();
    if (!q || !q.lut || !q.on) return [0, 1, 0, 0, 0];
    if (p.lutOf !== q.lut) { p.lutOf = q.lut; for (let i = 0; i < 1024; i++) p.lutBytes[i] = Math.max(0, Math.min(255, Math.round(q.lut[i] * 255)));
      device.queue.writeTexture({ texture: p.lut }, p.lutBytes, { bytesPerRow: 1024 }, [256, 1]); }
    return [Math.floor(q.span / 512) / 256, (q.span % 512) / 256, q.hue || 0, q.invert ? 1 : 0, 1];
  }
  function draw(r) {
    if (!last) return;
    const { tex, w, h } = last, v = r.values, p = pipes();
    if (r.el.width !== w || r.el.height !== h) { r.el.width = w; r.el.height = h; }
    if (!r.acc || r.acc.width !== w || r.acc.height !== h) { if (r.acc) r.acc.destroy(); r.tg = null;
      r.acc = device.createTexture({ size: [w, h], format: 'rgba16float', usage: U.RENDER_ATTACHMENT | U.TEXTURE_BINDING }); }
    if (r.tex !== tex) { r.tex = tex; r.sg = device.createBindGroup({ layout: p.splat.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: r.ub } }, { binding: 1, resource: tex.createView() }] }); }
    if (!r.tg) r.tg = device.createBindGroup({ layout: p.tone.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: r.ub } },
      { binding: 1, resource: r.acc.createView() }, { binding: 2, resource: p.lut.createView() }, { binding: 3, resource: p.smp }] });
    const px = w * h, step = px < 1e6 ? 1 : px > 4e6 ? 3 : 2, gw = Math.ceil(w / step), gh = Math.ceil(h / step);
    const k = w / Math.max(1, stage.clientWidth || w);                   // AMOUNT and SCALE are CSS px: the look holds when the governor scales the stage
    const S = Math.max(1, Math.round(v.samples)), nch = v.fringe > 0 ? 3 : 1, [a, b, hue, inv, on] = v.colour === 'palette' ? pal(p) : [0, 1, 0, 0, 0];
    device.queue.writeBuffer(r.ub, 0, new Float32Array([w, h, gw, step, v.amount * k, 2 / (v.scale * k), v.spread, v.fringe, v.gain, v.phase, v.source === 'edges' ? 1 : 0,
      COL[v.colour] || 0, nch, S, v.ground === 'stage' ? 1 : 0, hue, a, b, inv, on]));
    const enc = device.createCommandEncoder(), pass = (view, pipe, bg, n, m) => { const s = enc.beginRenderPass({ colorAttachments: [{ view, loadOp: 'clear', clearValue: [0, 0, 0, 0], storeOp: 'store' }] });
      s.setPipeline(pipe); s.setBindGroup(0, bg); s.draw(n, m); s.end(); };
    pass(r.acc.createView(), p.splat, r.sg, gw * gh, S * nch);          // SPLAT: a point per cell per copy (per channel with FRINGE)
    pass(r.ctx.getCurrentTexture().createView(), p.tone, r.tg, 3, 1);    // TONE: one triangle over the canvas
    device.queue.submit([enc.finish()]);
  }
  const onTap = (tex, w, h) => { last = { tex, w, h }; for (const r of recs.values()) draw(r); };
  return {
    /** a SHADER node's canvas; the first one sets the tap (and asks for a frame, so a paused stage shows it at once) */
    make() {
      const el = document.createElement('canvas');
      if (!device) return el;
      const ctx = el.getContext('webgpu'); ctx.configure({ device, format: fmt(), alphaMode: 'premultiplied' });
      recs.set(el, { el, ctx, ub: device.createBuffer({ size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }), values: null, key: '' });
      if (recs.size === 1 && tap) { tap(onTap); if (present) present(); }
      return el;
    },
    /** the node's values (drawn from the kept tap when they moved); the stage's filter mirrored */
    paint(el, l) {
      if (el.style.filter !== stage.style.filter) el.style.filter = stage.style.filter;
      const r = recs.get(el); if (!r) return;
      r.values = l.values; const key = JSON.stringify(l.values); if (key !== r.key) { r.key = key; draw(r); }
    },
    drop(el) {
      const r = recs.get(el); if (!r) return;
      recs.delete(el); if (r.acc) r.acc.destroy(); r.ub.destroy(); r.ctx.unconfigure();
      if (!recs.size) { last = null; if (tap) tap(null); }
    },
  };
}
