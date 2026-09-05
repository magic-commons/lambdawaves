/* dynamics.js — the LAGRANGIAN picture, the action–angle chart, the dipole, and the particle (Bohmian) velocity field.
 *
 * STATUS: EXACT ANALYTIC throughout, except the radial integrals (NUMERICAL: Gauss–Legendre on doubling panels for
 * hydrogen and the oscillator, exponentially convergent — 1e-14 against mpmath; Simpson in ln r for the atom's tabulated
 * shells; see radialRule below).
 *
 * THE LAGRANGIAN.  The Schrödinger field Lagrangian
 *     L[ψ] = ∫ ( (i/2)(ψ*ψ̇ − ψ̇*ψ) − ½|∇ψ|² − V|ψ|² ) d³r
 * restricted to the finite basis ψ = Σ c_a φ_a collapses EXACTLY to a Lagrangian in the mode coordinates, and in
 * the shadow's real coordinates q = √2 Re c, p = √2 Im c (shadow.js) it is the ordinary
 *     L = Σ_a p_a q̇_a − H_C,        H_C = ½ Σ_a E_a (q_a² + p_a²) = ⟨H⟩.
 * For the diagonal hydrogen H this is a set of uncoupled oscillators with q̇_a = E_a p_a, so
 *     L = ½ Σ_a ( q̇_a²/E_a − E_a q_a² ) = T − V,   T = ½ Σ E_a p_a²,  V = ½ Σ E_a q_a²,
 * a harmonic Lagrangian with mass 1/E_a and stiffness E_a — BOTH NEGATIVE for a bound state, whose ratio is the
 * physical ω² = E_a².  Euler–Lagrange gives q̈_a = −E_a² q_a, which is the Schrödinger equation and nothing else.
 * (The field form gives ½(pq̇ − qṗ) rather than pq̇; the two differ by the total derivative ½ d(pq)/dt and have the
 * same equations of motion.  We print the standard form.)
 *
 * Along the true motion θ_a(t) = arg c_a(0) − E_a t and everything is closed form:
 *     L(t) = −Σ_a E_a |c_a|² cos 2θ_a(t),     S(t) = ∫₀ᵗ L = ½ Σ_a |c_a|² [ sin 2θ_a(t) − sin 2θ_a(0) ],
 * so the action is BOUNDED and periodic — and ⟨L⟩ = 0 over any full period of every mode: the virial theorem
 * ⟨T⟩ = ⟨V⟩ = ½⟨H⟩ for the harmonic shadow.
 *
 * THE ACTION–ANGLE CHART.  Each mode's shadow orbit is the circle q² + p² = 2|c_a|², traversed at angular
 * velocity −E_a.  Its action variable is
 *     J_a = (1/2π) ∮ p dq = |c_a|²  — the POPULATION — with conjugate angle θ_a = arg c_a.
 * So the SPECTRUM rail (population and phase per lane) is exactly the action–angle chart of the SHADOW's phase
 * space, and the constancy of every population is Liouville's theorem for this system.
 *
 * THE PARTICLE VIEW.  The de Broglie–Bohm velocity field of the SAME ψ is
 *     v = j/ρ = Im(∇ψ/ψ)   (atomic units, m = 1),
 * an exact vector field wherever ψ ≠ 0.  ∇ψ is analytic here (the same polynomial tables the GPU evaluates,
 * differentiated), so particle trajectories are integrated from closed forms, not from the grid.  A trajectory can
 * never cross a nodal surface, and the vortex lines of VORTEX are exactly where v is singular.
 */
import { BASIS, stateOf, modeTable, radial, laguerre, factorial } from './hydrogen.js';

const PI = Math.PI, SQRT2 = Math.SQRT2;

/* ── the Lagrangian, along the true motion ────────────────────────────────── */
/** { T, V, L, H } from the coefficients at one instant: T = ½Σ E p², V = ½Σ E q², q = √2 Re c, p = √2 Im c */
export function lagrangian(re, im, ids) {
  let T = 0, V = 0;
  const list = ids || BASIS.map((s) => s.index);
  for (const a of list) {
    const E = BASIS[a].E, q = SQRT2 * re[a], p = SQRT2 * im[a];
    T += 0.5 * E * p * p; V += 0.5 * E * q * q;
  }
  return { T, V, L: T - V, H: T + V };
}
/**
 * The same, in the NORMAL MODES of whatever Hamiltonian is in force (Register.normalAmplitudes): with a static
 * field the shadow's oscillators are the Stark states, not the |nlm⟩, and T, V, L, S and the action–angle chart
 * are the same closed forms written in that basis.  With no field the two agree exactly.
 */
export function lagrangianNormal(na) {
  let T = 0, V = 0;
  for (let k = 0; k < na.E.length; k++) {
    const q = SQRT2 * na.re[k], p = SQRT2 * na.im[k];
    T += 0.5 * na.E[k] * p * p; V += 0.5 * na.E[k] * q * q;
  }
  return { T, V, L: T - V, H: T + V };
}
/** S(t) from the normal-mode amplitudes taken AT the anchor (t = 0) */
export function actionNormal(na0, t) {
  let S = 0;
  for (let k = 0; k < na0.E.length; k++) {
    const p0 = na0.re[k] * na0.re[k] + na0.im[k] * na0.im[k];
    if (p0 === 0) continue;
    const th0 = Math.atan2(na0.im[k], na0.re[k]), th = th0 - na0.E[k] * t;
    S += 0.5 * p0 * (Math.sin(2 * th) - Math.sin(2 * th0));
  }
  return S;
}
/** the action–angle chart of the normal modes: J = |a|², θ = arg a, ω = −E */
export function actionAngleNormal(na) {
  const out = [];
  for (let k = 0; k < na.E.length; k++) {
    const J = na.re[k] * na.re[k] + na.im[k] * na.im[k];
    if (J < 1e-14) continue;
    out.push({ label: na.label[k], J, theta: Math.atan2(na.im[k], na.re[k]), omega: -na.E[k] });
  }
  return out;
}
/**
 * The action S(t) = ∫₀ᵗ L dt′ in closed form: ½ Σ |c_a|² [sin 2θ_a(t) − sin 2θ_a(0)], θ_a(t) = arg c_a(0) − E_a t.
 * Takes the ANCHOR coefficients (c(0)) so the integral is exact from the anchor, whatever the current time.
 */
export function action(re0, im0, t, ids) {
  let S = 0;
  const list = ids || BASIS.map((s) => s.index);
  for (const a of list) {
    const p0 = re0[a] * re0[a] + im0[a] * im0[a];
    if (p0 === 0) continue;
    const th0 = Math.atan2(im0[a], re0[a]), th = th0 - BASIS[a].E * t;
    S += 0.5 * p0 * (Math.sin(2 * th) - Math.sin(2 * th0));
  }
  return S;
}
/** the action–angle chart: J_a = |c_a|² (the population) and θ_a = arg c_a, per populated mode */
export function actionAngle(re, im, ids) {
  const list = ids || BASIS.map((s) => s.index), out = [];
  for (const a of list) {
    const J = re[a] * re[a] + im[a] * im[a];
    if (J === 0) continue;
    out.push({ a, label: BASIS[a].label, J, theta: Math.atan2(im[a], re[a]), omega: -BASIS[a].E });
  }
  return out;
}

/* ── exact angular moments (L_z and L² are diagonal in this basis: no cross terms) ────────────────────────── */
export function angularMoments(re, im) {
  let lz = 0, l2 = 0, n2 = 0;
  for (const s of BASIS) {
    const p = re[s.index] * re[s.index] + im[s.index] * im[s.index];
    if (p === 0) continue;
    n2 += p; lz += p * s.m; l2 += p * s.l * (s.l + 1);
  }
  return n2 > 0 ? { Lz: lz / n2, L2: l2 / n2, norm2: n2 } : { Lz: 0, L2: 0, norm2: 0 };
}
/** the entanglement entropy of the two SO(4) rotors of one shell, from its Schmidt spectrum: −Σ λ² ln λ² */
export function rotorEntropy(spectrum) {
  let S = 0;
  for (const l of spectrum) { const p = l * l; if (p > 1e-15) S -= p * Math.log(p); }
  return Math.max(0, S);
}

/* ── the dipole ⟨z⟩ ───────────────────────────────────────────────────────── */
/** ⟨Y_{l′m}|cos θ|Y_{lm}⟩ — non-zero only for l′ = l ± 1 and equal m (the selection rule) */
export function angularDipoleZ(lp, mp_, l, m) {
  if (mp_ !== m) return 0;
  if (lp === l + 1) return Math.sqrt(((l + 1) * (l + 1) - m * m) / ((2 * l + 1) * (2 * l + 3)));
  if (lp === l - 1) return Math.sqrt((l * l - m * m) / ((2 * l - 1) * (2 * l + 1)));
  return 0;
}
import { getHamiltonian } from './hamiltonian.js';
import { gaussLegendre } from './wigner.js';
/* ── the radial quadrature: ONE rule per Hamiltonian, shaped to its radial functions (wave 42) ──────────────────────
 * hydrogen (any Z): R_nl is a polynomial × e^{−Zr/n}, so Gauss–Legendre converges exponentially — 24 points on panels
 *   DOUBLING from r₁ = n_min/(4Z) out to 40 n_max²/Z (14 panels for 1s–6p, 336 evaluations) put every pair on mpmath to
 *   ~1e-14.  The uniform Simpson it replaces needed 12000·⌈n_max²/n_min²⌉ panels for the smaller shell's cusp — 432 000
 *   for 1s–6p — and a 16-label state's first frame cost 1.4 s (dipoleZ 418 ms + radialObservables 1009 ms): the reviewer's
 *   finding.  qho: Gaussian × polynomial, the same rule on [0, 14].  well: 8 panels on [0, a] — the wall is a panel edge
 *   and the radial is zero beyond it.  atom: the shells are linear interpolants in ln r on a 10⁻⁶/Z … 60 mesh, so the
 *   rule is Simpson in ln r on 6000 points (three per mesh step).  Otherwise (quarkonium's uniform table): Simpson on
 *   [0, 14], 12000 panels, the rule this file always had.  Every rule is built once and cached. */
const RULE_CACHE = new Map();
function radialRule(H, nlo, nhi) {
  const Z = H.Z || 1, key = `${H.id}:${Z}:${H.radius || 0}:${nlo}:${nhi}`;
  const hit = RULE_CACHE.get(key); if (hit) return hit;
  const r = [], w = [];
  const panels = (edges, q) => { const G = gaussLegendre(q); for (let p = 0; p + 1 < edges.length; p++) { const h = (edges[p + 1] - edges[p]) / 2, c = (edges[p] + edges[p + 1]) / 2; for (let i = 0; i < q; i++) { r.push(c + h * G.x[i]); w.push(h * G.w[i]); } } };
  const doubling = (r1, top) => { const e = [0]; for (let x = r1; ; x *= 2) { e.push(Math.min(x, top)); if (x >= top) break; } return e; };
  const simpson = (nodes, jac) => { const N = nodes.length - 1; for (let i = 0; i <= N; i++) { r.push(nodes[i]); w.push(((i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2)) / 3 * jac(i)); } };
  if (H.id === 'hydrogen') panels(doubling(0.25 * nlo / Z, 40 * nhi * nhi / Z), 24);
  else if (H.id === 'qho') panels([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 14], 24);
  else if (H.id === 'well' && H.radius > 0) panels(Array.from({ length: 9 }, (_, i) => H.radius * i / 8), 24);
  else if (H.id === 'atom') { const N = 6000, r0 = 1e-6 / Z, du = Math.log(60 / r0) / N; simpson(Array.from({ length: N + 1 }, (_, i) => r0 * Math.exp(i * du)), (i) => du * r0 * Math.exp(i * du)); }
  else { const N = 12000, h = 14 / N; simpson(Array.from({ length: N + 1 }, (_, i) => i * h), () => h); }
  const rule = { r: Float64Array.from(r), w: Float64Array.from(w) };
  RULE_CACHE.set(key, rule); return rule;
}
const RAD_CACHE = new Map();
/** ∫₀^∞ R_{n′l′}(r) r R_{nl}(r) r² dr — NUMERICAL on the Hamiltonian's own rule above (exponentially convergent for
 *  hydrogen: 1s–4p and 1s–6p to 1e-14 against mpmath), cached per Hamiltonian, Z (and the well's radius) and pair */
export function radialDipole(np_, lp, n, l) {
  const H = getHamiltonian(), swap = np_ > n || (np_ === n && lp > l);                 // the integrand is symmetric: ONE key per pair
  const key = swap ? `${H.id}:${H.Z || 1}:${H.radius || 0}:${n}:${l}:${np_}:${lp}` : `${H.id}:${H.Z || 1}:${H.radius || 0}:${np_}:${lp}:${n}:${l}`;   // Z in the key (Round 11 A2)
  if (RAD_CACHE.has(key)) return RAD_CACHE.get(key);
  const { r, w } = radialRule(H, Math.min(np_, n), Math.max(np_, n));
  let s = 0;
  for (let i = 0; i < r.length; i++) { const x = r[i]; s += (H.radial(np_, lp, x) * H.radial(n, l, x)) * (w[i] * x * x * x); }   // the radials multiplied FIRST: bit-symmetric in (a, b)
  RAD_CACHE.set(key, s);
  return s;
}
/**
 * ⟨z⟩ = Σ_{ab} c_a* c_b ⟨a|z|b⟩ over the populated set, per unit norm.  z couples l → l ± 1 at fixed m, so a
 * superposition of ONE l has no dipole however it is prepared — the oscillating dipole of the 1s+2p_z preset is
 * the only thing in this instrument that would radiate.
 */
export function dipoleZ(re, im, ids) {
  const list = ids || BASIS.map((s) => s.index);
  let dr = 0, di = 0, n2 = 0;
  for (const a of list) n2 += re[a] * re[a] + im[a] * im[a];
  for (const a of list) for (const b of list) {
    const A = BASIS[a], B = BASIS[b];
    const ang = angularDipoleZ(A.l, A.m, B.l, B.m);
    if (ang === 0) continue;
    const z = ang * radialDipole(A.n, A.l, B.n, B.l);
    // ⟨z⟩ contribution c_a* c_b z_ab
    dr += (re[a] * re[b] + im[a] * im[b]) * z;
    di += (re[a] * im[b] - im[a] * re[b]) * z;
  }
  return n2 > 0 ? { re: dr / n2, im: di / n2, value: dr / n2 } : { re: 0, im: 0, value: 0 };
}
/**
 * The dipole's spectral lines: the pairs (a, b) with a non-zero z-matrix element, their Bohr frequency
 * ω = E_a − E_b and their strength 2|c_a||c_b||z_ab| — the emission spectrum of the prepared state.
 * A classical dipole of amplitude d radiating at ω loses (2/3)ω⁴d²·½ in atomic units (Larmor); the instrument
 * does NOT include radiation reaction, so this is what such a dipole WOULD radiate, not what this state does.
 */
export function dipoleLines(re, im, ids) {
  const list = ids || BASIS.map((s) => s.index), out = [];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j], A = BASIS[a], B = BASIS[b];
    const ang = angularDipoleZ(A.l, A.m, B.l, B.m);
    if (ang === 0) continue;
    const z = Math.abs(ang * radialDipole(A.n, A.l, B.n, B.l));
    const amp = 2 * Math.hypot(re[a], im[a]) * Math.hypot(re[b], im[b]) * z;
    const om = Math.abs(getHamiltonian().energy(a) - getHamiltonian().energy(b));   // the operator in force, not the static hydrogen energies
    if (amp > 1e-12 && om > 1e-12) out.push({ a, b, label: `${A.label}↔${B.label}`, omega: om, period: om > 0 ? 2 * PI / om : Infinity, amplitude: amp, power: (2 / 3) * Math.pow(om, 4) * amp * amp / 2 });
  }
  out.sort((x, y) => y.amplitude - x.amplitude);
  return out;
}

/* ── radial moments, and the atom's OWN virial theorem ───────────────────── */
const MOM_CACHE = new Map();
/** ∫₀^∞ R_{n′l}(r) r^k R_{nl}(r) r² dr — NUMERICAL on the same rule as radialDipole (cached); k = 1 gives ⟨r⟩, k = −1 gives ⟨1/r⟩ */
export function radialMoment(k, np_, lp, n, l) {
  const H = getHamiltonian(), swap = np_ > n || (np_ === n && lp > l);
  const key = swap ? `${H.id}:${H.Z || 1}:${H.radius || 0}:${k}:${n}:${l}:${np_}:${lp}` : `${H.id}:${H.Z || 1}:${H.radius || 0}:${k}:${np_}:${lp}:${n}:${l}`;   // the Hamiltonian in force, and Z (Round 11 A1)
  if (MOM_CACHE.has(key)) return MOM_CACHE.get(key);
  const { r, w } = radialRule(H, Math.min(np_, n), Math.max(np_, n));
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const x = r[i]; if (x === 0 && k + 2 <= 0) continue;   // r^{k+2} is integrable at 0 for k ≥ −1; a Simpson rule's r = 0 node is skipped below that
    s += (H.radial(np_, lp, x) * H.radial(n, l, x)) * (w[i] * Math.pow(x, k + 2));
  }
  MOM_CACHE.set(key, s);
  return s;
}
/**
 * ⟨r⟩, ⟨1/r⟩ and hence the Coulomb split ⟨V⟩ = −⟨1/r⟩, ⟨T⟩ = ⟨H⟩ + ⟨1/r⟩ — per unit norm.  r is a scalar, so it
 * couples only l = l′, m = m′ (no angular factor).  For an eigenstate the closed forms are ⟨r⟩ = (3n² − l(l+1))/2
 * and ⟨1/r⟩ = 1/n², and the QUANTUM virial theorem reads ⟨T⟩ = −⟨H⟩ = −E — a different statement from the
 * shadow's harmonic ⟨T⟩ = ⟨V⟩ = ½⟨H⟩, and both hold at once in this instrument.
 */
export function radialObservables(re, im, ids, energy) {
  const list = ids || BASIS.map((s) => s.index);
  let r1 = 0, rinv = 0, n2 = 0;
  for (const a of list) n2 += re[a] * re[a] + im[a] * im[a];
  for (const a of list) for (const b of list) {
    const A = BASIS[a], B = BASIS[b];
    if (A.l !== B.l || A.m !== B.m) continue;
    const w = re[a] * re[b] + im[a] * im[b];           // the imaginary parts cancel: r is Hermitian and real here
    r1 += w * radialMoment(1, A.n, A.l, B.n, B.l);
    rinv += w * radialMoment(-1, A.n, A.l, B.n, B.l);
  }
  if (n2 <= 0) return { r: 0, rinv: 0, V: 0, T: 0, virial: 0 };
  r1 /= n2; rinv /= n2;
  const Z = getHamiltonian().Z || 1, V = -Z * rinv, T = energy - V;              // V = −Z⟨1/r⟩ (Round 11 A1)
  return { r: r1, rinv, V, T, virial: V !== 0 ? -T / V * 2 : 0 };   // 2T/(−V) = 1 exactly for a stationary state
}

/* ── the particle (Bohmian) velocity field: ∇ψ analytically ──────────────── */
const TBL = new Map();
function tableOf(a) { if (!TBL.has(a)) { const s = BASIS[a]; TBL.set(a, modeTable(s.n, s.l, s.m)); } return TBL.get(a); }
/**
 * ψ and ∇ψ at a Cartesian point, EXACT: the same polynomial tables the GPU evaluates, differentiated.
 *   ψ = norm · e^{−ρ/2} ρ^l L(ρ) · sin^{|m|}θ · D(cos θ) · e^{imφ},   ρ = 2r/n
 * Returns { re, im, gx, gy, gz } with g the complex gradient packed as {re, im} per component.
 */
export function psiAndGrad(re, im, ids, x, y, z) {
  const r = Math.hypot(x, y, z);
  if (r < 1e-12) return null;
  const ct = z / r, st = Math.sqrt(Math.max(0, 1 - ct * ct)), phi = Math.atan2(y, x);
  let pr = 0, pi = 0, drR = 0, drI = 0, dtR = 0, dtI = 0, dpR = 0, dpI = 0;   // ψ and ∂_r, ∂_θ, ∂_φ
  const list = ids || BASIS.map((s) => s.index);
  for (const a of list) {
    const cr = re[a], ci = im[a];
    if (cr === 0 && ci === 0) continue;
    const T = tableOf(a), n = T.n, l = T.l, m = T.m, am = T.am;
    const rho = 2 * r / n;
    let L = 0, Lp = 0, rp = 1, rpm = 0;                    // rp = ρ^j, rpm = ρ^{j−1} (no division anywhere)
    for (let j = 0; j < 6; j++) { L += T.lag[j] * rp; if (j > 0) Lp += j * T.lag[j] * rpm; rpm = rp; rp *= rho; }
    let D = 0, Dp = 0, xp = 1, xpm = 0;                    // xp = cosθ^j, xpm = cosθ^{j−1}
    for (let j = 0; j < 6; j++) { D += T.leg[j] * xp; if (j > 0) Dp += j * T.leg[j] * xpm; xpm = xp; xp *= ct; }
    const e = Math.exp(-rho / 2), rl = Math.pow(rho, l), rl1 = l > 0 ? Math.pow(rho, l - 1) : 0;
    const stm = Math.pow(st, am), stm1 = am > 0 ? Math.pow(st, am - 1) : 0;
    const f = T.norm * e * rl * L * stm * D;                                   // the real radial×angular factor
    const dfdr = T.norm * (2 / n) * e * (-0.5 * rl * L + l * rl1 * L + rl * Lp) * stm * D;
    const dfdt = T.norm * e * rl * L * (am * stm1 * ct * D - stm * st * Dp);
    const cph = Math.cos(m * phi), sph = Math.sin(m * phi);
    // ψ_a = (cr + i ci)(f)(cos + i sin)
    const wr = f * cph, wi = f * sph;
    pr += cr * wr - ci * wi; pi += cr * wi + ci * wr;
    const rr = dfdr * cph, ri = dfdr * sph;
    drR += cr * rr - ci * ri; drI += cr * ri + ci * rr;
    const tr = dfdt * cph, ti = dfdt * sph;
    dtR += cr * tr - ci * ti; dtI += cr * ti + ci * tr;
    // ∂_φ ψ_a / sin θ = i m · (f / sin θ), with sin^{|m|−1}θ carried explicitly (electrostatics.js's thetaFuncs): finite ON the
    // axis, where (∂_φψ)/(r sin θ) was dropped as 0/0 before — 2p₊1 at (0, 0, 1) read g_y = 0 for a true −0.04277i (wave 42)
    const fs = am ? T.norm * e * rl * L * stm1 * D : 0, ur = fs * cph, ui = fs * sph;
    const br = cr * ur - ci * ui, bi = cr * ui + ci * ur;
    dpR += -m * bi; dpI += m * br;
  }
  // spherical → Cartesian: ∇ψ = r̂ ∂_r + θ̂ (1/r)∂_θ + φ̂ (1/r)(∂_φ/sin θ)
  const cp = Math.cos(phi), sp = Math.sin(phi);
  const rh = [st * cp, st * sp, ct], th = [ct * cp, ct * sp, -st], ph = [-sp, cp, 0];
  const invR = 1 / r;
  const g = [];
  for (let k = 0; k < 3; k++) {
    g.push({ re: drR * rh[k] + invR * dtR * th[k] + invR * dpR * ph[k],
             im: drI * rh[k] + invR * dtI * th[k] + invR * dpI * ph[k] });
  }
  return { re: pr, im: pi, gx: g[0], gy: g[1], gz: g[2] };
}
/** the de Broglie–Bohm velocity v = Im(∇ψ/ψ) at a point (null where |ψ|² is below `floor`) */
export function bohmVelocity(re, im, ids, x, y, z, floor = 1e-18) {
  const s = psiAndGrad(re, im, ids, x, y, z);
  if (!s) return null;
  const d = s.re * s.re + s.im * s.im;
  if (d < floor) return null;
  const v = [];
  for (const g of [s.gx, s.gy, s.gz]) v.push((g.im * s.re - g.re * s.im) / d);
  return { v, rho: d };
}
/** one RK4 step of ẋ = v(x) (the velocity field is time-dependent through c(t): pass the coefficients per stage) */
export function bohmStep(coeffsAt, ids, p, t, dt, cap = 4) {
  const k = [];
  const at = (s, u) => {
    const c = coeffsAt(u);
    const r = bohmVelocity(c.re, c.im, ids, s[0], s[1], s[2]);
    if (!r) return null;
    let v = r.v; const sp = Math.hypot(v[0], v[1], v[2]);
    if (sp > cap) v = v.map((q) => q * cap / sp);        // a Bohmian speed diverges at a node: clamp for drawing
    return v;
  };
  const a = at(p, t); if (!a) return null;
  const p1 = [p[0] + dt / 2 * a[0], p[1] + dt / 2 * a[1], p[2] + dt / 2 * a[2]];
  const b = at(p1, t + dt / 2); if (!b) return null;
  const p2 = [p[0] + dt / 2 * b[0], p[1] + dt / 2 * b[1], p[2] + dt / 2 * b[2]];
  const c = at(p2, t + dt / 2); if (!c) return null;
  const p3 = [p[0] + dt * c[0], p[1] + dt * c[1], p[2] + dt * c[2]];
  const d = at(p3, t + dt); if (!d) return null;
  return [0, 1, 2].map((i) => p[i] + dt / 6 * (a[i] + 2 * b[i] + 2 * c[i] + d[i]));
}
