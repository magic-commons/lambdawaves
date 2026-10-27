# 018 chain F — MIR OPTIONS (Opus builder, 2026-10-27)

BASE c4de355 (yan-c, chains A–E merged) · branch `it018-F` · kit 1.5.0-alpha.31 → **1.5.0-alpha.32** (one bump for the chain; three FOR-MIR
lines at the top of `docs/FOR-MIR.md`; manifest re-hashed, pin in `tests/mir-manifest.test.mjs`). `lab/sw.js` rewritten once (pwa --write).

## F1 MIR OPTIONS WITHOUT TABS (29f6a24) — kit `shell/gui.js`, `gui.css`; `lab/settings-store.js`, `docs/STATE-SCOPES.md`, `tools/f-shots.mjs`
- The LOOK · LIGHT · WINDOWS seg, `GUI_TABS`, `TAB_OF`, `show()`, the api's `tab` / `turn()` and the `mir.gui.tab` write are gone. Every group
  flows down one pack of up to four balanced CSS columns (276 px, `break-inside: avoid`), in Josh's order theme · accent · material · text ·
  controls · quality · motion · menus · light · windows · sampling. A hidden group (λWAVES hides SAMPLING) leaves no hole.
- Less air inside groups: ACCENT's four dials in one row; RELIEF beside FACES; MENU BAR beside SHOW LOGO; WINDOWS' four switches two by two;
  THEME's mode seg on its own line and RESET LOOK · RESET LAYOUT · FORGET in one row (no FORGET orphan).
- Window 1156 × 647 at 1600 × 1000 (was 1102 × 776 for the LOOK tab alone). `fit` kept: a smaller screen gets three columns (1000 px wide:
  964 × 610, the body scrolls, its scrollbar now added to the width so nothing scrolls sideways); a phone is one 300 px column, full height.
- `open('light')` / `'options:2'` / any old page name opens OPTIONS; `toggle()` just toggles. The registry keeps `mir.gui.tab` (older
  browsers hold it), marked no longer written.
- Pictures: `F-shots/f1-before.jpg` (LOOK tab; CUSTOM; MENUS orphaned on a third row), `F-shots/f1-after.jpg` (all eleven groups, one page).

## F2 THE λWAVES SKIN (0268923) — kit `core/prefs.js`, `shell/gui.js`, `locales/*.json`; app `lab/look.js`
- `createPrefs({ presets })` also takes a LIST in THEMES' shape, kept in order as `presetList` and matched by `values`. MIR OPTIONS' SKIN and
  TONE steppers, applyTheme/applyTone, RESET LOOK (to the list's first) and ABOUT's "SKIN …" read `P.presetList || THEMES`.
- `lab/look.js` passes `[λWAVES, ...THEMES]`. λWAVES is BUILT from the store's own row defaults (`defaults(schema)`: LOOK_HOME + rack.js
  LOOK_DEFAULTS + the device's first-run material), its `values` the kit's THEME_KEYS, its one tone (λWAVES) the COLOUR_KEYS (vivid 0.5) —
  so it equals the first-run look by construction, on a phone too (tinted, frost off). CUSTOM shows only when nothing matches.
- `SKINS` and the "coming (name-specs)" note are gone; RESET LOOK's hint is "Every look option back home: the {skin} skin" (keys renamed in
  all eleven packs, translations kept; the note's entries removed).
- Proof: `F-shots/f2-first-run-lambdawaves.jpg` (probe cleared `mir.gui` and reloaded: `stored: null`, `preset() = 'lambdawaves'`, SKIN and
  TONE read λWAVES). Stepping: λWAVES → FROST (card refractive, blur 11, vivid .1) → back to λWAVES (blur 22, vivid .5, disconnected);
  DARK keeps λWAVES; BLUR 5 → CUSTOM; RESET LOOK → λWAVES, light.

## F3 BPM PILL, NO RING (650276a) — kit `shell/transport.js` (one line)
- A `typed` pill never sets `aria-expanded` true, so neither transport.css' nor skin.css' `[aria-expanded="true"]` ring lights while EXPAND
  has the panel open. `F-shots/f3-pill-no-ring.jpg` (expander open: EXPAND `true`, pill `false`, no shadow).

## F4 LATEX-COPY §8 (0bfac9e) — `tests/latex-copy.browser-test.mjs` only
- §8 (molecule): `hidden === true` (folded assert dropped); comment and PASS line say hidden / returns. No code changed.
- The suite's second §8 (CALCULUS) was red behind it: it counted 8 tiles; the BREATH tile (2026-10-16, ae8c123) makes 9. Re-aimed to 9.

## Tests (all on my gate 9781 / gd 5781, one browser at a time)
GREEN: latex-copy (after F4), official-defaults-palette, take-in-bugs, menubar · node: first-run 13/13, new-project, ink 17/17, pwa (13 PASS),
mir-manifest (alpha.32, 264 files) · `rack-deps --classes --no-write` HOLDS (spectrum 25/25) · `new-project.mjs --check` in step (16098 B;
the λWAVES skin is a PREFERENCE, nothing moved). LOCK not run: no stage pixel path touched; no leaf moved.

## CLAUDE.md sentences to add
- First-run preferences paragraph, after "…50% VIVID on desktop;": "This look is MIR OPTIONS' **λWAVES** skin, the SKIN stepper's first
  entry and the default (`lab/look.js` builds it from the store's own defaults and passes `[λWAVES, ...THEMES]`; the kit's stepper reads the
  prefs' `presetList`), so a first run reads λWAVES and RESET LOOK returns to it; CUSTOM shows only when no skin matches."
- New, after the palettes paragraph: "MIR OPTIONS has no tabs (018 F1, kit gui.js/gui.css): every group on one pack of up to four balanced
  columns, ≈ 1180 × 660, fewer columns or a scrolling body on a smaller screen."

## Open questions for Josh
1. The λWAVES skin leaves LIGHT · DARK · SYSTEM to the reader (the kit's law for every skin): picking λWAVES does not flip a dark page to
   light, and a dark page on λWAVES' settings still reads λWAVES. Should λWAVES state THEME light (as NEON states dark)?
2. λWAVES has one tone, also named λWAVES. A better name, or more tones?
3. With the order fixed, the columns cannot balance perfectly: column one ends ≈ 190 px short of column three. Accept, or allow a reorder?
