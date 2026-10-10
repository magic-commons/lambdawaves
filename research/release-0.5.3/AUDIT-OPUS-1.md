# AUDIT-OPUS-1 · the one senior audit of PLAN-DRAFT-0 for 0.5.3, and the plan as edited (Opus 5.5 @ high, Sat Oct 10 05:13 PM CDT 2026)

**AUDIT: COMPLETE.** Part A is the edited plan, for `PLAN.md`. Part B holds the notes. Every number was checked on this tree (`1970b1c`, branch `sos-s0`'s tip),
except where marked ESTIMATE or UNMEASURED.

I read these whole: `ASK.md` and its two screenshots, the three `localise/*.md`, `PLAN-DRAFT-0.md`, the 0.5.0 `AUDIT-OPUS-1.md` (for its shape), `CLAUDE.md`,
`docs/NOTES-FOR-AGENTS.md`, and 0.5.2 `PLAN.md` §2 and §9. I checked every file:line in DRAFT 0 §0–§1 with `grep`/`sed`/`awk` on single files: the app files the
draft names, the kit files it leans on (`shell/{scene-guard,transport}.js`, `window/workspaces.js`, `modulation/window.js`, `timeline/window.js`, `panels/{ramp,camera}.js`),
and every test in the closers. I ran nothing but `ls`, `grep`, `sed`, `awk`, `wc`, read-only `git`, and three read-only `node -e` one-liners: the C₆₀ record's `cols`, the
superscript regex, and a dry run of the fix. I edited no file but this one.

**Since the draft.** `lab/` is unchanged from `bb7d638`, where the explorers read it, to `1970b1c`. Since then only research files have landed (the 0.5.3
localisations, the draft, and the 0.5.4 NACRE/PILOT-AUDIT). `cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l` = **27,943**, which is 0.5.2's cut. The cap is
**28,222** (27,943 × 1.01, rounded down). The headroom is **+279**.

---

# PART A — THE PLAN, AS EDITED (PLAN-DRAFT-0 · OPUS EDIT, for PLAN.md)

*Every change is marked **[OPUS: …]**. A struck line is ~~struck~~ with its reason. Unmarked text is DRAFT 0's, kept as it was.*

# λWAVES 0.5.3 — PLAN DRAFT 0 (Claude Sos / Fable 5.1, 2026-10-10 ≈16:10 CDT) — "minor update": Josh's bug and adjustment list, measured

Josh's ask: `ASK.md` (verbatim, two screenshots). The ground: `localise/CAMERA-STAGE.md`, `localise/MOLECULES-MO-REGISTRY.md`, `localise/PALETTE-AB-TRANSPORT.md`
(three read-only explorers, 2026-10-10, every item at file:line in `v0.5.2-alpha`'s tree). The round: Josh's 10-09 default for a non-major release — this
draft + ONE Opus@high audit → `PLAN.md` → the build on his word. Name: Josh's (one or two words, no "The"); candidates offered: "Hand Polish", "Window Polish",
"Rack Tune". **[OPUS: The "NEXT MAJOR TASK" half of ASK.md (0.5.4 PRE-MATH) is out of this plan's scope. It lives in `research/release-0.5.4/NACRE.md`.]**

## 0 · What the measuring found (the facts the rows stand on)

1. **The red formula is one record.** `lab/latex-state.js:95-100` `formulaLatex` maps subscript digits and ⁺/⁻ but not superscript digits; of the 90 library
   formulas exactly one, B₁₂H₁₂²⁻ (`library.json` id `B12H12--`), carries one → `\mathrm{B_{12}H_{12}²^{-}}` → KaTeX's double-superscript error, rendered red.
   No test renders every formula through KaTeX. **[OPUS: CONFIRMED. There are 91 formula rows: 37 in `library.json` (B₁₂H₁₂²⁻ at `:3941`) and 54 in `molecules.js`. The live
   site is v0.3.3-alpha, which had no `library.json`, so the red screenshot comes from the local tree, not from the live site.]**
2. **C₆₀'s registry is a ladder of 300 with 8 rungs.** … **[OPUS: CONFIRMED. The record's `ground.cols` = [175…182] and nocc = 180, so the HOMO set is 175–179
   and the LUMO set 180–182. The citations are `select` :188-189, `paintLevels` :197-201, `crossed` :513-515, the refusal :257 and `update` :558-566. For the second
   cause, `chemview.js:258` sets `preset` first, `:322` sets `sol = null`, and `:124` + the comment at `:94-97` ("a re-pick would be a no-op anyway") is true only
   while `sol` is good.]**
3. **The STATES register's ON switch answers only in whispers.** … **[OPUS: `mathworker.js:328`, not `:329`. "May come back OFF" is CONFIRMED by reading. A parked
   `load` (`statesview.js:705`) turns ON off. The ladder's landing (`:172`) applies the record and never re-arms. `persist.js:232`'s `setOn(true)` is refused at
   `:309-310` while the ladder is out.]**
4. **The DISPLAY tab lost two rows at wave 157.** … **[OPUS: CONFIRMED. The citations are `lab/windows/settings-card.js:17-18`, `lab/shell/stage-words.js:83-118`, and `native-ui.js:66`,
   which seats the row. The live site is v0.3.3-alpha (`rack.js:1302,1305` there). Wave 157 shipped in v0.4.0-alpha.]**
5. **The dead stage has five candidate causes and no test for any.** … **[OPUS: The kit file is `lab/mir/shell/scene-guard.js`: `rectOf` is at `:128-132` and the
   union at `:153-154`. The app-side seat (`lab/shell/rack-wiring.js:304`) reaches only the `extra` list (transport, notebook, sheet, offer, the two rack lists),
   never the float layer's union. For (B): `:67`'s `special ||` refuses EVERY later press, not only one with the same id, and on a touch screen the next touch arrives with a NEW id.]**
6. **The camera card has no release-only path.** … **[OPUS: CONFIRMED (`lab/windows/material.js:119`). Two candidates are added. The PAN pad is literally an XY grid,
   and its `onInput` writes on every move (`mir/controls/factory.js:90`). A routed dial's drag can also run into `schedule()`'s `mod.syncing` return (`rack.js:266`).]**
7. **The classic camera is one flag.** … **[OPUS: CONFIRMED (`camera-law.js:165-176`, PAN HOME at `:195`). A project restore also writes `obs.shift` raw, at
   `shell/persist.js:163`, so the lock must cover that road too.]**
8. **Alt+Shift+Drag already pans** (`stage-gestures.js:14,33`: the slide mask names Alt, Shift is ignored) at 1:1. **[OPUS: CONFIRMED (+ `:70`). The test is at `:107-114`.]**
9. **MOLECULES' rows** (`chemview.js:82-174`) … **[OPUS: CONFIRMED (the chevron is at `:234`). `rebuildOrbKnob` uses `replaceWith` (`:363`), so it works in any row. The
   rack is 300 px wide (`mir/css/skin.css:24`).]**
10. **PALETTE is the kit's ramp panel with λWAVES' text.** … **[OPUS: The kit paths are `lab/mir/panels/ramp.js:121-159` and `lab/mir/glyph.js:318`. The "dead rules" are wrong in
    two ways. `lab.css:478` `.pal-color` is LIVE: it styles SETTINGS' stage-colour well (`windows/settings-card.js:96`), so it stays. The dead ones are `skin.css:325` and `:380-381`,
    and `lab.css:475-477` (`.pal-wrap`, `.pal-strip`, `.pal-ring`, plus `.pal-ring` in `skin.css:20`'s list). All of these are CSS, which G-Lines does not count.]**
11. **A/B is three surfaces that look like three features.** … **[OPUS: `lab/windows/state.js:47-67`; `native-ui.js:78-79` reorders them.]**
12. **The 3×3 switcher is already in the kit** … **[OPUS: CONFIRMED (`workspaces.js:82-89`, `modulation/window.js:722-724`, `timeline/window.js:84-87`).
    `mod-port.js:141` destructures its keys and drops `switchWorkspace`. NEW: the kit's bar already carries λWAVES' arrangement (`lab/mir/shell/transport.js:540`
    `LAMBDAWAVES_LAYOUT`), and `placementOf` (`:69`) seats it in the rack, then a showing work lane, then the stage. That is the dock-into-the-timeline the ask wants.]**

## 1 · The rows

Each row: a builder, a `BRIEF-M<n>.md`, `M<n>-BUILD.md` with "what Josh will see" (this release he SEES things — each row says exactly what), the owning suites,
and `node tests/pwa.test.mjs --write` after every `lab/` edit. Sizes S ≤ 2 h, M ≈ 4 h, L ≈ 8 h. **[OPUS: Each row also books its exact JS line delta against
Part B §6's estimate, and stops to report at 1.5× that estimate.]**

| # | row | what | closer | size · model |
|---|---|---|---|---|
| **M1 THE FORMULA** | `formulaLatex` maps each run of ~~`[⁰-⁹⁺⁻]+`~~ **[OPUS: `[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+`, spelled out. ¹ ² ³ are U+00B9/B2/B3, outside the range ⁰-⁹ (U+2070–2079), so the draft's class misses the very ² it was written for. Checked: `/[⁰-⁹]/.test('²')` is false. The two ⁺/⁻ replaces at `:98` fold into it.]** to one `^{…}` (`²⁻` → `^{2-}`; NH₄⁺ still `^{+}`); a node sweep renders every library formula through KaTeX with `throwOnError:true` (the gap). **[OPUS: The sweep runs over `MOLECULE_BY_ID` and asserts at least 91 rows, so the silent `{rows:[]}` fallback (`molecules.js:500-503`) cannot pass an empty sweep.]** The record's baked `page` field is left (its hash is the library's). | `latex-state.test.mjs` + the sweep; `molecule-head`; the stage shows B₁₂H₁₂²⁻ typeset | S · ~~Sonnet~~ **[OPUS: rides in B-MOL (Opus); ≈ +3]** |
| **M2 C₆₀'S LADDER** | with `sol.cols` set, `select`/`paintLevels`/`crossed()` skip uncarried levels and draw them dim; a failed record fetch restores `preset` (or re-solves on re-pick) so the dropdown answers; a browser case drives C₆₀'s ladder and asserts ON is never refused by a click on a dim rung **[OPUS: Restore at `chemview.js:322`: put `preset` back to the last solved id before `sol = null`. The re-solve-on-re-pick alternative is struck; one road is enough.]** | `register` R0–R10; the new C₆₀ case; `library.test` | M · Opus **[OPUS: ≈ +12]** |
| **M3 STATES ANSWERS** | ON with S₀ alone applies BEAT (the stage shows something) ~~or says "add a state" in the status line~~ **[OPUS: struck. One behaviour, not two.]**; the auto-off on a re-solve goes (the register re-arms when the ladder returns); restore re-arms STATES-ON; the refusal for records with no CIS states becomes a visible sentence on the switch. **[OPUS: The re-arm is ONE seat: `statesview.js:172` honours `wanted.on`, and a `setOn(true)` refused while the ladder was out. `persist.js` is NOT touched; B-CAM owns `:163`.]** **No cut of STATES this release** (ruling R2): its 19 modulation targets and `__LW.states` stay byte-stable. | `register`, `molecular-register.test`, `molecular-drive.test`, `history` (STATES ground-lane bytes), `new-project --check` | ~~M~~ **[OPUS: S]** · Opus **[OPUS: ≈ +12]** |
| **M4 THE LIVE STAGE** — the measuring row, ~~first and alone~~ **[OPUS: first, beside B-MOL (file-disjoint)]** | (a) `tools/stage-dead-probe.mjs`: samples a grid over `#stage` in 10 scenes and asserts every point where `guard.hit` is true lies on a visible interactive element; (b) the stuck-pointer heal: `pointerDown` finishes a held `special`/`points` of the same id first; `pointerMove` finishes a mouse drag whose `buttons === 0` **[OPUS: Also, a held `special` or point whose capture is gone (`!canvas.hasPointerCapture(id)`) is finished as cancelled on the next press, whatever its id. A new touch has a new id, so the same-id rule alone never heals an iPad.]**; (c) the app-side rect filter at `rack-wiring.js:304` (skip opacity 0 / `visibility:hidden` / `pointer-events:none`~~; union each modulation bar separately~~ **[OPUS: struck. The union is computed inside the kit (`scene-guard.js:153-154`), where no app callback can reach it, so the MIR brief alone carries it. The filter lives in the `extra` callback and never in `occlusion.js` `paintedRect`, which also feeds the shader mask.]**) + a MIR brief for `scene-guard.js` `rectOf`; (d) the two fixed dead boxes measured and, if the corner-axis hit is dead under `ui-hidden`, hidden with it. The probe's reading before/after is the BUILD. | `stage-gestures.test` (+ the lost-pointerup case **[OPUS: + a lost touch then a new touch id]**); the probe 10/10; `hit-probe-set`; `frame-occlusion` 7; `opener` | M · Opus **[OPUS: ≈ +10; the probe sits in `tools/`]** |
| **M5 THE DIAL ANSWERS LIVE** | measure before building: a CDP drag of each CAMERA dial **[OPUS: + the PAN pad, and one routed dial]** and of FRAME/AXES, sampling `__LW.obs` and `stats.presents` before mouseup; if a dial commits late, `schedule(TIER.PRESENT)` after `cameraPort.set` at `material.js:119` (and `mod-port.js:86` `hand` for a routed dial). If none does, the BUILD says which control Josh's words meant could not be found and asks (Q2). | the drag probe; `camera-shift`; ~~`camera-routes` 5/5~~ **[OPUS: `tools/camera-routes.mjs` 5/5]** | S · ~~Sonnet~~ **[OPUS: in B-CAM (Opus)]** |
| **M6 CLASSIC CAMERA** | a `locked` flag in `createCameraLaw`: `anchor` at CENTRE, `setShift`/`panBy` early-return, `setShift(0,0)` on engage, the two raw `observer.pan*` routes clamped; a `lock` id on `ROADS`; PREFERENCE `camLock` beside friction (`settings.js:37,98-101`; `STATE-SCOPES.md:45`); the control: a LOCK switch beside `SET Δρ REF` (`material.js:123`, the row with free space) — ruling R3: the lock holds the PAN only (zoom from the centre is what "locked pan" means; FOV, mode, yaw/pitch stay live) **[OPUS: Also the restore seat `shell/persist.js:163`: a project's non-zero shift opens centred while the lock is on, and the project's bytes are untouched. `camLock` joins the PREF set in `new-project.test.mjs:39`. The getter is nested (`__LW.camera.lock`), so `lw-facade` stays 1/1 with no `--write`, because that fixture reads only `__LW`'s top-level descriptors. A test case: Ctrl+Shift+Q/E (the dolly zoom) under the lock keeps the shift at 0.]** | `current:173,181`, `new-project.test:39,45`, `first-run.test:141`, `settings-probe` (the new key), `new-project --check` exact **[OPUS: with NO regeneration]**; `camera-shift`; `stage-gestures.test` (`atCursor` under the lock) | M · Opus **[OPUS: ≈ +18]** |
| **M7 THE PAN CHORD** | no code: Alt+Shift+Drag already pans. The row documents it — the note at `material.js:124` and the key table (`key-table.js`) name Alt(+Shift)+Drag as the pan — and adds the Shift case to `stage-gestures.test`. Ruling R8: if Josh meant a FINE pan, `slide()` multiplies by `law.FINE` under Shift (one line, read per move). | `stage-gestures.test`; `keyboard-shortcuts` | S · ~~Sonnet (with M5)~~ **[OPUS: in B-CAM; ≈ 0]** |
| **M8 MOLECULES' ROWS** | ~~ORBITAL + VALENCE move into `r0` beside BASIS (the pair stays a pair under `seats()`); the chevron sits right of VIEW in `r1`; MOLECULES ON moves into `rH` after INSTALLED; the select stays alone under it in `r0`~~ **[OPUS: struck as self-contradictory. A 300 px rack cannot hold the select (flex-basis 200 px) beside BASIS and a knob. The target, from Josh's three sentences: `rH` = ◂ SECTION ▸ · INSTALLED · MOLECULES ON; `r0` = the MOLECULE select alone, under ON; `r1` = BASIS · ORBITAL/VALENCE (still a pair under `seats()`); `r2` = VIEW · the chevron. That is three rows plus the header, where today has two, unless VIEW and the chevron fit beside BASIS and ORBITAL. The builder measures at 300 px and at phone width and reports the count.]**; `lab.css:782-784` keeps the section row tight | `molecule-demos`, ~~`molecular-names`~~ **[OPUS: `molecular-names.browser-test`]**, `chem`, `molecule-head` (labels, not rows); a hit-probe of the new rows on a phone width | S · ~~Sonnet~~ **[OPUS: in B-DISP (Opus), W3; ≈ 0]** |
| **M9 TWO ROWS ON DISPLAY** | STAGE FORMULA + SIZE and ATOM LABELS + SIZE return (the live site's form, Josh's screenshot): `stage-words.js` splits `setOn`/`setScale` into formula and labels; keys `atomLabels` + `atomLabelsSize` restored beside `molFormula`/`molFormulaSize` (PREFERENCE); `stage-text.browser-test:104` re-pinned to two rows; `notebook.js:109`, the capture caption, `molecule-head.browser-test:80`, `new-project.test:40` follow. Josh's last bullet: "those new controls for stage text" live on this tab. **[OPUS: An absent `atomLabels` takes the stored `molFormula` once, so a 0.4–0.5.2 profile with STAGE TEXT off keeps its labels off. `native-ui.js:66` seats the two rows. The capture caption follows STAGE FORMULA.]** | `stage-text`, `molecule-head`, `new-project --check`, `settings-probe` | M · Opus **[OPUS: ≈ +18]** |
| **M10 MORE REGISTRY PRESETS** | ORBITAL presets 2 → 8, each with a refusal sentence and inside `sol.cols` for RECORD_ONLY molecules: HOMO · LUMO · FRONTIER FOUR (HOMO−1…LUMO+1) · ~~DEGENERATE SET (the whole e/t set at HOMO) · σ + σ* (the bonding pair of the lowest valence level)~~ **[OPUS: HOMO SET (the whole degenerate HOMO level) · LUMO SET. σ + σ* is struck: ε alone cannot pair a bonding orbital with its antibonding partner, so the preset would name a pair it cannot find.]** · OCCUPIED (all valence, equal phase) — ruling R4 lists them; Josh may add or strike. STATES presets unchanged. Stage banners pinned per preset **[OPUS: in one loop. The presets are a table of `(name → levels, phases, refusal)`, not six more if-arms in `preset()` `:216`.]** | `register`; `stage-text:73-81` (+ one banner per preset); `molecule-demos` | M · Opus (after M2) **[OPUS: ≈ +25]** |
| **M11 ONE A/B** | ~~one `abRow(host, api, { verbs })` builder used by STATE, MO-REGISTRY and STATES: STORE A · A · STORE B · B as kit `trig`s with a stored lamp on STORE; MORPH / TRANSITION as the row's switch; the readout one line.~~ **[OPUS: R7 flipped to STATE only. "Its rack window" is one window, and STORE A / STORE B are STATE's words alone. A shared builder would also edit `orbitalsview.js` and `statesview.js`, which are B-MOL's files. The STATE card's group is restyled: one row STORE A · A · STORE B · B, with the stored slot lit by a class (CSS `::after`, never a child text node, because `current:150` finds the buttons by exact `textContent`), and TRANSITION · Ω RABI · the readout on one line.]** Labels `STORE A`/`STORE B` kept (tests find them by text). ~~Ruling R7: all three surfaces.~~ | `current:150,193`, `history:162`, `new-project.browser:69,89`~~, `register`~~ | ~~M · Opus~~ **[OPUS: S · in B-DISP; ≈ +4]** |
| **M12 PALETTE, SHORTER** | λWAVES-side now: INVERT → `glyph:'invertColors'`, re-seated into the ramp's verbs row right of ROTATE (the `rInv` row goes); RESET re-seated into the PALETTE-ON row; `ticks: []` + CSS collapsing `.mir-ramp-ticks:empty`; a small floating angle readout driven by the `ramp.set` callback (the selected stop's angle, ruling R6); the ARG ψ field hidden by CSS (`.mir-ramp-at`); the preset stepper restyled to the section-picker look (`.pal-nav` + `.ro`, CSS only); ~~the four dead rules out~~ **[OPUS: the five dead selectors out, with `lab.css:478` kept (§0.10). Josh's "a reader under ROTATE to replace the 'turn' text" is built here, on the λWAVES side: a `readout` seated under ROTATE shows the selected stop's arg (the ARG ψ field's number), and one CSS rule hides the knob's own 'turn'. The floating text over the selected stop shows the same number: one function, two seats. The `labels.rotate` brief stays filed so the kit can do this cleanly later.]**. MIR briefs filed (not built): a `verbs` extras slot, a reset seat option, `labels.rotate(rad)` for the knob's "turn", `labels.float`, `stepper({pager:true})` through `ramp.js:122`. | `menubar:166`; `history:169-170` (selectors kept); `boot:4162-4165` re-aimed **[OPUS: `tests/legacy/boot.browser-test.mjs`; + `:2738`]**; `official-defaults-palette`; `settings-probe` | M · ~~Opus~~ **[OPUS: Sonnet @ high. DOM re-seats and CSS only, with no physics and no state; M-V's Opus covers it. ≈ +15]** |
| **M13a THE 3×3 SWITCH** **[OPUS: split from M13]** | (a) the 3×3 switcher: `mod-port.js:141` passes `switchWorkspace`; `shell/modulation.js:210` supplies ~~`() => app.state.ws.show('lower')`; `keys.js` builds `app.state.ws = createWorkspaces({ upper: modView, lower: tl.win })` after `installTimeline` and routes `moved`/`onWindow`~~ **[OPUS: `() => { modView.close(); tl.open(); }`, which is the kit's `show('lower')` without the lego stack. `createWorkspaces` is struck from 0.5.3: it re-seats both windows (`reserveTop`, `stackAbove`) and moves `modDodge` and timeline T1–T5 ground. Josh asked for the button, not the stack.]** — wiring, no brief | `timeline` T1–T5, `history:386` | **[OPUS: S · in B-TR; ≈ +3]** |
| **M13b THE DOCKED BAR** | ~~(b) the dock cycle pill → rack → timeline … through a `shared` shim around `#transport` …; (c) the docked look: ruling R5 — this release RESTYLES λWAVES' docked grid … the kit's `createTransport` with `LAMBDAWAVES_LAYOUT` is the 0.5.5 candidate~~ **[OPUS: struck and replaced with THE KIT'S BAR, FIT FIRST. A λWAVES shim duplicates what the kit already ships (`placementOf`, `mountIn`, the work-lane seat) and would be thrown away at the adoption; MIR owns generic instrument behaviour. Step 1 (½ h): does `createTransport` with `LAMBDAWAVES_LAYOUT` seat every λWAVES part (play, power, home, ‹ ›, scrub, jump, t, REPEATS + formula, RATE, the BPM chip and tempo drawer, dock, mod-logo, T and Space)? On FIT, adopt it: the docked look and the seat in the timeline's work lane come from the kit; `shell/transport.js`, `native-ui.js:80-188` and the legacy transport CSS shrink; `modDodge`'s `mini` guard and `stage-words.js:55`'s `avoid` learn the work seat. On NO FIT, restyle λWAVES' docked grid in CSS only, and the dock cycle goes to 0.5.5 with the adoption.]** | `menubar:179` (the cycle skips a closed timeline), `timeline` T1–T5, `history:386`, `frame-occlusion` (the work lane masked), `keyboard-shortcuts` **[OPUS: + `film-handover`, `stage-text`, `current`]** | L · Opus **[OPUS: FIT ≈ −120…−200 (ESTIMATE); NO FIT ≈ 0 (CSS)]** |
| **M14 THE iPAD SESSION** | no build: a one-page checklist for Josh's first iPad pass (the rows above on touch: the chord, the lock, the rows, the dock cycle) + `tools/perf/device-report.js` run once; his notes become 0.5.5 rows **[OPUS: + Option+drag with a hardware keyboard (UNMEASURED whether Safari reports `altKey` on a trackpad drag); + a dropped touch, then a new one (M4's heal). The integrator writes it.]** | — | — |
| **M-V** | one fresh Opus verifier: the lock 860 + 1004 · 0/0 (the camera lock engaged AND not); the serialize bytes 11/11 vs 0.5.2 for a project saved under the old keys; `settings-probe` 0/6; `new-project --check`; the stage probe; the whole browser estate + the boot suite alone; the line law; CLAUDE.md against the tree; FIT / NOT FIT → a fix round → the local cut on Josh's word **[OPUS: + a profile from 0.5.2 with STAGE TEXT off opens with both new rows off; + CLAUDE.md's STAGE FORMULA paragraph and `docs/STATE-SCOPES.md` updated for `camLock` and `atomLabels*`]** | — | — |

## 2 · The gates
- **G-N** node gate 0 after every row. **G-L** THE LOCK at ~~M4,~~ M6 and M-V **[OPUS: M4 touches no field code]** (a camera flag must not move a digest; the lock's states are rendered at HOME — the
  BUILD proves it with the lock engaged and not). **G-B** serialize-bytes 11/11 vs `v0.5.2-alpha` for every row ~~that touches no key; a row that ADDS a
  PREFERENCE key (M6 `camLock`, M9 `atomLabels*`) states the new byte count and keeps `new-project --check` exact~~ **[OPUS: IDENTICAL for every row, M6 and M9 included, because a PREFERENCE key is
  never written into a project. The new keys are proven by `settings-probe`, by the PREF set in `new-project.test.mjs:39-42`, and by CLAUDE.md's law that a project open leaves
  `lambdawaves.q0.settings` byte-identical outside WORKSPACE. `new-project --check` must pass WITHOUT regenerating; if it moves, that is a defect.]**. **G-P** `settings-probe` 0/6. **G-S** the
  owning suites per row; the estate + the boot suite alone at M-V. **G-H** the stage probe 10/10 from M4 on. **G-W** `lw-facade` 1/1 — ~~M6 adds no member unless
  `LW.camera.lock` is wanted (it is: one getter, `--write` with the reason)~~ **[OPUS: unchanged and never re-written. M6's getter is nested.]**. **G-Lines** `lab/*.js` + shell + windows ≤ 28,222 at the cut (27,943 + 1 %): the
  rows ADD UI (M6, M10, M11, M13) — each states its lines ~~and subtracts the dead rules it finds (M12's four, M13's legacy transport CSS, STATES' blank-field
  path)~~ **[OPUS: struck as payment. CSS is not counted, and "the blank-field path" names no lines. The ledger is in Part B §6: about +120 added (ESTIMATE) against +279 of headroom,
  and the kit bar's adoption is the only real JS subtraction.]** **G-Eye** every row's BUILD says exactly what Josh will see, with a before/after PNG pair under `research/release-0.5.3/eye/`.
  **[OPUS: **G-M the merge**: every builder re-runs `node tests/pwa.test.mjs --write` after rebasing on the merged tip, because `lab/sw.js` is the one file that every row touches.]**

## 3 · Order and the dial
~~M4 alone first … **PAIR 3** {M8 + M9 — molecules rows + display} ∥ {M13 — transport}.~~ **[OPUS: struck, because the pairs are not file-disjoint (Part B §3).
PAIR 3 shares `native-ui.js`, `stage-words.js`, `notebook.js` and `lab.css`. PAIR 2 shares `skin.css` and, under R7-all, B-MOL's two registry files. The draft's
"Sonnet for M1, M5, M7, M8" sits inside Opus builders: a builder has one model. The new order uses three waves of two builders:
**W1** {M4 · B-STAGE} ∥ {M1 + M2 + M3 + M10 · B-MOL}. **W2** {M5 + M6 + M7 · B-CAM} ∥ {M13a + M13b · B-TR}. **W3** {M8 + M9 + M11 · B-DISP} ∥ {M12 · B-PAL, Sonnet}.
The probe (G-H) is ready before any UI row of W2 or W3, which is everything "M4 alone first" bought. That is ≈ 34 builder-hours (≈ 40 if M13b adopts), ≈ 2 relay days.]**
Then M-V, a fix round, the cut. ~~Opus for M2–M4, M6, M9–M13; Sonnet for M1, M5, M7, M8 (Josh 10-09). ≈ 6 builders ≈ 32 builder-hours ≈ 1.5 relay days.~~

## 4 · What Josh will see (the point of this release)
A typeset B₁₂H₁₂²⁻; C₆₀'s registry that answers; a STATES switch that ~~says why or~~ shows BEAT **[OPUS: or says why, on the switch]**; a stage that never goes dead (and a probe that proves it); a
LOCK on the camera that returns the old centred zoom; a documented pan chord; MOLECULES ~~two rows shorter~~ **[OPUS: re-seated as he drew it: ON beside INSTALLED, the select under it, BASIS beside ORBITAL, and the chevron right of VIEW]**; the DISPLAY tab with STAGE FORMULA and ATOM LABELS
back, each with its size; eight orbital presets; one A/B look ~~in three windows~~ **[OPUS: in STATE]**; a PALETTE two rows shorter with a half-disk INVERT, a floating angle **[OPUS: and a reader under ROTATE]** and a
section-style preset picker; a docked TRANSPORT in the kit's idiom, the 3×3 switch to the TIMELINE, and a dock that cycles into it **[OPUS: on FIT; on NO FIT a restyled dock, the switch, and the cycle in 0.5.5]**.

## 5 · What is not claimed
The STATES window is not redesigned (R2); ~~the kit's transport is not adopted (R5)~~ **[OPUS: the kit's transport is adopted only on FIT (R5)]**; no MIR brief is built here (five are filed from M12, one from M4); the iPad
is not tuned (M14 waits for Josh's notes); the "XYZ grid" bug is not fixed until it is found (M5 measures first). **[OPUS: The lego stack and the registry windows' A/B are not touched.]**

## 6 · RULINGS TAKEN AS DEFAULTS (Josh may flip any; the build starts on his word)
- **R1 the name** — Josh's. **R2 STATES** — keep and fix; the shrink/cut is a 0.5.5 candidate with its 19-target cost written. **R3 the lock** — pan only.
- **R4 the presets** — ~~the six named in M10~~ **[OPUS: the six new ones as edited in M10 (HOMO SET / LUMO SET in place of DEGENERATE SET / σ + σ*)]**. **R5 the transport look** — ~~restyle λWAVES' docked grid now; the kit's bar is 0.5.5~~
  **[OPUS: the kit's bar on FIT; otherwise a CSS restyle now and the bar in 0.5.5. Never a λWAVES shim.]**. **R6 ARG ψ** — the stop field is hidden, the reader shows the selected stop's angle in radians (and degrees on hover)
  **[OPUS: under ROTATE AND floating over the stop]**. **R7 A/B** — ~~all three surfaces share the row~~ **[OPUS: STATE only]**. **R8 the
  chord** — Alt+Shift+Drag documented as the pan; no fine mode unless Josh says "fine" meant fine-grained. **R9 iPad** — a checklist, no build. **R10 DISPLAY**
  — two rows back, as the live site. **[OPUS: **R11 the switch** — the button alone, with no lego stack.]**

## 7 · Questions only Josh can answer (the build does not wait on them; the defaults above stand)
- **Q1** the dead stage: which device and input (Mac? iPad with a keyboard? Ctrl or Alt held?), was a banner showing, did a rack click or the H key still work,
  and did switching apps free it? (It picks between A, B and D.)
- **Q2** "XYZ Grid in camera control": which control exactly — the sphere's rings, ~~the FRAME/AXES segs on DISPLAY, or a dial with a modulation route on it~~ **[OPUS: the PAN pad (an XY grid), the FRAME/AXES segs, or a dial with a route]**?
- ~~**Q3** "MO-Registry button … in states mode": the ON switch, or the ORBITAL | STATES seg?~~ **[OPUS: struck. The tree answers it: the seg has no defect, the ON switch has three, and M3 fixes the switch.]**
- ~~**Q4** "fine" as in good or fine-grained?~~ **[OPUS: struck. "A fine camera pan control" means a good one; R8 stands, and the one-line FINE variant is ready if he says otherwise.]**
- ~~**Q5** "the arg psi view thing": the ARG ψ number field?~~ **[OPUS: struck. PALETTE has exactly one ARG ψ element; the WAVE window's `arg ψ` is not in PALETTE.]**
- ~~**Q6** the A/B request: the STATE window only, or the registry windows too?~~ **[OPUS: struck. "Its rack window" is STATE.]**
- **[OPUS: Q3′** DISPLAY: is "currently incorrect … in the live version it looks like this" asking for the two rows back (the default, which re-opens wave 157), or was "incorrect" the red formula (M1)? Both are built by default.
  **Q4′** the transport: adopt the kit's bar now (the default, fit first), or restyle now and adopt in 0.5.5? **Q5′** "update the selector for molecule *under* the ON button": placement only (the default), or also the section-picker look?]**

---

# PART B — THE AUDIT NOTES

## 1 · The edits that matter, ranked
1. **M1's regex would not have fixed the bug.** ¹²³ live in Latin-1, so `[⁰-⁹]` skips ². The edit spells out the class.
2. **M13b: the kit's bar, not a shim.** The dock-to-timeline Josh asked for is the kit's `placementOf` + `mountIn`, already shaped for λWAVES (`LAMBDAWAVES_LAYOUT`). This is also the only JS subtraction in the release.
3. **§3's pairs were not disjoint.** The edit replaces them with three waves of two builders that are file-disjoint, apart from two named CSS/`modulation.js` hunks (§3 below).
4. **G-B was wrong for M6/M9.** PREFERENCE keys never reach a project, so the serialize bytes stay 11/11 IDENTICAL and `new-project --check` passes without regenerating.
5. **M4's heal missed the iPad.** A touch's next pointer has a new id; the heal now keys on lost capture. M4's union fix is kit-only, and the filter stays out of the shader mask.
6. **M8 as drafted could not fit 300 px**, and "two rows shorter" was false. The target is now Josh's layout, with the row count measured.
7. **M11 shrinks to STATE**, which removes the overlap with B-MOL. **M10 drops σ + σ***, which ε cannot define; the presets become a table.
8. **The dead-CSS list deleted a live rule** (`.pal-color`). **Four of the six questions are answerable** from the tree or the words; three new ones are worth Josh's eye.

## 2 · Citation check (DRAFT 0 §0–§1)
| cite | verdict |
|---|---|
| `latex-state.js:95-100`; 90 formulas, one superscript digit | CONFIRMED (91 rows: 37 + 54; `library.json:3941`) |
| C₆₀ `cols` 175–182, nAO 300 | CONFIRMED (`library.json:4096`; record `ground.cols`; `library.js:61-64`) |
| `orbitalsview.js` select/paintLevels/crossed/`:257`/update | CONFIRMED :188-189 / :197-201 / :513-515 / :257 / :558-566 |
| `chemview.js:258`, `:322`, `:124`; `statesview.js:282,313,631,635` | CONFIRMED; `mathworker.js:329` → **:328** |
| restored STATES-ON may come back OFF | CONFIRMED by reading (`statesview.js:172,705,309-310`; `persist.js:232`) |
| `settings-card.js:17-18`; `stage-words.js:84-118`; `stage-text.browser-test:104` | CONFIRMED at `lab/windows/…:17-18`, `lab/shell/stage-words.js:83-118` (setOn :116, setScale :118); :104 |
| `lab/mir/scene-guard.js:129,154` | path → `lab/mir/shell/scene-guard.js:128-132,153-154` |
| `rack-wiring.js:304` | CONFIRMED at `lab/shell/rack-wiring.js:304` (the `extra` list only) |
| `stage-gestures.js:67,14,33` | CONFIRMED (+ :70 the slide choice; heal seats :108-116, :148-150) |
| `material.js:119,123,124`; `shell/settings.js:37,98-101`; `STATE-SCOPES.md:45` | CONFIRMED (material at `lab/windows/material.js`) |
| `camera-law.js:166-176`, PAN HOME `verbs[0]` | CONFIRMED (:165-176; verbs :195; resetView :179; `present` :49) |
| `chemview.js:82-174` rows; `lab.css:782-784` | CONFIRMED (chevron :234; ON :91; select :99; BASIS :154; VIEW :161; ORBITAL :167; VALENCE :172) |
| `material.js:99,108-110`; `glyph.js:318`; `grade.js:191` | CONFIRMED (`lab/mir/glyph.js`, `lab/mir/panels/grade.js`) |
| dead rules `skin.css:325,380-381`, `lab.css:475-478` | **475-477 dead; 478 LIVE** (`settings-card.js:96`); `skin.css:20` lists `.pal-ring` too |
| `workspaces.js:82-91`; `modulation/window.js:721-724`; `timeline/window.js:84-96` | CONFIRMED (:82-89; :722-724; :50-52 seat, :84-87 accept) |
| `mod-port.js:141` drops `switchWorkspace` | CONFIRMED (destructured `{ moved, rateControl, persist, note, device, armed, arm }`) |
| `skin.css:417-481` docked grid | CONFIRMED (417 `.native-play-row` … 481 `.tempo-expand` grid-area) |
| Alt+Shift+Drag pans | CONFIRMED by reading (`held` tests only `altKey:true, ctrlKey:false`) |
| `rack.js:266,272,275` (schedule returns) | CONFIRMED |
| closers: `current:150,173,181,193`; `new-project.test:39,45`; `first-run:141`; `menubar:166,179`; `history:162,169-170,386`; `new-project.browser:69,89`; `molecule-head.browser:80`; `latex-state.test:129-130`; boot `:4162-4165` | CONFIRMED (boot is `tests/legacy/`) |
| `camera-routes` 5/5; `molecular-names` | names → `tools/camera-routes.mjs`; `molecular-names.browser-test.mjs` |
| C₆₀'s failed fetch in the field; the five dead-stage percentages; M5's "XYZ grid" | UNMEASURED (needs a browser) |

## 3 · Overlap matrix (builders × files they edit; `lab/sw.js` is shared by all and re-stamped at each merge)
| file | B-STAGE M4 | B-MOL M1-3,10 | B-CAM M5-7 | B-TR M13a-b | B-DISP M8,9,11 | B-PAL M12 |
|---|---|---|---|---|---|---|
| `stage-gestures.js` · `tests/stage-gestures.test` | ● · ● | | · ● (W2) | | | |
| `shell/rack-wiring.js` | ●:304 | | | ●:89-103 (W2) | | |
| `latex-state.js` · `orbitalsview.js` · `statesview.js` | | ● ● ● | | | | |
| `chemview.js` | | ●:258-322 | | | ●:82-234 (W3) | |
| `camera-law.js` · `shell/persist.js` · `mod-port.js` | | | ● ●:163 ●:86 | · · ●:141 | | |
| `shell/modulation.js` | | | ●:45,47 | ●:162-215 | | |
| `shell/settings.js` · `tests/new-project.test` | | | ●:37,98 · ●:39 | | ●:88-93 · ●:40 (W3) | |
| `windows/material.js` | | | ●:117-124 | | | ●:93-110 (W3) |
| `native-ui.js` · `shell/stage-words.js` · `shell/notebook.js` | | | | ●:80-188 · ●:55 · ●:27-42 | ●:66,78 · ●:83-118 · ●:109 (W3) | |
| `shell/transport.js` · `shell/keys.js` | | | | ● · ●:155-160 | | |
| `windows/settings-card.js` · `windows/state.js` | | | | | ● · ● | |
| `skin.css` · `lab.css` | | | | ● transport · ● transport | ●:443 · ●:782 | ●:20,325,380 · ●:475-477 |
| `tests/stage-text.browser-test` | | ●:73-81 | | ● (avoid) | ●:104 | |

Same wave, so it must be disjoint: **W1** none. **W2** `shell/modulation.js` only, hunk-disjoint (:45,47 against :162-215), and B-TR merges second.
**W3** `skin.css`, hunk-disjoint (:443 against :20/:325/:380). Every other shared file falls in different waves (marked W2/W3) and is rebased.
The draft's PAIR 3 shared `native-ui.js` (:66 / :80-89), `stage-words.js` (:83-118 / :55), `notebook.js` (:109 / :27-42) and `lab.css`. That is not disjoint.

## 4 · Every ASK bullet → its row
| ASK.md bullet | row |
|---|---|
| screen sometimes unclickable | M4 (+ Q1) |
| XYZ grid only updates on release (from the rack window) | M5 (+ Q2) |
| MO-Registry button in states mode; "rework that window however you like" | M3; the rework → R2, 0.5.5 |
| buckyball's registry selector sometimes dead | M2 |
| iPad: controls more intuitive | M14 (+ M4's touch heal) |
| old camera (centre zoom, pan locked) + LOCK button | M6 |
| BASIS and ORBITAL one row; hide right of VIEW | M8 |
| Alt+Shift+Drag is a fine pan | M7 |
| stage text incorrect in settings (live screenshot) | M9 (+ M1 if he meant the red text; Q3′) |
| way more MO-Registry presets | M10 |
| STORE A/B UI unified in its rack window | M11 (STATE) |
| PALETTE: half-circle INVERT right of ROTATE; ARG ψ → a reader under ROTATE; RESET in the ON row; no −π…π ticks, a floating angle; unify | M12 |
| preset picker like MOLECULES' section picker | M12 |
| MOLECULES ON beside INSTALLED; the selector under ON | M8 (+ Q5′) |
| TRANSPORT docked needs a new look | M13b |
| TRANSPORT cycles its dock into the timeline when open | M13b (on FIT; else 0.5.5) |
| BASINS' 3×3 MIR logo switch to the timeline | M13a |
| DISPLAY: the new stage-text controls where the screenshot shows | M9 |
| the red B₁₂H₁₂²⁻ screenshot | M1 |
| NEXT MAJOR TASK (0.5.4 PRE-MATH) | out of scope (`research/release-0.5.4/NACRE.md`) |

Nothing in ASK.md is missing a row. The draft's one gap was MOLECULES ON beside INSTALLED, which it had in M8 but which §4 contradicted.

## 5 · Sizing and model (Josh 10-09: Opus builds; Sonnet/Haiku lighter; no Sol)
| builder | rows | size | model | why |
|---|---|---|---|---|
| B-STAGE | M4 | M ≈ 4 h | Opus | pointer lifetimes plus a GPU probe |
| B-MOL | M1, M2, M3, M10 | ≈ 10 h | Opus | the registry's physics (`cols`, degeneracy, the ladder's async re-arm) |
| B-CAM | M5, M6, M7 | ≈ 6 h | Opus | a law flag, the lock, PREFERENCE and the restore road |
| B-TR | M13a, M13b | 3 h (NO FIT) – 9 h (FIT) | Opus | the adoption decision and its estate |
| B-DISP | M8, M9, M11 | ≈ 7 h | Opus | M9 splits a merged switch and two keys; M8 and M11 ride along |
| B-PAL | M12 | ≈ 4 h | Sonnet @ high | DOM re-seats + CSS; no state, no physics |
| M14 | checklist | ½ h | the integrator | no build |
| M-V | verify | ≈ 4 h | Opus (fresh) | the one verifier |

## 6 · The line law (`lab/*.js` + shell + windows; CSS and `tools/` not counted)
Today 27,943, cap 28,222, headroom +279. Estimated adds (ESTIMATE): M1 +3 · M2 +12 · M3 +12 · M4 +10 · M5 0–2 · M6 +18 · M7 0 · M8 0 · M9 +18 · M10 +25 ·
M11 +4 · M12 +15 · M13a +3 → **≈ +122**. M13b: FIT ≈ −120…−200 (UNMEASURED); NO FIT 0. That lands at ≈ 28,065 (NO FIT) or ≈ 27,870–27,950 (FIT), under the cap
either way. The draft's ledger was not credible (every "subtraction" it named was CSS or unnamed); this one is, with ~150 spare and a stop at 1.5× per builder.

## 7 · Struck, deferred, kept
- **Struck:** the `[⁰-⁹]` class; M2's re-solve-on-re-pick; M3's "add a state" second behaviour; M4's app-side bar union; `createWorkspaces` (the lego stack);
  the dock-cycle shim; σ + σ*; R7's three surfaces; the G-L lock at M4; "a byte count" for PREFERENCE rows; the `lw-facade --write`; Q3–Q6.
- **Deferred to 0.5.5:** the STATES shrink or cut (R2), with its 19 `reg.*` targets; the A/B look in MO-REGISTRY and STATES; the dock cycle and the kit bar if NO
  FIT; the lego stack if Josh wants BASINS' stacking; the five palette MIR briefs and the scene-guard brief (the kit's pace).
- **Kept as drafted:** M1's sweep, M2, M5 measure-first, M6 pan-only, M7 docs-only, M9 two rows, M14 no build, M-V.

## 8 · The three things most likely to go wrong in the build
1. **M13b's adoption grows past a minor update.** The kit bar's FIT may look true and then fail on λWAVES' corners: Space, T, the film hold, REPEATS' formula,
   the tempo drawer, `menubar:179`, `stage-text`'s avoid. **Guard:** the ½-h fit verdict is written in the BUILD before any code; NO FIT is a cheap, honest
   fallback; the stop at 1.5× applies here first.
2. **M6's lock leaks through a road the brief did not name.** These are the raw `observer.pan*` route setters (`shell/modulation.js:45,47`), the restore at `persist.js:163`, the
   Alt+Arrows, two-finger slide, the pinch (`stage-gestures.js:102-103`) and the dolly zoom. **Guard:** every road goes through `setShift`/`panBy`/`anchor`, or
   is listed and tested; THE LOCK runs with the lock engaged AND not; a project saved with a shift opens centred while its bytes stay identical.
3. **M4's heal turns a real drag into a cancelled one.** `hasPointerCapture` is false for a moment after a synthetic pointer or on some WebKit touches, so an
   over-eager heal kills a live orbit or bow. **Guard:** heal only on a NEW `pointerdown` while one is held, never on a move. Add the lost-touch case and keep the
   existing interruptions (`stage-gestures.test.mjs:47-55`) green. The probe's before/after shows fewer dead points and no new ones.

## 9 · The exact next step
Sos writes `PLAN.md` from Part A (taking or overruling each **[OPUS]** mark), puts Q3′–Q5′ to Josh, then `BRIEF-M4.md` + `BRIEF-MOL.md` start W1. No push, no deploy.
