# λWAVES 0.5.3 — PLAN DRAFT 0 (Claude Sos / Fable 5.1, 2026-10-10 ≈16:10 CDT) — "minor update": Josh's bug and adjustment list, measured

Josh's ask: `ASK.md` (verbatim, two screenshots). The ground: `localise/CAMERA-STAGE.md`, `localise/MOLECULES-MO-REGISTRY.md`, `localise/PALETTE-AB-TRANSPORT.md`
(three read-only explorers, 2026-10-10, every item at file:line in `v0.5.2-alpha`'s tree). The round: Josh's 10-09 default for a non-major release — this
draft + ONE Opus@high audit → `PLAN.md` → the build on his word. Name: Josh's (one or two words, no "The"); candidates offered: "Hand Polish", "Window Polish",
"Rack Tune".

## 0 · What the measuring found (the facts the rows stand on)

1. **The red formula is one record.** `lab/latex-state.js:95-100` `formulaLatex` maps subscript digits and ⁺/⁻ but not superscript digits; of the 90 library
   formulas exactly one, B₁₂H₁₂²⁻ (`library.json` id `B12H12--`), carries one → `\mathrm{B_{12}H_{12}²^{-}}` → KaTeX's double-superscript error, rendered red.
   No test renders every formula through KaTeX.
2. **C₆₀'s registry is a ladder of 300 with 8 rungs.** The MO-REGISTRY offers every level (ε is stored for all 300 AOs) but the RECORD_ONLY record carries
   8 orbital columns (175–182); `orbitalsview.js` `select`/`paintLevels`/`crossed` check only `k >= nAO`, so almost any click adds an uncarried level,
   ON is refused with a warn line, and if already ON `update()` silently stops — the picture freezes with the lamp lit. Second cause: a failed fetch of the
   record (it is past the cap) leaves `sol = null`, and re-picking fires no `change`. No test drives C₆₀ through the UI.
3. **The STATES register's ON switch answers only in whispers.** `statesview.js:282` refuses until the ladder worker returns; `mathworker.js:329` refuses
   records with no CIS states (C₆₀ and the frontier records); the feedback is a status line; a fresh register is S₀ alone and the default CHANGE view against
   GROUND is ΔD = 0 (a blank stage); every new ground solve turns STATES OFF (`:635`); a restored STATES-ON project may come back OFF. STATES is 738 + 267 + 76
   lines with 19 saved modulation targets (`reg.*`), `__LW.states`, persist and session couplings.
4. **The DISPLAY tab lost two rows at wave 157.** The tree has ONE row, STAGE TEXT + SIZE (`settings-card.js:17-18`; one switch and one knob drive the
   formula, the fade, the capture caption and the atom labels together, `stage-words.js:84-118`). The live site and Josh's screenshot have TWO: STAGE FORMULA +
   SIZE and ATOM LABELS + SIZE. `stage-text.browser-test.mjs:104` pins the one-row form.
5. **The dead stage has five candidate causes and no test for any.** (A) the scene guard's rects ignore opacity / visibility / `pointer-events` and union the
   modulation window with its bars (`lab/mir/scene-guard.js:129,154` — the kit's; the app-side seat is `rack-wiring.js:304`); (B) a lost pointerup leaves
   `special`/`points` held and every later press returns at `stage-gestures.js:67` (Ctrl+click as a context menu on macOS/iPad kbm starts the bow `special`);
   (C) the dialog's window-capture pointerdown; (D) `schedule()`'s early returns (mod syncing, export lock, hidden page) — "dead" but only unpainted; (E) two
   fixed small dead boxes. Only blur/pagehide heal (B).
6. **The camera card has no release-only path.** Every knob and the sphere write per move through `material.js:119` → `cameraPort.set` → `present()` →
   `schedule(TIER.PRESENT)`; the only release-bound work is a 250 ms save debounce. There is no "XYZ grid" in the card: the candidates are the sphere's three
   world rings, FRAME/AXES on DISPLAY (segs, no drag), or a dial under a modulation route (a hand write goes to the base; the pose follows the clock).
7. **The classic camera is one flag.** `createCameraLaw` (`camera-law.js:166-176`) has one `anchor` and one `setShift`/`panBy`; the 0.3.x camera (waves
   146–147) was `anchor` at CENTRE with no shift. PAN HOME is `verbs[0]`. PREFERENCE lives beside friction/spin/dragGain/fling in `shell/settings.js:37,98-101`.
8. **Alt+Shift+Drag already pans** (`stage-gestures.js:14,33`: the slide mask names Alt, Shift is ignored) at 1:1.
9. **MOLECULES' rows** (`chemview.js:82-174`): `rH` ◂ SECTION ▸ INSTALLED; `r0` MOLECULES ON · the select · BASIS; `r1` VIEW · VALENCE · ORBITAL · the chevron.
   `seats()` swaps VALENCE/ORBITAL by view (they move as a pair). Presets: ORBITAL 2 (HOMO + LUMO, WINDING), STATES 7.
10. **PALETTE is the kit's ramp panel with λWAVES' text.** The −π…+π tick text is ours (`material.js:99`); INVERT is our row (`:108-110`) and the kit already
    draws the half-filled disk (`glyph.js:318` `invertColors`, used by `grade.js:191`); RESET and the preset stepper are the kit's; the ARG ψ number field is
    the kit's with our label; ROTATE's "turn" text is hard-coded in the kit knob. Dead rules from the old `paletteview.js` remain (`skin.css:325,380-381`,
    `lab.css:475-478`).
11. **A/B is three surfaces that look like three features.** STATE (kit trigs STORE A · A · STORE B · B in a 2×2 grid, TRANSITION + Ω RABI + a two-line
    readout; nothing lights when stored), MO-REGISTRY and STATES (raw buttons → A / → B with an `.on` lamp, MORPH + A ↔ B, no recall).
12. **The 3×3 switcher is already in the kit** (`lab/mir/window/workspaces.js:82-91` `workspaceSwitch`, mounted by `modulation/window.js:721-724` when the
    port has `switchWorkspace`); λWAVES' `mod-port.js:141` drops the key. The kit's timeline accepts a shared transport (`timeline/window.js:84-96`,
    `mountIn`/`sync`); λWAVES passes none. The docked TRANSPORT's look is `skin.css:417-481` (a 5-column grid) with legacy rules beside it.

## 1 · The rows

Each row: a builder, a `BRIEF-M<n>.md`, `M<n>-BUILD.md` with "what Josh will see" (this release he SEES things — each row says exactly what), the owning suites,
and `node tests/pwa.test.mjs --write` after every `lab/` edit. Sizes S ≤ 2 h, M ≈ 4 h, L ≈ 8 h.

| # | row | what | closer | size · model |
|---|---|---|---|---|
| **M1 THE FORMULA** | `formulaLatex` maps each run of `[⁰-⁹⁺⁻]+` to one `^{…}` (`²⁻` → `^{2-}`; NH₄⁺ still `^{+}`); a node sweep renders every library formula through KaTeX with `throwOnError:true` (the gap). The record's baked `page` field is left (its hash is the library's). | `latex-state.test.mjs` + the sweep; `molecule-head`; the stage shows B₁₂H₁₂²⁻ typeset | S · Sonnet |
| **M2 C₆₀'S LADDER** | with `sol.cols` set, `select`/`paintLevels`/`crossed()` skip uncarried levels and draw them dim; a failed record fetch restores `preset` (or re-solves on re-pick) so the dropdown answers; a browser case drives C₆₀'s ladder and asserts ON is never refused by a click on a dim rung | `register` R0–R10; the new C₆₀ case; `library.test` | M · Opus |
| **M3 STATES ANSWERS** | ON with S₀ alone applies BEAT (the stage shows something) or says "add a state" in the status line; the auto-off on a re-solve goes (the register re-arms when the ladder returns); restore re-arms STATES-ON; the refusal for records with no CIS states becomes a visible sentence on the switch. **No cut of STATES this release** (ruling R2): its 19 modulation targets and `__LW.states` stay byte-stable. | `register`, `molecular-register.test`, `molecular-drive.test`, `history` (STATES ground-lane bytes), `new-project --check` | M · Opus |
| **M4 THE LIVE STAGE** — the measuring row, first and alone | (a) `tools/stage-dead-probe.mjs`: samples a grid over `#stage` in 10 scenes and asserts every point where `guard.hit` is true lies on a visible interactive element; (b) the stuck-pointer heal: `pointerDown` finishes a held `special`/`points` of the same id first; `pointerMove` finishes a mouse drag whose `buttons === 0`; (c) the app-side rect filter at `rack-wiring.js:304` (skip opacity 0 / `visibility:hidden` / `pointer-events:none`; union each modulation bar separately) + a MIR brief for `scene-guard.js` `rectOf`; (d) the two fixed dead boxes measured and, if the corner-axis hit is dead under `ui-hidden`, hidden with it. The probe's reading before/after is the BUILD. | `stage-gestures.test` (+ the lost-pointerup case); the probe 10/10; `hit-probe-set`; `frame-occlusion` 7; `opener` | M · Opus |
| **M5 THE DIAL ANSWERS LIVE** | measure before building: a CDP drag of each CAMERA dial and of FRAME/AXES, sampling `__LW.obs` and `stats.presents` before mouseup; if a dial commits late, `schedule(TIER.PRESENT)` after `cameraPort.set` at `material.js:119` (and `mod-port.js:86` `hand` for a routed dial). If none does, the BUILD says which control Josh's words meant could not be found and asks (Q2). | the drag probe; `camera-shift`; `camera-routes` 5/5 | S · Sonnet |
| **M6 CLASSIC CAMERA** | a `locked` flag in `createCameraLaw`: `anchor` at CENTRE, `setShift`/`panBy` early-return, `setShift(0,0)` on engage, the two raw `observer.pan*` routes clamped; a `lock` id on `ROADS`; PREFERENCE `camLock` beside friction (`settings.js:37,98-101`; `STATE-SCOPES.md:45`); the control: a LOCK switch beside `SET Δρ REF` (`material.js:123`, the row with free space) — ruling R3: the lock holds the PAN only (zoom from the centre is what "locked pan" means; FOV, mode, yaw/pitch stay live) | `current:173,181`, `new-project.test:39,45`, `first-run.test:141`, `settings-probe` (the new key), `new-project --check` exact; `camera-shift`; `stage-gestures.test` (`atCursor` under the lock) | M · Opus |
| **M7 THE PAN CHORD** | no code: Alt+Shift+Drag already pans. The row documents it — the note at `material.js:124` and the key table (`key-table.js`) name Alt(+Shift)+Drag as the pan — and adds the Shift case to `stage-gestures.test`. Ruling R8: if Josh meant a FINE pan, `slide()` multiplies by `law.FINE` under Shift (one line, read per move). | `stage-gestures.test`; `keyboard-shortcuts` | S · Sonnet (with M5) |
| **M8 MOLECULES' ROWS** | ORBITAL + VALENCE move into `r0` beside BASIS (the pair stays a pair under `seats()`); the chevron sits right of VIEW in `r1`; MOLECULES ON moves into `rH` after INSTALLED; the select stays alone under it in `r0`; `lab.css:782-784` keeps the section row tight | `molecule-demos`, `molecular-names`, `chem`, `molecule-head` (labels, not rows); a hit-probe of the new rows on a phone width | S · Sonnet |
| **M9 TWO ROWS ON DISPLAY** | STAGE FORMULA + SIZE and ATOM LABELS + SIZE return (the live site's form, Josh's screenshot): `stage-words.js` splits `setOn`/`setScale` into formula and labels; keys `atomLabels` + `atomLabelsSize` restored beside `molFormula`/`molFormulaSize` (PREFERENCE); `stage-text.browser-test:104` re-pinned to two rows; `notebook.js:109`, the capture caption, `molecule-head.browser-test:80`, `new-project.test:40` follow. Josh's last bullet: "those new controls for stage text" live on this tab. | `stage-text`, `molecule-head`, `new-project --check`, `settings-probe` | M · Opus |
| **M10 MORE REGISTRY PRESETS** | ORBITAL presets 2 → 8, each with a refusal sentence and inside `sol.cols` for RECORD_ONLY molecules: HOMO · LUMO · FRONTIER FOUR (HOMO−1…LUMO+1) · DEGENERATE SET (the whole e/t set at HOMO) · σ + σ* (the bonding pair of the lowest valence level) · OCCUPIED (all valence, equal phase) — ruling R4 lists them; Josh may add or strike. STATES presets unchanged. Stage banners pinned per preset. | `register`; `stage-text:73-81` (+ one banner per preset); `molecule-demos` | M · Opus (after M2) |
| **M11 ONE A/B** | one `abRow(host, api, { verbs })` builder used by STATE, MO-REGISTRY and STATES: STORE A · A · STORE B · B as kit `trig`s with a stored lamp on STORE; MORPH / TRANSITION as the row's switch; the readout one line. Labels `STORE A`/`STORE B` kept (tests find them by text). Ruling R7: all three surfaces. | `current:150,193`, `history:162`, `new-project.browser:69,89`, `register` | M · Opus |
| **M12 PALETTE, SHORTER** | λWAVES-side now: INVERT → `glyph:'invertColors'`, re-seated into the ramp's verbs row right of ROTATE (the `rInv` row goes); RESET re-seated into the PALETTE-ON row; `ticks: []` + CSS collapsing `.mir-ramp-ticks:empty`; a small floating angle readout driven by the `ramp.set` callback (the selected stop's angle, ruling R6); the ARG ψ field hidden by CSS (`.mir-ramp-at`); the preset stepper restyled to the section-picker look (`.pal-nav` + `.ro`, CSS only); the four dead rules out. MIR briefs filed (not built): a `verbs` extras slot, a reset seat option, `labels.rotate(rad)` for the knob's "turn", `labels.float`, `stepper({pager:true})` through `ramp.js:122`. | `menubar:166`; `history:169-170` (selectors kept); `boot:4162-4165` re-aimed; `official-defaults-palette`; `settings-probe` | M · Opus |
| **M13 TRANSPORT + TIMELINE** | (a) the 3×3 switcher: `mod-port.js:141` passes `switchWorkspace`; `shell/modulation.js:210` supplies `() => app.state.ws.show('lower')`; `keys.js` builds `app.state.ws = createWorkspaces({ upper: modView, lower: tl.win })` after `installTimeline` and routes `moved`/`onWindow` — wiring, no brief; (b) the dock cycle pill → rack → timeline (only while `tl.isOpen()`) → pill through a `shared` shim around `#transport` (`mountIn`/`sync`; the kit mounts on open/close so the shim remembers the wish); `modDodge`'s `mini` guard and `stage-words.js:55` `avoid` learn the work-lane seat; `.mod-logo` → `ws.show('upper')` in the work lane; (c) the docked look: ruling R5 — this release RESTYLES λWAVES' docked grid (`skin.css:417-481`, the legacy rules `:333-367` subtracted) to the kit's work-bar idiom; the kit's `createTransport` with `LAMBDAWAVES_LAYOUT` is the 0.5.5 candidate (it replaces `transport.js`, `native-ui.js`, ≈100 CSS lines — MIR-paced) | `menubar:179` (the cycle skips a closed timeline), `timeline` T1–T5, `history:386`, `frame-occlusion` (the work lane masked), `keyboard-shortcuts` | L · Opus |
| **M14 THE iPAD SESSION** | no build: a one-page checklist for Josh's first iPad pass (the rows above on touch: the chord, the lock, the rows, the dock cycle) + `tools/perf/device-report.js` run once; his notes become 0.5.5 rows | — | — |
| **M-V** | one fresh Opus verifier: the lock 860 + 1004 · 0/0 (the camera lock engaged AND not); the serialize bytes 11/11 vs 0.5.2 for a project saved under the old keys; `settings-probe` 0/6; `new-project --check`; the stage probe; the whole browser estate + the boot suite alone; the line law; CLAUDE.md against the tree; FIT / NOT FIT → a fix round → the local cut on Josh's word | — | — |

## 2 · The gates
- **G-N** node gate 0 after every row. **G-L** THE LOCK at M4, M6 and M-V (a camera flag must not move a digest; the lock's states are rendered at HOME — the
  BUILD proves it with the lock engaged and not). **G-B** serialize-bytes 11/11 vs `v0.5.2-alpha` for every row that touches no key; a row that ADDS a
  PREFERENCE key (M6 `camLock`, M9 `atomLabels*`) states the new byte count and keeps `new-project --check` exact. **G-P** `settings-probe` 0/6. **G-S** the
  owning suites per row; the estate + the boot suite alone at M-V. **G-H** the stage probe 10/10 from M4 on. **G-W** `lw-facade` 1/1 — M6 adds no member unless
  `LW.camera.lock` is wanted (it is: one getter, `--write` with the reason). **G-Lines** `lab/*.js` + shell + windows ≤ 28,222 at the cut (27,943 + 1 %): the
  rows ADD UI (M6, M10, M11, M13) — each states its lines and subtracts the dead rules it finds (M12's four, M13's legacy transport CSS, STATES' blank-field
  path). **G-Eye** every row's BUILD says exactly what Josh will see, with a before/after PNG pair under `research/release-0.5.3/eye/`.

## 3 · Order and the dial
M4 alone first (the probe is the gate every later UI row runs). Then three pairs by file disjointness: **PAIR 1** {M1 + M2 + M3 + M10 — the registry/molecules
builder} ∥ {M6 + M5 + M7 — the camera builder}; **PAIR 2** {M12 — palette} ∥ {M11 — A/B}; **PAIR 3** {M8 + M9 — molecules rows + display} ∥ {M13 — transport}.
Then M-V, a fix round, the cut. Opus for M2–M4, M6, M9–M13; Sonnet for M1, M5, M7, M8 (Josh 10-09). ≈ 6 builders ≈ 32 builder-hours ≈ 1.5 relay days.

## 4 · What Josh will see (the point of this release)
A typeset B₁₂H₁₂²⁻; C₆₀'s registry that answers; a STATES switch that says why or shows BEAT; a stage that never goes dead (and a probe that proves it); a
LOCK on the camera that returns the old centred zoom; a documented pan chord; MOLECULES two rows shorter; the DISPLAY tab with STAGE FORMULA and ATOM LABELS
back, each with its size; eight orbital presets; one A/B look in three windows; a PALETTE two rows shorter with a half-disk INVERT, a floating angle and a
section-style preset picker; a docked TRANSPORT in the kit's idiom, the 3×3 switch to the TIMELINE, and a dock that cycles into it.

## 5 · What is not claimed
The STATES window is not redesigned (R2); the kit's transport is not adopted (R5); no MIR brief is built here (five are filed from M12, one from M4); the iPad
is not tuned (M14 waits for Josh's notes); the "XYZ grid" bug is not fixed until it is found (M5 measures first).

## 6 · RULINGS TAKEN AS DEFAULTS (Josh may flip any; the build starts on his word)
- **R1 the name** — Josh's. **R2 STATES** — keep and fix; the shrink/cut is a 0.5.5 candidate with its 19-target cost written. **R3 the lock** — pan only.
- **R4 the presets** — the six named in M10. **R5 the transport look** — restyle λWAVES' docked grid now; the kit's bar is 0.5.5. **R6 ARG ψ** — the stop
  field is hidden, the reader shows the selected stop's angle in radians (and degrees on hover). **R7 A/B** — all three surfaces share the row. **R8 the
  chord** — Alt+Shift+Drag documented as the pan; no fine mode unless Josh says "fine" meant fine-grained. **R9 iPad** — a checklist, no build. **R10 DISPLAY**
  — two rows back, as the live site.

## 7 · Questions only Josh can answer (the build does not wait on them; the defaults above stand)
- **Q1** the dead stage: which device and input (Mac? iPad with a keyboard? Ctrl or Alt held?), was a banner showing, did a rack click or the H key still work,
  and did switching apps free it? (It picks between A, B and D.)
- **Q2** "XYZ Grid in camera control": which control exactly — the sphere's rings, the FRAME/AXES segs on DISPLAY, or a dial with a modulation route on it?
- **Q3** "MO-Registry button … in states mode": the ON switch, or the ORBITAL | STATES seg?
- **Q4** "Alt+Shift+Drag is a fine camera pan control": "fine" as in good (document it) or fine-grained (slow it under Shift)?
- **Q5** "the arg psi view thing": the ARG ψ number field under the colour strip?
- **Q6** the A/B request: the STATE window only, or the registry windows too?
