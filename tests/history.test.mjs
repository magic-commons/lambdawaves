/* tests/history.test.mjs — the node proof of the UNDO / REDO ring's law.
 *   node tests/history.test.mjs
 * lab/history.js touches neither the DOM nor the register: it works through a port
 * (read / write / liveKey), so the whole law — capture is of the PRE-IMAGE, a held pointer or a
 * quiet window coalesces a drag into one entry, a commit clears the redo stack, the ring keeps at
 * most `depth` — is judged here against a toy port with one integer of state.  What the browser
 * proof (B59) adds is that the instrument's own read / write really are that port.
 */
import { createHistory } from '../lab/history.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** a port over one integer: the smallest thing that can be edited, read, written and keyed */
function toy(quiet = 20, depth = 60) {
  const st = { v: 0, writes: 0 };
  const H = createHistory({ depth, quiet,
    read: () => ({ v: st.v, key: String(st.v) }),
    write: (S) => { st.writes++; st.v = S.v; },
    liveKey: () => String(st.v) });
  return { st, H, edit(v) { st.v = v; H.note(); } };
}

{ /* the pre-image, and that a redo is the exact inverse */
  const { st, H, edit } = toy();
  H.clear();
  edit(1); H.flush(); edit(2); H.flush(); edit(3); H.flush();
  const d = H.depth;
  H.undo(); const u1 = st.v; H.undo(); const u2 = st.v; H.undo(); const u3 = st.v;
  const bottom = { canUndo: H.canUndo, canRedo: H.canRedo, depth: H.depth };
  H.redo(); H.redo(); H.redo(); const top = st.v;
  judge('THE PRE-IMAGE: three edits are three steps and the undos hand back 2, 1, 0 — the state BEFORE each edit, never the state after; canUndo is false at the bottom with canRedo true, and three redos return to 3',
    d === 3 && u1 === 2 && u2 === 1 && u3 === 0 && bottom.canUndo === false && bottom.canRedo === true && bottom.depth === 0 && top === 3 && H.canRedo === false,
    { d, u1, u2, u3, bottom, top });
}
{ /* a commit contradicts the future */
  const { st, H, edit } = toy();
  H.clear(); edit(1); H.flush(); edit(2); H.flush();
  H.undo(); const mid = { v: st.v, canRedo: H.canRedo };
  edit(9); H.flush();
  judge('A NEW EDIT CLEARS THE REDO STACK: undo to 1 leaves a redo waiting, and editing to 9 throws that future away — the undo behind it still stands',
    mid.v === 1 && mid.canRedo === true && H.canRedo === false && H.depth === 2 && (H.undo(), st.v === 1),
    { mid, v: st.v, depth: H.depth });
}
{ /* the drag: many mutations between one pointerdown and one pointerup */
  const { st, H, edit } = toy();
  H.clear(); edit(1); H.flush();
  const d0 = H.depth;
  H.hold();
  for (let i = 2; i <= 40; i++) edit(i);
  const during = { depth: H.depth, holding: H.holding, v: st.v };
  H.release(); await sleep(10);
  const after = { depth: H.depth, v: st.v };
  H.undo();
  judge('ONE DRAG IS ONE STEP: thirty-nine mutations between a pointerdown and a pointerup add exactly ONE entry, and the single undo lands on the value the finger started from (1, not 39)',
    d0 === 1 && during.holding === true && after.depth === 2 && after.v === 40 && st.v === 1 && H.depth === 1,
    { d0, during, after, undone: st.v });
}
{ /* the quiet window does the same for edits no pointer drove (a key held down) */
  const { st, H, edit } = toy(30);
  H.clear();
  for (let i = 1; i <= 12; i++) { edit(i); await sleep(3); }
  await sleep(60);
  const d = H.depth; H.undo();
  judge('THE QUIET WINDOW: twelve edits 3 ms apart under a 30 ms window are one entry too — a key held down is one step, and the undo lands on 0',
    d === 1 && st.v === 0, { d, v: st.v });
}
{ /* the window does NOT swallow edits that are apart */
  const { st, H, edit } = toy(15);
  H.clear();
  edit(1); await sleep(40); edit(2); await sleep(40); edit(3); await sleep(40);
  judge('AND IT DOES NOT SWALLOW WHAT IS APART: three edits each past the quiet window are three entries',
    H.depth === 3, { depth: H.depth, v: st.v });
}
{ /* a no-op edit is not an edit */
  const { st, H, edit } = toy();
  H.clear(); edit(5); H.flush();
  const d1 = H.depth;
  edit(5); H.flush();
  judge('NOTHING CHANGED, NOTHING PUSHED: setting the same value again is not a step (the key, not the call, is what counts)',
    d1 === 1 && H.depth === 1, { d1, depth: H.depth });
}
{ /* the ring */
  const { st, H, edit } = toy(20, 60);
  H.clear();
  for (let i = 1; i <= 65; i++) { edit(i); H.flush(); }
  const d = H.depth;
  for (let i = 0; i < 60; i++) H.undo();
  judge('THE RING: 65 edits leave 60 entries and the oldest five fall off the bottom — sixty undos reach 5, not 0, and there is nothing further back',
    d === 60 && H.limit === 60 && st.v === 5 && H.canUndo === false, { d, v: st.v, canUndo: H.canUndo });
}
{ /* an undo must not itself become a step, and must re-baseline on what actually landed */
  const st2 = { v: 0 };
  const H = createHistory({ quiet: 10, read: () => ({ v: st2.v, key: String(st2.v) }), write: (S) => { st2.v = S.v; }, liveKey: () => String(st2.v) });
  H.clear(); st2.v = 1; H.note(); H.flush(); st2.v = 2; H.note(); H.flush();
  H.undo(); await sleep(30);
  judge('AN UNDO IS NOT AN EDIT: notes raised while the write lands are suppressed, and the quiet window that follows adds nothing — depth stays 1 with one redo waiting',
    st2.v === 1 && H.depth === 1 && H.canRedo === true, { v: st2.v, depth: H.depth, canRedo: H.canRedo });
}
{ /* undo must work the instant an edit happens, before the window has closed */
  const { st, H, edit } = toy(400);
  H.clear(); edit(7);
  const dirty = { depth: H.depth, canUndo: H.canUndo };
  H.undo();
  judge('NO WAITING: an edit is undoable the instant it happens — depth reads 1 while the 400 ms window is still open, and undo commits it first and then takes it back',
    dirty.depth === 1 && dirty.canUndo === true && st.v === 0 && H.canRedo === true, { dirty, v: st.v });
}
{ /* a pointerdown that never came up must not wedge the stack */
  const { st, H, edit } = toy();
  H.clear(); H.hold(); edit(3);
  const wedged = H.flush();
  judge('A LOST POINTER DOES NOT WEDGE IT: a hold with no release still yields to a forced flush (which is what UNDO does), so the entry is there',
    wedged === true && H.depth === 1 && (H.undo(), st.v === 0), { v: st.v });
}
console.log((FAILED ? 'RED ' : 'GREEN ') + 'history.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
