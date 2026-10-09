# C2 · THE LOOK IS THE KIT'S — build hand-off (2026-10-09, the C2 builder and its continuation, Opus 5.5)

**In ten lines.** The look's STORE and its APPLICATION are now MIR's. `lab/look.js` (it replaces `lab/accent-wheel.js`) holds one
localStorage key, `mir.gui`, through `createPrefs` over the kit's own LOOK_SCHEMA rows (eleven of them) and the kit's `createAccent`.
λWAVES' first run is that store's `defaults`; the phone law stays `lab/first-run.js`'s. SETTINGS keeps every control in its seat, each a
`look.set`, repainted from the store (road (a)); MIR OPTIONS (`createGui`) is not built (R5-S1, C2-DESIGN §1, accepted by Yan). An older
settings blob's look keys, and HELP's own `lw-window-info`, are lifted into `mir.gui` once, by the laws rack.js read them by, and leave.
**stylehash: 0 element-states in the seven classes** (and 0 anywhere) over closed, modulation-open and notebook-open × 8 states;
`--acc`/`--acc2` identical in all 8. settings-probe **6/6**, B1 = B3. Node **82/82**; `first-run` 12, `official-defaults-palette` 3,
`new-project` 8, `menubar`, `keyboard-window`, `frame-occlusion` 7, `offer` 16, `take-in-bugs` green. `lab/*.js` **30,553 → 30,429
(−124)**. No `__LW` member a test uses is renamed or removed. No digest lock (C7's); `writeView` untouched. Nothing pushed or merged.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-af76812156a61b6aa` (the continuation; the first builder's was `agent-a828649825812de0a`, paused at the usage alarm) |
| branch | `worktree-agent-af76812156a61b6aa`, reset to the first builder's tip `c312219`; that branch began at `f0fcbc4` (the staging line with C0 C1 C4 C5 C9 D9) |
| `177be6b` | the design hand-off (`C2-DESIGN.md`): road (a), createGui not built, the key map, the lift |
| `2e22fdc` | step 2: `look.js` (the kit's store + accent, the lift), `accent-wheel.js` out (`git mv`), rack.js setters thin |
| `fa69ff7` | step 3: `mir.gui` PREFERENCE in FAMILIES; the probe fails a look key left in B3; STATE-SCOPES rewritten |
| `7b02b1a` | step 4: STATUS TAGS, CONTROL HINTS, HELP are the kit's rows; first-run keeps only the defaults |
| `f463b1c` | `frostSync` leaves (the loop calls `look.moving(clock.playing)`) |
| `198763e` | `__LW.look` moves to the END of the `LW` literal |
| hand-offs | `b817b27`, `c312219`, `77edad0` (step 1: the stylehash compare), `37001b4`, `9ce1b4a`, `3c14a44` (step 5, measured) |
| the docs commit | this file, REPORT.md wave 204, the final `C2-HANDOFF.md` |
| servers | every server and driver I started was stopped by task id / pid (http 8873 and 8877, gate 8873); ports 8873/8877/5343/5347 are free |

## What moved to `mir.gui`, and what left the blob

| `mir.gui` row (the kit's LOOK_SCHEMA, its hook unchanged) | λWAVES default (`LOOK_DEFAULTS`, rack.js) | lifted from (once, then deleted) | the law of the lift |
|---|---|---|---|
| `theme` → `body[data-theme]`; a `run` → `__LW_hooks.theme` (stage ground, `mat.lightUI`, `#themeColor`, restage) | light | blob `theme` | light / dark / system; any other string was DARK, and still is |
| `accentA`, `accentB`, `vivid` → `createAccent` (palette model; `onAccent` → the modulation window) | 30°, 300°, 0.5 | blob `accent [a, b, vivid]` | each `+x \|\| 0` |
| `card` → `body[data-card]` | `FIRST_RUN.card` (refractive · tinted on a phone or tablet) | blob `card` + `cardSet` | only when `cardSet === true` (wave 51: said, not merely saved) |
| `frost` → `body.frost`, `frost-hold` under STILL while the clock plays | `FIRST_RUN.frost` (always · off on a phone or tablet) | blob `frost` | `true` = ALWAYS (wave 67); an unknown string OFF; false / absent not lifted |
| `blur` → `--glass-blur` | 22 (the row's max composed to λWAVES' 30) | blob `blur` | a finite number |
| `disconnected` → `body.disconnected` | true | blob `disc` | a boolean |
| `badges` → `body.no-badges` while off | false (the kit's) | blob `badges` | `=== true` |
| `hints` → `body.control-hints-off` while off | true (the kit's) | blob `controlHints`, legacy `hint` | as `applySettings` read them |
| `help` → `body.window-info-off` while off | false (the kit's) | its own key `lw-window-info` | 'on' / 'off'; the key is removed |

`cardSet` and `themeChoice` are gone (the store holds the CHOICE; `__LW.themeChoice` reads it). Stays in the blob: `captions`,
`molFormula`/`molFormulaSize`, the field chrome, `gamut`/`p3Mode`, AUTO SCALE, governor, `keepFrames`, `perfMode`, the camera feel,
`warned`, `audioDevice`, `nativeLayout` (PREFERENCE) and the WORKSPACE keys; `lw.lean.v1` (window notes) keeps its own key.

## What left, what stays

- **Left:** `lab/accent-wheel.js` (152; the kit's `createAccent` is its port); `setTheme`'s body, the `prefers-color-scheme` listener,
  `applyCard` / `cardChosen` / `defaultCard` / `frostMode`, applySettings' look block and saveSettings' look keys (rack.js); native-ui's
  HELP store; `storedCard` / `storedFrost` / `bootMaterial` (first-run.js); `frostSync`; FAMILIES' `lw-window-info`.
- **Stays λWAVES':** SETTINGS' controls in their seats (THEME, CARD STYLE, FROST, DISCONNECTED, GLASS BLUR, ACCENT A/B, VIVID on LOOK;
  STATUS TAGS, CONTROL HINTS, HELP on DISPLAY — HELP is now built beside its two siblings in rack.js' INTERFACE, native-ui still seats
  it); the theme's engine side (`__LW_hooks.theme`); the first-run material and the phone crossing's FROST OFF override; the stage text's
  ink and M7's one paint per batch; the gamut hole; `lab/palette-app.js` (**brief J not consumed**: the kit's `lab/mir/palette.js`
  has no Jet Black row).
- **New:** `lab/look.js` (95 lines: the store, the accent wiring, `liftLook`, one subscribe that closes an open hint on a HINTS change and
  open ⓘ panels on HELP off); `__LW.look` (the store, at the END of `LW`); FORGET also forgets `mir.gui`.

## The probe's six scenes (`tools/settings-probe.mjs`, gate 8873 / GD 5343)

| scene | blob | reload | the open wrote |
|---|---|---|---|
| boot | 711 B | byte-identical | — |
| WAVE DANCER | 747 B | byte-identical but `modwin.modes s3` (named; C4's law) | settings.modwin, nbW, nbH; the notebook keys; `lambdawaves.q0.projects` |
| WATER | 731 B | byte-identical | projects, settings.modwin, notebook, notebook.title |
| BENZENE | 731 B | byte-identical | projects, notebook, notebook.title |
| N₂ | 731 B | byte-identical | projects, notebook, notebook.title |
| NEW | 731 B | byte-identical | notebook, notebook.title |

**GREEN, 0 RED, B1 = B3.** No scene's B3 holds a look key (the probe now fails one, naming it), and no open touches `mir.gui` (it is
PREFERENCE in FAMILIES, so a write there would be RED). The blob shrank 746 → 711 B when `badges` / `controlHints` left it.

## The eight states, measured (stylehash; the seven classes)

The kit's `tools/stylehash.mjs` (the 1.5 worktree), the README's λWAVES recipe (`--gpu 1`, ready on `__LW.ready && #controlHelp`,
the 8 states by `__LW.setTheme / setCardStyle / setFrost`), C0's 2.5 s settle, base `f0fcbc4` (`git archive`, http 8877) twice and
this tree (http 8873), classified by C0's `classes.mjs`:

| set | elements × states | the seven classes | OTHER / gone / new | noise (base vs base) | the kit's compare |
|---|---|---|---|---|---|
| closed rack | 903 × 8 | **0** | 0 / 0 / 0 | 0 | neutral, 0 pixels |
| modulation window open | 1,284 × 8 | **0** | 0 / 0 / 0 | 0 | neutral, 0 pixels |
| notebook open | 918 × 8 | **0** | 0 / 0 / 0 | 0 | neutral, 0 pixels |

- The first builder's closed captures, taken without the settle, showed 107 element·properties in the FIRST state only — every one a
  0.12 s transition still at its light start value 700 ms after the boot's light → dark flip (the document timeline had not ticked).
  That is C0's boot-timing transient; with the settle it is 0 on both trees.
- `--acc` / `--acc2` cannot be read from stylehash's token block (its scan does not descend into `@import`, so both trees read
  "undefined"). `.tmp/acc.mjs` read them directly — `--acc`, `--acc2`, `--acc-glow`, `--acc-ink`, `--glass-blur` on `<html>` and `<body>`,
  and `#themeColor` — in each of the 8 states: **12 values × 8 states, 0 differences.**

## Tests

- `bash test.sh node`: no RED line; `node .tmp/suites.mjs` (the same suites, each exit code): **82/82**, at every commit.
- `first-run` **12/12** (the reading laws now read `liftLook` through the kit's own `repair` over the device's defaults; one new lift judge).
- `node tools/new-project.mjs --check`: in step (16,329 B); `new-project.test` names the `mir.gui` keys in its PREFERENCE set.
- Browser on 8873/5343, one at a time, 4 s apart: `official-defaults-palette` **3/3** (the saved case proves the lift: `left: []`,
  `helpKey: null`, `gui` with all eleven rows), `menubar` **GREEN** (THEME rows, STATUS TAGS, CONTROL HINTS, SHOW / HIDE help),
  `keyboard-window` **PASS**, `frame-occlusion` **7/7**, `new-project` **8/8**, `offer` **16/16**, `take-in-bugs` **GREEN**,
  settings-probe **6/6**; at the tip `198763e` again: official-defaults-palette 3/3, menubar, keyboard-window, frame-occlusion 7/7.
- An ad-hoc gate (`.tmp/still.mjs`, not committed): FROST STILL holds the glass while playing and gives it back on pause, ALWAYS never
  holds, `__LW.setTheme` moves `data-theme`, `themeChoice`, `#themeColor` and `mat.lightUI`, HELP / STATUS TAGS / CONTROL HINTS
  round-trip through `mir.gui`, no look key is left in the blob and no `lw-window-info`.
- **Re-run alone:** `frame-occlusion` — red on its first run, 4 s after `keyboard-window`; alone, 7/7 twice (and 7/7 at the tip).
  settings-probe — three runs died in the browser, not on an assertion (`Render did not settle: animation frames stopped` in N₂'s open;
  then `POST /session/…/url -> 500 … Failed to decode response from marionette` on the BENZENE reload, twice); alone it was GREEN 6/6,
  and GREEN 6/6 again at `f463b1c`.

## Lines

`cat lab/*.js | wc -l`: **30,553 → 30,429 (−124)**: `accent-wheel.js` −152, `look.js` +95, `rack.js` −50, `first-run.js` −16,
`native-ui.js` −7, `busy-mark.js` −1, `settings-store.js` 0, `sw.js` +7 (generated). The design estimated ≈ −160; the brief's −250 to
−350 assumed INTERFACE + THEME·SURFACE's ~155 lines leave, but under road (a) and the hand law their controls stay (C2-DESIGN §6).

## The `__LW` law

Every member a test uses is kept, as a thin wrapper over the store: `setTheme`, `setCardStyle`, `cardStyle`, `setFrost`, `frost`,
`frostLive`, `setDisconnected`, `disconnected`, `theme`, `themeChoice`, `accent.{set, a, b, colorAt}`, `applySettings`, `settings`,
`saveSettings`, `logo.*`, `ink.*`, and `__LW_hooks.setTheme` (the WINDOW menu's THEME rows). `ui.setWindowInfo` keeps its name (the
`notes` action). `__LW.look` is added at the END of the literal.

## What Josh will see or feel

- **The first run: nothing** — 0 element-states in 3 × 8 states, the same accents, the same first-run look.
- **A returning browser keeps its look**, lifted once. Two small edges, both said: a FRACTIONAL accent, VIVID or blur an older build
  stored (a knob dragged to 31.7°) snaps to the kit's grid (1°, 1 %, 1 px) — the readouts always showed whole numbers; and HELP is now
  forgotten by FORGET with the rest (before, FORGET left it).
- **The store writes its whole state on the first change** (the kit's "a stored state wins"): after any look change the card and frost
  are this browser's, so a browser that later boots as a phone or tablet keeps the material it chose rather than following the device.
  A browser that never changes a look option has no `mir.gui` and follows its device as before (C2-DESIGN §2).

## Brief candidates (for MIR; nothing edited under `lab/mir/`)

1. **VIVID's default.** `createAccent` and the LOOK_SCHEMA `vivid` row default to 0.1; λWAVES, whose engine this is, ships 0.5 (its
   knob, its blob and `official-defaults-palette`). accent.js' header names λWAVES' A and B but not its VIVID.
2. **BLUR's range.** The kit's `blur` row stops at 24 px; λWAVES' GLASS BLUR travels to 30. λWAVES composes `max: 30` onto the row so no
   stored value moves. Either the kit takes 30, or Josh rules 24.
3. **A hidden GUI.** `createGui` cannot be built hidden without its side effects: `installKbm` (`html.kbm-*`, read by window.css,
   modwindow.css, modhost.css, keyboard.css), `touchTablet` (`body.touch-tablet`), QUALITY · AUTO's benchmark and `mir.tier`. An option to
   skip them would let an app take the kit's GUI later without a look change.
4. **The help rows have no moment.** Changing `hints` or `help` closes nothing: `control-help.js` listens for `controlhintschange`, which
   nothing in the kit dispatches, and an open ⓘ panel survives HELP off. λWAVES does both in one `subscribe`; the kit's GUI should too.
5. **A sparse store.** `createPrefs` writes every row on the first `set`, so a device-dependent default (λWAVES' card and frost, the
   kit's own DEVICE_BLUR) is frozen by an unrelated change. Writing only the rows a hand moved would keep wave 51's "said, not merely saved".
6. **stylehash's token scan** still does not descend into `@import` (C0's note): `--acc`/`--acc2` behind `mir/mir.css` read "undefined",
   so the accent check needed its own reader (`.tmp/acc.mjs`).
7. **Jet Black** is not in the kit's `palette.js`; `lab/palette-app.js` stays until it is.

## Blockers

None. One harness note: `bash test.sh node > .tmp/testsh.txt 2>&1; echo exit $?` was refused by the worktree guard ("this command
runs bash inside a construct too complex to verify"); the plain `bash <tree>/test.sh node` ran (no RED line), and `node .tmp/suites.mjs`
gives the exit codes.

## The draft CLAUDE.md paragraph (replaces "First-run λWAVES preferences are specified in …" through "Stored choices and the phone's frost override win.")

> THE LOOK IS THE KIT'S (0.5.0 C2): theme, card, frost, DISCONNECTED, glass blur, ACCENT A/B, VIVID, STATUS TAGS, CONTROL HINTS and HELP
> live in MIR's `mir.gui` (`lab/look.js`: `createPrefs` over the kit's own LOOK_SCHEMA rows, `createAccent`), never in the settings blob;
> SETTINGS keeps each control in its seat as a `look.set`, repainted from the store, and MIR OPTIONS (`createGui`) is not built. λWAVES'
> first run is the store's `defaults` (`LOOK_DEFAULTS`, `lab/rack.js`): light/refractive/ALWAYS frost, 22 px blur, 50% VIVID, DISCONNECTED,
> hints on, tags and Help off; on a phone or tablet (`lab/first-run.js`, rack.js' own `isPhone()`/`isTablet()`) frost OFF, tinted. Captions
> and window notes off, AUTO SCALE and governor on stay the blob's. A stored choice wins; an older blob's look (and `lw-window-info`) is
> lifted once by `liftLook`; the phone's frost override stays the app's. Never add a look key to `saveSettings`.

## Exact next step

Claude Sos merges `worktree-agent-af76812156a61b6aa` (tip: the docs commit after `198763e`) onto `sos-s0`, then
`node tests/pwa.test.mjs --write`, `bash test.sh node`, `first-run`, `official-defaults-palette`, `new-project` 8, `menubar` and the
settings-probe. Merge notes: `lab/sw.js` is the standing conflict (regenerate). rack.js' C2 sites are the `look.js` import (line 82),
`LOOK_DEFAULTS`, the three setters and `lookSync`, applySettings' first line, `createLook` before the field, INTERFACE's three switches,
THEME · SURFACE's controls, the palette editor's `lut`, `enterPhone`/`leavePhone`'s frost lines, the loop's `look.moving`, the `LW`
literal's first line and its END (`look`). C3's WINDOW menu THEME rows (`__LW_hooks.setTheme`) and the `notes` action
(`ui.setWindowInfo`) keep working unchanged. Then Josh rules candidates 1–5 and the CLAUDE.md paragraph lands.
