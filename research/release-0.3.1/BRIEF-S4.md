# BRIEF · STAGE S4 · THE HISTORY CARD (λWAVES 0.3.1)

Read first: `research/release-0.3.1/PLAN.md` §4.4 and §6 row S4; `research/release-0.3.1/BRIEF-S3.md` (what S3 changed:
the ring now covers the PROJECT scope, rows are named for the control and the window, the bottom row is named for its
origin); `docs/STATE-SCOPES.md`; `CLAUDE.md`. Build on `release-0.3.1` after S3 has merged (`git merge --no-edit
release-0.3.1` first).

## The situation
The HISTORY card (lab/rack.js, search `device({ id: 'history'`) paints the last TEN rows, newest at the top, each a
button `.hist-row.hist-<state>` with `.hist-i` (the index) and `.hist-lbl` (the name), the current row with
`aria-current`; UNDO / REDO / HISTORY UNDO / CLEAR triggers; a note saying "The ten latest points are shown". With the
true history a session has up to 60 rows, and a row now says what it was ("LFO RATE · MODULATION", "open · WAVE DANCER").

## What S4 delivers (one commit)
1. The list paints EVERY row `entries()` returns (≤ 61 with the bottom), newest at the top, the current row marked and
   kept in view (scroll it into view on each repaint if it is not visible); the list scrolls inside the card at a fixed
   maximum height (the card must not grow past the rack's other cards — pick a height that shows about ten rows, and
   put the one rule in lab/lab.css beside the existing `.hist-*` rules; no new skin, no colour, no glass change — the
   card's chrome is MIR's device chrome as today).
2. Row content: the name; the bottom row shows its origin name (S3's `clear(name)`); keep `.hist-i`. Optionally a
   relative time ("2 m") from `at` if it fits in one line without wrapping — measure the card width; if it wraps, leave it
   out and say so.
3. The note text tells the truth: how many rows are kept (`limit`), that a click jumps, what HISTORY UNDO does.
4. Nothing else: no new buttons, no filter, no rename.

## Tests
- Extend `tests/history.browser-test.mjs` (S3's): after 25 distinct edits the card shows 25 rows + the bottom, the current
  row has `aria-current`, clicking row k lands the instrument on that state (`serialize({scope:'edit'})` equal to the
  reading taken when that row was made), and the list's scrollHeight > clientHeight (it scrolls) while the card's own
  height did not change; the bottom row's text is `boot` on a fresh page and `new project` after NEW.
- Stylehash neutrality for every window but HISTORY (run the stylehash probe the way the wave-130 builder did:
  `research/optimization-2026-09-24/probes/W130/` has the runner; if it needs the lead's server on 8721, start your own).
- keyboard-window and current stay green. `node tests/pwa.test.mjs --write` then the suite.

## Laws
Subtract, don't add beyond the plan; never `lab/mir/**`; the glass is Josh's (layout rules only, no colours); adopt
`--check` "in step with MIR 1.4.3" at the end; the digest lock ×2 (the card is rack chrome, but run them). Gates as in
BRIEF-S3 (your own gate server on 8743 / GD 5243). Commit `0.3.1 · S4 the HISTORY card lists every row` with the gate
lines, ending with the Opus co-author + session lines used in S3. Do not push. Hand back: diff (file:line), the height
you chose and why, the relative-time decision, gate lines, hash.
