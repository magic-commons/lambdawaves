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
Written at the end of REVIEW.md by the synthesis agent (the calls the fleet could not default).

## CLOSED
| row | base | commit | note |
|---|---|---|---|
