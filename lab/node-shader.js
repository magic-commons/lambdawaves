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
 *   FEEDBACK   (027 N1) the loop: acc = max(GAIN·picture, DECAY·acc′), acc′ the last acc moved by DRIFT (up), ANGLE (about the centre) and
 *              SCALE (a zoom) — a LIGHTEN, so the ground stays the ground and never washes out; shown as mix(picture, acc, MIX).  A ping-pong
 *              pair of rgba16float textures; it STEPS once per present.
 * A STATEFUL node (FEEDBACK) starts from black when it is placed, when a hand moves one of its knobs (`restart(id)`, lab/nodes.js) and at a
 * film's frame 0; a modulator's write steps on with the new value (it asks for a present, never draws a step of its own).
 * The stage canvas's CSS filter (the chain's grade) is mirrored onto each SHADER canvas, so the column's colour nodes dress it too.
 * 025 B1 · THE FILM BAKES IT: `bake(values, i, l)` runs the same passes from the last tap (the film's own frame, at the film's size) into an rgba8unorm
 * texture and reads it back — premultiplied rgba.  The splat's jitter is a hash of the cell, the copy and PHASE only (nothing per present), so the
 * stage and the film draw the same points; PHASE is the value the record clock's modulation wrote for that frame.  027 N4: the film keeps its
 * own record per node id (`l.id`), stepped once per frame index `i`, from black at frame 0 — a film is a function of its frames alone.
 *   createShaderHost({ device, canvas, palette, tap, present }) → { make(l), paint(el, l), drop(el), restart(id), bake(values, i, l) → Promise<{ rgba, w, h } | null> }
 *     palette() → { lut: Float32Array(256·4) | null, span, n (a count of sets), on, invert, hue } · tap: field.tap · present: ask the field for one frame */
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
  feedback: { cls: 'shader', label: 'FEEDBACK', hint: 'the last picture fed back under the new one: trails', stateful: true, neutral: (v) => v.mix === 0,
    knobs: [{ k: 'decay', label: 'DECAY', min: 0, max: 0.995, home: 0.9, hint: 'how much of the last picture stays: 0 = no trail' },
      { k: 'drift', label: 'DRIFT', min: -12, max: 12, home: 1.5, unit: ' px', hint: 'the trail\'s rise a frame (below 0 it falls)' },
      { k: 'angle', label: 'ANGLE', min: -10, max: 10, home: 0, unit: '°', hint: 'the trail\'s turn a frame, about the centre' },
      { k: 'scale', label: 'SCALE', min: 0.9, max: 1.1, home: 1, hint: 'the trail\'s zoom a frame: above 1 it grows' },
      { k: 'gain', label: 'GAIN', min: 0, max: 2, home: 1, hint: 'the fresh picture\'s weight in the loop' },
      { k: 'mix', label: 'MIX', min: 0, max: 1, home: 1, hint: 'the loop over the picture: 0 = the picture alone' }] },
};

/* the uniforms (24 f32): size · grid (gw, step) · amount freq spread fringe · gain phase src colour · nch samples ground hue · pal (a, b) · invert palOn ·
   mode x1 x2 x3 (a type's own: FEEDBACK angle decay mix) */
const COMMON = /* wgsl */ `
struct U { size: vec2f, grid: vec2f, amount: f32, freq: f32, spread: f32, fringe: f32, gain: f32, phase: f32, src: f32, colour: f32,
  nch: f32, samples: f32, ground: f32, hue: f32, pal: vec2f, invert: f32, palOn: f32, mode: f32, x1: f32, x2: f32, x3: f32 };
@group(0) @binding(0) var<uniform> u: U;
`;
const FULL = /* wgsl */ `@vertex fn vt(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f { return vec4f(f32((i << 1u) & 2u) * 2.0 - 1.0, f32(i & 2u) * 2.0 - 1.0, 0.0, 1.0); }
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
  let k = 1.0 + 0.6 * u.fringe * (f32(ch) - 1.0) * f32(nch > 1u);  // FRINGE: R · G · B pushed 1 ∓ 0.6·FRINGE as far
  let ph = 6.2831853 * u.phase; let o0 = vec2f(cos(ph), sin(ph)) * 2.5;   // PHASE walks a circle in the field: 1 is 0 again
  let pn = p * u.freq;
  // the copies are ONE family of fields, t ∈ [−½, ½] along it (SPREAD: how far it reaches); each point draws its own t in its copy's stratum —
  // a Monte-Carlo sample of the family's density: few SAMPLES = grain, many = the smooth sheet with its bright envelopes (the caustics)
  let t = (f32(s) + rnd(seed ^ 0x51ed27u)) / u.samples - 0.5;
  let d = field(pn, o0 + vec2f(1.0, 0.6) * (t * u.spread * 4.0));
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
const TONE = COMMON + FULL + /* wgsl */ `
@group(0) @binding(1) var acc: texture_2d<f32>;
@group(0) @binding(2) var lut: texture_2d<f32>;
@group(0) @binding(3) var smp: sampler;
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
    let e = min(vec3f(1.0), 4.0 * t);                                  // the ground is black; a quarter of the way up is the palette's own colour
    if (u.nch > 1.5) { c = (pal(mix(t.r, 0.1667, u.fringe)) * e.r + pal(mix(t.g, 0.5, u.fringe)) * e.g + pal(mix(t.b, 0.8333, u.fringe)) * e.b) * (0.3333 + 0.6667 * u.fringe); }
    else { c = pal(t.r) * e.r; }
  }
  c = min(c, vec3f(1.0));
  return vec4f(c, select(1.0, max(c.r, max(c.g, c.b)), u.ground > 0.5));   // premultiplied: BLACK is opaque, STAGE lets the picture through
}
`;
/* FEEDBACK: STEP writes the new acc from the picture and the last acc (where this pixel was a frame ago: the drift, the turn and the zoom undone);
   SHOW lays mix(picture, acc, MIX) on the canvas */
const FBSTEP = COMMON + FULL + /* wgsl */ `
@group(0) @binding(1) var tap: texture_2d<f32>;
@group(0) @binding(2) var prev: texture_2d<f32>;
@group(0) @binding(3) var smp: sampler;
@fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let c = u.size * 0.5; let a = radians(u.x1); let cs = cos(a); let sn = sin(a);
  let r = fc.xy - c + vec2f(0.0, u.amount);
  let p = c + vec2f(cs * r.x + sn * r.y, cs * r.y - sn * r.x) / u.freq;
  var was = vec3f(0.0);
  if (all(p >= vec2f(0.0)) && all(p < u.size)) { was = textureSampleLevel(prev, smp, p / u.size, 0.0).rgb; }
  let now = min(textureLoad(tap, vec2i(fc.xy), 0).rgb * u.gain, vec3f(1.0));
  return vec4f(max(now, was * u.x2), 1.0);                            // LIGHTEN: the ground stays the ground, a bright thing leaves its wake
}
`;
const FBSHOW = COMMON + FULL + /* wgsl */ `
@group(0) @binding(1) var tap: texture_2d<f32>;
@group(0) @binding(2) var acc: texture_2d<f32>;
@fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let q = vec2i(fc.xy); return vec4f(mix(textureLoad(tap, q, 0).rgb, textureLoad(acc, q, 0).rgb, u.x3), 1.0);
}
`;
const ADD = { srcFactor: 'one', dstFactor: 'one', operation: 'add' };
/* the passes: a WGSL module, its entry points, the target (f16 = an rgba16float state, else the canvas or the film's rgba8unorm), additive or not */
const PASSES = {
  splat: { code: SPLAT, vs: 'vs', fs: 'fs', topo: 'point-list', add: true, f16: true },
  tone: { code: TONE, vs: 'vt', fs: 'ft' },
  fbstep: { code: FBSTEP, vs: 'vt', fs: 'fs', f16: true },
  fbshow: { code: FBSHOW, vs: 'vt', fs: 'fs' },
};
const COL = { ink: 0, picture: 1, palette: 2 };

export function createShaderHost({ device, canvas: stage, palette = null, tap = null, present = null }) {
  const recs = new Map(), U = typeof GPUTextureUsage !== 'undefined' ? GPUTextureUsage : {};
  let last = null, base = null;
  const fmt = () => navigator.gpu.getPreferredCanvasFormat();
  const P = {}, M = {};
  function pipe(name, format) {
    const S = PASSES[name], key = name + (S.f16 ? '' : ':' + format);
    if (P[key]) return P[key];
    const module = M[name] || (M[name] = device.createShaderModule({ code: S.code }));
    return (P[key] = device.createRenderPipeline({ layout: 'auto', vertex: { module, entryPoint: S.vs }, primitive: { topology: S.topo || 'triangle-list' },
      fragment: { module, entryPoint: S.fs, targets: [{ format: S.f16 ? 'rgba16float' : format, ...(S.add && { blend: { color: ADD, alpha: ADD } }) }] } }));
  }
  const group = (p, ...res) => device.createBindGroup({ layout: p.getBindGroupLayout(0), entries: res.map((resource, binding) => ({ binding, resource })) });
  const tex16 = (w, h) => device.createTexture({ size: [w, h], format: 'rgba16float', usage: U.RENDER_ATTACHMENT | U.TEXTURE_BINDING });
  const ubuf = () => device.createBuffer({ size: 96, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  function lutOf() {
    return base || (base = { lut: device.createTexture({ size: [256, 1], format: 'rgba8unorm', usage: U.TEXTURE_BINDING | U.COPY_DST }),
      smp: device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'repeat' }),
      lin: device.createSampler({ magFilter: 'linear', minFilter: 'linear' }), of: null, bytes: new Uint8Array(1024) });
  }
  /** the WAVE palette as the LUT texture (uploaded when the field's LUT changed) → [a, b, hue, invert, on] */
  function pal() {
    const q = palette && palette(), p = lutOf();
    if (!q || !q.lut || !q.on) return [0, 1, 0, 0, 0];
    if (p.of !== q.n) { p.of = q.n; for (let i = 0; i < 1024; i++) p.bytes[i] = Math.max(0, Math.min(255, Math.round(q.lut[i] * 255)));
      device.queue.writeTexture({ texture: p.lut }, p.bytes, { bytesPerRow: 1024 }, [256, 1]); }
    return [Math.floor(q.span / 512) / 256, (q.span % 512) / 256, q.hue || 0, q.invert ? 1 : 0, 1];
  }
  /** a record's state, freed (a size change, a COUNT change, a drop) */
  function free(r) { for (const k of ['acc', 'A', 'B']) if (r[k]) { r[k].destroy(); r[k] = null; } }
  /** draw(r, target, step): one picture of node r from the kept tap — onto its canvas, or into the film's `target`; a STATEFUL node advances
   *  its state when `step` (a present, a film frame), else re-does the last step with the values it has now */
  function draw(r, target = null, step = false) {
    if (!last || !r.values) return;
    const { tex, w, h } = last, v = r.values, out = target ? 'rgba8unorm' : fmt(), L = lutOf();
    if (r.el && (r.el.width !== w || r.el.height !== h)) { r.el.width = w; r.el.height = h; }
    if (r.w !== w || r.h !== h) { free(r); r.w = w; r.h = h; r.fresh = true; }
    const k = w / Math.max(1, stage.clientWidth || w);                   // the px knobs are CSS px: the look holds when the governor scales the stage
    const enc = device.createCommandEncoder(), view = () => (target ? target.createView() : r.ctx.getCurrentTexture().createView());
    const pass = (into, pipe, bg, n, m = 1) => { const s = enc.beginRenderPass({ colorAttachments: [{ view: into, loadOp: 'clear', clearValue: [0, 0, 0, 0], storeOp: 'store' }] });
      if (pipe) { s.setPipeline(pipe); s.setBindGroup(0, bg); s.draw(n, m); } s.end(); };
    let uni;
    if (r.type === 'feedback') {
      if (!r.A) { r.A = tex16(w, h); r.B = tex16(w, h); }
      if (step) [r.A, r.B] = [r.B, r.A];                                  // the last acc becomes the one this step reads
      if (r.fresh) { pass(r.A.createView()); r.fresh = false; }          // from black
      uni = [w, h, 0, 0, v.drift * k, v.scale, 0, 0, v.gain, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, v.angle, v.decay, v.mix];
      device.queue.writeBuffer(r.ub, 0, new Float32Array(uni));
      const st = pipe('fbstep'), sh = pipe('fbshow', out);
      pass(r.B.createView(), st, group(st, { buffer: r.ub }, tex.createView(), r.A.createView(), L.lin), 3);
      pass(view(), sh, group(sh, { buffer: r.ub }, tex.createView(), r.B.createView()), 3);
    } else {
      if (!r.acc) r.acc = tex16(w, h);
      const px = w * h, st = px < 1e6 ? 1 : px > 4e6 ? 3 : 2, gw = Math.ceil(w / st), gh = Math.ceil(h / st);
      const S = Math.max(1, Math.round(v.samples)), nch = v.fringe > 0 ? 3 : 1, [a, b, hue, inv, on] = v.colour === 'palette' ? pal() : [0, 1, 0, 0, 0];
      uni = [w, h, gw, st, v.amount * k, 2 / (v.scale * k), v.spread, v.fringe, v.gain, v.phase, v.source === 'edges' ? 1 : 0,
        COL[v.colour] || 0, nch, S, v.ground === 'stage' ? 1 : 0, hue, a, b, inv, on, 0, 0, 0, 0];
      device.queue.writeBuffer(r.ub, 0, new Float32Array(uni));
      const sp = pipe('splat'), tn = pipe('tone', out);
      pass(r.acc.createView(), sp, group(sp, { buffer: r.ub }, tex.createView()), gw * gh, S * nch);   // SPLAT: a point per cell per copy (per channel with FRINGE)
      pass(view(), tn, group(tn, { buffer: r.ub }, r.acc.createView(), L.lut.createView(), L.smp), 3);   // TONE: one triangle over the canvas
    }
    device.queue.submit([enc.finish()]);
  }
  /* 025 B1 / 027 N4 · the film's own records, one per node id: its uniforms, its state, its target; stepped once per frame index, from black at 0 */
  const films = new Map();
  async function bake(values, i = 0, l = null) {
    if (!last || !device) return null;
    const id = (l && l.id) || 'decohere', type = (l && l.type) || 'decohere', { w, h } = last;
    let r = films.get(id);
    if (!r || r.type !== type) { if (r) { free(r); r.ub.destroy(); } r = { el: null, ub: ubuf(), type, at: -1 }; films.set(id, r); }
    if (!r.out || r.out.width !== w || r.out.height !== h) { if (r.out) r.out.destroy(); r.out = device.createTexture({ size: [w, h], format: 'rgba8unorm', usage: U.RENDER_ATTACHMENT | U.COPY_SRC }); }
    if (i === 0) r.fresh = true;
    r.values = values; draw(r, r.out, i !== r.at); r.at = i;
    const bpr = Math.ceil(w * 4 / 256) * 256, buf = device.createBuffer({ size: bpr * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }), enc = device.createCommandEncoder();
    enc.copyTextureToBuffer({ texture: r.out }, { buffer: buf, bytesPerRow: bpr, rowsPerImage: h }, [w, h, 1]); device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const src = new Uint8Array(buf.getMappedRange()), rgba = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) rgba.set(src.subarray(y * bpr, y * bpr + w * 4), y * w * 4);
    buf.unmap(); buf.destroy();
    return { rgba, w, h };
  }
  const onTap = (tex, w, h) => { last = { tex, w, h }; for (const r of recs.values()) draw(r, null, true); };
  return {
    /** a SHADER node's canvas; the first one sets the tap (and asks for a frame, so a paused stage shows it at once) */
    make(l) {
      const el = document.createElement('canvas');
      if (!device) return el;
      const ctx = el.getContext('webgpu'); ctx.configure({ device, format: fmt(), alphaMode: 'premultiplied' });
      recs.set(el, { el, ctx, ub: ubuf(), values: null, key: '', id: l && l.id, type: (l && l.type) || 'decohere', fresh: true });
      if (recs.size === 1 && tap) { tap(onTap); if (present) present(); }
      return el;
    },
    /** the node's values (drawn from the kept tap when they moved; a STATEFUL node asks for a present instead, which steps it); the stage's filter mirrored */
    paint(el, l) {
      if (el.style.filter !== stage.style.filter) el.style.filter = stage.style.filter;
      const r = recs.get(el); if (!r) return;
      r.values = l.values; const key = JSON.stringify(l.values);
      if (key !== r.key) { r.key = key; if (SHADER_TYPES[r.type].stateful && present) present(); else draw(r); }
    },
    /** a hand moved a knob of node `id`: a STATEFUL node starts again from black at its next step */
    restart(id) { for (const r of recs.values()) if (r.id === id) r.fresh = true; },
    bake,
    drop(el) {
      const r = recs.get(el); if (!r) return;
      recs.delete(el); free(r); r.ub.destroy(); r.ctx.unconfigure();
      if (!recs.size) { last = null; if (tap) tap(null); }
    },
  };
}
