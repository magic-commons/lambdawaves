# P-V-REPORT · THE VERIFICATION ROUND (0.5.4 "Contract Layer"; a fresh Opus verifier: read, measured, judged; nothing fixed)

Worktree `.claude/worktrees/agent-a2da9184140121618`, branch `worktree-agent-a2da9184140121618`, `git reset --hard 59fe469` (the `sos-s0` integration tip:
`59fe469 merge P4c (cc2d68c): the export caption carries the STATE word …`). The brief is `BRIEF-P-V.md` (re-aimed `c610541`), plus the launch's facts: the
rulings PLAN §J-2 + its addendum and §J-3; P5 and P13 did NOT land; the line cap 28,298.

**Servers (mine, stopped by pid):** 9063 / GD 5533 the tip (pid 2236761); 9065 / GD 5535 the base, `git archive 59f1fba` (the tag object of `v0.5.3-alpha`,
commit `aa83042`) in `.tmp/base-053` (pid 2236763). `research/release-0.5.2/r2b-measure/rigfree.mjs` ran before every browser run, one browser at a time.
The window: 2026-10-11, 18:27–20:15 CDT; the first browser run 18:33, the last 20:08 — about 95 min of rig time. The rig was healthy (RTX 3070, Firefox 157
headless; load 0.9–4.2 — the only loads ≥ 4 were my own `orbital-library --check`, which ran 18:31–18:50 and held two browser runs back by rigfree; the pair
ran after it, load 1.3–3.3). Scripts and readings are git-ignored under `.tmp/pv/` (scripts in `.tmp/pv/scripts/`).

**THE VERDICT: FIT TO CUT: YES.** There is no BLOCKING item. THE LOCK is 860 · 0/0 and 1004 · 0/0; the bytes are 11/11 full and 11/11 edit against
the base; the facade is the fixture's 176 members; no stamp line of code moved; STATUS is called 0 times in 3 s of play and once per VIEW change; the
ms/s pair is +0.549 (boot) and +0.776 (MOLECULES) against a 3.536 gate; the lines are 28,101 of 28,298. Every browser red is red on the base too:
`current:138`, `gpu-recovery`, `latex-copy` §2 and the boot suite's B149 and B69 flake (B69 reds 2 of 3 tip readings and 1 of 2 base readings). There are ten NOTES for
the fix round and for Josh. The one with a plan sentence behind it is **N4**: water in 6-31+G\* reads UNCHECKED. The plan's rows scoped "never UNCHECKED" to
STO-3G, but §B says it without a basis. The rest are document lines (§5), pre-existing test flakes, the B₁₂H₁₂²⁻ record's re-cut and THE HEAD's height
on a phone. 4(g) is skipped because P5 did not land.

## 1 · The gates (BRIEF-P-V's order): reading · the base beside any red · verdict

| # | gate | the tip `59fe469` | the base `v0.5.3-alpha`, beside a red | verdict |
|---|---|---|---|---|
| 1 | **G-N** `bash test.sh node` | **exit 0** (18:28–18:30), 1,034 PASS/GREEN lines, no FAIL/RED; the tree stayed clean | — | GREEN |
| 1 | the new suites, each run alone to name it (`.tmp/pv/node-*.log`) | **`worker-pool` 15/15** (the five cases + `cards`); **`clock` 8/8**; **`clock-phase` 2/2** (worst 1.86e-16 to t = 2.72e48 rad; gate 1e-13); **`qband` 2/2**; **`flow-numbers` 2/2**; **`status` GREEN** (456 strings ≤ 110 chars, longest 90); **`molecule-state` 9/9** (identity, the moved-H witness, `E_IDENTITY`, `CONVENTIONS`); **`library` GREEN** (§8: a case per rule, 2 / 26 / 9 / 1, water in `oracles`); **`molecule-head` GREEN** (the fifth group); `density` 5/5 and `molecular-flow` 5/5 (P1's two equality cases); P4's table test is `status` | — | GREEN |
| 1 | `node tools/new-project.mjs --check` (NOT regenerated) | **in step, 16117 B** | — | GREEN |
| 2 | **THE LOCK** `--check --query gastab=0` | **860 · 0 readback · 0 record-byte**, unrepeatable none, page errors 0, 61 s | — | GREEN |
| 2 | same `--fixture research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0` | **1004 · 0 · 0**, page errors 0, 61 s | — | GREEN |
| 2 | camera lock ON? `git diff v0.5.3-alpha..HEAD -- lab/camera-law.js` | **empty** (content, N7's lesson) → not re-run. `lab/field.js` moved by comment lines only (P0's header line; PAIR B2's ≈ 1e-3 sentences) — no WGSL | — | — |
| 3 | **G-B** `serialize-bytes --out` tip vs base, `integrator/sb-compare.mjs` | **full 11/11 · edit 11/11 IDENTICAL**; 0 page errors on either tree. No stored key, no WORKSPACE row | — | GREEN |
| 3 | `tools/settings-probe.mjs --out` | run 1: N₂ "Render did not settle: animation frames stopped", 1 of 6 (the load was 4.1 — my `--check` running). **Re-run alone: 0 of 6**, every reload byte-identical (boot blob 785 B) | base, run once for the blob compare: **the same N₂ stall**, 1 of 6 (load 2.3); the four reached scenes' B1 / B2 / B3 blobs (boot 785, WAVE DANCER 821/812, WATER 805, BENZENE 805 B) **byte-identical to the tip's** | GREEN (the stall is on both trees, as at 0.5.3; no new settings key) |
| 3 | **G-W** `lw-facade` WITHOUT `--write` | **1/1: 176 members** (56 value · 48 get · 72 method). `capability` appears nowhere in `lw-facade.json`; `lab/shell/facade.js` and the fixture are unchanged since the base (`git diff --stat` empty) — `capability()` is a member of `__LW.chem`, not of the facade | — | GREEN |
| 4a | `identityOf` | the moved-H witness (`molecule-state` §7a): hydrogen 1 moved 0.01 bohr keeps the basis hash `d6aadbf2ff71…` and moves the identity `de7feb25e072…` → `b5ef314129bb…`; charge, multiplicity, model, basis each move it; 38/38 record atoms agree. **The stamp files**, `git diff v0.5.3-alpha..HEAD -- lab/molecular-session.js lab/mathworker.js lab/statesview.js`: only `molecular-session.js`, and only its HEADER COMMENT (P0: the RULES list's four ranks to match `MODEL_RANK`, and THE STAMP sentence "basis hash … geometry rides the sequence"); `mathworker.js` and `statesview.js` 0 bytes; **no stamp line of code** | — | GREEN |
| 4b | the catalogue | `node tools/orbital-library.mjs --check` **in step: 38 records, 11,532,459 B, nothing else in `lab/library/`; the gate passes every entry** (18.5 min, every record re-solved; worst oracle Δ 6.9e-9, Cr(CO)₆). Counts **2 / 26 / 9 / 1** (experimental C6H6 + TiCl4; draft C60); `oracles` 53 live-only molecules, **H2O present** (−74.96302316286221 Eh); energy MEASURED 37 · IMPORTED 1 (C60); derivatives UNKNOWN on all 38; **`CERTIFIED` 0** in `lab/library.json` and in `lab/library/`; **precache 6.81 MiB** ≤ 8 MiB (pwa, 370 files) | — | GREEN (one record's hash moved: N3) |
| 4c | `statusOf` | the table test (above). **Water never UNCHECKED** on STO-3G: the row, the head, `capability()` and the Worker-less road all read NUMERICAL; **in 6-31+G\* water reads UNCHECKED** (`.tmp/pv/scripts/water631.mjs`: `DENSITY · UNCHECKED · picture good to 0.2 % of ρmax`, head `UNCHECKED`, its solve −76.01744137674822 Eh, 1.3e-13 from the fixture's) though `tests/fixtures/oracles/6-31+g-star-v1.json` holds water's energy (N4) | — | GREEN on the plan's STO-3G scope; N4 |
| 4c | **THE HEAD's fifth line at phone width** (`.tmp/pv/scripts/head-phone.mjs`: 500 × 930, the lab says phone; a hand pick through the dropdown) | water: `NUMERICAL · energy agrees with PySCF to 3e\-13 Eh` (md), 3 line boxes in the 210-px head column, right edge 327 of 500; Cr(CO)₆ (its record): `… to 7e\-9 Eh · geometry computed, not measured`, 5 line boxes, right edge 344; both blocks wholly in view (top 110, height 319 / 447 of 844), no clip, page errors 0. PNGs `.tmp/pv/eye/head-phone-{H2O,CrCO6}.png` opened: the line is whole. (The head block's `scrollWidth` exceeds its width on both: the KaTeX `E = −…` line, unbreakable, 0.5.1's — not the fifth line) | — | GREEN (N5 for Josh) |
| 4c | the INFORMATIONAL row, the MODEL sheet | `status-probe` hit part: phone (box 23,411 · 248 × 68) and tablet (1096,242 · 246 × 68) — the row is topmost at its centre, a real tap opens the MODEL sheet, which defines the three words; water's 90-char line on 2 lines, no ellipsis. `lab/index.html:129` reworded ("Hydrogen's register holds its 91 basis states … While a molecule owns the field, the state is its solve in MOLECULES, not this register") and `:130` the STATUS line | — | GREEN |
| 4c | `stage-text` | **GREEN, 4 PASS** on the tip. `git diff v0.5.3-alpha..HEAD -- tests/stage-text.browser-test.mjs`: **exactly the two caption assertions** re-aimed (`'1s₀, 2p₀ · EXACT'`, `'H₂O · 1b1 HOMO · STO-3G · NUMERICAL'`) **+ one comment line**; every other line byte-identical to the base's. The export caption carries the STATE word (one `caption()` in `lab/windows/film.js` feeds film and picture); `stageCaption` (`shell/stage-words.js`) is untouched, so the stage's own words do not move; STAGE FORMULA off → `''` (the suite's `swCaption === ''`) | — | GREEN (§J-3 as ruled) |
| 4c | **the no-frame-call probe** (`tools/status-probe.mjs --part all`, my `--eye`/`--json` under `.tmp/pv/`) | **3 s of playback** (transport + RUN, 59 frames, 590 RT steps): **statusOf 0 · capability 0**; **one VIEW change: statusOf 1 · capability 0**, the row reads the ORBITAL line; a FLOW toggle 1, a landing 1, MOLECULES off 1, hydrogen's VIEW change + 3 s play 0; boot witness 1; page errors 0. 18/18 PASS | — | GREEN |
| 4d | the worker | `worker-pool` 15/15 (above: local() 0 under error-after-reply, timeout-after-reply, error-after-respawn, the dead pool; 1 for the never-answered worker). `worker-refusal` browser **6/6** (the live error road: `{ error, refused }`, fallback calls 0). **Worker-less run** (`.tmp/pv/scripts/workerless.mjs`): forced by replacing `window.Worker` after `__LW.ready` (MOLECULES off, so the lazy chem worker had never been built) with a constructor that counts and THROWS — the pool's "construction throw", which leaves it `failed` with `answered` false, the same state a Worker-less browser starts in. **MOLECULES still solves**: H₂O in 132 ms on the frame thread, E −74.96302316286251 (PySCF −74.96302316286221), its identity set, RPA roots present; N₂ next in 56 ms, no second construction attempt (`tried` 1); the warning "worker construction failed … — that maths runs on the frame thread"; the STATUS row `DENSITY · NUMERICAL · energy agrees with PySCF to 6e-13 Eh · picture good to 0.2 % of ρmax`; page errors 0 | — | GREEN |
| 4e | precision | **`field-law` 9/9** (G-S): THE LAW as ruled (1 f16 ulp + 1e-6·\|f64\|, 0 over); readings **hydrogen 2.34e-6 RMS · 1.88e-5 (99.8 %) · 1.68e-4 worst · 6.42e-4 of max\|ψ\|; water 8.31e-4 RMS · 1.85e-3 · 1.94e-3 · 2.86e-4 of ρmax**; toward zero (261,700 / 261,796 and 120,675 / 120,736); **the strict one-ulp count printed: 32 of 524,288 (hydrogen, worst 1.0005 ulp) and 14 (water, 1.0008)** — PAIR-B-BUILD §4's numbers to the digit. Constants: `tests/helpers/field-law.mjs` (hydrogen rms 3e-6, worst 2e-4; density rms 1e-3, relToRhoMax 3e-4); `lab/status.js` `FIELD_LAW` quotes `hydrogen.rms`, `hydrogen.worst`, `density.worst` (2e-3 → "0.2 % of ρmax", the builder's choice of the bound) and `status.test` holds each equal. **The invariance case** (V2): ten presentation changes, `sol.seq` 1, `solverCalls` 2, Tr(DS) 10.000000000000014 throughout. **`T_MAX`** = 2⁵³ declared in `lab/clock.js`' header + export, read by nothing in `lab/`; `clock` 8/8. PAIR-B-BUILD's two packet differences re-read (benzene 8.80e-8 → 2.91e-8 abs, C₆₀ 2.56e-8 → 1.18e-8; the code is the f64 scratch + one `set()` cast, `orbitalsview.js` `vectors()`) | — | GREEN |
| 4f | P10 · P11 | the q-band anchor: **ours 351, Sol 351 AGREE** on two rings (36 labels, 21 at ω = 0, 165 at ω > 0, 15 gaps, \|q\| 5 / 10); its disagreement message reads "OUR COUNT DISAGREES WITH SOL'S … REPORT TO THE PILOT; do not edit lab/fro…" (`tests/qband.test.mjs:90`). **FINGERPRINT on the rig once** (`__LW.report({ only: 'fingerprint' })`): adapter strings empty (Firefox), driver null, UA Firefox 157, 12 features with **shader-f16 offered · requested false · granted false**, 35 limits, `bgra8unorm`; **digests 1s+2pz `4d36a9a5`, H₂O density `386430a4`** — PAIR-C-BUILD's two hashes; `restored` identical on every key, errors none | — | GREEN |
| 4g | P5 the export | **SKIPPED — P5 did not land** (it waits on Josh's Q1 to the pilot); no Python was run | — | — |
| 5 | **G-M the pair** (§6) | floor first, then base vs tip, 5 + 5 interleaved, boot scene AND a MOLECULES scene: **boot Δ +0.549 · MOLECULES Δ +0.776 ms/s** (floor +0.284 / −1.153) | base medians 47.674 / 73.571 | GREEN (≤ 3.536) |
| 6 | **G-S** the 37 browser suites, one at a time (`.tmp/pv/suites/`) | **34 of 37 GREEN** on the first pass (19:16–19:33): camera-shift 15 · chem 0/56 failing · curves 7 · export3d 10 · field-law 0/9 failing · field-molecule 9 · film-handover 4 · frame-occlusion 7 · history 45 · input 13 · keyboard-window 8 · lfo-tension 3 · library 7 · lw-facade 1 · lw-links 5 · menubar 8 · mir-controls 2 · molecular-diff 0/15 failing · molecular-names 6 · molecule-demos 5 · molecule-head 3 · new-project 8 · offer 16 · official-defaults-palette 3 · opener 7 · orbitals 0/24 failing · project-formats 5 · register 0/22 failing · render-regressions 2 · routed-knob 0/4 failing · stage-text 4 · take-in-bugs 4 · timeline 0/14 failing · worker-refusal 0/6 failing (PASS counts; M-V's 0.5.3 counts to the line, chem +1 for P4's L1 and the two new suites) | — | GREEN |
| 6 | `current.browser-test.mjs` | RED at **:138** (`followsPalette`) | **base RED at :138** (`longMeters`, the same line and key family) | PRE-EXISTING (N1) |
| 6 | `gpu-recovery.browser-test.mjs` | RED: "Render did not settle: animation frames stopped" on its reload | **base RED, the same stall** | PRE-EXISTING (N1) |
| 6 | `latex-copy.browser-test.mjs` | RED at :55 (§2, SPECTRUM's ⧉ `hit: false`) — **twice** (the pass, and alone) | **base RED, the same field** (`hit: false`) | PRE-EXISTING (N2) |
| 6 | **the boot suite ALONE** (`tests/legacy/boot.browser-test.mjs`) | run 1 **150/152: RED B69, B149**; run 2 (alone again) **150/152: RED B69, B149**; a third, diagnostic reading — the suite's own lines 1–2139 (its head through B69, 84 laws; `.tmp/legacy/boot-b69.mjs`, unedited but for one import path and a dump of B69's reading) — **84/84, B69 GREEN**, every clause at its value. B6 ×2, B67, B77, B100, B108, B112, B127, B136 GREEN on both full runs | base run 1 **151/152: RED B149** (B69 GREEN); base run 2 **150/152: RED B69, B149** | B149 PRE-EXISTING · B69 the known flake, red on both trees (N10) |
| 6 | the rows' owning suites on the MERGED tip | `history` 45 · `new-project.browser` 8 · `register` 0/22 failing · `chem` 0/56 failing (P4's L1 capability judge) · `molecule-head` 3 · `stage-text` 4 · `frame-occlusion` 7 · `field-law` 9/9 · `worker-refusal` 6/6 · `lw-facade` 1/1 — all green above | — | GREEN |
| 7 | **G-Lines** `cat lab/*.js lab/shell/*.js lab/windows/*.js \| wc -l` | **28,101 ≤ 28,298** (197 to spare); +83 against 28,018; ledger §3 | 28,018 | GREEN |
| 8 | the documents against the tree | §5: 3 stale CLAUDE.md lines (the head's four lines, the caption, INFORMATIONAL's rows) + 1 optional addition; NOTES' lock command (pre-existing); `digest-lock.mjs`' R7 sentence; `CLAIMS.md` row 8; `rack.js:11`. STATE-SCOPES: **no new key — true** (G-B 11/11 full + edit; settings-probe 0/6; the `lab/` diff writes no storage key) | — | NOTES (N6–N9) |
| 9 | **G-Eye** | §4: P4's pair (`status-row-{phone,tablet}.png`) shows the seat (b) row as the row says; no PNG of seat (a) THE HEAD — mine fill it (`.tmp/pv/eye/`); the other rows change no pixels Josh sees except P6's refusal sentence (no PNG) | — | GREEN with N5 |

## 2 · The defect list (for the fix round)

**BLOCKING: none.** Measured against the brief's list: no serialize byte moved (11/11 + 11/11), no digest (860 · 0/0, 1004 · 0/0), no facade member
(176, the fixture), no stamp line (comment lines only), no frame-loop call (statusOf 0 / capability 0 in 3 s of play), and no law green on the base and red
on the tip (every red is red on the base too; B69 was green on the base's first reading and red on its second, N10).

| # | file · line | law | the tip's reading · the base's | severity | fix (one line) |
|---|---|---|---|---|---|
| N1 | `tests/current.browser-test.mjs:138` · `tests/gpu-recovery.browser-test.mjs` | the audio card's transition reads; a reload settles | Both RED on BOTH trees, the same lines and failure modes (current: `followsPalette` on the tip, `longMeters` on the base; gpu-recovery: "Render did not settle" on its reload). M-V's N1, unchanged | NOTE (PRE-EXISTING) | as M-V N1: poll the computed value instead of the fixed 250 ms waits; a bounded retry of `settle()` after `go()` |
| N2 | `tests/latex-copy.browser-test.mjs:55` (§2, the head button's hit test) | SPECTRUM's ⧉ is the topmost thing at its own centre | RED on the tip twice and on the base once, the same field (`hit: false`, every other field equal). It was green at M-V (0.5.3's pre-fix-round tip). A standalone replay of §1–§2's steps (`.tmp/pv/scripts/latex-hit.mjs`, the suite's URL and 1500 × 1000) reads the button itself at its centre (`BUTTON.dev-copy` in SPECTRUM's head, rect 183,304 · 22 × 22) — a timing interaction in the suite, not a cover in the page, and not this release's | NOTE (PRE-EXISTING on the base) | read the hit after the raise's motion settles (poll `elementFromPoint` until two reads agree), as gatekit's `tap` does |
| N3 | `lab/library/` — the `B12H12--` record (PLAN R3 "record bytes and hashes do not move") | the catalogue's records are fixed bytes | P3 re-cut ONE record: hash `481379d5…` → `e1928277…`, 473,837 → 473,836 B; the only change is its `page` text, `$\mathrm{B_{12}H_{12}²^{-}}$` → `$\mathrm{B_{12}H_{12}^{2-}}$` — 0.5.3 M1's formula fix, which the base's record had missed (the base was out of step with its own generator; P3-BUILD §5). `--check` is in step now. A project saved on 0.5.3 names the old hash (its `nameKey` is the portable road, STATE-SCOPES :64); a device that installed the old record holds bytes the catalogue no longer names. Not measured in a page | NOTE (for Josh, vs R3) | none needed in `lab/`; say it in the CHANGELOG ("B₁₂H₁₂²⁻'s record re-cut for its formula; re-download it") |
| N4 | `lab/chemview.js` `tell()` (`oracle: row \|\| basis !== 'sto-3g' ? null : P.oracle`) · `tools/orbital-library.mjs` (the `oracles` member is STO-3G only) | PLAN R3 / §B "water never reads UNCHECKED"; P4's rule "a molecule with a fixture oracle is never UNCHECKED" | **Water in 6-31+G\* reads UNCHECKED** on the shipped road (`__LW.chem.setBasis('6-31+g-star')` on water: row `DENSITY · UNCHECKED · picture good to 0.2 % of ρmax`, head `UNCHECKED` (the code styles that value `warn`); the solve −76.01744137674822 Eh agrees with the fixture to 1.3e-13), while `tests/fixtures/oracles/6-31+g-star-v1.json` holds water's 6-31+G\* energy (−76.01744137674835 Eh) and 18 others. The plan's and the table test's scope is STO-3G (P4-BUILD §5.4 says so); the word is honest — the catalogue carries no 6-31+G\* oracle — but the claim as written in §B is wider than the tree | NOTE (for Josh / the fix round) | a P3-kind generator row: inline the 19 6-31+G\* energies as `oracles631` (keyed by id) and let `tell()` read them for `basis === '6-31+g-star'`; or narrow §B's sentence to STO-3G |
| N5 | THE HEAD (`lab/latex-state.js` `moleculeHead`), phone | the head is legible at phone width | The fifth line is whole and in view (§1 4c) but wraps to 3 (water) – 5 (Cr(CO)₆) line boxes in the head's 210-px column, so Cr(CO)₆'s head is 447 px of an 844-px phone viewport. P4's PNG pair shows the INFORMATIONAL row only; no PNG of the head seat was committed | NOTE (for Josh) | Josh's eye on `.tmp/pv/eye/head-phone-CrCO6.png`; optionally commit a head PNG with the fix round |
| N6 | CLAUDE.md :98, :108, :111–112 | the documents point at the code | three lines stale since P4 / P4c (§5 E1–E3) | NOTE | the integrator applies §5 |
| N7 | `research/release-0.5.4/CLAIMS.md` row 8 (and row 10's seat) | "LISTED, NOT CHANGED … changed by nobody" | row 8's sentence (`lab/index.html:129`) was REWORDED by P4, as the plan's P4 row asked — the row still says "changed by nobody"; row 10's seat is `lab/chemview.js:223` at the tip (P4's import line), `:222` at the P0 tip as the header says. Rows 1–7, 9, 11 re-found by their words at the tip, unchanged | NOTE | §5 E7 |
| N8 | `tools/perf/digest-lock.mjs:43` (P11's R7 sentence) · `docs/NOTES-FOR-AGENTS.md:99–100` | the lock's scope said once and true | the R7 sentence says "no packet", while the same header's state list (:19) locks hydrogen's BOX packet — P0 wrote the true form ("no time-dependent molecular packet", P0-BUILD §4.10) in CLAUDE.md and NOTES. NOTES' command still names `digest-lock-base-w125.json` without `--query gastab=0` (pre-existing, P0-BUILD §4.12) | NOTE | §5 E5, E6 |
| N9 | `lab/rack.js:4` vs `:11` | one file, one sentence about clocks | P0 changed :4 to "one clock"; :11 still says "Four clocks (§12): the physics clock … the field clock … the camera clock … the presentation clock" — §12's four are time DOMAINS, a different sense from 0.5.0 C4's one play clock, so :4 now reads against :11 (P0-BUILD §4.8 flagged :11) | NOTE | §5 E8, when `rack.js` is next opened (`pwa --write`); never the STAGE TEXT anchor |
| N10 | `tests/legacy/boot.browser-test.mjs:2125` (B69, W-MOBILE · THE PHONE, PORTRAIT) | the brief's known flake | Tip: RED in both full runs, GREEN in the third reading (the suite's own head through B69, every clause at its value). Base: GREEN in run 1, RED in run 2. So it reds on both trees. Its printed reading is cut at 600 characters by gatekit's `judge`, and every clause visible there holds, so the failing clause is not named by the suite. Nothing in the 0.5.4 `lab/` diff touches the phone crossing, the rack, the transport, the glass or the quality | NOTE (PRE-EXISTING flake) | print B69's whole reading (or its failing clause) on red; `.tmp/legacy/boot-b69.mjs` is the dump this round used |

## 3 · G-Lines: the ledger, from git at every first-parent merge (`.tmp/pv/scripts/ledger.mjs`)

| merge | row | total | Δ | per file | estimate (PLAN §F) |
|---|---|---|---|---|---|
| `aa83042` | v0.5.3-alpha | 28,018 | — | — | — |
| `c7ac371` | P0 | 28,023 | **+5** | molecules +2, field +1, molecular-flow +1, molecular-session +1 | +5 |
| `ba6bcc7` | P1 | 28,047 | **+24** | molecule-state +23, chemview +1 | +27 |
| `a90355d` | P3 | 28,047 | **+0** | (the seat in-line in `molecules.js`) | +3 |
| `fd1c10d` | PAIR B + B2 (P6 +3 · P7a +2 · P7b +3 · P7c/d 0) | 28,055 | **+8** | worker-pool +3, clock +3, orbitalsview +2 | +26 (P6 20 · P7 6) |
| `4c6e89a` | P4 | 28,100 | **+45** | status +27, chemview +9, informational +7, latex-state +1, sw +1 | +45 |
| `65efb18` | PAIR C (P10 · P11) | 28,100 | **+0** | — (tests/ and tools/ only) | 0 |
| `59fe469` | P4c | **28,101** | **+1** | windows/film +1 | (inside P4) |

**In: +83 against PLAN §F's ≈ +106; 28,101 of 28,298, so 197 lines remain.** No row passed its estimate or a 1.5× stop; P5 (+0 planned) and P13 did not land.
Outside the count: `lab/index.html` +1, `lab/skin.css` +1 (P4's one seat, ruled to stand), `lab/library.json` +597 −3 (P3's members, data).

## 4 · G-Eye: the pictures, opened

- **P4** `research/release-0.5.4/eye/status-row-phone.png` (500 × 930, phone mode) and `status-row-tablet.png` (1366 × 1024, tablet mode): water on,
  INFORMATIONAL raised, its third row STATUS reads `DENSITY · NUMERICAL · energy agrees with PySCF to 3e-13 Eh · picture good to 0.2 % of ρmax` on two
  lines with the molecule-level line beneath, faint; nothing above the MOLECULES fold changed; the STAGE FORMULA (`H₂O`) and ATOM LABELS rows as at 0.5.3. ✓
  The pair is a phone/tablet pair, not a before/after: INFORMATIONAL had no row before (M-V N2's kind). My status-probe re-run wrote its own pair to
  `.tmp/pv/eye/` (identical boxes, measured above).
- **Seat (a), THE HEAD** — no committed PNG. Mine, `.tmp/pv/eye/head-phone-H2O.png` and `head-phone-CrCO6.png`: the fifth line under the gap line,
  `NUMERICAL · energy agrees with PySCF to 7e-9 Eh · geometry computed, not measured`, whole, set in the head's serif, no clip (N5).
- **Seat (c), the caption** — no PNG; `stage-text` §4 reads the two suffixed strings from `captionOf` and proves the caption reaches the picture's pixels.
- **P0, P1, P3, PAIR B, PAIR C** change nothing Josh sees but P6's refusal sentence (MOLECULES' status line after a worker failure) — no PNG; its words
  are in `worker-pool.test` and `worker-refusal` (6/6).

## 5 · The documents against the tree: exact old → new (NOT applied)

**Fresh, verified (no edit):** CLAUDE.md :313–316 THE LOCK (SAME-MACHINE, 860 + 1004 — both read 0/0 here); :187–210 the three scopes (no new key:
G-B, settings-probe, the `lab/` diff); :29–48 MOLECULES (every sentence still true; E4 is an addition, not a fix); :83–97 THE STAGE FORMULA's seat and
switch. `docs/STATE-SCOPES.md`: no new key, :38 (`molFormula`: "the formula, the fade and the capture's caption") still true — the STATE word rides the
same switch. NOTES :98 (P0's scope sentence) true. README :51/:79 (PAIR B2's 3e-6 RMS · 2e-5 in 99.8 % · 2e-4 worst) equal the `field-law` readings.

- **E1 · CLAUDE.md :98–99 (P4, STALE: the head has five lines).** Old: "lands: four lines from `latex-state.js` `moleculeHead` (formula and name;
  RHF/basis and E; nocc of nAO and the point group, "—" / where the record has none; the HOMO's name and the HOMO–LUMO gap), every number the record's
  `stem` or the live solve's through" → New: "lands: five lines from `latex-state.js` `moleculeHead` (formula and name; RHF/basis and E; nocc of nAO and
  the point group, "—" / where the record has none; the HOMO's name and the HOMO–LUMO gap; 0.5.4 P4's molecule-level STATUS, `lab/status.js` `head`: the
  STATE word, the agreement with PySCF's energy and, on the 36, "geometry computed, not measured"), every number the record's `stem` or the live solve's through"
- **E2 · CLAUDE.md :111–112 (P4c, STALE: the caption carries the STATE word).** Old: "instead its one plain-Unicode CAPTION (`H₂O · 1b1 HOMO · STO-3G`, or
  the states), drawn by `lab/capture.js` `drawCaption` and / following STAGE FORMULA (D5, Group II, replaces it)." → New: "instead its one plain-Unicode
  CAPTION — the stage's words, then ` · ` and the STATE word (`H₂O · 1b1 HOMO · STO-3G · NUMERICAL`, `1s₀, 2p₀ · EXACT`; 0.5.4 P4c: `lab/windows/film.js`
  `caption()`, read at the take, one function for the film and the picture) — drawn by `lab/capture.js` `drawCaption` and / following STAGE FORMULA: off,
  no caption and no word (D5, Group II, replaces it)."
- **E3 · CLAUDE.md :108 (P4, STALE by omission: INFORMATIONAL has a third row).** Old: "… the next save writes all four. The type scale is the notebook's
  three sizes: the formula" → New: "… the next save writes all four. Its third row is STATUS (0.5.4 P4; no key, no window, no badge): the kit's wide
  readout of what the stage may claim, from `lab/status.js` `statusOf` (pure) — EXACT · NUMERICAL · UNCHECKED and the picture's number in its metric;
  MOLECULES' kept line per VIEW with its molecule-level line beneath, else the owner's — written on a landing, a VIEW or FLOW change or an owner change,
  never in a frame (`tools/status-probe.mjs`); a tap opens the MODEL sheet, which defines the words; LEAN leaves it alone (`window-chrome.js`). The type
  scale is the notebook's three sizes: the formula"
- **E4 · CLAUDE.md :48 (P1 + P6, an ADDITION; optional).** Old: "record (`more`); its `Aa` stays visible with HELP off." → New: "record (`more`); its `Aa`
  stays visible with HELP off. THE CHEM WORKER REFUSES (0.5.4 P6, `lab/worker-pool.js`): once it has answered, an error or a timeout is `{ error, refused }`
  ("pick the molecule again"), never re-run on the frame thread; it respawns once, then refuses; only a worker that never answered (no module Worker, a
  construction throw) keeps the frame-thread road (`tests/worker-pool.test.mjs`, `worker-refusal`). A solve's `sol.identity` (`molecule-state.js`
  `identityOf`, P1) is DATA, never a stamp — `sol.hash` stays the basis hash."
- **E5 · docs/NOTES-FOR-AGENTS.md :99–100 (PRE-EXISTING, P0-BUILD §4.12).** Old: "`LW_PORT=<port> GD_PORT=<port> node tools/perf/digest-lock.mjs --check
  --fixture` / `research/optimization-2026-09-24/digest-lock-base-w125.json` against a tree served by `tools/gate/server.py`." → New: "`LW_PORT=<port>
  GD_PORT=<port> node tools/perf/digest-lock.mjs --check --query gastab=0` (860) and the same with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json`
  (1004), against a tree served by `tools/gate/server.py`."
- **E6 · tools/perf/digest-lock.mjs :43 (P11).** Old: "holds the 860 + 1004 values (≤ 64 AO tile states, no packet, STATES, FLOW or" → New: "holds the
  860 + 1004 values (≤ 64 AO tile states, no time-dependent molecular packet, STATES run, FLOW or"
- **E7 · research/release-0.5.4/CLAIMS.md row 8.** Old: "| nobody |" (the row's last cell) → New: "| P4 (0.5.4, PLAN's P4 row): now "Hydrogen's register
  holds its 91 basis states with n ≤ 6; norm, energy, and autocorrelation come from their coefficients. While a molecule owns the field, the state is its
  solve in MOLECULES, not this register." |"; and the header's "Every row's "changed by" is **nobody**" → "Every row's "changed by" is **nobody** but row 8".
- **E8 · lab/rack.js :11 (P0's :4 edit; reword when `rack.js` is next opened, then `pwa --write`).** Old: " * Four clocks (§12): the physics clock is the
  Clock (exact logical time); the field clock is the" → New: " * Four time domains (§12), under ONE play clock (0.5.0 C4): the physics clock is the Clock
  (exact logical time); the field clock is the". The `rack.js` comment `/* THE STAGE TEXT (Settings › Display;` is a `rack-deps` anchor and is NOT proposed.
- **E9 · docs/NOTES-FOR-AGENTS.md §5, :80–81 (P11, an ADDITION; optional).** After "`&only=grid` or `&only=project` runs one scene." add: "`&only=fingerprint`
  runs the FINGERPRINT row alone (0.5.4 P11: adapter, driver, browser, features — `shader-f16` offered, never requested — limits, and two 64³ digests);
  machines are compared by it, never locked."

## 6 · G-M: the pair (`tools/perf/main-thread.mjs --runs 1` by R1-BUILD §6's recipe; `.tmp/pv/scripts/pairs.mjs`, raw in `.tmp/pv/pair/`)

Per round A-boot · B-boot · A-mol · B-mol, 5 rounds; before every run rigfree free, then 4 s. The boot scene is the device report's long play (30 s);
the MOLECULES scene is R1's D1 (H₂O · ORBITAL · HOMO · AUTO-ROTATE, STAGE FORMULA on, `--sweep 10`), every run answering `{ mol: true, view: 'orbital',
homo: 5, auto: true, stage: true }`. All 40 runs: `field ok · NVIDIA GeForce RTX 3070`, notice dismissed; the one logged error is the warm-up
navigation's device loss the instrument's header describes (present in R1's records too). Medians (spread) in ms/s:

| | boot scene | MOLECULES scene |
|---|---|---|
| **floor** (the tip twice, 9063 ↔ 9063, 18:50–19:03) | A 47.486 (2.094) · B 47.770 (2.165) → **Δ +0.284** | A 75.092 (2.807) · B 73.939 (2.759) → **Δ −1.153** |
| base `v0.5.3-alpha` (9065) | **47.674** (2.725) — 47.231 · 48.479 · 48.493 · 45.768 · 47.674 | **73.571** (3.473) — 75.733 · 76.117 · 73.299 · 72.644 · 73.571 |
| the tip `59fe469` (9063) | **48.223** (1.097) — 48.563 · 48.765 · 48.223 · 47.668 · 47.890 | **74.347** (1.859) — 73.300 · 75.159 · 74.347 · 73.898 · 74.556 |
| **Δ (tip − base)** | **+0.549 · PASS** (≤ 3.536) | **+0.776 · PASS** |
| script (median) | 17.139 → 17.328 | 20.696 → 20.691 |
| presents in 30 s | 704–721 both trees | 529–548 both trees |

Expected ≈ 0 and found ≈ 0, inside the floor's own reach (|Δ| ≤ 1.153 on one tree): the only frame-path addition is P7a's f64 scratch (n ≤ 768 MACs a
frame, ORBITAL packets only — not in either scene), and STATUS costs no frame call (§1 4c). THE STUTTER LAW: no gross Δ, no row named.

## 7 · The harness, closed

My servers were stopped by pid: 2236761 (9063, the tip) and 2236763 (9065, the base) at 20:00; 2432092 (9065, the base again, for the second boot
reading) at 20:08. After each run no geckodriver, marionette Firefox or headless Chromium of mine was left (rigfree free
after the last). No `pkill -f`. The editor's playwright and every other worktree were never touched. I edited nothing under `lab/`, `tests/`, `tools/`,
`docs/` or `CLAUDE.md`; `.tmp/` is git-ignored; the status-probe's PNGs went to `.tmp/pv/eye/`, not `eye/`. No Python was run. This file is the one
commit; nothing was pushed.

**FIT TO CUT: YES**
