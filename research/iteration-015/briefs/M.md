# CHAIN M — THE MAIN MENU (branch it015-m, port 9591, GD 5291)

Rows, in this order: M1 THE HEAD → M6 THE HUE BUTTON → M2 THE LOOK EVERYWHERE → M3 ATOMIC MODE → M4 FOLDERS IN THE MENU → M5 THE SHELF SHOWS TWO.
PLAN.md's CHAIN M section is the spec; its "Where each item lives" has the picker.js lines.

Notes beside the plan:
- M1: the LOOK drop is a λWAVES pane (`.mm-lookdrop`), 2 × 3 tiles 72 px square, each tile = the glyph in STIX (`var(--font-math)`) over
  nothing (the word is the `title`/hint), centred under the LOOK button, `position: absolute` inside `#lwMenu` so it overlaps the decks; the
  Gol note's spring (research/iteration-014/GOL-NOTE.md §motion) and 120 ms close; reduced motion none. `role="radiogroup"`, arrows move.
- M2: `tools/menu-thumbs.mjs --style phase` = WAVE's PHASE observable (the HSV wheel) at the molecule's HOME pose / the atom's CORNER pose,
  the same matte road as the existing pictures. Render with the headed GPU road the tool already uses; the GPU is shared with the solvers —
  render in batches and re-run a blank. Commit the pictures with the row (≈ 12 MB; check `tests/pwa.test.mjs` still treats img/menu as DATA).
- M3: THE 140's order is `lab/hydrogen.js` BASIS (n ≤ 6's 91 first, then n = 7's 49); the state's name through the app's own label road
  (`lab/names.js` / `latex-state.js stateLatex` — read what SPECTRUM's picker prints and print the same in STIX). The press: MOLECULES off,
  SPECTRUM's system HYDROGEN (`ui.hamSeg`'s hydrogen id), then the one label populated as a hand's preset (`loadPreset` with a one-label
  preset object, `{ hand: true }`) — one history row, THE FADE says the label.
- M4: the gallery inside the Picker is the kit's `mountGallery` (see `lab/rack.js`'s `projects` card registration and `lab/projects.js`);
  size it to the page (columns like the molecular deck); the Picker's `.mm-page` scroll owns it. `landed` closes the Picker after an OPEN.
- M5: pack.mjs gets `--next <numeral>`; a scratch run on ONE molecule (`--raw <scratch>` as C1/C4 did — read research/iteration-014/C4-BUILD.md)
  proves the two-volume shelf; the browser proof serves a scratch `volumes/` (the gate server's root is your worktree; make a scratch
  `lab/volumes-test/` fixture and point `V.shelf` at it through the existing `?shelf=`/test hook if one exists, else a `LW_SHELF` query the
  Picker reads only for test drivers — keep it one line). Never write under dist/.
Tests: `tests/library.browser-test.mjs`, `tests/start.browser-test.mjs`, `tests/menubar.browser-test.mjs`, `tools/tile-check.mjs` (118 + the
140), `./test.sh node`, pwa --write.
