/* history.js — UNDO / REDO over the REGISTER side of the instrument.
 *
 * WHAT IS REMEMBERED (the port's read/write decide; this file only keeps the ring): the things that
 * change ψ or the law it moves under — the register's anchor c(0) with its mask and its static field,
 * the DRAG γ, the Hamiltonian selection (id, Z, well radius, gas basis, element), the SCALE
 * (Sturmian on / λ), the 91 RATEs and the two A / B stores.  NOT the camera, the palette, the draw
 * style, the layout, the theme or the transport's play state: those are the observer's (§14), and an
 * undo never moves them — a picture that only looks different does not go on this stack.
 *
 * THE LAW (the one that makes a whole drag one step).  A snapshot must be taken BEFORE a mutation,
 * which nothing can do after the fact — so what is kept is a BASELINE, the state as of the last
 * commit.  A commit compares the live key with the baseline's; if they differ the baseline — the
 * PRE-IMAGE, which is the row the instrument is already standing on — stays exactly where it is and
 * the live state is appended ABOVE it as the new baseline.  Commits are held off while a pointer is
 * down (hold / release) and for `quiet` ms after the last edit, so one knob drag, one bow, one scrub
 * is exactly one entry however many hundreds of mutations it made.  ⚠ A commit no longer CLEARS a redo
 * stack — it TRUNCATES the future; see THE CURSOR below.  undo() and redo() commit first (force), so
 * an edit is undoable the instant it happens and never has to wait out the quiet window.  The ring
 * keeps `depth` undos and the oldest falls off the bottom.
 *
 * ⚠ THE CURSOR, AND WHY THE TWO STACKS WENT (Josh: "Also fleshout and Polish the history system and
 * make it similar to FL studio's history system", on top of "I want the undo to work for almost every
 * knob").  It was `past[]` and `future[]`, popped at their inner ends, and a pair of stacks can only
 * be walked ONE STEP AT A TIME: there was nowhere to ask for the state five edits back from, and
 * nowhere to hang a name.  It is now ONE list of states — `ring[]` — plus an integer `cursor` saying
 * which of them the instrument is standing on:
 *
 *      i  =      0            1           2          3           4
 *      ring  [ start ][ raise Bz ][  fader  ][ preset  ][ exposure ]
 *      state    past        past       CURRENT     future      future
 *                                         ▲ cursor = 2     → depth 2 back, redoDepth 2 forward
 *
 * ring[0 … cursor−1] is the old past[], ring[cursor] is the old base, everything above it is the old
 * future[] — the SAME timeline the two stacks made, held the way a list UI has to read it.  undo() is
 * goto(cursor − 1), redo() is goto(cursor + 1), and goto(i) is the new thing: click any row and land
 * on it in ONE hop, in either direction, with one write() rather than i of them.
 *   ⚠ THE LAW THAT CHANGED WITH THEM.  A new edit made from a jumped-back row does not clear a future
 * stack, it TRUNCATES this one (`ring.length = cursor + 1`, then the push).  Observably identical —
 * the future a new edit contradicts is gone — but the mechanism now names WHICH future: everything
 * ABOVE the row you are standing on, and nothing below it.
 *
 * THE NAMES.  Every row carries a `label` and the `at` it was made, so the list reads as ACTIONS and
 * not as anonymous steps.  A caller names the pending action through note(name), hold(name) — which
 * names a whole drag, because the unnamed notes the drag goes on raising never erase it — or label()
 * on its own; the name is consumed by the entry it produces, and whatever nobody named is an honest
 * 'edit'.  There is deliberately NO taxonomy in this file: the vocabulary belongs to the caller
 * (rack.js is what knows which knob moved; this file cannot), and all the ring does is carry it.
 *
 * STATUS: DETERMINISTIC, no maths.  read() / write(S) / liveKey() belong to the instrument, so an
 * undo travels the same road a project LOAD does; this file never touches the DOM or the register.
 */

const STUCK_MS = 5000;      // a pointerdown whose pointerup never came stops holding the commit off after this
const BOTTOM = 'start';     // the row no action produced: where a clear() (a link, a preset, the boot) puts you
const UNNAMED = 'edit';     // what an action nobody named is called — honest, and not the start of a taxonomy

/**
 * createHistory({ read, write, liveKey, depth, quiet, onChange })
 *   read()      → a snapshot object (must carry .key, the value liveKey() had when it was read)
 *   write(S)    → put the instrument back into snapshot S (called with notes suppressed)
 *   liveKey()   → a cheap string that changes exactly when the remembered state changes
 *   onChange()  → called whenever the ring or the cursor moves (repaint the list, canUndo / canRedo)
 */
export function createHistory(port) {
  const depth = port.depth || 60, quiet = port.quiet === undefined ? 400 : port.quiet;
  const onChange = port.onChange || (() => {});
  const ring = [];                    // [{ snapshot, label, at }], oldest first: the WHOLE timeline
  let cursor = -1;                    // the row standing under the instrument; −1 until the first read
  let held = 0, heldAt = 0, timer = 0, applying = false, pending = null;

  const row = (S, name) => ({ snapshot: S, label: name || UNNAMED, at: Date.now() });
  const here = () => ring[cursor] || null;
  /* A continuous drive is one unfinished gesture. Checking before liveKey also avoids
     hashing the moving register on every read of canRedo. Edits made during the drive
     join that gesture; its stop exposes one dirty state for the next commit. */
  const dirty = () => { if (port.driven && port.driven()) return false; const e = here(); return !!e && port.liveKey() !== e.snapshot.key; };
  /** an edit may have happened: arm the quiet window (cheap — no snapshot is taken here).
   *  An optional NAME rides along, and an UNNAMED note never erases a name a caller already set —
   *  that is what lets hold('lane fader') survive the hundred anonymous notes the drag itself raises. */
  function note(name) {
    if (applying || (port.driven && port.driven())) return;
    if (name) pending = name;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = 0; commit(false); }, quiet);
  }
  /** close the pending entry and open a coalescing window (pointerdown).
   *  The name is set AFTER that commit, and the order is the meaning: the commit belongs to the action
   *  that is ENDING, the name to the gesture that is starting. */
  function hold(name) { if (held === 0) commit(true); if (name) pending = name; held++; heldAt = Date.now(); }
  /** pointerup / pointercancel: commit on the next task, so the control's own onChange lands first */
  function release() {
    held = Math.max(0, held - 1);
    if (held > 0) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = 0; commit(false); }, 0);
  }
  /** name the action that is pending (call with nothing to take the name back off it).  The name is
   *  consumed by the entry it produces; a commit that pushed NOTHING leaves it standing, because the
   *  action it names has not happened yet. */
  function label(name) { pending = name || null; }
  /** append the live state above the baseline if it has moved off it */
  function commit(force) {
    if (timer) { clearTimeout(timer); timer = 0; }
    if (applying) return false;
    if (!force && held > 0 && Date.now() - heldAt < STUCK_MS) return false;   // still dragging
    if (!ring.length) { ring.push(row(port.read(), BOTTOM)); cursor = 0; return false; }   // seed the bottom, don't step
    if (!dirty()) return false;
    ring.length = cursor + 1;                 // ⚠ the future this edit contradicts: TRUNCATED, not cleared
    ring.push(row(port.read(), pending));
    cursor = ring.length - 1;
    pending = null;                           // the name has been spent on the row it made
    // THE RING, measured in UNDOS AVAILABLE (`cursor`) rather than in rows, because a row is also the
    // one you are standing on: the oldest falls off the FRONT and the cursor falls with it, so it goes
    // on pointing at the same state.  A bottom row that arrived this way keeps the name of the action
    // that made it — it is the oldest state still reachable, and calling it 'start' would be a lie.
    while (cursor > depth) { ring.shift(); cursor--; }
    onChange();
    return true;
  }
  /** put the instrument into S with notes suppressed, then re-baseline the row on what ACTUALLY landed
   *  (a write is best-effort: the row must key against the state that exists, not the one that was asked
   *  for, or the very next dirty() reads true and an undo becomes an edit) */
  function apply(S) {
    applying = true;
    try { port.write(S); } finally {
      applying = false;
      if (timer) { clearTimeout(timer); timer = 0; }
      const e = here(); if (e) e.snapshot = port.read();
    }
  }
  /** travel to row i — the FL-Studio move: any row, one hop, either direction.  Out of range clamps to
   *  the ends.  A pending edit is committed FIRST, so a jump never eats one; note that this can move
   *  the very indices the caller read out of entries() (its own edit truncates the future above it and
   *  lands on top), and clamping then puts it on the newest row, which is the honest answer — the row
   *  it clicked was destroyed by its own pending edit. */
  function goto(i) {
    const n = Math.trunc(i);
    if (!Number.isFinite(n)) return false;
    commit(true);
    if (!ring.length) return false;
    const j = Math.max(0, Math.min(ring.length - 1, n));
    if (j === cursor) return false;
    cursor = j;
    apply(ring[j].snapshot);
    onChange();
    return true;
  }
  // commit(true) first and read `cursor` AFTER it: an edit still inside the quiet window becomes the
  // top row, and one step back from THERE is the state the hand started from.  (Passing cursor − 1
  // computed before the commit would step back two.)
  function undo() { commit(true); return goto(cursor - 1); }
  function redo() { commit(true); return goto(cursor + 1); }
  function clear() {
    if (timer) { clearTimeout(timer); timer = 0; }
    ring.length = 0; ring.push(row(port.read(), BOTTOM)); cursor = 0;
    held = 0; pending = null;
    onChange();
  }
  /** the list a UI paints: one frozen row per state, oldest first, each with the index goto() takes,
   *  its NAME, when it was made, and where it stands — 'past' (an undo lands in here), 'current' (you
   *  are here), 'future' (grey it; a redo lands in here).  The SNAPSHOTS are deliberately not in it:
   *  travel is through goto(), never by handing a caller a state to write back.  A pending edit is not
   *  a row until it commits, which is why `depth` can read one higher than the 'past' rows count —
   *  flush() first if the list must show it.  Indices are only good until the next commit (the ring
   *  re-indexes when the oldest falls off the front), and onChange() fires on every one of those. */
  function entries() {
    return ring.map((e, i) => Object.freeze({
      i, label: e.label, at: e.at,
      state: i < cursor ? 'past' : i === cursor ? 'current' : 'future',
    }));
  }

  return {
    note, hold, release, label, undo, redo, goto, clear, entries,
    flush: () => commit(true),
    get canUndo() { return cursor > 0 || dirty(); },
    get canRedo() { return cursor < ring.length - 1 && !dirty(); },
    get depth() { return Math.max(0, cursor) + (dirty() ? 1 : 0); },
    get redoDepth() { return dirty() ? 0 : Math.max(0, ring.length - 1 - cursor); },
    get cursor() { return cursor; },
    get pendingLabel() { return pending; },
    get holding() { return held > 0; },
    get limit() { return depth; },
  };
}
