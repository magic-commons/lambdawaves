# M5 THE SHELF SHOWS TWO — built (chain M, iteration 015, 2026-10-24)

## What
- Josh: "Show 2 volumes, Vol. I and Vol. II but show that one is WIP."
- `tools/volumes/pack.mjs --next <numeral>` (with `--wip`) puts THE NEXT VOLUME on the shelf before the cut opens it.
  - While every molecule still fits the last volume, `volumes.json` gains a placeholder:
    `{ id: 'vol-<last+1>', numeral: N, title: '<title> · 2', wip: true, count: 0, bytes: 0, bases }`. It has no index and no files.
  - Once the cut opens that volume for real, its own entry stands and no placeholder is added. That is C4's road, unchanged.
- `lab/volumes.js` `validVolume` admits such an entry: `wip: true` and `count: 0`, with no index or archive. Before this, the shelf would drop it.
- `lab/picker.js`: the shelf card of a zero-count WIP volume with no index wears the WIP pill and says FILLING.
  - It offers no INSTALL, its open is disabled, and its numeral is dimmed (`.mm-vol.filling`).
  - Its hover: "VOL. II is being filled — it installs once its first molecules are packed".
  - It is left out of the volume stepper inside an open volume.
  - The search (A2) never reads it, because only installed volumes are read.

## Dry runs (scratch only: `LW_VOLUMES=.tmp/m5`, raw H2O and NH3 copied read-only, `--out-dir` in .tmp; dist/ never written)
1. `--only H2O --max-gb 5.25 --wip --next II` gives the shelf `vol-1 I` (1 molecule, index) and `vol-2 II · All the Molecules · 2` (wip, count 0,
   no index).
2. `--only H2O,NH3 --max-gb 0.00005 --wip --next II`: the cut opens vol-2 for real (wip, count 1, its index), and no placeholder is added.
- The browser proof: this worktree has no `lab/volumes` link. A scratch link to run 1's dist (removed after) served the shelf, and the LIBRARY
  read "VOL. I · 1 molecules · 6 bases · INSTALL · 105 kB" and "VOL. II · WIP · FILLING". Shot `m-shots/M5-shelf.jpg`. No lab code reads a test
  shelf: none was needed.

## Tests
- `library` GREEN after the change.
- `./test.sh node`: see the report.

## For Josh (the live run is yours, after the queue)
`pack.mjs --candidates …/vol-1.candidates.json --volume vol-1 --title 'All the Molecules' --max-gb 5.25 --wip --next II --incremental`.
VOL. I is ≈ 4.2–4.4 GB, under the cut, so VOL. II shows FILLING until the cut opens it. `--sole` still works beside it.

## CLAUDE.md sentence
"THE SHELF SHOWS TWO (iteration 015 M5): `pack.mjs --wip --next II` puts the next volume on the shelf as a placeholder
`{ wip: true, count: 0 }` (no index) while the last volume is under the cut. volumes.js admits it, and the Picker's card reads VOL. II · WIP ·
FILLING with no INSTALL. Once the cut opens it, its real entry stands."
