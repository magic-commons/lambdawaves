# BRIEF R2c · THE MATERIAL + THE SETTINGS CARD + THE FILM (0.5.2 "Rack Dissolution"; Opus builder; PAIR 3 with R2d — disjoint regions AND disjoint `app` slots)

**Read first, whole:** `research/release-0.5.2/PLAN.md` (§1, §2, the PAIR 3 row in §3, §4, §8, §9), **`R0-BUILD.md`** (§5 the namespaces, §6 the classes table and
the shared-let owners, §7 the `ui` contract), **`R1-BUILD.md`** §8–§9, **`R2a-BUILD.md`** (§1 THE READ LAW; §9 candidates; §10 merge notes), **`R3a-BUILD.md`**
(what `app.sh` holds; §7 candidates), **`R2b-BUILD.md`** and **`R3b-BUILD.md`** (PAIR 2 as built: the readouts' three seats, the kepler, the transport, the rack
wiring, the notebook, the keys — and what each registered), `BRIEF-R2b.md` (the pattern of a two-seat window row), `lab/windows/readouts.js` (a module with
MORE THAN ONE SEAT — your material and settings-card are that shape), `lab/windows/state.js`, `lab/shell/controller.js` (NEVER edit it), `tests/helpers/app-source.mjs`,
`tools/rack-deps.mjs` (`--classes`; the module-file mode; `PLANNED_CUT`'s anchors; G-A's accepted fills), `CLAUDE.md` (its last six paragraphs), `docs/STATE-SCOPES.md`.

## As-built facts (the integrator, 2026-10-10 after PAIR 2 — the launch tip `8796d15`; the BUILD files are the authority)

- **THE READ LAW (R2a, binding):** your three modules are seated AFTER the controller — a name that is a CONST by then (§0's consts, the loop's hoisted functions,
  the camera law's names, the rack, the controller's 68 on `app.ctl`, and what every earlier-seated module registered on `app.w` / `app.sh` / `app.host`) is
  DESTRUCTURED ONCE at the top of your module (`const { look, applyAccent, saveSettings … } = app.ctl;`) — the tool counts that as backward. A name `boot()` or a
  later module makes AFTER your seat is read through its slot INSIDE a callback (`app.sh.layout`, `app.w.periodEnergies`, `app.w.stageCaption`, `app.sh.LW`). A
  shared `let` is always `app.state.x`, live, never destructured. Reading a const through `app.<ns>.x` at use is NOT the pattern (a forward crossing each).
- **Your rows at the launch tip (the merged table):** material 131 lines, backward 11, forward 0, another scope's `app.state` 1 (+4 own), **fwd + shared 1**; settings-card 178 lines, backward 21, forward 1, another scope's `app.state` 4, **fwd + shared 5**; film 21 lines, backward 5, forward 3, another scope's `app.state` 3, **fwd + shared 6**. Limit 25, zero bare
  writes. Count before and after. (THE HINGE (G-G): bare writes across scopes 0; the largest moving module spectrum at 24 (limit 25) → HOLDS; 13 module files measured.)
- **The region** (`lab/rack.js` 2001 lines at `8796d15` — re-locate by grep on your base): §8's head `/* ── windows ──` :647 → the camera law :650 and
  `app.host.camera … rack` :654 STAY in `boot()` (the boot piece). Your region is the four seats `const wObs = device(` :658 … `const wClip = device(`
  :664 with the three `app.state` inits between them (:661–:663), then ONE block `{` :665 … `}` :997 that INTERLEAVES
  the pieces (`tools/rack-deps.mjs` `PLANNED_CUT` tiles it exactly so): **material** = :658–:693 (the seats, `gSpace` :668, `gDraw` :669, SPACE,
  OBSERVABLE, the WAVE knobs) and :844–:938 (`const gd = group(gDraw,` :844 the DRAW section, CLIP `gs` :876, PALETTE `gp` :904 with
  `app.state.palette = {` :914, INVERT, CAMERA `gc` :930 with `app.state.camKnobs = Object.fromEntries(` :935); **settings-card** =
  :694–:843 (`/* ── THEME and SURFACE` :694, `ui.set = device({ id: 'settings'` :695, INTERFACE `gi` :696, THEME · SURFACE `gt` :724, the
  stage hooks) and :971–:997 (FIELD QUALITY `gq` :971 to the block's end); **film** = :939–:944 (the header and `let exact = null,
  filmBefore = null, cap = null, facadeRun = null;` :944) and :956–:970 (`const film = () =>` :956, `const capture = () =>`
  :959, `take`, `app.state.capApi = {` :966); **`function filmHold(on) {` :945–:955 is the LOOP's piece and STAYS in
  `boot()`** (below). The block's one crossing between regions is `gDraw` (:669 → :844) — material to material. `// STATE — preparation` :999 is
  R2a's seat, right after the block.
- **The seats (G-O, the DOM-order law):** card creation order writes bytes (`closed[]`, `captureLayout`). The four `device()`s :658–:664 and `ui.set`
  :695 are the only card creations in the region; the RENDER and CURVES cards are made later (`app.state.filmCard = createFilmCard(` in §27). **Default:
  every span keeps its seat** — THE MULTI-SEAT SHAPE (R2b, and the tool's rule): the module's root builds the first span and RETURNS the later seats as
  **`function create<Y>() { … return { … }; }` declarations at the statement level of the create function's BODY** — inside `createMaterial(app)`, exactly as
  `createCalcMetersLadder` sits inside `createReadouts` in `lab/windows/readouts.js`; NOT a second top-level `create<X>` in the file (the tool's `measureFile`
  refuses a module file with more than one), and never an arrow or a nested closure (the tool reads those as deferred callbacks and their fills as never made): `const { wObs, wPal, wCam, wClip, createDrawClipPaletteCamera } = createMaterial(app);` at :658 and
  `createDrawClipPaletteCamera();` (your name) where :844 stood; `createSettingsCard(app)` the same (`createFieldQuality()` where :971 stood);
  `createFilmApi(app)` one seat where :939 stood. `lab/windows/readouts.js` is the worked example (its root returns `createCalcMetersLadder` and
  `createAtomsWignerRadiation`). **ONE seat per module is allowed only with the proof**: (a) no `device()` in the later span
  (true at the tip), (b) `ui.set.body`'s groups keep the order INTERFACE · THEME · SURFACE · FIELD QUALITY (true if one call runs both spans), (c) no span reads AT
  CREATION (outside a callback) a `ui.x` or name another span sets later than it would now run — grep each span's `ui.` reads against the others' `ui.` writes, say
  the result — and (d) `serialize-bytes` 11/11 full. Say which shape you chose and why.
- **`filmHold` stays in `boot()` as the loop's hold** (PLAN §3: "`filmHold` left beside the loop as `app.loop.hold`"): it reads the loop's closure lets (`rafId`,
  `stats`, `lastWall`) and `reg`, `mat`, `obs`, `rotRate`, `schedule`. Move the declaration :945–:955 OUT of the dissolving block to boot level
  just before your first seat (a hoisted function declaration: 2-space indent), with `let filmBefore = null;` beside it (split from :944; `exact`, `cap`,
  `facadeRun` go to film.js). The literal's `hold: null` (:137) becomes **`hold: filmHold` BY VALUE** (as `schedule` is; hoisting serves it — R0's U1) — no
  fill line. film.js destructures `const { hold } = app.loop;` and hands it to `createFilm(…, { hold })`. The body of `filmHold` does not change by one character.
- **`LW` — the facade object `createFilm(LW, …)` / `createCapture(LW, …)` take** (`const LW = {` :1625, §26, R5's) is boot's const; film.js cannot see it.
  **R3b added the slot `app.sh.LW`** to the literal and fills it on the line `window.__LW = LW; app.sh.LW = LW;` :1877 (R5 keeps that line in `boot()`). film.js
  reads `app.sh.LW` INSIDE `film()` / `capture()` (lazy — both are first called long after boot). That is film's forward `LW` the table already counts. No literal
  edit of yours but `hold:`.
- **`periodEnergies`** (film's `energies:`) is SPECTRUM's (`lab/windows/spectrum.js`); R3b fills `app.w.periodEnergies` in `boot()` on the line after SPECTRUM's seat
  (`lab/rack.js:1005`). Read it at use: `energies: periodEnergies` passes the function by value when `film()` / `capture()` first run, so `energies:
  app.w.periodEnergies` inside those lazies is the verbatim move. **`stageCaption`** (film's `caption:` and `pending:`) is THE STAGE TEXT's function (:1122) — **R2d moves it to
  `lab/shell/stage-words.js` beside you and registers `app.w.stageCaption` at its root**; the slot exists in the literal. film.js reads `app.w.stageCaption()` at
  use (both reads are inside closures already). In YOUR tree the slot is null until the merge, so write ONE boot-kept line `app.w.stageCaption = stageCaption;` at
  the head of `/* ── go ──` :1898 (a hoisted function; the pattern R2a used for persist's four) — **the integrator deletes it at the merge** (say so in
  your merge notes). Never touch :1099–:1240 (R2d's).
- **Fills you inherit — every `app.hooks.x = …` / `app.state.x = …` line inside your spans moves WITH its declaration and becomes your module's own
  registration; none stays in `boot()`:** settings-card: `app.hooks.theme` :733, `restage` :773, `setStageColour`/`setStageFollow`
  :784–:785, `setStage` :787, `setGamut` :828, `setTheme` :842 (the facade and the controller read
  them live through `app.hooks` — register them at the ROOT the moment they exist). material: `app.state.palette` :914, `app.state.camKnobs`
  :935 (live members, no change). film: `app.state.capApi = {` :966 (live). **The three inits :661–:663** (`capApi = null`,
  `camKnobs = {}`, `exporter3d = null`) repeat the literal's slots (`capApi: null, camKnobs: null, exporter3d: null`) — a SUBTRACTION: make the literal's
  `camKnobs: {}` (the `observer.*` defs read `app.state.camKnobs[id]` only after :935 ran, but `{}` keeps today's safety) and delete the three lines
  (−3; the comments on them describe "published out of the block", which no longer exists). **Every slot is filled exactly once**: grep `app.<ns>.<x> =` across
  `lab/` before you write any fill (PAIR 1 left four doubles; PAIR 2's are in their BUILDs).
- **What `boot()` reads of yours after the move** (RETURN it by destructuring at the seat, exactly as readouts does): the four card handles (`wObs`, `wPal`,
  `wCam`, `wClip` — SPECTRUM's five appends read them by name at their boot seat), `ui.set` stays `ui.set`, `filmHold` stays boot's. Grep each name your spans
  declare against the rest of `rack.js` (`node tools/rack-deps.mjs --section 8`, then the walker: every boot-level reader) and list what you return; a MOVED module
  that reads one of your names gets a slot (`app.w.wObs`… exist in the literal — persist destructures some: register those eagerly at the ROOT).
- **`app.hooks`** is read live by the facade (`LW.setStage`…), the controller and native-ui; **`app.ui`** stays ONE flat registry — every `ui.x =` keeps its name
  (R0 §7: `native-ui.js` RE-PARENTS controls across cards and runs last; `badges.js` reads `ui`).
- **Tests that read the SOURCE:** `tests/first-run.test.mjs` (the quality seed — FIELD QUALITY is your settings-card's second span; R3a re-pointed it once),
  `auto-scale.test` (indentation-sensitive slices; R1 re-pointed), the boot suite's B108/B112. A law that slices `rack.js` for a line you move is re-pointed through
  `appSource()` in the SAME commit — grep `rack.js` in `tests/*.test.mjs` and `tests/legacy/boot.browser-test.mjs` for your spans' text first.
- **The tool** (`tools/rack-deps.mjs`): `PLANNED_CUT`'s anchors tile the block today (`const wObs = device(`, `/* ── THEME and SURFACE`, `const gd = group(gDraw,`,
  `/* ── THE FILM (0.5.0 C7`, `^ {4}function filmHold(on) {` → loop, `const film = () => exact ||`, `const gq = group(ui.set.body, 'FIELD QUALITY')`). After the
  move each SEAT line must still match an anchor (keep the header comments at the seats verbatim, as R2a kept `// STATE — preparation`), `filmHold`'s anchor
  re-indents (`^ {4}` → `^ {2}`), and **the settings-card's `file:` becomes `lab/windows/settings-card.js`** (the MODULES table says `lab/windows/settings.js`; a
  second `settings.js` beside `lab/shell/settings.js` is a trap — one string in the table). The module-file mode then measures your three files. Say the diff.
- **Line law:** `lab/*.js` + `lab/shell/` + `lab/windows/` = **27,893 of a 27,943 cap after PAIR 2 (50 lines for the EIGHT modules still to move,
  seven of them PAIR 3's and R5's; the cap WILL be passed — that ruling is Josh's at R-V, not yours).** Your part: three headers + signatures + returns ≤ 15 lines
  IN ALL, no new blank lines, the three inits gone (−3), `hold` by value (−1 vs a fill), and every subtraction you find while you move (a dead branch, a
  duplicated comment) — say them. Say your exact Δ.
- **Disjoint from R2d** (running beside you): you touch :658–:997, the literal's `hold:` (:137), one line at `go` :1898,
  `PLANNED_CUT`'s rows for your pieces, and the import lines your spans alone use. R2d touches :1019–:1240 (MOLECULES · the stage text · MO-REGISTRY), :1244–:1490 (the modulation seam),
  :1557–:1607 (INK), the `PLANNED_CUT` rows for those, and ITS import lines. An import you BOTH use stays in `rack.js`; the import block will conflict
  on adjacent deletions — that is the integrator's. Never edit a line outside your region + your seats + the lines named here; `rack.js` must otherwise auto-merge.
- **The rig** (since ≈ 02:00): the GPU draws 2–3 frames a second and stalls on the heaviest states ("Render did not settle: animation frames stopped" — the lock's
  gas state, molecule opens in `settings-probe` (WATER / N₂) and `serialize-bytes`' base export (WAVE DANCER), `hit-probe-set`, `frame-occlusion`'s chipGap),
  frame-paced waits go red (`history` 3b/9b, `new-project`'s LFO, `film-handover`'s takes may time out), marionette dies after ≈ 5 in-session reloads — all on
  the BASE as well. **A red of that kind is checked ONCE against your base export on your second port: identical = the rig; record BOTH readings in the BUILD and
  move on. Never loop on it; never touch another process.** If the base export dies in `serialize-bytes`, compare your tree's shas to R1's recorded base reading
  (`r1-measure/sb-base.json`; R3a's `.tmp/sbcmp.mjs` pattern). Josh may reboot during your run: if your servers die, restart them by the same commands and continue.

## The contract (a MOVE, not a rewrite)

1. **What moves:** WAVE's head + SPACE + DRAW, CLIP, PALETTE / INVERT, CAMERA (two spans) → **`lab/windows/material.js`** `createMaterial(app)`; the SETTINGS card
   (INTERFACE · THEME · SURFACE · the stage hooks; FIELD QUALITY — two spans) → **`lab/windows/settings-card.js`** `createSettingsCard(app)`; THE FILM / capture
   (`film()`, `capture()`, `take`, `app.state.capApi`) → **`lab/windows/film.js`** `createFilmApi(app)`. `filmHold` stays in `boot()` as `app.loop.hold`. The camera
   law and `app.host.camera…` stay.
2. **Called at their seats** (G-O); the code VERBATIM (indentation kept; comments and headers travel; no renames beyond R0's `app.state`); each module destructures
   its consts once (THE READ LAW), reads later-made names through their slots inside callbacks, registers on `app.hooks` / `app.w` what a reader outside it needs
   (the inherited fills above), returns to `boot()` what `boot()` reads; every `ui.x =` stays under the same name on `app.ui`.
3. **Imports** the spans need move from `rack.js` to the modules (say how many; `TIER` from `'../rack.js'` is the accepted cycle; `createFilm` /
   `createCapture` / `createRampPanel` / `createCameraPanel` / `maxPictureSize` / `PAL_DEF`… — check each with the free-names script
   `research/release-0.5.2/r3a-measure/freenames.mjs` against your base BEFORE the browser does).
4. **`defs` is not yours** (U2: the ONE route table is R2d's modulation seam). **Never edit `lab/shell/controller.js`**, `lab/mir/**`, `lab/fonts/**`.

## Acceptance (the light check)
- `bash test.sh node` 0; `node tools/rack-deps.mjs --classes` before/after (`material`, `settings-card`, `film` from their files, ≤ 25, 0 bare writes;
  `tests/rack-deps.test.mjs` green); **the FILM-hold row's witnesses** (PLAN §2 G-M): `film-handover` 4/4, `take-in-bugs` 4/4, `node tests/render-exact.test.mjs`,
  `tools/perf/film-probe.mjs` + film-compare; `tools/camera-routes.mjs` 5/5; `camera-shift`; `curves`; `first-run` 12 (the quality seed); `node
  tests/first-run.test.mjs` + `auto-scale.test` (re-pointed if they slice your lines); `serialize-bytes` 11/11 full + edit vs your base export; `settings-probe`
  0/6 (5 reached if marionette dies); `lw-facade` 1/1; the boot suite's WAVE / SETTINGS / CAMERA / PALETTE blocks alone (chunk runner — `grep -n "WAVE\|SETTINGS\|
  CAMERA\|PALETTE\|CLIP" tests/legacy/boot.browser-test.mjs`); `node tests/pwa.test.mjs --write` after every `lab/` edit. THE LOCK is not yours: `filmHold`'s body
  and the film's `frame(i, ctx)` road do not change (if either does, STOP and say so).

## Commits (each followed by `R2c-HANDOFF.md`)
1. `0.5.2 R2c · lab/windows/material.js + settings-card.js + film.js: WAVE · CLIP · PALETTE · CAMERA, the SETTINGS card and the film road move verbatim; filmHold stays as app.loop.hold; the inherited fills become registrations` (+ pwa).
2. `0.5.2 R2c · the light check; the classes table; R2c-BUILD.md; wave 221` (REPORT.md under the 0.5.2 heading; the drafted CLAUDE.md sentence in the BUILD, not
   applied).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours **9103/5573** (your tree) + **9107/5577** (the base
export: `git archive <sha> | tar -x -C <dir>`, served with `LW_CERTS=<your worktree>/.certs`). `python3 tools/gate/server.py <path> <port>` (run_in_background);
`LW_PORT=… GD_PORT=…`. ONE browser at a time on the rig — R2d runs beside you: `node research/release-0.5.2/r2b-measure/rigfree.mjs` (exit 0 = free; it reads
`/proc` by argv0, so another builder's poll that merely NAMES "marionette" never counts — `tools/perf/wait-gpu.mjs` does count it and two pollers can hold each
other "busy" for minutes, R2b candidate 5) before EVERY suite; if another suite is running, wait (poll every 30 s); never kill another's process; stop yours by
pid; never `pkill -f`. The shell guard refuses compound lines (plain commands or `bash .tmp/x.sh` / `node .tmp/x.mjs`). Never edit `lab/mir/**`, `lab/fonts/**`,
`lab/shell/controller.js`. No `sed` over `rack.js`. Subtract, don't add. Never merge, push, tag.
B149 is the standing law red; B6/B69 flake; `latex-copy`/`keyboard-window` red on the base — say them, don't fix them. The integrator's chunk runner:
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/chunk.mjs` (copy into your `.tmp/`). `R2c-BUILD.md`: the ledger
(rack.js and the three modules, exact), the classes table before/after, every suite's count with the base reading beside any rig red, the import fan-out, the
registrations and any boot fill left (the `go` line for `stageCaption`), the seat shape you chose and its proof, the tool diff, brief candidates for R5 / R-V, the
merge notes (the seat lines; what `boot()` destructures; the literal's `hold` edit), the drafted CLAUDE.md sentence, "what Josh will see" (nothing — prove it). Hand
back by message + try `~/.claude/handoffs/agents/<id>.md`.
