# Claude Yan human pass — 24 October 2026

Draft 08 of the two λWAVES papers: an exposition pass by Fable 5.1 (Claude Yan) on Draft 07 of 18 October (`DRAFTS/CLAUDE COLLECTION REVIEW — 2026-10-12/`). Josh, away from the app, asked for the mathematics to be made more intuitive and the papers to sound more human, with the October 2026 argument about AI-written mathematics as the hint for what a reader is owed. The craft rules adopted, and the plan for the papers that should follow, are in `../../CLAUDE YAN — THE NEXT PAPERS — 2026-10-24.md`.

## What changed, and what did not

Prose only. `tools/numbers_check.py OLD NEW` proves that every number of three or more digits or with a decimal, every display equation (whitespace-insensitive) and every reference line of Draft 07 is present in Draft 08:

| Paper | numbers kept | display equations kept | reference lines kept |
|---|---|---|---|
| 01 A Playable Quantum Field | 145 / 145 | 15 / 15 | 13 / 13 |
| 02 From Molecular Orbitals to Electronic Current | 200 / 200 | 12 / 12 | 16 / 16 |

Tables, figure captions, propositions and proofs, and the status tables are verbatim. Three background references were added to each paper and are marked "(Added in Draft 08; to be confirmed)": Paper 1 gains Thaller 2000 (hue as phase), Dirac 1931 and Hirschfelder 1974 (quantised vortices); Paper 2 gains Lazzeretti 2000 (charge-current conservation in finite bases, CTOCD), Barth–Manz 2006 (laser-driven ring currents) and Bialynicki-Birula 2000 (motion of vortex lines). The bylines are unchanged ("by SOL-6.1 and Sonnet 5.5"); the series line and the Credits name the pass. Whether Fable joins the byline is Josh's call.

What the pass does, section by section:

- The abstract and introduction now say in plain words what the paper is for and which parts are textbook, which are the instrument's design and which are measured, before the status table does.
- Every section opens with the picture to hold in mind: a row of clock hands (the coefficients), a movie and its reverse (the conjugated pair), a hue gradient as a flow and a hue cycle as a quantised vortex, a Gaussian basis as a non-orthogonal ruler, the real part as *where* and the imaginary part as *which way*, the transposed matrix as time run backwards, a finite basis that teleports probability, exchange that leaks per orbital and cancels over the occupied set.
- The reader is asked to make the scene in the instrument (the HYDROGEN lanes; MOLECULES on water with the HOMO + LUMO preset).
- Proposition 1 is preceded by its arithmetic in words (hands at integer speeds; the dial turns rigidly by a fraction each density period). Proposition 2's third clause is explained as a grid-free meter of the continuity defect. The exchange cancellation is explained before it is written.
- The half-precision forensics open with their one-sentence result and keep every number; the grid section opens with the fact that an even cell-centred grid never samples the nucleus, and says that a finer grid draws a dimmer picture.
- $q=-1.32$ is said in words: the packet's net current runs against the motion of its own centre. It is the hook of the proposed next paper.

## Files

- `01-PLAYABLE-QUANTUM-FIELD/MANUSCRIPT.md`, `02-MOLECULAR-CURRENT/MANUSCRIPT.md` — the canonical Markdown.
- `output/pdf/*.pdf` — compiled with the review's exporter (`tools/build_edition.py`, adapted: EDITION, DATE, and the series-line check relaxed to a prefix) and the existing Tectonic; `figures` and `assets` are links to the review edition's.
- `tools/numbers_check.py` — the preservation gate.
- `logs/` — compile logs and the build summary.

The review edition's `verification/`, `WORK LEDGER.md`, `DECISION MEMO.md` and `HANDOFF FOR CODEX.md` remain the evidence record; nothing there was touched. A copy of this folder's Markdown and tools is kept in the app repository under `research/papers-2026-10-24/` on branch `yan-c`.
