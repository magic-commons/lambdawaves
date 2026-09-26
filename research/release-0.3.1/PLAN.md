# λWAVES 0.3.1 · THE EMPTY PROJECT AND THE TRUE HISTORY — the plan (Fable, 2026-09-25, for Josh)

**STATUS 2026-09-26: S1–S4 BUILT, VERIFIED AND MERGED on `release-0.3.1` (tip after 980affa).** Each stage: one Opus 5.5
builder in an isolated worktree → a fresh-context Opus verifier (S1 11/11, S2 fix-first then 11/11, S3 12/12, S4 12/12
with a follow-up) → Fable's merge with the node gate, the touched suites and THE DIGEST LOCK. D4 took its escape hatch
(`obs.mode` stays PROJECT; `camMode` left settings). Two older bugs fixed on the way: the demo opened dirty (device-clamped
steps), a route holding the stage wrote its base over a fresh open. Rulings that moved: a stage change is unsaved work
(the 2026-09-10 rule reversed, since the stage is PROJECT); the notebook law never closes an open notebook. lab/ for 0.3.1
(code files, excluding the empty-project JSON and sw.js): +605 −496 over 33 commits. REPORT.md waves 131–132. S5 left:
Josh applies `MIR-CONTRACT-THREE-SCOPES.md` to MIR; the release (RELEASING.md) on his word.

Branch `release-0.3.1` (from `dev` = 4c79b15, after the public `v0.3.0-alpha`). Two large tasks, both Josh's, in his words:

> "What if there was a hidden 'empty project' save file. It has defaults … extremely similar to the new user defaults but
> obviously doesn't mess with preference. The problem is, MIR doesn't have a distinguishing rule between 'Preferences' and
> 'Project Parameters'. … Stage and Background color should be project dependent, but then frame and axes … I'm not sure.
> Notebook needs to reset to empty and Light and Dark mode be unaffected by the saved projects. Modulation needs to clear as
> well in a new project and should default to LFO and Audio with two preset macros already routed from LFO and Audio
> respectively. Linked time (mod and main field clock) should work on the get-go. … If a notebook is noticeably empty and
> untouched, then it never opens with project; but if it's edited in a project, then let it open when project is reloaded.
> … the next large task for 0.3.1 is a true history edit … test it one by one by an Opus 5.5 agent."

Standing laws: subtract, don't add (a feature that adds must delete as much); never edit `lab/mir/**` (MIR first, adopt,
then adapt); the glass is Josh's; `node tests/pwa.test.mjs --write` after any `lab/` edit; THE DIGEST LOCK green on both
fixtures after every merge; diagnostics live in tools/.

## 0. Three facts that change the premise (measured 2026-09-25, read-only sweep with file:line in the sweep report)

1. **A real undo/redo already exists**: `lab/history.js` (a linear timeline with a cursor, `hold`/`release` coalescing on the
   document's pointer capture, `note` on `reg.version`, `goto`, a one-use `historyUndo`), wired at rack.js ≈ 4940–5065 with a
   HISTORY card (last ten rows), EDIT menu rows and Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y / Ctrl+Alt+Z. **It covers only the
   register side** — experiment, hamiltonian, rates, sturmian, damping, the A/B stores — **and the LOOK knobs**. It never
   sees the modulation model, the stage colour, the overlays, the instruments, the palette, the camera. "True history" means
   extending this ring's scope, not building a second one.
2. **NEW is not an empty project.** `projects.fresh()` (rack.js:3962) clears the register, the clock, the notebook text,
   the current-project id and the ring, then leaves everything else as it was: modulation sources/routes/macros, the A/B
   stores (and a *running* A/B transition — `reg.clear()` does not touch `reg.mix`, against the wave-127 rule that every
   road stands A/B down first), the field Bz/Fz, damping, the Hamiltonian and Z, the 91 rates, camera, stage, look,
   palette, overlays, field owners, layout. Measured: the state after NEW serialises to 13 329 bytes against 13 947 for
   the demo just before it. That is the "new project" problem.
3. **Opening any user-saved project overwrites device settings.** `serialize()` writes `ui.theme/card/frost/disc/accent`,
   the camera feel, the field chrome and the palette choice into every project; `restore()` applies them and the roads
   it calls (`setTheme`, `setCardStyle`, `applyLayout`, `notebookResize`, the modulation window's `persist`) write them
   into `lambdawaves.q0.settings`. Wave 129 fixed this for the bundled demo only, by stripping the keys from that file.

## 1. THE LAW — three scopes, and every key lives in exactly one

The principle, in one sentence each (the MIR contract paragraph in §5 says the same in the kit's voice):

- **PREFERENCE** — *the reader's furniture*: how this person, on this device, likes to see and handle any picture. Stored
  in settings. Never written into a project, a link or a history row; never changed by opening one.
- **WORKSPACE** — *the arrangement*: which windows are where, how big, folded or closed. Saved in a project (a demo brings
  its windows — the DAW law) and remembered by the device; the last arrangement wins, whoever put it there. Never in
  history.
- **PROJECT** — *the work*: the physics, the picture and the modulation. Saved in a project; the empty project defines what
  NEW gives you. Every PROJECT key is a history row **except the camera pose** (a view is not an edit), the notebook (text
  is edited in its own editor) and quality (a device budget that rides along as advice).

### 1.1 The table (today's home → its one scope → what changes)

| key(s) | today | scope | change |
|---|---|---|---|
| `ui.theme` light/dark/system | settings AND project; a project open calls `setTheme` → `saveSettings` | **PREFERENCE** (Josh's ruling) | `serialize()` stops writing it; `restore()` ignores it in old files; the DAW-law test flips to "theme unchanged by a project" |
| `ui.card`, `ui.frost`, `ui.disc`, `blur`, `ui.accent {a,b,vivid}` | settings AND project | **PREFERENCE** (wave 125's device-owned material) | as above; `ui` in a file becomes `{ stage }` only |
| tags/badges, control hints, captions, Help, window notes (LEAN), gamut/p3, `warned`, `audioDevice`, key bindings, keyboard-editor position, `nativeLayout`, `phoneTr`/`phoneRack` | settings | **PREFERENCE** | none |
| AUTO SCALE, governor, keepFrames, perfMode, modCadence, modArm, **clockLink** | settings | **PREFERENCE** | none (LINKED is the shipped default, so linked time works from the first play) |
| camera FEEL: `friction`, `spin`/speed, `dragGain`, `fling` | settings AND `presentation.camera` | **PREFERENCE** — D4 | `presentation.camera` keeps `autoRotate` only; restore ignores feel keys in old files (WAVE DANCER's friction 0 no longer travels) |
| camera MODE free/turntable (`camMode` / `obs.mode`) | settings AND `presentation.obs.mode` | **PREFERENCE** — D4 (builder confirms a pose is mode-independent; if a turntable pose needs its mode, `obs.mode` stays PROJECT and `camMode` leaves settings) | serialize drops `obs.mode`; restore ignores it |
| field chrome: `frame`, `axis`, `frameMode`, `axisMode`, `cornerSide`, `invert`, `axisInk` | settings (as chrome) AND `presentation.mat` AND the undo LOOK | **PREFERENCE** — D1 (my call on Josh's open question) | stripped from `serialize().mat` like `bg`/`lightUI`/`stageCustom`; restore ignores; the ring's LOOK drops them (S4) |
| palette: `paletteId`, `palette {on, selected, stops}` | settings (`palette` = the choice) AND project | **PROJECT** — D2 | `saveSettings` stops writing `palette`; boot uses the shipped default; a project (the demo's phosphor) brings its palette |
| `ui.stage {mix, custom, follow}` | project only | **PROJECT** (Josh's ruling) | none |
| `experiment` (modes, preset, Bz/Fz, t, rate, window, damping) | project | **PROJECT** | none |
| `hamiltonian`, `rates`, `rotationRates`, `sturmian`, `wigner`, `mo`, `instruments`, `field` lines, `readers`, `space`, `domain`, `shadow` | project | **PROJECT** | none |
| `mat` LOOK: view, style, exposure, softness, iso, grain, knee, dither, hueShift, boost, gamma, finish, bow, slice, paletteOn | project (+ the ring) | **PROJECT** | none |
| `overlays` (vortex, kepler, particles, dials) | project | **PROJECT** | join the history (S4) |
| `obs` pose (yaw, pitch, dist, fov, quat) + `camera.autoRotate` | project | **PROJECT, not in history** | none |
| `modulation` (sources, macros, routes, transport bpm/sync, seq, v) + `modulationBases` | project | **PROJECT** | joins the history (S4) |
| `ab` (A/B stores, omega, on) | project (+ the ring) | **PROJECT** | none |
| `quality {res, steps, scale}` | project, device-clamped (`deviceQuality`; a file never switches AUTO SCALE off) | **PROJECT, advisory, not in history** — D5 | none in 0.3.1; the empty project carries none |
| notebook text/title/subtitle | beside the project data | **PROJECT, not in history** | the open law (§3.4) |
| `layout` (cards, docked, rackHidden), `closed[]`, notebook size, ABOUT size, `modwin` placement, favourite layouts | settings AND project | **WORKSPACE** | none (last arrangement wins; `restore(…,{history:true})` skips them) |

### 1.2 Decisions (I proceed on my picks; Josh can flip any of them and only that stage moves)

- **D1 frame + axes + the rest of the field chrome = PREFERENCE.** They are already the device's remembered chrome and
  survive a reload today; they are measurement furniture, not the composition (the stage colour is); a viewer's wish to see
  axes should win over an author's, exactly as STYLE-LOCK says of links. Cost: a demo cannot switch your axes off.
- **D2 palette = PROJECT.** The palette is the colour of the picture; WAVE DANCER's phosphor must travel. Cost: the device
  no longer remembers a palette choice across reloads outside a project (the DAW model: work lives in a project).
- **D3 the empty project's register is EMPTY** (no modes, no preset), as NEW is today and as the menubar test pins. The
  hydrogen 1s+2pz greeting is the *boot's* first picture, not a new project's.
- **D4 camera feel and camera mode = PREFERENCE; pose + auto-rotate = PROJECT.** Feel is the hand; the pose is the shot.
- **D5 quality unchanged in 0.3.1** — the tablet law just landed; it stays "advice the device clamps".
- **D6 history scope = PROJECT minus camera pose, notebook and quality.** A view is not an edit.

## 2. What is NOT changed

The loop, the field, the controller, the paced present, THE DIGEST LOCK fixtures (a scope change moves no pixel); the
glass; any file under `lab/mir/**` (one docs-only paragraph is *proposed* to MIR, §5); the project envelope
(`version: 1` stays; old files open, their preference keys ignored).

## 3. TASK 1 — THE EMPTY PROJECT

### 3.1 The file and its generator
- `lab/new-project.lambdawaves.json` — the hidden empty project in the export envelope (`lambdawaves: 'project',
  version: 1, name: 'NEW', notebook: { title: 'NOTEBOOK', subtitle: '', text: '' }, data: { experiment, presentation }`).
  Not under `lab/demos/` (so the PROJECTS face never lists it and `first-run.test`'s demo rules do not apply); precached
  (one sw.js row via `pwa --write`).
- Its `presentation` carries the PROJECT keys at the shipped defaults: stage (mix 0.04, colour [0.12,0.14,0.18], follow
  on), look (the boot's `mat` minus chrome), palette default, overlays off, field lines default, readers default, domain
  auto, shadow default, space 'x', hamiltonian hydrogen Z=1, rates all 1, rotationRates 0, sturmian off, wigner default,
  `obs` at the boot pose with `autoRotate` false, `ab` empty, and **modulation** = sources LFO (`s1`, the SINE preset) +
  AUDIO (`s2`), macros MACRO 1 → named `LFO`, bound `sourceId: 's1'`, MACRO 2 → named `AUDIO`, bound `'s2:level'`, no
  routes, transport bpm 60, `v = MOD_STATE_V`. **No** `quality`, `layout`, `modwin`, `notebook{w,h}` (a missing key keeps
  the live value — the workspace and the device's quality stand). `experiment`: no modes, preset null, Bz = Fz = 0, t 0,
  rate/window/damping at the boot defaults.
- `tools/new-project.mjs` writes that file from the model API (`mod.js` is pure and runs in node) and the defaults, and
  `--check` proves the shipped file is byte-identical to what it would write — the file cannot drift from the format
  (`MOD_STATE_V` bumps are caught). Josh edits either and runs the tool.

### 3.2 NEW = open the empty project
`projects.fresh()` becomes: fetch the file → `restore(data, { project: true })` with the M5b rollback on failure → notebook
text '' / title 'NOTEBOOK' / subtitle '' (also written to the device keys, and the 300 ms `nbPending` debounce cleared —
the sweep found typed text could flush back after NEW) → `pjCurrent = null` → `projectClean()` → the ring cleared with the
bottom row named `new project` → the notebook **hidden** → status `new`. Deleted: the bespoke `reg.clear()`, clock, trail,
dynamics, particle resets (restore does them) — and the running A/B transition is stood down for free. The confirm on
unsaved changes stays (`requestFresh`). The demo button gains the same unsaved-changes prompt (`requestOpen` road).

### 3.3 Linked time on the get-go
`clockLink` ships true (a preference). The host clock runs when any live source exists and the modulation window is
showing (`anyLive`, host.js:226), so with LFO + AUDIO present and no routes, the bound macros move as soon as the field
plays. **Gate:** open the empty project, show the modulation window, play → `LW.mod` transport playing, MACRO `LFO`'s value
changing within 1 s, no `nothing-to-run` refusal. Adding an AUDIO source never asks for the microphone (capture starts
only from the AUDIO face's ARM, modwindow.js:1802) — **gate:** no `getUserMedia` call during NEW.

### 3.4 The notebook law
A project open shows the notebook **iff its text is non-blank** (`text.trim() !== ''`); otherwise it stays hidden, and
NEW hides it. No new stored flag: "edited" is read off the text. The size (`notebook{w,h}`, `layout.nb`) stays WORKSPACE.

### 3.5 Preferences untouched — the strong gate
After any project open (the demo, a saved project carrying foreign `ui.*`/feel/chrome/theme from an older save), the
device's `lambdawaves.q0.settings` minus the WORKSPACE keys (`closed`, `nbW/nbH`, `abW/abH`, `modwin`, `layouts`) is
**byte-identical** to before, and `document.body.dataset.theme` is unchanged.

## 4. TASK 2 — THE TRUE HISTORY

### 4.1 Scope
`readEdit()` = `serialize()` restricted to PROJECT keys minus `obs`, `camera`, `quality`, `layout`, `modwin`,
`notebook`; `writeEdit(S)` = `restore(S, { keepTime: true, history: true })` where `history: true` skips those same keys
and does not clear the ring; `liveKey` = a fast string hash of `JSON.stringify(readEdit())` (no DOM read: `captureLayout`
is excluded). One scope, one reader, one writer — `hRead`/`hWrite`/`hLiveKey`/`hLook`/`hLookKey`/`hLookWrite` and their
hand-kept key lists are deleted.

### 4.2 Triggers
The document pointer capture (`hold`/`release`) already frames every gesture, inside the modulation window too. Two
lines close the gaps: the modulation window's `apply` port (rack.js ≈ 2616, called by modwindow after each of its 56
model edits) calls `hNote()`; `LW.mod.*` host wrappers call it. `reg.version` and the existing direct `hNote()` sites
stay. Names: `hTouchName` learns the modulation window's controls (its own slider/button classes and the window eyebrow),
so a row reads `LFO RATE · MODULATION`, and the ring's bottom row is named for its origin (`boot`, `link`,
`open · WAVE DANCER`, `new project`) via `clear(name)`.

### 4.3 Cost budget (the optimizations must not move)
`note()` arms a timer and nothing else; `liveKey()` runs at a commit (≥ 400 ms quiet) and when the EDIT menu or the HISTORY
card reads `canUndo`/`canRedo` — measured < 2 ms per call on the RTX and ≈ 5 ms on the iPad budget, zero calls per frame;
snapshots ≤ 60 × the project's size (≈ 15–60 kB; ≤ 4 MB); an undo is one `restore` (measured: ≤ 100 ms desktop, the
modulation window rebuilt once — if a rebuild flickers, the writer skips a section whose serialised form is unchanged,
measured first). THE DIGEST LOCK green on both fixtures; the headed bench within noise; `render-exact` unchanged.

### 4.4 The HISTORY card
Lists **every** row (scrollable, newest at the top, the current row marked, ≤ 60 by `depth`), names as above, UNDO / REDO
/ HISTORY UNDO / CLEAR as today. The card's chrome is MIR's device chrome as today (no new skin).

### 4.5 Gates
`tests/history.test.mjs` (node) extended for `clear(name)`; a browser scene per edit family, each "edit → one row named
→ undo restores byte-identical `readEdit()` → redo": a modulation edit through the window (add a source, move a slider,
add a route), the stage colour, an overlay switch, a LOOK knob drag (one row per drag, not per move), a preset, A/B
STORE, an element change; a project open and NEW each start a fresh timeline whose bottom row carries the origin's name;
the camera orbit, a window drag, the notebook typing and a GRID change make **no** row; 60-row depth and the oldest
falling off; `historyUndo` after a jump. Plus the lock ×2, `render-exact`, the node gate, stylehash neutral for every
window but HISTORY.

## 5. MIR — the contract paragraph (proposed, docs-only, Josh merges)

`~/Documents/MIR/docs/CONTRACT.md`, one section, **THE THREE SCOPES**: *Every control a host builds on this kit declares
exactly one scope. PREFERENCE is the reader's furniture (theme, material, motion, hints, keys, the performance budget): it
never travels in a document, a link or a history row, and opening one never changes it. WORKSPACE is the arrangement
(windows, sizes, folds): it travels with a document and the device remembers it; the last arrangement wins; it is never a
history row. DOCUMENT is the work: it travels, and it is the whole of history except the view. A host's NEW opens its empty
document and touches no preference.* No kit code changes; no re-adopt. The λWAVES table (§1.1) ships as
`docs/STATE-SCOPES.md`, linked from `docs/NOTES-FOR-AGENTS.md`.

## 6. Stages — one Opus 5.5 builder each, in an isolated worktree, then a fresh-context verifier, then my merge + gates

| # | stage | files | gate (per stage; the merge re-runs the lock ×2 + node + the browser suites it names) |
|---|---|---|---|
| S1 | **THE SCOPE LAW in code**: serialize/restore stop carrying preference keys (theme, card, frost, disc, accent, camera feel, camera mode, field chrome); `saveSettings` stops writing `palette`; old files open with those keys ignored; `docs/STATE-SCOPES.md` | rack.js (`serialize`, `restore`, `saveSettings`/`applySettings`), `tests/current.browser-test.mjs` (DAW scene: theme and friction *unchanged* by a project; stage, overlays, notebook size, routes still round-trip), a new scene for §3.5, `tests/first-run.test.mjs` (no demo and no `serialize()` carries a preference key), docs | current, menubar, official-defaults-palette, first-run, project-storage, project-import, statelink; pwa; the lock ×2 |
| S2 | **THE EMPTY PROJECT**: `tools/new-project.mjs` + `lab/new-project.lambdawaves.json`; NEW via restore with rollback; the notebook law; the A/B stand-down; the debounce flush; the demo button's prompt | rack.js (`projects.fresh`, `projects.open`, the demo button), tools, the file, sw.js via `pwa --write`, `tests/menubar.browser-test.mjs` (R.fresh still: register empty, current null), a new browser scene (demo → NEW: `readEdit()` equals the file's; modulation = LFO + AUDIO bound, no routes; notebook hidden and empty; theme/settings byte-identical; A/B off; history depth 0 with bottom `new project`; play → macro LFO moves; no getUserMedia), `tests/new-project.test.mjs` (node: `--check` green; the file carries no preference, quality, layout or modwin key) | the above + current, first-run, project-storage; pwa; the lock ×2 |
| S3 | **THE TRUE HISTORY — core**: `readEdit`/`writeEdit`/`liveKey` over the PROJECT scope; `restore(…,{history:true})`; the two trigger lines; names for modulation controls; `clear(name)` | history.js, rack.js (the ring block, `restore`, the modulation port), modwindow.js host side only, `tests/history.test.mjs`, a new `tests/history.browser-test.mjs` (§4.5) | history node, the new browser suite, current, input, render-regressions, render-exact; the lock ×2; the cost budget measured and written into the report |
| S4 | **THE HISTORY card**: all rows, scrollable, names; the bottom row's origin | rack.js (the card block), lab.css if a scroll height is needed | history.browser-test extended; stylehash neutral for every other window; keyboard-window |
| S5 | **Docs + release**: REPORT.md waves 131 (scopes + empty project) and 132 (true history); CHANGELOG; NOTES-FOR-AGENTS; the MIR paragraph as a MIR branch commit for Josh; then RELEASING.md's steps for `v0.3.1-alpha` on Josh's word (ff main, annotated tag, snapshot, build-deploy, `npx wrangler deploy --env=""`, `gh release --prerelease`) | docs | the release gates |

Builder law (from the optimization run): `Agent({ isolation: "worktree" })`, first `git merge --no-edit release-0.3.1`;
one commit per stage with the gates named in its message; `node tests/pwa.test.mjs --write` after any lab/ edit and the
suite re-run; never `lab/mir/**`; probes in `research/release-0.3.1/probes/<stage>/`; hand back a report with numbers.
Verifier law: a fresh Opus 5.5 agent reads the stage's acceptance list and the diff, tries to break it in the browser,
and reports CONFIRMED / BROKEN per item before I merge. Wave numbering continues REPORT.md: 131, 132.

## 7. Risks, and what catches each

- **A scope move loses a behaviour someone relied on** (the palette not surviving a reload; a demo's friction 0): named in
  D1–D5; the reload-restore of the last project is a 0.3.2 candidate ("reopen where you left off"), not this release.
- **Old saved projects**: their preference keys are ignored, never migrated away — a file still opens byte-for-byte on the
  PROJECT keys (`project-import` + a round-trip fixture from a 0.3.0 save).
- **The ring grows expensive**: the §4.3 budget is measured by the builder and the verifier, on the RTX and against the
  iPad's frame budget; `liveKey` never runs per frame (asserted: zero calls during a 5 s play in the browser test).
- **Undo rebuilds the modulation window visibly**: measured; the unchanged-section skip is the fallback, written only if
  needed.
- **The test slicers**: `tests/project-storage.test.mjs` slices rack.js by markers (`function projectSnapshot()`,
  `const projects = {`, `function renderProjects()`) — the markers must survive and no new eager top-level identifier may
  enter `projects`.
- **sw.js**: a new precache row and re-hash; the demo/new-project hash pins in `pwa.test`.

## 8. Not in this release (recorded, not lost)

Reopen-last-project at boot (session restore); history rows for notebook text; per-key history diff labels ("exposure
0.5 → 0.7"); the phone block seam and seams 13–17 (NEXT-MOVES 130); waves 131–132 of the optimization run renumbered as
NEXT-MOVES items (the WebKit cold-visit warm-up; the deployed origin's cache headers and the `+` filename).
