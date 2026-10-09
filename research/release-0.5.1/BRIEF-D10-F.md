# BRIEF D10-F · the two pre-existing law reds, fixed (0.5.1 "Informational Update"; Sonnet builder)

**Read first, whole:** `research/release-0.5.1/PLAN.md` (the D10-F row, §8, §9 R6-R), `research/release-0.5.1/AUDIT-OPUS.md` E20,
`research/release-0.5.0/LEGACY-BOOT-REAIM.md` §5 (the two rows: B70/B71 and B78-BOW — red on v0.4.0-alpha too, the laws untouched), §7 (the evidence),
§8 (the commands and the chunk runner `.tmp/chunk.mjs` recipe — copy it from the re-aim agent's worktree `agent-afd5abd59436c24a7/.tmp/`, read-only), the
three laws in `tests/legacy/boot.browser-test.mjs` (B70 ≈ the wave-63 touch-target sweep, B71 its landscape twin, B78 the wave-53 IMPULSE seats — read
each block whole), `lab/lab.css` (the transport's `.tbtn` and the modulation ring's short knobs under the touch media rules — grep `hover: none`,
`.tbtn`, `ringShort`), the STATE card's IMPULSE/BOW block in `lab/rack.js` (grep `BOW`, `IMPULSE`, `slap`, `impulse`), `git log --oneline -3 -- lab/rack.js`
around `a526bda` (`git show a526bda --stat` and its message: why the IMPULSE trigger left the card), and `CLAUDE.md` (the glass is Josh's; the keys
paragraph: the K row's id stays `slap`, its short word is `impulse` — FIX ROUND 1).

## The contract (R6-R taken: fix them)

1. **B70/B71 — 44 px touch targets on a phone.** On a touch phone (the `(hover: none)` + size breakpoint `lab/first-run.js`/`lab.css` already use; portrait
   500 × 844 and landscape 844 × 390) every interactive control must hit-test ≥ 44 × 44 px: the transport's six buttons (`tbtn play`, `modb on`,
   `transport-home`, `step-back`, `step-forward`, `jump`) are 45 × 34 today — make them 44 px tall under the touch rule in `lab.css` without changing
   their look on a desktop or the glass; the ring's short routed knobs (`observer.panx` 42 × 45, `transport.rate` 26 × 45) — widen their hit box (padding
   or min-width under touch), not their glyph. **Sizes only. No colour, no border, no new `!important`.** If the law still reports "covered by badge
   exact" for `dev-power`/`dev-fold` (the two the re-aim explains as the badge's exact overlay), read §5's note and re-aim THAT clause only if the re-aim
   says it is the harness's — otherwise leave it red and say so.
2. **B78-BOW — IMPULSE has its seats.** The wave-53 rename reached the K row (`slap` → short word `impulse`, FIX ROUND 1) but not the STATE card: its group
   still says `BOW` and its readout `BOW · escaped / momentum`; the law wants the `IMPULSE` trigger, the `IMPULSE · a sudden momentum kick` group and the
   `LAST IMPULSE` readout, and no SLAP or BOW left in any text node or label. Rename the group and the readout. For the TRIGGER: read `a526bda` — if the
   trigger left the card for a reason that still stands (a ruling, a design row), DO NOT put it back: re-aim the law's trigger clause with a one-line
   `/* 0.5.1 re-aim: … */` naming the commit, and keep the words clause strict; if it left by accident, restore it in its old seat. Saved ids (`slap`,
   bindings, `was`) never change.
3. **No `__LW` member renamed or removed**; the ACTIONS row's id stays `slap`; `tests/keyboard-shortcuts` and `keyboard-window` stay green.
4. **Lines:** ≈ +3 JS and a few CSS lines. Say the real number.

## Acceptance
- `tests/legacy/boot` B70, B71 and B78 GREEN, run as chunks alone first (the re-aim's runner), then the FULL suite once alone on a quiet GPU (≈ 7 min):
  expected after this row and the five-row pass: **B149 the only law red** (the kit's rack animates every reorder — a MIR brief candidate). Report every
  red by name and class.
- `access` (the accessibility suite); `hit-probe-set` 0 reached; `frame-occlusion` 7; `keyboard-shortcuts` PASS; `keyboard-window` GREEN; `first-run` 12
  (the phone/tablet first run); `offer` 16/16; `bash test.sh node` exit 0; `node tests/pwa.test.mjs --write` after the lab edit. No lock, no pair (CSS +
  labels; say so).

## Commits (each followed by `D10-F-HANDOFF.md`)
1. `0.5.1 D10-F · 44 px touch targets: the transport's six buttons and the ring's short knobs on a phone (B70/B71)`.
2. `0.5.1 D10-F · the STATE card's IMPULSE seats (B78-BOW)`.
3. `0.5.1 D10-F · the boot suite alone: <counts>; wave 2xx; D10-F-BUILD.md` (REPORT.md under the "0.5.1 · THE INFORMATIONAL UPDATE" heading — read the last
   wave number; `LEGACY-BOOT-REAIM.md` gets a §11 "0.5.1 D10-F" with the before/after counts).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours 9003/5473. `python3 tools/gate/server.py
<worktree> 9003` (run_in_background); `LW_PORT=9003 GD_PORT=5473`. ONE browser suite at a time on the rig: `node tools/perf/wait-gpu.mjs` and `pgrep -a
geckodriver` empty before each; the full boot suite only when NOTHING else runs; never kill another's process; stop yours by pid; never `pkill -f`. The
guard refuses compound shell lines (plain commands or `bash .tmp/x.sh`). Never edit `lab/mir/**`, `lab/fonts/**`. The glass is Josh's. Never merge, push,
tag. `D10-F-BUILD.md`: the ledger, the suite counts before/after with every red named, what `a526bda` said and what you did about the trigger, the merge
notes (lab.css + rack.js sites), "what Josh will see" (phone transport buttons a hair taller; the STATE card says IMPULSE). Hand back by message + try
`~/.claude/handoffs/agents/<id>.md`.
