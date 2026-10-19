# Iteration 009 — THE NINE CALLS AND THE DEMOS (Josh, 2026-10-19 morning; planned by Claude Sos)

Josh: "Yes to all 9 and have the extra task of deleting the other demo projects leaving only Wave Dancer, rename Wave Dancer to 'WAVE DANCER PROTOTYPE' as the new demos I shall be making will be new and updated to the new systems of the app like the timeline and molecules and such. For n=7 let's remind ourselves of the ambitions of the other tasks of the app and try to impliment it there. Begin 009"

The nine calls are Yan's (`LAMBDAWAVES CLAUDE YAN FOR-JOSH 2026-10-19.md` § Your calls (new)); "yes to all 9" is yes to Sos's recommendation on each (the message of 09:3x):
1. MIX stays the word; a knob landing on a degenerate pair lights BOTH lines.
2. + 3. The equalizer's seventh band and THE SCALE at n = 7 — Josh widened these: carry n = 7 through the app where its ambitions (the physics rows) assume n ≤ 6, not the equalizer alone.
4. The demos at KNEE 3 → superseded by the demos task: only WAVE DANCER stays, renamed WAVE DANCER PROTOTYPE, re-saved at KNEE 3.
5. The flash guard's 20 % around 0.6: accepted, no work.
6. The packer's 1e-8 law stays; the six aromatics ship with five rungs. No work.
7. MacDonald–Vosko relativistic exchange: yes. Spin–orbit and the finite nucleus: later.
8. F's three leftovers: the fill glyph on SPECTRUM, the ladders on the plain level-line look, STATES lanes dimming under a restored MORPH.
9. The MIR kit items go to the kit's issue list (Sos, by hand): the n = 7 shell colour; the ORBITAL dial stepping one orbital per arrow key; the stepper reporting a re-pick; route and lane added together where Josh ruled either-or; SAVE AS ZIP by keyboard with a tile selected (MIR check, files B3).

## Rows (each an Opus builder in its own worktree, branch `it009-<row>` from BASE `762a434`; gate server per row; merged by Sos with Yan's recipe)
| row | name | what | port |
|---|---|---|---|
| D | THE PAIR | call 1: a degenerate pair lights both lines when the ORBITAL knob lands on it (R's bracket) | 9301 |
| N7 | n = 7 THROUGH THE APP | calls 2 + 3 as Josh widened them: THE SCALE's Sturmian block and the BOX packet to n = 7 (THE LOCK re-captured by name, as Q did), the equalizer's seventh band, and every other place the physics rows (iteration 005 P1–P4, qband, the kick) stop at 91 labels | 9311 |
| DEMOS | WAVE DANCER PROTOTYPE | the extra task: the ten other demos deleted, WAVE DANCER renamed WAVE DANCER PROTOTYPE and re-saved at KNEE 3, every road that lists the demos follows (FOLDERS' starters, the catalogue, the covers, the tools, the tests) | 9321 |
| MV | MACDONALD–VOSKO | call 7: relativistic exchange on the atom's model (Z-BUILD.md § Next), proved against NIST's light-atom 1s | 9331 |
| F2 | THE THREE LEFTOVERS | call 8 | 9341 |

## Merge recipe (Yan's, `~/.claude/jobs/2ea66c54/tmp/gate-it004.sh`)
`git merge --no-ff --no-commit it009-<row>` → `--ours lab/sw.js` if it conflicts → `node tests/pwa.test.mjs --write` → the gate (pwa · `./test.sh node` · rack-deps · new-project) → THE LOCK ×2 when `lab/field.js` or the fixtures move → commit with the row's sentences for CLAUDE.md.

## Closed
| row | merged | note |
|---|---|---|
| D THE PAIR | `51c407d` (branch tip `be702ee`) | one file, lab/orbitalsview.js; register 22/22, orbitals 24/24; chem L5 pre-existing; `molecular-names` :32 is a STALE row (expects the MO-REGISTRY card row U removed) |
