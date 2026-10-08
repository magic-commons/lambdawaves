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
import { MOLECULE_BY_ID, MOLECULES, RECORD_ONLY, moleculeAtoms, optionLabel, CAP_MS } from '../lab/molecules.js';
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

/* 6 · THE CATALOGUE IN THE TABLE (lab/molecules.js): a record's input is the menu's own atoms (so the worker's solve-cache key is
       the one a window asks with — a mismatch would make a past-cap molecule a live solve), and the benzene-cap law reads it */
for (const r of CAT.rows) assert.deepEqual(load(r.id).input.atoms, moleculeAtoms(r.id), r.id + ': the record\'s atoms are not the menu\'s');
const lys = MOLECULE_BY_ID.get('lysine');
assert.deepEqual(RECORD_ONLY.map((x) => x.id), CAT.rows.filter((r) => r.molecule).map((r) => r.id), 'the record-only rows are the catalogue\'s own molecules');
assert.ok(RECORD_ONLY.includes(lys), 'lysine is a record-only row');
assert.ok(!MOLECULES.includes(lys) && lys.over && lys.recordOnly && !lys.disabled && lys.reason === null, 'lysine: past the cap, DOWNLOAD, never DISABLED');
assert.equal(optionLabel(lys, false), 'C₆H₁₄N₂O₂ · 64 AO · record · DOWNLOAD'); assert.equal(optionLabel(lys, true), 'C₆H₁₄N₂O₂ · 64 AO · record');
assert.ok(!MOLECULE_BY_ID.get('C6H6').recordOnly && MOLECULE_BY_ID.get('C6H6').records['sto-3g'].hash === row('C6H6').hash, 'benzene: under the cap, with its record');
assert.ok(CAP_MS > 1000 && CAP_MS < 2500, 'the refit cap is benzene at ~1.7 s, not 9.6 s: ' + CAP_MS);
assert.equal(L.caps.tdhf, false); assert.equal(rec.caps.tdhf, true);

console.log(`GREEN library: benzene opens from its ${(row('C6H6').bytes / 1024).toFixed(0)} KB record in ${openMs.toFixed(1)} ms with 0 solver calls `
  + `(fresh: 1 SCF + 1 RPA) and equals the fresh solve bit for bit — E, ε, nocc, C, D, ψ and ρ at ${pts.length} points, the names (D6h, HOMO 1e1g), `
  + `${sp.roots.length} RPA sticks, the TDA ladder, the STATES ladder and X (${st.count}²); a KICK solves live once; lysine (64 AO, past the cap) opens `
  + `with 0 calls at its oracle (Δ ${(lo.energy - L.oracle.energy).toExponential(1)} Eh) and refuses STATES and TDHF with a sentence`);
