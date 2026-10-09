# C2 DESIGN — THE LOOK IS THE KIT'S (the hand-off before any lab/ code)

Written 2026-10-08 by the C2 builder (Opus), from `f0fcbc4`. Brief: `BRIEF-C2.md`. Wave 204.

## 1 · The road for R5-S1: (a), and `createGui` is not built

**Road (a), thin kit-bound controls in SETTINGS, wins.** SETTINGS keeps the controls it has, in the seats they have (the hand
law): THEME seg, CARD STYLE seg, FROST seg, DISCONNECTED sw, GLASS BLUR knob, ACCENT A, ACCENT B, VIVID (LOOK page), STATUS TAGS
and CONTROL HINTS (INTERFACE, DISPLAY page) and HELP (native-ui, DISPLAY page). Each one's `onChange` becomes
`setLook({ key: v })`; one `prefs.subscribe` repaints all eleven from the store.

| | λWAVES lines it costs | what Josh would see |
|---|---|---|
| (a) thin controls | ≈ 12 (one `setLook`, one subscribe table, the onChange edits are in place) | nothing new: the same eleven controls in the same seats |
| (b) the kit's LOOK tab mounted in SETTINGS | ≈ 10 to mount, **plus ≈ 40 `defaults` rows** pinning every other LOOK_SCHEMA row to "writes what λWAVES draws today" (VEIL, SATURATION, CORNERS, TEXT, SPACING, SHADOW, EDGE, QUALITY … each writes at its kit default — `--surface-filter: blur(22px) saturate(1.30)`, `--surface-radius: 24px`, `data-text="light"`, `--rack-gap`, `data-cast`, `--pane-edge: transparent` — and some rows write whatever their default) | ≈ 40 controls SETTINGS never had (SKIN, TONE, BRIGHTNESS, TEXT, QUALITY, PANE SOLID, VEIL, SATURATION, CORNERS, BRIGHT, HUE, TINT, RELIEF, FACES, BLEND, MOTION, POINTER, GLOW, PARALLAX, DROP GUIDES, MENUS …), Q3's "may the app show what it does not today" answered yes without Josh |

(b) is more code and a different instrument; (a) is the ruling's words ("the look's CONTROLS stay reachable from λWAVES'
SETTINGS card").

**`createGui` is not constructed at C2** (the one departure from the brief's step 2, argued here so the integrator can overrule it).
Hidden, it would contribute only its side effects, and each is a look change the acceptance forbids:
- `installKbm()` — `html.kbm-precision` / `html.kbm-touch`, which `window.css`, `modwindow.css`, `modhost.css` and `keyboard.css`
  read (λWAVES has never installed it; `lab/mir/app.js` and `gui.js` are its only installers, both unreached today);
- `touchTablet()` — `body.touch-tablet` on an iPad or a coarse pointer > 700 px: the kit's tablet seats (44 px heads, the float
  clamp) — the phone law is the app's (brief §2);
- the full LOOK_SCHEMA store (or, with our narrow store, ≈ 70 controls built over undefined values and never shown), QUALITY ·
  AUTO's ≤ 3 s benchmark and its `mir.tier` key, the two windows' DOM in the float layer.

What C2 takes from the kit is exactly R5-S1's sentence: **the STORE** (`createPrefs`, key `mir.gui`) and **the APPLICATION**
(the LOOK_SCHEMA rows, taken from `lookSchema()` by key, so every hook is the kit's own spec) and **the accent engine**
(`createAccent`). The day Josh offers MIR OPTIONS, the change is `createGui({ host, prefs: look.prefs, accent: look.accent,
projectAccent: false, defaults: LOOK_DEFAULTS, forget: [] })` plus a GUI menu row — and kbm and touch-tablet become his ruling then.

## 2 · The store

`lab/look.js` (it replaces `lab/accent-wheel.js`, `git mv`, the same N7 seam): `createPrefs({ key: 'mir.gui', schema, context })`.

`schema` = the kit's `lookSchema()` rows whose key is one of the **eleven** below, in the kit's order (THEME before the accent's
run, as the kit wants), with λWAVES' `defaults` written over each row's `default` (exactly what `createGui({ defaults })` does).
No other row is in the store, so no other hook is ever written: the store applies only what λWAVES already drew.

| `mir.gui` key | kit hook (unchanged) | λWAVES default (the app's `defaults`) | kit default |
|---|---|---|---|
| `theme` | `body[data-theme]` = the resolved theme; SYSTEM follows the OS live | **light** | dark |
| `accentA`, `accentB` | (read by `vivid`'s run) | 30°, 300° | 30°, 300° |
| `vivid` | run → `accent.set({ a, b, vivid, bright })` | **0.5** | 0.1 |
| `card` | `body[data-card]` | **FIRST_RUN.card** (refractive · tinted on a phone or tablet) | refractive |
| `frost` | `body.frost`; run → `body.frost-hold` under STILL while `ctx.moving` | **FIRST_RUN.frost** (always · off on a phone or tablet) | always |
| `blur` | `html { --glass-blur: Npx }` (always written) | **22** (every device) | 11 / 20 (DEVICE_BLUR) |
| `disconnected` | `body.disconnected` | **true** (rack.js `s.disc !== false`) | false |
| `badges` | `body.no-badges` while off | false | false |
| `hints` | `body.control-hints-off` while off | true | true |
| `help` | `body.window-info-off` while off | false | false |

**VIVID, reconciled:** the kit's header says "λWAVES ships … VIVID 0.1"; λWAVES' blob, its knob's seed and
`official-defaults-palette` all say **0.5** today. 0.5 is the app's `default`; the kit's 0.1 is stale prose (brief candidate).

**BLUR's range:** the kit's row is 0–24 px; λWAVES' GLASS BLUR is 0–30. The row is composed with `max: 30` so no stored value
moves and the knob keeps its travel (the glass is Josh's); the kit taking 30, or Josh ruling 24, is a brief candidate.

**The phone law stays the app's:** `FIRST_RUN = firstRunMaterial(isPhone() || isTablet())` is computed before the store (as today),
and it IS the store's `card` and `frost` defaults, so a browser that has never chosen wears its device's material. The phone
crossing's FROST OFF override (`enterPhone`) stays a separate, later law: `phone.wasFrost = look frost; setFrost('off')`, and
`leavePhone` gives it back.

**What the kit's store changes about "said, not merely saved" (wave 51):** `prefs` writes its whole state on the first `set`, so
after any look change the card is frozen at what this browser wore — the kit's law ("a stored state wins"), as it already is for
its own DEVICE_BLUR. A browser that never changes a look option has no `mir.gui` key and keeps following its device. The lift
(§3) honours `cardSet` exactly: a card saved but never said is not lifted. Likewise the phone's FROST OFF is now a stored value
while on the phone (today it was quiet, but the next `saveSettings()` — any window move — stored `frost: 'off'` anyway).

## 3 · The key map (blob → `mir.gui`) and the lift

Every key of `saveSettings` that the look owns, read by the laws `applySettings` read it by today:

| blob key (today) | `mir.gui` | law of the lift |
|---|---|---|
| `theme` | `theme` | light / dark / system only |
| `card` + `cardSet` | `card` | only when `cardSet === true` and `card` is tinted / refractive (wave 51); `cardSet` leaves |
| `frost` | `frost` | `true` = always (wave 67); off / still / always; anything else is not lifted (the default stands) |
| `disc` | `disconnected` | a boolean only (absent = the default, true) |
| `blur` | `blur` | a finite number (rounded to the row's 1 px step, clamped 0–30) |
| `accent [a, b, vivid]` | `accentA`, `accentB`, `vivid` | each `+x \|\| 0`, as `applySettings` read them |
| `badges` | `badges` | a boolean only |
| `controlHints` (legacy `hint`) | `hints` | `controlHints` if boolean, else `hint === false` → false |
| `lambdawaves.q0.settings` has no HELP; HELP is `lw-window-info` (its own key) | `help` | 'on' → true, 'off' → false; the key is removed |
| `themeChoice` | — | never stored (it was `body[data-theme-choice]`; `__LW.themeChoice` now reads `look.get('theme')`) |

**Not look:** `captions`, `molFormula`, `molFormulaSize`, the field chrome, `gamut`/`p3Mode`, `auto`, `governor`, `keepFrames`,
`perfMode`, the camera feel, `warned`, `audioDevice`, `nativeLayout` (PREFERENCE, confirmed) and the WORKSPACE keys stay in the
blob; `lw.lean.v1` (window notes) stays its own key — no kit row reads them.

**The lift, once, forward only:** at `createLook` (the boot, before any window is built), if the blob holds any of `theme, card,
cardSet, frost, disc, blur, accent, badges, controlHints, hint` or `lw-window-info` exists, the patch above is `prefs.set` into
`mir.gui`, those keys are deleted from the blob (`settingsStore.write`, the other keys in their order) and `lw-window-info` is
removed. `saveSettings` never names them again, so a later boot finds none. A fresh profile has none and never runs it.
`liftLook(blob, windowInfo)` is pure and node-tested (`tests/first-run.test.mjs`, which already holds the reading laws).

## 4 · The engine side of a theme change, and where it hooks

`setTheme` today does nine things. The kit row writes `body[data-theme]`; the rest is ONE `run` spec appended to the `theme` row
(`{ run(v, s, env) }`, guarded by `v + env.theme` so it acts once per change). A `run` spec — not `prefs.subscribe` — because
SYSTEM following the OS re-applies without a `set`, so a subscriber would never hear it:

| today (`setTheme`) | after |
|---|---|
| `body.dataset.theme` | the kit row |
| `body.dataset.themeChoice` | gone (`__LW.themeChoice` reads the store) |
| `#themeColor` content (#eef1f6 / #070a0f) | the run |
| `mat.bg = THEMES[t].bg`, `restage()` | the run |
| `mat.lightUI` | the run |
| `ui.themeSeg.set` | the subscribe (the seg shows the CHOICE, so SYSTEM following the OS moves nothing) |
| `__LW_hooks.themeChanged(t)` | the run |
| `applyAccent()` | the `vivid` row's run (its key holds the theme) |
| `saveSettings()` | gone — `prefs` writes `mir.gui` |
| `schedule(TIER.PRESENT)` | the run |
| the `prefers-color-scheme` listener | gone — `prefs` owns it |

Every wrapper sets then `prefs.apply({ now: true })`, so a theme, card or frost flip is on the page synchronously, as today (the
stylehash recipe and the tests read it in the same task). `frostSync()` keeps its per-frame compare, now of `ctx.moving` against
`clock.playing`, and on an edge `apply({ now: true })` lets the kit's run write `frost-hold`.

**The accent:** `createAccent({ model: 'palette', a: 30, b: 300, vivid: 0.5, wheelStops: <prism>, stageGround: () => mat.bg,
gamut: (rgb) => gamutCss(rgb), onAccent: (A, B) => modView && modView.setAccent(A, B) })` — the kit's port of accent-wheel.js,
the same arithmetic (legible lightness, VIVID chroma, `--acc --acc2 --acc-glow --acc-ink`, `setAccentRGB`, `hueSat` — proved equal
by hand: the kit's `rgbToHsl` is the same hue and saturation). What λWAVES feeds it, because the kit holds its own copies:
`applyAccent()` = `accent.set({ hueShift: mat.hueShift, paletteOn: mat.paletteOn })`; the palette editor's `lut` → `accent.set({
wheelStops: palStops })` (`rampLUT` and `toLUT` are bit-identical over all 33 presets, measured). What stays λWAVES': the stage
text's ink (`#molFormula` colour and halo) in `paintMarks`, M7's batch around `paintMarks`, the gamut hole, the scratch context
for `__LW.ink`. The turn's sheet becomes the kit's (`#mirTurn`, `mir-turn-N`; no λWAVES sheet or test reads the old names — the
legacy suite does, and is not the gate). `busy-mark.js` calls `accent.busy(want)` in place of its two lines.

## 5 · The `__LW` law (no member a test uses is renamed or removed)

| member | becomes |
|---|---|
| `__LW.setTheme(t)`, `__LW_hooks.setTheme(t)` (the WINDOW menu's THEME rows) | `setLook({ theme: t })` |
| `__LW.setCardStyle(c)` → the card | `setLook({ card })` (an unnamed id = the device's card) |
| `__LW.setFrost(m)` → the policy · `__LW.frost` | `setLook({ frost })` · `look.get('frost')` |
| `__LW.setDisconnected(v)` · `__LW.disconnected` | `setLook({ disconnected })` · unchanged (the class) |
| `__LW.theme` · `__LW.themeChoice` · `__LW.cardStyle` · `__LW.frostLive` | unchanged · `look.get('theme')` · unchanged · unchanged |
| `__LW.accent.{ set(a, b), a, b, colorAt(deg) }` | `setLook({ accentA, accentB })` · `look.get(…)` · `accent.wheelColor` |
| `__LW.applySettings` · `__LW.settings` · `__LW.saveSettings` | kept (applySettings re-applies the look once the hooks exist) |
| `__LW.mark.{ colours, stops, css, steps, step, turn }` · `__LW.paintMarks` | over the kit accent (`stops` computed from `wheelColor`, `css` the kit's sheet) |
| `__LW.ink.{ accent, mark, stageMark, stageGround, floor, ground }` | `accent.markInk`, `mat.bg`, 3, the kit's `CARD_GROUND` |
| new: `__LW.look` | the store, for probes (`look.get('theme')`) |

The stylehash recipe's eight states (`__LW.setTheme(dark|light)` × `__LW.setCardStyle(tinted|refractive)` × `__LW.setFrost(off|always)`)
drive the same wrappers.

## 6 · The line estimate (said honestly)

| where | before | after (est.) |
|---|---|---|
| `lab/accent-wheel.js` → `lab/look.js` | 152 | ≈ 75 |
| `lab/rack.js` (setTheme, setCardStyle / applyCard / cardChosen / defaultCard / frostMode, setFrost, setDisconnected, applySettings' look block, the system listener, the badges / hints toggles, the wheel destructure) | 5,495 | ≈ −60 |
| `lab/first-run.js` (storedCard, storedFrost, bootMaterial move to the lift) | 66 | ≈ 50 |
| `lab/native-ui.js` (HELP's own key) | 204 | ≈ 200 |
| `lab/busy-mark.js` | 40 | 39 |

**≈ −160 lines** of `lab/*.js` (30,553 → ≈ 30,390), not the brief's −250 to −350: that figure assumed INTERFACE + THEME·SURFACE's
≈ 155 lines leave, but under road (a) and the hand law their controls stay in SETTINGS (only their own code leaves), and STAGE,
GAMMA, GAMUT, CAPTIONS, STAGE TEXT, FRAME / AXIS are the engine's, not the look's.

## 7 · Tests whose words change (their laws do not)

- `official-defaults-palette`: the saved case's `--glass-blur` reads `14px`, not `14.0px` (the kit's map writes `v + 'px'`; the
  same length), and it gains two fields proving the lift (the blob keeps no look key; `mir.gui` holds the seeded look).
- `first-run.test`: the reading-law judges (`storedCard`, `storedFrost`, `bootMaterial`) become `liftLook`'s; the wiring judge
  reads the new wiring (the store's defaults from FIRST_RUN; the phone crossing's override line).

## 8 · Commits

2 the kit's store and engine in (`look.js`, accent-wheel.js out) · 3 the lift + STATE-SCOPES + the probe's FAMILIES row ·
4 the SETTINGS surface on the store (first-run.js / native-ui.js shrink) · 5 the eight states measured · 6 lines, wave, BUILD.
