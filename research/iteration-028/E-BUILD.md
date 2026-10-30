# ITERATION 028 · CHAIN E — THE TOOLS AND THE GATES · BUILD

Builder: Opus 5.5 (Claude Yan's fleet), 2026-10-30, on its own branch cut from `yan-c` @ e8ead918. Nothing under `lab/` was edited, so no
`pwa --write` and no LOCK run. One commit per row; the integrator merges.

## ROWS CLOSED

| row | commit | what changed | its failure's test |
|---|---|---|---|
| R-05 | 0d2fd140 | `tests/wiring.test.mjs` §6c THE NAMES: every `import { … }`, default import and `export { … } from` on the walk is judged against its target's exports (`export *` followed, multi-declarator `export const` read) | MISSING: 0 on the tree; scratch mutations (reverted): `arcRing` dropped from `lab/mir/kit.js` → MISSING: 1 (`lab/chemview.js:26`); `LAMBDA_MAX` renamed in `lab/sturmianreg.js` → MISSING: 1 (`lab/windows/spectrum.js:13`) |
| R-10 | 27681d68 | `tools/gate/server.py` `allowed()` judges `posixpath.normpath(urllib.parse.unquote(path))`; the LAN prefix test reads `path + "/"` so `/lab` still counts | `tests/gate-tools.test.mjs`: own server on the suite's port, `/lab/ok.txt` 200, `/%2Eclaude/x.txt` 404, `/lab/%2E%2E/%2Etmp/y.txt` 404; the same rows against the old server.py read 200 (red) |
| R-13 | b55c79b3 | `package.json`: wrangler 4.147.0 → 4.156.0, the `overrides.sharp` line deleted (sharp 0.35.5 via miniflare); lock regenerated | `npm audit` 4 high → 0; `npx wrangler deploy --dry-run` reads 1776 assets, "--dry-run: exiting now" (no upload) |
| R-14 | 4d8bea60 | CALL 2 default. `tools/gemma/broker.py`: binds 127.0.0.1 (GEMMA_HOST=0.0.0.0 is the LAN opt-in, printed as LAN OPT-IN at start); a browser Origin must be loopback, this host's name (or `.local`), or listed in GEMMA_ORIGINS, else 403 and no CORS headers (never `*`); the allowed Origin is echoed with `Vary: Origin`; `BoundedSemaphore(2)` → a third concurrent ask is 429; your words reach log.jsonl only with GEMMA_LOG=1. `docs/GEMMA.md` (the bind, the log, THE LAN with the Private-Network sentence) and `start.sh`'s two lines follow | own instance on 127.0.0.1:9873 (stopped by its pid): `Origin: https://evil.example` POST 403, preflight 403 with no ACAO; `Origin: https://127.0.0.1:8701` preflight 204 echoing it, POST 200 (Ollama was up, so one real ask ran; its log row has `text: null`) |
| R-22 | 876cf40e | CALL 3 default. `docs/laws/field-and-lock.md` line 7 gains the flake clause (momentum@128 `repeat` may flip under a second GPU client; re-run once alone; 843 · 0 and 987 · 0 stay the law). `tools/perf/digest-lock.mjs` takes dg2's hash out of the page, prints it beside a NOT REPEATABLE state and beside a `.repeat` DIFF, and deletes it before the leaves are compared or written (no new leaf, no retry) | `node --check`; no LOCK run (no draw changed; the leaf set is unchanged by construction) |
| R-25 | c5e0674f | `tools/state-scopes.mjs --check`'s second judge: every `'lambdawaves.q0.*' / 'lw.*' / 'mir.*'` literal in app files (lab/ outside `mir/`) must be a RECORDS key, under a prefix row, or a NOTEBOOK key; two named non-storage words (`lw.period`, a modulation target id; `mir.prefs`, a comment) | green on the tree; a planted `'lambdawaves.q0.ghost'` in lab/picker.js (reverted) → exit 1 naming it |
| R-26 | c473a56b | `tests/provenance.test.mjs` runs `tools/pyscf-table.mjs --check` (its :11 pattern) | green (11,136 B, 38 records + 61 molecules); a word appended inside README's block (reverted) → the suite exits 1 |
| R-27 | 3d353f5c | `tools/changelog.mjs --check` also judges the version seats: CITATION.cff `version:` = BUILD_LINE's number, CHANGELOG.md's newest release heading = the newest tag. `.github/workflows/verify.yml` runs it after the build, with `fetch-depth: 0` (the tool reads every tag's REPORT.md; a shallow clone has none) | scratch (reverted): CHANGELOG regenerated → red on "CITATION.cff says 0.9.0-alpha; BUILD_LINE says 0.9.9-alpha"; CITATION set to 0.9.9-alpha too → green. **Red on today's tree by design** (CHANGELOG out of date, CITATION stale) until CHAIN F lands R-17 and regenerates CHANGELOG.md — the merge order E → F the review set. Not in `test.sh node`, so the node gate stays green |
| R-29 (package.mjs half) | 3c49b290 | `tools/platform/electron/package.mjs` writes `out/SOURCE.md` (tag, commit, repository, dist sha256, Electron, build time) and puts SOURCE.md, **COPYING** (λWAVES' GPL `LICENSE`) and NOTICE in each package root. COPYING, not LICENSE: the packager already ships Electron's MIT `LICENSE` there and LEGAL-PROVENANCE row 15 says keep it | `node --check` only — see "left" below |
| R-30 | 568692fd | `tools/platform/electron`: electron 44.4.5 → 44.10.0; `npm audit fix` moved undici to 7.30.1 under @electron/get; main.cjs:10's runtime comment updated | `npm audit` there 2 high (electron <44.9.1, undici <7.30.1) → 0; `node smoke-run.mjs` **17/17 GREEN** on Electron 44.10.0 / Chromium 152.0.7977.169 / Node 24.22.1, RTX 3070, Wayland |

## LEFT, AND WHY

- **R-29's end-to-end run.** `package.mjs` starts with `node tools/build-deploy.mjs --quiet`, and that build exits 1 on this tree
  for two reasons this chain did not cause and may not touch (both under lab/): `✗ V2: dist/volumes.js → ./volumes/ (no shipped file
  under dist/volumes/)` and `✗ V2: dist/shell/facade.js → ../../tools/conduct-score.js (climbs above the deployment root)` (026 A2's
  CONDUCTOR import). So no package was built and the SOURCE.md / COPYING / NOTICE copy is proven by reading, not by a run. The same build
  failure makes verify.yml's `build-deploy --quiet` step red on any push; the dry-run above read the dist/ the failing build still left on
  disk. **For the integrator:** a lab-side row (B or D, or a new one) — the facade's dynamic import of tools/conduct-score.js needs an
  exemption in build-deploy's V2 or to leave dist's graph; the `./volumes/` base needs a shipped file or a V2 allowance.
- **R-13's RELEASING.md line** ("npm audit reads 0" on the release-day list) and **R-30's matrix note**: RELEASING.md and
  docs/ACCEPTANCE-MATRIX.md are CHAIN F's files; F should add both lines (the numbers are above).
- **R-14's token** (`X-Gemma-Token`, the row's longer sketch): not built. The page's ask road (`lab/ask.js`) would have to send it and
  lab/ is not this chain's; the integrator's CALL 2 default named bind · allowlist · no wildcard · cap. With the token absent, a LAN opt-in
  still lets anyone on the Wi-Fi ask with curl — docs/GEMMA.md says so in those words.

## THE GATES

- `./test.sh node`: **rc 0** (115 suites + state-scopes --check + hints-census --check + pwa last; the new judges inside it: wiring
  MISSING: 0, gate-tools' encoded-dot rows, provenance's pyscf-table --check, state-scopes' literal sweep).
- `npm audit` (repo): before **4 high** (wrangler ≤4.148 via miniflare/undici; sharp <0.35.5 pinned by the override) → after **0**.
- `npm audit` (tools/platform/electron): before **2 high** (electron 44.0.0-alpha.1 – 44.9.0; undici 7.0.0 – 7.30.0) → after **0**.
- `npx wrangler deploy --dry-run`: compiles, uploads nothing. `node smoke-run.mjs`: 17/17.
- `node tools/changelog.mjs --check`: red by design until CHAIN F (R-27 above).

## FOR JOSH

The ASK broker you started on 2026-10-15 is still running as **pid 1055617** (the optimization-2026-09-24 worktree's broker.py, on
0.0.0.0:9443 with the old wildcard CORS). This chain did not stop or restart it: that is your call. Stop it with `tools/gemma/stop.sh`
(it stops by pid). The next start runs the hardened broker on 127.0.0.1; add `GEMMA_HOST=0.0.0.0` only when the iPad needs her.
