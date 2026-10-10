# R0-BUILD · THE CONTEXT (0.5.2 "Rack Dissolution"; Opus 5.5 builder; the measuring row)

Base `54865a3` (`yan-c` = `v0.5.1-alpha` + `tools/rack-deps.mjs` + the 0.5.2 plan); `lab/` is byte-identical to `v0.5.1-alpha` there.
Ports 9043/5513 (this tree) and 9047/5517 (the base export, and the U1 scratch tree in turn). The rig: one RTX 3070; Josh's desktop
Firefox (pid 2002078, no marionette) was up all session and was never touched; a `playwright-mcp` launcher (no browser) idles.

## 1 · The ledger (step by step)

| step | what | result |
|---|---|---|
| 1a | `tools/rack-deps.mjs --classes` (the plan's §3 cut as anchored pieces; AUDIT §3.2's classes) and `--rename` (resolver-driven, token positions) | built; on the base it reproduces AUDIT §3.2 (§2 below) |
| 1b | U1 the hoisting audit (scratch tree, two transforms, boot + preamble + four demos) | **readSettings** is the one cross-module early call (§3) |
| 1c | U7 the runtime facade fixture on `v0.5.1-alpha` | `research/release-0.5.2/lw-facade.json`: 176 members (56 value · 48 get · 72 method); `tests/lw-facade.browser-test.mjs` GREEN on the base |

## 2 · The classes table BEFORE (`node tools/rack-deps.mjs --classes` on the base, `5ed392623650`)

The cut is `PLANNED_CUT` in the tool: 39 pieces in file order, each starting at the first line its anchor matches after the previous
piece, so the pieces tile the body by construction and an inserted line moves no boundary. A piece that STAYS in `boot()` (the head,
the loop §5–§6 + `filmHold`, the camera law and the seats, the five appends, `READERS`, §13–§14, §17, §27–§30) shares boot's scope:
a `let` only stay-pieces touch is a closure slot, not a crossing. `forward` counts consts/functions declared after the module's
first line (lazy `app.<ns>.x`); `shared lets (bare)` the lets another scope owns; `fwd + shared` adds the `app.state` members in use.

| module | row → file | lines | backward | forward | shared lets (bare) | app.state | **fwd + shared** | bare writes to another scope's let | hinge |
|---|---|---|---|---|---|---|---|---|---|
| boot (stays) | — → `lab/rack.js` | 249 | 0 | 52 | 10 (+1 boot-kept) | 0 | **62** | 1 (filmCard) | RED |
| loop (stays) | — → `lab/rack.js` | 484 | 41 | 49 | 27 | 0 | **76** | 10 (badgesWall, feedMs, flowEpoch, govVersion, keplerDirty, metersWall, modExpOn, modWall, pendingRef, playedLast) | RED |
| settings | R3a → `lab/shell/settings.js` | 142 | 7 | 13 | 2 | 0 | **15** | 0 | ok |
| controller | R1 → `lab/shell/controller.js` | 305 | 13 | 10 | 2 | 0 | **12** | 0 | ok |
| material | R2c → `lab/windows/material.js` | 131 | 11 | 0 | 2 | 0 | **2** | 2 (palette, space) | RED |
| settings-card | R2c → `lab/windows/settings.js` | 179 | 22 | 1 | 4 | 0 | **5** | 3 (molFormulaScale, stageFollow, stageMix) | RED |
| film | R2c → `lab/windows/film.js` | 21 | 5 | 3 | 3 | 0 | **6** | 1 (capApi) | RED |
| state | R2a → `lab/windows/state.js` | 170 | 14 | 6 | 2 | 0 | **8** | 2 (applyVisuals, refSnapshot) | RED |
| spectrum | R2a → `lab/windows/spectrum.js` | 250 | 18 | 15 | 9 | 0 | **24** | 6 (gasAxial, gasWidth, lastNmax, pendingRef, refSnapshot, space) | RED |
| readouts | R2b → `lab/windows/readouts.js` | 139 | 15 | 4 | 3 | 0 | **7** | 0 | ok |
| molecules | R2d → `lab/windows/molecules.js` | 97 | 18 | 3 | 5 | 0 | **8** | 3 (pendingRef, refSnapshot, space) | RED |
| stage-words | R2d → `lab/shell/stage-words.js` | 123 | 4 | 2 | 2 | 0 | **4** | 0 | ok |
| modulation | R2d → `lab/shell/modulation.js` | 247 | 20 | 1 | 9 | 0 | **10** | 4 (dodge, modHost, modView, restampParams) | RED |
| transport | R3b → `lab/shell/transport.js` | 229 | 16 | 0 | 4 | 0 | **4** | 1 (modArm) | RED |
| kepler | R2b → `lab/windows/kepler.js` | 294 | 15 | 1 | 3 | 0 | **4** | 2 (keplerDirty, refSnapshot) | RED |
| ink | R2d → `lab/shell/ink.js` | 60 | 6 | 1 | 3 | 0 | **4** | 2 (occludeAt, occludeDirty) | RED |
| rack-wiring | R3b → `lab/shell/rack-wiring.js` | 327 | 39 | 0 | 4 | 0 | **4** | 3 (cornerLayoutDirty, dragging, kdrag) | RED |
| notebook | R3b → `lab/shell/notebook.js` | 389 | 29 | 10 | 11 | 0 | **21** | 1 (exporter3d) | RED |
| keys | R3b → `lab/shell/keys.js` | 202 | 33 | 1 | 12 | 0 | **13** | 4 (govVersion, metersWall, tl, uiHidden) | RED |
| persist | R3a → `lab/shell/persist.js` | 294 | 50 | 0 | 13 | 0 | **13** | 4 (gasAxial, lastNmax, space, stageMix) | RED |
| links | R3a → `lab/shell/links.js` | 78 | 5 | 0 | 3 | 0 | **3** | 0 | ok |
| history | R3a → `lab/shell/history.js` | 158 | 11 | 0 | 5 | 0 | **5** | 3 (histShown, history, pointerHeld) | RED |
| facade | R5 → `lab/shell/facade.js` | 259 | 122 | 1 | 21 | 0 | **22** | 2 (gasAxial, space) | RED |

THE HINGE before: 54 bare writes across scopes; the largest moving module SPECTRUM at 24 (limit 25) → FAILS on the writes alone.
**The shared lets (57)**, every `let` a scope other than its owner's touches: history, palette, molFormulaScale, space, playedLast,
uiHidden, pointerHeld, metersWall, govVersion, keplerDirty, badgesWall, applyVisuals, modView, modHost, modWall, tl, modExpOn, dodge,
filmCard, feedMs, rotMoved, rotTicking, audioCap, modArm, occludeDirty, occludeAt, stageMix, stageFollow, refSnapshot, pendingRef,
warmTimer, warmIdle, dragging, cornerLayoutDirty, exportLocked, histShown, lastNmax, capApi, camKnobs, exporter3d, flowEpoch, chem,
restampParams, molSession, register, orbitals, states, stageText, bow, bowInFlight, bowChain, kdrag, gasWidth, gasAxial, lastLaunch,
restoreNotice, linkLast. **The crossing consts/functions: 238** (70 of them hoisted function declarations).

Against AUDIT §3.2 (`.tmp/classes.mjs`, the same base): the same classes; the numbers differ only where the plan's §3 cut differs from
the audit's re-cut (R1 = §2–§4 + §7 in one module: 12; the 1100 block split three ways; SPECTRUM's span begins at its `// SPECTRUM`
comment and leaves the five appends to boot: 24 as the audit; the readouts' three spans: 7; §25 split links | history).

## 3 · U1 THE HOISTING AUDIT

Scratch tree: `git archive` of the base into `.tmp/scratch` (its `lab/` = `v0.5.1-alpha`'s), served on 9047; `.tmp/u1-transform.mjs`
rewrites `lab/rack.js` over the tool's token positions (106 boot-level function declarations); `.tmp/u1-run.mjs` boots it under the
boot suite's URL (`?preset=1s%2B2pz`), runs the suite's preamble (dark, density, vortex + overlay, Kepler, tags, every window reopened
and unfolded), then opens WATER, BENZENE, N₂ and WAVE DANCER through `__LW.projects.demo`. Two transforms, because one cannot see all:

1. **probe** — every declaration keeps hoisting and gains a guard: a CALL before its declaration's seat is recorded with the caller's
   stack (this sees a call that a `try` would swallow, and one run sees them all). Result, after boot, the preamble and the four demos:
   - `readSettings` (§1, `:166`) ← `boot` `:131` (§0's `useCompactDefaults`) — **cross-module** (boot → settings)
   - `setModArm` (§12, `:2665`) ← the transport IIFE `:2655` — intra-module (transport → transport)
2. **const** — every declaration becomes `const x = function x(…) {…};` except a keep-list (this sees an eager VALUE read, which the
   probe cannot): the first run threw `can't access lexical declaration 'saveMod' before initialization` at `:421` (`save: saveMod`
   handed to `createModPort`, §2; `saveMod` is §2's own, `:470` — intra-module). With **readSettings, setModArm, saveMod** kept, the
   other 103 as consts: boot, the preamble and the four demos ran with no error, no banner, `LW.ready`.

**The U1 list (functions called or read before their declaration):** `readSettings` (cross-module: it goes on `app` at the top of
`boot()`, where hoisting serves it — `app.sh.readSettings`), `setModArm` and `saveMod` (each inside its own planned module: a module
function keeps hoisting inside `create<X>(app)`, so they need nothing — but the rows that move §12 and §2 must keep them function
declarations inside their module). Not covered: paths the gate does not take (a phone crossing, a saved non-default settings blob, a
`#s=` link open); an eager value read inside a `try` would be swallowed by the const transform. The scratch tree is discarded.

## 4 · U7 THE RUNTIME FACADE FIXTURE

On the base (`v0.5.1-alpha` export, 9047): `Object.entries(Object.getOwnPropertyDescriptors(__LW))` after `LW.ready` + a settle →
`[name, kind]`, kind = `get` (an accessor) | `method` (a function value) | `value`, in property order: **176 members — 56 value · 48
get · 72 method** (`research/release-0.5.2/lw-facade.json`). `frost` sits at slot 32 (its FIRST definition's place, `:4552`) and
`windowActivity` at slot 143 (the dead wrapper's place, `:4723`), each with its later definition's kind (`get`). `tests/lw-facade.browser-test.mjs`
(one scene; `--write` re-captures): **GREEN on the base** (`LW_PORT=9047 GD_PORT=5517`).
