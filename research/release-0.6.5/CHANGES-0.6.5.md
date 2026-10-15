# 0.6.5-alpha "Electrostatics" — what changed (Claude Yan / Fable 5.1, 2026-10-15)

Josh's dial: tight builds, features only, pre-1.0; §F-1 ★ (Electrostatics at 0.6.5) applied. The ELECTROSTATICS window stays deleted (0.5.0 D9b); this returns the
PHYSICS as a VIEW of MOLECULES. Two Opus builders from the 0.6.4 cut tip `fdc3b49`; merged X2 `055a07a`, X1 + the wire `63baddc`. Build notes: `X1-BUILD.md`,
`X2-BUILD.md`. Plan: `BUILD-PLAN.md`.

## X1 · THE POTENTIAL (`lab/md.js`, `lab/mathworker.js`, `lab/chemview.js`)
- `rinvMatrix(basis, C)` = ⟨p|1/|r−C||q⟩ for one centre (PySCF's `int1e_rinv`); the nuclear attraction V and it share one inner function (`hermiteR`); V is
  byte-identical on H₂O, C₆H₆, NH₃ in both bases and Σ_A −Z_A·rinvMatrix(R_A) reproduces it to 1.4e-14.
- THE PROBE: the electrons' potential at every nucleus, exact, on one line of MOLECULES' fold — water "Φ at nuclei · O −23.16 · H −5.83 ×2 a.u. · exact"
  (PySCF: −23.161570 vs ours −23.161571); equal entries collapse "×n"; null past 46 AOs (C₆₀ would take 17.7 s). The plan's example "H −1.00" was wrong; −5.83 is
  the value.
- `chem.esp` on the cards queue: ρ at the 64³ cell centres from the f64 AOs by the EXISTING sampler, taken as CELL MEANS (5³ sub-cells within 3h of a nucleus with
  Z > 2, h²/24·∇²ρ elsewhere) — point sampling held only 9.60 of water's 10 electrons and put the lone-pair potential off by 180–400 %; the electrons' potential by
  a free-space FFT Poisson solve zero-padded to (2N)³ (a 9-line radix-2 FFT; the self cell G(0) = (3 ln(2+√3) − π/2)/h = 2.3800774/h, the cube's mean of 1/r); the
  nuclei analytic, clamped at h/2. Reply `{ N, half, phi, min, max, charge, atNuclei, ms }`.
- **Measured:** water STO-3G (half 7.43): charge 10.00047; grid minimum −0.1125 a.u. at 1.935 bohr behind O (exact −0.1131 at 1.89); ≤ 1.8 % along the lone-pair
  line from 1.75 bohr out, ≤ 0.6 % beyond 2 bohr; 0.021 / 0.011 / 0.005 a.u. absolute at 1.0 / 1.25 / 1.5 bohr where Φ crosses zero (the plan's "3 %" does not hold
  inside 1.5 bohr — a relative error has no meaning at a zero). Benzene: 42.0026 e; ≤ 5.1e-4 a.u. at 20 points ≥ 1.5 bohr from the nuclei. Time: water 833 ms,
  benzene 2.5 s in the browser worker.

## X2 · THE CARD ROAD + THE VIEW (`lab/field.js`, `lab/molecular-session.js`, `lab/chemview.js`, `lab/status.js`, `lab/shell/stage-words.js`)
- `field.setCard({ N, half, data } | null)`: a worker's volume into ONE storage buffer (`writeBuffer`, 1 MB at 64³, made once), a ≈ 20-line `CARD_WGSL` derived
  from the molecular kernel's head that resamples it trilinearly into `psiTex` as a signed field with stats = max|Φ|; `cardDirty` set by `setCard`,
  `setResolution`, `setDomain`; a THIRD owner arm in `frame()` that runs only when dirty (0.1 ms encode with or without a card — the arm costs nothing clean);
  `setCard(null)` or any `setMolecule` hands the volume back. The two kernels' text untouched. The molecular session owns the card (`card(c)`).
- MOLECULES' VIEW gains **ESP** (disabled without D, like DIFF); two-colour 'real' once the card lands, the previous view kept while computing ("ESP computing…"
  then "ESP 64³ in 833 ms" on the status line); STATUS "ESP · NUMERICAL · 64³ grid · Φ at nuclei exact · −0.11 a.u. min"; the export caption "ESP · 64³ · min −0.11 ·
  max +… a.u."; leaving ESP releases the card. **The wire (integrator):** the reply lands in `onEsp`, and the card is shown CLIPPED at +4|min| (the nuclei's Z/r peaks
  are tens of a.u. and would wash the −0.11 lone pairs out); the caption says "shown clipped at +0.45"; the numbers are never clipped.
- **Measured:** a CPU hydrogen 1s volume through the card vs the eigenmode kernel's own 1s: 5.1e-7 at res 64 (one f16 ulp; the cell centres ARE the texels),
  9.8e-3 beyond 0.5 bohr at res 96 (the trilinear resample; 6.1e-2 at the cusp).
- **The subtraction:** `lab/shadow.js` → `tests/lib/shadow.js` (97 lines; `shadowview.js` inlines `SQRT2 = Math.SQRT2`; `tests/hydrogen.test.mjs` re-points).

## The light check (existing gates only)
- Node gate 0 after X2; after X1 one red: `wigner.test` W42-8 (a slice under 150 ms: 152–158 ms) — a wall-clock law in a module untouched since the 0.6.4 cut, under a
  machine load of 17–18 (a Chrome process at 867 % CPU, not ours); the song builder saw the same red earlier and green alone.
- `pwa --write`; `new-project --check` in step; `rack-deps --classes` holds (SPECTRUM at 25). X2's suites on its tree: official-defaults-palette 3 PASS,
  molecule-demos 5 PASS, THE LOCK 860 0/0. X1's on its tree: chem 56/56. On the merged tree under the same load: chem 54/56 — the two reds are L7's timing laws (CO₂
  416 ms vs 400; glycine 2867 vs 1638); the probe measured in node costs 6 ms on CO₂ and 35 ms on glycine (≤ 5 % of the solve), while the CO₂ solve itself ran 171 ms
  against a 40 ms prediction — the load, not the merge.
- **THE LOCK ×2 GREEN** at `63baddc`: 860 values 0/0 (81 s) and the 1004-value fixture 0/0 (77 s). No locked state has a card.
- **Lines:** 28,711 → 28,758 (+47 net: X2 +64, X1 +79, the wire +2, shadow.js −97, sw.js −1; cap 28,998).

## Deferred on the dial (recorded)
Per-orbital ESP (the plan's equal-share piece); a probe point the hand can place; a better scale than the +4|min| clip (a signed log or the lone-pair band); 48³/96³
cards; `atNuclei` is the ground's probe while a RUN feeds the volume; the ESP of a record without D (C₆₀) — the factor road's ρ could feed the Poisson solve.
