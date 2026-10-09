# C3 · hand-off (wave 205) — continued by a second builder; step 2 CLOSED, step 3 next

| | |
|---|---|
| task | 0.5.0 C3 — the rack, transport, menubar, keys and keyboard onto MIR 1.5.0-alpha.24 (`research/release-0.5.0/BRIEF-C3.md`) |
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a85bd972b2222e143` (the first builder's, `agent-ab53b6b1093934d5b`, is read-only) |
| branch | `worktree-agent-a85bd972b2222e143`, reset to `59717ae` (the first builder's tip), from `f0fcbc4` |
| servers | 8883 (this tree, pid 4082571) and 8887 (`.tmp/base` = f0fcbc4, started by me) — `python3 tools/gate/server.py <root> <port>`, stop by pid |

## Commits (from `f0fcbc4`)
1. `8e55952` the design hand-off — `C3-DESIGN.md` (the transport stays λWAVES-built, §4; brief P stays open; the record stays v3) + `tools/a4-window-probe.mjs`.
2. `124f691` WIP step 2, the rack is the kit's `createRack` (the first builder; see that commit's message).
3. `59717ae` WIP hand-off at the usage pause.
4. `d75d3f7` **the rack is the kit's createRack — the history red read and fixed; step 2's gates green.**
5. `425537f` hand-off.
6. `59d6758` **the kit's rack hands the scene guard its columns (C9's open item); the CAMERA card stays adopted in place (C1's,
   resolved: `createCameraPanel({ rack })` would register a second `camera` or split CAPTURE out of the card).**  input's synthetic
   presses moved from (120, 120) — `#rackL`'s column — to the open stage (560–660, 420).  input 13/13 · hit-probe 52/0.
7. `565b0aa` hand-off.
8. `b9fa26d` **step 3: the menubar is the kit's `createMenubar` (menubar.js left); MENUS on the kit ids, the `ACTIONS.find`
   fallback gone, dock/modulation tagged; the transport stays λWAVES-built.**  menubar 8 + GREEN · take-in-bugs 4 + GREEN · offer
   16/16 · frame-occlusion 7/7 · phone bar geometry = base (+ `--menubar-bottom`, `max-width`).  lab 30,119 → 30,033.

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
Step 4: the keys and the keyboard (C3-DESIGN §6): `createKeys` over A9's ACTIONS (Ctrl vs Mod), saved bindings lifted from
`lambdawaves.q0.keys` (0.4.0 shape + `was`), `createKeyboardWindow` with λWAVES' charcoal-blue skin as unlayered rules over the
kit's `km-*` DOM (R5-S3), occlusion following its drag; `keymap.js`, `keys.js`, `shortcuts.js` leave; `__LW.keys.*` /
`__LW.keymap.*` / `layout.keymap` / `layout.keysheet` keep their verbs; `tests/keyboard-window.browser-test.mjs` rewritten,
`tests/keyboard-shortcuts.test.mjs` re-aimed with the Ctrl-vs-Mod case.  Gates: keyboard-window, keyboard-shortcuts, menubar,
input 13, history 42, hit-probe-set.  Then step 5 (lines, parity probe, wave 205, C3-BUILD.md).
