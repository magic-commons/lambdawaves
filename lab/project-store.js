/* lab/project-store.js — λWAVES' SAVED PROJECTS UNDER MIR's FOLDERS (0.5.0 C6), the pure half: no DOM, node-tested
 * (tests/project-formats.test.mjs).  It took over lab/project-storage.js and lab/project-import.js.
 *
 * WHAT A BROWSER STORED DOES NOT CHANGE.  `lambdawaves.q0.projects` keeps λWAVES' own form, { items: { [folder/name]: item },
 * recent: [path…] }, which every λWAVES build since wave 46 reads.  FOLDERS' store (mir/folders/files.js createFiles) wants
 * its own envelope, so createProjectStore() is a Storage-shaped TRANSLATOR between the two: getItem(PJ_KEY) shows the kit the
 * envelope (toFiles), setItem(PJ_KEY, envelope) writes λWAVES' form back (fromFiles).  Every other key passes through.
 *   · THE ROUND TRIP IS BYTE-EXACT: the kit's conflict check compares two getItem texts, so toFiles(fromFiles(t)) === t for
 *     anything the kit writes (an entry's key order, its `bytes` reprice, `at` ↔ the ISO `saved`).  `recent` and `opened`
 *     are λWAVES' and the kit never sees them: fromFiles keeps them by entry id, so a rename keeps its row in RECENT.
 *   · Two stored paths that are one name to the kit ('a//b' and 'a/b', or 'X' and 'x' in one folder) are told apart as the kit
 *     tells names apart ("b 2"), so no first write can fold one project onto another.
 *   · R10 (a) AN INVALID COLLECTION IS READ-ONLY.  A stored text that does not parse or validate is shown to the kit as an
 *     empty library, and every write under the key is REFUSED with the reason — never set aside, never emptied, never
 *     replaced.  The words are the ones λWAVES always said: "Stored data was left untouched."
 *   · R10 (b) THE CAPS.  8 MiB a project (λWAVES' since wave 46): parseProjectFile() refuses a larger file before it is
 *     parsed, and the translator refuses a write that would bring in a new or changed entry larger than that.  24 MiB the
 *     collection (BASINS' 24 MB, the kit's LIMITS.project): FOLDERS' own cap, MAX_LIBRARY_CHARS (the browser's quota is
 *     usually the first to say no).
 * ONE PROJECT PART (R5-A3): a FOLDERS entry's payload is { parts: { lambdawaves: { data, notebook } } }, where `data` is
 * rack.js projectSnapshot() (serialize()'s form) and `notebook` the project's page 0, { title, subtitle, text }. */
import { FILES_KIT, FILES_V, normalizeFolder, uniqueName } from './mir/folders/files.js';

export const PJ_KEY = 'lambdawaves.q0.projects';
export const PART = 'lambdawaves';
export const MAX_PROJECT_BYTES = 8 * 1024 * 1024;
export const MAX_LIBRARY_CHARS = 24 << 20;
export const UNTOUCHED = 'Stored data was left untouched.';
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const leaf = (p) => p.slice(p.lastIndexOf('/') + 1);
const parent = (p) => (p.lastIndexOf('/') < 0 ? '' : p.slice(0, p.lastIndexOf('/')));
const iso = (ms) => new Date(ms).toISOString();
const put = (o, k, v) => Object.defineProperty(o, k, { configurable: true, enumerable: true, writable: true, value: v });   // "__proto__" is a project name
export const pathOf = (e) => (e.folder ? e.folder + '/' + e.name : e.name);
/** splitPath('a/b/c') → { folder: 'a/b', name: 'c' } — a path as λWAVES' save names it (trimmed of its outer slashes) */
export const splitPath = (path) => { const p = String(path || '').trim().replace(/^\/+|\/+$/g, ''); return { folder: normalizeFolder(parent(p)), name: leaf(p) }; };

/** validateProjectCollection(c) → c, or throws: the shape every λWAVES build has read (an invalid one is never overwritten) */
export function validateProjectCollection(c) {
  if (!isObj(c) || !isObj(c.items) || (c.recent !== undefined && (!Array.isArray(c.recent) || c.recent.some((p) => typeof p !== 'string'))))
    throw new Error('invalid saved project collection');
  for (const it of Object.values(c.items)) {
    if (!isObj(it) || typeof it.path !== 'string' || !isObj(it.data) || !isObj(it.notebook)) throw new Error('invalid saved project record');
    for (const k of ['folder', 'name', 'saved', 'opened']) if (it[k] !== undefined && typeof it[k] !== 'string') throw new Error('invalid saved project metadata');
    for (const k of ['title', 'subtitle', 'text']) if (it.notebook[k] !== undefined && typeof it.notebook[k] !== 'string') throw new Error('invalid saved notebook');
  }
  return c;
}
/** readCollection(storage) → { c } (null when nothing is stored) or { why } */
export function readCollection(storage) {
  let t; try { t = storage.getItem(PJ_KEY); } catch (e) { return { why: String(e && e.message || e) }; }
  if (t === null) return { c: null };
  try { return { c: validateProjectCollection(JSON.parse(t)) }; } catch (e) { return { why: e.message }; }
}

/* the ids a collection's items wear in the kit: their own f<n> when valid and unique, else the next free one, in stored order */
function idsOf(items) {
  const own = new Set(); let max = 0;
  const ids = items.map((it) => { const m = /^f(\d+)$/.exec(isObj(it) && typeof it.id === 'string' ? it.id : ''); if (!m || own.has(it.id)) return null; own.add(it.id); max = Math.max(max, +m[1]); return it.id; });
  return { ids: ids.map((id) => id || 'f' + (++max)), max };
}
/** toFiles(c) → the kit's library envelope for a valid collection (files.js createFiles reads it as its own) */
export function toFiles(c) {
  const items = Object.values(c.items), { ids, max } = idsOf(items), done = [];
  const entries = items.map((it, i) => {
    const folder = normalizeFolder(typeof it.folder === 'string' ? it.folder : parent(it.path)), own = typeof it.name === 'string' && it.name ? it.name : leaf(it.path);
    const e = { id: ids[i], name: uniqueName(own, folder, done), folder,
      at: Number.isFinite(Date.parse(it.saved)) ? Date.parse(it.saved) : 0, thumb: typeof it.thumb === 'string' ? it.thumb : '',
      facts: isObj(it.facts) ? it.facts : {},
      payload: { parts: { [PART]: { data: it.data, notebook: it.notebook, ...(isObj(it.part) ? it.part : {}) }, ...(isObj(it.parts) ? it.parts : {}) }, ...(isObj(it.payload) ? it.payload : {}) },
      bytes: 0 };
    e.bytes = JSON.stringify(e).length;                                // files.js reprice(), the same arithmetic
    done.push(e);
    return e;
  });
  return { kit: FILES_KIT, formatVersion: FILES_V, seq: Math.max(max, Number.isFinite(c.seq) ? Math.floor(c.seq) : 0, entries.length), entries, folders: isObj(c.folders) ? c.folders : {} };
}
/** fromFiles(env, prev) → λWAVES' collection for the envelope the kit wrote; `prev` (the stored collection) keeps recent and opened */
export function fromFiles(env, prev) {
  const before = prev ? Object.values(prev.items) : [], prevIds = idsOf(before).ids, byId = new Map(before.map((it, i) => [prevIds[i], it]));
  const idOfPath = new Map(before.map((it, i) => [it.path, prevIds[i]])), items = {}, pathOfId = new Map();
  for (const e of env.entries) {
    const P = isObj(e.payload) ? e.payload : {}, parts = isObj(P.parts) ? P.parts : {}, part = isObj(parts[PART]) ? parts[PART] : {};
    const { data, notebook, ...partRest } = part, { [PART]: _own, ...others } = parts, { parts: _p, ...rest } = P, old = byId.get(e.id), path = pathOf(e);
    const it = { path, folder: e.folder, name: e.name, saved: iso(e.at), opened: old && typeof old.opened === 'string' ? old.opened : iso(e.at), data, notebook, id: e.id };
    if (e.thumb) it.thumb = e.thumb;
    if (isObj(e.facts) && Object.keys(e.facts).length) it.facts = e.facts;
    if (Object.keys(partRest).length) it.part = partRest;
    if (Object.keys(others).length) it.parts = others;
    if (Object.keys(rest).length) it.payload = rest;
    put(items, path, it); pathOfId.set(e.id, path);
  }
  const recent = [...new Set((prev && prev.recent || []).map((p) => pathOfId.get(idOfPath.get(p))).filter(Boolean))].slice(0, 8);
  const out = { items, recent, seq: env.seq };
  if (isObj(env.folders) && Object.keys(env.folders).length) out.folders = env.folders;
  return out;
}

/** createProjectStore(storage) — the Storage-shaped translator FOLDERS is handed (createFiles({ storage }), createFolders({ storage })) */
export function createProjectStore(ls = globalThis.localStorage) {
  const refuse = (why) => { throw new Error('the saved projects could not be read (' + why + ') — nothing was written. ' + UNTOUCHED); };
  const view = () => { const r = readCollection(ls); return r.c ? JSON.stringify(toFiles(r.c)) : null; };
  let saw;                                                            // the view of PJ_KEY the kit last read or wrote
  return {
    get length() { return ls.length; }, key: (i) => ls.key(i),
    getItem(k) { return k !== PJ_KEY ? ls.getItem(k) : (saw = view()); },
    setItem(k, v) {
      if (k !== PJ_KEY && !k.startsWith(PJ_KEY + '.refused-')) { ls.setItem(k, v); return; }
      const r = readCollection(ls);
      if (r.why) refuse(r.why);
      if (k !== PJ_KEY) refuse('a set-aside copy is never made here');
      const env = JSON.parse(v), had = new Map(r.c ? toFiles(r.c).entries.map((e) => [e.id, e.bytes]) : []);
      for (const e of env.entries) if (e.bytes > MAX_PROJECT_BYTES && had.get(e.id) !== e.bytes) throw new Error('“' + e.name + '” is larger than a project may be (8 MiB) — nothing was written');
      ls.setItem(PJ_KEY, JSON.stringify(validateProjectCollection(fromFiles(env, r.c))));
      saw = view();
    },
    removeItem(k) { if (k === PJ_KEY) { const why = readCollection(ls).why; if (why) refuse(why); saw = null; } ls.removeItem(k); },
    /** stale() — true when the collection moved since the kit last saw it (a write by another road of this tab: RECENT, a test) */
    stale() { return saw !== undefined && view() !== saw; },
    /** the reason the collection is read-only, or null */
    get refusal() { return readCollection(ls).why || null; },
  };
}

/** touchRecent(storage, path, opened?) → bool — λWAVES' RECENT (8 kept; the FILE menu shows 5) and the item's `opened` stamp,
 *  written straight into the stored collection, outside the kit's envelope (toFiles never reads either, so no view changes) */
export function touchRecent(ls, path, opened) {
  const r = readCollection(ls); if (!r.c || !Object.hasOwn(r.c.items, path)) return false;
  r.c.recent = [path, ...(r.c.recent || []).filter((p) => p !== path)].slice(0, 8);
  if (opened) r.c.items[path].opened = opened;
  try { ls.setItem(PJ_KEY, JSON.stringify(r.c)); return true; } catch (_) { return false; }
}

/** parseProjectFile(text) → { path, folder, name, saved, opened, data, notebook } — a `.lambdawaves.json` checked whole before
 *  anything is stored; experiment and model migration stay restore()'s, when the project opens */
export function parseProjectFile(text) {
  if (typeof text !== 'string') throw new Error('project must be JSON text');
  if (text.length > MAX_PROJECT_BYTES || new TextEncoder().encode(text).length > MAX_PROJECT_BYTES) throw new Error('project file exceeds 8 MiB');
  const o = JSON.parse(text);
  if (!isObj(o) || o.lambdawaves !== 'project' || typeof o.path !== 'string' || !o.path.trim() || !isObj(o.data)) throw new Error('not a λWAVES project');
  if (o.version !== undefined && o.version !== 1) throw new Error('unsupported project version');
  for (const k of ['folder', 'name', 'saved', 'opened']) if (o[k] !== undefined && typeof o[k] !== 'string') throw new Error('invalid project ' + k);
  if (o.notebook !== undefined && !isObj(o.notebook)) throw new Error('invalid project notebook');
  const nb = o.notebook || {};
  for (const k of ['title', 'subtitle', 'text']) if (nb[k] !== undefined && typeof nb[k] !== 'string') throw new Error('invalid project notebook ' + k);
  const path = o.path.trim().replace(/^\/+|\/+$/g, ''), where = splitPath(path);
  return { path, folder: typeof o.folder === 'string' ? normalizeFolder(o.folder) : where.folder, name: o.name || where.name,
    saved: o.saved || new Date().toISOString(), opened: o.opened || '', data: o.data,
    notebook: { title: nb.title ?? (o.name || path), subtitle: nb.subtitle ?? '', text: nb.text ?? '' } };
}
/** the file a stored item exports as: λWAVES' own envelope, its kit bookkeeping (id, picture, facts) left out */
export function projectFileText(it) {
  const { path, folder, name, saved, opened, data, notebook } = it;
  return JSON.stringify({ lambdawaves: 'project', version: 1, path, folder, name, saved, opened, data, notebook }, null, 1);
}

/** the seven bundled demos, FOLDERS' read-only starters in DEMOS; each one's revision is its file's own `saved` stamp */
export const STARTERS = Object.freeze([['wave-dancer', 'WAVE DANCER'], ['water', 'WATER'], ['benzene', 'BENZENE'], ['n2', 'N₂'], ['h2-sigma-u', 'H₂ σu'], ['helium', 'HELIUM'], ['chord', 'CHORD']]
  .map(([file, name]) => Object.freeze({ file, name, folder: 'DEMOS' })));
/** starterOf(spec, text) → a folders/seed.js starter from the demo file's text */
export function starterOf(s, text) {
  const p = parseProjectFile(text);
  return { id: 'demos/' + s.file, name: s.name, folder: s.folder, readOnly: true, revision: p.saved, at: Date.parse(p.saved) || undefined,
    data: { parts: { [PART]: { data: p.data, notebook: p.notebook } } } };
}
