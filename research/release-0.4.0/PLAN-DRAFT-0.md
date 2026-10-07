# λWAVES 0.4.0-alpha · THE FLAGSHIP — PLAN DRAFT 0 (Fable's pre-draft, 2026-10-07)

Read `NACRE.md` first (Josh's ask verbatim, the laws, the file protocol) and the four surveys under `survey/`. Every
number below is theirs unless marked [mine]. This draft is for Sonnet's review; it becomes DRAFT 1 after it.

## 1 · THE GOAL

**Josh's words:** a pre-refactor for MIR 1.5 that makes λWAVES the flagship; the cache treated as expansions with
metadata, STEM information and LaTeX copy into the journal; true orbital names on the ladder (`1a1, 1b2`); wave-indexed
presolved orbitals; diverse library sections (periodic table, heavy atoms, lattices, biology, a bucky-ball milestone);
engine upgrades for larger counts; the INFORMATIONAL as a live, cursor-aware, markdown video overlay with proper maths;
GPU-recording optimisation; camera pan and the dot-matrix XY; the legacy windows audited and consolidated, with power
buttons and the DISPLAY settings doing the resource work.

**Ours, one paragraph [mine].** λWAVES becomes the app where the kit's newest things are proven first (INFORMATIONAL, the
XY lattice, FOLDERS, one clock, a 3-D camera law), while its physics grows from a solver into a **library** — named,
cached, sectioned, honest about what each record claims — that the overlay can teach from and the journal can quote.
Under the laws this splits cleanly: the ENGINE stays λWAVES' (field, register, solvers, palette meaning, the truth labels);
every window, overlay and behaviour is the KIT's, and what λWAVES needs and the kit lacks is λWAVES' gift to the kit as
flagship; pages and records are CONTENT. 0.4.0 does the pre-refactor, the names, the camera, the windows and the first
real INFORMATIONAL; the adoption of 1.5 is its last stage and lands on the MIR session's word that 1.5 is done.

## 2 · THE SHAPE: engine / kit / content

| Layer | λWAVES keeps | Goes to the kit (λWAVES' gift as flagship) | Content |
|---|---|---|---|
| ENGINE | `field.js`, register + hydrogen/QHO/well/atoms, `md.js`/`rhf-molecule.js`/`h2ci`/`helium`, `electrostatics.js`, `period.js`, the palette's meaning, `badges.js` (truth labels), `statelink.js` v1, `export3d.js`, `latex-state.js`, `names.js` (new, pure), the digest lock, the service worker until gap 9 lands | `camera-law.js` + `stage-gestures.js` (gap 1), the pan semantics stay engine (ray-gen offset) | — |
| KIT | the modulation port, project parts, occlusion providers, a one-clock facade, the camera port (glue ≈ 1–1.5k lines) | rack, windows, transport, keys, GUI/prefs, notebook/pages/shelf, FOLDERS, history window, INFORMATIONAL, CAMERA/XY/RAMP/GRADE/CURVES/LANES panels, recorder, envelope, share-link, ink law, flash guard, opener; plus λWAVES' gifts: `md()` window copy (gap 3), the `cells` grid control (gap 4), the lattice export (gap 5), info-in-film + cheap mode + TTL (gaps 6–7), painted-surfaces provider (gap 8), offline layer (gap 9), camera keys (gap 12), the INFORMATIONAL window (gap 13), live-bound math labels (SIBLINGS §5.2) | — |
| CONTENT | — | — | `.md` pages per orbital / state / molecule / window; the LIBRARY records (names inside), sections, covers, CITE rows, demos |

## 3 · THE BASELINE CHANGES (infrastructure first, in this order)

**B0 · Take in Cloud's two PRs, then subtract** (LWAVES-AUDIT A.3–A.4). Merge PR #1 then PR #2 (one textual conflict,
the generated `sw.js`; regenerate). One subtraction commit: drop the `lab/mir/palette.js` edit and the forged
`MIR-MANIFEST.json` (re-land Jet Black in MIR, then adopt); fix the `copyLatex` gate to "a molecular owner is on";
`.mol-more` becomes a fold (its controls were made unreachable and two tests bent); decide SPECTRUM's orphaned ATOM and
QUARKONIUM buttons (R-A2); CLAUDE.md's false MIR line and stray sentence; a REPORT entry for what was kept (the paint
gesture's behaviour, MO-REGISTRY standing by, the first-run left rack, `docs/LEGACY-WINDOWS.md`, the wrangler bump).
Then the gates. **The live site today serves Cloud's main** (checked 2026-10-07: the version line still says
0.3.2-alpha, the served `rack.js` carries the stage formula and atom labels), so the unreviewed work, the forged MIR edit
included, is what users run, and 0.3.3's exports are not live. **Cut 0.3.3 first or fold it in** (R-A1): the exports are
green and merged; my recommendation is to cut 0.3.3 from the merged-and-subtracted tree at once, so the live site stops
carrying unreviewed work, and 0.4.0 starts from it.

**B1 · The seams** (MIR-1.5 §2.4, ten verbatim moves, each one commit with the digest lock green): (1) the settings
adapter split into PREFERENCE and WORKSPACE keys; (2) the look store behind one object; (3) project parts from
`serialize()/restore()` with `capture/restore/signature` (the history keeps `serialize({scope:'edit'})`); (4) the
floating-rack block (`rack.js` 3307–4370) as one module with the kit's verbs; (5) the modulation port as one object;
(6) a one-clock facade `{play,pause,isPlaying,toggle,onChange,seek}` with `clockLink` gone (R-B1); (7) occlusion
providers per window species (`refreshOcclusion` only concatenates; the 32-rect cap and the paused-PRESENT law stay);
(8) the camera port `{get,set,subscribe,turn,home,ranges,angle:'rad'}`; (9) the actions table renamed to the kit's ids
with `data-key-action` on controls; (10) tests that find things by hook, not label. Two more that the audit found:
(11) **`cameraEye(obs, half) → {eye, target, basis}`**, one projection helper replacing nine copies (`field.js`,
`fieldview`, `keplerview`, `particles`, `vortex`, `export3d`, `pointerRay`, `unproject`, atom labels) — the
precondition for pan and for feature labels; (12) **`reg.onChange`**, a real register change event (Cloud polls the
version key every tick because there is none). Acceptance: `rack.js` shrinks by the moved blocks; serialize bytes
identical on the snapshot set; lock 1004/1004; every suite green.

**B2 · LIBRARY, the fourth storage class, and the data cache** (NAMES-AND-CACHE §6): installed records are device
content, content-addressed, never in a project, link or history row; a project holds `{id, hash, nameKey}`. The cache is
`lw-data-…`, outside the build cache, fetched per molecule on first open and kept across builds (an update refetches the
whole build: 203 files, measured, so nothing heavy goes in `lab/`). The generator is the app (`tools/orbital-library.mjs
--check`). `docs/STATE-SCOPES.md` gains the row.

**B3 · The frame-path budget, stated once:** nothing new on the frame path. Names are computed in the worker inside
`ensureSolve` (≤ 10 ms, benzene); the library fetch runs in idle; the stage text re-renders only on `reg.onChange` /
`chem.subscribe` (no per-tick layout reads — Cloud's `stageTextTick` and the 400 ms body-class re-placement go); the
INFORMATIONAL's `viewChanged()` is coalesced to one per presented frame and the layer has a cheap mode while recording;
a pan is TIER.PRESENT only; every reader stays `may()`-gated and idle when its window is off, folded, closed or hidden.

## 4 · THE FEATURES

Each row: what the reader sees · window · kit or app · cost (S/M/L) · what it must not do.

**F1 · THE NAMES** (NAMES-AND-CACHE §3–5; the probe named ten molecules with every configuration matching). MO-REGISTRY's
knob and the ORBITAL ladder read `1b₁ · HOMO`, `3a₁`, `1e₁g (a)`, `2σ_u`; a degenerate HOMO is one HOMO (today its members
read HOMO−2, HOMO−1, HOMO in CH₄, HF, CO₂, C₆H₆); SPECTRUM's and MO-REGISTRY's ⧉ copy `$1b_{1}$` in the notebook's
spelling; the GLB, the cube's comment and the NPZ carry the names. One service `lab/names.js` for atoms and molecules
(the four formatters become one), declared groups and frames in the library, d shells and the five remaining tables, the
cluster tolerance 2e-10 Eh, the geometric tolerance stated (furan and pyridine close to 1e-3 bohr), a names record all
or nothing, one PySCF cross-check in `tools/`. · MO-REGISTRY, SPECTRUM, exports · engine/app · M · never asserts an
ordering; a name below tolerance falls back to the index.

**F2 · THE STAGE TEXT, done right** (LWAVES-AUDIT D). Cloud's plain-text formula becomes markdown + KaTeX through the
notebook's own renderer, from `stateLatex` and a one-function TeX of the library formula, re-rendered only on change;
atom labels through `cameraEye`. It keeps Cloud's four PREFERENCE keys and SETTINGS › DISPLAY rows. At adoption the same
call becomes `layer.addBlock({md})` and the atom labels `layer.addLabel({anchor: feature})`. · the stage · app, then kit
· S · no per-tick layout reads.

**F3 · THE WINDOWS** (LWAVES-AUDIT B; Josh: "audit, consolidate, leverage power and DISPLAY").
- Retire DYNAMICS: L/T/V/S and its history plot → SHADOW's footer; moments and the virial → CALCULUS rows; the dipole
  lines → RADIATION; ACTION–ANGLE → gone (SPECTRUM is it); PARTICLES → the OVERLAYS strip. One fewer card, ten fewer
  readout writes a tick, no `innerHTML` rebuild. (R-W1)
- One OVERLAYS strip (KEPLER ORBIT · VORTEX · PARTICLES · ELECTROSTATICS) replaces four switches in four cards; each
  overlay obeys its power and `canPresent`; at adoption each is a layer the INFORMATIONAL lists.
- CALCULUS, WIGNER, RADIATION, METERS share one skin (RADIATION's: plot, then tiles in a grid that gives two columns on
  the card and three floating, opted out of LEAN) and one copy dialect: every row gains `tex`, a pure `calculusMarkdown`
  / `table()` → a GFM table of `$…$` cells with a heading, the footer and the caveat, pasting into the notebook and
  rendering. CALCULUS's ⧉ copies a header today (the digest reads a field the window never returns) — fixed first.
  The `md()` contract is proposed to the kit as `rack.register({ md })` + PIN FROM WINDOW (gap 3). (R-W2 "figure" style)
- Badges and the canvas sentence get their own ≤ 10 Hz tick (today they ride METERS' and go stale with it closed);
  PERFORMANCE and GOVERNOR move to SETTINGS › QUALITY; `hydroReader` learns `chem` (WIGNER and RADIATION compute
  hydrogenic physics under a molecule today).
- SLICE → **PLANE**, SLICE / CLIP → **CLIP** (ids stable) (R-W3).
- The legacy six: per window, delete with a `restore` shim, re-adopt, or keep hidden (R-W4) — HELIUM (Hylleraas
  correlation) and H₂ (the FCI curve) hold physics MOLECULES does not.
- Window cost law: a window that is off, folded, closed, hidden or offscreen costs nothing (already true for readers);
  the OVERLAYS strip and the stage text join that law; a per-window cost line in METERS/QUALITY is the honest meter.
· app (the skin and `md()` become kit) · M.

**F4 · THE CAMERA** (LWAVES-AUDIT C). A **target pan** (model A): `obs.pan` in `domain.half` units, the eye
`target + dir·dist·half`, orbit about the target; `panBy` screen-relative so the point under the cursor follows the
pointer at any zoom and FOV; right/middle drag and two-finger drag pan, wheel stays dolly, an Alt+Arrow pair on the
keys; CAMERA gains PAN X / PAN Y + PAN HOME; targets `observer.panx/pany`; the pose row in STATE-SCOPES gains `pan`
(PROJECT, not history); the empty project regenerated; links open centred (v1 stays frozen) or a v2 flag byte (R-C2).
"Planet photo at max FOV": the range is ~7× magnification at the target; the ±1 half clamp reaches every part of the
cube. At adoption the kit's CAMERA panel shows the PAN pad with the lattice the moment the port answers `panX/panY`,
and an XY card offers PAN and ORBIT (a joystick through the law's third summand) as pairs — the pad's knobs are the
targets, so the two knobs built now are not thrown away. The camera law and gestures go to the kit (gap 1) with
λWAVES' numbers. · CAMERA, the stage · engine (ray-gen) + kit (panel, law) · M · PRESENT tier only; nothing drifts under
AUTO domain.

**F5 · THE LIBRARY as expansions** (Sol's plan + NAMES-AND-CACHE §6–7; VAULT §7). Records = Sol's native booster record
+ the names (§4 of the names plan); keys = inputs + solver/basis/gauge/name-schema versions; a cached open calls no
solver; benzene is the proof (the library's cost model is stale: benzene solved in 1.0 s in node against 9.6 s
predicted — measure the saving on the iPad before sizing the starter around it). **Sections, diverse not variants**
(R-L1): DIATOMICS · HYDRIDES · ORGANIC (what exists) · **BIO** (the sixteen amino acids ≤ 64 AO now, Lys and His at
exactly 64; the five nucleobases 44–60; Gly-Gly 57, N-methylacetamide 32, imidazole, indole, phosphoric acid, ribose) ·
**LATTICE** (finite clusters only — the solver has no k-points: LiH/LiF/MgO/NaCl cubes, ice hexamer and cube, cubane,
neopentane, naphthalene, Si₅H₁₂) · **HEAVY** (the Kr row the basis reaches: KrF₂, SeO₂, KBr, GeCl₄, TiCl₄ and the
d-block "try it and let the stability probe decide"). Basis pairs STO-3G + 6-31+G* for anchors only; the name is the
join key so an A/B MORPH between bases means the same orbitals. **Layouts**: FOLDERS tiles and sections now; the
periodic table (vertical on phones) and the (l, n) orbital table as the kit `cells` control at adoption (gap 4), with
SPECTRUM's grouped-button look. **C₆₀** is the milestone that needs Sol's grid provider (300 AO; the dense ERI tensor is
60 GiB) — a 0.4.x stage after the starter, not 0.4.0 (R-L2). · FOLDERS, MOLECULES, MO-REGISTRY · engine/content (the
grid control is kit) · L · never a second solve road; never a record that fails validation.

**F6 · THE INFORMATIONAL, first real use** (MIR-1.5 §3; Josh's philosophy; the mentality note). Pages are `.md` files:
one per orbital, state, molecule and window, with callouts anchored to features (`> [!mir|nucleus] O 1s`), places and
controls; the greeting is page 0. λWAVES contributes to the kit, as flagship: **(a)** `addLabel({ttl})` so "HOMO + LUMO
picked → it shows at the top, then fades" is one call; **(b)** `layer.setCheap(on)` driven by the recorder and the
QUALITY tier — bare, no drift, no parallax, no backdrop filter, `viewChanged()` once per frame — the GPU-recording
optimisation; **(c)** `recorder.overlay(i, ctx)` so the overlay is in the film (the manim feel); **(d)** the
INFORMATIONAL rack window (SHOW, pages, LINES, INK, SIZE, FOLLOW CURSOR, ADD LABEL, the list with eyes, the overlays as
layers) with its switch in λWAVES' SETTINGS › DISPLAY (Josh: not MIR OPTIONS); **(e)** live-bound math labels
(`{{state}}`, `{{E}}`, `{{T}}`) answered from `describe()` and re-typeset on change — the thing no sibling has;
**(f)** `setEdit` for "let the user move the text". The cursor-aware lines, the diagonal/flat law and the springs are
the kit's as built. · the stage, an INFORMATIONAL window · kit (λWAVES builds it there) + content · M–L · zero work at
rest; no tutorial machinery (pages are the tutorial).

**F7 · HARVEST from the siblings** (SIBLINGS §3, the rows that fit): SCENES/MORPH on the XY pad (a normalised complex
blend, the A/B TRANSITION generalised); FIGURE = a PRINT whose PNG carries the project envelope and a caption strip in
LaTeX; CITE per window (the closed forms, the vendored bases, CCCBDB geometries, ChronusQ, the Cornell potential, the
revival maths); honesty chips EXACT · NUMERICAL · MODEL · ARTISTIC in the window head from one table; EXPORT of exactly
one period through the kit recorder (`period.js` declares T); named orbitals + FLY-TO + one search box (the names are
the index); MAPS (Stark map, dissociation curve, revival map) as the instrument's missing figure type; a scale bar in
a₀ ⇄ Å ⇄ pm; the flash guard judge; the ink law; the title card with four covers. The three kit ideas λWAVES can give:
the closed-form clock (`at(t)`, `period()` → scrub free, loop snaps to the period, SYNC = PERIOD), live-bound labels,
a known-answer lamp. Anti-harvest stands (painted potentials, symmetry folds, banks, splats, warp/grain). · various ·
mostly kit · S–M each · nothing that recomputes on a second road.

**F8 · ENGINE UPGRADES — research items, not 0.4.0 builds** (Josh's words; honesty first [mine]). Larger counts: the
dense `nAO⁴` ERI tensor and `MAX_MOL_AO = 64` are the two walls; the standard roads are Schwarz screening + direct SCF
(no stored tensor), density fitting, and a tiled/streaming orbital evaluator past 64 AO (Sol's grid provider is the
display side). Heavier atoms: the vendored basis stops at Kr; beyond it needs more basis data or ECPs, and d/f shells in
the renderer. **"Cyclotomic scaling"** [mine, offered as the honest reading]: the lower orbitals "go nuts" because core
orbitals carry cusps and high spatial frequency near nuclei, which taxes any grid; the two real levers are (i) symmetry
blocking — for rings and cyclic molecules the Fock matrix factors over the characters e^{2πik/N} (Hückel's benzene
orbitals are literally cyclotomic; Bloch's theorem is the infinite case), which the names machinery already computes, and
(ii) a frozen core / pseudopotential or a cusp-aware radial sampling so the display spends its resolution on valence.
This is a mathcollab thread for Sol 6.1 and the DISK corpus, not a 0.4.0 build; the deliverable is a measured
proposal. · research · L.

**F9 · WAVE INDEX / ZOETROPE** (VAULT §1.2–1.3 [proposal]). An index over the library keyed by (species, method, irrep ·
count) with three answer tiers labelled on screen — cached (no SCF), warm start (the record's C as the SCF guess,
exact), ghost (display only, with the honesty number ‖F_ov‖ and a switch to TRUE) — and two small first uses: a
diatomic **station ring** (bond-length stations, Hermite interpolation per named orbital, a zoetrope of the correlation
diagram) and an **ORBITAL CAROUSEL** in MO-REGISTRY that steps the named ladder at the FPS marks. "True electrostatics":
reading A — per record the transition multipole matrices Q_LM (L ≤ 2) so a packet's multipoles and exterior potential
follow by a finite contraction, exact for the frozen packet, labelled not self-consistent. 0.4.x after the library.

## 5 · THE STAGES

| # | Stage | What | Done when |
|---|---|---|---|
| S0 | TAKE-IN | B0: Cloud's PRs merged, the subtraction commit, 0.3.3 cut or folded | every gate green on the merged tree; no `lab/mir` edit remains; REPORT has the wave |
| S1 | THE SEAMS | B1 (1)–(12) | `rack.js` ≤ ~3,500 lines; lock 1004/1004; serialize bytes identical; the one-clock facade proven (play never depends on modulation) |
| S2 | THE NAMES | F1 | every enabled molecule named or says why; MO-REGISTRY reads `1b₁ · HOMO`; degenerate HOMO is one; the copy pastes and renders |
| S3 | THE STAGE TEXT + THE WINDOWS | F2, F3 | no per-tick layout reads; DYNAMICS retired; one skin + one copy dialect for the four readers; badges on their own tick; PLANE/CLIP |
| S4 | THE CAMERA | F4 | pan law tests (pan then reset = identity; cursor-anchored invariance); right-drag and two-finger pan; `new-project --check`; links honest |
| S5 | THE LIBRARY | B2 + F5 (benzene proof → the 52 starter → the sections) | cached = fresh on energies, occupations, signed fields, subspaces, names; zero solver calls on a cached open; measured bytes and first-display time on the iPad |
| S6 | THE ADOPTION | MIR 1.5 taken in BASINS' order (CAMERA panel, RAMP/GRADE, GUI/prefs with `projectAccent:false`, rack + transport + modulation + keys, FOLDERS + pages last); the 15 risks each closed; λWAVES' kit gifts (gaps 1–9, 12–13) as kit PRs | stylehash neutral on the throwaway copy first; ~9–10.5k lines out, ~1–1.5k glue; every λWAVES law re-proven (scopes, occlusion, offer, quiet take, history) |
| S7 | THE INFORMATIONAL | F6 (+ F7's FLY-TO/search, honesty chips, CITE, FIGURE) | the four pages exist (an orbital, a state, a molecule, a window); a picked preset shows and fades; the film carries the overlay; zero work at rest; recording mode measured |
| S8 | 0.4.x | F5's C₆₀ via the grid provider; F9; F8's research deliverable | each its own stage |

**Why this order [mine]:** S0 unblocks everything (the live main is unreviewed work); S1 is the pre-refactor Josh asked
for and the precondition for S4 (`cameraEye`), S6 (the seams) and S3 (`reg.onChange`); S2 is content value with no kit
dependency and defines the join key S5 needs; S3 and S4 are app work that does not wait on the kit; S5 is the biggest
engine piece and gates C₆₀; S6 waits on the MIR session's word and should take a `1.5.0` cut, else one re-adopt per
alpha (BASINS needed eleven); S7 needs S6 (the layer) and S2 (the names in the pages). Verification: one light check per
stage; a verifier for S1 (the digest lock and the scopes), S5 (worker + storage) and S6 (the adoption).

## 6 · RULINGS FOR JOSH (each flips one line)

- R-A1 Cut 0.3.3 now from the merged tree, then start 0.4.0 — or fold it into 0.4.0 (recommend: cut).
- R-A2 SPECTRUM's ATOM and QUARKONIUM: hide the two buttons while ATOMS and QCD stay hidden — or bring the two windows back.
- R-B1 One clock: λWAVES' transport play is THE play; modulation gets POWER; LINKED/SEPARATE retired (the kit's rule).
- R-W1 Retire DYNAMICS as mapped. · R-W2 Readers' copy as a GFM table of `$…$` cells ("figure" style). · R-W3 PLANE and
  CLIP. · R-W4 The legacy six, per window.
- R-C1 Target pan (orbit about what you inspect), not lens shift. · R-C2 Links open centred (v1 frozen) or a v2 flag.
- R-L1 Sections: DIATOMICS · HYDRIDES · ORGANIC · BIO · LATTICE · HEAVY; one conformer each. · R-L2 C₆₀ after the
  starter (0.4.x). · R-L3 The starter lives in `lw-data-`, not the build.
- R-N1..8 The names plan's rulings stand (primary name = symmetry label with HOMO beside it; Mulliken 1955 frame;
  all-electron counting; `(a)/(b)` components; names before cache; derived textbook names for diatomics; hydrogen stays
  complex by default).
- R-K1 The S key: WASD pitch-down keeps S and FOLDERS takes another chord in λWAVES (or the reverse).
- R-D1 First-run defaults under the kit: keep λWAVES' (light, 22 px, 50 % VIVID, normal ink polarity) as
  `createGui({defaults})` — or take the kit's FROST.
- R-I1 The INFORMATIONAL switch lives in SETTINGS › DISPLAY (your word), the window is the kit's.
- R-G1 Adoption waits for a `1.5.0` cut — or re-adopts per alpha.

## 7 · WHAT IS NOT CLAIMED

No line of 0.4.0 is built. C₆₀, the wave index, the engine upgrades and the research thread are 0.4.x or later. The
INFORMATIONAL has not run in any real app; its touch, WebKit and over-WebGPU looks are unproven. The names probe covered
ten molecules in STO-3G with s and p only. Sol's pack delivery (Drive, R2) stands as written and is not re-planned here.
