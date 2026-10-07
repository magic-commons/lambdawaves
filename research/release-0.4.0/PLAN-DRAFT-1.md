# λWAVES 0.4.0-alpha · THE FLAGSHIP — PLAN DRAFT 1 (Fable, after Sonnet's review, 2026-10-07)

Read `NACRE.md` first, then `survey/*`, then `REVIEW-SONNET-0.md` (its 30-row map of Josh's ask is the checklist this
draft answers). Numbers are the surveys' unless marked [mine]. This draft goes to Opus for audit and edit.

## 0 · What changed since DRAFT 0, in one breath

The release is split where the dependency is: **0.4.0 = the pre-refactor, the names, the windows, the camera, the
library and the kit briefs, with a canary adoption running from day one; 0.5.0 = the adoption and the INFORMATIONAL**,
on the MIR session's word that 1.5 is done. The kit gifts move out of the adoption into a KIT BRIEFS stage (MIR first,
adopt, then adapt). Pan is re-cut to a lens shift (Josh's wording) with the pivot as an option. The 64-AO shader wall is
a deliverable, not research. Every sentence of Josh's ask now has a feature, a stage or a line in §8. Jet Black stays
live by making MIR 1.4.4 real instead of deleting it. One window out for every window in.

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
is the kit's; what λWAVES needs and the kit lacks becomes a brief the MIR session builds; pages and records are
content. 0.4.0 does everything that does not need the kit's new shell; 0.5.0 takes the shell in and lights the overlay.

**Flagship, operationally (R-F1 asks Josh):** the λWAVES session writes the kit briefs for what the next alpha must
carry; the kit's regression runs against λWAVES' adoption log as it runs against BASINS'; "prefer BASINS" stays the rule
for what BASINS already designed, and λWAVES' design wins for what it originated (modulation, camera 3-D, notebook,
history, three scopes) and for everything new in these briefs.

## 2 · THE SHAPE: engine / kit / content

| | λWAVES keeps (ENGINE) | The kit's, or λWAVES' brief to the kit | CONTENT |
|---|---|---|---|
| now | `field.js`, the register and solvers, `electrostatics.js`, `period.js`, the palette's meaning, `badges.js`, `statelink.js` v1, `export3d.js`, `latex-state.js`, `names.js` (new), the digest lock, `sw.js` + the offer until gap 9 lands, the camera LAW until gap 1 lands | the modulation port, project parts, occlusion providers, the one-clock facade, the camera port (glue ≈ 1–1.5k lines at adoption) | pages (`.md`), the LIBRARY records with names and STEM fields inside, sections, covers, CITE rows, demos |
| briefs (0.4.0 → kit) | — | gap 1 camera law + gestures · 2 lens shift in the panel/CSS port · 3 `md()` window copy + TO NOTEBOOK · 4 `cells` grid control (periodic, (l,n), sections) · 5 `createLattice` exported for inlays · 6 overlay in the film · 7 `addLabel({ttl})`, `setCheap`, take mode · 8 painted-surfaces provider · 9 offline/install layer · 12 camera key rows · 13 the INFORMATIONAL window · live-bound math labels (SIBLINGS §5.2) · `lw:` action links in pages | — |

## 3 · THE BASELINE CHANGES (0.4.0, in order)

**B0 · TAKE-IN, then subtract, then cut 0.3.3** (LWAVES-AUDIT A). The live site serves Cloud's main (version line still
0.3.2-alpha; the served rack carries the stage formula). Merge PR #1, then PR #2 (one textual conflict, the generated
`sw.js`; regenerate). One subtraction commit: **Jet Black becomes true** — MIR 1.4.4 on the real `mir-1.4.x` branch
carrying `jetblack` + `flat` + the gate exemption, then `tools/adopt.mjs` (R-A3; Cloud's forged manifest and the direct
`lab/mir` edit go, the preset stays live); the `copyLatex` gate reads "a molecular owner is on"; `.mol-more` becomes a
fold; SPECTRUM's orphaned ATOM / QUARKONIUM buttons (R-A2); CLAUDE.md's false line and stray sentence; a REPORT wave
for what was kept. The audit's four cheap bugs as their own commit, each with a test: CALCULUS's ⧉ copies a header
(the digest reads a field the window never returns), the badges and the canvas sentence tick only with METERS
presentable, `hydroReader` omits `chem` (WIGNER and RADIATION compute hydrogenic physics under a molecule), the
`copyLatex` gate. Re-date or wire the staged kit files before `tests/wiring.test.mjs` goes red on 2026-11-20. Repro the
reported "Space does not play both clocks in LINKED mode at project open". **Close the process hole:** `docs/KIT-ASKS.md`
as Cloud's legal outlet, one CLAUDE.md line ("Cloud: PRs only, never `lab/mir`, kit asks go in KIT-ASKS"), and
`tests/mir-manifest.test.mjs` made to check the manifest against the real MIR tree's commit when that tree is present.
Then cut **0.3.3** from this tree (R-A1): the exports plus Cloud's kept work, the live site made honest.

**B0.5 · THE CANARY** (Sonnet's one move). A permanent throwaway branch runs the real `tools/adopt.mjs --line 1.5
--dry-run` on every kit alpha with stylehash (README recipe, `--gpu 1`), `tests/pwa.test.mjs` for the byte count, the
occlusion suite and the byte-pinned tests, results logged in `docs/MIR-1.5-CANARY.md` the way BASINS kept its 87-row
log. It picks which seams to cut and turns 0.5.0's adoption into a diff of known deltas.

**B1 · THE SEAMS, trimmed to those that survive adoption or serve a 0.4.0 feature** (MIR-1.5 §2.4; order by cheapness
and protection): (10) tests find things by hook, not label; (11) **`cameraEye(obs, half) → {eye, target, basis,
shift}`**, one projection helper for the nine copies — the precondition for pan, feature labels and atom labels;
(12) **`reg.onChange`**, a real register change event (Cloud polls because there is none); (7) occlusion providers per
window species, `refreshOcclusion` only concatenates (the 32-rect cap and the paused-PRESENT law stay); (6) the
one-clock facade `{play,pause,isPlaying,toggle,onChange,seek}` with `clockLink` retired (R-B1); (8) the camera port;
(1) the settings adapter split into PREFERENCE and WORKSPACE keys; (3) project parts with `capture/restore/signature`
(the history keeps `serialize({scope:'edit'})`); (5) the modulation port as one object. **Deferred to the adoption:**
the look store, the floating-rack module and the action-id rename, except that no code outside the rack block may
reach `#rack` or `floats` (BASINS stopped four times on seventy such references). Measure `lab/*.js` total lines, not
`rack.js` alone (a moved line is not a deleted line). The 208-value lock per commit, the 1004-value lock once at the
end, and a red re-run alone before it is believed (the RTX 3070 one-ulp fault).

**B2 · LIBRARY, the fourth storage class, and the data cache** (NAMES-AND-CACHE §6, with Sonnet's hazards): installed
records are device content, content-addressed, never in a project, link or history row; a project holds
`{id, hash, nameKey}`. The cache is `lw-data-…`, outside the build cache (an update refetches the whole build: 203
files, measured). **The iPad law:** `navigator.storage.persist()` asked on first install, the quota and the persisted
answer shown, and an evicted record degrades to "not installed", never to a broken preset. **The benzene-cap law**
(`molecules.js:25–27`): a record past the live cap opens only from its record; absent, its row says DOWNLOAD, not
DISABLED, and a basis or charge change on it is refused with a sentence, not a solve. The record schema reserves the
wave-index slots (the transition multipoles `Q_LM` and a grid handle) so S5 does not freeze a schema F9 must bump.
The generator is the app: `tools/orbital-library.mjs --check`, with a **diversity gate** (no two entries share a
formula; each new entry adds an element, a point group or a bonding motif the section lacks). `docs/STATE-SCOPES.md`
gains the row; SETTINGS gains a fourth tab **EXPANSIONS** (installed, bytes, KEEP ON THIS DEVICE, delete, the offline
lamp) — the seat the word "expansions" needs.

**B3 · The frame-path budget, with numbers as acceptance:** nothing new on the frame path. Names in the worker inside
`ensureSolve` (≤ 10 ms, benzene); library fetch in idle; the stage text and announcements render only on `reg.onChange`
/ `chem.subscribe` (Cloud's `stageTextTick` and the 400 ms body-class re-placement go); a lens shift is TIER.PRESENT
only; every reader stays `may()`-gated and idle when its window is off, folded, closed, hidden or offscreen. A
**before/after frame-time protocol** on the 3070 and the M5 (median and >33 ms count over the same 30 s scene, glass
on and off) is the acceptance line of S4, S5c and, in 0.5.0, the adoption — BASINS measured pan at ~30 fps with the
rack's glass shown against 60 hidden, and 82 frames over 33 ms against 65, after its adoption.

## 4 · THE FEATURES (0.4.0)

Each: what the reader does, where · kit or app · cost · what it must not do.

**F1 · THE NAMES** (NAMES-AND-CACHE; the probe matched every textbook configuration). The ORBITAL knob and ladder in
MO-REGISTRY read `1b₁ · HOMO`, `3a₁`, `1e₁g (a)`, `2σ_u`; hover a rung = the name, its frame and its `computed /
derived / curated` tag; a degenerate HOMO is one HOMO (today its members read HOMO−2, HOMO−1, HOMO in CH₄, HF, CO₂,
C₆H₆); ⧉ copies `$1b_{1}$` in the notebook's spelling; the GLB, the cube and the NPZ carry the names. One service
`lab/names.js` for atoms and molecules; the four formatters become one; declared groups and frames in the library; d
shells and the five remaining tables so 6-31+G* is named too; cluster tolerance 2e-10 Eh; the geometric tolerance
stated (furan and pyridine close to 1e-3 bohr); a names record all or nothing — a record below tolerance shows indices
throughout, never a mix; one PySCF cross-check in `tools/`. **"True human information":** per orbital the textbook LCAO
name (derived for diatomics), the character (core / σ / π / lone pair), and for the ten probed molecules the vertical
ionisation energy from the NIST CCCBDB fixture beside Koopmans' −ε, tagged `curated` with the honest gap. **The
teaching moment** the probe found — N₂'s HOMO is `3σ_g` in STO-3G and `1π_u` in 6-31+G* — becomes a demo project and a
page. · MO-REGISTRY, SPECTRUM, exports · engine/app · M · never asserts an ordering.

**F2 · THE STAGE TEXT AND ANNOUNCEMENTS, the first taste of the INFORMATIONAL in the app** (LWAVES-AUDIT D). Cloud's
plain-text formula becomes markdown + KaTeX through the notebook's own renderer, from `stateLatex` and a one-function
TeX of the library formula, re-rendered only on change; atom labels through `cameraEye`. **The announce seam [mine]:**
`announce({title, md, ttl})` in the rack, called by the controls that opt in — a WINDING or HOMO + LUMO preset in
MO-REGISTRY, a palette pick, a STYLE or VIEW change, a camera HOME — shows a one-line title at the top of the stage and
fades after its ttl; the content table lives beside the controls, not in the engine. The type scale is the notebook's
(title / heading / body) and the maths face is KaTeX; STAGE FORMULA + ATOM LABELS and their two SIZE knobs collapse to
two DISPLAY rows (STAGE TEXT, LABELS). At adoption `announce` is `layer.addLabel({ttl})` and the formula
`layer.addBlock({md})`, and this interim renderer is deleted — it is named here so 0.5.0 deletes it. · the stage,
SETTINGS › DISPLAY · app now, kit at 0.5.0 · S · no per-tick layout reads.

**F3 · THE WINDOWS** (LWAVES-AUDIT B; Josh: "audit, consolidate, leverage power and DISPLAY").
- Retire DYNAMICS (R-W1): L/T/V/S and its plot → SHADOW's footer; moments and the virial → CALCULUS rows; the dipole
  lines → RADIATION; ACTION–ANGLE → gone (SPECTRUM is it); PARTICLES → the OVERLAYS strip.
- **One OVERLAYS row in WAVE** (it owns how ψ is drawn): KEPLER ORBIT · VORTEX · PARTICLES · ELECTROSTATICS ·
  **SHADOW's phasor wheel · ORBIT's rotor spheres · PLANE's mini sphere · CALCULUS's live residuals** — the three Josh
  named join; each obeys its window's power and `canPresent`; at 0.5.0 each is a layer the INFORMATIONAL lists and the
  user can move.
- CALCULUS, WIGNER, RADIATION, METERS share RADIATION's skin (plot, then tiles in a grid: two columns on the card, three
  floating, opted out of LEAN) and one copy: every row gains `tex`; ⧉ copies **the prose figure** Josh described — a
  heading, then "Figure: ⟨ψ|ψ⟩ = 1.000 (d/dt = 0 to 1e-9); ⟨H⟩ = … ; …" with the rows combined into sentences, every
  quantity `$…$` — and a second item behind ⧉ (the hand law: no new head control) **TO NOTEBOOK** appends it to the
  open page (R-W2 asks table, prose, or both). The `md()` contract is kit brief 3.
- Badges on their own ≤ 10 Hz tick; PERFORMANCE and GOVERNOR to SETTINGS › QUALITY; `hydroReader` + `chem` (done in B0).
- SLICE → **PLANE** and SLICE / CLIP → **CLIP**, ids stable (R-W3; ψ-PLANE if "plane wave" clashes for Josh).
- The legacy six, per window (R-W4): HELIUM and H₂ hold physics MOLECULES lacks; **H₂'s FCI curve becomes the first
  MAP** (dissociation curve, "RHF fails here") so one card out, one figure in.
- **STATE audited** (Josh's sentence; R-W5 asks which he meant): the window — preparation controls, no reader, hidden
  under a molecular owner; SCENES (F7) replaces its A/B TRANSITION as scenes A and B of eight, so the window grows no
  wider; and the app's state — the three scopes plus LIBRARY, re-proven after every stage by the existing suites.
- **"Somewhat realtime" (R-W6):** power stays binary (Josh: leverage it); the cadence is the existing reader law
  (every 4th frame at PERFORMANCE 120, every frame at FULL, parked above 6/16 ms); the plan adds no third state, only
  a per-window cost line in SETTINGS › QUALITY (the honest meter), computed from the readers' own timers.
- The window cost law restated: off, folded, closed, hidden or offscreen = zero; the OVERLAYS row and the stage text
  join it.
· app (the skin, `md()` and the grid become kit by brief) · M · nothing that reads layout per tick.

**F4 · THE CAMERA** (LWAVES-AUDIT C; Sonnet's re-cut). **A lens shift first** — the picture slides, the molecule stays
the pivot, which is what "a planet photo at max FOV" says and what the kit's pad unit (a share of the view's width) is:
`obs.shift = [sx, sy]` as a principal-point offset in the ray generation and the line chrome's projection, through
`cameraEye`; with the racks open it also lets the subject sit in the open gap. **The pivot as an option** (TARGET in
CAMERA, R-C1): `obs.pan`, the eye `target + dir·dist·half`, orbit about the target. Hands: **Alt-drag pans on a
trackpad and mouse** (Shift and Ctrl are taken; right and middle buttons are unusable on a trackpad and an iPad), a
two-finger drag pans on touch beside pinch, wheel stays dolly, an Alt+Arrow pair on the keys; CAMERA gains PAN X / PAN
Y (two knobs now; the pad with the lattice at 0.5.0 — the knobs are the targets, nothing is thrown away) and PAN HOME;
targets `observer.panx/pany`; STATE-SCOPES' pose row gains `shift` (PROJECT, not history); the empty project
regenerated; links open centred under v1 or carry a v2 flag byte (R-C2). Range: ~7× magnification at the target; a ±1
half clamp reaches every part of the cube. The law and gestures go to the kit by brief 1 with λWAVES' numbers. · CAMERA,
the stage · engine (ray-gen) + kit (panel, law) · M · PRESENT tier only; a verifier (the camera uniform is the frame path).

**F5 · THE LIBRARY as expansions** (Sol's plan + NAMES-AND-CACHE §6–7 + VAULT §7; Sonnet's rewrite).
- **S5a · the benzene proof + the store:** a record (Sol's native booster + names + STEM fields) opens with no SCF;
  `lw-data-`; the scope row; persistence, eviction and quota on the M5 measured; the cost model re-measured (benzene
  solved in 1.0 s in node against 9.6 s predicted). A verifier (worker + storage).
- **S5b · the sections as content behind the diversity gate** with an interim picker — MOLECULES' preset is a
  `<select>` with seven optgroups today and breaks past a hundred entries: sections + type-to-filter in the same
  window, and an app-side **grouped-button grid in SPECTRUM's style for the periodic table and the (l, n) table**
  (Josh asked for it by name; deleted at 0.5.0 when the kit's `cells` control lands). Sections, diverse not variants
  (R-L1): DIATOMICS · HYDRIDES · ORGANIC · **BIO** (the sixteen amino acids ≤ 64 AO, the five nucleobases 44–60,
  Gly-Gly 57, N-methylacetamide, imidazole, indole, phosphoric acid, ribose; Leu and Ile share a formula — the gate
  keeps one) · **LATTICE** (finite clusters only — the solver has no k-points: LiH/LiF/MgO/NaCl cubes, ice hexamer and
  cube, cubane, neopentane, naphthalene, Si₅H₁₂) · **HEAVY** (the Kr row the basis reaches: KrF₂, SeO₂, KBr, GeCl₄,
  TiCl₄; the d-block "try it and let the stability probe decide"). Basis pairs STO-3G + 6-31+G* for anchors only; the
  name is the join key, so an A/B MORPH between bases means the same orbitals. **STEM fields per record** (R-L4 asks
  which): formula, point group and frame, mass, charge and multiplicity, dipole, HOMO–LUMO gap, geometry source,
  InChI/CAS, a two-line blurb, the curated IEs where they exist.
- **S5c · the engine upgrade that lifts the first wall:** the shader's `array<f32, 64>` AO array (`field.js:672`) is
  the live limit; chunk or stream the AO loop under the digest lock with a verifier and the frame-time protocol;
  confirm the ERI's 8-fold packing and Schwarz screening (already in `md.js:255`); then Phe, Arg, Tyr, Trp (71–87 AO)
  and adamantane (66) reconstruct from records. **C₆₀** (300 AO) still needs Sol's grid provider: a 0.4.x stage after
  S5c, the stepping stones (B₁₂H₁₂²⁻ 72, C₂₀H₂₀ 120) measured on the way (R-L2).
· FOLDERS at 0.5.0, MOLECULES + SETTINGS › EXPANSIONS now · engine/content · L · never a second solve road; never a
record that fails validation; never a disabled row where a download would do.

**F6 · THE FIRST THREE HARVEST ROWS** (SIBLINGS, the S-cost ones that are "STEM information and metadata" in Josh's
sense): **FIGURE** — FILE › PRINT STILL whose PNG carries the project envelope and a caption strip in LaTeX (drop it
on the stage to reopen); **honesty chips** EXACT · NUMERICAL · MODEL · ARTISTIC in each window's ⓘ title row from one
table; **CITE** in the ⓘ popover (the closed forms, the vendored bases, the CCCBDB geometries, ChronusQ, the Cornell
potential, the revival maths; COPY as text or BibTeX). The full 35-row disposition is §8.

**F7 · TAKE MODE and the warm cover** (two of Sonnet's ten, both S): a SETTINGS › DISPLAY switch for external screen
recording (OBS, ShadowPlay, iOS) — pins the AUTO SCALE tier and the governor, fixes the cadence, takes a wake lock,
hides the pointer glow, sets `html[data-take]` for the kit's layer to read at 0.5.0; and the boot veil's dwell warms
every draw-style pipeline so the first STYLE switch on the iPad never hitches (WebKit stalls 220–270 ms per first
pipeline use).

## 5 · THE KIT BRIEFS (0.4.0's deliverable to the MIR session)

One brief per gap, each with acceptance and the λWAVES port that consumes it, written during S1–S5 so `1.5.0` can
carry them: **1** the 3-D camera law + stage gestures (`mir/camera/law.js`, pure, with λWAVES' numbers and tests);
**2** lens shift + pivot in the CAMERA panel and the CSS port (3-D HOME resets both); **3** `rack.register({ md })` +
TO NOTEBOOK + PIN FROM WINDOW; **4** the `cells` grid control (periodic, (l, n), sections; vertical on phones);
**5** `createLattice` exported for inlays, with the eight tokens; **6** `recorder.overlay(i, ctx)`; **7**
`addLabel({ttl})`, `layer.setCheap(on)`, `html[data-take]`; **8** `paintedSpace({rack, layer})` + `subscribe` for
engine lines under glass; **9** the offline/install layer with the offer and the quiet take (STATUS TAGS never hides
the offer); **12** camera key rows; **13** the INFORMATIONAL rack window with its switch delegated to the app's own
settings; **plus** live-bound math labels (`{{state}}`, `{{E}}`, `{{T}}` from `params.get()`, not `describe()`) and
`lw:` action links in pages (a click selects an orbital through the same resolver search uses). The **inlay list** for
brief 5: STATE's IMPULSE VECTOR, KEPLER tilt/turn, PLANE's mini, ORBIT's rotor spheres, WIGNER's (z, p_z) map,
RADIATION's polar, the A/B morph, STATIC FIELD's direction — "a little less intense, smaller circles" is eight tokens
in λWAVES' sheet, no kit code.

## 6 · THE STAGES

| # | Stage | What | Done when |
|---|---|---|---|
| S0 | TAKE-IN + CANARY | B0, B0.5, the four bug fixes, the process hole, 0.3.3 cut | every gate green on the merged tree; MIR 1.4.4 adopted, no forged manifest; the canary's first log row; the live site = the cut |
| S1 ∥ S2 | SEAMS ∥ NAMES | B1 (in the trimmed order) ∥ F1 (disjoint files) | `lab/*.js` total not up; 208-lock per commit, 1004 once; serialize bytes identical; `cameraEye` the only projection; `reg.onChange` the only register signal ∥ every enabled molecule named or says why; the knob reads `1b₁ · HOMO`; the copy pastes and renders; the N₂ demo |
| S3 | CAMERA | F4 | lens-shift law tests (shift then home = identity; cursor-anchored invariance across zoom/FOV); Alt-drag and two-finger pan; `new-project --check`; the frame-time protocol equal before and after; links honest |
| S4 | STAGE TEXT + WINDOWS | F2, F3 | no per-tick layout reads; DYNAMICS retired; one skin + the prose figure for the four readers; OVERLAYS in WAVE with the three Josh named; badges on their own tick; PLANE/CLIP; STATE's scenes seat |
| S5 | LIBRARY a / b / c | B2 + F5 | a: cached = fresh on energies, occupations, signed fields, subspaces, names; zero solver calls; persistence on the M5 measured · b: the sections pass the diversity gate; the picker filters; the periodic table stands · c: an 87-AO record reconstructs; lock green; frame times equal |
| S6 | FIGURE · CHIPS · CITE · TAKE MODE · WARM COVER | F6, F7 | each S; a figure PNG reopens; chips from one table; TAKE MODE measured with OBS |
| S7 | KIT BRIEFS | §5 | each brief has acceptance and a consuming port; the MIR session has them before the `1.5.0` cut |
| — | **cut 0.4.0-alpha** | | |
| 0.5.0 | THE ADOPTION, then THE INFORMATIONAL | MIR 1.5 in BASINS' order with the canary's deltas; the 15 risks closed; then pages per orbital/state/molecule/window, feature labels, the window, the film overlay, FLY-TO + search, SCENES, MAPS | stylehash neutral; ~9–10.5k lines out; every law re-proven; the frame-time protocol on the 3070 and the M5 |
| 0.4.x | C₆₀ (grid provider) · the wave index (station ring, carousel, Q_LM) · the Sol thread's deliverable | | |

**Why this order [mine]:** S0 first because the live main is unreviewed and the canary is the cheapest information in
the plan. S2 runs beside S1 (disjoint files; Josh's loudest explicit ask). S3 right after `cameraEye` (small, visible,
one verifier). S4 after `reg.onChange` and `cameraEye`. S5 split so the iPad measurement precedes the sizing. S7
during everything. Verification: one light check per stage; a verifier for S1 (lock, scopes), S3 (the camera uniform),
S5a (worker + storage), S5c (the kernel); and at 0.5.0 the adoption.

## 7 · RULINGS FOR JOSH (each flips one line)

- R-A1 0.3.3 is cut from the merged-and-subtracted tree (exports + Cloud's kept work); 0.4.0 starts from it.
- R-A2 SPECTRUM's ATOM / QUARKONIUM: hide the two buttons while the windows stay hidden, or bring the windows back.
- R-A3 Jet Black stays live through a real MIR 1.4.4 on `mir-1.4.x` (and the XY pad if it backports), not a 1.5 wait.
- R-B1 One clock: the transport's play is THE play; modulation gets POWER; LINKED/SEPARATE retired.
- R-F1 Flagship, operationally: as §1's paragraph — or your own definition.
- R-W1 Retire DYNAMICS as mapped. · R-W2 The readers' copy: prose figure, table, or both; TO NOTEBOOK appends. ·
  R-W3 PLANE or ψ-PLANE, with CLIP. · R-W4 The legacy six per window (H₂ → the MAP). · R-W5 "State audited": the
  window, the app's state, or both. · R-W6 "Somewhat realtime": the reader law as is, or a per-window LIVE cadence.
- R-C1 Lens shift first, pivot as an option — or the reverse. · R-C2 Links: centred under v1, or a v2 flag byte. ·
  R-C3 The pan chord: Alt-drag (recommended), or another free one.
- R-L1 Sections DIATOMICS · HYDRIDES · ORGANIC · BIO · LATTICE · HEAVY under the diversity gate. · R-L2 C₆₀ at 0.4.x
  after S5c. · R-L3 The starter in `lw-data-`, with KEEP ON THIS DEVICE. · R-L4 The STEM fields you want to see. ·
  R-L5 Stores builds: expansions bundled or downloaded.
- R-N1..8 The names plan's rulings stand.
- R-K1 The S key: WASD keeps S; FOLDERS takes another chord in λWAVES.
- R-D1 First-run look under the kit: λWAVES' own (light, 22 px, 50 % VIVID, normal ink) as `createGui({defaults})`.
- R-I1 The INFORMATIONAL switch in SETTINGS › DISPLAY; the window the kit's. · R-I2 `lw:` action links in pages: yes
  (lessons as plain `.md`), or nothing. · R-I3 Pages travel with the project (kit) vs "an open never closes the
  notebook" (CLAUDE.md): which wins.
- R-G1 0.5.0 waits for a `1.5.0` cut; the canary absorbs the alphas.
- R-S1 "Cyclotomic scaling": the ring-character reading, or the Gauss-period / character-basis idea in your DISK
  corpus and MASTER GOAL SPEC §39 — the Sol thread starts from your answer and reads the corpus first.
- R-U1 Who 0.4.0 is for (you, a class, Reddit on an iPad) decides whether SHARE LOOP and the opener are 0.5.0 or later.

## 8 · DISPOSITIONS AND WHAT IS NOT CLAIMED

**SIBLINGS rows:** 0.4.0 — 2 FIGURE, 3 CITE, 4 chips (+ TAKE MODE, warm cover). 0.5.0 — 1 SCENES (in STATE, replacing
A/B as two of eight), 6 named orbitals + FLY-TO + search (the rack's + menu made type-to-filter), 7 pages, 8 the
library gallery, 9 MAPS (H₂'s FCI curve first), 19 flash guard, 20 title card, 21 ink law, 24 CURVES, 27 kit project
parts, 33 kit panels. 0.4.x — 5 period-exact export, 10 TIMELINE, 11 the atom as metronome, 12 LAYERS, 13 ATLAS, 14
RULER, 15 LENS, 16 CHORD and the ladder keyboard, 17 kymograph, 18 scale bar, 22 LIC/bloom, 25 TAKE, 26 LIGHT, 29
DEROTATE, 31 TUNER, 32 PATTERN, 34 GPU anchor, hover-to-peek, the character-table page, the vs-EXPERIMENT lamp beyond
the ten, SHARE LOOP. Declined — 23 params registry (check `app.param()`/`describe.js` at adoption first), 28 MIDI, 30
OUTPUT, 35 (already stronger here), and the anti-harvest as written.

**One in, one out:** SCENES in / A/B TRANSITION out (as scenes) · MAPS in / legacy H₂ out · OVERLAYS row in / seven
switches out · EXPANSIONS tab in / nothing (a new seat for a new thing — said plainly) · DYNAMICS out · STAGE FORMULA +
ATOM LABELS + two SIZEs → two rows · the interim stage-text renderer and the periodic-table stopgap in now, out at 0.5.0.

**Not claimed:** no line of 0.4.0 is built; the INFORMATIONAL has run in no real app and its touch, WebKit and
over-WebGPU looks are unproven; C₆₀, the wave index (VAULT §1.2–1.3: cached / warm / ghost tiers, the station ring,
the carousel, Q_LM reading A), the Sol thread, the parked asks (the Serum matrix, shader plugins, knob quick-settings,
ijk mini-maps, "2×6 layout") and Sol's pack delivery (Drive, R2) are later or not re-planned here; the names probe
covered ten molecules in STO-3G with s and p only; "all amino acids" is sixteen of twenty until S5c; the YouTube video's
content beyond its title and description is unknown.
