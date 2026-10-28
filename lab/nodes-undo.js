/* lab/nodes-undo.js — NODES' OWN UNDO (iteration 020 X1; NODES-FLESH-OUT.md).  A ring of 30 snapshots of the graph (the node list: type,
 * values, bypass, place, name, fold — and the graph's own flags), Ctrl-Z / Ctrl-Shift-Z on the focused ground.  The kit's HISTORY is the
 * project's; the graph is the reader's (PREFERENCE), so it keeps its own ring and never writes a history row.
 *   createUndo(take, put, n = 30) → { mark(), touch(), undo(), redo() }
 *     take()   the state now, as a string;  put(s)  the state put back
 *     mark()   before a discrete edit: the state as it was is one step (an edit that changed nothing leaves no step)
 *     touch()  a knob's move: the first opens a step, 400 ms of quiet closes it — one drag, one step */
export function createUndo(take, put, n = 30) {
  const back = [], fwd = [];
  let open = 0;
  const shut = () => { clearTimeout(open); open = 0; };
  const push = (s) => { if (back[back.length - 1] === s) return; back.push(s); if (back.length > n) back.shift(); fwd.length = 0; };
  /** one way: pop the steps that equal now (a mark with no edit after it), keep now on the other side, put the step back */
  const step = (from, to) => { shut(); const now = take(); while (from.length && from[from.length - 1] === now) from.pop(); if (!from.length) return false;
    to.push(now); put(from.pop()); return true; };
  return {
    mark() { shut(); push(take()); },
    touch() { if (!open) push(take()); clearTimeout(open); open = setTimeout(() => { open = 0; }, 400); },
    undo: () => step(back, fwd),
    redo: () => step(fwd, back),
  };
}
