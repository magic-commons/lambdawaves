# λWAVES 0.5.2 "Rack Dissolution" — PLAN, DRAFT 0 (Claude Yan, Fable 5.1, 2026-10-09 21:40 CDT; on the measured graph)

**What this is.** The refactor Josh asked for (`ASK.md`: "I would love a refactor of that scale … Let's do that round"), planned the way he ruled for
stage D: ONE round — this draft on a MEASURED dependency graph (`tools/rack-deps.mjs`, `RACK-DEPS.md`, Opus 10-09), one Opus@high audit, the fold, the
briefs. Nothing Josh sees changes. The name and number are his ("Rack Dissolution" offered; no "The"). Nothing is pushed or deployed. **[MEASURED]** =
read off `RACK-DEPS.md` at `a8b136c` or the tree; **[DERIVED]** = an estimate, said so.

## 0 · The inputs, measured

- `lab/rack.js` = one `export async function boot(dom)`, body **4,827 lines** (104–4930) in **31 comment-headed sections**; **422 boot-level names** (158
  functions): 109 private to one section (26 %), 190 shared by two or three (45 %), **123 hubs used by four or more (29 %)**; **900 cross-section uses**;
  151 forward uses, every one inside a callback (none at boot time); **ONE strongly connected cluster of 26 sections** (only §10 a comment, §21 the keyboard
  window, §27 the RENDER card, §28 `go`, §30 the order sit outside); 43 mutual pairs. [MEASURED]
- **The hubs** (users): `clock` 21 · `ui` 21 · `mat` 19 · `schedule` 18 · `reg` 17 · `layout` 14 · `__LW_hooks` 12 · `field` 12 · `modHost` 11 · `modView` 11 ·
  `obs` 11 · `rack` 10 · `sturm` 10 · `domain` 9 · `quality` 9 · `tl` 9 · `camera` 8 · `chem` 8 · `history` 8 · `modArm` 8 · `saveSettings` 8 · `space` 8 ·
  `stageText` 8 … — 123 in all. Six `let` hubs are WRITTEN from other sections (`modHost`/`modView` by §11, `tl` by §22, `modArm` by §12, `history` by §25,
  `palette` by §8, `space` by §8 §9 §24 §26). [MEASURED]
- **The sections that matter** (lines · cost = reads + 3·writes + ui + hubs · what they provide): §8 WINDOWS 864 · 181 · the `ui` bag's 94 of 107 members and
  54 api names; §19 THE RACK IS THE KIT'S (createRack/menubar/keys wiring) 716 · 142; §6 THE ROUTER (the frame loop) 401 · 214 · 113 reads; §24 PERSISTENCE
  294 · 160 · 41 `ui` uses; §11 the modulation seam 263 · 109; §26 THE DIAGNOSTICS SURFACE (`__LW`) 259 · 257 · 145 reads, 169 of the facade's 176 members;
  §9 LEGACY/CHEMISTRY/ORBITALS/STAGE TEXT 246 · 62; §25 SHAREABLE LINKS 236 · 42; §12 THE TRANSPORT STRIP 229 · 40; §16 KEPLER 229 · 57; §2 ONE CONTROLLER
  183 · 39 but **provides 229 uses, 82 api names** (the largest provider); §1 SETTINGS 142 · 60; §20 KEYS 109 · 57; §0 the boot head 59 · provides 145. The
  cheapest moves are tiny: §17 (9 lines), §3 FIELD (15), §4 workers (36), §21 (24). [MEASURED]
- **The `ui` bag** (107 members) is consumed OUTSIDE `rack.js` too: `lab/native-ui.js` takes `ui` whole (`reworkNative({ ui, … })`, 22 uses), `badges.js` 3,
  `look.js` 2, `first-run.js` 1 — the walker cannot see those [MEASURED by grep]. **The `__LW` facade** 176 members (§26 169, §28 5, §27 1, §30 2),
  `__LW_hooks` 13. **Found by the tool, not fixed:** four unused imports (`tableFor`, `FILM_FPS`, `domainForP`, `momentumTableFor`); the `device` import
  shadowed by boot's wrapper; the `LW` literal names `windowActivity` twice — the later getter wins, so `__LW.windowActivity.state(id)` reaches the raw
  service with a string (a defect). [MEASURED]
- **The tree:** `lab/*.js` **27,666** lines in 97 files; the kit 39,172 in 154 (untouched); `lab.css` 801 + `skin.css` 583 unlayered, 36 `!important`; tests:
  81 node suites (942 verdicts), 34 browser suites, the 152-law boot suite; THE LOCK 860 / 1004 · 0/0; the pair gate 3.536 ms/s; `v0.5.1-alpha` cut. The kit
  ships `createApp()` ("the standard wiring, as one call": banner · first run · rack · look · language · keys · modulation · one clock + bar · params · pages ·
  notebook · FOLDERS · INFORMATIONAL · help/KEYBOARD · menus · hints · describe · scene guard · wake lock; every piece optional), which λWAVES' `boot()`
  hand-wires piece by piece because the adoption took them one row at a time. [MEASURED]

## 1 · What the graph says the shape must be

A section-by-section "move" is not available: 29 % of the names are hubs and 26 sections form one cycle, so any module carved out as it stands would take
20–80 named locals with it. **The dissolution therefore has one precondition and then becomes a set of moves:**

**THE CONTEXT.** One explicit object — `app` — made at the top of `boot()`, holding the hub names as members and filled in boot order (`app.clock`,
`app.mat`, `app.reg`, `app.obs`, `app.sturm`, `app.field`, `app.schedule`, `app.layout`, `app.rack`, `app.look`, `app.quality`, `app.domain`, `app.history`,
`app.palette`, `app.settings`, `app.camera`, `app.chem`, `app.stageText`, `app.modulation = { host, view, arm, tl }`, `app.space`, `app.kepler`,
`app.shadow`, `app.touchState`, `app.device`, `app.hooks` (= `__LW_hooks`, folded) …). The 151 forward uses are callbacks, so a progressively filled object
serves them exactly as the closure does today. The six `let` hubs written from elsewhere become visible writes (`app.modulation.host = …`). The `ui` bag
becomes `app.ui`, a REGISTRY the window modules fill (it does not die in 0.5.2: `native-ui.js`, `badges.js`, `look.js` read it whole; killing it is the kit's
`describe`/`param` road, a later release). With the context in place, every section's dependency is `app` plus the few names the ranking lists under its
`deps` — and the tool measures that residue before the moves are briefed.

## 2 · The gates

| gate | what | when |
|---|---|---|
| **G-D the lock** | 860 and 1004 values · 0/0 — no digest moves in this release (a moved digest is a defect, never a re-bake) | R0, R1, R6, R-V |
| **G-M the pair** | base `v0.5.1-alpha`, |Δ| ≤ 3.536 ms/s, the boot scene AND D1's scene (`--setup`), interleaved 5 + 5, quiet rig | R0, R1, R-V |
| **G-B the bytes** | `tools/serialize-bytes.mjs` 11/11 identical (full AND edit scopes — no card is added) and `tools/settings-probe.mjs` 0/6; the project format moves by zero bytes | every row |
| **G-W the facade** | the `__LW` member LIST (176, from `rack-deps.json`) is pinned by a node test from R0 on; nothing renamed or removed; the duplicate `windowActivity` key fixed once (R5) | every row |
| **G-S the suites** | node 0; the whole browser estate at R0, R1, R6 and R-V (the whole file moves textually); the owning suites per window row; the boot suite alone at R0, R1, R6, R-V (B149 the only law red) | per row |
| **G-L lines** | `lab/*.js` ≤ 27,666 + 2 % at any merge (≤ 28,219); **≤ 27,666 at the cut** (the OUTs pay: four imports, `__LW_hooks`, the duplicate keys, the `ui` indirections); `rack.js` ≤ 1,500 at the cut; no module > 600 lines (a window may be two files) | every row |
| **G-G the graph** | `node tools/rack-deps.mjs` after every row: the hubs' users drop as `app.` members take them; a module's `deps` ≤ 10 named locals beyond `app`; the cycle count reported | every row |
| **G-K the kit law** | never edit `lab/mir/**`; `createApp` is not adopted here (R7-B) | — |

## 3 · The rows

Each row: a fresh Opus builder, a `BRIEF-R<n>.md`, `R<n>-HANDOFF.md` after every step, `R<n>-BUILD.md` with the ledger and the graph's before/after, merged by
the recipe. Sizes S/M/L; lines are moves, so the ledger is near zero and said exactly.

| # | row | what moves / changes | closer | out · lines [DERIVED] |
|---|---|---|---|---|
| **R0** (M) **THE CONTEXT** — the measuring row, alone first | `app` made at the top of `boot()`; the 30 most-used hubs become `app.<name>` across `rack.js` (a mechanical rename of ≈ 700 uses; no section moves); `__LW_hooks` → `app.hooks`; the four unused imports leave; the `device` shadow resolved; `tools/rack-deps.mjs` learns `app.` members (counts them as context, not as hubs) and gains `--members` (the `__LW` list) for G-W's node test `tests/lw-facade.test.mjs` | THE LOCK 860/1004 · 0/0; the pair in both scenes (a property read vs a closure read — expect Δ ≈ 0; this is the number); the whole suite estate + boot alone; `rack-deps`: hubs with ≥ 4 users fall from 123 to the context's members, the ranking's `deps` lists shrink — **the residue decides the rest: if a typical section still needs > 10 named locals beyond `app`, STOP and re-plan** | OUT 4 imports + 13 hooks lines; IN the `app` literal ≈ +35 → **≈ +20** |
| **R1** (L) **THE HOST** — the frame path, alone second | §2 ONE CONTROLLER + §3 FIELD + §4 THE MATHS WORKERS + §5 THE BACKGROUNDED TAB + §6 THE ROUTER + §7 ONE ROAD (≈ 780 lines) → `lab/host.js` `createHost(app)` (the clock, the field, the governor, `schedule`, the loop, the one mutation road, the workers), registering on `app`; §13 badges and §14 the install layer ride along (they are the loop's readouts) | THE LOCK; the pair; frame-occlusion 7; gpu-recovery alone; `tests/legacy/boot` B6/B22/B23 + the full suite alone; the device report's long play; `current` 15; `render-regressions` 2 | moves ≈ 0; the export/import lines ≈ +15 |
| **R2a–d** (L, four builders in parallel after R1) **THE WINDOWS** | §8 WINDOWS 864 + §9 246 + §15 THE BOW 65 + §16 KEPLER 229 + §18 INK UNDER GLASS 60 + §11 the modulation seam 263 + §27 RENDER 20 → `lab/windows/<card>.js`, one module per card with ONE shape `create<Card>(app) → { card, routes, slice: { project, workspace }, keys, api }`, registering its controls into `app.ui` (the registry) and its api into `app.windows.<card>`: **(a)** STATE · SPECTRUM · the register (ORBITALS / MO-REGISTRY) · the bow · Kepler; **(b)** MOLECULES (CHEMISTRY) · the molecular session · the stage text + the head · the atom letters; **(c)** SHADOW · ORBIT · PLANE · CALCULUS · RADIATION · METERS · WIGNER · VORTEX · PARTICLES · FLOW · ATOMS · SETTINGS (the readouts and the settings surface; `native-ui.js` keeps reading `app.ui`); **(d)** CAMERA (the kit's panel over the law's port) · RAMP · RENDER · CURVES · the modulation window seam (`lab/windows/modulation.js`) | each: its owning suites (the window's browser suite(s), `history`, `new-project` + `--check`, `settings-probe`, `serialize-bytes` 11/11, `hit-probe-set`, `frame-occlusion`, `offer`); `rack-deps`: the moved section's cost → 0 inside `rack.js`, its module's `deps` listed | moves ≈ 0 each; the shape's boilerplate ≤ +3 % of each module |
| **R3a–b** (M, two builders in parallel with R2) **THE SHELL** | **(a)** §1 SETTINGS 142 + §24 PERSISTENCE 294 + §25 SHAREABLE LINKS 236 + §29 a link opens 29 → `lab/shell/settings.js` (the blob, `saveSettings`, the scopes) and `lab/shell/persist.js` (serialize/restore — the one road; `statelink.js` stays); **(b)** §19 THE RACK IS THE KIT'S 716 + §20 KEYS 109 + §21 the keyboard window 24 + §22 the timeline 33 + §23 the tab order 36 + §12 THE TRANSPORT STRIP 229 + §17 the floating rack 9 + §30 the order 37 → `lab/shell/rack-wiring.js` (createRack/menubar/keys/keyboard/timeline) and `lab/shell/transport.js` (λWAVES' own bar — it stays λWAVES', Josh's ruling) | (a) `serialize-bytes` 11/11 full + edit; `settings-probe` 0/6; `project-formats`; `history` 44; `new-project` + `--check`; `tests/statelink`/the link suites; (b) `menubar` 8/8, `keyboard-window`, `keyboard-shortcuts`, `timeline` 14/14, `offer` 16, `hit-probe-set`, `first-run` 12, `access` | moves ≈ 0; ≈ +20 |
| **R4** (M, after R2 + R3) **THE SCOPE TABLES, generated** | each module's `slice` declares its PROJECT keys and WORKSPACE keys; `settings-store.js`' `FAMILIES`/`WORKSPACE` and `persist.js`' key order are DERIVED from the modules at boot (the hand-kept tables leave); `docs/STATE-SCOPES.md` generated by a tool from the same declarations | `serialize-bytes` byte-identical before/after (the key ORDER is the law — derive it in the registration order that reproduces today's bytes, prove with the tool); `settings-probe` 0/6; `project-formats`; the generated STATE-SCOPES.md diffs only in provenance lines | OUT the two hand-kept tables (≈ −60); IN the declarations ≈ +40 → **≈ −20** |
| **R5** (S, after R2 + R3) **THE FACADE, assembled** | §26 THE DIAGNOSTICS SURFACE 259 → `__LW` assembled in `rack.js` from each module's `api` in boot order (`Object.assign` in the pinned member order); the duplicate `windowActivity` key fixed (the wrapper, not the getter — say which the tests use); `app.hooks` gone where a module's api covers it | `tests/lw-facade.test.mjs` (the 176-member list unchanged, every member defined once); every browser suite that reads `__LW` (= all) once as a batch at R-V; `rack-deps`: §26's 145 reads → 0 | OUT ≈ −30 (the literal's forwarding lines) |
| **R6** (M, alone, last) **THE TREE** | file MOVES only: the engine (`field.js`, the shaders, `capture.js`, `render-exact.js`, `state.js`, `molecules.js`, `rhf-molecule.js`, `md.js`, `h2ci.js`, `hydrogen.js`, `sturmian.js`, `dynamics.js`, `kick.js`, `well.js`, `wigner.js`, `density.js`, `hamiltonian.js`, `gas.js`, `worker-pool.js`, `mathworker.js`, `response-fit.js`, `frontier.js`, …) → `lab/engine/`; the window modules already in `lab/windows/`; the shell in `lab/shell/`; `rack.js` stays `lab/rack.js` (the boot order); every import, every test and tool path, `sw.js`, the manifest, `tools/wiring`, `tools/new-project.mjs --check` | THE LOCK (the shaders moved — the bytes must not); every suite once; `bash test.sh node` 0; `node tests/pwa.test.mjs --write`; `adopt.mjs --check` in step | 0 lines; a hundred import paths |
| **R-V** (fresh Opus) | the verifier: the pair vs `v0.5.1-alpha` (both scenes + TIMELINE open); the lock; every suite + boot alone; `serialize-bytes` 11/11 full + edit vs 0.5.1; the facade list; lines vs the caps; `rack-deps` final (`rack.js` ≤ 1,500; the cycle count; no module > 600); CLAUDE.md against the tree (the file paths it names moved) | FIT TO CUT / FIT WITH NOTES / NOT FIT | — |

**Not in this release (Group II):** the CSS tokens (paced by MIR: `BRIEFS-0.5.1.md`); killing `app.ui` (the kit's `describe`/`param` road); adopting
`createApp` (R7-B); splitting the boot suite's laws per window (R7-E); any behaviour change.

## 4 · Order and the dial

**R0 alone** (it measures; its residue can stop the plan) → **R1 alone** (the frame path; the lock and the pair) → **R2a–d ∥ R3a–b** (up to four builders at
once; R2's four are disjoint cards; R3a and R3b are disjoint sections; two builders at a time in `rack.js` itself — the moves are cut-and-paste out of it, so
each builder names its line span in the brief and merges touch disjoint spans) → **R4 ∥ R5** → **R6 alone** → **R-V** → a fix round → the cut.
**The dial:** Opus for every row (Josh 10-06); one verifier; the lock at the four marked rows only; the pair at three; one light check per window row.
Each builder's first and last command: `node tools/rack-deps.mjs` — the graph's before/after is in every BUILD.

## 5 · The numbers [DERIVED]

Rows: 1 + 1 + 4 + 2 + 1 + 1 + 1 + the verifier = 12 builders. Hours: R0 3 · R1 4 · R2 4 × 3–4 (≈ 5 wall) · R3 2 × 3 · R4 3 · R5 2 · R6 2 · R-V 2 · fix 1 ·
integration ≈ 13 merges × 20 min ≈ 4 → **≈ 20–24 h of integrator wall-clock ≈ 2–2.5 relay days** — above the 1.5–2 said to Josh before the measurement,
because the hubs force R0 and the cycle forces R1 before the windows. Lines at the cut ≈ 27,640 (the OUTs ≈ −110, the shapes ≈ +80); `rack.js` ≈ 1,200
(the boot order, `app`, the assembly). The one number that can still move the estimate is R0's residue (G-G).

## 6 · For Josh — the rulings (first option = default), then the questions

1. **R7-A THE CONTEXT:** one explicit `app` object for the hubs, filled in boot order (default) · per-module `deps` lists (123 hubs make that a list per module).
2. **R7-B `createApp`:** NOT adopted in 0.5.2 (default — λWAVES keeps its transport and its photosensitivity-before-anything law, which the kit's shell does not
   carry; revisit after the dissolution, when the pieces are comparable: a brief "createApp with an app-owned transport and a pre-boot notice") · adopt it in R3b.
3. **R7-C the tree:** `lab/engine/` · `lab/windows/` · `lab/shell/` by file moves in R6 (default) · stay flat with name prefixes (no moves).
4. **R7-D the `__LW` facade:** assembled from the modules' `api`, the 176-member list pinned (default; nothing renamed) · trim it (another release; the tests read it).
5. **R7-E the boot suite:** its 152 laws stay ONE suite through 0.5.2 (default — it is the drift gate for the moves) · split per window now.
6. **R7-F the line law:** ≤ +2 % at any merge, ≤ 27,666 at the cut, `rack.js` ≤ 1,500, no module > 600 (default) · looser.
7. **R7-G the `ui` bag:** becomes `app.ui`, a registry the windows fill; `native-ui.js` keeps reading it (default) · rewrite `native-ui.js` to the modules' apis now (bigger).
8. **R7-H the name and number:** 0.5.2 "Rack Dissolution" (default) · "Engine Boundary" · his.
**Questions:** Q1 the pair's base is `v0.5.1-alpha` and the lock's baseline is unchanged — any digest move is a defect, agreed? Q2 may R6 move the shaders'
files (the lock proves the bytes)?

## 7 · What is not claimed

No line is moved yet. R0's residue is unmeasured and is the plan's one hinge. The walker's blind spots (`RACK-DEPS.md` §12): objects passed whole
(`reworkNative({ ui })`, `createBadges({ dom, … })`), aliases, dynamic members, calls as reads — the window modules must grep their consumers outside
`rack.js` before claiming a `ui` member private. The pair's sensitivity to `app.` property reads on the hot path is assumed ≈ 0 and measured at R0. The
hours are the integrator's estimate from 10-09's rows. The project format's byte-identity under R4's derived key order is proven by the tool, not assumed.
Nothing Josh sees changes; if R-V finds a visible change, that is a defect.

## 8 · The deltas this plan carries from 0.5.1

The four unused imports; the `device` shadow; the `windowActivity` duplicate; the `__LW_hooks` bag; `BRIEFS-0.5.1.md`'s kit candidates stay the kit's;
0.5.1's found-not-fixed (the film mask R6-M, the returning-browser card gap, the badge tick, gpu-recovery on the rig) are NOT this release's (no behaviour
change) and stay on the list.

— Claude Yan, 2026-10-09. The audit (one Opus@high pass → `AUDIT-OPUS.md`) is read whole and folded into `PLAN.md`; then `BRIEF-R0.md`; the build on Josh's word.
