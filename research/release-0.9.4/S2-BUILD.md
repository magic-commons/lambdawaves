# S2 THE CUBE — build note (Opus builder, 2026-10-16)

Branch `s2-cube` from `f3e7440` (S1's merge on `yan-c`). Code commit `11e421c`; this note is the next commit (the tip is in the hand-back). `lab/` lines
30,202 → **30,209 (+7 of +40)**, the regenerated `lab/catalogue.js` and the `lab/sw.js` precache rows included. No new test file, no gate script, no worker op.

## Seats
- `lab/field.js:129–130` — the two lines inside S1's space-7 branch, after the oscillator's line (nothing else in the file moves; `git diff` is +2, no `-`):
  `if (M.c.w > 0.5) { let h = 0.5 * M.lag0.w; let sv = sin(qs + M.lag0.xyz * h); f = select(0.0, M.c.z * sv.x * sv.y * sv.z, all(abs(pos - M.ctr.xyz) < vec3<f32>(h))); }`
  with its one comment line. The cube's record puts kᵢ = nᵢπ/L in `lag0.xyz`, so S1's `qs = q ∘ lag0.xyz` is already kᵢqᵢ and sin(kᵢ(qᵢ + L/2)) =
  sin(qsᵢ + kᵢh); the oscillator's product above it runs on the same `qs` and is overwritten (finite: H₅ of ≤ 5π/2 times a Gaussian).
- `lab/separable.js`: the header l.6–7; `FORMS` l.9 gains `cube: ['CUBE', …]`; `CUBES` l.11 (nᵢ = 1…5, Σnᵢ² < 30: 54 triples); `sig` l.13 (a level's
  members share Σnᵢ for the oscillator, the sorted triple for the cube — else the level is "mixed"); `L = 12`, `NL` l.14 (56 or 54, the count of used slots,
  replacing every literal 56); `configure(f, w, l)` l.18 — the cube's E = π²Σnᵢ²/(2L²), LABELS from CUBES, `NL`; `save`/`load` l.26–27 carry `L` (absent
  still at ISOTROPIC 1, 1, 1 with L = 12); `tableFor` l.31–35 — norm (2/L)^{3/2}, `expo: 1` (→ `c.w`), `lag = [nᵢπ/L ×3, L, 0, 0]` (→ `lag0`); `psiAt` l.39 the sine
  twin (zero outside |xᵢ| < L/2); `domainFor` l.45 0.525 L; `levelName` l.46 "(1,1,2) ×3" from the group's first triple, a mixed level "Σn²27 ×4"; the entry's
  `label` and `unit` are getters l.48–49 (`hartree` under CUBE, so the meters give eV; `ħω` otherwise); the spectrum's colours by level index under CUBE and the
  footer computed l.52–53; the card l.55–68 — the L knob (4…30 a₀) shown only under CUBE, the ω knobs hidden there; the readout's unit and counts computed; the
  note gains the cube's sentence and its gas's stand-down ("Its own gas is deferred: SPECTRUM's GAS launches into the spherical well").
- `docs/STATE-SCOPES.md:70` the row reads `{ form, wx, wy, wz, L }`. `tools/catalogue-table.mjs:38` the row's note names the cube's energy; `lab/catalogue.js`
  regenerated (name unchanged, `docs/PROVENANCE.md` unchanged, both `--check` in step).

## The numbers (`.tmp/s2-check.mjs`, `.tmp/s2-shot.mjs` — throwaways, not committed)
- ∫|ψ|² for (1,2,3) at L = 12 by a 64³ midpoint sum of the twin over the box: **1.0000000000000218**; ψ(6.01, 0, 0) = 0 (outside).
- E(1,1,1) = **0.10280837917801415** hartree from `energy(0)`, 3π²/(2L²) = 0.10280837917801415; the window prints "E₀ = 0.1028 hartree · 15 levels of 54
  labels · lowest shell ×1 · 37 unused here".
- The first six levels and their degeneracies, from the groups: **(1,1,1) · (1,1,2) ×3 · (1,2,2) ×3 · (1,1,3) ×3 · (2,2,2) · (1,2,3) ×6** (sizes 1, 3, 3, 3, 1,
  6); all 15: … (2,2,3) ×3 · (1,1,4) ×3 · (1,3,3) ×3 · (1,2,4) ×6 · (2,3,3) ×3 · (2,2,4) ×3 · (1,3,4) ×6 · Σn²27 ×4 (the accidental (1,1,5) ⊕ (3,3,3)) · (2,3,4) ×6.
- The kernel against the twin, (1,2,3) slot 11 at ten voxels of the 64³ grid (`field.sampleVoxel`): max |kernel − twin| **1.31e-5** of a peak 0.0407 (f16). Page
  errors none.

## Gates
`./test.sh node` rc 0 (after `pwa --write`; a first run went red only on the precache row of `lab/catalogue.js`, regenerated after the first `--write`) ·
`rack-deps --classes --no-write` rc 0 · `new-project --check` in step (16117 B) · `catalogue-table --check` and `provenance --check` in step (187 rows) ·
`serialize-bytes` (9641/5741) DONE 11 readings · **THE LOCK** on 9641/5741, `--check --query gastab=0`: "DIGEST LOCK GREEN: 860 values compared · **0 readback
differences · 0 record-byte differences** · unrepeatable now: none · page errors 0".

Screenshot: `.tmp/s2-cube-123.png` (not committed) — the cube's (1,2,3) in arg ψ, the camera close (the box fills the stage): the lobes banded along z with the sign flipping across y; the SEPARABLE card on CUBE with
the L knob at 12.0 a₀; SPECTRUM's ladder lit at "(1,2,3) ×6", its footer "E = π²Σnᵢ²/(2L²) · 54 of 91"; the stage formula "n_x n_y n_z = 1 2 3".

## Corrections to the brief
1. **54 labels, not 56.** The 56 lowest triples by Σnᵢ² cut the Σnᵢ² = 30 level ((1,2,5), a sixfold) after two of its six members, so its line would read "×2".
   The cube fills the whole levels to Σnᵢ² = 29 (54 labels; 37 unused here) — the count is `NL`, computed, wherever S1 wrote 56.
2. The wave numbers ride `lag0.xyz` (kᵢ = nᵢπ/L), not a `nlm·π/L` in WGSL: S1's `qs` is then kᵢqᵢ and the sine line stays one line.
3. The two field.js lines are a comment and the `if`; the oscillator's line above stays byte-identical and is overwritten under the cube (no `else` wrap).
4. A level that mixes two permutation classes (Σn² = 27: (1,1,5) ×3 and (3,3,3)) is named by its Σn², not by one triple.
5. `serialize-bytes` needs a served tree (LW_PORT/GD_PORT); on the default port it fails to connect.
