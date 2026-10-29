# ITERATION 027 — THE DEFECTS (Claude Sos, integrator on `yan-c`; Josh 2026-10-29)

Josh's word: `PROMPT.md`. Every design call of 020–026 stays at its default; no kit door (the FOR-MIR lines — MIDI CC source, ● REC, the timeline's audio port — ride the next MIR day). One Opus chain, six rows, each a fix with its proof; nothing else.

## WHAT STANDS
- 026 closed at f814eefe: THE CONDUCTOR (film.md), the demos STAR LOOP · BENZENE π · WATER ESP beside WAVE DANCER, `demos/` a DATA root. The probes that chased D1 are in `probes/` (gatekit scripts; run with `LW_PORT`/`GD_PORT` against your own gate from the repo root: `node research/iteration-027/probes/dirty-probe.mjs`).
- Facts for D1 (Sos, 2026-10-29 03:40–04:10): BENZENE π and WATER ESP read `__LW.projects.dirty === true` 500 ms after `projects.demo()`, and nothing drifts afterwards but `layout.at` (WORKSPACE). A plain H₂O project (`molecule` verb, save, fresh, open) is CLEAN; WAVE DANCER is clean; STAR LOOP (a 27-lane timeline under hydrogen) is clean. Writing the demo's `data` as the app's own `serialize()` after an open did NOT clear it. So the gallery's saved signature and the live one differ at open for a conducted MOLECULE project — the suspects: the TIMELINE part's signature under an armed arrangement whose lanes touch `chem.orbital` / `material.style` on a molecule; `instruments.states.lanes` or `orbitals.selection` written by the solve after the signature is taken; the seed's signature (`starterOf` → FOLDERS' seed) computed over a payload the restore normalises (`morph`, `modulationBases`, the view that `chemPrevView` rewrites, molecules.js:73–74). Instrument `gallery.dirty()`'s two signatures part by part (`lab/mir/folders`, `core/project.js` parts: capture/signature) before changing anything.

## THE LAW OF 027 (to docs/laws/iterations.md at the close)
A DEMO OPENS CLEAN; A FILM'S WORDS ARE THE FRAME'S; A FILM GIVES THE STAGE BACK; A MAPPED CONTROLLER IS LIVE AT LAUNCH; A SAVED LOOK KEEPS ITS NAME; PLAY NEVER CLIPS.

## CHAIN D — THE DEFECTS (one Opus builder; `lab/`, `tools/`, `tests/`; no kit file)
D1 A DEMO OPENS CLEAN: find the differing part of the signature (above), fix the ROOT (a key the restore normalises → normalise it at save/seed too, or exclude it from the signature by the scopes law; a part that writes after open → take the signature after that write, as `dirty()`'s `known` already waits for something), re-run the three demos + the plain H₂O round trip: all clean; `tests/molecule-demos.browser-test.mjs` gets the line "opens CLEAN" for every bundled demo; the two demo files are rewritten only if the root fix needs it (by `node tools/conduct.mjs <score> --project-only` from `research/iteration-026/scores/mol-3.pass2` and `mol-1.pass2`, then the B1 header transformation — B-BUILD.md §1).
D2 A FILM'S WORDS ARE THE FRAME'S: `lab/windows/film.js` hands `pending.caption` as a FUNCTION (`() => caption()`), `lab/render-exact.js:779` evaluates it per frame after the frame's modulation step (so `chem.orbital` driven by the record clock names that frame's orbital); the manifest keeps the start string. Proof: `research/iteration-026/scores/water-orbitals.score.json` (the builder's A4 example) conducted with `render.caption` on → the sheet's caption reads a different orbital per bar.
D3 A FILM GIVES THE STAGE BACK: reproduce (clock paused, VORTEX raised, a 2-s STILL film) → the stage black until the next present; fix at the film's restore (`rack.js` ≈ 713 / `filmHold(false)` / the overlay's `suspend`): one PRESENT scheduled after the put-back, the VORTEX overlay redrawn; proof: a screenshot digest before and after the film equal (gatekit `snapHash`), in `tests/film-handover.browser-test.mjs` or `render-regressions`.
D4 A MAPPED CONTROLLER IS LIVE AT LAUNCH: when saved MIDI mappings exist (`lab/mapping.js`, the kit's `mir/shell/midi.js` store), request MIDI access at boot (no prompt when already granted; a refusal is said once in METERS, never thrown) and bind the saved notes/CCs without a LEARN; if the kit's midi.js has no door to open without learning, build the app side only and write the one FOR-MIR line in D-BUILD.md (no kit file is touched this iteration). Proof: a node/browser test that a saved mapping is active after a reload with a fake `navigator.requestMIDIAccess`.
D5 A SAVED LOOK KEEPS ITS NAME: a look saved before 023 (FROST with the italic Georgia ⓘ / white text key) reads CUSTOM because the preset match fails on the retired key; read it as FROST (the match ignores retired keys, or a one-shot migration in the look store), proof in the look's node test with the old record as a fixture.
D6 PLAY NEVER CLIPS: measure the CSB at 760 · 776 · 800 px (gatekit, the pill's box vs the stage seat); if 022 E3 already holds, close with the shot and the numbers; else fix the seat's minimum (A ROW IS EVEN: `research/iteration-023/josh-shots/GOOD-*.png` the reference, no added height).

## CALLS FOR JOSH
None new — "defaults to all". D4 may leave one FOR-MIR line.

## MERGE ORDER
D alone; the recipe (`git merge --no-ff --no-commit`, `--ours lab/sw.js`, `pwa.test --write`, rack-deps, new-project, mir-manifest, `./test.sh node`, THE LOCK 843/987).

## CLOSED
| chain | base | commit | note |
|---|---|---|---|
