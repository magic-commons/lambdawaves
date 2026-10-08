/* core/i18n.js — the kit's one translation seam: t('English') and the language packs (docs/LANGUAGES.md).
 *
 * THE LAWS IT KEEPS
 *   · ENGLISH IS THE KEY AND THE FALLBACK.  t('EXPOSURE') looks the English up in the current pack; a string the pack
 *     does not have comes back as its English, never a key and never a blank.  Each miss is remembered (missing()).
 *   · A PACK LOADS ON DEMAND, one fetch per language per source, cached: `<source>/<tag>.json`.  The kit's own
 *     folder is the first source; an app adds its own with addLocales(url), and its strings win over the kit's.
 *   · setLanguage(tag) writes <html lang dir>, loads the pack, THEN tells the subscribers.  A pack that will not load
 *     does not throw: the language is set and every string stays English.
 *   · NOTHING RUNS WHILE THE LANGUAGE DOES NOT CHANGE.  The builders that wrote text keep its English on the node and
 *     rewrite it from onLanguage(); t() itself is one map lookup.
 *   · NEVER THROUGH t(): numbers and units in readouts, app and product names, maths, what the user typed.
 *   · VARS: `{name}` is data, written as it is.  A var `{ t: 'English' }` is a kit word and is translated in turn, and
 *     `{:ATTACK}` written in the English is the same thing inline: the label ATTACK, as that language labels it.
 *   · CONTEXT: one English word with two meanings is two keys, `'theme mode::LIGHT'` and `'quality tier::LIGHT'`; the
 *     English shown is the part after `::`.  phrase(en, context) writes that key, and marks a string for the
 *     catalogue where it is not handed to t() on the spot (a table of labels).  The context `name` is a NAME: never
 *     translated, never pseudo-translated (`name::FROST`).
 *   · PLURALS: tn(n, '{n} page', '{n} pages') — the key is the `other` form; a pack entry may be { one, few, many,
 *     other, … } and Intl.PluralRules picks the form; a missing form is `other`, a missing entry the English.
 *   · `qps` / `qps-rtl` are generated, not packs (locales/pseudo.js): accented, ~40 % longer, bracketed. */

/** the ten and English, each named in its own script; `reviewed` flips when a native reader has checked the pack */
export const LANGUAGES = Object.freeze([
  { tag: 'en', name: 'English', dir: 'ltr', reviewed: true },
  { tag: 'zh-Hans', name: '中文', dir: 'ltr', reviewed: false },
  { tag: 'hi', name: 'हिन्दी', dir: 'ltr', reviewed: false },
  { tag: 'es', name: 'Español', dir: 'ltr', reviewed: false },
  { tag: 'ar', name: 'العربية', dir: 'rtl', reviewed: false },
  { tag: 'fr', name: 'Français', dir: 'ltr', reviewed: false },
  { tag: 'bn', name: 'বাংলা', dir: 'ltr', reviewed: false },
  { tag: 'pt-BR', name: 'Português', dir: 'ltr', reviewed: false },
  { tag: 'id', name: 'Bahasa Indonesia', dir: 'ltr', reviewed: false },
  { tag: 'ru', name: 'Русский', dir: 'ltr', reviewed: false },
  { tag: 'ja', name: '日本語', dir: 'ltr', reviewed: false },
  { tag: 'qps', name: '[Ƥšéûðö]', dir: 'ltr', reviewed: true, dev: true },
  { tag: 'qps-rtl', name: '[Ƥšéûðö ŔŢĹ]', dir: 'rtl', reviewed: true, dev: true },
]);

let tag = 'en', dir = 'ltr', strings = null, pseudo = null, seq = 0;
const sources = [new URL('../locales/', import.meta.url).href], cache = new Map(), subs = new Set(), miss = new Set();

export const language = () => tag;
export const direction = () => dir;
export const languages = ({ dev = false } = {}) => LANGUAGES.filter((l) => dev || !l.dev);
/** the English strings asked for in this language that its pack does not have (capped, so dynamic text cannot grow it) */
export const missing = () => [...miss];
/** an app's own packs: a folder URL (`<url>/<tag>.json`) or a function (tag) → pack | null.  Later sources win. */
export function addLocales(src) { if (!sources.includes(src)) { sources.push(src); cache.clear(); } }
export function onLanguage(fn) { subs.add(fn); return () => subs.delete(fn); }

const CTX = /^([a-z][a-z0-9 -]*)::/;
/** phrase(en, context?) → the catalogue key: `en`, or `context::en`.  It translates nothing: it marks a string. */
export const phrase = (en, context) => (context ? context + '::' + en : en);
/** the English a key shows: the part after its context */
export const english = (key) => { const m = CTX.exec(key); return m ? key.slice(m[0].length) : key; };

const fill = (s, vars) => s.replace(/\{(:?)([^{}]+)\}/g, (m, lab, k) => {
  if (lab) return t(k);                                           // {:ATTACK} — a label, translated in turn
  if (!vars || !(k in vars)) return m;
  const v = vars[k];
  return v && typeof v === 'object' && typeof v.t === 'string' ? t(v.t) : String(v);
});
const rules = new Map();
const form = (n, lang) => { let r = rules.get(lang); if (!r) { try { r = new Intl.PluralRules(lang); } catch (_) { r = new Intl.PluralRules('en'); } rules.set(lang, r); } return r.select(n); };
/** the pack's string for `key` — for a plural entry, the form `n` takes — or null */
function look(key, n) {
  const x = strings[key];
  if (typeof x === 'string') return x || null;
  if (x && typeof x === 'object') return x[form(Number(n) || 0, tag)] || x.other || null;
  return null;
}
function say(key, en, vars, n) {
  let s = en;
  if (key.startsWith('name::')) s = en;                           // a name is never translated
  else if (pseudo) s = pseudo(en);
  else if (strings) { const x = look(key, n); if (x) s = x; else if (miss.size < 4096) miss.add(key); }
  return s.indexOf('{') >= 0 ? fill(s, vars) : s;
}

export function t(en, vars, context) {
  if (typeof en !== 'string' || en === '') return en === undefined || en === null ? '' : en;
  const key = context ? context + '::' + en : en;
  return say(key, english(key), vars, vars && vars.n);
}
/** tn(n, one, other, vars?, context?) — a count: English `one` or `other` by English rules, or the pack's form for n */
export function tn(n, one, other, vars, context) {
  const key = context ? context + '::' + other : other, v = { ...(vars || {}), n };
  return say(key, form(Number(n) || 0, 'en') === 'one' ? english(one) : english(key), v, n);
}

async function loadPack(want) {
  if (!cache.has(want)) cache.set(want, (async () => {
    let pack = null;
    for (const src of sources) {
      try {
        let p = null;
        if (typeof src === 'function') p = await src(want);
        else { const r = await fetch(new URL(want + '.json', src)); if (r.ok) p = await r.json(); }
        if (p && typeof p === 'object') pack = { ...(pack || {}), ...p, strings: { ...(pack ? pack.strings : {}), ...(p.strings || {}) } };
      } catch (_) { /* a source without this language is not an error */ }
    }
    return pack;
  })());
  return cache.get(want);
}

/** setLanguage(tag) → Promise<boolean>: false when no pack was found (everything stays English).  The last call wins. */
export async function setLanguage(next = 'en') {
  const my = ++seq, meta = LANGUAGES.find((l) => l.tag === next) || { tag: next, dir: 'ltr' };
  let pack = null, ps = null, ok = true;
  if (/^qps(-|$)/.test(next)) { try { ps = (await import('../locales/pseudo.js')).pseudo; } catch (_) { ok = false; } }
  else if (next !== 'en') { pack = await loadPack(next); ok = !!pack; }
  if (my !== seq) return ok;
  tag = next; dir = (pack && pack.dir) || meta.dir; pseudo = ps;
  strings = next === 'en' || ps ? null : (pack && pack.strings) || {};
  miss.clear();
  if (typeof document !== 'undefined') { document.documentElement.lang = next; document.documentElement.dir = dir; }
  for (const fn of [...subs]) { try { fn(tag); } catch (e) { console.warn('language subscriber', e); } }
  return ok;
}
