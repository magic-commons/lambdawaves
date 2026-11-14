#!/usr/bin/env node
/* tools/volumes/lwv-write.mjs — THE ARCHIVE's writer (lab/volumes-format.js 'LWV1'), moved whole out of pack.mjs at 044 S14 so that a
 * volume already packed can have its one-file .lwv written again without packing it again:
 *
 *   node tools/volumes/lwv-write.mjs --dist <a dist folder> --volume vol-1
 *
 * reads <dist>/volumes.json and <dist>/<vol>/index.json (which must hash to the shelf entry's indexSha256), writes
 * <dist>/LAMBDAWAVES-VOL-<numeral>.lwv and its .sha256, reads the archive back entry by entry, and sets the shelf entry's
 * `archive: { name, bytes, sha256 }` in <dist>/volumes.json.  pack.mjs --archive calls the same function. */
import { readFileSync, writeFileSync, renameSync, openSync, readSync, writeSync, closeSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LWV_MAGIC, parseLwv } from '../../lab/volumes-format.js';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const variantPaths = (r) => (r.thumbs || []).map((st) => 't/' + r.id + '.' + st + '.webp');
const pad8 = (n) => Math.ceil(n / 8) * 8;   // plain arithmetic: a bitwise AND wraps at 2 GiB, and VOL. I is 5.95 GB

/* ── THE ARCHIVE: 'LWV1' · u32 H · the index JSON · pad to 8 · every file 8-aligned; deterministic (no clock; the same dist → the same bytes) ── */
export function writeArchive(entry, rows, vdir, DIST) {
  const files = [{ path: 'index.json' }, ...rows.map((r) => ({ path: r.file })), ...rows.filter((r) => r.thumb).map((r) => ({ path: r.thumb })), ...rows.flatMap(variantPaths).map((f) => ({ path: f }))]
    .map((f) => { const b = readFileSync(path.join(vdir, f.path)); return { path: f.path, offset: 0, length: b.length, sha256: sha(b) }; });
  const volume = { ...entry };
  let base = 0, text = '', end = 0;
  for (;;) {                                                       // the offsets live in the index: iterate to its fixed point (its length only grows)
    end = base; for (const f of files) { f.offset = end; end = f.offset + f.length; end = pad8(end); }
    text = JSON.stringify({ schema: 1, volume, files });
    const nb = pad8(8 + Buffer.byteLength(text)); if (nb === base) break; base = nb;
  }
  const name = `LAMBDAWAVES-VOL-${entry.numeral}.lwv`, out = path.join(DIST, name), tmp = out + '.tmp', hash = createHash('sha256');
  const head = Buffer.alloc(base); head.write(LWV_MAGIC, 0, 'latin1'); head.writeUInt32LE(Buffer.byteLength(text), 4); head.write(text, 8, 'utf8');
  const fd = openSync(tmp, 'w'); let at = 0;
  const put = (b) => { writeSync(fd, b); hash.update(b); at += b.length; };
  put(head);
  for (const f of files) { if (f.offset > at) put(Buffer.alloc(f.offset - at)); put(readFileSync(path.join(vdir, f.path))); }
  closeSync(fd); renameSync(tmp, out);
  const digest = hash.digest('hex');
  writeFileSync(out + '.sha256', `${digest}  ${name}\n`);
  /* read back through the app's reader: the index parses and every file sits where it says, with its bytes — entry by entry at its
     offset, since an archive is larger than one Buffer may be (VOL. I is 5.95 GB; readFileSync stops at 2 GiB) */
  const rfd = openSync(out, 'r');
  const slice = (offset, length) => { const b = Buffer.alloc(length); let n = 0; while (n < length) { const k = readSync(rfd, b, n, length - n, offset + n); if (!k) break; n += k; } return b; };
  const idx = parseLwv(slice(0, base));
  for (const f of idx.files) if (sha(slice(f.offset, f.length)) !== f.sha256) { closeSync(rfd); throw new Error(`${name}: ${f.path} does not read back`); }
  closeSync(rfd);
  return { name, bytes: at, sha256: digest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const DIST = path.resolve(arg('--dist') || ''), VOL = arg('--volume');
  if (!arg('--dist') || !VOL) { console.error('lwv-write.mjs --dist <dist> --volume vol-N'); process.exit(2); }
  const shelfFile = path.join(DIST, 'volumes.json'), shelf = JSON.parse(readFileSync(shelfFile, 'utf8')), entry = shelf.volumes.find((v) => v.id === VOL);
  if (!entry) { console.error(`${VOL} is not on ${shelfFile}`); process.exit(2); }
  const text = readFileSync(path.join(DIST, VOL, 'index.json'));
  if (sha(text) !== entry.indexSha256) { console.error(`${VOL}/index.json does not hash to the shelf's indexSha256`); process.exit(2); }
  const t = Date.now(); delete entry.archive;
  entry.archive = writeArchive(entry, JSON.parse(text).molecules, path.join(DIST, VOL), DIST);
  writeFileSync(shelfFile, JSON.stringify(shelf, null, 1) + '\n');
  console.log(`${entry.archive.name} ${entry.archive.bytes} B sha256 ${entry.archive.sha256} in ${Math.round((Date.now() - t) / 1000)} s`);
}
