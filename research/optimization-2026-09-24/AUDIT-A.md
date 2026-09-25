# AUDIT A · RENDERER / GPU · 2026-09-24 · Opus 5.5

## 1. What I read, what I measured

**Read whole:** BRIEF.md (incl. §7–8), `lab/field.js` (1468), `lab/gas.js`, `lab/well.js`, `lab/bessel.js`, `lab/hydrogen.js`,
`lab/render-exact.js` (1225), `lab/capture.js` (the header + PART 2, the driver), `lab/molecular-field.js` (header + evaluator:
CPU-only, never on the frame path), `lab/frame-budget.js`; `lab/rack.js` 400–580 (quality, governor, reader law), 880–1420 (router,
`modesAt`, `applyRebuild`, camera, `loop`), 1940–1975 (FIELD QUALITY), 3625–3672 (`refreshOcclusion`), 4805–4900 (phone/tablet),
5213–5345 (serialize/restore of quality), 5700–5960 (`__LW`). REPORT.md "Measured performance" (124), "2026-09-10 · Real-time pass"
(2194); CLAUDE-CODE-HANDOFF "iPad/Safari performance pass". Baselines: firefox (+log), chromium, chromium-dsf2, firefox-headed.
AUDIT-B/C/D/F for overlaps (FB6, FD6, F14 touch the gas records/tables — see MERGE notes).

**Method.** Every probe reads the app only through `__LW`, and copies the SHIPPED WGSL out of `lab/field.js` **as text** (fetch), so
"ship" in every table is byte-for-byte the kernel that ships; variants are string edits of that copy compiled into the probe's
own pipelines on the app's device. The present-pass replica (psi rebuilt with the shipped kernel from the mode/param bytes
field.js itself writes, captured by wrapping `queue.writeBuffer` for one synchronous call) is **proved exact**: its FNV hash equals
`field.readPixels()`' own hash for the same view block (`replicaExact: true`, every run). Harnesses: `probes/A/run.mjs` (headless
Firefox, GD_PORT 5231) and `probes/A/run-electron.mjs` (Electron 44 / Chromium 152 / Dawn on the real RTX, CDP). All outputs are the
`*.out.json` beside each probe in `research/optimization-2026-09-24/probes/A/`.

| probe | what | output |
|---|---|---|
| `dispatch-floor.js` | why the numbers were quantized | `dispatch-floor.out.json` |
| `gas-kernel.js` | 11 gas-kernel variants × 64/96/128, bit-compare vs ship + an f64 oracle at 3000 voxels | `gas-kernel.out.json`, `.electron.out.json` |
| `kernel-variants.js` | bit-identical trims on 91 hydrogen / BOX packet / gas × 3 grids | `kernel-variants.out.json` |
| `gas-pixels.js` | what the tabulated gas kernel does to the rendered picture | `gas-pixels-64/128.out.json` |
| `present.js`, `present2.js`, `present3.js` | present replica: steps/views/styles, floors, rg16, 2×, occupancy skip, specialisation | `present*-default-96*.out.json` |
| `lines.js`, `lines-cpu.js` | FRAME off/box/dots/lattice GPU + CPU, writeBuffer cost by size | `lines.out.json`, `lines-cpu.out.json` |
| `governor.js` | GOVERNOR + AUTO SCALE time series, axial gas 128³, UI hidden | `governor-gas.out.json` |
| `boot-quality.js` | what a first visit marches | `boot-quality.out.json` |

Firefox timings: min over interleaved rounds (other lanes share this GPU; contended rounds show as 2–4× outliers in the JSON), n grown
until one batch is ≥ 2.5 s (tick error = 100 ms / n, printed per number). Chromium completion is prompt: its rounds agree to 0.1 %.

## 2. Findings, ranked

**FA1 · The axial gas's Miller recurrence can be a 512 KB table: 128³ reconstruct 112.6 → 8.1 ms (Firefox), 70.5 → 8.0 ms
(Chromium), and the texels move TOWARD the exact value.**
WHERE: field.js:38–50 (`sphj`), 90–95 (space-3 branch); gas.js:72–83 (`fieldModes` records); rack.js:988.
MECHANISM: every voxel × every one of 256 modes runs `l + 24 + ⌊kr⌋` recurrence steps (up to ~113 at l = 15, n_r = 15, kr ≈ 74),
each with a division, plus `sin`/`cos` of arguments up to 74 — outside [−π, π], where WGSL promises no accuracy. j_l(k r) = j_l(z·u)
with u = r/a, so the radial part is a fixed function of (l, n_r) on [0, 1], **independent of the radius**: 256 rows × 256 samples of
(j_l(z u), h·z·j_l′(z u)), cubic Hermite in the kernel (two vec2 reads), built once from gas.js' own f64 `sphj`.
EVIDENCE (`gas-kernel.out.json`, `.electron.out.json`, `gas-pixels-*.out.json`):

| grid | ship FF | tab FF | ship Chromium | tab Chromium |
|---|---|---|---|---|
| 64³ | 15.1 ms | 1.10 | 9.19 | 1.07 |
| 96³ | 48.4 | 3.41 | 30.09 | 3.45 |
| 128³ | 112.6 | 8.1 | 70.45 | 8.08 |

Accuracy against an f64 oracle (3000 random in-sphere voxels × re/im, inputs = the same f32 records the GPU reads): **ship** max 41
fp16 ulps off the correctly-rounded exact value (mean 0.79); **Hermite-256** max **1** ulp (mean 0.50) at every grid; linear
needs ≥ 2048 samples for the same (lin1024: max 4 ulps; 256 linear samples would be ~1 % — L1 as written is not accurate enough).
Against ship: 10.7 % of texel components change, max |Δ| = 4.6·10⁻⁴·max|ψ| (half an fp16 ulp at the peak). **Rendered picture**
(shipped RENDER_WGSL, readPixels' own view block, the replica hash = the app's): 0.010–0.017 % of pixels change, **every one by
exactly 1 level** (density/phase/real, 64³ and 128³). Yardstick: the shipped renderer on the shipped volume, one present later
(jitter seed +1), changes **0.78 %** of pixels (max 1 level) — 46× more. Identical texel statistics in Firefox and Chromium.
CHANGE: gas.js `export function gasRadialTable(N = 256)` → cached Float32Array(256·N·2), rows in `build()` order (row = l·16 + n_r),
built lazily on first axial use (26–38 ms main thread in FF; FD6 already wants the gas lazy); the record carries `lag[3] = row`
(rides FB6's persistent records). field.js: grow `radialBuf` (binding 4 exists; space 6 uses rows 0–39) or add binding 5; `setGasTable()`
uploads once. Kernel, space 3:
```wgsl
if (r < aa) {                                         // FA2: a branch, not select()
  if (M.lag0.z > 0.5) {                               // the axial gas: tabulated radial, row = lag0.w
    let xq = clamp(r / aa, 0.0, 1.0) * 255.0; let i0 = min(u32(floor(xq)), 254u); let s = xq - f32(i0);
    let p0 = gtab[rb + i0]; let p1 = gtab[rb + i0 + 1u];   // rb = u32(M.lag0.w) * 256u
    let R = (2s³−3s²+1)·p0.x + (s³−2s²+s)·p0.y + (3s²−2s³)·p1.x + (s³−s²)·p1.y;
    f = M.c.z * R * Dw;                                // am = 0 on every gas record (ipow(st,0) = 1 exactly)
  } else { f = M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw; }   // the 91-label box packet keeps the recurrence
}
```
NEUTRALITY: NOT bit-identical — argued inside fp16 precision per law 1: (i) every changed texel is closer to exact (41 → 1 ulp max);
(ii) the picture moves by 1 level on ≤ 0.02 % of pixels, 46× less than the shipped jitter moves it every present; (iii) no physics
number reads the GPU (gas.test, well.test are CPU); saved bytes and controls untouched. Checks: `gas-pixels.js` (pixels) and
`gas-kernel.js` (oracle) re-run on the built branch; `gas.test.mjs` THE RECORDS (lag[2] = 1 stays; lag[3] is new).
GAIN: the BOX axial gas at 128³ goes from 14 fps (Chromium, the kernel is the whole frame: baseline-chromium) to present-bound
(~8 + 5.5 ms → ~70 fps; ~90 fps with FA3). The governor never has to touch this scene on this desktop again.
RISK: a table/record row mismatch paints the wrong radial → caught by the oracle probe (it would be thousands of ulps);
`setRadius` must NOT rebuild the table (radius-free by construction) but must keep `aa`; an iPad with 16 KB-class L1 may feel the
2 × 8-byte reads more (unmeasured). EFFORT: M.

**FA2 · Three bit-identical kernel trims: early-out on the well's wall + memoised geometry / P_l / e^{imφ} — gas 2.5×, BOX packet
2.2×, 91 hydrogen modes −24 % (−32 % with record staging). Zero texels differ.**
WHERE: field.js:70–118 (the mode loop), :94 (`select(0.0, … sphj …, r < aa)`), :93 (`select(D, legP(l, ct), …)`), :115.
MECHANISM: WGSL `select` evaluates both arms, so `sphj` (the loop above) runs for voxels OUTSIDE the sphere too — 58.5 % of the
volume at the gas's ±1.08 a domain (`nonzeroVoxelFraction` 0.4155) — and `legP` runs on every mode. Every mode also recomputes
`length`, a division, `sqrt`, `atan2`, `cos`, `sin` of a centre that is the same for all 256 gas / 91 hydrogen / 27 box records, and
`legP(l, ct)` for 16 modes that share each l.
EVIDENCE (`kernel-variants.out.json`, FF, min; Chromium in `gas-kernel.electron.out.json`), `differFromShip` = 0 on all 9 (state, grid)
pairs, every variant:

| state · grid | ship | early | early+memo | +record staging |
|---|---|---|---|---|
| gas 256 · 64/96/128 | 15.1 / 48.4 / 112.6 | 8.8 / 25.0 / 58.4 | 7.0 / 20.0 / **45.1** | 7.0 / 20.0 / 45.1 |
| gas · Chromium | 9.19 / 30.1 / 70.5 | 5.65 / 16.9 / 38.7 | 4.43 / 12.9 / **29.4** | — |
| BOX packet 27 · 64/96/128 | 2.22 / 2.61 / 5.85 | 1.47 / 1.50 / 3.27 | 1.25 / 1.15 / **2.61** | 1.22 / 1.28 / 2.56 |
| hydrogen 91 · 64/96/128 | 0.97 / 1.87 / 4.30 | = ship | 0.76 / 1.56 / 3.29 | **0.50 / 1.24 / 2.92** |

CHANGE (pseudo-diff inside `main`):
```wgsl
var gC = vec3<f32>(0.0); var gq = vec3<f32>(0.0); var gr = 0.0; var gct = 1.0; var gst = 0.0; var gphi = 0.0;
var gL = 999u; var gP = 0.0; var gMM = -1e30; var gE = vec2<f32>(1.0, 0.0);
for (var a = 0u; a < P.count; a++) {
  let M = modes[a];
  if (a == 0u || any(M.ctr.xyz != gC)) { gC = M.ctr.xyz; gq = pos - gC; gr = length(gq);
    gct = select(gq.z / max(gr, 1e-12), 1.0, gr < 1e-9); gst = sqrt(max(0.0, 1.0 - gct * gct)); gphi = atan2(gq.y, gq.x); gL = 999u; gMM = -1e30; }
  let q = gq; let r = gr; let ct = gct; let st = gst; let phi = gphi;          // the same expressions, skipped when repeated
  …  space 3:  var Dw = D; if (M.lag0.z > 0.5) { if (l != gL) { gL = l; gP = legP(l, ct); } Dw = gP; }
              if (r < aa) { f = M.c.z * sphj(l, kk * r) * ipow(st, am) * Dw; }   // was select(0, …, r < aa)
  …  if (mm != gMM) { gMM = mm; gE = vec2<f32>(cos(mm * phi), sin(mm * phi)); } let e = gE;
```
Optional: stage 64 records per pass through `var<workgroup> array<Mode, 64>` (7 KB; n = 64/96/128 are multiples of 4 so every
workgroup is whole and the barrier is uniform once the bounds test moves to the store) — worth −11 % on hydrogen, 0 on the gas.
NEUTRALITY: the memo keys are exact equality of the inputs of pure functions; measured bit-identical (all texels, both browsers).
Gate: a DIGEST LOCK — `fieldDigest().hash` for {1s+2pz, rydberg, 91 labels, box packet, gas, helium, H₂} × {64,96,128} on the base
commit, asserted equal after (the probe `kernel-variants.js` is that gate in miniature). GAIN: above; FA1 includes these (its tab
column is measured on top of memo). RISK: WGSL uniformity (none: no barrier in the memo), a compiler that contracts differently
across a restructured loop (would show in the digest lock). EFFORT: S.

**FA3 · The present pass is ALU-bound, not texture-bound — and a copy of RENDER_WGSL with view/style folded to constants renders
the SAME BYTES in half the time (default style).**
WHERE: field.js:317–471 (`fs`), 1119–1128 (`encodeRender`), 774 (`makeRenderPipeline`).
MECHANISM: one fragment shader carries 6 views × 8 styles × finish × palette × invert × bow as uniform branches inside a 160–240-step
loop; the compiler cannot drop them. Floors (`present2`, 96³, 1920×994, 160 steps): texture fetch + march only **1.71 ms**; all the
shading with NO fetch **3.26 ms**; shipped **3.68 ms**. The loop marches every step: 71 % of pixels hit the box, **every hit pixel
runs all 160 steps** (the α > .985 exit fires on 0.03 %), 217 M samples/frame, 60 % of them with a < 10⁻⁵.
EVIDENCE (`present3-default-96.out.json`, FF; `.electron.out.json`, Chromium; hash = FNV of rgba8 bytes):

| view / style | FF generic → specialised | Chromium | bytes differing (FF · Cr) |
|---|---|---|---|
| density / cloud | 3.66 → **1.83** | 3.96 → 1.95 | 0 · 0 |
| phase / cloud (boot default view) | 4.93 → **3.24** | 5.42 → 3.28 | 0 · 0 |
| real / cloud | 3.41 → 1.83 | 3.85 → 1.91 | 0 · 0 |
| density / solid | 4.23 → 2.01 | 4.29 → 2.03 | 1 (1 level) · 0 |
| phase / additive | 4.69 → 2.93 | 5.29 → 3.03 | 0 · 2 (1 level) |
| density / glass | 11.26 → 10.85 | 12.28 → 11.85 | 1 · 1 |

Specialised-pipeline compile: 34 ms (FF) / 56 ms (Cr), async.
CHANGE: `specRender(view, style)` = RENDER_WGSL with `let mode = u32(V.p0.x)` → `${view}u` and `let style = u32(V.p3.x)` →
`${style}u` (the probe also folded palette/invert/bow/finish; the builder must measure whether view×style alone keeps the gain —
48 variants max, compiled lazily with `createRenderPipelineAsync`, the generic pipeline drawing until the specialised one resolves).
`encodeRender`, `readPixels`, `linePixels`, `throughput` select through the same function, so every gate measures what ships.
NEUTRALITY: bit-exact for the shipped default style (cloud) in density/phase/real on both browsers. Lit/additive combinations:
≤ 2 bytes of 5.7 M off by 1 level, compiler-dependent (FF solid, Cr additive) — either accept that as fp noise with the argument, or
ship the specialisation for cloud/grain/dust/bands only and keep lit styles generic (still 2× on the default). Gate: generic-vs-
specialised hash per combination (`present3.js` generalised), plus `render-regressions.browser-test.mjs`.
GAIN: present −50 % on cloud (−34 % on the phase view the lab boots in); it scales with pixels × steps, so the 2× (retina) case
drops ~14 → ~7 ms. RISK: pipeline-cache growth (48 × 2 formats), a first-use frame on the generic path (same pixels where exact).
EFFORT: M.

**FA4 · GOVERNOR + AUTO SCALE stack three degradations on a compute-bound scene, and AUTO SCALE keeps the paused picture at 35 %.**
WHERE: rack.js:1206–1244 (autoQ, governor), 437–440 (ladders), 367–370 (settings), frame-budget.js.
MECHANISM: both read the same rAF interval; AUTO SCALE drops at 4/3·budget every 24 frames, the governor at 1.68·budget every 30,
so both fire, and the governor's STEP ladder (the 2026-09-10 wave: "ray steps first") halves the march on a scene whose cost is the
reconstruct. On pause the governor restores grid and steps "at once" (rack.js:1244) but `quality.autoScale` is untouched, and an idle
lab presents nothing that could raise it. In '120' mode on a 120 Hz display the budget is 8.33 ms: AUTO SCALE shrinks the canvas
for any scene slower than 11.1 ms (90 fps) and only climbs back at ≤ 9.0 ms (111 fps).
EVIDENCE (`governor-gas.out.json`, gas 128³, UI hidden, both ON, playing 45 s): t = 2.3 s scale .9 · 3.8 s steps 240 → 168 · 7.0 s
→ 120 · 10.3 s grid 96³ · 12.0 s grid 64³ · 14.0 s scale **0.35** (canvas 1920 → 672 px). After PAUSE: grid 128³, steps full,
**autoScale 0.35, canvas 672 px** — the still picture stays at 12 % of its pixels. (No 64↔96 oscillation in these 45 s: headless
Firefox's interval stayed > 50 ms at 64³; the oscillation is a code-read LEAD for a real 60 Hz GPU, moot after FA1.)
CHANGE (for Josh/lead, not silent): (a) reset `quality.autoScale = 1` on the pause edge — the governor's own law at rack.js:1244,
arguably a bug fix; (b) skip the step rung when the frame is reconstruct-bound (signal: reconstruct every frame with modes·res³ above
a bound, or `timestamp-query` where it is real — Chromium lists it, Firefox zeroes it); (c) one controller: AUTO SCALE as the
governor's first rung instead of a parallel loop. NEUTRALITY: changes pixels under load by design — a policy decision. GAIN: no 7 s of
half-step picture before the grid moves; a paused picture at the user's resolution. RISK: render-exact/capture pin `quality.auto` and
`governor.on` (HAZARDS) — unaffected. EFFORT: S (a), M (b/c).

**FA4-table · Every QUALITY option: effective, pixel-changing, or a trap** (numbers from the probes above; "code" = code-read).

| option | what it moves | effective? | changes pixels the user did not ask for? | trap? |
|---|---|---|---|---|
| GRID 64/96/128 | reconstruct ∝ voxels (gas 15/48/113 ms); present by its paired steps × scale (FA6) | yes | no (the user's choice) | the boot's 64³ is not the segment's 64³ (FA6) |
| FIELD CLOCK cap | skips EVOLVE reconstructs until due (rack.js:1192) | yes for mid-cost states; for the gas it trades 113 ms frames for uneven pacing | shows a stale field between reconstructs (labelled) | not persisted in settings or project, and the segment has no `ui.` handle, so restore cannot re-seat it (code) |
| AUTO SCALE | canvas pixels (present ∝ pixels: 2× = 3.83× cost) | yes for present-bound scenes, useless for compute-bound ones | yes, down to 35 % | FA4: acts beside the governor; not reset on pause; on 120 Hz targets ≥ 90 fps |
| GOVERNOR | steps ×0.7/×0.5, then grid, then reader law | steps: only for present-bound; grid: yes | yes | FA4: step rung first on compute-bound scenes; grid rung = texture destroy/recreate (code) |
| DOMAIN AUTO / HALF-WIDTH | voxel size; cost-neutral (steps and grid fixed) | not a perf control | no | none found |
| KEEP FRAMES | the transport playhead (DOM, lane B/C) | no GPU effect | no | — |
| PERFORMANCE 120 / FULL | CPU readers every 4th frame; the budget (learned refresh vs 60 Hz) | yes (CPU) | via the budget: AUTO SCALE/governor thresholds halve on a 120 Hz panel | FA4 |
| phone / tablet caps | DPR 1.5 (−44 % pixels at DPR 2), tablet 110 steps while moving, phone 64³/110/0.75 | yes | tablet: the moving picture differs from the still one (documented) | none new |

**FA5 · The Firefox baseline's sub-millisecond numbers are the completion tick, not the GPU.**
WHERE: field.js:1283–1308 (`throughput`), tools/perf/bench-firefox.mjs.
MECHANISM: Firefox resolves `onSubmittedWorkDone` on a 100 ms tick — even with nothing in flight (`dispatch-floor.out.json`: idle
wait 97.6–100.2 ms; 1 to 640 empty dispatches all 100 ms). `throughput` divides one wait by n.
EVIDENCE: baseline `reconstructMs 0.254` at n = 400 is exactly one tick/400 (true value unknown, < 0.25); the gas `presentMs
3.348 / 6.682 / 8.365` at n = 30/30/12 are 1, 2, 1 ticks — not measurements; every n = 200 style/view number is ±0.5 ms. The brief's
"n ≥ 200 for sub-ms" is not enough: size n so ONE batch is ≥ 2.5 s (my probes), or measure in Electron (prompt completion).
CHANGE: tools only — `throughput({ targetMs: 2500 })` growing n, or the Electron runner. NEUTRALITY: diagnostics only. EFFORT: S.

**FA6 · A first visit marches 64³ at 160 steps and full scale (4.82 ms); the GRID segment's own 64³ row is 110 steps × 0.75 scale
(2.01 ms). Both read "64³".**
WHERE: rack.js:421 (`quality = { res: 64, steps: 160, scale: 1 }`), 1956 (the segment's pairing), 4819–4868 (wave 106 names the pairing).
EVIDENCE: `boot-quality.out.json` (fresh profile, phase view): 1920×994 · 160 steps · 4.82 ms vs 1440×746 · 110 · 2.01 ms.
CHANGE: none without Josh — either seed `steps: 110, scale: 0.75` (the ladder wave 106 calls "the pairing") or leave the richer boot
and say so. NEUTRALITY: a look change either way. GAIN: 2.4× present on every first visit if the pairing is adopted. EFFORT: S.

**FA7 · FRAME: the line pass is cheap on the GPU (lattice +0.2 ms, dots/box ±0); lattice and dots cost 0.45–0.67 ms of MAIN THREAD per
camera-moving frame, ~80 % of it the upload.**
WHERE: field.js:987–1107 (`writeLines`), 1109–1117 (`drawChrome`).
EVIDENCE: GPU present (`lines.out.json`, n = 1000): off 3.62 · box 3.61 · dots 3.62 · lattice 3.81 ms. CPU encode while the FREE camera
turns every frame (`lines-cpu.out.json`, 300 frames ×2): off/box 0.06 · **dots 0.45 · lattice 0.67 ms**, one chrome upload per frame;
still camera: 0 uploads (the wave-108 cache holds). Live auto-rotate, UI hidden: field tick 0.15 (box) / 0.60 (dots) / 0.83 (lattice).
`queue.writeBuffer`: 176 B 0.79 µs, 28 KB 37.7 µs, **777 KB 526 µs** — dots uploads 29 478 vertices (825 KB), more than the lattice.
(The camera here is FREE by default — rack.js:94 — so a probe that moves `obs.yaw` measures nothing; lines.js (b) did exactly that.)
CHANGE: (a) neutral: a 16-byte (xyz + alpha) vertex format for lattice/dots with the constant ink RGB in a uniform — same f32 values
into the same blend, −43 % bytes; (b) near-exact: upload the static radius-8 mesh once and cull/clip against the camera plane in
the vertex shader (each vertex carries its segment's other end) — f32 vs f64 culling can flip segments lying on the plane.
GAIN: (a) ~0.25 ms, (b) ~0.6 ms per moving frame. EFFORT: S (a) / M (b). Josh's "Frame is expensive" is not the GPU line pass on this
box; the DOM side is lane C's.

**FA8 · GLASS (style or finish) is 3× the cloud because `litAt` (6 extra taps) runs on essentially every step.**
WHERE: field.js:451 and 459 (`shell > 0.0`, `wEff > 0.0`), 290–297 (`litAt`).
MECHANISM: at ρ = 0 the shell is exp(−(1/0.32)²) = 5.7·10⁻⁵ > 0, so the gradient runs in empty space too.
EVIDENCE: `present-default-96.out.json`: cloud 3.66 · glass 11.26 · finish glass 11.27; specialisation only reaches 10.85.
CHANGE (Josh): a gradient volume (∇ρ written by the reconstruct, one tap instead of six) or a contribution cutoff under 8-bit
visibility — the code comment already rejected a 0.02 cutoff as visible. NEUTRALITY: changes pixels. GAIN (est.): 11 → ~5 ms.

**FA9 · Small, measured, mostly not worth a change.** Per present: `writeView` 176 B + `vpBuf` 64 B ≈ 1.5 µs (the view changes every
present anyway — p0.w is the jitter seed); per reconstruct: params 0.6 µs, stats zero 0.6 µs, gas modes 38 µs. `packModes`
allocates a fresh `[0,0,0]` per centre-less mode per reconstruct (field.js:608) — use a module constant when FB6 lands. The palette
fetch costs +0.18 ms on the phase view (5.12 vs 4.93). The ray step count is exactly linear (110/160/240 → 2.51/3.66/5.49 ms), so the
governor's ×0.7/×0.5 rungs buy exactly −30 %/−50 % of the present and nothing of the reconstruct.

## 3. Leads I refute (with evidence)

- **L3 (stage records through workgroup memory)**: 0 % on the gas (112.6 vs 112.6 ms), −12 % alone on 91 hydrogen modes; uniform
  record loads are not the bottleneck — the recurrence is.
- **L7 "texture taps"**: the present pass is ALU-bound (fetch-only floor 1.71 ms of 3.68; no-fetch floor 3.26). An **rg16float**
  copy of the volume is bit-identical (0 texels, 0 pixels differ) and **no faster** (3.656 vs 3.675 ms; 14.079 vs 14.081 at 2×).
- **L7 "occupancy skip now"**: a per-step brick-max skip (8³ bricks + halo, bound on a, march arithmetic untouched) is SLOWER at an
  a < 10⁻⁵ bound (3.79 vs 3.68 ms) and −15 % at 10⁻⁴ with 7 % of pixels moved by 1 level (`present2`). A brick DDA changes the
  `t += ds` accumulation, so it cannot be exact; after FA3 the ceiling is ~1 ms. Not the next wave — a Josh quality tier at most.
- **L7 "cheaper hash() jitter"**: it runs once per pixel, not per step, and capture.js / render-exact.js (hazard H1) pin exactly this
  seed; any change breaks their determinism proofs for no measurable gain.
- **L7 "512 bound vs steps"**: steps ≤ 240 in every shipped ladder; the break costs nothing measurable.
- **L1 as written**: "256 samples per (l,k)" with linear interpolation is ~1 % error (lin1024 already 4 ulps); Hermite-256 or
  linear-2048 is the accurate road (FA1). The table is radius-independent, so it never rebuilds on `setRadius`.
- **Q5 "per-frame writes"**: µs (FA9) — the view block cannot be skipped anyway (the jitter seed moves every present).
- **"Present doubles under GLASS shell style" (baseline headline)**: it is the glass DRAW STYLE / finish (litAt), not the frost UI;
  the frost/refractive CSS costs nothing on the GPU pass (headless has no backdrop; Chromium: default 117 fps).
- **The baseline's gas `presentMs` (3.35/6.68/8.37)**: completion ticks (FA5); the true gas present equals hydrogen's at the same
  steps × pixels (content-independent within ±5 %).

## 4. Things I would NOT do

- Change the ray-march jitter, its seed, or `hash()` (H1 pins; GRAIN reads the same word).
- Switch `psiTex` to rg16float: no gain, and fieldDigest/sampleVoxel/copies all change shape.
- Sample the gas table through a hardware-filtered texture: NVIDIA's 8-bit filter weights would add the error FA1 removes.
- Raise gas.js' 1e-7 mode filter: low-ρ texels are visible (softness 0.3 → pow(10⁻⁶, 0.3) = 0.016).
- Tabulate hydrogen: its closed form is cheap (91 modes at 128³ = 2.9 ms after FA2).
- Specialise on every flag (1152 pipelines): view × style (≤ 48) carries the measured gain.
- Let the governor choose levers by fps alone without a cost split, or change its policy silently (FA4 is a proposal).
- Build the occupancy/brick skip before FA3 lands and is re-measured.

## 5. Open questions for the cross-refutation round

1. Law 1: is "texels closer to exact, ≤ 1 level on ≤ 0.02 % of pixels, 46× fewer flips than one present of the shipped jitter"
   acceptable for FA1? (It is not bit-identical and I do not claim it is.)
2. FA3 on lit/additive styles: accept ≤ 1 level on ≤ 2 bytes/frame (compiler-dependent), or keep those styles generic?
3. FA4 (a): bug fix (the governor's own pause law) or a behaviour change needing Josh?
4. FA6: is the richer first-visit 64³ intended?
5. Does view × style specialisation alone keep FA3's gain, or do the folded flags (palette, invert, bow, finish) matter? (Probe ready.)
6. Apple GPUs (the iPad): ALU/MUFU ratios differ; FA1–FA3 are measured only on the RTX 3070 in Firefox and Chromium.
7. MERGE: FA1's row index rides FB6's persistent gas records; FA1's lazy table and FD6's lazy `createGas` are one change; F14/FB6 own the
   CPU side of the gas records, FA1/FA2 the GPU side.
