/* MIR · folders/folders.js — FOLDERS: the kit's project window (BASINS' SAVE window, retitled and split).
 *
 * Josh, 2026-10-01: "Refactor the SAVE window and retitle it FOLDERS."  The 1.5 plan (§7 1.5.1, rulings 5 and 6)
 * splits BASINS' save-window.js (836 lines, seven jobs) into four parts, and this file is the one that joins them:
 *   1. THE WINDOW   window/window.js createWindow — the one window species: the chip rail (Shift-drag, long press and
 *                   keyboard relocate it), the dock if the app gives one, resize by transform with one layout commit,
 *                   cancel on a lost pointer, presence motion on open and close, and onMoved(rect) so a rack's
 *                   transport can dodge it (shell/rack.js dodge).  It keeps BASINS' EMPTY-GLASS DRAG: the gaps, the
 *                   titles and the labels move the window; the tiles, folders and the context box do not.
 *   2. THE ADAPTER  folders/project.js — capture · restore · signature · thumbnail · empty; by default the kit's
 *                   core/project.js parts.  NEW is the empty project; a failed open rolls back and says so.
 *   3. THE STORE    folders/files.js — BASINS' library model as it stands, the key an option (BASINS: basins.library).
 *   4. THE GALLERY  folders/gallery.js — BASINS' explorer as it stands, plus drag-to-folder with the proximity glow.
 * And: SEEDING (folders/seed.js, starters added once, a changed bundled starter refreshed in place), EXPORT (a `.mir` project
 * envelope, a PNG that carries it: core/envelope.js + core/png.js, or the project ZIP: SAVE AS ZIP… with its audio, folders/zip.js)
 * and IMPORT (core/intake.js: drop on the window, or OPEN FILE; OPEN ZIP… and a dropped .zip open a project ZIP; another app's
 * project is refused with the reason).  Files go out through the one saveBlob (folders/save-blob.js).
 *
 * THE LAWS IT KEEPS
 *   · WHAT THE USER READS CHANGES; WHAT A BROWSER STORED DOES NOT.  `id` (the window id, the prefs it persists under),
 *     `store` (the library key) and `prefs` are options; an app that had a SAVE window passes its old names and keeps
 *     every saved library and layout.  BASINS: { id: 'savewin', store: 'basins.library', prefs: savewin's slot }.
 *   · THE WINDOW TAKES THE POINTER BY ITS CLASS, NEVER BY ITS ID.  `.mir-win` (window.css) answers the mouse; nothing
 *     here hangs on `#savewin`, so the 2026-09-18 dead-window bug (an id-keyed pointer-events rule) cannot recur.
 *   · TWO FILE SYSTEMS, KEPT APART.  FOLDERS saves projects in its store; the notebook's shelf (notes/) saves notes in
 *     its own.  Neither reads the other's store and neither opens the other's window.  A project's pages ride in the
 *     project as one more part (shell/pages.js part()), which FOLDERS never looks inside.
 *   · Strings through t() (core/i18n.js).  Listeners under one AbortController; destroy() removes everything.
 *
 * createFolders(options) → api        (options and api: docs/FOLDERS.md) */
import { createWindow } from '../window/window.js';
import { ariaLabel } from '../kit.js';
import { t, tn, phrase, onLanguage } from '../core/i18n.js';
import { frame } from '../core/frame.js';
import { setText, setAttr } from '../core/perf.js';
import { wrap, stringify } from '../core/envelope.js';
import { embed } from '../core/png.js';
import { createIntake } from '../core/intake.js';
import { createFiles } from './files.js';
import { buildGallery, SORT_MODES, DEFAULT_ACTIONS } from './gallery.js';
import { notice } from '../shell/notice.js';
import { createProjectAdapter, openWithRollback, emptyProject } from './project.js';
import { seed as seedLibrary } from './seed.js';
import { saveBlob } from './save-blob.js';
import { projectZip, readProjectZip, restoreAssets, rollbackAssets, zipProject } from './zip.js';
import { assets } from '../core/assets.js';
import { fmtBytes } from '../render/plan.js';
import { jsonStore } from '../core/prefs.js';

export const FOLDERS_COPY = {
  save: [phrase('SAVE'), phrase('this project'), phrase('Save — store what is on screen over the open project (a new one the first time).')],
  saveAs: [phrase('SAVE AS'), phrase('a new project'), phrase('Save as — store what is on screen as a new project, with the name and folder below.')],
  fresh: [phrase('NEW'), phrase('the empty project'), phrase('New — the empty project: every part starts from nothing.')],
  open: [phrase('OPEN FILE'), phrase('.mir or picture'), phrase('Open a project file (.mir) or a picture that carries one — or drop it on this window.')],
  export: [phrase('EXPORT'), phrase('.mir or picture'), phrase('Export the selected project (or the open one) as a .mir file, or as a picture that carries it.')],
};
const LOOK_SORTS = ['az', 'za', 'new', 'old'];
/** FOLDERS' own verbs, for an app that wants them instead of BASINS' toolbar (the default, gallery.js DEFAULT_ACTIONS) */
export const FOLDERS_ACTIONS = Object.freeze(['save', 'saveAs', 'fresh', 'open', 'export']);
export { DEFAULT_ACTIONS };
/** the built-in first panel, as BASINS' SAVE window draws its chip */
export const GALLERY_PANEL = Object.freeze({ id: 'gallery', label: 'GALLERY', glyph: 'gallery', hint: 'Gallery — browse saved projects' });   // tr[GALLERY]: the panel of saved projects shown as pictures (an art gallery of the user's work) // tr[Gallery — browse saved projects]: the hint of that panel's chip

/** localPrefs(storage, key) — the default window prefs: one JSON object under one key */
export function localPrefs(storage, key) {
  const s = jsonStore(key, storage);
  return { read() { const v = s.get(); return v && typeof v === 'object' ? v : null; }, write: s.set };
}

/** freeSeat({ vw, vh, w, h, minH, clear, top, margin }) → { x, y, h? } — pure: where a new floating window lands.
 *  `clear` are rects to keep off (rack.keepClear(): the racks showing a window, the transport bar).  A rect at the
 *  left or right edge is a rack and narrows the free stage; the window is centred in what is left, `top` px down.  Any
 *  other rect below it (the transport) shortens the window to end above it (never under `minH`); one above it pushes
 *  it down.  `anchor: 'right'` seats it against the right of the free stage instead (BASINS' SAVE window), leaving
 *  `gutter` px for a rail on its right. */
export function freeSeat({ vw, vh, w, h, minH = 360, clear = [], top = 72, margin = 16, anchor = 'centre', gutter = 0 }) {
  let L = margin, R = vw - margin;
  const bars = [];
  for (const r of clear) {
    if (r.left <= 24) L = Math.max(L, r.right + margin);             // a rack at an edge narrows the free stage
    else if (r.right >= vw - 24) R = Math.min(R, r.left - margin);
    else bars.push(r);
  }
  if (R - L < w) { L = margin; R = vw - margin; }                     // no room between the racks: the whole stage
  /* anchor 'right' is BASINS' SAVE seat: against the right of the free stage, `gutter` px left for a rail on that side */
  const want = anchor === 'right' ? R - gutter - w : (L + R) / 2 - w / 2;
  const x = Math.round(Math.max(margin, Math.min(vw - w - margin, want)));
  let y = top, hh = Math.min(h, vh - top - margin);
  const across = bars.filter((r) => r.right > x && r.left < x + w);
  for (const r of across) if (r.bottom <= vh / 2 && r.bottom + margin > y) y = Math.round(r.bottom + margin);
  hh = Math.min(hh, vh - y - margin);
  for (const r of across) if (r.top > vh / 2 && y + hh > r.top - margin) hh = Math.max(minH, Math.round(r.top - margin - y));
  return hh < h ? { x, y, h: hh } : { x, y };
}

/** toThumb(src, { max, type }) → Promise<data URL | ''> — a canvas, a Blob or a data URL made small for the library */
export async function toThumb(src, { max = 320, type = 'image/jpeg', quality = 0.84 } = {}) {
  try {
    if (!src) return '';
    let img = src;
    if (typeof src === 'string') return /^data:image\//.test(src) ? src : '';   // an app's own thumbnail passes as it is (BASINS' captureThumb)
    else if (typeof Blob !== 'undefined' && src instanceof Blob) img = await createImageBitmap(src);
    const w = img.width, h = img.height; if (!w || !h) return '';
    const k = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(type, quality);
  } catch (_) { return ''; }
}
const loadImage = (url) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('the picture could not be read')); i.src = url; });
/** pngBytes(src) → Promise<Uint8Array | null> — any picture (canvas, Blob, data URL) as PNG bytes */
async function pngBytes(src) {
  try {
    let c = src;
    if (!(typeof HTMLCanvasElement !== 'undefined' && src instanceof HTMLCanvasElement)) {
      const img = typeof src === 'string' ? await loadImage(src) : await createImageBitmap(src);
      c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0);
    }
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch (_) { return null; }
}
const fileName = (s) => (String(s || 'project').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim() || 'project');
const isZipFile = (f) => !!f && (/\.zip$/i.test(f.name || '') || /^application\/(x-)?zip(-compressed)?$/.test(f.type || ''));

export function createFolders(options = {}) {
  const o = options;
  const host = o.host || document.body, doc = host.ownerDocument, view = doc.defaultView;
  const storage = o.storage || view.localStorage;
  const id = o.id || 'folders', title = o.title || 'FOLDERS', store = o.store || 'mir.folders';
  const prefs = o.prefs || localPrefs(storage, store + '.window');
  const life = new AbortController(), on = { signal: life.signal };
  const copy = { ...FOLDERS_COPY, ...(o.copy || {}) };
  const readPrefs = () => prefs.read() || {};
  const writePrefs = (patch) => prefs.write({ ...readPrefs(), ...patch });

  /* the project ZIP's options: `zip: false` leaves it out; `zip: { store, validate(project), parts() }` the asset store (default
     core/assets.js), what a project must be to be taken (default: an object) and where SAVE AS ZIP reads the live project.  SAVE AS
     ZIP… / OPEN ZIP… sit in RENDER's FILES section, as BASINS' SETTINGS & FILES had them (render/panel.js `files` = api.zip).
     Nothing is written until the project has been read and checked. */
  const zipOpt = o.zip === false ? null : (o.zip && typeof o.zip === 'object' ? o.zip : {});
  const zipStore = (zipOpt && zipOpt.store) || assets;
  const zipValid = zipOpt && typeof zipOpt.validate === 'function' ? zipOpt.validate : (p) => !!p && typeof p === 'object' && !Array.isArray(p);
  const zipApp = String(o.app || 'mir').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'mir';
  const zipWhy = (e) => String((e && e.message) || e || 'unknown');
  const zipVerbs = zipOpt ? { save: () => exportZip(), open: (zo) => pickFile(true, zo && zo.seat) } : null;   // SAVE AS ZIP… · OPEN ZIP… (api.zip); open({ seat }): where its "save this first?" opens

  /* ── 3. the store, and 5. the seeds ── */
  const files = o.files || createFiles({ key: store, storage, defaultName: o.defaultName || 'UNTITLED', capChars: o.capChars });
  const seeded = o.seeds ? seedLibrary(files, o.seeds, { storage, seededKey: o.seededKey }) : null;
  view.addEventListener('storage', (e) => { if (e.key === store || e.key === null) files.reload(); }, on);

  /* ── 2. the adapter ── */
  const A = createProjectAdapter(o.adapter || {});
  let current = null;                                               // the open project's entry id, or null
  const currentEntry = () => (current ? files.entry(current) : null);
  const ro = (e) => !!(e && e.facts && e.facts.readOnly);
  async function capture(presence) {
    const payload = await A.capture(presence || (gallery ? gallery.presence() : {}));
    let thumb = '';
    try { thumb = await toThumb(await A.thumbnail(), o.thumb); } catch (_) {}
    let facts = {}; try { facts = A.facts() || {}; } catch (_) {}
    return { payload, thumb, facts };
  }
  const galleryAdapter = {
    capture,
    restore: (payload, entry) => openWithRollback(A, payload, entry),
    signature: () => A.signature(),
    fresh: async () => { const r = await emptyProject(A); if (!r.ok) return r; return r.said || t('New — the empty project'); },
    freshLoses: typeof o.freshLoses === 'function' ? o.freshLoses : () => true,
    locked: o.locked, projection: o.projection,
    factory: o.factory,
    depthOf: o.depthOf,
    picture: o.capturePicture, savePicture: o.savePicture, pictureStale: o.pictureStale,
  };

  /* ── the status voice: the app's, or a line in the window ── */
  let statusEl = null;
  const say = typeof o.say === 'function' ? o.say : (text, bad) => {
    if (statusEl) { setText(statusEl, text); setAttr(statusEl, 'data-tone', bad ? 'warn' : null); return; }
    notice(text, { kind: bad ? 'warn' : 'ok', ms: bad ? 5000 : 3200 });          // BASINS' toast: 3.2 s, a warning 5 s
  };

  /* ── 1. the window ── */
  const sorts = o.sorts || (o.depthOf ? SORT_MODES.map((m) => m.id) : LOOK_SORTS);
  const sortModes = sorts.map((s) => SORT_MODES.find((m) => m.id === s)).filter(Boolean);
  const gp = readPrefs().gallery || {};
  /* BASINS' SAVE window has no words on its glass: no title bar, no project name (its title is the window's and the
     rail's accessible name, the WINDOW menu row and the rack card's eyebrow).  So FOLDERS draws none by default; `head`
     adds the open project's name and the UNSAVED CHANGES mark, `status` a status line in place of the toast. */
  const head = doc.createElement('div'), panel = doc.createElement('div');
  head.className = 'fo-head'; panel.className = 'fo-gallery';
  const curName = doc.createElement('span'); curName.className = 'fo-current';
  const mark = doc.createElement('span'); mark.className = 'fo-mark';
  head.append(curName, mark);
  if (o.status) { statusEl = doc.createElement('div'); statusEl.className = 'fo-status'; statusEl.setAttribute('role', 'status'); statusEl.setAttribute('aria-live', 'polite'); }

  /* THE PANELS (BASINS: GALLERY and RENDER).  The gallery is the first and built in; an app adds its own as
     { id, label, glyph, hint, build(body, api), onShow?(body, api) }.  With more than one, a radio chip per panel sits on
     the rail before the sort, as BASINS draws them; with one there is no switch. */
  const extra = (Array.isArray(o.panels) ? o.panels : []).filter((p) => p && p.id && p.id !== 'gallery');
  const panelSpecs = [{ ...GALLERY_PANEL, ...(o.galleryPanel || {}) }, ...extra];
  const panelBodies = new Map();
  let active = 'gallery', api = null;
  const showTab = (pid) => {
    const spec = panelSpecs.find((p) => p.id === pid); if (!spec) return active;
    win.tab(pid); active = pid;
    if (pid === 'gallery') { if (gallery) gallery.paint(); }
    else if (typeof spec.onShow === 'function') { try { spec.onShow(panelBodies.get(pid), api); } catch (_) {} }
    if (typeof o.onTab === 'function') { try { o.onTab(pid); } catch (_) {} }
    writePrefs({ tab: pid });
    return pid;
  };
  const chips = [];
  if (panelSpecs.length > 1) for (const p of panelSpecs) chips.push({ name: p.id, kind: 'radio', group: 'panel', glyph: p.glyph || p.id, label: p.hint || p.label, state: p.id === 'gallery', press: () => showTab(p.id) });
  chips.push({ name: 'sort', kind: 'cycle', label: 'Sort', state: (sortModes[gp.sort] || sortModes[0]).id,
    states: sortModes.map((m) => ({ id: m.id, text: m.ink, label: m.label, hint: ['{order} — press for the next sort order', { order: { t: m.label } }] })),
    press: (state) => { if (gallery) gallery.setSort(sortModes.findIndex((m) => m.id === state)); } });

  let gallery = null;
  const MARK = Symbol('folders-mark');
  const win = createWindow({
    id, title, host, size: o.size || { w: 380, h: 680 }, min: o.min || { w: 280, h: 360 }, resizable: true,
    /* the tiles, the folders and the context box are the gallery's to press; every other piece of glass drags */
    emptyDrag: '.sv-card, .sv-folder, .sv-context, .sv-crumb' + (o.emptyDragExcept ? ', ' + o.emptyDragExcept : ''),
    dock: o.dock || null,
    /* BASINS' SAVE window wears the modulation window's material (kwin adoptMaterial): the kit window's material hook
       ([data-mir-material], window.css) gives FOLDERS the same by default; `material: null` for the plain house glass */
    material: o.material === undefined ? 'modulation' : o.material, railGap: o.railGap,
    /* BASINS seats the SAVE rail on the window's RIGHT; a saved chipSide wins */
    persist: { read: () => ({ chipSide: o.chipSide || 'right', ...readPrefs() }), write: (shape) => writePrefs(shape) },
    onMoved: (r) => { if (typeof o.onMoved === 'function') o.onMoved(r); },
    /* every open, a persisted one included, tells the app (BASINS seeds its factory gallery and library here) */
    onOpen: () => { if (typeof o.onOpen === 'function') { try { o.onOpen(api); } catch (_) {} } if (gallery) gallery.paint(); if (active !== 'gallery') showTab(active); paintMark(); },
    chips,
    panels: panelSpecs.map((p) => ({ name: p.id, body: (b) => {
      panelBodies.set(p.id, b);
      if (p.id === 'gallery') { if (o.head) b.append(head); b.append(panel); if (statusEl) b.append(statusEl); }
    } })),
  });
  win.root.classList.add('mir-folders');
  /* the window's DOM id is its id, as kwin gave BASINS' (#savewin): an app's own rules and rigs that name it keep
     working.  Nothing in the kit hangs on it: the pointer is the class's (.mir-win), so a missed id is not a dead window */
  if (o.domId !== false) win.root.id = o.domId || id;
  ariaLabel(win.root, title);
  const intakeTarget = win.root;

  /* ── 4. the gallery ── */
  const extraActions = {
    save: { copy: copy.save, icon: 'save', fire: () => saveNow() },
    saveAs: { copy: copy.saveAs, icon: 'duplicate', fire: () => gallery.save() },
    open: { copy: copy.open, icon: 'folder', fire: () => pickFile() },
    export: { copy: copy.export, icon: 'download', fire: () => exportMenu() },
  };
  /* EVERY VIEW OF THE LIBRARY IS ONE GALLERY OVER ONE STORE AND ONE ADAPTER (survey B §2b, item 6).  The window's is the
     first; mountGallery() adds another (BASINS: the compact gallery in its rack card, 8 a page).  When one view opens,
     saves or starts NEW, the others learn that what is on screen is clean, so none of them asks for nothing. */
  const views = new Set();
  const settled = (from) => { for (const v of views) if (v !== from) v.markClean(); };
  const viewOptions = (self, extraOpts = {}) => ({
    files, adapter: galleryAdapter, say, glyph: o.glyph, kit: o.kit,
    parts: o.parts || [], sorts, copy: { root: 'ROOT', ...(o.galleryCopy || {}) },
    actions: o.actions || DEFAULT_ACTIONS, extraActions,
    current: () => current,
    onOpened: async (e) => {
      current = e.id; settled(self()); paintMark();
      if (!e.thumb) { const c = await capture().catch(() => null); if (c && c.thumb) files.overwrite(e.id, { payload: e.payload, thumb: c.thumb, facts: e.facts, at: e.at }); }
      if (typeof o.onOpened === 'function') o.onOpened(e);
    },
    onSaved: (e) => { current = e.id; settled(self()); paintMark(); if (typeof o.onSaved === 'function') { try { o.onSaved(e); } catch (err) { console.warn('folders: onSaved', err); } } },
    onFresh: () => { current = null; settled(self()); paintMark(); },
    onRemoved: (e) => { if (current === e.id) { current = null; paintMark(); } },
    onInspect: o.onInspect,
    dragToFolder: o.dragToFolder === true, folderGlyph: o.folderGlyph,
    ...extraOpts,
  });
  gallery = buildGallery(panel, viewOptions(() => gallery, { prefs: gp, persist: (g) => writePrefs({ gallery: g }) }));
  views.add(gallery);
  /** mountGallery(el, { pageSize = 8, prefsKey = 'rackGallery', actions, factory }) — a second live view of the same
   *  library in any element (a rack card's body).  Its sort and components persist under its own key in the same prefs;
   *  it has no RESTORE FACTORY button unless `factory` is passed (BASINS' rack card had none). */
  function mountGallery(el, mo = {}) {
    const key = mo.prefsKey || 'rackGallery';
    el.classList.add('mir-folders', 'mir-folders-card');
    let v = null;
    v = buildGallery(el, viewOptions(() => v, {
      pageSize: mo.pageSize ?? 8, actions: mo.actions || o.actions || DEFAULT_ACTIONS,
      adapter: { ...galleryAdapter, factory: mo.factory },
      prefs: readPrefs()[key] || gp, persist: (g) => writePrefs({ [key]: g }),
      onInspect: mo.onInspect || o.onInspect,
    }));
    views.add(v);
    const destroy = v.destroy;
    v.destroy = () => { views.delete(v); destroy(); };
    return v;
  }
  /* no markClean here: as BASINS, what the app started with is UNKNOWN, so an open over it asks first */

  /* ── the unsaved mark: the open project's name, and whether what is on screen is still it ── */
  function paintMark() {
    frame.coalesce(MARK, () => {
      const e = currentEntry(), d = gallery.dirty();
      setText(curName, e ? e.name : t('UNTITLED'));
      setAttr(head, 'data-read-only', ro(e) ? 'true' : null);
      const dirty = d.known && d.dirty;
      setAttr(head, 'data-dirty', dirty ? 'true' : null);
      setText(mark, dirty ? t('UNSAVED CHANGES') : '');
    });
  }
  const unsub = A.subscribe ? A.subscribe(() => paintMark()) : null;
  paintMark();
  const offLang = onLanguage(() => paintMark());   // UNTITLED and UNSAVED CHANGES in the new language

  /* ── SAVE: over the open project; the first time (or over a starter) it is SAVE AS ── */
  async function saveNow() {
    const e = currentEntry();
    if (!e || ro(e)) {
      if (ro(e)) say(t('{name} came with the app — saving it as your own copy', { name: e.name }));
      return gallery.save(ro(e) ? { name: e.name } : undefined);
    }
    let r;
    try { const c = await capture(); r = files.overwrite(e.id, c); } catch (err) { r = { ok: false, why: String((err && err.message) || err) }; }
    if (r.ok) { gallery.markClean(); say(t('Saved — {name}', { name: r.entry.name })); gallery.paint(); paintMark(); if (typeof o.onSaved === 'function') { try { o.onSaved(r.entry); } catch (err) { console.warn('folders: onSaved', err); } } }
    else say(t('Could not save: {why}', { why: r.why || 'unknown' }), true);
    return r;
  }

  /* ── 6. export and import ── */
  const download = typeof o.download === 'function' ? o.download : saveBlob;
  async function subject() {
    const e = gallery.selected() || currentEntry();
    if (e) return { name: e.name, payload: e.payload, thumb: e.thumb, entry: e };
    const c = await capture();
    return { name: gallery.nameValue() || t('UNTITLED'), payload: c.payload, thumb: c.thumb, entry: null };
  }
  const envelopeOf = (s) => wrap('project', s.payload, { app: o.app, name: s.name });
  async function exportProject(how = 'mir') {
    const s = await subject();
    const env = envelopeOf(s);
    if (how === 'png') {
      let pic = null;
      try { pic = typeof o.picture === 'function' ? await o.picture(s.entry) : null; } catch (_) {}
      if (!pic && !s.entry) { try { pic = await A.thumbnail(); } catch (_) {} }
      const bytes = await pngBytes(pic || s.thumb);
      const out = bytes && embed(bytes, env);
      if (!out) { say(t('Could not make the picture for {name} — it has none; export the .mir file instead', { name: s.name }), true); return null; }
      const blob = new Blob([out], { type: 'image/png' });
      download(blob, fileName(s.name) + '.png');
      say(t('Exported {name} as a picture that carries it', { name: s.name }));
      return blob;
    }
    const blob = new Blob([stringify(env)], { type: 'application/json' });
    download(blob, fileName(s.name) + '.mir');
    say(t('Exported {name} as a .mir file', { name: s.name }));
    return blob;
  }
  function exportMenu() {
    const b = gallery.box(t('EXPORT'));
    const row = doc.createElement('div'); row.className = 'sv-context-row'; b.appendChild(row);
    gallery.action(row, '.MIR FILE', () => { gallery.closeContext(); exportProject('mir'); }, 'sv-primary').root.dataset.export = 'mir';
    gallery.action(row, 'PICTURE', () => { gallery.closeContext(); exportProject('png'); }).root.dataset.export = 'png';
    gallery.action(b, 'CLOSE', () => gallery.closeContext());
    const first = row.querySelector('.trig'); if (first) first.focus({ preventScroll: true });
  }

  /* ── 6b. the project ZIP: the live project (with the audio it names) in one .zip, and back (the options are above) ── */
  async function exportZip() {
    if (!zipOpt) return null;
    try {
      const z = await zipProject({ entry: gallery.selected() || currentEntry(), parts: zipOpt.parts, capture, untitled: t('UNTITLED') });
      const blob = await projectZip(z.project, { store: zipStore }), file = fileName(z.name) + '.' + zipApp + '.zip';
      download(blob, file);
      say(t('Saved {file} · {size}', { file, size: fmtBytes(blob.size) }));
      return blob;
    } catch (e) { say(t('Could not save the zip: {why}', { why: zipWhy(e) }), true); return null; }
  }
  /** openZip(file, { force, seat }) — read it, check it, write its assets, save the project under its name (a clash is
   *  numbered, never an overwrite) and open it.  A zip that is not one, fails its CRC or holds no valid project changes
   *  nothing; a project that cannot be saved gives back the assets this open wrote.
   *  IT ASKS FIRST (Josh, 2026-10-07, call 10: "Should OPEN ZIP replace the open project without asking 'save this first?'
   *  — N"): when what is on screen is unsaved, or not known to be saved (the gallery's dirty(), the one signal the library
   *  open and NEW read), the library open's own question — SAVE & OPEN · OPEN WITHOUT SAVING · × — opens in `seat` (an
   *  element below the OPEN ZIP… the hand pressed: RENDER's FILES) or in NEW's box over the explorer, before anything is
   *  written; × leaves the zip unopened and the library as it was.  `force` skips the question. */
  async function openZip(file, oo = {}) {
    if (!zipOpt) return { ok: false, why: 'zip is off' };
    let read;
    try { read = await readProjectZip(file); }
    catch (e) { say(t('That is not a project zip: {why}', { why: zipWhy(e) }), true); return { ok: false, why: zipWhy(e) }; }
    const project = read.project;
    if (!project || !zipValid(project)) { say(t('That is not a project zip — nothing changed'), true); return { ok: false, why: 'invalid' }; }
    const name = String(project.name || '').trim() || t('UNTITLED');
    const d = gallery.dirty();
    if (!oo.force && (d.dirty || !d.known)) {
      const seat = oo.seat && oo.seat.isConnected ? oo.seat : null;
      if (!seat && active !== 'gallery') { showTab('gallery'); if (win.rail.chip('gallery')) win.setChip('gallery', true); }   // a drop on another panel: the question is asked where NEW asks it
      gallery.askBeforeOpen({ name }, d, () => openZip(file, { force: true }), seat);
      return { ok: false, asked: true };
    }
    let put;
    try { put = await restoreAssets(read, { store: zipStore }); }
    catch (e) { say(t('Could not keep the zip’s files: {why}', { why: zipWhy(e) }), true); return { ok: false, why: zipWhy(e) }; }
    const r = files.save({ name, folder: gallery.folder(), payload: project });
    if (!r.ok) { await rollbackAssets(put.written, { store: zipStore }); say(t('Could not add the project: {why}', { why: r.why || 'unknown' }), true); return r; }
    gallery.go(r.entry.folder);
    const opened = await gallery.openEntry(r.entry.id, { force: true }), n = put.restored.length, good = !!(opened && opened.ok);
    say([t(good ? 'Opened {name}' : 'Added {name}', { name: r.entry.name }), r.entry.name !== name ? t('renamed beside a project already there') : '',
      n ? tn(n, '{n} audio asset', '{n} audio assets', { n }) : '', good ? '' : (opened && opened.why) || t('could not open it')].filter(Boolean).join(' · '), !good);
    gallery.paint();
    return { ok: good, entry: r.entry, assets: put };
  }
  /* the file pickers: OPEN FILE takes the intake's kinds and a .zip; OPEN ZIP… takes only the zip */
  function takeFiles(list, source, seat) { for (const f of list) { if (zipOpt && isZipFile(f)) openZip(f, { seat }); else intake.ingest(f, { source }); } }
  function pickFile(zipOnly, seat) {
    if (!zipOpt) { intake.pick(); return; }
    const input = doc.createElement('input'); input.type = 'file'; input.multiple = !zipOnly;
    input.accept = zipOnly ? '.zip,application/zip' : '.mir,.json,.md,.markdown,.txt,.png,image/png,.zip,application/zip';
    input.addEventListener('change', () => takeFiles([...(input.files || [])], 'picker', seat), { once: true, signal: life.signal });
    input.click();
  }
  async function importEnvelope(env) {
    const r = files.save({ name: env.name || t('IMPORTED'), folder: gallery.folder(), payload: env.data, thumb: '', facts: {} });
    if (!r.ok) { say(t('Could not keep {name}: {why}', { name: env.name || '', why: r.why || 'unknown' }), true); return r; }
    gallery.go(r.entry.folder);
    say(t('Imported — {name}', { name: r.entry.name }));
    return gallery.openEntry(r.entry.id);
  }
  const intake = createIntake({ target: intakeTarget, accept: ['project'], check: { app: o.app }, paste: false,
    onEnvelope: (env) => { importEnvelope(env); },
    onReject: (r) => say(t('Could not open that file: {why}', { why: (r.errors && r.errors[0] && r.errors[0].why) || 'unknown' }), true) });

  /* a dropped .zip is a project ZIP (before the intake sees it: it takes envelopes, pictures and text); other files in the same
     drop go to the intake as always */
  if (zipOpt) intakeTarget.addEventListener('drop', (e) => {
    const list = [...((e.dataTransfer && e.dataTransfer.files) || [])]; if (!list.some(isZipFile)) return;
    e.preventDefault(); e.stopImmediatePropagation(); takeFiles(list, 'drop');
  }, { capture: true, signal: life.signal });

  const firstSeat = typeof o.firstSeat === 'function' ? o.firstSeat : () => {
    const st = win.state(), rack = typeof o.rack === 'function' ? o.rack() : o.rack;
    const right = st.chipSide === 'right', railW = right ? Math.round(((win.rail.sizes() || {}).vertical || {}).w || 62) : 0;
    return freeSeat({ vw: view.innerWidth, vh: view.innerHeight, w: st.w || 380, h: st.h || 680, minH: (o.min || { h: 360 }).h,
      clear: rack && typeof rack.keepClear === 'function' ? rack.keepClear() : [], anchor: o.anchor || 'right', top: o.top ?? 162, gutter: railW });
  };
  /* the first seat: BASINS' — top right, clear of the right rack and of the rail on the window's right, 162 px down,
     shortened to end above the transport (the rack says where they are); an app's firstSeat wins */
  const seatOnce = () => { if (win.state().x == null) { const s = firstSeat(); if (s) win.place(s.h ? { x: s.x, y: s.y, h: s.h } : { x: s.x, y: s.y }); } };
  if (win.isOpen()) seatOnce();

  api = {
    win, files, gallery, adapter: A, seeded, intake, views,
    /** tab(id) — show a panel (BASINS: kwin.tab); tab() → the panel showing */
    tab: (pid) => (pid == null ? active : showTab(pid)), activeTab: () => active,
    panels: panelBodies, mountGallery,
    open() { if (!win.isOpen()) { win.open(); seatOnce(); } },
    close: () => win.close(), toggle() { if (win.isOpen()) win.close(); else this.open(); }, isOpen: () => win.isOpen(),
    save: saveNow, saveAs: (so) => gallery.save(so), fresh: (fo) => gallery.fresh(fo),
    openEntry: (eid, oo) => gallery.openEntry(eid, oo),
    current: () => currentEntry(), dirty: () => gallery.dirty(),
    seed: (list) => { const r = seedLibrary(files, list, { storage, seededKey: o.seededKey }); gallery.paint(); return r; },
    exportProject, exportZip, openZip, zip: zipVerbs, importEnvelope, ingest: (input, io) => intake.ingest(input, io), say,
    state: () => ({ window: win.state(), gallery: gallery.state(), library: files.state(), current, dirty: gallery.dirty() }),
    destroy() { life.abort(); offLang(); if (unsub) unsub(); frame.cancel(MARK); intake.destroy(); for (const v of [...views]) v.destroy(); win.destroy(); },
  };
  for (const p of extra) if (typeof p.build === 'function') { try { p.build(panelBodies.get(p.id), api); } catch (e) { say(t('The {panel} panel could not be built: {why}', { panel: p.label || p.id, why: String((e && e.message) || e) }), true); } }   // tr: an error notice: {panel} is a panel's name (RENDER …), {why} the program's reason, left as it is
  { const tab0 = readPrefs().tab; if (tab0 && tab0 !== 'gallery' && panelSpecs.some((p) => p.id === tab0)) { active = tab0; win.tab(tab0); if (win.rail.chip(tab0)) win.setChip(tab0, true); } }
  return api;
}

export default createFolders;
