# AUDIT-OPUS-1 · the senior audit of PLAN-DRAFT-1 for 0.5.4 PRE-MATH, and the plan as edited (Opus 5.5 @ high, 2026-10-10)

**AUDIT: COMPLETE.** Stamp (`date`): `Sat Oct 10 05:46:46 PM CDT 2026`. Tree `a1508a6` (its `lab/` is v0.5.2-alpha; `cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l` = **27,943**, measured).
Read whole: `NACRE.md`, `PLAN-DRAFT-0.md`, `REVIEW-SONNET-0.md`, `PLAN-DRAFT-1.md`, the four surveys (984 lines), `CLAUDE.md` (395), `docs/NOTES-FOR-AGENTS.md`, `docs/EXPORT.md`,
`research/release-0.5.0/AUDIT-OPUS-1.md` (shape), `research/release-0.5.3/PLAN.md` (its ledger and M9); `docs/STATE-SCOPES.md` by grep only. Read on the tree: `worker-pool.js` whole; the cited spans of
`chemview.js`, `molecular-session.js`, `molecule-state.js`, `library.js`, `molecules.js`, `md.js`, `density.js`, `mathworker.js`, `orbitalsview.js`, `statesview.js`, `clock.js`, `molecular-flow.js`,
`field.js`, `latex-state.js`, `capture.js`, `shell/facade.js`, `names.js`, `badges.js`, `vortex.js`, `state.js`, `index.html`, `sw.js`, `gpu-boot.js`, `tools/perf/digest-lock.mjs`, `tools/perf/main-thread.mjs`, `tests/pwa.test.mjs`.
Ran: `grep`, `sed`, `awk`, `wc`, `ls`, `date`, and read-only `node -e` on JSON only (`lab/library.json`, the 38 `lab/library/*.json`, the three oracle fixtures, `tests/fixtures/h2o-sto3g-integrals.json`,
`research/release-0.5.2/lw-facade.json`). No suite, browser, server, Python or git write; no engine module executed. The 0.5.3 INFORMATIONAL rack window is NOT on this tree (0.5.3's PLAN at `a1508a6`
puts STAGE FORMULA and ATOM LABELS back on SETTINGS › DISPLAY, M9); I take it from the integrator's brief as Josh's word today.

---

# PART A — THE PLAN, AS EDITED (PLAN-DRAFT-1 · OPUS EDIT, for DRAFT 2)

*Every change is marked **[OPUS: …]**. A struck line is ~~struck~~ with its reason. Unmarked text is DRAFT 1's, verbatim.*

# λWAVES 0.5.4 PRE-MATH — PLAN DRAFT 1 (Claude Sos / Fable 5.1, 2026-10-10 17:31 CDT, after REVIEW-SONNET-0) — for the Opus @ high audit · OPUS EDIT

The round (`NACRE.md`): DRAFT 0 `ed00aa2` → `REVIEW-SONNET-0.md` `e92c98c` (merged `d91b6be`) → **this DRAFT 1** → `AUDIT-OPUS-1.md` → DRAFT 2 → Sonnet@high
junior → DRAFT 3 → Josh → `PLAN.md`. The ground: the four surveys and the tree at `v0.5.2-alpha` (27,943 lines; 38 records, 12 MB, outside the precache).
0.5.4 builds AFTER 0.5.3; its cap is 0.5.3's cut line count + 1 % (Q10) — **28,504 if 0.5.3 lands at its cap**, less if it lands lower. **[OPUS: 28,222 × 1.01 = 28,504.2 ✓; at 0.5.3's own ESTIMATE (+122 → 28,065) the cap is 28,345, before the INFORMATIONAL window 0.5.3 has added since its PLAN.]**

## What DRAFT 1 changed, and why (the review's beginner's luck, taken)
1. **Fact 6 was false.** Every record already carries `oracle { energy, source, what, delta }` from PySCF (max |δ| 6.93e-9 Eh, 38/38, verified) and `input`
   already holds `atomsSha256`, `basisSha256`, `charge`, `multiplicity`. The plan now EXTENDS what the tree owns instead of rebuilding it: no `lab/convention.js`
   (`molecule-state.js:32-33` exports `BASIS_KIND` and `COMPONENT_ORDER_LINE`; `md.js:508` `rdOf` is the R_d law; `names.js:115` `CONVENTION` is the frame), no sidecars
   (the `library/` root is cache-first and never refreshed, `sw.js:404-439`, so a re-issued certificate would never reach a device), no new facade member
   (`__LW.chem` is a facade value, `facade.js:18`; `chem.capability()` pins nothing). **[OPUS: confirmed, with one exception the review missed: C₆₀'s oracle is "PySCF 2.14.0 — the record IS PySCF's; its check is the field at Sol's 92 points", δ = 0 by construction — not an independent agreement.]**
2. **The STATUS face is one string in three seats, and the word follows the VIEW observable** in the tree's own vocabulary — EXACT / NUMERICAL / UNCHECKED —
   because "a single renderer tolerance cannot certify every scientific observable" (R3) and the badges are OFF on a first run. DRAFT 0's examples were wrong on
   the tree's terms (a minimal-basis RHF is not "established"; C₆₀ is a PySCF frontier record, not "experimental"). **[OPUS: the seat and the word's rule are re-cut in P4.]**
3. **P12 the factor seam is STRUCK to 0.5.5's first row**: a representation row under R2's pause, Sol's own order is benchmark first (C:5292, R6), and the ledger
   (≈ 275 lines for the other rows, ESTIMATE) does not pay for it. **P9's taper is deferred** (the floor that matters is not 1e-7 — PILOT-AUDIT §4 — and the
   taper's shape is the Lipschitz question of Sol's contract); the tracked metrics stay. **P7b's visible refusal is struck**: 2⁵³ frames is ≈ 4.7 million years
   of play; `T_MAX` is declared and `scrub` clamped. **P8's refusal floor is struck**: what conditioning is "a lost response gap" is the pilot's number.
4. **P13's molecules were wrong**: benzene in 6-31+G* Cartesian is 126 AO against the 46-AO cap (`molecules.js:514,521`). The three are H₂O (23), H₂CO (42) and
   one of N₂ (38) / CH₃OH (46) / C₂H₄ (46), all in the 19-molecule oracle `tests/fixtures/oracles/6-31+g-star-v1.json`. **[OPUS: all six AO counts CONFIRMED from the fixture's `nAO`; 126 by `molecules.js:518`'s own rule.]**
5. **P6 is told the truth about itself**: no owning suite exists (nothing in `tests/` imports `worker-pool`); the ms/s pair never times out a chem job; `fail()`
   (`worker-pool.js:20`) sets `failed = true` and never respawns, so after ONE `onerror` every later chem job runs on the frame thread silently; the chem ceiling is
   300 s (`:49`). The row's proof and semantics are rewritten (§2 P6, §7 R4).
6. **The RECONNECTION words** (`vortex.js:9,30`, `state.js:458`) — which Sol's audit calls a publication prerequisite to correct (C:2802, C:5356) — are LISTED by P0
   and changed by nobody until the pilot classifies (R11). **PAIR 1 was not disjoint** (`mathworker.js` from both halves): P1 is serialised before P6.
   **[OPUS: `vortex.js:9` is a comment; the user-visible strings are five — see P0. And with P1 re-cut, nothing edits `mathworker.js` at all.]**
7. Four questions gained (Q7 DISK/cyclotomy never reached Sol; Q8 the RECONNECTION words; Q9 the 93-reference archive; Q10 the cap after 0.5.3), and the
   review's six ideas are taken as I1–I6 (§2, §5).
Not taken: nothing of substance. Three citations corrected (`molecular-session.js:25`, `library.js:39`, `pwa.test.mjs:313`).

## 0 · One sentence, and the reading of Josh's goal
**0.5.4 is THE CONTRACT LAYER: the identity, convention, status, precision and worker seams that must exist before any result of Sol's programme or the pilot's
verification can land in λWAVES without being a hope — extending what the tree already owns, and putting ONE true string about what is on stage where a reader
meets it.** It builds no mathematics, runs no new chemistry, moves no digest. **[OPUS: Kept — it is the right PRE-MATH. The test I applied to every row: does it put a CONTRACT FIELD where an adapter or the pilot will read it, without changing what any existing reader already relies on? Three rows failed that test as drafted (P1 swapped a stamp four readers rely on; P4 moved Josh's fold; P6 took the only road from module-worker-less browsers) and are re-cut below. And the string's rack seat is the rack window NACRE's question names: "leverage the 'rack window'".]** The reading of Josh's goal and the three readings the plan rests on are DRAFT 0 §0,
unchanged: the paper's contribution is observable-certified reconstruction, not a speedup; the physical programme stays paused; the spec's S:42 "approximation
status" belongs on the glass — and the tree already half-says it (`STATUS: EXACT ANALYTIC` headers ×13, `EXACT` ×11, `NUMERICAL` ×6; the badges' `exact`/`numerical`;
`moleculeHead`; the MODEL sheet), hydrogen-minded. **[OPUS: CONFIRMED (13 files carry EXACT ANALYTIC); the headers also say KNOWN ×3 and DERIVED ×3.]**

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
**[OPUS: corrections and new facts, all measured on `a1508a6`:
(F1′) **Fact 1 is LATENT, not live.** A new geometry is always a new solve: `chemview.js:274` keys on `preset|basis|charge`; `:326` sets `fieldHash = null` on every landing, so `:482` always re-adopts and re-uploads shells; the session refuses an older `solution` (`molecular-session.js:137`); the worker key `mathworker.js:197` already carries every atom's [Z, x, y, z] (it lacks options, and the app varies none). No two of the 38 records share a Z sequence (so no two share a basis hash); the 54-row catalogue is UNMEASURED (it is code, not JSON).
(F6′) `sol.hash` (= the basis hash) is FOUR contracts, not one: the session stamp (`chemview.js:483,491`; `orbitalsview.js:287`; `statesview.js:299`), the worker's reply stamp (`mathworker.js:241,331,340,391,426,455,480`, matched at `statesview.js:627`), FLOW's rebuild key (`chemview.js:506`), and `record()`'s `basis.hash` (`:789`), which `restoreMolecule` refuses on mismatch (`E_BASIS_HASH`, `molecule-state.js:204`).
(F6″) `library-v1` holds **39** molecules (C₂₀H₂₀ and ferrocene have no record; C₆₀ is not in it). C₆₀'s δ = 0 by construction (fact 1 above). **26 of 38** records' `stem.geometrySource` begins "optimised here, UNVERIFIED against experiment". The row `caps` are `orbitals/states/rpa/tdhf` — there is no `density` cap. Water is not a record (it is a live STO-3G solve). 6-31+G* is already LIVE in the app (`molecules.js:510-521`, cap 46 AO, C₂H₄ 2.3 s).
(F11′) The user-visible RECONNECTION strings are five: `vortex.js:27` label "RECONNECTION CENSUS", `:29` title "Jump to the next reconnection time", `:30` "A double root marks a reconnection.", `state.js:458` label "(reconnection)" and note "vortex lines reconnect at ten points"; `vortex.js:9` and `frontier.js:16,473` are comments.
(F12′) Only three chem calls do real work on the frame thread when the worker fails: `chem.ground` (`chemview.js:318` `localSolve`), `chem.open` (`:308`), `chem.rt.fit` (`:457`); every other chem call's fallback is `() => null`. And `chemview.js:322` prints `'solve failed: ' + (r.error || 'no answer')` — a `{ refused }` reply loses its sentence there.
(F13) THE MOLECULES FOLD is Josh's ruling: `chemview.js:222` "2026-10 (Josh) · EVERYTHING BELOW VIEW + ORBITAL sits in `.mol-more`", repeated in CLAUDE.md. `tools/stylehash.mjs` is MIR's (`~/Documents/MIR/tools/`), not λWAVES'. `stage-text.browser-test.mjs:103` pins the caption `'H₂O · 1b1 HOMO · STO-3G'`.]**

## 2 · The rows
Each row: `BRIEF-P<n>.md`, `P<n>-BUILD.md` with "what Josh will see" (or the truth surface added), its owning suites, **its line budget and what it subtracts,
written in the BRIEF before any code** (the review's risk 2), THE LOCK where `lab/` moves, `pwa --write` after every `lab/` edit. Sizes S ≤ 2 h, M ≈ 4 h.
Contract modules import no DOM (the 1.0.0 standalone law: "state independent of UI", C:5472–5496). **[OPUS: + THE STUTTER LAW for this release: nothing a row adds runs in the frame loop except P7a's f64 scratch (n ≤ 768 MACs, reused buffers); the STATUS string is built on a solve landing, a VIEW change or a FLOW toggle and cached.]**

| # | row | what | closer | Δ · model |
|---|---|---|---|---|
| **P0 TRUTH + THE CLAIMS INVENTORY** | the nine contradictions fixed in place (`molecular-session.js:15-17,25`, ~~`worker-pool.js:1-13,55`~~ **[OPUS: worker-pool's header and :55 go to P6, which makes them true — one row per file]**, `state.js:58`, README:82,150, NOTES:98-100, `readouts.js:87` → "qualitative in STO-3G and 6-31+G*" — a string a user reads: named as seen); each producer's energy reference and kernel letter declared in its header (PM-24); the lock's "same-machine" sentence in CLAUDE.md and NOTES; **[OPUS: + `molecular-session.js:25` says what the stamp IS — the basis hash and the solve sequence, geometry riding the sequence (F1′); + P9's header line: `molecular-flow.js` does not cover the frozen-frame step error or the speed cap (R21 §4.9)]** **I2 the claims inventory** `research/release-0.5.4/CLAIMS.md`: every user-visible sentence the programme puts in doubt — the ~~three~~ **[OPUS: five (F11′), comments in a second column]** RECONNECTION words, the FLOW caption, the MODEL sheet (`index.html:128-133` "The register contains the 91 hydrogen basis states" while a molecule owns the field — ~~UNVERIFIED by reading~~ **[OPUS: CONFIRMED :129]**), the EXACT badge over a molecule (`badges.js` has no molecule branch — ~~UNVERIFIED~~ **[OPUS: CONFIRMED: `badges.js:19` b1 is always `exact` 'STATE · EVOLUTION · SHADOW']**) — LISTED, changed by nobody (R11) | node gate; `pwa --write`; the BUILD greps each line | ≤ +5 · Haiku (xhigh) |
| **P1 ~~THE IDENTITY KEY — alone, before P6~~ [OPUS: THE CONTRACT RECORD — identity + conventions as DATA (P2 merged); not a stamp, so not alone]** | ~~one string built in ONE function from the record's `input` (`atomsSha256`, `basisSha256`, `charge`, `multiplicity`, + `model`, + `options`), used by the session stamp (`molecular-session.js:25,103-110,137`), the worker key (`mathworker.js:197`), chemview's adopt (`chemview.js:482-484`) and every producer (`chemview.js:488`, `molecular-register.js:225`) — the SAME string or a valid product is refused as stale (the review's risk 1: THE LOCK is the proof); a mismatch is I3 an `E_IDENTITY` refusal in `molecule-state`'s idiom (a code and a sentence) printed on chemview's `status()`~~ **[OPUS: struck. It guards a latent defect (F1′) and swaps a stamp four readers share (F6′): STATES would go stale on every worker reply and every state link would refuse with `E_BASIS_HASH`. The lock opens H₂O, benzene and lysine (density, lysine's HOMO) and never a packet, STATES, FLOW or `record()`, so it is not the proof. The producers are `chemview.js:495`, `orbitalsview.js:288`, `statesview.js:300`; `molecular-register.js:225` builds a matrix, not a stamp.]** **[OPUS: THE ROW: `identityOf({ atoms, basisHash, charge, multiplicity, model })` → one sha-256 over the record's own `input` members (`atomsSha256` is `library.atomsKey`), a pure function in `molecule-state.js`; `sol.identity` set beside `sol.key` at `chemview.js:326` (the module is loaded by then, `:320`); P2's object in the same file. Read only by P4's capability and P5's export, where the pilot's reader checks that S/T and C/D came from the same atoms. `E_IDENTITY` joins `CODES` for one case: `restoreMolecule` handed a library `record` whose atoms do not hash to its `input.atomsSha256`. No stamp, producer, worker or session line changes.]**; projects keep `{ id, hash, nameKey }` | `rhf-molecules.test`, ~~`molecular-session` cases~~, `library.test`, **[OPUS: `molecule-state.test` (+ identity; the moved-H witness: 0.01 bohr changes the identity and not the basis hash)]**; THE LOCK; serialize-bytes 11/11; `new-project --check` | ~~+30 · Opus~~ **[OPUS: +12 (+15 with P2) · Opus · S–M]** |
| **P2 CONVENTIONS, GATHERED** **[OPUS: merged into P1 — same file, same two readers, one builder]** | no new module: ONE exported object in `molecule-state.js` that REFERENCES what exists (`BASIS_KIND`, `COMPONENT_ORDER_LINE`, `md.rdOf`, `names.CONVENTION`) and adds the three undeclared ones — `kernel: 'D = Σ f c c†; P = W D W'` (`density.js:6-7`), `current: '−Im D, the transpose'` (`molecular-flow.js:5`), `energyRef` per producer (hydrogen absolute, STATES relative to ground, packet absolute ε·t); ~~attached to every product and to P5~~ **[OPUS: read by P4 and P5's `contract` block only: a product is a reused per-frame record whose convention nobody reads, and a new member in `serializeMolecule`'s output would move the bytes its save→restore test pins]**. The sign tests KEEP their literals and assert the object equals them (S:2096: a test that reads the object the code defines proves nothing) | `molecular-flow.test:64,111`, `density.test`, `molecule-state.test` (+ equality) | ~~+25 · Sonnet~~ **[OPUS: in P1]** |
| **P3 ORACLE + STATUS IN THE CATALOGUE** | the catalogue rows of `lab/library.json` (precached, 88 KB, already carrying `caps`) gain `oracle: { what, delta }` and a per-quantity `status` (`energy: MEASURED`, `orbitals: UNCHECKED`, `derivatives: UNKNOWN` …) written by `tools/orbital-library.mjs` from the records' own `oracle` and the fixtures; ≈ 4 KB; readable without opening a 1.2 MB record; `--check` proves it byte-exact. **The app may write MEASURED; CERTIFIED is a mathematical judgment** — only a pilot-signed, content-addressed member may carry it (none this release). Records' bytes and hashes do not move (R3). **[OPUS: (i) +0 lab JS: `molecules.js:508` copies the whole row into `records[basis]`, so P4 reads it at `chemview.js:285`; `library.js` is not edited. (ii) C₆₀'s energy is `IMPORTED` (PySCF's own, δ = 0 by construction), never MEASURED; its field is MEASURED (`fieldMaxAbsErr` 1.1e-16 at 92 points). (iii) + `geometry: 'UNVERIFIED'` for the 26 of 38 (F6″) — R25 §10.1: "A geometry marked draft remains draft even if the orbital image is smooth." (iv) ONE vocabulary: the row's words map to the face's, written once in P4 — MEASURED or IMPORTED → NUMERICAL, UNKNOWN or absent → UNCHECKED, a closed form → EXACT; `library-v1`'s own provenance already says "MEASURED on this machine".]** | `library.test` (+ the rows), `orbital-library --check`, precache ≤ 8 MiB (`pwa.test.mjs:313`); ~~THE LOCK (P3 edits `library.js`)~~ **[OPUS: THE LOCK once (the lock opens benzene and lysine through the catalogue)]** | ~~+30 · Opus~~ **[OPUS: +0 lab · Sonnet@high (tool + data)]** |
| **P4 ONE STRING, THREE SEATS** (I1, R8, R12) | `chem.capability()` (no facade change) returns `{ observables: { density, orbital, flow, states }, limits: { lmax: 2, Z: 36, densityAO: 128, orbitalAO: 768 }, geometry: stem.geometrySource, precision: 'f64 → f32 → f16 texel ≈ 1e-3 ρ', oracle, identity, status }` **[OPUS: + `online`, `cached`, `invalidates` (DRAFT 0 had them; Chapter 12 §12.5: "An eventual adapter should specify what is computed online, what is cached, what invalidates that cache and which bounds survive."), + the row's `caps` (a frontier record has no D, so no density), + `derivatives: 'UNKNOWN'`]** where ~~**the word follows VIEW and the weakest observable on stage sets it**~~ **[OPUS: TWO SLOTS, the badges' own grammar (`badges.js:19-20`: what is exact, what is numerical): the STATE word — EXACT (a closed form), NUMERICAL (a solve checked against an oracle), UNCHECKED (no oracle) — and the PICTURE as a number. "The weakest observable on stage" makes every scene NUMERICAL, hydrogen's too (its FIELD badge is `numerical`), so the word would say nothing. VIEW sets the caveat, not the word.]**: `DENSITY · NUMERICAL · energy agrees with PySCF to 7e-9 Eh · picture good to 0.1 %`; `ORBITAL · NUMERICAL · sign and phase are arbitrary`; `FLOW · NUMERICAL · direction exact, size qualitative`; hydrogen `EXACT`; a record with no oracle `UNCHECKED`. **[OPUS: + `· geometry unverified` on the 26; C₆₀ `· PySCF's orbitals, field checked at 92 points`.]** Three seats from ONE string: ~~(a) a kit `readout({ label: 'STATUS', value, sub })` row on MOLECULES above `.mol-more` (visible on a phone)~~ **[OPUS: (a) a kit `readout({ label: 'STATUS', value, sub })` row in 0.5.3's INFORMATIONAL rack window (beside STAGE FORMULA and ATOM LABELS): the window about what the stage says, a seat for every field owner (hydrogen has none on MOLECULES), no new card so no WORKSPACE row. Not above `.mol-more`: that breaks Josh's fold (F13). If 0.5.3 cuts without the window: the FIRST row inside `.mol-more`, and THE HEAD carries the first-time reader]**; (b) the last line of THE HEAD (`moleculeHead`, `latex-state.js:131`, a pure builder — shows on first pick on any device); (c) the capture caption (`capture.js:575`) **[OPUS: appended where the EXPORT draws it, not in `stageCaption`, whose words `stage-text.browser-test.mjs:103` pins; the short form only: `… · STO-3G · NUMERICAL`]**. ~~The live `Tr(DS)` = N_e and IDEMPOTENCY line (`chemview.js:216-217`) comes out of the fold into the readout's `sub`.~~ **[OPUS: struck — the same ruling; those readouts stay where Josh folded them. + `chemview.js:322` prints `r.refused` (one token; F12′) so P6's sentences are read.]** | `molecule-head` (+ the line), `chem`, a hit-probe of the row at phone and tablet width, ~~`tools/stylehash.mjs` (the card grew)~~ **[OPUS: MIR's `tools/stylehash.mjs` on the INFORMATIONAL window]**, `frame-occlusion`, `lw-facade` 1/1 unchanged, `settings-probe` 0/6 (no key); THE LOCK **[OPUS: + `stage-text` and `molecule-head.browser` unchanged; + a probe that `capability()` is not called inside a frame]** | ~~+60~~ **[OPUS: +40]** · Opus (after P1, P3) |
| **P5 THE EXPORT FOR THE PILOT** (I4, I6) **[OPUS: + P8 merged]** | **first, ask her (Q1) in three lines listing what the app can hand over today**: the `molecule-state` record, S/T/V/M via `md.integrals()` in node, the oracle energies. Then `tools/export-record.mjs <id>` = ~~`chemview.record()`'s record~~ **[OPUS: the same `serializeMolecule` record `chemview.record()` builds, made in node from the library record, or from a node solve for a molecule with no record — water is not a record]** + a `contract` block (identity P1, convention P2, capability P4, oracle P3) + S, T — ≈ 30 lines **[OPUS: + `{ minEig, cond }` of S from `loewdin`'s `eigenvalues` (`density.js:131` already returns them — no `density.js` change); C₆₀ exports as its frontier record (ε, k columns of C, no D) + S/T, and says so]**; `research/release-0.5.4/export/README.md` says what each member is and **what is NOT there** (Hessians, intervals, q, M, derivatives); **I4 `export/REPRODUCE.md`**: build id, tree hash, the lock result, the device matrix (P11), oracle versions — the paper's reproducibility pack (R25 §12.5) | the tool runs for H₂O, C₆H₆, C₆₀; a node test parses the output; a 10-line Python reader (`-I`) shares no engine code **[OPUS: + S/T/V/M of H₂O equal `tests/fixtures/h2o-sto3g-integrals.json` (PySCF) under R_d — the independent oracle, not the full road, which calls the same `oneElectron`]** | +0 lab **[OPUS: +0 (`export` added to `md.js:210`'s declaration)]** · Sonnet |
| **P6 THE WORKER REFUSES** — chem only | an `error` from the chem worker becomes a VISIBLE refusal on `status()` (callers already print `.refused`/`.error`, `chemview.js:337,375`), never a frame-thread rerun: ~~`local()` only when `!chemW.ok` at boot (a Worker-less browser)~~ **[OPUS: `local()` stays for a worker that NEVER answered — `typeof Worker !== 'function'`, a construction throw, or an `onerror` before any reply (a module-worker-less or CSP-blocked browser, whose only road it is; today's `ok` is lazy, never "at boot"); a worker that HAS replied and then errors or times out is refused]**; **`fail()` respawns ONCE and then refuses** (R4) instead of turning the pool dead and silent **[OPUS: and never re-posts the job that killed it; the refusal says the molecule must be picked again — a respawned worker holds no `chemSol`, RT or drive state]**; ~~a cancel epoch (a superseded job's reply is dropped)~~ **[OPUS: struck — it exists at the caller (`solveSeq`, `chemview.js:306,316,321,334,336`); cancelling in the worker would terminate the one instance that holds the RT and drive state (`worker-pool.js:47-48`). PM-17's worker-side cancel → 0.5.5 with a measured need]**; the header and `:55` made true. `maths`/`cards` keep their synchronous roads. **Proof:** a NEW node suite with a fake `spawn` (`createWorkerPool({ busyWrap, spawn })` is injectable) — `local()` calls = 0 under error, timeout and a dead pool **[OPUS: timeouts by `node:test` mock timers, no lab hook; + `local()` = 1 for the never-answered worker]**; ~~and `tools/perf/worker-timeout.mjs`: the longest rAF gap and `longtask` across a FORCED chem timeout before vs after (the ms/s pair cannot see it)~~ **[OPUS: struck — the 300 s ceiling (`:49`) is hard-coded, so forcing it needs a lab hook, and a removed `local()` is proven structurally by the node suite. Instead ONE browser case on the live error road: `__LW.chem`'s `api.solve` with an unknown op and a counting fallback → `{ refused }`, fallback calls 0]**. Frame-path row → P-V's fresh verifier. | the new `worker-pool.test`; ~~the forced-timeout probe~~ **[OPUS: the browser case]**; `history`, `new-project.browser`, `register`; THE LOCK | ~~+40~~ **[OPUS: +20]** · Opus ~~(after P1)~~ |
| **P7 PRECISION DISCIPLINE** | (a) the ORBITAL packet accumulates in f64, casts once (`orbitalsview.js:270-275`) — hygiene (≈ 2e-5 worst case vs the 1e-3 texel, ESTIMATE); THE LOCK proves packets are outside it or the row reports; (b) `T_MAX` DECLARED in `clock.js`'s header, ~~`scrub(t)` clamped to it,~~ **[OPUS: struck — a silent clamp is what S:1808 forbids ("Quality may not silently change the state or evolution law"), and no road reaches 2⁵³·dt]** a node test shows `t += dt` losing dt beyond 2⁵³·dt — no sentence, no frame-path branch; (c) **the standing field law** `tests/field-law.browser-test.mjs`: hydrogen voxels vs the closed form (2e-5, README:79) and water's density vs the f64 oracle (`molecular-field.js:59`) through `sampleVoxel`/`readGrid` at the texel's 1e-3 — two laws; (d) **I5 the view-invariance gate**: exposure, ISO, palette, grid, quality never change ~~the published matrix hash~~ **[OPUS: no such hash exists; observe the worker's `solverCalls` (`chem.workerStat()`), `sol.seq`]** or `Tr(DS)` (R25 §10.1) — one browser case | THE LOCK after (a); `clock.test` (new); the field law 2/2; the invariance case | ~~+25~~ **[OPUS: +6 lab (tests uncounted)]** · Opus |
| **P8 ONE-ELECTRON EXPORT + CONDITIONING REPORTED** **[OPUS: merged into P5]** | `md.js` exports `oneElectron(basis, atoms)` → `{ S, T, V, M }` (`:210`; `integrals()` :453-458 unchanged); no worker op (P5 calls it in node; nothing in the app asks); `loewdin` REPORTS `{ minEig, cond }` ~~into the capability (P4)~~ **[OPUS: into the export and the catalogue rows, computed offline from the eigenvalues it already returns; the live capability needs no conditioning while nothing refuses on it]** — **no refusal floor** (the pilot's number, Q1); the BUILD measures cond over the 38 records so the number has a baseline | `md.test` (+ S/T equal to the full road's **[OPUS: and to the PySCF fixture]**), `density.test`, `library.test` | ~~+15 · Sonnet~~ **[OPUS: in P5]** |
| **P9 FLOW'S NUMBERS, TRACKED** **[OPUS: merged into P10; its header line into P0]** | tests only: the continuity residual and the current/dipole ratio pinned in `tests/molecular-flow.test.mjs` with a tolerance, not a target; the frozen-frame step error named in the module header as not covered (R21 §4.9). The floor taper is DEFERRED until the pilot names the margin her certificate assumes (Q1). | `molecular-flow.test` | +0 lab · Sonnet |
| **P10 THE ORACLES, DESCRIBED + THREE NODE SUITES** | `tests/fixtures/oracles/README.md` describes the three fixture files that exist (PySCF version, `cart=True`, the R_d transform `md.js:3-5,508`, geometry in bohr, tolerances, the generating script) **[OPUS: + `tests/fixtures/h2o-*.json`; `library-v1` holds 39 molecules, not 38]**; three node suites, no `lab/` change: huge-time phase against `clockAutocorr` (`frontier.js:636`) for unstructured t; the angular q-band through `coaxialPolynomial` (`frontier.js:415`) **[OPUS: an ANCHOR, not a judgment: a disagreement with Sol's count is reported to the pilot, never "fixed"]**; the continuity residual (P9). PM-13's graph current model is dropped, said so. | the suites green; `bash test.sh node` | +0 lab · Sonnet |
| **P11 THE LOCK'S SCOPE + THE MATRIX** | the ruling written (R7): 860 + 1004 stay at 0/0 (the 1004 fixture WITH `--query gastab=0`, CLAUDE.md:316); a math row never re-bakes; same-machine; past 64 AO nothing is locked; `tools/perf/device-report.js` gains a DIGEST ~~MATRIX row (adapter, driver, browser, `shader-f16` granted or not — `gpu-boot.js` never requests it — and the 860 values)~~ **[OPUS: FINGERPRINT row: adapter, driver, browser, features (`shader-f16` offered — `gpu-boot.js:42` requests limits only), limits, and `fieldDigest` of two states at 64³ (1s+2pz, H₂O). The 860 come from `digest-lock.mjs`'s CDP harness; the report runs inside the page — re-hosting the lock there is an M row for no paper gain]** so machines are COMPARED, none a lock. `tools/` only. | the report on the healthy rig; `digest-lock --check` ×2 unchanged | +0 lab · Sonnet |
| **P12 THE FACTOR SEAM** | **STRUCK from 0.5.4 → 0.5.5's first row** (R5): a representation row under the pause; benchmark first (`tools/perf/s4c-kernel.mjs` exists); the ledger does not pay. 0.5.5's brief inherits DRAFT 0's P12 text. | — | 0 |
| **P13 THREE 6-31+G\* RECORDS** (R6, Q3) | H₂O (23 AO), H₂CO (42), + one of N₂ (38) / CH₃OH (46) / C₂H₄ (46) — all in the 19-molecule oracle; written by `tools/orbital-library.mjs` with their catalogue rows (P3); Josh's N:23–26 already asks for the caching; N:30's count honoured. Records outside the precache; `library.json` 38 → 41 **[OPUS: not PRE-MATH: all three already solve live in ≤ 2.3 s, and the pilot's Python can run PySCF on them; the row is Josh's standing caching ask. The tool is STO-3G-shaped (`orbital-library.mjs:411` names `sto-3g-v1.json`): M. `chem.open` on a non-STO-3G record is untested]** | `library.test`, `orbital-library --check`, the MOLECULES select, the `6-31+g-star-v1` oracle | +0 lab · Opus · **Josh's word** |
| **P-V** | one fresh Opus verifier: THE LOCK 860 + 1004 · 0/0; serialize-bytes 11/11 vs 0.5.3's cut; `new-project --check`; `settings-probe` 0/6; `lw-facade` 1/1; the field law; the view-invariance case; ~~the forced-timeout probe (its scenes written out)~~ **[OPUS: the worker-refusal browser case + a Worker-less run (MOLECULES still solves, on the frame thread)]**; STATUS probed at phone and tablet width; `tools/stylehash.mjs` **[OPUS: MIR's]**; the estate + the boot suite alone; the line law; CLAUDE.md against the tree; the export parsed by the Python reader — FIT / NOT FIT → a fix round → the local cut on Josh's word | — | — |

## 3 · The gates
**G-N** node gate 0 after every row. **G-L** THE LOCK at every row that edits `lab/`: P0, P1, ~~P2,~~ P3, P4, P6, P7, ~~P8~~ **[OPUS: P5 (the `md.js` keyword)]** — never re-baked (R7). **G-B** serialize-bytes 11/11
(no project key; identity and capability are derived). **G-P** `settings-probe` 0/6 (no PREFERENCE key). **G-W** `lw-facade` 1/1 unchanged. **G-F** the field law and
the invariance case from P7 on. **G-T** ~~the forced-timeout probe for P6 (longest rAF gap and longtask, before vs after)~~ **[OPUS: P6's node suite + its browser case]**; the ms/s pair ~~≤ 3.536~~ **[OPUS: |Δ median| ≤ 3.536 ms/s vs 0.5.3's cut, boot and D1 scenes, interleaved 5 + 5 (it is a pair delta, not a ceiling)]** at P-V. **G-Lines** the cap
after 0.5.3 (Q10; ≤ 28,504); the ledger ~~≈ +230 (P0 5 · P1 30 · P2 25 · P3 30 · P4 60 · P6 40 · P7 25 · P8 15; ESTIMATE)~~ **[OPUS: ≈ +98 (P0 5 · P1 27 · P4 40 · P6 20 · P7 6 · P5 0 · P3 0; ESTIMATE, Part B §6)]**; every BRIEF states its lines and what it
subtracts; a builder stops to report at 1.5×. **G-Bytes** precache ≤ 8 MiB. **G-Export** P5's JSON round-trips through a reader sharing no engine code. **G-M** every
builder re-runs `pwa --write` after rebasing on the merged tip. **[OPUS: **G-Frame** no row adds a call inside the frame loop but P7a (the stutter law, §2).]**

## 4 · Order
~~P0 (Haiku, docs) and **P1 ALONE** (the identity string before anything keys on it) first, in that order. Then **PAIR A** {P2 + P3 + P4 …} ∥ {P6 …}. Then **PAIR B** {P5 + P8 + P10 …} ∥ {P7 + P9 …}. P11 any time (tools only). P13 after PAIR A on Josh's word.~~ **[OPUS: P1 no longer keys anything, so nothing is alone. **STEP 1** P0 (Haiku: headers, docs, CLAIMS.md) ∥ P3 (Sonnet: tool + `library.json`) — disjoint. **STEP 2** PAIR A {P1 → P4: `molecule-state`, `chemview` (:326, :322, capability), `latex-state`, `capture`, the INFORMATIONAL window's file} ∥ PAIR B {P6 → P7: `worker-pool`, `orbitalsview`, `clock`, new tests} — disjoint (Part B §3). **STEP 3** PAIR C {P5 + P10 + P11: `md.js` keyword, `tools/`, `tests/`, `export/`} (after P1, P3). P13 after P3 on Josh's word.]** Then P-V, a fix round, the cut. ~~Opus: P1, P3, P4, P6, P7, P13, P-V; Sonnet: P2, P5, P8, P9, P10, P11; Haiku: P0. ≈ 6 builders ≈ 30 builder-hours ≈ 2 relay days.~~ **[OPUS: Opus: PAIR A, PAIR B, P13, P-V; Sonnet@high: P3, PAIR C; Haiku (xhigh): P0. 5 builders ≈ 22 builder-hours ≈ 1½ relay days.]** Every builder: `isolation: "worktree"`, `git reset --hard <tip>`, no push.

## 5 · What Josh will see
ONE STATUS string wherever the molecule is named — ~~on the MOLECULES card~~ **[OPUS: in the INFORMATIONAL rack window (for hydrogen too)]**, at the foot of THE HEAD, in every capture caption — saying what VIEW is showing and how
far to trust it, in plain words (`DENSITY · NUMERICAL · energy agrees with PySCF to 7e-9 Eh · picture good to 0.1 %`), ~~with the electron count beside it~~ **[OPUS: struck with the un-fold]**; a MOLECULES
action that says "refused: …" instead of silently running on the frame thread; three 6-31+G* molecules if he rules them in; a folder `research/release-0.5.4/export/`
with water, benzene and C₆₀ as JSON the pilot can read, and a REPRODUCE sheet for the paper. Below the glass: the identity, the gathered conventions, the catalogue's
oracle column, the field law, the view-invariance gate, the tracked FLOW numbers, the claims inventory.

## 6 · What is not claimed
No mathematics is implemented or judged. No DFT, ChronusQ, WASM, compiler, kernel registry, EIGENMORPH, sieve, quasicrystal, synthesizer, DISK/cyclotomy (Q7) or
wave indexing (N:27-29: P1 + P3 are its seams; 0.6.x). No containment, Hessian, interval or tube. No PHASECLOCK rewrite (R9). No factor seam (0.5.5). No floor taper
until the pilot names the margin. No re-bake, no speedup claim, no cross-device lock. **The texel stays the error budget BY CHOICE** (PM-7: an f32 science buffer or
the spare `.b/.a` channels would let a numeric oracle separate shader error from f16 storage — deferred; the field law measures the whole path). The certified ORB
screen (PM-22) is seven orders under the texel — not planned. Derivatives are `UNKNOWN`, never `false`. No RECONNECTION word changes (R11). No `CERTIFIED` this release.
**[OPUS: + No identity refusal on the frame road (the defect is latent, F1′). + No worker-side cancel (PM-17, 0.5.5). + No projector or derivative format (PM-4, PM-5). + P10's q-band suite verifies our code against Sol's count, not Sol's proof.]**

## 7 · RULINGS TAKEN AS DEFAULTS (Josh may flip any)
- **R1 the name** — Josh's. Offered: "Contract Layer", "Truth Seams", "Status Line". **R2 the pause holds.** **R3 catalogue rows, not sidecars or schema 2**; record
  bytes and hashes do not move. **R4 the worker refuses**: chem only; error → visible refusal; `fail()` respawns once, then refuses; the Worker-less browser keeps
  its road **[OPUS: — "Worker-less" meaning a worker that never answered (P6)]**. **R5 the factor seam is 0.5.5's first row.** **R6 6-31+G\***: H₂O, H₂CO + one more, on Josh's word. **R7 the lock** stays, same-machine, never re-baked by a
  math row, the 1004 fixture with `--query gastab=0`; a ~~matrix~~ **[OPUS: fingerprint]** report. **R8 the face**: one string, three seats ~~(card, head, caption)~~ **[OPUS: (the INFORMATIONAL rack window, THE HEAD, the export caption)]**; no window **[OPUS: of its own]**, no key, no badge.
  **R9 PHASECLOCK deferred**; `T_MAX` declared, ~~`scrub` clamped,~~ no refusal **[OPUS: , no clamp]**. **R10 the DFT/ChronusQ tension** stands until Josh rules (spec S:2310/S:1507 vs C:1854).
  **R11 the RECONNECTION words stay** until the pilot classifies; P0 lists them. **R12 the vocabulary** EXACT / NUMERICAL / UNCHECKED (the tree's) is the default;
  the wording is Josh's. **[OPUS: **R13 the identity is data**, never a stamp: `sol.hash` stays the basis hash for its four readers. **R14 the word's grammar**: two slots, STATE word + PICTURE number, VIEW adds a caveat.]**

## 8 · Questions (the defaults stand meanwhile)
- **Q1 the pilot** (BEFORE P5/P8/P9 are briefed): what she wants from the app — today it can hand over the `molecule-state` record, S/T/V/M via `integrals()`, the
  oracle energies; and what floor margin and overlap-conditioning number her certificates assume.
- **Q2** DFT/ChronusQ: still "definitely go forward", and if so 0.6.0 as Sol's ladder says, or inside this plan?
- **Q3** 6-31+G\*: H₂O, H₂CO and which third — N₂, CH₃OH or C₂H₄ — or none until the programme resumes?
- **Q4** answered by the tree: the factor seam is 0.5.5 (the ledger). **Q5** ~~answered: card row + head line + caption (badges are off on first run; a card moves
  bytes; a switch adds a key)~~ **[OPUS: re-answered: the INFORMATIONAL rack window + head + caption (Josh's fold forbids the card row; badges are off on first run; a new card moves bytes; a switch adds a key)]**. **Q6** the name.
- **Q7** DISK / cyclotomy (N:35–37) never reached Sol (CHAT §0.2): hand it to the pilot, to Sol, or keep it for 0.6.x?
- **Q8** the RECONNECTION words: keep until the pilot classifies (R11), or rename now to "double root"?
- **Q9** the 93-reference archive (C:5030–5039, unseen by every survey): where does it live, and does Josh want `docs/REFERENCES.md`?
- **Q10** the cap: 0.5.3's cut line count sets it (≤ 28,504).
- **[OPUS: Q11** the ROUTE to the pilot: she is another session and left no prose (PILOT-AUDIT §5); Q1 goes through Josh — one message, before STEP 3. **Q12** the INFORMATIONAL window as 0.5.3 cuts it: does it take a readout row, and is it open on a first run (on a phone it is folded)? Read at BRIEF-P4 time. **Q13** STATUS for every field owner (hydrogen EXACT too), or only while a molecule owns the field?**]**

## 9 · Josh's words (verbatim)
> A pilot Opus 5.5 started work on verifying GPT-6.1 Sol's work. She will continue working on the math on our behalf. However, feel free to do a round, but not
> like what the skill.md says but rather the 'nacre ultrathink planning' method with the Claude model family (it was an old prompt somewhere).
> The folder is called 'Lamb of Waves' in Documents > Obsidian
> **[OPUS: + from NACRE.md's question: "how to make this user friendly (leverage the 'rack window')" — the reason for R8's seat.]**

---

# PART B — THE AUDIT NOTES

## 1 · The edits that matter, ranked
1. **P1 re-cut: identity as DATA, the stamp untouched.** DRAFT 1 would have swapped `sol.hash`, which is four contracts (F6′): STATES goes stale on every worker reply (`statesview.js:627` vs `mathworker.js:331…480`) and every state link refuses `E_BASIS_HASH` (`chemview.js:789` → `molecule-state.js:204`). The lock sees neither. The defect it guarded is latent (F1′). This also dissolves "P1 alone" and the `mathworker.js` overlap.
2. **P4's rack seat is the INFORMATIONAL window, not MOLECULES above the fold.** Josh ruled the fold (`chemview.js:222`); DRAFT 1 added a row above it and pulled Tr(DS) out. The window is NACRE's "rack window", speaks for every field owner, and adds no card.
3. **P4's word: two slots, not "the weakest observable".** As written every scene is NUMERICAL (the picture is always f16), so the word is noise. STATE word + PICTURE number is the badges' grammar a reader already has.
4. **P6 keeps the frame-thread road for a worker that never answered.** Refusing there would leave a module-worker-less browser with no MOLECULES at all. Refuse only after a reply; respawn once; never re-post the killer job; fix the swallowed refusal at `chemview.js:322`.
5. **P6's proof: node suite (mock timers) + one deterministic browser error case.** The rAF probe needs a lab hook to force a 300 s timeout; the structural proof (`local()` = 0) is stronger.
6. **The cancel epoch and the worker-key options are struck** (PM-17, PM-18): `solveSeq` already drops superseded replies; the key already holds atoms; a worker cancel would destroy RT state.
7. **C₆₀ and the 26 unverified geometries must not read as checked** (P3 ii–iii; R25 §10.1).
8. **Capability regains `online / cached / invalidates`** — the one thing Chapter 12 §12.5 names, dropped between drafts.
9. **P3 is +0 lab JS; P8 folds into P5; P9 into P10/P0; P2 into P1.** The ledger falls from ≈ +230 to ≈ +98.
10. **No silent clamp** (P7b; S:1808); the caption change lands in the export, not in the pinned `stageCaption`.

## 2 · Citation table (DRAFT 1 §1–§2, on `a1508a6`)
| citation | verdict |
|---|---|
| `molecule-state.js` exports :31-39 (`SCHEMA`, `BASIS_KIND` :32, `COMPONENT_ORDER_LINE` :33, `CODES` :34, `MoleculeStateError` :39), `serializeMolecule` :129, `restoreMolecule` :190 | CONFIRMED |
| `library.js:5` schema/ignore, `:15` `atomsKey`, `:39` FRONTIER | CONFIRMED |
| `library.json` 38 rows, 87,979 B, `caps` | CONFIRMED; caps are `orbitals/states/rpa/tdhf` (no `density`) |
| records' `oracle` 38/38, max \|δ\| 6.93e-9 | CONFIRMED; members also `fieldMaxAbsErr` (C₆₀); C₆₀ δ = 0 by construction |
| records' `input` members (8) incl. `multiplicity` | CONFIRMED (38/38 carry it) |
| `molecular-session.js:15-17` ranks, `:25` stamp, `:42`, `:45`, `:103-110` adopt, `:137` | CONFIRMED |
| `mathworker.js:150` refused/error, `:194-195` Refused, `:197` keyOf | CONFIRMED |
| `worker-pool.js:1-13`, `:16`, `:20` `fail`, `:49` 300 s, `:55`, `:56-59` | CONFIRMED (62 lines; `ok` is lazy) |
| `chemview.js:216-217`, `:337`, `:375`, `:482-488`, `:762-768` | CONFIRMED; the publish is `:495`; `record()` is `:785` |
| `molecular-register.js:225` "producer" | WRONG as a producer: it builds the matrix; publishers are `chemview.js:495`, `orbitalsview.js:288`, `statesview.js:300` |
| `latex-state.js:131` `moleculeHead`; `capture.js:575` `drawCaption`; `facade.js:18` `chem: app.state.chem` (pinned `value`) | CONFIRMED |
| `md.js:3-5`, `:210` (unexported), `:453-458`, `:508` `rdOf`; `names.js:115` `CONVENTION` | CONFIRMED |
| `density.js:6-7`, `:62`, `:125-131` (returns `eigenvalues`) | CONFIRMED |
| `orbitalsview.js:270-275`; `clock.js:14`, `:35-41` | CONFIRMED |
| `molecular-flow.js:5`, `:25`, `:39`, `:52` | CONFIRMED |
| `field.js:24`, `:161-164`, `:742-749`, `:754`, `:1441-1444` | CONFIRMED |
| `digest-lock.mjs:13-24` (states incl. H₂O, benzene, lysine), `:42` | CONFIRMED |
| `gpu-boot.js:42` (limits only; 0 `shader-f16`) | CONFIRMED |
| `vortex.js:9,30`; `state.js:458` | `:30`, `:458` CONFIRMED; `:9` is a comment; MISSING `vortex.js:27`, `:29` |
| `state.js:58`; `readouts.js:87` | CONFIRMED |
| `index.html:128-133`; `badges.js` molecule branch | CONFIRMED; no branch (b1 `exact` at `:19`) |
| `tests/fixtures/oracles/*` "library-v1 (38)" | WRONG: 39 molecules; `6-31+g-star-v1` 19 ✓; `sto-3g-v1` 6 + 2 + 54 + scans |
| 6-31+G* AO counts H₂O 23 · H₂CO 42 · N₂ 38 · CH₃OH 46 · C₂H₄ 46; benzene 126 | CONFIRMED (fixture `nAO`; `molecules.js:518` rule) |
| `molecules.js:514,521` | CONFIRMED |
| `tools/orbital-library.mjs`, `new-project.mjs`, `perf/device-report.js`, `perf/main-thread.mjs` | exist; `main-thread.mjs` scenes boot + `--setup` (no chem timeout) CONFIRMED |
| `tools/stylehash.mjs` | WRONG path: MIR's tool |
| `pwa.test.mjs:313`; `sw.js:404-439` | CONFIRMED |
| 27,943 lines | CONFIRMED |
| owning suites `worker-pool.test`, `clock.test`, `molecular-session` | none exist (123 files in `tests/`) |

## 3 · The overlap matrix (after the edits; ✎ = edits)
| file | P0 | P1 | P3 | P4 | P5 | P6 | P7 | P10/P11 | P13 |
|---|---|---|---|---|---|---|---|---|---|
| `molecular-session.js` | ✎ header | | | | | | | | |
| `molecule-state.js` | | ✎ | | | | | | | |
| `chemview.js` | | ✎ :326 | | ✎ cap., :322 | | | | | |
| `latex-state.js`, `capture.js`, INFORMATIONAL window | | | | ✎ | | | | | |
| `worker-pool.js` | | | | | | ✎ | | | |
| `orbitalsview.js` | ✎ header | | | | | | ✎ :270-275 | | |
| `clock.js` | | | | | | | ✎ header | | |
| `molecular-flow.js`, `density.js`, `state.js`, `molecular-register.js` | ✎ headers | | | | | | | | |
| `md.js` | | | | | ✎ keyword | | | | |
| `lab/library.json`, `tools/orbital-library.mjs` | | | ✎ | | | | | | ✎ |
| `tools/`, `tests/`, `export/` | | | | | ✎ | ✎ test | ✎ tests | ✎ | |
Overlaps: P1/P4 on `chemview.js` (one builder, PAIR A); P0/P7 on `orbitalsview.js` (P0 first); P3/P13 (serial). PAIR A ∥ PAIR B share no file.

## 4 · PM-1…PM-24 and CODEX §3.9/§5 → row
| item | row | item | row |
|---|---|---|---|
| PM-1 envelope | P3 (status subset; full envelope with the first CERTIFIED member) | PM-13 node oracles | P10 (graph current dropped) |
| PM-2 identity | P1 (data) | PM-14 lock ruling | P11, R7 |
| PM-3 convention | P1 (P2 merged) | PM-15 byte laws | gates |
| PM-4 derivative format | MISSING · deferred (`UNKNOWN` in P3/P4) | PM-16 refuse | P6 |
| PM-5 projector format | MISSING · deferred (0.6.x) | PM-17 cancel/epoch | STRUCK: caller has `solveSeq`; worker cancel 0.5.5 |
| PM-6 PHASECLOCK | P7b (declare) · R9 | PM-18 key options | STRUCK: key has atoms; identity carries `model` |
| PM-7 f32 buffer / `.b/.a` | deferred, §6 | PM-19 schema | R3 |
| PM-8 f64 packet | P7a | PM-20 6-31+G* | P13 |
| PM-9 conditioning | P5 (report only) | PM-21 factor kind | → 0.5.5 |
| PM-10 one-electron | P5 (P8 merged) | PM-22 certified screen | not planned, §6 |
| PM-11 field law | P7c | PM-23 header truths | P0 |
| PM-12 manifest | P10 | PM-24 energy reference | P0 headers + P1 `energyRef` |
| §12.5 online/cached/invalidates | P4 (restored) | §12.5 orbitals/density/response/derivatives | P4 `caps` + `derivatives` |
| §10.6 evidence per operation | P4 per-observable caveat | §12.2 four gates | P4 (reconstruction, FLOW); forces/acceleration N/A, §6 |
| §5 runtime precision on the device | P7c (rig) + P11 (devices) | §10.1 draft geometry; occupations under view knobs | P3 iii; P7d |

## 5 · Sizing and model
P0 S · Haiku xhigh. P3 S · Sonnet@high (data, no judgment once the mapping is written). PAIR A (P1 S–M + P4 M) · Opus: the face is the release's one glass change. PAIR B (P6 M + P7 S+S+M) · Opus: frame-path and GPU law. PAIR C (P5 S + P10 S + P11 S) · Sonnet@high. P13 M · Opus. P-V · one fresh Opus. No Sol. MATH-flavoured parts left: P10's q-band anchor (report, never fix) and P3's CERTIFIED rule (none written). Stutter risks left: P7a (n ≤ 768 f64 MACs a frame, reused buffers) and P4 if `capability()` slipped into the loop (G-Frame).

## 6 · The line ledger as I count it (`lab/*.js` + shell + windows; ESTIMATE)
P0 +5 · P1 +12 · P2 (in P1) +15 · P3 0 · P4 +40 (capability ≈ 25, head 3, caption 2, readout 8, :322 0) · P5 0 · P6 +20 · P7 +6 · P10/P11 0 · P13 0 → **≈ +98** (call it +100).
Cap: 28,504 only if 0.5.3 lands at its cap; 0.5.3's own estimate (+122 → 28,065) gives 28,345, minus whatever the INFORMATIONAL window costs 0.5.3. Headroom ≈ +180–280 against ≈ +100: credible. DRAFT 1's +230 counted test files and over-priced P1 (+30), P3 (+30), P7 (+25).

## 7 · Struck, deferred, kept
Struck: P1's stamp swap and frame-road `E_IDENTITY`; the STATUS row above `.mol-more` and the Tr(DS) un-fold; "the weakest observable sets the word"; P6's cancel epoch, worker-key options, `local()` "at boot" and the rAF timeout probe; P7b's clamp; "attached to every product"; P11's 860-value matrix. Deferred: PM-4, PM-5, PM-7, PM-17 (worker cancel), PM-21 (0.5.5), PM-22; the FLOW taper and any conditioning floor (Q1). Merged: P2→P1, P8→P5, P9→P10/P0. Kept: P0, P3 (re-priced), P4 (re-seated), P5, P6 (re-cut), P7a/c/d, P10, P11 (narrowed), P13 on Josh's word.

## 8 · The three things most likely to go wrong in the build
1. **P6 kills MOLECULES on a browser whose module worker never loads**, or swallows its own refusal (`chemview.js:322`). Guard: the never-answered rule, the Worker-less P-V run, the `:322` token in PAIR A's diff.
2. **P4 lands a seat that does not exist or moves a pinned string.** The INFORMATIONAL window is 0.5.3's and not on this tree; `stage-text:103` pins the caption. Guard: BRIEF-P4 reads 0.5.3's cut first (Q12); the fallback seat is written; the caption is appended at export only.
3. **The face over-claims**: "agrees with PySCF" on C₆₀ (δ = 0 by construction), silence on the 26 unverified geometries, or MEASURED written where the app never computed the number. Guard: P3's mapping table in the BRIEF, a `library.test` case per rule (C₆₀ IMPORTED; one UNVERIFIED geometry).

## 9 · The exact next step
Fable writes **PLAN-DRAFT-2** from Part A, taking R13 and R14 as defaults, the order of §4 (STEP 1 P0 ∥ P3), and Q11–Q13. Before any BRIEF: (1) Josh relays Q1 to the pilot (Q11); (2) the integrator reads 0.5.3's INFORMATIONAL window as cut (Q12) and 0.5.3's line count (Q10). Then Sonnet@high's junior pass on DRAFT 2.
