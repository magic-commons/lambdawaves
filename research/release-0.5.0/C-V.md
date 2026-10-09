# C-V · THE ADOPTION VERIFIER — the report (2026-10-09, a fresh Opus 5.5 verifier, for Claude Sos on `sos-s0`)

## Verdict: FIT WITH NOTES (to cut 0.5.0-alpha)

**Why not FIT TO CUT outright.** One NEW closer is red in both of my runs: `tests/opener.browser-test.mjs`. The first run passed
6 of 7 scenes and the alone re-run passed 5 of 7. Both reds are the kit's MOTION under headless Firefox's held frames, in a
different scene each time:
- **scene 7:** the notice pane's exit;
- **scene 6, on the re-run:** the cover's entrance, still at opacity 0.

In both runs λWAVES' own law read correctly: `dismiss()` true, `open` false, `warned` written, the play started. Nothing I measured
shows a product defect. It is a gate that does not hold 7/7 here, so it is a SHOULD, not a BLOCKER (§ Findings, S1).

**Everything else is green:**
- the R1–R15 table, with one first-run timing red that was green alone;
- the seven glass classes, as C0 ruled them and Josh confirmed ("defaults");
- the four window captures;
- the ms/s pair: Δ **+1.005 ms/s**, inside the 3.536 gate;
- the lines: **27,593**, under the 30,000 bar;
- the `__LW` law, checked per commit;
- `adopt.mjs --check`, the hit-probe and every film closer.

`sos-s0` did not move while I ran: `git diff 3e04dc3..sos-s0 -- lab/` is empty, so nothing was re-run. **M5 pending**:
`research/device-reports/` holds only the nine September iPad reports.

| | |
|---|---|
| worktree · branch | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aabaf58d164cdd3ae` · `worktree-agent-aabaf58d164cdd3ae` |
| tree verified | `3e04dc3`: the `sos-s0` tip = code `9c42a5a` (C7b merged across C6b) + BRIEF-C-V §7 (`git reset --hard 3e04dc3`) |
| base copy | `git archive 7044f37 lab tools tests` → `.tmp/base`. `7044f37` = `fbde0b6` (MEASURE §2's pre-C baseline tree) + docs |
| servers (stopped by pid at the end) | gate HTTPS 8903 = tip (pid 698388) and 8907 = base (pid 698420), geckodriver 5373 / 5377; plain `http.server` for stylehash: 8904 = tip (pid 826309) and 8908 = base (pid 826342) (the kit's CDP launcher cannot ignore the self-signed certificate; C2/C3 did the same) |
| harness | One browser at a time. Each run waited on `node tools/perf/wait-gpu.mjs` (load < 4, no other headless Firefox), then 4 s. Other agents' Firefox suites ran all session (a `new-project` at 11:10, a `.tmp/chunk.mjs` at 11:36, a `.tmp/nav2.mjs` at 11:49). Waits per suite were 0–248 s; the ms/s pair waited 779 s in all (§3) |

## 1 · The R1–R15 table (each closer once; a timing red re-run alone once)

| risk | closer · command (tip `LW_PORT=8903 GD_PORT=5373` unless named) | count | verdict |
|---|---|---|---|
| R1 occlusion | `node tests/frame-occlusion.browser-test.mjs` | **7/7** alone. The first run stopped at scene 6, "detached rack drag refreshes frame ink while paused" (`headMasked` false, line 116), with another agent's `new-project` Firefox starting in the same second. Green alone | GREEN |
| R2 scopes | `node tools/settings-probe.mjs --out .tmp/settings-probe.json` | **0 of 6 scenes RED** (boot, WAVE DANCER, WATER, BENZENE, N₂, NEW; each reload byte-identical; the look out of the blob) | GREEN |
| | `node tests/new-project.browser-test.mjs` · `node tools/new-project.mjs --check` | **8/8** · "in step (16117 B)" | GREEN |
| R3 history | `node tests/history.browser-test.mjs` | **44/44** (the five legacy-file opens D9/D9b added among them) | GREEN |
| R4 offline | `node tests/pwa.test.mjs` (in `bash test.sh node`) | PASS: **341 files, 6.55 MiB**, 1.45 MiB under the ceiling | GREEN |
| | `node tests/offer.browser-test.mjs` | **16/16** | GREEN |
| | `node tests/wiring.test.mjs` (in `test.sh node`; R5-W1) | PASS: 228 reachable `.js` of 252, allowlist 0; **24 of 154 kit modules unreached, reported, not precached, not failed** | GREEN |
| R5 cascade | MIR 1.5 `tools/stylehash.mjs` (README λWAVES recipe), base ×2 vs tip, 8 states × 5 surfaces | the seven classes as ruled: 1, 2, 3, 5, 7 the kit's; **4 and 6 at 0** on every surface; outside the seven only C0's named riders (§2) | GREEN |
| R6 two clocks | `node tests/take-in-bugs.browser-test.mjs` | **4/4**: THE ONE CLOCK over five boots (fresh, no sources, after NEW, MOD power off, WAVE DANCER), **0 refusals** each | GREEN |
| | the replay judges: history's ONE CLOCK / "a route undone while it plays" / "the modulation plays through an undo"; `node tests/routed-knob.browser-test.mjs` | green inside history's 44 · routed-knob **4/4** (K0–K3) | GREEN |
| R7 first-run | `node tests/first-run.test.mjs` (node now) · `node tests/official-defaults-palette.browser-test.mjs` | **12/12** · **3/3** | GREEN |
| | NEW `node tests/opener.browser-test.mjs` (C6b; the browser truth of the first run) | **6/7**, then **5/7** alone (S1) | **RED** |
| R8 keys | `node tests/keyboard-shortcuts.test.mjs` (node) | **6 PASS**, the Ctrl-vs-Mod case among them ("Ctrl+Shift+Q is the Control key on a Mac (⌘⇧Q runs nothing)…") | GREEN |
| | `node tests/keyboard-window.browser-test.mjs` · NEW `node tests/menubar.browser-test.mjs` | **8/8** (1080 × 416, five rows) · **8/8** | GREEN |
| R9 ids | `grep -rn "data-mir-\|data-lw-" tests/ \| wc -l` | **38** (base 28). `.tmp/r9-ids.mjs`: 41 ids named by non-legacy tests and tools. The 15 that `lab/` never defines are test-assigned marks (`#fh-*`, `#tl-*`) or URL fragments (`#stale`, `#doc-`). **0 id-keyed selectors lost** | GREEN |
| R10 formats | `node tests/project-formats.test.mjs` · `node tests/project-formats.browser-test.mjs` | **8 judged lines** · **5/5**: invalid collection read-only, 8 vs 24 MiB, a 1.4 notebook is page 0, R-I3, FOLDERS masked | GREEN |
| R11 NEW/empty | `new-project` 8/8 + `--check` (R2's rows) | 8/8 · in step | GREEN |
| R12 byte-pins | `node tests/mir.test.mjs` · `node tests/mir-manifest.test.mjs` | **103/103** · PASS: "all 262 adopted files match … the pinned one (sha-256 3f969725fe44…)" | GREEN |
| R13 modwindow drift | stylehash with the modulation window open | counted and named in §2: the kit's window (C4), the SAVE glyph swap 3 paths × 8 = **24** element-states | GREEN |
| R14 WebGPU | `node tests/gpu-recovery.browser-test.mjs` | **10/10**: thumbnail probe `road: readback`, 320 × 204, lit 7653; recovery `⛔ the GPU device was lost`, `role=alert` | GREEN |
| R15 moving kit | `node ~/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs <tree> --check` | "**in step with MIR 1.5.0-alpha.24**", exit 0 | GREEN |

### The extras and §7's NEW closers

| closer | command | count | verdict |
|---|---|---|---|
| hit-probe | `LW_PORT=8903 node tools/hit-probe-set.mjs --json .tmp/hit-probe.json` | **49 presses through a kit window's gap, 0 reached the stage**; the control reached 3 of 3; 13 scenes OK (incl. TIMELINE and its rail) | GREEN |
| node suites | `bash test.sh node` | **exit 0**, 79 suites, 0 RED lines | GREEN |
| lines | `cat lab/*.js \| wc -l` | **27,593** (base 36,288: −8,695; 98 files). The HARD BAR is 30,000, **2,407 under**; PLAN's band 28.2–29.6k is above us (§7: report, no finding) | GREEN |
| `__LW` law | §4 | no member renamed or removed without its test edited in the same commit | GREEN |
| film-handover | `node tests/film-handover.browser-test.mjs` | **4/4** | GREEN |
| film-probe + film-compare | `node tools/perf/film-probe.mjs .tmp/film-tip.json` · `node tools/perf/film-compare.mjs .tmp/film-base.json .tmp/film-tip.json` (base = C7b's `agent-a0ff0fd25c7aa306c/.tmp/film-base.json`, copied) | **exit 0**: picture bytes identical (97,824 B); 25 frame pixel hashes and times identical; ONE PERIOD 180 digests + times, 953,793 B both; RECORD 180, 743,644 B both; verify "DETERMINISTIC" | GREEN |
| timeline (last browser suite) | `node tests/timeline.browser-test.mjs` | **14/14** in 275 s | GREEN |
| menubar · settings-probe | above (R8, R2) | 8/8 · 0 of 6 RED | GREEN |
| M5 | `research/device-reports/` | holds only 2026-09-25/26 iPad reports | **M5 pending** |
| end check | `git diff 3e04dc3..sos-s0 -- lab/` (and `git log 3e04dc3..sos-s0`) | **empty**; `sos-s0` is still `3e04dc3` | nothing re-run |

## 2 · R5 / R13 — the seven classes, base vs tip, and the four window captures

**Method.** The kit's `tools/stylehash.mjs` (the 1.5 worktree's), with C0's recipe:
- `--gpu 1`, ready on `__LW.ready && #controlHelp`, the 8 states by `__LW.setTheme / setCardStyle / setFrost`;
- `?sw=0&warn=0&starter=home`;
- a setup that dismisses the notice on both trees, settles 2.5 s, pauses, opens the surface explicitly (the modulation window is
  collapsed for every set but its own), then waits 1.5 s;
- `before` = base, `before2` = base again (the noise mask), `after` = tip.

C0's own `classes.mjs` sorted each change into a class, with noise masked exactly as `stylehash compare` masks it. Counts are
element-states summed over the 8 states, with the distinct elements in parentheses. The scripts are `.tmp/cap.mjs`,
`.tmp/classes.mjs`, `.tmp/split.mjs`, `.tmp/gonenew.mjs` and `.tmp/rematch.mjs`. The captures are in `.tmp/sh/`.

| surface | elements / state, base → tip | 1 press-scale | 2 box-shadow | 3 focus outline | 4 `.dev-head` bg | 5 ON text-shadow | 6 backdrop-filter | 7 border | OTHER (all C0 riders) |
|---|---|---|---|---|---|---|---|---|---|
| C0's closed rack (bare adopt, for reference) | 790 | 816 (102) | 456 (57) | 224 (28) | 0 after the default | 132 (21) | 0 after the default | 80 (10) | 150 (34) |
| **closed rack** | 775 → 855 | **408 (51)** | **200 (25)** | **72 (9)** | **0** | **132 (21)** | **0** | **32 (4)** | 70 (17) |
| **modulation window open** | 1,154 → 1,238 | 424 (53) | 304 (38) | 88 (11) | **0** | 132 (21) | **0** | 72 (9) | 364 (59) |
| **notebook open** | 790 → 870 | 408 (51) | 199 (25) | 72 (9) | **0** | 132 (21) | **0** | 32 (4) | 70 (17) |
| **TIMELINE open** (vs the tip's closed rack) | 855 → 967 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **RENDER card open** (vs the tip's closed rack) | 855 → 973 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | `#box` only |

**The seven classes as C0 ruled them, Josh's defaults in force.**
- **Classes 4 and 6 are 0 on every surface.** They stay 0 on the elements re-matched across a sibling-index rename too. λWAVES'
  disconnected head keeps its fill and its lift (`lab/lab.css` §G, three rules), while the heads themselves are matched and
  change only in class 2.
- **Classes 1, 2, 3, 5 and 7 are present.** They are the same kinds of change on the same kinds of element C0 named:
  - 1: `.seg-b`, `.trig`, `.sw`, the turners;
  - 2: `.k-val`, `.dev-head`, the rack buttons, the transport, `.dock-btn`;
  - 3: `.k-val`;
  - 5: ON triggers and the emboss;
  - 7: `.dev-power`.
- **Why the counts are lower than C0's.** The tip's DOM moved under three rows, so those elements are now "gone/new", not
  "changed":
  - C1 rewrote the CAMERA and PALETTE cards on the kit's panels;
  - D9/D9b deleted five hidden legacy sections;
  - C7b added the RENDER section.

  The deletions and the RENDER section shift every later card's sibling index, which renames its key. Re-matched across that
  rename (geometry ignored), the closed rack adds 1: 72 (9), 2: 64 (8), 3: 8 (1) and 7: 8 (1), and OTHER 56 (9), which is the
  riders plus C1's own card layout. Nothing new appears.

**Outside the seven (the brief: "anything outside the seven is a finding"): no finding.**
- **OTHER on matched elements, closed rack.** These are exactly C0's riders:
  - `.dev-power` ×32, class 7's rider: fill → transparent, glyph 6 → 8 px, `--power-glow`;
  - the disabled knob 0.3 → 0.38 ×8;
  - the frost-tinted sheen on the card roots, the bodies, the three rack buttons and the transport (×30).
- **Gone/new per state on the closed rack: 305 / 385.** By owner:
  - **C1:** CAMERA 96 → 99, PALETTE / RAMP 33 → 106;
  - **D9/D9b + C7b, index renames:** OBSERVER 82/82, CLIP 18/18 and `#rack` 72/72, all re-matched 1:1 once `:N` is stripped.
    OBSERVER sits at `section:18 → :14`, which is −5 legacy sections + 1 RENDER;
  - **C6b:** `#banner` 4 → `#mir-banner` 6;
  - **C3:** `div.mir-rack-grip`, 1 × 1 at −8, −8;
  - **C4:** `div.m2route-glow`, 0 × 0.
- **TOKENS.** 16 element-states read "undefined": stylehash's token scan does not descend into `@import` (C0's note; MIR 1.5
  tooling). No element is affected.

**R13, the modulation window (counted, named; C4's).**
- **Inside `#floats` / `#modwin` / its rail.** 45 elements gone and 50 new per state. In the classes:
  - 1: 16 (2), `.m2macadd`, `.m2devadd`;
  - 2: 104 (13), `.m2dot` and kin;
  - 3: 16 (2), `.m2vname`;
  - 7: 40 (5), `.m2vname`, the preset rim, `#modsync`, `#modcad`.

  OTHER is 294 (42): `.m2ab`, `.m2bank`, the A/B slash, `.m2pow`'s glow, the preset fill, the tempo / tap / sync / cadence buttons
  (`#modcad` row → column), the native RATE knob, the chip rail's z-index, and the work bar's width.
- **The glyph swap.** The `.m2presave` SAVE glyph's 3 paths grow (11.3 → 16.3 px): **24 element-states**.
- **Outside the window** the counts are the closed rack's to the element-state, so the window disturbs nothing.

**The four window captures.**
- **Modulation window:** above.
- **Notebook:** 0 property changes inside it. One key per state is renamed (`div.nb-grip:3 → :2`, a sibling count); the rest equals
  the closed rack.
- **TIMELINE** (WINDOW › TIMELINE; `__LW.timeline.open()`; C7b, expected): +112 elements per state (the window 82, its rail 30) and
  0 property changes on anything already present. Opening it moves two things, and their keys are renamed (42 + 42 per state):
  - THE pill goes to the top (`#transport` → `.at-top`, y 794 → 52);
  - THE STAGE TEXT goes to the foot (`#molFormula.mf-top` → `.mf-foot`, y 64 → 827.9).

  That is CLAUDE.md's stage-text law.
- **RENDER card** (`__LW.layout.raise('render')`; C7b, expected): +118 elements per state. The card is at the **top of the right
  rack** (y 10, 1,249.7 px tall). The six cards below it move down 1,259.7 px: `#box` only, 3,016 element-states (377 elements),
  0 style changes.

## 3 · A-M's ms/s against the pre-C baseline (LAST, after every browser suite)

`LW_PORT=<8907|8903> node tools/perf/main-thread.mjs --runs 1 --json .tmp/msps/<side>-<r>.json` was run interleaved base / tip,
3 + 3 (`.tmp/msps.sh`). Each run was a fresh browser with the warm-up navigation, `field ok · NVIDIA GeForce RTX 3070`, the notice
dismissed, 30 s, and 0 held frames. `wait-gpu` came before every run.

| round | base `7044f37` ms/s (script) · presents / 30 s · load start → end | tip `3e04dc3` ms/s (script) · presents · load | wait before (base · tip) |
|---|---|---|---|
| 1 | 40.183 (14.977) · 611 · 3.35 → 4.70 | 40.215 (15.984) · 668 · 3.47 → 3.72 | 481 s · 66 s |
| 2 | 37.159 (14.163) · 662 · 2.74 → 3.42 | 41.060 (15.849) · 664 · 3.27 → 4.50 | 51 s · 5 s |
| 3 | ~~44.202 (16.914) · 411 · **7.39 → 11.99**~~ DISCARDED: the load spiked after wait-gpu's poll (another job). Re-run once: **40.055** (14.761) · 634 · 1.26 → 2.04 | 42.435 (16.377) · 739 · 2.07 → 1.96 | 10 s (re-run 4 s) · 162 s |
| **median · spread** | **40.055 · 3.024** | **41.060 · 2.220** | |

- **The pair: Δ median = +1.005 ms/s**, inside the gate of **3.536** (MEASURE §2: max(2 × 1.768, 2)). **GREEN.** With the discarded
  run kept, Δ is +0.877, so the verdict does not hang on the re-run.
- **The raw medians against MEASURE's 37.335.** Base +2.720 and tip +3.725. The tip's raw figure alone exceeds 3.536, but the same
  pre-C tree reads +2.72 in this session (load 1.3–4.7 against §2's 1.5–2.3). That is why the integrator's ruling at C0 reads the
  gate on the interleaved pair.
- **The cost of stage C, measured.** All of stage C (+ D9/D9b) costs ≈ +1.0 ms/s on this footing. The tip presents more frames
  (664–739 against 611–662 per 30 s), so its cost per present is about the base's (1.85 against 1.90 ms).
- **Not measured: the TIMELINE open and playing** (C7b's open item).
- **The wait.** The pair waited **779 s** (13 min) in all for `wait-gpu`, 481 s of it before the first run, while other agents'
  Firefox suites held the GPU. From the first wait to the last run it took 1,001 s, plus the 4 s re-run.

## 4 · The `__LW` law (base `7044f37`, checked per commit)

**The diff.** I ran `grep -rohE "__LW\.[a-zA-Z_.]+" tests tools | sort -u` on the base copy and on the tip
(`.tmp/lwdiff.sh`). Tests and tools use 759 members at the base and 773 at the tip.
- **Only in the base (32 member paths).** These are seven families: `__LW.qcd.*`, `molecule.*`, `mo.*`, `pulse.*`, `helium.*`,
  `fieldlines.*` and `mod.clockLink`.
- **Only in the tip.** The new members: `captureUI.*`, `render.*`, `timeline.*`, `session.*`, `thumbnail`, `keys.table`,
  `projects.folders/demo/fresh/status`, `mod.host.registry`, `field.canvas` and `field.device`. The bare `__LW.qcd`, `__LW.molecule`
  and `__LW.fieldlines` appear only in the legacy suite's "is gone" judges.
- **Per commit (`.tmp/lwcommits.sh`, `git log -S`).** Each removal from `lab/` sits in the SAME commit as its test edits:
  - `59bb55f` (QCD);
  - `57dca21` (H₂⁺: `molecule`, `mo`, `pulse`);
  - `5baa301` (HELIUM, `placeElectron`);
  - `9ebf35c` (H₂);
  - `1012497` (ELECTROSTATICS: `fieldlines`, `electrostatics`);
  - `be03a83` (C4: `clockLink`).

  Each commit also edits `tests/legacy/boot` and the suites that used the members.
- **At runtime (`.tmp/lw-keys.mjs`, CDP).** The tip's live `__LW` has 174 members. Of the 167 top-level members tests and tools use,
  13 are absent:
  - **8 are the D9/D9b retirements above.** They are used only in legacy judges that assert their absence.
  - **5 are absent on the base too** (`dynamics`, `energyOf`, `error`, `h`, `setAccent`). All 5 are pre-existing guarded probes in
    `legacy/boot` and `smoke.mjs`.

**GREEN.**

## 5 · CLAUDE.md against what I measured (the C0–C9, C6b, C7b, D9/D9b paragraphs)

**Confirmed.**
- **C0** (lines 247–260), pin and cascade: `ACCEPTED` sha, `@layer app, mir;` first, then `mir/mir.css`, `lab.css`, `skin.css`;
  the unlayered `!important`s (33 by C0's count; see N5); `--unreached-kit`; §G with classes 4/6 at 0.
- **C2** (158–164): `mir.gui`, `createGui` not built, the first-run defaults (official-defaults-palette 3/3).
- **C3** (135–146): `createRack` / `createMenubar` / `createKeyboardWindow`; 1080 × 416, five rows.
- **C4** (233–245): `modwindow.js` and `audio.js` gone; `lambdawaves.q0.modulation` PREFERENCE; ONE clock (take-in-bugs).
- **C6** (196–210): FOLDERS over one part; read-only invalid collection; 8 / 24 MiB; NEW.
- **C6b** (165–181): the law (opener scenes 1–5, and scene 7's law assertions); the 8 `__LW.warning` members; `&starter=home` in
  the 5 CDP tools; the kit banner (gpu-recovery).
- **C7/C7b** (262–274): the RENDER card closed on the right and at the top; `tlwin` WORKSPACE; the closers listed.
- **C9** (227–231): 0 reached.
- **D9/D9b** (31–33, 61–66): each of the five old files opens on its shim with its status line (`retired in 0.5.0: ` + the history
  suite's five strings).
- **C1** (219–225) is not contradicted, but it was not measured here: `tools/camera-routes.mjs` is not in the R-table.

| NOTE | line | the sentence | what is true at `3e04dc3` | owner |
|---|---|---|---|---|
| N1 | 9 | "while MOD is armed and LINKED the modulation follows its edges" | Stale since C4. LINKED is retired (line 240), and "power never plays and play never powers" (238–239). `take-in-bugs` measured the modulation playing with MOD power off ("MOD power off … mod playing, running, 0 refusals") | integrator (C4 superseded the A5/A6 sentence) |
| N2 | 164–165, 181–182 | C2's paragraph runs into "THE START (0.5.0 C6b …" with no blank line, and THE START runs into the old first-run tail; line 182 is the single word "DOMAIN" | The DOMAIN AUTO / `field.js` / official-defaults-palette sentences now read as part of THE START. They are true, but misplaced | integrator (cosmetic) |
| N3 | 91 | "`lab/stage-text.js` — the interim renderer, which 0.5.0 deletes for the kit's INFORMATIONAL layer" | PLAN §9: **D1 is 0.5.1** (pass 2 +115 %). `lab/stage-text.js` ships at the tip | integrator (D1); outside the named paragraphs |
| N4 | 118 | "(KIT BRIEF 6 replaces it at 0.5.0)" | Brief 6 is unbuilt in alpha.24 (PLAN §1 G1), and the tree is pinned in step with alpha.24 (R15). Not at 0.5.0 on this pin | integrator; outside the named paragraphs |
| N5 | 253 | "The 33 `!important`s stay unlayered" | Outside comments there are **32** declarations: lab.css 9 and skin.css 23 (`.tmp/imp.sh`, at every commit since `7044f37`). C0's count (37 = 13 + 24) included the word in skin.css:234's trailing comment ("/* !important beats the inline width/height …"), and "33" carries that one. Off by one, harmless | integrator (cosmetic) |

## 6 · Findings

| # | class | what | command · output | owner |
|---|---|---|---|---|
| S1 | **SHOULD** | `opener` is not 7/7 here, and it failed in a different scene each time. Both reds are the kit's motion while headless Firefox holds frames after a heavy boot: the test's own comment names that stall, and C6b-BUILD lists the cover entrance as brief candidate 8. λWAVES' facade was right in both runs. Before the tag: re-run it alone on a quiet GPU, and/or make scenes 6 and 7 wait on the motion's end rather than on 5 s of frames | `LW_PORT=8903 GD_PORT=5373 node tests/opener.browser-test.mjs`. **Run 1:** `RED opener.browser-test — 6 of 7 scenes`, scene 7 `[s7d.d, open, notice, warned, playing]` = `[true, false, true, true, true]` where `notice` should be false (`{"d":true,"open":false,"notice":true,…,"warned":true,"playing":true,"autoplay":"started"}`). **Re-run alone:** `RED … 5 of 7 scenes`, scene 6 `.mir-opener-option[data-cover=water] was not pressable: {"ok":0,"why":"not visible","display":"block","visibility":"visible","opacity":"0"}` | C6b (the suite); MIR brief candidates 5 and 8 (rAF-driven `bootVeil` timeout, the cover entrance) |
| N6 | NOTE | `frame-occlusion` read red once (scene 6, `headMasked` false) beside another agent's Firefox suite. It was green alone, so it is not counted | as R1 | — |
| N7 | NOTE | The ms/s base run 3 was taken at load 7.39 → 11.99 and was discarded and re-run. With or without it, the pair is inside the gate | §3 | — |
| N8 | NOTE | `tools/perf/main-thread.mjs` records the sha of its CWD, not the served tree, so every one of my rows says `3e04dc3`. The base rows are `7044f37` by port (8907) | `.tmp/msps/base-*.json` `"sha"` | A-M (tool) |
| N1–N5 | NOTE | CLAUDE.md, §5 | | integrator |

**No BLOCKER.** Nothing under `lab/` was edited and nothing was fixed. Nothing is pushed, merged, tagged or deployed. No lock was
run (§4 of the brief).
