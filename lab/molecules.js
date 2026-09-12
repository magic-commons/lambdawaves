/* molecules.js — THE LIBRARY: every molecule the CHEMISTRY window can offer, at a geometry with a named source.
 *
 * WHAT THIS FILE IS.  A table of closed-shell species, each with (a) a pinned geometry in ångström, (b) the SOURCE of
 * that geometry — a NIST CCCBDB experimental value, a named gas-phase measurement, or, for the three species that
 * have no measured structure, this repository's own RHF/STO-3G optimum, said in those words — (c) the charge, and
 * (d) the counts the engine will find (Cartesian AOs, shells, electrons).  lab/chemview.js reads it for the MOLECULE
 * dropdown; research/h2o-2026-09-11/scratch/fix-molecules.py reads it to write the PySCF oracle; tests/molecules.
 * test.mjs holds every count against lab/md.js's own basis and every energy against that oracle.
 *
 * RHF IS CLOSED-SHELL ONLY, so every entry here is a closed-shell singlet and the electron count is even.  The
 * famous open-shell species CANNOT be in this list and are not:
 *   · Fe (⁵D, 3d⁶4s²) and every bare transition-metal atom — Josh asked for "large atoms"; the heavy atoms here are
 *     in closed-shell HYDRIDES and halides (CuH, ZnH₂, GeH₄, AsH₃, H₂Se, HBr, Br₂), which is how a minimal-basis
 *     RHF can carry Z up to 35 honestly.
 *   · O₂ (³Σg⁻) and NO (²Π) — the two textbook open shells.  Both need ROHF or UHF, which this engine does not have.
 *     An RHF number for either would be a closed-shell singlet that is not the molecule's ground state.
 * lab/rhf-molecule.js refuses an odd electron count outright; this file's own gate refuses one too.
 *
 * THE GEOMETRIES ARE FIXED, NOT OPTIMISED.  Nothing here is the RHF/STO-3G minimum (except the three that say they
 * are).  A fixed experimental geometry is the right thing for a window that shows a density and a spectrum: it is
 * the molecule as measured, and the model's error stays in the model rather than being hidden in a re-optimised
 * bond length.  Where a measured structure gives only part of the parameter set, the IDEALISATION is stated in the
 * entry's `source` — "methyl ideally tetrahedral", "H on the external bisector" — so the departure is visible.
 *
 * THE CAP IS BENZENE (Josh: "Have Benzene be the size cap … Benzene was probably the longest I could tolerate
 * waiting").  `COST` below is a two-term linear model of `moleculeRHF`'s wall time, fitted to measured node timings;
 * every entry carries `predictedMs` from it, and an entry whose prediction exceeds benzene's is listed but DISABLED
 * with the reason.  The model is a prediction and is labelled as one — the status line always shows the real timing.
 */
import { ANGSTROM } from './md.js';

/* ── the vendored STO-3G shell structure, per element ──────────────────────────────────────────────────────────
 * The angular momenta of lab/vendor/bse/sto-3g-v1.json's shells, sorted as lab/md.js sorts them (per atom, by l).
 * Three primitives per shell throughout — that is what "STO-3G" means, and the record has no exception in 1–36.
 * tests/molecules.test.mjs holds every count this table implies against basisFrom's own answer, so it is a CACHE
 * of the record and never a second opinion about it. */
const SHELL_LS = (Z) => (Z <= 2 ? [0] : Z <= 10 ? [0, 0, 1] : Z <= 18 ? [0, 0, 0, 1, 1]
  : Z <= 20 ? [0, 0, 0, 0, 1, 1, 1] : [0, 0, 0, 0, 1, 1, 1, 2]);
const WIDTH = [1, 3, 6];                                     // Cartesian components per l
export const PRIMITIVES = 3;                                 // per shell, every element of the vendored record
export const MAX_Z = 36;                                     // the record vendors H–Kr; Rb upward is not available

/* ── the geometry helpers.  Ångström throughout; z is the axis of every linear species ─────────────────────── */
const D = Math.PI / 180;
const at = (Z, x, y, z) => [Z, x, y, z];
/** A–B along z, A at the origin */
const diatomic = (Za, Zb, r) => [at(Za, 0, 0, 0), at(Zb, 0, 0, r)];
/** X–A–X linear (D∞h), A at the origin */
const linear3 = (Za, Zx, r) => [at(Za, 0, 0, 0), at(Zx, 0, 0, r), at(Zx, 0, 0, -r)];
/** A–B–C linear, B at the origin, A at −r1 and C at +r2 */
const linearABC = (Za, Zb, Zc, r1, r2) => [at(Zb, 0, 0, 0), at(Za, 0, 0, -r1), at(Zc, 0, 0, r2)];
/** X–A–X bent (C₂v) in the yz plane, A at the origin, the C₂ axis along +z */
const bent = (Za, Zx, r, thDeg) => { const h = thDeg / 2 * D;
  return [at(Za, 0, 0, 0), at(Zx, 0, r * Math.sin(h), -r * Math.cos(h)), at(Zx, 0, -r * Math.sin(h), -r * Math.cos(h))]; };
/** AX₄ tetrahedral (T_d), A at the origin, ligands on the cube diagonals at d = r/√3 */
const td = (Za, Zx, r) => { const d = r / Math.sqrt(3);
  return [at(Za, 0, 0, 0), at(Zx, d, d, d), at(Zx, d, -d, -d), at(Zx, -d, d, -d), at(Zx, -d, -d, d)]; };
/** AX₃ planar (D₃ₕ) in the xy plane, A at the origin */
const d3h = (Za, Zx, r) => { const out = [at(Za, 0, 0, 0)];
  for (let k = 0; k < 3; k++) { const t = k * 120 * D; out.push(at(Zx, r * Math.cos(t), r * Math.sin(t), 0)); }
  return out; };
/** AX₃ pyramidal (C₃ᵥ), A at the origin, the C₃ axis along +z, ligands below.  cos²β = (2 cos θ + 1)/3 from the
    X–A–X angle θ — the same identity ROUND 4 · OPUS §5 used to place NH₃'s hydrogens. */
const c3v = (Za, Zx, r, thDeg) => {
  const cb = Math.sqrt(Math.max(0, (2 * Math.cos(thDeg * D) + 1) / 3)), sb = Math.sqrt(Math.max(0, 1 - cb * cb));
  const out = [at(Za, 0, 0, 0)];
  for (let k = 0; k < 3; k++) { const t = k * 120 * D; out.push(at(Zx, r * sb * Math.cos(t), r * sb * Math.sin(t), -r * cb)); }
  return out; };
/** one planar (yz) Z-matrix step: Z at distance r from `from`, turned `ang`° (sign `sg`) off the from→ref direction */
const grow = (Z, from, ref, r, ang, sg = 1) => {
  const dy = ref[2] - from[2], dz = ref[3] - from[3], n = Math.hypot(dy, dz) || 1;
  const a = sg * ang * D, uy = dy / n, uz = dz / n;
  return at(Z, 0, from[2] + r * (uy * Math.cos(a) - uz * Math.sin(a)), from[3] + r * (uy * Math.sin(a) + uz * Math.cos(a)));
};
/** a planar ring in the xy plane from its bond lengths and INTERIOR angles: walk the polygon, closing on itself.
    The closure residual is returned so tests/molecules.test.mjs can refuse a parameter set that does not close. */
function ringWalk(bonds, interior) {
  const n = bonds.length, pts = [[0, 0]];
  let dir = 0;                                               // the heading, in radians
  for (let k = 0; k < n - 1; k++) {
    const p = pts[k];
    pts.push([p[0] + bonds[k] * Math.cos(dir), p[1] + bonds[k] * Math.sin(dir)]);
    dir += Math.PI - interior[(k + 1) % n] * D;               // the exterior turn at the vertex just placed
  }
  const p = pts[n - 1], close = [p[0] + bonds[n - 1] * Math.cos(dir), p[1] + bonds[n - 1] * Math.sin(dir)];
  const residual = Math.hypot(close[0] - pts[0][0], close[1] - pts[0][1]);
  let cx = 0, cy = 0; for (const q of pts) { cx += q[0] / n; cy += q[1] / n; }
  return { pts: pts.map(([x, y]) => [x - cx, y - cy]), residual };
}
/** the external bisector at ring vertex k, as a unit vector in the ring plane — where a ring H or substituent goes */
function bisector(pts, k) {
  const n = pts.length, a = pts[(k + n - 1) % n], b = pts[k], c = pts[(k + 1) % n];
  const u = [b[0] - a[0], b[1] - a[1]], v = [b[0] - c[0], b[1] - c[1]];
  const nu = Math.hypot(...u) || 1, nv = Math.hypot(...v) || 1;
  const w = [u[0] / nu + v[0] / nv, u[1] / nu + v[1] / nv], nw = Math.hypot(...w) || 1;
  return [w[0] / nw, w[1] / nw];
}

/* ── the eight pinned presets, byte-for-byte as lab/chemview.js had them ──────────────────────────────────────
 * tests/chem.browser-test.mjs, tests/rhf-molecules.test.mjs and lab/oracles/sto-3g-v1.json all pin these eight
 * energies, so these eight arrays are FROZEN: the numbers below are the literals the window shipped with. */
const ETHENE = (() => {                                      // C₂H₄ · r_CC 1.339, r_CH 1.087, ∠HCH 117.4°, the yz plane
  const d = 1.339 / 2, h = 117.4 / 2 * D, sy = 1.087 * Math.sin(h), sz = 1.087 * Math.cos(h);
  return [[6, 0, 0, d], [6, 0, 0, -d], [1, 0, sy, d + sz], [1, 0, -sy, d + sz], [1, 0, sy, -d - sz], [1, 0, -sy, -d - sz]];
})();
const BENZENE = (() => {                                     // C₆H₆ · carbons at kπ/3 radius 1.39, hydrogens at 2.48
  const out = [];
  for (let k = 0; k < 6; k++) { const t = k * Math.PI / 3; out.push([6, 1.39 * Math.cos(t), 1.39 * Math.sin(t), 0]); out.push([1, 2.48 * Math.cos(t), 2.48 * Math.sin(t), 0]); }
  return out;
})();

/* ── the built geometries ────────────────────────────────────────────────────────────────────────────────────── */
const ETHANE = (() => {                                      // D3d staggered; ∠CCH is measured from the C→C′ axis
  const d = 1.5351 / 2, r = 1.0940, b = (180 - 111.17) * D;  // b: the polar angle of C–H away from the other carbon
  const out = [at(6, 0, 0, d), at(6, 0, 0, -d)];
  for (let k = 0; k < 3; k++) { const t = k * 120 * D;
    out.push(at(1, r * Math.sin(b) * Math.cos(t), r * Math.sin(b) * Math.sin(t), d + r * Math.cos(b))); }
  for (let k = 0; k < 3; k++) { const t = (60 + k * 120) * D;
    out.push(at(1, r * Math.sin(b) * Math.cos(t), r * Math.sin(b) * Math.sin(t), -d - r * Math.cos(b))); }
  return out;
})();
const FORMALDEHYDE = (() => {                                // C2v in the yz plane; C at the origin, O along +z
  const h = 116.13 / 2 * D, r = 1.1161;
  return [at(6, 0, 0, 0), at(8, 0, 0, 1.2078), at(1, 0, r * Math.sin(h), -r * Math.cos(h)), at(1, 0, -r * Math.sin(h), -r * Math.cos(h))];
})();
const METHANOL = (() => {                                    // Cs; C at the origin, O along +z, O–H in the yz plane
  const rCO = 1.4246, rOH = 0.9451, rCH = 1.0936, aCOH = 108.53, aOCH = 109.471;
  const C = at(6, 0, 0, 0), O = at(8, 0, 0, rCO);
  const HO = grow(1, O, C, rOH, aCOH, 1);                    // the hydroxyl H, in the plane, on the +y side
  const cb = Math.cos(aOCH * D), sb = Math.sin(aOCH * D), out = [C, O, HO];
  for (let k = 0; k < 3; k++) { const t = (180 + k * 120) * D;   // staggered: one C–H anti to O–H across the C–O axis
    out.push(at(1, rCH * sb * Math.sin(t), rCH * sb * Math.cos(t), rCH * cb)); }
  return out;
})();
const PEROXIDE = (() => {                                    // C2 skew; O–O along z, the HOOH dihedral opened about it
  const rOO = 1.4556, rOH = 0.9670, th = 102.32 * D, dh = 113.70 / 2 * D;
  const st = Math.sin(th), ct = Math.cos(th);
  return [at(8, 0, 0, 0), at(8, 0, 0, rOO),
    at(1, rOH * st * Math.sin(-dh), rOH * st * Math.cos(-dh), rOH * ct),
    at(1, rOH * st * Math.sin(dh), rOH * st * Math.cos(dh), rOO - rOH * ct)];
})();
const ACETONITRILE = (() => {                                // C3v; C(methyl) at the origin, C≡N along +z
  const rCC = 1.4580, rCN = 1.1580, rCH = 1.0870, b = (180 - 109.5) * D;
  const out = [at(6, 0, 0, 0), at(6, 0, 0, rCC), at(7, 0, 0, rCC + rCN)];
  for (let k = 0; k < 3; k++) { const t = k * 120 * D;
    out.push(at(1, rCH * Math.sin(b) * Math.cos(t), rCH * Math.sin(b) * Math.sin(t), rCH * Math.cos(b))); }
  return out;
})();
const FORMIC = (() => {                                      // Cs planar (Z/syn), yz plane; C at the origin, C=O along +z
  const C = at(6, 0, 0, 0), O1 = at(8, 0, 0, 1.2020);
  const O2 = grow(8, C, O1, 1.3430, 124.9, 1);               // the hydroxyl O, +y side
  const HC = grow(1, C, O1, 1.0970, 124.1, -1);              // the formyl H, −y side
  const HO = grow(1, O2, C, 0.9720, 106.3, -1);              // O–H syn to the carbonyl: the Z conformer
  return [C, O1, O2, HC, HO];
})();
const CYCLOPROPANE = (() => {                                // D3h; carbons in the xy plane, each CH₂ bisector radial
  const rCC = 1.5030, rCH = 1.0830, a = 115.1 / 2 * D, R = rCC / Math.sqrt(3);
  const out = [];
  for (let k = 0; k < 3; k++) { const t = k * 120 * D, cx = R * Math.cos(t), cy = R * Math.sin(t);
    out.push(at(6, cx, cy, 0));
    const ro = rCH * Math.cos(a), zz = rCH * Math.sin(a);
    out.push(at(1, cx + ro * Math.cos(t), cy + ro * Math.sin(t), zz));
    out.push(at(1, cx + ro * Math.cos(t), cy + ro * Math.sin(t), -zz));
  }
  return out;
})();
const BUTADIENE = (() => {                                   // trans-1,3-butadiene, C2h planar, the yz plane
  const rCC1 = 1.3410, rCC2 = 1.4632, rCH = 1.0900, aCCC = 123.62, aCCH = 120.0;
  const C2 = at(6, 0, 0, rCC2 / 2), C3 = at(6, 0, 0, -rCC2 / 2);
  const C1 = grow(6, C2, C3, rCC1, aCCC, 1), C4 = grow(6, C3, C2, rCC1, aCCC, -1);
  return [C1, C2, C3, C4,
    grow(1, C2, C3, rCH, aCCC + aCCH, 1),                    // H on C2, anti to C1 across the C2 plane
    grow(1, C3, C2, rCH, aCCC + aCCH, -1),                   // H on C3
    grow(1, C1, C2, rCH, aCCH, 1), grow(1, C1, C2, rCH, aCCH, -1),
    grow(1, C4, C3, rCH, aCCH, 1), grow(1, C4, C3, rCH, aCCH, -1)];
})();
/** a planar five- or six-ring in the xy plane with its hydrogens on the external bisectors */
function ringMolecule(bonds, interior, ringZ, hydrogens) {
  const w = ringWalk(bonds, interior), out = w.pts.map(([x, y], k) => at(ringZ[k], x, y, 0));
  for (const [k, r] of hydrogens) { const b = bisector(w.pts, k);
    out.push(at(1, w.pts[k][0] + r * b[0], w.pts[k][1] + r * b[1], 0)); }
  return { atoms: out, residual: w.residual };
}
const FURAN = ringMolecule([1.3620, 1.3610, 1.4310, 1.3610, 1.3620], [106.55, 110.68, 106.05, 106.05, 110.68],
  [8, 6, 6, 6, 6], [[1, 1.0750], [2, 1.0770], [3, 1.0770], [4, 1.0750]]);
const PYRIDINE = ringMolecule([1.3402, 1.3945, 1.3944, 1.3944, 1.3945, 1.3402],
  [116.94, 123.80, 118.53, 118.40, 118.53, 123.80], [7, 6, 6, 6, 6, 6],
  [[1, 1.0865], [2, 1.0826], [3, 1.0818], [4, 1.0826], [5, 1.0865]]);
const GLYCINE = (() => {                                     // conformer I, the heavy-atom skeleton planar in yz
  const rCC = 1.526, rCN = 1.467, rCO2 = 1.205, rCO1 = 1.355, rOH = 0.966, rCH = 1.081, rNH = 1.001;
  const aCCN = 112.1, aCCO2 = 125.1, aCCO1 = 111.6, aCOH = 112.3, aHCH = 109.471, aHNH = 107.0;
  const Cc = at(6, 0, 0, 0), Ca = at(6, 0, 0, -rCC);         // Cc = carboxyl carbon, Ca = the methylene carbon
  const O2 = grow(8, Cc, Ca, rCO2, aCCO2, 1);                // C=O
  const O1 = grow(8, Cc, Ca, rCO1, aCCO1, -1);               // C–O(H)
  const HO = grow(1, O1, Cc, rOH, aCOH, 1);
  const N = grow(7, Ca, Cc, rCN, aCCN, 1);
  /* the CH₂ and NH₂ hydrogens: IDEALLY TETRAHEDRAL / pyramidal, out of the heavy-atom plane (stated in `source`) */
  const bis = (p, a, b, r, half) => {                        // two H on `p`, symmetric about the local plane
    const u = [a[2] - p[2], a[3] - p[3]], v = [b[2] - p[2], b[3] - p[3]];
    const nu = Math.hypot(...u) || 1, nv = Math.hypot(...v) || 1;
    let w = [-(u[0] / nu + v[0] / nv), -(u[1] / nu + v[1] / nv)]; const nw = Math.hypot(...w) || 1;
    w = [w[0] / nw, w[1] / nw];
    const h = half * D;
    return [at(1, r * Math.sin(h), p[2] + r * Math.cos(h) * w[0], p[3] + r * Math.cos(h) * w[1]),
      at(1, -r * Math.sin(h), p[2] + r * Math.cos(h) * w[0], p[3] + r * Math.cos(h) * w[1])];
  };
  return [Cc, Ca, N, O1, O2, HO, ...bis(Ca, Cc, N, rCH, aHCH / 2), ...bis(N, Ca, Ca, rNH, aHNH / 2)];
})();
const UREA = (() => {                                        // C2v planar idealisation; C at the origin, C=O along +z
  const rCO = 1.221, rCN = 1.378, rNH = 1.005, aNCN = 114.7, aCNH = 120.0;
  const C = at(6, 0, 0, 0), O = at(8, 0, 0, rCO);
  const N1 = grow(7, C, O, rCN, 180 - aNCN / 2, 1), N2 = grow(7, C, O, rCN, 180 - aNCN / 2, -1);
  return [C, O, N1, N2,
    grow(1, N1, C, rNH, aCNH, 1), grow(1, N1, C, rNH, aCNH, -1),
    grow(1, N2, C, rNH, aCNH, 1), grow(1, N2, C, rNH, aCNH, -1)];
})();

/* ── the groups, in the order the dropdown shows them ──────────────────────────────────────────────────────── */
export const GROUPS = [
  { id: 'diatomics', label: 'DIATOMICS' },
  { id: 'hydrides', label: 'HYDRIDES' },
  { id: 'triatomics', label: 'TRIATOMICS · SMALL' },
  { id: 'organics', label: 'SMALL ORGANICS' },
  { id: 'rings', label: 'RINGS · BIOMOLECULES' },
  { id: 'ions', label: 'IONS' },
  { id: 'heavy', label: 'HEAVY ATOMS' },
];

/* ── THE TABLE.  `ang` is ångström; every `source` names a measurement or says it is not one. ───────────────── */
const RAW = [
  /* diatomics — r_e or r_0 from NIST CCCBDB's experimental bond lengths (Huber & Herzberg for the molecules there) */
  { id: 'H2', name: 'dihydrogen', formula: '<m>H₂</m>', group: 'diatomics', ang: diatomic(1, 1, 0.741),
    source: 'CCCBDB experimental r(H–H) = 0.741 Å' },
  { id: 'LiH', name: 'lithium hydride', formula: 'LiH', group: 'diatomics', ang: [[3, 0, 0, 0], [1, 0, 0, 1.595]],
    source: 'CCCBDB experimental r(Li–H) = 1.595 Å (the window\'s original preset, frozen)' },
  { id: 'HF', name: 'hydrogen fluoride', formula: 'HF', group: 'diatomics', ang: [[9, 0, 0, 0], [1, 0, 0, 0.9168]],
    source: 'CCCBDB experimental r(H–F) = 0.9168 Å (the window\'s original preset, frozen)' },
  { id: 'N2', name: 'dinitrogen', formula: '<m>N₂</m>', group: 'diatomics', ang: [[7, 0, 0, 0], [7, 0, 0, 1.09768]],
    source: 'CCCBDB experimental r(N≡N) = 1.09768 Å (the window\'s original preset, frozen)' },
  { id: 'CO', name: 'carbon monoxide', formula: 'CO', group: 'diatomics', ang: diatomic(6, 8, 1.1283),
    source: 'CCCBDB experimental r(C≡O) = 1.1283 Å' },
  { id: 'F2', name: 'difluorine', formula: '<m>F₂</m>', group: 'diatomics', ang: diatomic(9, 9, 1.4119),
    source: 'CCCBDB experimental r(F–F) = 1.4119 Å' },
  { id: 'LiF', name: 'lithium fluoride', formula: 'LiF', group: 'diatomics', ang: diatomic(3, 9, 1.5639),
    source: 'CCCBDB experimental r(Li–F) = 1.5639 Å' },
  { id: 'NaH', name: 'sodium hydride', formula: 'NaH', group: 'diatomics', ang: diatomic(11, 1, 1.8873),
    source: 'CCCBDB experimental r(Na–H) = 1.8873 Å' },
  { id: 'HCl', name: 'hydrogen chloride', formula: 'HCl', group: 'diatomics', ang: diatomic(17, 1, 1.2746),
    source: 'CCCBDB experimental r(H–Cl) = 1.2746 Å' },
  { id: 'Cl2', name: 'dichlorine', formula: '<m>Cl₂</m>', group: 'diatomics', ang: diatomic(17, 17, 1.9878),
    source: 'CCCBDB experimental r(Cl–Cl) = 1.9878 Å' },
  { id: 'NaCl', name: 'sodium chloride', formula: 'NaCl', group: 'diatomics', ang: diatomic(11, 17, 2.3609),
    source: 'CCCBDB experimental r(Na–Cl) = 2.3609 Å' },

  /* hydrides — the ones with no stable gas-phase structure say so */
  { id: 'BeH2', name: 'beryllium dihydride', formula: '<m>BeH₂</m>', group: 'hydrides', ang: linear3(4, 1, 1.3264),
    source: 'linear D∞h; r₀(Be–H) = 1.3264 Å from the gas-phase IR emission spectrum (Bernath, Shayesteh et al., 2002) — BeH₂ is a solid at room temperature and this is the free molecule' },
  { id: 'BH3', name: 'borane', formula: '<m>BH₃</m>', group: 'hydrides', ang: d3h(5, 1, 1.1900),
    source: 'planar D₃ₕ; r₀(B–H) = 1.190 Å from the ν₃ band of free BH₃ (Kawaguchi, 1992)' },
  { id: 'CH4', name: 'methane', formula: '<m>CH₄</m>', group: 'hydrides',
    ang: [[6, 0, 0, 0], [1, 0.6275797426091232, 0.6275797426091232, 0.6275797426091232], [1, 0.6275797426091232, -0.6275797426091232, -0.6275797426091232], [1, -0.6275797426091232, 0.6275797426091232, -0.6275797426091232], [1, -0.6275797426091232, -0.6275797426091232, 0.6275797426091232]],
    source: 'CCCBDB experimental r(C–H) = 1.087 Å, T_d, d = r/√3 (the window\'s original preset, frozen)' },
  { id: 'NH3', name: 'ammonia', formula: '<m>NH₃</m>', group: 'hydrides',
    ang: [[7, 0, 0, 0], [1, 0.9375295736636662, 0, -0.38102794977012433], [1, -0.46876478683183287, 0.8119244275919292, -0.38102794977012433], [1, -0.46876478683183354, -0.8119244275919288, -0.38102794977012433]],
    source: 'CCCBDB experimental r(N–H) = 1.0124 Å, ∠HNH = 106.67°, C₃ᵥ (the window\'s original preset, frozen)' },
  { id: 'H2O', name: 'water', formula: '<m>H₂O</m>', group: 'hydrides',
    ang: [[8, 0, 0, 0.1173], [1, 0, 0.7572, -0.4692], [1, 0, -0.7572, -0.4692]],
    source: 'CCCBDB experimental r(O–H) = 0.9578 Å, ∠HOH = 104.5° (the window\'s original preset, frozen)' },
  { id: 'MgH2', name: 'magnesium dihydride', formula: '<m>MgH₂</m>', group: 'hydrides', ang: linear3(12, 1, 1.7031),
    source: 'linear D∞h; r₀(Mg–H) = 1.7031 Å from the gas-phase IR emission spectrum (Shayesteh, Appadoo, Gordon & Bernath, 2003)' },
  { id: 'AlH3', name: 'alane', formula: '<m>AlH₃</m>', group: 'hydrides', ang: d3h(13, 1, 1.4769),
    source: 'NOT A MEASUREMENT: monomeric AlH₃ has no determined gas-phase structure (Al₂H₆ is what has been observed). Planar D₃ₕ at r = 1.4769 Å, this repository\'s own RHF/STO-3G minimum on the vendored decimals (scanned by research/h2o-2026-09-11/scratch/fix-molecules.py). STO-3G shortens Al–H by ≈0.1 Å against correlated estimates' },
  { id: 'SiH4', name: 'silane', formula: '<m>SiH₄</m>', group: 'hydrides', ang: td(14, 1, 1.4798),
    source: 'CCCBDB experimental r(Si–H) = 1.4798 Å, T_d' },
  { id: 'PH3', name: 'phosphine', formula: '<m>PH₃</m>', group: 'hydrides', ang: c3v(15, 1, 1.4200, 93.345),
    source: 'CCCBDB experimental r(P–H) = 1.420 Å, ∠HPH = 93.345°, C₃ᵥ' },
  { id: 'H2S', name: 'hydrogen sulfide', formula: '<m>H₂S</m>', group: 'hydrides', ang: bent(16, 1, 1.3356, 92.12),
    source: 'CCCBDB experimental r(S–H) = 1.3356 Å, ∠HSH = 92.12°' },

  /* triatomics and small closed shells */
  { id: 'CO2', name: 'carbon dioxide', formula: '<m>CO₂</m>', group: 'triatomics', ang: linear3(6, 8, 1.1600),
    source: 'CCCBDB experimental r(C=O) = 1.160 Å, linear D∞h' },
  { id: 'HCN', name: 'hydrogen cyanide', formula: 'HCN', group: 'triatomics', ang: linearABC(1, 6, 7, 1.0655, 1.1532),
    source: 'CCCBDB experimental r(C–H) = 1.0655 Å, r(C≡N) = 1.1532 Å, linear' },
  { id: 'N2O', name: 'nitrous oxide', formula: '<m>N₂O</m>', group: 'triatomics', ang: linearABC(7, 7, 8, 1.1282, 1.1842),
    source: 'CCCBDB experimental r(N–N) = 1.1282 Å, r(N–O) = 1.1842 Å, linear N–N–O' },
  { id: 'O3', name: 'ozone', formula: '<m>O₃</m>', group: 'triatomics', ang: bent(8, 8, 1.2717, 116.78),
    source: 'CCCBDB experimental r(O–O) = 1.2717 Å, ∠OOO = 116.78°' },
  { id: 'SO2', name: 'sulfur dioxide', formula: '<m>SO₂</m>', group: 'triatomics', ang: bent(16, 8, 1.4308, 119.33),
    source: 'CCCBDB experimental r(S=O) = 1.4308 Å, ∠OSO = 119.33°' },
  { id: 'BF3', name: 'boron trifluoride', formula: '<m>BF₃</m>', group: 'triatomics', ang: d3h(5, 9, 1.3070),
    source: 'CCCBDB experimental r(B–F) = 1.307 Å, planar D₃ₕ' },
  { id: 'CF4', name: 'carbon tetrafluoride', formula: '<m>CF₄</m>', group: 'triatomics', ang: td(6, 9, 1.3150),
    source: 'CCCBDB experimental r(C–F) = 1.315 Å, T_d' },
  { id: 'H2O2', name: 'hydrogen peroxide', formula: '<m>H₂O₂</m>', group: 'triatomics', ang: PEROXIDE,
    source: 'CCCBDB experimental r(O–O) = 1.4556 Å, r(O–H) = 0.967 Å, ∠OOH = 102.32°, HOOH dihedral 113.70°, C₂' },

  /* small organics */
  { id: 'C2H2', name: 'acetylene', formula: '<m>C₂H₂</m>', group: 'organics',
    ang: [at(6, 0, 0, 0.60165), at(6, 0, 0, -0.60165), at(1, 0, 0, 1.66215), at(1, 0, 0, -1.66215)],
    source: 'CCCBDB experimental r(C≡C) = 1.2033 Å, r(C–H) = 1.0605 Å, linear D∞h' },
  { id: 'C2H4', name: 'ethene', formula: '<m>C₂H₄</m>', group: 'organics', ang: ETHENE,
    source: 'CCCBDB experimental r(C=C) = 1.339 Å, r(C–H) = 1.087 Å, ∠HCH = 117.4°, D₂ₕ (the window\'s original preset, frozen)' },
  { id: 'C2H6', name: 'ethane', formula: '<m>C₂H₆</m>', group: 'organics', ang: ETHANE,
    source: 'CCCBDB experimental r(C–C) = 1.5351 Å, r(C–H) = 1.094 Å, ∠CCH = 111.17°, D₃d staggered' },
  { id: 'H2CO', name: 'formaldehyde', formula: '<m>H₂CO</m>', group: 'organics', ang: FORMALDEHYDE,
    source: 'CCCBDB experimental r(C=O) = 1.2078 Å, r(C–H) = 1.1161 Å, ∠HCH = 116.13°, C₂ᵥ' },
  { id: 'CH3OH', name: 'methanol', formula: '<m>CH₃OH</m>', group: 'organics', ang: METHANOL,
    source: 'CCCBDB experimental r(C–O) = 1.4246 Å, r(O–H) = 0.9451 Å, r(C–H) = 1.0936 Å, ∠COH = 108.53°; the methyl group is placed IDEALLY TETRAHEDRAL about the C–O axis (∠OCH = 109.471°, staggered to O–H) rather than with the measured 106.7°/112.0° splitting — the idealisation is stated, not hidden' },
  { id: 'HCOOH', name: 'formic acid', formula: 'HCOOH', group: 'organics', ang: FORMIC,
    source: 'CCCBDB experimental (Z conformer) r(C=O) = 1.202 Å, r(C–O) = 1.343 Å, r(O–H) = 0.972 Å, r(C–H) = 1.097 Å, ∠OCO = 124.9°, ∠COH = 106.3°, ∠HC=O = 124.1°, planar Cs' },
  { id: 'CH3CN', name: 'acetonitrile', formula: '<m>CH₃CN</m>', group: 'organics', ang: ACETONITRILE,
    source: 'CCCBDB experimental r(C≡N) = 1.158 Å, r(C–C) = 1.458 Å, r(C–H) = 1.087 Å, ∠HCC = 109.5°, C₃ᵥ' },

  /* rings and the two biomolecules */
  { id: 'C3H6', name: 'cyclopropane', formula: '<m>C₃H₆</m>', group: 'rings', ang: CYCLOPROPANE,
    source: 'CCCBDB experimental r(C–C) = 1.503 Å, r(C–H) = 1.083 Å, ∠HCH = 115.1°, D₃ₕ; each CH₂ bisector is radial in the ring plane, which is exact by symmetry rather than an idealisation' },
  { id: 'C4H6', name: '1,3-butadiene', formula: '<m>C₄H₆</m>', group: 'rings', ang: BUTADIENE,
    source: 'gas electron diffraction (Kveseth, Seip & Stølevik, 1980) r(C1=C2) = 1.3410 Å, r(C2–C3) = 1.4632 Å, ∠CCC = 123.62°, trans C₂ₕ planar; every C–H is placed at the measured mean 1.090 Å with ∠CCH = 120.0° in the plane — the ED analysis\'s own ∠CCH lie within 1.5° of 120°, and the idealisation is stated' },
  { id: 'C4H4O', name: 'furan', formula: '<m>C₄H₄O</m>', group: 'rings', ang: FURAN.atoms,
    source: 'microwave r_s structure (Mata, Martin & Sørensen, 1977) r(O–C₂) = 1.362 Å, r(C₂=C₃) = 1.361 Å, r(C₃–C₄) = 1.431 Å, ∠C₂OC₅ = 106.55°, ∠OC₂C₃ = 110.68°, ∠C₂C₃C₄ = 106.05°; hydrogens at the measured 1.075/1.077 Å along the external ring bisector — stated as an idealisation of the measured ∠C–C–H' },
  { id: 'C5H5N', name: 'pyridine', formula: '<m>C₅H₅N</m>', group: 'rings', ang: PYRIDINE.atoms,
    source: 'microwave structure r(N–C₂) = 1.3402 Å, r(C₂–C₃) = 1.3945 Å, r(C₃–C₄) = 1.3944 Å, ∠C₂NC₆ = 116.94°, ∠NC₂C₃ = 123.80°, ∠C₂C₃C₄ = 118.53°, ∠C₃C₄C₅ = 118.40° (the six interior angles sum to 720.00°, so the ring closes); hydrogens at 1.0865/1.0826/1.0818 Å along the external ring bisector — stated as an idealisation' },
  { id: 'urea', name: 'urea', formula: '<m>CO(NH₂)₂</m>', group: 'rings', ang: UREA,
    source: 'microwave heavy-atom values (Godfrey, Brown & Hunter, 1997) r(C=O) = 1.221 Å, r(C–N) = 1.378 Å, ∠NCN = 114.7°; the free molecule is slightly pyramidal at N and this entry is the PLANAR C₂ᵥ idealisation with r(N–H) = 1.005 Å at ∠CNH = 120° — the idealisation is stated' },
  { id: 'glycine', name: 'glycine', formula: '<m>NH₂CH₂COOH</m>', group: 'rings', ang: GLYCINE,
    source: 'gas electron diffraction of conformer I (Iijima, Tanaka & Onuma, 1991) r(C–C) = 1.526 Å, r(C–N) = 1.467 Å, r(C=O) = 1.205 Å, r(C–O) = 1.355 Å, ∠CCN = 112.1°, ∠CCO(=) = 125.1°, ∠CCO(–) = 111.6°, ∠COH = 112.3°; the CH₂ and NH₂ hydrogens are placed IDEALLY (∠HCH = 109.471°, ∠HNH = 107.0°, symmetric about the heavy-atom plane) at r(C–H) = 1.081 Å and r(N–H) = 1.001 Å — the idealisation is stated' },
  { id: 'C6H6', name: 'benzene', formula: '<m>C₆H₆</m>', group: 'rings', ang: BENZENE,
    source: 'CCCBDB experimental r(C–C) = 1.39 Å, r(C–H) = 1.09 Å, D₆ₕ, hydrogens at radius 2.48 Å (the window\'s original preset, frozen) — THE CAP' },

  /* ions — RHF is charge-agnostic, the geometry is the ION's, and every one of these is a closed-shell singlet */
  { id: 'NH4+', name: 'ammonium', formula: '<m>NH₄⁺</m>', group: 'ions', charge: 1, ang: td(7, 1, 1.021),
    source: 'r₀(N–H) = 1.021 Å, T_d, from the ν₃ infrared band of NH₄⁺ (Crofton & Oka, 1987)' },
  { id: 'H3O+', name: 'hydronium', formula: '<m>H₃O⁺</m>', group: 'ions', charge: 1, ang: c3v(8, 1, 0.9758, 111.3),
    source: 'r₀(O–H) = 0.9758 Å, ∠HOH = 111.3°, C₃ᵥ, from the infrared spectrum of H₃O⁺ (Sears, Bunker, Davies et al., 1985)' },
  { id: 'OH-', name: 'hydroxide', formula: '<m>OH⁻</m>', group: 'ions', charge: -1, ang: diatomic(8, 1, 0.964),
    source: 'r₀(O–H) = 0.964 Å from the rotational/vibrational spectrum of OH⁻' },
  { id: 'CN-', name: 'cyanide', formula: '<m>CN⁻</m>', group: 'ions', charge: -1, ang: diatomic(6, 7, 1.177),
    source: 'r₀(C–N) = 1.177 Å from the rotational spectrum of CN⁻ (Amano, 2005)' },

  /* heavy atoms — closed-shell hydrides and halides carrying Z up to 35, the top of the vendored record's reach */
  { id: 'CuH', name: 'copper hydride', formula: 'CuH', group: 'heavy', ang: diatomic(29, 1, 1.4626),
    source: 'CCCBDB experimental r(Cu–H) = 1.4626 Å (X¹Σ⁺, a closed-shell singlet; the Cu ATOM is ²S and cannot be done here)' },
  { id: 'ZnH2', name: 'zinc dihydride', formula: '<m>ZnH₂</m>', group: 'heavy', ang: linear3(30, 1, 1.5241),
    source: 'linear D∞h; r₀(Zn–H) = 1.5241 Å from the gas-phase IR emission spectrum (Shayesteh, Tereszchuk, Bernath & Colin, 2003)' },
  { id: 'GeH4', name: 'germane', formula: '<m>GeH₄</m>', group: 'heavy', ang: td(32, 1, 1.5251),
    source: 'CCCBDB experimental r(Ge–H) = 1.5251 Å, T_d' },
  { id: 'AsH3', name: 'arsine', formula: '<m>AsH₃</m>', group: 'heavy', ang: c3v(33, 1, 1.5110, 92.1),
    source: 'CCCBDB experimental r(As–H) = 1.511 Å, ∠HAsH = 92.1°, C₃ᵥ' },
  { id: 'H2Se', name: 'hydrogen selenide', formula: '<m>H₂Se</m>', group: 'heavy', ang: bent(34, 1, 1.4600, 90.6),
    source: 'CCCBDB experimental r(Se–H) = 1.460 Å, ∠HSeH = 90.6°' },
  { id: 'HBr', name: 'hydrogen bromide', formula: 'HBr', group: 'heavy', ang: diatomic(35, 1, 1.4145),
    source: 'CCCBDB experimental r(H–Br) = 1.4145 Å' },
  { id: 'Br2', name: 'dibromine', formula: '<m>Br₂</m>', group: 'heavy', ang: diatomic(35, 35, 2.2811),
    source: 'CCCBDB experimental r(Br–Br) = 2.2811 Å — 38 Cartesian AOs, the widest entry, and still cheaper than benzene because Br has only 8 shells' },
];

/* ── THE COST MODEL ───────────────────────────────────────────────────────────────────────────────────────────
 * ms ≈ a·eriWork + b·rpaWork + c, fitted by NON-NEGATIVE least squares to MEASURED node timings of the whole
 * worker path — lab/mathworker.js's ensureSolve: the split integral pass, then `moleculeRHF` at its DEFAULTS (so
 * BOTH the SAD and the core guess are run, plus the stability probe and the two Hessian blocks), then the RPA
 * inspector.  All 54 entries were measured 2026-09-12; three are named below as the anchors.
 *   eriWork = Σ over the 8-fold-unique shell quartets of (components_a·components_b·components_c·components_d) × 3⁴,
 *             the exact trip count of lab/md.js's twoElectron inner loop — the integral pass.
 *   rpaWork = (nocc·nvirt)²·nAO², the occupied-virtual pair space squared: lab/rpa-inspector.js's A ± B build and
 *             lab/rhf-molecule.js's stabilityHessian, which together are HALF of benzene's wall time (4.2 s of 10.1).
 *
 * WHY NOT (eriWork, nAO³), THE PAIR THE COMMISSION NAMED.  Because it is wrong by 4.6× and, worse, in the wrong
 * ORDER on exactly the case that had to be measured rather than assumed.  Fitted to the same 54 points:
 *     a = 1.198562e-4, b = 7.903301e-2, c = 0   →  Br₂ 7410 ms predicted against 4005 measured,
 *                                                  C₆H₆ 5972 ms predicted against 10053 measured.
 * That model says dibromine is the more expensive molecule and it is not: Br₂ has 38 AOs to benzene's 36 and a
 * LARGER integral count (2.56e7 quartet-primitive trips against 1.91e7), but only 3 virtual orbitals to benzene's
 * 15, so its pair space is 105 against 315 and its RPA costs 0.42 s where benzene's costs 4.2 s.  nAO³ cannot see
 * that, because the occupation is not a function of the AO count.  Both fits are kept here so the finding is
 * visible rather than merely asserted.
 *
 * WHAT THIS IS NOT.  A PREDICTION on one machine, printed in the menu so a choice can be made before paying for it.
 * The status line replaces it with the measured integral/scf/rpa split the moment the answer lands.  It does not
 * model the SCF iteration count — a heavy atom takes ~55 iterations to reach the residual's round-off floor where
 * H₂O takes 8 — so a heavy-atom prediction is the loosest one here (worst 1.36× over every entry above 100 ms). */
export const COST = {
  fitted: '2026-09-12',
  machine: 'node 22.22.1 on the λWAVES workstation (Linux 7.0.0-31-generic, RTX 3070 box); the browser worker measured 0.94× the node figure on benzene (9.5 s against 10.1 s)',
  model: 'ms = a·eriWork + b·rpaWork + c,  rpaWork = (nocc·nvirt)²·nAO²',
  a: 1.204028e-4, b: 5.665865e-5, c: 10.78,
  fit: 'non-negative least squares over all 54 measured entries; worst |ratio| 1.36 above 100 ms, 2.9 below it (where the absolute error is single-digit milliseconds)',
  anchors: { H2O: 9, C5H5N: 7531, C6H6: 10053 },              // the three named measurements, in ms
  rejected: { model: 'ms = a·eriWork + b·nAO³ + c', a: 1.198562e-4, b: 7.903301e-2, c: 0,
    why: 'worst 4.63× above 100 ms, and it puts Br₂ (7410 predicted, 4005 measured) ABOVE C₆H₆ (5972 predicted, 10053 measured) — nAO³ cannot see the occupation, and the pair space is where benzene\'s time goes' },
  browserFactor: 1.0,
};

/* ── the derived counts ─────────────────────────────────────────────────────────────────────────────────────── */
/** the Cartesian AO count, shell count and per-shell widths this basis gives these atoms */
export function counts(ang) {
  let nAO = 0, nShell = 0, nElec = 0; const widths = [];
  for (const [Z] of ang) {
    const ls = SHELL_LS(Z); nShell += ls.length; nElec += Z;
    for (const l of ls) { nAO += WIDTH[l]; widths.push(WIDTH[l]); }
  }
  return { nAO, nShell, nElec, widths };
}
/** the exact inner-loop trip count of lab/md.js's twoElectron: unique shell quartets, weighted by their components */
export function eriWork(widths) {
  const pair = [];
  for (let i = 0; i < widths.length; i++) for (let j = 0; j <= i; j++) pair.push(widths[i] * widths[j]);
  let w = 0;
  for (let p = 0; p < pair.length; p++) for (let q = 0; q <= p; q++) w += pair[p] * pair[q];
  return w * PRIMITIVES ** 4;
}
/** (nocc·nvirt)²·nAO²: the occupied-virtual pair space the RPA and the stability Hessian both work in */
export const rpaWork = (nAO, nocc) => ((nocc * (nAO - nocc)) ** 2) * nAO ** 2;
export const predictMs = (work, rWork) => COST.a * work + COST.b * rWork + COST.c;

/* ── THE TWO SPECIES RHF/STO-3G CANNOT SHOW A SPECTRUM FOR ──────────────────────────────────────────────────────
 * Measured 2026-09-12 on this engine: CuH and ZnH₂ converge to a clean aufbau solution with a positive HOMO–LUMO
 * gap and a satisfied density test, and that solution is NOT A MINIMUM — both singlet orbital-rotation Hessian
 * blocks A + B and A − B are negative, so the RPA equations have no real solution and lab/rpa-inspector.js refuses
 * them by design ("A − B is not positive definite; the RHF reference is not a minimum").  chem.solve therefore
 * cannot answer for them at all, so they are LISTED with the finding and DISABLED, rather than quietly dropped.
 * This is minimal-basis RHF failing on a 3d¹⁰ metal hydride, not a bug: it is the same real-RHF instability the
 * N₂ second solution taught this engine to name, and it wants ROHF/UHF or a larger basis, not a looser gate. */
const UNSTABLE = {
  CuH: { lowestApB: -6.966e-3, lowestAmB: -1.173e-1, energy: -1620.944903679 },
  ZnH2: { lowestApB: -1.885e-2, lowestAmB: -6.760e-2, energy: -1758.305613634 },
};

export const MOLECULES = RAW.map((m) => {
  const charge = m.charge || 0, c = counts(m.ang), work = eriWork(c.widths);
  const nElec = c.nElec - charge, nocc = nElec / 2;
  const rw = rpaWork(c.nAO, nocc);
  return { ...m, charge, nAO: c.nAO, nShell: c.nShell, nElectrons: nElec, nocc,
    eriWork: work, rpaWork: rw, predictedMs: Math.round(predictMs(work, rw)),
    instability: UNSTABLE[m.id] || null };
});
export const MOLECULE_BY_ID = new Map(MOLECULES.map((m) => [m.id, m]));

/* THE CAP IS BENZENE'S OWN PREDICTION, so the rule is one sentence: nothing slower than benzene. */
export const CAP_ID = 'C6H6';
export const CAP_MS = MOLECULE_BY_ID.get(CAP_ID).predictedMs;
export const CAP_RULE = `the cap is benzene: ~${(CAP_MS / 1000).toFixed(1)} s predicted, 36 AOs, 42 electrons. An entry predicted slower than that is listed and disabled, and so are the two whose RHF reference is not a minimum (CuH, ZnH₂ — no RPA spectrum exists for them).`;
for (const m of MOLECULES) {
  m.over = m.predictedMs > CAP_MS * 1.02;                     // 2 %: benzene must never disable itself by rounding
  m.reason = m.over ? `over the benzene cap (~${(CAP_MS / 1000).toFixed(1)} s)`
    : m.instability ? 'RHF/STO-3G is not a minimum here (A−B ≺ 0) — no RPA spectrum exists' : null;
  /* the SHORT form goes in the option text itself.  A `title` on an <option> is unreliable in a native select and
     lab/mir/control-help.js moves titles to data-help anyway, so a menu that refuses has to say so in its own row. */
  m.shortReason = m.over ? 'over the cap' : m.instability ? 'not a minimum' : null;
  m.disabled = !!m.reason;
}
export const UNDER_CAP = MOLECULES.filter((m) => !m.over);
export const OVER_CAP = MOLECULES.filter((m) => m.over);
export const SOLVABLE = MOLECULES.filter((m) => !m.disabled);

/** the entry's atoms in bohr, as lab/rhf-molecule.js and the worker want them */
export const moleculeAtoms = (id) => {
  const m = MOLECULE_BY_ID.get(id) || MOLECULES[0];
  return m.ang.map(([Z, x, y, z]) => ({ Z, x: x * ANGSTROM, y: y * ANGSTROM, z: z * ANGSTROM }));
};
/** the entry's charge, which chem.solve needs beside the atoms */
export const moleculeCharge = (id) => (MOLECULE_BY_ID.get(id) || MOLECULES[0]).charge;
/** one line for the dropdown: "H₂O · 7 AO · ~11 ms", "C₆H₆ · 36 AO · ~9.6 s" — milliseconds below a second, since
    half this library solves in under 50 ms and rounding all of it to "~0.0 s" would tell nobody anything */
export const showMs = (ms) => (ms < 950 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`);
export const optionLabel = (m) => `${m.formula.replace(/<\/?m>/g, '')} · ${m.nAO} AO · ~${showMs(m.predictedMs)}`
  + (m.shortReason ? ` · ${m.shortReason}` : '');
/** the ring builders' closure residuals in ångström — a parameter set that does not close is a broken geometry */
export const RING_RESIDUALS = { C4H4O: FURAN.residual, C5H5N: PYRIDINE.residual };
/** the eight ids the laws pin, in their original order; `preset` semantics never leave this set behind */
export const LEGACY_PRESETS = ['H2O', 'NH3', 'CH4', 'HF', 'LiH', 'N2', 'C2H4', 'C6H6'];
