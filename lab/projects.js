/* lab/projects.js — PROJECTS ARE MIR's FOLDERS (0.5.0 C6): the kit's window, gallery and store over λWAVES' ONE project part,
 * and λWAVES' `projects` verbs kept on top of it, name for name (the __LW law: tests, tools and the menus call them).
 *
 * ONE PART (R5-A3).  rack.js registers `lambdawaves` — { capture, restore, signature, subscribe } over projectSnapshot() /
 * restore() / projectKey() — in the kit's shared registry (core/project.js).  FOLDERS' capture, signature and subscribe are the
 * kit's defaults over that one part, and so are the session's (core/session.js); nothing registers a second.
 * THE STORE is lab/project-store.js' translator: `lambdawaves.q0.projects` stays in λWAVES' own form, and an invalid one is
 * read-only (R10 a).  The demos are FOLDERS' read-only starters in DEMOS (folders/seed.js), fetched once a boot.
 *
 * ONE ROAD FOR EVERY OPEN, `openPayload`: the M5b snapshot (serialize()), the part's restore, a roll-back when it did not take,
 * then the bookkeeping — rack.js' `opened(label)` (the notebook landing, R-I3: an open never closes the notebook and opens it
 * only for text; the ring's origin row), `current`, RECENT and the line with D9's notice.  The facade's verbs run it
 * synchronously with λWAVES' roll-back; FOLDERS' gallery runs it without (the kit's openWithRollback puts its own capture back).
 * After a facade open, save or NEW, FOLDERS is told (openEntry / fresh, forced, the restore skipped) so its `current`, its
 * tile mark and its clean signature are the facade's: there is ONE unsaved mark, FOLDERS' (`dirty`, `markClean`).
 * THE VOICE is the kit's toast (BASINS'); `status` keeps the last line said through λWAVES' verbs, the words the suites read.
 *
 * createProjects(port) → the facade: list recent current dirty markClean discard requestOpen requestFresh save open remove
 *   fresh exportText importText · demo(file) (a .pj-demo press) · download() (EXPORT .json) · pick() (IMPORT) · status · folders
 *   port { host, part, snapshot(), rollback(S) → bool, busy(±1), opened(label), notice() → D9's line, thumbnail(), confirm(text),
 *          rack, onMoved(rect), titleAfterSave(name) } */
import { createFolders, FOLDERS_ACTIONS } from './mir/folders/folders.js';
import { normalizeFolder } from './mir/folders/files.js';
import { registerProjectPart, restoreProject } from './mir/core/project.js';
import { saveBlob } from './mir/folders/save-blob.js';
import { notice } from './mir/shell/notice.js';
import { PJ_KEY, PART, MAX_PROJECT_BYTES, UNTOUCHED, pathOf, readCollection, createProjectStore, touchRecent, parseProjectFile, projectFileText,
  STARTERS, starterOf } from './project-store.js';

export function createProjects(port) {
  const ls = globalThis.localStorage, store = createProjectStore(ls);
  registerProjectPart(PART, port.part);
  let currentId = null, status = '', skip = null, hush = 0;
  const pjStatus = (line, warn) => { status = line; notice(line, { kind: warn ? 'warn' : 'ok', ms: warn ? 5000 : 3200 }); };
  const unavailable = (why) => pjStatus('projects unavailable — ' + why + '. ' + UNTOUCHED, true);
  const valueOf = (payload) => (payload && payload.parts && payload.parts[PART]) || null;
  const payloadOf = (value) => ({ parts: { [PART]: value } });

  /* ── THE OPEN ROAD ── */
  function openPayload(value, meta, rollback) {
    const before = rollback ? port.snapshot() : null;
    let ok = false, back = true;
    port.busy(1);
    try {
      try { ok = !!value && port.part.restore(value, { name: meta.name }) === true; } catch (_) { ok = false; }
      if (!ok && rollback) { try { back = port.rollback(before) === true; } catch (_) { back = false; } }
    } finally { port.busy(-1); }
    if (!ok) {
      if (!rollback) return false;
      if (back) pjStatus(meta.failed + ' — the previous state is back', true);
      else { currentId = null; pjStatus(meta.failed + ' — the previous state could not be put back; nothing is current, SAVE AS to keep this', true); }
      return false;
    }
    currentId = meta.id || null;
    const remembered = meta.path ? touchRecent(ls, meta.path) : true, gone = port.notice();
    pjStatus(meta.say + (remembered ? '' : ' — recent history could not be saved') + (gone ? ' · ' + gone : ''));
    markClean();
    port.opened(meta.label);
    return true;
  }
  const entryAt = (path) => { const i = path.lastIndexOf('/'), folder = normalizeFolder(i < 0 ? '' : path.slice(0, i)), name = i < 0 ? path : path.slice(i + 1);
    return folders.files.entries().find((e) => e.folder === folder && e.name === name) || null; };
  /* FOLDERS learns what the facade did: the same entry opened (or NEW), clean — its restore skipped for this one call */
  const tell = (id) => { skip = id; hush++; (id === 'new' ? folders.fresh({ force: true }) : folders.openEntry(id, { force: true })).finally(() => { hush--; }); };

  /* ── NEW: the hidden empty project, lab/new-project.lambdawaves.json, through the same road ── */
  async function fetchNew() {
    const r = await fetch('./new-project.lambdawaves.json', { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status);
    return parseProjectFile(await r.text());
  }
  const NEW_META = (file) => ({ name: file.name, label: 'new project', failed: 'new project failed', say: 'new' });

  /* ── FOLDERS: the kit's window over the translator and the one part ── */
  const folders = createFolders({
    host: port.host, id: 'folders', title: 'FOLDERS', store: PJ_KEY, storage: store, app: 'lambdawaves', defaultName: 'UNTITLED',
    actions: FOLDERS_ACTIONS, rack: port.rack, onMoved: port.onMoved,
    say: (text, warn) => { if (!hush) notice(text, { kind: warn ? 'warn' : 'ok', ms: warn ? 5000 : 3200 }); },
    adapter: {
      restore(payload, entry) {
        if (!entry) { const r = restoreProject(payload && payload.parts, {}); return r; }         // the kit's roll-back: the part, nothing else
        if (skip === entry.id) { skip = null; return true; }
        return openPayload(valueOf(payload), { id: entry.id, path: pathOf(entry), name: entry.name, label: 'open · ' + entry.name, failed: 'open failed ' + pathOf(entry), say: 'opened ' + pathOf(entry) }, false)
          || { ok: false, why: 'the project did not take' };
      },
      async empty() {
        if (skip === 'new') { skip = null; return 'new'; }
        let file; try { file = await fetchNew(); } catch (e) { pjStatus('new project failed — ' + e.message + '; nothing was changed', true); return { ok: false, why: e.message }; }
        return openPayload({ data: file.data, notebook: file.notebook }, NEW_META(file), false) ? undefined : { ok: false, why: 'the empty project did not take' };
      },
      thumbnail: port.thumbnail,
    },
    onOpened: (e) => { if (port.notice()) notice(status, { kind: 'warn', ms: 5000 }); },   // D9: the retired window's line outlives the kit's "Opened —"
    onSaved: (e) => { currentId = e.id; touchRecent(ls, pathOf(e)); if (port.titleAfterSave(e.name)) { const v = valueOf(e.payload); if (v) { v.notebook = { ...v.notebook, title: e.name }; folders.files.overwrite(e.id, { payload: e.payload, thumb: e.thumb, facts: e.facts, at: e.at }); } markClean(); } },
  });
  /* THE DOORS a λWAVES file comes in by (the kit's intake takes only its own envelopes): a drop on the window, OPEN FILE, IMPORT.
     8 MiB is the cap on every one of them (R10 b); a .mir or a picture goes on to the kit's intake, which refuses another app's. */
  const kitIngest = folders.intake.ingest;
  const isJson = (f) => /\.json$/i.test(f.name || '') || f.type === 'application/json';
  async function take(f, source) {
    if (f && typeof f.size === 'number' && f.size > MAX_PROJECT_BYTES) { pjStatus('import failed: project file exceeds 8 MiB', true); return { ok: false, why: 'project file exceeds 8 MiB' }; }
    if (!f || !isJson(f)) return kitIngest(f, { source });
    const text = await f.text();
    let path; try { path = api.importText(text); } catch (err) { if (/not a λWAVES project/.test(err.message)) return kitIngest(text, { source, name: f.name }); pjStatus('import failed: ' + err.message, true); return { ok: false, why: err.message }; }
    pjStatus('imported ' + path);
    const e = entryAt(path); if (e) { folders.gallery.go(e.folder); return folders.openEntry(e.id); }
    return { ok: true };
  }
  folders.intake.ingest = (input, o = {}) => (input && typeof input.arrayBuffer === 'function' ? take(input, o.source) : kitIngest(input, o));
  folders.win.root.addEventListener('drop', (ev) => {
    const list = [...((ev.dataTransfer && ev.dataTransfer.files) || [])];
    if (!list.some((f) => isJson(f) || f.size > MAX_PROJECT_BYTES)) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    for (const f of list) take(f, 'drop');
  }, { capture: true });

  const markClean = () => { for (const v of folders.views) v.markClean(); };
  const dirty = () => { const d = folders.dirty(); return d.known && d.dirty; };
  const discard = (action) => !dirty() || port.confirm(action + ' WITHOUT SAVING?\nYour unsaved project changes will be lost. Cancel to save them first.');
  const collection = () => { const r = readCollection(ls); if (r.why) unavailable(r.why); return r.c; };

  const api = {
    folders, store,
    get status() { return status; },
    list() { const C = collection(); return Object.values(C ? C.items : {}).sort((a, b) => (b.saved || '').localeCompare(a.saved || '')); },
    recent() { const C = collection(); return C ? (C.recent || []).filter((p) => Object.hasOwn(C.items, p)) : []; },
    get current() { const e = currentId && folders.files.entry(currentId); return e ? pathOf(e) : null; },
    get dirty() { return dirty(); },
    markClean,
    discard,
    requestOpen(path) { return discard('OPEN') && api.open(path); },
    requestFresh() { return discard('START A NEW PROJECT') ? api.fresh() : Promise.resolve(false); },
    /** save(path) — λWAVES' save: over the entry at that path (the open project's, when none is given), or a new one there */
    save(path) {
      path = String(path || api.current || '').trim().replace(/^\/+|\/+$/g, ''); if (!path) return false;
      if (store.refusal) { unavailable(store.refusal); return false; }
      const i = path.lastIndexOf('/'), folder = i < 0 ? '' : path.slice(0, i), name = i < 0 ? path : path.slice(i + 1);
      const payload = payloadOf(port.part.capture(name)), e = entryAt(path);
      const r = e && !(e.facts && e.facts.readOnly) ? folders.files.overwrite(e.id, { payload, thumb: e.thumb, facts: e.facts }) : folders.files.save({ name, folder, payload });
      if (!r.ok) { pjStatus('save failed — ' + (r.why || 'unknown'), true); return false; }
      const saved = pathOf(r.entry);
      currentId = r.entry.id; touchRecent(ls, saved); pjStatus('saved ' + saved); port.titleAfterSave(name); markClean(); tell(r.entry.id);
      return true;
    },
    /** open(path, file) — a stored project, or (`file`, parsed) one that is not in the library: NEW's empty project */
    open(path, file) {
      if (file) { const ok = openPayload({ data: file.data, notebook: file.notebook }, NEW_META(file), true); if (ok) tell('new'); return ok; }
      const e = entryAt(String(path || '')); if (!e) return false;
      const p = pathOf(e), ok = openPayload(valueOf(e.payload), { id: e.id, path: p, name: e.name, label: 'open · ' + e.name, failed: 'open failed ' + p, say: 'opened ' + p }, true);
      if (ok) tell(e.id);
      return ok;
    },
    remove(path) {
      const e = entryAt(String(path || '')); if (!e) return false;
      const r = folders.files.remove(e.id); if (!r.ok) { pjStatus('save failed — ' + (r.why || 'unknown'), true); return false; }
      if (currentId === e.id) currentId = null;
      return true;
    },
    async fresh() {
      let file; try { file = await fetchNew(); } catch (err) { pjStatus('new project failed — ' + err.message + '; nothing was changed', true); return false; }
      return api.open(null, file);
    },
    exportText(path) { const C = collection(), p = path || api.current; return C && p && Object.hasOwn(C.items, p) ? projectFileText(C.items[p]) : null; },
    /** importText(text) → the path it is stored at.  The same project already at its path is that path (a demo re-imported is the
     *  starter); otherwise a new entry, numbered beside one of the same name (the kit never overwrites) */
    importText(text) {
      const f = parseProjectFile(text);
      if (store.refusal) throw new Error('saved project collection is invalid; export or recover it before importing');
      const payload = payloadOf({ data: f.data, notebook: f.notebook }), same = entryAt(f.folder ? f.folder + '/' + f.name : f.name);
      if (same && JSON.stringify(same.payload) === JSON.stringify(payload)) { touchRecent(ls, pathOf(same)); return pathOf(same); }
      const r = folders.files.save({ name: f.name, folder: f.folder, payload, at: Date.parse(f.saved) || undefined });
      if (!r.ok) throw new Error('project could not be saved; ' + (r.why || 'browser storage may be full or unavailable'));
      touchRecent(ls, pathOf(r.entry));
      return pathOf(r.entry);
    },
    /** demo(file) — what a DEMOS button did: the stored open's question first, then the bundled demo (the seeded starter; the file
     *  itself when this boot could not seed it) */
    async demo(file) {
      if (!discard('OPEN')) return false;
      const s = STARTERS.find((x) => x.file === file);
      let path = s && entryAt(s.folder + '/' + s.name) ? s.folder + '/' + s.name : null;
      if (!path) {
        try { const r = await fetch('./demos/' + file + '.lambdawaves.json', { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status); path = api.importText(await r.text()); }
        catch (err) { pjStatus('demo failed: ' + err.message, true); return false; }
      }
      const ok = api.open(path); if (ok) pjStatus('opened demo ' + path);
      return ok;
    },
    /** download() — EXPORT: the open project as its `.lambdawaves.json` */
    download() { const t = api.exportText(); if (!t) { pjStatus('nothing to export — save first', true); return false; } saveBlob(new Blob([t], { type: 'application/json' }), (api.current || 'project').replace(/\//g, '__') + '.lambdawaves.json'); return true; },
    /** pick() — IMPORT: a file picker over the same door as a drop */
    pick() { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json,.json,.mir,.png,image/png';
      input.addEventListener('change', () => { for (const f of input.files || []) take(f, 'picker'); }, { once: true }); input.click(); },
    /** the six demos, seeded once (a changed demo file refreshed in place); awaited by the boot */
    async seed() {
      const got = await Promise.allSettled(STARTERS.map(async (s) => { const r = await fetch('./demos/' + s.file + '.lambdawaves.json'); if (!r.ok) throw new Error('HTTP ' + r.status); return starterOf(s, await r.text()); }));
      const list = got.filter((g) => g.status === 'fulfilled').map((g) => g.value);
      return list.length ? folders.seed(list) : { ok: false, added: 0 };
    },
  };
  if (store.refusal) unavailable(store.refusal);
  return api;
}
