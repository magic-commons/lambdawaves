/* core/envelope.js — THE ENVELOPE: one portable file format for everything a person carries between MIR apps.
 *
 *   { mir: 1, kind, kit, app?, name?, made, data }
 *     mir    the FORMAT version (an integer).  A reader refuses a newer one with a reason, and migrates an older one.
 *     kind   'settings' · 'skin' · 'project' · 'page' · 'spec'  (a spec = one person's skin, options, layouts, keys
 *            and language, in one file that travels between apps)
 *     kit    the kit version that wrote it · app  the app id, for a kind only one app can read (a project)
 *     name   a human name · made  an ISO date · data  the payload, per kind (docs/FORMAT.md has one of each)
 *
 * THE LAWS IT KEEPS
 *   · ONE CHECKER.  check(envelope, { tokens, settings?, app? }) → { ok, errors: [{ path, why }], warnings, envelope }.
 *     It never throws, on anything: a string, null, a cycle, a hostile value.  `envelope` in the result is the clean
 *     copy to use (unknown settings and members dropped); it is null when ok is false.
 *   · A SKIN IS DATA.  Every skin key is a token the schema (mir/tokens.json) marks `skin: true`, and every value is
 *     read against a WHITELIST GRAMMAR for its token type — colour, length, number, shadow list, time, easing, a font
 *     family from a fixed list, a keyword set.  Nothing outside the grammar passes, so nothing can load or run:
 *     no url(), no @import, no expression(), no markup, no `javascript:`, no var() naming a token outside the schema.
 *     This is what makes "skin values are safe to load from anywhere, including a picture" true.
 *   · A FORMAT IS A PROMISE.  The envelope carries its version from day one; MIGRATIONS is where an old one is lifted.
 *   · PURE: no DOM, no storage, no globals.  pack/unpackText use the platform's CompressionStream when it has one.
 *
 * wrap(kind, data, meta?) → envelope · unwrap(text | object) → { envelope, errors } · stringify(envelope) → text
 * pack(envelope) → Promise<string> · unpackText(string) → Promise<{ envelope, errors }>
 * check(envelope, opts) → result · skinValues(skinData, theme) → { '--token': value } · migrate(envelope) → envelope
 * checkSkinValue(row, value, known) → reason | null   (one value against its row; the checker's inner rule) */

export const FORMAT = 1;
import { MIR_VERSION as KIT } from '../version.js'; export { KIT };   // one constant: mir/version.js
export const KINDS = Object.freeze(['settings', 'skin', 'project', 'page', 'spec']);
export const LIMITS = Object.freeze({
  file: 32 << 20,          // any envelope as text
  project: 24 << 20,       // a project's data as JSON
  member: 1 << 20,         // a spec's layouts / keys / language, a settings block
  md: 2 << 20,             // a page's markdown
  title: 300,              // a page title, an envelope name
  value: 400,              // one skin value
  skinKeys: 600,           // tokens in one skin section
  depth: 64,               // nesting of any JSON payload
  packed: 1 << 20          // what unpackText will inflate to, at most
});

/* ── wrap / unwrap ─────────────────────────────────────────────────────────────────────────────────────────── */

/** wrap(kind, data, { kit, app, name, made }) → a new envelope.  Throws only on a kind it does not know (author error). */
export function wrap(kind, data, meta = {}) {
  if (!KINDS.includes(kind)) throw new TypeError(`envelope: unknown kind ${JSON.stringify(kind)} (one of ${KINDS.join(', ')})`);
  const env = { mir: FORMAT, kind, kit: String(meta.kit || KIT) };
  if (meta.app != null) env.app = String(meta.app);
  if (meta.name != null) env.name = String(meta.name);
  env.made = meta.made ? String(meta.made) : new Date().toISOString();
  env.data = data;
  return env;
}

export const stringify = (env) => JSON.stringify(env, null, 1);

/** MIGRATIONS[n](envelope) lifts format n to n + 1.  Empty: format 1 is the first. */
export const MIGRATIONS = {};
export function migrate(env) {
  let e = env;
  while (e && Number.isInteger(e.mir) && e.mir < FORMAT) {
    const step = MIGRATIONS[e.mir];
    if (!step) return null;
    e = step(e);
  }
  return e;
}

/** unwrap(text | object) → { envelope, errors }: parse, read the frame, refuse a newer format, migrate an older one.
 *  It checks only the FRAME; check() reads the data. */
export function unwrap(input) {
  let obj = input;
  if (typeof input === 'string') {
    if (input.length > LIMITS.file) return fail('', 'the file is larger than 32 MB');
    try { obj = JSON.parse(input.replace(/^﻿/, '')); } catch (e) { return fail('', 'not JSON: ' + String(e && e.message || e).slice(0, 120)); }
  } else if (input instanceof Uint8Array) {
    try { return unwrap(new TextDecoder('utf-8', { fatal: true }).decode(input)); } catch (_) { return fail('', 'not UTF-8 text'); }
  }
  const errors = frameErrors(obj);
  if (errors.length) return { envelope: null, errors };
  const env = obj.mir < FORMAT ? migrate(obj) : obj;
  if (!env) return fail('mir', `format ${obj.mir} has no migration to format ${FORMAT}`);
  return { envelope: env, errors: [] };
}
const fail = (path, why) => ({ envelope: null, errors: [{ path, why }] });
const isObj = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);

function frameErrors(o) {
  if (!isObj(o)) return [{ path: '', why: `an envelope is an object, not ${o === null ? 'null' : Array.isArray(o) ? 'an array' : typeof o}` }];
  const e = [];
  if (!Number.isInteger(o.mir) || o.mir < 1) e.push({ path: 'mir', why: 'the format version must be a whole number ≥ 1 (is this a MIR file?)' });
  else if (o.mir > FORMAT) e.push({ path: 'mir', why: `written by a newer MIR (format ${o.mir}); this app reads format ${FORMAT} — update the app to open it` });
  if (!KINDS.includes(o.kind)) e.push({ path: 'kind', why: `unknown kind ${JSON.stringify(o.kind)}: one of ${KINDS.join(', ')}` });
  if (!('data' in o)) e.push({ path: 'data', why: 'an envelope carries data' });
  return e;
}

/* ── the compact form, for small carriers (a QR later) ─────────────────────────────────────────────────────────
 * 'mir1.z.' + base64url(deflate-raw(JSON))  when the platform has CompressionStream, else  'mir1.j.' + base64url(JSON) */
const b64u = (bytes) => {
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64u = (s) => {
  const t = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  const out = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) out[i] = t.charCodeAt(i); return out;
};
async function pipe(bytes, stream, cap = Infinity) {
  const reader = new Blob([bytes]).stream().pipeThrough(stream).getReader(), parts = []; let n = 0;
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    n += value.length; if (n > cap) { try { reader.cancel(); } catch (_) {} throw new Error('inflates past ' + cap + ' bytes'); }
    parts.push(value);
  }
  const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out;
}

/** pack(envelope) → Promise<string>: compact JSON, deflated when the platform can, base64url, with a 'mir1.' prefix */
export async function pack(env) {
  const json = new TextEncoder().encode(JSON.stringify(env));
  if (typeof CompressionStream === 'function') {
    try { return 'mir1.z.' + b64u(await pipe(json, new CompressionStream('deflate-raw'))); } catch (_) {}
  }
  return 'mir1.j.' + b64u(json);
}

/** unpackText(string) → Promise<{ envelope, errors }>.  Never throws; inflates at most LIMITS.packed bytes. */
export async function unpackText(text) {
  const m = /^\s*mir1\.([zj])\.([A-Za-z0-9_-]+)\s*$/.exec(String(text ?? ''));
  if (!m) return fail('', 'not a packed MIR text (it starts "mir1.z." or "mir1.j.")');
  let bytes;
  try { bytes = unb64u(m[2]); } catch (_) { return fail('', 'the packed text is not base64url'); }
  if (m[1] === 'z') {
    if (typeof DecompressionStream !== 'function') return fail('', 'this platform cannot inflate a packed text');
    try { bytes = await pipe(bytes, new DecompressionStream('deflate-raw'), LIMITS.packed); } catch (e) { return fail('', 'the packed text does not inflate: ' + String(e && e.message || e).slice(0, 80)); }
  }
  return unwrap(bytes);
}

/* ── the checker ───────────────────────────────────────────────────────────────────────────────────────────── */

/** check(envelope, { tokens, settings?, app? }) → { ok, errors, warnings, envelope }.  Never throws.
 *   tokens    the token schema (mir/tokens.json, or its `tokens` array) — needed for a skin or a spec's skin
 *   settings  the options schema: an array of rows { key|name|id, type, range?|min?|max?, options?, default } or a
 *             map key → row; needed for settings (without it, values are checked only as plain JSON)
 *   app       this app's id: a project written for another app is refused */
export function check(input, opts = {}) {
  const errors = [], warnings = [];
  const err = (path, why) => errors.push({ path, why }), warn = (path, why) => warnings.push({ path, why });
  let clean = null;
  try {
    const u = typeof input === 'string' || input instanceof Uint8Array ? unwrap(input) : (() => { const e = frameErrors(input); return e.length ? { envelope: null, errors: e } : { envelope: input.mir < FORMAT ? migrate(input) : input, errors: [] }; })();
    if (!u.envelope) { errors.push(...u.errors); if (!errors.length) err('mir', 'no migration for this format'); return done(); }
    const env = u.envelope;
    const known = new Set(['mir', 'kind', 'kit', 'app', 'name', 'made', 'data']);
    for (const k of Object.keys(env)) if (!known.has(k)) warn(k, 'not part of the envelope; dropped');
    if (typeof env.kit !== 'string') warn('kit', 'the kit version that wrote it is missing');
    if (env.app != null && typeof env.app !== 'string') err('app', 'an app id is a string');
    if (env.name != null && (typeof env.name !== 'string' || env.name.length > LIMITS.title)) err('name', `a name is a string of at most ${LIMITS.title} characters`);
    if (typeof env.made !== 'string' || Number.isNaN(Date.parse(env.made))) warn('made', 'not an ISO date');
    const ctx = { err, warn, opts, schema: tokenIndex(opts.tokens) };
    const data = KIND_RULES[env.kind](env.data, 'data', ctx, env);
    if (!errors.length) {
      clean = { mir: env.mir, kind: env.kind };
      for (const k of ['kit', 'app', 'name', 'made']) if (typeof env[k] === 'string') clean[k] = env[k];
      clean.data = data;
    }
  } catch (e) { err('', 'the checker could not read this: ' + String(e && e.message || e).slice(0, 120)); }
  return done();
  function done() { const ok = errors.length === 0; return { ok, errors, warnings, envelope: ok ? clean : null }; }
}

/* plain JSON only: no function, no undefined, no cycle, no `__proto__` key, bounded depth and size.  → size in chars, or -1 */
function plainJson(v, path, ctx, cap) {
  let n = 0, bad = false; const seen = new Set();
  const walk = (x, p, d) => {
    if (bad) return;
    if (d > LIMITS.depth) { ctx.err(p, `nested deeper than ${LIMITS.depth}`); bad = true; return; }
    if (x === null || typeof x === 'boolean') { n += 5; return; }
    if (typeof x === 'number') { if (!Number.isFinite(x)) { ctx.err(p, 'a number must be finite'); bad = true; } n += 12; return; }
    if (typeof x === 'string') { n += x.length + 2; return; }
    if (typeof x !== 'object') { ctx.err(p, `${typeof x} is not JSON`); bad = true; return; }
    if (seen.has(x)) { ctx.err(p, 'a cycle'); bad = true; return; }
    seen.add(x);
    if (Array.isArray(x)) x.forEach((y, i) => walk(y, `${p}[${i}]`, d + 1));
    else for (const k of Object.keys(x)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') { ctx.err(`${p}.${k}`, 'a reserved key'); bad = true; return; }
      n += k.length + 3; walk(x[k], `${p}.${k}`, d + 1);
    }
    seen.delete(x);
    if (n > cap) { ctx.err(p, `larger than ${Math.round(cap / 1024)} KB`); bad = true; }
  };
  walk(v, path, 0);
  return bad ? -1 : n;
}
const copy = (v) => JSON.parse(JSON.stringify(v));

const KIND_RULES = {
  skin: (d, p, ctx) => checkSkin(d, p, ctx),
  settings: (d, p, ctx) => checkSettings(d, p, ctx),
  page(d, p, ctx) {
    if (!isObj(d)) { ctx.err(p, 'a page is { title, md }'); return null; }
    if (typeof d.title !== 'string') ctx.err(p + '.title', 'a page title is a string');
    else if (d.title.length > LIMITS.title) ctx.err(p + '.title', `a page title is at most ${LIMITS.title} characters`);
    if (typeof d.md !== 'string') ctx.err(p + '.md', 'a page\'s markdown is a string');
    else if (d.md.length > LIMITS.md) ctx.err(p + '.md', 'a page is at most 2 MB of markdown');
    if ('shared' in d && typeof d.shared !== 'boolean') ctx.err(p + '.shared', 'shared is true or false');
    for (const k of Object.keys(d)) if (!['title', 'md', 'shared'].includes(k)) ctx.warn(`${p}.${k}`, 'not part of a page; dropped');
    const out = { title: d.title, md: d.md }; if (typeof d.shared === 'boolean') out.shared = d.shared; return out;
  },
  project(d, p, ctx, env) {
    if (ctx.opts.app != null && env.app !== ctx.opts.app) ctx.err('app', env.app == null ? `this project names no app; this is ${ctx.opts.app}` : `this project is ${env.app}'s; this is ${ctx.opts.app}`);
    else if (env.app == null) ctx.warn('app', 'a project should name the app that reads it');
    if (!isObj(d)) { ctx.err(p, 'a project is { parts, pages? }'); return null; }
    if (!isObj(d.parts)) ctx.err(p + '.parts', 'a project\'s parts are an object, name → JSON');
    if (plainJson(d, p, ctx, LIMITS.project) < 0) return null;
    if (d.pages != null) {
      const list = Array.isArray(d.pages) ? d.pages : isObj(d.pages) && Array.isArray(d.pages.pages) ? d.pages.pages : null;
      if (!list) ctx.err(p + '.pages', 'pages are a list of { title, md }');
      else list.forEach((pg, i) => { if (!isObj(pg) || ('title' in pg && typeof pg.title !== 'string') || ('md' in pg && typeof pg.md !== 'string')) ctx.err(`${p}.pages[${i}]`, 'a page is { title, md } with strings'); });
    }
    for (const k of Object.keys(d)) if (!['parts', 'pages'].includes(k)) ctx.warn(`${p}.${k}`, 'not part of a project; dropped');
    const out = { parts: copy(d.parts || {}) }; if (d.pages != null) out.pages = copy(d.pages); return out;
  },
  spec(d, p, ctx) {
    if (!isObj(d)) { ctx.err(p, 'a spec is { skin?, settings?, layouts?, keys?, language? }'); return null; }
    const out = {};
    for (const k of Object.keys(d)) {
      const q = `${p}.${k}`, v = d[k];
      if (k === 'skin') out.skin = checkSkin(v, q, ctx);
      else if (k === 'settings') out.settings = checkSettings(v, q, ctx);
      else if (k === 'layouts') { if (!isObj(v)) ctx.err(q, 'layouts are an object, name → JSON'); else if (plainJson(v, q, ctx, LIMITS.member) >= 0) out.layouts = copy(v); }
      else if (k === 'keys') out.keys = checkKeys(v, q, ctx);
      else if (k === 'language') out.language = checkLanguage(v, q, ctx);
      else ctx.warn(q, 'not part of a spec; dropped');
    }
    return out;
  }
};

function checkKeys(v, p, ctx) {
  if (!isObj(v)) { ctx.err(p, 'keys are an object, action → chord (or a list of chords)'); return null; }
  const out = {}, CHORD = /^[A-Za-z0-9+\-_ .,/;'[\]=`]{1,40}$/;
  for (const [k, c] of Object.entries(v)) {
    if (!/^[A-Za-z0-9_.:-]{1,64}$/.test(k)) { ctx.err(`${p}.${k}`, 'an action id is letters, digits and . _ : -'); continue; }
    const list = Array.isArray(c) ? c : [c];
    if (list.length > 8 || !list.every((s) => typeof s === 'string' && CHORD.test(s))) { ctx.err(`${p}.${k}`, 'a chord is a short string like "Ctrl+Shift+K"'); continue; }
    out[k] = c;
  }
  return out;
}
function checkLanguage(v, p, ctx) {
  const TAG = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
  if (typeof v === 'string') { if (!TAG.test(v)) ctx.err(p, 'a language is a tag like "en" or "pt-BR"'); return v; }
  if (!isObj(v) || typeof v.code !== 'string' || !TAG.test(v.code)) { ctx.err(p, 'a language is a tag, or { code, strings? }'); return null; }
  if (v.strings != null && (!isObj(v.strings) || !Object.values(v.strings).every((s) => typeof s === 'string'))) ctx.err(p + '.strings', 'strings are an object, key → text');
  if (plainJson(v, p, ctx, LIMITS.member) < 0) return null;
  return copy(v);
}

/* ── settings, against the options schema the caller passes ───────────────────────────────────────────────── */
function settingsIndex(s) {
  if (!s) return null;
  const rows = Array.isArray(s) ? s : Array.isArray(s.rows) ? s.rows : isObj(s) ? Object.entries(s).map(([k, r]) => ({ key: k, ...r })) : [];
  const m = new Map(); for (const r of rows) { const k = r && (r.key ?? r.name ?? r.id); if (k != null) m.set(String(k), r); } return m;
}
function settingValue(row, v) {
  const t = String(row.type || '').toLowerCase();
  const range = Array.isArray(row.range) ? row.range : [row.min, row.max];
  const choices = row.options || row.values || row.choices;
  if (t === 'bool' || t === 'boolean' || t === 'switch') return typeof v === 'boolean' ? null : 'true or false';
  if (t === 'number' || t === 'int' || t === 'integer' || t === 'float' || t === 'range') {
    if (typeof v !== 'number' || !Number.isFinite(v)) return 'a number';
    if ((t === 'int' || t === 'integer') && !Number.isInteger(v)) return 'a whole number';
    if (range[0] != null && v < range[0]) return `at least ${range[0]}`;
    if (range[1] != null && v > range[1]) return `at most ${range[1]}`;
    return null;
  }
  if (t === 'enum' || t === 'choice' || t === 'select' || t === 'seg' || Array.isArray(choices)) {
    const vals = (choices || []).map((c) => (isObj(c) ? c.value ?? c.id : c));
    return vals.includes(v) ? null : `one of ${vals.map((x) => JSON.stringify(x)).join(', ')}`;
  }
  if (t === 'string' || t === 'text') return typeof v === 'string' && v.length <= (row.maxLength || 1000) ? null : 'a short string';
  if (t === 'color' || t === 'colour') return typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v) ? null : 'a hex colour';
  return typeof v === 'object' ? 'a plain value' : null;
}
function checkSettings(d, p, ctx) {
  if (!isObj(d)) { ctx.err(p, 'settings are an object, key → value'); return null; }
  if (plainJson(d, p, ctx, LIMITS.member) < 0) return null;
  const idx = settingsIndex(ctx.opts.settings), out = {};
  if (!idx) { ctx.warn(p, 'no options schema given: values were checked only as plain JSON'); return copy(d); }
  for (const [k, v] of Object.entries(d)) {
    const row = idx.get(k);
    if (!row) { ctx.warn(`${p}.${k}`, 'no such option here; dropped'); continue; }
    const why = settingValue(row, v);
    if (why) ctx.err(`${p}.${k}`, `${JSON.stringify(v)} is out of bounds: ${why}`); else out[k] = v;
  }
  return out;
}

/* ── skins: the value grammar ──────────────────────────────────────────────────────────────────────────────── */
const indexCache = new WeakMap();
function tokenIndex(t) {
  if (!t) return null;
  const rows = Array.isArray(t) ? t : t.tokens;
  if (!Array.isArray(rows)) return null;
  if (indexCache.has(rows)) return indexCache.get(rows);
  const m = new Map(); for (const r of rows) if (r && typeof r.name === 'string') m.set(r.name, r);
  indexCache.set(rows, m); return m;
}

/** A row's range, when the schema has none yet: [min, max] for a number.  The schema's own `range` wins. */
export const RANGES = Object.freeze({
  '--glass-opacity': [0, 1], '--card-opacity': [0, 1], '--info-dim': [0, 1], '--info-travel': [0, 1], '--state-disabled': [0, 1],
  '--state-press-scale': [0.8, 1.05], '--lh': [0.8, 3], '--info-lh': [0.8, 3],
  '--w-bold': [100, 900], '--w-med': [100, 900], '--weight-med': [100, 900], '--weight-bold': [100, 900],
  '--z-rack': [0, 100000], '--z-toast': [0, 100000], '--z-top': [0, 100000]
});
const TYPE_RANGE = { number: [-10000, 10000], percentage: [0, 100], angle: [-360, 720] };
/** the keyword sets, per token */
export const KEYWORDS = Object.freeze({ '--label-case': ['uppercase', 'none', 'lowercase', 'capitalize'] });
/** the font families a skin may name: what the kit ships, the system faces it falls back to, and the generics */
export const FONTS = Object.freeze([
  'Roboto', 'Inter', 'Spectral', 'Playfair Display', 'Alegreya SC', 'Butler', 'STIX Two Math', 'Latin Modern Math', 'Libertinus Math',
  'Noto Serif', 'Noto Sans', 'DejaVu Serif', 'DejaVu Sans', 'DejaVu Sans Mono', 'Georgia', 'Times New Roman', 'Times', 'Helvetica', 'Helvetica Neue', 'Arial',
  'Segoe UI', 'SF Pro Text', 'SF Pro Display', 'SF Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'Cascadia Code', 'Fira Code', 'JetBrains Mono',
  '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded',
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'math'
]);
const FONT_SET = new Set(FONTS.map((f) => f.toLowerCase()));
const NAMED = new Set(('transparent currentcolor black white silver gray grey red maroon purple fuchsia magenta green lime olive yellow navy blue teal aqua cyan orange ' +
  'aliceblue antiquewhite aquamarine azure beige bisque blanchedalmond blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson ' +
  'darkblue darkcyan darkgoldenrod darkgray darkgrey darkgreen darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue ' +
  'darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen gainsboro ghostwhite gold ' +
  'goldenrod greenyellow honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow ' +
  'lightgray lightgrey lightgreen lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow limegreen linen mediumaquamarine ' +
  'mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin ' +
  'navajowhite oldlace olivedrab orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue rebeccapurple ' +
  'rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna skyblue slateblue slategray slategrey snow springgreen steelblue tan thistle tomato ' +
  'turquoise violet wheat whitesmoke yellowgreen').split(' '));
const COLOR_FNS = new Set(['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'color-mix', 'light-dark']);
const COLOR_WORDS = new Set(['in', 'from', 'none', 'srgb', 'srgb-linear', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'xyz', 'xyz-d50', 'xyz-d65',
  'hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'shorter', 'longer', 'increasing', 'decreasing', 'hue', 'r', 'g', 'b', 'h', 's', 'l', 'w', 'a', 'c', 'x', 'y', 'z', 'alpha']);
const MATH_FNS = new Set(['calc', 'min', 'max', 'clamp', 'sqrt', '']);   // sqrt: the relief's exact √2 offsets (1.5.0-alpha.7)
const GRAD_FNS = new Set(['linear-gradient', 'radial-gradient', 'conic-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'repeating-conic-gradient']);
const GRAD_WORDS = new Set(['to', 'at', 'top', 'bottom', 'left', 'right', 'center', 'circle', 'ellipse', 'closest-side', 'closest-corner', 'farthest-side', 'farthest-corner', 'from', ...COLOR_WORDS]);
const FILTER_FNS = new Set(['blur', 'brightness', 'contrast', 'saturate', 'grayscale', 'sepia', 'invert', 'opacity', 'hue-rotate', 'drop-shadow']);
const EASE_WORDS = new Set(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end']);
const STEP_WORDS = new Set(['jump-start', 'jump-end', 'jump-none', 'jump-both', 'start', 'end']);
const LEN_UNITS = new Set(['px', 'em', 'rem', 'ex', 'ch', 'lh', 'vw', 'vh', 'vmin', 'vmax', 'svh', 'dvh', 'lvh', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax', 'pt', '%']);
const ANGLE_UNITS = new Set(['deg', 'turn', 'rad', 'grad']);
const TIME_UNITS = new Set(['ms', 's']);

/* the reason a hostile value is refused, said plainly.  The refusal itself is the grammar below, not this list. */
const HOSTILE = [[/</, 'markup is not a value'], [/url\s*\(/i, 'a skin value cannot load anything (url)'], [/@import/i, 'a skin value cannot load anything (@import)'],
  [/expression\s*\(/i, 'a skin value cannot run anything (expression)'], [/javascript\s*:/i, 'a skin value cannot run anything (javascript:)'], [/image-set|element\s*\(|attr\s*\(|env\s*\(/i, 'a skin value cannot reach outside its value'],
  [/[;{}]/, 'a value cannot end its declaration (; { })'], [/\\/, 'no escapes in a value'], [/!/, 'no !important in a value']];

/* tokenize: whitespace · 'string' · #hex · number+unit · ident · ident( · ( ) , / + * - */
function tokenize(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t' || c === '\n') { i++; out.push({ t: 'ws' }); continue; }
    if (c === '"' || c === '\'') { const j = s.indexOf(c, i + 1); if (j < 0) throw 'an unclosed quote'; out.push({ t: 'str', v: s.slice(i + 1, j) }); i = j + 1; continue; }
    if (c === '#') { const m = /^#[0-9a-fA-F]+/.exec(s.slice(i)); if (!m) throw 'a # that is not a hex colour'; out.push({ t: 'hash', v: m[0] }); i += m[0].length; continue; }
    const num = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?(%|[a-zA-Z]+)?/.exec(s.slice(i));
    const prev = out.filter((x) => x.t !== 'ws').pop(), afterWs = out.length && out[out.length - 1].t === 'ws';
    if (num && (/[\d.]/.test(c) || ((c === '-' || c === '+') && (!prev || afterWs || prev.t === 'op' || prev.t === 'open') && /[\d.]/.test(s[i + 1] || '')))) {
      out.push({ t: 'num', v: parseFloat(num[0]), unit: (num[3] || '').toLowerCase() }); i += num[0].length; continue;
    }
    const id = /^-{0,2}[A-Za-z_][A-Za-z0-9_-]*/.exec(s.slice(i));
    if (id) { i += id[0].length; if (s[i] === '(') { out.push({ t: 'open', name: id[0].toLowerCase() }); i++; } else out.push({ t: 'ident', v: id[0] }); continue; }
    if (c === '(') { out.push({ t: 'open', name: '' }); i++; continue; }
    if (c === ')') { out.push({ t: 'close' }); i++; continue; }
    if (',/+*-'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    throw `the character ${JSON.stringify(c)} is not in a value's grammar`;
  }
  return out;
}
/* parse into nodes: { t: num|ident|hash|str|op|fn, …, args: [nodes] for fn }, whitespace dropped */
function parse(s) {
  const toks = tokenize(s); let i = 0;
  const list = (inner) => {
    const nodes = [];
    while (i < toks.length) {
      const k = toks[i++];
      if (k.t === 'ws') continue;
      if (k.t === 'close') { if (!inner) throw 'a ) with no ('; return nodes; }
      if (k.t === 'open') nodes.push({ t: 'fn', name: k.name, args: list(true) });
      else nodes.push(k);
    }
    if (inner) throw 'an unclosed ('; return nodes;
  };
  return list(false);
}
const split = (nodes) => { const out = [[]]; for (const n of nodes) if (n.t === 'op' && n.v === ',') out.push([]); else out[out.length - 1].push(n); return out; };

/** checkSkinValue(row, value, known) → null when the value is in its type's grammar, else the reason.
 *  `known` is the set (or map) of token names a var() may name. */
export function checkSkinValue(row, value, known) {
  if (typeof value === 'number' && Number.isFinite(value)) value = String(value);
  if (typeof value !== 'string') return 'a value is a string';
  if (value.length > LIMITS.value) return `a value is at most ${LIMITS.value} characters`;
  for (const [re, why] of HOSTILE) if (re.test(value)) return why;
  if (!/^[A-Za-z0-9#%.,()/+*\-\s'"_]*$/.test(value)) return 'a character outside a value\'s grammar';
  const v = value.trim();
  if (!v) return 'an empty value';
  let nodes; try { nodes = parse(v); } catch (e) { return String(e); }
  const g = { row, known, why: null, type: row.type };
  const bad = (w) => { if (!g.why) g.why = w; return false; };
  (TYPE_RULES[row.type] || ((n) => bad(`the schema gives ${row.name} the type ${row.type}, which no skin may set`)))(nodes, g, bad);
  return g.why;
}

/* ── the pieces each type is built from ── */
function isVar(n, g, bad) {
  if (n.t !== 'fn' || n.name !== 'var') return false;
  const [name, ...rest] = n.args;
  if (!name || name.t !== 'ident' || !name.v.startsWith('--')) return bad('var() names a token of the schema, by its name'), true;
  const has = g.known && (g.known.has(name.v));
  if (!has) return bad(`var(${name.v}) names no token in the schema`), true;
  if (rest.length) {
    if (rest[0].t !== 'op' || rest[0].v !== ',') return bad('var() takes a token, then a comma and a fallback'), true;
    const fb = rest.slice(1);
    if (!fb.length) return bad('an empty var() fallback'), true;
    (TYPE_RULES[g.type] || (() => true))(fb, g, bad);
  }
  return true;
}
function range(g, v, lo, hi, what) { if (v < lo || v > hi) bad2(g, `${v}${what || ''} is out of range ${lo}…${hi}`); }
const bad2 = (g, w) => { if (!g.why) g.why = w; };
function lenRange(g, n) {
  const a = Math.abs(n.v);
  if (n.unit === 'px' || n.unit === 'pt') { if (a > 4096) bad2(g, `${n.v}${n.unit} is out of range (|x| ≤ 4096px)`); }
  else if (a > 100) bad2(g, `${n.v}${n.unit} is out of range (|x| ≤ 100${n.unit})`);
}
/* a numeric expression whose leaves are numbers with units from `units` (and unitless where `bare`) */
function numeric(n, g, bad, units, bare, check) {
  if (isVar(n, g, bad)) return true;
  if (n.t === 'num') {
    if (n.unit === '' ? !(bare || n.v === 0) : !units.has(n.unit)) return bad(`${n.v}${n.unit} is not a ${g.type}`);
    if (check) check(n);
    return true;
  }
  if (n.t === 'fn' && MATH_FNS.has(n.name)) {
    if (!n.args.length) return bad(`an empty ${n.name || '('}()`);
    for (const a of n.args) if (!(a.t === 'op' || numeric(a, g, bad, units, true, null))) return false;
    return true;
  }
  return bad(`${show(n)} is not a ${g.type}`);
}
const show = (n) => n.t === 'fn' ? `${n.name}()` : n.t === 'num' ? `${n.v}${n.unit}` : n.t === 'str' ? `"${n.v}"` : String(n.v);
function color(n, g, bad) {
  if (isVar(n, g, bad)) return true;
  if (n.t === 'hash') return [4, 5, 7, 9].includes(n.v.length) || bad(`${n.v} is not a hex colour`);
  if (n.t === 'ident') return NAMED.has(n.v.toLowerCase()) || bad(`${n.v} is not a colour`);
  if (n.t === 'fn' && COLOR_FNS.has(n.name)) {
    if (!n.args.length) return bad(`an empty ${n.name}()`);
    for (const a of n.args) {
      if (a.t === 'op') continue;
      if (a.t === 'num') { if (!(a.unit === '' || a.unit === '%' || ANGLE_UNITS.has(a.unit))) return bad(`${a.v}${a.unit} inside ${n.name}()`); if (a.unit === '%') range(g, a.v, 0, 100, '%'); continue; }
      if (a.t === 'ident' && (COLOR_WORDS.has(a.v.toLowerCase()) || NAMED.has(a.v.toLowerCase()))) continue;
      if (a.t === 'fn' && MATH_FNS.has(a.name)) { if (!numeric(a, g, bad, new Set(['%', ...ANGLE_UNITS]), true)) return false; continue; }
      if (!color(a, g, bad)) return false;
    }
    return true;
  }
  return bad(`${show(n)} is not a colour`);
}
const one = (nodes, bad, what) => (nodes.length === 1 ? nodes[0] : (bad(`a ${what} is one value, not ${nodes.length}`), null));
function shadowLayer(layer, g, bad, allowInset) {
  if (layer.length === 1 && isVar(layer[0], g, bad)) return true;
  let lens = 0, cols = 0, inset = 0, vars = 0;
  for (const n of layer) {
    if (n.t === 'ident' && n.v === 'inset' && allowInset) { inset++; continue; }
    if (n.t === 'fn' && n.name === 'var') { if (!isVar(n, g, bad)) return false; vars++; continue; }
    if (n.t === 'num' || (n.t === 'fn' && MATH_FNS.has(n.name))) {
      lens++;
      if (!numeric(n, g, bad, LEN_UNITS, false, (x) => { if (lens === 3 && x.v < 0) bad2(g, 'a shadow\'s blur is never negative'); if (Math.abs(x.v) > 512 && x.unit === 'px') bad2(g, `${x.v}px is out of range for a shadow (|x| ≤ 512px)`); })) return false;
      continue;
    }
    if (!color(n, g, bad)) return false; cols++;
  }
  if (inset > 1 || cols > 1) return bad('a shadow layer has at most one inset and one colour');
  if (!vars && (lens < 2 || lens > 4)) return bad('a shadow layer has 2 to 4 lengths');
  return true;
}

const OUTLINE_STYLES = new Set(['none', 'auto', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset']);
const OUTLINE_WIDTHS = new Set(['thin', 'medium', 'thick']);
const BORDER_STYLES = new Set([...OUTLINE_STYLES].filter((x) => x !== 'auto').concat(['hidden']));
const FONT_STYLES = new Set(['normal', 'italic', 'oblique', 'small-caps']);
const FONT_WEIGHTS = new Set(['bold', 'bolder', 'lighter']);
/* an outline or a border: a width, a style and a colour, each at most once, in any order (or one var()) */
function lineShorthand(nodes, g, bad, styles, what) {
  if (nodes.length === 1 && isVar(nodes[0], g, bad)) return;
  if (!nodes.length || nodes.length > 3) return bad(`${what} is a width, a style and a colour: at most three parts`);
  const seen = { width: 0, style: 0, colour: 0 };
  for (const n of nodes) {
    if (n.t === 'ident' && styles.has(n.v)) seen.style++;
    else if (n.t === 'ident' && OUTLINE_WIDTHS.has(n.v)) seen.width++;
    else if (n.t === 'num' || (n.t === 'fn' && MATH_FNS.has(n.name))) { seen.width++; if (!numeric(n, g, bad, LEN_UNITS, false, (x) => { if (x.v < 0 || (x.unit === 'px' && x.v > 16)) bad2(g, `${x.v}${x.unit} is out of range for ${what} (0…16px)`); })) return; }
    else { seen.colour++; if (!color(n, g, bad)) return; }
  }
  if (seen.width > 1 || seen.style > 1 || seen.colour > 1) bad(`${what} names its width, style and colour once each`);
}
const TYPE_RULES = {
  color(nodes, g, bad) { const n = one(nodes, bad, 'colour'); if (n) color(n, g, bad); },
  /* an outline shorthand (--state-focus): a width, a style and a colour, each at most once, in any order */
  outline(nodes, g, bad) { lineShorthand(nodes, g, bad, OUTLINE_STYLES, 'an outline'); },
  /* a border shorthand: the same three parts; `auto` is an outline's style only */
  border(nodes, g, bad) { lineShorthand(nodes, g, bad, BORDER_STYLES, 'a border'); },
  /* a font shorthand: [style] [weight] size[/line-height] family, the family by the font grammar */
  'font-shorthand'(nodes, g, bad) {
    if (nodes.length === 1 && isVar(nodes[0], g, bad)) return;
    const comma = nodes.findIndex((n) => n.t === 'op' && n.v === ','), seg = comma < 0 ? nodes : nodes.slice(0, comma);
    let f = seg.length - 1;                                          // where the family starts: a var, a string, or a run of names
    if (f >= 0 && !(seg[f].t === 'str' || (seg[f].t === 'fn' && seg[f].name === 'var'))) { while (f >= 0 && seg[f].t === 'ident' && !FONT_STYLES.has(seg[f].v) && !FONT_WEIGHTS.has(seg[f].v)) f--; f++; }
    const pre = seg.slice(0, f), fam = nodes.slice(f);
    if (!fam.length || !pre.length) return bad('a font shorthand is [style] [weight] size[/line-height] family');
    const slash = pre.length >= 3 && pre[pre.length - 2].t === 'op' && pre[pre.length - 2].v === '/';
    const size = pre[pre.length - (slash ? 3 : 1)], lh = slash ? pre[pre.length - 1] : null, lead = pre.slice(0, pre.length - (slash ? 3 : 1));
    if (lead.length > 2) return bad('a font shorthand has at most a style and a weight before its size');
    for (const n of lead) {
      if (n.t === 'ident' && (FONT_STYLES.has(n.v) || FONT_WEIGHTS.has(n.v))) continue;
      if (n.t === 'num' && n.unit === '') { range(g, n.v, 1, 1000); continue; }
      if (n.t === 'fn' && n.name === 'var') { if (!isVar(n, g, bad)) return; continue; }
      return bad(`${show(n)} is not a font style or weight`);
    }
    if (!size) return bad('a font shorthand needs a size');
    if (size.t === 'fn' && size.name === 'var') { const was = g.type; g.type = 'length'; const v = isVar(size, g, bad); g.type = was; if (!v) return; }
    else if (!numeric(size, g, bad, LEN_UNITS, false, (x) => { if (x.unit === 'px' && (x.v < 0 || x.v > 400)) bad2(g, `${x.v}px is out of range for a font size`); })) return;
    if (lh) {
      if (lh.t === 'fn' && lh.name === 'var') { if (!isVar(lh, g, bad)) return; }
      else if (!numeric(lh, g, bad, LEN_UNITS, true, (x) => { if (x.unit === '') range(g, x.v, 0.5, 4); })) return;
    }
    const was = g.type; g.type = 'font'; TYPE_RULES.font(fam, g, bad); g.type = was;   // a var() fallback in the family is a family
  },
  'color-channels'(nodes, g, bad) {
    if (nodes.length === 1 && isVar(nodes[0], g, bad)) return;
    if (nodes.length !== 3) return bad('colour channels are three: H S% L%');
    numeric(nodes[0], g, bad, ANGLE_UNITS, true, (x) => range(g, x.v, -360, 720));
    numeric(nodes[1], g, bad, new Set(['%']), false, (x) => range(g, x.v, 0, 100, '%'));
    numeric(nodes[2], g, bad, new Set(['%']), false, (x) => range(g, x.v, 0, 100, '%'));
  },
  angle(nodes, g, bad) { const n = one(nodes, bad, 'angle'); if (n) numeric(n, g, bad, ANGLE_UNITS, true, (x) => { if (x.unit === '' || x.unit === 'deg') range(g, x.v, ...TYPE_RANGE.angle); }); },
  percentage(nodes, g, bad) { const n = one(nodes, bad, 'percentage'); if (n) numeric(n, g, bad, new Set(['%']), false, (x) => range(g, x.v, 0, 100, '%')); },
  number(nodes, g, bad) {
    const n = one(nodes, bad, 'number'); if (!n) return;
    const r = Array.isArray(g.row.range) ? g.row.range : RANGES[g.row.name] || TYPE_RANGE.number;
    numeric(n, g, bad, new Set(), true, (x) => range(g, x.v, r[0], r[1]));
  },
  length(nodes, g, bad) { const n = one(nodes, bad, 'length'); if (n) numeric(n, g, bad, LEN_UNITS, false, (x) => lenRange(g, x)); },
  duration(nodes, g, bad) { const n = one(nodes, bad, 'duration'); if (n) numeric(n, g, bad, TIME_UNITS, false, (x) => range(g, x.unit === 's' ? x.v * 1000 : x.v, 0, 20000, 'ms')); },
  easing(nodes, g, bad) {
    const n = one(nodes, bad, 'easing'); if (!n || isVar(n, g, bad)) return;
    if (n.t === 'ident') return EASE_WORDS.has(n.v) || bad(`${n.v} is not an easing`);
    if (n.t === 'fn' && n.name === 'cubic-bezier') {
      const xs = n.args.filter((a) => !(a.t === 'op' && a.v === ','));
      if (xs.length !== 4 || !xs.every((a) => a.t === 'num' && a.unit === '')) return bad('cubic-bezier() takes four numbers');
      range(g, xs[0].v, 0, 1); range(g, xs[2].v, 0, 1); range(g, xs[1].v, -5, 5); range(g, xs[3].v, -5, 5); return;
    }
    if (n.t === 'fn' && n.name === 'steps') {
      const [k, , w] = n.args;
      if (!k || k.t !== 'num' || k.unit || !Number.isInteger(k.v) || k.v < 1 || k.v > 1000) return bad('steps() takes a whole number of steps');
      if (w && !(w.t === 'ident' && STEP_WORDS.has(w.v))) return bad('steps(n, start|end|jump-…)'); return;
    }
    if (n.t === 'fn' && n.name === 'linear') { if (!n.args.length || !n.args.every((a) => a.t === 'op' || (a.t === 'num' && (a.unit === '' || a.unit === '%')))) bad('linear() takes numbers and percentages'); return; }
    bad(`${show(n)} is not an easing`);
  },
  shadow(nodes, g, bad) {
    if (nodes.length === 1 && nodes[0].t === 'ident' && nodes[0].v === 'none') { g.note = 'none'; return; }
    for (const layer of split(nodes)) { if (!layer.length) return bad('an empty shadow layer'); if (!shadowLayer(layer, g, bad, true)) return; }
  },
  filter(nodes, g, bad) {
    if (nodes.length === 1 && nodes[0].t === 'ident' && nodes[0].v === 'none') return;
    for (const n of nodes) {
      if (isVar(n, g, bad)) continue;
      if (n.t !== 'fn' || !FILTER_FNS.has(n.name)) return bad(`${show(n)} is not a filter`);
      if (n.name === 'drop-shadow') { if (!shadowLayer(n.args, g, bad, false)) return; continue; }
      const a = one(n.args, bad, `${n.name}() argument`); if (!a) return;
      if (n.name === 'blur') { if (!numeric(a, g, bad, LEN_UNITS, false, (x) => { if (x.v < 0) bad2(g, 'blur() is never negative'); else if (x.v > 200) bad2(g, `blur(${x.v}${x.unit}) is out of range (≤ 200)`); if (x.v === 0) g.note = 'blur0'; })) return; continue; }
      if (n.name === 'hue-rotate') { if (!numeric(a, g, bad, ANGLE_UNITS, false, null)) return; continue; }
      if (!numeric(a, g, bad, new Set(['%']), true, (x) => range(g, x.v, 0, x.unit === '%' ? 1000 : 10))) return;
    }
  },
  image(nodes, g, bad) {
    if (nodes.length === 1 && nodes[0].t === 'ident' && nodes[0].v === 'none') return;
    for (const layer of split(nodes)) {
      const n = one(layer, bad, 'background layer'); if (!n) return;
      if (isVar(n, g, bad)) continue;
      if (n.t !== 'fn' || !GRAD_FNS.has(n.name)) return bad(`${show(n)} is not a gradient (only gradients: an image never loads)`);
      for (const a of n.args) {
        if (a.t === 'op') continue;
        if (a.t === 'num') { if (!(a.unit === '' || LEN_UNITS.has(a.unit) || ANGLE_UNITS.has(a.unit))) return bad(`${a.v}${a.unit} inside ${n.name}()`); continue; }
        if (a.t === 'ident' && GRAD_WORDS.has(a.v.toLowerCase())) continue;
        if (a.t === 'fn' && MATH_FNS.has(a.name)) { if (!numeric(a, g, bad, new Set([...LEN_UNITS, ...ANGLE_UNITS]), true)) return; continue; }
        if (!color(a, g, bad)) return;
      }
    }
  },
  font(nodes, g, bad) {
    if (nodes.length === 1 && isVar(nodes[0], g, bad)) return;
    for (const fam of split(nodes)) {
      if (fam.length === 1 && fam[0].t === 'fn' && isVar(fam[0], g, bad)) continue;
      const name = fam.length === 1 && fam[0].t === 'str' ? fam[0].v : fam.every((x) => x.t === 'ident') ? fam.map((x) => x.v).join(' ') : null;
      if (name == null) return bad('a font family is a name, quoted or not');
      if (!FONT_SET.has(name.toLowerCase())) return bad(`the font family "${name}" is not in the list a skin may name (docs/FORMAT.md)`);
    }
  },
  keyword(nodes, g, bad) {
    const n = one(nodes, bad, 'keyword'); if (!n || isVar(n, g, bad)) return;
    const set = (Array.isArray(g.row.values) && g.row.values) || KEYWORDS[g.row.name];
    if (!set) return bad(`no keyword set is known for ${g.row.name}`);
    if (n.t !== 'ident' || !set.includes(n.v)) bad(`one of ${set.join(', ')}`);
  }
};

/** skinValues(skinData, theme) → { '--token': value } for one theme: `tokens`, then that theme's section over it */
export function skinValues(skin, theme = 'dark') {
  if (!isObj(skin)) return {};
  return { ...(isObj(skin.tokens) ? skin.tokens : {}), ...(isObj(skin[theme]) ? skin[theme] : {}) };
}

/* a skin is { tokens?, dark?, light? }, each a map token → value; `tokens` is for both themes */
function checkSkin(d, p, ctx) {
  if (!isObj(d)) { ctx.err(p, 'a skin is { tokens?, dark?, light? }: token → value'); return null; }
  if (!ctx.schema) { ctx.err(p, 'checking a skin needs the token schema (mir/tokens.json)'); return null; }
  const out = {};
  for (const sec of Object.keys(d)) {
    const q = `${p}.${sec}`;
    if (!['tokens', 'dark', 'light'].includes(sec)) { ctx.err(q, 'a skin has tokens, dark and light; nothing else (a skin carries values, never rules, images or script)'); continue; }
    const vals = d[sec];
    if (!isObj(vals)) { ctx.err(q, 'token → value'); continue; }
    const keys = Object.keys(vals);
    if (keys.length > LIMITS.skinKeys) { ctx.err(q, `at most ${LIMITS.skinKeys} tokens`); continue; }
    out[sec] = {};
    for (const k of keys) {
      const row = ctx.schema.get(k), qq = `${q}.${k}`;
      if (!row) { ctx.err(qq, `${k} is not a token in the schema`); continue; }
      if (row.skin !== true) { ctx.err(qq, `${k} is not a skin's to set (geometry, data, runtime and plugin tokens are not)`); continue; }
      const why = checkSkinValue(row, vals[k], ctx.schema);
      if (why) { ctx.err(qq, why); continue; }
      const v = String(vals[k]).trim();
      if (row.type === 'shadow' && /^none$/i.test(v)) ctx.warn(qq, 'a switched-off shadow is "0 0 0 0 transparent", never none');
      if (/blur\(\s*0(px)?\s*\)/.test(v)) ctx.warn(qq, 'a switched-off blur is the whole filter "none"; blur(0) still costs a pass');
      if (row.status === 'deprecated') ctx.warn(qq, `${k} is deprecated`);
      out[sec][k] = v;
    }
  }
  contrast(out, p, ctx);
  return out;
}

/* ── the contrast warning: the top ink (--fg) on the pane colour (--glass-tint), both themes, where both resolve to
 *    plain colours.  A warning, never an error: the pane's alpha and the picture under it are not known here. */
const INK_INPUTS = ['--fg', '--glass-tint', '--glass-hue', '--glass-lum', '--glass-sat-tint'];
function contrast(skin, p, ctx) {
  const touched = (sec) => skin[sec] && INK_INPUTS.some((k) => k in skin[sec]);
  if (!touched('tokens') && !touched('dark') && !touched('light')) return;
  for (const theme of ['dark', 'light']) {
    const vals = new Map();
    for (const [n, r] of ctx.schema) { const d = r.default && (r.default[theme] ?? r.default.dark); if (typeof d === 'string') vals.set(n, d); }
    for (const [k, v] of Object.entries(skinValues(skin, theme))) vals.set(k, v);
    const ink = rgbOf(resolve(vals, '--fg')), pane = rgbOf('hsl(' + resolve(vals, '--glass-tint') + ')');
    if (!ink || !pane) continue;
    const ratio = luminanceRatio(ink, pane);
    if (ratio < 4.5) ctx.warn(`${p}`, `text on its pane is ${ratio.toFixed(1)}:1 in the ${theme} theme (the floor is 4.5:1)`);
  }
}
function resolve(vals, name, depth = 0) {
  const v = vals.get(name); if (v == null || depth > 8) return null;
  let bad = false;
  const out = v.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (_, n, fb) => { const r = resolve(vals, n, depth + 1) ?? (fb != null ? fb.trim() : null); if (r == null) bad = true; return r ?? ''; });
  return bad ? null : out;
}
function rgbOf(s) {
  if (!s) return null; s = s.trim();
  let m = /^#([0-9a-f]{3,8})$/i.exec(s);
  if (m) { let h = m[1]; if (h.length <= 4) h = [...h].map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); }
  m = /^hsla?\(\s*(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i.exec(s);
  if (m) {
    const h = (((+m[1]) % 360) + 360) % 360 / 360, sat = +m[2] / 100, l = +m[3] / 100;
    const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, pp = 2 * l - q;
    const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i.exec(s);
  if (m) return [m[1], m[2], m[3]].map((x) => +x / 255);
  return null;
}
function luminanceRatio(a, b) {
  const L = (c) => { const [r, g, bb] = c.map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * bb; };
  const la = L(a), lb = L(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
