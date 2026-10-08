/* MIR · notes/face.js — THE SHELF's face in the notebook: your notes, their folders, the recent five, SAVE and
 * SAVE AS, export and import.  λWAVES' ▤ PROJECTS face (rack.js renderProjects, index.html .nb-projectsface), lifted
 * as the notebook's own and pointed at notes instead of projects.  mir/notes/notes.css draws it.
 *
 *   notesFace({ store, glyph, label }) → a face for createNotebook({ faces: [ … ] })
 *     store   a notes/shelf.js createShelf() (default: a fresh one on 'mir.notes')
 *   The face carries `store`, which is how the notebook finds the shelf for its COPY TO SHELF.
 *
 * WHAT IT DOES (λWAVES' behaviour kept; what is new is marked NEW)
 *   · SAVE AS takes "folder/name" from the field; the folder chips above the list fill the field's folder, as
 *     λWAVES' roots row does.  SAVE writes the note open in YOURS back to the path it came from (no path yet: it
 *     asks for one).  The list groups notes by folder, folders by name, newest save first within each.
 *   · A name opens the note into the notebook's YOURS tab (the notebook's openNote).  If YOURS holds text that is
 *     not on the shelf, the row asks "replace yours? yes / no" first (NEW: λWAVES confirmed a dirty project with
 *     window.confirm; the kit never uses a browser dialog).
 *   · ✎ renames in place (NEW) · × deletes after an inline "delete? yes / no" (NEW: λWAVES' × deleted at once) ·
 *     → copies the note into the open project as a page, when the notebook has pages (a copy, never a link).
 *   · RECENT: the last five saved or opened, as chips that open them.
 *   · EXPORT .MD saves the current note as a plain markdown file; IMPORT .MD adds files as notes (never over one).
 *   · A repaired store says so in the status line, with where the damaged text was kept.
 *   Keys typed in the fields never reach the app, except Ctrl/⌘+S and Ctrl/⌘+, (the notebook's own law). */
import { el, label as writeLabel, ariaLabel, hint } from '../kit.js';
import { t as tx, tn } from '../core/i18n.js';
import { createShelf } from './shelf.js';
import { APP_KEY, askInline } from '../shell/notebook.js';
import { saveBlob } from '../folders/save-blob.js';

const keep = (e) => { if (!APP_KEY(e)) e.stopPropagation(); };

export function notesFace({ store = createShelf(), glyph = '▤', label = 'shelf' } = {}) {
  let cur = null, base = null, nbApi = null, face = null;
  const btn = (cls, parent, text, title) => { const b = el('button', cls, parent, text); b.type = 'button'; if (title) b.title = title; return b; };   // text: data (a name); the kit's own words go through writeLabel
  const sig = (p) => p.title + '\n' + p.md;
  const dirty = () => { const y = nbApi.yours; return y.md.trim() !== '' && (cur === null || sig(y) !== base); };

  let path, roots, recentRow, list, status;
  const say = (s) => { status.textContent = s; };
  function build(f, api) {
    face = f; nbApi = api; base = sig(api.yours);
    writeLabel(el('div', 'ab-eyebrow', f), 'SHELF');   // tr[SHELF]: the SHELF: where your notes are kept in this browser (not the RACK, the column of windows)
    const row = el('div', 'nt-new', f);
    path = el('input', 'nt-path', row); path.placeholder = tx('folder/name'); path.spellcheck = false; ariaLabel(path, 'save as folder/name');
    const saveAs = writeLabel(btn('nt-saveas', row, '', 'save the note open in YOURS under this name'), 'SAVE AS');
    recentRow = el('div', 'nt-recent', f);
    roots = el('div', 'nt-roots', f);
    list = el('div', 'nt-list', f); list.setAttribute('role', 'list');
    const foot = el('div', 'nt-foot', f);
    const save = writeLabel(btn('nt-save', foot, '', 'save the note open in YOURS where it came from'), 'SAVE');
    const exp = writeLabel(btn('nt-export', foot, '', 'save the current note as a markdown file'), 'EXPORT .MD');
    const imp = writeLabel(btn('nt-import', foot, '', 'add markdown files to the shelf'), 'IMPORT .MD');
    status = el('span', 'nt-status', foot); status.setAttribute('role', 'status');

    saveAs.addEventListener('click', () => saveTo(path.value));
    save.addEventListener('click', () => { if (cur) saveTo(cur); else { say(tx('give it a name: folder/name')); path.focus(); } });
    path.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveTo(path.value); } keep(e); });
    exp.addEventListener('click', () => {
      if (!cur) { say(tx('nothing to export — save first')); return; }
      const file = store.exportNote(cur); if (!file) return;
      saveBlob(new Blob([file.text], { type: 'text/markdown' }), file.name); say(tx('saved {name}', { name: file.name }));
    });
    imp.addEventListener('click', () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.accept = '.md,.markdown,.txt,text/markdown,text/plain';
      inp.addEventListener('change', async () => { let n = 0, last = ''; for (const file of inp.files || []) { const p = store.importNote(file.name, await file.text(), folderOf(path.value)); if (p) { n++; last = p; } } say(n ? (n === 1 ? tx('imported {name}', { name: last }) : tn(n, 'imported {n} note', 'imported {n} notes')) : store.error || tx('nothing imported')); });
      inp.click();
    });
    store.subscribe(() => { if (face && !face.hidden) paint(); });
    if (store.repaired) say(tx('the shelf was damaged and has been mended — the old text is kept under {key}', { key: store.repaired.backup }));
    paint();
  }
  const folderOf = (p) => { const s = String(p || '').trim(), i = s.lastIndexOf('/'); return i < 0 ? '' : s.slice(0, i); };

  function saveTo(p) {
    const y = nbApi.yours, at = store.save(p, y);
    if (!at) { say(store.error); return; }
    cur = at; base = sig(y); path.value = at; say(tx('saved {name}', { name: at }));
  }
  function open(p, row) {
    const go = () => { const page = store.open(p); if (!page) return; cur = p; base = sig(page); nbApi.openNote(page); say(tx('opened {name}', { name: p })); };
    if (row && dirty() && p !== cur) askInline(row, { cls: 'nt', label: 'replace yours?', then: go })?.focus(); else go();
  }
  function rename(row, it) {
    if (row.dataset.renaming !== undefined) return;
    row.dataset.renaming = '';
    const inp = el('input', 'nt-rename'); inp.value = it.path; inp.spellcheck = false; ariaLabel(inp, 'rename to folder/name');
    row.insertBefore(inp, row.firstChild); inp.focus(); inp.select();
    let done = false;
    const end = (ok) => {
      if (done) return; done = true; delete row.dataset.renaming; inp.remove();   // `done` first: the removal blurs the field
      if (!ok || inp.value.trim() === it.path) return;
      const to = store.rename(it.path, inp.value);
      if (!to) { say(store.error); return; }
      if (cur === it.path) cur = to;
      say(tx('renamed to {name}', { name: to }));
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); end(true); } else if (e.key === 'Escape') { e.preventDefault(); end(false); } keep(e); });
    inp.addEventListener('blur', () => end(true));
  }

  function paint() {
    if (!list) return;
    const items = store.list(), recent = store.recent();
    recentRow.replaceChildren(); roots.replaceChildren(); list.replaceChildren();
    recentRow.hidden = !recent.length;
    if (recent.length) {
      writeLabel(el('span', 'nt-label', recentRow), 'RECENT');
      for (const p of recent) { const c = btn('nt-chip', recentRow, p.split('/').pop(), 'open ' + p); c.addEventListener('click', () => open(p, c)); }
    }
    if (!items.length) { writeLabel(el('div', 'nt-none', list), 'no notes yet — name one above and {:SAVE AS}'); return; }
    const by = new Map();
    for (const it of items) { if (!by.has(it.folder)) by.set(it.folder, []); by.get(it.folder).push(it); }
    const names = [...by.keys()].sort((a, b) => a.localeCompare(b));
    for (const f of names) {
      const c = btn('nt-root', roots, f || tx('(root)')); if (f) hint(c, 'save into {folder}', { folder: f }); else hint(c, 'save into no folder');   // tr[(root)]: the top of the shelf: the notes in no folder
      c.addEventListener('click', () => { const name = (path.value.split('/').pop() || '').trim(); path.value = (f ? f + '/' : '') + name; path.focus(); });
    }
    const toProject = !!(nbApi && nbApi.pages);
    for (const f of names) {
      el('div', 'nt-folder', list, f || tx('(root)'));
      for (const it of by.get(f)) {
        const row = el('div', 'nt-item', list); row.setAttribute('role', 'listitem'); row.dataset.path = it.path;
        if (it.path === cur) row.dataset.current = '';
        const nm = btn('nt-name', row, it.name); hint(nm, 'open {path} in your notes tab', { path: it.path });   // tr: your notes tab is the notebook’s first tab: the note you are writing, kept in this browser
        nm.addEventListener('click', () => open(it.path, row));
        el('span', 'nt-when', row, (it.saved || '').slice(0, 16).replace('T', ' '));
        const rn = btn('nt-act nt-ren', row, '✎', 'rename'); ariaLabel(rn, 'rename {name}', { name: it.path });
        rn.addEventListener('click', () => rename(row, it));
        if (toProject) {
          const cp = btn('nt-act nt-toproject', row, '→', 'copy into the project as a page'); ariaLabel(cp, 'copy {name} into the project', { name: it.path });
          cp.addEventListener('click', () => { const page = store.get(it.path); if (!page) return; const p = nbApi.pages.add(page); nbApi.select(p.id); say(tx('copied {name} into the project', { name: it.path })); });
        }
        const x = btn('nt-act nt-del', row, '×', 'delete'); ariaLabel(x, 'delete {name}', { name: it.path });
        x.addEventListener('click', () => askInline(row, { cls: 'nt', label: 'delete?', then: () => { if (store.remove(it.path)) { if (cur === it.path) cur = null; say(tx('deleted {name}', { name: it.path })); } } })?.focus());
      }
    }
  }

  return {
    id: 'shelf', glyph, label, title: 'your notes: save, open, folders, recent', store,
    build,
    show(f) { paint(); if (cur && path) path.value = cur; },
    /** the path of the note open in YOURS, or null */
    get current() { return cur; },
  };
}
