/* controls/select.js — THE LIST PANE and the SELECT: the kit's own choose-one control for a long list of data.
 *
 * THE LAW IT KEEPS: A LIST OPENS IN THE KIT'S ONE MENU PANE, never in the platform's.  A native <select> draws its own popup
 * (no frost, no theme, no touch size, no keyboard law of ours), so the kit does not use one (docs/CONTROLS.md).  The pane is a
 * `.glass[data-mir-surface="menu"]` on the body: the menu height of INTENT's four, the card style's material, and it closes on
 * an outside press, Escape, a resize or the page losing focus.  A row is THE FINDER's (34 px; a finger's is the 44 px touch seat), its word on one line
 * ending in an ellipsis when it is too long (the whole word is then the row's hint; 1.6.0-alpha.47); an item marked `coming`
 * is shown and never chosen; the keys are the listbox's (arrows, which wrap at both ends; Home, End, Enter, a typed letter, Escape).
 *   listPane({ anchor, items, value, onPick, onClose, label, cls, signal }) → { root, close(), items }   one pane for the stepper and the select
 *   select({ label, aria, title, options, value, onChange, placeholder, cls, disabled, repick })   (`options` was `items`, which still reads; `title` hints the root) → { root, button, get, set(id), setItems(list, id), open(), close(), isOpen, setDisabled(on), destroy() }
 * items: [{ id, label, vars?, coming?, pic?, title? }] — the same record the stepper takes (`pic` a picture at the row's left, loaded lazily;
 * `title` its hint; `repick: true` — a press on the chosen row still calls onChange; 1.5.6-alpha.4).  Words go through label() and so translate.
 * No pollers, no timers: the pane is placed once from one rect read, and idle costs nothing. */
import { el, label, ariaLabel, hint } from '../kit.js';
import { setGlyph } from '../glyph.js';
import { escapeLayer } from '../shell/menubar.js';

/** the live (choosable) items of a list */
export const liveItems = (items) => items.filter((i) => !i.coming);

/** typeahead(items, from, typed) → the index of the next live item whose label starts with `typed` after `from` (-1: none) — pure, for tests */
export function typeahead(items, from, typed) {
  const t = String(typed || '').toLowerCase();
  if (!t) return -1;
  const n = items.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n, it = items[i];
    if (!it.coming && String(it.label).toLowerCase().startsWith(t)) return i;
  }
  return -1;
}

/** walk(n, at, d) → the index one step `d` (±1) from `at` in a list of n, WRAPPING at both ends; from nowhere (at < 0) ↓ is the first and ↑ the
 *  last — pure, for tests.  One walk for the open pane and the closed button (1.6.0-alpha.21: the select stopped at its ends, alone among the lists) */
export const walk = (n, at, d) => (n ? (at < 0 ? (d > 0 ? 0 : n - 1) : (at + d + n) % n) : -1);

/** where the pane goes: below the anchor while there is room, else above, clamped to the viewport (pure, for tests) */
export function placePane(a, pane, view, gap = 4, margin = 8) {
  const room = (view.h - a.bottom) - margin - gap, above = a.top - margin - gap;   // the gap is taken from the ROOM, never from the pane (1.6.0-alpha.64: a list that fitted lost 4 px and scrolled by them)
  const down = pane.h <= room || room >= above;
  const h = Math.max(88, Math.min(pane.h, down ? room : above));
  const w = Math.max(pane.w, a.width);
  return { top: down ? a.bottom + gap : Math.max(margin, a.top - gap - h), left: Math.max(margin, Math.min(view.w - w - margin, a.left)), maxHeight: h, minWidth: a.width, down };
}

let open = null;                                         // one list pane per page: opening another closes this one

/** listPane — see the header */
export function listPane({ anchor, items, value, onPick, onClose, label: name, cls, signal } = {}) {
  if (open) open.close();
  const doc = anchor.ownerDocument, win = doc.defaultView;
  const root = el('div', 'mir-pick glass' + (cls ? ' ' + cls : ''), doc.body);
  root.dataset.mirSurface = 'menu'; root.setAttribute('role', 'listbox'); root.tabIndex = -1;
  if (name) ariaLabel(root, name);
  const rows = new Map();
  for (const it of items) {
    const b = el('button', 'mir-pick-i' + (it.coming ? ' coming' : '') + (it.id === value ? ' on' : ''), root); b.type = 'button';
    b.setAttribute('role', 'option'); b.setAttribute('aria-selected', String(it.id === value)); b.dataset.id = String(it.id);
    if (it.pic) { const p = el('img', 'mir-pick-pic', b); p.alt = ''; p.loading = 'lazy'; p.decoding = 'async'; p.src = it.pic; p.onerror = () => { p.style.visibility = 'hidden'; }; }   // 1.5.6-alpha.4: `pic` — a row's picture at its left, read lazily (λWAVES' MOLECULES chooser)
    const word = label(el('span', 'mir-pick-t', b), it.label, it.vars);   // 1.6.0-alpha.47: the word in its own box, so one too long for the pane ends in an ellipsis
    b.title = it.title || word.textContent;                              // … and the whole name is the row's hint
    if (it.coming) { b.setAttribute('aria-disabled', 'true'); b.tabIndex = -1; b.addEventListener('mousedown', (e) => e.preventDefault()); }   // a row that cannot be chosen does not take the focus either
    else b.addEventListener('click', () => { const id = it.id; close(true); if (onPick) onPick(id); });
    rows.set(it.id, b);
  }
  const live = () => [...root.querySelectorAll('.mir-pick-i:not(.coming)')];
  let typed = '', typedAt = 0, closed = false;
  const focusAt = (b) => { if (b) { b.focus({ preventScroll: true }); b.scrollIntoView({ block: 'nearest' }); } };
  root.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const L = live(), at = L.indexOf(doc.activeElement);
    if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); return; }
    if (e.code === 'Tab') { close(false); return; }
    let to = null;
    if (e.code === 'ArrowDown') to = L[walk(L.length, at, 1)];        // the walk WRAPS (1.6.0-alpha.21), as the stepper's, the seg's and the menus'
    else if (e.code === 'ArrowUp') to = L[walk(L.length, at, -1)];
    else if (e.code === 'Home') to = L[0];
    else if (e.code === 'End') to = L[L.length - 1];
    else if (e.key.length === 1 && e.key !== ' ') {
      const now = e.timeStamp; typed = now - typedAt < 700 ? typed + e.key : e.key; typedAt = now;
      const i = typeahead(items, items.findIndex((x) => x.id === (at >= 0 ? L[at].dataset.id : value)), typed);
      if (i >= 0) to = rows.get(items[i].id);
    } else return;
    e.preventDefault(); e.stopPropagation();
    focusAt(to);
  });
  const outside = (e) => { if (!root.contains(e.target) && !anchor.contains(e.target)) close(false); };
  doc.addEventListener('pointerdown', outside, true);
  win.addEventListener('resize', closeNow); win.addEventListener('blur', closeNow);
  if (signal) signal.addEventListener('abort', closeNow, { once: true });
  function closeNow() { close(false); }
  let offEsc = escapeLayer(() => { offEsc = null; close(true); });   // a layer of the app's Escape stack while it is open (1.6.0-alpha.53)
  function close(refocus) {
    if (closed) return; closed = true;
    doc.removeEventListener('pointerdown', outside, true); win.removeEventListener('resize', closeNow); win.removeEventListener('blur', closeNow);
    if (offEsc) { offEsc(); offEsc = null; }
    root.remove(); if (open === api) open = null;
    if (refocus) try { anchor.focus({ preventScroll: true }); } catch (_) {}
    if (onClose) onClose();
  }
  /* placed once: one rect read for the anchor, one for the pane */
  const a = anchor.getBoundingClientRect(), p = root.getBoundingClientRect();
  const at = placePane(a, { w: p.width, h: p.height }, { w: win.innerWidth, h: win.innerHeight });
  Object.assign(root.style, { top: at.top + 'px', left: at.left + 'px', maxHeight: at.maxHeight + 'px', minWidth: at.minWidth + 'px' });
  root.dataset.dir = at.down ? 'down' : 'up';
  focusAt(rows.get(value) && !rows.get(value).classList.contains('coming') ? rows.get(value) : live()[0]);
  const api = { root, close: (r = false) => close(r), items };
  open = api;
  return api;
}

/** select — see the header */
export function select(o = {}) {
  const root = el('div', 'mir-select' + (o.cls ? ' ' + o.cls : ''));
  if (o.label) label(el('div', 'k-lbl', root), o.label);
  const btn = el('button', 'mir-sel-b', root); btn.type = 'button';
  btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
  const text = el('span', 'mir-sel-t', btn); setGlyph(el('i', 'mir-sel-c', btn), 'chevronDown');
  if (o.aria || o.label) ariaLabel(btn, o.aria || o.label);
  if (o.title) hint(root, o.title);
  let items = o.options || o.items || [], v = o.value, pane = null;   // `options` is the list's one name (1.6.0-alpha.23); `items` still reads
  const paint = () => {
    const it = items.find((i) => i.id === v);
    if (it) label(text, it.label, it.vars); else label(text, o.placeholder || '—');
    root.classList.toggle('empty', !it);
  };
  const choose = (id, user = true) => { if (id === v) return; v = id; paint(); if (user && o.onChange) o.onChange(v); };
  const close = (refocus) => { if (pane) pane.close(refocus); };
  const openIt = () => {
    if (pane || btn.disabled) return;
    pane = listPane({ anchor: btn, items, value: v, label: o.aria || o.label, onPick: (id) => (id === v && o.repick ? o.onChange && o.onChange(v) : choose(id)), onClose: () => { pane = null; btn.setAttribute('aria-expanded', 'false'); } });
    btn.setAttribute('aria-expanded', 'true');
  };
  btn.addEventListener('click', () => (pane ? close(false) : openIt()));
  btn.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) return;
    const L = liveItems(items), at = L.findIndex((x) => x.id === v);
    if (e.code === 'ArrowDown' && e.altKey) { e.preventDefault(); openIt(); return; }
    if (e.altKey) return;
    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') { e.preventDefault(); if (L.length) choose(L[walk(L.length, at, e.code === 'ArrowDown' ? 1 : -1)].id); }
    else if (e.code === 'Home' || e.code === 'End') { e.preventDefault(); if (L.length) choose(L[e.code === 'Home' ? 0 : L.length - 1].id); }
  });
  paint();
  return { root, button: btn, get: () => v, set(id) { v = id; paint(); }, setItems(list, id) { items = list; if (id !== undefined) v = id; paint(); },
    open: openIt, close, get isOpen() { return !!pane; },
    setDisabled(on) { btn.disabled = !!on; root.classList.toggle('disabled', !!on); if (on) close(false); },
    destroy() { close(false); root.remove(); } };
}
