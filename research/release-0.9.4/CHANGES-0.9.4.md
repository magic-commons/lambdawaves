# 0.9.4-alpha "Separable" — what changed (Claude Sos / Fable 5.1, 2026-10-16)

The last feature cut of Josh's 10-16 road (0.9.2 Flow · 0.9.3 Decohere · 0.9.4 Separable) before the iterative round to 1.0.0, under the dial "don't over verify and
bloat the code with tests. Just build to the best of your abilities and a light visual/functional check". Plan `BUILD-PLAN.md` (30,118 lines, cap 30,419). Two Opus
builders in sequence: S1 `s1-cartesian`, then S2 `s2-cube` from S1's merge. Build notes: `S1-BUILD.md`, `S2-BUILD.md`. No new test file. THE ONE `lab/field.js` EDIT
since 0.7.0 — THE LOCK ×2 at each merge is this cut's law.

## The shape
A SYSTEM THAT IS NOT CENTRAL: a new kernel branch, space 7 CARTESIAN, evaluates product states f_{n_x}(x) f_{n_y}(y) f_{n_z}(z) — Hermite products with a Gaussian
envelope for the anisotropic oscillator (ISOTROPIC · 2-D · ANISOTROPIC), sines inside a box for the cube — on the register's 91 slots: the 56 triples with N ≤ 5 (the
cube's 56 lowest by n²), the other 35 "unused here" by CENTRAL's BOUND precedent; closed-form energies; the levels grouped with their degeneracies; a SEPARABLE window of
CENTRAL's kind opened from the picker; the radial readers (the slap, CALCULUS's radial tiles, RADIATION) stand down with one sentence; momentum space forced to position.

## S1 · THE CARTESIAN KERNEL + THE OSCILLATORS (branch `s1-cartesian` tip `c3b8e9d`, merged `f3e7440`; `lab/field.js` +7, `lab/separable.js` 65 new, `hamiltonian.js`, `kick.js`, `calculusview.js`, `rack.js`, `spectrum.js`, `windows/readouts.js`, `windows/kepler.js`, `shell/persist.js`, `catalogue.js` + `docs/PROVENANCE.md` regenerated, `docs/STATE-SCOPES.md`; +84 lab lines → 30,202)
- **The kernel:** space 7 CARTESIAN — `herm(n, x)` by the three-term recurrence and f = c · ∏ᵢ herm(nᵢ, aᵢxᵢ) · exp(−½Σaᵢ²xᵢ²) in the mode loop: seven inserted
  lines, nothing removed; the packer untouched (the table sets `n, l, am = n_x, n_y, n_z` and `m = 0`, so the azimuthal phase line is exactly 1 and byte-identical;
  `expo` carries the form flag into `c.w`; the widths ride `lag0.xyz`; D is formed before the branches and never multiplied here). **The module** `separable.js`: the
  56 triples with N ≤ 5 re-sorted by energy when ω moves (a populated slot can change triple during a knob turn — said); FORMS ISOTROPIC (1, 1, 1) · 2-D (1, 1, 4) ·
  ANISOTROPIC (1, 1.5, 2.25 — 36 levels, the ratios are commensurate; the 2-D form's upper levels cut short by N ≤ 5); closed-form energies; the grouped levels with
  degeneracies; the CPU twin; `domainFor`; the entry (`kernelSpace` 7, `hydrogenTheorems: false`, `noMomentum`, `separable: true`, `radial = () => 0` because the idle
  kick-table warm-up calls `H.radial` unguarded); the card of CENTRAL's kind, the device beside CENTRAL's, `'separable'` in the picker, the catalogue row (its oracle
  names `qho.test.mjs` — the catalogue test wants an existing file and no new test was allowed). **Stand-downs:** the slap had no refusal road — its two callers print
  the refusal on IMPULSE's readout and `kick.js` throws as the backstop; CALCULUS's radial tiles say their sentence; RADIATION and WIGNER needed nothing (`hydroReader`
  already stands them down). PROJECT `instruments.separable` default-absent (serialize-bytes: the 11 edit hashes identical, each full record +83 B = the window's row).
- **Checked once:** ∫|ψ|² by a 64³ sum = 1 to 1e-13 (|1 0 2⟩ under ANISOTROPIC, |5 0 0⟩, |0 0 5⟩, ISOTROPIC |0 0 0⟩); ISOTROPIC |0 0 1⟩ against `qhoPsiAt`'s 2p₀ to
  1.4e-16 at 1000 points; the kernel's texels for |1 0 2⟩ (read back with `sampleVoxel`) against the twin to 1.15e-4 of a 0.345 peak — the f16 store's rounding.
  Screenshot `.tmp/s1-aniso-102.png` (the three nodal planes, the card, the stage formula "n_x n_y n_z = 1 0 2"). Node 0, rack-deps' hinge holds (spectrum 25/25,
  readouts 11, persist 24), new-project in step, catalogue/provenance `--check` in step, keyboard-window 8 PASS; THE LOCK on the builder's tree 860 0/0 and on 9241 at
  the merge 860 0/0 and 1004 0/0.

## S2 · THE CUBE (branch `s2-cube` tip `f97abe7`, merged `dca4427`; `lab/separable.js`, `lab/field.js` +2, `lab/catalogue.js` regenerated, `tools/catalogue-table.mjs`, `docs/STATE-SCOPES.md`; +7 lab lines → 30,209)
- **FORM CUBE:** a knob L 4…30 a₀ (default 12; the ω knobs hidden under CUBE), energies E = π²Σnᵢ²/(2L²) in hartree (the entry's `unit` is a getter), norm
  (2/L)^{3/2}, the record `c.w = 1` and `lag0 = (nᵢπ/L, L)`, `psiAt`'s sine twin zero outside the box, `domainFor` 0.525 L, level names from the computed groups —
  "(1,1,2) ×3", "(1,2,3) ×6", and "Σn²27 ×4" where (1,1,5) and (3,3,3) coincide; **whole levels are filled up to Σn² = 29 — 54 labels, 37 unused** (the brief's 56
  lowest would cut the Σn² = 30 sixfold level after two members and read "×2"; the count is computed); the saved record gains `L` (absent at the default); the card
  note says the cube's gas is deferred. **`field.js` +2 lines** inside S1's branch: the sine form behind `M.c.w > 0.5` on the kᵢqᵢ S1 already forms (the oscillator's
  line byte-identical; its value overwritten under the cube).
- **Checked once:** ∫|ψ|² for (1,2,3) by a 64³ sum = 1 + 2e-14; E(1,1,1) = 3π²/(2L²) = 0.102808 hartree, as the window prints "E₀ = 0.1028 hartree"; the first six
  levels (1,1,1) · (1,1,2) ×3 · (1,2,2) ×3 · (1,1,3) ×3 · (2,2,2) · (1,2,3) ×6, 15 levels in all; the kernel against the twin at ten voxels 1.31e-5 of a 0.0407 peak.
  Screenshot `.tmp/s2-cube-123.png` (the cube's (1,2,3), the CUBE card at L = 12, the spectrum's "(1,2,3) ×6" lit). Node 0, rack-deps 0, new-project in step,
  catalogue/provenance `--check` in step, serialize-bytes 11; THE LOCK on the builder's tree 860 0/0 and on 9241 at the merge 860 0/0 and 1004 0/0.

## The light check and the cut
On the merged tree `dca4427`: node 0, pwa in step, new-project in step, catalogue/provenance `--check` in step, `lab/` 30,209 of the 30,419 cap, `lab/field.js` nine
inserted lines in all and nothing removed; THE LOCK ×2 on 9241 at each merge (`--query gastab=0`; the second run with the s4a fixture): 860 0/0 and 1004 0/0 after
S1, 860 0/0 and 1004 0/0 after S2 — the shader branch leaves every recorded texel untouched; the visual check: S1's |1 0 2⟩ under ANISOTROPIC with its three nodal
planes and the SEPARABLE card, S2's cube (1,2,3) (the builders' screenshots, read by the integrator; S1 also ran `keyboard-window` 8 PASS for the + list). Then the
local cut `v0.9.4-alpha` "Separable", CHANGELOG, snapshot 42. Known, visible: SPECTRUM's grid keeps hydrogen's n l m labels under SEPARABLE — the pressed slot reads
as its triple in the stage formula and the window, not in the grid (deferred by name).

## Known, deferred (recorded)
Momentum space of the separable oscillator (self-dual per axis); a displaced oscillator (Stark on it); the 2-D box and a cylinder; the gas in the cube (the well's
packet road is spherical); the slap on a separable system; the Cartesian labels in the SPECTRUM grid's own geometry (the lanes are by level today).
