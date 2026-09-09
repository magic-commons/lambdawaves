import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAX_PROJECT_BYTES, parseProjectImport, storeProjectImport } from '../lab/project-import.js';

const project = { lambdawaves: 'project', version: 1, path: 'demo/alpha', name: 'alpha',
  data: { experiment: { coefficients: [1, 0] }, presentation: {} },
  notebook: { title: 'Study', subtitle: '', text: '$x^2$' } };
const text = JSON.stringify(project);
assert.deepEqual(parseProjectImport(text).data, project.data);
assert.deepEqual(parseProjectImport(text).notebook, project.notebook);
const legacy = { ...project }; delete legacy.version; delete legacy.notebook;
assert.equal(parseProjectImport(JSON.stringify(legacy)).notebook.title, 'alpha');

for (const patch of [ { path: 3 }, { path: '  ' }, { data: [] }, { data: null },
  { version: 2 }, { saved: {} }, { folder: [] }, { name: 5 }, { opened: false },
  { notebook: [] }, { notebook: { title: 4 } }, { notebook: { text: {} } } ]) {
  let reads = 0, writes = 0;
  assert.throws(() => storeProjectImport(JSON.stringify({ ...project, ...patch }),
    () => { reads++; }, () => { writes++; }));
  assert.equal(reads, 0); assert.equal(writes, 0);
}
assert.throws(() => parseProjectImport('{'), SyntaxError);
assert.throws(() => parseProjectImport(' '.repeat(MAX_PROJECT_BYTES + 1)), /exceeds 8 MiB/);
assert.throws(() => parseProjectImport(JSON.stringify({ ...project,
  notebook: { text: 'λ'.repeat(MAX_PROJECT_BYTES / 2) } })), /exceeds 8 MiB/);

const original = { items: { kept: { path: 'kept', data: {}, notebook: {} } }, recent: ['kept'] };
const before = JSON.stringify(original);
let stored = before;
for (const write of [() => false, () => { throw new Error('QuotaExceededError'); }]) {
  assert.throws(() => storeProjectImport(text, () => original, write));
  assert.equal(JSON.stringify(original), before);
  assert.equal(stored, before);
}
assert.equal(storeProjectImport(text, () => original, next => { stored = JSON.stringify(next); return true; }), 'demo/alpha');
assert.ok(JSON.parse(stored).items.kept);
assert.deepEqual(JSON.parse(stored).recent, ['demo/alpha', 'kept']);
assert.equal(JSON.stringify(original), before);

storeProjectImport(JSON.stringify({ ...project, path: '__proto__' }), () => original,
  next => { stored = JSON.stringify(next); return true; });
assert.ok(Object.hasOwn(JSON.parse(stored).items, '__proto__'));
assert.equal(Object.getPrototypeOf(original.items), Object.prototype);
for (const collection of [null, [], { items: [] }, { items: {}, recent: 'broken' }]) {
  assert.throws(() => storeProjectImport(text, () => collection,
    () => { throw new Error('must not write'); }), /collection is invalid/);
}
console.log('GREEN project-import: legacy envelope, metadata validation, byte limit, failed-write preservation and safe project names');

// Execute the real rack import method with storage/render seams, so a failed
// write or corrupt stored JSON cannot accidentally take the UI success path.
const rack = readFileSync(new URL('../lab/rack.js', import.meta.url), 'utf8');
const method = rack.split('\n').find(line => line.trim().startsWith('importText(text) {'));
assert.ok(method);
let renders = 0;
let disk = before;
let failWrite = false;
const localStorage = { getItem: () => disk };
const api = new Function('storeProjectImport', 'localStorage', 'PJ_KEY', 'pjWrite', 'renderProjects',
  `return ({${method}});`)(storeProjectImport, localStorage, 'projects', next => {
    if (failWrite) return false;
    disk = JSON.stringify(next); return true;
  }, () => { renders++; });
failWrite = true;
assert.throws(() => api.importText(text), /could not be saved/);
assert.equal(renders, 0); assert.equal(disk, before);
failWrite = false;
disk = '{broken';
assert.throws(() => api.importText(text), SyntaxError);
assert.equal(disk, '{broken'); assert.equal(renders, 0);
disk = before;
assert.equal(api.importText(text), 'demo/alpha');
assert.equal(renders, 1); assert.ok(JSON.parse(disk).items.kept);
console.log('GREEN rack import integration: corrupt storage preserved; failed write never renders success; valid import refreshes list');
