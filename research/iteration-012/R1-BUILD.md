# R1 · INFORMATIONAL — build report (iteration 012, branch `it012-rack`, after B1)

## What changed
- **STATUS → the title bar's Aa** (`lab/informational.js`): the STATUS switch row is gone; an `Aa` button (`.dev-lean.info-aa`, MOLECULES'
  look) sits first in INFORMATIONAL's `.dev-util` and flips the record's `status` key (unchanged). Struck through (pressed) = the readout
  hidden, as MOLECULES' Aa is when its notes are hidden; first run: hidden, as before. `lab/lab.css` :410 keeps it visible under window
  notes OFF (it is a switch, not a note toggle).
- **Headings hidden**: THE WORDS' group label is removed; the fold line's words ANNOUNCE · CURSOR · MARKS are gone — the chevron alone, right-aligned.
- **SKELETON → BALL AND STICK** (label only; the key `skeleton`, `ui.skeletonSw` and every saved record unchanged). Its switch now takes one
  column (shorter), with a new **OPACITY** knob (`skeletonOpacity`, 10–100 %, default 100 % = the picture before) between it and SIZE.
  `lab/skeleton.js` `draw(…, size, opacity, sticks)` scales the beads' and bonds' alpha by it.
- **The weird arrow, named: THE DIPOLE ARROW** — `lab/skeleton.js` drew the molecule's dipole moment (a.u.) from the centre of nuclear charge,
  2 bohr per a.u., in the accent colour, whenever SKELETON was on. It is now **MARKS › DIPOLE** (`dipole`, a PREFERENCE, **off by default**),
  independent of BALL AND STICK (rack.js' frame passes the atoms for either and draws the beads/bonds only with BALL AND STICK).
  Screenshot: `r-shots/r1-ball-and-stick-dipole.png` (water: the teal arrow under O).
- **ORBITAL DIAL + REGISTRY ADDS → one switch, ORBITALS** (`KINDS` in `lab/shell/stage-words.js`: the `orbital` kind reads `sayRegistry`;
  a stored `sayOrbital` is simply never read). The announce grid is now 7 switches + the pop-ups' SIZE in the last cell, where STYLE · PALETTE was.
- **CURSOR and MARKS** are two columns of switches side by side (`.info-cols`, `.info-col`): PARALLAX · DRIFT | BEAD · UNCERTAINTY · DIPOLE.
- **AWAY → PARALLAX** (label only; the key `cursorAway` stays).
- **The formula–name gap** (`lab/lab.css` stage block): the name paragraph's margin-top .15em → −.25em, line-height 1.1.
- `tests/stage-text.browser-test.mjs` t4: INFORMATIONAL's dial count 6 → 7 (OPACITY), message updated.
- `research/iteration-012/r-shots/shot.mjs`: Vulkan off by default — with `--enable-features=Vulkan` this box's 2D canvases (the skeleton,
  kepler) paint nothing and `getImageData` reads zeros (measured: 0 vs 7 895 painted px). WebGPU's field renders either way.

## Files
`lab/informational.js`, `lab/shell/stage-words.js`, `lab/skeleton.js`, `lab/rack.js` (the one frame line), `lab/skin.css`, `lab/lab.css`,
`lab/sw.js` (pwa --write), `tests/stage-text.browser-test.mjs`. SKELETON's rows are not in `lab/windows/molecules.js` at this base (they moved
to INFO_ROWS in iteration 011 Q1); `lab/window-chrome.js` untouched (its LEAN pass already skips INFORMATIONAL — the Aa is built in the card).

## Tests
- `tests/stage-text.browser-test.mjs` GREEN (§3 already aims at `.dev[data-id="chem"] .reg-pane .reg-bar select.sel` at this base — green, no re-aim needed)
- `tests/molecule-head.browser-test.mjs` GREEN · `./test.sh node` exit 0 · `node tools/rack-deps.mjs --classes --no-write` HINGE holds (spectrum 25/25)
- Shots: `r-shots/r1-before.png`, `r1-informational.png`, `r1-ball-and-stick-dipole.png`

## CLAUDE.md sentence for Yan (the THE STAGE FORMULA paragraph)
Since iteration 012 R1 INFORMATIONAL's STATUS is the title bar's Aa (struck = hidden; the record's `status`), its headings THE WORDS and
ANNOUNCE · CURSOR · MARKS are hidden, SKELETON reads BALL AND STICK (key `skeleton`) with OPACITY (`skeletonOpacity`) between it and SIZE,
the dipole arrow it drew is MARKS › DIPOLE (`dipole`, off by default), ORBITALS is one switch for the `registry` and `orbital` kinds
(`sayRegistry`), CURSOR (PARALLAX = `cursorAway` · DRIFT) and MARKS (BEAD · UNCERTAINTY · DIPOLE) are two columns.

## Open for Josh
1. DIPOLE ships OFF (it was on whenever SKELETON was). Say if it should default ON.
2. The merged switch is labelled ORBITALS (the dial's landing and the register's adds). A different word is one string.
