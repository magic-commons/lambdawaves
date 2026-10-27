# CHAIN R — THE RACK · build note (Opus builder, 2026-10-26; branch `it017-r` from `1399e25`; kit now 1.5.0-alpha.28)

Machine: R1–R3 ran under the c8 night run (niced, one browser); R4 ran once the coordinator said the CPU was quiet.
## R1 THE DIAMONDS (F4) — `b6bb922`
- Reproduced at 1600 × 1000, pill on B, a route on WAVE, in Firefox and Chromium (`R-shots/R1-before-*.jpg`): the mask opened FROM the
  tail, so at every reveal and hide the 8-px square turned 45° showed ALONE (a lone diamond), and 016 W8's routed dot sat right under it.
- Fix: ONLY A PILL (Josh: "it should only be a pill") — the tail (`.rack-pill::before`, an invention of 015 H1, not Josh's) is gone; the
  mask opens from the window's side over the pill alone (`inset(0 100% 0 0)` → `inset(0)`; right rack mirrored). Nothing can show before
  the reveal or after the linger. The routed dot moved INSIDE the title bar at the eyebrow's end (6 px, ACCENT B, drawn by the eyebrow's
  own padding + radial background so an ellipsis never cuts it; `routed-knob` K6 re-aimed). `R-shots/R1-after-*.jpg`.
## R2 NO INNER SCROLL IN A RACK WINDOW (F5) — `d198c91`, `7d9dc9a`
- One part, `lab/pager.js` `rackPager()`: the kit's page turner (`stepper({ pager })`, BASINS' rack-card pager, ‹ ›) round the Picker's
  page dots (`.mm-dot`, skin.css selectors widened to `.lw-pager`; past 16 pages a count, the Picker's rule). Hidden on one page.
- (a) MOLECULES' shelf: pages that fit the card (3 rows of a volume's pictured tiles, 4 of the others, columns read from the grid); only
  the page's tiles are made, so only its pictures are asked for (the IntersectionObserver as before); opens at the page holding the
  molecule/element on screen; a new section opens at its own. The ATOMS table and the catalogue sections page the same way.
  `.mol-shelf-vol { max-height: 340px; overflow-y: auto }` is gone. `R-shots/R2-shelf-pages.jpg`.
- (b) HISTORY: 12 rows a page (call 4), newest first, every ring change shows the current row's page, a turn holds until the next change.
  λWAVES' rack HISTORY is its OWN S4 list (`lab/shell/history.js`, one string, one listener), not the kit's `history-list.js` (that one
  serves only the kit's floating HISTORY window, not a rack window) — so the page size is the app's `HIST_PAGE = 12` and no kit `pageSize`
  was added (it would have no consumer). `lab.css .hist-list` lost its 250 px scroller (`overflow: visible` beats the kit sheet's auto).
  `R-shots/R2-history-pages.jpg`. `tests/history` 1b re-aimed (pages of 12, dots, clicks through pages; the card holds 13 → 26 rows).
- (c) FOLDERS docked (call 5: grows with its content up to a max, then PAGES; stage/FREE keeps its scroll): the card was already the kit's
  `mountGallery({ pageSize: 8 })`; kit `gallery.js` now pages sub-folders first, then projects (`revealEntry` counts them; a folders-only
  page hides the empty PROJECTS heading). The Picker's FOLDERS (also paged) pages its folders too.
- Remaining scrollers in rack windows (measured live, every card open): the ⓘ pop-over `.native-info-content` (a hover card, not the
  body) and docked FOLDERS' `.sv-explorer-scroll` (unbounded, never engages). The wide readouts and RENDER's log were handled in R4.
- Kept on purpose (`7d9dc9a`): HISTORY stays tracked by window activity (`canPresent(wHist)`, as since S4). Dropping it (its only other use
  was scrolling the current row into view) turned `tests/frame-occlusion`'s "detached window keeps the gap" row red: after a popOut the
  paused mask is re-read only because a tracked card's intersection flips. A latent dependency — the float's placement is not watched
  (`shell/ink.js` watches `#floats` childList only). For P/S: a direct dirty on popOut placement.
- `tests/library` row 1 re-aimed: the boot's demo cover (projects.js `keepData`, a DATA file) can land after the setup's cache delete and
  create `lw-data-v1`; the law it guards is that LOOKING keeps no RECORD, so it now asserts no `/library/` entry (green; was timing-red here).

## R3 routeDots (F6) — `529e068`
- Event-driven: a target's modulated flip (the registry notice), the modulation window's `apply` (drop/remove), LW.mod's edits
  (`facade.js modEdited`), the stamp — each asks `dotsSoon()` (one rAF); plus one idle look every ≥ 2 s (`requestIdleCallback`, 2 s
  timeout) for the roads that flip nothing (a route made with the power off, a restore). The key is O(1) (adds · removes · count · the
  stamp's generation); the document is read only when it moves. First paint and `force` kept.
- Measured (DONE-c8 absent, so console counts, not `main-thread.mjs`): `document.querySelectorAll('[data-param]')` calls in 30 s idle,
  Firefox headless — before 78 (≈ 156/min), after 2 (both at boot; 0/min idle). Dot on/off within 700 ms of LW.mod.route/unroute both ways.

## CALL 11 — `6c9cbcd`
- Kit `css/skin.css`: `.seg-b:disabled { pointer-events: auto; cursor: not-allowed }`, no hover/press face (an `.on` face kept); the
  browser itself refuses a disabled button's click. Checked: BALLS · STICKS · ESP · CONVERT · VIVID · MATTE (greyed) take the pointer and
  carry their hint.

## R4 THE LAYOUT POLISH (after the coordinator's go, CPU quiet; merged `ab5a97f` first)
- HAMILTONIAN (Josh's `refs/hamiltonian-misaligned.png`): HYDROGEN's two rows are one grid, three 56-px columns, 6-px gaps, centred as
  a block. Z · μ/mₑ · mass seg and SCALE · λ SCALE now share columns (x 33 · 95 · 157 in both rows), and every seg top is on the dial
  line (105/105, 186/186; it was 91 vs 105). The fold chevron was already where FIELD's IMPULSE has its fold, so it is unchanged. W3's note row
  is a flex row: the words, then OPEN at the end on their centre line. `R-shots/R4-hamiltonian-{before,after}.jpg`.
- ONE knob-sized seg rule: `.dev .sp-vseg` (was SPECTRUM-scoped); EMISSION's RANGE wears it (`sp-vseg em-vseg`, its copy of the rules
  dropped). An unlabelled one keeps the label's line empty (`::before`, `--vseg-lbl` 12 px) so its top sits on the dials' line; beside a
  stepper (EMISSION) it has no such line. WAVE's ESP row, FIELD and BALL AND STICK hold no vertical seg (knobs + a switch), so nothing changed there.
- Tour (all 31 rack windows at 1600 × 1000, the right rack and MOLECULES · SPECTRUM on the phone), fixed what was plainly out of place:
  MO-REGISTRY's "no molecule solved…" canvas line ran past both edges → it wraps to the plot (`orbitalsview.js`); the docked FOLDERS card
  kept the kit's whole-page height for one project (724 → 397 px) and showed PAGE 1 / 1 → it grows with its tiles (call 5) and a single
  page has no pager (`lab.css`, app-side, the kit's steady pager kept for BASINS/the Picker). `R-shots/R4-folders-render-after.jpg`.
- Call 14: RENDER's self-test printout is no longer a scroller. It shows its last six lines, and a fold above them opens the earlier
  ones (`film-card.js`, app-side over the kit's `controls.lines`). The wide readouts are clamped to two lines in rack windows (`overflow: hidden`).
- Left as is: SPECTRUM's grid and ATOMS' table run long but are the registers themselves; METERS reads empty until the clock runs.
## Tests (niced, one browser at a time)
node: `rack-deps` · `mir-manifest` (alpha.28) · `new-project` · `history` 18/18; `rack-deps --classes --no-write` exit 0 (no new `app` key;
the dead `app.state.histShown` slot removed); `new-project --check` in step. browser: `routed-knob` 7/7 · `history` · `molecule-head` ·
`library` · `window-switching` · `frame-occlusion` · `register` 23/23 (R4 re-ran window-switching · frame-occlusion · register). THE LOCK: no
shader, no `field.js`; no leaf moved.

## FOR-MIR lines written (top of `docs/FOR-MIR.md`, heading 1.5.0-alpha.28)
ONLY A PILL (`shell/rack.css`) · A PAGED GALLERY PAGES ITS FOLDERS TOO (`folders/gallery.js`, `folders.css`) · A DISABLED SEG BUTTON
KEEPS ITS HINT (`css/skin.css`).

## CLAUDE.md sentence to add (after the 016 W8 `routeDots` mention)
"No rack window scrolls inside (017 R2): a long list turns pages under `lab/pager.js` (the kit's page turner round the Picker's dots) —
MOLECULES' shelf, HISTORY 12 a page, and the docked FOLDERS card through the kit gallery's `pageSize` (folders, then projects); the
scroll pill is only a pill (no tail) and the routed ACCENT B dot sits inside the title bar at the eyebrow's end; `routeDots` runs on
events with one idle look every ≥ 2 s."
## Questions for Josh
- The pill's tail is gone entirely (your "only a pill"); say if you want a pointer back in some other form.
