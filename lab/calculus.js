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
 *   the moments       d⟨L_z⟩/dt = 0, d⟨L²⟩/dt = 0 (a central H; the Stark field mixes l), and ⟨r⟩ (0.4.0 S3, from DYNAMICS)
 */
import { BASIS } from './hydrogen.js';
import { angularDipoleZ, radialDipole, dipoleZ, radialObservables, angularMoments } from './dynamics.js';
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
  if (H.id === 'well') return { value: wallForceZ(re, im, list), label: 'the hard-wall pressure −½a²∮|∂_rψ|²cosθ dΩ  (EXACT within the register)', tex: '-\\tfrac{1}{2}a^{2}\\oint|\\partial_r\\psi|^{2}\\cos\\theta\\,d\\Omega' };
  if (H.id === 'qho') return { value: -dipoleZ(re, im, list).value - Fz, label: '−⟨z⟩  (V = ½r²)' + (Fz ? ' − F' : ''), tex: '-\\langle z\\rangle' + (Fz ? ' - F' : '') };
  const Z = H.Z || 1;
  let s = 0, n2 = 0;
  for (const a of list) n2 += re[a] * re[a] + im[a] * im[a];
  for (const a of list) for (const b of list) {
    const A = BASIS[a], B = BASIS[b], ang = angularDipoleZ(A.l, A.m, B.l, B.m); if (ang === 0) continue;
    const F = ang * radialForce(A.n, A.l, B.n, B.l);
    s += F * (re[a] * re[b] + im[a] * im[b]);                       // Re(c_a* c_b) F_ab, F real symmetric
  }
  return { value: (n2 > 0 ? -Z * s / n2 : 0) - Fz, label: `−Z⟨z/r³⟩  (V = −Z/r, Z = ${Z})` + (Fz ? ' − F  (Stark)' : ''), tex: `-${Z === 1 ? '' : Z}\\left\\langle \\frac{z}{r^{3}}\\right\\rangle` + (Fz ? ' - F' : '') };
}
/** the live table: every row is { name, formula, value, law, predicted, residual, unit, group, tex: { name, law } } — `tex` is the
 *  same row in the notebook's LaTeX, for the prose figure; `group` says which rows one sentence reads together */
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
    { name: '⟨ψ|ψ⟩', formula: 'Σ|c_a|²', value: N0, law: 'd/dt = 0', predicted: 0, residual: dN, unit: '', group: 'conservation', tex: { name: '\\langle\\psi|\\psi\\rangle', law: '\\frac{d}{dt}\\langle\\psi|\\psi\\rangle = 0' } },
    { name: '⟨H⟩', formula: 'Σ|c_a|²E_a / Σ|c_a|²', value: E0, law: 'd/dt = 0', predicted: 0, residual: reg.damping > 0 ? NaN : 0, unit: H.unit, group: 'conservation', tex: { name: '\\langle H\\rangle', law: '\\frac{d}{dt}\\langle H\\rangle = 0' } },
    { name: '⟨z⟩', formula: 'Σ c_a*c_b ⟨a|z|b⟩', value: z0, law: 'Ehrenfest I:  d⟨z⟩/dt = ⟨p_z⟩', predicted: p0, residual: dz - p0, unit: H.lengthUnit, derivative: dz, group: 'ehrenfest', tex: { name: '\\langle z\\rangle', law: '\\frac{d}{dt}\\langle z\\rangle = \\langle p_z\\rangle' } },
    { name: '⟨p_z⟩', formula: 'Σ c_a*c_b · i(E_a−E_b)⟨a|z|b⟩', value: p0, law: 'Ehrenfest II:  d⟨p_z⟩/dt = ⟨−∂V/∂z⟩ = ' + F.label, predicted: F.value, residual: dp - F.value, unit: '', derivative: dp, group: 'ehrenfest',
      tex: { name: '\\langle p_z\\rangle', law: '\\frac{d}{dt}\\langle p_z\\rangle = \\left\\langle -\\frac{\\partial V}{\\partial z}\\right\\rangle = ' + F.tex } },
  ];
  const ro = radialObservables(c.re, c.im, ids, E0);
  if (H.id === 'hydrogen') rows.push({ name: '2⟨T⟩ + ⟨V⟩', formula: 'virial (hydrogen: 2⟨T⟩ = −⟨V⟩ on time average)', value: 2 * ro.T + ro.V, law: '= 0 on time average', predicted: 0, residual: 2 * ro.T + ro.V, unit: H.unit, group: 'virial',
    tex: { name: '2\\langle T\\rangle + \\langle V\\rangle', law: '2\\langle T\\rangle + \\langle V\\rangle = 0 \\quad\\text{(time average)}' } });
  /* THE MOMENTS (0.4.0 S3 · R-W1, out of the retired DYNAMICS).  L_z and L² are diagonal in |nlm⟩, so they are population
     sums and exact; L_z commutes with every H here (central, with B and F along z), L² with every one but the Stark field,
     which mixes l.  ⟨r⟩ is a moment and states no law: its residual is null (the tile prints its ⟨1/r⟩ instead). */
  const am = angularMoments(c.re, c.im), ap = angularMoments(cp.re, cp.im), an = angularMoments(cm.re, cm.im), Fz = reg.field ? reg.field.Fz : 0;
  rows.push({ name: '⟨L_z⟩', formula: 'Σ|c_a|² m_a', value: am.Lz, law: 'd/dt = 0: L_z commutes with H', predicted: 0, residual: (ap.Lz - an.Lz) / (2 * h), unit: 'ħ', group: 'moments', tex: { name: '\\langle L_z\\rangle', law: '\\frac{d}{dt}\\langle L_z\\rangle = 0' } });
  rows.push({ name: '⟨L²⟩', formula: 'Σ|c_a|² l_a(l_a + 1)', value: am.L2, law: Fz ? 'no law here: the Stark field mixes l' : 'd/dt = 0: L² commutes with a central H', predicted: Fz ? NaN : 0, residual: Fz ? null : (ap.L2 - an.L2) / (2 * h), unit: 'ħ²', group: 'moments',
    tex: { name: '\\langle L^{2}\\rangle', law: Fz ? null : '\\frac{d}{dt}\\langle L^{2}\\rangle = 0', why: 'the Stark field mixes $l$' } });
  rows.push({ name: '⟨r⟩', formula: 'Σ c_a*c_b ⟨a|r|b⟩ (l = l′, m = m′)', value: ro.r, law: `⟨1/r⟩ = ${ro.rinv.toFixed(5)}`, predicted: NaN, residual: null, unit: H.lengthUnit, group: 'moment',
    tex: { name: '\\langle r\\rangle', note: `$\\langle 1/r\\rangle = ${texNum(ro.rinv)}$` } });
  return { t, h, rows, ids: ids.length };
}

/* ── THE PROSE FIGURE (0.4.0 S3 · F3): what CALCULUS's ⧉ copies — a heading, then one paragraph that reads the tiles as
 * sentences (related rows combined: the conservation pair, the Ehrenfest pair as one, the moments), inline $…$, and the
 * laws in display $$…$$.  It pastes into the notebook and renders there (marked + KaTeX); tests/calculus.test.mjs parses
 * every $…$ under KaTeX's throwOnError.  Pure: the stats() record in, markdown out. */
const UNIT_TEX = { hartree: 'E_h', 'ħω': '\\hbar\\omega', 'a₀': 'a_0', '√(ħ/mω)': '\\sqrt{\\hbar/m\\omega}', GeV: '\\mathrm{GeV}', 'GeV⁻¹': '\\mathrm{GeV}^{-1}', 'ħ': '\\hbar', 'ħ²': '\\hbar^{2}' };
/** a number in TeX: fixed to `d` places, or ×10ⁿ below 1e-3 (a residual reads as its order) */
export function texNum(x, d = 6) {
  if (!Number.isFinite(x)) return '\\text{—}';
  if (x === 0) return '0';
  if (Math.abs(x) >= 1e-3 && Math.abs(x) < 1e6) return x.toFixed(d);
  const [m, e] = x.toExponential(1).split('e');
  return `${m}\\times10^{${+e}}`;
}
const val = (r) => `$${r.tex.name} = ${texNum(r.value)}${r.unit && UNIT_TEX[r.unit] ? '\\,' + UNIT_TEX[r.unit] : ''}$`;
const held = (r) => (r.residual === null ? '' : Number.isFinite(r.residual) ? ` ($\\tfrac{d}{dt} = 0$ to $${texNum(r.residual, 1)}$)` : ' (the DRAG toy is on: it decays)');
export function calculusMarkdown(S) {
  if (!S || !S.rows) return '';
  const by = (g) => S.rows.filter((r) => r.group === g), out = [];
  const cons = by('conservation'), ehr = by('ehrenfest'), vir = by('virial'), mom = by('moments'), rr = by('moment');
  if (cons.length) out.push(cons.map((r) => val(r) + held(r)).join('; ') + '.');
  if (ehr.length === 2) {
    const [z, p] = ehr;
    out.push(`Ehrenfest: $\\tfrac{d}{dt}\\langle z\\rangle = ${texNum(z.derivative)}$ against $\\langle p_z\\rangle = ${texNum(z.predicted)}$, and $\\tfrac{d}{dt}\\langle p_z\\rangle = ${texNum(p.derivative)}$ against the force $${texNum(p.predicted)}$ (residuals $${texNum(z.residual, 1)}$ and $${texNum(p.residual, 1)}$), with ${val(z)} and ${val(p)}.`);
  }
  for (const r of vir) out.push(`The virial ${val(r)}, zero on time average.`);
  if (mom.length) out.push(mom.map((r) => val(r) + (r.residual === null ? ` (${r.tex.why})` : held(r))).join(' and ') + '.');
  for (const r of rr) out.push(val(r) + (r.tex.note ? `, ${r.tex.note}` : '') + '.');
  const laws = ['conservation', 'ehrenfest', 'virial', 'moments'].map((g) => by(g).map((r) => r.tex.law).filter(Boolean).join(',\\qquad ')).filter(Boolean);   // one display line per family
  return `### CALCULUS · $t = ${S.t.toFixed(3)}$\n\nFigure. ${out.join(' ')} At $t = ${S.t.toFixed(3)}$ over ${S.ids} populated state${S.ids === 1 ? '' : 's'}, $h = ${texNum(S.h, 3)}$.\n\n`
    + laws.map((l) => `$$${l}$$`).join('\n\n') + '\n';
}
