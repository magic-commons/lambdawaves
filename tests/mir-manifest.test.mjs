// Prove the adopted bytes against the committed inventory without needing a
// sibling MIR checkout. The upstream adoption tool writes this manifest.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
/* THE PIN (0.4.0 S0 · wave 138).  The checks below hash the adopted files against THIS manifest, so a commit that edits a kit
   file AND rewrites the manifest ("1.4.4", 2026-10-05, a release MIR never cut) passed them.  Each accepted MIR version
   pins the sha-256 of the manifest's own bytes: a forged version fails here, in every checkout and every CI, and a real
   adoption is a visible TWO-file edit — MIR-MANIFEST.json (written by MIR's tools/adopt.mjs) and its row below. */
const ACCEPTED = { '1.4.3': 'a4c3b90102d02dcec420fe97a10dbac2a15d93d88ed5bb5f28977ff29f3d2d23' };
const manifestBytes = readFileSync(path.join(root, 'MIR-MANIFEST.json'));
const manifest = JSON.parse(manifestBytes.toString('utf8'));
assert.equal(manifest.kit, 'MIR');
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
const manifestSha = createHash('sha256').update(manifestBytes).digest('hex');
assert.ok(Object.hasOwn(ACCEPTED, manifest.version), 'MIR-MANIFEST.json names MIR ' + manifest.version + ', which is not an accepted adoption (accepted: ' + Object.keys(ACCEPTED).join(', ') + '). A real adoption is a two-file edit: the manifest MIR\'s tools/adopt.mjs writes, and its sha-256 pinned in ACCEPTED in tests/mir-manifest.test.mjs.');
assert.equal(manifestSha, ACCEPTED[manifest.version], 'MIR-MANIFEST.json for MIR ' + manifest.version + ' has sha-256 ' + manifestSha + ', not the pinned ' + ACCEPTED[manifest.version] + '. The manifest was edited without re-adoption; a real adoption is a two-file edit: the manifest MIR\'s tools/adopt.mjs writes, and its pin in ACCEPTED.');
assert.ok(manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files));

function inventory(relative) {
  return readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap(entry => {
    const name = relative + '/' + entry.name;
    if (entry.isDirectory()) return inventory(name);
    assert.ok(entry.isFile(), 'adopted assets must be regular files: ' + name);
    return [name];
  });
}
const files = ['lab/mir', 'lab/fonts'].flatMap(inventory).sort();
assert.deepEqual(Object.keys(manifest.files).sort(), files,
  'MIR inventory must cover every adopted file, with no missing or stale entries');
for (const file of files) {
  assert.match(manifest.files[file], /^[a-f0-9]{16}$/, 'invalid content hash: ' + file);
  const actual = createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex').slice(0, 16);
  assert.equal(actual, manifest.files[file], 'MIR bytes changed without re-adoption: ' + file);
}
console.log(`PASS MIR ${manifest.version}: all ${files.length} adopted files match the committed manifest, and the manifest is the pinned one (sha-256 ${manifestSha.slice(0, 12)}…)`);
