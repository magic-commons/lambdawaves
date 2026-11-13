// 042 Q · THE SEARCH KNOWS THE WHOLE APP — lab/search-index.js against the app's own documents: the registry's acts (lab/actions.js with a
// stub app), the rack's windows (their real ids and titles), the catalogue's molecules, ATOMS, the systems, the 140 states, the demos and the
// MAIN MENU's pages, gathered by lab/csb-search.js' own providers.  One table: query → the top hit and its tier; then the negatives, frecency,
// the marks, the scope signs and the speed budget (an index of ~3,000 documents in ≤ 30 ms, a keystroke ≤ 1 ms).
import assert from 'node:assert/strict';
globalThis.addEventListener = () => {};
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} });
const { createActions } = await import('../lab/actions.js');
const { CHEM_PRESETS } = await import('../lab/chemview.js');
const { ATOMS } = await import('../lab/atoms.js');
const { gather } = await import('../lab/csb-search.js');
const { createIndex, createFrecency, scope, marks, tokens } = await import('../lab/search-index.js');

const WINDOWS = 'atoms ATOMS · bloch BLOCH · calculus CALCULUS · camera CAMERA · chem MOLECULES · clip CLIP · emission EMISSION SPECTRA · equalizer EQUALIZER · history HISTORY · informational INFORMATIONAL · ladder LADDER · light LIGHTING · meters METERS · nodes NODES · observer WAVE · orbit ORBIT · palette PALETTE · projects FOLDERS · radiation RADIATION · render RENDER · settings SETTINGS · shadow SHADOW · slice PLANE · spectrum SPECTRUM · stage STAGE · staticfield FIELD · transport CONTROL SURFACE · vortex VORTEX · widgets WIDGETS · wigner WIGNER'
  .split(' · ').map((s) => { const i = s.indexOf(' '); return { id: s.slice(0, i), title: s.slice(i + 1), hidden: s.startsWith('chem'), card: s.startsWith('transport ') }; });   // 044 A2: the bar's card is `card: true`, as the rack says it
const one = new Set(ATOMS.map((a) => a.symbol));
const app = { ui: { hamSeg: {} }, reg: {}, clock: {}, obs: {}, mat: {}, appPlay: {}, hooks: {}, ctl: {}, loop: {}, w: { setElement() {} }, sh: { rk: { windows: () => WINDOWS } },
  state: { picker: { hydrogen() {}, rows: async () => CHEM_PRESETS.filter((p) => !p.disabled && !one.has(p.formula.replace(/<\/?m>/g, ''))).map((p) => ({ id: p.id, name: p.name, formula: p.formula, vol: null })) } } };
app.sh.ACTIONS = createActions(app);
/* 044 A2 (L19): the special windows are the FINDER's table (shell/notebook.js `layout.special`), read by the search */
const SPECIAL = ['modulation MODULATION', 'timeline TIMELINE', 'transport CONTROL SURFACE', 'notebook NOTEBOOK', 'nodes NODES'].map((s) => { const i = s.indexOf(' '); return { id: s.slice(0, i), title: s.slice(i + 1), run() {} }; });
app.sh.layout = { special: () => SPECIAL, projects: { list: () => [{ path: 'DEMOS/WAVE DANCER PROTOTYPE', folder: 'DEMOS', name: 'WAVE DANCER PROTOTYPE' }, { path: 'my orbitals', folder: '', name: 'my orbitals' }] } };
const g = gather(app), docs = g.docs.concat(await g.later);
const count = (k) => docs.filter((d) => d.kind === k).length;
console.log(`corpus: ${docs.length} documents — ` + ['action', 'window', 'molecule', 'element', 'system', 'state', 'project', 'page'].map((k) => k + ' ' + count(k)).join(' · '));

let picks = null;
const store = { get: () => picks, set: (o) => { picks = JSON.parse(JSON.stringify(o)); } };
let clock = 1e12; const fr = createFrecency(store, () => clock);
const index = createIndex(docs, { frecency: fr });
const run = (q) => { const s = scope(q); return index.search(s.q, { kinds: s.kinds }); };
const top = (q) => run(q)[0] || null;

/* THE TABLE: query → the top hit's doc id and its tier */
const TABLE = [
  ['h2o', 'molecule::H2O', 1], ['H₂O', 'molecule::H2O', 1], ['water', 'molecule::H2O', 1], ['benzen', 'molecule::C6H6', 2], ['benzene', 'molecule::C6H6', 1],
  ['C6H6', 'molecule::C6H6', 1], ['nh3', 'molecule::NH3', 1], ['co2', 'molecule::CO2', 1],
  ['au', 'element:79', 1], ['gold', 'element:79', 1], ['Fe', 'element:26', 1], ['iron', 'element:26', 1], ['z 26', 'element:26', 3],
  ['3d', 'state:h:3:2:0', 2], ['2p0', 'state:h:2:1:0', 1], ['4f-2', 'state:h:4:3:-2', 1], ['4f2', 'state:h:4:3:2', 1], ['3d₋₁', 'state:h:3:2:-1', 1], ['n=3', 'state:h:3:0:0', 3],
  ['tl', 'element:81', 1], ['ep', 'action:export.picture', 5], ['tmln', 'window:timeline', 7],
  ['screenshot', 'action:export.picture', 3], ['screnshot', 'action:export.picture', 6], ['rendr', 'window:render', 6], ['spectrm', 'window:spectrum', 6], ['benzne', 'molecule::C6H6', 6],
  ['video', 'window:render', 3], ['record', 'window:render', 3], ['fullscreen', 'action:fullscreen', 2], ['> full', 'action:fullscreen', 2], ['@ nodes', 'window:nodes', 1], ['# au', 'element:79', 1], [': 3d', 'state:h:3:2:0', 2],
  ['spectrum', 'window:spectrum', 1], ['timeline', 'window:timeline', 1], ['undo', 'action:undo', 2], ['mir options', 'action:gui', 2], ['quarkonium', 'system:cornell', 1],
  ['oscillator', 'system:qho', 1], ['tight binding', 'system:lattice', 3], ['tutorial', 'page:tutorial', 1], ['periodic', 'page:atomic', 3],
  ['water esp', 'project:demo:water-esp', 1], ['wave dancer', 'project:demo:wave-dancer', 2],
  ['reset camera', 'action:camReset', 3], ['camera reset', 'action:camReset', 4],   // two terms: in order beats any order, the same act
  ['psi', 'action:turnNeg', 3], ['lambda', 'action:csb.search', 3],
];
const got = TABLE.map(([q, id, tier]) => { const t = top(q); return { q, id, tier, gotId: t && t.doc.id, gotTier: t && t.tier, title: t && t.doc.title }; });
const bad = got.filter((r) => r.gotId !== r.id || r.gotTier !== r.tier);
for (const r of got) console.log(`${r.gotId === r.id && r.gotTier === r.tier ? 'ok ' : 'BAD'} ${JSON.stringify(r.q).padEnd(16)} → ${String(r.title).padEnd(34)} tier ${r.gotTier}${r.gotId === r.id && r.gotTier === r.tier ? '' : `   (wanted ${r.id} tier ${r.tier}, got ${r.gotId})`}`);
assert.equal(bad.length, 0, `${bad.length} of ${TABLE.length} rows miss`);
console.log(`PASS the table: ${TABLE.length} queries, each its top hit at its tier`);

/* THE NEGATIVES: a typo never reaches a word under four letters, a 3-letter query has no typo, nonsense is empty, AND holds */
assert.ok(!run('boxs').some((r) => r.doc.id === 'system:well'), '"boxs" must not typo into BOX');
assert.ok(!run('bix').some((r) => r.doc.id === 'system:well' && r.tier === 6), '"bix" must not typo into BOX');
assert.equal(run('qzxqzx').length, 0, 'nonsense finds nothing');
assert.ok(run('export picture').every((r, i) => i === 0 || r.tier >= run('export picture')[0].tier), 'tiers are ordered');
assert.equal(top('export picture').doc.id, 'action:export.picture');
assert.ok(run('gold water').every((r) => r.tier === 8), 'no doc holds "gold" and "water": the docs holding the most, tier 8');
console.log('PASS the negatives: no typo into a 3-letter word (boxs, bix), nonsense is empty, AND falls back to the most terms held');

/* FRECENCY: a second pick for "3d" rises over the first; RECENT names it; the record is capped and versioned */
const r3 = run('3d'); assert.notEqual(r3[1].doc.id, r3[0].doc.id);
fr.pick('3d', r3[1].doc.id);
assert.equal(top('3d').doc.id, r3[1].doc.id, 'the pick rises'); assert.equal(top('3').doc.id, r3[1].doc.id, 'and for the query it began');
assert.equal(top('4f-2').doc.id, 'state:h:4:3:-2', 'never for a query it did not begin');
assert.deepEqual(fr.recent(6), [r3[1].doc.id]);
assert.equal(top('tl').doc.id, 'element:81'); assert.equal(run('tl')[1].doc.id, 'window:timeline');   // Tl is thallium's symbol (tier 1); TIMELINE is "tl" by the synonym (tier 3)
fr.pick('tl', 'window:timeline'); assert.equal(top('tl').doc.id, 'window:timeline', 'one pick of TIMELINE for "tl" puts it first (it joins tier 1)');
assert.equal(top('thallium').doc.id, 'element:81');
clock += 60 * 864e5; fr.pick('ep', 'action:export.picture');
assert.ok(index.search('3d')[0].doc.id === r3[1].doc.id, 'a learned doc stays first after 60 days (it fades, it is never forgotten by time alone)');
for (let i = 0; i < 230; i++) fr.pick('q' + i, 'action:undo');
assert.equal(picks.v, 1); assert.equal(picks.picks.length, 200, 'capped at 200, the oldest out');
assert.ok(!picks.picks.some((p) => p[0] === '3d'), 'the oldest went first');
console.log(`PASS frecency: a second pick for "3d" (${r3[1].doc.title}) rises above ${r3[0].doc.title}; RECENT; 200 kept, the oldest out`);

/* THE MARKS, THE SIGNS, THE FOLD */
assert.deepEqual(marks('EXPORT a PICTURE of the stage (×2)', 'ex pic'), [[0, 2], [9, 12]]);
assert.deepEqual(marks('H₂O', 'h2o'), [[0, 3]]);
assert.deepEqual(scope('> full'), { kinds: ['action'], q: 'full' }); assert.deepEqual(scope('@'), { kinds: ['window'], q: '' });
assert.deepEqual(tokens('λWAVES 4f₋₂ H₂O camReset'), ['lambda', 'waves', '4', 'f', '-2', 'h', '2', 'o', 'cam', 'reset']);
assert.ok(run('@').length >= WINDOWS.length - 2 && run('@').every((r) => r.doc.kind === 'window'), 'a sign alone lists its kind');
console.log('PASS the marks (the title\'s own characters), the scope signs, the fold (λ, subscripts, camelCase, a signed m)');

/* THE BUDGET: ~3,000 documents (the corpus and invented volume molecules) in ≤ 30 ms (it measures 12–13 alone on this machine and 15–20 beside other builders: 044 widened a budget that judged the load, not the index); a keystroke ≤ 1 ms */
const STEM = ['meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec'], END = ['ane', 'ene', 'yne', 'anol', 'anal', 'anone', 'anoic acid', 'ylamine', 'yl chloride', 'oxide'];
const many = docs.concat(Array.from({ length: 3000 - docs.length }, (_, i) => { const name = (i % 7 ? '' : (i % 9) + '-') + STEM[i % 10] + END[(i / 10 | 0) % 10] + (i >= 100 ? ' ' + ['iso', 'neo', 'cyclo', 'tert'][i % 4] + (i / 100 | 0) : '');
  return { id: 'molecule:vol-x:m' + i, kind: 'molecule', title: name[0].toUpperCase() + name.slice(1), exact: ['C' + (1 + i % 30) + 'H' + (2 + i % 61) + (i % 3 ? 'O' : 'N'), 'm' + i], body: 'vol-x', r: {} }; }));
let best = Infinity; for (let k = 0; k < 5; k++) { const t0 = performance.now(); createIndex(many, { frecency: fr }); best = Math.min(best, performance.now() - t0); }
const big = createIndex(many, { frecency: fr }), keys = ['h', 'h2', 'h2o', 'b', 'be', 'ben', 'benz', 'scre', 'screnshot', 'tmln', '3d', 'export pic', 'ethyl ox'];
for (const q of keys) big.search(q);
const t1 = performance.now(), R = 20; for (let k = 0; k < R; k++) for (const q of keys) big.search(q);
const per = (performance.now() - t1) / (R * keys.length);
console.log(`budget: ${many.length} documents indexed in ${best.toFixed(1)} ms (best of 5); a keystroke ${per.toFixed(3)} ms (mean of ${R * keys.length})`);
assert.ok(best <= 30, `the index took ${best.toFixed(1)} ms`); assert.ok(per <= 1, `a keystroke took ${per.toFixed(3)} ms`);
console.log('PASS the speed budget');
