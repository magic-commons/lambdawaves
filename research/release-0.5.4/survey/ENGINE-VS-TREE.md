# ENGINE-VS-TREE — Sol's ENGINE UPGRADE · ROUND 1 against the λWAVES tree

Survey for 0.5.4 PRE-MATH (NACRE). Stamp (`date`): started Sat Oct 10 15:47:32 CDT 2026; written Sat Oct 10 17:04:12 CDT 2026.
Author: an Opus 5.5 survey agent for Claude Sos. **Read-only** on both sides. No Python and no git were run. Node was run read-only twice (to count
`lab/library.json` / `lab/molecules.js` rows and to parse the digest fixtures). This file is the only thing written.

- **Tree** = `.claude/worktrees/sos-s0`, `v0.5.2-alpha — 2026-10-10` (CHANGELOG.md:14). Tree paths below are relative to it.
- **Vault** = `~/Documents/OBSIDIAN/LAMB of WAVES/for CODEX/ENGINE UPGRADE — ROUND 1/`, read in full.
- Source keys:
  - **BP** = `inputs/PILOT_RESEARCH_BLUEPRINT.md`
  - **AM** = `engine_map/architecture map.md`
  - **TL** = `engine_map/test-*.txt`
  - **PA** = `pilot_math/pilot audit.md`
  - **FA** = `pilot_math/focused math audit.md`
  - **RD** = `representation_research/representation decisions.md`
  - **SA** = `representation_research/sources/audit.md`
  - **AR** = `adversarial_review.md`
- Verdicts: **TRUE / FALSE / PARTLY / NOT IN TREE**. "(fact)" marks a tree fact the planners need that the vault does not claim.

**The evidence base comes first.** Sol's file:line anchors point at **I**: the `optimization-2026-09-24` worktree, branch yan-c, HEAD
`a36fc81`. AM:18 describes it as "yan-c README 0.4.0 alpha … last commit 2026-10-08" (also in SOURCE MANIFEST.json). BP read the public
GitHub main (BP:12). The tree today is two releases later: 0.5.0–0.5.2 moved `rack.js` into `lab/shell/` and `lab/windows/`
(CLAUDE.md:304–395). The engine modules Sol cites barely moved. Every re-checked anchor still lands inside, or within 15 lines of, its cited
range (§1.10). Sol's evidence is still a **0.4.0** snapshot: the test walls in TL and `fresh-test-summary.json` were run on I, not on this
tree.

---

## 1. What the vault claims about the engine, and what the tree has

### 1.1 Solvers

| # | Claim (source) | Tree (file:line, quoted) | Verdict |
|---|---|---|---|
| S1 | "The code has exact hydrogen and Gaussian RHF/RT-HF" (BP:12) | `lab/hydrogen.js:3` "STATUS: EXACT ANALYTIC"; `lab/state.js:3-4` "c_a(t) = e^{-iE_a t} c_a(0)"; `lab/scf.js:1` "the restricted Hartree–Fock self-consistent field with Pulay's commutator DIIS"; `lab/density.js:1` "one-particle density-matrix propagation in the Löwdin frame" | TRUE |
| S2 | "DFT is not established as existing production capability by the report" (BP:12); "DFT comes later" (AM:5) | No molecular Kohn–Sham code in `lab/` (grep: DFT/RKS/libxc/B3LYP/PBE, none). One radial atom solver uses local exchange: `lab/atoms.js:1` "Z = 1…36 by Xα(2/3) + the Latter tail", `:4` "Kohn–Sham–Gáspár–Dirac exchange α = 2/3" (the ATOMS window, central field only) | TRUE for molecules. PARTLY overall: an Xα (LDA-exchange) atom exists |
| S3 | "TD-CIS/TDHF existing" (BP:96, E11) | `lab/mathworker.js:180` "chem.drive.init … the TD-CIS drive on the FULL singles space"; `:350` "THE STEP IS STRANG AND EXACTLY UNITARY"; `lab/molecular-register.js:5-8` singlet CIS register "Ψ(t) = b₀ Φ₀ + Σ_K b_K e^{−iω_K t} Ψ_K"; README.md:150 "RPA and TDA spectra, and real-time TDHF" | TRUE |
| S4 | "Existing lab/density.js already implements an exponential predictor/endpoint-average magnus2 and two-step mmut with explicit restart policy" (PA:163) | `lab/density.js:10-12` Magnus-2 "from the SAVED P(t). MMUT: … restarted with a Magnus-2 step"; `:185` `restartEvery = 50`; `:188`/`:193` "0 and null both mean NEVER RESTART" | TRUE |
| S5 | The proposed Cayley propagator `U=(S+iΔtH/2)^{-1}(S−iΔtH/2)` (BP:58-60; PA:110-117) | Not used anywhere. RT-HF steps by "U = exp(−iΔt F̃) = V e^{−iΔt w} V† by one Hermitian diagonalisation" (`lab/density.js:8`; `unitaryOf` :135). TD-CIS uses Strang (mathworker.js:350). Hydrogen is closed form (state.js:3-6) | NOT IN TREE. The tree's propagators are exact exponentials |
| S6 | "Fixed geometry RT keeps S/X/W at initialization (density.js:196–198)" (AM:215). A moving basis needs the connection τ (PA:167-179) | `lab/density.js:196` `const { X, W } = loewdin(S, n);` inside `createRTHF` (:185). No τ/connection term exists in `lab/` | TRUE |
| S7 | SCF kernels: "DIIS / EDIIS / Newton (SCF) with safeguarded damping and linear dependence detection" (BP:73) | CDIIS plus damping only: `lab/scf.js:53` `rhf(basis, { nElectrons, diis = 8, damping = 0, maxIter = 200, tol = 1e-10, …})`. Löwdin refuses only a non-positive metric: `if (e.values[0] <= 0) throw new Error('density: metric is not positive definite')` (`lab/density.js:127`). No conditioning floor | PARTLY (DIIS and damping yes; EDIIS, Newton and linear-dependence handling NOT IN TREE) |
| S8 | "Davidson/LOBPCG or matrix-free Lanczos … dense diagonalization only on small problems" (BP:74) | `lab/linalg.js:1` "the dense real-symmetric kernels the chemistry path lives on: Householder–QL and Cholesky". Benzene RPA is 315×315 dense (:6-7) | NOT IN TREE (iterative solvers) |
| S9 | Electron number is Tr(PS), not Tr P (BP:64; PA:100) | `lab/density.js:6` "N_e = Tr(DS)"; `lab/molecular-field.js:13` "the electron count is Tr(DS), NEVER a voxel sum" | TRUE |
| S10 | "The existing engine lab/density.js calls this coefficient kernel D and its orthonormal kernel P" (PA:104) | `lab/density.js:6-7` "AO density D = Σ_k f_k c_k c_k† … P = W D W" | TRUE. BP:50/64 and RD:41-43 use the opposite letters; see §4 C11 |
| S11 | Hydrogen phase "`ph=dir*Ediag(a)*t` at state.js:153 … f64 re0/im0" (AM:41, AM:56) | `lab/state.js:153` `const ph = dir * this.Ediag(a) * t, c = Math.cos(ph), s = Math.sin(ph);`; `:63-64` `this.re0 = new Float64Array(N); // anchor c(0), real` | TRUE |
| S12 | CIS energies are relative to the ground state (AM:58) | `lab/molecular-register.js:138` `energies = new Map([[GROUND, 0]])`; `:169` `const ph = -energies.get(c.key) * t` | TRUE |
| S13 | Time: "`clock.t+=dt` (clock.js:35,38) can lose dt" at huge t (AM:68; FA:18) | `lab/clock.js:14` `this.t = 0; // logical time, a.u.`; `:35` `this.t += dt;`; `:38` `step(dt) { this.t += dt; …}`. The only BigInt phase is `frontier.clockAutocorr` (`lab/frontier.js:636`, "exact in BigInt" :634) | TRUE |

### 1.2 Basis sets

| # | Claim (source) | Tree | Verdict |
|---|---|---|---|
| B1 | "Cartesian normalized AO basis" (AM:43). D1 says "Use exact current STO-3G data with `cart=True`" (RD:151) | `lab/md.js:178` "md: this engine is Cartesian only; spherical 6-31+G* is a different model"; `:3-5` "every contracted Cartesian component renormalised to unit self-overlap, so PySCF's cart=True matrices are R_d M R_d" | TRUE, with a caveat: any PySCF cart=True oracle needs the R_d transform for d shells |
| B2 | Basis inventory (not claimed by the vault) | `lab/vendor/bse/index.json`: STO-3G v1 (2018-06-19), Z = 1–36; 6-31+G* v1, Z = 1, 6, 7, 8, 9. `lab/rhf-molecule.js:17` `BASIS_FILES = { 'sto-3g': …, '6-31+g-star': … }`. `lab/molecules.js:514` `BASIS_631 = { elements: [1, 6, 7, 8, 9], maxAO: 46 }` | (fact) |
| B3 | "md.basisFrom() hashes basis/component/element/primitive/coefficient decimal strings at 200–205, excluding atom coordinates and charge". The witness moved an H by 0.01 bohr and got the same hash (AM:181; `fresh-identity-screen-witness.json`) | `lab/md.js:200-205` builds `canon` = "basis … kind cartesian … components … Z l e[…] c[…]", then `hash: sha256Hex(canon)`. No coordinates are included | TRUE |
| B4 | Which bases the library holds (not claimed) | `lab/library.json` has 38 rows, every one `basis: "sto-3g"` (node count). There are no 6-31+G* records | (fact) |

### 1.3 Integrals (ERIs, Boys)

| # | Claim (source) | Tree | Verdict |
|---|---|---|---|
| I1 | Gaussian integral engine (BP:16 proposes Libint as an oracle) | `lab/md.js:1` "McMurchie–Davidson Cartesian Gaussian integrals for molecules, l ≤ 2 by design"; `:7` "Boys: Kummer seed + downward below t = 44, F_0 seed + upward above it"; `:57-60` a Taylor grid for the ERI loop's Boys. No Libint | (fact) / Libint NOT IN TREE |
| I2 | "Integral Schwarz screening already exists (md.js:255–266, 355–435) with TAU_PRIM 1e−15, TAU_SCHWARZ 1e−15, TAU_PQ 1e−17. It is not a rendering threshold" (AM:201) | `lab/md.js:266` `const TAU_PRIM = 1e-15, TAU_SCHWARZ = 1e-15, TAU_PQ = 1e-17;`; `:264` "Worst case 1.8e-14 + 1e-15 + 8.1e-15 < 3e-14" | TRUE |
| I3 | "CPU ERI storage is 8n⁴ bytes (md.js:400)" (AM:211) | `lab/md.js:400` `const n = basis.n, n2 = n * n, g = new Float64Array(n2 * n2);` | TRUE |
| I4 | "RHF Fock is n⁴ (scf.js:39–40)" (AM:211) | `lab/scf.js:39-40` a quadruple loop over `eri[((i * n + j) * n + k) * n + l]` | TRUE |
| I5 | "RI/density fitting or Cholesky ERI compression" (BP:71) | none (grep) | NOT IN TREE |
| I6 | The dipole integrals the observable bounds need (RD:53) | `lab/md.js:449-457` `integrals()` returns `{ S, T, V, h, X, Y, Z, eri, … }`. But `oneElectron` is **not exported** (`function oneElectron` at :210), and `integrals()` always builds the ERIs (:455) | PARTLY (S, T and M exist only through the full-ERI road) |

### 1.4 Field reconstruction path: what, in what precision, where the error budget sits

| # | Claim (source) | Tree | Verdict |
|---|---|---|---|
| F1 | "hydrogen f64 anchors → … f32 mode packing → f32 WGSL → rgba16float → PRESENT" (AM:30-36) | `lab/field.js:713` `const PACK = new Float32Array(MAX_MODES * MODE_BYTES / 4);` (packModes); `:32` and `:176` `texture_storage_3d<rgba16float, write>`; `:160` "f32 THROUGHOUT"; `lab/gpu-boot.js:42` requests only `maxComputeWorkgroupStorageSize`, never the `shader-f16` feature | TRUE |
| F2 | What the GPU reconstructs: hydrogen ψ from the closed-form tables; molecular orbital ψ, density √ρ, signed Δρ (AM:46; README:72-73) | `lab/field.js:8-11` "The basis is GENERATED in the compute kernel from the closed-form polynomial tables"; `:145-152` "A density writes (√ρ, 0) … An orbital writes (ψ, 0) … A COMPLEX ORBITAL … the full (ψ_re, ψ_im) … A SIGNED MATRIX (kind 3)" | TRUE |
| F3 | The error budget: "f16 … is inadequate for scientific ground-state certification" (BP:18); "GPU evaluates f32 and stores rgba16float" (AM:213) | `lab/field.js:161-164` "the density at a nucleus is f32-accurate to about 1e-6 relative. The rgba16float texel is the coarser number by three orders (an 11-bit mantissa on √ρ ⇒ ≈ 1e-3 relative on ρ) and it, not this sum, sets the tolerance any gate on a read-back voxel may ask for." | TRUE. The budget sits at the texel, and the tree says so |
| F4 | "DIFF must keep f64-before-upload subtraction" (AM:213; RD:17) | `lab/chemview.js:537-538` "ΔD = Re D(t) − D_ref is formed HERE, in f64, and uploaded ONCE as a signed matrix"; `lab/field.js:154-155` "The difference is formed in f64 on the CPU and quantised ONCE." | TRUE |
| F5 | "AO re/im output arrays are Float32Array, and repeated += stores round after each contribution" (AM:60; AR:48) | `lab/orbitalsview.js:270` `re = new Float32Array(n); im = new Float32Array(n);`; `:274` `const th = phase - sol.eps[k] * t, …` | TRUE |
| F6 | "I has density 128 AO and orbital 768 AO, but ≤256 shells/2048 distinct primitives/8192 weights/32 primitives per group; l≤2. Tier128 uses 64 lanes/32KiB if granted, else 32 lanes/16KiB" (AM:209) | `lab/field.js:742` `MAX_MOL_AO = 128`; `:743` `MOL_LIMITS = { shells: 256, prims: 2048, weights: 8192, ao: 768, prim: 32 }`; `:748-749` `MOL_CAPS = [16, 40, 64, MAX_MOL_AO]`, `MOL_ORB_FROM = 64`; `:874` lanes `… ? 64 : 32` by the granted workgroup storage | TRUE |
| F7 | The ORB_WGSL screen "bounds the widest exponential, not full contracted AO"; `supportRadius` "is not wired into that kernel". Witness: AO ≈ 1.28e-10 just past the cut (AM:203) | `lab/field.js:754` `const SCREEN = Math.log(1e10); // ORB_WGSL skips a shell where e^{−α_min r²} < 1e-10`; `lab/molecular-field.js:119` `supportRadius` is CPU-only | TRUE |
| F8 | Texel layout (not claimed) | Every kernel writes `vec4<f32>(re, im, 0.0, 0.0)` (field.js:134, 240, 277). `fieldDigest` hashes only `u[v * 4]` and `u[v * 4 + 1]` (field.js:1441-1444) | (fact): channels .b/.a are spare and **not hashed** |
| F9 | "the volume sum is not a quadrature" (AM:213) | `lab/molecular-field.js:14-15` "A 96³ midpoint sum of ρ … gives 9.662692 electrons, 3.4 % short"; TL `test-molecular-field.txt` "not a quadrature" | TRUE |
| F10 | "mixed precision (scientific CPU f64, WGSL f32 calculations, f16 view storage only where tolerance permits)" (BP:79; RD:143) | That is the current practice: F1 plus f64 state (state.js:63-64; molecular-register.js:139-140; library `$f64`) | TRUE (already done) |
| F11 | "deterministic shader code generation … shell contraction loop specialization; … fuse AO evaluation and P contraction" (BP:79) | `molWgsl(cap, wg)` generates one module per AO tier (field.js:166-167, :875); the χ tile evaluates AOs and contracts the matrix in one kernel (:744-747); `specRenderWGSL(view, style)` (:551) specialises present pipelines | PARTLY (tier templates and fusion exist; there is no typed basis IR) |

### 1.5 The digest lock as the published contract

| # | Claim (source) | Tree | Verdict |
|---|---|---|---|
| L1 | "Preserve the repository digest-lock chain … do not re-record locks simply to declare success" (AM:239) | `tools/perf/digest-lock.mjs:13-15` "`--check --query gastab=0` compares 860 values, and the same plus `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` 1004, both 0/0". NACRE.md: "THE LOCK … (860 + 1004 values · 0/0) is the engine's published contract" | TRUE |
| L2 | E18 "reproduce digest lock" on device matrices (BP:105); publication threshold "(c) independent hardware reproducibility" (BP:133) | `tools/perf/digest-lock.mjs:42` "Machine-specific (adapter, driver, browser build): a fixture recorded here is compared only on this machine." | PARTLY. The lock is a same-machine regression contract, not a cross-device oracle |
| L3 | What it locks (not claimed) | `:17-24`: states × {64, 96, 128} → `fieldDigest`, readPixels at 320×240 and 1024×640, and the packModes bytes. The states include benzene (36 AO), lysine (64 AO, "the widest tier, full") and lysine's HOMO, all opened from records | (fact) |
| L4 | "≤64 golden digests" (AM:225) | `lab/field.js:746-747` "An ORBITAL past 64 AOs takes ORB_WGSL, no tile … at ≤ 64 it keeps its tile — what the digest lock recorded" | PARTLY. Nothing past 64 AO is locked; ORB_WGSL and the cap-128 tier have no digest |

### 1.6 Workers

| # | Claim (source) | Tree | Verdict |
|---|---|---|---|
| W1 | "worker-pool.js:55–59 describes Worker-less-only chemistry fallback, but actual r.error also invokes local fallback" (AM:227) | `lab/worker-pool.js:55` "a fallback only a Worker-less browser reaches"; `:59` `return chemW.call(msg).then((r) => r && !r.error ? pluck(r) : local());`. A refusal travels as `{ refused }` (`lab/mathworker.js:152`), so it does **not** fall back; an `error` or a timeout **does** run the work on the frame thread | TRUE |
| W2 | "a timeout does not stop the worker (worker-pool.js:16–20)" (AM:227) | `:16` "A TIMED-OUT JOB IS STILL RUNNING. The worker is FIFO and cannot drop a job"; chem ceiling `makeWorker('chem', 300000)` (:49) | TRUE |
| W3 | "Worker `keyOf` includes ordered atoms/basis name/charge (mathworker.js:200)" (AM:183) | `lab/mathworker.js:197` `keyOf = (basis, charge, atoms) => JSON.stringify([basis, charge, atoms.map((a) => [a.Z, a.x, a.y, a.z])])` | TRUE, but the line is 197. The key carries no solver options or model |
| W4 | Queues (not claimed) | `lab/worker-pool.js:43,49`: `bow`, `period`, `cards`, `chem`. Every CHEM op is listed at mathworker.js:82 | (fact) |

### 1.7 Molecular session, library records, the register

| # | Claim (source) | Tree | Verdict |
|---|---|---|---|
| M1 | "tdhf>states>orbital-packet>ground; product `{kind,matrix,view,hash,solution}`" (AM:45) | `lab/molecular-session.js:42` `MODEL_RANK = { tdhf: 0, states: 1, 'orbital-packet': 2, ground: 3 }`; `:45` `PRODUCT_KINDS = ['orbital', 'density', 'signed']` | TRUE |
| M2 | "Session adopt checks basis hash+solveSeq, despite the header calling it basis+geometry (25–27, 103–109); publish permits p.solution≥session.solution at 137" (AM:183) | The header at `:24` says "Every product carries the molecule's basis+geometry hash". `:137` `if (p.hash !== mol.hash \|\| !(p.solution >= solution))`. The hash is `hash: b.hash` (`lab/rhf-molecule.js:246`), the md.js:200-205 hash, which carries no coordinates. chemview adopts with `sol.hash` (`lab/chemview.js:482-484`) | TRUE |
| M3 | "content-addressed f64 library records and caps" (AM:48) | `lab/library.js:1-2` "DEVICE CONTENT: content-addressed (lab/library/<sha-256>.json), never in a project"; `:5` "`schema: 1`; a reader ignores members it does not know"; `:16` "a big array is { $f64 \| $i32: base64 } (little-endian, exact)"; `:14` `atomsKey` | TRUE |
| M4 | "f64 exact state record incl MMUT history, no derived caches" (AM:48) | `lab/molecule-state.js:5` "NO DERIVED CACHES"; `:31` `SCHEMA = 1`; `:34` `CODES = ['E_SHAPE', 'E_BASIS_HASH', 'E_MMUT_HISTORY', 'E_TRACE']`. A project saves the presentation only: `lab/chemview.js:756` "save() returns THE PRESENTATION ONLY, not lab/molecule-state.js's record"; the project holds `{ id, hash, nameKey }` (:771) | TRUE (the record exists for links, fixtures and export; projects do not carry it) |
| M5 | "benzene opens from its 1230 KB record in 6.4 ms … bit for bit" (TL `test-library.txt`) | The `lab/library.json` C6H6 row has `bytes: 1259886` (= 1230 KiB) and all four caps true. Lysine (64 AO): `states`/`tdhf` false. C60 (300 AO): orbitals only | TRUE (size). The timing was not re-run |
| M6 | "the existing occupied columns Cocc and occupations 2 give an exact factorization without a new eigensolve" (RD:47) | Full records carry ε, C and D at nAO (library.js:46). `lab/library.js:33` "a FRONTIER record (C₆₀) carries ε and a few whole columns of C — `ground.cols`, ascending — and nothing else". No record carries S or T | PARTLY. Cocc exists for full records, not for frontier ones |
| M7 | The library's size, as the README states it (README:150 "54 library entries with 52 enabled") | `lab/molecules.js`: 54 MOLECULES, 52 SOLVABLE, with CuH and ZnH₂ disabled (node count). `lab/library.json`: 38 record rows | TRUE for the catalogue. The library proper has 38 records; see §4 C8 |

### 1.8 The defect the report admits (continuity/current, REPORT 2026-09-18)

| # | Claim (source) | Tree | Verdict |
|---|---|---|---|
| D1 | "One report entry explicitly describes severe approximate continuity-current defects (see §2026-09-18)" (BP:12) | `REPORT.md:2546` "MEASURED and not hidden: continuity is violated at order one in STO-3G (1.19), and the integrated current is parallel to the dipole's rate of change but 0.15 of its size for benzene. FLOW's sense is exact; its magnitude is qualitative in a minimal basis" | TRUE. "Severe" is BP's word; the report says "order one" |
| D2 | E06 "responds to a documented magnitude defect in λWAVES' current FLOW at small AO basis" (BP:89) | `REPORT.md:2563` "MEASURED, and against the expectation recorded that morning: the larger basis does not close FLOW's magnitude gap (ratios 0.57–1.54 in STO-3G, 0.60–1.43 in 6-31+G\*) … It is the TDA's own length and velocity gauge disagreement." | PARTLY. The report traces the magnitude gap to gauge disagreement, not to basis size (§4 C1) |
| D3 | Fresh numbers: ratio 0.149, continuity 1.1938, TDHF 0.807 (AM:117-119; TL `test-molecular-flow.txt`) | REPORT.md:2546 gives 0.15 and 1.19 (the same quantities, rounded). `lab/molecular-flow.js:12-13` "VIOLATED in a finite one; the defect in STO-3G is measured … and reported, never asserted as an identity". UI caption: `lab/windows/readouts.js:87` "sense exact, magnitude qualitative in STO-3G" | TRUE |
| D4 | FLOW "requires −Im(engine AO kernel). `tests/molecular-flow.test.mjs` explicitly checks this conversion" (PA:106; AR:23) | `tests/molecular-flow.test.mjs:111-112` "card hands the flow evaluator −Im D … (With the imaginary part un-negated the cosine below is −1.)"; `REPORT.md:2560` "negated on the way in because `density.js` keeps the transpose-conjugate convention" | TRUE |
| D5 | FLOW "has no vector potential A, gauge χ, covariant derivative or GIAO/spinor representation" (AM:101) | `lab/molecular-flow.js:8` "j(r) = … Σ_pq Im D_pq χ_p ∇χ_q" only; `lab/state.js:24-25` "ZEEMAN … orbital only — this register has no spin" | TRUE |

### 1.9 Performance numbers the vault repeats

| # | Claim (source) | Tree | Verdict |
|---|---|---|---|
| P1 | "S4c archive reports 87AO density ≈19–21 ms, 120AO ≈42–46 ms and C60 orbital ≈3.6–4 ms at 96³ on RTX3070" (AM:237) | `research/release-0.4.0/measure/MEASURE.md`, Chromium / Firefox: tryptophan 87 AO "19.6 ms / 21.5 ms" (:246; 32 lanes 19.4–21.6, :247); C₂₀H₂₀ 120 AO "43.0 ms / 48.2 ms" (:248); C₆₀ HOMO screened "3.62 ms / 4.08 ms", through the field 3.65 / 4.17 (:251-252) | 87 AO PARTLY (Firefox is 21.5); 120 AO FALSE at the top (48.2 > 46); C₆₀ TRUE |
| P2 | Firefox completion timing is coarse; use 2.5-second throughput batches (RD:132; AM:233) | `docs/NOTES-FOR-AGENTS.md:38-40` "batches of at least 2.5 s … `__LW.field.throughput({ targetMs: 2500 })`"; `lab/field.js:1486` | TRUE |
| P3 | Hydrogen figures (the tree's own, dated 2026-09-24; not repeated by Sol) | `README.md:75-79`: present 3.25 ms (phase) / 2.10 ms (density); reconstruct 0.1 ms; 91 labels 1.43 ms @96³, 3.40 ms @128³; "GPU voxels agree with the CPU closed form to 2e-5" | (fact) |
| P4 | Suite walls (AM:243-253; `fresh-test-summary.json`, run on I at 2026-10-09 06:32 UTC) | not re-run | NOT VERIFIED (§5) |

### 1.10 Anchor drift, I → sos-s0 (re-checked)

These hold inside the cited range:
- `lab/state.js:153`
- `lab/clock.js:35,38`
- `lab/md.js:200-205, 266, 400`
- `lab/scf.js:39-40`
- `lab/density.js:6, 135-149, 196`
- `lab/molecular-register.js:138, 169`
- `lab/molecular-session.js:42, 103-109, 137`
- `lab/field.js:413` (phase hue), `1103` (hueShift), `742-796`, `872-887`, `1486`, `1582`
- `lab/orbitalsview.js:270-275`
- `lab/frontier.js:386, 415, 618, 636`
- `lab/wigner.js:139-155`
- `lab/molecular-field.js:14-19, 119`
- `lab/molecular-flow.js:5-16`
- `lab/worker-pool.js:16-20, 55-59`
- `lab/hydrogen.js:104, 170`
- `tests/molecular-flow.test.mjs:111`
- `tests/frontier.test.mjs:230-231`

These moved:
- `mathworker.js` `keyOf`: cited at 200, now 197.
- `frontier.js` `shellCharacter`: cited at 346–365, defined at 360.
- `applyShellRotors`: cited at 587–611, defined at 605.

The main-checkout (**M**) anchors, such as "M field.js:672–679" at AM:209, were not re-checked (§5).

---

## 2. Sol's representation decisions (RD) — does the tree already do each one?

| # | Decision (RD line) | Tree today | Seam needed (file, function) |
|---|---|---|---|
| R1 | Keep analytic screened GTO reconstruction as the exact finite-model reference and fallback (RD:7, :25) | **DOES.** `molWgsl` χ tile, tiers 16/40/64/128, plus `ORB_WGSL` (field.js:260-287); the CPU f64 oracle `evaluator` (molecular-field.js:59) is checked against PySCF (TL) | none |
| R2 | An AO contraction planner: dense/sparse AO matrix vs occupied/natural-orbital factors (RD:7, :26) | **PARTLY.** A two-road planner exists: `molRoad()` picks a tier's χ tile or ORB_WGSL (field.js:1079-1080). There is no factor road | `setMoleculeMatrix` kind list (field.js:1543-1545); `struct MP` kind (field.js:170, kinds 0–3); `molRoad`; `PRODUCT_KINDS` (molecular-session.js:45); producers `pushMatrix` (chemview.js:488) and `product` (molecular-register.js:225) |
| R3 | Exact S-whitened factorization Q = S^½PS^½ = UλU†, φ_k = S^-½u_k; natural occupations (RD:41-47) | **COULD.** density.js already forms the orthonormal kernel `P = W D W` (:7) and has `hermitianEigen` (:62) and `loewdin` (:125). Cocc is in every full record | A new pure function (in density.js or a new module) plus a worker op. Frontier records (library.js:33) cannot supply Cocc |
| R4 | A signed ΔP is never clamped; difference-first f64 (RD:47, :190) | **DOES for the upload** (chemview.js:537-548; molecular-register.js:18-19 "ONE real symmetric matrix: the `signed` product"). Signed **factor** diagonalization is NOT IN TREE | as R2 |
| R5 | Truncation bounds 1–6: trace tail, ‖∇φ‖² = 2c†Tc, pointwise ‖E‖·‖S^-½χ(r)‖² (RD:49-58) | **COULD for live solves**: the worker's integrals carry S and T (md.js:455-457). **CANNOT for record-only molecules** without recomputing integrals: records hold no S/T, `oneElectron` is unexported (md.js:210), and `integrals()` always builds the ERIs (:455) | A one-electron-only export from md.js plus a worker op |
| R6 | Exact symmetry voxel-orbit reuse under H = stabilizer(field) ∩ lattice group (RD:27, :68-70) | **CANNOT without a new seam.** names.js has groups, operations and characters (`operations` :142, `frameOf` :176, `nameOrbitals` :259, `characters` :436), but only for NAMING. The field has no scatter pass and no symmetry key | A new scatter kernel after `encodeMolecule` (field.js:1086); names.js exports the AO operation matrices; an invalidation key beyond `generation`/`refValid` |
| R7 | Conservative brick screening and cache invalidation, writing the same texture (RD:28, :76) | **PARTLY.** A per-shell widest-exponential cut (field.js:754, ORB_WGSL only); `supportRadius` is CPU-only (molecular-field.js:119); the field already keeps `molDirty`, `generation` and `refValid` | `packMolecule` (field.js:757) + a brick metadata buffer + a kernel branch. A changed cut moves pixels, which means a lock re-bake with a written reason |
| R8 | Adaptive polynomial bricks, then wavelets (RD:29, :78-80) | **NOT IN TREE** | A new CPU encoder module + WGSL decode into the same `outTex` |
| R9 | POD / reduced geometry field bases (RD:30, :84) | **NOT IN TREE.** Records are per geometry (`atomsSha256`, library.js:14, :28) | An offline tool in `tools/` + new record members |
| R10 | Fourier masks only as controls or wave-lab tools (RD:31, :82) | **NOT IN TREE** (no FFT in `lab/`) | A standalone experiment; no engine seam |
| R11 | f32 baseline, f16 storage only, no f16 arithmetic, f64 on the CPU (RD:143) | **DOES** (F1, F10) | none |
| R12 | A two-tier error ledger: an f32 scientific buffer before half storage, plus the presentation texture (RD:112) | **PARTLY.** Only the presentation tier exists; every readback decodes f16 (`sampleVoxel` :1414, `fieldDigest` :1429, `readGrid` :1461) | A new f32 storage binding beside `outTex` (field.js:32 COMPUTE_WGSL, :176 MOL_HEAD), or the spare `.b/.a` (F8) |
| R13 | The matched-accuracy matrix R01–R09, honest total cost, ≥ 20 repeats with bootstrap CI (RD:90-132) | **PARTLY.** `moleculeThroughput` (field.js:1582), `throughput` (:1486), `tools/perf/s4c-kernel.mjs`, `tools/perf/device-report.js`. MEASURE.md uses the median of 5 batches (:238) | tools only; no `lab/` change |
| R14 | Ship behind an internal opt-in flag with the default digest preserved (RD:138) | **Precedent exists**: `?gastab=0` (rack.js:846) and the lock's `--query` (digest-lock.mjs:6) | A query flag read in `rack.js` / the controller |
| R15 | DFT oracle gates D0–D4, run out of process (RD:149-161) | **COULD, with no engine change.** PySCF fixtures already ship (`tests/fixtures/h2o-field.json`, `research/release-0.4.0/measure/c60-voxels-pyscf.json`, `tools/perf/c60-voxels.py`); the R_d convention (md.js:4-5) must travel with them | a fixture manifest only |
| R16 | The smallest proposal: "R01 exact ground-state factor kernel + baseline selector/instrumentation, preserving `setMoleculeMatrix` and the output texture contract, behind a disabled internal flag" (RD:196) | **NOT IN TREE** | R2's seam. With the flag off, the lock is unchanged by construction |
| R17 | "One complex-orbital current fixture and explicit P↔D adapter" (RD:45, :181) | **DOES** (tests/molecular-flow.test.mjs:64 checks the sign, :111 the TDHF boundary) | none (the adapter is code, not a declared field; see PM-3) |

---

## 3. The PRE-MATH list — what must exist BEFORE the math programme's results can land

Sizes: S ≈ under 50 lines or docs only; M ≈ one module or kernel branch; L ≈ cross-cutting. **Budget**: `lab/*.js` + shell + windows ≤ 27,943
lines at the 0.5.2 cut, +1 % per release (NACRE.md). That gives roughly 280 lines of engine headroom for all PRE-MATH code, unless something
is subtracted.

| ID | Candidate row (one line) | Files touched | Size | Already there? |
|---|---|---|---|---|
| PM-1 | **Certified-quantity envelope** `{ value, bound, norm, method, oracle, precision, units }` for any stored scalar or array. Carried as extra members under library schema 1, which ignores unknown members (library.js:5) | `lab/library.js` (validate/decode), `tools/orbital-library.mjs`, `lab/library/*.json` | M | PARTLY: exact `$f64` arrays, `schema: 1`, `--check` |
| PM-2 | **Physical identity key** separate from the basis hash: atomsSha256 + basis hash + charge + model/solver options (AM:187-195), carried by the session stamp and the worker key | `lab/molecular-session.js:24,103-109,137`; `lab/chemview.js:482-484`; `lab/mathworker.js:197`; `lab/rhf-molecule.js:246` | S–M | PARTLY: `atomsKey` exists (library.js:14); the session stamp is basis-only |
| PM-3 | **Density-matrix convention record**: AO kernel vs orthonormal, the FLOW transpose (−Im), spin-summed f, and the energy reference, written into each product or record | `lab/density.js:6-7`, `lab/molecular-flow.js:5`, `lab/molecular-register.js:138`, `lab/orbitalsview.js:274` | S | PARTLY: tests hold the sign; the data does not say it |
| PM-4 | **Derivative format** (∇ρ, ∇ψ, j). The CPU has f64 `aoGrad` and the flow `at`; nothing stores or certifies a derivative, and the texel has none | `lab/molecular-field.js:133`, `lab/molecular-flow.js`; optionally field.js `.b/.a` | M | CPU yes, storage no |
| PM-5 | **Projector format**: isotypic Q_α as an AO-basis matrix built from names.js groups. Today they are labels only | `lab/names.js:142,259,436` | M | NOT THERE |
| PM-6 | **Phase/time descriptor (PHASECLOCK)**: t is one f64 Number (clock.js:14,35,38). The BigInt pattern lives only in `clockAutocorr` (frontier.js:636) | `lab/clock.js`, `lab/state.js`, `lab/molecular-register.js`, `lab/orbitalsview.js`, the film's time law (`lab/render-exact.js`) | L | NOT THERE |
| PM-7 | **f32 scientific reconstruction buffer**, or use of the un-hashed `.b/.a` channels, for numeric oracles without moving the lock | `lab/field.js` (COMPUTE_WGSL :32, MOL_HEAD :176, readbacks :1414-1461) | M–L | NOT THERE |
| PM-8 | **ORBITAL packet: accumulate in f64, cast once to f32** | `lab/orbitalsview.js:270-275` | S | NOT THERE. May move packet pixels; packets are not among the lock's states (L3) |
| PM-9 | **Overlap conditioning reported** (min eig S, cond S) with a declared refusal floor | `lab/density.js:125-131` (already returns `eigenvalues`), `lab/rhf-molecule.js` | S | PARTLY: refuses only ≤ 0 |
| PM-10 | **One-electron-only integrals entry** (S, T, dipole M without ERIs) for record-only molecules and the R5 bounds | `lab/md.js:210, 453-458` | S | NOT THERE |
| PM-11 | **A numeric GPU-vs-CPU field law** with the declared tolerance (≈ 1e-3 relative on ρ, field.js:162-164), as a standing browser test rather than a perf probe | `tests/*.browser-test.mjs` (new), `tools/perf/s4c-kernel.mjs`, field.js `sampleVoxel`/`readGrid` | M | PARTLY: MEASURE.md:254 checks 4.56e-4 / 3.69e-4 of max √ρ; README:79 gives 2e-5 for hydrogen |
| PM-12 | **Oracle-fixture manifest**: PySCF version, cart=True, the R_d transform, geometry in bohr, tolerances | `tests/fixtures/*`, `research/release-0.4.0/measure/*.json`, md.js:3-5 | S | PARTLY |
| PM-13 | **New math oracles as node suites** (no `lab/` change): angular q-band through `coaxialPolynomial`; huge-time phase against `clockAutocorr`; a graph current/gauge model (its own model); continuity residual as a tracked metric | `tests/` (new), `lab/frontier.js:415,636`, `tests/molecular-flow.test.mjs` | S each | PARTLY: continuity is MEASURED, not gated; huge clocks are tested only for structured t (frontier.test.mjs:230) |
| PM-14 | **Lock scope ruling**: keep 860 + 1004 at 0/0; say whether a math row may re-bake; record that the lock is same-machine only | `tools/perf/digest-lock.mjs`, the fixtures | S | THERE (the ruling is open) |
| PM-15 | **Byte laws stay**: serialize bytes, `new-project --check`, `orbital-library --check`, the molecule-state save→restore byte identity (TL `test-molecule-state.txt`) | `tools/serialize-bytes.mjs`, `tools/new-project.mjs`, `tools/orbital-library.mjs`, `tests/molecule-state.test.mjs` | — | THERE |
| PM-16 | **Worker boundary: a math op refuses** (`{ refused }`) and never falls back to the frame thread on error or timeout | `lab/worker-pool.js:56-59`, `lab/mathworker.js:152,195` | S | NOT THERE (error → local fallback) |
| PM-17 | **Cancel/epoch for long math jobs** (a timed-out job keeps running) | `lab/worker-pool.js:14-36` | M | NOT THERE |
| PM-18 | **Worker key carries the model and solver options** | `lab/mathworker.js:197` | S | NOT THERE |
| PM-19 | **Library schema decision**: stay on schema 1 with extension members, or move to schema 2 with a migration. Changed record bytes change the content hash, so projects fall back to `nameKey` (chemview.js:310, :771-779) | `lab/library.js`, `lab/chemview.js` | M | decision open |
| PM-20 | **6-31+G\* records** (none today), if basis convergence is part of the math | `tools/orbital-library.mjs`, `lab/library/` | M–L | NOT THERE |
| PM-21 | **Factor product kind** (rank-k) as the representation seam for R01/R16 | `lab/field.js:1543,170,1080`, `lab/molecular-session.js:45`, the producers | M | NOT THERE |
| PM-22 | **Certified screen**: wire a contracted-AO (supportRadius-style) bound into the ORB_WGSL cut | `lab/field.js:754-790`, `lab/molecular-field.js:119` | S–M | PARTLY. It moves pixels past 64 AO (not locked, L4) |
| PM-23 | **Header and comment truths**: session "basis+geometry" and its 3 vs 4 ranks; the worker-pool fallback comment; the `RENDER_CAP` comment | `lab/molecular-session.js:14-16,24`; `lab/worker-pool.js:55`; `lab/state.js:58` | S | docs only |
| PM-24 | **Register representation, declared**: hydrogen keeps f64 anchors with an absolute E_n; STATES is relative to the ground state; the ORBITAL packet uses absolute ε·t. One energy-reference rule per producer before any PHASECLOCK result lands | `lab/state.js:63-67`, `lab/molecular-register.js:138,169`, `lab/orbitalsview.js:274` | S | PARTLY (true in code, undeclared) |

---

## 4. Contradictions (quoted)

- **C1 — Cause of the FLOW defect.**
  - BP:89 says E06 "responds to a documented magnitude defect in λWAVES' current FLOW **at small AO basis**".
  - REPORT.md:2563 says "the larger basis does not close FLOW's magnitude gap (ratios 0.57–1.54 in STO-3G, 0.60–1.43 in 6-31+G\*) … It is the TDA's own length and velocity gauge disagreement."
- **C2 — The 120-AO timing.**
  - AM:237 says "120AO≈42–46ms".
  - MEASURE.md:248 says "C₂₀H₂₀ (120 AO) density, cap-128 tile | 43.0 ms | 48.2 ms" (Chromium | Firefox).
  - For 87 AO, AM's "≈19–21" vs MEASURE.md:246-247's 19.4–21.6 is a minor understatement.
- **C3 — Lock portability.**
  - BP:105 (E18) asks to "reproduce digest lock" on a device matrix, and BP:133 requires "independent hardware reproducibility".
  - digest-lock.mjs:42 says "a fixture recorded here is compared only on this machine."
- **C4 — Session stamp (tree-internal; Sol caught it, confirmed).**
  - molecular-session.js:24 says "Every product carries the molecule's basis+geometry hash".
  - The hash is `b.hash` (rhf-molecule.js:246), and md.js:200-205 hashes no coordinates. Sol's witness: "basisHashEqualForMovedGeometry": true.
- **C5 — Session ranks (tree-internal).**
  - The header, molecular-session.js:14-16, lists three: "tdhf rank 0 … orbital-packet rank 1 … ground rank 2".
  - The code, `:42`, has four: `{ tdhf: 0, states: 1, 'orbital-packet': 2, ground: 3 }`.
- **C6 — Worker fallback (tree-internal).**
  - worker-pool.js:55 says "a fallback only a Worker-less browser reaches".
  - worker-pool.js:59 says `r && !r.error ? pluck(r) : local()`.
- **C7 — Clocks (tree-internal).**
  - README.md:82 says "a transport with four clocks".
  - CLAUDE.md:243 says "There is ONE clock (R-B1)", and `lab/clock.js:44-53` has `onePlay`.
- **C8 — "Library" counts (tree-internal wording).**
  - README.md:150 says "54 library entries with 52 enabled". That count is the `lab/molecules.js` catalogue (54 / 52 solvable).
  - THE LIBRARY (`lab/library.js`, "the fourth storage class") holds the 38 rows of `lab/library.json`, all STO-3G.
- **C9 — Which fixture is the lock (tree-internal).**
  - docs/NOTES-FOR-AGENTS.md:98-100 says `--check --fixture research/optimization-2026-09-24/digest-lock-base-w125.json`.
  - CLAUDE.md:315-317 says "THE LOCK's 1004-value fixture (`research/release-0.4.0/measure/digest-lock-s4a.json`) … is checked WITH `--query gastab=0`".
  - NACRE.md says "860 + 1004".
- **C10 — Mode capacity comment (tree-internal).**
  - state.js:58 says `RENDER_CAP = 91; // the WGSL kernel's mode-array capacity`.
  - field.js:23 says `MAX_MODES = 320; // the whole 91-state register fits (a gas packet populates every m)`.
- **C11 — Letters for the density kernels.**
  - BP:50/64 and RD:41-43 call the AO kernel **P** (and RD's whitened Q = S^½PS^½).
  - The tree calls the AO kernel **D** and the orthonormal one **P** (density.js:6-7). PA:104 flags this.
  - FLOW adds a third convention: D_pq = ⟨a†_p a_q⟩, the transpose (molecular-flow.js:5).
- **C12 — FLOW caption scope (tree-internal).**
  - readouts.js:87 says "magnitude qualitative in STO-3G".
  - REPORT.md:2563 says the gap persists in 6-31+G\*.
- **C13 — Shader specialisation.**
  - BP:79 lists "deterministic shader code generation from typed basis IR" as future work.
  - The tree already generates per-tier WGSL and specialised present pipelines (field.js:166-167, :551, :875). These are templates, not an IR.
- **C14 — Evidence vintage.**
  - AM:18 pins I as "yan-c README 0.4.0 alpha … last commit 2026-10-08".
  - The tree is "`v0.5.2-alpha` — 2026-10-10" (CHANGELOG.md:14). No engine claim above is falsified by the gap, but every Sol line number is a 0.4.0 line number.

---

## 5. What I could not verify

- **The main checkout (M).** Not re-checked: README "0.3.2 alpha", HEAD `28fe4457…`, "M field.js:672–679" 64-AO ceiling (AM:17, AM:209), and AM:26's main→I diff claims. All are outside this tree, and no git was allowed.
- **The public repo and deployment.** BP:12 cites GitHub `magic-commons/lambdawaves` main and its REPORT.md. AM:19 says the deployment was not fingerprinted. I did not fetch either.
- **The OpenAI catalogue.** BP:13's "719 manuscripts, 372 families, not the previously repeated 722", and every family row (BP:24-43; RD:167-173), is outside the tree. Not verified.
- **ChronusQ licensing.** BP:123 ("GPL v2 … review exact file notices") is not verified. The tree states only that "No code or asset of theirs is redistributed here" (NOTICE:108-110), and it calls scf.js/density.js/absorb.js "PORT n of the ChronusQ map" (their line 1 each; REPORT.md:2473 "the mathematics comes in as headless modules with proofs").
- **Test runs and timings.** I re-ran nothing: not the TL suite walls, not the library 6.4 ms open, not the MEASURE.md GPU timings, not the README hydrogen timings. Every number in §1.9 is quoted from files.
- **The Python pilot results.** The pilot and extended results (BP:135-141; PA:23-35; `*_results.json`) were not re-run (no Python), and they are synthetic CPU toys by their own account (BP:143).
- **The presenter's use of `.b/.a`.** I verified that the kernels write `(re, im, 0, 0)` and that `fieldDigest` hashes only re and im. I did not read RENDER_WGSL in full, so whether `readPixels` would move if `.b/.a` were filled is NOT VERIFIED. Read it before using PM-7's channel option.
- **Packet pixels.** Whether PM-8's f64 accumulation would move any locked digest: the state list in digest-lock.mjs:19-22 names no MO-REGISTRY packet, but a `--check` run is the only proof.
