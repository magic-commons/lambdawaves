# G · GRAIN AND DUST — build note (iteration 008, branch `it008-grain` from `34f70c7`, gate server 9641 / GD 5641)

Josh: "'Grain' (Dust and Grain sucks and needs to be reworked heavily so that knee and grain does a better job.)"

## 1 · The measure (base tree `34f70c7`, before any change)
Pictures are the field alone through `field.readPixels(…, keep)` with the jitter pinned at seed 13, light theme, default grid 64³ /
160 steps, PHASE view, every knob at its shipped default (EXPOSURE 1 · SOFT 0.7 · ISO 0.06 · GRAIN 0.35 · KNEE 0.6), on hydrogen
`2pz` at t = 3.7 and on benzene's HOMO (MOLECULES · C₆H₆ from its record, VIEW ORBITAL, `1e1g (b) · HOMO`).
`g-shots/before-styles.png` (CLOUD · GRAIN · DUST · BANDS on both), `g-shots/before-knee.png` (CLOUD at KNEE 0.1 · 0.6 · 4).

What was wrong, named:
- **GRAIN was noise on a cloud, and it boiled.** It dropped march samples by a hash of a 96³ cell offset by `V.p0.w · 7` — and p0.w is
  `(presents % 97)/97`, the ray-march jitter seed, so the pattern changed on EVERY present: the same still state at seed 13 and seed 14
  differs in 11.4 % of the pixels (max 74 levels). The kept samples were boosted by 1/keep, so the saturated core drew as a plain cloud
  and only the rim was stippled. At GRAIN 1 it was bit-identical to CLOUD.
- **DUST aliased and swam.** A 144³ hash lattice with a sphere test, hit only if a march STEP happened to land inside a grain — with
  the march start jittered per present, so the grains a ray caught changed every frame (seed 13 vs 14: 14 % of the pixels move, max
  214 levels). Points were single pixels or nothing: sub-pixel hit/miss sampling, the classic sparkle.
- **The count knob did two jobs.** GRAIN was GRAIN's keep fraction, DUST's count (×0.25) and BANDS' band count (2–16).
- **KNEE did nothing the eye could see.** It bounded each STEP (`w/(1 + k·w)`), never the ray: a ray through the 2p lobe crosses an
  optical depth ≈ 14, so the core saturated whatever the knee. Measured: KNEE 0.1 vs 0.6 moves at most **3 grey levels** on H 2pz (0
  pixels by more than 3) and 7 on benzene; KNEE 4 vs 0.6 moves at most 19 / 35 levels on a thin rim.
- BANDS drew linearly spaced level lines of |ψ|² — informative but crowded at the core and blank in the tail.

## 2 · What was built
**DUST** (`lab/field.js` `dustPixel`, returned before the march; GRAIN's index 2 draws as DUST):
- Grains **fixed in the world**: the box cut into an n³ lattice, **n = 128·GRAIN^⅓** — GRAIN is the candidates' density (a fraction of
  128³) and nothing else; one candidate per cell, jittered inside the cell's middle 60 % by a PCG3D hash (Jarzynski & Olano 2020), so no
  two are closer than 0.4 cell (the minimum-distance property of a blue set: no clumps, no holes).
- A candidate shows with the probability **CLOUD's own weight w at its point** (ρ^SOFT, or (Re ψ)²^SOFT / (Im ψ)²^SOFT / |Δρ|^SOFT under
  those views) × EXPOSURE, against its own hashed threshold, fading over a narrow band as w crosses it.
- The ray **walks every cell it crosses** (Amanatides–Woo) and meets each grain **analytically** (perpendicular distance to its
  centre), so nothing reads the march, the jitter seed or the present count. Proven: DUST at seed 13 and 14 is the same hash; a camera
  turn moves the grains rigidly (`g-shots/after-dust-turn.png`, yaw 0.65 → 0.66 → 0.67, crops ×3); only the field's clock can make a
  grain come or go. The film's `frame(i, ctx)` seed 13 therefore reproduces it trivially (`film-handover` GREEN).
- **Point size from the screen:** the grain's world radius is fixed (a fifth of the finest cell, so GRAIN never changes its size),
  widened to one pixel at its own depth (`|dpdy(uv.y)| · tanH · t`, taken before any branch), its peak lowered by the area ratio
  (floored at ½ so a lone grain still reads), its kernel (1 − d²/r²)² compact and held inside the cell's ⅕ guard band so the walk sees
  all of it. Composited front to back through THE KNEE.
- `drawStyle()` maps every road in: a saved project / link (`persist.js` restore, said once: **"GRAIN joined DUST: opened as DUST"**),
  `LW.setStyle('grain')`, the C cycle (now CLOUD · SOLID · SIGNED · DUST · BANDS) and the notebook menu. The seg has seven buttons:
  CLOUD · SOLID · SIGNED · DUST · SHELL · ADD · BANDS.

**BANDS stays — why:** it is the only style that shows the field's *falloff* — SOLID and SHELL draw one level, CLOUD smears all of
them. It is now **one level surface per octave of the density** (ρ, or (Re ψ)², (Im ψ)²), anchored at **ISO** (a line at ρ = ISO·2^k,
so SOLID/SHELL's surface is one of them), so an exponential tail reads as evenly spaced, countable shells; seven octaves below ISO
fade out (the comb would only alias toward a node). GRAIN no longer touches it.

**THE KNEE** — a shoulder on the **accumulated** opacity: the ray's transmittance is the q-exponential
**T_q(τ) = (1 + qτ)^(−1/q), q = ln(KNEE/0.6)** (writeView puts q in p3.w, exactly 0 at 0.6). At q = 0 the shader takes the old
compositing lines untouched — the shipped picture, bit for bit. Above 0.6: a SOFT shoulder (T falls as a power of τ, dense cores turn
see-through and the lobes behind show). Below: a HARD knee (T reaches 0 at τ = 1/|q|, the silhouette closes sooner). The slope at τ = 0
is 1 for every q, so a faint wisp is never touched. It acts on every compositing style (CLOUD, SOLID, SIGNED, SHELL, DUST, BANDS); ADD
has no opacity and is untouched. The step's own bound w/(1 + 0.6w) stays, fixed (it is THE LOCK's arithmetic, and it never moved the
eye). Range 0.02 – 8 unchanged, default 0.6 unchanged — the default now sits in the middle of the live zone: either way moves the picture.

Measured at KNEE 0.1 · 0.6 · 4 (`g-shots/after-knee.png`, 560 × 350):

| subject | 0.1 vs 0.6 | 4 vs 0.6 |
|---|---|---|
| H 2pz CLOUD | max 144 levels, 22.9 % of pixels moved > 3 | max 77, 25.6 % |
| C₆H₆ HOMO CLOUD | max 131, 8.7 % | max 72, 9.8 % |
| H 2pz DUST | max 135, 2.0 % (the grains themselves) | max 68, 1.8 % |
| *before, H 2pz CLOUD* | *max 3, 0 %* | *max 19, 12.6 % (a faint rim)* |

UI: the KNEE knob carries the sentence as its hint; the DRAW note reads "KNEE bends how a ray's opacity saturates: 0.6 is the plain
exponential, higher a soft shoulder that lets dense cores show through, lower a hard knee. ISO sets the SOLID, SHELL and SIGNED surface
and the octave BANDS are anchored on; GRAIN is how many DUST grains there are." Style titles rewritten for DUST and BANDS.

**THE FLASH GUARD**: `tools/flash-calibrate.mjs` now derives the knee step from T_q (the smallest |Δq| = |Δln KNEE| that moves
L = 1 − T by 10 % of itself on the worst τ in 1e-4 … 60, the smaller of the soft and hard side): **material.knee 0.2595 → 0.2723**;
its ray check reads kneeMax 0.0998. `FLASH_STEP` holds the new number, `tests/flash-routes.test.mjs` PASS unchanged, the four guarded
routes stay four.

Before / after at the defaults: `g-shots/before-styles.png` → `g-shots/after-styles.png` (CLOUD, DUST, BANDS, and a saved GRAIN = DUST).

## 3 · THE LOCK ×2 (9641, `--query gastab=0`, RTX 3070, Firefox 158)
| run | 843 fixture (`digest-lock-base.json`) | 987 fixture (`digest-lock-s4a.json`) |
|---|---|---|
| this tree, before the re-capture | RED: 15 readback differences, all particle-style rows | RED: the same 15 |
| after the by-name re-capture | **GREEN 843 / 0** · 0 record-byte · no unrepeatable · 0 page errors | **GREEN 987 / 0** |

The 15 rows, re-captured in both fixtures (5 views × 3 styles): `styles.{density,phase,real,imag,diff}/{grain,dust,bands}`
(e.g. `phase/dust 172e4232 → 16d41c7b`, `phase/grain c4b081ba → 16d41c7b` — grain and dust now one hash per view). Every CLOUD row,
every iso-style row (solid · signed · glass), additive, every flag row (palette, invert, finish, bow, dither, slice), every line row
and every state's field digest and PHASE·CLOUD readbacks held **to the bit** — so the KNEE 0.6 path, the literal 0.6 on the step and
the new DUST branch before the march changed nothing else. As W did, the re-capture was BY NAME (`--write --only styles` into a scratch
file, then the 15 keys copied with the tool's own writer, which round-trips the fixture's bytes) — a whole `--write` would have re-baked
the retired states and the meta. The tool's header says so.

## 4 · Tests
- `./test.sh node`: exit 0 after `node tests/pwa.test.mjs --write` (the first run was red only on pwa's hashes of the eight edited files).
- `node tests/flash-routes.test.mjs`: PASS. `node tools/flash-calibrate.mjs`: the steps above.
- Browser on 9641: `field-law` GREEN (hydrogen RMS 2.34e-6, worst 1.68e-4 — field maths untouched), `render-regressions` PASS,
  `film-handover` GREEN, THE LOCK ×2 GREEN.
- `official-defaults-palette`: RED **exactly as on the base** (W found it: its first check reads a VIVID control that left SETTINGS for
  MIR OPTIONS at iteration 003 — `vivid is undefined`), so its palette assertions never run; the palette law is held by THE LOCK's
  palette-on/off rows, all green to the bit.
- `node tools/rack-deps.mjs --classes --no-write` exit 0; `node tools/provenance.mjs` regenerated with no diff.
- Probe (scratch, not committed): `LW.setStyle('grain')` → style 5, the seg lights DUST; a serialized project with `mat.style = 2`
  restored → style 5, DUST lit, STATE's status "GRAIN joined DUST: opened as DUST"; five C presses → 1 3 5 4 0; page errors 0.

## 5 · Decisions, and where the brief was not followed to the letter
- **The brief's two rules collide on KNEE.** "A visible shoulder … so the default shows a difference" and "the CLOUD digests must not
  move by one bit" cannot both hold if the default picture changes. Resolved by a two-sided family whose middle IS the old picture:
  KNEE 0.6 = exp(−τ) drawn by the old lines, the default in the middle of the live zone (0.1 and 4 each move 20 %+ of the H 2pz
  pixels). If Yan wanted the default itself translucent, the cost is every PHASE·CLOUD readback row of THE LOCK.
- **The step's bound stays at a fixed 0.6** rather than leaving: removing it would move every CLOUD row; it is said in the shader.
- **The ordered-dither threshold was tried and dropped.** The brief offered "blue-noise or Halton": the candidates' positions are the
  blue part (a jittered lattice with a guard); the acceptance threshold first used the R3 Kronecker lattice (a 3-D ordered dither),
  which drew planar streaks across the thin tail, so each candidate now takes a second, decorrelated hash draw.
- **Sub-pixel lattices.** When a cell is smaller than ~5 px on the screen (GRAIN near 1 on a small canvas, or zoomed far out) the
  pixel-wide grain is clamped to the guard band and narrows below a pixel; the walk stays exact (no truncation) but such grains can
  twinkle under a move. At the default canvas and GRAIN the cells are 5–9 px. A prefiltered (cone-coverage) term is the next step if
  Josh sees it.
- DUST ignores FINISH (glass / matte light a surface; a grain has none) and draws the bow's e^{ik·x} at each grain.
- No new test files or gate scripts (Josh's dial); the scratch probes live in `.tmp/` and were not committed.

## For the integrator
- G's tree is `34f70c7` + this branch; it touches `lab/field.js` (shader + `drawStyle` / `kneeQ`), `lab/windows/material.js`,
  `lab/shell/{persist,facade,keys,notebook}.js`, `lab/mod-port.js` (one constant), `lab/render-exact.js` (comments), both LOCK fixtures.
- CLAUDE.md's THE LOCK paragraph still reads true (843 + 987); a line for G could say "the particle rows re-captured at 008 G".
