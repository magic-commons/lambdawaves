# 023 chain B — THE BAR (Opus builder, worktree agent-a25b4b91855dea1f1, branch it023-B, BASE 3608a9ac = D closed at 9915e18e)

Kit MIR **1.5.6-alpha.10** on the clone road (kit-1.5.5 3ce9bc2 → 0272f11, one additive door). Adopted, pinned, `--check` in step.

## B1 EXPAND ALL SHOWS THE PILLS (9e5212eb; kit 0272f11)
- The kit had no public pill road (the pills only answered a rack's `scroll`), so the smallest door: `mir/shell/rack-scrollbar.js` `createRackPills()`
  returns `show()` (each shown rack's pills as after one scroll: seated now, gone `PILL.linger` 900 ms later, the 180 ms clip in and out ≈ 1.26 s;
  a rack slid off the view shows none); `mir/shell/rack.js` end: `rack.showPills()`. CHANGELOG line, docs/RACK.md line, version sites 3/3 (no new words).
- λWAVES: `lab/actions.js:132` FOLDS' run calls `rk.showPills()` when it unfolds (EXPAND ALL only). Measured: both racks' layers `on` 250 ms after the
  press (2 + 5 pills), off at 1650 ms. `B-shots/B1-pills-1600.jpg` (pills seat where the windows land; the cards are still flipping into place).
- `tests/mir-manifest.test.mjs` ACCEPTED `'1.5.6-alpha.10': 16b410f1…`.

## B2 NO T= / t= (872b27db)
- `lab/shell/transport.js`: `ui.periodFx` (WAVE 69's substituted theorem), its seat under TRANSPORT and `paintPeriodFx` gone (and the `formula` import);
  `:27` says why. REPEATS (`ui.periodRo`) and its hint (gcd, lap, %) stay. `lab/csb.css`: the `.csb-sec-tr > .fx` rule gone, `.fx` dropped from the
  ASK/echo hide list. The stage panel is 354 px (was 392); nothing else in the strip moved. Pictures `before|after-bar-1600-expanded.jpg`,
  `before|after-rack-expanded.jpg`.

## B3 PLAY/PAUSE (86681021)
- `lab/csb.css:43–52`: PLAY keeps the raised disc; the lit (playing) state is the same face — the `.on` rim + `--state-on-light` glow rule and its
  press twin are gone, and so is `lab/skin.css`'s old `#transport.mini .tbtn.play.on` (it flattened the lit face once the rim rule left; a tie it won by
  order). Motion = the kit chip's: hover the wash and `scale: var(--chip-hover-scale)` (1.06, not under a finger), `:active`/`.press` the press face,
  `--trig-press-relief` and `--chip-press-scale` (.92), release eases back over `--motion-micro` (80 ms). The dead docked play rules (`#transport.docked
  .tbtn.play`) went; reduced motion drops the transition (`:184–185`). No new token.
- The clipped chooser: the kit stepper seats at `--touch` (44 px) inside the bar's 34-px `overflow: hidden` box, so the row's foot was cut 10 px.
  `lab/csb.css:68` seats it at `--touch: 34px` there (row 34 = box 34). Bar height unchanged: 92 px at 1600 and 840.
- Pictures `B3-before|after-1600.jpg`, `B3-before|after-840.jpg` (MOLECULES on, H₂O, playing).

## B4 THE VERTICAL BAR (5460bbc6)
- `lab/csb.css:70–89`: the rack card / FREE bar was one centred flex wrap; now one 7-column grid with air between groups — PLAY · RATE over BPM ·
  MOD over EXPAND on the row's thirds; THE PRESET (the chooser the full width, then LIBRARY · MOLECULES · HYDROGEN · FOLDERS on columns 1 · 3 · 5 · 7,
  subgrids of the card's columns, so they sit over the tools); THE TOOLS, 7 + 6 on the same columns, left-aligned; the expander below, its order kept.
  `grid-area: auto` on the icons and an explicit area on the chooser and the panel undo the kit's docked-grid cells, which a grid now reads.
- Card height 212 px (was 206: the 6 px of air between groups). Pictures `before|after-rack-collapsed.jpg`, `B4-before|after-molecules.jpg`.

## Tests
- `./test.sh node` exit 0; `node tests/mir-manifest.test.mjs` PASS; `adopt.mjs . --check` in step with 1.5.6-alpha.10; `rack-deps --classes --no-write`
  HOLDS (persist 24/25); `pwa.test --write` after each row.
- Browser (own gate 9733 / GD 5733, stopped by pid): hide-reveal, window-switching, menubar, molecule-head GREEN.
- Kit clone: `MIR_SKIP_BROWSER=1 node tests/run.mjs` 81/81 (no kit browser test reads the pills).
- THE LOCK not run: no stage or field file moved (CSS, the bar's DOM, a rack door); no leaf expected to move.
- `tests/legacy/boot.browser-test.mjs` B148 (1) reads the T/t slots; legacy is not in the shipped gate and was left as history.

**Bundle: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a25b4b91855dea1f1/.tmp/kit-1.5.6-alpha.10.bundle`** (kit-1.5.5 @ 0272f11 + v1.5.5).

## The sentence for the close (docs/laws/control-surface.md)
023 B: EXPAND ALL shows every docked window's name pill a moment (`rack.showPills()`, MIR 1.5.6-alpha.10); the expander has no T/t theorem; PLAY is the
raised disc lit or not, moving as the kit's chips (hover 1.06, press .92) — no rim, no glow (supersedes T1's "ON face with rim and glow"); the bar's
chooser sits at 34 px; the rack card is one 7-column grid (the row's thirds, the preset, the modes on 1·3·5·7, the tools 7 + 6).

## Open questions for Josh
1. Playing PLAY shows only the pause glyph now (no accent ink, no rim). Want the glyph in the accent while it plays? One line.
2. The pills seat where the windows will land while the cards are still flipping in (≈ 250 ms). If they should wait for the flip, it is a delay in FOLDS.
3. The rack card is 6 px taller for its air. If height must be exactly kept, the gap between groups goes back to 4 px.
