# C6 · HAND-OFF (usage pause, 2026-10-08)

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a61a67e5a1ec8eb66` |
| branch | `worktree-agent-a61a67e5a1ec8eb66` (reset to `f0fcbc4`, the `yan-c` tip with C0 C1 C4 C5 C9 D9) |
| ports | 8893 / 5363 (this tree) · 8897 / 5367 (the base copy at `.tmp/base`, extracted from `f0fcbc4`, gitignored) |
| servers | none were started (nothing to stop) |

## Commits

1. `443332e` — `0.5.0 C6 · the design hand-off` (`C6-DESIGN.md`, no lab/ code). **Read C6-DESIGN.md first: it is the whole plan.**
2. `b6d61ec` — `WIP 0.5.0 C6 · lab/project-store.js + lab/projects.js, written, unwired, unrun — UNVERIFIED …`
3. this hand-off commit

## What the WIP commit holds (UNVERIFIED: nothing imports these files yet, nothing has run them)

**`lab/project-store.js`** — pure. It loads in node; that is the only check run.
- `validateProjectCollection` and `readCollection`.
- `toFiles` / `fromFiles`: the translator between λWAVES' `{ items, recent }` and the kit's files envelope. It is designed to round
  trip byte-exact; that is unproven.
- `createProjectStore(ls)`: the Storage-shaped shim FOLDERS gets as `storage`.
  - Under `lambdawaves.q0.projects` it shows the kit envelope and writes λWAVES' form back.
  - An invalid collection is read-only (R10 a).
  - It refuses an entry over 8 MiB (R10 b).
  - Every other key passes through.
- `touchRecent` (RECENT, 8 kept), `parseProjectFile` (the old `parseProjectImport` with the 8 MiB cap) and `projectFileText`.
- `STARTERS` (the 6 demos, read-only, in DEMOS; revision = the file's `saved`) and `starterOf`.

**`lab/projects.js`** — `createProjects(port)`.
- It calls `registerProjectPart('lambdawaves', port.part)` and builds `createFolders` over the shim.
- The facade keeps every old verb: list, recent, current, dirty, markClean, discard, requestOpen, requestFresh, save, open, remove,
  fresh, exportText, importText. It adds `demo(file)` (the alias of a `.pj-demo` press), `download()`, `pick()`, `status` and `seed()`.
- `openPayload` is the one open road, with M5b's roll-back on the facade roads.
- The `tell()` ping syncs FOLDERS' current and clean mark after a facade open, save or NEW.
- The intake wrapper takes `.lambdawaves.json` in and applies the 8 MiB cap at every door.

Known todos inside `projects.js`:
- the `onOpened` notice re-toast needs a once-flag (today it can repeat after a save);
- `unavailable()` should toast once per reason, because `list()` and `recent()` call it on every read.

**The node gate is expected RED at the WIP tip** because of these two orphan modules. Nothing reaches them yet, so the
wiring and pwa tests will flag them. The integrator should not merge the WIP tip as it stands.

## Tests

- None run, beyond `node -e import(...)` of the kit's `files.js`, `seed.js` and `pages.js`.
- Node gate: green at `443332e` (design only). It is unknown, and expected red, at the WIP tip.

## Lines

`cat lab/*.js | wc -l` was 30,553 at `f0fcbc4`. It is unmeasured at the WIP tip; the two new files add about 330 lines, which the
wiring step pays down. The estimate for the finished C6 is about flat (C6-DESIGN §9).

## Blockers

- None. These design calls may need the integrator's ratification (C6-DESIGN §6, §9):
  - λWAVES' notebook stays the project's page 0 inside the one part. The kit's tabbed `createNotebook({ pages })` (YOURS + the
    shelf) is NOT adopted, because it changes what the notebook is.
  - The measured line ledger will be about flat, not down.
  - FOLDERS speaks through the kit toast (BASINS', §9's default). The suites read `__LW.projects.status` in place of `.pj-status`.

## Exact next step for a fresh agent (from this tip)

1. Read `research/release-0.5.0/C6-DESIGN.md`, then `lab/project-store.js` and `lab/projects.js`.
2. Wire rack.js:
   - Replace lines 5–6, the imports of `project-storage.js` / `project-import.js`, with `import { createProjects } from './projects.js'`.
   - Inside the notebook block, keep `modulationBases`, `projectSnapshot`, `projectKey` and `beforeunload`.
   - Define `part = { capture(name) → { data: projectSnapshot(), notebook: { title (NOTEBOOK → name), subtitle, text } }, restore(v, ctx)
     → restore(v.data, { project: true }) or throw, then put the notebook back (drop the 300 ms debounce, write the NB keys),
     signature: projectKey, subscribe }`. Fire `subscribe` from the history's onChange and from the notebook's input.
   - Replace `const projects = {…}` through line 3987 (`renderProjects`, the SAVE AS / EXPORT / IMPORT / `.pj-demo` handlers) with
     `createProjects(port)`. The port is:
     - `host: floats`, `part`, `snapshot: () => JSON.parse(JSON.stringify(serialize()))`, `rollback: (S) => restore(S) === true`;
     - `busy(±1)`, `notice: () => restoreNotice`, `thumbnail: () => LW.thumbnail()`, `confirm: (m) => window.confirm(m)`;
     - `onMoved: occlusion.dirty`;
     - `opened(label) { count(); history && history.clear(label); if (ta.value.trim()) { show('notes'); nb.dataset.mode = 'view'; } render(); }`;
     - `titleAfterSave(name)`, which sets the title to the name when it reads NOTEBOOK and returns whether it did.
   - The ▤ button and the ACTIONS `folders` row become `projects.folders.toggle()`.
   - `layout.notebook.open('projects')` becomes an alias that opens FOLDERS.
   - The FILE menu's EXPORT / IMPORT rows call `layout.projects.download()` / `.pick()`.
   - Add an occlusion provider for `projects.folders.win.root` and its rail.
   - Await `layout.projects.seed()` before `LW.ready`.
3. Clean up the old pieces:
   - Delete `.nb-projectsface` from `lab/index.html`, and the `.pj-*` rules from `lab.css` (90–152, 868) and `skin.css` (46, 514).
   - Delete `lab/project-storage.js`, `lab/project-import.js`, `tests/project-storage.test.mjs` and `tests/project-import.test.mjs`.
   - Add the FAMILIES rows in `lab/settings-store.js`: `lambdawaves.q0.projects.window` (WORKSPACE), `lambdawaves.q0.session` (PROJECT).
4. Run `node tests/pwa.test.mjs --write`, then `bash test.sh node`.
5. Rewrite the test sites listed in C6-DESIGN §8: `.pj-demo` click → `__LW.projects.demo(x)`; `.pj-status` → `__LW.projects.status`.
6. Write `tools/serialize-bytes.mjs` and diff against the base copy on 8897. Run `molecule-demos`, `new-project`, `history` on 8893/5363.
7. Commit `0.5.0 C6 · FOLDERS over the one part …`, then commit this hand-off.
8. Continue with BRIEF-C6 §4 steps 3–6:
   - 3: the session, the opener, the banner, the veil, the wake lock;
   - 4: the notebook as page 0;
   - 5: the R10 suite `tests/project-formats.test.mjs`;
   - 6: the ledger, REPORT wave 206 and C6-BUILD.md.
