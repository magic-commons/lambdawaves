# C3 · THE RACK, THE TRANSPORT, THE MENUBAR, THE KEYS AND THE KEYBOARD — the design hand-off

Written 2026-10-08 by the C3 builder (wave 205) on `f0fcbc4` (`yan-c` with C0, C1, C4, C5, C9 and D9 merged), before any
`lab/` code.  It re-measures A4's map on this sha, confirms the verb → kit-twin table against the kit AS ADOPTED
(MIR 1.5.0-alpha.24, `lab/mir/shell/rack.js` 1,196 lines), and fixes what each later commit does and what it leaves.

## 1 · The map, re-measured (`lab/rack.js` 5,495 lines on `f0fcbc4`)

| lines | what | fate in C3 |
|---|---|---|
| 326–333 | `RETIRED_WINDOWS` `{ style: 'observer', dynamics: 'shadow' }` (D9 did not grow it: QCD/H₂⁺/HELIUM were DELETED, not retired) | stays; handed to `createRack({ retired })` |
| 3209–3214 | the banner, `rackL`, rack scroll → `gov.scroll`, `body.rack-l`, `LAYOUT_SLOTS = 4` | stays (rack chrome); `LAYOUT_SLOTS` → `favourites` |
| 3217–3264 | `floats`, `refreshOcclusion()` and the occlusion providers (A7) | stays; gains ONE filtered observer (a card's own `style`/`class` on `#floats`/the racks: the kit's drag writes `translate`, its fold animates a height — the paused-PRESENT law) |
| 3265–3323 | `floatState`, `floatZ`, `devById`, `rackCardWidth`, `clampFloat`, `placeFloat`, `raiseFloat`, `frontFloat`, `popFace`, `railFace`, `enterWindow` | LEAVE (the kit's float layer, ONE raise stack, clamp, chip faces, entrance); a 6-line transport-only `popFace` stays |
| 3324–3605 | the `layout` literal | the verbs become one alias block over `createRack`; `captureLayout` (the v3 record) and `applyLayout` (its λWAVES extras) stay as glue; `digest`/`copyText`/`copyDigest` stay |
| 3606–3611 | `winHint`, the transport card `wTr` | stay (WINDOW rows; the transport is λWAVES', §4) |
| 3612–3633 | `#rackToggle` click, skip links, `#rackPeek` pointerenter, the pill's dock button | the toggle and `#rackPeek` LEAVE (the kit's `chrome` and peek); skip links and the dock button stay (its DOM seat before `mod-exp`) |
| 3634–3664 | `mod-exp` and `layout.modulation` (C4) | stay |
| 3693–3736 | MENUS + `installMenubar` | MENUS stays (λWAVES' rows, A9 ids); `installMenubar` → the kit's `createMenubar` (§5) |
| 3737–3772 | the keyboard editor pane (`createKeymap`) | → the kit's `createKeyboardWindow` (§6) |
| 3769–3772 | `installWindowChrome` (LEAN, KIND — not the rack), `devclose` save, `installRackMenus` | window-chrome stays (not a window verb: `copyDigest`, the LEAN pass); `installRackMenus` LEAVES |
| 4057–4100 | the hidden rack's peek (rack half + the transport's half) | the rack half LEAVES (the kit's `peekSide`); the transport half stays (it follows modDodge's `at-top`) |
| 4101–4250 | THE RACK'S HANDS: reorder drag + its pumps, pop/rail chip loop, float drag + pumps, resize re-clamp | LEAVE (the kit's ONE gesture, its motion, `refit`) |
| 4252–4390 | the phone crossing (`phone.floats`, card moves `data-phone-from="L"`, transport, frost/grid/DPR) | the card moves and the float memory → `createRack({ phone })` (kit marker `left`); the low-power half and the transport stay |
| 4412–4521 | ACTIONS (A9) + `installKeys` | ACTIONS stays (the rows the kit reads); `installKeys` → `createKeys` (§6) |
| 4542–4557 | `cycleWindow` (TAB) | stays; `frontFloat`/`raiseFloat` → `rack.floating()` / `rack.float(id)` |

Outside callers on this sha (rack.js): 711 `docked` · 1191 `resetLayout` · 2165–2166, 2273 legacy un-hide by `raise`/`reopen` ·
2353 `docked` (stage text) · 4620 `captureLayout` · 4813–4814 `notebookResize`/`applyLayout` · 5100 `orderAll`/`closed` (boot) ·
5294 `moveToRack('spectrum','L')` · 5048 `wHist` (HISTORY, built late: registered where it is built — A4's open item fixed).
`tests/` + `tools/` call `__LW.layout.*` 467 times over 41 members (`notebook` 57, `raise` 41, `reopen` 30, `modulation` 29,
`menu` 29, `projects` 25, `popOut` 23, `floating` 21, `moveToRack` 19, `phone` 17, `toggleRack` 16, `dockTransport` 16,
`docked` 15, `dockAll` 15 …): every one stays (the `__LW` law).

## 2 · The verbs → the kit's twins (alpha.24, confirmed in `lab/mir/shell/rack.js`)

`createRack({ host: #lab, store, favourites: 4, chrome: true, handle: 'never', tabletClamp: false, phone: isPhone, retired:
RETIRED_WINDOWS, notebook })`; every `.dev` is `register({ id, el, title })`-ed IN PLACE (adopt: nothing rebuilt, its rack,
place, classes and listeners kept).  The TRANSPORT card and the hidden LEGACY cards (H₂, ELECTROSTATICS) register as
`card: true` (they keep their own buttons and are listed in neither + nor WINDOW — CLAUDE.md's "do not re-list them").

| λWAVES verb (kept as the alias) | kit twin | what changes, legitimately |
|---|---|---|
| `toggleRack` | `setHidden(!hidden)` | — |
| `moveToRack(id, side)` | `move(id, { side, index: ∞ })` | the kit refuses a floating card (λWAVES appended it, floating, into a column) |
| `moveCard(id, i)` / `side(id)` | `move(id, { side:'right', index })` / `window(id).side` | the kit's index counts the VISIBLE windows (λWAVES counted closed and hidden cards too); on a phone `side` names the home ('L'), not the one rack |
| `popOut(id, at)` | `float(id, at)` (home side mapped L/R ↔ left/right) | z is the kit's ONE raise stack (`registerWindow`): a card and the modulation window can no longer tie |
| `dockWindow(id, drop)` | `dock(id, { side, index })` | — |
| `toggleFloat`, `setCompact`, `floating`, `isFloating`, `floatOf` | `toggleFloat`, `setCompact`, `floating`, `floatOf` | `floatOf().z` is the stack index |
| `moveFloat(id, x, y)` | none — `dock` + `float({ x, y, w, compact, home })` | the moved float comes to the front; BRIEF candidate R1: `rack.moveTo(id, x, y)` |
| `raiseFloat(id)`, `raise(id)`, `reopen(id, side)` | `float(id)` (a float), `raise`, `open(id, { side })` | `raise` of a CLOSED window now enters with the kit's 6-px rise (BASINS'); λWAVES' `.dev-enter` (7 px + fade) retires; both still un-hide a legacy card by id (glue) |
| `dockAll(remember)` | `floating()` + `dock` per id | — |
| `retired` | `createRack({ retired })` | the kit's `readLayout` drops a retired id when its heir is named, as `heirOf` did |
| `captureLayout()` | stays glue (the v3 WORKSPACE record, §3) | float `z` = stack index |
| `applyLayout(L)` | `apply(L)` + glue (`docked`, `more`, `core`, the `card: true` windows' closed/fold/power) | — |
| `layoutLabel`, `layouts`, `saveLayout`, `loadLayout`, `forgetLayout` | `layoutLabel(readLayout())`, `layouts`, `saveLayout`, (glue) `applyLayout`, `forgetLayout` | the ☆ list is the kit's: its star is the drawn `starFill` (Josh's call 18), not a typed ★ |
| `resetLayout()` | `resetLayout()` + glue (the transport's dock, the legacy cards) | — |
| `closed()`, `order()`, `orderAll()` | DOM queries, kept | — |
| `addMenu` / `favMenu` | the kit's `addMenu` / `favMenu` | + opens a window into the rack it was in (λWAVES always opened into the right rack; its own header said "the rack they came from") |
| `phone.parkedFloats` | the kit parks floats across the crossing (its `phoneMem` is private) | glue reads the stack one listener ahead of the kit's; BRIEF candidate R2: `rack.parked()` |
| `hint`, `windowMenu()` | NOT the kit's `windowMenu()` | the kit lists registration order with a static hint; λWAVES' WINDOW rows read the rack's order (floats, left, right) and each window's live status — the hand law keeps them; BRIEF candidate R3: `windowMenu({ order: 'rack', hint: fn })` |
| `wire()` (the hands) | `createRack` wires itself (`adopt`) | the reorder rule is THE TITLE BAR DECIDES (Josh 10-02), BASINS' motion (folds animate their height, neighbours FLIP), a header is a tab stop with ↑ ↓ ← → Enter |

The five 0.4.0 names (`popOut`, `dockWindow`, `reopen`, `captureLayout`, `applyLayout`) and every other verb stay on
`layout` (= `__LW.layout`) in ONE alias block.  Peek: the kit's (`rack-peek` + `-left|-right`: λWAVES' sheets key on
`rack-peek` alone, so both columns still show); near 44 px / hold 48 px (λWAVES 60 / 24).

## 3 · The WORKSPACE record

`createRack({ store })` is an adapter on `lambdawaves.q0.settings` (A1's `createSettingsStore`; WORKSPACE keys
`closed, layouts, nbW, nbH, abW, abH, modwin, phoneTr, phoneRack` unchanged):
- `get()` → `{ favs: settings.layouts }` and NO `layout`: a reload keeps only `closed` (λWAVES' law, written by
  `saveSettings` from the DOM as before), so `start()` arranges nothing an adopted window did not already say.
- `set(v)` → writes `settings.layouts` when the favourites changed.  A slot the kit just captured (its `v: 1`) is
  replaced by `captureLayout()` — the same instant, the v3 shape — so every ☆ slot stays a 0.4.0 record (sides `L`/`R`,
  `closed`, `docked`, `more`, `core`) that 0.4.0 can read.
- the project's `layout` part stays `captureLayout()` (`{ v: 3, at, cards[{id, side, folded, closed, off, float, more?,
  core?}], docked, rackHidden, nb }`), read back through `applyLayout` → the kit's `apply` (whose `readLayout` takes
  `L`/`R`, `closed`, `rackHidden`, `nb` and the retired ids as they are) + the extras.
- `onChange` → `saveSettings()` + `occlusion.dirty()`: a kit-side act (+ open, a drag, ×) writes `closed` as a λWAVES
  verb did.

What `readLayout` repairs: unknown and repeated ids dropped; a retired id resolves to its heir unless the heir is named;
`float` numbers rounded, `w ≥ 120`; `nb` kept when a size.  What it drops and glue restores: `docked` (the transport),
`more`/`core` (MOLECULES' MORE fold, MO-REGISTRY's CORE fold).  The ☆ menu's own LOAD goes through the kit; one listener
on `#rackFavList` re-applies those extras from the raw slot (BRIEF candidate R4: `createRack({ extra: { capture, apply } })`).

## 4 · The transport: part list vs `LAMBDAWAVES_LAYOUT`

| today (rack.js §25 + native-ui.js) | `LAMBDAWAVES_LAYOUT` part | same? |
|---|---|---|
| `.tbtn.play` '▶' text | `play` (the kit's glyph, `PLAY_ACTION`) | NO — glyph vs text |
| `.tbtn.modb` 'MOD' word (`setModArm`) | `power` (BASINS' ring-and-stem `.mir-mod-power`, `mod.arm`) | NO — a different drawing |
| `.transport-home` (rewind SVG) | `rewind` | yes (needs `clock.seek`) |
| ‹ › SCRUB, RATE, t, REPEATS | `app:back` … `app:rate` | yes (app nodes) |
| `.tempo-expand` pill + `.native-tempo` panel (×2/÷2 bends, HOLD ¼/1, SYNC, cadence, TAP, repeat maths, macro tiles) — native-ui.js | `tempo` + `panel` (BASINS' tiles) | NO — BASINS' panel |
| — | `openers`, `seat` (a new ⋮ button, right-click and long-press seat menus) | NEW parts λWAVES never had |
| `.dock-btn` ('north' chip, `dockTransport` with `dockSide`/`dockIndex` memory) | `dock` (the DOCK_ID window, `open(…, { index: 0 })`) | NO — no side/index memory |
| `.mod-exp.mod-logo` (the mark) | `door` (`mark: 'mark'`) | yes |

`createTransport` empties the bar (`bar.textContent = ''`) and builds its parts, adds `mir-transport` (transport.css
restyles the bar), a way-back, a seat menu, a roving tab stop.  Four of λWAVES' parts are not the kit's; handing all of
them in as `app:` nodes leaves the kit's shell adding only parts and looks λWAVES never had — the opposite of "keep the
Transports as they are per each app" (Josh 10-01) and of the hand law.  And C2 is rewriting `native-ui.js` (which builds
the pill and panel) beside this wave.  So: **the transport stays λWAVES-built in C3**; the one clock is C4's
(`appPlay`/`mod.follow`) and is untouched.  BRIEF candidate T1: `createTransport({ adopt: true })` (keep the bar's own
children; add only what is asked) + T2: the dock's side/index memory.  Step 3 is the menubar alone.

## 5 · The menus

`createMenubar({ opener: #title, host: #lab, menus: MENUS, phone })` replaces `lab/menubar.js` (the kit's is its port:
same disclosure, 400 ms hover hide, placement from the untransformed width, Escape → the wordmark, the phone crossing).
λWAVES' rows stay data in MENUS: FILE · EDIT · VIEW · WINDOW · ABOUT, A9's ids through `keyFor`; NO LANGUAGE group
(R5-S2: the kit's LANGUAGE menu is hidden by not naming it).  `layout.menu` = `{ open, close, isOpen, scale: 1.04,
enlarged }` over the kit's api; `__LW_hooks.showMenuBar` = `open(false)`.  The kit's `--menubar-bottom` is written only on a
phone.  `rack-menus.js` (+ and ☆) leaves for the kit's chrome (step 2).

## 6 · The keys and the keyboard

- **The ONE KEY TABLE.**  `createKeys({ actions, storage, platform })` reads A9's ACTIONS: `keys` from `key` + `ctrl`
  (`true` → `Mod+`, `'Ctrl'` → `Ctrl+`) + `alt` + `shift` (`true` → `Shift+`; `undefined` on a row whose `run` takes the
  fine step → both the chord and `Shift+chord`, the run reading `event.shiftKey` → 0.25); `inFields`; `stage` → `when:
  stageHasFocus`; `transport.play` → `overControls` (λWAVES wave 88: Space plays over a focused button); every run through
  `keyEdit` (S4's history naming).  **Ctrl vs Mod:** Ctrl+Shift+Q/E (dolly zoom) and Ctrl+Space (MOD arm) are `Ctrl+`,
  everything else `Mod+` — on a Mac `Ctrl` stays the Control key (⌘⇧Q logs out), elsewhere both are Ctrl.
- **Saved bindings survive.**  `storage` = an adapter on `lambdawaves.q0.keys`: `get()` lifts the 0.4.0 shape
  `{ id: { key, ctrl, alt, shift } }` (old ids through `was`) into `{ id: [chords] }`; `set()` writes the kit's diff.
  A chord a user set is never lost.  The steal stays explicit (CLAUDE.md): `__LW.keys.bind(id, spec, { steal })` asks
  `holders()` first and binds only on a steal; the kit's window steals on the second press of a taken chord.  The rows'
  `key/ctrl/alt/shift` are re-written from the table on `onChange`, so `keyName`/`keyFor`/the history names read the live chord.
- **The KEYBOARD window** = `createKeyboardWindow({ keys, host: #lab, onMoved: occlusion.dirty })` (the kit's pane, drag,
  Escape's three steps, the platform switch, the recording, the steal), with λWAVES' charcoal-blue skin as unlayered
  rules over the kit's `km-*` DOM in `lab.css` (R5-S3; C0: an unlayered rule beats every kit layer): five key rows in
  416 px, legend + icon switch on one row, centred subtitle-free Record/Reset above search, status only when needed, the
  phone's taller action-only editor.  `layout.keymap`/`layout.keysheet` keep their verbs.  `keymap.js`, `keys.js`,
  `shortcuts.js` leave.  No chord is invented for a kit window (HISTORY and KEYBOARD keep `key: null`).
- **`tests/keyboard-window.browser-test.mjs`, rewritten:** opens by ACTION (`?`), five rows drawn and the pane ≤ 416 px
  tall on 1920 × 1080; a real drag of the pane moves it and the occlusion mask follows; a recording of a free chord binds
  it (the table and `lambdawaves.q0.keys` say so); a taken chord asks, a second press steals and names the loser; Escape
  cancels the recording, then clears the search, then closes; the platform switch relabels the bottom row (⌘ ↔ WIN); a
  0.4.0-shaped saved binding loads.  **`tests/keyboard-shortcuts.test.mjs` re-aimed** at the kit's `parseChord`/`bindError`/
  the adapter, with the NEW Ctrl-vs-Mod case (Ctrl+Shift+Q stays `Ctrl+Shift+KeyQ` on a Mac, `Mod+…` elsewhere; ⌘⇧Q never
  runs the dolly zoom).

## 7 · Brief P, and the line estimate

KIT-BRIEFS P is THE PAINT GESTURE (`lab/paint-stroke.js`, 61 lines → a kit `paintStroke`).  MIR 1.5.0-alpha.24 carries
no such export (`grep -rn paintStroke lab/mir` is empty), so C3 consumes it the only way the brief allows: its own
"Interim" — the shared app module stays, the three adapters (ORBITAL, STATES, SPECTRUM) untouched, and the brief goes back
to the kit as still open.  Nothing in C3 duplicates the gesture.  Estimate: the rack block's verbs/helpers ≈ −330, the hands −150, the peek's rack half −20,
`rack-menus.js` −110, `menubar.js` −88, `keys.js` + `shortcuts.js` −173, `keymap.js` −878 ≈ **−1,750**; adapters and glue
back ≈ +170 (alias block, store and key adapters, the observer, the window's wiring) → **net ≈ −1,580** in `lab/*.js`;
`lab.css` changes only where the skin re-aims at the kit's DOM.
