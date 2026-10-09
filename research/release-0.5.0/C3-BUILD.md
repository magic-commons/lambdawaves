# C3 · THE RACK, THE TRANSPORT, THE MENUBAR, THE KEYS AND THE KEYBOARD — build hand-off (2026-10-09, the second C3 builder, Opus 5.5)

**In ten lines.**
1. The rack is MIR's `createRack` (alpha.24): `#rack #rackL #floats` and the ◧ + ☆ chrome adopted by id, every `.dev` registered in place, the `layout` verbs aliases over it, `captureLayout`'s v3 still the WORKSPACE record.
2. The `history` red the first builder paused on was a measurement inside the kit's rack motion (a card's height animates 320 ms when its content grows), not a state change; block 1b now reads the card at rest — 42/42.
3. The kit's rack hands the scene guard its two columns (C9's open item); input's synthetic presses moved off `#rackL`; the CAMERA card stays adopted in place (C1's open item, resolved: the kit would register a second `camera`).
4. The menubar is the kit's `createMenubar` over λWAVES' MENUS rows; `menubar.js` and the `ACTIONS.find` fallback left; N1's focus hand-back stays as app glue (brief M1).
5. The transport stays λWAVES-built (C3-DESIGN §4, accepted by the integrator): `createTransport` would empty the bar and draw four parts λWAVES draws differently (briefs T1, T2).
6. The keys are MIR's ONE KEY TABLE through `lab/key-table.js` (82 lines replacing `keys.js` + `shortcuts.js`, 173): A9's rows, Ctrl vs Mod, the fine step, the binding law, the 0.4.0 save lifted.
7. The KEYBOARD window is the kit's `createKeyboardWindow` on `#floats`; λWAVES' charcoal-blue skin re-aimed at the kit's DOM in `lab.css` §KEYBOARD (R5-S3); `keymap.js` (878) left.
8. `keyboard-window` rewritten wholesale (8 + GREEN), `keyboard-shortcuts` re-aimed with the NEW Ctrl-vs-Mod case (6), `access` A7/A11 re-aimed (11/11).
9. Parity probe base vs tip: 219 lines, every one a z-index, a visible-window home index, `dockIndex`, or their rack-order fallout; the WIGNER hint was timing. Stylehash: 0 element-properties changed in 8 states.
10. `lab/*.js` **30,553 → 29,057 (−1,496)** over C3; this session 30,119 → 29,057 (−1,062). No blockers. Nothing merged, pushed, tagged or deployed.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a85bd972b2222e143` |
| branch | `worktree-agent-a85bd972b2222e143`, reset to `59717ae` (the first builder's tip on `worktree-agent-ab53b6b1093934d5b`), from `f0fcbc4` |
| `8e55952` | the design hand-off (`C3-DESIGN.md`, `tools/a4-window-probe.mjs`) — the first builder |
| `124f691` | WIP step 2, the rack is the kit's `createRack` — the first builder |
| `d75d3f7` | the rack is the kit's createRack — the history red read and fixed; step 2's gates green |
| `59d6758` | the kit's rack hands the scene guard its columns (C9); the CAMERA card stays adopted in place (C1, resolved) |
| `b9fa26d` | step 3: the menubar is the kit's `createMenubar`; MENUS on the kit ids; the transport stays λWAVES-built |
| `1addffd` | step 4: the keys on MIR's ONE KEY TABLE (`lab/key-table.js`), the KEYBOARD window the kit's, its skin λWAVES' |
| hand-offs | `59717ae` (the first builder), `425537f`, `565b0aa`, `841c7d7`, `18d5081`, and the docs commit (this file + REPORT wave 205 + the final hand-off) |
| gate servers | 8883 (this tree, pid 4082571) and 8887 (`.tmp/base` = `f0fcbc4`'s lab/tools/tests, pid 4131214), started by me, stopped by pid at the end; two plain `http.server`s on 5353/5357 for stylehash (pids 114367, 114389), stopped |

## The history red: cause and fix (`d75d3f7`)

`tests/history.browser-test.mjs` block 1b: "the card grew from 408 to 340.2 px".
- The kit's `createRackMotion` (`lab/mir/shell/rack.js`) observes every card's head and body with a ResizeObserver and animates the
  card's HEIGHT for 320 ms when it changes — content growing included (BASINS' motion, Josh 10-02).
- The HISTORY list growing 1 → 13 rows animates the card **190 → 408 px** (`.tmp/diag-hist.js`: one running animation
  `["190px","408px"]`; read 33 ms in, 280.1 px; at rest 408).
- `h12` was read before the ResizeObserver delivered (the natural 408); `h25` one frame later, inside the animation.
- Fix: the block reads both heights **at rest** (`__rest`: two frames, then the card's own animations finished). The exact equality and
  the 250.5 px list bound are unchanged. Nothing in the edit scope or the rack's state moves when a row commits: undo and redo are
  byte-identical in all 42 blocks and the rebuild counts are unchanged (1× for the five modulation scenes, 0× elsewhere).
- The WIP's `lab/sw.js` hash for `rack.js` was stale (pwa red on the tip until `--write`).

## The rack (`124f691` + `d75d3f7` + `59d6758`) — the kit calls as used

`createRack({ host: #lab, favourites: 4, handle: 'never', tabletClamp: false, phone: isPhone, retired: RETIRED_WINDOWS, notebook, store,
onChange: occlusion.dirty })`, then `rk.register({ id, el: device(), title, hint })` for every `.dev` in place, the TRANSPORT as
`card: true` (its pop chip and fold save are λWAVES'), HISTORY where it is built; `rk.start()` before `syncPhone()`.
- **The `layout` verbs over the kit:** `toggleRack` → `setHidden`; `popOut` → `float`; `dockWindow` → `dock`; `toggleFloat`, `setCompact`,
  `floating`, `floatOf` → the kit's; `moveFloat` → `dock` + `float` in the same layer seat (R1); `raise` → `raise`; `reopen` → `open`;
  `dockAll` → `floating()` + `dock`; `layouts`/`saveLayout`/`forgetLayout` → the kit's; `layoutLabel` → `layoutLabel(readLayout(…))`;
  `resetLayout` → `resetLayout` + the transport's dock; `applyLayout` → `apply` + `layoutExtras` (the transport card's seat, closed and
  fold; MOLECULES' MORE and MO-REGISTRY's CORE folds); `captureLayout` stays the v3 record; `addMenu`/`favMenu` are the kit's.
- **The store** is an adapter on `lambdawaves.q0.settings`: `get()` hands the kit the ☆ slots and no layout (a reload keeps only
  `closed`, as before); a slot the kit captured is written as `captureLayout()`'s v3 of the same instant, so every ☆ slot stays a record
  0.4.0 reads.
- **What left:** the float state and helpers, the hands (reorder drag, float drag, their pumps), the rack half of the peek, the phone
  crossing's card and float moves, `rack-menus.js` (110).
- **C9's open item:** `uiSpace({ rack: rk, extra })` — the columns (less their shadow gutter) and the float layer. λWAVES' columns are
  height-auto and pointer-solid, so a real press in one reaches the rack, never the canvas: nothing a hand does changes.
  `tests/input.browser-test.mjs` pressed synthetically at (120, 120) — `#rackL`'s column at 1280×900 — and now presses the open stage
  (560–660, 420).
- **C1's open item (resolved, not taken):** λWAVES' CAMERA card carries CAPTURE, SET Δρ REF and its note beside the panel's rows and is
  already the kit rack's window; `createCameraPanel({ rack })` would register a second `camera` (the kit's `register` throws on a repeated
  id) or split CAPTURE out of the card (the hand law). The panel's rows stay built in with `spec.build`.

## The menubar (`b9fa26d`)

`createMenubar({ opener: #title, host: #lab, phone: isPhone, menus })` — the kit's port of this app's bar; the same DOM
(`nav#menubar.menubar`, `.mb-*`), so `lab.css`/`skin.css` paint it as before; the aria-label the kit composes from `.lam` + `.word` is the
string λWAVES wrote. MENUS stays λWAVES' rows (FILE · EDIT · VIEW · WINDOW · ABOUT; LANGUAGE hidden by not naming it, R5-S2); each row's
act is wrapped to hand focus back to the wordmark (N1: the kit closes the bar before the act and returns focus only on Escape — M1); the
recent-project rows are `raw`. `layout.menu` keeps `{ open, close, isOpen, scale, enlarged }`. The kit's own phone crossing replaced
`enterPhone`'s `showMenuBar` call. A9's open items: the four calls renamed (`transport.play`, `hide`, `modulation`, `help`), the
`ACTIONS.find` fallback deleted (`was` stays for saved bindings), the dock button and the modulation door tagged `data-key-action`.
On a phone (500×930) the bar, its five groups, the wordmark and both racks sit at base's pixels; the kit adds `--menubar-bottom: 36px`
on `<html>` (λWAVES' rack does not move) and the bar's `max-width` (its wrap guard).

## The transport — stays λWAVES-built

C3-DESIGN §4, accepted by the integrator: `createTransport({ layout: LAMBDAWAVES_LAYOUT })` empties the bar and builds the kit's parts;
four are not λWAVES' (the ▶ text vs the kit's glyph, the MOD word vs BASINS' power ring, BASINS' tempo panel vs `native-tempo` — which C2
is rewriting beside this wave — and the dock without λWAVES' side/index memory), and it adds parts λWAVES never had (a ⋮ seat menu,
openers). "Keep the Transports as they are per each app" (Josh 10-01) and the hand law keep it λWAVES'. The one clock is C4's, untouched.
Briefs T1 (`createTransport({ adopt: true })`) and T2 (the dock's memory) carry it.

## The keys and the keyboard (`1addffd`) — the kit calls as used

**The table:** `lab/key-table.js` `createKeyTable({ rows: ACTIONS, stageHasFocus, edit: keyEdit })` → `createKeys({ actions, storage,
platform })` with each row as `{ id, label, group, short, keys: chordsOf(row), inFields, repeat: true, overControls: true, when, run }`:
- `ctrl: true` → `Mod` (⌘ on a Mac, Ctrl elsewhere); `ctrl: 'Ctrl'` → `Ctrl` (the Control key): **the NEW Ctrl-vs-Mod case** — on a Mac
  ⌘⇧Q never runs the dolly zoom, off a Mac Ctrl+Shift+Q is `Mod+Shift+KeyQ`.
- A row with no `shift` is its chord AND Shift+chord; every run reads Shift as 0.25 (the fine step, as `keys.js` did). Held keys repeat.
- `overControls` on every row: a focused control keeps a key only by acting on it (the kit's knob, seg and fader prevent the default),
  a control that will not act yields it (wave 68), Space is the transport's over any control (wave 88); a focused `<select>` yields Space
  through a three-line listener (the kit counts a select a field — K2). The stage rows run on the stage alone (`when`).
- **The binding law** (CLAUDE.md) over `__LW.keys.bind(id, spec, { steal })`: an overlap refused unless the steal is explicit (naming the
  holders), Tab on any chord / Escape / a modifier alone refused, window cycling on Tab alone, a saved chord another row holds by default
  dropped on read.
- **The save** stays `lambdawaves.q0.keys` (PREFERENCE): a 0.4.0 `{ id: { key, ctrl, alt, shift } }` (or an old id's, through `was`) is
  lifted into `{ id: [chords] }`; the kit writes its difference, nothing when there is none.
- The rows' `key/ctrl/alt/shift` follow the table; the menus and the history's names read `kt.keyText(id)` (the kit's display, '?' kept
  for Shift+/, '—' unbound); `table.hints(document)` writes `aria-keyshortcuts` on every `[data-key-action]`.
- `__LW.keys` keeps `actions, bind, conflicts, reset, name, capturing, tabOrder, resetTabs, toggleUI, cycleWindow`, + `table` at the end.

**The window:** `createKeyboardWindow({ keys: kt.window, host: #floats, onMoved, persist })` — the kit's pane (a 1.5 window, its rail
the grip and the close), board, platform switch, RECORD / RESET, search and list, the steal on a second press, Escape's three steps, the
drag. `kt.window` is the table with each fine row's Shift twin out of sight (the badges and chips 0.4.0 drew; a chord recorded there is
the chord alone, as 0.4.0's recorder wrote it) and λWAVES' stage rule in its check. Its place stays `lw.keyboard.position.v1` (`{ x, y }`);
focus goes in on open (the board's key, or the list on a phone) and back on close; Escape from outside still closes it and from the stage
blurs the canvas (wave 57). On `#floats` it is UI space for the scene guard. A7's `keymap` provider masks the pane and its rail chips,
and their `hidden` (landing when the exit motion ends) dirties a paused mask — the rewritten suite caught the stale hole.

**The skin (R5-S3):** `lab.css` §KEYBOARD re-aimed at the kit's DOM, unlayered over `keyboard.css`: `.km-panel` → `.km-win`, `.km-columns`
→ `.km`, the platform switch onto `.km-platform .seg`, `.km-btn-main` onto the trig's `.trig-l`, `--bad` on `[data-tone="conflict"]` and the
recording button, the empty status hidden (CLAUDE.md), the list's names in capitals; the header/close/`#keymap` rules gone; `skin.css`'s
three card backgrounds re-aimed. The bound key's LED dot stays: C0's adopt put it on λWAVES' DOM, so base shows it.
Screens (`.tmp/kb-light-compare.png`, `kb-dark-compare.png`, `kb-phone-compare.png`, not committed): the same keys, dots, badges,
wells and list. **What Josh will see:** no header bar — the kit's rail on the left (on a phone above), the title the window's name; the
board centred in its taller well; a ctrl badge reads `Ctrl` (the kit's `modText`) where 0.4.0 wrote `⌃`.

## The parity probe (`tools/a4-window-probe.mjs`, base 8887 vs tip 8883)

`.tmp/probe-base2.json` / `.tmp/probe-tip2.json`, diff `.tmp/probe-diff2.txt`: **219 lines** (the first builder's 220 less the WIGNER line),
every one of these, each a verb that legitimately changed:
- **float `z`** (and the `zs` z-index): the kit's ONE raise stack, the stack index 0…n−1, where λWAVES ran a counter up from 1;
- **the home `index`**: the kit counts VISIBLE windows; λWAVES counted the hidden TRANSPORT card at the head of `#rackL` (1 → 0);
- **`dockIndex`**: read on the settled rack (5 → 2, 4 → 2);
- **their fallout in rack order**: step 5 (SHADOW docked home at its visible index), step 11 (the transport docked at its settled
  index: TRANSPORT before ORBITALS), steps 12–15 (RESET keeps the right rack's order and appends the left's, so WIGNER, SPECTRUM and
  SHADOW sit where they docked home). No card changes side, open state, fold or power in any step.
- **The WIGNER status hint** (WINDOW menu, "WIGNER · numerical · a slice, not a marginal" → "WIGNER" in the first builder's diff) does
  not differ in this run: timing (the status was not yet computed when the menu was read).

## The stylehash (MIR 1.5 `tools/stylehash.mjs`, 8 states, against `.tmp/base`)

Served over plain HTTP (5357 base, 5353 tip; the kit's launcher has no `--ignore-certificate-errors`), `--gpu 1`, λWAVES' theme and card
hooks, a second base capture as noise: **0 element-properties changed, 0 gone, in all 8 states (903 elements each)**; 1 new element per
state, `div.mir-rack-grip` (the kit rack's drag grip: fixed at −8,−8, 1×1, transparent — invisible). Pixels: 0 in seven states; 280
(max 10/255) in dark-tinted-off, inside `canvas.shadow-c` (the SHADOW card's own plot: its dot and trail, one more frame before the pause
on the tip's boot) — reproduced on a second tip capture, after a 1.5 s settle, and with `#field` hidden; canvas content, not chrome.

## Tests (8883/5353; base 8887/5357; one browser at a time, 4 s apart)

| gate | result |
|---|---|
| `history` | **42/42** (after the fix; again after step 4) |
| `frame-occlusion` | **7/7** (after step 3 and after step 4) |
| `menubar` | **8 + GREEN** (after step 3 and after step 4) |
| `keyboard-window` (rewritten) | **8 + GREEN**; one run died in the driver on its reload (`POST …/url -> 500 … Failed to decode response from marionette`), **re-run alone: green** |
| `keyboard-shortcuts` (re-aimed) | **6 PASS** |
| `input` | **13/13** (after the C9 change and after step 4) |
| `offer` | **16 of 16** (after step 3; again at the end) |
| `new-project` | **8/8** · `node tools/new-project.mjs --check` in step (16,329 B) |
| `take-in-bugs` | **4 + GREEN** |
| `latex-copy` 10 · `molecular-names` 6 · `export3d` 10 | green (they drive the menubar) |
| `tools/hit-probe-set.mjs` | **52 gap presses, 0 reached** (control 3/3) — after step 2, the rack in UI space, and step 4 |
| `tools/settings-probe.mjs` | **0 of 6 scenes red** (after step 2 and after step 4) |
| node gate (`bash test.sh node`'s set, per suite) | **82/82** (`access` A7/A11 re-aimed in step 4) |
| digest lock | not run — C7's is the one lock of C |

The first builder's one timing red (frame-occlusion at the paused rack-drag check) did not recur in the two runs here.

## Lines

`cat lab/*.js | wc -l`: `f0fcbc4` **30,553** → `124f691` 30,119 → `b9fa26d` 30,033 → `1addffd` **29,057** (**−1,496**; this session −1,062).
`rack.js` 5,495 → 5,163 (−332) · `keymap.js` −878 · `keys.js` −130 · `menubar.js` −88 · `rack-menus.js` −110 · `shortcuts.js` −43 ·
`key-table.js` +82 · `sw.js` +3. `lab.css` 907 → 895. C3-DESIGN §7 estimated −1,580 net with the transport; without it, −1,496.

## Blockers

None.

## Brief candidates (for the kit)

- **R1** `rack.moveTo(id, x, y)` — a float's move (λWAVES' `moveFloat` is `dock` + `float` in the same seat).
- **R2** `rack.parked()` — the floats the phone crossing parked (the kit's `phoneMem` is private; λWAVES reads them one listener ahead).
- **R3** `windowMenu({ order: 'rack', hint: fn })` — the WINDOW rows in rack order with each window's live status.
- **R4** `createRack({ extra: { capture, apply } })` — a ☆ load re-applies an app's extras (the transport's dock, the MORE/CORE folds).
- **R5** the + list prunes `hidden` cards (a legacy card, one a molecule stood down).
- **R6** register a bare `.dev` without re-clicking `.dev-fold` inside a programmatic click (the browser drops the nested click).
- **T1** `createTransport({ adopt: true })` — keep the bar's own children, add only what is asked. **T2** the dock's side/index memory.
- **P** THE PAINT GESTURE (`paintStroke`): not in alpha.24; `lab/paint-stroke.js` stays the interim, the brief stays open.
- **M1** `createMenubar` hands focus back to the opener after a row's act when the act left it on the vanished item (λWAVES N1).
- **K1** `ownsKey` skips a disabled / `aria-disabled` control (wave 68); λWAVES gets it by `overControls` on every row.
- **K2** a focused `<select>` yields Space to an `overControls` action (wave 88); λWAVES' three-line listener.
- **K3** an action's fine step as data (`fine: true`: the chord and Shift+chord as ONE binding the window draws once and records whole).
- **K4** the ctrl badge's text: `modText` writes `Ctrl` (it overflows a key top beside ⇧) where the legend draws `⌃`.
- **W1** a window's "hidden" moment: `onMoved(null)` fires as the exit starts; an end-of-exit signal would spare hosts the `hidden`
  observer (C4 met the same).

## Open items

- **C2 (settings-store.js, not edited here):** `FAMILIES` still names `keys.js` and `keymap.js` as the owners of `lambdawaves.q0.keys` and
  `lw.keyboard.position.v1`; both keys are unchanged, and the owners are now `lab/key-table.js` and `rack.js` (the keyboard window's persist).
- The KEYBOARD window's chrome (no header bar, the rail) is the kit's: Josh may rule it (R5-S3 named the pane the kit's).
- `?` opens the window and focuses the board; ADOPTING §11's split of `help` and `keyboard` stays as A9 left it (both open this window).
- A rebinding saved by 0.5.0 is the kit's shape; a 0.4.0 build reading it keeps its defaults (its loader ignores an array).

## CLAUDE.md, drafted for the integrator (not applied) — replaces the keyboard-editor paragraph and the floating-rack sentences

> The rack is MIR's `createRack` (0.5.0 C3): every `.dev` registered in place, `layout`'s verbs aliases over it, captureLayout's v3 still
> the WORKSPACE record; the menubar is `createMenubar` over MENUS; the transport stays λWAVES'. Keys are MIR's ONE KEY TABLE via
> `lab/key-table.js` (ACTIONS: `ctrl: true` Mod, `'Ctrl'` the Control key; no `shift`: Shift is the fine step; every row `overControls`;
> an overlap binds only on an explicit steal; `lambdawaves.q0.keys` lifts 0.4.0's shape). The KEYBOARD window is the kit's
> `createKeyboardWindow` on `#floats`, painted by `lab.css` §KEYBOARD (unlayered: five rows in 416 px, legend + switch on one row,
> centred RECORD / RESET, status only when needed); its occlusion follows its drag and its close. Run `keyboard-shortcuts`,
> `keyboard-window`, `menubar` and `history` after touching any of it.

## Exact next step

Claude Sos (integrator, `sos-s0` = `yan-c`) merges `worktree-agent-a85bd972b2222e143` (tip: the docs commit after `18d5081`). `lab/sw.js`
is the standing conflict: take either side, then `node tests/pwa.test.mjs --write`. C2 and C6 touched other regions of `rack.js` from the
same base (`f0fcbc4`); expect hunks near the PROJECTS/notebook block (C6) and the SETTINGS/INTERFACE sites (C2). After the merge: the node
gate, `history` 42, `keyboard-window`, `menubar`, `frame-occlusion` 7, `input` 13, `offer` 16, `new-project` 8, the hit-probe set; then
apply the CLAUDE.md paragraph above.
