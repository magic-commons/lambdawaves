# D3 MOLECULES (iteration 014, chain D)

**What.** Josh: "Increase the height of the paint-able table thingy in molecules window by about 50% more. Remove the molecule picker and
library picker and replace it with the new Main Menu picker system on the CSB instead."
- THE REGISTER's ladders are half again as tall, in the card only (`.mol-reg`): ORBITAL's canvas 150 → 225 px, STATES' ladder and its
  scope 170 → 255 px. Both canvases size their backing store from `clientWidth/Height` each paint, so no JS changed; the hit test reads the
  same box (`orbitalsview.js` l.544's scale), so the paint gesture follows.
- The chooser left the card at A1 (the CONTROL SURFACE moves `.mol-pick` into its buttons row), leaving its row `r0` an empty
  `.row.tight` with its margin — a dead seat between the SECTION stepper and BASIS. It now carries `mol-r0` and folds away while empty
  (`.mol-r0:empty { display: none }`); the ‹ SECTION › stepper stays (A1: the chooser walks the section the card turns). The library
  picker (the volumes) already lives in the Picker / the CSB's SEARCH; nothing else on the card was a seat for it.

**Files.** `lab/lab.css` (three rules beside `.mol-reg`), `lab/chemview.js` (the row's class, one line), `lab/sw.js` (pwa --write),
`tools/d-shots.mjs` (scene `register`).

**Measured** (`node tools/d-shots.mjs register`, water, the card floated 340 px): the ORBITAL ladder's client height 223 px (225 with its
border), `.mol-r0` has 0 children and `display: none`. Shot: `d-shots/D3-register.jpg`.

**Tests.** `./test.sh node` (end of chain); `pwa --write`.

**CLAUDE.md sentence.** THE REGISTER's ladders are 50 % taller on the card (iteration 014 D3: ORBITAL 225 px, STATES' ladder and scope
255 px, `lab.css` `.mol-reg`), and the chooser's emptied row (`.mol-r0`) folds away now the CONTROL SURFACE holds the chooser.

**Calls for Josh.** At phone width the taller ladder costs 75 px of the card; say if the phone should keep the old height.
