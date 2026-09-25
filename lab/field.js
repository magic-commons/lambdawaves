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
import { qmul, qnormalize, adjoint, expPure } from './rotor4.js';

export const VIEW = { density: 0, phase: 1, real: 2, imag: 3, diff: 4, reim: 5 };
export const VIEW_NAMES = ['density', 'phase', 'real', 'imag', 'diff', 'reim'];
/** how the same observable is DRAWN: a cloud, a bounded plateau (lit surface), or noisy particles */
export const STYLE = { cloud: 0, solid: 1, grain: 2, signed: 3, bands: 4, dust: 5, glass: 6, additive: 7 };
export const STYLE_NAMES = ['cloud', 'solid', 'grain', 'signed', 'bands', 'dust', 'glass', 'additive'];
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
    /* THE MEMOS (optimization 2026-09-24, K1 · AUDIT-A FA2): every mode of the gas (256), the register (91) and the box
       (27) shares ONE centre, and 16 gas modes share each l.  So the geometry is computed once per centre, P_l(cos θ)
       once per (centre, l) and e^{imφ} once per (centre, m) — the SAME expressions on the SAME inputs, skipped only
       when repeated (every key is exact equality of a pure function's input; every memo resets on a new centre), so
       every texel is bit-identical (the DIGEST LOCK, both browsers).  H₂'s alternating centres simply recompute. */
    var gC = vec3<f32>(0.0); var gq = vec3<f32>(0.0); var gr = 0.0; var gct = 1.0; var gst = 0.0; var gphi = 0.0; var gL = 999u; var gP = 0.0; var gMM = -1e30; var gE = vec2<f32>(1.0, 0.0);
    for (var a = 0u; a < P.count; a++) {
      let M = modes[a];
      if (a == 0u || any(M.ctr.xyz != gC)) { gC = M.ctr.xyz; gq = pos - gC; gr = length(gq); gct = select(gq.z / max(gr, 1e-12), 1.0, gr < 1e-9); gst = sqrt(max(0.0, 1.0 - gct * gct)); gphi = atan2(gq.y, gq.x); gL = 999u; gMM = -1e30; }
      let q = gq; let r = gr; let ct = gct; let st = gst; let phi = gphi;   // geometry relative to the mode's centre
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
        var Dw = D; if (M.lag0.z > 0.5) { if (l != gL) { gL = l; gP = legP(l, ct); } Dw = gP; }   // lag0.z = 1: the angular part by recurrence (the axial gas)
        if (r < aa) { f = M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw; }   // a BRANCH, not select(): select ran the recurrence outside the wall too
      } else if (P.space == 6u) {
        /* QUARKONIUM (Cornell, NUMERICAL): R(r) read from its tabulated row, linear interpolation; lag0 = (row, 1/r_tab, r_tab) */
        let row = u32(M.lag0.x); let x = clamp(r * M.lag0.y, 0.0, 1.0) * 255.0;
        let i0 = min(u32(floor(x)), 254u); let fr = x - f32(i0);
        let R = mix(radial[row * 256u + i0], radial[row * 256u + i0 + 1u], fr);
        f = select(0.0, M.c.z * R * ipow(st, am) * D, r < M.lag0.z);
      } else if (P.space == 2u) {
        /* OSCILLATOR  ψ = norm · r^l L(t) e^{−t/2} · Y,  t = r²  (L = the half-integer Laguerre; the same record serves
           momentum space, whose (−i)^N phase is folded into c on the CPU) */
        /* r is re-derived here, in the pre-memo form, on purpose: the driver folds length(q)² back to dot(q, q) only when
           it can see the length, and through the memo it cannot — 194 texels of the 96³ oscillator moved (probes/K/k1-osc) */
        let qo = pos - M.ctr.xyz; let ro = length(qo); let t = ro * ro;
        let L = M.lag0.x + t * (M.lag0.y + t * (M.lag0.z + t * (M.lag0.w + t * (M.lag1.x + t * M.lag1.y))));
        f = M.c.z * ipow(ro, l) * L * exp(-0.5 * t) * ipow(st, am) * D;
      } else {
        /* MOMENTUM  φ = norm · t^{l/2} P(t) (1+t)^{−(n+1)} · Y,  t = n²p²  (P = the Podolsky–Pauling numerator;
           the (−i)^l phase is folded into c on the CPU).  Same record, different envelope. */
        let q = n * r; let t = q * q;
        let L = M.lag0.x + t * (M.lag0.y + t * (M.lag0.z + t * (M.lag0.w + t * (M.lag1.x + t * M.lag1.y))));
        f = M.c.z * ipow(q, l) * L / pow(1.0 + t, M.c.w) * ipow(st, am) * D;     // c.w = the exponent n+1 (kept integer when the ρ-scale is n/Z)
      }
      let mm = select(m, 0.0, P.space == 4u);                // the pair branch keeps ζ in the m slot: no azimuthal phase
      if (mm != gMM) { gMM = mm; gE = vec2<f32>(cos(mm * phi), sin(mm * phi)); } let e = gE;
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

/* ── molWgsl — THE MOLECULAR VOLUME (wave: CHEMISTRY) ───────────────────────────────────────────────────────────
 * The SAME texel convention as COMPUTE_WGSL, so RENDER_WGSL presents this volume with no change at all:
 *   .r = the amplitude's real part, .g = its imaginary part, ρ = dot(s.rg, s.rg), stats[slot] = max ρ.
 * A density writes (√ρ, 0): view 'density' reads dot(s,s) = ρ, 'phase' reads atan2(0, √ρ) = 0 — a flat phase, as a
 * real density must have — and 'diff' reads ρ − ρ_ref against refTex.  An orbital writes (ψ, 0): 'real' reads
 * s.x/ampMax = the signed orbital, 'phase' reads atan2(0, ψ) = 0 for ψ > 0 and π for ψ < 0, i.e. the two lobes.
 * A COMPLEX ORBITAL (kind 2, the ORBITALS register: ψ = Σ_k c_k e^{−iε_k t}φ_k, MATH-H2O Proposition 1) writes the
 * full (ψ_re, ψ_im): 'phase' then reads arg ψ over the whole turn, 'density' reads |ψ|², 'real'/'imag' the parts.
 * ONE matrix buffer holds both AO vectors — mat[0 … nAO) is the real part, mat[nAO … 2nAO) the imaginary one.
 * A SIGNED MATRIX (kind 3) is the density's own contraction with the square root left off: the texel is (Σ M_μν
 * χ_μ χ_ν, 0) with its sign, so 'real' shows two-colour lobes normalised by max |value|.  It exists because a
 * difference of densities is not a density — ΔD = Re D(t) − D_ref has both signs — and because subtracting two
 * rgba16float volumes of √ρ cannot see a weak kick at all: an 11-bit mantissa on √ρ is ≈ 1e-3 relative on ρ, and
 * a κ = 1e-3 kick moves ρ by about that much.  The difference is formed in f64 on the CPU and quantised ONCE.
 * ONE exp per primitive per EXPONENTIAL GROUP.  Two things share: every Cartesian component of a shell (they carry
 * the same exponents by construction), and every shell on one centre with one exponent list — which is what makes
 * STO-3G water 12 exponentials a point and not 15, and benzene 54 and not 72, because lab/md.js splits an sp record
 * into an l = 0 and an l = 1 shell over the SAME `exps` array (MATH-H2O ROUND 3 · SOL, kill 5).  The packer marks
 * such a shell `share` and the kernel keeps the previous group's exponentials in a register array.
 * f32 THROUGHOUT, and the O 1s hazard stated: the cusp sums three primitives of weight ≈ 4.25 against a total
 * ρ(O) = 193.31, so the density at a nucleus is f32-accurate to about 1e-6 relative.  The rgba16float texel is the
 * coarser number by three orders (an 11-bit mantissa on √ρ ⇒ ≈ 1e-3 relative on ρ) and it, not this sum, sets the
 * tolerance any gate on a read-back voxel may ask for.  Sorting the small terms first is not required.
 */
/** ONE source, one knob: `cap` is the AO ceiling this pipeline's χ tile holds (see MOL_CAPS) */
const molWgsl = (cap) => /* wgsl */`
const WG: u32 = 64u;                                          // 4 × 4 × 4, the eigenmode kernel's dispatch shape
struct Shell { cx: f32, cy: f32, cz: f32, l: u32, pOff: u32, nP: u32, aOff: u32, wOff: u32 };   // l carries bit 8 = share the previous group's exponentials
struct MP { n: u32, nAO: u32, nShell: u32, kind: u32, half: f32, slot: u32, r0: f32, r1: f32 };   // kind: 0 density (√ρ), 1 orbital (signed ψ), 2 complex orbital (ψ_re, ψ_im), 3 signed matrix (Δρ, no root)
@group(0) @binding(0) var<uniform> P: MP;
@group(0) @binding(1) var<storage, read> shells: array<Shell>;
@group(0) @binding(2) var<storage, read> alphas: array<f32>;
@group(0) @binding(3) var<storage, read> wts: array<f32>;
@group(0) @binding(4) var<storage, read> mat: array<f32>;
@group(0) @binding(5) var outTex: texture_storage_3d<rgba16float, write>;
@group(0) @binding(6) var<storage, read_write> stats: array<atomic<u32>>;
/* χ LIVES IN WORKGROUP MEMORY, TRANSPOSED: invocation lid owns the column chiW[ao * WG + lid], so the 64 threads
   of a workgroup read ${cap} consecutive addresses at every step of the contraction — bank-conflict-free, and off
   the per-thread scratch that a var<function> array<f32, 64> lands in.  MEASURED on an RTX 3070 at 96³: benzene
   went from 9.07 ms a dispatch to 2.80 ms and water from 0.84 to 0.50, because ~700 scratch loads a voxel through
   L1 was the entire cost — 1.3k MACs a voxel is 1.15 GMAC for the volume, which this card does in a quarter of a
   millisecond, so the arithmetic was never within an order of magnitude of being the problem. */
var<workgroup> chiW: array<f32, ${cap}u * 64u>;

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_index) lid: u32) {
  var dens = 0.0;
  if (all(gid < vec3<u32>(P.n, P.n, P.n))) {
    let pos = (vec3<f32>(gid) + vec3<f32>(0.5)) / f32(P.n) * (2.0 * P.half) - vec3<f32>(P.half);   // the domain, exactly as COMPUTE_WGSL reads it
    var ex: array<f32, 32>;                                   // the current exponential group's e^{−α r²}
    for (var s = 0u; s < P.nShell; s++) {
      let sh = shells[s];
      let l = sh.l & 255u;
      let dx = pos.x - sh.cx; let dy = pos.y - sh.cy; let dz = pos.z - sh.cz;
      let r2 = dx * dx + dy * dy + dz * dz;
      let nc = select(select(1u, 3u, l == 1u), 6u, l == 2u);
      if ((sh.l & 256u) == 0u) {                              // a NEW group: one exp per primitive, and only here
        for (var p = 0u; p < sh.nP; p++) { ex[p] = exp(-alphas[sh.pOff + p] * r2); }
      }
      var acc: array<f32, 6>;
      for (var c = 0u; c < nc; c++) { acc[c] = 0.0; }
      for (var p = 0u; p < sh.nP; p++) {
        let e = ex[p];
        let wb = sh.wOff + p * nc;
        for (var c = 0u; c < nc; c++) { acc[c] += wts[wb + c] * e; }
      }
      let a0 = sh.aOff * WG + lid;
      if (l == 0u) {
        chiW[a0] = acc[0];
      } else if (l == 1u) {
        chiW[a0] = acc[0] * dx; chiW[a0 + WG] = acc[1] * dy; chiW[a0 + 2u * WG] = acc[2] * dz;
      } else {
        chiW[a0] = acc[0] * dx * dx; chiW[a0 + WG] = acc[1] * dx * dy; chiW[a0 + 2u * WG] = acc[2] * dx * dz;
        chiW[a0 + 3u * WG] = acc[3] * dy * dy; chiW[a0 + 4u * WG] = acc[4] * dy * dz; chiW[a0 + 5u * WG] = acc[5] * dz * dz;
      }
    }
    var amp = 0.0;
    var ampIm = 0.0;                                                             // kind 2 only: the imaginary AO vector's contraction
    if (P.kind == 1u || P.kind == 2u) {
      for (var i = 0u; i < P.nAO; i++) { amp += mat[i] * chiW[i * WG + lid]; }   // ψ(r) = Σ_μ c_μ χ_μ(r), signed
      if (P.kind == 2u) { for (var i = 0u; i < P.nAO; i++) { ampIm += mat[P.nAO + i] * chiW[i * WG + lid]; } }   // … and Σ_μ Im c_μ χ_μ(r)
    } else {
      var rho = 0.0;
      for (var i = 0u; i < P.nAO; i++) {
        let ci = chiW[i * WG + lid];
        if (ci == 0.0) { continue; }
        rho += mat[i * P.nAO + i] * ci * ci;                                     // the diagonal …
        var off = 0.0;
        let row = i * P.nAO;
        for (var j = i + 1u; j < P.nAO; j++) { off += mat[row + j] * chiW[j * WG + lid]; }
        rho += 2.0 * ci * off;                                                   // … and 2 Σ_{μ<ν}, M symmetric
      }
      amp = select(sqrt(max(rho, 0.0)), rho, P.kind == 3u);                      // kind 3 SIGNED: the same contraction, no square root and no clamp
    }
    textureStore(outTex, vec3<i32>(gid), vec4<f32>(amp, ampIm, 0.0, 0.0));
    /* stats[slot] = max(amp² + ampIm²) whatever the kind, and that is already the right accumulator for a SIGNED
       field: the presenter's 'real' view divides by ampMax = sqrt(stats[0]), which is max |amp| here, so ±1 is the
       extreme lobe either way.  A max over amp itself would have been max Δρ, not max |Δρ|, and a field whose
       largest excursion is negative would have been normalised by its smaller positive one. */
    dens = amp * amp + ampIm * ampIm;
  }
  /* the workgroup's max ρ, reduced THROUGH THE χ TILE — which is dead by now.  That is why there is no separate
     var<workgroup> atomic: at cap 64 the tile is the whole 16 KiB workgroup budget and a spare word would not fit.
     Each invocation writes only its OWN slot (ao = 0 of its column), so one barrier before the read is the whole
     synchronisation. */
  workgroupBarrier();
  chiW[lid] = dens;
  workgroupBarrier();
  if (lid == 0u) {
    var m = 0.0;
    for (var k = 0u; k < WG; k++) { m = max(m, chiW[k]); }
    atomicMax(&stats[P.slot], bitcast<u32>(m));
  }
}`;

const RENDER_WGSL = /* wgsl */`
struct View {
  cam: vec4<f32>,    // xyz camera position, w half-width
  right: vec4<f32>,  // xyz, w = tanHalfFov * aspect
  up: vec4<f32>,     // xyz, w = tanHalfFov
  fwd: vec4<f32>,    // xyz, w = steps
  p0: vec4<f32>,     // view mode, exposure, softness, dither
  p1: vec4<f32>,     // slice mode, slice axis, slice pos (-1..1 of half), slab thickness (fraction of half)
  p2: vec4<f32>,     // hue shift, invert, palette on, DITHER strength in LSB (wave 54 — p0.w stays the ray-march jitter seed)
  p3: vec4<f32>,     // draw style, iso level (fraction of ρmax), grain, saturation knee
  p4: vec4<f32>,     // PREVIEW BOOST: k (xyz) and on (w) — while the bow is drawn the field is shown multiplied by e^{ik·x}, the exact boosted state
  p6: vec4<f32>,     // arbitrary slice normal (xyz), finish (w)
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

/* ORDERED DITHER — the recursive Bayer 8x8 threshold matrix, closed form, no table and no texture.
 * M_{2n} = [[4M, 4M+2],[4M+3, 4M+1]] means each level contributes two bits, and the TOP level's pair are the
 * LOW bits of the answer (a bit reversal): with X, Y the k-th bits of the pixel's x and y, that pair is
 * (b1, b0) = (X xor Y, Y).  Unrolled over three levels that is six shifts and five xors, no branch, and the
 * value comes back centred in (-1/2, +1/2) so the mean of the pattern is exactly zero and the picture's
 * average brightness cannot move.  It is FIXED IN SCREEN SPACE on purpose: a still field must be still, and
 * a temporal (blue-noise-per-frame) dither would make a paused instrument shimmer. */
fn bayer8(px: vec2<f32>) -> f32 {
  let x = u32(px.x) & 7u;
  let y = u32(px.y) & 7u;
  let a = x ^ y;
  let v = ((y >> 2u) & 1u) | (((a >> 2u) & 1u) << 1u) | (((y >> 1u) & 1u) << 2u)
        | (((a >> 1u) & 1u) << 3u) | ((y & 1u) << 4u) | ((a & 1u) << 5u);
  return (f32(v) + 0.5) / 64.0 - 0.5;
}
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
    rok = dot(ro, V.p6.xyz); rdk = dot(rd, V.p6.xyz);
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
  let style = u32(V.p3.x);
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
      if (V.p2.z > 0.5) {
        let i0 = u32(fract(0.5 + V.p2.x) * 256.0) % 256u;   // arg ψ = 0, on the same shifted wheel as PHASE
        c = pal[i0].rgb;
      } else { c = mix(vec3<f32>(0.08, 0.45, 0.62), vec3<f32>(1.0, 1.0, 1.0), pow(rho, 0.45)); }
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
      if (V.p2.z > 0.5) {                                  // Δρ uses the Re/Im polar pair: gain −π/2, loss +π/2
        let i0 = u32(fract(0.25 + V.p2.x) * 256.0) % 256u; let i1 = u32(fract(0.75 + V.p2.x) * 256.0) % 256u;
        c = select(pal[i1].rgb, pal[i0].rgb, d > 0.0);
      } else { c = select(vec3<f32>(0.25, 0.48, 1.0), vec3<f32>(1.0, 0.86, 0.22), d > 0.0); }
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
    let knee = max(V.p3.w, 1e-4);
    let baseColour = c;
    var wEff = w / (1.0 + knee * w);                       // the bounded transfer: wEff < 1/knee always
    if (style == 1u) {
      let iso = max(V.p3.y, 1e-6);
      let rho = dot(s, s) / rhoMax;
      let band = smoothstep(iso * 0.55, iso, rho) * (1.0 - smoothstep(iso * 6.0, iso * 14.0, rho));
      wEff = band * 2.2;
      if (band > 0.02) { if (V.p6.w < 1.5) { c = overlay(c, litAt(uvw)); } }   // shade the plateau by its own gradient, as an overlay
    } else if (style == 3u) {


      let sv = select(s.y, s.x, mode == 2u) / ampMax;
      let mag = select(sqrt(dot(s, s) / rhoMax), abs(sv), mode == 2u || mode == 3u);
      let iso = max(V.p3.y, 1e-6);
      wEff = smoothstep(iso * 1.5, iso * 5.0, mag) * 2.2;
      if (wEff > 0.02) { if (V.p6.w < 1.5) { c = overlay(c, litAt(uvw)); } }
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
    if (style == 5u) {
      // World-locked grains: the paused cloud and a deterministic export share the same dust.
      let cell = floor(uvw * 144.0);
      let keep = max(.02, V.p3.z * .25);
      let delta = fract(uvw * 144.0) - vec3<f32>(.5);
      wEff *= select(0.0, 1.0 / keep, hash3(cell) < keep && dot(delta,delta) < .16);
    } else if (style == 6u) {
      let rho = dot(s,s) / rhoMax;
      let iso = max(V.p3.y, .000001);
      let shell = exp(-pow((rho - iso) / (iso * .32), 2.0));
      wEff = shell * .7;
      // Skip lighting only when this sample contributes nothing. A 0.02
      // cutoff changes visible shell colour and is not an exact optimisation.
      if (shell > 0.0) {
        let light = litAt(uvw);
        c = mix(c, vec3<f32>(1.0), clamp(light * .65, 0.0, 1.0));
      }
    }
    if (V.p6.w > .5 && V.p6.w < 1.5 && style != 6u) {
      // A glass finish on the selected shape, including signed nodal lobes.
      wEff *= .22;
      if (wEff > 0.0) { c = mix(c, vec3<f32>(1.0), clamp(litAt(uvw) * .45, 0.0, .65)); }
    }
    if (V.p6.w > 1.5) { c = baseColour; }
    let a = 1.0 - exp(-wEff * sigma * stepN * 4.0);
    if (style == 7u) {
      col += a * c;
      // Do not terminate on one saturated channel: the remaining samples
      // can still change the other channels, including after gamma/dither.
    } else {
      col += (1.0 - alpha) * a * c;
      alpha += (1.0 - alpha) * a;
      if (alpha > 0.985) { break; }
    }
    t += ds;
  }
  let bgBlend = select(1.0 - alpha, max(0.0, 1.0 - max(col.r, max(col.g, col.b))), style == 7u);
  var o = pow(max(col + bg * bgBlend, vec3<f32>(0.0)), vec3<f32>(1.0 / max(V.p5.w, 0.05)));   // output gamma (a SURFACE control)
  o = select(o, bg, o != o);                                                                          // a NaN anywhere on the ray would paint the pixel black on Metal: show the stage instead
  /* DITHER (wave 54).  The LAST thing that happens to the colour, AFTER the gamma, because the quantiser it
     defeats is the 8-bit swapchain and nothing else — dithering in linear light would be dithering the wrong
     ladder.  V.p2.w is the amplitude in LEAST SIGNIFICANT BITS: 1.0 is the textbook ±½ LSB, which turns the
     hard step between two adjacent codes into a spatial average that lands between them.  It is OFF (0) by
     default and it never touches the physics — the readback path renders through the same shader, so a gate
     that compares pixels compares the same numbers as long as the strength is zero. */
  o = o + bayer8(in.pos.xy) * (V.p2.w / 255.0);
  return vec4<f32>(o, 1.0);
}`;

const LINE_WGSL = /* wgsl */`
struct U { vp: mat4x4<f32> };
@group(0) @binding(0) var<uniform> U0: U;
/* INK STAYS UNDER GLASS (2026-09-11): up to 32 window rectangles in framebuffer pixels. A frame, axis or slice
   line is not drawn where a window covers the stage, so a translucent pane never shows a hairline through
   its title — the 1-px box edge at 42 % alpha was the "vertical line plaguing the devices". */
struct Occ { n: u32, pad0: u32, pad1: u32, pad2: u32, r: array<vec4<f32>, 32> };
@group(0) @binding(1) var<uniform> OCC: Occ;
/* the LATTICE / DOTS ink (optimization 2026-09-24, K6): one colour per theme, so it rides here and their vertices carry
   xyz + alpha (16 bytes, was 28) — the vertex stage hands the rasteriser the same four f32 either way */
@group(0) @binding(2) var<uniform> INK: vec4<f32>;
struct VSOut { @builtin(position) pos: vec4<f32>, @location(0) col: vec4<f32> };
@vertex fn vs(@location(0) p: vec3<f32>, @location(1) c: vec4<f32>) -> VSOut {
  var o: VSOut; o.pos = U0.vp * vec4<f32>(p, 1.0); o.col = c; return o;
}
@vertex fn vsLattice(@location(0) p: vec3<f32>, @location(1) a: f32) -> VSOut {
  var o: VSOut; o.pos = U0.vp * vec4<f32>(p, 1.0); o.col = vec4<f32>(INK.rgb, a); return o;
}
@fragment fn fs(in: VSOut) -> @location(0) vec4<f32> {
  for (var i = 0u; i < OCC.n; i++) {
    let q = OCC.r[i];
    if (in.pos.x >= q.x && in.pos.x <= q.z && in.pos.y >= q.y && in.pos.y <= q.w) { discard; }
  }
  return in.col;
}`;

/* ── small mat4 helpers (column-major, as WGSL reads them) ───────────────── */
const ORIGIN = [0, 0, 0], DEFAULT_BG = [0.028, 0.038, 0.058];
const AXIS_NORMALS = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
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
/* ── THE CAMERA HAS TWO MODES (wave 54, board #43) ──────────────────────────────────────────────────────────
 * TURNTABLE is the shipped camera and is not touched below: two Euler angles about a WORLD up of +z, a level
 * horizon by construction, and a pitch clamp at the poles because atan2 has nothing to say there.
 * FREE stores ONE unit quaternion q and no angles at all, so there is no clamp to hit: R(q) carries the camera's
 * own (x̂, ŷ, ẑ) = (right, up, back) onto the world, a drag LEFT-multiplies... no: RIGHT-multiplies a rotor built
 * in the camera's own frame, and the horizon is free to tilt.
 *
 * THE Z-UP CONVERSION, and why a copy would have been wrong.  The reference (NEBULA, and the study written from
 * it) is a Y-UP world in which the home camera looks down −z, so its home orientation is the IDENTITY quaternion
 * and q(ψ, θ) = q_y(ψ)·q_x(θ).  OURS IS Z-UP — z is the quantization axis, which is physics and not preference —
 * and our home camera is NOT the identity: at yaw = pitch = 0 the basis is right = ŷ, up = ẑ, back = x̂, i.e. the
 * cyclic permutation x → y → z → x, whose quaternion is q₀ = ½(1 + i + j + k).  So the honest conversion is
 *
 *        q(ψ, θ) = q_z(ψ) · q₀ · q_x(−θ),        q_z(ψ) = [cos ψ/2, 0, 0, sin ψ/2],  q_x(−θ) = [cos θ/2, −sin θ/2, 0, 0]
 *
 * — the extra q₀ is exactly the term a transplanted Y-up formula has no reason to carry, and the minus on θ is
 * the second: turning the camera about its own +right by β LOWERS the pitch by β (dir·ẑ = −sin β).  Both are
 * verified against this very function, to 7e-16 over 2000 random poses, by the browser gate.
 * Back the other way: b = R(q)ẑ is the camera's own back vector, so θ = asin b_z and ψ = atan2(b_y, b_x) — the
 * study's Y-up θ = asin b_y, ψ = atan2(b_x, b_z) reads the WRONG TWO COMPONENTS in this world and would have
 * produced a camera that was very nearly right, which is the worst kind. */
export const CAM_HOME_Q = [0.5, 0.5, 0.5, 0.5];          // q₀: the cyclic permutation x → y → z → x
/** TURNTABLE (ψ, θ) → the FREE rotor.  Exact: the two bases agree to floating point. */
export function quatFromYawPitch(yaw, pitch) {
  return qnormalize(qmul(qmul([Math.cos(yaw / 2), 0, 0, Math.sin(yaw / 2)], CAM_HOME_Q),
    [Math.cos(pitch / 2), -Math.sin(pitch / 2), 0, 0]));
}
/** the FREE rotor → TURNTABLE (ψ, θ), the pitch held inside the clamp so the levelling slerp has an exact target */
export function yawPitchFromQuat(q, pitchMax = 1.52) {
  const b = adjoint(q, [0, 0, 1]), s = Math.sin(pitchMax);
  return { yaw: Math.atan2(b[1], b[0]), pitch: Math.asin(Math.max(-s, Math.min(s, b[2]))) };
}
/** turn the FREE rotor in the CAMERA's own frame: dψ about its up, dθ in the turntable's sense about its right */
export function turnFree(q, dyaw, dpitch) {
  return qnormalize(qmul(q, expPure([-dpitch / 2, dyaw / 2, 0])));
}
export function cameraBasis(obs) {
  if (obs.mode === 'free' && obs.quat) {                    // FREE: the rotor's three columns, no angles anywhere
    const q = obs.quat, dir = adjoint(q, [0, 0, 1]);
    return { dir, fwd: [-dir[0], -dir[1], -dir[2]], right: adjoint(q, [1, 0, 0]), up: adjoint(q, [0, 1, 0]) };
  }
  const cp = Math.cos(obs.pitch), sp = Math.sin(obs.pitch), cy = Math.cos(obs.yaw), sy = Math.sin(obs.yaw);
  const dir = [cp * cy, cp * sy, sp];                       // z is UP (the quantization axis)
  const fwd = [-dir[0], -dir[1], -dir[2]];
  const up0 = Math.abs(sp) > 0.999 ? [-cy, -sy, 0] : [0, 0, 1];
  let rx = fwd[1] * up0[2] - fwd[2] * up0[1], ry = fwd[2] * up0[0] - fwd[0] * up0[2], rz = fwd[0] * up0[1] - fwd[1] * up0[0];
  const rl = Math.hypot(rx, ry, rz); rx /= rl; ry /= rl; rz /= rl;
  const up = [ry * fwd[2] - rz * fwd[1], rz * fwd[0] - rx * fwd[2], rx * fwd[1] - ry * fwd[0]];
  return { dir, fwd, right: [rx, ry, rz], up };
}
/** the whole orientation as ONE string — what a cached 2-D overlay must key on, because a FREE camera can ROLL
 *  without moving either angle and a (yaw, pitch) key would hand it back a stale bitmap (wave 54) */
export function cameraKey(obs) {
  if (obs.mode === 'free' && obs.quat) return 'q' + obs.quat.map((v) => v.toFixed(6)).join(',');
  return obs.yaw.toFixed(4) + '|' + obs.pitch.toFixed(4);
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
    const cc = center || ORIGIN; buf[o + 24] = cc[0]; buf[o + 25] = cc[1]; buf[o + 26] = cc[2]; buf[o + 27] = modes[i].group || 0;
  }
  return { buf, count };
}
const tableCache = new Map();
export function tableFor(s) {
  let T = tableCache.get(s.id);
  if (!T) { T = modeTable(s.n, s.l, s.m); tableCache.set(s.id, T); }
  return T;
}

/* ── THE MOLECULAR SPEC, PACKED (wave: CHEMISTRY) ───────────────────────────────────────────────────────────────
 * spec = { nAO, half, shells: [{ center: [x, y, z] bohr, l, prims: [{ alpha, w }], ao? }] }, `w` already carrying
 * the contraction coefficient × primitive norm × per-component unit-self-overlap factor — the same numbers
 * molecular-field.js's evaluator multiplies by, produced by its `fieldShells(basis)`.  Three flat STORAGE buffers,
 * not uniform arrays: f32 values with integer offsets, so 64 AOs and 256 shells cost nothing per frame.
 */
export const MAX_MOL_AO = 64;                                 // the shader's var<function> array<f32, 64>
export const MOL_LIMITS = { shells: 256, prims: 2048, weights: 8192, ao: MAX_MOL_AO, prim: 32 };   // prim: the kernel's per-group register array
/* THE AO TIERS.  The χ tile is cap × 64 × 4 bytes of WORKGROUP memory — 4, 10 and 16 KiB — and the workgroup budget
   is 16 KiB, so how many workgroups an SM can hold is set by the SMALLEST tier the molecule fits in.  Three
   pipelines off one source: water/STO-3G takes the 4 KiB one, benzene and H₂O/6-31+G* the 10 KiB one. */
export const MOL_CAPS = [16, 40, MAX_MOL_AO];
export const molTierFor = (nAO) => { const t = MOL_CAPS.findIndex((c) => nAO <= c);
  if (t < 0) throw new Error(`field: nAO ${nAO} is beyond the kernel's ${MAX_MOL_AO}`); return t; };
const MOL_SHELL_U = new Uint32Array(MOL_LIMITS.shells * 8), MOL_SHELL_F = new Float32Array(MOL_SHELL_U.buffer);
const MOL_ALPHA = new Float32Array(MOL_LIMITS.prims), MOL_W = new Float32Array(MOL_LIMITS.weights);
const MOL_NC = [1, 3, 6];
/** pack one spec into the module's three scratch arrays; returns the counts the kernel and the uploads need */
export function packMolecule(spec) {
  if (!spec || !Array.isArray(spec.shells) || !spec.shells.length) throw new Error('field: a molecule spec needs { nAO, shells: [...] }');
  const nAO = spec.nAO | 0;
  if (!(nAO > 0) || nAO > MAX_MOL_AO) throw new Error(`field: nAO ${spec.nAO} is outside 1..${MAX_MOL_AO}`);
  let nShell = 0, pOff = 0, wOff = 0, ao = 0, nExp = 0, prev = null;
  for (const sh of spec.shells) {
    const nc = MOL_NC[sh.l];
    if (nc === undefined) throw new Error(`field: molecular shells are Cartesian l ≤ 2, got l = ${sh.l}`);
    if (!sh.center || sh.center.length !== 3) throw new Error('field: a molecular shell needs center: [x, y, z] in bohr');
    if (!Array.isArray(sh.prims) || !sh.prims.length) throw new Error('field: a molecular shell needs prims: [{ alpha, w }]');
    const nP = sh.prims.length;
    if (nP > MOL_LIMITS.prim) throw new Error(`field: a shell of ${nP} primitives is beyond the kernel's ${MOL_LIMITS.prim}`);
    if (nShell >= MOL_LIMITS.shells) throw new Error(`field: more than ${MOL_LIMITS.shells} shells`);
    if (wOff + nP * nc > MOL_LIMITS.weights) throw new Error(`field: more than ${MOL_LIMITS.weights} primitive weights`);
    const base = sh.ao === undefined ? ao : sh.ao | 0;
    if (base !== ao) throw new Error(`field: shell AO base ${base} is not the running index ${ao} — the shells are not in AO order`);
    /* ONE EXPONENTIAL GROUP is one centre and one exponent list, whatever the l: md.js splits an sp record into an
       l = 0 and an l = 1 shell over the same `exps`, so sharing here is what takes STO-3G water from 15 exps a
       voxel to 12 and benzene from 72 to 54.  The kernel keeps the group's e^{−α r²} in registers. */
    const share = !!prev && prev.c[0] === sh.center[0] && prev.c[1] === sh.center[1] && prev.c[2] === sh.center[2]
      && prev.nP === nP && sh.prims.every((pr, p) => pr.alpha === prev.alphas[p]);
    const myOff = share ? prev.off : pOff;
    if (!share && pOff + nP > MOL_LIMITS.prims) throw new Error(`field: more than ${MOL_LIMITS.prims} primitives`);
    const o = nShell * 8;
    MOL_SHELL_F[o] = sh.center[0]; MOL_SHELL_F[o + 1] = sh.center[1]; MOL_SHELL_F[o + 2] = sh.center[2];
    MOL_SHELL_U[o + 3] = sh.l | (share ? 256 : 0); MOL_SHELL_U[o + 4] = myOff; MOL_SHELL_U[o + 5] = nP; MOL_SHELL_U[o + 6] = base; MOL_SHELL_U[o + 7] = wOff;
    for (let p = 0; p < nP; p++) {
      const pr = sh.prims[p];
      if (!pr || !(pr.alpha > 0) || !pr.w || pr.w.length !== nc) throw new Error(`field: an l = ${sh.l} primitive needs a positive alpha and ${nc} weights`);
      MOL_ALPHA[myOff + p] = pr.alpha;
      for (let c = 0; c < nc; c++) MOL_W[wOff + p * nc + c] = pr.w[c];
    }
    if (!share) { pOff += nP; nExp += nP; }
    prev = { c: sh.center, nP, off: myOff, alphas: sh.prims.map((pr) => pr.alpha) };
    wOff += nP * nc; ao += nc; nShell++;
  }
  if (ao !== nAO) throw new Error(`field: the shells cover ${ao} AOs, the spec declares ${nAO}`);
  return { nShell, nPrim: pOff, nWeight: wOff, nExp, nAO, shell: MOL_SHELL_U, alpha: MOL_ALPHA, weight: MOL_W };
}

export async function createField(canvas, opts = {}) {
  const out = { ok: false, error: null, adapterInfo: null, canvas };
  if (!navigator.gpu) { out.error = 'navigator.gpu is absent — WebGPU is not enabled in this browser'; return out; }
  let adapter, device;
  try {
    adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) { out.error = 'no WebGPU adapter'; return out; }
    /* WAVE 58 — ASK FOR THE ADAPTER'S OWN CEILING, not WebGPU's default one.  `requestDevice()` with no
     * `requiredLimits` gives the DEFAULT limits whatever the hardware can do — maxTextureDimension2D 8192 — and
     * that number is the largest picture lab/capture.js can ever take, on an adapter that reports 32767.  The
     * ceiling was a line of this file and not the GPU, which capture.js' header says in as many words.
     * A device MUST grant a limit its own adapter reported, so this cannot fail on a conforming implementation;
     * it is still wrapped, because a device that does not come up is the whole application and a bigger PNG is
     * not worth that trade.  `capture.limits()` READS what was granted rather than believing this comment. */
    const want = {};
    for (const k of ['maxTextureDimension2D', 'maxTextureDimension1D']) if (adapter.limits && adapter.limits[k]) want[k] = adapter.limits[k];
    try { device = await adapter.requestDevice({ requiredLimits: want }); out.limitsRequested = want; }
    catch (_) { device = await adapter.requestDevice(); out.limitsRequested = null; }
  } catch (e) { out.error = 'WebGPU device request failed: ' + (e && e.message || e); return out; }
  try { const info = adapter.info || (adapter.requestAdapterInfo && await adapter.requestAdapterInfo()); out.adapterInfo = info ? { vendor: info.vendor, architecture: info.architecture, device: info.device, description: info.description } : null; } catch (_) {}
  device.addEventListener('uncapturederror', (e) => { out.lastGpuError = String(e.error && e.error.message || e.error); if (opts.onError) opts.onError(out.lastGpuError); });
  device.lost.then((info) => { out.ok = false; out.error = 'device lost: ' + info.message; if (opts.onLost) opts.onLost(info); });

  const format = navigator.gpu.getPreferredCanvasFormat();
  const ctx = canvas.getContext('webgpu');
  /* ── THE COLOUR GAMUT (wave 54, board #52) ──────────────────────────────────────────────────────────────────
   * WebGPU's canvas can be tagged `colorSpace: 'display-p3'` — and Gecko does not implement the member.  It is
   * commented out in dom/webidl/WebGPU.webidl (Bug 1834395), and a WebIDL dictionary IGNORES a member it does not
   * declare, so passing it throws nothing, warns nothing, and leaves the swapchain sRGB.  A feature test that
   * asks whether the string was ACCEPTED therefore always says yes and is worthless.
   * THE HONEST PROBE, and it is exact: dictionary conversion performs Get(obj, "colorSpace") for every member the
   * binding DECLARES.  Hand configure() an object whose `colorSpace` is a GETTER and see whether the browser ever
   * calls it.  Called ⇒ the member exists in this build; never called ⇒ it does not, whatever the docs say.
   * (The probe configures with 'srgb', i.e. the default, so the canvas is in its shipped state either way; it is
   * re-configured immediately below regardless, before a single frame is drawn.) */
  let canvasP3 = false;
  try {
    const probe = { device, format, alphaMode: 'opaque' };
    Object.defineProperty(probe, 'colorSpace', { enumerable: true, configurable: true, get() { canvasP3 = true; return 'srgb'; } });
    ctx.configure(probe);
  } catch (_) { canvasP3 = false; }
  let gamut = 'srgb';
  ctx.configure({ device, format, alphaMode: 'opaque' });
  /** srgb ⇄ display-p3 both share the sRGB transfer curve, so the matrix must be applied in LINEAR light */
  const lin = (u) => (u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));
  const enc8 = (u) => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
  const M_SRGB_P3 = [[0.822462, 0.177538, 0], [0.033194, 0.966806, 0], [0.017083, 0.072397, 0.910520]];   // rows sum to 1: D65 white is fixed
  /** the CONVERSION: the same colour, re-expressed in a wider basis.  Nothing looks different; the banding improves. */
  function srgbToP3(rgb) {
    const l = [lin(rgb[0]), lin(rgb[1]), lin(rgb[2])];
    return M_SRGB_P3.map((r) => enc8(Math.max(0, Math.min(1, r[0] * l[0] + r[1] * l[1] + r[2] * l[2]))));
  }
  /** the EXPANSION: the same lightness and hue, more chroma than was authored.  A DESIGN CHOICE, never accuracy. */
  function vividP3(rgb, k = 1.25) {
    const c = srgbToP3(rgb), l = [lin(c[0]), lin(c[1]), lin(c[2])];
    const g = 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
    return l.map((v) => enc8(Math.max(0, Math.min(1, g + (v - g) * k))));
  }
  /** the ONE road the colour takes on its way to the canvas — the DOM takes the same one (rack.js applyAccent) */
  const gamutMap = (rgb) => (gamut === 'srgb' ? rgb : gamut === 'p3-vivid' ? vividP3(rgb) : srgbToP3(rgb));
  const cssP3 = !!(window.CSS && CSS.supports && CSS.supports('color', 'color(display-p3 1 0 0)'));
  const displayP3 = !!(window.matchMedia && matchMedia('(color-gamut: p3)').matches);
  const GAMUT_WHY = 'Display P3 is unavailable on this canvas';
  let lastLUT = null;
  /** the palette reaches the GPU through the gamut, so the field and the interface can never disagree */
  function uploadPalette() {
    if (!lastLUT) return;
    if (gamut === 'srgb') { device.queue.writeBuffer(palBuf, 0, lastLUT); return; }
    const out2 = new Float32Array(lastLUT.length);
    for (let i = 0; i < lastLUT.length; i += 4) { const c = gamutMap([lastLUT[i], lastLUT[i + 1], lastLUT[i + 2]]); out2[i] = c[0]; out2[i + 1] = c[1]; out2[i + 2] = c[2]; out2[i + 3] = lastLUT[i + 3]; }
    device.queue.writeBuffer(palBuf, 0, out2);
  }

  const computeModule = device.createShaderModule({ code: COMPUTE_WGSL });
  const renderModule = device.createShaderModule({ code: RENDER_WGSL });
  const lineModule = device.createShaderModule({ code: LINE_WGSL });
  const molModules = MOL_CAPS.map((cap) => device.createShaderModule({ code: molWgsl(cap) }));   // the molecular volume (CHEMISTRY), one pipeline per AO tier
  /* compile messages are kept, never swallowed: a broken shader must say where */
  out.shaderMessages = [];
  for (const [name, m] of [['compute', computeModule], ['render', renderModule], ['line', lineModule], ...molModules.map((m2, i) => ['molecule' + MOL_CAPS[i], m2])]) {
    try { const info = await m.getCompilationInfo(); for (const msg of info.messages) out.shaderMessages.push({ shader: name, type: msg.type, line: msg.lineNum, col: msg.linePos, text: msg.message }); } catch (_) {}
  }
  if (out.shaderMessages.some((m) => m.type === 'error')) { out.error = 'WGSL compile error: ' + JSON.stringify(out.shaderMessages.filter((m) => m.type === 'error')); return out; }
  const computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: computeModule, entryPoint: 'main' } });
  const molPipelines = molModules.map((m) => device.createComputePipeline({ layout: 'auto', compute: { module: m, entryPoint: 'main' } }));
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
  const lineBGL = device.createBindGroupLayout({ entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }, { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }] });
  const lineLayout = device.createPipelineLayout({ bindGroupLayouts: [lineBGL] });
  const makeRenderPipeline = (fmt) => device.createRenderPipeline({ layout: renderLayout, vertex: { module: renderModule, entryPoint: 'vs' }, fragment: { module: renderModule, entryPoint: 'fs', targets: [{ format: fmt }] }, primitive: { topology: 'triangle-list' } });
  const renderPipeline = makeRenderPipeline(format);
  const lineTarget = (fmt) => ({ module: lineModule, entryPoint: 'fs', targets: [{ format: fmt, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } } }] });
  /** { line, lattice }: the box/axes/slice/corner pipeline (xyz + rgba) and the lattice/dots one (xyz + alpha, ink uniform) */
  const makeLinePipeline = (fmt) => ({
    line: device.createRenderPipeline({ layout: lineLayout, primitive: { topology: 'line-list' }, fragment: lineTarget(fmt),
      vertex: { module: lineModule, entryPoint: 'vs', buffers: [{ arrayStride: 28, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }, { shaderLocation: 1, offset: 12, format: 'float32x4' }] }] } }),
    lattice: device.createRenderPipeline({ layout: lineLayout, primitive: { topology: 'line-list' }, fragment: lineTarget(fmt),
      vertex: { module: lineModule, entryPoint: 'vsLattice', buffers: [{ arrayStride: 16, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }, { shaderLocation: 1, offset: 12, format: 'float32' }] }] } }),
  });
  const linePipeline = makeLinePipeline(format);

  const paramsBuf = [0, 1].map(() => device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }));
  const modesBuf = [0, 1].map(() => device.createBuffer({ size: MAX_MODES * MODE_BYTES, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }));
  const radialBuf = device.createBuffer({ size: 40 * 256 * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });   // 36 rows in use
  const statsBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
  const viewBuf = device.createBuffer({ size: 11 * 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const vpBuf = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  /* the phase PALETTE: 256 RGBA colours around the complex plane (see palette.js) */
  const palBuf = device.createBuffer({ size: 256 * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  { const init = new Float32Array(256 * 4); for (let i = 0; i < 256; i++) { init[i * 4] = 1; init[i * 4 + 1] = 1; init[i * 4 + 2] = 1; init[i * 4 + 3] = 1; } device.queue.writeBuffer(palBuf, 0, init); }
  /* the MOLECULAR buffers: two param blocks (one per texture slot) and the four read-only tables */
  const molParamsBuf = [0, 1].map(() => device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }));
  const molShellBuf = device.createBuffer({ size: MOL_LIMITS.shells * 32, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const molAlphaBuf = device.createBuffer({ size: MOL_LIMITS.prims * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const molWBuf = device.createBuffer({ size: MOL_LIMITS.weights * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const molMatBuf = device.createBuffer({ size: MAX_MOL_AO * MAX_MOL_AO * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const MOL_PARAMS = new ArrayBuffer(32), MOL_PARAMS_U = new Uint32Array(MOL_PARAMS), MOL_PARAMS_F = new Float32Array(MOL_PARAMS);
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge', addressModeW: 'clamp-to-edge' });
  const lineVerts = 44;                                            // box 24 + axes 6 + slice 8, then the corner axis 6
  const latticeVerts = 17 * 17 * 17 * 6;                           // the larger of the two: dots (6 per node) 29 478 · lattice 27 744
  let latticeCount = 0; const cornerStart = 38;
  const lineBuf = device.createBuffer({ size: lineVerts * 28, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  const LINES = new Float32Array(lineVerts * 7);                   // the box, the axes and the slice frame, written in place each frame
  const latticeBuf = device.createBuffer({ size: latticeVerts * 16, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  const LATTICE = new Float32Array(latticeVerts * 4);              // xyz + alpha; the ink is inkBuf's
  const inkBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }), INK_V = new Float32Array(4);


  const LINE_AT = { box: [0, 24], axes: [24, 6], slice: [30, 8] };
  const cornerVP = device.createBuffer({ size:64, usage:GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(cornerVP,0,new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]));
  /* the occlusion block: n + 32 rects; the corner axis is a HUD and gets the empty block */
  const OCC_BYTES = 16 + 32 * 16, occBuf = device.createBuffer({ size: OCC_BYTES, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }), occNone = device.createBuffer({ size: OCC_BYTES, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const OCC = new ArrayBuffer(OCC_BYTES), OCC_U = new Uint32Array(OCC, 0, 4), OCC_F = new Float32Array(OCC, 16); let occSig = '';
  const cornerBind = device.createBindGroup({layout:lineBGL,entries:[{binding:0,resource:{buffer:cornerVP}},{binding:1,resource:{buffer:occNone}},{binding:2,resource:{buffer:inkBuf}}]});
  const lineBind = device.createBindGroup({ layout: lineBGL, entries: [{ binding: 0, resource: { buffer: vpBuf } }, { binding: 1, resource: { buffer: occBuf } }, { binding: 2, resource: { buffer: inkBuf } }] });

  /* the per-frame scratch (wave 45): the frame path allocates nothing — the params block, the stats zero, the view block,
     the three matrices and the line vertices are written in place */
  const PARAMS = new ArrayBuffer(32), PARAMS_U = new Uint32Array(PARAMS), PARAMS_F = new Float32Array(PARAMS), ZERO_U32 = new Uint32Array([0]);
  const VIEW = new Float32Array(44), M_PERSP = new Float32Array(16), M_LOOK = new Float32Array(16), M_VP = new Float32Array(16);
  /* LATTICE MESH (wave 108 zero-allocation law): pre-allocated unit grid lines.
     Radius 8 grid (17^3 nodes). Segments: X (16*17*17), Y (17*16*17), Z (17*17*16) = 13872 segments. */
  const LATTICE_SEGS = new Int8Array(13872 * 6);
  {
    const rad = 8;
    let idx = 0;
    for (let x = -rad; x <= rad; x++) {
      for (let y = -rad; y <= rad; y++) {
        for (let z = -rad; z <= rad; z++) {
          if (x < rad) { LATTICE_SEGS[idx++] = x; LATTICE_SEGS[idx++] = y; LATTICE_SEGS[idx++] = z; LATTICE_SEGS[idx++] = x + 1; LATTICE_SEGS[idx++] = y; LATTICE_SEGS[idx++] = z; }
          if (y < rad) { LATTICE_SEGS[idx++] = x; LATTICE_SEGS[idx++] = y; LATTICE_SEGS[idx++] = z; LATTICE_SEGS[idx++] = x; LATTICE_SEGS[idx++] = y + 1; LATTICE_SEGS[idx++] = z; }
          if (z < rad) { LATTICE_SEGS[idx++] = x; LATTICE_SEGS[idx++] = y; LATTICE_SEGS[idx++] = z; LATTICE_SEGS[idx++] = x; LATTICE_SEGS[idx++] = y; LATTICE_SEGS[idx++] = z + 1; }
        }
      }
    }
  }
  let res = 0, psiTex = null, refTex = null, computeBind = null, renderBind = null, molBind = null;
  /* THE MOLECULAR STATE.  `molSpec` set marks the field molecular and the eigenmode reconstruct stands down:
     the volume is static between updates, so it is re-dispatched on a DIRTY FLAG (matrix, spec, resolution or
     domain changed), never once per frame. */
  let molSpec = null, molPack = null, molMat = null, molKind = 0, molKindName = 'density', molDirty = false, molRefDirty = false;
  let molCplx = null;                                          // the [re | im] staging vector a COMPLEX orbital is uploaded from (kind 2)
  const molParamSig = ['', '']; let molTier = 0;
  let half = 7, space = 0, generation = 0, refGeneration = -1, refValid = false;
  const stats = { reconstructs: 0, presents: 0, chromeWrites: 0, lastEncodeMs: 0, lastReconstructWall: 0, resolution: 0, modesRendered: 0, generation: 0, molDispatches: 0, molAO: 0, molMs: 0 };
  let dprCap = 2;                       // the device-pixel ceiling: 2 on a desktop, dropped at the phone breakpoint (wave 51)
  let stepCap = Infinity;               // a runtime presentation budget; the saved/project ray-step choice remains mat.steps
  let cssW = canvas.clientWidth || 1, cssH = canvas.clientHeight || 1;   // the CSS box, kept current by the observer below
  if (typeof ResizeObserver === 'function') new ResizeObserver((entries) => {
    const r = entries[entries.length - 1].contentRect; cssW = r.width || cssW; cssH = r.height || cssH;
  }).observe(canvas);

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
    molBind = molPipelines.map((pl) => [psiTex, refTex].map((tex, i) => device.createBindGroup({ layout: pl.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: molParamsBuf[i] } }, { binding: 1, resource: { buffer: molShellBuf } },
      { binding: 2, resource: { buffer: molAlphaBuf } }, { binding: 3, resource: { buffer: molWBuf } },
      { binding: 4, resource: { buffer: molMatBuf } }, { binding: 5, resource: tex.createView({ dimension: '3d' }) },
      { binding: 6, resource: { buffer: statsBuf } }] })));
    molDirty = molDirty || !!molSpec; stats.resolution = n;
    refValid = false;
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
  /** ONE molecular dispatch into `slot` (0 = psiTex, 1 = refTex): the same ceil(n/4)³ grid of 4×4×4 workgroups
      the eigenmode kernel uses, and the same stats[slot] the presenter normalises by. */
  function writeMolParams(slot) {
    const u = MOL_PARAMS_U, f = MOL_PARAMS_F;
    u[0] = res; u[1] = molPack.nAO; u[2] = molPack.nShell; u[3] = molKind; f[4] = half; u[5] = slot;
    const sig = `${res}|${molPack.nAO}|${molPack.nShell}|${molKind}|${half}`;
    if (molParamSig[slot] === sig) return;                     // a queue.writeBuffer is ~2.5 ms of staging here
    molParamSig[slot] = sig; device.queue.writeBuffer(molParamsBuf[slot], 0, MOL_PARAMS);
  }
  function encodeMolecule(enc, slot, tw) {
    writeMolParams(slot);
    device.queue.writeBuffer(statsBuf, slot * 4, ZERO_U32);     // the max accumulator: zeroed before every dispatch
    const pass = enc.beginComputePass(tw ? { timestampWrites: tw } : {});
    pass.setPipeline(molPipelines[molTier]); pass.setBindGroup(0, molBind[molTier][slot]);
    const g = Math.ceil(res / 4); pass.dispatchWorkgroups(g, g, g);
    pass.end();
    return molPack.nAO;
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
    v[12] = B.fwd[0]; v[13] = B.fwd[1]; v[14] = B.fwd[2]; v[15] = Math.min(mat.steps || 160, stepCap);
    v[16] = mat.view | 0; v[17] = mat.exposure; v[18] = mat.softness; v[19] = (stats.presents % 97) / 97;
    v[20] = mat.slice ? mat.slice.mode | 0 : 0; v[21] = mat.slice ? mat.slice.axis | 0 : 2; v[22] = mat.slice ? mat.slice.pos : 0; v[23] = mat.slice ? mat.slice.thick : 0.03;
    v[24] = mat.hueShift || 0; v[25] = mat.invert ? 1 : 0; v[26] = mat.paletteOn ? 1 : 0; v[27] = mat.dither || 0;   // wave 54: the DITHER amplitude in LSB (p0.w keeps the ray-march jitter seed)
    v[28] = mat.style | 0; v[29] = mat.iso === undefined ? 0.06 : mat.iso; v[30] = mat.grain === undefined ? 0.35 : mat.grain; v[31] = mat.knee === undefined ? 0.6 : mat.knee;
    const bon = mat.boost && mat.boost.on, bk = bon ? mat.boost.k : null;
    v[32] = bon ? bk[0] : 0; v[33] = bon ? bk[1] : 0; v[34] = bon ? bk[2] : 0; v[35] = bon ? 1 : 0;
    const bgc = mat.bg || DEFAULT_BG;
    v[36] = bgc[0]; v[37] = bgc[1]; v[38] = bgc[2]; v[39] = mat.gamma === undefined ? 1 : mat.gamma;
    v.copyWithin(40,36,40);
    const sn = mat.slice?.normal || AXIS_NORMALS[mat.slice?.axis ?? 2] || AXIS_NORMALS[2];
    const snLen = Math.hypot(sn[0], sn[1], sn[2]) || 1;
    v[36]=sn[0]/snLen; v[37]=sn[1]/snLen; v[38]=sn[2]/snLen;
    v[39]=mat.finish==='glass'?1:mat.finish==='matte'?2:0;
    device.queue.writeBuffer(viewBuf, 0, v);
    perspective(obs.fov || 0.6, aspect, 0.05 * half, 20 * half, M_PERSP); lookAt(cam, ORIGIN, B.up, M_LOOK); mul4(M_PERSP, M_LOOK, M_VP);
    device.queue.writeBuffer(vpBuf, 0, M_VP);
    return cam;
  }


  const FRAME_INK = {
    dark:  { box: [1, 1, 1, 0.13],          x: [0.0, 1.0, 1.0, 0.85],  y: [1.0, 0.0, 1.0, 0.85], z: [1.0, 1.0, 0.0, 0.9] },   // vivid CMY: x = cyan, y = magenta, z = yellow
    light: { box: [0.02, 0.03, 0.05, 0.42], x: [1.0, 0.45, 0.35, 0.45], y: [0.45, 1.0, 0.5, 0.45], z: [0.45, 0.65, 1.0, 0.6] },
  };


  const AXIS_HUE = { cmy: FRAME_INK.dark, rgb: FRAME_INK.light };
  const AXC = [0, 0, 0, 1];                                        // ONE scratch, not one array per axis per frame: push() copies out of it before the next call
  const axc = (hue, a) => { AXC[0] = hue[0]; AXC[1] = hue[1]; AXC[2] = hue[2]; AXC[3] = a; return AXC; };
  /* Chrome changes with the camera, domain, theme and its own controls, but the field can evolve for hundreds
     of frames without any of those changing. Keep the last geometry in the GPU instead of regenerating and
     uploading as much as a megabyte on every presentation. The fixed signature keeps this check allocation-free. */
  const LINE_STATE = new Array(32).fill(NaN);
  let lineStateReady = false, cachedHasSlice = false;
  function setLineState(index, value) {
    const changed = !Object.is(LINE_STATE[index], value);
    if (changed) LINE_STATE[index] = value;
    return changed;
  }
  function linesUnchanged(mat) {
    let i = 0, changed = false;
    const frameMode = mat.frameMode === 'lattice' ? 1 : mat.frameMode === 'dots' ? 2 : 0;
    const axisMode = mat.axisMode === 'corner' ? 1 : 0;
    const axisInk = mat.axisInk === 'cmy' ? 1 : mat.axisInk === 'rgb' ? 2 : 0;
    const slice = mat.slice;
    const normal = slice && slice.normal;
    /* the CAMERA is read only by the lattice/dots (the cut plane and the fade) and the corner axis (its screen basis);
       the box, the axes and the slice are world geometry, so without those the camera is not part of the key (K6) */
    const cam = (mat.frame !== false && frameMode !== 0) || (mat.axis !== false && axisMode === 1);
    changed = setLineState(i++, half) || changed;
    for (let j = 0; j < 12; j++) changed = setLineState(i++, cam ? VIEW[j] : 0) || changed;
    changed = setLineState(i++, canvas.width) || changed;
    changed = setLineState(i++, canvas.height) || changed;
    changed = setLineState(i++, mat.lightUI ? 1 : 0) || changed;
    changed = setLineState(i++, axisInk) || changed;
    changed = setLineState(i++, mat.frame === false ? 0 : 1) || changed;
    changed = setLineState(i++, frameMode) || changed;
    changed = setLineState(i++, mat.axis === false ? 0 : 1) || changed;
    changed = setLineState(i++, axisMode) || changed;
    changed = setLineState(i++, mat.cornerX) || changed;
    changed = setLineState(i++, mat.cornerY) || changed;
    changed = setLineState(i++, mat.cornerScaleX) || changed;
    changed = setLineState(i++, mat.cornerScaleY) || changed;
    changed = setLineState(i++, slice ? slice.mode | 0 : 0) || changed;
    changed = setLineState(i++, slice ? slice.axis | 0 : 2) || changed;
    changed = setLineState(i++, slice ? slice.pos : 0) || changed;
    changed = setLineState(i++, slice ? slice.thick : 0.03) || changed;
    changed = setLineState(i++, normal ? normal[0] : undefined) || changed;
    changed = setLineState(i++, normal ? normal[1] : undefined) || changed;
    changed = setLineState(i++, normal ? normal[2] : undefined) || changed;
    const same = lineStateReady && !changed;
    lineStateReady = true;
    return same;
  }
  function writeLines(mat) {
    if (linesUnchanged(mat)) return cachedHasSlice;
    const h = half, v = LINES; let k = 0;
    const push = (a, b, c) => { v[k++] = a[0]; v[k++] = a[1]; v[k++] = a[2]; v[k++] = c[0]; v[k++] = c[1]; v[k++] = c[2]; v[k++] = c[3]; v[k++] = b[0]; v[k++] = b[1]; v[k++] = b[2]; v[k++] = c[0]; v[k++] = c[1]; v[k++] = c[2]; v[k++] = c[3]; };
    const INK = mat.lightUI ? FRAME_INK.light : FRAME_INK.dark;    // the BOX's ink, and the ALPHA of all three axes, in both cases the theme's
    const AX = AXIS_HUE[mat.axisInk] || INK;                       // ⚠ the AXES' hue is the user's — 'theme', and anything unreadable, fall back to the theme's own row
    const boxC = INK.box;
    const corners = [[-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h], [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (const [a, b] of edges) push(corners[a], corners[b], boxC);
    push([0, 0, 0], [0.6 * h, 0, 0], axc(AX.x, INK.x[3]));   // x — the hue is the seat's, the alpha is the theme's
    push([0, 0, 0], [0, 0.6 * h, 0], axc(AX.y, INK.y[3]));   // y
    push([0, 0, 0], [0, 0, 0.6 * h], axc(AX.z, INK.z[3]));   // z (quantization axis)
    let n = 15;
    if (mat.slice && mat.slice.mode) {
      const ax = mat.slice.axis | 0, s = mat.slice.pos * h, c = [1, 0.85, 0.4, 0.55];
      const normal = mat.slice.normal || AXIS_NORMALS[ax] || AXIS_NORMALS[2];
      const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
      const raw=cross(normal,Math.abs(normal[2])<.9?[0,0,1]:[0,1,0]),len=Math.hypot(...raw)||1;
      const uvec=raw.map(v=>v/len),vvec=cross(normal,uvec);
      const q=(u,w)=>normal.map((v,i)=>v*s+uvec[i]*u+vvec[i]*w);
      push(q(-h, -h), q(h, -h), c); push(q(h, -h), q(h, h), c); push(q(h, h), q(-h, h), c); push(q(-h, h), q(-h, -h), c);
      n += 4;
    }
    k = cornerStart * 7; latticeCount = 0;
    if (mat.frame !== false && (mat.frameMode === 'lattice' || mat.frameMode === 'dots')) {
      const L = LATTICE; let q = 0;
      const radius = 8, spacing = h * 2;
      const camX = VIEW[0], camY = VIEW[1], camZ = VIEW[2];
      const invMaxDist = 1 / (spacing * radius);
      const baseAlpha = mat.lightUI ? 0.22 : 0.16;
      const inkR = mat.lightUI ? 0.18 : 0.75;
      const inkG = mat.lightUI ? 0.22 : 0.80;
      const inkB = mat.lightUI ? 0.28 : 0.88;
      INK_V[0] = inkR; INK_V[1] = inkG; INK_V[2] = inkB; INK_V[3] = 1;

      if (mat.frameMode === 'lattice') {
        const segCount = 13872;
        for (let s = 0; s < segCount; s++) {
          const base = s * 6;
          let ax = LATTICE_SEGS[base] * spacing;
          let ay = LATTICE_SEGS[base + 1] * spacing;
          let az = LATTICE_SEGS[base + 2] * spacing;
          let bx = LATTICE_SEGS[base + 3] * spacing;
          let by = LATTICE_SEGS[base + 4] * spacing;
          let bz = LATTICE_SEGS[base + 5] * spacing;

          const da = ax * camX + ay * camY + az * camZ;
          const db = bx * camX + by * camY + bz * camZ;
          if (da > 0 && db > 0) continue;
          if (da > 0 || db > 0) {
            const u = da / (da - db);
            const qx = ax + (bx - ax) * u;
            const qy = ay + (by - ay) * u;
            const qz = az + (bz - az) * u;
            if (da > 0) { ax = qx; ay = qy; az = qz; }
            else { bx = qx; by = qy; bz = qz; }
          }
          const distA = Math.hypot(ax, ay, az);
          const distB = Math.hypot(bx, by, bz);
          const dist = Math.max(distA, distB) * invMaxDist;
          const alpha = baseAlpha * Math.max(0, 1 - dist * 0.7);

          L[q++] = ax; L[q++] = ay; L[q++] = az; L[q++] = alpha;
          L[q++] = bx; L[q++] = by; L[q++] = bz; L[q++] = alpha;
          latticeCount += 2;
        }
      } else {
        const tick = h * 0.022;
        for (let x = -radius; x <= radius; x++) {
          for (let y = -radius; y <= radius; y++) {
            for (let z = -radius; z <= radius; z++) {
              const px = x * spacing, py = y * spacing, pz = z * spacing;
              const da = px * camX + py * camY + pz * camZ;
              if (da > 0) continue;
              const dist = Math.hypot(px, py, pz) * invMaxDist;
              const alpha = baseAlpha * Math.max(0, 1 - dist * 0.7);

              L[q++] = px - tick; L[q++] = py; L[q++] = pz; L[q++] = alpha;
              L[q++] = px + tick; L[q++] = py; L[q++] = pz; L[q++] = alpha;
              L[q++] = px; L[q++] = py - tick; L[q++] = pz; L[q++] = alpha;
              L[q++] = px; L[q++] = py + tick; L[q++] = pz; L[q++] = alpha;
              L[q++] = px; L[q++] = py; L[q++] = pz - tick; L[q++] = alpha;
              L[q++] = px; L[q++] = py; L[q++] = pz + tick; L[q++] = alpha;
              latticeCount += 6;
            }
          }
        }
      }
    }
    if (mat.axis !== false && mat.axisMode === 'corner') {
      const ink = AX;
      const px = mat.cornerX !== undefined ? mat.cornerX : 0.8;
      const py = mat.cornerY !== undefined ? mat.cornerY : -0.8;
      const aspect = canvas.width > 0 && canvas.height > 0 ? canvas.width / canvas.height : 1;
      const sx = mat.cornerScaleX !== undefined ? mat.cornerScaleX : (0.08 / aspect);
      const sy = mat.cornerScaleY !== undefined ? mat.cornerScaleY : 0.08;
      const axCols = [ink.x, ink.y, ink.z];
      for (let axis = 0; axis < 3; axis++) {
        const c = axCols[axis];
        const ex = px + VIEW[4 + axis] * sx;
        const ey = py + VIEW[8 + axis] * sy;
        v[k++] = px; v[k++] = py; v[k++] = 0.5;
        v[k++] = c[0]; v[k++] = c[1]; v[k++] = c[2]; v[k++] = c[3];
        v[k++] = ex; v[k++] = ey; v[k++] = 0.5;
        v[k++] = c[0]; v[k++] = c[1]; v[k++] = c[2]; v[k++] = c[3];
      }
    }
    device.queue.writeBuffer(lineBuf, 0, v, 0, k); stats.chromeWrites++;
    if (latticeCount) { device.queue.writeBuffer(latticeBuf, 0, LATTICE, 0, latticeCount * 4); device.queue.writeBuffer(inkBuf, 0, INK_V); }
    cachedHasSlice = n > 15;
    return cachedHasSlice;                                        // whether the slice rectangle is in the buffer (the box and the axes always are)
  }
  /** the chrome, as two independently switched objects over one buffer.  `all` ignores the switches (the ink proofs). */
  function drawChrome(pass, lp, mat, hasSlice, all) {
    const box = all || mat.frame !== false, axes = all || mat.axis !== false, slice = hasSlice && box;
    if (!box && !axes) return;
    pass.setPipeline(lp.line); pass.setBindGroup(0, lineBind); pass.setVertexBuffer(0, lineBuf);
    if (box && (all || !mat.frameMode || mat.frameMode === 'box')) pass.draw(LINE_AT.box[1], 1, LINE_AT.box[0]);
    if (box && !all && latticeCount) { pass.setPipeline(lp.lattice); pass.setVertexBuffer(0, latticeBuf); pass.draw(latticeCount, 1, 0); pass.setPipeline(lp.line); pass.setVertexBuffer(0, lineBuf); }   // same order, same blend: the lattice between the box and the axes
    if (axes && (all || mat.axisMode !== 'corner')) pass.draw(LINE_AT.axes[1], 1, LINE_AT.axes[0]);
    if (axes && !all && mat.axisMode === 'corner') { pass.setBindGroup(0,cornerBind); pass.draw(6,1,cornerStart); pass.setBindGroup(0,lineBind); }
    if (slice) pass.draw(LINE_AT.slice[1], 1, LINE_AT.slice[0]);
  }
  function encodeRender(enc, target, obs, mat, w, h, tw) {
    writeView(obs, mat, w, h);
    const sl = writeLines(mat);
    const desc = { colorAttachments: [{ view: target, loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store' }] };
    if (tw) desc.timestampWrites = tw;
    const pass = enc.beginRenderPass(desc);
    pass.setPipeline(renderPipeline); pass.setBindGroup(0, renderBind); pass.draw(3);
    drawChrome(pass, linePipeline, mat, sl);
    pass.end();
  }

  /** ONE submission: optional reference capture, optional reconstruct, then present.
      `molecule: true` (and a molecule set) dispatches molWgsl's kernel instead of packModes/encodeCompute, and only when
      something it depends on changed.  A set molecule OWNS the volume: while one is set the eigenmode reconstruct
      stands down whatever `modes` the caller passes, so the app loop cannot overwrite a molecular field — pass
      `molecule: false`, or setMolecule(null), to hand the kernel back. */
  function frame({ modes = null, refModes = null, obs, mat, molecule = undefined }) {
    const t0 = performance.now();
    const enc = device.createCommandEncoder();
    const molOn = !!(molSpec && molMat) && molecule !== false;
    if (molOn) {
      if (molDirty || molRefDirty) {
        if (molRefDirty) { encodeMolecule(enc, 1); refValid = true; refGeneration = generation + 1; molRefDirty = false; }
        if (molDirty) { stats.molAO = encodeMolecule(enc, 0); stats.molDispatches++; molDirty = false; generation++; stats.generation = generation; stats.reconstructs++; stats.lastReconstructWall = t0; }
      }
    } else {
    if (refModes) { encodeCompute(enc, 1, refModes); refValid = true; refGeneration = generation + 1; }
    if (modes) { stats.modesRendered = encodeCompute(enc, 0, modes); generation++; stats.reconstructs++; stats.generation = generation; stats.lastReconstructWall = t0; }
    }
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
    let buf;
    try {
      if (!out._rp) { out._rp = makeRenderPipeline('rgba8unorm'); out._lp = makeLinePipeline('rgba8unorm'); }
      const rp = out._rp, lp = out._lp;
      const enc = device.createCommandEncoder();
      writeView(obs, mat, w, h); const sl = writeLines(mat);
      const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store' }] });
      pass.setPipeline(rp); pass.setBindGroup(0, renderBind); pass.draw(3);
      drawChrome(pass, lp, mat, sl);
      pass.end();
      const bpr = Math.ceil(w * 4 / 256) * 256;
      buf = device.createBuffer({ size: bpr * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
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
      buf.unmap();
      return { w, h, total: w * h, nonBlack, bright, meanLum: lum / (w * h), meanChroma: hue / (w * h), hash: hsh.toString(16) };
    } finally { buf?.destroy(); tex.destroy(); }
  }
  /** THE CHROME AS THE SCREEN GETS IT (wave 48).  readPixels renders the volume and returns aggregates; this
      renders the LINES ALONE over the stage's own ground (mat.bg, not black — the light theme's near-black frame
      is only legible against the light stage it is drawn on) and classifies every pixel that carries chroma.
      It is the colour proof that reads the rendered image rather than the buffer writeLines just filled. */
  async function linePixels(obs, mat, w = 256, h = 256) {
    const tex = device.createTexture({ size: [w, h], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
    let buf;
    try {
      if (!out._lp) { out._rp = makeRenderPipeline('rgba8unorm'); out._lp = makeLinePipeline('rgba8unorm'); }
      const enc = device.createCommandEncoder();
      writeView(obs, mat, w, h); const sl = writeLines(mat);
      const bg = mat.bg || DEFAULT_BG;
      const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', clearValue: { r: bg[0], g: bg[1], b: bg[2], a: 1 }, storeOp: 'store' }] });
      drawChrome(pass, out._lp, mat, sl);
      pass.end();
      const bpr = Math.ceil(w * 4 / 256) * 256;
      buf = device.createBuffer({ size: bpr * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
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
      buf.unmap();
      return { w, h, buckets: B, top, ground, darkest: Math.round(darkest), darkestPx };
    } finally { buf?.destroy(); tex.destroy(); }
  }
  async function sampleVoxel(i, j, k) {
    const buf = device.createBuffer({ size: 256, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    try {
      const enc = device.createCommandEncoder();
      enc.copyTextureToBuffer({ texture: psiTex, origin: [i, j, k] }, { buffer: buf, bytesPerRow: 256, rowsPerImage: 1 }, [1, 1, 1]);
      device.queue.submit([enc.finish()]);
      await buf.mapAsync(GPUMapMode.READ);
      const u = new Uint16Array(buf.getMappedRange());
      const re = f16(u[0]), im = f16(u[1]);
      buf.unmap();
      const x = (i + 0.5) / res * 2 * half - half, y = (j + 0.5) / res * 2 * half - half, z = (k + 0.5) / res * 2 * half - half;
      return { re, im, x, y, z };
    } finally { buf.destroy(); }
  }
  /** Σ|ψ|² dV over the grid, the max density, and a hash — the whole cache read back */
  async function fieldDigest() {
    const bpr = res * 8, size = bpr * res * res;
    const buf = device.createBuffer({ size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    try {
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
      buf.unmap();
      return { integral: integral * dV, maxRho, hash: hsh.toString(16), nan, res, half, generation };
    } finally { buf.destroy(); }
  }
  async function readStats() {
    const buf = device.createBuffer({ size: 16, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    try {
      const enc = device.createCommandEncoder(); enc.copyBufferToBuffer(statsBuf, 0, buf, 0, 16); device.queue.submit([enc.finish()]);
      await buf.mapAsync(GPUMapMode.READ); const f = new Float32Array(buf.getMappedRange().slice(0)); buf.unmap();
      return { rhoMax: f[0], refMax: f[1] };
    } finally { buf.destroy(); }
  }

  /**
   * GPU THROUGHPUT, the honest number this browser can give (Firefox zeroes timestamp queries and
   * polls completion at ~100 ms): encode n frames back-to-back into an offscreen target of the
   * canvas' size, wait once for the GPU, and divide.  Returns ms per frame for
   * reconstruct+present, reconstruct only, and present only.
   * `targetMs` (optimization 2026-09-24, K9 · AUDIT-A FA5; tools only): grow n, for each of the three roads, until ONE
   * batch lasts at least that long — Firefox resolves completion on a ~100 ms tick, so a sub-millisecond frame needs a
   * batch of seconds before the division means anything (2500 is the audit's rule).  Absent, n and the result are what
   * they always were.
   */
  async function throughput({ modes, obs, mat, n = 60, targetMs = 0 }) {
    const w = canvas.width, h = canvas.height;
    const tex = device.createTexture({ size: [w, h], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT });
    try {
      if (!out._rp) { out._rp = makeRenderPipeline('rgba8unorm'); out._lp = makeLinePipeline('rgba8unorm'); }
      const view = tex.createView();
      const run = async (doCompute, doRender, m = n) => {
        await device.queue.onSubmittedWorkDone();
        const t0 = performance.now();
        const enc = device.createCommandEncoder();
        for (let i = 0; i < m; i++) {
          if (doCompute) encodeCompute(enc, 0, modes);
          if (doRender) {
            writeView(obs, mat, w, h); const sl = writeLines(mat);
            const pass = enc.beginRenderPass({ colorAttachments: [{ view, loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store' }] });
            pass.setPipeline(out._rp); pass.setBindGroup(0, renderBind); pass.draw(3);
            drawChrome(pass, out._lp, mat, sl);
            pass.end();
          }
        }
        device.queue.submit([enc.finish()]);
        await device.queue.onSubmittedWorkDone();
        return (performance.now() - t0) / m;
      };
      if (targetMs > 0) {                                        // each road sized on its own: the reconstruct alone is ms, not the frame's
        const grow = async (c, r) => { for (let m = n; ; ) { const T = (await run(c, r, m)) * m; if (T >= targetMs || m >= 100000) return { m, ms: T / m }; m = T < targetMs / 6 ? m * 4 : Math.ceil(m * targetMs * 1.2 / T); } };
        const B = await grow(true, true), C = await grow(true, false), R = await grow(false, true);
        return { frameMs: +B.ms.toFixed(4), reconstructMs: +C.ms.toFixed(4), presentMs: +R.ms.toFixed(4), n: B.m, nReconstruct: C.m, nPresent: R.m, targetMs, w, h, res, modes: modes.length, steps: Math.min(mat.steps || 160, stepCap) };
      }
      const both = await run(true, true), compute = await run(true, false), render = await run(false, true);
      return { frameMs: +both.toFixed(3), reconstructMs: +compute.toFixed(3), presentMs: +render.toFixed(3), n, w, h, res, modes: modes.length, steps: Math.min(mat.steps || 160, stepCap) };
    } finally { tex.destroy(); }
  }
  /* ── THE MOLECULAR API (wave: CHEMISTRY) ────────────────────────────────────────────────────────────────────
     The call order is setMolecule → setMoleculeMatrix → frame({ molecule: true }) (or reconstructMolecule()). */
  /** upload the shells and mark the field molecular; `null` hands the volume back to the eigenmode kernel */
  function setMolecule(spec) {
    if (!spec) { molSpec = null; molPack = null; molMat = null; molDirty = false; molRefDirty = false; refValid = false; return null; }
    const pack = packMolecule(spec);
    molTier = molTierFor(pack.nAO);
    device.queue.writeBuffer(molShellBuf, 0, pack.shell, 0, pack.nShell * 8);
    device.queue.writeBuffer(molAlphaBuf, 0, pack.alpha, 0, pack.nPrim);
    device.queue.writeBuffer(molWBuf, 0, pack.weight, 0, pack.nWeight);
    molSpec = spec; molPack = pack; molDirty = true;
    if (spec.half !== undefined) { if (!(spec.half > 0)) throw new Error('field: a molecule spec half must be positive'); half = spec.half; }
    return { nAO: pack.nAO, nShell: pack.nShell, nPrim: pack.nPrim, nWeight: pack.nWeight, expsPerVoxel: pack.nExp, cap: MOL_CAPS[molTier], half };
  }
  /** the volume's matrix.  'density' and 'diff': M = Float32Array(nAO²), symmetric Re D, ρ = Σ_μν M_μν χ_μ χ_ν and
      the texel is (√ρ, 0).  'signed': the same n² matrix WITHOUT the square root — the texel is the signed value,
      read by 'real' as two-colour lobes, which is what a difference of densities needs (see the header).
      'orbital': M = Float32Array(nAO), ψ = Σ_μ c_μ χ_μ and the texel is the signed (ψ, 0),
      or M = { re, im } — two Float32Array(nAO) — for a COMPLEX orbital, whose texel is the full (ψ_re, ψ_im) so
      'phase' reads arg ψ over the whole turn (the ORBITALS register).  Both vectors ride in the one matrix buffer,
      the real part at 0 and the imaginary part at nAO, which is what the kernel's kind 2 reads.
      `ref: true` also writes this volume into refTex, which is the ρ_ref view 'diff' subtracts. */
  function setMoleculeMatrix(M, { kind = 'density', ref = false } = {}) {
    if (!molSpec) throw new Error('field: setMoleculeMatrix before setMolecule');
    if (kind !== 'density' && kind !== 'diff' && kind !== 'orbital' && kind !== 'signed') throw new Error(`field: unknown molecule matrix kind '${kind}'`);
    const n = molPack.nAO;
    const cplx = !!(kind === 'orbital' && M && !M.length && M.re && M.im);      // a bare array is still the real path, untouched
    if (cplx) {
      if (M.re.length !== n || M.im.length !== n) throw new Error(`field: a complex orbital needs two vectors of ${n}, got ${M.re.length} and ${M.im.length}`);
      if (!molCplx || molCplx.length !== 2 * n) molCplx = new Float32Array(2 * n);
      molCplx.set(M.re, 0); molCplx.set(M.im, n);
      device.queue.writeBuffer(molMatBuf, 0, molCplx, 0, 2 * n);
      molMat = molCplx; molKind = 2; molKindName = kind; molDirty = true;
      if (ref) molRefDirty = true;
      return { kind, nAO: n, length: 2 * n, complex: true, ref: !!ref };
    }
    const want = kind === 'orbital' ? n : n * n;
    if (!M || M.length !== want) throw new Error(`field: kind '${kind}' needs ${want} numbers, got ${M ? M.length : 0}`);
    const src = M instanceof Float32Array ? M : Float32Array.from(M);
    device.queue.writeBuffer(molMatBuf, 0, src, 0, want);
    molMat = src; molKind = kind === 'orbital' ? 1 : kind === 'signed' ? 3 : 0; molKindName = kind; molDirty = true;
    if (ref) molRefDirty = true;
    return { kind, nAO: n, length: want, complex: false, ref: !!ref };
  }
  /** ONE molecular dispatch, submitted on its own — for a caller that does not own the app's frame loop */
  function reconstructMolecule() {
    if (!molSpec || !molMat) throw new Error('field: reconstructMolecule needs setMolecule then setMoleculeMatrix');
    const t0 = performance.now();
    const enc = device.createCommandEncoder();
    if (molRefDirty) { encodeMolecule(enc, 1); refValid = true; refGeneration = generation + 1; molRefDirty = false; }
    stats.molAO = encodeMolecule(enc, 0); stats.molDispatches++;
    device.queue.submit([enc.finish()]);
    molDirty = false; generation++; stats.generation = generation; stats.reconstructs++; stats.lastReconstructWall = t0;
    stats.molMs = performance.now() - t0;
    return { generation, res, half, nAO: molPack.nAO, nShell: molPack.nShell, kind: molKindName, encodeMs: +stats.molMs.toFixed(3) };
  }
  /** the honest dispatch cost: n dispatches in ONE compute pass, ONE wait, divided — the method `throughput` uses,
      because Firefox zeroes timestamp queries and polls completion at ~100 ms.  NO queue.writeBuffer and no extra
      pass inside the timed region: measured here, each of those costs about 2.5 ms of staging and would be read as
      if it were the kernel — which is what a 64³ water volume timing the same as a 96³ one was telling us. */
  async function moleculeThroughput({ n = 40 } = {}) {
    if (!molSpec || !molMat) throw new Error('field: moleculeThroughput needs a molecule');
    writeMolParams(0);
    device.queue.writeBuffer(statsBuf, 0, ZERO_U32);
    await device.queue.onSubmittedWorkDone();
    const t0 = performance.now();
    const enc = device.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(molPipelines[molTier]); pass.setBindGroup(0, molBind[molTier][0]);
    const g = Math.ceil(res / 4);
    for (let i = 0; i < n; i++) pass.dispatchWorkgroups(g, g, g);
    pass.end();
    device.queue.submit([enc.finish()]);
    await device.queue.onSubmittedWorkDone();
    const ms = (performance.now() - t0) / n;
    return { msPerDispatch: +ms.toFixed(3), n, res, voxels: res ** 3, nAO: molPack.nAO, nShell: molPack.nShell, expsPerVoxel: molPack.nExp, cap: MOL_CAPS[molTier], kind: molKindName };
  }
  /* live getters (Object.assign would have copied their values once — and did, until B10 caught it) */
  Object.defineProperties(out, {
    resolution: { get: () => res, enumerable: true }, half: { get: () => half, enumerable: true }, space: { get: () => space, enumerable: true },
    generation: { get: () => generation, enumerable: true }, refValid: { get: () => refValid, enumerable: true },
    dprCap: { get: () => dprCap, enumerable: true },      // LIVE getters: Object.assign below would freeze these at their boot values
    stepCap: { get: () => stepCap, enumerable: true },
    /* …and so would it freeze THESE, which is exactly how `moleculeInfo` first came back null from a live molecule */
    molecular: { get: () => !!molSpec, enumerable: true },
    /* a CHEAP, allocation-free read of "is the volume a complex orbital right now" — `moleculeInfo` builds an
       object, and the ORBITALS register asks this once a frame to notice when another card took the matrix back */
    moleculeComplex: { get: () => molKind === 2, enumerable: true },
    moleculeInfo: { get: () => (molSpec ? { nAO: molPack.nAO, nShell: molPack.nShell, nPrim: molPack.nPrim,
      nWeight: molPack.nWeight, expsPerVoxel: molPack.nExp, cap: MOL_CAPS[molTier], kind: molKindName, complex: molKind === 2, dirty: molDirty, half, res } : null), enumerable: true } });
  Object.assign(out, {
    ok: true, device, adapter, format, stats,
    frame, throughput, readPixels, sampleVoxel, fieldDigest, readStats, lineColors, linePixels,
    setResolution, setMolecule, setMoleculeMatrix, reconstructMolecule, moleculeThroughput,
    setDomain(h) { if (h !== half) { half = h; molDirty = !!molSpec; } },
    /** 0 = position space ψ(x), 1 = momentum space φ(p): the grid then holds the Fourier transform, exactly */
    setRadialTable(arr) { device.queue.writeBuffer(radialBuf, 0, arr instanceof Float32Array ? arr : new Float32Array(arr)); refValid = false; },
    setSpace(s) { s = s | 0; if (s !== space) { space = s; refValid = false; } },
    /** upload a 256×RGBA phase palette (Float32Array(1024), values 0..1) — an OBSERVER product: ψ is untouched */
    setPalette(lut) { lastLUT = lut instanceof Float32Array ? lut : new Float32Array(lut); uploadPalette(); },
    /* ── THE GAMUT (wave 54) ────────────────────────────────────────────────────────────────────────────────
     * `support` is measured, never assumed: `canvas` is the WebIDL getter probe above, `css` asks the engine
     * whether it parses color(display-p3 …), and `display` is the media query — with the caveat that Firefox
     * under privacy.resistFingerprinting answers false to that one unconditionally, so it is REPORTED and never
     * used as a gate.  setGamut refuses anything the canvas cannot honour and returns what is actually in force,
     * so the caller can never end up believing the canvas is somewhere it is not — which is the whole law:
     * the DOM and the canvas are in the same space, or the feature is off. */
    get gamutSupport() { return { canvas: canvasP3, css: cssP3, display: displayP3, reason: canvasP3 ? '' : GAMUT_WHY }; },
    get gamut() { return gamut; },
    setGamut(id) {
      const want = (id === 'p3' || id === 'p3-vivid') ? id : 'srgb';
      if (want !== 'srgb' && !(canvasP3 && cssP3)) return gamut;          // never a state where the DOM is P3 and the canvas is not
      if (want === gamut) return gamut;
      gamut = want;
      try { ctx.configure(want === 'srgb' ? { device, format, alphaMode: 'opaque' } : { device, format, alphaMode: 'opaque', colorSpace: 'display-p3' }); } catch (_) { gamut = 'srgb'; ctx.configure({ device, format, alphaMode: 'opaque' }); }
      uploadPalette();
      return gamut;
    },
    /** the colour a DOM token must wear so that it matches what the canvas will paint — one function, both sides */
    gamutInk(rgb) { return gamutMap(rgb); },
    /* THE DEVICE-PIXEL CEILING (wave 51).  A desktop is capped at 2 and always was; a phone reports 3, and
       three physical pixels per CSS pixel of a ray-marched volume is 2.25 x the fragments for a difference
       nobody can see at arm's length.  The cap is a NUMBER the caller owns (rack.js drops it at the phone
       breakpoint), not a branch in here: the renderer knows nothing about layout. */
    /* REAL UNLOAD ONLY (pagehide without bfcache). GPU state is deliberately kept across backgrounding
       (rack.js keeps the textures warm on unified-memory hardware); this is the other case — the page is
       going away — and here the ordered teardown is the mitigation for a driver that otherwise has to reap
       two 16 MiB textures and a device behind a navigation. Firefox has crashed whole on exactly that. */
    dispose() {
      if (out.disposed) return; out.disposed = true; out.ok = false;
      try { if (psiTex) psiTex.destroy(); if (refTex) refTex.destroy(); } catch (_) {}
      try { for (const b of paramsBuf) b.destroy(); statsBuf.destroy(); viewBuf.destroy(); palBuf.destroy(); } catch (_) {}
      try { for (const b of molParamsBuf) b.destroy(); molShellBuf.destroy(); molAlphaBuf.destroy(); molWBuf.destroy(); molMatBuf.destroy(); } catch (_) {}
      try { ctx.unconfigure(); } catch (_) {}
      try { device.destroy(); } catch (_) {}
    },
    /** the windows over the stage, as [x0, y0, x1, y1] in CSS pixels of the canvas box; at most 32. Returns
     *  true when the block changed (the caller presents). Lines are not drawn inside these rectangles. */
    setOcclusion(rects) {
      const k = canvas.width / Math.max(1, cssW), n = Math.min(32, rects.length);
      let sig = String(n); for (let i = 0; i < n; i++) sig += '|' + rects[i].map((v) => Math.round(v)).join(',');
      if (sig === occSig) return false; occSig = sig;
      OCC_U[0] = n; for (let i = 0; i < n; i++) { const r = rects[i]; OCC_F[i * 4] = r[0] * k; OCC_F[i * 4 + 1] = r[1] * k; OCC_F[i * 4 + 2] = r[2] * k; OCC_F[i * 4 + 3] = r[3] * k; }
      device.queue.writeBuffer(occBuf, 0, OCC); return true;
    },
    setDprCap(n) { dprCap = Math.max(0.5, Math.min(4, +n || 2)); return dprCap; },
    setStepCap(n) { stepCap = Number.isFinite(n) ? Math.max(16, Math.min(1024, +n)) : Infinity; return stepCap; },
    /* The CSS size is read from a ResizeObserver, not from clientWidth on every frame: the frame loop writes
       body attributes before it presents, so a per-frame clientWidth read forced a synchronous layout. */
    resize(scale) {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap) * (scale || 1);
      const w = Math.max(1, Math.round(cssW * dpr)), h = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
      return false;
    }
  });
  return out;
}
