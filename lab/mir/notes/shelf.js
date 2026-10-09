/* MIR · notes/shelf.js — THE SHELF: your own notes, kept in this browser, apart from every project (pure: no DOM).
 *
 * Josh, 2026-10-01: "the lambdawaves save feature should be how notes can be saved and loaded, separate from the
 * folder's feature."  So this is λWAVES' mini file system (rack.js `projects`, project-storage.js, 0.3.2) lifted as
 * the notebook's own.  FOLDERS saves projects through its own store; the shelf has its own key and never reads
 * FOLDERS' store, and FOLDERS never reads this one.  A note is a page — { title, md } — the same thing a project
 * carries (shell/pages.js); a page moves between the two by COPY, never by link.
 *
 * THE STORAGE SHAPE (λWAVES', kept): one key holding
 *     { items: { [path]: { path, folder, name, saved, opened, title, md } }, recent: [path, …] }
 * A path is `folder/name`; folders are only path prefixes ("a/b/name" lives in folder "a/b").  `saved` and
 * `opened` are ISO strings.  λWAVES kept `data` (the experiment) and `notebook{title,subtitle,text}`; a note has no
 * experiment, and its page is stored flat as `title` + `md`.
 *
 * WHAT CHANGED FROM λWAVES, AND WHY
 *   · recent holds five, not eight: λWAVES stored eight and only ever showed five.
 *   · rename(from, to) and remove() exist as verbs a face can confirm (λWAVES had no rename; × deleted at once).
 *   · A CORRUPT STORE IS REPAIRED, NOT THROWN.  λWAVES refused to touch a bad store (and so the PROJECTS face went
 *     dead until someone fixed localStorage by hand).  Here the raw text is first copied, untouched, to
 *     `<key>.corrupt` — so nothing is lost — then every record that is still sound is kept and the rest dropped.
 *     `repaired` says what happened, so the face can tell the user.
 *   · Export and import are a note as a plain .md file (shell/pages.js pageFile / pageFromFile): it opens in
 *     Obsidian unchanged.  λWAVES exported a project as JSON.
 *   · A path is cleaned (no leading/trailing or doubled slashes, no control characters); "__proto__" is an
 *     ordinary name (records are own properties of a null-prototype object while in memory).
 *
 * createShelf({ storage, key, now }) → { key, list, folders, recent, get, has, save, open, rename, remove, freePath,
 *                                        exportNote, importNote, repaired, error, subscribe }
 *   storage   anything with getItem / setItem (default: localStorage; a node test hands a Map-backed one)
 *   key       the storage key (default 'mir.notes')
 *   now       () => ISO string (default: the clock), for tests
 * Every write returns its result or null/false; `error` holds the last failure's words (a full quota, say). */
import { pageFile, pageFromFile } from '../shell/pages.js';
import { t } from '../core/i18n.js';

export const RECENT = 5;
const str = (v) => typeof v === 'string';
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** normPath(p) → 'folder/sub/name' cleaned, or '' */
export function normPath(p) {
  return String(p ?? '').replace(/[\u0000-\u001f\\]/g, ' ').split('/').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean).join('/');
}
/** splitPath(path) → { folder, name } */
export function splitPath(path) { const i = path.lastIndexOf('/'); return { folder: i < 0 ? '' : path.slice(0, i), name: i < 0 ? path : path.slice(i + 1) }; }

/** repair(raw) → { col, dropped, broken }: whatever can be kept from a stored text.  Pure. */
export function repair(raw) {
  const empty = () => ({ items: Object.create(null), recent: [] });
  if (raw === null || raw === undefined) return { col: empty(), dropped: 0, broken: false };
  let o; try { o = JSON.parse(raw); } catch (_) { return { col: empty(), dropped: 0, broken: true }; }
  if (!isObj(o)) return { col: empty(), dropped: 0, broken: true };
  const col = empty(); let dropped = 0, broken = !isObj(o.items) || (o.recent !== undefined && !Array.isArray(o.recent));
  for (const [k, it] of Object.entries(isObj(o.items) ? o.items : {})) {
    const path = isObj(it) && str(it.path) ? normPath(it.path) : '';
    const okMeta = isObj(it) && ['folder', 'name', 'saved', 'opened', 'title', 'md'].every((f) => it[f] === undefined || str(it[f]));
    if (!path || !okMeta || path !== k) { dropped++; continue; }
    const { folder, name } = splitPath(path);
    col.items[path] = { path, folder, name, saved: it.saved || '', opened: it.opened || '', title: it.title ?? name, md: it.md ?? '' };
  }
  col.recent = (Array.isArray(o.recent) ? o.recent : []).filter((p) => str(p) && col.items[p]).slice(0, RECENT);
  if (dropped) broken = true;
  return { col, dropped, broken };
}

export function createShelf({ storage = globalThis.localStorage, key = 'mir.notes', now = () => new Date().toISOString() } = {}) {
  const watchers = new Set();
  const tell = (what, path) => { for (const fn of watchers) { try { fn(what, path); } catch (_) {} } };
  let error = '', repaired = null;

  const read = () => {
    let raw = null; try { raw = storage.getItem(key); } catch (e) { error = t('the shelf cannot be read — {why}', { why: e.message }); }
    const r = repair(raw);
    if (r.broken) {                                                  // keep the bad text whole, then mend
      const backup = key + '.corrupt';
      try { storage.setItem(backup, raw); } catch (_) {}
      try { storage.setItem(key, JSON.stringify(r.col)); } catch (_) {}
      repaired = { backup, dropped: r.dropped, kept: Object.keys(r.col.items).length };
      tell('repair', null);
    }
    return r.col;
  };
  const write = (col) => { try { storage.setItem(key, JSON.stringify(col)); error = ''; return true; } catch (e) { error = t('the shelf could not be saved — {why}', { why: e.message }); return false; } };
  const touch = (col, path) => { col.recent = [path, ...col.recent.filter((p) => p !== path)].slice(0, RECENT); };
  const row = (it) => ({ path: it.path, folder: it.folder, name: it.name, title: it.title, saved: it.saved, opened: it.opened });
  const has = (path) => { path = normPath(path); return !!path && !!read().items[path]; };

  const api = {
    key,
    /** list() → every note's metadata, newest save first */
    list: () => Object.values(read().items).sort((a, b) => (b.saved || '').localeCompare(a.saved || '') || a.path.localeCompare(b.path)).map(row),
    /** folders() → the folder names in use, sorted ('' is the root, listed when a note lives there) */
    folders: () => [...new Set(Object.values(read().items).map((it) => it.folder))].sort((a, b) => a.localeCompare(b)),
    /** recent() → up to five paths, most recently saved or opened first */
    recent: () => read().recent.slice(0, RECENT),
    /** get(path) → { title, md } or null */
    get(path) { const it = read().items[normPath(path)]; return it ? { title: it.title, md: it.md } : null; },
    has,
    /** save(path, { title, md }) → the cleaned path, or null.  An existing note keeps its `opened`. */
    save(path, page = {}) {
      path = normPath(path); if (!path) { error = 'give it a name: folder/name'; return null; }
      const col = read(), t = now(), { folder, name } = splitPath(path), was = col.items[path];
      col.items[path] = { path, folder, name, saved: t, opened: was ? was.opened : t, title: String(page.title ?? name), md: String(page.md ?? '') };
      touch(col, path);
      if (!write(col)) return null;
      tell('save', path); return path;
    },
    /** open(path) → { title, md } and marks it opened (recent), or null */
    open(path) {
      path = normPath(path); const col = read(), it = col.items[path]; if (!it) return null;
      it.opened = now(); touch(col, path); write(col);               // a failed recent write still opens the note
      tell('open', path); return { title: it.title, md: it.md };
    },
    /** rename(from, to) → the new path, or null (no such note, an empty name, or `to` already taken) */
    rename(from, to) {
      from = normPath(from); to = normPath(to); const col = read(), it = col.items[from];
      if (!it || !to) { error = it ? t('give it a name') : t('no such note'); return null; }
      if (to === from) return to;
      if (col.items[to]) { error = t('{name} already exists', { name: to }); return null; }
      const { folder, name } = splitPath(to);
      delete col.items[from];
      col.items[to] = { ...it, path: to, folder, name };
      col.recent = col.recent.map((p) => (p === from ? to : p));
      if (!write(col)) return null;
      tell('rename', to); return to;
    },
    /** remove(path) → true if a note was deleted.  The confirm belongs to the face. */
    remove(path) {
      path = normPath(path); const col = read(); if (!col.items[path]) return false;
      delete col.items[path]; col.recent = col.recent.filter((p) => p !== path);
      if (!write(col)) return false;
      tell('remove', path); return true;
    },
    /** freePath(path) → path itself if free, else 'path 2', 'path 3' … */
    freePath(path) {
      path = normPath(path) || 'Untitled'; const items = read().items; if (!items[path]) return path;
      for (let i = 2; ; i++) if (!items[path + ' ' + i]) return path + ' ' + i;
    },
    /** exportNote(path) → { name, text }: the note as a .md file, or null */
    exportNote(path) { const p = api.get(path); return p ? pageFile(p) : null; },
    /** importNote(fileName, text, folder?) → the new note's path (never overwrites: a taken name gets a number) */
    importNote(fileName, text, folder = '') {
      const page = pageFromFile(fileName, text);
      return api.save(api.freePath((normPath(folder) ? normPath(folder) + '/' : '') + page.title), page);
    },
    get repaired() { return repaired; },
    get error() { return error; },
    /** subscribe(fn(what, path)) → off.  what: save · open · rename · remove · repair */
    subscribe(fn) { watchers.add(fn); return () => watchers.delete(fn); },
  };
  read();                                                            // a broken store is mended at once, not at first use
  return api;
}
