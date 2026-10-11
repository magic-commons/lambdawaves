# M-V-REPORT · THE VERIFICATION ROUND (0.5.3 "Rack Tune"; a fresh Opus verifier: read, measured, judged; nothing fixed)

Worktree `.claude/worktrees/agent-aeedd17c469327378`, branch `worktree-agent-aeedd17c469327378`, `git reset --hard 93c7c77` (the integration tip of `sos-s0`,
every 0.5.3 row merged; `git log --oneline -1` = `93c7c77 merge B-DISP-2 (25fd4e8) …`). The brief is `BRIEF-V.md`, plus the launch message's two newer facts
(B-CAM-2's tip `7e881cb`, B-DISP-2's tip `25fd4e8`).

**Servers (all mine, all stopped by pid):** 9003 / GD 5473 is the tip (pid 1699824). 9005 / GD 5475 is the base, `git archive bb764a4` (= `v0.5.2-alpha`, commit
`3797678`) in `.tmp/base-052` (pid 1699826). 9007 / GD 5477 served a lock-ON copy of the tip (pid 1711059). The integrator's 8731 / 8735 were never touched.
`research/release-0.5.2/r2b-measure/rigfree.mjs` ran before every browser run, one at a time. The rig was healthy throughout: load 1.3–3.9, every LOCK run 59 s.
The window was 2026-10-11, 12:02–13:10 CDT, about 68 min of rig time. The scripts are git-ignored, under `.tmp/scripts/`, with readings in `.tmp/`.

**THE VERDICT: FIT TO CUT: NO.** There are two BLOCKING items, both under the brief's definition "a law green on the base and red on the tip": boot-suite
laws **B67** and **B127**. Both turned red because of 0.5.3 rows (M4's stuck-pointer heal and M8's SECTION stepper). In both cases the app is right and the
law is stale. Both fixes are re-aims in `tests/legacy/boot.browser-test.mjs`, with no `lab/` change (D1, D2). Every other gate is green or pre-existing. After
the two re-aims and one green boot-suite run, the tree is fit.

## 1 · The gates (BRIEF-V's order): reading · the base beside any red · verdict

| # | gate | the tip `93c7c77` | the base `v0.5.2-alpha`, beside a red | verdict |
|---|---|---|---|---|
| 1 | **G-N** `bash test.sh node` | **exit 0**. 82 node suites with pwa last, check-only; `render-exact` 0 failing of 40; the tree stayed clean | — | GREEN |
| 1 | `node tools/new-project.mjs --check` (NOT regenerated) | **in step, 16117 B**. `git log bb764a4..HEAD -- lab/new-project.lambdawaves.json` is empty, so M9's "regenerated once, 0 bytes changed" left no commit and there is no second regeneration | — | GREEN |
| 2 | **G-L THE LOCK**, camera lock OFF, `--check --query gastab=0` | **860 · 0 readback · 0 record-byte**, unrepeatable none, page errors 0, 59 s | — | GREEN |
| 2 | same, `--fixture …/digest-lock-s4a.json --query gastab=0` | **1004 · 0 · 0**, page errors 0, 59 s | — | GREEN |
| 2 | camera lock ON: the brief's trigger `git log 7e881cb..HEAD -- lab/camera-law.js lab/field.js lab/material.js` | **not empty**: it lists `12bd7a4`, the merge commit of `ad3618d`, which is not in `cam-build-2`'s ancestry. In content, `git diff 7e881cb HEAD -- lab/camera-law.js lab/field.js` is **empty**. `lab/material.js` does not exist; `lab/windows/material.js` differs only by M12's palette lines. **Re-run anyway** on an archive of HEAD's `lab/` with only `let locked = true` changed (`camera-law.js:168`), served on 9007. The probe read `__LW.camera.lock === true`, shift `[0,0]` | — | — |
| 2 | THE LOCK, camera lock **ON**, the 860 and 1004 runs | **860 · 0/0** (59 s) and **1004 · 0/0** (59 s), page errors 0, on the MERGED tip | — | GREEN |
| 3 | **G-B** `serialize-bytes --out --texts`, the tip vs the base, `integrator/sb-compare.mjs` | full **0/11** sha-equal, as expected, because every reading carries the permitted row. Edit **11/11** sha-identical | full 12600/8775/8938/8772/10696/10887… B | GREEN |
| 3 | the one permitted row (`.tmp/scripts/sb-row.mjs`) | `{"id":"informational","side":"R","folded":true,"closed":true,"off":false,"float":null}` occurs **exactly once** in all 11 readings, at `layout.cards[7]` after `curves` (8th of 24). Each reading is +87 B (WATER 8775 → 8862). With that row removed: **full 11/11 byte-identical**, and the parsed layout is equal 11/11. No PREFERENCE key (`camLock`, `atomLabels*`, `molFormula*`) appears in any full or edit text | — | GREEN |
| 3 | `tools/settings-probe.mjs --out` | run 1: N₂ "Render did not settle: animation frames stopped", 1 of 6. **Re-run alone: 0 of 6**, every reload byte-identical. The same rig stall R-V read at 0.5.2 | **0 of 6** with the base's own tool | GREEN (the first run's N₂ stall belongs to the rig) |
| 3 | the three keys, in every reached scene's blob | `camLock:false`, `atomLabels:true`, `atomLabelsSize:1` in B1 and B3 of all 6 scenes; none is in `settings-store.js` `WORKSPACE`, so all three are PREFERENCE. **Tip B3 = base B3 + those 3 keys + `"informational"` in `closed[]` (WORKSPACE), byte for byte, 6/6** | — | GREEN |
| 4 | **the 0.5.2 profile** (`.tmp/scripts/profile052.mjs`): one origin; the base at `/zz-before/lab/` (a symlink to the export, removed after), STAGE TEXT turned off by the base's own switch, then the tip at `/lab/` | **STAGE FORMULA and ATOM LABELS both read OFF** (`aria-pressed` false; `stageText.on` and `labelsOn` false; layer hidden; `body.no-mol-formula`). INFORMATIONAL is closed and SETTINGS heads the open right rack. The tip's boot wrote nothing (B1 === the base's blob). After the tip's save, the blob is the base's plus `atomLabels:false, atomLabelsSize:1, camLock:false`, plus `informational` in `closed[]`. **Every other byte is identical**, and nothing turned itself on. The reload is byte-identical (B3 === B2, and B4 after a save === B2). No other localStorage key moved; only `lambdawaves.q0.session` (PROJECT) appeared. Second reading: the base settings-probe's boot blob with `molFormula:false`, injected into empty storage, gives the same result, both OFF, with the same 3 keys + the row, and is reload-identical. 0 page errors | — | GREEN (the tree matches the law in PLAN M9 and DISP-BUILD §2) |
| 5 | **G-H** `LW_PORT=9003 node tools/stage-dead-probe.mjs` | **10/10, DEAD 0**. Every count equals STAGE-BUILD §3 except scene 3 (the modulation window), which reads ui 1746 · gap 170 instead of 1742 · 174: M13a's 3×3 switch covers 4 former gap points | — | GREEN |
| 5 | **G-W** `tests/lw-facade.browser-test.mjs`, no `--write` | **1/1**: 176 members (56 value · 48 get · 72 method), names, kinds and order. `lw-facade.json` untouched | — | GREEN |
| 6 | **G-S, the 35 browser suites**, one at a time (`.tmp/suites/`) | **33 of 35 GREEN** on the first pass: camera-shift 15 · chem 0/55 failing · curves 7 · export3d 10 · field-molecule 9 · film-handover 4 · frame-occlusion 7 · history 45 · input 13 · keyboard-window 8 · latex-copy 10 (red on both trees at 0.5.2; green now) · lfo-tension 3 · library 7 · lw-facade 1 · lw-links 5 · menubar 8 · mir-controls 2 · molecular-diff 0/15 failing · molecular-names 6 · molecule-demos 5 · molecule-head 3 · new-project 8 · offer 16 · official-defaults-palette 3 · opener 7 · orbitals 0/24 failing · project-formats 5 · register 0/22 failing · render-regressions 2 · routed-knob 0/4 failing · stage-text 4 · take-in-bugs 4 · timeline 0/14 failing | — | GREEN |
| 6 | `current.browser-test.mjs` | **RED at :138**, the audio card's transition reads after 250 ms, with a key that varies: `valuesReveal`, `followsPalette`, `longMeters`. Order-balanced reading: **tip red 8 of 9**. Its green run passed `:150`, `:170–193` (M6's scope law, M11's A/B) at 15/15 | **base red 4 of 8**, same line and same key family (`followsPalette`, `longMeters`). The brief's "RED on the base" is a flake rate, not a standing red | PRE-EXISTING (N1) |
| 6 | `gpu-recovery.browser-test.mjs` | **RED**: "Render did not settle: animation frames stopped" on a reload cycle. **Tip red 6 of 9** | **base red 2 of 8**, the same reload stall (R-V recorded it at 0.5.2) | PRE-EXISTING (N1) |
| 6 | **the boot suite ALONE** (`tests/legacy/boot.browser-test.mjs`, 152 laws) | **149/152: RED B67, B127, B149**. B6 ×2, B69, B77, B100, B108, B112, B136 GREEN | the base export's own suite: **150/152: RED B69 (flake), B149 (standing)**. **B67 and B127 GREEN** | B149 PRE-EXISTING · **B67 and B127 DEFECT, BLOCKING (D1, D2)** |
| 6 | the FILM witnesses | `node tests/render-exact.test.mjs` 0 failing of 40 (node gate) · `film-handover` 4/4 | — | GREEN |
| 6 | the rows' owning suites on the MERGED tip | every closer named in a BUILD table is green above, or in the node gate (`stage-gestures`, `latex-state` with its 128-formula sweep, `library`, `molecular-register`, `molecular-drive`, `new-project.test`, `first-run`, `keyboard-shortcuts`, `pwa`). `tools/camera-routes.mjs` **5/5**, fingerprint (routes, bases, law, dials) **identical to the base's**. Not run: `tools/hit-probe-set.mjs`, which needs MIR's 1.5 worktree tools | — | GREEN |
| 6 | the main-thread pair (extra, to probe N1): `tools/perf/main-thread.mjs --runs 1`, boot scene, 5 + 5 order-balanced | tip median **48.002 ms/s** (spread 2.405), script 17.153 | base **47.711** (spread 2.118), script 17.181. **Δ +0.291 ms/s**, inside the floor | GREEN (no heavier main thread at play) |
| 7 | **G-Lines** `cat lab/*.js lab/shell/*.js lab/windows/*.js \| wc -l` | **28,018 ≤ 28,222** (204 to spare). +75 against 27,943. Ledger in §3 | 27,943 | GREEN |
| 8 | **G-Eye** (every sheet opened; §4) | every row has its pair except M7 (no code) and M9's new window (it has no "before"). **`disp-m8-mol-lattice-after.png` does not show the merged tip** (N2) | — | GREEN with N2 |
| 9 | the documents against the tree | §5: 6 CLAUDE.md edits (4 from 0.5.3 rows, 2 pre-existing), 1 STATE-SCOPES line, 3 code comments | — | NOTES (N3) |
| 10 | the fix-round candidates | §6: **3 rules SUBTRACT**. 2 "Open:" tails still open, 1 closed. 7 "could not measure" items measured now | — | — |

## 2 · The defect list (for the fix round)

| # | file · line | law | the tip's reading · the base's | severity | fix (one line) |
|---|---|---|---|---|---|
| **D1** | `tests/legacy/boot.browser-test.mjs:1947` (B67's `ev` helper); the row: `lab/stage-gestures.js:91` (M4) | B67 THE DRAG THE FLING COMES FROM: the gain, SHIFT's quarter, the clutch, the fling | **Tip RED**: `gain.leg [0,0,0]`, no fling. **Base GREEN.** Cause, measured (`.tmp/scripts/b67.mjs`): the law's synthetic `pointermove`s carry no `buttons`, so `buttons === 0`, and M4's heal ("a buttonless MOUSE move ends a held drag") finishes the drag on the first move. The tip's leg reads **0** as the law sends it and **0.4167 with `buttons: 1`**, the same as the base's 0.4167. A real mouse drag carries `buttons: 1` (`input` 13/13 and `camera-shift`'s driver drags are green), so the app is right and the law's input is stale | **BLOCKING** (a law green on the base, red on the tip) | send `buttons: 1` on B67's moves, e.g. `ev('pointermove', x, y, Object.assign({ buttons: 1 }, o))` in `run6` and in the fling loop, then re-run the boot suite |
| **D2** | `tests/legacy/boot.browser-test.mjs:5507-5508` (B127's ceiling); the row: `lab/chemview.js:87` (M8) | B127 THE CANVAS SAYS WHAT IS DRAWN … AND NOTHING ELSE SPEAKS: `live === 7` and the exact `liveKinds` string | **Tip RED**. Measured live regions (`.tmp/scripts/domprobe.mjs`): **tip 8, base 7**. The one more is `SPAN.mir-step-text` in `.dev[data-id="chem"]`, the aria-live polite text of M8's kit SECTION `stepper`. It is the same admitted kind as CURVES', PALETTE's and TIMELINE's steppers (written on a user step). `liveSpoke` still reads 0 and `liveBad` is unchanged. **Base GREEN** | **BLOCKING** (same law) | re-aim as 0.5.1 did for CURVES: `live === 8`, four `SPAN.mir-step-text` in `liveKinds`, and name it by its card (`liveChem` = `'SPAN.mir-step-text'`), with a "0.5.3 re-aim (M8)" comment |
| N1 | `tests/current.browser-test.mjs:117-118, :138` · `tests/gpu-recovery.browser-test.mjs:15` | the audio card's transition reads; a reload settles | Both are red on BOTH trees, with the same lines and failure modes. In an order-balanced sample the tip reds them more often: **current 8/9 vs 4/8, gpu-recovery 6/9 vs 2/8**. The main thread at play is the same (pair Δ +0.291 ms/s), so the gap is not a heavier frame loop. A boot or reload cost was not measured | NOTE (PRE-EXISTING flakes) | `current`: replace the fixed 250 ms waits before `followsPalette` / `valuesReveal` / `longMeters` with a poll until the computed value settles. `gpu-recovery`: a bounded retry of `settle()` after `go()`. If the gap persists after that, a cold-load / reload probe (R-V's U9 `coldload.mjs`) tip vs base |
| N2 | `research/release-0.5.3/eye/disp-m8-mol-lattice-after.png` | G-Eye: the picture shows what the row says | The PNG shows `‹ LATTICE › · INSTALLED` on line 1 and MOLECULES ON alone below. The merged tip, measured at the 300-px rack in LATTICE, has the stepper as a whole line (y 60, w 256; `lab.css:784` `.mol-step { flex: 1 1 100% }`) and **INSTALLED · MOLECULES ON on the next line** (y 107, x 19 / 108), which is DISP-BUILD §1's row list and Josh's ask. The PNG predates that rule | NOTE | re-take the lattice PNG from the merged tip |
| N3 | CLAUDE.md, STATE-SCOPES, 3 `lab/` comments | the documents point at the code | §5 | NOTE | the integrator applies §5. The comments wait until those files are next opened (`pwa --write`) |
| N4 | `lab/skin.css:325`, `:368`; `lab/lab.css:466-474` | dead CSS | §6a | NOTE | subtract the three rules (CSS is uncounted; `pwa --write` after) |
| N5 | STATE card, M11 (carried for Josh, no verdict) | PLAN M11 "TRANSITION · Ω RABI · the readout on one line" | B-DISP-2: with window NOTES shown, the readout keeps its own line, as on the base. It is one line only with notes off, the first-run default. Not re-measured here | NOTE (Josh) | Josh rules whether it must share the line with notes on |
| N6 | MOLECULES, M8 (for Josh) | the MOLECULE picker on a turned page | Turned to a section that does not hold the current molecule (H₂O → LATTICE), the select has `selectedIndex −1`, so the stepper shows a **blank name between ‹ ›**. The base's plain select was blank too (`idx −1`), so this is PRE-EXISTING behaviour in a new look | NOTE | optional: a placeholder name ("— pick —") when `selectedIndex < 0` |
| N7 | `BRIEF-V.md` G-L's lock-ON trigger | the trigger names the files a lock reads | `git log A..HEAD -- files` lists merge commits outside A's ancestry, here `12bd7a4`, and `lab/material.js` does not exist | NOTE (for the next brief) | use `git diff --stat <tip> HEAD -- lab/camera-law.js lab/field.js lab/windows/material.js` |

## 3 · G-Lines: the ledger, from git at every first-parent merge (`.tmp/scripts/ledger.mjs`)

| merge | rows | total | Δ | per file | estimate (PLAN §1) |
|---|---|---|---|---|---|
| `3797678` | v0.5.2-alpha | 27,943 | — | — | — |
| `3d41ac0` | M4 | 27,951 | **+8** | stage-gestures +7, shell/rack-wiring +1 | +10 |
| `43df83c` | M1 +1 · M2 +6 · M3 +3 · M10 +8 | 27,969 | **+18** | orbitalsview +11, chemview +3, statesview +3, latex-state +1 | +52 |
| `6968621` | M12 | 27,976 | **+7** | windows/material +7 | +15 |
| `bf3a2dd` | M13a +2 · M13b 0 | 27,978 | **+2** | shell/modulation +2 | +3 |
| `12bd7a4` | M5 +1 · M6 +10 | 27,989 | **+11** | camera-law +5, windows/material +5, shell/settings +1 | +18–20 |
| `4ed5487` | M7 | 27,989 | **0** | — | 0 |
| `93c7c77` | M8 +1 · M9 +29 · M11 −1 | **28,018** | **+29** | informational +28, chemview +1, settings +1, stage-words +1, sw.js +1, windows/state +1, native-ui −2, settings-card −2 | +59 |

**In: +75 against PLAN §6's ≈ +160 (the brief's ≈ +122). 28,018 of 28,222, so 204 lines remain.** Every row is under its estimate and no builder reached
its 1.5× stop. The line law holds without a ruling.

## 4 · G-Eye: the pairs, opened (side-by-side sheets in `.tmp/sheets/`)

- **M4** `stage-{before,after}-lost-pointerup` and `-rack-folded`: red dead dots everywhere become none, and the ☆ list's red block becomes none. ✓
- **M1** `mol-m1-formula`: red `\mathrm{B_{12}H_{12}²^{-}}` becomes typeset B₁₂H₁₂²⁻. ✓
- **M2** `mol-m2-c60-ladder`: faint uncarried rungs, ON lit. ✓
- **M3** `mol-m3-c60-states` shows NO CIS STATES on the switch ✓. `mol-m3-water-s0` shows BEAT and the slosh ✓.
- **M10** `mol-m10-presets`: 2 entries become 8. ✓
- **M12** `pal`: the half disk right of ROTATE, RESET beside PALETTE, no ticks, −1.571 rad under ROTATE and floating. ✓
- **M13a** `tr-switch`: the modulation window, then the TIMELINE. ✓
- **M13b** `tr-*`: flat seats, thin scrub, raised home/dock/BPM. `tr-{before,after}-pill.png` are **byte-identical**, as designed. ✓
- **M5** `cam-sphere`: the arrow turned with the stage. ✓
- **M6** `cam-lock-{off,on}`: LOCK lit, PAN pad grey. ✓
- **M8** `disp-m8-mol`, `-phone`: stepper SECTION, BASIS · VALENCE, VIEW · chevron. ✓ The `-lattice-after` picture is stale (**N2**).
- **M9** `disp-m9-display` (the STAGE TEXT row gone) and `disp-m9-informational-after`. ✓
- **M11** `disp-m11-ab`, `-state`: one row, A's lamp lit. ✓
- **M7** has no pair; it is words only. Its CAMERA note's words are **in the tip's DOM** ("Alt(+Shift)+Drag … 1:1 (Shift does not make the pan finer)") and absent on the base (§6c).

## 5 · The documents against the tree: exact old → new (NOT applied)

**Fresh, verified against the tree (no edit):**
- CLAUDE.md :88-89, the M9 head: closed on a first run (every probe blob's `closed[]`), closed for an older profile (gate 4), under SETTINGS (menubar), in + and WINDOW (menubar).
- CLAUDE.md :111-112, :114-115, :119: `atomLabels*` and its migration (gate 4); the caption follows STAGE FORMULA (stage-text t4).
- CLAUDE.md :158-161, CAM-BUILD §6's camLock sentence plus M7's: true (camera-shift's LOCK cases, the lock-ON digests, `camLock` PREFERENCE in every blob).
- CLAUDE.md :206 (INFORMATIONAL's layout row: +87 B, measured).
- STATE-SCOPES.md :38 (`atomLabels*` PREFERENCE), :45 (`camLock`), :60 (the layout row): true.
- `placeAtomLabels`, named in the brief, exists in neither tree. CLAUDE.md names `toScreen` (edit 5 sharpens it).

1. **CLAUDE.md :40-44 (M8, STALE).** Old: "MOLECULES' first row is the SECTION header, which is the library's page turner (0.4.0 S4b): PALETTE's ◂ ▸, a
   readout naming the section (it survives LEAN), and INSTALLED, whose lamp says every record of the section is on this device and whose press installs or
   removes them all; the MOLECULE dropdown below holds that one section" → New: "MOLECULES' first row is the SECTION header, which is the library's page turner
   (0.4.0 S4b; 0.5.3 M8, as Josh drew it): the kit's `stepper` in PALETTE's preset look (‹ NAME ›, a whole line; its name opens the kit's list, its hover
   carries the section's record line, `__LW.chem.section().sub`), then INSTALLED, whose lamp says every record of the section is on this device and whose
   press installs or removes them all (shown only for a section with records), beside MOLECULES ON; the MOLECULE picker below is a second stepper whose name
   IS the `<select>` (optgroups, disabled reasons and native keys kept; ‹ › and ← → walk the page's enabled rows as a hand pick) and holds that one section"
2. **CLAUDE.md :49-50 (M8, STALE).** Old: "Below the header and the top rows (ON, MOLECULE, BASIS, VIEW + ORBITAL — VALENCE takes the dial's seat under
   DENSITY, 0.4.0 S4c)" → New: "Below the header and the rows ‹ MOLECULE ›, BASIS · ORBITAL (VALENCE takes the dial's seat under DENSITY, 0.4.0 S4c) and
   VIEW · the fold's chevron (five lines at 300 px and at phone width, 0.5.3 M8)"
3. **CLAUDE.md :100-101 (M10, STALE).** Old: "THE FADE: a HAND's preset (STATE's PRESET and RELOAD, MO-REGISTRY's WINDING / HOMO + LUMO and STATES presets)" →
   New: "THE FADE: a HAND's preset (STATE's PRESET and RELOAD, MO-REGISTRY's eight ORBITAL presets — HOMO · LUMO · HOMO + LUMO · FRONTIER FOUR · HOMO SET ·
   LUMO SET · WINDING · OCCUPIED, one table in `lab/orbitalsview.js` since 0.5.3 M10 — and its STATES presets)"
4. **CLAUDE.md :97 and :117 (M9, STALE: two switches, two SIZEs).** Old ":97 nothing is added while the switch is off (the root `hidden`)" → New: "nothing
   is added while STAGE FORMULA is off (the root `hidden`)". Old ":117 an atom label its body (14 px), each × SIZE." → New: "an atom label its body (14 px);
   the formula and an announcement × STAGE FORMULA's SIZE, an atom label × ATOM LABELS' SIZE."
5. **CLAUDE.md :113 (PRE-EXISTING, the pointer).** Old: "(`toScreen`, written only when the camera, molecule, size or canvas changed)" → New:
   "(`lab/shell/stage-words.js` `atomLabels` through `field.js` `toScreen`, written only when the camera, molecule, size or canvas changed)"
6. **CLAUDE.md :89-90 (PRE-EXISTING since the base: the word is doubled across the line break).** Old: "(`createInfoLayer` in `lab/shell/stage-words.js`
   `initStageText` / `initStageText`, 0.5.1 D1;" → New: "(`createInfoLayer` in `lab/shell/stage-words.js` `initStageText`, 0.5.1 D1;"
7. **docs/STATE-SCOPES.md :112 (M6, NOTE).** Old: "The camera feel (friction, spin, drag gain, fling) stays PREFERENCE." → New: "The camera feel (friction,
   spin, drag gain, fling, and since 0.5.3 the LOCK `camLock`) stays PREFERENCE."
8. **Code comments under `lab/` (M9; reword when next opened, then `pwa --write`):**
   - `lab/shell/settings.js:9` "the STAGE TEXT's SIZE knob (Settings › Display)" → "the STAGE FORMULA's SIZE knob (INFORMATIONAL, 0.5.3 M9)"
   - `lab/rack.js:687` "THE STAGE TEXT (Settings › Display; 0.4.0 S3 · F2; 0.5.1 D1 below)" → "THE STAGE TEXT (INFORMATIONAL's STAGE FORMULA since 0.5.3 M9; 0.4.0 S3 · F2; 0.5.1 D1 below)"
   - `lab/lab.css:801` "rack.js initStageText" → "lab/shell/stage-words.js initStageText"

## 6 · The fix-round candidates, judged

**(a) The subtract list.** The proof greps every `lab/` file, kit and JS included, and every `tests/` and `tools/` file.
- **`lab/skin.css:325`** `.native-clean[data-id="palette"] .palette-action { … }`: **SUBTRACT.** `grep -rln "palette-action" lab tests tools` returns only
  `lab/skin.css`, and only this rule. No JS builds the class: `grep -rnoE "palette-[a-z]+" lab --include=*.js` lists only `palette-enable`, `palette-app`, `palette-mark`.
- **`lab/skin.css:368`**, `.native-clean[data-id="palette"] .pal-nav` inside `@media (pointer: coarse)`: **SUBTRACT this selector only.** Keep
  `.native-info-button` and `.native-tempo .trig`.
- **`lab/lab.css:466-474`**, the `.pal-nav` block (its WAVE 101 comment, 2 blank lines, `.row > .trig.pal-nav`, `::before`, `.pal-nav > svg`): **SUBTRACT.** Its
  last user was the base's `chemview.js:85` `trig({ cls: 'pal-nav mol-turn' })`; M8 replaced it with the kit stepper (`.mir-step-b`). `grep -rn "pal-nav" lab
  tests tools` outside CSS returns nothing, nor does `grep -rln "pal-nav" lab` (`lab/lab.css` and `lab/skin.css` only), and `mol-turn` has no user left.
  PAL-BUILD cited :326/:369, which are :325/:368 on the tip. `.pal-color` (`lab.css`, `settings-card.js:94`) stays: it is live.

**(b) The "Open:" tails in CHANGES-0.5.3.md.**
- M12, "MIR's stylehash unmeasured": **closed here** (c). M12's "`.palette-action` and the coarse `.pal-nav` dead": **still open**, now SUBTRACT (a).
- M11, "with window NOTES shown the readout keeps its own line": **still open, for Josh** (N5).
- M6, "the lock-ON runs are the verifier's": **closed** by B-CAM-2 (`7e881cb`, the LOCK pictures) and re-measured here on the merged tip (gate 2).
- TR-BUILD's unrun closers (history, frame-occlusion, film-handover, stage-text, current, node gate): **closed** (HANDOFF 19:27 and this estate).
- DISP-BUILD's "settings-probe and the M9 suites ran before `f4556ac`": **closed**, all run on the merged tip. CAM-BUILD's "M7 not checked in a browser": **closed** (c).

**(c) "Could not measure", measured now on the merged tip.**
1. **MIR's stylehash, one attempt.** Launch: the stage probe's playwright Chromium with `--no-sandbox --ignore-certificate-errors --enable-features=Vulkan
   --use-angle=vulkan` (a CHROMIUM wrapper), `--gpu 1`, ready = `__LW.field.ok`. **It runs on this rig.** It compared base vs tip with base2 as noise,
   everything OUTSIDE the two racks (`--skip 'canvas, #rack, #rackL'`), in `light-refractive-on` (the desktop first run) and `dark-tinted-off`: **0 of 123
   elements changed in either state**, so the menubar, the transport pill, the stage words and the floats are neutral. Pixels differ only in the rack columns
   (x 1200–1500 and a sliver in x < 200), where the 0.5.3 cards changed on purpose. 0 pixels differ in the stage between the racks.
2. **THE LOCK for B-MOL's rows** (MOL-BUILD "I ran no digest lock"): 860 and 1004 · 0/0 on the merged tip.
3. **M7 in a browser:** the CAMERA note contains "Alt(+Shift)+Drag … slide the picture 1:1 (Shift does not make the pan finer)" on the tip; the base's does not.
4. **M8's rows at 300 px (`.tmp/dom-tip-desktop.json`):** 5 visible lines. INSTALLED · MOLECULES ON share line 2 when INSTALLED shows (LATTICE); ON stands alone
   there when the section is all-live (HYDRIDES). DISP-BUILD §1 says the same; its lattice PNG does not (N2).
5. **M11 at a narrow viewport:** Firefox's headless window floor is 500 px (B69's note), so 390 px is not reachable with the gate's driver. At 500 px the A / B row is
   **one row**, 64 · 48 · 64 · 48 px, with no label overflowing.
6. **M12's float at a narrow viewport** (PAL-BUILD's guess): at 500 px, on a 134-px strip, the float stays inside the card at all 6 stops of PRISM. The 36-px
   clamp seats the floats of the first two stops at the same x (48–92), which is by design.
7. **`current:138` "did not reproduce" for B-DISP-2:** it does here, on both trees (N1).

## 7 · The harness, closed

My three servers were stopped by pid: 1711059 (9007, after gate 2), 1699824 (9003) and 1699826 (9005). After each run no geckodriver, marionette Firefox or
headless Chromium of mine was left. The editor's playwright MCP and the integrator's 8731 / 8735 were never touched. The `zz-before` symlink was removed;
`.tmp/` is git-ignored. I edited nothing under `lab/`, `tests/`, `tools/`, `docs/` or `CLAUDE.md`. This file is the one commit; nothing was pushed.

**FIT TO CUT: NO**
