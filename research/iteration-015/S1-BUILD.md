# S1 THE COMPACT HAMILTONIAN (iteration 015, chain S)

Josh: "Everything below the 140 orbital picker is a mess. I want it more compact. Bonnus points if it shortens the height and be able to hide that
section with a expander toggle." (his picture: `refs/spectrum-below-picker.png`, ≈ 600 px)

## What changed
- `lab/windows/spectrum.js`: the HAMILTONIAN group (`.grp.sp-ham`) is a head — its label and lab/fold.js' chevron (`data-fold="ham"`) — over
  `.sp-ham-body`. The fold is CLOSED on a first run (fold's default; first-run.js `inner` closes any that is open) and opens through the card's
  WORKSPACE `folds` (rack-wiring.js reads every `.lw-fold[data-fold]`, nothing new there).
- Inside: ‹ SYSTEM › on its row, then ONE tight row per system, **shown only while the stepper names that system** (`hamShow`, called from
  `ui.hamSeg.set` and an `onHamiltonian` listener, keyed on the operator in force; MOLECULES shows none). Before 015 every row showed under
  every system (Josh's picture: ELEMENT Z and the GAS rows under HYDROGEN).
  - HYDROGEN: Z (ion) · μ/mₑ · 1 | Ps | μH, then SCALE 1/n | λ · λ SCALE;
  - BOX and OSCILLATOR: WELL a · GAS σ · GAS |k| · BASIS 140 | AXIAL · LAUNCH / BOUNCE (two small trigs in one column);
  - ATOM: ELEMENT Z alone; CENTRAL, QUARKONIUM, SEPARABLE: none (their windows are their editors).
- The segs are knob-sized (`.sp-vseg`: the options in a 52–58 px column); the knobs 52 px (46 in the BOX row). Words moved into the hints:
  POSITRONIUM / MUONIC H → `Ps` / `μH`, HYDROGEN 1/n / STURMIAN λ → `1/n` / `λ`, AXIAL 256 → `AXIAL`, COHERENT BOUNCE → `BOUNCE`, WELL RADIUS
  a → `WELL a`, `μ/mₑ (mass)` → `μ/mₑ`, SCALE's sentence → `SCALE` (each hint carries the old words). The notes stay (behind HELP).
- Kept: every `ui.*` name (`hamSeg`, `wellKnob`, `zKnob`, `muKnob`, `elemKnob`, `gasBasis`, `gasSpeed`, `gasRo`, `scaleSeg`, `lambdaKnob`,
  `sturmRo`), every option id (`1 · ps · muh`, `reg · axial`, `hydrogen · sturmian`), `ELEMENT  Z`'s label (the legacy suite reads it), the CSB
  favourite `spectrum.scale` (its face is the same seg; the column look is scoped to the card). No modulation target names these controls.
- `lab/lab.css` § iteration 015 S1: the rows' rules (unlayered, over skin.css' `.native-clean .row > .k` 64 px basis).

## Measured (`SYS=well node tools/s-shots.mjs spectrum`, the card floated 320 px, the fold open)
The whole group open: HYDROGEN 213 px · BOX 155 px · ATOM 143 px (it was 570 px under every system; target ≤ 300). Folded: the head alone.
The BOX row's parts: 46 · 46 · 46 · 52 · 84 px in a 292-px row.

## Files
`lab/windows/spectrum.js`, `lab/lab.css`, `lab/sw.js`, `tools/s-shots.mjs` (scene `spectrum` prints the heights and the widest row).

## Tests
`node tools/rack-deps.mjs --classes --no-write`: spectrum at 25 (15 forward + 10 shared — no new crossing: `fold` and `label` are imports),
HOLDS. `tests/molecular-names.browser-test.mjs` PASS (it drives ‹ SYSTEM › by its aria). `./test.sh node` and the S-chain browser suites: see
S4-BUILD.md.

## Shot
`s-shots/S1-compact-hamiltonian.jpg` — left: before (S3's tree: every row under HYDROGEN); middle: HYDROGEN; right: BOX.

## CLAUDE.md sentence (THE WINDOWS, after SPECTRUM's line; and MINIMIZED BY DEFAULT's "What stays open" list is unchanged)
Since iteration 015 S1 SPECTRUM's HAMILTONIAN folds behind its chevron (`data-fold="ham"`, closed on a first run, open through WORKSPACE
`folds`) and shows ‹ SYSTEM › plus the rows of the system in force only — HYDROGEN: Z · μ · 1 | Ps | μH and SCALE 1/n | λ · λ; BOX and
OSCILLATOR: WELL a · σ · |k| · BASIS · LAUNCH / BOUNCE; ATOM: ELEMENT Z — its segs knob-sized (`.sp-vseg`), every `ui.*` name kept.

## Calls for Josh
1. The rows follow the system (Yan's plan said "one row per system"; the brief said "show/hide as now" — they never hid). If you want every row
   visible at once, `hamShow` goes and the group is ≈ 330 px.
2. LAUNCH from HYDROGEN now takes two moves (‹ BOX ›, then LAUNCH) — Ctrl-drag on the stage and the K key still launch from anywhere.
