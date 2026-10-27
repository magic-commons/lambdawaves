# CHAIN C — SPECTRUM · THE REGISTER · THE RACK DEFAULTS · BUILD (Opus builder, 2026-10-27; branch `it018-C`, base fadfc07)

## What changed, per row
- **C1 SPECTRUM ↔ STATE** (new `lab/windows/transition.js`; `windows/spectrum.js`, `rack.js`, `native-ui.js`, `shell/settings.js`, `first-run.js`,
  `windows/kepler.js`, `windows/molecules.js`, `shell/links.js`, `shell/notebook.js`, `lab.css`, `skin.css`, `tools/rack-deps.mjs`; `windows/state.js` deleted).
  SPECTRUM's body now reads ladder · head · rows · the 140 table · **A ↔ B** · presets · HAMILTONIAN. The A ↔ B block has STORE A · A · STORE B · B · CLEAR,
  then TRANSITION · RABI Ω and the readout. CLEAR is the bare trash glyph (`.sp-abclear`, the `.sp-presave` way, dim while nothing is stored); it empties both
  stores and, if a TRANSITION is running, stops it and keeps the mix (one undo row). The words "A / B" are now only `aria-label`s, on the block and on the
  readout. The old note went. `ui.ab`, `app.hooks.ab`, `state.rabi`, the project's `ab` record and `ui.linkNote` (now under the block) are unchanged.
  **The seat.** `rack-deps` needs every `lab/windows/*.js` file to be a planned module seated in rack.js and handed `(app)` alone, so `createTransition(app)`
  sits where STATE's seat was, under a `// TRANSITION — A ↔ B` line: before SPECTRUM, so `ui.abSw`, `app.hooks.ab` and `app.w.clearRegister` exist for
  every later seat, as before. It builds the block DETACHED as `ui.abBox`, and spectrum.js mounts it before `.sp-preset`. PLANNED `state` became
  `transition`. **HINGE HOLDS**: spectrum 25 (its backward `wState` went), transition 2.
  **The status sink.** `app.w.wState` is now `{ setStatus(msg, cls) }`, built in spectrum.js and returned to boot at the SPECTRUM seat, so every caller in
  MAP 10a keeps its hook (links, persist, history, keys, timeline say, kepler, molecules). It writes SPECTRUM's status line, and an empty message gives
  the line back to the operator (`specStatus`); kepler's and NORMALIZE's old `'changes c'` resets now do that.
  **A saved layout naming `state` is ignored.** The kit's `readLayout` drops any card id the rack does not know (`known`), rack-wiring's `layoutExtras`
  skips a missing `devById`, and `captureLayout` never writes it again. Checked in Firefox: a record with `{ id: 'state' }` restores, no card appears, and
  the next serialize carries none. STATE also left KIND, native-ui's ids, FOLD_ALL, the first-run right rack and molecules.js' mode-hide list.
  Shots: `c1-state-before.jpg`, `c1-spectrum-before.jpg`, `c1-spectrum-after.jpg`.
- **C2 THE LADDER READER** (`lab/spectrum.js` paintLadder). Only the LIT levels are drawn, named and hovered. The dim n3–n7 lines that crowd E = 0
  are gone, and so are the dashed continuum and its "E = 0" name: that was the "ruler", confirmed in `c2-ladder-before.jpg`. Heights stay physical.
  The STURMIAN eigen ladder (`paintEigen`) is untouched: its dim lines are click targets. After: `c2-ladder-after.jpg`.
- **C3 STATES AUDIT** (`lab/statesview.js`, 3 lines). See the findings below. Built: a hand's first STATES show already plays BEAT (S₀ 0.8 + the brightest
  singlet 0.6). It now also runs `tune()`, so DRIVE's ω sits on that gap and one DRIVE press is resonant Rabi (H₂O: ω 0.4 → 0.8108 Eh, S₅, pol y; checked
  that the excited population climbs). And the still dipole scope names the beat in canvas text that LEAN cannot hide: `S₀ × S₅` / `ΔE 0.811 Eh · λ 56.2 nm`.
  Shots: `c3-states-audit.jpg` (before, paused), `c3-states-play.jpg` (before, playing), `c3-states-after.jpg`.
- **C4 THE RACK DEFAULTS** (`rack.js`, `first-run.js`, `shell/rack-wiring.js`). The right rack is `['settings','palette','observer','camera','clip']`
  (the C1 edit), the left rack stays `['informational','spectrum','chem']`, and FOLD_ALL has 8 entries. The docked transport always seats at the top
  of the LEFT rack: the one rack's top on a phone, through the new `layout.seatTransport()` on every dock. A record's seat is not read
  (`layoutExtras`), and `onClose` remembers nothing. `dockSide 'L'`/`dockIndex 0` stay as constants for transport.js. Checked in Firefox: dock,
  undock after a move to the right rack, re-dock, and restore a record with the card last on R all land at the top of #rackL. WORKSPACE default
  unchanged, so `new-project.mjs --check` is in step (16098 B). Shot: `c4-racks.jpg`.

## Tests (gate 8783 / gd 5783, one browser at a time)
- GREEN node: first-run 13/13 (re-aimed: 8 folds, no `state`; wiring checks the racks and `seatTransport`), rack-deps.test (22 modules, 24 rows), history,
  new-project, statelink, keyboard-shortcuts, flash-routes, mir, pwa (after `--write`), mir-manifest (kit untouched, alpha.29). `new-project.mjs --check` in step.
- GREEN browser: menubar (status re-aimed to SPECTRUM's line), current (A/B via SPECTRUM's block), history (row names `STORE A · SPECTRUM`…; the window
  drag uses SETTINGS), lw-links, hide-reveal, window-switching, register 23/23, new-project, timeline 14/14, keyboard-window.
- RED, **already red at base fadfc07** (I checked the base tree on a second gate): molecular-names fails at :89, where `addMenu` lists no `chem` after its
  close. That is chain E's add list. Its re-aimed status line (:157) was checked by a probe and reads `retired in 0.5.0: H₂⁺ (opened as MOLECULES · H₂ σu)`.
  latex-copy §8 expects SPECTRUM folded, not hidden, under a molecule (MAP: it is hidden). Not run: legacy boot.
- LOCK: none moved. The ladder and the scope are canvas UI, not the stage.

## CLAUDE.md sentences (the integrator edits)
- l.41 "ATOMS: SPECTRUM, STATE, EQUALIZER" → "ATOMS: SPECTRUM (with A ↔ B), EQUALIZER".
- l.75 "(PROJECTS and STATE status)" and l.392 "said once in STATE's status" → "SPECTRUM's status".
- l.544–545 and l.560, l.575 (THE WINDOWS / seats): "STATE (with its CLEAR) is `lab/windows/state.js` `createStateCard(app)`" → "A ↔ B · TRANSITION and
  the register's CLEAR are `lab/windows/transition.js` `createTransition(app)`, seated at `// TRANSITION — A ↔ B` before SPECTRUM; it builds `ui.abBox`,
  which spectrum.js mounts between the 140 table and the presets (018 C1)"; `app.w.clearRegister` is filled at that seat.
- ADD: "The window `state` is retired (018 C1): SPECTRUM holds STORE A · A · STORE B · B · CLEAR (trash: both stores emptied, a running transition
  kept as its mix) · TRANSITION · RABI Ω; the words A / B are `aria:`. A saved layout naming `state` is ignored (the kit's readLayout drops an unknown id).
  The lab's status sink `app.w.wState.setStatus(msg, cls)` writes SPECTRUM's status line; an empty message restores the operator's line."
- ADD: "SPECTRUM's ladder draws only the lit levels: no dim off-lines, no E = 0 dash (018 C2)."
- ADD: "STATES: a hand's first show plays BEAT and tunes DRIVE's ω to its gap; the still dipole scope names the beat (pair · ΔE · λ) (018 C3)."
- ADD (first-run paragraph): "The first-run right rack is SETTINGS · PALETTE · WAVE · CAMERA · CLIP; the docked transport always seats at the top of the left
  rack (`layout.seatTransport`; a record's seat is not read) (018 C4)."

## STATES audit (C3): what a user sees, H₂O · MIX · ORBITAL → STATES (Firefox, `c3-states-audit.jpg`)
- The register is NOT empty: the hand's switch plays BEAT, S₀ 0.8 + S₅ 0.6 (the brightest, f 1.17), with a 7.75 a.u. (187 as) beat. But the clock is
  paused on a first visit, so the dipole scope says "still", the stage shows a static ΔD, and nothing moves until PLAY.
- Nothing says what is playing. The BEAT, Σ|b|² and δμ readouts exist, but MOLECULES' LEAN (Aa, on by default) hides every `.ro`. The lanes sit behind
  HIDE. DRIVE, presets, VIEW/REF and FLOW sit behind the chevron. The ladder's gutter prints energies, not names (the lit 0.811 line is not called S₅).
- So it reads as a second ORBITAL ladder with no hand-hold. Its real value (true excited states, Rabi DRIVE, ring currents) is two folds deep, and
  DRIVE starts at ω 0.4 Eh, a gap water does not have.
- Left for call 5 (not built): (a) name the lit lines in the ladder gutter (S₅ rather than 0.811); (b) let the BEAT readout escape LEAN, as CALCULUS'
  tiles do; (c) start the clock on a hand's first STATES show; (d) lift DRIVE (switch + ω) out of the fold onto the ladder's row.

## Open questions for Josh
1. STATES (call 5): which of (a)–(d) above? My pick is (a) + (d): names on the lit lines, and DRIVE one press from the ladder.
2. A ↔ B's CLEAR stops a running TRANSITION and keeps the current mix as the state. Should it fall back to A instead?
3. The docked transport ignores a project's saved seat now (always top-left). Older projects that seated it elsewhere open with it at the top. OK?
