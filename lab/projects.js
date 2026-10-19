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
 * ITERATION 004 · FOLDERS IS THE PROJECTS HOME, BASINS-shaped (Josh 2026-10-17: "I want BASINS folder system"; the title screen is gone):
 * the DEMOS wear their covers (lab/demos/covers, a 4:3 middle crop, refreshed in place once by the starters' revision), the folder cards
 * the kit's `folder` glyph (not BASINS' Mandelbrot), RESTORE THE DEMOS puts back a deleted demo (the kit's factory foot), the toolbar is
 * BASINS' with λWAVES' SAVE in front (SAVE · PROJECT · DUPLICATE · NEW), ⓘ inspects a project for the RENDER card's SUBJECT, a project
 * save also writes its modulation preset (port.saved), and every door that shows FOLDERS puts the front page away first (port.cover).
 *
 * createProjects(port) → the facade: list recent current dirty markClean discard requestOpen requestFresh save open remove
 *   fresh exportText importText · demo(file) (a DEMOS press) · download() (EXPORT .json) · pick() (IMPORT) · seed() · status · folders
 *   · changed() (the part's subscribe hears it) · resume(session) (the session's RESUME) · show({ folder, name }) · toggle()
 *   · entryOf(path) · inspected (the RENDER card's gallery: the project ⓘ pointed at) · restoreDemos()
 *   port { host, part, snapshot(), rollback(S) → bool, busy(±1), opened(label), notice() → D9's line, thumbnail(), confirm(text),
 *          rack, onMoved(rect), titleAfterSave(name) → bool, cover() → the front page { shown, close } | null, saved(name),
 *          inspect(entry | null, how) } */
import { createFolders, toThumb } from './mir/folders/folders.js';
import { createFiles } from './mir/folders/files.js';
import { registerProjectPart, restoreProject, projectSignature } from './mir/core/project.js';
import { saveBlob } from './mir/folders/save-blob.js';
import { notice } from './mir/shell/notice.js';
import { coalesce } from './frame-coalescer.js';   // 0.5.0 C6b: the part's subscribe, once a frame
import { keepData } from './library.js';   // iteration 005 A: the demo covers are DATA
import { PJ_KEY, PART, MAX_PROJECT_BYTES, MAX_LIBRARY_CHARS, UNTOUCHED, pathOf, splitPath, readCollection, createProjectStore, touchRecent,
  parseProjectFile, projectFileText, STARTERS, starterOf } from './project-store.js';

export function createProjects(port) {
  const ls = globalThis.localStorage, store = createProjectStore(ls);
  /* THE PART'S subscribe (0.5.0 C6b): rack.js calls `changed()` when the ring moves and the notebook is typed in; it says so once a
     frame (coalesced) to every subscriber of the shared registry — the session books its save, FOLDERS repaints its mark */
  const heard = new Set(), say = coalesce(() => { for (const fn of heard) { try { fn(); } catch (_) {} } }), changed = () => say.post();
  registerProjectPart(PART, { ...port.part, subscribe: (fn) => { heard.add(fn); return () => heard.delete(fn); } });
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

  /* the front page (THE PICKER) sits above every window: a door that shows FOLDERS puts it away first */
  const cover = () => { const c = port.cover ? port.cover() : null; if (c && c.shown) c.close(); return c; };
  /* Josh 10-01 · A PROJECT SAVE IS ALSO A PRESET (BASINS save-window.js presetOnSave, the kit's createApp onSaved): its rack in CAPS */
  const presetOf = (name) => { try { if (port.saved) port.saved(name); } catch (_) {} };
  let inspected = null;                                           // the entry id ⓘ last pointed at, or null (THIS VIEW)
  /* THE DEMOS' PICTURES: the cover's 4:3 middle, made small for the library (a data URL: it survives EXPORT, the kit's toThumb) */
  async function coverOf(file) {
    try {
      const url = './demos/covers/' + file + '.jpg', r = await fetch(url); if (!r.ok) return '';
      keepData(url, r.clone());   // a cover is DATA (sw.js §1b): the device keeps it after its first answer
      const full = await createImageBitmap(await r.blob()), h = Math.min(full.height, Math.round(full.width * 3 / 4));
      const mid = await createImageBitmap(full, 0, Math.round((full.height - h) / 2), full.width, h);
      try { return await toThumb(mid); } finally { full.close(); mid.close(); }
    } catch (_) { return ''; }
  }

  /* ── FOLDERS: the kit's window over the translator and the one part ── */
  const folders = createFolders({
    host: port.host, id: 'folders', title: 'FOLDERS', store: PJ_KEY, storage: store, files, app: PART, defaultName: 'UNTITLED',
    /* BASINS' toolbar (DEFAULT_ACTIONS' PROJECT · DUPLICATE · NEW) with λWAVES' SAVE in front — the report's option B, Josh's to confirm.
       OPEN FILE and EXPORT left the toolbar for FILE › IMPORT and FILE › EXPORT (.json · .mir · picture); a drop still opens a file */
    actions: ['save', 'project', 'duplicate', 'fresh'], folderGlyph: 'folder', rack: port.rack, onMoved: port.onMoved,
    factory: () => api.restoreDemos(),
    galleryCopy: { factory: 'RESTORE THE DEMOS', factoryNote: 'puts back the demos λWAVES ships with — adds only what is missing, and never touches anything you saved' },
    /* ⓘ (and a selection) names the project RENDER's SUBJECT describes; THIS VIEW when none */
    onInspect: (e, how) => { inspected = e ? e.id : null; if (port.inspect) port.inspect(e || null, how || {}); },
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
    /* FOLDERS' entrance is a motion (core/motion.js presence): the mask is taken again where it lands, paused or not (CLAUDE.md's
       mask law).  And opened over the current project, clean and still without a picture, it takes one then */
    onOpen: () => { cover(); const { root, rail } = folders.win; Promise.all([root, rail.el].flatMap((el) => (el && el.getAnimations ? el.getAnimations() : [])).map((a) => a.finished.catch(() => null))).then(() => port.onMoved());
      const e = currentId && files.entry(currentId); if (e && !e.thumb && !dirty()) Promise.resolve(port.thumbnail()).then(toThumb)
      .then((thumb) => { if (thumb) files.overwrite(e.id, { payload: e.payload, thumb, facts: e.facts, at: e.at }); }).catch(() => {}); },
    onOpened: () => { if (echo) { toast(echo, true); echo = null; } },
    /* FOLDERS' own SAVE / SAVE AS: an untitled notebook takes the project's name, in the file too (λWAVES' save always did) */
    onSaved: (e) => {
      currentId = e.id; touchRecent(ls, pathOf(e)); status = 'saved ' + pathOf(e);
      const v = valueOf(e.payload);
      if (port.titleAfterSave(e.name) && v) files.overwrite(e.id, { payload: payloadOf({ ...v, notebook: { ...v.notebook, title: e.name } }), thumb: e.thumb, facts: e.facts, at: e.at });
      markClean(); presetOf(e.name);
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
    folders, store, changed,
    get status() { return status; },
    /** show({ folder, name }) — FOLDERS on screen, the front page put away; `folder` turns the explorer to it, `name` focuses NAME (SAVE AS) */
    show(o = {}) {
      cover(); folders.open();
      if (o.folder != null) folders.gallery.go(o.folder);
      if (o.name) { const n = folders.panels.get('gallery') && folders.panels.get('gallery').querySelector('.sv-name-input'); if (n) { n.focus({ preventScroll: true }); n.select(); } }
      return true;
    },
    /** toggle() — the O key, WINDOW › FOLDERS, the notebook's ▤: shut when it is open and seen, else shown */
    toggle() { const c = port.cover ? port.cover() : null; if (folders.isOpen() && !(c && c.shown)) { folders.close(); return false; } return api.show(); },
    /** entryOf(path) → the FOLDERS entry stored at a λWAVES path (RECENT's rows), or null */
    entryOf(path) { sync(); return entryAt(String(path || '')); },
    /** the RENDER card's gallery: the project ⓘ pointed at (select(null) is its THIS VIEW) */
    inspected: { selected: () => (inspected && files.entry(inspected)) || null, select(id) { inspected = id || null; return this.selected(); } },
    /** restoreDemos() — RESTORE THE DEMOS (the kit's factory contract, gallery.js): a deleted demo is put back, nothing else is touched */
    async restoreDemos() {
      let seeded = []; try { seeded = JSON.parse(ls.getItem(PJ_KEY + '.seeded') || '[]'); } catch (_) {}
      const here = new Set(files.entries().map((e) => e.facts && e.facts.seedId).filter(Boolean)), gone = STARTERS.map((s) => 'demos/' + s.file).filter((id) => !here.has(id));
      const all = { ok: true, added: 0, total: STARTERS.length, complete: true, said: 'Every demo is here — nothing to restore.' };
      if (!gone.length) return all;
      try { ls.setItem(PJ_KEY + '.seeded', JSON.stringify((Array.isArray(seeded) ? seeded : []).filter((id) => !gone.includes(id)))); } catch (_) {}
      const r = await api.seed();
      if (!r || r.ok === false) return { ...(r || {}), ok: false, why: (r && r.why) || 'the demos could not be read' };
      return r.added ? { ok: true, added: r.added, total: STARTERS.length, complete: false, said: 'Restored ' + r.added + ' of ' + STARTERS.length + ' demos to DEMOS.' } : all;
    },
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
      currentId = r.entry.id; touchRecent(ls, saved); pjStatus('saved ' + saved); port.titleAfterSave(name); markClean(); tell(r.entry.id); presetOf(r.entry.name);
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
    /** resume(session) — the opener's RESUME (0.5.0 C6b): the session's part put back through the part's own restore, then the landing
     *  (the notebook law, the ring's origin `resume`).  Nothing is current, and the work stays unsaved until a SAVE */
    resume(session) {
      let r = null; port.busy(1); try { r = session.resume(); } finally { port.busy(-1); }
      if (!r || !r.ok || r.failed.length) { pjStatus('the last session could not be put back', true); return false; }
      currentId = null; port.opened('resume'); return true;
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
    /** seed() — the demos (iteration 009: one, WAVE DANCER PROTOTYPE) as FOLDERS' starters, added once (a changed demo file refreshed in place); awaited by the boot.
     *  AN OLDER BUILD'S DEMO PRESS STORED THE DEMO AT ITS PATH: an untouched copy becomes the starter where it stands; an edited one
     *  stays the user's and keeps the path, and that starter waits (no "WATER 2" beside it).
     *  ITERATION 004 · EACH WEARS ITS COVER: only a starter about to be added or refreshed fetches its picture (nothing for one that is up
     *  to date), and a refresh whose picture could not be made waits for the next boot — the kit writes `thumb: ''` otherwise */
    async seed() {
      const got = await Promise.allSettled(STARTERS.map(async (s) => { const r = await fetch('./demos/' + s.file + '.lambdawaves.json'); if (!r.ok) throw new Error('HTTP ' + r.status); return { ...starterOf(s, await r.text()), file: s.file }; }));
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
      const mine = new Map(files.entries().filter((e) => e.facts && e.facts.seedId).map((e) => [String(e.facts.seedId), e]));
      const due = keep.filter((s) => (mine.has(s.id) ? String(mine.get(s.id).facts.seedRevision ?? '') !== String(s.revision) : !known.has(s.id)));
      const pics = await Promise.all(due.map((s) => coverOf(s.file)));
      due.forEach((s, i) => { s.thumbnail = pics[i]; });
      const r = folders.seed(keep.filter((s) => !(mine.has(s.id) && due.includes(s) && !s.thumbnail)));
      /* ITERATION 009 · A RENAMED STARTER RIDES ITS REFRESH (WAVE DANCER → WAVE DANCER PROTOTYPE): the kit's refresh keeps an entry's name,
         so once the entry carries the starter's revision (refreshed just now, or at an earlier boot whose rename did not land) it takes
         the starter's name, in place — its id, folder, place and RECENT row kept (fromFiles follows the id).  A refresh that waits (its
         cover could not be made) waits with its name; a taken name leaves the starter `… 2` (the kit's uniqueName), never renamed again (X6: literally, not a prefix) */
      for (const s of list) {
        const e = files.entries().find((x) => x.facts && String(x.facts.seedId) === s.id);
        if (e && String(e.facts.seedRevision ?? '') === String(s.revision) && e.name !== s.name && e.name.replace(/ \d+$/, '') !== s.name) files.rename(e.id, s.name);
      }
      return r;
    },
  };
  if (store.refusal) unavailable(store.refusal);
  return api;
}
