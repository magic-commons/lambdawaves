/* tools/perf/film-compare.mjs <base.json> <c7.json> (0.5.0 C7) — the base-copy pixel lock: EXPORT FRAMES' decoded pixels and TAKE A PICTURE's bytes, pre-C7 vs C7. */
import fs from 'node:fs';
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const fa = a.frames.zip, fb = b.frames.zip;
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const out = {
  picture: { base: [a.picture.bytes, a.picture.hash, a.picture.px.hash], c7: [b.picture.bytes, b.picture.hash, b.picture.px.hash], bytesIdentical: a.picture.hash === b.picture.hash && a.picture.bytes === b.picture.bytes },
  frames: { base: { n: fa.frames, size: fa.size, bytes: fa.bytes }, c7: { n: fb.frames, size: fb.size, bytes: fb.bytes, part: fb.part },
    times: same(a.frames.times, b.frames.times), pixelHashesIdentical: same(fa.hashes, fb.hashes),
    differing: fa.hashes.map((h, i) => (h === fb.hashes[i] ? null : i)).filter((i) => i !== null), first: [fa.hashes[0], fb.hashes[0]], last: [fa.hashes[fa.hashes.length - 1], fb.hashes[fb.hashes.length - 1]] },
};
console.log(JSON.stringify(out, null, 1));
process.exit(out.picture.bytesIdentical && out.frames.pixelHashesIdentical && out.frames.times ? 0 : 1);
