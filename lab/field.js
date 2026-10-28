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
 * ENERGY REFERENCE AND KERNEL (hydrogen): the closed form, hydrogen.js `energy` = −1/(2n²) Eh; kernel M (Mode records, closed forms in-kernel).
 */
import { modeTable, NMAX } from './hydrogen.js';
import { qmul, qnormalize, adjoint, expPure } from './rotor4.js';
import { gpuBoot, requestGpu } from './gpu-boot.js';
import { evaluator, shellsFromField } from './molecular-field.js';
import { CPK, bondsOf, vdwRadius } from './elements.js';

/* iteration 008 W: WAVE's OBSERVABLE is DENSITY · PHASE · RE · IM (WAVE_VIEWS).  Re+Im (index 5, two pictures in one volume) left the
   shader; its index stays retired, never reused, and a saved one opens as PHASE.  Δρ (4) stays in the shader (the reference volume
   and MOLECULES' kick) but left WAVE's seg: a saved one opens as DENSITY.  waveView() is that one mapping, for every road in. */
export const VIEW = { density: 0, phase: 1, real: 2, imag: 3, diff: 4 };
export const VIEW_NAMES = ['density', 'phase', 'real', 'imag', 'diff'];
export const WAVE_VIEWS = Object.freeze(['density', 'phase', 'real', 'imag']);
/** a saved or named view (an index or a name, `reim` = 5 included) → the WAVE observable it opens as, or null for a name WAVE never had
 *  (MOLECULES' orbital · esp · spin …, a stray index): the caller says what an unknown one means */
export function waveView(v) { const n = typeof v === 'number' ? (v === 5 ? 'reim' : VIEW_NAMES[v]) : String(v); return WAVE_VIEWS.includes(n) ? n : n === 'reim' ? 'phase' : n === 'diff' ? 'density' : null; }
/** how the same observable is DRAWN: a cloud, a bounded plateau (lit surface), world-locked grains (DUST), octave bands …
 *  iteration 008 G: GRAIN (2) joined DUST — its index stays retired, never reused (the shader draws a stray 2 as DUST) and a saved one
 *  opens as DUST; drawStyle() is that one mapping, for every road in.
 *  iteration 010 X7: SHELL ± (`glassSigned`, 8) is APPENDED — never renumber — SIGNED's lobes through SHELL's transfer; a build older
 *  than it reads a saved 8 as an unknown style, so drawStyle() opens it as CLOUD there. */
export const STYLE = { cloud: 0, solid: 1, grain: 2, signed: 3, bands: 4, dust: 5, glass: 6, additive: 7, glassSigned: 8, balls: 9, sticks: 10, esp: 11 };
export const STYLE_NAMES = ['cloud', 'solid', 'grain', 'signed', 'bands', 'dust', 'glass', 'additive', 'glassSigned', 'balls', 'sticks', 'esp'];
/** iteration 014 B: THE THREE VIEWS (APPENDED: 9 BALLS, 10 STICKS, 11 ESP) draw the MOLECULE, not the volume — the atoms setAtoms gave (an older
 *  build opens a saved 9–11 as CLOUD; with no atoms set the shader draws them as CLOUD) */
export const ATOM_STYLES = Object.freeze([9, 10, 11]);
/** a saved or named style (an index or a name) → the style it opens as: GRAIN → DUST, an unknown one → CLOUD */
export function drawStyle(v) { const n = typeof v === 'number' ? STYLE_NAMES[v] : String(v); return n === 'grain' ? 'dust' : STYLE[n] === undefined ? 'cloud' : n; }
/** THE KNEE's default (008 Q, Josh 10-19: "somewhat opaque but slightly see-through"): 3, a soft shoulder — measured at EXPOSURE 1, the
 *  densest rays through H 2pz keep 12.3 % of the ground and benzene's HOMO 14.6 % (0.7 % and 0.8 % at the plain exponential 0.6).  The
 *  boot's mat, the KNEE knob, a new project and an absent knee read it; a saved project keeps its own (the one demo, WAVE DANCER PROTOTYPE, says 3 since iteration 009). */
export const KNEE_DEFAULT = 3;
/** THE KNEE's q (iteration 008 G, field.js kneeT): ln(KNEE / 0.6) — the formula's pivot 0.6 is the plain exponential (q = 0, the old
 *  arithmetic drawn bit for bit); an absent knee is the default's q */
export function kneeQ(k) { return Math.log((Number.isFinite(k) && k > 0 ? k : KNEE_DEFAULT) / 0.6); }
export const SLICE = { off: 0, clip: 1, slab: 2 };
/** iteration 014 B: THE THREE VIEWS' defaults — STICKS' radius (bohr, 0.2 Å), the probe (bohr, water's 1.4 Å), the map's RANGE (±φ, a.u.) and its surfaces */
/** iteration 016 S1: ESP's soft edge from WAVE's SOFT (γ 0.3 … 2.2, `reverse`, so right is softer): 0 at γ 2.2 — the knob's left end, the hard ISO
 *  surface exactly — up to 1 at γ 0.3; the default γ 0.7 reads e ≈ 0.79 */
export const espSoftOf = (g) => Math.min(1, Math.max(0, (2.2 - (Number.isFinite(g) ? g : 0.7)) / 1.9));
export const STICK_R = 0.38, PROBE_R = 1.4 / 0.52917721092, ESP_RANGE = 0.1, ESP_SURF = Object.freeze(['iso', 'sas', 'ses']);
export const MAX_MODES = 320;                                 // the whole 140-state register fits (a gas packet populates every m)
const MODE_BYTES = 112;                                  // 7 vec4: nlm, c, lag0, lag1, leg0, leg1, ctr

const COMPUTE_WGSL = /* wgsl */`
struct Mode { nlm: vec4<f32>, c: vec4<f32>, lag0: vec4<f32>, lag1: vec4<f32>, leg0: vec4<f32>, leg1: vec4<f32>, ctr: vec4<f32> };   // ctr: the mode's own centre (a molecule puts orbitals on its nuclei)
struct Params { n: u32, count: u32, slot: u32, space: u32, half: f32, p1: f32, p2: f32, p3: f32 };   // space: 0 position (hydrogen), 1 momentum (hydrogen), 2 oscillator, 3 the spherical well, 4 two-electron conditional, 5 an incoherent sum of two coherent groups (a one-electron DENSITY)
@group(0) @binding(0) var<uniform> P: Params;
@group(0) @binding(1) var<storage, read> modes: array<Mode>;
@group(0) @binding(2) var outTex: texture_storage_3d<rgba16float, write>;
@group(0) @binding(3) var<storage, read_write> stats: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read> radial: array<f32>;   // space 6: tabulated radial functions, 256 samples per (n_r, l) row (QUARKONIUM)
@group(0) @binding(5) var<storage, read> gtab: array<vec2<f32>>;   // space 3, OPT-IN (K7): the axial gas's Hermite-256 radial table, (j_l(z u), h·z·j_l′(z u)) per row
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
/* the physicists' Hermite H_n(x), n ≤ 5, by H_{k+1} = 2xH_k − 2kH_{k−1} — the SEPARABLE oscillator's factor (space 7, 0.9.4 S1) */
fn herm(n: u32, x: f32) -> f32 { var a = 1.0; var b = 2.0 * x; if (n == 0u) { return a; } for (var k = 1u; k < n; k++) { let c = 2.0 * x * b - 2.0 * f32(k) * a; a = b; b = c; } return b; }

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
      let D = M.leg0.x + ct * (M.leg0.y + ct * (M.leg0.z + ct * (M.leg0.w + ct * (M.leg1.x + ct * (M.leg1.y + ct * M.leg1.z)))));   // leg1.z: d^m P_6, n = 7's i shell (iteration 008 A7); 0 for every other record, so ct·0 adds nothing
      var f = 0.0;
      if (P.space == 0u || P.space == 5u) {
        /* POSITION  ψ = norm · e^{−ρ/2} ρ^l L(ρ) · Y,  ρ = 2r/n  (L = Laguerre) */
        let rho = 2.0 * r / n;
        let L = M.lag0.x + rho * (M.lag0.y + rho * (M.lag0.z + rho * (M.lag0.w + rho * (M.lag1.x + rho * (M.lag1.y + rho * M.lag1.z)))));
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
        if (r < aa) {                                          // a BRANCH, not select(): select ran the recurrence outside the wall too
          if (M.lag0.w > 0.5) {                                // K7 (opt-in, lag0.w = row + 1): cubic Hermite on the gas table, u = r/a
            let xq = clamp(r / aa, 0.0, 1.0) * 255.0; let i0 = min(u32(floor(xq)), 254u); let s = xq - f32(i0); let rb = (u32(M.lag0.w) - 1u) * 256u;
            let p0 = gtab[rb + i0]; let p1 = gtab[rb + i0 + 1u]; let s2 = s * s; let s3 = s2 * s;
            let R = (2.0 * s3 - 3.0 * s2 + 1.0) * p0.x + (s3 - 2.0 * s2 + s) * p0.y + (3.0 * s2 - 2.0 * s3) * p1.x + (s3 - s2) * p1.y;
            f = M.c.z * R * ipow(st, am) * Dw;
          } else { f = M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw; }   // lag0.w = 0, every record by default: the recurrence
        }
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
        let L = M.lag0.x + t * (M.lag0.y + t * (M.lag0.z + t * (M.lag0.w + t * (M.lag1.x + t * (M.lag1.y + t * M.lag1.z)))));
        f = M.c.z * ipow(ro, l) * L * exp(-0.5 * t) * ipow(st, am) * D;
      } else if (P.space == 7u) {
        /* SEPARABLE (0.9.4 S1)  ψ = norm · ∏ᵢ H_{nᵢ}(aᵢqᵢ) · e^{−½|a∘q|²}: nlm = (n_x, n_y, n_z, 0), lag0 = (a_x, a_y, a_z, ·), c.w = the form (0 the
           oscillator); no Y, no D, and m = 0 so the azimuthal phase below is 1 */
        let qs = (pos - M.ctr.xyz) * M.lag0.xyz;
        f = M.c.z * herm(u32(M.nlm.x), qs.x) * herm(u32(M.nlm.y), qs.y) * herm(u32(M.nlm.z), qs.z) * exp(-0.5 * dot(qs, qs));
        /* THE CUBE (0.9.4 S2, c.w = 1): lag0 = (kᵢ = nᵢπ/L, L); ψ = norm · ∏ᵢ sin(kᵢ(qᵢ + L/2)) inside |qᵢ| < L/2, 0 outside — the walls are the envelope */
        if (M.c.w > 0.5) { let h = 0.5 * M.lag0.w; let sv = sin(qs + M.lag0.xyz * h); f = select(0.0, M.c.z * sv.x * sv.y * sv.z, all(abs(pos - M.ctr.xyz) < vec3<f32>(h))); }
      } else {
        /* MOMENTUM  φ = norm · t^{l/2} P(t) (1+t)^{−(n+1)} · Y,  t = n²p²  (P = the Podolsky–Pauling numerator;
           the (−i)^l phase is folded into c on the CPU).  Same record, different envelope. */
        let q = n * r; let t = q * q;
        let L = M.lag0.x + t * (M.lag0.y + t * (M.lag0.z + t * (M.lag0.w + t * (M.lag1.x + t * (M.lag1.y + t * M.lag1.z)))));
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
/* THE BEAT EQUALIZER's kernel (0.6.0 B1), DERIVED from COMPUTE_WGSL, never a copy, so the locked text above stays byte for byte
   what FLAT runs.  Position hydrogen only: seven complex shell accumulators acc_n (iteration 009 N7: the seventh band; shell n = c.w − 1, the exponent n + 1 that a Z
   table keeps integer) and the incoherent sum inc = Σ|c_a ψ_a|²; then ρ′ = Σ_{nn′} Re Γ_{nn′} acc_n acc̄_{n′} + κ·inc from the
   uniform G (lab/equalizer.js) and one of three stores: 0 a pure state Σ_n Γ̄_{0n} acc_n (the pulse: Γ = uu†), 1 a density
   (√ρ′, 0), 2 signed (sign·√|ρ′|, 0), zero under the relative floor.  The presenter reads each as it reads today's texels. */
const EQ_G = 4 * Math.ceil(NMAX * NMAX / 2);     // Γ's floats padded to a vec4 (100 for n ≤ 7), then κ, mode, floor: the uniform's layout (X6)
const EQ_WGSL = (() => {
  let c = once(COMPUTE_WGSL, 'var<workgroup> wmax', `struct EQ { g: array<vec4<f32>, ${EQ_G / 4}>, k: f32, mode: f32, floor: f32, pad: f32 };   // Γ row-major ${NMAX} × ${NMAX}, (re, im) per entry (${2 * NMAX * NMAX} of the ${EQ_G})\n@group(0) @binding(6) var<uniform> G: EQ;\nvar<workgroup> wmax`);
  c = once(c, 'var psiB = vec2<f32>(0.0, 0.0);', `var psiB = vec2<f32>(0.0, 0.0); var acc: array<vec2<f32>, ${NMAX}>; var inc = 0.0;`);
  c = once(c, 'if (P.space == 5u && M.ctr.w > 0.5) { psiB += f * ce; } else { psi += f * ce; }', `{ let s = min(u32(M.c.w) - 2u, ${NMAX - 1}u); acc[s] += f * ce; inc += f * f * dot(M.c.xy, M.c.xy); }`);
  c = once(c, 'if (P.space == 5u) { psi = vec2<f32>(sqrt(dot(psi, psi) + dot(psiB, psiB)), 0.0); }', `var rho = G.k * inc; var u = vec2<f32>(0.0); var s2 = 0.0;
    for (var i = 0u; i < ${NMAX}u; i++) {
      let a = acc[i]; let g0 = select(G.g[i / 2u].xy, G.g[i / 2u].zw, (i & 1u) == 1u); s2 += dot(a, a);
      u += vec2<f32>(g0.x * a.x + g0.y * a.y, g0.x * a.y - g0.y * a.x);
      for (var j = 0u; j < ${NMAX}u; j++) { let q = i * ${NMAX}u + j; let g = select(G.g[q / 2u].xy, G.g[q / 2u].zw, (q & 1u) == 1u); let b = acc[j];
        rho += g.x * (a.x * b.x + a.y * b.y) - g.y * (a.y * b.x - a.x * b.y); }
    }
    if (G.mode < 0.5) { psi = u; } else if (G.mode < 1.5) { psi = vec2<f32>(sqrt(max(rho, 0.0)), 0.0); }
    else { psi = vec2<f32>(select(sign(rho) * sqrt(abs(rho)), 0.0, abs(rho) < G.floor * s2), 0.0); }`);
  return c.split('P.space').join('0u');                       // the dead branches fold
})();

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
 * rgba16float volumes of √ρ cannot see a weak kick at all: an 11-bit mantissa on √ρ is ≈ 1e-3 RMS relative on ρ, and
 * a κ = 1e-3 kick moves ρ by about that much.  The difference is formed in f64 on the CPU and quantised ONCE.
 * ONE exp per primitive per EXPONENTIAL GROUP.  Two things share: every Cartesian component of a shell (they carry
 * the same exponents by construction), and every shell on one centre with one exponent list — which is what makes
 * STO-3G water 12 exponentials a point and not 15, and benzene 54 and not 72, because lab/md.js splits an sp record
 * into an l = 0 and an l = 1 shell over the SAME `exps` array (MATH-H2O ROUND 3 · SOL, kill 5).  The packer marks
 * such a shell `share` and the kernel keeps the previous group's exponentials in a register array.
 * f32 THROUGHOUT, and the O 1s hazard stated: the cusp sums three primitives of weight ≈ 4.25 against a total
 * ρ(O) = 193.31, so the density at a nucleus is f32-accurate to about 1e-6 relative.  The rgba16float texel is the
 * coarser number by three orders — within one f16 ulp on √ρ, rounded toward zero on the rig: ρ to 3e-4 of ρmax, 2e-3 relative at the worst voxel
 * (≈ 1e-3 RMS; tests/helpers/field-law.mjs, water at 64³) — and it, not this sum, sets any read-back gate's tolerance.  Sorting small terms first is not required.
 */
/** ONE source, two knobs: `cap` is the AO ceiling this pipeline's χ tile holds (MOL_CAPS) and `wg` its lanes — 32 (4 × 4 × 2) for
    the cap-128 tier on a 16 KiB device (0.4.0 S4c); at 64 the text is the pre-S4c source byte for byte (the lock's program) */
const MOL_HEAD = /* wgsl */`
struct Shell { cx: f32, cy: f32, cz: f32, l: u32, pOff: u32, nP: u32, aOff: u32, wOff: u32 };   // l carries bit 8 = share the previous group's exponentials
struct MP { n: u32, nAO: u32, nShell: u32, kind: u32, half: f32, slot: u32, r0: f32, r1: f32 };   // kind: 0 density (√ρ), 1 orbital (signed ψ), 2 complex orbital (ψ_re, ψ_im), 3 signed matrix (Δρ, no root)
@group(0) @binding(0) var<uniform> P: MP;
@group(0) @binding(1) var<storage, read> shells: array<Shell>;
@group(0) @binding(2) var<storage, read> alphas: array<f32>;
@group(0) @binding(3) var<storage, read> wts: array<f32>;
@group(0) @binding(4) var<storage, read> mat: array<f32>;
@group(0) @binding(5) var outTex: texture_storage_3d<rgba16float, write>;
@group(0) @binding(6) var<storage, read_write> stats: array<atomic<u32>>;`;
/* the shell loop both kernels run, up to shell s's contracted primitives `acc`; ORB_WGSL's screen goes in after r² */
const MOL_LOOP = (screen = '') => /* wgsl */`
  var dens = 0.0;
  if (all(gid < vec3<u32>(P.n, P.n, P.n))) {
    let pos = (vec3<f32>(gid) + vec3<f32>(0.5)) / f32(P.n) * (2.0 * P.half) - vec3<f32>(P.half);   // the domain, exactly as COMPUTE_WGSL reads it
    var ex: array<f32, 32>;                                   // the current exponential group's e^{−α r²}
    for (var s = 0u; s < P.nShell; s++) {
      let sh = shells[s];
      let l = sh.l & 255u;
      let dx = pos.x - sh.cx; let dy = pos.y - sh.cy; let dz = pos.z - sh.cz;
      let r2 = dx * dx + dy * dy + dz * dz;
${screen}      let nc = select(select(1u, 3u, l == 1u), 6u, l == 2u);
      if ((sh.l & 256u) == 0u) {                              // a NEW group: one exp per primitive, and only here
        for (var p = 0u; p < sh.nP; p++) { ex[p] = exp(-alphas[sh.pOff + p] * r2); }
      }
      var acc: array<f32, 6>;
      for (var c = 0u; c < nc; c++) { acc[c] = 0.0; }
      for (var p = 0u; p < sh.nP; p++) {
        let e = ex[p];
        let wb = sh.wOff + p * nc;
        for (var c = 0u; c < nc; c++) { acc[c] += wts[wb + c] * e; }
      }`;
export const molWgsl = (cap, wg = 64) => /* wgsl */`
const WG: u32 = ${wg}u;                                          // 4 × 4 × 4, the eigenmode kernel's dispatch shape${MOL_HEAD}
/* χ LIVES IN WORKGROUP MEMORY, TRANSPOSED: invocation lid owns the column chiW[ao * WG + lid], so the 64 threads
   of a workgroup read ${cap} consecutive addresses at every step of the contraction — bank-conflict-free, and off
   the per-thread scratch that a var<function> array<f32, 64> lands in.  MEASURED on an RTX 3070 at 96³: benzene
   went from 9.07 ms a dispatch to 2.80 ms and water from 0.84 to 0.50, because ~700 scratch loads a voxel through
   L1 was the entire cost — 1.3k MACs a voxel is 1.15 GMAC for the volume, which this card does in a quarter of a
   millisecond, so the arithmetic was never within an order of magnitude of being the problem. */
var<workgroup> chiW: array<f32, ${cap}u * ${wg}u>;

@compute @workgroup_size(4, 4, ${wg / 16})
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_index) lid: u32) {${MOL_LOOP()}
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
/* ── ORB_WGSL — THE ORBITAL-ONLY KERNEL (0.4.0 S4c · PLAN §10 N3, R-L2).  An orbital is Σ_μ c_μ χ_μ, O(nAO) a voxel: each
 * shell is contracted with its coefficients on the spot, so there is no χ tile and no AO ceiling but the shell table's.  A
 * shell whose widest primitive is under 1e-10 here (r² > cut = ln 1e10 / α_min, packMolecule) is skipped, a shared one with
 * its leader.  Kinds 1 and 2 only; the one workgroup array is the max reduction.  MEASURED, MEASURE.md §3: 300 AO at 96³
 * 12.0 ms plain, 3.2–3.6 ms screened (tools/perf/s4c-kernel.mjs times this module). */
export const ORB_WGSL = /* wgsl */`${MOL_HEAD}
@group(0) @binding(7) var<storage, read> cut: array<f32>;
var<workgroup> red: array<f32, 64>;
@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_index) lid: u32) {
  var amp = 0.0;
  var ampIm = 0.0;${MOL_LOOP('      if (r2 > cut[s]) { continue; }\n')}
      if (l == 1u) { acc[0] *= dx; acc[1] *= dy; acc[2] *= dz; }
      else if (l == 2u) { acc[0] *= dx * dx; acc[1] *= dx * dy; acc[2] *= dx * dz; acc[3] *= dy * dy; acc[4] *= dy * dz; acc[5] *= dz * dz; }
      for (var c = 0u; c < nc; c++) { amp += mat[sh.aOff + c] * acc[c]; }
      if (P.kind == 2u) { for (var c = 0u; c < nc; c++) { ampIm += mat[P.nAO + sh.aOff + c] * acc[c]; } }
    }
    textureStore(outTex, vec3<i32>(gid), vec4<f32>(amp, ampIm, 0.0, 0.0));
    dens = amp * amp + ampIm * ampIm;
  }
  red[lid] = dens;
  workgroupBarrier();
  if (lid == 0u) {
    var m = 0.0;
    for (var k = 0u; k < 64u; k++) { m = max(m, red[k]); }
    atomicMax(&stats[P.slot], bitcast<u32>(m));
  }
}`;
/* ── FACTOR_WGSL — THE FACTOR ROAD (0.6.1 F1), DERIVED from ORB_WGSL: a density from its occupied columns, ρ = 2 Σ_{k<K} φ_k²,
 * φ_k = Σ_μ C_μk χ_μ — O(nAO·K) a voxel and no χ tile, so a record past MAX_MOL_AO draws its density (C₆₀: 300 AO × 180).
 * K-BLOCKED: 32 φ's in registers (8 vec4, `mat` read as vec4), the screened shell loop re-run once a block (χ is cheap beside the MACs).  `mat` is row-major
 * n × K (K = P.r0, padded to 32 with zero columns), so a block reads 32 contiguous floats, the same for every lane.  Texel (√ρ, 0),
 * the density convention: the presenter is untouched.  Kind 4; compiled on the first factor matrix (`facReady`).  MEASURED (RTX 3070,
 * headless Firefox): C₆₀ 12.5 ms at 64³, 40 ms at 96³ — at 96³ B = 16 took 72 ms (twice the passes) and B = 64 223 ms (it spills). */
const FACTOR_WGSL = (() => {
  let c = once(ORB_WGSL, 'var<storage, read> mat: array<f32>;', 'var<storage, read> mat: array<vec4<f32>>;');
  c = once(c, '    for (var s = 0u; s < P.nShell; s++) {', '    var rho = 0.0;\n    for (var k0 = 0u; k0 < u32(P.r0); k0 += 32u) {\n    var phi: array<vec4<f32>, 8>;\n    for (var s = 0u; s < P.nShell; s++) {');
  return once(c, `      for (var c = 0u; c < nc; c++) { amp += mat[sh.aOff + c] * acc[c]; }
      if (P.kind == 2u) { for (var c = 0u; c < nc; c++) { ampIm += mat[P.nAO + sh.aOff + c] * acc[c]; } }
    }`, `      for (var c = 0u; c < nc; c++) { let row = ((sh.aOff + c) * u32(P.r0) + k0) / 4u; let a = acc[c]; for (var j = 0u; j < 8u; j++) { phi[j] += mat[row + j] * a; } }
    }
    for (var j = 0u; j < 8u; j++) { rho += dot(phi[j], phi[j]); }
    }
    amp = sqrt(2.0 * rho);`);
})();
/* ── CARD_WGSL — THE CARD ROAD (0.6.5 X2), DERIVED from MOL_HEAD's params and bindings 0, 4, 5, 6: a worker's N³ f32 volume in `mat`
 * (x fastest, cell centres over [−r1, r1]³, N = r0) sampled TRILINEARLY at each texel of the current res, written SIGNED (v, 0) and
 * reduced as max v², so the 'real' view divides by max |v|.  Outside the card's box the edge cell holds.  Dispatched only on `cardDirty`. */
/* ── THE POTENTIAL's POISSON PASS (iteration 014 B3) ───────────────────────────────────────────────────────────────────
 * φ = Σ Z_A/|r − R_A| − ∫ρ(r′)/|r − r′| dr′ on an M³ cell-centred grid over the field's box, from the volume the field already holds:
 *   elec   ρ per cell (the mean of 8 trilinear samples of |ψ|², psiTex's own a.u.) and its workgroup sums (Σρ, Σρ·r);
 *   core   per atom (H, Li–Ar), THE CORE'S CHARGE: the texture holds √ρ at its voxels and cannot resolve a 1s cusp, so the grid's core charge is
 *          wrong by up to an electron an atom, at random along a chain — a dipole of tens of a.u. on a fatty acid.  The free atom's Slater core
 *          (1s², and 2s²2p⁶ past Ne; the valence by Slater's rules; H's whole 1s at ζ = 1.24) is sampled EXACTLY as the texture samples (√ρ at the voxels, trilinear,
 *          squared, 8 points a cell), and n_core minus that sampled core is put back at the nucleus as a point charge;
 *   total  one workgroup: the scale s that makes the grid's electrons N_e minus those corrections, and the dipole μ;
 *   rhs    the charge q = (Σ_A Z_A·CIC_A − s·ρ)/h³ (each nucleus cloud-in-cell: its 8 weights sum to Z exactly) as 4πq·h², and the far field
 *          Q/r + μ·r/r³ as the first guess and the fixed boundary;
 *   sor    red–black over-relaxation (ω = 2/(1 + sin π/M)), ∇²φ = −4πq, 3M sweeps.
 * The grid is the molecule's box (max |coordinate| + 8 bohr, inside the volume's), M = 64 … 128 cells a side aiming at 0.35 bohr.  Its accuracy is
 * the volume's: where the texture cannot resolve the cores (a long molecule's box) the atoms' charges smear and the map is qualitative — a volume's
 * own φ grid (C1) replaces it. 
 * The total charge solved at once (nuclei and electrons together) keeps φ a small number everywhere: no cancellation of two large ones. */
const ESP_WGSL = /* wgsl */`
struct EP { M: u32, nA: u32, color: u32, nW: u32, half: f32, h: f32, Ne: f32, omega: f32, fhalf: f32, p0: f32, p1: f32, p2: f32 };   // half: φ's box; fhalf: the volume's
@group(0) @binding(0) var<uniform> E: EP;
@group(0) @binding(1) var psiTex: texture_3d<f32>;
@group(0) @binding(2) var samp: sampler;
@group(0) @binding(3) var<storage, read> atm: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> ebuf: array<f32>;
@group(0) @binding(5) var<storage, read_write> part: array<vec4<f32>>;
@group(0) @binding(6) var<storage, read_write> phi: array<f32>;
@group(0) @binding(7) var<storage, read_write> corr: array<f32>;
var<workgroup> red: array<vec4<f32>, 256>;
/* the free atom's core and valence densities (Slater's rules): x = (ρ_core(r), ρ_valence(r)), and its core count and reach */
fn freeAtom(Z: f32, r: f32) -> vec2<f32> {
  if (Z < 1.5) { return vec2<f32>(1.906624 / 3.14159265 * exp(-2.48 * r), 0.0); }   // H: its one 1s (ζ = 1.24, the molecular STO-3G exponent) is the cusp
  let z1 = Z - 0.3; var c = 2.0 * z1 * z1 * z1 / 3.14159265 * exp(-2.0 * z1 * r); var v = 0.0;
  if (Z <= 10.0) { let nv = Z - 2.0; let z2 = (Z - 1.7 - 0.35 * (nv - 1.0)) / 2.0; v = nv * pow(2.0 * z2, 5.0) / 301.5928947 * r * r * exp(-2.0 * z2 * r); }
  else { let z2 = (Z - 4.15) / 2.0; c += 8.0 * pow(2.0 * z2, 5.0) / 301.5928947 * r * r * exp(-2.0 * z2 * r);
         let nv = Z - 10.0; let z3 = (Z - 8.8 - 0.35 * (nv - 1.0)) / 3.0; v = nv * pow(2.0 * z3, 7.0) / 9047.786842 * r * r * r * r * exp(-2.0 * z3 * r); }
  return vec2<f32>(c, v);
}
@compute @workgroup_size(256) fn core(@builtin(local_invocation_index) l: u32, @builtin(workgroup_id) w: vec3<u32>) {
  let a = w.x; let A = atm[2u * a]; let Z = atm[2u * a + 1u].w;
  var acc = 0.0;
  if (Z != 2.0 && Z <= 18.0) {
    let zc = select(select((Z - 8.8 - 0.35 * (Z - 11.0)) / 3.0, (Z - 1.7 - 0.35 * (Z - 3.0)) / 2.0, Z <= 10.0), 1.24, Z < 1.5); let K = i32(ceil((7.0 / zc) / E.h)) + 1; let n = 2 * K + 1;
    let res = f32(textureDimensions(psiTex).x); let tv = 2.0 * E.fhalf / res;
    let ci = vec3<i32>(floor((A.xyz + vec3<f32>(E.half)) / E.h));
    for (var t = i32(l); t < n * n * n; t += 256) {
      let q = ci + vec3<i32>(t % n, (t / n) % n, t / (n * n)) - vec3<i32>(K);
      if (any(q < vec3<i32>(0)) || any(q >= vec3<i32>(i32(E.M)))) { continue; }
      let p = (vec3<f32>(q) + vec3<f32>(0.5)) * E.h - vec3<f32>(E.half);
      for (var k = 0u; k < 8u; k++) {
        let ps = p + (vec3<f32>(f32(k & 1u), f32((k >> 1u) & 1u), f32(k >> 2u)) - vec3<f32>(0.5)) * (0.5 * E.h);
        let g = (ps + vec3<f32>(E.fhalf)) / tv - vec3<f32>(0.5); let i0 = floor(g); let f = g - i0;
        var sa = 0.0; var sb = 0.0;
        for (var c = 0u; c < 8u; c++) {
          let o = vec3<f32>(f32(c & 1u), f32((c >> 1u) & 1u), f32(c >> 2u)); let wv = select(vec3<f32>(1.0) - f, f, o == vec3<f32>(1.0));
          let vi = clamp(i0 + o, vec3<f32>(0.0), vec3<f32>(res - 1.0)); let d = length((vi + vec3<f32>(0.5)) * tv - vec3<f32>(E.fhalf) - A.xyz);
          let rv = freeAtom(Z, d); let ww = wv.x * wv.y * wv.z; sa += ww * sqrt(rv.x + rv.y); sb += ww * sqrt(rv.y);
        }
        acc += sa * sa;
      }
    }
  }
  red[l] = vec4<f32>(acc, 0.0, 0.0, 0.0); workgroupBarrier();
  for (var s = 128u; s > 0u; s >>= 1u) { if (l < s) { red[l] += red[l + s]; } workgroupBarrier(); }
  if (l == 0u) { let nc = select(Z, 0.0, Z == 2.0 || Z > 18.0); corr[a] = nc - red[0].x * E.h * E.h * E.h / 8.0; }
}
fn cellPos(i: u32) -> vec3<f32> { let M = E.M; return (vec3<f32>(f32(i % M), f32((i / M) % M), f32(i / (M * M))) + vec3<f32>(0.5)) * E.h - vec3<f32>(E.half); }
@compute @workgroup_size(256) fn elec(@builtin(global_invocation_id) g: vec3<u32>, @builtin(local_invocation_index) l: u32, @builtin(workgroup_id) w: vec3<u32>) {
  let i = g.x; var v = vec4<f32>(0.0);
  if (i < E.M * E.M * E.M) {
    let p = cellPos(i); var r = 0.0;
    for (var k = 0u; k < 8u; k++) {
      let o = (vec3<f32>(f32(k & 1u), f32((k >> 1u) & 1u), f32(k >> 2u)) - vec3<f32>(0.5)) * (0.5 * E.h);
      let s = textureSampleLevel(psiTex, samp, (p + o + vec3<f32>(E.fhalf)) / (2.0 * E.fhalf), 0.0).rg; r += dot(s, s);
    }
    r *= 0.125; ebuf[i] = r; v = vec4<f32>(r, r * p);
  }
  red[l] = v; workgroupBarrier();
  for (var s = 128u; s > 0u; s >>= 1u) { if (l < s) { red[l] += red[l + s]; } workgroupBarrier(); }
  if (l == 0u) { part[w.x] = red[0]; }
}
@compute @workgroup_size(256) fn total(@builtin(local_invocation_index) l: u32) {
  var v = vec4<f32>(0.0);
  for (var k = l; k < E.nW; k += 256u) { v += part[k]; }
  red[l] = v; workgroupBarrier();
  for (var s = 128u; s > 0u; s >>= 1u) { if (l < s) { red[l] += red[l + s]; } workgroupBarrier(); }
  if (l == 0u) {
    var cs = 0.0; for (var a = 0u; a < E.nA; a++) { cs += corr[a]; }
    let sc = (E.Ne - cs) / max(red[0].x, 1e-30); var mu = -sc * red[0].yzw;
    for (var a = 0u; a < E.nA; a++) { mu += (atm[2u * a + 1u].w - corr[a]) * atm[2u * a].xyz; }
    part[E.nW] = vec4<f32>(mu, sc);
  }
}
@compute @workgroup_size(256) fn rhs(@builtin(global_invocation_id) g: vec3<u32>) {
  let i = g.x; if (i >= E.M * E.M * E.M) { return; }
  let T = part[E.nW]; let p = cellPos(i);
  var nuc = 0.0; var Q = -E.Ne;
  for (var a = 0u; a < E.nA; a++) { let Z = atm[2u * a + 1u].w; Q += Z; let w3 = max(vec3<f32>(0.0), vec3<f32>(1.0) - abs(p - atm[2u * a].xyz) / E.h); nuc += (Z - corr[a]) * w3.x * w3.y * w3.z; }
  ebuf[i] = 12.566370614 * (nuc - T.w * ebuf[i]) / E.h;
  let r = max(length(p), 1.0);
  phi[i] = Q / r + dot(T.xyz, p) / (r * r * r);
}
@compute @workgroup_size(256) fn sor(@builtin(global_invocation_id) g: vec3<u32>) {
  let i = g.x; let M = E.M; if (i >= M * M * M) { return; }
  let x = i % M; let y = (i / M) % M; let z = i / (M * M);
  if (x == 0u || y == 0u || z == 0u || x == M - 1u || y == M - 1u || z == M - 1u || ((x + y + z) & 1u) != E.color) { return; }
  let s = phi[i - 1u] + phi[i + 1u] + phi[i - M] + phi[i + M] + phi[i - M * M] + phi[i + M * M];
  phi[i] = mix(phi[i], (s + ebuf[i]) / 6.0, E.omega);
}`;

const CARD_WGSL = MOL_HEAD.replace(/@group\(0\) @binding\([123]\).*\n/g, '') + /* wgsl */`
var<workgroup> red: array<f32, 64>;
@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_index) lid: u32) {
  var dens = 0.0;
  if (all(gid < vec3<u32>(P.n, P.n, P.n))) {
    let pos = (vec3<f32>(gid) + vec3<f32>(0.5)) / f32(P.n) * (2.0 * P.half) - vec3<f32>(P.half);   // the domain, exactly as the kernels read it
    let N = u32(P.r0); let g = clamp((pos / P.r1 + vec3<f32>(1.0)) * 0.5 * P.r0 - vec3<f32>(0.5), vec3<f32>(0.0), vec3<f32>(P.r0 - 1.0));
    let i0 = min(vec3<u32>(floor(g)), vec3<u32>(N - 2u)); let f = g - vec3<f32>(i0);
    var v = 0.0;
    for (var c = 0u; c < 8u; c++) {
      let o = vec3<u32>(c & 1u, (c >> 1u) & 1u, c >> 2u); let w = select(vec3<f32>(1.0) - f, f, o == vec3<u32>(1u)); let q = i0 + o;
      v += w.x * w.y * w.z * mat[q.x + N * (q.y + N * q.z)];
    }
    textureStore(outTex, vec3<i32>(gid), vec4<f32>(v, 0.0, 0.0, 0.0));
    dens = v * v;
  }
  red[lid] = dens;
  workgroupBarrier();
  if (lid == 0u) { var m = 0.0; for (var k = 0u; k < 64u; k++) { m = max(m, red[k]); } atomicMax(&stats[P.slot], bitcast<u32>(m)); }
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
  p3: vec4<f32>,     // draw style, iso level (fraction of ρmax), grain (DUST's density), THE KNEE's q = ln(KNEE/0.6)
  p4: vec4<f32>,     // PREVIEW BOOST: k (xyz) and on (w) — while the bow is drawn the field is shown multiplied by e^{ik·x}, the exact boosted state
  p6: vec4<f32>,     // arbitrary slice normal (xyz), finish (w)
  p5: vec4<f32>,     // SURFACE: the stage background colour (xyz) and the output gamma (w) — the theme lives here
  p7: vec4<f32>,     // iteration 014 B · THE ATOMS: count, bond count, BALLS' SIZE (× r_vdW), STICKS' RADIUS (bohr)
  p8: vec4<f32>,     // THE POTENTIAL MAP: surface (0 ISO · 1 SAS · 2 SES), probe radius (bohr), RANGE (±φ, a.u.), the palette's stop span (LUT index first · 512 + last)
  p9: vec4<f32>,     // φ's grid: half-width, cells a side, valid (0 · 1), the ISO surface's ρ (a.u.)
  p10: vec4<f32>,    // the atoms' bounding sphere (centre xyz, radius w)
  p11: vec4<f32>,    // iteration 016 S: ESP's SOFT edge (0 = the hard ISO surface … 1), MAP ONLY (0 · 1)
};
@group(0) @binding(0) var<uniform> V: View;
@group(0) @binding(1) var psiTex: texture_3d<f32>;
@group(0) @binding(2) var refTex: texture_3d<f32>;
@group(0) @binding(3) var samp: sampler;
@group(0) @binding(4) var<storage, read> stats: array<u32>;
/* the PALETTE: 256 colours around the complex plane, arg ψ = −π at index 0 and +π at 255 (wrapping).
   Written from palette.js; V.p2.z > 0.5 turns it on and the built-in HSV wheel off. */
@group(0) @binding(5) var<storage, read> pal: array<vec4<f32>, 256>;
/* iteration 014 B: the atoms (two vec4 each: centre + r_vdW, NEGATIVE for an atom with no bond; sRGB colour + Z) then the bonds (i, j as floats),
   and φ on its cell-centred grid (x fastest) */
@group(0) @binding(6) var<storage, read> atm: array<vec4<f32>>;
@group(0) @binding(7) var<storage, read> phiG: array<f32>;

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
/* THE KNEE (iteration 008 G): a shoulder on the ACCUMULATED opacity.  A ray's transmittance is exp(−τ) for the optical depth τ it has
 * crossed; THE KNEE replaces it by the q-exponential T_q(τ) = (1 + qτ)^(−1/q), q = ln(KNEE / 0.6) (V.p3.w, made in writeView), which is
 * exp(−τ) at q = 0 — the shipped KNEE 0.6, drawn by the old arithmetic bit for bit — a SOFT shoulder above it (q > 0: T falls as a power
 * of τ, so a dense core stays see-through and the lobes behind it show) and a HARD knee below it (q < 0: T reaches 0 at τ = 1/|q|, the
 * silhouette closes sooner).  The slope at τ = 0 is 1 for every q, so a faint wisp is never touched; only how the opacity saturates moves. */
fn kneeT(tau: f32, q: f32) -> f32 {
  let x = q * tau;
  if (abs(x) < 1e-3) { return exp(-tau * (1.0 - 0.5 * x)); }      // ln(1 + x)/q to second order: no cancellation near q = 0
  if (x <= -1.0) { return 0.0; }                                   // the hard knee closed the ray
  return exp(-log(1.0 + x) / q);
}
/* DUST's candidates (iteration 008 G).  PCG3D (Jarzynski & Olano 2020, "Hash functions for GPU rendering") turns a cell's integer index
 * into its grain's offset; u32 arithmetic wraps by definition, so the set is the same on every adapter and in every frame. */
fn dustHash(c: vec3<u32>) -> vec3<f32> {
  var v = c * 1664525u + vec3<u32>(1013904223u);
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v = v ^ (v >> vec3<u32>(16u));
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return vec3<f32>(v >> vec3<u32>(8u)) * (1.0 / 16777216.0);
}
/* the view's own colour and weight at a point — the march's VIEW block, restated for DUST alone (the march keeps its inline text: THE LOCK) */
fn dustTint(s: vec2<f32>, uvw: vec3<f32>, mode: u32, rhoMax: f32, ampMax: f32, refMax: f32, soft: f32) -> vec4<f32> {
  var w = 0.0; var c = vec3<f32>(0.0);
  if (mode == 0u) {
    let rho = dot(s, s) / rhoMax; w = pow(rho, soft);
    if (V.p2.z > 0.5) { c = pal[u32(fract(0.5 + V.p2.x) * 256.0) % 256u].rgb; } else { c = mix(vec3<f32>(0.08, 0.45, 0.62), vec3<f32>(1.0, 1.0, 1.0), pow(rho, 0.45)); }
  } else if (mode == 1u) {
    w = pow(dot(s, s) / rhoMax, soft);
    let h = select(0.0, atan2(s.y, s.x), dot(s, s) > 1e-30) / 6.283185307 + 0.5 + V.p2.x;
    if (V.p2.z > 0.5) { let u = fract(h) * 256.0; let i0 = u32(floor(u)) % 256u; c = mix(pal[i0].rgb, pal[(i0 + 1u) % 256u].rgb, fract(u)); } else { c = hsv(h, 0.85, 1.0); }
  } else if (mode == 2u || mode == 3u) {
    let v = select(s.y, s.x, mode == 2u) / ampMax; w = pow(v * v, soft);
    if (V.p2.z > 0.5) { c = select(pal[u32(fract(0.75 + V.p2.x) * 256.0) % 256u].rgb, pal[u32(fract(0.25 + V.p2.x) * 256.0) % 256u].rgb, v > 0.0); }
    else { c = select(vec3<f32>(0.22, 0.50, 1.0), vec3<f32>(1.0, 0.58, 0.16), v > 0.0); }
  } else {
    let rf = textureSampleLevel(refTex, samp, uvw, 0.0).rg;
    let d = (dot(s, s) - dot(rf, rf)) / max(rhoMax, refMax); w = pow(abs(d), soft);
    if (V.p2.z > 0.5) { c = select(pal[u32(fract(0.75 + V.p2.x) * 256.0) % 256u].rgb, pal[u32(fract(0.25 + V.p2.x) * 256.0) % 256u].rgb, d > 0.0); }
    else { c = select(vec3<f32>(0.25, 0.48, 1.0), vec3<f32>(1.0, 0.86, 0.22), d > 0.0); }
  }
  if (V.p2.y > 0.5) { c = vec3<f32>(1.0) - c; }
  return vec4<f32>(c, w);
}
/* DUST (iteration 008 G; GRAIN, its old twin, opens as it).  The field drawn as GRAINS FIXED IN THE WORLD.  The box is cut into an
 * n³ lattice, n = 128·GRAIN^⅓ (so GRAIN is the candidates' density, as a fraction of 128³, and nothing else); each cell holds ONE
 * candidate, jittered inside the cell's middle 60 % by dustHash — so no two candidates are closer than 0.4 of a cell, the minimum-distance
 * property that makes a point set BLUE (no clumps, no holes).  A candidate shows with the probability CLOUD's own weight w gives its
 * point (ρ^SOFT, or (Re ψ)²^SOFT, (Im ψ)²^SOFT, |Δρ|^SOFT under those views) times EXPOSURE, against its own threshold (a second,
 * decorrelated dustHash draw: the R3 Kronecker lattice was tried and drew planar streaks across the thin tail).  The ray walks every cell it crosses (Amanatides–Woo) and meets each grain ANALYTICALLY — its distance
 * to the grain's centre, not whether a march step happened to land inside — so nothing depends on the march, the jitter seed or the
 * present count: a still clock draws still dust, a camera turn moves every grain rigidly, and only the field's own time can make one
 * come or go (it fades over a narrow band as w crosses its threshold).  A grain's radius is fixed in the world (a fifth of the finest
 * cell, so GRAIN never changes its size), widened to one pixel at its own depth when it is smaller than that on the screen, its peak
 * lowered by the area ratio (floored at ½) — a far grain is a dim pixel, never a flicker — and held inside the cell's guard band (⅕ cell)
 * so the walk sees all of it.  Composited front to back through THE KNEE. */
fn dustPixel(ro: vec3<f32>, rd: vec3<f32>, t0: f32, tf: f32, half: f32, mode: u32, soft: f32, rhoMax: f32, ampMax: f32, refMax: f32, pxA: f32) -> vec4<f32> {
  let n = clamp(round(128.0 * pow(clamp(V.p3.z, 0.0, 1.0), 1.0 / 3.0)), 8.0, 128.0);
  let h = 2.0 * half / n;
  let r0 = 0.2 * (2.0 * half / 128.0);                           // the grain's world radius: fixed (GRAIN moves the count, never the size)
  let q = V.p3.w;
  let p0 = ro + rd * t0;
  var cell = clamp(floor((p0 + vec3<f32>(half)) / h), vec3<f32>(0.0), vec3<f32>(n - 1.0));
  let stp = select(vec3<f32>(-1.0), vec3<f32>(1.0), rd >= vec3<f32>(0.0));
  let ird = vec3<f32>(select(1.0 / rd.x, 1e30, abs(rd.x) < 1e-9), select(1.0 / rd.y, 1e30, abs(rd.y) < 1e-9), select(1.0 / rd.z, 1e30, abs(rd.z) < 1e-9));
  var tNext = ((cell + max(stp, vec3<f32>(0.0))) * h - vec3<f32>(half) - ro) * ird;
  let tDel = abs(h * ird);
  var col = vec3<f32>(0.0); var tau = 0.0; var T = 1.0;
  for (var i = 0u; i < 400u; i++) {
    let P = (cell + vec3<f32>(0.2) + 0.6 * dustHash(vec3<u32>(cell))) * h - vec3<f32>(half);
    let qv = P - ro; let tq = dot(qv, rd);
    if (tq > t0 && tq < tf) {
      let re = clamp(tq * pxA, r0, 0.2 * h);                    // one pixel at the grain's depth, never past the guard band
      let d2 = max(dot(qv, qv) - tq * tq, 0.0);
      if (d2 < re * re) {
        let uvw = (P + vec3<f32>(half)) / (2.0 * half);
        var s = textureSampleLevel(psiTex, samp, uvw, 0.0).rg;
        if (V.p4.w > 0.5) { let ph = dot(V.p4.xyz, P); s = vec2<f32>(s.x * cos(ph) - s.y * sin(ph), s.x * sin(ph) + s.y * cos(ph)); }   // the bow, e^{ik·x}ψ at the grain
        let tw = dustTint(s, uvw, mode, rhoMax, ampMax, refMax, soft);
        let u = dustHash(vec3<u32>(cell) + vec3<u32>(7919u, 104729u, 1299709u)).x;   // the candidate's own threshold (a second, decorrelated draw)
        let show = clamp((min(tw.w * V.p0.y, 1.0) - u) * 16.0, 0.0, 1.0);
        let k = 1.0 - d2 / (re * re);
        let a = min(show * k * k * max((r0 * r0) / (re * re), 0.5), 0.98);   // the area ratio, floored at ½ so a lone grain still reads
        if (a > 0.0) {
          tau += -log(1.0 - a); let T1 = kneeT(tau, q);
          col += (T - T1) * tw.rgb; T = T1;
          if (T < 0.015) { break; }
        }
      }
    }
    let m = min(min(tNext.x, tNext.y), tNext.z);
    if (m > tf) { break; }
    if (tNext.x <= m) { cell.x += stp.x; tNext.x += tDel.x; } else if (tNext.y <= m) { cell.y += stp.y; tNext.y += tDel.y; } else { cell.z += stp.z; tNext.z += tDel.z; }
    if (any(cell < vec3<f32>(0.0)) || any(cell > vec3<f32>(n - 1.0))) { break; }
  }
  return vec4<f32>(col, 1.0 - T);
}
/* ── THE THREE VIEWS (iteration 014 B) ─────────────────────────────────────────────────────────────────────────────
 * BALLS: the CPK spheres (r_vdW × SIZE), ray-traced exactly, no sticks.  STICKS: a capsule per bond, each half in its own atom's colour,
 * RADIUS wide (an atom with no bond is a ball of that radius).  ESP: THE POTENTIAL MAP — a surface (the density's ISO at ρ = ISO/30 a.u.; the
 * SAS, r_vdW + PROBE; the SES, the vdW spheres' log-sum-exp union filleted by the probe) coloured by φ(r) read from phiG (the Poisson pass or
 * a volume's grid), translucent by EXPOSURE over the STICKS inside it.  One key light; HUE rotates the colours.  All return before the march,
 * whose text is untouched (THE LOCK). */
fn hueRot(c: vec3<f32>, h: f32) -> vec3<f32> {
  if (h == 0.0) { return c; }
  let k = vec3<f32>(0.57735027); let a = h * 6.283185307; let ca = cos(a);
  return clamp(c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca), vec3<f32>(0.0), vec3<f32>(1.0));
}
fn atomLit(c: vec3<f32>, n: vec3<f32>, rd: vec3<f32>) -> vec3<f32> {
  let L = normalize(-rd + 0.55 * V.up.xyz + 0.35 * V.right.xyz);
  let d = max(dot(n, L), 0.0); let sp = pow(max(dot(reflect(-L, n), -rd), 0.0), 40.0);
  return c * (0.32 + 0.68 * d) + vec3<f32>(0.32 * sp);
}
fn sphereHit(ro: vec3<f32>, rd: vec3<f32>, c: vec3<f32>, r: f32) -> vec2<f32> {
  let oc = ro - c; let b = dot(oc, rd); let h = b * b - (dot(oc, oc) - r * r);
  if (h < 0.0) { return vec2<f32>(1e30, -1e30); }
  let q = sqrt(h); return vec2<f32>(-b - q, -b + q);
}
fn capsuleHit(ro: vec3<f32>, rd: vec3<f32>, pa: vec3<f32>, pb: vec3<f32>, r: f32) -> f32 {   // Quilez's ray–capsule: the nearest t, or −1
  let ba = pb - pa; let oa = ro - pa;
  let baba = dot(ba, ba); let bard = dot(ba, rd); let baoa = dot(ba, oa); let rdoa = dot(rd, oa); let oaoa = dot(oa, oa);
  let a = max(baba - bard * bard, 1e-12); let b = baba * rdoa - baoa * bard; let c = baba * oaoa - baoa * baoa - r * r * baba;
  let h = b * b - a * c;
  if (h >= 0.0) {
    let t = (-b - sqrt(h)) / a; let y = baoa + t * bard;
    if (y > 0.0 && y < baba) { return t; }
    let oc = select(ro - pb, oa, y <= 0.0);
    let b2 = dot(rd, oc); let h2 = b2 * b2 - (dot(oc, oc) - r * r);
    if (h2 > 0.0) { return -b2 - sqrt(h2); }
  }
  return -1.0;
}
fn atomColour(i: u32) -> vec3<f32> { return hueRot(atm[2u * i + 1u].rgb, V.p2.x); }
/* the nearest ball or stick on the ray inside [t0, tf]: (lit rgb, t), t = 1e30 when none */
fn ballsOrSticks(ro: vec3<f32>, rd: vec3<f32>, t0: f32, tf: f32, sticks: bool) -> vec4<f32> {
  let nA = u32(V.p7.x); let nB = u32(V.p7.y);
  let bs = sphereHit(ro, rd, V.p10.xyz, V.p10.w);
  if (bs.y < t0 || bs.x > tf) { return vec4<f32>(0.0, 0.0, 0.0, 1e30); }
  var best = 1e30; var col = vec3<f32>(0.0); var nrm = vec3<f32>(0.0);
  if (!sticks) {
    for (var i = 0u; i < nA; i++) {
      let A = atm[2u * i]; let hit = sphereHit(ro, rd, A.xyz, abs(A.w) * V.p7.z);
      var t = hit.x; var n = vec3<f32>(0.0);
      if (hit.x < t0 && hit.y > t0) { t = t0; n = -rd; } else { n = normalize(ro + rd * t - A.xyz); }   // a CLIP cut: the flat face
      if (hit.y >= hit.x && t >= t0 && t < tf && t < best) { best = t; nrm = n; col = atomColour(i); }
    }
  } else {
    let r = V.p7.w;
    for (var k = 0u; k < nB; k++) {
      let B = atm[2u * nA + k]; let i = u32(B.x); let j = u32(B.y);
      let pa = atm[2u * i].xyz; let pb = atm[2u * j].xyz; let pm = 0.5 * (pa + pb);
      for (var e = 0u; e < 2u; e++) {
        let p0 = select(pb, pa, e == 0u); let t = capsuleHit(ro, rd, p0, pm, r);
        if (t >= t0 && t < tf && t < best) {
          best = t; col = atomColour(select(j, i, e == 0u));
          let ba = pm - p0; let q = ro + rd * t - p0; let h = clamp(dot(q, ba) / max(dot(ba, ba), 1e-12), 0.0, 1.0); nrm = (q - h * ba) / r;
        }
      }
    }
    for (var i = 0u; i < nA; i++) {                                    // a lone atom (its radius stored negative) is a ball of RADIUS
      let A = atm[2u * i];
      if (A.w >= 0.0) { continue; }
      let hit = sphereHit(ro, rd, A.xyz, r);
      if (hit.y >= hit.x && hit.x >= t0 && hit.x < tf && hit.x < best) { best = hit.x; col = atomColour(i); nrm = normalize(ro + rd * hit.x - A.xyz); }
    }
  }
  if (best >= 1e30) { return vec4<f32>(0.0, 0.0, 0.0, 1e30); }
  var c = atomLit(col, nrm, rd);
  if (V.p2.y > 0.5) { c = vec3<f32>(1.0) - c; }
  return vec4<f32>(c, best);
}
/* THE SURFACES' distance: SAS = min_A |p − R_A| − (r_A + probe); SES = −k·ln Σ e^{−(|p − R_A| − r_A)/k}, k = 0.3·probe (1-Lipschitz: sphere-traceable) */
fn surfDist(p: vec3<f32>, ses: bool) -> f32 {
  let nA = u32(V.p7.x); let pr = V.p8.y;
  if (!ses) { var d = 1e30; for (var i = 0u; i < nA; i++) { let A = atm[2u * i]; d = min(d, length(p - A.xyz) - (abs(A.w) + pr)); } return d; }
  let k = max(0.3 * pr, 0.05); var m = 1e30; var sum = 0.0;
  for (var i = 0u; i < nA; i++) { let A = atm[2u * i]; m = min(m, length(p - A.xyz) - abs(A.w)); }
  for (var i = 0u; i < nA; i++) { let A = atm[2u * i]; sum += exp(-((length(p - A.xyz) - abs(A.w)) - m) / k); }
  return m - k * log(sum);
}
fn phiAt(p: vec3<f32>) -> f32 {
  let M = u32(V.p9.y); let hh = V.p9.x; let h = 2.0 * hh / f32(M);
  let g = clamp((p + vec3<f32>(hh)) / h - vec3<f32>(0.5), vec3<f32>(0.0), vec3<f32>(f32(M) - 1.001));
  let i0 = vec3<u32>(floor(g)); let f = g - floor(g);
  var v = 0.0;
  for (var c = 0u; c < 8u; c++) {
    let o = vec3<u32>(c & 1u, (c >> 1u) & 1u, c >> 2u); let w = select(vec3<f32>(1.0) - f, f, o == vec3<u32>(1u)); let q = min(i0 + o, vec3<u32>(M - 1u));
    v += w.x * w.y * w.z * phiG[q.x + M * (q.y + M * q.z)];
  }
  return v;
}
/* the map's colour (iteration 015 W2 · W3): φ through a SIGNED LOG, s = sign φ · ln(1 + |φ|/ε) / ln(1 + R/ε), ε = R/20, so the middle spans a real band and
   the ends arrive only near ±RANGE; PALETTE ON paints s with the palette read from its first stop to its last (a cyclic palette's closing segment
   left out, so −R and +R differ; HUE turns it as it turns DENSITY), PALETTE OFF with the standard ramp RED (φ < 0) → yellow → green → cyan → BLUE */
fn espColour(phi: f32) -> vec3<f32> {
  let R = max(V.p8.z, 1e-9); let e = 0.05 * R;
  let u = 0.5 + 0.5 * clamp(sign(phi) * log(1.0 + abs(phi) / e) / log(1.0 + R / e), -1.0, 1.0);
  if (V.p2.z > 0.5) {
    let pk = u32(V.p8.w); let x = mix(f32(pk / 512u), f32(pk % 512u), u) + V.p2.x * 256.0; let xw = x - 256.0 * floor(x / 256.0);
    let i0 = u32(floor(xw)) % 256u; return mix(pal[i0].rgb, pal[(i0 + 1u) % 256u].rgb, fract(xw));
  }
  let s = u * 4.0; let k = min(u32(s), 3u); let f = s - f32(k);
  var r = array<vec3<f32>, 5>(vec3<f32>(0.86, 0.09, 0.07), vec3<f32>(0.98, 0.86, 0.12), vec3<f32>(0.22, 0.80, 0.26), vec3<f32>(0.10, 0.80, 0.90), vec3<f32>(0.07, 0.22, 0.86));
  return hueRot(mix(r[k], r[k + 1u], f), V.p2.x);
}
/* iteration 016 S1 · ESP SOFT (Josh: "the ESP surface is very hard; give it the softness of SIGNED and SOLID"): under the ISO surface with SOFT's edge
   e > 0 the surface is SOLID's one-sided band, not a single hit — the opacity per bohr (14 − 8e) ramps in over ln ρ ∈ [ln ISO − 2e, ln ISO + e] (smoothstep)
   and stays full inside, so a grazing ray (the silhouette) gathers only part of it and the edge fades, while the interior still hides the far side; every
   sample that adds colour paints φ there, lit by the density's gradient as the hard surface is.  e = 0 never reaches this function: the hard path
   below is the SOFT-at-its-hard-end picture, text unchanged.  The march stops at the sticks (tEnd), the way the hard surface yields to them. */
fn espSoft(ro: vec3<f32>, rd: vec3<f32>, t0: f32, tf: f32, tEnd: f32, half: f32, back: vec3<f32>, jit: f32) -> vec3<f32> {
  let rs = V.p9.w; let e = V.p11.x; let lo = -2.0 * e; let hi = e;
  let steps = max(V.fwd.w, 8.0); let ds = (tf - t0) / steps; let K = 14.0 - 8.0 * e; // K: the band's opacity per bohr once inside it (a softer edge also gathers slower)
  var T = 1.0; var col = vec3<f32>(0.0); var t = t0 + ds * jit;
  for (var i = 0u; i < 512u; i++) {
    if (f32(i) >= steps || t > tEnd) { break; }
    let p = ro + rd * t; let uvw = (p + vec3<f32>(half)) / (2.0 * half);
    let s = textureSampleLevel(psiTex, samp, uvw, 0.0).rg; let rho = dot(s, s);
    if (rho > rs * exp(lo)) {                                                        // below e^{lo} · ISO the band is zero: skip the log and the colour
      let a = 1.0 - exp(-K * smoothstep(lo, hi, log(max(rho, 1e-30) / rs)) * ds);
      if (a > 0.002) {
        var c = vec3<f32>(0.62);                                                       // φ not ready: a grey surface
        if (V.p9.z > 0.5) { c = espColour(phiAt(p)); }
        if (V.p2.y > 0.5) { c = vec3<f32>(1.0) - c; }
        if (V.p6.w < 1.5) {
          let g = 1.2 / f32(textureDimensions(psiTex).x);
          let n = -normalize(vec3<f32>(rhoAt(psiTex, samp, uvw + vec3<f32>(g, 0.0, 0.0)) - rhoAt(psiTex, samp, uvw - vec3<f32>(g, 0.0, 0.0)),
                                       rhoAt(psiTex, samp, uvw + vec3<f32>(0.0, g, 0.0)) - rhoAt(psiTex, samp, uvw - vec3<f32>(0.0, g, 0.0)),
                                       rhoAt(psiTex, samp, uvw + vec3<f32>(0.0, 0.0, g)) - rhoAt(psiTex, samp, uvw - vec3<f32>(0.0, 0.0, g))) + vec3<f32>(1e-12));
          c = atomLit(c, n, rd);
        }
        col += T * a * c; T *= 1.0 - a;
        if (T < 0.01) { break; }
      }
    }
    t += ds;
  }
  let am = clamp(0.8 * V.p0.y, 0.05, 1.0);                                            // EXPOSURE's translucency, as the hard surface's
  return back * (1.0 - (1.0 - T) * am) + col * am;
}
fn espPixel(ro: vec3<f32>, rd: vec3<f32>, t0: f32, tf: f32, half: f32, bg: vec3<f32>, jit: f32) -> vec3<f32> {
  var inner = vec4<f32>(0.0, 0.0, 0.0, 1e30);
  if (V.p11.y < 0.5) { inner = ballsOrSticks(ro, rd, t0, tf, true); }   // iteration 016 S2 · MAP ONLY: no sticks inside, the stage alone beneath the map
  let surf = u32(V.p8.x);
  if (surf == 0u && V.p11.x > 0.0) { return espSoft(ro, rd, t0, tf, min(tf, inner.w), half, select(bg, inner.rgb, inner.w < 1e30), jit); }
  var th = 1e30; var n = vec3<f32>(0.0);
  if (surf == 0u) {                                                  // the density's ISO surface: march, then bisect
    let rs = V.p9.w; let steps = max(V.fwd.w, 8.0); let ds = (tf - t0) / steps; var ta = t0;
    for (var i = 0u; i < 512u; i++) {
      if (f32(i) >= steps) { break; }
      let tb = ta + ds; let s = textureSampleLevel(psiTex, samp, (ro + rd * tb + vec3<f32>(half)) / (2.0 * half), 0.0).rg;
      if (dot(s, s) >= rs) {
        var lo = ta; var hi = tb;
        for (var k = 0u; k < 6u; k++) { let tm = 0.5 * (lo + hi); let sm = textureSampleLevel(psiTex, samp, (ro + rd * tm + vec3<f32>(half)) / (2.0 * half), 0.0).rg; if (dot(sm, sm) >= rs) { hi = tm; } else { lo = tm; } }
        th = hi; let uvw = (ro + rd * th + vec3<f32>(half)) / (2.0 * half); let e = 1.2 / f32(textureDimensions(psiTex).x);
        n = -normalize(vec3<f32>(rhoAt(psiTex, samp, uvw + vec3<f32>(e, 0.0, 0.0)) - rhoAt(psiTex, samp, uvw - vec3<f32>(e, 0.0, 0.0)),
                                 rhoAt(psiTex, samp, uvw + vec3<f32>(0.0, e, 0.0)) - rhoAt(psiTex, samp, uvw - vec3<f32>(0.0, e, 0.0)),
                                 rhoAt(psiTex, samp, uvw + vec3<f32>(0.0, 0.0, e)) - rhoAt(psiTex, samp, uvw - vec3<f32>(0.0, 0.0, e))) + vec3<f32>(1e-12));
        break;
      }
      ta = tb;
    }
  } else {                                                           // SAS · SES: sphere-traced inside the bounding sphere grown by the probe
    let ses = surf == 2u; let bs = sphereHit(ro, rd, V.p10.xyz, V.p10.w + V.p8.y);
    var t = max(t0, bs.x); let te = min(tf, bs.y); let eps = 2e-4 * half;
    for (var i = 0u; i < 160u; i++) {
      if (t > te) { break; }
      let d = surfDist(ro + rd * t, ses);
      if (d < eps) { th = t; break; }
      t += max(d, eps);
    }
    if (th < 1e30) { let p = ro + rd * th; let e = 0.02; n = normalize(vec3<f32>(surfDist(p + vec3<f32>(e, 0.0, 0.0), ses) - surfDist(p - vec3<f32>(e, 0.0, 0.0), ses),
                                                                                   surfDist(p + vec3<f32>(0.0, e, 0.0), ses) - surfDist(p - vec3<f32>(0.0, e, 0.0), ses),
                                                                                   surfDist(p + vec3<f32>(0.0, 0.0, e), ses) - surfDist(p - vec3<f32>(0.0, 0.0, e), ses)) + vec3<f32>(1e-12)); }
  }
  let back = select(bg, inner.rgb, inner.w < 1e30);
  if (th >= 1e30 || inner.w < th) { return back; }
  var c = vec3<f32>(0.62);                                           // φ not ready: a grey surface
  if (V.p9.z > 0.5) { c = espColour(phiAt(ro + rd * th)); }
  if (V.p2.y > 0.5) { c = vec3<f32>(1.0) - c; }
  if (V.p6.w < 1.5) { c = atomLit(c, n, rd); }                       // MATTE: the map's colour unlit
  return mix(back, c, clamp(0.8 * V.p0.y, 0.05, 1.0));
}
@fragment fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let pxA = abs(dpdy(in.uv.y)) * V.up.w;                          // DUST: one pixel's angle (uniform control flow: before any branch)
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
  if (style == 2u || style == 5u) {                               // DUST (a retired GRAIN, 2, draws as DUST)
    let d = dustPixel(ro, rd, t0, tf, half, mode, soft, rhoMax, ampMax, refMax, pxA);
    var od = pow(max(d.rgb + bg * (1.0 - d.a), vec3<f32>(0.0)), vec3<f32>(1.0 / max(V.p5.w, 0.05)));
    od = select(od, bg, od != od);
    return vec4<f32>(od + bayer8(in.pos.xy) * (V.p2.w / 255.0), 1.0);
  }
  if (style >= 9u && style <= 11u && V.p7.x > 0.5) {                // iteration 014 B: BALLS · STICKS · ESP draw the atoms (none set: the march below, as CLOUD)
    var oc = bg;
    if (style == 11u) { oc = espPixel(ro, rd, t0, tf, half, bg, hash(in.pos.xy + vec2<f32>(V.p0.w))); } else { let m = ballsOrSticks(ro, rd, t0, tf, style == 10u); oc = select(bg, m.rgb, m.w < 1e30); }
    var om = pow(max(oc, vec3<f32>(0.0)), vec3<f32>(1.0 / max(V.p5.w, 0.05)));
    om = select(om, bg, om != om);
    return vec4<f32>(om + bayer8(in.pos.xy) * (V.p2.w / 255.0), 1.0);
  }
  let kq = V.p3.w;                                                // THE KNEE's q (0 at the shipped 0.6: the old compositing, untouched)
  var tau = 0.0;
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
       2 GRAIN  retired (iteration 008 G): it opens as DUST, which returned before this march (dustPixel).
       Each step's weight passes through the bounded transfer w ↦ w/(1 + 0.6w), a step's own ceiling.  Its 0.6 was KNEE's seat until
       iteration 008 G, and is now fixed: it bounded the step and never the ray (a dense core still saturated), so turning it did
       nothing the eye could see.  KNEE is now THE KNEE on the accumulated opacity, below (kneeT). */
    let knee = 0.6;
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
      /* BANDS (iteration 008 G): the field's own level surfaces, ONE PER OCTAVE of the density (ρ, or (Re ψ)², (Im ψ)² under
         the signed views) and anchored at ISO — a line at ρ = ISO·2^k for every k — so the band SOLID and SHELL draw is one of
         them and an exponential tail reads as evenly spaced shells: the falloff made countable, which no other style shows.
         Seven octaves below ISO fade out (the comb would only alias toward a node).  GRAIN no longer sets their count. */
      let sv = select(s.y, s.x, mode == 2u) / ampMax;
      let mag = select(dot(s, s) / rhoMax, sv * sv, mode == 2u || mode == 3u);
      let oct = log2(max(mag, 1e-30) / max(V.p3.y, 1e-6));
      let band = 0.5 + 0.5 * cos(6.283185307 * oct);
      wEff = wEff * pow(band, 4.0) * 2.0 * smoothstep(-7.0, -5.0, oct);
    }
    if (style == 6u) {
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
    if (style == 8u) {
      /* SHELL ± (iteration 010 X7, Josh 10-19: "Shell look with the Signed geometry"): SIGNED's measure — |ψ| under DENSITY and
         PHASE, |Re ψ| or |Im ψ| under RE and IM, so each signed lobe is its own body and the nodal surfaces stay open between them —
         through SHELL's transfer: SHELL's Gaussian (relative width 0.32, read on the measure squared as SHELL reads ρ), its 0.7 weight,
         its light toward white, no glass finish and the matte drop (both below).  The level is SIGNED's visible surface: 2.5·ISO on
         the amplitude (inside its smoothstep(1.5·ISO, 5·ISO)), where the shell's silhouette met SIGNED's within 4 px on 2p₀ and 3d₂
         (research/iteration-010/X7-BUILD.md).  Inserted here, after the glass finish, so no line of another style moved. */
      let sv = select(s.y, s.x, mode == 2u) / ampMax;
      let mag = select(sqrt(dot(s, s) / rhoMax), abs(sv), mode == 2u || mode == 3u);
      let lvl = max(V.p3.y, 1e-6) * 2.5;
      let l2 = lvl * lvl;
      let shell = exp(-pow((mag * mag - l2) / (l2 * .32), 2.0));
      wEff = shell * .7;
      c = baseColour;
      if (shell > 0.0) { c = mix(c, vec3<f32>(1.0), clamp(litAt(uvw) * .65, 0.0, 1.0)); }
    }
    if (V.p6.w > 1.5) { c = baseColour; }
    let a = 1.0 - exp(-wEff * sigma * stepN * 4.0);
    if (style == 7u) {
      col += a * c;
      // Do not terminate on one saturated channel: the remaining samples
      // can still change the other channels, including after gamma/dither.
    } else if (kq == 0.0) {
      col += (1.0 - alpha) * a * c;
      alpha += (1.0 - alpha) * a;
      if (alpha > 0.985) { break; }
    } else {                                                      // THE KNEE: the transmittance is T_q(τ), not exp(−τ)
      let T0 = kneeT(tau, kq); tau += wEff * sigma * stepN * 4.0; let T1 = kneeT(tau, kq);
      col += (T0 - T1) * c;
      alpha = 1.0 - T1;
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

/* ── THE SPECIALISED PRESENT (optimization 2026-09-24, K2 · AUDIT-A FA3, REFUTE-E/F, PLAN §0) ─────────────────────────
 * The present pass is ALU-bound, and RENDER_WGSL carries 5 views × 8 styles × finish × palette × invert × bow as uniform
 * branches inside a 110–240-step march that the compiler cannot drop.  A copy with the VIEW and the STYLE folded to
 * constants, the bow's phase line deleted and the glass-FINISH block deleted renders the same bytes 30–40 % faster
 * (probes/K/k2-variants: FF phase/cloud 4.93 → 3.26 ms at 96³, 0 bytes differ on all 24 (view, style) of the set in
 * Firefox and Chromium).  THE KEY decides when that copy is the same program: style ∈ {cloud, grain, bands, dust} (the
 * lit and additive styles stay generic: their compiler-dependent last bits), view 0…4, the bow OFF (writeView's p4.w = 0,
 * so the deleted line was a no-op) and finish ≠ glass (p6.w ∉ (½, 1½), so the deleted block was a no-op); palette,
 * invert, matte and dither stay runtime.  A copy is compiled on first use with createRenderPipelineAsync — the generic
 * pipeline draws until it resolves (the same pixels) — and a rejected compile marks its key failed for good. */
const RENDER_BOW = '    if (V.p4.w > 0.5) { let ph = dot(V.p4.xyz, p); let cs = cos(ph); let sn = sin(ph); s = vec2<f32>(s.x * cs - s.y * sn, s.x * sn + s.y * cs); }';
const RENDER_GLASS_FINISH = `    if (V.p6.w > .5 && V.p6.w < 1.5 && style != 6u) {
      // A glass finish on the selected shape, including signed nodal lobes.
      wEff *= .22;
      if (wEff > 0.0) { c = mix(c, vec3<f32>(1.0), clamp(litAt(uvw) * .45, 0.0, .65)); }
    }`;
export const SPEC_STYLES = Object.freeze([STYLE.cloud, STYLE.grain, STYLE.bands, STYLE.dust]);
/** one anchored substitution: `from` must occur exactly once, or the derived text throws (a moved anchor never derives silently) */
function once(src, from, to) { const i = src.indexOf(from); if (i < 0 || src.indexOf(from, i + 1) >= 0) throw new Error('field: a derived shader lost its anchor: ' + from.slice(0, 48)); return src.slice(0, i) + to + src.slice(i + from.length); }
/** RENDER_WGSL for one (view, style) of the key; throws when an anchor has moved (the key then fails: generic forever) */
export function specRenderWGSL(view, style) {
  let code = once(RENDER_WGSL, 'let mode = u32(V.p0.x);', `let mode = ${view | 0}u;`);
  code = once(code, 'let style = u32(V.p3.x);', `let style = ${style | 0}u;`);
  const cut = (src, from) => { const e = src.indexOf('\n', src.indexOf(from) + from.length - 1); return once(src, src.slice(src.indexOf(from), e + 1), ''); };   // the anchor through the end of its line (the bow line carries a comment)
  code = cut(code, RENDER_BOW);
  return cut(code, RENDER_GLASS_FINISH);
}

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
export function perspective(fovy, aspect, near, far, out) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far), o = out || new Float32Array(16);
  o.fill(0); o[0] = f / aspect; o[5] = f; o[10] = far * nf; o[11] = -1; o[14] = far * near * nf;
  return o;
}
export function lookAt(eye, center, up, out) {
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
/** FLIP (iteration 014 C2): THE PARITY of the view — the camera's right vector reversed, so every reader of the basis (the ray pass, the lines,
 *  toScreen and the pointer) sees the mirror image: a molecule's enantiomer, as a view (enantiomers are not catalogued).  A session's view
 *  toggle (camera-law.js setFlip), never in a project, a link or the digest: off, the basis is the old one, bit for bit. */
let PARITY = 1;
export function setParity(on) { PARITY = on ? -1 : 1; }
export function cameraBasis(obs) {
  const B = cameraBasis0(obs);
  if (PARITY < 0) B.right = [-B.right[0], -B.right[1], -B.right[2]];
  return B;
}
function cameraBasis0(obs) {
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
/** THE ONE EYE (0.4.0 S1′): the only place the observer becomes an eye.  The ray pass (writeView), the pointer
 *  (pointerRay, unproject), the GLB camera and every 2-D overlay (toScreen) ask here.  The pivot is the origin (the
 *  plan chose a lens shift over a target pivot); `shift` = the pivot's place on the frame in NDC (S2), which writeView
 *  (lensShift), toScreen.at and pointerRay apply — the three seats, each one line. */
const NO_SHIFT = Object.freeze([0, 0]);
export function cameraEye(obs, half) {
  const basis = cameraBasis(obs), D = obs.dist * half, d = basis.dir;
  return { eye: [d[0] * D, d[1] * D, d[2] * D], target: [0, 0, 0], basis, shift: obs.shift || NO_SHIFT, D, tanH: Math.tan((obs.fov || 0.6) / 2) };
}
/** the 2-D overlays' one road: cameraEye plus `at(x, y, z, out?)` → [px, py, depth] in stage CSS pixels of a W × H
 *  canvas, or null behind the eye, and its inverse `ray(px, py)` → the (unnormalised) direction from the eye through
 *  that pixel — the pointer's (rack.js pointerRay).  The lens shift moves every point by (sx·W/2, −sy·H/2) pixels. */
export function toScreen(obs, half, W, H) {
  const E = cameraEye(obs, half), { fwd, right, up } = E.basis, c = E.eye, tanH = E.tanH, aspect = W / H, s = E.shift;
  E.at = (x, y, z, out = [0, 0, 0]) => {
    const dx = x - c[0], dy = y - c[1], dz = z - c[2], depth = dx * fwd[0] + dy * fwd[1] + dz * fwd[2];
    if (depth <= 0) return null;
    const u = (dx * right[0] + dy * right[1] + dz * right[2]) / (depth * tanH * aspect), v = (dx * up[0] + dy * up[1] + dz * up[2]) / (depth * tanH);
    out[0] = (u + s[0] + 1) / 2 * W; out[1] = (1 - v - s[1]) / 2 * H; out[2] = depth; return out;
  };
  E.ray = (px, py) => {
    const u = (2 * px / W - 1 - s[0]) * tanH * aspect, v = (1 - 2 * py / H - s[1]) * tanH;   // pixel u marches the on-axis ray of u − p
    return [fwd[0] + u * right[0] + v * up[0], fwd[1] + u * right[1] + v * up[1], fwd[2] + u * right[2] + v * up[2]];
  };
  return E;
}
/** THE LENS SHIFT (0.4.0 S2): the on-axis picture translated by p = E.shift in NDC; the view and the basis do not move,
 *  only the principal point.  The ray pass's forward lane (lane[at..at+2]) becomes fwd − p·tanH·(aspect·right, up), so the
 *  pixel at uv u marches the on-axis ray of u − p; the lines' perspective P gains P[8] = −px, P[9] = −py (column-major,
 *  w = −z: x_clip += P[8]·z adds px to the NDC — the FRAME-corner gate confirms the sign on the GPU).  At p = 0 it writes
 *  nothing: the lane stays fwd and P stays perspective()'s, byte for byte. */
export function lensShift(E, aspect, lane, at, P) {
  const s = E.shift; if (!s[0] && !s[1]) return false;
  const a = s[0] * E.tanH * aspect, b = s[1] * E.tanH, { fwd, right, up } = E.basis;
  for (let i = 0; i < 3; i++) lane[at + i] = fwd[i] - a * right[i] - b * up[i];
  P[8] = -s[0]; P[9] = -s[1]; return true;
}
/** the whole orientation (and the lens shift) as ONE string — what a cached 2-D overlay must key on, because a FREE
 *  camera can ROLL without moving either angle and a (yaw, pitch) key would hand it back a stale bitmap (wave 54) */
export function cameraKey(obs) {
  const s = obs.shift ? '|' + obs.shift.map((v) => v.toFixed(4)).join(',') : '|0.0000,0.0000';
  const m = PARITY < 0 ? '|m' : '';   // C2: a flipped view is another picture
  if (obs.mode === 'free' && obs.quat) return 'q' + obs.quat.map((v) => v.toFixed(6)).join(',') + s + m;
  return obs.yaw.toFixed(4) + '|' + obs.pitch.toFixed(4) + s + m;
}
function f16(h) {
  const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
  if (e === 0) return s * Math.pow(2, -14) * (f / 1024);
  if (e === 31) return f ? NaN : s * Infinity;
  return s * Math.pow(2, e - 15) * (1 + f / 1024);
}
/** x's f16 value under 'rtz' (toward zero) or 'rne' (to nearest, ties to even): tests/helpers/field-law.mjs' toF16, which tests/ cannot serve */
function toF16(x, mode) {
  const a = Math.abs(x); if (!(a > 0) || !Number.isFinite(a)) return x;
  let e = Math.floor(Math.log2(a)); if (2 ** e > a) e--; else if (2 ** (e + 1) <= a) e++;
  const u = a < 2 ** -14 ? 2 ** -24 : 2 ** (e - 10); let q = Math.floor(a / u) * u; const r = a - q;
  if (mode === 'rne' && (r > u / 2 || (r === u / 2 && Math.floor(q / u) % 2 === 1))) q += u; return Math.sign(x) * q;
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
    buf[o + 14] = T.lag[6] || 0; buf[o + 22] = T.leg[6] || 0;   // lag1.z / leg1.z: the seventh coefficient (n = 7, iteration 008 A7); a six-slot record reads 0
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
export const MAX_MOL_AO = 128;                                // the widest χ tile: a density (n²) needs one, so this is the density's ceiling
export const MOL_LIMITS = { shells: 256, prims: 2048, weights: 8192, ao: 768, prim: 32, cols: 192 };   // ao: the ORBITAL's ceiling (ORB_WGSL, no tile; C₆₀ is 300) · prim: the kernel's per-group register array · cols: a FACTOR's K, padded; the factor buffer is ao × cols (a factor fits when n × K ≤ it, iteration 008 V)
/* THE AO TIERS.  The χ tile is cap × 64 × 4 bytes of WORKGROUP memory — 4, 10, 16, 32 KiB — so the SMALLEST tier a molecule
   fits sets how many workgroups an SM holds: water, benzene, lysine, then tryptophan (87) to C₂₀H₂₀ (120) in 32 KiB, which
   lab/gpu-boot.js asks for and, where it is not granted, is built with 32 lanes (16 KiB).  An ORBITAL past 64 AOs takes
   ORB_WGSL, no tile (faster at every size, MEASURE.md §3); at ≤ 64 it keeps its tile — what the digest lock recorded. */
export const MOL_CAPS = [16, 40, 64, MAX_MOL_AO];
export const MOL_ORB_FROM = 64;
export const molTierFor = (nAO) => { const t = MOL_CAPS.findIndex((c) => nAO <= c);
  if (t < 0) throw new Error(`field: nAO ${nAO} is beyond the kernel's ${MAX_MOL_AO}`); return t; };
const MOL_SHELL_U = new Uint32Array(MOL_LIMITS.shells * 8), MOL_SHELL_F = new Float32Array(MOL_SHELL_U.buffer);
const MOL_ALPHA = new Float32Array(MOL_LIMITS.prims), MOL_W = new Float32Array(MOL_LIMITS.weights), MOL_CUT = new Float32Array(MOL_LIMITS.shells);
const SCREEN = Math.log(1e10);                                // ORB_WGSL skips a shell where e^{−α_min r²} < 1e-10 (molecular-field supportRadius's 1e-10)
const MOL_NC = [1, 3, 6];
/** pack one spec into the module's three scratch arrays; returns the counts the kernel and the uploads need */
export function packMolecule(spec) {
  if (!spec || !Array.isArray(spec.shells) || !spec.shells.length) throw new Error('field: a molecule spec needs { nAO, shells: [...] }');
  const nAO = spec.nAO | 0;
  if (!(nAO > 0) || nAO > MOL_LIMITS.ao) throw new Error(`field: nAO ${spec.nAO} is outside 1..${MOL_LIMITS.ao}`);
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
    let aMin = Infinity;
    for (let p = 0; p < nP; p++) {
      const pr = sh.prims[p];
      if (!pr || !(pr.alpha > 0) || !pr.w || pr.w.length !== nc) throw new Error(`field: an l = ${sh.l} primitive needs a positive alpha and ${nc} weights`);
      MOL_ALPHA[myOff + p] = pr.alpha; aMin = Math.min(aMin, pr.alpha);
      for (let c = 0; c < nc; c++) MOL_W[wOff + p * nc + c] = pr.w[c];
    }
    MOL_CUT[nShell] = SCREEN / aMin;
    if (!share) { pOff += nP; nExp += nP; }
    prev = { c: sh.center, nP, off: myOff, alphas: sh.prims.map((pr) => pr.alpha) };
    wOff += nP * nc; ao += nc; nShell++;
  }
  if (ao !== nAO) throw new Error(`field: the shells cover ${ao} AOs, the spec declares ${nAO}`);
  return { nShell, nPrim: pOff, nWeight: wOff, nExp, nAO, shell: MOL_SHELL_U, alpha: MOL_ALPHA, weight: MOL_W, cut: MOL_CUT };
}

export async function createField(canvas, opts = {}) {
  const out = { ok: false, error: null, adapterInfo: null, canvas };
  if (!navigator.gpu) { out.error = 'navigator.gpu is absent — WebGPU is not enabled in this browser'; return out; }
  /* OPTIMIZATION 2026-09-24 · M1 · THE ADAPTER AND THE DEVICE WERE ASKED FOR AT THE TOP OF <head> (lab/gpu-boot.js),
   * in parallel with the module graph — wave 58's `requiredLimits` block moved there whole.  This field takes that
   * early request ONCE; any later createField asks for its own device through the same function, so one field's
   * dispose() can never destroy another's.  The three sentences a failure says are this file's, as before. */
  const b = await (gpuBoot() || requestGpu());
  if (b.error) { out.error = 'WebGPU device request failed: ' + (b.error && b.error.message || b.error); return out; }
  if (!b.adapter) { out.error = 'no WebGPU adapter'; return out; }
  const adapter = b.adapter, device = b.device;
  out.limitsRequested = b.limitsRequested;
  try { const info = adapter.info || (adapter.requestAdapterInfo && await adapter.requestAdapterInfo()); out.adapterInfo = info ? { vendor: info.vendor, architecture: info.architecture, device: info.device, description: info.description } : null; } catch (_) {}
  device.addEventListener('uncapturederror', (e) => { out.lastGpuError = String(e.error && e.error.message || e.error); if (opts.onError) opts.onError(out.lastGpuError); });
  device.lost.then((info) => { out.ok = false; out.error = 'device lost: ' + info.message; if (opts.onLost) opts.onLost(info); });
  /* M1 · A DEVICE LOST BEFORE THIS FIELD EXISTED (while the module graph loaded) is not a field: the handler above has
     already been queued with the loss, so it says `device lost: …` and calls onLost; this returns the method-less
     failure object rack.js already boots with (M3), instead of configuring a canvas on a dead device. */
  if (b.lost) return out;

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
  let lastLUT = null, palSpan = 255;   // palSpan (iteration 015 W2): the palette's first and last stop as LUT indices, first · 512 + last — ESP reads the palette between them
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
  /* the molecular volume (CHEMISTRY): one pipeline per AO tier, each tier's lanes set by the workgroup memory this device
     GRANTED (0.4.0 S4c: the cap-128 tile is 32 KiB at 64 lanes, 16 KiB at 32) — then the orbital-only kernel, index ORB */
  const molWg = MOL_CAPS.map((cap) => (cap * 64 * 4 <= device.limits.maxComputeWorkgroupStorageSize ? 64 : 32)), ORB = MOL_CAPS.length, FAC = ORB + 1;
  const molModules = [...MOL_CAPS.map((cap, i) => device.createShaderModule({ code: molWgsl(cap, molWg[i]) })), device.createShaderModule({ code: ORB_WGSL })];
  /* compile messages are kept, never swallowed: a broken shader must say where */
  out.shaderMessages = [];
  for (const [name, m] of [['compute', computeModule], ['render', renderModule], ['line', lineModule], ...molModules.map((m2, i) => ['molecule' + (MOL_CAPS[i] || 'Orbital'), m2])]) {
    try { const info = await m.getCompilationInfo(); for (const msg of info.messages) out.shaderMessages.push({ shader: name, type: msg.type, line: msg.lineNum, col: msg.linePos, text: msg.message }); } catch (_) {}
  }
  /* M1 · …AND ONE LOST DURING THE COMPILE STRETCH ABOVE.  Before this line, Firefox took the WGSL branch below (a dead
     device reports compile errors), overwrote `device lost` with "WGSL compile error" and returned the method-less
     object; Chromium fell through to `ok: true` on a dead device.  Both now return here, lost and saying so. */
  if (b.lost) return out;
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
    { binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
    { binding: 6, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
    { binding: 7, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }] });
  const renderLayout = device.createPipelineLayout({ bindGroupLayouts: [renderBGL] });
  const lineBGL = device.createBindGroupLayout({ entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }, { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }] });
  const lineLayout = device.createPipelineLayout({ bindGroupLayouts: [lineBGL] });
  /* makeRenderPipeline(fmt) builds the GENERIC pipeline; makeRenderPipeline(fmt, mat) SELECTS the one to draw with (K2):
     the specialised copy when its key is ready and nothing pins the generic, else the generic.  One name for both on
     purpose: tests/gpu-cleanup.test.mjs lifts readPixels/throughput out by source text and injects this name. */
  const makeRenderPipeline = (fmt, mat) => mat ? pickRender(fmt, mat, fmt === format ? renderPipeline : out._rp)
    : device.createRenderPipeline({ layout: renderLayout, vertex: { module: renderModule, entryPoint: 'vs' }, fragment: { module: renderModule, entryPoint: 'fs', targets: [{ format: fmt }] }, primitive: { topology: 'triangle-list' } });
  const renderPipeline = makeRenderPipeline(format);
  const specCache = new Map();          // `${fmt}|${view}|${style}` → { pipeline, failed, promise }
  let pinDepth = 0;                     // > 0: every draw takes the generic pipeline (render-exact, capture: an export never changes pipeline mid-run)
  function specKey(fmt, mat) {
    if (mat.finish === 'glass' || (mat.boost && mat.boost.on)) return null;       // writeView's p6.w = 1 / p4.w = 1: the deleted code would run
    const v = mat.view | 0, st = mat.style | 0;                                   // exactly the words writeView writes into p0.x and p3.x
    return v >= 0 && v <= 4 && SPEC_STYLES.includes(st) ? fmt + '|' + v + '|' + st : null;
  }
  function specEntry(key, fmt, v, st) {
    let e = specCache.get(key);
    if (e) return e;
    e = { pipeline: null, failed: false, promise: null };
    specCache.set(key, e);
    try {
      device.pushErrorScope('validation');
      const module = device.createShaderModule({ code: specRenderWGSL(v, st) });
      const scope = device.popErrorScope();
      e.promise = Promise.all([scope, device.createRenderPipelineAsync({ layout: renderLayout, vertex: { module, entryPoint: 'vs' }, fragment: { module, entryPoint: 'fs', targets: [{ format: fmt }] }, primitive: { topology: 'triangle-list' } })])
        .then(([err, pl]) => { if (err) { e.failed = true; return false; } e.pipeline = pl; return true; }, () => { e.failed = true; return false; });
    } catch (_) { e.failed = true; e.promise = Promise.resolve(false); }
    return e;
  }
  function pickRender(fmt, mat, generic) {
    if (pinDepth > 0) return generic;
    const key = specKey(fmt, mat);
    return key ? specEntry(key, fmt, mat.view | 0, mat.style | 0).pipeline || generic : generic;
  }
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
  const radialBuf = device.createBuffer({ size: 48 * 256 * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });   // 43 rows in use: the 6 × 6 (n_r, l) grid and n = 7's (6, 0) and (0, 6) at 36 + l (atoms.js rowOf)
  const statsBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
  const viewBuf = device.createBuffer({ size: 16 * 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const vpBuf = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  /* the phase PALETTE: 256 RGBA colours around the complex plane (see palette.js) */
  const palBuf = device.createBuffer({ size: 256 * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  { const init = new Float32Array(256 * 4); for (let i = 0; i < 256; i++) { init[i * 4] = 1; init[i * 4 + 1] = 1; init[i * 4 + 2] = 1; init[i * 4 + 3] = 1; } device.queue.writeBuffer(palBuf, 0, init); }
  /* the MOLECULAR buffers: two param blocks (one per texture slot) and the four read-only tables */
  const molParamsBuf = [0, 1].map(() => device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }));
  const molShellBuf = device.createBuffer({ size: MOL_LIMITS.shells * 32, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const molAlphaBuf = device.createBuffer({ size: MOL_LIMITS.prims * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const molWBuf = device.createBuffer({ size: MOL_LIMITS.weights * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const molMatBuf = device.createBuffer({ size: MOL_LIMITS.ao * MOL_LIMITS.cols * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });   // a FACTOR's n × K at the ceilings (576 KiB, fixed): ≥ 128² and 2 × ao
  const molCutBuf = device.createBuffer({ size: MOL_LIMITS.shells * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });            // ORB_WGSL's screen, r² per shell
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
  /* THE RECTANGLES ARE KEPT IN CSS PIXELS (optimization 2026-09-24, K12 · BUG).  The block is in DEVICE pixels, and the
     factor k = canvas.width / cssW was applied only when the rectangle list changed — but the rack reads the rectangles
     BEFORE field.resize, so a render-scale, AUTO SCALE or DPR change (and the boot's first resize from the 300-px default
     canvas) left the mask at the old scale until a window moved.  Now resize() re-applies the new k to the same list. */
  const OCC_CSS = new Float64Array(32 * 4);
  function writeOcc() { const k = canvas.width / Math.max(1, cssW), n4 = OCC_U[0] * 4; for (let i = 0; i < n4; i++) OCC_F[i] = OCC_CSS[i] * k; device.queue.writeBuffer(occBuf, 0, OCC); }
  const cornerBind = device.createBindGroup({layout:lineBGL,entries:[{binding:0,resource:{buffer:cornerVP}},{binding:1,resource:{buffer:occNone}},{binding:2,resource:{buffer:inkBuf}}]});
  const lineBind = device.createBindGroup({ layout: lineBGL, entries: [{ binding: 0, resource: { buffer: vpBuf } }, { binding: 1, resource: { buffer: occBuf } }, { binding: 2, resource: { buffer: inkBuf } }] });

  /* the per-frame scratch (wave 45): the frame path allocates nothing — the params block, the stats zero, the view block,
     the three matrices and the line vertices are written in place */
  const PARAMS = new ArrayBuffer(32), PARAMS_U = new Uint32Array(PARAMS), PARAMS_F = new Float32Array(PARAMS), ZERO_U32 = new Uint32Array([0]);
  const VIEW = new Float32Array(64), M_PERSP = new Float32Array(16), M_LOOK = new Float32Array(16), M_VP = new Float32Array(16);
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
  let molCplx = null, molK = 0;                                          // the [re | im] staging vector a COMPLEX orbital is uploaded from (kind 2)
  const molParamSig = ['', '']; let molTier = 0;
  /* THE CARD (0.6.5 X2): a worker's volume OWNS the field while set — one storage buffer made on the first card and reused, CARD_WGSL compiled then */
  let card = null, cardDirty = false, cardBuf = null, cardPipe = null, cardBind = null, cardParams = null;
  let half = 7, space = 0, generation = 0, refGeneration = -1, refValid = false;
  const stats = { reconstructs: 0, presents: 0, chromeWrites: 0, lastEncodeMs: 0, lastReconstructWall: 0, resolution: 0, modesRendered: 0, generation: 0, molDispatches: 0, molAO: 0, molMs: 0, espRuns: 0, espMs: 0 };
  let dprCap = 2;                       // the device-pixel ceiling: 2 on a desktop, dropped at the phone breakpoint (wave 51)
  let jitterPin = -1;                   // 020 L1: ≥ 0 while PLAYBACK LOCK holds the march's seed (presents % 97 of the first locked present)
  let stepCap = Infinity;               // a runtime presentation budget; the saved/project ray-step choice remains mat.steps
  /* PACE (P1, 2026-09-25) · frames submitted whose onSubmittedWorkDone has not resolved — counted only where completion is
     PROMPT (`paced`, measured at boot below: Safari and Chromium answer a drained queue in a few ms, Firefox on a ~100 ms
     poll, AUDIT-A FA5), so the loop may wait for the GPU instead of queueing frames it cannot finish (WEBKIT-FPS-RESEARCH §1.3). */
  let inFlight = 0, paced = false, queueMs = 0;   // queueMs (P3): the last landed frame's submit → done, the backlog the device report reads
  /* 020 S2 · FIREFOX'S CAP: never `paced` (its completion is a ~100 ms poll), so its count is coarse — it is held at TWO in flight only while the
     last landed frame waited longer than HEAVY_MS (a backlog the poll cannot explain), and is free otherwise (S-BUILD.md: the cap at 64³ never binds) */
  const HEAVY_MS = 250;
  const landed = () => { inFlight--; };
  let cssW = canvas.clientWidth || 1, cssH = canvas.clientHeight || 1;   // the CSS box, kept current by the observer below
  if (typeof ResizeObserver === 'function') new ResizeObserver((entries) => {
    const r = entries[entries.length - 1].contentRect; cssW = r.width || cssW; cssH = r.height || cssH;
  }).observe(canvas);

  /* K7: binding 5 is the gas table once uploaded, a 16-byte stand-in until then (the 'auto' layout needs the binding; no
     record reads it while every lag[3] is 0) */
  let gasTab = null, gasTabStandIn = null;
  /* THE BEAT EQUALIZER (0.6.0 B1): its table, and EQ_WGSL's pipeline, compiled on the first frame that needs it (boot stays at 8) */
  let eqTable = null, eqWritten = null, eqPipeline = null, eqBuf = null, eqBind = null; const EQ_F = new Float32Array(EQ_G + 4);   // 009 N7: Γ 7 × 7 (98, padded to EQ_G = 100), then κ, mode, floor
  function bindCompute() {
    const tab = gasTab || gasTabStandIn || (gasTabStandIn = device.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE }));
    const entries = (tex, i) => [
      { binding: 0, resource: { buffer: paramsBuf[i] } }, { binding: 1, resource: { buffer: modesBuf[i] } },
      { binding: 2, resource: tex.createView({ dimension: '3d' }) }, { binding: 3, resource: { buffer: statsBuf } }, { binding: 4, resource: { buffer: radialBuf } },
      { binding: 5, resource: { buffer: tab } }];
    computeBind = [psiTex, refTex].map((tex, i) => device.createBindGroup({ layout: computePipeline.getBindGroupLayout(0), entries: entries(tex, i) }));
    eqBind = eqPipeline && [psiTex, refTex].map((tex, i) => device.createBindGroup({ layout: eqPipeline.getBindGroupLayout(0), entries: [...entries(tex, i), { binding: 6, resource: { buffer: eqBuf } }] }));
  }
  function eqReady() {
    if (!eqPipeline) {
      const module = device.createShaderModule({ code: EQ_WGSL });
      module.getCompilationInfo().then((info) => { for (const m of info.messages) out.shaderMessages.push({ shader: 'equalizer', type: m.type, line: m.lineNum, col: m.linePos, text: m.message }); }, () => {});
      eqPipeline = device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } });
      eqBuf = device.createBuffer({ size: EQ_F.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }); bindCompute();
    }
    if (eqWritten !== eqTable) { eqWritten = eqTable; EQ_F.set(eqTable.gamma); EQ_F[EQ_G] = eqTable.kappa; EQ_F[EQ_G + 1] = eqTable.mode; EQ_F[EQ_G + 2] = 2e-4; device.queue.writeBuffer(eqBuf, 0, EQ_F); }   // floor: the signed view's 2·10⁻⁴ of the local within-shell ρ
    return true;
  }
  function bindRender() {
    renderBind = device.createBindGroup({ layout: renderBGL, entries: [
      { binding: 0, resource: { buffer: viewBuf } }, { binding: 1, resource: psiTex.createView({ dimension: '3d' }) },
      { binding: 2, resource: refTex.createView({ dimension: '3d' }) }, { binding: 3, resource: sampler }, { binding: 4, resource: { buffer: statsBuf } },
      { binding: 5, resource: { buffer: palBuf } }, { binding: 6, resource: { buffer: atomBuf } }, { binding: 7, resource: { buffer: phiBuf } }] });
  }
  /* ── THE ATOMS AND THE POTENTIAL (iteration 014 B) ─────────────────────────────────────────────────────────────────────
   * setAtoms(atoms, charge) uploads the molecule BALLS, STICKS and ESP draw: two vec4 an atom (centre + r_vdW, negative for an atom no bond
   * reaches; CPK sRGB + Z) and then elements.js' bonds (bondsOf, the 1.3 × (rᵢ + rⱼ) pairs: the one rule, which skeleton.js' richer bondsOf also starts from) — only when the atoms change.  φ is the Poisson pass's (ESP_WGSL,
   * run while ESP is drawn: ONCE per LANDING — the atoms, a molecule or its basis (setMolecule's first matrix), the VIEW (the matrix kind), a card,
   * the box or the grid — and, under mat.espLive, again at most once a second while the density moves; iteration 015 W0) or a volume's grid
   * (setEspGrid, which then owns it). */
  let espM = 0, espW = 0;
  let atomBuf = device.createBuffer({ size: 32, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  let phiBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  let atomsIn = null, atomsKey = '', atomsN = 0, bondsN = 0, atomsV = 0, atomsNe = 0, atomsBound = [0, 0, 0, 0, 0], atomsAbs = 0;
  const phi = { src: 'poisson', ok: false, M: 0, half: 0, key: '', gen: -1, at: 0, pending: 0 };
  let espLand = 0, molFresh = false;                             // iteration 015 W0: a landing's count (φ's key without the density's generation) and "the next matrix is a new molecule's"
  let espPipes = null, espBGL = null, espParams = null, espE = null, espPart = null, espCorr = null, espBind = null;
  const ESP_P = new ArrayBuffer(48), ESP_PU = new Uint32Array(ESP_P), ESP_PF = new Float32Array(ESP_P);
  const hex3 = (h) => { const x = h.replace('#', ''), f = x.length === 3 ? x.split('').map((c) => c + c).join('') : x; return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255); };
  function setAtoms(atoms, charge = 0) {
    if (atoms === atomsIn) return atomsN;
    atomsIn = atoms; atoms = atoms || [];
    const key = atoms.map((a) => `${a.Z},${a.x.toFixed(4)},${a.y.toFixed(4)},${a.z.toFixed(4)}`).join(';') + '|' + charge;
    if (key === atomsKey) return atomsN;
    atomsKey = key; atomsV++; atomsN = Math.min(atoms.length, 1024);
    const A = atoms.slice(0, atomsN), bonds = bondsOf(A), lone = new Uint8Array(atomsN).fill(1); for (const [i, j] of bonds) { lone[i] = 0; lone[j] = 0; }
    bondsN = bonds.length;
    const f = new Float32Array(Math.max(8, (2 * atomsN + bondsN) * 4)); let Z = 0;
    const c = [0, 0, 0]; for (const a of A) { c[0] += a.x / atomsN; c[1] += a.y / atomsN; c[2] += a.z / atomsN; }
    let dmax = 0, rmax = 0;
    A.forEach((a, i) => { const r = vdwRadius(a.Z), col = hex3(CPK[a.Z] || '#ff1493'); f.set([a.x, a.y, a.z, lone[i] ? -r : r, col[0], col[1], col[2], a.Z], 8 * i); Z += a.Z;
      dmax = Math.max(dmax, Math.hypot(a.x - c[0], a.y - c[1], a.z - c[2])); rmax = Math.max(rmax, r); atomsAbs = Math.max(i ? atomsAbs : 0, Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)); });
    bonds.forEach(([i, j], k) => f.set([i, j, 0, 0], 4 * (2 * atomsN + k)));
    atomsNe = Z - charge; atomsBound = [c[0], c[1], c[2], dmax, rmax];
    if (atomBuf.size < f.byteLength) { atomBuf.destroy(); atomBuf = device.createBuffer({ size: f.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); if (psiTex) bindRender(); espBind = null; }
    device.queue.writeBuffer(atomBuf, 0, f);
    return atomsN;
  }
  function phiBufFor(n) { const bytes = Math.max(16, n ** 3 * 4); if (phiBuf.size < bytes) { phiBuf.destroy(); phiBuf = device.createBuffer({ size: bytes, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); if (psiTex) bindRender(); espBind = null; } }
  function setEspGrid(g) {
    if (g === phi.gridIn) return g ? phi : null;
    phi.gridIn = g;
    if (!g) { if (phi.src === 'grid') { phi.src = 'poisson'; phi.ok = false; phi.key = ''; } return null; }
    if (!(g.n >= 2) || !(g.half > 0) || !g.data || g.data.length !== g.n ** 3) throw new Error('field: an ESP grid needs { n ≥ 2, half > 0, data: n³ }');
    phiBufFor(g.n); device.queue.writeBuffer(phiBuf, 0, g.data instanceof Float32Array ? g.data : new Float32Array(g.data));
    Object.assign(phi, { src: 'grid', ok: true, M: g.n, half: g.half, key: '' }); return phi;
  }
  function encodeEsp(enc, mat) {
    if ((mat.style | 0) !== STYLE.esp || !atomsN || phi.src !== 'poisson' || !psiTex) return false;
    /* iteration 015 W0 · THE ESP STALL: the clock moving the density (RUN, a beating register) re-solved φ once a second with LIVE off — 50–370 ms of GPU
       each (W0-BUILD.md), a hitch the drag fell into.  Now LIVE off solves once per landing; LIVE on keeps the 1 Hz law on a moving density. */
    const key = espLand + ':' + atomsV + ':' + half + ':' + res, now = performance.now();
    if (phi.ok && key === phi.key && (!mat.espLive || generation === phi.gen || now - phi.at < 1000)) return false;
    if (!espPipes) {
      espBGL = device.createBindGroupLayout({ entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'float', viewDimension: '3d' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, sampler: { type: 'filtering' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        ...[4, 5, 6, 7].map((binding) => ({ binding, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }))] });
      const module = device.createShaderModule({ code: ESP_WGSL }), layout = device.createPipelineLayout({ bindGroupLayouts: [espBGL] });
      espCorr = device.createBuffer({ size: 1024 * 4, usage: GPUBufferUsage.STORAGE });
      espPipes = Object.fromEntries(['elec', 'core', 'total', 'rhs', 'sor'].map((e) => [e, device.createComputePipeline({ layout, compute: { module, entryPoint: e } })]));
      espParams = [0, 1].map(() => device.createBuffer({ size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }));
    }
    const hh = Math.min(half, atomsAbs + 8), M = Math.max(64, Math.min(128, Math.ceil(2 * hh / 0.35 / 16) * 16));
    if (M > espM) { espM = M; espW = Math.ceil(M ** 3 / 256); if (espE) { espE.destroy(); espPart.destroy(); }
      espE = device.createBuffer({ size: M ** 3 * 4, usage: GPUBufferUsage.STORAGE }); espPart = device.createBuffer({ size: (espW + 1) * 16, usage: GPUBufferUsage.STORAGE }); espBind = null; }
    const W = Math.ceil(M ** 3 / 256);
    phiBufFor(M);
    if (!espBind) espBind = espParams.map((pb) => device.createBindGroup({ layout: espBGL, entries: [{ binding: 0, resource: { buffer: pb } },
      { binding: 1, resource: psiTex.createView({ dimension: '3d' }) }, { binding: 2, resource: sampler }, { binding: 3, resource: { buffer: atomBuf } },
      { binding: 4, resource: { buffer: espE } }, { binding: 5, resource: { buffer: espPart } }, { binding: 6, resource: { buffer: phiBuf } }, { binding: 7, resource: { buffer: espCorr } }] }));
    ESP_PU[0] = M; ESP_PU[1] = atomsN; ESP_PU[3] = W; ESP_PF[4] = hh; ESP_PF[5] = 2 * hh / M; ESP_PF[6] = atomsNe; ESP_PF[7] = 2 / (1 + Math.sin(Math.PI / M)); ESP_PF[8] = half;
    for (const c of [0, 1]) { ESP_PU[2] = c; device.queue.writeBuffer(espParams[c], 0, ESP_P); }
    const pass = enc.beginComputePass();
    pass.setBindGroup(0, espBind[0]);
    pass.setPipeline(espPipes.elec); pass.dispatchWorkgroups(W);
    pass.setPipeline(espPipes.core); pass.dispatchWorkgroups(atomsN);
    pass.setPipeline(espPipes.total); pass.dispatchWorkgroups(1);
    pass.setPipeline(espPipes.rhs); pass.dispatchWorkgroups(W);
    pass.setPipeline(espPipes.sor);
    for (let k = 0; k < 3 * M; k++) for (const c of [0, 1]) { pass.setBindGroup(0, espBind[c]); pass.dispatchWorkgroups(W); }
    pass.end();
    Object.assign(phi, { ok: true, M, half: hh, key, gen: generation, at: now, pending: now }); stats.espRuns++;
    return true;
  }
  function espDone() { if (!phi.pending) return; const t = phi.pending; phi.pending = 0; device.queue.onSubmittedWorkDone().then(() => { stats.espMs = performance.now() - t; }, () => {}); }
  function setResolution(n) {
    if (n === res) return;
    res = n;
    if (psiTex) psiTex.destroy(); if (refTex) refTex.destroy();
    const mk = () => device.createTexture({ size: [n, n, n], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC });
    psiTex = mk(); refTex = mk();
    bindCompute();
    bindRender(); espBind = null;
    molBind = molPipelines.map(molBindFor);
    molDirty = molDirty || !!molSpec; cardDirty = !!card; cardBind = null; stats.resolution = n;
    refValid = false;
  }
  const molBindFor = (pl, p) => [psiTex, refTex].map((tex, i) => device.createBindGroup({ layout: pl.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: molParamsBuf[i] } }, { binding: 1, resource: { buffer: molShellBuf } },
      { binding: 2, resource: { buffer: molAlphaBuf } }, { binding: 3, resource: { buffer: molWBuf } },
      { binding: 4, resource: { buffer: molMatBuf } }, { binding: 5, resource: tex.createView({ dimension: '3d' }) },
      { binding: 6, resource: { buffer: statsBuf } }, ...(p >= ORB ? [{ binding: 7, resource: { buffer: molCutBuf } }] : [])] }));
  function facReady() {                                        // the ninth module, compiled on the first factor matrix (boot stays at 8, as eqReady)
    if (molPipelines[FAC]) return;
    const module = device.createShaderModule({ code: FACTOR_WGSL });
    module.getCompilationInfo().then((info) => { for (const m of info.messages) out.shaderMessages.push({ shader: 'factor', type: m.type, line: m.lineNum, col: m.linePos, text: m.message }); }, () => {});
    molPipelines[FAC] = device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } }); molBind[FAC] = molBindFor(molPipelines[FAC], FAC);
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
    const eq = slot === 0 && space === 0 && eqTable && eqReady();                                // the reference (slot 1) stays the plain state
    pass.setPipeline(eq ? eqPipeline : computePipeline); pass.setBindGroup(0, (eq ? eqBind : computeBind)[slot]);
    const g = Math.ceil(res / 4); pass.dispatchWorkgroups(g, g, g);
    pass.end();
    return count;
  }
  /** ONE molecular dispatch into `slot` (0 = psiTex, 1 = refTex): the same ceil(n/4)³ grid of 4×4×4 workgroups
      the eigenmode kernel uses, and the same stats[slot] the presenter normalises by. */
  function writeMolParams(slot) {
    const u = MOL_PARAMS_U, f = MOL_PARAMS_F;
    u[0] = res; u[1] = molPack.nAO; u[2] = molPack.nShell; u[3] = molKind; f[4] = half; u[5] = slot; f[6] = molK;
    const sig = `${res}|${molPack.nAO}|${molPack.nShell}|${molKind}|${half}|${molK}`;
    if (molParamSig[slot] === sig) return;                     // a queue.writeBuffer is ~2.5 ms of staging here
    molParamSig[slot] = sig; device.queue.writeBuffer(molParamsBuf[slot], 0, MOL_PARAMS);
  }
  /** the road a dispatch takes: a factor FACTOR_WGSL, an orbital past MOL_ORB_FROM AOs ORB_WGSL, anything else its tier's χ tile */
  const molRoad = () => (molKind === 4 ? FAC : (molKind === 1 || molKind === 2) && molPack.nAO > MOL_ORB_FROM ? ORB : molTier);
  function dispatchMol(pass, slot, k = 1) {
    const r = molRoad(), g = Math.ceil(res / 4), z = r >= ORB ? g : Math.ceil(res / (molWg[r] / 16));   // a 32-lane tier is 4 × 4 × 2
    pass.setPipeline(molPipelines[r]); pass.setBindGroup(0, molBind[r][slot]);
    for (let i = 0; i < k; i++) pass.dispatchWorkgroups(g, g, z);
  }
  function encodeMolecule(enc, slot, tw) {
    writeMolParams(slot);
    device.queue.writeBuffer(statsBuf, slot * 4, ZERO_U32);     // the max accumulator: zeroed before every dispatch
    const pass = enc.beginComputePass(tw ? { timestampWrites: tw } : {});
    dispatchMol(pass, slot);
    pass.end();
    return molPack.nAO;
  }
  function encodeCard(enc) {                                     // the card's ONE lazy pass into psiTex: MP's n, half, slot 0, r0 = N, r1 = the card's half
    const u = MOL_PARAMS_U, f = MOL_PARAMS_F; u.fill(0); u[0] = res; f[4] = half; f[6] = card.N; f[7] = card.half;
    device.queue.writeBuffer(cardParams, 0, MOL_PARAMS); device.queue.writeBuffer(statsBuf, 0, ZERO_U32);
    cardBind = cardBind || device.createBindGroup({ layout: cardPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: cardParams } },
      { binding: 4, resource: { buffer: cardBuf } }, { binding: 5, resource: psiTex.createView({ dimension: '3d' }) }, { binding: 6, resource: { buffer: statsBuf } }] });
    const pass = enc.beginComputePass(), g = Math.ceil(res / 4); pass.setPipeline(cardPipe); pass.setBindGroup(0, cardBind); pass.dispatchWorkgroups(g, g, g); pass.end();
    cardDirty = false; generation++; stats.generation = generation; stats.reconstructs++;
  }
  function writeView(obs, mat, w, h) {
    const E = cameraEye(obs, half), B = E.basis, cam = E.eye, tanH = E.tanH, aspect = w / h;
    const v = VIEW;
    v[0] = cam[0]; v[1] = cam[1]; v[2] = cam[2]; v[3] = half;
    v[4] = B.right[0]; v[5] = B.right[1]; v[6] = B.right[2]; v[7] = tanH * aspect;
    v[8] = B.up[0]; v[9] = B.up[1]; v[10] = B.up[2]; v[11] = tanH;
    v[12] = B.fwd[0]; v[13] = B.fwd[1]; v[14] = B.fwd[2]; v[15] = Math.min(mat.steps || 160, stepCap);
    v[16] = mat.view | 0; v[17] = mat.exposure; v[18] = mat.softness; v[19] = (jitterPin >= 0 ? jitterPin : stats.presents % 97) / 97;   // 020 L1: PLAYBACK LOCK pins the march's seed
    v[20] = mat.slice ? mat.slice.mode | 0 : 0; v[21] = mat.slice ? mat.slice.axis | 0 : 2; v[22] = mat.slice ? mat.slice.pos : 0; v[23] = mat.slice ? mat.slice.thick : 0.03;
    v[24] = mat.hueShift || 0; v[25] = mat.invert ? 1 : 0; v[26] = mat.paletteOn ? 1 : 0; v[27] = mat.dither || 0;   // wave 54: the DITHER amplitude in LSB (p0.w keeps the ray-march jitter seed)
    v[28] = mat.style | 0; v[29] = mat.iso === undefined ? 0.06 : mat.iso; v[30] = mat.grain === undefined ? 0.35 : mat.grain; v[31] = kneeQ(mat.knee);   // iteration 008 G: THE KNEE's q, 0 at 0.6
    const bon = mat.boost && mat.boost.on, bk = bon ? mat.boost.k : null;
    v[32] = bon ? bk[0] : 0; v[33] = bon ? bk[1] : 0; v[34] = bon ? bk[2] : 0; v[35] = bon ? 1 : 0;
    const bgc = mat.bg || DEFAULT_BG;
    v[36] = bgc[0]; v[37] = bgc[1]; v[38] = bgc[2]; v[39] = mat.gamma === undefined ? 1 : mat.gamma;
    v.copyWithin(40,36,40);
    const sn = mat.slice?.normal || AXIS_NORMALS[mat.slice?.axis ?? 2] || AXIS_NORMALS[2];
    const snLen = Math.hypot(sn[0], sn[1], sn[2]) || 1;
    v[36]=sn[0]/snLen; v[37]=sn[1]/snLen; v[38]=sn[2]/snLen;
    v[39]=mat.finish==='glass'?1:mat.finish==='matte'?2:0;
    const asz = Number.isFinite(mat.atomSize) ? mat.atomSize : 1, srad = Number.isFinite(mat.stickR) ? mat.stickR : STICK_R, prb = Number.isFinite(mat.probe) ? mat.probe : PROBE_R;   // iteration 014 B: absent keys read the defaults
    v[44] = atomsN; v[45] = bondsN; v[46] = asz; v[47] = srad;
    v[48] = ESP_SURF.indexOf(mat.espSurf) < 0 ? 0 : ESP_SURF.indexOf(mat.espSurf); v[49] = prb; v[50] = Number.isFinite(mat.espRange) ? mat.espRange : ESP_RANGE; v[51] = palSpan;
    v[52] = phi.half; v[53] = phi.M; v[54] = phi.ok ? 1 : 0; v[55] = (mat.iso === undefined ? 0.06 : mat.iso) / 30;
    v[56] = atomsBound[0]; v[57] = atomsBound[1]; v[58] = atomsBound[2]; v[59] = atomsBound[3] + Math.max(atomsBound[4] * Math.max(asz, 1), srad) + 0.01;
    v[60] = espSoftOf(mat.softness); v[61] = mat.espBare ? 1 : 0;   // iteration 016 S1 · S2
    perspective(obs.fov || 0.6, aspect, 0.05 * half, 20 * half, M_PERSP); lensShift(E, aspect, v, 12, M_PERSP);   // S2: the lane and the principal point, or nothing at p = 0
    device.queue.writeBuffer(viewBuf, 0, v);
    lookAt(cam, E.target, B.up, M_LOOK); mul4(M_PERSP, M_LOOK, M_VP);
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
    pass.setPipeline(pickRender(format, mat, renderPipeline)); pass.setBindGroup(0, renderBind); pass.draw(3);
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
    if (card) { if (cardDirty) encodeCard(enc); }                // THE CARD owns the volume: one resample when dirty, else nothing — neither kernel runs
    else if (molOn) {
      if (molDirty || molRefDirty) {
        if (molRefDirty) { encodeMolecule(enc, 1); refValid = true; refGeneration = generation + 1; molRefDirty = false; }
        if (molDirty) { stats.molAO = encodeMolecule(enc, 0); stats.molDispatches++; molDirty = false; generation++; stats.generation = generation; stats.reconstructs++; stats.lastReconstructWall = t0; }
      }
    } else {
    if (refModes) { encodeCompute(enc, 1, refModes); refValid = true; refGeneration = generation + 1; }
    if (modes) { stats.modesRendered = encodeCompute(enc, 0, modes); generation++; stats.reconstructs++; stats.generation = generation; stats.lastReconstructWall = t0; }
    }
    const w = canvas.width, h = canvas.height;
    encodeEsp(enc, mat);                                          // iteration 014 B3: φ, after the volume it reads and before the present that reads it
    if (w > 0 && h > 0) { encodeRender(enc, ctx.getCurrentTexture().createView(), obs, mat, w, h); stats.presents++; }
    device.queue.submit([enc.finish()]); espDone();
    { inFlight++; const ts = performance.now(); device.queue.onSubmittedWorkDone().then(() => { inFlight--; queueMs = performance.now() - ts; }, landed); }
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
  async function readPixels(obs, mat, w = 320, h = 240, keep = false) {   // keep: the pixels too ({ px, bpr }), for a gate that needs where (S2)
    const tex = device.createTexture({ size: [w, h], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
    let buf;
    try {
      if (!out._rp) { out._rp = makeRenderPipeline('rgba8unorm'); out._lp = makeLinePipeline('rgba8unorm'); }
      const rp = makeRenderPipeline('rgba8unorm', mat), lp = out._lp;   // K2: selected synchronously — nothing awaits before the submit
      const enc = device.createCommandEncoder();
      encodeEsp(enc, mat);
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
      const kept = keep ? { px: px.slice(), bpr } : null; buf.unmap();
      return { w, h, total: w * h, nonBlack, bright, meanLum: lum / (w * h), meanChroma: hue / (w * h), hash: hsh.toString(16), ...kept };
    } finally { buf?.destroy(); tex.destroy(); }
  }
  /** THE CHROME AS THE SCREEN GETS IT (wave 48).  readPixels renders the volume and returns aggregates; this
      renders the LINES ALONE over the stage's own ground (mat.bg, not black — the light theme's near-black frame
      is only legible against the light stage it is drawn on) and classifies every pixel that carries chroma.
      It is the colour proof that reads the rendered image rather than the buffer writeLines just filled. */
  async function linePixels(obs, mat, w = 256, h = 256, keep = false) {
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
      const kept = keep ? { px: px.slice(), bpr } : null; buf.unmap();
      return { w, h, buckets: B, top, ground, darkest: Math.round(darkest), darkestPx, ...kept };
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
  /** THE WHOLE CACHE AS THE PRESENTER SAMPLES IT (wave 134, FILE › EXPORT SHAPE / GRID): the raw rgba16float texels
      (.r = Re ψ, .g = Im ψ, index x + N·y + N²·z) and stats[0], the ρmax the presenter divides by, in ONE copy and ONE
      map — the grid and its normaliser can never come from two different reconstructs.  Decoding is the worker's. */
  async function readGrid() {
    const bpr = res * 8, size = bpr * res * res;
    const buf = device.createBuffer({ size: size + 16, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    try {
      const enc = device.createCommandEncoder();
      enc.copyTextureToBuffer({ texture: psiTex }, { buffer: buf, bytesPerRow: bpr, rowsPerImage: res }, [res, res, res]);
      enc.copyBufferToBuffer(statsBuf, 0, buf, size, 16);
      device.queue.submit([enc.finish()]);
      await buf.mapAsync(GPUMapMode.READ);
      const all = buf.getMappedRange(), texels = new Uint16Array(all.slice(0, size)), rhoMax = new Float32Array(all.slice(size, size + 4))[0];
      buf.unmap();
      return { texels, N: res, half, rhoMax, generation };
    } finally { buf.destroy(); }
  }
  /** THE ERROR FIELD (iteration 005 P3): the display grid against its exact twin — on a press or a GRID change, never on the frame path.
      ONE readback (readGrid's road); every voxel centre set against `psi(x, y, z) → { re, im }` in f64 (the caller's: the register at the
      field's own t through the Hamiltonian's CPU twin), or — a molecule — the matrix this field drew (copied BEFORE the copy is submitted,
      so a kicked density is the frame it caught) through molecular-field.js' f64 evaluator on a 4 × 4 × 4 probe of voxel centres (n² per
      point on the main thread: the whole grid is too slow for a big molecule).  In the FIELD LAW's own metrics (tests/helpers/field-law.mjs,
      the gate's ledger and quantile): 'psi' — |Δψ| RMS · 99.8 % · worst voxel · worst / max|ψ|; 'rho' — |Δρ|/ρ over the f16-normal √ρ ·
      worst |Δρ| over the probe / ρ̂max (the texture's own maximum; a probe rarely holds the peak).  `mode`: of the components where toward-zero and to-nearest disagree, the one the store
      matched.  `above`: voxels whose ρ̂ exceeds ρ (the one-sided law ρ̂ ≤ ρ), `aboveF32` those past the kernel's f32 (4e-6 relative),
      `deficit` the largest (ρ − ρ̂)/ρ where every stored component is f16-normal or zero (the domain of the one-sided law's 2·2⁻¹⁰; a
      subnormal component's ulp is 2⁻²⁴ absolute, so its relative deficit is larger, and is not the law's).  `{ why }` where there is no twin. */
  async function errorField(psi = null, { t = null } = {}) {
    const t0 = performance.now();
    if (card) return { why: 'a card owns the volume' };
    const mol = molSpec && molMat ? { M: molMat.slice(), kind: molKindName, cplx: molKind === 2, K: molK, shells: molSpec.shells } : null;
    if (molSpec && !mol) return { why: 'the molecule has no matrix yet' };
    if (mol && (mol.kind === 'diff' || mol.kind === 'signed')) return { why: 'Δρ is formed against a reference: no f64 twin here' };
    if (!mol && space === 0 && eqTable) return { why: 'the BEAT EQUALIZER draws a mixed picture, not one ψ' };
    if (!mol && !psi) return { why: 'no closed form for this volume' };
    const G = await readGrid(), readMs = performance.now() - t0, N = G.N, H = G.half, u = G.texels, at = (i) => (i + 0.5) / N * 2 * H - H;
    const L = { disc: 0, rtz: 0, rne: 0 }, law = (s, x) => { const z = toF16(x, 'rtz'), r = toF16(x, 'rne'); if (z !== r) { L.disc++; if (s === z) L.rtz++; else if (s === r) L.rne++; } };
    const quant = (v) => { const s = Float64Array.from(v).sort(); return s[Math.min(s.length - 1, Math.ceil(0.998 * s.length) - 1)]; };
    let above = 0, aboveF32 = 0, deficit = 0, yieldAt = performance.now();
    const nrm = (s) => s === 0 || Math.abs(s) >= 2 ** -14;
    const side = (r, x2, a, b) => { if (r > x2) { above++; if (r > x2 * (1 + 4e-6)) aboveF32++; } if (x2 >= 2 ** -28 && nrm(a) && nrm(b)) deficit = Math.max(deficit, (x2 - r) / x2); };
    const done = (metric, o) => ({ N, half: H, t, metric, ...o, mode: !L.disc ? 'unread' : L.rtz >= 0.99 * L.disc ? 'toward zero' : L.rne >= 0.99 * L.disc ? 'to nearest' : 'neither',
      ledger: L, above, aboveF32, deficit, generation: G.generation, readMs: +readMs.toFixed(1), ms: +(performance.now() - t0).toFixed(1) });
    if (!mol) {
      const d = new Float64Array(N * N * N); let s2 = 0, worst = 0, max2 = 0;
      for (let k = 0; k < N; k++) {
        if (performance.now() - yieldAt > 12) { await new Promise((r) => setTimeout(r)); yieldAt = performance.now(); }   // the page keeps its frames
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
          const v = i + N * j + N * N * k, a = f16(u[v * 4]), b = f16(u[v * 4 + 1]), c = psi(at(i), at(j), at(k)), x2 = c.re * c.re + c.im * c.im;
          law(a, c.re); law(b, c.im); side(a * a + b * b, x2, a, b);
          const e = Math.hypot(a - c.re, b - c.im); d[v] = e; s2 += e * e; if (e > worst) worst = e; if (x2 > max2) max2 = x2;
        }
      }
      return done('psi', { voxels: d.length, probe: 0, rms: Math.sqrt(s2 / d.length), p998: quant(d), worst, relToMax: worst / Math.sqrt(max2), rhoMax: max2 });
    }
    const ev = evaluator(shellsFromField(mol.shells)), n = ev.n, M = mol.M, K = mol.K, P = 4, idx = Array.from({ length: P }, (_, a) => Math.floor((2 * a + 1) * N / (2 * P))), rel = [];
    let rhoHat = 0, dMax = 0; for (let v = 0; v < N * N * N; v++) { const a = f16(u[v * 4]), b = f16(u[v * 4 + 1]), r = a * a + b * b; if (r > rhoHat) rhoHat = r; }
    for (const k of idx) for (const j of idx) for (const i of idx) {
      const v = i + N * j + N * N * k, a = f16(u[v * 4]), b = f16(u[v * 4 + 1]), x = ev.ao([at(i), at(j), at(k)]);
      let re = 0, im = 0, rho = 0;
      if (mol.kind === 'orbital') { for (let q = 0; q < n; q++) { re += M[q] * x[q]; if (mol.cplx) im += M[n + q] * x[q]; } law(a, re); law(b, im); rho = re * re + im * im; }
      else {
        if (mol.kind === 'factor') for (let c = 0; c < K; c++) { let f = 0; for (let q = 0; q < n; q++) f += M[q * K + c] * x[q]; rho += 2 * f * f; }
        else for (let p = 0; p < n; p++) { if (x[p] === 0) continue; let s = 0; for (let q = 0; q < n; q++) s += M[p * n + q] * x[q]; rho += x[p] * s; }
        rho = Math.max(0, rho); law(a, Math.sqrt(rho)); law(b, 0);
      }
      const r = a * a + b * b, dr = Math.abs(r - rho); side(r, rho, a, b); if (dr > dMax) dMax = dr; if (rho >= 2 ** -28) rel.push(dr / rho);
    }
    const s2 = rel.reduce((s, e) => s + e * e, 0);
    return done('rho', { voxels: P ** 3, probe: P ** 3, normal: rel.length, kind: mol.kind, rms: rel.length ? Math.sqrt(s2 / rel.length) : NaN, p998: rel.length ? quant(rel) : NaN,
      worst: rel.length ? Math.max(...rel) : NaN, relToMax: dMax / rhoHat, rhoMax: rhoHat });
  }

  /**
   * GPU THROUGHPUT, the honest number any browser gives (Firefox resolves completion on a ~100 ms tick; its timestamp
   * queries are real since 157, MEASURE.md §3, but this needs no feature): encode n frames back-to-back into an offscreen target of the
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
            pass.setPipeline(makeRenderPipeline('rgba8unorm', mat)); pass.setBindGroup(0, renderBind); pass.draw(3);
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
    card = null;                                                 // a card belongs to the molecule it was computed for: any (re)upload or drop lets it go
    if (!spec) { molSpec = null; molPack = null; molMat = null; molDirty = false; molRefDirty = false; refValid = false; return null; }
    const pack = packMolecule(spec);
    molTier = pack.nAO <= MAX_MOL_AO ? molTierFor(pack.nAO) : -1;                 // −1: no χ tile holds it — an ORBITAL only (ORB_WGSL)
    device.queue.writeBuffer(molShellBuf, 0, pack.shell, 0, pack.nShell * 8);
    device.queue.writeBuffer(molAlphaBuf, 0, pack.alpha, 0, pack.nPrim);
    device.queue.writeBuffer(molWBuf, 0, pack.weight, 0, pack.nWeight);
    device.queue.writeBuffer(molCutBuf, 0, pack.cut, 0, pack.nShell);
    molSpec = spec; molPack = pack; molDirty = true; molFresh = true; espLand++;
    if (molTier < 0 && molMat && (molKind === 0 || molKind === 3)) molMat = null;   // a matrix kept from a smaller molecule cannot draw here
    if (spec.half !== undefined) { if (!(spec.half > 0)) throw new Error('field: a molecule spec half must be positive'); half = spec.half; }
    return { nAO: pack.nAO, nShell: pack.nShell, nPrim: pack.nPrim, nWeight: pack.nWeight, expsPerVoxel: pack.nExp, cap: MOL_CAPS[molTier] || null, half };
  }
  /** the volume's matrix.  'density' and 'diff': M = Float32Array(nAO²), symmetric Re D, ρ = Σ_μν M_μν χ_μ χ_ν and
      the texel is (√ρ, 0).  'signed': the same n² matrix WITHOUT the square root — the texel is the signed value,
      read by 'real' as two-colour lobes, which is what a difference of densities needs (see the header).
      'orbital': M = Float32Array(nAO), ψ = Σ_μ c_μ χ_μ and the texel is the signed (ψ, 0),
      or M = { re, im } — two Float32Array(nAO) — for a COMPLEX orbital, whose texel is the full (ψ_re, ψ_im) so
      'phase' reads arg ψ over the whole turn (the ORBITALS register).  Both vectors ride in the one matrix buffer,
      the real part at 0 and the imaginary part at nAO, which is what the kernel's kind 2 reads.
      'factor' (0.6.1 F1): M = { C: Float32Array(n·K) row-major, K ≤ MOL_LIMITS.cols } — the occupied columns, ρ = 2 Σ_k φ_k², texel (√ρ, 0)
      at any nAO (FACTOR_WGSL), so a record past the χ tile draws its density exactly, with no D.
      `ref: true` also writes this volume into refTex, which is the ρ_ref view 'diff' subtracts. */
  function setMoleculeMatrix(M, { kind = 'density', ref = false } = {}) {
    if (!molSpec) throw new Error('field: setMoleculeMatrix before setMolecule');
    if (kind !== 'density' && kind !== 'diff' && kind !== 'orbital' && kind !== 'signed' && kind !== 'factor') throw new Error(`field: unknown molecule matrix kind '${kind}'`);
    const n = molPack.nAO;
    if (molFresh || kind !== molKindName) { molFresh = false; espLand++; }   // iteration 015 W0: a landing (a new molecule's first matrix, or another VIEW) for φ
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
    if (kind === 'factor') {
      const K = M ? M.K | 0 : 0, Kp = Math.ceil(K / 32) * 32;
      /* iteration 008 V: the bound is the matrix buffer's room (n × K padded ≤ ao × cols, 576 KiB), not K alone — the kernel walks K in blocks of 32
         with no ceiling of its own, so a 334-AO record with 203 occupied columns (VOL. I's colfosceril palmitate, 334 × 224) draws; C₆₀ is 300 × 192 */
      if (!(K > 0) || n * Kp > MOL_LIMITS.ao * MOL_LIMITS.cols || !M.C || M.C.length !== n * K) throw new Error(`field: a factor needs { C: n·K, n·K padded to 32 ≤ ${MOL_LIMITS.ao * MOL_LIMITS.cols} } at n = ${n}, K = ${K}`);
      const src = new Float32Array(n * Kp);                    // padded to the kernel's block of 32: the extra columns are zero
      for (let i = 0; i < n; i++) for (let k = 0; k < K; k++) src[i * Kp + k] = M.C[i * K + k];
      facReady(); device.queue.writeBuffer(molMatBuf, 0, src);
      molMat = src; molKind = 4; molK = Kp; molKindName = kind; molDirty = true;
      if (ref) molRefDirty = true;
      return { kind, nAO: n, length: n * K, K, complex: false, ref: !!ref };
    }
    const want = kind === 'orbital' ? n : n * n;
    if (want > n && molTier < 0) throw new Error(`field: a ${kind} at ${n} AOs needs a χ tile and the widest holds ${MAX_MOL_AO} — past it only an ORBITAL draws`);
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
      because Firefox resolves completion on a ~100 ms tick (its timestamps are real since 157).  NO queue.writeBuffer and no extra
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
    dispatchMol(pass, 0, n);
    pass.end();
    device.queue.submit([enc.finish()]);
    await device.queue.onSubmittedWorkDone();
    const ms = (performance.now() - t0) / n;
    return { msPerDispatch: +ms.toFixed(3), n, res, voxels: res ** 3, nAO: molPack.nAO, nShell: molPack.nShell, expsPerVoxel: molPack.nExp, ...molPath(), kind: molKindName };
  }
  /** which kernel the volume takes and its workgroup: { cap, wg, path: 'tile' | 'orbital' } — cap null on the orbital road */
  const molPath = () => { const r = molRoad(); return r >= ORB ? { cap: null, wg: 64, path: r === FAC ? 'factor' : 'orbital' } : { cap: MOL_CAPS[r], wg: molWg[r], path: 'tile' }; };
  /* live getters (Object.assign would have copied their values once — and did, until B10 caught it) */
  Object.defineProperties(out, {
    resolution: { get: () => res, enumerable: true }, half: { get: () => half, enumerable: true }, space: { get: () => space, enumerable: true },
    /* K2: the specialised present's ledger — compiled, compiling, failed for good, and whether an export pins the generic */
    renderPipelines: { get: () => { let ready = 0, pending = 0, failed = 0; for (const e of specCache.values()) { if (e.pipeline) ready++; else if (e.failed) failed++; else pending++; } return { ready, pending, failed, pinned: pinDepth > 0 }; }, enumerable: true },
    generation: { get: () => generation, enumerable: true }, refValid: { get: () => refValid, enumerable: true },
    dprCap: { get: () => dprCap, enumerable: true },      // LIVE getters: Object.assign below would freeze these at their boot values
    stepCap: { get: () => stepCap, enumerable: true },
    paced: { get: () => paced, enumerable: true }, inFlight: { get: () => inFlight, enumerable: true }, queueMs: { get: () => queueMs, enumerable: true },
    inFlightCap: { get: () => (paced ? 4 : queueMs > HEAVY_MS ? 2 : Infinity), enumerable: true },   // PACE (P1, P3): read-only
    /* …and so would it freeze THESE, which is exactly how `moleculeInfo` first came back null from a live molecule */
    molecular: { get: () => !!molSpec, enumerable: true }, equalizer: { get: () => eqTable, enumerable: true },   // 0.6.0 B2: the badge reads the live table
    /* a CHEAP, allocation-free read of "is the volume a complex orbital right now" — `moleculeInfo` builds an
       object, and the ORBITALS register asks this once a frame to notice when another card took the matrix back */
    moleculeComplex: { get: () => molKind === 2, enumerable: true },
    moleculeInfo: { get: () => (molSpec ? { nAO: molPack.nAO, nShell: molPack.nShell, nPrim: molPack.nPrim,
      nWeight: molPack.nWeight, expsPerVoxel: molPack.nExp, ...molPath(), kind: molKindName, complex: molKind === 2, dirty: molDirty, half, res } : null), enumerable: true },
    /* 0.4.0 S4c: the workgroup memory the device GRANTED and the lanes each tier was built with — the cap-128 tier's 64 or 32 */
    moleculeTiers: { get: () => ({ granted: device.limits.maxComputeWorkgroupStorageSize, caps: MOL_CAPS, wg: molWg, orbitalFrom: MOL_ORB_FROM }), enumerable: true } });
  Object.assign(out, {
    ok: !b.lost, device, adapter, format, stats,
    frame, throughput, readPixels, sampleVoxel, fieldDigest, readStats, readGrid, errorField, lineColors, linePixels,
    setResolution, setMolecule, setMoleculeMatrix, reconstructMolecule, moleculeThroughput,
    /** iteration 014 B: the atoms BALLS · STICKS · ESP draw ([{ Z, x, y, z }] in bohr, or null) and the molecule's charge; a volume's φ grid
     *  ({ n, half, data: Float32Array(n³) }, cell centres, x fastest — volumes-format.js espGrid) or null for the Poisson pass; φ's state */
    setAtoms, setEspGrid, espState() { return { src: phi.src, ok: phi.ok, M: phi.M, half: phi.half, runs: stats.espRuns, ms: stats.espMs, atoms: atomsN, bonds: bondsN, Ne: atomsNe }; },
    /** K2 · THE EXPORT PIN: pinRenderPipeline(true) … (false), nested by depth — while held every draw takes the generic
     *  pipeline, so a specialised compile that resolves mid-run can never change an export's pipeline.  Returns the depth. */
    pinRenderPipeline(on) { pinDepth = Math.max(0, pinDepth + (on ? 1 : -1)); return pinDepth; },
    /** K2 · compile (if needed) and await the specialised pipelines this material would use, on the canvas' format and on
     *  the readback's rgba8unorm; resolves true when both are ready, false when the material is outside the key or a
     *  compile failed.  For tools and gates that must measure what the screen draws (the DIGEST LOCK). */
    renderPipelineReady(mat) {
      const keys = [format, 'rgba8unorm'].map((f) => [f, specKey(f, mat)]);
      if (keys.some(([, k]) => !k)) return Promise.resolve(false);
      return Promise.all(keys.map(([f, k]) => specEntry(k, f, mat.view | 0, mat.style | 0).promise)).then((r) => r.every(Boolean));
    },
    setDomain(h) { if (h !== half) { half = h; molDirty = !!molSpec; cardDirty = !!card; } },
    /** 0.6.5 X2 · THE CARD ROAD: { N, half, data: Float32Array(N³) } (x fastest, cell centres over [−half, half]³) owns the volume, resampled
     *  once into psiTex as a signed field (the 'real' view); null hands it back to the molecular kernel.  A buffer write, never writeTexture. */
    setCard(c) {
      if (!c) { if (card) { card = null; molDirty = !!molSpec; } return null; }
      const bytes = c.N ** 3 * 4; if (!(c.N >= 2) || !(c.half > 0) || !c.data || c.data.length !== c.N ** 3) throw new Error('field: a card needs { N ≥ 2, half > 0, data: N³ }');
      if (!cardPipe) { const module = device.createShaderModule({ code: CARD_WGSL }); cardPipe = device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } }); cardParams = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }); }
      if (!cardBuf || cardBuf.size < bytes) { if (cardBuf) cardBuf.destroy(); cardBuf = device.createBuffer({ size: bytes, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); cardBind = null; }
      device.queue.writeBuffer(cardBuf, 0, c.data, 0, c.N ** 3); if (!card) espLand++; card = { N: c.N, half: c.half }; cardDirty = true; return card;
    },
    /** 0 = position space ψ(x), 1 = momentum space φ(p): the grid then holds the Fourier transform, exactly */
    setRadialTable(arr) { device.queue.writeBuffer(radialBuf, 0, arr instanceof Float32Array ? arr : new Float32Array(arr)); refValid = false; },
    /** K7 (opt-in): upload the axial gas's Hermite table (gas.js gasRadialTable: 256 rows × 256 × vec2) once, and bind it.
     *  Answers true when the field holds it — only then may gas records carry their rows. */
    setGasTable(arr) {
      if (!out.ok || !(arr instanceof Float32Array) || arr.length !== 256 * 256 * 2) return false;
      if (!gasTab) { gasTab = device.createBuffer({ size: arr.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }); device.queue.writeBuffer(gasTab, 0, arr); bindCompute(); }
      return true;
    },
    setSpace(s) { s = s | 0; if (s !== space) { space = s; refValid = false; } },
    /** 0.6.0 B1: the equalizer's table (lab/equalizer.js `table()`), or null: FLAT, the locked kernel.  Position hydrogen only;
     *  read on the next reconstruct, which the caller asks for. */
    setEqualizer(t) { eqTable = t && t.gamma ? t : null; },
    /** upload a 256×RGBA phase palette (Float32Array(1024), values 0..1) — an OBSERVER product: ψ is untouched */
    setPalette(lut, span) { lastLUT = lut instanceof Float32Array ? lut : new Float32Array(lut); if (span) palSpan = Math.round(span[0] * 256) * 512 + Math.min(255, Math.round(span[1] * 256)); uploadPalette(); },
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
      try { for (const b of paramsBuf) b.destroy(); statsBuf.destroy(); viewBuf.destroy(); cardBuf?.destroy(); palBuf.destroy(); } catch (_) {}
      try { for (const b of molParamsBuf) b.destroy(); molShellBuf.destroy(); molAlphaBuf.destroy(); molWBuf.destroy(); molMatBuf.destroy(); molCutBuf.destroy(); } catch (_) {}
      try { ctx.unconfigure(); } catch (_) {}
      try { device.destroy(); } catch (_) {}
    },
    /** the windows over the stage, as [x0, y0, x1, y1] in CSS pixels of the canvas box; at most 32. Returns
     *  true when the block changed (the caller presents). Lines are not drawn inside these rectangles. */
    setOcclusion(rects) {
      const n = Math.min(32, rects.length);
      let sig = String(n); for (let i = 0; i < n; i++) sig += '|' + rects[i].map((v) => Math.round(v)).join(',');
      if (sig === occSig) return false; occSig = sig;
      OCC_U[0] = n; for (let i = 0; i < n; i++) { const r = rects[i]; OCC_CSS[i * 4] = r[0]; OCC_CSS[i * 4 + 1] = r[1]; OCC_CSS[i * 4 + 2] = r[2]; OCC_CSS[i * 4 + 3] = r[3]; }
      writeOcc(); return true;
    },
    setDprCap(n) { dprCap = Math.max(0.5, Math.min(4, +n || 2)); return dprCap; },
    pinJitter(on) { if (!on) jitterPin = -1; else if (jitterPin < 0) jitterPin = stats.presents % 97; },   // 020 L1: rack.js, once a loop
    setStepCap(n) { stepCap = Number.isFinite(n) ? Math.max(16, Math.min(1024, +n)) : Infinity; return stepCap; },
    /* The CSS size is read from a ResizeObserver, not from clientWidth on every frame: the frame loop writes
       body attributes before it presents, so a per-frame clientWidth read forced a synchronous layout. */
    resize(scale) {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap) * (scale || 1);
      const w = Math.max(1, Math.round(cssW * dpr)), h = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; if (OCC_U[0]) writeOcc(); return true; }   // K12: the mask follows the new device-pixel size
      return false;
    }
  });
  /* PACE (P1) · THE CAPABILITY, measured at boot: an empty submission's completion wait, judged only on a DRAINED queue — no
     frame presented during this wait or the one before it (a boot frame's compile, or a backlog, is not an answer).  Each try is
     chained on the last one's completion (no timer), for at most 30 tries or 1.5 s.  PROMPT = ONE judged wait under 8 ms (wave
     127: a GPU busy at boot only delays that answer — the 8th iPad report's 57/20/45 ms then 0 ms, which the old two-fast /
     three-slow count could end on).  Firefox resolves on a ~100 ms poll (AUDIT-A FA5) and early only when a present lands in the
     wait — that try is not judged, so a judged try there starts on a tick and waits for the next one: never under 8 ms. */
  let paceTries = 0; const paceT0 = performance.now(); out.paceWaits = [];
  const probePace = (prev) => { const t = performance.now(), p = stats.presents; device.queue.submit([device.createCommandEncoder().finish()]);
    device.queue.onSubmittedWorkDone().then(() => { const w = performance.now() - t, d = stats.presents - p; out.paceWaits.push([+w.toFixed(2), d]);
      if (prev === 0 && d === 0 && w < 8) paced = true; else if (++paceTries < 30 && performance.now() - paceT0 < 1500) probePace(d); }, () => {}); };
  probePace(-1);
  return out;
}
