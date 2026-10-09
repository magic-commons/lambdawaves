# C7b · THE FILM'S UI IS THE KIT'S RENDER CARD AND TIMELINE WINDOW — final hand-off (the C7b builder's second relaunch, Opus 5.5)

**State: DONE. Steps 1–4 are committed and every gate is green. Nothing is merged into yan-c, pushed, tagged or deployed.
CLAUDE.md is not edited: the draft THE FILM paragraph and the CHANGES-0.5.0 line are in `C7B-BUILD.md`, for the integrator.**

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a0ff0fd25c7aa306c` (reset to the paused `f34569a`; the predecessor's worktree `agent-ab12528fb3c1bb358` was left untouched) |
| branch | `worktree-agent-a0ff0fd25c7aa306c` |
| `f40733d` | step 1 · createFilm takes the card's road (the first builder) |
| `8b93ef8` | merge `yan-c` `011e6a5` (C6 + HANDOFF + two briefs); `lab/sw.js` regenerated |
| `7c7da54` · `44dda44` | hand-offs |
| `9d8671b` | step 2 · the TIMELINE window on the one clock |
| `c815e35` | step 3 · the RENDER card; ONE PERIOD is a span clip; the CAPTURE group leaves (the WIP `f34569a` amended with the fix below) |
| step 4 | the commit on top of `c815e35`: `C7B-BUILD.md` (the STEP3 cells, decision 9, the lines), REPORT.md wave 208, this file |
| servers | 8913 (this tree), stopped by pid; 8917 not needed. No browser left. |
| `lab/*.js` | 27,228 (`4555945`) · 27,309 · 27,596 (C6 +287) · 27,657 · **27,555** (step 3, the fix 0; step 4 0) → C7b's own **+40** |

## The fix (settings-probe 4/6 → 0/6)

The blob's `closed` is the closed cards in document order (`saveSettings`). The WIP put the RENDER card at the foot of the right rack.
A demo's layout does not list `render`, and the kit's arrange appends the cards a layout names, so after a demo open the card stood
second (`[transport, render, orbit, …]`); after a reload it stood last. The set was the same and the order was not, so 4 of 6 scenes
went red. WAVE DANCER's `modwin` row was the probe's named `s3` exception and is green now. The card is now put at the **top** of the
right rack (`rack.prepend(filmCard.card.root)`; the redundant `classList.add('closed')` went, because `register`'s `closed: true` adds
it). Every road leaves it there: a demo's or an older ☆ slot's layout, a reload, and a reopen, which inserts at index 0. R2 holds: the
card ships closed. One line was changed and none added. As a side effect, `LW.bootOrder` ends at `history` again.

## Gates on `c815e35` (one browser suite at a time, ports 8913 / 5383)

- THE LOCK, run ALONE: `--check --query gastab=0` gave **860 values · 0/0 · page errors 0**. Adding `--fixture …/digest-lock-s4a.json`
  gave **1004 · 0/0 · page errors 0**. One fixture run was red on `states.gas.*` because I left out `--query gastab=0`; that is the W125
  gas table the header names, not the tree. No fixture was re-baked.
- `tools/settings-probe.mjs` **0 of 6 RED**. WATER's B1 = B2 = B3 `closed` is `[transport, render, orbit, vortex, slice, calculus,
  meters, ladder, atoms, wigner, radiation, history]`.
- `tests/new-project.browser-test.mjs` **8 PASS** · `node tools/new-project.mjs --check` in step (16,117 B) · `tests/history.browser-test.mjs` **44**.
- `tests/timeline.browser-test.mjs` **14/14** (281 s). In T6, the card's ONE PERIOD equals the facade's in every digest, and the MP4 is
  683,782 B both times.
- `tools/perf/film-probe.mjs` + `film-compare` against `.tmp/film-base.json`: **exit 0**, everything identical (picture,
  25 frames, ONE PERIOD 953,793 B, RECORD 743,644 B, verify DETERMINISTIC).
- `render-exact` **40/40** · `gpu-recovery` **10/10** (first run green) · `bash test.sh node` **exit 0** (wiring 220 reached).
- These were not re-run after the one-line fix (green on `f34569a`): film-handover 4/4, offer 16/16, menubar 8/8, frame-occlusion 7,
  hit-probe-set 49 / 0, pwa 327 files 6.45 MiB.

## For the integrator

1. **Merge across C6b** (`yan-c` `8388309`). The rack.js sites are listed in `C7B-BUILD.md` § Merge notes. Expect trivial conflicts at
   four places: the LW literal's end (`get timeline()`, `get render()` beside C6b's `LW.session`), the import block, FAMILIES' end, and
   `lab/sw.js` (run `node tests/pwa.test.mjs --write` after the merge). The fix is the line right after `window.__LW = LW` and the
   film card's construction; C6b's boot tail and banner come after it.
2. **REPORT.md wave number.** This branch has wave **208** at the end of the C section, after wave 206. `yan-c` has C6b's wave **209**
   in the same spot, so the merge conflicts there. Keep both: 208 is free on yan-c, so it goes before 209 with no renumbering. If the
   merged tree already holds a 208, make this one 210.
3. Apply the CLAUDE.md THE FILM paragraph and the CHANGES-0.5.0 line from `C7B-BUILD.md`.
4. For the legacy/boot re-aim row: B54's `shipsLast` (`history` last in `LW.bootOrder`) is true again. Its `atoms field wigner
   radiation` expectation still names ELECTROSTATICS' `field`, which D9b removed.

## Open (unchanged from `C7B-BUILD.md`)

- Brief candidates B13–B17. Not fixed: a film carries the window mask that stood at its start (C7's own); B17, NEW's AUDIO source,
  refuses MODULATION ON films.
- A profile saved before this build has no `render` in its `closed`, so the card opens once on the first boot after the update (decision
  9). It now opens at the top of the right rack, where before the fix it was at the foot.
- ms/s with the TIMELINE open is not measured. The phone and the iPad are not checked, and neither is the STAGE TEXT under a docked
  timeline.
