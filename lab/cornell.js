/* cornell.js — QUARKONIUM as a Hamiltonian of the register.
 *
 * The Cornell potential V(r) = −4α_s/3r + σr + V₀ for a heavy quark pair of reduced mass μ = m_q/2, solved
 * NUMERICALLY by Numerov shooting (below; the QCD window that shared it left in 0.5.0 D9), for every (n_r, l) the 91 labels name:
 * n_r = n − l − 1 ∈ 0..5, l ∈ 0..5 — thirty-six radial functions.  Units are GeV and GeV⁻¹ (ħ = c = 1;
 * 1 GeV⁻¹ = 0.197 fm).  The energies handed to the register are the MASSES M = 2m_q + E_{n_r l}, with V₀ fitted so
 * the 1S sits on the measured ground state (J/ψ or Υ(1S)) — the one constant every potential model carries.
 * The radial functions are tabulated (256 samples per row) for the kernel's space 6, which interpolates them
 * linearly; on the CPU the fine Numerov grid is interpolated directly.
 *
 * STATUS: NUMERICAL (E to 1e-12 by bisection on the node count; the kernel's table is its estimate).  Momentum space
 * is not built for this Hamiltonian: the selector forces position space, as it does for the box.
 */
import { BASIS, ylmNorm, legendreDerivCoeffs } from './hydrogen.js';
import { rowOfNr } from './atoms.js';

/** the standard potential models, all in GeV / GeV⁻¹ (moved from qcd.js, 0.5.0 D9) */
const POTENTIALS = {
  cornell: { label: 'Cornell  −4α_s/3r + σr + V₀', f: (r, p) => -4 * p.alphaS / (3 * r) + p.sigma * r + (p.V0 || 0) },
  linear: { label: 'linear  σr + V₀  (the Airy limit)', f: (r, p) => p.sigma * r + (p.V0 || 0) },
  coulomb: { label: 'Coulomb  −4α_s/3r', f: (r, p) => -4 * p.alphaS / (3 * r) + (p.V0 || 0) },
  log: { label: 'logarithmic  C ln(r/r₀) + V₀', f: (r, p) => p.C * Math.log(r / p.r0) + (p.V0 || 0) },
};
export const DEFAULTS = { alphaS: 0.39, sigma: 0.18, C: 0.733, r0: 1.0, V0: 0 };
/** the measured levels this is judged against (PDG; GeV) */
export const MEASURED = {
  charm: { label: 'charmonium (cc̄)', m: 1.5, levels: [{ n: 1, name: 'J/ψ(1S)', M: 3.0969 }, { n: 2, name: 'ψ(2S)', M: 3.6861 }, { n: 3, name: 'ψ(3S)', M: 4.039 }] },
  bottom: { label: 'bottomonium (bb̄)', m: 4.8, levels: [{ n: 1, name: 'Υ(1S)', M: 9.4603 }, { n: 2, name: 'Υ(2S)', M: 10.0234 }, { n: 3, name: 'Υ(3S)', M: 10.3552 }] },
};
/**
 * Numerov shooting for the radial equation u'' = [2μ(V(r) − E) + l(l+1)/r²] u, u = rR.  The eigenvalue is found by
 * bisection on the NODE COUNT, which is monotone in E — robust where matching conditions are not.  Returns { E, u, r, nodes, h }.
 */
export function numerov(V, mu, l, level, opt = {}) {
  const rmax = opt.rmax || 12 / Math.sqrt(mu * 0.2), N = opt.N || 4000, h = rmax / N;
  const r = new Float64Array(N + 1), u = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) r[i] = (i + 1e-9) * h;
  const kOf = (E) => { const k = new Float64Array(N + 1); for (let i = 0; i <= N; i++) k[i] = 2 * mu * (V(r[i]) - E) + l * (l + 1) / (r[i] * r[i]); return k; };
  function shoot(E) {
    const k = kOf(E);
    u[0] = Math.pow(r[0], l + 1); u[1] = Math.pow(r[1], l + 1);
    let nodes = 0;
    const f = (i) => 1 - h * h * k[i] / 12;
    for (let i = 1; i < N; i++) {
      u[i + 1] = ((2 + 10 * h * h * k[i] / 12) * u[i] - f(i - 1) * u[i - 1]) / f(i + 1);
      if (u[i + 1] * u[i] < 0) nodes++;
      if (Math.abs(u[i + 1]) > 1e30) { for (let j = 0; j <= i + 1; j++) u[j] *= 1e-30; }
    }
    return nodes;
  }
  let lo = opt.eMin === undefined ? -4 : opt.eMin, hi = opt.eMax === undefined ? 40 : opt.eMax;
  for (let it = 0; it < 200; it++) {
    const mid = (lo + hi) / 2;
    if (shoot(mid) >= level) hi = mid; else lo = mid;
    if (hi - lo < 1e-12) break;
  }
  const E = (lo + hi) / 2;
  const nodes = shoot(E);
  let nrm = 0; for (let i = 0; i <= N; i++) nrm += u[i] * u[i] * h;
  if (nrm > 0) { const s = 1 / Math.sqrt(nrm); for (let i = 0; i <= N; i++) u[i] *= s; }
  return { E, u, r, nodes, h };
}
/** the S-wave spectrum of one system: M_n = 2m + E_n */
export function spectrum(kind, potential, params, count = 3) {
  const sys = MEASURED[kind], mu = sys.m / 2, V = (r) => POTENTIALS[potential].f(r, params);
  const out = [];
  for (let n = 1; n <= count; n++) {
    const s = numerov(V, mu, 0, n, { rmax: 40 / Math.sqrt(mu), N: 4000 });
    out.push({ n, E: s.E, M: 2 * sys.m + s.E, u: s.u, r: s.r, measured: sys.levels[n - 1] });
  }
  return { kind, label: sys.label, m: sys.m, mu, levels: out,
    split: out.length > 1 ? out[1].E - out[0].E : 0,
    measuredSplit: sys.levels.length > 1 ? sys.levels[1].M - sys.levels[0].M : 0 };
}
/** the V₀ that puts the ground state exactly on its measured mass — so the 2S mass becomes a genuine prediction */
export function fitOffset(kind, potential, params) {
  const s = spectrum(kind, potential, { ...params, V0: 0 }, 1);
  return MEASURED[kind].levels[0].M - s.levels[0].M;
}

export const NR = 256;                       // samples per tabulated radial row
export const ROWS = 43;                      // the 6 × 6 (n_r, l) grid and n = 7's (6, 0) and (0, 6) at 36 + l (atoms.js rowOfNr)
export const L_RGB = [[255, 226, 170], [120, 225, 240], [230, 160, 240], [255, 150, 90], [140, 220, 140], [180, 160, 255], [246, 142, 159]];

let kind = 'charm', pot = 'cornell', params = { ...DEFAULTS };
let cache = null;
const tcache = new Map();
const rowOf = rowOfNr;

/** set the system (charm | bottom), the potential id and the parameters; returns true when something changed */
export function configure(k, p, potential) {
  let changed = false;
  if (k && k !== kind && MEASURED[k]) { kind = k; changed = true; }
  if (potential && potential !== pot && POTENTIALS[potential]) { pot = potential; changed = true; }
  if (p) for (const key of ['alphaS', 'sigma', 'C', 'r0']) if (p[key] !== undefined && p[key] !== params[key]) { params[key] = p[key]; changed = true; }
  if (changed) { cache = null; tcache.clear(); }
  return changed;
}
export const system = () => ({ kind, pot, params: { ...params } });

/** one kernel row (shared with central.js): the Numerov solve, the shooter's tail cut and renormalised, r₉₉, and NR samples written into `table` */
export function tabRow(V, mu, l, nr, opt, table, row) {
  const s = numerov(V, mu, l, nr + 1, opt), rmax = opt.rmax, N = opt.N;
  /* the shooter's tail: beyond the outer turning point an outward integration at E ± 1e-12 must eventually grow
     (the exponentially growing solution leaks in), so the raw u is dominated by a spike at r_max.  The energy is
     right (bisection on the node count); the function is right up to where |u| stops falling — cut it there,
     set the rest to zero and renormalise.  With E to 1e-12 the true tail has fallen by ~1e-6 before the cut. */
  const u = Float64Array.from(s.u), Veff = (r) => V(r) + l * (l + 1) / (2 * mu * r * r);
  let it = N; for (let i = N; i >= 1; i--) if (Veff(s.r[i]) < s.E) { it = i; break; }
  let cut = N; for (let i = it + 1; i < N; i++) if (Math.abs(u[i + 1]) > Math.abs(u[i])) { cut = i; break; }
  for (let i = cut; i <= N; i++) u[i] = 0;
  let nrm = 0; for (let i = 0; i <= N; i++) nrm += u[i] * u[i] * s.h; const sc = nrm > 0 ? 1 / Math.sqrt(nrm) : 1; for (let i = 0; i <= N; i++) u[i] *= sc;
  let nn = 0; for (let i = 1; i < cut; i++) if (u[i] * u[i - 1] < 0) nn++;
  let acc = 0, i99 = N; for (let i = N; i >= 0; i--) { acc += u[i] * u[i] * s.h; if (acc > 1e-3) { i99 = i; break; } }   // where 99.9 % of the state lives
  const rt = Math.min(rmax, s.r[i99] * 1.25);
  for (let j = 0; j < NR; j++) {
    const rr = rt * j / (NR - 1), x = rr / s.h, i0 = Math.min(N - 1, Math.floor(x)), f = x - i0;
    const uu = u[i0] * (1 - f) + u[i0 + 1] * f;
    table[row * NR + j] = rr > 1e-9 ? uu / rr : (l === 0 ? u[1] / s.r[1] : 0);
  }
  return { nr, l, row, E: s.E, r: s.r, u, h: s.h, cut, nodes: nn, r99: s.r[i99], rTab: rt };
}
function solveAll() {
  const sys = MEASURED[kind], mu = sys.m / 2;
  const V0 = fitOffset(kind, pot, params);
  const P = { ...params, V0 }, V = (r) => POTENTIALS[pot].f(r, P);
  const rmax = 40 / Math.sqrt(mu), N = 4000;
  const rows = [], byRow = [], E = new Float64Array(ROWS), M = new Float64Array(ROWS), r99 = new Float64Array(ROWS), nodes = new Int32Array(ROWS), rTab = new Float64Array(ROWS);
  const table = new Float32Array(ROWS * NR);
  const pairs = []; for (let l = 0; l <= 5; l++) for (let nr = 0; nr <= 5; nr++) pairs.push([nr, l]);
  pairs.push([6, 0], [0, 6]);                                          // n = 7's two pairs outside the grid (7S, 1I), solved after it so no row before moves
  for (const [nr, l] of pairs) {
    const R = tabRow(V, mu, l, nr, { rmax, N }, table, rowOf(nr, l)), row = R.row;
    E[row] = R.E; M[row] = 2 * sys.m + R.E; nodes[row] = R.nodes; r99[row] = R.r99; rTab[row] = R.rTab;
    rows.push(byRow[row] = { nr, l, row, E: R.E, M: M[row], r: R.r, u: R.u, h: R.h, cut: R.cut });   // rows in solve order, byRow by the table's row
  }
  return { kind, pot, params: P, mu, m: sys.m, rows, byRow, E, M, r99, nodes, table, rTab };
}
export function solved() { if (!cache) cache = solveAll(); return cache; }

/** R_{n_r l}(r) = u(r)/r from the fine Numerov grid (∫ R² r² dr = 1) */
export function radialAt(nr, l, r, S = solved()) {
  const R = (S.byRow || S.rows)[rowOf(nr, l)];                       // cornell's byRow; central.js keeps its rows by row
  if (r <= 0) return l === 0 ? R.u[1] / R.r[1] : 0;
  const x = r / R.h; if (x >= R.u.length - 1) return 0;
  const i0 = Math.floor(x), f = x - i0;
  return (R.u[i0] * (1 - f) + R.u[i0 + 1] * f) / r;
}
export const cornellRadial = (n, l, r) => radialAt(n - l - 1, l, r);
export function cornellEnergy(a) { const s = BASIS[a]; return solved().M[rowOf(s.n - s.l - 1, s.l)]; }
export const cornellEnergyOf = (n, l) => solved().M[rowOf(n - l - 1, l)];

/** the kernel record: lag0 = (row, 1/r_tab, r_tab); the angular part as the well's */
export function cornellTable(n, l, m, S = solved()) {
  const row = rowOf(n - l - 1, l);
  const am = Math.abs(m), leg = legendreDerivCoeffs(l, am);
  const sign = (m >= 0 && (am % 2 === 1)) ? -1 : 1;
  const norm = sign * ylmNorm(l, am);
  const pad = (v) => { const o = new Float64Array(7); for (let i = 0; i < v.length && i < 7; i++) o[i] = v[i]; return o; };
  return { n, l, m, am, norm, lag: pad([row, S.rTab[row] ? 1 / S.rTab[row] : 0, S.rTab[row], 0, 0, 0]), leg: pad(leg), space: 'cornell', row };
}
export function cornellTableFor(s) { let T = tcache.get(s.id); if (!T) { T = cornellTable(s.n, s.l, s.m); tcache.set(s.id, T); } return T; }
export function cornellFromTable(T, x, y, z, S) {
  const r = Math.hypot(x, y, z); if (r >= T.lag[2]) return { re: 0, im: 0 };
  const ct = r < 1e-300 ? 1 : z / r, st = Math.sqrt(Math.max(0, 1 - ct * ct)), phi = Math.atan2(y, x);
  let D = 0, xp = 1; for (let j = 0; j < T.leg.length; j++) { D += T.leg[j] * xp; xp *= ct; }
  let stm = 1; for (let i = 0; i < T.am; i++) stm *= st;
  const f = T.norm * radialAt(T.n - T.l - 1, T.l, r, S) * stm * D;
  return { re: f * Math.cos(T.m * phi), im: f * Math.sin(T.m * phi) };
}
export function cornellPsiAt(re, im, x, y, z, indices, tf = cornellTableFor, S) {
  let R = 0, I = 0;
  for (const a of indices) { const c = re[a], d = im[a]; if (c === 0 && d === 0) continue; const v = cornellFromTable(tf(BASIS[a]), x, y, z, S); R += c * v.re - d * v.im; I += c * v.im + d * v.re; }
  return { re: R, im: I };
}
/** the half-width the field needs: the largest r₉₉ among the shells up to nmax, with margin (GeV⁻¹) */
export function cornellDomainFor(nmax) { const S = solved(); let r = 0; for (const R of S.rows) if (R.nr + R.l + 1 <= nmax) r = Math.max(r, S.r99[R.row]); return Math.max(r * 1.15, 1.0); }
export const cornellRadialTable = () => solved().table;
export const cornellLabelOf = (s) => `${s.n - s.l}${'SPDFGHI'[s.l]} ${s.m >= 0 ? '₊' : '₋'}${Math.abs(s.m)}`;
export function cornellSpectrum() {
  const S = solved();
  const levels = S.rows.map((R) => ({ key: (R.nr + R.l + 1) + ':' + R.l, E: R.M, label: `${R.nr + 1}${'SPDFGHI'[R.l]}`, rgb: L_RGB[R.l] })).sort((p, q) => p.E - q.E);
  return { levels, levelKey: (i) => BASIS[i].n + ':' + BASIS[i].l, Emin: levels[0].E - 0.15, Etop: levels[levels.length - 1].E + 0.15, topLabel: '',
    footer: `MASS  M = 2m_q + E_{n_r l} · ${POTENTIALS[pot].label} · V₀ fitted to the 1S · ${MEASURED[kind].label} · Numerov` };
}
