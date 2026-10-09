# C2 HANDOFF — THE LOOK IS THE KIT'S (in progress: the continuation)

**The continuation** (Opus 5.5, Claude Sos's account): worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-af76812156a61b6aa`,
branch `worktree-agent-af76812156a61b6aa`, reset to the first builder's tip `c312219` (branch `worktree-agent-a828649825812de0a`, worktree
`agent-a828649825812de0a`, read-only), which descends from `f0fcbc4`. Never pushed, merged or tagged. Scratch in `.tmp/` (untracked; the
first builder's `.tmp/` copied, `classes.mjs` and `cap.mjs` re-pointed at this tree's `.tmp/sh`).

## Commits
First builder: `177be6b` design · `b817b27` handoff · `2e22fdc` WIP step 2 (look.js, the kit's store + accent, the lift; rack.js setters
thin; tests re-worded) · `c312219` handoff (paused).
Continuation: `77edad0` handoff (step 1: the stylehash compare, 0 in the seven classes) · `fa69ff7` step 3 (`mir.gui` PREFERENCE in FAMILIES;
the probe fails a look key left in B3; STATE-SCOPES rewritten) · this handoff.

## Step 1 · the stylehash classifier compare — DONE, 0 in the seven classes
- The first builder's captures (`.tmp/sh/base`, `base2`, `s2`, closed set, no settle) gave **107 element·properties, all in the FIRST state
  (dark-tinted-off), 0 in the other seven**: box-shadow 70, OTHER 17 (`.seg-b.on` background, a ramp chip's colour), border 3, focus outline 3.
  Every one is a 0.12 s-transitioned property (`transition: background 0.12s, box-shadow 0.12s, scale 0.12s`) still holding its LIGHT
  starting value 700 ms after the boot's light → dark flip: the document timeline had not ticked (the page's main thread was busy after
  ready). The boot-timing transient C0's third run removed with a 2.5 s settle.
- Re-captured with C0's settle (`node .tmp/cap.mjs <name> <port> wait`) — `basew` (base `f0fcbc4` from `.tmp/base`, 8877), `s2w` (this tree,
  8873), `base2w` (base again): `node .tmp/classes.mjs basew s2w base2w` → **0 element-states in every class (the seven, OTHER, TOKENS), 0 gone,
  0 new, 0 noise**; the kit's `stylehash.mjs compare .tmp/sh basew s2w --noise base2w` → **neutral: no element and no pixel differs** (903
  elements × 8 states).
- `--acc`/`--acc2` cannot be read from the token block (the token scan does not descend into `@import`, C0's note: they read "undefined"
  on both trees) — step 5 reads them directly.

## Step 3 · the lift proved, STATE-SCOPES — DONE (`fa69ff7`)
- `lab/settings-store.js` FAMILIES `'mir.gui'` PREFERENCE; `tools/settings-probe.mjs` RED on any `BLOB_LOOK` key in B3 (named);
  `docs/STATE-SCOPES.md`: one `mir.gui` row for the look (the lift's laws), `modpresets` named PREFERENCE, `nativeLayout` said.
- **settings-probe** (gate server 8873, GD 5343): **six scenes GREEN, 0 RED, B1 = B3 byte-identical** (WAVE DANCER: `modwin.modes s3` named),
  no look key in any B3. Dump: `.tmp/settings-probe-s3.json`.

## Tests
- at 2e22fdc (the first builder): node 82/82 · official-defaults-palette 3/3 · menubar GREEN · keyboard-window PASS.
- at fa69ff7: node **82/82** (`node .tmp/suites.mjs`) · settings-probe **6/6**.

## Lines
`cat lab/*.js | wc -l`: 30,553 (f0fcbc4) → 30,439 (2e22fdc/c312219) → 30,440 (fa69ff7; settings-store +1), −113 so far (estimate ≈ −160).

## Blockers
None.

## Servers running (stop by pid when done)
gate server 8873 (`tools/gate/server.py`, this tree) · `python3 -m http.server 8877` serving `.tmp/base` (the `f0fcbc4` copy, for step 5).

## Exact next step
Step 4 (C2-DESIGN §3): rows `hints`, `help`, `badges` into `LOOK_ROWS` and the lift (blob `badges`, `controlHints` / legacy `hint`; HELP's
own key `lw-window-info`, removed after the lift); STATUS TAGS / CONTROL HINTS (rack.js INTERFACE) and HELP (native-ui.js; `ui.setWindowInfo`
keeps its name for the `notes` action) call `look.set`; the subscribe dispatches `controlhintschange` on a hints change and closes open info
popovers on help off; saveSettings drops badges/controlHints; first-run.js loses storedCard/storedFrost/bootMaterial and first-run.test's
reading-law judges move to `liftLook`; FAMILIES drops `lw-window-info`. `node tools/new-project.mjs --check`; tests new-project (8), menubar,
keyboard-window, frame-occlusion, offer. Then step 5 (stylehash closed + mod + nb, base vs tree, `cap.mjs <name> <port> wait|mod|nb`;
`--acc`/`--acc2` read directly on the 8 states) and step 6 (lines, `bash test.sh node`, REPORT wave 204, `C2-BUILD.md`, CLAUDE.md draft).
