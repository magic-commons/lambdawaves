# C3 · hand-off (wave 205) — continued by a second builder; step 2 CLOSED, step 3 next

| | |
|---|---|
| task | 0.5.0 C3 — the rack, transport, menubar, keys and keyboard onto MIR 1.5.0-alpha.24 (`research/release-0.5.0/BRIEF-C3.md`) |
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a85bd972b2222e143` (the first builder's, `agent-ab53b6b1093934d5b`, is read-only) |
| branch | `worktree-agent-a85bd972b2222e143`, reset to `59717ae` (the first builder's tip), from `f0fcbc4` |
| servers | 8883 (this tree, `python3 tools/gate/server.py <worktree> 8883`, pid 4082571 — stop by pid); 8887 not started |

## Commits (from `f0fcbc4`)
1. `8e55952` the design hand-off — `C3-DESIGN.md` (the transport stays λWAVES-built, §4; brief P stays open; the record stays v3) + `tools/a4-window-probe.mjs`.
2. `124f691` WIP step 2, the rack is the kit's `createRack` (the first builder; see that commit's message).
3. `59717ae` WIP hand-off at the usage pause.
4. `d75d3f7` **the rack is the kit's createRack — the history red read and fixed; step 2's gates green.**

## The history red — cause and fix (`d75d3f7`)
Block 1b's "the card grew from 408 to 340.2 px" was read INSIDE the kit's rack motion: `createRackMotion` (lab/mir/shell/rack.js)
observes every card's head and body and animates a card's HEIGHT for 320 ms when its content grows.  The HISTORY list growing
1 → 13 rows animates the card 190 → 408 px (probe `.tmp/diag-hist.js`: one running animation `["190px","408px"]`, read at 33 ms
= 280.1 px; settled 408).  h12 was read before the ResizeObserver delivered (408), h25 a frame later mid-animation.  The block
now reads both heights at rest (`__rest`: two frames, then the card's own animations finished); the exact equality and the
250.5 px bound unchanged.  Nothing in the edit scope or the rack's state moves when a row commits (undo/redo byte-identical in
all 42 blocks, rebuild counts 1× modulation / 0× elsewhere, as before).

## Lines
`cat lab/*.js | wc -l`: 30,553 (`f0fcbc4`) → 30,119 (`124f691`, −434) → 30,119 (`d75d3f7`: sw.js one hash).

## Tests on `d75d3f7`
- `history` **42/42** (rc 0) · `hit-probe-set` **52 gap presses, 0 reached** (control 3/3) · `settings-probe` **0 of 6 red** ·
  `node tools/new-project.mjs --check` in step (16,329 B) · node gate **82/82** per suite (`.tmp/runnode.mjs`; the WIP's sw.js
  hash for rack.js was stale — `pwa` red until `node tests/pwa.test.mjs --write`).
- From the first builder on `124f691` (lab code unchanged since but sw.js): `frame-occlusion` 7/7 (one timing red at the paused
  rack-drag check, 3 re-runs alone green) · `menubar` 9 PASS lines · `input` 13 · `offer` 17 PASS lines · `new-project` 8.
- Parity probe base vs tip: `.tmp/probe-base.json` / `.tmp/probe-tip.json` / `.tmp/probe-diff.txt` (220 lines): float `z` (the kit's
  ONE raise stack), the home index counting VISIBLE windows, `dockIndex` on the settled rack, their fallout; the WIGNER status hint
  to re-run (timing).

## Exact next step
Step 3: `createMenubar({ opener: #title, host: #lab, menus: MENUS, label, phone })` replaces `lab/menubar.js` (λWAVES' focus
hand-back after a row's act stays as a wrapper on each row's `run` — the kit returns focus only on Escape: brief candidate);
rename MENUS' four `keyFor/runAction` calls to the kit ids, delete the `ACTIONS.find` fallback, tag the dock button
(`data-key-action="dock"`) and the modulation door (`modulation`); the C9 (`uiSpace({ rack })`) and C1 (`createCameraPanel` with
`rack`, no `spec.build`) open items.  Gates: `menubar`, `take-in-bugs`, `offer`, `frame-occlusion` 7, `input` 13, hit-probe-set.
Then step 4 (keys + keyboard window + tests), step 5 (lines, wave 205, C3-BUILD.md).
