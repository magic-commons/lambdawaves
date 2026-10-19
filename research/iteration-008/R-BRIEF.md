# R · THE ONE LADDER (iteration 008, branch `it008-ladder`, gate server 9671 / GD 5671; from F's merge)

Josh (2026-10-19, answering the review's C3 and the one-card question): "Register should be with molecules so if it shares the 'view'
section, then you have the option of choosing density, orbital, and 'registry' which I think needs a better name for whatever that window
is that I use a lot (the one with all the horizontal lines) … The horizontal lines thing should always be seen and flip to registry if
tampered with; if the knob for orbitals is tampered with, it switches back to orbitals to cycle through orbitals; it should show on the
register each orbital lighting up one of the horizontal lines to show it off … 'orbital' and 'registry' needs to be unified in this way."

Read first: CLAUDE.md's MOLECULES paragraph (THE ONE CARD as U left it: MOLECULES ON · ORBITAL | STATES on `.mol-top`, the ladder `.mol-reg`
under it, VIEW DENSITY · ORBITAL · REGISTRY / ESP · SPIN · Δ LDA−RHF), THE PAINT GESTURE, `U-BUILD.md`, `F-BUILD.md` (the deletion pass:
one ladder law in `lab/paint-stroke.js`, the register's ON as a real verb — build on what F left, never on U's shape), `lab/chemview.js`
(the VIEW seg ≈ :387–:413, `orbInput`, `setView`, `api.orbital`), `lab/registerview.js`, `lab/orbitalsview.js` (`paintLevels`),
`lab/statesview.js`, `lab/windows/molecules.js` (`stroked: () => C.setView('registry', true)`), `lab/spectrum.js` `levelLine()` or its
successor in F.

## Build
1. **The name.** VIEW's third option reads **MIX** (the register's superposition of orbitals on the field — DAW language, Josh's); the saved
   id `registry` stays for projects, `lw:view=registry`, the `view` verb and `LW.setView` (a label, not an id change); the hover title says
   what it is in one line. If Josh prefers another word it is one string.
2. **The ladder is always on the card** once a molecule is solved: in every VIEW, on both panes (ORBITAL | STATES), MOLECULES ON or not
   (OFF: the ladder of the last solve stays, dimmed as the kit dims an inert control). Nothing folds it.
3. **Two marks on one ladder.** The register's lit levels stay as F left them (the shell's vivid colour at 2 px when populated). The
   ORBITAL dial's orbital is the CURSOR: one line marked distinctly (the kit's ACCENT B or a short bracket at the line's end — pick what reads
   at 300 px and say why; no glow). In VIEW ORBITAL the cursor is prominent and the register's marks step back (dim, still visible); in VIEW
   MIX the reverse. A `chem.orbital` route or the dial by hand moves the cursor; the cursor is never a saved key (it IS `chem.orbital`).
4. **The hand decides the VIEW.** A stroke on the ladder → VIEW MIX (U's road, kept). A HAND turn of the ORBITAL dial (or its keys) → VIEW
   ORBITAL. A MODULATOR stepping `chem.orbital` moves the cursor and never changes the VIEW (O's law: ORBITAL always draws the dial's one
   orbital; a route is not a hand). An undo, a restore, a project or link open changes neither.
5. **The dial and the lines are the same set** — the dial indexes the molecule's MOs 1..nAO and the ladder's lines are those MOs' ε, so the
   cursor lands on a real line every time; a degenerate row lit whole as THE PAINT GESTURE does. Say so in the hover.
6. `chem.setView('registry')`, `view === 'registry'` and the facade stay; `tests/lw-facade` must show no pin change.

## Light check
Screenshots desktop and 300 px: VIEW ORBITAL with the cursor walking three lines; VIEW MIX after a stroke; the ladder on VIEW DENSITY. The
walk: a dial turn → VIEW ORBITAL and the cursor on that line; a stroke → MIX; a route on `chem.orbital` on MIX moves the cursor and the VIEW
holds; a project saved on `registry` reopens on MIX. `./test.sh node`, rack-deps (molecules ≤ 15 — F's number), `chem`, `register`,
`orbitals`, `history`, `lw-links`, `lw-facade`, `new-project`. Report: worktree · branch · commits · tests · blockers · next.
