/* MIR · shell/keys.js — THE ONE KEY TABLE.
 *
 * An app declares its keyboard once, as data, and everything else is generated from it: the one keydown listener
 * that runs the actions, the menus' key column, the hint a control shows, the help view, the keyboard window
 * (mir/keyboard/keyboard.js) and the `keys` member of a spec envelope (docs/FORMAT.md).  Harvested from λWAVES
 * (lab/shortcuts.js: the binding law and the steal; lab/keymap.js: the editor's model), SOLEIL and POLAR (one
 * KEYS[] that generates the help dialog and the "(K)" hints).
 *
 * THE LAWS IT KEEPS
 *   1. ONE CHORD SPELLING.  A chord is `Mod+Ctrl+Alt+Shift+Meta+<code>` — the modifiers in that fixed order, the key
 *      as its KeyboardEvent.code (KeyS, Digit1, Slash, ArrowLeft …), so a binding names a PLACE on the board and
 *      survives AZERTY, Dvorak and every script.  `Mod` is the platform's command key: ⌘ on a Mac, Ctrl elsewhere,
 *      so 'Mod+S' is one table for both.  Authors may write 'ctrl+shift+s', '⌘S'-style tokens, '?', 'Esc', 'Up' —
 *      parseChord() turns each into the one spelling, and every spelling is ASCII (it fits the envelope's CHORD).
 *   2. ONE LISTENER.  createKeys() adds exactly one bubbling keydown listener.  It never runs an app key
 *      - while a text field has the focus, unless the action says `inFields` (the notebook's Ctrl/⌘+S and Ctrl/⌘+,);
 *      - when a focused control OWNS the key (a slider its arrows, a radio row its arrows, a button its Space/Enter),
 *        unless the action says `overControls` (BASINS: Space plays over a focused button; its release is taken too);
 *      - when something nearer the target already took the key (defaultPrevented), or the IME is composing;
 *      - on auto-repeat, unless the action says `repeat: true`.
 *      A chord held by two actions runs the FIRST in table order whose `when()` holds.
 *   3. REBINDING STEALS, AND SAYS FROM WHOM.  bind(id, chord) gives the chord to `id` and takes it from every other
 *      action that held it; the result names the losers.  Escape (it closes and cancels) and Tab (focus) are refused.
 *   4. ONLY THE DIFFERENCE IS SAVED, as { actionId: [chords] } through the injected storage.  A saved binding for an
 *      action that no longer exists, or a chord that no longer parses, is dropped quietly, never thrown.
 *   5. NOTHING IS FOUND BY ITS LABEL.  Actions are found by id, hint targets by `data-key-action`.  Labels are
 *      English, translated where they are shown (kit.js label()); key caps are never translated.
 *   6. IDLE COSTS NOTHING: no timers, no polling; the listener is one map lookup per keydown.
 *
 * createKeys({ actions, storage?, platform?, target? }) → the table (API at the foot of this header).
 *   action  { id, label, group, keys: ['Mod+S', …], run(event, action), when?(), hint?, inFields?, overControls?, repeat?, short?, up? }
 *           overControls: the action runs even when a focused control owns its key (BASINS: Space plays with a button
 *           or a slider focused) — never in a text field unless it also says inFields
 *           up(event, action): a HELD key — run() on the press, up() on that key's release (or when the page loses
 *           the focus); INFORMATIONAL's hold-still is one (info/layer.js infoActions)
 *           label/group/hint/short are English; `short` is the name a key cap carries (default: the label)
 *   storage { get() → saved object | JSON string | null, set(object) }   (localKeyStorage(name) is one over localStorage)
 *   platform 'mac' | 'other' (default: detected)
 *
 *   run(id, event?)        run an action now if its when() holds → boolean
 *   bind(id, chord, { add })  → { ok, chord, stolen: [{ id, label }], reason? }   add: keep the action's other chords
 *   unbind(id, chord?)      remove one chord, or all of them
 *   reset(id) · resetAll()  back to the declared keys
 *   check(id, chord)        → null, or the English reason bind() would refuse it
 *   holders(chord)          → the ids holding it, in table order
 *   conflicts()             → [{ chord, ids }] for every chord held by more than one action
 *   record()                → Promise<chord | null>: the next chord pressed; Escape → null.  answer(chord) settles it
 *                             from elsewhere (a tap on the drawn board), stopRecording() cancels it; recording() says
 *   menuKey(id, platform?)  → the menu row's key text in that platform's symbols ('⌘S', 'Ctrl+S'), '' if unbound
 *   menuItem(id, label?)    → a ready menubar entry [label\tkey, run, disabled()]; a held action's row latches (press: run, press again: up)
 *   hint(id)                → the same key text, for a control's hint
 *   hints(root)             writes data-key-hint and aria-keyshortcuts on every [data-key-action] under root
 *   helpRows()              → [{ group, rows: [{ id, label, hint, chords: [text], keys: [chord] }] }]
 *   describe()              → plain data: { platform, actions: [{ id, label, group, hint, keys, defaults, display }] }
 *   list() · get(id) · chords(id) · saved() · restore(obj) · onChange(fn) → off · add(action | actions) · platform · destroy()
 *   A declared key that does not parse (a modifier alone, a typo) THROWS at createKeys / add, naming the action.
 *
 * Pure, exported and node-tested: parseChord, normalize, chordFromEvent, displayChord, ariaChord, pickAction,
 * isField, ownsKey, steal, diffSaved, repairSaved, bindError, detectPlatform. */
import { isField } from '../core/pointer.js';
import { jsonStore } from '../core/prefs.js';

/* ── the spelling ───────────────────────────────────────────────────────────────────────────────────────── */
export const MOD_ORDER = Object.freeze(['Mod', 'Ctrl', 'Alt', 'Shift', 'Meta']);
const MOD_ALIAS = { mod: 'Mod', cmdorctrl: 'Mod', commandorcontrol: 'Mod', primary: 'Mod',
  ctrl: 'Ctrl', control: 'Ctrl', ctl: 'Ctrl', '⌃': 'Ctrl',
  alt: 'Alt', option: 'Alt', opt: 'Alt', '⌥': 'Alt',
  shift: 'Shift', '⇧': 'Shift',
  meta: 'Meta', cmd: 'Meta', command: 'Meta', '⌘': 'Meta', win: 'Meta', super: 'Meta', os: 'Meta' };
export const MODIFIER_CODES = Object.freeze(new Set(['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight',
  'MetaLeft', 'MetaRight', 'OSLeft', 'OSRight', 'CapsLock', 'Fn', 'FnLock']));
const NAMED = ['Space', 'Enter', 'Tab', 'Escape', 'Backspace', 'Delete', 'Insert', 'Home', 'End', 'PageUp', 'PageDown',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backquote', 'Minus', 'Equal', 'BracketLeft', 'BracketRight',
  'Backslash', 'Semicolon', 'Quote', 'Comma', 'Period', 'Slash', 'IntlBackslash', 'ContextMenu', 'Pause', 'PrintScreen', 'ScrollLock'];
const CODE_LC = Object.fromEntries(NAMED.map((c) => [c.toLowerCase(), c]));
Object.assign(CODE_LC, { esc: 'Escape', return: 'Enter', spacebar: 'Space', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft',
  right: 'ArrowRight', del: 'Delete', ins: 'Insert', pgup: 'PageUp', pgdn: 'PageDown', pagedn: 'PageDown', bksp: 'Backspace',
  '←': 'ArrowLeft', '→': 'ArrowRight', '↑': 'ArrowUp', '↓': 'ArrowDown', '↩': 'Enter', '⌫': 'Backspace', '⌦': 'Delete', '⇥': 'Tab', '⎋': 'Escape' });
/* the US ANSI legends: the unshifted character → its code, and the shifted one → [code, Shift] */
const CHAR_CODE = { '`': 'Backquote', '-': 'Minus', '=': 'Equal', '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash',
  ';': 'Semicolon', "'": 'Quote', ',': 'Comma', '.': 'Period', '/': 'Slash', ' ': 'Space' };
const SHIFT_CHAR = { '~': 'Backquote', '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', $: 'Digit4', '%': 'Digit5', '^': 'Digit6',
  '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0', _: 'Minus', '+': 'Equal', '{': 'BracketLeft', '}': 'BracketRight',
  '|': 'Backslash', ':': 'Semicolon', '"': 'Quote', '<': 'Comma', '>': 'Period', '?': 'Slash' };
export const CODE_CHAR = Object.freeze(Object.fromEntries(Object.entries(CHAR_CODE).map(([c, k]) => [k, c])));

/** detectPlatform(nav?) → 'mac' | 'other': ⌘ is the command key on a Mac, an iPhone and an iPad */
export function detectPlatform(nav = typeof navigator !== 'undefined' ? navigator : null) {
  try { const p = ((nav && (nav.userAgentData && nav.userAgentData.platform)) || (nav && nav.platform) || '') + ' ' + ((nav && nav.userAgent) || '');
    return /Mac|iPhone|iPad|iPod/i.test(p) ? 'mac' : 'other'; } catch (_) { return 'other'; }
}

/** keyToken(token) → [code, impliedShift] | null — one key name in any accepted spelling */
function keyToken(tok) {
  if (!tok) return null;
  if (/^Key[A-Z]$/.test(tok) || /^Digit[0-9]$/.test(tok) || /^F([1-9]|1[0-9]|2[0-4])$/.test(tok) || /^Numpad[A-Za-z0-9]+$/.test(tok)) return [tok, false];
  if (tok.length === 1) {
    if (/[a-z]/i.test(tok)) return ['Key' + tok.toUpperCase(), false];
    if (/[0-9]/.test(tok)) return ['Digit' + tok, false];
    if (CHAR_CODE[tok]) return [CHAR_CODE[tok], false];
    if (SHIFT_CHAR[tok]) return [SHIFT_CHAR[tok], true];
  }
  const lc = tok.toLowerCase();
  if (CODE_LC[lc]) return [CODE_LC[lc], false];
  if (CODE_LC[tok]) return [CODE_LC[tok], false];
  if (/^f([1-9]|1[0-9]|2[0-4])$/.test(lc)) return ['F' + lc.slice(1), false];
  if (/^key[a-z]$/.test(lc)) return ['Key' + lc.slice(3).toUpperCase(), false];
  if (/^digit[0-9]$/.test(lc)) return ['Digit' + lc.slice(5), false];
  return null;
}

/** parseChord(s, platform) → { mods: [ordered], code } | null.  On a Mac 'Meta'/'Cmd' is Mod; elsewhere 'Ctrl' is. */
export function parseChord(s, platform = 'other') {
  if (typeof s !== 'string') return null;
  const str = s.trim();
  if (!str || str.length > 64) return null;
  const toks = str.split(/\+(?!$)/).map((x) => x.trim());
  const mods = new Set(); let code = null;
  for (const tok of toks) {
    if (!tok) return null;
    const m = MOD_ALIAS[tok.toLowerCase()] || MOD_ALIAS[tok];
    if (m && !(toks.length === 1)) {                                   // a lone 'Shift' is a key name nobody can press alone
      mods.add(m === 'Meta' && platform === 'mac' ? 'Mod' : m === 'Ctrl' && platform !== 'mac' ? 'Mod' : m); continue;
    }
    if (m) return null;
    if (code) return null;                                             // two keys: not a chord
    const k = keyToken(tok); if (!k) return null;
    code = k[0]; if (k[1]) mods.add('Shift');
  }
  if (!code || MODIFIER_CODES.has(code)) return null;
  return { mods: MOD_ORDER.filter((x) => mods.has(x)), code };
}
const join = (p) => (p ? [...p.mods, p.code].join('+') : null);
/** normalize(s, platform) → the one spelling ('Mod+Shift+KeyS'), or null when it does not parse */
export const normalize = (s, platform = 'other') => join(parseChord(s, platform));

/** chordFromEvent(e, platform) → the chord a keydown is, or null for a modifier pressed alone */
export function chordFromEvent(e, platform = 'other') {
  if (!e || !e.code || MODIFIER_CODES.has(e.code)) return null;
  const mods = new Set();
  if (platform === 'mac') { if (e.metaKey) mods.add('Mod'); if (e.ctrlKey) mods.add('Ctrl'); }
  else { if (e.ctrlKey) mods.add('Mod'); if (e.metaKey) mods.add('Meta'); }
  if (e.altKey) mods.add('Alt');
  if (e.shiftKey) mods.add('Shift');
  return [...MOD_ORDER.filter((x) => mods.has(x)), e.code].join('+');
}

/* ── the display (never translated: a key cap is a key cap in every language) ────────────────────────────── */
const KEY_TEXT = { Space: 'Space', Escape: 'Esc', Enter: 'Enter', Tab: 'Tab', Backspace: 'Bksp', Delete: 'Del', Insert: 'Ins',
  Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  IntlBackslash: '§', ContextMenu: 'Menu' };
const MAC_KEY = { Enter: '↩', Backspace: '⌫', Delete: '⌦', Tab: '⇥', Escape: '⎋' };
/** keyText(code, platform) → the cap's legend: 'S', '5', '/', '←', 'Space' */
export function keyText(code, platform = 'other') {
  if (!code) return '';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  if (platform === 'mac' && MAC_KEY[code]) return MAC_KEY[code];
  return CODE_CHAR[code] && code !== 'Space' ? CODE_CHAR[code] : KEY_TEXT[code] || code;
}
const MAC_SYM = { Ctrl: '⌃', Alt: '⌥', Shift: '⇧', Mod: '⌘', Meta: '⌘' };
const PC_WORD = { Mod: 'Ctrl', Ctrl: 'Ctrl', Alt: 'Alt', Shift: 'Shift', Meta: 'Win' };
/** displayChord(chord, platform) → '⌘⇧S' on a Mac (Apple's order ⌃⌥⇧⌘), 'Ctrl+Shift+S' elsewhere; '' if none */
export function displayChord(chord, platform = 'other') {
  const p = parseChord(chord, platform); if (!p) return '';
  if (platform === 'mac') {
    const order = ['Ctrl', 'Alt', 'Shift', 'Mod', 'Meta'];
    return [...new Set(order.filter((m) => p.mods.includes(m)).map((m) => MAC_SYM[m]))].join('') + keyText(p.code, 'mac');
  }
  return [...new Set(p.mods.map((m) => PC_WORD[m]))].concat(keyText(p.code, 'other')).join('+');
}
/** modText(mod, platform) → one modifier's cap text, for a chip: '⌘' / 'Ctrl', '⇧', '⌥' / 'Alt' */
export const modText = (m, platform = 'other') => (platform === 'mac' ? MAC_SYM[m] : m === 'Shift' ? '⇧' : PC_WORD[m]) || m;
/** ariaChord(chord, platform) → the aria-keyshortcuts spelling ('Control+Shift+S', 'Meta+S') */
export function ariaChord(chord, platform = 'other') {
  const p = parseChord(chord, platform); if (!p) return '';
  const word = { Mod: platform === 'mac' ? 'Meta' : 'Control', Ctrl: 'Control', Alt: 'Alt', Shift: 'Shift', Meta: 'Meta' };
  const k = p.code.startsWith('Key') ? p.code.slice(3) : p.code.startsWith('Digit') ? p.code.slice(5) : CODE_CHAR[p.code] && p.code !== 'Space' ? CODE_CHAR[p.code] : p.code;
  return [...new Set(p.mods.map((m) => word[m]))].concat(k).join('+');
}

/* ── where a key belongs ────────────────────────────────────────────────────────────────────────────────── */
/** isField(node) — a place the user types: a text input, a textarea, a select, anything contenteditable (core/pointer.js's) */
export { isField };
const ARROWS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);
/** ownsKey(node, chord) — a focused control keeps the plain keys it operates by: a slider or spin button its arrows,
 *  Home/End and pages; a radio, tab, option or menu item its arrows; a button, link or check its Space and Enter */
export function ownsKey(n, chord) {
  if (!n || n.nodeType !== 1 || !chord || chord.includes('+')) return false;      // a modified chord is never a control's
  const role = (n.getAttribute && n.getAttribute('role')) || '', tag = (n.tagName || '').toLowerCase(), type = String(n.type || '').toLowerCase();
  if (role === 'slider' || role === 'spinbutton' || (tag === 'input' && type === 'range')) return ARROWS.has(chord) || chord === 'PageUp' || chord === 'PageDown';
  if (/^(radio|tab|option|menuitem|menuitemradio|menuitemcheckbox|treeitem|gridcell)$/.test(role)) return ARROWS.has(chord) || chord === 'Space' || chord === 'Enter';
  if (tag === 'button' || tag === 'summary' || (tag === 'a' && n.hasAttribute && n.hasAttribute('href')) || /^(button|checkbox|switch|link)$/.test(role) || (tag === 'input' && /^(checkbox|radio|button|submit|reset|color|file)$/.test(type))) return chord === 'Space' || chord === 'Enter';
  return false;
}

/** pickAction(entries, chord, { field, repeat, owned }) → the entry to run, or null.  Table order; the first whose
 *  when() holds; a field reaches only an `inFields` action; a key a focused control owns only an `overControls` one;
 *  a repeat only a `repeat` one.  A throwing when() is false. */
export function pickAction(entries, chord, { field = false, repeat = false, owned = false } = {}) {
  if (!chord) return null;
  for (const a of entries) {
    if (!a.keys || !a.keys.includes(chord)) continue;
    if (field && !a.inFields) continue;
    if (owned && !a.overControls) continue;
    if (repeat && !a.repeat) continue;
    let ok = true; if (a.when) { try { ok = !!a.when(); } catch (_) { ok = false; } }
    if (ok) return a;
  }
  return null;
}

/* ── the binding law ────────────────────────────────────────────────────────────────────────────────────── */
/** bindError(chord) → null, or the English reason the chord cannot be bound (λWAVES shortcuts.js) */
const WHY = { key: { t: 'Choose a key, with any modifiers.' }, esc: { t: 'Escape is kept for closing and cancelling.' },
  tab: { t: 'Tab is kept for moving the focus.' }, none: { t: 'No such action.' } };      // { t } so the catalogue finds them
export function bindError(chord) {
  const p = parseChord(chord);
  if (!p) return WHY.key.t;
  if (p.code === 'Escape') return WHY.esc.t;
  if (p.code === 'Tab' && (p.mods.length === 0 || (p.mods.length === 1 && p.mods[0] === 'Shift'))) return WHY.tab.t;
  return null;
}
/** steal(map, id, chord, { add }) → { map, stolen: [ids] } — pure: `id` gets `chord`, every other holder loses it */
export function steal(map, id, chord, { add = false } = {}) {
  const out = {}, stolen = [];
  for (const [k, list] of Object.entries(map)) {
    if (k === id) continue;
    if (list.includes(chord)) { stolen.push(k); out[k] = list.filter((c) => c !== chord); } else out[k] = list.slice();
  }
  const mine = add ? (map[id] || []).filter((c) => c !== chord).concat(chord) : [chord];
  out[id] = mine;
  return { map: out, stolen };
}
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
/** diffSaved(defaults, current) → { id: [chords] } for each action whose chords differ from its defaults */
export function diffSaved(defaults, current) {
  const out = {};
  for (const [id, list] of Object.entries(current)) if (!same(list, defaults[id] || [])) out[id] = list.slice();
  return out;
}
/** repairSaved(raw, ids, platform) → { keys: { id: [chords] }, dropped: [{ id, why, chord? }] } — a saved object, a JSON string or a
 *  spec's `keys`: an unknown action is dropped, a chord that does not parse is dropped, a list whose every chord was
 *  bad keeps the defaults; [] stays (the action was unbound on purpose).  Never throws. */
export function repairSaved(raw, ids, platform = 'other') {
  const keys = {}, dropped = [];
  let o = raw;
  if (typeof o === 'string') { try { o = JSON.parse(o); } catch (_) { return { keys, dropped: [{ id: null, why: 'not JSON' }] }; } }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { keys, dropped: o == null ? [] : [{ id: null, why: 'not an object' }] };
  const known = new Set(ids);
  for (const [id, v] of Object.entries(o)) {
    if (!known.has(id)) { dropped.push({ id, why: 'no such action' }); continue; }
    const list = typeof v === 'string' ? [v] : Array.isArray(v) ? v : null;
    if (!list) { dropped.push({ id, why: 'not a chord list' }); continue; }
    const good = [];
    for (const c of list.slice(0, 8)) { const n = normalize(c, platform); if (n && !good.includes(n)) good.push(n); else if (!n) dropped.push({ id, why: 'not a chord', chord: String(c).slice(0, 40) }); }
    if (list.length && !good.length) continue;
    keys[id] = good;
  }
  return { keys, dropped };
}

/** localKeyStorage(name) → { get, set } over localStorage; a private window or a full quota costs the save, nothing else */
export function localKeyStorage(name = 'mir.keys') {
  const s = jsonStore(name);
  return { get: s.get, set(o) { if (o && Object.keys(o).length) s.set(o); else s.remove(); } };   // nothing rebound: no record at all
}

/* ── the kit's default keys: BASINS' table (app/shell.js: "M modulation, S save, J about, B rack, T dock, H hide,
      F full screen, Space play"), ruled the kit's default 2026-10-02.  createApp() builds its rows from this map, so
      a menu, a hint, the help view and the docs all read one place.  An app rebinds by its own row or the KEYBOARD. ── */
export const KIT_KEYS = Object.freeze({
  'transport.play': 'Space',     // the one play (shell/transport.js transportActions)
  save: 'Mod+S',                 // save over the open project (FOLDERS)
  folders: 'S',                  // FOLDERS (BASINS: its SAVE window)
  modulation: 'M',
  notebook: 'J',
  rack: 'B',                     // hide / show the rack
  dock: 'T',                     // dock / undock the transport
  hide: 'H',                     // the whole interface out of paint, and back
  fullscreen: 'F',
  help: '?',
});
/** UNDO and REDO: one action id each, 'undo' and 'redo', whoever holds the stack — the app's one history
 *  (history/history-list.js historyActions) or, with no history, the timeline's own rows (timeline/shortcuts.js).
 *  Written once here so the two can never disagree (wave 19: two owners on Mod+Z made rebinding undo do nothing). */
export const EDIT_KEYS = Object.freeze({ undo: Object.freeze(['Mod+Z']), redo: Object.freeze(['Mod+Shift+Z', 'Mod+Y']) });
/** toggleFullscreen(doc) — the document full screen, or out of it (BASINS shell.js fullscreen; a refusal is silent) */
export function toggleFullscreen(doc = globalThis.document) {
  try {
    if (doc.fullscreenElement) { const p = doc.exitFullscreen(); if (p && p.catch) p.catch(() => {}); }
    else { const p = doc.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
  } catch (_) { /* no full screen here (an iPhone): nothing to do */ }
}

/* ── the table ──────────────────────────────────────────────────────────────────────────────────────────── */
export function createKeys({ actions = [], storage = null, platform = detectPlatform(), target } = {}) {
  const view = target || (typeof window !== 'undefined' ? window : null);
  const life = new AbortController();
  const defs = [], byId = new Map(), defaults = {}, bound = {}, ids = [];
  /* a declared key that is not a key is the AUTHOR's mistake: say so at once (λWAVES' binding law: "Choose a key,
     with any modifiers" — Shift alone, or 'Space bar', is refused, never kept as a row with no key) */
  function define(a) {
    if (!a || !a.id || byId.has(a.id)) return null;
    const d = { ...a, group: a.group || 'GENERAL', label: a.label || a.id };
    defaults[a.id] = (a.keys || []).map((c) => {
      const n = normalize(c, platform);
      if (!n) throw new TypeError(`keys: the action "${a.id}" names "${c}", which is not a key. A chord is one key with any modifiers (a modifier alone is not one): e.g. 'Space', 'Enter', 'KeyX' or 'X', 'Shift+ArrowDown', 'Mod+S'.`);
      return n;
    }).filter((c, i, l) => l.indexOf(c) === i);
    defs.push(d); byId.set(a.id, d); ids.push(a.id); bound[a.id] = defaults[a.id].slice();
    return d;
  }
  for (const a of actions) define(a);
  const restore = (raw) => { const r = repairSaved(raw, ids, platform); for (const id of ids) bound[id] = r.keys[id] ? r.keys[id].slice() : defaults[id].slice(); return r.dropped; };
  if (storage && storage.get) { try { restore(storage.get()); } catch (_) { /* a broken store keeps the defaults */ } }

  const subs = new Set();
  const changed = () => {
    if (storage && storage.set) { try { storage.set(diffSaved(defaults, bound)); } catch (_) { /* nothing */ } }
    for (const fn of subs) { try { fn(api); } catch (err) { console.warn('keys: a listener threw', err); } }
  };
  const entries = () => defs.map((d) => ({ ...d, keys: bound[d.id] }));

  /* THE ONE LISTENER */
  let rec = null;
  const onKey = (e) => {
    if (rec || e.defaultPrevented || e.isComposing || e.keyCode === 229) return;
    const chord = chordFromEvent(e, platform); if (!chord) return;
    const t = e.target, field = isField(t) || isField(t && t.ownerDocument && t.ownerDocument.activeElement);
    const owned = !field && ownsKey(t, chord);
    const a = pickAction(entries(), chord, { field, repeat: e.repeat, owned });
    if (!a) return;
    e.preventDefault();
    if (owned) taken.add(e.code);                  // over a control: its release must not activate it either (a button clicks on Space's keyup)
    if (a.up) held.set(e.code, a);
    try { a.run && a.run(e, a); } catch (err) { console.warn('keys: ' + a.id, err); }
  };
  /* A HELD KEY (an action with `up`, e.g. INFORMATIONAL's hold-still): its key's release runs up(), and so does
     leaving the page, so a key let go elsewhere never sticks */
  const held = new Map(), taken = new Set(), latched = new Set();     // latched: held actions a MENU row is holding (menuItem)
  const release = (code) => { const a = held.get(code); if (!a) return; held.delete(code); try { a.up(null, a); } catch (err) { console.warn('keys: ' + a.id, err); } };
  const unlatch = () => { for (const id of [...latched]) { latched.delete(id); const a = byId.get(id); try { if (a && a.up) a.up(null, a); } catch (err) { console.warn('keys: ' + id, err); } } };
  if (view) {
    view.addEventListener('keydown', onKey, { signal: life.signal });
    view.addEventListener('keyup', (e) => { if (taken.delete(e.code)) e.preventDefault(); if (held.has(e.code)) { e.preventDefault(); release(e.code); } }, { capture: true, signal: life.signal });
    view.addEventListener('blur', () => { for (const code of [...held.keys()]) release(code); unlatch(); }, { signal: life.signal });
  }

  function record() {
    if (rec) rec.done(null);
    return new Promise((resolve) => {
      const onRec = (e) => {
        if (e.isComposing) return;
        e.preventDefault(); e.stopImmediatePropagation();
        if (e.repeat) return;
        if (e.code === 'Escape') { done(null); return; }
        const c = chordFromEvent(e, platform); if (c) done(c);
      };
      const done = (c) => { if (!rec || rec.done !== done) return; rec = null; if (view) view.removeEventListener('keydown', onRec, true); resolve(c); };
      rec = { done };
      if (view) view.addEventListener('keydown', onRec, { capture: true, signal: life.signal });
    });
  }

  const label = (id) => (byId.get(id) || {}).label || id;
  const api = {
    get platform() { return platform; },
    list: () => defs.map((d) => ({ id: d.id, label: d.label, group: d.group, hint: d.hint || '', short: d.short || '', keys: bound[d.id].slice(), defaults: defaults[d.id].slice() })),
    get: (id) => byId.get(id) || null,
    chords: (id) => (bound[id] ? bound[id].slice() : []),
    holders: (chord) => { const c = normalize(chord, platform); return c ? ids.filter((id) => bound[id].includes(c)) : []; },
    conflicts() {
      const seen = new Map();
      for (const id of ids) for (const c of bound[id]) { if (!seen.has(c)) seen.set(c, []); seen.get(c).push(id); }
      return [...seen].filter(([, l]) => l.length > 1).map(([chord, l]) => ({ chord, ids: l }));
    },
    run(id, e) {
      const a = byId.get(id); if (!a) return false;
      let ok = true; if (a.when) { try { ok = !!a.when(); } catch (_) { ok = false; } }
      if (!ok) return false;
      try { a.run && a.run(e || null, a); } catch (err) { console.warn('keys: ' + id, err); }
      return true;
    },
    check(id, chord) { if (!byId.has(id)) return WHY.none.t; return bindError(normalize(chord, platform)); },
    bind(id, chord, { add = false } = {}) {
      const c = normalize(chord, platform);
      const reason = !byId.has(id) ? WHY.none.t : bindError(c);
      if (reason) return { ok: false, chord: c, stolen: [], reason };
      const r = steal(bound, id, c, { add });
      Object.assign(bound, r.map);
      changed();
      return { ok: true, chord: c, stolen: r.stolen.map((s) => ({ id: s, label: label(s) })) };
    },
    unbind(id, chord) {
      if (!bound[id]) return false;
      const c = chord == null ? null : normalize(chord, platform);
      bound[id] = c ? bound[id].filter((x) => x !== c) : [];
      changed(); return true;
    },
    reset(id) { if (!bound[id]) return false; bound[id] = defaults[id].slice(); changed(); return true; },
    resetAll() { for (const id of ids) bound[id] = defaults[id].slice(); changed(); return true; },
    record,
    answer(chord) { const c = normalize(chord, platform); if (rec && c) { rec.done(c); return true; } return false; },
    stopRecording() { if (rec) { rec.done(null); return true; } return false; },
    recording: () => !!rec,
    saved: () => diffSaved(defaults, bound),
    restore(raw) { const dropped = restore(raw); changed(); return dropped; },
    menuKey(id, p = platform) { const c = bound[id] && bound[id][0]; return c ? displayChord(c, p) : ''; },
    menuItem(id, text) {
      const a = byId.get(id); if (!a) return null;
      const k = api.menuKey(id);
      /* a HELD action (one with `up`) has no release in a menu: its row LATCHES — the first press runs it, the next lets it go */
      const fire = !a.up ? () => api.run(id) : () => {
        if (latched.delete(id)) { try { a.up(null, a); } catch (err) { console.warn('keys: ' + id, err); } return true; }
        const ok = api.run(id); if (ok) latched.add(id); return ok;
      };
      return [(text || a.label) + (k ? '\t' + k : ''), fire, () => { if (!a.when) return false; try { return !a.when(); } catch (_) { return true; } }];
    },
    hint: (id) => api.menuKey(id),
    hints(root) {
      if (!root || !root.querySelectorAll) return 0;
      let n = 0;
      for (const node of root.querySelectorAll('[data-key-action]')) {
        const id = node.getAttribute('data-key-action'), k = api.menuKey(id);
        if (k) { node.setAttribute('data-key-hint', k); node.setAttribute('aria-keyshortcuts', bound[id].map((c) => ariaChord(c, platform)).join(' ')); }
        else { node.removeAttribute('data-key-hint'); node.removeAttribute('aria-keyshortcuts'); }
        n++;
      }
      return n;
    },
    helpRows(p = platform) {
      const groups = new Map();
      for (const d of defs) {
        if (!groups.has(d.group)) groups.set(d.group, []);
        groups.get(d.group).push({ id: d.id, label: d.label, hint: d.hint || '', keys: bound[d.id].slice(), chords: bound[d.id].map((c) => displayChord(c, p)) });
      }
      return [...groups].map(([group, rows]) => ({ group, rows }));
    },
    describe: () => ({ platform, actions: defs.map((d) => ({ id: d.id, label: d.label, group: d.group, hint: d.hint || '', inFields: !!d.inFields,
      keys: bound[d.id].slice(), defaults: defaults[d.id].slice(), display: bound[d.id].map((c) => displayChord(c, platform)) })) }),
    onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
    /** add(action | [actions]) — rows after the table was made (a module that arrives later); a saved binding for one
     *  is read from the store.  An id already in the table is left as it is.  → the ids added */
    add(list) {
      const added = [];
      for (const a of Array.isArray(list) ? list : [list]) if (define(a)) added.push(a.id);
      if (added.length && storage && storage.get) { try { const r = repairSaved(storage.get(), added, platform); for (const id of added) if (r.keys[id]) bound[id] = r.keys[id].slice(); } catch (_) { /* the defaults stand */ } }
      if (added.length) for (const fn of subs) { try { fn(api); } catch (err) { console.warn('keys: a listener threw', err); } }
      return added;
    },
    destroy() { if (rec) rec.done(null); life.abort(); subs.clear(); },
  };
  return api;
}
