/* MIR · shell/menubar.js — FILE · EDIT · VIEW · WINDOW · ABOUT, opened by the wordmark.
 *
 * Ported from λWAVES rack.js ("the logo opens FILE · EDIT · WINDOW", waves 53–106, its Escape at wave 62 and its
 * phone crossing at wave 106), with the one thing BASINS' copy added: a menu item that throws cannot leave the bar
 * stuck open.
 *
 * THE LAWS IT CARRIES (λWAVES' own words where they exist)
 *   · Hovering the wordmark shows the bar; leaving both for 400 ms hides it.  A touch never opens it by hover.
 *     THE LIVE POINTER DECIDES (core/kbm.js, 1.5.0 wave 21): a mouse, a pen or an iPad's trackpad hovers exactly as on
 *     the desktop, whatever the device class; a finger — or a person who pinned POINTER · TOUCH — never hovers.
 *   · It is a DISCLOSURE, not an ARIA menubar: the wordmark is a role=button with aria-expanded, a keyboard open
 *     moves focus to the first group, and Tab walks the rest (λWAVES wave 62 says why the full menubar contract
 *     earns nothing for a duplicate surface).
 *   · The bar is placed from geometry the wordmark's transform cannot move: its left edge + untransformed width + 8,
 *     centred on its vertical middle.
 *   · Each list is FILLED WHEN IT OPENS, so every label says the live state (a recent file, a disabled UNDO).
 *   · Hovering any group opens its list immediately; a press outside closes the lists.
 *   · MIR OPTIONS can keep the bar visible or hide the logo (which also keeps the bar visible).
 *   · Escape closes it and gives focus back to the wordmark.
 *   · On a phone the bar is always shown: crossing into the phone breakpoint shows and places it on the next frame.
 *     "Phone" is the kit's sentinel — skin.css raises `--phone` to 1 at its breakpoint — or `body.phone` where an
 *     app sets that class itself.
 *
 * MENUS ARE DATA.  `menus` maps a group name to a function returning entries, each either `null` (a separator) or
 *   [label, run, disabled?, hint?, opts?]   label may carry a key after a TAB: 'SAVE project\tCtrl+S';
 *                                    disabled is a boolean or a function asked each time the list opens;
 *                                    opts.raw: the label is a NAME and is never translated (a language, a file);
 *                                    opts.current: the item is the chosen one (aria-current, class .on)
 * 1.5.6-alpha.2 (λWAVES 021 I3) · TREES, STATES AND GLYPHS:
 *   [label, () => entries, null, hint?, { sub: true }]   a SUBMENU: hover or → opens it beside its row (filled as it opens, so it says the
 *                                    live state too), ← or Escape closes it back to its row, Enter or a press toggles it; it nests; on a phone
 *                                    it opens inline under its row (an accordion), never beside it
 *   opts.checked: true | false       a CHECK row (role menuitemcheckbox, aria-checked, a ✓ while true)
 *   opts.radio: 'group'              with opts.checked, a RADIO row of that group (role menuitemradio, a • on the chosen one)
 *   opts.icon: 'name'                a glyph (glyph.js) before the label: a kit name or an app's own (registerGlyphs, 1.5.6-alpha.3)
 *
 * 1.5.4 · LANGUAGES.  The group names and every item label go through t() (core/i18n.js); the key after the TAB
 *   never does.  A group is found by `data-menu` (its English name), never by the text it shows.  On a language
 *   change the group buttons are relabelled by kit.js and the open list is refilled.  Under dir="rtl" the bar sits
 *   on the other side of the wordmark.
 *
 * createMenubar({ opener, host, menus, label, phone, keep }) → { open(focus?), close(), openGroup(name), isOpen, items, bar, destroy() }
 *   One menubar per page: it owns the id `menubar`.  destroy() removes the bar and every listener it added.
 *   opener  the wordmark element (shell/wordmark.js)
 *   host    where the <nav id="menubar"> is appended (λWAVES: #lab)
 *   label   the opener's aria-label (default: '<word> — the <GROUPS> menus')
 *   phone   () => boolean, the phone law (default: the --phone sentinel, or body.phone)
 *   keep    () => Element[] — presses inside these do not close the bar (λWAVES: #rackToggle)
 *
 * THE ROW HELPERS (BASINS app/shell.js menus; each returns one entry, ready for a `menus` function)
 *   comingRow(name, hint)   '○  NAME  (coming)', disabled, its hint naming the window to come (BASINS' SEEDS rows)
 *   purgeRow({ name })      'Purge Cache/RAM': reloads the page to give its memory back; saved projects and settings stay
 *   copyDumpRow(dump)       'COPY DUMP': dump() (createApp: describe's dump with every registered dump line) to the
 *                           clipboard through shell/clipboard.js copyText, its fallback included, for a tablet with no
 *                           console; a notice says whether it worked (BASINS debug.js copyDebugInfo)
 *   Recent projects are FOLDERS' (folders/files.js recentRows). */
import { el, label as writeLabel, ariaLabel } from '../kit.js';
import { t, onLanguage } from '../core/i18n.js';
import { setVar } from '../core/perf.js';
import { frame } from '../core/frame.js';
import { copyText } from './clipboard.js';
import { notice } from './notice.js';
import { hoverable } from '../core/kbm.js';
import { glyphEl } from '../glyph.js';

/** comingRow(name, hint) — a disabled row for a window that is not built yet (BASINS: '○  JULIA  (coming)') */
export const comingRow = (name, hint = '') => ['○  ' + name + '  (coming)', () => {}, () => true, hint];
/** purgeRow({ name }) — EDIT › Purge Cache/RAM (BASINS' words; the app's name in the hint) */
export const purgeRow = ({ name = 'the app' } = {}) => ['Purge Cache/RAM', () => location.reload(), null,
  t('Reload {name} to release the current session’s memory. Saved projects and settings are kept; unsaved renders are discarded.', { name })];
/** copyDumpRow(dump) — ABOUT › COPY DUMP; dump() → text */
export const copyDumpRow = (dump, hint = 'the debug dump, to the clipboard') => ['COPY DUMP', async () => {
  const text = String((typeof dump === 'function' ? dump() : dump) || '');
  if (await copyText(text)) notice('Debug info copied to clipboard.', { kind: 'ok' });
  else { notice('Copy failed — the dump is in the browser console.', { kind: 'warn' }); try { console.log(text); } catch (_) { /* no console */ } }
}, null, hint];

/* 1.5.6-alpha.4 · ONE RENDERER: the bar's lists and contextMenu's pane are drawn by these rows.  rowsOn({ layer, phone, done }) →
   { render, openSub, closeSub }: `layer` holds a submenu beside its row (written in its frame), `done()` closes after a row runs; `surface`
   draws a submenu as its own menu pane (contextMenu's; the bar's lists are drawn by #menubar's rules). */
function rowsOn({ layer, phone, done, surface = false }) {
  /* 1.5.6-alpha.2 · a submenu is a list of its own, made as it opens and removed as it closes: beside its row on the bar's own layer (a list
     a frosted, scrolling parent cannot clip), or inline under its row on a phone.  `child` is the list a list has open, `row` the row that opened it */
  const closeSub = (list) => { const c = list && list.mbChild; if (!c) return; closeSub(c); c.remove(); list.mbChild = null; if (c.mbRow) c.mbRow.setAttribute('aria-expanded', 'false'); };
  function openSub(list, it, entries) {
    if (list.mbChild && list.mbChild.mbRow === it) return list.mbChild;
    closeSub(list);
    const sub = el('div', 'mb-list mb-sub-list'), ph = phone(); sub.mbRow = it; sub.mbParent = list; list.mbChild = sub; it.setAttribute('aria-expanded', 'true');
    if (ph) { sub.classList.add('mb-accordion'); it.after(sub); } else { layer.appendChild(sub); if (surface) { sub.classList.add('glass'); sub.dataset.mirSurface = 'menu'; } }
    render(sub, entries);
    if (!ph) { const r = it.getBoundingClientRect(), o = layer.getBoundingClientRect(), w = sub.offsetWidth, h = sub.offsetHeight, W = window.innerWidth, H = window.innerHeight;   // placed in the viewport, written in the bar's frame
      const left = r.right + 2 + w <= W - 8 ? r.right + 2 : Math.max(8, r.left - 2 - w); sub.style.left = Math.round(left - o.left) + 'px'; sub.style.top = Math.round(Math.max(8, Math.min(H - h - 8, r.top - 4)) - o.top) + 'px'; }
    return sub;
  }
  const subKeys = (e, list) => {
    const it = e.target.closest('.mb-item'); if (!it) return;
    if (e.code === 'ArrowRight' && it.mbEntries) { e.preventDefault(); const s = openSub(list, it, it.mbEntries()); const f = s.querySelector('.mb-item:not(:disabled)'); if (f) f.focus(); }
    else if ((e.code === 'ArrowLeft' || e.code === 'Escape') && list.mbParent) { e.preventDefault(); e.stopPropagation(); const row = list.mbRow; closeSub(list.mbParent); row.focus(); }
    else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') { e.preventDefault(); const all = [...list.querySelectorAll(':scope > .mb-item:not(:disabled)')], i = all.indexOf(it); if (all.length) all[(i + (e.code === 'ArrowDown' ? 1 : -1) + all.length) % all.length].focus(); }
  };
  /** render(list, entries) — the rows of one list (a group's or a submenu's); a row that throws still closes the bar */
  function render(list, entries) {
    list.innerHTML = '';
    if (!list.mbKeys) { list.mbKeys = true; list.addEventListener('keydown', (e) => subKeys(e, list)); }
    for (const entry of entries) {
      if (!entry) { const sep = el('div', 'mb-sep', list); sep.setAttribute('role', 'separator'); continue; }
      const [text, run, dis, hint, opts] = entry, o = opts || {};
      const it = el('button', 'mb-item', list); it.type = 'button';
      const kk = String(text).split('\t');
      if (o.icon) { const g = glyphEl(o.icon, 'mb-icon', 16); if (g) it.appendChild(g); }
      if (o.raw) el('span', 'mb-lbl', it, kk[0]).translate = false; else writeLabel(el('span', 'mb-lbl', it), kk[0]);
      if (o.current) { it.classList.add('on'); it.setAttribute('aria-current', 'true'); }
      if (o.checked !== undefined) { it.setAttribute('role', o.radio ? 'menuitemradio' : 'menuitemcheckbox'); it.setAttribute('aria-checked', String(!!o.checked)); it.classList.add(o.radio ? 'mb-radio' : 'mb-check'); if (o.radio) it.dataset.radio = o.radio;
        el('span', 'mb-mark', it, o.checked ? (o.radio ? '•' : '✓') : '').setAttribute('aria-hidden', 'true'); }
      if (kk[1]) el('span', 'mb-key', it, kk[1]);
      if (hint) it.title = hint;
      if (o.id) it.dataset.id = o.id;
      if (typeof dis === 'function' ? dis() : dis === true) it.disabled = true;
      if (o.sub) {
        it.classList.add('mb-sub'); it.setAttribute('aria-haspopup', 'true'); it.setAttribute('aria-expanded', 'false'); it.mbEntries = run; el('span', 'mb-arrow', it, '▸').setAttribute('aria-hidden', 'true');
        it.addEventListener('click', (e) => { e.stopPropagation(); if (list.mbChild && list.mbChild.mbRow === it) { if (!(e.detail > 0 && hoverable(e) && !phone())) closeSub(list); } else openSub(list, it, run()); });   // a cursor's click keeps what its hover opened (1.5.6-alpha.4)
        it.addEventListener('pointerenter', (e) => { if (hoverable(e) && !phone()) openSub(list, it, run()); });
        continue;
      }
      it.addEventListener('pointerenter', (e) => { if (hoverable(e) && !phone() && list.mbChild) closeSub(list); });
      it.addEventListener('click', (e) => { e.stopPropagation(); done(); try { if (run) run(); } catch (err) { console.warn('menu: ' + kk[0], err); } });   // the item dies with the list
    }
  }
  return { render, openSub, closeSub };
}

/* "Phone" is the kit's sentinel — skin.css raises `--phone` to 1 at its breakpoint — or `body.phone` where an app sets that class itself */
const phoneNow = () => document.body.classList.contains('phone') || (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--phone')) || 0) >= 1;

/* ── 1.5.6-alpha.4 · THE CONTEXT MENU DOOR (λWAVES 022 P1: ONE MENU DOOR) ──────────────────────────────────────────────────────────────
 * contextMenu({ x, y, entries, anchor?, onClose?, label? }) → { pane, host, close() } | null
 *   ONE pane of the menubar's own rows (entries as `menus` above: submenus, ✓ / •, glyphs, a key after a TAB, `opts.id` → data-id) at a point, or
 *   under `anchor`; kept inside the viewport (it flips left / up at an edge); ↑ ↓ walk it, → ← a submenu, Enter runs, Escape closes; a phone
 *   opens a submenu inline.  The pane is `.glass[data-mir-surface="menu"]`, so the skin draws it.  It closes on a press outside, a scroll,
 *   a resize, the window's blur, the focus leaving it, and Escape — through the app's Escape stack when one is handed in (setMenuEscape).
 *   One open at a time: a second replaces the first. */
let escapeHook = null, ctxOpen = null;
/** setMenuEscape(push) — the app's Escape stack: push(close) → the function that takes that layer off again (λWAVES: actions.escape.push) */
export function setMenuEscape(push) { escapeHook = typeof push === 'function' ? push : null; }
export function contextMenu({ x = 0, y = 0, entries, anchor = null, onClose = null, label: name = '' } = {}) {
  if (ctxOpen) ctxOpen.close();
  const rows = typeof entries === 'function' ? entries() : entries;
  if (!rows || !rows.some(Boolean)) return null;
  const host = el('div', 'mir-ctx', document.body); host.tabIndex = -1;
  try { host.setAttribute('popover', 'manual'); host.showPopover(); } catch (_) {}   // the top layer: above every window, rail and dialog
  const pane = el('div', 'mb-list mir-ctx-pane glass', host); pane.dataset.mirSurface = 'menu'; pane.setAttribute('role', 'menu'); if (name) ariaLabel(pane, name);
  const life = new AbortController(), cap = { capture: true, signal: life.signal };
  let off = null;
  const api = { pane, host, close() { if (life.signal.aborted) return; life.abort(); if (off) off(); host.remove(); if (ctxOpen === api) ctxOpen = null; if (onClose) onClose(); } };
  rowsOn({ layer: host, phone: phoneNow, done: api.close, surface: true }).render(pane, rows);
  if (anchor) { const r = anchor.getBoundingClientRect(); x = r.left; y = r.bottom + 2; }
  const w = pane.offsetWidth, h = pane.offsetHeight, W = window.innerWidth, H = window.innerHeight, M = 8;
  pane.style.left = Math.round(Math.max(M, x + w > W - M ? Math.min(x - w, W - w - M) : x)) + 'px';
  pane.style.top = Math.round(Math.max(M, y + h > H - M ? Math.min(y - h, H - h - M) : y)) + 'px';
  document.addEventListener('pointerdown', (e) => { if (!host.contains(e.target)) api.close(); }, cap);
  window.addEventListener('scroll', (e) => { if (!host.contains(e.target)) api.close(); }, cap);
  for (const t of ['resize', 'blur']) window.addEventListener(t, api.close, { signal: life.signal });
  host.addEventListener('focusout', (e) => { if (!host.contains(e.relatedTarget)) api.close(); }, { signal: life.signal });
  off = escapeHook ? escapeHook(api.close) : null;
  if (!off) window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && !e.defaultPrevented) { e.preventDefault(); api.close(); } }, { signal: life.signal });
  ctxOpen = api;
  const first = pane.querySelector('.mb-item:not(:disabled)'); if (first) first.focus({ preventScroll: true });
  return api;
}

/* ── 1.5.6-alpha.4 · ONE KNOB MENU: RESET · COPY · PASTE · FINE ✓ · ROUTES › · CLIP › · the app's rows ─────────────────────────────────
 * It merges the timeline's TIMELINE CLIP pop (timeline/knobs.js) and the modulation window's route pop (modulation/window.js) into one pane.
 * A part names its rows once — knobMenuPart(name, (id, root) → { entries, reset? } | null): 'routes' (the modulation window: RANGE ·
 * REMOVE · REMOVE ALL · the macros holding it; its `reset` keeps the routes), 'clip' (the timeline), 'app' (the app's rows for every knob).
 * The value is the knob's own door (root.mirKnob: get · home · input · fine); FINE halves its drag gain while on (this session). */
const knobParts = new Map();
let knobCopied = null;
export function knobMenuPart(name, fn) { if (typeof fn === 'function') knobParts.set(name, fn); else knobParts.delete(name); }
const knobOf = (k) => (k && k.root && k.home ? k : (k && k.closest && (k.closest('.k') || {}).mirKnob) || null);
const partOf = (name, k) => { const f = knobParts.get(name), id = k.root.dataset.param; try { return f && id ? f(id, k.root) : null; } catch (_) { return null; } };
/** knobAct(knob, 'reset' | 'copy' | 'paste' | 'fine') — the menu's four acts on a knob (its root or its api), for an app's keys too */
export function knobAct(knob, verb) {
  const k = knobOf(knob); if (!k) return false;
  if (verb === 'reset') { const r = partOf('routes', k); if (r && r.reset) r.reset(); else k.home(); return true; }
  if (verb === 'copy') { knobCopied = k.get(); return true; }
  if (verb === 'paste') { if (knobCopied === null) return false; k.input(knobCopied); return true; }
  return verb === 'fine' ? k.fine(!k.fine()) : false;
}
/** knobMenu(knob, { x, y, appRows?, open?, onClose? }) → the contextMenu; appRows(id, root) → entries; open: 'routes' opens that submenu */
export function knobMenu(knob, { x, y, appRows = null, open = '', onClose = null } = {}) {
  const k = knobOf(knob); if (!k || k.root.classList.contains('disabled')) return null;   // 1.5.6-alpha.8: a greyed knob has its hint, never its menu
  const id = k.root.dataset.param || '', act = (v) => () => knobAct(k, v);
  const entries = [['RESET', act('reset'), false, 'Back to the default; the routes stay', { id: 'reset' }], ['COPY', act('copy'), false, 'Copy the value', { id: 'copy' }],
    ['PASTE', act('paste'), knobCopied === null, 'Paste the copied value', { id: 'paste' }], ['FINE', act('fine'), false, 'Half the drag gain while on', { id: 'fine', checked: k.fine() }]];
  for (const [part, word] of [['routes', 'ROUTES'], ['clip', 'CLIP']]) { const p = partOf(part, k); if (p && p.entries && p.entries.length) entries.push([word, () => p.entries, null, '', { sub: true, id: part }]); }
  const app = [...((appRows && appRows(id, k.root)) || []), ...((partOf('app', k) || {}).entries || [])];
  if (app.length) entries.push(null, ...app);
  const m = contextMenu({ x, y, entries, onClose, label: 'Knob' });
  const row = open && m && m.pane.querySelector(`[data-id="${open}"]`); if (row) row.click();
  return m;
}

export function createMenubar({ opener, host, menus, label, phone, keep } = {}) {
  if (!opener || !menus) return null;
  const isPhone = phone || phoneNow;
  const logoHidden = () => document.documentElement.dataset.logo === 'hidden';
  const pinned = () => isPhone() || logoHidden() || document.documentElement.dataset.menuBar === 'always';
  const life = new AbortController(), on = { signal: life.signal };
  const keepers = keep || (() => [document.getElementById('rackToggle')].filter(Boolean));
  const bar = el('nav', 'menubar', host || document.body); bar.id = 'menubar';
  try { bar.setAttribute('popover', 'manual'); } catch (_) {}
  bar.hidden = true;
  const canPop = typeof bar.showPopover === 'function';
  let openList = null;
  const closeLists = () => { for (const l of bar.querySelectorAll('.mb-sub-list')) l.remove(); for (const l of bar.querySelectorAll('.mb-list')) l.hidden = true; for (const b of bar.querySelectorAll('.mb-btn')) b.setAttribute('aria-expanded', 'false'); openList = null; };
  const { render, openSub, closeSub } = rowsOn({ layer: bar, phone: isPhone, done: () => { closeLists(); barShown(false); } });

  const names = Object.keys(menus);
  const word = (opener.querySelector('.lam') ? opener.querySelector('.lam').textContent : '') + (opener.querySelector('.word') ? opener.querySelector('.word').textContent : '');
  opener.tabIndex = 0;
  opener.setAttribute('role', 'button');
  opener.setAttribute('aria-haspopup', 'true');
  opener.setAttribute('aria-expanded', 'false');
  /* the opener's name, as one sentence with the group list joined by the language's own "and" */
  const nameOpener = () => {
    if (label) { opener.setAttribute('aria-label', label); return; }
    const lang = document.documentElement.lang || 'en', g = names.map((n) => t(n));
    let menus = g.slice(0, -1).join(', ') + (g.length > 1 ? ' and ' : '') + g[g.length - 1];   // English as it always was (no serial comma)
    if (!/^en(-|$)/.test(lang)) { try { menus = new Intl.ListFormat(lang, { type: 'conjunction' }).format(g); } catch (_) {} }
    opener.setAttribute('aria-label', t('{word} — the {menus} menus', { word, menus }));
  };
  nameOpener();

  /* `bar.hidden` is written in exactly ONE place, so aria-expanded can never disagree with it */
  const barShown = (v) => {
    const want = pinned() || !!v;
    bar.hidden = !want; if (!want) publish();
    if (canPop) { try { if (want && !bar.matches(':popover-open')) bar.showPopover(); else if (!want && bar.matches(':popover-open')) bar.hidePopover(); } catch (_) {} }
    opener.classList.toggle('menu-open', want); opener.setAttribute('aria-expanded', String(want));
  };
  const fills = new Map();
  for (const name of names) {
    const grp = el('div', 'mb-group', bar);
    const btn = writeLabel(el('button', 'mb-btn', grp), name); btn.type = 'button'; btn.dataset.menu = name;
    btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    const list = el('div', 'mb-list', grp); list.hidden = true;
    const fill = () => { closeSub(list); render(list, menus[name]()); };
    fills.set(list, fill);
    const open = () => { closeLists(); fill(); list.hidden = false; fitList(list); btn.setAttribute('aria-expanded', 'true'); openList = list; };
    btn.addEventListener('click', (e) => { e.stopPropagation(); const was = openList === list;
      if (was && e.detail > 0 && hoverable(e)) return;                // a cursor click keeps the list its hover just opened
      if (was) closeLists(); else open(); });
    btn.addEventListener('pointerenter', (e) => { if (!hoverable(e) || openList === list) return; open(); });
  }
  let barTimer = 0;
  /* ON A PHONE the bar may not run off the screen: it gets the width from the wordmark to the edge and wraps onto a
     second row there (shell.css), its first row level with the wordmark.  The desktop bar is one row, as it was. */
  const place = () => {
    const r = opener.getBoundingClientRect(), phone = isPhone(), hidden = logoHidden(), width = hidden ? 0 : opener.offsetWidth;
    let rtl = false; try { rtl = bar.matches(':dir(rtl)'); } catch (_) {}
    bar.style.maxWidth = phone ? Math.max(120, (rtl ? r.right - width : window.innerWidth - r.left - width) - 16) + 'px' : '';
    bar.style.left = (rtl ? r.right - width - (hidden ? 0 : 8) - bar.offsetWidth : r.left + width + (hidden ? 0 : 8)) + 'px';   // a hidden logo gives its seat to the menus; RTL keeps the right edge
    const row = phone && bar.firstElementChild ? bar.firstElementChild.offsetHeight : bar.offsetHeight;
    bar.style.top = Math.max(0, r.top + r.height / 2 - row / 2) + 'px';
    publish();
  };
  /* the bar's foot, for the chrome below it: on a phone the kit's rack starts under it (rack.css reads --menubar-bottom
     on <html>); nothing is written on a desktop or while the bar is hidden */
  function publish() { setVar(document.documentElement, '--menubar-bottom', isPhone() && !bar.hidden ? Math.ceil(bar.getBoundingClientRect().bottom) + 'px' : null); }
  /* an open list stays whole on the screen: shifted sideways by as much as it would run off, never more */
  const fitList = (list) => {
    list.style.translate = '';
    const r = list.getBoundingClientRect(), W = window.innerWidth, M = 8;
    const dx = r.right > W - M ? Math.max(M - r.left, W - M - r.right) : r.left < M ? M - r.left : 0;
    if (dx) list.style.translate = Math.round(dx) + 'px 0';
  };
  const showBar = (focusIt) => {
    clearTimeout(barTimer); barShown(true); place();
    /* the bar sits late in the DOM; moving focus into it on a KEYBOARD open makes that irrelevant, and a pointer
       hover never steals the seat under the hand */
    if (focusIt) { const first = bar.querySelector('.mb-btn'); if (first) first.focus(); }
  };
  const hide = () => { closeLists(); barShown(false); };
  const hideBarSoon = () => { clearTimeout(barTimer); barTimer = setTimeout(() => { if (!openList) barShown(false); }, 400); };
  opener.addEventListener('pointerenter', (e) => { if (hoverable(e)) showBar(); }, on);
  opener.addEventListener('click', () => { if (bar.hidden) showBar(); else hide(); }, on);
  opener.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;   // Space belongs to the app (λWAVES: the transport)
    e.preventDefault();
    if (bar.hidden) showBar(true); else hide();
  }, on);
  opener.addEventListener('pointerleave', hideBarSoon, on);
  bar.addEventListener('pointerenter', () => clearTimeout(barTimer));
  bar.addEventListener('pointerleave', hideBarSoon);
  document.addEventListener('pointerdown', (e) => {
    if (bar.hidden || bar.contains(e.target) || opener.contains(e.target)) return;
    if (keepers().some((k) => k && k.contains(e.target))) return;
    hide();
  }, on);
  /* λWAVES wave 62: Escape closes the bar and the wordmark takes the focus back, so the keyboard is where it was */
  window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && !bar.hidden && !e.defaultPrevented && openList && openList.mbChild) { e.preventDefault(); closeSub(openList); return; }
    if (e.code === 'Escape' && !bar.hidden && !e.defaultPrevented) { e.preventDefault(); hide();
    (logoHidden() ? bar.querySelector('.mb-btn') : opener).focus(); } }, on);
  /* THE PHONE CROSSING (λWAVES wave 106): entering the breakpoint shows and PLACES the bar on the next frame;
     leaving it lets the bar go unless a list is open */
  let wasPhone = isPhone();
  const syncPhone = () => { const now = isPhone(); if (now === wasPhone) return; wasPhone = now; if (now) frame.write(() => { if (isPhone()) showBar(false); }); else if (!openList) barShown(false); };
  window.addEventListener('resize', syncPhone, { passive: true, signal: life.signal });
  window.addEventListener('orientationchange', syncPhone, { passive: true, signal: life.signal });
  if (pinned()) frame.write(() => { if (!life.signal.aborted && pinned()) showBar(false); });
  const prefs = new MutationObserver(() => { if (pinned()) showBar(false); else hide(); });
  prefs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-menu-bar', 'data-logo'] });
  life.signal.addEventListener('abort', () => prefs.disconnect());
  /* a bar placed before the wordmark's face has loaded sits where the fallback font ended (measured: 3 px right on a
     phone), and one left up through a resize sits where the old layout put it — so a shown bar is placed again */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!life.signal.aborted && !bar.hidden) place(); });
  window.addEventListener('resize', () => { if (!bar.hidden) place(); }, { passive: true, signal: life.signal });
  const offLang = onLanguage(() => { nameOpener(); if (openList) fills.get(openList)(); if (!bar.hidden) place(); });
  life.signal.addEventListener('abort', offLang);
  return {
    bar,
    open: showBar,
    close: () => { hide(); return true; },
    get isOpen() { return !bar.hidden; },
    /** open the bar and one group, as a click would */
    openGroup(name) { showBar(false); const b = [...bar.querySelectorAll('.mb-btn')].find((x) => x.dataset.menu === name); if (b && (!openList || openList !== b.nextElementSibling)) b.click(); return !!b; },
    get items() { return openList ? [...openList.querySelectorAll('.mb-item')].map((b) => b.textContent) : []; },
    /** openPath(path) — open the submenus along a path of row labels in the open group (a test, a tour); → the deepest list or null */
    openPath(path) { let list = openList; for (const lbl of path || []) { if (!list) return null; const it = [...list.querySelectorAll(':scope > .mb-item')].find((b) => b.mbEntries && b.querySelector('.mb-lbl').textContent.startsWith(lbl)); if (!it) return null; list = openSub(list, it, it.mbEntries()); } return list; },
    destroy() { clearTimeout(barTimer); life.abort(); setVar(document.documentElement, '--menubar-bottom', null); try { if (canPop && bar.matches(':popover-open')) bar.hidePopover(); } catch (_) {} bar.remove();
      opener.classList.remove('menu-open'); for (const a of ['tabindex', 'role', 'aria-haspopup', 'aria-expanded', 'aria-label']) opener.removeAttribute(a); },
  };
}
