# C2 HANDOFF — THE LOOK IS THE KIT'S (in progress: the continuation)

**The continuation** (Opus 5.5, Claude Sos's account): worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-af76812156a61b6aa`,
branch `worktree-agent-af76812156a61b6aa`, reset to the first builder's tip `c312219` (branch `worktree-agent-a828649825812de0a`, worktree
`agent-a828649825812de0a`, read-only), which descends from `f0fcbc4`. Never pushed, merged or tagged. Scratch in `.tmp/` (untracked; the
first builder's `.tmp/` copied, `classes.mjs` and `cap.mjs` re-pointed at this tree's `.tmp/sh`).

## Commits
First builder: `177be6b` design · `b817b27` handoff · `2e22fdc` WIP step 2 (look.js, the kit's store + accent, the lift; rack.js setters
thin; tests re-worded) · `c312219` handoff (paused).
Continuation: `77edad0` handoff (step 1: the stylehash compare, 0 in the seven classes) · `fa69ff7` step 3 (`mir.gui` PREFERENCE in FAMILIES;
the probe fails a look key left in B3; STATE-SCOPES rewritten) · `37001b4` handoff · `7b02b1a` step 4 (STATUS TAGS, CONTROL HINTS, HELP
are the kit's rows; first-run keeps only the defaults) · this handoff.

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

## Step 4 · the SETTINGS surface on the store — DONE (`7b02b1a`)
- `LOOK_ROWS` + `hints`, `help`, `badges` (the kit's rows; their kit defaults ARE λWAVES' first run); `BLOB_LOOK` + `badges`, `controlHints`,
  `hint`; `liftLook(blob, help)` also reads HELP's own `lw-window-info` (removed after the lift) and keeps two corner laws exactly (an unknown
  theme was DARK, an unknown frost OFF). One subscribe in look.js: a hints change → `controlhintschange`; HELP off → open ⓘ panels close.
- rack.js INTERFACE: STATUS TAGS / CONTROL HINTS / HELP are `look.set` switches (HELP moved from native-ui; `ui.setWindowInfo` keeps its name
  for the `notes` action); applySettings / saveSettings drop badges / controlHints. native-ui.js loses its HELP store; first-run.js loses
  storedCard / storedFrost / bootMaterial; FAMILIES drops `lw-window-info`; STATE-SCOPES' `mir.gui` row names the three switches.
- tests: first-run 12 judges (the reading laws through `liftLook` + the kit's `repair`; one new lift judge); official-defaults-palette's
  saved case (`left: []`, `helpKey: null`, `gui` with hints/help/badges); new-project.test's PREFERENCE set names the `mir.gui` keys.

## Tests
- at 7b02b1a: node **82/82**; `new-project --check` in step; browser one at a time: official-defaults-palette **3/3**, menubar **GREEN**,
  keyboard-window **PASS**, frame-occlusion **7/7** (the first run, 4 s after keyboard-window, was red; re-run ALONE twice: 7/7), new-project
  **8/8**, offer **16/16**, take-in-bugs **GREEN**, settings-probe **6/6** (three runs died in the browser — "Render did not settle: animation
  frames stopped" in N₂'s open, then `Failed to decode response from marionette` on the BENZENE reload, twice; the fourth, alone with
  GD_VERBOSE=1, GREEN, B1 = B3, no look key; blob 746 → 711 B: badges/controlHints gone).
- at 2e22fdc (the first builder): node 82/82 · official-defaults-palette 3/3 · menubar GREEN · keyboard-window PASS.
- at fa69ff7: node **82/82** (`node .tmp/suites.mjs`) · settings-probe **6/6**.

## Lines
`cat lab/*.js | wc -l`: 30,553 (f0fcbc4) → 30,439 (2e22fdc/c312219) → 30,440 (fa69ff7) → 30,430 (7b02b1a), −123 so far (estimate ≈ −160).

## Blockers
None.

## Servers running (stop by pid when done)
gate server 8873 (`tools/gate/server.py`, this tree) · `python3 -m http.server 8877` serving `.tmp/base` (the `f0fcbc4` copy, for step 5).

## Exact next step
Step 5: stylehash on base `f0fcbc4` (`.tmp/base`, http 8877) and this tree (http 8873 — stop the gate server first, or serve with
`python3 -m http.server 8873 --bind 127.0.0.1 --directory <tree>`): `node .tmp/cap.mjs <name> <port> wait|mod|nb` for basew/base2w (have: closed),
then mod and nb for base, base2 and tree, and the tree's closed again (`s5w`); `node .tmp/classes.mjs <base> <tree> <base2>` for each set → 0 in the
seven classes; `--acc`/`--acc2` read directly on the 8 states (a CDP script over the kit's `tools/cdp.mjs`, as stylehash does). Then step 6
(lines, `bash test.sh node`, REPORT wave 204 after wave 201, `C2-BUILD.md`, the CLAUDE.md draft, final handoff).
