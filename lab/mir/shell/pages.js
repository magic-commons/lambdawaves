/* MIR · shell/pages.js — THE PAGES: a project's markdown pages, as one pure model (no DOM, no storage, no globals).
 *
 * THE MENTALITY (Josh, 2026-10-01): "the multiple pages … are really just different .mds".  A page is a plain markdown
 * file: its title is its file name (as Obsidian has it), its text is the file.  A tutorial, a guide, a tour is whatever
 * someone writes in their pages; the kit has no system for them.
 *
 * WHO READS IT.  The notebook shows the pages as its tabs (shell/notebook.js).  INFORMATIONAL shows a page on the stage
 * (info/).  FOLDERS saves them inside the project through core/project.js — `registerProjectPart('pages', pages.part())`
 * — and never learns what a page is.  The shelf (notes/) holds pages that belong to no project; a page is COPIED between
 * the two (copyOut / add), never linked, so neither store reads the other.
 *
 * THE LAWS
 *   · pages[0] is the GREETING: the page shown when the project opens, if it has text and showOnOpen is on (plan
 *     ruling 16).  There is no other kind of page; the greeting is only a position.
 *   · A page is hidden from a visiting model unless `shared` is true (INFORMATIONAL plan §2.2, §3.5).
 *   · Ids are stable for the life of the project ('p1', 'p2' …) and never reused, so a tab, a label and an undo step can
 *     hold one.  Titles are free text and may repeat.
 *   · A write that changes nothing notifies nobody.  list() and get() hand out frozen copies, never the live rows.
 *   · capture() is null while there is nothing to save, so an empty project file carries no `pages` entry.
 *
 * createPages() → { list, get, index, add, update, remove, move, greeting, shouldGreet, showOnOpen (get/set),
 *                   copyOut, capture, beforeCapture, restore, signature, subscribe, part }
 * pageFromNotebook({ title, subtitle, text }) → { title, md }   a 1.4 project's notebook as its first page (ruling 16)
 * pageFile(page) → { name, text } · pageFromFile(name, text) → { title, md }   the .md on disk, either way */

const clean = (s) => String(s ?? '');
const row = (p) => Object.freeze({ id: p.id, title: p.title, md: p.md, shared: p.shared });

export function createPages() {
  let pages = [], showOnOpen = true, seq = 0;
  const watchers = new Set(), hooks = new Set();
  const tell = (what, id) => { for (const fn of watchers) { try { fn(what, id); } catch (_) {} } };
  const at = (id) => pages.findIndex((p) => p.id === id);

  const api = {
    list: () => pages.map(row),
    get: (id) => { const p = pages[at(id)]; return p ? row(p) : null; },
    index: (id) => at(id),
    /** add({ title, md, shared }, index?) → the new page.  No index: at the end. */
    add(page = {}, index = pages.length) {
      const p = { id: 'p' + (++seq), title: clean(page.title), md: clean(page.md), shared: page.shared === true };
      pages.splice(Math.max(0, Math.min(pages.length, index | 0)), 0, p);
      tell('add', p.id);
      return row(p);
    },
    /** update(id, { title?, md?, shared? }) → the page, or null if there is none.  An identical write is silent. */
    update(id, patch = {}) {
      const p = pages[at(id)]; if (!p) return null;
      let changed = false;
      for (const k of ['title', 'md']) if (k in patch && clean(patch[k]) !== p[k]) { p[k] = clean(patch[k]); changed = true; }
      if ('shared' in patch && (patch.shared === true) !== p.shared) { p.shared = patch.shared === true; changed = true; }
      if (changed) tell('update', id);
      return row(p);
    },
    remove(id) { const i = at(id); if (i < 0) return false; pages.splice(i, 1); tell('remove', id); return true; },
    move(id, to) {
      const i = at(id), j = Math.max(0, Math.min(pages.length - 1, to | 0)); if (i < 0 || i === j) return false;
      pages.splice(j, 0, pages.splice(i, 1)[0]); tell('move', id); return true;
    },
    greeting: () => (pages[0] ? row(pages[0]) : null),
    /** shouldGreet() → true when opening the project should show pages[0] */
    shouldGreet: () => showOnOpen && !!pages[0] && pages[0].md.trim() !== '',
    get showOnOpen() { return showOnOpen; },
    set showOnOpen(v) { v = v !== false; if (v !== showOnOpen) { showOnOpen = v; tell('showOnOpen', null); } },
    /** copyOut(id) → { title, md }: a page as a free copy, for the shelf or a file.  It carries no id and no `shared`. */
    copyOut: (id) => { const p = pages[at(id)]; return p ? { title: p.title, md: p.md } : null; },

    /** beforeCapture(fn) → off: fn runs at the top of every capture(), so a debounced editor (the notebook) writes its
        last keystrokes first.  A hook that throws is isolated: the capture goes on. */
    beforeCapture(fn) { hooks.add(fn); return () => hooks.delete(fn); },
    capture() {
      for (const fn of [...hooks]) { try { fn(); } catch (_) {} }
      return pages.length || !showOnOpen ? { v: 1, showOnOpen, pages: pages.map((p) => ({ ...p })) } : null;
    },
    /** restore(saved | null): the project's pages replace these.  null (a project with none) empties them.  Ids that
        came in the file are kept; a row without one, or with one already taken, gets the next free id. */
    restore(saved) {
      const src = saved && Array.isArray(saved.pages) ? saved.pages : [], seen = new Set();
      seq = src.reduce((m, p) => { const n = /^p(\d+)$/.exec(clean(p && p.id)); return n ? Math.max(m, +n[1]) : m; }, 0);
      pages = src.filter((p) => p && typeof p === 'object').map((p) => {
        let id = /^p\d+$/.test(clean(p.id)) && !seen.has(p.id) ? p.id : 'p' + (++seq);
        seen.add(id);
        return { id, title: clean(p.title), md: clean(p.md), shared: p.shared === true };
      });
      showOnOpen = !saved || saved.showOnOpen !== false;
      tell('restore', null);
    },
    signature: () => (showOnOpen ? '1' : '0') + pages.map((p) => `|${p.id}:${p.shared ? 's' : 'h'}:${p.title.length}:${hash(p.title + '\n' + p.md)}`).join(''),
    /** subscribe(fn(what, id)) → off.  what: add · update · remove · move · showOnOpen · restore */
    subscribe(fn) { watchers.add(fn); return () => watchers.delete(fn); },
    /** part() → what core/project.js registers */
    part: () => ({ capture: api.capture, restore: api.restore, signature: api.signature, subscribe: (fn) => api.subscribe(() => fn()) }),
  };
  return api;
}

/* a cheap, stable fingerprint (FNV-1a, 32 bit): the signature must not grow with the text */
function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); }

/** A 1.4 project's notebook (title, subtitle, text) as a page: the title stays the title, the subtitle becomes the
    first line in italics.  An empty notebook gives null, so a project that had no notes gets no greeting. */
export function pageFromNotebook({ title, subtitle, text } = {}) {
  const t = clean(title).trim(), s = clean(subtitle).trim(), body = clean(text);
  if (!body.trim() && !s) return null;
  return { title: t || 'NOTEBOOK', md: (s ? '*' + s + '*\n\n' : '') + body };
}

const SAFE = /[\\/:*?"<>|\u0000-\u001f]/g;
/** pageFile(page) → { name, text }: the file a page exports as.  The text is the page's markdown, byte for byte. */
export function pageFile(page) { return { name: (clean(page && page.title).replace(SAFE, ' ').replace(/\s+/g, ' ').trim() || 'Untitled') + '.md', text: clean(page && page.md) }; }
/** pageFromFile(name, text) → { title, md }: a dropped or imported .md.  The title is the file name without .md. */
export function pageFromFile(name, text) { return { title: clean(name).replace(/^.*[\\/]/, '').replace(/\.(md|markdown|txt)$/i, '') || 'Untitled', md: clean(text).replace(/^﻿/, '') }; }
