/* project-formats.test.mjs — R10, THE FORMATS (0.5.0 C6: PLAN §2 C6 + §3 R10, C6-DESIGN §7).  Node only, no dependencies.
 * FOLDERS (lab/mir/folders/files.js) now writes λWAVES' saved projects, through lab/project-store.js' translator, under the key
 * every λWAVES build since wave 46 reads.  The fixtures prove what a browser stored does not change:
 *   (a) AN INVALID COLLECTION IS READ-ONLY.  Five damaged texts: the kit sees an empty library, every write is refused with the
 *       reason, the stored text is byte-identical after, and no `.refused-` copy is made (λWAVES' law is stricter than the kit's
 *       1.5 "repair": a collection that does not validate is never rewritten at all).  A valid 0.4 collection keeps its three
 *       projects, their bytes and RECENT through a kit save, and the round trip getItem → kit write → getItem is byte-exact.
 *   (b) THE CAPS: 8 MiB a project, before the parse and at the store (an older build's larger entry does not block the rest);
 *       24 MiB the library (BASINS' 24 MB, the kit's LIMITS.project, as FOLDERS' capChars).  The kit's intake would take a
 *       λWAVES project of 10 MiB (its project limit is 24 MiB); the store refuses it.  Another app's project is refused by name.
 *   (c) A 1.4 NOTEBOOK IS PAGE 0: the notebook (`lambdawaves.q0.notebook*`, and a 0.4 item's `notebook`) rides in the ONE part as
 *       { title, subtitle, text }, and the kit's pageFromNotebook reads it as the project's first page.
 * And the unsaved mark (projectKey(), the part's signature), sliced out of rack.js as project-storage.test did before C6.
 * Run:  node tests/project-formats.test.mjs */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFiles } from '../lab/mir/folders/files.js';
import { seed } from '../lab/mir/folders/seed.js';
import { pageFromNotebook } from '../lab/mir/shell/pages.js';
import { readInput } from '../lab/mir/core/intake.js';
import { wrap, stringify, LIMITS } from '../lab/mir/core/envelope.js';
import { PJ_KEY, PART, MAX_PROJECT_BYTES, MAX_LIBRARY_CHARS, createProjectStore, toFiles, fromFiles, validateProjectCollection, touchRecent,
  parseProjectFile, projectFileText, STARTERS, starterOf } from '../lab/project-store.js';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
let greens = 0;
const green = (line) => { greens++; console.log('GREEN ' + line); };
/* a Storage with no quota — localStorage, minus the browser */
function memory(init = {}) {
  const m = new Map(Object.entries(init));
  return { get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, keys: () => [...m.keys()] };
}
/* the store FOLDERS gets, and a spy on what the kit writes under the key */
function library(ls, capChars = MAX_LIBRARY_CHARS) {
  const store = createProjectStore(ls), wrote = [];
  const spy = { get length() { return store.length; }, key: (i) => store.key(i), getItem: (k) => store.getItem(k), removeItem: (k) => store.removeItem(k),
    setItem: (k, v) => { if (k === PJ_KEY) wrote.push(v); store.setItem(k, v); } };
  return { store, wrote, files: createFiles({ key: PJ_KEY, storage: spy, capChars, defaultName: 'UNTITLED' }) };
}
const part = (data, notebook = { title: 'T', subtitle: '', text: '' }) => ({ parts: { [PART]: { data, notebook } } });
const demo = (file) => parseProjectFile(read('../lab/demos/' + file + '.lambdawaves.json'));
/* what a 0.4 build stored: its import (storeProjectImport) and its save wrote exactly these seven keys, in this order */
const item04 = (p, saved = p.saved) => ({ path: p.path, folder: p.folder, name: p.name, saved, opened: saved, data: p.data, notebook: p.notebook });

/* ── (a) 1–5 · AN INVALID OR DAMAGED COLLECTION IS READ-ONLY ── */
const BAD = ['{', 'null', '{"items":null}', '{"items":{},"recent":5}', '{"items":{"bad":{"path":"bad","data":{},"notebook":{},"saved":4}}}'];
for (const raw of BAD) {
  const ls = memory({ [PJ_KEY]: raw }), { store, files } = library(ls);
  assert.ok(store.refusal, raw + ': no refusal');
  assert.deepEqual(files.entries(), [], raw + ': the kit was shown entries');
  const s = files.save({ name: 'X', folder: 'f', payload: part({ experiment: {} }) });
  assert.equal(s.ok, false, raw + ': a save went through');
  assert.match(s.why, /could not be read .*nothing was written\. Stored data was left untouched\./, raw + ': the refusal does not say why: ' + s.why);
  assert.equal(files.overwrite('f1', { payload: part({}) }).ok, false); assert.equal(files.remove('f1').ok, false);
  assert.throws(() => store.removeItem(PJ_KEY), /left untouched/, raw + ': the key could be removed');
  assert.throws(() => store.setItem(PJ_KEY + '.refused-1', raw), /left untouched/, raw + ': a set-aside copy was allowed');
  assert.throws(() => store.setItem(PJ_KEY, JSON.stringify(toFiles({ items: {} }))), /left untouched/, raw + ': an empty writable library replaced it');
  assert.equal(touchRecent(ls, 'bad'), false);
  assert.equal(ls.getItem(PJ_KEY), raw, raw + ': the stored text moved');
  assert.deepEqual(ls.keys(), [PJ_KEY], raw + ': another key was written: ' + ls.keys());
}
green('R10 a1–a5 · five damaged collections (' + BAD.map((b) => b.length > 20 ? b.slice(0, 18) + '…' : b).join(' · ') + ') are READ-ONLY: the kit sees an empty library, save / overwrite / remove / set-aside / an empty replacement are all refused with "Stored data was left untouched.", the stored text is byte-identical and no other key (no .refused- copy) is written');

/* ── (a) 6 · A VALID 0.4 COLLECTION: three projects and RECENT survive a kit save, bytes and all; an older build reads the result ── */
const NEW = parseProjectFile(read('../lab/new-project.lambdawaves.json'));
const alpha = item04({ path: 'study/alpha', folder: 'study', name: 'alpha', saved: '2026-09-20T08:00:00.000Z', data: NEW.data, notebook: { title: 'alpha', subtitle: 'a study', text: '# alpha\n\nnotes' } });
const C0 = { items: { 'DEMOS/WATER': item04(demo('water')), 'DEMOS/N₂': item04(demo('n2')), 'study/alpha': alpha }, recent: ['study/alpha', 'DEMOS/WATER'] };
{
  const ls = memory({ [PJ_KEY]: JSON.stringify(C0) }), { store, files } = library(ls);
  assert.equal(store.refusal, null);
  assert.deepEqual(files.entries().map((e) => [e.id, e.folder + '/' + e.name]), [['f1', 'DEMOS/WATER'], ['f2', 'DEMOS/N₂'], ['f3', 'study/alpha']]);
  assert.deepEqual(files.entries()[2].payload, { parts: { [PART]: { data: alpha.data, notebook: alpha.notebook } } }, 'the item is not the ONE part');
  assert.equal(files.entries()[2].at, Date.parse(alpha.saved));
  const r = files.save({ name: 'beta', folder: 'study', payload: part(NEW.data, { title: 'beta', subtitle: '', text: '' }) });
  assert.equal(r.ok, true, r.why);
  const C1 = JSON.parse(ls.getItem(PJ_KEY));
  validateProjectCollection(C1);                                                     // the 0.4 validator: an older build reads it
  for (const p of Object.keys(C0.items)) {
    for (const k of ['path', 'folder', 'name', 'saved', 'opened']) assert.equal(C1.items[p][k], C0.items[p][k], p + '.' + k);
    assert.equal(JSON.stringify(C1.items[p].data), JSON.stringify(C0.items[p].data), p + ': its data moved');
    assert.equal(JSON.stringify(C1.items[p].notebook), JSON.stringify(C0.items[p].notebook), p + ': its notebook moved');
    assert.equal(projectFileText(C1.items[p]), JSON.stringify({ lambdawaves: 'project', version: 1, ...C0.items[p] }, null, 1), p + ': its export moved');
  }
  assert.deepEqual(C1.recent, C0.recent, 'RECENT was lost');
  assert.deepEqual(Object.keys(C1.items), ['DEMOS/WATER', 'DEMOS/N₂', 'study/alpha', 'study/beta']);
  assert.equal(C1.items['study/beta'].id, 'f4');
  /* a rename keeps its RECENT row (by id); touchRecent writes outside the kit's view */
  const view = store.getItem(PJ_KEY);
  assert.equal(touchRecent(ls, 'study/beta', '2026-10-09T00:00:00.000Z'), true);
  assert.equal(store.getItem(PJ_KEY), view, 'RECENT moved the kit\'s view');
  assert.equal(store.stale(), false);
  assert.equal(files.rename('f3', 'gamma').ok, true);
  const C2 = JSON.parse(ls.getItem(PJ_KEY));
  assert.deepEqual(C2.recent, ['study/beta', 'study/gamma', 'DEMOS/WATER']); assert.equal(C2.items['study/beta'].opened, '2026-10-09T00:00:00.000Z');
  assert.equal(C2.items['study/gamma'].opened, alpha.opened);
}
green('R10 a6 · a valid 0.4 collection (WATER, N₂ and a saved study, RECENT of two) lists all three through createFiles as the ONE part; a kit save adds a fourth and the three are byte-identical (path, folder, name, saved, opened, data, notebook, and their export); RECENT is kept, follows a rename by id, and the 0.4 validator reads the result');

/* ── (a) 7 · THE ROUND TRIP IS BYTE-EXACT: after every kit write, getItem is exactly what the kit wrote (its conflict check) ── */
{
  const ls = memory({ [PJ_KEY]: JSON.stringify(C0) }), { store, wrote, files } = library(ls);
  const ops = [['save', () => files.save({ name: 'beta', folder: 'study', payload: part({ a: 1 }) })],
    ['overwrite', () => files.overwrite('f3', { payload: part({ a: 2 }), thumb: 'data:image/jpeg;base64,AAAA', facts: { k: 1 } })],
    ['rename', () => files.rename('f4', 'BETA')], ['move', () => files.move('f4', 'elsewhere/deep')],
    ['folder picture', () => files.setFolderPicture('study', 'f3')], ['rename folder', () => files.renameFolder('study', 'studies')],
    ['seed', () => seed(files, [starterOf(STARTERS[0], read('../lab/demos/wave-dancer.lambdawaves.json'))], { storage: memory() })],
    ['refresh', () => files.refresh([{ id: 'f5', payload: part({ refreshed: true }), at: 1700000000000 }])],
    ['delete folder', () => files.deleteFolder('elsewhere')], ['remove', () => files.remove('f1')]];
  for (const [name, op] of ops) {
    const before = wrote.length, r = op();
    assert.notEqual(r.ok, false, name + ': ' + (r && r.why));
    assert.equal(wrote.length, before + 1, name + ': not one write');
    assert.equal(store.getItem(PJ_KEY), wrote.at(-1), name + ': getItem is not what the kit wrote (the round trip moved a byte)');
    validateProjectCollection(JSON.parse(ls.getItem(PJ_KEY)));
  }
  const C = JSON.parse(ls.getItem(PJ_KEY));
  assert.deepEqual(Object.keys(C.items), ['DEMOS/N₂', 'studies/alpha', 'BETA', 'DEMOS/WAVE DANCER']);
  assert.deepEqual(C.folders, { studies: { pictureId: 'f3' } });
  /* two stored paths that are ONE name to the kit ('a//b' and 'a/b'; 'X' and 'x') are told apart, not folded onto one another */
  const two = { items: { 'a//b': { path: 'a//b', folder: 'a/', name: 'b', data: { n: 1 }, notebook: {} }, 'a/b': { path: 'a/b', folder: 'a', name: 'b', data: { n: 2 }, notebook: {} },
    X: { path: 'X', name: 'X', data: { n: 3 }, notebook: {} }, x: { path: 'x', name: 'x', data: { n: 4 }, notebook: {} } } };
  const l2 = memory({ [PJ_KEY]: JSON.stringify(two) }), L2 = library(l2);
  assert.equal(L2.files.save({ name: 'c', folder: '', payload: part({ n: 5 }) }).ok, true);
  const T = JSON.parse(l2.getItem(PJ_KEY));
  assert.deepEqual(Object.values(T.items).map((it) => it.data.n).sort(), [1, 2, 3, 4, 5], 'a project was folded onto another');
  assert.deepEqual(Object.keys(T.items), ['a/b', 'a/b 2', 'X', 'x 2', 'c']);
}
green('R10 a7 · the round trip is byte-exact: after save, overwrite, rename, move, a folder picture, a folder rename, a seed, a refresh, a folder delete and a remove, the translator\'s getItem is exactly the text the kit wrote (no false "changed in another tab"), and every write is a collection the 0.4 validator reads; two stored paths that are one name to the kit (a//b and a/b, X and x) are numbered apart, never folded together');

/* ── (b) 1 · 8 MiB A PROJECT FILE, before it is parsed ── */
assert.throws(() => parseProjectFile(' '.repeat(MAX_PROJECT_BYTES + 1)), /exceeds 8 MiB/);
assert.throws(() => parseProjectFile(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'p', data: {}, notebook: { text: 'λ'.repeat(MAX_PROJECT_BYTES / 2) } })), /exceeds 8 MiB/);
assert.equal(parseProjectFile(JSON.stringify({ lambdawaves: 'project', path: 'p', data: {}, notebook: { text: 'x'.repeat(MAX_PROJECT_BYTES - 200) } })).path, 'p');
for (const bad of [{ path: 3 }, { path: '  ' }, { data: [] }, { data: null }, { version: 2 }, { saved: {} }, { folder: [] }, { name: 5 }, { opened: false },
  { notebook: [] }, { notebook: { title: 4 } }, { notebook: { text: {} } }, { lambdawaves: 'settings' }])
  assert.throws(() => parseProjectFile(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'demo/alpha', data: {}, notebook: {}, ...bad })), undefined, JSON.stringify(bad));
const legacy = parseProjectFile(JSON.stringify({ lambdawaves: 'project', path: 'demo/alpha', name: 'alpha', data: { x: 1 } }));
assert.deepEqual([legacy.folder, legacy.name, legacy.notebook], ['demo', 'alpha', { title: 'alpha', subtitle: '', text: '' }]);
green('R10 b1 · 8 MiB a project file, refused before JSON.parse (13 bytes over is "exceeds 8 MiB", not a SyntaxError; four-byte-wide λs count as bytes); 8 MiB less 200 parses; thirteen malformed envelopes are refused; a 0.3 file without version or notebook opens with its name as the notebook\'s title');

/* ── (b) 2 · 8 MiB AN ENTRY AT THE STORE, and 24 MiB THE LIBRARY ── */
{
  const ls = memory({ [PJ_KEY]: JSON.stringify(C0) }), { files } = library(ls), raw = ls.getItem(PJ_KEY);
  const big = files.save({ name: 'big', folder: '', payload: part({ blob: 'x'.repeat(MAX_PROJECT_BYTES) }) });
  assert.equal(big.ok, false); assert.match(big.why, /“big” is larger than a project may be \(8 MiB\) — nothing was written/);
  assert.equal(ls.getItem(PJ_KEY), raw, 'the over-cap save moved the store');
  /* an older build's save larger than 8 MiB, already stored, is kept as it is and does not block anything else */
  const old = { items: { ...C0.items, huge: { path: 'huge', name: 'huge', saved: alpha.saved, opened: alpha.saved, data: { blob: 'y'.repeat(MAX_PROJECT_BYTES + 10) }, notebook: {} } }, recent: [] };
  const l2 = memory({ [PJ_KEY]: JSON.stringify(old) }), L2 = library(l2);
  assert.equal(L2.files.save({ name: 'small', folder: '', payload: part({ s: 1 }) }).ok, true);
  assert.equal(JSON.parse(l2.getItem(PJ_KEY)).items.huge.data.blob.length, MAX_PROJECT_BYTES + 10);
  /* 24 MiB the library: three 7 MiB projects fit, a fourth is refused with the numbers, nothing written */
  const l3 = memory(), L3 = library(l3), seven = (c) => part({ blob: c.repeat(7 << 20) });
  for (const c of 'abc') assert.equal(L3.files.save({ name: c, folder: '', payload: seven(c) }).ok, true, c);
  const full = l3.getItem(PJ_KEY), d = L3.files.save({ name: 'd', folder: '', payload: seven('d') });
  assert.equal(d.ok, false); assert.equal(d.full, true); assert.equal(d.capChars, MAX_LIBRARY_CHARS); assert.ok(d.needChars > MAX_LIBRARY_CHARS);
  assert.equal(l3.getItem(PJ_KEY), full, 'the refused fourth moved the store');
  assert.equal(L3.files.remove('f1').ok, true, 'a write that shrinks a full library was refused');
}
green('R10 b2 · 8 MiB an entry at the store: a FOLDERS save of 8 MiB + is refused ("larger than a project may be (8 MiB) — nothing was written") and the stored text is byte-identical; an older build\'s 8 MiB + save already stored is kept as it is and blocks nothing; 24 MiB the library (' + MAX_LIBRARY_CHARS + ' characters): three 7 MiB projects fit, the fourth is refused full with the numbers and writes nothing, a remove still goes through');

/* ── (b) 3–4 · THE KIT'S DOOR WOULD TAKE 24 MiB; λWAVES' store takes 8.  Another app's project is refused by name ── */
{
  const env = (app, data) => stringify(wrap('project', data, { app, name: 'P' }));
  const mine = await readInput(new File([env(PART, part({ blob: 'z'.repeat(10 << 20) }))], 'p.mir'), { accept: ['project'], check: { app: PART } });
  assert.equal(mine.ok, true, 'the kit\'s checker refused a 10 MiB λWAVES project (its limit is ' + (LIMITS.project >> 20) + ' MiB): ' + JSON.stringify(mine.errors));
  const ls = memory({ [PJ_KEY]: JSON.stringify(C0) }), { files } = library(ls), raw = ls.getItem(PJ_KEY);
  const r = files.save({ name: 'P', folder: '', payload: mine.envelope.data });
  assert.equal(r.ok, false); assert.match(r.why, /8 MiB/); assert.equal(ls.getItem(PJ_KEY), raw);
  const theirs = await readInput(new File([env('basins', { parts: { fractal: {} } })], 'p.mir'), { accept: ['project'], check: { app: PART } });
  assert.equal(theirs.ok, false); assert.match(theirs.errors[0].why, /this project is basins's; this is lambdawaves/);
  const none = await readInput(new File([read('../lab/demos/water.lambdawaves.json')], 'water.mir'), { accept: ['project'], check: { app: PART } });
  assert.equal(none.ok, false, 'a .lambdawaves.json passed as a MIR envelope');
}
green('R10 b3–b4 · the 8 vs 24 MB cap: the kit\'s intake takes a 10 MiB λWAVES .mir (its project limit is ' + (LIMITS.project >> 20) + ' MiB) and the store refuses to keep it (8 MiB, nothing written); a BASINS project is refused by name ("this project is basins\'s; this is lambdawaves"), and a .lambdawaves.json is not a MIR envelope (projects.js\' door takes it, capped at 8 MiB before it is read)');

/* ── (c) A 1.4 NOTEBOOK IS PAGE 0 ── */
{
  /* the notebook as 0.4 (MIR 1.4) kept it — `lambdawaves.q0.notebook`, `.title`, `.subtitle` — is the ONE part's page 0 */
  const nb14 = { title: 'Rydberg', subtitle: 'a 1.4 notebook', text: '## n = 30\n\n$E_n = -1/2n^2$' };
  assert.deepEqual(pageFromNotebook(nb14), { title: 'Rydberg', md: '*a 1.4 notebook*\n\n## n = 30\n\n$E_n = -1/2n^2$' });
  assert.equal(pageFromNotebook({ title: 'NOTEBOOK', subtitle: '', text: ' \n\t ' }), null, 'an empty notebook made a page');
  assert.deepEqual(pageFromNotebook({ title: '', subtitle: '', text: 'x' }), { title: 'NOTEBOOK', md: 'x' });
  /* a 0.4 item's notebook rides in the part unchanged, so the kit reads the same page out of a FOLDERS entry, and a .mir of it */
  const ls = memory({ [PJ_KEY]: JSON.stringify(C0) }), { files } = library(ls), e = files.entries()[2];
  assert.deepEqual(pageFromNotebook(e.payload.parts[PART].notebook), { title: 'alpha', md: '*a study*\n\n# alpha\n\nnotes' });
  const back = await readInput(new File([stringify(wrap('project', e.payload, { app: PART, name: e.name }))], 'alpha.mir'), { accept: ['project'], check: { app: PART } });
  assert.equal(back.ok, true); assert.deepEqual(back.envelope.data.parts[PART].notebook, alpha.notebook, 'the .mir lost the notebook');
  /* every bundled demo's notebook is a page 0 with its heading */
  for (const s of STARTERS) { const st = starterOf(s, read('../lab/demos/' + s.file + '.lambdawaves.json')), pg = pageFromNotebook(st.data.parts[PART].notebook);
    assert.ok(pg && /^# /.test(pg.md.replace(/^\*[^*]*\*\n\n/, '')), s.file + ': no page 0'); assert.equal(st.readOnly, true); assert.equal(st.folder, 'DEMOS'); }
}
green('R10 c · a 1.4 notebook is page 0: the kit\'s pageFromNotebook reads λWAVES\' { title, subtitle, text } as { title, md } with the subtitle as the first italic line (an empty notebook is no page); a 0.4 item\'s notebook rides in the ONE part unchanged — the same page out of the FOLDERS entry and out of its .mir; the six bundled demos are read-only DEMOS starters, each with its page 0');

/* ── THE UNSAVED MARK (the part's signature, projectKey()), sliced out of rack.js as project-storage.test did ── */
{
  const rack = read('../lab/rack.js');
  const snapStart = rack.indexOf('function projectSnapshot()'), snapEnd = rack.indexOf('function projectKey()', snapStart);
  const keyStart = rack.indexOf('function projectKey() {'), keyEnd = rack.indexOf('const part = {', keyStart);
  assert.ok(snapStart > 0 && snapEnd > snapStart && keyEnd > keyStart, 'projectSnapshot / projectKey / the part moved in rack.js');
  let state = { experiment: { t: 0 }, presentation: { quality: { autoScale: 1 }, domain: { auto: true, half: 7 }, obs: {}, mat: { slice: {} }, rotationRates: {} } };
  const subtitle = { value: '' };
  const makeKey = new Function('serialize', 'titleIn', 'subIn', 'ta', 'modHost', 'modSeats',
    `const modulationBases=()=>null;${rack.slice(snapStart, snapEnd)}\n${rack.slice(keyStart, keyEnd)};return projectKey;`);
  const projectKey = makeKey(() => structuredClone(state), { value: 'Study' }, subtitle, { value: 'notes' }, null, () => ({}));
  const baseline = projectKey();
  state.presentation.domain.half = 16; state.experiment.t = 42; state.presentation.quality.autoScale = .5;
  assert.equal(projectKey(), baseline, 'automatic sizing, time or scale dirtied the project');
  subtitle.value = 'New subtitle'; assert.notEqual(projectKey(), baseline);
  subtitle.value = ''; state.presentation.domain.auto = false;
  const manual = projectKey(); state.presentation.domain.half = 17;
  assert.notEqual(projectKey(), manual, 'a manual domain edit is not dirty');
  assert.match(rack, /signature: \(\) => projectKey\(\),/, 'the part\'s signature is not projectKey()');
}
green('the unsaved mark is the part\'s signature, projectKey(): the domain under AUTO, the clock and the governor\'s scale do not dirty a project; a subtitle and a manual domain edit do');
console.log(`GREEN project-formats: ${greens} judged lines`);
