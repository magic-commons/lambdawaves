/* core/zip.js — THE STORED ZIP: a writer and a reader for the one kind of ZIP the kit makes (harvested from BASINS
 * app/export-zip.js, 2026-10-05).  "Stored" means method 0, no deflate: a PNG frame and an audio file are already
 * compressed, deflating them again only burns time, and a stored entry is a straight copy in and a straight view out.
 * Used by the project ZIP (folders/zip.js) and the recorder's frame parts; any app may use it for its own bundle.
 *
 *   const zip = new StoredZip();  zip.add('project.json', bytes);  zip.add('assets/a.wav', wav);  const blob = zip.finish();
 *   const files = readStoredZip(new Uint8Array(await blob.arrayBuffer()));   // Map name → Uint8Array view
 *
 * THE LAWS.  Every entry carries its CRC-32 (core/png.js crc32, the one table) and the reader refuses an entry whose
 * bytes disagree.  A part stays under classic ZIP's 32-bit offsets (4 GiB less a margin, 65,535 entries): add() throws
 * past it, and the caller starts the next part (the recorder's PNG parts do).  The reader refuses a compressed entry
 * by name (it would be silently wrong) and a directory that points outside the file.  No DOM, no globals but Blob and
 * TextEncoder: node runs it.
 *
 *   StoredZip { add(name, bytes) → size so far, finish() → Blob, bytes, entries }       PngZipPart is the same class
 *   readStoredZip(data: Uint8Array) → Map<name, Uint8Array>
 *   ZIP_LIMIT, zipSafeName(name) */
import { crc32 } from './png.js';

const enc = new TextEncoder(), dec = new TextDecoder();
const u16 = (d, o, n) => d.setUint16(o, n, true);
const u32 = (d, o, n) => d.setUint32(o, n >>> 0, true);
/** a part's size ceiling: below 2^32 with room for the directory */
export const ZIP_LIMIT = 0xf0000000;
/** an entry name that cannot climb out of where it is unpacked: no leading slash, no `..` segment, no backslash */
export const zipSafeName = (name) => typeof name === 'string' && name.length > 0 && !/^[/\\]/.test(name) && !name.includes('\\') && !name.split('/').includes('..');

export class StoredZip {
  constructor() { this.parts = []; this.entries = []; this.bytes = 0; }
  add(name, bytes) {
    const title = enc.encode(name);
    if (!(bytes instanceof Uint8Array) || title.length > 65535 || bytes.length > 0xffffffff) throw new Error(name + ' is too large for a ZIP part');
    const next = this.bytes + 30 + title.length + bytes.length;
    if (next > ZIP_LIMIT || this.entries.length >= 65535) throw new Error('ZIP part is full');
    const head = new Uint8Array(30 + title.length), d = new DataView(head.buffer);
    u32(d, 0, 0x04034b50); u16(d, 4, 20); u16(d, 6, 0); u16(d, 8, 0);
    u32(d, 14, crc32(bytes)); u32(d, 18, bytes.length); u32(d, 22, bytes.length);
    u16(d, 26, title.length); head.set(title, 30);
    this.entries.push({ title, crc: d.getUint32(14, true), size: bytes.length, offset: this.bytes });
    this.parts.push(head, bytes);
    this.bytes = next;
    return this.bytes;
  }
  finish() {
    const central = [];
    let centralSize = 0;
    for (const e of this.entries) {
      const h = new Uint8Array(46 + e.title.length), d = new DataView(h.buffer);
      u32(d, 0, 0x02014b50); u16(d, 4, 20); u16(d, 6, 20);
      u32(d, 16, e.crc); u32(d, 20, e.size); u32(d, 24, e.size);
      u16(d, 28, e.title.length); u32(d, 42, e.offset); h.set(e.title, 46);
      central.push(h); centralSize += h.length;
    }
    const end = new Uint8Array(22), d = new DataView(end.buffer);
    u32(d, 0, 0x06054b50); u16(d, 8, this.entries.length);
    u16(d, 10, this.entries.length); u32(d, 12, centralSize); u32(d, 16, this.bytes);
    return new Blob([...this.parts, ...central, end], { type: 'application/zip' });
  }
}
export class PngZipPart extends StoredZip {}

/** readStoredZip(data) — a stored (method 0) ZIP back into name → bytes views, refusing any entry whose CRC disagrees */
export function readStoredZip(data) {
  if (!(data instanceof Uint8Array)) throw new Error('Not a ZIP file');
  const d = new DataView(data.buffer, data.byteOffset, data.byteLength), files = new Map(), len = data.length;
  let end = -1;
  for (let i = len - 22; i >= Math.max(0, len - 65557); i--) if (d.getUint32(i, true) === 0x06054b50) { end = i; break; }
  if (end < 0) throw new Error('Not a ZIP file');
  let at = d.getUint32(end + 16, true);
  for (let n = d.getUint16(end + 10, true); n > 0; n--) {
    if (at + 46 > len || d.getUint32(at, true) !== 0x02014b50) throw new Error('ZIP directory is damaged');
    const method = d.getUint16(at + 10, true), crc = d.getUint32(at + 16, true), size = d.getUint32(at + 20, true);
    const nameLen = d.getUint16(at + 28, true), extra = d.getUint16(at + 30, true), comment = d.getUint16(at + 32, true), local = d.getUint32(at + 42, true);
    if (at + 46 + nameLen > len || local + 30 > len) throw new Error('ZIP directory is damaged');
    const name = dec.decode(data.subarray(at + 46, at + 46 + nameLen)), start = local + 30 + d.getUint16(local + 26, true) + d.getUint16(local + 28, true);
    if (method !== 0) throw new Error(name + ' is compressed; only stored ZIPs are read');
    if (start + size > len) throw new Error('ZIP directory is damaged');
    const bytes = data.subarray(start, start + size);
    if (crc32(bytes) !== crc) throw new Error(name + ' failed its CRC');
    files.set(name, bytes); at += 46 + nameLen + extra + comment;
  }
  return files;
}
