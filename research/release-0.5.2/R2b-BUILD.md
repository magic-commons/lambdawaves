# R2b-BUILD · THE READOUTS + KEPLER (0.5.2 "Rack Dissolution"; Opus 5.5 builder; PAIR 2 beside R3b)

Base `1d5b060` (`yan-c`; its `lab/` = `87aad5e`'s). Worktree `.claude/worktrees/agent-a1dd669ddd57e6ee1`, branch `worktree-agent-a1dd669ddd57e6ee1`.
Ports 9083/5553 (this tree) and 9087/5557 (the base: `git archive 1d5b060` into `.tmp/base`, the default certificate directory). One browser at a
time: every suite waited for a free rig through `.tmp/rigfree.mjs` (no geckodriver, no marionette Firefox, no headless chrome but the editor's
playwright one — read from `/proc/<pid>/cmdline` by argv0 — and the 1-min load < 4; polled every 30 s). `tools/perf/wait-gpu.mjs` counts any
process whose ARGS mention "marionette", so another builder's poll (a shell line naming the word) kept it busy for ten minutes while nothing ran
(R3b's `run.sh` sat waiting at the same moment): the argv0 read sees the same browsers without that livelock. R3b's geckodriver runs were waited
out, never touched. Josh's desktop Firefox and the servers on 8721 · 8731 · 8741 · 8751 · 8755 were not touched.

## 1 · The ledger

| step | commit | what |
|---|---|---|
| 1 | `2eea64b` | THE MOVE: the three readout spans → `lab/windows/readouts.js` (three seats), THE BOW + KEPLER → `lab/windows/kepler.js`; four seats in `rack.js`; the imports; `tools/rack-deps.mjs` learns a later seat; `rack-deps.test` +1 law; `pwa --write` |
| — | `fc5ecd1` | `R2b-HANDOFF.md` after step 1 |
| 2 | (this) | the light check, this file, REPORT wave 219, the handoff |

The move was done by `.tmp/r2b-move.mjs` over the walker's token positions (`lex` / `pairBrackets` / `scopeWalk`; no sed): it cuts the four spans,
checks every free name of each is handed from `app` or read at use (it refuses a write to one, a name that is neither, and an at-use read that runs
eagerly — except `wChem` / `wOrbs` at the second seat, filled before it), rewrites the 8 at-use references, and computes each seat's return as the
names `rack.js` still reads. Kept in `research/release-0.5.2/r2b-measure/` with the verbatim and free-name checks.

### The shape: three seats, one module (the brief's "say which")

`createReadouts(app)` builds SHADOW · ORBIT · VORTEX · PLANE at its root and RETURNS the two later seats as root-level function declarations,
`createCalcMetersLadder()` and `createAtomsWignerRadiation()`; `boot()` destructures them at the first seat and calls each where CALCULUS and ATOMS
stood. So no `device()` / `appendChild` / `register` changes its order (G-O), and the later seats close over the root's one hand-over. Their bodies
keep the two-space indentation (verbatim; the source-reading laws' slices still match), so the function line and its `return { … }; }` sit at the
body's column.

**The tool needed one rule** (`tools/rack-deps.mjs` `measureFile`, 13 lines, + `classes` 4): a nested function's references are "deferred"
lexically, so the later seats' fills (`app.w.wMet`, `ladder`, `wAtoms`, `wignerView` … — persist DESTRUCTURES four of them) read as never filled
(G-A strays, measured: the base tool refuses this tree with `persist.js:14: destructures app.w.ladder, a null slot …` ×3) and their own
registrations as crossings. Now a `function create<Y>()` declared at a module root's statement level is a LATER SEAT: its statement level is eager,
its declarations are the module's own, and part k's eager writes stand at the module's k-th piece in `PLANNED_CUT` (`r.part`; `fileFills` and the
`app.state` seats read that piece's line). `rack-deps.test` §5 gains the law (a second seat fills `app.w.wX` at its own piece; a later module
destructures it clean; the fill is a registration; a callback inside stays deferred) — RED on the base tool, GREEN now. A module without such a
function is measured exactly as before (the table's other rows unchanged).

**Names.** `createKeplerSurface(app)`, not the brief's `createKepler(app)`: `keplerview.js` already exports `createKepler` (the KEPLER overlay that
span 1 creates — readouts.js imports it), and two different `createKepler`s one import apart is a trap (R2a's `createSpectrumCard` precedent).

## 2 · `lab/rack.js` (3,605 → 3,162, −443), exact (base line numbers)

| where | what |
|---|---|
| `:35–41` | the seven card-view imports (meters, shadowview, ladder, orbit, vortex, particles, keplerview) → ONE line: `import { createReadouts } from './windows/readouts.js'; import { createKeplerSurface } from './windows/kepler.js';   // 0.5.2 R2b …` |
| `:55–56` OUT | `solveLadder`, `createCalculus` |
| `:59–62` OUT | `createSliceView`, `createAtoms`, `createWigner`, `createRadiation` |
| `:64` OUT | `momentumZ, rotorsToZ` (kick.js) |
| `:69` OUT | `applyRotor as rotorOnCopy` (frontier.js) |
| `:1044–1134` → 2 lines | **seat 1** under the kept `// SHADOW`: `const { wSh, shadowView, shadowFoot, wOrb, orbit, kepler, wVor, vortex, particles, flowTracers, wSlice, slice, createCalcMetersLadder, createAtomsWignerRadiation } = createReadouts(app);` |
| `:1359–1385` → 1 line | **seat 2** under the kept `// CALCULUS — the stats…`: `const { wCalc, calculus, wMet, meters, wLad, ladder } = createCalcMetersLadder();` |
| `:1636–1658` → 1 line | **seat 3** under the kept two-line `// ATOMS — …` comment: `const { wAtoms, atomsView, wWig, wignerView, wRad, radiationView, WIG_OK, RAD_OK } = createAtomsWignerRadiation();` — the kept tail `Object.assign(READERS, …)` / the track loop / `hydroReader` follows it untouched |
| `:1936–2229` → 2 lines | **seat 4** under the kept `/* ── THE BOW: … ── */`: `const { bowStart, bowMove, bowRelease, orbitOfShell, kepShell, keplerTurn, keplerDragToPoint, keplerDragTo, keplerRowSync, gas, gasReadout, gasTableOn, launchPacket, enterBox, coherentBounce, bowCancel, slapAlong } = createKeplerSurface(app);` |

−435 moved (the 10 inherited fill lines among them, plus 2 blanks) −15 import lines +1 import line +6 seat lines = **−443**. No boot fill added; every
inherited fill left `boot()` with its declaration.

**Three dead imports left ON PURPOSE** (`keplerOrbits` `:47`, `createGas` `:48`, `wellPacket` in `:68`'s `{ wellPacket, wellCentroid }`): only the
moved spans used them, but each line is ADJACENT to an import line R3b's move very likely edits — `:45–46` (`createKeyboardWindow`, `createKeyTable`:
only §20–§21 use them), `:49` (`densityPeriodExact`, `fmtPeriod`: only §12 uses them), `:67` (`mdText`: only §19b uses it) — and git calls adjacent
edits a conflict. They are the tool's `imports never referenced (keplerOrbits, createGas, wellPacket)`; **the integrator deletes them at the merge (−2
lines, one name)**.

## 3 · The modules, exact

**`lab/windows/readouts.js`** (158 lines): 1–2 header · 3–10 eight import lines (16 names) · 11 `export function createReadouts(app) {` · 12–13 the
hand-over · 14–102 span 1 (89 lines: SHADOW · ORBIT · VORTEX · PLANE, two blank lines inside ORBIT's block OUT) · 103 `function createCalcMetersLadder() {`
· 104–130 span 2 (27) · 131 `return { wCalc, calculus, wMet, meters, wLad, ladder }; }` · 132 `function createAtomsWignerRadiation() {` · 133–155
span 3 (23) · 156 its `return { … }; }` · 157 the root return (14 names) · 158 `}`.

**`lab/windows/kepler.js`** (307 lines): 1–2 header · 3–7 five import lines (15 names) · 8 `export function createKeplerSurface(app) {` · 9–10 the
hand-over · 11–304 THE BOW + KEPLER (294) · 305–306 the return (17 names) · 307 `}`.

**Verbatim, proved** (`r2b-measure/r2b-verbatim.mjs`, line by line against `1d5b060`): of the **433 moved lines 424 are byte-identical**; 2 blank lines
were dropped; the other **9**: 8 read a slot (`app.w.keplerRowSync` ×1, `app.w.keplerTurn` ×3 — SHADOW/ORBIT's SHELL seg and SPIN · TILT · TURN, in
callbacks; `app.w.wChem`, `app.w.wOrbs` — the two `devopen` listeners at seat 2, after MOLECULES registered them; `app.sh.keyState` ×2 in
`enterBox` / `coherentBounce`), and 1 is kepler's registration line, which gains `app.w.keplerTurn = keplerTurn;` beside `keplerRowSync` (readouts
reads it). Comments and section headers travel (KEPLER's header inside kepler.js; the four seat headers stay as the seats).

**The hand-overs** (one statement each):
- readouts: `const { dom, ui, device, reg, clock, useCompactDefaults } = app, { schedule, canPresent } = app.loop, { rack } = app.host, { setElement,
  fillValence } = app.w, { domain, cardLoading, solveCard, touchState, api } = app.ctl;`
- kepler: `const { dom, ui, reg, clock, obs, mat } = app, { schedule, canPresent } = app.loop, { camera } = app.host, { wState, wSpec, switchHamiltonian,
  kepler } = app.w, { domain, field, maths, touchState } = app.ctl;`
Every destructured slot is filled before the seat (rack.js' `app.loop.canPresent` / `app.host.rack` / `app.host.camera` fills; spectrum.js and
state.js register `wSpec` `setElement` `fillValence` `switchHamiltonian` `wState`; readouts registers `kepler` at its root; the controller fills
`app.ctl`) — G-A clean. The owned `app.state` seats travel: `flowEpoch` (readouts); `bow`, `bowChain`, `bowInFlight`, `kdrag`, `gasWidth`,
`gasAxial`, `lastLaunch` (kepler). Every `ui.x =` keeps its name on the one registry (`ui.shFoot`, `ui.hc`, `ui.shadowSeg` that native-ui reads and
re-parents; `ui.kepShell` …).

## 4 · Lines

`lab/*.js` + `lab/shell/` + `lab/windows/` **27,856 → 27,880 (+24)** of the 27,943 cap (**63 left**), exactly: readouts.js 158 − 139 moved = **+19**
· kepler.js 307 − 294 moved = **+13** · rack.js −443 + 435 moved = **−8** (−15 import lines, +1, +6 seat lines) · sw.js **+2** (two precache rows) ·
the 2 blank lines out = (inside readouts' count). Shape (header + signature + return + brace, the brief's ≤ 12 in all): readouts 2 + 1 + 1 + 1 +
**4 for its two later seats** (each a signature line and a `return { … }; }` line) = 9 · kepler 2 + 1 + 2 + 1 = 6 → **15**: three over, and the
three are the seats' price (a closure per seat, which the brief's own option names). Subtracted on the way: two blank lines inside ORBIT's block;
fourteen import lines net out of rack.js (thirteen in the modules, several names a line). The integrator's two dead import lines (§2) are −2 more.

## 5 · The classes table, before and after (`node tools/rack-deps.mjs --classes`)

| module | lines | backward | forward | shared (bare) | app.state (another's) | **fwd + shared** | bare writes | hinge |
|---|---|---|---|---|---|---|---|---|
| readouts BEFORE (`1d5b060`, three pieces in rack.js) | 147 | 14 | 4 | 0 | 3 (+1 own) | **7** | 0 | ok |
| readouts AFTER (`readouts.js`, seated `rack.js:1029`, handed 16; seats 1029 · 1255 · 1505) | 169 | 14 | 4 | 0 | 3 (+1 own) | **7** | 0 | ok |
| kepler BEFORE | 296 | 15 | 1 | 0 | 3 (+7 own) | **4** | 0 | ok |
| kepler AFTER (`kepler.js`, seated `rack.js:1784`, handed 17) | 311 | 15 | 1 | 0 | 3 (+7 own) | **4** | 0 | ok |

- **readouts** backward api, canPresent, cardLoading, clock, device, domain, fillValence, rack, reg, schedule, setElement, solveCard, touchState,
  useCompactDefaults · forward `w.keplerRowSync, w.keplerTurn, w.wChem, w.wOrbs` (before: the same four, bare) · app.state chem, orbitals,
  palette · own flowEpoch.
- **kepler** backward camera, canPresent, clock, domain, field, kepler, mat, maths, obs, reg, schedule, switchHamiltonian, touchState, wSpec, wState ·
  forward `sh.keyState` · app.state exportLocked, keplerDirty, refSnapshot (writes the last two) · own bow, bowChain, bowInFlight, gasAxial,
  gasWidth, kdrag, lastLaunch.
- **The same names, class for class, as before the move.** Every other row of the table is byte-for-byte the base's (diffed), boot 66 included.
  THE HINGE (G-G) HOLDS: 0 bare writes; the largest moving module SPECTRUM at 24. G-A clean (`app` at `:144`, 30 keys, the seven namespaces
  unchanged). The summary: forward 88 (deferred 83, hoisted 5, **eager let/const 0** — no seat const is read above its seat); boot-level names
  never referenced 3: `markBatchBegin` (R3a's), `applySturmian` (base), **`solveCard`** (new: its only reader moved into readouts, which reads
  it through `app.ctl`; it sits in the controller seat's 68 destructure, not my line — the integrator may drop it when that line is next touched).
- `tests/rack-deps.test.mjs` GREEN, 54 PASS (the new law; "the real tree: 9 module files measured … 23 rows").

## 6 · The import fan-out

`rack.js` **74 → 60 import lines** (15 out, 1 in: the two module imports share a line). **17 names left rack.js** (only the spans used
them): `createMeters`, `createShadowView`, `createShadowFoot`, `createLadder`, `createOrbit`, `createVortex`, `createParticles`, `createKepler`,
`solveLadder`, `createCalculus`, `createSliceView`, `createAtoms`, `createWigner`, `createRadiation`, `momentumZ`, `rotorsToZ`, `rotorOnCopy`; and `keplerOrbits`, `createGas`, `wellPacket` are now unreferenced there (§2, the integrator's). **Imported by both**
(rack.js still uses them): `el knob sw seg trig readout group` (kit), `toLUT`, `getHamiltonian setHamiltonian HAMILTONIANS getZ`, `VIEW VIEW_NAMES
cameraBasis toScreen`. **`TIER` from `'../rack.js'`** in both modules — R1's accepted cycle, read only inside functions. readouts.js 8 lines / 31
names; kepler.js 5 lines / 15 names. `wiring.test` walks them (node gate). Nothing under `lab/mir/**`.

## 7 · The `app.w` registrations (and boot fills)

- **Registered by readouts.js** (the inherited fills, moved with their declarations, verbatim): root — `shadowView` (the controller, STATE,
  SPECTRUM), `wOrb` `wVor` `wSlice` (SPECTRUM), `shadowFoot` `kepler` `vortex` `particles` `slice` (persist destructures them; kepler.js
  destructures `kepler`); seat 2 — `wMet` (the controller), `wCalc` `wLad` (SPECTRUM), `ladder` (persist); seat 3 — `wAtoms` `atomsView` (SPECTRUM,
  persist), `wignerView` (persist). Each fill runs at its seat, before persist's (`rack.js:2777`).
- **Registered by kepler.js:** `kepShell`, `keplerRowSync` (persist; readouts' SHELL seg), **`keplerTurn` (new — readouts' SPIN · TILT · TURN read it
  at use; the slot was already in the literal)**, `gas`, `gasSigma`, `launchPacket`, `enterBox`, `coherentBounce` (SPECTRUM).
- **Boot fills left: none of mine.** Every slot is filled exactly once (`grep -n 'app.w.<x> ='` across `lab/`: one line each).
- Not filled (no reader outside boot yet): `wSh`, `orbit`, `flowTracers`, `calculus`, `meters`, `wWig`, `wRad`, `radiationView`, `WIG_OK`,
  `RAD_OK`, `bowStart`, `bowMove`, `bowRelease`, `bowCancel`, `orbitOfShell`, `keplerDragToPoint`, `keplerDragTo`, `gasReadout`, `gasTableOn`,
  `slapAlong` — boot destructures them at the seats (the loop, the facade, the stage gestures, the tail read them).

## 8 · The light check

This tree on 9083/5553; the base export (`1d5b060`) on 9087/5557, run ONCE for every red the tree read. 2026-10-10 09:17–10:10 CDT; R3b's suites
ran between mine (waited out); the rig drew few frames (load 3–12 while R3b ran).

| gate | this tree | the base (`1d5b060`), where the tree was red | reading |
|---|---|---|---|
| `bash test.sh node` | exit 0 (`rack-deps` 54 PASS with the new law, `wiring`, `access`, `first-run`, `ink`, `project-formats`, `auto-scale`, `pwa` 356 files) | — | GREEN |
| `node tests/pwa.test.mjs --write` | after the edit (two module rows, the new rack.js digest) | — | GREEN |
| `node tools/rack-deps.mjs --classes` | §5: readouts 7, kepler 4, 0 bare writes, G-A clean; every other row the base's | — | the hinge holds |
| `lw-facade` | **1/1** — 176 members, names, kinds and order (56 value · 48 get · 72 method) | — | GREEN |
| `routed-knob` | **4/4** (K0–K3) | — | GREEN |
| `camera-shift` | **GREEN**, 11 PASS (the pointer maths `camera.pointer = { ray, unproject }` now set by kepler.js) | — | GREEN |
| `molecule-demos` | **GREEN**, 5 PASS (WATER · BENZENE · N₂ · H₂ σu · HELIUM — HELIUM opens ATOMS) | — | GREEN |
| `serialize-bytes` | **11/11 full + 11/11 edit sha-identical to the live base export** (this run: the base did NOT die), and to R1's recorded `sb-base.json` and R3a's `sb-tree.json`; 0 page errors either side | 11 readings, every sha equal | GREEN |
| `settings-probe` | **0 of 6 scenes red — all six reached** (boot 716 B, WAVE DANCER 752, WATER · BENZENE · N₂ · NEW 736; reloads byte-identical) | — | GREEN (R1's blob sizes exactly) |
| `take-in-bugs` | RED at scene 1 THE ONE CLOCK: "app time advances" (`t` 0 → 0 after Space) | **RED at scene 1, identically** (`t` 0 → 0) | the rig (play does not advance) |
| `take-in-bugs` scenes 2–4 alone (`.tmp/tib-234.mjs`: the suite minus scene 1) | **3/3**: CALCULUS's ⧉ copies the prose figure (12 lines, 4 laws); STATUS TAGS tick with METERS closed (20 ms); WIGNER says "hydrogenic register only" under MOLECULES | — | GREEN — the three that read my cards |
| `frame-occlusion` | RED at `:41:68` (`chipGap`) | **RED at `:41:68`, identically** | the rig (the brief's named `chipGap`) |
| `hit-probe-set` | the control scene `0 pressed, 0 reached` (grid on `html`), then "Render did not settle: animation frames stopped" | **identical** | the rig; the 0-reached count unreadable both sides |
| `current` | 9 PASS, then RED in the modulation AUDIO face's compact geometry (`:137`, the kit's `.m2dev.audio` layout after `await w(180)`) | 9 PASS (the same nine), then RED in the same block (`:138`, its `ott` fields) | the rig (a timed wait in the kit's modulation card; nothing of mine is in it) |
| the boot suite's readout / Kepler blocks alone (chunk runner: `129-316` B2–B18, `404-479` B24–B27, `545-618` B31–B37, `739-757` B44, `886-910` B50–B51, `940-1002` B54, `1086-1184` B57; B1 ×2 + B43 in the preamble) | **44/48**: B1 ×2, B43, B2 ×2, **B3 METERS**, B4 ×2, B5, B6 ×2, **B7 SHADOW**, B8 ×2, B9 IDLE, B10, B11 ×4, B12, **B14 ORBIT · LADDER · VORTEX**, B15 ×2, **B16 folding**, **B17 CALCULUS rows**, **B18 PARTICLES**, **B24 IMPULSE**, **B25 KEPLER**, B26, **B27 THE BOW**, B31–B33, **B34 THE GAS**, B35, **B36 CALCULUS**, B37, **B44 close/reopen SHADOW**, **B50 THE KEPLER HANDLE**, **B57 WIGNER + RADIATION** GREEN; **RED B9 ×2** (play advances / capping the field clock), **B51**, **B54** | the base, `199-213` + `886-910` + `940-1002`: **the same four RED** (B9 ×2; B51 `st2.z − st.z` 0.046 < 0.05; B54 `integral` **0.9105701012731331**), B50 GREEN | the rig, law for law |
| B50–B54 again on this tree (one re-read, the first B51 had died on "did not settle") | B50 GREEN; B51 RED with the base's numbers (`cap` 0.9998855691790473, `modes` 256, `st` identical; `st2.z − st.z` 0.018: fewer frames); B54 RED with **`integral` 0.9105701012731331 — the base's to the last digit**, every card field (`inkLad` 2475, `inkRad` 2202, the Ne/Na readouts) equal | — | the rig (the GPU integral and a frame-paced play) |
| the gas readout through kepler.js' `enterBox` (`.tmp/gasro.mjs`, one reading) | `100.0% held · axial` at once, then the worker-painted `100.0% held · ⟨z⟩ -1.89 · σ_z 1.96` 6.3 s later (the loop's `gasReadout` every 6th CPU tick at 2–3 frames a second); 0 page errors | — | the K5w road works through the seat const |

THE LOCK is not this row's: `launchPacket` / `enterBox` / `coherentBounce` / `gasReadout` / `gasTableOn` are byte-identical (the only kepler edits
are `app.sh.keyState` reads and one registration), and the loop reads the same names as closure slots (seat consts); nothing `field.js` reads changed
shape. Not run. B149 (the law red), B6/B69 (flakes), `latex-copy`, `keyboard-window`: not in this row's set, not run.

## 9 · Brief candidates (PAIR 3 · R5 · the integrator)

1. **A module with several seats** (R2c's WAVE and SETTINGS cards have two spans each; R3b's rack-wiring maybe): declare each later seat as a
   root-level `function create<Y>()` the root returns, and the tool measures it (eager at its own piece, its declarations the module's own). A closure
   by another name is read as a deferred callback and its fills as never made — the base tool refuses such a tree.
2. **R3b's tool edits may touch the same `measureFile` / `classes` lines** (if it solved rack-wiring's two halves another way): keep one rule;
   mine is 17 lines with its law.
3. **Three dead imports in rack.js** (`keplerOrbits`, `createGas`, `wellPacket`) — delete at the merge (they were kept only so the import hunks are
   not adjacent to R3b's).
4. **`solveCard` and `markBatchBegin`** are destructured at the controller's seat and read by no boot code any more — drop them from the 68 when that
   line is next touched.
5. **`wait-gpu.mjs` counts a process whose args MENTION "marionette"**, so two builders polling at once can keep each other "busy" with no browser up
   (seen for ten minutes this run). `.tmp/rigfree.mjs` (argv0 from `/proc`) is the shape a `tools/` fix could take.
6. **The readout cards are all in one module now**: R2d's MOLECULES (seated between my seats 1 and 2) reads `wSh wOrb wVor wSlice` (destructurable —
   readouts' root registers `wOrb wVor wSlice`; `wSh` has no registration yet: add `app.w.wSh = wSh;` to readouts' root registration line when R2d
   needs it, or read it at use).

## 10 · Merge notes (for the integrator)

- **The four seat lines** (this tree): `rack.js:1029` `// SHADOW` + `:1030–1031` seat 1 (two lines); `:1255` `// CALCULUS — …` + `:1256` seat 2; `:1505–1506`
  `// ATOMS — …` (two comment lines) + `:1507` seat 3, then the kept tail; `:1784` `/* ── THE BOW: … ── */` + `:1785–1786` seat 4. **What `boot()`
  destructures:** seat 1 — 12 handles + the two later seats; seat 2 — 6; seat 3 — 8; seat 4 — 17 (§2's table). The kept tail reads `wSpec wSh wOrb wVor
  wSlice wAtoms wWig wRad wCalc wMet wLad` from these.
- **Against R3b:** my rack.js hunks are the imports `:35–41` (→ 1 line), `:55–56`, `:59–62`, `:64`, `:69` (each separated by an unchanged line from
  every import line R3b's spans use: `:45–46` keys, `:49` period, `:67` mdText, `:43` timeline, `:82–83` rack/menubar), and the four span → seat
  replacements, none inside §12 (`:1675–1904`), §19a/§19b (`:2300–3014`) or §20–§23. `/* ── THE BOW` `:1935` stays as my seat header; the badges
  (`:1905–1934`) between R3b's §12 and my seat are untouched. `app.sh.keyState` is read (never written) by kepler.js at use — R3b registers it.
- `tools/rack-deps.mjs` (`measureFile` 13 lines, `classes` 4) and `tests/rack-deps.test.mjs` (+1 law, before the unplanned-file law): see candidate 2.
  `PLANNED_CUT` unchanged (the four anchors still match the seat headers).
- `lab/sw.js` carries the new precache (two module rows, the new rack.js digest): re-run `node tests/pwa.test.mjs --write` after the merge.
- REPORT.md: wave 219 appends at the end under the 0.5.2 heading (R3b's 220 after it).

## 11 · The drafted CLAUDE.md sentence (NOT applied)

> THE READOUTS AND KEPLER (0.5.2 R2b): SHADOW · ORBIT · VORTEX · PLANE, CALCULUS · METERS · LADDER and ATOMS · WIGNER · RADIATION are
> `lab/windows/readouts.js` `createReadouts(app)` at THREE seats — the root builds the first and returns `createCalcMetersLadder()` /
> `createAtomsWignerRadiation()`, which `boot()` calls where CALCULUS and ATOMS stood (READERS, the track loop and `hydroReader` stay in `boot()`) — and
> THE BOW + KEPLER AS A CONTROL SURFACE is `lab/windows/kepler.js` `createKeplerSurface(app)`; a module with several seats declares each later one as
> a root-level `function create<Y>()`, which `tools/rack-deps.mjs` measures as eager at its own piece.

## 12 · What Josh will see

**Nothing.** The work: `serialize-bytes` 11/11 full and 11/11 edit sha-identical to the live base export — a project, a link and an undo row
are the same bytes. The browser's memory: `settings-probe` judged no scene red, all six reached, R1's blob sizes, byte-identical reloads. The facade:
`lw-facade` 1/1 (176 members, kinds, order). The windows: the same `device()` / `appendChild` calls in the same order — three seats exactly where the
three spans stood, THE BOW's where it stood — so the rack's DOM order, `captureLayout` and `closed[]` are the base's (the probe's blobs and the
project bytes say so). The cards' own laws: B3 METERS, B7 SHADOW, B14 ORBIT / LADDER / VORTEX, B17–B18, B24–B27 (the impulse, KEPLER, THE BOW), B34
THE GAS, B36 CALCULUS, B44, B50 THE KEPLER HANDLE, B57 WIGNER + RADIATION, take-in-bugs 2–4 GREEN; B54's ATOMS fields equal to the base's. The code:
424 of 433 lines byte-identical; the other 9 the same expressions read through a slot, and one registration. The reds are the rig's, reproduced on
the base reading for reading (B54's GPU integral to sixteen digits).
