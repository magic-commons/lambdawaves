# 0.9.1-alpha "Platform" — what changed (Claude Yan / Fable 5.1, 2026-10-16)

The engine plan's D.17. Plan `BUILD-PLAN.md` (Yan, drafted 10-16 04:10 while 0.8.0 built; base filled at the 0.9.0 cut — see "The light check"). ZERO `lab/` lines: a
wrapper never edits the engine. Two Opus builders in sequence: H1 `h1-homecoming`, then H2 `h2-rows` from H1's merge. Build notes: `H1-BUILD.md`, `H2-BUILD.md`.

## The shape
THE WRAPPERS ARE BROUGHT HOME, NOT REBUILT: `worktree-hosts-m0` (eight commits past the merge base `91c90bc`, v0.2.3-alpha.3 of 2026-09-24) merged onto `yan-c` with
every `lab/` difference resolved as `yan-c`'s; `shells/{electron,android,android-webview,ios}` → `tools/platform/`; the store kits and the legal files kept; the
acceptance matrix re-pathed. THE ROWS RE-MEASURED on the current cut with this machine's hosts: the Linux Electron package built, smoke-run, its payload sha and the
field-law line recorded; win32-x64 built not run; Android built if the SDK resolves, else UNBUILT with the reason; iOS "needs a Mac"; the September rows HISTORICAL in
place; paste lines for Josh's devices; the store listings read against README with every unbacked claim listed for him.

## H1 · THE HOMECOMING (`worktree-hosts-m0` at `ab2d450` merged; `tools/platform/{electron 7, android 5, android-webview 20, ios 8}`, `store/` 34, `LEGAL-PROVENANCE.md`, `docs/ACCEPTANCE-MATRIX.md`; `.gitignore`, `tools/build-deploy.mjs`, `RELEASING.md` one line; branch `h1-homecoming` tip `c4cb6c2`; 0 lab lines)
- **Brought home, 76 files:** the four shells moved from `shells/<x>` to `tools/platform/<x>` by `git mv` inside the merge commit — one level deeper, so four scripts'
  relative paths were fixed (`electron/main.cjs` reads `../../../dist`; `electron/package.mjs` and `smoke-run.mjs` use `REPO = '../../..'`; `android-webview/build.sh`
  likewise, copying the probe page from `tools/platform/ios/probe/`) and every `shells/…` reference re-pathed in 20 files (the matrix, `LEGAL-PROVENANCE.md`,
  `tools/build-deploy.mjs` — which now ships `tools/platform/android/assetlinks.json` with the site — 11 store files, six of the shells' own); `store/` (apple 8 · play 5
  · steam 15 · six at its root), `LEGAL-PROVENANCE.md`, `AI_POLICY.md`, `RELEASING.md`, `REPORT.md` stay at their paths. **The only conflict** was `.gitignore`: both
  sides kept — yan-c's device-reports inbox line had been a literal "\n…\n" that matched nothing (written as the pattern meant), hosts-m0's `electron/out/` moved to
  `tools/platform/electron/out/`, its `LANDING PAGE VIDEOS/` line kept. **No `lab/` path differed** — nothing to take as ours, `sw.js` byte-identical; no README,
  CHANGELOG, CITATION, CLAUDE.md or `package.json` change (the shells' devDependencies live in `tools/platform/electron/package.json`; the root delta is zero). No
  `dist/`, `out/` or `node_modules/` entered the index. `RELEASING.md` gains one line under its title: the engine's cuts since v0.5.3 are local on `yan-c` and the push is
  Josh's decision.
- **Corrections to the brief:** hosts-m0 adds 76 files and edits two — `AI_POLICY.md`, `RELEASING.md`, `REPORT.md`, `package.json`, `package-lock.json`, `serve-lan.py`,
  `.github/` and eight docs were already in the merge base `91c90bc` and in `yan-c`; `RELEASING.md`'s dev/main rule is the base's text; the matrix has P03, P04 and P06
  sections and no P08 row (that proof lives in `tools/platform/android-webview/README.md`). **For H2:** the STALE rows all name `91c90bc` (matrix lines 11, 19, 23–25,
  41–42, 46, 50 — Row 0, P03, P04, P06); the store kits' September claims ("54 small molecules, 52 of them playable" where README now says 98 molecules, 61 solved
  live). `tools/perf/bench-chromium.mjs:16` still loads Electron from the hosts-m0 worktree by absolute path — re-point it to `tools/platform/electron/` once H2 has
  run `npm ci` there.
- **Checked:** node 0; rack-deps 0; new-project in step; `provenance.mjs`, `pyscf-table.mjs`, `catalogue-table.mjs` `--check` in step; `tools/build-deploy.mjs --quiet`
  494 files verified (`/.well-known/assetlinks.json` among them), `dist/` deleted after; `lab/` 30,028 before and after.

## H2 · THE ROWS RE-MEASURED
(filled at H2's merge)

## The light check (existing gates only) and the cut
(filled at the cut)

## Known, deferred (recorded)
The iPad M5 and iPhone rows (WKWebView WebGPU — UNVERIFIED until Josh runs the shell and pastes the line); his Windows PC row; MIR mobile (unplanned); the store
listings' final words (his); the push/deploy decision for the whole 0.5.3 → 0.9.1 run; any store submission.
