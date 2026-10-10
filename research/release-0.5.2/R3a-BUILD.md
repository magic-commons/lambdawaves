# R3a-BUILD · SETTINGS + PERSISTENCE + LINKS + HISTORY (0.5.2 "Rack Dissolution"; Opus 5.5 builder; PAIR 1 beside R2a)

Base `ff2b3e6` (`yan-c` = R0 + R1 + the `app.ctl` fill). Worktree `.claude/worktrees/agent-af4da7c2119c9a84d`, branch
`worktree-agent-af4da7c2119c9a84d`. Ports 9073/5543 (this tree) and 9077/5547 (the base: `git archive ff2b3e6` into `.tmp/base`, the default
certificate directory `~/.config/lambdawaves/certs` — the server no longer keeps one in the tree). One browser at a time: every suite
waited for no geckodriver / marionette Firefox and `tools/perf/wait-gpu.mjs` first (`.tmp/waitfree.sh`); R2a's geckodriver on 5533 was
waited out, never touched. Josh's desktop Firefox was not touched.

## 1 · The ledger

| commit | what |
|---|---|
| `5941341` | THE MOVE: §1 → `lab/shell/settings.js`, §24 → `lab/shell/persist.js`, §25 the links → `lab/shell/links.js`, THE TRUE HISTORY + its card → `lab/shell/history.js`; eleven boot fills; `tools/rack-deps.mjs` G-A learns an earlier-seated file's eager fills; `rack-deps.test` §5 +1 law; `first-run.test`'s import law re-pointed; pwa |
| `098fb1b` | rack.js keeps `readLink` + `LINK_CHAR_CEILING` (the facade's `link.read` / `ceiling` and §29's hashchange read them) — found by B128 |
| `8ec6e28` | the four module imports take `edit-domain.js`' line in place (no insertion beside the controller's import) |
| (this) | the probes; the classes table; this file; REPORT wave 218 |

The move was done by `.tmp/r3a-move.mjs` over the walker's token positions (`lex` / `pairBrackets` / `scopeWalk` from the tool; no sed): it
cuts the spans, checks every free name of each span is either handed from `app` or read at use (it refuses a name that is neither, a write
to one, or an at-use read that runs eagerly), rewrites the 63 at-use references, and prints every edit. **Verbatim, proved**
(`.tmp/verbatim.mjs`, line by line against `ff2b3e6`): of the **665 moved lines 623 are byte-identical** and the other **42 differ only by
`app.<ns>.x` reads** (settings 119 + 20 of 139, persist 276 + 17 of 293, links 74 + 2 of 76, history 154 + 3 of 157); comments and section
headers travel with their code; indentation kept.

### `lab/rack.js` (4,664 → 4,012, −652), exact (base line numbers)

| where | what |
|---|---|
| `:9` | `deviceQuality` off first-run.js' line (it left with `restore()`) |
| `:72` | `edit-domain.js`' line (left with the history) becomes `import { createSettings } … createPersist … createLinks … createHistory } …   // 0.5.2 R3a` — one line, four imports |
| `:86` | the statelink line keeps `readLink, LINK_CHAR_CEILING` (`linkFor`, `LinkError` left with links.js) |
| `:94` | `const LS_EXP …, LS_PRES …` OUT (moved to persist.js' top: only §24 read them) |
| `:191–332` | §1 (139 lines) OUT, its two trailing blanks OUT; the seat (tree `:190–192`): `function readSettings() { return settingsStore.read(); }` KEPT, now the last line of the head ABOVE §1's header (one hoisted line reading a §0 const; §0's `useCompactDefaults` calls it first, U1; `app.sh` holds it by value) · `/* ── SETTINGS: what this browser remembers — lab/shell/settings.js (0.5.2 R3a), created here ── */` · `const { saveSettings, setCardStyle, setFrost, setDisconnected, applySettings, KIND, RETIRED_WINDOWS, powered, DIGESTS } = createSettings(app);` — then `quality` and `app.sh.quality = quality;` STAY (§2's head) |
| after `:471` | `app.loop.canPresent = canPresent;` |
| after `:823` | `app.host.camera = camera; app.host.camLevel = camLevel; app.host.syncFreeAngles = syncFreeAngles; app.host.syncCamUI = syncCamUI; app.host.rack = rack;` |
| between `:1584` and `:1585` (the appends seat, two unchanged lines from R2a's spans) | `app.w.wState = wState; app.w.switchHamiltonian = switchHamiltonian; app.w.applySturmian = applySturmian; app.w.setElement = setElement; app.w.fillValence = fillValence;` |
| after `:1676` (PLANE's `createSliceView` statement) | `app.w.shadowFoot = …; app.w.kepler = …; app.w.vortex = …; app.w.particles = …; app.w.slice = slice;` |
| after `:1799` (`stageTextTick`'s close) | `app.w.stageTextTick = stageTextTick;` |
| after `:1891` (`const wOrbs`) | `app.w.wChem = wChem; app.w.wOrbs = wOrbs;` |
| after `:1923` (`const ladder`) | `app.w.ladder = ladder;` |
| after `:2193` (`const wignerView`) | `app.w.wAtoms = wAtoms; app.w.wignerView = wignerView;` |
| after `:2416` (`setModArm`'s close) | `app.sh.setModArm = setModArm;` |
| after `:2680` (`const gas`) | `app.w.kepShell = kepShell; app.w.keplerRowSync = keplerRowSync; app.w.gas = gas;` |
| after `:3485` (`const tablet`) | `app.sh.rk = rk; app.sh.layout = layout; app.sh.phone = phone; app.sh.tablet = tablet;` |
| `:3756–4284` | §24 (293) · §25 the links (76) · THE TRUE HISTORY + its card (157) OUT, with three blanks between them; the seats (tree `:3627–3632`): `/* ── persistence (§46): lab/shell/persist.js (0.5.2 R3a), created here — serialize and restore whole ── */` · `const { modSeats, serialize, restoreModulation, save, copyJSON, restore } = createPersist(app);` · `/* ── WAVE 56 · SHAREABLE LINKS: lab/shell/links.js (0.5.2 R3a), created here; the link opens at §29 ── */` · `const { notCarriedWords, mintLink, copyLink, openLink } = createLinks(app);` · `/* 0.3.1 · S3 THE TRUE HISTORY and its card: lab/shell/history.js (0.5.2 R3a), created here, so the card keeps its seat in the rack */` · `const { historyApi } = createHistory(app);` |

−(139 + 293 + 76 + 157) moved −5 blanks −1 (LS_EXP) +8 (four seats) +11 (fills) = **−652**. Every import hunk is a line changed in place or
removed. §29's `const linkAtBoot = openLink();` and the hashchange handler stay in `boot()`, reading the destructured `openLink`.

### The four modules, exact

| file | lines | shape (lines that are not moved code) |
|---|---|---|
| `lab/shell/settings.js` | 147 = 139 moved + 8 | header 4 · `export function createSettings(app) {` · the hand-over 1 (`const { ui, mat, settingsStore, useCompactDefaults, FIRST_RUN, appleDevice } = app; const { readSettings } = app.sh;`) · `return { …9 }` · `}` — no imports |
| `lab/shell/persist.js` | 311 = 293 moved + 18 | header 4 · 5 import lines · `const LS_EXP …, LS_PRES …` (moved) · signature · hand-over 4 (§0's 10 by value; `app.loop` schedule, paceRate; `app.sh` quality, layout, phone, tablet; `app.host` camera, camLevel, syncFreeAngles, syncCamUI; `app.w` the 20 card handles) · `app.sh.serialize = serialize; app.sh.restore = restore; app.sh.save = save; app.sh.copyJSON = copyJSON;` · `return { …6 }` · `}` |
| `lab/shell/links.js` | 85 = 76 moved + 9 | header 3 · 1 import line · signature · hand-over 1 (`ui, reg, PAL_DEF`; `app.w.wState`) · `app.sh.esc = esc; app.sh.copyLink = copyLink;` · `return { …4 }` · `}` |
| `lab/shell/history.js` | 166 = 157 moved + 9 | header 3 · 2 import lines · signature · hand-over 1 (`device, reg, hNote`; `app.loop.canPresent`; `app.host.rack`; `app.sh.rk`; `app.w.wState`) · `return { historyApi }` · `}` |

Header + signature + return (+ brace): settings 7, persist 7, links 6, history 6 — each ≤ 12. Each module ≤ 600.

**What each reads at use (inside a callback, never at creation)** — the 63 rewrites: settings (before the controller's seat) `app.ctl.MOD /
field / gov / keep / look / modStore / perf / saveMod / setGovernor / setKeepFrames / setPerfMode`, `app.host.camera`, `app.sh.setModArm`,
`app.sh.quality`; persist `app.ctl.domain / modSyncBases / modGets / rotRate / setRotationRate / applyAccent / markBatchBegin / markBatchEnd /
setReference` (the brief's "read app.ctl.x at use") and `app.w.spectrum` (SPECTRUM's fill moves into R2a's module at the merge, so persist
does not destructure it); links `app.sh.serialize / restore`; history `app.sh.serialize / restore / esc`, `app.ctl.rotDriving`. `app.state`:
the owned seats travel with their code (`molFormulaScale`, `space` → settings; `restoreNotice` → persist; `linkLast` → links; `history` →
history); every other member is read and written live; none is destructured.

**Lines.** `lab/*.js` + `lab/shell/` **27,754 → 27,815 (+61)** of the 27,943 cap = modules' shape +44 (settings 8, persist 18, links 9,
history 9) + rack.js +13 (seats 8, fills 11, blanks −5, LS_EXP −1) + `sw.js` +4 (the four precache rows). 128 lines are left for the other
eight modules. Outside `lab/`: `tools/rack-deps.mjs` +5 net (3 hunks), `tests/rack-deps.test.mjs` +8, `tests/first-run.test.mjs` ±1.

## 2 · The tool (`tools/rack-deps.mjs`, 3 hunks) and why

Under the brief's own design `lookSync` is registered by `settings.js` (`app.sh.lookSync = lookSync`, the line that moves with §1) and the
controller keeps destructuring it (`const { lookSync, quality } = app.sh;` — `controller.js` is never edited). G-A only accepted a fill made in
rack.js, so it read that as two strays (`lookSync` "is no boot-level name", "a null slot boot does not fill before the seat"). **A file's eager
fills run at its seat**, so G-A now accepts a slot an EARLIER-seated module file fills at its root (the controller's `app.ctl` fills count for
every module seated after §2 the same way). And `Object.assign(app.ctl.domain, pr.domain || {})` (restore's, verbatim) was read as an
assignment into `app`; the check now flags only `Object.assign(app` / `(app.<ns>` — a member's object is not the shape. `rack-deps.test` §5
gains the law (an earlier file's fill lets a later file destructure; without it the stray stands; `Object.assign(app.ctl.gov…)` is no stray):
51 PASS. On the base tree the table is unchanged.

## 3 · The classes table, before and after (`node tools/rack-deps.mjs --classes`)

**Before** (`ff2b3e6`, rack.js `78281bac6006`, 38 pieces):

| module | row → file | lines | backward | forward | shared lets (bare) | app.state (another scope's) | **fwd + shared** | bare writes | hinge |
|---|---|---|---|---|---|---|---|---|---|
| boot (stays) | — → `lab/rack.js` | 283 | 0 | 56 | 0 (+1 boot-kept) | 11 | **67** | 0 | exempt |
| settings | R3a → `lab/shell/settings.js` | 144 | 7 | 13 | 0 | 2 (+2 own) | **15** | 0 | ok |
| controller | R1 → `lab/shell/controller.js` | 360 | 12 | 10 | 0 | 2 (+29 own) | **12** | 0 | ok |
| persist | R3a → `lab/shell/persist.js` | 294 | 49 | 0 | 0 | 13 (+1 own) | **13** | 0 | ok |
| links | R3a → `lab/shell/links.js` | 78 | 5 | 0 | 0 | 3 (+1 own) | **3** | 0 | ok |
| history | R3a → `lab/shell/history.js` | 158 | 11 | 0 | 0 | 4 (+1 own) | **4** | 0 | ok |

**After** (this tree, rack.js `cf077727279d`, 38 pieces; `module files measured (5)`: controller seated at rack.js:197, settings at :191
handed 7, persist at :3627 handed 40, links at :3629 handed 4, history at :3631 handed 7):

| module | row → file | lines | backward | forward | shared lets (bare) | app.state (another scope's) | **fwd + shared** | bare writes | hinge |
|---|---|---|---|---|---|---|---|---|---|
| boot (stays) | — → `lab/rack.js` | 286 | 0 | 65 | 0 (+1 boot-kept) | 11 | **76** | 0 | exempt |
| settings | R3a → `lab/shell/settings.js` | 151 | 8 | 14 | 0 | 2 (+2 own) | **16** | 0 | ok |
| controller | R1 → `lab/shell/controller.js` | 360 | 11 | 10 | 0 | 2 (+29 own) | **12** | 0 | ok |
| persist | R3a → `lab/shell/persist.js` | 313 | 39 | 10 | 0 | 13 (+1 own) | **23** | 0 | ok |
| links | R3a → `lab/shell/links.js` | 87 | 3 | 2 | 0 | 3 (+1 own) | **5** | 0 | ok |
| history | R3a → `lab/shell/history.js` | 169 | 7 | 4 | 0 | 4 (+1 own) | **8** | 0 | ok |

Every other row is unchanged but for line counts. **THE HINGE (G-G) HOLDS**: 0 bare writes across scopes; the largest moving module is still
SPECTRUM at 24; R3a's largest is persist at 23. **G-A (static) clean** (`app` at :159, 30 keys, the seven namespaces as R0 made them).
- settings 15 → 16: the 13 forward names are now `app.ctl.*` ×11, `app.host.camera`, `app.sh.setModArm`, plus `app.sh.quality` (read in a
  callback: `quality` stays in rack.js' seat piece); `readSettings` is boot's now (backward; it sits in the head piece).
- persist 13 → 23: the nine controller names and `app.w.spectrum` read at use count as forward (10). With the tool's new rule they could be
  destructured at creation (→ 13) — the brief said at use, so they are.
- links 3 → 5 and history 4 → 8: persist's `serialize`/`restore` and the links' `esc` are read through `app.sh` at use; history's
  `rotDriving` through `app.ctl`.
- controller backward 12 → 11: `lookSync` is a module's registered name now, not a boot-level one.
- boot (exempt) 67 → 76: the appends-seat fill reads the five STATE/SPECTRUM names (+5 bare, +5 `app.w.*`), and `readSettings` is boot's own (−1).
- The tool's summary: imports never referenced none; boot-level names never referenced **1 — `markBatchBegin`** (destructured at the
  controller's seat, now read only by persist through `app.ctl`; R1's seat line, left as is).

## 4 · The import fan-out

`lab/rack.js` **75 → 75 import lines** (edit-domain's line now carries the four shell imports; first-run.js and statelink.js trimmed).
Four names left rack.js: `createEditHistory`, `linkFor`, `LinkError`, `deviceQuality` (+ the module const `LS_EXP`/`LS_PRES`).
- `settings.js`: none.
- `persist.js` 5 lines, 11 names: `TIER` from `'../rack.js'` (the controller's safe cycle: read only inside functions), `VIEW_NAMES`,
  `STYLE_NAMES`, `quatFromYawPitch` (field.js), `deviceQuality` (first-run.js), `getHamiltonian`, `setHamiltonian`, `HAMILTONIANS`, `setZ`,
  `getZ` (hamiltonian.js), `clampShift` (camera-law.js) — all but `deviceQuality` still imported by rack.js too.
- `links.js` 1 line: `linkFor`, `readLink`, `LinkError`, `LINK_CHAR_CEILING` (`readLink` and `LINK_CHAR_CEILING` stay in rack.js too).
- `history.js` 2 lines: `el`, `trig` (kit.js, both still rack.js'), `createEditHistory`.
A free-name check (`.tmp/freenames.mjs`: every name a file uses that nothing in it declares, against the base rack.js) finds no lost binding
(it caught `readLink` after the boot suite's B128 did).

## 5 · The `app.sh` (and boot-kept) fills

- **Registered at creation (a reader outside the module needs it):** `settings.js` → `app.sh.lookSync` (the controller destructures it);
  `persist.js` → `app.sh.serialize`, `app.sh.restore` (links, history), `app.sh.save`, `app.sh.copyJSON` (STATE's SAVE / LOAD / COPY JSON —
  R2a's `state.js` reads them live after the merge); `links.js` → `app.sh.esc` (the HISTORY list), `app.sh.copyLink` (STATE's COPY LINK).
  `history.js` registers nothing (its `historyApi` readers — facade, keys, notebook — are still in `boot()`).
- **Filled in `boot()` right after their declaration(s)** (the slots my modules read that no moved module owns yet; each becomes its owner's
  registration when that row moves): `app.loop.canPresent`; `app.host.camera`, `camLevel`, `syncFreeAngles`, `syncCamUI`, `rack`;
  `app.w.wState`, `switchHamiltonian`, `applySturmian`, `setElement`, `fillValence` (at the appends seat — after both of R2a's spans, between
  two lines neither row changes); `app.w.shadowFoot`, `kepler`, `vortex`, `particles`, `slice`; `app.w.stageTextTick`; `app.w.wChem`, `wOrbs`;
  `app.w.ladder`; `app.w.wAtoms`, `wignerView`; `app.sh.setModArm`; `app.w.kepShell`, `keplerRowSync`, `gas`; `app.sh.rk`, `layout`, `phone`,
  `tablet` — **11 lines, 30 slots**. `app.sh.quality` stays R1's fill in `boot()` (`quality` stays).

## 6 · The probes (this tree `LW_PORT=9073 GD_PORT=5543`; the base `9077/5547` beside every rig red)

| probe | this tree | the base | verdict |
|---|---|---|---|
| `bash test.sh node` | exit 0 (after the last lab edit too) — `project-formats` 8 judged, `first-run` 0 failing of 12, `access`, `rack-deps` 51, `auto-scale` 23/23, `pwa` | — | GREEN |
| `node tests/pwa.test.mjs --write` | after every `lab/` edit | — | GREEN |
| `tools/serialize-bytes.mjs` | **11/11 full + 11/11 edit**, every sha equal to R1's base reading (`r1-measure/sb-base.json`; `.tmp/sbcmp.mjs`: 11 same · 0 differ) | the export died twice at WAVE DANCER: "Render did not settle: animation frames stopped" | GREEN (vs the recorded base; serialize's code is unchanged from `86968b7` to `ff2b3e6`) |
| `tools/settings-probe.mjs` | boot · WAVE DANCER · WATER · BENZENE GREEN (blobs 716 / 752 / 736 / 736 B, reloads byte-identical); N₂ "Render did not settle"; NEW unreached | boot · WAVE DANCER GREEN; WATER "Render did not settle" | **0 judged red**; the rig (dies later on the tree than on the base) |
| `history.browser-test` | runs: 20 (block 3b: "the route did not move the stage" — `isModulated` false 500 ms after the route), 20 (3b), **38** (9b: "MOLECULES ON is covered" at 100 ms), 20 (3b) | 44 once; then 20 (3b, the same assertion); a raw read of 3b's state is identical on both trees (`.tmp`'s copy, deleted); 9b's press point read raw: `HTML` at 100 ms, `BUTTON.sw in chem` at 400 ms on BOTH trees, the rack order identical | the rig: the page draws at **2–3 frames a second** (a rAF count over 3 s: 7 / 12 / 9 tree, 7 / 6 / 8 base), and 3b and 9b wait on frames |
| `new-project.browser-test` + `node tools/new-project.mjs --check` | run 1: 3 then "macro LFO did not move within 1 s"; **run 2: 8/8**; `--check` in step (16117 B); `node tests/new-project.test.mjs` in the gate | 8/8; a raw read: the base's LFO took **1061 ms** to move after NEW, the tree's 102 ms | GREEN (run 2); run 1 the rig |
| `lw-links.browser-test` | GREEN (6 PASS) | — | GREEN |
| boot suite B44 · B52 · B98 · B99 · B112 · B128 (chunk runner, with the `goPainted` / `w57goto` helpers) | **9/9 GREEN** (B1 ×2, B43, B44, B52, B98, B99, B112, B128) after the readLink fix; before it B128 was RED ("readLink is not defined @ LW.link.read") | — | GREEN |
| `lw-facade.browser-test` | **1/1** — 176 members, names, kinds and order (56 value · 48 get · 72 method) | — | GREEN |
| `offer.browser-test` | **16/16** (incl. the pasted-link hashchange road) | — | GREEN |
| `node tools/rack-deps.mjs --classes` | §3; `tests/rack-deps.test.mjs` GREEN | — | the hinge holds |

THE LOCK is not this row's: nothing the frame loop reads changed (the loop's closure slots are the same; the fills only write slots).
Standing reds not run here: B149 (the law red), B6/B69 (flakes), `latex-copy`, `keyboard-window` (red on the base).

## 7 · Brief candidates (for R2b / R3b / the integrator)

1. **Destructure `app.ctl` after §2's seat.** With the tool's new rule a module seated after the controller may take `app.ctl` names at
   creation (G-A clean, counted backward). SPECTRUM (24) cannot read its 7 controller names at use without passing 25 (+7); persist would
   drop 23 → 13. The integrator's "read app.ctl.x at use" could become "destructure at creation after the seat; at use only before it (§1)".
   **R2a may also have edited `tools/rack-deps.mjs` for the same reason** — the same G-A lines: a likely text conflict at the merge.
2. **The 11 boot fills move with their owners**: R2b (readouts: shadowFoot, kepler, vortex, particles, slice, ladder, wAtoms, wignerView; kepler:
   kepShell, keplerRowSync, gas), R2d (molecules: wChem, wOrbs; stage-words: stageTextTick), R3b (transport: setModArm; rack-wiring: rk, layout,
   phone, tablet), R2a/integrator (wState and the four SPECTRUM functions at the appends seat). Moved into a module, a fill is its registration,
   and persist's destructure of it stays G-A clean under the new rule (every one of those seats is before §24's).
3. **STATE's four** (`save`, `copyJSON`, `restore`, `copyLink`) are registered by persist / links at creation. If R2a filled any of them in
   `boot()` (at its seat or after their old declarations), that line must go at the merge: they are consts from §24/§25's seats now (TDZ above).
4. **A lost import is invisible to rack-deps** ("imports never referenced" only sees the other direction). A `tools/` diff of a file's free
   names against the base (`.tmp/freenames.mjs`, 25 lines) would have caught `readLink` before the browser did.
5. **`markBatchBegin`** is destructured at the controller's seat and no longer read in `boot()` — drop it from the 68 when that line is next
   touched (the integrator's), or leave it.
6. **The rig**: 2–3 frames a second for the whole session (load 2–4 with R2a's suites). Frame-paced waits (history 3b's 500 ms, new-project's
   1 s LFO, 9b's 100 ms press, `serialize-bytes`/`settings-probe` opens) go red on both trees; re-judge them on a quiet, rebooted rig.

## 8 · Merge notes

- **The four seats** (this tree): `rack.js:190–192` — the kept `function readSettings() { return settingsStore.read(); }` (head, above the
  header), `/* ── SETTINGS: what this browser remembers — lab/shell/settings.js (0.5.2 R3a), created here ── */`, `const { saveSettings,
  setCardStyle, setFrost, setDisconnected, applySettings, KIND, RETIRED_WINDOWS, powered, DIGESTS } = createSettings(app);`; `rack.js:3627–3632`
  — persist's header + `const { modSeats, serialize, restoreModulation, save, copyJSON, restore } = createPersist(app);`, the links' header +
  `const { notCarriedWords, mintLink, copyLink, openLink } = createLinks(app);`, the history's header + `const { historyApi } = createHistory(app);`.
- **What `boot()` destructures:** settings 9, persist 6, links 4, history 1 (the names `boot()` and the unmoved sections read). `lookSync`
  is not returned (only the controller reads it, through `app.sh`). The PLANNED_CUT anchors still match the four seat headers.
- **rack.js hunks** (base coordinates): `:9`, `:72`, `:86` (in place), `:94` (out), `:191–332`, `:3756–4284`, and the eleven one-line
  insertions after `:471`, `:823`, `:1584`, `:1676`, `:1799`, `:1891`, `:1923`, `:2193`, `:2416`, `:2680`, `:3485`. None touches R2a's spans
  (STATE `:1167–1336`, SPECTRUM `:1337–1583` + `:1586–1591`); `:1584`/`:1585` (the appends) stand unchanged between my insertion and both of
  R2a's spans. If R2a removed/trimmed an import at `:71` or `:73`, git will call `:72` adjacent — keep both.
- `tools/rack-deps.mjs` (3 hunks: the seat pass + `fileFills`, the handed-name and null-slot checks, `strayCheck`'s Object.assign) and
  `tests/rack-deps.test.mjs` (+1 law, before the unplanned-file check) — see candidate 1 for R2a.
- `tests/first-run.test.mjs` `imported` reads both import lines (rack.js' two names, persist.js' `deviceQuality`).
- `lab/sw.js`: re-run `node tests/pwa.test.mjs --write` on the merged tip. REPORT.md: R2a's wave 217 and this 218 both append at the end.
- `research/release-0.5.2/lw-facade.json` unchanged (the facade test is green against it).
- `research/release-0.5.2/r3a-measure/` keeps the record: the move script (`r3a-move.mjs`, run from `.tmp/`), the free-name check, this tree's
  `serialize-bytes` reading (`sb-tree.json`) and the verbose classes table.

## 9 · The drafted CLAUDE.md sentence (for the integrator; NOT applied)

> SETTINGS, PERSISTENCE, THE LINKS and THE TRUE HISTORY (0.5.2 R3a) are `lab/shell/settings.js` `createSettings(app)` (§1, created before
> the controller, so it reads `app.ctl.x`, `app.host.camera`, `app.sh.setModArm` and `app.sh.quality` inside callbacks), `lab/shell/persist.js`
> `createPersist(app)` (`serialize` and `restore` whole), `lab/shell/links.js` `createLinks(app)` and `lab/shell/history.js` `createHistory(app)`
> (the HISTORY card with it) — moved verbatim and called at their seats; `readSettings` stays one hoisted line in `boot()`'s head (§0 calls it
> first); `serialize`/`restore`/`save`/`copyJSON`/`esc`/`copyLink`/`lookSync` are registered on `app.sh` for the modules that read them, and a
> slot a module reads that no moved module owns yet is filled in `boot()` right after its declaration.

## 10 · What Josh will see

**Nothing.** The work: `serialize-bytes` 11/11 full and 11/11 edit sha-identical to the recorded base reading — a project, a link and an undo
row are the same bytes. The browser's memory: `settings-probe` judged no scene red (four reached and byte-identical on reload). The facade:
`lw-facade` 1/1 — the same 176 members, kinds and order. The rack: the cards in the same DOM order (read raw on both trees: `transport shadow
spectrum chem orbitals render curves orbit vortex slice calculus meters ladder atoms wigner radiation history settings state palette observer
camera clip`), HISTORY at its seat. The links: B98 / B99 / B128 and `offer`'s pasted link green; the notice: B112 green. The only reds are the
rig's frame-paced waits, reproduced on the base.
