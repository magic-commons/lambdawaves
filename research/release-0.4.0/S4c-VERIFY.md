# λWAVES 0.4.0 · S4c VERIFY — the kernel, fresh eyes (written at the usage pause)

Written by the S4c kernel verifier (Opus 5.5, no part in the build), 2026-10-08, against `BRIEF-S4C-VERIFY.md` §1–§6, the contract
`BRIEF-S4-LIBRARY.md` §0 and §S4c and PLAN §10 N1/N3. Nothing in `lab/` was edited; scratch and every script below live in `.tmp/verify/`
(untracked). Nothing was merged, pushed or tagged.

- **Worktree:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aafa9cc0963957d0a`
- **Branch:** `worktree-agent-aafa9cc0963957d0a`, reset to `12451d2` (the `sos-s0` tip; `lab/` identical to `3ced864`, checked:
  `git diff --stat 3ced864 HEAD -- lab/` is empty). Pre-S4c tree `b5eed68`; S4c merged at `a927fc3`; S4b merged at `3ced864`.
- **Ports:** 8761 / 5229. Gate server pid 2542364, killed by pid at the pause.
- **GPU:** RTX 3070. The locks, the suites and the harness ran with the GPU at P8 most of the time; one sample read P0 69–76 % from
  another process during `s4c-kernel.mjs` (its timing rows are not used for the verdict). **My timing table was taken on an idle GPU**
  (P8, 0 %, no other headless browser running) — see §3.

## VERDICT: PARTIAL — scenes not run: the device-report pair (§4, `tools/perf/device-report-run.mjs` at HEAD once)

Every scene that ran is GREEN and every builder number I re-measured reproduced; **0 BLOCKER, 0 SHOULD, 12 NOTE**. The one scene
not run is the device report at HEAD (brief §4). **If it lands within the governor's tier (nominal 64³, ~18–19 fps headless
Firefox, 0 held) the kernel as merged stands (fit for the 0.4.0-alpha cut): YES.** I did not reach the optional cross-check of
S4c's own 1148 claim on the `a927fc3` tree (not needed for the verdict: see §1, the chain is closed another way).

---

## 1 · The locks and the gates

| suite / check | count | verdict | command (from the worktree root, server on 8761) |
|---|---|---|---|
| **digest lock, plain** | 1004 values | **GREEN** — 0 readback, 0 record-byte differences, unrepeatable none, page errors 0, 60 s; SKIPPED (named): `chemC6H6, chemLys, chemLysHomo` — exactly S4a's three record states, which the base fixture predates (correct) | `LW_PORT=8761 GD_PORT=5229 node tools/perf/digest-lock.mjs --check --query gastab=0` |
| **digest lock, S4a fixture** | 1148 values | **GREEN** — 0 / 0, unrepeatable none, page errors 0, 59 s | `… --check --query gastab=0 --fixture research/release-0.4.0/measure/digest-lock-s4a.json` |
| WGSL of the ≤ 64 tiers, rendered | caps 16 / 40 / 64 | **byte-identical to `b5eed68`** (5535 B each; sha256/16 `c0975ee88c2889cc`, `8a5823bde0d3ff84`, `526c0406693f6a77`, old = new(cap, 64) = new(cap)) | `node .tmp/verify/wgsl_compare.mjs` (imports HEAD `lab/field.js` and an extracted copy of `b5eed68`'s with `molWgsl` exported) |
| `bash test.sh node` | 85 suites | **GREEN**, exit 0, no non-zero "failing of" line | `bash test.sh node` |
| `node tools/orbital-library.mjs --check` | 38 records | **in step**, 11,532,460 B, lab/library.json 87,663 B, nothing else in `lab/library/`, the gate passes every entry, exit 0 (the full re-solve, ~17 min) | as named |
| `node tools/new-project.mjs --check` | — | **in step** (16,889 B) | as named |
| `node tests/pwa.test.mjs` (no `--write`) | 11 PASS | **GREEN**, exit 0 | as named |
| browser `chem` | 55 | **GREEN** 55/55 | `.tmp/verify/run_suites.sh chem molecular-names render-regressions current export3d library field-molecule orbitals` (one at a time, 4 s apart) |
| browser `molecular-names` | 6 PASS | **GREEN** | 〃 |
| browser `render-regressions` | 2 PASS | **GREEN** | 〃 |
| browser `current` | 15 PASS | **GREEN** (`valuesReveal` did not fail this run) | 〃 |
| browser `export3d` | 10 PASS | **GREEN** | 〃 |
| browser `library` | 7 PASS | **GREEN** | 〃 |
| browser `field-molecule` | 9 PASS | **GREEN** | 〃 |
| browser `orbitals` | 24 | **GREEN** 24/24 | 〃 |
| builder's `s4c-kernel.mjs` | Firefox + Chromium, all sections | **GREEN**, every `pass: true` (tracked `s4c-kernel.json` restored after with `git checkout`) | `LW_PORT=8761 GD_PORT=5229 node tools/perf/s4c-kernel.mjs firefox chromium` |
| builder's `s4c-c60-app.mjs` | 7 asserts | **PASS** (tracked `s4c-c60-app.json` restored) | `LW_PORT=8761 GD_PORT=5229 node tools/perf/s4c-c60-app.mjs` |
| my page, 2 browsers × 3 device modes | 13 records, 112 texel arrays per browser | **GREEN** (§2, §3) | `.tmp/verify/run_kv.sh` (drives `.tmp/verify/kv.html`) |
| my app scenes | water, VIEW row, lysine, per-frame, C₆₀, registers | **GREEN** (§2–§4) | `node .tmp/verify/app-checks.mjs`, `node .tmp/verify/app-c60-register.mjs` |

**Re-run alone:** nothing was red, so nothing needed a lone re-run. Each lock ran once, alone on the GPU, GREEN first time.

**The WGSL proof, the other way (brief §1).** The literal text diff `git diff b5eed68 HEAD -- lab/field.js` is NOT empty in the
WGSL region: the template was refactored into `MOL_HEAD` + `MOL_LOOP(screen)` + `molWgsl(cap, wg = 64)` so ORB_WGSL could share the
header and the shell loop. What must be unchanged is the TEXT EACH TIER COMPILES, and it is: rendering `molWgsl(16|40|64, 64)` at
HEAD and `molWgsl(16|40|64)` at `b5eed68` gives identical bytes. The 128-tier text differs from the 64-tier text in exactly four
lines (`WG`, a comment's "64" → "128", `chiW` size, `@workgroup_size(4, 4, 2)` at 32 lanes); every tile index and the max reduction
use `WG`, never a literal 64. The ≤ 64 dispatch is unchanged too: `dispatchMol` sends `(g, g, ceil(res / (64/16)) = g)`, the bind
groups for the tile pipelines are the old seven bindings (`molCutBuf` is bound only to ORB). `lab/field.js` and `lab/gpu-boot.js`
are identical between `a927fc3` and HEAD (S4b did not touch them).

**S4b's two claims, judged.** (i) The 1148 fixture re-record: against `e58e554`'s fixture exactly **26 leaves** differ — `made`,
`url` (the port) and **24 values, all `chemLys` / `chemLysHomo` × 64/96/128 × digest/integral/rp/rpL**; benzene's and the 1004
values are unchanged (`python3 .tmp/verify/fixture_diff.py .tmp/verify/lock-s4a-e58e554.json research/release-0.4.0/measure/digest-lock-s4a.json`).
The cause is the input, not the kernel: HEAD's lysine atoms are the old ones with **x negated exactly** (max |Δ| 0 bohr for the
x-mirror; 13.0 bohr for any other), with the SCF energy and all ε **bit-identical** (`node .tmp/verify/lysine_compare.mjs`); the
benzene record's atoms are unchanged (its file hash moved only for the added fields). So the chain is closed: ≤ 64 WGSL identical
to `b5eed68` + field.js identical `a927fc3` → HEAD + 1004 and 1148 GREEN at HEAD + the only moved values those of a mirrored input.
(ii) The fixtures regenerated on the merged build: ε, C, D and every spectrum array of `record-tryptophan.json` and
`record-C20H20.json` are **bit-identical** between `a927fc3` and HEAD, atoms identical; only `input.atomsSha256` was added
(`node .tmp/verify/fixture_compare.mjs`). The fixture tryptophan's atoms equal S4b's library tryptophan's.

## 2 · The density wall (C1)

- **The request.** `gpu-boot.js` adds `maxComputeWorkgroupStorageSize: 32768` to `want` only where `adapter.limits` reports
  ≥ 32768 (read). Both browsers on the 3070: requested 32768, granted 32768, `MOL_CAPS [16, 40, 64, 128]`, lanes `[64, 64, 64, 64]`,
  no shader error (`moleculeTiers`, my page and the harness).
- **The refused device — the builder's way:** reproduced exactly: fieldDigest **`8ce0fdcb`** both (Firefox, 64 → 32 lanes, 32768 →
  16384) and **`ff0a77c2`** both (Chromium), `wrapCalls 1`.
- **The refused device — my way** (`.tmp/verify/kv.mjs`, my own page in its own realm, the wrap installed before `field.js` and so
  before `gpu-boot.js`'s early request): **`adapter16k`** — the adapter is a Proxy that REPORTS 16384, so gpu-boot never asks
  (requested = texture limits only; granted 16384; lanes `[64,64,64,32]`); **`reject`** — `requestDevice` REJECTS any request naming
  the key, so gpu-boot takes its catch road and a bare `requestDevice()` (requested `null`; granted 16384; lanes `[64,64,64,32]`).
  For 13 records × (density, HOMO, LUMO, VALENCE) the **SHA-256 of the whole 96³ texel array is identical across normal /
  adapter16k / reject: 112 of 112 in Firefox, 112 of 112 in Chromium**, the densities past 64 AO drawn on 32 lanes in both refused
  modes. And a third way: on ONE device that holds 32 KiB, `molWgsl(128, 64)` and `molWgsl(128, 32)` dispatched by my own pipelines
  give **0 differing u16** for tryptophan, C₂₀H₂₀ and Cr(CO)₆, and the field's own texture equals my 64-lane pipeline's.
- **87- and 120-AO reconstructs — against PySCF, not the app's evaluator.** `.tmp/verify/pyscf_voxels.py` (libcint `GTOval_cart`
  on the record's atoms and the vendored STO-3G, D and C mapped into the app's AO order and unit-self-overlap normalisation as
  `record-oracle.py` does) at **16,896 voxel centres of my own** per record (every 4th index from 1, 24³, plus 3072 within ±2 of a
  random nucleus, seed 20261008), the app's `half = extent + 6` equal to PySCF's to 1e-12 for every record:

  | record (AO) | ρ path | √ρ max\|Δ\| / max | worst per-voxel (≥ 1 % of max) | HOMO / LUMO \|Δψ\| / max |
  |---|---|---|---|---|
  | tryptophan fixture (87) | tile 128 / 64 lanes | 5.60e-4 | 9.71e-4 | 5.48e-4 / 4.84e-4 |
  | C₂₀H₂₀ fixture (120) | tile 128 | 3.69e-4 | 8.88e-4 | 5.67e-4 / 8.26e-4 |
  | S4b's tryptophan (87) | tile 128 | 5.60e-4 (= the fixture: same atoms) | 9.71e-4 | 5.48e-4 / 4.84e-4 |
  | tyrosine 76 · Fe(CO)₅ 69 · B₁₂H₁₂²⁻ 72 · arginine 74 · adamantane 66 · Phe 71 · Cr(CO)₆ 79 | tile 128 | 3.3e-4 – 4.8e-4 | ≤ 9.61e-4 | 4.2e-4 – 8.5e-4 |
  | lysine 64 · benzene 36 (the ≤ 64 tiers, for scale) | tile 64 / 40 | 5.60e-4 / 3.77e-4 | ≤ 9.51e-4 | ≤ 7.8e-4 |

  Identical numbers in Firefox and Chromium. The builder's own 256-voxel figures reproduce exactly through its harness (4.557e-4,
  3.685e-4; HOMOs 4.809e-4, 5.555e-4). All within the rgba16float figure (≤ 1e-3 of max; per voxel ≤ 2⁻¹⁰ for every density).
- **Timing, idle GPU** (P8 0 % before each run; two methods — the field's `moleculeThroughput` with n fixed so a batch lasts ≥ 3 s,
  5 batches; and **GPU timestamps on my own device**, `timestamp-query`, 20 dispatches between the pass's two writes, 7 passes):

  | 96³ | Firefox 157 wall / timestamp | Chromium 153 wall / timestamp | builder (Cr / FF) |
  |---|---|---|---|
  | tryptophan density, cap-128, 64 lanes | 20.9 / 20.7 ms | 19.8 / 19.6 ms | 19.6 / 21.5 |
  | same, 32 lanes | — / 20.4 ms | — / 19.6 ms | 19.4 / 20.9 |
  | C₂₀H₂₀ density, cap-128 | 45.5 / 45.6 ms | 42.0 / 42.8 ms | 43.0 / 48.2 |
  | C₂₀H₂₀, 32 lanes | — / 45.2 ms | — / 42.2 ms | — |

  19–48 ms a dispatch confirmed; the builder's finding (the 32 KiB tile buys nothing measurable over 32 lanes on the 3070) confirmed.
- **No per-frame road reaches it.** Every record past 64 AO carries `caps.tdhf: false` (all 38 tabulated:
  `python3 .tmp/verify/records_table.py .`), and `mathworker.js:232` refuses KICK/RUN on such a record with a sentence. Measured in
  the app with the transport PLAYING: tryptophan's DENSITY **0 molecular dispatches in 3 s (60 presents)**, with VALENCE **0 (58)**,
  ORBITAL view **0 (56)**. The only per-frame molecular road past 64 AO is MO-REGISTRY's packet (a complex ORBITAL, ORB_WGSL):
  **59 dispatches in 3 s** — one a frame, the orbital road, never the tile (NOTE N7).

## 3 · The orbital-only path (C2) and C₆₀ (C3)

- **Re-timed, idle GPU** (C₆₀ HOMO at 96³): ORB_WGSL plain / screened **14.08 / 3.92 ms** Firefox (timestamps), **13.23 / 3.56 ms**
  Chromium; through the field (screened) 4.01 / 3.58 ms. Builder: 15.01 / 4.08 and 13.67 / 3.62; via the field 4.17 / 3.65.
- **Screened = plain to rgba16float precision.** My own ORB_WGSL pipeline with every cut at +∞, read back whole and compared with the
  field's screened texture at **all 884,736 texels**, for every orbital past 64 AO (22 orbitals × 2 browsers): the worst difference is
  **1.6e-5 of max** (C₆₀ #177, Chromium); differing texels are one-ulp f16 flips of small values (NOTE N3: not bit-identical, and the
  builder never claimed it was). Screening at 1e-10 is not a visible change. The shared-exponential shells are skipped consistently:
  `packMolecule` shares only on equal centre AND equal α list, so leader and follower have the same cut and the same r².
- **C₆₀ against PySCF.** The builder's committed 256 voxels: 4.02e-4 – 5.61e-4 of max |ψ| for all eight orbitals, both browsers,
  `refHalf = half = 12.421046307847265` (reproduced through `s4c-kernel.mjs`). My 16,896 voxels: **4.86e-4 – 5.76e-4** for #175–#182,
  both browsers (NOTE N4 on one voxel's per-voxel figure).
- **Opened from MOLECULES' LIBRARY row, solver calls counted** (`app-checks.mjs`, `app-c60-register.mjs`, my own count of
  `workerStat().solverCalls` around the whole scene): installed 145,328 B, **0 solver calls**, status "300 AOs · 360 electrons · orbitals
  only · from its record (142 KB, on this device) in 5 ms, no solver call"; the field on `path: 'orbital'`, `cap: null`, 300 AO.
  Refusals, each a sentence: `setView('density')` and `setView('diff')` both answer `'orbital'`, the DENSITY button disabled with "this
  record carries its frontier orbitals only — the density is 0.4.1 BUCKYBALL"; KICK and RUN → "kick failed: C60 is past the live cap: it
  opens only from its record, which stores no electron-repulsion integrals, so TDHF (KICK, RUN) cannot run on it"; spectrum: 0 roots,
  "orbitals only", the canvas caption "no spectrum in its record"; MO-REGISTRY rung 10 → "this record carries orbitals 176–183 only
  (its HOMO and LUMO sets)", rungs 180 and 179+180 draw; STATES → see NOTE N5. Worker-level refusals (`chemSpectrum`, `chemStates`,
  `chemRtInit`) and the unsorted-column validation are `tests/library.test.mjs` §5c, inside the GREEN node run; I also checked
  `validateRecord` refuses a swapped AND a duplicated column (`node .tmp/verify/c60_record_check.mjs`). Screenshot of the HOMO through
  the builder's driver read by eye: a signed h_u lobe pattern over the 60 labelled carbons.
- **The frontier record against the census dump** (`node .tmp/verify/c60_record_check.mjs`): the record's name is its sha-256
  (`a8166591…`, 145,328 B), `validateRecord` → `[]`; cols `[175 … 182]` = the dump's indices; **the eight 300-coefficient columns 0 bit
  differences**; **all 300 ε 0 bit differences**, energy identical (−2244.0187824768127); the 60 atoms = the dump's Å × `angstromToBohr`
  with 0 bit differences, `atomsSha256` correct; `stem.geometrySource` reads "DRAFT GEOMETRY, NOT A MEASUREMENT: Equal-edge ideal
  truncated icosahedron …" and UNVERIFIED (NOTE N2 on the file name and size).

## 4 · VALENCE (C4) and the small things (C5)

- **The formula.** `chemview.js corePart()`: `2 Σ_{c<nc} C_c C_cᵀ` in a Float64Array once per solve, subtracted from D in f64 on the way
  to the density kind's f32 matrix; `nc = min(coreCount(chemAtoms(preset)), nocc)` — S1's `coreCount` (He for Li–Ne, Ne for Na–Ar, Ar for
  K–Zn, Ar+3d¹⁰ for Ga–Kr). VALENCE off is the old road (the f32 source returned untouched). For every record I drew, the core block is
  the lowest `nc` levels with a wide gap to the first valence level (e.g. tryptophan −11.008 / −1.373 Eh, Cr(CO)₆ −2.305 / −1.411,
  B₁₂H₁₂²⁻ −7.016 / −0.637).
- **Lysine 47.8 → 1.60 — reproduced three ways.** Through the app (`app-checks.mjs`, Firefox, 64³): max ρ **47.7856 → 1.60114**
  (29.84×), 0 solver calls; PySCF over EVERY voxel centre of the same 64³ grid (`KV_N=64 KV_STRIDE=2 KV_FULLMAX=1 ~/bin/scipython -I
  .tmp/verify/pyscf_voxels.py …`): **47.78568 → 1.601141**; the app's texels against PySCF at 35,840 voxels: 3.7e-4 (off) and 6.1e-4 (on)
  of max. Benzene 7.3721 → 0.32702 (22.5×), as reported. My page's VALENCE matrices for 12 records against PySCF's independently built
  D_val: ≤ 7.4e-4 of max.
- **Water integrates to 8.** In node with the app's own solver (`node .tmp/verify/valence_trace.mjs`): Tr(D S) = 10.000000000000 and
  **Tr(D_val S) = 8.000000000000** for H₂O in STO-3G and in 6-31+G\*; NH₃, HF → 8, C₂H₄ → 12; PySCF's overlap gives N − 2·core for all 13
  records (e.g. lysine 80 → 60, Cr(CO)₆ 108 → 66). Through the app's own grid (64³, half 7.43): ∫ρ = 9.596 (the O 1s cusp is
  under-sampled at 64³) and **∫ρ_val = 7.974** — the valence is smooth enough for the grid.
- **The seat and the row** (`app-checks.mjs`, Firefox 1400 × 900): the VIEW row is **256 px in all three views, `scrollWidth =
  clientWidth = 256`, no overflow**. DENSITY: VIEW seg 174.5 px + VALENCE 78.5 px (ends at 256.0), the ORBITAL dial `display: none`;
  ORBITAL and Δρ: the dial 62 px (ends at 239.5), VALENCE `display: none`. The row is 5 px SHORTER under DENSITY (106.6 vs 111.7 px:
  the switch is 44 px tall, the dial 64.7). No wider — but no slack (NOTE N8).
- **The scope.** `valence` lives in `instruments.chem` (the presentation `save()` returns), which `docs/STATE-SCOPES.md` lists as
  PROJECT; `lab/new-project.lambdawaves.json` carries `valence: false` (NEW resets it); `tests/new-project.test.mjs`'s PREF set does
  not hold it; REPORT wave 181 says "PROJECT state like CORE". One scope, said (NOTE N10).
- **The stale comments are gone.** `grep -n zeroed lab/field.js` → only line 1088, "the max accumulator: zeroed before every dispatch";
  the two `b5eed68` sentences "Firefox zeroes timestamp queries" (l.1430, l.1529) now read "its timestamps are real since 157".
- **`lab/mir/**` and `lab/fonts/**`:** `git diff b5eed68 HEAD -- lab/mir lab/fonts | wc -l` → 0.
- **Lines, recounted** (`node .tmp/verify/linecount.mjs`): `lab/*.js` 36,131 (`cfdd674`) · 36,137 (`b5eed68`) · **36,225 (`a927fc3`,
  +88: field +52, chemview +24, library +7, gpu-boot +3, mathworker +1, orbitalsview +1)** · 36,280 at HEAD (S4b +55: chemview +42,
  library +8, molecules +5). WGSL template source lines in field.js **471 → 496**. Exactly as reported.
- **No release act.** No CHANGELOG, `package.json` or version file in `git diff b5eed68 HEAD`; `git tag --contains b5eed68` → none;
  `git branch -r --contains b5eed68` → none. REPORT waves 178–182 present (REPORT.md l.3916–4003), every number I re-measured matched.
- **NOT RUN: the device-report pair** (`tools/perf/device-report-run.mjs`, 30 s long play at HEAD, against 18.2 → 19.1 fps,
  governor nominal 64³, 0 held).

---

## Findings

### BLOCKER — none.

### SHOULD — none.

### NOTE

- **N1 · "Firefox and Chromium draw the same texels" is not literally true.** REPORT wave 178 ("Firefox 157 and Chromium 153 on Vulkan,
  which draw the same texels") and MEASURE §5 ("Checks (both browsers, identical texels)"). The two browsers' texel arrays differ for
  all 12 densities I hashed (`python3 .tmp/verify/summ_kv.py` → "Firefox vs Chromium density texel SHA: identical 0 differing 12"),
  and the builder's own digests differ (`8ce0fdcb` vs `ff0a77c2`). Each browser is self-consistent and the error figures agree to
  four digits; two WGSL compilers, ulp-level differences. Reword the two sentences.
- **N2 · The C₆₀ record's name and size moved.** The brief and S4c-BUILD cite `lab/library/9520cedc….json`, 140,712 B; at HEAD it is
  `a8166591…`, **145,328 B** (S4b added `input.atomsSha256`, PubChem identifiers and `stem.symmetry`). Its columns, ε and atoms are the
  census's bit for bit (§3). Only the citations are stale.
- **N3 · Screened is not bit-identical to plain** — 4,672 to 306,591 of 884,736 texels differ per orbital, each a one-ulp f16 flip, max
  1.6e-5 of max. Invisible and inside the format's precision; worth saying so rather than "the same".
- **N4 · One voxel's per-voxel figure sits a hair over 2⁻¹⁰.** C₆₀ #181 (LUMO) at my voxels: worst relative error above 1 % of max
  9.82e-4 against 2⁻¹⁰ = 9.77e-4 (its max-normalised figure 5.7e-4). An orbital near its node at 1 % of max carries f32 cancellation
  plus f16 rounding; the harness's C₆₀ bar is max-normalised (≤ 1e-3) and passes. No action unless a per-voxel bar is ever put on C₆₀.
- **N5 · STATES on a record without a CIS ladder says the wrong last word.** C₆₀ (and lysine, so since S4a): after
  `__LW.register.setMode('states'); __LW.states.setOn(true)` the window reads **"MO-REGISTRY off — the state ladder is still being
  solved"** with `pending: 0` — it will never be solved. `statesview.js` `refusal()` (l.282) answers "still being solved" whenever
  `ladder` is null, and the press overwrites the worker's refusal sentence that `fetchLadder` (l.169) put on the status. The refusal
  itself holds (no claim, nothing published; `W.chemStates` throws in §5c). Reproduce: `LW_PORT=8761 GD_PORT=5229 node
  .tmp/verify/app-c60-register.mjs` → `states.refusal`. Pre-existing; a one-line fix for S5 or the cut (keep the worker's refusal
  and answer it from `refusal()`).
- **N6 · MO-REGISTRY's rung refusal leaves the switch ON.** C₆₀, rung 10: `refusal` is the right sentence and nothing is published,
  but `state().on` stays true, the session's selected model stays `orbital-packet`, and the field keeps the last packet; the status says
  "MO-REGISTRY off — …". The same pattern as the old RT-run clause. Cosmetic.
- **N7 · The one per-frame molecular road past 64 AO is the register's packet** (a complex ORBITAL through ORB_WGSL, one dispatch a
  frame: 59 in 3 s for tryptophan; ~4 ms at 96³ for C₆₀'s 300 AO by the timing above). The density through the cap-128 tile is never per
  frame (§2). Expected; written down because the brief asked for every per-frame road.
- **N8 · VALENCE fills the row to the pixel.** 174.5 + 3 + 78.5 = 256.0 of 256: no slack. A longer label (a locale, a font fallback)
  would wrap the row. Within the hand law today.
- **N9 · gpu-boot's catch road drops every limit.** A device that rejects the request (per spec it cannot, for a limit its adapter
  reported) now loses the texture ceilings too, because the third key rides in the same request. My `reject` mode exercised it: the
  field boots, 32 lanes, same texels, `limitsRequested: null`. Pre-existing pattern; a retry without the one key would keep the PNG
  ceiling.
- **N10 · `docs/STATE-SCOPES.md` does not name `valence`.** It is covered by the `instruments` PROJECT row and the new-project gates,
  and REPORT says PROJECT; one line in the table would make it findable.
- **N11 · `s4c-c60-app.mjs`'s "the stage is lit" assert is weak.** `nonBlack 76800` is every pixel of the 320 × 240 read (the stage
  background is not black), so it would pass with no orbital drawn. The screenshot shows the orbital; the harness's C₆₀ section is the
  real check.
- **N12 · Subtract-don't-add not met** (+88 in S4c), as the builder said; a kernel, a record kind and a switch.

---

## The exact next step

For whoever resumes (same worktree and branch): start the server on 8761 (`python3 tools/gate/server.py "$PWD" 8761 &`, record the
pid), check the GPU is idle (`nvidia-smi --query-gpu=pstate,utilization.gpu --format=csv,noheader`), run the device report at HEAD once
(`LW_PORT=8761 GD_PORT=5229 node tools/perf/device-report-run.mjs`, writing to `.tmp/`, never over the committed
`device-report-s4c-*.json`), compare with 18.2 → 19.1 fps / 0 held / governor nominal at 64³, kill the server by pid, and turn the
verdict line above into YES or NO. Optional: the `a927fc3` 1148 reproduction (`git archive a927fc3 lab tools research/release-0.4.0/measure
research/optimization-2026-09-24 | tar -x -C .tmp/root-a927`, serve that root, run its own `digest-lock.mjs` against its own fixture).
