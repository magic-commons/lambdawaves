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
 *     earns nothing for a duplicate surface).  Since 1.6.0-alpha.52 the arrows walk it too (THE MENUS BY KEYBOARD, below in the code).
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
 * MENUS ARE DATA.  `menus` maps a group name to a function returning entries (or to `{ run, hint?, id? }`: AN ACTING ENTRY, a group with no list that
 * runs on a press; 1.6.0-alpha.52), each entry either `null` (a separator) or
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
 * 1.6.0-alpha.46 · EVERY ROW HAS A PICTURE'S SEAT (λWAVES 044 KV2, Josh's tick 4): a row is one height (--mb-row, 28) and begins with a 16 px seat
 *   (.mb-icon): its glyph; while a check or radio row is ON, its mark instead (a drawn ✓ / •, .mb-icon.mb-mark); else empty (.mb-none), so the
 *   labels stand in one column.  A submenu's arrow is drawn (chevronRight).
 * 1.6.0-alpha.48 · KEYCAPS: the key after the TAB is drawn as caps (<kbd class="mir-cap"> in .mb-key; keycaps(node, text) and capsOf(text) are exported).
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
import { cssZoom } from '../core/zoom.js';

/** comingRow(name, hint) — a disabled row for a window that is not built yet (BASINS: '○  JULIA  (coming)') */
export const comingRow = (name, hint = '') => ['○  ' + name + '  (coming)', () => {}, () => true, hint];
/** purgeRow({ name }) — EDIT › Purge Cache/RAM (BASINS' words; the app's name in the hint) */
export const purgeRow = ({ name = 'the app' } = {}) => ['Purge Cache/RAM', () => location.reload(), null,
  t('Reload {name} to release the current session’s memory. Saved projects and settings are kept; unsaved renders are discarded.', { name }), { icon: 'clear' }];
/** copyDumpRow(dump) — ABOUT › COPY DUMP; dump() → text */
export const copyDumpRow = (dump, hint = 'the debug dump, to the clipboard') => ['COPY DUMP', async () => {
  const text = String((typeof dump === 'function' ? dump() : dump) || '');
  if (await copyText(text)) notice('Debug info copied to clipboard.', { kind: 'ok' });
  else { notice('Copy failed — the dump is in the browser console.', { kind: 'warn' }); try { console.log(text); } catch (_) { /* no console */ } }
}, null, hint, { icon: 'duplicate' }];

/* 1.6.0-alpha.48 · KEYCAPS: a key beside a row is drawn as caps.  capsOf('Ctrl+Shift+S') → ['Ctrl', 'Shift', 'S']; '⌘⇧S' → ['⌘', '⇧', 'S'];
   'Ctrl++' → ['Ctrl', '+']; a lone word ('Space', 'F1', '?') is one cap (pure, for tests).  keycaps(node, text) writes them as <kbd>, the joining
   '+' kept as hidden text between them, so the node's text is still the chord as it was written. */
const MAC_MODS = '⌘⌥⇧⌃';
export function capsOf(text) {
  const s = String(text || '').trim(); if (!s) return [];
  if (s.length > 1 && s.includes('+')) { const p = s.split('+'); if (p[p.length - 1] === '' && p.length > 1) { p.pop(); p[p.length - 1] = '+'; } return p.map((x) => x.trim()).filter(Boolean); }
  const caps = []; let i = 0; while (i < s.length - 1 && MAC_MODS.includes(s[i])) caps.push(s[i++]);
  caps.push(s.slice(i)); return caps;
}
export function keycaps(node, text) {
  const caps = capsOf(text), plus = String(text).includes('+') && caps.length > 1;
  node.textContent = ''; node.translate = false;
  caps.forEach((c, i) => { if (i && plus) el('i', 'mb-plus', node, '+'); el('kbd', 'mir-cap', node, c); });
  return node;
}

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
    if (!ph) { const z = cssZoom(sub), r = it.getBoundingClientRect(), o = layer.getBoundingClientRect(), w = sub.offsetWidth * z, h = sub.offsetHeight * z, W = window.innerWidth, H = window.innerHeight;   // placed in the viewport, written in the bar's frame (÷ UI SCALE)
      const left = r.right + 2 + w <= W - 8 ? r.right + 2 : Math.max(8, r.left - 2 - w); sub.style.left = Math.round((left - o.left) / z) + 'px'; sub.style.top = Math.round((Math.max(8, Math.min(H - h - 8, r.top - 4)) - o.top) / z) + 'px'; }
    return sub;
  }
  const subKeys = (e, list) => {
    const it = e.target.closest('.mb-item'); if (!it) return;
    if (e.code === 'ArrowRight' && it.mbEntries) { e.preventDefault(); const s = openSub(list, it, it.mbEntries()); const f = s.querySelector('.mb-item:not(:disabled)'); if (f) f.focus(); }
    else if ((e.code === 'ArrowLeft' || e.code === 'Escape') && list.mbParent) { e.preventDefault(); e.stopPropagation(); const row = list.mbRow; closeSub(list.mbParent); row.focus(); }
    else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') { e.preventDefault(); const all = [...list.querySelectorAll(':scope > .mb-item:not(:disabled)')], i = all.indexOf(it); if (all.length) all[(i + (e.code === 'ArrowDown' ? 1 : -1) + all.length) % all.length].focus(); }
    /* 1.6.0-alpha.52 · THE LIST'S WALK IS WHOLE: Home and End, and a typed letter jumps to the next row that begins with it (as a select's list) */
    else if (e.code === 'Home' || e.code === 'End') { e.preventDefault(); const all = [...list.querySelectorAll(':scope > .mb-item:not(:disabled)')]; if (all.length) all[e.code === 'Home' ? 0 : all.length - 1].focus(); }
    else if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const all = [...list.querySelectorAll(':scope > .mb-item:not(:disabled)')], i = all.indexOf(it), c = e.key.toLowerCase();
      for (let k = 1; k <= all.length; k++) { const b = all[(i + k) % all.length], l = b.querySelector('.mb-lbl'); if (l && l.textContent.trim().toLowerCase().startsWith(c)) { e.preventDefault(); b.focus(); break; } }
    }
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
      /* 1.6.0-alpha.46 · EVERY ROW HAS A PICTURE'S SEAT: the row's glyph, or — while a check or radio row is on — its mark (a drawn ✓ / •), or an
         empty seat, so every label starts in one column and every row is one height */
      const on = o.checked !== undefined && !!o.checked;
      const pic = (on ? glyphEl(o.radio ? 'dot' : 'check', 'mb-icon mb-mark', 16) : o.icon ? glyphEl(o.icon, 'mb-icon', 16) : null) || el('span', 'mb-icon mb-none');
      pic.setAttribute('aria-hidden', 'true'); it.appendChild(pic);
      if (o.raw) el('span', 'mb-lbl', it, kk[0]).translate = false; else writeLabel(el('span', 'mb-lbl', it), kk[0]);
      if (o.current) { it.classList.add('on'); it.setAttribute('aria-current', 'true'); }
      if (o.checked !== undefined) { it.setAttribute('role', o.radio ? 'menuitemradio' : 'menuitemcheckbox'); it.setAttribute('aria-checked', String(!!o.checked)); it.classList.add(o.radio ? 'mb-radio' : 'mb-check'); if (o.radio) it.dataset.radio = o.radio; }
      if (kk[1]) keycaps(el('span', 'mb-key', it), kk[1]);
      if (hint) it.title = hint;
      if (o.id) it.dataset.id = o.id;
      if (typeof dis === 'function' ? dis() : dis === true) it.disabled = true;
      if (o.sub) {
        it.classList.add('mb-sub'); it.setAttribute('aria-haspopup', 'true'); it.setAttribute('aria-expanded', 'false'); it.mbEntries = run; const ar = el('span', 'mb-arrow', it); ar.setAttribute('aria-hidden', 'true'); const ch = glyphEl('chevronRight', 'mb-chev', 12); if (ch) ar.appendChild(ch); else ar.textContent = '▸';
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
/** escapeLayer(close) → off | null — 1.6.0-alpha.53 · EVERY KIT LAYER IS ON THE ONE STACK: a layer that Escape dismisses (a context menu, THE FINDER, a select's
 *  list, the saved-layouts list, a dismissable dialog) pushes itself on the app's Escape stack while it is open, through the hook setMenuEscape() was
 *  given, and takes itself off (off()) however it closes.  null when the app handed no stack in: the layer's own Escape listener is then the only one. */
export function escapeLayer(close) { if (!escapeHook) return null; try { const off = escapeHook(close); return typeof off === 'function' ? off : null; } catch (_) { return null; } }
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
  const z = cssZoom(pane), w = pane.offsetWidth * z, h = pane.offsetHeight * z, W = window.innerWidth, H = window.innerHeight, M = 8;   // seen; written ÷ UI SCALE
  pane.style.left = Math.round(Math.max(M, x + w > W - M ? Math.min(x - w, W - w - M) : x) / z) + 'px';
  pane.style.top = Math.round(Math.max(M, y + h > H - M ? Math.min(y - h, H - h - M) : y) / z) + 'px';
  document.addEventListener('pointerdown', (e) => { if (!host.contains(e.target)) api.close(); }, cap);
  window.addEventListener('scroll', (e) => { if (!host.contains(e.target)) api.close(); }, cap);
  for (const t of ['resize', 'blur']) window.addEventListener(t, api.close, { signal: life.signal });
  host.addEventListener('focusout', (e) => { if (!host.contains(e.relatedTarget)) api.close(); }, { signal: life.signal });
  off = escapeLayer(api.close);
  if (!off) window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && !e.defaultPrevented) { e.preventDefault(); api.close(); } }, { signal: life.signal });
  ctxOpen = api;
  const first = pane.querySelector('.mb-item:not(:disabled)'); if (first) first.focus({ preventScroll: true });
  return api;
}

/* ── 1.6.0-alpha.14 · ONE CONTROL MENU (λWAVES 044 R1, Josh 2026-11-13) ───────────────────────────────────────────────────────────────
 * RESET · COPY VALUE · PASTE · FINE ✓ · ROUTES › · CLIP › · LEARN… · CREATE EVENT · the favourites — ONE order for every value control
 * (CONTROL_MENU names the slots).  A row that does not apply is left out, never moved.  It began as the knob menu (1.5.6-alpha.4), which
 * merged the timeline's TIMELINE CLIP pop (timeline/knobs.js) and the modulation window's route pop (modulation/window.js) into one pane.
 * A VALUE DOOR — a knob's or a fader's `root.mirKnob` (get · home · input · fine?) — gives the kit's own RESET · COPY VALUE · PASTE · FINE
 * (FINE halves a knob's drag gain while on, this session; a fader has no such gear and no such row); any other control (a switch, a
 * segmented row, a trigger, a stepper) has only the rows its app hands in.
 * A part names its rows once — knobMenuPart(name, (id, root) → { entries?, rows?, reset?, copied? } | null): 'routes' (the modulation
 * window: RANGE · REMOVE · REMOVE ALL · the macros holding it; its `reset` keeps the routes), 'clip' (the timeline; its `copied(v)` hands
 * a copied value to a point's PASTE VALUE), 'app' (the app's rows for every control: `rows` by slot, `{ learn: [entry…], event: […] }`;
 * its `entries`, as before, are the foot). */
export const CONTROL_MENU = ['reset', 'copy', 'paste', 'fine', 'routes', 'clip', 'learn', 'event', 'fav'];
const knobParts = new Map();
let knobCopied = null;
export function knobMenuPart(name, fn) { if (typeof fn === 'function') knobParts.set(name, fn); else knobParts.delete(name); }
/* the value door of a control: its api, or the nearest element that carries one (root.mirKnob) — a knob, a fader, an arc, a range thumb, a number
   (1.6.0-alpha.52: it knew the knob's and the fader's classes only) */
const knobOf = (k) => { if (k && k.root && k.home) return k; for (let n = k && k.nodeType === 1 ? k : null; n; n = n.parentElement) if (n.mirKnob && n.mirKnob.home) return n.mirKnob; return null; };
const partAt = (name, root) => { const f = knobParts.get(name), id = root && root.dataset ? root.dataset.param : ''; try { return f && id ? f(id, root) : null; } catch (_) { return null; } };
const partOf = (name, k) => partAt(name, k.root);
/** knobAct(knob, 'reset' | 'copy' | 'paste' | 'fine') — the menu's four acts on a value door (its root or its api), for an app's keys too */
export function knobAct(knob, verb) {
  const k = knobOf(knob); if (!k) return false;
  if (verb === 'reset') { const r = partOf('routes', k); if (r && r.reset) r.reset(); else k.home(); return true; }
  if (verb === 'copy') { knobCopied = k.get(); const c = partOf('clip', k); if (c && c.copied) c.copied(knobCopied); return true; }
  if (verb === 'paste') { if (knobCopied === null) return false; k.input(knobCopied); return true; }
  return verb === 'fine' && k.fine ? k.fine(!k.fine()) : false;
}
/** controlMenu(target, { x, y, rows?, appRows?, open?, onClose? }) → the contextMenu | null (no row applies)
 *   target: a control's root, an element inside it, or a value door's api; rows: { slot: [entry…] } (or (id, root) → that) — the app's rows
 *   by slot; a value door's own RESET · COPY VALUE · PASTE · FINE are never replaced; appRows(id, root) → entries, the foot; open: 'routes'
 *   opens that submenu */
export function controlMenu(target, { x, y, rows = null, appRows = null, open = '', onClose = null } = {}) {
  const k = knobOf(target), root = k ? k.root : target && target.closest ? target : null;
  if (!root || (k && root.classList.contains('disabled'))) return null;   // 1.5.6-alpha.8: a greyed knob has its hint, never its menu
  const id = (root.dataset && root.dataset.param) || '', S = {}, act = (v) => () => knobAct(k, v);
  const put = (slot, list) => { for (const r of list || []) if (r) (S[slot] || (S[slot] = [])).push(r); };
  if (k) {
    put('reset', [['RESET', act('reset'), false, 'Back to the default; the routes stay', { id: 'reset' }]]);
    put('copy', [['COPY VALUE', act('copy'), false, 'Copy the value', { id: 'copy' }]]);
    put('paste', [['PASTE', act('paste'), knobCopied === null, 'Paste the copied value', { id: 'paste' }]]);
    if (k.fine) put('fine', [['FINE', act('fine'), false, 'Half the drag gain while on', { id: 'fine', checked: k.fine() }]]);
  }
  for (const [part, word] of [['routes', 'ROUTES'], ['clip', 'CLIP']]) { const p = partAt(part, root); if (p && p.entries && p.entries.length) put(part, [[word, () => p.entries, null, '', { sub: true, id: part }]]); }
  const app = partAt('app', root) || {};
  for (const given of [typeof rows === 'function' ? rows(id, root) : rows, app.rows]) for (const slot of CONTROL_MENU) { if (given && given[slot] && !(k && S[slot] && slot !== 'routes' && slot !== 'clip')) put(slot, given[slot]); }
  put('fav', appRows && appRows(id, root)); put('fav', app.entries);
  const m = contextMenu({ x, y, entries: CONTROL_MENU.flatMap((slot) => S[slot] || []), onClose, label: k ? 'Knob' : 'Control' });
  const row = open && m && m.pane.querySelector(`[data-id="${open}"]`); if (row) row.click();
  return m;
}
/** knobMenu(knob, { x, y, appRows?, rows?, open?, onClose? }) → controlMenu on a value door (a knob or a fader), or null */
export function knobMenu(knob, o) { return knobOf(knob) ? controlMenu(knob, o) : null; }

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
    /* 1.6.0-alpha.52 · AN ACTING ENTRY: `menus.NAME = { run, hint?, id? }` — a group with no list; a press runs it and closes the bar, a cursor
       arriving on it closes the list its hover left open (λWAVES' FINDER entry, which it seated by hand) */
    if (menus[name] && typeof menus[name] !== 'function') {
      const act = menus[name]; grp.classList.add('mb-act'); if (act.hint) btn.title = act.hint; if (act.id) btn.dataset.id = act.id;
      btn.addEventListener('click', (e) => { e.stopPropagation(); closeLists(); barShown(false); try { if (act.run) act.run(); } catch (err) { console.warn('menu: ' + name, err); } });
      btn.addEventListener('pointerenter', (e) => { if (hoverable(e)) closeLists(); });
      continue;
    }
    btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    const list = el('div', 'mb-list', grp); list.hidden = true;
    const fill = () => { closeSub(list); render(list, menus[name]()); };   // (an acting entry never reaches here)
    fills.set(list, fill);
    const open = () => { closeLists(); fill(); list.hidden = false; fitList(list); btn.setAttribute('aria-expanded', 'true'); openList = list; };
    btn.addEventListener('click', (e) => { e.stopPropagation(); const was = openList === list;
      if (was && e.detail > 0 && hoverable(e)) return;                // a cursor click keeps the list its hover just opened
      if (was) closeLists(); else open(); });
    btn.addEventListener('pointerenter', (e) => { if (!hoverable(e) || openList === list) return; open(); });
  }
  /* 1.6.0-alpha.52 · THE MENUS BY KEYBOARD (λWAVES 039 W2, moved here whole): on a group Enter or ↓ opens it at its first row (↑ at its last), ← → walk
     the groups, round, an open list following the focus, Home and End the first and last group; a group with no list (an acting entry, or one an app
     seated) is pressed by Enter ↓ ↑; in a list ← → step to the next group's list where no submenu takes the key; Escape closes a list back to its
     group, then (the window's listener below) the bar.  A key already taken (defaultPrevented) is left alone. */
  { const groups = () => [...bar.querySelectorAll('.mb-btn')], isOpen = (b) => b.getAttribute('aria-expanded') === 'true';
    const openAt = (b, last) => { if (!b.nextElementSibling) { closeLists(); b.focus({ preventScroll: true }); return; }
      if (!isOpen(b)) b.click(); const its = [...b.nextElementSibling.querySelectorAll(':scope > .mb-item:not(:disabled)')];
      (its[last ? its.length - 1 : 0] || b).focus({ preventScroll: true }); };
    bar.addEventListener('keydown', (e) => { if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const k = e.code, g = groups(), btn = e.target.closest('.mb-btn'), item = e.target.closest('.mb-item');
      const step = (b, d) => g[(g.indexOf(b) + d + g.length) % g.length];
      if (btn) {
        if (!btn.nextElementSibling && (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === 'NumpadEnter')) { e.preventDefault(); btn.click(); return; }
        if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === 'NumpadEnter') { e.preventDefault(); openAt(btn, k === 'ArrowUp'); }
        else if (k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); const to = step(btn, k === 'ArrowRight' ? 1 : -1); if (isOpen(btn)) openAt(to); else to.focus({ preventScroll: true }); }
        else if (k === 'Home' || k === 'End') { e.preventDefault(); g[k === 'Home' ? 0 : g.length - 1].focus({ preventScroll: true }); }
        else if (k === 'Escape' && isOpen(btn)) { e.preventDefault(); closeLists(); }
        return;
      }
      if (!item) return;
      let list = item.parentElement; while (list && list.mbParent) list = list.mbParent;   // a submenu's row belongs to its root list's group
      const grp = list && list.previousElementSibling; if (!grp || !grp.classList.contains('mb-btn')) return;
      if (k === 'ArrowLeft' || (k === 'ArrowRight' && !item.mbEntries)) { e.preventDefault(); openAt(step(grp, k === 'ArrowRight' ? 1 : -1)); }
      else if (k === 'Escape' && item.parentElement === list) { e.preventDefault(); closeLists(); grp.focus({ preventScroll: true }); }
    }, on); }
  let barTimer = 0;
  /* ON A PHONE the bar may not run off the screen: it gets the width from the wordmark to the edge and wraps onto a
     second row there (shell.css), its first row level with the wordmark.  The desktop bar is one row, as it was. */
  const place = () => {
    const z = cssZoom(bar), r = opener.getBoundingClientRect(), phone = isPhone(), hidden = logoHidden(), width = hidden ? 0 : r.width;   // seen; the bar's own lengths ÷ UI SCALE
    let rtl = false; try { rtl = bar.matches(':dir(rtl)'); } catch (_) {}
    bar.style.maxWidth = phone ? Math.max(120, (rtl ? r.right - width : window.innerWidth - r.left - width) - 16) / z + 'px' : '';
    bar.style.left = (rtl ? r.right - width - (hidden ? 0 : 8) - bar.offsetWidth * z : r.left + width + (hidden ? 0 : 8)) / z + 'px';   // a hidden logo gives its seat to the menus; RTL keeps the right edge
    const row = (phone && bar.firstElementChild ? bar.firstElementChild.offsetHeight : bar.offsetHeight) * z;
    bar.style.top = Math.max(0, r.top + r.height / 2 - row / 2) / z + 'px';
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
    if (dx) list.style.translate = Math.round(dx / cssZoom(list)) + 'px 0';
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
