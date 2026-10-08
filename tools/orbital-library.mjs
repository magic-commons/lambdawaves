#!/usr/bin/env node
/* tools/orbital-library.mjs — THE GENERATOR IS THE APP (0.4.0 S4a · PLAN B2, F5).  It runs the SHIPPED solver in node — the
 * worker's own exported ops, lab/mathworker.js chemGround → chemSpectrum → chemStates / chemStateVectors, which are
 * ensureSolve → lab/rhf-molecule.js moleculeRHF at its defaults → lab/rpa-inspector.js rpa → the canonical gauge — and writes
 * what they answered as a record: lab/library/<sha-256 of the file>.json, plus the catalogue lab/library.json that
 * lab/molecules.js reads.  No second implementation exists to drift: a record IS the worker's reply, re-encoded.
 *
 *   node tools/orbital-library.mjs                 write every record and the catalogue; delete a record file no row reaches
 *   node tools/orbital-library.mjs --check         write nothing; exit 1 unless every byte on disk is what this writes, every
 *                                                  record validates (lab/library.js), and lab/library/ holds nothing else
 *   node tools/orbital-library.mjs --only C6H6     (with --check) regenerate only these ids; the rest are re-hashed, not re-solved
 *
 * THE RECORD (schema 1; lab/library.js validateRecord is the reader's law and readers ignore members they do not know):
 *   input     the atoms in bohr exactly as lab/molecules.js moleculeAtoms gives them, the charge, the basis and its file hash
 *   caps      { orbitals, states, rpa, tdhf } — ORBITAL needs ε and C (always); RPA sticks are stored (always); STATES needs the
 *             stored CIS ladder (X is d² doubles: benzene 315² = 794 KB, lysine 960² = 7.4 MB, so it is per entry); TDHF needs
 *             the live ERI and is offered only where the molecule is under the live cap (the integrals are never stored)
 *   ground    chem.ground's reply minus its clocks (names.ms, timings): energy, ε, nocc, nAO, the AO order, the basis hash,
 *             the stability verdict, the solutions, the dipole, the names (lab/names.js, S1) — what MOLECULES and MO-REGISTRY read
 *   orbitals  ε, C (the canonical gauge) and D as f64; spectrum: the RPA sticks and the TDA ladder; states: the canonical ladder
 *   stem      the STEM fields (R-L4): formula, point group and frame, mass, charge and multiplicity, dipole, HOMO–LUMO gap,
 *             geometry source, InChIKey and PubChem CID, a two-line blurb, the curated IEs, the sources
 *   page      the molecule's page, lab/latex-state.js moleculeLatex — what EDIT › COPY writes
 *   oracle    an independent energy (PySCF on the same vendored decimals) and the app's distance from it (≤ 1e-8 Eh, or no record)
 * Numbers that a clock moves are never written, so --check is byte-exact on one machine; typed arrays are base64 of
 * little-endian bytes, exact. */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chemRegister, chemGround, chemSpectrum, chemStates, chemStateVectors, chemOpen, chemSolverCalls } from '../lab/mathworker.js';
import { BASIS_FILES } from '../lab/rhf-molecule.js';
import { ANGSTROM } from '../lab/md.js';
import { MOLECULE_BY_ID, COST, eriWork, rpaWork, counts, CAP_MS } from '../lab/molecules.js';
import { CURATED_IE, nameOrbitals, characters, coreCount } from '../lab/names.js';
import { basisFrom, nuclearRepulsion } from '../lab/md.js';
import { evaluator } from '../lab/molecular-field.js';
import { moleculeLatex } from '../lab/latex-state.js';
import { validateRecord, recordPath, SCHEMA } from '../lab/library.js';

const LAB = fileURLToPath(new URL('../lab/', import.meta.url));
const CATALOGUE = LAB + 'library.json';
const args = process.argv.slice(2), CHECK = args.includes('--check');
const ONLY = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
if (ONLY && !CHECK) { console.error('orbital-library: --only is a --check option (a write regenerates the whole catalogue)'); process.exit(2); }

/* ── THE ENTRIES.  S4a ships two: benzene (the proof — under the cap, everything stored) and lysine (the 64-AO fixture the digest
   lock needs before S4c touches the kernel; past the cap, so it opens only from its record).  S4b adds the sections. ── */
const ENTRIES = [
  { id: 'C6H6', basis: 'sto-3g', section: 'ORGANIC', states: true,
    oracle: { file: 'tests/fixtures/oracles/sto-3g-v1.json', path: ['molecules_extended', 'C6H6', 'energy'], what: 'PySCF 2.14 RHF, cart=True, the vendored STO-3G decimals' },
    stem: { inchiKey: 'UHOVQNZJYSORNB-UHFFFAOYSA-N', pubchemCid: 241,
      blurb: ['The aromatic ring: six carbons, six π electrons in three bonding orbitals, the HOMO a degenerate pair (1e₁g).',
        'Its RHF/STO-3G record is the library\'s proof — the one molecule here that also solves live, so cached = fresh can be measured.'] } },
  { id: 'lysine', basis: 'sto-3g', section: 'BIO', states: false,
    molecule: { name: 'lysine', formula: '<m>C₆H₁₄N₂O₂</m>', charge: 0, symmetry: { group: 'C1' },
      source: 'NOT A MEASUREMENT: the S4 census\'s neutral L-lysine (SMILES N[C@@H](CCCCN)C(=O)O), relaxed by PySCF RHF/STO-3G on the vendored decimals — optimised there, UNVERIFIED against experiment; one conformer, absolute stereochemistry unverified (research/release-0.4.0/library-census/census.json)',
      ang: [[7, -2.506690815685623, -1.5039060397638868, 0.8307558600125732], [6, -1.5014480758785482, -0.8002112173638809, -0.022950090950889856], [6, -0.0671622360862503, -1.1808285048763643, 0.4345737444318268], [6, 1.0146261982178855, -1.0645174122833025, -0.66751079574317], [6, 1.406197525605455, 0.37135873346930465, -1.0931537809291603], [6, 2.3574266033389892, 1.0987560397819793, -0.11285023378529478], [7, 1.7822469410109834, 1.210485203211592, 1.253518123263701], [6, -1.818984686543881, 0.7153232165819607, 0.11139710831424458], [8, -1.1264377505623782, 1.601465628343012, 0.5750845206190044], [8, -3.094815694984495, 0.9779879466414739, -0.37823973998437105], [1, -2.396024500879165, -2.51618694120349, 0.6573647192566833], [1, -3.43987738944728, -1.2690478047103397, 0.4539499387026505], [1, -1.6290090508718056, -1.0539530036039504, -1.082888913902403], [1, 0.21500786521347212, -0.585479070170717, 1.297639032212872], [1, -0.10095320536591046, -2.220571905834812, 0.7537960248937426], [1, 1.907809384585309, -1.5766563762620842, -0.31529462539361325], [1, 0.6688803181701908, -1.6030673651279468, -1.5489412557068576], [1, 1.9120870512035941, 0.31579618531070086, -2.05537450495579], [1, 0.5148824830934312, 0.9755580362298248, -1.2405129983326593], [1, 3.293639976922164, 0.5416522916980459, -0.04139924627510559], [1, 2.5981008368690275, 2.0777918816908065, -0.5420835778419953], [1, 2.378390193601548, 1.865171104917911, 1.7844509151050416], [1, 0.8663500397832878, 1.6784792631200973, 1.1673469065385045], [1, -3.234242008582948, 1.9446001122657717, -0.21867712740020134]] },
    oracle: { energy: -487.74428105991785, source: 'research/release-0.4.0/library-census/census.json rows[lysine].energyEh', what: 'PySCF 2.14 RHF, cart=True, the vendored STO-3G decimals (Sol\'s census; MEASURED there)' },
    stem: { inchiKey: 'KDXKERNSBIXSRK-YFKPBYRVSA-N', pubchemCid: 5962, identifiers: 'L-lysine; InChIKey and CID entered from memory and UNVERIFIED — S4b checks them against PubChem before the BIO section ships',
      blurb: ['An essential amino acid: the backbone of glycine with a four-carbon chain ending in a second amine (ε-NH₂).',
        'At 64 Cartesian AOs it fills the field kernel\'s widest tier exactly; past the live cap, it opens only from this record.'] } },
];

/* standard atomic weights (IUPAC conventional values), Z ≤ 36 — the vendored STO-3G's reach */
const MASS = [0, 1.008, 4.0026, 6.94, 9.0122, 10.81, 12.011, 14.007, 15.999, 18.998, 20.180, 22.990, 24.305, 26.982, 28.085, 30.974, 32.06,
  35.45, 39.95, 39.098, 40.078, 44.956, 47.867, 50.942, 51.996, 54.938, 55.845, 58.933, 58.693, 63.546, 65.38, 69.723, 72.630, 74.922, 78.971, 79.904, 83.798];
const DEBYE = 2.541746473;                                         // debye per atomic unit of dipole (e·a₀)
const EV = 27.211386245988;
const sha = (b) => createHash('sha256').update(b).digest('hex');
const f64 = (a) => ({ $f64: Buffer.from(Float64Array.from(a).buffer).toString('base64') });
const i32 = (a) => ({ $i32: Buffer.from(Int32Array.from(a).buffer).toString('base64') });
const bse = Object.fromEntries(Object.entries(BASIS_FILES).map(([k, f]) => [k, { file: 'lab/vendor/bse/' + f, text: readFileSync(LAB + 'vendor/bse/' + f, 'utf8') }]));
for (const [k, b] of Object.entries(bse)) chemRegister(k, JSON.parse(b.text));

function rowOf(e) {
  const m = MOLECULE_BY_ID.get(e.id);
  if (m && !m.library) return m;                                    // a molecule lab/molecules.js already lists (benzene)
  if (!e.molecule) throw new Error(`orbital-library: ${e.id} is neither in lab/molecules.js nor defined here`);
  return { id: e.id, ...e.molecule };
}
function build(e) {
  const row = rowOf(e), charge = row.charge || 0, sym = row.symmetry || { group: 'C1' };
  const atoms = row.ang.map(([Z, x, y, z]) => ({ Z, x: x * ANGSTROM, y: y * ANGSTROM, z: z * ANGSTROM }));   // moleculeAtoms' own arithmetic
  const msg = { atoms, basis: e.basis, charge, symmetry: sym }, t0 = performance.now();
  const g = chemGround(msg), sp = chemSpectrum(msg);
  const st = e.states ? chemStates(msg) : null, X = st ? chemStateVectors({ ks: [...Array(st.count).keys()] }).X : null;
  const ms = performance.now() - t0, n = g.nAO, nocc = g.nocc, d = nocc * (n - nocc);
  if (!g.converged) throw new Error(`orbital-library: ${e.id} did not converge — never a record that fails`);
  if (g.stability && g.stability.minimum === false) throw new Error(`orbital-library: ${e.id}'s RHF reference is not a minimum`);
  const oracleE = e.oracle.energy ?? e.oracle.path.reduce((o, k) => o[k], JSON.parse(readFileSync(fileURLToPath(new URL('../' + e.oracle.file, import.meta.url)), 'utf8')));
  const delta = g.energy - oracleE;
  if (!(Math.abs(delta) <= 1e-8)) throw new Error(`orbital-library: ${e.id} is ${delta} Eh from its oracle — no record`);
  /* the ground as the wire carries it, minus the clocks */
  const { timings, stage, eps, C, D, shells, ...wire } = g, names = { ...wire.names }; delete names.ms;
  const dom = (k) => { const q = []; for (let r = 0; r < d; r++) for (let j = 0; j < 4; j++) { const p = sp.roots[r].dominant[j]; q.push(p ? k(p) : (k === domI || k === domA ? -1 : 0)); } return q; };
  const domI = (p) => p.i, domA = (p) => p.a;
  const nm = names.reliable ? names.mos : null, gap = g.eps[nocc] - g.eps[nocc - 1];
  const homo = nm ? nm[nocc - 1] : null, ie = CURATED_IE[e.id];
  const over = row.predictedMs !== undefined ? row.predictedMs > CAP_MS * 1.02
    : predicted(row.ang, charge) > CAP_MS * 1.02;
  const record = {
    schema: SCHEMA, kind: 'lambdawaves.orbital-record', id: e.id, basis: e.basis, name: row.name, formula: row.formula,
    generator: 'tools/orbital-library.mjs — lab/mathworker.js chemGround → chemSpectrum' + (st ? ' → chemStates / chemStateVectors' : '') + ' in node',
    input: { atoms, charge, multiplicity: 1, basis: e.basis, basisFile: bse[e.basis].file, basisSha256: sha(bse[e.basis].text), symmetry: sym },
    caps: { orbitals: true, states: !!st, rpa: true, tdhf: !over },
    ground: { ...wire, names },
    orbitals: { eps: f64(g.eps), C: f64(g.C), D: f64(g.D) },
    spectrum: { omega: f64(sp.roots.map((r) => r.omega)), omegaTDA: f64(sp.roots.map((r) => r.omegaTDA)), f: f64(sp.roots.map((r) => r.f)),
      mu: f64(sp.roots.flatMap((r) => Array.from(r.mu))), domI: i32(dom(domI)), domA: i32(dom(domA)), domX: f64(dom((p) => p.x)), domY: f64(dom((p) => p.y)),
      tdaOmega: f64(sp.tda.map((r) => r.omega)), tdaF: f64(sp.tda.map((r) => r.f)), tdaMu: f64(sp.tda.flatMap((r) => Array.from(r.mu))) },
    ...(st ? { states: { d: st.count, omega: f64(st.omega), f: f64(st.f), mu: f64(st.mu), cluster: i32(st.cluster), size: i32(st.size), pivot: f64(st.pivot), X: f64(X), rMO: f64(st.rMO) } } : {}),
    stem: { formula: row.formula, pointGroup: names.group || null, frame: names.frame || null, approximate: !!names.approximate,
      mass: +atoms.reduce((s, a) => s + MASS[a.Z], 0).toFixed(3), massUnit: 'u (IUPAC conventional atomic weights)', charge, multiplicity: 1,
      dipoleDebye: +(Math.hypot(...g.dipole) * DEBYE).toFixed(4),
      gapEh: gap, gapEv: +(gap * EV).toFixed(4), homo: homo ? homo.label + ' · ' + homo.frontier : 'HOMO', geometrySource: row.source,
      inchiKey: e.stem.inchiKey, pubchemCid: e.stem.pubchemCid, ...(e.stem.identifiers ? { identifiers: e.stem.identifiers } : {}), blurb: e.stem.blurb,
      ies: ie ? { ev: ie.ev, source: ie.source, status: 'UNCHECKED: entered from memory in S1 (S1-NAMES-BUILD.md); verify against NIST SRD 101 and the LEGAL-PROVENANCE reading before any store build' } : null,
      sources: ['geometry: ' + row.source, 'energy oracle: ' + (e.oracle.file || e.oracle.source), 'basis: ' + bse[e.basis].file + ' (Basis Set Exchange, vendored)'] },
    page: moleculeLatex({ molecule: row, basis: e.basis, charge, ground: { energy: g.energy, eps: g.eps, nocc, nAO: n, names } }),
    oracle: { energy: oracleE, source: e.oracle.file ? e.oracle.file + ' ' + e.oracle.path.join('.') : e.oracle.source, what: e.oracle.what, delta },
  };
  const text = JSON.stringify(record, null, 1) + '\n', bytes = Buffer.from(text), hash = sha(bytes);
  const bad = validateRecord(JSON.parse(text));
  if (bad.length) throw new Error(`orbital-library: ${e.id} fails validation — ${bad.join('; ')}`);
  /* the record opens through the worker's own chem.open with no solver call, and answers what it was made from */
  const before = chemSolverCalls(), o = chemOpen({ lib: JSON.parse(text), hash, basis: e.basis });
  if (chemSolverCalls() !== before || o.energy !== g.energy || o.C.some((v, i) => v !== g.C[i])) throw new Error(`orbital-library: ${e.id}'s record does not open to its own solve`);
  const catalogue = { id: e.id, basis: e.basis, hash, bytes: bytes.length, section: e.section, nAO: n, nocc, caps: record.caps,
    ...(MOLECULE_BY_ID.has(e.id) && !MOLECULE_BY_ID.get(e.id).library ? {} : { molecule: e.molecule }) };
  return { text, hash, catalogue, ms, nAO: n, d, energy: g.energy, delta };
}
/** the live-cost prediction for a molecule lab/molecules.js does not list (lab/molecules.js does the same for its rows) */
function predicted(ang, charge) { const c = counts(ang), nocc = (c.nElec - charge) / 2; return COST.a * eriWork(c.widths) + COST.b * rpaWork(c.nAO, nocc) + COST.c; }

/* ── 0.4.0 S4c · THE TEST FIXTURES (S4c's own road, beside the catalogue: never ENTRIES, never the gate, never lab/library.json) ──
 *   node tools/orbital-library.mjs --fixture tryptophan [--check]      (and C20H20)
 * ONE schema-1 record by the same build() above, from a census row — its geometry and its PySCF energy as the oracle — written
 * to tests/fixtures/record-<id>.json: the 87- and 120-AO inputs the cap-128 χ tier is checked against (tools/perf/s4c-kernel.mjs).
 * Never shipped.  `--check` re-solves and compares the bytes.  S4b's own BIO / ORGANIC records supersede these as content. */
const CENSUS = 'research/release-0.4.0/library-census/census.json';
const SUB = (s) => s.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
function fixtureEntry(id) {
  const row = JSON.parse(readFileSync(fileURLToPath(new URL('../' + CENSUS, import.meta.url)), 'utf8')).rows.find((r) => r.id === id);
  if (!row || !row.converged || !row.geometry || !Array.isArray(row.geometry.atomsAngstrom)) throw new Error(`orbital-library: no converged census row '${id}'`);
  return { id, basis: 'sto-3g', section: 'S4C-FIXTURE', states: false,
    molecule: { name: row.name, formula: '<m>' + SUB(row.formula) + '</m>', charge: row.charge || 0, symmetry: { group: 'C1' },
      source: 'NOT A MEASUREMENT: the S4 census\'s ' + row.name + ' — ' + row.geometry.source + ' (' + CENSUS + ' rows[' + id + '])', ang: row.geometry.atomsAngstrom },
    oracle: { energy: row.energyEh, source: CENSUS + ' rows[' + id + '].energyEh', what: 'PySCF 2.14 RHF, cart=True, the vendored STO-3G decimals (Sol\'s census; MEASURED there)' },
    stem: { inchiKey: null, pubchemCid: null, identifiers: 'a TEST FIXTURE (0.4.0 S4c): identifiers are S4b\'s, on its own record',
      blurb: [row.name + ' at ' + row.nAO_STO3G + ' Cartesian AOs: an input for the field kernel\'s cap-128 tier, not library content.',
        'Point group taken as C1 here (the names are S4b\'s record\'s); the energy agrees with the census\'s PySCF oracle or there is no file.'] } };
}
/* ── 0.4.0 S4c · THE FRONTIER RECORD (S4c's own road: a separate function, never ENTRIES, never the gate) ──────────────────
 * C₆₀ is 300 AOs: no live road solves it and no χ tile holds its density, so its record is PySCF's, re-encoded — Sol's dump
 * research/release-0.4.0/library-census/c60-frontier.json (PySCF 2.14 direct RHF on the vendored STO-3G decimals, the HOMO set
 * h_u ×5 and the LUMO set t1u ×3 ALREADY in the app's AO order and normalisation, its water conversion proof inside at
 * 1.03e-12).  caps: orbitals ONLY — ε for all 300 and the eight frontier columns (`ground.cols`), no D, no spectrum, no
 * states; the field draws them through ORB_WGSL.  The geometry is Sol's DRAFT (equal-edge ideal I_h, experimental status
 * UNVERIFIED) and the record says so; the I_h names are 0.4.1 BUCKYBALL, so the levels are named by energy only.
 * Checked here or there is no file: the basis file's sha-256 is the dump's, the app's own AOs (md.js basisFrom +
 * molecular-field.js evaluator) contracted with the columns answer PySCF's GTOval_cart at Sol's 92 points
 * (c60-pyscf-samples.json) to ≤ 1e-10, and every level's spread is under names.js's 2e-10 Eh. */
const FRONTIERS = [{ id: 'C60', basis: 'sto-3g', section: 'LATTICE', name: 'buckminsterfullerene', formula: '<m>C₆₀</m>',
  dump: 'research/release-0.4.0/library-census/c60-frontier.json', samples: 'research/release-0.4.0/library-census/c60-pyscf-samples.json' }];
function buildFrontier(e) {
  const read = (p) => JSON.parse(readFileSync(fileURLToPath(new URL('../' + p, import.meta.url)), 'utf8'));
  const F = read(e.dump), P = read(e.samples), b0 = bse[e.basis];
  if (F.basis.sha256 !== sha(b0.text)) throw new Error(`orbital-library: ${e.id}'s dump was made on another ${e.basis} file`);
  const ang = F.geometry.atomsAngstrom, atoms = ang.map(([Z, x, y, z]) => ({ Z, x: x * ANGSTROM, y: y * ANGSTROM, z: z * ANGSTROM }));
  const b = basisFrom(atoms, JSON.parse(b0.text), { cart: true }), n = b.n, eps = F.solver.orbitalEnergiesEh, nocc = F.solver.occupations.filter((o) => o === 2).length;
  const sets = [F.frontier.HOMO, F.frontier.LUMO], cols = sets.flatMap((s) => s.indices), cs = sets.flatMap((s) => s.coefficientColumns), m = cols.length;
  if (eps.length !== n || cs.some((c) => c.length !== n) || !F.solver.converged) throw new Error(`orbital-library: ${e.id}'s dump does not fit ${n} AOs`);
  const ev = evaluator(b.shells); let worst = 0;
  P.pointsBohr.forEach((p, q) => { const a = ev.ao(p); cs.forEach((c, j) => { let s = 0; for (let i = 0; i < n; i++) s += c[i] * a[i]; worst = Math.max(worst, Math.abs(s - P.signedValues[q][j])); }); });
  if (!(worst <= 1e-10)) throw new Error(`orbital-library: ${e.id}'s columns on the app's AOs miss PySCF's orbital by ${worst} — the AO order or normalisation is not the app's`);
  const C = new Float64Array(n * m); cs.forEach((c, j) => { for (let i = 0; i < n; i++) C[i * m + j] = c[i]; });   // row-major n × m, as C is n × n
  const names = nameOrbitals({ atoms, eps, nocc, basis: b, converged: true }, null), ch = characters({ atoms, basis: b }, names);
  names.mos.forEach((mo, i) => { mo.character = ch[i]; }); names.core = Math.min(coreCount(atoms), nocc); delete names.axes; delete names.ms;
  names.reason = 'C₆₀\'s I_h names are 0.4.1 BUCKYBALL (Sol computed and checked them: HOMO 6h_u, LUMO 7t₁u); here the levels are named by energy';
  for (const s of sets) if (!(s.energySpreadEh < 2e-10)) throw new Error(`orbital-library: ${e.id}'s ${s.irrep} set spreads ${s.energySpreadEh} Eh`);
  const half = atoms.reduce((s, a) => Math.max(s, Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)), 0) + 6, gap = eps[nocc] - eps[nocc - 1];
  const source = `DRAFT GEOMETRY, NOT A MEASUREMENT: ${F.geometry.why} (${F.geometry.source}; experimental status ${F.geometry.experimentalStatus})`;
  const molecule = { name: e.name, formula: e.formula, charge: 0, symmetry: { group: 'C1' }, source, ang };
  const ground = { energy: F.solver.energyEh, Enuc: nuclearRepulsion(atoms), nocc, nAO: n, order: b.order, hash: b.hash, basis: e.basis, charge: 0,
    electrons: 2 * nocc, converged: true, dipole: [0, 0, 0], half, stability: null, solutions: [], names, cols };
  const record = {
    schema: SCHEMA, kind: 'lambdawaves.orbital-record', id: e.id, basis: e.basis, name: e.name, formula: e.formula,
    generator: 'tools/orbital-library.mjs buildFrontier — PySCF\'s orbitals re-encoded (' + e.dump + '); no app solve: 300 AOs are past every live road',
    input: { atoms, charge: 0, multiplicity: 1, basis: e.basis, basisFile: b0.file, basisSha256: sha(b0.text), symmetry: molecule.symmetry },
    caps: { orbitals: true, states: false, rpa: false, tdhf: false },
    ground, orbitals: { eps: f64(eps), C: f64(C) },
    stem: { formula: e.formula, pointGroup: null, frame: null, approximate: false, mass: +atoms.reduce((s, a) => s + MASS[a.Z], 0).toFixed(3), massUnit: 'u (IUPAC conventional atomic weights)',
      charge: 0, multiplicity: 1, dipoleDebye: 0, gapEh: gap, gapEv: +(gap * EV).toFixed(4), homo: `HOMO (${F.frontier.HOMO.irrep} ×5) · LUMO (${F.frontier.LUMO.irrep} ×3)`, geometrySource: source,
      inchiKey: null, pubchemCid: null, identifiers: 'buckminsterfullerene; InChIKey and CID are S4b\'s to enter and verify',
      blurb: ['Sixty carbons on a truncated icosahedron: the HOMO a five-fold h_u set, the LUMO a three-fold t₁u set — eight orbitals drawn by the field\'s orbital-only kernel.',
        'Its density, its I_h names and a geometry checked against experiment are 0.4.1 BUCKYBALL; this record carries the frontier orbitals only.'],
      ies: null, sources: ['geometry: ' + source, 'orbitals and energy: ' + e.dump + ' (PySCF ' + F.solver.pyscf + ', ' + F.solver.method + ')', 'field check: ' + e.samples, 'basis: ' + b0.file + ' (Basis Set Exchange, vendored)'] },
    page: moleculeLatex({ molecule: { id: e.id, ...molecule }, basis: e.basis, charge: 0, ground: { energy: ground.energy, eps, nocc, nAO: n, names } }),
    oracle: { energy: F.solver.energyEh, source: e.dump + ' solver.energyEh', what: 'PySCF ' + F.solver.pyscf + ' — the record IS PySCF\'s; its check is the field at Sol\'s 92 points', delta: 0, fieldMaxAbsErr: worst },
  };
  const text = JSON.stringify(record, null, 1) + '\n', bytes = Buffer.from(text), hash = sha(bytes);
  const bad = validateRecord(JSON.parse(text));
  if (bad.length) throw new Error(`orbital-library: ${e.id} fails validation — ${bad.join('; ')}`);
  const catalogue = { id: e.id, basis: e.basis, hash, bytes: bytes.length, section: e.section, nAO: n, nocc, caps: record.caps, molecule };
  return { text, hash, catalogue, ms: 0, nAO: n, d: 0, energy: ground.energy, delta: 0, fieldErr: worst };
}
if (args.includes('--fixture')) {
  const id = args[args.indexOf('--fixture') + 1], e = fixtureEntry(id), r = build(e);
  const file = fileURLToPath(new URL(`../tests/fixtures/record-${id}.json`, import.meta.url));
  console.log(`${id} · ${r.nAO} AO · d ${r.d} · E ${r.energy.toFixed(12)} (oracle Δ ${r.delta.toExponential(1)}) · ${(r.text.length / 1024).toFixed(1)} KB · generated in ${(r.ms / 1000).toFixed(1)} s · ${r.hash.slice(0, 12)}`);
  if (CHECK) { const same = existsSync(file) && readFileSync(file, 'utf8') === r.text; console.log(same ? `fixture ${id}: in step` : `fixture ${id}: OUT OF STEP`); process.exit(same ? 0 : 1); }
  writeFileSync(file, r.text); console.log('wrote', file); process.exit(0);
}

const out = [], fail = [];
const disk = existsSync(CATALOGUE) ? JSON.parse(readFileSync(CATALOGUE, 'utf8')) : { rows: [] };
for (const e of ENTRIES) {
  if (ONLY && !ONLY.has(e.id)) {                                      // re-hashed from disk, not re-solved
    const r = disk.rows.find((x) => x.id === e.id && x.basis === e.basis);
    if (!r) { fail.push(`${e.id}: not in the catalogue on disk`); continue; }
    out.push({ catalogue: r, hash: r.hash, text: readFileSync(LAB + recordPath(r.hash), 'utf8'), skipped: true }); continue;
  }
  const r = build(e); out.push(r);
  console.log(`${e.id.padEnd(8)} ${e.basis} · ${r.nAO} AO · d ${r.d} · E ${r.energy.toFixed(12)} (oracle Δ ${r.delta.toExponential(1)}) · ${(r.text.length / 1024).toFixed(1)} KB · caps ${Object.entries(r.catalogue.caps).filter(([, v]) => v).map(([k]) => k).join('+')} · generated in ${(r.ms / 1000).toFixed(2)} s · ${r.hash.slice(0, 12)}`);
}
for (const e of FRONTIERS) {                                          // S4c: re-encoded every run (no solve), so --only never skips one
  const r = buildFrontier(e); out.push(r);
  console.log(`${e.id.padEnd(8)} ${e.basis} · ${r.nAO} AO · frontier ${r.catalogue.caps.orbitals ? 'orbitals only' : ''} · E ${r.energy.toFixed(12)} (PySCF's) · field vs PySCF ${r.fieldErr.toExponential(1)} · ${(r.text.length / 1024).toFixed(1)} KB · ${r.hash.slice(0, 12)}`);
}
const catalogueText = JSON.stringify({ schema: SCHEMA, generator: 'tools/orbital-library.mjs', note: 'the catalogue lab/molecules.js reads; each row\'s record is lab/library/<hash>.json — deployed, never precached (sw.js DATA)',
  rows: out.map((r) => r.catalogue) }, null, 1) + '\n';
const want = new Set(out.map((r) => recordPath(r.hash).slice('library/'.length)));
const present = existsSync(LAB + 'library') ? readdirSync(LAB + 'library') : [];
if (CHECK) {
  for (const r of out) {
    const p = LAB + recordPath(r.hash);
    if (!existsSync(p)) fail.push(`${r.catalogue.id}: ${recordPath(r.hash)} is missing`);
    else if (sha(readFileSync(p)) !== r.hash) fail.push(`${r.catalogue.id}: ${recordPath(r.hash)} does not hash to its name`);
    else if (!r.skipped && readFileSync(p, 'utf8') !== r.text) fail.push(`${r.catalogue.id}: the record on disk is not what the solver writes`);
    else { const bad = validateRecord(JSON.parse(readFileSync(p, 'utf8'))); if (bad.length) fail.push(`${r.catalogue.id}: ${bad.join('; ')}`); }
  }
  if (!existsSync(CATALOGUE) || readFileSync(CATALOGUE, 'utf8') !== catalogueText) fail.push('lab/library.json is out of step');
  for (const f of present) if (!want.has(f)) fail.push(`lab/library/${f} is reached by no catalogue row`);
  if (fail.length) { console.log('orbital-library: OUT OF STEP — run `node tools/orbital-library.mjs`\n  ' + fail.join('\n  ')); process.exit(1); }
  console.log(`orbital-library: in step — ${out.length} records, ${out.reduce((s, r) => s + Buffer.byteLength(r.text), 0)} B, lab/library.json ${catalogueText.length} B, nothing else in lab/library/`);
} else {
  mkdirSync(LAB + 'library', { recursive: true });
  for (const r of out) writeFileSync(LAB + recordPath(r.hash), r.text);
  for (const f of present) if (!want.has(f)) { unlinkSync(LAB + 'library/' + f); console.log('removed lab/library/' + f + ' (no row reaches it)'); }
  writeFileSync(CATALOGUE, catalogueText);
  console.log(`orbital-library: wrote ${out.length} records and lab/library.json — now run node tests/pwa.test.mjs --write`);
}
