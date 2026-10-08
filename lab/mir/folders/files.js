/* ══════════════════════════════════════════════════════════════════════════
   mir/folders/files.js — THE FILE/FOLDER SYSTEM'S MODEL, PORTABLE.

   FOLDERS' library store.  Harvested AS IT STANDS from BASINS REDUX
   app/mir-plugins/files/files.js (worktree basins-engine-2026-09-12, HEAD
   b7eb63e, read 2026-10-01 evening; md5 0ff7d7f2…), the file the 1.5 plan
   calls the strongest in the SAVE window.  Two additions, nothing rewritten:
     · overwrite(id, input) — SAVE onto the open project in place (same id,
       same name, same folder), through the same commit as every write.
     · A SOUND LIBRARY WITH A BAD RECORD IS REPAIRED, NOT EMPTIED.  The
       envelope is still inspected whole; when only some entries fail, the
       sound ones are kept and the raw text is set aside first, by the same
       `.refused-<time>` path a wholly unreadable library takes — so nothing
       is lost and nothing is thrown.  (Before, one bad entry hid them all.)

   The flagship BASINS gallery's folder law (MANDELBROT APP main, app/library.js
   — "probably one of my greatest ideas", Josh), lifted out of the app so every
   MIR app can carry the same library.  It keeps the laws and drops everything
   Mandelbrot-shaped: what a saved thing IS belongs to the host, which hands this
   model an opaque `payload` and a thumbnail and gets them back unchanged.

   IT IMPORTS NOTHING.  Drop the folder into any app, or into MIR as mir/files/,
   and it runs as it is.

   ═══ THE FOLDER LAW (unchanged from the flagship) ═════════════════════════
     · A FOLDER IS NOT AN OBJECT.  It is a normalized PATH STRING on an entry;
       root is ''.  Empty segments and '.' vanish, '..' walks up one segment
       (never above root), a backslash is a slash (a pasted desktop path does
       what the person meant).  A folder exists exactly while an entry names it
       or names a path below it: removing the last reference removes the folder.
     · Typing a path that does not exist, then saving, CREATES it — the saved
       item is the folder's existence.
     · Names are unique WITHIN a folder, case-insensitively.  A collision gets
       an Obsidian-style numeric suffix ("PIEZO 2"), never an overwrite.
     · Renaming a folder rewrites one prefix on every item below it.  A rename
       onto an existing path MERGES; items that collide are suffixed; a folder
       cannot move inside itself; root cannot be renamed.
     · Removing a folder never loses work: every item under it (descendants
       too) moves to root, suffixed where needed.

   ═══ STORAGE HONESTY (unchanged from the flagship) ════════════════════════
     · One key, a versioned envelope, written whole.
     · The model carries its own cap in characters of stored JSON (default
       2.6 M, about half of Safari's classic 5 MB origin budget), and every
       entry's REAL cost is stored on it.  A write that would exceed the cap is
       REFUSED with the numbers; nothing is ever silently discarded.  The only
       path that deletes to make room is evictOldest({ consent: true }).
     · A stored envelope that fails inspection is REFUSED WHOLE and left on disk
       untouched.  The first write moves it aside under `<key>.refused-<time>`,
       verified by read-back, BEFORE anything can overwrite the key.
   ══════════════════════════════════════════════════════════════════════════ */
import { t, tn } from '../core/i18n.js';   // a reason the user reads (Could not save: {why}) is a whole sentence

export const FILES_V = 1;
export const FILES_KIT = 'MIR files';
export const NAME_MAX = 80;
export const FOLDER_SEGMENT_MAX = 80;
export const FOLDER_MAX = 320;

/** normalizeFolder('a//b/./../c\\d ') → 'a/c/d' */
export function normalizeFolder(value) {
  if (value == null) return '';
  const out = [];
  for (const raw of String(value).replace(/\\/g, '/').split('/')) {
    const s = raw.trim();
    if (!s || s === '.') continue;
    if (s === '..') { out.pop(); continue; }
    out.push(s.slice(0, FOLDER_SEGMENT_MAX));
  }
  return out.join('/').slice(0, FOLDER_MAX);
}

/** true when `folder` is `root` or lies below it */
export const inFolderTree = (folder, root) => folder === root || folder.indexOf(root + '/') === 0;
/** the last segment of a path, '' for root */
export const leafOf = (path) => (path ? path.slice(path.lastIndexOf('/') + 1) : '');

const nameKey = (s) => String(s).toLocaleLowerCase();
const folderOf = (e) => normalizeFolder(e && e.folder);
const clone = (v) => JSON.parse(JSON.stringify(v));

/** The first free name for `wanted` in `folder`, suffixing " 2", " 3" … on collision. */
export function uniqueName(wanted, folder, entries, ignoreId) {
  let first = (typeof wanted === 'string' && wanted.trim()) ? wanted.trim() : 'Untitled';
  first = first.replace(/[\\/]+/g, '-').slice(0, NAME_MAX) || 'Untitled';
  const used = new Set(entries
    .filter((e) => e.id !== ignoreId && folderOf(e) === folder)
    .map((e) => nameKey(e.name)));
  if (!used.has(nameKey(first))) return first;
  const m = /^(.*?)(?:\s+(\d+))?$/.exec(first);
  const base = ((m && m[2]) ? m[1] : first).trim() || 'Untitled';
  let n = (m && m[2]) ? Math.max(2, Number(m[2]) + 1) : 2;
  for (; n < 100000; n++) {
    const suffix = ' ' + n;
    const candidate = base.slice(0, Math.max(1, NAME_MAX - suffix.length)) + suffix;
    if (!used.has(nameKey(candidate))) return candidate;
  }
  return (base.slice(0, 72) + ' ' + Date.now().toString(36)).slice(0, NAME_MAX);
}

/** "Sep 16 14:05" — the flagship's time label */
export function savedAtLabel(at) {
  if (!Number.isFinite(at)) return '';
  const d = new Date(at);
  if (!Number.isFinite(d.getTime())) return '';
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  return mon + ' ' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/** recentRows(files, n = 5, open) → menu rows for the last `n` saved projects, newest first (BASINS shell.js FILE menu):
 *  ['↺  NAME', () => open(id), null, 'FOLDER / NAME' (root: 'ROOT / NAME'), { raw: true }] — a name is never translated.
 *  `files` is a library (createFiles, or FOLDERS' `folders.files`) or a plain list of entries. */
export function recentRows(files, n = 5, open = () => {}) {
  const list = Array.isArray(files) ? files : files && typeof files.entries === 'function' ? files.entries() : [];
  return list.filter((e) => e && e.id).slice().sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, n)
    .map((e) => ['↺  ' + e.name, () => open(e.id, e), null, (e.folder ? e.folder : 'ROOT') + ' / ' + e.name, { raw: true }]);
}

/** one entry passes inspection */
export function entryOk(e) {
  return !!(e && typeof e === 'object' && typeof e.id === 'string' && e.id &&
    typeof e.name === 'string' && typeof e.folder === 'string' &&
    Number.isFinite(e.at) && typeof e.thumb === 'string' &&
    e.payload && typeof e.payload === 'object' &&
    (e.facts == null || typeof e.facts === 'object'));
}

/**
 * createFiles({ key, storage, capChars, defaultName })
 *   key          the localStorage key this library owns (one per app, or per card)
 *   storage      a Storage-shaped object; default globalThis.localStorage
 *   capChars     the cap in characters of stored JSON; default 2 600 000
 *   defaultName  the name proposed at root; default 'UNTITLED'
 */
export function createFiles(opts) {
  const o = opts || {};
  if (typeof o.key !== 'string' || !o.key) throw new Error('createFiles needs a storage key');
  const KEY = o.key;
  const store = o.storage || globalThis.localStorage;
  const ROOT_NAME = (typeof o.defaultName === 'string' && o.defaultName.trim()) ? o.defaultName.trim() : 'UNTITLED';
  let cap = Number.isFinite(o.capChars) && o.capChars > 1000 ? Math.floor(o.capChars) : 2600000;

  const stat = { saves: 0, writes: 0, refusedFull: 0, repaired: 0, lastError: null };
  let lib = null, rawAtLoad = null, refusedRaw = null, refusedKey = null;
  const watchers = new Set();

  const lsGet = (k) => { try { return store.getItem(k); } catch (_) { return null; } };
  const lsSet = (k, v) => store.setItem(k, v);   // deliberately unguarded: callers speak the failure

  function load() {
    if (lib) return lib;
    const raw = lsGet(KEY);
    rawAtLoad = raw;
    let env = null;
    try { env = JSON.parse(raw || 'null'); } catch (_) { env = null; }
    if (env && typeof env === 'object' && env.formatVersion === FILES_V &&
        Array.isArray(env.entries) &&
        (env.folders == null || (typeof env.folders === 'object' && !Array.isArray(env.folders)))) {
      const sound = env.entries.filter(entryOk);
      if (sound.length !== env.entries.length) {
        /* REPAIRED (MIR 1.5): the bad records are skipped, the raw text waits to be set aside by the first write */
        refusedRaw = raw;
        stat.repaired = env.entries.length - sound.length;
        stat.lastError = tn(stat.repaired, '{n} unreadable record was skipped — the library as it was is kept, and the first save moves it to {key} before writing',
          '{n} unreadable records were skipped — the library as it was is kept, and the first save moves it to {key} before writing', { key: KEY + '.refused-<time>' });
      }
      const seqFloor = sound.reduce((m, e) => { const n = /^f(\d+)$/.exec(e.id); return n ? Math.max(m, +n[1]) : m; }, 0);
      lib = { kit: FILES_KIT, formatVersion: FILES_V,
              seq: Math.max(seqFloor, Number.isFinite(env.seq) ? Math.floor(env.seq) : env.entries.length),
              entries: sound, folders: {} };
      /* FOLDER PICTURES (the flagship's SET AS FOLDER PICTURE).  Optional in the envelope, so a library written
         before them reads exactly as it did; a record is { pictureId } and nothing else is kept. */
      for (const [k, v] of Object.entries(env.folders || {})) {
        const path = normalizeFolder(k);
        if (path && v && typeof v.pictureId === 'string') lib.folders[path] = { pictureId: v.pictureId };
      }
      for (const e of lib.entries) e.folder = normalizeFolder(e.folder);
    } else {
      if (raw != null) {
        refusedRaw = raw;
        stat.lastError = t('the stored library could not be read — it is left in place, and the first save moves it to {key} before starting a fresh one', { key: KEY + '.refused-<time>' });
      }
      lib = { kit: FILES_KIT, formatVersion: FILES_V, seq: 0, entries: [], folders: {} };
    }
    return lib;
  }
  const serialized = () => JSON.stringify(load());

  function setAsideRefused() {
    const raw = refusedRaw;
    let key = null;
    try {
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && k.indexOf(KEY + '.refused-') === 0 && lsGet(k) === raw) { key = k; break; }
      }
    } catch (_) {}
    if (!key) {
      key = KEY + '.refused-' + Date.now();
      lsSet(key, raw);
      if (lsGet(key) !== raw) throw new Error('could not set the unreadable library aside — nothing was overwritten');
    }
    refusedKey = key; refusedRaw = null;
    stat.lastError = 'the stored library was unreadable — set aside untouched at "' + key + '"';
  }
  function persist() {
    if (refusedRaw != null) setAsideRefused();
    const raw = serialized();
    lsSet(KEY, raw);
    rawAtLoad = raw;
    stat.writes++;
  }
  const reprice = (e) => { e.bytes = 0; e.bytes = JSON.stringify(e).length; return e; };
  const notify = (what) => { for (const fn of watchers) { try { fn(what); } catch (_) {} } };

  /** apply `edit` to the live list; refuse and roll back whole on the cap or the quota */
  function commit(edit, what) {
    // Another tab may have written since this instance last read the library.
    // Refresh before assigning ids or names so a stale tab cannot replace its work.
    if (lib && lsGet(KEY) !== rawAtLoad) { lib = null; refusedRaw = null; }
    const L = load();
    const before = L.entries.map(clone), seqBefore = L.seq, foldersBefore = clone(L.folders || {});
    const charsBefore = serialized().length;
    const undo = () => { L.entries = before; L.seq = seqBefore; L.folders = foldersBefore; };
    const r = edit(L);
    if (r && r.ok === false) { undo(); return r; }
    const chars = serialized().length;
    /* THE CAP REFUSES GROWTH, NEVER A WRITE THAT SHRINKS (2026-09-18 audit B1).  A library already over its cap — the
       cap was lowered, or an older build wrote more — used to refuse the very delete that would bring it back under. */
    if (chars > cap && chars > charsBefore) {
      undo();
      stat.refusedFull++;
      return { ok: false, full: true, needChars: chars, capChars: cap, count: before.length,
               oldestName: before.length ? before[0].name : null,
               why: t('the library is full: {need} k needed of {cap} k', { need: Math.round(chars / 1e3), cap: Math.round(cap / 1e3) }) };
    }
    // If a second tab wrote during this edit, refuse this write. The next
    // attempt will reload its version and can safely apply the edit there.
    if (lsGet(KEY) !== rawAtLoad) {
      undo(); lib = null; refusedRaw = null;
      notify('reload');
      return { ok: false, conflict: true, why: 'the gallery changed in another tab — try again' };
    }
    try { persist(); } catch (err) {
      undo();
      stat.lastError = t('the browser refused the write: {why}', { why: String((err && err.message) || err) });
      return { ok: false, quota: true, why: stat.lastError };
    }
    notify(what);
    return Object.assign({ ok: true, chars }, r || {});
  }

  /** Unmoved items keep their names; moved items arrive in shelf order and are suffixed. */
  function settleMovedNames(entries, movedIds) {
    const settled = entries.filter((e) => !movedIds.has(e.id));
    const renamed = [];
    for (const e of entries) {
      if (!movedIds.has(e.id)) continue;
      const was = e.name;
      e.name = uniqueName(e.name, folderOf(e), settled, e.id);
      reprice(e);
      settled.push(e);
      if (e.name !== was) renamed.push({ id: e.id, from: was, to: e.name });
    }
    return renamed;
  }

  const api = {
    key: KEY,
    cap: () => cap,
    setCap(n) { if (Number.isFinite(n) && n > 1000) cap = Math.floor(n); return cap; },
    chars: () => (lib ? serialized().length : (lsGet(KEY) || '').length),
    entries: () => load().entries.map(clone),
    entry: (id) => { const e = load().entries.find((x) => x.id === String(id)); return e ? clone(e) : null; },
    /** every path that exists, implied parents included, in natural order */
    folders() {
      const found = new Set();
      for (const e of load().entries) {
        const bits = folderOf(e).split('/').filter(Boolean);
        for (let i = 1; i <= bits.length; i++) found.add(bits.slice(0, i).join('/'));
      }
      return [...found].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    },
    /** how many entries sit directly in `folder` (deep: true counts the subtree) */
    count(folder, deep) {
      const f = normalizeFolder(folder);
      return load().entries.filter((e) => (deep ? inFolderTree(folderOf(e), f) : folderOf(e) === f)).length;
    },
    /** the name a save into `folder` would get: the folder's own leaf, or the root name, made unique */
    proposedName(folder) {
      const path = normalizeFolder(folder);
      return uniqueName(leafOf(path) || ROOT_NAME, path, load().entries);
    },

    /** save({ name, folder, payload, thumb, facts }) — `payload` is the host's, opaque and JSON-safe */
    save(input) {
      const i = input || {};
      if (!i.payload || typeof i.payload !== 'object') return { ok: false, why: 'nothing to save — the host gave no payload' };
      let entry = null;
      const r = commit((L) => {
        const folder = normalizeFolder(i.folder);
        entry = reprice({
          id: 'f' + (++L.seq),
          name: uniqueName((typeof i.name === 'string' && i.name.trim()) ? i.name : api.proposedName(folder), folder, L.entries),
          folder, at: Number.isFinite(i.at) && i.at > 0 ? Math.floor(i.at) : Date.now(),   // an import (a factory project) keeps its own date
          thumb: typeof i.thumb === 'string' ? i.thumb : '',
          facts: i.facts && typeof i.facts === 'object' ? clone(i.facts) : {},
          payload: clone(i.payload),
          bytes: 0
        });
        L.entries.push(entry);
        return { entry: clone(entry) };
      }, 'save');
      if (r.ok) stat.saves++;
      else if (r.full) Object.assign(r, { name: i.name, folder: i.folder, entryChars: entry ? entry.bytes : 0 });
      return r;
    },
    rename(id, name) {
      if (typeof name !== 'string' || !name.trim()) return { ok: false, why: 'a name cannot be empty' };
      return commit((L) => {
        const e = L.entries.find((x) => x.id === String(id));
        if (!e) return { ok: false, why: 'no such entry' };
        const from = e.name;
        e.name = uniqueName(name, folderOf(e), L.entries, e.id);
        reprice(e);
        return { from, to: e.name, entry: clone(e) };
      }, 'rename');
    },
    /** overwrite(id, { payload, thumb?, facts?, at? }) — SAVE in place (MIR 1.5): the entry keeps its id, name and
     *  folder; its payload, picture and facts are replaced and its time is now.  Refused, nothing touched, on a full
     *  library or a quota, exactly like save(). */
    overwrite(id, input) {
      const i = input || {};
      if (!i.payload || typeof i.payload !== 'object') return { ok: false, why: 'nothing to save — the host gave no payload' };
      const r = commit((L) => {
        const e = L.entries.find((x) => x.id === String(id));
        if (!e) return { ok: false, why: 'no such entry' };
        e.payload = clone(i.payload);
        if (typeof i.thumb === 'string') e.thumb = i.thumb;
        if (i.facts && typeof i.facts === 'object') e.facts = clone(i.facts);
        e.at = Number.isFinite(i.at) && i.at > 0 ? Math.floor(i.at) : Date.now();
        reprice(e);
        return { entry: clone(e) };
      }, 'overwrite');
      if (r.ok) stat.saves++;
      return r;
    },
    /** refresh([{ id, at?, thumb?, payload, facts? }]) — REPLACE bundled entries IN PLACE (1.5.0-alpha.13; BASINS starter-gallery.js):
     *  each keeps its id, name and folder; its picture, payload, facts and time are the new ones.  ALL OR NONE, in one write: a full
     *  library, a quota or another tab's write refuses the lot and leaves the old gallery exactly as it was (seed.js retries it at
     *  the next load).  An id that is not in the library is skipped.  → { ok, updated } */
    refresh(updates) {
      const list = (Array.isArray(updates) ? updates : []).filter((u) => u && u.payload && typeof u.payload === 'object' && api.entry(u.id));
      if (!list.length) return { ok: true, updated: 0 };
      return commit((L) => {
        let updated = 0;
        for (const u of list) {
          const e = L.entries.find((x) => x.id === String(u.id)); if (!e) continue;
          e.payload = clone(u.payload);
          if (typeof u.thumb === 'string') e.thumb = u.thumb;
          if (u.facts && typeof u.facts === 'object') e.facts = clone(u.facts);
          if (Number.isFinite(u.at) && u.at > 0) e.at = Math.floor(u.at);
          reprice(e); updated++;
        }
        return { updated };
      }, 'refresh');
    },
    /** Move one item.  A path that does not exist yet is created by the move. */
    move(id, folder) {
      return commit((L) => {
        const e = L.entries.find((x) => x.id === String(id));
        if (!e) return { ok: false, why: 'no such entry' };
        const from = folderOf(e), to = normalizeFolder(folder);
        if (from === to) return { from, to, unchanged: true, entry: clone(e) };
        e.folder = to;
        e.name = uniqueName(e.name, to, L.entries, e.id);
        reprice(e);
        return { from, to, entry: clone(e) };
      }, 'move');
    },
    remove(id) {
      return commit((L) => {
        const i = L.entries.findIndex((x) => x.id === String(id));
        if (i < 0) return { ok: false, why: 'no such entry' };
        const [gone] = L.entries.splice(i, 1);
        return { removed: { id: gone.id, name: gone.name, folder: gone.folder } };
      }, 'remove');
    },
    /** Rename a folder by rewriting one prefix; onto an existing path it MERGES. */
    renameFolder(fromValue, toValue) {
      const from = normalizeFolder(fromValue), to = normalizeFolder(toValue);
      if (!from) return { ok: false, why: 'the root folder cannot be renamed' };
      if (!to) return { ok: false, why: 'a folder needs a name — REMOVE FOLDER is what moves its contents to ROOT' };
      if (to === from) return { ok: true, from, to, moved: 0, renamed: [] };
      if (to.indexOf(from + '/') === 0) return { ok: false, why: 'a folder cannot be moved inside itself' };
      return commit((L) => {
        const movedIds = new Set();
        for (const e of L.entries) {
          const old = folderOf(e);
          if (!inFolderTree(old, from)) continue;
          const tail = old.slice(from.length).replace(/^\//, '');
          e.folder = normalizeFolder(to + (tail ? '/' + tail : ''));
          movedIds.add(e.id);
        }
        if (!movedIds.size) return { ok: false, why: 'no such folder' };
        const pics = {};
        for (const [path, rec] of Object.entries(L.folders || {})) {
          if (!inFolderTree(path, from)) { if (!pics[path]) pics[path] = rec; continue; }
          const tail = path.slice(from.length).replace(/^\//, '');
          const moved = normalizeFolder(to + (tail ? '/' + tail : ''));
          if (!pics[moved]) pics[moved] = rec;                           // on a merge the folder already there keeps its picture
        }
        L.folders = pics;
        return { from, to, moved: movedIds.size, renamed: settleMovedNames(L.entries, movedIds) };
      }, 'renameFolder');
    },
    /** Remove a folder: everything under it, descendants too, goes to root. */
    deleteFolder(value) {
      const folder = normalizeFolder(value);
      if (!folder) return { ok: false, why: 'the root folder cannot be removed' };
      return commit((L) => {
        const movedIds = new Set();
        for (const e of L.entries) {
          if (!inFolderTree(folderOf(e), folder)) continue;
          e.folder = '';
          movedIds.add(e.id);
        }
        if (!movedIds.size) return { ok: false, why: 'no such folder' };
        for (const path of Object.keys(L.folders || {})) if (inFolderTree(path, folder)) delete L.folders[path];
        return { folder, moved: movedIds.size, renamed: settleMovedNames(L.entries, movedIds), root: true };
      }, 'deleteFolder');
    },
    /** SET AS FOLDER PICTURE: the item must live in the folder or below it. */
    setFolderPicture(folderValue, id) {
      const folder = normalizeFolder(folderValue);
      if (!folder) return { ok: false, why: 'ROOT has no picture' };
      return commit((L) => {
        const e = L.entries.find((x) => x.id === String(id));
        if (!e) return { ok: false, why: t('no such entry') };
        if (!inFolderTree(folderOf(e), folder)) return { ok: false, why: t('that item is not inside {folder}', { folder }) };
        L.folders = L.folders || {};
        L.folders[folder] = { pictureId: e.id };
        return { folder, pictureId: e.id };
      }, 'folderPicture');
    },
    /** the picture a folder shows: its chosen item's thumbnail if that item is still inside, else its newest */
    folderPicture(folderValue) {
      const folder = normalizeFolder(folderValue);
      const L = load();
      const inside = L.entries.filter((e) => inFolderTree(folderOf(e), folder) && e.thumb);
      const rec = L.folders && L.folders[folder];
      const chosen = rec && inside.find((e) => e.id === rec.pictureId);
      if (chosen) return { thumb: chosen.thumb, id: chosen.id, chosen: true };
      const newest = inside.reduce((best, e) => (!best || e.at >= best.at ? e : best), null);   // on a tie the later save wins: entries are in save order
      return newest ? { thumb: newest.thumb, id: newest.id, chosen: false } : null;
    },

    /** saveMakingRoom(input, { consent: true }) — the save AND the evictions it needs, as ONE commit (audit A4).
     *  Evicting one at a time and retrying could delete the whole library for a save that was never going to fit.
     *  Here the entry is priced first (larger than the cap → refused, nothing touched), the oldest are dropped only
     *  until it fits, and if the write still fails the commit rolls every eviction back. */
    saveMakingRoom(input, opts2) {
      if (!opts2 || opts2.consent !== true) return { ok: false, why: 'making room needs explicit consent — nothing was deleted' };
      const i = input || {};
      if (!i.payload || typeof i.payload !== 'object') return { ok: false, why: 'nothing to save — the host gave no payload' };
      let entry = null; const evicted = [];
      const r = commit((L) => {
        const folder = normalizeFolder(i.folder);
        entry = reprice({ id: 'f' + (++L.seq), name: 'x', folder, at: Date.now(), thumb: typeof i.thumb === 'string' ? i.thumb : '',
                          facts: i.facts && typeof i.facts === 'object' ? clone(i.facts) : {}, payload: clone(i.payload), bytes: 0 });
        if (entry.bytes + NAME_MAX + 400 > cap) return { ok: false, tooBig: true, entryChars: entry.bytes, capChars: cap,
          why: 'this project alone (' + Math.round(entry.bytes / 1e3) + ' k) is larger than the whole library (' + Math.round(cap / 1e3) + ' k) — nothing was deleted' };
        let total = JSON.stringify(L).length + entry.bytes + NAME_MAX + 8;
        while (total > cap && L.entries.length) { const gone = L.entries.shift(); evicted.push({ id: gone.id, name: gone.name }); total -= (gone.bytes || JSON.stringify(gone).length) + 1; }
        entry.name = uniqueName((typeof i.name === 'string' && i.name.trim()) ? i.name : api.proposedName(folder), folder, L.entries);
        reprice(entry);
        L.entries.push(entry);
        return { entry: clone(entry), evicted };
      }, 'save');
      if (r.ok) stat.saves++;
      return r;
    },

    /** Oldest-first eviction, ONLY behind explicit consent. */
    evictOldest(opts2) {
      if (!opts2 || opts2.consent !== true) return { ok: false, why: 'eviction needs explicit consent — nothing was deleted' };
      const want = Math.max(1, opts2.count | 0);
      return commit((L) => {
        const gone = L.entries.splice(0, Math.min(want, L.entries.length));
        return { removed: gone.map((e) => ({ id: e.id, name: e.name })) };
      }, 'evict');
    },

    state() {
      const L = load();
      return { key: KEY, formatVersion: FILES_V, count: L.entries.length, chars: serialized().length, cap,
               folders: api.folders(), refusedPending: refusedRaw != null, refusedKey,
               lastError: stat.lastError, stat: { ...stat } };
    },
    /** subscribe(fn(what)) → unsubscribe; fires after every successful write */
    subscribe(fn) { watchers.add(fn); return () => watchers.delete(fn); },
    /** drop the cached envelope so the next read goes to storage (another tab wrote it) */
    reload() { lib = null; rawAtLoad = null; refusedRaw = null; notify('reload'); }
  };
  return api;
}

export default createFiles;
