# λWAVES · THE OPTIMIZATION RUN · 2026-09-24/25

Commissioned by Josh on the frozen build v0.2.3-alpha.3 (`91c90bc`): "make it buttery smooth and usable **without
changing or bugging anything**". Led by Fable 5.1; six Opus 5.5 auditors, one lane each, then a cross-refutation
round, then Sol (GPT via the codex plugin) on the merged plan, then six Opus 5.5 builders in isolated worktrees with a
gate on every commit. Everything is on branch `worktree-optimization-2026-09-24`; Josh merges. The research record is
`research/optimization-2026-09-24/` (BRIEF, AUDIT-A…F, REFUTE-A…F, SOL-REVIEW, PLAN, BUILD-BRIEF, the probes and the
baselines). This document is the summary; the numbers below are the auditors' and builders' own measurements on the
RTX 3070, quoted with the probe that made them.

The branch: 67 commits over the frozen base; 66 files under `lab/`, `tests/` and `tools/` changed (+2 676 / −1 728
lines; rack.js 6 080 → 5 661); nine new modules out of `boot()`, one new module `lab/gpu-boot.js`, one new browser suite
(`tests/menubar.browser-test.mjs`), one new tool (`tools/perf/digest-lock.mjs`), three byte-duplicate modules deleted,
the PySCF oracles moved under `tests/fixtures/`. Nothing under `lab/mir/**` or `lab/fonts/**` was touched.

## 1. The law of the run, and how it was kept

Every change is one of: **N0** bit-identical (texels, DOM, saved bytes), **N1** identical output later or on another
thread, **BUG** a proven defect with a written proof, **DIAG** tooling. Nothing that changes a pixel of Josh's glass,
a physics number, a saved byte or a control was built; those are §5, his list. Two roads were rejected on the way for
being "almost" neutral: the factored `gas.stats` (a `-0.00`/`0.00` flip on a symmetric instant) and the autoScale reset
on pause (it changes the paused image). The gas table (FA1) ships **opt-in, default OFF**, because it is inside fp16
precision but not bit-identical — his eyes decide.

The gate: **THE DIGEST LOCK** (`tools/perf/digest-lock.mjs`, 1004 values: 13 states × 3 grids of `fieldDigest` +
`readPixels` + packed-record hashes, 120 view × style × flag rows, 26 FRAME rows) recorded on the base tree and
re-checked GREEN after every lane and every merge; the 77 node suites after every commit; `__LW.serialize()` bytes on
fixed projects; the MIR stylehash for anything near the DOM; `adopt --check` "in step with MIR 1.4.3" throughout; the
full browser gate on the merged tree.

## 2. What the audits found (the bill)

| scenario (1920×1080, RTX 3070) | who set the rate | base |
|---|---|---|
| default rack, frost, 96³, headed Firefox | the compositor: 18 backdrop layers ≈ 7.4 ms, the whole UI ≈ 11.7 ms | 80.5 fps (hidden 119 = cap) |
| the same in Chromium/Electron | 18 layers ≈ 3.2 ms; the UI ≈ 4.0 ms | ~115 fps (cap) |
| BOX axial 256 at 128³ | the compute kernel: 112.6 ms FF / 70.5 ms Chromium per reconstruct | 8–14 fps |
| present pass, phase/cloud, 96³ | an ALU-bound generic shader | 4.9 ms |
| boot, cold Firefox | `requestAdapter` 415 ms + `requestDevice` 110 ms, serial after the module graph | ready 1180 ms |
| project open / quick LOAD | a synchronous LADDER solve for a closed card | 0.46–1.5 s freeze |
| the loop's JS | 0.2–0.8 ms median; one 9–17 ms `gas.stats` frame every 24th | — |

And the defects the audits proved: the no-GPU boot crashed instead of showing its banner (L6); a device lost before the
field existed was reported alive (Chromium) or crashed the boot (Firefox); a failed project open was half-applied,
marked clean, and a plain SAVE then overwrote the stored file; a GRID change during an export was dropped; one thrown
reader froze the loop for the session; three menubar rows did the wrong thing (RESEED reset the camera, RESET KEYS was
dead, CLEAR could wipe the undo ring); ABOUT's remembered size was erased by the next preference change; the occlusion
mask ignored the canvas scale (masks 2.9× too large after AUTO SCALE, and stale on every boot); the period-scan worker
could be jammed for over two minutes by four seconds of a moving register; `perf.median` reported the last frame, not
a median (every earlier "loop median" was one frame).

## 3. What was built

### Lane K · the kernel, the present pass, the lines (field.js, gas.js, well.js)

| item | what | before → after | class |
|---|---|---|---|
| K1 | kernel memos (geometry per centre, P_l per l, e^{imφ} per m) + a branch at the well's wall | gas 128³ 112.6 → 46.8 ms; 96³ 48.4 → 21.2; BOX packet 5.67 → 2.74; 91 labels 4.32 → 3.40 ms (0 texels differ on 12 states × 3 grids, both browsers; the lock caught a compiler fold on the oscillator and it was fixed) | N0 |
| K2 | view × style specialised present pipelines (bow and glass-finish branches removed by selection; exports pin the generic pipeline) | phase/cloud 4.87 → 3.25 ms; density/cloud 3.67 → 2.10; real/cloud 3.52 → 1.90; grain/dust/bands −28…−35 %; 0 bytes differ on all 48 (view, style) pairs | N0 |
| K3 | persistent gas records | 178 KB → 72 B of heap per reconstruct; 463 400 packed floats identical | N0 |
| K4 | lazy gas tables, `setRadius` marks stale, one idle warm | WELL RADIUS pointermove 12.6–13.1 → ≤ 0.04 ms; boot construct 13.1 → 0.18 ms | N1 |
| K6 | 16-byte lattice/dots vertex; the camera out of the box/axes cache key | box chrome writes 300 → 1 per 300 camera turns; CPU per moving frame dots 0.51 → 0.33, lattice 0.69 → 0.57 ms; 26 FRAME rows identical | N0 |
| K9 | `throughput({ targetMs })` | Firefox sub-ms GPU numbers are no longer completion ticks | DIAG |
| K11 | `wellPacket` factor cache (21 distinct radials, 21 Legendres, cos/sin per m) | 182 → 36 ms per LAUNCH / OPERATOR→BOX press in the page; 3 294 numbers identical; the worker's bow inherits it | N0 |
| K12 | occlusion rects kept in CSS pixels, re-applied on resize | the mask matches a fresh upload at scale 1 and 0.5 (it did not before, and not at boot) | BUG |
| K7 | the Hermite-256 gas table, **opt-in** (`?gastab=1`, `__LW.gasTable(true)`) | ON: 128³ 46.7 → 8.35 ms, 96³ 20.9 → 3.76, 64³ 7.24 → 1.17; ≤ 1 fp16 ulp from exact (the recurrence: 17–41); ≤ 0.022 % of pixels move one level (one present's jitter moves 2.4 %). OFF: bit-identical, lock GREEN | N3 opt-in |

### Lane M · boot, storage, projects

| item | what | before → after | class |
|---|---|---|---|
| M3 | the L6 guard (method form) | no-GPU boot: "boot failed" → the designed "WebGPU unavailable" banner, 0 errors | BUG |
| M1 | `lab/gpu-boot.js`: adapter + device requested from `<head>` in parallel with the module graph, single-use, with a `lost` flag honoured by createField (+ the banner no longer overwrites a lost device's) | headless Firefox cold ready 1176.6 → 868.7 ms, first present 1196.7 → 908.2, createField 492.9 → 67.5; final A/B ready 1076 → 742 ms; digest/limits/adapterInfo identical over 18 boots; an early device loss now reports `ok:false` + the lost banner in both engines (base: Firefox crashed, Chromium said alive); 40 reloads without a crash | N1 + BUG |
| M2 | `ladder.load()` on restore (the public `set()` untouched) | project open at n̄ 42: 1479 → 38 ms; quick LOAD 1473 → 37 ms; params, `last`, serialize, digest identical | N1 |
| M5 + M5b | a failed open leaves the instrument as it was: roll back to the pre-open snapshot, keep the current project and notebook, keep the dirty state, say "open failed" | a plain SAVE after a failed open no longer overwrites the broken file NOR the previously current good project (four probe scenarios) | BUG |
| M4 | ABOUT's `abW/abH` carried by saveSettings | the remembered size survives a theme flip | BUG |
| M7 | `paintMarks` batched | boot 7 → 1 paints; project open 11 → 1 (7.6 → 2.5 ms); all 270 mark rects identical | N0 |
| M6(b,c,e) | SLICE appended after its view; hidden H₂⁺ plot and PULSE panel skip their construction paints | neutral (stylehash 0/0, canvases identical); the boot's first forced layout only moves to the next closed card — see N8 | N0 |
| M8 | chemview's record module on the first solve, not at boot | 6 fetches / 88 KB out of every boot | N1 |
| M9 | the PySCF oracles out of the served tree (`tests/fixtures/oracles/`) | precache 202 → 200 files, 5.26 → 4.86 MiB | N1 |
| M10 | wiring-ALLOWLIST orphans not precached, derived from the allowlist itself (≈ 15 lines) | precache 200 → 190 files, 4.86 → 4.49 MiB | N1 |
| K10 | measured and NOT built: `Promise.all` over the compile infos was slower (Electron 27 → 31 ms) | — | — |

### Lane LA · the loop, the router, the readers (rack.js)

| item | what | before → after | class |
|---|---|---|---|
| LA1 | the perf ring slot fixed; `LW.perf.loopMedian` | `perf.median` read after a `gas.stats` frame: 8–14 ms (the frame's own cost) → 0.84–1.46 ms (the median); worst gap from the true median 12.74 → 0.42 ms | DIAG |
| LA4 | `loop()` in try/catch/finally, one report per distinct message, no hot loop | a throw while playing: frozen forever → 19 frames in 1.5 s and one `__e` entry; a throw every paused frame: no hot loop | BUG |
| LA8 | the export lock records `pending` | a GRID change during an export: dropped → 64 → 96 after the export | BUG |
| LA2 | the link retry without the repaint | forced paints of the closed modulation window 5 → 0 per 5 s of playing; a route made mid-play still joins in 0.9 s | N0 |
| LA3 | occlusion while the UI is hidden: `[]`, no DOM reads | 162 gBCR + 153 gCS → 0 + 0 per 3 s hidden; occlusion frames 0.76 → 0.42 ms | N0 |
| LA5 | the warm chain stops when warm, re-arms on an OPERATOR switch | idle: 5 timers + 5 idle callbacks per 10 s → 0 + 0; the K key stays warm after a switch | N1 |
| LA6 | one period scan in flight, latest key, the late reply tracked | the scan storm's worker jam 152.7 s → 3.0 s; scans over 8 s now land (before: never) | N1 |
| LA7 | the CAPTURE hover asks the worker; ⟳ and G stay forced | hover on the BOX 355 → 1.6 ms (density), 758 → 0.7 (phase), 1274 → 0.8 (Sturmian); the plan identical to the PLAN button's on six states | N1 |
| LA10 | CALCULUS rows updated in place | 0.44 → 0.24 ms and 37 → 8 mutation records per update; innerHTML identical | N0 |
| LA9 | measured and skipped: `measureRacks` costs 0.00–0.02 ms per move | — | — |

### Lane LB · the windows and the workers

| item | what | before → after | class |
|---|---|---|---|
| LB1 | the closed modulation window asks for no layout; `expand()` opens once | boot field→ready 180 → 144 ms; applySettings at boot 22.3 → 3.9; per open 33.6 → 23.2 ms; 8 serialize snapshots identical incl. a compact ENV saved closed; stylehash 0/0 | N0 |
| LB3 | `paint()` writes only the words that changed | mutation records per paint 52 → 37 (forced), 34 → 21 (running); outerHTML identical | N0 |
| LB2 | the grip places once per frame through the coalescer | per pointermove 0.342 → 0.015 ms and 14 → 0 rect reads; final geometry identical | N0 |
| LB4 | HELIUM's basis solved by the worker only; the field keeps the last basis; exports force the fresh one | worst stall per basis change while playing: →ten 254 → 7 ms, →six 80 → 9 ms; settled digests identical; exports identical | N1 |
| LB5 | CHEMISTRY RT: one spectrum in flight, paced; the pole fit in the chem worker | at ~125 k samples 27 → 335 steps/s, worst stall 124.7 → 19.3 ms; worker fit ≡ page fit (`Object.is`) | N1 |
| LB6 | kick.js: the radial integral memo, the one-matrix cache, shared radial rows | K key warm repeat 13.7 → 1.7 ms, new impulse 13.6 → 5.2, cold 137.9 → 115.9; 1 104 `Object.is` checks, 0 differ | N0 |

### K5w · the axial gas's SPECTRUM readout in the maths worker

| item | what | before → after | class |
|---|---|---|---|
| K5w | the UNCHANGED `gas.stats()` runs in the maths worker on its own `createGas`; the page paints the reply with the same formatting; one request in flight, latest t kept; stale replies (radius, packet, basis, visibility) dropped; the synchronous road stays when the worker is down | BOX axial 256 playing 6 s: 5 frames over 5 ms (8.2–9.7 ms, the frame-thread calls) → 0, frame max 1.2–1.6 ms; 61/61 readout strings identical to base; 144/144 node fields `Object.is` (a symmetric packet's `-0.00` keeps its sign); lag 8.2 ms median | N1 |

The factorised sum (26× faster on the same thread) was rejected by Sol's law check: it flips a displayed `-0.00`.

### Lane N · archaeology (after the merge)

| item | what | proof | class |
|---|---|---|---|
| N1 | menubar rows call their functions (`runAction`, `keyFor` hints, CLEAR = STATE's, RESET KEYS restored, every row in try/finally) | new `tests/menubar.browser-test.mjs`, 7 blocks green; run against the old rack it catches every defect (RESEED seeded 0 particles and moved the camera; RESET KEYS left PLAY rebound; CLEAR emptied the undo ring 1 → 0) | BUG |
| N2 | build line `0.2.3-alpha.3 · the optimization pass · 2026-09-25`; stale comments; LANDSCAPE.md superseded; README's numbers from lane K's probes | ABOUT, `LW.build`, the copy dump | BUG/docs |
| N3 | 134 orphan selectors cut (the filtered 124 + five second-tier + `.palette-seam`; the live orbit/dyn rows kept) | live-CSSOM probe 4 607 elements × 4 states: 0 differ beyond A/A noise; MIR stylehash every window × 8 states: 0 elements, 0 pixels | N0 |
| N4 | SETTINGS-KEYS remnants out of the dispatcher (the `keysheet` alias and action id kept); A11 retargeted to shortcuts.js | access 11/11, keyboard suites | N0 |
| N5 | seven write-only bindings cut after a fresh reader search; `LW.version` and the menu scale kept; `phone.DPR`/`tablet.DPR` read (1.5) | node + browser suites; serialize bytes | N0 |
| N6 | the kit's palette and notebook modules imported; the three byte-identical lab copies deleted; three ALLOWLIST entries dropped | hexToRgb 24 096 / rgbToHex 30 782 / unproject 20 000 cases `Object.is`-equal; wiring, pwa (the kit files precached again by M10's rule) | N0 |
| N8 | the last closed-card construction reads guarded (h2view, chemview, modDodge's pill read) | forced layout reads before ready 33.2 → 0 ms; ready 738 → 701 ms; all 30 2D canvases identical; stylehash 0/0 | N0 |
| N7 | nine seams out of `boot()`: motion-pref, busy-mark, worker-pool, accent-wheel, sw-client, badges, rack-menus, menubar, window-chrome | one commit each with the lock, node suites, serialize bytes and stylehash green; rack.js 6238 → 5635 lines | N0 |

## 4. The before/after on the merged tree

The three benches of `tools/perf/` re-run on the merged tree with the gas table OFF (the exact road); full tables in
`research/optimization-2026-09-24/BEFORE-AFTER.md` (`node tools/perf/compare-benches.mjs`). The baseline was one run;
the after is one run; scenes at the display cap (~115–119 fps) cannot rise.

**Electron 44 / Chromium 152, 1920×1043** (rAF fps, the compositor Josh does not use but the iPad's WebKit is nearer to):

| scene | before | after |
|---|---|---|
| default rack · refractive · frost ALWAYS | 92.2 | 116.4 |
| rack shown after a hide | 74.6 | 117.7 |
| frost ALWAYS · blur 8 | 83.0 | 114.4 |
| refractive · frost · disconnected | 91.3 | 115.0 |
| modulation window open | 83.3 | 118.3 |
| FRAME off | 103.7 | 114.7 |
| every rack window open | 102.4 | 99.1 |
| **128³ axial gas · UI shown** | **6.7** | **30.3** |
| 128³ axial gas · UI hidden | 6.6 | 31.8 |
| boot ready | 844 ms | 788 ms |

**Headless Firefox** (boot, projects, the GPU roads; the software compositor, so its fps are not Josh's):

| | before | after |
|---|---|---|
| boot ready | 975 ms | 794 ms |
| last resource end | 865 ms | 521 ms |
| project open / restore | 489.8 / 463.2 ms | 68.9 / 43.3 ms |
| present, 1s+2pz, 64 / 96 / 128 | 1.52 / 3.76 / 5.51 ms | 1.00 / 2.32 / 3.28 ms |
| 91 modes, frame, 64 / 96 / 128 | 2.26 / 5.51 / 9.76 ms | 1.51 / 3.75 / 6.76 ms |
| BOX packet, frame, 64 / 96 / 128 | 2.70 / 6.65 / 11.32 ms | 2.25 / 3.98 / 5.98 ms |
| BOX axial gas 256, reconstruct, 64 / 128 | 16.7 / 118.3 ms | 10.0 / 50.1 ms |
| loop, BOX gas 128³ UI hidden | 8.7 fps | 18.3 fps |

**Headed Firefox 155 on DISPLAY :0** (WebRender — Josh's own compositor). This bench spreads by ±10 fps run to run on a
live desktop (the default scene gave 87.7 / 98.7 / 86.8 in three back-to-back runs), so the after column is the median
of three runs against the baseline's single run; the exact numbers (the GPU reconstruct, the boot) do not spread:

| scene | before (one run) | after (median of 3) | the three runs |
|---|---|---|---|
| default · refractive · frost ALWAYS · light · 96³ | 80.5 | 87.7 | 87.7 / 98.7 / 86.8 |
| UI hidden (H) | 119.1 | 115.6 | 115 / 115.6 / 116.5 |
| UI shown again | 88.0 | 95.3 | 86.2 / 95.6 / 95.3 |
| frost OFF · refractive | 113.2 | 98.6 | 114.6 / 92 / 98.6 |
| frost ALWAYS · tinted | 82.4 | 87.0 | 96.4 / 87 / 81.5 |
| frost OFF · tinted | 117.7 | 103.3 | 95.7 / 103.3 / 109.5 |
| refractive · frost ALWAYS · disconnected | 83.5 | 94.8 | 94.8 / 88 / 98.1 |
| connected · dark theme | 93.9 | 101.6 | 104.4 / 101.6 / 100.5 |
| light · FRAME lattice | 89.0 | 86.9 | 85.6 / 86.9 / 95.3 |
| FRAME off | 87.4 | 101.4 | 78.8 / 101.4 / 108.8 |
| FRAME box · modulation window open | 76.8 | 75.2 | 70.6 / 78.8 / 75.2 |
| modulation closed · all windows open | 72.9 | 69.3 | 60.8 / 69.3 / 70.9 |
| all windows open · UI hidden | 117.5 | 119.6 | 118.9 / 119.6 / 120.8 |
| 128³ · sim-ladder · default windows · UI shown | 93.3 | 103.5 | 96.5 / 103.5 / 110.1 |
| 128³ · UI hidden | 119.1 | 119.4 | 118 / 120.5 / 119.4 |
| **128³ · axial gas · UI shown** | **8.3** | **17.3** | 16.9 / 17.5 / 17.3 |
| boot ready (ms) | 1055 | 812 | 913 / 812 / 762 |
| gpu 128³ axial gas reconstruct (ms) | 118.3 | 50.1 | 50.05 / 50.07 / 50.05 |

Read it with the audits' finding in mind: in Gecko the default frame is the compositor's 18 backdrop layers (≈ 7.4 ms)
plus the field (now 2.3 ms at 96³ instead of 3.8), so the shown-UI scenes move by the field's saving and the hidden-UI
scenes sit at the cap; the scenes with every window open carry WIGNER's 2 Hz re-probe (FB4/F10, Josh's list) and are
within the run-to-run spread of the baseline. The glass menu (§5.2) is where the rest of the Gecko frame is.

## 5. For Josh — decisions, with prices

**Josh's rulings (2026-09-25, morning), built as wave 125:** the gas table becomes the default (it touches only the
BOX's axial-gas basis; `?gastab=0` / `__LW.gasTable(false)` opt out); the autoScale reset on the pause edge is built
as the bug fix it is; CLEAR stays STATE's; the glass stays exactly as it is on the desktop, and on a phone or tablet a
NEW user's first-run material is frost OFF, tinted (stored choices win); the version is his to name and the release is
cut clean (no history rewriting). The consolidation of the mathematics into one paper is for the beta or 1.0.0. The
list below is kept as the record of what was on the table.

1. **The gas table (K7)** was in the build OFF; now ON by default (wave 125). Every changed texel is closer to exact
   (41 → 1 fp16 ulp); ≤ 0.02 % of the axial-gas pixels move by one level, against 2.4 % from one present's jitter;
   hydrogen and every other state are bit-identical to before.
2. **The glass menu** (GPU ms/frame saved, WebRender / Chromium, DPR 1, from AUDIT-C): J1 FROST OFF drops the heads'
   `brightness(1.03) saturate(1.03)` (**5.1 / 0.3**) — this reverses your wave-103 words ("let it be 103 % … to
   distinguish the bar from the contents"); J2 STILL as the default policy (7.4 / 3.2, +4.9 / 2.4 with the modulation
   window open); J3 heads tinted not frosted (3.6 / 1.5); J4 the three rack chips (1.6 / 0.7); J5 the four rail discs
   (≈ 1.8 / 0.8); J6 `tablet-motion` keep/remove/debounce (a 6–11 ms restyle + repaint at every drag edge on the iPad);
   J7 transient panes under FROST OFF; J8 the rack slide without ancestor opacity (the glass goes clear for 280 ms today,
   also on project open). No pixel-neutral CSS lever exists: culling, `content-visibility`, `will-change`, `contain`
   all measured zero or slower.
3. **autoScale on pause**: after governed play the paused picture stays at 35 % of its pixels until something else
   presents. A one-line reset (+ a PRESENT) is written up; not built because it changes the paused image.
4. **The early theme at boot**: resolving `data-theme` at the top of boot shortens the first-visit dark→light flash
   and removes a 16 ms restyle; not built because cold-boot frames change. Lane M's canvas-digest gate recipe is in its
   hand-back.
5. **FA4(b/c)** governor levers, **FA6** the first visit's 64³ (160 steps × 1.0 vs the segment's 110 × 0.75),
   **FB4/F10** the parked readers' 3 s re-probe (80–120 ms hitches), **FB11/F12** the busy mark's meaning (and its
   +0.42 ms of paint per frame while up), **F7/F13** LAUNCH/K-key async (kept synchronous by wave 45; K11/LB6 made them
   3–8× faster instead), **N1's CLEAR** (STATE's now; SPECTRUM's is the other), **FD4's class** (`{ ...S0 }` ends the
   carried-keys hole but keeps retired keys), **FD10** modulepreload (needs a real-network number), the MIR shell
   migration (ends the KaTeX duplicate; the wiring allowlist hard-fails 2026-11-20).
6. **Pre-existing, found, not fixed**: the chemistry fit window starts at the worker's trace[1] (t = 0 never reaches the
   card); `refit()` refuses for the first 2 s after load; kick tables keyed on the Hamiltonian id only, so after `setZ`
   the K key uses Z = 1 rows (max matrix error 0.67 at k = 0.3); a revealed legacy H₂⁺ card's plots stay blank until a
   resize; an H hide→show round trip loses the axis pixels in `linePixels` on the base tree; a headless-Firefox
   navigation landing just after first presents can stall the next page's rAF.
7. **Unmeasured**: retina/iPad prices (WebKit); FC8 (the play-start gap under frost ALWAYS) after LA2 on a quiet GPU.

## 6. How the run was done (for the next one)

Six read-only audits with full-file reads, each a probe folder and a numbered finding list; a cross-refutation round
where each auditor read the other five (REFUTED / NARROWED / CONFIRMED(+) / RISK / MERGE); Sol's law check per item; the
lead's rulings in PLAN.md §0 and §9; builders in harness-isolated worktrees (a subagent cannot run Bash in a hand-made
worktree — `Agent({ isolation: "worktree" })`, then `git merge <lead HEAD>`); one commit per item with the gate in the
message; the lead merges and re-runs `pwa --write`, the node gate and the lock after each merge (sw.js stamps conflict
by construction, and taking one side of that conflict once dropped a prose row — re-run the pwa suite, not only
`--write`). GPU contention between builders' probes and the lead's lock produced four spurious lock failures ("Not enough
memory left", "Context lost", "Invalid buffer"); the lock is only trusted on a quiet GPU.
