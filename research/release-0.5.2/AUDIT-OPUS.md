# AUDIT-OPUS · the one audit of PLAN-DRAFT-0 for 0.5.2 "Rack Dissolution" (Opus 5.5 @ high, 2026-10-09)

**AUDIT: COMPLETE.** This is the one Opus@high round Josh ruled for this release. Section 4 has the draft's own §2 and §3 tables with
**[OPUS: …]** marks inline. Everything else is notes. Every number below was measured on this tree (`183d061`, `yan-c`) unless it is marked
**[DERIVED]** or **UNMEASURED**.

**What I read whole:** `PLAN-DRAFT-0.md`; `ASK.md`; `RACK-DEPS.md` and `rack-deps.json`; `research/release-0.5.1/AUDIT-OPUS.md` (for its shape);
0.5.1 `PLAN.md` §8; 0.4.0 `HANDOFF.md` §4–§5; `lab/settings-store.js`; `lab/native-ui.js` (its `ui` uses); `lab/badges.js` (header + its `ui`
use); `lab/look.js` and `lab/first-run.js` (by grep for `ui`); `lab/mir/app.js` (`createApp`, lines 1–401); the headers of
`tools/serialize-bytes.mjs`, `tools/settings-probe.mjs`, `tools/perf/digest-lock.mjs`, `tools/perf/main-thread.mjs` and `tests/pwa.test.mjs`; `CLAUDE.md`.

**What I read in `lab/rack.js`:** §0 (95–162), §1 (163–304), §2–§5 (305–610), §6 the loop (611–1011) whole, §7 (1012–1082), the head of §8 and the
1100–1433 block whole, 1434–1442, 1837–1858, the §9 and §11 statement starts (1947–2478), the §19 statement starts (3101–3816), §24's
`serialize` and `restore` (4019–4140, and 4141–4312 by grep), §26's literal head (4549–4600) and foot (4718–4807), §27–§30 (4808–4931).

**How I worked.** I ran `node tools/rack-deps.mjs --no-write` and four read-only node scripts of my own under `.tmp/`:
- `audit.mjs` imports the tool's own lexer, scope walker and `analyze()`. It computes the residue per planned module, the writers, the
  shorthand and shadow hazards, the loop's names and the `LW` literal's key kinds.
- `classes.mjs` splits what crosses each module boundary into three classes: backward const, forward name and shared `let`.
- `block.mjs` lists the 1100–1433 block's own names that cross card regions.
- `imports.mjs` counts the import fan-out.

I used no browser and no GPU, and I edited no file except this one.

---

## 1 · Verdict

**SOUND WITH CHANGES.** The direction is right: a context first, measured, moves not rewrites, guarded by the lock, the pair and the bytes.
But the draft's own stop clause fires on the measurement. Every planned module needs **15 to 120** named locals beyond a 30-hub `app`. Even
with all 123 hubs in the context, it is 18 to 55 (§3). Josh ruled one round, so this audit supplies the re-plan, row by row, with
replacement text. The integrator can fold it without a second draft.

The residue is the wrong measure in the first place. Under an `app` filled in boot order, a const declared earlier costs nothing: a module
destructures it once at creation, and from then on it is a closure slot again, exactly as today. Two things cost something:
- **forward names**, declared by a module created later, which must be read lazily as `app.x`;
- **shared `let`s**, 67 of them with 843 references, which must be read and written live and can never be destructured.

**50** bindings are written from outside their own section, not "six". The frame loop is the outlier: it reads **49 forward names and 27
shared lets per frame**.

**The three changes that matter most:**
1. **R0 builds the WHOLE context, not 30 hubs, and makes no mass rename.**
   - `app` is a set of fixed-shape namespaces, each made by one object literal at the top of `boot()`.
   - Consts stay names: a module destructures them.
   - Every shared `let` becomes a property of `app.state` (or a verb on its owner), changed by a resolver-driven edit (the tool's token
     positions), never by `sed`.
   - The hinge is re-stated as "no bare write to another module's binding, and forward + shared ≤ 25 per planned module". It is measured by
     the classes table (§3.2), not by the residue.
   - Then every later row is a pure cut-and-paste, and two builders can never both need a new context member.
2. **The frame loop stays in `boot()` in 0.5.2.**
   - §5 THE BACKGROUNDED TAB and §6 THE ROUTER stay, and the film's `filmHold` (`rack.js:1381–1390`) moves beside them and is exported as
     `app.loop.hold`.
   - The window modules return their handles into boot's scope (`const { wSpec, spectrum, … } = createSpectrum(app)` at today's seat), so
     every per-frame read stays a closure slot.
   - R1 shrinks to the controller, the field, the workers and the one road (§2–§4, §7).
   - `rack.js` lands near **900 lines**, under the 1,500 cap.
   - Nothing on the frame path changes shape. The lock was never R1's witness anyway: it reads through `__LW.readPixels` and
     `__LW.fieldDigest`, not the rAF loop.
3. **Strike R4, defer R6, and re-cut R2 and R5.**
   - **R4.** `FAMILIES` and `WORKSPACE` are localStorage tables that a node tool imports statically, and most of their rows are not windows.
     `serialize()` is one literal that interleaves cards, and `restore()` is one ordered program.
   - **R2's shape** drops `slice` and `routes`. The route table stays ONE list, because `mod.install` takes one ordered array.
   - **R2's groups** are re-cut. WAVE, CLIP, FILM, TRANSPORT and HISTORY are in no row, and §11 is two things. The DOM-order law pins every
     card's creation and append seat.
   - **R5** moves the `LW` literal whole into `lab/shell/facade.js`. Assembling it with `Object.assign` would freeze its **49 getters**.
   - **R6.** New modules are born in their final folders. The engine move (existing files, with runtime-relative URLs) is its own small
     release.

---

## 2 · Errors and corrections, ranked (each with the file:line I read)

**E1 · The hinge measured, and it fails (HIGH: it decides the plan).**
G-G says "a module's deps ≤ 10 named locals beyond `app`", with R0 measuring it. I measured it now (§3.1). Under the draft's 30-hub context,
the residue per planned module is:

| planned module | residue |
|---|---|
| R1 host | 61 |
| R2 (whole) | 70 |
| R2a | 47 |
| the 1100–1433 block | 29 |
| R2d | 23 |
| R2b | 18 |
| R2c | 15 |
| R3a | 68 |
| R3b | 78 |
| R5 | 120 |

With all 123 hubs in the context, the figures are still R1 30, R2a 18, R3b 44 and R5 55. By the draft's own clause ("if a typical section still
needs > 10 named locals beyond `app`, STOP and re-plan"), the plan stops.

The residue also mis-counts the cost. A backward const is free once destructured. What costs something:
- forward names (lazy `app.x` reads);
- shared lets (live `app.x` reads and writes);
- above all, **writes to a binding another module owns**. There are 10 from the loop, 9 from the 1100–1433 block and 6 from SPECTRUM (§3.2).

**Correction:** replace G-G with the classes table (§3.2) as the measure. The hinge becomes two conditions:
- **zero bare cross-module writes**: every foreign-written `let` becomes an `app.state.x` property or a verb on its owner;
- **forward + shared ≤ 25 per planned module**, which the re-cut in §3.2 meets everywhere except the loop, and the loop stays in `boot()`.

**E2 · "The 151 forward uses are callbacks, so a progressively filled object serves them exactly as the closure does" (HIGH).** Four holes:
- **One is eager through hoisting.** `readSettings()` is called at `rack.js:131` (`useCompactDefaults`) but declared at `:166`. The tool says
  so: §10, "hoisted functions 1". An `app.readSettings` would have to exist before §0 runs.
- **"Deferred" is lexical** (`RACK-DEPS.md` §12). **39** forward uses target *function declarations*, among them `schedule`, `touchState`,
  `setGovernor`, `restore`, `serialize` and `save`. A callback that a constructor invokes synchronously during boot works today only because
  the declaration hoists: §2 hands `() => schedule(…)` to `createOcclusion`, `createModPort` and `createCameraLaw` (`rack.js:421, 473, 1088`).
  Through `app` it would throw. The tool cannot tell which of these run eagerly; U1 measures it.
- **Value capture.** 67 boot-level lets are read outside their section. 17 of them are assigned *after* declaration and read elsewhere: `chem`,
  `molSession`, `orbitals`, `states`, `register` (`:1951–1954`), `capApi` and `camKnobs` (`:1096–1097`), `stageText` (`:2032`), and others. A
  module that destructures them at creation freezes `null`.
- **The rename.** "A mechanical rename of ≈ 700 uses" is **2,670 references** for the 30: 2,253 const or function and 417 `let`. Of those, 39
  are shorthand `{ x }` sites (`mat` ×6, `obs` ×4, `reg` ×5 …), and `obs` ×4 and `rack` ×2 resolve to inner bindings. A text rename breaks all
  of them.

**Correction:** no rename for consts and functions; a module destructures them (`const { reg, clock, mat } = app`). Only shared lets change
spelling, by the tool's token positions: a `--rename` mode added to `tools/rack-deps.mjs`, a diagnostic in `tools/`. Hoisted functions that are
called before their module exists are found by U1 and are put on `app` at the top of `boot()`, where hoisting already makes them available.

**E3 · R1 moves the frame loop (HIGH: frame path).**
- **The loop reads the whole lab.** Its body (`rack.js:717–965`) has 469 boot-name references to 134 distinct names. 64 of them are declared
  outside §2–§7, and **49 are forward**: the windows, built later (`audit.out`, last block). In `lab/host.js` each would become a per-frame
  `app.<ns>.x` read.
- **Others write the loop's lets.** §5 writes eight (`:570–576`). The FILM block's `filmHold` writes `exportLocked` and `rafId`, calls
  `cancelAnimationFrame` (`:1384`) and writes `modWall` and `lastWall` (`:1389`). The camera law's `resetWall` (`:1089`) writes `lastWall`.
- **The lock is not this row's witness.** `digest-lock.mjs:16–30` reads the shipped pipelines through `__LW.readPixels`, `fieldDigest` and
  `linePixels`, not through the rAF loop. A loop move can shift the first-paint timing, the rAF registration or the hidden-tab law, and move
  no digest.
- **Hot-path cost.** I expect it to be negligible if `app` stays fast (a monomorphic property load against a context slot: about 1 ns per read,
  a few hundred reads a frame, well under 0.1 ms/s). It is NOT negligible if `app` falls into dictionary mode. V8 does that when an object is
  extended past about 128 named properties, or by `Object.assign` or keyed stores. That costs about 10–20 ns a read, roughly 0.2–0.7 ms/s at
  60–120 Hz. The pair cannot resolve below about 2 ms/s (`main-thread.mjs:14–15`), so the pair would not catch it.

**Correction:**
- §5, §6 and `filmHold` stay in `boot()` for 0.5.2, and the loop keeps reading closure slots.
- The window modules return their handles to boot's scope at today's seats.
- R1 = §2 + §3 + §4 + §7 (305 lines). Its witnesses are added in §4 below: `auto-scale.test`, `render-exact.test`, `gpu-recovery`, the boot
  suite's B108, and `film-handover` / `take-in-bugs`.
- The `app` shape law: every namespace is one literal with every key (null placeholders), never extended, never `Object.assign`ed, never
  `delete`d.

**E4 · R4 "the scope tables generated" cannot do what it says (HIGH).**
- **`FAMILIES`/`WORKSPACE` are not serialize's key order.**
  - What they are: `FAMILIES` is localStorage keys mapped to their owner and scope; `WORKSPACE` is the settings blob's arrangement keys
    (`settings-store.js:11–28`).
  - `tools/settings-probe.mjs` imports them statically in node (`:17`) and classifies with them (`:30, 39`). Tables "derived at boot" are
    invisible to it.
  - Of `FAMILIES`' 19 rows, none belongs to a window module: notebook ×3, projects, experiment/presentation, keys, keyboard position, lean,
    library, modpresets, modulation, `mir.gui`, projects.window, projects.seeded, session, render, curves, calib.
  - The `WORKSPACE` keys are owned by the layout, the notebook, modwin, the phone and the timeline, not by cards.
- **`serialize()` is one literal that interleaves cards** (`rack.js:4049–4074`). `presentation.readers` is `{ spectrum, slice, kepler }` (`:4055`)
  and `overlays` is `{ vortex, kepler, particles, dials }` (`:4072`). No registration order reproduces those bytes without an order table,
  which is the hand-kept table again.
- **`restore()` is one ordered program with cross-card dependencies:**
  - the Hamiltonian before the instruments (`:4202`);
  - `chem.load` → `orbitals.load` / `states.load` → `chem.setOn` → `orbitals.setOn` (`:4224–4235`);
  - the notebook size before the layout (`:4267–4268`);
  - the modulation re-base last (`:4300`).

**Correction:** strike R4 from 0.5.2. Drop `slice` from the window shape: `serialize` and `restore` move whole into `lab/shell/persist.js` and
read the cards' handles. The hand tables stay (`settings-probe` is their gate). An optional node check that a module's stated keys are ⊆ the
tables can come later.

**E5 · R5's assembly (HIGH).**
- **`Object.assign` would freeze the getters.** The literal has **171 keys**: 36 value, 37 shorthand, **49 getters** and 49 methods
  (`audit.mjs`, the `LW` kinds). `Object.assign` reads a getter once and copies the value, so `__LW.space`, `palette`, `history`,
  `uiHidden`, `timeline`, `render`, `keys`, `warning` and 41 others would freeze at boot.
- **The `windowActivity` duplicate is dead code, not a live defect.** The suites call `__LW.windowActivity.presentOffscreen(…)`
  (`tests/legacy/boot.browser-test.mjs:89`; `tools/perf/bench-chromium.mjs:73,75`; `bench-firefox*.mjs`). Only the raw service has it
  (`mir/window-activity.js:98,107`), and it is what the later getter returns (`rack.js:4757`). The wrapper at `:4723–4726` is never reached,
  and no test calls `__LW.windowActivity.state(…)`. "Fix the wrapper" would delete `presentOffscreen` and break four callers.
- **Deleting the first `frost`/`windowActivity` moves their enumeration slot.** In a literal, the first occurrence fixes a key's position.
  Nothing I found reads `Object.keys(__LW)` order, but G-W should pin the order deliberately.
- **G-W's node test reads the static walker's list.** Once members live in modules, `rack-deps` (which parses rack.js's literal) cannot see
  them.

**Correction:**
- R5 moves §26 whole into `lab/shell/facade.js` as `createFacade(app)`, which returns the literal, with getters and order kept: a move, not an
  assembly.
- Delete the dead wrapper and the first `frost`.
- G-W becomes a runtime fixture: `Object.getOwnPropertyDescriptors(__LW)`, names and kinds in order, captured on `v0.5.1-alpha` at R0 and
  compared by the boot suite or a small browser test.

**E6 · R2's groupings cut through the file's real seams (HIGH).**
- **Cards in no row:**
  - WAVE (`observer`; `:1093, 1101–1128, 1280–1311`), with its `material.*` controls;
  - CLIP (`:1099, 1312–1335`);
  - the FILM/capture (`capApi`, `:1375–1406`);
  - TRANSPORT's card (`:3279–3283`, inside §19);
  - HISTORY's card (`:4500–4501`, inside §25).
- **The 1100–1433 block is one `{ … }`** holding WAVE · SETTINGS · DRAW · CLIP · PALETTE · INVERT · CAMERA · FILM · FIELD QUALITY, interleaved.
  SETTINGS is two spans (`:1129–1279`, `:1407–1433`) and so is WAVE (`:1101–1128`, `:1280–1311`). It does split cleanly by region: 51 block-level
  names, and only `gDraw` crosses (WAVE head to WAVE draw; `block.mjs`). But R2c and R2d would each cut out of the middle of one block, and
  no row says so.
- **The DOM-order law.** Card creation order (`device()`, `:1093–1099, 1130, 1441, 1606 …`) and append order (`rack.appendChild`, `:1442,
  1607, 1849–1850, 1859 …`) decide the `.dev` order. That order is written by `saveSettings`' `closed` (`:222`, the settings-blob bytes) and
  by `captureLayout` (serialize). **Lines 1849–1850**, which append PALETTE, WAVE, CAMERA, CLIP and SETTINGS, sit *inside SPECTRUM's span*. This
  is why the residue of R2a lists `wPal`, `wObs`, `wCam` and `wClip`.
- **§11 is two things:**
  - the modulation seam (`:2193–2438`): the ONE route table `defs` (`:2238–2358`) for every card's targets, the transport pill's seat and dodge
    (`:2363–2420`), and `modView` (`:2421–2434`);
  - ATOMS · WIGNER · RADIATION, the `READERS` registry and `hydroReader` (`:2440–2477`).

  `mod.install(defs, roots)` (`:2359`) takes one ordered list, so per-card `routes` means re-ordering or an order table (U2).
- **MO-REGISTRY belongs with MOLECULES.** Its lets are declared at `:1954` and assigned at `:2165`, and its `devopen` calls `chem.prepare()`
  (`:2190`).

**Correction:** the re-cut in §3.2, with these rules:
- Every `create<Card>(app)` call stands at its card's current `device()` seat.
- The append lines stay in `boot()` at their seats.
- The shape is `create<Card>(app) → { handles…, its ui members registered into app.ui }`: no `slice` (E4), no `routes` (the table stays one
  module, `lab/shell/modulation.js`), and no `api` slice (R5 moves the literal whole).

**E7 · The 600-line cap is broken by the draft's own files (MEDIUM-HIGH).**
- **R1** puts §2–§7 + §13 + §14 (808 lines) into one `lab/host.js`.
- **R3b**'s `rack-wiring.js` is §19 + §20–§23 + §17 + §30 = 964 lines.
- **R2a** as one module is 736 lines.

**Correction:** §3.2. The largest module in the re-cut is §19b at 387 lines: the skip links, the dock chip, MENUS and the menubar, the notebook
and PROJECTS (`:3284–3670`).

**E8 · The `ui` bag's outside consumers (MEDIUM).**
- **Two of the draft's consumers are not consumers.** `look.js` and `first-run.js` do not take `ui`: the "2" and the "1" are word matches in
  comments (`first-run.js:27`). The real consumers are `badges.js`, which is handed `ui` whole (`badges.js:13`, `rack.js:2709`), and
  `native-ui.js`.
- **`native-ui.js` reworks the DOM:**
  - it reads about 45 members, some dynamically (`ui[name]`, `native-ui.js:33, 64, 66`);
  - it *writes* five: `finishSeg`, `shadowDetails`, `frameModeSeg`, `axisModeSeg`, `gamutToggle` (`:19, 37, 46, 47, 54`);
  - it *patches* `ui.styleSeg.set` (`:25`);
  - it *re-parents controls across cards*: STATE's rotation knobs (`:72–77`), SHADOW's details (`:37`), the SETTINGS pages (`:64–67`),
    TRANSPORT's `periodFx` (`:82`) and the A/B group (`:78`).

  After it runs, a card's root no longer holds all of its controls.
- **`ui.camSeg` is dead.** It is read at `rack.js:4174` and assigned nowhere.

**Correction:** R7-G keeps `app.ui` as one flat registry, made before any card. The seam is stable only under four conditions:
- `native-ui` runs at its seat, after every card (`:4892`);
- no module caches a control's method;
- no module looks its controls up under its own root after `native-ui` has run;
- no member is claimed private while `native-ui.js` or `badges.js` names it.

**E9 · Four builders in parallel (MEDIUM).**
- **The draft's cut makes the moves depend on each other.** Moving a card means every *other* moved module that reads its handles needs them
  on `app`. Under the draft's 30-hub R0, each R2 builder would add context members, so four builders would edit the same `app` literal and
  each other's references.
- **The spans interleave.** Creation order runs STATE · SPECTRUM (a) · SHADOW · ORBIT · VORTEX · PLANE (c) · MOLECULES (b) · MO-REG (a) ·
  CALC · METERS · LADDER (c) · the mod seam (d) · ATOMS · WIGNER · RADIATION (c). Disjoint "spans" are not disjoint seams.

**Correction:**
- R0 registers every cross-module name (E1, E2).
- Rows run in **pairs**: two builders on disjoint regions and disjoint namespaces, and a pair merges before the next pair starts.

**E10 · Tests that read `rack.js` as text will go red on every move (MEDIUM).**
- **The node suites:**
  - `auto-scale.test.mjs:12–13, 128–129` slices `  function controlStep(` and the loop's bookkeeping by **indentation-sensitive** markers;
  - `first-run.test.mjs:73, 95, 120–131` reads the quality seed (§1), `restore`/`serialize` strings (§24) and the GRID pairing (the SETTINGS
    block);
  - `ink.test.mjs:195–200` reads THEMES (SETTINGS);
  - `project-formats.test.mjs:198–205` reads `projectSnapshot`/`projectKey` (§19b);
  - `access.test.mjs:96`.
- **The boot suite fetches `./rack.js`:**
  - B108 reads `createField(dom.canvas, {` and `onLost` (`boot.browser-test.mjs:4653–4658`), which R1 moves, and also fetches `./field.js`,
    which R6 moves;
  - B112 reads `warned: S0.warned` (`:4856–4858`), which R3a moves;
  - `:5778` reads `vivid: 0.5, disconnected: true` (§0 stays).

  The draft's "B149 the only law red" will not hold.

**Correction:**
- One helper in `tests/helpers/`: `appSource()`, the concatenated text of `lab/rack.js` and the new modules. Each source-reading law reads it
  instead, in the same commit, with no law weakened.
- Code inside `create*(app) { … }` keeps today's two-space body indentation, so the slices still match.

**E11 · R6's path hazards (MEDIUM; it argues for deferral).**
- **`gpu-boot.js` shares the early adapter by URL.** `index.html:5–8` loads it first and async, and `field.js` "imports the same URL and takes
  the promise". If the specifier stops resolving to the same URL, there are two module instances and two adapter requests: M1 is silently
  lost, and no lock sees it.
- **Runtime-relative URLs:**
  - `molecules.js:501` (`./library.json`);
  - `library.js:85` (`./library/…`);
  - `mathworker.js:90` (`./vendor/bse/…`);
  - `rack.js:506` (`new URL('./mathworker.js', import.meta.url)`);
  - `chemview.js:250, 454, 515, 770`: string dynamic imports of `mathworker`, `rhf-molecule`, `response-fit`, `molecular-flow` and
    `molecule-state`. A static-import rewriter misses these.
- **The test and tool paths.** 67 node test files import `../lab/*.js` by path, and about 10 tools name engine files (`digest-lock`,
  `new-project`, `build-deploy`, `orbital-library`, `flash-calibrate` …).

**Correction:**
- New modules are born in `lab/windows/` and `lab/shell/`, so they never move twice.
- The engine move is its own small release after 0.5.2, with a grep gate for `import(`, `new URL(` and `fetch(` strings and the
  `gpu-boot.js` identity check.

**E12 · "≤ 27,666 at the cut" (MEDIUM).**
- **The OUTs are close to zero.** `domainForP`/`momentumTableFor` are a whole line (`rack.js:66`); `tableFor` and `FILM_FPS` share their
  lines. `__LW_hooks` → `app.hooks` changes lines and saves none.
- **The fan-out grows.** At only the draft's six groups, the 80 import sources become **119 (module, source) pairs** (`imports.mjs`).
- **The shape tax** [DERIVED]: about 18 modules × 15–20 lines (header, imports, signature, return) ≈ +270–360 lines.

**Correction:** at the cut, ≤ 27,666 + 1 % (**27,943**), with the ledger stated exactly in each BUILD; ≤ +2 % at any merge. Real OUTs (dead
code found on the way) count against it.

**E13 · R7-B's reason (LOW-MEDIUM; the ruling stands, for a stronger reason).** Even with every piece set to `false`, `createApp` still:
- registers the `params` and `pages` project parts unconditionally (`mir/app.js:262, 274`). That breaks λWAVES' ONE project part and the
  serialize bytes;
- builds its own key table with storage `key + '.keys'` (`:184`), where λWAVES keeps `lambdawaves.q0.keys` through `key-table.js`;
- calls `startLanguage()` (`:171`), `installKbm()` (`:152`), `installControlHelp` and `installPress` (around `:345–346`);
- uses `installModulation` (`:211`), where CLAUDE.md requires `createModulation` over `mod-port.js` ("a second tick and a device copy of the
  rack").

λWAVES' transport and its photosensitivity law are not the blocker. **Correction:** R7-B's revisit needs a kit brief (`parts: false`,
`keys: <an existing table>`, `modulation: <an existing host>`), not λWAVES modules.

**E14 · Numbers and small claims (LOW).**
- "Six `let` hubs written from other sections": the hubs table shows **15**, and among all names **50**.
- "81 node suites": there are 82 `tests/*.test.mjs` files.
- "§13 badges / §14 the install layer ride along (the loop's readouts)": these are one-call wirings of modules that already exist
  (`createBadges`, `createSwClient`; 30 lines). They stay in `boot()`.
- CLAUDE.md is stale: "the digest lock (1004 + 1148)" (now 860 / 1004, as `D9B-BUILD.md:199` noted); "the 33 `!important`s" (now 36: lab.css
  11 + skin.css 25); and its first paragraph still says "adapt `lab/modwindow.js`", a file that is gone.
- **Re-measured and right:** 4,827 body lines; 31 sections; 422 names; 109 / 190 / 123; 900 cross uses; 151 forward; the hub list and
  counts; the §-costs; `ui` 107; `LW` 176 (169 / 1 / 5 / 2); hooks 13; `lab/*.js` 27,666 in 97 files; the kit 39,172; 36 `!important`; 34
  browser suites.

---

## 3 · The measured residue

### 3.1 · The draft's rule, as the draft defined it (`.tmp/audit.mjs`)

The context is the draft's **30 most-used hubs** (`clock ui mat schedule reg layout __LW_hooks field modHost modView obs rack sturm domain
quality tl camera chem history modArm saveSettings space stageText device kepler look palette settingsStore shadowView touchState`). The 30th
place is a tie: eight names have 7 users, and `wState` is the eighth.

Column meanings:
- **residue** = boot-level names declared outside the module and used inside it, minus the 30, minus `ui`;
- **written** = residue names the module assigns;
- **eager** = residue names used at boot's statement level.

| planned module (the draft's rows) | lines | foreign names | **residue** | written | eager |
|---|---|---|---|---|---|
| R1 host (§2–§7, §13, §14) | 808 | 78 | **61** | 1 | 4 |
| R2 windows, whole (§8 §9 §11 §15 §16 §18 §27) | 1,747 | 93 | **70** | 16 | 22 |
| R3a settings + persist (§1 §24 §25 §29) | 701 | 92 | **68** | 5 | 6 |
| R3b shell (§12 §17 §19–§23 §30) | 1,193 | 106 | **78** | 7 | 22 |
| R5 facade (§26) | 259 | 144 | **120** | 1 | 30 |
| R2a STATE·SPECTRUM·register·bow·Kepler (spans) | 736 | 66 | **47** | 8 | 11 |
| R2b MOLECULES·session·stage text·head | 203 | 29 | **18** | 2 | 3 |
| R2c readouts (without SETTINGS) | 151 | 26 | **15** | 0 | 8 |
| R2d mod seam + RENDER/CURVES (without CAMERA/RAMP) | 269 | 38 | **23** | 3 | 13 |
| the 1100–1433 block (WAVE·SETTINGS·CLIP·PALETTE·CAMERA·FILM) | 351 | 48 | **29** | 7 | 3 |

**Headline: maximum 120 (R5); among moving windows, 47 (R2a); minimum 15 (R2c). No planned module meets ≤ 10.** With **all 123 hubs** in the
context, the residues are R1 30 · R2 30 · R3a 26 · R3b 44 · R5 55 · R2a 18 · R2b 2 · R2c 7 · R2d 7 · block 13. Still not ≤ 10 where it matters.

### 3.2 · The measure that matters, on the audit's re-cut (`.tmp/classes.mjs`)

Column meanings:
- **backward** = consts or functions declared earlier: destructured once, free afterwards;
- **forward** = declared by a module created later: lazy `app.x` reads;
- **shared lets** = live reads and writes;
- **writes** = lets owned elsewhere that the module assigns. Each must become an `app.state` property or an owner verb.

| re-cut module (seat order) | lines | backward | **forward** | **shared lets** | **writes to another's let** |
|---|---|---|---|---|---|
| host/controller §2–§4 → `lab/shell/controller.js` | 234 | 11 | 5 | 1 | 0 |
| loop §5–§6 — **stays in `boot()`** | 473 | 40 | 49 | 27 | 10 (stay closure writes) |
| one road §7 → with the controller (or `lab/shell/mutations.js`) | 71 | 12 | 4 | 4 | 2 (`refSnapshot`, `pendingRef`) |
| WAVE·SETTINGS·CLIP·PALETTE·CAMERA·FILM block → three files | 351 | 32 | 4 | 12 | 9 |
| STATE `:1434–1605` → `lab/windows/state.js` | 172 | 14 | 6 | 2 | 2 |
| SPECTRUM `:1606–1857` (minus `:1849–1850`) → `lab/windows/spectrum.js` | 252 | 22 | 15 | 9 | 6 |
| SHADOW·ORBIT·VORTEX·PLANE `:1858–1946` → `lab/windows/readouts.js` | 89 | 8 | 2 | 1 | 0 |
| MOLECULES·session·head·stage text `:1947–2149` | 203 | 20 | 4 | 5 | 3 |
| MO-REG·CALC·METERS·LADDER `:2150–2192` | 43 | 11 | 0 | 7 | 3 |
| modulation seam `:2193–2438` → `lab/shell/modulation.js` | 246 | 20 | 1 | 9 | 4 |
| ATOMS·WIGNER·RADIATION·READERS `:2439–2478` | 40 | 17 | 0 | 1 | 0 |
| §12 transport → `lab/shell/transport.js` | 229 | 16 | 0 | 4 | 1 (`modArm`) |
| §13–§14 badges·install — stay in `boot()` | 30 | 7 | 2 | 4 | 0 |
| §15–§16 bow·Kepler → `lab/windows/kepler.js` | 294 | 15 | 1 | 3 | 2 |
| §17–§18 floats·ink under glass | 69 | 5 | 1 | 3 | 2 (`occludeDirty`, `occludeAt`) |
| §19a rack·layout·phone·gestures → `lab/shell/rack-wiring.js` | 329 | 39 | 0 | 4 | 3 |
| §19b skip·dock·menubar·notebook·projects → `lab/shell/notebook.js` | 387 | 29 | 10 | 11 | 1 (`exporter3d`) |
| §20–§23 keys·keyboard·timeline·tabs → `lab/shell/keys.js` | 202 | 33 | 1 | 12 | 4 |
| §1 settings → `lab/shell/settings.js` | 142 | 7 | 13 | 2 | 0 |
| §24 persist → `lab/shell/persist.js` | 294 | 50 | 0 | 13 | 4 |
| §25 links · history → `lab/shell/links.js` + `lab/shell/history.js` | 236 | 11 | 0 | 7 | 3 |
| §26 facade → `lab/shell/facade.js` (the literal, moved whole) | 259 | 122 | 1 | 21 | 2 |
| §27 render·curves — stays in `boot()` (20 lines) | 20 | 9 | 0 | 4 | 1 |

Reading the table:
- **Forward + shared ≤ 25 in every moved module.** The largest are SPECTRUM 24, §20–§23 13, §19b 21, §24 13 and the facade 22. The facade's 122
  backward names are destructured once, which is what a facade is.
- **Bare cross-module writes:** 10 + 9 + 6 + … ≈ 60 write sites over the 50 foreign-written lets. All of them go through `app.state.<x>` or an
  owner verb, and that is R0's work.
- **The alternative context cut I recommend:** not "the N most used" but **the shape**:
  - `app = { dom, reg, clock, appPlay, obs, mat, sturm, rates, settingsStore, hooks, ui, state: { …the shared lets… }, loop: { schedule,
    hold, resetWall }, w: { …card handles a module needs, null at first… } }`, every namespace one literal;
  - consts by destructuring;
  - lets live.

  With the 30 + every foreign-written let + every name with ≥ 6 users (92 names), the old residue falls to 0–44 per module (`audit.out`, the
  ctxW tables). That confirms the classes are the right lens: what remains is forward names, not hubs.

---

## 4 · The draft's §2 and §3 tables, with the marks

*Unmarked text is DRAFT 0's, kept. ~~Struck~~ text gives its reason. The replacement text is the integrator's to paste.*

### §2 · The gates

| gate | what | when |
|---|---|---|
| **G-D the lock** | 860 and 1004 values · 0/0 — no digest moves in this release (a moved digest is a defect, never a re-bake) **[OPUS: keep. Re-run alone once before believing a red (the RTX 3070 in P5). The lock reads through `__LW` (`digest-lock.mjs:16–30`), so it witnesses the facade and the field, not the rAF loop.]** | R0, R1, ~~R6~~ **[OPUS: R5 (the facade moves), R-V]** |
| **G-M the pair** | base `v0.5.1-alpha`, \|Δ\| ≤ 3.536 ms/s, the boot scene AND D1's scene (`--setup`), interleaved 5 + 5, quiet rig **[OPUS: keep. Add U4, the same-tree noise floor first. The pair cannot see under about 2 ms/s, so it guards gross regressions. The `app` shape law (E3) guards the rest.]** | R0, R1, R-V **[OPUS: + the block row (the FILM hold), which runs `film-handover`, `take-in-bugs`, `node tests/render-exact.test.mjs` and `tools/perf/film-probe.mjs` instead of the pair]** |
| **G-B the bytes** | `tools/serialize-bytes.mjs` 11/11 identical (full AND edit scopes — no card is added) and `tools/settings-probe.mjs` 0/6; the project format moves by zero bytes **[OPUS: + the DOM-order law: every card's `device()` and `appendChild` stay at their seats (E6). `saveSettings`' `closed` (`rack.js:222`) and `captureLayout` write that order. + U2 (does the route order reach any bytes) before anyone touches `defs`.]** | every row |
| **G-W the facade** | the `__LW` member LIST (176, ~~from `rack-deps.json`~~) is pinned by a ~~node~~ test from R0 on; nothing renamed or removed; the duplicate `windowActivity` key fixed once (R5) **[OPUS: pinned at RUNTIME: `Object.getOwnPropertyDescriptors(__LW)`, names AND kinds (get / value / method) in order, captured on `v0.5.1-alpha`; the static walker cannot see members once they leave `rack.js`. The fix DELETES the dead wrapper (`:4723–4726`) and the first `frost` (`:4552`) and keeps the getter (`presentOffscreen` lives there, E5). Done in R0, not R5.]** | every row |
| **G-S the suites** | node 0; the whole browser estate at R0, R1, ~~R6~~ and R-V; the owning suites per window row; the boot suite alone at R0, R1, ~~R6~~, R-V (~~B149 the only law red~~) **[OPUS: B149 stays red; B108, B112 and every source-reading law are re-pointed through `tests/helpers` `appSource()` in the same commit as their move (E10), never weakened. Per row, name the node suites that slice `rack.js` text: `auto-scale`, `first-run`, `ink`, `project-formats`, `access`.]** | per row |
| **G-L lines** | `lab/*.js` ≤ 27,666 + 2 % at any merge (≤ 28,219); ~~**≤ 27,666 at the cut**~~ **[OPUS: ≤ 27,943 at the cut (+1 %), the ledger stated exactly; the OUTs the draft counts are about 1 line (E12)]**; `rack.js` ≤ 1,500 at the cut **[OPUS: measured target ≈ 900 (§5)]**; no module > 600 lines | every row |
| **G-G the graph** | `node tools/rack-deps.mjs` after every row; ~~a module's `deps` ≤ 10 named locals beyond `app`~~ **[OPUS: the classes table (§3.2): zero bare writes to a binding another module owns; forward + shared ≤ 25 per moved module; the loop is exempt because it stays in `boot()`.]** the cycle count reported | every row |
| **G-K the kit law** | never edit `lab/mir/**`; `createApp` is not adopted here (R7-B) **[OPUS: reason corrected (E13)]** | — |
| **[OPUS: new] G-A the `app` shape** | every namespace of `app` is ONE object literal with all its keys (null placeholders), made at the top of `boot()`; never extended after, never `Object.assign`ed into, never `delete`d; no module destructures a `let` or a forward name; shared lets only as `app.state.x` | every row |
| **[OPUS: new] G-O the seats** | each `create<Card>(app)` / `create<Piece>(app)` call stands where its code stood; `rack.appendChild` and `rk.register` lines stay in `boot()` at their seats; `reworkNative` stays last (`:4892`) | R1–R3 |

### §3 · The rows

| # | row | what moves / changes | closer | out · lines [DERIVED] |
|---|---|---|---|---|
| **R0** (~~M~~ **[OPUS: L]**) **THE CONTEXT** — the measuring row, alone first | ~~`app` made at the top of `boot()`; the 30 most-used hubs become `app.<name>` across `rack.js` (a mechanical rename of ≈ 700 uses; no section moves)~~ **[OPUS: `app` made at the top of `boot()` as fixed-shape namespaces (G-A): `dom reg clock appPlay obs mat sturm rates settingsStore hooks ui state loop w`. NO rename for consts or functions. Every shared `let` that the re-cut makes cross-module (≤ 67; the tool computes the exact set for §3.2's cut) becomes `app.state.x` by the tool's token positions (`tools/rack-deps.mjs --rename`), never by `sed`. U1's hoisting audit decides which functions go on `app` at the top. No section moves.]**; `__LW_hooks` → `app.hooks`; the four unused imports leave; the `device` shadow resolved; **[OPUS: the dead `windowActivity` wrapper and the first `frost` deleted; `tests/helpers` `appSource()`; the runtime facade fixture (G-W)]**; `tools/rack-deps.mjs` learns `app.` members ~~(counts them as context, not as hubs)~~ **[OPUS: and prints the §3.2 classes table for the planned cut]** ~~and gains `--members` (the `__LW` list) for G-W's node test `tests/lw-facade.test.mjs`~~ | THE LOCK 860/1004 · 0/0; the pair in both scenes ~~(a property read vs a closure read — expect Δ ≈ 0; this is the number)~~ **[OPUS: expect Δ ≈ 0. The loop's 27 shared-let reads become `app.state` reads; its 49 forward reads stay closure slots. A gross Δ means G-A was broken.]**; the whole suite estate + boot alone; ~~`rack-deps`: hubs with ≥ 4 users fall …~~ **[OPUS: the classes table: zero bare cross-module writes; forward + shared ≤ 25 per planned module, else STOP and re-plan]**; `serialize-bytes` 11/11; `settings-probe` 0/6; `history`; `new-project --check` | ~~OUT 4 imports + 13 hooks lines; IN the `app` literal ≈ +35 → ≈ +20~~ **[OPUS: OUT ≈ 1–5 (an import line, the dead wrapper); IN the namespaces ≈ +40, the helper ≈ +10 → ≈ +45]** |
| **R1** (~~L~~ **[OPUS: M]**) ~~**THE HOST**~~ **[OPUS: THE CONTROLLER]** — alone second | ~~§2 + §3 + §4 + §5 + §6 + §7 (≈ 780 lines) → `lab/host.js` `createHost(app)` (the clock, the field, the governor, `schedule`, the loop …); §13 badges and §14 the install layer ride along~~ **[OPUS: §2 ONE CONTROLLER + §3 FIELD + §4 THE MATHS WORKERS + §7 ONE ROAD (305 lines) → `lab/shell/controller.js` `createController(app)` (async: it awaits `createField`), called at §2's seat; it registers the governor, the look, the busy marks, the mod port, the rotation drive, the field and the workers onto `app`. §5, §6 (the loop, `schedule`, `windowActivity`, the corner axis) and `filmHold` STAY in `boot()`; `schedule` keeps its hoisting. §13–§14 stay (30 lines of one-call wiring).]** | THE LOCK; the pair; frame-occlusion 7; gpu-recovery alone; `tests/legacy/boot` B6/B22/B23 **[OPUS: + B108 re-pointed]** + the full suite alone; the device report's long play; `current` 15; `render-regressions` 2 **[OPUS: + `node tests/auto-scale.test.mjs` (its slices re-pointed; the two-space indentation kept), `node tests/render-exact.test.mjs`, `window-activity.test.mjs`]** | moves ≈ 0; the export/import lines ≈ +15 **[OPUS: ≈ +20]** |
| **R2a–d** (~~L, four builders in parallel after R1~~ **[OPUS: M each, run as pairs with R3, §4 below]**) **THE WINDOWS** | ~~§8 + §9 + §15 + §16 + §18 + §11 + §27 … ONE shape `create<Card>(app) → { card, routes, slice: { project, workspace }, keys, api }` … (a) … (b) … (c) … (d) …~~ **[OPUS: ONE shape `create<Card>(app) → { …its handles }`, registering its ui members into `app.ui`, called at its `device()` seat, its handles destructured into `boot()`'s scope (the loop reads them as today); no `slice` (persist reads the handles), no `routes` (one table), no `api` slice (R5 moves the literal). **(a)** STATE `:1434–1605` → `lab/windows/state.js`; SPECTRUM `:1606–1857` minus the five appends `:1849–1850` (they stay at their seat) → `lab/windows/spectrum.js`. **(b)** SHADOW·ORBIT·VORTEX·PLANE `:1858–1946` + CALC·METERS·LADDER `:2167–2192` + ATOMS·WIGNER·RADIATION `:2440–2462` → `lab/windows/readouts.js` (≈ 160; three call seats); bow + Kepler §15–§16 → `lab/windows/kepler.js` (294). `READERS`/`track` (`:2463–2465`) and `hydroReader` stay in `boot()`. **(c)** the 1100–1433 block split by region (`block.mjs`: one crossing, `gDraw`): WAVE (two spans) + CLIP + PALETTE/INVERT + CAMERA → `lab/windows/material.js`; SETTINGS (two spans, `__LW_hooks.theme`/`setTheme`/THEMES) → `lab/windows/settings.js`; the FILM/capture `:1375–1406` → `lab/windows/film.js` with `filmHold` left beside the loop as `app.loop.hold`; the camera law `:1085–1092` stays. **(d)** MOLECULES + molecular session + head + MO-REGISTRY (`:1947–2026`, `:2150–2166`) → `lab/windows/molecules.js`; the stage text + caption (`:2027–2149`) → `lab/shell/stage-words.js`; the modulation seam `:2193–2438` (the ONE `defs` table, the pill's seat and dodge, `modView`) → `lab/shell/modulation.js`; §18 ink under glass → `lab/shell/ink.js`; §27 stays.]** | each: its owning suites ~~…~~ **[OPUS: as drafted, + `offer`, `orbitals`, `register`, `molecule-head`, `stage-text`, `chem`, `curves`, `film-handover` / `take-in-bugs` (c), `mir-controls`, `routed-knob` and `tools/camera-routes.mjs` (c, d), `node tests/native-ui.test.mjs`; the classes table per module]** | moves ≈ 0 each; the shape's boilerplate ≤ +3 % of each module **[OPUS: ≤ +20 lines per new file, stated]** |
| **R3a–b** (M, ~~two builders in parallel with R2~~ **[OPUS: paired with R2 rows, §4]**) **THE SHELL** | **(a)** §1 SETTINGS 142 + §24 PERSISTENCE 294 + §25 SHAREABLE LINKS 236 + §29 a link opens 29 → `lab/shell/settings.js` and `lab/shell/persist.js` **[OPUS: + §25 is two things: links (`:4313–4390`) → `lab/shell/links.js` (with §29's `openLink` call left at its seat); THE TRUE HISTORY and its card (`:4391–4548`) → `lab/shell/history.js`. `serialize`/`restore` move WHOLE (E4).]**; **(b)** ~~§19 716 + §20 109 + §21 24 + §22 33 + §23 36 + §12 229 + §17 9 + §30 37 → `lab/shell/rack-wiring.js` and `lab/shell/transport.js`~~ **[OPUS: §12 → `lab/shell/transport.js` (229); §19a (`:3101–3283`, `:3671–3816`) → `lab/shell/rack-wiring.js` (329); §19b (`:3284–3670`) → `lab/shell/notebook.js` (387; MENUS + the menubar may be its own file); §20–§23 → `lab/shell/keys.js` (202); §17 and §30 stay in `boot()`.]** | (a) as drafted **[OPUS: + `first-run.test`, `project-formats.test` re-pointed; B112 re-pointed]**; (b) as drafted **[OPUS: + `project-formats.test` (it slices `projectSnapshot`/`projectKey` out of §19b), `keyboard-shortcuts`, `history`]** | moves ≈ 0; ≈ +20 **[OPUS: ≈ +20 per file, 7 files]** |
| ~~**R4** (M, after R2 + R3) **THE SCOPE TABLES, generated**~~ | ~~each module's `slice` declares …~~ **[OPUS: STRUCK from 0.5.2 (E4). `FAMILIES`/`WORKSPACE` are localStorage tables a node tool imports statically; serialize's key order interleaves cards; restore is one ordered program. If Josh wants a step now: a node check that each module's stated keys ⊆ the hand tables (a check, not a derivation), in a later release.]** | — | — |
| **R5** (S, after R2 + R3) **THE FACADE** ~~**, assembled**~~ **[OPUS: , moved]** | ~~§26 → `__LW` assembled in `rack.js` from each module's `api` in boot order (`Object.assign` in the pinned member order)~~ **[OPUS: §26 moves WHOLE into `lab/shell/facade.js` `createFacade(app)`, returning the literal: 49 getters and the key order kept; its 122 backward names are destructured, its 21 shared lets read live. `boot()` keeps `window.__LW = LW` and the later `LW.x =` lines at their seats (`:4826, 4829, 4860, 4928–4929`). `createFilm(LW, …)` and `createCapture(LW, …)` still get the one object.]**; the duplicate `windowActivity` key ~~fixed (the wrapper, not the getter — say which the tests use)~~ **[OPUS: already fixed at R0 (the getter stays)]**; `app.hooks` gone where a module's api covers it | the runtime facade fixture (names, kinds, order) unchanged; THE LOCK (it reads through `__LW`); every browser suite that reads `__LW` (= all) once as a batch at R-V; `rack-deps`: §26's 145 reads → 0 | ~~OUT ≈ −30 (the literal's forwarding lines)~~ **[OPUS: ≈ +10 (a header and the signature); nothing forwarded is removed]** |
| ~~**R6** (M, alone, last) **THE TREE**~~ | ~~file MOVES only: the engine … → `lab/engine/` …~~ **[OPUS: DEFERRED to its own small release after 0.5.2 (E11). The window and shell modules are born in `lab/windows/` and `lab/shell/` in R1–R5, so nothing moves twice. The engine release carries the path gate: `import(` / `new URL(` / `fetch(` string literals, the `gpu-boot.js` URL identity (`index.html:5–8`), 67 test imports and about 10 tools, `pwa --write`, and the lock.]** | — | — |
| **R-V** (fresh Opus) | the verifier: the pair vs `v0.5.1-alpha` (both scenes + TIMELINE open); the lock; every suite + boot alone; `serialize-bytes` 11/11 full + edit vs 0.5.1; the facade ~~list~~ **[OPUS: fixture (names, kinds, order)]**; lines vs the caps; `rack-deps` final (`rack.js` ≤ 1,500; the cycle count; no module > 600); CLAUDE.md against the tree (the file paths it names moved) **[OPUS: + `settings-probe` 0/6; the classes table; CLAUDE.md's stale lines (1004 + 1148, 33 `!important`, `lab/modwindow.js`) and its 12 `rack.js` pointers; `docs/NOTES-FOR-AGENTS.md` (8) and `docs/STATE-SCOPES.md` (4)]** | FIT TO CUT / FIT WITH NOTES / NOT FIT | — |

**Not in this release (Group II):** as drafted **[OPUS: + R4 (the scope tables) and R6 (the engine tree), each its own small release; the
per-card `routes` / `slice` members of the shape.]**

---

## 5 · Order, the dial, the numbers (the audit's)

**Order.**
1. **R0** alone. It measures, and its classes table can still stop the plan.
2. **R1** alone. It holds `createField`, so the lock, the pair and gpu-recovery run here.
3. Then three pairs. Each pair puts two builders on disjoint regions *and* disjoint `app` namespaces, and merges before the next pair starts:
   - **{R2a · R3a}**;
   - **{R2b · R3b}**;
   - **{R2c · R2d}**. R2c holds the FILM hold, so it runs the film witnesses.
4. **R5**.
5. **R-V**.
6. A fix round, then the cut.

The draft's "four at once" falls, because the R2 spans interleave in creation order (E9).

**The dial.** Opus for every row (Josh 10-06; 0.4.0 HANDOFF §4: Sonnet only when the Opus weekly limit bites). The lock runs at R0, R1, R5 and
R-V; the pair at R0, R1 and R-V; one light check per window row. Each builder's first and last command is `node tools/rack-deps.mjs`, with the
classes table in its BUILD.

**The numbers [DERIVED].**
- **Builders:** R0 + R1 + six pair rows + R5 + the verifier = 10.
- **Hours:**

  | row | hours |
  |---|---|
  | R0 | 5 |
  | R1 | 3 |
  | the six pair rows (3 slots × about 4 h wall) | 12 |
  | R5 | 2 |
  | R-V | 2.5 |
  | the fix round | 1.5 |
  | the merges (about 10 × 20 min) | 3.5 |
  | **total** | **≈ 29 h ≈ 2.5–3 relay days** |

  That is above the draft's 20–24 h. R0 does more (the whole context), and the pairs are safer than four at once.
- **`rack.js` at the cut ≈ 890 lines:**

  | what stays | lines |
  |---|---|
  | §0 | 59 |
  | §5 + §6 | 473 |
  | `filmHold` | 15 |
  | §13–§14 | 30 |
  | §17 | 9 |
  | §27 | 20 |
  | §28–§30 | 103 |
  | imports | ≈ 60 |
  | calls and destructures | ≈ 80 |
  | `app` | ≈ 40 |
- **Modules:** about 18, the largest 387 lines.
- **`lab/*.js` at the cut:** ≈ 27,950 ± 100.

---

## 6 · The unknowns a builder must measure first (in order)

1. **U1 · The hoisting audit (R0, first step).**
   - *Question:* which of the 39 forward-used function declarations (and `readSettings`) are actually called before their declaration line
     during boot, through a synchronous callback?
   - *Method:* in a scratch tree served on the builder's own port, turn every boot-level `function x(` into `const x = function x(` (a node
     script over the tool's token positions). Boot under the gate with the boot suite's first block and the four demos. Each TDZ
     `ReferenceError` names one, and those go on `app` at the top of `boot()`. Discard the scratch tree.
2. **U2 · Does the route order reach any bytes?**
   - *Method:* in a scratch tree, reverse the `defs` array (`rack.js:2238–2358`). Run `serialize-bytes` (full and edit) and `settings-probe`
     against the base, and diff `modwin` and the modulation record.
   - *Use:* the answer decides whether the table may ever be split (Group II).
3. **U3 · The DOM-order law, proven.**
   - *Method:* in a scratch tree, move one append (for example `wCalc` before `wSh`). Run `settings-probe` B1/B3 and `serialize-bytes` on a
     layout-carrying project.
   - *Use:* this pins G-O with a witness instead of an argument.
4. **U4 · The pair's same-tree floor.** Five plus five `v0.5.1-alpha` against itself, in both scenes, on a quiet rig (load < 4,
   `wait-gpu`), before R0's pair is believed.
5. **U5 · `app` stays fast.**
   - *Method:* a `tools/` diagnostic launches Chromium through `cdp.mjs` with `--js-flags=--allow-natives-syntax` and evaluates
     `%HasFastProperties(...)` for `app` and each namespace after `LW.ready`. Run it at R0 and at R-V.
   - *Fallback:* if the flag is unavailable, G-A alone.
6. **U6 · The source-reading laws, listed per row.**
   - *Method:* `grep -l "rack\.js"` over `tests/` and `tools/` (the E10 list), and `fetch('./` in `tests/legacy/boot.browser-test.mjs`. Each
     row's brief names its laws.
7. **U7 · The runtime facade fixture.** At R0, on `v0.5.1-alpha`, record `Object.entries(Object.getOwnPropertyDescriptors(__LW))` as
   name + kind, in order, into `research/release-0.5.2/lw-facade.json`. G-W compares against it.
8. **U8 · The `ui` registry contract.** List every member that `native-ui.js` and `badges.js` read, write or patch, including dynamic
   `ui[name]` rows. No window row may claim one of them private.
9. **U9 · Cold load, before and after (optional).**
   - *Question:* about 18 new static modules sit at depth 2. Does the first paint move on a cold load with no service worker?
   - *Method:* `bench-chromium` `readyMs` at R0 and at R-V.

---

## 7 · The rulings, as I would put them to Josh (the first option is the default)

1. **R7-A THE CONTEXT.**
   - *Default:* one `app` object of fixed-shape namespaces, made at the top of `boot()`. Modules destructure the consts. Every changing value
     is read live through `app.state`. **The frame loop stays inside `boot()` this release**, so nothing on the frame path changes.
   - *Or:* the draft's flat 30-name `app`, with the loop moved to `lab/host.js`.
2. **R7-J THE WINDOW SHAPE (new).**
   - *Default:* `create<Card>(app)` returns its handles and registers its controls, and that is all. Saving stays in one place (`persist.js`),
     and the modulation routes stay one table.
   - *Or:* the draft's five-part shape (`card · routes · slice · keys · api`).
3. **R7-I THE SCOPE TABLES (new; replaces R4).**
   - *Default:* the tables stay hand-written in 0.5.2. Deriving them cannot reproduce the save bytes.
   - *Or:* build R4 anyway.
4. **R7-C THE TREE.**
   - *Default:* new files are born in `lab/windows/` and `lab/shell/`. Moving the existing engine files into `lab/engine/` is its own small
     release afterwards.
   - *Or:* move the engine inside 0.5.2.
   - *Or:* stay flat.
5. **R7-D THE `__LW` FACADE.**
   - *Default:* moved whole into `lab/shell/facade.js`. Its 49 live getters and its order are kept, and the dead duplicate is deleted.
   - *Or:* assembled from each module's piece.
   - *Or:* trimmed (another release).
6. **R7-F THE LINE LAW.**
   - *Default:* ≤ +2 % at any merge; ≤ +1 % at the cut (27,943), stated exactly; `rack.js` ≤ 1,500 (≈ 900 expected); no module > 600.
   - *Or:* "no growth at the cut", which needs real deletions this release does not plan.
7. **R7-G THE `ui` BAG.**
   - *Default:* one flat registry, made first. `native-ui.js` keeps reading it and runs last.
   - *Or:* rewrite `native-ui.js` now.
8. **R7-E THE BOOT SUITE.**
   - *Default:* one suite. Its laws that read source text read the app's source (`rack.js` + the new modules) through one helper, with no law
     weakened.
   - *Or:* split it per window now.
9. **R7-B `createApp`.**
   - *Default:* not adopted. Even with every piece off it adds two save parts and its own keys store. Revisiting it needs a kit brief, not
     this refactor.
   - *Or:* adopt it in R3b (it would break the one-part project).
10. **R7-H THE NAME.**
    - *Default:* 0.5.2 "Rack Dissolution".
    - *Or:* "Engine Boundary".
    - *Or:* his.

**Questions.**
- **Q1:** as drafted (any digest move is a defect). Agreed.
- **Q2:** folded into R7-C. The shaders move in the engine release, with the lock proving the bytes.

**Strike:** none of the draft's eight is a non-ruling. R7-I and R7-J are added because the draft took both mechanisms without asking.

---

## 8 · What I did not check

- **No browser and no GPU.** U1–U5, U7 and U9 are measurements I specified and did not run. The V8 dictionary-mode thresholds are from my
  knowledge of V8, not measured here (U5).
- **`restore()` (`rack.js:4141–4312`)** I read by grep for its card branches and its order, not line by line.
- **§19's 716 lines** I read by statement starts. §20–§25 and §26's middle (4600–4718) I read by grep and by the tool's tables.
- **The block-local analysis (`block.mjs`)** is a token approximation. It ignores deeper shadowing of a block name, which could hide a
  crossing; it found one.
- **I did not check whether `mod.install`'s order or the `READERS` order reaches the modulation picker's visible order** (U2 covers the bytes,
  not the look).
- **`docs/STATE-SCOPES.md`, `tools/new-project.mjs`, `tools/wiring`** and the test fixtures' internals I did not read.
- **The 0.5.1 verifier's notes** I read only as quoted in `D9B-BUILD.md:199` and the 0.5.1 audit's E20.
- **Hours and line totals** are [DERIVED]. The classes table and the residue tables are measured on `183d061` and must be re-run after R0,
  because the shared-let set changes once `app.state` exists.

— Opus 5.5 @ high, 2026-10-09. Scripts: `.tmp/audit.mjs`, `.tmp/classes.mjs`, `.tmp/block.mjs`, `.tmp/imports.mjs` (not committed; re-run with
`node .tmp/<name>.mjs` from the worktree root).
