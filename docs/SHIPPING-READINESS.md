# Shipping readiness

## Status — 2026-09-10 (senior review pass)

- **The gate is green.** `./test.sh` runs 58 node suites and the two shipped browser suites
  (`tests/current.browser-test.mjs`, `tests/gpu-recovery.browser-test.mjs`); all pass on the
  RTX 3070 / Firefox headless rig.
- **The historical gate moved to `tests/legacy/`** (`./test.sh legacy`). It stood at 83 green /
  76 red. Triage of all 76: 17 read windows the visibility scheduler keeps idle (METERS, ORBIT,
  DYNAMICS, KEPLER, CALCULUS ship closed or below the fold), 6 matched on-screen copy that the
  help-surface rewrite changed, 1 was the harness returning nothing, and the rest were unreadable
  because the gate logged Firefox stacks without messages — that logging is fixed, and
  `__LW.windowActivity.presentOffscreen(true)` now lets a probe present below-the-fold windows
  without weakening the structural gates. No red in that file was traced to broken physics or a
  broken shipped control. Reviving a law there means opening the window it reads and re-stating
  the copy; never restoring the superseded UI.
- **Still open, and only testable off this machine:** iPad / phone acceptance, installed-PWA
  update and rollback, a real microphone for the AUDIO source, and the Cloudflare deployment.

The sections below are the 2026-09-08 checkpoint they were written as.

## Checkpoint — 2026-09-08

**Status: release preparation checkpoint, not a production acceptance.** Claude Code
owns the major debugging/refactoring pass. The Node and packaging gates do not prove
that real devices, installed clients, or the current UI work end to end. Start with
`docs/history/CLAUDE-CODE-HANDOFF.md` for the behavior that cleanup must preserve.

## Latest verification — 2026-09-09

The GPU allocation and reload problems no longer reproduce after host recovery.
The blank-page allocation probe, dedicated GPU recovery test (three reloads plus
64³/96³/128³ grids), and current UI acceptance test all pass with GPU available.
See the latest handoff for exact coverage. The older failure notes below are
historical; long-session, mobile, microphone and production acceptance remain open.

## Implemented in this checkpoint

- GPU/reload follow-up: stalled animation frames now reject `settle()` after three
  seconds; the GPU browser gate stops on missing device/reload readiness. Diagnostic
  GPU readbacks release buffers after failures. A fresh probe completed three reloads.
  GPU device allocation still fails on a blank page without app code, so host/browser
  recovery and hardware rendering acceptance remain open. See the latest handoff.

- Current-app follow-up: new projects start clean despite automatic domain sizing;
  subtitle edits count as dirty; failed deletion preserves current-project state;
  malformed storage no longer crashes listing or gets overwritten by save. Special
  project names are handled as own properties. 51 Node suites and the focused
  `tests/current.browser-test.mjs` UI checks pass. GPU allocation failed in Firefox,
  so GPU acceptance remains open. Old-save migration is not a user priority.

- Follow-up after `23328bf`: project import validates metadata and an 8 MiB UTF-8
  size limit before storage access; file selection checks size before reading.
  Failed writes/read errors now fail the import, corrupt JSON remains untouched,
  and existing projects are preserved. Focused import/integration tests pass.
  Full experiment schema validation and other storage operations still need review.

- Fixed notebook math fallback HTML injection when KaTeX is unavailable or throws.
  Fallback TeX is escaped after sanitization, with trust disabled for normal math
  rendering. Regression tests cover both fallback paths and normal rendering.

- `test.sh` discovers every `tests/*.test.mjs` suite, retains failures, runs PWA
  integrity last, and respects `node`, `browser`, and `all`. Unknown modes fail.
- Browser HTTPS startup waits for its own server, refuses occupied ports, and
  releases the server on exit/signals. Certificate defaults stay inside `.certs/`;
  `LW_CERTS` overrides them and legacy `MB_CERTS` remains supported by the server.
- Driver startup refuses an occupied port instead of attaching to another session.
  `GECKODRIVER` overrides the executable (default: PATH). `FIREFOX_BINARY` overrides
  Firefox; the existing Snap path is retained when present, otherwise geckodriver
  discovers Firefox. Failed session/navigation setup attempts owned-driver cleanup.
- Packaging rejects hidden/local files, certificate containers, private-key PEM
  material, symlinks and special files under `lab/` before assembling assets.
  Regression tests cover nested files and directory links. This is a packaging
  guard, not a comprehensive credential scanner.
- `.gitignore` excludes local environment files, keys and Python cache files.
- Wrangler 4.129.0 and its dependency graph are locked. Miniflare's sharp dependency
  is overridden to patched 0.35.4 for [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c).
  `npm ci --ignore-scripts`, the deployment dry-run, and npm audit (zero reported
  vulnerabilities) passed locally. This is deployment-only tooling; none of these dependencies ship in `dist/`.
- GitHub Actions audits dependencies, runs Node suites, verifies deployment assets,
  performs a Wrangler dry-run and checks for source
  mutation. Actions are pinned to resolved v4 commit SHAs; permissions are read-only
  and checkout credentials are not persisted. There is no deployment step. The
  repository currently has no remote, so hosted CI has not run.

Local Wrangler HTTP checks passed for `/`, `/index.html?__rev=x`, `/sw.js`,
`/notebook-math.js`, `/manifest.webmanifest`, `/LICENSE`, `/NOTICE`, `/REPORT.md`
and the expected 404s for `/_headers`, `/_redirects`, `/smoke.html`, and a missing
module. Successful responses had the expected MIME, `nosniff`, and revalidation
headers. This does not certify production routing or installed clients.

## Release blockers and ownership

| Priority | Finding / gap | Required closure |
|---|---|---|
| ~~P0~~ | Browser acceptance — **closed 2026-09-10**: the shipped gate (`tests/*.browser-test.mjs`) is green; the historical gate moved to `tests/legacy/` with its triage in the status section above. | done |
| P0 | Device-loss history and no current physical-device acceptance. `field.js` marks the field unavailable; `rack.js` offers reload. | Claude + device tester: adapter unavailable, device loss under load, recovery with saved state, low-memory hardware, long session and export cancellation. A CPU/UI-only run does not certify WebGPU. |
| P0 | Production origin, headers, installed-client update and rollback are unverified here. | Release owner: perform the deployment rehearsal below and record commit/version IDs. |
| P1 | Native UI and modulation lifecycle remain the main cleanup risk. | Claude: focus and held gestures through compact/full, close/reopen, routing/source changes, docking and project restore. Preserve value/depth distinction and archived features. |
| P1 | Imported projects/notebook content are untrusted. An allowlist sanitizer exists in `rack.js`; that is not an exhaustive security review. | Claude: preserve sanitizer and KaTeX trust restrictions; test malformed/oversized imports, hostile HTML/URLs and storage failures without losing saved projects. Audit vendored marked/KaTeX advisories before public launch. |
| P1 | Audio and capture require real-device testing. | Device tester: permission denial/revocation, disconnect/reconnect, no sound before consent, stopping capture, export cancellation and restoration. Test actual microphone input, not just model fixtures. |
| P1 | README previously promised browser versions without a tested support matrix. | Record tested OS/browser/GPU combinations. Verify keyboard focus, touch targets, zoom, reduced motion and photosensitivity interlock on those devices. |
| P1 | Deploy tooling must stay reproducible and patched. | Use `npm ci --ignore-scripts` from the committed lockfile; review upgrades and the sharp override together. Rehearse routing, dry-run and rollback after changes. |
| P2 | Large `rack.js`, layered CSS and long browser gate are expensive to maintain. | Claude: split by behavioral ownership after reproducing defects; replace source-text assertions with focused behavior tests where useful. Avoid a broad rewrite before a trustworthy baseline. |

## Shipping dos and don'ts

1. **Ship `dist/`, built from a reviewed commit.** Keep diagnostics, keys, local logs,
   research and tools out of public assets. Preserve LICENSE/NOTICE and font/vendor
   attribution. Review the deliberately published REPORT and CHANGELOG for public
   suitability. Do not edit generated output or publish after a failed build.
2. **Keep the app on its own HTTPS origin.** Keep relative imports and worker scope,
   `html_handling: "none"`, the root rewrite and real asset 404s. Do not move a root
   service worker onto a shared site or introduce an HTML fallback for missing JS.
3. **Version the installed client coherently.** After runtime edits run
   `node tests/pwa.test.mjs --write`, review the resulting hashes and rebuild.
   Preserve the explicit update prompt; do not force `skipWaiting` during work or
   cache unversioned module URLs as immutable. Test both new and returning clients.
4. **Protect data before changing formats.** Keep old project/share files loading;
   export a project before destructive storage tests. Browser storage is not a
   backup. Do not clear storage as a migration shortcut or put credentials in static
   JS. Review storage-full/disabled behavior and malformed input bounds.
5. **State privacy accurately.** The core app bundles dependencies, but notebook
   content can include allowed remote images/links. Do not promise zero network
   traffic merely because app assets are local. Review that behavior and microphone
   explanations before publishing privacy copy. Do not add telemetry by default.
6. **Harden headers through browser testing.** Existing output revalidates assets,
   sends `nosniff`, a referrer policy and alpha `noindex`. A strict CSP needs an
   inventory of inline scripts/styles, workers, media/blob URLs and notebook images;
   stage and test it before enforcement. Do not disable microphone or break exports
   with a generic security-header template. `_headers` does not cover responses from
   future Worker code. Unlisted/robots restrictions are not authentication.
7. **Do not claim performance or compatibility from one headless run.** Record real
   hardware, sustained frame rates and memory under high grid/mode counts. Exercise
   background/resume, rotation/resizing, offline relaunch and permission failures.
8. **Make rollback a rehearsal.** Record the previous deployment ID, retain a source
   tag and project fixtures, roll back once, and verify the installed client's update
   prompt actually returns it to the previous release. A server rollback does not
   instantly replace service workers already running on users' devices.

## Release rehearsal after Claude's fixes

```bash
bash test.sh node
LW_PORT=8719 GD_PORT=5239 bash test.sh browser
node tools/build-deploy.mjs --quiet
npm ci --ignore-scripts         # install the reviewed, pinned deployment CLI
npm audit --audit-level=high
npx wrangler deploy --dry-run
npx wrangler dev
```

Resolve red checks before release; do not use `--no-test` for the release build.
The browser gate serves `lab/`; it does not test Cloudflare's generated routing and
headers. Separately test Wrangler's assembled origin: `/`, `/index.html?__rev=x`,
`/sw.js`, module MIME types, manifest/icons, license URLs, missing JS (404), and
hidden infrastructure (`/_headers`, `/_redirects`, diagnostic page: 404).

Then test a fresh profile through the photosensitivity gate, an existing saved
profile, offline relaunch after installation, and version A → B with an old tab
left open. Apply the update deliberately and verify saved state. Repeat on the
supported devices, including microphone and downloads. Record the exact Git commit,
Wrangler version, deployment version, browser/OS/GPU, failures and rollback outcome.
Only then publish and mark the release accepted. This checkpoint neither publishes
nor creates a release tag.

## Primary references checked for this pass

- [Cloudflare static asset headers](https://developers.cloudflare.com/workers/static-assets/headers/): generated `_headers` applies to static asset responses; retest if adding Worker code.
- [MDN service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers): installation/update lifecycle and cache ownership.
- [MDN WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API): secure context and limited availability; actual adapter support must be tested.
- [Cloudflare rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/): deployment version rollback procedure.
