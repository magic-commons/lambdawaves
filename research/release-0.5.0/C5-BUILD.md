# C5 · HISTORY AS THE ONE `edit` DOMAIN — build hand-off (2026-10-08, the C5 builder, Opus 5.5)

**In ten lines.** The kit's stack (`lab/mir/history/history.js`, `createHistory`) now holds the undo rows. λWAVES registers
ONE snapshot domain on it, `edit`: read = `serialize({ scope: 'edit' })` with its FNV-1a key, write = `restore(S, { history: true })`.
There is no hand-kept key list. **`lab/history.js` (187) is deleted.** Its port lives on as **`lab/edit-domain.js` (103)**,
`createEditHistory`, a thin layer over the kit's stack. That layer keeps only the old ring's laws the kit lacks, K1–K9, each a
brief candidate. **The HISTORY card did not leave**: the kit's `historyList` paints only while visible, and `history` block 8
reads the closed card after NEW. That gap is K10, kept on the app's path. **`history` 39/39** on the final tree, and the node
`history.test` passes **18/18** after a re-aim (one import line). `new-project` 8, `take-in-bugs` 4, `render-regressions` 2 and
`menubar` 8 are green. `mir-controls` is red from the adopt's kit (C0's). Node 85 has the adopt's 4 reds, all C0's.
`lab/*.js` **36,288 → 36,386**: the adopt's `sw.js` +181, and **C5's own −83**. Nothing is pushed or merged, and no lock was
run (C7 owns the one lock).

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a1a6731f62408d489` |
| branch | `worktree-agent-a1a6731f62408d489`, reset to `7044f37` (the `sos-s0` tip) |
| `e5944bc` | the bare adopt of MIR 1.5 alpha.24 (`adopt.mjs --line 1.5`; 196 added, 23 updated, 0 removed, 43 unchanged), identical to C0's |
| `15d599c` | first wiring: the kit's `createHistory` plus a facade inside rack.js. `history` 39/39 |
| `f52dbb0` | **`lab/history.js` deleted**; the facade moved into `lab/edit-domain.js`; rack.js back to its 0.4.0 shape (+4/−3); `history.test` re-aimed 18/18; CLAUDE.md's undo-ring path |
| `d22ffb9` | the card → the kit's `historyList`. `history` RED at block 8 (below) |
| `111aba2` | **revert of `d22ffb9`**: the card stays λWAVES'. `history` **39/39** |
| `13f5d81` `54c94e0` `1cd5c6b` `3c52598` `4be5817` | `C5-HANDOFF.md` after each step (one written at the usage pause) |
| the docs commit | this file + REPORT.md wave 198 |
| gate server | 8803 (pids 3337977, then 3479086), started by me and killed by pid. Ports 8803/5273 are free |

## The kit object as used, and the facade kept

`createHistory({ limit: 60, quiet: 400, timers })`. The `timers` seam is wrapped so the facade can see whether the kit's one
quiet timer is armed. The domain is `register('edit', { read, write, key })`. The calls used are `note`, `hold`, `release`,
`label`, `flush`, `undo`, `redo`, `goto` (only as a walk, see K3), `clear(label)`, `record` (K4), `absorb`, `entries` and
`subscribe`. The getters used are `canUndo canRedo cursor length limit applying holding pendingLabel`.

- **`__LW.history` is `historyApi`, unchanged member for member.** Its members are undo, redo, historyUndo, the three `can*`,
  depth, redoDepth, limit, clear, flush, note, entries, cursor, render, goto and label. No `__LW` member a test uses was renamed
  or removed.
- **The rack's `history`** is `createEditHistory({ read, write, liveKey, driven, depth: 60, quiet: 400, onChange })`, the port
  `lab/history.js` took. Every call site works unchanged: `hNote`, the drive's `'rotation drive'` note, MOLECULES' `derived →
  absorb`, the `untouched` probe, the open / NEW / link / boot `clear(label)`, the key dispatcher, and the pointer and input
  listeners with `hTouchName`, which stay the app's.
- **`history.clear(label)`'s road** is the kit's own `clear(label)`, which alpha.24 already has: a fresh stack on the live state
  with its bottom row named. No kit change and no brief are needed. The facade passes the label through (a bare clear says
  `'start'`, not the kit's `START`) and keeps it as the bottom row's name for K6. The origins are unchanged: `boot`, `link`,
  `open · NAME` and `new project`. Block 8, block 9 and block 9b hold.

## K1–K10: what the kit's stack does not do yet, kept on the app's path (the brief candidates)

| # | the law the old ring kept | the kit's stack today | kept how (`lab/edit-domain.js`) | proved by |
|---|---|---|---|---|
| K1 | a turning drive is ONE gesture (`driven`) | no such notion: every settle reads and records | while `driven()` the domain reads the state it stood on, and a note is nothing | `history` "the drive"; node DRIVEN |
| K2 | undo, redo, a jump and a press COMMIT the edit standing, announced or not | lands only an announced edit; an unannounced one is absorbed at the next gesture or overwritten by an undo | `flush()` before each | node NO WAITING, A LOST POINTER |
| K3 | a jump is ONE write | `goto` walks the rows between and writes every one | the walk runs with writes held, then the target lands once and `absorb()` re-baselines | node GOTO (1 write each way); `history` card clicks |
| K4 | HISTORY UNDO, a one-use return to the timeline before the last jump | no branch | the timeline is harvested at the jump by a held walk and rebuilt with `clear` + `record` | `history` "the depth"; node HISTORY UNDO |
| K5 | `absorb(fill)`: a solve's derived defaults re-key the row the stack stands on | `absorb()` only re-baselines, so a redo writes the unfilled row | a key → filled-record map that the write follows | `history` MOLECULES (7b, 9b); node DERIVED FILL |
| K6 | the bottom row is the oldest reachable state, named for the row that made it | keeps the clear's name after rows fall off | a push that drops rows passes the dropped row's name to the bottom | `history` "the depth" (`bottom: 'edit'`) |
| K7 | `'edit'` / `'start'`; row i = the i-th state | `EDIT` / `START`; the bottom is i = −1 | mapped in `entries()`, and `goto(i)` = the kit's `i − 1` | `history` 3c, 3d, travels, the depth, card |
| K8 | canUndo / canRedo / depth / redoDepth count an edit still in its quiet window | count rows only | the facade compares the baseline's key (the last key the kit took) with the live one | node QUIET WINDOW, NO WAITING; the `untouched` probe |
| K9 | a finished gesture's name waits one quiet window for its edit (on touch a tap's click lands after the release's task), and `label()` waits for its action | drops the name at the first settle that finds nothing | the facade lends the name back at the next note, flush or press | node GESTURE THAT CHANGED NOTHING (r2, l6). **Not browser-proven on touch** |
| K10 | the card's list is current while the card is closed | `historyList` returns from `paint()` while `root.offsetParent === null` | **the card's own renderer stays** (`renderHistory`, ~45 lines in rack.js) | `history` block 8 (below) |

**No block of the 39 runs on the old ring.** Every row lives in the kit's stack. K1–K9 are 103 lines over its public API, and
K10 is the card. When MIR takes K1–K10 (or rules against them), `lab/edit-domain.js` becomes `register('edit', …)`, the card
becomes `historyList` in a `device`, and both shrink to about 10 lines.

**Block 8, the exact gap (K10).** `d22ffb9` put the kit's list in the card, and `history` read 35 PASS then RED:
`AssertionError: the HISTORY card after NEW: ["link ·current"]` (`tests/history.browser-test.mjs:475`, expected
`['new project ·current']`). A probe (`.tmp/probe-card.mjs`) shows the card is `dev closed` with `display: none` at boot,
after WAVE DANCER opens, and after NEW. The kit's `paint()` refuses a hidden root ("closed, it costs nothing"), so the closed
card kept its last visible rows. The test was not loosened: `d22ffb9` was reverted. The candidate brief:
`historyList(..., { hidden: 'paint' })`, or a `paint({ force })` the host can call.

## Tests

On the final tree (`111aba2`; the docs commit changes no code). Ports 8803/5273. One browser at a time, 4 s apart, and no
timing red, so nothing needed a re-run alone.

| suite | result |
|---|---|
| `history.browser-test` | **39/39**. Flush 0.26 ms median (max 0.96). canUndo with an edit pending 0.18 ms. 5 s of play: 0 reads, 0 rows. Undo latency `{look 17.38, preset 7.86, element 4.5, palette 21.92, modulation 50.78, demo 18.42}` ms. Modulation window rebuilt 1× per modulation undo and 0× otherwise. 12,015 B per row, 10,462 B per demo row |
| ↳ earlier runs | `15d599c` 39/39 (the facade in rack.js; undo max 108.14 ms, modulation) · `d22ffb9` 35 PASS then RED at block 8 (K10) |
| `new-project.browser-test` | **8/8** |
| `take-in-bugs.browser-test` | **4/4** GREEN |
| `render-regressions.browser-test` | **2/2** |
| `menubar.browser-test` | **8/8** (CLEAR with HISTORY floated; EDIT › UNDO / REDO / UNDO HISTORY) |
| `mir-controls.browser-test` | **RED, the adopt's, not C5's**: `AssertionError: 0.25 != 0.5` at `tests/mir-controls.browser-test.mjs:45` (`near(measured.normal, .5)`, the first assertion: a knob drag on a fixture built from the adopted `lab/mir/kit.js`; no history code on that path). CANARY-A0 predicted it. C0's cascade |
| `node tests/history.test.mjs` | **18/18** (re-aimed at `lab/edit-domain.js`: the import line and two comment lines; every judge unchanged) |
| node, 85 suites (`.tmp/node-gate.mjs`, = `test.sh node`) | 81 green, 4 red = the bare adopt's set: `mir-manifest` ("MIR-MANIFEST.json names MIR 1.5.0-alpha.24, which is not an accepted adoption"), `new-project` ("lab/new-project.lambdawaves.json is OUT OF STEP"), `wiring` (113 unreached kit-file lines; no app file), `pwa` ("an absolute URL in lab/ … lab/mir/shell/gui.js: https://www.fabiandesmet.com/"). All C0's |
| `node tools/new-project.mjs --check` | RED, OUT OF STEP (bpm 60 → 30, C0 regenerates) |
| digest lock | not run (C7 owns the one lock of C; no `field.js`/shader change) |

## Lines

`cat lab/*.js | wc -l`: **36,288 → 36,386 (+98)**. Of that, `lab/sw.js` 415 → 596 = **+181 is the adopt's** precache list.
**C5's own is −83**: `lab/history.js` −187, `lab/edit-domain.js` +103, `lab/rack.js` +1 (+4/−3). The plan expected about −200.
The difference is the card (K10, about −45 not taken) and the 103 lines of K1–K9.

## Blockers

None for C5. `mir-controls` is red from the adopt (above) and is not C5's to fix.

## Open items

1. **The briefs K1–K10 for MIR** (Josh's scheduling). With them, `edit-domain.js` and the card's renderer go (about −140 more).
2. **K2's cost.** A press now reads the edit scope twice: the facade's flush, then the kit's `hold` re-baseline. The old ring
   read it once. That is about 0.3 ms per pointerdown at this tree's 12 kB record. No per-frame work was added, so A-M's ms/s
   should not move; C-V measures it.
3. **K9 on a real touch screen.** It is node-proven only. Check it on the iPad: a switch tap's row should carry the switch's
   name, not "edit".
4. The kit's HISTORY window (`history/window.js`), gestures and modulation domain stay unused. The card is a rack card, which
   is C3's territory. Their wiring reds go with R5-W1 at C0.
5. `docs/history/LANDSCAPE.md` still lists `lab/history.js` (a dated snapshot, left as written).

## Exact next step

The integrator merges this branch after C0's (the expected conflict is `lab/sw.js`: take either side, then `pwa --write`).
Then run `history` 39 and `node tests/history.test.mjs` on the merged tree.
