# M · THE MOLECULES CARD (iteration 007, branch `it007-card`, gate server 9601 / GD 5601)

Josh (JOSH-PROMPT.md, 10-18): "The molecules window has too many controls to find anything." What he uses: picking molecules, BASIS,
DENSITY/ORBITAL. His four asks, items 1–4, nothing else moves. Screenshots of the card as it is: `molecules-as-is-2026-10-18.png`,
`molecules-unfolded-2026-10-18.png` (61 controls, 1,254 px unfolded).

## The four moves (`lab/chemview.js`, `lab/windows/molecules.js`, the `mol-*` rules in `lab/lab.css` / `lab/skin.css`)
1. **INSTALLED and MOLECULES ON move to the TOP of the card** — the first row, above the section stepper (today they sit between the
   section stepper and the molecule stepper). INSTALLED keeps its rule: shown only for a section with records, its lamp and press unchanged.
2. **The two steppers sit directly one above the other**: ‹ ORGANIC › (the section, the library's page turner) then ‹ C₆H₆ · 36 AO › (the
   molecule; its name IS the `<select>`, optgroups, disabled reasons and native keys kept). Stacked, not merged — Josh's words were "on top
   of each other".
3. **The sections below run BASIS → VIEW → METHOD** (today BASIS → METHOD → VIEW). The BASIS seg stays the ladder (a volume molecule's six
   rungs); VALENCE keeps the dial's seat under DENSITY (0.4.0 S4c); the `.mol-more` fold (KICK / RUN / TDA / the spectra) keeps its
   WORKSPACE record `more` and its phone/desktop rule.
4. **VIEW is re-laid so it is not top-heavy**: today DENSITY · ORBITAL · Δρ · ESP · SPIN on one row and Δ LDA−RHF alone below. Two balanced
   rows (your call how to split six into 3 + 3, e.g. DENSITY · ORBITAL · Δρ / ESP · SPIN · Δ LDA−RHF), the ORBITAL dial and its seat kept
   where VIEW ORBITAL expects them. Do not touch the dial's registration or `span()` (row O does that after you).

## Laws
Saved ids stable (`chem`, `chem.*`, the `mol-*` CSS hooks, the WORKSPACE keys); the five-line rule at 300 px and at phone width (0.5.3 M8)
still holds for the header; the CONTINUITY tile beside REPAIR and GATED (iteration 005 P2) stays in MOLECULES mode; `tools/rack-deps.mjs
--classes` hinge: windows/molecules.js 16 → ≤ 25. No new test files. Never `lab/mir/**`.

## Light check
On your gate server: the card at a desktop width and at 300 px — a screenshot of each in `M-BUILD.md`; MOLECULES ON from the new top row,
a section turn, a molecule pick, BASIS rung change, VIEW ORBITAL with the dial; `./test.sh node` 0; `node tools/rack-deps.mjs --classes
--no-write`; the `molecule-head` and `stage-text` browser tests (they read the hand road). Report: worktree · branch · commits · tests ·
blockers · next.
