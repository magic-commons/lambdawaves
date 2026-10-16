# 0.9.1 "Platform" — THE BUILD PLAN (Claude Yan / Fable 5.1, drafted 2026-10-16 ≈04:10 while 0.8.0 builds; base filled at the 0.9.0 cut)

The engine plan's D.17 (`../release-0.6.0/PLAN.md` l.307–308: "wrappers in `tools/platform/`; iPad gated on MIR mobile and WebGPU in WKWebView (UNVERIFIED)"; the
ladder row l.47: "the wrappers (desktop; iPad gated on MIR mobile)"). THE MATERIAL ALREADY EXISTS on branch `worktree-hosts-m0` (the stores program, 2026-09-24 →;
125 commits, NOT in `yan-c`): `shells/electron/` (built and measured 2026-09-24: linux-x64 packaged, win32-x64 built), `shells/android/` and `shells/android-webview/`
(P08: the bundled WebView host proof for the WebGPU question), `shells/ios/` (WKWebView, P04), `docs/ACCEPTANCE-MATRIX.md` (one table for every host and device —
"a row is evidence; a missing row is an unknown, never a pass"; every row names the commit it was measured on), the store kits (Steam, Apple, Play listings; the
privacy policy; screenshots; a trailer draft), `LEGAL-PROVENANCE.md`, `AI_POLICY.md`, `RELEASING.md`. Memory: the stores program's plan (`~/.claude/plans/
snoopy-purring-cocke.md`), the WebKit iPad laws (no touch-scroll on a `pointer-events: none` scroller; background reloads), MIR Focus (MIR for mobile is UNPLANNED
and the iPad is gated on it). Josh's dial (09:35): tight, features only, pre-1.0. Base: `yan-c` at the commit carrying the briefs after the v0.9.0-alpha cut (**TO
FILL**); **ZERO `lab/*.js` lines** (a wrapper never edits the engine). Two rows, two Opus builders (the second after the first merges); the integrator merges, runs the
acceptance rows this machine can run, cuts `v0.9.1-alpha` "Platform".

## The shape (the law of this cut)
**THE WRAPPERS ARE BROUGHT HOME, NOT REBUILT.** `worktree-hosts-m0` carries the shells, the matrix and the kits as of September's engine (v0.2.3-alpha.3 at
`91c90bc`); the engine has moved twenty cuts since. 0.9.1 merges that branch's `shells/`, `docs/ACCEPTANCE-MATRIX.md`, the store kits and the legal files onto
`yan-c` (a merge of a long-lived branch: `lab/` differences are resolved in favour of `yan-c` wholesale — hosts-m0's `lab/` is September's and carries nothing
the engine wants; `dist/` is a build product, never merged), renames the shells into `tools/platform/` as the plan names them (one `git mv` each, the matrix's
paths updated), and re-measures EVERY row the acceptance matrix has on the CURRENT cut with this machine's hosts: the Linux Electron package (built, smoke-run, its
payload sha and the field-law line from 0.9.0's test inside the package), the Android bundled WebView (built if the SDK is on this machine, else the row says
UNBUILT with the reason), the iOS shell (built only on a Mac — the row says so). Josh's devices fill their rows by hand: the matrix prints the exact line to paste
(0.9.0's field-law test's line). THE IPAD IS GATED on two things named in the row and not decided here: MIR mobile (unplanned) and WebGPU in WKWebView (the
September row says UNVERIFIED; the row stays UNVERIFIED until Josh runs the shell on the M5 and pastes the line). Every store listing's claim is read against
0.9.0's public face: a listing may say nothing README does not say.

## The rows
| row | what lands | files | Δ lab |
|---|---|---|---|
| **H1 THE HOMECOMING** (Opus) | The merge of `worktree-hosts-m0` into a branch off the base (`git merge --no-ff --no-commit worktree-hosts-m0`; every `lab/**` conflict and difference resolved as `yan-c`'s — `git checkout --ours lab`; `dist/` dropped from the index; `README.md`/`CHANGELOG.md`/`CITATION.cff` as `yan-c`'s with hosts-m0's additions re-applied by hand only where they are platform facts); `shells/*` → `tools/platform/{electron,android,android-webview,ios}` (`git mv`; every path in `docs/ACCEPTANCE-MATRIX.md`, the shells' own scripts and `RELEASING.md` updated); `LEGAL-PROVENANCE.md`, `AI_POLICY.md`, `RELEASING.md`, the store kits kept at their paths (`store/` or wherever hosts-m0 holds them — say); `package.json` scripts for the shells merged without changing the engine's scripts; `node tests/pwa.test.mjs --write` + `./test.sh node` green on the merged tree (the wrappers add no `lab/` line — assert the count unchanged); a note `research/release-0.9.1/H1-BUILD.md` listing every file brought home, every conflict and how it was resolved, and the matrix rows now STALE (they name `91c90bc`). | `tools/platform/**`, `docs/ACCEPTANCE-MATRIX.md`, the store kits, the legal files, `package.json`, `RELEASING.md` | **0** |
| **H2 THE ROWS RE-MEASURED** (Opus, after H1 merges) | On the merged tree at the current cut: build the Linux Electron package from `dist/` made by the tree's own build step (`tools/` or `package.json`'s — find it), smoke-run it (the shell's `smoke-run.mjs`), run 0.9.0's `tests/field-law.browser-test.mjs` INSIDE the package where its driver allows (else the shell's own smoke readback), record the row (date · hardware · OS · runtime · commit · payload sha256[:12] + file count · workload · duration · result · limitations · next); the win32-x64 package built, not run (the row says so); the Android bundled WebView built if `ANDROID_HOME` resolves on this machine (else UNBUILT with the reason); the iOS shell: "needs a Mac" row; a PASTE LINE per device for Josh's hand rows (iPad M5, iPhone, his Windows PC): the exact URL/package and the field-law line format; `docs/ACCEPTANCE-MATRIX.md` gains the rows and marks the September rows HISTORICAL; the store listings read against README (a diff of claims: any sentence a listing makes that README does not is listed in the note for Josh, never pushed to a store); `research/release-0.9.1/H2-BUILD.md`. | `docs/ACCEPTANCE-MATRIX.md`, `tools/platform/**` (build outputs ignored by git), `research/release-0.9.1/H2-BUILD.md` | **0** |

## Laws for both builders
- Your own worktree, your own branch (`h1-homecoming`, `h2-rows`) from the base commit (H2 from H1's merge); NO push; never edit `lab/mir/**`, `lab/fonts/**` or any
  `lab/*.js` (a wrapper never edits the engine — the line count is asserted unchanged); after the merge `node tests/pwa.test.mjs --write` then `./test.sh node`; `node
  tools/rack-deps.mjs --classes`, `node tools/new-project.mjs --check` green. No store account is touched, no upload, no submission: the kits are files in the tree.
- THE LOCK is sacred and trivially so (no `lab/` change); the integrator runs it ×2 at the merge anyway with `--query gastab=0` on BOTH runs.
- Builds that need a toolchain this machine lacks (Xcode, an Android SDK, a Windows runner) are rows that SAY SO — never a guess, never a borrowed log. Never
  `pkill -f`; stop only your own pids; ports 9241, 9443, 8721/8741, 8731/8735 are taken.

## Gates · the cut · what waits on Josh
Node gate 0; the line count unchanged; THE LOCK ×2; the matrix's rows for this machine filled on the current cut; then the local cut `v0.9.1-alpha` "Platform",
CHANGELOG, snapshot. NO push, NO deploy, NO gh release, NO store submission. Waits on Josh: the iPad M5 and iPhone rows (WKWebView WebGPU — the gate the plan
names), his Windows PC row, the MIR-mobile decision (unplanned), the push/deploy decision for the whole 0.5.3 → 0.9.1 run, and the store listings' final words.
