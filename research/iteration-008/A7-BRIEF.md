# A7 · n = 7 (iteration 008, NOT launched tonight — a sketch for the next hand; after A's merge)

Josh (JOSH-PROMPT.md): "The level 7 orbitals seems like a fun attack to work on for spectrum, clicking on the colored 'n=' number to the
left of 91 orbital picker should be able to hide section of all 1, 2, 3, all the way to 7 orbitals since 7 is most likely going to take up
a large portion of the window size."

## What it is
The hydrogen register is 91 labels, n ≤ 6 (`lab/hydrogen.js`: "the bound states of hydrogen in closed form, n ≤ 6"; `BASIS`, ids
`h:n:l:m`, `Float64Array(91)` coefficient arrays everywhere the register is read). n = 7 adds 49 labels → 140. Everything that sizes by
the register follows: the register and its undo rows, the gas table (K7), the Wigner map, the ladder's rows in SPECTRUM, the ATOM system's
label index (the same basis), the LOCK's fixtures (860 / 1004 values — APPENDING the 49 after the 91 keeps every old index, so the old
digests should hold; prove it), the 8 amp / ph targets (fine), `lambdawaves.q0.keys`? (no), `tests/fixtures/legacy-*` (open and compare).

## The UI Josh drew
SPECTRUM's state grid: the coloured `n =` number at the left of each shell's block is a press — it folds that shell's rows (1 … 7) with the
kit's fold motion (`lab/fold.js` `.lw-fold`'s look, one chevron-less line); the folded shells remembered in WORKSPACE (the window
arrangement scope, never a project); n = 7 ships folded on a first run; a populated state inside a folded shell shows as a count on the
`n =` line so nothing is hidden. The paint gesture crosses only unfolded rows.

## The atoms
With A's atoms to Rn done, Fr–Og (Z 87–118) become buildable: the 7s and 7p shells (5f and 6d are n ≤ 6 already). Relativity is no longer
a caveat but the physics (Og's 7p₃/₂ is a relativistic story): say so in STATUS and keep the non-relativistic numbers honest.

## Order
Only after A merges; THE LOCK ×2; `tests/wigner.test.mjs` (its 150 ms row W42-8 is already tight) and the gas-table timing rows re-measured
with 140 labels; the memory for the gas table grows by (140/91)² — measure before deciding whether n = 7 joins the gas table or stays
outside it.
