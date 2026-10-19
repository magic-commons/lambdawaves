# Iteration 007 — THE REWORK (Josh's prompt `JOSH-PROMPT.md`; Sos's scan `architecture/`; built by Claude Yan from 2026-10-18 21:30)

Base: `yan-c` after the Picker's atom pictures (10-18 evening). No push, no deploy, no store submission. Never edit `lab/mir/**` or
`lab/fonts/**`. Josh's dial stands: build the features, no new test files or gate scripts, existing gates, one light check per row with a
screenshot in the build note. Every builder reads `architecture/briefs/SHARED-CONTEXT.md` first (Sos's verified kit facts and laws), then
its ADR, then its brief.

## Josh's rulings (2026-10-18, verbatim where quoted)
| question (JOSH-PROMPT.md) | ruling |
|---|---|
| A ↔ B on the timeline: clip, lane or both | "the A and B thing is an automation clip, not an impulse/env/trigger/pattern clip" — an automation lane on the knob; route and lane are EITHER-OR on a target (his earlier ruling: "clips will have an error and always choose the top-most one") |
| the ORBITAL dial under modulation | "Orbitals should be steps and I think it could handle it at lower frequencies" — integer steps, a step-rate cap |
| INFORMATIONAL's first-run defaults | "default to formula and atoms on. Everything else off" |
| the two pickers | his words were "on top of each other" — stacked, one directly above the other; not merged |

## Rows
| row | branch · port | items | from |
|---|---|---|---|
| **M · THE MOLECULES CARD** | `it007-card` · 9601 | 1–4: INSTALLED and MOLECULES ON at the top; the two steppers stacked; BASIS → VIEW → METHOD; VIEW re-laid | base |
| **B · A ↔ B AS AN AUTOMATION CLIP** | `it007-morph` · 9611 | 6: the ORBITAL register's morph gets its own target id, modulatable and a TIMELINE lane (ADR-0002) | base |
| **I · THE INFORMATIONAL** | `it007-informational` · 9621 | 8–10: kinds and lines, a preference family of its own, the window rebuilt from option rows (ADR-0003) | base |
| **O · THE ORBITAL DIAL AS A STEPPED TARGET** | `it007-orbital` · 9631 | 5: `chem.orbital`, integer map, hot re-registration per molecule, a step-rate cap (ADR-0001) | M's merge |
| **L · THE LIBRARY PICTURES** | the integrator, tools | 7: `menu-thumbs --volume` over every volume on the shelf | after the rows |
| **C7 · MORE MOLECULES** | the integrator | Sos's tools-only branch `it006-more` (checkpoint `0d89821`; its agent is gone) — merged tools-only, NO solver restart (Josh 10-18: "hold off on the compute … save the rest for Rent-A-GPU day") | after the rows |

Order: M ∥ B ∥ I → O (from M's merge, the dial's seat moves in M) → L, C7. Each merge: `node tests/pwa.test.mjs --write`, `./test.sh node` 0
(wigner W42-8 is a 150 ms timing row that flakes under the three solvers' load; re-run alone), rack-deps 0 (the hinge: molecules 16 → ≤ 25,
stage-words 5, modulation 11), new-project in step; the browser rows each brief names. One review round after the four merges (Josh's
two skills, `skills/`), not per row.

## Not in this iteration (recorded)
The MIR check's polish for Josh's call (`mir-check/FIXES.md`); the 3-codon project (`codon/VERDICT.md`); a cross-fade between orbitals.
