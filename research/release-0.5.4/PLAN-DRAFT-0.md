# λWAVES 0.5.4 PRE-MATH — PLAN DRAFT 0 (Claude Sos / Fable 5.1, 2026-10-10 17:14 CDT) — the pre-draft for Sonnet's review

The round: NACRE (`NACRE.md`): this pre-draft → `REVIEW-SONNET-0.md` → DRAFT 1 → Opus@high audit → DRAFT 2 → Sonnet@high junior → DRAFT 3 → Josh → `PLAN.md`.
The ground: the four surveys (`survey/CODEX-ROUNDS.md`, `survey/ENGINE-VS-TREE.md`, `survey/PILOT-AUDIT.md`, `survey/CHAT-AND-ASKS.md`, all 2026-10-10) and
the tree at `v0.5.2-alpha` (`1970b1c`; 27,943 lines of `lab/*.js` + shell + windows; 38 library records, all STO-3G, 12 MB on disk outside the precache).
0.5.4 builds AFTER 0.5.3 (the minor update, its own plan); every line number below is a 0.5.2 line and the 0.5.3 builder may move a few.

## 0 · One sentence, and the reading of Josh's goal

**0.5.4 is the CONTRACT LAYER: the identity, convention, precision, worker and provenance seams that must exist before any result of Sol's programme
(or the pilot's verification of it) can land in λWAVES without being a hope — and ONE thing Josh sees: a STATUS face on the rack that tells the truth about
what is on stage.** It builds no mathematics, runs no new chemistry and moves no digest.

Josh's goal, as I read it across the chat, the spec and the vault (the NACRE question asks for this reading): λWAVES is "a real-time mathematical
performance instrument" (spec S:16) whose 1.0.0 ships beside a research paper (C:1854). Sol's 26 rounds are "the mathematics needed to trust its
outputs" (R18 map) — a monograph of CONTRACTS (state identity, error budgets, FLOW floor and containment, derivative transport), with the physical
programme PAUSED at Round 14 on Josh's word and every round since repeating "require explicit resumption" (CODEX-ROUNDS §2). The pilot Opus checks the
mathematics (PILOT-AUDIT: no violation of η0/η1/η2 in 1,800 + 108 trials; a 2-D flow tube that reaches 14 % of a turn). Nothing in the corpus claims
λWAVES implements any of it; every engine contract is "a requirement for a future adapter" (CODEX-ROUNDS warning 2). So the instrument's next step is
not a new solver. It is the seams an adapter would plug into, built so the picture never stutters and the lock never moves. That is PRE-MATH.

Three readings I take and the plan rests on (Sonnet, Opus: strike them if wrong):
1. **The paper's contribution is "observable-certified reconstruction" (C:3999–4017), not a speedup.** Every speedup claim in the corpus is explicitly
   non-claimed (C22, "do not promote bound ratios to speed ratios"). So PRE-MATH optimises for TRUTH SURFACES (what is computed, in which precision, with
   which oracle), and leaves speed as the standing law: the main-thread pair ≤ 3.536 ms/s, 60 fps, no frame-thread fallback.
2. **The physical programme stays paused.** This release adds no DFT, no ChronusQ, no 6-31+G* chemistry, no new solve (spec S:2310 and R21 "Do not treat
   Chapter 4 as permission to resume chemistry"). Josh's C:1854 "ChronusQ … we should definitely go forward with it" is a 0.6.x+ question (§7 Q2).
3. **The user-facing truth is the spec's S:42:** "Every visible motion should have a named state, evolution law, observable, observer, and approximation
   status." Today the approximation status is in comments and tests, never on the glass. The rack window can carry it in ONE row.

## 1 · What the surveys measured (the facts the rows stand on)

1. **Identity is basis-only.** The session stamp says "basis+geometry" (`molecular-session.js:24`) but hashes `b.hash` (`rhf-molecule.js:246`), and
   `md.js:200-205` hashes no coordinates: Sol's witness moved an H by 0.01 bohr and got the same hash. The worker key `keyOf` (`mathworker.js:197`)
   carries atoms/basis/charge and no solver options or model. (ENGINE-VS-TREE B3, M2, W3, C4.)
2. **Conventions live in code and tests, not in data.** The AO kernel is D and the orthonormal one P (`density.js:6-7`; Sol's blueprint uses the opposite
   letters); FLOW takes −Im D (`molecular-flow.js:5`, the transpose, pinned by `tests/molecular-flow.test.mjs:111`); hydrogen keeps absolute E_n, STATES is
   relative to the ground, the ORBITAL packet uses absolute ε·t (PM-24). Chapter 5: "A basis name alone does not resolve those choices."
3. **The precision path is f64 → f32 pack → f32 WGSL → rgba16float, and the tree says the texel is the budget** (`field.js:161-164`, ≈1e-3 relative on ρ).
   Two leaks named by Sol and confirmed: the ORBITAL packet accumulates in Float32 (`orbitalsview.js:270-274`, "every += rounds to f32"); the logical clock is
   one f64 `t += dt` (`clock.js:35,38`) that stops advancing at 2⁵³ (Chapter 10 §10.5). The texel's .b/.a channels are written as zero and NOT hashed by
   `fieldDigest` (`field.js:1441-1444`); whether `readPixels` would move if they were filled is NOT VERIFIED (ENGINE-VS-TREE §5).
4. **The worker boundary falls back to the frame thread.** `worker-pool.js:59`: an `error` or a timeout reruns the chem job on the frame thread (the
   comment at `:55` says only a Worker-less browser reaches it); a REFUSAL (`{ refused }`, `mathworker.js:150,194`) does not. A timed-out job keeps running
   (`:16`, LA6). This is a stutter by design for any long maths op — and the one place PRE-MATH touches the frame budget.
5. **The lock is same-machine** (`digest-lock.mjs:42`) and locks ≤ 64 AO tile states (field.js:746-747); ORB_WGSL (C₆₀) and the cap-128 tier have no digest.
   Sol's blueprint wants "independent hardware reproducibility" (BP:133). Those are different instruments; the plan must say which is which.
6. **Library records are schema 1, "a reader ignores members it does not know"** (`library.js:5`), content-addressed by sha-256 of the bytes; a project holds
   `{ id, hash, nameKey }` and falls back to `nameKey` when the hash has moved on (`chemview.js:310,771-773`). Records hold ε, C, D and the caps
   (`library.json`: orbitals/density/states/tdhf) — no S, no T, no oracle, no bound. `oneElectron` is unexported and `integrals()` always builds ERIs
   (`md.js:210,455`).
7. **FLOW: a hard floor** `RHO_FLOOR = 1e-7` (`molecular-flow.js:25,39,52`) — R7: "the density rejection branch is discontinuous at the floor, so a shared
   floor margin is required"; the continuity residual (1.19) and the current ratio (0.15) are MEASURED in REPORT.md:2546 and tracked nowhere; the caption
   says "qualitative in STO-3G" (`readouts.js:87`) while REPORT.md:2563 says the larger basis does not close the gap (the TDA's gauge disagreement).
8. **The pilot needs what the app does not have:** AO Hessians on interval boxes, a retained tail charge q, M = S + ηK with a certified inverse, 30-digit
   intervals (PILOT-AUDIT §4). That is an OFFLINE tool's shape, never a per-frame path. The app's contribution is an EXPORT: the record, S, T, the
   conventions and the identity, in a form her Python can read.
9. **Tree-internal contradictions, nine** (ENGINE-VS-TREE §4 C4–C12): session ranks 3 vs 4; the worker-pool comment; "four clocks" (README:82) vs ONE
   (CLAUDE.md:243); "54 library entries" (README:150) vs 38 records; three fixtures named as the lock (NOTES:98-100 vs CLAUDE.md:315-317); RENDER_CAP 91 vs
   MAX_MODES 320; the FLOW caption scope; the D/P letters; the 120-AO timing. Docs rows, no engine.
10. **The budget.** 27,943 lines at 0.5.2; 0.5.3's cap is 28,222; 0.5.4's is **28,504** (+1 %). ≈ 280 lines of headroom for everything below unless a row
    subtracts. `tools/` and `tests/` are outside the law.

## 2 · The rows

Each row: a builder, `BRIEF-P<n>.md`, `P<n>-BUILD.md` with "what Josh will see" (most rows: nothing, and the BUILD says so — the truth surface it adds is
named instead), the owning suites, THE LOCK where `lab/` moves, `node tests/pwa.test.mjs --write` after every `lab/` edit. Sizes S ≤ 2 h, M ≈ 4 h, L ≈ 8 h.

| # | row | what | closer | size · model |
|---|---|---|---|---|
| **P0 TRUTH IN THE TREE** | the nine contradictions fixed in place (comments and docs: `molecular-session.js:14-16,24`, `worker-pool.js:55`, `state.js:58`, README:82,150, NOTES:98-100, `readouts.js:87` → "qualitative in STO-3G and 6-31+G*"); each producer's energy reference and kernel letter DECLARED in its module header (PM-24); the lock's "same-machine" sentence in CLAUDE.md and NOTES; nothing else | node gate; `grep` of each line in the BUILD | S · Haiku (xhigh) |
| **P1 THE IDENTITY KEY** | a physical identity `{ atoms: atomsSha256, basis: b.hash, charge, model, options }` built once (`rhf-molecule.js:246`) and carried by the session stamp (`molecular-session.js:24,103-109,137`), the worker key (`mathworker.js:197`) and chemview's adopt check (`chemview.js:482-484`); a product with the same basis hash and a different geometry is REFUSED, not adopted. Projects keep `{ id, hash, nameKey }` unchanged (bytes 11/11). | `molecular-session.test`, `rhf-molecule.test`, `library.test`, the moved-H witness as a node case; serialize-bytes 11/11; `new-project --check` | S–M · Opus |
| **P2 CONVENTIONS IN DATA** | one `convention` object, built in ONE place (`lab/convention.js`, ≤ 40 lines, or a static in `density.js`): `{ kernel: 'D=Σf cc†', orthonormal: 'P=WDW', current: '-Im D (transpose)', spin: 'summed f=2', energyRef: per producer, cartesian: 'unit self-overlap, R_d' }`; attached to every product (`PRODUCT_KINDS` producers) and to the P5 export; the existing sign tests read it instead of a literal | `molecular-flow.test:64,111`, `density.test`, a new `convention.test` that the object matches the code (the −Im sign by a complex fixture) | S · Sonnet |
| **P3 THE CERTIFICATE SIDECAR** | certified quantities for a record live in a SIDECAR `lab/library/<sha>.cert.json` keyed by the record's hash — the record's bytes and hash do not move, so no project falls back to `nameKey` (ruling R3). Members: `{ quantity, value, bound, norm, method, oracle: { name, version, cart, Rd, units }, precision, status: 'UNKNOWN' \| 'MEASURED' \| 'CERTIFIED' }`. `tools/orbital-library.mjs` writes one from the PySCF fixtures that exist (h2o-field, c60-voxels) and UNKNOWN for the rest ("unknown derivative error remains unknown", R15); `--check` proves the sidecars byte-exact; `library.js` learns to read a sidecar (one function, lazy, never on the frame path) | `library.test` (+ sidecar cases), `orbital-library --check`, precache ≤ 8 MiB (sidecars are small; the records are outside the precache) | M · Opus |
| **P4 CAPABILITY METADATA + THE STATUS FACE** | per record and per live solve, a `capability` record (Chapter 12 §12.5): `{ orbitals, density, states, tdhf, derivatives: false, online: [...], cached: [...], invalidates: 'identity', precision: 'f64→f32→f16 texel ≈1e-3 ρ', status }` built from the caps that already exist (`library.json` caps + `MODEL_RANK`); **what Josh sees: ONE readout row on the MOLECULES card (ruling R8), "STATUS"**, e.g. `STO-3G · RHF record · f16 field ±1e-3 · ESTABLISHED` / `… · 6-31+G* live · UNKNOWN` / `C₆₀ · 8 orbitals only · EXPERIMENTAL`; three words from Sol's provenance registry (C:5179–5203: Established physics / Verified computation / Experimental research) and spec S:42. Also `LW.molecules.capability()` (one facade member, `--write` with the reason) | `molecule-head`, `chem`, `lw-facade` 1/1 (+1 member), `settings-probe` 0/6 (no new key), a hit-probe of the row | M · Opus (after P1, P3) |
| **P5 THE EXPORT FOR THE PILOT** | `tools/export-record.mjs <id>`: the record (ε, C, D), S and T (from P8's one-electron entry), the identity (P1), the convention (P2), the capability (P4) and the sidecar (P3) in ONE JSON her Python reads — the app's side of "an adapter". No `lab/` change beyond P8. A README in `research/release-0.5.4/export/` says what each member is and what is NOT there (Hessians, intervals, q, M). | the tool runs for water, benzene, C₆₀; a node test parses the output | S · Sonnet |
| **P6 THE WORKER REFUSES** | the frame budget row: a chem job's `error` or timeout becomes a VISIBLE refusal (the status line, the kit's `note`), never a frame-thread rerun — `worker-pool.js:59` `local()` only when `!chemW.ok` (Worker-less browser), the comment at `:55` made true; a cancel epoch for long jobs (`worker-pool.js:14-36`: a superseded job's reply is dropped, the worker restarted after a declared ceiling instead of left running, LA6 rewritten); the key carries `options` (with P1). Measured: the main-thread pair before/after with a forced timeout (Δ ≤ 0 is the claim: a timeout that today costs a frame-thread solve costs nothing) | `worker-pool.test`, `mathworker.test`, the ms/s pair (≤ 3.536 and Δ ≤ 0 under a forced timeout), `history`, `new-project.browser` | M · Opus |
| **P7 PRECISION DISCIPLINE** | (a) the ORBITAL packet accumulates in f64 and casts once (`orbitalsview.js:270-274`; PM-8) — THE LOCK proves packets are outside it, or the row stops and reports; (b) the clock horizon DECLARED: `clock.js` refuses to advance past a declared `T_MAX` (2⁵³ · dt, computed once) with a visible sentence, and a node test shows `t += dt` losing dt beyond it (the PHASECLOCK descriptor itself is L and deferred, ruling R9); (c) **a standing GPU-vs-CPU field law**: `tests/field-law.browser-test.mjs` samples N voxels of hydrogen (2e-5 vs the closed form, README:79) and of water's density (≤ 1e-3 relative on ρ at the texel, `field.js:162`) through `sampleVoxel`/`readGrid` against the f64 oracle (`molecular-field.js:59`) — the tolerance the tree already declares, as a gate rather than a perf note (PM-11) | THE LOCK 860 + 1004 · 0/0 after (a); `clock.test`; the new field law 2/2; `register` | S + S + M · Opus |
| **P8 ONE-ELECTRON ENTRY + CONDITIONING** | `md.js` exports `oneElectron(basis)` → `{ S, T, V, M }` without ERIs (`:210`, `:453-458` unchanged for the full road); a worker op `chem.oneElectron`; `loewdin` reports `{ minEig, cond }` and REFUSES below a declared floor (today only ≤ 0, `density.js:127`) with the sentence in the capability status (R9: "Record overlap conditioning … never extrapolate blindly across a lost response gap") | `md.test` (+ S/T equal to the full road's), `density.test` (+ the floor), `library.test` | S · Sonnet |
| **P9 FLOW'S FLOOR** | a SHARED floor margin: the velocity is scaled to zero continuously over `[RHO_FLOOR, 2·RHO_FLOOR]` instead of cut (`molecular-flow.js:25,39,52`; R7's discontinuity); the continuity residual and the current/dipole ratio become a TRACKED node metric (`tests/molecular-flow.test.mjs` prints and pins them with a tolerance, not a target); the frozen-frame step error is named in the module header as not covered (R21 §4.9). No containment, no tube, no Hessian — those are the pilot's (PILOT-AUDIT §4). FLOW tracers are presentation, not in the lock's state list (digest-lock.mjs:19-22): the BUILD proves it with `--check`. | `molecular-flow.test` (+ the tracked metrics), THE LOCK, `flow` browser suite if one exists (else the probe) | S–M · Opus (with P7) |
| **P10 THE ORACLE MANIFEST + NODE ORACLES** | `tests/fixtures/MANIFEST.md` (+ a JSON twin): for every PySCF fixture its PySCF version, `cart=True`, the R_d transform (`md.js:3-5`), geometry in bohr, tolerances, the generating script (`tools/perf/c60-voxels.py`); THREE new node suites, no `lab/` change (PM-13): huge-time phase against `clockAutocorr` (BigInt, `frontier.js:636`) for unstructured t; the angular q-band through `coaxialPolynomial` (`frontier.js:415`); the continuity residual (with P9) | the three suites green; `bash test.sh node` | S · Sonnet |
| **P11 THE LOCK'S SCOPE** | the ruling written (R7): 860 + 1004 stay at 0/0; a math row NEVER re-bakes; the lock is same-machine; past 64 AO nothing is locked and the plan says so; `tools/perf/device-report.js` gains a DIGEST MATRIX report (adapter, driver, browser, the 860 values as a JSON row) so two machines can be COMPARED without either being a lock — the honest answer to BP E18. `tools/` only. | the report runs on the healthy rig; `digest-lock --check` ×2 unchanged | S · Sonnet |
| **P12 THE FACTOR SEAM** (ruling R5) | the ONE representation seam the programme asks for (R2/R16/R21: "R01 exact ground-state factor kernel … behind a disabled internal flag"): a `factor` product kind (rank-k B, ρ = ‖B†χ‖², B = √2·C_occ for closed shells) through `setMoleculeMatrix` (`field.js:1543-1545`), `MP.kind` (`:170`), `PRODUCT_KINDS` (`molecular-session.js:45`), `molRoad` (`:1080`) and a kernel branch, behind `?factor=1` (the `?gastab=0` precedent, `rack.js:846`). Flag off: the lock is unchanged by construction. Flag on: the BUILD compares the factor road's digest to the dense road's within the texel tolerance for water, benzene and lysine, and reports the kernel time (a NUMBER, not a speedup claim). ≈ +120 lines; the row names what it subtracts first (candidates: the dead `paletteview` rules are 0.5.3's; the legacy `transport` CSS is 0.5.3's; here: `frontier.js`'s unused exports, measured) | THE LOCK 860 + 1004 · 0/0 with the flag off; the digest comparison with it on; `render-exact`; `frame-occlusion`; the ms/s pair | M–L · Opus · **DEFERRABLE to 0.5.5** |
| **P13 6-31+G\* RECORDS** (ruling R6) | three records only — water, formaldehyde, benzene (the FLOW gauge report's own molecules, REPORT.md:2563) — written by `tools/orbital-library.mjs` with sidecars, so basis convergence is a thing the app can SHOW (two STATUS rows differing in one word) and the pilot can export. N:30 "Don't try to go for too many variations of the same molecule" is honoured by the count. Bytes: outside the precache; the index row count 38 → 41 | `library.test`, `orbital-library --check`, `library.json` row count, the MOLECULES select | M · Opus · **Josh's word (Q3)** |
| **P-V** | one fresh Opus verifier: THE LOCK 860 + 1004 · 0/0; serialize-bytes 11/11 vs 0.5.3's cut; `new-project --check`; `settings-probe` 0/6; `lw-facade` (+1); the field law; the ms/s pair with a forced worker timeout; the whole browser estate + the boot suite alone; the line law 28,504; CLAUDE.md against the tree; the export parsed by a 10-line Python reader (`-I`) — FIT / NOT FIT → a fix round → the local cut on Josh's word | — | — |

## 3 · The gates
**G-N** node gate 0 after every row. **G-L** THE LOCK at every `lab/` row (P1, P2, P4, P6, P7, P8, P9, P12) — never re-baked (R7). **G-B** serialize-bytes 11/11
for every row (no project key changes in this release; the identity and the capability are derived, never stored in a project). **G-P** `settings-probe` 0/6
(no PREFERENCE key this release). **G-W** `lw-facade` 1/1 + the one member (P4). **G-F** the field law (P7c) from P7 on. **G-T** the main-thread pair ≤ 3.536 ms/s
and Δ ≤ 0 for P6 under a forced timeout; no row touches the frame path but P6, P7a and P12 (flag on). **G-Lines** ≤ 28,504 at the cut; P12 pays for itself or
waits. **G-Bytes** precache ≤ 8 MiB (`pwa.test.mjs:302`). **G-Export** P5's JSON round-trips through a reader that shares no code with the engine (spec S:2096).

## 4 · Order and the dial
P0 alone first (docs; a day's Haiku). Then **PAIR 1** {P1 + P2 + P8 — the identity/convention/one-electron builder, session + md + density} ∥ {P6 — the worker
boundary, worker-pool + mathworker}; **PAIR 2** {P3 + P4 + P5 — the sidecar, the capability and the export; library + chemview + tools} ∥ {P7 + P9 — precision and
FLOW; orbitalsview + clock + molecular-flow + a new test}; **PAIR 3** {P10 + P11 — tests and tools only} ∥ {P12 if ruled in}; P13 if ruled in, after PAIR 2.
Then P-V, a fix round, the cut. Opus for P1, P3, P4, P6, P7, P9, P12, P13; Sonnet for P2, P5, P8, P10, P11; Haiku for P0. ≈ 7 builders ≈ 36 builder-hours ≈
2 relay days without P12/P13.

## 5 · What Josh will see
One STATUS row on MOLECULES that says what the stage is showing and how far to trust it (Established / Verified / Experimental, the basis, the record kind,
the field's precision); a worker that says "refused: …" instead of freezing the frame; FLOW that fades at the floor instead of snapping; a clock that says
when it can no longer advance; three 6-31+G* molecules if he rules them in; and a folder `research/release-0.5.4/export/` with water, benzene and C₆₀ as
JSON the pilot can read. Everything else is below the glass: the identity, the conventions, the sidecars, the field law, the tracked FLOW numbers.

## 6 · What is not claimed
No mathematics is implemented or judged (the pilot's). No DFT, ChronusQ, WASM, compiler, kernel registry, EIGENMORPH, sieve, quasicrystal or synthesizer
instrument (all 0.6.x+ by Sol's own ladder, C:5411–5422, and by the pause). No containment, Hessian, interval or tube (PILOT-AUDIT §4: an offline tool's
shape). No PHASECLOCK rewrite (R9). No re-bake. No speedup claim. No cross-device lock (a matrix report instead). No 6-31+G* beyond three records, and
none without Josh's word.

## 7 · RULINGS TAKEN AS DEFAULTS (Josh may flip any; the build starts on his word)
- **R1 the name** — Josh's. Offered: "Contract Layer", "Truth Seams", "Pre Math".
- **R2 the pause holds** — no new chemistry, no new solver, no DFT; the app's side of the programme is seams and an export.
- **R3 sidecars, not schema 2** — certificates and capability live beside the record keyed by its hash; record bytes, hashes and projects do not move.
- **R4 the worker refuses** — an error or a timeout is a visible refusal, never a frame-thread rerun; LA6 rewritten; the Worker-less browser keeps its road.
- **R5 the factor seam** — built flag-off in this release IF the line ledger pays for it; otherwise the first row of 0.5.5. Default: BUILD (it is the one seam
  every later representation row needs, and flag-off it cannot move a pixel).
- **R6 6-31+G\*** — three records (water, formaldehyde, benzene), on Josh's word only.
- **R7 the lock** — stays, same-machine, never re-baked by a math row; a digest MATRIX report for comparing machines.
- **R8 the STATUS face** — one readout row on the MOLECULES card (below VIEW, above `.mol-more`), three words + the basis + the precision; not a window, not a
  SETTINGS key.
- **R9 PHASECLOCK** — deferred (L); this release declares the horizon and refuses past it.
- **R10 the DFT/ChronusQ tension** — the spec's S:2310 ("do not attempt to compete") and S:1507 ("external high-accuracy engines … rather than pretending to
  replace them") stand until Josh rules; ChronusQ is a REFERENCE the export is shaped for, not a port.

## 8 · Questions only Josh (or the pilot) can answer (the defaults stand meanwhile)
- **Q1** the pilot: what does she want FROM the app — the record + S/T + conventions as JSON (P5's default), or something else (voxel samples? the AO
  evaluator's gradients at points?). One line from her sets P5's shape.
- **Q2** DFT/ChronusQ: still "definitely go forward" (C:1854) — and if so, 0.6.0 as Sol's ladder says, or inside this plan?
- **Q3** 6-31+G\*: three records now, or none until the physical programme resumes?
- **Q4** the factor seam (P12): build it flag-off now, or make it 0.5.5's first row?
- **Q5** the STATUS face: on the MOLECULES card (R8), in the molecule head on the stage, or under SETTINGS › DISPLAY as a switch?
- **Q6** the name.

## 9 · Josh's words (verbatim, for the record)
> A pilot Opus 5.5 started work on verifying GPT-6.1 Sol's work. She will continue working on the math on our behalf. However, feel free to do a round, but not
> like what the skill.md says but rather the 'nacre ultrathink planning' method with the Claude model family (it was an old prompt somewhere).
> The folder is called 'Lamb of Waves' in Documents > Obsidian
