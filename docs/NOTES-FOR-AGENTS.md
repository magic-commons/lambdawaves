# Notes for agents

For an assistant helping someone run, tune or contribute to λWAVES. These are the facts that save the most
time. Each one names where it comes from in this repository; external links are in those files. Where a note
and the code disagree, the code is right; please say so in an issue.

## 1. Frame rate on an iPad or iPhone (Safari)

- By default Safari runs `requestAnimationFrame` at about 60 Hz even on a 120 Hz ProMotion iPad. The user can
  lift the cap under Settings → Apps → Safari → Advanced → Feature Flags → "Prefer Page Rendering Updates near
  60fps" (turn it off). The WebKit preference is `PreferPageRenderingUpdatesNear60FPSEnabled`, default on. No web
  API changes it, so the app cannot. Source: `research/optimization-2026-09-24/WEBKIT-FPS-RESEARCH.md` §1.1.
- Low Power Mode halves the page's rAF rate (60 → 30) and the system also drops the display to 60 Hz. There is no
  web API to detect it. Source: same file, §1.2 (WebKit `AnimationFrameRate.cpp`).
- Settings → Accessibility → Motion → Limit Frame Rate caps the display at 60 Hz. A hot device may also lower the
  rate. Source: §1.2 (Apple's own wording for Limit Frame Rate is marked unverified there).
- Check these three before blaming the code. The device report (section 5) measures the display's cadence with
  nothing playing, which shows the cap directly.
- Measured on an M5 iPad Pro (Safari 26): every scene plays at the display's cap, 120 fps with the flag off and
  60 with it on. Source: `docs/OPTIMIZATION-2026-09-24.md` §3, "The iPad afternoon".
- Safari 26 stalls rendering for 220–270 ms the first time a render pipeline is used (a new view or draw style),
  even after the async compile has resolved. WebKit bug 324043, fixed upstream after 26 shipped. Source:
  WEBKIT-FPS-RESEARCH.md §1.4 and the device reports under `research/device-reports/`.

## 2. WebGPU needs a secure context

- `navigator.gpu` exists only on `https://` pages or on `localhost` / `127.0.0.1`. A plain `http://` LAN address
  gets no WebGPU and the app shows its no-GPU banner. Source: `tools/gate/server.py` (header comment).
- `./serve.sh [port]` serves the repository over HTTPS with a self-signed pair it makes in `.certs/`
  (`LW_CERTS` names another folder); open `https://127.0.0.1:8700/lab/` and accept the warning once. Source:
  `serve.sh`, `tools/gate/server.py`.
- For another device on the same network, `./serve-lan.sh [port]` binds every interface (default 8710;
  `MB_CERTS` names the certificate folder). Safari on iPadOS 26 has WebGPU on by default; on iPadOS 18 it is a
  feature flag under the same Advanced menu. Source: `serve-lan.py` (header comment).

## 3. Reading GPU times

- Firefox zeroes timestamp queries and resolves `onSubmittedWorkDone` on a ~100 ms tick. A sub-millisecond frame
  therefore needs batches of at least 2.5 s before the division means anything: `__LW.field.throughput({ targetMs:
  2500 })`. Source: `lab/field.js` (the `throughput` comment), AUDIT-A FA5.
- For the same reason the loop is not paced to the GPU in Firefox. Safari and Chromium answer a drained queue in a
  few ms and are paced (at most four frames in flight). Source: `lab/field.js` (the `paced` comment).
- rAF intervals measure delivered cadence, not GPU execution time. Source: `lab/frame-budget.js`.

## 4. Quality: GRID, AUTO SCALE and PERFORMANCE

- SETTINGS → FIELD QUALITY → GRID picks the volume and sets the march steps and render scale with it: 64³ = 110
  steps × 0.75, 96³ = 160 × 1, 128³ = 240 × 1. Source: `lab/first-run.js` (`GRID_PAIRING`), `lab/rack.js`
  (`ui.gridSeg`).
- AUTO SCALE (same group) moves the canvas backing scale, never the grid. Once 250 ms and six frames have passed
  it compares the median rAF interval with the frame budget, jumps once to the scale that should fit (not below
  0.35), then holds. Pausing returns it to 1 and draws one full-resolution frame. Source: `lab/rack.js` (the
  AUTO SCALE comment above `autoScaleStep`), `tests/auto-scale.test.mjs`.
- METERS → PERFORMANCE sets the budget. `120 Hz`, the default, uses the display's observed cadence (as short as
  8.33 ms) and updates the CPU readers every fourth frame. `FULL` keeps a 16.7 ms (60 fps) budget and updates
  readers every frame. On a 120 Hz panel, `120 Hz` makes AUTO SCALE chase 8.3 ms (the M5 iPad settles at 0.75
  and plays at 120 fps); `FULL` only scales down below 60 fps. With Safari's 60 fps flag on, the observed cadence
  is 16.7 ms and the two agree. Source: `lab/frame-budget.js`, `research/optimization-2026-09-24/NEXT-MOVES.md`.
- What counts as a tablet: an iPad (its UA, or a Mac-reporting iPad with touch points), or a coarse, hover-less
  pointer on a screen at least 600 px on its short side. A phone is skin.css's `--phone` breakpoint. Source:
  `lab/rack.js` (`isTablet`, `isPhone`).
- A tablet starts at 64³ × 110 × 0.75 and never marches more than 96³: a saved 128³ opens as 96³ × 160 × 1. A
  phone runs 64³ × 110 × 0.75 (its crossing applies it and gives the old values back on the way out) with frost
  off. Both cap the device pixel ratio at 1.5; a desktop caps it at 2 and starts at 64³ × 160 × 1. Source:
  `lab/first-run.js` (`FIRST_RUN_QUALITY`, `QUALITY_CEILING`, `deviceQuality`), `lab/rack.js` (`syncPhone`,
  `enterPhone`), `tests/first-run.test.mjs`.
- A project file never turns AUTO SCALE off on the device that opens it, and the bundled demos carry no quality,
  theme, card style, frost or camera feel. The device's stored choices always win over first-run defaults.
  Source: `lab/first-run.js`, `tests/first-run.test.mjs`, CLAUDE.md (the first-run paragraph).

## 5. The device self-report

- On the desktop run `./serve-lan.sh`; on the device open `https://<desktop LAN address>:8710/lab/?report=1&post=1`
  and keep hands off for about three minutes. A toast says what it is doing. Source: `tools/perf/device-report.js`,
  `serve-lan.py`.
- It records the platform (UA, pointer, DPR, viewport), the display's cadence with nothing playing, the WebGPU
  adapter and its features, the settings as found, a set of scripted scenes in 250 ms bins (card, frost, AUTO
  SCALE, style, view, hide, grid and project-open edges, with the pacing counters), a 30 s play, GPU throughput at
  the three grids and the page's backdrop-filter inventory. Source: the header of `tools/perf/device-report.js`.
- It never saves and puts every setting back; `restored` in the JSON proves it. `&only=grid` or `&only=project`
  runs one scene. The project-open scene skips over a current project or unsaved changes unless `&force=1`.
  Source: same file (`runFromFlag`, "THE LAW").
- With `post=1` the JSON is POSTed to `/report`; `serve-lan.py` writes it to
  `research/device-reports/<UTC time>-<device>.json` (at most 2 MB, never overwriting). Without a POST route the
  toast offers COPY. Read reports with `node tools/perf/device-report-summary.mjs [files or folder]` (`--brief`
  for one row per device). Source: `serve-lan.py`, `tools/perf/device-report-summary.mjs`,
  `research/device-reports/README.md`.
- The report is a diagnostic in `tools/`, never precached. A host that serves `lab/` alone (the deployed site)
  cannot load it. Source: `tools/perf/device-report.js` (header).

## 6. The gates before a change lands

- `bash test.sh node` (also `npm test`) runs every `tests/*.test.mjs`, pwa last. `bash test.sh all` adds every
  `tests/*.browser-test.mjs` in a real headless Firefox against its own HTTPS server; it takes about 20 minutes
  and uses the GPU. Source: `test.sh`.
- After any edit under `lab/`, run `node tests/pwa.test.mjs --write`: it re-stamps the service worker's precache
  hashes in `lab/sw.js`, or the pwa suite fails. Source: AI_POLICY.md, RELEASING.md.
- The digest lock proves a change leaves the field's pixels identical across states × grids × styles × lines:
  `LW_PORT=<port> GD_PORT=<port> node tools/perf/digest-lock.mjs --check --fixture
  research/optimization-2026-09-24/digest-lock-base-w125.json` against a tree served by `tools/gate/server.py`.
  Source: `tools/perf/digest-lock.mjs` (header).
- A change to CSS or to what the page builds at boot is checked with MIR's `tools/stylehash.mjs` (computed
  styles and pixels, theme × card × frost, before and after). Source: `research/optimization-2026-09-24/BUILD-BRIEF.md`.
- `node tools/changelog.mjs --check` fails when CHANGELOG.md is out of date with the tags. Source: that file.
- The standing law: the same state draws the same pixels, a saved project keeps the same bytes and the controls
  stay the same, unless the change is a proven bug fix or the owner ruled it. Source:
  `docs/OPTIMIZATION-2026-09-24.md` §1.

## 7. Where things live

- The physics proofs are the node suites: `tests/hydrogen.test.mjs`, `sturmian`, `helium`, `h2`, `scf`, `well`,
  `momentum`, `wigner`, `qho`, `kepler`, `radiation`, `gas` and the rest of `tests/*.test.mjs`. Each checks the
  code against an oracle outside it (tables, closed forms, quadrature). Derivations are under `research/`.
- Every key is PREFERENCE (settings, never in a project or link), WORKSPACE (the window arrangement) or PROJECT (the work): `docs/STATE-SCOPES.md`.
- NEW opens the hidden empty project `lab/new-project.lambdawaves.json` through the same restore-with-rollback road as any project; `node tools/new-project.mjs --check` proves the shipped file byte-exact against the modulation model and the boot defaults. The undo ring covers the whole PROJECT scope (not the camera pose, the notebook text or the quality hint): `serialize({ scope: 'edit' })` in, `restore(S, { history: true })` out; a project open, a link and NEW each start a new timeline whose bottom row is named for its origin.
- The laws: CLAUDE.md (the standing rules for agents), REPORT.md (the notebook every session appends to), `docs/`
  (the optimization record, `ui/STYLE-LOCK.md`, `SHIPPING-READINESS.md`) and RELEASING.md.
- `lab/mir/**` (and `lab/fonts/**`) is the adopted MIR interface kit. It is read-only here: changes go to
  [MIR](https://github.com/magic-commons/mir) first, then are adopted, and `node <MIR>/tools/adopt.mjs <repo>
  --check` must say "in step". Source: CLAUDE.md, AI_POLICY.md.
- The debug surface is `window.__LW` (`serialize()`, `restore()`, `fieldDigest()`, `readPixels()`, `perf`,
  `governor`, `quality`, `layout`, `report()`). Source: `lab/rack.js` (`const LW = {`).

## 8. Playing a release snapshot

- Every release has a playable copy made by `node tools/snapshot-release.mjs <tag>`: the tag's `lab/`, `serve.sh`
  and server, exported with `git archive` into `~/Documents/LAMBDAWAVES-RELEASES/<tag>/` (`LW_SNAPSHOTS` moves
  it). To play one: `cd` into it, `./serve.sh 8790`, open `https://127.0.0.1:8790/lab/`. Source:
  `tools/snapshot-release.mjs`, RELEASING.md.
- From a clone, `git worktree add ../lw-<tag> <tag>` and `./serve.sh` there does the same.
- Projects and settings live in the browser's storage for one origin (host and port). A snapshot served on another
  port starts fresh and cannot touch the projects of the copy on 8700. Source: `lab/rack.js` (the settings and
  projects keys in `localStorage`).
- The installed app is cache-first and changes build only through ABOUT → UPDATE APP; `?sw=0` declines the service
  worker for development. Source: `lab/main.js`, `lab/sw.js`, `tests/pwa.test.mjs`.
