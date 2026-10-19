# I · THE INFORMATIONAL (iteration 007, branch `it007-informational`, gate server 9621 / GD 5621)

ADR: `architecture/ADR-draft-0003-stage-words-preferences-own-record.md` — ACCEPTED (Candidate B is picked). The scan's finding
(`architecture/NOTES.md` §2): announcements are emitted ad hoc from five call sites with no kind — `chemview.js:196,234,251`,
`orbitalsview.js:104,223`, `windows/material.js:28`, `windows/molecules.js:63-64` — so a toggle such as "show registry orbital adds" has
nowhere to live; the INFORMATIONAL window (`lab/informational.js`, 42 lines, hand-wired) renders its options itself, and MOLECULES reaches
into its DOM. Read CLAUDE.md's STAGE FORMULA paragraph: THE FADE, THE HEAD, the ATOM LABELS, STATUS — all of it stays as behaviour.

## Josh's asks (JOSH-PROMPT.md items 8–10) and his ruling
8. Toggles for what the stage announces: registry orbital adds; WAVE (view) changes; orbital changes (the molecule's ORBITAL dial); the time
   multiplier (RATE); WAVE style and PALETTE changes; the molecule's NAME (not only the formula); and the cursor dynamics (the kit layer's
   follow / drift / avoidance, which λWAVES switched off).
9. Size knobs, padding and positioning for some of them.
10. The whole window reworked into one clean, unified look built from the existing MIR components.
**Defaults (Josh 10-18): "default to formula and atoms on. Everything else off."** — STAGE FORMULA on, ATOM LABELS on; the name, every
announcement kind, the cursor dynamics off on a first run.

## Build
- **Emitters say a kind and a line.** One verb in `lab/shell/stage-words.js` (`announce(kind, md, …)` or a kinds table) — kinds: `preset`
  (THE FADE, a HAND's preset), `head` (THE HEAD), `registry` (an orbital add in MO-REGISTRY), `view` (WAVE's observable), `orbital` (the
  ORBITAL dial), `rate`, `style` (WAVE style and PALETTE), `name` (the molecule's name beside the formula in the block), `status` (the
  STATUS row). The five call sites pass a kind; stage-words filters by the preference; nothing is added for a kind that is off.
- **One PREFERENCE family of its own**: `lambdawaves.q0.info` — the kit's `createPrefs({ key, schema })` over declarative rows
  (`lab/mir/core/prefs.js:19-36`), listed in `lab/settings-store.js` FAMILIES (precedent `lambdawaves.q0.curves`, `mir.gui` in
  `lab/look.js`). Rows: the two switches and two sizes that exist (`molFormula`, `molFormulaSize`, `atomLabels`, `atomLabelsSize`), the
  position and pad (`infoPos`, `infoPad`), a bool per kind above, the cursor dynamics (follow · drift · avoid as the kit offers them), an
  announcement SIZE. The six old blob keys are read ONCE as a migration and never written again (`lab/shell/settings.js:27-30, 31,
  85-93`); `tools/settings-probe.mjs` is the gate; `docs/STATE-SCOPES.md` gains the family's row. A 0.4–0.5.2 profile's lift
  (`atomLabels` from `molFormula`) keeps working through the migration.
- **The window** (`lab/informational.js`): built from the module's option rows with kit controls — switch rows, the kit's knobs for the
  sizes and PAD, the seg for POSITION, grouped under short headings (THE WORDS · ANNOUNCE · CURSOR), the STATUS readout kept, one unified
  look; it reads and writes only the family; MOLECULES stops reaching into its DOM (the status seat goes through a verb). Keep the card
  id `informational`, its first-run and seat rules, and the `.lw-fold` chevron if it grows long.
- **The cursor dynamics** are the kit layer's `setFollow / setParallax / setDrift` and `avoid` (`lab/mir/info/layer.js:726-788`); off by
  default; when on, the words move out of the cursor's way — the layer is still NEVER told of a camera move.

## Laws
THE PHOTOSENSITIVITY LAW, THE FADE's 2.4 s, THE HEAD's hold, the caption road (`film.js caption()`), the `mix-blend-mode` labels — unchanged
behaviour. No look key in `saveSettings`. The hinge: shell/stage-words.js 5 → ≤ 25; the `app` literal never extended (use
`app.state.stageText`, `app.state.molFormulaScale`, `app.state.atomLabelsScale`, `app.hooks.status`). No new test files; never `lab/mir/**`.

## Light check
`tests/stage-text.browser-test.mjs`, `tests/molecule-head.browser-test.mjs`, `node tools/settings-probe.mjs`, `./test.sh node`; a screenshot
of the new window on a desktop and at phone width in `I-BUILD.md`; a first run shows the formula and labels only; switching `registry`
on makes an orbital add announce; a project open leaves `lambdawaves.q0.settings` byte-identical outside WORKSPACE. Report: worktree ·
branch · commits · tests · blockers · next.
