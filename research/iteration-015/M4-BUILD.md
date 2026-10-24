# M4 FOLDERS IN THE MENU — built (chain M, iteration 015, 2026-10-24)

## What
- Josh: "Have a main menu, full screen mode of the folder. This way, hitting folder does not take it to the stage. (This is it's new 3rd view)".
- FOLDERS (the Picker's second round button, `data-nav="folders"`) shows THE THIRD VIEW: `.mm-folders`, in the decks' own grid seat, with the
  scroller and the caption put away.
  - It holds the kit's gallery, mounted with `folders.mountGallery`, exactly as the `projects` rack card mounts it. It is a second live view of
    FOLDERS' one library, with its own prefs key `pickerGallery`.
  - It is sized to the page at its first showing. The columns follow the decks (≈ 210 px each, 2 … 8, a rack's width + 20 px clear each side on
    a desktop). The rows come from the height (`--fcols`, `--sv-page-rows`, pageSize = cols × rows).
  - It has the toolbar SAVE · PROJECT · DUPLICATE · NEW and RESTORE THE DEMOS in the foot (`factory: restoreDemos`). DEMOS comes first while
    ROOT holds nothing of the reader's (`demosFirst`), and the gallery is painted again at every showing.
- The Picker stays up. FOLDERS is lit while the page is shown, and a second press or any tab returns to the decks. Closing the Picker puts the
  decks back for the next open. SHOW LABELS / the volume search stand aside on this page.
- An OPEN the gallery's adapter took closes the Picker: `projects.js` `onOpened` now calls `cover()` beside `folders.close()` under `landed`.
  The facade's telling still never closes anything.
- O, WINDOW › FOLDERS, the notebook's ▤ and the FOLDERS rack card keep the floating window, unchanged.
- The Picker's blanket resets (`#lwMenu *` no border, outline or shadow; `#lwMenu button` no background) now skip `.mm-folders` through
  `:where(:not(…))`, which adds no specificity. The kit's gallery keeps its own look, and the Picker's own rules keep winning over the reset.

## Files
`lab/picker.js` (`showFolders` / `showDecks`, the nav button), `lab/projects.js` (one `cover()`), `lab/skin.css` (`.mm-folders`, `.mm-fgal`,
the scoped resets), `tools/m-shots.mjs` (`folders`).

## Tests
- `.tmp/m4-open.mjs` (driver): FOLDERS shows the page with the floating window never opened. The toolbar reads SAVE · PROJECT · DUPLICATE · NEW
  and the foot RESTORE THE DEMOS. Opening WAVE DANCER PROTOTYPE (a second press, then OPEN WITHOUT SAVING) gives the Picker closed and status
  "opened DEMOS/WAVE DANCER PROTOTYPE". No console error.
- `start` GREEN 3/3 · `library` GREEN · `molecule-demos` GREEN.
- Shot `m-shots/M4-folders.jpg`.

## CLAUDE.md sentence
"FOLDERS IN THE MENU (iteration 015 M4): the Picker's FOLDERS button shows its THIRD VIEW, `.mm-folders`. It is the kit's gallery mounted in the
decks' seat (`mountGallery`, prefs `pickerGallery`, sized to the page) with DEMOS first, the toolbar and RESTORE THE DEMOS. An OPEN it took closes
the Picker (`landed` → `cover()`). O, WINDOW › FOLDERS and the rack card keep the floating window."
