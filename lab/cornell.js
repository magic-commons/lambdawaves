/* cornell.js — QUARKONIUM as a Hamiltonian of the register.
 *
 * The Cornell potential V(r) = −4α_s/3r + σr + V₀ for a heavy quark pair of reduced mass μ = m_q/2, solved
 * NUMERICALLY by the same Numerov shooting the QCD panel uses, for every (n_r, l) the 91 labels name:
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
import { numerov, POTENTIALS, DEFAULTS, MEASURED, fitOffset } from './qcd.js';

export const NR = 256;                       // samples per tabulated radial row
export const ROWS = 36;                      // (n_r, l) pairs
const L_RGB = [[255, 226, 170], [120, 225, 240], [230, 160, 240], [255, 150, 90], [140, 220, 140], [180, 160, 255]];

let kind = 'charm', pot = 'cornell', params = { ...DEFAULTS };
let cache = null;
const tcache = new Map();
const rowOf = (nr, l) => l * 6 + nr;

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

function solveAll() {
  const sys = MEASURED[kind], mu = sys.m / 2;
  const V0 = fitOffset(kind, pot, params);
  const P = { ...params, V0 }, V = (r) => POTENTIALS[pot].f(r, P);
  const rmax = 40 / Math.sqrt(mu), N = 4000;
  const rows = [], E = new Float64Array(ROWS), M = new Float64Array(ROWS), r99 = new Float64Array(ROWS), nodes = new Int32Array(ROWS), rTab = new Float64Array(ROWS);
  const table = new Float32Array(ROWS * NR);
  for (let l = 0; l <= 5; l++) for (let nr = 0; nr <= 5; nr++) {
    const s = numerov(V, mu, l, nr + 1, { rmax, N });
    const row = rowOf(nr, l);
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
    E[row] = s.E; M[row] = 2 * sys.m + s.E; nodes[row] = nn;
    let acc = 0, i99 = N; for (let i = N; i >= 0; i--) { acc += u[i] * u[i] * s.h; if (acc > 1e-3) { i99 = i; break; } }   // where 99.9 % of the state lives
    r99[row] = s.r[i99];
    const rt = Math.min(rmax, s.r[i99] * 1.25); rTab[row] = rt;
    for (let j = 0; j < NR; j++) {
      const rr = rt * j / (NR - 1), x = rr / s.h, i0 = Math.min(N - 1, Math.floor(x)), f = x - i0;
      const uu = u[i0] * (1 - f) + u[i0 + 1] * f;
      table[row * NR + j] = rr > 1e-9 ? uu / rr : (l === 0 ? u[1] / s.r[1] : 0);
    }
    rows.push({ nr, l, row, E: s.E, M: M[row], r: s.r, u, h: s.h, cut });
  }
  return { kind, pot, params: P, mu, m: sys.m, rows, E, M, r99, nodes, table, rTab };
}
export function solved() { if (!cache) cache = solveAll(); return cache; }

/** R_{n_r l}(r) = u(r)/r from the fine Numerov grid (∫ R² r² dr = 1) */
export function radialAt(nr, l, r) {
  const S = solved(), R = S.rows[rowOf(nr, l)];
  if (r <= 0) return l === 0 ? R.u[1] / R.r[1] : 0;
  const x = r / R.h; if (x >= R.u.length - 1) return 0;
  const i0 = Math.floor(x), f = x - i0;
  return (R.u[i0] * (1 - f) + R.u[i0 + 1] * f) / r;
}
export const cornellRadial = (n, l, r) => radialAt(n - l - 1, l, r);
export function cornellEnergy(a) { const s = BASIS[a]; return solved().M[rowOf(s.n - s.l - 1, s.l)]; }
export const cornellEnergyOf = (n, l) => solved().M[rowOf(n - l - 1, l)];

/** the kernel record: lag0 = (row, 1/r_tab, r_tab); the angular part as the well's */
export function cornellTable(n, l, m) {
  const S = solved(), row = rowOf(n - l - 1, l);
  const am = Math.abs(m), leg = legendreDerivCoeffs(l, am);
  const sign = (m >= 0 && (am % 2 === 1)) ? -1 : 1;
  const norm = sign * ylmNorm(l, am);
  const pad = (v) => { const o = new Float64Array(6); for (let i = 0; i < v.length && i < 6; i++) o[i] = v[i]; return o; };
  return { n, l, m, am, norm, lag: pad([row, 1 / S.rTab[row], S.rTab[row], 0, 0, 0]), leg: pad(leg), space: 'cornell', row };
}
export function cornellTableFor(s) { let T = tcache.get(s.id); if (!T) { T = cornellTable(s.n, s.l, s.m); tcache.set(s.id, T); } return T; }
export function cornellFromTable(T, x, y, z) {
  const r = Math.hypot(x, y, z); if (r >= T.lag[2]) return { re: 0, im: 0 };
  const ct = r < 1e-300 ? 1 : z / r, st = Math.sqrt(Math.max(0, 1 - ct * ct)), phi = Math.atan2(y, x);
  let D = 0, xp = 1; for (let j = 0; j < 6; j++) { D += T.leg[j] * xp; xp *= ct; }
  let stm = 1; for (let i = 0; i < T.am; i++) stm *= st;
  const f = T.norm * radialAt(T.n - T.l - 1, T.l, r) * stm * D;
  return { re: f * Math.cos(T.m * phi), im: f * Math.sin(T.m * phi) };
}
export function cornellPsiAt(re, im, x, y, z, indices) {
  let R = 0, I = 0;
  for (const a of indices) { const c = re[a], d = im[a]; if (c === 0 && d === 0) continue; const v = cornellFromTable(cornellTableFor(BASIS[a]), x, y, z); R += c * v.re - d * v.im; I += c * v.im + d * v.re; }
  return { re: R, im: I };
}
/** the half-width the field needs: the largest r₉₉ among the shells up to nmax, with margin (GeV⁻¹) */
export function cornellDomainFor(nmax) { const S = solved(); let r = 0; for (const R of S.rows) if (R.nr + R.l + 1 <= nmax) r = Math.max(r, S.r99[R.row]); return Math.max(r * 1.15, 1.0); }
export const cornellRadialTable = () => solved().table;
export const cornellLabelOf = (s) => `${s.n - s.l}${'SPDFGH'[s.l]} ${s.m >= 0 ? '₊' : '₋'}${Math.abs(s.m)}`;
export function cornellSpectrum() {
  const S = solved();
  const levels = S.rows.map((R) => ({ key: (R.nr + R.l + 1) + ':' + R.l, E: R.M, label: `${R.nr + 1}${'SPDFGH'[R.l]}`, rgb: L_RGB[R.l] })).sort((p, q) => p.E - q.E);
  return { levels, levelKey: (i) => BASIS[i].n + ':' + BASIS[i].l, Emin: levels[0].E - 0.15, Etop: levels[levels.length - 1].E + 0.15, topLabel: '',
    footer: `MASS  M = 2m_q + E_{n_r l} · ${POTENTIALS[pot].label} · V₀ fitted to the 1S · ${MEASURED[kind].label} · Numerov` };
}
