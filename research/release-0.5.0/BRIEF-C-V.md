# BRIEF · C-V — THE ADOPTION VERIFIER (fresh Opus; the one verifier of stage C besides the film's)

Written 2026-10-08 by Claude Yan (the integrator, branch `yan-c`) from PLAN §2 row C-V and its risk table. One FRESH Opus verifier, own worktree, on
the `yan-c` tip AFTER C2, C3 and C6 are merged (the integrator names the sha at launch). You never merge, push, tag, deploy or edit `lab/`. Ports:
8903/5373 (the tip), 8907/5377 (the pre-C base copy: `git archive 7044f37 lab tools | tar -x -C .tmp/base`). Report: `research/release-0.5.0/C-V.md`.

## 1 · The contract (PLAN §2 row C-V, verbatim)

> the adoption verifier (fresh Opus), scoped: the seven stylehash classes with Josh's rulings applied; **the R1–R15 table**, each closer run;
> hit-probe; **A-M's ms/s** against the pre-C baseline (gate |Δ median| ≤ max(2 × spread, 2 ms/s)); the M5 by the device report pair ("M5 pending"
> if absent); `adopt.mjs --check`; the `__LW` law; no lock.

**Done when (PLAN):** every closer green (NEW ones written); the seven classes ruled; ms/s within the measured floor; **`lab/*.js` at C-V: estimate
28.2–29.6k, HARD BAR 30,000**; CLAUDE.md rewritten for the kit's windows.

## 2 · The R1–R15 table — run each closer, record the command and its count

| risk | closer(s) |
|---|---|
| R1 occlusion | `frame-occlusion` over `[data-mir-window]` (A7's providers; C8 is 0.5.1) |
| R2 scopes | `tools/settings-probe.mjs` six scenes zero RED (the whole-`localStorage` diff incl. `mir.gui` and `lambdawaves.q0.modulation`) + `new-project` 8 + `node tools/new-project.mjs --check` |
| R3 history | `history` (39 → 42 after D9) |
| R4 offline | `node tests/pwa.test.mjs`, `offer` 16, `node tests/wiring.test.mjs` under R5-W1 (`--unreached-kit` reports, never fails) |
| R5 cascade | the 1.5 `stylehash.mjs` on the 8 states (+ modwindow open, + notebook open) vs the base copy: the seven classes as `C0-GLASS-RULINGS.md` rules them (Josh's rulings if given; else the defaults: five the kit's, two λWAVES'); anything outside the seven is a finding |
| R6 two clocks | `take-in-bugs` (five boots, 0 refusals) + the replay judges in `history` and `routed-knob` |
| R7 first-run | `first-run` (desktop + the phone/tablet crossing), `official-defaults-palette` |
| R8 keys | `keyboard-shortcuts`, `keyboard-window` (as C3 rewrote it), the `Ctrl`-vs-`Mod` case |
| R9 ids | A10's hook selectors: `grep -rn "data-mir-\|data-lw-" tests/ | wc -l` and no id-keyed selector a kit window renames |
| R10 formats | C6's fixture suite (an invalid collection read-only; the size cap; a 1.4 notebook → page 0) |
| R11 NEW/empty | `new-project` 8 + `--check` |
| R12 byte-pins | `node tests/mir.test.mjs`, `node tests/mir-manifest.test.mjs` (the pin kept) |
| R13 modwindow drift | stylehash with the window open (the kit's own glyph swap is R13's expected delta — count it, name it) |
| R14 WebGPU | `gpu-recovery` 11 + FOLDERS' thumbnail probe (C9) |
| R15 moving kit | `node ~/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs <your tree> --check` → "in step with MIR 1.5.0-alpha.24" |

Plus: `tools/hit-probe-set.mjs` (0 reached), `bash test.sh node` (expect exit 0), `cat lab/*.js | wc -l` against the HARD BAR 30,000, the `__LW` law
(no member a test or tool uses renamed or removed: diff `grep -ohE "__LW\.[a-zA-Z_.]+" tests tools | sort -u` on the base and the tip), and
`tests/film-handover` 4/4 (C7's guard).

## 3 · A-M's ms/s against the pre-C baseline

`tools/perf/main-thread.mjs` (A-M; the warm-up rule, the notice dismissed) interleaved base / tip, 3 runs each, every run `field ok`, load under 4
(`node tools/perf/wait-gpu.mjs`). The baseline is MEASURE §2's notice-dismissed 37.335 ms/s, spread 1.768 → **gate 3.536**, read as the INTERLEAVED
pair's |Δ median| (the integrator's ruling at C0: same-session drift cancels in the pair; C0 alone read +2 ms/s of its own — find where the rest of
stage C lands). Report both the pair and the raw medians. Four sibling builders may run tonight: wait as long as it takes and say how long.

## 4 · What is NOT yours

No lock (C7's verifier ran it; the integrator re-ran it on every merge: 908 / 1052 values on the D9 tree, 0/0). No fix: a finding is a row with the
command, the output and the owner (C0…C9, or a MIR brief candidate). No edit under `lab/`. The M5 numbers are Josh's one command: write "M5 pending"
unless `research/device-reports/` holds the pair.

## 5 · Report

`research/release-0.5.0/C-V.md`: one row per R1–R15 + the extras (GREEN / RED / NOT VERIFIED, command, count), the stylehash seven-class table
(base vs tip, with the modwindow and notebook captures), the ms/s pair with its raw runs, the line count vs the bar, the `__LW` diff, and the verdict:
**FIT TO CUT 0.5.0-alpha** / FIT WITH NOTES / NOT FIT with BLOCKER / SHOULD / NOTE rows. Commit it (`0.5.0 C-V · the adoption verifier's report`).

## 6 · Harness

One browser at a time, 4 s apart; a timing red is re-run ALONE before you believe it (the RTX 3070's P5 one-ulp fault); never `pkill -f` — gate server
`python3 tools/gate/server.py <root> <port>` in the background, `LW_PORT=<p> GD_PORT=<g> node tests/<suite>.browser-test.mjs`, stop by pid; the guard
refuses compound shell with variables/loops/heredocs/backticks and git outside your worktree — plain commands, scripts under `.tmp/`. FINAL message:
the verdict, the row counts, the ms/s pair, the lines, worktree · branch · tip, and anything not verified.

## 7 · Amendments by the integrator (Claude Sos, `sos-s0`, 2026-10-09 11:15 CDT) — the tree you verify is `sos-s0` after C6b AND C7b

- **Start sha:** the `sos-s0` tip the integrator names at launch (code `9c42a5a` = C7b merged across C6b). `lab/*.js` **27,593** at that tip (the bar
  30,000; the estimate band 28.2–29.6k is BELOW us now — report the number, no finding). The pre-C base stays `7044f37`. The `tests/legacy/boot` re-aim
  (a test-only row, no `lab/` edit) merges while you run; at the end `git diff <your start>..sos-s0 -- lab/` must be empty — if it is not, re-run only the
  closers the diff touches and name them.
- **Numbers that moved since §2 was written:** R3 `history` **44**; R14 `gpu-recovery` **10** (one scene fewer — C7b's facade; the thumbnail probe is
  `__LW.thumbnail()` = the readback PNG, `tests/gpu-recovery` line 32); the lock's baseline is **860 · 0/0 and 1004 · 0/0** (not 908/1052 — h2/h2plus/
  helium retired by D9/D9b); hit-probe 49–52 presses / 0 reached.
- **NEW closers to run (each once):** `tests/opener.browser-test.mjs` **7/7** (C6b: the photosensitivity notice under λWAVES' law — no query string
  silences it for a human; the title screen with six covers + NEW + RESUME; `lambdawaves.q0.session`); `tests/timeline.browser-test.mjs` **14/14**
  (C7b, ≈ 5 min, run it last among the browser suites); `tools/perf/film-probe.mjs <out.json>` then `tools/perf/film-compare.mjs <base> <out>` exit 0
  against `.claude/worktrees/agent-a0ff0fd25c7aa306c/.tmp/film-base.json` (read-only; copy it into your `.tmp/` first); `tests/menubar.browser-test.mjs` 8/8;
  `tools/settings-probe.mjs` is now **six scenes 0 RED** with the RENDER card at the TOP of the right rack (C7b's fix: `rack.prepend`).
- **R7:** `tests/first-run.test.mjs` is a NODE suite now; the browser truth of the first run is `opener` (C6b). R8: `tests/keyboard-shortcuts.test.mjs` is node.
- **R5's seven classes:** `C0-GLASS-RULINGS.md` with Josh's rulings applied ("defaults" — Josh 10-09); two new surfaces to capture besides modwindow and
  notebook: the TIMELINE window open (WINDOW › TIMELINE) and the RENDER card open; count their deltas and name them, they are expected.
- **Scope rows that did not exist in §2:** C6b (THE START) and C7b (THE FILM'S UI) are owners for findings; the `__LW` diff base is `7044f37`, and the law
  reads "no member a test or tool uses renamed or removed WITHOUT the test edited in the same commit" — check the commit, not only the diff.
- **Ports:** 8903/5373 (your tip) and 8907/5377 (the base copy). Not 8721/8731/8741/8913/8933. The ms/s pair LAST, when `wait-gpu` says the load is under 4
  (the integrator's gate chain and one Sonnet suite may be running; say how long you waited).
- **CLAUDE.md "rewritten for the kit's windows"** is the integrator's; you verify that every paragraph it has for C0–C9, C6b, C7b, D9/D9b names the truth
  you measured (a wrong sentence is a NOTE row with the line number).
- "FIT TO CUT 0.5.0-alpha" is the question. Josh's words: "don't over-verify"; each closer once, a timing red re-run alone once.
