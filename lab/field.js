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

export const VIEW = { density: 0, phase: 1, real: 2, imag: 3, diff: 4, reim: 5 };
export const VIEW_NAMES = ['density', 'phase', 'real', 'imag', 'diff', 'reim'];
/** how the same observable is DRAWN: a cloud, a bounded plateau (lit surface), or noisy particles */
export const STYLE = { cloud: 0, solid: 1, grain: 2, signed: 3, bands: 4 };
export const STYLE_NAMES = ['cloud', 'solid', 'grain', 'signed', 'bands'];
export const SLICE = { off: 0, clip: 1, slab: 2 };
export const MAX_MODES = 320;                                 // the whole 91-state register fits (a gas packet populates every m)
const MODE_BYTES = 112;                                  // 7 vec4: nlm, c, lag0, lag1, leg0, leg1, ctr

const COMPUTE_WGSL = /* wgsl */`
struct Mode { nlm: vec4<f32>, c: vec4<f32>, lag0: vec4<f32>, lag1: vec4<f32>, leg0: vec4<f32>, leg1: vec4<f32>, ctr: vec4<f32> };   // ctr: the mode's own centre (a molecule puts orbitals on its nuclei)
struct Params { n: u32, count: u32, slot: u32, space: u32, half: f32, p1: f32, p2: f32, p3: f32 };   // space: 0 position (hydrogen), 1 momentum (hydrogen), 2 oscillator, 3 the spherical well, 4 two-electron conditional, 5 an incoherent sum of two coherent groups (a one-electron DENSITY)
@group(0) @binding(0) var<uniform> P: Params;
@group(0) @binding(1) var<storage, read> modes: array<Mode>;
@group(0) @binding(2) var outTex: texture_storage_3d<rgba16float, write>;
@group(0) @binding(3) var<storage, read_write> stats: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read> radial: array<f32>;   // space 6: tabulated radial functions, 256 samples per (n_r, l) row (QUARKONIUM)
var<workgroup> wmax: atomic<u32>;

fn ipow(x: f32, k: u32) -> f32 { var r = 1.0; for (var i = 0u; i < k; i++) { r *= x; } return r; }
/* the spherical Bessel j_l(x), l ≤ 6, by Miller's downward recurrence normalised on j_0 — stable at every x > 0 */
fn sphj(l: u32, x: f32) -> f32 {
  if (x < 1e-5) { if (l == 0u) { return 1.0; } return 0.0; }
  let j0 = sin(x) / x;
  if (l == 0u) { return j0; }
  var b = 0.0; var a = 1e-30; var out = 0.0;
  let start = l + 24u + u32(x);
  for (var m = start; m >= 1u; m--) {
    let c = f32(2u * m + 1u) / x * a - b; b = a; a = c;
    if (m - 1u == l) { out = c; }
    if (abs(a) > 1e20) { a *= 1e-20; b *= 1e-20; out *= 1e-20; }
  }
  let j1 = sin(x) / (x * x) - cos(x) / x;
  return select(out * j0 / a, out * j1 / b, abs(j0) < 1e-4);   // normalise on j₁ where j₀ vanishes (x = nπ)
}

/* P_l(x) by Bonnet's recurrence — for the AXIAL GAS records (m = 0, l up to 15), where the six-coefficient table stops at l = 5 */
fn legP(l: u32, x: f32) -> f32 {
  if (l == 0u) { return 1.0; }
  var p0 = 1.0; var p1 = x;
  for (var k = 2u; k <= l; k++) { let p2 = (f32(2u * k - 1u) * x * p1 - f32(k - 1u) * p0) / f32(k); p0 = p1; p1 = p2; }
  return p1;
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_index) lid: u32) {
  if (lid == 0u) { atomicStore(&wmax, 0u); }
  workgroupBarrier();
  var dens = 0.0;
  if (all(gid < vec3<u32>(P.n, P.n, P.n))) {
    let pos = (vec3<f32>(gid) + vec3<f32>(0.5)) / f32(P.n) * (2.0 * P.half) - vec3<f32>(P.half);
    var psi = vec2<f32>(0.0, 0.0);
    var psiB = vec2<f32>(0.0, 0.0);                          // space 5: a second COHERENT group; the two are summed incoherently
    for (var a = 0u; a < P.count; a++) {
      let M = modes[a];
      let q = pos - M.ctr.xyz;                               // geometry relative to the mode's centre
      let r = length(q);
      let ct = select(q.z / max(r, 1e-12), 1.0, r < 1e-9);
      let st = sqrt(max(0.0, 1.0 - ct * ct));
      let phi = atan2(q.y, q.x);
      let n = M.nlm.x; let l = u32(M.nlm.y); let am = u32(M.nlm.z); let m = M.nlm.w;
      let D = M.leg0.x + ct * (M.leg0.y + ct * (M.leg0.z + ct * (M.leg0.w + ct * (M.leg1.x + ct * M.leg1.y))));
      var f = 0.0;
      if (P.space == 0u || P.space == 5u) {
        /* POSITION  ψ = norm · e^{−ρ/2} ρ^l L(ρ) · Y,  ρ = 2r/n  (L = Laguerre) */
        let rho = 2.0 * r / n;
        let L = M.lag0.x + rho * (M.lag0.y + rho * (M.lag0.z + rho * (M.lag0.w + rho * (M.lag1.x + rho * M.lag1.y))));
        f = M.c.z * exp(-0.5 * rho) * ipow(rho, l) * L * ipow(st, am) * D;
      } else if (P.space == 4u) {
        /* TWO ELECTRONS: the conditional amplitude ψ(x | x₁) of a Hylleraas term  c · s^a t^b u^c e^{−ζs},
           s = r₁ + r₂, t = r₁ − r₂, u = |x − x₁|; nlm = (a, b, c, ζ), ctr = x₁.  Here r (= |q|) is u. */
        let r1 = length(M.ctr.xyz); let r2 = length(pos); let ss = r1 + r2; let tt = r1 - r2;
        f = M.c.z * ipow(ss, u32(M.nlm.x)) * ipow(tt, u32(M.nlm.y)) * ipow(r, u32(M.nlm.z)) * exp(-M.nlm.w * ss);
      } else if (P.space == 3u) {
        /* THE WELL  ψ = norm · j_l(k r) · Y inside r < a, 0 outside: lag0 = (k, a, …); the wall is the envelope */
        let kk = M.lag0.x; let aa = M.lag0.y;
        let Dw = select(D, legP(l, ct), M.lag0.z > 0.5);        // lag0.z = 1: the angular part by recurrence (the axial gas)
        f = select(0.0, M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw, r < aa);
      } else if (P.space == 6u) {
        /* QUARKONIUM (Cornell, NUMERICAL): R(r) read from its tabulated row, linear interpolation; lag0 = (row, 1/r_tab, r_tab) */
        let row = u32(M.lag0.x); let x = clamp(r * M.lag0.y, 0.0, 1.0) * 255.0;
        let i0 = min(u32(floor(x)), 254u); let fr = x - f32(i0);
        let R = mix(radial[row * 256u + i0], radial[row * 256u + i0 + 1u], fr);
        f = select(0.0, M.c.z * R * ipow(st, am) * D, r < M.lag0.z);
      } else if (P.space == 2u) {
        /* OSCILLATOR  ψ = norm · r^l L(t) e^{−t/2} · Y,  t = r²  (L = the half-integer Laguerre; the same record serves
           momentum space, whose (−i)^N phase is folded into c on the CPU) */
        let t = r * r;
        let L = M.lag0.x + t * (M.lag0.y + t * (M.lag0.z + t * (M.lag0.w + t * (M.lag1.x + t * M.lag1.y))));
        f = M.c.z * ipow(r, l) * L * exp(-0.5 * t) * ipow(st, am) * D;
      } else {
        /* MOMENTUM  φ = norm · t^{l/2} P(t) (1+t)^{−(n+1)} · Y,  t = n²p²  (P = the Podolsky–Pauling numerator;
           the (−i)^l phase is folded into c on the CPU).  Same record, different envelope. */
        let q = n * r; let t = q * q;
        let L = M.lag0.x + t * (M.lag0.y + t * (M.lag0.z + t * (M.lag0.w + t * (M.lag1.x + t * M.lag1.y))));
        f = M.c.z * ipow(q, l) * L / pow(1.0 + t, M.c.w) * ipow(st, am) * D;     // c.w = the exponent n+1 (kept integer when the ρ-scale is n/Z)
      }
      let mm = select(m, 0.0, P.space == 4u);                // the pair branch keeps ζ in the m slot: no azimuthal phase
      let e = vec2<f32>(cos(mm * phi), sin(mm * phi));
      let ce = vec2<f32>(M.c.x * e.x - M.c.y * e.y, M.c.x * e.y + M.c.y * e.x);
      if (P.space == 5u && M.ctr.w > 0.5) { psiB += f * ce; } else { psi += f * ce; }
    }
    if (P.space == 5u) { psi = vec2<f32>(sqrt(dot(psi, psi) + dot(psiB, psiB)), 0.0); }   // ρ = |group 0|² + |group 1|², stored as √ρ
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
  p4: vec4<f32>,     // PREVIEW BOOST: k (xyz) and on (w) — while the bow is drawn the field is shown multiplied by e^{ik·x}, the exact boosted state
  p5: vec4<f32>,     // SURFACE: the stage background colour (xyz) and the output gamma (w) — the theme lives here
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
/* the lit fraction at a point, from the density gradient (SOLID and SIGNED read as lit surfaces) */
fn litAt(uvw: vec3<f32>) -> f32 {
  let e = 1.2 / f32(textureDimensions(psiTex).x);
  let gx = rhoAt(psiTex, samp, uvw + vec3<f32>(e, 0.0, 0.0)) - rhoAt(psiTex, samp, uvw - vec3<f32>(e, 0.0, 0.0));
  let gy = rhoAt(psiTex, samp, uvw + vec3<f32>(0.0, e, 0.0)) - rhoAt(psiTex, samp, uvw - vec3<f32>(0.0, e, 0.0));
  let gz = rhoAt(psiTex, samp, uvw + vec3<f32>(0.0, 0.0, e)) - rhoAt(psiTex, samp, uvw - vec3<f32>(0.0, 0.0, e));
  let n = normalize(vec3<f32>(gx, gy, gz) + vec3<f32>(1e-9));
  return abs(dot(n, normalize(V.fwd.xyz + vec3<f32>(0.35, 0.2, 0.5))));
}
/* OVERLAY shading: the dark side is the colour burnt into itself (c², darker but MORE saturated), the lit side is the
   colour lifted toward white — never a grey multiplied in, which is what read as "a dark grey cast on the colours" */
fn overlay(c: vec3<f32>, l: f32) -> vec3<f32> { return mix(c * c, c + (1.0 - c) * 0.35, smoothstep(0.0, 1.0, l)); }

@fragment fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let half = V.cam.w;
  let ro = V.cam.xyz;
  let rd = normalize(V.fwd.xyz + in.uv.x * V.right.w * V.right.xyz + in.uv.y * V.up.w * V.up.xyz);
  let bg = mix(V.p5.xyz * 0.82, V.p5.xyz * 1.25, in.uv.y * 0.5 + 0.5);     // the theme's stage, with the old subtle vertical gradient
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
    var s = textureSampleLevel(psiTex, samp, uvw, 0.0).rg;
    if (V.p4.w > 0.5) { let ph = dot(V.p4.xyz, p); let cs = cos(ph); let sn = sin(ph); s = vec2<f32>(s.x * cs - s.y * sn, s.x * sn + s.y * cs); }   // the bow: e^{ik·x}ψ, exactly (the density is unchanged, the phase carries the fringes)
    var w = 0.0; var c = vec3<f32>(0.0);
    if (mode == 0u) {
      let rho = dot(s, s) / rhoMax;
      w = pow(rho, soft);
      c = mix(vec3<f32>(0.08, 0.45, 0.62), vec3<f32>(1.0, 1.0, 1.0), pow(rho, 0.45));
    } else if (mode == 1u) {
      let rho = dot(s, s) / rhoMax;
      w = pow(rho, soft);
      let h = select(0.0, atan2(s.y, s.x), dot(s, s) > 1e-30) / 6.283185307 + 0.5 + V.p2.x;   // atan2(0,0) is NaN on Metal (Safari): a zero sample has no phase, give it 0
      if (V.p2.z > 0.5) {
        let u = fract(h) * 256.0;
        let i0 = u32(floor(u)) % 256u; let i1 = (i0 + 1u) % 256u;
        c = mix(pal[i0].rgb, pal[i1].rgb, fract(u));       // the user's palette, linearly interpolated and wrapping
      } else { c = hsv(h, 0.85, 1.0); }
    } else if (mode == 2u || mode == 3u) {
      var v = 0.0; if (mode == 2u) { v = s.x / ampMax; } else { v = s.y / ampMax; }
      w = pow(v * v, soft);
      if (V.p2.z > 0.5) {                                  // the PALETTE, polar: + and − take opposite points of the wheel (¼ and ¾ turn, shifted by HUE)
        let i0 = u32(fract(0.25 + V.p2.x) * 256.0) % 256u; let i1 = u32(fract(0.75 + V.p2.x) * 256.0) % 256u;
        c = select(pal[i1].rgb, pal[i0].rgb, v > 0.0);
      } else { c = select(vec3<f32>(0.22, 0.50, 1.0), vec3<f32>(1.0, 0.58, 0.16), v > 0.0); }
    } else if (mode == 5u) {
      /* Re + Im SUPERPOSED — a heuristic placement (two pictures in one volume, not a joint observable): Re keeps its
         orange/blue pair, Im takes green/violet; each part's own transfer, summed, colour-weighted by the parts */
      let vr = s.x / ampMax; let vi = s.y / ampMax;
      let wr = pow(vr * vr, soft); let wi = pow(vi * vi, soft);
      let cr = select(vec3<f32>(0.22, 0.50, 1.0), vec3<f32>(1.0, 0.58, 0.16), vr > 0.0);
      let ci = select(vec3<f32>(0.55, 0.20, 0.85), vec3<f32>(0.25, 0.85, 0.35), vi > 0.0);
      w = wr + wi;
      c = (wr * cr + wi * ci) / max(w, 1e-9);
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
      if (band > 0.02) { c = overlay(c, litAt(uvw)); }   // shade the plateau by its own gradient, as an overlay
    } else if (style == 3u) {
      /* SIGNED: the wave as flat ±1 lobes — opacity saturates just above the nodal surface, so a real orbital reads as
         solid positive and negative regions meeting at a hard node (Josh's "the orbital becomes plus or minus 1") */
      let sv = select(s.y, s.x, mode == 2u) / ampMax;
      let mag = select(sqrt(dot(s, s) / rhoMax), abs(sv), mode == 2u || mode == 3u);
      let iso = max(V.p3.y, 1e-6);
      wEff = smoothstep(iso * 1.5, iso * 5.0, mag) * 2.2;
      if (wEff > 0.02) { c = overlay(c, litAt(uvw)); }
    } else if (style == 4u) {
      /* BANDS: the wave's own level lines — a cosine comb on |ψ| (or |Re ψ|, |Im ψ|), 2–16 bands set by the GRAIN
         knob; the stripes are where the amplitude crosses each level, an interference-fringe reading of the field */
      let sv = select(s.y, s.x, mode == 2u) / ampMax;
      let mag = select(dot(s, s) / rhoMax, abs(sv), mode == 2u || mode == 3u);
      let nb = 2.0 + 14.0 * clamp(V.p3.z, 0.0, 1.0);
      let band = 0.5 + 0.5 * cos(6.283185307 * nb * mag);
      wEff = wEff * pow(band, 3.0) * 2.0;
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
  var o = pow(max(col + bg * (1.0 - alpha), vec3<f32>(0.0)), vec3<f32>(1.0 / max(V.p5.w, 0.05)));   // output gamma (a SURFACE control)
  o = select(o, bg, o != o);                                                                          // a NaN anywhere on the ray would paint the pixel black on Metal: show the stage instead
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
const ORIGIN = [0, 0, 0], DEFAULT_BG = [0.028, 0.038, 0.058];
function perspective(fovy, aspect, near, far, out) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far), o = out || new Float32Array(16);
  o.fill(0); o[0] = f / aspect; o[5] = f; o[10] = far * nf; o[11] = -1; o[14] = far * near * nf;
  return o;
}
function lookAt(eye, center, up, out) {
  const zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
  let len = Math.hypot(zx, zy, zz); const z = [zx / len, zy / len, zz / len];
  const xx = up[1] * z[2] - up[2] * z[1], xy = up[2] * z[0] - up[0] * z[2], xz = up[0] * z[1] - up[1] * z[0];
  len = Math.hypot(xx, xy, xz); const x = [xx / len, xy / len, xz / len];
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  const o = out || new Float32Array(16);
  o[0] = x[0]; o[1] = y[0]; o[2] = z[0]; o[3] = 0; o[4] = x[1]; o[5] = y[1]; o[6] = z[1]; o[7] = 0; o[8] = x[2]; o[9] = y[2]; o[10] = z[2]; o[11] = 0;
  o[12] = -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]); o[13] = -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]); o[14] = -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]); o[15] = 1;
  return o;
}
function mul4(a, b, out) {
  const o = out || new Float32Array(16);
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

/** pack the active modes into the kernel's record layout — into ONE persistent buffer (wave 45: this was a fresh
    36 KB Float32Array per reconstruct, ≈ 2 MB/s of garbage at 60 Hz); the caller uploads only `count` records */
const PACK = new Float32Array(MAX_MODES * MODE_BYTES / 4);
export function packModes(modes) {
  const buf = PACK;
  const count = Math.min(modes.length, MAX_MODES);
  for (let i = 0; i < count; i++) {
    const { table: T, re, im, center } = modes[i];
    const o = i * 28;
    buf[o] = T.n; buf[o + 1] = T.l; buf[o + 2] = T.am; buf[o + 3] = T.m;
    let cre = re, cim = im;
    if (T.phase) { cre = re * T.phase.re - im * T.phase.im; cim = re * T.phase.im + im * T.phase.re; }   // momentum tables carry (−i)^l
    buf[o + 4] = cre; buf[o + 5] = cim; buf[o + 6] = T.norm; buf[o + 7] = T.expo !== undefined ? T.expo : T.n + 1;
    for (let j = 0; j < 6; j++) { buf[o + 8 + j] = T.lag[j]; buf[o + 16 + j] = T.leg[j]; }
    const cc = center || [0, 0, 0]; buf[o + 24] = cc[0]; buf[o + 25] = cc[1]; buf[o + 26] = cc[2]; buf[o + 27] = modes[i].group || 0;
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
  const radialBuf = device.createBuffer({ size: 40 * 256 * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });   // 36 rows in use
  const statsBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
  const viewBuf = device.createBuffer({ size: 10 * 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const vpBuf = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  /* the phase PALETTE: 256 RGBA colours around the complex plane (see palette.js) */
  const palBuf = device.createBuffer({ size: 256 * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  { const init = new Float32Array(256 * 4); for (let i = 0; i < 256; i++) { init[i * 4] = 1; init[i * 4 + 1] = 1; init[i * 4 + 2] = 1; init[i * 4 + 3] = 1; } device.queue.writeBuffer(palBuf, 0, init); }
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge', addressModeW: 'clamp-to-edge' });
  const lineVerts = 64;
  const lineBuf = device.createBuffer({ size: lineVerts * 28, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  const LINES = new Float32Array(lineVerts * 7);                   // the box, the axes and the slice frame, written in place each frame
  const lineBind = device.createBindGroup({ layout: lineBGL, entries: [{ binding: 0, resource: { buffer: vpBuf } }] });

  /* the per-frame scratch (wave 45): the frame path allocates nothing — the params block, the stats zero, the view block,
     the three matrices and the line vertices are written in place */
  const PARAMS = new ArrayBuffer(32), PARAMS_U = new Uint32Array(PARAMS), PARAMS_F = new Float32Array(PARAMS), ZERO_U32 = new Uint32Array([0]);
  const VIEW = new Float32Array(40), M_PERSP = new Float32Array(16), M_LOOK = new Float32Array(16), M_VP = new Float32Array(16);
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
      { binding: 2, resource: tex.createView({ dimension: '3d' }) }, { binding: 3, resource: { buffer: statsBuf } }, { binding: 4, resource: { buffer: radialBuf } }] }));
    renderBind = device.createBindGroup({ layout: renderBGL, entries: [
      { binding: 0, resource: { buffer: viewBuf } }, { binding: 1, resource: psiTex.createView({ dimension: '3d' }) },
      { binding: 2, resource: refTex.createView({ dimension: '3d' }) }, { binding: 3, resource: sampler }, { binding: 4, resource: { buffer: statsBuf } },
      { binding: 5, resource: { buffer: palBuf } }] });
    refValid = false; stats.resolution = n;
  }
  setResolution(opts.resolution || 96);

  function encodeCompute(enc, slot, modes, tw) {
    const { buf, count } = packModes(modes);
    device.queue.writeBuffer(modesBuf[slot], 0, buf, 0, Math.max(1, count) * (MODE_BYTES / 4));   // the records in use, not the 320-record buffer
    const u = PARAMS_U, f = PARAMS_F;                                                           // persistent (was an ArrayBuffer + two views per call)
    u[0] = res; u[1] = count; u[2] = slot; u[3] = space; f[4] = half;
    device.queue.writeBuffer(paramsBuf[slot], 0, PARAMS);
    device.queue.writeBuffer(statsBuf, slot * 4, ZERO_U32);
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
    const v = VIEW;
    v[0] = cam[0]; v[1] = cam[1]; v[2] = cam[2]; v[3] = half;
    v[4] = B.right[0]; v[5] = B.right[1]; v[6] = B.right[2]; v[7] = tanH * aspect;
    v[8] = B.up[0]; v[9] = B.up[1]; v[10] = B.up[2]; v[11] = tanH;
    v[12] = B.fwd[0]; v[13] = B.fwd[1]; v[14] = B.fwd[2]; v[15] = mat.steps || 160;
    v[16] = mat.view | 0; v[17] = mat.exposure; v[18] = mat.softness; v[19] = (stats.presents % 97) / 97;
    v[20] = mat.slice ? mat.slice.mode | 0 : 0; v[21] = mat.slice ? mat.slice.axis | 0 : 2; v[22] = mat.slice ? mat.slice.pos : 0; v[23] = mat.slice ? mat.slice.thick : 0.03;
    v[24] = mat.hueShift || 0; v[25] = mat.invert ? 1 : 0; v[26] = mat.paletteOn ? 1 : 0; v[27] = 0;
    v[28] = mat.style | 0; v[29] = mat.iso === undefined ? 0.06 : mat.iso; v[30] = mat.grain === undefined ? 0.35 : mat.grain; v[31] = mat.knee === undefined ? 0.6 : mat.knee;
    const bon = mat.boost && mat.boost.on, bk = bon ? mat.boost.k : null;
    v[32] = bon ? bk[0] : 0; v[33] = bon ? bk[1] : 0; v[34] = bon ? bk[2] : 0; v[35] = bon ? 1 : 0;
    const bgc = mat.bg || DEFAULT_BG;
    v[36] = bgc[0]; v[37] = bgc[1]; v[38] = bgc[2]; v[39] = mat.gamma === undefined ? 1 : mat.gamma;
    device.queue.writeBuffer(viewBuf, 0, v);
    perspective(obs.fov || 0.6, aspect, 0.05 * half, 20 * half, M_PERSP); lookAt(cam, ORIGIN, B.up, M_LOOK); mul4(M_PERSP, M_LOOK, M_VP);
    device.queue.writeBuffer(vpBuf, 0, M_VP);
    return cam;
  }
  /* THE FRAME'S INK (wave 48, Josh: "make the cube frame become black when in lightmode", "darkmode turns the xyz
     axis to a vivid CMY color").  The domain cube and the three axes are the only chrome the GPU draws, so they are
     the only chrome that cannot read a CSS token: rack.js hands the resolved theme down as mat.lightUI and the two
     palettes live here, one per theme.  DARK keeps the shipped box (white at .13 over a near-black stage) and takes
     the NEW axes; LIGHT takes the new near-black box and keeps the shipped warm/cool axes.  The light box's alpha is
     .42, not the dark box's .13: matched CONTRAST would be .14, but Josh asked for a line that READS black, and .42
     of #05080d over the #eef1f6 stage is one. */
  const FRAME_INK = {
    dark:  { box: [1, 1, 1, 0.13],          x: [0.0, 1.0, 1.0, 0.85],  y: [1.0, 0.0, 1.0, 0.85], z: [1.0, 1.0, 0.0, 0.9] },   // vivid CMY: x = cyan, y = magenta, z = yellow
    light: { box: [0.02, 0.03, 0.05, 0.42], x: [1.0, 0.45, 0.35, 0.45], y: [0.45, 1.0, 0.5, 0.45], z: [0.45, 0.65, 1.0, 0.6] },
  };
  function writeLines(mat) {
    const h = half, v = LINES; let k = 0;
    const push = (a, b, c) => { v[k++] = a[0]; v[k++] = a[1]; v[k++] = a[2]; v[k++] = c[0]; v[k++] = c[1]; v[k++] = c[2]; v[k++] = c[3]; v[k++] = b[0]; v[k++] = b[1]; v[k++] = b[2]; v[k++] = c[0]; v[k++] = c[1]; v[k++] = c[2]; v[k++] = c[3]; };
    const INK = mat.lightUI ? FRAME_INK.light : FRAME_INK.dark;
    const boxC = INK.box;
    const corners = [[-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h], [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (const [a, b] of edges) push(corners[a], corners[b], boxC);
    push([0, 0, 0], [0.6 * h, 0, 0], INK.x);   // x
    push([0, 0, 0], [0, 0.6 * h, 0], INK.y);   // y
    push([0, 0, 0], [0, 0, 0.6 * h], INK.z);   // z (quantization axis)
    let n = 15;
    if (mat.slice && mat.slice.mode) {
      const ax = mat.slice.axis | 0, s = mat.slice.pos * h, c = [1, 0.85, 0.4, 0.55];
      const q = (u, w) => { const p = [0, 0, 0]; p[ax] = s; p[(ax + 1) % 3] = u; p[(ax + 2) % 3] = w; return p; };
      push(q(-h, -h), q(h, -h), c); push(q(h, -h), q(h, h), c); push(q(h, h), q(-h, h), c); push(q(-h, h), q(-h, -h), c);
      n += 4;
    }
    device.queue.writeBuffer(lineBuf, 0, v, 0, k);
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
  /** the ink the LINE buffer is carrying right now — the box and the three axes, as written by the last writeLines.
      A diagnostic for the theme proof: the rendered pixel is a blend, this is the stroke itself. */
  function lineColors(mat) {
    writeLines(mat);
    const at = (i) => [LINES[i * 7 + 3], LINES[i * 7 + 4], LINES[i * 7 + 5], LINES[i * 7 + 6]];
    return { box: at(0), x: at(24), y: at(26), z: at(28) };      // 12 box edges = 24 vertices, then x, y, z
  }
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
  /** THE CHROME AS THE SCREEN GETS IT (wave 48).  readPixels renders the volume and returns aggregates; this
      renders the LINES ALONE over the stage's own ground (mat.bg, not black — the light theme's near-black frame
      is only legible against the light stage it is drawn on) and classifies every pixel that carries chroma.
      It is the colour proof that reads the rendered image rather than the buffer writeLines just filled. */
  async function linePixels(obs, mat, w = 256, h = 256) {
    const tex = device.createTexture({ size: [w, h], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
    if (!out._lp) { out._rp = makeRenderPipeline('rgba8unorm'); out._lp = makeLinePipeline('rgba8unorm'); }
    const enc = device.createCommandEncoder();
    writeView(obs, mat, w, h); const nv = writeLines(mat);
    const bg = mat.bg || DEFAULT_BG;
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', clearValue: { r: bg[0], g: bg[1], b: bg[2], a: 1 }, storeOp: 'store' }] });
    pass.setPipeline(out._lp); pass.setBindGroup(0, lineBind); pass.setVertexBuffer(0, lineBuf); pass.draw(nv);
    pass.end();
    const bpr = Math.ceil(w * 4 / 256) * 256;
    const buf = device.createBuffer({ size: bpr * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    enc.copyTextureToBuffer({ texture: tex }, { buffer: buf, bytesPerRow: bpr }, [w, h]);
    device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const px = new Uint8Array(buf.getMappedRange());
    const B = { cyan: 0, magenta: 0, yellow: 0, warm: 0, green: 0, blue: 0, grey: 0 };
    const top = { cyan: null, magenta: null, yellow: null };
    const ground = [Math.round(bg[0] * 255), Math.round(bg[1] * 255), Math.round(bg[2] * 255)];
    let darkest = 255, darkestPx = null;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = y * bpr + x * 4, r = px[o], g = px[o + 1], b = px[o + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const L = (r + g + b) / 3;
      if (L < darkest) { darkest = L; darkestPx = [r, g, b]; }
      if (mx - mn < 34) { B.grey++; continue; }                        // achromatic: the box, or the ground
      const hi = (v) => v >= mx - 34, lo = (v) => v <= mn + 34;
      if (hi(g) && hi(b) && lo(r)) { B.cyan++; if (!top.cyan || g + b > top.cyan[1] + top.cyan[2]) top.cyan = [r, g, b]; }
      else if (hi(r) && hi(b) && lo(g)) { B.magenta++; if (!top.magenta || r + b > top.magenta[0] + top.magenta[2]) top.magenta = [r, g, b]; }
      else if (hi(r) && hi(g) && lo(b)) { B.yellow++; if (!top.yellow || r + g > top.yellow[0] + top.yellow[1]) top.yellow = [r, g, b]; }
      else if (hi(r)) B.warm++; else if (hi(g)) B.green++; else B.blue++;
    }
    buf.unmap(); buf.destroy(); tex.destroy();
    return { w, h, buckets: B, top, ground, darkest: Math.round(darkest), darkestPx };
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
    frame, throughput, readPixels, sampleVoxel, fieldDigest, readStats, lineColors, linePixels,
    setResolution,
    setDomain(h) { half = h; },
    /** 0 = position space ψ(x), 1 = momentum space φ(p): the grid then holds the Fourier transform, exactly */
    setRadialTable(arr) { device.queue.writeBuffer(radialBuf, 0, arr instanceof Float32Array ? arr : new Float32Array(arr)); refValid = false; },
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
