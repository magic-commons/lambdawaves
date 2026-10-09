# BRIEF D-V · the verifier of 0.5.1 "Informational Update" (fresh Opus, once, after Group I merges; no fix, no lab edit)

**You verify; you do not fix.** Your output is ONE report, `research/release-0.5.1/D-V.md`, with a verdict **FIT TO CUT / FIT WITH NOTES / NOT FIT** and a
findings table (BLOCKER / SHOULD / NOTE, each with the command and its output). Nothing under `lab/` or `tests/` changes; `tools/` only if a measurement needs a
flag (say so). Never merge, push or tag.

**Read first, whole:** `research/release-0.5.1/PLAN.md` (the gates §1, the D-V section, §9), `research/release-0.5.1/AUDIT-OPUS.md` §4 (U1–U10 — the unknowns
the builders were to measure; you re-read their numbers), every `research/release-0.5.1/D*-BUILD.md` (what each row claims it measured; the drafted CLAUDE.md
sentences the integrator applied), `research/release-0.5.0/C-V.md` (the adoption verifier: the R1–R15 table is your closer list's base; its §3 is the ms/s
method; its §4 the `__LW` law method; its §5 the CLAUDE.md method; its not-verified list: camera-routes, mir-controls, serialize-bytes, ms/s with the TIMELINE
open), `research/release-0.5.0/BRIEF-C-V.md` (the house shape of a verifier's brief), `tools/perf/main-thread.mjs` (with D1's `--setup` hook),
`research/release-0.5.0/measure/MEASURE.md` §2 (the gate 3.536 = max(2 × spread, 2)), `CLAUDE.md` whole, `research/release-0.5.1/CHANGES-0.5.1.md`.

## The trees
- **The TIP:** the integrator's `yan-c` tip named in your launch message (`git reset --hard <tip>` first). Serve it on **9023** (`LW_PORT=9023 GD_PORT=5493`).
- **The BASE:** `v0.5.0-alpha` (`git tag -l 'v0.5*'` must list it — U10; `git archive v0.5.0-alpha` into `.tmp/base`), served on **9027** (`LW_PORT=9027 GD_PORT=5497`).

## The closers (each once; a timing red re-run alone once; name every red)
1. **The cumulative pair, TWO scenes** (G-M): `tools/perf/main-thread.mjs` interleaved BASE/TIP 5 + 5, `--runs 1` per round, notice dismissed, `__LW.field.ok`
   true, load < 4, NOTHING else on the GPU: (a) the boot scene (the tool as it is); (b) D1's scene through `--setup` (MOLECULES · H₂O HOMO, ORBITAL view,
   AUTO-ROTATE on, STAGE TEXT on — the exact expression D1-BUILD.md records). Gate |Δ median| ≤ 3.536 ms/s each. **(c) the TIMELINE open and playing** (C7b's
   open item: WINDOW › TIMELINE, a clip placed, play) on the TIP only, reported as a figure beside the closed figure (no gate; the plan wants the number).
2. **THE LOCK** once on the TIP: `node tools/perf/digest-lock.mjs --check --query gastab=0` (860 values) and `--fixture research/release-0.4.0/measure/digest-lock-s4a.json`
   (1004 values): 0/0 each. A single red may be the RTX 3070 in P5 — re-run alone once.
3. **Every suite of C-V's R1–R15 table + the extras** (opener 7/7 ALONE, timeline 14/14, film-probe + film-compare, menubar 8/8, film-handover 4/4, render-exact
   40/40, offer 16/16, history, new-project 8 + `node tools/new-project.mjs --check`, frame-occlusion 7, hit-probe-set 0 reached, keyboard-window,
   keyboard-shortcuts, gpu-recovery, first-run 12, take-in-bugs 4/4, routed-knob 4/4, mir-controls 2/2, camera-shift 11/11, molecule-demos 5, current 15,
   settings-probe 0/6, **camera-routes 5/5, serialize-bytes 11/11** (C-V's not-verified two), palette 3, project-formats) **+ the NEW suites** of this release
   (every test the D*-BUILD files name: D1's re-aimed `stage-text`, D2's `molecule-head` node + browser, D8's `lw-links`, D10-19's `flash-routes` node, D10-24's
   probe, D10-F's boot rows) **+ `tests/legacy/boot` once alone** (expected law reds: B149 only; name any other red and its class).
4. **The `__LW` law** per commit since `v0.5.0-alpha` (C-V §4's method): no member renamed or removed without its suites re-aimed in the same commit; D1 kept
   the stage-text witnesses (or re-aimed the suite) — check.
5. **Lines:** `cat lab/*.js | wc -l` vs the soft 29,000 and the hard 30,000; each BUILD's ledger vs the diff (`git diff --stat v0.5.0-alpha..<tip> -- lab`).
6. **CLAUDE.md against what you measured**: THE STAGE TEXT paragraph as D1 rewrote it (the letters stay; `stage-text.js` gone; the layer's law), THE FLASH GUARD
   paragraph (D10-19), the D2/D8/D10-24 sentences, **C-V's N1–N5** (line 9's LINKED sentence; "0.5.0 deletes `stage-text.js`" now done; "KIT BRIEF 6 at 0.5.0"
   → 0.5.x; the `!important` count — count it: `grep -o '!important' lab/skin.css lab/lab.css | wc -l`); any sentence CLAUDE.md states that the tree contradicts
   is a NOTE with the line.
7. **The legibility PNGs re-taken once** (the spike's recipe, `research/release-0.5.0/CANARY-A0.md` PASS 2 §2, the gate's Firefox `g.snap()`): the kit's block over
   hydrogen, benzene HOMO, C₆₀ HOMO × light/dark — written to `research/release-0.5.1/d-v/legibility/` for Josh's R6-I look; your reading is a NOTE, not a verdict.
8. **The idle witness, repeated** (D1's U2) on the TIP: 0 mutation records on `layer.root` over 10 s of AUTO-ROTATE and under a pointer sweep; `layer.debug().running`
   false. **Placement U3** at shift ±1 with the TIMELINE docked.
9. **The flash guard in the app** (D10-19): a 10 Hz exposure LFO is held and METERS says so; a hand's sweep is not held; hue is untouched (a short CDP or gate script).
10. **CURVES screen-only** (D10-24): with an S-curve set, a picture's bytes (`__LW.captureUI.capture.picture`) equal the neutral picture's; `filter` reads `none` at
    neutral; the PREFERENCE key survives a reload and a project open leaves the settings blob byte-identical outside WORKSPACE keys.

## Report
`research/release-0.5.1/D-V.md`: the verdict in one paragraph; the closers table (name · command · output · green/red · re-run?); the two pairs' medians and spreads
+ the TIMELINE-open figure; the lock's two counts; the lines; the `__LW` law per commit; the CLAUDE.md table (claim · measured · verdict); the findings table ranked
(BLOCKER / SHOULD / NOTE; owner row); what you did not check. Commit it on your branch (`0.5.1 D-V · the verifier's report`, the two trailer lines
`Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01ADfznhVLrgqTQjNSNtMUE8`). Try
`~/.claude/handoffs/agents/<id>.md`; your final message carries the verdict, the BLOCKERs/SHOULDs and the commit sha.

## Harness
Isolated worktree; `git reset --hard <tip>` first. ONE browser at a time on the rig (`node tools/perf/wait-gpu.mjs`; `pgrep -a geckodriver` / `pgrep -a -f chrome`
empty; the pairs and the lock only on a QUIET rig, load < 4); stop your servers by pid; never `pkill -f`. The guard refuses compound shell lines (plain commands
or `bash .tmp/x.sh`); run_in_background for servers and long runs. Never edit `lab/mir/**`. Nothing is fixed by you; nothing is merged, pushed or tagged.
