# λWAVES 0.4.0 · S3 STAGE TEXT + WINDOWS — BRIEF for the S3 builder (waves from the next free number)

**Written by Claude Sos (the fallback Major Agent), 2026-10-07, from `PLAN.md` the way Yan wrote the S0/S1 briefs.**
The contract is `research/release-0.4.0/PLAN.md` §4 **F2** (THE STAGE TEXT AND ITS FADE — the first taste of the
INFORMATIONAL) and **F3** (THE WINDOWS), the §6 row **S3**, and §9 (every ruling takes its first option: R-W1 retire
DYNAMICS as mapped, R-W2 the prose figure, R-W3 PLANE with CLIP, R-A2 ATOMS back as the periodic table). The map is
`research/release-0.4.0/survey/LWAVES-AUDIT.md` (its 27-card table). It runs AFTER S1 NAMES and S1′ `cameraEye` are
merged: the fade speaks the names (`lab/names.js` `forms()`), and the atom labels already go through `cameraEye` and
write only on change. One builder, sequential commits: `rack.js` is shared by most of them, and writes stay
single-threaded. No verifier stage (PLAN §6: one light check); Fable/Sos looks once.

## 0 · Laws

Never edit `lab/mir/**` or `lab/fonts/**`: the kit's notebook renderer (`lab/mir/shell/notebook-render.js`,
`notebook-math.js`) is IMPORTED, never changed. After any `lab/` edit `node tests/pwa.test.mjs --write`, then the suites.
**Subtract, don't add**: count `lab/*.js` lines before and after (35,135 on `bc103b3`, 113 files) — this stage must go
DOWN (DYNAMICS alone is `dynamics.js` 338 + `dynamicsview.js` 131). Diagnostics in `tools/`. **The glass is Josh's**: a
text or layout change never licenses a skin change; RADIATION's tile skin goes to CALCULUS ONLY (Josh asked for
CALCULUS "like RADIATION"; METERS and WIGNER were not asked for). Three scopes (`docs/STATE-SCOPES.md`). Never
`pkill -f`. Git only in your worktree; never push. **Ports `LW_PORT=8751 GD_PORT=5219`.** One browser suite at a time.
REPORT.md waves under `## <date> · 0.4.0 S3 — STAGE TEXT + WINDOWS`. CLAUDE.md is updated in the same commit as any law
it states (the STAGE FORMULA paragraph, the legacy list, the window names).

## 1 · The commits, in order (line numbers on `bc103b3`; grep on yours)

### T1 · THE STAGE TEXT renders real maths (F2)

- Cloud's plain-text formula (`rack.js` `placeMolFormula` ~l.2385, `registerText` ~l.2425, `stageTextTick` ~l.2434)
  becomes markdown + KaTeX through the kit's notebook renderer, from `stateLatex` (`lab/latex-state.js`) for SPECTRUM's
  states and a one-function TeX of the library formula for a molecule (`H_2O`, `C_6H_6`).
- **The key is the string it would render**: build the string, compare with the last, touch the DOM only on change; KaTeX
  runs at most four times a second; never a live coefficient in the string; no per-tick layout read (the placement reads
  layout only on resize, transport move, or a changed string).
- **The type scale** is the notebook's three sizes: formula = title, announcement = heading, atom label = body.
- Name the interim renderer in a comment and in REPORT as the thing 0.5.0 deletes (`announce` → `layer.addLabel({ttl})`,
  the formula → `layer.addBlock({md})`).

### T2 · THE FADE (F2)

- `announce(md, ttl)` writes into the same node and fades after `ttl`; the formula returns after it.
- Called **on hand presses only** by MO-REGISTRY's presets (`lab/orbitalsview.js` `ORB_PRESETS` l.71: `WINDING · 1e1g (a) +
  (b)`, `HOMO + LUMO · 1b₁ + 4a₁` — the names from `forms()`), and SPECTRUM's presets. Never on restore, undo, redo,
  project open, a link open, or a modulated preset; Ctrl+Z replays no banner. Thread a `{ hand: true }` (or the existing
  user-gesture flag if one exists) from the press, rather than detecting "not a restore".
- The palette and camera HUD announcing (R-I2) is NOT this stage (0.5.0, the kit's `addLabel`).

### T3 · ONE DISPLAY ROW + THE CAPTION IN CAPTURE (F2)

- SETTINGS › DISPLAY (`rack.js` ~l.1302–1307): STAGE FORMULA + ATOM LABELS and their two SIZE knobs become ONE row,
  **STAGE TEXT** (switch + SIZE). PREFERENCE keeps `molFormula` / `molFormulaSize`; `atomLabels` / `atomLabelsSize` are
  read once (if a stored `atomLabels: false` exists with `molFormula` on, say in REPORT what you chose and why) and
  dropped. The EDIT-menu toggle (~l.4008 "STAGE FORMULA on / off") follows the new name. `docs/STATE-SCOPES.md` and the
  PREF set in `tests/new-project.test.mjs` change with it; `node tools/new-project.mjs --check`.
- **The caption in capture**: one plain-Unicode line (`H₂O · 1b₁ HOMO · STO-3G`, or the SPECTRUM states line) drawn into
  the capture overlay canvas (`lab/capture.js`) so a PNG, a loop and a video carry the name — the DOM formula never
  reaches an export. Plain form from `forms()`; no KaTeX in a canvas. Brief 6 replaces it at 0.5.0.

### T4 · RETIRE DYNAMICS (F3, R-W1) — the big subtraction

- L/T/V/S and its plot → SHADOW's footer; the moments and the virial → CALCULUS rows (they become tiles in T5); the dipole
  lines → RADIATION; ACTION–ANGLE → gone (SPECTRUM is it).
- **PARTICLES → a switch in VORTEX** (same j/ρ; today `particlesVisible = canPresent(wDyn)`, `rack.js` ~l.1017 — the
  particles ride DYNAMICS' card); VORTEX's note calls it "the flow".
- `RETIRED_WINDOWS` (`rack.js` l.329, today `{ style: 'observer' }`) gains `dynamics: 'shadow'` so saved layouts land.
  Saved projects naming DYNAMICS open (the history and project suites prove it).
- Delete `lab/dynamics.js`, `lab/dynamicsview.js` and every road to them (`may('dynamics')` ~l.1075, the card, the menus,
  the targets). Report the lines that went.

### T5 · CALCULUS AS TILES + THE PROSE FIGURE (F3, R-W2)

- The laws become tiles in a grid (two columns on the card, three floating), opted out of LEAN, with RADIATION's tile skin
  (`lab/radiationview.js` is the model; copy its classes, never repaint either).
- Every row gains `tex`. ⧉ copies **the prose figure**: a heading, then "Figure. ⟨ψ|ψ⟩ = 1.000 (d/dt = 0 to 1e-9); …",
  related rows combined into sentences (the Ehrenfest pair as one), inline `$…$`, display `$$…$$` for the laws — which
  pastes into the notebook and renders. `DIGESTS.calculus` (fixed in S0 to read `calculus.last`) is the source.
- Test: the copy parses under KaTeX `throwOnError` (the `tests/latex-state.test.mjs` pattern) and a paste into the
  notebook renders (browser, once).

### T6 · THE SMALL MOVES (F3)

- **METERS**: the PERFORMANCE seg (`rack.js` ~l.2509) moves beside GOVERNOR in SETTINGS › QUALITY; the GOVERNOR readout
  and FRAME PROFILE stay in METERS.
- **Names, ids stable** (R-W3): SLICE (`wSlice`, ~l.2268) → **PLANE**; SLICE / CLIP (`wClip`, ~l.1265) → **CLIP**. Eyebrows,
  titles, menu rows, notes, CLAUDE.md. Saved ids `slice` / `clip` unchanged.

### T7 · ATOMS RETURNS AS THE PERIODIC TABLE (F3, R-A2)

- `wAtoms` (~l.2835, eyebrow `ATOMS · LEGACY` → `ATOMS`): its Z stepper becomes a grid of H–Kr cells grouped by period
  (periods as columns on the card and on a phone, rows when floating), built with SPECTRUM's own button builder.
- SPECTRUM's ATOM opens it (S0 wired the button); **it gets its own row in the "+" and WINDOW menus** (two hops through a
  folded SPECTRUM is not a seat). Its readouts (Δ-SCF beside −ε, the quantum defect, the α-dependent order) stay.
- `docs/LEGACY-WINDOWS.md` and CLAUDE.md's legacy paragraph drop ATOMS from the hidden list. H₂⁺, HELIUM, H₂,
  ELECTROSTATICS and QCD stay hidden (decided at 0.5.0).

## 2 · Acceptance (PLAN §6 row S3)

No per-tick layout reads (FRAME PROFILE shows no new per-tick cost; say how you checked); KaTeX only on a changed
string; WINDING and HOMO + LUMO fade with their names, on hand presses only (a test presses, then undoes, then opens a
project: one banner, not three); one STAGE TEXT row; the caption in capture (a captured PNG's overlay carries the line);
DYNAMICS retired with PARTICLES in VORTEX and a saved DYNAMICS layout landing on SHADOW; CALCULUS tiles + the prose
figure; PERFORMANCE in QUALITY; PLANE / CLIP; ATOMS back with its table and its "+" row. `lab/*.js` lines DOWN.
Gates: `bash test.sh node`; `node tools/new-project.mjs --check`; browser, one at a time on 8751/5219: `menubar`,
`latex-copy`, `register`, `molecular-names`, `chem`, `history`, `new-project`, `first-run`, `frame-occlusion` (windows
moved), `current`, `render-regressions`, and every suite that named DYNAMICS, SLICE or METERS' PERFORMANCE (grep
`tests/`). No digest lock unless you touched `field.js`, a shader or the frame order (you should not).

## 3 · What you do not do

No new window, tab or setting beyond what §1 names. No kit edits (briefs 3, 4, 6, 7, 13 are S5's). No INFORMATIONAL layer,
springs, leader lines, pages or film overlay (0.5.0). No skin change outside CALCULUS taking RADIATION's tiles. No
version bump, tag, CHANGELOG, deploy or push.

## 4 · Hand-off

`research/release-0.4.0/S3-BUILD.md`: the commits, the gates with counts, `lab/*.js` lines before and after (per commit
for T4), the open items, and the KIT BRIEF notes S5 needs (the interim renderer's API as built, for brief 13 / 7; the
CALCULUS grid and the ATOMS cells, for brief 4). Kill your gate server by pid. Final message: ten lines + worktree path
+ branch.

## 5 · Harness

Compound shell with variables, loops, heredocs or backticks may be refused: plain commands, scripts as files under
`.tmp/`. If a command is refused, reshape it; never retry verbatim. Commit after each T; the session may end mid-wave and
the next agent picks up from your branch.
