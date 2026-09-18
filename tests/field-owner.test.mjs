/* field-owner.test.mjs — ONE OWNER FOR THE MOLECULAR VOLUME, as a law over the source.
 *
 * MOLECULAR WAVES stage 1 replaced "whoever writes the matrix last owns the frame" with one session object.  That
 * is only true while it stays true: a second caller of field.setMolecule / field.setMoleculeMatrix would restore
 * the old race in one line, and nothing else in the gate would notice, because both orders produce a picture.
 *
 * SO THE LAW IS THE NAME ITSELF, everywhere in lab/: `setMolecule` and `setMoleculeMatrix` may appear only in
 * lab/field.js, which DEFINES them, and lab/molecular-session.js, which is the only thing allowed to call them.
 * Mentioning them in a comment counts as a violation too, and on purpose — a header that documents the call is a
 * header that invites it, and this file is cheaper to satisfy than it is to argue with.  tests/ is exempt: the
 * field gate drives the kernel directly, which is what a kernel gate is for.
 *
 * Run:  node tests/field-owner.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAB = path.join(ROOT, 'lab');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const OWNER = 'lab/molecular-session.js', DEFINER = 'lab/field.js';
const NAMES = ['setMolecule', 'setMoleculeMatrix'];

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(LAB).sort();
assert.ok(files.length > 50, `the scan must see the whole of lab/, it found ${files.length} modules`);
const hits = [];
for (const p of files) {
  const name = rel(p);
  const src = readFileSync(p, 'utf8');
  for (const n of NAMES) {
    const re = new RegExp(`\\b${n}\\b`, 'g');
    let m, count = 0, lines = [];
    while ((m = re.exec(src))) { count++; if (lines.length < 4) lines.push(src.slice(0, m.index).split('\n').length); }
    if (!count) continue;
    if (name === DEFINER || name === OWNER) { hits.push({ file: name, n, count, allowed: true }); continue; }
    hits.push({ file: name, n, count, lines, allowed: false });
  }
}
const bad = hits.filter((h) => !h.allowed);
assert.deepEqual(bad, [], 'only lab/field.js (which defines them) and lab/molecular-session.js (which calls them) '
  + `may name ${NAMES.join(' / ')}; found ${bad.map((h) => `${h.file}:${h.lines.join(',')} ${h.n}`).join(' · ')}`);

/* and the owner must ACTUALLY call both, or the law is vacuous and the funnel is not wired */
const owner = readFileSync(path.join(ROOT, OWNER), 'utf8');
for (const n of NAMES) assert.match(owner, new RegExp(`\\.${n}\\(`), `${OWNER} must call field.${n}`);
const counts = Object.fromEntries(NAMES.map((n) => [n, hits.filter((h) => h.n === n).reduce((s, h) => s + h.count, 0)]));
console.log(`PASS one owner: across ${files.length} modules in lab/, \`setMolecule\` appears ${counts.setMolecule} times and`
  + ` \`setMoleculeMatrix\` ${counts.setMoleculeMatrix} times, all of them in ${DEFINER} (the definition) or ${OWNER} (the only caller);`
  + ' no other module names the molecular volume\'s two setters at all, in code or in a comment.');
