/* volumes-format.js — THE VOLUME FORMAT v1 (iteration 004 V1, research/iteration-004/PLAN.md): one molecule, all its rungs, in one
 * binary .lwm.  Pure and DOM-free: the page, the worker and node read it alike; tools/volumes/pack.mjs writes it with encodeLwm.
 *
 *   'LWM1' · u32 H (little-endian) · H bytes of UTF-8 JSON (the header) · zero pad to 8 · THE BLOBS, each 8-aligned, at offsets
 *   counted from the blob section's start.  header.rungs['<basis>'] = { record, blobs: { eps: { dtype: 'f64', offset, length },
 *   C: { dtype: 'f32', … }, mulliken: { dtype: 'f32', … } }, solve, check } — `length` in ELEMENTS; the record is a schema-1
 *   FRONTIER record (lab/library.js validateRecord) carrying every column, whose orbitals.eps / orbitals.C are { $blob: '<key>' }
 *   placeholders naming its rung's blobs.
 *
 *   parseLwm(bytes)           → { header, blob(basis, key) } — a typed array per blob (a copy, aligned), or throws on a bad file
 *   rungs(lwm)                → [{ basis, nAO, nocc, energy, gapEv }] in the header's (the ladder's) order
 *   rungRecord(lwm, basis)    → the schema-1 record the worker opens (chem.open), each placeholder → { $f64 | $f32: base64 }
 *   encodeLwm(header, data)   → Uint8Array: `data[basis][key]` a typed array; fills each rung's `blobs` (offsets) in the header
 * Typed arrays are little-endian; a big-endian host is refused by name rather than misread. */
export const MAGIC = 'LWM1', LWM_SCHEMA = 1;
const DTYPE = { f64: Float64Array, f32: Float32Array, i32: Int32Array };
const LE = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
const pad8 = (n) => (n + 7) & ~7;

export function parseLwm(input) {
  if (!LE) throw new Error('volumes-format: a big-endian host cannot read a .lwm (its arrays are little-endian)');
  const u8 = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (u8.length < 8 || String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== MAGIC) throw new Error('volumes-format: not a .lwm (no LWM1 magic)');
  const H = new DataView(u8.buffer, u8.byteOffset, 8).getUint32(4, true);
  if (8 + H > u8.length) throw new Error('volumes-format: the header runs past the end of the file');
  const header = JSON.parse(new TextDecoder().decode(u8.subarray(8, 8 + H)));
  if (header.schema !== LWM_SCHEMA) throw new Error(`volumes-format: schema ${header.schema} is not ${LWM_SCHEMA}`);
  const base = pad8(8 + H);
  const bytesOf = (b) => {
    const T = DTYPE[b && b.dtype];
    if (!T || !Number.isInteger(b.offset) || b.offset % 8 || !Number.isInteger(b.length) || b.length < 0) throw new Error('volumes-format: a malformed blob descriptor');
    const start = base + b.offset, end = start + b.length * T.BYTES_PER_ELEMENT;
    if (end > u8.length) throw new Error('volumes-format: a blob runs past the end of the file');
    return { T, bytes: u8.subarray(start, end) };
  };
  const blob = (basis, key) => {
    const r = header.rungs && header.rungs[basis], d = r && r.blobs && r.blobs[key];
    if (!d) throw new Error(`volumes-format: no blob ${basis}/${key}`);
    const { T, bytes } = bytesOf(d);
    return new T(bytes.slice().buffer);                            // a copy: aligned whatever the input's offset
  };
  return { header, blob, bytesOf };
}

export const rungs = (lwm) => Object.entries(lwm.header.rungs || {}).map(([basis, r]) => ({ basis, nAO: r.record.ground.nAO, nocc: r.record.ground.nocc,
  energy: r.record.ground.energy, gapEv: r.record.stem ? r.record.stem.gapEv : null }));

/** bytes → base64 without Buffer (the page, the worker) — in chunks, so a 1.5 MB C never builds one giant argument list */
function base64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export function rungRecord(lwm, basis) {
  const r = lwm.header.rungs && lwm.header.rungs[basis];
  if (!r) throw new Error(`volumes-format: ${lwm.header.id} has no ${basis} rung`);
  const fill = (v) => {
    if (Array.isArray(v)) return v.map(fill);
    if (!v || typeof v !== 'object') return v;
    if (typeof v.$blob === 'string') {
      const d = r.blobs[v.$blob]; if (!d) throw new Error(`volumes-format: ${basis} names a blob '${v.$blob}' it does not carry`);
      return { ['$' + d.dtype]: base64(lwm.bytesOf(d).bytes) };
    }
    const o = {}; for (const k of Object.keys(v)) o[k] = fill(v[k]); return o;
  };
  return fill(r.record);
}

export function encodeLwm(header, data) {
  if (!LE) throw new Error('volumes-format: a big-endian host cannot write a .lwm');
  const parts = []; let at = 0;
  for (const [basis, r] of Object.entries(header.rungs)) {
    r.blobs = {};
    for (const [key, arr] of Object.entries(data[basis] || {})) {
      const dtype = Object.keys(DTYPE).find((k) => arr instanceof DTYPE[k]);
      if (!dtype) throw new Error(`volumes-format: ${basis}/${key} is not a f64, f32 or i32 array`);
      r.blobs[key] = { dtype, offset: at, length: arr.length };
      parts.push({ at, bytes: new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength) }); at = pad8(at + arr.byteLength);
    }
  }
  const json = new TextEncoder().encode(JSON.stringify(header)), base = pad8(8 + json.length);
  const out = new Uint8Array(base + at);
  out.set([...MAGIC].map((c) => c.charCodeAt(0)), 0); new DataView(out.buffer).setUint32(4, json.length, true); out.set(json, 8);
  for (const p of parts) out.set(p.bytes, base + p.at);
  return out;
}
