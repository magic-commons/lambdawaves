# λWAVES 0.4.0 · S3 STAGE TEXT + WINDOWS — HAND-OFF at the usage pause (2026-10-07 → 08)

Written by the S3 builder (Opus 5.5) at the agent-control usage pause, at a clean boundary: all seven T commits are in,
the tree is clean, the gate server on 8751 was killed by pid (1908872) and no process of this builder runs.  Nothing was
merged, pushed, tagged or deployed.  No digest lock (no field.js, shader or frame-order change).

- **Worktree** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a4faa45d300fd21dc`
- **Branch** `worktree-agent-a4faa45d300fd21dc`, from `bd9b0e5` (the sos-s0 tip: S1 NAMES + S1′ cameraEye)

## The commits

| T | sha | title |
|---|---|---|
| T1 | `b1120af` | the stage text renders real maths (F2) — new `lab/stage-text.js` |
| T2 | `c6f752b` | the fade: a hand's preset is announced, and only a hand's (F2) |
| T3 | `5e130ed` | one STAGE TEXT row, and the caption in capture (F2) |
| T4 | `6e6714b` | retire DYNAMICS (F3, R-W1) |
| T5 | `73b1780` | CALCULUS as tiles, and the prose figure (F3, R-W2) |
| T6 | `6668a42` | PERFORMANCE in QUALITY; SLICE is PLANE, SLICE / CLIP is CLIP (F3, R-W3) |
| T7 | `f71e351` | ATOMS returns as the periodic table (F3, R-A2) |

Every T is complete.  What remains is the stage's tail: one test to update, two suites to re-run alone, and the
hand-off documents (`S3-BUILD.md`, the REPORT section).

## `lab/*.js` lines (`cat lab/*.js | wc -l`)

35,738 at `bd9b0e5` → T1 35,783 → T2 35,806 → T3 35,846 → **T4 35,751 (−95)** → T5 35,783 → T6 35,783 → T7 **35,791**.
**Net +53: the brief's "lines DOWN" is not met.**  T4 per file: `dynamicsview.js` −131 (deleted), `dynamics.js` −45,
`shadowview.js` +52 (the footer), `radiationview.js` +14 (the lines), `calculus.js` +6 (the moments), `rack.js` +8 (the
PARTICLES group moved in), `orbit.js` +1, `vortex.js` +1, `sw.js` −1.  `lab/dynamics.js` is NOT deleted: it is the shared
physics library (kick.js, calculus.js, radiation.js, particles.js, slice.js, sliceview.js import its dipole, radial and
Bohmian functions); only its window-only part (the action–angle chart and three normal-mode variants) went.  The stage's
new features cost: `stage-text.js` +133, the prose figure ~+40, the SHADOW footer +52, the caption ~+25.

## Tests run

- `bash test.sh node` at the T7 tip: **exit 0, 83 suites** (load ~10).  Under load 22–28 earlier (S2 running), three
  timing budgets went red in files S3 never touched — electrostatics W42-7 (88–222 ms vs 60), mo G5 (156.8 ms vs 120),
  wigner W42-8 (172 ms vs 150); green in the final run.
- `node tools/new-project.mjs --check`: in step (16829 B), after T3 and T4.
- Browser, one at a time on 8751/5219, at the T7 tip (`.tmp/run-browser.mjs`): **GREEN** stage-text (new, 4 sections),
  menubar, latex-copy (new §8), molecular-names (updated), new-project, register, chem (55), history (39 PASS), frame-occlusion
  7/7, render-regressions, molecule-demos, export3d, field-molecule, gpu-recovery, input, keyboard-window, lfo-tension,
  mir-controls, molecular-diff, offer, official-defaults-palette, routed-knob.
- **RED take-in-bugs §2** — `AssertionError: {"lines":12,"rows":false,"named":false,"head":"### CALCULUS · $t = 0.000$"}`.
  The suite asserts CALCULUS ⧉ copies JSON rows; T5 made it the prose figure on purpose.  The test needs updating.
- **RED current** — `AssertionError: valuesReveal` (three runs at T4), then `followsPalette` (at the tip): CSS timing checks
  in the modulation AUDIO face.  `valuesReveal` **reproduced on the base tree** (served from `git archive bd9b0e5`, extracted
  at `.tmp/base`): base 1 pass, 1 fail.  With that one key excluded (`.tmp/current-noreveal.mjs`) current is **15/15** on S3.
  `followsPalette` not yet re-run alone.
- **RED orbitals L9** — `RED L9 PLAY turns the register: t advances with the transport and every frame redispatches the
  volume` (1 failing of 24); not yet re-run alone (a loaded GPU starves the free-running rAF — measured ~2–3 frames/s).

## Open items

- Update take-in-bugs §2 (below).  Re-run `current` and `orbitals` alone; if red, run them on `.tmp/base` to prove them
  pre-existing.
- Write `S3-BUILD.md` and REPORT.md `## 2026-10-07 · 0.4.0 S3 — STAGE TEXT + WINDOWS`, waves numbered from **155** (T1 155 …
  T7 161; the first line says the integrator renumbers if S2 took them), appended at the END of REPORT.md.
- Merge risk for the integrator: the long LW line in `rack.js` (removed `dynamics,`, added a `particleUI` getter) and the
  `field.js` import on rack.js line 26 (dropped the unused `cameraKey`, `toScreen`) may collide with S2 — one-word merges.
- Decisions to state in REPORT: the formula's base went 88 px → 34 px (the notebook's title; SIZE 300 % gives 102 px); a
  stored `atomLabels:false` beside `molFormula` on is not honoured (one switch, `molFormula` is the kept key); the caption
  follows the STAGE TEXT switch and uses names.js' plain form (`H₂O · 1b1 HOMO · STO-3G`); the CLOUD readout was dropped;
  the rotor entropy went to ORBIT's Schmidt tile.

## The exact next step

1. `python3 tools/gate/server.py /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a4faa45d300fd21dc 8751`
   in the background; record its pid.
2. In `tests/take-in-bugs.browser-test.mjs` §2 (lines 70–75) assert the prose figure: the head matches
   `/^### CALCULUS · \$t = /`, the digest has `/\nFigure\. /` and one `Ehrenfest: `; run it; commit as the T5 test follow-up.
3. `LW_PORT=8751 GD_PORT=5219 node .tmp/run-browser.mjs current orbitals`, each alone.
4. Write `S3-BUILD.md` + the REPORT section (the facts above, the KIT BRIEF notes below); commit; kill the server by pid.

## KIT BRIEF notes for S5

- **Briefs 13 / 7 (the INFORMATIONAL):** `createStageText({ stage, canvas, racks, docked })` →
  `{ setFormula(md), announce(md, ttl = 2400), atomLabels(id, obs, half), place(), setOn(v), setScale(s),
  stats { renders, announced, places, labelWrites }, md, banner, formula, on }`; KaTeX via `renderNotebook`, ≤ 4 renders a
  second; the fade is CSS (`#molFormula.st-fade`, 0.6 s); `TYPE = { title: 34, heading: 22, body: 14 }`.  At 0.5.0:
  `setFormula` → `layer.addBlock({ md })`, `announce` → `layer.addLabel({ ttl })`, the labels → `layer.addLabel({ anchor })`.
- **Brief 6:** `capture.js drawCaption(g, W, H, text)` — foot-left, H·0.034 px, white over a dark stroke; a picture
  composites it through a foot strip, a recording draws each frame into a 2-D canvas (drawImage where the probe read the
  WebGPU canvas lit, else relay).  `recorder.overlay(i, ctx)` replaces it.
- **Brief 4 (cells):** CALCULUS `.calc-grid` (kit `.ro` tiles, 2 columns on the card, 3 floating, out of LEAN); ATOMS
  `.atm-table` (SPECTRUM's `.picker > .pk-n > .pk-chips > .pk-c`, periods 2 · 8 · 8 · 18, columns on the card and a phone,
  rows floating, `.on` = the element in force).
