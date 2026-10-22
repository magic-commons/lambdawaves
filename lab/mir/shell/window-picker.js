/* window-picker.js — THE WINDOW PICKER (1.5.0-alpha.25, from λWAVES iteration 014 A7; after FL Studio's plugin picker, Josh: "where you
 * could look for MIR windows and have the ones that can't be opened be greyed out … a search bar").
 *
 *   createWindowPicker({ rack, open, can, icon, cls, host }) → { root, open(), close(), toggle(), isOpen, destroy() }
 *     rack   the kit's rack (createRack): its windows() are the rows, its spec(id).glyph their kit glyph
 *     open   (id) → void, a press or Enter on an openable row (default rack.raise)
 *     can    (id) → true | a sentence: a sentence greys the row and says why (λWAVES: the windows the other mode hides)
 *     icon   (id) → a key or null: the row carries data-icon=<key> and an empty `.wp-icon` seat for the app's own icon (λWAVES
 *            paints it with a CSS mask); else the window's kit glyph, else an empty seat, so the names stay in one column
 *     cls    extra classes for the surface (λWAVES: its Picker's `lw-menu`)
 *
 *   THE LAWS
 *   1. A search field and every window as a row, sorted by name; typing filters by name, and the first openable row that matches is
 *      the default (Enter opens it; ↑ ↓ move it).  A greyed row is listed, never hidden, and never opens.
 *   2. Escape, a press outside, or opening a window closes it.  The rows are read at each open, never kept.
 *   3. THE MOTION (GOL-NOTE.md §4): a spring open (the surface from 0.94 × 0.6, an overshoot), the rows entering 30 ms apart (capped
 *      at the twelfth), each with a faux motion blur — a stretched copy of itself at low alpha collapsing into it — and a fast 120 ms
 *      close.  Reduced motion (<html data-motion> or the system's) shows the end state at once.  All of it is CSS (window-picker.css). */
import { el, label, ariaLabel } from '../kit.js';
import { glyphEl, hasGlyph } from '../glyph.js';
import { t } from '../core/i18n.js';

/** the motion's numbers: the stagger between rows and the row past which they all enter together */
export const WINDOW_PICKER = Object.freeze({ stagger: 30, cap: 12, close: 120 });

export function createWindowPicker({ rack, open = (id) => rack.raise(id), can = () => true, icon = () => null, cls = '', host = document.body } = {}) {
  const root = el('div', ('mir-window-picker glass ' + cls).trim(), host); root.hidden = true;
  root.setAttribute('role', 'dialog'); ariaLabel(root, 'Windows');
  const head = el('div', 'wp-head', root); label(el('span', 'wp-title', head), 'WINDOWS');
  const input = el('input', 'wp-search', root); input.type = 'search'; input.spellcheck = false; input.autocomplete = 'off';
  input.placeholder = t('search the windows'); ariaLabel(input, 'search the windows');
  const list = el('div', 'wp-list', root); list.setAttribute('role', 'listbox'); ariaLabel(list, 'Windows');
  const life = new AbortController(), on = { signal: life.signal };
  let rows = [], cur = null, shut = 0;

  function build() {
    list.textContent = ''; rows = [];
    const wins = rack.windows().filter((w) => !w.card).sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    wins.forEach((w, i) => {
      const ok = can(w.id), why = ok === true ? '' : String(ok || '');
      const b = el('button', 'wp-row', list); b.type = 'button'; b.dataset.win = w.id; b.setAttribute('role', 'option');
      b.style.setProperty('--i', String(Math.min(i, WINDOW_PICKER.cap)));
      const g = (rack.spec && rack.spec(w.id) || {}).glyph, k = icon(w.id);
      if (k) { b.dataset.icon = k; el('span', 'wp-glyph wp-icon', b); }   // the app paints its icon on this seat
      else if (g && hasGlyph(g)) b.appendChild(glyphEl(g, 'wp-glyph', 16)); else el('span', 'wp-glyph wp-none', b);
      el('span', 'wp-name', b, w.title);
      if (why) { b.setAttribute('aria-disabled', 'true'); b.classList.add('off'); el('span', 'wp-why', b, why); }
      else if (w.open) b.dataset.open = '';
      b.addEventListener('click', () => go(b), on);
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

  function show() {
    if (!root.hidden && !root.classList.contains('wp-out')) return;
    clearTimeout(shut); root.classList.remove('wp-out');
    input.value = ''; build(); filter();
    root.hidden = false; root.classList.remove('wp-in'); void root.offsetWidth; root.classList.add('wp-in');
    input.focus({ preventScroll: true });
  }
  function close() {
    if (root.hidden || root.classList.contains('wp-out')) return;
    root.classList.remove('wp-in'); root.classList.add('wp-out');
    shut = setTimeout(() => { root.hidden = true; root.classList.remove('wp-out'); list.textContent = ''; rows = []; cur = null; }, WINDOW_PICKER.close);
  }
  input.addEventListener('input', filter, on);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Enter') { e.preventDefault(); go(cur); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); const l = live().map((r) => r.b); if (!l.length) return;
      const i = l.indexOf(cur), n = e.key === 'ArrowDown' ? (i + 1) % l.length : (i - 1 + l.length) % l.length; mark(l[n]);
    }
  }, on);
  document.addEventListener('pointerdown', (e) => { if (!root.hidden && !root.contains(e.target)) close(); }, { capture: true, signal: life.signal });

  return {
    root, open: show, close, toggle: () => (root.hidden || root.classList.contains('wp-out') ? show() : close()),
    get isOpen() { return !root.hidden && !root.classList.contains('wp-out'); },
    destroy() { life.abort(); clearTimeout(shut); root.remove(); },
  };
}
