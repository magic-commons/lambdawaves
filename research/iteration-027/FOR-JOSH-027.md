# λWAVES · FOR JOSH — iteration 027 THE DEFECTS, THE SHADER NODES, THE SIBLINGS (Claude Sos, 2026-10-29, morning; closed by Claude Yan at 09:10 after Sos's usage limit)

Where: `yan-c` in `~/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24` at `d4c92ba6` + the close commits of 09:10 (`git log --oneline d4c92ba6..yan-c`), NOT pushed; your 9261 serves the tree. Plan, prompt, five build notes and the shots: `research/iteration-027/`. Copies in DATABASE/CLAUDE. Kit unchanged at 1.5.6-alpha.17. Five Opus chains ran at once on your word ("more subagents in parallel"); THE LOCK 843/0 and 987/0 green after each merge; `./test.sh node` EXIT 0.

## The defects (chain D) — all six answered
- **BENZENE π and WATER ESP opened dirty**: FOLDERS took its clean mark at the restore, before the chem worker answered; the solve's own late writes (the STATES ladder's lane record at 0.5 s, the ESP view at 1.6 s) made the project dirty. Now a solve's derived fill re-takes the clean mark it stood on. All four bundled demos say "opens CLEAN" in the suite, 600 ms and 3.2 s after the press. No demo file was rewritten.
- **The film's caption** names each frame's orbital now (the caption is a function read after the frame's modulation step): 1a1 · 1b2 · 3a1 · 4a1 LUMO bar by bar on the proof sheet.
- **The black stage after a film**: no lab change — only a screenshot taken in the very instant the film returns is black; the put-back's own present redraws VORTEX. Proved in the hand-over suite (equal snapshot before and after).
- **MIDI at launch**: a saved map binds at boot when access was already granted (no prompt; a refusal is said once in METERS). `tests/midi-resume.test.mjs`.
- **A FROST look saved before 023** reads FROST again (the look store's one-time migration; a TEXT LIGHT you choose afterwards is kept).
- **PLAY below 776 px**: measured at 760, 776 and 800 — fully inside and clickable at the centre and all four edges; 022 E3 holds, no fix needed.

## Three new shader nodes (chain N; 024's open #6) — `research/iteration-027/N-shots/`
- **FEEDBACK**: the last output decays, drifts and scales under the fresh tap (a LIGHTEN, so the ground stays black): the trail look of Lieberman's loops. DECAY · DRIFT · ANGLE · SCALE · GAIN · MIX.
- **REFRACT**: the picture's luminance as a water surface; rays bent DEPTH px through DECOHERE's splat: the pool floor's caustics. LENS · SCALE · SAMPLES · DEPTH · FRINGE · GAIN. HEAVY.
- **FLOW**: points from seed 13 advected along the luminance or hue (= phase) gradient, trails kept × DECAY. COUNT · SPEED · DECAY · WIDTH · GAIN.
- Films carry their state from frame 0: FEEDBACK + REFRACT + FLOW give equal digests in four runs; DECOHERE's digests are 025's exactly.

## The siblings move to MIR 1.5.6-alpha.17 (S1–S3, the clone road; bundles under my worktree's `.tmp/it027/`)
- **NEBULA-REDUX** (nebula-1.5 @ 737a8df): zero callers changed (no removed door used); 68/68 node, the browser suites green but two reds that were red before (folders 3a thumbnail, NEB-06 = FOR-MIR 17).
      git -C ~/Documents/NEBULA-REDUX fetch ~/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/it027/nebula-1.5.6-adopt.bundle mir-1.5.6-adopt:mir-1.5.6-adopt
- **BUBBLDYNE** (opus/lorentz-foam @ 627bcbe, your live line): a FINDER opener in place of the old + (◧ · + · ☆ as before); 77/77 node, windows/live/advanced green; browser.mjs and cellular-browser.mjs red at the base too under load.
      git -C ~/Documents/BUBBLDYNE/APP fetch ~/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/it027/bubbldyne-1.5.6-adopt.bundle mir-1.5.6-adopt:mir-1.5.6-adopt
- **AUTOMATA** (build-b @ 60fe0b2): the + becomes THE FINDER (`#finderOpen`), the RECOVER throw on the missing + list is gone; 330/330 node; 32 browser suites, 21 green, and of the 11 red TEN are red at the base too (Yan ran the baseline alone); two to look at before you merge: b1 (the dial's right-click and hold pop-over, 1/15 → 3/7 — the kit's 1.5.6 gestures or a test to re-aim) and b4 (a replay-hash sample on a shared GPU). No shots yet (the usage cliff).
      git -C ~/Documents/AUTOMATA fetch ~/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/it027/automata-1.5.6-adopt.bundle mir-1.5.6-adopt:mir-1.5.6-adopt
Merging each bundle's branch into its live line is your call. SOLEIL (16 rows, −4,280 lines) is the one sibling still parked.

## FOR-MIR lines collected (docs/FOR-MIR.md § 027, for the next kit day)
`createApp({ finder })` / `createRack({ chrome: true, finder: true })` (three apps hand-built the same opener) · `createWindowPicker` onToggle · `adopt.mjs` naming new stylesheets · `midi.js resume()` + the privacy law · themes carrying retired values for matchPreset · a gallery seam to re-take the clean mark after a settled restore.

## Open for you (defaults ran)
1. FEEDBACK's DRIFT rises straight up (the knob cap of six left no direction knob): should DRIFT follow ANGLE?
2. A stage trail's length follows the frame rate (one step per present); a film is exact. Step on the clock instead?
3. FLOW follows +∇ (points pile onto bright lines); iso-line flow (∇ turned 90°) as a SOURCE?
4. A film RESUME mid-film continues from the last state, not from frame 0's chain.
5. `tests/curves.browser-test.mjs:56` is red on the base before 027 (the snapHash does not change after a CURVES grade) — one look.
6. BUBBLDYNE's FINDER and modulation glass drew see-through in headless Firefox (the blur did not paint in the shot) — one look on a real screen; AIR JET asks for a glyph `up` no kit draws (BUBBLDYNE's own).
7. NEBULA: give it the FINDER now (≈ 5 lines) or wait for the kit door; `docs/FOR-MIR.md` asks 1–21 not yet checked against 1.5.6.

## 028
Nothing of mine is queued. Parked: SOLEIL's adoption; the Gemini icon redraw (yours); NODES' DAG, LAYER masks, the governor bypass, PROJECT scope for the graph; the 017 perf rows, STATES' moves, IUPAC names, Volume II; the kit day for the FOR-MIR lines above plus 025's ● REC and MIDI CC.
