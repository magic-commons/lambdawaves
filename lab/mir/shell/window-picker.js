/* window-picker.js — THE FINDER (1.5.0-alpha.25 as the window picker, from λWAVES iteration 014 A7; after FL Studio's plugin picker, Josh: "where
 * you could look for MIR windows and have the ones that can't be opened be greyed out … a search bar").  1.5.0-alpha.31 (λWAVES 018 E5, Josh:
 * "Call this new feature 'finder' … 'Add window' has a fun feature where you could multi-add by holding shift. Let the new window adopt it"): it
 * replaces the rack's old + list, and takes its SHIFT queue and its ☆.
 *
 *   createWindowPicker({ rack, open, can, icon, cls, host }) → { root, open(), close(), toggle(), shown (isOpen), queued, destroy() }
 *     rack   the kit's rack (createRack): its windows() are the rows, its spec(id).glyph their glyph (a kit name or an app's own through
 *            registerGlyphs, 1.5.6-alpha.3), its lastFavourite() the ☆
 *     open   (id) → void, a press or Enter on an openable row (default rack.reveal: an open window is scrolled to, never moved; a closed one
 *            opens at the top of its rack)
 *     can    (id) → true | a word: a word greys the row and says why (λWAVES: HYDROGEN ONLY / MOLECULES ONLY); null leaves the row out
 *     icon   (id) → a key or null: the row carries data-icon=<key> and an empty `.wp-icon` seat for the app's own icon (λWAVES
 *            paints it with a CSS mask); else the window's kit glyph, else an empty seat, so the names stay in one column
 *     cls    extra classes for the surface (λWAVES: its Picker's `lw-menu`)
 *
 *   THE LAWS
 *   1. A search field and every window as a row, sorted by name; typing filters by name, and the first openable row that matches is
 *      the default (Enter opens it; ↑ ↓ move it).  A greyed row is listed, never hidden, and never opens.  No heading: the field says it.
 *   2. SHIFT-click queues a row (a number badge in pick order; again takes it out); letting SHIFT go opens the queue in that order, each new
 *      window at its rack's top, so the rack reads in pick order (rack.js openOrder).  A plain pick opens one.
 *   3. A row in the most recently saved ☆ layout wears the solid star.
 *   4. Escape, a press outside, or opening a window closes it.  The rows are read at each open, never kept.
 *   5. THE MOTION (GOL-NOTE.md §4): a spring open (the surface from 0.94 × 0.6, an overshoot), the rows entering 30 ms apart (capped
 *      at the twelfth), each with a faux motion blur — a stretched copy of itself at low alpha collapsing into it — and a fast 120 ms
 *      close.  Reduced motion (<html data-motion> or the system's) shows the end state at once.  All of it is CSS (window-picker.css). */
import { el, ariaLabel } from '../kit.js';
import { glyphEl, hasGlyph } from '../glyph.js';
import { t } from '../core/i18n.js';
import { queueToggle, openOrder } from './rack.js';

/** the motion's numbers: the stagger between rows and the row past which they all enter together */
export const WINDOW_PICKER = Object.freeze({ stagger: 30, cap: 12, close: 120 });

export function createWindowPicker({ rack, open = (id) => rack.reveal(id), can = () => true, icon = () => null, cls = '', host = document.body } = {}) {
  const root = el('div', ('mir-window-picker glass ' + cls).trim(), host); root.hidden = true;
  root.setAttribute('role', 'dialog'); ariaLabel(root, 'FINDER');   // tr[FINDER]: the finder: a search field over every window of the app; picking one opens it or scrolls the rack to it
  const input = el('input', 'wp-search', root); input.type = 'search'; input.spellcheck = false; input.autocomplete = 'off';
  input.placeholder = t('search windows'); ariaLabel(input, 'search windows');   // tr[search windows]: the finder's search field: type part of a window's name
  const list = el('div', 'wp-list', root); list.setAttribute('role', 'listbox'); ariaLabel(list, 'FINDER');
  const life = new AbortController(), on = { signal: life.signal };
  let rows = [], cur = null, shut = 0, queue = [];

  function build() {
    list.textContent = ''; rows = []; queue = [];
    const fav = typeof rack.lastFavourite === 'function' ? rack.lastFavourite() : null;
    const wins = rack.windows().filter((w) => !w.card && can(w.id) !== null).sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    wins.forEach((w, i) => {
      const ok = can(w.id), why = ok === true ? '' : String(ok || '');
      const b = el('button', 'wp-row', list); b.type = 'button'; b.dataset.win = w.id; b.setAttribute('role', 'option');
      b.style.setProperty('--i', String(Math.min(i, WINDOW_PICKER.cap)));
      const g = (rack.spec && rack.spec(w.id) || {}).glyph, k = icon(w.id);
      if (k) { b.dataset.icon = k; el('span', 'wp-glyph wp-icon', b); }   // the app paints its icon on this seat
      else if (g && hasGlyph(g)) b.appendChild(glyphEl(g, 'wp-glyph', 16)); else el('span', 'wp-glyph wp-none', b);
      el('span', 'wp-name', b, w.title);
      if (fav && fav.has(w.id)) { const st = el('span', 'wp-fav', b); st.appendChild(glyphEl('starFill', 'gly gly-starFill', 10)); ariaLabel(st, 'in the saved favourite layout'); }
      if (why) { b.setAttribute('aria-disabled', 'true'); b.classList.add('off'); el('span', 'wp-why', b, why); }
      else if (w.open) b.dataset.open = '';
      b.addEventListener('click', (e) => (e.shiftKey ? pick(b) : go(b)), on);
      b.addEventListener('pointermove', () => { if (!b.classList.contains('off')) mark(b); }, on);
      rows.push({ b, name: w.title.toLowerCase(), off: !!why });
    });
  }
  const live = () => rows.filter((r) => !r.b.hidden && !r.off);
  function mark(b) { if (cur) cur.classList.remove('on'); cur = b || null; if (cur) { cur.classList.add('on'); cur.scrollIntoView({ block: 'nearest' }); } }
  function filter() {
    const q = input.value.trim().toLowerCase();
    for (const r of rows) r.b.hidden = !!q && !r.name.includes(q);
    const l = live(); mark(l.length ? l[0].b : null);
  }
  function go(b) { if (!b || b.classList.contains('off')) return; const id = b.dataset.win; close(); open(id); }
  /** SHIFT-click: in or out of the queue, the badges renumbered in pick order */
  function pick(b) {
    if (!b || b.classList.contains('off')) return;
    queue = queueToggle(queue, b.dataset.win);
    for (const r of rows) {
      const k = queue.indexOf(r.b.dataset.win); r.b.classList.toggle('queued', k >= 0);
      let n = r.b.querySelector('.wp-num'); if (k < 0) { if (n) n.remove(); continue; }
      if (!n) n = el('span', 'wp-num', r.b); n.textContent = String(k + 1);
    }
  }
  function flush() { if (!queue.length) return; const ids = openOrder(queue); queue = []; close(); for (const id of ids) open(id); }

  function show() {
    if (!root.hidden && !root.classList.contains('wp-out')) return;
    clearTimeout(shut); root.classList.remove('wp-out');
    input.value = ''; build(); filter();
    root.hidden = false; root.classList.remove('wp-in'); void root.offsetWidth; root.classList.add('wp-in');
    input.focus({ preventScroll: true });
  }
  function close() {
    if (root.hidden || root.classList.contains('wp-out')) return;
    queue = []; root.classList.remove('wp-in'); root.classList.add('wp-out');
    shut = setTimeout(() => { root.hidden = true; root.classList.remove('wp-out'); list.textContent = ''; rows = []; cur = null; }, WINDOW_PICKER.close);
  }
  input.addEventListener('input', filter, on);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) pick(cur); else go(cur); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); const l = live().map((r) => r.b); if (!l.length) return;
      const i = l.indexOf(cur), n = e.key === 'ArrowDown' ? (i + 1) % l.length : (i - 1 + l.length) % l.length; mark(l[n]);
    }
  }, on);
  addEventListener('keyup', (e) => { if (e.key === 'Shift' && !root.hidden) flush(); }, on);
  document.addEventListener('pointerdown', (e) => { if (!root.hidden && !root.contains(e.target)) close(); }, { capture: true, signal: life.signal });

  const api = {
    root, open: show, close, toggle: () => (root.hidden || root.classList.contains('wp-out') ? show() : close()),
    get shown() { return !root.hidden && !root.classList.contains('wp-out'); }, get isOpen() { return this.shown; },
    /** the SHIFT queue in pick order (a copy) */
    get queued() { return queue.slice(); },
    /** open the SHIFT queue now, in pick order (the old + list's commit) */
    commit: flush,
    destroy() { life.abort(); clearTimeout(shut); root.remove(); if (rack && Object.getOwnPropertyDescriptor(rack, 'addMenu')?.get === alias) delete rack.addMenu; },
  };
  /* THE addMenu SHIM (1.5.5, deprecated; it leaves at the next line): the rack's old + list was `rack.addMenu` { open, close, shown, queued, commit };
     the FINDER answers the same five, so an app that still calls rack.addMenu reaches it (a warning once) */
  let warned = false;
  const alias = () => { if (!warned) { warned = true; console.warn('MIR 1.5.5: rack.addMenu is gone; it answers as the FINDER (createWindowPicker) until the next line'); } return api; };
  if (rack && typeof rack === 'object' && !('addMenu' in rack)) Object.defineProperty(rack, 'addMenu', { get: alias, configurable: true });
  return api;
}
