/* controls/stepper.js — THE STEPPER: `‹ NAME ›`, one of five or more modes in order, and the page turner.
 *
 * THE LAW IT KEEPS: ONE BUILD OF "STEP THROUGH A LIST".  The census found five (the GUI's, BASINS' blend picker and SAVE pager,
 * λWAVES' palette and transport step); this is the GUI's, generalised, and the others use it.  Two round 44 px buttons around a
 * live name (`aria-live`); the arrows wrap; an item marked `coming` is listed and never chosen (the arrows skip it and stand down
 * when nothing else can be reached); the keys are ← and → on the row, and on the name ↑ ↓ step as a closed select's do (Alt+↓
 * opens the list: one law for ↑ ↓ on a closed list, wave 19).  A TAP ON THE NAME OPENS THE FULL LIST in the kit's menu pane
 * (controls/select.js `listPane`), so a long ordered list (twelve blend modes) is one tap from any entry, not eleven.  By the rules of
 * docs/INTENT.md: no relief at rest, hover a lighter face, press a sink and a small scale, focus an accent ring outside.
 *   stepper({ label, aria, items, value, onChange, wrap, list, pager, count, compact, cls })
 *     items   [{ id, label, vars?, coming? }]
 *     onChange(id, dir)   dir is −1 / +1 for an arrow, 0 for a pick from the list
 *     wrap    false stops at the ends (default true)
 *     list    false: the name is a label, not an opener (default true)
 *     pager   true: the PAGE TURNER form (BASINS' rack-card pager): the list is off, the name is a label
 *     count   true: the name is followed by `n / N` (a pager that says where it is)
 *     compact true: no arrows in the DOM (a strip a finger wide): the name opens the list, ← → still step it from the keys
 *   → { root, prev, next, name, get, set(id), setItems(items, id), step(d), open(), close(), destroy() }
 * Styled by controls.css; the buttons are `.mir-step-b[data-step="-1|1"]`, the name `.mir-step-name`. */
import { el, label, ariaLabel, mathPlain } from '../kit.js';
import { t as tx, onLanguage } from '../core/i18n.js';
import { listPane, liveItems } from './select.js';
import { glyphEl } from '../glyph.js';

/* the seat's unseen words are drawn by CSS (`content: attr(data-w)`), so they are not the name's text; a language change
   writes them again — one listener for the page, not one per stepper */
const sizeWord = (s) => { let vars; try { vars = s.dataset.vars ? JSON.parse(s.dataset.vars) : undefined; } catch (_) { /* none */ } s.dataset.w = mathPlain(tx(s.dataset.en, vars)); };
if (typeof document !== 'undefined') onLanguage(() => { for (const s of document.querySelectorAll('.mir-step-size')) sizeWord(s); });

/** next(items, id, d, wrap) → the id `d` live steps from `id` (null: nowhere to go) — pure, for tests */
export function stepTo(items, id, d, wrap = true) {
  const L = liveItems(items); if (L.length < 2) return null;
  const at = L.findIndex((x) => x.id === id);
  const j = at < 0 ? (d > 0 ? 0 : L.length - 1) : wrap ? (at + d + L.length) % L.length : Math.max(0, Math.min(L.length - 1, at + d));
  return L[j].id === id ? null : L[j].id;
}

export function stepper(o = {}) {
  const pager = !!o.pager, canList = o.list !== false && !pager;
  const root = el('div', 'mir-step' + (pager ? ' mir-step-pager' : '') + (o.cls ? ' ' + o.cls : ''));
  if (o.label) label(el('div', 'k-lbl', root), o.label);
  const row = el('div', 'mir-step-row', root);
  const compact = !!o.compact;                       // the arrows are made (the API keeps them) but never seated
  if (compact) root.dataset.compact = '';
  /* the arrows are DRAWN (glyph.js chevrons; Josh, 2026-10-07, call 18), sized by the button's font (controls.css) */
  const arrow = (name) => { const b = el('button', 'mir-step-b', compact ? null : row); b.type = 'button'; const g = glyphEl(name); if (g) b.appendChild(g); return b; };
  const prev = arrow('chevronLeft'); prev.dataset.step = '-1';
  const name = el(canList ? 'button' : 'div', 'mir-step-name', row);
  if (canList) { name.type = 'button'; name.setAttribute('aria-haspopup', 'listbox'); name.setAttribute('aria-expanded', 'false'); }
  /* THE HAND (1.5.0-alpha.19): the name's seat is as wide as its LONGEST option — every option's word sits unseen in the
     same grid cell (controls.css .mir-step-seat), so the arrows never move when the name changes, in any language */
  const seat = el('span', 'mir-step-seat', name);
  const text = el('span', 'mir-step-text', seat); text.setAttribute('aria-live', 'polite');
  const count = o.count ? el('span', 'mir-step-count', name) : null;
  const next = arrow('chevronRight'); next.dataset.step = '1';
  ariaLabel(prev, 'previous'); ariaLabel(next, 'next');
  if (o.aria || o.label) ariaLabel(row, o.aria || o.label);
  row.setAttribute('role', 'group');
  let items = o.items || [], v = o.value, pane = null;
  const sizeSeat = () => {                           // once when built, and again when the options change
    for (const s of seat.querySelectorAll('.mir-step-size')) s.remove();
    for (const it of items) { if (typeof it.label !== 'string' || !it.label) continue;
      const s = el('span', 'mir-step-size', seat); s.setAttribute('aria-hidden', 'true'); s.dataset.en = it.label; if (it.vars) s.dataset.vars = JSON.stringify(it.vars); sizeWord(s); }
  };
  sizeSeat();
  const paint = () => {
    const it = items.find((i) => i.id === v) || liveItems(items)[0];
    label(text, it ? it.label : '—', it && it.vars);
    const L = liveItems(items), i = L.findIndex((x) => x.id === v), wrap = o.wrap !== false;
    if (count) count.textContent = L.length > 1 ? ' ' + (Math.max(0, i) + 1) + ' / ' + L.length : '';
    prev.disabled = L.length < 2 || (!wrap && i <= 0); next.disabled = L.length < 2 || (!wrap && i >= L.length - 1);
    if (canList) name.disabled = L.length < 2 && !items.some((x) => x.coming);
  };
  const step = (d) => {
    const to = stepTo(items, v, d, o.wrap !== false);
    if (to === null) return;
    v = to; paint(); if (o.onChange) o.onChange(v, d);
  };
  const close = (refocus) => { if (pane) pane.close(refocus); };
  const openIt = () => {
    if (!canList || pane || name.disabled) return;
    pane = listPane({ anchor: name, items, value: v, label: o.aria || o.label, onPick: (id) => { if (id !== v) { v = id; paint(); if (o.onChange) o.onChange(v, 0); } },
      onClose: () => { pane = null; name.setAttribute('aria-expanded', 'false'); } });
    name.setAttribute('aria-expanded', 'true');
  };
  prev.addEventListener('click', () => step(-1)); next.addEventListener('click', () => step(1));
  if (canList) {
    name.addEventListener('click', () => (pane ? close(false) : openIt()));
    /* ONE LAW FOR ↑ ↓ ON A CLOSED LIST, the select's (docs/CONTROLS.md: "on the closed button ↑ ↓ step like a platform
       select, Alt+↓ opens"): ↑ the previous, ↓ the next (the stepper's own wrap); Alt+↓ opens the list */
    name.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || (e.code !== 'ArrowDown' && e.code !== 'ArrowUp')) return;
      if (e.altKey) { if (e.code === 'ArrowDown') { e.preventDefault(); openIt(); } return; }
      e.preventDefault(); step(e.code === 'ArrowDown' ? 1 : -1);
    });
  }
  row.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    let rtl = false; try { rtl = row.matches(':dir(rtl)'); } catch (_) {}
    const fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.code === back) { e.preventDefault(); step(-1); } else if (e.code === fwd) { e.preventDefault(); step(1); }
  });
  paint();
  return { root, prev, next, name, get: () => v, set(id) { v = id; paint(); }, setItems(list, id) { items = list; if (id !== undefined) v = id; sizeSeat(); paint(); },
    step, open: openIt, close, get isOpen() { return !!pane; }, destroy() { close(false); root.remove(); } };
}
