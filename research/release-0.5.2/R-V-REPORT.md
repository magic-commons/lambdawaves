# R-V-REPORT · THE VERIFICATION ROUND (0.5.2 "Rack Dissolution"; a fresh Opus verifier — read, measured, judged; nothing fixed)

Worktree `.claude/worktrees/agent-a41339d31c3c73662`, branch `worktree-agent-a41339d31c3c73662`, `git reset --hard fd1b415` (the integrator's tip on
`sos-s0`; lab bytes = the R5 merge `855ab99`; `git log --oneline -3` = `fd1b415`, `855ab99`, `b00e613`). Ports **9133/5603** the tip (pid 126731) and
**9137/5607** the 0.5.1 base (`git archive v0.5.1-alpha` → `.tmp/base`, pid 126827), both `LW_CERTS=<worktree>/.certs python3 tools/gate/server.py`.
The rig: the RTX 3070, rebooted 11:46; quiet throughout (load 0.4–1.7); Josh's desktop Firefox not running; the integrator's 8731 / 8735 and every
process not mine untouched. Every browser run waited on `research/release-0.5.2/r2b-measure/rigfree.mjs` + 4 s, one at a time. 2026-10-10 12:55–14:34 CDT (`date`).
Scripts (git-ignored, `.tmp/`): `pairs.mjs` (R1's pair recipe, `rigfree` for `wait-gpu`), `estate.mjs` (R1's), `domorder.mjs` (new: the page's
structure and every card's rect and computed look), `coldload.mjs` (new: U9), `freenames.mjs` (r3a's, every file, against `v0.5.1-alpha`),
`deadslots.mjs`, `blanks.mjs`, `uicontract.mjs`, `ledger.mjs`, `verbatim2.mjs`, `important.mjs`, `spcmp.mjs`, `domdiff.mjs`.

**THE VERDICT: FIT WITH NOTES** — every gate is green or base-identical on the healthy rig (THE LOCK 860 + 1004 · 0/0, the pair Δ +0.648 / +0.435
inside the floor, the bytes 11/11 + 11/11, the settings probe 0/6 with every blob byte-identical to the base, the facade 1/1, node 0, 34 of 35 browser
suites + `latex-copy` red on the base too, the boot suite's only law red B149), and no BLOCKING defect was found; seven NOTES go to the fix round —
one of them (N1, the drafted cut script's `^const BUILD_LINE` anchor, which no longer matches `export const BUILD_LINE`) must be fixed before the cut
runs, or `v0.5.2-alpha` ships saying 0.5.1.

## 1 · The gates (PLAN §2, in BRIEF-R-V's order) — reading · the base beside any red · verdict

| # | gate | the tip (`fd1b415`) | the 0.5.1 base export, where the tip read red | verdict |
|---|---|---|---|---|
| 1 | **G-A the shape** — `tools/perf/app-shape.mjs` (U5) | `app` 30 keys FAST at `LW.ready` AND after 6 s of play; every namespace FAST: hooks 12 · state 57 · loop 13 · host 21 · w 71 · ctl 68 · sh 45 · ui 107 · dom 12 · mat 24 · obs 7 · sturm 6 · appPlay 6 · settingsStore 4 · FIRST_RUN 4 · LOOK_DEFAULTS 6 (R0's reading, key for key) | — | GREEN |
| 1 | G-A static · `node tools/rack-deps.mjs --classes --no-write` | `app` at `rack.js:112`, 30 keys, the seven namespaces as R0 made them, the largest 71 (< 128); nothing named outside the literal, no `Object.assign(app…`, no `delete`; 37 pieces tile the body 49–942; 21 module files measured; `tests/rack-deps.test.mjs` **55 PASS** | — | GREEN |
| 1 | the doubles law · `integrator/doubles.mjs` | **190 slots across 22 files; 0 filled more than once** | — | GREEN |
| 1 | the slots · `.tmp/deadslots.mjs` | 230 slots (hooks 12 · loop 13 · host 21 · w 71 · ctl 68 · sh 45): **0 read but never filled**, 0 filled but never read, 32 neither (R5 candidate 3, §4) | — | GREEN |
| 1 | the cycle · `grep "from '../rack.js'"` | **16 modules** import from `'../rack.js'`: `TIER` alone — shell/controller, keys, modulation, ink, transport, persist, rack-wiring; windows/readouts, material, molecules, kepler, settings-card, spectrum, state; `TIER` + `BUILD_LINE` — shell/facade, shell/notebook. Not: settings, links, history, stage-words, film. No module has a top-level statement but its imports and its one `export function` (persist's `LS_EXP` / `LS_PRES` string const aside), so both names are read only inside `create*(app)`, after `rack.js`' body ran — the accepted cycle holds | — | GREEN |
| 1 | the `ui` contract (U8 re-read) · `.tmp/uicontract.mjs` | 104 `ui.<x> =` members on the tip, 104 on the base, **the same set**; every member `native-ui.js` / `badges.js` names (incl. the quoted names of its dynamic lists) is still assigned | — | GREEN |
| 2 | **G-G the classes, final** | **0 bare writes across scopes; the largest moving module SPECTRUM at 24 (limit 25) → HOLDS**; facade 21 · persist 23 · notebook 20 · settings 16 · keys 13 · controller 12 · modulation 10 · history 8 · state 8 · molecules 8 · readouts 7 · settings-card 5 · film 5 · links 5 · stage-words 5 · transport 4 · kepler 4 · rack-wiring 4 · ink 3 · material 1; boot 66 / loop 75 exempt. **`rack.js` 943 ≤ 1,500**; no module > 600 — the largest three **notebook 379 · controller 354 · rack-wiring 341**; the facade's row **21 ≤ 25** | — | GREEN |
| 3 | **G-D THE LOCK** `--check --query gastab=0` | **860 values · 0 readback · 0 record-byte differences**, unrepeatable none, page errors 0, **57 s**, first run | — | GREEN |
| 3 | THE LOCK `--fixture …/digest-lock-s4a.json --query gastab=0` | **1004 · 0 · 0**, page errors 0, **57 s**, first run | — | GREEN |
| 4 | **G-M U4 the same-tree floor FIRST** — the base (9137) against itself, 5 + 5 interleaved | boot **48.539 (spread 1.394) vs 48.929 (0.964): Δ +0.390**; D1 **72.625 (5.574) vs 73.066 (2.754): Δ +0.441** ms/s | — | the floor |
| 4 | **G-M the pair** — base A (9137) vs tip B (9133), R1's recipe (`main-thread.mjs --runs 1`, per round A-boot · B-boot · A-D1 · B-D1, 5 rounds; D1 = H₂O · ORBITAL · HOMO · AUTO-ROTATE · STAGE TEXT, `--sweep 10`) | boot **48.202 (1.786) vs 48.850 (0.976): Δ +0.648 · PASS** (≤ 3.536); D1 **71.204 (1.855) vs 71.639 (1.710): Δ +0.435 · PASS**; script medians boot 17.416 → 17.318, D1 20.383 → 20.660; presents / 30 s 750–754 vs 730–754 (boot), 565–570 vs 566–568 (D1); all 40 runs `field ok · RTX 3070`, notice dismissed, 0 held; every D1 run `{mol:true, view:'orbital', homo:5, auto:true, stage:true}` | — | GREEN |
| 5 | **G-B the bytes** · `serialize-bytes --out` tip vs the base export, `integrator/sb-compare.mjs` | **full 11/11 · edit 11/11** sha-identical (the four demos, NEW, six history rows), 0 page errors either side; and 11/11 + 11/11 against R1's recorded `r1-measure/sb-base.json` | the base's own run is the comparand | GREEN |
| 5 | `tools/settings-probe.mjs` | run 1: boot · WAVE DANCER · WATER · BENZENE GREEN, then **N₂ "Render did not settle: animation frames stopped"** (1 of 6); **re-run alone: 0 of 6, all six reached** (boot 716 B · WAVE DANCER 752 · WATER · BENZENE · N₂ · NEW 736; every reload byte-identical) | **0 of 6, all six reached**; and the six scenes' B1 / B2 / B3 blobs **byte-identical tip vs base, 6 / 6** (`.tmp/spcmp.mjs`) | GREEN (the first run's N₂ stall the rig's: it did not repeat) |
| 6 | **G-W the facade** · `tests/lw-facade.browser-test.mjs` WITHOUT `--write` | **1/1 — 176 members (56 value · 48 get · 72 method), names, kinds and order**, twice (batch and estate); `lw-facade.json` untouched | — | GREEN |
| 7 | **G-S node** · `bash test.sh node` | **exit 0** (82 suites + `pwa` last, check-only; the tree stayed clean) | — | GREEN |
| 7 | **G-S the 35 browser suites**, one at a time, a red re-run once alone (`.tmp/estate.mjs`) | **34 of 35 GREEN** — camera-shift 11 · chem 55 · current 15 · curves 7 · export3d 10 · field-molecule 9 · film-handover 4 · frame-occlusion 7 · gpu-recovery 10 (red once: "Render did not settle" after a reload; green on the re-run — R1's recorded base flake) · history 44 · input 13 · keyboard-window 8 · lfo-tension 3 · library 7 · lw-facade 1 · lw-links 5 · menubar 8 · mir-controls 2 · molecular-diff 15 · molecular-names 6 · molecule-demos 5 · molecule-head 3 · new-project 8 · offer 16 · official-defaults-palette 3 · opener 7 · orbitals 24 · project-formats 5 · register 17 · render-regressions 2 · routed-knob 4 · stage-text 4 · take-in-bugs 4 · timeline 14; **latex-copy RED twice** (`hit: false`, `:55`) | **RED too**: block 2 PASS, then `:67` — the driver's real tap on the ⧉ copied nothing (`0 !== 1`). The cause, measured on both trees (`.tmp/latexprobe.mjs`, 3 + 3): right after the test's `raise('spectrum')` + `settle()` the ⧉'s centre is at y ≈ 1095–1113, below the 1000-px viewport (`elementFromPoint` null); at +250 ms y 36–48; from +500 ms y 30 and the button topmost — **identically on both trees**: the raised card is still sliding when the test hit-tests (block 2) or taps (block 3) | RIG / TEST — the base's (N2) |
| 7 | **the boot suite ALONE** (`tests/legacy/boot.browser-test.mjs`, whole, 152 laws; marionette held — no chunk runner needed) | run 1 **150/152** (B69, B149); re-run alone **150/152** (B6, B149). Every run GREEN: B108 · B112 · B136 (the three source laws re-pointed through `appFiles()`, now reading 22 files), B98 · B99 · B128 (the links), B104, B9 ×3, B60, B65. Then B6 and B69 again, interleaved tip / base, by the chunk runner (the suite's header + preamble + every block up to the law): **B6 red 3 of 15 tip readings, 1 of 14 base** — the same reading both ways, the badge has not yet said `RENDERED 1/2` (`"STATE · EVOLUTION · SHADOW \| FIELD 64³ · ±16 a₀ · f16 \|  \|  \| "`); **B69 red 1 of 4 tip, 0 of 3 base**, `togFollowed` 310 in every chunk run | the base export's own suite file: **151/152 (B149)** | GREEN — **B149 the only LAW red**; B6 / B69 the base's flakes (R0 read B6 red on the base 3 of 5, B69 1 of 3) |
| 7 | the FILM witnesses | `node tests/render-exact.test.mjs` **0 failing of 40**; `film-probe` tip + base → `film-compare`: the picture **97,824 B, hash `87a1be2d`, pixels `b111224e` on both**; EXPORT FRAMES 25 × 1400 × 814, 3,248,646 B, **every pixel hash and time equal**; ONE PERIOD 180 frames, **digests and times equal, MP4 953,793 B byte-identical**; RECORD 180 frames, **equal, MP4 743,644 B byte-identical**; `verify` DETERMINISTIC, the same six digests on both; `film-handover` 4/4; `take-in-bugs` 4/4 | the base's own run is the comparand | GREEN |
| 7 | the other probes | `tools/camera-routes.mjs` **5/5**, `--against` the base's reading **SAME ×5** (routes, bases, law byte-identical); `tools/hit-probe-set.mjs` **71 pressed through a kit window's gap, 0 reached the stage** (control 3/3); `node tools/new-project.mjs --check` in step (16,117 B) | — | GREEN |
| 8 | **G-L lines** | `cat lab/*.js lab/shell/*.js lab/windows/*.js \| wc -l` = **27,943 = the cut cap exactly (0 to spare; 0 over)**; never above 27,943 at any merge (the merge cap 28,219) — the ledger §3 | 27,666 at `v0.5.1-alpha` | GREEN |
| 9 | **the free names** · r3a's `freenames.mjs` over all 22 files vs `v0.5.1-alpha`'s `rack.js` (`.tmp/freenames.mjs`) | **no lost import or binding**: rack.js and 16 module files none; 49 names flagged in facade (39), history (3), notebook (2), material (2), rack-wiring, film, state (1 each) — every one read by hand: a getter / method key (`get theme()`, `save()`, `order()`, `get busy()` …) or the alias side of `PRESET_BY_ID as PALETTE_BY_ID` | — | GREEN |
| 10 | **U9 the cold load** · `.tmp/coldload.mjs` (headless Chromium on the RTX 3070, a fresh profile a run, a warm-up navigation, then the HTTP cache cleared AND disabled, `?sw=0`; `readyMs` = `performance.now()` when `__LW.ready` first reads true, a 5 ms in-page poll), 5 + 5 interleaved | base **929 ms** (909–937) · tip **961 ms** (954–968): **+32 ms (+3.4 %)**, the tip slower in 5 of 5 rounds; DOMContentLoaded 599 → 641 ms; `field ok` every run | — | NOTE (no gate; §2 N5) |
| 11 | the documents against the tree | §5: CLAUDE.md 17 pointers (8 STALE, 1 NOTE, 8 FRESH — `:6` and `:249` fixed at `b00e613`; its third fix, `:260`, is N4) + 3 sentences the build outdated, NOTES-FOR-AGENTS 8 (6 STALE — `:136` older than 0.5.2 —, 2 FRESH), STATE-SCOPES 4 (3 STALE, 1 FRESH) | — | NOTES |
| 12 | "What Josh will see: nothing" — re-proven | §6 | — | GREEN |

## 2 · The defect list (for the fix round)

No BLOCKING defect: no byte, no digest, no facade member and no law that was green at 0.5.1 is red on the tip and green on the base. Every item
below is a NOTE.

| # | file · line | law | the tip's reading · the base's / the truth | severity | fix proposal (one line) |
|---|---|---|---|---|---|
| N1 | `sos-s0/.tmp/cut-0.5.2.sh:9` and `:11` (the integrator's drafted cut, outside the tree) with `lab/rack.js:43` | the version line is THE ONLY PLACE THE NUMBER LIVES (ANTI-PATTERN 6) | R3b made it `export const BUILD_LINE = '0.5.1-alpha · …'`; the script's `sed -i "s/^const BUILD_LINE = …/"` is anchored at `^const`, so it matches nothing and `sed` exits 0; `:11`'s `grep -n "^const BUILD_LINE"` prints nothing and, in a pipeline, does not trip `set -e`. The cut would commit only README's status and tag `v0.5.2-alpha` on a tree whose ABOUT face, `LW.build`, the copy dump and every export's metadata say **0.5.1-alpha** (`research/release-0.4.0/HANDOFF.md:901`'s recipe has the same anchor) | NOTE — **cut-blocking**: fix before the script runs | `sed -i "s/^export const BUILD_LINE = '[^']*'/export const BUILD_LINE = '0.5.2-alpha · Rack Dissolution · $(date +%Y-%m-%d)'/"`, then `grep -q "^export const BUILD_LINE = '0.5.2-alpha" lab/rack.js \|\| exit 1` (and the same anchor in HANDOFF §3's recipe) |
| N2 | `tests/latex-copy.browser-test.mjs:50–55` and `:61` (unchanged since 0.5.1) | SPECTRUM's ⧉ is the topmost thing at its own centre after WAVE DANCER opens, and a real tap on it copies | tip RED ×2 at `:55` (`hit: false`); base RED ×1 at `:67` (the tap copied nothing). Both trees: the test reads the ⧉ at once after `raise('spectrum')` + `settle()`, while the raised card is still sliding up from y ≈ 1100 to y 30 (it arrives between +250 and +500 ms) — a test race, red at block 2 or block 3 depending on the moment; R0 read it red on the base, R1 green | NOTE (the base's; a `tests/` fix) | before block 2's hit-test and before block 3's tap, wait until the ⧉'s rect reads the same twice 100 ms apart (or ~600 ms after `raise`) |
| N3 | `CLAUDE.md:348` → `research/release-0.5.2/r3a-measure/freenames.mjs:5, :22, :24` | "a move checks each file's free names against the base (`…/r3a-measure/freenames.mjs`)" | the tool as committed cannot run from where it sits: `import … from '../tools/rack-deps.mjs'` resolves to `research/release-0.5.2/tools/` (ERR_MODULE_NOT_FOUND, read today); its base is hard-wired to `ff2b3e6` and its file list to R3a's five. R-V ran a copy from `.tmp/` over all 22 files | NOTE | the candidate below: `tools/freenames.mjs [--base <ref>]` over `appFiles()`, and point CLAUDE.md at it |
| N4 | `CLAUDE.md:260` | "The 36 `!important`s stay unlayered (25 in skin.css, 11 in lab.css …)" | `grep -c` reads 20 + 10 = 30 LINES; `grep -o` 25 + 11 = 36 OCCURRENCES — of which **4 sit in comments** (skin.css `:40`, `:239`'s trailing note; lab.css `:15`, `:247`); the declarations are **32** (23 + 9) — the "32" the line said before `b00e613` was the true count of declarations (`.tmp/important.mjs`; the CSS is unchanged since 0.5.1) | NOTE | "The 32 `!important` declarations stay unlayered (23 in skin.css, 9 in lab.css; `grep -o` reads 36 — four more sit in comments; …)" |
| N5 | `lab/rack.js` → 21 statically imported modules (U9) | the cold load | `readyMs` 929 → 961 ms (+32, +3.4 %), DCL 599 → 641 on a cold loopback HTTP/1.1 load: one more import level and 21 more requests before `boot()` can run. The installed app is cache-first (`lab/sw.js` precaches all 21, `pwa.test` green), so only a first visit pays. PLAN §6.9 predicted the shape ("≈ 18 static modules at depth 2"); no gate was set | NOTE | none needed for the cut; if wanted later, `<link rel="modulepreload">` for `shell/*` and `windows/*` in `index.html` |
| N6 | `CLAUDE.md` 8 pointers + 3 sentences, `docs/NOTES-FOR-AGENTS.md` 6, `docs/STATE-SCOPES.md` 3 | the documents point at the code | §5 — each with its proposed text | NOTE | the integrator applies §5 |
| N7 | `lab/settings-store.js:15–17, :20, :26` (FAMILIES' descriptions); `lab/worker-pool.js:6–7, :26`; `lab/shell/persist.js:3` | comments name where a thing lives | FAMILIES says `rack.js NB_KEY / NB_TITLE / NB_SUBTITLE` (now `lab/shell/notebook.js:130`), `rack.js LS_EXP / LS_PRES` (`lab/shell/persist.js:10`), `rack.js modStore` / `curvesStore` (`lab/shell/controller.js:195, :197`); worker-pool.js says the `new Worker(…'./mathworker.js'…)` literal "stays literal in rack.js" (R1 moved it to `shell/controller.js` as `'../mathworker.js'`); persist.js' header says "boot() fills each slot after its declaration" (owners register them now) | NOTE (strings and comments; no behaviour; `settings-probe` reads only the scope column) | re-word when those files are next opened (a lab edit: `pwa --write`) |

## 3 · G-L the ledger, re-measured from git at every lab-touching first-parent commit (`.tmp/ledger.mjs`, `wc -l` = newlines)

| commit | row | `lab/*.js` + shell + windows | Δ | `rack.js` | `sw.js` | module files · lines |
|---|---|---|---|---|---|---|
| `v0.5.1-alpha` | the base | **27,666** | — | 4,931 | 572 | 0 |
| `86968b7` | R0 THE CONTEXT | 27,693 | +27 | 4,958 | 572 | 0 |
| `bad8642` | R1 THE CONTROLLER | 27,739 | +46 | 4,664 | 573 | 1 · 339 |
| `ff2b3e6` | the `app.ctl` fill | 27,754 | +15 | 4,664 | 573 | 1 · 354 |
| `ee92ddc` | R2a | 27,799 | +45 | 4,261 | 575 | 3 · 800 |
| `5448493` | R3a | 27,858 | +59 | 3,607 | 579 | 7 · 1,509 |
| `e467ab1` · `87aad5e` | the two dedups | 27,856 | −2 | 3,605 | 579 | 7 · 1,509 |
| `ca5b991` | R3b | 27,873 | +17 | 2,448 | 583 | 11 · 2,679 |
| `03200df` | R2b (+ the integrator's 4 dead import lines out) | 27,893 | +20 | 2,001 | 585 | 13 · 3,144 |
| `8ca115a` | R2c | 27,902 | +9 | 1,681 | 588 | 16 · 3,470 |
| `7c3eebe` | R2d (+ R2c's `go` copy out) | 27,932 | +30 | 1,202 | 592 | 20 · 3,975 |
| `855ab99` = `fd1b415` | R5 THE FACADE | **27,943** | +11 | **943** | 593 | **21 · 4,244** |

**IN: the 21 module files 4,244 lines and 21 `sw.js` precache rows; OUT: `rack.js` −3,988 → +277 net = 27,943 = 27,666 × 1.01 (rounded down) exactly;
0 lines to spare and none over.** The merge cap (28,219, +2 %) was never approached (the high-water mark is the cut itself). What the 277 are: the
modules' shape (headers, imports, signatures, hand-overs, returns, braces: R0's literal 37, R1 36, R2a 33, R3a 44, R3b 47 + 2, R2b 32, R2c 28, R2d 35,
R5 16), the seats, the registration/fill lines and the precache rows, less the OUTs found on the way (R0's dead wrapper and dead reads, R2d's repeated `stageText` seat, the import
lines, the blank lines R3b (36), R2c (21), R2b and R2d dropped, R2c's 3 inits, the 3 fill lines R5 sent home). The line law holds without a ruling.

**Room, if Josh wants it rather than a raised cap** (R5's candidate 2, confirmed): 19 double blank lines (`.tmp/blanks.mjs`) — `rack.js:56, 64, 333,
792, 900, 923`, `shell/controller.js:65, 69, 152, 193, 204`, `shell/history.js:116`, `shell/settings.js:69, 123, 130`, `windows/spectrum.js:151`,
`windows/state.js:27, 34, 121`.

## 4 · The candidates, each confirmed or dismissed with a reading

| candidate | reading | verdict |
|---|---|---|
| **B69 / B6 re-aim** | §1 G-S: B6 red 3 of 15 tip readings and 1 of 14 base, the same reading (`#badges` has not yet said `RENDERED 1/2` 200 ms after the mute: the tags tick at most every 100 ms and only on a CPU-tick frame, `rack.js:561` = base `:944`, the same line but for `app.state.`, and a paused lab draws none); B69 red 1 of 4 tip, 0 of 3 base (R0: 1 of 3 each), its chunk runs reading `togFollowed` 310 | CONFIRMED — R0's re-aim stands: B6 polls the badge for `RENDERED 1/2` with a bounded wait (or forces one frame) instead of one read at 200 ms; B69 reads `togFollowed` after the slide's `transitionend` |
| **`latex-copy`** | N2: red on both trees, cause measured (the raised SPECTRUM card is still sliding when it is hit-tested and tapped) | CONFIRMED (the base's; a `tests/` fix, N2) |
| **the TIER cycle (a `lab/tier.js`?)** | 16 modules import `TIER` (2 also `BUILD_LINE`) from `'../rack.js'`; none reads either at its top level (each file is imports + one `export function`), so the cycle is safe by construction, and `wiring.test` walks it in the node gate. A `lab/tier.js` (`TIER` + `TIER_NAME`; `rack.js` re-exporting it) would end the `TIER` half; `BUILD_LINE` should stay in `rack.js` (THE ONLY PLACE THE NUMBER LIVES; the cut's `sed` and `main-thread.mjs`' regex read it there) | CONFIRMED as a candidate, not a defect — a later row's (one new file, 16 import lines touched, +1 line under a cap with 0 left) |
| **`main-thread.mjs` reads `rack.js`' sha alone** | `served()` (`tools/perf/main-thread.mjs:53–54`) fetches `/lab/rack.js` only; two trees that differ only in a module under `shell/` or `windows/` print the same `rackSha256`. Today's 20 runs printed `5ed392623650fa65` (base) and `901094fa08a11b86` (tip), each equal to `sha256sum` — R1's chunk-split case did not recur, but the hash still decodes chunk by chunk (`t += c`) | CONFIRMED (a `tools/` fix: hash `appFiles()` concatenated, `Buffer.concat` first) |
| **`markBatchBegin` and `solveCard` destructured at the controller's seat, read by no boot code** | `grep` in `rack.js`: each appears only in the `ctl` literal (`:135–137`) and the seat's destructure (`:150–151`). They are two of the 73 the tool calls "never referenced" | CONFIRMED — fold into the 73 (below), which needs the tool clause first |
| **the returns of settings.js / spectrum.js / state.js filled in `boot()` on their seat lines** | settings.js and spectrum.js: DONE by R5 (they register their own now; no such fill left). Still on seat lines in `rack.js`: `app.w.clearRegister` (STATE, `:665`), `app.sh.modSeats` (persist, `:811`), `app.sh.historyApi` (history, `:815`) — the same pattern, three statements, 0 lines | CONFIRMED for state.js (+ persist.js and history.js, the same kind) — the registration moves home when those files are next opened (±0 lines) |
| **a `tools/` free-name check seeded from `r3a-measure/freenames.mjs`** | the committed seed cannot run from its folder (N3); a copy run from `.tmp/` over all 22 files against `v0.5.1-alpha` found no lost binding and 49 object/getter keys a heuristic must learn to skip (`get x()`, method shorthand `x() {`) | CONFIRMED |
| **`r2b-measure/rigfree.mjs` → `tools/perf/wait-gpu.mjs`** | `wait-gpu.mjs:7–8` counts every `ps -eo args` line matching `/marionette/` — a shell poll that names the word counts as a browser; `rigfree.mjs` reads `/proc/<pid>/cmdline` by argv0. R-V used `rigfree` before 60+ browser runs with no false busy | CONFIRMED (a `tools/` fix: wait-gpu reads argv0 as rigfree does, or rigfree moves to `tools/perf/`) |
| **`menubar :143` masks the session key** | `menubar` 8 PASS on the tip today (the session flush did not land inside the quick-save row); `:143` still asserts `file.changed` deep-equals exactly the two quick-save keys, so a 300 ms session flush that lands inside the row reds it (R3b saw it on both trees) | CONFIRMED as a latent flake (a `tests/` change: drop `lambdawaves.q0.session` from `changed` before the assert) |
| **persist destructures its 9 controller names (23 → 13)** | persist reads `app.ctl.{applyAccent, domain ×7, markBatchBegin, markBatchEnd, modGets ×2, modSyncBases, rotRate ×2, setReference, setRotationRate}` and `app.w.spectrum ×8` at use = 10 forward; seated after the controller and SPECTRUM, all ten are consts by then, so a destructure counts them backward: 23 → 13 (today the hinge's second-highest row after SPECTRUM's 24) | CONFIRMED (±0 lines if folded onto the hand-over lines) |
| **the line-law overrun and its exact figure** | **none: 27,943 of 27,943, 0 over** (§3). R2d's "the cap WILL be passed" did not come true — R5 paid its +14 with three fill lines sent home | DISMISSED — no ruling needed |
| **R5 §9.1: 58 dead names in boot's seat destructures** | `node tools/rack-deps.mjs --no-write`: "boot-level names … never referenced **73**" = R5's 58 + the base's 15 (`setKnob, modStore, saveMod, occlusion, applyAccent, markBatchBegin, cardLoading, solveChem, solveCard, wState, normalizeNow, applySturmian, keyState, save, copyJSON`). Trimming them is −4 lines but the tool knows a crossing name only by `boot()`'s declaration, so the table would lose 73 names (R5 §2's reverted trial) | CONFIRMED — the tool clause first (know a handed name by the slot a module registers), then the trim |
| **R5 §9.2: 14 double blank lines** | 19 in all: the 14 R5 names in files a row may edit + 5 in `controller.js` (§3) | CONFIRMED (−19 lines available) |
| **R5 §9.3: 32 unread `app` literal slots** | `.tmp/deadslots.mjs`: exactly 32 slots are **never filled AND never read** (null forever): `host.warning`; `w.wObs, wPal, wCam, wClip, paintSturmRo, initStageText, meters, wWig, wRad, WIG_OK, RAD_OK, gasReadout`; `ctl.controlStep, RES_LADDER, frameBudget, perfBudgetMs, tick, READERS, may, unpark, cRe, cIm, feedAudio, cancelWarm`; `sh.powered, refreshOcclusion, rackCardWidth, popFace, wTr, syncPhone, keyHelp`. They cost no line; every namespace stays < 128 keys and FAST (U5) | CONFIRMED, harmless — keep as the loop's reserve or drop in the release that moves the loop |
| **R5 §9.4: `LW.warning` null before `go`** | the getter now reads `app.hooks.warning` (`facade.js:187`), null until `rack.js:905`; the base's read `boot()`'s `const warning` (a TDZ throw before its line). But `window.__LW` is assigned at `rack.js:819` and there is **no `await` between `:819` and `:905`** and no boot code there reads `LW.warning`, so no other task can observe the window | DISMISSED — unobservable |

## 5 · The documents against the tree (every `rack.js` pointer; proposed text — NOT applied)

Read at `fd1b415` with `grep -n "rack\.js"` and a grep of each named identifier across `lab/rack.js`, `lab/shell/*.js`, `lab/windows/*.js`. FRESH = still
in `rack.js` where the line says; STALE = it moved (the module named); PRE = stale before 0.5.2. The stale lines PLAN §0 named: `lab/modwindow.js` (fixed
at `b00e613`: CLAUDE.md:6 now names the seam's two files; `:250`'s "`lab/modwindow.js` and `lab/audio.js` are gone" is a true historical sentence);
the `!important` count (N4); "1004 + 1148" survives nowhere (`grep` over CLAUDE.md, `docs/`, README, RELEASING: none).

### CLAUDE.md (13 lines name `rack.js`; 17 pointers with the `b00e613` three)

| line | the pointer | where it is now | verdict | proposed text (the changed span) |
|---|---|---|---|---|
| :6 | "adapt λWAVES' side of the seam (`lab/mod-port.js`, `lab/shell/modulation.js`)" | `createModSeam` (`shell/modulation.js`); the port `lab/mod-port.js` | FRESH (`b00e613`) | — |
| :89 | "`createInfoLayer` in `rack.js` `initStageText`" | `lab/shell/stage-words.js:52–54` | STALE | "`createInfoLayer` in `lab/shell/stage-words.js` `initStageText`" |
| :128 | "built in `lab/rack.js` `refreshOcclusion()`" | `lab/shell/ink.js:7` (`createInk` returns it to the loop) | STALE | "built in `lab/shell/ink.js` `refreshOcclusion()` (`createInk` hands it to the loop)" |
| :148 | "The ACTIONS rows in `lab/rack.js`" | `lab/shell/keys.js:41` | STALE | "The ACTIONS rows in `lab/shell/keys.js`" |
| :161 | "`LOOK_DEFAULTS`, `lab/rack.js`" | `rack.js:104` (the head) | FRESH | — |
| :162 | "rack.js' own `isPhone()`/`isTablet()`" | `rack.js:82, :86` | FRESH | — |
| :179 | "`rack.js` `untouched`" | `rack.js:767` | FRESH | — |
| :227 | "(`rack.js`, grep `createCameraPanel`)" | `lab/windows/material.js:118` | STALE | "(`lab/windows/material.js`, grep `createCameraPanel`)" |
| :228 | "the saved `observer.*` routes stay `rack.js`' definitions" | the ONE `defs` table, `lab/shell/modulation.js:33–44` (`camKnobs` filled at `material.js:122`) | STALE | "stay the ONE `defs` table's (`lab/shell/modulation.js`)" |
| :236 | "UI space from `uiSpace` in `rack.js`" | `lab/shell/rack-wiring.js:5, :304` (`wireStage`) | STALE | "UI space from `uiSpace` in `lab/shell/rack-wiring.js` (`wireStage`)" |
| :249 | "`lab/shell/controller.js` `modStore`/`saveMod`" | `controller.js:195` | FRESH (`b00e613`) | — |
| :260 | the `!important` count | N4 | NOTE | N4's text |
| :271 | "through the seam in `rack.js`" (`installTimeline`) | `lab/shell/keys.js:155` | STALE | "through the seam in `lab/shell/keys.js`" |
| :294 | "THE CURVES CARD (… `lab/rack.js` after the RENDER registration)" | `rack.js:831–833`, after RENDER's `rk.register` at `:825` | FRESH | — |
| :304 | "the last statement of its head, `lab/rack.js`, grep `const app = {`" | `rack.js:112` (`readSettings`' one hoisted line follows it) | FRESH | — |
| :313 | `appFiles()`: "rack.js, then every module …" | `tests/helpers/app-source.mjs` | FRESH | — |
| :367 | "`rack.js` stands at 2,001 lines with PAIR 2 in; thirteen module files are measured." | 943; 21 | STALE (a dated count) | "`rack.js` stood at 2,001 lines with PAIR 2 in (943 at the cut; 21 module files measured)." |

Three more CLAUDE.md sentences the build itself outdated (not `rack.js` pointers):
- **:348** names `research/release-0.5.2/r3a-measure/freenames.mjs` as the check to run — it cannot run from there (N3). Proposed: "… against the base
  (a copy of `research/release-0.5.2/r3a-measure/freenames.mjs` run from `.tmp/`, its base and file list set by hand — a `tools/` version is a candidate)".
- **:358–359** "A name a moved module returns that a later module reads is filled in `boot()` on the returning seat's line until that module's file is next
  opened … (`app.sh.saveSettings` … on §1's seat; `app.w.toggleFullscreen` … after SPECTRUM's)" — R5 sent both examples home. Proposed examples:
  "(`app.w.clearRegister` on STATE's seat, `app.sh.modSeats` on persist's, `app.sh.historyApi` on the history's; R5 moved settings.js', spectrum.js'
  and kepler.js' home)".
- **:333** and **:345** describe fills "in `boot()` right after its owner's declaration (`app.w.gas`, `app.sh.layout` …)" / "(11 lines, 30 slots, each
  moving with its owner's row)" — true when written; every such slot is now its owner module's registration (`gas` kepler.js `:282`, `layout`
  rack-wiring.js). Proposed for :333: "read through its slot inside a callback (`app.w.gas`, `app.sh.layout` …, registered by the module that makes
  it, or filled in `boot()` right after the declaration of a name `boot()` keeps — `app.host.camera`, `app.loop.page`)".

### docs/NOTES-FOR-AGENTS.md (8 pointers)

| line | the pointer | where it is now | verdict | proposed text |
|---|---|---|---|---|
| :48 | "`lab/rack.js` (`ui.gridSeg`)" | `lab/windows/settings-card.js:151` (FIELD QUALITY, `createFieldQuality`) | STALE | "`lab/windows/settings-card.js` (`ui.gridSeg`)" |
| :52 | "`lab/rack.js` (the AUTO SCALE comment above `autoScaleStep`)" | `lab/shell/controller.js:31–49` (ONE CONTROLLER's comment above `controlStep`); `autoScaleStep` left at W128 (`bace801`) | STALE + PRE | "`lab/shell/controller.js` (the ONE CONTROLLER comment above `controlStep`)" |
| :61 | "`lab/rack.js` (`isTablet`, `isPhone`)" | `rack.js:82, :86` | FRESH | — |
| :65 | "`lab/rack.js` (`syncPhone`, `enterPhone`)" | `lab/shell/rack-wiring.js:204, :278` | STALE | "`lab/shell/rack-wiring.js` (`syncPhone`, `enterPhone`)" |
| :122 | "`lab/rack.js` (`const LW = {`)" | `lab/shell/facade.js` (`createFacade`'s `return {`); `rack.js:818` `const LW = createFacade(app)` | STALE | "`lab/shell/facade.js` (`createFacade`; `rack.js` adds the late members at their seats)" |
| :126 | "`lab/rack.js` (`layout.copyText`, `copyLatex`)" | `lab/shell/rack-wiring.js:193` (`layout.copyText`), `lab/windows/spectrum.js:118` (`copyLatex`) | STALE | "`lab/shell/rack-wiring.js` (`layout.copyText`), `lab/windows/spectrum.js` (`copyLatex`)" |
| :136 | "`lab/rack.js` (the settings and projects keys in `localStorage`)" | `lab/settings-store.js` (`SETTINGS_KEY`, the FAMILIES table), `lab/project-store.js` (`PJ_KEY`) | PRE (0.5.0 A1 / C6) | "`lab/settings-store.js` (`SETTINGS_KEY` and the FAMILIES table of every other key)" |
| :139 | "`rack.js` `untouched`" | `rack.js:767` | FRESH | — |

### docs/STATE-SCOPES.md (4 pointers)

| line | the pointer | where it is now | verdict | proposed text |
|---|---|---|---|---|
| :7 | "Stage S1 put it into `serialize()`, `restore()`, `saveSettings()` and `applySettings()` in `lab/rack.js`." | `lab/shell/persist.js:37, :138`; `lab/shell/settings.js:10, :82` | STALE (true of S1; the reader goes there for the code) | append: "(since 0.5.2: `serialize()` / `restore()` in `lab/shell/persist.js`, `saveSettings()` / `applySettings()` in `lab/shell/settings.js`)" |
| :41 | "(`rack.js` `modStore`, MIR's `bind.js` `localStore` …)" | `lab/shell/controller.js:195` | STALE (CLAUDE.md:249's twin, missed at `b00e613`) | "(`lab/shell/controller.js` `modStore`, …)" |
| :43 | "(`rack.js` `curvesStore`)" | `lab/shell/controller.js:197` | STALE | "(`lab/shell/controller.js` `curvesStore`)" |
| :72 | "`FIELD_CHROME` in `lab/rack.js`" | `rack.js:59` (the head) | FRESH | — |

## 6 · "What Josh will see: nothing" — re-proven on the healthy rig, not re-stated

- **The pixels:** THE LOCK 860 and 1004 values, 0 readback and 0 record-byte differences, each on its first run. The film: the picture, 25 exported
  frames, ONE PERIOD's 180 and RECORD's 180 frames — digests, times and both MP4s byte-identical to the base export's run beside it.
- **The work (5):** `serialize-bytes` 11/11 full and 11/11 edit sha-identical to the base export — a project, a link and an undo row are the same bytes.
  The full bytes carry the WORKSPACE layout, so they are also the DOM order's witness.
- **The DOM order and the look (new, `.tmp/domorder.mjs`, a driven boot on each tree):** 4,139 elements in the same order with the same tag, id, class,
  `data-id`, `data-key-action` and `hidden` — the one difference is the kit FOLDERS datalist's random id (`sv-folders-<random>`, new on every load); the
  23 cards in the same order (`transport shadow spectrum chem orbitals render curves orbit vortex slice calculus meters ladder atoms wigner radiation history
  settings state palette observer camera clip`) with the same rect, background, colour, border, backdrop-filter, opacity and display; `body`'s dataset and
  class, the 253 root custom properties and the 6 `localStorage` keys identical. And `settings-probe`'s six scenes: B1, B2 and B3 byte-identical tip vs base.
- **The facade (6):** `lw-facade` 1/1 without `--write` — 176 members, names, kinds and order.
- **The keys:** `keyboard-shortcuts` (node) PASS; `keyboard-window` 8/8 (block 8's reload held). **The menus:** `menubar` 8/8. **The timeline:**
  `timeline` 14/14 (one period filmed, MP4 bytes equal to the facade's). **The first run:** `first-run` (node) PASS; `opener` 7/7;
  `official-defaults-palette` 3/3; `new-project` 8/8 and `--check` in step.
- **The main thread:** inside the floor in both scenes (Δ +0.648 / +0.435 against a floor of +0.390 / +0.441 and spreads of 1.0–1.9 ms/s).
- **The code (independent of the builders' scripts, `.tmp/verbatim2.mjs`):** of `v0.5.1-alpha` `rack.js`' 4,766 non-blank lines, **4,628 appear in the tip's
  app source** once a slot read is spelled bare (`app.state.x` / `app.w.x` … → `x`, `app.hooks.` → `__LW_hooks.`) and indentation is ignored; the 138
  others are 71 import lines and 67 the plan's own edits (the shared-`let` declarations become `app.state` seats, the dead `windowActivity` wrapper,
  the first `frost`, `ui.camSeg`'s and `themeChanged`'s dead reads, the 1100 block's braces, the worker URL `'../mathworker.js'`, `const LW = {`,
  `BUILD_LINE`'s `export`, fill lines appended to their owners' lines). The facade literal against R5's base (`7c3eebe`): 249 of the 250 lines inside
  the braces identical, the 250th `get warning()`.

## 7 · The harness, closed

Both servers stopped by pid (126731 the tip on 9133, 126827 the base on 9137); no browser, geckodriver or script of mine left running; the integrator's
8731 / 8735 never touched. `node tools/rack-deps.mjs` was run only with `--classes --no-write` / `--no-write` (RACK-DEPS.md and rack-deps.json untouched);
nothing under `lab/`, `tests/`, `tools/`, `docs/` or `CLAUDE.md` edited. This file and REPORT.md's wave 224 are the one commit.

**FIT WITH NOTES** — every gate green or base-identical on the healthy rig and no BLOCKING defect; fix N1 (the cut script's `BUILD_LINE` anchor) before
the cut, and take N2–N7 and the confirmed candidates into the fix round.
