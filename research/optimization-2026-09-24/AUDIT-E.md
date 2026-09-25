# AUDIT E · CODE ARCHAEOLOGY / REFACTOR · 2026-09-24 · Opus 5.5

Lane E: what the iterative sessions left behind in `lab/rack.js` (6080 lines, 526 KB), `lab/modwindow.js` (3084),
`lab/native-ui.js` (223), the CSS and the docs. Each finding carries HISTORY (the wave/commit that made it and what it
was for) and READERS (code and tests that still touch it) in place of GAIN, plus a MEASURED line where I have a number.
Ranked by (confidence the thing is spent or wrong × bytes/complexity removed ÷ risk). Nothing under `lab/` or `tests/`
was edited. Probes: headless Firefox on the RTX 3070, 1920×1080, fresh profile (= first visit), GD_PORT 5235.

## 1. What I read, what I measured

**Read whole:** `lab/rack.js` (all 6080 lines), `lab/modwindow.js` (all 3084), `lab/native-ui.js`, `lab/main.js`,
`lab/index.html`; headers of all 20 `lab/*view.js`; `docs/history/{CLAUDE-CODE-HANDOFF, HANDOFF, FINAL-II-HANDOFF,
NATIVE-UI-REWORK, WAVE-107-CLOSING, TASKS, LANDSCAPE}.md`, `docs/REVIEW-2026-09-15.md`, `docs/ui/ANTI-PATTERNS.md` (entries),
`docs/ui/ARCHIVED-MACRO-TOOLS.md`, `CHANGELOG.md` (top); REPORT.md headings, waves 64 and 108, the 2026-09-10 senior-review
and MIR sections and the 2026-09-11 second pass; `tests/wiring.test.mjs` (allowlist), `tests/access.test.mjs` (A7/A11),
`test.sh`; `git log --stat -30`; `git log -S/-G` for every candidate below; the 09-08 freeze diff `5f6421e` around SETTINGS.

**Probes** (`research/optimization-2026-09-24/probes/E/`, each re-runnable from the worktree root):
- `readers.mjs` → `readers.out.txt`: all 133 `ui.*` handles and 12 `__LW_hooks.*` keys — lab reads, shipped-test and
  legacy-test mentions (dynamic `ui[name]` reads in native-ui.js checked by hand).
- `import-graph.mjs`: static reachability from `main.js` — 110 modules / 2.74 MB reached; 8 MIR shell files (79.9 KB) are
  never imported (all on the wiring allowlist, dated 2026-09-21).
- `instrument.mjs`, `instrument-modwin.mjs`, `boot-sections.mjs` → `boot-sections.json` (7 runs), `boot-modwin.json` (4):
  boot() timed section by section on an INSTRUMENTED COPY of lab/ (`cp -r lab probes/E/lab-inst` first; the copy was
  deleted afterwards). DOM at ready: **4449 elements, 27 devices, 2003 (45 %) inside closed or hidden windows**, 507 in the
  closed modulation window, 224 in the hidden legacy H₂⁺ card.
- `ab-closed-modwin.mjs` → `ab-closed-modwin.{A,B}.json`: A/B of FE2 on the copy (7 + 7 boots, incl. the first two rAFs).
- `run-inst.mjs`: one-snippet runner (used on the real `/lab/` to verify FE1, on the copy for FE3).
- `css-orphans.mjs` → `css-orphans.json/.log`: every selector of `lab.css`/`skin.css` against a fully opened DOM (FE4).
- `seams.mjs` → `seams.json`, `seams.out.txt`: closure reads/writes of 45 boot() blocks (§6).

**Boot profile** (median of 7; ms inside boot(); `createField` alone ≈ 481 ms and excluded): the rest is ≈ 142 ms —
WAVE/PALETTE/CAMERA/CLIP/SETTINGS 8.2 · SHADOW 4.9 · **SLICE 27.5** · **createGas 14.3** · legacy MOLECULE 4.8 · H₂ 4.9 ·
CHEM 2.7 · modulation host + window 15.2 · transport 5.5 · keymap (hidden) 1.9 · **applySettings ≈ 16 (13.8 of it one
`modView.sync()`)** · reworkNative 6.9 · LEAN + KIND passes 2.3 · tail (markClean → ready) ≈ 3.

## 2. Findings, ranked

**FE1 · The menubar reaches controls by label text and by key code; three rows are broken today (verified).**
WHERE: rack.js:4078–4099 (`clickTrig`, `runKey`, `MENUS`). MECHANISM: `clickTrig(label)` clicks the FIRST `.trig` in
document order with that text; `runKey(code)` runs the first ctrl-less action bound to that key. MEASURED (run-inst,
real `/lab/`): EDIT › "RESEED the particles  Ctrl+R" → `runKey('KeyR')` finds `camReset` → **camera snapped home (yaw
1.447 → 0.65), no particles seeded**. EDIT › "RESET the key bindings" → `clickTrig('RESET KEYS')` → **no such trigger
exists**; a rebound PLAY stayed rebound. EDIT › "CLEAR the register" → **five** `.trig`s read CLEAR (spectrum, orbitals ×2,
history, state): on a first visit it presses SPECTRUM's (c ↦ 0, no clock reset — not STATE's, which also resets t, scrub
and trail); with HISTORY floated (`#floats` precedes the racks in the DOM) **it cleared the undo ring instead** (depth
1 → 0, populated 2 → 2). Hand-typed key names (`\tH`, `\tN`, `\tSpace`, `\tCtrl+R`, `C cycles`, `V cycles`) go stale on a
rebind while other rows use `keyFor(id)` (ANTI-PATTERN 6), and `runKey('KeyH')` runs whatever H is bound to.
HISTORY: menus wave 25/27, the `clickTrig` idiom from the same era; RESET KEYS was deleted with the SETTINGS KEYS group in
`5f6421e` (2026-09-08 native rework); the extra CLEARs came with spectrum.js's head row, MOLECULAR WAVES (09-18) and
HISTORY (wave 106). READERS: no shipped or legacy test drives these rows (grep 0). CHANGE: rows call functions —
`runAction(id)` (ACTIONS by id), `keyFor(id)` in every label, STATE's CLEAR hoisted to a named `clearRegister()`,
`normalizeNow`, `save`/`restore`/COPY JSON/`copyLink` as functions, `resetView`, `__LW_hooks.keys.reset()`.
NEUTRALITY: a BUG FIX with the proof above; "CLEAR the register" → STATE's CLEAR (flag to Josh, §5-1). RISK: low; add one
browser block that clicks every menubar row and asserts its effect. EFFORT S.

**FE2 · The CLOSED modulation window lays itself out and repaints its devices three times during boot.**
WHERE: modwindow.js `rebuild()` → `place()` (172–315) and `paint(true)` (2623–2760; the `g.box.clientWidth` read at 2745),
reached while closed from createModulation (3057), rack.js:3095 (`setModArm(…,{quiet})` → `modView.sync()`) and rack.js:375
(applySettings → `modView.sync()`). MECHANISM: each reads geometry → a forced style + layout of the whole, still-growing
document, three times before the first frame. MEASURED (boot-modwin): rebuild 7.9–9.9 ms (its place() 3.4–4.0), paint(true)
4.7–7.1 ms, paint(true) inside applySettings **12.0–21.7 ms**. A/B (7 v 7; B = `place()` returns and `paint()` keeps only
`paintRings()` while `!P.open`): boot() after the field **161.1 → 141.4 ms (−19.7)**, applySettings 17.8 → 2.9 — but the
first rAF did not move (743.2 v 743.9 ms from boot entry) and the second is −6.1 ms: the layout moves into frame 1.
Honest gain ≈ 20 ms off the boot task, ≈ 5 ms of net layout work. HISTORY: wave 64 (`rebuild(); place(); sync()`), wave 98
(`lastDead` re-place), wave 65 (arm lamp through sync), wave 52 (cadence in settings). READERS: `paintRings` must keep
running closed — the rings live on the HOUSE knobs ("keeps wearing it with this window closed"); routed-knob, mir-controls,
lfo-tension suites. RISK: first-open centring then uses the viewport at open time (identical unless resized in between);
`lastDead` stays −1 until open (open() places anyway). EFFORT S.

**FE3 · Opening the modulation window rebuilds it twice.** WHERE: rack.js:4064–4069 `expand(){ modView.open();
modView.wake(); … }`; modwindow.js:2911 `open(){ … rebuild(); place(); paint(true) }`, 3067 `wake(){ rebuild(); paint(true) }`.
MEASURED (3 opens): **49–80 ms per open**, 2 rebuilds / 4 place() / 4 paint(true); the second rebuild + paint = 15–28 ms
(≈ 35 %). HISTORY: both lines arrive in the squashed `3ea35c2` (waves 50–106: wave 55's expand, wave 64's port); wake()'s
own doc — "the window OPENING re-reads the model" — is what open() already does. READERS: `layout.modulation.expand` ←
M key, the pill, `LW.mod.expand`; no test holds device-node identity across an open. CHANGE: `expand()` calls `open()`
only. NEUTRALITY: the second rebuild re-reads the same model into the same structure, same ids/classes. RISK: none found
(mir-controls suite). EFFORT S.

**FE4 · 124 CSS selectors (12.7 KB) match nothing and name classes no code builds; 98 of them are the wave-52 modulation
CARD, whose JS wave 64 deleted.** WHERE: lab.css — 100 selectors, 9.8 KB (`.mod-srcs, .mod-card, .mod-strip, .mod-base,
.mod-now, .mod-span, .mod-rt, .mod-grip, .mod-sh …`; `.keys-row/-label/-chip/-say`; `#transport.mini .fd-label/.ro-label/
.k-label` — the kit's classes are `-lbl`, these never matched; `.km-action-sep`); skin.css — 24, 2.9 KB (the `.mod-*` phone
block, `.ui-hide` ×7, `.keys-chip`, `.hint-i`, `.wave-row-5`, `.tempo-eyebrow`, `.native-tempo-hz`, `.seg-lbl`,
`.pal-preset`). MEASURED (css-orphans, 5540 elements: every window open, legacy card un-hidden, a float + compact window,
modulation open with LFO/ENV/AUDIO + SET sheet + macro + route + pop-over, notebook on three faces with a saved project,
keymap, every menubar list, + and ☆ lists, tempo panel, both disclosures, all SETTINGS pages, warning pane, banner):
lab.css 396 match / 107 state-only / 211 none; skin.css 297 / 35 / 119. Of the "none" set, 124 name a class found in no
`lab/**.js` and not in `index.html` (two false positives removed by hand: `hist-future` is built as `'hist-' + state`,
`katex-display` by KaTeX). HISTORY: REPORT wave 64 — "`lab/modview.js` — 1705 lines — is DELETED" and `.mod-ghost` "is
deleted rather than shipped beside it", but the card's rules stayed; the 2026-09-10 pruner removed only shadowed
declarations (REPORT "The cascade"); `keys-*` were orphaned by `5f6421e`; `.ui-hide` last had a builder before `d3df5b4`
(waves 5–49). READERS: none. Runtime gain ≈ 0 (a rule keyed on a class nobody wears is never a match candidate); the gain
is 12.7 KB of 510 KB CSS and a sheet that describes the app. Second tier (token still in source, element never present
after boot — verify each): `.keys-list`, `.dev .keys-list`, `.palette-seam …` (native-ui.js:38 removes the node at boot),
`.native-clean .grp .grp`, `.native-clean[data-id="observer"] .grp`, `…camera-motion .sw`, `.orbit-row/-band/-id`,
`.orbit-c.drive`, `.dyn-row`. CHANGE: delete the 124 (css-orphans.json lists them with their @media context).
NEUTRALITY: MIR `tools/stylehash.mjs` over all windows × both themes hashes identical (no element matched). RISK: a class
assembled by string concatenation the probe cannot see; the two found are excluded. EFFORT S.

**FE5 · The SETTINGS-KEYS remnants (09-08) are a second, dead binding path inside the keyboard dispatcher.**
WHERE: rack.js:5044 (`capturing`, `capturePending`), 5121–5142 (the capture branch), 5204 (`keys.capture()`, `capturing`),
1713–1714 (no-op `ui.keysRefresh` stub, `ui.keysSay`), 4205–4206 (`prevKR` chain), 4208 (`layout.keysheet = layout.keymap`),
5144 (Escape on `keysheet` — unreachable: the same object as the line above), 5908 (`LW.keysheet`), 3656 (`'keysheet'` in the
occlusion id list: getElementById → null every 300 ms), native-ui.js:63 (removes a `.keys-list` nothing builds).
HISTORY: `5f6421e` deleted the SETTINGS KEYS group (`.keys-list`, its chips calling `keys.capture`, the `keys-say` status
region, THE KEYBOARD and RESET KEYS triggers) and left these stubs; the keymap (waves 106/112) binds through
`__LW_hooks.keys.bind`. READERS: `tests/access.test.mjs` A11 (`tabRefused` regex over rack.js source); legacy reads
`__LW.keys.capturing` and `LW.keysheet`. The Tab-reservation law A11 guards also lives in `lab/shortcuts.js:23`
(`bindAction` refuses Tab for a non-stage action). CHANGE: CUT the capture branch, `capture`, `capturing`, `ui.keysSay`,
the alias, the dead Escape line, the occlusion id and native-ui.js:63; keep `ui.keysRefresh` as a plain keymap-refresh hook;
retarget A11 to shortcuts.js:23. KEEP the ACTION id `'keysheet'` (localStorage overrides are keyed by id).
NEUTRALITY: nothing calls `capture`. RISK: the access suite until A11 moves. EFFORT S (~30 lines).

**FE6 · Write-only and reader-less bindings** (rack.js line · history · readers → verdict). `periodVersion` 2981 (+5 writes)
· superseded by wave 45's in-place key `pk` · none → CUT. `gov.since` 431, 1238–1240 · wave 45 · none, not on
`LW.governor` → CUT. `const wStyle = wObs` 1491 · wave 56 / board #59 merged DRAW STYLE into WAVE · only its own comment →
CUT. `LW.version` 5950 (`'QWAVE-0.1 … 2026-09-03'`) · QWAVE-0.1 · none (`LW.build` is the version) → CUT. `infoPanel` import
7 · 09-08 native rework · unused in rack.js → CUT. `LOGO_SCALE`, `layout.menu.scale/.enlarged` 4108/4174 · wave 53; "WAVE 79
DELETED THE ENLARGE" (4147) · legacy only → CUT. KIND entries `modulation`, `about` 406 · wave 26 taxonomy; that card
(wave 64) and ABOUT (wave 30) left the rack · none → CUT (KIND itself is alive: `data-kind="info"` drives kit base.css:72,
the ⧉ COPY buttons and the boot folds; `orbitals` and `history` are absent and fall to "other"). `ui.kepEcc` 3537/3540 ·
introduced read-only in `ce70497` (wave 107), never assigned · dead branches → CUT. `ui.partOn` 5008 · never assigned →
CUT. `tablet.DPR` 4877 · iPad pass · unread; syncPhone hard-codes 1.5 at 4891 → MERGE (read it). ~25 lines. EFFORT S.

**FE7 · Duplicated helpers and duplicated modules.** (a) rack.js:1610 block-local `hexToRgb`/`rgbToHex` shadow the
`palette.js` exports inside the window block 1495–1974 (used once each, 1613/1627); outputs identical for `#rrggbb` input
and every number (both clamps return NaN for NaN) → MERGE (import `hexToRgb`, delete 1610). (b) `pointerRay` 3415–3421 and
`unproject` 3548–3552 share four identical lines → `unproject` = `pointerRay` + plane solve, bit-identical (same expression
order) → MERGE. (c) `pAlong(axis)` 2100 v `pAlongDir(dir)` 3600 → KEEP: each mirrors its own kick's rotor convention
(`AXIS_TO_Z`, one rotor, v `rotorsToZ`, two), so results differ in the last bits. (d) `lab/palette.js` ≡ `lab/mir/palette.js`
but two comment lines (33 KB each, both precached); `lab/notebook-render.js` ≡ `lab/mir/shell/notebook-render.js` (same
sw.js hash `60f8e1193c27`). The wiring allowlist (2026-09-21; hard failure at 60 days = 2026-11-20) names these very
migrations → MERGE: import the kit copies from rack.js, paletteview.js, statelink.js; delete the lab copies; update
`tests/{palette,ink,statelink,wiring}.test.mjs` and `current.browser-test.mjs` imports. RISK: none for (a)(b); (d) deletes
only lab-side files, so `adopt.mjs --check` stays "in step". EFFORT S.

**FE8 · L15's "three control-seating blocks" are two laws, and a naive merge is not neutral.** restore()'s material block
(5321–5343) and `hLookWrite` (5542–5569) seat the same ~20 look controls, but restore writes `k.set(v)` and history writes
`setKnob` — which, on a modulated id, calls `show()` and leaves the knob's base alone. Merging onto either mode changes a
stored base for a routed knob. `applySettings` (347–403) seats browser preferences (theme, frost, card, accents, camera feel,
closed windows) and overlaps only FRAME/AXIS/INVERT/AXIS COLOUR. HISTORY: restore since the first instrument commit
`3a03b92`; the look ring wave 106; applySettings waves 26/45/51/54. CHANGE (only inside seam 14): one `LOOK_CONTROLS` table
and `seatLook(L, write)`, called with `(k, v) => k.set(v)` by restore and `setKnob` by history; applySettings stays apart.
NEUTRALITY: `__LW.serialize()` bytes and a routed-knob round trip before/after. EFFORT M.

**FE9 · The legacy H₂⁺ card is built and ticked for old projects only.** WHERE: rack.js:2442–2467 (+ moleculeview,
moview, pulseview), loop 1291/1314, serialize 5231/5234, restore 5359/5366/5419. MEASURED: boot 4.8 ms, 224 elements, a
`resize` listener that repaints its hidden canvas (moleculeview.js:115; returns at W < 32), and on every CPU tick a
`tick('molecule')` (2 × `performance.now` + an EMA) because `powered(wMol)` is true — `molecule.update` itself returns when
off. HISTORY: wave 13, W-MO wave 41, W-PULSE wave 58; hidden by wave 108 with a stated law (a legacy save that holds the
field reveals its controls). READERS: `molecular-names.browser-test` (legacy save round trip), `render-regressions`
(`__LW.molecule.setOn`); serialize() writes `molecule.save()`, `moPanel.save()`, `pulsePanel.api.save()` into every project.
VERDICT: KEEP. Skipping the per-tick `tick()` while `!molecule.on && !(h2 && h2.on)` is neutral (update returns anyway).
Lazy construction only if the default save records stay byte-identical → lane D (L12). EFFORT S (tick) / M (lazy).

**FE10 · `reworkNative()` is three things, and only ≈3.5 ms of its 6.9 ms is surgery.** WHERE: native-ui.js:9–223,
called at rack.js:6052. (1) Surgery on windows rack.js already built: `.native-clean` + truncated `.grp-lbl` on 8 windows;
WAVE's groups/labels discarded and controls re-seated into `wave-row-0…6` (no 5); a FINISH seg added and
`ui.styleSeg.set` wrapped; INVERT moved beside REVERSE, `.palette-seam` removed; CAMERA's rows rebuilt (control row, motion
row, AUTOROTATE label); export readouts into a disclosure; SHADOW's readout + `.epi` into a disclosure; SETTINGS:
frame/axis switches replaced by enum segs (setters wrapped), GAMUT seg by a P3 switch (setter wrapped), accent arcs driven
by a MutationObserver, tabs + three pages, a WINDOW INFO switch, actions/help regrouped, old groups removed; STATE's rotor
and A/B rows reordered. (2) New construction: the transport's tempo panel (tiles from the artifact's `buildMacroSlot`,
the clock grid, bends, holds). (3) Globals: the `native-selected` tracker, then the kit's `consolidateWindowHelp()` and
`installControlHelp()`. MEASURED: 6.9 ms = surgery ≈ 2.1 + 0.7, tempo panel 0.5, kit help 1.1 + 2.4. HISTORY:
NATIVE-UI-REWORK.md (2026-09-08, GPT/Codex) — laid "over the existing, uncommitted Final II/audio work", which is why it
re-arranges instead of building; 09-10 moved `control-help.js` and `plane-model.js` into MIR. READERS: gates read
classes/ids, never the discarded wrappers; `ui.*` objects are moved, not rebuilt, so node identity already survives. To
build right the first time rack.js would construct WAVE as its seven rows with `.native-clean` (keeping `label:` on
spaceSeg/viewSeg for their aria and dropping only the `.k-lbl` node, or a kit option), create FINISH, the FRAME/AXES enum
segs and the P3 switch as the primary controls (no setter wrapping), build the CAMERA/SHADOW/export rows and disclosures
in place, and build SETTINGS as tabs/pages. VERDICT: not worth it for speed (≈3 ms); do it window by window inside seam 15
and lift (2) out unchanged as `native-tempo.js`. The setter monkeypatching is the best reason to fold. EFFORT M/window.

**FE11 · Two geometry reads left on pointermove paths.** (a) rack.js:4689 `measureRacks()` runs on EVERY pointermove of a
rack reorder drag (2 × getBoundingClientRect on a DOM `reorderTo` keeps dirtying), contradicting the wave-67 law written
40 lines below (4731–4733: "never in the move handler"); the drag-off-the-rack test needs it once per gesture. (b)
modwindow.js:382 — the window's own grip calls `place()` (≈10 rect reads interleaved with style writes) synchronously per
pointermove, where rack.js coalesces its drags per frame (wave 67, `coalesce`). HISTORY: waves 55/67 (rack), 64/93
(modwindow). CHANGE: measure at pointerdown and on resize (a); route the grip through `coalesce` with a flush on release
(b). NEUTRALITY: same final position (the release flushes, as rack.js does). Per-event cost is lane B/F's. EFFORT S.

**FE12 · A version string and comments that describe code that moved.** `BUILD_LINE` (rack.js:78) reads
`0.2.3-alpha.1 … 2026-09-23` on the v0.2.3-alpha.3 release: alpha.2 (`ea0297c`, 7 lines of rack.js) and alpha.3 did not
bump it, so ABOUT and the copy dump show the wrong build (ANTI-PATTERN 6; a bug fix). Stale paths/refs: rack.js:148–151
`lab/modhost.css` (→ `lab/mir/modulation/modhost.css`), 72 and 2584 `lab/mir/modwindow/` (→ `lab/mir/modulation/modwindow/`),
2756 `lab/mir/host.js`, 868 `mir/host.js`, 1998 `kit.js:213`, 2203 "line 72" (energyOf is at 99), 462 "DEFAULT 2.5"
(`CAM.MU_DEF` is 1.0), 482–483 a duplicated doc line, 3138 "in the key sheet", 3413 an orphan comment (belongs to
`unproject`); modwindow.js:115 `mir/host.js`, 134 `lab/mir/PORT-NOTES.md`, 2823 `rack.js:655` (audioSync is at 643), and
wave 64's "does not create one styled node" (it now builds the audio ranges, the matrix, route badges, the pop-over);
index.html:54 `lab/mir/modwindow/…css`, 134–138 "TWO LEGENDS, ONE BAR" (no legend bar exists). CHANGE: one comment-only
commit plus the BUILD_LINE bump. EFFORT S.

**Removal ledger (Q1)** — candidate · history · shipped readers · verdict. RETIRED_WINDOWS 413/3926 · wave 56, `style` →
`observer` in saved layouts · none (legacy reads `layout.retired`) · KEEP (every pre-wave-56 layout; 10 lines). DIGESTS
417/5965 · wave 44 notebook digests · the ⧉ COPY button on INFO windows · KEEP. LS_EXP/LS_PRES quick save 82/5302/5307 ·
first instrument `3a03b92` · STATE's SAVE/LOAD triggers + two FILE rows (live UI) · KEEP (product question: it predates
PROJECTS, 2026-09-10). Legacy H₂⁺ card · FE9 · KEEP. `__LW_hooks.*` (12) · every key has ≥ 2 lab readers · KEEP (they
become explicit exports when blocks become modules). Parked macro tools `sideGrip`, `matrixButton`/`renderMatrix`, ENV
`trig` (modwindow.js 1474, 1486–1543, 1680) · Final II + ARCHIVED-MACRO-TOOLS.md "do not re-enable without a new user
request" · none · KEEP. `stats`/`perf`/`autoQ`/`gov` · shipped tests read `stats.frames/presents/reconstructs/lastEncodeMs/
fps`, `governor.on/parked`, `perf.median/profile/resetRing`; the rest is the `LW` debug contract · KEEP (except `gov.since`,
FE6). SETTINGS-KEYS remnants · FE5 · CUT. `wStyle`, `periodVersion`, `LOGO_SCALE`, `LW.version`, KIND ×2, `kepEcc`,
`partOn`, `infoPanel` import · FE6 · CUT.

## 3. Leads I refute or refine

- **L15, refined.** "Three near-identical control-seating blocks": two overlap and are not identical (set v setKnob, FE8);
  applySettings is another concern. "Two copies of rgbToHex": true but trivial (block-local, used once); the larger
  duplication is whole modules (`palette.js`, `notebook-render.js` ≡ their kit copies, FE7d).
- **"reworkNative re-arranges the DOM" (BRIEF §3 Boot) is a third of the story** (FE10): it is also a component (the tempo
  panel) and the kit's help passes; its surgery costs ≈3 ms, so it is a legibility refactor, not a boot fix.
- **L12, refined with numbers.** Closed windows hold 45 % of the DOM, but build cost is concentrated: SLICE's 27.5 ms is
  most likely the document's first forced layout landing in `createSliceView` → `planeModel` (`cv.clientWidth`,
  `getComputedStyle`, mir/plane-model.js:23–26) — deferring SLICE would move that layout, not remove it (FE2's A/B shows the
  same effect) — while `createGas` (14.3 ms: 256 modes × 200 `sphj` quadrature rows, gas.js:43–50) is real eager maths for a
  basis used only after BOX › AXIAL 256. Lane D should defer `gas.build()` first.
- **"`__LW_hooks` is the write surface" (LANDSCAPE.md).** It is a boot-local late-binding table (never on `window`); all 12
  keys are live internal edges, not a test surface.

## 4. Things I would NOT do

- **Split rack.js by line ranges, or all at once.** REVIEW-2026-09-15 said it: arbitrary ranges move the coupling. The loop
  reads 139 boot bindings and writes 19; restore reads 68. Extract the low-coupling blocks first (§6).
- **Merge restore/hLookWrite on one write mode** (FE8): it silently moves routed bases.
- **Merge `pAlong`/`pAlongDir`** (FE7c): readout floats change.
- **Delete the parked macro tools, the H₂⁺ card, RETIRED_WINDOWS or the quick save** — each has a written reason to exist.
- **Adopt `lab/mir/shell/{notebook,menubar,accent,about,wordmark}.js` in this run.** The allowlist says it is planned, but
  those modules were harvested from rack.js and have drifted; it is a feature wave needing its own stylehash and serialize
  proofs. Do fix FE1 in rack.js's menubar now so the defects do not migrate with it.
- **Delete kit files the app never imports** (8 shell files, 79.9 KB): `lab/mir/**` is read-only; leaving them out of the
  precache is lane D's call and must keep `adopt.mjs --check` in step.
- **Sell FE2 as a frame-rate win.** It shortens the boot task; the first painted frame did not move.

## 5. Open questions for the cross-refutation round

1. FE1 "CLEAR the register": STATE's CLEAR (resets t, scrub, trail) or SPECTRUM's (c ↦ 0 only)? Today it is whichever is
   first in the DOM. Josh's call; I would take STATE's.
2. Lane D: is SLICE's 27.5 ms the first document layout? A forced `document.body.offsetWidth` mark just before
   `createSliceView` splits it.
3. Lane B/F: per-pointermove cost of FE11 (a) and (b) on a full rack / with the modulation window open.
4. Lane C: after FE4, re-run the MIR stylehash harness across windows × theme × card × frost to certify zero change.
5. The wiring allowlist of 2026-09-21 hard-fails on 2026-11-20: plan the shell migration, or renew with a caller named?

## 6. Seam table — rack.js

Closure edges from `seams.mjs` (reads = boot-level bindings used; writes = boot `let`s assigned; local shadows removed by
hand). Target modules are proposals; each extraction passes a deps object, no new globals.

| # | block | lines | L | reads | writes (boot lets) | target module / notes |
|---|---|---|---:|---:|---|---|
| 1 | motion preference | 1396–1429 | 34 | 0 | – | `motion-pref.js` → `{ MOTION, paceRate }` |
| 2 | busy mark | 720–751 | 32 | 2 (paintMarks, ensureTurnCSS) | – | `busy-mark.js`; `LW.busy` unchanged |
| 3 | worker pool | 777–819 | 43 | 1 (busyWrap) + `page` for warm | – | `worker-pool.js` (`makeWorker`, `solveCard/Chem`) |
| 4 | accent + mark + turn | 104–236 | 133 | 3 (mat, modView, readSettings) | – | `accent-wheel.js`; kit `mir/shell/accent.js` staged |
| 5 | swClient | 3233–3346 | 115 | 3 (badges.build, ui.set, layout.projects) | – | `sw-client.js({ say, projects, reload })` |
| 6 | badges | 3161–3231 | 72 | 8 | – | `badges.js` |
| 7 | + / ☆ lists | 4234–4336 | 103 | 4 | – | `rack-menus.js` |
| 8 | menubar (after FE1) | 4074–4177 | 104 | 11 | – | `menubar.js`; kit `mir/shell/menubar.js` staged |
| 9 | LEAN + KIND passes | 4210–4233 | 24 | 4 | – | `window-chrome.js` |
| 10 | keyboard dispatcher | 5033–5210 (ACTIONS 4969–5032 stay) | 178 | ~12 | uiHidden, govVersion, metersWall (toggleUI) | `keys.js`: OWNED, seatOf, matches, LS_KEYS, keyName — after FE5 |
| 11 | camera law | 446–500 + 1016–1104 | 144 | 8 | lastWall (camera.wake, queueKeyOrbit) | `camera-law.js({ obs, ui, schedule, modHand, saveSettings, resetWall })` |
| 12 | phone / tablet | 4782–4898 | 118 | 20 | cornerLayoutDirty | `phone.js`; lane F's L6 fix lands here |
| 13 | notebook + projects | 4337–4599 | 263 | 21 | refSnapshot (fresh) | `notebook.js` + `projects.js` (REVIEW-09-15's "next extraction") |
| 14 | persistence + look | 5212–5449, 5528–5595 | 306 | 68 | gasAxial, lastNmax, palChoice, space, stageMix | `project-state.js` over an `instrument` facade; FE8 inside |
| 15 | windows, one per commit | 1484–2937 | 1454 | 16–49 each | space, palChoice, stageMix/Follow, wheelLUT, gasAxial … | per-window modules; FE10's surgery folded per window |
| 16 | modulation defs + host | 2560–2850 | 292 | 37 | modHost, modView, modAdapters, knobIdCache, restampParams | `mod-targets.js` (defs table) + host wiring |
| 17 | layout object + floats + occlusion | 3618–4014 | 397 | 23 | occludeDirty, occludeAt | `layout.js`; `refreshOcclusion` is lane B's |
| 18 | page visibility | 847–917 | 72 | 23 | 8 loop clocks | stays with the loop |
| 19 | loop + router + governor | 919–1395 | 477 | 139 | 19 | last, and lane B's |

**Order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → (FE1) 8 → 9 → (FE5) 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17; 18–19 stay.
One block per commit; each commit: `node --input-type=module --check`, `bash test.sh node`, `node tests/pwa.test.mjs
--write`, the lead's `bash test.sh all`, and three neutrality reads (`__LW.serialize()` bytes on a fixed project,
`__LW.fieldDigest()`, MIR stylehash). Blocks 1–9 remove ≈ 660 lines from boot() with ≤ 11 closure edges each — the file
drops to ≈ 5420 lines before any hot-path or restore code is touched.

**modwindow.js (Q4).** Host wiring over the artifact (`lab/mir/modulation/modwindow/modwindow.js` builds the DOM):
listeners, `knobSpec` (normalised get/set per model field), paint, the ring overlay on house knobs (deliberately NOT the
artifact's `buildRing`: wave 64 / B131 measured it 14–23 px outside a λWAVES dial cell) and the curve editor over MIR's
`curve-gesture.js`. Second copies of kit logic are small: `TRAVEL` (the kit knob's 220/900/320 ladder, copied as numbers)
and `wireSlider` (a pointer contract for artifact nodes `knob()` cannot wrap). What moved into MIR: 2026-09-10 the whole
`mir/modulation/` (host, model, registry, curves, modhost.css); 09-11 MIR 1.1.0 took back the GPT team's in-place edits
(audio redesign, routing/compact layouts, labels); 09-21 MIR 1.4.2 `curve-gesture.js` (`c039347`, −154 lines here).
Host-built DOM that could go upstream later (not this run; the kit is read-only): the audio ranges/conditioning UI
(2366–2537), the parked matrix (1486–1543), the route badges in `buildRing` (705–723). Costs to fix here: FE2, FE3, FE11b.
Seams: `ring-overlay.js` (572–1090: geometry, rings, arming, pop-over; reads M, registry, clock, apply, status),
`audio-face.js` (1761–1839 + 2366–2596), `curve-editor.js` (2030–2364); paint/sync/rebuild/place/open remain the core.

## 7. Docs against code (Q6) — one paragraph for the docs commit

`docs/history/LANDSCAPE.md` ("what the code is, and where", 2026-09-07) is wrong in most numbers and several facts:
rack.js 5603 → **6080**; modwindow.js 2969 → **3084**; field.js 916 → **1468**; `lab/kit.js` 922 → `lab/mir/kit.js` **941**;
`lab/modhost.css` 2426 lines / 644 `:root:root:root` → `lab/mir/modulation/modhost.css` **2047 / 835**; lab.css 1378 →
**978**; skin.css 822 → **588**; statelink.js 592 → **613**; keymap.js 1009 → **933**, and "never yet opened in a browser"
is false (wave 107 addendum, waves 112–115, `tests/keyboard-window.browser-test.mjs`); history.js 182 → **157**; sw.js 307
→ **387**; tests 18,482 v app 26,824 → **23,906 (tests/**.mjs) v 42,928 (lab/**.js)**; `boot.browser-test.mjs` (8433 lines,
165 blocks, "the file you will spend most of your gate time in") now lives in `tests/legacy/` (8176) and is not the gate;
`mir.test.mjs` "proves lab/mir/ is byte-identical to the artifact" — the byte-frozen law was retired 2026-09-10 (MIR
1.1.0; `mir-manifest.test.mjs` checks adoption); REPORT.md 403 KB → **478 KB**; "`?play=1` and `?warn=0` exist for
automation" — `?warn` is webdriver-only since wave 59. HANDOFF.md's constraint "`lab/mir/modwindow/*` is byte-frozen …
skin in `lab/modhost.css`" names two moved paths and a retired law. README's "3.06 ms/frame at 96³ and 3.89 ms at 128³ ×
16 modes" is the 2026-09-02 measurement; today's baseline reads 3.76 ms at 96³ and 5.55 ms at 128³ (2 modes, 1920×994,
160/240 steps). `BUILD_LINE` says alpha.1 on alpha.3 (FE12). Either rewrite LANDSCAPE.md from these numbers or head it
"superseded 2026-09-24 — see AUDIT-E §6", and bump BUILD_LINE in the same commit.
