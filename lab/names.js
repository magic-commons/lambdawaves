/* names.js — THE NAMES (0.4.0 S1 · wave 140): one service for every name an orbital or a state carries.
 *
 * WHAT THIS IS.  The port of research/molecular-orbitals-2026-10-01/names-probe.mjs (PROBE.md) into the app: DECLARE AND
 * VERIFY, no point-group detector.  Each library molecule declares its point group and frame (lab/molecules.js
 * `symmetry`); here every declared operation is applied to the nuclear framework (refused outside `geomTol`), turned
 * into its AO representation D(R) (atoms permute, s 1:1, p by R, Cartesian d by N⁻¹ Sym²(R) N), checked as DᵀSD = S,
 * and the energy levels of the solve are labelled by their characters χ(R) = Σ_k C_kᵀ S D(R) C_k decomposed against the
 * group's table.  A level must be exactly one irrep of its own dimension or it gets NO name and a reason; one refused
 * level and the whole record shows indices (all or nothing — a counted label above a refused level is unreliable).
 * Linear molecules have no table: |λ| from χ(C_φ) at three generic angles (a fourth checks), ± from σ_v, g/u from i·C_φ.
 *
 * PURE: no DOM, no clock.  Runs in the worker inside `ensureSolve` (lab/mathworker.js) and in node (tests/names.test.mjs,
 * tools/orbital-names.mjs).  A names record is DERIVED from the solve and lives in no scope: never stored in a project,
 * a link or a history row.
 *
 * THE FORMS.  `forms(label)` is the one formatter for every surface: plain (a dial's text node: `3σg`, `1e1g (a)`),
 * typeset (`3σ_g`, `1e₁g`, `1b₁`), latex (`$3\sigma_{g}$`), ascii (`3sg`) and speech ("three sigma g"); `parts` lets a
 * DOM writer put the subscript in a <sub>.  The atoms' n l m names (`atomForms`) and the frontier words (`frontierName`)
 * live here too: the four formatters the app had (orbitalsview `label`, chemview `orbFmt`, latex-state `frontier` /
 * `latexName`, hydrogen.js's `subscript`) read this file.
 */
import { clusterRanges } from './canon-gauge.js'; import { etable, CART } from './md.js';

/* ── 3 × 3 algebra, row-major ─────────────────────────────────────────────────────────────────────────────── */
const mm3 = (A, B) => { const o = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j] += A[i * 3 + k] * B[k * 3 + j]; return o; };
const tp3 = (A) => [A[0], A[3], A[6], A[1], A[4], A[7], A[2], A[5], A[8]];
const det3 = (A) => A[0] * (A[4] * A[8] - A[5] * A[7]) - A[1] * (A[3] * A[8] - A[5] * A[6]) + A[2] * (A[3] * A[7] - A[4] * A[6]);
const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => { const n = Math.hypot(a[0], a[1], a[2]); return [a[0] / n, a[1] / n, a[2] / n]; };
const Rz = (t) => [Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t), 0, 0, 0, 1];
/** rotation by t about the unit axis u (Rodrigues) */
const rot = (u, t) => { const [x, y, z] = unit(u), c = Math.cos(t), s = Math.sin(t), C = 1 - c;
  return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]; };
const diag = (a, b, c) => [a, 0, 0, 0, b, 0, 0, 0, c];
const INV = diag(-1, -1, -1), SH = diag(1, 1, -1), C2X = diag(1, -1, -1);

/** the closure of a set of generators: every product, deduplicated at 1e-9 */
function closure(gens) {
  const key = (R) => R.map((v) => Math.round(v * 1e8)).join(','), out = [I3], seen = new Set([key(I3)]);
  for (let i = 0; i < out.length; i++) for (const g of gens) {
    const P = mm3(out[i], g), k = key(P);
    if (!seen.has(k)) { seen.add(k); out.push(P); }
  }
  return out;
}

/* ── THE GROUPS, as data.  A column is [name, det, trace, test?]: an operation belongs to the first column whose
 * determinant, trace (±1e-6) and optional test match; the class sizes are then COUNTED and the table is self-tested
 * (row and column orthogonality, Σ dim² = h, the vector representation decomposes into whole irreps).  Every irrep
 * here is real.  The frame: z the principal axis; the tests name the axis conventions (below, CONVENTION). ─────── */
const G5 = 2 * Math.cos(2 * Math.PI / 5), G52 = 2 * Math.cos(4 * Math.PI / 5);     // 0.618…, −1.618…
const PHI = (1 + Math.sqrt(5)) / 2, PSI = 1 - PHI;
const T = {                                                    // the operation tests
  'z+': (R) => R[8] > 0.5, 'z-': (R) => R[8] < -0.5, 'x+': (R) => R[0] > 0.5, 'x-': (R) => R[0] < -0.5,
  'y+': (R) => R[4] > 0.5, 'y-': (R) => R[4] < -0.5,
  diag: (R) => Math.abs(R[1]) + Math.abs(R[2]) + Math.abs(R[3]) + Math.abs(R[5]) + Math.abs(R[6]) + Math.abs(R[7]) < 1e-9,
  off: (R) => !T.diag(R),
  /* D6h: the in-plane axis (or the plane's in-plane line) at φ; through the atoms when φ is a multiple of 60° */
  at0: (R) => { const a = Math.atan2(R[3], R[0]) * 90 / Math.PI; return Math.abs(a / 60 - Math.round(a / 60)) < 1e-6; },
  at30: (R) => !T.at0(R),
};
const neg = (row) => row.map((v) => -v);
export const GROUPS = {
  C1: { gens: [], cols: [['E', 1, 3]], irreps: { A: [1] } },
  Cs: { gens: [SH], cols: [['E', 1, 3], ['σh', -1, 1]], irreps: { "A'": [1, 1], "A''": [1, -1] } },
  C2: { gens: [Rz(Math.PI)], cols: [['E', 1, 3], ['C2', 1, -1]], irreps: { A: [1, 1], B: [1, -1] } },
  C2h: { gens: [Rz(Math.PI), INV], cols: [['E', 1, 3], ['C2', 1, -1], ['i', -1, -3], ['σh', -1, 1]],
    irreps: { Ag: [1, 1, 1, 1], Bg: [1, -1, 1, -1], Au: [1, 1, -1, -1], Bu: [1, -1, -1, 1] } },
  C2v: { gens: [Rz(Math.PI), diag(1, -1, 1)], cols: [['E', 1, 3], ['C2', 1, -1], ['σv(xz)', -1, 1, 'y-'], ["σv'(yz)", -1, 1, 'x-']],
    irreps: { A1: [1, 1, 1, 1], A2: [1, 1, -1, -1], B1: [1, -1, 1, -1], B2: [1, -1, -1, 1] } },
  C3v: { gens: [Rz(2 * Math.PI / 3), diag(1, -1, 1)], cols: [['E', 1, 3], ['2C3', 1, 0], ['3σv', -1, 1]],
    irreps: { A1: [1, 1, 1], A2: [1, 1, -1], E: [2, -1, 0] } },
  D2h: { gens: [Rz(Math.PI), diag(-1, 1, -1), INV],
    cols: [['E', 1, 3], ['C2(z)', 1, -1, 'z+'], ['C2(y)', 1, -1, 'y+'], ['C2(x)', 1, -1, 'x+'], ['i', -1, -3], ['σ(xy)', -1, 1, 'z-'], ['σ(xz)', -1, 1, 'y-'], ['σ(yz)', -1, 1, 'x-']],
    irreps: { Ag: [1, 1, 1, 1, 1, 1, 1, 1], B1g: [1, 1, -1, -1, 1, 1, -1, -1], B2g: [1, -1, 1, -1, 1, -1, 1, -1], B3g: [1, -1, -1, 1, 1, -1, -1, 1],
      Au: [1, 1, 1, 1, -1, -1, -1, -1], B1u: [1, 1, -1, -1, -1, -1, 1, 1], B2u: [1, -1, 1, -1, -1, 1, -1, 1], B3u: [1, -1, -1, 1, -1, 1, 1, -1] } },
  D3h: { gens: [Rz(2 * Math.PI / 3), C2X, SH], cols: [['E', 1, 3], ['2C3', 1, 0], ['3C2', 1, -1], ['σh', -1, 1, 'z-'], ['2S3', -1, -2], ['3σv', -1, 1, 'z+']],
    irreps: { "A1'": [1, 1, 1, 1, 1, 1], "A2'": [1, 1, -1, 1, 1, -1], "E'": [2, -1, 0, 2, -1, 0],
      "A1''": [1, 1, 1, -1, -1, -1], "A2''": [1, 1, -1, -1, -1, 1], "E''": [2, -1, 0, -2, 1, 0] } },
  D3d: { gens: [Rz(2 * Math.PI / 3), rot([0, 1, 0], Math.PI), INV], cols: [['E', 1, 3], ['2C3', 1, 0], ['3C2', 1, -1], ['i', -1, -3], ['2S6', -1, 0], ['3σd', -1, 1]],
    irreps: { A1g: [1, 1, 1, 1, 1, 1], A2g: [1, 1, -1, 1, 1, -1], Eg: [2, -1, 0, 2, -1, 0],
      A1u: [1, 1, 1, -1, -1, -1], A2u: [1, 1, -1, -1, -1, 1], Eu: [2, -1, 0, -2, 1, 0] } },
  Td: { gens: [[0, 0, 1, 1, 0, 0, 0, 1, 0], [0, 1, 0, -1, 0, 0, 0, 0, -1]], cols: [['E', 1, 3], ['8C3', 1, 0], ['3C2', 1, -1], ['6S4', -1, -1], ['6σd', -1, 1]],
    irreps: { A1: [1, 1, 1, 1, 1], A2: [1, 1, 1, -1, -1], E: [2, -1, 2, 0, 0], T1: [3, 0, -1, 1, -1], T2: [3, 0, -1, -1, 1] } },
  D5h: { gens: [Rz(2 * Math.PI / 5), C2X, SH], cols: [['E', 1, 3], ['2C5', 1, 1 + G5], ['2C5²', 1, 1 + G52], ['5C2', 1, -1], ['σh', -1, 1, 'z-'], ['2S5', -1, G5 - 1], ['2S5³', -1, G52 - 1], ['5σv', -1, 1, 'z+']],
    irreps: { "A1'": [1, 1, 1, 1, 1, 1, 1, 1], "A2'": [1, 1, 1, -1, 1, 1, 1, -1], "E1'": [2, G5, G52, 0, 2, G5, G52, 0], "E2'": [2, G52, G5, 0, 2, G52, G5, 0],
      "A1''": [1, 1, 1, 1, -1, -1, -1, -1], "A2''": [1, 1, 1, -1, -1, -1, -1, 1], "E1''": [2, G5, G52, 0, -2, -G5, -G52, 0], "E2''": [2, G52, G5, 0, -2, -G52, -G5, 0] } },
  D5d: { gens: [Rz(2 * Math.PI / 5), C2X, INV], cols: [['E', 1, 3], ['2C5', 1, 1 + G5], ['2C5²', 1, 1 + G52], ['5C2', 1, -1], ['i', -1, -3], ['2S10³', -1, -1 - G5], ['2S10', -1, -1 - G52], ['5σd', -1, 1]],
    irreps: { A1g: [1, 1, 1, 1, 1, 1, 1, 1], A2g: [1, 1, 1, -1, 1, 1, 1, -1], E1g: [2, G5, G52, 0, 2, G5, G52, 0], E2g: [2, G52, G5, 0, 2, G52, G5, 0] } },
  D6h: { gens: [Rz(Math.PI / 3), C2X, INV],
    cols: [['E', 1, 3], ['2C6', 1, 2], ['2C3', 1, 0], ['C2', 1, -1, 'z+'], ["3C2'", 1, -1, 'at0'], ["3C2''", 1, -1, 'at30'], ['i', -1, -3], ['2S3', -1, -2], ['2S6', -1, 0], ['σh', -1, 1, 'z-'], ['3σd', -1, 1, 'at30'], ['3σv', -1, 1, 'at0']],
    irreps: { A1g: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], A2g: [1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, -1],
      B1g: [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1], B2g: [1, -1, 1, -1, -1, 1, 1, -1, 1, -1, -1, 1],
      E1g: [2, 1, -1, -2, 0, 0, 2, 1, -1, -2, 0, 0], E2g: [2, -1, -1, 2, 0, 0, 2, -1, -1, 2, 0, 0],
      A1u: [1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1], A2u: [1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1, 1],
      B1u: [1, -1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 1], B2u: [1, -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1],
      E1u: [2, 1, -1, -2, 0, 0, -2, -1, 1, 2, 0, 0], E2u: [2, -1, -1, 2, 0, 0, -2, 1, 1, -2, 0, 0] } },
  Oh: { gens: [Rz(Math.PI / 2), [0, 0, 1, 1, 0, 0, 0, 1, 0], INV],
    cols: [['E', 1, 3], ['8C3', 1, 0], ['6C2', 1, -1, 'off'], ['6C4', 1, 1], ['3C2', 1, -1, 'diag'], ['i', -1, -3], ['6S4', -1, -1], ['8S6', -1, 0], ['3σh', -1, 1, 'diag'], ['6σd', -1, 1, 'off']],
    irreps: { A1g: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], A2g: [1, 1, -1, -1, 1, 1, -1, 1, 1, -1], Eg: [2, -1, 0, 0, 2, 2, 0, -1, 2, 0],
      T1g: [3, 0, -1, 1, -1, 3, 1, 0, -1, -1], T2g: [3, 0, 1, -1, -1, 3, -1, 0, -1, 1] } },
  Ih: { gens: [[0, 0, 1, 1, 0, 0, 0, 1, 0], rot([0, 1, PHI], 2 * Math.PI / 5), INV],
    cols: [['E', 1, 3], ['12C5', 1, PHI], ['12C5²', 1, PSI], ['20C3', 1, 0], ['15C2', 1, -1], ['i', -1, -3], ['12S10', -1, -PSI], ['12S10³', -1, -PHI], ['20S6', -1, 0], ['15σ', -1, 1]],
    irreps: { Ag: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], T1g: [3, PHI, PSI, 0, -1, 3, PSI, PHI, 0, -1], T2g: [3, PSI, PHI, 0, -1, 3, PHI, PSI, 0, -1],
      Gg: [4, -1, -1, 1, 0, 4, -1, -1, 1, 0], Hg: [5, 0, 0, -1, 1, 5, 0, 0, -1, 1] } },
};
/* the centrosymmetric tables whose u half is the g half with the improper columns negated: written once */
for (const g of ['D5d', 'Oh', 'Ih']) {
  const ir = GROUPS[g].irreps, half = GROUPS[g].cols.length / 2;
  for (const [k, row] of Object.entries({ ...ir })) ir[k.replace(/g$/, 'u')] = [...row.slice(0, half), ...neg(row.slice(half))];
}
/** the axis conventions, one sentence per group (the frame a C₂v or D₂h label is true in) */
export const CONVENTION = {
  C1: 'no symmetry beyond the identity',
  Cs: 'z ⟂ the mirror plane; a′ even, a″ odd under it',
  C2: 'z = the C₂ axis',
  C2h: 'z = the C₂ axis, σh ⟂ z',
  C2v: 'Mulliken 1955: z = the C₂ axis, x ⟂ the molecular plane (b₁ odd under σ(yz))',
  C3v: 'z = the C₃ axis, σv(xz) contains atom 1',
  D2h: 'Mulliken 1955: z along the C=C bond, x ⟂ the molecular plane',
  D3h: 'z = the C₃ axis, x along one C₂ (through a ligand)',
  D3d: 'z = the C₃ axis',
  Td: 'x, y, z = the three S₄ axes',
  D5h: 'z = the C₅ axis, x along one C₂', D5d: 'z = the C₅ axis, x along one C₂',
  D6h: "z = the C₆ axis, x through carbon 0: C₂′ and σv through the atoms, C₂″ and σd through the bond midpoints",
  Oh: 'x, y, z = the three C₄ axes', Ih: 'x, y, z = three C₂ axes',
  Dinfh: 'z = the molecular axis; λ, ± and g/u are independent of x and y', Cinfv: 'z = the molecular axis; λ and ± are independent of x and y',
};
/** the label under the other common axis convention — stored, not hidden (names plan §5) */
const ALIAS = {
  C2v: [{ frame: 'x and y exchanged: x in the molecular plane', map: { B1: 'B2', B2: 'B1' } }],
  D2h: [{ frame: 'x along C=C, z ⟂ the plane', map: { B1g: 'B3g', B3g: 'B1g', B1u: 'B3u', B3u: 'B1u' } },
    { frame: 'y along C=C, z ⟂ the plane', map: { B1g: 'B2g', B2g: 'B3g', B3g: 'B1g', B1u: 'B2u', B2u: 'B3u', B3u: 'B1u' } }],
  D6h: [{ frame: "C₂′ through the bond midpoints (b₁ ↔ b₂)", map: { B1g: 'B2g', B2g: 'B1g', B1u: 'B2u', B2u: 'B1u' } }],
};
export const GROUP_IDS = [...Object.keys(GROUPS), 'Dinfh', 'Cinfv'];

/** the operations of a finite group in its own frame, each with its column: [{ R, col }] */
const opsCache = new Map();
export function operations(group) {
  if (opsCache.has(group)) return opsCache.get(group);
  const G = GROUPS[group]; if (!G) throw new Error(`names: no table for '${group}'`);
  const ops = closure(G.gens).map((R) => {
    const d = Math.sign(det3(R)), t = R[0] + R[4] + R[8];
    const col = G.cols.findIndex(([, cd, ct, test]) => cd === d && Math.abs(ct - t) < 1e-6 && (!test || T[test](R)));
    if (col < 0) throw new Error(`names: ${group} has an operation (det ${d}, trace ${t.toFixed(4)}) no column claims`);
    return { R, col };
  });
  opsCache.set(group, ops); return ops;
}
/** SELF-TEST of one table: orthogonality of rows and columns, Σ dim² = h, #irreps = #classes, the vector rep whole */
export function selfTest(group) {
  const G = GROUPS[group], ops = operations(group), h = ops.length, names = Object.keys(G.irreps);
  const size = G.cols.map((_, c) => ops.filter((o) => o.col === c).length);
  let worst = 0;
  for (const a of names) for (const b of names) {
    let s = 0; size.forEach((n, c) => { s += n * G.irreps[a][c] * G.irreps[b][c]; });
    worst = Math.max(worst, Math.abs(s - (a === b ? h : 0)));
  }
  size.forEach((nc, c) => size.forEach((_, d) => { let s = 0; for (const a of names) s += G.irreps[a][c] * G.irreps[a][d]; worst = Math.max(worst, Math.abs(s - (c === d ? h / nc : 0))); }));
  const dim2 = names.reduce((s, a) => s + G.irreps[a][0] ** 2, 0);
  const vec = {}; let vecResid = 0;
  for (const a of names) { let s = 0; for (const o of ops) s += (o.R[0] + o.R[4] + o.R[8]) * G.irreps[a][o.col]; const m = s / h; vecResid = Math.max(vecResid, Math.abs(m - Math.round(m))); if (Math.round(m)) vec[a] = Math.round(m); }
  const ok = worst < 1e-9 && dim2 === h && names.length === G.cols.length && size.every((n) => n > 0) && vecResid < 1e-9;
  return { group, order: h, classes: G.cols.length, sizes: size, irreps: names.length, sumDimSquared: dim2, worstOrthogonalityDefect: worst, vector: vec, ok };
}

/* ── THE FRAME AND THE FRAMEWORK CHECK ────────────────────────────────────────────────────────────────────────── */
const P = (a) => [a.x, a.y, a.z];
function chargeCentre(atoms) { const s = [0, 0, 0]; let Z = 0; for (const a of atoms) { s[0] += a.Z * a.x; s[1] += a.Z * a.y; s[2] += a.Z * a.z; Z += a.Z; } return [s[0] / Z, s[1] / Z, s[2] / Z]; }
/** an axis spec → a lab vector: [x, y, z], or { atom: k } (from the centre of nuclear charge toward atom k) */
const axisOf = (spec, atoms, c) => (Array.isArray(spec) ? spec : (() => { const a = P(atoms[spec.atom]); return [a[0] - c[0], a[1] - c[1], a[2] - c[2]]; })());
/** the symmetry frame's axes in lab coordinates, the columns of F (lab = F · sym) */
export function frameOf(atoms, frame = {}) {
  const c = chargeCentre(atoms), z = unit(axisOf(frame.z || [0, 0, 1], atoms, c)), x0 = axisOf(frame.x || [1, 0, 0], atoms, c);
  const x = unit(x0.map((v, i) => v - dot(x0, z) * z[i])), y = cross(z, x);
  return { c, x, y, z, F: [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]] };
}
/** where R sends every atom: { perm, worst (bohr), bijective } */
function framework(atoms, c, R) {
  const perm = [], used = new Set(); let worst = 0;
  for (const a of atoms) {
    const d = [a.x - c[0], a.y - c[1], a.z - c[2]], r = [c[0] + R[0] * d[0] + R[1] * d[1] + R[2] * d[2], c[1] + R[3] * d[0] + R[4] * d[1] + R[5] * d[2], c[2] + R[6] * d[0] + R[7] * d[1] + R[8] * d[2]];
    let best = -1, bd = Infinity;
    atoms.forEach((b, ib) => { if (b.Z !== a.Z) return; const e = Math.hypot(b.x - r[0], b.y - r[1], b.z - r[2]); if (e < bd) { bd = e; best = ib; } });
    perm.push(best); used.add(best); worst = Math.max(worst, bd);
  }
  return { perm, worst, bijective: used.size === atoms.length };
}

/* ── THE AO REPRESENTATION, SPARSE: column a of D(R) as [(row, value)…].  c → D c.  p: D[(B,j),(A,i)] = R_ji.
 * Cartesian d: the monomial x_a x_b goes to Σ_jk R_ja R_kb x_j x_k, and md.js normalises every component to unit
 * self-overlap, so on the normalised functions D = N⁻¹ Sym²(R) N with N ∝ 1/rdOf (axial √3 below mixed). ─────── */
const DC = [[0, 0], [0, 1], [0, 2], [1, 1], [1, 2], [2, 2]];   // xx xy xz yy yz zz — md.js's component order
const DN = DC.map(([a, b]) => (a === b ? Math.sqrt(3) : 1));  // ∝ rdOf: the axial self-overlap is 3× the mixed
function aoRep(basis, perm, R) {
  const cols = new Array(basis.n), byAtom = [];
  for (const sh of basis.shells) (byAtom[sh.atom] ??= []).push(sh);
  byAtom.forEach((list, A) => list.forEach((sh, p) => {
    const img = byAtom[perm[A]][p];
    if (!img || img.l !== sh.l) throw new Error('aoRep: the image atom has a different shell list');
    if (sh.l === 0) cols[sh.bfs[0].idx] = [[img.bfs[0].idx, 1]];
    else if (sh.l === 1) for (let i = 0; i < 3; i++) cols[sh.bfs[i].idx] = [0, 1, 2].map((j) => [img.bfs[j].idx, R[j * 3 + i]]);
    else if (sh.l === 2) DC.forEach(([a, b], s) => {
      cols[sh.bfs[s].idx] = DC.map(([j, k], t) => [img.bfs[t].idx, (j === k ? R[j * 3 + a] * R[j * 3 + b] : R[j * 3 + a] * R[k * 3 + b] + R[k * 3 + a] * R[j * 3 + b]) * DN[t] / DN[s]]);
    });
    else throw new Error(`aoRep: l = ${sh.l} is beyond this engine`);
  }));
  const start = new Int32Array(basis.n + 1), row = [], val = [];
  cols.forEach((c, a) => { for (const [i, v] of c) if (v !== 0) { row.push(i); val.push(v); } start[a + 1] = row.length; });
  return { start, row: Int32Array.from(row), val: Float64Array.from(val) };
}
/** max |DᵀSD − S|: the acceptance test of one operation's AO representation */
function overlapDefect({ start, row, val }, S, n) {
  let worst = 0;
  for (let a = 0; a < n; a++) for (let b = a; b < n; b++) {
    let s = 0;
    for (let p = start[a]; p < start[a + 1]; p++) { const Si = row[p] * n; let t = 0; for (let q = start[b]; q < start[b + 1]; q++) t += S[Si + row[q]] * val[q]; s += val[p] * t; }
    const d = Math.abs(s - S[a * n + b]); if (d > worst) worst = d;
  }
  return worst;
}
/** THE SYMMETRY CERTIFICATE (0.6.1 F2): ε_g = max|M(g)ᵀ SDS M(g) − SDS| / max|SDS| per operation of a declared group → [{ R, col, name, eps }], [] for
    C1 or no table.  S never leaves the worker: it is rebuilt from the wire's field shells (md.js's Hermite overlaps); DᵀSD = S accepts each M(g). */
export function symmetryDefects({ atoms, shells, D, group, frame }) {
  if (!GROUPS[group] || group === 'C1') return [];
  const n = shells.reduce((s, sh) => s + sh.nc, 0), S = new Float64Array(n * n), dist = (a, c) => Math.hypot(a.x - c[0], a.y - c[1], a.z - c[2]);
  const basis = { n, shells: shells.map((sh) => ({ atom: atoms.reduce((b, a, i) => (dist(a, sh.center) < dist(atoms[b], sh.center) ? i : b), 0), l: sh.l, bfs: Array.from({ length: sh.nc }, (_, i) => ({ idx: sh.ao + i })) })) };
  for (const a of shells) for (const b of shells) for (const p of a.prims) for (const q of b.prims) {
    const e = [0, 1, 2].map((x) => etable(a.l, b.l, p.alpha, q.alpha, a.center[x], b.center[x])), pre = (Math.PI / (p.alpha + q.alpha)) ** 1.5, E0 = (x, i, j) => e[x].E[e[x].at(i, j, 0)];
    for (let i = 0; i < a.nc; i++) for (let j = 0; j < b.nc; j++) { const u = CART[a.l][i], v = CART[b.l][j]; S[(a.ao + i) * n + b.ao + j] += p.w[i] * q.w[j] * pre * E0(0, u[0], v[0]) * E0(1, u[1], v[1]) * E0(2, u[2], v[2]); } }
  const mul = (A, B) => { const C = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const v = A[i * n + k]; if (v) for (let j = 0; j < n; j++) C[i * n + j] += v * B[k * n + j]; } return C; };
  const W = mul(mul(S, D), S), top = W.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-300), fr = frameOf(atoms, frame);
  return operations(group).map(({ R, col }) => {
    const Rl = mm3(fr.F, mm3(R, tp3(fr.F))), fw = framework(atoms, fr.c, Rl), M = aoRep(basis, fw.perm, Rl), name = GROUPS[group].cols[col][0];
    if (fw.worst <= GEOM_TOL && overlapDefect(M, S, n) > 1e-10) throw new Error(`${name}: DᵀSD ≠ S — the AO representation is not a symmetry of the overlap`); return { R, col, name, eps: overlapDefect(M, W, n) / top };
  });
}
/* ── THE CORE ─────────────────────────────────────────────────────────────────────────────────────────────────
 * Frozen-core electrons per element: He for Li–Ne, Ne for Na–Ar, Ar for K–Ca, Ar for Sc–Zn (3d is valence), Ar + 3d¹⁰
 * for Ga–Kr.  coreCount(atoms) is the number of core ORBITALS (doubly occupied), what the ladder folds. */
const coreElectrons = (Z) => (Z <= 2 ? 0 : Z <= 10 ? 2 : Z <= 18 ? 10 : Z <= 30 ? 18 : Z <= 36 ? 28 : 36);
export const coreCount = (atoms) => atoms.reduce((s, a) => s + coreElectrons(a.Z), 0) / 2;

/* ── THE FRONTIER, BY LEVEL ───────────────────────────────────────────────────────────────────────────────── */
/** the frontier word for an offset in LEVELS from the HOMO level (0 HOMO, 1 LUMO, −1 HOMO−1, 2 LUMO+1) */
export const frontierName = (d) => (d === 0 ? 'HOMO' : d === 1 ? 'LUMO' : d < 0 ? 'HOMO−' + (-d) : 'LUMO+' + (d - 1));

/* ── THE LABELLING ──────────────────────────────────────────────────────────────────────────────────────────── */
const ENERGY_TOL = 2e-10;     // Eh: a level (PROBE: widest true degeneracy 3.3e-13, narrowest real gap 1.6e-7)
const RESIDUAL_TOL = 1e-6;    // a multiplicity this far from an integer is not one irrep
const GEOM_TOL = 1e-6;        // bohr: the default framework tolerance; a record may state a looser one
const APPROX_RESIDUAL_TOL = 0.05;   // when the framework is symmetric only to its stated geomTol (furan, pyridine)
const ANG = [0.7, 1.9, 2.9], ANG_CHECK = 0.3;
const LIN = ['σ', 'π', 'δ'];
/** (n_σ, n_π, n_δ) from χ at the three angles: χ(φ) = n_σ + 2 n_π cos φ + 2 n_δ cos 2φ */
function lambdaFit(x) {
  const A = ANG.map((p) => [1, 2 * Math.cos(p), 2 * Math.cos(2 * p)]);
  const d = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const D0 = d(A);
  return [0, 1, 2].map((j) => d(A.map((row, i) => row.map((v, k) => (k === j ? x[i] : v)))) / D0);
}
const lambdaAt = (n, p) => n[0] + 2 * n[1] * Math.cos(p) + 2 * n[2] * Math.cos(2 * p);

/**
 * name the orbitals of one closed-shell solve.
 * input: { atoms (bohr), S, C (row-major C[i*n+k]), eps, nocc, basis ({ n, shells }), converged }
 * sym:   { group, frame?, geomTol? } — the library's declaration
 * →      { group, frame, tolerance, reliable, reason, config, mos: [{ k, irrep, count, dim, member, label, frontier,
 *          residual, aliases }], levels, aliases, approximate, ms }
 */
export function nameOrbitals(input, sym, opts = {}) {
  const r = nameWith(input, sym, opts);
  if (r.reliable || !sym || !sym.fallback) return r;
  /* an APPROXIMATE group that cannot name every level falls back to the exact subgroup the record declares, and says so */
  const f = nameWith(input, sym.fallback, opts);
  f.downgraded = `${sym.group} → ${sym.fallback.group}: ${r.reason}`; f.ms = +(f.ms + r.ms).toFixed(2);
  return f;
}
function nameWith(input, sym, { energyTol = ENERGY_TOL } = {}) {
  const t0 = (globalThis.performance || Date).now();
  const { atoms, S, C, nocc } = input, eps = Array.from(input.eps), n = eps.length, group = sym && sym.group;
  const geomTol = (sym && sym.geomTol) || GEOM_TOL;
  const out = { group: group || null, frame: CONVENTION[group] || null, axes: null, tolerance: { energy: energyTol, geometric: geomTol },
    reliable: false, reason: null, approximate: null, config: null, mos: [], levels: [], aliases: [], ms: 0 };
  /* the levels and the frontier come first: they need no symmetry, and a refused record still shows HOMO by level */
  const ranges = clusterRanges(eps, energyTol);
  const homoLevel = ranges.findIndex(([s, e]) => s <= nocc - 1 && nocc - 1 < e);
  ranges.forEach(([s, e], li) => { for (let k = s; k < e; k++) out.mos.push({ k: k + 1, level: li, dim: e - s, member: e - s > 1 ? 'abcdefghijkl'[k - s] : null,
    frontier: frontierName(li - homoLevel), irrep: null, count: null, label: null, residual: null }); });
  const done = (reason) => { out.reason = reason; out.ms = +((globalThis.performance || Date).now() - t0).toFixed(2); return out; };
  if (!group) return done('no point group is declared for this molecule');
  if (group === 'C1') return done('C₁: no symmetry beyond the identity, so an orbital has only its index');
  if (!input.converged) return done('the SCF did not converge: a level is not a level until it has');
  if (!GROUPS[group] && group !== 'Dinfh' && group !== 'Cinfv') return done(`no table for the declared group '${group}'`);
  const fr = frameOf(atoms, sym.frame), F = fr.F, toLab = (R) => mm3(F, mm3(R, tp3(F)));
  out.axes = { x: fr.x, y: fr.y, z: fr.z, centre: fr.c };
  const linear = group === 'Dinfh' || group === 'Cinfv';
  let ops;
  if (linear) {
    const ph = [...ANG, ANG_CHECK];
    ops = [...ph.map((p) => ({ R: Rz(p), cls: 'C', phi: p })), { R: diag(1, -1, 1), cls: 'sv' }];
    if (group === 'Dinfh') ops.push(...ph.map((p) => ({ R: mm3(INV, Rz(p)), cls: 'iC', phi: p })));
  } else ops = operations(group).map((o) => ({ ...o }));
  /* every operation: a symmetry of the framework, then of S */
  let worstGeom = 0, worstS = 0;
  for (const o of ops) {
    const Rl = toLab(o.R), fw = framework(atoms, fr.c, Rl);
    if (!fw.bijective || fw.worst > geomTol) return done(`the declared ${group} is not a symmetry of this framework: an operation moves an atom ${fw.worst.toExponential(2)} bohr (tolerance ${geomTol} bohr)`);
    worstGeom = Math.max(worstGeom, fw.worst);
    try { o.D = aoRep(input.basis, fw.perm, Rl); } catch (e) { return done(String(e.message || e)); }
    worstS = Math.max(worstS, overlapDefect(o.D, S, n));
  }
  const exact = worstGeom <= GEOM_TOL, resTol = exact ? RESIDUAL_TOL : APPROX_RESIDUAL_TOL;
  out.verification = { operations: ops.length, frameworkBohr: worstGeom, overlap: worstS };
  if (exact && worstS > 1e-10) return done(`DᵀSD ≠ S by ${worstS.toExponential(2)}: the AO representation is not a symmetry of the overlap`);
  if (!exact) out.approximate = { geometryBohr: worstGeom, overlap: worstS, residualTolerance: resTol };
  /* the characters: SC = S C once, then χ(R) over a level = Σ_k (S C_k) · (D C_k) */
  const SC = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const s = S[i * n + j]; if (s === 0) continue; for (let k = 0; k < n; k++) SC[i * n + k] += s * C[j * n + k]; }
  /* w_k = C_kᵀ S D C_k per orbital, once per operation; a level's character is the sum over its members */
  for (const o of ops) {
    const { start, row, val } = o.D, w = o.w = new Float64Array(n);
    for (let a = 0; a < n; a++) for (let p = start[a]; p < start[a + 1]; p++) { const Ci = a * n, Si = row[p] * n, v = val[p]; for (let k = 0; k < n; k++) w[k] += SC[Si + k] * v * C[Ci + k]; }
  }
  const chiOf = (o, s0, e0) => { let t = 0; for (let k = s0; k < e0; k++) t += o.w[k]; return t; };
  const near = (x) => Math.abs(x - Math.round(x));
  const G = GROUPS[group], h = ops.length, counts = {};
  let worstRes = 0, refused = null;
  ranges.forEach(([s0, e0], li) => {
    const size = e0 - s0, lv = { level: li, start: s0 + 1, end: e0, size, eps: eps[s0], irrep: null, decomposition: '', residual: 0 };
    if (!linear) {
      const mult = {}, chi = ops.map((o) => chiOf(o, s0, e0)); let res = 0;
      for (const [g, row] of Object.entries(G.irreps)) { let s = 0; ops.forEach((o, j) => { s += chi[j] * row[o.col]; }); mult[g] = s / h; res = Math.max(res, near(s / h)); }
      const present = Object.entries(mult).map(([g, v]) => [g, Math.round(v)]).filter(([, v]) => v !== 0);
      lv.decomposition = present.map(([g, v]) => (v === 1 ? '' : v) + g).join(' + ');
      lv.residual = res;
      if (present.length === 1 && present[0][1] === 1 && G.irreps[present[0][0]][0] === size && res < resTol) lv.irrep = present[0][0];
    } else {
      const chi = ops.map((o) => chiOf(o, s0, e0)), nC = lambdaFit(chi.slice(0, 3)), sv = chi[4];
      let res = Math.max(...nC.map(near), Math.abs(chi[3] - lambdaAt(nC, ANG_CHECK)), near(sv));
      let par = null;
      if (group === 'Dinfh') { const dP = lambdaFit(chi.slice(5, 8)); res = Math.max(res, ...dP.map(near), Math.abs(chi[8] - lambdaAt(dP, ANG_CHECK))); par = dP.map(Math.round); }
      const nr = nC.map(Math.round), which = nr.findIndex((v) => v === 1), dimOk = nr[0] + 2 * nr[1] + 2 * nr[2] === size;
      lv.residual = res;
      lv.decomposition = nr.map((v, j) => (v ? (v === 1 ? '' : v) + LIN[j] : '')).filter(Boolean).join(' + ');
      if (dimOk && res < resTol && nr.filter((v) => v).length === 1 && which >= 0) {
        const p = par ? (par[which] === 1 ? 'g' : par[which] === -1 ? 'u' : null) : '';
        const minus = which === 0 && Math.round(sv) === -1 ? '⁻' : '';
        if (p !== null) lv.irrep = LIN[which] + p + minus;
      }
    }
    worstRes = Math.max(worstRes, lv.residual);
    if (lv.irrep) { lv.count = counts[lv.irrep] = (counts[lv.irrep] || 0) + 1; lv.label = lv.count + low(lv.irrep); }
    else if (!refused) refused = lv;
    out.levels.push(lv);
  });
  out.residual = worstRes;
  if (refused) return done(`level ${refused.start}${refused.size > 1 ? '–' + refused.end : ''} (ε = ${refused.eps.toFixed(6)} Eh) is ${refused.decomposition || 'no whole irrep'}, not one irrep of its own dimension (residual ${refused.residual.toExponential(2)}), so no counted label above it can be trusted`);
  for (const mo of out.mos) { const lv = out.levels[mo.level]; Object.assign(mo, { irrep: lv.irrep, count: lv.count, label: lv.label, residual: lv.residual }); }
  for (const al of ALIAS[group] || []) {
    const c2 = {}, per = out.levels.map((lv) => { const g = al.map[lv.irrep] || lv.irrep; return (c2[g] = (c2[g] || 0) + 1) + low(g); });
    out.aliases.push({ frame: al.frame, labels: per });
    for (const mo of out.mos) (mo.aliases ??= []).push(per[mo.level]);
  }
  let config = '';
  for (const lv of out.levels) { const occ = 2 * Math.max(0, Math.min(lv.end, nocc) - (lv.start - 1)); if (occ) config += `(${lv.label})${sup(occ)}`; }
  out.config = config; out.reliable = true;
  return done(null);
}
/* orbitals are lower case, states upper case (Mulliken) */
const low = (g) => g.replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/''/g, '″').replace(/'/g, '′');
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUBD = '₀₁₂₃₄₅₆₇₈₉';
const sup = (k) => String(k).split('').map((d) => SUP[+d]).join('');
const subDigits = (s) => s.replace(/\d/g, (d) => SUBD[+d]);

/* ── THE FORMS ──────────────────────────────────────────────────────────────────────────────────────────────── */
const GREEK = { σ: ['\\sigma', 's', 'sigma'], π: ['\\pi', 'p', 'pi'], δ: ['\\delta', 'd', 'delta'], φ: ['\\phi', 'f', 'phi'] };
const SAY = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const sayNum = (k) => SAY[k] ?? String(k);
/** a counted label ('3σg', '1e1g', "2a1'", '5σ⁻') split for writing: { count, body, sub, mark } */
function parts(label) {
  const m = /^(\d+)([a-zσπδφ])([0-9]*[gu]?)(['′″⁻+]*)$/.exec(String(label).replace(/''/g, '″').replace(/'/g, '′'));
  if (!m) return { count: '', body: String(label), sub: '', mark: '' };
  return { count: m[1], body: m[2], sub: m[3], mark: m[4] };
}
/**
 * every written form of one orbital name.  label: '3σg' | { label, member } | a names mo record.
 * → { plain, typeset, latex, ascii, speech, parts }
 */
export function forms(label, member = null) {
  if (label && typeof label === 'object') { member = label.member ?? member; label = label.label; }
  if (!label) return null;
  const p = parts(label), mem = member ? ` (${member})` : '';
  const greek = GREEK[p.body];
  const subTyped = /^\d/.test(p.sub) ? subDigits(p.sub.replace(/[gu]$/, '')) + p.sub.replace(/^\d+/, '') : (p.sub ? '_' + p.sub : '');
  const markTex = p.mark.replace(/′/g, '\\prime').replace(/″/g, '\\prime\\prime').replace(/⁻/g, '-');
  const latexCore = `${p.count}${greek ? greek[0] : p.body}${p.sub ? `_{${p.sub}}` : ''}${markTex || member ? `^{${markTex}${member ? `(${member})` : ''}}` : ''}`;
  const asciiMark = p.mark.replace(/′/g, "'").replace(/″/g, "''").replace(/⁻/g, '-');
  const sayMark = p.mark.replace(/″/g, ' double prime').replace(/′/g, ' prime').replace(/⁻/g, ' minus');
  return {
    plain: `${p.count}${p.body}${p.sub}${p.mark}${mem}`,
    typeset: `${p.count}${p.body}${subTyped}${p.mark}${mem}`,
    latex: `$${latexCore}$`,
    ascii: `${p.count}${greek ? greek[1] : p.body}${p.sub}${asciiMark}${member ? '_' + member : ''}`,
    speech: [sayNum(+p.count), greek ? greek[2] : p.body, ...p.sub.split('').map((c) => (/\d/.test(c) ? sayNum(+c) : c))].join(' ') + sayMark + (member ? `, component ${member}` : ''),
    parts: p,
  };
}
/**
 * THE ONE ORBITAL NAME every surface reads (MO-REGISTRY's rungs and lanes, MOLECULES' ORBITAL knob, the copy):
 * orbital k (0-based) of a names record → '1b1 · HOMO', '3a1', '1e1g (a) · HOMO' in `form`; with no name (refused, C₁,
 * unconverged, no record) the frontier word BY LEVEL when the record has levels, by index otherwise.
 */
export function orbitalName(names, k, nocc, form = 'plain') {
  const mo = names && names.mos ? names.mos[k] || null : null;
  const fr = mo ? mo.frontier : frontierName(k - (nocc - 1));
  if (!mo || !mo.label) return fr;
  const f = forms(mo)[form];
  return /^(HOMO|LUMO)$/.test(fr) ? f + ' · ' + fr : f;
}

/** a singlet excited STATE of the molecule (MO-REGISTRY's STATES ladder): S₀, S₄ + a lane tag ('x', 'a') — states are
    upper case, numbered by LEVEL so the lanes of one degenerate level share a number */
export const stateName = (level, tag = '') => 'S' + subDigits(String(level)) + tag;

/* ── THE ATOMS: one n l m name, four forms (hydrogen.js's label, hamiltonian.js's labelOf, latex-state's latexName) ── */
export const L_LETTERS = 'spdfghik';   // the l letters (j skipped): the one table every n l name in the app reads
/** { n, l, m } → { plain '2p₋1', typeset '2p₋₁', latex '2p_{-1}', ascii '2p-1', speech 'two p minus one' } */
export function atomForms({ n, l, m }) {
  return {
    plain: `${n}${L_LETTERS[l]}${m >= 0 ? '₊' : '₋'}${Math.abs(m)}`,
    typeset: `${n}${L_LETTERS[l]}${String(m).split('').map((c) => (c === '-' ? '₋' : SUBD[+c])).join('')}`,
    latex: `${n}${L_LETTERS[l]}_{${m}}`,
    ascii: `${n}${L_LETTERS[l]}${m}`,
    speech: `${sayNum(n)} ${L_LETTERS[l]} ${m < 0 ? 'minus ' : ''}${sayNum(Math.abs(m))}`,
  };
}

/* ── TRUE HUMAN INFORMATION ──────────────────────────────────────────────────────────────────────────────────
 * DERIVED (diatomics): the textbook LCAO name and the character from the irrep and the dominant AO composition.
 * CURATED (the ten probed anchors): the measured vertical ionisation energy beside Koopmans' −ε.  Never computed. */
const EV = 27.211386245988;
/**
 * the character of each orbital: core for every molecule (the frozen-core count), and for a diatomic the LCAO name
 * (σ(2s), σ*(2p), π(2p), n(F 2p)…) from the irrep, the Mulliken weight on each atom and the overlap population.
 * → [{ kind: 'core'|'σ'|'π'|'lone pair'|null, lcao, source: 'derived' }] per MO
 */
export function characters(input, names) {
  const { atoms, S, C, basis } = input, n = names.mos.length, nCore = coreCount(atoms), out = [];
  const shellOf = (i) => { const o = basis.order ? basis.order[i] : ''; const m = /\s(\d+[spd])/.exec(o); return m ? m[1] : '?'; };
  for (let k = 0; k < n; k++) {
    const mo = names.mos[k];
    if (k < nCore) { out.push({ kind: 'core', lcao: null, source: 'derived' }); continue; }
    if (atoms.length !== 2 || !mo.irrep) { out.push({ kind: null, lcao: null, source: null }); continue; }
    const wAtom = [0, 0], wShell = {}; let ov = 0;
    for (let i = 0; i < n; i++) {
      let gi = 0; for (let j = 0; j < n; j++) gi += S[i * n + j] * C[j * n + k];
      const w = C[i * n + k] * gi, A = basis.bfs[i].atom;
      wAtom[A] += w; wShell[shellOf(i)] = (wShell[shellOf(i)] || 0) + w;
      for (let j = 0; j < n; j++) if (basis.bfs[j].atom !== A) ov += C[i * n + k] * S[i * n + j] * C[j * n + k];
    }
    const shell = Object.entries(wShell).sort((a, b) => b[1] - a[1])[0][0].replace(/(\d)([spd])/, '$1$2');
    const lam = mo.irrep[0], one = Math.max(...wAtom) > 0.8;
    const anti = ov < -1e-3, el = ELEMENTS[atoms[wAtom[0] > wAtom[1] ? 0 : 1].Z] || '?';
    const kind = one && Math.abs(ov) < 0.1 ? 'lone pair' : lam;
    const lcao = kind === 'lone pair' ? `n(${el} ${shell})` : `${lam}${anti ? '*' : ''}(${shell})`;
    out.push({ kind, lcao, bonding: kind === 'lone pair' ? 'non-bonding' : anti ? 'antibonding' : 'bonding', source: 'derived' });
  }
  return out;
}
const ELEMENTS = [null, 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'];
/**
 * CURATED vertical ionisation energies (eV) of the ten probed anchors, by orbital label, STO-3G frame.  The values are
 * the standard HeI photoelectron band maxima as tabulated by NIST (CCCBDB, SRD 101, and the WebBook); the primary
 * measurement is named per molecule.  UNCHECKED against the live tables in this build (S1-NAMES-BUILD.md): the legal
 * reading against research/…/LEGAL-PROVENANCE and a value-by-value check precede any store build.
 */
export const CURATED_IE = {
  H2O: { source: 'Kimura et al., Handbook of HeI Photoelectron Spectra (1981)', ev: { '1b1': 12.62, '3a1': 14.74, '1b2': 18.51 } },
  NH3: { source: 'Kimura et al. (1981)', ev: { '3a1': 10.85 } },
  CH4: { source: 'Kimura et al. (1981)', ev: { '1t2': 14.4 } },
  N2: { source: 'Turner et al., Molecular Photoelectron Spectroscopy (1970)', ev: { '3σg': 15.58, '1πu': 16.93, '2σu': 18.75 } },
  CO: { source: 'Turner et al. (1970)', ev: { '5σ': 14.01, '1π': 16.91, '4σ': 19.72 } },
  HF: { source: 'Kimura et al. (1981)', ev: { '1π': 16.12 } },
  CO2: { source: 'Turner et al. (1970)', ev: { '1πg': 13.78, '1πu': 17.59, '3σu': 18.08, '4σg': 19.40 } },
  C2H4: { source: 'Kimura et al. (1981)', ev: { '1b3u': 10.51 } },
  H2CO: { source: 'Kimura et al. (1981)', ev: { '2b2': 10.88 } },
  C6H6: { source: 'Kimura et al. (1981)', ev: { '1e1g': 9.24 } },
};
/** the curated IE for one named orbital of a library molecule, with Koopmans' −ε beside it; null when there is none */
export function ionisation(id, mo, eps) {
  const c = CURATED_IE[id]; const ev = c && mo && mo.label ? c.ev[mo.label] : undefined;
  if (ev === undefined) return null;
  return { ev, koopmansEv: -eps * EV, gapEv: -eps * EV - ev, source: c.source, tag: 'curated' };
}

/** THE ONE CALL a solver site makes (the worker's ensureSolve, chemview's frame-thread fallback): name a moleculeRHF
    result against its library declaration, with each orbital's character attached; `ms` is the whole cost. */
export function namesOf(sol, atoms, symmetry) {
  const t0 = (globalThis.performance || Date).now();
  const input = { atoms, S: sol.integrals.S, C: sol.C, eps: sol.orbitalEnergies, nocc: sol.nocc, basis: sol.basis, converged: sol.converged };
  const r = nameOrbitals(input, symmetry), ch = characters(input, r);
  r.mos.forEach((m, i) => { m.character = ch[i]; });
  r.core = Math.min(coreCount(atoms), sol.nocc);
  delete r.axes;
  r.ms = +((globalThis.performance || Date).now() - t0).toFixed(2);
  return r;
}
