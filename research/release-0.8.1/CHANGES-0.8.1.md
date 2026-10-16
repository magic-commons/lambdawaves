# 0.8.1-alpha "Two Levels" — what changed (Claude Yan / Fable 5.1, 2026-10-16)

The engine plan's D.13. Plan `BUILD-PLAN.md` (Yan, drafted 10-16 01:50 while 0.7.4 built; base `c383e8e`, 29,707 lines, cap 30,004). Three Opus builders: T1
`t1-bloch` ∥ T3 `t3-presets` from `c383e8e`, T2 `t2-bell-mass` from T1's merge. Build notes: `T1-BUILD.md`, `T2-BUILD.md`, `T3-BUILD.md`. Josh 05:55 (after the
usage pause): "hello lets continue. sos hasn't done any work so we'll continue from here".

## The shape
THE FIRST NON-SPATIAL SYSTEM: one qubit in its own window, BLOCH, of the LADDER's kind — the Bloch vector on ORBIT's sphere painter, H = (ω₀/2)σ_z + (Ω/2)(cos φ σ_x
+ sin φ σ_y) stepped by the exact 2 × 2 unitary, the step proved by a halved re-solve; LARMOR · RABI · LANDAU–ZENER · FLOP. THE BELL PAIR as BLOCH's second mode:
S_A = ln 2 exactly for a Bell state, 0 for a product; the CHSH value as the prediction. MASS SCALING: μ/mₑ on SPECTRUM (positronium ½, muonic H 185.84),
rescaling as Z does; μ = 1 byte-identical. Three lattice presets: HOFSTADTER at one flux, the Hadamard QUANTUM WALK, the XX SPIN CHAIN by exact diagonalisation
with Jordan–Wigner as the oracle.

## T1 · BLOCH: SPIN-½ · RABI · LANDAU–ZENER
(filled at T1's merge)

## T3 · THE LATTICE PRESETS: HOFSTADTER · QUANTUM WALK · SPIN CHAIN
(filled at T3's merge)

## T2 · THE BELL PAIR + MASS SCALING
(filled at T2's merge)

## The light check (existing gates only) and the cut
(filled at the cut)

## Known, deferred (recorded)
The first RU record (the pass's profile first); Hofstadter's full butterfly as a record; spin chains past N = 8 and the XXZ/Heisenberg chain (Bethe ansatz the
oracle); a two-qubit gate set; decoherence on the Bloch sphere (T₁/T₂ — the Lindblad road).
