# C3 · hand-off (wave 205) — DONE: steps 2–5 closed by the second builder; ready for the integrator's merge

| | |
|---|---|
| task | 0.5.0 C3 — the rack, transport, menubar, keys and keyboard onto MIR 1.5.0-alpha.24 (`research/release-0.5.0/BRIEF-C3.md`) |
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a85bd972b2222e143` (the first builder's, `agent-ab53b6b1093934d5b`, is read-only) |
| branch | `worktree-agent-a85bd972b2222e143`, reset to `59717ae` (the first builder's tip), from `f0fcbc4` |
| servers | none running: 8883 (pid 4082571) and 8887 (pid 4131214) and the stylehash `http.server`s on 5353/5357 (pids 114367, 114389) were started by me and stopped by pid; no driver of mine is left (the geckodriver on 5203 is not mine) |
| write-up | `research/release-0.5.0/C3-BUILD.md` (everything below in full) · REPORT.md wave 205 |

## Commits (from `f0fcbc4`)
1. `8e55952` the design hand-off — `C3-DESIGN.md` + `tools/a4-window-probe.mjs` (the first builder).
2. `124f691` WIP step 2, the rack is the kit's `createRack` (the first builder).
3. `59717ae` WIP hand-off at the usage pause (the first builder).
4. `d75d3f7` **the rack is the kit's createRack — the history red read and fixed; step 2's gates green.**
5. `425537f` hand-off.
6. `59d6758` **the kit's rack hands the scene guard its columns (C9); the CAMERA card stays adopted in place (C1, resolved).**
7. `565b0aa` hand-off.
8. `b9fa26d` **step 3: the menubar is the kit's `createMenubar`; MENUS on the kit ids; the transport stays λWAVES-built.**
9. `841c7d7` hand-off.
10. `1addffd` **step 4: the keys on MIR's ONE KEY TABLE (`lab/key-table.js`); the KEYBOARD window the kit's; its skin λWAVES'.**
11. `18d5081` hand-off.
12. `724e1d3` **step 5: `C3-BUILD.md` and REPORT.md wave 205.**
13. this file (final).

## The history red — cause and fix (`d75d3f7`)
Block 1b's "the card grew from 408 to 340.2 px" was read inside the kit's rack motion: `createRackMotion` animates a card's height for
320 ms when its content grows; the HISTORY list 1 → 13 rows animates the card 190 → 408 px and `h25` was read one frame in. The block reads
both heights at rest; the equality and the 250.5 px bound are unchanged. Undo/redo byte-identical in all 42 blocks, rebuild counts unchanged.

## Tests on the tip (8883/5353; base 8887/5357; one browser at a time)
history 42 · frame-occlusion 7 · menubar 8 + GREEN · keyboard-window (rewritten) 8 + GREEN (one marionette reload error, re-run alone:
green) · keyboard-shortcuts (re-aimed) 6 · input 13 · offer 16/16 · new-project 8 + `--check` · take-in-bugs 4 + GREEN · latex-copy 10 ·
molecular-names 6 · export3d 10 · hit-probe-set 52 / 0 reached · settings-probe 0 of 6 red · node 82/82 (`access` A7/A11 re-aimed) ·
parity probe: 219 explained lines (z, visible-window home index, `dockIndex`, their rack-order fallout; WIGNER hint = timing) ·
stylehash 8 states: 0 element-properties changed (one invisible new node; 280 px inside SHADOW's own plot canvas). No digest lock (C7's).

## Lines
`cat lab/*.js | wc -l`: 30,553 (`f0fcbc4`) → 30,119 (`124f691`) → 30,033 (`b9fa26d`) → **29,057** (`1addffd`): **−1,496**; this session −1,062.

## Blockers
None.

## Exact next step
Claude Sos (integrator, `sos-s0` = `yan-c`) merges `worktree-agent-a85bd972b2222e143`; `lab/sw.js` is the standing conflict (take either
side, then `node tests/pwa.test.mjs --write`); C2 (SETTINGS/INTERFACE sites, `settings-store.js`) and C6 (the PROJECTS/notebook block) edited
other regions of `rack.js` from the same base. Then the node gate, `history`, `keyboard-window`, `menubar`, `frame-occlusion`, `input`,
`offer`, `new-project`, the hit-probe set, and the CLAUDE.md paragraph drafted in `C3-BUILD.md`. C2 may update `settings-store.js`
FAMILIES' owner labels for `lambdawaves.q0.keys` (→ `key-table.js`) and `lw.keyboard.position.v1` (→ `rack.js`).
