/* MIR · shell/share-link.js — THE SHARE LINK: an app's state as a URL fragment, and back.
 *
 * Harvested from the shape four apps converged on (SOLEIL lab/statelink.js, AUTOMATA lab/statelink.js, EARTH
 * lab/engine/statelink.js, POLAR lab/engine/statelink.js — three different files for one job): a readable
 * `#v=1&key=value…` fragment that carries ONLY WHAT DIFFERS FROM THE DEFAULTS, with a version, and AUTOMATA's
 * "a truncated `…&z=` is no number, not zero".  From λWAVES lab/statelink.js it takes the header law: the version and
 * a CRC32 sit FIRST and are frozen for all versions, so a reader can always tell a damaged link from a newer one.
 *
 * THE LAWS IT KEEPS
 *   · THE FRAGMENT, NEVER THE QUERY.  A link carries somebody's work; a fragment is never sent to a server.
 *   · ONLY WHAT DIFFERS.  With `defaults`, a value equal to its default is not written (numbers within 1e-9).
 *   · TYPED BY THE DEFAULTS.  A decoded value takes its default's type: a number must parse finite, a boolean is
 *     1/0, an array or object is JSON.  A key the defaults do not know is dropped.  Without defaults the values come
 *     back as numbers where they parse as numbers, JSON where they look like JSON, else strings.
 *   · DAMAGE IS NULL, NEVER A THROW.  `v` and `c` (CRC32 of everything after them) come first, so a link cut short
 *     anywhere fails its check: decodeState returns null.  `inspectLink` gives what survived, for an app that would
 *     rather open half a link than none, and says why.  A different version is null too (the app's `migrate` may lift it).
 *   · PURE.  No DOM here except the three page helpers at the end (read, debounced write, copy), which touch only
 *     `location`, `history` and the clipboard, and only when called.
 *
 * Why not core/envelope.js `pack`: the envelope is the FILE format (a skin, settings, a page, a project, a spec), its
 * text form is deflated base64 behind an async CompressionStream and carries the frame (kit, made, kind).  A share link
 * is an app's live VIEW, written on every change through replaceState, so it must be synchronous, readable and
 * diff-against-defaults.  To put a skin or a spec in a link, use `pack` and carry its text as one value here.
 *
 * encodeState(state, { defaults, version = 1, digits = 4, strict = true }) → '#v=1&c=…&key=value…'
 * decodeState(text,  { defaults, version = 1, strict = true, migrate }) → state | null
 * inspectLink(text, opts) → { state, ok, why, version, damaged, dropped: [key], length }
 * measureState(state, opts) → { text, length, ceiling, fits, keys }
 * createShareLink(opts) → { encode, decode, read(), write(state), copy(state) → Promise<url>, url(state), destroy() } */

import { copyText } from './clipboard.js';

export const LINK_CEILING = 2000;           // what a URL should stay under to survive browsers, chat apps and mail (λWAVES)
const EPS = 1e-9;

/* ── CRC32 (the PNG one), over a string's UTF-8 ───────────────────────────────────────────────────────── */
let TABLE = null;
export function crc32(str) {
  if (!TABLE) { TABLE = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; TABLE[n] = c >>> 0; } }
  const b = new TextEncoder().encode(String(str));
  let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return ((c ^ 0xffffffff) >>> 0).toString(36);
}

const isObj = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);
const same = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < EPS
  : (isObj(a) || Array.isArray(a)) ? JSON.stringify(a) === JSON.stringify(b) : a === b);

/** flatten({ a: { b: 1 } }) → [['a.b', 1]]: the nested state as dotted keys, arrays kept whole */
export function flatten(o, pre = '', out = []) {
  for (const k of Object.keys(o || {})) {
    if (k.includes('.') || k === 'v' || (!pre && k === 'c')) continue;    // a dot is the separator; v and c are the header
    const v = o[k], key = pre ? pre + '.' + k : k;
    if (isObj(v)) flatten(v, key, out); else out.push([key, v]);
  }
  return out;
}
function lookup(o, key) { let x = o; for (const p of key.split('.')) { if (!isObj(x) || !(p in x)) return undefined; x = x[p]; } return x; }
function put(o, key, v) { const ps = key.split('.'); let x = o; for (let i = 0; i < ps.length - 1; i++) { if (!isObj(x[ps[i]])) x[ps[i]] = {}; x = x[ps[i]]; } x[ps[ps.length - 1]] = v; }

function write(v, digits) {
  if (typeof v === 'number') return Number.isFinite(v) ? String(+v.toFixed(digits)) : null;
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'string') return v;
  if (Array.isArray(v) || isObj(v)) { try { return JSON.stringify(v); } catch (_) { return null; } }
  return null;                                                            // undefined, a function, a symbol: not state
}
/** read one value; `def` is its default (its type is the contract), undefined when there are no defaults */
function read(s, def, loose) {
  if (typeof def === 'number') { if (s === '' || !/^[-+]?(\d|\.\d)/.test(s)) return undefined; const n = Number(s); return Number.isFinite(n) ? n : undefined; }
  if (typeof def === 'boolean') return s === '1' ? true : s === '0' ? false : undefined;
  if (typeof def === 'string') return s;
  if (Array.isArray(def) || isObj(def)) { try { const j = JSON.parse(s); return Array.isArray(def) === Array.isArray(j) && (Array.isArray(j) || isObj(j)) ? j : undefined; } catch (_) { return undefined; } }
  if (!loose) return undefined;
  if (/^[-+]?(\d|\.\d)[\d.eE+-]*$/.test(s)) { const n = Number(s); if (Number.isFinite(n)) return n; }
  if (/^[[{]/.test(s)) { try { return JSON.parse(s); } catch (_) { return s; } }
  return s;
}

/** encodeState(state, opts) → '#v=1&c=…&…' — what differs from `defaults`, rounded to `digits` decimals */
export function encodeState(state, { defaults = null, version = 1, digits = 4, strict = true } = {}) {
  const body = new URLSearchParams();
  for (const [k, v] of flatten(state)) {
    if (defaults) { const d = lookup(defaults, k); if (d === undefined) continue; if (same(v, d)) continue; }
    const s = write(v, digits); if (s !== null) body.append(k, s);
  }
  const rest = body.toString();
  const head = 'v=' + encodeURIComponent(String(version)) + (strict ? '&c=' + crc32(rest) : '');
  return '#' + head + (rest ? '&' + rest : '');
}

/** inspectLink(text, opts) → { state, ok, why, version, damaged, dropped, length }.  Never throws. */
export function inspectLink(text, { defaults = null, version = 1, strict = true, migrate = null } = {}) {
  const raw = String(text ?? ''), at = raw.indexOf('#');
  const frag = at >= 0 ? raw.slice(at + 1) : raw;                      // a whole URL, a '#…' hash, or the bare fragment
  const out = { state: null, ok: false, why: '', version: null, damaged: false, dropped: [], length: raw.length };
  if (!frag) { out.why = 'no state in this link'; return out; }
  let p; try { p = new URLSearchParams(frag); } catch (_) { out.why = 'not a link fragment'; return out; }
  const v = p.get('v'); out.version = v;
  if (v === null) { out.why = 'no version: not a share link'; return out; }
  if (strict) {
    const m = /^v=[^&]*&c=([0-9a-z]+)(?:&(.*))?$/.exec(frag);
    if (!m || crc32(m[2] || '') !== m[1]) out.damaged = true;
  }
  const state = {};
  for (const [k, s] of p) {
    if (k === 'v' || k === 'c') continue;
    if (k.split('.').some((seg) => seg === '' || seg === '__proto__' || seg === 'constructor' || seg === 'prototype')) { out.dropped.push(k); continue; }
    const d = defaults ? lookup(defaults, k) : undefined;
    if (defaults && d === undefined) { out.dropped.push(k); continue; }
    const val = read(s, d, !defaults);
    if (val === undefined) { out.dropped.push(k); continue; }
    put(state, k, val);
  }
  let st = state;
  if (String(v) !== String(version)) {
    if (typeof migrate === 'function') { try { st = migrate(state, v); } catch (_) { st = null; } }
    else st = null;
    if (!st) { out.why = `a version ${v} link; this app reads version ${version}`; return out; }
  }
  out.state = st;
  out.ok = !out.damaged;
  out.why = out.damaged ? 'the link is damaged (cut short or edited): its check does not match' : '';
  return out;
}

/** decodeState(text, opts) → the state, or null for a damaged, foreign or newer link.  Never throws. */
export function decodeState(text, opts = {}) {
  const r = inspectLink(text, opts);
  return r.ok ? r.state : null;
}

/** measureState(state, opts) → { text, length, ceiling, fits, keys } — how long the link is, against the ceiling */
export function measureState(state, opts = {}) {
  const text = encodeState(state, opts), keys = Math.max(0, text.split('&').length - (opts.strict === false ? 1 : 2));
  const ceiling = opts.ceiling || LINK_CEILING, base = opts.base ? String(opts.base).length : 0;
  return { text, length: base + text.length, ceiling, fits: base + text.length <= ceiling, keys };
}

/* ── the page half (AUTOMATA main.js: FILE › COPY A LINK, replaceState debounced 400 ms) ─────────────────── */
/** createShareLink({ defaults, version, digits, strict, migrate, debounce = 400 }) */
export function createShareLink(opts = {}) {
  const o = { debounce: 400, ...opts };
  let timer = 0, pending = null;
  const base = () => location.origin + location.pathname + location.search;
  const api = {
    encode: (s) => encodeState(s, o),
    decode: (t) => decodeState(t, o),
    inspect: (t) => inspectLink(t, o),
    measure: (s) => measureState(s, { ...o, base: base() }),
    /** the state the page was opened with, or null */
    read: () => decodeState(location.hash, o),
    /** the address bar follows the state, at most once per `debounce` ms; history gains no entries */
    write(state) {
      pending = state;
      if (timer) return;
      timer = setTimeout(() => { timer = 0; const s = pending; pending = null; try { history.replaceState(history.state, '', base() + encodeState(s, o)); } catch (_) {} }, o.debounce);
    },
    url: (state) => base() + encodeState(state, o),
    /** copy the link to the clipboard → the url (it is also returned when the clipboard refuses) */
    async copy(state) { const u = api.url(state); await copyText(u); return u; },   // shell/clipboard.js: the textarea fallback too
    destroy() { clearTimeout(timer); timer = 0; pending = null; }
  };
  return api;
}
