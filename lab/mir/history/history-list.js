/* history/history-list.js — THE HISTORY LIST: a view of one history (history.js) in a host element, plus its keys.
 *
 * THE LAW IT KEEPS (BASINS app/history-window.js, lifted to the kit): the list is a VIEW.  It reads `history.entries()`,
 * draws newest first with the row you stand on marked (past · current · future), a click on a row is `history.goto(i)`,
 * and UNDO / REDO are the kit's `trig`s, dimmed when there is nothing to do.  It repaints at most once a frame and only
 * while its host is visible; it writes the DOM through the kit's `setText`, so an unchanged count costs nothing.
 * It owns no frame, no placement and no persistence — the window around it is the host's.  Pair with history.css.
 *
 *   historyList(history, host, { tools = true, count = true }) → { root, paint, state(), onChange(fn) → off, destroy }
 *       tools: false   the host draws UNDO / REDO itself (BASINS: ↶ ↷ in the window's head); count: false   the host
 *       places the count (BASINS: in the foot, beside CLEAR).  state() → { canUndo, canRedo, length, count } is what
 *       those buttons need; onChange(fn) calls fn(state()) after every change.  `limitLine: false` is the old name of
 *       count: false.
 *   historyState(history) → { canUndo, canRedo, length, count }   (pure: count is the line the list writes)
 *   installHistoryKeys(history, { keys, target = window, canAct = () => true, onEmpty }) → remove
 *       Ctrl/Cmd+Z undo · Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y redo, as the rows 'undo' and 'redo' of the app's key table `keys`
 *       (or of a small table of their own on `target`), so the KEYBOARD window rebinds them; a text field keeps its own undo.
 *       canAct() false (a render running) lets the key through untouched; onEmpty(redo) when there was nothing to do.
 *   historyActions(history, { canAct, onEmpty }) → those two rows, for an app that builds its table by hand
 *   editableTarget(el) → true for a field that owns its own undo
 */
import { el, trig, label, ariaLabel } from '../kit.js';
import { setText } from '../core/perf.js';
import { frame } from '../core/frame.js';
import { isField } from '../core/pointer.js';
import { createKeys, EDIT_KEYS } from '../shell/keys.js';

/* a select is NOT one: it keeps no undo of its own, so Ctrl+Z on it is the app's, and its change is a history row (gestures.js) */
export const editableTarget = (t) => isField(t) && String(t.tagName).toUpperCase() !== 'SELECT';

export function historyState(history) {
  return { canUndo: !!history.canUndo, canRedo: !!history.canRedo, length: history.length,
    count: history.length + ' of ' + history.limit + ' · ' + (history.bytes / 1048576).toFixed(1) + ' of ' + Math.round(history.maxBytes / 1048576) + ' MB' };
}

export function historyList(history, host, o = {}) {
  const root = el('div', 'hist', host);
  let undo = null, redo = null;
  if (o.tools !== false) {
    const tools = el('div', 'hist-tools', root);
    undo = trig({ label: 'UNDO', title: 'Undo', onFire: () => history.undo() });
    redo = trig({ label: 'REDO', title: 'Redo', onFire: () => history.redo() });
    undo.root.dataset.keyAction = 'undo'; redo.root.dataset.keyAction = 'redo';   // the key is the table's (keys.hints), never typed here
    tools.append(undo.root, redo.root);
  }
  const list = el('div', 'hist-list', root);
  list.setAttribute('role', 'listbox'); ariaLabel(list, 'history rows');
  const count = o.count === false || o.limitLine === false ? null : el('div', 'hist-count', root);
  list.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.hist-row'); if (b) history.goto(+b.dataset.i); });

  let dead = false;
  const job = Symbol('history list');   // the kit's one frame: one paint per frame, however many rows changed
  function paint() {
    if (dead || !root.isConnected || root.offsetParent === null) return;   // hidden or gone: nothing to draw, the next show repaints
    const rows = history.entries(), out = [];
    for (let j = rows.length - 1; j >= 0; j--) {
      const r = rows[j], b = el('button', 'hist-row hist-' + r.state);
      b.type = 'button'; b.dataset.i = String(r.i); b.setAttribute('role', 'option');
      b.title = r.label + (r.state === 'current' ? ' — where the project stands' : ' — return here');
      if (r.state === 'current') { b.setAttribute('aria-current', 'true'); b.setAttribute('aria-selected', 'true'); }
      el('span', 'hist-i', b).textContent = String(r.i + 1);
      el('span', 'hist-lbl', b).textContent = r.label;
      if (r.domain) label(el('span', 'hist-dom', b), r.domain);   // the case is the sheet's: var(--label-case, uppercase)
      out.push(b);
    }
    list.replaceChildren(...out);
    if (undo) { undo.root.disabled = !history.canUndo; redo.root.disabled = !history.canRedo; }
    if (count) setText(count, historyState(history).count);
    const here = list.querySelector('[aria-current]');   // the row you stand on stays in view
    if (here && list.clientHeight) { const b = list.getBoundingClientRect(), a = here.getBoundingClientRect(); if (a.top < b.top || a.bottom > b.bottom) list.scrollTop += a.top < b.top ? a.top - b.top : a.bottom - b.bottom; }
  }
  const off = history.subscribe(() => { if (!dead) frame.coalesce(job, paint); });
  paint();
  const watchers = new Set();
  const offWatch = history.subscribe(() => { if (dead) return; const st = historyState(history); for (const fn of watchers) { try { fn(st); } catch (err) { console.warn('history list: a listener threw', err); } } });
  return { root, paint, state: () => historyState(history), onChange(fn) { watchers.add(fn); return () => watchers.delete(fn); },
    destroy() { dead = true; off(); offWatch(); watchers.clear(); frame.cancel(job); root.remove(); } };
}

/** historyActions(history, { canAct, onEmpty, doc }) → the key table's two rows, 'undo' and 'redo' (shell/keys.js EDIT_KEYS).
 *  inFields so a focused <select> (it keeps no undo of its own) still undoes the app; `when` hands every text field its own
 *  undo back and stands down while canAct() says no (a render running).  repeat: a held chord walks the stack. */
export function historyActions(history, { canAct = () => true, onEmpty, doc = globalThis.document } = {}) {
  const live = () => !!canAct() && !editableTarget(doc && doc.activeElement);
  const row = (id, label, hint, redo) => ({ id, label, group: 'EDIT', hint, keys: EDIT_KEYS[id].slice(), inFields: true, repeat: true, when: live,
    run: () => { const ok = redo ? history.redo() : history.undo(); if (!ok && onEmpty) onEmpty(redo); } });
  return [row('undo', 'UNDO', 'Undo', false), row('redo', 'REDO', 'Redo', true)];
}

/* UNDO / REDO ARE ROWS OF THE ONE KEY TABLE (wave 19): the old capture-phase listener with stopImmediatePropagation beat
   every table row, so rebinding undo did nothing.  With the app's table (`keys`) the rows are added to it (an app's own
   'undo' row, already there, wins); without one, a small table of their own is made on `target`.
   → remove(); remove.keys is the table the rows are in (for its hints) */
export function installHistoryKeys(history, { keys = null, target = globalThis.window, canAct = () => true, onEmpty } = {}) {
  let dead = false;
  const actions = historyActions(history, { canAct: () => !dead && canAct(), onEmpty, doc: (target && target.document) || globalThis.document });
  const table = keys || createKeys({ actions, target });
  if (keys) keys.add(actions);
  const remove = () => { dead = true; if (!keys) table.destroy(); };
  remove.keys = table;
  return remove;
}
