# λWAVES 0.5.2 "Rack Dissolution" — THE PLAN (Claude Yan, 2026-10-09 22:20 CDT; DRAFT 0 + AUDIT-OPUS folded)

**What this is.** The refactor Josh asked for (`ASK.md`), planned in the ONE round he ruled: a Fable draft (`PLAN-DRAFT-0.md`) on a measured dependency
graph (`tools/rack-deps.mjs` → `RACK-DEPS.md`), one Opus@high audit (`AUDIT-OPUS.md`, SOUND WITH CHANGES — its re-plan is this file). **Nothing Josh sees
changes; a visible change is a defect.** The name and number are his. Nothing is pushed or deployed. **[MEASURED]** = `RACK-DEPS.md` / the audit's scripts
on `183d061`; **[DERIVED]** = an estimate, said so; **[AUDIT En]** = the audit item that decided the line.

## 0 · The inputs, measured

- `lab/rack.js` = one `export async function boot(dom)`: body **4,827 lines** in **31 comment-headed sections**; **422 boot-level names** (158
  functions); **123 hubs** used by ≥ 4 sections (29 %); **900 cross-section uses**; **151 forward uses** (lexically inside nested functions — but 39 target
  hoisted FUNCTION declarations that constructors may call synchronously during boot, and `readSettings()` is called at `:131` before its declaration at
  `:166`); **ONE strongly connected cluster of 26 sections**; **67 shared `let`s with 843 references, 50 of them written from outside their own section**
  (≈ 60 write sites: 10 from the loop, 9 from the 1100–1433 block, 6 from SPECTRUM); 17 lets assigned after declaration and read elsewhere (`chem`,
  `molSession`, `orbitals`, `states`, `register`, `capApi`, `camKnobs`, `stageText` …) — a module that destructured them at creation would freeze `null`.
  [MEASURED, AUDIT E1–E3]
- **The frame loop (§5–§6, 473 lines) reads 134 distinct names per frame, 49 of them forward and 27 shared lets** [MEASURED]. THE LOCK reads through
  `__LW.readPixels` / `fieldDigest` / `linePixels`, not through the rAF loop (`digest-lock.mjs:16–30`) — it witnesses the facade and the field, never the
  loop's shape. The pair cannot resolve under ≈ 2 ms/s. [MEASURED]
- **The `ui` bag:** 107 members, 94 assigned in §8; consumed outside `rack.js` by `native-ui.js` (≈ 45 reads incl. dynamic `ui[name]`, 5 writes, one patched
  method, controls RE-PARENTED across cards; runs last at `:4892`) and `badges.js` (handed `ui` whole). `ui.camSeg` is dead. [MEASURED, E8]
- **The `__LW` facade:** the literal has 171 keys — 36 values, 37 shorthand, **49 GETTERS**, 49 methods; 176 members with §27/§28/§30's additions;
  `windowActivity` is named twice (the wrapper at `:4723–4726` is DEAD code; the later getter is what the suites use — `presentOffscreen`); `frost` twice
  (identical). [MEASURED, E5]
- **Serialize/restore:** `serialize()` is one literal that INTERLEAVES cards (`presentation.readers = { spectrum, slice, kepler }`, `overlays = { vortex,
  kepler, particles, dials }`); `restore()` is one ordered program with cross-card dependencies (the Hamiltonian before the instruments; `chem.load` →
  `orbitals.load` → `chem.setOn`; the notebook size before the layout; the modulation re-base last). `FAMILIES`/`WORKSPACE` are localStorage tables that
  `tools/settings-probe.mjs` imports statically; none of `FAMILIES`' 19 rows is a window's. [MEASURED, E4]
- **The DOM-order law:** card creation (`device()`) and append (`rack.appendChild`) order decide the `.dev` order, which `saveSettings`' `closed` and
  `captureLayout` WRITE into bytes; the five appends at `:1849–1850` sit inside SPECTRUM's span. The 1100–1433 block is one `{ … }` interleaving WAVE ·
  SETTINGS · DRAW · CLIP · PALETTE · INVERT · CAMERA · FILM · FIELD QUALITY (it splits by region; one crossing, `gDraw`). §11 is two things (the ONE `defs`
  route table + the pill's seat + `modView`; and ATOMS · WIGNER · RADIATION · `READERS`). Cards in no draft row: WAVE, CLIP, FILM, TRANSPORT, HISTORY. [E6]
- **Tests that read `rack.js` as TEXT:** `auto-scale.test` (indentation-sensitive slices), `first-run.test`, `ink.test`, `project-formats.test`,
  `access.test`; the boot suite fetches `./rack.js` for B108 (`createField(dom.canvas, {`), B112 (`warned: S0.warned`) and one more. [E10]
- **`createApp` (the kit):** even with every piece `false` it registers the `params` and `pages` project parts, builds its own keys store, calls
  `startLanguage`/`installKbm`/`installControlHelp`/`installPress`, and uses `installModulation` — four breaks of λWAVES' laws (ONE part; `lambdawaves.q0.keys`;
  `createModulation` over `mod-port.js`). [E13]
- **The tree:** `lab/*.js` 27,666 in 97 files; 82 node suites; 34 browser suites; the 152-law boot suite; the lock 860/1004 · 0/0; the pair gate 3.536;
  `v0.5.1-alpha` cut. CLAUDE.md's stale lines: "1004 + 1148", "33 `!important`" (36), "adapt `lab/modwindow.js`" (gone); 12 `rack.js` pointers. [E14]

## 1 · The shape the measurement forces

1. **THE CONTEXT, whole, no mass rename** [E1, E2]. `app` is a set of FIXED-SHAPE namespaces, each ONE object literal at the top of `boot()` with every key
   present (null placeholders): `app = { dom, reg, clock, appPlay, obs, mat, sturm, rates, settingsStore, hooks, ui, state: { …every shared let… },
   loop: { schedule, hold, resetWall }, w: { …card handles, null at first… } }`. **Consts and functions keep their names** — a module destructures them once
   (`const { reg, clock, mat } = app`), free afterwards. **Every shared `let` becomes `app.state.x`**, read and written live, never destructured, changed by
   a resolver-driven edit at the tool's token positions (`tools/rack-deps.mjs --rename`), never by `sed` (2,670 references for the draft's 30 names; 39
   shorthand sites; 6 shadowed). Hoisted functions called before their module exists (U1) go on `app` at the top, where hoisting already serves them.
2. **The frame loop STAYS in `boot()` this release** [E3]. §5 THE BACKGROUNDED TAB, §6 THE ROUTER, `filmHold` (as `app.loop.hold`) stay; `schedule` keeps
   its hoisting; the window modules RETURN their handles into boot's scope at today's seats (`const { wSpec, spectrum, … } = createSpectrum(app)`), so every
   per-frame read stays a closure slot. Nothing on the frame path changes shape; `rack.js` lands near 900 lines.
3. **THE MEASURE is the classes table, not the residue** [E1]: what crosses a module boundary is backward consts (free), FORWARD names (lazy `app.x` reads),
   SHARED LETS (live `app.state` reads/writes) and WRITES to another module's binding. **The hinge:** zero bare cross-module writes; forward + shared ≤ 25 per
   moved module (the re-cut meets it everywhere: SPECTRUM 24, §19b 21, the facade 22, keys 13, persist 13; the loop is exempt because it stays).
4. **Moves, not mechanisms** [E4, E5, E11]: `serialize`/`restore` move WHOLE; the `__LW` literal moves WHOLE (49 getters — `Object.assign` would freeze them);
   the ONE `defs` route table stays one list (`mod.install` takes one ordered array); the scope tables stay hand-kept; the engine files do not move (runtime-
   relative URLs; `gpu-boot.js`'s URL identity) — new modules are BORN in `lab/windows/` and `lab/shell/`.
5. **The seats** [E6, E9]: every `create<Card>(app)` call stands at its card's current `device()` seat; the `appendChild`/`rk.register` lines stay in `boot()`
   at theirs; `reworkNative` stays last. Rows run in PAIRS on disjoint regions and disjoint `app` namespaces; a pair merges before the next starts.

## 2 · The gates

| gate | what | when |
|---|---|---|
| **G-D the lock** | 860 and 1004 values · 0/0; a moved digest is a defect, never a re-bake; a single red re-run alone once (the RTX 3070 in P5) | R0, R1, R5, R-V |
| **G-M the pair** | base `v0.5.1-alpha`, \|Δ\| ≤ 3.536 ms/s, the boot scene AND D1's scene (`--setup`), interleaved 5 + 5, quiet rig; **U4 the same-tree floor first**; it guards gross regressions only — G-A guards the rest | R0, R1, R-V; the FILM-hold row runs `film-handover`, `take-in-bugs`, `render-exact`, `film-probe` instead |
| **G-B the bytes** | `tools/serialize-bytes.mjs` 11/11 identical, full AND edit; `tools/settings-probe.mjs` 0/6; **G-O the seats** (below); U2 before anyone touches `defs` | every row |
| **G-W the facade** | a RUNTIME fixture: `Object.getOwnPropertyDescriptors(__LW)` → names AND kinds (get / value / method) in order, captured on `v0.5.1-alpha` at R0 (`research/release-0.5.2/lw-facade.json`, U7), compared by a browser check every row; the dead `windowActivity` wrapper and the first `frost` deleted at R0 (the getter stays — the suites call `presentOffscreen`) | every row |
| **G-S the suites** | node 0; the whole browser estate at R0, R1 and R-V; the owning suites per row; the boot suite alone at R0, R1, R-V — **B149 stays the only LAW red; every source-reading law (B108, B112, `auto-scale`, `first-run`, `ink`, `project-formats`, `access`) is re-pointed through `tests/helpers` `appSource()` (the app's source = `rack.js` + the new modules) in the SAME commit as its move, never weakened; the two-space body indentation is kept inside `create*(app) { … }` so the slices still match** | per row |
| **G-L lines** | `lab/*.js` ≤ 27,666 + 2 % at any merge (≤ 28,219); **≤ 27,943 at the cut (+1 %)**, the ledger stated exactly (the shape tax ≈ 18 modules × 15–20 lines; real OUTs found on the way count); `rack.js` ≤ 1,500 (≈ 900 expected); no module > 600 (the largest ≈ 387) | every row |
| **G-G the classes** | `node tools/rack-deps.mjs` (with the classes table, R0) after every row: zero bare writes to a binding another module owns; forward + shared ≤ 25 per moved module; the loop exempt | every row |
| **G-A the `app` shape** | every namespace is ONE literal with all its keys (null placeholders) made at the top of `boot()`; never extended after, never `Object.assign`ed into, never `delete`d (V8 dictionary mode would cost 0.2–0.7 ms/s the pair cannot see); no module destructures a `let` or a forward name; shared lets only as `app.state.x`; U5 checks `%HasFastProperties` where the flag is available | every row |
| **G-O the seats** | each `create<Card>(app)` / `create<Piece>(app)` call stands where its code stood; `rack.appendChild` and `rk.register` lines stay in `boot()` at their seats; `reworkNative` stays last (`:4892`); U3 proves the law with a witness | R1–R5 |
| **G-K the kit law** | never edit `lab/mir/**`; `createApp` not adopted (R7-B) | — |

## 3 · The rows (each a fresh Opus builder; a `BRIEF-R<n>.md`; `R<n>-HANDOFF.md` after every step; `R<n>-BUILD.md` with the ledger and the classes table before/after; merged by the recipe)

| # | row | what | closer | lines [DERIVED] |
|---|---|---|---|---|
| **R0** (L) **THE CONTEXT** — alone first; the measuring row | `app` at the top of `boot()` as fixed-shape namespaces (G-A); NO rename of consts/functions; every shared `let` the re-cut makes cross-module → `app.state.x` by `tools/rack-deps.mjs --rename` (new mode; the tool also prints the §3.2 classes table for the planned cut and learns `app.` members); `__LW_hooks` → `app.hooks`; U1's hoisting audit decides which functions sit on `app`; the four unused imports leave; the `device` shadow resolved; the dead `windowActivity` wrapper and the first `frost` deleted; `tests/helpers/app-source.mjs` (`appSource()`); the runtime facade fixture captured (U7); no section moves | THE LOCK; the pair in both scenes after U4's floor (expect Δ ≈ 0; a gross Δ = G-A broken); the whole suite estate + boot alone (B149 the only law red); `serialize-bytes` 11/11; `settings-probe` 0/6; `history`; `new-project --check`; **the classes table: zero bare cross-module writes, forward + shared ≤ 25 per planned module, else STOP and re-plan** | OUT ≈ 1–5; IN ≈ +40 namespaces + 10 helper → **≈ +45** |
| **R1** (M) **THE CONTROLLER** — alone second | §2 ONE CONTROLLER + §3 FIELD + §4 THE MATHS WORKERS + §7 ONE ROAD (305 lines) → `lab/shell/controller.js` `createController(app)` (async — it awaits `createField`), called at §2's seat; registers the governor, the look, the busy marks, the mod port, the rotation drive, the field and the workers onto `app`. §5, §6, `filmHold`, §13–§14 STAY | THE LOCK; the pair; frame-occlusion 7; gpu-recovery alone; boot alone (B6/B22/B23; B108 re-pointed); the device report's long play; `current` 15; `render-regressions` 2; `node tests/auto-scale.test.mjs` (re-pointed), `render-exact.test`, `window-activity.test` | ≈ +20 |
| **PAIR 1 {R2a · R3a}** (M + M) | **R2a:** STATE `:1434–1605` → `lab/windows/state.js`; SPECTRUM `:1606–1857` minus the five appends `:1849–1850` (they stay at their seat) → `lab/windows/spectrum.js` (forward + shared 24 — the highest). **R3a:** §1 SETTINGS 142 → `lab/shell/settings.js`; §24 PERSISTENCE 294 → `lab/shell/persist.js` (`serialize`/`restore` WHOLE, reading the cards' handles); §25 is two things: the links `:4313–4390` → `lab/shell/links.js` (§29's `openLink` call stays at its seat), THE TRUE HISTORY + its card `:4391–4548` → `lab/shell/history.js` | R2a: `register`, `orbitals`, `offer`, `history`, `hit-probe-set`, `frame-occlusion`, the boot suite's STATE/SPECTRUM laws alone; R3a: `serialize-bytes` full + edit, `settings-probe`, `project-formats` + `first-run` (re-pointed), `history` 44, `new-project` + `--check`, the link suites, B112 re-pointed | ≈ +20 per file (5 files) |
| **PAIR 2 {R2b · R3b}** (M + M) | **R2b:** SHADOW·ORBIT·VORTEX·PLANE `:1858–1946` + CALC·METERS·LADDER `:2167–2192` + ATOMS·WIGNER·RADIATION `:2440–2462` → `lab/windows/readouts.js` (≈ 160; three call seats; `READERS`/`track`/`hydroReader` stay in `boot()`); the bow + Kepler §15–§16 → `lab/windows/kepler.js` (294). **R3b:** §12 THE TRANSPORT STRIP → `lab/shell/transport.js` (229; λWAVES' own bar stays λWAVES'); §19a `:3101–3283` + `:3671–3816` (rack · layout · phone · gestures) → `lab/shell/rack-wiring.js` (329); §19b `:3284–3670` (skip links · dock chip · MENUS + the menubar · the notebook · PROJECTS) → `lab/shell/notebook.js` (387; MENUS may be its own file); §20–§23 (keys · keyboard window · timeline · tab order) → `lab/shell/keys.js` (202); §17 and §30 stay | R2b: `frame-occlusion`, `hit-probe-set`, `take-in-bugs` (the bow), `routed-knob`, `camera-shift`, `molecule-demos`, `current`; R3b: `menubar` 8/8, `keyboard-window`, `keyboard-shortcuts`, `timeline` 14/14, `offer` 16, `first-run` 12, `access`, `history`, `project-formats` (re-pointed: it slices `projectSnapshot`/`projectKey` out of §19b), `hit-probe-set`, `frame-occlusion` | ≈ +20 per file (6 files) |
| **PAIR 3 {R2c · R2d}** (M + M) | **R2c:** the 1100–1433 block split by REGION (one crossing, `gDraw`): WAVE (two spans `:1101–1128`, `:1280–1311`) + CLIP `:1312–1335` + PALETTE/INVERT + CAMERA → `lab/windows/material.js`; SETTINGS (two spans `:1129–1279`, `:1407–1433`; `hooks.theme`/`setTheme`/THEMES) → `lab/windows/settings.js`; the FILM/capture `:1375–1406` → `lab/windows/film.js` with `filmHold` left beside the loop as `app.loop.hold`; the camera law `:1085–1092` stays. **R2d:** MOLECULES + the molecular session + the head + MO-REGISTRY (`:1947–2026`, `:2150–2166`) → `lab/windows/molecules.js`; the stage text + the caption `:2027–2149` → `lab/shell/stage-words.js`; the modulation seam `:2193–2438` (the ONE `defs` table, the pill's seat and dodge, `modView`) → `lab/shell/modulation.js`; §18 ink under glass → `lab/shell/ink.js`; §27 stays | R2c: `film-handover` 4/4, `take-in-bugs` 4/4, `node tests/render-exact.test.mjs`, `tools/perf/film-probe.mjs` + film-compare, `tools/camera-routes.mjs` 5/5, `camera-shift`, `ink.test` (re-pointed), `first-run` (the quality seed), `curves`; R2d: `chem`, `molecule-head` node + browser, `stage-text`, `molecule-demos`, `molecular-names`, `mir-controls`, `routed-knob`, `tools/camera-routes.mjs`, `node tests/native-ui.test.mjs`, `settings-probe` | ≈ +20 per file (7 files) |
| **R5** (S) **THE FACADE, moved** | §26 WHOLE → `lab/shell/facade.js` `createFacade(app)` returning the literal, 49 getters and the key order kept; its 122 backward names destructured, its 21 shared lets read live; `boot()` keeps `window.__LW = LW` and the later `LW.x =` lines at their seats (`:4826, 4829, 4860, 4928–4929`); `createFilm(LW, …)` and `createCapture(LW, …)` still get the one object | the runtime facade fixture unchanged (names, kinds, order); THE LOCK; every browser suite that reads `__LW` once as a batch (= R-V's estate) | ≈ +10 |
| **R-V** (fresh Opus) | the pair vs `v0.5.1-alpha` (both scenes + TIMELINE open); the lock; every suite + boot alone; `serialize-bytes` 11/11 full + edit vs 0.5.1; `settings-probe` 0/6; the facade fixture; the classes table; lines vs the caps; `rack-deps` final (`rack.js` ≤ 1,500; the cycle count; no module > 600); CLAUDE.md against the tree — its stale lines (1004 + 1148 → 860/1004; 33 `!important` → 36; `lab/modwindow.js`) and its 12 `rack.js` pointers, `docs/NOTES-FOR-AGENTS.md` (8), `docs/STATE-SCOPES.md` (4); U9 the cold load before/after | FIT TO CUT / FIT WITH NOTES / NOT FIT → a fix round → the cut `v0.5.2-alpha · Rack Dissolution` on Josh's word | — |

**Group II (not this release):** **R4 the scope tables** (a node check that a module's stated keys ⊆ the hand tables — a check, not a derivation); **R6 the
engine tree** (`lab/engine/` by file moves, its own small release with the path gate: `import(` / `new URL(` / `fetch(` string literals, the `gpu-boot.js`
URL identity, 67 test imports, ≈ 10 tools, `pwa --write`, the lock); per-card `routes`/`slice` members (U2 decides whether the route table may ever split);
killing `app.ui` (the kit's `describe`/`param` road); `createApp` (a KIT BRIEF: `parts: false`, `keys: <an existing table>`, `modulation: <an existing
host>`); the CSS tokens (MIR-paced); the per-window split of the boot suite.

## 4 · Order and the dial

**R0 alone** (it measures; the classes table can still stop the plan) → **R1 alone** (it holds `createField`: the lock, the pair, gpu-recovery) → **three PAIRS**,
each two builders on disjoint regions AND disjoint `app` namespaces, merged before the next starts: **{R2a · R3a}** → **{R2b · R3b}** → **{R2c · R2d}** (R2c holds
the FILM hold: the film witnesses) → **R5** → **R-V** → a fix round → the cut. "Four at once" falls: the R2 spans interleave in creation order (STATE · SPECTRUM ·
SHADOW · ORBIT · VORTEX · PLANE · MOLECULES · MO-REG · CALC · METERS · LADDER · the mod seam · ATOMS · WIGNER · RADIATION).
**The dial:** Opus for every row (Josh 10-06); one verifier; the lock at R0, R1, R5, R-V; the pair at R0, R1, R-V; one light check per window row. Each
builder's first and last command: `node tools/rack-deps.mjs` — the classes table before/after in every BUILD.

## 5 · The numbers [DERIVED]

Builders: R0 + R1 + six pair rows + R5 + R-V = **10**. Hours: R0 5 · R1 3 · the three pair slots ≈ 4 h wall each = 12 · R5 2 · R-V 2.5 · the fix round 1.5 ·
≈ 10 merges × 20 min = 3.5 → **≈ 29 h ≈ 2.5–3 relay days** (the draft said 20–24: R0 does the whole context; pairs are safer than four at once). `rack.js` at
the cut **≈ 890** (§0 59 · §5–§6 473 · `filmHold` 15 · §13–§14 30 · §17 9 · §27 20 · §28–§30 103 · imports ≈ 60 · calls and destructures ≈ 80 · `app` ≈ 40).
About 18 modules, the largest 387. `lab/*.js` **≈ 27,950 ± 100** (cap 27,943 — the ledger decides; real OUTs found on the way pay).

## 6 · The unknowns measured first (the audit's §6; U1, U4, U7 are R0's first steps)

1. **U1 the hoisting audit** (R0 first): in a scratch tree turn every boot-level `function x(` into `const x = function x(` (a node script over the tool's
   token positions); boot under the gate with the boot suite's first block and the four demos; each TDZ `ReferenceError` names a function that goes on `app`
   at the top of `boot()`; discard the scratch tree. 2. **U2 the route order vs bytes**: reverse the `defs` array in a scratch tree; `serialize-bytes` full +
   edit and `settings-probe` vs the base; diff `modwin` and the modulation record (decides Group II's split). 3. **U3 the DOM-order law proven**: move one
   append in a scratch tree; `settings-probe` B1/B3 and `serialize-bytes` on a layout-carrying project (pins G-O with a witness). 4. **U4 the pair's same-tree
   floor**: `v0.5.1-alpha` vs itself 5 + 5, both scenes, quiet rig, before R0's pair is believed. 5. **U5 `app` stays fast**: a `tools/` diagnostic through
   `cdp.mjs` with `--js-flags=--allow-natives-syntax` evaluating `%HasFastProperties(app)` and each namespace after `LW.ready`, at R0 and R-V (fallback: G-A
   alone). 6. **U6 the source-reading laws per row**: `grep -l "rack\.js"` over `tests/` and `tools/`; `fetch('./` in the boot suite; each brief names its laws.
   7. **U7 the runtime facade fixture** on `v0.5.1-alpha` → `research/release-0.5.2/lw-facade.json` (name + kind, in order). 8. **U8 the `ui` registry contract**:
   every member `native-ui.js` and `badges.js` read, write or patch, incl. dynamic `ui[name]`; no window row claims one private. 9. **U9 cold load** (optional):
   `bench-chromium` `readyMs` at R0 and R-V — ≈ 18 static modules at depth 2.

## 7 · What is not claimed

No line is moved yet. The classes table and the residues were measured on `183d061` and MUST be re-run after R0 (the shared-let set changes once `app.state`
exists). U1–U5, U7 and U9 are specified, not run; the V8 dictionary-mode thresholds are the audit's knowledge, not measured here. `restore()` was read by grep
for its branches; §19's 716 lines by statement starts; the block-local analysis is a token approximation (one crossing found). Whether `mod.install`'s order
or `READERS`' order reaches the modulation picker's VISIBLE order is unchecked (U2 covers bytes, not the look). Hours and totals are [DERIVED]. Nothing Josh
sees changes; if R-V finds a visible change, that is a defect.

## 8 · The harness
Every builder gets `research/release-0.5.1/PLAN.md` §8's laws plus: the moved code keeps its two-space body indentation; each `create*(app)` call at its
seat; no `sed` over `rack.js` (the tool's token positions or hand edits); `node tools/rack-deps.mjs` first and last; `node tests/pwa.test.mjs --write` after
any `lab/` edit; the owning suites one at a time on the builder's own server; a hand-off commit after every step; never merge, push, tag.

## 9 · RULINGS TAKEN (defaults, under Josh's "Defaults for now" of 10-09 and the audit's recommendations — he may flip any; the build starts on his word)

1. **R7-A THE CONTEXT.** **TAKEN:** one `app` of fixed-shape namespaces at the top of `boot()`; modules destructure the consts; every changing value is read
   live through `app.state`; **the frame loop stays inside `boot()` this release** · the draft's flat 30-name `app` with the loop moved to `lab/host.js`.
2. **R7-J THE WINDOW SHAPE (new).** **TAKEN:** `create<Card>(app)` returns its handles and registers its controls, nothing more; saving stays in one place
   (`persist.js`); the modulation routes stay one table · the draft's five-part shape (card · routes · slice · keys · api).
3. **R7-I THE SCOPE TABLES (new; replaces R4).** **TAKEN:** hand-written in 0.5.2 (deriving them cannot reproduce the save bytes) · build R4 anyway.
4. **R7-C THE TREE.** **TAKEN:** new files are born in `lab/windows/` and `lab/shell/`; the engine's existing files move in their own small release after
   0.5.2 · move the engine inside 0.5.2 · stay flat.
5. **R7-D THE `__LW` FACADE.** **TAKEN:** moved whole into `lab/shell/facade.js`, 49 live getters and the order kept, the dead duplicate deleted · assembled
   from pieces · trimmed (another release).
6. **R7-F THE LINE LAW.** **TAKEN:** ≤ +2 % at any merge; ≤ +1 % at the cut (27,943), stated exactly; `rack.js` ≤ 1,500 (≈ 900 expected); no module > 600 ·
   "no growth at the cut" (needs deletions this release does not plan).
7. **R7-G THE `ui` BAG.** **TAKEN:** one flat registry made first; `native-ui.js` keeps reading it and runs last · rewrite `native-ui.js` now.
8. **R7-E THE BOOT SUITE.** **TAKEN:** one suite; its source-reading laws read the app's source through one helper, no law weakened · split per window now.
9. **R7-B `createApp`.** **TAKEN:** not adopted (two save parts and its own keys store even when every piece is off; a KIT BRIEF would be needed) · adopt in R3b.
10. **R7-H THE NAME.** **TAKEN:** 0.5.2 "Rack Dissolution" · "Engine Boundary" · his.
**Q1** any digest move is a defect — taken. **Q2** the shaders move in the engine release, the lock proving the bytes — taken.

— Claude Yan, 2026-10-09. `BRIEF-R0.md` is written beside this file; the build starts on Josh's word.
