# λWAVES 0.4.0 · S0 MEASURE: the three numbers

**Measured 2026-10-07 by the S0 measurements probe** (brief: `../BRIEF-S0-MEASURE.md`; plan: `../PLAN.md` §3 B0, §4 F5, §9 R-L2).
Base commit `61f7c2c`. Nothing under `lab/` was edited. The scripts are in `tools/perf/` and the raw JSON sits beside this file.

**Host.** RTX 3070 (NVIDIA driver, Vulkan 1.4.329), AMD Ryzen 5 5600G (12 threads), Linux 7.0.0-34, node v22.22.1.
**Browsers.** Chromium 153 (playwright `chromium-1243`), Chromium 154 (`/snap/bin/chromium`) and Firefox 157 (snap, driven by
geckodriver with the gate's prefs). **Load.** Before each timing I checked with `pgrep -a firefox` / `pgrep -a chrom`: no other
browser was running. The GPU was idle (P8, 0–2 %) before each run, and the load average was 0.1–1.8 because other agents shared
the CPUs. Every timed number is a median over at least 5 runs, with min–max beside it. The surprising numbers were re-run alone:
the node re-time (`benzene-node-rerun.json`, benzene 1561 ms against 1566 ms) and the whole Chromium dispatch table (11.99 ms
against 11.91 ms at 300 AO).

## The three sentences

1. **Workgroup memory.** On the RTX 3070, Chromium (on Vulkan) and Firefox 157 both report `maxComputeWorkgroupStorageSize` =
   **49152** (48 KiB), and both grant `requestDevice({ requiredLimits: { maxComputeWorkgroupStorageSize: 32768 } })`. A device
   requested without that limit still gets **16384**, so the cap-128 tier (128 × 64 × 4 B = 32 KiB) needs one more key in
   `lab/gpu-boot.js`'s `want`. **The M5 is pending:** the one line Josh pastes is in §1.
2. **Benzene.** On the 3070's host, a 36-AO ground solve takes **1.0 s** (node, Chromium) to **1.44 s** (Firefox) and the
   spectrum takes **0.43–0.60 s**, so ground + spectrum is **1.45–1.92 s**. The model predicts **9.6 s**, so it is too
   pessimistic by **5.0×** (Firefox), **6.1×** (node) and **6.6×** (Chromium). At 58 AO (naphthalene, beyond the library) it
   is off by 8.1×: 17.5 s measured against 141.7 s predicted.
3. **The 300-AO orbital.** One 300-AO orbital-only dispatch at 96³, with no χ tile, costs **12.0 ms** (Chromium) / **12.1 ms**
   (Firefox) of GPU time on the 3070. That is **4.4× / 4.2×** benzene's density dispatch, measured today in the same browser
   (2.72 / 3.00 ms). The cost is linear in nAO at **0.040 ms per AO** (+0.2 ms). A per-shell screen (skip a group where
   e^{−α_min r²} < 1e-10) brings it to **3.2 / 3.6 ms** (1.2× benzene density).

---

## §1 · `maxComputeWorkgroupStorageSize` and its neighbours

**Method.** `tools/perf/limits.html` asks for a `high-performance` adapter and reports `adapter.info`, the WebGL unmasked renderer
(as a second identity check), the compute limits and the features. It then requests three devices, each from a fresh adapter: one
with `requiredLimits { maxComputeWorkgroupStorageSize: 32768 }`, one with the adapter's own maximum, and one with no limits.
`tools/perf/gpu-limits.mjs` loads the page in each browser variant and writes `limits.json`. Limits are exact numbers, so there
is no spread; repeated runs gave identical values.

| variant | adapter (info · WebGL renderer) | wg storage | invocations | size X/Y/Z | storage binding | max buffer | wg/dim | 32 KiB device | default device | timestamp-query |
|---|---|---|---|---|---|---|---|---|---|---|
| **Chromium 153** headless + Vulkan (`--enable-features=Vulkan --use-angle=vulkan --no-sandbox`) | nvidia / ampere · RTX 3070 (Vulkan 1.4.329) | **49152** | 1024 | 1024/1024/64 | 2147483644 | 4294967292 | 65535 | yes (32768) | 16384 | yes |
| **Chromium 154** snap, headed on :0 + Vulkan | nvidia / ampere · RTX 3070 (Vulkan 1.4.329) | **49152** | 1024 | 1024/1024/64 | 2147483644 | 4294967292 | 65535 | yes (32768) | 16384 | yes |
| **Firefox 157** headless, the gate's prefs | info empty (Firefox withholds it) · "NVIDIA GeForce GTX 980, or similar" (Firefox's masked string for the NVIDIA card) | **49152** | 1024 | 1024/1024/64 | 2147483644 | 2147483644 | 65535 | yes (32768) | 16384 | yes |
| Chromium 153 headless, `probe-chromium.mjs` flags only | google / **swiftshader** (fallback) | 32768 | 256 | 256/256/64 | 1073741824 | 1073741824 | 65535 | yes | 16384 | yes |
| Chromium 154 snap, headless (with or without Vulkan) | swiftshader / (Vulkan: `requestAdapter` → null) | 32768 / — | 256 | 256/256/64 | 1073741824 | 1073741824 | 65535 | yes / — | 16384 | yes |
| Chromium 154 snap, headed on :0, no Vulkan | google / **swiftshader** (WebGL is on the RTX through GL) | 32768 | 256 | 256/256/64 | 1073741824 | 1073741824 | 65535 | yes | 16384 | yes |
| **iPad M5, Safari** | **M5 pending** | — | — | — | — | — | — | — | — | — |

**The M5 row.** Josh can fill it in either of two ways:

- Open `https://<LAN server>/tools/perf/limits.html` on the iPad and copy the "ONE LINE" JSON at the bottom.
- Or paste this into the Web Inspector console for an iPad Safari tab (on the Mac: Safari › Develop › the iPad › the tab):

```js
(async()=>{const g=navigator.gpu,a=await g.requestAdapter({powerPreference:'high-performance'}),L=a.limits,i=a.info||{};let ok=false;try{const b=await g.requestAdapter({powerPreference:'high-performance'});(await b.requestDevice({requiredLimits:{maxComputeWorkgroupStorageSize:32768}})).destroy();ok=true}catch(e){ok=String(e)}console.log(JSON.stringify({ua:navigator.userAgent,gpu:[i.vendor,i.architecture,i.description].join('/'),wgStorage:L.maxComputeWorkgroupStorageSize,invocations:L.maxComputeInvocationsPerWorkgroup,size:[L.maxComputeWorkgroupSizeX,L.maxComputeWorkgroupSizeY,L.maxComputeWorkgroupSizeZ],storageBinding:L.maxStorageBufferBindingSize,maxBuffer:L.maxBufferSize,perDim:L.maxComputeWorkgroupsPerDimension,ts:a.features.has('timestamp-query'),device32k:ok}))})()
```

The line was checked in Firefox 157 here and printed `wgStorage: 49152, device32k: true`. On the M5, `wgStorage` and `device32k`
fill the row's "wg storage" and "32 KiB device" cells. Apple GPUs usually expose 32 KiB of threadgroup memory under Metal, so I
expect 32768. **That value is an expectation, not a measurement.**

**What S4c needs from this.**

- On the 3070 the cap-128 χ tile fits in every browser that reaches the RTX: 32 KiB is under 48 KiB, and even the SwiftShader
  fallback offers exactly 32 KiB.
- The app does not get the larger limit unless it asks. `lab/gpu-boot.js` `requestGpu()` puts only `maxTextureDimension1D/2D`
  into `want`, so today's device holds 16384, the default.
- Not measured: a 32 KiB workgroup tile on Ampere halves how many workgroups fit in an SM's shared memory compared with 16 KiB.
  The cap-128 tier's kernel cost is S4c's to time.
- Headless Chromium reaches the RTX only with the Vulkan flags. Without them it runs on SwiftShader, which is what the
  `probe-chromium-headed.mjs` / `bench-chromium.mjs` headers describe. Any Chromium GPU number from this box should be taken
  with `--enable-features=Vulkan --use-angle=vulkan` (plus `--no-sandbox` for the playwright build, because this box's AppArmor
  refuses it user namespaces).

---

## §2 · The benzene re-time, ground + spectrum, node and browser

**Method.**

- **Node** (`tools/perf/benzene-retime.mjs`). Pass A calls the worker's own exported functions from `lab/mathworker.js`:
  `chemRegister` → `chemGround` → `chemSpectrum`. These are the code the `chem` worker runs for `chem.ground` then
  `chem.spectrum`. I timed their walls and read back their `timings`.
- Pass B times each piece of the spectrum separately: `rpa()`, the lazy `R.tda` ladder, and `canonicalStates` (copied verbatim
  because it is not exported).
- Molecules are cycled so that the worker's one-solve cache never answers. Run 0 (the cold JIT run) is kept apart, and the
  tables show 5 warm runs.
- **Browser** (`tools/perf/benzene-browser.mjs`). This uses the MOLECULES card's real `solve()` (`chem.ground` then
  `chem.spectrum` through `lab/worker-pool.js`). I detected when the ground state landed by polling `__LW.chem.state()` every
  2 ms; `solve()` resolves when the roots arrive. I also parsed the worker's split from the status line.
- The model is `lab/molecules.js` `predictMs`. It was fitted on 2026-09-12 to the whole worker path, so I compare it with
  ground + spectrum.
- Benzene is **not** offered in 6-31+G* (126 AO, over `BASIS_631.maxAO` = 46). The one 6-31+G* row is therefore C₂H₄ at that
  46-AO cap. Naphthalene (58 AO, idealised hexagons) is a node-only point beyond the library, added for the plan's "≤ 64 AO"
  question.

**Ground / spectrum / total, ms, median of 5 warm runs (min–max):**

| molecule | basis | nAO | node ground | node spectrum | **node total** | Firefox ground | Firefox spectrum | **Firefox full** | Chromium ground | Chromium spectrum | **Chromium full** | predicted | predicted ÷ measured (node · FF · Cr) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| H₂O | STO-3G | 7 | 6.4 (6.2–10.1) | 0.6 | **7.1** (6.9–11.0) | 10.3 | 0.6 | **12.0** (8.8–12.4) | 8.0 | 0.6 | **8.6** (8.1–19.8) | 16 | 2.3 · 1.3 · 1.9 |
| N₂ | STO-3G | 10 | 15.5 (14.0–24.5) | 0.8 | **16.2** (14.8–25.4) | 23.6 | 1.6 | **24.9** (24.2–38.4) | 16.9 | 1.3 | **18.2** (17.6–22.1) | 33 | 2.0 · 1.3 · 1.8 |
| **C₆H₆** | STO-3G | **36** | **969** (957–1032) | **596** (589–618) | **1566** (1546–1650) | **1441** (1394–1493) | **493** (478–517) | **1922** (1883–2010) | **1025** (1012–1048) | **430** (416–439) | **1454** (1428–1480) | **9592** | **6.1 · 5.0 · 6.6** |
| C₂H₄ | 6-31+G* | 46 | 1525 (1516–1577) | 560 (558–571) | **2091** (2076–2136) | 1841 (1759–1880) | 490 (468–513) | **2342** (2227–2393) | 1493 (1472–1500) | 408 (401–434) | **1901** (1877–1930) | — (STO-3G model) | — |
| C₁₀H₈ (ideal) | STO-3G | 58 | 7921 (7890–8344) | 9312 (9167–9744) | **17536** (17057–17970) | — | — | — | — | — | — | 141739 | 8.1 · — · — |

**Where node's time goes** (pass A and pass B, warm medians, ms):

| molecule | integrals (inside ground) | ground wall (SCF + guesses + stability + Hessian) | RPA `rpa()` | TDA ladder (lazy) | canonical gauge | spectrum wall |
|---|---|---|---|---|---|---|
| C₆H₆ | 518 | 969 | 479 | 115 | 2.6 | 596 |
| C₂H₄ / 6-31+G* | 218 | 1525 | 447 | 114 | 2.7 | 560 |
| C₁₀H₈ | 2481 | 7921 | 7241 | 2034 | 16.5 | 9312 |

**Browser worker split for C₆H₆** (the worker's own `timings`): Firefox integrals 817 ms, ground 1439 ms, rpa 398 ms. Chromium
integrals 551 ms, ground 1023 ms, rpa 342 ms. Polling the ground landing agrees with the worker's own ground timing to within
2 ms, so the round trip and the card's fill add almost nothing.

**Cold first solve.** The first chem solve of a session also pays for the worker module graph and the basis fetch: N₂ as the
first solve took 1156 ms in Firefox and 156 ms in Chromium. A cold benzene full solve took 2007 ms in Firefox (1922 ms warm)
and 1955 ms in Chromium (1454 ms warm), where the extra is the JIT on the first RPA.

**Spread.** Benzene's min–max is within −3 % / +6 % of its median on every road. The node run was repeated alone and gave 1561 ms
(1556–1573) against 1566 ms (`benzene-node-rerun.json`).

**Notes.**

- `COST.browserFactor` is 1.0. Measured today, the browser costs 1.23× node in Firefox and 0.93× node in Chromium (benzene,
  full).
- The model's two anchors are stale. `anchors.C6H6` is 10053 ms, and today's node path is 1566 ms.
- `tests/chem.browser-test.mjs` L6 pins the menu text `~9.6 s`, so any refit of `COST` moves that test too.
- For the plan's 64-AO gate: on this desktop host, a 58-AO STO-3G solve is about 8 s for the ground state and 17.5 s with the
  spectrum. It is not "a few seconds". At 58 AO the spectrum (RPA plus the 816-pair TDA) is 53 % of the wall. The M5 is
  unmeasured.

**The one sentence S4 needs.** A 36-AO ground solve takes **1.0 s** (node, Chromium) to **1.44 s** (Firefox, the gate's
browser) and the spectrum takes **0.43–0.60 s** on the 3070's host (Ryzen 5 5600G). The model's 9.6 s is off by **5.0×**
(Firefox) to **6.6×** (Chromium), and **6.1×** in node, with every prediction too slow.

---

## §3 · One 300-AO orbital-only dispatch at 96³ (F5's road to C₆₀, R-L2)

**Method.**

- **The kernel.** `tools/perf/orbital-dispatch.html` copies the shell evaluation of `lab/field.js` `molWgsl`: the same
  `Shell`/`MP` structs, `shells/alphas/wts`, one `exp` per primitive per exponential group (sp sharing), and the Cartesian
  angular part. Each shell's components are contracted with their coefficients on the spot (ψ = Σ c_μ χ_μ), so there is no χ
  tile. The only workgroup memory is the 64-float max reduction. ψ is written to a 96³ `rgba16float` storage texture, the live
  format.
- **The inputs.** The lab's own STO-3G shells (`basisFrom` + `fieldShells`) on synthetic centres:
  - 36 = benzene at the library geometry.
  - 128 = 24 C + 8 H on a Fibonacci sphere.
  - 300 = 60 C on a 6.7 bohr sphere (C₆₀-like).
  - 600 = 120 C on a 9.5 bohr sphere.
  - Coefficients are random and normalised. `half` = extent + 6, as the chem card sets it.
- **The timing** follows `moleculeThroughput`'s method: n dispatches in ONE compute pass, one submit, one `onSubmittedWorkDone`,
  divided by n. I also read pass timestamps (`timestamp-query` was granted in both browsers). n is chosen so a batch lasts about
  2.5 s, after a warm-up. The tables show 7 batches per row.
- **The reference.** In the same browser session, `/lab/` → `__LW.field.moleculeThroughput({ n: 800 })` on benzene at 96³ with
  half 10.3, done exactly as in `tests/field-molecule.browser-test.mjs`. That is the live density kernel (cap-40 tier) with a KMS
  `D`, plus the live ORBITAL kind (the χ-tile road), 7 repeats each.
- **The check.** For each row, 24 voxels are read back and compared with `molecular-field.js`'s f64 evaluator. The worst error is
  |Δψ| / max|ψ| ≤ **8.7e-4**, which is rgba16float precision. The orbital is the right orbital.

**The app's own references today (ms per dispatch, median of 7; min–max):**

| browser | benzene density (live kernel, cap 40) | benzene ORBITAL kind (live, χ tile) |
|---|---|---|
| Chromium 153 (Vulkan) | **2.717** (2.716–2.731) | 1.623 (1.623–1.624) |
| Firefox 157 | **3.003** (3.003–3.136) | 1.877 (1.877–1.878) |

(`field.js:181` says 2.80 ms. Today's Chromium figure is 3 % under that and Firefox's is 7 % over.)

**The orbital-only kernel (ms per dispatch, median of 7 batches; min–max; ratio = wall ÷ the same browser's benzene density
wall):**

| nAO | shells · exps/voxel | variant | Chromium GPU | Chromium wall | ×benzene ρ | Firefox GPU | Firefox wall | ×benzene ρ |
|---|---|---|---|---|---|---|---|---|
| 36 | 24 · 54 | plain | 1.589 (1.584–1.590) | 1.593 | 0.59 | 1.663 (1.663–1.681) | 1.712 | 0.57 |
| 36 | | screened | 0.743 | 0.747 | 0.27 | 0.860 | 0.895 | 0.30 |
| 128 | 80 · 168 | plain | 5.305 (5.304–5.307) | 5.311 | 1.95 | 5.422 (5.383–5.423) | 5.605 | 1.87 |
| 128 | | screened | 2.041 | 2.045 | 0.75 | 2.252 | 2.339 | 0.78 |
| **300** | **180 · 360** | **plain** | **11.976** (11.975–11.980) | **11.985** | **4.41** | **12.111** (12.108–12.113) | **12.575** | **4.19** |
| **300** | | **screened** | **3.228** (3.226–3.228) | 3.232 | **1.19** | **3.552** (3.540–3.556) | 3.561 | **1.19** |
| 600 | 360 · 720 | plain | 23.940 (23.933–23.957) | 23.954 | 8.82 | 24.150 (24.137–24.158) | 24.311 | 8.10 |
| 600 | | screened | 4.695 | 4.701 | 1.73 | 5.119 | 5.141 | 1.71 |

**Slope.** A least-squares fit over the plain rows gives GPU ms = **0.03956 · nAO + 0.18** (Chromium) and **0.03979 · nAO +
0.25** (Firefox). The cost is linear in nAO, as an O(nAO) orbital must be. The screened variant grows sub-linearly because a
larger molecule leaves more of the box beyond each shell's 1e-10 radius, so its cost depends on geometry and box size; the 300
row is the C₆₀ proxy at C₆₀'s own half (12.6 bohr). At 36 AO, the plain no-tile kernel (1.59 ms) costs the same as the app's
χ-tile ORBITAL kind (1.62 ms), so dropping the tile loses nothing at small nAO.

**Spread.** In Chromium, max−min is under 0.3 % of the median on every row. The table was run twice, and the first run gave
11.913 ms at 300 AO plain against 11.985 ms the second time.

**A Firefox timing hazard.** Firefox 157 resolves `onSubmittedWorkDone` on a tick of about 100 ms. A sweep at 300 AO plain
(`.tmp` only, not kept) gave 20.1 ms of wall per dispatch at n = 10, 13.4 at n = 30, 12.04 at n = 100 and 12.05 at n = 300,
against GPU timestamps of 12.0 ms throughout. So:

- Short batches inflate the wall in Firefox. This is why the batches here last 2.5 s, and why the n estimate comes from the GPU
  clock.
- `moleculeThroughput`'s Firefox numbers carry up to about 4 % of this tick at n = 800.
- Firefox 157's timestamp queries return real, non-zero values, so `field.js`'s comment that Firefox zeroes timestamp queries is
  stale for this version.

**The one sentence the plan needs (R-L2).** One 300-AO orbital-only dispatch at 96³ costs **12.0 ms** (Chromium) / **12.1 ms**
(Firefox) of GPU time on the 3070, which is **4.4× / 4.2×** benzene's density dispatch measured alongside it (2.72 / 3.00 ms).
It is linear at **0.040 ms per AO**. With a per-shell 1e-10 screen it is **3.2 / 3.6 ms** (**1.2×** benzene density). Fable
judges these against the governor's tier.

---

## Files

| file | what |
|---|---|
| `tools/perf/gpu-limits.mjs` + `tools/perf/limits.html` | §1 driver and page (the page also serves the M5) |
| `tools/perf/benzene-retime.mjs` | §2 node, passes A and B |
| `tools/perf/benzene-browser.mjs` | §2 browser, the card's real worker road (Firefox, Chromium) |
| `tools/perf/orbital-dispatch.mjs` + `tools/perf/orbital-dispatch.html` | §3 driver and kernel page |
| `limits.json` | §1 raw, every variant, with the M5 row pending |
| `benzene-node.json`, `benzene-node-rerun.json` | §2 node raw (every run of both passes) and the re-run alone |
| `benzene-browser.json` | §2 browser raw (every run, including the status lines) |
| `orbital-dispatch.json` | §3 raw: every row, check probes, app references, both browsers |

Running them: `python3 tools/gate/server.py "$PWD" 8735 &` then `LW_PORT=8735 GD_PORT=5205 node tools/perf/<script>.mjs`. The
node re-time needs no server.
