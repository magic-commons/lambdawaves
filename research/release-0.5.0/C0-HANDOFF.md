# C0 · THE BARE ADOPTION — HAND-OFF (live)

The brief is the integrator's relaunch prompt (Claude Yan, 2026-10-08); PLAN §2 C row C0 is the spec. This file is rewritten after every
step so a kill loses only uncommitted work.

## Where
- Worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ae28efe993cf25783` (the CONTINUATION builder, Opus 5.5).
- Branch: `worktree-agent-ae28efe993cf25783`, reset to `07b03d7` (the predecessor's tip on `worktree-agent-a34f1eb47fe65acfb`, from
  `7044f37` = the `sos-s0` pre-C baseline). `.tmp/` was copied whole from the old worktree (`base/` = `git archive 7044f37 lab tools`);
  its scripts were re-pointed at this worktree. The old worktree is never written.
- Ports: gate 8783 + geckodriver 5253 (this tree), 8787 + 5257 (`.tmp/base`). Nothing is pushed, merged, tagged or deployed.

## Commits (predecessor, kept)
`42b7631` THE BARE ADOPT (alpha.24, 1b7ae99b9905) · `49cf802` THE CASCADE (`@layer app, mir;`, five twins, 37 `!important` kept) ·
`ce5b2e1` hand-off · `7c049ed` THE PIN + new-project bpm 30 + R5-W1 · `858515e` THE GLASS DEFAULTS · `a46260f` C0-GLASS-RULINGS.md +
16 PNGs · `07b03d7` hand-off at the manual pause.

## Commits (this continuation)
| step | commit | what |
|---|---|---|
| 1 | (this commit) | THE KEYMAP RULES: MIR 1.4.3 `base.css`'s two `#keymap` rules (stacking at `--z-veil`, `[hidden]` → none) move into `lab/lab.css` as λWAVES' own; `--z-veil` is still declared on 1.5 (`mir/css/base.css:65`, 40). `pwa --write`. `keyboard-window` GREEN alone. The `.km-*` judgement below. `c0-glass/keyboard-{before,after}.png`. |

## Step 1 · the `.km-*` judgement (the kit's `keyboard/keyboard.css` on λWAVES' own pane)
Measured three ways: `kmdiff.mjs` (gate Firefox, every pane element, light first-run), `kmshot.mjs` (gate Firefox: pane PNG, clip test,
real-pointer hover on a badge) and a stylehash pair with the keymap open (`cap.mjs km-before 8787 km` / `km-after 8783 km`, 8 states,
1,521 elements each, through the kit's `serve.mjs` on the same two ports).
- **Nothing breaks the editor → nothing twinned.** The drag point hits `H2.km-title` again (it hit `canvas.shadow-c` before the fix);
  `keyboard-window` passes. The 315 key children with `pointer-events: none` only pass the pointer to their `.km-key` button, which owns
  every handler (`keymap.js:402–408`) and the `title`: a real pointer over a badge now reports the button as hit and the key hovered (base:
  the span, the key hovered too). `.km-search`'s `user-select: text` is an input's own default. `.km-list`'s `touch-action: pan-y` keeps
  the vertical scroll. `overflow: hidden` on the 57 labels and 57 chip rows clips nothing (scroll = client on all 114); the legend's 1 px
  over-height is the same on base.
- **Visible, not breaking — the input for C3 (which owns the KEYBOARD skin under R5-S3) and brief candidates:**
  - an accent LED dot (`.km-key-bound::after`) on the 42 bound keys, every state (pixel diff: the dots, the scrollbar, text AA only);
  - the list's scrollbar: Firefox's white track → the kit's groove thumb on transparent (`scrollbar-color`);
  - the unbound legend dot gains a 1 px hairline;
  - class 1 (press scale on keys and rows, `transition: all` → the kit's three), class 2 (the pane's upward shadow term), class 5 (the
    glass emboss off in 6 states) reach the pane exactly as they reach the rack; the .84 → .86 rider under light · tinted · frost off.
- **Brief candidate (MIR):** `keyboard.css` styles bare `.km-*` classes, so it lands on any app DOM that shares the names; scope it to the
  kit's own window (`.km-win`, `.km`, `.km-help`) the way the values block is already scoped.

## Tests so far (this continuation)
- `node tests/pwa.test.mjs --write`: PASS (263 precached).
- `keyboard-window` (8783/5253) alone: **PASS** (red before the fix).

## Blockers
None.

## Exact next step
Step 2: run `mir-controls` on the base copy (`LW_PORT=8787 GD_PORT=5257`), expect green; read the kit's `setKnobLaw()` under `lab/mir/`;
re-aim `tests/mir-controls.browser-test.mjs` to MIR 1.5's ONE KNOB LAW (vertical drag, ⅛ fine gear) in its own commit. The gate
servers must be restarted first (`python3 tools/gate/server.py <tree> 8783`, `… .tmp/base 8787`); the kit `serve.mjs` pair used for
stylehash is stopped by pid.
