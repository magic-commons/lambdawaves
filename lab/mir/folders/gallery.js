/* ══════════════════════════════════════════════════════════════════════════
   mir/folders/gallery.js — THE GALLERY PANEL (FOLDERS' face; BASINS' SAVE window's GALLERY tab), PORTABLE.

   Harvested from BASINS REDUX app/mir-plugins/files/gallery.js (worktree basins-engine-2026-09-12, HEAD b7eb63e,
   read 2026-10-01 evening; md5 d3cc0d2f…).  The explorer, the menus, the one context box, "save this first?", the
   full-library refusal with MAKE ROOM, the inline rename latch and the six sorts are BASINS' as they stand.  What
   MIR 1.5 changed, and why:
     · DRAG TO FOLDER (plan, smaller rulings; `dragToFolder: true`, OFF by default — BASINS never had it): a tile carried by a mouse or pen lights the folders and the crumbs
       through core/proximity.js — dotted and brightening with nearness, solid when release would land — and drops
       into the one it lands on.  Escape, a lost pointer or a blur puts it back where it was (core/pointer.js drag).
       A finger long-presses a tile for its menu; the keyboard reaches the same menu by the tile's MOVE button (or the
       context-menu key).  The menu lists every folder as a MOVE TO button, as well as the typed path BASINS had.
     · The parallax is core/pointer.js pointerField (one rect read per enter, policy-aware), not a rect read on every
       pointermove (survey B §4 #14).
     · Strings through t() (core/i18n.js).  English stays the key.
     · `actions` names the toolbar's verbs, and `extraActions` adds the host's (FOLDERS: SAVE · SAVE AS · NEW · OPEN
       FILE · EXPORT).  BASINS' own five stay the default.  With no `parts`, the components disclosure is not built.
     · Listeners live under one AbortController; destroy() removes them.
     · A read-only entry (facts.readOnly: a shipped starter) refuses rename.
   WHAT IT DOES NOT OWN: what a component IS, how a picture is made, and what "inspect" shows — the host's.
   ══════════════════════════════════════════════════════════════════════════ */

import { normalizeFolder, leafOf, inFolderTree } from './files.js';
import * as kitDefault from '../kit.js';
import { label as kitLabel, ariaLabel as kitAria, placeholder as kitPh } from '../kit.js';   // the kit's own words, whatever kit the app hands in
import { glyphEl } from '../glyph.js';
import { t, tn, phrase, onLanguage } from '../core/i18n.js';
import { drag, pointerField } from '../core/pointer.js';
import { createProximity } from '../core/proximity.js';
import { setVar, rect } from '../core/perf.js';
import { fmtBytes } from '../render/plan.js';
import { ARM_MS } from '../controls/list.js';

export const SORT_MODES = [
  { id: 'az', ink: 'A–Z', label: 'Sort A to Z' },
  { id: 'za', ink: 'Z–A', label: 'Sort Z to A' },
  { id: 'deep', ink: 'D↓', label: 'Sort deepest zoom first' },
  { id: 'shallow', ink: 'D↑', label: 'Sort shallowest zoom first' },
  { id: 'new', ink: 'N↓', label: 'Sort newest first' },
  { id: 'old', ink: 'N↑', label: 'Sort oldest first' }
];

export const GALLERY_COPY = {
  capture: [phrase('CAPTURE'), phrase('make image'), phrase('Capture this view as an image. Capture again to try another version.')],
  download: [phrase('DOWNLOAD'), phrase('save image'), phrase('Download the captured image to your photos or files.')],
  project: [phrase('PROJECT'), phrase('in this gallery'), phrase('Project — store what is on screen with a thumbnail, so opening it later restores it.')],
  duplicate: [phrase('DUPLICATE'), phrase('selected project'), phrase('Duplicate the selected saved project, including its thumbnail and settings.')],
  fresh: [phrase('NEW'), phrase('start over'), phrase('New — back to the start.')],
  partsTitle: phrase('PROJECT COMPONENTS'),
  name: phrase('NAME'), saveTo: phrase('SAVE TO'), saveToPlaceholder: phrase('{:ROOT} — or type a new folder path'),
  root: phrase('ROOT'),   // tr: ROOT: the top of the folder tree, the projects in no folder (not a route)
  factory: phrase('RESTORE FACTORY GALLERY'),
  factoryNote: phrase('puts back what this app shipped with — adds only what is missing, and never touches anything you saved'),
  emptyRoot: phrase('Nothing is saved at {:ROOT} yet.  Open a folder, or save what is on screen here.'),
  emptyFolder: phrase('This folder is empty.  Move a project here, or save what is on screen into it.')
};

const LONG_MS = 560;
/** BASINS' SAVE toolbar, in its order: the default `actions` */
export const DEFAULT_ACTIONS = Object.freeze(['project', 'capture', 'download', 'duplicate', 'fresh', 'options']);

/**
 * buildGallery(panel, opts) → api
 *   files     a createFiles() store
 *   kit       MIR kit.js ({ trig, sw }) — default the kit's own
 *   glyph     (name, cls, size) → element — default glyph.js glyphEl
 *   parts     [{ id, label, soon? }] — the components, in window order; none → no components disclosure
 *   sorts     the SORT_MODES ids offered, in order (default: all six)
 *   actions   the toolbar verbs in order: built-in 'project' 'capture' 'download' 'duplicate' 'fresh', or a key of
 *             extraActions { id: { copy: [label, sub, hint], icon, fire() } }
 *   adapter   capture(presence) · restore(payload, entry) · signature?() · projection?(presence) → bytes
 *             picture?() → held picture · savePicture?(held) → 'share'|'download' · pictureStale?(held) → bool
 *             fresh?() → sentence · freshLoses?() → bool · locked?() → sentence|null · factory?() → { ok, added, … }
 *             depthOf?(entry) → number
 *   say(text, warn)    the host's status voice
 *   onInspect(entry|null, how)  ·  onOpened(entry)  ·  onSaved(entry)  ·  onFresh()
 *   persist(prefs) / prefs   { sort, parts }
 *   dropLayer         where the drop guides are drawn (default document.body)
 */
export function buildGallery(panel, opts) {
  const o = opts || {};
  const doc = o.doc || panel.ownerDocument || globalThis.document;
  const files = o.files, kit = o.kit || kitDefault, adapter = o.adapter || {};
  const copy = Object.assign({}, GALLERY_COPY, o.copy || {});
  const glyph = typeof o.glyph === 'function' ? o.glyph : glyphEl;
  const say = typeof o.say === 'function' ? o.say : () => {};
  const life = new AbortController(), on = { signal: life.signal };
  const PARTS = Array.isArray(o.parts) ? o.parts : [];
  const SORTS = (Array.isArray(o.sorts) ? o.sorts : SORT_MODES.map((m) => m.id)).map((id) => SORT_MODES.find((m) => m.id === id)).filter(Boolean);
  const mk = (tag, cls, parent, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; if (parent) parent.appendChild(n); return n; };
  const btn = (cls, parent, text, label) => { const b = mk('button', cls, parent, text); b.type = 'button'; if (label) { b.setAttribute('aria-label', label); b.title = label; } return b; };
  const ink = (el, name, size) => { const g = glyph(name, 'gly gly-' + name, size); if (g) el.appendChild(g); return el; };
  const ro = (e) => !!(e && e.facts && e.facts.readOnly);
  /* BASINS by default (Josh, 10-02: "Prefer BASINS"): no drag-to-folder, the Mandelbrot mark counting a folder, the
     cover's wash at .65 when no token is set.  An app opts into the kit's additions. */
  const DRAG = o.dragToFolder === true;
  const FOLDER_GLYPH = o.folderGlyph || 'mandelbrotSmall';
  const COVER = 'var(--folders-cover-scrim, hsl(0 0% 0% / .65))';

  const prefs = o.prefs || {};
  const S = {
    sort: Number.isInteger(prefs.sort) && SORTS[prefs.sort] ? prefs.sort : 0,
    parts: Object.fromEntries(PARTS.filter((p) => !p.soon).map((p) => [p.id, !(prefs.parts && prefs.parts[p.id] === false)])),
    folder: '', selected: null, held: null, page: 0
  };
  const persist = () => { if (typeof o.persist === 'function') { try { o.persist({ sort: S.sort, parts: { ...S.parts } }); } catch (_) {} } };

  const pageSize = Number.isInteger(o.pageSize) && o.pageSize > 0 ? o.pageSize : 0;
  const wrap = mk('div', 'sv-wrap' + (pageSize ? ' sv-paged' : ''), panel);

  /* The projects are the main surface. Keep the verbs in one fixed-height row. */
  const verbs = mk('div', 'sv-toolbar', wrap);
  const iconAction = (spec, cls, icon, fire) => {
    const tr = kit.trig({ label: '', title: spec[2], cls: 'sv-icon-action ' + cls, onFire: fire });
    const label = tr.root.querySelector('.trig-l');
    label.textContent = '';
    ink(label, icon, 20);
    kitAria(tr.root, '{verb} — {what}', { verb: { t: spec[0] }, what: { t: spec[1] } });   // tr: a button's name: its label, then what it acts on (SAVE — this project)
    verbs.appendChild(tr.root);
    return tr.root;
  };
  const BUILT = {
    project: () => iconAction(copy.project, 'sv-project', 'save', () => save()),
    capture: () => iconAction(copy.capture, 'sv-capture', 'camera', () => makePicture()),
    download: () => iconAction(copy.download, 'sv-download', 'download', () => savePicture()),
    duplicate: () => iconAction(copy.duplicate, 'sv-duplicate', 'duplicate', () => duplicateSelected()),
    fresh: () => iconAction(copy.fresh, 'sv-new', 'plus', () => fresh()),
  };
  /* THE TOOLBAR IS DATA (MIR 1.5.0-alpha.7, BASINS parity): `actions` names the verbs in order.  The default is BASINS'
     SAVE window exactly — PROJECT · CAPTURE · DOWNLOAD · DUPLICATE · NEW · the options disclosure — and a host adds its
     own through `extraActions` (FOLDERS offers SAVE · SAVE AS · NEW · OPEN FILE · EXPORT that way). */
  const live = PARTS.filter((p) => !p.soon);
  let partsBox = null, optionsBtn = null;
  BUILT.options = () => {
    if (!live.length) return null;                                  // nothing to disclose: no button (BASINS always has parts)
    /* BASINS' plain button (not a kit trigger): button.sv-options with the list glyph, its name and hint */
    optionsBtn = btn('sv-options', verbs, null, t('Project options'));
    ink(optionsBtn, 'bulletList', 20);
    optionsBtn.setAttribute('aria-expanded', 'false');
    optionsBtn.addEventListener('click', () => {
      if (!partsBox) return;
      partsBox.hidden = !partsBox.hidden; optionsBtn.setAttribute('aria-expanded', String(!partsBox.hidden));
    }, on);
    return optionsBtn;
  };
  const actionIds = Array.isArray(o.actions) ? o.actions : DEFAULT_ACTIONS;
  const actionEls = {};
  for (const id of actionIds) {
    const x = o.extraActions && o.extraActions[id];
    const node = x ? iconAction(x.copy, 'sv-' + id, x.icon, () => x.fire(api)) : BUILT[id] ? BUILT[id]() : null;
    if (node) { actionEls[id] = node; node.dataset.action = id; }
  }
  const projectBtn = actionEls.project || null, captureBtn = actionEls.capture || null, downloadBtn = actionEls.download || null;
  const duplicateBtn = actionEls.duplicate || null, freshBtn = actionEls.fresh || null;
  const able = (b, v) => { if (b) b.disabled = !v; };
  able(captureBtn, typeof adapter.picture === 'function');
  able(downloadBtn, false);
  able(duplicateBtn, false);
  if (typeof adapter.fresh !== 'function') able(freshBtn, false);

  /* The options expand in the sheet, moving the gallery down while keeping the window itself at its current size. */
  partsBox = live.length ? mk('section', 'sv-parts', wrap) : null;
  const partSw = {};
  if (partsBox) {
    partsBox.hidden = true;
    partsBox.id = 'sv-parts-' + Math.random().toString(36).slice(2, 8);
    kitAria(partsBox, 'Project components and display options');
    if (optionsBtn) optionsBtn.setAttribute('aria-controls', partsBox.id);
    const partsGrid = mk('div', 'sv-partgrid', partsBox);
    for (const p of live) {
      const s = kit.sw({ label: p.label, value: S.parts[p.id], cls: 'sv-part', title: ['Include {what} in the next save', { what: { t: p.label } }],   // tr: {what} is the name of a part of the project (LAYOUT, PICTURE …), as its switch is labelled
                         onChange: (v) => { S.parts[p.id] = v; paintParts(); persist(); } });
      s.root.dataset.part = p.id;
      partsGrid.appendChild(s.root);
      partSw[p.id] = s;
    }
    S.closeParts = () => { if (partsBox.hidden) return false; partsBox.hidden = true; if (optionsBtn) optionsBtn.setAttribute('aria-expanded', 'false'); return true; };
  }
  verbs.style.setProperty('--sv-verbs', String(verbs.children.length));

  /* ── NAME + SAVE TO ───────────────────────────────────────────────────── */
  const fields = mk('div', 'sv-fields', wrap);
  const field = (label, cls, max, placeholder) => {
    const row = mk('label', 'sv-field', fields);
    kitLabel(mk('span', 'sv-flabel', row), label);
    const inp = mk('input', 'sv-input ' + cls, row);
    inp.type = 'text'; inp.maxLength = max; inp.spellcheck = false; inp.autocomplete = 'off';
    if (placeholder) kitPh(inp, placeholder);
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); save(); } }, on);
    return inp;
  };
  const nameIn = field(copy.name, 'sv-name-input', 80, phrase('Name'));
  const toIn = field(copy.saveTo, 'sv-to-input', 320, phrase('{:ROOT} / folder'));
  kitAria(nameIn, 'Project name');
  kitAria(toIn, 'Save to folder');
  const toList = mk('datalist', null, fields);
  toList.id = 'sv-folders-' + Math.random().toString(36).slice(2, 8);
  toIn.setAttribute('list', toList.id);
  let nameTouched = false;
  const proposeName = () => { if (!nameTouched) nameIn.value = files.proposedName(toIn.value); };
  nameIn.addEventListener('input', () => { nameTouched = !!nameIn.value.trim(); }, on);
  toIn.addEventListener('input', proposeName, on);
  /* the one place a menu, a question or a refusal appears */
  const context = mk('div', 'sv-context', wrap); context.hidden = true;

  /* ── EXPLORER ─────────────────────────────────────────────────────────── */
  const explorer = mk('section', 'sv-explorer', wrap);
  kitAria(explorer, 'Saved projects and folders');
  const explorerScroll = mk('div', 'sv-explorer-scroll', explorer);
  const grid = mk('div', 'sv-grid', explorerScroll);

  const foot = mk('div', 'sv-foot', explorerScroll);
  if (typeof adapter.factory === 'function') {
    const fac = kit.trig({ label: copy.factory, cls: 'sv-factory', title: copy.factoryNote, onFire: async () => {
      fac.root.disabled = true;
      try {
        const r = await adapter.factory();
        if (r && r.ok && r.complete) say(r.said || t('The factory gallery is already complete.'));
        else if (r && r.ok) say(r.said || t('Restored {added} of {total}.', { added: r.added, total: r.total }));
        else if (r && r.full) showFull(r);
        else say(t('Could not restore the factory gallery: {why}', { why: (r && r.why) || 'unknown' }), true);
      } finally { fac.root.disabled = false; paint(); }
    } });
    foot.appendChild(fac.root);
  }
  if (!foot.children.length) foot.hidden = true;
  const pager = pageSize ? mk('nav', 'sv-pages', explorer) : null;
  let prevPage, nextPage, pageLabel;
  if (pager) {
    pager.setAttribute('aria-label', t('Project pages'));
    const chev = (b, name) => { const g = glyphEl(name); if (g) b.appendChild(g); return b; };   // the kit's own chevrons, drawn, not typed (Josh, 2026-10-07, call 18)
    prevPage = chev(btn('sv-page-prev', pager, null, t('Previous project page')), 'chevronLeft');
    pageLabel = mk('span', 'sv-page-label', pager);
    pageLabel.setAttribute('aria-live', 'polite');
    pageLabel.setAttribute('aria-atomic', 'true');
    nextPage = chev(btn('sv-page-next', pager, null, t('Next project page')), 'chevronRight');
    prevPage.addEventListener('click', () => turnPage(S.page - 1), on);
    nextPage.addEventListener('click', () => turnPage(S.page + 1), on);
  }
  const count = mk('div', 'sv-count', explorer);
  function turnPage(n) {
    S.page = n;
    selectCard(null);
    closeContext();
    paintExplorer();
  }
  function revealEntry(entry) {
    if (!pageSize || !entry) return;
    const direct = files.entries().filter(e => e.folder === S.folder).sort(entrySort);
    const i = direct.findIndex(e => e.id === entry.id);
    if (i >= 0) S.page = Math.floor(i / pageSize);
  }

  /* ════ behaviour ══════════════════════════════════════════════════════════ */

  function presence() { return { ...S.parts }; }
  function projection() {
    const p = presence();
    if (typeof adapter.projection === 'function') { try { const b = adapter.projection(p); if (Number.isFinite(b)) return b; } catch (_) {} }
    const es = files.entries().slice(-8);
    const thumb = es.length ? Math.round(es.reduce((n, e) => n + e.thumb.length, 0) / es.length) : 24000;
    const partBytes = es.length ? Math.round(es.reduce((n, e) => n + JSON.stringify(e.payload).length, 0) / es.length) : 3000;
    return thumb + 640 + partBytes;
  }
  function paintParts() {
    for (const [id, s] of Object.entries(partSw)) s.set(S.parts[id]);
  }

  let cleanSig = null;
  const sig = () => { try { return typeof adapter.signature === 'function' ? String(adapter.signature()) : null; } catch (_) { return null; } };
  const markClean = () => { cleanSig = sig(); };
  const dirty = () => (typeof adapter.signature !== 'function' ? { known: true, dirty: false }
    : cleanSig === null ? { known: false, dirty: true } : { known: true, dirty: sig() !== cleanSig });

  /* THE HOST'S LOCK (audit A3): while it returns a sentence nothing here may move the picture or capture a frame. */
  const locked = () => { let why = null; try { why = typeof adapter.locked === 'function' ? adapter.locked() : null; } catch (_) {} if (why) say(why, true); return !!why; };

  let busy = false;
  const setBusy = (v) => { busy = v; for (const b of [projectBtn, duplicateBtn]) if (b) b.disabled = v || (b === duplicateBtn && !S.selected); };
  async function save(so) {
    const s = so || {};
    if (locked()) return { ok: false, locked: true, why: 'locked by the host' };
    const p = presence();
    if (live.length && !Object.values(p).some(Boolean)) { say(t('Choose at least one project component before saving.'), true); return { ok: false, why: 'no components' }; }
    if (busy) return { ok: false, why: 'a save is already running' };
    setBusy(true);
    let r, cap = null;
    try {
      cap = await adapter.capture(p);
      r = cap && cap.payload
        ? files.save({ name: s.name != null ? s.name : nameIn.value, folder: s.folder != null ? s.folder : toIn.value, payload: cap.payload, thumb: cap.thumb || '', facts: cap.facts || {} })
        : { ok: false, why: 'nothing was captured' };
    } catch (e) { r = { ok: false, why: String((e && e.message) || e) }; }
    setBusy(false);
    if (r.ok) {
      markClean();
      nameTouched = false;
      S.folder = r.entry.folder;
      revealEntry(r.entry);
      S.selected = null;
      say(t('Saved — {name}', { name: r.entry.name }));
      if (typeof o.onSaved === 'function') o.onSaved(r.entry);
      paint();
    } else if (r.full) showFull(Object.assign(r, { name: s.name != null ? s.name : nameIn.value, folder: s.folder != null ? s.folder : toIn.value, captured: cap }));
    else say(t('Could not save: {why}', { why: r.why || 'unknown' }), true);
    return r;
  }

  function duplicateSelected() {
    const source = S.selected && files.entry(S.selected);
    if (!source || busy) return { ok: false, why: 'select a project to duplicate' };
    const facts = { ...(source.facts || {}) };
    for (const k of ['factoryId', 'libraryId', 'seedId', 'readOnly']) delete facts[k];
    const input = { name: source.name, folder: source.folder, payload: source.payload, thumb: source.thumb, facts };
    const r = files.save(input);
    if (r.ok) {
      S.folder = r.entry.folder;
      revealEntry(r.entry);
      S.selected = r.entry.id;
      say(t('Duplicated — {name}', { name: r.entry.name }));
      paint();
      const card = [...grid.querySelectorAll('.sv-card')].find((n) => n.dataset.entry === r.entry.id);
      if (card) card.scrollIntoView({ block: 'nearest' });
    } else if (r.full) showFull(Object.assign(r, { ...input, captured: { payload: input.payload, thumb: input.thumb, facts }, duplicate: true }));
    else say(t('Could not duplicate: {why}', { why: r.why || 'unknown' }), true);
    return r;
  }

  async function openEntry(id, oo) {
    const e = files.entry(id);
    if (!e) return { ok: false, why: 'no such project' };
    if (locked()) return { ok: false, locked: true, why: 'locked by the host' };
    const d = dirty();
    if (!(oo && oo.force) && (d.dirty || !d.known)) { askBeforeOpen(e, d); return { ok: false, asked: true }; }
    let r;
    try { r = await adapter.restore(e.payload, e); } catch (err) { r = { ok: false, why: String((err && err.message) || err) }; }
    if (r && r.ok !== false) { markClean(); S.selected = e.id; say(t('Opened — {name}', { name: e.name })); paint(); if (typeof o.onOpened === 'function') o.onOpened(e); return { ok: true, entry: e }; }
    say(t('Could not open {name}: {why}', { name: e.name, why: (r && r.why) || 'unknown' }), true);
    return { ok: false, why: r && r.why, rolledBack: r && r.rolledBack };
  }

  async function makePicture() {
    if (locked() || !captureBtn) return;
    captureBtn.disabled = true;
    captureBtn.setAttribute('aria-busy', 'true');
    kitAria(captureBtn, 'Making image');   // tr: the capture button's spoken name while it makes a still picture of the view (in progress)
    try {
      const held = await adapter.picture();
      if (held) { S.held = held; say(t('Picture made — {w}×{h}. Tap the download icon to keep it.', { w: held.w, h: held.h })); }
    } catch (e) { say(t('Could not make the picture: {why}', { why: String((e && e.message) || e) }), true); }
    finally { captureBtn.removeAttribute('aria-busy'); captureBtn.disabled = typeof adapter.picture !== 'function'; kitAria(captureBtn, 'Capture image'); paintPicture(); }   // tr: the button that takes a still picture of the current view
  }
  function paintPicture() {
    if (!downloadBtn) return;
    if (S.held && typeof adapter.pictureStale === 'function' && adapter.pictureStale(S.held)) S.held = null;
    downloadBtn.disabled = !S.held || typeof adapter.savePicture !== 'function';
    downloadBtn.classList.toggle('sv-download-ready', !!S.held);
    /* BASINS' words on the button: what it will hand over, or that a capture comes first */
    if (S.held) { kitAria(downloadBtn, 'Download image — {name}, {size}', { name: S.held.name, size: fmtBytes(S.held.bytes) }); downloadBtn.title = t('Download {name} · {w} × {h}', { name: S.held.name, w: S.held.w, h: S.held.h }); }   // tr[Download image — {name}, {size}]: saves the captured picture to the device: {name} its file name, {size} its file size (e.g. 2.4 MB) // tr[Download {name} · {w} × {h}]: the same button's hint: {w} × {h} the picture's width and height in pixels
    else { kitAria(downloadBtn, 'Download image — capture first'); downloadBtn.title = t(copy.download[2]); }   // tr: the download button before any picture exists: capture one first, then download it
  }
  function savePicture() {
    if (!S.held) return;
    if (typeof adapter.pictureStale === 'function' && adapter.pictureStale(S.held)) { S.held = null; paintPicture(); say(t('The view moved since the picture was made — capture it again.'), true); return; }
    /* NOTHING awaited before this line inside this tap: a file handed over after an await has lost the gesture */
    const via = adapter.savePicture(S.held);
    say(via === 'share' ? t('Handed to the share sheet — choose Save Image or Save to Files.') : t('Saved — {name}', { name: S.held.name }));
    paintPicture();
  }

  /* NEW ASKS FIRST (audit A1) when there is something it would throw away and it is not known to be saved. */
  async function fresh(fo) {
    if (locked()) return { ok: false };
    const d = dirty();
    let loses = true; try { if (typeof adapter.freshLoses === 'function') loses = !!adapter.freshLoses(); } catch (_) {}
    if (!(fo && fo.force) && loses && (d.dirty || !d.known)) { askBeforeFresh(d); return { ok: false, asked: true }; }
    let r;
    try { r = await adapter.fresh(); } catch (e) { r = { ok: false, why: String((e && e.message) || e) }; }
    if (r && typeof r === 'object' && r.ok === false) { say(t('Could not start over: {why}', { why: r.why || 'unknown' }), true); return r; }
    markClean();
    S.selected = null;
    say(typeof r === 'string' && r ? r : t('New — the empty project'));
    if (typeof o.onFresh === 'function') o.onFresh();
    paint();
    return { ok: true };
  }

  /* ── the one box: menus, questions, refusals ──────────────────────────── */
  function closeContext() { context.hidden = true; context.textContent = ''; context.className = 'sv-context'; context.style.removeProperty('top'); }
  function box(title, cls) { closeContext(); context.className = 'sv-context' + (cls ? ' ' + cls : ''); context.hidden = false; if (title) mk('div', 'sv-context-title', context, title); return context; }
  function action(parent, label, fn, cls) { const tr = kit.trig({ label, cls: 'sv-act' + (cls ? ' ' + cls : ''), onFire: fn }); parent.appendChild(tr.root); return tr; }
  /* the ask's pane: in the one box over the explorer, or — `seat`, an element the caller keeps below its own button (RENDER's
     FILES under OPEN ZIP…) — in that seat, so it opens where the hand is and nothing above it moves (the hand law) */
  function askBox(seat) {
    let b, close = closeContext;
    if (seat) { seat.textContent = ''; b = mk('div', 'sv-context sv-ask', seat); mk('div', 'sv-context-title', b, t('Save this first?')); close = () => { seat.textContent = ''; }; }
    else { b = box(t('Save this first?'), 'sv-ask'); b.style.top = explorer.offsetTop + 'px'; }   // THE HAND: the ask floats in its own place over the explorer (folders.css), so ROOT and the tiles under it do not move
    ink(btn('sv-ask-close', b, null, t('Cancel')), 'close', 16).addEventListener('click', close);
    return { b, close };
  }
  /** askBeforeOpen({ name }, d, go, seat) — "Save this first?" before what is on screen is replaced: SAVE & OPEN (save,
   *  then go), OPEN WITHOUT SAVING (go), × (nothing).  A library open and OPEN ZIP… (folders.js openZip) both ask it. */
  function askBeforeOpen(e, d, go = () => openEntry(e.id, { force: true }), seat = null) {
    const { b, close } = askBox(seat);
    mk('div', 'sv-context-text', b, t(d.known ? 'Opening "{name}" replaces what is on screen.' : 'Opening "{name}" replaces what is on screen, which may be unsaved.', { name: e.name }));
    const row = mk('div', 'sv-context-row', b);
    action(row, 'SAVE & OPEN', async () => { const r = await save(); if (r.ok) { close(); go(); } else if (!r.full) say(t('Could not save: {why} — nothing was opened.', { why: r.why || 'unknown' }), true); }, 'sv-primary');
    action(row, 'OPEN WITHOUT SAVING', () => { close(); go(); });
    if (seat) { b.scrollIntoView({ block: 'nearest' }); const first = row.querySelector('.trig'); if (first) first.focus({ preventScroll: true }); } else scrollIn();
  }
  function askBeforeFresh(d) {
    const { b } = askBox();
    mk('div', 'sv-context-text', b, t(d.known ? '{:NEW} starts the empty project.' : '{:NEW} starts the empty project. What is on screen may be unsaved.'));
    const row = mk('div', 'sv-context-row', b);
    action(row, 'SAVE & NEW', async () => { const r = await save(); if (r.ok) { closeContext(); fresh({ force: true }); } else if (!r.full) say(t('Could not save: {why} — nothing was cleared.', { why: r.why || 'unknown' }), true); }, 'sv-primary');
    action(row, 'NEW WITHOUT SAVING', () => { closeContext(); fresh({ force: true }); }, 'sv-danger');
    scrollIn();
  }
  function showFull(r) {
    const b = box(null);
    mk('div', 'sv-context-text', b, t('The library is full: {count} saved, {need} needed of {cap}.  This save was NOT stored.  Delete projects yourself, or make room — the oldest go first.',
      { count: r.count, need: fmtBytes(r.needChars), cap: fmtBytes(r.capChars) }));
    const row = mk('div', 'sv-context-row', b);
    /* ONE commit, with the capture already in hand (audit A4) */
    action(row, t('MAKE ROOM — delete oldest (“{name}”) and save', { name: r.oldestName || '' }), () => {
      const c = r.captured;
      if (!c || !c.payload) { say(t('Nothing was captured to save — save again.'), true); closeContext(); return; }
      const res = files.saveMakingRoom({ name: r.name, folder: r.folder, payload: c.payload, thumb: c.thumb || '', facts: c.facts || {} }, { consent: true });
      if (res.ok) {
        if (!r.duplicate) { markClean(); nameTouched = false; S.selected = null; }
        S.folder = res.entry.folder;
        revealEntry(res.entry);
        if (r.duplicate) S.selected = res.entry.id;
        closeContext();
        say(r.duplicate ? tn(res.evicted.length, 'Duplicated — {name} · made room by deleting {n} project', 'Duplicated — {name} · made room by deleting {n} projects', { name: res.entry.name })
          : tn(res.evicted.length, 'Saved — {name} · made room by deleting {n} project', 'Saved — {name} · made room by deleting {n} projects', { name: res.entry.name }));
        if (!r.duplicate && typeof o.onSaved === 'function') o.onSaved(res.entry);
        paint();
      } else say(t('Could not save: {why}', { why: res.why || 'unknown' }), true);
    }, 'sv-danger');
    action(row, 'CANCEL', closeContext);
    scrollIn();
  }
  function moveTo(e, path) {
    const r = files.move(e.id, path);
    if (r.ok) { say(r.unchanged ? t('{name} is already there', { name: r.entry.name }) : t('Moved {name} to {to}', { name: r.entry.name, to: r.to || t(copy.root) })); closeContext(); paint(); }
    else say(t('Could not move: {why}', { why: r.why }), true);
    return r;
  }
  function itemMenu(e) {
    selectCard(e.id);
    const b = box(e.name);
    if (S.folder) action(b, 'SET AS FOLDER PICTURE', () => {
      const r = files.setFolderPicture(S.folder, e.id);
      if (r.ok) { say(t('Folder picture set from {name}', { name: e.name })); closeContext(); paintExplorer(); } else say(t('Could not set the folder picture: {why}', { why: r.why }), true);
    }, 'sv-primary');
    /* MOVE TO — every folder as a button: the touch and keyboard way to do what a carried tile does (with dragToFolder) */
    const dests = DRAG ? ['', ...files.folders()].filter((f) => f !== e.folder) : [];
    if (dests.length) {
      mk('div', 'sv-context-label', b, t('MOVE TO'));
      const list = mk('div', 'sv-context-row sv-moveto', b);
      for (const f of dests) { const a = action(list, f ? f : copy.root, () => moveTo(e, f)); a.root.dataset.folder = f; }
    }
    const row = mk('div', 'sv-context-row sv-move', b);
    const inp = mk('input', 'sv-input', row); inp.type = 'text'; inp.value = e.folder; inp.placeholder = t('{:ROOT} or folder path'); inp.spellcheck = false;
    inp.setAttribute('aria-label', t('Move {name} to folder', { name: e.name }));
    inp.addEventListener('keydown', (ev) => ev.stopPropagation());
    action(row, 'MOVE', () => moveTo(e, inp.value));
    action(b, 'CLOSE', closeContext);
    scrollIn();
    const first = DRAG && (b.querySelector('.sv-moveto .trig') || b.querySelector('.sv-act'));   // the keyboard lands in MOVE TO
    if (first) first.focus({ preventScroll: true });
  }
  function folderMenu(path) {
    const b = box(path);
    const row = mk('div', 'sv-context-row sv-move', b);
    const inp = mk('input', 'sv-input', row); inp.type = 'text'; inp.value = path; inp.spellcheck = false;
    inp.setAttribute('aria-label', t('New folder path — onto an existing folder it merges'));
    inp.addEventListener('keydown', (ev) => ev.stopPropagation());
    action(row, 'RENAME', () => {
      const r = files.renameFolder(path, inp.value);
      if (r.ok) {
        if (inFolderTree(S.folder, path)) { const tail = S.folder.slice(path.length).replace(/^\//, ''); S.folder = normalizeFolder(r.to + (tail ? '/' + tail : '')); }
        say(r.renamed.length ? tn(r.renamed.length, 'Folder renamed to {to} · {n} project renamed to avoid a clash', 'Folder renamed to {to} · {n} projects renamed to avoid a clash', { to: r.to }) : t('Folder renamed to {to}', { to: r.to }));
        closeContext(); paint();
      } else say(t('Could not rename: {why}', { why: r.why }), true);
    });
    const rm = action(b, 'REMOVE FOLDER', () => {
      if (!rm.root.classList.contains('armed')) { rm.root.classList.add('armed'); rm.setLabel('MOVE CONTENTS TO {:ROOT}?'); return; }
      const r = files.deleteFolder(path);
      if (r.ok) { if (inFolderTree(S.folder, path)) S.folder = ''; say(tn(r.moved, 'Folder removed — {n} project moved to {:ROOT}', 'Folder removed — {n} projects moved to {:ROOT}')); closeContext(); paint(); }
      else say(t('Could not remove the folder: {why}', { why: r.why }), true);
    }, 'sv-danger');
    action(b, 'CLOSE', closeContext);
    scrollIn();
  }
  const scrollIn = () => { try { context.scrollIntoView({ block: 'nearest' }); } catch (_) {} };

  /* long-press (touch/pen) or right-click opens a menu; the click that follows a long-press is swallowed */
  function wireLongPress(target, open) {
    let timer = 0, x = 0, y = 0, suppressUntil = 0;
    const clear = () => { if (timer) clearTimeout(timer); timer = 0; };
    target.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0 || (ev.pointerType !== 'touch' && ev.pointerType !== 'pen')) return;
      x = ev.clientX; y = ev.clientY; clear();
      timer = setTimeout(() => { timer = 0; suppressUntil = Date.now() + 1000; try { navigator.vibrate && navigator.vibrate(12); } catch (_) {} open(); }, LONG_MS);
    }, { passive: true });
    target.addEventListener('pointermove', (ev) => { if (Math.hypot(ev.clientX - x, ev.clientY - y) > 10) clear(); }, { passive: true });
    target.addEventListener('pointerup', clear, { passive: true });
    target.addEventListener('pointercancel', clear, { passive: true });
    target.addEventListener('contextmenu', (ev) => { clear(); ev.preventDefault(); suppressUntil = Date.now() + 500; open(); });
    target.addEventListener('click', (ev) => { if (Date.now() >= suppressUntil) return; suppressUntil = 0; ev.preventDefault(); ev.stopImmediatePropagation(); }, true);
  }

  /* inline rename — the latch that makes Escape genuinely reversible */
  function renameInline(label, initial, commit) {
    const inp = mk('input', 'sv-input sv-inline'); inp.type = 'text'; inp.value = initial; inp.maxLength = 80; inp.spellcheck = false;
    label.replaceWith(inp);
    let done = false;
    const finish = (keep) => {
      if (done) return; done = true;
      const v = inp.value.trim();
      if (keep && v && v !== initial) { const r = commit(v); if (r && r.ok === false) say(t('Could not rename: {why}', { why: r.why || 'refused' }), true); }
      paint();
    };
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') { e.preventDefault(); finish(false); } });
    inp.addEventListener('blur', () => finish(true));
    inp.focus(); inp.select();
  }

  /* ── sorting (the flagship's six orders, folders sorted by what is inside them) ─ */
  const depthOf = (e) => (typeof adapter.depthOf === 'function' ? Number(adapter.depthOf(e)) : Number(e.facts && e.facts.depth)) || 0;
  function entrySort(a, b) {
    const m = SORTS[S.sort].id;
    if (m === 'az' || m === 'za') { const n = String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: 'base' }); return m === 'az' ? n : -n; }
    if (m === 'deep' || m === 'shallow') { const n = depthOf(a) - depthOf(b); return m === 'deep' ? -n : n; }
    const n = a.at - b.at; return m === 'new' ? -n : n;
  }
  function folderSort(a, b, entries) {
    const m = SORTS[S.sort].id;
    const la = leafOf(a), lb = leafOf(b);
    if (m === 'az' || m === 'za') { const n = la.localeCompare(lb, undefined, { numeric: true, sensitivity: 'base' }); return m === 'az' ? n : -n; }
    const inside = (path) => entries.filter((e) => inFolderTree(e.folder, path));
    const value = (list) => { if (!list.length) return 0;
      if (m === 'deep') return Math.max(...list.map(depthOf)); if (m === 'shallow') return Math.min(...list.map(depthOf));
      if (m === 'new') return Math.max(...list.map((e) => e.at)); return Math.min(...list.map((e) => e.at)); };
    const n = value(inside(a)) - value(inside(b));
    if (n) return (m === 'deep' || m === 'new') ? -n : n;
    return la.localeCompare(lb, undefined, { numeric: true, sensitivity: 'base' });
  }

  /* ── DRAG TO FOLDER: a carried tile lights the folders (core/proximity.js) ─────────────────────────────────── */
  const prox = createProximity({ layer: o.dropLayer || doc.body, reach: 96, capture: 8 });
  let carry = null;
  /** the drop targets: the folder cards in view and the crumbs above this folder, each at its exact rect */
  function dropTargets(e) {
    const out = [];
    for (const n of grid.querySelectorAll('.sv-folder[data-folder], .sv-crumb[data-folder]')) {
      const path = n.dataset.folder;
      if (path === e.folder) continue;
      const r = rect(n); if (!r.width || !r.height) continue;
      out.push({ id: path, rect: { left: r.left, top: r.top, width: r.width, height: r.height }, shape: 'rect' });
    }
    return out;
  }
  function wireCarry(shot, card, e) {
    return drag(shot, { slop: 6,
      onStart(s) {
        if (s.pointerType === 'touch' || locked()) return;              // a finger long-presses for the menu instead
        const r = rect(shot);
        const ghost = mk('div', 'sv-ghost', doc.body);
        ghost.setAttribute('aria-hidden', 'true');
        if (e.thumb) ghost.style.setProperty('--sv-thumb', 'url(' + JSON.stringify(e.thumb) + ')');
        setVar(ghost, 'width', r.width + 'px'); setVar(ghost, 'height', r.height + 'px');
        carry = { e, ghost, card, dx: s.x0 - r.left, dy: s.y0 - r.top, targets: dropTargets(e) };
        setVar(ghost, 'transform-origin', Math.round(carry.dx) + 'px ' + Math.round(carry.dy) + 'px');   // it shrinks round the hand, so the folder under it stays readable
        card.classList.add('lifted');
        closeContext();
        place(s);
      },
      onMove(s) { if (carry) place(s); },
      onEnd(s) {
        if (!carry) return;
        place(s);
        const c = carry, m = prox.end(); drop();
        if (m && m.captured) moveTo(c.e, m.captured.id);
      },
      onCancel() { if (!carry) return; prox.cancel(); drop(); },
    });
  }
  function place(s) {
    setVar(carry.ghost, 'translate', Math.round(s.x - carry.dx) + 'px ' + Math.round(s.y - carry.dy) + 'px');
    prox.update({ x: s.x, y: s.y }, carry.targets);
  }
  function drop() { if (!carry) return; carry.ghost.remove(); carry.card.classList.remove('lifted'); carry.dropped = Date.now(); lastDrop = Date.now(); carry = null; }
  let lastDrop = 0;

  /* ── the explorer ─────────────────────────────────────────────────────── */
  let tileLife = [];
  function selectCard(id) {
    const chosen = id && files.entry(id);
    S.selected = chosen && chosen.folder === S.folder ? id : null;
    if (duplicateBtn) duplicateBtn.disabled = !S.selected || busy;
    for (const card of grid.querySelectorAll('.sv-card')) {
      const active = card.dataset.entry === S.selected;
      card.classList.toggle('selected', active);
      const shot = card.querySelector('.sv-shot');
      shot.setAttribute('aria-pressed', String(active));
      shot.setAttribute('aria-label', t(active ? 'Open {name} — tap again' : 'Select {name}', { name: card.dataset.name }));
      if (!active) {
        const del = card.querySelector('.sv-del.armed');
        if (del) { del.classList.remove('armed'); del.textContent = ''; ink(del, 'close', 14); }
      }
    }
    if (typeof o.onInspect === 'function') o.onInspect(S.selected ? files.entry(S.selected) : null, { show: false });
  }
  function go(path) { S.folder = normalizeFolder(path); S.page = 0; selectCard(null); closeContext(); toIn.value = S.folder; nameTouched = false; proposeName(); paintExplorer(); }
  function paintExplorer() {
    for (const off of tileLife) { try { off(); } catch (_) {} }
    tileLife = [];
    const entries = files.entries();
    const all = new Set(files.folders());
    while (S.folder && !all.has(S.folder)) S.folder = S.folder.includes('/') ? S.folder.slice(0, S.folder.lastIndexOf('/')) : '';
    grid.textContent = '';
    const crumbs = mk('nav', 'sv-crumbs', grid);
    crumbs.setAttribute('aria-label', t('Current gallery folder'));
    const parts = S.folder ? S.folder.split('/') : [];
    const crumb = (label, target, current) => { const b = btn('sv-crumb', crumbs, label); b.dataset.folder = target; b.disabled = current; b.addEventListener('click', () => go(target)); };
    crumb(t(copy.root), '', !parts.length);
    let built = '';
    parts.forEach((part, i) => { mk('span', 'sv-crumb-sep', crumbs, '/'); built += (built ? '/' : '') + part; crumb(part, built, i === parts.length - 1); });

    const prefix = S.folder ? S.folder + '/' : '';
    const children = new Set();
    for (const p of all) { if (S.folder && p.indexOf(prefix) !== 0) continue; const rest = p.slice(prefix.length); if (!rest) continue; children.add(prefix + rest.split('/')[0]); }
    const folderRow = children.size ? mk('section', 'sv-folder-row', grid) : null;
    if (folderRow) folderRow.setAttribute('aria-label', t('Folders'));
    for (const path of [...children].sort((a, b) => folderSort(a, b, entries))) {
      const card = mk('div', 'sv-folder', folderRow);
      card.dataset.folder = path;
      const shot = btn('sv-folder-shot', card, null, t('Open folder {name}', { name: leafOf(path) }));
      const pic = files.folderPicture(path);
      /* BASINS' cover: the picture under a dimming wash, on the button itself (the scrim is a token) */
      if (pic && pic.thumb) { shot.style.backgroundImage = 'linear-gradient(' + COVER + ', ' + COVER + '), url(' + JSON.stringify(pic.thumb) + ')'; card.classList.add('has-cover'); }
      ink(mk('span', 'sv-folder-glyph', shot), 'saveFolder', 20);
      mk('span', 'sv-folder-name', shot, leafOf(path));
      const filesLine = mk('span', 'sv-folder-files', shot);
      ink(filesLine, FOLDER_GLYPH, 12);
      mk('span', null, filesLine, String(files.count(path, true)));
      shot.addEventListener('click', () => go(path));
      wireLongPress(shot, () => folderMenu(path));
    }

    const direct = entries.filter((e) => e.folder === S.folder).sort(entrySort);
    const projectSection = mk('section', 'sv-projects', grid);
    projectSection.setAttribute('aria-label', t('Projects'));
    const projectHeading = mk('div', 'sv-projects-heading', projectSection);
    ink(mk('span', 'sv-projects-glyph', projectHeading), 'projectFile', 15);
    mk('span', null, projectHeading, t('PROJECTS'));
    const projectGrid = mk('div', 'sv-project-grid', projectSection);
    if (pageSize) projectGrid.style.setProperty('--sv-page-rows', Math.ceil(pageSize / 2));
    const pages = pageSize ? Math.max(1, Math.ceil(direct.length / pageSize)) : 1;
    S.page = Math.max(0, Math.min(S.page, pages - 1));
    if (pager) {
      pageLabel.textContent = t('PAGE {page} / {of}', { page: S.page + 1, of: pages });
      prevPage.disabled = S.page === 0;
      nextPage.disabled = S.page === pages - 1;
    }
    const shown = pageSize ? direct.slice(S.page * pageSize, (S.page + 1) * pageSize) : direct;
    for (const e of shown) {
      const card = mk('div', 'sv-card' + (S.selected === e.id ? ' selected' : '') + (ro(e) ? ' read-only' : ''), projectGrid);
      card.dataset.entry = e.id;
      card.dataset.name = e.name;
      if (o.current && o.current() === e.id) card.dataset.current = 'true';
      const shot = btn('sv-shot', card, null, t(S.selected === e.id ? 'Open {name} — tap again' : 'Select {name}', { name: e.name }));
      shot.setAttribute('aria-pressed', String(S.selected === e.id));
      if (e.thumb) shot.style.setProperty('--sv-thumb', 'url(' + JSON.stringify(e.thumb) + ')');
      tileLife.push(pointerField(shot, { touch: true }));            // BASINS' parallax follows a finger too
      let pressX = null, pressY = 0, dragged = false;                  // BASINS: a press that travels > 10 px is not a tap
      shot.addEventListener('pointerdown', (ev) => { dragged = false; pressX = ev.clientX; pressY = ev.clientY; });
      shot.addEventListener('pointermove', (ev) => { if (pressX != null && ev.buttons && Math.hypot(ev.clientX - pressX, ev.clientY - pressY) > 10) dragged = true; });
      shot.addEventListener('pointerup', () => { pressX = null; });
      shot.addEventListener('pointercancel', () => { pressX = null; dragged = true; });
      if (DRAG) { const carried = wireCarry(shot, card, e); tileLife.push(() => carried.destroy()); }
      shot.addEventListener('click', () => {
        if (dragged) { dragged = false; return; }
        if (Date.now() - lastDrop < 400) return;                   // the click a carry's release makes is not a tap
        if (S.selected === e.id) openEntry(e.id); else selectCard(e.id);
      });
      wireLongPress(shot, () => itemMenu(e));
      const meta = mk('div', 'sv-meta', card);
      const name = mk('div', 'sv-name', meta, e.name);
      name.title = e.name + ' · ' + fmtBytes(e.bytes);
      const renameIt = () => { if (ro(e)) { say(t('{name} came with the app and cannot be renamed — {:DUPLICATE} makes your own copy', { name: e.name }), true); return; } renameInline(name, e.name, (v) => files.rename(e.id, v)); };
      const acts = mk('div', 'sv-acts', card);
      const info = ink(btn('sv-info', acts, null, t('Show the data for {name}', { name: e.name })), 'info', 18);
      info.addEventListener('click', () => { S.selected = e.id; paintExplorer(); if (typeof o.onInspect === 'function') o.onInspect(files.entry(e.id), { show: true }); });
      if (DRAG) ink(btn('sv-move-btn', acts, null, t('Move {name} to a folder', { name: e.name })), 'folder', 15).addEventListener('click', () => itemMenu(e));
      ink(btn('sv-rename', acts, null, t('Rename {name}', { name: e.name })), 'rename', 15).addEventListener('click', renameIt);
      const del = ink(btn('sv-del', acts, null, t('Delete {name}', { name: e.name })), 'close', 14);
      let tm = 0;
      del.addEventListener('click', () => {
        if (!del.classList.contains('armed')) { del.classList.add('armed'); del.textContent = t('sure?'); tm = setTimeout(() => { del.classList.remove('armed'); del.textContent = ''; ink(del, 'close', 14); }, ARM_MS); return; }
        clearTimeout(tm);
        const r = files.remove(e.id);
        if (r.ok) { if (S.selected === e.id) { S.selected = null; if (typeof o.onInspect === 'function') o.onInspect(null, { show: false }); } say(t('Deleted — {name}', { name: e.name })); if (typeof o.onRemoved === 'function') o.onRemoved(e); paint(); }
        else say(t('Could not delete: {why}', { why: r.why }), true);
      });
    }
    if (!direct.length) mk('div', 'sv-empty', projectGrid, t(S.folder ? copy.emptyFolder : copy.emptyRoot));
    count.textContent = tn(direct.length, '{n} PROJECT', '{n} PROJECTS') + ' · ' + tn(children.size, '{n} FOLDER', '{n} FOLDERS');
    if (S.selected && !direct.some((e) => e.id === S.selected)) { S.selected = null; if (typeof o.onInspect === 'function') o.onInspect(null, { show: false }); }
    if (duplicateBtn) duplicateBtn.disabled = !S.selected || busy;
  }

  doc.addEventListener('pointerdown', (ev) => {
    if (!panel.isConnected) return;
    const target = ev.target;
    if (S.selected && target.closest && !target.closest('.sv-card, .sv-duplicate, .sv-context, .sv-toolbar')) selectCard(null);
  }, on);
  doc.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape' || !panel.isConnected || (ev.target.classList && ev.target.classList.contains('sv-inline'))) return;
    if (carry) return;                                             // the carry's own Escape puts the tile back
    if (S.closeParts && S.closeParts()) ev.preventDefault();
    else if (!context.hidden) { closeContext(); ev.preventDefault(); }
    else if (S.selected) { selectCard(null); ev.preventDefault(); }
  }, on);

  function paint() {
    toList.textContent = '';
    for (const f of files.folders()) { const op = doc.createElement('option'); op.value = f; toList.appendChild(op); }
    if (doc.activeElement !== toIn) toIn.value = S.folder;
    if (doc.activeElement !== nameIn) proposeName();
    paintParts();
    paintPicture();
    paintExplorer();
  }
  // A write in another tab can arrive while a name is being edited. Keep the field in place until Enter, Escape or
  // blur settles it, then repaint.
  const unsub = files.subscribe(() => { if (panel.isConnected && !carry && !(doc.activeElement && doc.activeElement.classList.contains('sv-inline'))) paint(); });

  paint();
  const offLang = onLanguage(() => { if (panel.isConnected && !carry) paint(); });   // the words paint() writes come back in the new language
  const api = {
    root: wrap, toolbar: verbs, actions: actionEls, paint, save, fresh, openEntry, askBeforeOpen, markClean, closeContext, box, action, say,
    go, folder: () => S.folder, selected: () => (S.selected ? files.entry(S.selected) : null),
    select(id) { revealEntry(files.entry(id)); paintExplorer(); selectCard(id); return this.selected(); },
    sort: () => SORTS[S.sort], sorts: () => SORTS.slice(),
    setSort(i) { if (SORTS[i]) { S.sort = i; S.page = 0; paintExplorer(); persist(); } return SORTS[S.sort]; },
    cycleSort() { S.sort = (S.sort + 1) % SORTS.length; S.page = 0; paintExplorer(); persist(); return SORTS[S.sort]; },
    presence, projection, dirty, nameValue: () => nameIn.value, folderValue: () => toIn.value,
    carrying: () => !!carry,
    state: () => ({ page: S.page, pageSize, folder: S.folder, selected: S.selected, sort: SORTS[S.sort].id, parts: { ...S.parts },
                    held: S.held ? { w: S.held.w, h: S.held.h, bytes: S.held.bytes, name: S.held.name } : null,
                    count: count.textContent, contextOpen: !context.hidden, dirty: dirty(), carrying: !!carry }),
    destroy() { life.abort(); offLang(); unsub(); prox.destroy(); for (const off of tileLife) { try { off(); } catch (_) {} } tileLife = []; if (carry) drop(); wrap.remove(); }
  };
  return api;
}

export default buildGallery;
