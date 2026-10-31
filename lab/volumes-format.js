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
 *   espOf(lwm)                → the potential grid { n, box, f16, … } or null (iteration 014 C1)
 *   rungRecord(lwm, basis)    → the schema-1 record the worker opens (chem.open), each placeholder → { $f64 | $f32: base64 }
 *   encodeLwm(header, data)   → Uint8Array: `data[basis][key]` a typed array; fills each rung's `blobs` (offsets) in the header
 * Typed arrays are little-endian; a big-endian host is refused by name rather than misread.
 *
 * THE ARCHIVE (iteration 005 S): one volume in one file, LAMBDAWAVES-VOL-<numeral>.lwv (tools/volumes/pack.mjs --archive) —
 *   'LWV1' · u32 H · H bytes of UTF-8 JSON { schema: 1, volume: <its shelf entry>, files: [{ path, offset, length, sha256 }] } · zero pad
 *   to 8 · the files, each at its 8-aligned offset from the file's start (index.json first, then m/*.lwm, then t/*.webp; paths relative to
 *   the volume's folder).  lwvIndexLength(first 8 bytes) → 8 + H; parseLwv(the first 8 + H bytes) → the index, checked. */
export const MAGIC = 'LWM1', LWM_SCHEMA = 1, LWV_MAGIC = 'LWV1';
const DTYPE = { f64: Float64Array, f32: Float32Array, i32: Int32Array, f16: Uint16Array };   // f16: IEEE binary16 bits (iteration 014 C1's potential grid)
const LE = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
const pad8 = (n) => Math.ceil(n / 8) * 8;   // plain arithmetic: a bitwise AND wraps at 2 GiB, and an archive is 5.95 GB (030)

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
    const copy = new Uint8Array(bytes.length); copy.set(bytes);    // a copy: aligned whatever the input's offset (a node Buffer's slice is a view)
    return new T(copy.buffer);
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

/** THE POTENTIAL GRID (iteration 014 C1; tools/volumes/esp-pass.py, carried by pack.mjs): { n, box, f16, basis, min, max, charges, unit, grid }
 *  or null — φ in Eh/e on n³ cell centres of the cube [−box, box]³ bohr about the origin, x_i = −box + (i + ½)·2·box/n, flat index i + n·(j + n·k);
 *  f16 a Uint16Array of IEEE binary16 bits (upload as an r16float texture); charges the rung's Mulliken charges per atom; basis the rung it is of */
export function espOf(lwm) {
  const e = lwm.header.esp;
  if (!e || !lwm.header.rungs || !lwm.header.rungs[e.basis]) return null;
  return { ...e, f16: lwm.blob(e.basis, 'esp') };
}
/* iteration 014 B3 · THE POTENTIAL's GRID, OPTIONAL (chain C's C1 writes it; a file without it is unchanged): header.rungs[basis].esp =
 * { n, box } over the rung's blob `esp` (dtype 'f16', n³ halves, x fastest), the TOTAL φ (hartree/e, nuclei included) at the cell centres
 * of [−box, box]³ bohr.  espGrid(lwm, basis) → { n, half, data: Float32Array(n³) } for field.js setEspGrid, or null (the app's Poisson pass). */
function half2f(h) { const e = (h >> 10) & 31, m = h & 1023, s = h & 32768 ? -1 : 1; return e === 0 ? s * m * 2 ** -24 : e === 31 ? (m ? NaN : s * Infinity) : s * (1 + m / 1024) * 2 ** (e - 15); }
export function espGrid(lwm, basis) {
  const r = lwm.header.rungs && lwm.header.rungs[basis], top = lwm.header.esp && lwm.header.esp.basis === basis ? lwm.header.esp : null, e = (r && r.esp) || top, d = r && r.blobs && r.blobs.esp;   // C1 writes header.esp { basis, n, box … } at the top; B3's own layout is header.rungs[basis].esp
  if (!e || !d || !(e.n >= 2) || !(e.box > 0) || d.length !== e.n ** 3 || (d.dtype !== 'f16' && d.dtype !== 'f32')) return null;
  const raw = lwm.blob(basis, 'esp'), data = d.dtype === 'f32' ? raw : Float32Array.from(raw, half2f);
  return { n: e.n, half: e.box, data };
}

export function encodeLwm(header, data) {
  if (!LE) throw new Error('volumes-format: a big-endian host cannot write a .lwm');
  const parts = []; let at = 0;
  for (const [basis, r] of Object.entries(header.rungs)) {
    r.blobs = {};
    for (const [key, arr] of Object.entries(data[basis] || {})) {
      const dtype = Object.keys(DTYPE).find((k) => arr instanceof DTYPE[k]);
      if (!dtype) throw new Error(`volumes-format: ${basis}/${key} is not a f64, f32, i32 or f16 (u16) array`);
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

const lwvHead = (u8) => {
  if (u8.length < 8 || String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== LWV_MAGIC) throw new Error('volumes-format: not a volume file (no LWV1 magic)');
  return 8 + new DataView(u8.buffer, u8.byteOffset, 8).getUint32(4, true);
};
export const lwvIndexLength = (bytes) => lwvHead(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
export function parseLwv(input) {
  const u8 = input instanceof Uint8Array ? input : new Uint8Array(input), end = lwvHead(u8);
  if (end > u8.length) throw new Error('volumes-format: the volume file\'s index runs past the bytes given');
  const idx = JSON.parse(new TextDecoder().decode(u8.subarray(8, end)));
  if (!idx || idx.schema !== 1 || !idx.volume || typeof idx.volume.id !== 'string' || !Array.isArray(idx.files) || !idx.files.length) throw new Error('volumes-format: the volume file\'s index is not schema 1');
  let at = pad8(end);
  for (const f of idx.files) {
    if (!f || typeof f.path !== 'string' || !/^(?!\/)(?!.*\.\.)[A-Za-z0-9._+/-]{1,200}$/.test(f.path) || !/^[0-9a-f]{64}$/.test(f.sha256)
      || !Number.isSafeInteger(f.offset) || !Number.isSafeInteger(f.length) || f.length < 0 || f.offset % 8 || f.offset < at) throw new Error('volumes-format: a malformed file entry in the volume file');
    at = pad8(f.offset + f.length);
  }
  if (idx.files[0].path !== 'index.json') throw new Error('volumes-format: the volume file does not begin with its catalogue');
  return idx;
}
