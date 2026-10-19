# Iteration 011 · Q2 · MINIMIZED BY DEFAULT — build note

Branch `it011-minimized`, from BASE `37088a7`. Builder: Claude (Opus), 2026-10-19.

## Josh, verbatim

> By default make most of the hidable texts and exandable windows minimized for default users.

## What the sweep found

Iteration 001 (2026-10-16) had already done most of this: every first-visit window arrives FOLDED on every device
(`lab/first-run.js` `FOLD_ALL`), and MOLECULES' MORE fold is folded on every first run. A first-run probe (a fresh Firefox
profile, desktop 1440 × 900 and phone 390 × 844, `q2-probe.mjs`) that also unfolded every first-run window found **one**
app-owned disclosure still OPEN: **INFORMATIONAL's ANNOUNCE · CURSOR · MARKS fold, open on a desktop**
(`lab/informational.js:47`, `open: !isPhone()`, built in 007 I by copying the 0.4.0 S0 MORE rule that iteration 001 had
already retired). No ruling asked for it open. Unfolded, INFORMATIONAL was 960 px tall on a desktop; it is now 448 px.

The second finding: the folds inside a window (`lab/fold.js`) were not remembered anywhere (only MOLECULES' `more`,
MO-REGISTRY's `core` and SPECTRUM's `shells` were). With the default now CLOSED, a reader who opened one would have lost
it on every reload, so the open ones are now WORKSPACE.

## The table

Rule: minimized unless an earlier ruling says open, or the item is the one thing its window is for.

| item | first-run default before | the ruling that set it | first-run default now |
|---|---|---|---|
| **Windows on the first-run rack** (desktop/tablet: INFORMATIONAL, SPECTRUM, MOLECULES on the left; SETTINGS, STATE, PALETTE, WAVE, CAMERA, CLIP on the right; a phone or tablet gets the one rack) | all FOLDED | iteration 001 (Josh 10-16, `first-run.js` FOLD_ALL); CLAUDE.md "MOLECULES and MO-REGISTRY sit on the first-run LEFT rack…" | unchanged: all folded |
| MOLECULES card (with its register) | on the left rack, folded, **hidden while ATOMS owns the field** | iteration 002 (`windows/molecules.js:116`), iteration 008 U | unchanged |
| The phone's rack | HIDDEN | wave 59 (`shell/settings.js:60`, "the DEFAULT (nothing said) is HIDDEN") | unchanged |
| The phone's TRANSPORT card (in the hidden rack) | unfolded | wave 59 `phoneTr`; it holds PLAY (the one thing a phone's rack must reach) | unchanged: open |
| Windows opened later from + or WINDOW (RENDER, CURVES, EQUALIZER, FIELD, SHADOW, …) | arrive unfolded | the kit's open (`lab/mir/shell/rack.js`, MIR, not editable): the press names the window to see — the one thing it is for | unchanged |
| **INFORMATIONAL › ANNOUNCE · CURSOR · MARKS** (fold.js) | **OPEN on a desktop**, folded on a phone | 007 I build note only ("as MOLECULES' MORE", the rule 001 retired); no Josh ruling | **CLOSED on every device** |
| INFORMATIONAL › THE WORDS (formula, NAME, atom labels, POSITION · PAD) and STATUS | shown | 007 I (formula + labels ON, rest OFF); STATUS is Q1's row this iteration | unchanged (Q1 owns `informational.js`) |
| SPECTRUM's shells n = 1 … 6 | open | iteration 008 A7 / 010 X2: the state grid is what SPECTRUM is for | unchanged: open |
| SPECTRUM's shell n = 7 | folded | 008 A7 (`spectrum.js:92` FOLD_DEFAULT), 010 X2 | unchanged: folded |
| SPECTRUM › DIALS | folded | project state (`spectrum.js:81`, `overlays.dials`) | unchanged |
| MOLECULES' top rows (ON, MOLECULE, BASIS, VIEW + ORBITAL) | shown | CLAUDE.md (0.2.0 alpha): the rows the window is for | unchanged |
| MOLECULES › MORE (KICK / RUN / TDA / spectra) | folded | 0.4.0 S0 → iteration 001 (`first-run.js` `more: false`) | unchanged |
| MOLECULES › the PICKER shelf (‹ ATOMS › …) | folded | `chemview.js:145` | unchanged |
| MO-REGISTRY › CORE | folded | 0.4.0 S1 (`orbitalsview.js:76`) | unchanged |
| MO-REGISTRY › DIALS | folded | `orbitalsview.js:65` | unchanged |
| MO-REGISTRY › ORBITAL's PRESET · → A · → B · MORPH · FLOW fold (`reg-more`) | folded | `orbitalsview.js:124` (fold.js default) | unchanged, now remembered |
| MO-REGISTRY › STATES' presets · A ↔ B · view · flow · drive · song fold | folded | `statesview.js:152` (fold.js default) | unchanged, now remembered |
| The register ladder | shown | CLAUDE.md (the ladder stays painted and editable) | unchanged |
| FIELD › the impulse's knobs | folded | 008 S (`windows/static-field.js:90`) | unchanged, now remembered |
| SHADOW › details (and its L, T, V, S footer) | folded | 0.4.0 S3 (`native-ui.js:36`) | unchanged, now remembered |
| CAMERA (WAVE card's second seat) › pan and hand | folded | `windows/material.js:146` | unchanged, now remembered |
| The TRANSPORT's tempo panel | closed | `native-ui.js:73` | unchanged |
| STATUS TAGS (ψ-badges) and their sheet | tags OFF, sheet closed | CLAUDE.md first-run preferences; `badges.js:21` | unchanged |
| CONTROL HINTS | ON | CLAUDE.md first-run preferences (`rack.js` LOOK_DEFAULTS) | unchanged: on |
| HELP (the ⓘ panels) | OFF | CLAUDE.md; `look.js:81` | unchanged |
| Window notes (LEAN) | OFF | CLAUDE.md | unchanged |
| Stage captions | OFF | CLAUDE.md (`settings.js` `captions`) | unchanged |
| Stage blocks: STAGE FORMULA, ATOM LABELS | ON | 007 I (Josh 10-18) | unchanged (Q1's) |
| Stage blocks: NAME, announcements, cursor, SKELETON · BEAD · UNCERTAINTY | OFF | 007 I | unchanged (Q1's) |
| The notebook | closed | CLAUDE.md ("an open opens it only for non-blank text") | unchanged |
| The modulation window | closed | MIR `window.js` P.open false | unchanged |
| Modulation window's MACROS rail and each device's FULL view | open / FULL (window closed) | MIR (`lab/mir/modulation/window.js:316`) — kit-owned, not editable here; FULL is the curve editor the device is for | unchanged |
| The PICKER (front page) on a human first run | open after the notice | iteration 004 (no title screen; the Picker is the front page) | unchanged |
| The photosensitivity notice | shown once | THE PHOTOSENSITIVITY LAW (0.5.0 C6b) | unchanged |
| RENDER › FILES and its other sections | shown (no disclosure) | MIR `createRenderCard`; the window is closed on a first run | unchanged |

## The changes (file:line)

- `lab/fold.js:5-7, 10-11` — every fold press wears `data-fold` (`key`, else `what`): its name in a WORKSPACE record and the
  handle the first run closes it by. A new optional `key`; no caller changed.
- `lab/native-ui.js:39` — SHADOW's details toggle (its own button, not fold.js) wears `data-fold="shadow details"`.
- `lab/first-run.js:20-25, 28-29` — `inner: false` on both devices, with Josh's words and the list.
- `lab/rack.js:895-896` — the first-visit block closes every open `.dev .lw-fold[data-fold]` when `FIRST_RUN.inner === false`
  (the app literal is not touched). This is how INFORMATIONAL's fold closes without editing `informational.js` (Q1's file).
- `lab/shell/rack-wiring.js:180, 186` — `captureLayout()` writes `folds` (the open ones' names) on a card, only when one is open,
  so every default record keeps its bytes.
- `lab/shell/rack-wiring.js:91-93` — `layoutExtras()` reads it: a named fold opens, every other closes; a record without `folds`
  (an older one, the demo, the default) closes them all, the way `shells` treats its absence.
- `tests/first-run.test.mjs:100-108` — THE INNER FOLDS judge (both devices `inner: false`, the boot wiring, the keys, the record).
- `docs/STATE-SCOPES.md:64` — the `layout` row names `folds`.
- `CLAUDE.md:291-297` — the MINIMIZED BY DEFAULT paragraph (below).
- `lab/sw.js` — the precache digests rewritten by `node tests/pwa.test.mjs --write`.

Untouched: `lab/informational.js`, `lab/shell/stage-words.js` (Q1), `lab/field.js` and the fixtures (THE LOCK), `lab/mir/**`,
`lab/fonts/**`, `lab/new-project.lambdawaves.json` (`--check` in step: the file carries no layout), the demo
`lab/demos/wave-dancer.lambdawaves.json` (sha-256 `c8c61c14…a38a`, before and after).

## The proof (headless Firefox, gate server 9411, geckodriver 5411)

`q2-probe.mjs` (fresh profile each): `q2-shots/{before,after}-{desktop,phone}.png` show the page as it boots, with every
window folded, which looks the same before and after. `…-unfolded.png` show a tall page with every first-run window's own
fold pressed open (on a phone, the rack shown too), so each window's inner disclosures show their first-run state. Each
shot has a `.json` beside it listing every window and every `aria-expanded` with its state.

- before, desktop: open inner disclosures = INFORMATIONAL's `lw-fold` + SPECTRUM n1…n6 (+ the kit's closed modulation
  window). INFORMATIONAL unfolded: 960 px.
- after, desktop: SPECTRUM n1…n6 only. INFORMATIONAL unfolded: 448 px.
- phone, before and after: SPECTRUM n1…n6 only (INFORMATIONAL's fold was already folded there).

`q2-stored.mjs` covers the stored-choice case in one profile (`q2-shots/stored.json`, `stored-resumed-desktop.png`). It ends `GREEN q2-stored — 0 failing of 5`:
1. first run: INFORMATIONAL's and CAMERA's inner folds closed, and no card record names a fold.
2. the reader opens both and edits; the record names them: `informational.folds = ["announcements, cursor and marks"]`,
   `camera.folds = ["pan and hand"]`.
3. a reload that RESUMES the session (`?starter=resume`, the device's WORKSPACE memory): **both stay OPEN**.
4. the demo (`?starter=wave-dancer`, a record with no `folds`): both close. The demo's bytes are unchanged.
5. `applyLayout` of step 2's record: both open.

## The gate

- `node tests/pwa.test.mjs --write`: PASS (13), `lab/sw.js` rewritten
- `./test.sh node`: rc 0 (every suite GREEN; `first-run.test — 0 failing of 13`)
- `node tools/rack-deps.mjs --classes --no-write`: rc 0, THE HINGE HOLDS (spectrum 25/25 unchanged), the app literal is 30 keys (unchanged)
- `node tools/new-project.mjs --check`: in step (16098 B)
- browser suites (LW_PORT 9411, GD_PORT 5411, one at a time): start 3/3 · chem 56/56 (the first pass had one timing RED, L7 glycine
  1765 ms against a 1638 ms budget, while other rows' Firefoxes were running; a rerun on its own was 0 failing of 56) · curves · export3d ·
  molecular-names · offer 16/16 · stage-text · frame-occlusion · lw-links · molecule-head · register 22/22 · current · history · new-project ·
  project-formats 5/5 · keyboard-window · menubar: all GREEN.  official-defaults-palette: RED with "vivid is undefined", the known red that
  is not this row's

## CLAUDE.md sentences (added after the LOOK paragraph)

> MINIMIZED BY DEFAULT (iteration 011 Q2; Josh: "By default make most of the hidable texts and exandable windows minimized for default
> users"): every first-visit window arrives folded (iteration 001, FOLD_ALL) and every fold INSIDE a window (`lab/fold.js`' presses, keyed by
> `data-fold`; SHADOW's details too) arrives closed on every device (`lab/first-run.js` `inner`, closed by rack.js' first-visit block). The
> open ones are WORKSPACE: a card record's `folds` names them (`lab/shell/rack-wiring.js`, written only when one is open), so a resumed
> session, a project or a ☆ layout that names a fold opens it, and a record without `folds` closes them. What stays open is ruled: SPECTRUM's
> shells n ≤ 6 (n = 7 folded), MOLECULES' top rows, the register ladder, hints on, the formula and atom labels (007 I), the phone's
> TRANSPORT card. The table: `research/iteration-011/Q2-BUILD.md`.

## For the integrator and Q1

- Q1 can leave `informational.js:47`'s `open: !isPhone()` as it is: the first-visit block closes it either way. If Q1 changes
  that fold's `what`, its WORKSPACE name changes with it. A record saved under the old name then reads it as closed, which
  loses nothing. If Q1 adds new rows inside a `fold()`, those rows arrive closed as well.
- Q1's new STATUS switch (off by default) and LIST CAP agree with this row and are not built here.
