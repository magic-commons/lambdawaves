# Iteration 005 · P4 — THE MOBILITY EDGE (brief)

Branch `it005-disorder` from the BASE in the launch message (A THE ROOM merged). Gate server `LW_PORT=9631 GD_PORT=5731`. No push. Never edit
`lab/mir/**` or `lab/fonts/**`. Josh's dial: the feature, no new test files, existing gates, one light check. Source: Sol-6's
`~/Documents/OBSIDIAN/LAMB of WAVES/SOL-6 LAMB of WAVES.md` §2 (Anderson localisation as the top new playable system; the OpenAI preprint on
absolutely continuous spectrum at weak disorder in d ≥ 3 — the physics is the mobility edge, which exists only in THREE dimensions) and §3
(angular nodal sets). THE PLAN GOT THIS WRONG: ANDERSON is already a LATTICE preset (0.7.2 L1: `W`, `seed`, the IPR readout, the closed line
ξ(0) ≈ 105 J²/W² for 1-D). What does not exist is the dimension where the transition lives. Read first: `lab/lattice-model.js` (102 lines,
whole — `PRESETS`, `DEFAULTS`, `build` (≤ 256 sites; `square` is the 2-D lattice; the seeded `rnd`), `solveLattice`, `psi0`, `evolver` (exact
e^{−iEt}), `ipr`, `closed`), `lab/lattice.js` (84 lines, whole — the knobs table `KN`, `ro.ipr`, `ro.lev`, `ro.law`, `save()`/`load()`),
`docs/STATE-SCOPES.md` row 67 (`presentation.instruments.lattice`), `research/release-0.8.1/CHANGES-0.8.1.md` T3 (how the last three presets
landed — the shape to copy), `lab/catalogue.js` + `node tools/catalogue-table.mjs` (a new preset is a catalogue row; regenerate and `--check`).

## The rows
1. **ANDERSON gains a dimension.** A knob `d` (1 · 2 · 3) on the ANDERSON preset: 1-D the chain of N sites (as now), 2-D the L × L square, 3-D the
   L × L × L cube — `build` lays the cube's bonds (6 neighbours, open faces) with the same seeded disorder W·(rnd − ½) on every site; ≤ 256 sites
   holds L ≤ 6 in 3-D (216) and L ≤ 16 in 2-D (256) — the knob's range says so. The picture: the window draws sites in the plane today; a cube is
   drawn as its L layers side by side (L small squares) or as an isometric projection — pick the one that reads at 216 sites, say which.
2. **The two statistics of the transition, live.** Beside the IPR (already there): THE LEVEL-SPACING RATIO ⟨r⟩ = ⟨min(s_k, s_{k+1}) / max(s_k,
   s_{k+1})⟩ over the middle third of the spectrum (Oganesyan–Huse), with its two limits printed: 0.5307 (GOE, extended) and 0.3863 (Poisson,
   localised); and the band-centre state's IPR × N (1 when spread, N when on one site). In 3-D the closed line names the critical disorder
   W_c ≈ 16.5 J (box distribution, band centre; Slevin–Ohtsuki) and says "finite: 6³ sites — the statistics drift toward the limits as L grows, the
   transition is the infinite lattice's". In 1-D the line stays as it is (every state localised; Kappus–Wegner); in 2-D "every state localised,
   ξ exponentially large at weak disorder".
3. **Seed averaging as a verb.** A SEEDS knob (1 … 16): the statistics (⟨r⟩, the IPR) averaged over that many seeds from `seed` upward, the
   picture the first seed's; the eigensolves are cheap at 216 sites. PROJECT: `d` and `seeds` ride `instruments.lattice` like the other knobs
   (absent at the default); one STATE-SCOPES line.
4. **The one-time check (in the note):** 3-D, L = 6, 16 seeds — ⟨r⟩ at W = 4 and at W = 30 lie on the GOE and Poisson sides of 0.46 respectively,
   and the IPR × N moves by at least an order of magnitude between them; 1-D, N = 200, W = 1: the fitted localisation length of the band-centre state
   (slope of log|ψ| from its peak over the inner half) against 105/W² — printed, not gated.
5. **If the row has room: ANGULAR NODES** in VORTEX (`lab/vortex.js`) — the zero sets of the real spherical harmonics Re Y_lm on the unit sphere
   as drawn curves (l circles of latitude and m meridians for the real combinations; the count l − |m| + 2|m| said), with the window's own l, m.
   Skip it if rows 1–4 took the budget; say so.

## Checks, then the note
`node tests/pwa.test.mjs --write` · `./test.sh node` 0 (`tests/lattice*.test.mjs` green; any lattice test that pins the preset list is extended,
not rewritten) · `node tools/rack-deps.mjs --classes --no-write` 0 · `node tools/new-project.mjs --check` · `node tools/catalogue-table.mjs`
then `--check` · one browser pass: LATTICE › ANDERSON › d = 3, L = 6, W from 2 to 30 — the picture localises, ⟨r⟩ crosses, the IPR climbs. One
screenshot ≤ 300 KB. Lab count before and after (base in the launch message); the whole row should be well under 100 lines.

Write `research/iteration-005/P4-BUILD.md` (the seats, the two statistics' table over W at L = 6, the 1-D ξ check, what the brief got wrong, the
delta), commit on `it005-disorder` with a `Co-Authored-By:` line for your model, report the tip sha — never push. The RTX and the CPU are
shared; one browser suite at a time; stop only your own pids.
