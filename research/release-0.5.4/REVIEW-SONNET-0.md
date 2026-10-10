Sat Oct 10 05:26:19 PM CDT 2026
# REVIEW-SONNET-0 · first reviewer of PLAN-DRAFT-0 for 0.5.4 PRE-MATH (Sonnet 5.5, 2026-10-10)

Read whole: `NACRE.md`, `PLAN-DRAFT-0.md` (140), the four surveys (984 lines), `CLAUDE.md` (395), `docs/STATE-SCOPES.md`, `docs/NOTES-FOR-AGENTS.md`; shape from `release-0.5.0/REVIEW-SONNET-0.md`.
Checked on the tree at `ed00aa2` (its `lab/` is v0.5.2-alpha) with grep, sed, wc, ls and three read-only `node -e` JSON reads (`lab/library/*.json`, `lab/library.json`, `tests/fixtures/oracles/*`). No suite, browser, server, Python or git write.
Tags: KEEP / CHANGE / STRIKE for rows; CONFIRMED / MOVED / WRONG / MISSING for facts. `D` = the draft; C:/N:/S: = CHAT-AND-ASKS codes. Where I estimate, I say ESTIMATE.

## 0 · Verdict (three sentences)
"The contract layer" is the right reading of PRE-MATH: it is Sol's own architecture (the survey's list of what "a small collection of contracts" a model declares: basis, operators, observables, symmetries, precision, provenance, C:4569) and the only thing the pilot's work needs from the app, and it keeps the pause (R2) and the lock.
But the draft builds from scratch what the tree already owns, and several of its facts are false against the tree: all 38 library records already carry an independent PySCF `oracle` energy (max |Δ| 6.9e-9 Eh), `lab/molecule-state.js` plus `chemview.record()` already are a validated record with named `E_*` refusals, the stage badges and `moleculeHead` already speak status, and benzene in 6-31+G* is 126 AO against a 46-AO cap.
The one thing I would change first: make P3/P4/P5 read and extend what exists (catalogue rows, not sidecar files; `__LW.chem.capability()`, not a new facade key; the pilot's JSON is the `molecule-state` record plus a `contract` block) and make the STATUS word follow the VIEW observable in the tree's own EXACT / NUMERICAL vocabulary, before any builder starts.

## 1 · Missed spots (each item to its row, or MISSING)
| source | item | row | note |
|---|---|---|---|
| N:35–37 | "much larger atom/electron count, heavier atoms … We can research cyclotomy and our own 'DISK' corpus for some engine saving framing features because the lower orbitals are gonna go nuts" | **MISSING** | no row, no question, not in D §6; CHAT §0.2: it never reached Sol. Not a PRE-MATH build, but name it in §6 and ask it (my Q7). The capability record should state the engine's real limits (`lmax 2`, Z ≤ 36, 128 AO density, 768 AO orbital: `md.js:1`, `field.js:742-743`) so "heavier atoms" has a visible edge |
| N:27–29 | wave indexing of presolved orbitals, Taylor 3D shells | MISSING (right to defer) | say in §6 that P1 + P3 are its seams; the feature is 0.6.x |
| N:31–34 | layouts, biology, bucky-ball | done in 0.4.0 | the 38 records hold the amino acids, nucleobases, cubane, adamantane, C60; layouts (vertical periodic table, lattices) are UI, not PRE-MATH |
| N:23–26, N:30 | 6-31+G* ladder names, "Caching these will be useful for future informationals"; "Don't try to go for too many variations of the same molecule, try to be as diverse as possible." | P13 | names are S1 (`names.js`); P13's molecule list is wrong (§2) |
| C:1854 | "There will be a research paper along side the public 1.0.0 release of lambdawaves so be ambitious." | no row | P5 + P10 + P11 are the paper's reproducibility pack; nothing ties them (my idea I4) |
| C:5015 | "Continue adding more sources to the references, I want to keep them all" | **MISSING** | the draft takes the 3-word registry (C:5179–5203) and none of the 93-reference archive; every survey says the zip is unseen; ask where it lives (Q9) |
| C:5397, S:1861 | 1.0.0 standalone, iPad later | partial | "state independent of UI" is the contract layer; add the law that contract modules import no DOM |
| C:4569 | operators and observables in the capability record | **MISSING** | P4 has basis, precision, provenance; no `observables`, and that is the one that matters (P4, §2) |
| ENGINE PM-1,2,3 | envelope, identity, convention | P3, P1, P2 | P3 changed (§2) |
| PM-4, PM-5 | derivative format, projector format | MISSING, right to defer | but P4 writes `derivatives: false`; Sol: "Unknown derivative error remains unknown" (R15), so write `'UNKNOWN'` |
| PM-6, PM-8..PM-14 | PHASECLOCK, f64 packet, conditioning, one-electron, field law, manifest, oracles, lock | P7b, P7a, P8, P8, P7c, P10, P10, P11 | PM-13's fourth (graph current model) is rightly dropped: say so |
| PM-7 | f32 scientific buffer / the spare `.b/.a` | MISSING, right to defer | §6 must say the texel stays the budget BY CHOICE (the field law cannot separate f32 shader error from f16 storage) |
| PM-15..21, 23, 24 | byte laws; worker refuse / epoch / key; schema; 6-31+G*; factor; headers | gates, P6, P1, R3, P13, P12, P0 | covered |
| PM-22 | certified ORB screen | MISSING | the cut is ≈1e-10 on an AO, seven orders under the texel (1e-3): write "below the texel, not planned" |
| CODEX §3.9 | the four application gates (reconstruction, FLOW, forces, acceleration): "Passing one gate does not silently pass the others" | P4 | P4 collapses them to ONE word (§2, P4) |
| CODEX §3.7 | FLOW gate: floor, Lipschitz, time-hold, containment | P9 | P9 takes only the floor; the rest is the pilot's (PILOT-AUDIT §4) |
| **outside the surveys** | the app says RECONNECTION: `vortex.js:27` "RECONNECTION CENSUS", `:30` "A double root marks a reconnection.", `state.js:458` preset "(reconnection)": "vortex lines reconnect at ten points" | **MISSING** | Sol's audit (C:2802): "An angular double root does not necessarily mean that two spatial vortex lines reconnect"; the survey records Sol calling the correction a publication prerequisite (C:5356). D's P0 fixes nine smaller untruths and misses this one. P0 should LIST these three, change nothing; renaming is Josh's word (my R11) |

## 2 · Row by row
| row | verdict | why (one or two sentences) |
|---|---|---|
| **P0** | KEEP, CHANGE | Right and cheap. Add: `worker-pool.js:1-13` header says "timing out to the frame thread's road" too; the stage MODEL sheet (`index.html:128-133`) says "The register contains the 91 hydrogen basis states" while a molecule owns the field, and `badges.js` has no molecule branch (read, not run: UNVERIFIED); list the RECONNECTION words (§1). The FLOW caption (`readouts.js:87`) is a string a user reads, so P0 is not "nothing Josh sees": name it. Not MATH; moves no digest; `pwa --write`. |
| **P1** | KEEP, CHANGE | Right (a stamp that says "geometry" and hashes none). Build the key from what a record's `input` already stores (`atomsSha256`, `basisSha256`, `charge`, `multiplicity`); D omits multiplicity. Refuse in `molecule-state`'s own idiom (`E_IDENTITY`, a code and a sentence) and show it on chemview's existing `status()` line. It can move a digest only by refusing a valid product: every producer must build the SAME string, so the lock is the proof. It edits `mathworker.js:197` with P6 and P8 (§7). |
| **P2** | CHANGE | Do not add `lab/convention.js`: `molecule-state.js` already exports `BASIS_KIND` and `COMPONENT_ORDER_LINE` (lazy-loaded, no boot cost), `md.js:508` `rdOf` is the R_d law and `names.js:115` `CONVENTION` is the frame. Gather and reference them. STRIKE "the existing sign tests read it instead of a literal": a test that reads the object the code defines proves nothing (S:2096 "Do not duplicate an engine formula into the test and call that independent validation"); keep the literal in the test and assert the object equals it. |
| **P3** | CHANGE (hard) | D's fact 6 ("no oracle, no bound") and P3's "UNKNOWN for the rest" are WRONG: 38 of 38 records carry `oracle { energy, source, what, delta }`, max \|δ\| 6.93e-9 Eh. Sidecars under `library/` also fail: that is the `sw.js` §1b DATA root, cache-first and never refreshed (`sw.js:404-439`), so a re-issued certificate never reaches a device that holds the old one, and INSTALL would know nothing of them. Put `oracle:{what,delta}` and a per-quantity status in the catalogue ROWS (`lab/library.json`: an ordinary precached file, 88 KB, already carrying `caps`; ≈4 KB more; readable without opening a 1.2 MB record). A content-addressed sidecar only when a certified member exists. The app may write MEASURED; CERTIFIED is a mathematical judgment, so only a pilot-signed member may carry it. P3 edits `lab/library.js` but is missing from G-L. |
| **P4** | CHANGE | See §3. (i) One word per molecule over-claims: Sol's rule is per observable (C:2279–2329; R3 "A single renderer tolerance cannot certify every scientific observable"), and the row sits beside VIEW, so let it follow VIEW (density: energy vs PySCF + texel; orbital: sign and phase are gauge; FLOW: "sense exact, magnitude qualitative"). (ii) Use the tree's vocabulary (13 `STATUS: EXACT ANALYTIC`, 11 `EXACT`, 6 `NUMERICAL` headers; the badges' `exact`/`numerical`) plus one new word, UNCHECKED; not a second 3-word registry. (iii) D's own examples contradict the tree: a minimal-basis RHF at a fixed experimental geometry is not "ESTABLISHED", and C₆₀ is a PySCF-derived frontier record, not "EXPERIMENTAL". (iv) `LW.molecules` does not exist; `__LW.chem` is a `value` and the facade test pins top-level names only, so `chem.capability()` needs no `--write`. (v) Add `observables`, `limits`, `geometry` (`stem.geometrySource`; the model note already says "not the RHF minimum") and the live `Tr(DS)` and IDEMPOTENCY (`chemview.js:216-217`, hidden in the fold today). Size M → S–M. |
| **P5** | CHANGE | `chemview.record()` / `molecule-state.serializeMolecule` is the app's existing export record ("a state link, a fixture, an export", `chemview.js:762`), validated, with refusals and a save→restore byte test; FILE › EXPORT GRID (`docs/EXPORT.md`) is the worker `export` road. The pilot's JSON = that record + a `contract` block (identity, convention, capability, oracle) + S, T; the tool is then ≈30 lines. Q1 (what she wants) still sets the shape; the README of what is NOT there is the best part of the row. |
| **P6** | KEEP, CHANGE | The most real row for "no stutter". (i) The owning suites `worker-pool.test` and `mathworker.test` do not exist (nothing in `tests/` imports `worker-pool`); `createWorkerPool({ busyWrap, spawn })` is injectable, so a node test with a fake `spawn` is S, but it is NEW. (ii) G-T measures the wrong thing: the ms/s pair (`tools/perf/main-thread.mjs`: boot and D1 scenes) never times out a chem job. Prove it by `local()` calls = 0 (node) and the longest rAF gap / longtask across a forced timeout, before vs after. (iii) `fail()` (`worker-pool.js:20`) sets `failed = true` and never respawns, so after ONE `onerror` every later chem job silently runs on the frame thread; the row must say respawn-once or refuse. (iv) the chem ceiling is 300 s (`:49`), so today's timeout fallback fires after five minutes; the live exposures are `error` and the dead pool. (v) chem only: `maths`/`cards` keep their synchronous roads. Callers already print `.refused`/`.error` on `status()` (`chemview.js:337,375`). |
| **P7** | SPLIT | (a) KEEP: S, correct, but the gain is under the texel (worst case ≈300 terms × 6e-8 ≈ 2e-5 vs 1e-3; ESTIMATE), so call it hygiene; `re[mu] += cr * w` is `orbitalsview.js:275`. (b) STRIKE the refusal: 2^53 frames at 60 fps is 1.5e14 s, about 4.7 million years of play, whatever RATE is (`clock.js:41` floor 1e-6, default 4); only `scrub(t)` / a typed t can reach it. Declare T_MAX in the header + a node test; clamp `scrub` if anything; no sentence, no frame-path branch. (c) KEEP, the best row in the draft (a standing GPU-vs-CPU law); keep hydrogen 2e-5 and molecule 1e-3 as two laws. |
| **P8** | CHANGE, MATH flag | Exporting `oneElectron` (`md.js:210`, takes `(basis, atoms)`; `integrals()` already returns S, T, V, M) is the right S row. STRIKE the worker op `chem.oneElectron`: P5 can call `md.integrals` in node; nothing in the app asks for it. `loewdin` REPORTS `{minEig, cond}`, but a REFUSAL floor is a mathematical judgment (what cond is "a lost response gap"?): report only until the pilot names the number; first measure cond over the 38 records so none newly refuses on open. |
| **P9** | SPLIT, MATH flag | KEEP the tracked metrics (tests only). STRIKE the taper for now: PILOT-AUDIT §4 says "The floor that matters is not 1e-7" (her tail-safe bound is useless at ρ_lo ≈ 5.9e-5; her tube's min ρ ≥ 0.48); the taper's SHAPE (linear vs C¹) is the Lipschitz question of Sol's contract; `step()` KILLS a tracer below the floor, a taper changes alive counts; and "FLOW that fades at the floor" (D §5) is not seen by Josh, since ρ ≈ 1e-7 lies far outside the molecule. Ask the pilot what margin her certificate assumes (Q1). |
| **P10** | KEEP | Describe the three existing oracle files (`tests/fixtures/oracles/`: `library-v1` 38, `sto-3g-v1`, `6-31+g-star-v1` 19 molecules at 3e-12) rather than start a second manifest. Tests only, no digest. |
| **P11** | KEEP | Honest and `tools/` only. Add the adapter's `shader-f16` to the matrix row (`gpu-boot.js` never requests it: 0 grep hits). |
| **P12** | STRIKE from 0.5.4 | Secretly a representation/MATH row (R01 is Sol's research item) and a "new solver" under R2's pause. The ledger refuses it: the other rows sum ≈ 275 lines (ESTIMATE: P1 30, P2 40, P3 30, P4 60, P6 40, P7 25, P8 30, P9 20) against ≈ 280 of headroom, P12 adds ≈ 120, and its "subtract first" candidates are CSS, which the law (`lab/*.js` + shell + windows) does not count. Sol's order is benchmark first (fork a component only after its benchmark wins, C:5292; R6 measured no WebGPU speed). "Flag off: unchanged by construction" is overclaimed: the WGSL source changes, and only the lock shows the old kinds still compile identically. Keep a tools-only benchmark (`tools/perf/s4c-kernel.mjs` exists). |
| **P13** | CHANGE | WRONG basis. 6-31+G* Cartesian is 19 AO per C/N/O/F and 2 per H, so benzene is 126 AO: over `BASIS_631.maxAO = 46` (`molecules.js:514`; the card refuses it), not in the 19-molecule oracle, and `md.js:400` would allocate 8n⁴ B ≈ 2 GB. `REPORT.md:2563`'s ratios are "water's lowest bright states", not "the FLOW gauge report's own molecules". Use H₂O (23 AO), H₂CO (42) and one of N₂ (38) / CH₃OH (46) / C₂H₄ (46): all in the oracle. Josh's N:23–26 already asks for the caching, so Q3 is not cold. |
| **P-V** | KEEP | Add: STATUS probed at phone width and tablet, `tools/stylehash.mjs` (a card row changes computed styles), and the scenes of the ms/s pair written out. |
| gates | CHANGE | `pwa.test.mjs:302` is `:313`. G-L must list P0 and P3 (both edit `lab/`). D names no per-row line budget although NACRE requires one for any row that adds engine code. |

Secret MATH rows or MATH-flavoured parts: P8's floor, P9's taper, P12, and any `CERTIFIED`. Could move a digest: P1 (refusing a valid product), P7a (packets; the lock's state list has none), P12 flag on. Everything else cannot.

## 3 · The face: is ONE STATUS row on MOLECULES right (R8)?
Yes as the persistent seat, no as the only seat. The card keeps only ON / MOLECULE / BASIS / VIEW + ORBITAL above a fold that is closed on a phone (`chemview.js:222-243`), so a row ABOVE `.mol-more` is right for a phone, and the kit `readout({label, value, sub})` already does value + detail. But a first-time reader meets the fade's head ("RHF/basis and E", `moleculeHead`, `latex-state.js:131`, a pure builder) and the stage, not the rack.
| alternative | cost | verdict |
|---|---|---|
| **A** (D): one `readout` row | ≈25 lines in `chemview.js`, one `molecule-head`-style test, a taller card (occlusion repaints, `stylehash`); on a phone a 56-character string wraps to two lines and there is no hover for a `title` | right seat, wrong content (per molecule; jargon "f16 field ±1e-3") |
| **B**: make the stage badge molecule-aware (`badges.js` b1/b2 + the MODEL sheet) | ≈12 lines | REJECT: STATUS TAGS is OFF on first run (CLAUDE.md first-run paragraph), so the first-time user never sees it |
| **C**: a last line in THE HEAD + the same words in the export caption (`capture.js:575` already prints `H₂O · 1b1 HOMO · STO-3G`) | ≈10 lines (`moleculeHead`, `drawCaption`) | shows on first pick on any device, in pictures and films; transient, absent after a restore or undo |
| D: a new rack card; or a SETTINGS switch | a card is a WORKSPACE layout row (serialize bytes and `new-project --check` move); a switch is a PREFERENCE key (`settings-probe` 0/6 breaks) and truth the reader can switch off | REJECT |
**Pick: A + C from ONE string.** `chem.capability()` returns it; the card's readout shows it (value = ONE word for what VIEW shows, sub = the proof), THE HEAD ends on it, the caption carries it. The face is the string, not the seat. Plain text a beginner can read: `DENSITY · NUMERICAL · energy agrees with PySCF to 7e-9 Eh · picture good to 0.1 %`; `ORBITAL · NUMERICAL · sign and phase are arbitrary`; `FLOW · NUMERICAL · direction exact, size qualitative`; hydrogen: `EXACT`. The weakest observable on stage sets the word.

## 4 · Ideas (my two cents)
| # | idea | joins | size | law it keeps |
|---|---|---|---|---|
| I1 | One string, three seats (card, head, caption), carrying the live `Tr(DS)` = N_e line the card already computes | P4 | S–M | S:42; S:1808 "Quality may change the estimate or reconstruction. Quality may not silently change the state or evolution law."; `molFormula` governs the head; no new key |
| I2 | A claims inventory: every user-visible sentence the programme puts in doubt (RECONNECTION ×3, FLOW caption, the MODEL sheet, the EXACT badge over a molecule): list, never edit | P0 | S, Haiku | "Nothing a hand or an eye meets moves without a row that says so" (NACRE) |
| I3 | Identity refusals as named codes (`E_IDENTITY`) in `molecule-state`'s idiom, printed on chemview's `status()` | P1 | S | refuse, never repair (`molecule-state.js` header) |
| I4 | A reproducibility pack for the paper: `export/REPRODUCE.md` listing build id, tree hash, lock result, device matrix, oracle versions | P5+P10+P11 | S, tools | R25 §12.5 "source versions and deployment separately recorded"; nothing pushed |
| I5 | A view-invariance gate: exposure, ISO, palette, grid, quality never change the published matrix hash or Tr(DS) | P7c | S | R25 §10.1 "Changing exposure or a visible threshold should not modify electron occupations" |
| I6 | The obvious one: ask the pilot (Q1) BEFORE building P5/P8/P9, in three lines listing what the app can hand over today (`molecule-state` record, S/T/V/M via `integrals()`, the oracle energies) | P5 | none | she is the customer; three rows' shapes are her answers |

## 5 · Rulings and questions
Flip: **R3** to "catalogue rows, not sidecars" (keep "record bytes and hashes do not move"); **R5** to DEFER P12 (the ledger and Sol's own order); **R6** to the right molecule list; **R8** to "one string, card + head + caption"; **R4** gains "respawn once"; **R9** keeps the deferral and drops the visible refusal. Keep R1, R2, R7 (add that the 1004 fixture runs with `--query gastab=0`, CLAUDE.md:316), R10. Add **R11** the RECONNECTION words stay until the pilot classifies, P0 lists them; **R12** the vocabulary (EXACT / NUMERICAL / UNCHECKED vs Established / Verified / Experimental) is Josh's wording.
| Q | can the tree answer it without Josh? |
|---|---|
| Q1 | no (the pilot); the tree can say what exists today: `molecule-state` record, S/T/V/M, oracle energies |
| Q2 | no (S:2310 against C:1854) |
| Q3 | mostly: N:23–26 is Josh's standing ask for the caching, N:30 sets the count. Yes to three, not benzene |
| Q4 | yes: the line ledger does not pay for P12; 0.5.5 |
| Q5 | yes: card row + head line (badges are hidden at first run; a card moves serialize bytes; a switch adds a PREFERENCE key) |
| Q6 | no |
Missing: **Q7** DISK / cyclotomy (N:35–37) never reached Sol: hand it to the pilot or Sol? **Q8** the RECONNECTION words (R11). **Q9** where is the 93-reference archive, and does Josh want a `docs/REFERENCES.md`? **Q10** the 0.5.3 cut line count: 28,504 assumes 0.5.3 lands at its cap; the number is knowable only after 0.5.3.

## 6 · Citation check (tree `ed00aa2`)
| citation | result |
|---|---|
| `worker-pool.js:55-59` | CONFIRMED (`:55` comment, `:59` `local()`); `:49` chem ceiling 300000 and `:16` LA6 also CONFIRMED |
| `molecular-flow.js:25-52` | CONFIRMED (`:25` const, `:39` step, `:52` speed) |
| `orbitalsview.js:270-274` | CONFIRMED (`:270` Float32Array, `:274` th; the `+=` is `:275`) |
| `clock.js:35-38` | CONFIRMED |
| `molecular-session.js:24` | MOVED to `:25` (THE STAMP); header ranks `:14-16` MOVED to `:15-17`; `:42`, `:45`, `:137` CONFIRMED; `adopt` `:103-110` |
| `md.js:210`, `:453-458` | CONFIRMED (`oneElectron` unexported; `integrals` returns S, T, V, M, eri); `:200-205` CONFIRMED (hash `:204`) |
| `library.js:5` | CONFIRMED; `:33` WRONG, the FRONTIER comment is `:39` (`:33` is a `need(...)`); `atomsKey` `:15` not `:14` |
| `chemview.js:310`, `:771-773`, `:482-484` | CONFIRMED |
| `field.js:1543`, `:170`, `:1080`, `:1441-1444`, `:161-164` | CONFIRMED; `MAX_MODES` is `:24` (survey `:23`) |
| `digest-lock.mjs:19-22`, `:42` | CONFIRMED |
| `mathworker.js:150`, `:194`, `:197` | CONFIRMED |
| `rack.js:846` | CONFIRMED (`?gastab=0`) |
| `readouts.js:87`, `state.js:58`, `README.md:82,150`, `NOTES:100`, `CLAUDE.md:243,316` | CONFIRMED |
| `frontier.js:415,636`; `density.js:127`; `molecular-field.js:59` | CONFIRMED |
| `pwa.test.mjs:302` | MOVED to `:313` |
| 27,943 lines (`cat lab/*.js lab/shell/*.js lab/windows/*.js \| wc -l`) | CONFIRMED |
| 38 library records, 12 MB | CONFIRMED (`ls lab/library \| wc -l` = 38; `du` 12M) |
| D fact 6 "no oracle, no bound" | WRONG: `oracle` ×38, max \|δ\| 6.93e-9 Eh |
| D P13 "REPORT.md:2563 the FLOW gauge report's own molecules" | WRONG: water's lowest bright states; benzene is 126 AO > 46 |
| D P6 owning suites `worker-pool.test`, `mathworker.test`; P7 `clock.test` | WRONG: none exists (`rhf-molecule.test` is `rhf-molecules.test.mjs`) |
| D P4 `LW.molecules.capability()` | WRONG: no `LW.molecules`; `__LW.chem` is a `value` |
| D §0 reading 3 "approximation status is … never on the glass" | PARTLY WRONG: badges (`exact`/`numerical`), the MODEL sheet and `moleculeHead` exist; they are hydrogen-minded |

## 7 · Risks, ranked
1. **PAIR 1 is not disjoint.** P1 (`mathworker.js:197`), P6 (`:150`, the pool) and P8 (a new op in the same table) edit `mathworker.js` from both halves, and P1's key must be the SAME string from every producer (`chemview.js:488`, `molecular-register.js:225`, the session) or a valid product is refused as stale: a blank molecule, a moved lock. Serialise P1 before P6, or give P6 the pool only.
2. **No line ledger.** D prices only P2 and P12; my ESTIMATE of the rest fills the headroom, and 0.5.3's cut is unknown (Q10). A builder at the cap drops tests first. Make every row state its lines and what it subtracts before its BRIEF, and treat P12 as out.
3. **P6's proof and semantics.** The ms/s pair cannot see a forced chem timeout, no suite exists, a dead pool turns frame-thread silently, and the one road every MOLECULES action uses changes its failure behaviour. Frame-path row: one fresh verifier, a real forced-timeout probe, and the respawn decision written first.
