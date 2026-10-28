# 022 chain F — THE ROWS THAT FIT (Opus builder, it022-F, BASE 79c67a62)

## F1 THE FIT ROW — kit 1.5.6-alpha.6 (clone road; kit 19c89e3 + 6a8cd78)
- `css/base.css` `.row.fit`: `grid-template-columns: repeat(auto-fit, minmax(min(var(--cell-min, 40px), 100%), 1fr))`, gap `var(--row-gap) 4px`,
  `align-items: start`. A knob's cell is the cell (`width: auto; min-width: 0; justify-self: stretch; container-type: inline-size` — stretch,
  because a size container never takes its width from its content); the face `clamp(--knob-min, 62cqi, --knob-max)` with `aspect-ratio: 1`;
  the needle (38 %) and the base tick (47 %) are shares of the face; the route ring's viewBox scales; the finger stays the dial's ::before
  outset (≥ 52 × 44 px at the 28-px face). `.sw .trig .ro .segw .seg select.sel` stretch (`.sw`/`.trig` centre their words, overflow hidden),
  `.seg`/`.segw`/`.wide` span two, `.full` the line; `data-knob="sm"` caps the face at `--knob`, `"lg"` floors it there.
- `kit.js` `row(parent, { fit, cellMin, knob, cls })` (device().row(cls) untouched); tokens on `:root` in `css/tokens.css` and in tokens.json
  (semantic · space · length · skin): `--cell-min` 40px · `--knob-min` 28px · `--knob` 34px · `--knob-max` 44px · `--row-gap` 4px.
- Opt-in: a plain `.row` does not move. The starter's PICTURE row is `row(body, { fit: true })`; `gallery/controls.html` card FIT ROW (five knobs
  and a switch on one line of a 262-px body, faces 28); docs/CONTROLS.md "## A row fits"; LLM.md's kit.js line names `row`; CHANGELOG 2 lines.
- Kit tests: node 81/81 (version 3 sites, tokens schema 1395 rows, lint-tokens); browser on one Chromium (MIR_CDP_PORT 9690, kit on :9688):
  controls 62/62, kit-paint 24/24, intent 36/36, starter 25/25 — after each kit commit.
- Adopted (`adopt.mjs`, 265 files in step), pinned `'1.5.6-alpha.6': f0189191…` in tests/mir-manifest.test.mjs; CLAUDE.md line 14 and
  docs/laws/kit.md read 1.5.6-alpha.6; docs/FOR-MIR.md "BUILT 1.5.6-alpha.6 · THE FIT ROW".
- **Bundle: `.tmp/kit-1.5.6-alpha.6.bundle`** in this worktree (kit-1.5.5 @ 6a8cd78 + v1.5.5; verified) — for Josh to fetch into ~/Documents/MIR.

## F2 THE TWELVE WINDOWS (app)
Rows on `.row.fit` (the class in the builder): SETTINGS (stage seat · STAGE · GAMMA; QUALITY's DITHER · STRENGTH; DOMAIN AUTO · WIDTH), PALETTE
(PALETTE · RESET · REVERSE), WAVE (wave-row-2 the six dials; wave-row-7/8 ESP), CAMERA (`.cam-verbs` ×2 and `.cam-handrow` get `row fit` after the
panel builds), CLIP (ON · CLIP|SLAB · POS · THICK), SPECTRUM's Hamiltonian rows (sp-ham-h/-s/-b/-a; GAS is -b), MOLECULES (reg-morph in
orbitalsview + statesview, statesview's ω/E/dur drive row, chemview's mol-mrow), INFORMATIONAL (its `row()` helper: all six hand grids, call 7),
FIELD (static row, DRIVES rotors, IMPULSE feel, SQUEEZE · CAT), EQUALIZER (AUDIO IN row, SOUND · LEVELS|BEATS), NODES (`.nodes-knobs`, body + foot).
λWAVES' block (skin.css end, "022 F2 · A ROW FITS"): `:root { --knob-max: 34px }` (a face never grows past the plain knob, so a fit row never adds
height), the fit gap over `.native-clean .row`'s 8 px, spans where a control needs more than a cell, `--cell-min` where labels or columns need it.

W measured: the card body's row is **252 px** at the 300-px rack (not 262). WAVE: 6 × 40 + 5 × 4 = 260 > 252, so the six dials stay 3 + 3
(`--cell-min: 72px`, every label whole); EXPOSURE in a 40-px cell would need the ellipsis (H2's law wins).

| window | height before → after | wraps before → after | what moved |
|---|---|---|---|
| SETTINGS · DISPLAY | 598 → 598 | 0 → 0 | STAGE · GAMMA cells 64 → 60 |
| SETTINGS · QUALITY | 897 → **842** | 1 → 0 | DITHER's seg and STRENGTH on one line (56-px cells) |
| PALETTE | 341 → 341 | 0 → 0 | — |
| WAVE | 462 → 458 | 3 → 3 | 3 + 3 by measure; 4 px less margin |
| WAVE · ESP (a molecule) | 663 → 652 | 3 → 3 | ESP stays three lines: 7 controls need 11 cells, 5 a line |
| CAMERA | 715 → 715 | 0 → 0 | AUTO-ROTATE spans two; DRAG · FRICTION · FLING 81-px cells |
| CLIP | 292 → 290 | 0 → 0 | five cells of 47; faces 34 → 29 |
| SPECTRUM (HYDROGEN) | 1479 → 1479 | 0 → 0 | three 79-px columns for both rows (017 R4 rhythm, auto-fill) |
| GAS (BOX) | 1400 → 1400 | 0 → 0 | five cells of 46; faces 29; BASIS seg ≤ 58 |
| INFORMATIONAL | 888 → **872** | 8 → 8 | a switch two cells, a knob one; the "wraps" are the 2-per-line grids |
| FIELD | 681 → **600** | 4 → 3 | IMPULSE's four dials 3 + 1 → one line; rotors keep 3 + 3 columns |
| EQUALIZER | 326 → 326 | 0 → 0 | faders untouched |
| MOLECULES | 798 → 794 | 0 → 0 | A ↔ B face 31 in 49 |
| NODES (LEVELS · INVERT) | 640 → 640 | 2 → 2 | 56-px cells: 3 + 2, OUT WHITE whole |
| CSB expanded | 568 → 568 | 3 → 3 | the exception, untouched |
No window taller. The 4-knob row (FIELD's IMPULSE) no longer wraps 3 + 1. Per-row numbers (lines · wrapped · height · width · face in cell):
`F-shots/before/rows.txt` · `F-shots/after/rows.txt` (`tools/row-fit.mjs`, 56 lines; the before re-run on an export of the F1 tree).
`tools/label-fit.mjs --favs` after: 147 + 109 labels, **0** need the ellipsis.

## Deleted
skin.css: `.native-clean .row > .k` 64 · observer `1 1 60` · camera 68 · `.lw-dither > .k` 64; CLIP's two grids (+ their two comments); FIELD's
`.native-rotors repeat(3)`; CAMERA's dead `.camera-motion` grid and the verbs' flex trio; INFORMATIONAL's `1fr 1fr 56` / `1fr 56 30` / `1fr 56` /
`1fr 56 56` / bonds / col templates and `.row > .k { justify-self: center }`. lab.css: the ham body's 52 / 56 (`repeat(3, 56px)`) / 46 / 52-vseg;
the mol-mrow nudge (`top: 11px` / `top: -6px`); `.reg-morph .k`. nodes.css: `.nodes-knobs` flex → `--cell-min: 56px`. `!important` count 31 (unchanged).

## Exceptions kept
CURVES; the camera sphere's knob column and the PAN pad; SPECTRUM's lanes (lab.css `.sp-row .k` 46/30) and their vertical phase/rate stacks
(STYLE-LOCK); the molecule shelf; the ramp (PALETTE's `mir-ramp-verbs`); the EQ grid and faders; NODES' plane; the CSB (`#transport .k` 58,
`.csb-tempo .k` 44, favourites 56); the phone's route-ring margins (skin.css 0.5.1 D10-F).

## Pictures
`research/iteration-022/F-shots/before/` and `after/`: one JPEG per window at the 300-px rack (settings, settings-q, palette, wave, wave-esp,
camera, clip, spectrum, gas, informational, field, equalizer, molecules, nodes, csb) + rows.txt / rows.json.

## Tests
`node tests/pwa.test.mjs --write && ./test.sh node` exit 0 (after F1 and F2); mir-manifest PASS; adopt --check in step; rack-deps HOLDS (persist
24/25); 0 app-side cycles; new-project --check in step. Browser (LW 9687 / GD 5687): window-switching, hide-reveal, routed-knob 7/7,
keyboard-window, curves, stage-text, field-law, register 23/23, chem 56/56 GREEN; tools/settings-probe GREEN (3 scenes), tools/csb-probe clean.
**RED AT BASE TOO**: camera-shift (PAN HOME, the same 1 failing — chain E re-aims) and official-defaults-palette (`aaHidden`: INFORMATIONAL's
LEAN Aa shows; re-run on an export of BASE 79c67a62 on port 9689: the same diff). THE LOCK `--check --query gastab=0`: 843 · 0 · 0 page errors.
LOCK leaves moved: none.

## For docs/laws/shell.md (the close)
A ROW FITS (022 F): a control row is the kit's `.row.fit` (`row(parent, { fit: true })`): auto-fit cells of `--cell-min`, the knob face scaled to
its cell between `--knob-min` and `--knob-max` (λWAVES caps it at 34 px, so a row never adds height), switches and segs stretch or span; a row
with long labels or meaningful columns sets its own `--cell-min` (a label stays whole); CURVES, the sphere and PAN pad, pictures (lanes, shelf,
ramp, EQ, NODES' plane) and the CSB are the exceptions; `tools/row-fit.mjs` prints every row's lines and the window heights.

## FOR 1.5.6 leftovers
- The kit's camera panel keeps its own `--cam-verb-min` / `--cam-cell` rows; λWAVES lays `.row.fit` over them — the panel could use `row({ fit })`.
- The ramp's verbs row (`mir-ramp-verbs`) and the lanes' knob columns are not fit rows (exceptions here; the kit may want a word on them).

## Open questions for Josh
1. Labels stay ABOVE the face (the kit's knob anatomy); "labels under the face" was read as "bounded by the cell, with the ellipsis". Keep?
2. λWAVES caps the face at 34 px (`--knob-max`); the kit's 44 would add up to 10 px per knob row (CLIP, SETTINGS' two dials). Keep the cap?
3. Dense rows draw smaller faces (CLIP and GAS 29, INFORMATIONAL's LIST CAP 29) — the law as written. Keep, or a 34-px floor (`knob: 'lg'`)?
4. WAVE's six dials stay 3 + 3 (252 < 260). Six on a line would take 38-px cells and the ellipsis on EXPOSURE. Keep 3 + 3?
