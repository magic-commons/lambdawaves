# The register, the systems and their physics

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 044

THE REGISTERS' CONTROLS ARE WRITTEN ONCE (044 A3, ledger L109 and L58; the vault's iteration-044 `A3-BUILD.md`): a word a register's head or bar shows is the kit's `trig()` (SPECTRUM's DIALS and + MODE, STATES' HIDE, BRIGHT / ALL, ω → LANE and FILE, ORBITAL's DIALS and CORE, → A and → B); A WORD THAT STAYS ON WEARS THE LAMP (044 A8, ledger L154, Josh's "Yes to lamp?"): + MODE, BRIGHT / ALL, → A and → B light through the kit's `on` door (aria-pressed, the lamp DIALS and CORE wear by aria-expanded); + MODE's quarter of the head closes the lamp's gap so the word clears its edge (`lab/skin.css`). A GLYPH ALONE IS THE KIT'S GLYPH TRIG (044 A8, L89): STATES' HIDE, ORBITAL's DIALS, the download glyph beside MOLECULES' picker and every fold's chevron (`lab/fold.js`) are `trig({ glyph, word: false })`, named by `label`; no seat moved. CORE's open state is one of the card's `folds` (`data-fold="core"`; an older record's `core: true` still opens it). A lane's M · S · × is `laneStrip()` (`lab/paint-stroke.js`), one for SPECTRUM, STATES and ORBITAL. A LANE'S AMPLITUDE IS A SLIDER in all three (ORBITAL's |c| was a knob; `.fd.pop` in the knob's seat); the phase stays a knob. The save beside a preset stepper is `presetSave()` (`lab/user-presets.js`): SPECTRUM's presets, PALETTE's, CURVES'. The page dots are `pageDots()` (`lab/pager.js`): the rack pager's and the Picker's decks'. An inner fold is `fold()` (`lab/fold.js`) and passes a `key`: SHADOW's details and MOLECULES' MORE go through it; MORE keeps its own record key `more` and wears no `data-fold`.

## The laws of 042

UNDER A FIELD A ROTOR ACTS AT t (042 D11, X2): with Fz or Bz ≠ 0 (or a propagator) `Register._op` turns c(t), not the anchor (`lab/state.js`), and KEPLER reads its orbits off c(t) under STARK or ZEEMAN (`lab/keplerview.js`, `lab/windows/kepler.js`); orbit.js's ORBIT drags pass no t and stay on the anchor.
A RADIAL CACHE KEYS ON THE TABLE IN FORCE (042 E2, E3, E13): a cache of radial integrals (dynamics.js RAD · MOM · RULE, kick.js's slap table, calculus.js FCACHE) is keyed on `radialKey(H)` (`lab/dynamics.js`), never `id:Z`: CENTRAL and QUARKONIUM re-solve their radials under one id.
THE ATOM CACHE IS CAPPED (042 D8): `lab/atoms.js` keeps the last 24 solves (FIFO, each with its radial rows); an evicted element re-solves bit-equal.

## The laws of 041

PAINT IN MOLECULES, BUTTONS IN SPECTRUM (041 H1): the stroke record `lambdawaves.q0.stroke` is `{ mode, mol }` — `mode` SPECTRUM's (home BUTTONS; an older record stays SPECTRUM's choice), `mol` the ORBITAL and STATES ladders' (home PAINT); each family's seats move together (`lab/paint-stroke.js`).
A HAND'S EDIT ENDS THE TRANSITION (041 H2): under TRANSITION a hand's edit of the grid (a chip, a stroke, FILL ALL, EMPTY, a lane's remove) stands it down and lands on the store written LAST (B when a file brought both) with that edit; the unstored mix is not kept (`app.hooks.ab.handEdit()`, `lab/windows/transition.js`).
THE HAMILTONIAN'S OWN ROOMS (041 H4, H6): CENTRAL, SEPARABLE and LATTICE are rooms (`.sp-room`) under SPECTRUM's HAMILTONIAN, shown by ‹ SYSTEM › (built by `lab/windows/readouts.js`), every control hinted; MOLECULES left ‹ SYSTEM ›, and a rule parts HYDROGEN · OSCILLATOR · BOX · ATOM from CENTRAL · QUARKONIUM · SEPARABLE · LATTICE; the retired windows: legacy.md. THE GRID SAYS THE SYSTEM'S OWN NUMBERS: the operator's grid lays and names the 140 picker's chips and the lanes (`spectrum.js` `regrid`) — OSCILLATOR a row per N, BOX a row per n_r + 1, ATOM's virtual shells faint with °, SEPARABLE the triple.
ATOMS IS A PRESET PICKER (041 H5): a cell puts the element in force, makes ATOM the operator and loads its GROUND CONFIGURATION (`atoms.js` `groundConfig(Z)`: every occupied subshell at its electrons' weight, every m equal and in phase), the highest valence level (`valenceShells(Z)`'s last, Madelung order: Fe 3d, Na 3s, Au 5d) the lane selected; one undo row (`setElement(Z, load)`, `fillValence(all)`); ATOMS opens and closes by the rack's roads; LOAD VALENCE stays the valence alone.

## The laws of 037

THE TOGGLE BUTTON (037 H6, Josh 11-05: "I said 'Toggle' but you've built what I call a 'Switch' … The icon just swaps between two different
icons"): the words, kept forever — a SWITCH is the kit's `sw`, two states on one body with a lamp (ON / OFF: CLIP's ON, the CAMERA's LOCK);
a SEGMENTED CONTROL is the kit's `seg`, two to four named cells side by side, one lit (TURNTABLE | FREE, CLIP | SLAB, CAMERA | OBJECT); a
TOGGLE BUTTON is one `.trig` whose glyph swaps between two drawings, never lit (FILL ALL ↔ EMPTY, BUTTONS ↔ PAINT). iOS calls its on/off
switch a "toggle"; λWAVES does not. BUTTONS · PAINT is a toggle button since 037 (`lab/paint-stroke.js` `strokeButton`, it replaced 036's
`strokeSeg`): the hand (BUTTONS) ↔ the brush (PAINT), the face the mode in force, its word the aria-label, its hint "… · press: …",
`data-state`; one press flips the PREFERENCE `lambdawaves.q0.stroke`, every seat in step (041 H1: every seat of its family, above).

THE LAW LINE (037 H7, Josh 11-05: "Mouseover reveal of text in spectrum should only happen inside that reader thingy. Tell me what you call
that thing"): the box SPECTRUM draws its levels in is THE LADDER (SPECTRUM's register ladder; MOLECULES' ORBITAL and STATES ladders are the
same thing), and the line of maths that appears at its foot is THE LAW LINE (`.reg-foot`, `paint-stroke.js` `footLine`). It shows while the
pointer is on its own ladder (the canvas it lies over: `canvas:hover + .reg-foot`, the line itself takes no pointer) or while keyboard focus
walks the window (`.dev:has(:focus-visible)`), never on the window's hover alone (lab.css). The kit's READOUT (`.ro`, a value with a
whispered sub-line on hover) is a different part.

## The laws of 036

BUTTONS · PAINT (036 P1, Josh 2026-11-03: "a 'Paint' vs 'Buttons' toggle … the original control of a left-click only feature … Same goes for
switching between atoms and molecules; don't change the wave/palette windows"): the ladders' stroke has two modes, one PREFERENCE record
`lambdawaves.q0.stroke` { mode } read at each press (`lab/paint-stroke.js` `strokeMode`, `paintStroke`'s `mode` and `isOn`), its seat
`strokeSeg` (since 037 `strokeButton`, THE TOGGLE BUTTON above) — a pointing hand · a paintbrush — on SPECTRUM's head (in PRESET VISUALS' place, the four-column grid kept) and on the ORBITAL
and STATES heads (SPECTRUM hides under MOLECULES), every seat in step. BUTTONS, the default (041 H1: SPECTRUM's; MOLECULES' is PAINT, above): a left press released on the item it began on
TOGGLES it (normalised, VIEW MIX, one undo row, as a stroke), a drag sweeps nothing, the right button is the context menu's (the grid's
CLEAR · NORMALIZE · NEXT SYSTEM · CREATE EVENT …). PAINT is THE PAINT GESTURE below. WAVE and PALETTE never read it.

A HAND'S PRESET IS THE REGISTER (036 P1, Josh: "remove the feature 'Preset Visuals' … user's work hard on their wave and then it gets
overridden"): SPECTRUM's ‹ PRESET ›, the verb `preset`, EMISSION's pair and the Picker's 140 tile load the labels alone (`loadPreset(…, { hand:
true })`); the view, the rate and the window stay the reader's. A preset's `visual` rides the boot's road alone — `?preset=` (a link is its
author's whole intent; THE LOCK boots it) and the facade's bare `loadPreset(id)`. PRESET VISUALS and `api.visuals` are gone. The EMISSION
paragraph's "one period in the window" below is history: a pressed line no longer sets the window.

THE DIAL'S NAME (036 P2, Josh: "use the informational's working font for the orbital text"): SPECTRUM's lane names (`.sp-nm.sp-nl`) are the
operator's `labelOf` TYPESET — its m a real subscript (`2p₋₁`, `2p₁`, the chips' form) — in STIX Two Math (`--font-math`, the one bundled face
with every subscript digit; Roboto lacks ₆ ₇ ₈); display only: `labelOf`, the aria names, the badges, the shadow digest, latex-state and the
verbs keep the plain form.

## The standing paragraphs

THE PAINT GESTURE (`lab/paint-stroke.js`, the PAINT mode) is one law for the ORBITAL and STATES
ladders and SPECTRUM's state grid: LEFT click adds one, LEFT drag adds every
item it crosses; RIGHT click removes one, RIGHT drag removes every item it
crosses (Alt/Option+left = right; a finger = left). A crossed degenerate row is
taken whole. One stroke is one undo row. The same module holds what the three
ladders share (iteration 009 F2): EMPTY ↔ FILL ALL (`fillButton`, one glyph,
SPECTRUM's head too) and THE LEVEL LINE (`levelLine`: off at α 0.42 and w px,
on at full strength and w + 1 px; SPECTRUM and ORBITAL w = 1, STATES w = the
oscillator weight; `fade` steps a mark back). The register's A ↔ B MORPH is
`lab/register-morph.js`: its `load` and `reset` set `.reg-morphing`, so a
restored MORPH dims the lanes exactly as a hand-set one, in both panes.

ATOMS left that list in 0.4.0 (R-A2): it is the periodic-table window — H–Kr
cells in SPECTRUM's own picker, periods as columns on the card and a phone and
rows floating, its Δ-SCF / quantum-defect / α-order readouts kept — since iteration 008 Z the ATOM's central field is SCALAR ZORA (`lab/atoms.js` `zoraKinetic`: −½(K u′)′ + [K′/2r + K l(l+1)/2r² + V] u = λ u, K = 2c²/(2c² − V); the scaled eigenvalue reported, the Δ-SCF ion in the neutral's K, spin–orbit not included), and since iteration 009 MV its exchange is MacDonald–Vosko's relativistic one (`mvR`/`mvPhi`: V_x·R(β), E_x·Φ(β), β = (3π²ρ)^{1/3}/c, R = Φ + βΦ′/4; on the ZORA road only, no switch) — the light 1s shift NIST's to ×0.60 (Ne) … ×0.97 (Rn), the scaled total's shift NIST's to 0.1 %, Au's 6s ionisation 8.65 eV against the measured 9.23 (0.04 eV further than ZORA alone: physical, Josh's call to keep), the non-relativistic solve `{ zora: false }` byte-identical to A's and read only by the window's RELATIVITY Δ (a press under the busy mark, never a frame) and `tests/atoms.test.mjs`' non-relativistic oracles; past Kr the atom's STATUS reads `<sym> · NUMERICAL · scalar-relativistic (ZORA · MV) Xα; spin–orbit not included`, H–Kr no line. THE REGISTER IS n ≤ 7 (iteration 008 A7): `hydrogen.js` BASIS is 140 labels, the 91 of n ≤ 6 first at their old indices (`N6`), n = 7's 49 after; a mode table has seven slots (0 for every older record), the radial rows are `atoms.js rowOfNr` (n = 7's 7s … 7i at 36 + l); THE SCALE λ and the BOX packet hold all 140 (iteration 009 N7): the Sturmian (l, m) blocks reach n = 7 (49 blocks, rank 140; every n ≤ 6 variational eigenvalue moved down or held — Hylleraas–Undheim–MacDonald, `tests/sturmian.test.mjs` Q9) and `wellPacket` projects on the 140 (captured 96.68 → 99.22 % on the well test's packet), so THE LOCK's `states.sturmian.*` and `states.box.*` rows were re-captured BY NAME (39 leaves a fixture; a fresh capture moved no other leaf). THE BEAT EQUALIZER has seven bands (`equalizer.js` `EQ_SHELLS`, the kernel's seven accumulators, a 7 × 7 grid and seven faders): its table is solved over six shells while n = 7 is empty — the old arithmetic to the bit — and over seven once it is not; a save writes six gains while the seventh is 1. THE SCALE's λ runs 1/7 … 3 (iteration 010 X2: `sturmianreg.js` `LAMBDA_MIN` / `clampLambda`, one clamp for the knob, the setter and a restore; the floor is n = 7's hydrogen limit, where 7s is an exact eigenvector, E = −1/98); the knob is LOG, so the seven limits 1 … 1/7 spread over its travel, and its readout names a limit it stands on (`λ = 0.143 · 1/7`); the default 1, the saved `{ on, lambda }` and THE LOCK's λ 1.4 are unchanged, and an older λ (always ≥ 0.25) opens as it was. THE BLOCKS' SUPPORT (iteration 010 X1): under a non-diagonal H — a propagator (THE SCALE, the INTER-SHELL Stark) or the within-shell Stark field — the field draws the REACH, not the anchor's labels: `state.js reach()` keeps every label whose dephased weight Σ_k |C_ak|²|d_k|² (d the anchor's normal-mode amplitudes) exceeds EPS_POP — a function of the anchor and H, never of t, so the drawn set is fixed between edits — and `renderSet` draws it heaviest first (mute, solo and RENDER_CAP = 140 as before; `anchored` counts the anchor); THE SCALE's AUTO box follows it (`rack.js sturmHalf` reads `reg.reachNmax(1e-3)`), the Stark box stays the anchor's; with no field and no propagator `renderSet` is the old law byte for byte (`tests/sturmianreg.test.mjs` §5, `tests/stark.test.mjs`); THE LOCK's sturmian row draws 30.4 → 100 % of its S-norm (GPU integral 0.304 → 0.999), its `states.sturmian.*` leaves re-captured by name (24 + 24: count 2 → 13, the box 5.71 → 12.35; the lock holds no Stark state; a fresh capture moved no other leaf). A link carries n = 7 in REG7 (0x0B), the mask's six extra bytes and 140-wide rates only when needed; a project writes rates and A ↔ B stores 91 wide while n = 7 is empty — an n ≤ 6 file's bytes never move. SPECTRUM's coloured `n` number folds its shell (no chevron; a folded shell counts its populated labels; the paint crosses open rows only). Josh 10-19: "make n=7 minimized by default in the spectrum window, users can discover n=7 if they want to jam the whole rack lane with orbital options" — so n = 7 is folded on a first run, after NEW from the default, for any record without `shells` (an iteration-008 or older file, the demo) and after the Picker opens an atom (iteration 010 X2 proved each); a hand's unfold is the card's WORKSPACE `shells`, written only when it is not [7], and kept as WORKSPACE is (NEW never touches the arrangement). The ATOM system runs Z = 1…118 (Fr–Og all converged; the seventh shell's colour rose, hue 350, appended to the kit's shell set in `palette-app.js`) — opened by
SPECTRUM's ATOM and listed in the FINDER and WINDOW (it ships closed).

SPECTRUM (S): the two fill glyphs are a frame with three solid rungs and a filled disc (FILL ALL) and the empty frame with a ∅ (EMPTY), the hint leading with the word, each ladder its own tail (S2); ‹ PRESET › sits under the 140 picker and above the HAMILTONIAN, outside its fold (S3); the HAMILTONIAN folds behind its chevron (`data-fold="ham"`, closed on a first run, open through WORKSPACE `folds`) and shows ‹ SYSTEM › plus the rows of the system in force only — HYDROGEN: Z · μ · 1 | Ps | μH and SCALE 1/n | λ · λ; BOX and OSCILLATOR: WELL a · σ · |k| · BASIS · LAUNCH / BOUNCE; ATOM: ELEMENT Z — its segs knob-sized (`.sp-vseg`), every `ui.*` name kept, 570 → 213 px open (S1); PRESET carries a bare save glyph that keeps the populated labels under a name typed in the stepper's seat, in the PREFERENCE record `lambdawaves.q0.presets` (`lab/user-presets.js` `createUserPresets`, shared with PALETTE's P3), the list's USER group (each row ×) at the top only while one exists, a reader's preset loading through `loadPreset` as a hand's (THE FADE) with no visuals and no provenance, never in a project, a link or history (S4).

THE EMISSION SPECTRA (iteration 016, 0.9.9-alpha, Claude Yan; `research/iteration-016/PLAN.md`, `E/S/L-BUILD.md`). An emission line is two eigenstates
beating, and the window is THE INVERSE MAP of `dynamics.js` `dipoleLines`: `lab/emissionview.js` (seated after RADIATION in readouts.js, id `emission`,
an ATOMS window hidden by moleculeMode, closed on a first run and for a profile older than it — the blob writes `gen: 16`) draws a strip of lines ON THE CARD'S GLASS in LATTICE's vocabulary (E6, Josh: "the code of 'lattice' … looks gorgeous"; no black box, `themeInk` for
the axis and ticks in the UI face, THE CATALOGUE a comb of ink strokes at 0.3 each with a 1-px core in its spectral colour, unpressable lines ink only at
0.16, the hover the ladder's cursor bracket set upright, `paint-stroke.js levelLine(…, vertical)`; `STRIP_SHADE` 0 — the feathered shade B was less legible
in both themes; E7: PALETTE ON paints the cores with the reader's palette read across the strip — `toLUT` re-made when the stops change, the seat hands
`palette: () => app.state.palette` — PALETTE OFF the true spectral colour, and the catalogue line the lit state was pressed from, its HOME, wears ACCENT B:
A the computed line, B the measured one it answers) over an nm axis (RANGE VISIBLE | ALL), THE REGISTER's own emission lit in ACCENT A at the strength
`dipoleLines` gives the prepared state (under ATOM the lit line stands beside the measured one when the Xα Δε misses — the engine's error shown);
hover names the line, the wheel and ← → step it, a press is THE HAND (`loadPreset({ modes }, { hand: true })`, equal weights, phase 0, one history row
`EMISSION · Hα`, THE FADE), Shift+press or DECAY plays the A ↔ B TRANSITION from the upper label to the lower; ‹ SERIES › (LYMAN … HUMPHREYS) and ‹ PAIR ›
(π pairs first, σ after, the strongest A the default); RADIATION's EMISSION LINES list moved whole into the window's fold (RADIATION keeps the far field).
HYDROGEN is exact: `dynamics.js` `lineList` / `linePairs` / `stateLines` give every Δl = ±1 pair of the 140 from the operator in force (Z · μ · Ps · μH move
the lines) with the Einstein A from `radialDipole` — Hα 656.4696 nm vacuum with μ_H (NIST 656.46), A 3d→2p within 2.8e-5 of NIST (`tests/emission.test.mjs`).
THE ATOMS are measured: `lab/vendor/nist/lines.json` (NIST ASD, public domain, cited in ABOUT; `tools/nist-lines.py`, 4,519 lines of 78 neutral spectra, 40
spectra with no A-values recorded `none`, never filled) is DATA never precache (sw.js, `tests/pwa.test.mjs`); `lab/emission-map.js` parses a configuration
pair to the active electron's (n l) → (n′ l′) (a line that is not a one-electron jump is grey and unpressable); the pair loads as the atom's labels, the
beat runs at the computed Δε and STATUS says so beside the measured E — never a rescaled clock. A pressed line is ONE PERIOD for the film with nothing
added (Hα T = 90.48 a.u.). No radiation reaction, fine structure, Lamb shift, widths or multiplets; the MODEL sheet says so once. `__LW.emission`.

THE PHYSICS OF ITERATION 005 (Sol-6's engine seams, `research/iteration-005/PLAN.md`). THE FLOW
IS FACTORS: `molecular-flow.js` `setFactors(w, re, im)` evaluates ρ = Σ_a w_a |φ_a|² and
j = Σ_a w_a Im(φ̄_a ∇φ_a) in one O(n·K) pass over the AO values and gradients — the MO-REGISTRY's
packet is the one-factor case (`setPacket`, P1: aspirin's 263-AO packet flows at 13.8 presents/s
where the dense n² road gave 1.2), the kicked molecule's factors are the eigenpairs of the Löwdin
P = S^½ D S^½ made in the chem worker in f64 on each landing (P2; D's eigenvalues are NOT
occupations in a non-orthogonal basis; the transpose seam dies there with no negation); the dense
`set(re, im)` road stays for REPAIR and the pump. THE CONTINUITY RECORD is a live tile in MOLECULES
beside REPAIR and GATED (CALCULUS and PLANE are hidden in MOLECULES mode): ‖∂ρ/∂t + ∇·j‖/‖∂ρ/∂t‖
on PLANE's own geometry (`slice.js` `planePoints`), the full 3-D divergence by centred differences
— the finite-basis defect, an identity only in a complete basis, 0.6–1.3 for benzene/STO-3G with
90–99.8 % of the residual within 0.3 a₀ of a nucleus. The tracer floor is `setFloor(err, what)`
(max(1e-7, 10·err); GATED names it) and a trail fades over the decade above it. THE ERROR FIELD
(P3): `field.js` `errorField()` reads the whole ψ texture back once (`readGrid`, the field-law
test's road) and compares every voxel to the Hamiltonian's own CPU `psiAt` at the field's time
(a molecule: the f32 matrix the field drew) — METERS' FLOOR · GRID ERROR tile measures on a press
and re-measures when GRID changes, giving the field-law test's numbers digit for digit (hydrogen
1s+2pz at 64³: RMS 2.34e-6, worst 1.68e-4, toward zero) beside the CERTIFIED constants; never on
the frame path. THE MOBILITY EDGE (P4): LATTICE's ANDERSON has d = 1 · 2 · 3 (the cube L ≤ 6 =
216 sites, drawn as its L layers), the level-spacing ratio ⟨r⟩ over the middle third beside its
GOE 0.5307 and Poisson 0.3863 limits (limits, not bounds: a weakly disordered small cube reads
above GOE), the band-centre IPR × N, SEEDS (1–16) averaging, W to 30; the closed line names
W_c ≈ 16.5 J in 3-D and says "finite: 6³ sites". ANGULAR NODES exists since 0.6.3 (VORTEX).
