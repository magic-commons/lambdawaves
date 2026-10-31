# Shipping readiness

## Status — 2026-10-31 (0.9.9-beta, released: tag `v0.9.9-beta`, deployed)

- **What 1.0 means.** 1.0 is the tree in which the last confirmed critical or high finding of the 0.9.9 stability review is closed.
  The review's three high findings — the SHADER node's black stage after a film, a `null` settings blob, and an update press that
  swapped the build under other open tabs — are fixed, each with a test of the failure. What 1.0 ships with, and states as
  unverified: the device matrix ([`ACCEPTANCE-MATRIX.md`](ACCEPTANCE-MATRIX.md): one RTX 3070 in Firefox and Electron on Linux; the
  Windows package built, not run; the iPad and iPhone rows unverified; the Android upload key absent), the installed-PWA update on a
  real device, a real microphone for AUDIO, and a screen-reader pass — none of them done.
- **The gate.** `./test.sh node` runs every node suite (`tests/*.test.mjs`, pwa last) plus `state-scopes --check` and `hints-census
  --check`; the browser gate runs every `tests/*.browser-test.mjs`. The release-day list with today's numbers is in
  [`RELEASING.md`](RELEASING.md).
- **The deploy tooling.** Wrangler 4.156.0 is locked; `npm audit` reads 0 in the repository; in `tools/platform/electron`
  (Electron 44.10.0) it reads 0 high and 5 moderate (glob and minimatch under the build-time `@electron/packager` 20.3.0; the only
  offered fix is a major downgrade). `node tools/build-deploy.mjs` passes §V1–§V5.
- **The remote.** `origin` is github.com/magic-commons/lambdawaves (public); `main` and `dev` carry the beta (`9c9a3c80`, 2026-10-31) and every
  release tag is on the remote. Two workflows: `gate.yml` (`npm test` on push and pull request; the README badge) and `verify.yml`
  (`./test.sh node`, the deploy build, `changelog --check`, the Wrangler dry run); both green on the beta.
- **Deployed.** lambdawaves.magic-commons.com serves the beta since 2026-10-31 (Cloudflare Workers + Static Assets); the GitHub Release
  `v0.9.9-beta` is marked a pre-release. A store submission remains the maintainer's decision.
- **The free plan.** The account carries no payment method and the Worker has no code: every request is a static-asset request, free and
  unlimited, so no traffic can produce a bill. The build's §V7 holds the plan's 20,000-file / 25 MiB budget: 15,674 files ship today.
- **The library.** VOL. I (6,927 molecules) and the filling VOL. III travel with the site as files, so INSTALL and the single-molecule
  fetch work; VOL. II is its 5.76 GB archive, handed out from the maintainer's Drive and opened in PICKER › LIBRARY (`docs/VOLUMES-HOSTING.md`).
- **Hardening (030).** Every response carries a Content-Security-Policy and HSTS (SECURITY.md); both workflows pin their actions by hash with
  read-only permissions; install scripts are off; `main` and `dev` are protected (required checks, no force-push); Dependabot and secret
  scanning are on; private vulnerability reporting is on. The outside-eye review (REVIEW-030, in the vault) found that Cloudflare's
  JavaScript Detections had rewritten the live page since the first deploy, so no visitor's service worker had ever installed; the page now
  ships `no-transform` and `tools/release/live-check.mjs` reads PASS: the live bytes are the build's.

## Release blockers

| Priority | Gap | Required closure |
|---|---|---|
| P0 | No current physical-device acceptance; a GPU device-loss history on one machine. `field.js` marks the field unavailable and the rack offers a reload. | A device tester: adapter unavailable, device loss under load, recovery with saved state, low-memory hardware, a long session and export cancellation. A CPU/UI-only run does not certify WebGPU. |
| P0 | The production origin, headers, installed-client update and rollback are unverified here. | The release owner performs the rehearsal below and records the commit and version ids. |
| P1 | Imported projects and notebook content are untrusted. An allowlist sanitizer exists; that is not an exhaustive security review. | Keep the sanitizer and the KaTeX trust restrictions; test malformed and oversized imports, hostile HTML and URLs, and storage failures without losing saved projects. Audit the vendored marked and KaTeX advisories before a public launch. |
| P1 | Audio and capture need real-device testing. | Permission denial and revocation, disconnect and reconnect, no sound before consent, stopping capture, export cancellation and restoration, with a real microphone. |
| P1 | Browser support is stated without a tested device matrix. | Record the tested OS/browser/GPU combinations; verify keyboard focus, touch targets, zoom, reduced motion and the photosensitivity notice on them. |
| P1 | Deploy tooling must stay reproducible and patched. | `npm ci --ignore-scripts` from the committed lockfile; review upgrades together; rehearse routing, the dry run and a rollback after changes. |
| P2 | `rack.js`, the layered CSS and the browser gate are expensive to maintain. | Split by behavioural ownership after reproducing defects; prefer focused behaviour tests over source-text assertions. No broad rewrite before a trustworthy baseline. |

## Shipping rules

1. **Ship `dist/`, built from a reviewed commit.** Keep diagnostics, keys, local logs and tools out of public assets. Keep LICENSE,
   NOTICE and the font and vendor attributions. Do not edit generated output or publish after a failed build.
2. **Keep the app on its own HTTPS origin.** Keep relative imports and the worker scope, `html_handling: "none"`, the root rewrite and
   real asset 404s. Do not move a root service worker onto a shared site or add an HTML fallback for missing JS.
3. **Version the installed client coherently.** After runtime edits run `node tests/pwa.test.mjs --write`, review the hashes and
   rebuild. Keep the explicit update prompt; do not force `skipWaiting` during work or cache unversioned module URLs as immutable.
   Test new and returning clients.
4. **Protect data before changing formats.** Older project and share files keep loading; export a project before destructive storage
   tests. Browser storage is not a backup. Do not clear storage as a migration shortcut or put credentials in static JS.
5. **State privacy accurately.** The app bundles its dependencies, but notebook content can include remote images and links. Do not
   promise zero network traffic because the app's assets are local. Add no telemetry.
6. **Harden headers through browser testing.** The build sends revalidation, `nosniff`, a referrer policy and `noindex`. A strict CSP
   needs an inventory of inline scripts and styles, workers, media and blob URLs and notebook images; stage and test it before
   enforcing it. `_headers` does not cover responses from future Worker code. `robots.txt` is not authentication.
7. **Do not claim performance or compatibility from one headless run.** Record real hardware, sustained frame rates and memory under
   high grid and mode counts; exercise background and resume, rotation and resizing, offline relaunch and permission failures.
8. **Make rollback a rehearsal.** Record the previous deployment id, keep a source tag and project fixtures, roll back once, and verify
   the installed client's update prompt returns it to the previous release. A server rollback does not replace service workers
   already running on visitors' devices.

## Release rehearsal

```bash
bash test.sh node
LW_PORT=8719 GD_PORT=5239 bash test.sh browser
node tools/build-deploy.mjs --quiet
npm ci --ignore-scripts         # the reviewed, pinned deployment CLI
npm audit --audit-level=high
npx wrangler deploy --dry-run
npx wrangler dev
```

Resolve red checks before release; do not use `--no-test` for the release build. The browser gate serves `lab/`; it does not test
Cloudflare's routing and headers. Test Wrangler's assembled origin separately: `/`, `/index.html?__rev=x`, `/sw.js`, module MIME
types, the manifest and icons, the licence URLs, a missing JS file (404), and the hidden infrastructure (`/_headers`, `/_redirects`,
the diagnostic page: 404).

Then test a fresh profile through the photosensitivity notice, an existing saved profile, an offline relaunch after installation, and
version A → B with an old tab left open. Apply the update deliberately and verify the saved state. Repeat on the supported devices,
including the microphone and downloads. Record the git commit, the Wrangler version, the deployment version, the browser/OS/GPU, the
failures and the rollback outcome, and only then publish and mark the release accepted.

## References

- [Cloudflare static asset headers](https://developers.cloudflare.com/workers/static-assets/headers/): `_headers` applies to static asset responses; retest if Worker code is added.
- [MDN service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers): the installation and update lifecycle and cache ownership.
- [MDN WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API): secure context and limited availability; adapter support must be tested.
- [Cloudflare rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/): the deployment version rollback procedure.
