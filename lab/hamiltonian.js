/* hamiltonian.js — the HAMILTONIAN in force: which eigenproblem the register's 91 labels refer to.
 *
 * The instrument was built on hydrogen; the eigen-selector in SPECTRUM now chooses the operator, and everything
 * that depends on it — energies, the kernel's radial tables and envelope, the box, momentum space, the slap's
 * radial integrals — reads it from here.  Windows that are theorems ABOUT hydrogen (the SO(4) orbit, the revival
 * ladder, the Kepler ellipse, the vortex census, the Bohm particles, the KS slice) say so and stand down when the
 * operator is not hydrogen: cull the observation, never the state.
 *
 *   hydrogen  E = −1/(2n²) ·  ψ = e^{−ρ/2} ρ^l L(ρ) Y ·  Stark exact within a shell ·  every window
 *   qho       E = N + 3/2  ·  ψ = e^{−r²/2} r^l L^{(l+½)}(r²) Y ·  no Stark (a displaced oscillator: not yet) ·
 *             momentum space = the same picture with the phase (−i)^N ·  a slap makes an exact coherent state
 */
import { BASIS, energy as hydrogenEnergy, radial as hydrogenRadial, domainFor as hydrogenDomainFor, psiAt as hydrogenPsiAt, ylmNorm, legendreDerivCoeffs } from './hydrogen.js';
import { tableFor as hydrogenTableFor } from './field.js';
import { momentumTableFor as hydrogenMomentumTableFor, domainForP as hydrogenDomainForP, phiAt as hydrogenPhiAt } from './momentum.js';
import { cornellEnergy, cornellRadial, cornellTableFor, cornellPsiAt, cornellDomainFor, cornellLabelOf, cornellSpectrum, cornellRadialTable, configure as cornellConfigure, system as cornellSystem } from './cornell.js';
import { qhoEnergy, qhoEnergyOf, qhoN, qhoRadial, qhoTableFor, qhoMomentumTableFor, qhoDomainFor, qhoPsiAt } from './qho.js';
import { wellEnergy, wellEnergyOf, wellRadialFor, wellTableFor, wellDomainFor, wellPsiAt, wellRadius, setWellRadius } from './well.js';
import { atom as atomOf, solveAtom, virtualEnergyOf, atomRadial, atomRadialTable, atomDomainFor, atomSpectrum, rowOf as atomRowOf, NR } from './atoms.js';

const N_RGB = { 1: [255, 255, 255], 2: [255, 190, 90], 3: [120, 225, 240], 4: [200, 140, 255], 5: [140, 240, 160], 6: [255, 120, 150] };
const QHO_RGB = (N) => [[255, 255, 255], [255, 190, 90], [120, 225, 240], [200, 140, 255], [140, 240, 160], [255, 120, 150]][N % 6];

export const HAMILTONIANS = {
  hydrogen: {
    id: 'hydrogen', label: 'HYDROGEN  −½∇² − 1/r', short: 'H', unit: 'hartree', lengthUnit: 'a₀',
    energy: (a) => hydrogenEnergy(BASIS[a].n),
    radial: hydrogenRadial,
    tableFor: hydrogenTableFor, momentumTableFor: hydrogenMomentumTableFor,
    psiAt: hydrogenPsiAt, phiAt: hydrogenPhiAt,
    domainFor: hydrogenDomainFor, domainForP: hydrogenDomainForP,
    kernelSpace: { x: 0, p: 1 },
    stark: true, hydrogenTheorems: true,
    labelOf: (s) => `${s.n}${'spdfgh'[s.l]}${s.m >= 0 ? '₊' : '₋'}${Math.abs(s.m)}`,
    spectrum: null,                                                 // null = the built-in hydrogen ladder
  },
  qho: {
    id: 'qho', label: 'OSCILLATOR  −½∇² + ½r²', short: 'QHO', unit: 'ħω', lengthUnit: '√(ħ/mω)',
    energy: qhoEnergy,
    radial: qhoRadial,
    tableFor: qhoTableFor, momentumTableFor: qhoMomentumTableFor,
    psiAt: qhoPsiAt, phiAt: qhoPsiAt,                                // φ(p) has the same form — the phase is on the table
    domainFor: qhoDomainFor, domainForP: () => qhoDomainFor(6),
    kernelSpace: { x: 2, p: 2 },
    stark: false, hydrogenTheorems: false,
    labelOf: (s) => `N${qhoN(s.n, s.l)} n_r${s.n - s.l - 1} ${'spdfgh'[s.l]}${s.m >= 0 ? '₊' : '₋'}${Math.abs(s.m)}`,
    spectrum: {
      levels: Array.from({ length: 11 }, (_, N) => ({ key: N, E: N + 1.5, label: `N${N}`, rgb: QHO_RGB(N) })),
      levelKey: (a) => qhoN(BASIS[a].n, BASIS[a].l),
      Emin: 1.5, Etop: 12.5, topLabel: '', footer: 'EIGENVALUE  E = ħω(N + 3/2), N = 2n_r + l  (no continuum)',
    },
  },
};
HAMILTONIANS.well = {
  id: 'well', label: 'SPHERICAL WELL  −½∇² in r < a, ∞ outside', short: 'BOX', unit: 'hartree', lengthUnit: 'a₀',
  energy: wellEnergy,
  radial: wellRadialFor,
  tableFor: wellTableFor, momentumTableFor: wellTableFor,           // momentum space of the well is not built: the selector forces position space
  psiAt: wellPsiAt, phiAt: wellPsiAt,
  domainFor: wellDomainFor, domainForP: wellDomainFor,
  kernelSpace: { x: 3, p: 3 },
  stark: false, hydrogenTheorems: false, noMomentum: true,
  labelOf: (s) => `${s.n - s.l}${'spdfgh'[s.l]} well ${s.m >= 0 ? '₊' : '₋'}${Math.abs(s.m)}`,
  get spectrum() {
    const a = wellRadius(), levels = [];
    for (let n = 1; n <= 6; n++) for (let l = 0; l < n; l++) levels.push({ key: n + ':' + l, E: wellEnergyOf(n, l, a), label: `${n - l}${'spdfgh'[l]}`, rgb: QHO_RGB(n - 1) });
    levels.sort((p, q) => p.E - q.E);
    const Etop = levels[levels.length - 1].E * 1.08;
    return { levels, levelKey: (i) => BASIS[i].n + ':' + BASIS[i].l, Emin: 0, Etop, topLabel: '', footer: `EIGENVALUE  E = z²_{n_r+1,l}/(2a²), hard wall at a = ${a.toFixed(1)} a₀  (no continuum)` };
  },
  get radius() { return wellRadius(); }, setRadius: setWellRadius,
};
HAMILTONIANS.cornell = {
  id: 'cornell', label: 'QUARKONIUM  −4α_s/3r + σr  (Cornell)', short: 'QQ̄', unit: 'GeV', lengthUnit: 'GeV⁻¹',
  energy: cornellEnergy,
  radial: cornellRadial,
  tableFor: cornellTableFor, momentumTableFor: cornellTableFor,       // momentum space is not built: the selector forces position space
  psiAt: cornellPsiAt, phiAt: cornellPsiAt,
  domainFor: cornellDomainFor, domainForP: cornellDomainFor,
  kernelSpace: { x: 6, p: 6 },
  stark: false, hydrogenTheorems: false, noMomentum: true,
  labelOf: cornellLabelOf,
  get spectrum() { return cornellSpectrum(); },
  radialTable: cornellRadialTable, configure: cornellConfigure, get system() { return cornellSystem(); },
};
/* ── ATOM: the periodic table as ONE self-consistent central field (lab/atoms.js).  The 91 labels become the shells
   of a NEUTRAL atom in its own Xα(2/3) + Latter-tail potential: the SCF eigenvalue where the ground configuration
   occupies the shell, and the SAME frozen field's eigenvalue where it does not (a VIRTUAL shell, marked ° — every
   label keeps an energy AND a radial now: atoms.js solves the unoccupied shell in the frozen potential, so all 91
   labels hand the kernel a real row; ° still means exactly "not in the ground configuration", never "no state").
   The kernel reads the 40 × 256 table atoms.js builds with cornell's own row map,
   row = 6l + n − l − 1, through kernel space 6; momentum space is not built, as for the box and quarkonium. ── */
const A_RGB = [[255, 226, 170], [120, 225, 240], [230, 160, 240], [255, 150, 90], [140, 220, 140], [180, 160, 255]];
let atomZ = 10;                                                    // Ne is the shipped element: a closed 2p shell to look at
const atomEps = new Map(), atomTabs = new Map();
let atomBuilt = null, atomSpec = null;
/** the solved atom, its table and its rows — one SCF (≈ 0.1 s) per element, then cached */
function atomState() {
  if (atomBuilt && atomBuilt.Z === atomZ) return atomBuilt;
  const S = solveAtom(atomZ), first = S.orbitals[0], T = atomRadialTable(atomZ, first.n, first.l);
  const rows = new Map(T.rows.map((r) => [r.n + ':' + r.l, r]));
  /* every (n, l) with n ≤ 6 gets a row in the SAME table the kernel is handed: the unoccupied ones are the frozen
     field's own orbitals (one solveL per l channel inside atoms.js, then cached), so no label draws nothing */
  for (let n = 1; n <= 6; n++) for (let l = 0; l < n; l++) {
    const k = n + ':' + l; if (rows.has(k)) continue;
    const V = atomRadialTable(atomZ, n, l);
    T.table.set(V.table.subarray(V.row * NR, (V.row + 1) * NR), V.row * NR);
    rows.set(k, { n, l, occ: 0, eps: V.eps, row: V.row, rTab: V.rTab, virtual: true });
  }
  atomBuilt = { Z: atomZ, S, table: T.table, rows, half: atomDomainFor(atomZ) };
  return atomBuilt;
}
/** the occupancy of (n, l) in the ground configuration — 0 marks a virtual shell */
const atomOcc = (n, l) => { const r = atomState().rows.get(n + ':' + l); return r ? r.occ : 0; };
/** ε_nl in hartree: the SCF eigenvalue when the shell is occupied, the frozen field's readout when it is not */
function atomEpsOf(n, l) {
  const k = atomZ + ':' + n + ':' + l; let e = atomEps.get(k);
  if (e === undefined) { const r = atomState().rows.get(n + ':' + l); e = r ? r.eps : virtualEnergyOf(atomZ, n, l); atomEps.set(k, e); }
  return e;
}
const pad6 = (v) => { const o = new Float64Array(6); for (let i = 0; i < v.length && i < 6; i++) o[i] = v[i]; return o; };
/** the kernel record, cornell's exactly: lag0 = (row, 1/r_tab, r_tab) — a real row for every one of the 91 labels */
function atomTable(n, l, m) {
  const r = atomState().rows.get(n + ':' + l), am = Math.abs(m);
  const sign = (m >= 0 && (am % 2 === 1)) ? -1 : 1;
  return { n, l, m, am, norm: sign * ylmNorm(l, am), virtual: !r || !!r.virtual, row: r ? r.row : 0, space: 'atom',
    lag: pad6(r ? [atomRowOf(n, l), 1 / r.rTab, r.rTab] : [0, 0, 0]), leg: pad6(legendreDerivCoeffs(l, am)) };
}
function atomTableFor(s) { const k = atomZ + ':' + s.id; let T = atomTabs.get(k); if (!T) { T = atomTable(s.n, s.l, s.m); atomTabs.set(k, T); } return T; }
function atomFromTable(T, x, y, z) {
  const r = Math.hypot(x, y, z); if (!(T.lag[2] > 0) || r >= T.lag[2]) return { re: 0, im: 0 };
  const ct = r < 1e-300 ? 1 : z / r, st = Math.sqrt(Math.max(0, 1 - ct * ct)), phi = Math.atan2(y, x);
  let D = 0, xp = 1; for (let j = 0; j < 6; j++) { D += T.leg[j] * xp; xp *= ct; }
  let stm = 1; for (let i = 0; i < T.am; i++) stm *= st;
  const f = T.norm * atomRadial(atomZ, T.n, T.l, r) * stm * D;
  return { re: f * Math.cos(T.m * phi), im: f * Math.sin(T.m * phi) };
}
function atomPsiAt(re, im, x, y, z, indices) {
  let R = 0, I = 0;
  for (const a of indices) { const c = re[a], d = im[a]; if (c === 0 && d === 0) continue; const v = atomFromTable(atomTableFor(BASIS[a]), x, y, z); R += c * v.re - d * v.im; I += c * v.im + d * v.re; }
  return { re: R, im: I };
}
HAMILTONIANS.atom = {
  id: 'atom', label: 'ATOM  Xα(2/3) + Latter tail  (central field)', unit: 'hartree', lengthUnit: 'a₀',
  get short() { return atomOf(atomZ).symbol; },
  energy: (a) => atomEpsOf(BASIS[a].n, BASIS[a].l),
  radial: (n, l, r) => atomRadial(atomZ, n, l, r),
  tableFor: atomTableFor, momentumTableFor: atomTableFor,             // momentum space is not built: the selector forces position space
  psiAt: atomPsiAt, phiAt: atomPsiAt,
  domainFor: () => atomState().half, domainForP: () => atomState().half,
  kernelSpace: { x: 6, p: 6 },
  stark: false, hydrogenTheorems: false, noMomentum: true,
  labelOf: (s) => `${s.n}${'spdfgh'[s.l]}${s.m >= 0 ? '₊' : '₋'}${Math.abs(s.m)}${atomOcc(s.n, s.l) ? '' : '°'}`,
  get spectrum() {
    if (atomSpec && atomSpec.Z === atomZ) return atomSpec;
    const levels = [];
    for (let n = 1; n <= 6; n++) for (let l = 0; l < n; l++) { const occ = atomOcc(n, l); levels.push({ key: n + ':' + l, E: atomEpsOf(n, l), label: `${n}${'spdfgh'[l]}${occ ? '' : '°'}`, rgb: A_RGB[l], occ }); }
    levels.sort((p, q) => p.E - q.E);
    atomSpec = { Z: atomZ, levels, levelKey: (a) => BASIS[a].n + ':' + BASIS[a].l, Emin: levels[0].E * 1.02, Etop: 0, topLabel: 'E = 0',
      footer: atomSpectrum(atomZ).footer + ' · ° = VIRTUAL (a shell of the frozen field — not in the ground configuration) · the core sets this linear scale: the log ladder is in ATOMS' };
    return atomSpec;
  },
  radialTable: () => atomState().table,
  /** choose the element, Z = 1 … 36; true when it changed, and the caller re-runs switchHamiltonian */
  configure(Z) {
    Z = Math.max(1, Math.min(36, Math.round(Z) || 1));
    if (Z === atomZ) return false;
    atomZ = Z; atomBuilt = null; atomSpec = null; atomEps.clear(); atomTabs.clear();
    for (const fn of listeners) fn(HAMILTONIANS.atom);
    return true;
  },
  get Z() { return atomZ; }, get element() { return atomOf(atomZ); }, get system() { return atomState().S; },
};

/* ── Z: hydrogen-like ions by exact scaling.  Everything hydrogen knows transfers with lengths /Z, energies ×Z²,
   momenta ×Z: the tables keep their polynomials and change their scale (n → n/Z for ρ = 2Zr/n) and norm (×Z^{3/2});
   the momentum tables keep the exponent n+1 explicitly.  The hydrogen THEOREM windows are written for Z = 1
   (their clocks, orbits and nodal lines are in hydrogen's own units), so they stand down for Z ≠ 1 — ORBIT's
   invariants are dimensionless and stay. ── */
const H0 = HAMILTONIANS.hydrogen;
const base = { energy: H0.energy, radial: H0.radial, tableFor: H0.tableFor, momentumTableFor: H0.momentumTableFor, psiAt: H0.psiAt, phiAt: H0.phiAt, domainFor: H0.domainFor, domainForP: H0.domainForP };
let ZION = 1;
const zTables = new Map(), zMomTables = new Map();
export function setZ(Z) {
  Z = Math.max(1, Math.round(Z)); if (Z === ZION) return ZION;
  ZION = Z; zTables.clear(); zMomTables.clear();
  const s32 = Math.pow(Z, 1.5);
  H0.Z = Z;
  H0.label = Z === 1 ? 'HYDROGEN  −½∇² − 1/r' : `HYDROGEN-LIKE ION  −½∇² − ${Z}/r  (Z = ${Z})`;
  H0.energy = (a) => Z * Z * base.energy(a);
  H0.radial = (n, l, r) => s32 * base.radial(n, l, Z * r);
  H0.tableFor = (s) => { let T = zTables.get(s.id); if (!T) { const B = base.tableFor(s); T = { ...B, n: B.n / Z, norm: B.norm * s32, expo: B.n + 1 }; zTables.set(s.id, T); } return T; };
  H0.momentumTableFor = (s) => { let T = zMomTables.get(s.id); if (!T) { const B = base.momentumTableFor(s); T = { ...B, n: B.n / Z, norm: B.norm / s32, expo: B.n + 1 }; zMomTables.set(s.id, T); } return T; };
  H0.psiAt = (re, im, x, y, z, ids) => { const v = base.psiAt(re, im, Z * x, Z * y, Z * z, ids); return { re: s32 * v.re, im: s32 * v.im }; };
  H0.phiAt = (re, im, px, py, pz, ids) => { const v = base.phiAt(re, im, px / Z, py / Z, pz / Z, ids); return { re: v.re / s32, im: v.im / s32 }; };
  H0.domainFor = (nmax) => base.domainFor(nmax) / Z;
  H0.domainForP = (nmin) => base.domainForP(nmin) * Z;
  H0.stark = Z === 1; H0.hydrogenTheorems = Z === 1;
  H0.lengthUnit = 'a₀';
  H0.spectrum = Z === 1 ? null : { levels: [1, 2, 3, 4, 5, 6].map((n) => ({ key: n, E: Z * Z * hydrogenEnergy(n), label: 'n' + n, rgb: N_RGB[n] })), levelKey: (a) => BASIS[a].n, Emin: Z * Z * hydrogenEnergy(1), Etop: 0, topLabel: 'E = 0', footer: `EIGENVALUE  E_n = −Z²/(2n²) hartree, Z = ${Z}` };   // Round 11 A7
  for (const fn of listeners) fn(H0);
  return ZION;
}
export const getZ = () => ZION;
H0.Z = 1;
let current = HAMILTONIANS.hydrogen;
const listeners = new Set();
export function getHamiltonian() { return current; }
export function setHamiltonian(id) {
  const H = HAMILTONIANS[id]; if (!H) throw new Error('no such Hamiltonian: ' + id);
  if (H === current) return current;
  current = H;
  for (const fn of listeners) fn(H);
  return H;
}
export function onHamiltonian(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export const hydrogenRGB = N_RGB;
