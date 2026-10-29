# AUTOMATA ADOPTS MIR 1.5.6-alpha.17 — 2026-10-29 (Opus builder it027-S3; closed by Claude Yan after Sos's usage cliff at 08:21)

BASE: AUTOMATA `build-b` @ `60fe0b2` (v0.1.0-alpha.4, MIR 1.5.0-alpha.24, `~/Documents/AUTOMATA/.claude/worktrees/build-a7`). KIT: `kit-1.5.5` @ `c13df7d`
(MIR 1.5.6-alpha.17). Clones only (the builder's `.tmp/app` + `.tmp/kit` in worktree `agent-a428af96ecf9dbd59`, copied to the integrator's
`.tmp/it027/automata-adopt` + `kit-1.5.5`); nothing pushed; ~/Documents/AUTOMATA, MIR and DATABASE untouched. Precedent: NEBULA-ADOPT.md, BUBBLDYNE-ADOPT.md.

## The clone's commits (branch `mir-1.5.6-adopt`, on 60fe0b2)
- `0637a3e` A1 ADOPT: MIR 1.5.6-alpha.17 (kit c13df7dc4c7b) into lab/mir — 4 added, 69 updated, 0 removed; `adopt.mjs . --check` = "in step with MIR 1.5.6-alpha.17".
- `ee5c05b` A2 THE BREAKING LIST: the + is AUTOMATA's own (`#finderOpen`, `lab/index.html`) and opens THE FINDER (`createWindowPicker({ rack, open })` in
  `lab/main.js`; a closed window opens where it stands, an open one is scrolled to; a press on + while it shows closes it); `#rackAddList` and the RECOVER
  throw (main.js:1771 at the base) are gone; the GUI tab read follows; `lab/automata.css` + `lab/ink.css` seat the button; `tests/c1`, `tests/c4` and
  `tools/rw-a/boot.browser-test.mjs` re-aimed (7 files, +27/−16). The builder's exact-hit editor: `.tmp/scripts/callers.mjs` (each replace hit once).

## Tests
- `npm test` (node): 330/330 after A2.
- Browser suites (headless Firefox over `tools/serve.py`, one at a time, the builder's run on 9695/5695 while FIVE browsers shared the RTX): 32 suites,
  21 green, 11 red (a1 1/22 · a2 2/13 · b1 3/7 · b3 1/4 · b4 1/6 · c2 2/11 · c5 2/11 · l1 1/5 · pf1 1/1 · rwb 1/7 · rwd 1/2).
- THE BASELINE (Yan, 09:00, the same eleven at `60fe0b2` alone on 9697/5697): TEN are red at the base too — a1 1/22 · a2 1/10 · b1 1/15 · b3 1/4 ·
  c2 2/11 · c5 2/11 · l1 1/5 · pf1 1/1 (harness error) · rwb 1/7 · rwd 1/2 — pre-existing, not the adopt. `b4` is GREEN at the base.
- Re-run ALONE after the adopt (9699/5699): `a2` 1/10 (= the base) · `b4` 1/6 RED (the CHASE take's replay hash, "one warm sample, not a proof of
  replay on this device" — the GPU was still shared with the 028 fleet) · `b1` 3/7 RED where the base reads 1/15: the right-click route pop-over on
  FEED's dial, the 900 ms hold (born "null ms"), then a harness error that shortens the suite.
- OPEN (two): `b1` — the dial's right-click and hold gestures changed with 1.5.6's controls (the pop-over no longer opens from a trusted button-2
  pointerdown, or the hold timer moved): one look in a headed browser, then either a test re-aim (if the kit's gesture is the new law) or a FOR-MIR
  line; `b4` — re-run once alone on a quiet GPU before it is called the adopt's.
- `npm run test:gpu` not run (no shader, engine or default-picture byte moved by the adopt).

## Shots (`research/iteration-027/S3-shots/`, JPEG 1000 px; Yan 09:04, the builder's `shots.mjs` on 9699/5699, headless Firefox)
- Boots clean: kit `1.5.6-alpha.17` read from `mir/version.js`; 0 page errors, 0 GPU errors; five windows closed at boot (TAKE · MORPH · WEDGE · FIELDS · LAYER).
- `shell.jpg` the rack and the bar with the + · `finder.jpg` THE FINDER open by a real press on + (hit true): 17 rows — COLOR · ENGINE · FIELDS · GRAY–SCOTT ·
  HAND · LAYER · METERS · MIDI · MORPH · OBSERVE · OUTPUT · RENDER · SETTINGS · SPACE · TAKE · TUNER · WEDGE, 420 px wide; a second press on + closes it
  (shown false) · `rack.jpg` after the pick attempt.
- ONE LOOK: the probe's real press on TAKE's row did not land — `elementFromPoint` at the row's centre (697, 659) returned another element (hit false), so
  TAKE did not open and THE FINDER stayed shown. Either the row's centre is under the picker's own scroller/mask in this viewport or the row is not the hit
  target (a child is): the same probe on NEBULA/BUBBLDYNE's clones (S1/S2) would tell whether it is the kit's picker or AUTOMATA's seat.

## FOR-MIR
- Repeats S1/S2: `createRack({ chrome: true, finder: true })` / `createApp({ finder })` — AUTOMATA is the third app to hand-build the FINDER opener.
- (if b1 holds) the dial's right-click / hold → route pop-over gesture under 1.5.6: the law and its timer belong in the kit's controls docs.

## Open questions
- b1 and b4 above. a1/a2/rwd/c2/c5/l1/pf1/rwb/b3 are AUTOMATA's own pre-existing reds (the builder's `before/` logs hold a1, a2, rwd at the base).
- The 137 MB bundle carries the whole history (`--all`); a `mir-1.5.6-adopt ^build-b` bundle would be ~10 MB if Josh prefers.

## THE FETCH LINE (Josh)
Bundle: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/it027/automata-1.5.6-adopt.bundle` (137 MB, verified; ref mir-1.5.6-adopt @ ee5c05b)
`git -C ~/Documents/AUTOMATA fetch /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/it027/automata-1.5.6-adopt.bundle mir-1.5.6-adopt:mir-1.5.6-adopt`
Merging into `build-b` is Josh's call; b1 is looked at first.
