# V · THE LIBRARY ROAD (iteration 008, branch `it008-library`, gate server 9611 / GD 5611; from U's merge)

Josh (JOSH-PROMPT.md): "We need a better system for the 'Install' button … because we have a new volume (Vol. I), we should upgrade the
molecules picker and selector thing to make it much more elegant and feel satisfying for a user to load up a downloaded library."

Read first: CLAUDE.md's THE VOLUMES paragraph (THE SHELF, `volumes.js` `shelf · index · statusOf · install · remove · file · picture`,
`installFile`, the Picker's LIBRARY deck installs with one press and its ring; `chemview.openVolume(volId, molId, basis)`; the BASIS seg
as the ladder; `instruments.chem.volume`; a project naming a volume the device lacks keeps the catalogue molecule), `U-BUILD.md` (the one
card as U left it: the ON row, the ladder, the steppers), `../iteration-007/M-BUILD.md`, `lab/chemview.js` (the SECTION stepper — the
library's page turner over `lab/molecules.js` SECTIONS — and the MOLECULE stepper whose name IS the `<select>`), `lab/volumes.js`,
`tools/volumes/themes.json` and `pack.mjs` (the themes and tags a volume carries), `~/Documents/LAMBDAWAVES-VOLUMES/dist/vol-1/index.json`
(2,815 molecules: id · name · formula · formulaM · pg · heavy · mw · rungs · tags; `t/<id>.webp` pictures, being rendered tonight).

## Build
1. **A downloaded volume is a shelf of sections.** The SECTION stepper's pages gain the installed volumes' themes and tags after the
   catalogue's six (‹ VOL. I · MEDICINE ›, ‹ VOL. I · THE CLASSICS › …; a volume with no theme is one page); the MOLECULE stepper's `<select>`
   lists that page's molecules (optgroups by tag where it helps; the native keys kept; ‹ › and ← → walk the page).
2. **The row feels like a library.** The MOLECULE stepper's name row carries the molecule's small picture (`V.picture` → `t/<id>.webp`,
   the kit's thumbnail seat, lazy) and its formula; a molecule not yet on the device shows the kit's download glyph in place of the picture
   and a press installs THAT molecule in place with the ring (per-molecule, the fetch road's keys; `statusOf` says partial); the whole
   volume's install stays the Picker's. The ring and the glyph are kit parts, not new CSS.
3. **INSTALLED leaves the card** (row P moved the section-wide install into the Picker's MOLECULAR deck) — the row and its lamp go; the
   catalogue's record-only molecules keep their DOWNLOAD state through the same per-molecule press.
4. **One-atom entries are not molecules.** VOL. I's Fe · Kr · Zn · Cr · Ni · Ti never appear in the card's pages (they open from the Picker's
   ATOMIC deck); `tools/volumes/pack.mjs` (or `themes.json`'s rule) excludes a one-atom entry at the next pack and says so in the build note
   (tools only; do not re-pack tonight — the solvers hold the machine).
5. A project naming a volume molecule reopens through `openVolume` as before; the page is never saved; `chem.row()` unchanged.

## Light check
Screenshots of the stepper on a volume page with pictures and a download glyph; the walk: a volume molecule picked → its rungs on the
BASIS seg → one not-on-device molecule installed in place with the ring → REMOVE from the Picker → the card says so. `./test.sh node`,
rack-deps, `chem`, `molecule-head`, `new-project`. Report: worktree · branch · commits · tests · blockers · next.
