# Iteration 008 — THE ONE CARD AND THE CUTS (Josh's prompt `JOSH-PROMPT.md`, 2026-10-18 ≈ 22:10; planned by Claude Yan the same night)

Base: `yan-c` after iteration 007's four merges (B `43cc176` · I `6e1cd07` · M `39abd1f` · O, the tip this plan is committed on). No push, no
deploy, no store submission. Never edit `lab/mir/**` or `lab/fonts/**`. Josh's dial: build the features, no new test files or gate
scripts, existing gates, one light check per row with a screenshot in the build note. Every builder reads
`../iteration-007/architecture/briefs/SHARED-CONTEXT.md` (the kit facts and laws; its line numbers have moved) and the iteration-007
build notes that touch its files (`M-BUILD.md`, `B-BUILD.md`, `I-BUILD.md`, `O-BUILD.md`). Icons: ask Gemini through `agy` (the
Antigravity CLI, `~/.local/bin/agy`, "Gemini 3.8 Flash @ High" is Josh's word) for 24 × 24 stroke-2 SVG glyphs in the kit's style, record
the prompt and the answer in the build note; if it is unavailable, draw the glyph and say so. The review round with the two skills
(`../iteration-007/skills/`) comes AFTER this iteration, over everything merged since `c73c5c0`.

## Josh's questions, answered (the facts behind them are in each brief)
| question | answer |
|---|---|
| why atoms only to Kr | a scope choice at 0.4.0 R-A2, not a limit: the ATOM system is a central-field Xα(2/3) solve on hydrogen's 91 labels (n ≤ 6), and atoms.js says "n ≤ 6 comes for free" — Z ≤ 86 (Rn) fits today's basis; the physics caveat is relativity (the 6s contraction: Au's colour, Hg's liquidity are relativistic, which Xα non-relativistic cannot give) — said in STATUS. Fr–Og need n = 7: 140 labels, a basis change through the register, the gas table, Wigner and THE LOCK — its own row (A7), with Josh's collapsible 'n =' sections in SPECTRUM |
| what NORM does | rescales the register to unit norm — an explicit act, nothing renormalises on its own (spectrum.js:162 "a unit-norm state looks the same afterwards, which is why it seemed to do nothing"). It goes: a HAND stroke normalises at its end (one undo row), never under a modulator |
| the ELLIPSOID | THE UNCERTAINTY ELLIPSOID: the position covariance Σ_ij = ⟨r_i r_j⟩ − ⟨r_i⟩⟨r_j⟩ drawn as its three principal circles about the bead — renamed UNCERTAINTY |
| Re+Im vs the others | REIM superposes REAL (orange/blue) and IMAG (green/violet) in one volume — two pictures in one, nothing PHASE does not carry as hue on density. It goes (a saved `reim` opens as PHASE). Δρ is the density minus the stored reference — under a KICK the only legible view of the response (DENSITY barely moves); it leaves the VIEW segs and lives as a Δ toggle beside KICK |
| atoms in MOLECULES | VOL. I carries six one-atom entries (Fe · Kr · Zn · Cr · Ni · Ti: PubChem compounds); they route to the ATOMS road (goAtom) everywhere and the packer excludes them at the next pack |

## Rows
| row | branch · port | what | from |
|---|---|---|---|
| **U · THE ONE CARD** | `it008-one` · 9601 | MOLECULES ∪ MO-REGISTRY: one switch, the ON row with ORBITAL \| STATES, the ladder under it, VIEW REGISTRY in Δρ's seat, EMPTY ↔ FILL ALL, NORM gone, plain ladder lines | base |
| **W · THE WAVE AND CLIP CARDS** | `it008-wave` · 9621 | VIEW loses REIM and Δρ, DITHER → SETTINGS › QUALITY, CLIP's VOLUME → a switch with a lamp | base |
| **S · THE STATE CARD** | `it008-state` · 9631 | STATE = STORE A · STORE B · A / B · TRANSITION · RABI; everything else to its home | base |
| **K · THE IMPULSE** | `it008-impulse` · 9651 | the IMPULSE VECTOR overlay redrawn: k and λ in the math face, a clean dotted line and arrow, no instructions | base |
| **A · ATOMS TO RADON** | `it008-atoms` · 9661 | atoms.js Z ≤ 86 within n ≤ 6, relativity said, LOAD VALENCE, SPECTRUM's lines plain | base |
| **P · THE PICKER AND THE SMALL CUTS** | `it008-picker` · 9671 | LIBRARY deck tighter with a row more, the fast-hover caption bug, the section install into the MOLECULAR deck, one-atom entries → goAtom, the name centred on the stage, ELLIPSOID → UNCERTAINTY | base |
| **V · THE LIBRARY ROAD** | `it008-library` · 9611 | the card's steppers over a downloaded volume: themes, thumbnails, install in place with the ring; INSTALLED leaves the card | U's merge |
| **G · GRAIN AND DUST** | `it008-grain` · 9641 | the DRAW styles GRAIN · DUST · BANDS reworked so KNEE and GRAIN do what they claim; THE LOCK ×2 | W's merge |
| **A7 · n = 7** | not launched tonight | the basis to 140 labels; SPECTRUM's ladder folds by the coloured 'n =' number (1 … 7) — brief `A7-BRIEF.md` is a sketch for the next hand | after A |

Order: U ∥ W ∥ S ∥ K ∥ A ∥ P → V (from U) ∥ G (from W) → the review round. Each merge: `node tests/pwa.test.mjs --write`, `./test.sh node` 0
(wigner W42-8 flakes under the three solvers' load; re-run alone), rack-deps 0, new-project in step; THE LOCK ×2 at W's and G's merges
(`lab/field.js` moves; the fixture names `reim`, so W re-captures it with `--write` and says the diff); the browser rows each brief names.
S and A both touch `lab/windows/spectrum.js` (S adds, A repaints) — the integrator resolves. The integrator renders the Picker's
el- pictures for Z 37–86 after A (`tools/menu-thumbs.mjs --set elements`).

## Running beside this plan
The three solvers (CPU 358533, GPU 358537 / 359785) on `vol-1.finish.json`; L, the volume pictures (`menu-thumbs --volume vol-1`,
2,787 to make, started 22:0x on 9243, log `$job/tmp/thumbs-vol1.txt`). Josh: "This might spill into Sos's work" — the baton is
`.claude/handoffs/latest.md` and `~/Documents/DATABASE/CLAUDE/HANDOFFS/LEGACY/latest.md`; the merge recipe is `$job/tmp/gate-it004.sh`
(copy it: pwa --write · ./test.sh node · rack-deps --classes --no-write · new-project --check · the lab line count).
