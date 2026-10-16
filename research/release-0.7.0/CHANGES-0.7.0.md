# 0.7.0-alpha "Vibrate" — what changed (Claude Sos / Fable 5.1, 2026-10-15; planned by Claude Yan the same evening)

Josh's word (19:05): "Yan has done a huge amount of work and planning. Continue where she left off." — and the standing dial (09:35): "Keep the builds tight and
don't bloat the code with random verification/gate codes. Just build the features since we are not even 1.0.0 release yet." Two Opus builders from Yan's base
`ca00472` (the two accessors `atomsNow`/`dipoleNow` on the MOLECULES card); merged V2 `31a8c5c`, then V1 `96219bf`. Build notes: `V1-BUILD.md`, `V2-BUILD.md`.
Plan: `BUILD-PLAN.md` (Yan). The ladder row: `../release-0.6.0/PLAN.md` l.37, D.7 l.263.

## The shape
A molecule's normal modes are a RECORD KIND, computed once by a `tools/` step and fetched on the first VIBRATE press like the heavy orbital records. PySCF's
analytic RHF Hessian at the record's own (unoptimised) geometry — translations and rotations projected out — is the oracle; OUR RHF's curvature along each
mode is the check. The picture is pure in Q(t): the nuclei move as R₀ + A·Q₀·cos(ωₖt)·Lₖ and the density is LINEAR + ONE McWEENY STEP in the MOVING AO basis,
D(Q) = McWeeny(D₀ + Q·D₁ₖ, S(Q)), built in the chem worker as a table of 32 phase samples once per (mode, amplitude) and uploaded by the frame thread with no
maths on it. The caption says what it is: "STO-3G RHF harmonic, as computed". The flash law holds as it holds for RATE: a breath that would show above 3 Hz
on screen is HELD at Q = 0 and the row says so; BREATHE sets RATE so one breath takes a second.

## V1 · THE MODES + PULSES (`lab/chemview.js`, `lab/mathworker.js`, `lab/library.js`, `lab/molecular-session.js`, `lab/molecules.js`, `lab/verbs.js`, `lab/md.js`, `lab/names.js`; `tools/library/vibrate-oracle.py`, `tools/vibrate-library.mjs`; nine records in `lab/library/` + `library.json` `vibrations`; `tests/vibrate.test.mjs`)
- **The oracle** (`vibrate-oracle.py`, PySCF 2.14, the vendored STO-3G decimals, cart=True): ν̃ₖ and the Cartesian mode vectors for H₂O, C₆H₆, N₂, CO₂, NH₃, CH₄,
  HF, H₂CO, C₂H₄ → `tests/fixtures/oracles/vibrate-v1.json`, masses and constants written in its provenance so both sides share every number.
- **The generator** (`vibrate-library.mjs`, node): for each mode OUR `moleculeRHF` at R₀ ± h·Lₖ → D₁ₖ = (D₊ − D₋)/2h (f32), the curvature ωₖ² = (E₊ + E₋ − 2E₀)/(μₖh²)
  against PySCF's — **all 72 modes within the 0.1 cm⁻¹ gate, worst 0.058 cm⁻¹ (N₂)** — Q₀ₖ = √(1/(μₖωₖ)), the irrep from `names.js`' projection (PySCF gives none),
  and THE CHECK at Q₀ / 2Q₀ / 4Q₀ **measured and written into each record, misses included**: the ρ relL2 on NACRE Round 2's 40³ grid (not the matrix — the
  gates were set on ρ) is 3.3·10⁻⁴ for water at Q₀ against the 2.5·10⁻⁴ gate — the McWeeny floor REVIEW-SONNET-2 already measured — 8 of 9 pass at Q₀; at 4Q₀ only
  N₂ passes (benzene 1.12·10⁻³ against 1.1·10⁻³); the trace gate |Tr(DS) − N| ≤ 10⁻² at ≤ 2Q₀ passes 7 of 9 (CO₂ 1.56·10⁻², NH₃ 1.60·10⁻²). LINEAR alone is
  recorded beside: one McWeeny step buys 1.5–5× at Q₀. Wall: benzene 147 s (151 SCFs + 90 ρ grids), every other molecule under 6 s; records 1.5–227 KB.
  Water's bend reads **2043 cm⁻¹** — the projected Hessian at the menu's geometry, which is not a stationary point (|g|max recorded per record); the plan's
  1595 was the experimental number.
- **The road**: `library.js` validates and decodes `kind: 'vibrate'`; `m.vibrate = row` on the catalogue; the worker op `chem.vib.frames { vib, k, amp, K }` →
  32 densities, dipoles and Q's on the CHEM road; the session's `pose(id, shells)` re-centres the field's shells while this card owns it.
- **The card**: VIBRATE is the first row of the fold — `VIBRATE` · `‹ MODE ›` (ν₂ 2043 cm⁻¹ · A₁) · `AMPLITUDE` 0…4 × Q₀ · `BREATHE` · the readout ("ν₂ 2043 cm⁻¹ · A₁
  at 1.0 Q₀ = 0.233 bohr · T 675 a.u. · … Hz on screen" / "not harmonic here" past 2 Q₀ / the hold sentence with the RATE that would breathe); a molecule without
  a record: the row disabled, "no modes recorded for this molecule". `update(t)` poses: one worker request in flight, newest wins, no maths on the frame thread;
  `atomsNow()` / `dipoleNow()` return the posed nuclei and μ(Q) while it plays (the SKELETON and the atom labels follow). PROJECT keys `presentation.vibrate`
  (`{ mode, amp }` while on) and `pulse` (when not NONE), default-absent — serialize-bytes 11 of 11 identical. The caption adds " · ν₂ 2043 cm⁻¹ · STO-3G RHF
  harmonic, as computed".
- **PULSES**: a `PULSE` seg beside KICK AXIS — NONE · STEP · RAMP · WAVE · GAUSSIAN — through `density.js` `fieldOf` on the RT run (the δ-kick skipped when a pulse
  is chosen; carrier = the first bright RPA root). The oracle (`pulse-oracle.mjs`, water, κ 10⁻⁴ along x): the pulse's δμ against linear response from the same
  engine's δ-kick — relL2 4.8·10⁻³ GAUSSIAN / 5.1·10⁻³ WAVE / 1.1·10⁻² STEP; Im α at the carrier agrees with the kick's to 0.12 % / 0.35 % / 1.1 %. No gate
  was set; these are the numbers. The pulse durations are fixed (tOff 40 a.u., α 0.05); the Im α plot under a pulse is still the kick's normalisation (said).
- **The verb**: `vibrate { on, mode?, amp? }` for Gemma ("make water breathe" → BREATHE) and the inventory line "vibrating ν₂ 2043 cm⁻¹ · A₁ at 1.0 Q₀".
- **`tests/vibrate.test.mjs`** (56 lines, 0.6 s): the nine records validate; water's curvature vs the fixture; `chem.vib.frames` reproduces the record's check
  block; benzene from its recorded block. Left out on the dial: a VIBRATE browser assertion (a throwaway probe showed water ν₂ at 2 Q₀ saving `{ mode: 1,
  amp: 2 }`, 32 poses a breath, BREATHE → RATE 675, benzene's frames in 113 ms); ESP while VIBRATE plays shows the equilibrium card (ESP along a mode is deferred).
- Gates on V1's tree: node gate 0; library.test green; rack-deps holds; new-project in step; chem.browser 0 failing of 56. **28,971 → 29,056 lines (+85 of the ≤ 100).**

## V2 · THE SKELETON (`lab/skeleton.js` 40 lines; one line each in `lab/index.html`, `lab/chemview.js`; `lab/rack.js`, `lab/lab.css`, `lab/shell/settings.js`, `lab/shell/stage-words.js`, `lab/windows/molecules.js`, `lab/shell/controller.js`)
- The molecule's nuclei as BEADS (a disc per nucleus in its CPK colour at 0.9, radius 0.28 × the covalent radius projected through the camera so it shrinks with
  distance, a 1 px rim in the kit's ink), BONDS (every pair within 1.3 × the sum of covalent radii — 1.2 would drop F₂, whose ratio is 1.24; the nearest non-bond in
  the library is 1.40 — recomputed only when the atoms' key changes; 2 px in the ink at 0.7) and THE DIPOLE ARROW (from the centre of nuclear charge along μ, 2 bohr
  per a.u., the accent colour, a 6 px head; nothing under 0.01 a.u. — benzene's 1e-13 draws no arrow). The far half is dimmed as ANGULAR NODES dims. Its own
  `#skeleton` canvas (z-index 7, under the atom labels at 9); the ink and accent read from the kit's `--fg`/`--acc` when the theme changes, never a hard-coded dark.
- SKELETON is a switch on the MOLECULES card after the VIEW row's chevron (the row was already full at 256 px; the switch shares the chevron's second line), a
  PREFERENCE `skeleton` OFF by default and saved only while on — nobody's settings blob changes unless they turn it on. One governed tick in the overlay pass
  (after the overlay-domain block, which is skipped while a molecule is on) with its READERS entry and a `perf.profile.skeleton` seat; keyed on atoms · dipole ·
  camera · half · canvas · theme, so a still frame paints nothing; off = one `clear()` and then nothing.
- The atom labels now place from `app.state.chem.atomsNow()` with the atoms' key in their placement key, so they follow the nuclei when VIBRATE poses them; with
  nothing posing, the placement is byte-identical.
- Measured: 0.31 ms a draw at benzene (66 pairs checked, 12 bonds found); headless screenshot `.tmp/v2-skeleton-benzene.png` in the builder's worktree. Left out
  by the builder and recorded: the skeleton in CAPTURE's overlay list (it would change every capture's report even when off) and the origin correction of an ion's
  dipole. Corrections to the brief: benzene has 12 atoms (36 is its AO count); `draw` takes no W, H (it reads its canvas); the tick cannot sit beside KEPLER's.
- Gates on the merge `31a8c5c`: node gate 0; new-project in step; rack-deps holds; settings-probe 6/6 green; THE LOCK 860 and 1004 both 0/0 (both with
  `--query gastab=0`). 28,922 → 28,971 lines (+49 of the ≤ 65).

## The merge · the cut
V2 merged first (its one shared line sits after the VIEW row's chevron; V1 owns the fold and the API tail) — `31a8c5c`; V1 — `96219bf`, `lab/sw.js` regenerated.
On the merged tree: node gate 0; new-project in step (16117 B); rack-deps holds; `tests/library.test.mjs` green; `tests/vibrate.test.mjs` PASS; serialize-bytes 11 of
11 (DONE); `tests/chem.browser-test.mjs` 0 failing of 56; settings-probe 6 of 6 (on the V2 tree); THE LOCK 860 and 1004 both 0/0 (both runs with `--query gastab=0` — without the query the 1004 run moves ×15 in `states.gas`, the gas table, not a regression). Lines **29,056** (cap 29,211; +134 of
the planned +165). Cut locally as `v0.7.0-alpha` "Vibrate" by `cut-0.7.0.sh`; nothing pushed, deployed or released.

## Known, not this cut's
- `node tools/orbital-library.mjs --check` is RED on the untouched base `ca00472` exactly as on the merged tree (V1 ran both: 37 orbital records regenerate
  to other bytes; the failure lists match line for line). A solver-stack drift since the records were written, after 0.6.1's green — not investigated in this cut (the records on disk still open bit-for-bit equal to a fresh solve by `tests/library.test.mjs`, so the app is unaffected; the generator's bytes moved — the next integrator reads the first red line of a `--check` run and diffs one small record).
- `tests/current.browser-test.mjs:138` (the audio card's track width) has failed since 0.5.4 (P-V N1).
- Deferred by name (the plan): open shells (0.7.1), the lattice (0.7.2), ESP along a mode, Raman/IR intensities (the dipole derivative is in the table), anharmonic
  corrections, a knob for the pulse's duration, the skeleton in CAPTURE's overlay list, the origin correction of an ion's dipole.
