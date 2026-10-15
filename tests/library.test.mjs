// 0.4.0 S4a · THE PROOF (PLAN B2, F5): a library record opens through the worker's own chem.open with ZERO solver calls and
// answers what a fresh solve answers — energies, occupations, the signed fields, the canonical subspaces, the names, the RPA
// sticks, the STATES ladder — bit for bit.  Benzene is the proof (it also solves live, so cached = fresh can be measured);
// lysine, past the cap, opens only from its record and refuses STATES and TDHF with a sentence.  Node only.
// The byte-exact half is tools/orbital-library.mjs --check (run it after a solver, names or gauge change: it re-solves lysine).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as W from '../lab/mathworker.js';
import { validateRecord, decodeRecord, recordPath } from '../lab/library.js';
import { MOLECULE_BY_ID, MOLECULES, RECORD_ONLY, SECTIONS, moleculeAtoms, optionLabel, CAP_MS } from '../lab/molecules.js';
import { evaluator, shellsFromField } from '../lab/molecular-field.js';

const at = (rel) => fileURLToPath(new URL(rel, import.meta.url));
W.chemRegister('sto-3g', JSON.parse(readFileSync(at('../lab/vendor/bse/sto-3g-v1.json'), 'utf8')));
const CAT = JSON.parse(readFileSync(at('../lab/library.json'), 'utf8'));
const row = (id) => CAT.rows.find((r) => r.id === id);
const load = (id) => JSON.parse(readFileSync(at('../lab/' + recordPath(row(id).hash)), 'utf8'));
const same = (a, b, what) => { assert.equal(a.length, b.length, what + ': length'); for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) assert.fail(`${what}[${i}]: ${a[i]} ≠ ${b[i]}`); };
const calls = () => W.chemSolverCalls();

/* 1 · every record validates, and a damaged one does not */
for (const r of CAT.rows) assert.deepEqual(validateRecord(load(r.id)), [], r.id + ' does not validate');
const broken = load('C6H6'); delete broken.orbitals.C; broken.caps.tdhf = 'yes';
assert.deepEqual(validateRecord(broken), ['caps.tdhf', 'orbitals: ε, C and D at nAO']);
/* S4b: a record is the geometry it was made at, with finite numbers — a moved atom or a NaN in C is refused, not opened */
const moved = load('C6H6'); moved.input.atoms[3].x += 1e-9;
assert.deepEqual(validateRecord(moved), ['input.atoms: not the geometry the record was made at (atomsSha256)']);
const nan = load('C6H6'), Cb = Buffer.from(nan.orbitals.C.$f64, 'base64'), Cn = new Float64Array(Cb.buffer.slice(Cb.byteOffset, Cb.byteOffset + Cb.length)); Cn[7] = NaN;
nan.orbitals.C = { $f64: Buffer.from(Cn.buffer).toString('base64') };
assert.deepEqual(validateRecord(nan), ['orbitals: a non-finite ε, C or D']);

/* 2 · BENZENE, FRESH: the live road (two solver calls: the SCF and the RPA) */
const m = MOLECULE_BY_ID.get('C6H6'), msg = { atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', charge: 0, symmetry: m.symmetry };
let c0 = calls();
const g = W.chemGround(msg), sp = W.chemSpectrum(msg), st = W.chemStates(msg), X = W.chemStateVectors({ ks: [...Array(st.count).keys()] }).X;
assert.equal(calls() - c0, 2, 'a fresh benzene is one SCF and one RPA');

/* 3 · BENZENE, FROM ITS RECORD: zero solver calls through every op a window asks for on open */
const rec = load('C6H6');
c0 = calls();
const t0 = performance.now(), o = W.chemOpen({ lib: rec, hash: row('C6H6').hash, basis: 'sto-3g' }), openMs = performance.now() - t0;
const osp = W.chemSpectrum(msg), ost = W.chemStates(msg), oX = W.chemStateVectors({ ks: [...Array(ost.count).keys()] }).X;
const drive = W.chemDriveInit({ pol: 'x', omega: 0.4, e0: 0.01, lanes: [{ key: -1, re: 1, im: 0 }] });
assert.equal(calls() - c0, 0, 'chem.open, chem.spectrum, chem.states, chem.state.vectors and chem.drive.init on a record ran the solver');
assert.ok(drive && drive.N === st.count + 1, 'the drive builds on the record\'s states');

/* energies and occupations */
assert.ok(Object.is(o.energy, g.energy) && o.nocc === g.nocc && o.nAO === g.nAO && o.electrons === g.electrons && o.hash === g.hash && o.converged === true, 'energy / occupations');
same(o.eps, g.eps, 'ε'); same(o.D, g.D, 'D');
/* the canonical subspaces and the signed fields: C is the same doubles, so every orbital and every degenerate subspace is the
   same function — and it is evaluated, HOMO and LUMO and the density, at points off every symmetry element */
same(o.C, g.C, 'C (the canonical gauge)');
const ev = evaluator(shellsFromField(o.shells)), evF = evaluator(shellsFromField(g.shells));
const pts = [[0.31, 0.77, 0.52], [-1.9, 0.4, -0.66], [2.2, -1.3, 0.9], [0.05, -2.6, -0.2]];
for (const p of pts) for (const k of [g.nocc - 2, g.nocc - 1, g.nocc, g.nocc + 1]) assert.ok(Object.is(ev.orbital(o.C, k, p), evF.orbital(g.C, k, p)), `ψ_${k} at ${p}`);
for (const p of pts) assert.ok(Object.is(ev.density(o.D, p), evF.density(g.D, p)), 'ρ at ' + p);
/* the names: the worker's own, minus the clock */
const strip = (N) => { const { ms, ...rest } = N; return JSON.parse(JSON.stringify(rest)); };
assert.deepEqual(strip(o.names), strip(g.names), 'the names');
assert.equal(o.names.mos[o.nocc - 1].label, '1e1g'); assert.equal(o.names.group, 'D6h');
/* the RPA sticks, the TDA ladder, and the STATES ladder */
assert.deepEqual(JSON.parse(JSON.stringify(osp.roots)), JSON.parse(JSON.stringify(sp.roots.map((r) => ({ omega: r.omega, omegaTDA: r.omegaTDA, f: r.f, mu: Array.from(r.mu), dominant: r.dominant })))), 'the RPA sticks');
assert.deepEqual(osp.tda, sp.tda, 'the TDA ladder');
for (const k of ['omega', 'f', 'mu', 'cluster', 'size', 'pivot', 'rMO']) same(ost[k], st[k], 'states.' + k);
same(oX, X, 'states.X');
assert.deepEqual(o.record, { id: 'C6H6', hash: row('C6H6').hash, caps: { orbitals: true, states: true, rpa: true, tdhf: true } });

/* 4 · TDHF on the record is the ONE solve road, on demand — under the cap, a KICK solves live and keeps the record's ladder */
c0 = calls();
const rt = W.chemRtInit({ ...msg, dt: 0.01, kick: { axis: 'x', kappa: 1e-3 }, restartEvery: 0 });
assert.ok(rt.ok && calls() - c0 === 1, 'a KICK on benzene\'s record runs the live SCF once (and not the RPA again)');
same(W.chemStates(msg).omega, st.omega, 'the STATES ladder after the live solve');

/* 5 · LYSINE, past the cap: opens from its record with no solver call; STATES and TDHF are refused with a sentence */
const L = load('lysine'), Lm = { atoms: decodeRecord(L).atoms, basis: 'sto-3g', charge: 0 };
c0 = calls();
const lo = W.chemOpen({ lib: L, hash: row('lysine').hash, basis: 'sto-3g' }), lsp = W.chemSpectrum(Lm);
assert.equal(calls() - c0, 0, 'lysine\'s open ran the solver');
assert.ok(lo.nAO === 64 && lo.nocc === 40 && Math.abs(lo.energy - L.oracle.energy) < 1e-8 && lsp.roots.length === 960, 'lysine: 64 AO, 40 occupied, at its PySCF oracle, 960 sticks');
assert.throws(() => W.chemStates(Lm), /stores no CIS states/);
assert.throws(() => W.chemRtInit({ ...Lm, kick: { axis: 'x' } }), /past the live cap/);
assert.equal(calls() - c0, 0, 'a refusal ran the solver');
/* …and the worker's wire says so as an answer (`refused`), never as an `error` that would send rack.js to the frame thread */
const before = calls();
assert.throws(() => W.chemOpen({ lib: broken, basis: 'sto-3g' }), /failed validation/);
assert.equal(calls(), before);

/* 5b · THE STALE OPEN (S4a-VERIFY B1): another record's open replaces the worker's ONE cache; a later op for the past-cap molecule
       must then be a REFUSAL, never a live solve — the worker remembers every record-only key it opened.  (The frame-thread half of
       the same law is lab/chemview.js: no worker post for a solve the hand has left; tests/library.browser-test.mjs presses it.) */
c0 = calls();
W.chemOpen({ lib: L, hash: row('lysine').hash, basis: 'sto-3g' });           // lysine is current…
W.chemOpen({ lib: rec, hash: row('C6H6').hash, basis: 'sto-3g' });           // …then benzene's open lands and the cache is benzene's
assert.throws(() => W.chemSpectrum(Lm), /opens only from its record, which is no longer the worker's current molecule/);
assert.throws(() => W.chemStates(Lm), /opens only from its record, which is no longer/);
assert.throws(() => W.chemRtInit({ ...Lm, kick: { axis: 'x' } }), /opens only from its record, which is no longer/);
assert.equal(calls() - c0, 0, 'a cache miss on a record-only molecule ran the solver');
W.chemOpen({ lib: L, hash: row('lysine').hash, basis: 'sto-3g' });           // opened again, it answers again, still with no solver call
assert.equal(W.chemSpectrum(Lm).roots.length, 960); assert.equal(calls() - c0, 0);

/* 5c · C₆₀, THE FRONTIER RECORD (0.4.0 S4c): PySCF's orbitals re-encoded — ε for all 300 and, since 0.6.1 F1, every occupied column and the LUMO set (ground.cols);
       it opens with no solver call, answers whole (no spectrum to wait for), has no density, refuses everything it does not carry,
       and its columns are the dump's, laid out n × n where every reader indexes them */
const C60 = load('C60'), Cd = decodeRecord(C60), Cm = { atoms: Cd.atoms, basis: 'sto-3g', charge: 0 };
const dump = JSON.parse(readFileSync(at('../research/release-0.4.0/library-census/c60-occupied.json'), 'utf8'));
assert.deepEqual(Cd.cols, Array.from({ length: 183 }, (_, k) => k)); assert.equal(Cd.D, null);
assert.deepEqual(C60.caps, { orbitals: true, states: false, rpa: false, tdhf: false });
assert.ok(/DRAFT GEOMETRY/.test(C60.stem.geometrySource) && /UNVERIFIED/.test(C60.stem.geometrySource), 'the record says its geometry is a draft');
dump.coefficientColumns.forEach((c, j) => same(Float64Array.from({ length: 300 }, (_, i) => Cd.C[i * 300 + Cd.cols[j]]), Float64Array.from(c), 'C60 column ' + Cd.cols[j]));
c0 = calls();
const co = W.chemOpen({ lib: C60, hash: row('C60').hash, basis: 'sto-3g' });
assert.ok(co.nAO === 300 && co.nocc === 180 && co.D === null && co.roots.length === 0 && co.energy === dump.solver.energyEh, 'C60 opens whole: 300 AO, 180 occupied, no D, PySCF\'s energy');
assert.throws(() => W.chemSpectrum(Cm), /frontier orbitals only/);
assert.throws(() => W.chemStates(Cm), /refused|stores no|only/);
assert.throws(() => W.chemRtInit({ ...Cm, kick: { axis: 'x' } }), /past the live cap/);
assert.equal(calls() - c0, 0, 'C60 ran the solver');
const badC = load('C60'); badC.ground.cols = [176, 175]; assert.ok(validateRecord(badC).some((w) => /frontier/.test(w)), 'unsorted frontier columns validate');

/* 6 · THE CATALOGUE IN THE TABLE (lab/molecules.js): a record's input is the menu's own atoms (so the worker's solve-cache key is
       the one a window asks with — a mismatch would make a past-cap molecule a live solve), and the benzene-cap law reads it */
for (const r of CAT.rows) assert.deepEqual(load(r.id).input.atoms, moleculeAtoms(r.id), r.id + ': the record\'s atoms are not the menu\'s');
const lys = MOLECULE_BY_ID.get('lysine');
assert.deepEqual(RECORD_ONLY.map((x) => x.id), CAT.rows.filter((r) => r.molecule).map((r) => r.id), 'the record-only rows are the catalogue\'s own molecules');
assert.ok(RECORD_ONLY.includes(lys) && RECORD_ONLY.some((x) => x.id === 'C60'), 'lysine and C60 (S4c\'s frontier record) are record-only rows');
assert.ok(!MOLECULES.includes(lys) && lys.over && lys.recordOnly && !lys.disabled && lys.reason === null, 'lysine: past the cap, DOWNLOAD, never DISABLED');
assert.equal(optionLabel(lys, false), 'C₆H₁₄N₂O₂ · 64 AO · record · DOWNLOAD'); assert.equal(optionLabel(lys, true), 'C₆H₁₄N₂O₂ · 64 AO · record');
assert.ok(!MOLECULE_BY_ID.get('C6H6').recordOnly && MOLECULE_BY_ID.get('C6H6').records['sto-3g'].hash === row('C6H6').hash, 'benzene: under the cap, with its record');
assert.ok(CAP_MS > 1000 && CAP_MS < 2500, 'the refit cap is benzene at ~1.7 s, not 9.6 s: ' + CAP_MS);
assert.equal(L.caps.tdhf, false); assert.equal(rec.caps.tdhf, true);
/* 7 · THE SECTIONS (0.4.0 S4b): every row of the table and of the catalogue sits on exactly one page of the turner, and a catalogue
       row's section is its molecule's */
for (const m of [...MOLECULES, ...RECORD_ONLY]) assert.ok(SECTIONS.includes(m.section), m.id + ' sits on no section');
for (const r of CAT.rows) assert.equal(MOLECULE_BY_ID.get(r.id).section, r.section, r.id + ': the catalogue and the table disagree on its section');
assert.deepEqual(SECTIONS.map((s) => [...MOLECULES, ...RECORD_ONLY].filter((m) => m.section === s).length).reduce((a, b) => a + b, 0), MOLECULES.length + RECORD_ONLY.length);

/* 8 · THE CONTRACT IN THE CATALOGUE (0.5.4 P3): every row carries its oracle, the class of its geometry and a per-quantity status, written by
       tools/orbital-library.mjs from the record's own oracle and row.source; the app writes MEASURED or IMPORTED, never CERTIFIED */
const CLASSES = ['experimental', 'optimised-here', 'computed-reference', 'draft'];
for (const r of CAT.rows) {
  assert.ok(typeof r.oracle.what === 'string' && r.oracle.what.length > 0, r.id + ': oracle.what');
  assert.ok(Number.isFinite(r.oracle.delta) && Math.abs(r.oracle.delta) <= (r.id === 'C60' ? 0 : 1e-8), r.id + ': oracle.delta is finite and within 1e-8 Eh (C60: 0)');
  assert.deepEqual(r.oracle, { what: load(r.id).oracle.what, delta: load(r.id).oracle.delta }, r.id + ': the row says what its record says');
  assert.ok(CLASSES.includes(r.geometry), r.id + ': geometry is one of the four classes');
  assert.deepEqual(r.status, { energy: r.id === 'C60' ? 'IMPORTED' : 'MEASURED', geometry: r.geometry, derivatives: 'UNKNOWN' }, r.id + ': status');
  assert.ok(!/CERTIFIED/.test(JSON.stringify(r)), r.id + ': the app never writes CERTIFIED');
}
assert.ok(CAT.rows.every((r) => r.status.derivatives === 'UNKNOWN'), 'derivatives are UNKNOWN on every row');
/* the COUNT: 2 / 26 / 9 / 1 — and the two experimental rows are the two the sources name */
const count = (c) => CAT.rows.filter((r) => r.geometry === c).length;
assert.deepEqual(CLASSES.map(count), [2, 26, 9, 1], 'geometry classes: experimental / optimised-here / computed-reference / draft');
assert.deepEqual(CAT.rows.filter((r) => r.geometry === 'experimental').map((r) => r.id), ['C6H6', 'TiCl4']);
assert.deepEqual(CAT.rows.filter((r) => r.geometry === 'draft').map((r) => r.id), ['C60']);
/* the live-only molecules: an `oracles` member (not rows — molecule-head pins 38), by id, PySCF's energy from the fixture; none shadows a row */
const SB = JSON.parse(readFileSync(at('./fixtures/oracles/sto-3g-v1.json'), 'utf8')).library;
assert.equal(CAT.rows.length, 38);
assert.ok(CAT.oracles.H2O && CAT.oracles.N2 && CAT.oracles.CH4, 'water, N2 and methane have an oracle');
assert.equal(CAT.oracles.H2O.energy, SB.H2O.energy); assert.ok(/PySCF/.test(CAT.oracles.H2O.what));
assert.deepEqual(MOLECULES.filter((m) => !CAT.rows.some((r) => r.id === m.id)).map((m) => m.id), Object.keys(CAT.oracles), 'every live-only molecule, and only those');
assert.ok(Object.values(CAT.oracles).every((o) => Number.isFinite(o.energy) && o.energy < 0), 'every oracle energy is finite');
const G6 = JSON.parse(readFileSync(at('./fixtures/oracles/6-31+g-star-v1.json'), 'utf8')).molecules;   // 0.6.0 B3b: the 19 6-31+G* energies, nested by basis id
assert.deepEqual(G6.map((m) => CAT.oracles[m.id]['6-31+g-star'].energy), G6.map((m) => m.energy)); assert.equal(Object.values(CAT.oracles).filter((o) => o['6-31+g-star']).length, 19);
assert.deepEqual(MOLECULE_BY_ID.get('H2O').oracle, CAT.oracles.H2O); assert.deepEqual(MOLECULE_BY_ID.get('C6H6').oracle, row('C6H6').oracle);

console.log(`GREEN library: benzene opens from its ${(row('C6H6').bytes / 1024).toFixed(0)} KB record in ${openMs.toFixed(1)} ms with 0 solver calls `
  + `(fresh: 1 SCF + 1 RPA) and equals the fresh solve bit for bit — E, ε, nocc, C, D, ψ and ρ at ${pts.length} points, the names (D6h, HOMO 1e1g), `
  + `${sp.roots.length} RPA sticks, the TDA ladder, the STATES ladder and X (${st.count}²); a KICK solves live once; lysine (64 AO, past the cap) opens `
  + `with 0 calls at its oracle (Δ ${(lo.energy - L.oracle.energy).toExponential(1)} Eh) and refuses STATES and TDHF with a sentence`);
