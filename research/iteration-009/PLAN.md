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
| F2 THE THREE LEFTOVERS | `461674e` (branch tip `22b67e0`) | fill glyph one source; levelLine shared in paint-stroke.js (ORBITAL unlit 0.26→0.42, 1.5→1 px; lit 2.5→2 px); MORPH restore dims lanes; orbitalsview.js hunk resolved by hand (D's cursor + F2's line) |
| MV MACDONALD–VOSKO | `ac87ff0` (branch tip `1eab041`) | relativistic exchange on the ZORA road; light 1s shifts to ×0.60–0.97 of NIST's, totals to 0.1 %; Au 6s 8.65 eV (0.04 eV further — Josh's call to keep); THE LOCK untouched; pictures not re-rendered (one-pixel ring) |
| DEMOS WAVE DANCER PROTOTYPE | `5b19dfc` (branch tip `33d302b`) | ten demos gone, one starter renamed and at KNEE 3; persist.js rates fix; THE LOCK 843/0 + 987/0 |
| N7 n = 7 THROUGH THE APP | `43b46fd` (branch tip `25298c3`) | THE SCALE and the BOX packet at 140; LOCK sturmian/box re-captured by name; equalizer seven bands; qband n ≤ 7; kick 0.5494 k; left with reasons: the direct packet, the factor current, the continuity record, the mobility edge, SEPARABLE. Found, not fixed: under a propagator the field draws only the labels populated at the anchor (30 % of the sturmian LOCK state at t = 3.7; predates N7, its own row + LOCK move); the λ knob's floor 0.25 cannot reach 1/7 |

**Iteration 009 closed (Claude Sos, 2026-10-19 ≈ 11:00): every row merged on `yan-c`, NOT pushed; call 9 in docs/FOR-MIR.md; calls 5 and 6 accepted without work.** Open for Josh: keep MacDonald–Vosko with Au 6s at 8.65 eV (0.04 eV further than ZORA alone) — merged on the physics, revertible in one commit; the propagator's anchor-only draw (N7's find) as a row; the λ knob floor; the wider catalogue's swap (C7-BUILD.md §2) and the solvers' night shift.
