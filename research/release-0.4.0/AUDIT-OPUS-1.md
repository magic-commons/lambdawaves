# AUDIT-OPUS-1 · the senior audit of PLAN-DRAFT-1, and the plan as edited (Opus 5.5, high effort, 2026-10-07)

Read in order: `NACRE.md`; the four surveys; `REVIEW-SONNET-0.md`; `PLAN-DRAFT-0.md`; `PLAN-DRAFT-1.md`; the names plan and
`PROBE.md`; `CLAUDE.md`; `docs/STATE-SCOPES.md`; `docs/NOTES-FOR-AGENTS.md`. Checked in the code (read-only, branch
`release-0.4.0` at `9bf6b25`): `lab/field.js` (molecular kernel, AO tiers, `writeView`, the view struct), `lab/gpu-boot.js`,
`lab/md.js` (ERI allocation), `lab/molecules.js` (cap law, COST), `lab/mathworker.js` (`ensureSolve`), `lab/camera-law.js`,
`lab/stage-gestures.js`, `lab/rack.js` (occlusion, the clocks, PERFORMANCE/GOVERNOR, the digests, SPECTRUM's operator row,
ATOMS), `lab/chemview.js`, `lab/atomsview.js`, `lab/meters.js`, `lab/index.html`, `lab/sw.js`, `tests/wiring.test.mjs`,
`tests/pwa.test.mjs`; the MIR pin and live tree (`adopt.mjs` flags, `info/layer.js`, `controls/xy.js`, `version.js`); the
DISK corpus (`GENERAL MATHEMATICS LIBRARY II.md` L-0408) and `LAMBDAWAVES CLAUDE MASTER GOAL SPEC 2026-09-02.md` §38–39.
Nothing was run except `ls`/`grep`/`sed`/`cmp`/`diff`/`du`; no file but this one was written. "D1:n" = PLAN-DRAFT-1 line n.

---

# PART A — THE AUDIT

## A0 · Summary (ten lines)

1. The split at the kit boundary is right. DRAFT 1's 0.4.0 is still too wide, and about forty per cent of it is invisible
   in Josh's first ten minutes: the seams, a canary run on every alpha, chips and CITE behind a ⓘ that ships OFF, TAKE
   MODE without the layer it optimises, and a warm cover for a WebKit bug that is fixed upstream.
2. The engine wall is misidentified: it is the 16 KiB workgroup χ tile, not a `var<function>` array (A1.1). So the
   64→128 AO lift is one tier and one measurement, not a streaming kernel. That puts the amino acids, adamantane, caffeine,
   DMT, the base pairs and the d-block carbonyls inside 0.4.0 as records.
3. The ERI is stored dense (A1.2). It limits live solves, not records generated offline. No ERI work belongs in 0.4.0.
4. "The cost model is stale" is not established (A1.3). The live cap moves only after a like-for-like re-time.
5. The canary cannot run as written, because `--dry-run` writes nothing (A1.4). The measurement is a real adopt into a
   throwaway worktree, run twice (now and at the `1.5.0` cut), not on every alpha.
6. Of the ten seams, only `cameraEye` both deletes code and serves a 0.4.0 feature. `reg.onChange` is replaced by keying
   on the rendered string, which needs no new API. The rest wait for the canary's red list.
7. Most of DRAFT 1's new app UI is kit work done twice: the OVERLAYS row with four new stage overlays, a four-window
   re-skin, TO NOTEBOOK, an EXPANSIONS tab, chips, FIGURE and TAKE MODE. It moves to the briefs and to 0.5.0.
8. Josh's periodic table already has a home: the hidden ATOMS window (Xα, H–Kr). Bringing it back also fixes the orphaned
   ATOM button (the audit's F6) in the same move.
9. "Cyclotomic scaling" in Josh's corpus is the character-basis principle (MASTER GOAL SPEC §39; L-0408). Its honest
   engine form is symmetry adaptation. That is a Sol thread with one measured number in 0.4.0, not a 0.4.0 engine.
10. "Lower orbitals go nuts" gets two small 0.4.0 answers built on existing machinery: a VALENCE density view and a CORE
    fold on the MO-REGISTRY ladder. ATOMS already solved the same display problem with a log scale.

## A1 · Factual errors and unverified claims in DRAFT 1

1. **The 64-AO wall** (D1:183–185, "the shader's `array<f32, 64>` AO array (`field.js:672`) is the live limit"). `field.js:672`
   is a stale comment on `MAX_MOL_AO`. The kernel holds χ in WORKGROUP memory (`field.js:177–184`: `var<workgroup> chiW:
   array<f32, cap*64>`; the move took the 3070's benzene dispatch from 9.07 to 2.80 ms, `field.js:178–182`).
   `field.js:674–677` says the tile at cap 64 "is the whole 16 KiB workgroup budget". The wall is WebGPU's default
   `maxComputeWorkgroupStorageSize` (16384 B), and `gpu-boot.js:38–41` requests only `maxTextureDimension2D/1D`.
   "Chunk or stream the AO loop" is the expensive road. Two cheap roads exist: a cap-128 tier at workgroup 32
   (128 × 32 × 4 B = 16 KiB, no new limit), or asking the adapter for its own workgroup-storage limit (one key in `want`)
   and keeping workgroup 64 for a cap-128 tier. (A5 R1.)
2. **"Confirm the ERI's 8-fold packing"** (D1:185). It is not packed. `md.js:400` allocates `g = new Float64Array(n2 * n2)`,
   a dense n⁴ tensor. "8-fold" describes the FILL: each unique quartet is evaluated once and written to eight places
   (`md.js:255`). Dense bytes: 64 AO 134 MB, 87 AO 458 MB, 106 AO 1.01 GB, 120 AO 1.66 GB [my arithmetic]. It limits
   LIVE solves and the response (RPA, TDHF), never a record generated offline in node.
3. **"The cost model is stale: benzene 1.0 s vs 9.6 s"** (D1:170, B2). The two numbers time different paths. The probe
   timed `moleculeRHF`, the ground solve only (`PROBE.md` "What was run", step 1). `COST` (`molecules.js:358–389`) is
   fitted to the 2026-09-12 whole worker path, RPA inspector included: benzene measured 10,053 ms then, of which the RPA
   and the stability Hessian took 4.2 s. Today `ensureSolve` (`mathworker.js:212–238`) runs only the ground state,
   `ensureSpectrum` runs separately, and the discarded second integral pass (0.56 s) is gone. Staleness is plausible but
   unmeasured. The live cap must not move on the 1.0 s figure.
4. **The canary cannot run as written** (D1:61–64: "`adopt.mjs --line 1.5 --dry-run` … with stylehash … the occlusion
   suite"). `--dry-run` "say[s] what an adopt would copy and remove, change[s] nothing" (`mir-1.5-pin/tools/adopt.mjs:9`,
   `:119`). There is nothing to boot, stylehash or run. A canary needs a real adopt into a throwaway worktree.
5. **SCENES contradicts itself.** F3 (D1:144–146) and S4's acceptance (D1:226, "STATE's scenes seat") put SCENES in
   0.4.0 as "F7". But F7 is TAKE MODE (D1:197), and §8 (D1:268–269) lists SCENES under 0.5.0.
6. **H₂'s MAP is in two releases.** F3 (D1:142–143) builds "the first MAP" in 0.4.0; §8 (D1:270) puts MAPS in 0.5.0.
7. **TAKE MODE "hides the pointer glow"** (D1:199). λWAVES 1.4.3 has no pointer glow; it belongs to the 1.5 kit
   (`fx/pointer-light.js`; MIR-1.5 §7.3).
8. **Chips and CITE "in each window's ⓘ"** (D1:193–195). HELP is OFF at first run (CLAUDE.md; `body.window-info-off`), so
   both ship invisible to anyone who has not turned Help on, Josh included.
9. **"A ±1 half clamp reaches every part of the cube"** (D1:163–164). This is target-pan language (`domain.half` units)
   carried over to a lens shift, whose unit is a share of the view's width. It is wrong for the model the draft now
   builds first.
10. **"S1 ∥ S2, disjoint files"** (D1:224, :235). `lab/export3d.js` is in both: its projection at `:305` is a `cameraEye`
    site, and the names go into its GLB, cube and NPZ. The files are nearly disjoint; the names should land there first.
11. **"BASINS stopped four times on seventy such references"** (D1:75). Per MIR-1.5 §2.1 row 2b, BASINS stopped four times
    on four different gaps (look engine, FOLDERS, mod snap, rack). The seventy `#rack` references were only the rack stop.
12. **"Pan at ~30 fps with the rack's glass shown against 60 hidden … after its adoption"** (D1:97–98). The glass cost
    was measured both before AND after adoption (MIR-1.5 §3 "Compositor": "nothing was changed"). Only 82 vs 65 frames
    over 33 ms is an adoption regression.
13. **"A per-window cost line in SETTINGS › QUALITY"** (D1:149). It already exists: METERS' FRAME PROFILE prints each
    reader's ms (`meters.js:37`: spectrum, shadow, orbit, vortex, particles, Kepler, field lines, dynamics, slice, meters).
14. **"PERFORMANCE and GOVERNOR to SETTINGS › QUALITY"** (D1:140). The GOVERNOR switch is already in SETTINGS
    (`rack.js:1723`). Only the PERFORMANCE seg (`rack.js:2330`) lives in METERS. The GOVERNOR readout is a meter.
15. **The manifest test "when that tree is present"** (D1:58). The forger runs in the cloud without the MIR tree (Josh:
    "Claude Cloud cannot look inside my computer"). The check would skip exactly where the hole is.
16. **S0 "done when … MIR 1.4.4 adopted"** (D1:223). That is a MIR-session deliverable on a frozen line. λWAVES cannot
    promise it.
17. **The kit moved under the survey.** `mir-1.5-pin/mir/version.js` reads `1.5.0-alpha.23` today; MIR-1.5 §0 said
    alpha.22. A canary run on every alpha would churn with it.
18. **Brief 9, "the offline/install layer"** (D1:211). λWAVES keeps `sw.js` at adoption (MIR-1.5 §2.2 "Stay in the app").
    Its only kit need is that STATUS TAGS never hides the offer (`[data-mir-offer]`).
19. **The warm cover** (D1:199–201). WebKit 324043 is "fixed upstream after 26 shipped" (NOTES-FOR-AGENTS §1). Warming
    every draw style moves about 8 × 220–270 ms of Safari 26 stalls into the boot veil, to save one hitch. The trade is
    unmeasured.
20. **STEM "InChI/CAS"** (D1:182). CAS numbers come from a licensed registry; its open subset, Common Chemistry, is
    CC BY-NC, which is wrong for the stores programme. InChIKey and PubChem CID are open. Also, CCCBDB is NIST SRD 101, and
    SRD can carry NIST copyright under the Standard Reference Data Act, so a curated IE should cite its primary measurement.
    [legal reading unverified; check `LEGAL-PROVENANCE` before a store build]
21. **LATTICE "NaCl cubes"** (D1:177). Na₄Cl₄ is 72 AO (VAULT §7.3), past the current kernel. Only Na₂Cl₂ (36) fits before
    the new tier.
22. **"Re-date or wire" the expiring allowlist** (D1:55). Two of the seven entries are a duplicate. `lab/vendor/katex/` and
    `lab/vendor/marked.min.js` are byte-identical to `lab/mir/shell/vendor/*` (`cmp` and `diff -rq` found no difference),
    both trees are precached (`sw.js`: 30 and 24 entries), and `tests/pwa.test.mjs:714` asserts "two complete sets of
    twenty unmodified KaTeX faces". Pointing `index.html:57,71,72,124` at the kit copy WIRES those two entries and takes
    about 650 KB off every deploy (`du`: 612 K + 35 K).
23. **"The record schema reserves the wave-index slots"** (D1:85–86). This is a design choice, not a need (A4).
24. **`modArm` is Ctrl+Space** (`rack.js:4583`), not Space as MIR-1.5 R8 reads. It matters for R-K1's 0.5.0 key table,
    not for 0.4.0.
25. **Verified as stated:**
    - CALCULUS's ⧉: `rack.js:5438` reads `calculus.stats`, but `calculusview.js:50` returns `{ update, get last() }`. It is
      a one-word fix.
    - The badges ride METERS' tick (`rack.js:1094`).
    - `hydroReader` is at `rack.js:2728`.
    - MOLECULES' `<select>` has seven optgroups (`chemview.js:6,93`).
    - The wiring date: 2026-09-21 + 60 days = 2026-11-20 (`tests/wiring.test.mjs:59–65,463`).
    - Alt is free on the stage: `stage-gestures.js:40` and the specials at `rack.js:4473–4494` use only Ctrl and Shift.
    - The ATOM operator still reads "Self-consistent Xα central-field atom from H to Kr" (`rack.js:1924`), while its only
      editor, ATOMS (`rack.js:2653`), is hidden on Cloud's main.

## A2 · Laws DRAFT 1 still breaks

1. **Subtract, don't add.** 0.4.0 adds: an announce seam with a content table; an OVERLAYS row with four NEW stage
   overlays (SHADOW's phasors, ORBIT's spheres, PLANE's mini, CALCULUS residuals); one skin for four windows; TO NOTEBOOK;
   an EXPANSIONS tab; a periodic-table stopgap; chips; a CITE section; FIGURE with a drop intake; TAKE MODE; a warm cover;
   `docs/KIT-ASKS.md`; a per-window cost line; a canary log kept on every alpha. It deletes: DYNAMICS, Cloud's polling,
   and two DISPLAY widgets. The net is an addition.
2. **Only the engine is the app's.** The same list is chrome, overlays and behaviour: kit work, built in the app on a shell
   that 0.5.0 replaces. Josh put the SHADOW/ORBIT/PLANE overlays "on the informational", and that layer is the kit's.
3. **The glass is Josh's.** METERS and WIGNER get RADIATION's skin although only CALCULUS was asked for by name. That is a
   look change without a ruling.
4. **The three scopes (+ LIBRARY).**
   - (a) Collapsing STAGE FORMULA and ATOM LABELS drops `atomLabels`/`atomLabelsSize`. STATE-SCOPES and the PREF set in
     `tests/new-project.test.mjs` must change; the draft does not say so.
   - (b) TAKE MODE's scope is not stated.
   - (c) A project or link that names an uninstalled record has no stated open path.
   - (`obs.shift` as PROJECT, not in the history, is right.)
5. **The service worker.** "Outside the build cache" never says where records are SERVED from, or how
   `tests/pwa.test.mjs` ("the precache is the whole app") learns the exception. The warm cover adds boot work.
6. **No FPS stutter.**
   - (a) Big records have no cadence rule. The density contraction grows as nAO²: benzene's 2.80 ms at 96³ scales to
     about 16 ms at 87 AO and 31 ms at 120 AO [my arithmetic from `field.js:178–182`].
   - (b) If the stage text ever carries a live coefficient, KaTeX re-typesets on every CPU tick under a modulator.
   - (c) Cloud's atom labels rewrite their transforms every tick even when the pose is still (LWAVES-AUDIT A.1). The draft
     does not address it.
   - (d) Four new stage overlays.
7. **Never edit `lab/mir`.** Kept.
8. **MIR first → adopt → adapt.** The named stopgaps reverse this order. That is tolerable only where Josh asked by name
   and the stopgap replaces something; DRAFT 1 has ten.
9. **The verification dial.** Running the canary on every alpha with stylehash, pwa, occlusion and the byte suites is a
   gate fleet per alpha ("no gate fleets"). The 208-lock per commit across nine seams multiplies it.

## A3 · The stage order and the split

**The split is right**, for DRAFT 1's reason (0.4.0 may not wait on an event Josh has not announced) and for one more:
on 1.4.3, every UI feature would be built twice.

**The release is too wide**: seven stages, four verifiers, an L-cost library and about 30 features. The edits:

1. 0.4.0 becomes the ENGINE-AND-CONTENT release, plus the subtractions that shrink what the adoption must carry.
2. Every new UI piece the kit will own moves to a brief and to 0.5.0. Three exceptions stay, because Josh asked for them
   by name and each replaces existing UI: the periodic table in ATOMS, CALCULUS as tiles, and the markdown stage text with
   its fade.
3. The canary runs twice, not on every alpha.
4. The vague "0.4.x" bucket becomes **0.4.1 BUCKYBALL**. Josh's milestone deserves its own release, and C₆₀ needs a
   different road: a precomputed grid record (A7).

**The order inside 0.4.0 stands**: take-in → names ∥ `cameraEye` → camera → windows and stage text → library a/b/c, with
the briefs written throughout. The old S6 is deleted. The AO-tier measurement moves into S0, because it is a one-line
console check that sizes S4c.

## A4 · Over-planned (cut) and under-planned (the missing mechanism)

**Cut or move:**
- Seams (1) settings adapter, (3) project parts, (5) modulation port, (6) one-clock facade, (7) occlusion providers,
  (8) camera port and (10) tests by hook move to 0.5.0. One enters 0.4.0 only if the canary marks it a blocker. Each is
  either glue the adoption writes in tens of lines (MIR-1.5 §1, §4) or a block the adoption deletes. Seam (3) also risks
  the byte gates for no 0.4.0 gain.
- Seam (12) `reg.onChange` is cut. The stage text keys on the string it would render: one compare per tick, no new API.
- The OVERLAYS row with new stage overlays moves to 0.5.0, as layers of the info layer. DYNAMICS' PARTICLES moves into
  VORTEX (both use the same j/ρ).
- RADIATION's skin for METERS and WIGNER is cut. Only CALCULUS was asked for.
- TO NOTEBOOK, the EXPANSIONS tab, chips, the CITE face, FIGURE with its intake, TAKE MODE and the warm cover move to the
  briefs or to 0.5.0, or wait for a measurement. The record carries its sources (CITE as content), and the section header
  in MOLECULES is the expansion seat.
- Also cut:
  - the per-window cost line (it exists: `meters.js:37`);
  - `docs/KIT-ASKS.md` (a MIR issue is the outlet);
  - the schema "slots" (a versioned record whose readers ignore unknown members takes `Q_LM` later without a bump);
  - brief 12, camera keys (λWAVES writes its own rows);
  - brief 9, except the offer clause;
  - `lw:` links (a ruling, not a brief);
  - the table form of the copy (prose is what Josh described).
- Fourteen rulings that only 0.5.0 needs were asked as if they changed 0.4.0. They move to a separate, shorter list.

**The missing mechanisms:**
- **Where records live and how they arrive.**
  - Records sit at `lab/library/<sha>.json`: deployed, NOT precached.
  - The SW routes `library/` cache-first into `lw-data-v1`. The names are content hashes, so a new build never
    invalidates a record.
  - `tests/pwa.test.mjs` exempts exactly `library/**` and checks every manifest row's file and hash.
- **What a record-only molecule can do.** Each record carries `caps {orbitals, states, rpa, tdhf}`:
  - MO-REGISTRY ORBITAL needs ε and C.
  - STATES needs the stored CIS states.
  - RPA sticks are stored.
  - TDHF needs the live ERI, and past the cap it is refused with a sentence.
- **How a record opens without a solve.** A worker op `chem.open(record)` fills `chemSol` from the record and replies with
  the same `ground` shape that `ensureSolve` sends, so every window downstream is unchanged.
- **Geometry and oracle per new entry.** The library law applies to about 45 new entries: each needs a named geometry
  source, and `tests/molecules.test.mjs` holds every energy against the PySCF oracle. Most amino acids, clusters and
  carbonyls have no measured gas-phase structure, so each needs a stated computed geometry and an oracle energy. Size the
  sections by building three entries end to end first.
- **A mechanical diversity gate.** "Bonding motif" cannot be checked by a machine. The gate is: the formula is unique AND
  the entry adds a new element, a new point group, or a tag from a fixed motif list.
- **A cadence rule for big records** (A2.6a): the existing governor's GRID step and the tablet `QUALITY_CEILING`, with the
  frame-time numbers as the acceptance.
- **The open path for an uninstalled reference**: fetch the record on open. Offline, restore-with-rollback opens the rest
  and says which part refused.
- **The journal copy under a molecule.** EDIT › COPY is disabled under a molecular owner today. It should copy the
  molecule's record page (formula, configuration, HOMO/LUMO names, sources). That is the "copy/LaTeX for our markdown
  journal" Josh asked for.
- **The core display problem** (A7).
- **The PREF key change** for the merged STAGE TEXT row (A2.4a).

## A5 · The three highest-risk decisions, and the measurement that settles each first

1. **R1 · How the AO wall is lifted, and whether big records stutter.**
   - Measure `adapter.limits.maxComputeWorkgroupStorageSize` on the 3070 (Firefox and Chromium) and on the M5 (Safari).
     It is one console line on the live site.
   - Then time one dispatch of an 87-AO and a 120-AO record at 96³, in the density and orbital kinds, at workgroup 64
     (raised limit) and at workgroup 32 (default limit). In Firefox, batch for at least 2.5 s (NOTES §3).
   - Rule: if every target reports ≥ 32 KiB, request it and keep workgroup 64; otherwise use the workgroup-32 tier.
   - If an 87-AO density costs more than 8 ms on the M5, tablets open big records at 64³ through the existing ceiling.
   - The 1004-value lock proves the ≤ 64 tiers byte-identical.
2. **R2 · LIBRARY on the iPad.**
   - Measure on the M5, once as a Safari tab and once from the Home Screen: `navigator.storage.persist()`,
     `navigator.storage.estimate()`, and a 20 MB `lw-data-` write read back after a relaunch.
   - Safari caps script-writable storage at seven days for sites not added to the Home Screen, so the tab case must
     degrade to "download again".
   - The measurement decides whether KEEP ON THIS DEVICE is offered at all in a tab.
3. **R3 · How much pre-refactor 0.4.0 needs.**
   - Measure with one real `adopt.mjs <canary> --line 1.5` into a throwaway worktree on today's pin, then boot it.
   - Count red suites: `bash test.sh node`, then `frame-occlusion`, `history`, `new-project`.
   - Record the stylehash delta (README recipe, `--gpu 1`) and the precache bytes after `pwa.test.mjs --write`.
   - Rule: a seam enters 0.4.0 only if a red row names its block.
- **Cheaper, and a ruling once a build is in hand: lens shift vs target pan.** Build the lens shift and let Josh try
  Alt-drag zoomed in on benzene. Build the target pivot only if he asks to orbit a lobe.

## A6 · What Josh feels in the first ten minutes of 0.4.0

He opens the site. The left rack (Cloud's first run) holds SPECTRUM, MOLECULES and MO-REGISTRY.

- He turns MOLECULES on and gets water. The formula sits at the top in KaTeX. The ORBITAL knob reads `1b₁ · HOMO`, and
  the ladder reads `1a₁ 2a₁ 1b₂ 3a₁ 1b₁ | 4a₁`.
- He picks WINDING in MO-REGISTRY on benzene. `WINDING · 1e₁g (a) + (b)` fades in at the top and leaves. Benzene opened
  instantly, with no second of solve.
- He pages through the molecule sections (BIO, LATTICE, HEAVY) and picks tryptophan. It downloads and draws (87 AO). The
  ladder's core levels sit folded in one row, and VALENCE shows the π cloud the core used to drown.
- He Alt-drags. The molecule slides off-centre and keeps turning about itself.
- He picks ATOM in SPECTRUM. ATOMS opens with a vertical periodic table, and he taps Kr.
- He opens CALCULUS: two columns of tiles. Its ⧉ pastes into the notebook as a typeset figure.
- DYNAMICS is gone, and SLICE reads PLANE.

**DRAFT 1 only partly spends its budget there.** Its S1 seams, the canary run on every alpha, S6 (FIGURE, chips, CITE,
TAKE MODE, warm cover) and the four new stage overlays are all invisible in these ten minutes. The edited plan moves that
budget to the AO tier, the record path, VALENCE and CORE, the ATOMS table and the sections.

What he will notice missing is the INFORMATIONAL proper: springs, leader lines, pages. §1 and §8 say so plainly, and R-G2
lets him trade the release date for it.

## A7 · The engine question, honestly

**The 64-AO wall: a 0.4.0 deliverable.**
- The lift is one more tier (cap 128) in `MOL_CAPS`, by workgroup 32 or by the adapter's limit (A1.1, A5 R1).
- It unlocks, as records: Phe 71, Arg 74, Tyr 76, Trp 87, adamantane 66, Na₄Cl₄ 72, B₁₂H₁₂²⁻ 72, caffeine 80, DMT 86,
  diamantane 90, pyrene 90, A·U 99, G·C 105, A·T 106, C₂₀H₂₀ 120, Fe(CO)₅ 69, ferrocene 79 and Cr(CO)₆ 79 (VAULT §7).

**The ERI memory: not 0.4.0.**
- The tensor is dense n⁴ (`md.js:400`), which limits live solves only. Node holds 1.66 GB at 120 AO for the offline
  generator.
- Packing the storage 8-fold (n⁴/8) is a 0.4.1 item only if the generator needs more than about 150 AO. Only C₆₀ does,
  and C₆₀ goes through PySCF.

**The live cap: a 0.4.0 measurement, then perhaps a new number.** Re-time ground + spectrum on today's code (A1.3), refit
`COST`, then decide whether the cap should move past benzene.

**Heavier atoms: in 0.4.0 the K–Kr row gets exercised; beyond Kr is a research item.**
- The basis stops at Kr (`molecules.js` `MAX_Z = 36`).
- Inside it, the new tier makes d⁰/d⁶/d¹⁰ closed shells reachable as records: TiCl₄, Ni(CO)₄, Fe(CO)₅, ferrocene,
  Cr(CO)₆. The stability probe decides each one; CuH and ZnH₂ already failed it.
- Rb and heavier need basis data and an ECP. That is a Sol thread, not 0.4.x.

**"Lower orbitals go nuts": in 0.4.0, VALENCE plus a CORE fold.** Both problems are display problems:
- A Kr 1s primitive is far narrower than a 0.3 a₀ voxel, and core density scales roughly as Z³. Max-normalised ρ
  therefore shows the nuclei and drowns the valence.
- An 87-AO ladder piles up 15+ core levels 1e-5 to 1e-3 Eh apart (PROBE finding 2).
- Both answers reuse existing machinery:
  - VALENCE = `D − 2Σ_core C_c C_cᵀ`, formed in f64 and drawn by the existing density kind, with no shader change.
  - The ladder folds the frozen-core count into one `core ×n` row.
- ATOMS already met this problem with a log₁₀|ε| bar and a √r axis (`atomsview.js:13–15`).

**"Cyclotomic scaling" in Josh's sense: a Sol thread, with one measured number in 0.4.0. The novelty is a mirage; the
saving is real.**
- In his corpus the word lives in the ARITHMETIC WING (MASTER GOAL SPEC §38–39, QWAVE-7): roots-of-unity cycle modes,
  Gauss-period diffusion, and the principle "association kernels diagonalize in character bases; long diffusion becomes
  eigenvalue powers instead of repeated updates". It comes with firewalls ("Gauss sums are not physical amplitudes merely
  because they are complex").
- GML II L-0408 is the theorem behind it: the eigenvalues of the cyclotomic association scheme's class operator are the
  Gaussian periods (`det L₁ = f·N(η)`).
- λWAVES already lives by this principle for hydrogen: ψ(t) = Σ c e^{−iEt}, so nothing is integrated.
- For molecules the principle's engine form is symmetry adaptation:
  - the Fock matrix block-diagonalises by irreps;
  - the symmetry-unique ERI quartets fall by about 1/h;
  - on the grid, ψ(Rr) = χ(R)ψ(r) for 1-D irreps.
- The two readings meet at f = 2. The Hückel ring levels 2cos(2πk/N) = ζᵏ + ζ⁻ᵏ are Gaussian periods of length 2 in
  ℚ(ζ_N), and WINDING (`orbitalsview.js:74`) already draws that winding phase.
- Honest limits:
  - A Cartesian voxel grid admits only the operations that are signed permutations (at most 48). Benzene gets D₂h's 8,
    not D₆h's 24; CH₄ gets T_d's 24. So asymmetric-unit reconstruction gains at most 8× for most molecules.
  - I_h's 120 helps C₆₀'s ERI (60 GiB → about 0.5 GiB unique), not its grid.
- The 0.4.0 deliverable is the thread's ledger plus one number: benzene's unique-quartet fraction under D₂h, measured on
  `md.js`'s own loop by a `tools/` script.

**Wave index (ZOETROPE): in 0.4.0 the index exists as the record key; the rest is 0.4.1+.** The key (species, method,
(irrep, count)) comes from N1/N2. The station ring, the carousel at FPS marks and the warm/ghost tiers come later.

**"True electrostatics … QHO on Taylor 3D shells": a Sol/Opus thread, and a mirage if read as a new dynamics engine.**
- Reading A (transition multipoles Q_LM, L ≤ 2) is exact for a frozen packet. Its L = 1 case already exists (`rMO`,
  RADIATION).
- The vault's own earlier verdict is that a Taylor polynomial of an orbital creates no motion (VAULT §1.3).
- Not 0.4.0.

**C₆₀: 0.4.1 BUCKYBALL.**
- 300 AO. It needs a PySCF RHF/STO-3G record plus precomputed density and frontier-orbital grids uploaded into the
  molecular volume (one `field` upload road). Names wait for the I_h tables.
- It is not a kernel tier: an AO-chunked density would need per-voxel accumulators the kernel cannot hold.

---

# PART B — THE EDITED PLAN (PLAN DRAFT 1 · OPUS EDIT, for DRAFT 2)

*Every change is marked **[OPUS: …]**. Unmarked text is DRAFT 1's, kept.*

# λWAVES 0.4.0-alpha · THE FLAGSHIP — PLAN DRAFT 1 (Fable, after Sonnet's review) · OPUS EDIT (2026-10-07)

Read `NACRE.md` first, then `survey/*`, then `REVIEW-SONNET-0.md`, then `AUDIT-OPUS-1.md` Part A. Numbers are the
surveys' unless marked [mine] or [opus].

## 0 · What changed since DRAFT 0, in one breath

The release is split where the dependency is: **0.4.0 = the engine and its content — names, library, a wider kernel,
the camera's lens shift, the windows consolidated by subtraction — plus the kit briefs and a canary adoption; 0.5.0 =
the adoption and the INFORMATIONAL**, on the MIR session's word that 1.5 is done. **[OPUS: 0.4.0 narrowed to engine,
content and deletions; new kit-shaped UI moves to briefs and 0.5.0 — it would be built twice on 1.4.3.]** The kit gifts
move into a KIT BRIEFS stage (MIR first, adopt, then adapt). Pan is a lens shift (Josh's wording). The 64-AO wall is a
deliverable — **[OPUS: and it is the 16 KiB workgroup tile, so the lift is one tier, not a streaming kernel.]** Every
sentence of Josh's ask has a feature, a stage or a line in §8. Jet Black stays live without a forged manifest. One
window out for every window in. **[OPUS: C₆₀ gets its own release, 0.4.1 BUCKYBALL.]**

## 1 · THE GOAL

**Josh's words:** a pre-refactor for MIR 1.5 that makes λWAVES the flagship; the cache as expansions with metadata,
STEM information and LaTeX copy into the journal; true ladder names (`1a1, 1b2`) where the knob reads HOMO−1 today;
wave-indexed presolved orbitals toward dynamic waves with true electrostatics; diverse library sections (a vertical
periodic table, heavy atoms, crystal lattices, biology, a bucky-ball milestone); engine upgrades for larger counts and
heavier atoms, with a cyclotomic-scaling research thread with Sol; the INFORMATIONAL as a live, cursor-aware markdown
overlay with proper maths that announces changes and fades; GPU-recording optimisation; camera pan and the dot-matrix
XY; the legacy windows audited and consolidated with power buttons and DISPLAY doing the resource work; CALCULUS as an
overlay with a prose figure copy into a built-in journal; STATE audited; the dot matrix on every inlay.

**Ours [mine].** λWAVES becomes the app where the kit's next features are specified and proven first, while its physics
grows from a solver into a **library**: named, cached as expansions, sectioned for diversity, honest about what each
record claims, readable by an overlay and quotable by the journal. The ENGINE stays λWAVES'; every window and behaviour
is the kit's; what λWAVES needs and the kit lacks becomes a brief the MIR session builds; pages and records are content.
**[OPUS: The pre-refactor is SUBTRACTION — what the adoption will not have to carry (DYNAMICS, a duplicate vendor tree,
the decided legacy windows, Cloud's interim code, nine projection copies) — plus the briefs, so `1.5.0` arrives carrying
what λWAVES needs. Seams that only move lines wait for the canary to prove they are needed.]** 0.4.0 does everything that
does not need the kit's new shell; 0.5.0 takes the shell in and lights the overlay. **[OPUS: What 0.4.0 shows of the
INFORMATIONAL is its first taste only — the stage formula typeset in KaTeX and a preset's name fading at the top; the
springs, leader lines, pages and the film overlay are 0.5.0 (R-G2 trades the date for them).]**

**Flagship, operationally (R-F1):** **[OPUS: reworded — in 0.4.0 flagship means λWAVES writes the briefs `1.5.0` must
carry and runs the canary at the cut; in 0.5.0, λWAVES adopts `1.5.0` first among the big four and its gates join the
kit's release checklist.]** "Prefer BASINS" stays the rule for what BASINS designed, and λWAVES' design wins for what it
originated (modulation, camera 3-D, notebook, history, three scopes, the keyboard window) and for everything new in the
briefs.

## 2 · THE SHAPE: engine / kit / content

| | λWAVES keeps (ENGINE) | The kit's, or λWAVES' brief to the kit | CONTENT |
|---|---|---|---|
| now | `field.js` **[OPUS: + the cap-128 tier and the lens-shift ray]**, the register and solvers, `electrostatics.js`, `period.js`, the palette's meaning, `badges.js`, `statelink.js` v1, `export3d.js`, `latex-state.js`, `names.js` (new), the digest lock, `sw.js` + the offer **[OPUS: for good — the kit has no offline layer and λWAVES keeps its own]**, the camera LAW | **[OPUS: the adoption glue (modulation port, project parts, occlusion feed, one-clock facade, camera port, ≈1–1.5k lines) is written at 0.5.0, not now]** | pages (`.md`), the LIBRARY records with names, STEM fields and sources inside, sections, covers, demos **[OPUS: CITE rows are record content, not a face]** |
| briefs (0.4.0 → kit) | — | **[OPUS: re-cut; see §5]** 8 painted-surfaces provider (**the adoption blocker**) · 2 lens shift in the CAMERA panel · 3 `md()` window copy + TO NOTEBOOK + PIN FROM WINDOW · 4 `cells` grid control · 5 `createLattice` exported · 6 overlay in the film · 7 `addLabel({ttl})`, `setCheap`, `html[data-take]` · 9′ STATUS TAGS never hides `[data-mir-offer]` · 13 the INFORMATIONAL rack window · live-bound math labels · P the paint gesture · J `jetblack` + `flat` for the big four · 1 the 3-D camera law (a gift, not a 0.5.0 dependency) | — |

## 3 · THE BASELINE CHANGES (0.4.0, in order)

**B0 · TAKE-IN, then subtract, then cut 0.3.3** (LWAVES-AUDIT A).

- **The situation.** The live site serves Cloud's main: the version line still says 0.3.2-alpha, and the served rack
  carries the stage formula.
- **Merge.** Merge PR #1, then PR #2. There is one textual conflict, the generated `sw.js`; regenerate it.
- **One subtraction commit:**
  - **Jet Black stays live and the manifest becomes true.** Cloud's direct `lab/mir` edit and forged `MIR-MANIFEST.json`
    go; the preset returns by R-A3's route. **[OPUS: Either a real MIR 1.4.4 on `mir-1.4.x` (the MIR session's work, not
    a λWAVES promise) or, since the palette is the engine's, one app-side catalogue row in `lab/` until 1.5 carries it
    (brief J). S0 does not wait on the MIR session.]**
  - The `copyLatex` gate reads "a molecular owner is on". **[OPUS: Under a molecular owner, EDIT › COPY copies that
    molecule's page instead of greying out (F1's record page). That is the journal copy Josh asked for, on an existing
    road.]**
  - `.mol-more` **[OPUS: joins the LEAN rule (`lab.css:425`), so the card's existing `Aa` reveals KICK / RUN / TDA / the
    spectra. No new fold is needed, and the two bent tests reach it through the UI.]**
  - SPECTRUM's orphaned buttons (R-A2). **[OPUS: ATOM gets its editor back (ATOMS returns, F3). QUARKONIUM is hidden
    while QCD stays hidden.]**
  - CLAUDE.md's false line and stray sentence. **[OPUS: Also state the first-run law once: Cloud's left rack supersedes
    "MOLECULES start off the rack".]**
  - A REPORT wave for what was kept.
- **The audit's cheap bugs, as their own commit, each with a test:**
  - CALCULUS's ⧉ **[OPUS: `DIGESTS.calculus` reads `calculus.last`, the field the view actually returns]**.
  - The badges and the canvas sentence get their own ≤ 10 Hz tick (today they tick only while METERS is presentable).
  - `hydroReader` learns `chem`.
- **[OPUS: Wire, don't re-date.** `index.html` loads KaTeX and marked from `lab/mir/shell/vendor/`, and the
  byte-identical `lab/vendor/katex` and `marked*` are deleted. That is about 650 KB less on every deploy;
  `tests/pwa.test.mjs:714` then expects one set of twenty faces, and two allowlist entries close by wiring. The other five
  entries name their caller (the 0.5.0 adoption) and are renewed once, with REPORT saying so.**]**
- **The LINKED bug.** Repro the reported "Space does not play both clocks in LINKED mode at project open" and fix it in
  place. The clocks become one at 0.5.0.
- **Close the process hole.**
  - One CLAUDE.md line: "Cloud: PRs only, never `lab/mir`; a kit need is a MIR issue or a line in the PR".
    **[OPUS: Cut `docs/KIT-ASKS.md`; the MIR issue tracker is the outlet.]**
  - `tests/mir-manifest.test.mjs` **[OPUS: pins the sha-256 of `MIR-MANIFEST.json` for each released version it accepts
    (1.4.3 today). A forged version then fails everywhere, the cloud included, and a real adoption becomes a visible
    two-file edit. This replaces "when the MIR tree is present".]**
- **[OPUS: Two one-line measurements, here because they size later stages:**
  - the adapter's `maxComputeWorkgroupStorageSize` on the 3070 (Firefox, Chromium) and the M5 (A5 R1);
  - a like-for-like re-time of the benzene worker path, ground + spectrum, in node and in the browser (A1.3).**]**
- **Then cut 0.3.3** from this tree (R-A1): the exports plus Cloud's kept work, so the live site is honest.

**B0.5 · THE CANARY.** **[OPUS: rewritten — `--dry-run` writes nothing.]**
- A throwaway worktree, `canary-1.5`, is never merged; Josh's freeze covers what ships, not this.
- It takes a REAL `adopt.mjs <canary> --line 1.5` from the pin, boots, and logs one row in `docs/MIR-1.5-CANARY.md`:
  - red suites: `bash test.sh node`, then `frame-occlusion`, `history`, `new-project`;
  - the stylehash delta (README recipe, `--gpu 1`);
  - precache bytes after `pwa.test.mjs --write`.
- **[OPUS: Run it twice: now (alpha.23) and at the `1.5.0` cut, not on every alpha. The pin already moved once under the
  survey, and BASINS' eleven re-adopts are the churn to avoid.]**
- Its red rows decide which seams enter 0.4.0, and they turn 0.5.0's adoption into a diff of known deltas.

**B1 · THE SEAMS.** **[OPUS: cut to one by default.]**
- (11) **`cameraEye(obs, half) → {eye, target, basis, shift}`**: one projection helper for the nine copies (`field.js`
  `writeView`, `fieldview`, `keplerview`, `particles`, `vortex` and its cache key, `export3d`, `pointerRay`, `unproject`,
  Cloud's atom labels).
  - It is a deletion, and the precondition for the lens shift and the atom labels.
  - `cameraKey` gains the shift, so cached 2-D overlays redraw.
- **[OPUS: Seam (12) `reg.onChange` is cut.** The stage text keys on the string it would render: one compare per tick,
  no new register API.**]**
- **[OPUS: Seams (1) (3) (5) (6) (7) (8) (10) enter 0.4.0 only where a canary row names their block as a blocker.**
  Otherwise the adoption writes them as glue.**]**
- **[OPUS: "No code outside the rack block reaches `#rack`/`floats`" is measured by the canary, not legislated now.**
  `keys.js`, `menubar.js`, `rack-menus.js` and `modwindow.js` reach them today.**]**
- Measure the total of `lab/*.js` lines (34,721 today), not `rack.js` alone.
- The 208-value lock runs per frame-path commit, the 1004-value lock once at the end, and a red result is re-run alone
  before it is believed (the RTX 3070 one-ulp fault).

**B2 · LIBRARY, the fourth storage class, and the data cache** (NAMES-AND-CACHE §6, with Sonnet's hazards).
- **The scope.** Installed records are device content, content-addressed, never in a project, link or history row. A
  project holds `{id, hash, nameKey}`: PROJECT, with one history row per change of molecule.
- **[OPUS: Where records live.**
  - At `lab/library/<sha>.json` plus the section manifests: deployed but NOT precached.
  - `sw.js` routes `library/` cache-first into `lw-data-v1`. The names are content hashes, so a new build never clears
    it.
  - `tests/pwa.test.mjs` exempts exactly `library/**` and asserts that every manifest row's file exists with its
    hash.**]**
- **The iPad law.** `navigator.storage.persist()` is asked on first install; the quota and the persisted answer are
  shown; an evicted record degrades to "not installed", never to a broken preset. **[OPUS: In a Safari tab (seven-day
  cap on script-writable storage), KEEP ON THIS DEVICE is offered only if A5 R2 shows persist is granted there.]**
- **The benzene-cap law** (`molecules.js:25–27`). A record past the live cap opens only from its record. If the record is
  absent, its row says DOWNLOAD, not DISABLED. A basis or charge change on it is refused with a sentence, not a solve.
- **[OPUS: The record path.**
  - A worker op `chem.open(record)` fills the worker's solve cache from the record and replies with `ensureSolve`'s own
    `ground` shape, so no window downstream changes.
  - Each record states `caps {orbitals, states, rpa, tdhf}`: ORBITAL needs ε and C; STATES needs the stored CIS states;
    RPA sticks are stored; TDHF needs the live ERI and past the cap is refused with a sentence.
  - A link or project that names an uninstalled record fetches it on open. Offline, the open restores the rest and names
    the part that refused.**]**
- **[OPUS: The schema is versioned (`schema: 1`), and readers ignore unknown members.** The wave index's `Q_LM` and a
  grid handle can arrive later without a bump, so no slots are reserved.**]**
- **The generator is the app.** `tools/orbital-library.mjs --check` is byte-exact (the `new-project.mjs` pattern).
  - It enforces a **diversity gate**, **[OPUS: made mechanical: the formula is unique in the library AND the entry adds a
    new element, a new point group, or a tag from a fixed motif list (ring size, peptide bond, d-block, cluster, cage,
    nucleobase)]**.
  - It also writes each record's **page** (formula, point group, configuration in LaTeX, HOMO/LUMO names, sources). That
    page is the journal copy now and, at 0.5.0, the record's INFORMATIONAL page.
- `docs/STATE-SCOPES.md` gains the row.
- **[OPUS: Cut the SETTINGS EXPANSIONS tab.** The expansion seat is the section header in MOLECULES (F5): name, records,
  bytes, an installed lamp, REMOVE.**]**

**B3 · The frame-path budget, with numbers as acceptance:** nothing new on the frame path.
- Names are computed in the worker inside `ensureSolve` (≤ 10 ms, benzene); the library fetch runs in idle.
- **[OPUS: The stage text re-renders only when its string changes, never carries a live coefficient, and runs KaTeX at
  most four times a second. Cloud's atom labels write only when `cameraKey`, the shift, the preset or the size
  changes.]**
- A lens shift is TIER.PRESENT only.
- Every reader stays `may()`-gated and idle when its window is off, folded, closed, hidden or offscreen.
- **[OPUS: Big records.** The density contraction grows as nAO²: about 16 ms at 87 AO and 31 ms at 120 AO at 96³ on the
  3070, scaled from benzene's measured 2.80 ms [opus arithmetic]. A static record costs one dispatch per change. A
  playing STATES register on one rides the existing governor's GRID step and the tablet ceiling; no new mechanism.**]**
- **[OPUS: The frame-time protocol is the existing device report** (`tools/perf/device-report.js`, its 30 s play scene;
  `?report=1&post=1`), run before and after on the 3070 and on the M5 (Josh runs the M5 half). It is the acceptance of
  S2, S4c and, in 0.5.0, the adoption.**]**
- **[OPUS: BASINS' numbers are the warning.** The rack's glass halves a pan's frame rate both before and after adoption
  (about 30 vs 60). After adoption, 82 frames went over 33 ms against 65.**]**

## 4 · THE FEATURES (0.4.0)

Each: what the reader does, where · kit or app · cost · what it must not do.

**F1 · THE NAMES** (NAMES-AND-CACHE; the probe matched every textbook configuration).
- **What the reader sees.** The ORBITAL knob and ladder in MO-REGISTRY read `1b₁ · HOMO`, `3a₁`, `1e₁g (a)`, `2σ_u`.
  - Hovering a rung shows the name, its frame and its `computed / derived / curated` tag.
  - A degenerate HOMO is one HOMO. Today its members read HOMO−2, HOMO−1, HOMO in CH₄, HF, CO₂ and C₆H₆.
  - ⧉ copies `$1b_{1}$` in the notebook's spelling, and the GLB, the cube and the NPZ carry the names.
- **The machinery.**
  - One service, `lab/names.js`, for atoms and molecules; the four formatters become one.
  - Declared groups and frames in the library, plus d shells and the five remaining tables, so 6-31+G* is named too.
  - Cluster tolerance 2e-10 Eh; the geometric tolerance is stated (furan and pyridine close to 1e-3 bohr).
  - A names record is all or nothing: a record below tolerance shows indices throughout, never a mix.
  - One PySCF cross-check in `tools/`.
- **"True human information."** Per orbital: the textbook LCAO name (derived for diatomics) and the character (core / σ /
  π / lone pair). For the ten probed molecules, the vertical ionisation energy sits beside Koopmans' −ε, tagged `curated`
  with the honest gap. **[OPUS: Each value cites its primary measurement (CCCBDB is NIST SRD 101; check
  `LEGAL-PROVENANCE` before a store build).]**
- **The teaching moment** the probe found becomes a demo project and a page: N₂'s HOMO is `3σ_g` in STO-3G and `1π_u` in
  6-31+G*.
- **[OPUS: The CORE fold.** The ladder folds the frozen-core levels into one `core ×n` row, opened by a click. The count
  is per element: He core for Li–Ne, Ne core for Na–Ar, Ar core for K–Ca, Ar + 3d¹⁰ for Ga–Kr. Without it, an 87-AO
  molecule's ladder is fifteen core lines and a heap.**]**
- · MO-REGISTRY, SPECTRUM, exports · engine/app · M · never asserts an ordering.

**F2 · THE STAGE TEXT AND ITS FADE, the first taste of the INFORMATIONAL** (LWAVES-AUDIT D).
- **The formula.** Cloud's plain-text formula becomes markdown + KaTeX through the notebook's own renderer
  (`renderNotebook`; marked and KaTeX are already loaded). Its sources are `stateLatex`'s state list and a one-function TeX
  of the library formula, and it re-renders only when the string changes.
- **Atom labels** go through `cameraEye` and are written only on change.
- **The fade [mine, OPUS-cut].** `announce(md, ttl)` writes into the same node and fades after its ttl.
  **[OPUS: It is called by exactly the controls Josh named, MO-REGISTRY's WINDING and HOMO + LUMO presets, whose text the
  names make meaningful (`WINDING · 1e₁g (a) + (b)`), plus SPECTRUM's presets. The palette/camera/STYLE HUD and its
  content table are cut to 0.5.0, where `addLabel({ttl})` is the kit's. Josh's own "who knows" on the non-educational
  HUD is R-I2.]**
- **The type scale** is the notebook's: formula = title, announcement = heading, atom label = body. The maths face is
  KaTeX.
- **[OPUS: One DISPLAY row.** STAGE FORMULA + ATOM LABELS and their two SIZE knobs become ONE row, STAGE TEXT (switch +
  SIZE), governing the formula, the fade and the labels together. PREFERENCE keeps `molFormula`/`molFormulaSize`;
  `atomLabels`/`atomLabelsSize` are read once and dropped; STATE-SCOPES and the PREF set in `tests/new-project.test.mjs`
  change with it.**]**
- **At adoption**, `announce` becomes `layer.addLabel({ttl})` and the formula becomes `layer.addBlock({md})`. This interim
  renderer is then deleted; it is named here so 0.5.0 deletes it.
- · the stage, SETTINGS › DISPLAY · app now, kit at 0.5.0 · S · no per-tick layout reads; no live coefficient on the stage.

**F3 · THE WINDOWS** (LWAVES-AUDIT B; Josh: "audit, consolidate, leverage power and DISPLAY").
- **Retire DYNAMICS** (R-W1).
  - L/T/V/S and its plot go to SHADOW's footer; the moments and the virial become CALCULUS tiles; the dipole lines go to
    RADIATION; ACTION–ANGLE goes (SPECTRUM is it).
  - **[OPUS: PARTICLES becomes a switch in VORTEX, not a new row. They use the same j/ρ, and VORTEX becomes "the
    flow".]**
  - `RETIRED_WINDOWS` maps `dynamics → shadow` for saved layouts. One card and up to about 470 lines go.
- **[OPUS: Cut the OVERLAYS row in WAVE** (SHADOW's phasors, ORBIT's spheres, PLANE's mini and CALCULUS' residuals as new
  stage overlays). Josh placed them "on the informational": they are 0.5.0 layers that the INFORMATIONAL window lists
  and the user can move. Until then, the four existing overlays keep their switches in their own windows.**]**
- **CALCULUS like RADIATION** (Josh's words).
  - RADIATION's skin goes to CALCULUS alone. **[OPUS: METERS and WIGNER keep theirs: they were not asked for, and a
    look change is Josh's ruling.]**
  - The laws become tiles in a grid (two columns on the card, three floating), opted out of LEAN, and every row gains
    `tex`.
  - ⧉ copies **the prose figure** Josh described: a heading, then "Figure. ⟨ψ|ψ⟩ = 1.000 (d/dt = 0 to 1e-9); …", with
    related rows combined into sentences (the Ehrenfest pair as one), inline `$…$`, and display `$$…$$` for the laws.
    The copy pastes into the notebook and renders.
  - **[OPUS: TO NOTEBOOK is cut to brief 3. On 1.4.3 there is no menu behind ⧉ to put it in, and paste already reaches
    the journal.]** (R-W2: prose by default.)
- **METERS.** The badges leave its tick (B0). **[OPUS: The PERFORMANCE seg moves beside GOVERNOR in SETTINGS › QUALITY
  (`rack.js:2330` → `:1723`). The GOVERNOR readout and FRAME PROFILE stay; FRAME PROFILE already prints each reader's ms
  (`meters.js:37`), so there is no new cost line.]**
- **WIGNER and RADIATION:** `hydroReader` + `chem` (B0).
- **Names:** SLICE → **PLANE** and SLICE / CLIP → **CLIP**, ids stable (R-W3).
- **[OPUS: ATOMS returns as the periodic-table window.**
  - It answers Josh's "vertical periodic table" and "large/heavy atoms", in the SPECTRUM-button style he named.
  - Its Z stepper becomes a grid of H–Kr cells grouped by period (periods as columns on the card and on a phone, as rows
    when floating), built with SPECTRUM's own button builder.
  - Choosing ATOM in SPECTRUM opens it.
  - Its readouts (Δ-SCF beside −ε, the quantum defect, the α-dependent order) are physics no other window has.
  - One hidden window comes back, one orphaned button is fixed, and no new window is added. At 0.5.0 the grid becomes the
    kit's `cells` control (brief 4).**]**
- **The legacy rest** (R-A2). H₂⁺, HELIUM, H₂, ELECTROSTATICS and QCD stay hidden in 0.4.0. **[OPUS: They are decided at
  0.5.0. H₂'s FCI curve becomes a MAP in 0.5.0 with MAPS, not in 0.4.0.]**
- **STATE audited** (R-W5).
  - The window holds preparation controls, has no reader, and hides under a molecular owner. No other window duplicates
    it, so it keeps its controls. **[OPUS: SCENES is 0.5.0 (§8); 0.4.0 changes nothing in STATE.]**
  - The app's state: the three scopes plus LIBRARY, re-proven after every stage by the existing suites, and B2's open path.
- **"Somewhat realtime"** (R-W6). Power stays binary (Josh: leverage it). The cadence is the existing reader law: every
  4th frame at PERFORMANCE 120, every frame at FULL, parked above 6/16 ms. **[OPUS: Its meter is METERS' FRAME PROFILE,
  as today.]**
- **The window cost law, restated:** off, folded, closed, hidden or offscreen costs zero; the stage text joins it.
- · app (the CALCULUS grid and the ATOMS cells become kit by briefs 3–4) · M · nothing that reads layout per tick.

**F4 · THE CAMERA** (LWAVES-AUDIT C; Sonnet's re-cut).
- **A lens shift.** The picture slides and the molecule stays the pivot. That is what "a planet photo at max FOV" says,
  and it matches the kit's pad unit (a share of the view's width).
- **[OPUS: The mechanism needs no new uniform lane.**
  - `writeView` writes the shifted principal ray `fwd + sx·tanH·aspect·right + sy·tanH·up` into `V.fwd.xyz`
    (`field.js:1018`). The ray generation at `:334` normalises it, and the headlight at `:310` follows it.
  - The line chrome's perspective matrix gains the matching principal-point offset in two entries (`field.js:557–560`).
  - At shift 0 both are byte-identical, so the 1004-value lock holds by construction.
  - `cameraEye` hands the shift to the 2-D overlays.**]**
- `obs.shift = [sx, sy]`, in shares of the view's width, **[OPUS: clamped to ±0.5: the pivot may reach the frame's edge,
  never leave it]**. With the racks open, it lets the subject sit in the open gap.
- **[OPUS: The target pivot is cut from 0.4.0.** It would be a second model, a second field and a second test set. It is
  built only if Josh, having tried the shift zoomed in, asks to orbit a lobe (R-C1).**]**
- **Hands.**
  - **Alt-drag pans on a trackpad and a mouse.** Alt is free on the stage: `stage-gestures.js:40` and the specials at
    `rack.js:4473–4494` use Ctrl and Shift. Right and middle buttons are unusable on a trackpad and an iPad.
  - A two-finger drag pans on touch, beside pinch. The wheel stays dolly.
  - An Alt+Arrow pair on the keys, registered in `lab/shortcuts.js`, with `tests/keyboard-shortcuts.test.mjs` extended.
- **The window and the state.**
  - CAMERA gains PAN X / PAN Y (two knobs now; the pad with the lattice at 0.5.0, and the knobs are its targets) and
    PAN HOME. RESET VIEW clears the shift.
  - Targets `observer.panx/pany`.
  - STATE-SCOPES' pose row gains `shift` (PROJECT, not history).
  - The empty project is regenerated (`tools/new-project.mjs`, `--check`).
  - **[OPUS: Links stay v1 and open centred. That is honest and needs no codec work (R-C2).]**
- **[OPUS: Cut the "±1 half reaches every part of the cube" sentence; it uses target-pan units.]**
- · CAMERA, the stage · engine (ray-gen) + kit (panel, by brief 2) · M · PRESENT tier only; a verifier (the camera
  uniform is the frame path).

**F5 · THE LIBRARY as expansions** (Sol's plan + NAMES-AND-CACHE §6–7 + VAULT §7; Sonnet's rewrite).
- **S4a · the benzene proof and the store.**
  - A record (Sol's native booster + names + STEM fields + its page) opens with no SCF, through `chem.open`.
  - `lw-data-v1` is served from `lab/library/`; the scope row lands.
  - Persistence, eviction and quota are measured on the M5 (A5 R2). A verifier (worker + storage).
- **S4b · the sections as content, behind the diversity gate.**
  - **[OPUS: The picker.** A page turner `‹ SECTION ›` sits above the existing `<select>`, which then holds one section
    (about 25 rows at most). It reuses the existing control and needs no search box; search is 0.5.0's FLY-TO.**]**
  - **[OPUS: The expansion seat.** Each section's header row is the expansion: name, record count, bytes, an installed
    lamp, INSTALL / REMOVE. That is "treat the caching like expansions", seated in the window that uses it.**]**
  - **Sections, diverse rather than variants** (R-L1):
    - DIATOMICS · HYDRIDES · ORGANIC.
    - **BIO**: the sixteen amino acids ≤ 64 AO, the five nucleobases (44–60), Gly-Gly (57), N-methylacetamide,
      imidazole, indole, phosphoric acid, ribose. Leu and Ile share a formula, so the gate keeps one.
    - **LATTICE**, finite clusters only (the solver has no k-points): LiH/LiF/MgO cubes, Na₂Cl₂, the ice hexamer and
      cube, cubane, neopentane, naphthalene, Si₅H₁₂. **[OPUS: Na₄Cl₄ (72) after S4c.]**
    - **HEAVY**, the Kr row the basis reaches: KrF₂, SeO₂, KBr, GeCl₄, TiCl₄. For the d-block, "try it and let the
      stability probe decide".
  - **Bases.** STO-3G + 6-31+G* pairs for anchors only. The name is the join key, so an A/B MORPH between bases means the
    same orbitals.
  - **STEM fields per record** (R-L4): formula, point group and frame, mass, charge and multiplicity, dipole, HOMO–LUMO
    gap, geometry source, **[OPUS: InChIKey and PubChem CID (open; not CAS numbers, which come from a licensed
    registry)]**, a two-line blurb, the curated IEs where they exist, and the sources (the CITE rows, as content).
  - **[OPUS: Sizing.** Every entry needs a stated geometry source and a PySCF oracle energy (`tests/molecules.test.mjs`'s
    law), and most amino acids, clusters and carbonyls have no measured gas-phase structure. Build three end to end
    first (alanine, Li₄F₄, TiCl₄), time them, then size the list.**]**
- **S4c · the engine upgrade that lifts the first wall.** **[OPUS: rewritten.]**
  - The wall is the χ tile in workgroup memory: cap × 64 × 4 B, which is 16 KiB at cap 64, WebGPU's default
    `maxComputeWorkgroupStorageSize` (`field.js:177–184`, `:674–677`). `gpu-boot.js:38–41` asks only for texture limits.
  - Add one more tier to `MOL_CAPS`, cap 128, by A5 R1's rule: request the adapter's workgroup-storage limit where every
    target grants ≥ 32 KiB; otherwise use a workgroup of 32 for that tier only.
  - The ≤ 64 tiers' pipelines are untouched, and the lock proves it.
  - Records generated offline in node then reconstruct: Phe, Arg, Tyr, Trp (71–87 AO), adamantane (66), Na₄Cl₄ and
    B₁₂H₁₂²⁻ (72), caffeine (80), DMT (86), the base pairs (99–106), C₂₀H₂₀ (120), and the carbonyls and ferrocene
    (69–79). The dense ERI is 458 MB at 87 AO and 1.66 GB at 120 AO: fine for the generator, never for a live solve.
  - **VALENCE** joins MOLECULES' VIEW (DENSITY · ORBITAL · Δρ · VALENCE). It is `D − 2Σ_core C_c C_cᵀ`, formed in f64 and
    drawn by the existing density kind, so the heavy-atom core no longer drowns the valence picture.
  - The live cap moves only after B0's re-time and a refit of `COST`.
  - **C₆₀** (300 AO) is 0.4.1 BUCKYBALL (§6).
  - A verifier and the frame-time protocol.
- · MOLECULES (sections and expansion headers) now, FOLDERS at 0.5.0 · engine/content · L · never a second solve road;
  never a record that fails validation; never a disabled row where a download would do.

**[OPUS: F6 · THE FIRST HARVEST ROWS — cut from 0.4.0.** FIGURE needs the kit's `core/png.js`, envelope and intake
(0.5.0). Honesty chips and a CITE face in the ⓘ would ship invisible, because HELP is off at first run. The sources ride
the record as content now, and the chips arrive with the INFORMATIONAL. See §8.**]**

**[OPUS: F7 · TAKE MODE and the warm cover — cut from 0.4.0.**
- TAKE MODE optimises a layer λWAVES does not have yet. It is brief 7 and lands with that layer in 0.5.0: pinning the
  governor tier, a fixed cadence, and a wake lock through the kit's `installWakeLock`.
- The warm cover trades about 2 s of Safari 26 boot stalls for one hitch that WebKit has already fixed upstream. Measure
  it on the M5 before planning it again (§8).**]**

## 5 · THE KIT BRIEFS (0.4.0's deliverable to the MIR session)

One brief per row, each with its acceptance and the λWAVES port that consumes it, written during S1–S4 so `1.5.0` can carry
them. **[OPUS: Delivered as one file, `research/release-0.4.0/KIT-BRIEFS.md`, mirrored to the vault as `LAMBDAWAVES CLAUDE
KIT BRIEFS FOR MIR <date>.md`. λWAVES never touches MIR.]**

- **8** `paintedSpace({rack, layer, extra})` + `subscribe(fn)`, fired on window move, scroll, open and close, even while
  paused. **[OPUS: Listed first because it is the adoption blocker (MIR-1.5 R1): the frame/axis mask needs painted
  surfaces, not `uiSpace()`'s whole rects.]**
- **2** Lens shift in the CAMERA panel and the CSS port; the 3-D HOME resets the shift.
- **3** `rack.register({ md })` + TO NOTEBOOK + PIN FROM WINDOW.
- **4** The `cells` grid control: periodic, (l, n), sections; vertical on phones.
- **5** `createLattice` exported from `controls/xy.js:47` for inlays, with the eight tokens.
- **6** `recorder.overlay(i, ctx)`.
- **7** `addLabel({ttl})`, `layer.setCheap(on)`, `html[data-take]`, with the TAKE MODE switch delegated to the app's
  DISPLAY.
- **9′** STATUS TAGS never hides `[data-mir-offer]`. **[OPUS: The rest of "an offline layer" is cut; λWAVES keeps
  `sw.js`.]**
- **13** The INFORMATIONAL rack window, with its switch delegated to the app's own settings.
- **Live-bound math labels**: `{{state}}`, `{{E}}`, `{{T}}` from `params.get()`, not `describe()`. This is Josh's "it
  will dynamically change as things and settings in the rack windows are changed".
- **[OPUS: added] P** The paint gesture (`paint-stroke.js`, Cloud's and generic: left adds, right removes, drag across,
  one undo row) as a kit gesture; the app copy is then deleted.
- **[OPUS: added] J** `jetblack` + `flat` and the gate exemption in the 1.5 catalogue, for the big four.
- **1** The 3-D camera law and stage gestures (`mir/camera/law.js`, pure, with λWAVES' numbers and tests). **[OPUS: A
  gift for NEBULA/POLAR/EARTH, not a 0.5.0 dependency: λWAVES' CAMERA port works with its own law.]**
- **[OPUS: Cut: brief 12, camera key rows (λWAVES writes its own `up` rows with `createKeys`), and `lw:` action links (a
  ruling, R-I2).]**

The **inlay list** for brief 5: STATE's IMPULSE VECTOR, KEPLER tilt/turn, PLANE's mini, ORBIT's rotor spheres, WIGNER's
(z, p_z) map, RADIATION's polar, the A/B morph, STATIC FIELD's direction. "A little less intense, smaller circles" is
eight tokens in λWAVES' sheet, with no kit code.

## 6 · THE STAGES

| # | Stage | What | Done when |
|---|---|---|---|
| S0 | TAKE-IN + CANARY | B0, B0.5, the bug fixes, the vendor wiring, the process hole, the two measurements, 0.3.3 cut | every gate green on the merged tree; no forged manifest, and the pinned-manifest test fails on a forged one; Jet Black live by R-A3's route **[OPUS: not "1.4.4 adopted"]**; precache down by about 650 KB; the canary's first row; the AO-limit and benzene re-time numbers in REPORT; the live site = the cut (a verifier: release) |
| S1 ∥ S2 | NAMES ∥ `cameraEye` **[OPUS: the seams cut to one]** | F1 ∥ B1 (11) (nearly disjoint; `export3d.js` takes the names first) | every enabled molecule named or says why; the knob reads `1b₁ · HOMO`; the core fold; the copy pastes and renders; the N₂ demo ∥ `cameraEye` the only projection; `lab/*.js` total down; 208-lock green |
| S2 | CAMERA | F4 | shift law tests (shift then RESET = identity; the cursor-anchored point invariant across zoom and FOV); Alt-drag, two-finger and Alt+Arrow pan; 1004-lock byte-identical at shift 0; `new-project --check`; the device report equal before and after on the 3070 and the M5 (a verifier) |
| S3 | STAGE TEXT + WINDOWS | F2, F3 | no per-tick layout reads, KaTeX only on a changed string; WINDING and HOMO + LUMO fade with their names; one STAGE TEXT row; DYNAMICS retired (PARTICLES in VORTEX); CALCULUS tiles + the prose figure; PERFORMANCE in QUALITY; PLANE/CLIP; ATOMS back with its periodic table and SPECTRUM's ATOM opening it |
| S4 | LIBRARY a / b / c | B2 + F5 | a: cached = fresh on energies, occupations, signed fields, subspaces, names; zero solver calls; `library/**` the one precache exemption; persistence on the M5 measured (a verifier) · b: three entries built end to end and timed, then the sections pass the gate; the page turner + expansion headers · c: an 87-AO and a 120-AO record reconstruct; VALENCE; 1004-lock green; the device report within the governor's tier (a verifier) |
| S5 | KIT BRIEFS | §5 **[OPUS: renumbered; was S7]** | each brief has acceptance and a consuming port; brief 8 first; the MIR session has them before the `1.5.0` cut |
| — | **[OPUS: cut — old S6 (FIGURE · CHIPS · CITE · TAKE MODE · WARM COVER)]** | | |
| — | **cut 0.4.0-alpha** | | |
| 0.4.1 | **[OPUS: BUCKYBALL]** | C₆₀ as a PySCF RHF/STO-3G record with precomputed density and frontier-orbital grids uploaded into the molecular volume (one `field` upload road); the stepping stones' timings; the Sol thread's ledger and its benzene unique-quartet number | C₆₀ draws from its record on the 3070 and the M5; labelled GRID RECORD; names wait for I_h tables |
| 0.5.0 | THE ADOPTION, then THE INFORMATIONAL | MIR `1.5.0` in BASINS' order with the canary's deltas and the glue seams; the 15 risks closed; then pages per orbital/state/molecule/window, feature labels, the window, the film overlay, TAKE MODE, the overlays as layers, FIGURE, chips, FLY-TO + search, SCENES, MAPS | stylehash neutral; ~9–10.5k lines out; every law re-proven; the device report on the 3070 and the M5 |
| 0.5.x | the wave index (station ring, carousel, `Q_LM`) · symmetry-adapted SCF if the thread's number earns it | | |

**Why this order [mine]:**
- S0 comes first because the live main is unreviewed, and because the canary and the two one-line measurements are the
  cheapest information in the plan.
- S1 (names) runs beside `cameraEye`: the files are nearly disjoint, and the names are Josh's loudest ask.
- S2 comes right after `cameraEye`: it is small, visible, and needs one verifier.
- S3 comes after the names, because the fade speaks them.
- S4 comes last and is split, so the iPad measurement and the three-entry build come before the sizing.
- The briefs are written throughout.

**Verification:** one light check per stage. A verifier for S0 (release), S2 (the camera uniform), S4a (worker +
storage) and S4c (the kernel); at 0.5.0, the adoption. **[OPUS: The 208-lock runs only on frame-path commits; S1's names
and S3's windows are not on the frame path.]**

## 7 · RULINGS FOR JOSH (each flips one line)

**[OPUS: split into what flips 0.4.0 and what 0.5.0 will need; trimmed.]**

**For 0.4.0:**
- **R-A1** Cut 0.3.3 from the merged-and-subtracted tree (exports + Cloud's kept work); 0.4.0 starts from it.
- **R-A2** Legacy windows: ATOMS returns as the periodic-table window, and SPECTRUM's ATOM opens it. QUARKONIUM is hidden
  while QCD stays hidden. H₂⁺, HELIUM, H₂ and ELECTROSTATICS stay hidden until 0.5.0 — or name the ones you want back.
- **R-A3** Jet Black: a real MIR 1.4.4 on `mir-1.4.x`, or one app-side catalogue row (the palette is the engine's) until
  1.5 carries it.
- **R-F1** Flagship, operationally: as defined in §1 — or your own definition.
- **R-G2** **[OPUS: new]** The INFORMATIONAL proper (springs, leader lines, pages, the film overlay) needs MIR 1.5 in the
  app. Either 0.4.0 ships its first taste and the full layer comes in 0.5.0, or 0.4.0 waits for the `1.5.0` cut and
  carries it.
- **The windows:**
  - **R-W1** Retire DYNAMICS as mapped (PARTICLES into VORTEX).
  - **R-W2** The copy is the prose figure — or add a table.
  - **R-W3** PLANE (or ψ-PLANE), with CLIP.
  - **R-W5** Did "State audited" mean the window, the saved state, or both? (Both are done.)
  - **R-W6** "Somewhat realtime": the reader law as is, or a per-window LIVE cadence.
- **The camera:**
  - **R-C1** Lens shift only; the target pivot is built if, after trying the shift, you want to orbit a lobe.
  - **R-C2** Links open centred (v1) — or a v2 that carries the shift.
  - **R-C3** The pan chord is Alt-drag — or another free one.
- **The library:**
  - **R-L1** Sections DIATOMICS · HYDRIDES · ORGANIC · BIO · LATTICE · HEAVY, under the mechanical diversity gate.
  - **R-L2** C₆₀ in 0.4.1 BUCKYBALL as a grid record — or later.
  - **R-L4** Which STEM fields you want to see.
  - **R-L5** Stores builds: expansions bundled or downloaded.
- **R-N1..8** The names plan's rulings stand (its R6 is R-L3 here: the starter lives in `lw-data-`, not in the build).
- **R-S1** "Cyclotomic scaling". **[OPUS: The default reading comes from your corpus: the character-basis principle of
  MASTER GOAL SPEC §39 / L-0408, made concrete as symmetry adaptation (Fock blocks, unique ERI quartets, asymmetric-unit
  reconstruction). Alternatives: the ring-character reading alone, or something else you mean.]** The Sol thread starts
  from your answer.
- **R-U1** Who 0.4.0 is for (you, a class, Reddit on an iPad) decides whether SHARE LOOP and the opener lead 0.5.0.

**For 0.5.0 (ask now, needed later):**
- **R-B1** One clock: the transport's play is THE play; modulation gets POWER; LINKED/SEPARATE is retired.
- **R-K1** The S key (WASD keeps S, and FOLDERS takes another chord), and the MOD arm on Ctrl+Space.
- **R-D1** The first-run look under the kit: λWAVES' light theme, 22 px, 50 % VIVID, normal ink.
- **R-I1** The INFORMATIONAL switch in SETTINGS › DISPLAY.
- **R-I2** `lw:` action links in pages, and the non-educational HUD (palette, camera) through the same engine.
- **R-I3** Pages travel with the project, vs "an open never closes the notebook".
- **R-G1** 0.5.0 waits for a `1.5.0` cut, and the canary runs again then.

## 8 · DISPOSITIONS AND WHAT IS NOT CLAIMED

**SIBLINGS rows:**
- **0.4.0:** **[OPUS: 3 CITE, as record content only; 33's XY lattice, as tokens at 0.5.0.]**
- **0.5.0:**
  - 1 SCENES (in STATE, replacing A/B as two of eight).
  - **[OPUS: 2 FIGURE, 4 chips.]**
  - 6 named orbitals + FLY-TO + search (the rack's + menu made type-to-filter).
  - 7 pages, 8 the library gallery, 9 MAPS (H₂'s FCI curve first).
  - 19 flash guard, 20 title card, 21 ink law, 24 CURVES, 27 kit project parts, 33 kit panels.
  - **[OPUS: TAKE MODE.]**
- **[OPUS: 0.4.1:** C₆₀.**]**
- **0.5.x:** 5 period-exact export, 10 TIMELINE, 11 the atom as metronome, 12 LAYERS, 13 ATLAS, 14 RULER, 15 LENS, 16 CHORD
  and the ladder keyboard, 17 kymograph, 18 scale bar, 22 LIC/bloom, 25 TAKE, 26 LIGHT, 29 DEROTATE, 31 TUNER, 32 PATTERN,
  34 GPU anchor, hover-to-peek, the character-table page, the vs-EXPERIMENT lamp beyond the ten, SHARE LOOP.
- **Declined:** 23 params registry (check `app.param()`/`describe.js` at adoption first), 28 MIDI, 30 OUTPUT, 35 (already
  stronger here), the known-answer lamp in the shipped build (diagnostics live in `tools/`), and the anti-harvest as
  written.
- **[OPUS: Measured before being planned again:** the warm cover.**]**

**One in, one out:** **[OPUS: rewritten]**

| In | Out |
|---|---|
| ATOMS back | an orphaned button and a stepper |
| PARTICLES into VORTEX | DYNAMICS (up to ~470 lines) |
| one STAGE TEXT row | STAGE FORMULA + ATOM LABELS + two SIZEs |
| — | the duplicate vendor tree (~650 KB a deploy) |
| one projection helper | nine projection copies |
| — | Cloud's polling and per-tick label writes |
| the expansion header | no new tab |
| the interim stage-text renderer (now) | deleted at 0.5.0 |
| the ATOMS cells (now) | the kit's `cells` at 0.5.0 |

Nothing else new is built in 0.4.0's interface.

**Not claimed:**
- No line of 0.4.0 is built.
- The INFORMATIONAL has run in no real app, and its touch, WebKit and over-WebGPU looks are unproven.
- The AO tier's route waits on the adapter numbers (A5 R1), and its frame cost on the device report.
- The cost model's staleness is unmeasured until B0's re-time.
- C₆₀ is 0.4.1.
- Later, or not re-planned here:
  - the wave index (VAULT §1.2–1.3: cached / warm / ghost tiers, the station ring, the carousel, `Q_LM` reading A);
  - the Sol thread's engine consequences;
  - the parked asks (the Serum matrix, shader plugins, knob quick-settings, ijk mini-maps, "2×6 layout");
  - the About/Notebook buttons fixed at the top right (the kit's ABOUT/OPTIONS at 0.5.0);
  - Sol's pack delivery (Drive, R2).
- The names probe covered ten molecules in STO-3G, with s and p only.
- "All amino acids" means twenty only after S4c, and only as records.
- A symmetry saving on a Cartesian grid is bounded by its signed-permutation operations (at most 48, usually 8).
- The legal reading of CAS and NIST SRD is unverified.
- The YouTube video's content beyond its title and description is unknown.
