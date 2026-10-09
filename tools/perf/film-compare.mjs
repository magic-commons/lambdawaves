/* tools/perf/film-compare.mjs <base.json> <tip.json> (0.5.0 C7; C7b) — the base-copy pixel lock: TAKE A PICTURE's bytes, EXPORT FRAMES'
 * decoded pixels and times, and (C7b, when both probes carry them) ONE PERIOD's and RECORD's every frame digest, every frame time and MP4 size. */
import fs from 'node:fs';
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const fa = a.frames.zip, fb = b.frames.zip;
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const film = (x, y) => (x && y && x.digests && y.digests ? { frames: [x.digests.length, y.digests.length], digestsIdentical: same(x.digests, y.digests), timesIdentical: same(x.times, y.times),
  differing: x.digests.map((d, i) => (d === y.digests[i] ? null : i)).filter((i) => i !== null).slice(0, 12), bytes: [x.bytes, y.bytes], mp4Identical: x.bytes === y.bytes } : null);
const out = {
  picture: { base: [a.picture.bytes, a.picture.hash, a.picture.px.hash], c7: [b.picture.bytes, b.picture.hash, b.picture.px.hash], bytesIdentical: a.picture.hash === b.picture.hash && a.picture.bytes === b.picture.bytes },
  frames: { base: { n: fa.frames, size: fa.size, bytes: fa.bytes }, c7: { n: fb.frames, size: fb.size, bytes: fb.bytes, part: fb.part },
    times: same(a.frames.times, b.frames.times), pixelHashesIdentical: same(fa.hashes, fb.hashes),
    differing: fa.hashes.map((h, i) => (h === fb.hashes[i] ? null : i)).filter((i) => i !== null), first: [fa.hashes[0], fb.hashes[0]], last: [fa.hashes[fa.hashes.length - 1], fb.hashes[fb.hashes.length - 1]] },
  loop: film(a.loop, b.loop), video: film(a.video, b.video),
};
console.log(JSON.stringify(out, null, 1));
const films = [out.loop, out.video].filter(Boolean).every((f) => f.digestsIdentical && f.timesIdentical && f.mp4Identical);
process.exit(out.picture.bytesIdentical && out.frames.pixelHashesIdentical && out.frames.times && films ? 0 : 1);
