/* MIR · folders/seed.js — STARTER PROJECTS: what an app ships in its gallery (pure: no DOM).
 *
 * BASINS ships JOSH'S LIBRARY and its starters; any app can ship a few.  seed(files, list) adds each starter ONCE:
 *   · a starter is { id?, name, folder, data, thumbnail, readOnly, at?, facts? }; its id (default folder/name) is what
 *     "once" is counted by;
 *   · it is added only if its id is in neither the seeded list (kept under `seededKey` in `storage`) nor the library
 *     (an entry whose facts.seedId is that id).  So a starter the user deleted stays deleted, and a library copied
 *     from another device is not seeded twice;
 *   · NEVER OVER THE USER'S: files.save always makes a new entry, and a name already taken in that folder is suffixed
 *     ("PIEZO 2"), so a project of the user's with the same name is not touched;
 *   · readOnly is kept on the entry (facts.readOnly): FOLDERS will not SAVE over it or rename it (SAVE AS makes the
 *     user's own copy); the user may still delete it.
 * A full library stops the seeding where it is, with the store's own refusal; what was added is remembered.
 *
 * A CHANGED STARTER IS REFRESHED IN PLACE (1.5.0-alpha.13; BASINS starter-gallery.js).  A starter may carry a `revision`
 * (any string or number: bump it when the starter's art or data changes).  The entry made from it records facts.seedRevision;
 * at the next seed, a library entry that came from this starter (facts.seedId is its id) and records another revision (or
 * none: it was seeded before revisions) takes the new picture, payload, facts and date, keeping its id, name, folder and
 * place.  Only a BUNDLED entry is ever touched: a user's save of the same name has no seedId, and SAVE over a starter is
 * refused (readOnly), so it cannot be replaced by accident.  `replaces(entry) → bool` IS the app's own test of which entry is the previous
 * revision when an app's entries predate seedId (BASINS matched its starter id, its source and its date).  All starters refresh in ONE write, all or
 * none: a full library, a quota or another tab's write leaves the gallery as it was, and the next load tries again.
 *
 * seed(files, starters, { storage, seededKey }) → { ok, added, skipped, total, refreshed, refreshFailed?, why?, full? } */

const readList = (storage, key) => { try { const v = JSON.parse(storage.getItem(key) || '[]'); return Array.isArray(v) ? v.map(String) : []; } catch (_) { return []; } };
const writeList = (storage, key, list) => { try { storage.setItem(key, JSON.stringify(list)); return true; } catch (_) { return false; } };
export const seedId = (s) => String(s && s.id != null ? s.id : ((s && s.folder) || '') + '/' + ((s && s.name) || ''));

export function seed(files, starters, { storage = globalThis.localStorage, seededKey = files.key + '.seeded' } = {}) {
  const list = Array.isArray(starters) ? starters : [];
  const done = new Set(readList(storage, seededKey));
  for (const e of files.entries()) if (e.facts && e.facts.seedId) done.add(String(e.facts.seedId));
  let added = 0, skipped = 0;
  for (const s of list) {
    const id = seedId(s);
    if (done.has(id)) { skipped++; continue; }
    if (!s || !s.data || typeof s.data !== 'object') { skipped++; continue; }
    const facts = { ...(s.facts && typeof s.facts === 'object' ? s.facts : {}), seedId: id };
    if (s.readOnly) facts.readOnly = true;
    if (s.revision != null) facts.seedRevision = String(s.revision);
    const r = files.save({ name: s.name, folder: s.folder || '', at: s.at, thumb: typeof s.thumbnail === 'string' ? s.thumbnail : '', payload: s.data, facts });
    if (!r.ok) { writeList(storage, seededKey, [...done]); return { ...r, ok: false, added, skipped, total: list.length }; }
    done.add(id); added++;
  }
  writeList(storage, seededKey, [...done]);
  const out = { ok: true, added, skipped, total: list.length, refreshed: 0 };
  const updates = refreshes(files, list);
  if (updates.length) { const r = files.refresh(updates); if (r.ok) out.refreshed = r.updated; else out.refreshFailed = r; }
  return out;
}

/** refreshes(files, starters) → the in-place updates a changed starter calls for (pure: seed() writes them in one commit) */
export function refreshes(files, starters) {
  const out = [], seen = new Set();
  for (const s of Array.isArray(starters) ? starters : []) {
    if (!s || s.revision == null || !s.data || typeof s.data !== 'object') continue;
    const id = seedId(s), rev = String(s.revision);
    for (const e of files.entries()) {
      if (seen.has(e.id) || !e.facts || String(e.facts.seedRevision ?? '') === rev) continue;
      /* which entry is this starter's previous revision: the app's own test when it gave one (BASINS' entries predate seedId:
         it matched its starter's id, its source and its date), else the entry's seedId */
      if (typeof s.replaces === 'function' ? !s.replaces(e) : String(e.facts.seedId) !== id) continue;
      seen.add(e.id);
      const facts = { ...(s.facts && typeof s.facts === 'object' ? s.facts : {}), seedId: id, seedRevision: rev };
      if (s.readOnly) facts.readOnly = true;
      out.push({ id: e.id, at: s.at, thumb: typeof s.thumbnail === 'string' ? s.thumbnail : '', payload: s.data, facts });
    }
  }
  return out;
}
