/* history/window.js — THE HISTORY WINDOW: the one stack (history.js) as a kit window.
 *
 * LIFTED FROM BASINS (app/history-window.js "THE WINDOW", history.css, 2026-10-01), on the kit's one window species
 * (window/window.js) instead of a hand-built section.  In the notebook's frame: HISTORY in the head with ↶ ↷ × beside it,
 * the rows newest first (the one you stand on lit, the future dimmed, a click returns to that row), and in the foot the
 * count and CLEAR.  The list is history-list.js; the stack, the keys and the gesture naming are the modules beside it.
 *
 * THE LAWS IT KEEPS
 *   · ONE WINDOW SPECIES.  It is a `createWindow`: the rail, the dock, the grip, the raise and the persistence are the
 *     window's; empty glass (the head, the foot's gap) drags it.  Its size and place are remembered under `storageKey`.
 *   · A VIEW, NOT A STORE.  It draws `history.entries()` and calls `goto`, `undo`, `redo`, `clear`.  It repaints once a
 *     frame and only while it is open; closed, it costs nothing.
 *   · THE KEYS AND THE GESTURES COME WITH IT, ON BY DEFAULT: Ctrl/⌘+Z · Ctrl/⌘+Shift+Z · Ctrl/⌘+Y everywhere except a
 *     text field, never while `canAct()` says a render is running (history-list.js installHistoryKeys): the rows 'undo' and
 *     'redo' of the app's key table when `keys` is one (createApp passes it), so they rebind and their chords show on ↶ ↷;
 *     and a pointer gesture is one row named CONTROL · WINDOW (gestures.js).  `keys: false` / `gestures: false` leave either to the app.
 *   · THE MODULATION DOMAIN IS REGISTERED WHEN `mod` IS GIVEN (domains.js); the app registers its own (colour, camera,
 *     the picture) and `adoptTimeline`.  `history.clear('SESSION')` is the app's, once its domains are in.
 *
 * createHistoryWindow({ history, host, id = 'history', title = 'HISTORY', mod, present, canAct, stage, windows,
 *                       keys = true | a createKeys table, gestures = true, storageKey = 'mir.history.window', persist, dock, chips,
 *                       size = { w: 320, h: 440 }, min = { w: 240, h: 200 }, say, onOpen, onClose })
 *   → { win, root, history, list, open(), close(), toggle(), isOpen, rows(), paint(), destroy() }
 *   history   a createHistory()          host   where the window and its rail go (the app's float layer)
 *   mod       installModulation's result: its rack becomes the 'modulation' domain (present() is called after a write)
 *   stage     where a press is the picture's, not an edit (an element, a selector or (node) => bool: gestures.js)
 *   persist   { read(), write(shape) } for the window's shape (default: localStorage[storageKey])
 *   say(text) where "Nothing to undo" is said (default: the kit's notice)
 *   rows()    [{ i, label, state }] as drawn, newest first: what a test or an agent reads */
import { el, label, ariaLabel, hint } from '../kit.js';
import { createWindow } from '../window/window.js';
import { setText } from '../core/perf.js';
import { notice } from '../shell/notice.js';
import { historyList, installHistoryKeys } from './history-list.js';
import { installHistoryGestures } from './gestures.js';
import { registerModulation } from './domains.js';
import { jsonStore } from '../core/prefs.js';

const SIZE = Object.freeze({ w: 320, h: 440 }), MIN = Object.freeze({ w: 240, h: 200 });

export function createHistoryWindow(o = {}) {
  const { history, host } = o;
  if (!history || !host) throw new TypeError('createHistoryWindow needs a history and a host');
  const id = o.id || 'history', title = o.title || 'HISTORY';
  const size = o.size || SIZE, min = o.min || MIN, doc = host.ownerDocument, view = doc.defaultView;
  const offs = [];
  if (o.mod) offs.push(registerModulation(history, o.mod, { present: o.present }));
  /* the keys are rows of the app's one table when `keys` is one (createApp passes app.keys), else of a small table of their own */
  const keyOff = o.keys === false ? null : installHistoryKeys(history, { keys: o.keys && typeof o.keys.add === 'function' ? o.keys : null,
    canAct: o.canAct, onEmpty: (redo) => (o.say || ((s) => notice(s, { ms: 1200 })))(redo ? 'Nothing to redo' : 'Nothing to undo') });
  if (keyOff) offs.push(keyOff);
  if (o.gestures !== false) offs.push(installHistoryGestures(history, { stage: o.stage, windows: o.windows }));

  /* the shape is remembered like every kit window's; the first place is BASINS': left of the right rack, 12 % down */
  const key = o.storageKey || 'mir.history.window';
  const kept = jsonStore(key, view);
  const persist = o.persist || {
    read: () => kept.get() ?? { x: Math.max(8, view.innerWidth - size.w - 380), y: Math.round(view.innerHeight * 0.12) },
    write: kept.set,
  };

  let list = null, undo = null, redo = null, count = null;
  const body = (b) => {
    const root = el('div', 'hist-win', b);
    const head = el('header', 'nb-head', root);
    label(el('span', 'nb-title hist-title', el('div', 'nb-titles', head)), title);
    const tools = el('span', 'nb-tools', head);
    const tool = (cls, glyph, aria, tip, fire, action) => { const x = el('button', cls, tools, glyph); x.type = 'button'; ariaLabel(x, aria); hint(x, tip); x.addEventListener('click', fire); if (action) x.dataset.keyAction = action; return x; };
    /* the key is the table's, in the user's platform (keys.hints writes data-key-hint; the tooltip shows it after the word) */
    undo = tool('hist-undo', '↶', 'undo', 'Undo', () => history.undo(), keyOff && 'undo');
    redo = tool('hist-redo', '↷', 'redo', 'Redo', () => history.redo(), keyOff && 'redo');
    tool('hist-close', '×', 'close the history', 'Close', () => win.close());
    list = historyList(history, root, { tools: false, count: false });
    const foot = el('div', 'nb-foot', root);
    count = el('span', 'hist-count', foot);
    const clear = label(el('button', 'hist-clear', foot), 'CLEAR'); clear.type = 'button';
    hint(clear, 'Forget the rows; the picture stays as it is');
    clear.addEventListener('click', () => history.clear('CLEARED'));
    return root;
  };
  const sync = (st) => { undo.disabled = !st.canUndo; redo.disabled = !st.canRedo; setText(count, st.count); };

  const win = createWindow({ id, title, host, size, min, resizable: true, emptyDrag: true, body, persist, dock: o.dock || null, chips: o.chips || [],
    onOpen(w) { list.paint(); sync(list.state()); if (o.onOpen) o.onOpen(w); }, onClose: o.onClose });
  win.body.classList.add('hist-body');
  if (keyOff && keyOff.keys !== o.keys) { const k = keyOff.keys; k.hints(win.root); offs.push(k.onChange(() => k.hints(win.root))); }   // a table of its own: its hints are its own (an app's table hints the whole document)
  const offState = list.onChange((st) => { if (win.isOpen()) sync(st); });

  return {
    win, root: win.root, history, list,
    open: () => win.open(), close: () => win.close(), toggle: () => win.toggle(), get isOpen() { return win.isOpen(); },
    rows: () => [...list.root.querySelectorAll('.hist-row')].map((b) => ({ i: +b.dataset.i, label: (b.querySelector('.hist-lbl') || {}).textContent || '', state: b.className.replace(/.*hist-/, '') })),
    paint: () => list.paint(),
    destroy() { offState(); for (const off of offs) { try { off(); } catch (_) {} } list.destroy(); win.destroy(); },
  };
}
