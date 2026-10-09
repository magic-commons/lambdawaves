# C6 · FOLDERS, THE PAGES AND THE ONE PART — build hand-off (2026-10-09, the C6 continuation builder, Opus 5.5)

**In ten lines.** λWAVES' projects are MIR 1.5's FOLDERS now, over ONE project part. The part is `serialize()` /
`restore()` with the notebook as the project's page 0, and `projectKey()` is its signature. `rack.js` builds the part and calls
`createProjects(port)` (`lab/projects.js`). FOLDERS stores through `lab/project-store.js`, a byte-exact translator, so
`lambdawaves.q0.projects` keeps λWAVES' `{ items, recent }` form: every saved project and the RECENT list survive, and a 0.4
build still reads the key. `project-storage.js`, `project-import.js`, the notebook's PROJECTS face and the `.pj-*` CSS are gone.
**`serialize()` is byte-identical on 11 of 11 readings**, base against tree. The new R10 suite is 8 node lines plus 5 browser
cases. The closers are green: `new-project` 8, `history` 42, `offer` 16, `molecule-demos` 5, and `hit-probe-set` 0 of 49.
`lab/*.js` went **30,553 → 30,844 (+291)**. That is not the design's ≈ +50: the two new modules came in at 436 lines against
220 estimated (see Lines). No blockers. Nothing is pushed or merged.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a535a978caceb2b07` |
| branch | `worktree-agent-a535a978caceb2b07`, reset to `9da702d` (the first C6 builder's tip, from `f0fcbc4` = `yan-c` with C0 C1 C4 C5 C9 D9) |
| `7fc6f04` | FOLDERS over the one part: rack.js wired, the old modules, face and CSS out, the two todos, every test/tool site edited |
| `942a2fc` | `tools/serialize-bytes.mjs` and its result `research/release-0.5.0/c6-serialize-bytes.json` (11/11) |
| `6166fa4` | the R10 suite: `tests/project-formats.test.mjs` + `tests/project-formats.browser-test.mjs` |
| `83fe811` | FOLDERS is painted glass where it lands (the occlusion block re-taken when its entrance motion ends) |
| `4dd0a7b` | the docs: this file + REPORT.md wave 206 (after wave 201, the last C wave) |
| hand-offs | `9b4bbe6`, `60662e8`, `4cc311c`, `9fc50eb`, and the final one after `4dd0a7b` |
| the first builder | `443332e` (C6-DESIGN.md, the whole plan) · `b6d61ec` (the two modules, unwired) · `9da702d` (its hand-off) |
| gate servers | 8893 (pid 4170599, this tree) and 8897 (pid 5936, `.tmp/base` = `f0fcbc4`). Both were started by me and stopped by pid; GD ports 5363/5367 |

## What Josh will see

- **▤ in the notebook, O and FILE › SAVE AS / OPEN open FOLDERS.** This is the kit's project window, BASINS' SAVE window retitled. It
  seats on the right of the stage and shows a gallery of tiles with pictures and folders. Its toolbar is SAVE · SAVE AS · NEW · OPEN
  FILE · EXPORT. The notebook no longer has a PROJECTS face.
- **The six demos are tiles in FOLDERS › DEMOS:** WAVE DANCER, WATER, BENZENE, N₂, H₂ σu and HELIUM.
  - They are read-only. A SAVE over one makes "your own copy" beside it.
  - A demo pressed in a 0.4 browser was stored at its path. If that copy is untouched, it becomes the starter where it stands. An
    edited copy stays yours and keeps the path, so no "WATER 2" appears.
- **Project messages are BASINS' toast pill** at the foot of the stage, not a line inside the notebook. `__LW.projects.status` keeps the last one.
- **A picture is taken only while FOLDERS is open,** or when FOLDERS opens over a clean current project that has none. The session's
  first picture runs capture's readability probe: 1,029 ms, worst frame gap 102 ms. Later pictures take 33 ms.
- Nothing else moves. Ctrl+S, NEW and FILE › RECENT work as before. EXPORT downloads the `.lambdawaves.json`. IMPORT takes a `.json`,
  a `.mir` or a PNG. An open never closes the notebook.

## The part's capture / restore road (`rack.js`, the notebook block)

```
part.capture(name)  → { data: projectSnapshot(), notebook: { title (NOTEBOOK → name on a named save), subtitle, text } }
part.restore(v, ctx)→ restore(v.data, { project: true }) !== true ? THROW : notebook put back (the 300 ms debounce dropped,
                      lambdawaves.q0.notebook* written; title falls back to the entry's name) → true
part.signature()    → projectKey()          (no subscribe: FOLDERS draws no head; the session will need one)
```

- **THE OPEN ROAD** is `openPayload(value, meta, rollback)` in `projects.js`, and every open goes through it:
  1. M5b's snapshot (`serialize()`), then `part.restore`. A failure with `rollback` restores the snapshot. If the instrument was
     clean before, it is marked clean again. The line says "… — the previous state is back" or "nothing is current", in λWAVES'
     words (`new-project` 6).
  2. On success: `current`, RECENT and `opened`, the line with D9's notice, the clean mark, then `port.opened(label)`. That runs
     `count()`, `history.clear('open · NAME' | 'new project')` and the landing (show NOTES only for non-blank text), then `render()`.
- **The two callers:**
  - The facade's verbs pass `rollback: true`.
  - FOLDERS' gallery passes `rollback: false`. The kit's `openWithRollback` captures the part and puts it back on failure,
    and its rollback is `restoreProject(parts)`, the part alone.
- **One unsaved mark, FOLDERS'.**
  - The facade's `markClean` pins one signature across every view.
  - After a facade open, save or NEW, FOLDERS is *told* (`openEntry` / `fresh`, forced, restore skipped by a per-call token), so
    its `current`, its tile and its SAVE follow.
  - The facade's clean mark is put back when the telling ends. A pin held over the whole telling leaked into the caller's
    synchronous code (`current` 4 caught it).
- **The doors.**
  - A drop on FOLDERS, OPEN FILE and IMPORT take a `.lambdawaves.json` through `importText`; anything else goes to the kit's intake.
  - 8 MiB is checked before reading, except a PNG, whose project the store caps.
  - A project from another app is refused by name.

## What left and what came (files, lines)

| | lines |
|---|---|
| `lab/project-storage.js` (25), `lab/project-import.js` (41) | **−66** (deleted) |
| `lab/rack.js`: `pjRead/pjWrite`, the `projects` object, `renderProjects`, SAVE AS/EXPORT/IMPORT/demo handlers, the face toggles | **−94** net (5,495 → 5,401; the part, the port, the occlusion provider came back) |
| `lab/projects.js` (the facade + FOLDERS mount + the doors + seed) | **+271** |
| `lab/project-store.js` (the translator, the validator, the file parse, 8/24 MiB, STARTERS) | **+165** |
| `lab/sw.js` (13 kit files now reached: `folders/*`, `core/intake.js`, `png.js`, `zip.js`, `assets.js`, `shell/notice.js`, `pages.js`, `render/plan.js`) | **+13** |
| `lab/settings-store.js` FAMILIES: `lambdawaves.q0.projects.window` (WORKSPACE), `.seeded` (PROJECT) | **+2** |
| `lab/index.html` `.nb-projectsface` (1 line), `lab.css` `.pj-*` (34 lines), `skin.css` (2 rules) | not in the ledger |
| `tests/project-storage.test.mjs` (79), `tests/project-import.test.mjs` (76) | deleted; `project-formats` replaces them (projectKey's dirty-state check ported) |
| `tests/project-formats.test.mjs`, `tests/project-formats.browser-test.mjs`, `tools/serialize-bytes.mjs` | new |

## The byte-identity probe (`tools/serialize-bytes.mjs`)

- **What it reads.** Each reading is `JSON.stringify(serialize())` and `JSON.stringify(serialize({ scope: 'edit' }))`, the undo
  ring's record, each with its sha-256. There are 11 readings:
  - the four demos, opened by the road both builds have (fetch → `importText` → `open`);
  - the empty project (`projects.fresh()`);
  - six history snapshots from that NEW (preset 1s+2pz, stage 0.30, style solid, palette on, Hamiltonian qho, rate 0 → 1.7),
    each flushed into the ring as one row.
- **Normalisation.** Only `presentation.layout.at`, a time stamp, is zeroed, on both sides.
- **Result.** Base (`.tmp/base` = `f0fcbc4`, 8897) against this tree (8893): **11 of 11 identical**, full and edit scope.
  `research/release-0.5.0/c6-serialize-bytes.json` keeps the sizes and the shas (WAVE DANCER 12,725 B · the empty project 10,821 B
  · the six snapshots 11,009–11,021 B). FOLDERS changed the road, not the record.

## The R10 suite (NEW)

`tests/project-formats.test.mjs` (node, 8 judged lines, ~4 s):

| # | proves |
|---|---|
| a1–a5 | five damaged collections (`{`, `null`, `{"items":null}`, `recent: 5`, a bad record) are READ-ONLY. The kit sees an empty library. save / overwrite / remove / a set-aside / an empty replacement are refused with "Stored data was left untouched.". The text is byte-identical, and no other key (no `.refused-` copy) is written |
| a6 | a valid 0.4 collection (WATER, N₂, a saved study, RECENT of two) lists as the ONE part. A kit save adds a fourth, and the three keep path, folder, name, saved, opened, data, notebook and their export byte for byte. RECENT is kept and follows a rename by id. The 0.4 validator reads the result |
| a7 | the round trip is byte-exact through ten kit writes (save, overwrite, rename, move, folder picture, folder rename, seed, refresh, folder delete, remove). Two stored paths that are one name to the kit are numbered apart, never folded |
| b1 | 8 MiB a file, refused before `JSON.parse`. Thirteen malformed envelopes are refused, and a 0.3 file without version or notebook opens |
| b2 | 8 MiB an entry at the store, and an older build's larger entry blocks nothing. 24 MiB the library: three 7 MiB projects fit, the fourth is refused `full` with the numbers, and a remove still goes through |
| b3–b4 | **the 8 vs 24 MB cap**: the kit's intake takes a 10 MiB λWAVES `.mir` (`LIMITS.project` = 24 MiB) and the store refuses to keep it. A BASINS project is refused by name |
| c | **a 1.4 notebook is page 0**: `pageFromNotebook` over `{ title, subtitle, text }`; the same page out of a FOLDERS entry and out of its `.mir`; the six demos are read-only DEMOS starters, each with a page 0 |
| — | the unsaved mark is `projectKey()`: AUTO's domain, the clock and the governor's scale do not dirty a project; a subtitle and a manual domain edit do |

`tests/project-formats.browser-test.mjs` (5/5, where the store is live):
1. A damaged collection survives a reload. The boot seeds nothing over it, and `P.save`, FOLDERS' SAVE AS and `P.importText`
   refuse with the reason. There is no `.refused-` copy.
2. The door. It refuses an 8 MiB + `.lambdawaves.json`, and a 10 MiB `.mir`, before reading them. It refuses a BASINS `.mir` by
   name. It takes a small `.lambdawaves.json` and opens it.
3. R-I3's first half (below).
4. A browser holding only the 0.4 notebook keys boots onto them, and a save carries them into the part as page 0.
5. FOLDERS is painted glass. Paused, its pane where it lands and its 3 chips join the occlusion block (11 → 15) and leave it on close.

## R-I3, both halves

1. **The pages travel with the project.**
   - The notebook rides in the ONE part (`part.capture`), so it is in every FOLDERS entry, the `.json` export (`projectFileText`) and
     the `.mir` / PNG export (the kit's `wrap('project', payload)`).
   - A `.mir` brought back opens with it (browser case 3).
   - The session will carry it the same way.
2. **An open never closes the notebook; it opens it only for non-blank text.**
   - `rack.js` `port.opened`: `if (ta.value.trim()) { show('notes'); … }`. There is no other `show`/`close` on any open road.
   - `new-project` 5 is rewritten over FOLDERS' tiles. NEW, a blank project and a blank tile leave a closed notebook closed and an
     ABOUT face on ABOUT; text opens onto NOTES.
   - `open('projects')` is FOLDERS and leaves the notebook as it is.

## Tests (8893/5363, one browser at a time, 4 s apart)

- `node tests/pwa.test.mjs --write` after every `lab/` edit (291 precached files).
- `bash test.sh node`: exit 0, **81 suites** (82 at base − `project-storage` − `project-import` + `project-formats`).
- Closers, re-run on the committed tree:

  | suite | result |
  |---|---|
  | `new-project` | **8/8** (three runs) |
  | `history` | **42/42** (twice) |
  | `offer` | **16/16** (twice) |
  | `molecule-demos` | **5/5** (the four molecule demos + HELIUM; WAVE DANCER is `new-project`'s and `current`'s) |
  | `project-formats` | node **8** · browser **5/5** |
  | `node tools/new-project.mjs --check` | in step, 16,329 B |
  | `hit-probe-set` | **49 gap presses, 0 reached the stage**, FOLDERS and its rail now scenes |

- Edited for the `__LW` law and green: `menubar` 8/8 · `latex-copy` · `take-in-bugs` 4/4 · `stage-text` 4/4 · `current` 15/15 ·
  `frame-occlusion` 7/7. `tools/settings-probe.mjs` gives 0 of 6 RED.
- **Re-run alone:**
  - `current`. Case 10, the audio face, reads computed colours 250 ms after a CSS change. It was red three times here
    (`followsPalette`, `valuesReveal`), and once on BASE under the same instrumented load (frame gaps of 100–200 ms on the shared
    GPU). It is green 15/15 alone, both instrumented and plain on the final tree (`83fe811`).
  - `settings-probe`. Its first run's WATER open hit the 3 s rAF watchdog; it is green alone.
  - Diagnostic: thumbnails off made `current` green once, which is how the probe cost was found and gated.
- **Not run:**
  - `tests/legacy/boot.browser-test.mjs`. It is legacy, outside the gate, and still names `.pj-import`; it is BRIEF-C6 step 3's closer.
  - `gpu-recovery`. It calls `__LW.thumbnail()` directly, and the banner is untouched.

## Lines

`cat lab/*.js | wc -l`: **30,553 (`f0fcbc4`) → 30,844 (+291)**.
- **Against the design.** C6-DESIGN §9 estimated ≈ +50 for all of C6. Its step 3 (the warning and banner savings against the
  session and opener) about cancels, so ≈ +50 was also its number for this step alone.
- **Where it went over.** rack.js came in at −94 against the design's ≈ −105. The overrun is the two modules: projects.js +
  project-store.js are **436 lines against the 220 estimated** (≈ 83 of them comments). The extra is:
  - the translator's validator and byte-exact round trip, with the kit's name law applied to stored paths;
  - the facade's 14 sync verbs with M5b's roll-back (the `__LW` law);
  - the races found and closed: the per-call skip token, the re-mark after a tell, the stale-thumbnail guard, `stale()`;
  - the doors, the starter adoption for 0.4 browsers, and the landing.
- **What would pay it back.** Step 3's banner and warning facade (≈ −45 against ≈ +65 for the session and opener). Then the tabbed
  notebook (≈ 280 lines of the notebook block; C6-DESIGN §9), which is a Josh ruling.

## Blockers

None.

## Open items and brief candidates

- **C6 step 3 is not built** (BRIEF-C6 §4 commit 3): the session, the opener, the banner, the veil and the wake lock. The part
  needs a `subscribe` for the session (the history's onChange and the notebook's input); the opener's covers need six 9 : 16
  stills (D9's road). See the exact next step.
- **Brief candidate (0.5.x): the tabbed notebook.** `createNotebook({ pages, faces: [notesFace(…)] })` (YOURS + the project's
  pages + the shelf; notes recent 8) changes what the notebook is: text typed into YOURS would no longer travel with a project, and
  NEW would no longer empty it. Keep λWAVES' one notebook as page 0 (as built) unless Josh rules otherwise.
- **Brief candidates for the kit (MIR):**
  1. A `current` setter on FOLDERS (`setCurrent(id, { clean })`). An app with its own open road then needs no forced `openEntry` to
     tell it (the skip token, the re-mark).
  2. A landing hook on `createWindow` (like the modulation window's `onGeometry`), so a host's mask follows the presence motion.
  3. The thumbnail written after `onOpened` should carry a version. Today it can bring back an older payload after a SAVE in between.
     λWAVES guards this with the `at` check.
  4. `createIntake`'s drop and `pick()` call the closure, not the property. An app's door has to re-hook the drop (capture phase),
     so an `ingest` option on `createFolders` would be cleaner.
  5. FOLDERS' first picture runs a 1 s capture probe. The kit could take an app's cheap road first.
- `lambdawaves.q0.projects.window` is classed WORKSPACE as the design said. It is FOLDERS' place, size, sort and open state, and does
  not travel with a project. If Josh reads it as furniture, it is PREFERENCE (one FAMILIES word).
- Merge notes:
  - `rack.js`: the sites are the imports (line 5), the notebook block (the part, `createProjects`, the occlusion provider, `show`'s
    alias), FILE's EXPORT/IMPORT closures, the ACTIONS `folders` row, and the boot's `seed()` before `LW.ready`. C3 owns MENUS and ACTIONS.
  - `settings-store.js`: the PJ_KEY owner text and two rows at the end of FAMILIES.
  - `lab/sw.js` is the standing conflict: take either side, then `pwa --write`.
  - `tests/menubar.browser-test.mjs` lines 190–197 and `tests/access.test.mjs` A4/A6 are mine.

## The draft CLAUDE.md paragraph (replaces "NEW opens the hidden empty project … do not add a hand-kept key list beside it.")

```
PROJECTS are MIR's FOLDERS over ONE project part (lab/projects.js, lab/project-store.js): `lambdawaves` = { data:
projectSnapshot(), notebook } — the notebook is the project's page 0 — signed by projectKey(); serialize()/restore() bytes never
move (tools/serialize-bytes.mjs). `lambdawaves.q0.projects` keeps λWAVES' { items, recent } through a byte-exact translator; an
invalid collection is read-only, 8 MiB a project, 24 MiB the library (tests/project-formats.*). `__LW.projects` keeps every old
verb (`demo(file)` is a DEMOS press, `status` the last line). NEW opens the hidden empty project lab/new-project.lambdawaves.json
through the same restore-with-rollback road; tools/new-project.mjs writes it and --check proves it. The undo ring reads
serialize({ scope: 'edit' }) and writes restore(S, { history: true }); no hand-kept key list beside it.
```

## Exact next step

1. Claude Sos merges `worktree-agent-a535a978caceb2b07` into `sos-s0`, **from this tip, not `b6d61ec`**. Then
   `node tests/pwa.test.mjs --write`, `bash test.sh node`, and `new-project`, `history`, `offer`, `molecule-demos`,
   `project-formats.browser-test` and `hit-probe-set`. If C2 or C3 merged first, run `tools/serialize-bytes.mjs` on the pre-merge
   tip and on the merge; the eleven shas must agree.
2. Then C6 step 3 (BRIEF-C6 §4), from the merge:
   - give the part `subscribe` (the history's onChange and the notebook's input);
   - `createSession({ key: 'lambdawaves.q0.session' })` over the one part, plus a FAMILIES row (PROJECT);
   - `createOpener` (the six demos as covers, NEW, RESUME) with the kit's photosensitivity notice. The `warning` facade keeps its
     members, and its seen-flag is the blob's `warned`;
   - `installBanner` (λWAVES' words, `role="alert"`; `gpu-recovery` reads `#mir-banner .mir-banner-title`), `bootVeil` and
     `installWakeLock({ clock: appPlay })`.
   - Closers: `offer` 16 (`untouched` kept), `tests/legacy/boot.browser-test.mjs`, `gpu-recovery`.
