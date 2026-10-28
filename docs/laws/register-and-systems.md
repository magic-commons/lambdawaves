# The register, the systems and their physics

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The standing paragraphs

THE PAINT GESTURE (`lab/paint-stroke.js`) is one law for the ORBITAL and STATES
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
