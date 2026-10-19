# I · THE INFORMATIONAL — build note (iteration 007, branch `it007-informational`, base `c73c5c0`)

Brief: `I-BRIEF.md`. ADR: `architecture/ADR-draft-0003-stage-words-preferences-own-record.md` (Candidate B, accepted). Josh's ruling 10-18:
"default to formula and atoms on. Everything else off."

## What was built

**One verb, eight kinds.** Every stage announcement is `stageText.say(kind, text, { hold })` (`lab/shell/stage-words.js`). The kinds are a
closed table, `KINDS`. Each kind has a seat:

| kind | seat | emitter |
|---|---|---|
| `preset` | THE FADE (2.4 s in the formula's seat) | `controller.js` loadPreset `{hand}`, the STATE / ORBITAL / STATES preset selects and BEAT (through `molecules.js`), `verbs.js` run's fade (links, Gemma) |
| `head` | THE HEAD (held until Escape or a press) | `windows/molecules.js` headLand, restored from before iteration 001, now opt-in |
| `registry` | pop | `orbitalsview.js` paintLevels (the orbital a hand added) |
| `view` | pop | WAVE's OBSERVABLE (`material.js`), MOLECULES' VIEW (`chemview.js`) |
| `orbital` | pop, held | MOLECULES' ORBITAL dial while the hand turns it (`chemview.js`, both knob builds) |
| `basis` | pop | MOLECULES' BASIS and METHOD (`chemview.js`) |
| `rate` | pop, held | the transport's RATE knob (`transport.js`) |
| `style` | pop | WAVE's STYLE, PALETTE on/off, and a hand's palette preset (`material.js`; a restore, link or `setPalette` is quiet) |

When a kind's switch is off, nothing is added: `say` returns before `pop` or `announce` is called. The light check below measured this.
The `say` verb and ASK still call the raw `announce`. They are explicit requests to write on the stage, so they follow STAGE FORMULA only.

**A held pop** (new, for a dial under the hand): `pop(text, { hold: true })` keeps the line lit and follows the number as it changes. It fades
1.2 s after the last held call (`.lw-pop.hold` / `.lw-pop.out` in `skin.css`). Without this, every input would restart the 1.6 s keyframe,
and the line would blink on each step.

**One PREFERENCE record, `lambdawaves.q0.info`.** It is the kit's `createPrefs({ key, schema })` over `INFO_ROWS`, with no `apply` specs.
`initStageText` applies the record at the go and on every change. The rows:

- `molFormula` · `molName` · `molFormulaSize`
- `atomLabels` · `atomLabelsSize`
- `infoPos` · `infoPad`
- `sayPreset` · `sayHead` · `sayRegistry` · `sayView` · `sayOrbital` · `sayBasis` · `sayRate` · `sayStyle`
- `popSize`
- `cursorAway` · `cursorDrift`

The record is listed in `settings-store.js` FAMILIES as PREFERENCE, and `docs/STATE-SCOPES.md` has its row. FORGET (`mir-gui.js`) wipes it.
`infoPrefs()` creates the record at its first call and runs THE LIFT once. The lift reads the blob's six keys by the laws `settings.js` read
them by, writes the record, and deletes the six keys from the blob. `saveSettings` no longer names them, and its apply block is gone.

**The window** (`lab/informational.js`) is built from the rows. Each row is the kit's `control(descriptor)`: bool rows become a switch, the
two-way enum a seg, and numbers a knob with a double-tap home. The rows sit under the kit's group headings:

- **THE WORDS:** STAGE FORMULA · SIZE / NAME / ATOM LABELS · SIZE / POSITION · PAD
- **ANNOUNCE · CURSOR · MARKS**, behind one `.lw-fold` chevron on its own line. The fold is open on a desktop and folded on a phone, as
  MOLECULES' MORE is.
  - **ANNOUNCE:** eight switches in two columns, then the pop-ups' SIZE.
  - **CURSOR:** AWAY · DRIFT.
  - **MARKS:** SKELETON · BEAD · ELLIPSOID.
- **STATUS**, unchanged.

A hand writes only the record, and the record repaints the controls. `ui.molFormulaSw` and `ui.atomLabelsSw` are the controls' widgets, so
`verbs.js` `switch formula|labels` and the notebook's command list still press them. The look is one grid of 2 columns plus a 56 px knob
column (`skin.css` §ITERATION 007 I). The card id `informational`, its first-run CLOSED state and its seat under SETTINGS are kept.

**MOLECULES no longer reaches into INFORMATIONAL's DOM.** The three MARKS switches are built in INFORMATIONAL. They keep their blob keys
(`skeleton` / `bead` / `ellipsoid`) and how settings.js reads them. `windows/molecules.js` lost the `querySelector` and the `el` / `sw`
imports.

**NAME** puts the molecule's name as a second paragraph of the formula block, at 0.65 em of the formula, close under it (`lab.css`). The
caption stays one plain line, without the name.

**CURSOR.** AWAY is the kit layer's `setFollow` plus `setParallax`: with no subject, `follow` alone moves nothing, and parallax needs it.
DRIFT is `setDrift`. Both are off by default. The layer is still never told of a camera move.

## Screenshots

- Desktop, 1500 × 1000, WATER on, first-run record, the fold open: `I-BUILD-desktop.png`.
- Phone width (Firefox's narrowest headless window, 500 px, with the `phone` class set), the fold folded as shipped: `I-BUILD-phone.png`.
- NAME on (H₂O over "water"): `I-BUILD-name.png`.

## Decisions

1. **The `preset` kind (THE FADE) is OFF on a first run**, following Josh's "everything else off" literally. The brief puts every
   announcement kind off. If he wants presets announced by default, flip one `default` in `INFO_ROWS`.
2. **Profiles that already exist also get the new defaults.** The lift carries only the six keys that existed. The pop-ups and fades that
   iteration 001 left on are off after it, for Josh too, so his ruling is what he sees.
3. **`basis` is a kind the brief did not list.** MOLECULES' BASIS and METHOD pops needed a home: "WAVE view" would have been wrong, and
   dropping them would have lost behaviour. Adding it cost one row.
4. **`status` is not a kind.** STATUS is a readout in the window, not a stage announcement, so the brief's `status` kind had nothing to
   filter. The STATUS row is kept exactly as it was.
5. **THE HEAD comes back as an opt-in kind** (MOLECULE HEAD, off by default). Iteration 001 had removed it from the stage, so on the base
   `molecule-head.browser-test.mjs` was RED. With the kind on, it is GREEN again.
6. **The record is written once if it is absent.** The old closed-card rule ("a profile older than INFORMATIONAL stays closed") read
   `blob.atomLabels === undefined`, and the blob no longer holds that key. `infoKnown()` is true when the record existed, or when the blob
   held `atomLabels`, at the record's first read. Writing defaults on a first boot means a later reload still knows this profile has met the
   window.
7. **Size rows have `step: 0.01`** (the store rounds to that grid). The knobs are given the same step, so the store and the dial agree
   while the hand drags.

## What the brief or the ADR got wrong

- **THE HEAD was no longer on the stage.** Iteration 001 (`503997b`) had already removed it, and CLAUDE.md still described it as shipping.
  So the base was RED on `molecule-head.browser-test.mjs`. It is now an opt-in kind, and CLAUDE.md is updated.
- **The `status` kind.** STATUS is a readout, not an announcement (see decision 4).
- **The five call sites were more like twelve.** `controller.js` loadPreset, `verbs.js` (fade, `say`), `ask.js`, `statesview.js` (preset,
  BEAT) and the palette and RATE roads all speak to the stage too. Each one is now classified.
- **A kit issue to file with MIR:** `createPrefs` coalesces its page writes under one fixed frame key, `'mir.prefs'`, for every store. A
  second store's `set` in the same frame can therefore replace the look's pending `perform`. This record has no `apply` specs, so its own
  job is empty, and after each change it books the look's job again (`look.prefs.apply()`). The kit's key should be per store (for
  example `'mir.prefs:' + key`).
- **The base was already RED in two places:** `stage-text.browser-test.mjs` §4 asserted 2 knobs while INFORMATIONAL has had 3 since PAD
  (now 4), and `register.browser-test.mjs` R12 expects the label `MO-REGISTRY ON` where the switch now says `REGISTRY ON` (iteration 001/002).

## Tests (gate server 9621 / GD 5621)

| check | result |
|---|---|
| `tests/stage-text.browser-test.mjs` | GREEN (4/4). It switches `sayPreset` on first; §4 now reads INFORMATIONAL's 4 dials. The base was RED on §4. |
| `tests/molecule-head.browser-test.mjs` | GREEN (3/3). It switches `sayHead` on first. The base was RED. |
| `tests/lw-links.browser-test.mjs` | GREEN. It switches `sayPreset` and `sayHead` on first. |
| `tests/register.browser-test.mjs` | 21/22. R12's BEAT banner now passes (`sayPreset` on in its HELP). The one red is the pre-existing `MO-REGISTRY ON` label. |
| `node tools/settings-probe.mjs` | No project open writes a key outside WORKSPACE or PROJECT, and `lambdawaves.q0.info` is never touched by an open. The blob round trip is GREEN at boot and NEW. The same four WORKSPACE reload diffs (WAVE DANCER's `modwin` modes, the demos' `closed`) are red on the base tree too, served from `git archive c73c5c0` on 9622: they are not this row's. |
| `./test.sh node` | Every suite is GREEN except `pwa.test.mjs`, which fails only on the precache hashes of the edited files. `node tests/pwa.test.mjs --write` makes it pass. The refreshed `sw.js` was **not** committed: per PLAN.md, the integrator rewrites it at each merge. |
| `node tools/rack-deps.mjs --classes` | THE HINGE HOLDS. stage-words 5 → 7, molecules 16 → 15, and the `app` literal is not extended. |
| light check (scratch, `.tmp/`) | A first run's record has only `molFormula` and `atomLabels` on. The stage reads `$\mathrm{H_{2}O}$` with 3 atom labels and 0 announcements. A real pointer stroke on MO-REGISTRY's ladder with REGISTRY ADDS off called `pop` 0 times; with it on, the same stroke wrote `+ 2b2 · LUMO+1` … `+ 2a1 · HOMO−3`. NAME gives `$\mathrm{H_{2}O}$\n\nwater`. `setPalette` (a restore's road) said nothing, while a hand on the ramp's stepper said `PALETTE · sea`. Lifting an iteration-001 blob (STAGE FORMULA off, 150 %, BOTTOM, 30 %) gave the record formula off, labels off (the old law), both sizes 1.5, bottom, 0.3; the six keys left the blob and the card stayed closed (an "older" profile). |

## Next

- The integrator: `node tests/pwa.test.mjs --write` at the merge.
- O (`it007-orbital`) rebuilds the ORBITAL dial. Its `onInput` should keep calling `sayOrbital()` (the hold pop). A modulator's `set` must
  not call it: only a hand speaks.
- File the `createPrefs` frame-key issue with MIR.
- Josh's calls: whether presets (THE FADE) should default on after all, and whether the pop-ups should carry STATUS words.
