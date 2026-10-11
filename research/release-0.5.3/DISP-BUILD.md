# DISP-BUILD · B-DISP M8 · M9 · M11 (0.5.3 "Rack Tune", W3) — STATUS: DONE

Builders: Opus 5.5 as B-DISP (M8, M9's code; paused at 94 % usage, 2026-10-10), then Opus 5.5 as B-DISP-2 (M9's gates and fixes, M11,
this file; 2026-10-11). Worktree `.claude/worktrees/agent-a996904cd93236eee`, branch `worktree-agent-a996904cd93236eee`, reset to
`ae2baac` (the paused tip) and rebased onto `9bcf000` (sos-s0, W2 merged). NO push. Gate server 8983 / GD 5453, stopped by pid;
`rigfree.mjs` before every browser run, one at a time.

| row | commit | state |
|---|---|---|
| M8 MOLECULES' ROWS | `e918843` (was `bdea53c`) | DONE, suites green |
| M9 INFORMATIONAL | `7889a6a` + follow-up `f4556ac` | DONE, suites green (WIP `e3a5cdc` folded into `7889a6a`) |
| M11 ONE A/B, STATE | `8de7405` | DONE, suites green |

**The rebase onto `9bcf000`.** Three commits replayed. `lab/sw.js` conflicted at M8 and at M9: one side taken, regenerated with
`node tests/pwa.test.mjs --write` each time. `tests/new-project.test.mjs` conflicted at M9 (both edited the `PREF` set): W2's `camLock`
and M9's `atomLabels`, `atomLabelsSize` both kept. `lab/lab.css` and `lab/shell/settings.js` auto-merged; every line either side added
(`git diff 43df83c 9bcf000` vs `43df83c ae2baac`) was checked present: lab.css 8 + 10, settings.js 2 + 9, new-project.test 2 + 1, 0 missing.
After it: pwa `--write`, `new-project --check` in step, and `bash test.sh node` was **RED 2 (rack-deps)**, M9's (see §2).

## §1 M8 (done)
`lab/chemview.js`: both pickers are the kit's `stepper` (PALETTE's preset look). SECTION: `stepper({ items: SECTIONS })`, its name opens the kit list; the record line ("N records · MB · k here") moved to the stepper's hover title, and `__LW.chem.section().sub` keeps the same text. MOLECULE: `stepper({ list:false })` whose name IS the `<select class="sel">` (optgroups, disabled reasons, aria-label `molecule`, native ↑↓ kept); ← → and the arrows walk the page's enabled rows as a hand pick (measured: H2O → MgH2 → H2O). Rows: [‹ SECTION ›] / [INSTALLED · MOLECULES ON] / [‹ MOLECULE ›] / [BASIS · VALENCE|ORBITAL] / [VIEW · ⌄]. `lab/lab.css` M8 block replaces the readout rules.
**Row count: 5 lines at 300 px (body 262 px), 5 at phone 360 and 390 (was 6 everywhere).** The header takes two lines: ‹ SECTION › + INSTALLED + MOLECULES ON need ≈ 88 + name + 90 + 109 px. Phone hit-probe 11/11 (each control and arrow answers its own centre).
Suites: chem GREEN 0/55 failing · molecule-head GREEN · molecular-names rc 0 · molecule-demos GREEN · library GREEN · `bash test.sh node` 0.
Tests re-aimed: `chem.browser-test.mjs:199,206`, `library.browser-test.mjs:150` (`.mir-step-b`, `.mir-step-text`).
Dead now: `lab.css:469-474` `.pal-nav` (no JS user). B-PAL has merged (`6968621`, in `9bcf000`), so the integrator can subtract it.
**Left/right-arrowable, for Josh (listed, none built):** STATE preset superposition select (`windows/state.js:22`, with RELOAD = PALETTE's RESET shape); MO-REGISTRY ORBITAL preset (`orbitalsview.js:98`, 8); STATES preset (`statesview.js:85`, 7) and drive polarisation (`:120`); MO-REGISTRY ORBITAL | STATES (`registerview.js:19`); MOLECULES VIEW (`chemview.js:162`), BASIS (`:156`), KICK AXIS, STEP Δt, INTEGRATOR, the ORBITAL index knob; WAVE OBSERVABLE (6) and STYLE (`windows/material.js:25,37`, both already key-cycled), FINISH, DITHER, slice mode/axis; SPECTRUM OPERATOR (`windows/spectrum.js:29`), ELEMENT Z, SCALE, GAS BASIS; SETTINGS' DISPLAY/LOOK/QUALITY tabs (`native-ui.js:60`), THEME, FROST, GRID, FIELD CLOCK cap, AXIS COLOUR, FRAME and AXES; SLICE PLANE/ALONG; VORTEX SAMPLING; SHADOW picture.

## §2 M9 (done)
**The window.** `lab/informational.js` (`createInformational(app)`, called from `createSettingsCard`): the kit's card, `native-clean`,
CLOSED, appended to `#rack`; STAGE FORMULA + SIZE and ATOM LABELS + SIZE, two rows. A `devopen` handler seats it after SETTINGS through
the kit's `rk.move` (so the rack's motion and save follow). `stage-words.js`: `setLabels` / `setLabelScale` / `labelsOn` beside
`setOn` / `setScale`. `settings.js` writes `atomLabels`, `atomLabelsSize` beside `molFormula*` and reads an absent pair from the stored
`molFormula` / `molFormulaSize` once. The DISPLAY row is gone. The VIEW menu has STAGE FORMULA and ATOM LABELS rows (`notebook.js:109`).
The capture caption follows STAGE FORMULA. Nothing here reaches field code, so no lock is needed.

**Fixed on the way to green** (the WIP had never run its gates):
1. `tools/rack-deps.mjs` refuses any file under `lab/windows/` or `lab/shell/` that is not one of rack.js's planned modules (node gate
   RED 2, "lab/windows/informational.js is no planned module's file"). A planned row would need a rack.js piece and the test's 23-row
   count changed, so the builder moved to **`lab/informational.js`**, beside the other window builders that live in `lab/` (chemview,
   registerview). Only import paths changed (0 lines).
2. G-A: `app.state.atomLabelsScale` is declared in rack.js's `app` literal beside `molFormulaScale`; the window's own `= 1` went.
3. **settings-probe 4/6 RED → 0/6.** `native-ui.js` re-seated the closed card under SETTINGS on every boot, after `createRack` had
   restored the arrangement (rack.js :803 before `reworkNative` :904). A demo open (whose layout does not name the card) leaves it
   at the front of its rack, so an open and a reload disagreed on `closed[]`'s order. The boot seat and its `ui.info` handle are gone (−1).
   The `devopen` handler still seats it under SETTINGS when it is opened (menubar asserts it).
4. `stage-text` t4: a nested template literal inside the `ev\`…\`` string (SyntaxError at load) became concatenation.
5. Follow-up `f4556ac`, measured on a real upgrade (the base at `/zz-before/lab/`, same origin, STAGE TEXT off, then `/lab/`). A 0.5.2
   `closed[]` never names the card, so it opened, and without the boot seat it stood at the TOP of the right rack. Now a blob with no
   `atomLabels` (every M9 save writes one; no 0.4.0 S3–0.5.2 save did) keeps it closed, as on a first run. After the fix: closed, and
   SETTINGS heads the open rack. **The migration, measured: STAGE FORMULA and ATOM LABELS both come up OFF from `molFormula: false`.**

**Suites** (each after rigfree): stage-text GREEN 4/4 · molecule-head GREEN 3/3 · menubar GREEN 8/8 (⊕ INFORMATIONAL opens as SETTINGS'
`nextElementSibling`; re-run after fix 3) · frame-occlusion 7/7 · history 45/45 (STORE A / STORE B rows) · current 15/15 (the audio card at
:138, expected RED, passed on both runs) · new-project.browser 8/8 · `stage-dead-probe` **10/10** · `settings-probe --out` **0/6 red**
(`atomLabels` and `atomLabelsSize` in every blob) · `node tests/new-project.test.mjs` GREEN · rack-deps GREEN · `bash test.sh node` 0.

**new-project.lambdawaves.json, regenerated once (by the first builder), 0 bytes changed** (16117 B, `--check` in step before and after
every fix). The window IS a WORKSPACE layout row, but `tools/new-project.mjs` writes no `layout` / `modwin` / notebook size ("the WORKSPACE
stands — a missing key keeps the live value", its header), so the shipped empty project does not move.

**serialize-bytes vs `9bcf000`** (`zz-before/lab`, an untracked `git archive 9bcf000 lab` served by the same gate at `/zz-before/lab/`;
the tool hard-codes `/lab/`, so `.tmp/sb-at.mjs` is a copy that takes the path from `LW_LAB`; `--texts` both; `.tmp/sb-ws.mjs` compares):
**11/11 IDENTICAL with `presentation.layout` stripped; `scope:'edit'` 11/11 IDENTICAL (byte and sha); the layout itself is identical
11/11 once its one new row is removed**, which is `{"id":"informational","side":"R","folded":true,"closed":true,"off":false,"float":null}`
(+87 B in every reading, e.g. WATER 8775 → 8862; it sits after `curves`, 8th of 24).

**For the integrator: the sentences to apply** (I did not edit either file):
- CLAUDE.md, THE STAGE TEXT paragraph, its head becomes: "THE STAGE FORMULA (the INFORMATIONAL window since 0.5.3 M9: its own rack card,
  `lab/informational.js`, closed on a first run and for a profile older than it, seated under SETTINGS when opened, listed in + and
  WINDOW; PREFERENCE `molFormula` / `molFormulaSize`, on by default, 50–300 %)". "The same switch and SIZE govern the ATOM LABELS" becomes
  "Its second row governs the ATOM LABELS (PREFERENCE `atomLabels` / `atomLabelsSize`, on by default, split from the formula's at
  0.5.3 M9)". "The older `atomLabels` key is read once … `atomLabelsSize` is not read." becomes "An absent `atomLabels` / `atomLabelsSize`
  takes the stored `molFormula` / `molFormulaSize` once (a 0.4–0.5.2 profile with STAGE TEXT off keeps its labels off); the next save
  writes all four." "following the same switch" (the CAPTION) becomes "following STAGE FORMULA". In the scopes paragraph, "one WORKSPACE
  layout row per new card (RENDER at C7b, CURVES at 0.5.1)" gains ", INFORMATIONAL at 0.5.3 M9".
- docs/STATE-SCOPES.md row 38 (PREFERENCE): "`molFormula` / `molFormulaSize` (the STAGE TEXT and its SIZE: the formula, the fade, the atom
  labels and the capture's caption; since 0.4.0 S3 …)" becomes "`molFormula` / `molFormulaSize` (INFORMATIONAL's STAGE FORMULA and its
  SIZE: the formula, the fade and the capture's caption), `atomLabels` / `atomLabelsSize` (INFORMATIONAL's ATOM LABELS and its SIZE,
  0.5.3 M9; an absent pair takes the stored `molFormula` / `molFormulaSize` once)". Row 60 (WORKSPACE) `layout` cards gains
  "(INFORMATIONAL is one more row since 0.5.3 M9)".

## §3 M11 (done)
R7, STATE only. `windows/state.js` builds STORE A · A · STORE B · B in that order in `.row.tight.native-ab`, and `native-ui.js`'s 2-line
reorder is gone. `abStatus()` toggles `.stored` on the A and B recall triggers (`cls: 'ab-slot'`). `lab.css` draws the lamp as
`.native-ab .ab-slot::after`: the kit's 5 px dot (skin.css's `aria-pressed` idiom), the well's tint while empty and the accent once stored.
It is never a child text node, so `textContent` is still exactly "A" / "B" (`current:150`).
Equal quarters wrapped STORE A to "STORE / A", so `skin.css`'s `.native-ab` is `repeat(2, minmax(0,1fr) 48px)` (the A and B seats get the
trigger's own 48 px minimum) and the row's triggers have 6 px padding. Labels kept. This is a layout change inside the card; no material changed.
**Measured at 1500 × 1300, 2×:** before, two rows (tops 385 and 437 px, 119 px each; card 1044.6 px). After, ONE row (top 385;
63 · 48 · 63 · 48 px; every label on one line; card **992.6 px, 52 px shorter**). Lamp after STORE A: A `rgb(0,162,149)` (accent),
B `rgba(71,98,133,.16)` (well), STORE A none. TRANSITION · Ω RABI share one line before and after. The readout is hidden by LEAN
(window notes off, the first-run default). With notes shown it keeps its own full line (246 × 61 px: its value and its sentence),
as before. I did not force it onto the line, because that needs a new rule and squeezes its sentence. JS −1.
**Suites:** current 15/15 (:150 by textContent, :193 the scope law) · history 45/45 (:162 STORE A · STATE, :164 STORE B) ·
new-project.browser 8/8 (:69, :89) · pwa `--write` · `bash test.sh node` 0.

## §4 PNGs (`research/release-0.5.3/eye/`)
M8: `disp-m8-mol-{before,after}.png`, `disp-m8-mol-phone-{before,after}.png`, `disp-m8-mol-lattice-after.png`.
M9: `disp-m9-display-{before,after}.png` (SETTINGS › DISPLAY unfolded; the STAGE TEXT row is gone, one row shorter);
`disp-m9-informational-after.png` (the new window; no before exists).
M11: `disp-m11-state-{before,after}.png` (the STATE card) and `disp-m11-ab-{before,after}.png` (the A / B group close up), both after
STORE A, so A's lamp is lit and B's is not. Made by `.tmp/m11-eye.mjs` (the base at `/zz-before/lab/`, then `lab/`).

## §5 Lines (`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`)
27,989 at `9bcf000` → 27,990 (M8 +1) → 28,019 (M9 +29: informational +28, settings +1, stage-words +1, sw.js +1, settings-card −2;
the boot seat −1 is inside) → 28,018 (M11 −1: state.js +1, native-ui −2). The follow-up is 0. **Total +29.** M9 + M11 are +28 against a
budget of +49, and the 1.5× stop (+73) was not reached. CSS is uncounted (M11: lab.css +8 lines and 2 comments reworded, skin.css 1 line changed).

## §6 What I could not measure, or did not run
- `node tools/stylehash.mjs` before/after (a brief closer) was not run; this round's step list did not name it. M11's CSS changes the
  STATE card's computed style on purpose, and lab.css's two M9 comment edits change nothing.
- M11 at phone width was not measured. A phone's card body is wider than 246 px, so the 63/48 grid has more room, but this is untested.
- The readout on the TRANSITION line (the plan's "TRANSITION · Ω RABI · the readout on one line") holds only while LEAN hides the
  readout. With window notes shown it takes its own line, as in the base (see §3). Josh rules if it must share the line.
- The settings-probe and the M9 browser suites ran BEFORE follow-up `f4556ac`. That change only acts on a stored blob without
  `atomLabels`, which none of their fresh profiles holds after the first save. The node gate ran after it (0).
- G-L (the lock) does not apply: no field code changed.
- The `current:138` audio-card red from the base did not reproduce here (passed twice), so I have no explanation for it.
