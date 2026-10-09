/* lab/projects.js — PROJECTS ARE MIR's FOLDERS (0.5.0 C6): the kit's window, gallery and store over λWAVES' ONE project part,
 * and λWAVES' `projects` verbs kept on top of it, name for name (the __LW law: tests, tools and the menus call them).
 *
 * ONE PART (R5-A3).  rack.js registers `lambdawaves` — { capture, restore, signature } over projectSnapshot() / restore() /
 * projectKey(), with the notebook as the project's page 0 — in the kit's shared registry (core/project.js).  FOLDERS' capture is
 * the kit's default over that one part; nothing registers a second.
 * THE STORE is lab/project-store.js' translator: `lambdawaves.q0.projects` stays in λWAVES' own form, and an invalid one is
 * read-only (R10 a).  The demos are FOLDERS' read-only starters in DEMOS (folders/seed.js), fetched once a boot.
 *
 * ONE ROAD FOR EVERY OPEN, `openPayload`: the M5b snapshot (serialize()), the part's restore, a roll-back when it did not take,
 * then the bookkeeping — rack.js' `opened(label)` (the notebook landing, R-I3: an open never closes the notebook and opens it
 * only for text; the ring's origin row), `current`, RECENT and the line with D9's notice.  The facade's verbs run it
 * synchronously with λWAVES' roll-back; FOLDERS' gallery runs it without (the kit's openWithRollback puts its own capture back).
 * ONE UNSAVED MARK, FOLDERS' (`dirty`, `markClean`).  After a facade open, save or NEW, FOLDERS is told (openEntry / fresh,
 * forced, the restore skipped) so its `current`, its tile mark and its SAVE follow; while it is told, its signature reads the
 * facade's clean mark, so nothing done in between is marked clean by the telling.
 * THE VOICE is the kit's toast (BASINS'); `status` keeps the last line, the words the suites read.
 *
 * createProjects(port) → the facade: list recent current dirty markClean discard requestOpen requestFresh save open remove
 *   fresh exportText importText · demo(file) (a DEMOS press) · download() (EXPORT .json) · pick() (IMPORT) · seed() · status · folders
 *   port { host, part, snapshot(), rollback(S) → bool, busy(±1), opened(label), notice() → D9's line, thumbnail(), confirm(text),
 *          rack, onMoved(rect), titleAfterSave(name) → bool } */
import { createFolders, FOLDERS_ACTIONS, toThumb } from './mir/folders/folders.js';
import { createFiles } from './mir/folders/files.js';
import { registerProjectPart, restoreProject, projectSignature } from './mir/core/project.js';
import { saveBlob } from './mir/folders/save-blob.js';
import { notice } from './mir/shell/notice.js';
import { PJ_KEY, PART, MAX_PROJECT_BYTES, MAX_LIBRARY_CHARS, UNTOUCHED, pathOf, splitPath, readCollection, createProjectStore, touchRecent,
  parseProjectFile, projectFileText, STARTERS, starterOf } from './project-store.js';

export function createProjects(port) {
  const ls = globalThis.localStorage, store = createProjectStore(ls);
  registerProjectPart(PART, port.part);
  let currentId = null, status = '', echo = null, hush = 0, pinned = null, cleanAt = null;
  const told = new Set(), skips = [];
  const toast = (line, warn) => notice(line, { kind: warn ? 'warn' : 'ok', ms: warn ? 5000 : 3200 });
  const pjStatus = (line, warn) => { status = line; toast(line, warn); };
  /* an unreadable collection says so ONCE per reason: list() and recent() read it on every FILE menu */
  const unavailable = (why) => { status = 'projects unavailable — ' + why + '. ' + UNTOUCHED; if (!told.has(why)) { told.add(why); toast(status, true); } };
  const valueOf = (payload) => (payload && payload.parts && payload.parts[PART]) || null;
  const payloadOf = (value) => ({ parts: { [PART]: value } });
  const ro = (e) => !!(e && e.facts && e.facts.readOnly);

  /* ── THE STORE: FOLDERS' library over the translator, 24 MiB the whole (R10 b) ── */
  const files = createFiles({ key: PJ_KEY, storage: store, defaultName: 'UNTITLED', capChars: MAX_LIBRARY_CHARS });
  /* A PICTURE NEVER BRINGS BACK AN OLDER PAYLOAD.  FOLDERS stamps an opened entry with its picture after an await (onOpened:
     overwrite with the payload and `at` it opened); a SAVE in between moved the entry on.  A write naming an `at` the entry no
     longer has keeps the newer payload and takes only the picture, when it has none. */
  const overwrite = files.overwrite;
  files.overwrite = (id, input) => {
    const e = files.entry(id);
    if (!e || !input || !Number.isFinite(input.at) || input.at === e.at) return overwrite(id, input);
    return e.thumb || !input.thumb ? { ok: true, entry: e, stale: true } : overwrite(id, { payload: e.payload, thumb: input.thumb, facts: e.facts, at: e.at });
  };
  /* a write by another road of this tab (RECENT, a test) — the kit caches its library, so it reads it again */
  const sync = () => { if (store.stale()) files.reload(); };
  const entryAt = (path) => { const { folder, name } = splitPath(path); return files.entries().find((e) => e.folder === folder && e.name === name) || null; };

  /* ── THE UNSAVED MARK: every FOLDERS view, one signature ── */
  const markViews = () => { for (const v of folders.views) v.markClean(); };
  const markAt = (sig) => { pinned = sig; try { markViews(); } finally { pinned = null; } };
  const markClean = () => markAt(cleanAt = projectSignature());
  const dirty = () => { const d = folders.dirty(); return d.known && d.dirty; };
  const discard = (action) => !dirty() || port.confirm(action + ' WITHOUT SAVING?\nYour unsaved project changes will be lost. Cancel to save them first.');
  /* FOLDERS learns what the facade did: the same entry open (or NEW), its restore skipped for this one call.  Its own markClean
     then reads what is on screen a few microtasks later, so the facade's clean mark is put back when the telling ends */
  function tell(id) {
    const tk = { id }; skips.push(tk); hush++;
    Promise.resolve(id === 'new' ? folders.fresh({ force: true }) : folders.openEntry(id, { force: true })).catch(() => null)
      .finally(() => { const i = skips.indexOf(tk); if (i >= 0) skips.splice(i, 1); if (--hush === 0 && cleanAt !== null) markAt(cleanAt); });
  }
  const skipped = (id) => { const tk = skips.find((t) => t.id === id && !t.used); if (tk) tk.used = true; return !!tk; };

  /* ── THE OPEN ROAD ── */
  function openPayload(value, meta, rollback) {
    const before = rollback ? port.snapshot() : null, wasClean = rollback && folders.dirty().known && !dirty();
    let ok = false, back = true;
    port.busy(1);
    try {
      try { ok = !!value && port.part.restore(value, { name: meta.name }) === true; } catch (_) { ok = false; }
      if (!ok && rollback) { try { back = port.rollback(before) === true; } catch (_) { back = false; } }
    } finally { port.busy(-1); }
    if (!ok) {
      if (!rollback) return false;
      if (back) { if (wasClean) markClean(); pjStatus(meta.failed + ' — the previous state is back', true); }
      else { currentId = null; pjStatus(meta.failed + ' — the previous state could not be put back; nothing is current, SAVE AS to keep this', true); }
      return false;
    }
    currentId = meta.id || null;
    const remembered = meta.path ? touchRecent(ls, meta.path, new Date().toISOString()) : true, gone = port.notice();
    const line = meta.say + (remembered ? '' : ' — recent history could not be saved') + (gone ? ' · ' + gone : '');
    pjStatus(line, !!gone);
    echo = !rollback && gone ? line : null;                     // the gallery's "Opened —" toast follows; D9's line is said once more after it
    markClean();
    port.opened(meta.label);
    return true;
  }
  const metaOf = (e) => ({ id: e.id, path: pathOf(e), name: e.name, label: 'open · ' + e.name, failed: 'open failed ' + pathOf(e), say: 'opened ' + pathOf(e) });
  const NEW_META = (file) => ({ name: file.name, label: 'new project', failed: 'new project failed', say: 'new' });
  async function fetchNew() {
    const r = await fetch('./new-project.lambdawaves.json', { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status);
    return parseProjectFile(await r.text());
  }

  /* ── FOLDERS: the kit's window over the translator and the one part ── */
  const folders = createFolders({
    host: port.host, id: 'folders', title: 'FOLDERS', store: PJ_KEY, storage: store, files, app: PART, defaultName: 'UNTITLED',
    actions: FOLDERS_ACTIONS, rack: port.rack, onMoved: port.onMoved,
    zip: { validate: (p) => !!valueOf(p) },                       // a project ZIP is taken only when it carries λWAVES' part
    say: (text, warn) => { if (!hush) toast(text, warn); },
    adapter: {
      restore(payload, entry) {
        if (!entry) return restoreProject(payload && payload.parts, {});         // the kit's roll-back: the part, nothing else
        if (skipped(entry.id)) return true;
        return openPayload(valueOf(payload), metaOf(entry), false) || { ok: false, why: 'the project did not take' };
      },
      async empty() {
        if (skipped('new')) return 'new';
        let file; try { file = await fetchNew(); } catch (e) { pjStatus('new project failed — ' + e.message + '; nothing was changed', true); return { ok: false, why: e.message }; }
        return openPayload({ data: file.data, notebook: file.notebook }, NEW_META(file), false) ? undefined : { ok: false, why: 'the empty project did not take' };
      },
      signature: () => (pinned !== null ? pinned : projectSignature()),
      /* A PICTURE IS TAKEN WHERE IT IS SEEN: while FOLDERS is open.  The first one runs capture's readability probe (a video and
         400 ms of MediaRecorder), which a Ctrl+S or a test's open must not pay for behind the window that shows nothing */
      thumbnail: () => (folders.isOpen() ? port.thumbnail() : null),
    },
    /* …and FOLDERS opened over the current project, clean and still without one, takes it then */
    onOpen: () => { const e = currentId && files.entry(currentId); if (e && !e.thumb && !dirty()) Promise.resolve(port.thumbnail()).then(toThumb)
      .then((thumb) => { if (thumb) files.overwrite(e.id, { payload: e.payload, thumb, facts: e.facts, at: e.at }); }).catch(() => {}); },
    onOpened: () => { if (echo) { toast(echo, true); echo = null; } },
    /* FOLDERS' own SAVE / SAVE AS: an untitled notebook takes the project's name, in the file too (λWAVES' save always did) */
    onSaved: (e) => {
      currentId = e.id; touchRecent(ls, pathOf(e)); status = 'saved ' + pathOf(e);
      const v = valueOf(e.payload);
      if (port.titleAfterSave(e.name) && v) files.overwrite(e.id, { payload: payloadOf({ ...v, notebook: { ...v.notebook, title: e.name } }), thumb: e.thumb, facts: e.facts, at: e.at });
      markClean();
    },
  });
  /* THE DOORS a λWAVES file comes in by (the kit's intake takes only its own envelopes): a drop on the window, OPEN FILE, IMPORT.
     8 MiB a project file on every one of them (R10 b; a picture is capped by the project it carries, at the store); a .mir or a
     picture goes on to the kit's intake, which refuses another app's project with the reason. */
  const kitIngest = folders.intake.ingest;
  const isJson = (f) => /\.json$/i.test(f.name || '') || f.type === 'application/json';
  const isPng = (f) => /\.png$/i.test(f.name || '') || f.type === 'image/png';
  const tooBig = (f) => !isPng(f) && f.size > MAX_PROJECT_BYTES;
  async function take(f, source) {
    if (tooBig(f)) { pjStatus('import failed: project file exceeds 8 MiB', true); return { ok: false, why: 'project file exceeds 8 MiB' }; }
    if (!isJson(f)) return kitIngest(f, { source });
    const text = await f.text();
    let path;
    try { path = api.importText(text); }
    catch (err) { if (/not a λWAVES project/.test(err.message)) return kitIngest(text, { source, name: f.name }); pjStatus('import failed: ' + err.message, true); return { ok: false, why: err.message }; }
    pjStatus('imported ' + path);
    const e = entryAt(path); if (e) { folders.gallery.go(e.folder); return folders.openEntry(e.id); }
    return { ok: true };
  }
  folders.intake.ingest = (input, o = {}) => (input && typeof input.arrayBuffer === 'function' ? take(input, o.source) : kitIngest(input, o));
  folders.win.root.addEventListener('drop', (ev) => {
    const list = [...((ev.dataTransfer && ev.dataTransfer.files) || [])];
    if (!list.some((f) => isJson(f) || tooBig(f))) return;
    ev.preventDefault(); ev.stopImmediatePropagation(); folders.win.root.removeAttribute('data-prox');
    for (const f of list) take(f, 'drop');
  }, { capture: true });

  const collection = () => { const r = readCollection(ls); if (r.why) unavailable(r.why); return r.c; };
  const starterOfFile = (file) => files.entries().find((e) => e.facts && e.facts.seedId === 'demos/' + file) || null;

  const api = {
    folders, store,
    get status() { return status; },
    list() { const C = collection(); return Object.values(C ? C.items : {}).sort((a, b) => (b.saved || '').localeCompare(a.saved || '')); },
    recent() { const C = collection(); return C ? (C.recent || []).filter((p) => Object.hasOwn(C.items, p)) : []; },
    get current() { const e = currentId && files.entry(currentId); return e ? pathOf(e) : null; },
    get dirty() { return dirty(); },
    markClean,
    discard,   // wave 133: the same question for a link opened over unsaved work (the hashchange road)
    requestOpen(path) { return discard('OPEN') && api.open(path); },
    requestFresh() { return discard('START A NEW PROJECT') ? api.fresh() : Promise.resolve(false); },
    /** save(path) — λWAVES' save: over the entry at that path (the open project's, when none is given), or a new one there.  A
     *  starter is never saved over (it came with the app): its save is the user's own copy beside it */
    save(path) {
      sync();
      path = String(path || api.current || '').trim().replace(/^\/+|\/+$/g, ''); if (!path) return false;
      if (store.refusal) { unavailable(store.refusal); return false; }
      const { folder, name } = splitPath(path), e = entryAt(path), payload = payloadOf(port.part.capture(name));
      const r = e && !ro(e) ? files.overwrite(e.id, { payload, thumb: e.thumb, facts: e.facts }) : files.save({ name, folder, payload });
      if (!r.ok) { pjStatus('save failed — ' + (r.why || 'unknown'), true); return false; }
      const saved = pathOf(r.entry);
      currentId = r.entry.id; touchRecent(ls, saved); pjStatus('saved ' + saved); port.titleAfterSave(name); markClean(); tell(r.entry.id);
      return true;
    },
    /** open(path, file) — a stored project, or (`file`, parsed) one that is not in the library: NEW's empty project (0.3.1 · S2: it
     *  takes this same road, M5b's roll-back included, stores nothing and leaves nothing current) */
    open(path, file) {
      if (file) { const ok = openPayload({ data: file.data, notebook: file.notebook }, NEW_META(file), true); if (ok) tell('new'); return ok; }
      sync();
      const e = entryAt(String(path || '')); if (!e) return false;
      const ok = openPayload(valueOf(e.payload), metaOf(e), true);
      if (ok) tell(e.id);
      return ok;
    },
    remove(path) {
      sync();
      const e = entryAt(String(path || '')); if (!e) return false;
      const r = files.remove(e.id); if (!r.ok) { pjStatus('save failed — ' + (r.why || 'unknown'), true); return false; }
      if (currentId === e.id) currentId = null;
      return true;
    },
    /* 0.3.1 · S2 NEW OPENS THE EMPTY PROJECT, lab/new-project.lambdawaves.json (tools/new-project.mjs writes it), through open()
       above: restore(…, { project: true }) resets every PROJECT key and the ring, and no PREFERENCE or WORKSPACE key, because the
       file carries none.  A file that cannot be fetched changes nothing. */
    async fresh() {
      let file; try { file = await fetchNew(); } catch (err) { pjStatus('new project failed — ' + err.message + '; nothing was changed', true); return false; }
      return api.open(null, file);
    },
    exportText(path) { const C = collection(), p = path || api.current; return C && p && Object.hasOwn(C.items, p) ? projectFileText(C.items[p]) : null; },
    /** importText(text) → the path it is stored at.  The same project already at its path is that path (a demo re-imported is the
     *  starter); otherwise a new entry, numbered beside one of the same name (the kit never overwrites on an import) */
    importText(text) {
      sync();
      const f = parseProjectFile(text);
      if (store.refusal) throw new Error('saved project collection is invalid; export or recover it before importing');
      const payload = payloadOf({ data: f.data, notebook: f.notebook }), same = entryAt(f.folder ? f.folder + '/' + f.name : f.name);
      if (same && JSON.stringify(same.payload) === JSON.stringify(payload)) { touchRecent(ls, pathOf(same)); return pathOf(same); }
      const r = files.save({ name: f.name, folder: f.folder, payload, at: Date.parse(f.saved) || undefined });
      if (!r.ok) throw new Error('project could not be saved; ' + (r.why || 'browser storage may be full or unavailable'));
      touchRecent(ls, pathOf(r.entry));
      return pathOf(r.entry);
    },
    /** demo(file) — a DEMOS press: the stored open's question first, then the bundled demo (its starter; the file itself when this
     *  browser has none) */
    async demo(file) {
      if (!discard('OPEN')) return false;                       // S2: asked before anything is fetched or stored
      sync();
      let path = starterOfFile(file) ? pathOf(starterOfFile(file)) : null;
      if (!path) {
        try { const r = await fetch('./demos/' + file + '.lambdawaves.json', { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status); path = api.importText(await r.text()); }
        catch (err) { pjStatus('demo failed: ' + err.message, true); return false; }
      }
      const ok = api.open(path); if (ok) pjStatus('opened demo ' + path);   // M5: a failed open keeps its own status
      return ok;
    },
    /** download() — EXPORT: the open project as its `.lambdawaves.json` */
    download() { const t = api.exportText(); if (!t) { pjStatus('nothing to export — save first', true); return false; } saveBlob(new Blob([t], { type: 'application/json' }), (api.current || 'project').replace(/\//g, '__') + '.lambdawaves.json'); return true; },
    /** pick() — IMPORT: a file picker over the same door as a drop */
    pick() { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json,.json,.mir,.png,image/png';
      input.addEventListener('change', () => { for (const f of input.files || []) take(f, 'picker'); }, { once: true }); input.click(); },
    /** seed() — the six demos as FOLDERS' starters, added once (a changed demo file refreshed in place); awaited by the boot.
     *  AN OLDER BUILD'S DEMO PRESS STORED THE DEMO AT ITS PATH: an untouched copy becomes the starter where it stands; an edited one
     *  stays the user's and keeps the path, and that starter waits (no "WATER 2" beside it) */
    async seed() {
      const got = await Promise.allSettled(STARTERS.map(async (s) => { const r = await fetch('./demos/' + s.file + '.lambdawaves.json'); if (!r.ok) throw new Error('HTTP ' + r.status); return starterOf(s, await r.text()); }));
      const list = got.filter((g) => g.status === 'fulfilled').map((g) => g.value);
      if (!list.length || store.refusal) return { ok: false, added: 0 };
      sync();
      let seeded = []; try { seeded = JSON.parse(ls.getItem(PJ_KEY + '.seeded') || '[]'); } catch (_) {}
      const known = new Set([...(Array.isArray(seeded) ? seeded : []), ...files.entries().map((e) => e.facts && e.facts.seedId).filter(Boolean)]);
      const keep = list.filter((s) => {
        const e = known.has(s.id) ? null : entryAt(s.folder + '/' + s.name); if (!e) return true;
        if (JSON.stringify(e.payload) !== JSON.stringify(s.data)) return false;
        files.overwrite(e.id, { payload: e.payload, thumb: e.thumb, facts: { ...e.facts, seedId: s.id, readOnly: true, seedRevision: String(s.revision) }, at: e.at });
        return true;
      });
      return folders.seed(keep);
    },
  };
  if (store.refusal) unavailable(store.refusal);
  return api;
}
