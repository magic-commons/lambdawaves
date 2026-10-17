# Iteration 005 · P1 — THE DIRECT PACKET (brief)

Branch `it005-packet` from the BASE in the launch message (A THE ROOM merged). Gate server `LW_PORT=9611 GD_PORT=5711`. No push. Never edit
`lab/mir/**` or `lab/fonts/**`. Josh's dial: the feature, no new test files, existing gates, one light check; the one-time oracle numbers go
in the build note. Source: Sol-6's `~/Documents/OBSIDIAN/LAMB of WAVES/for CODEX/PRACTICAL UPGRADE SYNTHESIS — 2026-10-11.md` §1 (read it —
read-only; it is the physics brief in Sol's words). Read first in the tree: `lab/molecular-flow.js` (91 lines, whole: `createFlow` — `at()`
contracts Re D and Im D (n × n) against the AO values and gradients from `molecular-field.js`' `evaluator`; `set(re, im)`; the REPAIR road
`pump`; the floor 1e-7), `lab/orbitalsview.js` lines ≈ 119–140 (`setFlow`, `feedFlow`: the packet's complex AO vector (re, im) expanded into
Re D = r rᵀ + m mᵀ and Im D = r mᵀ − m rᵀ, n² a frame) and ≈ 282–306 (the AO vector at t), `lab/chemview.js` ≈ 715–750 (the kicked molecule's
FLOW: Im D NEGATED on the way in — the transpose seam; `setFlow`, `flowSource()`), `lab/molecular-field.js` (`evaluator(shells)` → `aoGrad(P, v,
gx, gy, gz)`), `tests/molecular-flow.test.mjs` (the existing sign-sensitive laws — they must stay green unchanged).

## The rows
1. **A packet source for the flow.** `createFlow` gains `setPacket(re, im)` beside `set(re, im)`: with a packet set, `at()` computes
   ψ = Σ_μ (re_μ + i im_μ) χ_μ and ∇ψ from ONE pass over the AO values and gradients (O(n)), then ρ = |ψ|², j = Im(ψ̄ ∇ψ) — the same `out` record,
   the same `velocity`, `step`, `weight`, `speed`, the same REPAIR hook (the repair reads ρ, not D). `set()` clears the packet and `setPacket()`
   clears the matrices; `ready` is either. The convention is the file's: j = Im ψ̄∇ψ = ρ ∇arg ψ for one orbital — the header already says so.
2. **The register feeds the packet.** `orbitalsview.js` `feedFlow` hands the AO vector (its f64 `re64`/`im64`, not the f32 copies) to
   `setPacket` and no longer fills `flowRe`/`flowIm` (delete the two n² arrays and the n² loop). The TDHF/FLOW transpose seam: the register's
   packet is ψ itself, so there is no D to transpose — say so in one comment where chemview's negation lives, so the two roads are read together.
   `chemview.js`' kicked-molecule FLOW is UNCHANGED in this row (P2 brings the factor form for the Slater state).
3. **The payoff.** FLOW for a packet of any size: wherever the register refuses FLOW past a cap (grep `nAO` / `64` / `MAX_MOL_AO` in
   orbitalsview.js and the kit of its FLOW switch), the packet road lifts the refusal — a volume molecule's HOMO + LUMO packet (aspirin at 6-31+G*,
   263 AOs, from the PICKER's LIBRARY with the dev link `ln -s ~/Documents/LAMBDAWAVES-VOLUMES/dist lab/volumes`) flows. If something else
   refuses (the picture's own cap is the SHADER's, 64 AOs for the complex orbital-vector path — that is NOT this row's: the tracers are CPU lines
   over f64), say what and leave it.
4. **The oracle, once (in the note, not a test file):** on three declared packets (a real orbital: j = 0 everywhere sampled; a winding pair of
   degenerate orbitals a quarter turn apart (benzene's `WINDING`): j reverses under conjugation of the coefficients; a global phase e^{iα} on every
   coefficient: ρ and j unchanged to 1e-14) and on 200 random points inside ±6 a₀, the direct road against the dense road (the old `feedFlow`
   kept in a scratch script in your tmp, never committed): max |Δρ|, max |Δj| ≤ 1e-12 relative to the maxima. Record the per-point cost of each
   road at n = 36 (benzene STO-3G) and n = 263 (aspirin 6-31+G*) — `performance.now()` over 10⁴ points — as the measured, not the claimed, saving.

## Checks, then the note
`node tests/pwa.test.mjs --write` · `./test.sh node` 0 (`tests/molecular-flow.test.mjs` untouched and green) · `node tools/rack-deps.mjs
--classes --no-write` 0 · `node tools/new-project.mjs --check` · one browser pass on your gate server: MOLECULES › benzene › MO-REGISTRY › WINDING
› FLOW on (tracers ride the ring, as before); aspirin from VOL. I at 6-31+G* › HOMO + LUMO › FLOW on (tracers flow; the frame rate said in METERS).
One screenshot ≤ 300 KB. Lab count before and after (`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`); this row should be
NEGATIVE or near zero in lines.

Write `research/iteration-005/P1-BUILD.md` (the seats, the oracle table, the two costs, what the brief got wrong, the light check's lines, the
delta), commit on `it005-packet` with a `Co-Authored-By:` line for your model, report the tip sha — never push. The RTX and the CPU are shared
(a niced PySCF solver runs; another builder may use the card); one browser suite at a time; stop only your own pids.
