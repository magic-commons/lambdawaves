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

## Closed (Claude Yan, 2026-10-18 night → 10-19; every row merged on `yan-c`, NOT pushed)
| row | merge | the numbers (from `<ROW>-BUILD.md`) | for Josh |
|---|---|---|---|
| **M · THE MOLECULES CARD** | `39abd1f` | INSTALLED · MOLECULES ON on `.mol-top`; the steppers stacked; VIEW 3 + 3; the card 280 / 262 px before and after, 8 lines above the fold both ways | — |
| **B · A ↔ B AS AN AUTOMATION CLIP** | `43cc176` | `reg.omorph` (ORBITAL MORPH, 0..1, group `state`), a `modSeats` row, a PROJECT row in STATE-SCOPES; measured: a lane and a route ADD in the kit (not either-or) | the kit fact → a MIR issue |
| **I · THE INFORMATIONAL** | `6e1cd07` | eight kinds through `say(kind)`; the record `lambdawaves.q0.info` (createPrefs; the blob's six keys lifted once); the window built from `INFO_ROWS`; Josh 10-18: formula + atom labels ON, every kind OFF on a first run | the preset fade OFF by default (as asked) |
| **O · THE ORBITAL DIAL AS A STEPPED TARGET** | `d3d266a` | `chem.orbital` integer 1..768, re-registered per molecule; a step 40 ms median at 36–211 AO; STEP_MS 334 (≤ 3 steps/s, the photosensitivity law) | — |
| **L · THE LIBRARY PICTURES** | tools, no commit of data | `menu-thumbs --volume vol-1`: 2,811 of 2,815 (9.4 MB) into `dist/vol-1/t/`; the 4 that refused (K > 192) open since 008 V | the index names 28 pictures until `pack.mjs --incremental` |
| **C7 · MORE MOLECULES** | `b6c2f19` | Sos's `it006-more` tools only; no solver restart (the compute hold) | the data steps on Rent-A-GPU day |

The review round ran once over 007 + 008 together (`../iteration-008/REVIEW-QUALITY.md`, `REVIEW-ARCHITECTURE.md`); its deletion pass is 008's row F.
