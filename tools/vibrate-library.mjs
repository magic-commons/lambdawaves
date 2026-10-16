#!/usr/bin/env node
/* tools/vibrate-library.mjs — THE NORMAL MODES AS RECORDS (0.7.0 V1 THE MODES).  THE GENERATOR IS THE APP: for each molecule it takes PySCF's
 * harmonic analysis at the app's own atoms as the ORACLE (tests/fixtures/oracles/vibrate-v1.json, tools/library/vibrate-oracle.py: the analytic
 * RHF Hessian, translations and rotations projected out, NO geometry optimised — "as computed") and then measures everything else with the
 * SHIPPED code: lab/rhf-molecule.js moleculeRHF at R₀ ± h·Lₖ and lab/mathworker.js chemVibFrames (the worker op the card asks).
 *
 *   per mode   Lₖ = PySCF's Cartesian vector normalised to |Lₖ| = 1 bohr (sign: its largest component positive); μₖ = Σ mᵢ|Lₖ,ᵢ|² (mₑ, PySCF's
 *              isotope-averaged masses × amu2au, both from the fixture); D₁ₖ = (D₊ − D₋)/2h in the MOVING AO basis; dμ/dQ the same way;
 *              THE CURVATURE ωₖ² = (E₊ + E₋ − 2E₀)/(μₖh²) against PySCF's ωₖ (gate ≤ 0.1 cm⁻¹); Q₀ₖ = √(1/(μₖωₖ)) (a.u.); the irrep by
 *              projecting the mass-weighted mode on lab/names.js' table for the molecule's declared group (a linear molecule: Σ/Π by the axis
 *              and g/u by inversion), and Herzberg's number νₙ (the table's irrep order, descending ν̃ inside an irrep, a degenerate set once).
 *   THE CHECK  at Q₀, 2Q₀, 4Q₀: chem.vib.frames' LINEAR + ONE McWEENY D against a live re-solve there — relL2 = ‖D − D_solve‖/‖D_solve‖ (gates
 *              ≤ 2.5·10⁻⁴ water / 7·10⁻⁴ benzene at Q₀, ≤ 1.1·10⁻³ at 4Q₀) and |Tr(DS) − N| (≤ 10⁻² at ≤ 2Q₀) — WRITTEN into the record's
 *              `check` block with the plain LINEAR relL2 beside it; a miss is recorded, never tuned away.
 * The record: lab/library/<sha-256>.json { schema: 1, kind: 'vibrate', id, input, ground { hash, energy, nAO }, vibrate { K, h, omega (cm⁻¹),
 * name, irrep, L ($f64, 3N·K), mu, q0, D1 ($f32, nAO²·K), dipole1 ($f64, 3K) }, check, oracle }; the catalogue lab/library.json gains
 * `vibrations: [{ id, basis, hash, bytes, modes }]` (tools/orbital-library.mjs carries that member through unchanged).
 *
 *   node tools/vibrate-library.mjs                 write every record and the catalogue's `vibrations`
 *   node tools/vibrate-library.mjs --only H2O      re-measure these; the other rows are kept as they are on disk
 *   node tools/vibrate-library.mjs --check         write nothing; exit 1 unless every record re-measures byte for byte and validates
 *   node tools/vibrate-library.mjs --inputs FILE   the atoms (bohr) for tools/library/vibrate-oracle.py
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { moleculeRHF } from '../lab/rhf-molecule.js';
import { chemRegister, chemGround, chemVibFrames } from '../lab/mathworker.js';
import { moleculeAtoms, moleculeCharge, MOLECULE_BY_ID } from '../lab/molecules.js';
import { SCHEMA, atomsKey, validateRecord, decodeVibrate, recordPath } from '../lab/library.js';
import { GROUPS, operations, frameOf } from '../lab/names.js';
import { evaluator } from '../lab/molecular-field.js';

const at = (rel) => fileURLToPath(new URL('../' + rel, import.meta.url));
const IDS = ['H2O', 'C6H6', 'N2', 'CO2', 'NH3', 'CH4', 'HF', 'H2CO', 'C2H4'], H = 0.005, AMPS = [1, 2, 4];
const GATE = { curvature: 0.1, relL2Q0: { H2O: 2.5e-4, C6H6: 7e-4 }, relL2Q0Else: 7e-4, relL2At4: 1.1e-3, trace: 1e-2 };
const argv = process.argv.slice(2), CHECK = argv.includes('--check'), opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const ONLY = opt('--only') ? new Set(opt('--only').split(',')) : null;
const REC = JSON.parse(readFileSync(at('lab/vendor/bse/sto-3g-v1.json'), 'utf8')); chemRegister('sto-3g', REC);

if (opt('--inputs')) {
  writeFileSync(opt('--inputs'), JSON.stringify({ rows: IDS.map((id) => { const a = moleculeAtoms(id); return { id, charge: moleculeCharge(id), key: atomsKey(a), atoms: a.map((x) => [x.Z, x.x, x.y, x.z]) }; }) }));
  console.log('wrote', opt('--inputs')); process.exit(0);
}
const ORACLE = JSON.parse(readFileSync(at('tests/fixtures/oracles/vibrate-v1.json'), 'utf8')), PROV = ORACLE.provenance;
const AMU = PROV.constants.amu2au, H2W = PROV.constants.hartree2wavenumber;
const b64 = (t) => Buffer.from(t.buffer, t.byteOffset, t.byteLength).toString('base64');
const sig = (x) => +x.toPrecision(3);
const SUB = '₀₁₂₃₄₅₆₇₈₉', sub = (s) => s.replace(/\d/g, (d) => SUB[d]);
const pretty = (g) => sub(g).replace(/''/g, '″').replace(/'/g, '′').replace(/\+$/, '⁺');

/* ── the irreps: the mass-weighted set of a (possibly degenerate) level, its character under each operation of the declared group ── */
const mv = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
const mm = (A, B) => Array.from({ length: 9 }, (_, k) => A[3 * (k / 3 | 0)] * B[k % 3] + A[3 * (k / 3 | 0) + 1] * B[3 + k % 3] + A[3 * (k / 3 | 0) + 2] * B[6 + k % 3]);
const tp = (A) => [A[0], A[3], A[6], A[1], A[4], A[7], A[2], A[5], A[8]];
function permOf(atoms, c, R) {                                     // where R (about the centre c) sends each atom; it must land on one of the same element
  return atoms.map((a) => { const r = mv(R, [a.x - c[0], a.y - c[1], a.z - c[2]]).map((v, q) => v + c[q]); let best = -1, bd = Infinity;
    atoms.forEach((b, ib) => { const d = Math.hypot(b.x - r[0], b.y - r[1], b.z - r[2]); if (b.Z === a.Z && d < bd) { bd = d; best = ib; } });
    if (bd > 1e-4) throw new Error('vibrate: the declared group does not hold the framework (' + bd.toExponential(1) + ' bohr)'); return best; });
}
const chi = (set, perm, R) => set.reduce((s, e) => { let t = 0; perm.forEach((p, i) => { const r = mv(R, [e[3 * i], e[3 * i + 1], e[3 * i + 2]]); t += e[3 * p] * r[0] + e[3 * p + 1] * r[1] + e[3 * p + 2] * r[2]; }); return s + t; }, 0);
function irrepOf(id, atoms, set) {
  const sym = MOLECULE_BY_ID.get(id).symmetry, g = sym.group, fr = frameOf(atoms, sym.frame || {});
  if (g === 'Dinfh' || g === 'Cinfv') {
    const along = set.reduce((s, e) => s + atoms.reduce((t, _, i) => t + (e[3 * i] * fr.z[0] + e[3 * i + 1] * fr.z[1] + e[3 * i + 2] * fr.z[2]) ** 2, 0), 0) / set.length;
    const inv = [-1, 0, 0, 0, -1, 0, 0, 0, -1], par = g === 'Dinfh' ? (chi(set, permOf(atoms, fr.c, inv), inv) > 0 ? 'g' : 'u') : '';
    return along > 0.5 ? 'Σ' + par + '+' : 'Π' + par;
  }
  const G = GROUPS[g]; if (!G || g === 'C1') return 'A';
  const ops = operations(g).map((o) => { const R = mm(fr.F, mm(o.R, tp(fr.F))); return { col: o.col, x: chi(set, permOf(atoms, fr.c, R), R) }; });
  const hit = Object.entries(G.irreps).filter(([, row]) => Math.abs(ops.reduce((s, o) => s + row[o.col] * o.x, 0) / ops.length - 1) < 1e-3 && row[0] === set.length);
  if (hit.length !== 1) throw new Error(`vibrate: ${id}'s level of ${set.length} is not one irrep of ${g}`);
  return hit[0][0];
}
const ORDER = (g) => (g === 'Dinfh' ? ['Σg+', 'Σu+', 'Πg', 'Πu'] : g === 'Cinfv' ? ['Σ+', 'Π'] : Object.keys((GROUPS[g] || GROUPS.C1).irreps));

/* ── one molecule ── */
function build(id) {
  const t0 = performance.now(), atoms = moleculeAtoms(id), charge = moleculeCharge(id), o = ORACLE.molecules[id], N = atoms.length;
  if (!o || o.key !== atomsKey(atoms)) throw new Error(`vibrate: ${id} has no oracle row at these atoms — run tools/library/vibrate-oracle.py`);
  const solve = (A, guess) => { const s = moleculeRHF({ atoms: A, basis: 'sto-3g', charge, record: REC, guess: guess || 'sad', detect: false, stability: false, hessian: false });
    if (!s.converged) throw new Error(`vibrate: ${id} did not converge at a displaced geometry`); return s; };
  const disp = (Q, L) => atoms.map((a, i) => ({ Z: a.Z, x: a.x + Q * L[3 * i], y: a.y + Q * L[3 * i + 1], z: a.z + Q * L[3 * i + 2] }));
  const s0 = solve(atoms), n = s0.integrals.n, nn = n * n, E0 = s0.energy, Ne = s0.nElectrons, mass = o.mass.map((m) => m * AMU);
  chemGround({ atoms, basis: 'sto-3g', charge, symmetry: MOLECULE_BY_ID.get(id).symmetry });          // the worker's solve: chem.vib.frames plays against it
  /* the modes: PySCF's, normalised; the mass-weighted unit vector e for the irreps */
  let modes = o.modes.map((v, i) => {
    const nv = Math.hypot(...v), big = v.reduce((b, x) => (Math.abs(x) > Math.abs(b) ? x : b), 0), L = v.map((x) => x / nv * Math.sign(big));
    const mu = mass.reduce((s, m, a) => s + m * (L[3 * a] ** 2 + L[3 * a + 1] ** 2 + L[3 * a + 2] ** 2), 0), e = L.map((x, j) => x * Math.sqrt(mass[j / 3 | 0]) / Math.sqrt(mu));
    return { L, mu, e, pyscf: o.omega[i] };
  });
  const levels = []; for (const m of modes) { const l = levels[levels.length - 1]; if (l && Math.abs(l[0].pyscf - m.pyscf) < 0.5) l.push(m); else levels.push([m]); }
  for (const l of levels) { const ir = irrepOf(id, atoms, l.map((m) => m.e)); l.forEach((m, j) => { m.irrep = ir; m.member = l.length > 1 ? 'abc'[j] : ''; }); }
  const ord = ORDER(MOLECULE_BY_ID.get(id).symmetry.group), lv = levels.slice().sort((a, b) => ord.indexOf(a[0].irrep) - ord.indexOf(b[0].irrep) || b[0].pyscf - a[0].pyscf);
  lv.forEach((l, k) => l.forEach((m) => { m.name = 'ν' + sub(String(k + 1)) + m.member; }));
  modes = lv.flat();
  const K = modes.length, Lall = new Float64Array(3 * N * K), D1 = new Float32Array(nn * K), dip1 = new Float64Array(3 * K);
  for (let k = 0; k < K; k++) {
    const m = modes[k], P = solve(disp(H, m.L), s0.D), M = solve(disp(-H, m.L), s0.D);
    for (let i = 0; i < nn; i++) D1[k * nn + i] = (P.D[i] - M.D[i]) / (2 * H);
    for (let q = 0; q < 3; q++) dip1[3 * k + q] = (P.dipole[q] - M.dipole[q]) / (2 * H);
    const w2 = (P.energy + M.energy - 2 * E0) / (m.mu * H * H);
    m.w = Math.sign(w2) * Math.sqrt(Math.abs(w2)); m.nu = m.w * H2W; m.q0 = 1 / Math.sqrt(m.mu * Math.abs(m.w));
    Lall.set(m.L, 3 * N * k);
  }
  const vib = { atoms, basis: 'sto-3g', charge, L: Lall, D1, q0: modes.map((m) => m.q0) };
  /* THE CHECK: the worker's own frames (K = 1: the phase-0 sample, Q = amp·Q₀) against a live re-solve there */
  /* relL2 is of ρ on NACRE Round 2's grid (40³ over the atoms' box padded 4 bohr, every point) — the metric the gates were measured in
     (REVIEW-SONNET-2 §2b, sonnet2-vibrate-water.py) — with the matrix's own ‖ΔD‖_F/‖D‖_F beside it */
  const lo = [0, 1, 2].map((q) => Math.min(...atoms.map((a) => [a.x, a.y, a.z][q])) - 4), hi = [0, 1, 2].map((q) => Math.max(...atoms.map((a) => [a.x, a.y, a.z][q])) + 4);
  const grid = []; for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) for (let l = 0; l < 40; l++) grid.push([lo[0] + (hi[0] - lo[0]) * i / 39, lo[1] + (hi[1] - lo[1]) * j / 39, lo[2] + (hi[2] - lo[2]) * l / 39]);
  function rhoErr(shells, Ds, Dx) {                                  // ‖ρ[D] − ρ[Dx]‖₂/‖ρ[Dx]‖₂ over the grid, for each D in Ds
    const E = evaluator(shells), v = new Float64Array(n), e2 = Ds.map(() => 0); let x2 = 0;
    for (const p of grid) { E.ao(p, v); const quad = (D) => { let s = 0; for (let i = 0; i < n; i++) { if (!v[i]) continue; let w = 0; for (let j = 0; j < n; j++) w += D[i * n + j] * v[j]; s += v[i] * w; } return s; };
      const rx = quad(Dx); x2 += rx * rx; Ds.forEach((D, u) => { e2[u] += (quad(D) - rx) ** 2; }); }
    return e2.map((e) => sig(Math.sqrt(e / x2)));
  }
  const relL2 = [], trace = [], linear = [], relD = [];
  modes.forEach((m, k) => { const r = [], t = [], l = [], dm = [];
    for (const a of AMPS) {
      const Q = a * m.q0, f = chemVibFrames({ vib, k, amp: a, K: 1 }), X = solve(disp(Q, m.L), s0.D), S = X.integrals.S, lin = new Float64Array(nn);
      let d2 = 0, x2 = 0, tr = 0;
      for (let i = 0; i < nn; i++) { const ex = X.D[i]; d2 += (f.D[i] - ex) ** 2; x2 += ex * ex; lin[i] = s0.D[i] + Q * D1[k * nn + i]; }
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) tr += f.D[i * n + j] * S[j * n + i];
      const [rm, rl] = rhoErr(X.basis.shells, [f.D, lin], X.D);
      r.push(rm); l.push(rl); t.push(sig(Math.abs(tr - Ne))); dm.push(sig(Math.sqrt(d2 / x2)));
    }
    relL2.push(r); trace.push(t); linear.push(l); relD.push(dm); });
  const g0 = GATE.relL2Q0[id] || GATE.relL2Q0Else, worst = (A, j) => Math.max(...A.map((r) => r[j]));
  const dNu = Math.max(...modes.map((m) => Math.abs(m.nu - m.pyscf)));
  const pass = { curvature: dNu <= GATE.curvature, relL2Q0: worst(relL2, 0) <= g0, relL2At4: worst(relL2, 2) <= GATE.relL2At4, trace: Math.max(worst(trace, 0), worst(trace, 1)) <= GATE.trace };
  const record = { schema: SCHEMA, kind: 'vibrate', id, input: { atoms, atomsSha256: atomsKey(atoms), basis: 'sto-3g', charge },
    ground: { hash: s0.hash, energy: E0, nAO: n },
    vibrate: { K, h: H, omega: modes.map((m) => +m.nu.toFixed(4)), name: modes.map((m) => m.name), irrep: modes.map((m) => pretty(m.irrep)),
      L: { $f64: b64(Lall) }, mu: modes.map((m) => m.mu), q0: modes.map((m) => m.q0), D1: { $f32: b64(D1) }, dipole1: { $f64: b64(dip1) } },
    check: { amplitudes: AMPS, method: 'chem.vib.frames (LINEAR + one McWeeny step on the exact S(Q)) against moleculeRHF re-solved at R₀ + Q·Lₖ; relL2 and linear: of ρ on the 40³ grid (box + 4 bohr); relD: the matrix',
      relL2, trace, linear, relD, gates: { curvatureCm: GATE.curvature, relL2Q0: g0, relL2At4: GATE.relL2At4, traceTo2: GATE.trace }, pass },
    oracle: { pyscf: PROV.pyscf, what: 'PySCF analytic RHF Hessian, thermo.harmonic_analysis, at these atoms (unoptimised)', omega: modes.map((m) => +m.pyscf.toFixed(4)),
      maxDeltaCm: sig(dNu), gradientMax: sig(o.gradientMax) } };
  const text = JSON.stringify(record) + '\n', hash = createHash('sha256').update(text).digest('hex');
  return { id, text, hash, record, modes, ms: performance.now() - t0, row: { id, basis: 'sto-3g', hash, bytes: Buffer.byteLength(text), modes: K } };
}

const CAT = at('lab/library.json'), cat = JSON.parse(readFileSync(CAT, 'utf8')), old = cat.vibrations || [], rows = [], fail = [];
for (const id of IDS) {
  const was = old.find((r) => r.id === id);
  if (ONLY && !ONLY.has(id)) { if (was) rows.push(was); continue; }
  const r = build(id), m = r.record.check, bad = Object.entries(m.pass).filter(([, v]) => !v).map(([k]) => k);
  console.log(`${id.padEnd(5)} ${r.record.ground.nAO} AO · ${r.row.modes} modes · ${(r.ms / 1000).toFixed(1)} s · ${r.row.bytes} B · max|Δν̃| ${r.record.oracle.maxDeltaCm} cm⁻¹`
    + ` · relL2 @Q₀ ≤ ${Math.max(...m.relL2.map((x) => x[0]))} @2Q₀ ≤ ${Math.max(...m.relL2.map((x) => x[1]))} @4Q₀ ≤ ${Math.max(...m.relL2.map((x) => x[2]))}`
    + ` · |Tr−N| @2Q₀ ≤ ${Math.max(...m.trace.map((x) => x[1]))}${bad.length ? ' · MISSES ' + bad.join(', ') : ''}`);
  for (const md of r.modes) console.log(`   ${md.name.padEnd(4)} ${r.record.vibrate.irrep[r.modes.indexOf(md)].padEnd(4)} ours ${md.nu.toFixed(3).padStart(9)}  PySCF ${md.pyscf.toFixed(3).padStart(9)}  Δ ${(md.nu - md.pyscf).toExponential(1)}  Q₀ ${md.q0.toFixed(4)}`);
  const bad2 = validateRecord(r.record); if (bad2.length) fail.push(`${id}: ${bad2.join('; ')}`);
  decodeVibrate(r.record);
  const file = at('lab/' + recordPath(r.hash));
  if (CHECK) { if (!was || was.hash !== r.hash || !existsSync(file) || readFileSync(file, 'utf8') !== r.text) fail.push(`${id}: the record on disk is not what this measures`); }
  else { writeFileSync(file, r.text); if (was && was.hash !== r.hash && existsSync(at('lab/' + recordPath(was.hash)))) unlinkSync(at('lab/' + recordPath(was.hash))); }
  rows.push(r.row);
}
if (CHECK) { if (fail.length) { console.log('vibrate-library: OUT OF STEP\n  ' + fail.join('\n  ')); process.exit(1); } console.log('vibrate-library: in step'); }
else { cat.vibrations = rows; writeFileSync(CAT, JSON.stringify(cat, null, 1) + '\n'); console.log(`vibrate-library: wrote ${rows.length} rows into lab/library.json — now node tools/orbital-library.mjs --check and node tests/pwa.test.mjs --write`); if (fail.length) { console.log(fail.join('\n')); process.exit(1); } }
