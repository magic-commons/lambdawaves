# REVIEW-SONNET-0 · first reviewer of PLAN-DRAFT-0 (Sonnet 5.5, 2026-10-07)

Read: NACRE.md, the four surveys in full, PLAN-DRAFT-0.md, the names-and-cache plan, README, NOTES-FOR-AGENTS. Spot-checked in the tree
(read-only): `lab/molecules.js`, `lab/chemview.js`, `lab/field.js`, `lab/md.js`, `lab/orbitalsview.js`, `tests/wiring.test.mjs`,
`docs/OPTIMIZATION-2026-09-24.md`, `~/Documents/MIR/.git/refs/heads`, `~/Documents/OBSIDIAN/ALL DISK ⟡`. Nothing was run.
Tags: OK / PARTIAL / WRONG / MISSING. "D:n" = PLAN-DRAFT-0 line n. A / L / S / V = survey MIR-1.5 / LWAVES-AUDIT / SIBLINGS / VAULT.

---

## 1. MISSED SPOTS

### 1a. Josh's ask, sentence by sentence

| # | Josh's sentence | Status | What the draft does / fails to do |
|---|---|---|---|
| 1 | "pre-refactor to get ready for MIR 1.5 … this will be our 0.4.0 alpha" | PARTIAL | B1/S1 is the pre-refactor, but S6 (adoption) and S7 (INFORMATIONAL) sit inside 0.4.0 (D:192-194). Adoption is gated on a MIR word Josh has not given (V §3 header), so the headline can slip with it. A pre-refactor ends where the adoption starts. See 3. |
| 2 | "Cheat, look into … AUTOMATA, EARTH, SOLEIL, NEBULA for more ideas" | PARTIAL | F7 (D:151-160) is one paragraph for 35 SIBLINGS rows. Fit-5 rows 10 TIMELINE, 11 event-metronome, 12 LAYERS are neither planned nor in NOT CLAIMED. Also undispositioned: 13 ATLAS, 14 RULER, 15 LENS, 16 CHORD, 17 kymograph, 23 params registry (a pre-refactor row), 24 CURVES, 25 TAKE, 28 MIDI, 34 GPU anchor. Needs a 35-row disposition table: 0.4.0 / 0.4.x / declined. |
| 3 | "Take the MIR flagship status from BASINS to Lambdawaves!" | MISSING | The goal paragraph (D:15) says "proven first" and nothing else. Flagship is operational: who has the helm; whether "prefer BASINS" (V §3.1, `mir-transport-per-app`) flips to "prefer λWAVES"; whose adoption log the kit regression-tests against; whether BASINS' own merge waits. No ruling asks. |
| 4 | "Treat the caching like expansions … metadata, STEM information, copy/LaTeX for our markdown journal" | PARTIAL | Pack contract = Sol's (B2). Metadata = names only (NAMES §4). **STEM information per record is not specified** (point group, formula, mass, dipole, gap, geometry source, CAS/InChI, a two-line description, literature IE). **Expansions have no manager seat** (installed / bytes / update / delete / offline lamp). Copy/LaTeX is OK (F1, F3). |
| 5 | "keep true human information or fill in the gaps … STO-3G vs 6-31+G*" | PARTIAL | Names plan §3 has textbook-LCAO, character and ionisation-band families; the draft takes only the symmetry name + HOMO (F1) and R-N7. "Fill in the gaps" = curated textbook names + experimental IEs where they exist, tagged `curated`/`derived` — not scheduled. The STO-3G vs 6-31+G* demonstration (N2: HOMO is 3σg vs 1πu, NAMES §2) is the best teaching moment in the plan and has no deliverable. 6-31+G* names need Cartesian d, which the probe did not build (NAMES §5 "not established"). |
| 6 | "true ladder names … 1a1, 1b2 … the knob reads HOMO-1, HOMO-2" | OK | F1/S2. The two label sites (`orbitalsview.js` label(k), `chemview.js` orbFmt) are named. |
| 7 | "Caching these will be useful for future informationals" | PARTIAL | Stated, not built: no page template that reads a record (energy, irrep, node count, parentage) so the page is generated, not typed. S7 lists "four pages" by hand. |
| 8 | "Wave indexing the presolved orbitals (ZOETROPE) … dynamic waves with true electrostatics, QHO but Taylor 3D shells. Anything you can think of." | PARTIAL | Whole thing deferred to 0.4.x (F9). But the **index IS the S5 key** (species, method, letters), and **the record must reserve room for the Q_LM matrices and the grid**, or S5 freezes a schema F9 must bump. Three readings A/B/C exist (V §1.3); no ruling asks which Josh means. |
| 9 | "Don't go for too many variations of the same molecule; as diverse as possible" | PARTIAL | R-L1 "one conformer each" is not diversity. The BIO list holds Leu and Ile (same formula C6H13NO2, V §7.2) and other near-duplicates. No gate. See idea/change on a diversity gate. |
| 10 | "special layouts like the spectrum window's buttons: vertical periodic table, large/heavy atoms, crystal lattices, biology (all amino acids, small chains, the video's end), a bucky-ball" | PARTIAL / WRONG | (i) Periodic table and (l,n) table deferred to the kit `cells` control at adoption (D:133): Josh's most visible layout ask lands last, though SPECTRUM's grouped-button widget already exists in the app. (ii) "FOLDERS tiles and sections now" (D:131) is impossible: FOLDERS is kit 1.5; MOLECULES today is a `<select>` with seven `<optgroup>`s (`lab/chemview.js:6,:93`), which breaks at 100+ entries. (iii) "all amino acids": 16 of 20; Phe/Arg/Tyr/Trp need >64 AO. (iv) "small chains": Gly-Gly only. (v) "end of the video" = splicing (V §7.1): nothing mapped to it explicitly. (vi) bucky-ball "next milestone" pushed to 0.4.x by R-L2; the stepping stones (adamantane 66, B12H12 72, C20H20 120, Phe..Trp) share the same wall and are not planned. |
| 11 | "engine upgrades: much larger atom/electron count, heavier atoms, cyclotomic scaling, Sol 6.1, our DISK corpus, lower orbitals will go nuts" | WRONG | F8 turns every engine upgrade into "research, not a 0.4.0 build"; Josh asked for "some engine upgrades". The live wall is the shader's `var<function> array<f32, 64>` (`lab/field.js:672`), not only ERI memory; Schwarz screening and the 8-fold fill already exist (`lab/md.js:255`), so "Schwarz + direct SCF" is not the missing road. **Nobody read the DISK corpus**: `~/Documents/OBSIDIAN/ALL DISK ⟡/` (GML II L-0408 cyclotomic numbers / Gaussian periods; λWAVES MASTER GOAL SPEC §38-39 "association kernels diagonalize in character bases; long diffusion becomes eigenvalue powers instead of repeated updates"; STUDY DOSSIER §13.4). That is a different reading of "cyclotomic scaling" from the draft's ring-symmetry one, and it is Josh's own. "Lower orbitals" is ambiguous (core orbitals = resolution on heavy atoms; many orbitals = reconstruct count). |
| 12 | "Check the new live github version … atom and formula text … made without MIR standards" | OK | B0/F2. |
| 13 | "INFORMATIONAL … changes as settings change; Winding or HOMO/LUMO picked in registry shows at the top then fades; other elements could do that too" | PARTIAL | `addLabel({ttl})` (F6a) is the kit half. **The app half — what emits a label, from which control, with what text — is not designed.** WINDING is not named (it exists: `orbitalsview.js:70`). No `announce()` seam in the rack; no per-control opt-in; no content table. |
| 14 | "(educational … maybe non-educational like the palette, camera stuff … a tutorial but using the same engine? who knows)" | MISSING | The draft says "no tutorial machinery" (D:149) and never raises Josh's open question. The non-educational HUD (palette name on change, camera readout, preset picks) is in no feature. |
| 15 | "floating diagonal and hori, verti lines to the floating text" | OK | The kit's leader lines, as built (A §3). |
| 16 | "texts … markdown engine … Title, heading, body styles preserved in 'typomagical' … different text size styles between elements" | PARTIAL | Markdown OK. **Type scale and faces are not planned**: sizes per element kind (title / heading / body / label / HUD); `fonts/info/` (Spectral, Playfair Display, Alegreya SC) enter the precache (A §2.2); Butler cannot ship live in paid builds (V §3.1); `<m>` STIX vs KaTeX on one stage. |
| 17 | "Optimize the informational engine for GPU screen recording" | PARTIAL | F6b/c are driven by the kit recorder (`html[data-recording]`). An external screen recorder (OBS, ShadowPlay, iOS Screen Recording) gives the page **no signal**; a reader switch is needed. Also unplanned: AUTO SCALE/governor must hold its tier during a take (a mid-take tier change is a visible pop), a fixed cadence, wake lock (λWAVES has none, V §4 row 18). |
| 18 | "Camera pan … a large zoom off-centred like a planet photo with max FOV" | WRONG model | Josh's wording is **lens shift** (the picture slides, the subject stays the pivot). The draft picks **target pan** (D:111, from L C.3 model A) while the MIR survey reads the same sentence as "a principal-point offset … a screen-space offset uniform" (A §4, gap 2) and the kit's pan pad is "a share of the view's width" (screen-space). R-C1 asks, but F4 is built on A. With racks open, a lens shift also lets the molecule sit in the open gap between them. |
| 19 | "Upgrade the camera window with the new dot matrix'd XY controller" | PARTIAL | Waits for the adoption (D:117); two knobs meanwhile. The route "MIR 1.4.4 on the real `mir-1.4.x` branch" is not asked; the branch exists (`~/Documents/MIR/.git/refs/heads/mir-1.4.x`; L A.4 already points at it). Whether `xy.js` backports to 1.4 is a question for the MIR session. |
| 20 | "dot matrix … for all the inlays for interactive stuff … less intense, smaller circles" | MISSING | No list of λWAVES inlays; no mention that "less intense" is eight `--xy-lattice-*` tokens and no code (A §4). Candidate inlays: STATE IMPULSE VECTOR, KEPLER tilt/turn, SLICE/PLANE mini, ORBIT rotor spheres, WIGNER (z,p_z) map, RADIATION polar, the A/B morph, STATIC FIELD direction. |
| 21 | "audit … consolidate with the more popular windows" | PARTIAL | Overlap-based (L B.1), not popularity. There is no usage data (static, no analytics). Ask Josh which windows he and a visitor open. |
| 22 | "State as well needs to be audited" | MISSING | The word appears nowhere in the draft. L B.2 says "STATE: keep as is" in three lines. Josh asked for an audit; it may also mean application state/scopes. Ask. |
| 23 | "Calculus could be a video overlay, proper LaTeX, copy everything as markdown already in latex, premade math/physics body text like a 'Figure …' combining rows, built-in markdown journal" | PARTIAL | Copy OK (F3). **Not planned**: CALCULUS as a stage overlay layer (law residuals live, typeset). **R-W2 (D:208) says a GFM table; Josh describes a prose figure caption** ("Figure … first row, second row … combine whatever rows are together") — table and caption are different artifacts. No SEND-TO-NOTEBOOK gesture (only paste); "built in markdown journal too" = append to the current page in one press. |
| 24 | "Same with Dynamics, Meters, Wigner(?), Radiation (like this UI … Calculus with two or three narrow columns)" | OK | F3. WIGNER gets one clause. |
| 25 | "Rename 'slice' to 'PLANE'?" | OK | R-W3. Risk to state: in a wave instrument "plane" collides with "plane wave" (e^{ik·r}); ψ-PLANE (L B.3 option 2) is safer. |
| 26 | "Shadow window. Orbit, Slice or whatever could get overlays … a layer on the informational … move the text around" | PARTIAL | The OVERLAYS strip (D:94) lists KEPLER, VORTEX, PARTICLES, ELECTROSTATICS. **SHADOW (phasor wheel), ORBIT (rotor spheres), PLANE (the mini sphere) are omitted** — the three Josh named. Text-moving = F6f, OK. |
| 27 | "somewhat realtime … cost heavy … leverage the power button" | PARTIAL | The cost law (D:107) restates today's behaviour. "Somewhat realtime" is undefined: Hz per window. Today readers run every 4th frame (PERFORMANCE 120 Hz) or every frame (FULL) (`docs/NOTES-FOR-AGENTS.md` §4) and the reader law parks them above 6/16 ms (L B.0). A power-aware rate ladder is what the sentence implies. |
| 28 | "Leverage the 'Display' setting in Settings (Not MIR options)" | PARTIAL | R-I1 OK. But the draft "keeps Cloud's four PREFERENCE keys and DISPLAY rows" (D:86) and adds more; DISPLAY already has 16 widgets (L Part E). Merge STAGE FORMULA + ATOM LABELS + their two SIZE knobs into the INFORMATIONAL rows (4 → 2): the subtract law. |
| 29 | NACRE: "how to make this user friendly (leverage the rack window)" | MISSING | No section, no per-feature seat. See 4. |
| 30 | NACRE: "no FPS stutters … utilizing, updating, upgrading existing machinery" | PARTIAL | B3 states the budget but no feature carries a number: labels under AUTO-ROTATE / WASD / FLING run `viewChanged()` + the seat chooser every frame (A §3 "what runs per frame"); BASINS measured pan ~30 fps with rack glass shown vs 60 hidden, +784 KB JS, frames >33 ms 82 vs 65 (V §4 end; S §2.5). None is an acceptance line. |

### 1b. From the surveys, not in Josh's words

- **Dated test fails 2026-11-20**: `tests/wiring.test.mjs:59-66` (seven kit shell files staged 2026-09-21), `EXPIRE_DAYS = 60` (:463) → red in 44 days. S6 fixes it only if the adoption lands first; add "re-date or wire" to S0.
- **Open bug (V §5.1)**: "Space does not play both clocks in LINKED mode at project open". Repro it in S0; R-B1 may dissolve it, but it is a user-reported defect.
- **Conflict missing from the rulings**: INFORMATIONAL "a project carries its pages / opening changes the notebook's tabs" vs repo CLAUDE.md "an open never closes the notebook" (V §3.6, §0 item 10). One ruling line.
- **LIBRARY and the iPad**: Safari may evict script-writable storage (Cache API / IndexedDB) for sites not installed to the Home Screen (to verify on the M5). B2 has no `navigator.storage.persist()`, no quota readout, no "evicted → degrade to not-installed" path. Same question for the stores programme (Steam/App Store hosts: bundled or downloaded expansions?).
- **The benzene cap law** (`lab/molecules.js:25-27`: "Have Benzene be the size cap"): a record beyond the cap opens only from its record. With none installed it must be DISABLED with a reason, and "live fallback when an input changes" (NAMES §7 N3) is impossible for it (basis/charge change). F5 must say so.
- **Process failure not fixed**: B0 repairs the forged manifest once. `tests/mir-manifest.test.mjs` hashes against the manifest itself (L A.1), so Cloud can do it again, and Cloud has no legal place to ask for kit work.
- **Parked/open asks (V §5.1) absent from NOT CLAIMED**: Serum matrix (parked by Josh), shader plugins, knobs open quick settings, ijk mini-maps, "2x6 layout". Say "not claimed".
- **Legacy H2 holds the only FCI dissociation curve** (L B.1 `h2`, `h2ci.js`, 221 points) while F7 plans a new "dissociation curve MAP" as a fresh feature. Same thing twice.
- **SIBLINGS row 23 (params registry)** is the sibling row aimed at a pre-refactor and the draft lists it nowhere; check the kit's `app.param()` / `describe.js` first (S rows 23, 27).
- **`describe()` for live-bound labels** (D:146): `describe()`/`dump()` is the model-facing markdown dump (A §1.5), not a cheap live reader. Live labels want `params.get()`.

---

## 2. CONTRADICTIONS

1. **Kit gifts land inside the adoption stage** (S6, D:192) vs CLAUDE.md "update MIR first, adopt it, then adapt" and A §6 ("kit home"). The gifts (TTL, cheap mode, overlay-in-film, window `md()`, `cells`, lattice export, painted-surfaces provider, camera law, INFORMATIONAL window) must be built in the MIR session BEFORE the cut or 1.5.0 ships without what λWAVES needs. The draft has no stage that writes the briefs, no owner (the MIR session), no date.
2. **Adoption inside 0.4.0** vs Josh "pre-refactor" and V §3 header: λWAVES is frozen on 1.4.3 "by Josh's word" until he says 1.5 is done (MEM `big-four-universal`). A release scope may not depend on an event not yet given.
3. **"Subtract, don't add" vs S1**: `docs/OPTIMIZATION-2026-09-24.md` W130 records two seams as `rack.js 5695 → 5447; lab/ net +41`. The acceptance is "rack.js ≤ ~3,500" (D:187): a moved line is not a deleted line; measure `lab/*.js` total. Seams 2 (look store), 4 (the 1,065-line floating-rack block) and 9 (action ids) are deleted or rewritten by adoption (A §2.2: `createRack`, `createGui`, `createKeys`); the only property worth buying early is "no code outside the block reaches `#rack`/`floats`" (BASINS stopped four times on "70 refs to #rack", A §2.1 row 2b).
4. **"Subtract" vs F7**: ~12 new features (SCENES, FIGURE, CITE, chips, MAPS, scale bar, search, title card …) with no "what it deletes" (SIBLINGS closing note; MIR PLAN §2 "every step states what it deletes"). New windows proposed: MAPS, SCENES, INFORMATIONAL, OVERLAYS strip, LIBRARY manager. Removed: DYNAMICS. Make it one-out-per-one-in.
5. **"Diagnostics live in tools/, never lab/" vs** the "known-answer lamp" VERIFY action running oracles in a worker (D:158; SIBLINGS §5.3) and "a per-window cost line in METERS/QUALITY" (D:108). Both put test machinery in the shipped, precached build.
6. **Engine-only law vs F3 "app (the skin and `md()` become kit)"**: a new reading-window skin + grid + `md()` copy dialect in `lab.css` for four windows is app chrome built just before the kit replaces it. Acceptable as a stopgap only if each stopgap is named and its deletion is in S6's "deleted" column; the draft lists none. Same for the F2 interim stage-text renderer (a second implementation of INFORMATIONAL).
7. **Service worker's law vs adoption**: the kit adds 177 files, +5 MB on disk (A §2.2), `fonts/info/`, `locales/` 1.5 MB, `tokens.json` 0.65 MB; every deploy refetches the whole precache (203 files, 5.6 MB). S6 has no precache byte budget or lazy list (A R4 asks for one).
8. **No FPS stutter vs S6/S7**: BASINS' post-adoption numbers (pan ~30 fps glass-on; frames >33 ms 82 vs 65) are the reason a flagship raymarcher needs a before/after frame-time protocol on the 3070 AND the M5 as an S6 acceptance line. The draft's only measured acceptance is S5's iPad bytes.
9. **F4 vs the surveys**: target pan (D:111) vs MIR survey gap 2 and Josh's wording (lens shift). Also the kit panel's 3-D `HOME` ignores pan (A §4 "missing in the kit"), so "the pad appears the moment the port answers" (D:117) is a kit item, not automatic.
10. **F5 "FOLDERS tiles now"** vs FOLDERS being 1.5-only (1a #10). S5 precedes S6.
11. **Gesture clash in F4**: left-drag Shift = FINE orbit, Ctrl = bow, Shift+drag = place HELIUM electron (L C.1), Alt+left = right-click in the paint gesture (L A.1). Right/middle-drag pan is unusable on a trackpad and an iPad; two-finger drag is pinch's neighbour. The draft names no trackpad/touch-reachable pan chord.
12. **Draft vs RTX hazard** (MEM `rtx3070-webgpu-nondeterminism`): "lock 1004/1004" per seam (D:57) on a card with a known one-ulp fault. Per commit the 208-value lock (OPTIMIZATION W130), 1004 once at the end, a red re-run ALONE before believing it.
13. **Verification dial**: S4 changes `writeView` (the camera uniform) and S1 touches the frame loop — frame path — yet only S1/S5/S6 get a verifier (D:201). S4 and the 64-AO kernel lift should.
14. **B0 recommends dropping Jet Black** (D:34-35) though it is live, Josh asked for it (L A.1), and cutting "0.3.3" would REMOVE it from users in the name of a manifest. Make the manifest true instead: a real MIR 1.4.4 on `mir-1.4.x` carrying `jetblack`, then `tools/adopt.mjs` (L A.4 names the vehicle).
15. **"A name below tolerance falls back to the index"** (D:81-82) vs "all or nothing per record" (D:80 / NAMES §5): consistent only if "falls back" means the whole record. Say so once.

---

## 3. ORDER AND RISK

**Split the release.** 0.4.0-alpha = S0..S5 + the kit briefs + a canary adoption. THE ADOPTION + THE INFORMATIONAL = 0.5.0-alpha (or "0.4.0 part 2" when Josh says 1.5 is done). Reasons: "pre-refactor" is Josh's word; the external dependency; the Opus budget (three L stages S1/S5/S6 plus an M-L S7 is more than one budget at "one verifier per stage").

**Proposed order** (dependencies, Josh's visible value, Opus budget):
1. **S0 TAKE-IN**, plus (a) the audit's cheap bug fixes as their own commit: CALCULUS copy (L F2), badges tick (F3), `hydroReader`+`chem` (F4), `copyLatex` gate (F5) — small, independent, visible, test-coverable; (b) re-date the wiring allowlist; (c) repro the LINKED-Space bug; (d) **the canary adoption**: `adopt --dry-run` on a throwaway copy, `stylehash`, `tests/pwa.test.mjs`, kept rebased per alpha (A "Recommended order" step 2). Cheapest information in the plan; it decides which seams to cut.
2. **S2 NAMES in parallel with S1.** Names touch `names.js`, the worker's `ensureSolve`, `orbitalsview.js`, `chemview.js`; seams touch `rack.js`. Independent files, and names are Josh's loudest explicit ask. Do not hold them behind 12 seam commits.
3. **S1 SEAMS, trimmed** to those that survive adoption and serve a 0.4.0 feature: (10) tests-by-hook FIRST (cheap, protects the rest), (11) `cameraEye`, (12) `reg.onChange`, (7) occlusion providers, (6) one-clock facade, (8) camera port, (1) settings adapter, (3) project parts, (5) modulation port. Defer (2), (4), (9) to the adoption step; for (4) only drive `#rack`/`floats` references to zero.
4. **S4 CAMERA** straight after `cameraEye` (small, visible; one verifier because `writeView` is the frame path). Lens shift first (6, change 4).
5. **S3 windows**: bug fixes already done in S0; then the consolidation (DYNAMICS, one skin, PLANE/CLIP, OVERLAYS including SHADOW/ORBIT/PLANE, CALCULUS overlay + prose figure). F2 stage text only after `cameraEye` + `reg.onChange`.
6. **S5 LIBRARY, split**: **S5a** benzene record + `lw-data-` + the scope row + a persistence/eviction test on the iPad (verifier: worker + storage). **S5b** the sections as content behind a diversity gate, with an interim picker (optgroups + search). **S5c** the engine upgrade that lifts the 64-AO kernel wall (frame path: verifier + lock).
7. **KIT BRIEFS** (a stage of its own; no code in `lab/`): one brief per gap 1-9, 12, 13 to the MIR session, each with acceptance and the λWAVES port that will consume it. Written during S1-S5 so 1.5.0 can include them.
8. 0.5.0: THE ADOPTION (S6), then THE INFORMATIONAL (S7).

**MIR timing**: kit is `1.5.0-alpha.23`, wave 22 landing, the KBM lane editing `xy.js gui.js menubar.js rack.js` (A R15); BASINS re-adopted at every alpha (11 stages). Plan one adoption per cut, not per alpha; the canary absorbs the alphas.
**Opus budget**: trimming S1 saves about a third; triage F7 to ≤ 3 cheap items for 0.4.0 (FIGURE, honesty chips, CITE: all S, and they are "STEM information and metadata" in Josh's sense); everything else gets a row in the disposition table.

**Single riskiest stage: S6, the adoption.** 177 files in, 9-10.5k lines out, 15 named risks (A §2.3), an occlusion mask the kit cannot yet feed (R1 / gap 8), `projectAccent` default against the three scopes (R2), cascade layers against 12+20 `!important` (R5), byte-pinned tests (R12), a moving kit (R15).
**One move to de-risk: the canary.** A permanent throwaway branch running the real `adopt.mjs --line 1.5` on every alpha with stylehash + pwa + the occlusion and byte gates, results logged in `docs/` like BASINS' 87-row log. S6 then becomes a diff of known deltas.
Second riskiest within 0.4.0 is S5 (new storage class, worker change, iPad eviction, ~45 new molecules each needing a validated record). De-risk: benzene on the iPad first, measure, then size the starter (benzene solved in 1.0 s vs 9.6 s predicted, V §6 item 11e: the cost model is stale).

---

## 4. USER-FRIENDLINESS (hands, window, row, gesture)

| Feature | What the reader does, where | Seat |
|---|---|---|
| F1 NAMES | Turn/click the existing ORBITAL knob and ladder rungs in MO-REGISTRY; hover a rung = name + frame + `computed/derived` tag; ⧉ copies `$1b_{1}$`. | OK. Add type-to-find in the same window (see search row). |
| F2 STAGE TEXT | Nothing to do: it appears when MOLECULES/SPECTRUM change. To move it: an EDIT toggle. | **No seat before the INFORMATIONAL window (S7).** Say so. |
| F3 OVERLAYS strip | Tick KEPLER / VORTEX / PARTICLES / SHADOW / ORBIT / PLANE / CALCULUS / ELECTROSTATICS. | **No obvious seat.** Candidates: a row in WAVE (it owns "how ψ is drawn"); at adoption the INFORMATIONAL window's layer list. Pick one. |
| F3 readers (CALCULUS etc.) | Hover a tile for its law; ⧉ copies; one press "TO NOTEBOOK" appends the figure to the current page. | The window head already carries LEAN `Aa`, ⧉, ⓘ, ⏻, ▾, × at 274 px (L B.3). **Adding PIN or a chip breaks the hand law (no word-wrap).** Put TO NOTEBOOK / PIN as a second item behind ⧉, or in the ⋯ the hand law prescribes. |
| F3 DYNAMICS retired | Saved layouts with it open land on SHADOW (`RETIRED_WINDOWS`, `rack.js:318`). | OK; state what the reader sees. |
| F3 PLANE/CLIP | Same windows, new names. | OK. |
| F4 CAMERA | Left-drag = orbit (unchanged); **pan = ? (right/middle unusable on trackpad/iPad)**; two-finger drag on touch; the PAN pad in CAMERA (dot matrix), double-tap = centre. | Pick one trackpad-reachable chord (Alt-drag or Space-drag are free; Shift/Ctrl are taken). The pad is the discoverable seat. |
| F5 LIBRARY | Pick a molecule in MOLECULES' preset. With 100+ entries: sections + type-to-filter. Beyond the cap and not installed: the row says "download", not "disabled". | **No seat for the expansion manager.** Candidate: SETTINGS gets a 4th tab LIBRARY (installed, bytes, keep-on-device, delete, offline lamp); SETTINGS has DISPLAY / LOOK / QUALITY today. |
| F5 periodic table | Click an element in a vertical table (phone) / the (l,n) table for hydrogenic states. | Lands at adoption (`cells`). **Josh asked for it by name: ship an app-side SPECTRUM-style grouped-button stopgap now, delete it at adoption.** |
| F6 INFORMATIONAL | Pages are notebook tabs; `I` holds still; hover to feel the lines; switch in SETTINGS › DISPLAY (Josh). | The window is the kit's (S7). Interim: none. |
| F6a announce on change | Pick WINDING in MO-REGISTRY: a one-line title fades at the top of the stage. | Needs the app-side emitter (1a #13). |
| F7 SCENES | Eight snapshots; GO over N beats; Shift+1..8. | **A new window = no seat.** STATE owns A/B TRANSITION already: put SCENES there and delete A/B (subtract). |
| F7 FIGURE | FILE › PRINT STILL; drag the PNG onto the stage to reopen. | FILE menu: OK. |
| F7 CITE / chips | ⓘ popover section; honesty chip. | A chip is head-crowding again: put it in the ⓘ popover's title row, not a new head control. |
| F7 search / FLY-TO | `/` or "+": type `3d_z²`, `HOMO`, `benzene`, `Lyman`; Enter goes. | **Seat unspecified in the draft.** Best seat: the rack's own "+" menu made type-to-filter (λWAVES' design; the kit copied it byte-for-byte, V §3.7). |
| F7 MAPS | Click a cell to set the dials. | New window; one-in-one-out with legacy H2. |
| F8/F9 | Research. | n/a. ORBITAL CAROUSEL: a segment in MO-REGISTRY (FPS marks), not a window. |

General: every 0.4.0 feature should be reachable through three doors the reader already knows: the rack window's own controls, the "+" menu, and the notebook (as a page). A feature with none of the three is a candidate to cut or merge.

---

## 5. BEGINNER'S LUCK — ten ideas

1. **Hover to peek at an orbital.** Hover a ladder rung in MO-REGISTRY: a faint ghost of that orbital reconstructs at 64³ from cached coefficients (~0.1 ms, L Part B) without selecting; click selects. Chemistry student. MO-REGISTRY. App. **M** (paused-redraw law: schedule a PRESENT).
2. **Character-table page + symmetry elements as INFORMATIONAL.** The names record already holds group, characters, frame (NAMES §4). A generated page shows the point group's character table in KaTeX with the selected orbital's irrep row lit, and `features()` anchors labels on the C2 axis / σ planes drawn as thin stage lines. Names + library + INFORMATIONAL in one move; none does it alone. Student, lecturer. Page = content, `features()` = app, lines = kit. **M**.
3. **"vs EXPERIMENT" lamp per named orbital.** Tick marks on the ladder for vertical ionisation energies (NIST CCCBDB fixture, public domain, cited by CITE) for the ten probed molecules, beside Koopmans' −ε, tagged `curated`, with the honest gap (relaxation). Josh's "keep true human information". Student, physicist. MO-REGISTRY ladder. App + content. **M**.
4. **Action links in pages** (`[HOMO](lw:homo)`, `[3d_z²](lw:state/3dz2)`): a click in a notebook page or INFORMATIONAL block selects that orbital through the same resolver FLY-TO/search uses. Lessons become plain `.md`: no tour machinery (the kit's rule) but alive. Lecturer, Reddit visitor. Kit (`onLink` hook in `showPage`) + app (resolver). **S-M**.
5. **TAKE MODE.** One SETTINGS › DISPLAY switch for external screen recording: pins the AUTO SCALE tier and governor, caps cadence at 60, sets INFORMATIONAL to bare/no drift/no backdrop-filter, takes a wake lock, hides the pointer glow; sets `html[data-take]` for the kit to read later. Producer, Reddit. App now, kit later. **S**.
6. **Fold legacy H2 into a DISSOCIATION map.** `h2ci.js` and the 221-point RHF/FCI curve already exist (L B.1); make them the first MAP with an INFORMATIONAL label "RHF fails here". Deletes a legacy card and gives the student the best RHF lesson there is. MOLECULES / MAPS. App. **M**.
7. **EXPANSIONS tab (SETTINGS › LIBRARY).** Installed packs, bytes, KEEP ON THIS DEVICE (`storage.persist()`), delete, offline lamp, "not installed → download" in the preset row. Seats the "expansions" metaphor Josh used. Everyone; iPad most. App (kit FOLDERS "Purge" later). **S-M**.
8. **The ladder is a keyboard.** Map orbital energies onto a scale (octave-folded, ARTISTIC); click a rung to hear it, two rungs to hear the beat at Δε (the density literally beats at ΔE, SIBLINGS row 16); MIDI note out per populated MO. Producer + student ("hear the gap"). MO-REGISTRY ladder + WebAudio. App. **M**.
9. **SHARE LOOP.** FILE › EXPORT LOOP: one press, exact-period loop (`period.js`), name caption burned in (`1b₁ · HOMO`), 1:1 / 9:16 / 16:9, and a poster PNG that carries the project (drop to reopen). A Reddit post in one gesture. Kit RENDER + app period/caption. **M** (needs overlay-in-film or a canvas caption fallback).
10. **Use the cover's dwell to compile pipelines.** WebKit stalls 220-270 ms the first time each render pipeline is used (`docs/NOTES-FOR-AGENTS.md` §1, bug 324043); the opener/boot veil already waits for a first frame. Warm every draw-style pipeline there so the first STYLE switch on the iPad never hitches. iPad reader. App (`gpu-boot.js`) + kit opener. **S**.

---

## 6. THE TOP TEN CHANGES, ranked

1. **Cut the release at S5; make the adoption + INFORMATIONAL 0.5.0.** Josh said pre-refactor; the headline must not hang on an event he has not announced.
2. **Add a KIT BRIEFS stage and delete "gifts" from S6.** MIR first, adopt, adapt (CLAUDE.md); the MIR session owns the build; the briefs are the 0.4.0 deliverable that makes the cut possible.
3. **Start the canary adoption in S0 and keep it rebased.** Cheapest information in the plan; picks the seams; turns the riskiest stage into a diff (`adopt --dry-run`, stylehash, pwa bytes, occlusion and byte gates).
4. **Re-cut F4 to lens shift (screen-space offset, pivot stays), target pivot as an option.** It is what Josh wrote, it matches the kit pad's unit, it needs one uniform. Name a trackpad/touch pan chord (Alt- or Space-drag).
5. **Make the engine upgrade a deliverable (S5c), not "research".** Lift the 64-AO shader wall (`field.js:672`: chunk/stream the AO loop or raise the array) behind the digest lock + a verifier; confirm the ERI is 8-fold packed; then Phe/Arg/Tyr/Trp and adamantane become reconstructible from records. Keep cyclotomic/Gauss-period and symmetry-reduced reconstruct (ψ(Rr)=χ(R)ψ(r) for 1-D irreps; characters of ring groups are roots of unity) as the Sol thread, and read the DISK corpus first (1a #11).
6. **Rewrite S5**: interim picker (optgroups + search, not FOLDERS); the benzene-cap / `disabled → download` rule; persistence + eviction + quota; split S5a/S5b; STEM metadata fields named; record schema reserving Q_LM/grid; a diversity gate.
7. **Add the missing Josh asks as features**: STATE audit; CALCULUS overlay + prose figure + TO NOTEBOOK; SHADOW/ORBIT/PLANE overlays; a "somewhat realtime" rate ladder tied to POWER; announce-on-change emitter incl. WINDING and a camera/palette HUD; type scale + faces; an inlay list for the dot-matrix tokens; an app-side periodic-table stopgap.
8. **Account for every addition**: one window out per window in (SCENES replaces A/B; MAPS absorbs legacy H2; OVERLAYS strip absorbs four switches; STAGE FORMULA + ATOM LABELS rows 4 → 2); a 35-row SIBLINGS disposition table; FIGURE, chips, CITE only for 0.4.0; a diversity gate in `tools/orbital-library.mjs --check` (no two entries share a formula; each adds an uncovered element, point group or bonding motif).
9. **Trim S1** to the seams that survive adoption; measure `lab/` total lines, not `rack.js`; 208-lock per commit, 1004 once, a red re-run alone (RTX hazard); a verifier for S4 and S5c; real frame-time numbers (3070 + M5) in the S6 acceptance.
10. **Close the process hole**: keep Jet Black by making MIR 1.4.4 real on `mir-1.4.x` instead of deleting it; add `docs/KIT-ASKS.md` as Cloud's legal outlet and a CLAUDE.md line "Cloud: PRs only, never `lab/mir`, kit asks go in KIT-ASKS"; re-date/wire `tests/wiring.test.mjs`; write the pages-vs-notebook ruling.

---

## 7. QUESTIONS the draft should ask Josh

1. Is 0.4.0 the pre-refactor only (adoption + INFORMATIONAL = the next alpha), or must the INFORMATIONAL be in 0.4.0 even if it waits for the MIR cut?
2. What does "MIR flagship status" change in practice: does "prefer BASINS" become "prefer λWAVES" for the kit's defaults, who holds the helm, and does BASINS' own merge wait?
3. "State as well needs to be audited": the STATE window, or the app's saved state and scopes?
4. CALCULUS copy: a table of `$…$` cells, a prose "Figure …" caption that interleaves the rows, or both? And does one press send it into the open notebook page?
5. Pan: lens shift (the picture slides, you keep orbiting the molecule) or target pan (the pivot moves)? Pan fling? Carry it in links (needs codec v2)? Which chord on a trackpad/iPad?
6. Jet Black is live and you asked for it: keep it by making MIR 1.4.4 real on `mir-1.4.x` (also carrying the XY pad if it backports), or drop it until 1.5?
7. May a "0.3.3" cut include Cloud's work after subtraction, or tag 0.3.3 on `release-0.3.3` (exports only) and let Cloud's land in 0.4.0?
8. "All amino acids": is 16 of 20 acceptable, or are Phe/Arg/Tyr/Trp (71-87 AO) a reason to lift the 64-AO kernel wall now? Is the bucky-ball "next milestone" this release or the one after?
9. "Lower orbitals are gonna go nuts": core orbitals on heavy atoms (resolution/framing), many orbitals (reconstruct count), or time evolution? And "cyclotomic scaling": the ring-character symmetry reading, or the Gauss-period / character-basis idea in your DISK corpus and MASTER GOAL SPEC §39?
10. "Somewhat realtime": which windows, how many Hz, and may PERFORMANCE FULL be the "live" setting while POWER stays binary?
11. Which windows do you and a visitor actually open? (No analytics; consolidating by popularity needs your word.) PLANE, or ψ-PLANE (plane-wave clash)?
12. A tutorial through the same engine: you wrote "who knows"; the kit says pages are the tutorial. Do you want `lw:` action links in pages (idea 4) or nothing?
13. Who is the audience for 0.4.0: you, a class, Reddit/iPad visitors? That decides whether the opener, SHARE LOOP and TAKE MODE are 0.4.0.
14. Expansions in the Steam/App Store builds: bundled or downloaded? (Offline layer, `lw-data-`, the wiring test and fonts all differ.)
15. STEM information per record: which fields do you want to see (point group, dipole, gap, IE, CAS, a two-line blurb), and which count as "true human information" vs derived?
16. Pages travel with the project (kit) vs "an open never closes the notebook" (CLAUDE.md): which law wins?
