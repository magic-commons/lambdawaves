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
 * commit.  A commit compares the live key with the baseline's; if they differ the BASELINE (the
 * pre-image) is what goes on the undo stack and the live state becomes the new baseline.  Commits are
 * held off while a pointer is down (hold / release) and for `quiet` ms after the last edit, so one
 * knob drag, one bow, one scrub is exactly one entry however many hundreds of mutations it made.
 * A commit clears the redo stack: the future a new edit contradicts is gone.  undo() and redo()
 * commit first (force), so an edit is undoable the instant it happens and never has to wait out the
 * quiet window.  The ring keeps `depth` entries and the oldest falls off the bottom.
 *
 * STATUS: DETERMINISTIC, no maths.  read() / write(S) / liveKey() belong to the instrument, so an
 * undo travels the same road a project LOAD does; this file never touches the DOM or the register.
 */

const STUCK_MS = 5000;      // a pointerdown whose pointerup never came stops holding the commit off after this

/**
 * createHistory({ read, write, liveKey, depth, quiet, onChange })
 *   read()      → a snapshot object (must carry .key, the value liveKey() had when it was read)
 *   write(S)    → put the instrument back into snapshot S (called with notes suppressed)
 *   liveKey()   → a cheap string that changes exactly when the remembered state changes
 *   onChange()  → called whenever the stacks move (repaint whatever shows canUndo / canRedo)
 */
export function createHistory(port) {
  const depth = port.depth || 60, quiet = port.quiet === undefined ? 400 : port.quiet;
  const onChange = port.onChange || (() => {});
  const past = [], future = [];
  let base = null, held = 0, heldAt = 0, timer = 0, applying = false;

  const dirty = () => !!base && port.liveKey() !== base.key;
  /** an edit may have happened: arm the quiet window (cheap — no snapshot is taken here) */
  function note() {
    if (applying) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = 0; commit(false); }, quiet);
  }
  /** close the pending entry and open a coalescing window (pointerdown) */
  function hold() { if (held === 0) commit(true); held++; heldAt = Date.now(); }
  /** pointerup / pointercancel: commit on the next task, so the control's own onChange lands first */
  function release() {
    held = Math.max(0, held - 1);
    if (held > 0) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = 0; commit(false); }, 0);
  }
  /** push the baseline (the pre-image) if the live state has moved off it */
  function commit(force) {
    if (timer) { clearTimeout(timer); timer = 0; }
    if (applying) return false;
    if (!force && held > 0 && Date.now() - heldAt < STUCK_MS) return false;   // still dragging
    if (!base) { base = port.read(); return false; }
    if (!dirty()) return false;
    past.push(base);
    while (past.length > depth) past.shift();
    future.length = 0;
    base = port.read();
    onChange();
    return true;
  }
  /** put the instrument into S with notes suppressed, then re-baseline on what actually landed */
  function apply(S) {
    applying = true;
    try { port.write(S); } finally { applying = false; if (timer) { clearTimeout(timer); timer = 0; } base = port.read(); }
  }
  function undo() {
    commit(true);
    if (!past.length) return false;
    const S = past.pop();
    future.push(base || port.read());
    while (future.length > depth) future.shift();
    apply(S); onChange();
    return true;
  }
  function redo() {
    commit(true);
    if (!future.length) return false;
    const S = future.pop();
    past.push(base || port.read());
    while (past.length > depth) past.shift();
    apply(S); onChange();
    return true;
  }
  function clear() {
    if (timer) { clearTimeout(timer); timer = 0; }
    past.length = 0; future.length = 0; held = 0;
    base = port.read(); onChange();
  }

  return {
    note, hold, release, undo, redo, clear,
    flush: () => commit(true),
    get canUndo() { return past.length > 0 || dirty(); },
    get canRedo() { return future.length > 0 && !dirty(); },
    get depth() { return past.length + (dirty() ? 1 : 0); },
    get redoDepth() { return dirty() ? 0 : future.length; },
    get holding() { return held > 0; },
    get limit() { return depth; },
  };
}
