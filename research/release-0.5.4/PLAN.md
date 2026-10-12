# λWAVES 0.5.4 PRE-MATH — PLAN (Claude Sos / Fable 5.1; DRAFT 3 of 2026-10-10 18:01 made the plan by Josh's word 2026-10-11, §J)

The round, done as you asked ("the 'nacre ultrathink planning' method with the Claude model family"): my pre-draft `ed00aa2` → Sonnet 5.5's review `e92c98c` → DRAFT 1
`a1508a6` → Opus 5.5 @ high's audit `bdc7ab5` (39 marks, all taken) → DRAFT 2 `8e3377b` → Sonnet 5.5 @ high's junior pass `1affbb3` (six suggestions, all taken) →
**this DRAFT 3** → your word → `PLAN.md`. The ground: four read-only surveys of the Lamb of Waves folder and the tree (`survey/`). It builds AFTER 0.5.3 "Rack Tune".

## A · In one paragraph, for you
Sol's 26 rounds are "the mathematics needed to trust its outputs": a monograph of CONTRACTS (what state, which basis, which convention, what precision, which oracle,
which bound), with the physical programme paused at Round 14 on your word and every round since saying it needs explicit resumption. The pilot Opus is checking that
mathematics (no violation of Sol's three bounds in 1,908 trials; a 2-D flow tube that reaches 14 % of a turn). Nothing in the corpus claims λWAVES implements any of it;
every engine contract is "a requirement for a future adapter". So 0.5.4 is not a new solver. **It is THE CONTRACT LAYER: the seams an adapter plugs into — identity and
conventions as data, an honest status for every record, a worker that refuses instead of stuttering, a standing precision law, and one JSON export the pilot can read —
extending what the tree already owns (every record already carries a PySCF reference energy), changing nothing an existing reader relies on, moving no digest, adding
no call to the frame loop.** And ONE thing you see: a STATUS line that tells the truth about what is on stage. Five builders, about 22 builder-hours, ≈ +100 lines.

## B · What you will see
- **ONE STATUS string, three seats.** At the foot of THE HEAD on every molecule pick (the seat a first-time reader on a phone actually meets), as a row in the
  INFORMATIONAL window beside STAGE FORMULA and ATOM LABELS (live per VIEW; a tap opens the MODEL sheet that defines the words), and as a short suffix in every export
  caption. Two slots, the badges' own grammar: a STATE word — **EXACT** (a closed form), **NUMERICAL** (a solve checked against an oracle), **UNCHECKED** (no oracle) —
  and the PICTURE as a number; VIEW adds its caveat:
  `DENSITY · NUMERICAL · energy agrees with PySCF to 7e-9 Eh · picture good to 0.1 %` · `ORBITAL · NUMERICAL · sign and phase are arbitrary` ·
  `FLOW · NUMERICAL · direction exact, size qualitative` · `1s+2pz · EXACT · picture good to 2e-5` · and on 36 of the 38 records: `· geometry computed, not measured`.
- **MOLECULES that says "refused: …"** when the maths worker fails, instead of silently re-running the solve on the frame thread (a stutter by design today).
- **Three 6-31+G\* molecules** in the library if you say so (water, formaldehyde and one of N₂ / methanol / ethylene — benzene is 126 AOs, over the 46 cap).
- **A folder for the pilot and the paper:** `research/release-0.5.4/export/` with water, benzene and C₆₀ as one JSON each (atoms, every basis function's definition,
  S/T/V/dipole matrices, density and orbitals, PySCF's energy, the conventions, the identity, a `checks` block), a README of what is NOT there, and a generated
  REPRODUCE sheet ending with "the paper may not say" (C₆₀'s check is PySCF's own; 36 geometries unverified; the lock is same-machine; no speed claim).
- Below the glass: the identity and conventions as data, oracle and geometry columns in the catalogue, a GPU-vs-CPU field law and a view-invariance gate as standing
  tests, FLOW's continuity numbers tracked, a claims inventory of every sentence the programme puts in doubt (the five RECONNECTION strings among them).

## C · Your decisions (defaults stand if you say nothing; flip any)
- **R1 the name.** Offered: "Contract Layer", "Truth Seams", "Status Line".
- **R2 the pause holds** — no DFT, no ChronusQ, no new chemistry; the app's side of the programme is seams and an export. (Q2: your "ChronusQ … we should definitely go
  forward with it" vs the spec's "do not attempt to compete" and "use external high-accuracy engines": is that 0.6.0, as Sol's own ladder says?)
- **R3 catalogue rows, not sidecars** — record bytes and hashes do not move; live-only molecules (water, N₂, CH₄ …) get their PySCF oracle attached too, so water never reads UNCHECKED in STO-3G (P-V N4: in 6-31+G* water reads UNCHECKED although the 6-31+G* fixture holds its energy to 1.3e-13 — the `oracles` member is STO-3G only; a 6-31+G* oracles row is OWED to 0.6.0's build plan).
- **R4 the worker refuses** — only after it has answered once (a browser whose module worker never loads keeps its frame-thread road, its only one); respawns once; never re-posts the job that killed it.
- **R5 the factor seam** (Sol's low-rank density road) is 0.5.5's first row — benchmark first, and this ledger does not pay for it.
- **R6 6-31+G\*** — water, formaldehyde + one, on your word (Q3: N₂, methanol or ethylene?).
- **R7 the lock** stays at 860 + 1004 · 0/0, same-machine, never re-baked by a maths row; a device FINGERPRINT report for comparing machines.
- **R8 the face** — the three seats above; nothing above your MOLECULES fold; no window of its own, no settings key, no badge.
- **R9 PHASECLOCK deferred** (a 2⁵³-frame horizon is 4.7 million years of play); the limit is declared, nothing clamps or refuses.
- **R11 the RECONNECTION words stay** until the pilot classifies (Q8: or rename now to "double root"?).
- **R12 the vocabulary** EXACT / NUMERICAL / UNCHECKED is the tree's; the wording is yours. (Q17: UNCHECKED (no oracle) and "unverified" (geometry) are two near words — one rename is yours.)
- **R13 identity is data, never a stamp** — `sol.hash` stays what four readers rely on. **R14 the word's grammar** — two slots, STATE word + PICTURE number.
- **Q7** your DISK / cyclotomy ask ("because the lower orbitals are gonna go nuts") never reached Sol in the chat: hand it to the pilot, to Sol, or keep it for 0.6.x?
- **Q9** the 93-reference archive Sol built ("I want to keep them all"): where does it live, and do you want `docs/REFERENCES.md`?
- **Q12** STATUS as a third row in your INFORMATIONAL window — my reading of "leverage the rack window"; yours to flip. **Q13** for hydrogen too (default yes).
- **Q14** may the export be copied into the pilot's folder (we never write in `for CLAUDE/` ourselves), or does she read `research/release-0.5.4/export/`?
- **Q1 → the pilot, through you** (before the export row is briefed), three lines in plain words: (1) "For water, benzene and C₆₀ the app can give you a file with the
  atoms, the full definition of every basis function (centre, exponents, weights), the overlap, kinetic, nuclear-attraction and dipole matrices, the converged density
  and orbitals, and the energy PySCF gets for the same molecule; all are ordinary 64-bit numbers, not intervals." (2) "It cannot give you derivatives, Hessians, error
  bounds, the omitted tail charge or the shifted metric; if you need any of those, another molecule, or another file shape, say so now." (3) "Please reply with the
  molecules you want, the items you will actually read, and the one density-floor margin and the one overlap-conditioning number your certificates assume."

## D · The facts the rows stand on (measured on the tree; the full list is DRAFT 2 §1 and the audits)
1. Every record already carries `oracle { energy, source, what, delta }` from PySCF (38/38, max |δ| 6.93e-9 Eh) and `input { atomsSha256, basisSha256, charge, multiplicity }`.
   C₆₀'s energy is PySCF's own record (δ = 0 by construction; its field checked at 92 points). **36 of 38** geometries say UNVERIFIED (26 "optimised here", 9 wwPDB / psi4
   computed references, C₆₀ "DRAFT GEOMETRY"); only benzene and TiCl₄ are experimental. Water and the other live-only molecules have no catalogue row, but have a
   PySCF oracle in `tests/fixtures/oracles/sto-3g-v1.json`.
2. `sol.hash` (the basis hash) is FOUR contracts: the session stamp, the worker's reply stamp (`statesview.js:185,338,417`), FLOW's rebuild key, `record()`'s `basis.hash`
   (refused on mismatch with `E_BASIS_HASH`). Identity by geometry is latent, not live: a new geometry is always a new solve; the worker key carries every atom.
3. The precision path is f64 → f32 → f16 texel and the tree says the texel (≈ 1e-3 on ρ) is the budget; the ORBITAL packet accumulates in Float32; the clock is one f64.
4. `worker-pool.js`: an `error` or a timeout after a reply re-runs the chem job on the frame thread (`:59`); `fail()` never respawns; `ok` is lazy; `chemview.js:322` loses a
   `{ refused }` sentence; the chem ceiling is 300 s. Only `chem.ground`, `chem.open` and `chem.rt.fit` do real work on the frame thread when the worker fails.
5. THE MOLECULES FOLD is your ruling (`chemview.js:222`). The INFORMATIONAL window (0.5.3 M9) is closed by default on first run. `stage-text.browser-test:103` pins the
   caption words; `molecule-head.test`'s anchored regexp rejects a fifth head line unless updated. `badges.js:19` b1 is always EXACT; `index.html:129` says "the 91
   hydrogen basis states" while a molecule owns the field. Five RECONNECTION strings (`vortex.js:27,29,30`, `state.js:458` label + note) vs Sol's "an angular double
   root does not necessarily mean that two spatial vortex lines reconnect".
6. The lock (860 + 1004 values) is same-machine, ≤ 64 AO tile states (H₂O, benzene, lysine); no packet, STATES, FLOW or `record()` is in it. `integrals()` always builds
   the ERIs: on C₆₀ that is 8·300⁴ B ≈ 65 GB; `oneElectron` (unexported, `md.js:210`) is the road. 27,943 lines today; the cap is 0.5.3's cut + 1 %.

## E · The rows
Each: `BRIEF-P<n>.md`, `P<n>-BUILD.md` (the truth surface it adds; what you see); its suites; its line budget and what it subtracts, in the BRIEF; THE LOCK where `lab/`
moves; `pwa --write` after every `lab/` edit. Contract modules import no DOM. **THE STUTTER LAW:** nothing a row adds runs in the frame loop except P7a's f64 scratch;
STATUS is built on a solve landing, a VIEW change or a FLOW toggle, and cached — a probe proves it is never called inside a frame.

| # | row | what | closer | Δ · model |
|---|---|---|---|---|
| **P0 TRUTH + THE CLAIMS INVENTORY** | the contradictions fixed in place (`molecular-session.js:15-17,25` — the stamp IS the basis hash + solve sequence; `state.js:58`; README:82,150; NOTES:98-100; `readouts.js:87` → "qualitative in STO-3G and 6-31+G*"; `molecular-flow.js`'s header: the frozen-frame step error and the speed cap not covered); each producer's energy reference and kernel letter in its header; the lock's "same-machine" sentence in CLAUDE.md and NOTES. `CLAIMS.md`: every user-visible sentence the programme puts in doubt — the five RECONNECTION strings (comments in a second column), the FLOW caption, the MODEL sheet, the EXACT badge over a molecule, the geometry count, and that `stageCaption` is silent when STAGE FORMULA is off — LISTED, changed by nobody (R11). | node gate; `pwa --write`; the BUILD greps each line | +5 · Haiku (xhigh) |
| **P1 THE CONTRACT RECORD** (R13) | `identityOf({ atoms, basisHash, charge, multiplicity, model })` → one sha-256, a pure function in `molecule-state.js`; `sol.identity` set beside `sol.key` (`chemview.js:326`); `E_IDENTITY` joins `CODES` for one case (a library record whose atoms do not hash to its `input.atomsSha256`; the pinned `CODES` list in its test updated). No stamp, producer, worker or session line changes. The conventions: ONE exported object in the same file referencing what exists (`BASIS_KIND`, `COMPONENT_ORDER_LINE`, `md.rdOf`, `names.CONVENTION`) + the three undeclared (`kernel`, `current: '−Im D, the transpose'`, `energyRef` per producer). Read by P4 and P5 only; the sign tests keep their literals and assert equality. | `molecule-state.test` (+ identity; the moved-H witness; + equality), `molecular-flow.test:64,111`, `density.test`, `rhf-molecules.test`, `library.test`; THE LOCK; serialize-bytes 11/11; `new-project --check` | +27 · Opus (PAIR A) |
| **P3 ORACLE + STATUS IN THE CATALOGUE** | the rows of `lab/library.json` gain `oracle: { what, delta }`, `geometry` in FOUR classes derived from the generator's `row.source` (`orbital-library.mjs:364,465`) — experimental 2 · optimised-here 26 · computed-reference 9 · draft 1 — and a per-quantity `status` (`MEASURED` / `IMPORTED` / `UNKNOWN`; `derivatives: 'UNKNOWN'` always; C₆₀'s energy IMPORTED); live-only molecules get an `oracles` member (not rows: `molecule-head.test:62` pins 38 rows) from `sto-3g-v1.json`, attached beside `molecules.js:508` (≈ +3). `--check` byte-exact; a `library.test` case per rule and a count test 2 / 26 / 9 / 1. The app writes MEASURED or IMPORTED; **CERTIFIED is a mathematical judgment** — only a pilot-signed, content-addressed member may carry it (none this release). | `library.test`, `orbital-library --check`, precache ≤ 8 MiB; THE LOCK once | +3 · Sonnet @ high (STEP 1) |
| **P4 ONE PURE `statusOf()`, THREE SEATS** (R8, R12, R14) | **One pure, DOM-free, node-importable `statusOf({ owner, record \| sol, view, oracle, geometry })`** in a contract module; `chem.capability()` a thin caller (+ `caps`, `observables`, `derivatives: 'UNKNOWN'`, `limits { lmax 2, Z 36, densityAO 128, orbitalAO 768 }`, `precision`, `identity`, `online / cached / invalidates`); hydrogen (`{ owner: 'hydrogen' }`) in the same function (Q13); every number read from the constant the tests assert (`oracle.delta`, the texel constant `field.js:161-164`, the field law's 2e-5) — never typed twice. **Seats:** (a) THE HEAD's last line — molecule-level only (STATE word, oracle, geometry; the head is held, so no per-VIEW word that could go stale), through `mdText`, a fifth named group in `molecule-head.test`'s regexp; (b) a kit `readout` row in the INFORMATIONAL window — the live per-VIEW caveat, written on change only; a tap opens the MODEL sheet (`badges.js:15` `sheetToggle`), whose lines define the three words (the hydrogen-only sentence at `index.html:129` reworded); fallback if 0.5.3 cuts without the window: the first row inside `.mol-more`; (c) the export caption's short form, appended in `captionOf` (`capture.js:673`) / `film.js:8,10`, not in `stageCaption`. A character budget: every record × view string ≤ ~110 chars, a table test over the 54 molecules × 4 views (every number equals its source constant; a molecule with a fixture oracle is never UNCHECKED; the geometry counts). | `molecule-head` (+ the group); `chem`; the table test; a hit-probe of the row at phone and tablet width; MIR's `stylehash`; `frame-occlusion`; `stage-text` UNCHANGED; `lw-facade` 1/1; `settings-probe` 0/6; the no-frame-call probe; THE LOCK | +45 · Opus (PAIR A, after P1, P3) |
| **P5 THE EXPORT FOR THE PILOT + REPRODUCE** | after her answer to Q1: `tools/export-record.mjs <id>` → the `serializeMolecule` record (from the library record, or a node solve for a live-only molecule) + **the AO table** (per function: centre, (lx,ly,lz), exponents, normalised weights, its label from `basis.order`; `md.js:171-204`) + S, T, V, dipole from `oneElectron` ONLY (`md.js:210` gains `export`; never `integrals()`) + `{ minEig, cond }` of S + the `contract` block (identity + conventions, capability, oracle) + **a `checks` block** recomputed from the exported numbers alone (S symmetric, unit diagonal, Tr(DS) − N_e, ‖DSD − 2D‖) + one sentence: binary64, not intervals, no rigour claimed; C₆₀ as its frontier record (ε, k columns, no D) and says so; conditioning over the 38 records as a baseline, no refusal floor. `export/README.md`: what each member is and **what is NOT there**. **`export/REPRODUCE.md` GENERATED by the tool**: sha-256 of each export, of `library.json`, of every fixture used, the PySCF string, `git rev-parse HEAD^{tree}`, the lock result, the P11 fingerprint; a claims table (one paper sentence → one command → one value); the "may not say" list. | the tool for H₂O, C₆H₆, C₆₀; a node test parses the output; H₂O's S/T/V/M equal `tests/fixtures/h2o-sto3g-integrals.json` under R_d; a 10-line Python reader (`-I`) recomputes the checks and shares no engine code | +0 (one keyword) · Sonnet @ high (PAIR C) |
| **P6 THE WORKER REFUSES** — chem only (R4) | **`answered` is a pool-lifetime flag** (set on the first `onmessage`, never reset by `ensure()` or the respawn): `local()` only while `!answered` (the never-answered browser's only road); after a reply, error or timeout → the refusal travels as **`{ error, refused }`** (both keys, so every existing caller — `chemview.js:322,375,405`, the six `api.solve` reads in `statesview.js` — prints it unedited); `fail()` respawns ONCE, then refuses; the killing job is never re-posted; the refusal says the molecule must be picked again; the header and `:55` made true. No worker-side cancel. **Proof:** a node suite with a fake `spawn`, mock timers and a stub `requestAnimationFrame`: `local()` = 0 under error-after-reply, timeout-after-reply, a dead pool and error-after-respawn; `local()` = 1 for the never-answered worker; ONE browser case on the live error road (`api.solve` with an unknown op, a counting fallback → refused, 0 calls). | the new `worker-pool.test`; the browser case; `history`, `new-project.browser`, `register`; THE LOCK | +20 · Opus (PAIR B) |
| **P7 PRECISION DISCIPLINE** | (a) the ORBITAL packet accumulates in f64, casts once (`orbitalsview.js:270-275`; n ≤ 768 MACs a frame, reused buffers) — the BUILD MEASURES the packet-vs-f64 difference on benzene and C₆₀ (no ESTIMATE; packets are outside the lock, so this is the measurement); (b) `T_MAX` declared in `clock.js`'s header + a node test — no clamp, no sentence; (c) **the standing field law** `tests/field-law.browser-test.mjs`: hydrogen vs the closed form (2e-5) and water's density vs the f64 oracle at the texel's 1e-3; (d) **the view-invariance gate**: exposure, ISO, palette, grid, quality never change `sol.seq`, `chem.workerStat().solverCalls` or Tr(DS). | THE LOCK after (a); `clock.test`; the field law 2/2; the invariance case; the ms/s pair at P-V | +6 · Opus (PAIR B, after P6) |
| **P10 THE ORACLES, DESCRIBED + NODE SUITES** | `tests/fixtures/oracles/README.md` (library-v1 39 molecules; sto-3g-v1; 6-31+g-star-v1 19 at 3e-12; h2o-*.json): PySCF version, `cart=True`, the R_d transform, bohr, tolerances, the generating script. Three node suites, no `lab/` change: huge-time phase vs `clockAutocorr`; the angular q-band through `coaxialPolynomial` — an ANCHOR: a disagreement with Sol's count is reported, never "fixed"; FLOW's continuity residual and current/dipole ratio pinned with a tolerance, not a target (the floor taper waits for the pilot's margin). | the suites; `bash test.sh node` | +0 · Sonnet @ high (PAIR C) |
| **P11 THE LOCK'S SCOPE + THE FINGERPRINT** | the ruling written (R7); `tools/perf/device-report.js` gains a FINGERPRINT row (adapter, driver, browser, the adapter's feature list — `shader-f16` is never requested, `gpu-boot.js:42` — limits, `fieldDigest` of two states at 64³); machines compared, none a lock. | the report on the rig; `digest-lock --check` ×2 unchanged | +0 · Sonnet @ high (PAIR C) |
| **P12 THE FACTOR SEAM** | 0.5.5's first row (R5). | — | 0 |
| **P13 THREE 6-31+G\* RECORDS** (R6, Q3) | H₂O (23 AO), H₂CO (42) + one of N₂ (38) / CH₃OH (46) / C₂H₄ (46); `orbital-library.mjs` is STO-3G-shaped (`:411`) and `chem.open` on a non-STO-3G record is untested → M; `library.json` 38 → 41 (the two tests that pin 38 updated); records outside the precache. Your standing caching ask, not PRE-MATH. | `library.test`, `orbital-library --check`, the MOLECULES select, the 6-31+G* oracle, `chem.open` of each | +0 lab · Opus · **your word** |
| **P-V** | one fresh Opus verifier: THE LOCK 860 + 1004 · 0/0; serialize-bytes 11/11 vs 0.5.3's cut; `new-project --check`; `settings-probe` 0/6; `lw-facade` 1/1; the field law; the invariance case; the worker-refusal case + a Worker-less run (MOLECULES still solves); the head at phone width with its fifth line; the geometry counts; water not UNCHECKED; the `capability()` call-count probe; the ms/s pair |Δ median| ≤ 3.536 ms/s vs 0.5.3's cut; the estate + the boot suite alone; the line law; CLAUDE.md against the tree; the export parsed by the Python reader — FIT / NOT FIT → a fix round → the local cut on your word | — | — |

## F · Gates, order, ledger
**Gates.** Node gate 0 after every row. THE LOCK at P0, P1, P3 (once), P4, P5 (the keyword), P6, P7 — never re-baked. Serialize-bytes 11/11 (no project key). `settings-probe`
0/6. `lw-facade` 1/1 unchanged. The field law and the invariance case from P7 on. P6's suite + browser case; the ms/s pair as a delta at P-V. **G-Frame** no row adds a
frame-loop call but P7a. Precache ≤ 8 MiB. The export round-trips through a reader sharing no engine code; H₂O's matrices equal the PySCF fixture. Every builder
re-runs `pwa --write` after rebasing. **Lines:** the cap is 0.5.3's cut + 1 % (0.5.3 estimates ≈ 28,103 → cap ≈ 28,384); the ledger ≈ +106 (P0 5 · P1 27 · P3 3 · P4 45 ·
P6 20 · P7 6; ESTIMATE); every BRIEF states its lines and what it subtracts; a builder stops at 1.5×.
**Order.** Before any BRIEF: your Q1 to the pilot; the integrator reads 0.5.3's INFORMATIONAL window as cut and its line count. **STEP 1** P0 (Haiku) ∥ P3 (Sonnet) —
disjoint. **STEP 2** PAIR A {P1 → P4} ∥ PAIR B {P6 → P7} — no common file. **STEP 3** PAIR C {P5 + P10 + P11} after the pilot's answer. P13 after P3 on your word. Then
P-V, a fix round, the local cut. Opus: PAIR A, PAIR B, P13, P-V; Sonnet @ high: P3, PAIR C; Haiku: P0. Every builder: a fresh worktree, `git reset --hard <tip>`, one
commit per row, a written BUILD, no push. NO push, NO deploy, NO release until the whole plan has run.

## G · What is not claimed
No mathematics is implemented or judged. No DFT, ChronusQ, WASM, compiler, kernel registry, EIGENMORPH, sieve, quasicrystal, synthesizer, DISK/cyclotomy or wave
indexing (0.6.x; P1 + P3 are its seams). No containment, Hessian, interval or tube (the pilot's, offline). No PHASECLOCK rewrite. No factor seam (0.5.5). No floor taper
or conditioning floor until the pilot names the numbers. No identity refusal on the frame road. No worker-side cancel. No projector or derivative format. No re-bake,
no speedup claim, no cross-device lock. The texel stays the error budget BY CHOICE (an f32 science buffer is deferred). Derivatives are `UNKNOWN`, never `false`. No
RECONNECTION word changes. No `CERTIFIED`. The q-band suite checks our code against Sol's count, not Sol's proof.

## H · Your words (verbatim)
> A pilot Opus 5.5 started work on verifying GPT-6.1 Sol's work. She will continue working on the math on our behalf. However, feel free to do a round, but not
> like what the skill.md says but rather the 'nacre ultrathink planning' method with the Claude model family (it was an old prompt somewhere).
> The folder is called 'Lamb of Waves' in Documents > Obsidian

And the NACRE question: "In terms of the entire goal *you* think Josh is trying to achieve, how to make this user friendly (leverage the 'rack window'). How to execute
this cleanly. The infrastructure/baseline changes needed to pull this off, keeping optimizations and speed clean and smooth with no FPS stutters, and utilizing,
updating and upgrading already existing machinery in the UI."

## I · The round's record
`PLAN-DRAFT-0.md` `ed00aa2` → `REVIEW-SONNET-0.md` `e92c98c` (two false facts caught: records already carry an oracle; benzene is 126 AO) → `PLAN-DRAFT-1.md` `a1508a6`
→ `AUDIT-OPUS-1.md` `bdc7ab5` (three rows re-cut: the identity swap would have staled STATES; the STATUS row broke your fold; P6 removed the never-answered road)
→ `PLAN-DRAFT-2.md` `8e3377b` → `REVIEW-SONNET-2.md` `1affbb3` (36 not 26 geometries; water would read UNCHECKED; one pure `statusOf()`; the AO table; `oneElectron`
only; `{ error, refused }`) → this. Your word and any flipped ruling become `PLAN.md` §J.

## J · RULINGS (Josh's words verbatim, and what they fix)
> Hmm, I guess whatever implimentation is easier to layer in the architecture. I defer to your judgement. So is this plan ready for the long haul? Safe to compact? I'll stay in this session since we have 5hr usage left so we'll continue where we left off
> — 2026-10-11, ≈ 12:40 CDT (on THE ENGINE PLAN, `research/release-0.6.0/PLAN.md` §J; its D.0 names this plan as the step after 0.5.3)

> Hello Claude! Let's excecute the master plan
> — 2026-10-11, ≈ 13:05 CDT

Taken as: **the master plan's D.0 order runs — 0.5.3 Rack Tune's resume, then THIS plan — and every default in §C stands** ("defaults stand if you say nothing"),
with "whatever implementation is easier to layer in the architecture" as the tie-break at any fork a BRIEF meets. Fixed by that:
- **R1 the name: Contract Layer** (the first offered; one or two words, no "The").
- **R2–R5, R7–R9, R11–R14 stand.** Q12 yes (STATUS as the third row of the INFORMATIONAL window 0.5.3 M9 ships); Q13 yes (hydrogen too). Q2 is answered by the
  engine plan: ChronusQ/DFT is 0.7.3 Kohn–Sham there, not here.
- **R6: water + formaldehyde; the third 6-31+G\* molecule WAITS on his word** (Q3: N₂, methanol or ethylene) — P13 is "after P3 on your word" already, so nothing blocks.
- **Q7 (DISK / cyclotomy) keeps for 0.6.x** — the engine plan's §G lists it under what is open. **Q9 (the 93-reference archive)** is not created until he names where it
  lives. **Q14: the pilot reads `research/release-0.5.4/export/`**; we never write in `for CLAUDE/`.
- **Q1, the three-line message to the pilot, goes THROUGH JOSH** and is not sent by us. Until he sends it and she answers, STEP 3 (PAIR C: P5 the export, P10, P11) waits;
  STEP 1 and STEP 2 do not depend on it and run.
- **The engine plan leans on this one:** `research/release-0.6.0/PLAN.md` D.0 says its rows "assume P4 `statusOf()`, P6 the worker refuses, P7 the field law; the first
  row that needs a missing one carries it" — so P4, P6 and P7 are the rows that must land before 0.6.0, the rest may slip to a later cut without moving the ladder.
- Order unchanged: BRIEFs after 0.5.3 is cut and its INFORMATIONAL window and line count are read; the cap = 0.5.3's cut + 1 %. `PLAN-DRAFT-3.md` is kept unchanged as the record.

**§J-2 · P7c RULING (the integrator, 2026-10-11 14:05, under Josh's deferral; the law behind it is this plan's own: every number read from its source constant, nothing sold as exact that is not).**
PAIR B measured (`.tmp/fieldlaw-probe.mjs` in its worktree) that the f16 store rounds toward zero on this rig, so neither source number holds as a PER-VOXEL maximum:
hydrogen's worst voxel at 64³ is 1.68e-4 against README's 2e-5 (RMS 2.3e-6; 99.8 % of voxels within 2e-5); water's worst relative error on ρ is 1.94e-3 against `field.js`'
≈ 1e-3 (2.9e-4 against ρmax). RULED: (1) `tests/field-law.browser-test.mjs` asserts what the texel IS — each stored component within one f16 ulp of its f64 value (the
rounding mode as measured) — and prints the two source figures as readings, each in its own metric (RMS · 99.8 %-of-voxels · worst voxel · relative-to-ρmax); (2) README's
2e-5 line and `field.js`' ≈ 1e-3 comment are made TRUE in place (an RMS and a relative-to-ρmax figure, with the worst voxel beside each) — a P0-kind edit inside PAIR B's
continuation; (3) P4's picture number reads the field-law constant and says its metric: `picture good to 2e-5 RMS (worst voxel 2e-4)` for hydrogen, `picture good to 0.03 %
of ρmax` for a molecule's density — never a bare "good to 2e-5"; (4) this is the first row of THE ENGINE PLAN's "METERS shows the picture's own floor with its metric" (0.6.0
N6), measured early; its 2.7–4.9e-4 floor and this 1.68e-4 worst voxel are the same fact seen on two grids and are recorded together in `PAIR-B-BUILD.md`.
**§J-2 ADDENDUM (the integrator, 2026-10-11 17:50, at the PAIR B2 merge).** Measured (`PAIR-B-BUILD.md` §4): the literal "within one f16 ulp of its f64 value" fails on 46 of 1,048,576 components (hydrogen 32, worst 1.0005 ulp; water 14, worst 1.0008 ulp) — the kernel's own f32 error (≤ 5.4e-7 relative) carried across an f16 grid point. ACCEPTED as the law's form: |stored − f64| ≤ 1 f16 ulp + 1e-6·|f64| (`FIELD_LAW.f32`, from `field.js`' own "f32-accurate to about 1e-6"), 0 failures; the strict one-ulp count is printed on every run. The constants are `tests/helpers/field-law.mjs`; `lab/` cannot import from `tests/` at run time, so P4's constants live once in `lab/` and its table test asserts each equals its `FIELD_LAW` member. Ruling (3) corrected by the reading: hydrogen's string reads from `FIELD_LAW.hydrogen.rms` = **3e-6 RMS** (2e-5 is the 99.8 %-of-voxels figure); "0.03 % of ρmax" is water's reading at 64³ and P4 says whose reading it is or quotes the 2e-3 bound.
**§J-3 · P4 SEAT (c) RULING (the integrator, 2026-10-11 18:10, at the P4 merge).** P4 found that the film's caption IS `stageCaption()` (`capture.js` `captionOf` ← `film.js:10`), and that `tests/stage-text.browser-test.mjs:108,112` pin `C.picture().caption` — so the brief's "stage-text UNCHANGED" and "the export caption gains the short form" cannot both hold; the brief's premise was wrong, not the builder. RULED: the pin protects the STAGE's words, which do not move; the export caption gains ` · <STATE word>` (hydrogen's from `statusOf({ owner: 'hydrogen' })`, a molecule's from `chem.said.word`), with STAGE FORMULA off the caption stays '' (Q15); stage-text's two caption assertions are RE-AIMED to the suffixed strings (`'1s₀, 2p₀ · EXACT'`, `'H₂O · 1b1 HOMO · STO-3G · NUMERICAL'`) — a test-side re-aim of the 0.5.3 M-V kind, not a change of the stage's words. Lands in the FIX ROUND after P-V (P4-BUILD §2 (c) has the one-edit patch). P4's one CSS seat (`skin.css` `.ro.lw-status .ro-val { white-space: normal }`) and the `window-chrome.js` LEAN exemption for `.ro.lw-status` stand: seat-level, in-line, of the kind the palette's readout already carries (`lab.css` "LEAN hides every .ro; this one … stays").
**§J-4 · P-V RULINGS (the integrator, 2026-10-11 20:15, at the P-V merge — FIT TO CUT: YES, 0 BLOCKING, 10 NOTES).** N3: the B₁₂H₁₂²⁻ record's hash moved at P3 because its `page` text was out of step with 0.5.3 M1 — the record's numbers did not move; R3's "hashes do not move" is read as "a maths row never moves a hash"; a text re-cut by the generator is a correction, ACCEPTED, recorded in P3-BUILD §5. N4: §B's "never UNCHECKED" is narrowed to STO-3G in R3 (above); the 6-31+G* oracles row (19 entries from the fixture, the same generator seat) is owed to 0.6.0's BUILD PLAN. E1–E9 applied in the fix round (E8 touches a `rack.js` comment only — `pwa --write`, the lock ×2 after). N5 (THE HEAD wraps to 3–5 line boxes at phone width; Cr(CO)₆'s head 447 of 844 px) and N2 (`latex-copy` §2 a timing red, both trees), N10 (B69 a flake on both trees) are for Josh's eye and the next verifier; N1 pre-existing. The main-thread pair: boot +0.549, MOLECULES +0.776 ms/s against 3.536 — THE STUTTER LAW holds for the whole release.
