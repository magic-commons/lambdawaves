# λWAVES OPTIMIZATION RUN · 2026-09-24 · the audit brief

Commissioner: Josh. Lead: Fable 5.1 (this session). Auditors: Opus 5.5 agents, one lane each, then a cross-refutation
round, then Sol (GPT via the codex plugin) on the merged plan, then builders. This file is the common boot for every
agent. Read it whole before opening a source file.

## 0. The ask, in Josh's words

"Do a check on the current frozen build and do an entire Optimization run. Think of every optimization path … We can
optimize: window loading, and saving resources when features are off. Graphics/Engine optimization. Refactors to clean
up the code that the old sessions must've left behind (history of iterative work must be checked before inferring the
intentions). Boot up optimization. Loading and Saving Projects. Try to prevent stutters, glitches, breaks, etc.
Something that's quite heavy is the Box mode, 256 axial with max Gas and Box and whatnot. Audit the 64³, 96³, and 128³
field, plus the other 'Quality' options. Optimize the graphics when options in Display and settings are active (Frame
is quite expensive and the UI frost and refractive are costly, so hiding the UI should make it blazingly fast). The old
app used to achieve beyond 60 and more when UI is hidden. We've added all the features we could add. Now it's time to
make it buttery smooth and usable **without changing or bugging anything**."

The last clause is the law of this run: every change must be behaviour-neutral (same pixels for the same state, same
physics numbers, same saved-project format, same controls), or it must be a bug fix with a written proof that the old
behaviour was a defect. Faster is the only thing that may differ.

## 1. Where things are

- Worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24`, branch
  `worktree-optimization-2026-09-24`, base `91c90bc` = `main` = `dev` = the live release v0.2.3-alpha.3.
- Served (read-only, no service worker): `https://127.0.0.1:8721/lab/?preset=1s%2B2pz&sw=0` (the gate server
  `tools/gate/server.py`, self-signed cert; headless Firefox via `tools/gate/gatekit.mjs` accepts it).
- Debug surface: `window.__LW` (see the foot of `lab/rack.js`, the `LW` object). `__LW.gpuFrameMs(n)` = GPU ms per
  frame (reconstruct+present / reconstruct / present) at the current settings; `__LW.perf.median` = the loop's own
  main-thread ms (median of 60); `__LW.stats`, `__LW.meters()`, `__LW.settle()`, `__LW.fieldDigest()`,
  `__LW.readPixels()`, `__LW.windowActivity.state(id)`, `__LW.governor.*`.
- Probe recipe (headless Firefox on the RTX 3070):
  `LW_PORT=8721 GD_PORT=52NN node tests/peek.mjs 'preset=1s%2B2pz' '<js returning JSON>' out.png` — pick a GD_PORT in
  5230–5299 that no one else uses (lane A 5231, B 5232, C 5233, D 5234, E 5235, F 5236). Or write your own probe
  with `import { open } from '../../../tools/gate/gatekit.mjs'` (see `tools/perf/bench-firefox.mjs` for the pattern).
  Headless Firefox renders NO backdrop-filter, so frost/refractive compositor cost is invisible there; the compositor
  numbers come from `tools/perf/bench-chromium.mjs` (Electron on the desktop) and are in `baseline-chromium.json`.
- Baselines (read them): `research/optimization-2026-09-24/baseline-firefox.json` (+ `.log`) and, when it exists,
  `baseline-chromium.json`.
- Gate: `bash test.sh node` (77 node suites, fast), `bash test.sh all` (adds 16 real-browser suites, ~20 min, needs
  ports 8701/5202 — DO NOT run the full browser gate during the audit phase; the lead runs it). After ANY edit under
  `lab/`: `node tests/pwa.test.mjs --write` (re-stamps the precache hashes) or the pwa suite fails.
- History of intent: `REPORT.md` (478 KB, one section per wave — grep the wave a comment names before calling code
  dead), `docs/history/CLAUDE-CODE-HANDOFF.md` (the 2026-09-09 startup/frame-loop passes), `docs/history/LANDSCAPE.md`,
  `docs/REVIEW-2026-09-15.md`, `CHANGELOG.md`, `git log`.

## 2. Laws that bind every proposal

1. **Behaviour-neutral.** Same pixels for the same state (the readback digest `__LW.fieldDigest()` and
   `__LW.readPixels()` must agree before/after where the change touches the field), same physics numbers (the node
   suites), same saved-project bytes (`__LW.serialize()`), same DOM/CSS computed styles (a stylehash harness exists in
   MIR: `~/Documents/MIR/tools/stylehash.mjs`). A numerical change inside fp16 texel precision must be argued explicitly.
2. **`lab/mir/**` and `lab/fonts/**` are the adopted MIR kit — never edit them** (see `CLAUDE.md`; `node
   ~/Documents/MIR/tools/adopt.mjs <app> --check` must keep saying "in step"). A kit-side fix goes upstream to MIR and
   is out of scope here unless it is the only road; say so and stop.
3. **The glass is Josh's design.** Frost, refractive, tinted, the neumorphic seats, the blur radius: proposals may make
   them CHEAPER to composite (fewer layers, promotion, `contain`, `will-change`, avoiding repaints) but never change
   how they look. A proposal that changes the look is a proposal to Josh, flagged, not a task.
4. **Idle is zero work** (§45 in rack.js): when nothing plays, no frame is scheduled. Every optimisation must keep that.
5. **The physics never imports the UI.** Node suites prove the maths with no browser.
6. **Cite before you cut.** For a refactor or a deletion, cite the REPORT.md wave or the commit that introduced the
   code and show the intent is spent. "Looks unused" is not evidence; `tests/wiring.test.mjs` proves reachability.
7. **Measure, don't assert.** Every finding carries a number (ms, bytes, calls per frame, allocations) or a file:line
   and a mechanism. Mark anything not measured as a lead.

## 3. The architecture, in one page (the lead's read of every line of field.js and rack.js)

- **Three layers.** Physics (closed forms, node-testable) → THE FIELD (`lab/field.js`, WebGPU) → THE INSTRUMENT
  (`lab/rack.js` 6080 lines, `lab/modwindow.js` 3084, `lab/kit.js` in `lab/mir/`, ~40 `*view.js`).
- **field.js.** `COMPUTE_WGSL`: one 4×4×4 workgroup kernel; EVERY voxel loops over ALL `P.count` modes reading a
  112-byte record each; spaces 0/5 hydrogen, 1 momentum, 2 oscillator, 3 the well (`sphj` = Miller downward
  recurrence, `start = l + 24 + x` iterations, PER VOXEL PER MODE — this is the axial gas: 256 modes × 128³), 4 helium,
  6 quarkonium (a tabulated radial row, 256 samples). `molWgsl` (chemistry, cap-tiered workgroup tile).
  `RENDER_WGSL`: a full-screen triangle, box intersection, `steps` samples along the ray (default 110/160/240 for
  64/96/128), per step one 3D texture sample + style branching + palette; early exit at alpha .985 (not for additive).
  `LINE_WGSL`: the frame/axes/slice/lattice lines with a 32-rect occlusion discard. `frame()` = one command encoder:
  optional ref compute, optional compute, one render pass. Line geometry is cached by a 32-value signature
  (`linesUnchanged`). `resize()` from a ResizeObserver, DPR capped 2 (1.5 phone/tablet). `throughput()` is the honest
  GPU timer (Firefox zeroes timestamp queries).
- **rack.js loop().** `schedule(tier)` coalesces to the strongest tier; the loop re-arms itself only while playing /
  camera moving / audio / modulation clock / rotation drive. Per frame: `refreshOcclusion` (≤ every 300 ms while
  running: `getComputedStyle` + `getBoundingClientRect` over every visible card/float — a LAYOUT read), corner axis
  placement, frame/axis dataset writes (guarded), `frostSync`, the modulation clock pump (`modSyncBases` every frame
  while the mod clock runs = one getter read per registry id), `clock.advance`, camera integration, REBUILD /
  RECONSTRUCT (`modesAt` → `reg.at` → `packModes` → `encodeCompute`) / PRESENT (`field.resize` + `field.frame`), the
  governor ring (median of 60 rAF intervals; step ladder ×0.7/×0.5 then grid ladder 128→96→64), `cpuTick` (every 4th
  frame in 120 mode) → spectrum/shadow/orbit readers, the overlays (vortex, particles, kepler, fieldlines), the
  molecular session, `canPresent(w)` per window (IntersectionObserver-backed, cheap), `transport.update()`,
  `modView.paint(false)` (self-throttled), METERS at 10 Hz, `sliceMini.paint()`. THE READER LAW (`may()`): while
  playing + governor on, a reader over 16 ms is PARKED (re-probed every 3 s), over 6 ms slowed to every 6×cost.
- **window-activity.js.** One visibility law: a reader presents only if its device is powered, open, unfolded, in
  the visible rack clip, and the UI is visible. Hidden overlay canvases release to 1×1.
- **The material (CSS).** `lab/mir/css/skin.css` + `lab/skin.css` + `lab/lab.css`. FROST = `backdrop-filter:
  blur(--glass-blur)` on `.dev`, `.glass`, `#transport` (`body.frost`); `frost-hold` lifts it while playing under
  STILL. REFRACTIVE = transparent pane (blur alone); TINTED = a .84 pane (thins to .58 under frost). DISCONNECTED =
  head and body each carry their own filter (two backdrop layers per card). `#notebook`, `#menubar .mb-list`,
  `#graphTip`, `.mod-pop`, `#warnPane` carry their own blurs. `body.tablet-motion .dev * { box-shadow: none }` exists
  for the iPad. `#transport.mini { contain: layout paint }`, `.dev { contain: layout paint }`. Hiding the UI (H) =
  `display: none !important` on racks, floats, transport, title, badges, notebook.
- **Boot.** `index.html` → 4 stylesheets + KaTeX css + 2 mod sheets, 2 deferred vendor scripts (marked, KaTeX = 308 KB),
  then `main.js` → `boot()` in rack.js: builds EVERY window's DOM (≈ 25 devices, all their controls, notes and canvases)
  before `LW.ready`, then `reworkNative` re-arranges the DOM (native-ui.js). The service worker precaches 180 files
  (3.8 MiB). Workers (bow / period / cards / chem) are constructed on first demand.
- **Projects.** `serialize()` (rack.js ~5213) = experiment + presentation (mat, quality, domain, palette stops,
  instruments, modulation rack, ui, layout, modwin, camera, overlays, ab, notebook); `restore()` (~5305) is one long
  function that re-seats every control; `projectSnapshot()`/`projectKey()` (~4403) JSON-stringify the whole thing for
  the dirty check; `saveSettings()` (~263) re-reads and re-writes `localStorage` synchronously on many UI events; the
  undo ring (`history.js`) snapshots `hRead()` on a 400 ms quiet timer keyed by `hLiveKey()` (a string of the 91
  coefficients + look).

## 4. Leads the lead already holds (leads, not verdicts — refute them if the code says otherwise)

L1. The axial gas kernel recomputes `sphj(l, k·r)` (Miller recurrence, ~40 iterations) per voxel per mode; a
    tabulated radial row per mode (as space 6 already does for quarkonium) would turn it into one texture/buffer
    fetch. Accuracy vs fp16 texels must be argued; the 16 zeros per l give 256 distinct (l, k).
L2. `gas.fieldModes(t)` allocates 256 record objects + 2 Float64Arrays + `at(t)` allocations EVERY reconstruct while
    the gas plays (rack.js `modesAt` reuses `modeRecs` for hydrogen but not for the gas / molecule / helium / h2 paths).
L3. The compute kernel reads each 112-byte Mode record from storage per voxel; 256 modes × 28 KB per voxel. Staging
    records through workgroup memory in chunks, or splitting the hydrogen-only branch, may help; measure first.
L4. The compute runs EVERY playing frame at full grid even when only the coefficient phases change; hydrogen's E
    depends on n alone (6 degenerate groups) — a "one volume per energy group, complex-combined at present time"
    scheme would make EVOLVE a 6-term combine. That is an architecture change (memory 6× grid); it is a candidate for
    a quality tier, not a silent swap. Weigh it, don't build it in this run.
L5. `refreshOcclusion` calls `getComputedStyle(el).visibility` and `getBoundingClientRect` for every card every
    300 ms while playing: a forced style/layout read on the frame thread; it also runs on every `MutationObserver`
    dirty. Measure its cost with many cards open.
L6. When WebGPU is unavailable, `boot()` throws at `syncPhone` → `field.setDprCap is not a function` (rack.js ~4891,
    also enterPhone/leavePhone): the no-GPU banner path is broken. Measured in Chromium with a failed adapter. A bug
    fix, not an optimisation, but it is a "break".
L7. The present pass samples `psiTex` linearly at `steps` points for every pixel at DPR ≤ 2; at 1920×1080 ×2 DPR and
    240 steps that is ~2 G texture taps a frame at 128³. Candidates: empty-space skipping by a coarse occupancy
    (REPORT.md 2026-09-10 names "brick-occupancy empty-space skip" as the next renderer wave), early-out when
    `rhoMax` is tiny along the ray, a cheaper `hash()` jitter, fewer `select`/branches per step, and the
    `V.p4.w` bow rotation only when on. Also the `for (i < 512u)` loop bound vs `steps`.
L8. `saveSettings()` does `readSettings()` (JSON.parse of localStorage) then a JSON.stringify + setItem on every
    knob `onChange`, theme flip, window close, drag end … synchronously. A debounce/coalesce would remove hitches.
L9. `modSyncBases()` runs every frame while the modulation clock runs: for each registry id a getter, `R.snap`,
    `R.baseOf`, and possibly `R.write`; check what `R.write` costs and whether it dirties history.
L10. Every `paint()` of the modulation window and the transport's `sync()` touch DOM; check what runs at 60 Hz with
    the window closed (`modView.paint(false)` is called every frame; it self-throttles — verify).
L11. `history.js` `dirty()` → `hLiveKey()` → `reg.digest()` (toPrecision on 182 numbers) + `hLookKey()` runs on every
    `canUndo`/`canRedo` read (menus, renderHistory) and on every commit; check who reads it per frame.
L12. Boot builds 25 windows' DOM up front. Deferred construction of closed windows (they ship closed on a first visit)
    would cut `LW.ready` time; the gate reads several closed windows' internals through `__LW`, so the seam must keep
    the API.
L13. `index.html` loads KaTeX + marked (308 KB) as deferred scripts on every boot for the notebook preview only
    (`lab/mir/shell/notebook-render.js` may already lazy-load; check which copy the app uses: `lab/notebook-render.js`
    vs `lab/mir/shell/notebook-render.js`).
L14. The FRAME `lattice` mode uploads 13 872 segments (≈ 776 KB) and `dots` 4 913×3 ticks EVERY time the camera moves
    (the line cache keys on the camera). The lattice is culled on the CPU per vertex per frame (`writeLines`).
L15. `lab/rack.js` carries three near-identical control-seating blocks (restore, hLookWrite, applySettings) and two
    copies of `rgbToHex`; the 2026-09-09 handoff names the 581 KB file as the refactor boundary. Any split must be
    behind the browser gate; propose seams, don't move code blindly.

## 5. The lanes

- **A · RENDERER / GPU.** `lab/field.js` (whole), `lab/render-exact.js`, `lab/capture.js` (how it drives the field),
  `lab/gas.js`, `lab/well.js`, `lab/bessel.js`, `lab/hydrogen.js` (the tables), `lab/molecular-field.js`,
  `tests/render-exact.test.mjs`, `tests/gpu-recovery.browser-test.mjs`, `tests/field-molecule.browser-test.mjs`,
  REPORT.md "Real-time pass" (2026-09-10) and "Measured performance". Questions: where do the GPU ms go at 64/96/128
  for 2 / 4 / 91 / 256 modes (use the baseline, extend it); the axial-gas kernel; the ray-march loop; DPR/scale;
  the steps ladder; the line pass; what the governor's step cap does to the picture; the "QUALITY" options (GRID,
  FIELD CLOCK cap, AUTO SCALE, GOVERNOR, DOMAIN, KEEP FRAMES, PERFORMANCE mode) — which are effective, which are traps.
- **B · FRAME LOOP, SCHEDULING, IDLE.** `lab/rack.js` lines 400–1400 (the loop and the governor) and every call it
  makes, `lab/frame-budget.js`, `lab/frame-coalescer.js`, `lab/mir/window-activity.js`, `lab/clock.js`,
  `lab/state.js` (`at`, `renderSet`, `_observableWeights`), `lab/spectrum.js`, `lab/shadowview.js`, `lab/meters.js`,
  `lab/orbit.js`, `lab/keplerview.js`, `lab/vortex.js`, `lab/particles.js`, `lab/fieldview.js`, `lab/sliceview.js`,
  `lab/dynamicsview.js`, `lab/molecular-session.js`, `lab/registerview.js` (its `update`), `lab/chemview.js`
  (`update`/`pump`). Questions: what runs per frame with the default windows, with every window open, with the UI
  hidden; allocations per frame (Firefox: `performance.now()` deltas; count `new`/`Array.from`/string building in the
  hot path); the reader law's fairness; the 120 Hz mode; what a paused instrument still does; where hitches come
  from (worker replies landing, `busyFlash`, MutationObservers, `saveSettings`).
- **C · UI / CSS / COMPOSITING.** `lab/lab.css`, `lab/skin.css`, `lab/mir/css/base.css`, `lab/mir/css/skin.css`
  (read-only kit), `lab/mir/modulation/modhost.css` (read-only), `lab/mir/modulation/modwindow/modwindow.css`
  (read-only), `lab/index.html`, `lab/native-ui.js`, `lab/modwindow.js` (paint/place/rings), `lab/mir/kit.js`
  (read-only; knob `paint`), `lab/keymap.js`. Questions: how many backdrop-filter layers exist per body state
  (refractive/tinted × frost on/still/off × connected/disconnected × theme) and what each costs (baseline-chromium);
  whether `contain`, `will-change`, `isolation`, layer promotion or `content-visibility` can cut the cost WITHOUT
  changing pixels; per-frame style invalidations (class toggles on body, `dataset` writes, `style.setProperty`
  on `:root`, the `--turn` needle writes, MutationObservers that fan out); the FRAME option's DOM side; the
  ui-hidden fast path (why isn't it "blazingly fast" — what still paints?); the notebook/menubar/tip layers;
  what a 60 Hz `modView.paint` or a knob `paint()` invalidates.
- **D · BOOT, LOADING, PROJECTS, STORAGE.** `lab/index.html`, `lab/main.js`, `lab/sw.js`, `tests/pwa.test.mjs`,
  `tools/build-deploy.mjs`, the import graph (`tests/wiring.test.mjs`), `lab/rack.js` boot order (lines 84–760,
  1484–2560 window construction, 5954–6080 the go), `lab/native-ui.js`, `lab/project-storage.js`,
  `lab/project-import.js`, `lab/statelink.js`, `lab/history.js`, `lab/rack.js` 4337–4600 (notebook/projects) and
  5213–5450 (serialize/restore), `lab/notebook-render.js` vs `lab/mir/shell/notebook-render.js`, `lab/vendor/*`.
  Questions: the time from navigation to `LW.ready` and what it is made of (module graph bytes and count, DOM built
  for closed windows, synchronous solves at boot, fonts); what the first frame waits on; the service worker's
  install cost; `saveSettings`/`localStorage` traffic; project save/open/dirty costs (baseline `projects`);
  `restore()`'s rebuild storm (how many REBUILDs/RECONSTRUCTs one open triggers); the undo ring's cost.
- **E · CODE ARCHAEOLOGY / REFACTOR.** `lab/rack.js` (whole — yes, all 6080 lines), `lab/modwindow.js` (whole),
  `lab/native-ui.js`, `REPORT.md` (the wave sections the comments name), `docs/history/*`, `CHANGELOG.md`, `git log
  -p` where needed. Questions: dead paths (retired windows, `ui.*` handles nothing reads, `__LW_hooks` nobody calls,
  duplicated helpers, the legacy H₂⁺ card), inconsistent seams (three control-seating blocks), comments that
  describe code that no longer exists, `LS_*` keys nobody reads, the `KIND` table vs reality, `reworkNative`'s DOM
  surgery that could be built right the first time. For each: the wave that made it, the evidence it is spent, the
  test that proves the removal is safe. Propose SEAMS for splitting rack.js (which blocks are self-contained), not a
  rewrite.
- **F · STUTTERS, GLITCHES, BREAKS.** Cross-cutting: `lab/mathworker.js` + the `makeWorker` road (reply storms,
  8 s timeouts, transfer lists), `lab/audio.js`, `lab/capture.js` and `lab/render-exact.js` (export locks the loop),
  `lab/stage-gestures.js`, `lab/history.js`, `lab/chemview.js`/`statesview.js` (worker pumps per frame), the
  MutationObservers in rack.js, `setTimeout`/`setInterval` inventory, GC pressure (typed-array churn in `state.js`,
  `gas.js`, `particles.js`, `vortex.js`), `busyFlash` rules, resize/orientation storms, the phone/tablet crossings,
  the L6 no-GPU crash, `restore()` swallowing errors, anything that can throw on the frame path. Questions: what can
  make a frame longer than 250 ms; what allocates per frame; what runs synchronously on a pointer event; what happens
  on tab hide/show; what breaks on a lost device.

## 6. What to deliver: `research/optimization-2026-09-24/AUDIT-<LANE>.md`

Write it with a bash heredoc (`cat > path <<'EOF'`), ≤ 400 lines, in this shape:

```
# AUDIT <LANE> · <title> · <date> · Opus 5.5
## 1. What I read (files, whole) and what I measured (probe scripts under research/optimization-2026-09-24/probes/<lane>/, their outputs)
## 2. Findings, ranked (impact × confidence ÷ risk). For each:
   F<lane><n> · <one-line claim>
   WHERE: file:line(s)
   MECHANISM: why it costs / breaks (one paragraph, concrete)
   EVIDENCE: the number or the citation (baseline field, probe output, REPORT.md wave)
   CHANGE: the concrete edit (what moves where; pseudo-diff welcome)
   NEUTRALITY: why pixels / physics / saved bytes / controls do not change, and the check that proves it
   GAIN: measured or estimated, with the scenario
   RISK: what could go wrong, and the test that would catch it (existing test name, or a new probe)
   EFFORT: S / M / L
## 3. Leads I refute (from BRIEF §4 or anywhere) — with the evidence
## 4. Things I would NOT do, and why (the trap list)
## 5. Open questions for the cross-refutation round
```

Rules for the audit phase: READ FILES WHOLE (the Read tool paginates at ~600 lines; keep going — do not answer from a
page). Do not edit anything under `lab/`; probes go under `research/optimization-2026-09-24/probes/<lane>/`. Use
your own GD_PORT (5231–5236 by lane) against LW_PORT 8721; never `pkill -f` a pattern (it kills your own shell); only
kill PIDs you started. Use `node --input-type=module --check < file` for syntax. Be adversarial: the best finding is
the one that overturns a belief in this brief with a measurement. Mark speculation as speculation.

## 7. Baseline highlights (headless Firefox on the RTX 3070, 1920×1080 CSS px, DPR 1, `baseline-firefox.json`, refined run)

- Boot: `LW.ready` at 975 ms after navigation against the dev server (DCL 394, last module response 865); 104 JS
  modules = 2.99 MB, 7 CSS = 511 KB (KaTeX's sheet is most of it), 3 fonts = 109 KB; 27 devices built, 8 open.
- GPU, hydrogen states (2–4 modes): reconstruct ≈ 0.25 ms; present 1.5 / 3.5–3.8 / 5.3–5.5 ms at 64³(scale .75) /
  96³ / 128³ → the PRESENT pass is the cost for ordinary states, and it scales with pixels × steps.
- GPU, 91 modes: reconstruct 0.75 / 2.0 / 4.3 ms at 64/96/128.
- GPU, styles at 96³/91 modes: cloud 4.0 · solid/grain/signed/dust/bands ≈ 4.5 · additive 3.5 · **GLASS 11.0 ms**.
  Views: density 4.0 · phase 5.0 · real 3.5 · diff 4.0.
- GPU, the BOX packet (27 well labels): reconstruct 1.4 / 2.7 / 6.0 ms. **The AXIAL GAS (256 modes): reconstruct
  16.7 / 50.1 / 116.8 ms at 64/96/128 → 8 fps at 128³.** This is Josh's "quite heavy" case and the single largest
  GPU item (the Miller recurrence per voxel per mode).
- Main thread while playing (the loop's own median ms): default windows 1.36 · UI hidden 0.16 · 5 extra windows
  0.24 · particles+vortex 3.06 · axial gas 128³ 0.48. **Delivered fps in headless Firefox: 14.7 with the UI shown vs
  52.7 with the UI hidden at 96³** — the loop's JS is not where the frame goes; painting/compositing the interface
  over the canvas is (headless Firefox composites in software and renders no backdrop-filter, so the real-GPU
  compositor numbers are the Electron run's, `baseline-chromium.json`). Every playing frame reconstructs
  (`reconPerSec` = fps): the FIELD CLOCK cap is MAX by default.
- Projects: serialize 0.39 ms (9.9 KB), save 1.9 ms, dirty check 0.43 ms, **open 490 ms, restore 463 ms**.
- L6 confirmed: with no WebGPU adapter `boot()` throws at `syncPhone` (`field.setDprCap is not a function`).

## 8. Compositor baseline (Electron 44 / Chromium 152 on the RTX 3070, the desktop session, 1920×1043, DPR 1, `baseline-chromium.json`)

Delivered rAF fps while playing at 96³ (sim-ladder), 3 s per scene, display cap ≈ 117–119 Hz:
- default (refractive · frost ALWAYS · blur 22 · light · 8 windows) **117** · UI hidden 116 · rack hidden 118
- frost OFF 117 · frost STILL 119 · blur 8 114 · tinted+frost 117 · tinted no frost 119 · disconnected 111 · dark 119
- FRAME lattice 117 · dots 117 · off 119 · box 117
- modulation window open **96** · notebook open 117 · **every rack window open 105** · every window open + UI hidden 117
- 128³ axial gas: **14.3** fps UI shown, 14.2 hidden, 14.4 frost off (GPU-bound: the kernel) — and in that scene the app's
  own main-thread median was **10.9 ms with the UI shown vs 0.4 ms hidden** (a reader that costs ~10 ms per frame in the
  gas state — lanes B/F: find it; suspects: gas.stats on the frame thread, the well-mode spectrum/shadow readers).
So on THIS desktop GPU at DPR 1 the glass, the frame and the readers are not the bottleneck; the axial gas kernel is.
Josh's "frost/refractive/Frame are costly" reports come from his phone (Pixel 10 Pro XL, Chrome TWA), the iPad M5 and
possibly Firefox; the HiDPI case (`baseline-chromium-dsf2.json`, device scale factor 2 = 4× present pixels) and the headed
Firefox run (`baseline-firefox-headed.json`, Gecko's real compositor) are being measured now. Headless Firefox's 14.7 vs
52.7 fps was its SOFTWARE compositor: real, but not the desktop user's path.

## 9. HEADED FIREFOX on the RTX 3070 (Gecko's real WebRender compositor, 1920×995, DPR 1, `baseline-firefox-headed.json`) — THE NUMBER THAT MATCHES JOSH'S EXPERIENCE

Delivered rAF fps while playing at 96³ (sim-ladder), display cap ≈ 119:
- default (refractive · frost ALWAYS · blur 22 · light · 8 windows) **80.5** · UI hidden **119** · UI shown again 88
- **frost OFF · refractive 113** · tinted + frost 82 · **tinted no frost 118** · disconnected + frost 83.5 · dark + frost 94
- FRAME lattice 89 · FRAME off 87 · modulation window open **77** · every window open **73** · every window open + UI hidden 117.5
- 128³ sim-ladder: UI shown 93 · UI hidden 119
- 128³ axial gas: 8.3 fps (GPU: reconstruct 118 ms in Firefox's wgpu vs ~70 ms in Chromium's Dawn)
So in Firefox the backdrop-filter costs roughly a third of the frame budget at 96³ (80 vs 113–119) and the modulation
window / many windows cost more — the compositor work IS the desktop bottleneck in Gecko, and it is far worse on a
mobile GPU. Chromium's compositor hides the same work at 117 fps. Lane C's target: the same pixels, fewer/smaller
blurred layers, no per-frame invalidation of blurred surfaces. (The Electron "DSF 2" run used the same 1920 physical
pixels at 960 CSS px, so it did not test the retina case; ignore it.)
