// 0.5.4 P4 · THE STATUS LINE'S TABLE (lab/status.js statusOf): every molecule the lab can put on stage — the 54 of the menu and the 37 that open only
// from their record — in each of its four views (DENSITY · ORBITAL · Δρ · FLOW), plus hydrogen, composed exactly as chemview.js composes it: a
// molecule with a catalogue row speaks from the row (oracle.delta, geometry, status); a live-only molecule from its own LIVE SOLVE here (the
// worker's chemGround, the app's road) against the PySCF energy P3 attached (`m.oracle`).  Every string is held to the character budget (≤ 110:
// three lines at 16 px on a 360-px phone, REVIEW-SONNET-2 #1 d); EVERY numeral in it is parsed back and held to its source — an energy agreement
// to the measured |ΔE| rounded UP to one figure, a picture number to THE FIELD LAW's constant in tests/helpers/field-law.mjs (P7c, PAIR B2's), each
// member of lab/status.js' FIELD_LAW equal to the member it comes from (the lab cannot import tests/); no other digit may appear.  A molecule with a fixture oracle is never UNCHECKED
// (water!); the geometry classes come through 2 / 26 / 9 / 1 and 36 heads say "geometry computed, not measured".  Node only.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as W from '../lab/mathworker.js';
import { MOLECULES, RECORD_ONLY, moleculeAtoms } from '../lab/molecules.js';
import { statusOf, statusCalls, FIELD_LAW as LAB_LAW, STATE_WORD } from '../lab/status.js';
import { FIELD_LAW } from './helpers/field-law.mjs';

const VIEWS = ['density', 'orbital', 'diff', 'flow'], BUDGET = 110;
let strings = 0, longest = '';
/** the one-figure number a string printed is the SMALLEST one-figure number ≥ the source: v ≥ s > its predecessor */
function figure(v, s, what) {
  const [m, e] = v.toExponential(0).split('e').map(Number), pred = m > 1 ? Number((m - 1) + 'e' + e) : Number('9e' + (e - 1));
  assert.ok(v >= s && pred < s && Number(m + 'e' + e) === v, `${what}: ${v} is not |Δ| = ${s} rounded up to one figure`);
}
/** every numeral of a string, parsed out of the phrases that may carry one; anything left with a digit fails */
function numerals(t, what) {
  const out = {}; let rest = t;
  rest = rest.replace(/^(\S+ · )?UHF ⟨S²⟩ (\d\.\d{3})/, (_, l, v) => { out.s2 = Number(v); return l || ''; });   // 0.7.1: the line's ⟨S²⟩ …
  rest = rest.replace(/⟨S²⟩ (\d\.\d{3}) \(exact (\d+(?:\.\d+)?)\)/, (_, v, x) => { out.s2 = Number(v); out.exact = Number(x); return ''; });   // … and the head's, with S(S+1)
  rest = rest.replace(/energy agrees with PySCF to (\de-\d+) Eh/, (_, v) => { out.dE = Number(v); return ''; });
  rest = rest.replace(/picture good to (\d+(?:\.\d+)?) % of ρmax/, (_, v) => { out.rho = Number(v); return ''; });
  rest = rest.replace(/picture good to (\de-\d+) RMS \(worst voxel (\de-\d+)\)/, (_, a, b) => { out.rms = Number(a); out.worst = Number(b); return ''; });
  assert.ok(!/\d/.test(rest), `${what}: a numeral outside a sourced phrase: "${t}"`);
  return out;
}
function budget(t, what) { strings++; if (t.length > longest.length) longest = t; assert.ok(t.length <= BUDGET, `${what}: ${t.length} > ${BUDGET} characters: "${t}"`); }

/* 1 · THE FIELD LAW: every bound the lab quotes IS the law's member of the same name and metric (the lab keeps only those it quotes) */
assert.deepEqual(LAB_LAW, { hydrogen: { rms: FIELD_LAW.hydrogen.rms, worst: FIELD_LAW.hydrogen.worst }, density: { worst: FIELD_LAW.density.worst } },
  'lab/status.js FIELD_LAW is not tests/helpers/field-law.mjs\'s hydrogen.rms, hydrogen.worst, density.worst');

/* 2 · THE VOCABULARY, written once: MEASURED or IMPORTED → NUMERICAL, UNKNOWN or absent → UNCHECKED, a closed form → EXACT; never CERTIFIED */
assert.deepEqual({ ...STATE_WORD }, { MEASURED: 'NUMERICAL', IMPORTED: 'NUMERICAL', UNKNOWN: 'UNCHECKED' });
assert.equal(statusOf({}).word, 'UNCHECKED', 'no record and no oracle is UNCHECKED');
assert.equal(statusOf({ record: { status: { energy: 'UNKNOWN' } } }).word, 'UNCHECKED');
assert.equal(statusOf({ record: { status: { energy: 'CERTIFIED' } } }).word, 'UNCHECKED', 'a word the map does not know is not promoted');
assert.equal(statusOf({ sol: { energy: -76.02 }, oracle: null }).line, 'DENSITY · UNCHECKED · picture good to 0.2 % of ρmax', 'a 6-31+G* solve: the catalogue carries no oracle for it');
assert.equal(statusOf({ owner: 'qho' }), null, 'an owner it cannot speak for gets no line');

/* 3 · HYDROGEN (Q13): EXACT, its picture read from the law in its two metrics (§J-2: the RMS, not the 99.8 %-of-voxels 2e-5); PLAN §B's target, its state named */
const h = statusOf({ owner: 'hydrogen', label: '1s+2pz' }), hn = numerals(h.line.slice('1s+2pz'.length), 'hydrogen');   // the label is the state's name
assert.equal(h.line, '1s+2pz · EXACT · picture good to 3e-6 RMS (worst voxel 2e-4)'); assert.equal(FIELD_LAW.hydrogen.preset, '1s+2pz');
assert.equal(statusOf({ owner: 'hydrogen' }).line, 'HYDROGEN · EXACT · picture good to 3e-6 RMS (worst voxel 2e-4)');
assert.ok(hn.rms === FIELD_LAW.hydrogen.rms && hn.worst === FIELD_LAW.hydrogen.worst, 'hydrogen: the picture numbers are not the law\'s RMS and worst voxel');
budget(h.line, 'hydrogen');

/* 4 · THE TABLE */
W.chemRegister('sto-3g', JSON.parse(readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const geo = {}, solved = [], live = {};
let computed = 0, imported = 0, worstLive = 0, worstLiveId = '';
for (const m of [...MOLECULES, ...RECORD_ONLY]) {
  const row = m.records['sto-3g'] || null, oracle = row ? null : m.oracle;   // chemview's choice: the row when there is one
  assert.ok(row || (m.oracle && Number.isFinite(m.oracle.energy)), m.id + ': neither a row nor a fixture oracle');
  const sol = row || m.disabled ? null : W.chemGround({ atoms: moleculeAtoms(m.id), basis: 'sto-3g', charge: m.charge || 0, symmetry: m.symmetry, multiplicity: m.multiplicity });
  if (sol) { solved.push(m.id); const d = Math.abs(sol.energy - m.oracle.energy); if (d > worstLive) { worstLive = d; worstLiveId = m.id; } }
  const src = row ? Math.abs(row.oracle.delta) : sol ? Math.max(Math.abs(sol.energy - m.oracle.energy), Math.abs(m.oracle.energy) * Number.EPSILON) : null;   // a bit-identical energy agrees to the double's |E|·ε
  for (const view of VIEWS) {
    const s = statusOf({ record: row, sol, oracle, view }), what = `${m.id} ${view}`, uhf = m.multiplicity > 1;
    assert.equal(s.word, 'NUMERICAL', what + ': a molecule with an oracle reads ' + s.word);
    budget(s.line, what); const n = numerals(s.line, what);
    assert.ok(s.line.startsWith({ density: 'DENSITY', orbital: 'ORBITAL', diff: 'Δρ', flow: 'FLOW' }[view] + (uhf ? ` · UHF ⟨S²⟩ ${sol.s2.toFixed(3)}` : '') + ' · NUMERICAL'), what + ': ' + s.line);
    if (uhf) { assert.equal(n.s2, +sol.s2.toFixed(3), what + ': the ⟨S²⟩ printed is the solve\'s'); delete n.s2; }
    if (view === 'density') {
      assert.ok(Math.abs(n.rho / 100 - FIELD_LAW.density.worst) <= 1e-12 * FIELD_LAW.density.worst, what + ': the picture number is not the law\'s worst-voxel bound');
      if (src !== null && row?.status.energy !== 'IMPORTED') figure(n.dE, src, what);
    } else assert.deepEqual(n, {}, what + ': a number on a view that measured none');
    if (view === 'density') live[m.id] = s.line;
  }
  const s = statusOf({ record: row, sol, oracle }); budget(s.head, m.id + ' head'); const n = numerals(s.head, m.id + ' head');
  if (m.multiplicity > 1) { const S = (m.multiplicity - 1) / 2; assert.ok(n.s2 === +sol.s2.toFixed(3) && n.exact === S * (S + 1), m.id + ' head: ⟨S²⟩ and S(S + 1)'); }
  if (row) { geo[s.geometry] = (geo[s.geometry] || 0) + 1; if (/ · geometry computed, not measured$/.test(s.head)) computed++; else assert.equal(s.geometry, 'experimental', m.id); }
  else assert.equal(s.geometry, null);
  if (row?.status.energy === 'IMPORTED') { imported++; assert.equal(s.head, 'NUMERICAL · energy is PySCF\'s own · geometry computed, not measured'); assert.deepEqual(n, {}); }
  else if (src !== null) figure(n.dE, src, m.id + ' head');
}
assert.deepEqual(geo, { experimental: 2, 'optimised-here': 26, 'computed-reference': 9, draft: 1 }, 'the geometry classes: ' + JSON.stringify(geo));
assert.equal(computed, 36, 'the heads that say "geometry computed, not measured"'); assert.equal(imported, 1, 'C₆₀ alone is IMPORTED');
assert.equal(MOLECULES.length + RECORD_ONLY.length, 98);   // 0.7.1: + the seven open shells
assert.match(live.H2O, /^DENSITY · NUMERICAL · energy agrees with PySCF to \de-\d+ Eh · picture good to 0\.2 % of ρmax$/, 'water: ' + live.H2O);
assert.ok(statusCalls() > 0);

console.log(`GREEN status: ${strings} strings (98 molecules × 4 views + 98 heads + hydrogen) within ${BUDGET} characters (longest ${longest.length}: "${longest}"); `
  + `every numeral parsed back to its source — ${solved.length} live solves against P3's PySCF energies (worst |ΔE| ${worstLive.toExponential(2)}, ${worstLiveId}), `
  + `38 rows' oracle.delta, the field law's hydrogen ${FIELD_LAW.hydrogen.rms.toExponential()} RMS / ${FIELD_LAW.hydrogen.worst.toExponential()} worst voxel and density ${FIELD_LAW.density.worst.toExponential()} worst voxel (tests/helpers/field-law.mjs); `
  + `no molecule with an oracle reads UNCHECKED; geometry 2 / 26 / 9 / 1, ${computed} heads "computed, not measured", C₆₀'s energy PySCF's own. Water: "${live.H2O}"`);
