# R2 THE REGISTRY'S PRESETS — BUILD (iteration 012, chain it012-other, branch `it012-other`)

## What changed
- **Seven more ORBITAL presets in the one table** (`lab/orbitalsview.js` `ORB_PRESETS`, 0.5.3 M10's table, now 15 rows). A LINE is a
  ladder row (a degenerate level taken whole, as THE PAINT GESTURE takes a crossed row), counted upward from the first valence line
  (the frozen core is left out, as OCCUPIED leaves it out). Amplitudes equal (√(1/n)), phase 0.
  - **ALL ODD**: lines 1, 3, 5 … · **ALL EVEN**: lines 2, 4, 6 … (over the lines the record carries).
  - **BELOW HOMO**: every valence orbital below the HOMO's level · **ABOVE LUMO**: every orbital above the LUMO's level.
  - **VIRTUAL** (mine): the LUMO and everything above it — OCCUPIED's complement.
  - **DEGENERATE** (mine): every degenerate valence level, all members.
  - **INVERT** (mine): every carried orbital the register does not hold (an empty register inverts to FILL ALL).
  - BELOW HOMO / ABOVE LUMO / VIRTUAL are spans, so a record that lacks one of their orbitals (C₆₀'s 183 columns) refuses with the
    record's own sentence; each preset refuses with its own sentence where the molecule has none (water: DEGENERATE).
  - The "HOMO–LUMO pair" the brief offered already exists as HOMO + LUMO, so it was not doubled.
- **Each press is one undo row and one FADE**: the presets ride the existing `<select>` road — the history ring's gesture window names
  the row `REGISTER PRESET` and coalesces it; the press calls `api.announce` → `say('preset', …)` (THE FADE), naming the orbitals through
  `lab/names.js` (`WINDING · 1e1g (a) + (b)`; more than four reads `ALL ODD · 15 orbitals`). No new road, no new key.
- **STATES presets unchanged** (BEAT · RING · LISSAJOUS · DARK · KICK X/Y/Z live in `molecular-register.js`; HOMO/LUMO spans have no
  meaning on the TDA state ladder and its 8-lane cap).
- **METHOD | ORBITAL row levelled** (`lab/chemview.js` gives the row `mol-mrow`; `lab/lab.css`): on the flex-end row the knob's box
  (label · 34 px dial · value line) stood 5 px taller than the seg, lifting the dial 11 px above the RHF | LDA cells. Now the knob is
  offset `top: 11px` and its label `top: -6px` (relative offsets, so no box changes size): labels on one line (683 px), dial centre on
  the cells' centre (720 px), the chevron's centre 721 px. A margin version of the same fix set the register's ResizeObservers looping
  (`tests/register.browser-test.mjs` RZ red) — the offsets do not.

## Files
`lab/orbitalsview.js`, `lab/chemview.js` (one class), `lab/lab.css` (two rules), `tests/register.browser-test.mjs` (R13 reads the
first eight by name; new R13b judges the seven on water), `lab/sw.js` (pwa --write).

## Tests
- `./test.sh node` — GREEN (41 suites, 0 failing).
- `node tools/rack-deps.mjs --classes --no-write` — HINGE holds (spectrum 25 / 25).
- browser (9521 / GD 5321): `orbitals` GREEN 0/24, `chem` GREEN 0/56, `stage-text` GREEN, `register` GREEN 0/23 (with R13b).
  The brief's known reds **orbitals L9 and chem L5 L7 did not show red on this machine** in any of three runs; I did not move them.
- Water's measured presets: ALL ODD 1·3·5, ALL EVEN 2·4·6, BELOW HOMO 1–3, ABOVE LUMO 6, VIRTUAL 5–6, DEGENERATE refused, INVERT 0–4
  (after VIRTUAL). Benzene: DEGENERATE takes the ten e-pairs, ALL ODD 15 orbitals.
- Screenshot: `research/iteration-012/o-shots/R2-presets.png` (benzene, ALL ODD pressed by hand, THE FADE reading `ALL ODD · 15 orbitals`,
  the METHOD | ORBITAL row level at the card's foot).

## CLAUDE.md sentence for Yan
In the MOLECULES paragraph, after "the register's eight ORBITAL presets — HOMO · LUMO · HOMO + LUMO · FRONTIER FOUR · HOMO SET · LUMO SET ·
WINDING · OCCUPIED, one table in `lab/orbitalsview.js` since 0.5.3 M10 —": "iteration 012 R2 added ALL ODD · ALL EVEN (every other ladder
line from the first valence line, a degenerate level one line) · BELOW HOMO · ABOVE LUMO · VIRTUAL · DEGENERATE · INVERT to the same table;
the METHOD | ORBITAL row is `.mol-mrow`, the dial levelled by relative offsets (a margin there loops the register's ResizeObservers)."

## Open questions for Josh
1. ALL ODD counts line 1 as the lowest VALENCE line (the core is left out, as OCCUPIED does). Should the folded core count as a line?
2. INVERT inverts over the WHOLE ladder (core included), so INVERT on an empty register equals FILL ALL. Keep, or valence only?
3. Any STATES presets wanted (e.g. "S₀ + every bright state")? None were added this row.
