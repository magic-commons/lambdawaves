# 023 R — THE ROWS AND THE WORDS (Opus builder, branch `it023-R`, base 0861a715 = B closed at 2ab15fa2)

Seven rows, one commit each; kit **MIR 1.5.6-alpha.11** (one additive door, R7). Heights by `tools/row-fit.mjs` on the 300-px rack
(1600 × 1600); timings by a page-side rAF probe (`.tmp/probe/words.mjs`, not committed), same machine, base served beside the branch.

## Rows
- **R1 SETTINGS › DISPLAY** — the gamut switch reads **P3** (`lab/native-ui.js:50`; the hidden seg's option too, `lab/windows/settings-card.js:94`;
  the IN FORCE readout keeps DISPLAY-P3) and sits beside IN P3's CONVERT · VIVID on one fit row `lw-gamut` (`native-ui.js:62`, `lab/skin.css:904`:
  the switch two cells, the seg three, bottoms aligned). No wrap at 300 px; SETTINGS **598 → 546 px**. Note: the plan's "GAMUT sRGB · P3" seg is
  not on screen — `native-ui.js` replaces it with the switch since 0.5.0; the row Josh saw is the switch, so the switch is what moved.
- **R2 INFORMATIONAL** — every row is the same four columns (`skin.css:912`): switches stretch over 1–2 (STAGE FORMULA, ATOM LABELS over 1–3),
  OPACITY · the SIDE glyph · the fold's chevron in column 3, every SIZE · LIST CAP · PAD in column 4 (knobs over knobs, buttons over buttons);
  pairs halve the row, CURSOR · MARKS keep the same halves (gap 4); PAD moved after the chevron (`lab/informational.js:65`); 4 px between rows =
  4 px between a row's lines (`skin.css:804`). The fault was `auto-fit` collapsing empty tracks, so every row had its own columns (47/60/81 px).
  INFORMATIONAL **872 → 844 px** (row-fit, fold open); with a molecule 513 → 489. At 300 px no label is cut, before or after — the "clipped"
  shot is a crop edge; what Josh saw is the misalignment. Below 300 px (only under a 376-px viewport) NAME now ellipsizes (BALL AND STICK and
  BOTTOM did already).
- **R3 WAVE's ESP rows** — SIZE · RADIUS · MAP ONLY over PROBE · RANGE · LIVE · SLOW on one template `1fr 1fr 1.5fr` (`skin.css:894`), the
  switches left-aligned in column 3 and nowrap (LIVE · SLOW needs ≈ 103 px, so three equal 81-px columns would wrap it), the four faces one size
  (29 px, as SIZE · RADIUS were). WAVE with ESP **652 → 648 px**; ISO | SAS | SES between them unchanged.
- **R4 THE TIMELINE's t** — no kit door: the kit's `.ro-val { min-height: 1.4em }` gave λWAVES' 18-px value a 25-px box with the numerals at its
  top, 3.6 px above the BPM pill's number. `skin.css:848` drops it in the timeline's readout: value box 1087.4/25.2 → **1091/18, identical to
  `.tempo-number`** (centre 1100 = the row's); t stays on the value's baseline.
- **R5 THE NOTE IS UPRIGHT** — the ⓘ was `italic … Georgia` in λWAVES' own sheet (`skin.css:302`); now the UI face, upright. The note's text was
  already upright (Roboto, no `<i>`/`<em>`; measured). The notebook's `.nb-about` "i" keeps the kit's italic (not a window's note).
- **R6 THE ESP STRIP** — the `φ · a.u.` caption is gone (`material.js`; its CSS, `lab.css`); the unit is ESP BAR's hint ("ESP colour bar: φ, five
  values in a.u.", `stage-words.js` INFO_ROWS). `rest()` keeps the bar's box apart and `free(false)` leaves it out (`stage-words.js:188`, `:323`);
  a LEFT/RIGHT strip is seated from that (`material.js:101` `st.free(horiz)`). Measured, both sides: CSB expand **131 → 0 px**, dock
  **76 → 0 px**, FOLDS 0 → 0. (The plan said ψ; the strip wore φ — the potential.)
- **R7 THE WORDS ARE LIVE** — diagnosis (`stage-words.js`): (1) the words were re-placed only on body classes and the transport's class, so a
  window opened, closed or floated in a rack — which changes `racks()`, the free stage — never re-placed them: closing the right rack's five
  windows moved the formula **0 px, indefinitely** (it lay where the closed windows had been until the next string); (2) a re-seat travelled on
  the kit's block spring (k 34, ζ 0.72), ~0.9–1.5 s; (3) while the pointer is within 280 px the app's own hold (013 N2, `layer.freeze`) froze
  even a re-seat. Fix: the furniture key carries which racks hold an open window, watched by one MutationObserver over both racks
  (`stage-words.js:227`); `place()` asks the kit's new `viewChanged({ land: true })` — rests read again, every body lands at once, held or not.
  ms from the change to the words still at their place (6 still frames, ≈ 83 ms of the figure is the stillness test):
  POSITION → BOTTOM 1467 → **83**; → TOP 868 → **117**; right rack emptied never (0 px) → **70** (150 px); refilled 203 → 277 (the windows' own
  entrance). A changed string (NAME on, NH₃) stays the kit's exit + entrance: ≈ 415 ms legible, ≈ 820 ms at rest, before and after — KATEX_MS
  250 is not the lag.

## Kit (the clone road)
MIR 1.5.6-alpha.11 · THE WORDS LAND — `mir/info/layer.js` `viewChanged({ land })` (+ `snap` import, `landing` flag), version sites 3/3,
CHANGELOG, docs/INFORMATIONAL.md; kit-1.5.5 @ **c18957a**; clone `MIR_SKIP_BROWSER=1 node tests/run.mjs` 81/81, `info.browser.mjs` 21/21 and
`info-pages.browser.mjs` 14/14 (MIR_CDP_PORT 9770/9780, served on 9741, stopped). Adopted (3 files), pinned in `tests/mir-manifest.test.mjs`
(fe6f4b26…), `adopt.mjs . --check` in step, docs/FOR-MIR.md line. No new words (i18n unchanged).
**Bundle: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a753ae5c3a6688d25/.tmp/kit-1.5.6-alpha.11.bundle`**
(kit-1.5.5 @ c18957a + v1.5.5; `git bundle verify`: complete history).

## Tests
`./test.sh node` EXIT 0 · `node tests/mir-manifest.test.mjs` PASS · `node tools/rack-deps.mjs --classes --no-write` HOLDS (hinge: persist 24 ≤ 25) ·
`node tools/new-project.mjs --check` in step · `node tests/pwa.test.mjs --write` (lab/sw.js in R7's commit). Browser (gate 9727, gd 5727), all
GREEN: stage-text, molecule-head, menubar, window-switching, current, hide-reveal, chem 56/56, lw-links, register 23/23, timeline 14/14,
routed-knob 7/7, frame-occlusion. THE LOCK not run here (no field, shader or capture path touched; the words and the strip are DOM, never in an
export); expected 843/0 and 987/0 at the merge.

## Pictures (`research/iteration-023/R-shots/`, before/after at the 300-px rack)
R1-settings · R2-informational (molecule on) · R3-wave-esp · R4-timeline-t (the play row) · R5-note (WAVE's ⓘ and its note) · R6-esp-strip.

## The sentence for docs/laws/stage-words.md (at the close)
THE WORDS ARE LIVE (023 R7): the furniture the words seat on is which racks hold an open window (watched over both racks) plus `rack-l ·
ui-hidden · phone` and the bar's class; a re-seat LANDS (the kit's `viewChanged({ land: true })`, 1.5.6-alpha.11) at once, even under the
pointer's hold; only a new string runs the kit's exit and entrance. A LEFT or RIGHT ESP strip is seated from the stage edge and its racks only
(`free(false)`), never from the bar; its unit is ESP BAR's hint.

## Open questions for Josh
1. (R7) A re-seat now JUMPS to its place; the old ~1 s glide is gone for seat and furniture changes (a resize still glides). Keep the jump? Default: yes.
2. (R3) The ESP rows' third column is wider (1.5 fr) so LIVE · SLOW stays one line; the knobs no longer stand under EXPOSURE · SOFT. Default: as built.
3. (R2) Under a 376-px viewport NAME ellipsizes in its quarter column. Default: as built (the 300-px rack is the designed density).
4. (R6) A side strip ignores a vertical CSB at the same side (it is seated from the racks only, as asked). Default: as built.
