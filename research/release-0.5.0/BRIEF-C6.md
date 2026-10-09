# BRIEF · C6 — FOLDERS, THE PAGES, ONE PROJECT PART, THE SESSION AND THE OPENER ARE THE KIT'S

Written 2026-10-08 by Claude Yan (the integrator, branch `yan-c`) from PLAN §2 row C6, §9's rulings and the kit's docs. One Opus builder, own
worktree, from the `yan-c` tip AFTER C0, C4 and D9 are merged (the integrator names the sha at launch; C3 may run beside you — two builders on
`rack.js` at a time, in different regions: yours is PROJECTS + the notebook + the boot's banner/veil/wake lock). Size L. Wave 206. Ports 8893/5363
(yours), 8897/5367 (a base copy). You never merge, push, tag or deploy.

## 1 · The contract (PLAN §2 row C6, verbatim)

> **consumer:** FOLDERS + notebook pages + **ONE project part** over `serialize()`/`restore()` (`signature = projectKey()`) + session/opener
> (`createSession`, `createOpener`, `bootVeil`, `installBanner`, `installWakeLock`). **What leaves:** PROJECTS ~330, `project-storage`/`-import` 66.
> **What stays / is new:** serialize bytes identical on the 4 demos + the empty project + 6 history snapshots; NEW R10 fixture suite (an invalid
> collection never becomes an empty writable one; the 8 vs 24 MB cap; a 1.4 notebook → page 0); R-I3 both halves. **Closers:** `new-project` 8,
> `history`, `offer`, `molecule-demos`, the fixture suite.

On today's tree: the PROJECTS block in `lab/rack.js` (grep `function projectKey` ~3884, `pjRead`, the PROJECTS card, `importText`, `P.open`) ·
`lab/project-storage.js` 25 · `lab/project-import.js` 41 · the notebook block (grep `id: 'notebook'`, `nbSaveSize`) · the boot's `#banner`
(role="alert", the one thing a visitor without WebGPU sees), the veil and the wake lock in rack.js `boot()` · `lab/sw-client.js` 206 STAYS (the
offer and `untouched` are λWAVES' install layer; A10/A11/C9 kept the offline layer the app's).

## 2 · The rulings that bind (PLAN §9, CLAUDE.md, docs/STATE-SCOPES.md)

- **R5-A3: ONE project part.** λWAVES' project is `serialize()` / `restore()` with `signature = projectKey()`: FOLDERS' adapter (`folders/project.js`
  contract: capture · restore · signature · thumbnail · empty) wraps THAT, and nothing registers a second part (`installModulation({ project: false })`
  is C4's side of the same ruling). The kit's pages (`shell/pages.js`) ride INSIDE the one part — resolve in your design hand-off how the notebook's
  text and pages are captured by `serialize()` so FOLDERS never sees two parts.
- **The three scopes** (`docs/STATE-SCOPES.md`): a project open leaves `lambdawaves.q0.settings` byte-identical outside the WORKSPACE keys; a
  project never carries a PREFERENCE; **NEW leaves preferences alone** (§9) and opens the hidden empty project `lab/new-project.lambdawaves.json`
  through the same restore-with-rollback road as any project (`tools/new-project.mjs --check` stays exact). The undo ring is the kit's stack with
  ONE domain `edit` (`lab/edit-domain.js`, C5) reading `serialize({ scope: 'edit' })`: `serialize`/`restore`'s shape and bytes do not change.
- **What a browser stored does not change:** FOLDERS takes λWAVES' names — `store: 'lambdawaves.q0.projects'` (PJ_KEY), the window id and prefs
  slot that keep every saved project and layout; the demos (`lab/demos/*.lambdawaves.json`, incl. D9's two) are FOLDERS' seeded starters
  (`folders/seed.js`: added once, a changed bundled starter refreshed in place); the `.pj-demo` buttons become the opener's covers / FOLDERS' starters.
- **The cold start:** `createOpener` (covers = the demos, NEW, RESUME when `session.hasResume()`), `createSession({ key: 'lambdawaves.q0.session' … })`
  over the one part, `bootVeil`, `installBanner` (the WebGPU refusal keeps its words and its `role="alert"`), `installWakeLock`. **The
  photosensitivity pane** is the kit's notice on the opener (§9 default). **`untouched` stays λWAVES' law** (an untouched session takes a waiting
  build itself; `lab/sw-client.js`, the `offer` suite 16): the opener and the session must not make a fresh session look touched.
- **An open never closes the notebook; it opens it only for non-blank text** (CLAUDE.md) — keep, or name the ruling you need.
- **R-I3 both halves** and **notes recent 8 with pages in the project** (§9): read PLAN §3's R-I3 line and apply both halves; say which lines do it.
- **R10 — formats:** the NEW fixture suite proves (a) an invalid or damaged collection in `lambdawaves.q0.projects` is read-only + a notice, never
  replaced by an empty writable one; (b) the size cap — λWAVES' 8 MB today vs BASINS' 24 MB in the kit: keep 8 MB unless §9 says otherwise, and prove
  the cap holds through FOLDERS; (c) a 1.4 notebook (plain text in `lambdawaves.q0.notebook`) opens as page 0.
- **The `__LW` law:** no member a test uses is renamed or removed (`__LW.projects`, `P.importText`, `P.open`, `P.list`, `P.recent`, the demo buttons the
  `molecule-demos` and `history` suites press — grep `tests/` and `tools/` first and keep each as an alias if the kit's name differs).

## 3 · Read first

`research/release-0.5.0/PLAN.md` §2 row C6 + §3 (R-I3, R10) + §9 · `CLAUDE.md` (the scopes paragraph, the history paragraph, the first-run
paragraph) · `docs/STATE-SCOPES.md` · `lab/settings-store.js` (WORKSPACE + FAMILIES: `lambdawaves.q0.projects` / `.notebook*` / `.experiment` /
`.presentation` are PROJECT) · `lab/edit-domain.js` (C5) · `lab/sw-client.js` (what stays) · D9's `D9-BUILD.md` (the restore shim for retired
windows: a file naming one opens on its heir; your FOLDERS open must keep that notice) · the kit: `lab/mir/folders/folders.js` (header),
`folders/project.js`, `folders/files.js`, `folders/seed.js`, `core/project.js`, `core/session.js` (header), `shell/opener.js`, `shell/pages.js`,
`shell/notebook.js`, `shell/banner.js`, `shell/boot.js`; the MIR docs at `~/Documents/MIR/.claude/worktrees/mir-1.5/docs/`: `FOLDERS.md` (§ The
adapter contract · § Seeding · § The retitle hazards · § Not built), `SESSION.md` (§ Preferences against project · § The opener's switches),
`OPENER.md`, `NOTEBOOK.md`, `ADOPTING-1.5.md` §§ 7, 9, 13. `lab/mir/**` is read-only.

## 4 · Commits, in order (each with `C6-HANDOFF.md` committed after it)

1. **The design hand-off (no lab/ code).** The PROJECTS map on your start sha; the adapter: how `serialize`/`restore`/`projectKey`/thumbnail/empty
   meet `folders/project.js`; the store key, window id and prefs slot; the seed list; the opener's covers and switches; what `sw-client.js` keeps;
   the notebook → pages plan under R5-A3; the R10 fixture list; the `__LW` aliases; the line estimate.
2. **FOLDERS over the one part:** the PROJECTS card leaves; `project-storage.js` + `project-import.js` leave (IMPORT = the kit's intake: drop, OPEN
   FILE, a `.lambdawaves.json` or the kit's `.mir`/PNG envelope; another app's project refused with the reason); the demos seeded. Gates:
   `molecule-demos`, `new-project` 8 + `--check`, `history` 39, the SERIALIZE BYTES: a probe (`tools/`) that captures `serialize()` on the 4 demos +
   the empty project + 6 history snapshots on the base copy and on your tree and diffs the bytes — identical.
3. **The session, the opener, the banner, the veil, the wake lock:** RESUME/NEW on a cold start; `untouched` kept (`offer` 16 green, the s9 case
   included); the banner's words and role kept; `tests/legacy/boot.browser-test.mjs` green.
4. **The notebook as pages** (a 1.4 notebook → page 0; the open law kept); the notebook's WORKSPACE sizes (`nbW nbH`) still land in the blob or
   are re-scoped with STATE-SCOPES rewritten — `tools/settings-probe.mjs` zero RED either way.
5. **The R10 fixture suite (NEW, `tests/`):** the three fixtures above, node where possible, browser where the store is live.
6. **Lines, wave, BUILD.** `cat lab/*.js | wc -l` before/after; `node tests/pwa.test.mjs --write`; `bash test.sh node` (only the reds the integrator
   names at launch); REPORT.md `### wave 206: C6 FOLDERS, THE PAGES AND THE ONE PART — …` under `## 2026-10-08 · 0.5.0 C — THE ADOPTION`;
   `C6-BUILD.md` (A7-BUILD.md's shape; the draft CLAUDE.md paragraph replacing the NEW/undo-ring sentences, ≤ 10 lines). Final `C6-HANDOFF.md`.

## 5 · Acceptance

Serialize bytes identical on the 4 demos + the empty project + 6 history snapshots · `new-project` 8 + `--check` · `history` 39 · `offer` 16 ·
`molecule-demos` green · the R10 fixture suite green (invalid collection read-only; the cap holds; a 1.4 notebook is page 0) · a 0.4.0 project file
and a saved library open as before, a file naming a retired window opens on D9's heir with the notice · `settings-probe` zero RED · `legacy/boot`
green · the `__LW` law kept · node gate as at launch · `lab/*.js` down by the amount you measured (PROJECTS ~330 + 66 leave; the adapter comes back)
· no edit under `lab/mir/**` · nothing pushed.

## 6 · Hand-off and harness

Commit `research/release-0.5.0/C6-HANDOFF.md` after EVERY commit (worktree · branch · commits · tests with counts · blockers · exact next step).
Commit messages start with `0.5.0 C6 · `. Never edit `lab/mir/**` or `lab/fonts/**`; after any `lab/` edit `node tests/pwa.test.mjs --write`, then
the suites; subtract, don't add; diagnostics in `tools/`, never `lab/`; the glass is Josh's; one light check per step; a timing red is re-run alone
(the RTX 3070's P5 one-ulp fault); the GPU is shared — one browser suite at a time, 4 s apart; never `pkill -f` — gate server `python3
tools/gate/server.py <your worktree> 8893` in the background, `LW_PORT=8893 GD_PORT=5363 node tests/<suite>.browser-test.mjs`, stop by pid; the
guard refuses compound shell with variables/loops/heredocs/backticks and git outside your worktree — plain commands, scripts under `.tmp/`. FINAL
report: worktree · branch · tip · commits · tests with counts · lines before/after · blockers · brief candidates · what Josh will see or feel · the
draft CLAUDE.md paragraph.
