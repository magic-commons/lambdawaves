# R2a-BUILD · STATE + SPECTRUM (0.5.2 "Rack Dissolution"; Opus 5.5 builder; PAIR 1 with R3a)

Base `ff2b3e6` (`yan-c` = R0 + R1 + the `app.ctl` fill). Worktree `.claude/worktrees/agent-af9d75d8973fa3306`, branch
`worktree-agent-af9d75d8973fa3306`. Ports 9063/5533 (this tree) and 9067/5537 (the base, `git archive ff2b3e6` into `.tmp/base`, served
with the default certificate directory — the worktree has no `.certs`). The rig: one RTX 3070, **`nvidia-smi` answers "Failed to initialize
NVML: Driver/library version mismatch"** (the pending driver update: the userspace libraries are 595.99, the loaded kernel module is older)
— every "play does not advance" / "animation frames stopped" red below is that, read on the base as well. Josh's desktop Firefox (pid
2002078) was up and never touched; R3a ran beside me (its geckodriver on 5543); the other gate servers were not mine.

## 1 · The ledger

| step | commit | what |
|---|---|---|
| 1 | `f1f292b` | THE MOVE: STATE (+ its CLEAR) → `lab/windows/state.js`, SPECTRUM → `lab/windows/spectrum.js`; the seats; the fills; the imports; the tool's G-A clause + two `rack-deps.test` §5 laws; `pwa --write` |
| — | `6eee552` | `R2a-HANDOFF.md` after step 1 |
| 2 | (this) | the light check, this file, REPORT wave 217, the handoff |

### What moved, and what the brief's words needed

- **STATE** is the cut's `state` piece: the N1 comment + `function clearRegister()` (base `:1167–1171`) and the card `const wState = device(`
  … the block's `}` (base `:1173–1335`) — 168 lines. `clearRegister` travels with it because the cut gives it to STATE and `app.w` holds its
  slot (the menubar reads it). The line between them, `// STATE — preparation. Everything here changes c.`, stays in `rack.js` as the seat's
  header (the cut's anchor moved to it).
- **SPECTRUM** is base `:1338–1582` (245 lines): `const wSpec = device(` through `fillValence`'s closing brace. `// SPECTRUM` stays as its
  seat's header; the five appends (`:1584–1585`) and the ABOUT-face comment after them stay in `boot()` untouched.
- **Verbatim, proved** (`.tmp/r2a/verbatim.mjs`, line by line against `ff2b3e6`): of the 413 moved lines **393 are byte-identical**; the other
  **20 differ only by a forward read** (token-exact, rewritten at the tool's own reference positions by `.tmp/r2a/move.mjs`, which printed all
  33 edits): STATE 6 lines — `app.w.shadowView`, `app.w.normalizeNow`, `app.sh.save`, `app.sh.restore`, `app.sh.copyJSON`, `app.sh.copyLink`;
  SPECTRUM 14 lines — `app.w.{enterBox, wAtoms, gas, launchPacket, gasSigma, coherentBounce, wOrb, wVor, wSlice, wLad, wCalc, shadowView,
  atomsView}`, `app.sh.keyState`, `app.sh.layout`. Every one sits inside a callback (the walker: 0 eager). Indentation kept; comments travel.
- **The hand-over** (one statement each, at the top): STATE `const { ui, device, reg, hNote, clock, mat, sturm } = app, { schedule } =
  app.loop, { rack } = app.host, { modHand, ROT_LIMIT, setRotationRate, touchState, loadPreset } = app.ctl;` — SPECTRUM `const { ui, device,
  reg, hNote, clock, energyOf, sturm, labelExpect } = app, { schedule, page } = app.loop, { rack } = app.host, { wState } = app.w;` and
  `const { rotRate, busy, busySync, warmArm, touchState, setReference, api } = app.ctl;`.

### The one judgement call: the controller's names are destructured, not read at use

The brief says "a controller name is read as `app.ctl.x` at use … unless the value is a const object". Measured, that kills the row: the tool
counts every `app.<ns>.x` chain in a module as a lazy crossing, so SPECTRUM's seven controller names read at use plus `app.w.wState` would take
it from **24 to 32** (STATE 8 → 13). But all seven are BACKWARD by the plan's own class (boot destructures them at the controller's seat,
`:334`, long before SPECTRUM's), every one is a `const` the controller never reassigns (functions and objects alike — the "const object" case),
and `createController` fills `app.ctl` eagerly before its seat returns. So the modules destructure them once, as PLAN §1.1 says a module does
("`const { reg, clock, mat } = app`, free afterwards"), and they stay backward: **SPECTRUM 24, STATE 8, the same names as before the move**.
G-A had refused that only because it looked for an eager fill in `rack.js` alone; it now also accepts an eager root-level fill by a module file
**seated earlier** (`tools/rack-deps.mjs`, one clause + its comment; `rack-deps.test` §5: a later module destructuring `app.ctl.gov` is clean
and backward; a module destructuring its OWN later fill is still a stray; the old `app.loop.page` stray law unchanged). `wState` rides the same
clause (createStateCard fills `app.w.wState` before SPECTRUM's seat). No context was widened: not one key added, none read that was not there.
If the integrator prefers the literal reading, the row does not fit the hinge — that is the STOP the brief names, and this is why I did not take it.

## 2 · `lab/rack.js` (4,664 → 4,261, −403), exact

| where (this tree) | what |
|---|---|
| `:22` | `stateOf` leaves the hydrogen import |
| `:34` | `import { createSpectrumCard } from './windows/spectrum.js';` takes `createSpectrum`'s line |
| base `:63` OUT | `import { ATOMS, configOf } from './atoms.js';` (both only SPECTRUM's) |
| `:64` | `AXIS_TO_Z` leaves the kick import |
| `:66` | `import { createStateCard } from './windows/state.js';` takes `createRegisterSturmian`'s line |
| `:67` | `moleculeLatex` leaves the latex-state import (its comment kept verbatim) |
| `:823` | `app.host.rack = rack;` — right after `const rack = dom.rack;` (both cards destructure it) |
| `:1167–1168` | **STATE's seat**: the kept `// STATE — preparation…` and `const { clearRegister, wState } = createStateCard(app);` |
| `:1170–1172` | **SPECTRUM's seat**: the kept `// SPECTRUM` and `const { wSpec, spectrum, toggleFullscreen, normalizeNow, copyLatex, switchHamiltonian, setSturmian, applySturmian, paintSturmRo, sturmEigen, occupiedEigen, periodEnergies, selectEigen, setElement, fillValence } = createSpectrumCard(app);` (two lines) |
| `:1173–1174` | the five appends, untouched |
| `:1263` | `app.w.wOrb = wOrb; app.w.wVor = wVor; app.w.wSlice = wSlice;` (after `const wSlice`) |
| `:1512` | `app.w.wCalc = wCalc; app.w.wLad = wLad;` (after `const wLad`) |
| `:1779` | `app.w.wAtoms = wAtoms; app.w.atomsView = atomsView;` (after `createAtoms(…)`) |
| `:2339` | `app.w.gas = gas; app.w.gasSigma = gasSigma; app.w.launchPacket = launchPacket; app.w.enterBox = enterBox; app.w.coherentBounce = coherentBounce;` (after `coherentBounce`) |
| `:2608` | `app.sh.layout = layout;` (after the `layout` literal) |
| `:3148` | `app.sh.keyState = keyState;` |
| `:4158` | `app.sh.save = save; app.sh.restore = restore; app.sh.copyJSON = copyJSON; app.sh.copyLink = copyLink;` — the head of `/* ── go ──` |
| OUT | base `:1167–1171`, `:1173–1335`, `:1338–1582` (413 lines) |

−413 moved (R1's three SPECTRUM fills among them) −1 import line +3 seat lines +8 fill lines (`app.host.rack` and the seven below) = **−403**. Where each fill sits, and why: every slot is filled right after its owner's declaration (R0's rule), several per line
where one card's declarations cluster, each inside the piece its owner's row will move (readouts R2b ×3, kepler R2b ×1, rack-wiring R3b ×2) —
so the row that moves the owner carries the fill and it becomes that module's registration. The four `app.sh` verbs are R3a's (§24/§25,
moving NOW): a fill beside their declarations would collide with R3a's span, so it sits at the head of `go` (boot-kept, after both of R3a's
seats), where it holds in this tree (hoisted functions) AND in the merged one (R3a's destructured consts, initialised by then). The first
place I put it — after `window.__LW = LW;` — is inside the facade piece and took the facade to 26 (RED); moved.

## 3 · The modules, exact

**`lab/windows/state.js`** (182 lines): 1–3 header · 4–9 six import lines · 10 `export function createStateCard(app) {` · 11 the hand-over ·
12–16 the N1 comment + `clearRegister` · 17 `const wState = device(…)` · **18 `app.w.wState = wState;`** · 19–180 the card · 181
`return { clearRegister, wState };` · 182 `}`. Shape: header 3 + signature 1 + return 1 + brace 1 = **6 ≤ 12**; imports 6; hand-over 1;
registration 1 → +14 over the 168 moved.

**`lab/windows/spectrum.js`** (264 lines): 1–3 header · 4–12 nine import lines · 13 signature · 14–15 the hand-over · 16–260 the card (with
R1's three fills `app.w.wSpec`, `app.w.spectrum`, `app.w.normalizeNow` where they stood, right after their declarations) · **261
`app.w.switchHamiltonian = …; app.w.applySturmian = …; app.w.setElement = …; app.w.fillValence = …;`** · 262–263 the return (15 names) · 264
`}`. Shape: header 3 + signature 1 + return 2 + brace 1 = **7 ≤ 12**; imports 9; hand-over 2; registration 1 → +19 over the 245 moved.

## 4 · Lines

`lab/*.js` + `lab/shell/` + `lab/windows/` **27,754 → 27,799 (+45)**, exactly: state.js 182 − 168 moved = **+14** · spectrum.js 264 − 245
moved = **+19** · rack.js 4,261 − (4,664 − 413) = **+10** (3 seat lines + 8 fills − 1 import line) · sw.js **+2** (two precache rows). Cap 27,943: **144 left** after this row. Subtracted on the way: the readouts' six fills folded to three lines, STATE's
hand-over to one line, both headers to three lines (−6 against the first cut's +51).

## 5 · The classes table, before and after (`node tools/rack-deps.mjs --classes`)

**Before** (`ff2b3e6`, rack.js `78281bac6006`, 38 pieces): `state 170 | 13 | 6 | 0 | 2 | **8** | 0 | ok` · `spectrum 253 | 18 | 15 | 0 | 9 |
**24** | 0 | ok`. **After** (rack.js `6e7a71c0a833`; module files measured (3): controller, `lab/windows/spectrum.js` → spectrum (seated
`rack.js:1170`, handed 19), `lab/windows/state.js` → state (seated `:1167`, handed 14)):

| module | lines | backward | forward | shared (bare) | app.state (another's) | **fwd + shared** | bare writes | hinge |
|---|---|---|---|---|---|---|---|---|
| boot (stays) | 285 | 0 | 64 | 0 (+1) | 11 | **75** | 0 | exempt |
| state | 185 | 13 | 6 | 0 | 2 | **8** | 0 | ok |
| spectrum | 274 | 18 | 15 | 0 | 9 | **24** | 0 | ok |
| readouts | 144 | 14 | 4 | 0 | 3 (+1) | **7** | 0 | ok |
| kepler | 295 | 15 | 1 | 0 | 3 (+7) | **4** | 0 | ok |
| rack-wiring | 329 | 39 | 0 | 0 | 4 | **4** | 0 | ok |
| facade | 255 | 121 | 1 | 0 | 21 | **22** | 0 | ok |
| (every other row) | unchanged | | | | | | | ok |

- **state** backward ROT_LIMIT, clock, device, hNote, loadPreset, mat, modHand, rack, reg, schedule, setRotationRate, sturm, touchState ·
  forward `sh.copyJSON, sh.copyLink, sh.restore, sh.save, w.normalizeNow, w.shadowView` · app.state applyVisuals, refSnapshot (writes both).
- **spectrum** backward api, busy, busySync, clock, device, energyOf, hNote, labelExpect, page, rack, reg, rotRate, schedule, setReference,
  sturm, touchState, wState, warmArm · forward `sh.keyState, sh.layout, w.atomsView, w.coherentBounce, w.enterBox, w.gas, w.gasSigma,
  w.launchPacket, w.shadowView, w.wAtoms, w.wCalc, w.wLad, w.wOrb, w.wSlice, w.wVor` · app.state chem, gasAxial, gasWidth, lastNmax,
  pendingRef, refSnapshot, space, warmIdle, warmTimer.
- **The same names, class for class, as before the move** — only the forward ones are now spelled through their slots. THE HINGE (G-G)
  HOLDS: 0 bare writes; the largest moving module SPECTRUM at 24. G-A clean (`app` at `:159`, 30 keys, the seven namespaces unchanged).
- `boot` 56 → 64 forward: the four `app.sh` fills at `go` read R3a's verbs before their pieces (exempt). readouts/kepler/rack-wiring change
  line counts only (their fills are registrations). The section summary: forward uses 124 → 110, **eager let/const 0** both trees; imports
  never referenced: none.
- `tests/rack-deps.test.mjs` GREEN (§5 + two laws; "the real tree: 3 module files measured … the table keeps its 23 rows").

## 6 · The import fan-out

`rack.js` **75 → 74 import lines**: 1 line out (`atoms.js`), 2 lines re-pointed (`spectrum.js` → `windows/spectrum.js`, `sturmianreg.js` →
`windows/state.js`), 3 trimmed (`stateOf`, `AXIS_TO_Z`, `moleculeLatex`). **7 names left rack.js** (only the two cards used them):
`createSpectrum`, `ATOMS`, `configOf`, `createRegisterSturmian`, `stateOf`, `AXIS_TO_Z`, `moleculeLatex`. **Imported by both** (rack.js still
uses them): `el knob sw seg trig readout group mathPlain` (kit), `BASIS`, `PRESETS`, `momentumZ`, `rotorOnCopy`, `getHamiltonian
setHamiltonian HAMILTONIANS setZ getZ`, `MOLECULE_BY_ID`, `stateLatex`. **`TIER` from `'../rack.js'`** in both modules — R1's cycle, read only
inside the create functions (R1 candidate 3 stands). state.js 6 lines / 13 names; spectrum.js 9 lines / 22 names. `wiring.test` walks them
(node gate). Nothing under `lab/mir/**`.

## 7 · The `app.w` (and `app.host` / `app.sh`) fills

- **Registrations in the modules:** `app.w.wState` (state.js — persist, links, history, keys, kepler, molecules and SPECTRUM read it);
  `app.w.wSpec`, `app.w.spectrum`, `app.w.normalizeNow` (moved with their declarations from R1's boot fills — the controller reads them);
  `app.w.switchHamiltonian`, `app.w.applySturmian`, `app.w.setElement`, `app.w.fillValence` (R3a's persist reads all four; in this tree alone
  they are read through boot's destructure, so they are there for the merged tree — see §10).
- **Boot fills (owner still in boot):** `app.host.rack`; `app.w.wOrb/wVor/wSlice/wCalc/wLad/wAtoms/atomsView` (readouts, R2b);
  `app.w.gas/gasSigma/launchPacket/enterBox/coherentBounce` (kepler, R2b); `app.sh.layout`, `app.sh.keyState` (rack-wiring, R3b);
  `app.sh.save/restore/copyJSON/copyLink` (persist + links, R3a — at the head of `go`).
- Not filled (no reader outside boot yet): `clearRegister`, `toggleFullscreen`, `copyLatex`, `setSturmian`, `paintSturmRo`, `sturmEigen`,
  `occupiedEigen`, `periodEnergies`, `selectEigen` — boot destructures them at the seat.

## 8 · The light check (this tree 9063/5533; base export 9067/5537; one browser at a time)

| gate | this tree | the base (`ff2b3e6`), where the tree was red | reading |
|---|---|---|---|
| `bash test.sh node` | exit 0 (`rack-deps` with the two new laws; `access` 11, `first-run` 12, `ink` 17, `project-formats` 8, `auto-scale`, `wiring`) | — | GREEN |
| `node tests/pwa.test.mjs --write` | after the edit; 350 files | — | GREEN |
| `lw-facade` | **1/1** — 176 members, names, kinds and order (56 · 48 · 72) | — | GREEN |
| `register` | **17/17** | — | GREEN |
| `orbitals` | 23/24 — L9 "PLAY turns the register": `tAfter700ms 0`, `dispatches 0` | **23/24, L9 identically** (`t 0`, 0 dispatches) | the rig (play does not advance) |
| `offer` | 7/16 — scene 8 `s8.tPlayed > 0` | **7/16, scene 8 identically** | the rig |
| `history` | 28 PASS, then `:331` THE ONE CLOCK (`routed.playing/modulated`) | 20 PASS, then `:248` (the held-route scene, `routed.modulated`) — the same class, earlier | the rig (the modulation under THE play) |
| `frame-occlusion` | red at `:41:68` (`chipGap`) | **red at `:41:68` identically** | the rig (the brief's named `chipGap`) |
| `hit-probe-set` | "Render did not settle: animation frames stopped" before the first scene | the control scene OK (3 pressed, 3 reached — the bare stage), then "Render did not settle" | the rig; 0 counts unreadable both sides |
| `settings-probe` | **0 scenes judged red**; boot 716 B, WAVE DANCER 752, WATER 736, BENZENE 736, N₂ 736 — reloads byte-identical; the 6th (NEW) unreached: "Failed to decode response from marionette" | 2 GREEN (716, 752), then WATER "Render did not settle" | the rig; R1's blob sizes exactly |
| `serialize-bytes` tree vs base | **11/11 full + 11/11 edit sha-identical**, 0 page errors either side (the four demos, NEW, six history rows incl. `hamiltonian qho` through SPECTRUM's `switchHamiltonian`) | — | GREEN |
| the boot suite's STATE/SPECTRUM blocks alone (chunk runner: `129-248` B2–B12 incl. B6/B8/B11/B12, `404-455` IMPULSE/KEPLER/HAMILTONIAN, `545-594` BOX/Z/GAS, `758-786` B45 RATE · A/B, `940-1085` B54 ATOM + B56 STURMIAN, `1399-1486` B61; B1 + B43 in the preamble) | **33/35**: B1 ×2, B43, B2–B8, B9 ×1, B10, B11 ×4, B12, B24–B26, B31–B34, B45, B54–B56, B61 GREEN; **B9 ×2 RED** ("play advances logical time at the RATE": `fps 0`, `dt 0.0011`; "capping the FIELD clock": `dt 1.27` of 4.0) | **33/35, the same verdicts law for law** (B9 ×2: `fps 0`, `dt 0.0005`; `dt 1.20` of 4.1) | the rig (play does not advance); every STATE/SPECTRUM law GREEN |

The boot suite has no law named for the state grid's paint gesture: SPECTRUM's state grid is `lab/spectrum.js` (not moved), and its touch road
is B11's lane-button / mute-tap laws; the ORBITAL and STATES ladders' paint laws are `register` (17/17) and `orbitals` (L1–L8, L10–L24 green).

THE LOCK is not this row's: nothing `field.js` or the loop reads changed shape (the loop reads the same closure slots — the SPECTRUM names are
destructured at the seat; `paintSturmRo` is called by the loop only inside a frame). Not run.

## 9 · Brief candidates (R2b · R3b · the integrator)

1. **"Read `app.ctl.x` at use" costs a crossing per name in the tool's count** (every `app.<ns>.x` chain is lazy). For a module seated after
   §2 the controller's names are backward and const: destructure them once (G-A now allows it — an earlier module file's eager fill counts).
   Read at use only in §1 SETTINGS (seated before the controller). R2b's readouts (5 ctl names) and kepler (4) stay ≤ 25 either way; R3b's
   notebook (8 ctl + 21) would not.
2. **R2b carries six of my fills**: `app.w.wOrb/wVor/wSlice` (readouts span 1), `app.w.wCalc/wLad` (span 2), `app.w.wAtoms/atomsView` (span 3),
   `app.w.gas/gasSigma/launchPacket/enterBox/coherentBounce` (kepler) — each line moves WITH its span and becomes that module's registration.
   R3b carries `app.sh.layout` and `app.sh.keyState`. Nobody else needs to touch my modules for them.
3. **Slots my modules do not fill yet** (their readers are all in boot): `clearRegister` (notebook, R3b), `toggleFullscreen` (keys, notebook),
   `copyLatex` (notebook), `occupiedEigen`/`periodEnergies` (transport R3b, film R2c), `setSturmian`/`selectEigen`/`sturmEigen` (facade R5),
   `paintSturmRo` (the loop, stays). The row that moves such a reader adds the one `app.w.x = x;` line to the module's registration line.
4. **A fill must sit in a piece that is not a moving module's** or it is counted against that module (the facade went 22 → 26 when the four
   `app.sh` fills sat after `window.__LW = LW;`). `go` is boot-kept.
5. **The rig: `nvidia-smi` reports a driver/library mismatch.** Until Josh reboots, every suite that plays or settles reads red on the base too;
   the R-V estate needs the reboot first.

## 10 · Merge notes (for the integrator)

- **The seat lines:** `lab/rack.js:1167–1168` (`// STATE — preparation. Everything here changes c.` kept; `const { clearRegister, wState } =
  createStateCard(app);`) and `:1170–1172` (`// SPECTRUM` kept; the 15-name destructure, two lines). **What `boot()` destructures:** STATE 2
  (`clearRegister, wState`), SPECTRUM 15 (`wSpec, spectrum, toggleFullscreen, normalizeNow, copyLatex, switchHamiltonian, setSturmian,
  applySturmian, paintSturmRo, sturmEigen, occupiedEigen, periodEnergies, selectEigen, setElement, fillValence` — the `app.w` literal's order).
  Thirteen of them were hoisted function declarations; they are seat consts now (R0's U1 const transform already proved no boot code calls one
  before its line; the walker: 0 eager forward).
- **Against R3a:** my edits outside the windows block are the imports `:22/34/63–68` (R3a's import lines are `:9/71/86`; two unchanged lines
  separate the nearest pair), `app.host.rack` after `:823` (R3a's brief says it may write the SAME line at the SAME seat — identical text merges
  clean; a different line there would conflict: keep one), the fills in R2b/R3b pieces, and one line at the head of `go`. Nothing in §1, §24,
  §25. **In the merged tree** persist reads `app.w.wState`, `app.w.spectrum`, `app.w.switchHamiltonian/applySturmian/setElement/fillValence`
  — all registered by my modules; if R3a also fills them at its seat, both are harmless (keep either). My `app.sh.save/restore/copyJSON/copyLink`
  line at `go` is redundant if R3a's modules register those four — delete mine then (one line), or keep it: it reads R3a's destructured consts.
- `tools/rack-deps.mjs`: the `state` anchor is now `// STATE — preparation` (the seat); `spectrum` keeps `// SPECTRUM`; the G-A clause at the
  destructure check. R3a's PLANNED_CUT rows (settings, persist, links, history) are not adjacent.
- `lab/sw.js` carries the new precache (two module rows, the new rack.js digest): re-run `node tests/pwa.test.mjs --write` after the merge.

## 11 · The drafted CLAUDE.md sentence (NOT applied)

> THE WINDOWS (0.5.2 R2a): STATE (with its CLEAR) is `lab/windows/state.js` `createStateCard(app)` and SPECTRUM `lab/windows/spectrum.js`
> `createSpectrumCard(app)`, moved verbatim and created at their seats under the kept `// STATE` / `// SPECTRUM` lines (the five appends stay in
> `boot()`); each destructures §0's consts, the loop's, the rack and the controller's names once (backward — `app.ctl` is filled before its seat
> returns), reads a name boot makes later through its slot inside a callback (`app.w.gas`, `app.sh.layout` …, filled right after its owner's
> declaration), and registers on `app.w` what a moved reader needs (`wState`, `wSpec`, `spectrum`, `normalizeNow`, the four persist reads).

## 12 · What Josh will see

**Nothing.** The work: `serialize-bytes` 11/11 full and 11/11 edit sha-identical to `ff2b3e6` — the four demos, NEW and six hand edits
(one through SPECTRUM's Hamiltonian). The browser's memory: `settings-probe` judged no scene red, the five it reached with R1's exact blobs and
byte-identical reloads. The facade: `lw-facade` 1/1 (176 members, kinds, order). The windows: the same `device()` / `appendChild` calls in
the same order at the same seats (the cards are built where they were; `captureLayout` and `closed` read the same `.dev` order — the probe's
blobs say so). The code: 393 of 413 lines byte-identical, the 20 others the same expressions read through a slot. The rig's reds are the
base's, reading for reading.
