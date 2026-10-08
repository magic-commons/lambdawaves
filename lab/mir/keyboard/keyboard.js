/* MIR · keyboard/keyboard.js — THE KEYBOARD WINDOW, and the help view.  Both read the one key table (shell/keys.js).
 *
 * λWAVES' keyboard window (lab/keymap.js + lab.css §KEYBOARD, waves 113–115), followed in geometry and behaviour: the
 * drawn ANSI five-row board with each key's shifted legend, modifier badge, cap and the bound action's short name; the
 * legend and the ⌘ / Windows platform switch on one row; two wells (board 2.1 : list 1); RECORD INPUT and RESET TO
 * DEFAULT; a status line; the search; the action list by group with its chord chips; steal on conflict by pressing the
 * taken chord a second time; Escape cancels a recording, then clears the search, then closes; under 860 px only the
 * list.  It is untinted and layered: the four places λWAVES spent its glass tint are drawn by docs/INTENT.md instead —
 *   1. a BOUND key is the ON frost face and rim with its accent light (the LED the legend's "Active" dot shows);
 *   2. the WELLS are INTENT's well: the inset relief on the well fill, no dark layer in either theme;
 *   3. the PLATFORM SWITCH is the kit's `seg()` and the SEARCH is the kit's field (a well, the focus ring outside);
 *   4. the PANEL is the 1.5 window's own pane (window/window.js) — this module paints no pane at all.
 * A key being recorded is LIVE (accent A glow); a conflict is a neutral ring and words, never a colour that means
 * something else.  The pane, the drag, the rail (grip and close), presence and persistence are createWindow's.
 *
 * THE LAWS IT KEEPS
 *   · THE TABLE IS THE ONLY DATA.  Nothing here holds a binding: every paint reads keys.list(); every change goes
 *     through keys.bind / reset / resetAll / record, and the window repaints on keys.onChange.
 *   · KEYBOARD AND TOUCH ARE BOTH FIRST-CLASS.  Every drawn key is a button: one tab stop for the board, arrows walk it,
 *     Enter / Space press it.  Pressing a key shows its action.  While recording, a tap on a drawn modifier latches it
 *     and a tap on a drawn key records that chord, so a touch screen with no keyboard can still rebind; the status says
 *     plainly when no hardware keyboard is seen.
 *   · NOTHING SCROLLS SIDEWAYS.  The list scrolls inside its own well; labels ellipsise.
 *   · NOTHING IS FOUND BY ITS LABEL.  Keys by data-code, rows by data-id; every label is English through kit.js
 *     label() and translates live; key caps and chords are never translated (docs/LANGUAGES.md §4).
 *   · IDLE COSTS NOTHING: no timers, no rAF; listeners live on one AbortController and destroy() removes everything.
 *
 * createKeyboardWindow({ keys, host, persist?, platform?, onMoved? })
 *   → { win, root, open(), close(), toggle(), isOpen(), select(id), setPlatform(p), refresh(), destroy() }
 * createKeysHelp({ keys, host, persist?, onMoved? })
 *   → { win, root, open(), close(), toggle(), isOpen(), refresh(), destroy() }
 * Pure: boardRows(platform), keyStates(list, platform, selectedId) */
import { el, label, ariaLabel, seg, trig } from '../kit.js';
import { t, onLanguage } from '../core/i18n.js';
import { createWindow } from '../window/window.js';
import { parseChord, displayChord, keyText, modText } from '../shell/keys.js';

/* ── the board: λWAVES' ANSI rows, each key [code, cap, shifted legend, width class] ─────────────────────────── */
const R = (code, cap, shift = '', w = '1') => ({ code, cap, shift, w });
const ROWS = [
  [R('Escape', 'ESC', '', 'esc'), R('Backquote', '`', '~'), R('Digit1', '1', '!'), R('Digit2', '2', '@'), R('Digit3', '3', '#'), R('Digit4', '4', '$'),
    R('Digit5', '5', '%'), R('Digit6', '6', '^'), R('Digit7', '7', '&'), R('Digit8', '8', '*'), R('Digit9', '9', '('), R('Digit0', '0', ')'),
    R('Minus', '-', '_'), R('Equal', '=', '+'), R('Backspace', 'BKSP', '', 'bksp')],
  [R('Tab', 'TAB', '', 'tab'), ...'QWERTYUIOP'.split('').map((c) => R('Key' + c, c)), R('BracketLeft', '[', '{'), R('BracketRight', ']', '}'), R('Backslash', '\\', '|', 'backslash')],
  [R('CapsLock', 'CAPS', '', 'caps'), ...'ASDFGHJKL'.split('').map((c) => R('Key' + c, c)), R('Semicolon', ';', ':'), R('Quote', "'", '"'), R('Enter', 'ENTER', '', 'enter')],
  [R('ShiftLeft', 'SHIFT', '', 'lshift'), ...'ZXCVBNM'.split('').map((c) => R('Key' + c, c)), R('Comma', ',', '<'), R('Period', '.', '>'), R('Slash', '/', '?'), R('ShiftRight', 'SHIFT', '', 'rshift')],
];
/** boardRows(platform) → the five rows; only the bottom row's names change with the platform (λWAVES getBottomRow) */
export function boardRows(platform = 'other') {
  const mac = platform === 'mac';
  return [...ROWS, [R('ControlLeft', 'CTRL', '', 'ctrl'), R('MetaLeft', mac ? '⌘' : 'WIN', '', 'win'), R('AltLeft', mac ? '⌥' : 'ALT', '', 'alt'),
    R('Space', 'SPACE', '', 'space'), R('AltRight', mac ? '⌥' : 'ALT', '', 'alt'), R('ControlRight', 'CTRL', '', 'ctrl'),
    R('ArrowLeft', '←', '', 'arrow'), R('ArrowDown', '↓', '', 'arrow'), R('ArrowRight', '→', '', 'arrow')]];
}
/** which drawn keys a chord's modifier lights, on the platform being SHOWN */
const MOD_KEYS = (m, platform) => (m === 'Shift' ? ['ShiftLeft', 'ShiftRight'] : m === 'Alt' ? ['AltLeft', 'AltRight']
  : m === 'Ctrl' ? ['ControlLeft', 'ControlRight'] : m === 'Meta' ? ['MetaLeft'] : platform === 'mac' ? ['MetaLeft'] : ['ControlLeft', 'ControlRight']);
const DRAWN_MOD = { ShiftLeft: 'Shift', ShiftRight: 'Shift', AltLeft: 'Alt', AltRight: 'Alt', ControlLeft: 'Ctrl', ControlRight: 'Ctrl', MetaLeft: 'Meta' };

/** keyStates(list, platform, selectedId) → Map code → { on: [{ id, chord }], lit, selected } — pure: what each drawn key shows */
export function keyStates(list, platform = 'other', selectedId = null) {
  const S = new Map(); const at = (c) => { if (!S.has(c)) S.set(c, { on: [], lit: false, selected: false }); return S.get(c); };
  for (const a of list) for (const chord of a.keys) {
    const p = parseChord(chord); if (!p) continue;
    at(p.code).on.push({ id: a.id, chord, mods: p.mods });
    for (const m of p.mods) for (const k of MOD_KEYS(m, platform)) at(k).lit = true;
    if (a.id === selectedId) { at(p.code).selected = true; for (const m of p.mods) for (const k of MOD_KEYS(m, platform)) at(k).selected = true; }
  }
  return S;
}
const badgeKind = (mods) => (mods.length > 1 ? 'combo' : mods[0] === 'Shift' ? 'shift' : mods[0] === 'Alt' ? 'alt' : 'ctrl');
const touchOnly = (view) => { try { return !view.matchMedia('(any-pointer: fine)').matches; } catch (_) { return false; } };

/* ── THE KEYBOARD WINDOW ──────────────────────────────────────────────────────────────────────────────────── */
export function createKeyboardWindow({ keys, host, persist = null, platform, onMoved } = {}) {
  const doc = host.ownerDocument, view = doc.defaultView;
  const life = new AbortController(), on = { signal: life.signal };
  let shown = platform || keys.platform, selected = null, recording = false, latched = new Set(), pending = null, last = null;
  const narrow = () => view.matchMedia('(max-width: 860px)').matches;

  const root = el('div', 'km');
  /* the left well: legend + platform switch, then the board */
  const colL = el('div', 'km-col km-col-left', root);
  const head = el('div', 'km-col-header', colL);
  const legend = el('div', 'km-legend', head);
  el('span', 'km-legend-dot km-legend-active', legend); label(el('span', 'km-legend-text', legend), 'Active');
  el('span', 'km-legend-dot km-legend-unbound', legend); label(el('span', 'km-legend-text', legend), 'Unbound');
  el('span', 'km-legend-sample km-badge-shift', legend, '⇧').translate = false; label(el('span', 'km-legend-text', legend), 'Shift');
  el('span', 'km-legend-sample km-badge-ctrl', legend, '⌃').translate = false; label(el('span', 'km-legend-text', legend), 'Ctrl / ⌘');
  const sw = seg({ cls: 'km-platform', aria: 'Key names', value: shown === 'mac' ? 'mac' : 'other',
    options: [{ id: 'mac', label: '', title: 'Mac and iPad' }, { id: 'other', label: '', title: 'Windows and Linux' }], onChange: (p) => setPlatform(p) });
  head.appendChild(sw.root);
  el('span', 'km-os-mac', sw.button('mac'), '⌘').setAttribute('aria-hidden', 'true');
  ariaLabel(sw.button('mac'), 'Show Mac and iPad key names');
  const winMark = el('span', 'km-os-windows', sw.button('other')); winMark.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 4; i++) el('span', '', winMark);
  ariaLabel(sw.button('other'), 'Show Windows and Linux key names');
  const board = el('div', 'km-keyboard', colL);
  board.setAttribute('role', 'group'); ariaLabel(board, 'The keyboard'); board.translate = false;

  /* the right well: record and reset, the status, the search, the list */
  const colR = el('div', 'km-col km-col-right', root);
  const tools = el('div', 'km-editor-actions', colR);
  const rec = trig({ label: 'RECORD INPUT', cls: 'km-btn km-btn-record', onFire: () => (recording ? cancelRecording() : startRecording()) });   // tr[RECORD INPUT]: start listening for the new KEY (or chord) of the chosen shortcut: it records a keypress, not audio
  const rst = trig({ label: 'RESET TO DEFAULT', cls: 'km-btn km-btn-reset', onFire: () => resetAll() });
  rec.on = false; tools.append(rec.root, rst.root);
  const statusEl = el('div', 'km-status', colR); statusEl.setAttribute('role', 'status');   // THE HAND: its seat is kept when it says nothing (keyboard.css), so a key pressed on the board moves no row of the list
  const search = el('input', 'km-search', colR); search.type = 'search'; ariaLabel(search, 'Find a keyboard action');
  const placeholder = () => { search.placeholder = t('Find an action or key…'); };
  placeholder();
  const list = el('div', 'km-list', colR); list.setAttribute('role', 'listbox'); ariaLabel(list, 'Keyboard actions');

  const win = createWindow({ id: 'keyboard', title: 'KEYBOARD', host, persist, onMoved, emptyDrag: true,
    size: { w: 1080, h: narrow() ? 530 : 416 }, min: { w: 300, h: 300 }, body: root,
    onOpen: () => refresh(), onClose: () => { if (recording) cancelRecording(); } });
  win.root.classList.add('km-win');

  /* ── the status line: one English sentence, kept so a language change says it again ── */
  function status(msg, vars, tone = 'info') {
    const en = msg && typeof msg === 'object' ? msg.t : msg;                    // { t: 'English' } so the catalogue finds it
    last = en ? { en, vars, tone } : null;
    statusEl.dataset.tone = tone;
    statusEl.textContent = en ? t(en, vars) : '';
  }
  const named = (id) => ({ t: (keys.get(id) || {}).label || id });

  /* ── the board ── */
  const keyEls = new Map();
  function buildBoard() {
    board.textContent = ''; keyEls.clear();
    boardRows(shown).forEach((row, r) => {
      const rowEl = el('div', 'km-kb-row', board);
      row.forEach((k, c) => {
        const b = el('button', 'km-key km-key-w-' + k.w, rowEl); b.type = 'button'; b.dataset.code = k.code; b.dataset.row = r; b.dataset.col = c;
        b.tabIndex = -1;
        const top = el('span', 'km-key-top', b);
        el('span', 'km-key-shift-char', top, k.shift);
        const badge = el('span', 'km-badge', top); badge.hidden = true;
        el('span', 'km-key-cap', b, k.cap);
        el('span', 'km-key-sub', b);
        if (!keyEls.has(k.code)) keyEls.set(k.code, []);
        keyEls.get(k.code).push(b);
      });
    });
  }
  board.addEventListener('click', (e) => { const b = e.target.closest('.km-key'); if (b) pressKey(b); }, on);
  board.addEventListener('pointerover', (e) => { const b = e.target.closest('.km-key'); if (b) hoverCode(b.dataset.code); }, on);
  board.addEventListener('pointerleave', () => clearHover(), on);
  board.addEventListener('focusin', (e) => { const b = e.target.closest('.km-key'); if (b) { seat(b); hoverCode(b.dataset.code); } }, on);
  board.addEventListener('focusout', () => clearHover(), on);
  /* one tab stop for the board; arrows walk it, the nearest key by centre in the next row */
  board.addEventListener('keydown', (e) => {
    const b = e.target.closest('.km-key'); if (!b || e.ctrlKey || e.metaKey || e.altKey) return;
    const rows = [...board.children].map((r) => [...r.children]);
    const r = +b.dataset.row, c = +b.dataset.col;
    let to = null;
    if (e.code === 'ArrowRight') to = rows[r][Math.min(c + 1, rows[r].length - 1)];
    else if (e.code === 'ArrowLeft') to = rows[r][Math.max(c - 1, 0)];
    else if (e.code === 'Home') to = rows[r][0];
    else if (e.code === 'End') to = rows[r][rows[r].length - 1];
    else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      const nr = rows[r + (e.code === 'ArrowUp' ? -1 : 1)]; if (!nr) { e.preventDefault(); return; }
      const box = b.getBoundingClientRect(), x = box.left + box.width / 2;
      to = nr.reduce((best, k) => { const q = k.getBoundingClientRect(), d = Math.abs(q.left + q.width / 2 - x); return !best || d < best.d ? { k, d } : best; }, null).k;
    } else return;
    e.preventDefault(); if (to) { seat(to); to.focus(); }
  }, on);
  function seat(b) { for (const k of board.querySelectorAll('.km-key')) k.tabIndex = k === b ? 0 : -1; }

  function pressKey(b) {
    const code = b.dataset.code;
    if (recording) {
      if (DRAWN_MOD[code]) { const m = DRAWN_MOD[code]; if (latched.has(m)) latched.delete(m); else latched.add(m); paintBoard(); return; }
      keys.answer([...latched, code].join('+'));
      return;
    }
    const here = keyStates(keys.list(), shown).get(code), cap = keyText(code, shown);
    if (!here || !here.on.length) { status(here && here.lit ? { t: '{key} is a modifier: it joins a chord' } : { t: '{key} is free' }, { key: cap }); return; }
    const ids = [...new Set(here.on.map((x) => x.id))];
    const next = ids[(ids.indexOf(selected) + 1) % ids.length] || ids[0];
    select(next);
    const chord = here.on.find((x) => x.id === next).chord;
    status({ t: '{chord} runs “{action}”' }, { chord: displayChord(chord, shown), action: named(next) });
    scrollToRow(next);
  }

  function paintBoard() {
    const all = keys.list(), S = keyStates(all, shown, selected), conflict = new Set(keys.conflicts().map((c) => parseChord(c.chord).code));
    if (pending) conflict.add(parseChord(pending).code);
    const short = (id) => { const a = all.find((x) => x.id === id); return a ? a.short || a.label : id; };
    for (const [code, els] of keyEls) {
      const s = S.get(code) || { on: [], lit: false, selected: false };
      const bound = s.on.length > 0, lit = !bound && s.lit, mod = DRAWN_MOD[code];
      for (const b of els) {
        b.classList.toggle('km-key-bound', bound || lit);
        b.classList.toggle('km-key-unbound', !bound && !lit);
        b.classList.toggle('km-key-selected', s.selected);
        b.classList.toggle('km-key-recording', recording && s.selected && !mod);
        b.classList.toggle('km-key-latched', recording && !!mod && latched.has(mod));
        b.classList.toggle('km-key-conflict', conflict.has(code));
        const badge = b.querySelector('.km-badge'), sub = b.querySelector('.km-key-sub');
        const rep = s.on.find((x) => x.id === selected) || s.on[0];
        const layers = [...new Set(s.on.map((x) => x.mods.map((m) => modText(m, shown)).join('')))].filter(Boolean);
        if (rep && (rep.mods.length || layers.length > 1)) {
          badge.hidden = false;
          badge.className = 'km-badge km-badge-' + (layers.length > 1 && !s.selected ? 'combo' : badgeKind(rep.mods));
          badge.textContent = layers.length > 1 && !s.selected ? layers.join(' · ') : rep.mods.map((m) => modText(m, shown)).join('');
        } else badge.hidden = true;
        if (recording && s.selected && !mod) label(sub, 'press a key…');
        else if (bound) {
          const ids = [...new Set(s.on.map((x) => x.id))];
          if (ids.length > 1 && !s.selected) { delete sub.dataset.t; sub.textContent = ids.map((i) => t(short(i))).join(' · '); }
          else label(sub, short(rep.id));
        } else label(sub, '');
        b.setAttribute('aria-pressed', String(s.selected));
        const capName = keyText(code, shown);
        if (bound) ariaLabel(b, '{key}: {action}', { key: capName, action: { t: short(rep.id) } });
        else ariaLabel(b, lit ? '{key}: a modifier' : '{key}: free', { key: capName });
      }
    }
    if (!board.querySelector('.km-key[tabindex="0"]')) { const first = board.querySelector('.km-key-selected') || board.querySelector('.km-key-bound') || board.querySelector('.km-key'); if (first) seat(first); }
  }
  function hoverCode(code) {
    clearHover();
    for (const b of keyEls.get(code) || []) b.classList.add('km-key-hovered');
    const S = keyStates(keys.list(), shown).get(code);
    if (S) for (const x of S.on) { const r = list.querySelector(`.km-action-row[data-id="${CSS.escape(x.id)}"]`); if (r) r.classList.add('km-action-row-hovered'); }
  }
  function hoverAction(id) {
    clearHover();
    for (const chord of keys.chords(id)) {
      const p = parseChord(chord); if (!p) continue;
      for (const code of [p.code, ...p.mods.flatMap((m) => MOD_KEYS(m, shown))]) for (const b of keyEls.get(code) || []) b.classList.add('km-key-hovered');
    }
  }
  function clearHover() { for (const n of root.querySelectorAll('.km-key-hovered, .km-action-row-hovered')) n.classList.remove('km-key-hovered', 'km-action-row-hovered'); }

  /* ── the list ── */
  function chipsFor(parent, a) {
    const chips = el('span', 'km-chips', parent);
    if (recording && a.id === selected) { label(el('span', 'km-chip km-chip-recording', chips), 'press a key…'); return; }
    const chord = a.keys[0];
    if (!chord) { el('span', 'km-chip km-chip-unbound', chips, '—'); return; }
    const p = parseChord(chord);
    for (const m of p.mods) el('span', 'km-chip km-chip-mod', chips, modText(m, shown)).translate = false;
    el('span', 'km-chip km-chip-key', chips, keyText(p.code, shown)).translate = false;
    if (a.keys.length > 1) { const more = el('span', 'km-chip km-chip-more', chips, '+' + (a.keys.length - 1)); more.title = a.keys.slice(1).map((c) => displayChord(c, shown)).join('  '); }
  }
  function renderList() {
    list.textContent = '';
    const term = search.value.trim().toLowerCase();
    const all = keys.list();
    const hit = (a) => !term || [a.label, t(a.label), a.hint, a.hint && t(a.hint), a.group, t(a.group), ...a.keys.map((c) => displayChord(c, shown))]
      .some((s) => s && String(s).toLowerCase().includes(term));
    let group = null;
    for (const a of all.filter(hit)) {
      if (a.group !== group) { group = a.group; label(el('div', 'km-action-group', list), group); }
      const row = el('button', 'km-action-row', list); row.type = 'button'; row.dataset.id = a.id;
      row.setAttribute('role', 'option'); row.setAttribute('aria-selected', String(a.id === selected));
      row.classList.toggle('km-action-row-selected', a.id === selected);
      row.classList.toggle('km-action-row-recording', recording && a.id === selected);
      const text = el('span', 'km-action-text', row);
      label(el('span', 'km-action-label', text), a.short || a.label);
      const desc = a.hint || (a.short ? a.label : '');
      if (desc) label(el('span', 'km-action-desc', text), desc);
      chipsFor(row, a);
    }
    if (!list.children.length) label(el('div', 'km-empty', list), 'Nothing matches');
  }
  list.addEventListener('click', (e) => { const r = e.target.closest('.km-action-row'); if (r) { if (recording) cancelRecording(); select(r.dataset.id); status(''); } }, on);
  list.addEventListener('pointerover', (e) => { const r = e.target.closest('.km-action-row'); if (r) hoverAction(r.dataset.id); }, on);
  list.addEventListener('pointerleave', () => clearHover(), on);
  list.addEventListener('focusin', (e) => { const r = e.target.closest('.km-action-row'); if (r) hoverAction(r.dataset.id); }, on);
  search.addEventListener('input', () => renderList(), on);
  function scrollToRow(id) {
    const r = list.querySelector(`.km-action-row[data-id="${CSS.escape(id)}"]`); if (!r) return;
    const top = r.offsetTop - list.offsetTop, bottom = top + r.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top; else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }

  /* ── recording: λWAVES' flow, the table's record() underneath ── */
  async function startRecording() {
    if (!selected) { status({ t: 'Choose an action in the list first, then press {:RECORD INPUT}' }); return; }
    const id = selected;
    recording = true; latched = new Set(); pending = null; refresh();
    const tap = touchOnly(view);
    status(tap ? (narrow() ? { t: 'Listening for “{action}”. This looks like a touch screen with no keyboard and no board to tap: press the new keys on a hardware keyboard if one is connected, or press {:RECORD INPUT} again to cancel.' }
      : { t: 'Listening for “{action}”. This looks like a touch screen with no keyboard: tap the new key on the board (tap SHIFT, CTRL or ALT first for a modifier), or press {:RECORD INPUT} again to cancel.' })
      : { t: 'Listening for “{action}”: press the new keys with any modifiers, or tap them on the board. Esc cancels.' }, { action: named(id) });
    while (recording && selected === id) {
      const c = await keys.record();
      if (!recording || selected !== id) return;
      if (c === null) { cancelRecording(); return; }
      latched = new Set();
      const why = keys.check(id, c);
      if (why) { status(why, null, 'conflict'); paintBoard(); continue; }
      const mine = keys.chords(id);
      if (mine.length === 1 && mine[0] === c) { recording = false; pending = null; refresh(); status({ t: '“{action}” already has {chord}' }, { action: named(id), chord: displayChord(c, shown) }); return; }
      const others = keys.holders(c).filter((x) => x !== id);
      if (others.length && pending !== c) {
        pending = c; paintBoard();
        status({ t: '{chord} is already bound to “{other}”: press it again to take it, or Esc to cancel' }, { chord: displayChord(c, shown), other: named(others[0]) }, 'conflict');
        continue;
      }
      const r = keys.bind(id, c);
      recording = false; pending = null;
      if (!r.ok) { refresh(); status(r.reason, null, 'conflict'); return; }
      refresh();
      if (r.stolen.length) status({ t: '{chord} now runs “{action}”, taken from “{other}”' }, { chord: displayChord(c, shown), action: named(id), other: named(r.stolen[0].id) });
      else status({ t: '“{action}” is now bound to {chord}' }, { action: named(id), chord: displayChord(c, shown) });
      return;
    }
  }
  function cancelRecording() {
    if (!recording) return;
    recording = false; pending = null; latched = new Set();
    keys.stopRecording(); refresh();
    status(selected ? { t: 'Cancelled: “{action}” keeps its keys' } : { t: 'Recording cancelled' }, selected ? { action: named(selected) } : null);
  }
  function resetAll() {
    if (recording) cancelRecording();
    keys.resetAll();
    status({ t: 'Every key is back to its default' });
  }

  /* Escape: a recording takes it first (keys.record), then the search, then the window */
  win.root.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape' || recording || e.defaultPrevented) return;
    e.preventDefault(); e.stopPropagation();
    if (e.target === search && search.value) { search.value = ''; renderList(); } else win.close();
  }, on);

  function select(id) {
    if (!keys.get(id)) return;
    selected = id; pending = null;
    paintBoard();
    for (const r of list.querySelectorAll('.km-action-row')) { const on = r.dataset.id === id; r.classList.toggle('km-action-row-selected', on); r.setAttribute('aria-selected', String(on)); }
  }
  function setPlatform(p) {
    shown = p === 'mac' ? 'mac' : 'other'; sw.set(shown);
    buildBoard(); refresh(); status('');
  }
  function refresh() {
    rec.on = recording; rec.setLabel(recording ? 'LISTENING…' : 'RECORD INPUT');
    root.classList.toggle('km-recording', recording);
    paintBoard(); renderList();
  }
  const offKeys = keys.onChange(() => { if (win.isOpen()) refresh(); });
  const offLang = onLanguage(() => { placeholder(); if (last) status(last.en, last.vars, last.tone); if (win.isOpen()) refresh(); });

  buildBoard(); refresh();
  return {
    win, root,
    open: () => win.open(), close: () => win.close(), toggle: () => win.toggle(), isOpen: () => win.isOpen(),
    select(id) { select(id); scrollToRow(id); },
    setPlatform, refresh,
    record: () => startRecording(),
    destroy() { if (recording) cancelRecording(); offKeys(); offLang(); life.abort(); win.destroy(); },
  };
}

/* ── THE HELP VIEW: the table's helpRows(), by group — every hand-written help dialog's replacement ─────────── */
export function createKeysHelp({ keys, host, persist = null, onMoved } = {}) {
  const root = el('div', 'km-help');
  const win = createWindow({ id: 'keys-help', title: 'KEYS', host, persist, onMoved, emptyDrag: true,
    size: { w: 380, h: 460 }, min: { w: 260, h: 220 }, body: root, onOpen: () => refresh() });
  win.root.classList.add('km-help-win');
  function refresh() {
    root.textContent = '';
    for (const g of keys.helpRows()) {
      label(el('div', 'km-action-group', root), g.group);
      for (const r of g.rows) {
        const row = el('div', 'km-help-row', root); row.dataset.id = r.id;
        const text = el('span', 'km-action-text', row);
        label(el('span', 'km-action-label', text), r.label);
        if (r.hint) label(el('span', 'km-action-desc', text), r.hint);
        const chips = el('span', 'km-chips', row);
        if (!r.chords.length) el('span', 'km-chip km-chip-unbound', chips, '—');
        for (const c of r.chords) el('span', 'km-chip km-chip-key', chips, c).translate = false;
      }
    }
  }
  const off = keys.onChange(() => { if (win.isOpen()) refresh(); });
  refresh();
  return { win, root, open: () => win.open(), close: () => win.close(), toggle: () => win.toggle(), isOpen: () => win.isOpen(), refresh,
    destroy() { off(); win.destroy(); } };
}
