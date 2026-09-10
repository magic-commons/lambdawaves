

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
  let returnBranch = null;            // one-use recovery from the most recent direct timeline jump
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
  /* A direct row jump is different from sequential undo/redo: it can strand a whole future. Keep a
   * shallow copy of the timeline before the jump. Entry snapshots are immutable after capture (apply
   * replaces an entry's snapshot instead of mutating it), so this costs 61 tiny wrappers, not a second
   * copy of every register. A later direct jump replaces the grace branch; recovery is deliberately
   * one-use so History cannot become a second project store. */
  function moveTo(i, rememberBranch) {
    const n = Math.trunc(i);
    if (!Number.isFinite(n)) return false;
    commit(true);
    if (!ring.length) return false;
    const j = Math.max(0, Math.min(ring.length - 1, n));
    if (j === cursor) return false;
    if (rememberBranch) returnBranch = { ring: ring.map((e) => ({ ...e })), cursor };
    cursor = j;
    apply(ring[j].snapshot);
    onChange();
    return true;
  }
  function goto(i) { return moveTo(i, true); }
  // commit(true) first and read `cursor` AFTER it: an edit still inside the quiet window becomes the
  // top row, and one step back from THERE is the state the hand started from.  (Passing cursor − 1
  // computed before the commit would step back two.)
  function undo() { commit(true); return moveTo(cursor - 1, false); }
  function redo() { commit(true); return moveTo(cursor + 1, false); }
  /** Return to the exact timeline and state that existed before the last direct row jump. This still
   *  works after an edit truncated that jump's future. Taking it consumes the branch. */
  function historyUndo() {
    commit(true);
    if (!returnBranch || !returnBranch.ring.length) return false;
    const back = returnBranch; returnBranch = null;
    ring.length = 0;
    ring.push(...back.ring.map((e) => ({ ...e })));
    cursor = Math.max(0, Math.min(ring.length - 1, back.cursor));
    apply(ring[cursor].snapshot);
    onChange();
    return true;
  }
  function clear() {
    if (timer) { clearTimeout(timer); timer = 0; }
    ring.length = 0; ring.push(row(port.read(), BOTTOM)); cursor = 0;
    held = 0; pending = null; returnBranch = null;
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
    note, hold, release, label, undo, redo, historyUndo, goto, clear, entries,
    flush: () => commit(true),
    get canUndo() { return cursor > 0 || dirty(); },
    get canRedo() { return cursor < ring.length - 1 && !dirty(); },
    get canHistoryUndo() { return !!returnBranch; },
    get depth() { return Math.max(0, cursor) + (dirty() ? 1 : 0); },
    get redoDepth() { return dirty() ? 0 : Math.max(0, ring.length - 1 - cursor); },
    get cursor() { return cursor; },
    get pendingLabel() { return pending; },
    get holding() { return held > 0; },
    get limit() { return depth; },
  };
}
