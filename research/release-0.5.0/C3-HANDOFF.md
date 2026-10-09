# C3 · hand-off (wave 205) — THE RACK, THE TRANSPORT, THE MENUBAR, THE KEYS AND THE KEYBOARD

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ab53b6b1093934d5b` |
| branch | `worktree-agent-ab53b6b1093934d5b`, from `f0fcbc4` (`yan-c`: C0 C1 C4 C5 C9 D9) |
| servers | gate 8883 (this tree) · 8887 (base copy `.tmp/base` = `git archive f0fcbc4 lab tools tests`); geckodriver 5353 / 5357 per run |

## Commits
1. `0.5.0 C3 · the design hand-off` — `research/release-0.5.0/C3-DESIGN.md` (no `lab/` code).

## Tests so far
- node gate on `f0fcbc4`: `bash test.sh node` exit 0, no RED (baseline).
- parity probe (A4's, copied to `tools/a4-window-probe.mjs`) on the base: 16 steps → `.tmp/probe-base.json`.

## Blockers
- none.  Design decisions that the integrator should know now: the transport stays λWAVES-built (C3-DESIGN §4: four of
  its parts are not the kit's, createTransport would add parts and looks it never had, and C2 is rewriting native-ui.js);
  brief P cannot be consumed (the kit has no paint gesture at alpha.24).

## Exact next step
Step 2: the rack — `createRack` adopts `#rack #rackL #floats` and the + / ☆ / ◧ chrome; the `layout` block's verbs become
one alias block; the hands and the rack half of the peek leave; probe base vs tip.
