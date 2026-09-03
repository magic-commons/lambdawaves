/* field.js — the FIELD cache and its presenter (WebGPU).
 *
 * STATUS: NUMERICAL.  The cache ψ(r) on an N³ grid is a RENDERING PRODUCT, not the state
 * (§11): the authoritative state is the coefficient register; this module is told the active
 * modes {table, c} and rebuilds ψ = Σ c_a φ_a(r) on the GPU (RECONSTRUCT), then presents the
 * latest valid cache under any camera/material (PRESENT).  Quality (resolution, ray steps,
 * render scale) changes only the estimate, never the state (§43).
 *
 * The basis is GENERATED in the compute kernel from the closed-form polynomial tables of
 * hydrogen.js (no basis textures, no memory per mode): each voxel evaluates
 *     φ = norm · e^{-ρ/2} ρ^l L(ρ) · sin^{|m|}θ D(cosθ) · e^{imφ},   ρ = 2r/n.
 * A 96³ grid × 16 modes is ~14 M evaluations — well under a millisecond on an RTX 3070.
 */
import { modeTable } from './hydrogen.js';

export const VIEW = { density: 0, phase: 1, real: 2, imag: 3, diff: 4 };
export const VIEW_NAMES = ['density', 'phase', 'real', 'imag', 'diff'];
/** how the same observable is DRAWN: a cloud, a bounded plateau (lit surface), or noisy particles */
export const STYLE = { cloud: 0, solid: 1, grain: 2 };
export const STYLE_NAMES = ['cloud', 'solid', 'grain'];
export const SLICE = { off: 0, clip: 1, slab: 2 };
export const MAX_MODES = 32;
const MODE_BYTES = 96;

const COMPUTE_WGSL = /* wgsl */`
struct Mode { nlm: vec4<f32>, c: vec4<f32>, lag0: vec4<f32>, lag1: vec4<f32>, leg0: vec4<f32>, leg1: vec4<f32> };
struct Params { n: u32, count: u32, slot: u32, space: u32, half: f32, p1: f32, p2: f32, p3: f32 };   // space: 0 position, 1 momentum
@group(0) @binding(0) var<uniform> P: Params;
@group(0) @binding(1) var<storage, read> modes: array<Mode>;
@group(0) @binding(2) var outTex: texture_storage_3d<rgba16float, write>;
@group(0) @binding(3) var<storage, read_write> stats: array<atomic<u32>>;
var<workgroup> wmax: atomic<u32>;

fn ipow(x: f32, k: u32) -> f32 { var r = 1.0; for (var i = 0u; i < k; i++) { r *= x; } return r; }

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_index) lid: u32) {
  if (lid == 0u) { atomicStore(&wmax, 0u); }
  workgroupBarrier();
  var dens = 0.0;
  if (all(gid < vec3<u32>(P.n, P.n, P.n))) {
    let pos = (vec3<f32>(gid) + vec3<f32>(0.5)) / f32(P.n) * (2.0 * P.half) - vec3<f32>(P.half);
    let r = length(pos);
    let ct = select(pos.z / max(r, 1e-12), 1.0, r < 1e-9);
    let st = sqrt(max(0.0, 1.0 - ct * ct));
    let phi = atan2(pos.y, pos.x);
    var psi = vec2<f32>(0.0, 0.0);
    for (var a = 0u; a < P.count; a++) {
      let M = modes[a];
      let n = M.nlm.x; let l = u32(M.nlm.y); let am = u32(M.nlm.z); let m = M.nlm.w;
      let D = M.leg0.x + ct * (M.leg0.y + ct * (M.leg0.z + ct * (M.leg0.w + ct * (M.leg1.x + ct * M.leg1.y))));
      var f = 0.0;
      if (P.space == 0u) {
        /* POSITION  ψ = norm · e^{−ρ/2} ρ^l L(ρ) · Y,  ρ = 2r/n  (L = Laguerre) */
        let rho = 2.0 * r / n;
        let L = M.lag0.x + rho * (M.lag0.y + rho * (M.lag0.z + rho * (M.lag0.w + rho * (M.lag1.x + rho * M.lag1.y))));
        f = M.c.z * exp(-0.5 * rho) * ipow(rho, l) * L * ipow(st, am) * D;
      } else {
        /* MOMENTUM  φ = norm · t^{l/2} P(t) (1+t)^{−(n+1)} · Y,  t = n²p²  (P = the Podolsky–Pauling numerator;
           the (−i)^l phase is folded into c on the CPU).  Same record, different envelope. */
        let q = n * r; let t = q * q;
        let L = M.lag0.x + t * (M.lag0.y + t * (M.lag0.z + t * (M.lag0.w + t * (M.lag1.x + t * M.lag1.y))));
        f = M.c.z * ipow(q, l) * L / pow(1.0 + t, n + 1.0) * ipow(st, am) * D;
      }
      let e = vec2<f32>(cos(m * phi), sin(m * phi));
      let ce = vec2<f32>(M.c.x * e.x - M.c.y * e.y, M.c.x * e.y + M.c.y * e.x);
      psi += f * ce;
    }
    textureStore(outTex, vec3<i32>(gid), vec4<f32>(psi.x, psi.y, 0.0, 0.0));
    dens = dot(psi, psi);
  }
  atomicMax(&wmax, bitcast<u32>(dens));
  workgroupBarrier();
  if (lid == 0u) { atomicMax(&stats[P.slot], atomicLoad(&wmax)); }
}`;

const RENDER_WGSL = /* wgsl */`
struct View {
  cam: vec4<f32>,    // xyz camera position, w half-width
  right: vec4<f32>,  // xyz, w = tanHalfFov * aspect
  up: vec4<f32>,     // xyz, w = tanHalfFov
  fwd: vec4<f32>,    // xyz, w = steps
  p0: vec4<f32>,     // view mode, exposure, softness, dither
  p1: vec4<f32>,     // slice mode, slice axis, slice pos (-1..1 of half), slab thickness (fraction of half)
  p2: vec4<f32>,     // hue shift, invert, palette on, unused
  p3: vec4<f32>,     // draw style, iso level (fraction of ρmax), grain, saturation knee
};
@group(0) @binding(0) var<uniform> V: View;
@group(0) @binding(1) var psiTex: texture_3d<f32>;
@group(0) @binding(2) var refTex: texture_3d<f32>;
@group(0) @binding(3) var samp: sampler;
@group(0) @binding(4) var<storage, read> stats: array<u32>;
/* the PALETTE: 256 colours around the complex plane, arg ψ = −π at index 0 and +π at 255 (wrapping).
   Written from palette.js; V.p2.z > 0.5 turns it on and the built-in HSV wheel off. */
@group(0) @binding(5) var<storage, read> pal: array<vec4<f32>, 256>;

struct VSOut { @builtin(position) pos: vec4<f32>, @location(0) uv: vec2<f32> };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VSOut {
  var p = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  var o: VSOut; o.pos = vec4<f32>(p[i], 0.0, 1.0); o.uv = p[i]; return o;
}
fn hsv(h: f32, s: f32, v: f32) -> vec3<f32> {
  let k = vec3<f32>(fract(h) * 6.0, fract(h) * 6.0 + 4.0, fract(h) * 6.0 + 2.0);
  let m = vec3<f32>(fract(k.x / 6.0) * 6.0, fract(k.y / 6.0) * 6.0, fract(k.z / 6.0) * 6.0);
  let c = clamp(abs(m - vec3<f32>(3.0)) - vec3<f32>(1.0), vec3<f32>(0.0), vec3<f32>(1.0));
  return v * mix(vec3<f32>(1.0), c, s);
}
fn hash(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(12.9898, 78.233))) * 43758.5453); }
fn hash3(p: vec3<f32>) -> f32 { return fract(sin(dot(p, vec3<f32>(127.1, 311.7, 74.7))) * 43758.5453); }
/* the local density, for the SOLID mode's surface normal */
fn rhoAt(psiTex: texture_3d<f32>, samp: sampler, uvw: vec3<f32>) -> f32 {
  let s = textureSampleLevel(psiTex, samp, uvw, 0.0).rg; return dot(s, s);
}
/* the interval of the ray inside the axis slab lo ≤ p_k ≤ hi */
fn slabInterval(ro: f32, rd: f32, lo: f32, hi: f32) -> vec2<f32> {
  if (abs(rd) < 1e-9) { if (ro >= lo && ro <= hi) { return vec2<f32>(-1e30, 1e30); } return vec2<f32>(1.0, -1.0); }
  let a = (lo - ro) / rd; let b = (hi - ro) / rd;
  return vec2<f32>(min(a, b), max(a, b));
}
@fragment fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let half = V.cam.w;
  let ro = V.cam.xyz;
  let rd = normalize(V.fwd.xyz + in.uv.x * V.right.w * V.right.xyz + in.uv.y * V.up.w * V.up.xyz);
  let bg = mix(vec3<f32>(0.016, 0.022, 0.034), vec3<f32>(0.040, 0.056, 0.082), in.uv.y * 0.5 + 0.5);
  // box
  let inv = vec3<f32>(select(1.0 / rd.x, 1e30, abs(rd.x) < 1e-9), select(1.0 / rd.y, 1e30, abs(rd.y) < 1e-9), select(1.0 / rd.z, 1e30, abs(rd.z) < 1e-9));
  let t1 = (vec3<f32>(-half) - ro) * inv; let t2 = (vec3<f32>(half) - ro) * inv;
  let tmn = min(t1, t2); let tmx = max(t1, t2);
  var t0 = max(max(tmn.x, tmn.y), tmn.z); var tf = min(min(tmx.x, tmx.y), tmx.z);
  t0 = max(t0, 0.0);
  // slice
  let smode = u32(V.p1.x); let axis = u32(V.p1.y); let spos = V.p1.z * half; let thick = max(V.p1.w * half, 0.6 * (2.0 * half) / 96.0);
  if (smode != 0u) {
    var rok = 0.0; var rdk = 0.0;
    if (axis == 0u) { rok = ro.x; rdk = rd.x; } else if (axis == 1u) { rok = ro.y; rdk = rd.y; } else { rok = ro.z; rdk = rd.z; }
    var iv = vec2<f32>(0.0);
    if (smode == 1u) { iv = slabInterval(rok, rdk, -1e30, spos); } else { iv = slabInterval(rok, rdk, spos - thick, spos + thick); }
    t0 = max(t0, iv.x); tf = min(tf, iv.y);
  }
  if (tf <= t0) { return vec4<f32>(bg, 1.0); }
  let steps = max(V.fwd.w, 8.0);
  let ds = (tf - t0) / steps;
  let mode = u32(V.p0.x);
  let sigma = V.p0.y * 24.0;
  let soft = V.p0.z;
  let rhoMax = max(bitcast<f32>(stats[0]), 1e-30);
  let ampMax = sqrt(rhoMax);
  let refMax = max(bitcast<f32>(stats[1]), 1e-30);
  var col = vec3<f32>(0.0); var alpha = 0.0;
  var t = t0 + ds * hash(in.pos.xy + vec2<f32>(V.p0.w));
  let stepN = ds / (2.0 * half);        // step as a fraction of the box
  for (var i = 0u; i < 512u; i++) {
    if (f32(i) >= steps || t > tf) { break; }
    let p = ro + rd * t;
    let uvw = (p + vec3<f32>(half)) / (2.0 * half);
    let s = textureSampleLevel(psiTex, samp, uvw, 0.0).rg;
    var w = 0.0; var c = vec3<f32>(0.0);
    if (mode == 0u) {
      let rho = dot(s, s) / rhoMax;
      w = pow(rho, soft);
      c = mix(vec3<f32>(0.08, 0.45, 0.62), vec3<f32>(1.0, 1.0, 1.0), pow(rho, 0.45));
    } else if (mode == 1u) {
      let rho = dot(s, s) / rhoMax;
      w = pow(rho, soft);
      let h = atan2(s.y, s.x) / 6.283185307 + 0.5 + V.p2.x;
      if (V.p2.z > 0.5) {
        let u = fract(h) * 256.0;
        let i0 = u32(floor(u)) % 256u; let i1 = (i0 + 1u) % 256u;
        c = mix(pal[i0].rgb, pal[i1].rgb, fract(u));       // the user's palette, linearly interpolated and wrapping
      } else { c = hsv(h, 0.85, 1.0); }
    } else if (mode == 2u || mode == 3u) {
      var v = 0.0; if (mode == 2u) { v = s.x / ampMax; } else { v = s.y / ampMax; }
      w = pow(v * v, soft);
      c = select(vec3<f32>(0.22, 0.50, 1.0), vec3<f32>(1.0, 0.58, 0.16), v > 0.0);
    } else {
      let rf = textureSampleLevel(refTex, samp, uvw, 0.0).rg;
      let d = (dot(s, s) - dot(rf, rf)) / max(rhoMax, refMax);
      w = pow(abs(d), soft);
      c = select(vec3<f32>(0.25, 0.48, 1.0), vec3<f32>(1.0, 0.86, 0.22), d > 0.0);
    }
    if (V.p2.y > 0.5) { c = vec3<f32>(1.0) - c; }
    /* ── DRAW STYLE ────────────────────────────────────────────────────────
       0 CLOUD  the original emission/absorption integral.
       1 SOLID  a bounded plateau: opacity is a smooth band about the iso level, so turning EXPOSURE up moves the
                surface inward instead of filling the box — the blob has an asymptotic limit and never glows the
                whole field.  Shaded by the density gradient, so it reads as a lit surface.
       2 GRAIN  the same field drawn as noisy particles: a per-voxel hash keeps a fraction of the samples, so the
                cloud is stippled rather than smooth.  Bounded the same way.
       In every style the accumulated weight passes through a SATURATION KNEE w ↦ w/(1+kw), which is what makes
       the limit asymptotic: as exposure → ∞ the opacity of a step tends to a finite ceiling, not to 1. */
    let style = u32(V.p3.x);
    let knee = max(V.p3.w, 1e-4);
    var wEff = w / (1.0 + knee * w);                       // the bounded transfer: wEff < 1/knee always
    if (style == 1u) {
      let iso = max(V.p3.y, 1e-6);
      let rho = dot(s, s) / rhoMax;
      let band = smoothstep(iso * 0.55, iso, rho) * (1.0 - smoothstep(iso * 6.0, iso * 14.0, rho));
      wEff = band * 2.2;
      if (band > 0.02) {                                   // shade the plateau by its own gradient
        let e = 1.2 / f32(textureDimensions(psiTex).x);
        let gx = rhoAt(psiTex, samp, uvw + vec3<f32>(e, 0.0, 0.0)) - rhoAt(psiTex, samp, uvw - vec3<f32>(e, 0.0, 0.0));
        let gy = rhoAt(psiTex, samp, uvw + vec3<f32>(0.0, e, 0.0)) - rhoAt(psiTex, samp, uvw - vec3<f32>(0.0, e, 0.0));
        let gz = rhoAt(psiTex, samp, uvw + vec3<f32>(0.0, 0.0, e)) - rhoAt(psiTex, samp, uvw - vec3<f32>(0.0, 0.0, e));
        let n = normalize(vec3<f32>(gx, gy, gz) + vec3<f32>(1e-9));
        let lit = 0.35 + 0.65 * abs(dot(n, normalize(V.fwd.xyz + vec3<f32>(0.35, 0.2, 0.5))));
        c = c * lit;
      }
    } else if (style == 2u) {
      let keep = clamp(V.p3.z, 0.0, 1.0);
      let cell = floor(uvw * 96.0 + vec3<f32>(V.p0.w * 7.0));
      if (hash3(cell) > keep) { wEff = 0.0; } else { wEff = wEff * (1.0 / max(keep, 0.02)); }
    }
    let a = 1.0 - exp(-wEff * sigma * stepN * 4.0);
    col += (1.0 - alpha) * a * c;
    alpha += (1.0 - alpha) * a;
    if (alpha > 0.985) { break; }
    t += ds;
  }
  let o = col + bg * (1.0 - alpha);
  return vec4<f32>(o, 1.0);
}`;

const LINE_WGSL = /* wgsl */`
struct U { vp: mat4x4<f32> };
@group(0) @binding(0) var<uniform> U0: U;
struct VSOut { @builtin(position) pos: vec4<f32>, @location(0) col: vec4<f32> };
@vertex fn vs(@location(0) p: vec3<f32>, @location(1) c: vec4<f32>) -> VSOut {
  var o: VSOut; o.pos = U0.vp * vec4<f32>(p, 1.0); o.col = c; return o;
}
@fragment fn fs(in: VSOut) -> @location(0) vec4<f32> { return in.col; }`;

/* ── small mat4 helpers (column-major, as WGSL reads them) ───────────────── */
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, far * nf, -1, 0, 0, far * near * nf, 0]);
}
function lookAt(eye, center, up) {
  const zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
  let len = Math.hypot(zx, zy, zz); const z = [zx / len, zy / len, zz / len];
  const xx = up[1] * z[2] - up[2] * z[1], xy = up[2] * z[0] - up[0] * z[2], xz = up[0] * z[1] - up[1] * z[0];
  len = Math.hypot(xx, xy, xz); const x = [xx / len, xy / len, xz / len];
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
    -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]), -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]), -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]), 1]);
}
function mul4(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; }
  return o;
}
export function cameraBasis(obs) {
  const cp = Math.cos(obs.pitch), sp = Math.sin(obs.pitch), cy = Math.cos(obs.yaw), sy = Math.sin(obs.yaw);
  const dir = [cp * cy, cp * sy, sp];                       // z is UP (the quantization axis)
  const fwd = [-dir[0], -dir[1], -dir[2]];
  const up0 = Math.abs(sp) > 0.999 ? [-cy, -sy, 0] : [0, 0, 1];
  let rx = fwd[1] * up0[2] - fwd[2] * up0[1], ry = fwd[2] * up0[0] - fwd[0] * up0[2], rz = fwd[0] * up0[1] - fwd[1] * up0[0];
  const rl = Math.hypot(rx, ry, rz); rx /= rl; ry /= rl; rz /= rl;
  const up = [ry * fwd[2] - rz * fwd[1], rz * fwd[0] - rx * fwd[2], rx * fwd[1] - ry * fwd[0]];
  return { dir, fwd, right: [rx, ry, rz], up };
}
function f16(h) {
  const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
  if (e === 0) return s * Math.pow(2, -14) * (f / 1024);
  if (e === 31) return f ? NaN : s * Infinity;
  return s * Math.pow(2, e - 15) * (1 + f / 1024);
}

/** pack the active modes into the kernel's record layout */
export function packModes(modes) {
  const buf = new Float32Array(MAX_MODES * MODE_BYTES / 4);
  const count = Math.min(modes.length, MAX_MODES);
  for (let i = 0; i < count; i++) {
    const { table: T, re, im } = modes[i];
    const o = i * 24;
    buf[o] = T.n; buf[o + 1] = T.l; buf[o + 2] = T.am; buf[o + 3] = T.m;
    let cre = re, cim = im;
    if (T.phase) { cre = re * T.phase.re - im * T.phase.im; cim = re * T.phase.im + im * T.phase.re; }   // momentum tables carry (−i)^l
    buf[o + 4] = cre; buf[o + 5] = cim; buf[o + 6] = T.norm; buf[o + 7] = 0;
    for (let j = 0; j < 6; j++) { buf[o + 8 + j] = T.lag[j]; buf[o + 16 + j] = T.leg[j]; }
  }
  return { buf, count };
}
const tableCache = new Map();
export function tableFor(s) {
  let T = tableCache.get(s.id);
  if (!T) { T = modeTable(s.n, s.l, s.m); tableCache.set(s.id, T); }
  return T;
}

export async function createField(canvas, opts = {}) {
  const out = { ok: false, error: null, adapterInfo: null, canvas };
  if (!navigator.gpu) { out.error = 'navigator.gpu is absent — WebGPU is not enabled in this browser'; return out; }
  let adapter, device;
  try {
    adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) { out.error = 'no WebGPU adapter'; return out; }
    device = await adapter.requestDevice();
  } catch (e) { out.error = 'WebGPU device request failed: ' + (e && e.message || e); return out; }
  try { const info = adapter.info || (adapter.requestAdapterInfo && await adapter.requestAdapterInfo()); out.adapterInfo = info ? { vendor: info.vendor, architecture: info.architecture, device: info.device, description: info.description } : null; } catch (_) {}
  device.addEventListener('uncapturederror', (e) => { out.lastGpuError = String(e.error && e.error.message || e.error); if (opts.onError) opts.onError(out.lastGpuError); });
  device.lost.then((info) => { out.ok = false; out.error = 'device lost: ' + info.message; if (opts.onLost) opts.onLost(info); });

  const format = navigator.gpu.getPreferredCanvasFormat();
  const ctx = canvas.getContext('webgpu');
  ctx.configure({ device, format, alphaMode: 'opaque' });

  const computeModule = device.createShaderModule({ code: COMPUTE_WGSL });
  const renderModule = device.createShaderModule({ code: RENDER_WGSL });
  const lineModule = device.createShaderModule({ code: LINE_WGSL });
  /* compile messages are kept, never swallowed: a broken shader must say where */
  out.shaderMessages = [];
  for (const [name, m] of [['compute', computeModule], ['render', renderModule], ['line', lineModule]]) {
    try { const info = await m.getCompilationInfo(); for (const msg of info.messages) out.shaderMessages.push({ shader: name, type: msg.type, line: msg.lineNum, col: msg.linePos, text: msg.message }); } catch (_) {}
  }
  if (out.shaderMessages.some((m) => m.type === 'error')) { out.error = 'WGSL compile error: ' + JSON.stringify(out.shaderMessages.filter((m) => m.type === 'error')); return out; }
  const computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: computeModule, entryPoint: 'main' } });
  /* EXPLICIT layouts: an 'auto' layout belongs to one pipeline, and the readback path
     renders the same scene through a second pipeline (rgba8unorm) with the same bind groups. */
  const renderBGL = device.createBindGroupLayout({ entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '3d' } },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '3d' } },
    { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
    { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
    { binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }] });
  const renderLayout = device.createPipelineLayout({ bindGroupLayouts: [renderBGL] });
  const lineBGL = device.createBindGroupLayout({ entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }] });
  const lineLayout = device.createPipelineLayout({ bindGroupLayouts: [lineBGL] });
  const makeRenderPipeline = (fmt) => device.createRenderPipeline({ layout: renderLayout, vertex: { module: renderModule, entryPoint: 'vs' }, fragment: { module: renderModule, entryPoint: 'fs', targets: [{ format: fmt }] }, primitive: { topology: 'triangle-list' } });
  const renderPipeline = makeRenderPipeline(format);
  const makeLinePipeline = (fmt) => device.createRenderPipeline({
    layout: lineLayout,
    vertex: { module: lineModule, entryPoint: 'vs', buffers: [{ arrayStride: 28, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }, { shaderLocation: 1, offset: 12, format: 'float32x4' }] }] },
    fragment: { module: lineModule, entryPoint: 'fs', targets: [{ format: fmt, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } } }] },
    primitive: { topology: 'line-list' }
  });
  const linePipeline = makeLinePipeline(format);

  const paramsBuf = [0, 1].map(() => device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }));
  const modesBuf = [0, 1].map(() => device.createBuffer({ size: MAX_MODES * MODE_BYTES, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }));
  const statsBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
  const viewBuf = device.createBuffer({ size: 8 * 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const vpBuf = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  /* the phase PALETTE: 256 RGBA colours around the complex plane (see palette.js) */
  const palBuf = device.createBuffer({ size: 256 * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  { const init = new Float32Array(256 * 4); for (let i = 0; i < 256; i++) { init[i * 4] = 1; init[i * 4 + 1] = 1; init[i * 4 + 2] = 1; init[i * 4 + 3] = 1; } device.queue.writeBuffer(palBuf, 0, init); }
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge', addressModeW: 'clamp-to-edge' });
  const lineVerts = 64;
  const lineBuf = device.createBuffer({ size: lineVerts * 28, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  const lineBind = device.createBindGroup({ layout: lineBGL, entries: [{ binding: 0, resource: { buffer: vpBuf } }] });

  let res = 0, psiTex = null, refTex = null, computeBind = null, renderBind = null;
  let half = 7, space = 0, generation = 0, refGeneration = -1, refValid = false;
  const stats = { reconstructs: 0, presents: 0, lastEncodeMs: 0, lastReconstructWall: 0, resolution: 0, modesRendered: 0, generation: 0 };

  function setResolution(n) {
    if (n === res) return;
    res = n;
    if (psiTex) psiTex.destroy(); if (refTex) refTex.destroy();
    const mk = () => device.createTexture({ size: [n, n, n], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC });
    psiTex = mk(); refTex = mk();
    computeBind = [psiTex, refTex].map((tex, i) => device.createBindGroup({ layout: computePipeline.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: paramsBuf[i] } }, { binding: 1, resource: { buffer: modesBuf[i] } },
      { binding: 2, resource: tex.createView({ dimension: '3d' }) }, { binding: 3, resource: { buffer: statsBuf } }] }));
    renderBind = device.createBindGroup({ layout: renderBGL, entries: [
      { binding: 0, resource: { buffer: viewBuf } }, { binding: 1, resource: psiTex.createView({ dimension: '3d' }) },
      { binding: 2, resource: refTex.createView({ dimension: '3d' }) }, { binding: 3, resource: sampler }, { binding: 4, resource: { buffer: statsBuf } },
      { binding: 5, resource: { buffer: palBuf } }] });
    refValid = false; stats.resolution = n;
  }
  setResolution(opts.resolution || 96);

  function encodeCompute(enc, slot, modes, tw) {
    const { buf, count } = packModes(modes);
    device.queue.writeBuffer(modesBuf[slot], 0, buf);
    const p = new ArrayBuffer(32); const u = new Uint32Array(p), f = new Float32Array(p);
    u[0] = res; u[1] = count; u[2] = slot; u[3] = space; f[4] = half;
    device.queue.writeBuffer(paramsBuf[slot], 0, p);
    device.queue.writeBuffer(statsBuf, slot * 4, new Uint32Array([0]));
    const pass = enc.beginComputePass(tw ? { timestampWrites: tw } : {});
    pass.setPipeline(computePipeline); pass.setBindGroup(0, computeBind[slot]);
    const g = Math.ceil(res / 4); pass.dispatchWorkgroups(g, g, g);
    pass.end();
    return count;
  }
  function writeView(obs, mat, w, h) {
    const B = cameraBasis(obs);
    const D = obs.dist * half;
    const cam = [B.dir[0] * D, B.dir[1] * D, B.dir[2] * D];
    const tanH = Math.tan((obs.fov || 0.6) / 2), aspect = w / h;
    const v = new Float32Array(32);
    v.set([cam[0], cam[1], cam[2], half], 0);
    v.set([B.right[0], B.right[1], B.right[2], tanH * aspect], 4);
    v.set([B.up[0], B.up[1], B.up[2], tanH], 8);
    v.set([B.fwd[0], B.fwd[1], B.fwd[2], mat.steps || 160], 12);
    v.set([mat.view | 0, mat.exposure, mat.softness, (stats.presents % 97) / 97], 16);
    v.set([mat.slice ? mat.slice.mode | 0 : 0, mat.slice ? mat.slice.axis | 0 : 2, mat.slice ? mat.slice.pos : 0, mat.slice ? mat.slice.thick : 0.03], 20);
    v.set([mat.hueShift || 0, mat.invert ? 1 : 0, mat.paletteOn ? 1 : 0, 0], 24);
    v.set([mat.style | 0, mat.iso === undefined ? 0.06 : mat.iso, mat.grain === undefined ? 0.35 : mat.grain,
      mat.knee === undefined ? 0.6 : mat.knee], 28);
    device.queue.writeBuffer(viewBuf, 0, v);
    const vp = mul4(perspective(obs.fov || 0.6, aspect, 0.05 * half, 20 * half), lookAt(cam, [0, 0, 0], B.up));
    device.queue.writeBuffer(vpBuf, 0, vp);
    return cam;
  }
  function writeLines(mat) {
    const h = half, v = [];
    const push = (a, b, c) => { v.push(a[0], a[1], a[2], c[0], c[1], c[2], c[3], b[0], b[1], b[2], c[0], c[1], c[2], c[3]); };
    const boxC = [1, 1, 1, 0.13];
    const corners = [[-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h], [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (const [a, b] of edges) push(corners[a], corners[b], boxC);
    push([0, 0, 0], [0.6 * h, 0, 0], [1.0, 0.45, 0.35, 0.45]);   // x
    push([0, 0, 0], [0, 0.6 * h, 0], [0.45, 1.0, 0.5, 0.45]);    // y
    push([0, 0, 0], [0, 0, 0.6 * h], [0.45, 0.65, 1.0, 0.6]);    // z (quantization axis)
    let n = 15;
    if (mat.slice && mat.slice.mode) {
      const ax = mat.slice.axis | 0, s = mat.slice.pos * h, c = [1, 0.85, 0.4, 0.55];
      const q = (u, w) => { const p = [0, 0, 0]; p[ax] = s; p[(ax + 1) % 3] = u; p[(ax + 2) % 3] = w; return p; };
      push(q(-h, -h), q(h, -h), c); push(q(h, -h), q(h, h), c); push(q(h, h), q(-h, h), c); push(q(-h, h), q(-h, -h), c);
      n += 4;
    }
    device.queue.writeBuffer(lineBuf, 0, new Float32Array(v));
    return n * 2;
  }
  function encodeRender(enc, target, obs, mat, w, h, tw) {
    writeView(obs, mat, w, h);
    const nv = writeLines(mat);
    const desc = { colorAttachments: [{ view: target, loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store' }] };
    if (tw) desc.timestampWrites = tw;
    const pass = enc.beginRenderPass(desc);
    pass.setPipeline(renderPipeline); pass.setBindGroup(0, renderBind); pass.draw(3);
    if (mat.frame !== false) { pass.setPipeline(linePipeline); pass.setBindGroup(0, lineBind); pass.setVertexBuffer(0, lineBuf); pass.draw(nv); }
    pass.end();
  }

  /** ONE submission: optional reference capture, optional reconstruct, then present. */
  function frame({ modes = null, refModes = null, obs, mat }) {
    const t0 = performance.now();
    const enc = device.createCommandEncoder();
    if (refModes) { encodeCompute(enc, 1, refModes); refValid = true; refGeneration = generation + 1; }
    if (modes) { stats.modesRendered = encodeCompute(enc, 0, modes); generation++; stats.reconstructs++; stats.generation = generation; stats.lastReconstructWall = t0; }
    const w = canvas.width, h = canvas.height;
    if (w > 0 && h > 0) { encodeRender(enc, ctx.getCurrentTexture().createView(), obs, mat, w, h); stats.presents++; }
    device.queue.submit([enc.finish()]);
    stats.lastEncodeMs = performance.now() - t0;
  }

  /* ── readbacks (tests and diagnostics; never on the frame path) ───────── */
  async function readPixels(obs, mat, w = 320, h = 240) {
    const tex = device.createTexture({ size: [w, h], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
    if (!out._rp) { out._rp = makeRenderPipeline('rgba8unorm'); out._lp = makeLinePipeline('rgba8unorm'); }
    const rp = out._rp, lp = out._lp;
    const enc = device.createCommandEncoder();
    writeView(obs, mat, w, h); const nv = writeLines(mat);
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store' }] });
    pass.setPipeline(rp); pass.setBindGroup(0, renderBind); pass.draw(3);
    if (mat.frame !== false) { pass.setPipeline(lp); pass.setBindGroup(0, lineBind); pass.setVertexBuffer(0, lineBuf); pass.draw(nv); }
    pass.end();
    const bpr = Math.ceil(w * 4 / 256) * 256;
    const buf = device.createBuffer({ size: bpr * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    enc.copyTextureToBuffer({ texture: tex }, { buffer: buf, bytesPerRow: bpr }, [w, h]);
    device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const px = new Uint8Array(buf.getMappedRange());
    let nonBlack = 0, lum = 0, bright = 0, hue = 0, hsh = 2166136261 >>> 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = y * bpr + x * 4, r = px[o], g = px[o + 1], b = px[o + 2];
      const L = (r + g + b) / 3; lum += L; if (L > 24) nonBlack++; if (L > 128) bright++;
      hue += Math.abs(r - b);
      hsh = Math.imul(hsh ^ (r + (g << 8) + (b << 16)), 16777619) >>> 0;
    }
    buf.unmap(); buf.destroy(); tex.destroy();
    return { w, h, total: w * h, nonBlack, bright, meanLum: lum / (w * h), meanChroma: hue / (w * h), hash: hsh.toString(16) };
  }
  async function sampleVoxel(i, j, k) {
    const buf = device.createBuffer({ size: 256, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const enc = device.createCommandEncoder();
    enc.copyTextureToBuffer({ texture: psiTex, origin: [i, j, k] }, { buffer: buf, bytesPerRow: 256, rowsPerImage: 1 }, [1, 1, 1]);
    device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const u = new Uint16Array(buf.getMappedRange());
    const re = f16(u[0]), im = f16(u[1]);
    buf.unmap(); buf.destroy();
    const x = (i + 0.5) / res * 2 * half - half, y = (j + 0.5) / res * 2 * half - half, z = (k + 0.5) / res * 2 * half - half;
    return { re, im, x, y, z };
  }
  /** Σ|ψ|² dV over the grid, the max density, and a hash — the whole cache read back */
  async function fieldDigest() {
    const bpr = res * 8, size = bpr * res * res;
    const buf = device.createBuffer({ size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const enc = device.createCommandEncoder();
    enc.copyTextureToBuffer({ texture: psiTex }, { buffer: buf, bytesPerRow: bpr, rowsPerImage: res }, [res, res, res]);
    device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const u = new Uint16Array(buf.getMappedRange());
    const dV = Math.pow(2 * half / res, 3);
    let integral = 0, maxRho = 0, hsh = 2166136261 >>> 0, nan = 0;
    for (let v = 0; v < res * res * res; v++) {
      const re = f16(u[v * 4]), im = f16(u[v * 4 + 1]);
      if (Number.isNaN(re) || Number.isNaN(im)) { nan++; continue; }
      const rho = re * re + im * im; integral += rho; if (rho > maxRho) maxRho = rho;
      hsh = (Math.imul(hsh ^ u[v * 4], 16777619) ^ u[v * 4 + 1]) >>> 0;
    }
    buf.unmap(); buf.destroy();
    return { integral: integral * dV, maxRho, hash: hsh.toString(16), nan, res, half, generation };
  }
  async function readStats() {
    const buf = device.createBuffer({ size: 16, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const enc = device.createCommandEncoder(); enc.copyBufferToBuffer(statsBuf, 0, buf, 0, 16); device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ); const f = new Float32Array(buf.getMappedRange().slice(0)); buf.unmap(); buf.destroy();
    return { rhoMax: f[0], refMax: f[1] };
  }

  /**
   * GPU THROUGHPUT, the honest number this browser can give (Firefox zeroes timestamp queries and
   * polls completion at ~100 ms): encode n frames back-to-back into an offscreen target of the
   * canvas' size, wait once for the GPU, and divide.  Returns ms per frame for
   * reconstruct+present, reconstruct only, and present only.
   */
  async function throughput({ modes, obs, mat, n = 60 }) {
    const w = canvas.width, h = canvas.height;
    const tex = device.createTexture({ size: [w, h], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT });
    if (!out._rp) { out._rp = makeRenderPipeline('rgba8unorm'); out._lp = makeLinePipeline('rgba8unorm'); }
    const view = tex.createView();
    const run = async (doCompute, doRender) => {
      await device.queue.onSubmittedWorkDone();
      const t0 = performance.now();
      const enc = device.createCommandEncoder();
      for (let i = 0; i < n; i++) {
        if (doCompute) encodeCompute(enc, 0, modes);
        if (doRender) {
          writeView(obs, mat, w, h); const nv = writeLines(mat);
          const pass = enc.beginRenderPass({ colorAttachments: [{ view, loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store' }] });
          pass.setPipeline(out._rp); pass.setBindGroup(0, renderBind); pass.draw(3);
          if (mat.frame !== false) { pass.setPipeline(out._lp); pass.setBindGroup(0, lineBind); pass.setVertexBuffer(0, lineBuf); pass.draw(nv); }
          pass.end();
        }
      }
      device.queue.submit([enc.finish()]);
      await device.queue.onSubmittedWorkDone();
      return (performance.now() - t0) / n;
    };
    const both = await run(true, true), compute = await run(true, false), render = await run(false, true);
    tex.destroy();
    return { frameMs: +both.toFixed(3), reconstructMs: +compute.toFixed(3), presentMs: +render.toFixed(3), n, w, h, res, modes: modes.length, steps: mat.steps };
  }
  /* live getters (Object.assign would have copied their values once — and did, until B10 caught it) */
  Object.defineProperties(out, {
    resolution: { get: () => res, enumerable: true }, half: { get: () => half, enumerable: true }, space: { get: () => space, enumerable: true },
    generation: { get: () => generation, enumerable: true }, refValid: { get: () => refValid, enumerable: true } });
  Object.assign(out, {
    ok: true, device, adapter, format, stats,
    frame, throughput, readPixels, sampleVoxel, fieldDigest, readStats,
    setResolution,
    setDomain(h) { half = h; },
    /** 0 = position space ψ(x), 1 = momentum space φ(p): the grid then holds the Fourier transform, exactly */
    setSpace(s) { s = s | 0; if (s !== space) { space = s; refValid = false; } },
    /** upload a 256×RGBA phase palette (Float32Array(1024), values 0..1) — an OBSERVER product: ψ is untouched */
    setPalette(lut) { device.queue.writeBuffer(palBuf, 0, lut instanceof Float32Array ? lut : new Float32Array(lut)); },
    resize(scale) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * (scale || 1);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
      return false;
    }
  });
  return out;
}
