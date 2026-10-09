/* core/png.js — A PICTURE THAT CARRIES AN ENVELOPE: one iTXt chunk, keyword `mir`, inside an ordinary PNG.
 *
 * THE LAWS IT KEEPS
 *   · A PICTURE CARRIES DATA, NEVER CODE.  The chunk holds an envelope's JSON text (core/envelope.js); whoever extracts
 *     it runs it through check() like any other file.  Nothing here interprets the data.
 *   · ONE CHUNK.  embed() writes one iTXt chunk, keyword `mir`, uncompressed, just before IEND, and removes any older
 *     `mir` chunk first: embedding twice replaces, never duplicates.  Every other chunk is copied byte for byte, so the
 *     picture is pixel-identical and any PNG writer's output (the browser's canvas.toBlob, λWAVES' own encoder in
 *     lab/capture.js, which frames chunks the standard way: length · type · data · CRC-32 over type + data) works.
 *   · NEVER THROWS.  A non-PNG, a truncated file, a bad CRC on the `mir` chunk, text that is not an envelope: extract()
 *     gives null and embed() gives null.  Pure: Uint8Array in and out, no canvas, no DOM, so node tests run it.
 *   · THE LIMIT, SAID HONESTLY.  The chunk survives a file copy, a download, an upload that keeps the original bytes and
 *     a drop.  It does NOT survive a re-encode: an OS screenshot of the picture, most chat apps, an image editor's
 *     "export", a social site.  They write new pixels and drop unknown chunks.  That case is what a visible QR is for
 *     (not built).
 *
 * embed(pngBytes, envelope | text) → Uint8Array | null · extract(pngBytes) → envelope | null
 * extractText(pngBytes) → string | null · chunks(pngBytes) → [{ type, start, length, crcOk }] | null · crc32(bytes) */
import { unwrap, stringify } from './envelope.js';

export const SIGNATURE = Object.freeze([137, 80, 78, 71, 13, 10, 26, 10]);
export const KEYWORD = 'mir';

const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
/** crc32(bytes) — the PNG/zlib CRC-32 (same table and framing as λWAVES lab/capture.js) */
export function crc32(bytes, seed = 0) {
  let c = (seed ^ 0xffffffff) >>> 0;
  for (let i = 0; i < bytes.length; i++) c = (CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}

const u32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const isPng = (b) => b instanceof Uint8Array && b.length >= 8 && SIGNATURE.every((v, i) => b[i] === v);

/** chunks(bytes) → [{ type, start, length, crcOk }] up to and including IEND, or null if the file is not a whole PNG.
 *  `start` is the chunk's first byte (its length field); the chunk is 12 + length bytes. */
export function chunks(b) {
  if (!isPng(b)) return null;
  const out = []; let o = 8;
  while (o + 12 <= b.length) {
    const length = u32(b, o);
    if (length > 0x7fffffff || o + 12 + length > b.length) return null;           // truncated
    const type = String.fromCharCode(b[o + 4], b[o + 5], b[o + 6], b[o + 7]);
    if (!/^[A-Za-z]{4}$/.test(type)) return null;
    const crcOk = crc32(b.subarray(o + 4, o + 8 + length)) === u32(b, o + 8 + length);
    out.push({ type, start: o, length, crcOk });
    o += 12 + length;
    if (type === 'IEND') return out;
  }
  return null;                                                                      // no IEND: truncated
}

function chunk(type, data) {
  const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/* iTXt: keyword \0 · compression flag · compression method · language tag \0 · translated keyword \0 · UTF-8 text */
function itxt(text) {
  const kw = new TextEncoder().encode(KEYWORD), body = new TextEncoder().encode(text);
  const data = new Uint8Array(kw.length + 5 + body.length);
  data.set(kw, 0); let o = kw.length;
  data[o++] = 0; data[o++] = 0; data[o++] = 0; data[o++] = 0; data[o++] = 0;     // \0, uncompressed, method 0, '' \0, '' \0
  data.set(body, o);
  return chunk('iTXt', data);
}
/* the text of an iTXt chunk if its keyword is ours, else null.  A compressed one is not ours to read (we never write one). */
function ourText(b, c) {
  if (c.type !== 'iTXt') return null;
  const d = b.subarray(c.start + 8, c.start + 8 + c.length);
  const z = d.indexOf(0); if (z < 0) return null;
  if (new TextDecoder().decode(d.subarray(0, z)) !== KEYWORD) return null;
  if (d[z + 1] !== 0) return '';                                                    // compressed: ours by name, unreadable here
  let o = z + 3;
  const z1 = d.indexOf(0, o); if (z1 < 0) return null; o = z1 + 1;                  // language tag
  const z2 = d.indexOf(0, o); if (z2 < 0) return null; o = z2 + 1;                  // translated keyword
  try { return new TextDecoder('utf-8', { fatal: true }).decode(d.subarray(o)); } catch (_) { return null; }
}
const isOurs = (b, c) => c.type === 'iTXt' && ourText(b, c) !== null;

/** embed(pngBytes, envelope | text) → a new PNG with the envelope in one `mir` chunk before IEND; null if not a PNG */
export function embed(b, env) {
  try {
    const list = chunks(b); if (!list) return null;
    const text = typeof env === 'string' ? env : stringify(env);
    const keep = list.filter((c) => c.type !== 'IEND' && !isOurs(b, c)), iend = list[list.length - 1];
    const ours = itxt(text);
    let n = 8 + ours.length + 12; for (const c of keep) n += 12 + c.length;
    const out = new Uint8Array(n); out.set(SIGNATURE, 0); let o = 8;
    for (const c of keep) { out.set(b.subarray(c.start, c.start + 12 + c.length), o); o += 12 + c.length; }
    out.set(ours, o); o += ours.length;
    out.set(b.subarray(iend.start, iend.start + 12), o);
    return out;
  } catch (_) { return null; }
}

/** extractText(pngBytes) → the `mir` chunk's text, or null (no chunk, not a PNG, truncated, a bad CRC on our chunk) */
export function extractText(b) {
  try {
    const list = chunks(b); if (!list) return null;
    for (const c of list) { const t = ourText(b, c); if (t !== null) return c.crcOk && t ? t : null; }
    return null;
  } catch (_) { return null; }
}

/** extract(pngBytes) → the envelope the picture carries (its frame read, its data NOT yet checked), or null */
export function extract(b) {
  const t = extractText(b); if (t == null) return null;
  return unwrap(t).envelope;
}
