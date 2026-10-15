# 0.6.1 "Factor Road" — THE BUILD PLAN (Claude Yan / Fable 5.1, 2026-10-15 11:40 CDT)

Josh, 2026-10-15 (verbatim): "Keep the builds tight and don't bloat the code with random verification/gate codes. Just build the features since we are
not even 1.0.0 release yet." and, at 10:50, "continue with the next builds once it's done." So 0.6.1 follows 0.6.0 by the same method: THE ENGINE PLAN's
D.2 row (`../release-0.6.0/PLAN.md`) and Round 1's T4′ · T5 · T6 · T10 (the vault's DRAFT-3), built straight, existing gates only. Base: `yan-c` tip after the
v0.6.0-alpha cut (`596868d`), 28,289 `lab/` lines; cap 28,289 × 1.01 = **28,571** (282 of headroom). E0 THE FIELD OWNER stays deferred: no row here needs it.

## The rows (two builders, Opus, own worktrees from `596868d`)
| row | what lands | files | Δ |
|---|---|---|---|
| **F1 THE FACTOR ROAD + FROZEN-CORE COLUMNS + BUCKY** (M4 · M6 · tap BUCKY) | C₆₀'s DENSITY: the record carries every occupied column (PySCF's, re-encoded, the frontier record's `cols` grown from 8 to the 180 occupied + the LUMO set; 300 × 183 f64 — a DOWNLOAD as today); a FACTOR kernel in `field.js` derived from the ORBITAL kernel's shell loop: ρ = 2 Σ_k (Σ_μ C_μk χ_μ)², K-blocked so the accumulators stay in registers (χ re-evaluated per block), texel (√ρ, 0) — the density convention, so the presenter is unchanged; `setMoleculeMatrix` kind `'factor'` (M = { C: Float32Array(n·K), K }), the matrix buffer sized for it; the session's product kind; MOLECULES offers DENSITY for a record with no D but every occupied column, and VALENCE through the same road (the valence columns only — exact, no approximation) with the readout "180 orbitals summed · 60 core frozen"; the STATUS word "exact · 180 orbitals summed"; `lab/demos/bucky.lambdawaves.json` + cover (C₆₀ density from its record) | tools/library/frontier.py (the occupied dump) · tools/orbital-library.mjs · lab/library.js (the frontier shape admits the grown `cols`) · lab/field.js · lab/molecular-session.js · lab/chemview.js · lab/demos/ · lab/project-store.js | +150 (stop at +190) |
| **F2 THE SYMMETRY CERTIFICATE** (M10) | ε_g(t) = max\|M(g)ᵀ S D S M(g) − S D S\| / max\|S D S\| over the operations of the molecule's declared group (names.js `operations`, its AO representation `aoRep`), once per landing of D (the still, or RUN's D(t) at ≤ 5 Hz, never per frame): the line "symmetry: D₆h (still) · Cs while the RING plays · nearly D₂h (ε = …) · broken by 0.005 after the z-kick" — kept < 10⁻⁹ · broken > 10⁻⁶ · "nearly" between — as one readout in MOLECULES' fold, and the kept group's name in THE HEAD's status line where it has one | lab/names.js (one export) · lab/chemview.js | +25 |

## The mathematics (Round 1 T5, T6, T10 — KNOWN/MEASURED)
ρ = 2 Σ_{k≤K} φ_k², φ_k = Σ_μ C_μk χ_μ: O(M·K) a voxel against the tile's M(M+1)/2 — an ENABLER past the 128-AO χ tile, slower where the tile fits (benzene 756 vs
666, lysine 2,560 vs 2,080), so the tile keeps every molecule it holds and the factor road serves only records past it (C₆₀: 300 AO × 180 = 54,000 MACs a voxel,
4.78·10¹⁰ at 96³ — the arithmetic alone is 4.7 ms at the RTX 3070's peak; AO evaluation and traffic on top; **no millisecond promised, the ms is measured**).
VALENCE = the columns k ≥ coreCount (names.js), exact. T10: the still RHF density of benzene keeps all 24 operations of D₆h to 10⁻¹⁴; the RING as played is Cs
({E, σ_h} at 3·10⁻¹⁴, every other operation broken by ≥ 0.065); a z-kick of κ = 0.01 breaks σ_h at ≈ κ/2; the zones kept < 10⁻⁹ · broken > 10⁻⁶ · nearly between.

## Gates (existing only) · the cut
Node gate 0 after every row; `pwa --write` after any `lab/` edit; `orbital-library --check` in step (the one re-solve is C₆₀'s record, from the dump); the one
owning browser suite once per row (`molecule-demos`, `library`); at the cut THE LOCK ×2 (benzene and lysine stay on the tile, so 0/0 by construction) and the
line law ≤ 28,571; then the local cut `v0.6.1-alpha` "Factor Road". NO push, NO deploy, NO gh release.
