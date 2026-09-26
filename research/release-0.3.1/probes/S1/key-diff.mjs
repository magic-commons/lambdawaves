/* key-diff.mjs — which serialize() keys left in S1: reads scope-keys.before.json and scope-keys.after.json (two runs of
 * scope-keys.mjs on the tree before and after the change) and writes key-diff.json beside them.
 *   node research/release-0.3.1/probes/S1/key-diff.mjs */
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const read = (t) => JSON.parse(fs.readFileSync(path.join(here, `scope-keys.${t}.json`), 'utf8'));
const A = read('before').keys, B = read('after').keys;
const out = { left: {}, added: {}, bytes: { before: A.bytes, after: B.bytes, saved: A.bytes - B.bytes } };
for (const k of Object.keys(A)) {
  if (k === 'bytes') continue;
  const a = A[k] || [], b = B[k] || [];
  const left = a.filter((x) => !b.includes(x)), added = b.filter((x) => !a.includes(x));
  if (left.length) out.left[k] = left;
  if (added.length) out.added[k] = added;
}
const S0 = read('before').settings, S1 = read('after').settings;
out.settings = { before: { identical: S0.identical, bytes: [S0.bytesBefore, S0.bytesAfter], changed: S0.changed.length }, after: { identical: S1.identical, bytes: [S1.bytesBefore, S1.bytesAfter], changed: S1.changed.length } };
fs.writeFileSync(path.join(here, 'key-diff.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
