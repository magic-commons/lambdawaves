# λWAVES 0.4.0 · S3 STAGE TEXT + WINDOWS — BUILD (waves 155–161, numbered from 155 beside S2's 145)

Built by the S3 builder (Opus 5.5) against `BRIEF-S3-STAGE-AND-WINDOWS.md`. Nothing merged, pushed, tagged or deployed.
The agent-control usage pause landed after T7 (`S3-HANDOFF.md`); the work resumed and finished the tail.

- **Worktree** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a4faa45d300fd21dc`
- **Branch** `worktree-agent-a4faa45d300fd21dc`, from `bd9b0e5` (sos-s0: S1 NAMES + S1′ cameraEye)

## Ten lines

1. T1–T7 are in, one commit each, plus one test follow-up, the pause hand-off and this hand-off.
2. The stage text is markdown + KaTeX through the notebook's renderer (`lab/stage-text.js`, the interim renderer 0.5.0 deletes).
3. It is keyed on its string, KaTeX ≤ 4/s, no live coefficient, no per-tick layout read (witness counters prove it).
4. A HAND's preset fades in and out with its names (`WINDING · $2e$ (a) + (b)`); an undo or an open never announces.
5. SETTINGS › DISPLAY has one STAGE TEXT row; a picture, a loop and a video carry its plain caption.
6. DYNAMICS is retired into SHADOW / CALCULUS / RADIATION / ORBIT / VORTEX; a saved DYNAMICS seat lands on SHADOW.
7. CALCULUS is RADIATION's tiles, and its ⧉ copies the prose figure, which renders in the notebook.
8. PERFORMANCE sits in QUALITY; SLICE is PLANE and SLICE / CLIP is CLIP; ATOMS is back as the periodic table.
9. Gates: node 83 suites exit 0; `new-project --check` in step; 26 browser suites green, one at a time.
10. **`lab/*.js` 35,738 → 35,791 (+53): "lines DOWN" is NOT met** — `dynamics.js` is the shared library, not the window's.

## The commits

| | sha | title |
|---|---|---|
| T1 | `b1120af` | the stage text renders real maths (F2) |
| T2 | `c6f752b` | the fade: a hand's preset is announced, and only a hand's (F2) |
| T3 | `5e130ed` | one STAGE TEXT row, and the caption in capture (F2) |
| T4 | `6e6714b` | retire DYNAMICS (F3, R-W1) |
| T5 | `73b1780` | CALCULUS as tiles, and the prose figure (F3, R-W2) |
| T6 | `6668a42` | PERFORMANCE in QUALITY; SLICE is PLANE, SLICE / CLIP is CLIP (F3, R-W3) |
| T7 | `f71e351` | ATOMS returns as the periodic table (F3, R-A2) |
| — | `d58156d` | hand-off at the usage pause (`S3-HANDOFF.md`) |
| T5′ | `a7765a7` | take-in-bugs §2 reads CALCULUS' copy as the prose figure |
| — | (this) | REPORT waves 155–161 and this file |

## `lab/*.js` lines (`cat lab/*.js | wc -l`)

| at | lines | Δ |
|---|---|---|
| `bd9b0e5` | 35,738 | |
| T1 | 35,783 | +45 (`stage-text.js` in, the rack block out) |
| T2 | 35,806 | +23 |
| T3 | 35,846 | +40 (the caption, the merged row) |
| **T4** | **35,751** | **−95**: `dynamicsview.js` −131, `dynamics.js` −45, `shadowview.js` +52, `radiationview.js` +14, `calculus.js` +6, `rack.js` +8, `orbit.js` +1, `vortex.js` +1, `sw.js` −1 |
| T5 | 35,783 | +32 (the TeX and the figure) |
| T6 | 35,783 | 0 |
| T7 | 35,791 | +8 |

`lab/dynamics.js` was not deleted: kick.js, calculus.js, radiation.js, particles.js, slice.js and sliceview.js import its
dipole, radial and Bohmian functions; the window-only part (the action–angle chart and its three normal-mode variants)
went. Deleting the file would only move ~290 lines into its importers.

## Gates

- `bash test.sh node`: **exit 0, 83 suites** at the T7 tip. Under a load of 22–28 (S2 running) three timing budgets in files
  S3 never touched went red — electrostatics W42-7, mo G5, wigner W42-8 — and were green in the final run.
- `node tools/new-project.mjs --check`: in step (16829 B).
- Browser on 8751/5219, ONE AT A TIME (`.tmp/run-browser.mjs`), all GREEN at the tip: stage-text (new: 4 sections),
  menubar (9), latex-copy (11, new §8), molecular-names (6), new-project (8), register (18), chem (55), history (39),
  frame-occlusion (7/7), current (15/15), render-regressions, orbitals (25), take-in-bugs (5), molecule-demos, export3d,
  field-molecule, gpu-recovery, input, keyboard-window, lfo-tension, mir-controls, molecular-diff, offer,
  official-defaults-palette, routed-knob.
- **Re-run alone before being believed:** `current` — `valuesReveal` red three times under load (and once on the BASE tree
  served from `git archive bd9b0e5`), green 15/15 on a quiet machine; `orbitals` L9 — the free-running rAF starved to 2–3
  frames/s under load, green alone; `molecular-names` — "benzene named in 11 ms" (≤ 10) once under load, green alone.
- No digest lock: no field.js, shader or frame-order change.
- **No per-tick layout read**, checked by witnesses in `stage-text.js` (`stats.places`, `stats.renders`,
  `stats.labelWrites`): twelve CPU ticks at twelve clock times read layout 0 times and render KaTeX 0 times; the labels
  write 0 times under a still camera across eight clock times, and again after a turn.

## Decisions (say them to Josh)

- The formula's base went **88 px → 34 px** (the notebook's title; announcement 22 px, atom label 14 px, × SIZE 50–300 %).
- A stored `atomLabels: false` beside `molFormula` on is not honoured: one switch, and `molFormula` is the key kept.
- The caption follows the STAGE TEXT switch and uses names.js' plain form: `H₂O · 1b1 HOMO · STO-3G`; states `1s₀, 2p₀`.
- DYNAMICS' CLOUD readout was dropped (`LW.particles.state` keeps it); the rotor entropy went to ORBIT's Schmidt tile.
- CALCULUS gained ⟨L_z⟩, ⟨L²⟩ (no law under the Stark field) and ⟨r⟩ (a moment). STATES' presets announce too.

## Open items

- `lab/*.js` is +53, not down (above).
- Merge risk: `rack.js`' long LW line (removed `dynamics,`, added a `particleUI` getter) and its `field.js` import on line 26
  (dropped the unused `cameraKey`, `toScreen`) may collide with S2 — each a one-word merge.
- The ATOMS card's own `update()` still reads `lad.clientWidth` per presentable tick (pre-existing, not in this brief).

## KIT BRIEF notes for S5

- **Briefs 13 / 7 (the INFORMATIONAL):** `createStageText({ stage, canvas, racks, docked })` →
  `{ setFormula(md), announce(md, ttl = 2400), atomLabels(id, obs, half), place(), setOn(v), setScale(s),
  stats { renders, announced, places, labelWrites }, md, banner, formula, on }`; KaTeX via `renderNotebook`, ≤ 4 a second;
  the fade is CSS (`#molFormula.st-fade`, 0.6 s); `TYPE = { title: 34, heading: 22, body: 14 }`. At 0.5.0 `setFormula` →
  `layer.addBlock({ md })`, `announce` → `layer.addLabel({ ttl })`, the labels → `layer.addLabel({ anchor })`; the hand law
  (only a press announces) must survive the port.
- **Brief 6:** `capture.js drawCaption(g, W, H, text)` — foot-left, H·0.034 px, white over a dark stroke; a picture
  composites a foot strip, a recording draws each frame into a 2-D canvas (drawImage where the probe read the WebGPU
  canvas lit, else relay). `recorder.overlay(i, ctx)` replaces it.
- **Brief 4 (cells):** CALCULUS `.calc-grid` (kit `.ro` tiles, 2 columns on the card, 3 floating, out of LEAN); ATOMS
  `.atm-table` (SPECTRUM's `.picker > .pk-n > .pk-chips > .pk-c`, periods 2 · 8 · 8 · 18, columns on the card and a phone,
  rows floating, `.on` = the element in force). At 0.5.0 both become `cells`, and ATOMS' second mount is the library map.

## The next step

Claude Sos merges `worktree-agent-a4faa45d300fd21dc` into `sos-s0` (renumbering waves 155–161 if S2 took them), regenerates
`lab/sw.js` with `node tests/pwa.test.mjs --write`, and runs the merged tree's node gate and the browser light check.
