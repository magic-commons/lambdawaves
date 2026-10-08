# REVIEW-SONNET-0 · first reviewer of PLAN-DRAFT-0 for 0.5.0 (Sonnet 5.5, 2026-10-08)

Read, whole: `NACRE.md`, `PLAN-DRAFT-0.md`, the 0.4.0 `PLAN.md` (§2, §6, §7, §8, §9 and the rest), `survey/MIR-1.5.md` (334 lines), `docs/MIR-1.5-CANARY.md`,
`KIT-BRIEFS.md` (341), `survey/SIBLINGS.md` §1 and rows 1, 2, 4, 6, 7, 8, 9, 19, 20, 21, 33 (the file has no §0), the S2/S3/S4a/S4b/S4c hand-offs, the 0.4.0
`NACRE.md` and `HANDOFF.md` §3–§6, `CLAUDE.md`, `docs/STATE-SCOPES.md`, the kit's `docs/ADOPTING-1.5.md` (186 lines, alpha.24) and `PROMPT.md`. Spot-checked
read-only on the tree at `12451d2`: `lab/rack.js` (5,728 lines; anchors by grep), `lab/mir/modulation/host.js`, `lab/stage-gestures.js`, `lab/index.html`, `lab/sw.js`,
`lab/names.js`, `tests/wiring.test.mjs`, `tools/perf/digest-lock.mjs`, `docs/OPTIMIZATION-2026-09-24.md`, `docs/LEGACY-WINDOWS.md`, counts by `grep` over `lab/*.js` and
`tests/*.mjs`; in the kit only `ls` of `mir/{info,controls,shell,locales,core}` and three named files (`mir/version.js`, `mir/core/i18n.js`, `mir/shell/language.js` — empty of fetches).
Nothing was run (no suite, no browser, no lock).

Tags: OK / PARTIAL / WRONG / MISSING. `D:n` = PLAN-DRAFT-0 line n · `P:n` = 0.4.0 PLAN.md · `A:n` = survey MIR-1.5.md · `KB` = KIT-BRIEFS.md · `CAN` = docs/MIR-1.5-CANARY.md ·
`rack.js:n` = THIS tree (12451d2), never the survey's older numbers. DERIVED = my arithmetic from a measured figure; UNVERIFIED = no source found.

---

## 0. The verdict, in eight lines

1. **The skeleton is right.** The three gates, A → B → C → D, the leverage order of C (it is A:333 verbatim), one verifier on the adoption, the honest "what is not claimed" (D:127–131).
2. **Stage A re-opens what 0.4.0 settled, without new evidence.** P:93–101 cut the seams "to one" and let a canary row name the rest; CAN:12–14 says a bare adopt "cannot confirm or refute" R1, R3, R6, R8, R10, R14. The only seams the canary names are A10, A11, the `new-project` regeneration and the `wiring` red.
3. **A's acceptance is false as written.** "Every seam's lines ≤ before; A4 and A5 are the big subtractions" (D:53–54) against the repo's own measurement: two seams cost rack.js −248 and `lab/` **+41** (OPTIMIZATION W130, line 137), and every 0.4.0 stage added (S3 +53, S4a +250, S4b +55, S4c +88). A4/A5 are relocations; the deletions happen at C3/C4.
4. **"Five builders, disjoint regions" (D:122–123) is false on this tree**: eleven shared sites, two of them inside the frame loop `loop()` (§1.6).
5. **"The seven node reds gone" (D:55) is covered for five.** `new-project` (bpm 60 → 30) and `wiring` (109 unreached modules) have no seam; the base has also moved (85 node suites, not 82).
6. **C has no row 0** (the bare adopt, the cascade, the hooks: BASINS' stage 1, where the whole R5 fight lives). **D drops five rows P:381–386 gave to 0.5.0**, D2 is unbounded, D4 asks the layer for something its API cannot do.
7. **G1 over-states what the briefs block.** KB's own "Interim" paragraphs mean C1–C7 wait on no brief; they wait on the cut and on Josh accepting churn. The default (wait) makes the release headline unschedulable.
8. **Rulings:** two are not λWAVES' to take (R5-G1 option 3, R5-M1), one is already Josh's instruction (R-I1), the KEYBOARD default inverts his own R-F1, and the one thing he said today (the camera bindings) is a passive "a row when he names them".

---

## 1. By section

### 1.1 §0 inputs and §1 gates (D:8–30)

| Draft says | Tag | Evidence |
|---|---|---|
| D:12–14 the canary row: 7/82 red, 9.5 MiB, "~25 % restyled", browser 3/3 | OK | CAN:20, items 1–9. |
| D:14 "1,172 diffs, the same order as BASINS' 192" | WRONG unit | 1,172 is element-**states** over 8 states; BASINS' 192 is distinct elements (A:107). The comparable is 136–150 of 595 elements per state (CAN:20, item 9). The "same order" claim survives; the pairing 1,172 vs 192 does not. |
| D:12 "7/82 node suites" as the target | PARTIAL | The tree has **85** node suites and **27** browser suites (`ls tests`); the canary base was `61f7c2c` (CAN:24–25). S1–S4 added suites after it. The red list is a lower bound (CAN:29–31: each red is the FIRST assertion; `mir.test.mjs` is 1,733 lines and dies at its import). It must be re-taken on this tree before it is a target. |
| D:15–16 BASINS +1,850 / −19,320 and the stage-8 lesson | OK | A:121, A:116 (45.0 vs 32.0 ms/s = +13 ms/s). |
| D:18–19 kit side: alpha.24, briefs 8/4/7/13 unbuilt | OK | `mir/version.js` = `1.5.0-alpha.24`; `ls mir/controls` has no `cells.js`/`lattice.js`, `ls mir/info` has no `window.js`. |
| D:23–27 gates table | PARTIAL | See below. |
| D:29–30 R5-G1 | PARTIAL | Option 3 "(the MIR session's call, not ours)" is not a ruling about λWAVES. |
| (absent) the wiring clock | MISSING | `tests/wiring.test.mjs:61–65`: five allowlist rows dated **2026-10-07**, `EXPIRE_DAYS = 60` (`:463`). The untouched tree goes **red on 2026-12-06** (warning from 2026-10-21). Their stated consumer is "the 0.5.0 adoption" (`ABOUT, accent, menubar, notebook, wordmark`). A wait-for-1.5.0 default runs into this date; the draft never names it. And only three of the five consumers appear in C (accent C2/C6, menubar C3, notebook C6); `wordmark` and ABOUT have no row. |

**G1 (D:25).** It lists what brief 8 "blocks": the occlusion road. KB 8 "Interim" says keep the enumerator and "a temporary host provider may enumerate the new kit hooks" — that is exactly A7. Brief 2 "Interim": the app's PAN knobs and PAN HOME stay. Brief 4 "Interim": keep ATOMS/SPECTRUM pickers. Brief 6/7 "Interim": keep the caption. Brief 13 "Interim": keep `createStageText`. So **C1–C7 are blocked by no brief**; only C8, D1, D5, D7 are. That changes the default of R5-G1 (§4).

**G2.** "Wait" makes C and D unschedulable: the cut is "open (FOR-JOSH 10-07)" (D:19), the kit is already one commit past alpha.23 (NACRE:19–21); CAN:80–82 measured the previous move, alpha.22 → .23, at one file. BASINS chased every alpha (11 stages, A:12) and counted four parity re-adopts (A:166). A **pin** (adopt one alpha at C0, freeze it, re-adopt once at the cut) is the missing option.

**G3** OK.

### 1.2 Stage A — the eleven seams (D:34–55), seam by seam

| # | Tag | What is right (survey line) / what is wrong or missing (this tree) |
|---|---|---|
| A1 settings adapter (D:41) | PARTIAL | Right: `{read,write}` feeds `createRack({store})` (A:43, A:172). Wrong: the gate "byte-identical outside WORKSPACE (the existing suite)" sees only the blob, but `rack.js` writes that blob at **8** sites (`:193, :1309, :2779, :3825, :3829, :4288, :4291, :5648`) and keeps five other storage families: `NB_KEY/NB_TITLE/NB_SUBTITLE` (`:4031–4169`), `PJ_KEY` (`:4072–4193`), `LS_EXP/LS_PRES` (`:4924, :4935–4936`), the keymap (`keys.js` ×4), the library (`library.js` ×2). The draft must say which the adapter owns. The right gate is the precedent W130 used: "serialize bytes identical on 11 snapshots" (OPTIMIZATION:137) plus a whole-`localStorage` snapshot diff on a project open. |
| A2 look store (D:42) | WRONG scope | On this tree the look code is the INTERFACE group (`:1300–1324`) and THEME · SURFACE (`:1325–1455`, `setTheme` `:1333`): **~155 lines**, not the survey's "~267" (A:140, whose range 1264–1530 also swallows DRAW, CLIP and PALETTE groups). And `createGui` deletes it at C2; only the one-time lift survives. Build it at C2 or not at all. |
| A3 project parts (D:43) | PARTIAL | Right (A:174). Missing: the kit registers **its own** parts — `pages`, `accent` (R2) and, since alpha.23, `rack` and `bpm` (ADOPTING-1.5 §13, line 177) — beside λWAVES' `modulation` record (which carries the transport/BPM) and WORKSPACE `layout`. After C4 there are two sources of truth for tempo and layout unless A3 decides now: `installModulation({project:false})` or `registerModulationParts` (ADOPTING:177). `serialize` `:4828–4883`, `restoreModulation` `:4893–4923`, `restore` `:4930–5107` = ~280 lines that get **split**, not deleted. |
| A4 floating rack (D:44) | WRONG range, WRONG value | Measured here: float helpers `:3514–3571`, `const layout` **`:3572–3853` (282 lines)**; then `wTr`, MENUS (`:3954`), `projectKey` (`:4097`), NB/PJ (`:4031–4193`), notebook size (`:4288–4291`), drag/reorder (`:4325–4500`) up to `enterPhone` (`:4501`). The "~1,065" (A:140) mixes four owners (A9, A3, C6, A4). The survey's own ranges **nest**: 3708–3870 and 3873–4200 lie inside 3307–4370, so if the ~1,065 is the whole range, **495 lines are counted twice** inside the 9–10.5k (A:138 + A:140; DERIVED). The kit's `createRack` adopts `#rack #rackL #floats` by id (A:43), so the only residue worth buying is "no reference outside the block": **19** references to `#rack/rackL/#floats` in `rack.js` outside `:3514–4500`, 22 inside, +1 in `modwindow.js`, none elsewhere (grep) against BASINS' 70 (A:109). The real value of an A4 facade is the test surface: `__LW.layout` has **137** call sites in tests, `__LW.mod` 93, `__LW.history` 67, `__LW.keys` 13, `__LW.projects` 8, `__LW.notebook` 8 = **326** (grep). Keep those verbs stable; do not extract 1,065 lines to delete them at C3. |
| A5 modulation port (D:45) | PARTIAL | The one seam the kit documents "key for key" (A:57). Measured: `defs` `:2530–2644` (115), `createModHost` `:2645–2653`, adapters and `modDodge` `:2654–2743`, `createModulation` port `:2744–2786` (43), `modSyncBases` `:572–607`, `LW.mod` ≈ `:5395–5430`: **≈ 330 lines**, not "~440 → ~150"; the saving is C4's, not A's. Keep; it survives as the port. |
| A6 one-clock facade (D:46) | PARTIAL | Right that the facade survives (A:177). Wrong in three ways. (i) It folds R-B1 (retire LINKED/SEPARATE; `modArm`/`clockLink` leave PREFERENCE) into a stage billed "λWAVES only, lines down or equal": that edits STATE-SCOPES' AUTO-SCALE row (`modCadence, modArm, clockLink`), `new-project`, five test sites (`__LW.mod.clockLink` ×5) and `ACTIONS` `:4736`. (ii) It never names the mechanism: `lab/mir/modulation/host.js:474` already has `demand(id, on)` on 1.4.3, so the facade can hold `'app.play'` **today** and close S0's open item (fresh-boot/NEW refusal `nothing-to-run`, `host.js:352`; KB "LINKED refusal"). That is A6's real acceptance. (iii) Its gate lists `current`, which fails identically on the untouched base at loads 10–22 (S2-CAMERA-BUILD, Blockers). Sites: `:550–551, :862, :912–921` (**inside `loop()` `:855–1132`**), `:2759, :3064–3103, :4736, :5413–5414, :5697`, and `saveSettings :199`, `applySettings :296–298`. |
| A7 occlusion providers (D:47) | PARTIAL | Right: providers, 32-rect cap, paused-PRESENT law (A:178; KB 8 Interim). Wrong: the gate "the 588 lock" is **blind to A7** — `digest-lock.mjs:34` "the block the lines read is set explicitly before every capture". The only closer is `frame-occlusion` (126 lines, 7 blocks), keyed on `#modwin .m2rail/.m2dev/.m2workbar` and `.kwin-chiprail .crail-chip` (`:13–17, :53`): it sees no kit species. And the `occludeDirty` producers sit in three other groups' regions: `:2700` (`modDodge`, A5), `:3503` (A7), `:3527` (`placeFloat`, A4), `:3995` (`keymapMoved`, A4/A9). |
| A8 camera port (D:48) | OK, one addition | Sites: `:1258` (`createCameraLaw`), `:1525–1589` (CAMERA MOTION; `r4p :1567–1570`), `:2542–2545`, `:3220`, `:3349`, `:4616`, `:4820`. The 588-lock gate is unnecessary (no `writeView` change). Missing: Josh's pending binding change (§3) — today it is code in `stage-gestures.js` (`e.altKey && !e.ctrlKey ? slide(e) : startSpecial(e)`; only `e.button !== 0` is left alone). Make the bindings one table here, so his change is a diff of data and brief 1 receives it as configuration. |
| A9 actions table (D:49) | PARTIAL | R-K1's second half "MOD arm on Ctrl+Space" **is already the binding** (`rack.js:4736`: `key: 'Space', ctrl: true`). The rename list names ids this tree does not have (`folders`, `help`, `transport.play`, `hide`): ours are `play, fullscreen, notebook, hideUI, keysheet, rack, dock, save, saveAs, modWin, modBar, modArm, undo/redo/redoY/historyUndo` (`:4683–4760`). ADOPTING §11 (alpha.19) also makes every kit window a row (`history, render, gui, gui-about, keyboard`, no chord). `data-key-action` goes on every control that carries a key hint, so A9 reaches into the device builders (`:1229–2800`) that A2, A5 and A8 also edit. |
| A10 tests by hook + 4 rewrites (D:50) | PARTIAL | Covers four of the five gate rewrites (§1.1). The id-selector problem is small: 26 occurrences (`#modwin` 12, `#offer` 6, `#notebook` 4, `#rackAddList` 2, `#keymap` 1, `#sheet` 1) and 50 lines with `.km-`/chip-rail selectors in 7 suites (grep). ADOPTING §10's removed names appear in **one test** (`tests/mir.test.mjs:27, :1325`) and nowhere in `lab/` (grep). The real coupling is the `__LW` surface (326 sites, A4 row), which seam 10 does not mention. |
| A11 precache policy (D:51) | PARTIAL | `sw.js §1b DATA` (`sw.js:224–231`) is "never precached, cache-first from `lw-data-v1`, **written by the page**": a different semantic from a skip list. Skipping `mir/locales/` is safe for English (`core/i18n.js:3–4` "English is the key and the fallback"; `:6–7` packs load on demand) but a LANGUAGE menu offline would silently stay English (ruling, §4). The "7.3 MiB measured" (D:51) is CAN item 1's derived figure on a base that precached 4.63 MiB; this tree precaches 188 files / 4.53 MiB (S4a-BUILD), so ≈ 7.2 MiB (DERIVED). Headroom to the 8 MiB ceiling (`pwa.test.mjs:302`) is **0.7 MiB**, before the kit grows between alpha.24 and 1.5.0 and before `info/window.js`, `cells`, `lattice` land. The rule P:451 designed is "precache what a root reaches" — it would also close the `wiring` red (109 modules, CAN item 2); a skip list does not. |

**Done-when (D:53–55)** WRONG on three counts: the lines claim (above); "seven reds gone" (§1.1; `new-project`'s bpm and `wiring` have no seam, and a bare adopt can only regenerate `new-project.lambdawaves.json` on the throwaway, P:453–454); and "the throwaway canary re-run on alpha.24" is **a third and a zeroth canary run** the draft does not schedule (§1.3). "No verifier" is wrong for the frame-loop groups (§6).

### 1.3 Stage B — THE CANARY II (D:57–60)

OK: the recipe plus "opens the modulation window and the notebook" fills the gap CAN:77–79 and CAN:92–93 name; "every browser suite" = 27, once, is fine. PARTIAL on timing: A's own done-when needs a canary on alpha.24 (D:55), so B is also **step 0 of A** (the current red list, on 85 suites; the stylehash recipe fixed so R13 is measured before C4) and **A's last step** — three runs, not "one at the cut". MISSING: the M5/WebKit half. The kit ships the instruments (`probe.mjs serve`, `check-app.mjs --webkit`, A:93) and BASINS ran "WebKit not runnable on this machine" (A:113). One command for Josh, now (§3, M5).

### 1.4 Stage C — THE ADOPTION (D:62–78)

| Row | Tag | Note |
|---|---|---|
| **C0** (absent) | MISSING | BASINS' stage 1 (A:107): the real `adopt.mjs`, **index.html** (`lab/index.html:53–56, :67–68` link kit CSS sheet by sheet; 1.5 is `mir/mir.css` with `@layer app, mir;` before `base.css`, ADOPTING §4, lines 51–53), the chip hooks (ADOPTING §1–2 are **not** hit: no `window controls` label selector and no `data-ink` in `lab/`, grep; CAN:64–69), the app's unlayered rules on kit windows (`lab/skin.css:106–107` `#modwin.mir-modwindow .m2workbar …`) that beat the kit's layers, the app's **32** `!important` lines (`lab.css` 12 + `skin.css` 20; A:156), the twin `:not(:where())` rules. BASINS: 192 elements, 81 INTENT rulings, 16 noise, 111 `!important` left alone. G3 says "stage C's first commit"; the table has none. |
| C1 CAMERA, RAMP/GRADE | PARTIAL | Order OK (A:333). Missing: saved routes. λWAVES' ids are `observer.*` (`rack.js:2530–2545`) and `mat.*`; the panel's are `camera.<id>` unless `modPrefix` says otherwise (A:88; KB 2 "retain those saved-route names"). A project saved today must still route after C1/C2: one script over `lab/demos/*.json` (4 files) + `new-project.lambdawaves.json` asserting every route resolves. The "1004 lock" here is over-verification (§6). |
| C2 `createGui` + `createPrefs` | PARTIAL | R2 first: OK (A:153). But the byte-identity invariant is defined on `lambdawaves.q0.settings` only; after C2 the look lives in `mir.gui` and the kit adds `mir.transport, mir.tier, mir.gui.tab, mir.flashNotice, mir.notes` and FOLDERS' library (A:153, A:314). Extend it to a whole-`localStorage` snapshot minus WORKSPACE, and rewrite the STATE-SCOPES table. Unspoken consequence: `createGui` brings the **MIR OPTIONS window**; Josh wrote "Leverage the 'Display' setting in the Settings rack window (Not MIR options)" (0.4.0 `NACRE.md:77`). Two settings surfaces is a ruling (§4). |
| C3 rack + transport + menubar + keys | PARTIAL | Deletes `keymap.js` (934 lines) and with it the app-owned KEYBOARD window: `keyboard-window.browser-test.mjs` (112 lines: `.km-panel`, `__LW.keymap`, the 416 px assertion) is rewritten wholesale — the largest test rewrite in the plan, unnamed. No test for the `Ctrl` vs `Mod` spelling of Ctrl+Shift+Q/E (macOS Cmd+Shift+Q logs out; A:159). |
| C4 modulation + one clock | OK | Gate list is right; `current` is flaky (A6 row). |
| C5 history | OK | `history` 39 scenes; also flaky under load and prone to the geckodriver port race (S2: `EADDRINUSE 127.0.0.1:5215`, cured by a 4 s pause). Fix once in `tools/gate/drv.mjs`, not by test edits, since C5/C9 close R3/R4 with `history` and `offer`. |
| C6 FOLDERS + notebook + parts | WRONG placement, MISSING | `accent-wheel.js` (152 lines now, D:71 says 149) belongs to **C2**: its kit twin is `createAccent`, consumed by `createGui` (A:134, A:67). Missing: `createSession` (autosave/RESUME) — `rack.js` `save()` `:4924` and the boot read `:4935–4936` — and the opener; the R10 lift has no new test (`project-storage.js` 25 + `project-import.js` 41 lines die and take their suites with them; "an invalid collection never becomes an empty writable one" and the 8 MB vs 24 MB cap, A:138, A:161, need a fixture). |
| C7 the film | PARTIAL | "the exact-time law's 39 gates kept" (D:72) while ~1,200–1,800 of `capture.js` + `render-exact.js` (**2,360** now: 1,127 + 1,233, not 2,330) leave. `tests/render-exact.test.mjs` (716 lines) imports the module being removed. Say which lines stay (jitter seed 13, the H1–H3 hazards in the digest-lock header) and re-aim the gates at them. This swap, not D5, is the determinism risk. |
| C8 occlusion | OK | The 1004 lock is unnecessary; `frame-occlusion 7/7` has no kit species (FOLDERS, GUI, KEYBOARD, notice, dialog, banner, INFORMATIONAL pane: A:152 and KB 8 list them). |
| C9 offline layer | PARTIAL | R14 has no named closer: `gpu-recovery.browser-test.mjs` (37 lines) exists but is not named; FOLDERS `thumbnail()` of a WebGPU canvas needs a readback (A:73; `capture.js`'s readability probe is the app's tool). **The scene guard** (ADOPTING §5; A:83; `createSceneGuard({install:false})` called from `stage-gestures.js`) and BASINS' `hit-probe` ("25 inside / 0 through", A:103) are nowhere in the plan: a press in a kit window's gap would orbit the camera. |
| C-V verifier | PARTIAL | "every diff an INTENT ruling or a bug" — the unit is the class, not the diff: CAN item 9 lists **seven** property classes (press-scale transition 552, box-shadow 448, focus outline 3 × 184, `.dev-head` background 165, ON text-shadow 132, backdrop-filter 64, border 64). Seven rulings with a screenshot each is a gate Josh can hold; 1,172 is not. "Device report equal" cannot see the lesson it cites: stage 8 was +13 ms/s (45.0 vs 32.0), i.e. **1.3 % of main-thread time**, while the report's fps swings 7.8 → 13.8 → 19.1 across sessions (S2, S4c). Needs a CDP `Performance.getMetrics` delta (`tools/perf/cdp.mjs` exists) and an M5 baseline taken **before** C. |

### 1.5 Stage D — THE INFORMATIONAL (D:80–95)

| Row | Tag | Note |
|---|---|---|
| D1 window + `stage-text.js` out | OK / PARTIAL | The mapping (formula → `addBlock`, fade → `addLabel({ttl})`, atoms → `addLabel({anchor})`) is KB 13/7 and S3-BUILD's notes. Missing: a cost number. `viewChanged()` runs `frame.read` + `computeRests` + a 12-pass `bodies` resolution + the seat chooser **every frame** under AUTO-ROTATE/WASD/FLING (A:201); BASINS measured pan ~30 fps with rack glass vs 60 hidden (A:204). The gate "0 per-tick layout reads" is S3's witness counter for `stage-text.js`, not the layer's. |
| D2 pages as content | WRONG / MISSING | Unbounded ("per molecule, per named orbital, per state, per window"): the library has 38 records + 4 demos, benzene alone has dozens of orbitals, the audit counts 27 cards. "A Sol or Haiku 5.5 task, reviewed once" collides with the closed Sol thread (P:428 D4; NACRE:30–31) and with how `CURATED_IE` became UNCHECKED (`names.js:467`; S1-NAMES-BUILD:54 "entered from memory"). Pages must be **generated from the record** (S4a schema 1 already carries formula, group, gap, HOMO name, the page); bulk ionisation energies per state trigger the SRD 101 ruling S4b recorded as Josh's ("or NIST's licence"). The greeting-on-open (kit: shown when the project opens, A:192) contradicts the 0.4.0 law "announces only on hand presses (never on restore, undo, project open…)" (P:137–138). |
| D3 feature labels | OK | Missing in the kit (and in the 17 briefs): **label avoidance of windows** — the kit does it for blocks, "**not for labels** (a label can sit under a window)" (A:219). With the lens shift (±1 NDC, S2) the pivot and its atom labels can sit under a rack column. |
| D4 overlays as movable layers | WRONG vs API | SHADOW's phasor wheel, ORBIT's rotor spheres, PLANE's mini are canvases; the layer places markdown labels and blocks (`addLabel({anchor,title,md})`, `addBlock({md,hold,pane,id})`, A:211). An 18th brief ("a layer hosts an element") or a scope cut to text. "Persists in WORKSPACE": a label's position is WORKSPACE (arrangement) or PROJECT (R-I3: pages travel)? STATE-SCOPES needs the row. |
| D5 film overlay + TAKE MODE | OK | The verifier belongs equally on C7. |
| D6 FIGURE, chips, FLY-TO + search, SCENES, MAPS | PARTIAL | Five features, one stated "out" (SCENES replaces A/B). P:391–404 had a one-in-one-out table; D has none. |
| D7 pad, `cells` | OK | KB 4/5; the deletions are small: 38 gross lines for `cells` (ATOMS 13, CALCULUS 9, SPECTRUM 11, the MOLECULES header 5) and 0 for the lattice mounts (KB 5). |
| D8 `lw:` links, HUD | OK | Josh's own "who knows" (0.4.0 `NACRE.md:46`). |
| D9 legacy five | WRONG default | "Re-adopt H₂⁺ and HELIUM as pages + layers" (D:111): they are **field owners** (`docs/LEGACY-WINDOWS.md`: "HELIUM, H₂ — field owners… so a live field owner never loses its OFF switch"). Pages and layers show text; they cannot own ψ. Options are a window, a MOLECULES/preset demo, or deletion with a restore shim. |
| Omitted rows | MISSING | P:381–386 sends SIBLINGS **8** (library gallery: FOLDERS tiles for ORBITALS (l,n), ATOMS, MOLECULES), **19** (flash guard: the kit's judge, SIBLINGS row 19), **20** (opener/title card: row 20; BASINS deleted `startup.js` (240 lines) for it, A:114), **21** (the ink law, row 21: "λWAVES' field is a bright, moving picture under frost glass, the exact case the law was made for") and **24** (CURVES) to 0.5.0. None is in D and none is in "not claimed". |
| D:94–95 | WRONG | "RPA root names in SPECTRUM (the Sol thread's C3)" is placed in 0.5.x; P:328 and P:427 (D2: "C3 enters 0.5.0 THE INFORMATIONAL's pages-per-state") put it in 0.5.0. D:125 "One Sol thread, if any" re-opens a thread Josh closed. |
| 0.4.0 tail | MISSING | Not one word on 0.4.1 BUCKYBALL (P:326; S4c: C₆₀'s geometry is Sol's DRAFT equal-edge ideal I_h; "B4 (C₆₀ at the experimental geometry) precedes 0.4.1's I_h names") or on whether 0.4.0 is cut. |

### 1.6 Order and "disjoint regions" (D:120–125): can five builders work disjointly? No.

All lines are `rack.js` on this tree.

| Shared site | Lines | Claimed by | Also edited by |
|---|---|---|---|
| `saveSettings` / `applySettings`; the three keys that leave PREFERENCE | `:170–331`; `:199`, `:296–298` | A1 | A6 (`modCadence, modArm, clockLink`), A2 (look keys) |
| `SETTINGS_KEY` writes | `:193, :1309, :2779, :3825, :3829, :4288, :4291, :5648` | A1 | A5 (`:2779`), A4 (`:3825, :3829, :4288, :4291`) |
| the frame loop | `loop()` `:855–1132`: occlusion call `:862`, LINKED follow `:912–921` | A7 / A6 | each other |
| `occludeDirty` producers | `:2700, :3503, :3527, :3995` | A7 | A5, A4, A9 (`keymap`) |
| modulation port | `:2530–2786` | A5 | A6 (`armed/arm` `:2759`), A7 (`:2700`), A8 (`:2542–2545`) |
| transport / clock | `:2882–3061`, `:3064–3103` | A6 | A5, A9 (`:4736`) |
| layout, menus, projects, notebook | `:3514–4500` | A4 | A3 (`projectKey :4097` is A3's `signature`), A9 (MENUS `:3954` call `ACTIONS` ids), A1, A7 (`:3527`) |
| `ACTIONS` | `:4683–4760` | A9 | A6 (`modArm :4736`), A8 (the four Alt+Arrow rows), A5 (`modWin, modBar`) |
| `serialize` / `restore` | `:4828–5107` | A3 | A5 (`restoreModulation :4893`), A6, A8 (`:4820`) |
| `api` / `LW` literals | `:1211–1265`, `:5330–~5608` | all | every group adds or renames members |
| device builders (`data-key-action`) | `:1229–2800` | A9 | A2, A5, A8 |

Consequences. (1) "Merged in that order" with A4 second means groups 3–5 edit lines A4 has already moved out of the file: git reports modify/delete, not a clean merge. A4 goes **last**, or becomes "zero outside references". (2) A6 belongs with A1 (the keys), A7 after A5 and A9 (its producers live in their regions). (3) The only truly disjoint group is **A10 + A11** (tests, `sw.js`, `tools/`). A workable cut: X = A1 + A3 + A6 (keys and records); Y = A5 + A8 (ports); Z = A10 + A11 first, then A9 and A7; A4 last. (4) No stage carries a size (S/M/L) or a date, which the 0.4.0 plan did.

---

## 2. The fifteen risks (A:150–166): is each closed by a named test?

| R | Draft closer | Verdict |
|---|---|---|
| R1 occlusion | A7/C8: `frame-occlusion` 7/7, 588/1004 lock | PARTIAL. The lock is blind to it (`digest-lock.mjs:34`); the suite has no kit species. |
| R2 three scopes | C2: `new-project` byte-identity, `projectAccent:false` | PARTIAL. Blob only; the kit's `mir.*` stores are outside it. |
| R3 history ring | C5: `history` 39 | OK (flaky harness). |
| R4 offline | A11/C9: `pwa` ≤ 8 MiB, `offer` 16 | PARTIAL. `wiring` (109 modules) unnamed; "STATUS TAGS off keeps the offer" (brief 9′) needs a case in `offer`. |
| R5 cascade | C2: stylehash | PARTIAL. By design a tool, not a suite; needs C0 and the seven classes. |
| R6 two clocks | A6/C4: `take-in-bugs`, `current`, `history` | PARTIAL. No test of KB "LINKED refusal" acceptance (play with editor closed, no route, power off); `current` is a flaky closer. |
| R7 first-run | C2: `first-run`, `official-defaults-palette` | OK. |
| R8 keys | C3: `keyboard-shortcuts`, `keyboard-window` | PARTIAL. The second is rewritten wholesale; `Ctrl`/`Mod` untested. |
| R9 ids and labels | A10 | PARTIAL. Small (§1.2 A10), unnamed. |
| R10 project/notebook formats | C6: `new-project 8, history, offer, molecule-demos` | **NO.** None tests the collection lift or the size cap; the two suites that did die with their modules. |
| R11 NEW / empty project | C6, A10: `new-project` 8, `--check` | OK. The bpm regeneration belongs to the throwaway too. |
| R12 byte-pin tests | A10 | OK for naming; `mir.test` §16 needs its replacement stated: the kit's `mod.js` "is no longer byte-identical" to the vendored source (A:253), so the byte-identity assertion has nothing left to pin. |
| R13 modulation window drift | B (stylehash recipe) | PARTIAL. A measurement, scheduled after the work it should size. |
| R14 WebGPU specifics | C9 "keep λWAVES' GPU recovery" | **NO** named test; `thumbnail()` readback and the scene guard unplanned. |
| R15 moving kit | G2 | PARTIAL. Policy only. The kit's own gate is `adopt.mjs --check` "in step" before every commit (kit `PROMPT.md:15–17`); the draft never states it for C. |

Closed by a named, existing test: R3, R7, R11, R12. Partially: R1, R2, R4, R5, R6, R8, R9, R13, R15. Not closed: R10, R14.

---

## 3. What is missing

**Seams the ten leave out** (each a real edge in `rack.js`/`lab/` today):
1. **The `__LW` surface** — `LW` literal `:5330–~5608` and `api :1211–1265`; 326 test call sites on `layout/mod/history/keys/projects/notebook`. The seam that makes C3–C6 swaps instead of rewrites.
2. **Kit-registered parts** (`pages`, `accent`, `rack`, `bpm`; ADOPTING §13) vs `modulation`/`layout` records (A3 row).
3. **The scene guard** into `stage-gestures.js` + `hit-probe` (C9 row).
4. **index.html / cascade order** (`lab/index.html:53–56, :67–68`) (C0).
5. **Session / autosave / opener**: `save()` `:4924`, `LS_EXP/LS_PRES`; kit `createSession`, `createOpener`, `bootVeil`, `installBanner`, `installWakeLock` (A:84; SIBLINGS rows 19, 20).
6. **Settings surface**: SETTINGS rack window vs `createGui`'s MIR OPTIONS window; CAPTIONS, LEAN and the AUTO SCALE/governor/KEEP FRAMES rows have no kit row (A:278, gap 10).
7. **i18n**: the kit is `t()` everywhere with a LANGUAGE menu and ten unreviewed draft packs (A:259, A:329); λWAVES has none, so a chosen language would translate the kit's strings and not ours.

**Kit gaps the 17 briefs do not cover:**
- label avoidance of windows (D3 row); a layer that hosts an element (D4 row);
- **ink modes INVERT/THRESHOLD are unbuilt** (A:205, A:219; KB 13 says "do not advertise") and λWAVES' bright volumetric picture is the case SIBLINGS row 21 says the ink law was made for. Bare text may be unreadable over a cloud; the fallbacks are pane mode (the 30-vs-60 fps cost, A:204) or `mix-blend-mode: difference`, which the atom labels use today (CLAUDE.md). The INFORMATIONAL's largest unknown (legibility and cost over a WebGPU canvas, "the kit has not proven touch, WebKit or WebGPU", A:205) is scheduled **last** (D1 after C). It should be **retired in B**: mount `createInfoLayer` (it exists in alpha.24) over the stage in the throwaway with two labels and a block; measure `viewChanged` cost under AUTO-ROTATE and legibility on three pictures (1s + 2p, benzene HOMO, C₆₀). One session; it decides whether briefs 18/19 exist.
- briefs with **no consuming row**: 1 (311 lines, optional gift), P (61), J (26), 3 (13) = **411 of KB's 677 gross lines**; brief 3 is Josh's "journal throughout the app" and has no D row.

**0.4.0 hand-off items the draft forgot:**
- **M5 numbers** (S4a, S4c, `measure/MEASURE.md`): the persist test (Safari tab vs Home Screen), `limits.html` (`wgStorage`/`device32k`, decides 64 vs 32 lanes on the iPad), `?report=1&post=1` (the device report). D:131 says "pending" and nothing else. C-V needs the third as a **before** number.
- **The subtraction law**: 0.4.0 added **+1,559** to `lab/*.js` (34,721 at P:99 → 36,280 today, +4.5 %); not one 0.4.0 stage met "lines down". The 0.5.0 draft carries the estimate (D:77) and no ledger line for D's additions.
- **`CURATED_IE`** (`names.js:467`): ten HeI band maxima "entered from memory", UNCHECKED value by value; benzene's record ships its 1e1g 9.24 eV tagged `curated`. Any D2 page that quotes an IE needs verification first (primary handbooks, not SRD 101 tables: S4b LEGAL reading).
- **C₆₀'s draft geometry** (S4c): Sol's equal-edge ideal I_h; B4 (experimental geometry) precedes names; a C₆₀ page in D2 must say DRAFT. B₁₂H₁₂²⁻ has no PubChem id (UNVERIFIED in its record).
- **The camera bindings Josh may change** (10-08: "We might change the default keybinds for new camera mouse-controls and perhaps touch gestures"): D:109–110 says "a row when he names them".
- Smaller: S4a's Br₂-vs-cap ruling (Br₂ 2.0 s vs benzene's 1.7 s, S4a open items); S4b's rulings (C₆₀ under a `milestone` allowance, C₂₀H₂₀ refused, one rock-salt cube); `CHANGELOG.md` out of step (S4a); the `current` flake and the geckodriver port race (S2); CLAUDE.md's MOLECULES paragraph (landed in `3dfbc46`).

---

## 4. The rulings (D:97–111)

| Ruling | Default right? | Note |
|---|---|---|
| R5-G1 wait / adopt now / cut 1.5.0 | **No** | Option 3 is the MIR session's decision; remove it and send it as a message. Add the missing option and make it the default: **pin an alpha at C0, freeze it, re-adopt once at the cut** (C1–C7 wait on no brief, §1.1). |
| R5-M1 who runs the MIR session | Not a λWAVES ruling | It is the critical path; Josh decides it, but it is scheduling, not a plan line. |
| R-B1 one clock | OK | P:365. Move its behaviour to C4; A6 stays a facade. |
| R-K1 | PARTIAL | Second half is today's binding (`rack.js:4736`). |
| R-D1 first-run look | OK | |
| **R-I1** switch in SETTINGS › DISPLAY | **Not a ruling** | Josh's instruction, verbatim (0.4.0 `NACRE.md:77`); KB 7 and 13 already delegate to it. |
| R-I2 `lw:` links + HUD | OK | Josh's own open question (NACRE:46). |
| R-I3 pages travel / open never closes the notebook | OK, incomplete | Add the greeting: the kit shows page 0 on open (A:192); P:137–138 forbids announcing on project open. One exception line or `shouldGreet` off. |
| §7.3 photosensitivity pane, toast pill, ABOUT 470 × 670, NEW, notes recent 8 | OK | Each follows R-F1 (P:30–34): BASINS' where BASINS designed, λWAVES' where it originated. |
| **§7.3 KEYBOARD window: kit's INTENT skin** | **No** | P:32–34 lists "the keyboard window" among what λWAVES **originated**, so λWAVES' charcoal-blue wins by Josh's own R-F1 (default taken, P:421). Default = λWAVES' skin as an `app.*` layer; the kit's skin is option 2. "The glass is Josh's." |
| keys for kit windows: none invented | OK | A:296 (the alpha.19 "ten questions", Q3). |
| R5-L1 legacy five | **No** | See D9. |
| *camera mouse bindings and touch gestures* | **Missing as a row** | Ask now (§8, Q1). |

**Missing rulings:** (a) one settings surface or two (C2 row); (b) LANGUAGE menu shown or hidden (§3, seam 7); (c) greeting on open; (d) SRD 101 / IE pages; (e) what 0.5.0 is if the briefs or the cut slip (§8, Q2); (f) the 0.4.0 cut and 0.4.1's place; (g) S4a/S4b's carried rulings (Br₂, `milestone`, rock-salt cube), still open.

---

## 5. The numbers

| Number in the draft | Status |
|---|---|
| `lab/*.js` 36,280 (D:10) | **Measured** today (`wc -l` over `lab/*.js`). |
| 7/82 red, 9.5 MiB, 7.3 MiB, 1,172 diffs (D:12–14) | **Measured** on alpha.23 / base `61f7c2c`; stale on this base (85 suites, 4.53 MiB). |
| BASINS +1,850 / −19,320; 13 ms/s (D:15–16, D:115) | **Measured** (A:121, A:116). |
| 9,000–10,500 out, 1,000–1,500 back (D:115) | **Estimate** "by section banner and approximate" (A:146). Nested ranges double-count ~495 lines (A4 row). BASINS wrote 9.5 % of what it deleted (A:146) = 855–998, below the 1,000–1,500 taken. |
| "`lab/*.js` ≈ 26–27k" (D:77) | **Wrong arithmetic on its own inputs**: 36,280 − 10,500 + 1,000 = 26,780 and 36,280 − 9,000 + 1,500 = **28,780**. The honest range is 26.8–28.8k; "26–27k" is its best corner. Add +11 × ~20 for the seams (W130 ratio, DERIVED) and D's additions. |
| ~1,065 floating rack; ~440 → ~150 port; ~65 camera UI; ~330 PROJECTS (D:44–45, A:140) | **Old tree**; measured here: `layout` 282, port block ≈ 330, CAMERA MOTION 65 (OK), look code ~155. |
| 1,200–1,800 of 2,330 (D:72) | **Estimate** over a file pair that is 2,360 now. |
| KB's 677 gross lines (366 without the camera gift) | **Measured spans**, the only counted deletion figure in the record; 100 of them (excluding brief 1) have no consuming row. |
| "A4 and A5 are the big subtractions" | **Unsupported**; W130 measured the opposite sign for extraction. |
| "device report equal" | **Unmeasurable as stated**: fps 7.8 / 13.8 / 18.2 / 19.1 across sessions at loads 11–23; the target regression is 1.3 %. |
| 0.4.0's own totals | Taken: 34,721 → 36,280 (+1,559, +4.5 %). |

To take, with a method: main-thread ms/s while playing (CDP `Performance.getMetrics`: ScriptDuration + LayoutDuration + RecalcStyleDuration deltas, 3070 and M5, the S2 pattern of back-to-back runs at equal load); whole-`localStorage` snapshots before/after a project open; precache bytes per alpha; the seven stylehash classes; `viewChanged` cost per frame under AUTO-ROTATE with N labels.

---

## 6. The verification dial (Josh: "don't over-verify"; HANDOFF §4–§5)

**Under-verified.**
- **A6 and A7 edit `loop()`** (`rack.js:862, :912–921`) — the frame loop — and are marked "no verifier". Their lock gate is vacuous for A7. Give them the S2 pattern: device report back-to-back at equal load + the owning browser suite, no verifier agent.
- **A1/A3**: no byte-level check of what a user's saved files become. Use W130's: `serialize` bytes identical on N snapshots (11 there) + the whole-`localStorage` diff.
- **C7**: the exact-time law's gates test code that is being removed (§1.4). The verifier the draft gives D5 belongs here.
- **C9/C-V**: the scene guard (hit-probe 25/0) and the M5/WebKit pass are absent.
- **Harness**: `history` and `offer` close R3/R4 and fail on the untouched base from a driver port race; fix `tools/gate/drv.mjs` once, in A10.

**Over-verified.**
- **Locks on non-field commits**: the "588 lock" on A7/A8 and the "1004 lock" on C1 and C8 (D:47–48, D:66, D:73). P:100–101 and HANDOFF §4 say frame-path commits only, the 1004 once at the end; neither C1 nor C8 touches `field.js`. Keep one 1004 + one 1148 at C-V (the S4a fixture).
- **C-V** re-running every node and browser suite the builders already ran. Scope the verifier to what a fresh eye catches: the seven stylehash classes, the R1–R15 table, hit-probe, the ms/s delta, `adopt --check`.
- **B** running 27 browser suites is fine once; it is the same ask as the canary's "every suite", not a new tax.

The dial is otherwise sound: A has no verifier agent, B is a Sonnet task, C has one verifier at the end (NACRE's "here, the adoption"), D has one.

---

## 7. The ten changes DRAFT 1 must make, ranked

1. **Cut stage A to what the canary names, plus the glue-first seams.** Order: (0) canary re-run on this tree + alpha.24, stylehash recipe fixed; (1) A10 + A11 (+ regenerate `new-project`, + the `wiring` rule "precache what a root reaches"); (2) A1 + A3 + A6; (3) A5 + A8; (4) A9, A7. Drop A2 (build it inside C2); reduce A4 to "zero references outside the block, `__LW.layout` verbs unchanged", last.
2. **Replace the acceptance**: lines are *measured per seam and may rise* (W130: +41 for two); the subtraction is booked at C3/C4; add the ledger line (+1,559 in 0.4.0).
3. **Rewrite the draft's §5 (D:120–125) with this tree's regions**: the eleven shared sites (§1.6 above), three builders, A4 last, a size per stage.
4. **State the full red list** (seven → re-taken on 85 suites), the missing `new-project` and `wiring` fixes, and the stop rule for the iterative A10 loop (`mir.test` hides further reds).
5. **Add C0 and a dependency table** (which C/D row needs which brief; C1–C7 need none) and make *pin an alpha, re-adopt once at the cut* the R5-G1 default; add the wiring-expiry date 2026-12-06.
6. **Restore what P:381–386 gave 0.5.0** (rows 8, 19, 20, 21, 24) or put them in "not claimed"; move the RPA root names (Sol C3) back into D2 per P:427; assign briefs 1, P, J, 3 to rows; say where 0.4.1 BUCKYBALL sits.
7. **Bound D2 and give it a content rule**: pages generated from records (38 + 4 demos), by class for hydrogenic states, windows from the existing INFO copy; no model-authored numbers; `CURATED_IE` verified or tagged UNVERIFIED; the SRD ruling; the greeting exception.
8. **Retire the INFORMATIONAL's unknowns in B**: a layer spike over the stage (cost under AUTO-ROTATE, legibility, labels under racks); decide D4 (text only, or a hosting brief) and the ink-mode brief before D is promised.
9. **Fix the rulings list**: drop R-I1 and R5-G1 option 3/R5-M1 from Josh's list, flip the KEYBOARD default to λWAVES' skin per R-F1, rewrite R5-L1 (field owners), add the camera bindings, settings surface, LANGUAGE menu, greeting, SRD, and the 0.5.0-minimum rulings.
10. **Re-set the dial and the numbers**: delete the vacuous and non-field locks, add W130's serialize byte-identity, a ms/s metric that can see 1.3 %, per-class stylehash with C0, hit-probe and the M5/WebKit pass in C-V, the driver-port fix in A10; replace estimates with measured spans and give the 26.8–28.8k range.

---

## 8. Three questions only Josh can answer

1. **The camera.** You said the default keybinds for the new camera mouse-controls and perhaps touch gestures may change. Today: left-drag orbits, Alt-drag or two fingers slide the picture, wheel and pinch zoom at the cursor, Alt+Arrows nudge. Which bindings do you want on a mouse, a trackpad and the iPad? Your answer is a data table in `stage-gestures.js` before brief 1 freezes it as the kit's reference.
2. **What is 0.5.0 if the MIR session has not built briefs 8, 4, 7, 13 or cut 1.5.0 when A–C are done?** Ship A + B + C on a pinned alpha and call the INFORMATIONAL window 0.5.1, or hold 0.5.0 for the window? And which session builds the briefs?
3. **What may the adopted app show that it does not show today?** The MIR OPTIONS window beside SETTINGS, the LANGUAGE menu with ten unreviewed packs, the kit's KEYBOARD skin instead of the charcoal-blue one: each allowed, hidden, or overridden?
