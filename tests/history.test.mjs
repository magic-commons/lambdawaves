/* tests/history.test.mjs — the node proof of the UNDO / REDO ring's law.
 *   node tests/history.test.mjs
 * lab/history.js touches neither the DOM nor the register: it works through a port
 * (read / write / liveKey), so the whole law — capture is of the PRE-IMAGE, a held pointer or a
 * quiet window coalesces a drag into one entry, ⚠ a new edit TRUNCATES the future at the cursor, any
 * row is reachable in one goto() hop, every row carries the name its caller gave it, and the ring keeps
 * at most `depth` undos — is judged here against a toy port with one integer of state.  What the
 * browser proof (B59) adds is that the instrument's own read / write really are that port.
 */
import { createHistory } from '../lab/history.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** a port over one integer: the smallest thing that can be edited, read, written and keyed.
 *  st.changes counts onChange, i.e. COMMITS: "twelve edits are one entry" is then a count and not an
 *  inference from H.depth, which reads 1 both while an edit is pending and after it has been committed. */
function toy(quiet = 20, depth = 60) {
  const st = { v: 0, writes: 0, changes: 0 };
  const H = createHistory({ depth, quiet,
    read: () => ({ v: st.v, key: String(st.v) }),
    write: (S) => { st.writes++; st.v = S.v; },
    liveKey: () => String(st.v),
    onChange: () => { st.changes++; } });
  return { st, H, edit(v) { st.v = v; H.note(); } };
}

/* ── THE INJECTED CLOCK (ANTI-PATTERNS §19: inject the speed rather than measuring it) ──────────────
 * lab/history.js reaches for the ambient setTimeout / clearTimeout / Date.now, so a test can hand it a
 * clock it drives itself — the same move mir.test.mjs makes with createModHost({ wall: 1000 }) and
 * render-exact.test.mjs with fakeLab({ msPerFrame: 90 }).  Everything inside withClock() is
 * SYNCHRONOUS, so no other task in the process can be caught by the swap, and the real globals go back
 * in a finally.  What this buys: the quiet window's timing stops being a race against the box.  The
 * block below used to run twelve edits sleep(3) apart under a 30 ms window — twelve waits that each had
 * to LAND inside 30 ms, when setTimeout(3) on a loaded box routinely delivers at 10–20 ms, so two bad
 * ones in a row closed the window and the depth came out 2.  It was the only node judge in the tree
 * that was load-flaky by construction.  Now there is no wall clock in it at all.  The block after it
 * (three edits 40 ms apart past a 15 ms window) is deliberately LEFT on the real setTimeout: a wait that
 * must be LONGER than something is safe under any load, and it keeps one live proof that the real timer
 * path works. */
function withClock(fn) {
  const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout, realNow = Date.now;
  let t = 0, id = 1; const timers = new Map();
  const clock = { get now() { return t; },
    advance(ms) {                                       // run every timer due within [t, t + ms], in order
      const end = t + ms;
      for (;;) {
        let key = null, best = Infinity;
        for (const [k, e] of timers) if (e.at <= end && e.at < best) { key = k; best = e.at; }
        if (key === null) break;
        const e = timers.get(key); timers.delete(key); t = Math.max(t, e.at); e.fn();
      }
      t = end;
    } };
  globalThis.setTimeout = (f, ms) => { const k = id++; timers.set(k, { fn: f, at: t + (ms || 0) }); return k; };
  globalThis.clearTimeout = (k) => { timers.delete(k); };
  Date.now = () => t;
  try { return fn(clock); } finally { globalThis.setTimeout = realSet; globalThis.clearTimeout = realClear; Date.now = realNow; }
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
{ /* ⚠ REWRITTEN FOR THE CURSOR MODEL.  This block judged "a commit CLEARS the redo stack", and that
   * sentence names a MECHANISM that no longer exists: there is no future[] left to clear.  The future
   * is now simply every row ABOVE the one you are standing on, and a new edit TRUNCATES the list there
   * (ring.length = cursor + 1, then the push).  The observable is unchanged and the judge is not
   * weakened — every assertion the old one made is made again below, in the same words: mid.v === 1,
   * mid.canRedo === true, canRedo false after the edit, H.depth === 2, and the undo behind it still
   * landing on 1.  What is ADDED is the thing the new mechanism can be wrong about and the old one
   * could not: it now stands TWO rows back with two rows of future above, so "truncated at the cursor"
   * and "cleared" stop being the same measurement, and the proof is read off entries() — the two
   * contradicted rows gone, the row below the jump-back point untouched, the new edit sitting directly
   * on top of the row it was made from. */
  const { st, H, edit } = toy();
  H.clear(); edit(1); H.flush(); edit(2); H.flush(); edit(3); H.flush();
  const full = H.entries().length;                                    // start · 1 · 2 · 3
  H.undo(); H.undo();                                                 // stand on row 1, two rows of future above
  const mid = { v: st.v, canRedo: H.canRedo, redoDepth: H.redoDepth, cursor: H.cursor,
                ahead: H.entries().filter((r) => r.state === 'future').length };
  edit(9); H.flush();
  const rows = H.entries();
  const after = { rows: rows.length, states: rows.map((r) => r.state).join(' '), cursor: H.cursor };
  judge('⚠ A NEW EDIT TRUNCATES THE FUTURE AT THE CURSOR (this judge used to read "a new edit CLEARS the redo stack", which named a mechanism that is gone with the two stacks): four rows, two undos back to 1, and TWO rows of future waiting above it. Editing to 9 from there cuts the list at the cursor and pushes, so both contradicted rows are gone from entries() — three rows, not one of them future, canRedo false — while everything BELOW the jump-back point is untouched and the undo behind it still lands on 1',
    full === 4 && mid.v === 1 && mid.canRedo === true && mid.redoDepth === 2 && mid.cursor === 1 && mid.ahead === 2
    && H.canRedo === false && H.depth === 2 && after.rows === 3 && after.cursor === 2
    && after.states === 'past past current' && (H.undo(), st.v === 1),
    { full, mid, after, v: st.v, depth: H.depth });
}
{ /* the drag: many mutations between one pointerdown and one pointerup */
  const r = withClock((clock) => {
    const { st, H, edit } = toy();
    H.clear(); edit(1); H.flush();
    const d0 = H.depth, c0 = st.changes;
    H.hold();
    for (let i = 2; i <= 40; i++) edit(i);
    const during = { depth: H.depth, holding: H.holding, v: st.v, commits: st.changes - c0 };
    H.release();
    const inTheCall = st.changes - c0;                  // release() must NOT commit inside the call ...
    clock.advance(0);                                   // ... it defers to the next task, which is this line
    const after = { depth: H.depth, v: st.v, commits: st.changes - c0 };
    H.undo();
    return { d0, during, inTheCall, after, undone: st.v, depth: H.depth };
  });
  judge('ONE DRAG IS ONE STEP: thirty-nine mutations between a pointerdown and a pointerup add exactly ONE entry — one commit, COUNTED through onChange rather than inferred from the depth — and the single undo lands on the value the finger started from (1, not 39). release() defers that commit to the next task so the control\'s own onChange lands first, and that deferral is now proved by running the task by hand on an injected clock instead of sleeping 10 ms and hoping the 0 ms timer got there first',
    r.d0 === 1 && r.during.holding === true && r.during.commits === 0 && r.inTheCall === 0 && r.after.depth === 2 && r.after.v === 40 && r.after.commits === 1 && r.undone === 1 && r.depth === 1, r);
}
{ /* the quiet window does the same for edits no pointer drove (a key held down) */
  const r = withClock((clock) => {
    const { st, H, edit } = toy(30);
    H.clear(); const c0 = st.changes;
    for (let i = 1; i <= 12; i++) { edit(i); clock.advance(3); }        // 3 ms of the TEST'S clock, not the box's
    const pending = { depth: H.depth, commits: st.changes - c0 };       // the window is still open: nothing committed
    clock.advance(60);                                                  // past 30 ms of quiet: it closes, once
    const closed = { depth: H.depth, commits: st.changes - c0 };
    H.undo();
    return { pending, closed, undone: st.v, depth: H.depth, canRedo: H.canRedo };
  });
  judge('THE QUIET WINDOW: twelve edits 3 ms apart under a 30 ms window are one entry too — a key held down is one step, and the undo lands on 0. The 3 ms and the 60 ms are ticks of a clock this test drives, so the judge is exact: no commit at all while the window is open, exactly ONE when it closes (counted, not inferred), and one undo empties the stack. With real timers each sleep(3) had to LAND inside 30 ms while setTimeout(3) on a loaded box routinely delivers at 10–20 ms, and two bad ones in a row made the depth 2 — the only node judge that was load-flaky by construction',
    r.pending.commits === 0 && r.pending.depth === 1 && r.closed.commits === 1 && r.closed.depth === 1 && r.undone === 0 && r.depth === 0 && r.canRedo === true, r);
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
  const r = withClock((clock) => {
    const st2 = { v: 0, changes: 0 };
    const H = createHistory({ quiet: 10, read: () => ({ v: st2.v, key: String(st2.v) }), write: (S) => { st2.v = S.v; }, liveKey: () => String(st2.v), onChange: () => { st2.changes++; } });
    H.clear(); st2.v = 1; H.note(); H.flush(); st2.v = 2; H.note(); H.flush();
    H.undo(); const c = st2.changes;
    clock.advance(30);                                  // three whole quiet windows: anything the undo armed fires here
    return { v: st2.v, depth: H.depth, canRedo: H.canRedo, commitsAfterUndo: st2.changes - c };
  });
  judge('AN UNDO IS NOT AN EDIT: notes raised while the write lands are suppressed, and the quiet window that follows adds nothing — depth stays 1 with one redo waiting, and NO commit fires in the three whole quiet windows that follow. Those 30 ms are ticks of the test\'s own clock, so "nothing fired" is a fact about the timer that was never armed rather than a 30 ms sleep that happened to elapse first',
    r.v === 1 && r.depth === 1 && r.canRedo === true && r.commitsAfterUndo === 0, r);
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
{ /* random access: click any row and land on it, one hop, either direction (the FL-Studio move) */
  const { st, H, edit } = toy();
  H.clear();
  for (let i = 1; i <= 5; i++) { edit(i); H.flush(); }
  const top = { cursor: H.cursor, v: st.v, writes: st.writes };
  const back = H.goto(1), atOne = st.v, backWrites = st.writes - top.writes;   // four rows back in ONE write
  const fwd = H.goto(4), atFour = st.v, fwdWrites = st.writes - top.writes - backWrites;
  const high = H.goto(99), atHigh = st.v;                                      // out of range clamps to the ends
  const low = H.goto(-99), atLow = st.v;
  const w0 = st.writes;
  const same = H.goto(0), stillLow = st.v, sameWrites = st.writes - w0;        // already there: no travel, no write
  const junk = H.goto(NaN);
  judge('GOTO IS RANDOM ACCESS, AND IT IS ONE HOP: from the top of five edits goto(1) lands on 1 and goto(4) on 4 — backwards and forwards, each with exactly ONE write() rather than one per row crossed, which is the whole reason the two stacks went. An index past either end clamps (99 → the newest, −99 → the oldest) instead of throwing or wedging the cursor; asking for the row already under you returns false and writes nothing; NaN is refused before anything moves',
    top.cursor === 5 && back === true && atOne === 1 && backWrites === 1
    && fwd === true && atFour === 4 && fwdWrites === 1
    && high === true && atHigh === 5 && low === true && atLow === 0
    && same === false && stillLow === 0 && sameWrites === 0 && junk === false && H.cursor === 0,
    { top, atOne, backWrites, atFour, fwdWrites, atHigh, atLow, same, sameWrites, junk, cursor: H.cursor });
}
{ /* the list a UI paints, and the greying: past / current / future about the cursor */
  const { st, H, edit } = toy();
  H.clear();
  H.label('raise Bz'); edit(1); H.flush();
  H.label('fader');    edit(2); H.flush();
  edit(3); H.flush();                                               // nobody named this one
  const atTop = H.entries();
  H.goto(1);
  const jumped = H.entries();
  const frozen = Object.isFrozen(atTop[0]);
  const noSnapshots = atTop.every((r) => r.snapshot === undefined);
  judge('ENTRIES() IS THE LIST AND THE CURSOR SPLITS IT: four rows oldest-first — start · raise Bz · fader · edit — carrying the names the caller gave and \'edit\' for the one nobody named. At the top they read past past past current; after goto(1) the SAME four read past current future future, which is exactly the greying a jumped-back FL history shows, and the indices stay 0,1,2,3 so a click on a row is a goto of its i. The rows are frozen copies of label / at / state and deliberately do NOT carry the snapshots: travel is through goto(), never by handing a caller a state to write back',
    atTop.length === 4 && atTop.map((r) => r.label).join('|') === 'start|raise Bz|fader|edit'
    && atTop.map((r) => r.state).join(' ') === 'past past past current'
    && jumped.map((r) => r.state).join(' ') === 'past current future future'
    && jumped.map((r) => r.i).join(',') === '0,1,2,3' && H.cursor === 1 && st.v === 1
    && frozen === true && noSnapshots === true && typeof atTop[3].at === 'number',
    { labels: atTop.map((r) => r.label), top: atTop.map((r) => r.state).join(' '), jumped: jumped.map((r) => r.state).join(' '), frozen, noSnapshots });
}
{ /* grace after random access: recover even after the old future was truncated */
  const { st, H, edit } = toy();
  H.clear();
  for (let i = 1; i <= 5; i++) { edit(i); H.flush(); }
  H.goto(2);                              // stand on 2; the original head at 5 becomes the return branch
  const jumped = { value: st.v, can: H.canHistoryUndo, future: H.redoDepth };
  edit(20); H.flush();                    // ordinary history now reads start, 1, 2, 20; 3…5 were truncated
  const branched = { value: st.v, rows: H.entries().map((r) => r.label), redo: H.canRedo, can: H.canHistoryUndo };
  const restored = H.historyUndo();
  const after = { value: st.v, rows: H.entries().length, cursor: H.cursor, can: H.canHistoryUndo,
                  again: H.historyUndo() };
  H.undo();
  judge('HISTORY UNDO IS ONE-USE GRACE FOR A TIMELINE JUMP: goto(2) keeps the five-step head, an edit at 20 may truncate rows 3…5 normally, and History Undo still restores the exact six-row timeline at value 5. The branch is consumed, so a second History Undo does nothing; ordinary Undo then continues from the restored timeline and lands on 4',
    jumped.value === 2 && jumped.can === true && jumped.future === 3
    && branched.value === 20 && branched.rows.length === 4 && branched.redo === false && branched.can === true
    && restored === true && after.value === 5 && after.rows === 6 && after.cursor === 5
    && after.can === false && after.again === false && st.v === 4,
    { jumped, branched, after, undo: st.v });
}
{ /* a name has to survive the very window that swallows the drag's mutations */
  const r = withClock((clock) => {
    const { st, H, edit } = toy();
    H.clear();
    H.hold('lane fader');
    for (let i = 1; i <= 20; i++) edit(i);            // twenty ANONYMOUS notes must not erase the name
    const pendingDuring = H.pendingLabel;
    H.release(); clock.advance(0);
    const drag = H.entries()[1];
    st.v = 50; H.note('coefficient'); H.flush();
    st.v = 77; H.note(); H.flush();                   // nobody names this one
    H.label('typed'); H.label(); st.v = 88; H.flush();  // ... and label() with nothing takes a name back off
    return { during: pendingDuring, after: H.pendingLabel, labels: H.entries().map((e) => e.label),
             at: drag.at, rows: H.entries().length, v: st.v };
  });
  judge('THE NAMES SURVIVE THE COALESCING, AND ARE SPENT ON ONE ROW: hold(\'lane fader\') names the whole gesture and the twenty anonymous notes the drag raises never erase it, so the ONE row it leaves is called by its name. The name is then SPENT — pendingLabel is null again — so the next unnamed edit is an honest \'edit\' and not the last name repeated, which is the failure mode a pending label has. note(\'coefficient\') names a keyed edit the same way, label() names one on its own and label() with nothing takes the name back off: five rows reading start · lane fader · coefficient · edit · edit. This file invents no vocabulary — rack.js is what knows which knob moved, and the ring only carries what it is told',
    r.during === 'lane fader' && r.after === null
    && r.labels.join(' · ') === 'start · lane fader · coefficient · edit · edit'
    && r.rows === 5 && typeof r.at === 'number' && r.v === 88, r);
}
/* A drive mutates between arbitrary clicks. Neither those clicks nor redo may mint
   frames as edits; ending the drive exposes precisely one state to commit. */
{
  let value = 0, driven = false, reads = 0;
  const H = createHistory({ read: () => ({ value, key: String(value) }),
    write: (S) => { value = S.value; },
    liveKey: () => { reads++; return String(value); }, driven: () => driven });
  H.clear(); value = 1; H.flush(); value = 2; H.flush(); H.undo();
  driven = true; const before = reads;
  for (let i = 0; i < 30; i++) { value++; H.note(); H.hold(); H.release(); H.flush(); }
  const quiet = reads === before, redo = H.canRedo, rows = H.entries().length;
  H.redo(); const restored = value === 2;
  value = 9; driven = false; H.note('rotation drive'); H.flush();
  const one = H.entries().length === rows + 1;
  H.undo();
  judge('DRIVEN: no keys hashed or click entries while turning; redo survives; stop commits one undoable gesture',
    quiet && redo && restored && one && value === 2, { quiet, redo, restored, one, value });
}

{ /* 0.3.1 · S3: the bottom row names its origin — clear(name) — and a clear with no name still says 'start' */
  const { st, H, edit } = toy();
  H.clear('boot'); const boot = H.entries();
  edit(1); H.flush(); H.clear(); const plain = H.entries();
  edit(2); H.label('fader'); H.flush(); const named = H.entries();
  H.clear('open · WAVE DANCER'); const opened = H.entries();
  const shape = Object.keys(opened[0]).join(',');
  const undone = H.undo();
  judge('THE BOTTOM ROW NAMES ITS ORIGIN: clear(\'boot\') is one row called boot, a clear with no name is one row called start (the default callers keep), a clear(\'open · WAVE DANCER\') after an edit is again ONE row, current, carrying that name and standing on the live state (2) with nothing to undo; entries() keeps its shape (i, label, at, state)',
    boot.length === 1 && boot[0].label === 'boot' && boot[0].state === 'current'
    && plain.length === 1 && plain[0].label === 'start'
    && named.map((r) => r.label).join(' · ') === 'start · fader'
    && opened.length === 1 && opened[0].label === 'open · WAVE DANCER' && opened[0].state === 'current' && st.v === 2
    && shape === 'i,label,at,state' && undone === false && H.depth === 0,
    { boot, plain: plain.map((r) => r.label), named: named.map((r) => r.label), opened, shape, undone });
}

console.log((FAILED ? 'RED ' : 'GREEN ') + 'history.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
