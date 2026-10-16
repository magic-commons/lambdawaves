# 0.9.1 H1 THE HOMECOMING — the build note (Opus 5.5, 2026-10-16)

Branch `h1-homecoming`, from the base `9f67db6` (yan-c after the v0.9.0-alpha cut). One merge commit `49c1537` (`git merge --no-ff --no-commit
worktree-hosts-m0`, hosts-m0 at `ab2d450`, merge base `91c90bc`), then this note's commit. Nothing pushed. `worktree-hosts-m0` and its worktree were only read.

## The line count (the plan's law)
`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l` → **30,028 before, 30,028 after.** No `lab/**` path differed in the merge's index (hosts-m0
changed nothing under `lab/` since `91c90bc`, so `git checkout --ours -- lab` had nothing to take); `node tests/pwa.test.mjs --write` left `lab/sw.js`
byte-identical (398 files precached, cache `lw-lab-dzrnm1pwtjs9`).

## What came home (76 files added, 2 files edited by hosts-m0)
| where it lives now | files | what |
|---|---|---|
| `tools/platform/electron/` | 7 | `main.cjs` (the `lambdawaves://` scheme over `dist/`), `preload.cjs`, `package.mjs`, `smoke-run.mjs`, `dist-hash.mjs`, `package.json` (Electron 44.4.5, @electron/packager 20.3.0), `package-lock.json` |
| `tools/platform/android/` | 5 | the TWA (Bubblewrap 1.25.0): `twa-manifest.json`, `build.sh`, `assetlinks.json`, `README.md`, `.gitignore` |
| `tools/platform/android-webview/` | 20 | P08, the bundled WebView host proof: Gradle project (wrapper jar included), `MainActivity.java`, five launcher PNGs, `build.sh`, `README.md`, `.gitignore` |
| `tools/platform/ios/` | 8 | P04, SwiftUI + WKWebView: five `.swift` files, `probe/probe.html`, `README.md`, `.gitignore` |
| `store/` | 34 | `README.md`, `PRIVACY.md`, `privacy.html`, `capsules.py`, `shots.mjs`, `.gitignore`; `apple/` 8 (CHECKLIST, METADATA, SCREENSHOTS + 5 PNGs); `play/` 5 (ASSETS, LISTING, TESTING + 2 PNGs); `steam/` 15 (ASSETS, COPY, 4 capsule PNGs, 5 screenshots, `steampipe/` README + 3 `.vdf`) |
| `LEGAL-PROVENANCE.md` (root) | 1 | the rights inventory (DRAFT for Josh, dated 2026-09-24 at `91c90bc`) |
| `docs/ACCEPTANCE-MATRIX.md` | 1 | the one table for every host and device |
| `.gitignore` | edit | electron `out/`, `LANDING PAGE VIDEOS/` |
| `tools/build-deploy.mjs` | edit | ships `/.well-known/assetlinks.json` (the TWA's Digital Asset Links) as a deploy-only file |

The four shells were `git mv`'d in the merge commit (`shells/<x>` → `tools/platform/<x>`); no `shells/` directory remains. No `dist/`, `out/` or
`node_modules/` entered the index (0 tracked paths match). `AI_POLICY.md`, `RELEASING.md` and `REPORT.md` stay at the root where they already were.

## Conflicts and their resolution
- **`.gitignore`** — the only conflict. Resolved as the union: yan-c's `research/device-reports/inbox/` line (it was written as the literal `\nresearch/device-reports/inbox/\n`, a pattern that matched nothing; written now as the pattern 762f25a meant), hosts-m0's `shells/electron/out/` re-pathed to `tools/platform/electron/out/`, hosts-m0's `LANDING PAGE VIDEOS/` with its comment.
- **`tools/build-deploy.mjs`** — auto-merged (hosts-m0's two hunks onto yan-c's file); the copied path re-pathed to `tools/platform/android/assetlinks.json`. Checked once: `node tools/build-deploy.mjs --quiet` → "dist/ is complete and verified — 494 files", `dist/.well-known/assetlinks.json` present; `dist/` deleted afterwards.
- `lab/**`, `tests/**`, `research/**`, `README.md`, `CHANGELOG.md`, `CITATION.cff`, `CLAUDE.md`, `package.json`, `package-lock.json`: no conflict and no hosts-m0 change — yan-c's as they were.

## The paths moved (and what named them)
- Depth (the shells sit one level deeper): `electron/main.cjs` `'../../dist'` → `'../../../dist'`; `electron/package.mjs` and `electron/smoke-run.mjs` `REPO = '../..'` → `'../../..'`; `android-webview/build.sh` `ROOT=$HERE/../..` → `$HERE/../../..` and its probe copy from `tools/platform/ios/probe/probe.html`. `node --check` on the three electron scripts and `store/shots.mjs`, `bash -n` on the build script: clean. `android/build.sh` uses only its own directory.
- `shells/(electron|android-webview|android|ios)` → `tools/platform/…` in 20 files: `docs/ACCEPTANCE-MATRIX.md`, `LEGAL-PROVENANCE.md`, `tools/build-deploy.mjs`, store/ ×11 (`README.md`, `shots.mjs`, `apple/CHECKLIST.md`, `apple/METADATA.md`, `play/LISTING.md`, `play/TESTING.md`, `steam/ASSETS.md`, `steam/steampipe/{README.md, app_build.vdf, depot_build_linux.vdf, depot_build_windows.vdf}`), and the shells' own `ios/README.md`, `ios/.gitignore`, `ios/probe/probe.html`, `android/README.md`, `android-webview/README.md`, `android-webview/build.gradle`.
- Left as found: `tools/perf/bench-chromium.mjs:16` (yan-c's) loads Electron from the hosts-m0 WORKTREE's `shells/electron/package.json` by absolute path — it still resolves while that worktree exists; re-point it to `tools/platform/electron/` once H2 has run `npm ci` there.

## `RELEASING.md`
Kept whole. ONE line added under the title: "the engine's cuts since v0.5.3 are local on `yan-c` (tags, CHANGELOG and snapshots, nothing pushed or deployed);
pushing them, and so moving `main` and the live site, is Josh's decision (0.9.0's law). The rule below is September's and stands for that day."

## The `package.json` delta
**None.** hosts-m0 never edited the root `package.json` or `package-lock.json`; the engine's scripts are unchanged and the lock stays consistent (no
`npm install --package-lock-only` was needed). The Electron devDependencies and the shell's scripts (`start`, `package`, `smoke`) live in the shell's own
`tools/platform/electron/package.json` + lock; adding Electron to the root would put a 290 MB download into the engine's `npm ci`.

## README · CHANGELOG · CITATION · CLAUDE
hosts-m0 changed none of them, so there was no platform fact to re-apply and none was added. README says nothing about the shells today; whether the cut's
README gains a one-line "the platform hosts are in `tools/platform/`" is the integrator's call at `v0.9.1-alpha`.

## Matrix rows now STALE (every row names `91c90bc` — H2 re-measures them)
| line | section | row | stale because |
|---|---|---|---|
| 11 | Row 0 | 2026-09-24 baseline gate, `./test.sh all` 77 node + 16 browser suites | `91c90bc` v0.2.3-alpha.3 |
| 19 | P03 host paragraph | payload `dist/` sha256 `790655d26eeb…`, 217 files | the `91c90bc` payload (today's `dist/` is 494 files) |
| 23 | P03 | Electron dev tree, PASS on the RTX 3070 | `91c90bc` |
| 24 | P03 | packaged linux-x64, PASS 17/17 | `91c90bc` |
| 25 | P03 | packaged win32-x64, built not run | `91c90bc` |
| 41 | P04 | iPad M5, _pending_ | `91c90bc` + shells (never run) |
| 42 | P04 | iPhone, _pending_ | same |
| 46 | P06 host paragraph | APK 1,048,750 B / AAB 1,171,294 B, versionCode 1, minSdk 21 | built 2026-09-24 |
| 50 | P06 | Pixel 10 Pro XL, Chrome 153 via TWA | `91c90bc` + shells; the live site then served 0.2.3-alpha.1 |

The matrix has **no P08 row**: the bundled WebView's proof lives only in `tools/platform/android-webview/README.md`. Other September facts that travel with the
kits (not matrix rows, listed for H2's claims diff): `LEGAL-PROVENANCE.md` l.3 (drafted from `91c90bc`); `store/apple/SCREENSHOTS.md` l.20, `store/steam/ASSETS.md`
l.38 (screenshots of the `91c90bc` payload); `store/steam/COPY.md`, `store/apple/METADATA.md`, `store/play/LISTING.md` (written from September's README: "54
small molecules, 52 of them playable" — 0.9.0's README says 98 molecules, 61 solved live); `store/README.md` l.3 (built against `91c90bc`); `tools/platform/electron/package.json` `"version": "0.2.3-alpha.3"`.

## Gates on the merged tree
| gate | result |
|---|---|
| `./test.sh node` | exit 0, ALL GREEN |
| `node tools/rack-deps.mjs --classes` | exit 0 (21 module files measured) |
| `node tools/new-project.mjs --check` | in step (16,117 B) |
| `node tools/provenance.mjs --check` | in step (55,899 B, 186 rows) |
| `node tools/pyscf-table.mjs --check` | in step (11,136 B) |
| `node tools/catalogue-table.mjs --check` | in step (18,274 B, 186 rows) |
| `lab/` line count | 30,028 → 30,028 |

## Corrections to the brief
1. hosts-m0 adds only **76** files and edits two (`.gitignore`, `tools/build-deploy.mjs`). `AI_POLICY.md`, `RELEASING.md`, `REPORT.md`, `package.json`,
   `package-lock.json`, `serve-lan.py`, `.github/` and the eight other `docs/` files are NOT hosts-m0's additions: they are in the merge base `91c90bc` and in
   `yan-c` (where 0.9.0 has moved them on). Only `docs/ACCEPTANCE-MATRIX.md` and `LEGAL-PROVENANCE.md` are new at the root level.
2. `RELEASING.md`'s dev/main rule is the base's words (September, before `91c90bc`), not hosts-m0's; hosts-m0 never edited it.
3. The shells' devDependencies are in `tools/platform/electron/package.json`, not the root `package.json`, so the root's delta is zero.
4. The matrix carries P03, P04 and P06 sections; P08 (named in the brief) has no matrix row.
5. Beyond the four named files, the move also had to change relative depths in four scripts and one hosts-m0 edit outside the shells (`tools/build-deploy.mjs`), and
   the `.gitignore` conflict carried a yan-c defect (the literal `\n` inbox line), fixed in the resolution.
