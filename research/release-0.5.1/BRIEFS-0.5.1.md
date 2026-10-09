# BRIEFS-0.5.1 — every MIR brief candidate of the 0.5.0 build, consolidated (2026-10-09)

**What this is.** The one file the 0.5.1 plan's gate **G-K** points at (`PLAN-DRAFT-0.md` §1). The 0.5.0 build ("GUI Adoption", MIR 1.5.0-alpha.24 pinned) left its kit
needs scattered across some thirty research files; this lists all of them once. **For whom:** Josh's primary account, which writes the briefs into MIR on the 1.5
worktree's branch `worktree-mir-1.5` (R5-Q2, first option), and the 0.5.1 integrator, who reads Table A to see what Group II waits on. **The rule:** λWAVES never edits
`lab/mir/**`; a kit need is a brief (or a line here); the briefs are built in MIR, then ONE re-adopt happens when brief 8 lands (R5-G1, at most twice), and only then
does Group II of the plan open. **Written** 2026-10-09 against tree `07c1d7b` (`yan-c`), by a documentation worker; nothing under `lab/`, `tests/`, `tools/` or
`CLAUDE.md` was touched. The text of briefs 1–9′, 13, P, J, 18, 19, the three guide entries and the live-bound labels is NOT repeated: it lives in the vault note
`LAMBDAWAVES CLAUDE KIT BRIEFS FOR MIR 2026-10-08.md` (identical to `research/release-0.4.0/KIT-BRIEFS.md`).

**How to read.** Every kit `file:line` below was read on this tree (alpha.24) and matches its source unless marked **(src)**, the source's own claim, not re-read.
"0 hits" means `grep -rnF` over `lab/mir` found nothing. Suggested-brief numbers continue the vault's (the vault stops at 19; 10–12 and 14–17 were never used):
**20–35**, listed under Table B. Priority tag: **U** urgent (touches a 0.5.1 row, the one re-adopt, or can lose a user's file) · **N** next (a gap a λWAVES workaround
is carrying) · **L** low (hygiene, docs, tools). A row's last column starts **NEW** (a new suggested brief) or **FOLD** (an existing brief or another row covers it).

---

## Table A — the briefs the 0.5.1 plan WAITS ON (PLAN-DRAFT-0 §0 and Group II)

| # | brief | where its text is (vault note) | the λWAVES row that waits | λWAVES meanwhile | status in alpha.24 (grepped) |
|---|---|---|---|---|---|
| 1 | **13** INFORMATIONAL rack window and movable text | `## 13 · INFORMATIONAL rack window and movable text` | none in Group II (§0 lists it as lacking); D1 and D4 ship WITHOUT the window | the DISPLAY row (switch + SIZE, `molFormula`/`molFormulaSize`); D4 drags text through `layer.setEdit` | **ABSENT**: `createInfoWindow` 0 hits. The pieces exist: `createInfoLayer` info/layer.js:98, `addLabel` :730, `addBlock` :737, `setEdit` :750; `parsePage`/`showPage`/`greet` info/page.js:50/107/143 |
| 2 | **7-fix** no per-frame DOM writes while the camera turns (brief 7 as RE-WORDED; `setCheap` as first written "does not reach this number") | `## 7 · Transient labels, cheap layer and app-owned TAKE MODE` + `## Amendments from the 0.5.0 A0 spike, pass 2` → "Brief 7, re-worded" | **D1b** (labels that FOLLOW a turning camera: ≤ +10 % at 8 labels in the spike's cell) and the TAKE MODE half of **D5** | R6-L hide-while-turning: `freeze(true)`/hide while the camera moves or AUTO-ROTATE runs, `viewChanged()` once at rest (≤ 300 ms); THE FADE = a block's `hold` | **ABSENT**: `setCheap`, `ttl`, `data-take` 0 hits; `addLabel` takes no `ttl` (layer.js:730); `viewChanged()` still `kick()`s and `frame.write(paint)` (layer.js:755–762), so the spike's ≈ 63 DOM writes a frame (+115 % at 8 bare labels, CANARY-A0 PASS 2 §1) stand |
| 3 | **6** `recorder.overlay(i, ctx)` | `## 6 · recorder.overlay(i,ctx) — informational text in the film` | **D5** (film overlay + TAKE MODE; `drawCaption` leaves; the film verifier re-run; the lock, a film's bytes change) | `captionOver` inside `frame()` (capture.js:586) and `drawCaption` (:575): the plain-Unicode CAPTION, following the stage-text switch | **ABSENT**: 0 hits for an overlay hook; render/recorder.js header :29 documents only `frame(i, ctx)` (called at :290) |
| 4 | **4** `cells` | `## 4 · cells: periodic, quantum, readout and section layouts` | **D7** (the S3 cells and the S4b header retire, 38 lines) | hand-built cells in ATOMS, CALCULUS, SPECTRUM and MOLECULES' `.pal-nav` turners | **ABSENT**: `cells(` and `layout: 'cells'` 0 hits |
| 5 | **5** export the XY lattice | `## 5 · Export the XY lattice for every inlay` | **D7** (the pad with the lattice) | none: no λWAVES inlay mounts | **PARTIAL**: `createLattice` exists but is private (controls/xy.js:47, used by `xyPad` at :134); not exported |
| 6 | **8** `paintedSpace` — opens the ONE re-adopt | `## 8 · Painted space and changes while paused — adoption blocker` | **C8** (`paintedSpace` → `refreshOcclusion` −36; `frame-occlusion` 7) and the re-adopt itself (G-K) | A7's providers, `lab/occlusion.js` (40 lines, cap 32) under `refreshOcclusion` (rack.js:2944); the paused-PRESENT law | **ABSENT**: `paintedSpace` 0 hits. Neighbours that are NOT it: `rack.keepClear()` shell/rack.js:1153 (rects a new window should avoid) and `uiSpace` shell/scene-guard.js (input geometry, kept separate on purpose) |
| 7 | **18** label avoidance of the kit's windows, plus the block clamp | `## Amendments…` → "Brief 18 (new, confirmed)" | **D3'** (label avoidance; the λWAVES-side clamp leaves) | D3's own clamp: a label whose seat lands under a rack (`uiSpace`) is hidden, not moved; ≤ 8 labels by default | **ABSENT**: `avoid` narrows only BLOCKS (layer.js:327–340 `free()`, used by `placeBlock` :342); labels are unavoided; the block's beside-the-subject branch sets `b.rx` with no clamp (:354), so at shift ±1 it lands under a rack (the spike's second line stands) |
| 8 | **19** images in blocks | `## Amendments…` → "Brief 19 (new, 0.5.x)" | **D4'** (images in blocks) | D4 is text only | **ABSENT**: shell/notebook-render.js `nbSafeURL` refuses `data:`/`blob:`/`file:` (:10); `SVG` is not in `NB_TAG` (:5–7); a same-origin `<img src>` survives (:8) |
| 9 | **3** TO NOTEBOOK / PIN FROM WINDOW (window markdown) | `## 3 · Window markdown, TO NOTEBOOK and PIN FROM WINDOW` | **D2'** (the journal half of D2) | CALCULUS ⧉ copies THE PROSE FIGURE (`calculusMarkdown`) and the panels' digest copy; paste reaches the notebook | **ABSENT**: `copyMarkdown`, `toNotebook`, `pinFromWindow` 0 hits; the page model exists (shell/pages.js:29 `createPages`, :102 `pageFromNotebook`) |

**The other vault briefs, in the same pin** (none is a Group II wait, so one line each): **9′** `data-mir-offer` 0 hits (the `offer` case in C9 stays skipped; λWAVES keeps `.build`,
lab.css:59) · **J** `jetblack` 0 hits (`lab/palette-app.js` stays) · **P** `paintStroke` not in the kit (`lab/paint-stroke.js` stays) · **1** `createCameraLaw`/`bindStageGestures`
not in the kit · **2** partial: the CAMERA panel builds the PAN pad from `panX`/`panY` (panels/camera.js:305) but the 3-D HOME skips them (`homeIds`, :258) and `createCssPort`
(:55) has no shift · **live-bound labels** `params.subscribe`/`{{state}}` 0 hits · the **three guide entries** (BPM 30, Shift gear, `tx()`) were applied app-side in 0.5.0 (see the last section).

---

## Table B — NEW candidates from the 0.5.0 build (de-duplicated; ids are the source's)

Columns: **id** · the need (one sentence) · the kit file:line the source names · the λWAVES site and its workaround (lines) · the source file and section · suggested brief.
A merged duplicate is named inside its row's id (`+C6-2`).

### B1 · The rack and the windows

| id | need | kit file:line | λWAVES site and workaround | source | suggested |
|---|---|---|---|---|---|
| C3-R1 | `rack.moveTo(id, x, y)`: a float's move as one verb | shell/rack.js (`dock`, `float`; no move verb) | `layout.moveFloat` rack.js:3095 = `rk.dock(id)` + `rk.float(id, {x, y, …})` in the same seat | C3-BUILD "Brief candidates"; C3-DESIGN §3 | NEW 24 (N) |
| C3-R2 | `rack.parked()`: the floats the phone crossing parked | shell/rack.js:404, 1016, 1076–1080 (`phoneMem` is private) | rack.js:3006 `parkedIds` read one resize listener ahead of the kit's; `layout.phone.parkedFloats` :3630 | C3-BUILD; C3-DESIGN §3 | NEW 24 (N) |
| C3-R3 | `windowMenu({ order: 'rack', hint: fn })`: WINDOW rows in rack order, each with its live status | shell/rack.js:1090–1092 (registration order, static hint) | λWAVES' own WINDOW rows in MENUS (rack.js); "NOT the kit's `windowMenu()`" | C3-BUILD; C3-DESIGN §3 | NEW 24 (N) |
| C3-R4 | `createRack({ extra: { capture, apply } })`: a ☆ load re-applies an app's extras | shell/rack.js:348 `createRack` | `layoutExtras(L)` rack.js:3031 (called :3028, :3139): the transport's dock, MORE/CORE folds; the store adapter writes `captureLayout()` v3 | C3-BUILD; C3-DESIGN §3 | NEW 24 (N) |
| C3-R5 | the + list prunes `hidden` cards (a legacy card, one a molecule stood down) | shell/rack.js, the + list **(src)** | `retired: RETIRED_WINDOWS` rack.js:3007 | C3-BUILD | NEW 24 (L) |
| C3-R6 | register a bare `.dev` without re-clicking `.dev-fold` inside a programmatic click (the browser drops the nested click) | shell/rack.js:453 (`press('.dev-fold', …)`), :487 | none named | C3-BUILD | NEW 24 (L) |
| C3-W1 +C6-2 | a window's presence moment: `onMoved(null)` fires as an exit STARTS; a host's mask needs the END of the exit/entrance (FOLDERS asked for "a landing hook on createWindow, like the modulation window's `onGeometry`") | window/window.js:351, 463 (`onMoved(null)`); modulation/window.js:461 `geometryChanged` | A7 `keymap`/`floats` providers re-dirty the mask at the exit end; FOLDERS' pane and its 3 chips re-taken "when its entrance motion ends" (C6 `83fe811`) | C3-BUILD W1; C4-BUILD ("met the same"); C6-BUILD kit cand. 2 | FOLD brief 8 (its `subscribe` must fire at the END of a presence motion) |
| C3-M1 | `createMenubar` hands focus back to the opener after a row's act when the act left it on the vanished item | shell/menubar.js:125 (closes the lists, runs the act; focus returns only on Escape) | N1 glue rack.js:3295–3298 | C3-BUILD M1 | NEW 26 (L) |
| C3-T1 | `createTransport({ adopt: true })`: keep the bar's own children, add only what is asked | shell/transport.js:581 `createTransport` (empties the bar, :638) | the transport stays λWAVES-built (native-ui.js, `native-tempo`): "Keep the Transports as they are per each app" (Josh 10-01) | C3-BUILD T1; C3-DESIGN §4 | NEW 25 (N) |
| C3-T2 | the dock's side/index memory | shell/transport.js (the `dock` window) **(src)** | `layout.dockTransport` with `dockSide`/`dockIndex` | C3-BUILD T2 | NEW 25 (N) |
| C4-1 | `port.targets` is two things: the routable-control selector, yet a host naturally owns a `targets` object and every `closest()` throws; type-check it or rename (`routable`) | modulation/window.js:190 (`port.targets \|\| ROUTABLE`) | `mod-port.js` carries no `targets` (:115) | C4-BUILD "Brief candidates" 1 | NEW 33 (N) |
| C4-2 | a closed modulation window still reports a box (`place()` measures while closed; close reports `moved(null)`): report nothing and skip the layout (saves boot cost) | modulation/window.js:399 `place`, :454 `port.moved`, :3249 | hosts filter both: `modDodge` takes null and ignores a closed window (rack.js:2268) | C4-BUILD 2 | NEW 33 (N) |
| FR1-B149b | an instant reorder (`rk.raise(id, { instant: true })` or `rack.quiet(fn)`): a keyboard-initiated action is never animated; the kit's rack FLIPs every reorder | shell/rack.js:210 `createRackMotion`, :213 `live()`, :241 `refresh`, :288/:293 observers, :568 `raise`, :582 keyboard `move()` | rack.js:3854 `cycleWindow` prepends the raised card; two real Tabs start 320 ms FLIPs; `legacy/boot` B149 clause (b) stays red on purpose | FIX-ROUND-1 §B149; LEGACY-BOOT-REAIM §4 | NEW 24 (N) |
| FR1-B111 | the kit's ◧ hide has no callback (`createRack` binds it to `setHidden` alone; `onChange` is too wide for a blob write). A finding with an app-side fix | shell/rack.js:957 | rack.js:3023 `rk.el.toggle.addEventListener('click', () => saveSettings())` (1 line) | FIX-ROUND-1 §B111; LEGACY §4 | NEW 24 (L) |
| C0-1 | scope `keyboard/keyboard.css` to the kit's windows (`.km-win`, `.km`, `.km-help`): its bare `.km-*` classes land on any app DOM that shares the names | keyboard/keyboard.css:30–36 (bare `.km-col`, `.km-col-left`…) | moot for λWAVES since C3 (the pane IS the kit's); at C0 it put an LED dot, a scrollbar and a hairline on λWAVES' old pane | C0-BUILD "Brief candidates for MIR" 1 | NEW 35 (L) |
| C0-2 | ADOPTING-1.5 should list the app rules `base.css` dropped (`#keymap`, `#keymap[hidden]`) | docs: ADOPTING-1.5 | `lab.css` §KEYBOARD `#keymap` rules are λWAVES' own (CLAUDE.md) | C0-BUILD 2 | NEW 35 (guide entry, L) |

### B2 · Knobs, keys, gestures

| id | need | kit file:line | λWAVES site and workaround | source | suggested |
|---|---|---|---|---|---|
| C7b-B13 | the timeline's held-knob law (500 ms hold, document-capture `contextmenu`) and the modulation ring's pop-over (600 ms hold, right-click) claim one gesture on a routed dial; the kit should arbitrate | timeline/knobs.js:27–37 (500 ms), :43 (`stopImmediatePropagation`) | rack.js:3829–3832: a window-capture listener hides a ROUTED dial's `data-param` for that one event (4 lines) | C7B-BUILD B13 | NEW 28 (N) |
| C7b-B14 | the CAMERA panel's re-dispatched press on its YAW/PITCH arcs cancels knobs.js' pending hold: a held arc never opens TIMELINE CLIP | panels/camera.js:109 (`.mir-camsphere-side`); timeline/knobs.js:34 | none; right-click works (T3 holds ZOOM, right-clicks YAW) | C7B-BUILD B14 | NEW 28 (L) |
| C7b-B15 | `pickAction` should prefer a row whose `when` holds over an unconditioned row on the same chord | shell/keys.js:198–201 `pickAction` (table order) | THE FOCUS LAW, lab/key-table.js:46–50 (+4 lines); `sync()` skips rows λWAVES does not own; `liftSaved` | C7B-BUILD B15 | NEW 27 (N) |
| C3-K1 | `ownsKey` skips a disabled / `aria-disabled` control (wave 68) | shell/keys.js:187–189 | `overControls: true` on every row (key-table.js:40) | C3-BUILD K1 | NEW 27 (L) |
| C3-K2 | a focused `<select>` yields Space to an `overControls` action (wave 88) | shell/keys.js:184 (`isField` counts a select) | key-table.js:43–44, a three-line listener | C3-BUILD K2 | NEW 27 (L) |
| C3-K3 | an action's fine step as data (`fine: true`): the chord and Shift+chord as ONE binding the window draws once and records whole | keyboard/keyboard.js, shell/keys.js **(src)** | rows carry no `shift`; `kt.window` hides each fine row's Shift twin (key-table.js) | C3-BUILD K3 | NEW 27 (N) |
| C3-K4 | the ctrl badge text: `modText` writes `Ctrl` (it overflows a key top beside ⇧) where the legend draws `⌃` | shell/keys.js:173 `modText`; keyboard/keyboard.js:203, 207, 245 | none: a ctrl badge reads `Ctrl` | C3-BUILD K4 | NEW 27 (L) |
| C1-1 | a raw road for registered camera targets: the panel's target records and an unrouted hand both call `port.set(vid, v)` (a hand's road), so a routed axis moves its base and ZOOM loses its centre anchor | panels/camera.js:373 (`mod.add`) | a mod port WITHOUT `add`; the six `observer.*` defs stay in rack.js and the panel's dials are `camKnobs` (rack.js:1091, 1365) | A1-A8-BUILD open item 2; C1-BUILD "A8's open items" row 2 | FOLD brief 2 (CAMERA panel port) |

### B3 · The recorder and the timeline

| id | need | kit file:line | λWAVES site and workaround | source | suggested |
|---|---|---|---|---|---|
| C7b-B1 | `createRenderView({ defaults })` for every row (`durationS`, `offsetS`, `size`, `format`, `modulation`, `timeline`), not only `fps` and `motion` | render/panel.js:183–193 (rows read localStorage) **(src for "only fps and motion")** | film-card.js:25 `defaults: { fps: 30, motion: 'still' }`; three keys seeded once on first boot (R7: 6 s, size current, MODULATION on when MOD armed) | C7B-DESIGN §7 B1; C7B-BUILD "confirmed" | NEW 20 (N) |
| C7b-B2 | `picture.label` / `picture.scales` for an app whose picture choices are scales (the row is labelled FORMAT) | render/panel.js:116 | the row still says FORMAT | B2 | NEW 20 (L) |
| C7b-B3 | `describe(spec)`: hand the run's plan to `describe` so an app records what a RESUME needs without reading the lab at an unannounced moment | render/recorder.js:228 (`o.describe ? o.describe() : undefined`) | render-exact.js:721 `describe()` reads the lab when called | B3 | NEW 20 (N) |
| C7b-B4 +C7-1 | a FREEZE with nothing driven writes nothing (RENDER.md says "nothing is stepped"; `enter` still does `clock.step(0)` through every setter). C7b AMENDED it: not needed by λWAVES | render/clock.js:72 | two recorders: host-less `freeze`, `drive` with `modHost`; T7 proves the equality | C7B-DESIGN B4; C7B-BUILD "amended"; C7-BUILD §10.1 | NEW 21 (L) |
| C7b-B5 | a per-step hook through the seek: `step(frameIndex)` beside `clock.frame(i)` | render/recorder.js:278–286 | a RESUME of a MODULATION ON film restarts λWAVES' RATE integral at the resumed frame, so only MODULATION OFF resumes are proven equal (T11a) | B5 | NEW 21 (N) |
| C7b-B6 +C7-FIX2 +C7-VERIFY N2/8e | `recoveries()` lists a job a cancel left before its first checkpoint (`job.json` + an empty `payload.bin`, no files), plus a store sweep for orphaned films | render/store.js:176 `RenderStore.recoveries`; render/recorder.js:354 | after C7b the card's RECOVER/RESUME/DISCARD rows list only what `recoveries()` shows, so the early-cancel directory is invisible to them (STOP at frame 15 left `render-…` for good) | C7B-BUILD B6; C7-BUILD "the hand-over fix", candidate 2 and open item 1; C7-VERIFY lead 2, 8e, N2 | NEW 21 (N) |
| C7b-B7 | an app's own rows in the timeline's ⋯ menu beside ADD AUDIO…; PLACE ONE PERIOD belongs there | timeline/editor.js:16; timeline/audio-drop.js:115 | PLACE ONE PERIOD sits in the RENDER card's PERIOD section (film-card.js); B7 would take ≈ −6 lines | B7 | NEW 23 (L) |
| C7b-B8 | automation WRITE: record a registered target's hand moves into a clip while playing ("the hands" as a pose path) | timeline/ (no writer) | none: "NO live recording" (C7B-DESIGN §3); AUTO-ROTATE rides as C7's pose path | B8 | NEW 23 (N) |
| C7b-B9 | make `setExactResume(true)` an option and give it a row in TIMELINE.md's port table: installing the timeline changes the modulation's resume law | timeline/controller.js:26 (unconditional); modulation/host.js:534 | R5 taken by installing: no BPM-grid re-quantise on play | B9 | NEW 21 (L) |
| C7b-B10 | TIMELINE.md should name the minimal `mod` an app hands without `installModulation` (host, registry, play, arm, armed, onPlay; optionally setTimeline, onTick); λWAVES is the first | docs: TIMELINE.md (not in the adopted tree) | the eight-member seam, rack.js:3812 "THE TIMELINE" block | B10 | NEW 20 (doc, L) |
| C7b-B16 | `createRenderCard` paints, and lists OPFS recoveries, at construction even when it ships closed: paint on the first `devopen` | render/panel.js:305 (`rec.recoveries()`), :377 (`paint()` at construction), :396 `onShow`, :405 `devopen` | none: a boot cost (`rec.recoveries()` "runs at construction and on every paint") | B16 | NEW 20 (N) |
| C7b-B17 | the recorder refuses MODULATION ON while any AUDIO source is on; NEW's rack holds an AUDIO level, so after NEW the card's MODULATION ON (R7's default) answers "Live audio cannot be replayed deterministically…" until switched off; skip a source with no live input, or say which to switch off | render/recorder.js:212–213 | none; the user switches MODULATION OFF. PLAN-DRAFT-0 §7 names it | B17; PLAN §9 (2026-10-09 afternoon) | NEW 20 (**U**) |
| C7-FIX1 | `saveBlob` should consult `navigator.userActivation.isActive` before sharing, and fall back to a download when `share()` rejects with anything but AbortError. Today a finished film or picture is LOST on Chrome/Edge/macOS Safari (and the iPad's frames zip) | folders/save-blob.js:18–24 (`navigator.share(…).catch(() => {})`, `shared = true`, no fallback) | capture.js:651 `handOver` (guard `tests/film-handover.browser-test.mjs`) | C7-BUILD "the hand-over fix", candidate 1; C7-VERIFY lead 1 | NEW 22 (**U**) |
| C7-2 | a result's files die with `discard` (OPFS `File`s): say so in the recorder's header, or hand back memory-backed blobs | render/recorder.js `discard` **(src)** | mitigated by C7b: a film's store copy stays until DISCARD (no timer) | C7-BUILD §10.2 | NEW 21 (L) |

### B4 · The look and the glass

| id | need | kit file:line | λWAVES site and workaround | source | suggested |
|---|---|---|---|---|---|
| C2-1 | VIVID's default: `createAccent` and the LOOK_SCHEMA `vivid` row default to 0.1; λWAVES ships 0.5; accent.js' header names λWAVES' A and B but not its VIVID | shell/accent.js:23, 76 | rack.js:157 `LOOK_DEFAULTS.vivid: 0.5` | C2-BUILD cand. 1; C2-DESIGN | NEW 30 (L) |
| C2-2 | BLUR's range: the kit's row stops at 24 px, λWAVES' GLASS BLUR travels to 30: the kit takes 30, or Josh rules 24 | shell/gui.js:123 (`max: 24`) | look.js:50 composes `max: 30` onto the row; no stored value moves | C2-BUILD cand. 2 | NEW 30 (L) |
| C2-3 | `createGui` cannot be built hidden without its side effects (`installKbm`, `touchTablet`, QUALITY · AUTO's benchmark, `mir.tier`): an option to skip them | shell/gui.js:336 `createGui`, :348 `installKbm`, :352 `touchTablet` | MIR OPTIONS is not built (R5-S1); look.js uses `createPrefs` + `createAccent` | C2-BUILD cand. 3 | NEW 30 (N) |
| C2-4 | the help rows have no moment: `control-help.js` listens for `controlhintschange`, which nothing in the kit dispatches; an open ⓘ panel survives HELP off | control-help.js:96 | look.js:59 one `prefs.subscribe` closes an open hint on a HINTS change and ⓘ panels on HELP off | C2-BUILD cand. 4 | NEW 30 (L) |
| C2-5 | a sparse store: `createPrefs` writes every row on the first `set`, freezing a device-dependent default (λWAVES' card and frost, the kit's own DEVICE_BLUR) | core/prefs.js `createPrefs` | `FIRST_RUN`; the phone's frost override stays the app's (first-run.js) | C2-BUILD cand. 5 | NEW 30 (N) |
| C0-3 | `--glass-shadow-flat` was removed as "read by nothing" but λWAVES read it: check removals against adopters, or keep a one-line alias for a release | css/skin.css:35 (the comment: "that name is gone: nothing read it") | C0 `858515e` reads `--glass-shadow` | C0-BUILD 3; C0-GLASS-RULINGS "Notes for the kit" | NEW 30 (L) |
| C0-4 +C2-6 +C-V §2 TOKENS | stylehash's token scan does not descend into `@import` (`CSSImportRule.styleSheet`): behind `mir/mir.css` the token TEXT reads "undefined" (16 element-states in C-V; `--acc`/`--acc2` needed a hand reader) | MIR 1.5 `tools/stylehash.mjs` | a hand reader (`.tmp/acc.mjs`) | C0-BUILD 4; C2-BUILD cand. 6; C-V §2 | NEW 35 (L) |
| FR1-B139 | FROST · STILL: one lever (a token or a look option) for a hold that changes the filter only; MIR's own comment says "STILL changes the blur, not the paint" (skin.css:526; the source cites :518), which :536–541 contradicts | css/skin.css:526, 536–541, 549, 581, 743; modulation/modhost.css:1032, 1496; window/window.css:61 | lab/skin.css:147–148, two unlayered rules keep the veil on λWAVES' panes; the kit's OWN surfaces (modulation pickers and work bar, chip rail, help popovers, islands) still change paint | FIX-ROUND-1 §B139; LEGACY §4 | NEW 30 (N) |
| FR1-B144 | the accent rows' `wrap: true` folds 360 to 0, so END announces 360° while the knob is re-seated at 0°. A finding with an app-side fix | shell/gui.js:106–107; core/prefs.js:74 | look.js:50 `wrap: false` on the accent rows (0 lines added) | FIX-ROUND-1 §B144; LEGACY §4 | NEW 30 (L) |

### B5 · The notice, the opener, the boot

| id | need | kit file:line | λWAVES site and workaround | source | suggested |
|---|---|---|---|---|---|
| C6b-1 | the opener's notice under the app's law: `openerSwitches` lets `?warn=0` skip the notice for any browser; an `honour: { warn0: false }` option, or `needed()` handed in | core/session.js:65–69 `openerSwitches`; shell/opener.js:11 | main.js:68 starts the opener with `warn: false, webdriver: false, search: ''`; the notice runs under λWAVES' `needed()` | C6B-BUILD "Brief candidates" 1 | NEW 31 (N) |
| C6b-2 | `photosensitivityNotice` returns only a promise: return `{ result, close }` (or export `dismissFlashNotice()`) | shell/flash-guard.js:32, 140 | main.js:28, 35 `press()` clicks the kit's CONTINUE, retrying up to 2 s | C6B-BUILD 2 | NEW 31 (N) |
| C6b-3 | keys pressed on the title screen reach the app's window-level key table (Space plays): stop them at the root, as the dialog does | shell/opener.js:176–196 (a document keydown trap), :240 **(src: that these lines are the title screen's)** | a bubble-phase stop on `document` from the start of the human road to the pick (main.js) | C6B-BUILD 3 | NEW 31 (N) |
| C6b-4 | the opener's text logo is an unstyled `div`: a wordmark slot (or the app's `#title` cloned without its button) | shell/opener.js **(src)** | `logo: 'λWAVES'` | C6B-BUILD 4 | NEW 31 (L) |
| C6b-5 | `bootVeil`'s timeout rides `requestAnimationFrame`, so a page whose frames are held keeps the veil past its 8 s: use a timer | shell/boot.js:170–177 | none | C6B-BUILD 5; C-V §6 S1 | NEW 31 (N) |
| C6b-6 | the veil's fill is black whatever the app's ground is (λWAVES ships light) | shell/boot.js:147 | left as the kit's | C6B-BUILD 6 | NEW 31 (L) |
| C6b-8 | the cover entrance (0.6 s + stagger, an opacity animation) can stall while the app's pipelines compile behind the screen (headless Firefox); a cover at opacity 0 is not pressable | shell/opener.js **(src)** | tests/opener navigates through `about:blank` and waits for a painted frame (`59168b9`) | C6B-BUILD 8; C-V §6 S1 | NEW 31 (N) |

### B6 · The INFORMATIONAL layer (briefs 13, 7-fix, 18, 19, 6 and 3 are in Table A)

| id | need | kit file:line | λWAVES site and workaround | source | suggested |
|---|---|---|---|---|---|
| SEC-8 | KaTeX limits: pass `maxExpand: 50` and `maxSize: 20` and cap formulas per preview (≈ 300) and total TeX length (≈ 20k chars). Measured: 1,108 characters took 2.5 s, 908 characters 7.5 s | shell/notebook-math.js:8–9 (`throwOnError: false, output: 'html', trust: false` only) | none: a crafted project can freeze the tab on open | SECURITY-REVIEW §3 item 8 ("fix in MIR first and then adopt") | NEW 34 (N) |
| SEC-9 | notebook images load from any https host (a tracking pixel): keep `IMG src` only when same-origin, or an `img-src` policy | shell/notebook-render.js:8 (`IMG: ['src', …]`), :10 (https allowed) | none; projects open in view mode | SECURITY-REVIEW §3 item 9 | FOLD brief 19 (the images policy) |
| C7-4 | the caption is the interim: `overlay(i, ctx)` replaces it | render/recorder.js:29 | `captionOver` (capture.js:586) | C7-BUILD §10.4 | FOLD brief 6 |

### B7 · Pages, FOLDERS, the project, the history stack

The ten **C5** rows are the laws the old undo ring kept that the kit's stack lacks; all are kept in `lab/edit-domain.js` (103 lines over the public API) and the card's own
`renderHistory` (≈ 45 lines, K10). "When MIR takes K1–K10, `edit-domain.js` becomes `register('edit', …)`, the card becomes `historyList`, and both shrink to about 10 lines" (≈ −140).

| id | need | kit file:line | λWAVES site and workaround | source | suggested |
|---|---|---|---|---|---|
| C5-K1 | a turning drive is ONE gesture (`driven`): the kit has no such notion, every settle reads and records | history/history.js:17 `createHistory` | edit-domain.js:38, 41, 56: while `driven()` the domain reads the state it stood on, a note is nothing | C5-BUILD K1 | NEW 29 (N) |
| C5-K2 | undo, redo, a jump and a press COMMIT the edit standing, announced or not (the kit lands only an announced edit; an unannounced one is absorbed at the next gesture or overwritten by an undo) | history/history.js:28–55 (`flushAnnounced`) | edit-domain.js:60–61 `flush()` before each; costs ≈ 0.3 ms per pointerdown | K2 | NEW 29 (N) |
| C5-K3 | a jump is ONE write: `goto` walks the rows between and writes every one | history/history.js:115–116 | edit-domain.js:42 `walkTo` with writes held, then the target lands once and `absorb()` re-baselines | K3 | NEW 29 (N) |
| C5-K4 | HISTORY UNDO, a one-use return to the timeline before the last jump: the kit has no branch | history/history.js (none) | edit-domain.js harvests the timeline at the jump by a held walk, rebuilds with `clear` + `record` | K4 | NEW 29 (L) |
| C5-K5 | `absorb(fill)`: a solve's derived defaults re-key the row the stack stands on; the kit's `absorb()` only re-baselines, so a redo writes the unfilled row | history/history.js:136 | edit-domain.js:11, a key → filled-record map the write follows (MOLECULES) | K5 | NEW 29 (N) |
| C5-K6 | the bottom row is the oldest reachable state, named for the row that made it; the kit keeps the clear's name after rows fall off | history/history.js **(src)** | a push that drops rows passes the dropped row's name to the bottom | K6 | NEW 29 (L) |
| C5-K7 | `'edit'` / `'start'` with row i = the i-th state; the kit says `EDIT` / `START` and the bottom is i = −1 | history/history.js:115 | mapped in `entries()`; `goto(i)` = the kit's `i − 1` | K7 | NEW 29 (L) |
| C5-K8 | canUndo / canRedo / depth / redoDepth count an edit still in its quiet window; the kit counts rows only | history/history.js **(src)** | the facade compares the baseline's key with the live one | K8 | NEW 29 (N) |
| C5-K9 | a finished gesture's name waits one quiet window for its edit (on touch a tap's click lands after the release's task), and `label()` waits for its action | history/history.js **(src)** | the facade lends the name back at the next note/flush/press; node-proven only, NOT proven on a touch screen | K9 | NEW 29 (L) |
| C5-K10 | the card's list is current while the card is closed: `historyList` returns from `paint()` while `root.offsetParent === null`; wanted `historyList(…, { hidden: 'paint' })` or `paint({ force })` | history/history-list.js:54 | rack.js `renderHistory` (≈ 45 lines) stays; `history` block 8 reads the closed card after NEW | K10 | NEW 29 (N) |
| C1-2 | history row names for kit controls are poor: the RAMP stepper's › makes a row "edit"; the swatch makes "STOP COLOUR — TAP FOR THE CHOOSER, DRAG UP OR DOWN TO TURN ITS HUE · PALETTE": take the part before " — ", or give a control a short gesture name | history/gestures.js (`gestureName`: "its words are the label the kit wrote on it") | rack.js `hTouchName`'s `select, input` branch | C1-BUILD "Open items" 2 | NEW 29 (L) |
| C6-1 | a `setCurrent(id, { clean })` on FOLDERS: an app with its own open road would need no forced `openEntry` to tell it (the skip token, the re-mark) | folders/folders.js:155 (`current`), :264–272 | projects.js:40–77 `told`/`skips`; `folders.openEntry(id, { force: true })`, `fresh({ force: true })` | C6-BUILD "Brief candidates for the kit" 1 | NEW 32 (N) |
| C6-3 | the thumbnail written after `onOpened` should carry a version: today it can bring back an older payload after a SAVE in between | folders/folders.js:161 | projects.js:57–58, the `at` check (`input.at === e.at`) | C6-BUILD 3 | NEW 32 (L) |
| C6-4 | `createIntake`'s drop and `pick()` call the closure, not the property: an `ingest` option on `createFolders` | core/intake.js:68 | projects.js:146–170: re-hooks `folders.intake.ingest` and the drop in capture phase | C6-BUILD 4 | NEW 32 (L) |
| C9-THUMB | a finding (C9 did not file it): alpha.24 has no readability probe; `toThumb(src)` simply `drawImage`s whatever canvas it is handed, a WebGPU canvas included | folders/folders.js:96–117 | `LW.thumbnail()` = the GPU readback PNG `picture({ width: 320 })` (C7b decision 15) | C9-BUILD "The thumbnail road" | FOLD 32 (L) |
| C4-3 | `bind.js` `localStore` has no `remove()` (`jsonStore` has one): FORGET must write `undefined` keys | modulation/bind.js:61–64 vs core/prefs.js:46–54 | FORGET clears `modArm`/`modCadence` with the settings | C4-BUILD 3 | NEW 33 (L) |
| C4-4 | `installModulation`'s record needs a persist list: it also persists `modulationState` and `modwin`, which are PROJECT and WORKSPACE in λWAVES; an app keeping only power and cadence there needs `persist` (or `{ rack: false, presentation: false }`) | modulation/bind.js:124 (`store`) | λWAVES builds `createModulation(floats, port)`, not `installModulation` (R5-A3) | C4-BUILD 4 | NEW 33 (N) |

### B8 · Other (tools, hygiene)

| id | need | kit file:line | λWAVES site and workaround | source | suggested |
|---|---|---|---|---|---|
| CA0-1 | a finding: `tools/check-app.mjs` cannot judge λWAVES until the app wires `createDescribe` ("FAIL window.__MIR.describe never appeared"), and `--webkit` cannot start on the build machine (12 shared libraries missing) | MIR 1.5 `tools/check-app.mjs`, `tools/webkit.mjs` | the WebKit road for 0.5.0 is the kit's probe, PASS 2 §5's block | CANARY-A0 PASS 2 §5, §6.5 | NEW 35 (L) |
| CA0-2 | a finding: `probe.mjs serve` without `--data` writes its records into the kit's `tools/.probe/`, inside the MIR checkout | MIR 1.5 `tools/probe.mjs` | the M5 block passes `--data` | CANARY-A0 PASS 2 §5 | NEW 35 (L) |
| CA0-3 | kit hygiene found by the adopted-copy canary: (D2) an absolute URL in `shell/gui.js:550`; (D3) `app.js:60` `new URL('../LICENSE', …)` resolves to `lab/LICENSE`; (M10) `app.js`, `info/layer.js`, `notes/face.js`, `shell/gui.js`, `shell/transport.js`, `window/workspaces.js` import shell modules that a precache rule skips (e.g. `info/layer.js:51` → `shell/notebook.js`) | shell/gui.js:550; app.js:60; info/layer.js:51; notes/face.js:25; window/workspaces.js:34 | handled app-side in C0: R5-W1 (an unreached kit module is reported, not precached, not failed); `pwa` PASS 341 files (C-V R4) | CANARY-A0 §2 pwa row; A9-A11-BUILD "four kit deltas" | NEW 35 (L) |
| C9-HP | a finding: the kit's `tools/hit-probe.mjs` takes one URL and one selector and reads no scene file | MIR 1.5 `tools/hit-probe.mjs` | `tools/hit-probe-set.mjs` imports its `probe()` and `gridPoints()` (`MIR15_TOOLS`) and owns the 13-scene list | C9-BUILD "The hit-probe set" | NEW 35 (L) |
| A10-LFO | a finding: no hook on the modulation window's ADD LFO button; history's scene finds it by label | modulation/window.js (the add control) **(src)** | tests/history by label | A9-A11-BUILD §A10 "Kept on purpose" | NEW 35 (L) |

### Suggested new briefs (numbers continue the vault's)

| # | working title | rows |
|---|---|---|
| 20 | RENDER card options and errors | C7b-B1, B2, B3, B10 (doc), B16, **B17 (U)** |
| 21 | recorder store, seek and resume | C7b-B4, B5, B6 (+C7-FIX2), B9, C7-2 |
| 22 | `saveBlob` never loses a file | **C7-FIX1 (U)** |
| 23 | TIMELINE: app rows in ⋯ and automation WRITE | C7b-B7, B8 |
| 24 | rack verbs: move, parked, window menu order, extras, prune, nested fold click, instant reorder, hide callback | C3-R1…R6, FR1-B149b, FR1-B111 |
| 25 | transport: adopt the bar, dock memory | C3-T1, T2 |
| 26 | menubar focus hand-back | C3-M1 |
| 27 | key arbitration: scoped rows, control ownership, fine steps, modifier text | C7b-B15, C3-K1…K4 |
| 28 | held-dial arbitration | C7b-B13, B14 |
| 29 | the history stack's laws | C5-K1…K10, C1-2 |
| 30 | the look store and FROST · STILL | C2-1…C2-5, C0-3, FR1-B139, FR1-B144 |
| 31 | opener, notice and veil | C6b-1…6, C6b-8 |
| 32 | FOLDERS: current, thumbnail version, intake, WebGPU thumbnails | C6-1, C6-3, C6-4, C9-THUMB |
| 33 | the modulation window's port and record | C4-1…C4-4 |
| 34 | notebook sanitiser limits (KaTeX) | SEC-8 (SEC-9 folds into 19) |
| 35 | kit hygiene, guide entries and tools | C0-1, C0-2, C0-4, CA0-1…3, C9-HP, A10-LFO |

---

## Table C — λWAVES' own found-not-fixed items (NOT kit briefs)

| id | what | owner row | source |
|---|---|---|---|
| C-FILMMASK | a film keeps the window mask it started with: the field's line pass masks the frame and axes under the occlusion block, so an open window cuts holes in a film's frame lines (the same RECORD was 742,908 B with the CAMERA card open, 744,558 B without). A pin (an empty block for the film's length) changes the digests the base copy holds | 0.5.x **frame-path row** (digests change: the lock 860/1004, `film-probe`); T6 closes the TIMELINE before both films so the two takes see one mask | C7B-BUILD "Found, not fixed"; C7-BUILD §open item 3; C7-VERIFY N4; PLAN-DRAFT-0 §7 |
| C-B127 | the canvas's own aria sentence (badges.js) rides the 100 ms badge tick, which runs only on a frame, so a paused lab's "paused badge sentence can stay stale"; the re-aimed suite reads a tick later | D1 retires it if the layer's block replaces the canvas sentence, else a one-line fix row | PLAN-DRAFT-0 §7; LEGACY-BOOT-REAIM §6 (rows B6/B22/B23/B127); HANDOFF 10-09 15:25 |
| C-B16 | `ResizeObserver loop completed with undelivered notifications` ×2 in one boot-suite run beside a sibling's suite, then 46 reds that cascade from it; the cause was not determined and the run did not conclude | D-V runs the boot suite ALONE; if it returns, B16's block alone on `7edae5c` and on the tip | FIX-ROUND-1 §Gates |
| C-B70 | B70/B71: the transport's buttons are 45 × 34 on a touch phone (`play`, `modb on`, `transport-home`, `step-back`, `step-forward`, `jump`) and two routed rings 42 × 45 / 26 × 45; identical on v0.4.0-alpha | 0.5.x phone/touch row | LEGACY-BOOT-REAIM §5, §7 |
| C-B78 | B78 BOW: the STATE card still reads `BOW` and `BOW · escaped / momentum`, with no IMPULSE trigger, group or readout; identical on v0.4.0-alpha | 0.5.x STATE-labels row | LEGACY-BOOT-REAIM §5 |
| C-BOOT5 | the five boot rows after C7b: B66/B108 stale against the RENDER card, B127 (above), B84 a harness phase race on both trees, B134 not run | the Sonnet pass relaunched from `b9e0c57`; its BUILD file is not in this tree, check it | HANDOFF 10-09 15:25 |
| C-AUDIO-NEW | the λWAVES half of C7b-B17: NEW's rack ships an AUDIO level, so the first MODULATION ON film after NEW is refused | a one-line decision (the card's MODULATION default, or NEW's rack) in 0.5.1, before brief 20 | C7B-BUILD "Found, not fixed" |
| C-DIRTY | a demo opened through the facade reads dirty once its MOLECULES solve lands (`projectKey()` counts the solve's fill): WATER clean after the open, dirty 2.5 s later; the beforeunload question and FOLDERS' UNSAVED mark appear on an untouched demo; pre-existing | D2 (it changes how a molecule or demo opens) or a fix row | C6B-BUILD "Open items" |
| C-TABS | the tabbed notebook (`createNotebook({ pages, faces: [notesFace(…)] })`: YOURS + the project's pages + the shelf) would change what the notebook is: text typed into YOURS no longer travels with a project and NEW no longer empties it. λWAVES keeps ONE notebook as page 0 | Josh's ruling; D2 puts pages INSIDE the part beside `notebook` | C6-BUILD "Open items"; C6-DESIGN |
| C-PJWIN | `lambdawaves.q0.projects.window` (FOLDERS' place, size, sort, open state) is classed WORKSPACE; if Josh reads it as furniture it is PREFERENCE (one FAMILIES word) | Josh | C6-BUILD "Open items" |
| C-SESSIONHOLD | `createSession` already has a `hold` option (core/session.js:15, 24, 88; BASINS holds the session while a film renders); λWAVES wires none, so a RESUME written mid-film would capture the film's view. Not a kit need (C6b listed it as candidate 7) | a one-line wiring beside the film's `filmHold` | C6B-BUILD cand. 7 |
| C-MEASURE | not measured or not verified: ms/s with the TIMELINE open and playing (closed it is +1.2); the STAGE TEXT at the foot under a bottom-docked timeline (not checked by eye); the phone and the iPad for the timeline and the card; camera-routes, mir-controls, serialize-bytes and ms/s-with-TIMELINE were outside C-V | D-V runs all four (PLAN-DRAFT-0 §7) | C7B-BUILD "Open items"; C-V "Not verified" |
| C-M5 | M5 pending (`research/device-reports/` holds only the September iPad reports); unverified: a P3 screen, WebKit and the iPad's worker store writer, a 4K / 16384² PNG's memory, multi-part EXPORT FRAMES (> 128 MB), a desktop "ask where to save" dialog held open, K9 on a touch screen | Josh's command (the M5 block, CANARY-A0 PASS 2 §5) | C-V; C7-VERIFY N7; C5-BUILD open item 3 |
| C-LEGIBILITY | "no ink brief" is PROVISIONAL until Josh looks at the 24 PNGs; the weak element is a block's body over a saturated lobe (benzene and C₆₀, median 2.9–4.9 : 1); the app's atom letters and the axis lines cross the layer's words, so D1 must make the atom letters layer labels | D-V re-takes the legibility PNGs once (PLAN-DRAFT-0 D10-21) | CANARY-A0 PASS 2 §2 |
| C-DEAD | dead code from D9/D9b: the field kernel's space-4 (HELIUM) and space-5 (H₂) branches (field.js:71, 85) are a shader change for a lock run; `tools/perf/device-report.js:969–973` still lists `LW.molecule`, `.helium`, `.h2`, `.qcd`, `.fieldlines` (`safe()` tolerates them); `h2ci.js`' `h2CurveTable` has no lab caller (kept for `card-solvers` and D6's MAPS) | 0.5.x frame-path row (the first); housekeeping | D9-BUILD; D9B-BUILD "Open items" |
| C-CSS | CSS debris and open glass questions: dead rules `.camera-motion`, `.camera-control`, `.palette-action`, `.palette-seam`, `.pal-*` (C1); lab.css ≈ 656–711 repeats modhost.css (arming, pop-over, `.mod-mchip`; `.mod-pop` carries `backdrop-filter`) (C4); twelve `!important` that only beat 1.4.3's specificity stay, no probe covers them (C0); λWAVES' CSS seems to hide the RAMP's `SEAM at ±π` readout in the native skin (C1) | the glass is Josh's: a ruling first, then a subtraction row | C0-BUILD; C1-BUILD; C4-BUILD |
| C-KEYS | the kit's KEYBOARD chrome (no header bar, a rail) is Josh's to rule (R5-S3); `?` opens the window and ADOPTING §11's `help`/`keyboard` split has no chord; a rebinding saved by 0.5.0 is the kit's shape and a 0.4.0 build keeps its defaults; settings-store.js FAMILIES still names `keys.js`/`keymap.js` as owners (now key-table.js and rack.js) | Josh; a doc nit | C3-BUILD open items; A9-A11-BUILD open items |
| C-TESTNITS | `access` A2/A3/A9/A10 still use kit-source regexes; `native-ui.js` windowInfoSw (`notes`) carries no `data-key-action`; `docs/mir-matrix-patch.json` is read by no test; `tests/legacy` reads `clockLink`; `render-exact.test` crashes at line 598 (`bad.mismatches[0]`) under mutation before its tally; `tools/perf/main-thread.mjs` records its cwd's sha, not the served tree's, and measures with the notice open under CDP Chromium (effect on the floor UNVERIFIED); RECORD's kit manifest names its motion `loop` (cosmetic) | 0.5.x housekeeping | A9-A11-BUILD; C4-BUILD; C7-VERIFY N5, N6; C-V N8; CANARY-A0 §6.6 |
| C-SECURITY | SECURITY-REVIEW §3 items 1–7 and 10 are λWAVES/ops: the LAN servers (key published, all interfaces, one idle TCP freezes, `/report` writes, no log), a link's `res`/`scale`, `domain.half`, the project-open freezes (particles, LADDER sigma), HSTS. Items 8 and 9 have a kit half (SEC-8, SEC-9 above). Item 11 (GPU loss) is done by C9 R14. Their status is not re-checked here | a 0.5.x security row; PLAN-DRAFT-0 names none | SECURITY-REVIEW §3 |

---

## Already done in alpha.24, or already answered — do not re-raise

- **C7b-B11 answered:** a `selfTestStages` stage may run a film, since `selfTest` is not a recorder run and the one-run `busy` stays free (the λWAVES stage renders 6 frames twice on the host-less recorder).
- **C7b-B4 not needed by λWAVES** (the FREEZE writes no byte here, T7); kept in Table B only for apps whose adapters are not idempotent.
- **C7b-B12 confirmed:** C7's open item 3 ("an option to hide the timeline motions") is retired; the timeline was adopted, not hidden (PLAN §9, 2026-10-09).
- **C7's ONE PERIOD has no STOP (N3)** left with the CAPTURE group; the RENDER card has CANCEL. **N1 / lead 2 (the iPad Blob URL dies at 2 minutes)** was fixed by the ten-minute store copy, then C7b removed the timer altogether.
- **`__LW.thumbnail()` threw `c.probe is not a function`** (C6b, C9): fixed in C7b (decision 15); `gpu-recovery` is 10/10. **C6-5** (FOLDERS' first picture runs a 1 s capture probe) is moot: that probe was λWAVES' `capture.probe()`, which C7 removed.
- **C5:** `history.clear(label)` is the kit's own in alpha.24, so no kit change and no brief is needed for it. **C1 / A8 open items 2–4** (the registry, the notices, SPIN's range written twice) were resolved by C1.
- **LINKED refusal (vault brief) and A5/A6's S0 item** are closed by the one clock: THE play holds `demand('app.play')` and LINKED/SEPARATE are retired (C4).
- **The three guide entries** were applied app-side: `new-project` regenerated at BPM 30 (C0); `mir-controls` and `slider-keys` re-aimed to the ONE KNOB LAW (C0, A10); `access` A8 reads the rendered announcement (A10).
- **CANARY-A0's pwa deltas D2/D3/M10 and the font gate (14 faces vs 3)** were set aside app-side in C0 (R5-W1; `pwa` PASS 341 files, 6.55 MiB). The kit-side hygiene stays as CA0-3.
- **FIX ROUND 1** fixed the λWAVES halves of B78 (`slap` word), B111, B144 and B139; the kit halves are FR1-B111, FR1-B144, FR1-B139 and FR1-B149b in Table B.
- **C-V's N1–N5** (stale CLAUDE.md sentences) were fixed in `9f80e98` (HANDOFF 10-09 15:25); CLAUDE.md on this tree reads "KIT BRIEF 6 replaces it at 0.5.1, D5" and 32 `!important`s.
- **The opener's host flake** (headless Firefox's dead `requestAnimationFrame` after a real pointer drag or a quick navigation, v0.4.0-alpha too) is cured in the suites (`59168b9` for `tests/opener`, `goPainted` for `legacy/boot`), not in the app.
- **D9 and D9b need no brief** (D9-BUILD "Brief candidates for MIR: None"). **C4's `s3` settings-probe finding** is the probe's law, not a defect. **C3's `history` block-1b red** was a measurement inside the kit's rack motion (the test reads at rest).

---

## Counts

Counting rule: a *candidate* is one need a source names, however many files repeat it; the ids are the sources' own where they had one. Row counts below were taken
from this file with `grep`, not by hand.

- **Files read:** 27 in full or by the sections that carry candidates (the 0.5.0 files `C0`–`C7` `-BUILD` with `C6B` and `C7-VERIFY`, `C7B-BUILD`, `C7B-DESIGN` §7, `C9-BUILD`, `C-V`, `FIX-ROUND-1`,
  `LEGACY-BOOT-REAIM` §1–5/7/9, `CANARY-A0` incl. PASS 2, `D9`, `D9B`, `SECURITY-REVIEW` §1–3, `A1-A8`, `A5-A6`, `A7`, `A9-A11`, `PLAN.md` §1/§2 D/§9, `PLAN-DRAFT-0.md`, the vault
  note, which is byte-identical to `research/release-0.4.0/KIT-BRIEFS.md`); plus greps for brief/kit/"found, not fixed" over `C0-GLASS-RULINGS`, `C2/C3/C6-DESIGN`, `AUDIT-OPUS-1`,
  `REVIEW-SONNET-0/2`, `PLAN-DRAFT-3`, the `C*-HANDOFF` files and `research/release-0.4.0/HANDOFF.md` §2 (the status of the five boot rows).
- **Table B: 79 rows** = 16 rack/windows · 8 knobs/keys/gestures · 14 recorder/timeline · 9 look/glass · 7 notice/opener/boot · 3 INFORMATIONAL · 17 pages/FOLDERS/project/history · 5 other.
- **New, opening a suggested brief (20–35): 74 rows.** **Folded into an existing brief or another row: 5 rows** (C3-W1 into brief 8, C1-1 into brief 2, SEC-9 into brief 19, C7-4 into
  brief 6, C9-THUMB into suggested 32). **Duplicate sightings merged inside rows: 6** (C6-2 into C3-W1; C2-6 and C-V §2 TOKENS into C0-4; C7-1 into C7b-B4; C7-FIX2 and C7-VERIFY N2/8e into
  C7b-B6), so **85 source-named ids** were read. **7 of the 79 rows are findings** the source did not file as a candidate (FR1-B111, FR1-B144, C9-THUMB, CA0-1, CA0-2, C9-HP, A10-LFO),
  marked as such in their rows; 39 carry the sources' own B/K/R/T/W/M ids (15 `C7b-B`, 14 `C3-`, 10 `C5-K`).
- **Already in the vault and re-raised by the 0.5.0 files: 18** = 14 briefs (1, 2, 3, 4, 5, 6, 7, 8, 9′, 13, 18, 19, J, P: nine in Table A, five in the paragraph after it) + the 3 guide
  entries + the LINKED refusal (closed by C4). The vault's live-bound labels (`{{state}}`) were not re-raised by any 0.5.0 file.
- **Table C: 19 rows.** **Already done or answered: 13 bullets.** **Priority tags in Table B:** U 2 (C7b-B17, C7-FIX1) · the rest N or L.
