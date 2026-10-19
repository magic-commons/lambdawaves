# U · THE ONE CARD — MOLECULES ∪ MO-REGISTRY (iteration 008, branch `it008-one`, gate server 9601 / GD 5601)

Josh (JOSH-PROMPT.md): "We're going to MERGE Molecules with MO-registry. First Molecules On and Registry On will be the same function
because that was annoying trying to find the other. … the registry horizontal line picker thing (My primary way of adding different
M-orbitals) seems to need to be on to override the orbital selector from the molecule's window, make it so that 'view' in the molecules
window shifts into registry mode (replacing delta p? because I think that's redundant?). Let the horizontal lines be located underneath
the on switch and put the orbital and states toggle on the same row as the 'on' switch. … For the 'empty the register' button, can it
become the 'fill all registers' button? … I don't know what 'Norm' does … the horizontal lines thing on spectrum and mo-registry
shouldn't be 'glows' when activated, instead, make it simple lines that's dark when off and full vivid color when on."

Read first: CLAUDE.md's MOLECULES paragraph (the TWO MODES, the 0.2.0 IDs `chem` / `orbitals`, `chem.*` / `reg.*` targets and the
`mol-*` / `reg-*` CSS hooks are STABLE), `../iteration-007/{M,B,O,I}-BUILD.md` (the card as it stands tonight: `.mol-top`, `rM`,
`reg.omorph`, `chem.orbital` and its re-registration, the kinds), `lab/chemview.js`, `lab/windows/molecules.js`, `lab/registerview.js`
(ORBITAL | STATES, REGISTRY ON), `lab/orbitalsview.js` (the ladder, `nrmBtn` NORM at :67 — ":232 NORM is an explicit act … nothing here
renormalises on its own", the ⌫, the presets ⚙, CORE), `lab/statesview.js`, `lab/paint-stroke.js` (THE PAINT GESTURE), the screenshot
`rack-2026-10-18.png`.

## Build
1. **One card.** MO-REGISTRY's body moves INTO the MOLECULES card (`chem`); the `orbitals` rack seat retires the way DYNAMICS did
   (`RETIRED_WINDOWS` maps a saved `orbitals` seat to `chem`; the WORKSPACE translator keeps older layouts loading; `tests/project-formats`,
   `history`, `new-project` stay green and `tools/new-project.mjs --check` in step). The hidden-in-ATOMS-mode rule now covers the one card.
2. **One switch.** MOLECULES ON IS REGISTRY ON (one state, one lamp, one undo row; `__LW.chem.setOn` and whatever the registry's `on`
   verb is both reach it; a project that saved them apart opens with the register on when either was). The top row: ON · ORBITAL | STATES
   (the pane seg beside the switch); INSTALLED leaves this row (row V brings the new road — until then a record-only molecule's stepper
   name shows the kit's download glyph and a press fetches it, the DOWNLOAD state that exists).
3. **The ladder under the ON row** — the ORBITAL or STATES pane's horizontal lines directly beneath, then ‹ SECTION › ‹ MOLECULE ›, BASIS,
   VIEW, METHOD and the fold as M left them. The ladder's lines: PLAIN — dark when off, the full vivid colour when on, no glow, no halo
   (find what paints the glow — canvas or CSS — and remove it; the same look row A gives SPECTRUM's grid, so write the rule once if the two
   share a painter).
4. **VIEW REGISTRY.** The register no longer "overrides" the ORBITAL dial silently: VIEW gains REGISTRY in Δρ's seat (DENSITY · ORBITAL ·
   REGISTRY / ESP · SPIN · Δ LDA−RHF) — the register's packet is what the field draws in that view; ORBITAL draws the dial's one orbital
   whatever the ladder holds; a stroke on the ladder while VIEW is not REGISTRY switches VIEW to REGISTRY (a hand picked it). Δρ leaves the
   seg and becomes a Δ switch beside KICK in the fold (the same `diff` observable; a project saved on `diff` opens with the switch on).
5. **EMPTY ↔ FILL ALL.** The ⌫ becomes ONE two-state button: an empty pane shows FILL ALL (every orbital of the pane on, equal and in
   phase — the OCCUPIED/virtual split is the ladder's own order), a non-empty pane shows EMPTY; one undo row each; an icon per state from
   Gemini (`agy`), recorded in the build note.
6. **NORM goes.** A HAND stroke (THE PAINT GESTURE's one undo row) normalises the register at its end; a modulator's write (`reg.amp*`,
   `reg.omorph`, `chem.orbital`) never triggers it. Say in the build note what the WINDING / FRONTIER presets do (they set unit norm already?).
7. The rest of MO-REGISTRY's head (the presets ⚙, CORE, ›) finds a seat in the ladder's foot or the fold; nothing is lost; `Aa` stays.
8. The hinge: windows/molecules.js 16 → ≤ 25 (merging two cards into one module may push it — plan the registration so it holds, or say
   the number). The facade: `__LW.orbitals` / `__LW.chem` keep their names; if the pin changes, re-capture `lw-facade.json` with `--write`
   and say the diff.

## Light check
Desktop and 300 px screenshots of the one card (ORBITAL pane and STATES pane); the walk: ON from the top row → the ladder filled by a
stroke → VIEW reads REGISTRY → ORBITAL pressed draws the dial's orbital → FILL ALL / EMPTY → a project saved and reopened; an old project
with an `orbitals` seat opens. `./test.sh node`, rack-deps, `tests/register.browser-test.mjs` (R12's stale label is known), `chem`, `orbitals`
(L9 is a load row), `history`, `new-project`. Report: worktree · branch · commits · tests · blockers · next.
