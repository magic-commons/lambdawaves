# Claude Code debugging, cleanup and shipping handoff

## Follow-up: project import integrity

After shipping checkpoint `23328bf`, a focused pass fixed project import reporting
success when storage rejected the write. `lab/project-import.js` now validates the
project envelope and metadata before reading storage, accepts legacy files without
a version, rejects unsupported explicit versions, and caps imports at 8 MiB UTF-8.
The file-input handler checks size before reading the file. Model migration remains
owned by `restore()`; this is not full experiment-schema validation.

Import now reads stored JSON strictly: corrupt JSON/read failures are surfaced,
not replaced with an empty collection. Failed writes throw before UI refresh or a
success result. Import builds a new collection, preserves other projects, and treats
`__proto__` as an ordinary own property rather than changing a prototype.

`tests/project-import.test.mjs` covers malformed metadata, byte limits, legacy files,
failed writes, existing-project preservation and special names, and executes the
actual rack import method with storage/render seams. Focused import, final-ii,
wiring, PWA, module syntax and build checks pass. Payload: **143 files, 4.30 MiB**.
The full Node/browser gates were not rerun for this follow-up; there are now 50
Node suites. Reload stall, full model validation, real-browser import acceptance,
and storage failure handling in other project operations remain open.

## Latest checkpoint: shipping preparation (2026-09-08)

This section supersedes the older verification/build status below. The earlier
freeze and macro keyboard sections remain the behavior contract and history.
The incoming baseline is `78ecb30` on `codex/macro-keyboard-fixes`; this new commit
contains release-tooling fixes, a notebook security fix and this handoff. There were no uncommitted changes
at the start. No remote is configured; no push, deployment or release tag was made.

**Your task:** perform major debugging and then refactoring/cleanup while preserving
Josh's approved behavior below. Treat this as a release candidate preparation,
not an already accepted release. Read [shipping readiness](docs/SHIPPING-READINESS.md)
for the prioritized release blockers, implemented safeguards and release rehearsal.

Current verification:

- `bash test.sh node`: all **49** discovered suites pass on Node **22.22.1**,
  including the new release/harness and notebook-security regression suites. The original 46-suite
  baseline also passed before the changes.
- `node tools/build-deploy.mjs --quiet`: **142 files, 4.29 MiB**, complete and
  verified. PWA hashes were regenerated after the notebook fix; all hashes verify.
- Shell and changed JS syntax checks, focused harness/packaging regressions, and
  `git diff --check` pass. Tracked-source scan found no private-key PEM material;
  this is not an exhaustive credential audit.
- Browser baseline: **102 assertions emitted, 25 red**, then stalled during B88's
  reload sequence and was interrupted. This is an incomplete failing run. Read the
  [committed failure ledger](docs/BROWSER-BASELINE-2026-09-08.md); no full browser
  acceptance is claimed for the subsequent notebook fix.
- `npm ci --ignore-scripts` and Wrangler **4.129.0** deployment dry-run pass; no
  assets uploaded. The deploy toolchain is locked, with **sharp 0.35.4** overridden
  to fix its reported dependency advisory. `npm audit` reports **zero vulnerabilities**
  in the npm graph; this does not cover vendored browser libraries.
- Twelve local Wrangler HTTP checks passed: entry URLs (no redirect), module/worker
  MIME, manifest and public documents, cache/security headers, missing asset 404s
  and private deployment files/diagnostic page 404s. This is local serving evidence,
  not a production or installed-PWA test.
- The workflow is committed for future GitHub execution, not claimed as a hosted
  CI result. No production checks or physical-device acceptance were performed.

Security fix: notebook TeX fallback previously inserted raw text as HTML after
sanitization when KaTeX was unavailable or threw. `lab/notebook-math.js` escapes
that fallback and explicitly disables KaTeX trust; `rack.js` uses it and safely
leaves unknown placeholders alone. The regression exercises hostile text under
both fallback conditions and verifies the normal render options. Browser-level
notebook acceptance remains part of your pass.

What else changed: test mode selection and automatic suite discovery; HTTPS startup and
cleanup; removal of an accidental certificate dependency on another project;
refusal to attach to a pre-existing geckodriver session; configurable browser paths;
public-asset packaging guards; credential ignore rules; pinned read-only CI actions;
a reproducible audited deployment toolchain; and current shipping documentation. Regression tests run temporary fixtures and
check actual failure propagation, mode isolation, port refusal and cleanup. Their
browser fixture verifies the runner, not app or GPU behavior.

Start your debugging pass here:

1. Run the Node gate, then the browser gate on unused ports, retaining its exit code.
   `LW_PORT=8719 GD_PORT=5239 bash test.sh browser` is the command used here.
2. Triage the red browser assertions against the user-approved behavior in this
   file and `docs/ui/STYLE-LOCK.md`. Old 18px-blur and Settings-keyboard expectations
   are obsolete. Zero-area Spectrum targets, undo drag/key failures and exceptions
   need reproduction before deciding whether the app or the test is wrong.
3. Preserve the numerical/GPU correctness checks while separating stale visual
   contracts into focused native-UI tests. Do not mark an exception/no-result as a
   pass, suppress GPU errors, or restore retired UI merely to make the gate green.
4. Reproduce macro/transport/project lifecycle behavior and add portable regressions
   for isolated defects. Then consolidate CSS and split `rack.js` by ownership.
5. Complete device, microphone, installed-PWA update and rollback acceptance from
   the readiness checklist before declaring the app ready to ship.

Local full logs: `.tmp/shipping-node-final.log`, `.tmp/shipping-build.log`, and
`.tmp/shipping-browser-isolated.log`. Logs are ignored; the compact browser ledger
is committed for a fresh clone. `gatekit.judge` truncates details to 300 characters,
so reproduce individual failures with fuller diagnostics instead of guessing from
truncated objects. Default-port failure originally came from someone else's active
session; startup now refuses that port rather than touching it.

---

2026-09-08. Josh explicitly requested freezing the app, committing **all current
working-tree changes**, and handing it to Claude Code for major debugging,
refactoring, and cleanup. The original freeze baseline is `5f6421e`; see the latest checkpoint section above
for subsequent work and current verification.
No push or deployment is part of this freeze. Checkout at freeze: `main`.

## Scope and reading order

This snapshot combines work from several passes, not just the last UI edit:

1. This file: latest behavior and remaining risks.
2. `docs/ui/STYLE-LOCK.md`: user rulings, with later amendments taking precedence.
3. `NATIVE-UI-REWORK.md`: native window composition and material/Bow/slice changes.
4. `AUDIO-RANGES-HANDOFF.md`: audio conditioning, per-band ranges and timings,
   model version 106, and test boundaries.
5. `FINAL-II-HANDOFF.md`: deterministic export, frame/axis controls, macro route
   model extensions, and other earlier changes in this same checkpoint.
6. `docs/ui/ARCHIVED-MACRO-TOOLS.md`: disabled features that must stay parked.

Older handoffs describe superseded layouts and intermediate experiments. In
particular, bounded Spectrum/Settings scroll areas, flat native buttons, the
header-only collapsed macro rail, and active matrix/relocation buttons are obsolete.
The historical wave-107 all-green browser claim does not certify this checkpoint.

## User-approved behavior to preserve

- First-visit LEFT: SHADOW, SPECTRUM. RIGHT: SETTINGS (folded), STATE (folded),
  PALETTE, WAVE, CAMERA, SLICE/CLIP. Other windows and modulation start closed.
  This startup arrangement survives reload; legacy saved visibility is respected.
- Settings order is DISPLAY / LOOK / QUALITY, initially DISPLAY. DISPLAY has a
  2×2 grid: STATUS TAGS, HINT BAR, STAGE CAPTIONS, WINDOW INFO. Only WINDOW INFO
  defaults off. Its separate `lw-window-info` localStorage preference is remembered.
  It hides both native info popovers and legacy header information buttons.
- Defaults: glass blur **11px**, Accent A **30°**, Accent B **300°**, Vivid **10%**.
  Existing saved settings are not silently reset. With PALETTE off, accents sample
  the λWAVES palette independently of the selected palette or hue shift. With it on,
  accents follow the active palette. Restore full value arcs, including the accent
  selectors and modulation dials; ENV heading and signal use Accent A.
- Native controls retain sculpted kit buttons, recessed exclusive-choice tracks,
  raised selected segments, and accent lamps for latched switches. Readouts and
  XYZ sphere/plane controls have shaded inset basins in both themes. Avoid nested
  borders. Preserve general original control location and compact grouping.
- Native window lists expand rather than scroll internally, except History.
  Spectrum shows all 91 labels; DIALS starts hidden. Phase/rate stacks own compact
  vertical sizing, not horizontal knob-row flex sizing. Hover/live numeric labels
  must not change window geometry. Explicit folds/tabs may resize windows.
- SHADOW has PHASORS / OSC / LISSA and a separate disclosure arrow. Its readout and
  exact-real-representation caption start hidden. CAMERA control mode/autorotate
  share a row; EXPORT FRAMES has a separate arrow hiding export/picture/loop details.
  PALETTE has no seam readout. SETTINGS reset/forget/warning actions live in LOOK;
  keyboard editing belongs only to the standalone `?` window.
- Wave shape and finish are separate, including signed/solid glass. Bow's gain,
  curve and limit affect actual gestures. Slice/Clip mini-model edits arbitrary 3D
  normals; ordinary Slice has the same control. KS disables the ordinary 3D mini.
- Native tempo expansion shares the plugin clock, sync, cadence, tap and holds.
  RATE sits centered in the plugin tempo bar; its value floats outside the bar.
  Editing BPM does not resize the bar. Docking reopens the native transport at the
  top left by default, or its remembered side/slot. Project/layout order wins.
- Macro minimize means **narrow**, not hide: 200px full → 112px compact, 336px tall,
  retaining routing grips and numbered value knobs. Compact knob controls macro
  value; expanded number knob controls master depth. Source-driven values remain
  source-controlled. Folding must immediately repaint values/ARIA and reopening
  must not duplicate controls or lose state. This distinction deserves UX review
  during debugging, but do not silently change it while cleaning CSS.
- ENV header TRIG is hidden/disabled. Macro-side relocation and matrix launchers
  are hidden/disabled, with their implementation archived in place for later work.
  Do not re-enable them or confuse the parked relocation button with the live
  per-macro routing grips. Modulation's broader visual design is intentionally
  distinct; avoid a blanket native styling sweep over it.
- Logo menus use glass blur and the browser top layer above floating windows.
  Disconnected selected native headers tint with Accent A; rack-switch is removed.

## Implementation map and cleanup targets

`lab/native-ui.js` composes the native windows near the end of rack boot. It moves
existing controls rather than recreating their behavioral owners, wraps some setters,
and provides infoPanel and planeModel. `lab/skin.css` contains successive overrides;
`lab/modhost.css` has a long existing specificity ladder plus recent overrides.
These are obvious consolidation targets, but verify computed styles and interactions
before removing a seemingly redundant rule. Hidden selectors and inline dimensions
have repeatedly beaten otherwise reasonable changes.

`lab/rack.js` owns settings, boot arrangement, project layout, docking, accents,
menus, Bow/capture integration. `lab/modwindow.js` owns macro gestures, rebuilds,
compact state, tempo edit seat sizing, and audio UI. Macro rebuilds replace slot
nodes: check focus, held gestures, routing, trigger macros, and source-bound macros
through rebuild/open/close transitions. The basic hand-macro lifecycle is tested;
those broader combinations are not fully accepted yet.

`lab/field.js`, `lab/frame-budget.js`, `lab/render-exact.js`, `lab/mir/host.js`, and
`lab/mir/mod.js` include substantive earlier rendering, scheduling, deterministic
export and model work. Read their diffs and dedicated handoffs before refactoring.
The font binary/source-note changes and earlier tests/docs are deliberately included
in this all-changes freeze. The `lab/mir/modwindow/` artifact was not rewritten by
the recent host UI pass; prefer its host extension points.

## Verification and known limits

Recent focused desktop browser checks established:

- Exact startup rack order and folds, including after reload; modulation closed.
- Inactive palette changes left the computed accent unchanged.
- SHADOW/details and CAMERA/details disclosures shrink and restore geometry.
- Spectrum phase/rate knobs fit 56px lanes; keyboard input changes phase and a
  hide/show cycle returns to the same height. All 91 labels have no inner scrollbar.
- Settings status grid, default angles, computed inset shadow and info suppression.
- Macro repeated compact/full + close/reopen: widths 112/200px, exactly two number
  seats, hand value 23% preserved, expanded master depth 100% preserved; correct
  VALUE/DEPTH ARIA labels and expanded state throughout four cycles.
- Docking produces a visible first card in rackL; loading a layout with transport
  after STATE in rackR restores that position, including undock/redock.
- Tempo bar width remained 481.15px before editing, during editing, and after 120 BPM
  was accepted. Menus reported `:popover-open` and computed glass blur.

Accessibility, wiring, syntax and PWA/build checks passed during the last UI pass.
Freeze checks passed: native-ui, final-ii, audio (52/52), render-exact (40/40),
and PWA integrity. Full historical node and
browser gates were **not rerun** for this freeze. Do not treat this as exhaustive QA.
No real microphone/device acceptance, full mobile acceptance, or production test.

Headless Firefox intermittently loses its WebGPU device (including an out-of-memory
message). Some runs initialize and render; others exercise the CPU/UI with a device
loss banner. No claim is made that GPU reliability is fixed. Distinguish GPU errors
from uncaught page errors and investigate during the debugging pass. The local
geckodriver harness can throw `kill EACCES` during cleanup or encounter a stale port;
that is not an application failure, nor is swallowing cleanup errors a green gate.

Temporary browser probes/screenshots/logs are under ignored `.tmp/` on this machine
(e.g. `lifecycle-check.mjs`, `default-check.mjs`, `compact-check.mjs`). They are
investigation evidence, not durable automated tests or part of the checkpoint.
Create meaningful portable regressions as defects are isolated. Avoid spending the
whole debugging pass reconciling historical source-text assertions.

## Build and next actions

- Runtime code is under `lab/`; generated `dist/` is ignored. Do not edit dist.
- After runtime edits: `node tests/pwa.test.mjs --write`, then
  `node tools/build-deploy.mjs`. Current verified payload: 140 files, ~4.29 MiB.
- Relevant focused suites are in `tests/`; `bash test.sh node` runs the broad node
  suite and `bash test.sh` adds the historical browser gate. Scale checks to changes.
- Start with baseline reproduction, then isolate lifecycle/layout issues before
  consolidating CSS and decomposing rack.js. Keep user-approved behavior stable.
- Preserve project/share compatibility, actual routing physics and capture state
  restoration. Default native share parameters preserve old encoded bytes; new
  material parameters use an optional backward-compatible section.
- This is a local commit only. Do not assume push/deployment authorization.

## Post-freeze follow-up: macro keyboard controls

Josh authorized a focused debugging pass after the freeze. On
`codex/macro-keyboard-fixes`, numbered macro controls and macro value bars now enter
Tab order and handle Arrow keys (1%), Shift+Arrow (0.1%), Home and End. The host
uses `lab/slider-keys.js`; source-driven values reject writes and expose
`aria-disabled`, while expanded master depth remains editable. Space and modified
application shortcuts remain untouched. The frozen artifact is unchanged.

`tests/slider-keys.test.mjs` covers actual macro model depth/value separation,
recreated control bindings, fine increments, bounds and source locks. It is included
in the node runner. Real Firefox key input additionally verified depth 100→99,
compact value 0→1, preservation through close/reopen, then 1→2. No page errors.
This does not certify every trigger/routing/microphone interaction. Accessibility,
PWA integrity and local build passed for this follow-up.
