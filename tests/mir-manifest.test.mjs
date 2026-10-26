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
const ACCEPTED = { '1.5.0-alpha.28': '32569a04b22fc27facea4d73365a9d41887e460bc469243e1410dea345a574dd',   // iteration 014: the trickle-down rule (λWAVES edits the kit; docs/FOR-MIR.md)
  '1.5.0-alpha.27': '9d3fac82792c9655b8a59c45209a0995c4189f191f41907eaf29266a93e7bcdd',   // iteration 014: the trickle-down rule (λWAVES edits the kit; docs/FOR-MIR.md)
  '1.5.0-alpha.26': '060ddb35892a192b6788d730fe467091182a693573dbe0d6916f64196a7fdb14',   // iteration 014: the trickle-down rule (λWAVES edits the kit; docs/FOR-MIR.md)
  '1.5.0-alpha.25': '646392f348b26a2676b74bba7e15914ca49a4fd3b31100abc75d3923ac90b34e',   // iteration 014: the trickle-down rule (λWAVES edits the kit; docs/FOR-MIR.md)
  '1.4.3': 'a4c3b90102d02dcec420fe97a10dbac2a15d93d88ed5bb5f28977ff29f3d2d23',
  /* 0.5.0 C0 · R5-G1: λWAVES is PINNED to MIR 1.5.0-alpha.24 (kit commit 1b7ae99b9905, line 1.5), adopted by the 1.5 worktree's own
     tools/adopt.mjs; re-adopt once when brief 8 lands (PLAN §1). */
  '1.5.0-alpha.24': '3f969725fe44715bb96a42fc56d668defc9b9cfceeb4219d146ecd24cad35351',
  /* iteration 014 (Josh 2026-10-22: "lift") · the kit is edited in place under the trickle-down rule (docs/FOR-MIR.md's top section):
     A6 THE SCROLL PILL made 1.5.0-alpha.25; the manifest's file rows re-hashed for the six files it touched, `commit` still alpha.24's */
  '1.5.0-alpha.25': '646392f348b26a2676b74bba7e15914ca49a4fd3b31100abc75d3923ac90b34e' };
const manifestBytes = readFileSync(path.join(root, 'MIR-MANIFEST.json'));
const manifest = JSON.parse(manifestBytes.toString('utf8'));
assert.equal(manifest.kit, 'MIR');
/* 0.5.0 A10 · the canary's red 3: a 1.5 adoption names a pre-release ("1.5.0-alpha.24") and its LINE ("line": "1.5", MIR
   docs/LINES.md).  The shape widens; the pin below does not — a version is accepted only with its manifest's sha-256 in ACCEPTED. */
assert.match(manifest.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z][0-9A-Za-z.-]*)?$/);
if (Object.hasOwn(manifest, 'line')) assert.equal(manifest.line, manifest.version.split('.').slice(0, 2).join('.'), 'MIR-MANIFEST.json: "line" must be its own version\'s major.minor');
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
