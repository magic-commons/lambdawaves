/* statelink.js — THE URL STATE CODEC.  Every state of this lab is a LINK.
 *
 * WHAT THIS IS.  rack.js already has ONE serialisation of a session: serialize() builds
 * { experiment, presentation } and restore() consumes it — that is the project file, the quick
 * save, and the undo ring's road.  This module does NOT invent a second one.  It is a CODEC on
 * exactly that object: encodeState(LW.serialize()) → a short base64url string, decodeState(s) →
 * an object of the same shape, which LW.restore() takes verbatim.  Anything rack.js adds to the
 * project format and this file does not know is carried through untouched by NOT being encoded,
 * and encodeState reports it in `notCarried` so the interface can say so out loud.
 *
 * THE FRAGMENT, NEVER THE QUERY.  A link carries somebody's work.  Fragments are never sent to a
 * server — not in the request line, not in a referrer — so the state lives after '#', keyed as
 * `#s=…`, and other fragment keys may sit beside it.  base64url, no padding: a link survives being
 * pasted into a chat app, a shell, or a Markdown [](…) without escaping.
 *
 * THE BYTES.
 *   [0]      VERSION      one byte.  This build mints and reads 1.
 *   [1..5)   CRC32        little-endian, computed over the version byte and the section stream —
 *                         everything except these four bytes.  THE HEADER LAYOUT IS FROZEN FOR ALL
 *                         VERSIONS, so a decoder can always tell "corrupt" from "newer than me".
 *   [5..]    SECTIONS     [tag u8][length varint][payload], in any order, each tag at most once.
 *
 * THE VERSION POLICY — what "a link minted today still opens in a year" actually means.
 *   • ADDING a section, or adding fields to the END of one, does not bump the version: an older
 *     decoder skips a tag it does not know (and says so in `warnings`), and a section that is
 *     longer than it expects is read up to what it knows and the rest ignored.  So links stay
 *     mutually readable across builds in both directions.
 *   • CHANGING the meaning or the order of anything already written bumps the version.  A decoder
 *     that meets a version it does not know REFUSES — LinkError('version') — and never guesses.
 *   • THE NAME TABLES BELOW ARE FROZEN AT v1 AND ARE NEVER APPENDED TO.  A name outside a table
 *     travels as a literal string (one marker byte + length + UTF-8), which costs a few bytes and
 *     cannot go stale.  That is why a palette or a preset added next year still rides in a v1 link.
 *
 * THE PRECISION — stated, and proved in tests/statelink.test.mjs.
 *   The 91 complex coefficients are quantised to SIGNED 16-BIT against ONE shared float32 scale s,
 *   s ≥ max_a max(|Re c_a|, |Im c_a|):  q = round(v/s · 32767),  v' = q·s/32767.
 *   THE BOUND:  |v' − v| ≤ s/65534 = 1.5259e-5 · s  per component, and hence
 *               ‖c' − c‖₂ ≤ √182 · s/65534 = 2.06e-4 · s  for the whole vector.
 *   For a normalised state s ≤ 1, and in practice s ≈ 1/√k for k equal modes.  The basis is
 *   orthonormal, so ‖Δψ‖ = ‖Δc‖ and the error in the DENSITY is ≈ 2‖ψ‖‖Δψ‖ ≤ 4.1e-4 — about a
 *   tenth of one 8-bit display level (1/255 = 3.9e-3), for the worst dense case; the shipped
 *   presets measure two orders below that.  The error does not grow with the clock: what is
 *   quantised is the ANCHOR c(0), and c(t) is a unitary image of it (the clock time itself rides
 *   as a full float64, because a picture is reproduced at a time and that is the one place where
 *   a rounded number would move the image).
 *   THE FLOOR.  A component smaller than s/65534 quantises to zero and is dropped — that is a
 *   population below 2.3e-10 of the peak.  encodeState counts what it dropped in `dropped`.
 *
 * SPARSE OR DENSE — measured, not guessed.  A typical state has two to six of 91 labels populated.
 *   sparse costs 1 byte of index + 4 bytes of value per populated label; dense costs 4 bytes per
 *   label and no indices, so dense wins from 73 populated labels up.  The encoder BUILDS BOTH and
 *   keeps the shorter (ties to sparse), for the register and again for the 91 rates.  Sections that
 *   would say nothing — an empty mute/solo mask, 91 rates that are all 1 — are not written at all.
 */

import { BASIS, BASIS_INDEX } from './hydrogen.js';
import { PRESET_BY_ID as PALETTE_BY_ID } from './mir/palette.js';

export const LINK_VERSION = 1;
/** the practical ceiling a URL should stay under to survive browsers, chat apps and mail clients */
export const LINK_CHAR_CEILING = 2000;
/** the fragment key: `#s=…` (other keys may sit beside it) */
export const LINK_KEY = 's';

const N = 91;
const Q = 32767;                       // the signed-16-bit half-range
const MASK_BYTES = 12;                 // 91 bits

/** every failure of this codec is one of these, and it always says which kind */
export class LinkError extends Error {
  constructor(code, message, detail) { super(message); this.name = 'LinkError'; this.code = code; if (detail !== undefined) this.detail = detail; }
}

/* ── the frozen name tables (see THE VERSION POLICY: never reordered, never appended) ───────── */
const T_HAM     = ['hydrogen', 'qho', 'well', 'cornell', 'atom'];
const T_PRESET  = ['1s', '2pz', '1s+2s', '1s+2pz', '2p+', '2s+2pz', '2px', 'recon', '3dz2', 'rydberg', 'shadow-pair'];
const T_PALETTE = ['wheel', 'twilight', 'ember', 'sea', 'lambda', 'bipolar', 'beacon', 'opal', 'gaslamp', 'pinwheel',
  'quadrant', 'aurora', 'terra', 'emulsion', 'hotiron', 'phosphor', 'rosewindow', 'signalflag', 'prism', 'carousel',
  'patina', 'testcard', 'ukiyo'];
const T_SHADOW  = ['phasors', 'oscillators', 'lissajous'];
const T_OVERLAY = ['off', 'phi', 'E', 'j'];
const T_SOURCE  = ['total', 'rho'];
/* ⚠ WAVE 106 · AXIS COLOUR — and it is NOT a name table.  It is a 2-BIT FIELD inside the material's
   existing flags byte, written as `ink << 5` and read as `AXIS_INK[(flags >> 5) & 3]`, so it costs the
   format NOT ONE BYTE and does not bump the version.  IT IS FROZEN for the same reason the name tables
   are, and index 0 is 'theme' ON PURPOSE, which is what makes it safe in BOTH directions: every link
   ever minted before this wave carries those two bits as zero and therefore decodes to exactly the
   behaviour it was minted with, and a decoder OLDER than this wave ignores them and lands on the same
   place.  Index 3 is unused and reads as 'theme'. */
const AXIS_INK = ['theme', 'cmy', 'rgb'];

const TAG = { REG: 0x01, MASK: 0x02, EXP: 0x03, CAM: 0x04, MAT: 0x05, STAGE: 0x06, PAL: 0x07, RATES: 0x08, NATIVE: 0x09 };
const TAG_NAME = { 1: 'register', 2: 'mask', 3: 'experiment', 4: 'camera', 5: 'material', 6: 'stage', 7: 'palette', 8: 'rates', 9: 'native material' };

/* ── base64url, no padding (portable: no Buffer, no btoa) ──────────────────────────────────── */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const B64I = (() => { const t = new Int16Array(128).fill(-1); for (let i = 0; i < 64; i++) t[B64.charCodeAt(i)] = i; return t; })();

export function toBase64url(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = i + 1 < bytes.length ? bytes[i + 1] : -1, c = i + 2 < bytes.length ? bytes[i + 2] : -1;
    out += B64[a >> 2];
    if (b < 0) { out += B64[(a & 3) << 4]; break; }
    out += B64[((a & 3) << 4) | (b >> 4)];
    if (c < 0) { out += B64[(b & 15) << 2]; break; }
    out += B64[((b & 15) << 2) | (c >> 6)] + B64[c & 63];
  }
  return out;
}
export function fromBase64url(text) {
  const s = String(text).replace(/=+$/, '');
  if (s.length % 4 === 1) throw new LinkError('malformed', 'this is not a λWAVES link: its length is not a whole number of base64url groups');
  const out = new Uint8Array((s.length * 3) >> 2);
  let n = 0, acc = 0, bits = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i), v = code < 128 ? B64I[code] : -1;
    if (v < 0) throw new LinkError('malformed', 'this is not a λWAVES link: it contains "' + s[i] + '", which is not a base64url character', { at: i });
    acc = (acc << 6) | v; bits += 6;
    if (bits >= 8) { bits -= 8; out[n++] = (acc >> bits) & 0xff; }
  }
  return out.subarray(0, n);
}

/* ── CRC-32 (IEEE 802.3, the zip/png polynomial) ───────────────────────────────────────────── */
const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[i] = c >>> 0; }
  return t;
})();
function crc32(...chunks) {
  let c = 0xFFFFFFFF;
  for (const ch of chunks) for (let i = 0; i < ch.length; i++) c = CRC_T[(c ^ ch[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/* ── the byte writer / reader ──────────────────────────────────────────────────────────────── */
const SCR = new DataView(new ArrayBuffer(8));
const SCR8 = new Uint8Array(SCR.buffer);

class Writer {
  constructor() { this.b = new Uint8Array(256); this.n = 0; }
  _room(k) { if (this.n + k <= this.b.length) return; let L = this.b.length; while (L < this.n + k) L *= 2; const nb = new Uint8Array(L); nb.set(this.b.subarray(0, this.n)); this.b = nb; }
  raw(a) { this._room(a.length); this.b.set(a, this.n); this.n += a.length; return this; }
  u8(v) { this._room(1); this.b[this.n++] = v & 0xff; return this; }
  u16(v) { this._room(2); this.b[this.n++] = v & 0xff; this.b[this.n++] = (v >>> 8) & 0xff; return this; }
  i16(v) { return this.u16(v < 0 ? v + 0x10000 : v); }
  u32(v) { return this.u16(v & 0xffff).u16((v >>> 16) & 0xffff); }
  varint(v) { v = v >>> 0; while (v >= 0x80) { this.u8((v & 0x7f) | 0x80); v >>>= 7; } return this.u8(v); }
  f32(v) { SCR.setFloat32(0, Math.fround(Number.isFinite(+v) ? +v : 0), true); this._room(4); this.b.set(SCR8.subarray(0, 4), this.n); this.n += 4; return this; }
  f64(v) { SCR.setFloat64(0, Number.isFinite(+v) ? +v : 0, true); this._room(8); this.b.set(SCR8.subarray(0, 8), this.n); this.n += 8; return this; }
  /** a frozen-table name: 1 byte if the table knows it, a literal otherwise, 0 for absent */
  name(table, s) {
    if (s === null || s === undefined || s === '') return this.u8(0);
    const i = table.indexOf(String(s));
    if (i >= 0) return this.u8(i + 1);
    const bytes = utf8(String(s));
    return this.u8(0xFF).varint(bytes.length).raw(bytes);
  }
  bytes() { return this.b.subarray(0, this.n); }
}

class Reader {
  constructor(b, where) { this.b = b; this.i = 0; this.where = where || 'the link'; }
  get left() { return this.b.length - this.i; }
  _need(k) { if (this.i + k > this.b.length) throw new LinkError('truncated', 'this link is cut short: ' + this.where + ' wanted ' + k + ' more byte(s) and only ' + this.left + ' remain'); }
  u8() { this._need(1); return this.b[this.i++]; }
  u16() { this._need(2); const v = this.b[this.i] | (this.b[this.i + 1] << 8); this.i += 2; return v; }
  i16() { const v = this.u16(); return v >= 0x8000 ? v - 0x10000 : v; }
  u32() { const a = this.u16(), b = this.u16(); return (a | (b << 16)) >>> 0; }
  varint() { let v = 0, sh = 0; for (;;) { const b = this.u8(); v |= (b & 0x7f) << sh; if (!(b & 0x80)) break; sh += 7; if (sh > 28) throw new LinkError('corrupt', 'this link holds a length field that cannot be read'); } return v >>> 0; }
  f32() { this._need(4); SCR8.set(this.b.subarray(this.i, this.i + 4)); this.i += 4; return SCR.getFloat32(0, true); }
  f64() { this._need(8); SCR8.set(this.b.subarray(this.i, this.i + 8)); this.i += 8; return SCR.getFloat64(0, true); }
  raw(k) { this._need(k); const a = this.b.subarray(this.i, this.i + k); this.i += k; return a; }
  name(table, label) {
    const b = this.u8();
    if (b === 0) return null;
    if (b === 0xFF) { const k = this.varint(); if (k > 4096) throw new LinkError('corrupt', 'this link holds an impossible name length for ' + label); return fromUtf8(this.raw(k)); }
    if (b - 1 >= table.length) throw new LinkError('corrupt', 'this link names a ' + label + ' by an index (' + (b - 1) + ') this build has no entry for — the link is damaged or was minted against a different name table');
    return table[b - 1];
  }
}

const utf8 = (s) => (typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s) : Uint8Array.from(unescape(encodeURIComponent(s)), (c) => c.charCodeAt(0)));
const fromUtf8 = (a) => (typeof TextDecoder !== 'undefined' ? new TextDecoder().decode(a) : decodeURIComponent(escape(String.fromCharCode(...a))));

/* ── small coercions: a partial state object must still encode to something valid ───────────── */
const num = (v, d) => (Number.isFinite(+v) ? +v : d);
const bool = (v, d) => (v === undefined || v === null ? !!d : !!v);
const int = (v, d, lo, hi) => Math.max(lo, Math.min(hi, Math.round(num(v, d))));

/* ── the coefficient vector ────────────────────────────────────────────────────────────────── */
/** the shared scale: the sup of |Re| and |Im| over the whole vector, rounded UP into a float32 so
 *  no component can ever quantise past ±32767 */
function coeffScale(re, im) {
  let s = 0;
  for (let a = 0; a < N; a++) { const r = Math.abs(re[a]), i = Math.abs(im[a]); if (r > s) s = r; if (i > s) s = i; }
  if (!(s > 0)) return 0;
  let f = Math.fround(s);
  if (f < s) f = Math.fround(f * (1 + 1.2e-7));
  return f;
}
const quant = (v, s) => Math.max(-Q, Math.min(Q, Math.round((v / s) * Q)));

/* ── encode ────────────────────────────────────────────────────────────────────────────────── */

/**
 * Encode a project object — exactly what rack.js's serialize() returns — into a link fragment value.
 *
 * @param {{experiment?:object, presentation?:object}} state
 * @param {{paletteId?:string}} [opts]  paletteId: the named palette (rack keeps it in the browser's
 *        settings, not in the project, so a link has to be told); state.presentation.paletteId wins
 *        if it is already there.
 * @returns {{text:string, bytes:number, chars:number, mode:'sparse'|'dense', rates:'sparse'|'dense'|'omitted',
 *           populated:number, dropped:number, scale:number, fits:boolean, notCarried:string[]}}
 */
export function encodeState(state, opts = {}) {
  const st = state || {};
  const ex = st.experiment || {}, pr = st.presentation || {};

  /* the register, out of the project's `modes` list and back into two dense arrays */
  const re = new Float64Array(N), im = new Float64Array(N);
  const muted = new Uint8Array(N), solo = new Uint8Array(N);
  for (const m of (ex.modes || [])) {
    const a = BASIS_INDEX.get(m.id || `h:${m.n}:${m.l}:${m.m}`);
    if (a === undefined) continue;
    re[a] = num(m.re, 0); im[a] = num(m.im, 0);
    muted[a] = m.muted ? 1 : 0; solo[a] = m.solo ? 1 : 0;
  }

  const s = coeffScale(re, im);
  const qr = new Int16Array(N), qi = new Int16Array(N);
  let populated = 0, dropped = 0;
  for (let a = 0; a < N; a++) {
    if (s > 0) { qr[a] = quant(re[a], s); qi[a] = quant(im[a], s); }
    const live = qr[a] !== 0 || qi[a] !== 0;
    if (live) populated++;
    else if (re[a] !== 0 || im[a] !== 0) dropped++;      // below the quantisation floor: say so, never hide it
  }

  /* BOTH shapes, then the shorter — the decision is measured, not asserted */
  const sparse = new Writer(); sparse.u8(0x00).f32(s).varint(populated);
  for (let a = 0; a < N; a++) if (qr[a] !== 0 || qi[a] !== 0) sparse.u8(a).i16(qr[a]).i16(qi[a]);
  const dense = new Writer(); dense.u8(0x01).f32(s);
  for (let a = 0; a < N; a++) dense.i16(qr[a]).i16(qi[a]);
  const regBody = sparse.n <= dense.n ? sparse : dense;
  const mode = sparse.n <= dense.n ? 'sparse' : 'dense';

  const w = new Writer();
  w.u8(LINK_VERSION);
  const body = new Writer();

  const section = (tag, fill) => { const sub = new Writer(); fill(sub); body.u8(tag).varint(sub.n).raw(sub.bytes()); };

  body.u8(TAG.REG).varint(regBody.n).raw(regBody.bytes());

  let anyMask = false;
  for (let a = 0; a < N; a++) if (muted[a] || solo[a]) { anyMask = true; break; }
  if (anyMask) section(TAG.MASK, (x) => {
    const mb = new Uint8Array(MASK_BYTES), sb = new Uint8Array(MASK_BYTES);
    for (let a = 0; a < N; a++) { if (muted[a]) mb[a >> 3] |= 1 << (a & 7); if (solo[a]) sb[a >> 3] |= 1 << (a & 7); }
    x.raw(mb).raw(sb);
  });

  const H = pr.hamiltonian || {}, SU = pr.sturmian || {};
  /* THE EXPERIMENT is the register's own half of the file plus the three operator choices that decide
     what the coefficients MEAN.  Those three are the presentation's, and a partial state (an UNDO
     record, a hand-built link) may carry any subset, so a flags byte says which are here: absent is
     not the same as default — restore() leaves an absent Hamiltonian alone and switches a present one. */
  const expFlags = (pr.hamiltonian ? 1 : 0) | (pr.sturmian ? 2 : 0) | (pr.space ? 4 : 0);
  section(TAG.EXP, (x) => {
    x.u8(expFlags);
    x.f64(num(ex.t, 0)).f32(num(ex.rate, 4)).f32(num(ex.window, 0));
    x.f32(num(ex.field && ex.field.Bz, 0)).f32(num(ex.field && ex.field.Fz, 0));
    x.f32(num(ex.damping, 0));                              // ALWAYS written: wave 56 put it in rack.js's serialize() too, and restore() reads neither — the link-open road applies it
    x.name(T_PRESET, ex.preset);
    if (expFlags & 1) {
      x.name(T_HAM, H.id);
      x.f32(num(H.Z, 0));                                   // 0 means "not carried": restore() reads it that way
      x.u8(int(H.atomZ, 0, 0, 255));
      x.f32(num(H.well, 0));
      x.u8(H.gasBasis === 'axial' ? 1 : 0);
    }
    if (expFlags & 2) x.u8(SU.on ? 1 : 0).f32(num(SU.lambda, 1));
    if (expFlags & 4) x.u8(pr.space === 'p' ? 1 : 0);
  });

  const obs = pr.obs || {}, quat = Array.isArray(obs.quat) && obs.quat.length === 4 ? obs.quat : [0, 0, 0, 0];
  if (pr.obs) section(TAG.CAM, (x) => {
    x.u8(obs.mode === 'free' ? 1 : 0);
    x.f32(num(obs.yaw, 0.65)).f32(num(obs.pitch, 0.38)).f32(num(obs.dist, 3.3)).f32(num(obs.fov, 0.6));
    for (let k = 0; k < 4; k++) x.f32(num(quat[k], 0));
  });

  const mat = pr.mat || {}, slice = mat.slice || {}, boost = mat.boost || {};
  if (pr.mat) section(TAG.MAT, (x) => {
    x.u8(int(mat.view, 1, 0, 255)).u8(int(mat.style, 0, 0, 255));
    x.f32(num(mat.exposure, 1)).f32(num(mat.softness, 0.7)).f32(num(mat.hueShift, 0));
    x.f32(num(mat.iso, 0.06)).f32(num(mat.grain, 0.35)).f32(num(mat.knee, 0.6)).f32(num(mat.dither, 0));
    x.u16(int(mat.steps, 160, 0, 65535));
    const ink = Math.max(0, AXIS_INK.indexOf(mat.axisInk));        // ⚠ bits 32 · 64: an unknown name is 'theme', never a refusal — a link is somebody's work and is not thrown away over a seat
    x.u8((bool(mat.invert, false) ? 1 : 0) | (bool(mat.frame, true) ? 2 : 0) | (bool(mat.axis, true) ? 4 : 0)
       | (bool(mat.paletteOn, false) ? 8 : 0) | (bool(boost.on, false) ? 16 : 0) | (ink << 5));
    const k = Array.isArray(boost.k) ? boost.k : [0, 0, 0];
    for (let j = 0; j < 3; j++) x.f32(num(k[j], 0));
    x.u8(int(slice.mode, 0, 0, 255)).u8(int(slice.axis, 2, 0, 255)).f32(num(slice.pos, 0)).f32(num(slice.thick, 0.03));
  });

  // Optional extension: old links keep their exact bytes; older readers report a skipped section.
  if ((mat.finish && mat.finish !== 'lit') || slice.normal || (mat.bow && (mat.bow.gain !== 1 || mat.bow.curve !== 1 || mat.bow.limit !== 3))) section(TAG.NATIVE, x => {
    x.u8(mat.finish === 'glass' ? 1 : mat.finish === 'matte' ? 2 : 0);
    x.u8(slice.normal ? 1 : 0);
    if (slice.normal) for (const v of slice.normal) x.f32(num(v, 0));
    x.f32(num(mat.bow?.gain, 1)).f32(num(mat.bow?.curve, 1)).f32(num(mat.bow?.limit, 3));
  });

  const dom = pr.domain || {}, qua = pr.quality || {}, fl = pr.field || {}, wg = pr.wigner || {};
  /* THE STAGE carries five independent groups and a state may hold any subset of them (an UNDO record
     holds none of them), so a flags byte says which are here and nothing is invented for the rest. */
  const stageFlags = (pr.domain ? 1 : 0) | (pr.quality ? 2 : 0) | (pr.shadow ? 4 : 0) | (pr.field ? 8 : 0) | (pr.wigner ? 16 : 0);
  if (stageFlags) section(TAG.STAGE, (x) => {
    x.u8(stageFlags);
    if (stageFlags & 1) x.u8(bool(dom.auto, true) ? 1 : 0).f32(num(dom.half, 7));
    if (stageFlags & 2) x.u16(int(qua.res, 96, 0, 65535)).u16(int(qua.steps, 160, 0, 65535)).f32(num(qua.scale, 1))
      .u8(bool(qua.auto, true) ? 1 : 0).f32(num(qua.autoScale, 1)).f32(num(qua.minScale, 0.35));
    if (stageFlags & 4) x.name(T_SHADOW, pr.shadow);
    if (stageFlags & 8) x.name(T_OVERLAY, fl.overlay).u16(int(fl.lines, 10, 0, 65535)).name(T_SOURCE, fl.source);
    if (stageFlags & 16) x.f32(num(wg.zmax, 0)).f32(num(wg.pmax, 0));
  });

  const paletteId = opts.paletteId !== undefined ? opts.paletteId : pr.paletteId;
  const pal = pr.palette;
  if (pal || paletteId) section(TAG.PAL, (x) => {
    x.name(T_PALETTE, paletteId);
    const stops = pal && Array.isArray(pal.stops) ? pal.stops : null;
    const custom = stops ? !sameAsNamed(stops, paletteId) : false;
    x.u8((pal ? 1 : 0) | (pal && pal.on ? 2 : 0) | (custom ? 4 : 0));
    if (custom) {
      x.u8(Math.min(255, stops.length));
      for (const st2 of stops.slice(0, 255)) {
        x.u16(Math.round(((num(st2.at, 0) % 1 + 1) % 1) * 65535));
        const rgb = Array.isArray(st2.rgb) ? st2.rgb : [0, 0, 0];
        for (let j = 0; j < 3; j++) x.u16(Math.round(Math.max(0, Math.min(1, num(rgb[j], 0))) * 65535));
      }
    }
  });

  let ratesMode = 'omitted';
  const rates = Array.isArray(pr.rates) && pr.rates.length === N ? pr.rates : (ArrayBuffer.isView(pr.rates) && pr.rates.length === N ? Array.from(pr.rates) : null);
  /* THE 91 RATES are written whenever the state carries them, EVEN WHEN ALL 91 ARE 1 — because
     "everything at 1" is a state somebody chose, and a visitor whose own knobs are off 1 must land on
     the link's rates and not keep their own.  All-ones costs four bytes: a sparse list of length nil. */
  if (rates) {
    const off = [];
    for (let a = 0; a < N; a++) if (Math.fround(num(rates[a], 1)) !== 1) off.push(a);
    const sp = new Writer(); sp.u8(0x00).varint(off.length);
    for (const a of off) sp.u8(a).f32(rates[a]);
    const dn = new Writer(); dn.u8(0x01);
    for (let a = 0; a < N; a++) dn.f32(num(rates[a], 1));
    const pick = sp.n <= dn.n ? sp : dn;
    ratesMode = sp.n <= dn.n ? 'sparse' : 'dense';
    body.u8(TAG.RATES).varint(pick.n).raw(pick.bytes());
  }

  const bodyBytes = body.bytes();
  const crc = crc32(new Uint8Array([LINK_VERSION]), bodyBytes);
  w.u32(crc).raw(bodyBytes);
  const bytes = w.bytes();
  const text = toBase64url(bytes);

  const notCarried = [];
  for (const k of ['frameMode','axisMode','cornerSide']) if (mat[k]) notCarried.push('mat.'+k);
  for (const k of ['mo', 'modulation']) if (pr[k] !== undefined && pr[k] !== null) notCarried.push(k);

  if (pr.rotationRates && Object.values(pr.rotationRates).some((v) => v !== 0)) notCarried.push('rotationRates');
  return { text, bytes: bytes.length, chars: text.length, mode, rates: ratesMode,
    populated, dropped, scale: s, fits: text.length <= LINK_CHAR_CEILING, notCarried };
}

/** do these stops still equal the named palette's own, so the id alone says everything? */
function sameAsNamed(stops, id) {
  const p = id ? PALETTE_BY_ID.get(id) : null;
  if (!p || p.stops.length !== stops.length) return false;
  for (let i = 0; i < stops.length; i++) {
    const a = stops[i], b = p.stops[i];
    if (Math.abs(num(a.at, 0) - b.at) > 1e-9) return false;
    const ra = Array.isArray(a.rgb) ? a.rgb : [];
    for (let j = 0; j < 3; j++) if (Math.abs(num(ra[j], 0) - b.rgb[j]) > 1e-9) return false;
  }
  return true;
}

/* ── decode ────────────────────────────────────────────────────────────────────────────────── */

/**
 * Read a link fragment value back into { experiment, presentation } — the exact shape LW.restore()
 * takes.  THROWS LinkError on anything it cannot read; it never returns a half-built state.
 *
 * @returns {{version:number, state:{experiment:object, presentation:object}, paletteId:string|null,
 *            unknownSections:number[], warnings:string[]}}
 */
export function decodeState(text) {
  if (typeof text !== 'string' || text.length === 0) throw new LinkError('empty', 'there is no λWAVES state in this link');
  const bytes = fromBase64url(text);
  if (bytes.length < 5) throw new LinkError('truncated', 'this link is cut short: it is ' + bytes.length + ' byte(s) long and the header alone is 5');

  const version = bytes[0];
  const stored = (bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24)) >>> 0;
  const bodyBytes = bytes.subarray(5);
  const actual = crc32(bytes.subarray(0, 1), bodyBytes);
  if (actual !== stored) {
    throw new LinkError('corrupt', 'this link did not survive the journey: its checksum is ' + hex8(stored) + ' but its bytes hash to ' + hex8(actual)
      + ' — it was truncated, wrapped by a mail client, or edited by hand', { stored, actual });
  }
  if (version !== LINK_VERSION) {
    throw new LinkError('version', 'this link is in λWAVES link format v' + version + '; this build reads v' + LINK_VERSION
      + (version > LINK_VERSION ? ' — it was minted by a newer build of the lab' : ' — it was minted by a build older than any this codec knows'), { version, reads: LINK_VERSION });
  }

  /* the section stream: every tag at most once, unknown tags stepped over */
  const r = new Reader(bodyBytes, 'the section stream');
  const sec = new Map(); const unknownSections = []; const warnings = [];
  while (r.left > 0) {
    const tag = r.u8(), len = r.varint();
    if (len > r.left) throw new LinkError('truncated', 'this link is cut short: its ' + (TAG_NAME[tag] || ('section 0x' + tag.toString(16))) + ' section says it is ' + len + ' bytes and only ' + r.left + ' remain');
    const payload = r.raw(len);
    if (sec.has(tag)) throw new LinkError('corrupt', 'this link carries two ' + (TAG_NAME[tag] || ('0x' + tag.toString(16))) + ' sections');
    sec.set(tag, payload);
    if (!TAG_NAME[tag]) { unknownSections.push(tag); warnings.push('a section this build does not know (0x' + tag.toString(16) + ') was skipped — the link was minted by a newer build'); }
  }
  if (!sec.has(TAG.REG)) throw new LinkError('corrupt', 'this link carries no register: there is no state in it');

  /* REGISTER */
  const re = new Float64Array(N), im = new Float64Array(N);
  {
    const x = new Reader(sec.get(TAG.REG), 'the register');
    const sub = x.u8(), scale = x.f32();
    if (!Number.isFinite(scale) || scale < 0) throw new LinkError('corrupt', 'the register in this link carries an impossible scale (' + scale + ')');
    const put = (a, qr, qi) => { re[a] = (qr * scale) / Q; im[a] = (qi * scale) / Q; };
    if ((sub & 0x0f) === 0) {
      const k = x.varint();
      if (k > N) throw new LinkError('corrupt', 'the register in this link claims ' + k + ' populated labels; there are only ' + N);
      for (let j = 0; j < k; j++) { const a = x.u8(); if (a >= N) throw new LinkError('corrupt', 'the register in this link names label ' + a + ', which is outside the 91'); put(a, x.i16(), x.i16()); }
    } else if ((sub & 0x0f) === 1) {
      for (let a = 0; a < N; a++) put(a, x.i16(), x.i16());
    } else {
      throw new LinkError('corrupt', 'the register in this link is written in a shape this build does not know (0x' + sub.toString(16) + ')');
    }
  }

  /* MASK */
  const muted = new Uint8Array(N), solo = new Uint8Array(N);
  if (sec.has(TAG.MASK)) {
    const x = new Reader(sec.get(TAG.MASK), 'the mute/solo mask');
    const mb = x.raw(MASK_BYTES), sb = x.raw(MASK_BYTES);
    for (let a = 0; a < N; a++) { muted[a] = (mb[a >> 3] >> (a & 7)) & 1; solo[a] = (sb[a >> 3] >> (a & 7)) & 1; }
  }

  const modes = [];
  for (let a = 0; a < N; a++) {
    if (!(re[a] || im[a] || muted[a] || solo[a])) continue;
    const s = BASIS[a];
    modes.push({ id: s.id, n: s.n, l: s.l, m: s.m, re: re[a], im: im[a], muted: !!muted[a], solo: !!solo[a] });
  }

  const experiment = { format: 'lambdawaves/qwave-0/state', system: 'hydrogen', basis: 'n<=6 complex Y_lm, Condon-Shortley',
    units: 'atomic', t: 0, preset: null, modes, field: { Bz: 0, Fz: 0 }, rate: 4, window: 0 };
  const presentation = {};

  /* EXPERIMENT */
  if (sec.has(TAG.EXP)) {
    const x = new Reader(sec.get(TAG.EXP), 'the experiment');
    const f = x.u8();
    experiment.t = x.f64(); experiment.rate = x.f32(); experiment.window = x.f32();
    experiment.field = { Bz: x.f32(), Fz: x.f32() };
    /* WAVE 56: ZERO IS A VALUE, NOT AN ABSENCE.  This section ALWAYS writes a damping float, so dropping a
       zero on the way back made "no drag" unrepresentable — a link minted with DRAG γ off could not turn a
       reader's drag off, and the only way to tell the two apart from the outside would have been to assume. */
    experiment.damping = x.f32();
    experiment.preset = x.name(T_PRESET, 'preset');
    if (f & 1) {
      const id = x.name(T_HAM, 'Hamiltonian'), Z = x.f32(), atomZ = x.u8(), well = x.f32(), gas = x.u8();
      presentation.hamiltonian = { id: id || 'hydrogen', Z, atomZ, well, gasBasis: gas ? 'axial' : 'reg' };
    }
    if (f & 2) presentation.sturmian = { on: !!x.u8(), lambda: x.f32() };
    if (f & 4) presentation.space = x.u8() ? 'p' : 'r';
  }

  /* CAMERA */
  if (sec.has(TAG.CAM)) {
    const x = new Reader(sec.get(TAG.CAM), 'the camera');
    const mode = x.u8() ? 'free' : 'turntable';
    const obs = { mode, yaw: x.f32(), pitch: x.f32(), dist: x.f32(), fov: x.f32() };
    const q = [x.f32(), x.f32(), x.f32(), x.f32()];
    if (q.some((v) => v !== 0)) obs.quat = q;              // an all-zero quaternion means "the file had none": restore() rebuilds it from yaw/pitch
    presentation.obs = obs;
  }

  /* MATERIAL */
  if (sec.has(TAG.MAT)) {
    const x = new Reader(sec.get(TAG.MAT), 'the material');
    const view = x.u8(), style = x.u8();
    const exposure = x.f32(), softness = x.f32(), hueShift = x.f32();
    const iso = x.f32(), grain = x.f32(), knee = x.f32(), dither = x.f32();
    const steps = x.u16(), flags = x.u8();
    const k = [x.f32(), x.f32(), x.f32()];
    presentation.mat = { view, style, exposure, softness, hueShift, iso, grain, knee, dither, steps,
      invert: !!(flags & 1), frame: !!(flags & 2), axis: !!(flags & 4), paletteOn: !!(flags & 8),
      axisInk: AXIS_INK[(flags >> 5) & 3] || 'theme',              // ⚠ bits 32 · 64 — zero in every link minted before this wave, and zero IS 'theme'
      boost: { k, on: !!(flags & 16) },
      slice: { mode: x.u8(), axis: x.u8(), pos: x.f32(), thick: x.f32() } };
  }

  if (sec.has(TAG.NATIVE) && presentation.mat) {
    const x = new Reader(sec.get(TAG.NATIVE), 'native material');
    const finish=x.u8();
    if(finish>2)throw new LinkError('corrupt','unknown material finish');
    presentation.mat.finish=['lit','glass','matte'][finish];
    if(x.u8()) { const n=[x.f32(),x.f32(),x.f32()],length=Math.hypot(...n); if(length<.5 || length>1.5)throw new LinkError('corrupt','invalid slice normal'); presentation.mat.slice.normal=n; }
    const gain=x.f32(),curve=x.f32(),limit=x.f32();
    if(gain<.25||gain>4||curve<.25||curve>3||limit<.1-1e-7||limit>3)throw new LinkError('corrupt','invalid bow controls');
    presentation.mat.bow={gain,curve,limit};
  }

  /* STAGE */
  if (sec.has(TAG.STAGE)) {
    const x = new Reader(sec.get(TAG.STAGE), 'the stage');
    const f = x.u8();
    if (f & 1) presentation.domain = { auto: !!x.u8(), half: x.f32() };
    if (f & 2) presentation.quality = { res: x.u16(), steps: x.u16(), scale: x.f32(), auto: !!x.u8(), autoScale: x.f32(), minScale: x.f32() };
    if (f & 4) { const shadow = x.name(T_SHADOW, 'shadow mode'); if (shadow) presentation.shadow = shadow; }
    if (f & 8) presentation.field = { overlay: x.name(T_OVERLAY, 'field overlay'), lines: x.u16(), source: x.name(T_SOURCE, 'field source') };
    if (f & 16) presentation.wigner = { zmax: x.f32(), pmax: x.f32() };
  }

  /* PALETTE */
  let paletteId = null;
  if (sec.has(TAG.PAL)) {
    const x = new Reader(sec.get(TAG.PAL), 'the palette');
    paletteId = x.name(T_PALETTE, 'palette');
    const flags = x.u8();
    if (flags & 1) {
      const p = { on: !!(flags & 2) };
      if (flags & 4) {
        const k = x.u8(), stops = [];
        for (let j = 0; j < k; j++) { const at = x.u16() / 65535; stops.push({ at, rgb: [x.u16() / 65535, x.u16() / 65535, x.u16() / 65535] }); }
        p.stops = stops;
      } else if (paletteId && PALETTE_BY_ID.get(paletteId)) {
        p.stops = PALETTE_BY_ID.get(paletteId).stops.map((s) => ({ at: s.at, rgb: s.rgb.slice() }));
      } else if (paletteId) {
        warnings.push('this link names a palette this build does not have ("' + paletteId + '") — its own stops are kept');
      }
      presentation.palette = p;
    }
    if (paletteId) presentation.paletteId = paletteId;
  }

  /* RATES */
  if (sec.has(TAG.RATES)) {
    const x = new Reader(sec.get(TAG.RATES), 'the rates');
    const sub = x.u8(), rates = new Array(N).fill(1);
    if (sub === 0) {
      const k = x.varint();
      if (k > N) throw new LinkError('corrupt', 'the rates in this link claim ' + k + ' entries; there are only ' + N);
      for (let j = 0; j < k; j++) { const a = x.u8(); if (a >= N) throw new LinkError('corrupt', 'the rates in this link name label ' + a + ', which is outside the 91'); rates[a] = x.f32(); }
    } else if (sub === 1) {
      for (let a = 0; a < N; a++) rates[a] = x.f32();
    } else {
      throw new LinkError('corrupt', 'the rates in this link are written in a shape this build does not know (0x' + sub.toString(16) + ')');
    }
    presentation.rates = rates;
  }

  return { version, state: { experiment, presentation }, paletteId, unknownSections, warnings };
}

const hex8 = (v) => '0x' + (v >>> 0).toString(16).padStart(8, '0');

/* ── the link itself ───────────────────────────────────────────────────────────────────────── */

/** the fragment a state should be pasted after a '#': "s=…" */
export function fragmentFor(state, opts) { return LINK_KEY + '=' + encodeState(state, opts).text; }

/**
 * A whole href.  `base` defaults to the page this is running in with its own fragment stripped —
 * the query is kept, because ?warn=0 and friends belong to the visit, not to the state.
 */
export function linkFor(state, opts = {}) {
  const enc = encodeState(state, opts);
  let base = opts.base;
  if (base === undefined) base = (typeof location !== 'undefined' && location.href) ? location.href : '';
  base = String(base).split('#')[0];
  return { href: base + '#' + LINK_KEY + '=' + enc.text, ...enc };
}

/**
 * Read a link.  Returns null when the href simply carries no state (so a plain visit is not an
 * error); THROWS LinkError when it carries one that cannot be read.
 */
export function readLink(href) {
  const s = String(href === undefined ? (typeof location !== 'undefined' ? location.href : '') : href);
  const hash = s.slice(s.indexOf('#') + 1);
  if (s.indexOf('#') < 0 || !hash) return null;
  let value = null;
  for (const part of hash.split('&')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq) === LINK_KEY) value = part.slice(eq + 1);
  }
  if (value === null) return null;
  let raw = value;
  try { raw = decodeURIComponent(value); } catch (e) { throw new LinkError('malformed', 'this link\'s state could not even be un-escaped: it was mangled on the way here'); }
  return decodeState(raw);
}
