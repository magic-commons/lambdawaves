# A7 · n = 7 (iteration 008, branch `it008-n7`, gate server 9681 / GD 5681; from F's merge)

Josh (JOSH-PROMPT.md): "The level 7 orbitals seems like a fun attack to work on for spectrum, clicking on the colored 'n=' number to the
left of 91 orbital picker should be able to hide section of all 1, 2, 3, all the way to 7 orbitals since 7 is most likely going to take up
a large portion of the window size." Josh 10-19: "Yes let's build n=7 and the extra function to hide the orbital buttons (this doesn't
change the UI, instead, it makes the 'n=1, n=2...' text clickable to essentially hide a n= level."

Read first: CLAUDE.md (THE CONTEXT, THE LOCK paragraph — 843 + 987 values; THE PICKER paragraph; the scopes paragraph — folded shells are
WORKSPACE), `lab/hydrogen.js` ("the bound states of hydrogen in closed form, n ≤ 6"; `BASIS`, ids `h:n:l:m`, `Float64Array(91)` — 24 sites
across lab/ size by 91: `grep -rn "91" lab --include=*.js | grep -v mir`), `lab/atoms.js` (`groundConfig`, `ZMAX = 86`, the radial Xα solver),
`lab/valence.js`, `lab/windows/spectrum.js` and `lab/spectrum.js` (the state grid and its `n =` numbers; the ladder painter; F's one ladder
law), `lab/fold.js`, `lab/gas-table*.js` or wherever the gas table (K7) sizes by the register, `lab/wigner*.js`, `A-BUILD.md`
(the Z ≤ 36 bit-identical method: the before/after snapshot of every E, ε, u hash), `tests/fixtures/legacy-*`.

## Build
1. **The basis to n = 7.** 91 → 140 labels, the 49 new states APPENDED after the 91 so every old index, id and saved coefficient array keeps
   its place (a saved 91-array pads with zeros; a 140-array saved by this build opens in an older tree by truncation — say so in the
   note). Everything that sizes by the register follows: the register and its undo rows, THE GAS TABLE (its memory grows (140/91)² ≈ 2.4× —
   measure; if it cannot carry n = 7 at the shipped budget, the gas table stays at n ≤ 6 and says so, n = 7 outside it), the Wigner map,
   the 8 amp / ph targets, the ATOM system's label index (the same basis), the Picker's `orb-<nl>_<m>` pictures (render the n = 7 ones
   with `tools/menu-thumbs.mjs`: 7s 7p 7d 7f 7g 7h 7i — only those `valenceOf` can name), `stateLatex`, the legacy fixtures (open and compare).
2. **THE LOCK ×2 must hold without a re-capture**: 843 / 0 and 987 / 0 — the fixtures hold no n = 7 state and every old index is kept. If a
   row moves, the append is wrong; find out why before touching a fixture.
3. **The `n =` press.** In SPECTRUM's state grid the coloured `n =` number at the left of each shell's block is a press that folds that
   shell's rows with the kit's fold motion (`lab/fold.js`'s look, no chevron — the number IS the handle; its hover says "fold n = 7"); the
   folded shells are WORKSPACE (the window arrangement, never a project, never a link); n = 7 ships folded on a first run and for a profile
   older than this build, n ≤ 6 open; a populated state inside a folded shell shows as a count on its `n =` line so nothing is hidden; THE
   PAINT GESTURE crosses only unfolded rows; the ladder (levels) is untouched by a fold. Nothing else in the UI changes.
4. **Fr–Og, if contained.** With n = 7 the 7s and 7p shells exist and A's radial solver already runs at Z = 86: if extending `groundConfig`
   and `ZMAX` to 118 (the actinide and 6d/7p exceptions — Ac Th Pa U Np Cm, Lr's 7p¹) converges every element below 1e-8 with every
   orbital bound and normalised, the right node counts, totals monotone — do it: the ATOMS window's cells 87–118 live, the Picker's 32 tiles
   live (their `el-<sym>` pictures through `menu-thumbs --set elements`), `valenceOf` agreeing 1–118 as it does today, STATUS past Rn saying
   "non-relativistic Xα: the 7s/7p levels are a relativistic story (Og's 7p₃/₂)" with the NIST gap where A's header method applies, and
   Z ≤ 86 BIT-IDENTICAL by A's snapshot method (0 differences). If any element refuses, stop at the last good Z and say which and why.
5. `tests/wigner.test.mjs` W42-8 (the 150 ms row) and the gas-table timing rows re-measured at 140 labels — on this loaded machine, alone.

## Light check
Screenshots: the grid with n = 7 folded and open at desktop and 300 px; a populated 7s folded showing its count; the Picker's Fr tile if
item 4 landed. The walk: fold n = 7, paint a 6-row, unfold, paint 7p, save a project, reopen (the fold held in WORKSPACE, the state in
PROJECT); an older project (91 coefficients) opens unchanged. `./test.sh node`, THE LOCK ×2 (no re-capture), `history`, `new-project`,
`project-formats`, `legacy` fixtures, `lw-facade` (no pin change), rack-deps (spectrum exactly 25 — route anything new through the
controller's api into lab/spectrum.js as S did). Report: worktree · branch · commits · tests · blockers · next.
