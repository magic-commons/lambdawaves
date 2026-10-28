# 020 T — THE CONTROL SURFACE (Opus builder, 2026-10-27; branch `it020-T` from c7bd626 = yan-c, chain S merged + the plan closed)

All three rows are lab-only. Kit unchanged (1.5.0-alpha.33). THE LOCK untouched (no field or shader line moved). Probe: `tools/bar-probe.mjs`
(`play | seats | z`), a diagnostic, not a gate. Numbers: headless Firefox, gate 9681 / driver 5681, 1600 × 1000 (z: 1600 × 1300).

## T1 PLAY IS A BUTTON — 3963366
- Before: PLAY sat raised in every state. The lab rule (`lab.css` `.csb-play > .tbtn.play`) out-ranked the kit's hover and `.tbtn:active`, so hover
  and press only scaled the svg; ON was skin.css' `#transport.mini .tbtn.play.on` (transparent, no shadow), its colour only. The chip container
  (`data-mir-surface="chip"`) drew a pane shadow under the button's raise: two reliefs.
- Now (`lab/lab.css`, the PLAY block): the kit's `.trig` sequence, written on PLAY — rest `--relief-raise`; hover the raise + `--state-hover-wash`
  (declared on the button, the kit scopes it to `.trig`) and `translate: 0 -1px`; pressed `--trig-press-relief` + `--state-press` face, no lift;
  ON `--state-on` + `--state-on-rim` + `--state-on-light` (the accent glow; ON + pressed sinks too); `transition: background, box-shadow, scale,
  translate, color`. The container keeps its glass, `box-shadow: none`. The kit's svg scale (1.08 hover / .94 press) stays.
- Measured (computed, light theme): rest raise · hover raise + wash, translate 0 −1px, svg 1.08 · pressed face .16, shadow none, svg .94 · ON face
  .62 + rim + glow. Picture: `T-shots/T1-play-vs-chip.jpg` (rest / hover / pressed / on, PLAY over the modulation window's TAP `.trig`);
  `T1-play-before.jpg` the same four before.

## T2 FOLDS AND NODES — 8b2aea6
- `lab/shell/transport.js`: the right group is SEARCH · FINDER · ♥ · ◧ · **FOLDS** / **NODES** · INFORMATIONAL · THEME · ⚙ (`app:folds`,
  `app:nodes` after `app:rack`, built by `ico()` through the 018 F `--ico` mask road).
- FOLDS: `rk.windows()` → every open, built window but the docked `transport` (the bar never folds itself); any folded → EXPAND ALL (`rk.fold(id,
  false)` each), else MINIMIZE ALL. Its word ("EXPAND ALL — open every folded window" / "MINIMIZE ALL — fold every open window") is re-read at
  hover/focus and once after boot through the kit's `hint()` / `ariaLabel()`. Measured: first run 8 folded of 8 → 0 of 8 → 8 of 8 → 0 of 8.
- NODES: `LW.nodes.open()` / `.close()`; `.on` + `aria-pressed` while `LW.nodes.win.isOpen()`. The graph is built after the bar (rack.js:845), so the
  button finds it (a 250 ms retry, at most 30 s) and follows its root's `hidden`/`class` with a MutationObserver: closed by its own ×, the light
  goes out. Measured: press → open, lit; × → unlit; press twice → closed, unlit.
- Icons: `lab/img/icons/folds.svg` (chevrons up/down), `lab/img/icons/nodes.svg` (three nodes in a chain) — plain strokes for Gemini to redraw.
- THE GRID: `--csb-cols: 5` — two rows of five, the empty seat at the end of the second row. Five seats are 196 px, inside the 212-px side track,
  so the bar keeps 674 px in HYDROGEN and MOLECULES (`tools/csb-probe.mjs`: stage 674/674, FREE 280, rack 262) and its height (two rows); three
  rows of four would have grown the bar by a row. Docked, the card's 240 px wrapped the thirteen icons 6 + 6 + 1 (⚙ alone); `.docked` now takes
  `column-gap: 2px` → 7 + 6. FREE wraps 7 + 6 as it was. Pictures: `T2-bar-stage.jpg`, `T2-docked-and-free.jpg`.

## T3 THE BAR ON TOP — fe94c50
- `lab/lab.css`: `#transport.mini { z-index: calc(var(--z-chrome) + 3) }` (above `#floats`, + 2); `body.transport-under #transport.mini` back to
  chrome. `#rackFavList` (the ☆ list, before the bar in the DOM, so a tie went to the bar) rises to + 4 with the search pill and its tiles; the
  menubar's menus and the hints are top-layer popovers; the notebook (+ 4) stays above the bar.
- `lab/shell/modulation.js` `modDodge`: `under(!free(want))` after the seat is chosen — the class is on exactly while the bar's seat still hits
  TIMELINE or MODULATION; off when the bar is docked / FREE, when nothing is open, when a seat clears.
- Measured (`z`, the bar's centre pixel by `elementFromPoint`):
  | scene | before (z 30) | after (z 33) |
  |---|---|---|
  | keyboard editor dragged over the bar | the keyboard | BAR |
  | MIR OPTIONS dragged over the bar | MIR OPTIONS | BAR |
  | TIMELINE open (docked at the foot) | bar dodges to the top | same — top, BAR |
  | + MODULATION (stacked on the timeline) | bar at the top | same — BAR, class off |
  | MODULATION dragged up over the top seat (no seat free) | — | modulation's card over the bar, `transport-under` on |
  | both closed | bar at the foot | same — BAR, class off |
  Picture: `T3-bar-on-top.jpg` (keyboard over → bar on top · MIR OPTIONS over → bar on top · both pinned → bar under).
- At 1600 × 1000 (914 px stage) the two windows CYCLE (016 W5): opening MODULATION closes TIMELINE, so the "no free seat" case needs a tall
  screen or a hand drag; the probe uses 1300 px.

## Tests
After each row `node tests/pwa.test.mjs --write` and `./test.sh node` (exit 0; 246 → 247 PASS lines). `rack-deps --classes --no-write` HOLDS
(spectrum 25/25). Browser (9681/5681): window-switching GREEN, hide-reveal GREEN, keyboard-window GREEN, menubar GREEN, stage-text GREEN;
`tools/csb-probe.mjs` widths as above. No test re-aimed, no new test file.

## For CLAUDE.md (the close)
- THE CONTROL SURFACE paragraph: the right group is SEARCH · FINDER · ♥ · ◧ · FOLDS / NODES · INFORMATIONAL · THEME · ⚙ (020 T2, `--csb-cols: 5`,
  two rows of five, 674 px kept); FOLDS is EXPAND ALL while any open rack window is folded, else MINIMIZE ALL (never the docked bar); NODES opens
  and closes the NODES window and is lit while it is open (it follows the window's own ×). PLAY wears the `.trig` sequence (020 T1).
- THE BAR IS ON TOP (020 T3): `#transport.mini` sits at chrome + 3, over `#floats` (the keyboard, MIR OPTIONS, every floating window); `modDodge`
  sets `body.transport-under` only while no seat clears TIMELINE / MODULATION, and the bar goes under them for that time; the ☆ list, the search
  pill and its tiles are + 4.

## Open questions for Josh
1. FOLDS ignores the docked CONTROL SURFACE card (folding it would hide the button you pressed). Should it also skip the windows a project keeps
   open on purpose (e.g. SPECTRUM under a molecule is folded by law)? Today EXPAND ALL opens it too.
2. The empty tenth seat sits at the end of the second row (after ⚙). Say if you would rather it sit elsewhere, or take a tenth button.
3. ON's accent glow on the 56-px PLAY is a full ring (the chips glow only their text). Softer, or rim only?
