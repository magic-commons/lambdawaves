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
const ACCEPTED = {
  /* 021 K4 · KIT DAY: MIR 1.5.5, the first shipped 1.5 — the λWAVES lift (alpha.25–33 built here under the retired trickle-down rule,
     folded home and cut as kit commit a7fba3995839, tag v1.5.5), adopted by MIR's tools/adopt.mjs.  From here the kit sentence (CLAUDE.md:6):
     lab/mir is written by adopt.mjs alone, a λWAVES need is an additive door 1.5.6-alpha.N, and each adoption pins its row here. */
  '1.5.5': 'f7c96a12a28cc07cf5c4e981e5f79903e9e8f62fe7aaaaec0f35004a4538ebb7',
  '1.4.3': 'a4c3b90102d02dcec420fe97a10dbac2a15d93d88ed5bb5f28977ff29f3d2d23',
  /* 0.5.0 C0 · R5-G1: λWAVES was PINNED to MIR 1.5.0-alpha.24 (kit commit 1b7ae99b9905, line 1.5), adopted by the 1.5 worktree's own
     tools/adopt.mjs */
  '1.5.0-alpha.24': '3f969725fe44715bb96a42fc56d668defc9b9cfceeb4219d146ecd24cad35351' };
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
/* 021 K4: the kit has one version — the adopted tokens.json names the same kit the manifest does (MIR tests/version.node.mjs holds it at home) */
assert.equal(JSON.parse(readFileSync(path.join(root, 'lab/mir/tokens.json'), 'utf8')).kit, manifest.version, 'lab/mir/tokens.json "kit" is not the adopted MIR version');

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
