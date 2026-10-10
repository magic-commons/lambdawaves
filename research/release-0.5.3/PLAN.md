# λWAVES 0.5.3 — PLAN (Claude Sos / Fable 5.1, 2026-10-10 17:24 CDT) — "minor update": Josh's bug and adjustment list, measured, audited, ready for his word — **RACK TUNE** (Josh, §11)

The round (Josh 10-09, a non-major release): `PLAN-DRAFT-0.md` (Fable) → `AUDIT-OPUS-1.md` (Opus 5.5 @ high, every file:line checked on `1970b1c`) → this
plan, which takes every **[OPUS]** mark. Josh's ask is `ASK.md` verbatim with its two screenshots; the ground is `localise/*.md` (three explorers, 2026-10-10).
The 0.5.4 PRE-MATH half of the ask is out of this plan: `../release-0.5.4/`. Name: **Rack Tune** (Josh, 17:45). **Josh's word given 17:45 with his six answers (§11); W1 launched.** NO push, NO deploy, NO gh release; the cut is local.

## 0 · The facts (measured on `v0.5.2-alpha`, `lab/` unchanged from `bb7d638` to `1970b1c`)
1. **The red formula is one record.** `lab/latex-state.js:95-100` maps subscript digits and ⁺/⁻, not superscript digits; of 91 formula rows (37 in `library.json`,
   54 in `molecules.js`) only B₁₂H₁₂²⁻ (`library.json:3941`, id `B12H12--`) carries one → `\mathrm{B_{12}H_{12}²^{-}}` → KaTeX's double-superscript error, red.
   The screenshot is from the local tree (the live site is v0.3.3-alpha, no library). ¹ ² ³ are U+00B9/B2/B3, OUTSIDE the range ⁰–⁹ (U+2070–2079): a `[⁰-⁹]`
   class misses the very ² — `/[⁰-⁹]/.test('²')` is false. No test renders every formula through KaTeX.
2. **C₆₀'s registry is a ladder of 300 with 8 rungs.** `ground.cols` = 175…182, nocc 180 (HOMO set 175–179, LUMO set 180–182); `orbitalsview.js` `select` :188-189,
   `paintLevels` :197-201, `crossed` :513-515 check only `k >= nAO`; the refusal :257; `update` :558-566 stops silently when already ON. Second cause: a failed
   record fetch leaves `sol = null` (`chemview.js:322`) after `preset` was set (:258), and a re-pick is a no-op (:124, :94-97).
3. **STATES' ON switch answers in whispers.** `statesview.js:282` refuses until the ladder returns; `mathworker.js:328` refuses records with no CIS states; a parked
   `load` (:705) turns ON off; the ladder's landing (:172) never re-arms; `persist.js:232`'s `setOn(true)` is refused at :309-310 while the ladder is out. STATES is
   738 + 267 + 76 lines with 19 `reg.*` targets and `__LW.states`.
4. **DISPLAY lost two rows at wave 157 (v0.4.0).** The tree has ONE row, STAGE TEXT + SIZE (`lab/windows/settings-card.js:17-18`, seated by `native-ui.js:66`; one
   switch and knob drive formula, fade, caption and atom labels, `lab/shell/stage-words.js:83-118`). The live site and Josh's screenshot have TWO: STAGE FORMULA +
   SIZE and ATOM LABELS + SIZE. `stage-text.browser-test.mjs:104` pins the one-row form.
5. **The dead stage: five candidate causes, no test.** (A) `lab/mir/shell/scene-guard.js` `rectOf` :128-132 ignores opacity / visibility / `pointer-events`, and the
   union at :153-154 joins the modulation window with its bars — inside the kit; the app seat `lab/shell/rack-wiring.js:304` reaches only the `extra` list. (B) a lost
   pointerup leaves `special`/`points` held and `stage-gestures.js:67`'s `special ||` refuses EVERY later press; a touch's next pointer has a NEW id. (C) the dialog's
   window-capture pointerdown. (D) `schedule()`'s early returns (`rack.js:266,272,275`). (E) two fixed small dead boxes.
6. **The camera card has no release-only path** (`lab/windows/material.js:119` → `cameraPort.set` → `present()`); the PAN pad is literally an XY grid whose `onInput`
   writes per move (`mir/controls/factory.js:90`); a routed dial can hit `schedule()`'s `mod.syncing` return (`rack.js:266`).
7. **The classic camera is one flag.** `camera-law.js:165-176` has one `anchor` and one `setShift`/`panBy`; PAN HOME at :195; a restore also writes `obs.shift` raw at
   `shell/persist.js:163`. PREFERENCE lives beside friction in `shell/settings.js:37,98-101`.
8. **Alt+Shift+Drag already pans** at 1:1 (`stage-gestures.js:14,33,70`; the test at :107-114 holds only `altKey:true, ctrlKey:false`).
9. **MOLECULES' rows** (`chemview.js:82-234`): `rH` ◂ SECTION ▸ INSTALLED; `r0` ON · the select · BASIS; `r1` VIEW · VALENCE · ORBITAL · the chevron (:234).
   `rebuildOrbKnob` uses `replaceWith` (:363). The rack is 300 px (`mir/css/skin.css:24`); the select's flex-basis is 200 px. Presets: ORBITAL 2, STATES 7.
10. **PALETTE is the kit's ramp panel** (`lab/mir/panels/ramp.js:121-159`) with λWAVES' text: the tick text :99, INVERT :108-110 (the kit draws the half disk,
    `glyph.js:318`), the ARG ψ field with our label; ROTATE's "turn" is the kit knob's. Dead CSS: `skin.css:325,380-381`, `lab.css:475-477`, `.pal-ring` in
    `skin.css:20`. `lab.css:478` `.pal-color` is LIVE (SETTINGS' colour well, `settings-card.js:96`).
11. **A/B is three surfaces** (STATE `lab/windows/state.js:47-67`, reordered by `native-ui.js:78-79`; MO-REGISTRY; STATES).
12. **The 3×3 switcher is in the kit** (`workspaces.js:82-89`, mounted by `modulation/window.js:722-724`); `mod-port.js:141` destructures and drops `switchWorkspace`.
    The kit's transport bar already carries λWAVES' arrangement (`lab/mir/shell/transport.js:540` `LAMBDAWAVES_LAYOUT`) and `placementOf` (:69) seats it in the
    rack, then a showing work lane, then the stage — that IS the dock-into-the-timeline Josh asked for. The docked look today is `skin.css:417-481`.
13. **The line law.** 27,943 lines; cap **28,222**; headroom +279. CSS and `tools/` are not counted.

## 1 · The rows (six builders in three waves; each row books its JS delta against §6 and stops to report at 1.5×)
Each row: `BRIEF-<builder>.md`, `<builder>-BUILD.md` with "what Josh will see", the owning suites, `node tests/pwa.test.mjs --write` after every `lab/` edit and
again after rebasing on the merged tip (G-M). Sizes S ≤ 2 h, M ≈ 4 h, L ≈ 8 h.

| # | row | what | closer | Δ · builder |
|---|---|---|---|---|
| **M1 THE FORMULA** | `formulaLatex` maps each run of `[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+` (spelled out) to one `^{…}` (`²⁻` → `^{2-}`; NH₄⁺ still `^{+}`); the two ⁺/⁻ replaces at :98 fold in. A node sweep over `MOLECULE_BY_ID` renders every formula through KaTeX with `throwOnError:true` and asserts ≥ 91 rows (the silent `{rows:[]}` fallback at `molecules.js:500-503` cannot pass empty). The record's baked `page` field is left. | `latex-state.test` + the sweep; `molecule-head`; the stage shows B₁₂H₁₂²⁻ typeset | +3 · B-MOL |
| **M2 C₆₀'S LADDER** | with `sol.cols` set, `select`/`paintLevels`/`crossed()` skip uncarried levels and draw them dim; a failed record fetch puts `preset` back to the last solved id before `sol = null` (`chemview.js:322`) so the dropdown answers; a browser case drives C₆₀'s ladder and asserts ON is never refused by a click on a dim rung | `register` R0–R10; the new C₆₀ case; `library.test` | +12 · B-MOL |
| **M3 STATES ANSWERS** | ON with S₀ alone applies BEAT (one behaviour); the auto-off on a re-solve goes; the re-arm is ONE seat — `statesview.js:172` honours `wanted.on` and a `setOn(true)` refused while the ladder was out; the refusal for records with no CIS states becomes a visible sentence on the switch. `persist.js` is not touched (B-CAM owns :163). **No cut of STATES** (R2): 19 targets and `__LW.states` byte-stable. | `register`, `molecular-register.test`, `molecular-drive.test`, `history` (STATES ground-lane bytes), `new-project --check` | +12 · B-MOL |
| **M4 THE LIVE STAGE** — the measuring row, W1 | (a) `tools/stage-dead-probe.mjs`: a grid over `#stage` in 10 scenes; every point where `guard.hit` is true must lie on a visible interactive element; (b) the stuck-pointer heal, on a NEW `pointerdown` only: a held `special`/`points` of the same id is finished first, and a held one whose capture is gone (`!canvas.hasPointerCapture(id)`) is finished as cancelled whatever its id (a new touch has a new id); `pointerMove` finishes a mouse drag whose `buttons === 0`; (c) the app-side rect filter in the `extra` callback at `rack-wiring.js:304` (skip opacity 0 / `visibility:hidden` / `pointer-events:none`) — never in `occlusion.js` `paintedRect` (the shader mask); the bar union is kit-only → a MIR brief for `scene-guard.js` `rectOf`; (d) the two fixed dead boxes measured and, if the corner-axis hit is dead under `ui-hidden`, hidden with it. The probe's reading before/after is the BUILD. | `stage-gestures.test` (+ lost pointerup; + a lost touch then a new id; `:47-55` stay green); the probe 10/10; `hit-probe-set`; `frame-occlusion` 7; `opener` | +10 (probe in `tools/`) · B-STAGE |
| **M5 THE SPHERE RINGS ANSWER LIVE** | Q2 answered: the "XYZ grid" is the camera SPHERE's three world rings, dragged from the rack window. Measure first: a CDP drag on the sphere (and, for the record, each CAMERA dial and the PAN pad), sampling `__LW.obs` and `stats.presents` before mouseup; find where the ring drag commits only on release (the sphere control's own input/change wiring, or `schedule()`'s early return) and make it commit per move through `cameraPort.set` → `schedule(TIER.PRESENT)` at `material.js:119`; the BUILD shows presents-per-drag before/after. | the drag probe; `camera-shift`; `tools/camera-routes.mjs` 5/5 | 0–2 · B-CAM |
| **M6 CLASSIC CAMERA** | a `locked` flag in `createCameraLaw`: `anchor` at CENTRE, `setShift`/`panBy` early-return, `setShift(0,0)` on engage, the two raw `observer.pan*` routes (`shell/modulation.js:45,47`) clamped, the restore seat `persist.js:163` (a project's non-zero shift opens centred under the lock; its bytes untouched); a `lock` id on `ROADS`; PREFERENCE `camLock` beside friction (`settings.js:37,98-101`; `STATE-SCOPES.md:45`; the PREF set in `new-project.test.mjs:39`); the control: a LOCK switch beside `SET Δρ REF` (`material.js:123`). R3: the lock holds the PAN only (zoom from the centre; FOV, mode, yaw/pitch live). The getter is nested (`__LW.camera.lock`): `lw-facade` stays 1/1, no `--write`. A case: Ctrl+Shift+Q/E under the lock keeps the shift at 0. | `current:173,181`, `new-project.test:39,45`, `first-run.test:141`, `settings-probe` (the new key), `new-project --check` exact with NO regeneration; `camera-shift`; `stage-gestures.test` (`atCursor` under the lock) | +18 · B-CAM |
| **M7 THE PAN CHORD** | no code: the note at `material.js:124` and `key-table.js` name Alt(+Shift)+Drag as the pan; the Shift case joins `stage-gestures.test`. R8: a FINE pan (`law.FINE` under Shift, one line) only if Josh says "fine" meant fine-grained. | `stage-gestures.test`; `keyboard-shortcuts` | 0 · B-CAM |
| **M8 MOLECULES' ROWS** | Josh's layout, measured: `rH` = ◂ SECTION ▸ · INSTALLED · MOLECULES ON; `r0` = the MOLECULE select alone, under ON; `r1` = BASIS · ORBITAL/VALENCE (a pair under `seats()`); `r2` = VIEW · the chevron — three rows plus the header unless VIEW and the chevron fit beside BASIS and ORBITAL at 300 px; the builder measures at 300 px and phone width and reports the count; `lab.css:782-784` keeps the section row tight. **Q5 answered: the ◂ SECTION ▸ picker AND the MOLECULE select take the PALETTE window's preset-selector look (the kit's left/right stepper, `ramp.js:122` idiom) — ONE idiom; the builder lists every other control that could be left/right-arrowed (BASIS, the register preset, VIEW …) and reports the list for Josh without building them.** | `molecule-demos`, `molecular-names.browser-test`, `chem`, `molecule-head`; a hit-probe of the rows at phone width | +10 · B-DISP |
| **M9 THE INFORMATIONAL WINDOW** | Q3′ answered: "the two rows are correct but make them their own window called 'Informational'". A NEW rack window **INFORMATIONAL** (id `informational`; a MIR-skinned card in `lab/windows/`, listed in + and WINDOW, closed by default on first run, seated under SETTINGS when opened) holding STAGE FORMULA + SIZE and ATOM LABELS + SIZE: `stage-words.js` splits `setOn`/`setScale`; keys `atomLabels` + `atomLabelsSize` restored beside `molFormula`/`molFormulaSize` (still PREFERENCE, `docs/STATE-SCOPES.md`); an absent `atomLabels` takes the stored `molFormula` once; the one STAGE TEXT row LEAVES the DISPLAY tab (`settings-card.js:17-18`, `native-ui.js:66`); the capture caption follows STAGE FORMULA; `stage-text.browser-test:104` re-pinned to the window; `notebook.js:109`, `molecule-head.browser-test:80`, `new-project.test:40` follow. A new window is a WORKSPACE layout row: `new-project.lambdawaves.json` is regenerated ONCE by `tools/new-project.mjs` with the reason written, and serialize-bytes vs 0.5.2 are identical OUTSIDE the WORKSPACE keys (G-B amended). The window is the future seat of 0.5.4's STATUS line. | `stage-text`, `molecule-head`, `new-project --check` (regenerated once), `settings-probe`, `menubar` (+ the window listed), `frame-occlusion`, `history` (WORKSPACE row) | +45 · B-DISP |
| **M10 MORE REGISTRY PRESETS** | ORBITAL presets 2 → 8 as ONE table `(name → levels, phases, refusal)`, not if-arms in `preset()` :216, each inside `sol.cols` for RECORD_ONLY molecules: HOMO · LUMO · FRONTIER FOUR (HOMO−1…LUMO+1) · HOMO SET · LUMO SET (the whole degenerate level) · OCCUPIED (all valence, equal phase) — R4; σ + σ* struck (ε alone cannot pair bonding with antibonding). STATES presets unchanged. One banner per preset. | `register`; `stage-text:73-81`; `molecule-demos` | +25 · B-MOL (after M2) |
| **M11 ONE A/B, STATE** | R7: STATE only ("its rack window"). The STATE card's group restyled: one row STORE A · A · STORE B · B with the stored slot lit by a class (CSS `::after`, never a child text node — `current:150` finds buttons by exact `textContent`), and TRANSITION · Ω RABI · the readout on one line. Labels kept. The registry windows' A/B → 0.5.5. | `current:150,193`, `history:162`, `new-project.browser:69,89` | +4 · B-DISP |
| **M12 PALETTE, SHORTER** | λWAVES-side: INVERT → `glyph:'invertColors'` re-seated right of ROTATE (the `rInv` row goes); RESET into the PALETTE-ON row; `ticks: []` + `.mir-ramp-ticks:empty` collapsed; the selected stop's arg shown TWICE from one function — a `readout` seated under ROTATE (one CSS rule hides the knob's "turn") and a small floating text over the stop (R6: radians, degrees on hover); the ARG ψ field hidden (`.mir-ramp-at`); the preset stepper is NOT restyled — it is now the reference look that M8 copies (Q5); the five dead selectors out, `lab.css:478` kept. MIR briefs filed, not built: a `verbs` extras slot, a reset seat, `labels.rotate(rad)`, `labels.float`, `stepper({pager:true})` via `ramp.js:122`. | `menubar:166`; `history:169-170`; `tests/legacy/boot:2738,4162-4165` re-aimed; `official-defaults-palette`; `settings-probe` | +15 · B-PAL (Sonnet @ high) |
| **M13a THE 3×3 SWITCH** | `mod-port.js:141` passes `switchWorkspace`; `shell/modulation.js:210` supplies `() => { modView.close(); tl.open(); }` — the kit's `show('lower')` without the lego stack (`createWorkspaces` struck: it re-seats both windows and moves `modDodge` and T1–T5 ground; R11). Wiring, no brief. | `timeline` T1–T5, `history:386` | +3 · B-TR |
| **M13b THE DOCKED BAR — restyle now** | Q4′ answered: "restyle now". λWAVES' docked grid (`skin.css:417-481`, the legacy rules `:333-367` subtracted) is restyled in CSS to the kit's work-bar idiom — the same raised/inset skin, spacing and type as the kit's own bars; no JS. The kit's `createTransport` adoption AND the dock-into-timeline cycle go to 0.5.5 together (R5 flipped); the half-hour FIT check is still written into the BUILD as 0.5.5's first fact. Never a λWAVES shim. | `menubar:179`, `timeline` T1–T5, `history:386`, `frame-occlusion`, `film-handover`, `stage-text`, `current`, `tools/stylehash.mjs` | 0 JS · B-TR (Sonnet @ high) |
| **M14 THE iPAD SESSION** | no build: the integrator's one-page checklist for Josh's first iPad pass (the chord; Option+drag with a hardware keyboard — UNMEASURED whether Safari reports `altKey`; the lock; the rows; the dock cycle; a dropped touch then a new one) + `tools/perf/device-report.js` once; his notes become 0.5.5 rows | — | 0 |
| **M-V** | one fresh Opus verifier: THE LOCK 860 + 1004 · 0/0 with the camera lock engaged AND not; serialize-bytes 11/11 IDENTICAL vs 0.5.2; `settings-probe` 0/6; `new-project --check` without regeneration; a 0.5.2 profile with STAGE TEXT off opens with both new rows off; the stage probe; the estate + the boot suite alone; the line law; CLAUDE.md's STAGE FORMULA paragraph and `STATE-SCOPES.md` for `camLock` / `atomLabels*`; FIT / NOT FIT → a fix round → the local cut on Josh's word | — | — |

## 2 · The gates
**G-N** node gate 0 after every row. **G-L** THE LOCK at M6 and M-V (M4 touches no field code); the BUILD proves it with the lock engaged and not. **G-B** serialize-bytes
11/11 IDENTICAL for every row — PREFERENCE keys never enter a project; `new-project --check` passes WITHOUT regenerating, or it is a defect — EXCEPT M9: the INFORMATIONAL window is a WORKSPACE row, so M9 regenerates `new-project.lambdawaves.json` ONCE with the reason written and proves the bytes identical outside the WORKSPACE keys. **G-P** `settings-probe` 0/6.
**G-S** the owning suites per row; the estate + the boot suite alone at M-V. **G-H** the stage probe 10/10 from M4 on. **G-W** `lw-facade` 1/1, never re-written.
**G-Lines** ≤ 28,222 at the cut; ≈ +122 estimated (§6), the kit bar the only real subtraction; each builder stops to report at 1.5× its estimate. **G-Eye** every BUILD
says what Josh will see with a before/after PNG pair under `research/release-0.5.3/eye/`. **G-M** every builder re-runs `pwa --write` after rebasing on the merged tip
(`lab/sw.js` is the one file every row touches).

## 3 · Order (three waves of two file-disjoint builders; the audit's overlap matrix is `AUDIT-OPUS-1.md` Part B §3)
**W1** {M4 · B-STAGE} ∥ {M1 + M2 + M3 + M10 · B-MOL}. **W2** {M5 + M6 + M7 · B-CAM} ∥ {M13a + M13b · B-TR} — `shell/modulation.js` hunk-disjoint (:45,47 vs :162-215),
B-TR merges second. **W3** {M8 + M9 + M11 · B-DISP} ∥ {M12 · B-PAL, Sonnet @ high} — `skin.css` hunk-disjoint (:443 vs :20/:325/:380). The probe (G-H) is ready before
any UI row of W2/W3. Then M-V, a fix round, the cut. Opus for B-STAGE, B-MOL, B-CAM, B-DISP, M-V; Sonnet @ high for B-TR (wiring + CSS, after Q4′) and B-PAL. ≈ 34 builder-hours (≈ 40 on FIT),
≈ 2 relay days. Every builder: `isolation: "worktree"`, first command `git reset --hard <sos-s0 tip>`, one commit per fix, a written BUILD, no push.

## 4 · What Josh will see
A typeset B₁₂H₁₂²⁻; C₆₀'s registry that answers; a STATES switch that shows BEAT or says why on the switch; a stage that never goes dead (and a probe that proves
it); a LOCK on the camera that returns the old centred zoom; a documented pan chord; MOLECULES re-seated as he drew it (ON beside INSTALLED, the select under it,
BASIS beside ORBITAL, the chevron right of VIEW); DISPLAY with STAGE FORMULA and ATOM LABELS back, each with its size; eight orbital presets; one A/B look in STATE;
a PALETTE two rows shorter with a half-disk INVERT, a reader under ROTATE, a floating angle and a section-style preset picker; the 3×3 switch to the TIMELINE; and
— on FIT — the kit's docked TRANSPORT seated in the timeline's work lane (on NO FIT: a restyled dock now, the cycle in 0.5.5).

## 5 · What is not claimed
STATES is not redesigned (R2). The kit's transport is adopted only on FIT (R5). No MIR brief is built here (five from M12, one from M4, filed). The iPad is not
tuned (M14). The "XYZ grid" bug is not fixed until it is found (M5 measures first). The lego stack and the registry windows' A/B are not touched.

## 6 · The line ledger (ESTIMATE; `lab/*.js` + shell + windows; CSS and `tools/` uncounted)
27,943 today, cap 28,222, headroom +279. M1 +3 · M2 +12 · M3 +12 · M4 +10 · M5 0–2 · M6 +18 · M7 0 · M8 0 · M8 +10 · M9 +45 (the window) · M10 +25 · M11 +4 · M12 +15 · M13a +3 · M13b 0 → ≈ +160 → ≈ 28,103 of 28,222. ≈ 120 spare; the 1.5× stop per builder.

## 7 · RULINGS TAKEN AS DEFAULTS (Josh may flip any)
- **R1 the name** — Josh's. **R2 STATES** — keep and fix; the shrink/cut is 0.5.5 with its 19-target cost written. **R3 the lock** — pan only.
- **R4 the presets** — HOMO · LUMO · FRONTIER FOUR · HOMO SET · LUMO SET · OCCUPIED. **R5 the transport** — JOSH: a CSS restyle now; the kit's bar and the dock cycle in 0.5.5; never a λWAVES shim. **R6 ARG ψ** — the field hidden; the selected stop's angle under ROTATE and floating over the stop (radians, degrees on hover).
- **R7 A/B** — STATE only. **R8 the chord** — Alt+Shift+Drag documented; no fine mode unless "fine" meant fine-grained. **R9 iPad** — a checklist, no build.
- **R10 DISPLAY** — JOSH: the two rows are correct, in their own window INFORMATIONAL (M9). **R12 the picker idiom** — JOSH: the PALETTE preset selector's left/right look for the section picker and the molecule picker; other candidates listed, not built. **R11 the switch** — the button alone, no lego stack.

## 8 · Questions for Josh — ALL SIX ANSWERED 17:45 (§11); kept for the record
- **Q1** the dead stage: which device and input (Mac? iPad with a keyboard? Ctrl or Alt held?), was a banner showing, did a rack click or the H key still work, did
  switching apps free it? (It picks between A, B and D.)
- **Q2** "XYZ Grid in camera control": the sphere's rings, the PAN pad (an XY grid), the FRAME/AXES segs, or a dial with a route on it?
- **Q3′** DISPLAY: "currently incorrect … in the live version it looks like this" — the two rows back (the default), or was "incorrect" the red formula (M1)? Both are built.
- **Q4′** TRANSPORT: adopt the kit's bar now (the default, fit first), or restyle now and adopt in 0.5.5?
- **Q5′** "update the selector for molecule under the ON button": placement only (the default), or the section-picker look too?
- **Q6** the name.
(Struck by the audit as answered by the tree or his words: which MO-Registry button — the ON switch; "fine" — a good one; "arg psi" — the one ARG ψ field; A/B — STATE.)

## 9 · Josh's words (verbatim, copied by script from `ASK.md`)
> # Planning for 0.5.3 minor update
> ## Current Bugs
> - Sometimes the screen is unclickable and can't move the scene.
> - XYZ Grid in camera control work but animation doesn't if I control it from the rack window, it only updates on mouse release.
> - MO-Registry button doesn't really work in states mode (not orbital mode)? Also I don't really use states that much, you can rework that window and functions however way you like.
> - sometimes buckyball's mo registry selector thing doesn't work.
> - I haven't tried it on iPad yet but optimize the lambdawaves controls to be more intuitive.
> 
> ## Adjustments & Other Requests
> - Also could there be an option in camera so that it's the old camera system where it zooms from the center and pan is locked. Lock button for the pan camera home and maybe other controls that hold. You can insert that button anywhere in the window; there's space
> - Can Basis and Orbital knob in the molecules window be on the same row? The hide button can be to the right of the 'view' switcher
> - Alt+Shift+Drag is a fine camera pan control for the cursor or iPad kbm input
> - The current stage text thing is currently incorrect in the settings. In the live version it looks like this (screenshot)
> - Way more MO-Registry presets?
> - I like the store AB function and it's features, can we make it's UI look more unified in it's rack window?
> - Palette  Window: Invert button should be an icon like a half colored circle and can fit to the right of rotate. Delete the 'arg psi' view thing and just let it be a reader under rotate to replace the 'turn' text. move reset to be in the same row as palette on button. This way this shortens the window more. Remove the text where it says -pi, -pi/2, 0, and so on underneath the color picker bar? Instead let it be a little foating text that shows it's arg angle instead? Also unify the look better.
> - Also note the design of the preset picker in palette, this should match the control in 'molecules' window's section picker. Molecules on button should be in the same row as the 'installed' button. Also update the selector for molecule *under* the "molecules on" button.
> - Transport docked window needs a new look :c
> - Transport should also cycle dock to the timeline if timeline is open
> - Add the same button from BASIN'S moduation window where it's the MIR's square 3x3 logo that acts as the switcher to the timeline.
> - In the screenshot, where it shows the settings in display, those new controls for stage text, once created
> 
## 10 · The round's record
`PLAN-DRAFT-0.md` `dcbbb62` (Fable, 16:10) → `AUDIT-OPUS-1.md` `4649b42` (Opus @ high, 17:13; merged `b06f912`) → this PLAN. Every **[OPUS]** mark taken; none
overruled. Josh's cut word and any flipped ruling are appended here as §11.

## 11 · Josh's word and his six answers (2026-10-10 17:33, verbatim)
> 1: linux and just clicking around, but MIR racks are fine. 2: sphere rings. 3: the two rows are correct but make them their own window called 'Informational'. 4: restyle now. 5: Yes like the palette window's preset selector? section picker and molecules picker should look like palette window's selector. And if there's other things that could be 'left/right arrowed'. 6: Rack Tune

Taken as: **Q1** Linux desktop, a mouse, "just clicking around"; the MIR racks still answer → the STAGE alone is dead: causes A (the scene guard's rects) and B (a held pointer) are the live candidates, D (unpainted) is not — M4's brief says so. **Q2** the camera SPHERE's rings → M5 re-aimed. **Q3′** the two rows, in a new window INFORMATIONAL → M9 rewritten (+45, a WORKSPACE row; G-B amended). **Q4′** a CSS restyle now; the kit's bar + the dock cycle → 0.5.5 (R5). **Q5′** the PALETTE preset selector's left/right look for the section picker and the molecule picker; other "left/right-arrowable" controls listed for him (R12). **Q6 the name: RACK TUNE** → `0.5.3-alpha · Rack Tune · <date>`. **The build starts now: W1 = B-STAGE ∥ B-MOL.**
