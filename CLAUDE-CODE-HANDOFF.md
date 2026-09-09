# Claude Code debugging, cleanup and shipping handoff

## Deep startup and frame-loop pass — 2026-09-09

The ready boundary and steady animation loop now avoid work whose inputs have not
changed. This pass preserves the current appearance, saved-project format and exact
physics results.

- The bow, period and heavy-card module workers are constructed on first demand.
  Their park state is retained before construction, so a worker first requested in
  a background tab receives PARK before its job. Fresh boot, playback and the common
  exact-period readout start zero workers. The speculative bow warm-up begins only
  after three seconds and in browser-declared idle time while transport is paused.
- Register population, mute/solo eligibility and render ordering are cached by
  `reg.version`. Reconstruction evolves the coefficient vector once and CPU readers
  reuse it on the same frame. Energy and autocorrelation share one versioned
  normal-mode population spectrum. A 2.5-second playback probe fell from 92 to 40
  `reg.at()` calls, 54 to 1 population walks and 41 to 0 redundant `renderSet()` calls.
- Exact commensurate density periods are solved synchronously before the scan worker
  exists. Hydrogen, stationary states and the oscillator take this fast path;
  incommensurate spectra still use the bounded worker scan and its existing stale-job
  protection.
- Marked and KaTeX remain ordered but load as deferred scripts. In comparable local
  cold-page runs, DOM interactive moved from 142 ms to 39 ms. Service-worker
  registration waits 1.5 seconds and then uses idle time with a 6.5-second deadline,
  keeping the 3.79 MiB first precache away from the first field and first gesture.
  A fresh-profile probe found no registration at ready or 706 ms, then an active
  registration at 1.875 seconds.

Fresh tablet-size Firefox/WebGPU acceptance retained the official defaults and
demand-loaded heavy cards. Pressing H suspended every tracked window, released all
overlay canvases to 1×1 and reduced loop CPU EMA from 2.508 ms to 0.252 ms with no
rebuild. Modulation stress remained dormant while closed and stopped; with seven
LFOs and six routes open it performed 24 paints in the sample, 19 ms total and about
1.85 ms per painted frame. No page, worker or registry-callback errors occurred.

The complete `npm test` gate passes, as do current-app Firefox acceptance, four-cycle
WebGPU recovery, the 64³ → 96³ → 128³ → 64³ grid sequence, PWA hash verification and
the deployment build. The verified build is 148 files and 4.33 MiB; 131 entries and
3.79 MiB are precached. The remaining high-value refactor boundary is the 581 KiB
`rack.js` and 197 KiB `modwindow.js`: split those incrementally behind the current
behavior gates rather than combining module extraction with further scheduling work.

## Visibility scheduling and startup pass — 2026-09-09

Window presentation now follows one rule in `lab/window-activity.js`: a reader or
overlay runs only while its device is powered, open, unfolded, in the visible rack
clip, and the interface is visible. Closing, folding, compacting, scrolling away,
hiding the racks, or pressing H suspends its presentation without changing saved
power or feature switches. Returning to view schedules one catch-up presentation.

- Spectrum, Shadow, Orbit, Dynamics, Slice, QCD, Atoms, Wigner, Radiation,
  Calculus, meters, the molecule panels, Ladder, Electrostatics, Vortex, particles,
  Kepler and their stage overlays use the shared eligibility service.
- Hidden overlay canvases release their backing stores to 1×1. Vortex and Field
  also release them while their own overlay switch is OFF, even if their cards are
  visible. Particle time rebases while suspended, preventing a catch-up burst.
- MO curve work and Slice's private animation pump pause out of view. Ladder's
  initial recurrence scan is lazy. The closed Helium card now defers its roughly
  77 ms six-term variational solve until first display, explicit query, or enable.
- H requests presentation only; it no longer causes a field rebuild. The boot warm
  kick waits for idle time, and the Tempo panel's old permanent 200 ms timer exists
  only while that panel is open. Hidden readout DOM writes are skipped.
- Overlay costs have separate profile slots, making the governor and future tuning
  able to distinguish Vortex, particles, Kepler and field lines.

Fresh Firefox/WebGPU validation at an 834×1194 tablet viewport found only Spectrum
and Shadow active at first load; MO/Ladder/Helium background work remained deferred.
Opening Helium computed and painted it. With all expensive overlays enabled, H made
every tracked window inactive, released all four overlay canvases to 1×1, caused no
rebuild, and reduced the measured loop EMA from 5.30 ms to 0.47 ms on this host.
Scrolling made the selected Dynamics card active while clipped Orbit and Vortex
remained suspended. No page errors occurred. Current-product browser acceptance and
the four-boot WebGPU recovery/grid sequence pass. The historical monolithic browser
gate still asserts the superseded rule that folded or closed readers keep computing;
do not restore that behavior to make it green.

## Demand-loaded card work and modulation pass — 2026-09-09

Heavy card preparation now starts when the card is opened. Helium's Hylleraas solve,
Ladder's full recurrence scan, and H₂'s 221-point correlated curve run through a
dedicated card worker, separate from the bow and period queues. The views and worker
import the same pure solver modules. If workers are unavailable, the fallback yields
through an animation frame before doing the same computation. Molecule's existing
sliced queue also waits until the card is visible or explicitly requested.

While a requested card is calculating, its face dims and locks. Desktop keeps the
existing pointer-following busy mark; touch/coarse-pointer layouts also show that
mark and CALCULATING in the centre of every waiting card. Loading is keyed per card,
so overlapping work cannot unlock the card early. Shift multi-add dispatches every
selected heavy card immediately, including cards which initially land below the
rack clip. Browser acceptance covers all four cards entering and leaving loading,
and verifies their completed results. On this host the formerly blocking default
Ladder solve was roughly 472 ms and Helium roughly 77 ms.

The modulation painter now separates structural work from live values. Its 120 Hz
tick no longer repeats device labels, routing rings, path geometry, layout reads,
static classes, and unchanged accessibility attributes. A headless 834×1194 stress
probe with seven LFOs and six active routes measured open-window paint work falling
from 125 ms over the sample to 19 ms (about 85%), and loop EMA from 6.33 ms to
1.72 ms. With the window closed it issued one transition paint and then none; with
the transport stopped it scheduled zero frames and paints. Headless animation-frame
cadence was 14–19 FPS, so these are comparative CPU timings rather than an iPad FPS
claim. No page, registry-callback, or worker errors occurred.

## iPad/Safari performance pass — 2026-09-09

The reported tablet regression was isolated to repeated presentation work rather
than a larger ray-march volume. FRAME OFF and BOX already skip the radius-8 mesh;
LATTICE and DOTS keep their full approved distance and appearance.

- `lab/field.js` now caches frame/axis/slice geometry until the camera, domain,
  viewport, theme, slice, or chrome controls change. This removes regeneration and
  `queue.writeBuffer` of up to ~1 MiB on unchanged field frames. The check uses a
  fixed allocation-free signature. `field.stats.chromeWrites` exposes the uploads.
- The slice plane preview skips hidden windows and repaints only when its plane,
  position, theme, card, or size changes. Corner-axis placement and legacy mode
  attributes avoid unchanged DOM writes.
- A non-phone touch-tablet profile caps canvas DPR at 1.5. During playback, camera
  motion, or modulation-driven motion it caps presentation at 110 ray steps; the
  selected project quality returns on the first still frame. This runtime cap is
  not serialized and does not alter saved project settings.
- Official first-run defaults are Frost OFF, Card Style REFRACTIVE, Glass Blur
  22px, Performance 120 Hz, Grid 64³, and Keep Frames OFF. Performance mode now
  persists like the other browser preferences. Explicit existing choices remain.

Focused real-Firefox/WebGPU validation: fresh defaults matched all six settings;
an unchanged 12-frame lattice batch made zero additional chrome uploads, while a
camera move, mode change, and OFF change each caused one; simulated iPad Safari
identity measured DPR 1.5 and 110 moving steps, restoring full steps on pause. No
page or shader errors occurred. An 80-frame comparison measured OFF 6.263 ms,
BOX 3.763 ms, DOTS 3.837 ms, and LATTICE 5.013 ms on this host; these are local
throughput figures, not device promises. The verified deployment build contains
146 files (~4.30 MiB), and the service-worker content hashes were regenerated.

The monolithic historical browser gate remains unsuitable as a release verdict:
it contains numerous assertions for superseded layout/default rules and was already
red across those sections. Do not rewrite the app to satisfy those old laws. The
current focused tests, current-app acceptance, GPU recovery gate, Node suites, PWA
integrity gate, and deployment build are the relevant checks for this checkpoint.

## Review and cleanup — 2026-09-09

Preserved the approved layout, visual styling and physics behavior. This pass
concentrated on notebook rendering, saved-project integrity and GPU diagnostics:

- Extracted notebook Markdown sanitization/rendering from `lab/rack.js` into
  `lab/notebook-render.js`. Formula HTML is now inserted only into text nodes.
  Formula syntax inside attributes stays literal and undergoes the normal URL
  checks. This prevents generated markup from breaking out of attributes after
  sanitization. KaTeX styles, inline/display formulas and escaped fallback remain.
- Shared `validateProjectCollection()` between storage reads and imports. Imports
  now reject malformed existing records and non-string recent paths before writes,
  preserving the original collection. No user storage or old saves were deleted.
- Extended temporary GPU texture cleanup to cover pipeline creation, encoder setup
  and buffer allocation failures, and throughput completion failures. Readback
  functions now have consistently indented resource scopes.

Validation: all 53 Node suites passed; current-app Firefox acceptance passed with
WebGPU available, including new hostile notebook markup/attribute regressions;
GPU recovery acceptance passed all four boots and the 64/96/128/64 grid sequence.
The deployment build passed (146 files, ~4.30 MiB), with the new module included
in the regenerated service-worker precache. Changes are local, not deployed.

Remaining review boundaries: the large rack/modulation modules and historical CSS
layers still warrant incremental extraction with current-behavior acceptance.
This pass does not certify the obsolete layout gate, microphone hardware, mobile
GPU behavior, long sessions, or installed-PWA updates in production. Preserve the
latest style lock when tackling those areas; do not revive old UI rules.


## Successful GPU/reload retry — 2026-09-09

This supersedes the environmental GPU blocker recorded below. On retry the host
had ~26 GiB available RAM, zero swap use and no leftover geckodriver processes at
initial inspection. A blank-page GPU probe succeeded with default limits, requested
maximum texture limits and low-power preference.

`tests/gpu-recovery.browser-test.mjs` passes on the real Firefox WebGPU renderer:
initial boot plus three consecutive reloads from dirty projects, no page/uncaptured
GPU errors, nonblank density readback, finite field values, and the expected ~0.998
integrated density. Grid changes 64³ → 96³ → 128³ → 64³ also pass without GPU
errors or NaNs. The test requires a functioning GPU; a CPU-only UI cannot pass it.

`tests/current.browser-test.mjs` also passes again with GPU available: clean boot,
new-project save/open including subtitle, failed-delete preservation, malformed
storage, missing-KaTeX fallback, and keyboard macros across close/reopen.

Both runs exited zero. No runtime changes were needed for this retry. This clears
the reproduced allocation failure and reload stall in the recovered environment;
it is not a certification of the entire historical UI suite, long sessions, mobile
hardware, real microphone use, or production/installed-PWA behavior.

Reproduce with the HTTPS server running, using unused driver ports:

```bash
LW_PORT=8751 GD_PORT=5383 node tests/gpu-recovery.browser-test.mjs
LW_PORT=8751 GD_PORT=5382 node tests/current.browser-test.mjs
```

## GPU/reload investigation — 2026-09-09

The GPU allocation error reproduces on an empty HTML page before importing any app
code: default device limits, maximum texture limits and low-power adapter preference
all returned “Not enough memory left.” At inspection there were 24 headless Firefox
instances and 58 geckodrivers, with swap nearly full; NVIDIA reported ~6 GiB free
VRAM. This identifies a browser/host failure, not a demonstrated oversized app texture.
Termination of the known abandoned test browser was denied by the OS/Snap confinement.
No shared GPU reset, reboot, or unrelated-browser termination was attempted.

Reload itself completed and `__LW.ready` became true, but a direct two-rAF probe
received no animation frames for 1.5 seconds despite a visible document. The old
`settle()` could therefore hang indefinitely. It now requires two real frames but
rejects after three seconds with GPU/visibility diagnostics. A later fresh-browser
probe completed three reload/settle cycles, with no page errors, but GPU allocation
still failed. Rendering acceptance remains blocked on a healthy browser/host.

The historical GPU gate now stops on missing GPU and explicitly checks reload boot
and GPU readiness; it propagates the harness's returned error object instead of
silently continuing. It does not convert missing frames into a green render proof.
GPU diagnostic readbacks (pixels, lines, voxels, digest and stats) now release their
readback buffers on submit/map failures; pixel/line textures are also released after
readback failure. This is scoped cleanup, not a complete renderer lifecycle rewrite.

Focused frame-settle and GPU-cleanup regressions pass, as do render-exact, PWA,
syntax and deployment build checks (145 files, ~4.30 MiB). The entire historical
browser gate was not certified. No claim is made that the external GPU failure has
been repaired. Restart abandoned test browsers from outside the confined agent or
restart the desktop session after saving work, then rerun the GPU gate.

## Current-app debugging follow-up

Josh clarified that old-save migration is not a priority; focus on reliable new
projects and the latest approved UI. No existing user storage was cleared.

Reproduced and fixed in the current app:

- New sessions appeared dirty immediately: automatic domain sizing changed half-width
  from 7 to 16 after the clean baseline. Ignore computed half-width while DOMAIN AUTO
  is on; manual half-width and the AUTO toggle still count as edits.
- Notebook subtitle edits were absent from the project dirty key. They now trigger
  unsaved-change protection and round-trip through a new project.
- A quota failure during delete returned true and cleared the current project even
  though the saved record remained. Delete now reports failure and preserves current.
- Malformed stored collections threw in list/recent, and malformed JSON could be
  replaced by an empty collection during save. Reads now validate, report a visible
  error, and refuse overwriting invalid storage. No migration or clearing was added.
- Project names such as `__proto__` now save as own properties; inherited object
  properties cannot be opened/exported/deleted as projects.
- Opening still loads a valid project if updating its recent-history timestamp fails,
  but the status explicitly reports that history could not be saved.

Validation: **51 Node suites pass**; PWA integrity, syntax, and build pass (**144
files, 4.30 MiB**). `tests/current.browser-test.mjs` passed on the real Firefox UI:
clean boot, save/open notes+subtitle, failed deletion, malformed storage, missing
KaTeX fallback, and real macro arrow keys across compact/full and close/reopen.
No page errors. The Firefox session reported **WebGPU device request failed: Not
enough memory left**; these results certify the exercised UI paths, not GPU rendering.
The historical monolithic browser gate and its reload stall remain unresolved.

Run the focused test with an owned server and an unused driver port:

```bash
python3 tools/gate/server.py . 8742
# Separate terminal:
LW_PORT=8742 GD_PORT=5369 node tests/current.browser-test.mjs
```

The focused test uses a fresh WebDriver profile and changes only that profile's data.
Its cleanup failure is nonzero rather than being swallowed as a successful run.

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
- Defaults: Frost **OFF**, card style **REFRACTIVE**, glass blur **22px**, performance **120 Hz**, grid **64³**,
  and Keep Frames **OFF**. Accent A remains **30°**, Accent B **300°**, and Vivid **10%**.
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
