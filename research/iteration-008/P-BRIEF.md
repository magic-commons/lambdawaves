# P · THE PICKER AND THE SMALL CUTS (iteration 008, branch `it008-picker`, gate server 9671 / GD 5671)

Josh (JOSH-PROMPT.md): "For the library section in the main menu, it needs to be less of the stuff on top (the tags, volume, search and
such to be much tighter) and more molecules shown per page, at least 1 more row. Also main menu bottom text is quite buggy when hovering
over different items very quickly. … Atoms should not be in the molecules window and should be in the atoms window. … Another mystery is
the ellipsoid button on the informational. … the title of the name of the molecule should be centered, not aligned left to the formula on
the informational."

Read first: CLAUDE.md's THE PICKER paragraph, `lab/picker.js` (the three decks; the LIBRARY deck's head rows — volume, tags, search —
around :190–:290; `say()` and `swapLine` from `lab/picker-fx.js` — "R6's swap stacks the old and new lines"; `tile()`; `goAtom`,
`goMolecule`, `goVolume`), `lab/picker-fx.js`, `lab/skin.css` §`#lwMenu`, `lab/shell/stage-words.js` (the block's markdown: the formula
and the name), `lab/informational.js` (MARKS: SKELETON · BEAD · ELLIPSOID, :40–:46), `lab/chemview.js` (`openVolume`; a volume molecule
on screen), `../iteration-007/I-BUILD.md`.

## Build
1. **LIBRARY deck, tighter.** The volume name, its bytes and state, the tags and the search share ONE compact row (the kit's seg for the
   tags, a small field for the search, the volume's stepper ‹ VOL. I › at the left, INSTALL / OPEN FILE… / the ring at the right); the
   grid below gains at least one more row on a desktop (the tile from the height AS the deck rule says: re-measure `per` with the new head)
   and keeps ≥ 8 across; phone width still works.
2. **The caption under fast hovers.** `say()` swaps a line per hover; sweeping across tiles quickly stacks several exits and the foot
   stutters or shows two names. Make it one line in flight: a new call cancels the pending exit (or the swap takes the newest only after
   the previous settled, 120 ms), `aria-live` still polite; prove it with a 20-tile sweep in 400 ms (no two `.mm-cap-n` at once, the last
   name standing).
3. **The section install moves here.** MOLECULES' INSTALLED (every record of a section on this device) becomes the MOLECULAR deck's: each
   section's heading carries the install lamp and press with the ring (`V.install`-style, the records' road), so row U can drop it from
   the card; `__LW.chem.section().sub` keeps the record line.
4. **One-atom entries route to the ATOMS road.** VOL. I carries six one-atom molecules (Fe · Kr · Zn · Cr · Ni · Ti — PubChem compounds);
   in the LIBRARY deck a tile whose molecule has one atom opens `goAtom(Z)` (ATOMS mode, the element) instead of `goVolume`, and the
   MOLECULAR deck never lists one; say in the build note that `tools/volumes/pack.mjs` / `themes.json` should exclude them at the next pack
   (tools are row V's, not yours).
5. **The stage block.** The molecule's NAME line is centred under the formula (the block's markdown or its CSS in `lab.css`; the formula
   stays where it is; THE FADE's and THE HEAD's layouts unchanged).
6. **ELLIPSOID → UNCERTAINTY** (the switch's label; its title already says what it is: the position covariance's principal circles); the
   blob key `ellipsoid` unchanged.

## Light check
Screenshots of the LIBRARY deck before and after (count the rows), the MOLECULAR deck's section install, the caption after a sweep, the
stage block with a long name; an Iron tile opening the ATOM. `./test.sh node`, `menubar`, `stage-text`, `molecule-head`, `start`. Report:
worktree · branch · commits · tests · blockers · next.
