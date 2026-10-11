// 0.5.1 D2 · THE MOLECULE'S HEAD (U6): every number on the head is the record's or the live solve's.  For each of the 38 library
// records the head is composed from its `stem` (E, nocc and nAO from its ground) and parsed back; EVERY numeral sits in a field
// the template names, and each is diffed against its source — the stem, the ground, the catalogue's molecule, the basis label.
// The lab composes a live solve through `stemOf`, the generator's own road for the stem: on the 37 records whose ground names
// its levels it reproduces the stem exactly, so a record opened in the lab and its stem agree; C₆₀ (a frontier record) keeps
// its stem's HOMO sentence, which is why the lab hands a record's stem to the head.  H₂O and N₂ have no record: they are
// solved LIVE here (lab/mathworker.js chemGround, the generator's road) and every numeral is traced to that solve and to the
// page EDIT › COPY writes from it.  A point group the record does not know is "—", exactly once (C₆₀).  0.5.4 P4: the FIFTH line is lab/status.js'
// molecule-level STATUS (word · the oracle's agreement · the geometry), its numerals in their own named groups and traced to the row's oracle.delta or the
// live solve's |ΔE| against P3's PySCF energy, rounded UP to one figure.  Node only.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as W from '../lab/mathworker.js';
import { decodeRecord, recordPath } from '../lab/library.js';
import { MOLECULE_BY_ID, moleculeAtoms } from '../lab/molecules.js';
import { moleculeHead, moleculeLatex, stemOf, formulaLatex, mdText, EV } from '../lab/latex-state.js';
import { forms } from '../lab/names.js';
import { statusOf } from '../lab/status.js';

const at = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const CAT = JSON.parse(readFileSync(at('../lab/library.json'), 'utf8'));
/* the template, anchored: a digit outside a named group fails the match, so every numeral is one of these fields */
const HEAD = /^\*\*\$(?<f>[^$]+)\$ · (?<name>[^\n]+)\*\*\nRHF\/(?<basis>STO-3G|6-31\+G\*) · \$E = (?<E>-\d+\.\d{6})\\,E_h\$\n(?<nocc>\d+) occupied of (?<nAO>\d+) AO · (?<pg>—|\$[A-Z]_\{[^}]+\}\$)\n(?<homo>[^\n]+) · gap \$(?<gEh>\d+\.\d{4})\\,E_h\$ = (?<gEv>\d+\.\d{2}) eV\n(?<word>EXACT|NUMERICAL|UNCHECKED)(?: · energy agrees with PySCF to (?<dm>\d)e\\-(?<dx>\d+) Eh|(?<own> · energy is PySCF's own))?(?<geo> · geometry computed, not measured)?$/;
const groupOf = (pg) => (pg === '—' ? null : pg.slice(1, -1).replace('_{', '').replace('}', '').replace('\\infty ', 'inf'));
const homoOf = (stemHomo) => { const h = /^(.+) · HOMO$/.exec(stemHomo); return h ? 'HOMO ' + forms(h[1]).latex : mdText(stemHomo); };
/** parse a head and diff every field against its source; returns the parsed fields */
function check(head, src, what) {
  const m = HEAD.exec(head); assert.ok(m, `${what}: the head is not the template — a numeral outside a named field?\n${head}`);
  const q = m.groups;
  assert.equal(q.f, formulaLatex(src.formula), what + ': formula');
  assert.equal(q.name, mdText(src.name), what + ': name');
  assert.equal(q.basis, 'STO-3G', what + ': basis');
  assert.equal(q.E, src.energy.toFixed(6), what + ': E'); assert.ok(Math.abs(+q.E - src.energy) <= 5e-7, what + ': E as a number');
  assert.equal(+q.nocc, src.nocc, what + ': nocc'); assert.equal(+q.nAO, src.nAO, what + ': nAO');
  assert.equal(groupOf(q.pg), src.pointGroup, what + ': point group');
  assert.equal(q.homo, homoOf(src.homo), what + ': HOMO');
  assert.ok(Math.abs(+q.gEh - src.gapEh) <= 5e-5 && q.gEh === src.gapEh.toFixed(4), what + ': gap in E_h');
  assert.ok(Math.abs(+q.gEv - src.gapEv) <= 5e-3 && q.gEv === src.gapEv.toFixed(2), what + ': gap in eV');
  /* 0.5.4 P4 · the fifth line: the word, the agreement (|ΔE| rounded UP to one figure: v ≥ |ΔE| > its one-figure predecessor), the geometry */
  assert.equal(q.word, src.status.word, what + ': the status word');
  if (q.dm) { const v = Number(q.dm + 'e-' + q.dx), pred = +q.dm > 1 ? Number((q.dm - 1) + 'e-' + q.dx) : Number('9e-' + (+q.dx + 1));
    assert.ok(v >= src.dE && pred < src.dE, `${what}: the agreement ${v} is not |ΔE| = ${src.dE} rounded up`); } else assert.ok(q.own ? src.imported : !Number.isFinite(src.dE), what + ': the agreement is missing');
  assert.equal(!!q.geo, !!src.geometry && src.geometry !== 'experimental', what + ': the geometry clause');
  /* the head and EDIT › COPY's page agree: the same E and the same occupied count of n AO */
  if (src.page) assert.ok(src.page.includes(`$E = ${q.E}\\,E_h$, ${q.nocc} occupied of ${q.nAO} AO`), what + ': the page says another E or count');
  /* the blurb is not on the head (R6-B): the template has no seat for it, and none of its words is there */
  for (const line of src.blurb || []) assert.ok(!head.includes(line.slice(0, 20)), what + ': the blurb reached the head');
  return q;
}

/* 1 · THE 38 RECORDS, from their stems */
let dashes = 0, named = 0;
const heads = [];
for (const r of CAT.rows) {
  const rec = JSON.parse(readFileSync(at('../lab/' + recordPath(r.hash)), 'utf8')), s = rec.stem, G = rec.ground;
  const molecule = { formula: s.formula, name: rec.name };
  const status = statusOf({ record: r }), head = moleculeHead({ molecule, basis: rec.basis, ground: G, stem: s, status });
  check(head, { formula: s.formula, name: rec.name, energy: G.energy, nocc: G.nocc, nAO: G.nAO, pointGroup: s.pointGroup, homo: s.homo,
    gapEh: s.gapEh, gapEv: s.gapEv, page: rec.page, blurb: s.blurb, status, dE: Math.abs(r.oracle.delta), imported: r.status.energy === 'IMPORTED', geometry: r.geometry }, r.id);
  if (head.includes('—')) { dashes++; assert.equal(r.id, 'C60', 'a "—" for a group the record knows: ' + r.id); }
  /* the lab's road for a record it opened: the same composition from the decoded ground reproduces the stem (C₆₀'s HOMO sentence is its stem's) */
  const opened = { ...G, eps: decodeRecord(rec).eps }, live = stemOf(opened);
  const want = { pointGroup: s.pointGroup, gapEh: s.gapEh, gapEv: s.gapEv, homo: s.homo };
  if (r.id === 'C60') assert.deepEqual({ ...live, homo: s.homo }, want, 'C60: stemOf disagrees with the frontier stem beyond its HOMO sentence');
  else { assert.deepEqual(live, want, r.id + ': stemOf(the record\'s ground) is not the record\'s stem'); assert.equal(moleculeHead({ molecule, basis: rec.basis, ground: opened, status }), head, r.id + ': the head by stemOf is not the head by the stem'); }
  if (/^HOMO \$/.test(HEAD.exec(head).groups.homo)) named++;
  heads.push(head);
}
assert.equal(CAT.rows.length, 38, 'the library is not 38 records');
assert.equal(dashes, 1, 'the "—" point group is not exactly once (C₆₀)');

/* 2 · H₂O AND N₂, solved LIVE (no record): every numeral is the solve's, and the page EDIT › COPY writes from the same solve agrees */
W.chemRegister('sto-3g', JSON.parse(readFileSync(at('../lab/vendor/bse/sto-3g-v1.json'), 'utf8')));
const live = {};
for (const [id, group, label] of [['H2O', 'C2v', '1b1'], ['N2', 'Dinfh', '3σg']]) {
  const m = MOLECULE_BY_ID.get(id);
  assert.ok(m && !m.recordOnly && !Object.keys(m.records || {}).length, id + ' is not a live molecule without a record');
  const g = W.chemGround({ atoms: moleculeAtoms(id), basis: 'sto-3g', charge: m.charge || 0, symmetry: m.symmetry });
  const status = statusOf({ sol: g, oracle: m.oracle }), head = moleculeHead({ molecule: m, basis: 'sto-3g', ground: g, status });
  const gap = g.eps[g.nocc] - g.eps[g.nocc - 1], mo = g.names.mos[g.nocc - 1];   // traced here, not through stemOf
  assert.equal(g.names.group, group); assert.equal(mo.label, label); assert.equal(mo.frontier, 'HOMO');
  const q = check(head, { formula: m.formula, name: m.name, energy: g.energy, nocc: g.nocc, nAO: g.nAO, pointGroup: group, homo: label + ' · HOMO',
    gapEh: gap, gapEv: +(gap * EV).toFixed(4), page: moleculeLatex({ molecule: m, basis: 'sto-3g', charge: m.charge, ground: g }),
    status, dE: Math.max(Math.abs(g.energy - m.oracle.energy), Math.abs(m.oracle.energy) * Number.EPSILON), imported: false, geometry: null }, id + ' (live)');
  assert.ok(Math.abs(+q.gEv - gap * 27.211386245988) <= 5.0001e-3, id + ': the eV gap is not the E_h gap × 27.2114');
  live[id] = { head, E: q.E, gEv: q.gEv, homo: q.homo, said: head.split('\n')[4] };
}
assert.ok(live.H2O.homo === 'HOMO $1b_{1}$' && /^HOMO \$3\\sigma_\{g\}\$$/.test(live.N2.homo), 'the HOMO names: ' + JSON.stringify(live));

console.log(`GREEN molecule-head: 38 records composed from their stems — every numeral in a named field and diffed against its source `
  + `(${named} HOMOs named, ${38 - named} unnamed or a sentence; "—" once, C₆₀); stemOf on the 37 named-ground records = their stems; `
  + `H₂O (E ${live.H2O.E}, ${live.H2O.homo}, gap ${live.H2O.gEv} eV) and N₂ (E ${live.N2.E}, ${live.N2.homo}) solved live, every numeral the solve's and the page's; `
  + `the fifth line, STATUS: H₂O "${live.H2O.said}", N₂ "${live.N2.said}" — the word, the agreement rounded up from its source, the geometry on the 36`);
