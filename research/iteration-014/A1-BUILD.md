# A1 CSB, THE BAR — built (builder A-bar, 2026-10-22)

## What changed
- Kit: a new layout, `CONTROL_SURFACE_LAYOUT` (`data-layout="csb"`). The bar has two rows in a column, so it is as wide as its WIDER row
  (a wrapping row would add the two rows together). Each row is 0.7 × the bar height; the bar is 1.5 × (69 px).
  - Row 1, the clock: play · power · ⏮ · app:scrub · app:time · app:rate · BPM pill · latches · app:gear · dock · door.
  - Row 2, the app: app:modes · app:chooser · app:search · app:add · app:rack · app:fav. Missing nodes are left out.
  - `named(name, list, { title })` names the dock window (CONTROL SURFACE).
  - `gui.js` `aboutPage(host)` lends MIR ABOUT's page to the app; the MIR ABOUT window takes it back when opened.
- `lab/shell/transport.js` builds on that layout.
  - Row 1: play · MOD · ⏮ · SCRUB (120) · t (64) · RATE · pill (72) · TIMELINE latch (the kit's `latch`, glyph `lanes`, toggles
    `app.state.tl`) · gear (the kit's `barButton`, glyph `settings`, opens `mirGui().open('options')`) · dock · door.
  - Row 2: `#lwMode`, moved in from beside the title (LIBRARY · MOLECULAR · HYDROGEN); MOLECULES' `.mol-pick` stepper, moved out of the
    card; then `#rackAdd` `#rackToggle` `#rackFav`, the same elements. The kit rack still adopts them by id, and the + and ☆ lists now open
    beside their button wherever the bar sits.
  - ‹ › ⟳, REPEATS (with its label) and the live formula are the expander's first row, `.csb-repeats` (call 1's assumption).
- Bar at 1920: 534 × 72 against the old 640 × 46.
- The GUI menu left the menubar (FILE EDIT VIEW WINDOW ABOUT). The key rows `gui` / `guiAbout` were not touched.
- ABOUT has two pages, λWAVES | MIR, through a seg on the about face. The MIR page is MIR ABOUT's page (`aboutPage`).
- Label renames only: the card eyebrow and rack title are CONTROL SURFACE (id `transport`); the `dock` key row and the WINDOW row now
  say "the control surface".
- `lab/lab.css` has one block, "THE CONTROL SURFACE". It beats λWAVES' own one-row rules (the box, its 46 px, its `order`s), seats
  row 2's absolutely-placed nodes in the bar's flow, and keeps + ☆ visible inside the bar under `rack-hidden`. In HYDROGEN mode it hides
  the chooser (row 1 stays the wider row, so the bar's width holds). Docked, the rows wrap and the chooser takes its own line.
  skin.css was not touched (its foot is A-side's).
- Tests re-aimed, no law deleted: chem, library, register and molecule-head now read `#transport .mol-pick`
  (was `.dev[data-id="chem"] .mol-pick`).

## Tests
- `./test.sh node` green.
- rack-deps green (transport 11, notebook 23, HINGE holds).
- Green browser suites: menubar · history · new-project · frame-occlusion · keyboard-window · timeline · lw-links · molecule-head ·
  register · library.
- chem: 55/56. The red is L7, glycine's solve time under the three PySCF solvers' CPU load (a timing gate the brief says not to
  believe under load). It was re-run alone; see the report.
- MIR manifest re-pinned. `pwa --write` run.

## Shots
`a-shots/A1-csb.jpg` (the stage), `A1-csb-open.jpg` (expander), `A1-docked.jpg`, `A1-about-mir.jpg`.

## CLAUDE.md sentence
"THE CONTROL SURFACE (iteration 014 A1): the transport is the kit's CONTROL_SURFACE_LAYOUT — row 1 play · MOD · ⏮ · SCRUB · t · RATE · BPM
· TIMELINE · ⚙ (MIR OPTIONS; the GUI menu is gone) · dock · door, row 2 #lwMode · MOLECULES' ‹ MOLECULE › · + ◧ ☆; REPEATS, its formula, ⟳ and
‹ › in the expander's first row; the card reads CONTROL SURFACE (id `transport`); ABOUT's second page is MIR ABOUT's."

## Questions for Josh
1. The door (modulation window) and the TIMELINE latch both sit on row 1. The plan's width sum left the door out.
2. ‹ › moved to the expander with ⟳. The ← → keys still step.
3. The MOLECULE chooser still walks the SECTION page the card's ‹ SECTION › turns. A2's search reaches the whole catalogue.
