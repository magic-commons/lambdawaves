# AUDIT D · BOOT, LOADING, PROJECTS, STORAGE · 2026-09-24 · Opus 5.5

## 1. What I read, and what I measured

**Read whole:** BRIEF.md (both revisions), lab/index.html, lab/main.js, lab/sw.js, tests/pwa.test.mjs, tools/build-deploy.mjs,
tests/wiring.test.mjs, lab/native-ui.js, lab/project-storage.js, lab/project-import.js, lab/history.js, lab/notebook-render.js
+ lab/notebook-math.js and both lab/mir/shell copies (byte-identical: same sw hashes 60f8e1193c27 / fa1312541d4c),
lab/vendor/package.json, lab/statelink.js (header, readLink, linkFor), lab/rack.js 1–1010 (settings, applySettings, field,
workers, backgrounded tab, schedule), 1425–2560 (loadPreset + every window's construction), 3233–3346, 4205–4232 (LEAN,
taxonomy), 4337–4600, 4870–4900 (syncPhone), 5212–5705, 5880–6080. Targeted reads: field.js createField (677–830),
modwindow.js place/paint/sync/open (172–240, 2623–2935), ladder.js, gas.js createGas, moleculeview.js refresh/load,
chemview.js dynamic imports, mir/plane-model.js, mir/kit.js device/el/onThemeChange, CLAUDE-CODE-HANDOFF.md §§ startup /
demand-loaded / review, LANDSCAPE.md. Re-read baseline-firefox.json (01:48Z run: ready 975, open 489.8, restore 463.2).

**Method.** `probes/D/instrument.py` builds `probes/D/lab-i/` = a symlink tree of lab/ whose rack.js/field.js carry only
`performance.mark` statements and counters (every window, every createField phase, every restore() sub-step, every
`= createX(` constructor timed), plus `pre.js` as the first script in <head>: counters on localStorage, JSON, getContext,
createElement, and a logger for every layout read > 1 ms with its stack. lab/ is never touched. Variants from the same
script: `lab-p` (FD1 prestart), `lab-m`/`lab-pm` (modulepreload), `lab-k` (no marked/KaTeX), `lab-l` (FD2 ladder fix),
`lab-g` (L6 guard). Headless Firefox, RTX 3070, 1920×1080, fresh profile per run, GD_PORT 5234, A/B runs interleaved.

| probe (probes/D/) | output | what it answers |
|---|---|---|
| boot.mjs (3+3 runs, ×3) | boot.json, boot2.json, boot3.json | the LW.ready timeline, DOM/canvas/storage counts, forced layouts |
| boot-chromium.mjs | console (numbers below) | the same createField split in headless Chromium |
| compare.mjs (A/B, 4–5 runs each) | compare-prestart.json, compare-preload.json, compare-prestart-preload.json, compare-nokatex.json | ready + first presented frame + digest/limits neutrality |
| graph.mjs | console | the static module graph: 101 modules, 2.66 MB, 6 discovery levels |
| projects.mjs | projects.json | open()/restore() sub-steps, schedules, saves, dirty check, saveSettings cost |
| ladderfix.mjs | console | FD2 gain and neutrality proof |
| nogpu.mjs | console | L6 with `dom.webgpu.enabled=false`, shipped vs guarded |
| sw.mjs | sw.json | SW install cost; warm controlled vs warm uncontrolled vs cold boot |
| precache.mjs | console | what the 201 precache entries are, by reachability |
| abkeys.mjs | console | the ABOUT-size key loss (FD4) |

**Where the ~1.1–1.4 s to LW.ready goes (Firefox cold boot, boot3.json, 3 runs):**

| phase | ms | of which |
|---|---:|---|
| navigation → first script | 61–78 | document start |
| module graph fetch + evaluate (html-start → boot-start) | 470–550 | 101 modules / 2.66 MB, 6 discovery levels (rack.js alone 526 KB, 63 direct imports); fetches end ≈ 500, evaluation ≈ 50 |
| **createField** (boot-start → field-end) | **520–600** | **requestAdapter 387–449 · requestDevice 121–129** · shader modules + compile-info 6 · pipelines + buffers 3 |
| window construction (windows-start → go:start) | 143–177 | 40–45 of it forced synchronous layouts (below); ctors: SliceView 28–35 (incl. a 28.6 flush), Modulation 9–19, **Gas 14–18**, H2 4–7, Shadow 4–6, Ladder 2.5–6.4 |
| the go (go:start → lw-ready) | 35–54 | applySettings 20–33 (24 = one forced layout inside modView.sync), reworkNative 6.6–10, markClean 1.6–3 |
| first presented frame after ready | 34–54 | |

Headless Chromium for comparison: graph 338–370, createField **40** (adapter 4.5, device 2.1, compile-info 19–24), windows
188–210, go 49–53 → ready 633–693. **The Firefox boot is GPU-adapter-bound; the DOM build (L12) is 12–14 % of it.**

Boot builds: 27 devices (8 open), 4 496 elements (3 544 createElement calls), 1 984 of them inside closed/hidden devices,
31 canvases (28 2D contexts; 12.5 MB of backing incl. the 7.6 MB field), 86 knobs, 2 789 CSS rules in 8 sheets. Storage at
boot: 15 getItem, 25 setItem (24 are the LEAN key, one per window, 0.34 ms total), **0 real saveSettings**, 8 readSettings,
12 JSON.parse (0.04–0.12 ms total). Forced layouts before ready: 60–67 ms (slice planeModel 28.6, modwindow closed-state
paint 7.0 + 24.1, modwindow place 4.5, H₂⁺ legacy paint 2.4); after ready: plane-model theme repaint 16.3, palette 13.8.

## 2. Findings, ranked

**FD1 · Request the WebGPU adapter and device from the top of <head>, in parallel with the module graph: LW.ready −41 %, first frame −38 % (Firefox).**
WHERE: lab/field.js:682–694 (the two awaits), lab/rack.js:758 (`await createField` before any window), lab/index.html <head>.
MECHANISM: requestAdapter cannot start until all 101 modules are fetched and evaluated (boot-start ≈ 470–630 ms), and then
boot waits ~520 ms for adapter + device before building one window. The request needs neither the DOM nor any module.
EVIDENCE: boot2.json phase marks (table above). compare-prestart.json, 4 interleaved fresh sessions each: ready median
**1273 → 750 ms** (min 1101 → 732), first presented frame **1327 → 823 ms**; the early adapter starts at 64–117 ms and the
device is ready at 540–640 ms ≈ boot-start, so createField shrinks from ~520 to 7–40 ms.
CHANGE: new `lab/gpu-boot.js`, no imports:
`const P = navigator.gpu ? navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }).then(async (adapter) => { if (!adapter) return { adapter: null }; const want = {…the two maxTextureDimension limits…}; try { return { adapter, device: await adapter.requestDevice({ requiredLimits: want }), limitsRequested: want }; } catch (_) { return { adapter, device: await adapter.requestDevice(), limitsRequested: null }; } }).catch((e) => ({ error: e })) : null; export const gpuBoot = () => P;`
index.html: `<script type="module" async src="./gpu-boot.js"></script>` directly after `<meta charset>` — ASYNC, because a
deferred/module script waits for the 7 stylesheets (they end at 112–145 ms) while an async module runs as soon as it
arrives. field.js imports `gpuBoot` (same URL → same module instance) and replaces its own adapter/device block with it,
keeping every error string (`navigator.gpu is absent…`, `no WebGPU adapter`, `WebGPU device request failed: …`). One copy
of the request logic (AP6). Then `node tests/pwa.test.mjs --write`.
NEUTRALITY: same call, same options, same limits; only the start time moves. Measured: fieldDigest identical
(`hash 65025801, integral 0.9980811769456057`), `limitsRequested` {32767, 32767} identical, adapterInfo identical, 0 errors.
Check: compare.mjs, pwa + wiring suites (gpu-boot.js becomes a root AND an import), gpu-recovery.browser-test, nogpu.mjs.
GAIN: −450…−520 ms LW.ready on a cold headless-Firefox boot (measured); ≈ −30 ms Chromium (its whole createField is 40 ms);
iPad/Safari unknown — the lead should measure there. A warm-process reload gains less (sw.mjs warm boots are 442–569 ms).
RISK: listeners (`uncapturederror`, `device.lost`) attach later than the device exists — no command is submitted before
createField attaches them, and `lost` is a promise (a late `.then` still fires). gpu-boot.js must never reject unhandled
(the `.catch` above). Test: a browser block asserting field.ok + limits + digest; nogpu.mjs for the absent path.
EFFORT: S.

**FD2 · Every project open blocks the main thread 0.42–1.5 s solving the LADDER, a card that ships closed.**
WHERE: lab/ladder.js:160 `set(p) { Object.assign(P, p); …; clockFx(); compute(); }`, reached from rack.js:5382
(`if (I.ladder) ladder.set(I.ladder)`); every project this build saves carries `instruments.ladder` (rack.js:5230).
MECHANISM: compute() = synchronous `solveLadder(P)`. The 2026-09-09 "Demand-loaded card work" pass moved the INITIAL solve
behind prepare()/the card worker ("formerly blocking default Ladder solve was roughly 472 ms"), but `set()` — the restore
road — still solves unconditionally, active or not.
EVIDENCE: projects.json, open(default): marks `ri:ladder → ri:particles` = **421 ms of a 463 ms open**; no other sub-step
exceeds 13 ms. This IS the baseline's openMs 489.8 / restoreMs 463.2. With LADDER params nbar 42 (the gate's own project
block uses them): ladderfix.mjs open() = **1464–1504 ms shipped, 41–72 ms fixed**. The bundled WAVE DANCER demo predates
`instruments` and opens in 76–104 ms, which is why nobody saw it there.
CHANGE: `set(p) { …same…; clockFx(); if (active) compute(); else schedule(); }` — `schedule()` is ladder.js's own
`dirty = true; generation++; arm()`, and arm() is a no-op while inactive; opening the card runs prepare() on the card worker
exactly as a first open does, and the `last` getter already computes on explicit demand.
NEUTRALITY: an OPEN card keeps the synchronous road, byte for byte. Proof (ladderfix.mjs, shipped vs fixed): fieldDigest
equal, `ladder.params` equal, hash of `ladder.last` equal (3783773321), serialize() equal except `presentation.layout.at`
(a Date.now stamp that differs between any two sessions). Only `ladder.computed` differs (false until demanded) — the
gate's own boot law (`tests/current.browser-test.mjs:14 assert.equal(boot.ladderComputed,false)`).
GAIN: open()/restore() of any current project −420 ms (default params) to −1.4 s. The undo ring and links never carry
`instruments`, so they are unaffected either way.
RISK: a caller that expects `set()` to leave a fresh result for a CLOSED card — none in lab/ (grep: only restore);
tests/current.browser-test.mjs:173 calls `__LW.ladder.set` and then asserts params only. EFFORT: S.

**FD3 · L6 confirmed: without WebGPU the boot throws at syncPhone and the visitor gets "boot failed", not the designed banner.**
WHERE: rack.js:4891 syncPhone, plus enterPhone/leavePhone — 3 `field.setDprCap(` sites; createField's failure object has
no methods. The `resize`/`orientationchange` listeners call syncPhone too, so every later resize would throw again.
EVIDENCE: nogpu.mjs, Firefox `dom.webgpu.enabled=false`: shipped → banner **"boot failed — field.setDprCap is not a
function"**, `BOOT syncPhone@rack.js:4891 < boot@rack.js:5986`, LW never ready. Guarded copy (lab-g) → LW.ready, banner
"WebGPU unavailable — navigator.gpu is absent…", then resize + play + pause + theme + project save + open: **0 errors**.
CHANGE: `if (field.ok) field.setDprCap(…)` at the three sites. (Stubbing methods onto the failure object is wider and riskier.)
NEUTRALITY: the WebGPU path is untouched (field.ok is true). A bug fix: the designed no-GPU behaviour is rack.js:762's banner.
Test: nogpu.mjs as a browser block (one pref). EFFORT: S.

**FD4 · BUG: the ABOUT face's remembered size is erased by the next preference change.**
WHERE: rack.js:4569–4576 nbSaveSize writes `abW/abH` into the settings key; saveSettings (rack.js:280) rebuilds the object
carrying nbW, nbH, layouts, warned, audioDevice — not abW/abH: the same hole waves 54, 59 and 105 each closed once.
EVIDENCE: abkeys.mjs: resize ABOUT to 520×600 → key holds abW 520/abH 600; `setTheme('dark')` → both gone; reopened 470×670.
CHANGE: add `abW: S0.abW, abH: S0.abH` to the carried keys. NEUTRALITY: restores the intended behaviour (show() reads them).
EFFORT: S.

**FD5 · 60–67 ms of forced synchronous layout inside the boot, all caused by windows that are closed or hidden.**
WHERE / EVIDENCE (boot3.json slow reads, with stacks):
- modwindow.js:2745 `paint(true)` measures `g.box.clientWidth` while the window is closed — via `setModArm` during the
  transport build (7.0 ms) and via `applySettings → modView.sync()` (**24.1 ms**, most of applySettings' 20–33 ms).
- modwindow.js:229 `place()` reads two rects while closed (4.5 ms in createModulation; again in every restoreModulation).
- sliceview.js:95 → mir/plane-model.js:23 `cv.clientWidth`: the SLICE card is appended to the rack *before* its view is
  built, so its planeModel paint forces the first full style+layout of the half-built rack (**28.6 ms**); the card is then
  closed a few ms later by the first-visit furniture.
- moleculeview.js:65 refresh → paint at construction on the hidden legacy H₂⁺ card (2.4 ms; 8.6 ms again per restore).
- after ready, kit.js onThemeChange → both planeModels repaint (16.3 ms): the first-ever `data-theme` is set by
  applySettings at the END of boot, so the observer sees '' → 'light' and the whole document restyles once more.
CHANGE: (a) modwindow.js (app code, not the kit): in paint's device loop `if (!P.open) { g.sig = ''; continue; }` BEFORE the
clientWidth read, and in place() skip only the rect-reading block while `!P.open` (open() already runs
`rebuild(); place(); paint(true)`). (b) rack.js: `rack.appendChild(wSlice.root)` after `createSliceView(…)` — a
disconnected canvas answers 0 without a flush, and the plane-model's own ResizeObserver paints it once laid out.
(c) moleculeview refresh(): skip paint() while the canvas is not rendered (`!cv.isConnected || cv.closest('[hidden]')`,
neither reads layout). (d) resolve the theme once at the top of boot beside the existing `document.body.dataset.card = …`
(rack.js:262, which exists for exactly this reason), through one small `resolveTheme()` that setTheme also uses (AP6).
NEUTRALITY: every guarded read answered "closed / not laid out" anyway (w ≤ 8 → `g.sig = ''`); the final DOM, classes and
computed styles are unchanged. Check: MIR stylehash on a first visit before/after, current.browser-test, mir.test (no kit
file touched; `adopt --check` stays in step), and a boot3-style slow-read log showing no pre-ready reads.
GAIN: ≈ 40–60 ms of main thread across boot + first frame (one full layout, ~25–30 ms, is still paid once at first paint;
the saving is the repeated flushes and the post-ready restyle). Restoring a project with a modulation rack: −10–20 ms.
RISK: a later reader relying on a closed-window measurement — open() re-measures everything. EFFORT: M.

**FD6 · createGas builds all 256 axial-gas radial tables at boot (14–18 ms) for a BOX mode that is off by default.**
WHERE: gas.js:43–54 — `build()` at construction: 256 modes × 200 radial points of `sphj` (Miller recurrence).
EVIDENCE: `ctor:createGas` 14.2 / 18.2 ms (boot2 / boot3). CHANGE: build lazily on first need — `ensure()` at the top of
launch/at/fieldModes/overlap and the modes getter; setRadius marks dirty instead of rebuilding. NEUTRALITY: the same pure
tables, built later; the node suites pin the numbers. Lane A owns gas.js — coordinate. EFFORT: S.

**FD7 · paintMarks runs 7× at boot (9.8 ms) and 10× per project open (7–12 ms); only the last call is ever seen.**
WHERE: rack.js:190 (querySelectorAll over every mark rect + WCAG ink solves), from applyAccent, setStageMix,
setStageColour/Follow, busyHost. EVIDENCE: counters `paintMarks` 7 / 9.78 ms (boot3), 10 / 7.1–12.1 ms (projects.json).
CHANGE: a `markBatch` depth: restore() and the boot's build section increment it; paintMarks inside a batch only sets
`marksDirty`; the batch end calls it once. NEUTRALITY: paintMarks is a pure function of (palette LUT, hue, theme, stage), so
the final `fill` attributes and λ colours are the last call's. Check: `__LW.logo.colours()` and the rect fills before/after
an open. GAIN: −8 ms boot, −6–11 ms per open. EFFORT: S.

**FD8 · The precache is 201 entries / 5.26 MiB (not the brief's 180 / 3.8 MiB); 1.13 MB (20 %, 40 entries) is never loaded by any code path, and a first visit downloads ≈ 9.3 MB.**
WHERE: sw.js §1 = "every file under lab/ minus the SKIP rule" (pwa.test §C). EVIDENCE: precache.mjs — EAGER 110 files
3.48 MB, DEMAND 51 files 0.91 MB, **NEVER 40 files 1.13 MB**: `lab/oracles/` 430 KB (PySCF pins read from disk only by five
node tests and chem.browser-test), `lab/mir/shell/**` 690 KB (the MIR 1.4.2 shell staged under wiring's ALLOWLIST, including
a second full KaTeX + marked), `mir/palette.js` 33 KB (allowlisted orphan). 28 content-duplicate groups = 607 KB stored
twice. sw.mjs: install = 201 fetches, 5.52 MB, 0.68–1.39 s, starting 1.48 s after ready; the page had already transferred
3.79 MB, and install re-downloads all of it by design (`cache:'reload'` + `?__rev`).
CHANGE: (a) move `lab/oracles/` → `tests/fixtures/oracles/` (six test paths + the two molecules.js comments that name it);
(b) either a sw.js / pwa.test / build-deploy NOT_PRECACHED rule for `mir/shell/**` while those files are ALLOWLIST orphans
(rule and allowlist expire together, 2026-11-20), or better, finish the allowlist's own stated migration (app notebook → the
kit shell and its lazy `loadRenderer()`, then delete lab/vendor/katex + marked.min.js), which removes the duplicate AND the
two deferred scripts. NEUTRALITY: nothing in the running lab references these files (precache.mjs walks static + dynamic +
worker + fetch + font-face + manifest references). Check: pwa suite (rule + NEVER_PRECACHE prose), wiring, build-deploy V1.
GAIN: −20 % install bytes and fetches (−1.13 MB per new visitor; −0.6 MB of Cache Storage). EFFORT: S (a), M (b).
Cite before cut: the lead/lane E should confirm the wave that placed oracles in lab/ (REPORT.md "fix-mol6 / fix-mol8").

**FD9 · chemview imports molecule-state.js at construction, pulling 6 chemistry modules (88 KB) into every boot.**
WHERE: chemview.js:628 `import('./molecule-state.js')` → rhf-molecule, scf, density, rpa-inspector, canon-gauge.
EVIDENCE: boot.json late resources at 1105–1320 ms (during / just after ready), evaluated on the main thread in the first
frames. CHANGE: import on first `prepare()` (record() awaits it there). NEUTRALITY: record() returns null until a solve
exists, and no solve exists before prepare(). GAIN: small (6 requests, 88 KB parse after ready). EFFORT: S.

**FD10 · modulepreload hints: −8 % alone on localhost, +9 % once FD1 lands — do not ship without a real-network number.**
EVIDENCE: compare-preload.json ready 1163 → 1074 ms (boot-start −40…−70 ms); compare-prestart-preload.json ready 729 → 798 ms
(the parallel fetch delays the early adapter by 40–70 ms). On a real network (6 discovery levels × RTT) it should win a cold
first visit; if shipped, generate the 100 `<link rel="modulepreload">` lines from wiring's graph with a self-repairing
`--write` check (AP6), never by hand. EFFORT: S. Lead to measure against the deployed origin first.

## 3. Leads I refute

- **L8 (saveSettings hitches).** 50 calls = 4.72 ms → **0.094 ms per call** (951-byte key: parse + DOM reads + stringify +
  setItem). Boot makes **0** real writes; a project open 4 (0.74 ms); a theme flip 1. 51 call sites in rack.js + 8 via
  `saveNative`, all on discrete events (onChange, drag end, close, fold), none per frame. A coalescer buys ≤ 0.1 ms per event
  and reopens the carried-keys hole that three waves fixed (FD4 shows it is still open). The design, if ever wanted, that
  keeps the read-back law: `pending = buildSettings(readSettings())` + one flush on `setTimeout(0)` / pagehide /
  visibilitychange; `readSettings()` returns a structured copy of `pending` while it is set, so `LW.settings` stays
  synchronous; and the direct writers (rack.js:1532 FORGET, 2838, 3987, 3991, 4572/4575, 6002) must flush first or go
  through it. Not advised.
- **"One JSON parse of settings per boot instead of N."** 8 readSettings + 4 other parses at boot = 0.04–0.12 ms total.
- **"restore() triggers a REBUILD storm."** One open: 12 × schedule(REBUILD) + 18 × schedule(PRESENT) coalesce into **exactly
  one** rebuild frame (projects.json `rebuilds: 1`, 12–17 ms; 23–35 ms with a modulation rack). The cost was synchronous: FD2.
- **L11 / the undo ring.** hLiveKey 0.05–0.12 ms, hRead 0.1–0.3 ms, renderHistory 0.14–0.28 ms per ring change (≤ 10
  buttons); 50 × canRedo = 0.08 ms (short-circuits on the cursor). Readers: the EDIT menu on draw, renderHistory on change —
  nothing per frame. `note()` is one clearTimeout/setTimeout per version bump and returns early while a drive runs.
- **projectKey / the dirty check.** 0.66 ms (serialize + stringify + modSyncBases), called only on destructive acts,
  beforeunload, UPDATE APP and after save/open. (Aside for lane E: it calls modSyncBases() — a registry WRITE inside a read.)
- **Q7 openLink with no fragment.** `readLink` returns at `indexOf('#') < 0`; measured 0.0–0.1 ms.
- **L13 as a boot win.** Removing marked + KaTeX + its sheet (lab-k) changed nothing measurable: ready medians 1200 vs 1173,
  inside the run-to-run spread (Gecko parses deferred scripts off-thread, behind a GPU-bound boot). The honest reasons to do
  it are bytes (308 KB per cold visit) and the 600 KB duplicate — FD8(b).
- **"KaTeX's sheet is most of the 511 KB of CSS."** katex.min.css is 23 KB. The kit's modhost.css (146 KB) + modwindow.css
  (128 KB) are 274 KB of it — kit files (lane C / MIR upstream).
- **"The SW fetch handler adds latency."** It removes it: warm process, same machine — controlled ready 442–569 ms / DCL
  166–196, uncontrolled 710–963 ms / DCL 404–664 (sw.mjs; cold uncontrolled 1354–1541). Memoising `caches.open(CACHE)` per
  request is possible and is noise next to that.
- **L12 as stated.** The DOM build is 143–177 ms of 1 100–1 400 (Firefox). Closed/hidden windows hold 44 % of the elements
  and ≈ 50 ms of construction (+ the 28.6 ms slice flush FD5 removes). Real, but behind FD1/FD5/FD6.

## 4. Things I would NOT do

- **A hand-rolled bundler in build-deploy.mjs.** No-deps repo → a custom ES-module concatenator (scope hoisting across 101
  modules), a dist that no longer matches what pwa/wiring prove, and a precache re-derived for rewritten files. The SW already
  removes the network from every second visit (−250 ms measured) and FD1 removes the long pole.
- **Wholesale lazy construction of closed windows (L12).** serialize/restore/`__LW`/the modulation registry/the gate read
  every view object (`slice.save()`, `qcd.load()`, `LW.helium`, …). A proxy per view is a large, risky surface for ≈ 50 ms.
  Do FD5/FD6 first; revisit per window behind the browser gate.
- **Dynamic-importing view modules on first open.** ~733 KB of the eager graph belongs to closed cards / on-demand engines,
  but their factories run synchronously at boot; this can only follow lazy windows, never precede them.
- **Making `ladder.set()` asynchronous for an OPEN card.** Keep the synchronous road where the user can see it (FD2).
- **Coalescing saveSettings** (§3); **per-project localStorage keys** (a storage migration — noting only that open/save parse
  and rewrite the whole `lambdawaves.q0.projects` collection: 40 KB after two projects, linear in project count);
  **switching the SW install to `cache:'no-cache'` revalidation** (would nearly halve first-visit bytes but trades away the
  `?__rev` stale-byte guarantee — a policy question for Josh, not a task).

## 5. Open questions for the cross-refutation round

1. Is Firefox's 387–449 ms `requestAdapter` a headless / fresh-process artifact? Warm reloads suggest GPU-process start-up is
   most of it. A headed desktop Firefox and an iPad Safari number are needed before quoting FD1's gain to Josh.
2. Lanes A/B: FD6 (gas.js) and FD5(a) (modwindow.js paint/place) are in your files — any objection to the closed-state guard?
3. Lane C: does setting `data-theme` at the top of boot (FD5d) change any first-paint pixel? (It should remove one restyle.)
4. Lane E: which wave placed `lab/oracles/` in the served tree, and is the MIR shell migration (FD8b) scheduled?
5. Lead: FD10 needs a measurement against the deployed origin (real RTT) before anyone adds 100 preload lines.

## §2 FD1 addendum — headed (answers open question 1)

Probe: `probes/D/compare-headed.mjs` → `compare-headed.json`. HEADED Firefox 155 on the desktop session (DISPLAY=:0,
Gecko's GPU process on the RTX 3070), 1600×900, GD_PORT 5234, LW_PORT 8721, 4 interleaved runs per variant, fresh profile per
run. In each session the lab boots twice: COLD (new Firefox process) then WARM (a navigation in the same process). For
lab-p the adapter/device times are the early (<head>) request's own; createField is then only what boot still waits for.

| median (4 runs) | ready ms | first frame ms | createField ms | requestAdapter ms | requestDevice ms |
|---|---:|---:|---:|---:|---:|
| shipped (lab-i), cold | **1180** (1154–1238) | **1220** | 553 | **415** (404–430) | 119 (103–127) |
| prestart (lab-p), cold | **817** (746–875) | **937** | 72 (11–89) | 423 (396–435) | 127 (108–143) |
| shipped, warm (same process) | 605 (554–612) | 641 | 121 | **2.3** | 113 (99–114) |
| prestart, warm (same process) | 534 (451–536) | 567 | 8 | 4.3 | 127 (114–161) |

- **Not a headless artifact.** Headed cold `requestAdapter` = 404–430 ms, the same as headless (387–449). It IS warm-process
  dependent: the second boot in the same process gets its adapter in 1.7–4.4 ms. `requestDevice` is NOT: ~100–160 ms on every
  page load, cold or warm, so FD1 still hides it on a warm reload.
- **FD1 headed gain:** cold ready −363 ms (−31 %), cold first frame −283 ms (−23 %); warm ready −71 ms (−12 %), warm first frame
  −74 ms. Neutral as before: field digest 65025801 and limitsRequested {32767, 32767} identical in all 16 boots, 0 errors.
- One outlier: session B3 presented its first frame 848 ms after ready (cold) and 687 ms after ready (warm) while its ready
  times were normal (782 / 451). Both boots of that one window did it, so it looks like the window's frames were held back,
  not the boot. With B3 left out, the prestart cold first-frame median is 853 ms.
- What it means for users: a real desktop Firefox pays the ~415 ms adapter cost on the first WebGPU page of a new browser
  process: a cold launch, the installed-PWA window, or the first visit after a browser restart. Reloads in a running
  browser pay only requestDevice (~110 ms). FD1 covers both cases. iPad Safari is still unmeasured.
