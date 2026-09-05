/* calculus.js — the CALCULUS ENGINE: the instrument's statistics, derived live, each with its theorem and residual.
 *
 * STATUS: EXACT within the register (every expectation is a finite bilinear form in the coefficients with exact
 * matrix elements), NUMERICAL only in the one-dimensional radial quadratures and in the time derivative, which is
 * a centred difference of the EXACT evolution (c(t ± h) = e^{∓iEh}c(t)), so its error is O(h²) with h = 1e-3.
 *
 * The laws it checks:
 *   conservation     d⟨ψ|ψ⟩/dt = 0,  d⟨H⟩/dt = 0                       (0 unless the DRAG toy is on)
 *   Ehrenfest I      d⟨z⟩/dt = ⟨p_z⟩                                    with ⟨a|p_z|b⟩ = i(E_a − E_b)⟨a|z|b⟩
 *   Ehrenfest II     d⟨p_z⟩/dt = ⟨−∂V/∂z⟩                               hydrogen: −Z⟨z/r³⟩ ; oscillator: −⟨z⟩ ; box: 0 inside (the wall is not an operator of the register — the residual IS the wall)
 *   the dipole-acceleration identity  (E_a − E_b)²⟨a|z|b⟩ = ⟨a|∂V/∂z|b⟩ for eigenstates — which is what makes II exact here
 *   virial            2⟨T⟩ + ⟨r·∇V⟩ = 0 on time average  (hydrogen: 2⟨T⟩ = −⟨V⟩; oscillator: ⟨T⟩ = ⟨V⟩)
 */
import { BASIS } from './hydrogen.js';
import { angularDipoleZ, radialDipole, dipoleZ, radialObservables } from './dynamics.js';
import { momentumZ } from './kick.js';
import { getHamiltonian } from './hamiltonian.js';
import { wellNorm, wellK, wellZ, wellRadius } from './well.js';
import { sphericalBessel } from './bessel.js';

const FCACHE = new Map();
/** ∫₀^∞ R_{n′l′} R_{nl} dr — the radial part of ⟨z/r³⟩ (z/r³ = cos θ / r²): NUMERICAL, cached per Hamiltonian */
export function radialForce(np_, lp, n, l) {
  const H = getHamiltonian(), key = `${H.id}:${H.Z || 1}:${np_}:${lp}:${n}:${l}`;
  if (FCACHE.has(key)) return FCACHE.get(key);
  const R = H.id === 'hydrogen' ? 40 * Math.max(np_ * np_, n * n) / (H.Z || 1) : 14, N = 12000, h = R / N;
  let s = 0;
  for (let i = 0; i <= N; i++) { const r = i * h, w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2); s += w * H.radial(np_, lp, r) * H.radial(n, l, r); }
  const v = s * h / 3; FCACHE.set(key, v); return v;
}
/**
 * THE HARD WALL'S FORCE (Round 11 §7.2 — DERIVED there, MEASURED to 4e-16): for a state in the register's span,
 * d⟨p_z⟩/dt = −½ a² ∮ |∂_rψ(a, Ω)|² cos θ dΩ, the surface pressure, with R′_{nl}(a) = −N k j_{l+1}(z) at the wall
 * (so R′(a)² = 2k²/a³).  The angular factor is the dipole's.  Exact — not "the residual", the prediction.
 */
export function wallForceZ(re, im, ids) {
  const list = ids || BASIS.map((s) => s.index), a = wellRadius();
  const Rp = new Map();
  const rp = (s) => { let v = Rp.get(s.id); if (v === undefined) { const z = wellZ(s.n, s.l), k = wellK(s.n, s.l, a); v = -wellNorm(s.n, s.l, a) * k * sphericalBessel(s.l + 1, z); Rp.set(s.id, v); } return v; };
  let sum = 0, n2 = 0;
  for (const i of list) n2 += re[i] * re[i] + im[i] * im[i];
  for (const i of list) for (const j of list) {
    const A = BASIS[i], B = BASIS[j], ang = angularDipoleZ(A.l, A.m, B.l, B.m); if (ang === 0) continue;
    sum += (re[i] * re[j] + im[i] * im[j]) * rp(A) * rp(B) * ang;
  }
  return n2 > 0 ? -0.5 * a * a * sum / n2 : 0;
}
/** ⟨−∂V/∂z⟩ per unit norm for the Hamiltonian in force (Fz: a static electric field adds −F, Round 11 A6) */
export function forceZ(re, im, ids, Fz = 0) {
  const H = getHamiltonian(), list = ids || BASIS.map((s) => s.index);
  if (H.id === 'well') return { value: wallForceZ(re, im, list), label: 'the hard-wall pressure −½a²∮|∂_rψ|²cosθ dΩ  (EXACT within the register)' };
  if (H.id === 'qho') return { value: -dipoleZ(re, im, list).value - Fz, label: '−⟨z⟩  (V = ½r²)' + (Fz ? ' − F' : '') };
  const Z = H.Z || 1;
  let s = 0, n2 = 0;
  for (const a of list) n2 += re[a] * re[a] + im[a] * im[a];
  for (const a of list) for (const b of list) {
    const A = BASIS[a], B = BASIS[b], ang = angularDipoleZ(A.l, A.m, B.l, B.m); if (ang === 0) continue;
    const F = ang * radialForce(A.n, A.l, B.n, B.l);
    s += F * (re[a] * re[b] + im[a] * im[b]);                       // Re(c_a* c_b) F_ab, F real symmetric
  }
  return { value: (n2 > 0 ? -Z * s / n2 : 0) - Fz, label: `−Z⟨z/r³⟩  (V = −Z/r, Z = ${Z})` + (Fz ? ' − F  (Stark)' : '') };
}
/** the live table: every row is { name, formula, value, law, predicted, residual } */
export function stats(reg, t, h = 1e-3) {
  const H = getHamiltonian();
  const c = reg.at(t), cp = reg.at(t + h), cm = reg.at(t - h), ids = reg.populated();
  const norm2 = (x) => { let s = 0; for (const a of ids) s += x.re[a] * x.re[a] + x.im[a] * x.im[a]; return s; };
  const N0 = norm2(c), dN = (norm2(cp) - norm2(cm)) / (2 * h);
  const E0 = reg.energy();
  const z0 = dipoleZ(c.re, c.im, ids).value, zp = dipoleZ(cp.re, cp.im, ids).value, zm = dipoleZ(cm.re, cm.im, ids).value, dz = (zp - zm) / (2 * h);
  const p0 = momentumZ(c.re, c.im, ids), pp = momentumZ(cp.re, cp.im, ids), pm = momentumZ(cm.re, cm.im, ids), dp = (pp - pm) / (2 * h);
  const F = forceZ(c.re, c.im, ids, reg.field ? reg.field.Fz : 0);
  const rows = [
    { name: '⟨ψ|ψ⟩', formula: 'Σ|c_a|²', value: N0, law: 'd/dt = 0', predicted: 0, residual: dN, unit: '' },
    { name: '⟨H⟩', formula: 'Σ|c_a|²E_a / Σ|c_a|²', value: E0, law: 'd/dt = 0', predicted: 0, residual: reg.damping > 0 ? NaN : 0, unit: H.unit },
    { name: '⟨z⟩', formula: 'Σ c_a*c_b ⟨a|z|b⟩', value: z0, law: 'Ehrenfest I:  d⟨z⟩/dt = ⟨p_z⟩', predicted: p0, residual: dz - p0, unit: H.lengthUnit, derivative: dz },
    { name: '⟨p_z⟩', formula: 'Σ c_a*c_b · i(E_a−E_b)⟨a|z|b⟩', value: p0, law: 'Ehrenfest II:  d⟨p_z⟩/dt = ⟨−∂V/∂z⟩ = ' + F.label, predicted: F.value, residual: dp - F.value, unit: '', derivative: dp },
  ];
  if (H.id === 'hydrogen') {
    const ro = radialObservables(c.re, c.im, ids, E0);
    rows.push({ name: '2⟨T⟩ + ⟨V⟩', formula: 'virial (hydrogen: 2⟨T⟩ = −⟨V⟩ on time average)', value: 2 * ro.T + ro.V, law: '= 0 on time average', predicted: 0, residual: 2 * ro.T + ro.V, unit: H.unit });
  }
  return { t, h, rows, ids: ids.length };
}
