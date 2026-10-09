# C6 · THE DESIGN HAND-OFF — FOLDERS, THE PAGES, ONE PROJECT PART, THE SESSION AND THE OPENER

Written 2026-10-08 by the C6 builder (Opus 5.5) on `f0fcbc4`, before any `lab/` edit. This is commit 1 of BRIEF-C6 §4: the map,
the decisions and the estimate. Where this file and BRIEF-C6 differ, this file says why. Nothing here is built yet.

## 0 · In twelve lines

1. **FOLDERS replaces the PROJECTS face.** The notebook's ▤ (and O, and FILE › SAVE AS / OPEN) open the kit's FOLDERS window in
   `#floats`. The `.nb-projectsface` markup, `renderProjects` and the `.pj-*` CSS leave. `project-storage.js` and `project-import.js` leave.
2. **ONE project part, `lambdawaves`**, registered once in the kit's shared registry: `{ data: projectSnapshot(), notebook: { title,
   subtitle, text } }`. FOLDERS, the session and the project ZIP all read that one part. `serialize()` is not touched, so its bytes cannot move.
3. **The stored collection does not change format.** `lambdawaves.q0.projects` stays λWAVES' `{ items, recent }`. FOLDERS reads it
   through a Storage-shaped translator (`createProjectStore`), which shows `createFiles` the kit's envelope and writes λWAVES' form back.
   Every saved project and the recent list survive, and an older build can still read the key.
4. **An invalid collection is read-only.** The translator refuses every write under the key and says so. It is never set aside,
   never emptied and never replaced (R10 a).
5. **The 8 MiB cap holds through every door**: `importText`, a drop on FOLDERS, OPEN FILE and the store itself (R10 b).
6. **The demos are FOLDERS' starters**: 6 read-only entries in `DEMOS`, seeded once, refreshed when a demo file's `saved` changes.
   `projects.demo(file)` is the alias of a `.pj-demo` press.
7. **λWAVES' `projects` API stays, verb for verb** (the `__LW` law). It is a facade over FOLDERS' store. It keeps its sync `open`,
   `save(path)`, `importText`, `fresh` and their M5b roll-backs.
8. **The session** is `createSession({ key: 'lambdawaves.q0.session' })` over the one part. **The opener** is `createOpener` (the 6
   demo covers, NEW, RESUME) with the kit's photosensitivity notice. A driven browser, a link and `?preset=` skip the opener.
9. **`untouched` stays λWAVES' law.** NEW and boot are still the `boot` origin and clean. RESUME is the `resume` origin, which is offered.
10. **The banner** is `installBanner` (role="alert", λWAVES' words). **The veil** is `bootVeil` over the stage only. **The wake lock**
    is `installWakeLock({ clock: appPlay })`.
11. **The notebook stays λWAVES' one page.** It is page 0, carried inside the one part in the form 0.4 reads. The kit's tabbed
    `createNotebook({ pages })` (YOURS + project pages + the shelf) is **not** adopted here, because it changes what the notebook is
    (§6). The 1.4 → page 0 mapping is `pageFromNotebook`, which is tested.
12. **Estimate:** `lab/*.js` 30,553 → about 30,400–30,500 (−50 to −150). It is not −396: the adapter, the translator and the
    session/opener wiring come back (§9).

## 1 · The PROJECTS map on `f0fcbc4`

| where | what | fate |
|---|---|---|
| `lab/rack.js` 3776 | `NB_KEY NB_TITLE NB_SUBTITLE PJ_KEY` | NB_* stay (the notebook). PJ_KEY moves to `lab/projects.js` |
| `rack.js` 3822–3824 | `pjRead` / `pjWrite` over `readProjectCollection` | leave; the translator reads and FOLDERS writes |
| `rack.js` 3825–3861 | `modulationBases`, `projectSnapshot`, `projectKey`, `projectClean/Dirty`, `discardProject`, `beforeunload` | **stay in rack.js** as the one part's capture/signature (they read boot closures); clean/dirty become FOLDERS' mark |
| `rack.js` 3870–3875 | `.pj-status` role="status", `pjStatus`, `pjTouch` | `pjStatus` → FOLDERS' voice (the kit toast, BASINS'); the last sentence is `projects.status`; `pjTouch` → the facade's `recent` |
| `rack.js` 3876–3945 | `const projects = { list recent current dirty markClean discard requestOpen requestFresh save open remove fresh exportText importText }` | → `createProjects()` in `lab/projects.js`, same verbs. The notebook half of `open` (the landing law, the debounce drop, `count`, `render`) stays in rack.js as `landNotebook()` |
| `rack.js` 3946–3970 | `renderProjects` (folders, roots, list, ×) | leave; FOLDERS' gallery is the list |
| `rack.js` 3971–3987 | SAVE AS, path keydown, EXPORT, IMPORT, the 6 `.pj-demo` handlers, the ▤ button | leave; ▤ toggles FOLDERS; EXPORT → `projects.download()`; IMPORT → `projects.pick()` |
| `rack.js` 3988 | `layout.projects = projects` | stays (the facade) |
| `rack.js` 4017 | `show('projects')` → `renderProjects()` | leaves; `layout.notebook.open('projects')` becomes an alias that opens FOLDERS |
| `rack.js` 3707–3711 | FILE menu: OPEN/SAVE AS → `notebook.open('projects')`; EXPORT/IMPORT click `.pj-export`/`.pj-import input` | the alias keeps the first; EXPORT/IMPORT call `projects.download()` / `projects.pick()` (two closures, C3's region) |
| `rack.js` 4498–4502 | ACTIONS `save`, `saveAs`, `folders` | `save` and `saveAs` unchanged (the alias). `folders` → `layout.folders.toggle()` (one line) |
| `rack.js` 5414–5468 | `const warning` (`#warnPane`, `needed`, `onAccept`, `reset`) | → a facade over the kit's `photosensitivityNotice`, same members |
| `rack.js` 538–545, `main.js` | `showBanner` / the boot-failed banner over `#banner` | → `installBanner` + `fail(title, text)` |
| `lab/project-storage.js` 25 · `project-import.js` 41 | validator, reader, envelope parse, 8 MiB | **leave**; the validator and the parse move into `lab/projects.js` |
| `lab/index.html` 106 · 146 · 153–176 | `.nb-projectsface`, `#banner`, `#warnPane` | leave |
| `lab/lab.css` 90–152, 314–331, 607–651, 868 · `skin.css` 46, 514 | `.pj-*`, `#banner`, `#warnPane` | leave (`.nb-projects-btn` stays) |
| `tests/project-storage.test.mjs` · `project-import.test.mjs` | the two modules' suites | leave; **the R10 fixture suite** replaces them |

## 2 · The adapter: `serialize` / `restore` / `projectKey` / thumbnail / empty meet `folders/project.js`

```
registerProjectPart('lambdawaves', part)            // ONE part, in the kit's shared registry (core/project.js)
part.capture()      → { data: projectSnapshot(), notebook: { title, subtitle, text } }    // what a saved item carried, minus its metadata
part.restore(v, c)  → restore(v.data, { project: true }) + the notebook put back; THROWS when restore() answers false
                      (core/project.js reports a throw as `failed: ['lambdawaves']`, which restoreOk reads as "did not take")
part.signature()    → projectKey()                  // the unsaved mark: WORKSPACE, quality, steps, a bound macro's value ignored
part.subscribe(fn)  → the history's onChange + the notebook's input (one call per change: the session and FOLDERS' mark repaint)
createFolders({ adapter: { restore, empty, thumbnail: LW.thumbnail } })   // capture, signature and subscribe stay the kit's defaults
adapter.restore(payload, entry)   entry absent → a ROLLBACK (the kit's guarded): restoreProject(payload.parts) and nothing else
                                  entry present → THE OPEN ROAD (below) without λWAVES' own roll-back (the kit rolls back)
adapter.empty()                   → THE NEW ROAD (fetch lab/new-project.lambdawaves.json, then the open road); answers 'new'
                                    (the kit says an app's string), or { ok: false, why } with λWAVES' words
adapter.thumbnail()               → LW.thumbnail() (C9 · R14: the canvas when this browser can read it, else the GPU readback's PNG)
```

**THE OPEN ROAD** is one function, `openPayload(value, meta, { rollback })`, used by every open:
- `before = serialize()` (M5b's snapshot, kept for the facade roads), then `part.restore(value)`.
- A failure with `rollback: true` restores `before` and re-applies the old mark. It says "… — the previous state is back", or
  "nothing is current" (λWAVES' words, kept byte for byte for `new-project` 6).
- A success runs the bookkeeping:
  - the notebook landing (R-I3's second half): show NOTES only for non-blank text, never hide;
  - the 300 ms debounce dropped;
  - `history.clear('open · NAME' | 'new project')`;
  - `current`, `recent` and the status line with D9's `restoreNotice`.
- The facade calls it with `rollback: true`. FOLDERS' gallery calls it with `rollback: false`, because the kit's `openWithRollback` puts
  back its own capture.

**`current` and the clean mark are FOLDERS' own** (one truth):
- `projects.dirty` = `folders.dirty()` known and dirty. `markClean` marks every FOLDERS view clean.
- A facade open or NEW (sync, for the tests and the menus) then pings FOLDERS with `openEntry(id, { force })` or `fresh({ force })`.
  `adapter.restore` / `empty` skips the second restore for that one call. So FOLDERS' `current`, its `data-current` tile and its
  clean signature follow every road. The only cost is one capture.
- FOLDERS' `onOpened` / `onSaved` set the facade's `current` and `recent`. It never learns a second `current`.

## 3 · The store key, the window id, the prefs slot

- **store** `lambdawaves.q0.projects` (PJ_KEY) — unchanged, and **unchanged in format**:
  - `createFolders({ store: PJ_KEY, storage: createProjectStore(localStorage) })`.
  - The translator's `getItem(PJ_KEY)` gives `createFiles` the kit's envelope:
    - one entry per item, in the stored order;
    - `id` = the item's `f<n>`, or assigned in order;
    - `at` = `Date.parse(saved)`;
    - `payload` = `{ parts: { lambdawaves: { data, notebook } } }`;
    - `bytes` = the kit's own reprice.
  - `setItem(PJ_KEY, envelope)` writes λWAVES' form back:
    - `{ items: { [folder/name]: { path, folder, name, saved, opened, data, notebook, id, thumb?, facts? } }, recent, seq, folders? }`;
    - `recent` remapped by id (a rename keeps its row);
    - `opened` kept by id.
  - The round trip is byte-exact, because the kit's conflict check compares `getItem` texts. A node test proves it.
  - `recent` stays λWAVES' (8 kept, the FILE menu shows 5). FOLDERS never sees it.
- **window id** `folders`:
  - λWAVES had no project window before, so there is no older id to keep.
  - The ACTIONS row and the ▤ button's `data-key-action` are already `folders` (R-K1: O).
  - DOM id `#folders`, `data-mir-window="folders"`, mounted in `#floats`, so C9's `uiSpace` guards it with no new code.
- **prefs slot** — FOLDERS' default for that store, `lambdawaves.q0.projects.window` (place, size, open, rail side, sort). It is a
  FAMILIES row in `lab/settings-store.js`, scope **WORKSPACE**. It is NOT a key in the settings blob, so it never touches C3's
  `createRack({ store })` road or the WORKSPACE table.
- New FAMILIES rows:
  - `lambdawaves.q0.projects.window` → WORKSPACE;
  - `lambdawaves.q0.projects.seeded` → PROJECT (the store's own once-list);
  - `lambdawaves.q0.session` → PROJECT.
  - `settings-probe` classifies by these rows.
- **occlusion**: one provider for the FOLDERS window and its rail, with `onMoved: occlusion.dirty`, so a moved window presents
  while paused (CLAUDE.md's mask law). C8 will replace it with the kit's `paintedSpace`.

## 4 · The seed list

| id | file | name | folder |
|---|---|---|---|
| `demos/wave-dancer` | `lab/demos/wave-dancer.lambdawaves.json` | WAVE DANCER | DEMOS |
| `demos/water` | `water` | WATER | DEMOS |
| `demos/benzene` | `benzene` | BENZENE | DEMOS |
| `demos/n2` | `n2` | N₂ | DEMOS |
| `demos/h2-sigma-u` | `h2-sigma-u` | H₂ σu | DEMOS |
| `demos/helium` | `helium` | HELIUM | DEMOS |

- All six are `readOnly`. Each starter's `revision` is its file's own `saved` stamp, so a remade demo refreshes in place and the
  table never needs a hand-bumped number.
- They are fetched once per boot (the service worker's precache answers), awaited before `LW.ready`, and seeded through `folders.seed()`.
  The kit adds each starter once, keeps a deleted one deleted, and never overwrites the user's project of the same name.
- The paths are the demo files' own (`DEMOS/WATER` …), so `P.open('DEMOS/WAVE DANCER')` keeps working.
- `importText` of a file whose payload is byte-identical to the entry already at its path returns that path. Re-importing a demo
  does not duplicate it, and the history origin stays `open · WAVE DANCER`.

## 5 · The opener's covers and switches; what `sw-client.js` keeps

- **main.js decides the start:**
  - driven (`navigator.webdriver`), or a link in the fragment, or `?preset=` / `?view=`: no opener, choice = `?starter=` or `boot`.
  - Otherwise `createOpener({ covers, session, notice, warn: 'once', logo: 'λWAVES' }).start()`.
  - The boot runs **behind** the opener (it is opaque), and `boot()` awaits the choice before `LW.ready`.
- **covers** — the six demos:
  - `id` = the file, `name` = the demo's name;
  - `art` = `img/covers/<file>.jpg`: 9 : 16 stills made by the app itself, D9's road (`.tmp/make-covers.mjs`, not committed);
  - `accent` per demo.
- **choices:**
  - `home` (NEW) → the shipped boot scene, `session.discard()`. λWAVES' boot is its "new"; FILE › NEW is still the empty project.
  - `resume` → `session.resume()`, origin `resume`.
  - a cover → `projects.demo(id)` + `session.discard()`.
- **the notice** — the kit's `photosensitivityNotice`:
  - λWAVES' title and body from `#warnPane`, `art: img/warning-orbital.png`;
  - its seen flag is the settings blob's `warned` (a Storage-shaped adapter), so a browser that accepted it is not asked again;
  - a direct visit (link / `?preset=`) still shows it once to a first-time visitor;
  - `warning` keeps `show dismiss needed onAccept reset seen remembered open` over the kit's promise. `?play=1` still waits for it.
- **`sw-client.js` keeps all of it**: the offer, the quiet take, `getProjects()` (`dirty`, `markClean`) and `untouched`.
  - `untouched` keeps its definition: one ring row named `boot` or `link`, clean, nothing pending.
  - The session never adds a ring row. Its autosave is not an edit. NEW and the boot keep the `boot` origin.
  - A resumed session is origin `resume`, which is offered rather than taken (a reload shows the opener again). This is
    conservative, and no work is at risk either way: the session is flushed on `pagehide`.

## 6 · The notebook → pages, under R5-A3

- **What the kit has.**
  - `shell/pages.js`: a page model.
  - `shell/notebook.js` with `pages`: tabs, where **YOURS** is the browser's note and pages 0…n are the project's.
  - `notes/`: a shelf of the user's own notes, kept apart from FOLDERS (Josh's MIR ruling of 10-01).
- **What λWAVES has.**
  - One notebook whose text **is the project's notes**: saved with it, emptied by NEW, landed on when an open has text.
  - The `current` and `new-project` suites assert exactly that.
- **Taking the tabbed notebook changes those semantics.**
  - Text typed into YOURS would no longer travel with a project.
  - NEW would no longer empty it.
  - That is a ruling (Josh's, or the integrator's from Josh's 10-01 words), and it is not in C6's "what leaves".
- **C6 therefore does the R5-A3 half.**
  - The one notebook is **page 0 of the project**, carried **inside the one part** as `notebook: { title, subtitle, text }` (the
    form 0.4 reads; a 0.4 build opens a 0.5 file's notes).
  - `pageFromNotebook` is that page in the kit's shape. The R10 suite pins it.
  - The tabbed `createNotebook({ pages, faces: [notesFace(...)] })`, with its YOURS/pages split and `notes recent 8`, is the named
    next step. It is a brief candidate, with the exact wiring in NOTEBOOK.md.
- **R-I3, both halves:**
  1. **pages travel with the project.** The notebook rides in the one part, so it is in FOLDERS' entries, the `.mir` and PNG exports,
     `exportText` and the session.
  2. **an open never closes the notebook.** `openPayload`'s landing only ever shows NOTES. `new-project` 5 is rewritten for FOLDERS'
     road and keeps the law.
- **The sizes** `nbW nbH abW abH` stay in the settings blob as WORKSPACE. The notebook block keeps them, so STATE-SCOPES needs no
  rewrite for sizes and `settings-probe` sees no change.
- **"a 1.4 notebook → page 0"** (R10 c), concretely:
  - A browser with the 1.4 keys (`lambdawaves.q0.notebook*`) and no session record boots onto those words as the live project's page 0.
  - The first autosave carries them into `lambdawaves.q0.session`'s part.
  - A 1.4 project file's `notebook` opens as page 0.
  - `pageFromNotebook(record)` gives `{ title, md }` with the subtitle as its first italic line.

## 7 · The R10 fixture suite (`tests/project-formats.test.mjs`, node; plus one browser case)

| # | fixture | proves |
|---|---|---|
| a1–a5 | the stored text `'{'`, `'null'`, `'{"items":null}'`, `'{"items":{},"recent":5}'`, a bad record | the store reads empty, `files.save` / `overwrite` / `remove` refuse with a reason, the stored text is byte-identical after, and no `.refused-` key is written |
| a6 | a valid 0.4 collection (3 items, recent) | lists all three through `createFiles`; a save adds a 4th; the other three are byte-identical in the stored JSON; `recent` is kept |
| a7 | a round trip | `getItem` → kit save → `getItem` is byte-exact (no false "changed in another tab") |
| b1 | `parseProjectFile` of 8 MiB + 1 | refused before `JSON.parse` |
| b2 | a `files.save` whose entry exceeds 8 MiB (capChars raised to isolate the store) | refused, the store untouched |
| b3 | the FOLDERS door (`ingest` wrapper) with a Blob of 8 MiB + 1 | refused by size before reading |
| b4 | a `.lambdawaves.json` carrying another app's envelope, and a `.mir` of another app | refused, with the reason |
| c1 | `pageFromNotebook({ title, subtitle, text })` | page 0 = `{ title, md: '*subtitle*\n\n' + text }`; an empty notebook gives no page |
| c2 | a 1.4 file opened through the facade (browser case in `new-project`) | its notebook is the live notebook (page 0) |
| c3 | a 1.4 browser (NB keys, no session) | boots onto them; `session.flush()` writes them into the part (browser case) |

## 8 · The `__LW` law — kept, aliased or moved

| used by tests/tools | after C6 |
|---|---|
| `__LW.projects`, `layout.projects` | the facade (same object) |
| `P.save(path)`, `P.open(path, file)`, `P.importText`, `P.exportText`, `P.list`, `P.recent`, `P.remove`, `P.fresh`, `P.requestFresh`, `P.requestOpen`, `P.discard`, `P.markClean`, `P.current`, `P.dirty` | same names, same sync/async shape |
| `.pj-demo[data-file=X]` click | **`P.demo(X)`**, the alias of the press (the same question, road and status) |
| `.pj-status` / `[data-mir-window="notebook"] .pj-status` text | **`P.status`** (the last sentence; FOLDERS speaks through the kit toast, BASINS' voice, §9's default) |
| `layout.notebook.open('projects')` | kept, as an alias that opens FOLDERS (the face left the notebook) |
| `.pj-item .pj-name` click (`new-project` 5) | FOLDERS' gallery tile (`.sv-card[data-name]`) |
| `localStorage['lambdawaves.q0.projects'].items[path]` (`new-project` 2) | unchanged (the format is kept) |
| `document.getElementById('banner') h3` (`gpu-recovery`) | `#mir-banner .mir-banner-title` (the kit's banner; the words are kept) |
| `__LW.warning` (`hit-probe-set`, legacy) | the facade over the kit notice |
| `P.list().length === 0` after a cancelled demo | before = after (the six starters are there from boot) |

Suites edited for the moved roads: `molecule-demos`, `new-project`, `history` (status reads), `current`, `menubar`, `latex-copy`,
`take-in-bugs`, `stage-text`, `gpu-recovery`, `access` (A4 count, A6 import input). Tools edited: `settings-probe`,
`camera-routes`, `perf/device-report.js`, `perf/bench-firefox.mjs` (only the demo press and the status read). No assertion is loosened.

## 9 · The line estimate (`cat lab/*.js | wc -l`, base 30,553)

| | out | back |
|---|---|---|
| rack.js PROJECTS (3822–3988 less what stays: snapshot/key/discard/landing ≈ 45) | −120 | |
| rack.js `warning` 5414–5468 → facade | −55 | +15 |
| rack.js / main.js banner | −12 | +4 |
| `project-storage.js` + `project-import.js` | −66 | |
| `lab/projects.js` (translator ≈ 70, file parse + 8 MiB ≈ 25, starters ≈ 15, facade + FOLDERS mount ≈ 110) | | +220 |
| rack.js: the part, the session, veil, wake lock, the choice | | +40 |
| main.js: the opener and its notice | | +25 |
| **net** | **−253** | **+304 → ≈ +50** |

- That is honest arithmetic, and it lands around **30,550–30,650, not down**. The facade must keep λWAVES' 14 sync verbs and
  M5b's roll-back (the `__LW` law). The translator is the price of "what a browser stored does not change".
- C6 does delete the PROJECTS UI (≈ 170 lines of rack.js + 66), the `#warnPane` and the `#banner`, and the CSS (≈ 110 lines, not in
  the ledger).
- The brief expected "down"; the measured number goes in C6-BUILD.md, whichever way it falls.
- **The lever that would pay it back** is the tabbed notebook (§6): the λWAVES notebook block (≈ 280 lines) leaves when
  `createNotebook` takes it.

## 10 · Order (BRIEF-C6 §4) and what I will not touch

1. this file
2. FOLDERS over the one part, with the serialize-bytes probe
3. the session, the opener, the banner, the veil and the wake lock
4. the notebook as page 0 (R-I3)
5. the R10 suite
6. the lines, the wave and C6-BUILD.md

I will not touch:
- `lab/mir/**`;
- C3's regions (the layout block, the transport, MENUS beyond the two FILE closures, the keymap);
- C2's (SETTINGS' look groups);
- `serialize()` / `restore()`, whose shape and bytes stay.

Ports: 8893 / 5363 (the tree), 8897 / 5367 (the base copy `.tmp/base`).
