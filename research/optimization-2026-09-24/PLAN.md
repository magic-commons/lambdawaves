# λWAVES OPTIMIZATION · THE PLAN · 2026-09-24 · Fable's rulings after the cross-refutation round

Supersedes `PLAN-DRAFT.md`. Sources: AUDIT-A…F, REFUTE-A…F (all read whole), the baselines. Sol's review
(`SOL-REVIEW.md`) is folded in under §7 when it lands; items it strikes are marked there, not silently removed here.
Every item carries: source · class (see §1) · the change as ruled · the gain measured by the auditor · the gate.
**Nothing classed J is built.** Builders read `BUILD-BRIEF.md` first.

## 0. The rulings that settle the disputes

| dispute | ruling | why |
|---|---|---|
| LADDER on restore: F's `load()` vs D's `if (active)` inside `set()` | **a new `ladder.load(p)` that always defers** (`Object.assign(P,p); ui[k].set(…); clockFx(); schedule();`); `set()` untouched | D withdrew (`active` is read before `applyLayout`); F showed the open card's knob road is already async so the sync branch buys nothing; E/D: `__LW.ladder.set` callers and the legacy gate keep `set()` byte-for-byte. Also fixes the quick LOAD (700 ms, D). Links carry no `instruments` (E, D). |
| L6 guard: `if (field.ok)` vs `field.setDprCap &&` | **the method test** (F6) | `ok` flips false on device loss (field.js:698); the method test keeps a lost device byte-identical to today (A, E, F). |
| gpu-boot alone vs as a pair | **ships only with (i) a `lost` flag honoured by createField's final assign, (ii) the L6 guard, (iii) single-use `gpuBoot()`, (iv) Node-safe `globalThis.navigator?.gpu`, (v) the adapter returned with the device** | F measured today's latent bug (Chromium `ok:true` on a dead device; Firefox → L6 crash) and FD1 widens its window; A: three node suites import field.js; adapterInfo/limitsRequested need the adapter. |
| Closed modulation window: E's variant B vs D's narrow guard | **D's placement**: `continue` right before the `g.box.clientWidth` read; `place()` skips only its rect block; `paintRings` keeps running; the compact-ENV `M.setSource(timeScale)` model write stays | B and C found the model write in `paint()`'s device loop: skipping it changes saved bytes. |
| Occlusion while UI hidden: "keysheet only" vs `[]` | **`out = []`, no DOM reads, still call `field.setOcclusion([])` on the first hidden burst** | `#keysheet` does not exist (E, F, C); the line pass still runs under H (C). A's stronger form (gate on "an occluded line is drawn") is a lead, not this run. |
| Warm timer: B's stop vs F's re-arm | **F15's form + B's condition**: stop once `kickReady() && (workerWarmStarted \|\| !maths.ok)`; re-arm from `switchHamiltonian`/`setZ`/`setElement` | `tablesReady()` is keyed on the Hamiltonian id (kick.js:42); a plain stop leaves the tables cold after an OPERATOR switch (D, B, E). |
| LAUNCH / OPERATOR→BOX / K key through the worker (F7a, F13) | **NOT this run**: a policy reversal of the wave-45 exemption (rack.js:773–776). Instead **K11**: A's bit-identical synchronous 3× in `wellPacket` (21 distinct (n,l) and (l,\|m\|) factors) | E: wave 45 kept the presses synchronous on purpose; A: 395 → 123 ms with `Object.is` on every output, and the worker's bow gets it too. F7/F13 async go to Josh. |
| gas.stats: bitwise (worker) vs factored (≤ 3e-15) | **factored (N2)**, with the node pin (≤ 1e-12 vs the old loop kept as the oracle) and the `-0.00`/`0.00` symmetric-instant case written into the argument | A tried the bit-identical layout: only 1.88×; the factorisation is 26×; the readout prints two decimals; nothing else reads it. |
| FA1 the Hermite gas table (N3) | **built as an OPT-IN, default OFF** (`?gastab=1` / `__LW.gasTable(true)`), records carry `lag[3] = row` with the sentinel `-1` → the shipped recurrence; the DIGEST LOCK proves default = bit-identical | The class needs Josh's eyes; an opt-in lets him A/B the BOX scene live. F's risks bind: row = mode index (`l·16+n_r`) pinned by a node test, never the filtered position; the table built off the frame thread (worker or idle) with the sentinel until uploaded. |
| FA4(a) autoScale reset on pause | **BUG fix, built** (+ `schedule(TIER.PRESENT)` so the still picture repaints), flagged to Josh | A, E, F: a paused picture stranded at 35 % defeats the 09-08 recovery intent; saved bytes already write `autoScale = 1`. B's dissent (a separate documented law) is recorded; Josh can reverse it. |
| FD5(d) theme resolved at the top of boot | **built, gated**: MIR stylehash + a digest of every 2D canvas at first visit, both themes, before/after; drop it if any differs | C: final pixels identical, boot frames change only by a shorter dark→light flash (nearly nil after gpu-boot); E: five views read the theme at construction — the canvas digests are the check. |
| FD4 narrow fix vs the class-ending `{...S0, …owned}` | **narrow fix** (`abW: S0.abW, abH: S0.abH`) + a comment naming the hole; the spread goes to Josh's list | the spread makes retired keys persist forever — a storage-behaviour change nobody asked for. |
| FE4 second tier | **only the five C proved neutral** (`.keys-list`, `.dev .keys-list`, `.native-clean .grp .grp`, `…[data-id=observer] .grp`, `…camera-motion .sw`) + `.palette-seam …`; **NOT** `.orbit-row/-band/-id`, `.orbit-c.drive`, `.dyn-row` (live) | C removed them on the live CSSOM: 28 elements changed. Build from the filtered 124, never from `css-orphans.json`'s 127. |
| FB10 (cached ink / RO sizes in readers) | **dropped** | C: steady-state gain ≈ 0 and the RO size is not neutral on the unfold frame; `themeInk` is kit. |
| FA3 and exports | **exports (render-exact, capture) pin the GENERIC pipeline** for their whole run; the screen uses the specialised ones; lit/additive styles stay generic everywhere | E/F: a pipeline resolving mid-export breaks the Final II determinism claim; the generic pipeline is what exports render today, so they stay byte-identical. |

## 1. Classes

**N0** bit-identical output · **N1** identical output, different timing/cadence · **N2** numerically equal inside a stated
bound on a rounded readout (ruled above) · **N3** inside fp16 texel precision (opt-in only) · **BUG** a proven defect ·
**DIAG** tooling · **J** look/policy — for Josh, not built.

## 2. Lanes, files, builders

Four builders in parallel, each in its own worktree branched from `df1d81c` (`opt-K`, `opt-M`, `opt-LA`, `opt-LB`), each
with its own gate server port; the lead merges K → M → LA → LB into `worktree-optimization-2026-09-24`, re-runs
`node tests/pwa.test.mjs --write` after each merge (sw.js stamps conflict by construction), runs the DIGEST LOCK and the
node gate after each merge, and the full browser gate after all four. Lane N runs last, on the merged tree, in the lead's
worktree. File ownership is exclusive within a lane's run:

| lane | files | region of shared files |
|---|---|---|
| **K** kernel + present + lines | `lab/field.js` (WGSL 30–120, 317–471; `makeRenderPipeline` 774; `encodeRender` 1119–1128; `writeLines`/`drawChrome` 987–1117; `throughput` 1283–1308), `lab/gas.js`, `lab/well.js`, `lab/bessel.js`, `tools/perf/digest-lock.mjs` (new), `tests/gas.test.mjs`, `tests/well.test.mjs` | rack.js: only the autoScale line at 1244 and `gas.stats` call at 1338 if K5 needs a signature change (it should not) |
| **M** boot + storage + projects | `lab/gpu-boot.js` (new), `lab/index.html`, `lab/field.js` **createField only** (677–830, 1402), `lab/ladder.js`, `lab/chemview.js` (the import at 628 only), `lab/moleculeview.js` (refresh guard), `lab/sw.js` via `pwa --write`, `lab/oracles/` → `tests/fixtures/oracles/`, `tests/pwa.test.mjs`, `tests/wiring.test.mjs`, `tools/build-deploy.mjs` | rack.js: `paintMarks` 190; `saveSettings` 280; `resolveTheme`/boot head 262 + `setTheme` 1556–1574; SLICE append ~2431; projects `open` 4430–4480; phone/tablet 4782–4898; restore 5290–5450; boot tail 5955–6080 |
| **LA** loop, router, readers, hitches | `lab/rack.js` loop/router/governor 919–1395, capture hover 1940–1960, period 2980–3040, occlusion 3622–3690, `measureRacks` 4689; `lab/calculusview.js` | — |
| **LB** windows + workers | `lab/modwindow.js`, `lab/heliumview.js`, `lab/chemview.js` (RT spectrum/fit 300–350), `lab/mathworker.js` (new `chem.rt.fit` op), `lab/render-exact.js` (the helium pin only), `lab/kick.js` (look only) | rack.js: `expand()` 4064–4069; `restoreModulation` |
| **N** archaeology (after the merge) | `lab/rack.js` (menubar 4074–4177, keys 5033–5210, the FE6 lines, comments), `lab/lab.css`, `lab/skin.css`, `lab/native-ui.js`, `lab/palette.js`/`lab/notebook-render.js` (delete), `tests/access.test.mjs`, `tests/{palette,ink,statelink,notebook-math}.test.mjs`, `tests/current.browser-test.mjs:61`, `docs/history/LANDSCAPE.md` | seams 1–9 one per commit, last |

## 3. Lane K · the kernel, the present pass, the lines

| # | item | source | class | change as ruled | gain | gate |
|---|---|---|---|---|---|---|
| K0 | **THE DIGEST LOCK** (first, on the base tree, before any edit) | E, A | DIAG | `tools/perf/digest-lock.mjs --write\|--check`: `fieldDigest().hash` + `readPixels().hash` for {1s+2pz, rydberg, 91 labels, BOX packet, axial gas 256, helium, H₂, momentum, oscillator, quarkonium, a Sturmian state, legacy H₂⁺ (a legacy save), one molecule} × {64, 96, 128}, plus `readPixels` for every view × {cloud, grain, dust, bands, solid, additive, glass} at 96³ and `linePixels` for FRAME {off, box, dots, lattice}; fixture `research/optimization-2026-09-24/digest-lock-base.json` (machine-specific, not a shipped suite). Adapt `probes/A/kernel-variants.js` / `present3.js`. | the gate for K1, K2, K3, K6, K7 | `--check` green on the base |
| K1 | bit-identical kernel trims | FA2, REFUTE-F | N0 | branch instead of `select` at `r < aa`; memo geometry per centre; memo `legP` per (centre, l); memo `e^{imφ}` per (centre, m); every memo resets on a centre change. Optional record staging only if the lock stays green and hydrogen gains ≥ 10 %. | gas 112.6→45 ms (128³), BOX packet 5.85→2.6, 91 modes 4.3→2.9 | K0 `--check` 0 differences; `render-regressions.browser-test` |
| K2 | view × style specialised render pipelines | FA3, REFUTE-E/F | N0 (cloud/grain/dust/bands); lit styles generic | `specRender(view, style)` folding `mode`/`style` to constants (measure whether palette/invert/bow/finish must fold too — A's probe); ≤ 48 pipelines, `createRenderPipelineAsync`, generic draws until resolved, a rejected compile marks the key failed forever (no per-frame retry); `encodeRender`/`readPixels`/`linePixels`/`throughput` select through one function; **exports pin the generic pipeline** (a `pipeline: 'generic'` option on `frame()` that render-exact.js and capture.js pass for their whole run); no new free identifier inside the six functions `tests/gpu-cleanup.test.mjs` extracts by source text (route through `out._rp` or extend the test's injection list in the same commit) | present −50 % cloud, −34 % on the boot's phase view; scales with DPR² | K0 `readPixels` per view × style: 0 bytes differ for the specialised set; `render-exact.test` 40/40; `capture.test`; `gpu-cleanup.test` |
| K3 | persistent gas records | FB6, F14, FA9 | N0 | build 256 records + tables in `build()`; `fieldModes(t)` writes `re`/`im` in place into reused records and a reused list; `packModes` uses a module-constant `[0,0,0]` | −180 KB / 1 028 objects per reconstruct; ~0.1 ms | packed-bytes identity (probes/F/gas-fieldmodes + probes/B/gas-bench); `gas.test` THE RECORDS; K0 |
| K4 | lazy gas build + `setRadius` marks dirty | FD6, REFUTE-F | N1 | `ensure()` at the top of `launch`/`at`/`fieldModes`/`overlap`/`stats` and the `modes` getter; `setRadius` sets a dirty flag | −14–18 ms boot; **−22–34 ms per WELL RADIUS pointermove** (F) | node gas suites; a knob-drag probe < 1 ms per move |
| K5 | `gas.stats` factored by l | FB1, F11, REFUTE-A | **N2** | `A_l(i) = Σ_nr c·R`, skip zero rows, `ψ(i,j) = Σ_l P_l(j)·A_l(i)`; the old loop stays in `tests/gas.test.mjs` as the oracle | 9–17 ms → 0.35 ms every 24th frame in the BOX scene | node pin ≤ 1e-12 relative at 8 times; the `-0.00` case documented in the commit |
| K6 | FRAME lines: 16-byte vertex; box/axes cache key | FA7, REFUTE-B | N0 | (a) lattice/dots vertex = xyz + alpha with the ink RGB in a uniform, same f32 values into the same blend; (b) if the box/axes geometry does not depend on the camera, drop the camera from their cache signature (B: box re-uploads +0.24 ms per moving frame) — read `writeLines` before deciding | −43 % upload bytes, ~0.25 ms per moving frame; box −0.24 ms | K0 `linePixels` per FRAME mode: 0 bytes; probes/A/lines-cpu |
| K7 | **FA1 Hermite-256 gas table, OPT-IN, default OFF** | FA1, REFUTE-F/E | N3 (opt-in) / N0 (default) | `gasRadialTable()` cached, radius-free, built in the maths worker (or idle slices) and uploaded once; records carry `lag[3] = l*16 + n_r` (a node pin asserts it for every emitted record) or `-1` while the table is not ready; kernel space 3 branches on `lag0.w >= 0`; `?gastab=1` and `__LW.gasTable(on)` flip it; `gas.test` THE RECORDS updated | with the flag: 128³ gas 112.6 → 8.1 ms (Chromium 70.5 → 8.0); BOX scene 14 → ~70 fps | K0 `--check` green with the flag OFF; probes/A/gas-kernel oracle ≤ 1 ulp and gas-pixels ≤ 0.02 % with it ON; first AXIAL press stall < 20 ms |
| K8 | autoScale reset on the pause edge | FA4(a), REFUTE-B/E/F | BUG (flagged) | at rack.js:1244's pause law: `quality.autoScale = 1` + `schedule(TIER.PRESENT)` | a paused picture at the user's resolution, not 35 % | probes/A/governor: after PAUSE scale 1, canvas full; `render-exact.test` H2 untouched |
| K9 | `throughput({ targetMs })` | FA5 | DIAG | grow n until one batch ≥ 2.5 s; tools only | honest sub-ms GPU numbers in Firefox | bench re-run |
| K10 | createField: `Promise.all` over the six `getCompilationInfo`; molecular pipelines on first `setMolecule` | REFUTE-A missing | N1 | measure first (D: compile-info 19–24 ms Chromium, 6 ms FF); skip if < 5 ms | part of the createField remainder after gpu-boot | K0; `field-molecule`, chem suites — **coordinate with lane M**: M owns createField's adapter/device block; K10 touches only the compile lines 753–761 and the molecular pipeline creation — if the merge is awkward, K10 waits for M and lands in the lead's worktree |
| K11 | `wellPacket` factor cache | REFUTE-A (F7 answer) | N0 | evaluate each distinct (n,l) Bessel and (l,\|m\|) Legendre once per point, same expression order (norm · j · st^\|m\| · D, then · cos/sin(mφ)); the worker's `packet` op inherits it | 395 → 123 ms per LAUNCH / OPERATOR→BOX press; the bow lands 3× sooner | probes/A/wellpacket-cache `Object.is` on all 91 re/im + `captured`; `well.test`, `gas.test` |

Not built (K): FA4(b/c), FA6, FA8, occupancy/brick skip, rg16float, workgroup staging on the gas, jitter/hash changes.

## 4. Lane M · boot, storage, projects

| # | item | source | class | change as ruled | gain | gate |
|---|---|---|---|---|---|---|
| M1 | **gpu-boot** (the pair) | FD1, REFUTE-F/A/E | N1 + BUG | `lab/gpu-boot.js` (no imports; `globalThis.navigator?.gpu`; requests adapter with `powerPreference:'high-performance'` and the device with wave 58's `requiredLimits` block, falling back to no limits; returns `{ adapter, device, limitsRequested, lost }` where `lost` is set by `device.lost.then`; never rejects; **single-use**: `gpuBoot()` hands the promise out once, then null); `<script type="module" async src="./gpu-boot.js">` right after `<meta charset>`; field.js `createField` consumes it when present, else requests itself; every error string kept; the final `Object.assign(out, { ok: !lost, … })`; the `device.lost` handler still flips `ok` later | cold headed Firefox ready 1180 → 817 ms, first frame −283; warm −71; Chromium ~−30 | probes/D/compare (digest 65025801 + limits identical); **probes/F/probe-f-lostearly in both engines → `ok:false` + lost banner + `LW.ready:true`**; `node tests/perf.test.mjs`, `field-owner.test.mjs`, `capture.test.mjs` with the import; `gpu-recovery.browser-test`; pwa + wiring (auto-discovered root) |
| M2 | `ladder.load()` on restore | FD2, F1, REFUTE-D/F/E | N1 | as ruled in §0; restore calls `load`; `set()` untouched | −415 ms FF / −650 Chromium per project open; −700 ms per quick LOAD; −1.4 s at nbar 42 | probes/D/ladderfix (digest, params, `last` hash equal); `current.browser-test` (`ladderComputed:false` at boot, `:173` params); probes/D/linkopen |
| M3 | L6 guard, method form | FD3, F6 | BUG | `field.setDprCap && field.setDprCap(…)` at rack.js:4817/4874/4891 | the no-GPU visitor gets the designed banner | probes/F/probe-f-breaks noGpu + probes/D/nogpu → ready true, banner, 0 errors; `gpu-recovery` |
| M4 | ABOUT size carried | FD4, REFUTE-E | BUG | `abW: S0.abW, abH: S0.abH` in saveSettings; a comment naming the four-wave hole | ABOUT's size survives a preference change | probes/D/abkeys |
| M5 | failed restore | F16, REFUTE-D | BUG | `schedule(TIER.REBUILD)` in a `finally`; `open()` honours `false`: keeps the previous `pjCurrent` and notebook, no `projectClean()`, status "open failed"; the quick LOAD road honours it too | no half-applied state marked clean; no overwrite of a good file | probes/D/failrestore → `saveOverwrote:false`, status says failed; `current.browser-test` |
| M6 | boot forced layouts | FD5(b,c,d), REFUTE-C/E/F | N0 / N1 (d: a shorter first-visit flash) | (b) `rack.appendChild(wSlice.root)` after `createSliceView` (order unchanged: still before QCD); (c) moleculeview `refresh()` skips `paint()` while `!cv.isConnected \|\| cv.closest('[hidden]')` — verify the reveal road repaints (molecular-names.browser-test); (d) `resolveTheme()` at the top of boot beside `dataset.card` (same `matchMedia` for SYSTEM), used by `setTheme` too | −25–45 ms boot + first frame; −16 ms post-ready restyle | MIR stylehash on a first visit, both themes; **a digest of every 2D canvas at first visit before/after (drop (d) if any differs)**; `LW.bootOrder` unchanged; boot slow-read log |
| M7 | `paintMarks` batched | FD7, REFUTE-B/F | N0 | `markBatch` depth around restore and the boot build; the deferred branch still sets `turnDirty`; released in a `finally` | −8 ms boot, −6–11 ms per open | `__LW.logo.colours()` + rect fills equal after an open and after a malformed open |
| M8 | chemview import on first `prepare()` | FD9, REFUTE-E | N1 | move the `import('./molecule-state.js')` from construction into `prepare()` | 6 requests / 88 KB out of every boot | chem suites; wiring (dynamic edge kept); `record()` null before prepare |
| M9 | oracles out of the served tree | FD8(a), REFUTE-E | N1 | `lab/oracles/` → `tests/fixtures/oracles/`; update rhf-molecules, molecules, chem-sweep, basis-631, chem.browser-test paths + the two `molecules.js` comments; a one-line note under the B-H2O-2 contract in `research/MATH-H2O-2026-09-11.md` (do not rewrite the record) | −430 KB precache per new visitor | pwa suite; wiring; `build-deploy` V1; the five node tests |
| M10 | precache: allowlisted orphans not precached — **derived, not listed** | FD8(b), REFUTE-E/D | N1 | only if it fits in ≤ 40 lines: sw.js's PRECACHE (via `pwa --write`) excludes exactly wiring's "unreached + ALLOWLIST" set, computed from the same source, so rule and allowlist expire together; pwa.test asserts the equality; **skip and report if it needs a hand list** | −690 KB precache per new visitor | pwa §C/§D3; wiring; build-deploy |

Not built (M): FD10 modulepreload, a bundler, lazy windows, coalesced saveSettings, the `{...S0}` spread, per-project keys,
SW `no-cache`, the MIR shell migration.

## 5. Lane LA · the loop, the router, readers, hitches (rack.js)

| # | item | source | class | change as ruled | gain | gate |
|---|---|---|---|---|---|---|
| LA1 | perf ring + `loopMedian` | FB2, F5 | DIAG | `const slot = perf.counts.frames % 60` at the head, zero it there, write `spent` to the same slot at the tail; a second ring from the top of `loop()` as `LW.perf.loopMedian` | a real median | probes/B/ring-check; legacy prints only |
| LA2 | link retry without the repaint | FB3, REFUTE-C/E | N0 | `if (r && r.ok === false) { linkFollowed = null; linkRetryAt = nowMs + 1000; } else if (modView) modView.sync();` — the 1 s retry law stays | −0.7 ms and −150 DOM writes per second of playing (also UI hidden); FC8's prime suspect | `LW.mod.view.performance().paints` delta 0 over 5 s (closed, unrouted); modulation suites |
| LA3 | occlusion while hidden | FB5, REFUTE-A/C/E/F | N0 | `if (uiHidden) { out = []; }` before any read; `field.setOcclusion([])` still called on the first hidden burst; the body-class observer re-dirties on the way back | 0.5–4 ms per 300 ms hidden | `linePixels` over hide→show; `frame-occlusion.browser-test` |
| LA4 | `loop()` try/catch/finally | FB7, REFUTE-F | BUG | `try { … } catch (e) { report once per distinct message to __e + console } finally { inLoop = false; re-arm on the normal tail condition }` | one thrown reader no longer freezes the instrument for the session | a probe: one reader throws once → `stats.frames` keeps rising, `__e` gains exactly one entry |
| LA5 | warm timer | FB9, F15, REFUTE-D/B | N1 | as ruled in §0 | idle literally zero | idle probe: 0 timers over 10 s; kick tables warm after an OPERATOR switch (probe) |
| LA6 | one period scan in flight | F3, REFUTE-D/B | N1 | `inFlight` cleared only by the worker's real reply (a `stat` round trip after a timeout), latest-key coalescing; the wave-44 hold-off gains "a key is held on a dial" | no 2-minute worker jam; the busy mark not held | probes/F/probe-f-scanstorm → stat answers within one scan; `period.test` |
| LA7 | CAPTURE hover asks without forcing | F2, REFUTE-E | N1 | the hover posts to the `period` worker, the plan shows STALE/"…" until both land (capPaint has the face); ⟳ and G act on landing with a second press coalesced **only if the coalescing is clean — else leave them forced and report**; `LW.period`, `LW.capturePlan`, the PLAN button stay forced | −0.46…1.0 s per hover on the BOX | `capture.test`, `period.test`; hover probe < 5 ms |
| LA8 | export lock records `pending` | F8, REFUTE-A/B/E | BUG | `if (modSyncing) return; if (tier > pending) pending = tier; if (exportLocked) return;` | a GRID change during an export is no longer dropped | probes/F/probe-f-export → 96; `render-exact.test` |
| LA9 | `measureRacks()` at pointerdown + resize | FE11(a) | N0 | not per pointermove | per-move layout reads gone | drag tests; final position equal |
| LA10 | CALCULUS rows updated in place | REFUTE-B missing | N0 | same text and classes into existing rows instead of `innerHTML = ''` + rebuild (calculusview.js:15–33); **do not** implement the promised throttle (a cadence change → Josh) | −0.64 ms and −32 mutation records per update | mutation-records probe; `current.browser-test` |
| LA11 | `tick('molecule')` skipped while off | FE9, REFUTE-A/B | N0 | `!molecule.on && !(h2 && h2.on)` → skip the tick | µs; a cleaner profile | `molecular-names.browser-test` |

Not built (LA): FB4/F10 (J), FB8 (J), FB11/F12 (J), F7(a)/F13 async presses (policy → Josh), FB10 (dropped).

## 6. Lane LB · the windows and the workers

| # | item | source | class | change as ruled | gain | gate |
|---|---|---|---|---|---|---|
| LB1 | closed modulation window: D's placement | FD5(a), FE2, FE3, REFUTE-B/C/D/F | N0 | `paint()`: `if (!P.open) { g.sig = ''; continue; }` **right before** the `g.box.clientWidth` read (after the ENV timeScale write); `place()`: skip the rect block while `!P.open`; `paintRings` untouched; `expand()` calls `open()` only; `restoreModulation` skips its own `rebuild()` when `pr.modwin.open` will call `open()` — **measure before claiming** | −20 ms boot task; −24 ms applySettings; −15–28 ms per open; restore −10–19 ms | serialize bytes of a project with a compact ENV saved with the window closed, before/after; mir-controls / routed-knob / lfo-tension suites; stylehash after open |
| LB2 | modulation grip through `coalesce` | FE11(b), REFUTE-B | N0 | per-frame coalescing with a flush on pointerup (the rack's wave-67 idiom) | −0.56 ms and −14 rect reads per grip pointermove | drag tests; final position equal |
| LB3 | `paint()` dirty checks (open window) | FC5, REFUTE-B/C | N0 | guard the constant writes: tempo/holds/dead/bus/envStage/minOut/status, with the file's own `if (el.textContent !== s)` / `attr()` idiom | ≤ 0.3 ms per paint (Gecko) | mutation-records probe −10/paint; `current.browser-test` modwindow sections |
| LB4 | HELIUM basis without the frame-thread solve | F9, REFUTE-B | N1 | `fieldModes()` returns the last good solution's modes while `solving`; `setOn(true)` → `prepare()`; on landing `api.repaint(true)`; `get sol()` stays synchronous; **render-exact's driver forces `helium.sol` before its first frame** | −90–269 ms stall per basis change while playing | `helium.test`, `card-solvers.test`, `render-exact.test`; probe basis-while-playing < 20 ms; an export after a basis change is byte-identical |
| LB5 | CHEM RT: spectrum cadence + fit in the worker | F4, REFUTE-E | N1 | one spectrum in flight, cadence ≥ max(500 ms, 4× last measured); `chem.rt.fit` op in the chem worker over a copied `subarray(0, FIT_CAP)` (never transfer the worker's trace); the card keeps painting `fit` | 27 → > 400 steps/s at 125 k samples; −125–153 ms hitch every 2 s | `response-fit.test`, `chem.browser-test`; probes/F/probe-f-chem |
| LB6 | K key: a bit-identical synchronous speed-up in kick.js, if one exists | F13, REFUTE-A/E | N0 | look for A's `wellPacket` pattern (distinct radials evaluated once) inside `applyKick`; `Object.is` on the landed register; **if none within an hour, report and stop** (the async road is Josh's) | up to −100 ms cold / −15 warm per press | kick tests; register equality |

Not built (LB): FE8 `seatLook`, FE10, kit-side dirty checks (upstream), FB10.

## 7. Lane N · archaeology (after the merge, in the lead's worktree)

| # | item | source | class | change as ruled | gate |
|---|---|---|---|---|---|
| N1 | menubar rows call functions | FE1, REFUTE-F/D | BUG | `runAction(id)` (`a.run(1)`), `keyFor(id)` in every label, a named `clearRegister()` = **STATE's CLEAR** (Josh may reverse), `resetView`, `__LW_hooks.keys.reset()`, FILE rows → `save`/`restore`/COPY JSON/`copyLink` directly (storage-neutral, D); every row action in `try { … } finally { close menu; restore focus }` | a browser block clicking every row and asserting its effect |
| N2 | version + comments + docs | FE12, E§7 | BUG/docs | `BUILD_LINE` → the current alpha; the stale-path comments; LANDSCAPE.md headed "superseded 2026-09-24 — see research/optimization-2026-09-24/AUDIT-E.md §6"; README's field numbers corrected from A's ≥ 2.5 s-batch figures | ABOUT reads the right build |
| N3 | orphan CSS | FE4, REFUTE-C | N0 | delete the filtered 124 + the five confirmed second-tier + `.palette-seam …`; **not** the orbit/dyn rows | `probes/C/refute/fe4-cssom.mjs` 0 elements; MIR stylehash all windows × themes × card × frost |
| N4 | SETTINGS-KEYS remnants | FE5 | N0 | cut the capture branch, `capturing`, `ui.keysSay`, the alias, the dead Escape line, the occlusion id, native-ui.js:63; keep `ui.keysRefresh` as a plain hook and the ACTION id; retarget access A11 to shortcuts.js:23 | access suite; keyboard-window browser test |
| N5 | write-only bindings | FE6, REFUTE-A/B | N0 | cut `periodVersion`, `gov.since`, `wStyle`, `LW.version`, `infoPanel` import, `LOGO_SCALE`/menu scale, KIND `modulation`/`about`, `kepEcc`, `partOn`; read `tablet.DPR` at syncPhone | node + browser gates |
| N6 | duplicates | FE7(a,b,d), REFUTE-D | N0 | import `hexToRgb`; `unproject` = `pointerRay` + plane solve; import the kit's `palette.js` / `notebook-render.js` / `notebook-math.js`, delete the lab copies, **drop the three wiring ALLOWLIST entries in the same commit**, move the test import paths (palette, ink, statelink, notebook-math, current.browser-test:61); `pAlong`/`pAlongDir` KEPT | palette/ink/statelink/notebook-math tests; wiring; pwa; `adopt --check` in step |
| N7 | seams 1–9, one per commit, as time allows | E§6 | N0 | motion-pref → busy-mark → worker-pool → accent-wheel → sw-client → badges → rack-menus → menubar (after N1) → window-chrome | per commit: `--check`, node gate, pwa --write, serialize bytes, fieldDigest, stylehash |

## 8. For Josh (decisions, not tasks) — with prices

1. **K7 the gas table** is built OPT-IN: `?gastab=1`. Every changed texel is closer to exact (41 → 1 fp16 ulp); ≤ 0.02 % of
   pixels move by 1 level, 46× fewer than one present of the shipped jitter. BOX 256 at 128³: 14 → ~70 fps. Your eyes decide
   whether it becomes the default.
2. **The glass menu** (measured GPU ms/frame saved, WebRender / Chromium, DPR 1): J1 FROST OFF drops the heads'
   `brightness(1.03) saturate(1.03)` (**5.1 / 0.3**) — this reverses your wave-103 words "let it be 103 % … to distinguish
   the bar from the contents", so it is yours alone; J2 STILL as the default policy (7.4 / 3.2, +4.9 / 2.4 with the
   modulation window); J3 heads tinted not frosted (3.6 / 1.5); J4 the three rack chips (1.6 / 0.7); J5 the four rail discs
   (≈ 1.8 / 0.8); J6 `tablet-motion` keep/remove/debounce (a 6–11 ms restyle + repaint at every drag edge on the iPad);
   J7 transient panes under FROST OFF (≈ 0.45 / 0.2 each); J8 the rack slide without ancestor opacity (the glass goes clear
   for 280 ms today, also on project open).
3. **FA4(b/c)** governor: skip the step rung on reconstruct-bound scenes; one controller instead of AUTO SCALE beside it.
   **K8** (autoScale reset on pause) is built as a bug fix; say if you want it back.
4. **FA6** the first visit marches 64³ at 160 steps × scale 1 (4.8 ms); the GRID segment's own 64³ is 110 × 0.75 (2.0 ms).
5. **FB4/F10** parked readers re-probe every 3 s at full cost (WIGNER 80–120 ms): back-off (cheaper, slower refresh) or a
   worker (neutral, more code).
6. **FB11/F12** the busy mark flags GPU-bound frames as a blocked thread (86 % of the time in the heavy BOX scene) and costs
   +0.42 ms of paint per frame while up; a MessageChannel heartbeat would make it mean "the thread is blocked".
7. **F7/F13** LAUNCH, OPERATOR→BOX and the K key stay synchronous by wave 45's exemption; K11 makes them 3× faster. Going
   async (−0.1 s more) is a policy reversal.
8. **N1's CLEAR**: "CLEAR the register" now means STATE's CLEAR (resets t, scrub, trail). SPECTRUM's (c ↦ 0 only) is the other.
9. **FD4's class**: three waves patched the same hole; `{ ...S0, …owned }` ends it but keeps retired keys forever.
10. **Unmeasured**: retina/iPad prices (WebKit), the deployed origin's RTT (FD10 modulepreload), FC8 after LA2 on a quiet GPU.

## 9. Sol's amendments (from `SOL-REVIEW.md`, read whole; these override the tables above where they conflict)

Sol classed every item with the observable that catches a violation and agreed with the §0 rulings on M2 (`load()`),
M1 (the pair), M3 (the method guard), LA3 (`[]` + one `setOcclusion([])`), K2 (view × style only, exports pinned), the
wave-45 exemption (L8/L11 deferred), K7 (opt-in only). The dissents the lead accepts:

| item | Sol | ruling now |
|---|---|---|
| **K5** `gas.stats` factored | "neither under strict law": the factored sum flips a displayed `-0.00`/`0.00` at symmetric instants; keep the loop or run the exact loop off-thread | **K5 is no longer the factorisation.** It becomes **K5w**: the UNCHANGED `stats()` runs in the maths worker (a `gas.stats` op; the worker builds its own `createGas(A)` — f64 tables are deterministic, so bit-identical) and the readout paints when it lands (N1: a 2.5 Hz readout arrives one round trip later). Built **after the merge** by one builder (it spans mathworker.js, gas.js and rack.js:1338). The factorisation stays in the report as the rejected road. |
| **K8** autoScale reset on pause | "neither pending policy ruling": it changes the paused image | **K8 → J (for Josh)**, not built. Lane K skips it. |
| **M6(d)** theme at the top of boot | "neither under strict pixel law": the cold boot's first frames change (a shorter dark→light flash) | **M6(d) → J**, not built. Lane M builds M6(b) and (c) only; (c) with the reveal-repaint check. |
| **M10** precache exclusion | neutral for moving the oracles; "neither" for a broad `mir/shell/**` exclusion | **M10 dropped**; M9 (oracles) stays. The shell migration (Josh's list) ends the duplicate. |
| **K4** lazy gas | N1, but "not a free latency win": the first axial use pays what boot paid | K4 = the `setRadius` dirty flag (the measured 22–34 ms per pointermove) + lazy `ensure()` + **a one-shot idle warm after ready** (`requestIdleCallback`, as the kick warm does), so the common first press pays nothing; the K4 gate measures cold `setRadius`, first BOX press and the settled digest separately (Sol §5.2). |
| **N4** SETTINGS-KEYS remnants | legacy tests read `__LW.keys.capturing` and `LW.keysheet`; keep the alias and the action id | cut the capture branch, `capturing`'s dispatcher use, `ui.keysSay`, the dead Escape line, the dead occlusion id lookup and native-ui.js:63; **keep** `LW.keysheet`, `layout.keysheet` and the ACTION id `'keysheet'`; retarget access A11. |
| **N5** write-only bindings | `LW.version` feeds export metadata (render-exact.js:1103); `layout.menu.scale/enlarged` have a legacy reader | **keep `LW.version`** (an export's saved bytes) and the menu scale fields; cut only `periodVersion`, `gov.since`, `wStyle`, the `infoPanel` import, KIND `modulation`/`about`, `kepEcc`, `partOn` after a fresh `rg` for each; read `tablet.DPR` preserving 1.5. |
| **LA1** | time the whole loop from entry, before occlusion | already in LA1 (`loopMedian`). |
| busy mark | a semantic indicator whose paint costs +0.42 ms/frame while up | stays J6-adjacent on Josh's list (§8 item 6). |

Sol's "measure before building" list maps onto the gates: §5.2 → K4's gate; §5.3 → K2's gate (the matrix, compile
memory, device loss during compile, the export pin in both engines); §5.5 → K0; §5.6 → LB1's gate (a closed compact ENV
with a changing source, resize while closed, open after resize); §5.8 → LA6's gate (force a scan past the 8 s timeout,
then latest-key changes, watch the queue until the late reply). §5.1 (a certified interpolation envelope for the gas
table) and §5.4 (the occupancy break-even) are recorded as leads for the K7 ruling and a future quality tier; §5.7 (a
headed interaction time-series) is the lead's to take on a quiet GPU during Phase 4.

Sol's error bound for the table (§3a), for the record: cubic Hermite `|F − H| ≤ z⁴h⁴/384 · M₄(l,z)`, linear
`|F − L| ≤ z²h²/8 · M₂(l,z)`, so a universal N cannot be read off "11-bit mantissa ≈ 5e-4" — the fp16 ULP depends on the
exponent and the error is summed over 256 modes before the write; a same-texel guarantee needs the accumulated error and
the distance to the nearest rounding midpoint. Lane A's 3 000-voxel ≤ 1 ULP evidence is strong but not a proof; the
opt-in default-off ruling stands.
