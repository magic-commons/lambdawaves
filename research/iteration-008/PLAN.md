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

## Closed (Claude Yan, 2026-10-19; every row merged on `yan-c`, NOT pushed)
| row | merge | the numbers (from `<ROW>-BUILD.md`) | for Josh |
|---|---|---|---|
| **K · THE IMPULSE** | `04a3b01` | the overlay on its own DOM layer: `k = … a.u.` and `λ = … a₀` in the math face at the arrowhead, an even dash, a filled head; never in a picture or the film | — |
| **P · THE PICKER AND THE SMALL CUTS** | `7584a1c` | the LIBRARY head on one row (a row more of tiles), one caption in flight, the section install in the MOLECULAR deck, one-atom tiles → the ATOM, ELLIPSOID → UNCERTAINTY, the name centred | — |
| **A · ATOMS TO RADON** | `1e5258e` + `899ef38` | `groundConfig(Z)`, `ZMAX = 86`; Z ≤ 36 bit-identical (0 differences, THE LOCK green); Rb–Rn all 50 converge < 1e-8; Rn 1s 17 ppm from NIST's non-relativistic LDA; Au cold 384 ms; the el- pictures to Rn (86, 0 errors) | H–Kr with no STATUS line — show one? |
| **S · THE STATE CARD** | `17711b9` | STATE = STORE A · A · STORE B · B · TRANSITION · RABI Ω; the FIELD card (`staticfield`, +86 B WORKSPACE row per reading, every `edit` hash identical); SPECTRUM's ‹ PRESET › stepper and EMPTY ↔ FILL ALL; COPY JSON/LINK → EDIT; K key = release | FIELD opens for a profile older than it |
| **W · THE WAVE AND CLIP CARDS** | `ea16a69` | DENSITY · PHASE · RE · IM (Re+Im deleted from the shader; `waveView()`); DITHER a PREFERENCE under QUALITY; CLIP an ON switch + CLIP \| SLAB; THE LOCK 860 → 843 and 1004 → 987 (the 17 Re+Im rows out by name) | the switch says ON, not CLIP |
| **U · THE ONE CARD** | `b166ac4` | MO-REGISTRY inside MOLECULES (`orbitals` seat retired through RETIRED_WINDOWS, ids and targets kept); one switch; VIEW REGISTRY in Δρ's seat, Δρ a switch beside KICK; EMPTY ↔ FILL ALL (Gemini 3.8 Flash glyphs through `agy`); NORM gone; molecules.js 16 → 15 crossings | the register's `setOn(false)` turns MOLECULES off |
| **V · THE LIBRARY ROAD** | `62c14aa` | VOL. I as 34 tag pages (2,809 molecules, ≤ 252 a page; one-atom entries on none); the row's picture or the download glyph + the kit's ring (`installMolecule`, `statusOf` partial); INSTALLED gone; the K ≤ 192 cap → n × K ≤ 576 KiB (colfosceril palmitate opens) | pictures mostly blank until `pack.mjs --incremental` |
| **G · GRAIN AND DUST** | `68c861d` | one world-locked DUST (n³ cells, n = 128·GRAIN^⅓; seed 13 = seed 14; a turn moves the grains rigidly); GRAIN retired into it; BANDS per octave; KNEE T_q(τ) = (1+qτ)^(−1/q), 0.1 vs 0.6 moves 22.9 % of H 2pz's pixels (was ≤ 3 grey levels); knee FLASH_STEP 0.2595 → 0.2723; THE LOCK 843/0 and 987/0 after re-capturing the 15 particle rows | the default 0.6 keeps the old picture; a see-through default moves every PHASE·CLOUD row |
| **REVIEW** | `cc79823` `807e496` | Cursor's thermo-nuclear review (12 findings: +574 lines, ~+210 branches, ~110 deletable; one law break — the DITHER lift writes the blob on a project open) and Pocock's scan (8 candidates, C1 one ladder law first) | C4: the Picker's tile shows the highest orbital, its press loads `fillValence`'s — 40 of 86 differ (Fe shows 3d, loads 4s). Which? |
| **F · THE DELETION PASS** | in flight (`it008-fix`, 9661) | quality 1–10 and architecture C1 C2 C3 C6; nothing that changes behaviour | — |
| **A7 · n = 7** | not launched | `A7-BRIEF.md` is a sketch | after Josh's word |

Not in 008 (recorded): the Picker's REMOVE for a partially kept volume; `library.browser-test` step 5 (red at the base: an offline restore naming an evicted record); `official-defaults-palette` (red since iteration 003 moved VIVID to MIR OPTIONS; THE LOCK's palette rows cover it); grains may twinkle when a cell is under ≈ 5 px on screen (a prefiltered term); the kit issues for MIR (`createPrefs`' shared frame key; a lane and a route add; a knob's range fixed at build).
