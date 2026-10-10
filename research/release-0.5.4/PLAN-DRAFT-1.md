# λWAVES 0.5.4 PRE-MATH — PLAN DRAFT 1 (Claude Sos / Fable 5.1, 2026-10-10 17:31 CDT, after REVIEW-SONNET-0) — for the Opus @ high audit

The round (`NACRE.md`): DRAFT 0 `ed00aa2` → `REVIEW-SONNET-0.md` `e92c98c` (merged `d91b6be`) → **this DRAFT 1** → `AUDIT-OPUS-1.md` → DRAFT 2 → Sonnet@high
junior → DRAFT 3 → Josh → `PLAN.md`. The ground: the four surveys and the tree at `v0.5.2-alpha` (27,943 lines; 38 records, 12 MB, outside the precache).
0.5.4 builds AFTER 0.5.3; its cap is 0.5.3's cut line count + 1 % (Q10) — **28,504 if 0.5.3 lands at its cap**, less if it lands lower.

## What DRAFT 1 changed, and why (the review's beginner's luck, taken)
1. **Fact 6 was false.** Every record already carries `oracle { energy, source, what, delta }` from PySCF (max |δ| 6.93e-9 Eh, 38/38, verified) and `input`
   already holds `atomsSha256`, `basisSha256`, `charge`, `multiplicity`. The plan now EXTENDS what the tree owns instead of rebuilding it: no `lab/convention.js`
   (`molecule-state.js:32-33` exports `BASIS_KIND` and `COMPONENT_ORDER_LINE`; `md.js:508` `rdOf` is the R_d law; `names.js:115` `CONVENTION` is the frame), no sidecars
   (the `library/` root is cache-first and never refreshed, `sw.js:404-439`, so a re-issued certificate would never reach a device), no new facade member
   (`__LW.chem` is a facade value, `facade.js:18`; `chem.capability()` pins nothing).
2. **The STATUS face is one string in three seats, and the word follows the VIEW observable** in the tree's own vocabulary — EXACT / NUMERICAL / UNCHECKED —
   because "a single renderer tolerance cannot certify every scientific observable" (R3) and the badges are OFF on a first run. DRAFT 0's examples were wrong on
   the tree's terms (a minimal-basis RHF is not "established"; C₆₀ is a PySCF frontier record, not "experimental").
3. **P12 the factor seam is STRUCK to 0.5.5's first row**: a representation row under R2's pause, Sol's own order is benchmark first (C:5292, R6), and the ledger
   (≈ 275 lines for the other rows, ESTIMATE) does not pay for it. **P9's taper is deferred** (the floor that matters is not 1e-7 — PILOT-AUDIT §4 — and the
   taper's shape is the Lipschitz question of Sol's contract); the tracked metrics stay. **P7b's visible refusal is struck**: 2⁵³ frames is ≈ 4.7 million years
   of play; `T_MAX` is declared and `scrub` clamped. **P8's refusal floor is struck**: what conditioning is "a lost response gap" is the pilot's number.
4. **P13's molecules were wrong**: benzene in 6-31+G* Cartesian is 126 AO against the 46-AO cap (`molecules.js:514,521`). The three are H₂O (23), H₂CO (42) and
   one of N₂ (38) / CH₃OH (46) / C₂H₄ (46), all in the 19-molecule oracle `tests/fixtures/oracles/6-31+g-star-v1.json`.
5. **P6 is told the truth about itself**: no owning suite exists (nothing in `tests/` imports `worker-pool`); the ms/s pair never times out a chem job; `fail()`
   (`worker-pool.js:20`) sets `failed = true` and never respawns, so after ONE `onerror` every later chem job runs on the frame thread silently; the chem ceiling is
   300 s (`:49`). The row's proof and semantics are rewritten (§2 P6, §7 R4).
6. **The RECONNECTION words** (`vortex.js:9,30`, `state.js:458`) — which Sol's audit calls a publication prerequisite to correct (C:2802, C:5356) — are LISTED by P0
   and changed by nobody until the pilot classifies (R11). **PAIR 1 was not disjoint** (`mathworker.js` from both halves): P1 is serialised before P6.
7. Four questions gained (Q7 DISK/cyclotomy never reached Sol; Q8 the RECONNECTION words; Q9 the 93-reference archive; Q10 the cap after 0.5.3), and the
   review's six ideas are taken as I1–I6 (§2, §5).
Not taken: nothing of substance. Three citations corrected (`molecular-session.js:25`, `library.js:39`, `pwa.test.mjs:313`).

## 0 · One sentence, and the reading of Josh's goal
**0.5.4 is THE CONTRACT LAYER: the identity, convention, status, precision and worker seams that must exist before any result of Sol's programme or the pilot's
verification can land in λWAVES without being a hope — extending what the tree already owns, and putting ONE true string about what is on stage where a reader
meets it.** It builds no mathematics, runs no new chemistry, moves no digest. The reading of Josh's goal and the three readings the plan rests on are DRAFT 0 §0,
unchanged: the paper's contribution is observable-certified reconstruction, not a speedup; the physical programme stays paused; the spec's S:42 "approximation
status" belongs on the glass — and the tree already half-says it (`STATUS: EXACT ANALYTIC` headers ×13, `EXACT` ×11, `NUMERICAL` ×6; the badges' `exact`/`numerical`;
`moleculeHead`; the MODEL sheet), hydrogen-minded.

## 1 · The facts (DRAFT 0 §1, corrected)
Facts 1–5 and 7–10 of DRAFT 0 stand, with these corrections: the session stamp is `molecular-session.js:25` (ranks :15-17); the FRONTIER comment is `library.js:39`,
`atomsKey` :15; the ORBITAL packet's `+=` is `orbitalsview.js:275`; `pwa.test.mjs:313` is the 8 MiB ceiling; `MAX_MODES` is `field.js:24`. **Fact 6 replaced:** records
are `{ schema, kind, id, basis, name, formula, generator, input{atoms, atomsSha256, charge, multiplicity, basis, basisFile, basisSha256, symmetry}, caps, ground,
orbitals, spectrum, stem, page, oracle{energy, source, what, delta} }`; `molecule-state.js` is a validated record with named refusals (`CODES` :34, `MoleculeStateError`
:39, `serializeMolecule` :129, `restoreMolecule` :190) and a save→restore byte test; `chemview.record()` (:762-768) hands it out for "a state link, a fixture, an
export". The three oracle fixtures are `tests/fixtures/oracles/{library-v1 (38), sto-3g-v1, 6-31+g-star-v1 (19 molecules, 3e-12)}.json`. **New fact 11:** the
app says RECONNECTION in three places (`vortex.js:9` "the reconnection census", `:30` "A double root marks a reconnection.", `state.js:458` "(reconnection) … vortex
lines reconnect at ten points"), and Sol's audit says "An angular double root does not necessarily mean that two spatial vortex lines reconnect" (C:2802).
**New fact 12:** the `worker-pool.js:1-13` header also promises "timing out to the frame thread's road"; `fail()` :20 never respawns; chem ceiling 300 s :49.

## 2 · The rows
Each row: `BRIEF-P<n>.md`, `P<n>-BUILD.md` with "what Josh will see" (or the truth surface added), its owning suites, **its line budget and what it subtracts,
written in the BRIEF before any code** (the review's risk 2), THE LOCK where `lab/` moves, `pwa --write` after every `lab/` edit. Sizes S ≤ 2 h, M ≈ 4 h.
Contract modules import no DOM (the 1.0.0 standalone law: "state independent of UI", C:5472–5496).

| # | row | what | closer | Δ · model |
|---|---|---|---|---|
| **P0 TRUTH + THE CLAIMS INVENTORY** | the nine contradictions fixed in place (`molecular-session.js:15-17,25`, `worker-pool.js:1-13,55`, `state.js:58`, README:82,150, NOTES:98-100, `readouts.js:87` → "qualitative in STO-3G and 6-31+G*" — a string a user reads: named as seen); each producer's energy reference and kernel letter declared in its header (PM-24); the lock's "same-machine" sentence in CLAUDE.md and NOTES; **I2 the claims inventory** `research/release-0.5.4/CLAIMS.md`: every user-visible sentence the programme puts in doubt — the three RECONNECTION words, the FLOW caption, the MODEL sheet (`index.html:128-133` "The register contains the 91 hydrogen basis states" while a molecule owns the field — UNVERIFIED by reading), the EXACT badge over a molecule (`badges.js` has no molecule branch — UNVERIFIED) — LISTED, changed by nobody (R11) | node gate; `pwa --write`; the BUILD greps each line | ≤ +5 · Haiku (xhigh) |
| **P1 THE IDENTITY KEY** — alone, before P6 | one string built in ONE function from the record's `input` (`atomsSha256`, `basisSha256`, `charge`, `multiplicity`, + `model`, + `options`), used by the session stamp (`molecular-session.js:25,103-110,137`), the worker key (`mathworker.js:197`), chemview's adopt (`chemview.js:482-484`) and every producer (`chemview.js:488`, `molecular-register.js:225`) — the SAME string or a valid product is refused as stale (the review's risk 1: THE LOCK is the proof); a mismatch is **I3 an `E_IDENTITY` refusal** in `molecule-state`'s idiom (a code and a sentence) printed on chemview's `status()`; projects keep `{ id, hash, nameKey }` | `rhf-molecules.test`, `molecular-session` cases, `library.test`, the moved-H witness as a node case; THE LOCK; serialize-bytes 11/11; `new-project --check` | +30 · Opus |
| **P2 CONVENTIONS, GATHERED** | no new module: ONE exported object in `molecule-state.js` that REFERENCES what exists (`BASIS_KIND`, `COMPONENT_ORDER_LINE`, `md.rdOf`, `names.CONVENTION`) and adds the three undeclared ones — `kernel: 'D = Σ f c c†; P = W D W'` (`density.js:6-7`), `current: '−Im D, the transpose'` (`molecular-flow.js:5`), `energyRef` per producer (hydrogen absolute, STATES relative to ground, packet absolute ε·t); attached to every product and to P5. The sign tests KEEP their literals and assert the object equals them (S:2096: a test that reads the object the code defines proves nothing) | `molecular-flow.test:64,111`, `density.test`, `molecule-state.test` (+ equality) | +25 · Sonnet |
| **P3 ORACLE + STATUS IN THE CATALOGUE** | the catalogue rows of `lab/library.json` (precached, 88 KB, already carrying `caps`) gain `oracle: { what, delta }` and a per-quantity `status` (`energy: MEASURED`, `orbitals: UNCHECKED`, `derivatives: UNKNOWN` …) written by `tools/orbital-library.mjs` from the records' own `oracle` and the fixtures; ≈ 4 KB; readable without opening a 1.2 MB record; `--check` proves it byte-exact. **The app may write MEASURED; CERTIFIED is a mathematical judgment** — only a pilot-signed, content-addressed member may carry it (none this release). Records' bytes and hashes do not move (R3). | `library.test` (+ the rows), `orbital-library --check`, precache ≤ 8 MiB (`pwa.test.mjs:313`); THE LOCK (P3 edits `library.js`) | +30 · Opus |
| **P4 ONE STRING, THREE SEATS** (I1, R8, R12) | `chem.capability()` (no facade change) returns `{ observables: { density, orbital, flow, states }, limits: { lmax: 2, Z: 36, densityAO: 128, orbitalAO: 768 }, geometry: stem.geometrySource, precision: 'f64 → f32 → f16 texel ≈ 1e-3 ρ', oracle, identity, status }` where **the word follows VIEW and the weakest observable on stage sets it**: `DENSITY · NUMERICAL · energy agrees with PySCF to 7e-9 Eh · picture good to 0.1 %`; `ORBITAL · NUMERICAL · sign and phase are arbitrary`; `FLOW · NUMERICAL · direction exact, size qualitative`; hydrogen `EXACT`; a record with no oracle `UNCHECKED`. Three seats from ONE string: (a) a kit `readout({ label: 'STATUS', value, sub })` row on MOLECULES above `.mol-more` (visible on a phone); (b) the last line of THE HEAD (`moleculeHead`, `latex-state.js:131`, a pure builder — shows on first pick on any device); (c) the capture caption (`capture.js:575`). The live `Tr(DS)` = N_e and IDEMPOTENCY line (`chemview.js:216-217`) comes out of the fold into the readout's `sub`. | `molecule-head` (+ the line), `chem`, a hit-probe of the row at phone and tablet width, `tools/stylehash.mjs` (the card grew), `frame-occlusion`, `lw-facade` 1/1 unchanged, `settings-probe` 0/6 (no key); THE LOCK | +60 · Opus (after P1, P3) |
| **P5 THE EXPORT FOR THE PILOT** (I4, I6) | **first, ask her (Q1) in three lines listing what the app can hand over today**: the `molecule-state` record, S/T/V/M via `md.integrals()` in node, the oracle energies. Then `tools/export-record.mjs <id>` = `chemview.record()`'s record + a `contract` block (identity P1, convention P2, capability P4, oracle P3) + S, T — ≈ 30 lines; `research/release-0.5.4/export/README.md` says what each member is and **what is NOT there** (Hessians, intervals, q, M, derivatives); **I4 `export/REPRODUCE.md`**: build id, tree hash, the lock result, the device matrix (P11), oracle versions — the paper's reproducibility pack (R25 §12.5) | the tool runs for H₂O, C₆H₆, C₆₀; a node test parses the output; a 10-line Python reader (`-I`) shares no engine code | +0 lab · Sonnet |
| **P6 THE WORKER REFUSES** — chem only | an `error` from the chem worker becomes a VISIBLE refusal on `status()` (callers already print `.refused`/`.error`, `chemview.js:337,375`), never a frame-thread rerun: `local()` only when `!chemW.ok` at boot (a Worker-less browser); **`fail()` respawns ONCE and then refuses** (R4) instead of turning the pool dead and silent; a cancel epoch (a superseded job's reply is dropped); the header and `:55` made true. `maths`/`cards` keep their synchronous roads. **Proof:** a NEW node suite with a fake `spawn` (`createWorkerPool({ busyWrap, spawn })` is injectable) — `local()` calls = 0 under error, timeout and a dead pool; and `tools/perf/worker-timeout.mjs`: the longest rAF gap and `longtask` across a FORCED chem timeout before vs after (the ms/s pair cannot see it). Frame-path row → P-V's fresh verifier. | the new `worker-pool.test`; the forced-timeout probe; `history`, `new-project.browser`, `register`; THE LOCK | +40 · Opus (after P1) |
| **P7 PRECISION DISCIPLINE** | (a) the ORBITAL packet accumulates in f64, casts once (`orbitalsview.js:270-275`) — hygiene (≈ 2e-5 worst case vs the 1e-3 texel, ESTIMATE); THE LOCK proves packets are outside it or the row reports; (b) `T_MAX` DECLARED in `clock.js`'s header, `scrub(t)` clamped to it, a node test shows `t += dt` losing dt beyond 2⁵³·dt — no sentence, no frame-path branch; (c) **the standing field law** `tests/field-law.browser-test.mjs`: hydrogen voxels vs the closed form (2e-5, README:79) and water's density vs the f64 oracle (`molecular-field.js:59`) through `sampleVoxel`/`readGrid` at the texel's 1e-3 — two laws; (d) **I5 the view-invariance gate**: exposure, ISO, palette, grid, quality never change the published matrix hash or `Tr(DS)` (R25 §10.1) — one browser case | THE LOCK after (a); `clock.test` (new); the field law 2/2; the invariance case | +25 · Opus |
| **P8 ONE-ELECTRON EXPORT + CONDITIONING REPORTED** | `md.js` exports `oneElectron(basis, atoms)` → `{ S, T, V, M }` (`:210`; `integrals()` :453-458 unchanged); no worker op (P5 calls it in node; nothing in the app asks); `loewdin` REPORTS `{ minEig, cond }` into the capability (P4) — **no refusal floor** (the pilot's number, Q1); the BUILD measures cond over the 38 records so the number has a baseline | `md.test` (+ S/T equal to the full road's), `density.test`, `library.test` | +15 · Sonnet |
| **P9 FLOW'S NUMBERS, TRACKED** | tests only: the continuity residual and the current/dipole ratio pinned in `tests/molecular-flow.test.mjs` with a tolerance, not a target; the frozen-frame step error named in the module header as not covered (R21 §4.9). The floor taper is DEFERRED until the pilot names the margin her certificate assumes (Q1). | `molecular-flow.test` | +0 lab · Sonnet |
| **P10 THE ORACLES, DESCRIBED + THREE NODE SUITES** | `tests/fixtures/oracles/README.md` describes the three fixture files that exist (PySCF version, `cart=True`, the R_d transform `md.js:3-5,508`, geometry in bohr, tolerances, the generating script); three node suites, no `lab/` change: huge-time phase against `clockAutocorr` (`frontier.js:636`) for unstructured t; the angular q-band through `coaxialPolynomial` (`frontier.js:415`); the continuity residual (P9). PM-13's graph current model is dropped, said so. | the suites green; `bash test.sh node` | +0 lab · Sonnet |
| **P11 THE LOCK'S SCOPE + THE MATRIX** | the ruling written (R7): 860 + 1004 stay at 0/0 (the 1004 fixture WITH `--query gastab=0`, CLAUDE.md:316); a math row never re-bakes; same-machine; past 64 AO nothing is locked; `tools/perf/device-report.js` gains a DIGEST MATRIX row (adapter, driver, browser, `shader-f16` granted or not — `gpu-boot.js` never requests it — and the 860 values) so machines are COMPARED, none a lock. `tools/` only. | the report on the healthy rig; `digest-lock --check` ×2 unchanged | +0 lab · Sonnet |
| **P12 THE FACTOR SEAM** | **STRUCK from 0.5.4 → 0.5.5's first row** (R5): a representation row under the pause; benchmark first (`tools/perf/s4c-kernel.mjs` exists); the ledger does not pay. 0.5.5's brief inherits DRAFT 0's P12 text. | — | 0 |
| **P13 THREE 6-31+G\* RECORDS** (R6, Q3) | H₂O (23 AO), H₂CO (42), + one of N₂ (38) / CH₃OH (46) / C₂H₄ (46) — all in the 19-molecule oracle; written by `tools/orbital-library.mjs` with their catalogue rows (P3); Josh's N:23–26 already asks for the caching; N:30's count honoured. Records outside the precache; `library.json` 38 → 41 | `library.test`, `orbital-library --check`, the MOLECULES select, the `6-31+g-star-v1` oracle | +0 lab · Opus · **Josh's word** |
| **P-V** | one fresh Opus verifier: THE LOCK 860 + 1004 · 0/0; serialize-bytes 11/11 vs 0.5.3's cut; `new-project --check`; `settings-probe` 0/6; `lw-facade` 1/1; the field law; the view-invariance case; the forced-timeout probe (its scenes written out); STATUS probed at phone and tablet width; `tools/stylehash.mjs`; the estate + the boot suite alone; the line law; CLAUDE.md against the tree; the export parsed by the Python reader — FIT / NOT FIT → a fix round → the local cut on Josh's word | — | — |

## 3 · The gates
**G-N** node gate 0 after every row. **G-L** THE LOCK at every row that edits `lab/`: P0, P1, P2, P3, P4, P6, P7, P8 — never re-baked (R7). **G-B** serialize-bytes 11/11
(no project key; identity and capability are derived). **G-P** `settings-probe` 0/6 (no PREFERENCE key). **G-W** `lw-facade` 1/1 unchanged. **G-F** the field law and
the invariance case from P7 on. **G-T** the forced-timeout probe for P6 (longest rAF gap and longtask, before vs after); the ms/s pair ≤ 3.536 at P-V. **G-Lines** the cap
after 0.5.3 (Q10; ≤ 28,504); the ledger ≈ +230 (P0 5 · P1 30 · P2 25 · P3 30 · P4 60 · P6 40 · P7 25 · P8 15; ESTIMATE); every BRIEF states its lines and what it
subtracts; a builder stops to report at 1.5×. **G-Bytes** precache ≤ 8 MiB. **G-Export** P5's JSON round-trips through a reader sharing no engine code. **G-M** every
builder re-runs `pwa --write` after rebasing on the merged tip.

## 4 · Order
P0 (Haiku, docs) and **P1 ALONE** (the identity string before anything keys on it) first, in that order. Then **PAIR A** {P2 + P3 + P4 — conventions, catalogue,
the string; `molecule-state`, `library`, `chemview`, `latex-state`, `capture`} ∥ {P6 — the pool; `worker-pool`, `mathworker` :150 only}. Then **PAIR B** {P5 + P8 +
P10 — export, one-electron, oracles; `md`, `density`, `tools/`, `tests/`} ∥ {P7 + P9 — precision and FLOW numbers; `orbitalsview`, `clock`, a new browser test,
`molecular-flow.test`}. P11 any time (tools only). P13 after PAIR A on Josh's word. Then P-V, a fix round, the cut. Opus: P1, P3, P4, P6, P7, P13, P-V; Sonnet:
P2, P5, P8, P9, P10, P11; Haiku: P0. ≈ 6 builders ≈ 30 builder-hours ≈ 2 relay days. Every builder: `isolation: "worktree"`, `git reset --hard <tip>`, no push.

## 5 · What Josh will see
ONE STATUS string wherever the molecule is named — on the MOLECULES card, at the foot of THE HEAD, in every capture caption — saying what VIEW is showing and how
far to trust it, in plain words (`DENSITY · NUMERICAL · energy agrees with PySCF to 7e-9 Eh · picture good to 0.1 %`), with the electron count beside it; a MOLECULES
action that says "refused: …" instead of silently running on the frame thread; three 6-31+G* molecules if he rules them in; a folder `research/release-0.5.4/export/`
with water, benzene and C₆₀ as JSON the pilot can read, and a REPRODUCE sheet for the paper. Below the glass: the identity, the gathered conventions, the catalogue's
oracle column, the field law, the view-invariance gate, the tracked FLOW numbers, the claims inventory.

## 6 · What is not claimed
No mathematics is implemented or judged. No DFT, ChronusQ, WASM, compiler, kernel registry, EIGENMORPH, sieve, quasicrystal, synthesizer, DISK/cyclotomy (Q7) or
wave indexing (N:27-29: P1 + P3 are its seams; 0.6.x). No containment, Hessian, interval or tube. No PHASECLOCK rewrite (R9). No factor seam (0.5.5). No floor taper
until the pilot names the margin. No re-bake, no speedup claim, no cross-device lock. **The texel stays the error budget BY CHOICE** (PM-7: an f32 science buffer or
the spare `.b/.a` channels would let a numeric oracle separate shader error from f16 storage — deferred; the field law measures the whole path). The certified ORB
screen (PM-22) is seven orders under the texel — not planned. Derivatives are `UNKNOWN`, never `false`. No RECONNECTION word changes (R11). No `CERTIFIED` this release.

## 7 · RULINGS TAKEN AS DEFAULTS (Josh may flip any)
- **R1 the name** — Josh's. Offered: "Contract Layer", "Truth Seams", "Status Line". **R2 the pause holds.** **R3 catalogue rows, not sidecars or schema 2**; record
  bytes and hashes do not move. **R4 the worker refuses**: chem only; error → visible refusal; `fail()` respawns once, then refuses; the Worker-less browser keeps
  its road. **R5 the factor seam is 0.5.5's first row.** **R6 6-31+G\***: H₂O, H₂CO + one more, on Josh's word. **R7 the lock** stays, same-machine, never re-baked by a
  math row, the 1004 fixture with `--query gastab=0`; a matrix report. **R8 the face**: one string, three seats (card, head, caption); no window, no key, no badge.
  **R9 PHASECLOCK deferred**; `T_MAX` declared, `scrub` clamped, no refusal. **R10 the DFT/ChronusQ tension** stands until Josh rules (spec S:2310/S:1507 vs C:1854).
  **R11 the RECONNECTION words stay** until the pilot classifies; P0 lists them. **R12 the vocabulary** EXACT / NUMERICAL / UNCHECKED (the tree's) is the default;
  the wording is Josh's.

## 8 · Questions (the defaults stand meanwhile)
- **Q1 the pilot** (BEFORE P5/P8/P9 are briefed): what she wants from the app — today it can hand over the `molecule-state` record, S/T/V/M via `integrals()`, the
  oracle energies; and what floor margin and overlap-conditioning number her certificates assume.
- **Q2** DFT/ChronusQ: still "definitely go forward", and if so 0.6.0 as Sol's ladder says, or inside this plan?
- **Q3** 6-31+G\*: H₂O, H₂CO and which third — N₂, CH₃OH or C₂H₄ — or none until the programme resumes?
- **Q4** answered by the tree: the factor seam is 0.5.5 (the ledger). **Q5** answered: card row + head line + caption (badges are off on first run; a card moves
  bytes; a switch adds a key). **Q6** the name.
- **Q7** DISK / cyclotomy (N:35–37) never reached Sol (CHAT §0.2): hand it to the pilot, to Sol, or keep it for 0.6.x?
- **Q8** the RECONNECTION words: keep until the pilot classifies (R11), or rename now to "double root"?
- **Q9** the 93-reference archive (C:5030–5039, unseen by every survey): where does it live, and does Josh want `docs/REFERENCES.md`?
- **Q10** the cap: 0.5.3's cut line count sets it (≤ 28,504).

## 9 · Josh's words (verbatim)
> A pilot Opus 5.5 started work on verifying GPT-6.1 Sol's work. She will continue working on the math on our behalf. However, feel free to do a round, but not
> like what the skill.md says but rather the 'nacre ultrathink planning' method with the Claude model family (it was an old prompt somewhere).
> The folder is called 'Lamb of Waves' in Documents > Obsidian
