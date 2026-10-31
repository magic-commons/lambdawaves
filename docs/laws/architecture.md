# The architecture: the app literal, the modules, the graph

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 021

NO MODULE IMPORTS FROM rack.js (021 G1, D1): `TIER` is `lab/tier.js` and `BUILD_LINE` is `lab/build-line.js`; only `lab/main.js` imports rack.js. The app's dependency graph has no cycle: `npx --no-install dependency-cruiser --no-config --include-only '^lab' --output-type json lab` counts 0 app-side circular edges at 021 D1 (the kit's 37 are its own) — the number to keep.

THE WINDOWS gain `lab/windows/gas.js` `createGas(app)` (the BOX rows, seated after SPECTRUM), `lab/windows/equalizer.js` `createEqualizerCard(app)` (EQUALIZER · AUDIO IN · CHORD, returns `syncEq`) and `lab/windows/folders.js` `createFolders(app)`; a window's ⧉ digest is returned by its install and collected by rack.js (no DIGESTS literal); the maths worker's ops are the `OPS` table in `lab/mathworker.js` with `chem`/`basis`/`speculative`. (021 G2, G3)

The dream's five contracts — ONE STORE, ONE ACTION REGISTRY, ONE TIME, ONE MODE, ONE KIT — are `research/iteration-021/PLAN.md` § THE DREAM; their laws sit in scopes-and-records.md, shell.md, modulation-and-timeline.md, chemistry.md and kit.md.

## The standing paragraphs

THE CONTEXT (0.5.2 R0, "Rack Dissolution"). `boot()`'s ONE `app` (the last statement of its head, `lab/rack.js`, grep `const app = {`) is
fixed-shape namespaces — §0's consts by value, `ui` (the one flat registry `native-ui.js` and `badges.js` read and write), `hooks`, `state`,
`loop`, `host`, `w`, `ctl`, `sh` — each ONE literal with every key, never extended, never `Object.assign`ed into, never deleted, and none of
128 keys or more (V8 makes such a literal a dictionary; `tools/perf/app-shape.mjs` asks `%HasFastProperties`). Every `let` two planned
modules touch is `app.state.x`, read and written live, never destructured; consts and functions keep their names; a null slot is filled by
the row that moves its first reader (a module registers its own names when it is created, a boot-kept name right after its declaration).
Rename a shared binding only with `node tools/rack-deps.mjs --rename`, never `sed`; `node tools/rack-deps.mjs --classes` is G-G (0 bare
cross-module writes, forward + shared ≤ 25 per moving module; the loop and the boot head exempt — they stay in `boot()`) and
`tests/rack-deps.test.mjs` its law. A law that reads the app's SOURCE reads `tests/helpers/app-source.mjs` (`appSource()` in node,
`appFiles()` fetched in the page: rack.js, then every module under `lab/windows/` and `lab/shell/`), never `lab/rack.js` alone.
`tests/lw-facade.browser-test.mjs` pins `window.__LW` — names, kinds (get / method / value) and order — against
`tests/fixtures/lw-facade.json`; a row that changes the facade re-captures it with `--write` and says the diff.

THE CONTROLLER (0.5.2 R1) is `lab/shell/controller.js` `createController(app)` — the governor and AUTO SCALE's one rule, the look, the
busy marks, the mod port, the rotation drive, `createField` and its GPU recovery, the maths workers and the ONE ROAD of state mutations
(`touchState`, `loadPreset`, `setReference`, `api`) — moved verbatim; `boot()` awaits it at §2's seat and destructures its 68 names there,
so the frame loop (§5–§6), `schedule`, `filmHold` and §13–§14 stay in `boot()` and read closure slots. The 56 of those names a later
module reads are filled on `app.ctl` once, at the end of `createController` (never by a window or shell row); the 12 only `boot()` or the
loop read stay closure slots, and a module created BEFORE that seat (§1 SETTINGS) reads `app.ctl.x` inside a callback, never at creation
(they are TDZ above the seat). The worker road is `new URL('../mathworker.js', import.meta.url)` in that module; `node tools/rack-deps.mjs
--classes` measures a moved module from its own file (`lab/shell/*.js`, `lab/windows/*.js`), and an unplanned file there is refused.

THE WINDOWS (0.5.2 R2a; 018 C1 retired `state.js` — A ↔ B · TRANSITION and the register's CLEAR are `lab/windows/transition.js` `createTransition(app)`, seated at `// TRANSITION — A ↔ B` before SPECTRUM, building `ui.abBox` that spectrum.js mounts between the 140 table and the presets; `app.w.clearRegister` is filled at that seat): STATE (with its CLEAR) WAS `lab/windows/state.js` `createStateCard(app)` and SPECTRUM `lab/windows/spectrum.js`
`createSpectrumCard(app)`, moved verbatim and created at their seats under the kept `// STATE` / `// SPECTRUM` lines (the five appends
stay in `boot()`). THE READ LAW for a moved module: a name that is a CONST by the time its seat runs — §0's consts, the loop's hoisted
functions, the rack, the controller's 68 (`app.ctl` is filled before the controller's seat returns) — is destructured ONCE at creation
(`const { gov, look } = app.ctl`), which the tool counts as backward; a name `boot()` makes LATER is read through its slot inside a
callback (`app.w.gas`, `app.sh.layout` …, registered by the module that makes it, or filled in `boot()` right after the declaration of a name `boot()` keeps (`app.host.camera`, `app.loop.page`) — a module created before the
controller's seat, §1 SETTINGS, reads `app.ctl.x` that way too); a shared `let` is always `app.state.x`, live. Reading a const through
`app.ctl.x` at use is NOT the pattern — the tool counts every `app.<ns>.x` read as a forward crossing and SPECTRUM would read 32 > 25.
Each module registers on `app.w` only what a moved reader needs; a fill placed inside a moving module's span counts against that module.
`node tools/rack-deps.mjs --classes`'s G-A accepts an eager fill from a module file seated earlier (`tests/rack-deps.test.mjs` §5).

SETTINGS, PERSISTENCE, THE LINKS and THE TRUE HISTORY (0.5.2 R3a) are `lab/shell/settings.js` `createSettings(app)` (§1, created BEFORE the
controller's seat, so it reads `app.ctl.x`, `app.host.camera`, `app.sh.setModArm` and `app.sh.quality` inside callbacks), `lab/shell/persist.js`
`createPersist(app)` (`serialize` and `restore` whole), `lab/shell/links.js` `createLinks(app)` (§29's `openLink()` stays in `boot()`) and
`lab/shell/history.js` `createHistory(app)` (the HISTORY card with it) — moved verbatim and called at their seats; `readSettings` stays one hoisted
line in `boot()`'s head (§0 calls it first). `serialize` / `restore` / `save` / `copyJSON` / `esc` / `copyLink` / `lookSync` are registered on
`app.sh` by the module that makes them (STATE's SAVE / LOAD / COPY read them at use; `boot()` keeps no copy), and a slot a module reads that no
moved module owns yet is filled in `boot()` right after its declaration (11 lines, 30 slots, each moving with its owner's row). `tools/rack-deps.mjs`'
G-A: a module file's eager fills (`app.<ns>.x = …` at its root) run at its seat, so a later-seated file may destructure them; `Object.assign` into a
member's object (`app.ctl.domain`) is not an extension of the shape. A lost import is invisible to `rack-deps` (it reports only the unused
direction): a move checks each file's free names against the base (`research/release-0.5.2/r3a-measure/freenames.mjs`, copied into `.tmp/` and pointed at the base — it cannot run in place; a `tools/freenames.mjs --base` is a candidate) before the browser does.

THE SHELL (0.5.2 R3b): λWAVES' transport strip is `lab/shell/transport.js` `createTransport(app)` (`setModArm` a function declaration inside it); §19a is
`lab/shell/rack-wiring.js` `createRackWiring(app)` — createRack, the layout verbs (aliases over the kit's rack; captureLayout's v3 the WORKSPACE record), the
TRANSPORT card, the phone and tablet crossings, and §18's `devById` / `rackCardWidth` / `popFace` — with TWO seats: the module at §19a's, and its returned
`wireStage()` (the crossings' listeners and the stage gestures) right after the notebook's, where those statements stood; §19b (the skip links, the dock chip,
MENUS and the kit's menubar, THE NOTEBOOK, PROJECTS whole) is `lab/shell/notebook.js` `createNotebook(app)`; §20–§23 (`keyState`, the ACTIONS rows, the
KEYBOARD window, THE TIMELINE, the tab order) is `lab/shell/keys.js` `createKeys(app)` — moved verbatim, each destructuring what `boot()` made before its seat
and reading persist's, the history's, the keys' and the facade's names through `app.sh` at use (`app.sh.LW` is the facade object, filled on the
`window.__LW = LW` line). A boot function a module calls WHILE IT IS BEING CREATED must not read a name that module returns (`popFace` read `layout` and moved
with §19a for that). A name a moved module returns that a later module reads is filled in `boot()` on the returning seat's line until that module's file is next
opened, when the fill becomes its registration (`app.w.clearRegister` on STATE's seat, `app.sh.modSeats` on persist's, `app.sh.historyApi` on the history's; R5 sent settings.js', spectrum.js' and kepler.js' fills home).

THE READOUTS AND KEPLER (0.5.2 R2b): SHADOW · ORBIT · VORTEX · PLANE, CALCULUS · METERS · LADDER and ATOMS · WIGNER · RADIATION are `lab/windows/readouts.js`
`createReadouts(app)` at THREE seats — the root builds the first and returns `createCalcMetersLadder()` / `createAtomsWignerRadiation()`, which `boot()` calls
where CALCULUS and ATOMS stood (`READERS`, the track loop and `hydroReader` stay in `boot()`) — and THE BOW + KEPLER AS A CONTROL SURFACE is
`lab/windows/kepler.js` `createKeplerSurface(app)` (`keplerview.js` owns the name `createKepler`). THE MULTI-SEAT SHAPE: a module whose spans interleave with
other cards declares each later seat as a root-level `function create<Y>()` that its root returns, and `boot()` calls it where the span stood, so no `device()`
or append changes its order; `tools/rack-deps.mjs` measures such a function as eager at its own piece and its declarations as the module's own (an arrow or a
nested closure is read as a deferred callback and its fills as never made — the tool refuses that tree; `tests/rack-deps.test.mjs` §5). `rack.js` stood at
2,001 lines with PAIR 2 in (943 at the cut; 21 module files measured).

THE MATERIAL, THE SETTINGS CARD AND THE FILM (0.5.2 R2c): WAVE (SPACE, OBSERVABLE, DRAW), CLIP, PALETTE · INVERT and CAMERA are
`lab/windows/material.js` `createMaterial(app)` and the SETTINGS card is `lab/windows/settings-card.js` `createSettingsCard(app)` — each at
TWO seats (the root builds the first span and returns `createDrawClipPaletteCamera()` / `createFieldQuality()`, which `boot()` calls where DRAW
and FIELD QUALITY stood, so the cards keep their rack order; the card registers its seven stage hooks on `app.hooks` at its root) — and THE
FILM's road (`film()`, `capture()`, the takes, `app.state.capApi`) is `lab/windows/film.js` `createFilmApi(app)` at one. `filmHold` stays in
`boot()` beside the loop as `app.loop.hold`, handed to the film BY VALUE (`const { hold: filmHold } = app.loop`; the tool counts a slot the
literal holds by value under another key as backward), and `LW`, `periodEnergies` and `stageCaption` are read through `app.sh` / `app.w` at use.

THE MOLECULES, THE STAGE WORDS, THE MODULATION SEAM AND INK (0.5.2 R2d): MOLECULES with the molecular session and THE HEAD's seat, and
the register, are `lab/windows/molecules.js` `createMolecules(app)` at ONE seat, where the LEGACY note stands (iteration 008's fix round folded
MO-REGISTRY's second seat, which no longer made a device, into it: no `createMoRegistry`, no `app.w.wOrbs`; `app.w.wChem` is registered at its
end); THE STAGE TEXT with its caption is `lab/shell/stage-words.js` `createStageWords(app)` (it registers
`app.w.stageTextTick` and `app.w.stageCaption` at creation and returns `initStageText` for `go`; `app.state.stageText` is the literal's, assigned
live), the ONE `defs` table, `mod.install`, the pill's seat and dodge and `app.state.modView` are `lab/shell/modulation.js` `createModSeam(app)`,
and §18 INK is `lab/shell/ink.js` `createInk(app)` (it returns `refreshOcclusion` for the loop) — all moved verbatim and called at their seats under
the kept section notes. A name `boot()` makes after a seat is read through its slot inside a callback (`app.w.wLad`, `app.w.wCalc`,
`app.w.stageTextTick`, `app.host.rackL`, `app.sh.layout`, `app.sh.setModArm`), and `app.host.cameraPort` is filled on the camera law's line so the
seam can destructure it.

THE FACADE (0.5.2 R5) is `lab/shell/facade.js` `createFacade(app)`, which returns §26's `__LW` literal whole — key for key, getter for getter, its
comments travelling (`Object.assign` would freeze a getter into a value) — destructuring its 121 backward names once at its top (it is seated after every
module), reading its 21 shared lets as `app.state.x` and `warning` as `app.hooks.warning`; `boot()` keeps the `/* ── the diagnostics surface` header (the
tool's anchor), `const LW = createFacade(app); window.__LW = LW; app.sh.LW = LW;` and every member it adds later (`LW.curves`, `LW.bootView` …
`LW.stageText`, `LW.ready`, `LW.report`) at its seat, so `tests/fixtures/lw-facade.json` holds without `--write`. Every slot the facade reads is
filled exactly once by its owner (`research/release-0.5.2/integrator/doubles.mjs` reads 0), and `boot()`'s seat destructures keep naming what a module
returns even where only a module reads it: `tools/rack-deps.mjs --classes` knows a crossing name by its boot-level declaration.
