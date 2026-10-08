/* lab/edit-domain.js — 0.5.0 C5 · THE ONE `edit` DOMAIN ON THE KIT'S STACK.
 *
 * The rows, the quiet window, the gesture hold, the caps and the travel are the kit's (mir/history/history.js). λWAVES hands
 * it ONE snapshot domain, `edit`: read() = serialize({ scope: 'edit' }) carrying its key, write(S) = restore(S, { history: true }).
 * Everything else here is a law of the 0.3.1 ring that the kit's stack does not keep yet — each a brief candidate
 * (research/release-0.5.0/C5-BUILD.md); when MIR takes them this file shrinks to register('edit', …) and goes.
 *   K1 a turning drive is one gesture: while driven() the domain reads the state it stood on, and a note is nothing
 *   K2 an undo, a redo, a jump and a press COMMIT the edit standing, announced or not (the kit lands an announced one only)
 *   K3 a jump is ONE write (the kit writes every row it walks): the walk runs with the writes held, the target lands once
 *   K4 HISTORY UNDO, the one-use return to the timeline before the last jump: harvested at the jump, rebuilt with record()
 *   K5 absorb(fill): a fill derived from the row the stack stands on, nothing pending, re-keys that row (the kit re-baselines)
 *   K6 the bottom row is the oldest state still reachable, named for the row that made it (the kit keeps the clear's name)
 *   K7 a row nobody named is 'edit', a bare clear 'start' (the kit: EDIT, START); row i is the i-th state (the kit: i − 1)
 *   K8 canUndo / canRedo / depth / redoDepth count an edit still in its quiet window (the kit counts rows)
 *   K9 a finished gesture's name waits one quiet window for its edit (on touch a tap's click lands after the release's
 *      task), and a label() waits for its action (the kit drops a name at the first settle that finds nothing)
 *
 * createEditHistory({ read, write, liveKey, driven, depth = 60, quiet = 400, onChange }) — the port lab/history.js took:
 *   read() → the edit record with .key · write(S) · liveKey() → the live record's key · driven() → a drive is turning
 *   → { note, hold, release, label, undo, redo, goto, historyUndo, clear, flush, absorb, entries, subscribe, stack,
 *       canUndo, canRedo, canHistoryUndo, depth, redoDepth, cursor, limit, pendingLabel, holding }   (stack = the kit's object) */
import { createHistory } from './mir/history/history.js';

const WALK = Object.freeze({ key: '\u0000walk' });
const say = (l) => (l === 'EDIT' ? 'edit' : l);

export function createEditHistory(port) {
  const quiet = port.quiet === undefined ? 400 : port.quiet, driven = port.driven || (() => false), onChange = port.onChange || (() => {});
  const armed = new Set();   // the kit's one quiet timer, seen through its `timers` seam (K5: "nothing pending")
  const timers = { setTimeout(fn, ms) { const id = setTimeout(() => { armed.delete(id); fn(); }, ms); armed.add(id); return id; },
    clearTimeout(id) { armed.delete(id); clearTimeout(id); } };
  const stack = createHistory({ limit: port.depth || 60, quiet, timers });
  let stood = null, base = '', walk = null, hush = false, branch = null, bottom = 'start', busy = false, seen = { c: 0, L: [] };
  let grace = null, named = null;   // K9: a finished gesture's { name, at }; a label()'s name
  const refill = new Map();         // K5: a row's key → the filled record it stands for now
  const land = (S) => { for (let n = 0; refill.has(S.key) && n < 8; n++) S = refill.get(S.key); hush = true; try { port.write(S); } finally { hush = false; } };
  stack.register('edit', {
    read: () => (walk ? WALK : driven() && stood ? stood : (stood = port.read())),
    write: (S) => { stood = null; if (walk) walk.push(S); else land(S); },
    key: (S) => (base = S.key) });   // the kit keys its baseline last, so `base` is the key of the state it stands on
  const dirty = () => !driven() && port.liveKey() !== base;
  const walkTo = (i) => { walk = []; try { stack.goto(i); return walk; } finally { walk = null; } };
  const travel = (fn) => { busy = true; grace = null; try { return fn(); } finally { busy = false; } };
  const pending = () => stack.pendingLabel || named || (grace && Date.now() - grace.at < quiet ? grace.name : null);
  const lend = () => { const n = pending(); if (n && !stack.pendingLabel) stack.label(n); };   // K9: hand the kit back the name it dropped
  stack.subscribe(() => {
    const E = stack.entries(), c = stack.cursor;
    if (!busy && c > 0) {   // outside a travel, a change that stands on a row is a push: it spends the names
      if (c === E.length - 1 && c <= seen.c) bottom = say(seen.L[seen.c - c]);   // K6: seen.c + 1 − c rows fell off the front
      grace = null; named = null;
    }
    seen = { c, L: E.slice(1).map((e) => e.label) };
    onChange();
  });
  const H = {
    note(name) { if (hush || driven()) return; if (!name) lend(); stack.note(name); },
    hold(name) { if (!stack.holding) { lend(); stack.flush(); } grace = null; stack.hold(name || named || undefined); },
    release() { const n = stack.pendingLabel; stack.release(); if (!stack.holding && n && n !== named) grace = { name: n, at: Date.now() }; },
    label(name) { named = name || null; grace = null; stack.label(name); },
    flush() { if (driven()) return false; lend(); return stack.flush(); },
    undo() { lend(); stack.flush(); return travel(() => stack.undo()); },
    redo() { lend(); stack.flush(); return travel(() => stack.redo()); },
    goto(i) {
      const n = Math.trunc(i); if (!Number.isFinite(n)) return false;
      lend(); stack.flush();
      const want = Math.max(0, Math.min(stack.length, n)), c = stack.cursor, L = stack.length;
      if (want === c) return false;
      return travel(() => {
        const labels = [bottom, ...stack.entries().slice(1).map((e) => e.label)], down = walkTo(-1);
        branch = { c, labels, states: [c ? down[down.length - 1] : port.read(), ...walkTo(L - 1)] };
        walkTo(want - 1); land(branch.states[want]); stack.absorb();
        return true;
      });
    },
    historyUndo() {
      lend(); stack.flush();
      const b = branch; if (!b) return false;
      branch = null;
      return travel(() => {
        bottom = b.labels[0]; stack.clear(bottom);
        for (let i = 1; i < b.states.length; i++) stack.record('edit', b.labels[i], b.states[i - 1], b.states[i]);
        walkTo(b.c - 1); land(b.states[b.c]); stack.absorb();
        return true;
      });
    },
    clear(name) { branch = null; grace = null; named = null; refill.clear(); bottom = name || 'start'; stack.clear(bottom); },
    absorb(fill) {
      const clean = !stack.holding && !armed.size && !stack.applying && !driven() && port.liveKey() === base;
      fill();
      if (!clean) return;
      const S = port.read();
      if (S.key !== base) { refill.set(base, S); stack.absorb(); }
    },
    entries() { return stack.entries().map((e, i) => Object.freeze({ i, label: i ? say(e.label) : bottom, at: e.at, state: e.state })); },
    subscribe: (fn) => stack.subscribe(fn), stack,
    get canUndo() { return stack.canUndo || dirty(); }, get canRedo() { return stack.canRedo && !dirty(); },
    get canHistoryUndo() { return !!branch; },
    get depth() { return stack.cursor + (dirty() ? 1 : 0); }, get redoDepth() { return dirty() ? 0 : stack.length - stack.cursor; },
    get cursor() { return stack.cursor; }, get limit() { return stack.limit; },
    get pendingLabel() { return pending(); }, get holding() { return stack.holding; },
  };
  return H;
}
