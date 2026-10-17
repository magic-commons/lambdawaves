# Iteration 005 · P4 — THE MOBILITY EDGE (build)

Branch `it005-disorder` from `a0a3fb3` (A THE ROOM merged). Builder: Opus 5.5. Lab lines **31,350 → 31,362 (+12 net; +24 / −12 in the two
lattice files, `sw.js` two hashes)**. No new test file; no catalogue row (no new preset: ANDERSON gained knobs, so `catalogue-table.mjs` writes
the same 187 rows and `--check` is in step).

## The seats
- `lab/lattice-model.js` — `PRESETS` ANDERSON's knobs `N L W seed d seeds`; `DEFAULTS` `d: 1, seeds: 1`; `build` lays ANDERSON's 2-D L × L square
  (L ≤ 16, 256 sites) and 3-D L × L × L cube (L ≤ 6, 216 sites; 6 neighbours, open faces, 3L²(L − 1) = 540 bonds at L = 6) on the SQUARE
  preset's branch, with the same seeded disorder W·(rnd − ½) on every site; `levelStats(S)` — ⟨r⟩ over the middle third and the band-centre
  (|E| least) eigenstate's IPR × N; `closed` ANDERSON's line per d. A 1-D build is byte-for-byte the old one (the chain branch, untouched).
- `lab/lattice.js` — the knobs `d` (1…3) and `SEEDS` (1…16), `W`'s range 0…8 → 0…30 (the transition needs W ≈ 16.5 and the check W = 30);
  ANDERSON shows N in 1-D and L in 2-D/3-D, and L's value reads `6³ = 216 sites` (the clamp said where it bites); `prepare` solves the
  SEEDS − 1 extra Hamiltonians through the same cards-worker road beside the first (FIFO, ≈ 60 ms each at 216 sites in node; the browser settled
  16 seeds in ≈ 1.4 s); the new readout `⟨r⟩ · IPR × N  the transition` (ANDERSON only) prints ⟨r⟩ beside GOE 0.5307 extended and Poisson 0.3863
  localised, and under it the band-centre IPR × N with its two ends (1 spread · N on one site) and the seed count. The picture is the first seed's.
- `docs/STATE-SCOPES.md` row `presentation.instruments.lattice`: `d` and `seeds` ride the record, absent at 1 (the window's `save()` writes only
  what differs from `DEFAULTS`, so NEW, the demos and every older file carry neither).

**The picture: the cube's L layers side by side** (layer z at x-offset z·(L + 1)), not an isometric projection. The window draws |ψᵢ|² as bars
standing on the sites; in an isometric cube a bar hides the sites behind it and 216 bars overlap, while six 6 × 6 squares in a row keep every
site visible and the bar heights comparable. The z-bonds are not drawn (the window draws only bonds shorter than 1.5 in the picture's plane), so
the layers read as six separate squares; a click still picks the nearest site (SITE n).

## The two statistics over W, 3-D, L = 6, 16 seeds (seeds 1–16, node, `.tmp/p4-check.mjs`)
| W (J) | ⟨r⟩ | band-centre IPR × N | side of 0.46 |
|---|---|---|---|
| 2 | 0.5508 | 2.85 | GOE |
| 4 | 0.5494 | 3.18 | GOE |
| 8 | 0.5312 | 7.52 | GOE |
| 12 | 0.5156 | 21.70 | GOE |
| 16.5 | 0.4800 | 41.06 | GOE |
| 20 | 0.4474 | 44.41 | Poisson |
| 24 | 0.4255 | 70.42 | Poisson |
| 30 | 0.4083 | 89.63 | Poisson |

The check holds: ⟨r⟩(4) = 0.5494 on the GOE side of 0.46, ⟨r⟩(30) = 0.4083 on the Poisson side; IPR × N 3.18 → 89.63 (× 28, more than an order of
magnitude). At L = 6 the 0.46 crossing sits between W = 16.5 and 20 — the finite cube's, drifting toward W_c ≈ 16.5 as L grows, which is what the
closed line says. **Below W ≈ 8 ⟨r⟩ is ABOVE the GOE value** (0.55 > 0.5307): a weakly disordered small cube is near-ballistic, and the clean
cube's level structure, split by weak disorder, is stiffer than a random matrix's. Reported, not hidden; the window prints the measured number
beside both limits and lets it sit outside them.

## The 1-D ξ check (N = 200, W = 1, printed, not gated)
The band-centre eigenstate (|E| least, |E| ≤ 0.026), the least-squares slope of log|ψᵢ| against |i − peak| over the inner half (sites 50…149):
16 seeds give ξ = 73.1, 90.7, (−409), 132.6, 84.1, 64.8, 27.9, 45.0, 34.1, 61.2, 34.0, 97.5, (501), 55.1, 93.4, 58.7 sites — **ξ from the mean slope
64.4 sites, median 63.0, against 105/W² = 105.** The same order, 0.6 of the Kappus–Wegner value, and noisy: at W = 1 the localisation length is half
the chain, so a single eigenstate barely decays inside the box (two seeds' fits come out non-decaying), and one state's envelope is not the
transfer-matrix Lyapunov exponent the 105 is. The 1-D closed line is unchanged.

## What the brief got wrong, and how I decided
1. **ANGULAR NODES (row 5) already exists** — 0.6.3 E2, `lab/angular-nodes.js` (40 lines): VORTEX's third row, the latitudes as the l − |m| roots
   of P_l^{|m|}(cos θ), the |m| meridians of Re Y_lm, a COMPLEX mode with the poles, the counts and angles in its readout, drawn on the stage
   through the field's camera. Nothing to build; not built.
2. **W's knob stopped at 8** — the brief's check (W = 30) and the transition (W_c ≈ 16.5) were off its range; the range is now 0…30.
3. **"Every state localised" in 2-D is the infinite lattice's, not what a 16 × 16 square shows at weak disorder** (8 seeds, measured): W = 2
   ⟨r⟩ 0.5339 · IPR × N 3.2 (GOE-like: ξ far larger than 16 sites); W = 8 0.4666 · 21.9; W = 16 0.4013 · 83.1. The line's second half, "ξ
   exponentially large at weak disorder", is what says so; kept as the brief wrote it.
4. ⟨r⟩ above GOE at weak disorder in a 6³ cube (above): the brief's two limits are not bounds for a finite lattice.
5. The plan's line that the brief inherits ("the IPR, the closed line ξ(0) ≈ 105 J²/W²") stands; the new statistics sit beside the IPR rather than
   replacing it — the old IPR readout is the picture's own state, the new one the seed average of the band-centre eigenstate.

## The light check (Firefox headless, gate server 9631, `.tmp/p4-light.mjs`, a project restore with `instruments.lattice` per W)
- W = 2: eigen m = 108 IPR 0.0127 · ⟨r⟩ 0.5508 · IPR × N 2.9 · "W = 2.0 J, below: extended" · settled in 1.9 s
- W = 4: IPR 0.0184 · ⟨r⟩ 0.5494 · IPR × N 3.2
- W = 8: IPR 0.0344 · ⟨r⟩ 0.5312 · IPR × N 7.5
- W = 16.5: IPR 0.3980 · ⟨r⟩ 0.4800 · IPR × N 41.1 (the line then said "above"; it now says "at it" when W = 16.5 exactly)
- W = 30: IPR 0.8846 · ⟨r⟩ 0.4083 · IPR × N 89.6 · "above: localised"; page errors none.
The browser's numbers equal node's to the printed digit (same seeds, same solver). Screenshots `.tmp/p4-anderson-w4.png` (the state spread over all
six layers) and `.tmp/p4-anderson-w30.png` (one bar on one site), 223–227 KB each.

## Gates
`node tests/pwa.test.mjs --write` 0 · `./test.sh node` 0 (lattice 8/8, lattice-presets 4/4; a second full run went red on `wigner.test` W42-8, the
slice-timing row under the shared CPU — green alone at once, 140 ms < 150) · `node tools/rack-deps.mjs --classes --no-write` 0 ·
`node tools/new-project.mjs --check` in step · `node tools/catalogue-table.mjs` then `--check` in step (187 rows, unchanged).

## Left undone
- The `lattice` verb takes `preset` and `N` only; `d`, `W`, `seeds` are not verb arguments (a project or the knobs carry them).
- No finite-size scaling (L = 4, 5, 6 curves crossing) in the window: the cap is 256 sites; the drift sentence says it.
- The PACKET start in 3-D is a Gaussian in the picture's plane (it stays inside one layer); EIGEN m or SITE n is the reading in 3-D.
