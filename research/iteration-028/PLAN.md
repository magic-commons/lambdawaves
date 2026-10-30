# ITERATION 028 — STABILITY FINALITY (Claude Yan, integrator on `yan-c`; Josh 2026-10-29)

Josh's word: `PROMPT.md`. 027 closed at the commit before this plan (D · N · S1 · S2 · S3 in `research/iteration-027/PLAN.md` CLOSED).
The span under review: `a4a58d6..HEAD` on `yan-c` (iterations 017–027, 351 commits since the 10-25 senior-pass audit) on top of the
0.9.9-alpha tree; kit MIR 1.5.6-alpha.17 vendored in `lab/mir/**` (the kit is reviewed as a dependency: its seams and what it exposes,
not rewritten — kit fixes become FOR-MIR lines).

## WHAT STANDS (from the senior pass, 2026-10-25, re-measured 10-29)
0 circular edges · 0 kit→app edges · 0 unused files · 0 TODO/FIXME · rack-deps HOLDS (persist 24 of 25) · node suite green ·
THE LOCK 843/0 and 987/0 · NEW in step · sw.js generated, no skipWaiting, no clients.claim, cache name from the precache hashes · the
deploy is assets-only on Cloudflare Workers Static Assets (`wrangler.jsonc`, generated `dist/_headers` + `_redirects`, `tools/build-deploy.mjs`
§V-checks) · SECURITY.md names the three threat classes (XSS through an imported project or notebook, a stale service worker, a microphone leak).

## THE LAW OF 028 (to docs/laws/iterations.md at the close)
A FINDING IS VERIFIED BEFORE IT IS FIXED; A FIX HAS ITS FAILURE'S TEST; NO CORNER IS A CORNER CASE.

## R1 — THE REVIEW (the fleet; read-only; nothing under `lab/` is edited in this row)
Eight finders, each on one dimension, each returning ranked findings with file:line, the failure scenario and a fix sketch; every finding
is handed to two independent skeptics (one tries to REFUTE it from the code, one tries to REPRODUCE or disprove it by a measurement or a
test); a finding survives when neither skeptic refutes it. A synthesis agent writes `research/iteration-028/REVIEW.md` (ranked, by
dimension, with the dream-architecture essay) and a completeness critic names what the fleet did not cover (its list = R1b, run if it
names anything material).

| # | dimension | surface |
|---|---|---|
| 1 | THE UPDATE AND THE CACHE | `lab/sw.js`, `tests/pwa.test.mjs`, `tools/build-deploy.mjs`, `wrangler.jsonc`, `dist/_headers`, `dist/_redirects`, `DEPLOY.md`, `docs/SHIPPING-READINESS.md`: stale bytes, update discovery, DATA_CACHE and the volumes, the two-origin hazard, 404/MIME, install and rollback |
| 2 | CRASHES AND RECOVERY | `lab/main.js`, `gpu-boot.js`, `rack.js` boot, WebGPU device loss, `mathworker.js` and the chem worker, unhandled rejections, storage quota and corrupt localStorage, malformed `.lambdawaves` files, the undo ring, the recorder |
| 3 | UNTRUSTED INPUT | `.lambdawaves` and NEW, `lw:` links and the fragment (`statelink.js`), notebook markdown (marked · KaTeX in `lab/mir/shell/vendor`), share links, look and preset imports, library installs and volumes JSON, `innerHTML` sites, `postMessage`, the ASK broker route (`tools/gemma/broker.py`, 0.0.0.0:9443) |
| 4 | THE MIR SEAM | what a hostile page, file or extension can do through the kit's surfaces (prefs store, FOLDERS gallery, window picker, notes pages, midi.js, the render store worker); the app's doors into `lab/mir`; kit findings → FOR-MIR lines |
| 5 | PERFORMANCE AND STRESS | the engine under load: `field.js`, the clock, modulation + NODES + film together, long sessions (memory growth), the governor, the volumes' fetch; `tools/perf/*` run on an own gate server (one browser at a time, nice -n 10, own ports); frame budget and the HEAVY marks |
| 6 | THE DREAM ARCHITECTURE | "if Claude had the dream job": the module map against `docs/laws/architecture.md`, the app literal, the three scopes, the kit seam, the test reach (72 UI modules only under browser tests), the generated artefacts; bounded proposals with their proof, never a rewrite (the senior-pass ruling holds) |
| 7 | RELEASE READINESS | `RELEASING.md`, `SHIPPING-READINESS.md`, `LEGAL-PROVENANCE.md`, `NOTICE`, licences and fonts, `CITATION.cff`, README and ABOUT accuracy, the version seats, CHANGELOG, the store program's M0 |
| 8 | DEPENDENCIES AND STATIC ANALYSIS | `package-lock.json`, vendored marked and KaTeX versions and advisories, the tools' deps (electron), `uvx semgrep` on `lab/` (minus vendor), knip with `.tmp/audit/knip.json`, dependency-cruiser against `rack-deps` (ONE law) |

Tools the finders may use: Serena (MCP, `mcp__serena__*` via ToolSearch; activate the project first), knip, dependency-cruiser, ast-grep,
Semgrep as CLIs (recipes in `research/senior-pass/PLAN.md` R0), the gates of CLAUDE.md. Rules: read-only under `lab/`; browsers one at a
time per agent on an own gate server stopped by pid; never `pkill -f`; never the ports 8721/8731/8735/8741/9241/9261/9491/8790/9651/5651/
9695/9697/9699/8799; nothing pushed.

## R2+ — THE FIXES (cut from REVIEW.md after Josh reads it; defaults if he says so)
One chain per severity band, Opus builders, each fix with the test of its failure, the gates per CLAUDE.md, merged by the integrator with
the recipe. Kit findings ride FOR-MIR. The 1.0 cut follows the last confirmed critical/high fix.

## CALLS FOR JOSH
REVIEW.md §5 holds six. Josh (10-30 00:xx, "let's continue") did not answer them one by one; the integrator took these DEFAULTS, each reversible:
CALL 1 → (C) 1.0 = the last confirmed critical/high fix of this review closed (the fleet's reading; RELEASING.md and release-1.0.0/BUILD-PLAN.md
cite it in chain F). CALL 2 → harden the broker's code (chain E); the RUNNING broker pid 1055617 is Josh's to stop (`tools/gemma/stop.sh`). CALL 3 →
the law line + dg2's hash printed, no retry machinery (Josh's gate dial). CALL 4 → (a) one `### wave NN:` line per closed iteration in REPORT.md;
no 0.9.10 tag — 1.0 names 017–028. CALL 5 → stays Josh's (LEGAL §5 items 1–5; chain F writes the fleet's wording as a proposal he confirms).
CALL 6 → the activate-time sweep (the default). Josh overrides any of these by a word; the note of the cut lists them.

## R2 — THE CHAINS (REVIEW.md §6; one Opus builder at a time, Josh's 10-29 dial; merge order E → A · B · C · D → F)
E tools and gates (launched 10-30 first) · A the worker · B the boot, the restore, the word · C the volumes and the stored collection · D the field
and the film · F the words that ship (last: it regenerates CHANGELOG.md after E's judge lands). Each builder: its branch, one commit per row, the
test of the failure, the gates of its §6 paragraph; the integrator merges with the recipe (`--no-ff --no-commit`, `--ours lab/sw.js`, pwa --write,
rack-deps, new-project, mir-manifest, `./test.sh node`, THE LOCK 843/987 when lab/ drew differently).

## CLOSED
| row | base | commit | note |
|---|---|---|---|
| R4 (senior pass) | d4c92ba6 | 76c8ac3e | THE DOUBLES re-measured (bondsOf · uniqueName · statusOf settled by 021 G4; cholesky · tableFor left with reasons; atoms.js gauss → eliminate, 6902a92c) and THE UN-EXPORT SWEEP (107 export keywords off 44 files, nothing deleted; knip 126 → 14 deliberate; test.sh node EXIT 0 · rack-deps HOLDS · 0 cycles). Note research/senior-pass/R4-BUILD.md. Opus builder part A (paused on the usage alarm), Yan part B. |
| E | e8ead918 | MERGED | R-05 · R-10 · R-13 · R-14 (CALL 2 default: code hardened, pid 1055617 untouched) · R-22 (CALL 3 default) · R-25 · R-26 · R-27 (red by design until F regenerates CHANGELOG) · R-29 package half (by reading: the deploy build fails on yan-c, see R-32) · R-30; npm audit 4 → 0 and 2 → 0; test.sh node EXIT 0. Note research/iteration-028/E-BUILD.md. NEW ROW R-32 THE DEPLOY BUILD (found by E, not in REVIEW.md): `node tools/build-deploy.mjs` fails V2 on yan-c — `dist/volumes.js → ./volumes/` has no shipped file, and `dist/shell/facade.js → ../../tools/conduct-score.js` (026 A2 THE CONDUCTOR) climbs above the deployment root; verify.yml is red on any push until fixed → chain D (lab/shell/facade.js + lab/volumes.js are lab-side; the conductor must load by a URL inside dist or be excluded from the build). |
| A | a9d3b0e9 | MERGED | R-03 (a take counts windows; UPDATE ALL = force; the non-asking tab reloads when clean, else the badge says THIS BUILD WAS REPLACED IN ANOTHER TAB · RELOAD NOW; ABOUT › UPDATE APP through accept()) · R-06 (install hashes each body against the 12-hex prefix, rejects redirected/wrong bytes; pwa E3b) · R-08 (CALL 6 default: activate sweeps img/menu, demos/covers, vendor/nist from lw-data-v1; records stay; pwa E6). main.js one line (force passes through); offer.browser-test scene 11 rewritten, 16/16. test.sh node EXIT 0; rack-deps HOLDS. Note A-BUILD.md. NEW ROW R-33 THE FACADE PIN (pre-existing): tests/lw-facade.browser-test.mjs reads RED — the page has `conduct` (026 A2) and `skeletonArgs` (025 B2) that the fixture lacks; re-capture with --write at the close of chain D and say the diff. |
