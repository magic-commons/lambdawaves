# R2c-BUILD · THE MATERIAL + THE SETTINGS CARD + THE FILM ROAD (0.5.2 "Rack Dissolution"; PAIR 3 beside R2d)

Base `8796d15` (`yan-c`; BRIEF-R2c/R2d, generated from the PAIR 2 tip `03200df`). The builder's worktree `.claude/worktrees/agent-aa99c668f22d59ca3`, branch
`worktree-agent-aa99c668f22d59ca3` (another account's agent), ran THE MOVE and the whole light check 2026-10-10 10:39–11:28 CDT and was paused on the usage alarm at
≈ 11:30 (tip `9b13d04`). This file, REPORT wave 221 and the last commit are the documentation pass: worktree `.claude/worktrees/agent-a4c23cd57faad2656`, branch
`worktree-agent-a4c23cd57faad2656`, reset to `9b13d04`, 12:01 CDT. That pass ran no browser and no server (the GPU is shared and it had nothing to measure); what it
re-measured with node alone is marked **(re-run)** below, and every other number is the builder's HANDOFF or its logs (`.tmp/r2c/logs/`, git-ignored).
Ports 9103/5573 (the tree) and 9107/5577 (the base: `git archive 8796d15` into `.tmp/base`, `LW_CERTS=<worktree>/.certs`). One browser at a time: every suite went
through `.tmp/r2c/run.sh`, which waits on `research/release-0.5.2/r2b-measure/rigfree.mjs` (argv0 from `/proc`, polled every 30 s; R2d ran beside). Both servers were
stopped by pid and no browser was left.

## 1 · The ledger

| step | commit | what |
|---|---|---|
| 1 | `ddfbfb9` | THE MOVE: the 1100 block dissolves — WAVE · CLIP · PALETTE · CAMERA → `lab/windows/material.js` (two seats), the SETTINGS card → `lab/windows/settings-card.js` (two seats), THE FILM road → `lab/windows/film.js` (one seat); `filmHold` to boot level as `app.loop.hold`; `tools/rack-deps.mjs` (the file string, six `PLANNED_CUT` rows, one by-value clause) + `rack-deps.test` +1 law; `pwa --write` |
| — | `bb480d1` | `R2c-HANDOFF.md` after step 1 |
| — | `9b13d04` | `R2c-HANDOFF.md` (WIP, usage pause): the move and the light check done |
| 2 | (this) | the light check; the classes table; this file; REPORT wave 221 |

The move was done by `.tmp/r2c/move.mjs` over the walker's token positions (`lex` / `pairBrackets` / `scopeWalk`; no sed; every edit printed), with `scan.mjs` and
`block.mjs` (free names per piece, the block's own names and which piece reads each), `freenames.mjs` (a lost import or binding, against the base's free names) and
`verbatim.mjs` (the proof in §3). They sit in the builder's git-ignored `.tmp/r2c/` (copied to this worktree); not committed — the row's rule is lab/tools/tests and
this file only; copy `verbatim.mjs` and `move.mjs` to `research/release-0.5.2/r2c-measure/` if they should travel.

### The shape: five seats, three modules (the brief's "say which")

The block's spans interleave (WAVE's head · SETTINGS · WAVE's DRAW … CAMERA · THE FILM · SETTINGS' FIELD QUALITY), so the default holds — **every span keeps its seat**
(THE MULTI-SEAT SHAPE, R2b's): the module's root builds the first span and RETURNS the later seat as a root-level `function create<Y>() { … }` declaration.
- `createMaterial(app)`: the root makes the four `device()`s (observer, palette, camera, clip, in the base's order) and WAVE's head (SPACE · OBSERVABLE · the material knobs),
  and returns `{ wObs, wPal, wCam, wClip, createDrawClipPaletteCamera }`. `createDrawClipPaletteCamera()` holds DRAW, CLIP, PALETTE · INVERT and CAMERA and returns nothing.
- `createSettingsCard(app)`: the root makes `ui.set` and INTERFACE · THEME · SURFACE with the seven stage hooks, and returns `{ createFieldQuality }`, which holds FIELD QUALITY.
- `createFilmApi(app)`: one seat, no return (nothing it declares is read outside it).

So `boot()` runs the five calls in the order the five spans stood and no `device()` / `appendChild` / `register` changes its order (G-O). The brief's ONE-seat proof was not
needed; its (d), `serialize-bytes` 11/11 full, and the settings blobs (§8) say the order held. The later seats' bodies keep the block's four-space column (verbatim; the source-reading
laws, which read `appSource()` — `rack.js` and every file under `windows/` and `shell/` — find their slices where they were), so the function line and its closing `  }` sit at the
two-space column.

**Names.** `createFilmApi(app)`, not `createFilm`: `render-exact.js` exports `createFilm` and `film.js` imports it (R2b's `createKeplerSurface` precedent).
`lab/windows/settings-card.js`, not `settings.js`: `lab/shell/settings.js` is §1's, and a second `settings.js` one folder over is a trap (the MODULES table's one string).

## 2 · `lab/rack.js` (2,001 → 1,681, −320), exact (base line numbers; the tree's in brackets)

| where | what |
|---|---|
| `:3` | `import { reworkNative, planeModel }` → `{ reworkNative }` |
| `:23` | the kit import loses `sw, seg, trig, readout, group` |
| `:30` OUT, `:32` OUT, `:45` OUT | `createFilm`, `createCapture, maxPictureSize`, `createCameraPanel` (three lines) |
| `:37` → `[:35]` | the ramp import line becomes the three module imports on ONE line: `createMaterial` · `createSettingsCard` · `createFilmApi` (`createRampPanel` out) |
| `:38` → `[:36]` | the palette import keeps `rgbToHex, contrastRatio`; `toLUT` (already dead at the base), `PRESET_BY_ID as PALETTE_BY_ID`, `PRESET_GROUPS`, `hexToRgb` out |
| `:135` | the literal's `camKnobs: null` → `camKnobs: {}` (the three `app.state` inits below it are deleted; `{}` keeps today's safety for the `observer.*` defs) |
| `:137` | the literal's `hold: null` → `hold: filmHold` (BY VALUE; hoisting serves it; no fill line) |
| `:163` | + `app.sh.setCardStyle = setCardStyle; app.sh.setDisconnected = setDisconnected;` on R3b's `app.sh.quality` line (comment `R3b · R2c`) |
| `:655` | + `app.host.cameraPort = cameraPort;` on R3b's `app.host.camTravel …` line |
| `:658–:997` → `[:654–:676]` | the 340-line block dissolves (below) |
| `:1898` → `[:1578]` | + `app.w.stageCaption = stageCaption;` as the first line after the `/* ── go ──` header |

**The block, seat by seat** (tree lines):
| tree | base | what |
|---|---|---|
| `:654–:664` | `:945–:955` | `function filmHold(on) {` … `}` out of the block to boot level, two-space indent, tokens unchanged (every line re-indented by −2): the LOOP's piece, now hoisted at boot level |
| `:665` | `:944` (split) | `let filmBefore = null;   // THE FILM's hold (0.5.2 R2c) …` — split from `let exact = null, filmBefore = null, cap = null, facadeRun = null;` (`exact`, `cap`, `facadeRun` go to film.js) |
| `:666` | `:658–:693` | seat 1: `const { wObs, wPal, wCam, wClip, createDrawClipPaletteCamera } = createMaterial(app);` |
| `:667` | `:694` | the kept header `/* ── THEME and SURFACE: … ── */` (re-indented 4 → 2) |
| `:668` | `:695–:843` | seat 2: `const { createFieldQuality } = createSettingsCard(app);` |
| `:669` | `:844–:938` | seat 3: `createDrawClipPaletteCamera();` |
| `:670–:674` | `:939–:943` | the kept five-line THE FILM header |
| `:675` | `:956–:970` | seat 4: `createFilmApi(app);` |
| `:676` | `:971–:996` | seat 5: `createFieldQuality();` |
| `:678` | `:999` | `// STATE — preparation` — R2a's seat, untouched |

Arithmetic, exact: 2,001 − 21 blank lines (20 inside runs, 1 before the seats) − 298 moved lines − 3 inits − 2 block braces + 1 (`let filmBefore`) + 5 seat lines − 3 import lines + 1 (the
`go` line) = **1,681**. `boot()`'s body 1,936 → 1,619 lines, 25 → 27 sections (the two kept headers now stand at boot level). **15 names left rack.js** (§6).

## 3 · The modules, exact

**`lab/windows/material.js`** (127 lines): 1–2 header · 3–5 three import lines (7 statements, 14 names) · 6 `export function createMaterial(app) {` · 7 the hand-over (12 names) · 8–11 the four
`device()`s · 12–33 WAVE's head (22) · 34 `function createDrawClipPaletteCamera() {` · 35–124 DRAW · CLIP · PALETTE · INVERT · CAMERA (90) · 125 `  }` · 126 the return (5 names) · 127 `}`.

**`lab/windows/settings-card.js`** (177 lines): 1–2 header · 3–4 two import lines (3 statements, 10 names) · 5 `export function createSettingsCard(app) {` · 6–7 the hand-over (22 names) · 8–147
INTERFACE · THEME · SURFACE and the hooks (140) · 148 `function createFieldQuality() {` · 149–174 FIELD QUALITY (26) · 175 `  }` · 176 `return { createFieldQuality };` · 177 `}`.

**`lab/windows/film.js`** (22 lines): 1–2 header · 3 one import line (`createFilm`; `createCapture`, `maxPictureSize`) · 4 `export function createFilmApi(app) {` · 5 the hand-over (7 names) ·
6–21 the road (16): `let exact, cap, facadeRun`, `film()`, `capture()`, `take`, `app.state.capApi` · 22 `}`.

**Verbatim, proved (re-run)** (`verbatim.mjs`, every non-blank line of the base block `:658–:997` against the three files and rack.js): of the **319 moved non-blank lines 296 are
byte-identical, 15 are re-indented by −2 (`filmHold` and the seat headers), 8 are the rest**: the 3 deleted inits (`capApi`, `camKnobs`, `exporter3d` — the literal already holds them),
`layout.resetLayout()` → `app.sh.layout.resetLayout()` (SETTINGS' RESET LAYOUT callback), the split `let`, and 3 film lines that read a later name through its slot
(`app.sh.LW` ×2, `app.w.periodEnergies` ×2, `app.w.stageCaption()` ×2 — all inside `film()` / `capture()`). `createFilm(…, { …, hold: filmHold, … })` stays byte-identical: film.js
destructures `{ hold: filmHold } = app.loop`, an alias, in place of the brief's `{ hold }`. Comments and section headers travel; `filmHold`'s body does not change by one token.
Free names (`freenames.mjs`, re-run): nothing lost — the six names it lists are getter keys (`get theme()` · `get selected()` · `get capture()` in the facade, `get on()` in the palette
literal, `get busy()` in `capApi`) and `PRESET_BY_ID`, the left side of `PRESET_BY_ID as PALETTE_BY_ID`.

**The hand-overs** (one statement each; THE READ LAW — every module is seated after the controller):
- material: `{ ui, device, mat, PAL_DEF } = app, { schedule } = app.loop, { cameraPort } = app.host, { saveSettings } = app.sh, { mod, modHand, applyAccent, field, setReference } = app.ctl`.
- settings-card: `{ ui, device, mat, settingsStore } = app, { schedule } = app.loop, { quality, saveSettings, setCardStyle, setFrost, setDisconnected } = app.sh, { domain, fieldRate,
  setGovernor, setKeepFrames, setPerfMode, modHand, modStore, curvesStore, look, applyAccent, paintMarks, field } = app.ctl`; at use: `app.sh.layout` (RESET LAYOUT's callback).
- film: `{ dom, obs } = app, { hold: filmHold } = app.loop, { camera } = app.host, { rotStep, rotDriving, field } = app.ctl`; at use: `app.sh.LW`, `app.w.periodEnergies`, `app.w.stageCaption()`.
Every `ui.x =` keeps its name on the one registry; `TIER` comes from `'../rack.js'` (the accepted cycle, read only inside functions).

## 4 · Lines

`lab/*.js` + `lab/shell/` + `lab/windows/` **27,893 → 27,902 (+9)** of the 27,943 cap (**41 left** for the five modules still to move — R2d's molecules, stage-words, modulation, ink,
and R5's facade; the cap WILL be passed and that ruling is Josh's at R-V), counted (re-run) with `cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l` on this tree and on the base export:
the modules **+326** (127 + 177 + 22) · rack.js **−320** · sw.js **+3** (three precache rows; the rack.js digest changes in place). Shape, the 326 = 298 moved + 28 not-moved: headers 6,
imports 6, signatures 3, hand-overs 4, the later seats' function lines and closings 4, returns 2, braces 3. The brief's measure (header + signature + return + brace, ≤ 15 in all): material 7,
settings-card 7, film 4 = **18** — 14 without the two later seats, whose four lines are the price of keeping the card order (R2b's three over, again). Subtracted on the way: 21 blank
lines, the 3 inits, the 2 block braces, 3 import lines, and `hold` by value (no fill line). Added outside the modules: 5 seat lines, `let filmBefore`, the `go` line; the 2 other
boot fills (`cameraPort`, `setCardStyle` / `setDisconnected`) are appended to existing lines (+0). Outside `lab/`: `tools/rack-deps.mjs` +13 −10, `tests/rack-deps.test.mjs` +6.

## 5 · The classes table, before and after (`node tools/rack-deps.mjs --classes`)

BEFORE: `8796d15`, rack.js 2,001 lines, sha `585dff2e00d8`, 38 pieces. AFTER: rack.js 1,681, sha `3e0fa8729202`, 37 pieces, **16 module files measured** (13 before: the three new).

| module | lines | backward | forward | shared (bare) | app.state (another's) | **fwd + shared** | bare writes | hinge |
|---|---|---|---|---|---|---|---|---|
| material BEFORE (pieces in rack.js) | 131 | 11 | 0 | 0 | 1 (+4 own) | **1** | 0 | ok |
| material AFTER (`material.js`, seated `rack.js:666` + `:669`, handed 12) | 129 | 11 | 0 | 0 | 1 (+2 own) | **1** | 0 | ok |
| settings-card BEFORE | 178 | 21 | 1 | 0 | 4 | **5** | 0 | ok |
| settings-card AFTER (`settings-card.js`, seated `:667`, handed 22) | 181 | 21 | 1 | 0 | 4 | **5** | 0 | ok |
| film BEFORE | 21 | 5 | 3 | 0 | 3 | **6** | 0 | ok |
| film AFTER (`film.js`, seated `:670`, handed 7) | 28 | 6 | 3 | 0 | 2 (+1 own) | **5** | 0 | ok |
| notebook BEFORE → AFTER (R3b's) | 381 | 27 | 10 | 0 | 11 → 10 (+1 own) | **21 → 20** | 0 | ok |
| loop (stays) BEFORE → AFTER | 488 → 489 | 41 | 49 | 0 | 27 (+4 own) | **76** | 0 | exempt |
| boot (stays) BEFORE → AFTER | 287 | 0 | 65 → 68 | 0 (+1 boot-kept) | 11 | **76 → 79** | 0 | exempt |

(The "lines" column is the module file plus the seat lines left in rack.js: 127 + 2, 177 + 4, 22 + 6.)
- **material** backward `PAL_DEF applyAccent cameraPort device field mat mod modHand saveSettings schedule setReference` · app.state `space` (written) · own `camKnobs`, `palette`.
  The two own seats that left are the deleted inits `capApi` and `exporter3d`.
- **settings-card** backward `applyAccent curvesStore device domain field fieldRate look mat modHand modStore paintMarks quality saveSettings schedule setCardStyle setDisconnected setFrost
  setGovernor setKeepFrames setPerfMode settingsStore` · forward `sh.layout` · app.state `molFormulaScale stageFollow stageMix stageText` (writes the first three).
- **film** backward `camera field filmHold obs rotDriving rotStep` · forward `sh.LW w.periodEnergies w.stageCaption` · app.state `modArm modHost` · own `capApi`. It gains `filmHold` as a
  backward name (the alias reads the literal's by-value slot) and owns `capApi` now (the deleted init counted it as material's).
- **notebook** owns `exporter3d` now (the deleted init was the only other writer). **boot** +3 forward: `filmHold` (the literal reads it) and `stageCaption` + `w.stageCaption` (the `go` line).
  **loop** +1 line: `let filmBefore` joins the loop's last piece.
- **The same names, class for class, otherwise.** Every other row is the base's (diffed). THE HINGE (G-G) HOLDS: bare writes across scopes 0; the largest moving module SPECTRUM at 24
  (limit 25). G-A clean (`app` at `:125`, was `:128`; 30 keys; hooks 12 · state 57 · loop 13 · host 21 · w 71 · ctl 68 · sh 45, unchanged). The summary (re-run): forward 74 → 72 (deferred
  69 → 66, hoisted 5 → 6 — `filmHold` —, **eager let/const 0**); crossing names 226 → 227; **imports never referenced: `toLUT` → none**; boot-level names never referenced 8 → 9 —
  the new one is **`modStore`** (§9). `tests/rack-deps.test.mjs` GREEN (re-run), "the real tree: 16 module file(s) measured", with the new by-value law.
- **The builder's `.tmp/classes-after-v.txt` against the tree as committed (re-run, `--classes --verbose --no-write`): the same, except three things.** Every class number, every
  name list, the crossing names and the hinge line are identical; the file was taken on a tree one step earlier than `ddfbfb9`, so it reads rack.js sha-256 `73cd72cd92eb` (the commit's is
  `3e0fa8729202`, the digest `sw.js` carries), material.js **128** lines (committed: 127; the row 130 → **129**) and settings-card.js **178** (committed: 177; the row 182 → **181**). The
  commit and the HANDOFF agree (127 / 177 / 22); the stale file is not in the repo.

## 6 · The import fan-out

`rack.js` **44 → 41 import lines** (3 lines out whole — `createFilm`, `createCapture`, `createCameraPanel` —, the ramp line replaced by the one module line, the native-ui, kit and palette lines trimmed in place). **15 names left rack.js** (only the moved spans used them): `planeModel`; `sw seg trig readout
group`; `createFilm`; `createCapture maxPictureSize`; `createRampPanel`; `createCameraPanel`; `toLUT` (already dead at the base), `PALETTE_BY_ID` (`PRESET_BY_ID as …`), `PRESET_GROUPS`, `hexToRgb`.
Imported by a module AND still by rack.js: `el knob` (kit), `rgbToHex` (palette), `VIEW STYLE` (field), `TIER` (from `'../rack.js'`, exported). material.js 3 lines / 7 statements / 14 names;
settings-card.js 2 / 3 / 10; film.js 1 / 2 / 3. `wiring.test` walks them (node gate). Nothing under `lab/mir/**`. The tool now reports "imports never referenced: none".

## 7 · The `app` registrations and the boot fills

- **Registered by settings-card.js at its root** (the inherited fills, moved with their declarations; the facade, the controller and native-ui read them live through `app.hooks`): `theme`,
  `restage`, `setStageColour`, `setStageFollow`, `setStage`, `setGamut`, `setTheme` (module lines 42, 80, 91, 92, 94, 133, 147).
- **Own `app.state` members, filled by the modules** (live, never destructured): material `palette` (`:103`), `camKnobs` (`:122`); film `capApi` (`:17`). The literal keeps `capApi: null`,
  `exporter3d: null`, and now `camKnobs: {}`. The four card handles go back to `boot()` by destructure at the seat (SPECTRUM's five appends `:686`, the loop and `boot()` read them by name).
- **Boot fills I wrote — 4 slots on 3 lines (two appended to existing lines, one new), each filled once** (grepped across `lab/`):
  - `app.host.cameraPort` appended to the camera-law fill line `:652`: material reads it. **R2d's modulation seam reads `cameraPort` too and writes the same fill on the same host line — keep one.**
  - `app.sh.setCardStyle`, `app.sh.setDisconnected` appended to R3b's `app.sh.quality` line `:160`: settings-card reads them (settings.js returns them; it can't be edited here — when
    `lab/shell/settings.js` is next opened the two fills become its registration, as R3b's candidate 4).
  - `app.w.stageCaption = stageCaption;` as the first line of `/* ── go ──` `:1578`: film.js reads `app.w.stageCaption()` and the slot is null in this tree until R2d's `stage-words.js`
    registers it. **The integrator deletes this line at the merge.**
- **No other fill stays in `boot()`:** the 7 hooks and 3 `app.state` members left with their declarations; the 3 inits are gone.
- **Not filled anywhere:** the literal's `w` slots `wObs wPal wCam wClip` — nothing fills them and nothing reads them (grepped); `boot()` reads the handles from the seat's return (§9).

## 8 · The light check

This tree on 9103/5573; the base export (`8796d15`) on 9107/5577, run ONCE for every red the tree read. 2026-10-10 10:39–11:28 CDT; the rig drew few frames (frame-paced waits red, the
governor's median 66 ms on both trees). **(re-run)** = this documentation pass, node only.

| gate | this tree | the base (`8796d15`), where the tree was red | reading |
|---|---|---|---|
| `bash test.sh node` | exit 0 (the HANDOFF names, within it: `rack-deps` with the new law, `first-run` 0 failing of 12, `auto-scale` 23/23, `ink`, `render-exact` 0 failing of 40; the script runs every `tests/*.test.mjs` and `pwa` last) | — | GREEN |
| `node tests/rack-deps.test.mjs` **(re-run)** | all PASS — 16 module files measured; the by-value law | — | GREEN |
| `node tests/pwa.test.mjs` **(re-run, check only)** | PASS — precache == `lab/` on disk: 363 files, every content hash verified; `--write` was run after every `lab/` edit | — | GREEN |
| `node tools/rack-deps.mjs --classes` **(re-run)** | §5; the hinge holds | — | GREEN |
| `lw-facade` | **1/1** | — | GREEN |
| `film-handover` | **4/4**: a real RENDER tap then a real SAVE tap → 1 share, 0 downloads, the facade's `record()` with no tap → 1 download; no discard timer (the URL read 742,434 B); a scripted still → 1 download; CAPTURE IMAGE then DOWNLOAD IMAGE (2800 × 1628) → 1 share | — | GREEN |
| `film-probe` on both trees, then film-compare | exit 0 both. **Picture** 97,519 B, hash `fb599025` (pixels `f8276083`) on both; **frames** 25 × 1400 × 814, 3,247,492 B, every pixel hash and time equal; **ONE PERIOD** 180 frames, 955,524 B, digests and times equal, MP4 byte-identical; **RECORD** 180 frames, 743,361 B, digests and times equal, MP4 byte-identical; `verify` DETERMINISTIC, the same six digests | the same | GREEN — identical |
| `camera-routes` | **5/5** (WAVE DANCER · WATER · BENZENE · N₂ · NEW); `--against` the base's reading: SAME ×5 (routes, bases, law byte-identical; the dials `panel` ×6) | recorded | GREEN |
| `camera-shift` | **GREEN**, 11 PASS (the pointer maths, the PAN dials, the link carries the shot) | — | GREEN |
| `serialize-bytes` | **11 readings, full + edit, sha-identical to the live base export** (WAVE DANCER 12,600 B `6ea08561449bee33` · edit 9,911 B `5b1df2122ba5c70e`; … `history · rate 0 → 1.7` 10,896 B `5f4672025b77286e` · edit 8,266 B `d942b9f5bfdea479`) | all 11 equal | GREEN |
| `take-in-bugs` | **RED twice, then GREEN 4/4.** Run 1 10:42: "app time advances" in case 1 (`fresh boot, editor closed`, `t` 0 → 0 with the field and the modulation running); run 2 10:47: the same assertion in case 2 (`no sources at all`); run 3 11:28: 4 PASS (the one clock `t` 0.00 → 0.54 and 0.54 → 1.34, CALCULUS' ⧉ 12 lines, STARK in 20 ms, WIGNER "hydrogenic register only") | **GREEN** (one run, 10:46: 4 PASS, `t` 0.00 → 0.53 and 0.53 → 1.00) | the rig — frame-paced, red in a different case each time; **the one red the base did not reproduce** (it was run once) |
| `curves` | RED at scene 3 (`tests/curves.browser-test.mjs:51`, `notStrictEqual`; scenes 1 and 2 PASS): the two screenshot hashes it compares are both `3456375078` | **identical** (the same line, the same hash) | the rig |
| `settings-probe` | boot **716 B** and WAVE DANCER **752 B** GREEN, reloads byte-identical (WAVE DANCER's own `modwin.modes s3` note); WATER "Render did not settle: animation frames stopped" → "1 of 6 scenes red"; BENZENE · N₂ · NEW not reached | **identical** — the same two blobs, WATER the same error | 0 scenes judged red on the two reached; the rig |
| the boot suite's WAVE / SETTINGS / CAMERA / PALETTE / CLIP / theme blocks (chunk runner, ranges `181-198,214-219,317-382,641-679,696-757,787-809,1342-1632,1774-1932,2384-2412` of `tests/legacy/boot.browser-test.mjs`) | **21 of 23 GREEN**: B1 ×2, B43, B8 ×2, B10, B19 ×2, B20 PHASE PALETTE, B21 ×2 (DRAW STYLES, KEYS), B39 THEME, B40 ACCENT, B42, B44 SETTINGS · CLOSE · POWER · COPY, B46 THE OBSERVER SPLIT, B61, B62 CARD STYLE, B63, B66 THE CAMERA WINDOW, B73 THE CAMERA'S FEEL; RED **B60**, **B65** | **21 of 23, the same twenty-three verdicts title for title**: B60's governor median 66.08 ms (tree) vs 65.94 ms (base), `underBudget` false on both; B65's travel `restMs` 4942 vs 4932 (expect 3040) | the rig |

THE LOCK is not this row's, and nothing here touched it: `filmHold`'s body is the base's tokens (re-indented −2), the film's `frame(i, ctx)` road is `render-exact.js`'s, unchanged, and the film
probe's digests, times and MP4 bytes equal the base's. Not in this row's set, not run: B149 (the standing law red), B6 / B69 (flakes), `latex-copy`, `keyboard-window`. No source-slicing test
needed a re-point (`first-run`, `auto-scale` and the boot suite's B108 / B112 read `appSource()`).

## 9 · Brief candidates (R2d's merge · R5 · R-V · the integrator)

1. **`modStore` is unread in `boot()` now** — its last reader was the SETTINGS card (it reads `modStore` from `app.ctl`). It sits in the controller seat's 68-name destructure (`rack.js:163`), not on
   my line; the integrator drops it when that line is next touched, with `markBatchBegin` and `solveCard` (R2b / R3a). The tool's "boot-level names never referenced" reads **9** (8 at the base):
   `modStore`, `saveMod`, `markBatchBegin`, `solveCard`, `normalizeNow`, `applySturmian`, `keyState`, `save`, `copyJSON`; only the first is this row's.
2. **A slot the literal holds BY VALUE under another key hands that name** (`loop: { hold: filmHold }`): the tool had no clause, so `{ hold } = app.loop` read as a G-A stray. One clause in
   `classes` (a `litName` map and the lookup through it: +6 −2 lines) and one law in `rack-deps.test` (RED on the base tool, GREEN now). It is general — R5 or R-V may hand any boot-held name that way.
3. **R3b's candidate 4 grows by two:** `settings.js` returns `setCardStyle` and `setDisconnected` (settings-card reads them) on top of the five on the `quality` line; when `lab/shell/settings.js` is
   next opened the seven fills become its registration. `app.w.periodEnergies` (film) is the same kind of fill on SPECTRUM's seat line.
4. **Four dead slots in the literal:** `w: { wObs, wPal, wCam, wClip, … }` (`rack.js:138`) are filled by nothing and read by nothing; `boot()` gets the handles from the seat's return. R-V may drop them
   (four names, no line) or fill them if a module ever needs one.
5. **Name-anchored seats:** the tool's `PLANNED_CUT` rows `^ {2}createDrawClipPaletteCamera\(\);` and `^ {2}createFieldQuality\(\);` are the later seats; renaming either function means editing its row.
6. **A stale measurement is easy to carry:** the builder's `classes-after-v.txt` was one step behind the commit (§5). A future row should re-run `--classes` after its last `lab/` edit and `pwa --write`, not before.
7. **`film.js` depends on three slots filled elsewhere** — `app.sh.LW` (the `window.__LW = LW; app.sh.LW = LW;` line, which R5 keeps in `boot()`), `app.w.periodEnergies`, `app.w.stageCaption` (R2d) —
   all read inside `film()` / `capture()`, first called long after boot. R5's facade move must keep `app.sh.LW` where it is.

## 10 · Merge notes (for the integrator)

- **The seats** (this tree): `rack.js:654–664` `filmHold`, `:665` `let filmBefore`, `:666` material, `:667` THEME and SURFACE header, `:668` settings-card, `:669` `createDrawClipPaletteCamera();`,
  `:670–:674` THE FILM header, `:675` `createFilmApi(app);`, `:676` `createFieldQuality();`, then R2a's `:678`. **What `boot()` destructures:** material 5 (`wObs wPal wCam wClip
  createDrawClipPaletteCamera`), settings-card 1 (`createFieldQuality`), film 0. The literal: `camKnobs: {}` (`:132`), `hold: filmHold` (`:134`).
- **Against R2d** (it touches base `:1019–:1240`, `:1244–:1490`, `:1557–:1607`, its `PLANNED_CUT` rows and its import lines): my rack.js hunks, in BASE line numbers, are the imports (`:3`, `:23`, `:30`, `:32`,
  `:37–:38`, `:45`), the literal (`:135`, `:137`), `:163` (R3b's `quality` line), `:655` (the camera-law fill line), the block `:658–:997` and `:1898`; none is inside R2d's spans.
- **The six judgement calls:**
  - **(a) film.js `{ hold: filmHold } = app.loop` alias.** The brief said `{ hold }`; the alias keeps `createFilm(…, { hold: filmHold })` byte-identical. It needed **the new by-value clause in
    `tools/rack-deps.mjs`** (`litName`, +6 −2 lines in `classes`) **and its law in `tests/rack-deps.test.mjs`** (+6): without them `{ hold } = app.loop` is a G-A stray. Keep both with the tool at the merge.
  - **(b) Three boot fills** the brief did not name: **`app.host.cameraPort`** on the camera-law line `:652` (R2d writes the same on the same host line — keep ONE), and **`app.sh.setCardStyle` +
    `app.sh.setDisconnected`** on R3b's `app.sh.quality` line `:160`.
  - **(c) The `go` line `app.w.stageCaption = stageCaption;` (`:1578`) is DELETED at the merge with R2d,** whose `stage-words.js` registers it; film.js reads `app.w.stageCaption()` at use.
  - **(d) `PLANNED_CUT` reordered, and settings-card's `file:` string.** `filmHold` now leads the block's rows at `^ {2}`, then `const { wObs, wPal, wCam, wClip,` → `^ {2}/* ── THEME and SURFACE` →
    `createDrawClipPaletteCamera();` → `^ {2}/* ── THE FILM` → `createFieldQuality();`; `PLANNED['settings-card'].file` is `lab/windows/settings-card.js`. R2d edits other rows of the same table: keep both sets.
  - **(e) 15 import names out of rack.js, including the dead `toLUT`** (§6; `rack.js` 44 → 41 import lines). **The import block WILL conflict with R2d's import deletions: take both.** After the merge
    `node tools/rack-deps.mjs` lists what neither side removed under "imports never referenced".
  - **(f) `modStore`** is unread in `boot()` (§9.1): **drop it from the controller-seat destructure (`:163`) in a fix round** (with `markBatchBegin` and `solveCard`).
- `lab/sw.js` carries three new precache rows and the new rack.js digest: re-run `node tests/pwa.test.mjs --write` on the merged tip.
- REPORT.md: wave 221 appends after wave 220 under the 0.5.2 heading; R2d's wave appends beside it (order is the integrator's).

## 11 · The drafted CLAUDE.md sentence (NOT applied)

> THE MATERIAL, THE SETTINGS CARD AND THE FILM (0.5.2 R2c): WAVE (SPACE, OBSERVABLE, DRAW), CLIP, PALETTE · INVERT and CAMERA are `lab/windows/material.js` `createMaterial(app)` and the SETTINGS
> card is `lab/windows/settings-card.js` `createSettingsCard(app)` — each at TWO seats (the root builds the first span and returns `createDrawClipPaletteCamera()` / `createFieldQuality()`, which
> `boot()` calls where DRAW and FIELD QUALITY stood, so the cards keep their rack order; the card registers its seven stage hooks on `app.hooks` at its root) — and THE FILM's road (`film()`,
> `capture()`, the takes, `app.state.capApi`) is `lab/windows/film.js` `createFilmApi(app)` at one. `filmHold` stays in `boot()` beside the loop as `app.loop.hold`, handed to the film BY VALUE
> (`const { hold: filmHold } = app.loop`; the tool counts a slot the literal holds by value under another key as backward), and `LW`, `periodEnergies` and `stageCaption` are read through
> `app.sh` / `app.w` at use.

## 12 · What Josh will see

**Nothing.** The work: `serialize-bytes` 11 readings, full and edit, sha-identical to the live base export — a project, a link and an undo row are the same bytes. The browser's memory:
`settings-probe`'s boot (716 B) and WAVE DANCER (752 B) blobs and their reloads equal the base's. The film: the probe's picture (97,519 B), 25 frames, the ONE PERIOD loop (180 frames) and the RECORD
clip (180 frames) have the same digests, times and MP4 bytes on the tree and on the base, and `film-handover` is 4/4 — the road a render, a clip and a still take is the base's. The camera:
`camera-routes` reads the same routes, bases and law on all five projects, `camera-shift` is green, B66 and B73 are green. The cards: the same five `device()` / `appendChild` seats in the same
order, so the rack's DOM order, `captureLayout` and `closed[]` are the base's; the boot suite's theme, palette, draw, accent, settings, card-style and camera laws read law for law as the base
(21 of 23, B60 and B65 red on both). The code: 296 of the 319 moved non-blank lines byte-identical, 15 re-indented, the other 8 the same expressions read through a slot, one split `let` and three
deleted inits the literal already held. The reds are the rig's, reproduced on the base reading for reading — except `take-in-bugs`, whose frame-paced clock case is red here in a different case each
time and green on its third run and on the base's one.
