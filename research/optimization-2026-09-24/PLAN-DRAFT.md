# λWAVES OPTIMIZATION · PLAN DRAFT · 2026-09-24 · Fable's first cut before the refutation round

This is the lead's merge of AUDIT-A … AUDIT-F into one ranked, gated plan. It is a DRAFT: the six REFUTE-*.md notes and
Sol's SOL-REVIEW.md will move, strike or add items, and the final PLAN.md supersedes this file. Every item names its
source findings, the file it touches, the claimed gain (measured by the auditor, on the RTX 3070 unless said), its
neutrality class, and the gate that proves it. Items classed J are look or policy changes and are NOT built in this run:
they go to Josh as a priced menu.

## 0. What the audits established (the bill, in one table)

| scenario (1920×1080, RTX 3070) | who sets the rate | number |
|---|---|---|
| default rack, frost, 96³, headed Firefox | the compositor: 18 backdrop layers ≈ 7.4 ms; whole UI ≈ 11.7 ms | 80.5 fps (UI hidden 119 = the cap) |
| the same in Chromium/Electron | 18 layers ≈ 3.2 ms; whole UI ≈ 4.0 ms | ~113–117 fps (cap) |
| BOX axial 256, 128³, UI hidden | the compute kernel: 112.6 ms FF / 70.5 ms Chromium per reconstruct | 8–14 fps |
| present pass alone, 96³/128³, phase view | ALU-bound fragment shader, 160/240 steps | 3.7–4.9 / 5.5 ms |
| GLASS draw style, 96³ | `litAt` six taps on every step | 11 ms |
| boot, cold Firefox | requestAdapter 415 ms + requestDevice 110 ms, serial after the module graph | ready 1180 ms headed / 975 headless |
| project open / restore | a synchronous LADDER solve for a closed card (414–422 of 463 ms) | 0.46–1.5 s freeze |
| loop JS, every scene | 0.2–0.8 ms median; the only > 5 ms item is `gas.stats` (9–17 ms, every 24th frame) | — |
| idle | zero frames; one no-op timer every 2 s | — |

Read: hiding the UI already reaches the display cap at 96³. What stands between Josh and "blazingly fast" is (1) the
axial-gas kernel, (2) the present pass's generic shader, (3) in Gecko the per-layer backdrop bill, which is his glass and
therefore a menu, (4) the boot's serial GPU request, (5) the project-open freeze, (6) a dozen real bugs and hitches.

## 1. Neutrality classes used below

- **N0** bit-identical (texels, DOM, bytes) — gate is equality.
- **N1** identical output, different timing/cadence (async instead of sync; later instead of at boot) — gate is equality
  after settle + a written argument about the interim.
- **N2** numerically equal within a stated bound on a printed/rounded readout, argued (FB1: ≤ 3e-15 relative on a
  2-decimal readout) — needs the lead's ruling, stated in PLAN.md.
- **N3** inside fp16 texel precision, pixels may move by 1 level on a tiny fraction (FA1) — needs JOSH's ruling.
- **BUG** the old behaviour is a defect with a written proof — the fix changes behaviour by design.
- **DIAG** tooling/diagnostics only.
- **J** a look or policy change — for Josh, not built.

## 2. The ranked plan (gain ÷ risk), grouped into build lanes

### Lane K · the kernel and the present pass (field.js, gas.js)

| # | item | source | class | gain | gate |
|---|---|---|---|---|---|
| K1 | Bit-identical kernel trims: branch instead of `select` at `r < aa`; memo geometry (length/ct/st/phi) across modes sharing a centre; memo `legP(l,ct)` per l; memo `e^{imφ}` per m | FA2 | N0 | gas 112.6→45 ms (128³), BOX packet 5.85→2.6, 91 modes 4.3→2.9 | DIGEST LOCK: `fieldDigest().hash` for {1s+2pz, rydberg, 91 labels, box packet, gas, helium, H₂} × {64,96,128} equal to base; `render-regressions.browser-test` |
| K2 | View×style specialised render pipelines (≤ 48, `createRenderPipelineAsync`, generic draws until ready), cloud/grain/dust/bands first; lit styles only if bit-exact on both browsers | FA3 | N0 for cloud (measured 0 bytes differ); lit styles N3 (≤ 2 bytes) → keep generic unless exact | present −50 % cloud, −34 % on the boot's phase view; scales with DPR² | generic-vs-specialised hash per (view, style, grid); the DIGEST LOCK; first frames on the generic path |
| K3 | Persistent gas records: build 256 records+tables once in `build()` (rebuild on `setRadius`), `fieldModes(t)` writes re/im in place | FB6 + F14 + FA9 | N0 (packed bytes proven identical) | −180 KB/reconstruct garbage; ~0.1 ms | `gas.test` THE RECORDS; packModes byte identity probe |
| K4 | Lazy gas tables: `createGas` builds nothing until first axial use (`ensure()`), setRadius marks dirty | FD6 + FE refinement | N1 | −14–18 ms boot | node gas suites; boot digest unchanged |
| K5 | `gas.stats` factored by l (16 accumulators, skip zero rows) | FB1 + F11 | **N2** (≤ 3e-15 relative; `-0.00` sign case) | 9–17 ms → 0.35 ms every 24th frame in the BOX scene | node pin: factored vs old loop ≤ 1e-12 at 8 times; `gas.test` tolerances. If the lead rules bitwise: run unchanged `stats()` in the cards worker (N1) |
| K6 | FRAME lattice/dots: 16-byte vertex (xyz+alpha) with ink RGB in a uniform | FA7(a) | N0 (same f32 values into the same blend) | −43 % upload bytes, ~0.25 ms per moving frame | linePixels hash, `lines.out.json` probe re-run |
| K7 | **FA1 the Hermite-256 radial table for the axial gas** | FA1 | **N3 → JOSH** | 128³ gas 112.6→8.1 ms (Chromium 70.5→8.0): the BOX scene becomes present-bound (~70–90 fps) | oracle probe (≤ 1 ulp), gas-pixels probe (≤ 0.02 % pixels, 1 level). Built ONLY if Josh accepts the class; otherwise shipped behind nothing |
| K8 | Governor: reset `quality.autoScale = 1` on the pause edge (the governor's own law at rack.js:1244 restores grid/steps but not scale) | FA4(a) | BUG (argued) — flag | a paused picture at the user's resolution instead of 35 % | browser block: pause after governed play → canvas at full scale |
| K9 | Throughput tool: `throughput({targetMs})` grows n until one batch ≥ 2.5 s | FA5 | DIAG | honest sub-ms GPU numbers in Firefox | bench re-run |

Not now (lane K): FA4(b/c) governor policy (J), FA6 first-visit pairing (J), FA8 glass gradient volume (J), occupancy/brick
skip (L7: slower or non-exact; revisit after K2), rg16float (no gain), staging records through workgroup memory (0 % on gas).

### Lane L · the loop, scheduling, readers, hitches (rack.js loop region, views, workers)

| # | item | source | class | gain | gate |
|---|---|---|---|---|---|
| L1 | `perf.median` ring fix (`slot = frames % 60`; write the same slot) + a whole-loop ring `LW.perf.loopMedian` | FB2 + F5 | DIAG | a correct measuring stick | ring-check probe; legacy boot test only prints it |
| L2 | Link retry: a refused play sets the retry and does NOT call `modView.sync()` | FB3 | N0 (idempotent repaint of an unchanged model) | −0.7 ms and −150 DOM writes per second of playing; also with UI hidden | `LW.mod.view.performance().paints` delta 0 over 5 s; modulation suites |
| L3 | `refreshOcclusion` while `uiHidden` measures only `#keysheet` | FB5 | N0 (identical rect list by construction) | 0.5–4 ms per 300 ms with the UI hidden | linePixels/readPixels over hide→show; ink-under-glass check |
| L4 | `loop()` in try/finally (`inLoop = false`), one recorded error | FB7 | BUG | a thrown reader no longer freezes the instrument for the session | shim: throw once in a reader → the loop continues |
| L5 | Warm timer stops re-arming once `kickReady() && (workerWarmStarted \|\| !maths.ok)`; re-arm from switchHamiltonian/setZ/setElement | FB9 + F15 | N1 (tables warm before first use as now) | idle becomes literally zero | idle probe: 0 timers over 10 s |
| L6 | Scan queue: one period scan in flight, latest-key coalescing | F3 | N1 (stale answers were already discarded) | no 2-minute worker jam; busy mark not held | scanstorm probe; `period.test` |
| L7 | CAPTURE hover / ⟳ / G: async period through the worker, plan shows STALE until it lands; `LW.period`/PLAN button stay forced | F2 | N1 (same numbers, later) | −0.46…1.0 s per hover on the BOX | `capture.test`, `period.test`; hover probe < 5 ms |
| L8 | LAUNCH → `launchPacketAsync` (worker packet, bit-identical), clock starts on landing; OPERATOR→BOX keeps sync (F7b warm is M, later) | F7(a) | N1 (the wave-45 bow law) | −190–250 ms per press | `well.test`, `gas.test`; onFire timing probe |
| L9 | HELIUM: `fieldModes()` returns the last good solution while the worker solves; `setOn(true)` → `prepare()`; repaint on landing | F9 | N1 (settled volume identical) | −90–269 ms stall on a basis change while playing | `helium.test`, `card-solvers.test`; basis-while-playing probe < 20 ms |
| L10 | Chem RT: one spectrum in flight with cadence ≥ max(500 ms, 4× last cost); `fitPoles` in the chem worker on a copied window | F4 | N1 (same trace → same plot; cadence moves under load) | 27 → > 400 steps/s at 125 k samples; −125–153 ms hitch every 2 s | `response-fit.test`, `chem.browser-test`; probe-f-chem |
| L11 | K key through the maths worker (`kickAxis` op calling the same `applyKick`) | F13 | N1 | −135 ms cold / −20 ms warm per press | kick tests; equality of the landed register |
| L12 | Forced style reads in readers: cache `themeInk` per `data-theme`; canvas size from a ResizeObserver with the W<32 guard | FB10 | N0 (same ink; same size after layout) | 1–2 fewer forced flushes per cpuTick (phone matters more) | readers91 probe; shadow/orbit browser checks |
| L13 | Skip `tick('molecule')` while the legacy card is off (`!molecule.on && !(h2 && h2.on)`) | FE9 | N0 (update returns anyway) | µs; a cleaner tick list | molecular-names.browser-test |
| L14 | Modulation window: closed-state guards in `paint()` (`if (!P.open) { g.sig=''; continue; }` before the clientWidth read; `paintRings` keeps running) and `place()` (skip the rect block while closed); `expand()` calls `open()` only | FD5(a) + FE2 + FE3 | N0 (guarded reads answered "closed" anyway; the second rebuild re-reads the same model) | −20 ms boot task, −24 ms applySettings, −15–28 ms per open | mir-controls / routed-knob / lfo-tension suites; stylehash after open |
| L15 | Modulation grip through `coalesce` with a flush on release; `measureRacks()` at pointerdown + resize, not per pointermove | FE11 | N0 (same final position) | per-pointermove layout reads gone | drag tests; final-position equality |
| L16 | modwindow paint dirty-checks for the constant writes (tempo/holds/dead/bus/envStage/minOut/status) | FC5 | N0 (identical strings) | ≤ 0.3 ms/frame with the window open (Gecko) | mutation-records probe −10/paint; current.browser-test |

Not now (lane L): FB4/F10 re-probe policy (J: back-off vs worker — Josh), FB8 reader phase-stagger (cadence choice),
FB11/F12 busy-mark meaning (J), F7(b) speculative packet warm (M, after L8), CHEM refresh while hidden (unmeasured).

### Lane M · boot, storage, projects (index.html, field.js boot, rack.js boot/restore, ladder.js, sw.js)

| # | item | source | class | gain | gate |
|---|---|---|---|---|---|
| M1 | **`lab/gpu-boot.js`**: an async module in `<head>` requesting adapter+device with the same options/limits; field.js consumes the promise; every error string kept; never rejects unhandled | FD1 | N1 (same call, earlier) | cold Firefox ready −363 ms headed (−31 %), first frame −283; warm −71; Chromium ~−30 ms | compare probe (digest 65025801 + limits identical); pwa + wiring (new root); gpu-recovery.browser-test; nogpu probe |
| M2 | **LADDER restore without the synchronous solve**: `set()` keeps its road for callers; restore uses a `load()` that seats params, paints closed forms, and `schedule()`s (worker when active) | FD2 + F1 (reconcile: F's separate `load()` is the safer shape — `set()` stays byte-for-byte for `__LW.ladder.set` and the tests) | N1 (open card: worker answer, bit-identical by mathworker's contract) | −415 ms FF / −650 ms Chromium per project/link open; −1.4 s with nbar 42 | `ladder.last` hash equal after settle; `current.browser-test` boot law `ladderComputed:false`; ladderfix probe |
| M3 | L6 guard: `field.setDprCap && field.setDprCap(…)` at the three phone sites | FD3 + F6 | BUG | no-GPU visitors get the designed banner, not "boot failed" | nogpu browser block (`dom.webgpu.enabled=false`); gpu-recovery |
| M4 | `saveSettings` carries `abW/abH` | FD4 | BUG | ABOUT's remembered size survives a preference change | abkeys probe |
| M5 | Export lock: `schedule()` records `pending` before refusing on `exportLocked` | F8 | BUG | a GRID change during an export is no longer dropped | probe-f-export → 96; `render-exact.test` |
| M6 | Failed restore: `schedule(REBUILD)` in `finally`; `open()` honours the return (no `projectClean`, "open failed") | F16 | BUG | no half-applied state marked clean | malformed-project browser case |
| M7 | Boot forced layouts: append SLICE's root after `createSliceView`; moleculeview skips paint while not rendered; resolve the theme once at the top of boot via a `resolveTheme()` setTheme also uses | FD5(b,c,d) | N0 (final DOM/classes/computed styles unchanged) — (d) needs lane C's first-paint check | −40–60 ms main thread across boot + first frame | stylehash on a first visit before/after; boot slow-read log empty pre-ready; `LW.bootOrder` if any gate reads rack order |
| M8 | `paintMarks` batched (`markBatch` depth around restore and the boot's build; one call at the end) | FD7 | N0 (pure function of its inputs; the last call wins today) | −8 ms boot, −6–11 ms per open | `__LW.logo.colours()` + rect fills equal after an open |
| M9 | chemview imports `molecule-state.js` on first `prepare()` | FD9 | N1 | 6 requests / 88 KB parse out of every boot | chem suites; `record()` null before prepare |
| M10 | Precache: move `lab/oracles/` → `tests/fixtures/oracles/` (six test paths + two comments); NOT_PRECACHED rule for `mir/shell/**` while allowlisted (or the shell migration, which is a feature wave — not now) | FD8(a) (+ b's rule only) | N1 (nothing running references them) | −1.13 MB per new visitor, −20 % install fetches | pwa suite (rule prose), wiring, build-deploy V1; `adopt --check` in step |

Not now (lane M): FD10 modulepreload (needs a real-network number), a bundler, lazy windows (L12), dynamic view imports,
coalesced saveSettings, per-project keys, SW `no-cache` policy.

### Lane N · archaeology and refactor (rack.js, modwindow.js, native-ui.js, CSS, docs)

| # | item | source | class | gain | gate |
|---|---|---|---|---|---|
| N1 | Menubar rows call functions: `runAction(id)`, `keyFor(id)` in every label, a named `clearRegister()` (STATE's CLEAR — **Josh confirms**), `resetView`, `__LW_hooks.keys.reset()`; RESEED seeds particles; RESET KEYS works | FE1 | BUG (three rows broken, proven) | correct menus | a browser block clicking every row and asserting its effect |
| N2 | `BUILD_LINE` → the current alpha; the stale-path comments fixed; LANDSCAPE.md headed "superseded 2026-09-24" | FE12 + E§7 | BUG (version) / docs | ABOUT and the copy dump say the right build | ABOUT reads alpha.3 |
| N3 | Delete the 124 orphan CSS selectors (the wave-52 card, `keys-*`, `.ui-hide`, the never-matching `-label`s) | FE4 | N0 (no element ever matched) — lane C confirms with stylehash | −12.7 KB CSS, a sheet that describes the app | MIR stylehash over all windows × both themes × card × frost identical |
| N4 | Cut the SETTINGS-KEYS remnants (capture branch, `capturing`, `ui.keysSay`, the alias, the dead Escape, the occlusion id `'keysheet'` lookup, native-ui.js:63); keep the ACTION id; retarget access A11 to shortcuts.js:23 | FE5 | N0 | ~30 lines; one dead path out of the dispatcher | access suite; keyboard-window browser test |
| N5 | Cut the write-only bindings (`periodVersion`, `gov.since`, `wStyle`, `LW.version`, `infoPanel` import, `LOGO_SCALE`/menu.scale, KIND modulation/about, `kepEcc`, `partOn`); read `tablet.DPR` at syncPhone | FE6 | N0 | ~25 lines | node + browser gates; legacy tests for `LW.version` (none assert) |
| N6 | Duplicates: import `hexToRgb` instead of the block-local pair; `unproject` = `pointerRay` + plane solve; import the kit's `palette.js` / `notebook-render.js` and delete the lab copies (tests re-pointed) — **lane D confirms the precache/pwa/wiring consequences** | FE7(a,b,d) | N0 (`pAlong`/`pAlongDir` KEPT) | −33 KB + −(notebook-render) precache, two fewer modules | palette/ink/statelink/wiring node tests; `adopt --check` in step |
| N7 | Seam extractions, low-coupling blocks first, one per commit: motion-pref, busy-mark, worker-pool, accent-wheel, sw-client, badges, rack-menus, menubar (after N1), window-chrome | E§6 blocks 1–9 | N0 | ≈ 660 lines out of `boot()` (rack.js → ≈ 5420) with ≤ 11 closure edges each | per commit: `--check`, `bash test.sh node`, pwa --write, serialize bytes on a fixed project, fieldDigest, stylehash |

Not now (lane N): FE8 (`seatLook` table — M, inside seam 14, after N7), FE10 (build-right-the-first-time per window — a
legibility refactor, ≈ 3 ms), the MIR shell adoption (a feature wave), seams 10–17.

### Lane C · the material (for Josh — nothing built here without his word)

Measured prices, GPU ms per frame at DPR 1 (WebRender / Chromium): the whole frost bill 7.4 / 3.2; the whole UI 11.7 / 4.0.
No pixel-neutral CSS lever exists (off-screen culling, `content-visibility`, `will-change`, `contain`, hiding overlay
canvases: all zero or slower — FC2/§4). The menu, each a look change:

| # | option | on screen | saves (FF / Cr) |
|---|---|---|---|
| J1 | FROST OFF means no backdrop at all: the 8 disconnected heads drop `brightness(1.03) saturate(1.03)` under OFF (as they already do under STILL-while-playing) — app-side rule in `lab/skin.css` | 8 head strips lose a 3 % lift under OFF | **5.1 / 0.3** |
| J2 | STILL as the default frost policy (or on Firefox/iPad) | frost clears while playing | 7.4 / 3.2 (+4.9 / 2.4 with the modulation window) |
| J3 | disconnected heads tinted, not frosted (bodies keep theirs) | the head strips | 3.6 / 1.5 |
| J4 | the three round rack chips tinted | 3 discs | 1.6 / 0.7 |
| J5 | the modulation rail's 4 chip discs tinted | 4 discs | ≈ 1.8 / 0.8 |
| J6 | `tablet-motion` on the iPad: keep / remove / debounce | iPad controls while moving | a 6–11 ms restyle + repaint per motion edge |
| J7 | consistency: menubar list, graphTip, mod-pop, notebook blur under FROST OFF | transient panes | ≈ 0.45 / 0.2 each |
| J8 | the rack slide fade without ancestor opacity (the glass goes clear for 280 ms today — a glitch) | transition frames only | fixes FC7 |

Also for Josh (policy, not look): FA4(b/c) governor levers; FA6 the first-visit 64³ pairing; FB4/F10 parked-reader
re-probe (back-off vs worker); FB11/F12 what the busy mark means; K7 (FA1) the N3 class; N1's CLEAR choice; K5's N2 class
if he wants bitwise.

## 3. Build order and the gates

Order: DIAG first (L1, K9) so every later number is real → the BUG fixes (M3, M4, M5, M6, L4, N1, N2, K8) → lane K
(K1 → K3 → K4 → K6 → K2; K5 under the N2 ruling; K7 only with Josh) → lane M (M1, M2, M7, M8, M9, M10) → lane L
(L2, L3, L5, L6, L7, L8, L9, L10, L11, L12, L13, L14, L15, L16) → lane N (N3, N4, N5, N6, N7). Lanes K, M, L run as
parallel builders in the worktree (disjoint files: K = field.js/gas.js; M = index.html/gpu-boot.js/ladder.js/sw.js/the
boot & restore region; L = the loop region + views + modwindow.js); lane N last, on the settled tree.

Per lane, before hand-back: `bash test.sh node`; `node tests/pwa.test.mjs --write`; the item's own gate; the DIGEST LOCK
for anything near field.js; `__LW.serialize()` bytes on a fixed project; `node ~/Documents/MIR/tools/adopt.mjs <app>
--check` = "in step". The lead runs `bash test.sh all` (119 GREEN / 0 RED on the base) per lane commit and the two benches
(headed Firefox, Electron, quiet GPU) at the end for the before/after table.

## 4. What this run will not do (and why)

A bundler; lazy window construction; the MIR shell adoption; kit edits (`lab/mir/**`); any look change (§2 lane C);
the occupancy/brick skip (non-exact, slower at the exact bound); rg16float; jitter/hash changes (H1 pins); tabulating
hydrogen; 1152-pipeline specialisation; merging head+body backdrops; `content-visibility`/`will-change` (measured zero or
slower); coalesced saveSettings; async `LW.kick/enterBox/launchPacket/period/ladder.set/helium.sol` (the proofs read them
synchronously); destroying textures on hide; a third chemistry worker.

## 5. Open for the refutation round and for Sol

1. K7's class (N3) — the lead's recommendation to Josh: accept (every changed texel is closer to exact; 46× fewer flips
   than one present of the shipped jitter), but it is his call.
2. K5's class (N2) vs the worker road.
3. M1's risks: an early promise shared through a module; listeners attached late; the no-GPU path; two callers.
4. M2: `load()` (F) vs `if (active) compute(); else schedule();` inside `set()` (D) — the draft takes F's shape.
5. M7(d): does `data-theme` at the top of boot change any first-paint pixel? (lane C)
6. N6(d): deleting `lab/palette.js` / `lab/notebook-render.js` — precache, wiring allowlist, build-deploy (lane D).
7. K2: view×style alone, or must the folded flags come too? (lane A's probe)
8. What nobody measured: retina/iPad prices; the deployed origin's RTT for FD10; FC8's play-start gap under a quiet GPU.
