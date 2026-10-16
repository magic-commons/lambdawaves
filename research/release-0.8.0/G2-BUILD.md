# G2 SQUEEZED + CAT — build note (Opus builder, 2026-10-16)

Branch `g2-squeeze` from `a2072ff`. `lab/` lines 29,525 → **29,565 (+40 of +45)**. `lab/field.js`, G1's and G3's files untouched.

## Seats
- `lab/kick.js:25` imports `qhoTableFor, qhoFromTable`; `lab/kick.js:197–218` THE SQUEEZE: `SQUEEZE_REFUSAL` and `SQUEEZE` (the last sentence) l.200,
  `squeeze1D(r, nmax, zs)` l.204, `squeezeMatrix(r)` l.206, `applySqueeze(re, im, r, axis = 'z')` l.213 (x / y = the z-squeeze between `AXIS_TO_Z`'s rotors;
  throws `SQUEEZE_REFUSAL` off `qho`, before touching the state).
- `lab/state.js:22` (import gains `applySqueeze`), `lab/state.js:317–318` `squeeze(r, axis, t)` through `_op(…, t, false)` as `kick` is.
- `lab/windows/state.js:8` (one import line: `applyKickAlong, escaped, SQUEEZE, SQUEEZE_REFUSAL`, `varianceZ`, `onHamiltonian`); the IMPULSE row
  l.142–151: a row with the SQUEEZE r knob (0…0.33), SQUEEZE-IN and CAT; `oscSync` disables all three off OSCILLATOR (`onHamiltonian`), their titles carry the
  refusal; `squeezeIn` and `cat`; the Impulse note moved below the row and extended. `pAlong(axis, f = momentumZ)` l.152 now takes the observable (Var along
  the axis reuses its rotor).
- `lab/calculus.js:16` (`radialMoment` import), `varianceZ(re, im, ids)` l.22–25 (doc l.22), the CALCULUS row `Var(z)` l.98 (a moment: no law, no residual).
- `lab/meters.js:4` (import `SQUEEZE`), l.35 STATUS's sub prints the last squeeze's sentence (only once there is one).
- `tests/squeeze.test.mjs` (31 lines, 5 laws).

## The road the matrix is built by
At fixed ρ every register orbital ψ_a = f_a(ρ, z)e^{imφ} is a polynomial of degree N ≤ 10 in z times e^{−z²/2}, so it lies EXACTLY in span{h_0 … h_10(z)}.
The projections P_a[n](ρ) = ∫ h_n(z) f_a(ρ, z) dz are built once (91 × 11 × 120 ρ-nodes; trapezoid in z on ±9, step 0.15, and in u with ρ = ln(1 + e^u),
u ∈ [−14, 9.8], step 0.2 — both spectral for these integrands; 240 ms, then ~30 ms per new r), and S_ab = 2π Σ_ρ w ρ Σ P_a[n] S1[n][n′] P_b[n′] with
S1[n][n′] = e^{r/2} ∫ h_n(z) h_n′(e^r z) dz — the matrix elements of the infinite operator. The tree has no Cartesian ↔ spherical map; this is the cylindrical
product basis h_n(z) ⊗ (the 2-D oscillator) taken through quadrature, and S = 1 ⊗ S1 on it. **Unitarity on the full product basis:** S1(0.5)ᵀS1(0.5) = 1 on
n ≤ 10 summed over n ≤ 80, 5.4e-14; the register map at r = 0 is the identity to 5.6e-13. **Independent oracle** (`.tmp`, not committed): projecting the
closed-form squeezed vacuum π^{−3/4}e^{r/2}e^{−(x²+y²+e^{2r}z²)/2} onto the 91 labels on a 70³ grid agrees with `applySqueeze` on |0⟩ to 5.5e-13 per
coefficient at r = 0.25 and 0.5.

## Var(z) and the lost norm, re-measured on the register (squeezed |0⟩ along z)
| r | Var(z) register | e^{−2r}/2 | rel. error | tol(r) = 2e-3·(r/0.33)⁵ | lost norm |
|---|---|---|---|---|---|
| 0.10 | 0.409367 | 0.409365 | 2.88e-6 | 5.11e-6 | 2.24e-8 |
| 0.20 | 0.335197 | 0.335160 | 1.10e-4 | 1.64e-4 | 1.57e-6 |
| 0.30 | 0.274693 | 0.274406 | 1.05e-3 | 1.24e-3 | 2.03e-5 |
| **0.33 (cap)** | 0.258892 | 0.258426 | **1.81e-3** | 2.00e-3 | **3.73e-5** |
| 0.40 | 0.225906 | 0.224664 | 5.52e-3 | (past the cap) | 1.29e-4 |
| 0.50 | 0.187735 | 0.183940 | **2.06e-2** | (past the cap) | **5.43e-4** |
| 1.00 | 0.139210 | 0.067668 | 1.06 | — | 3.42e-2 |

The tolerance's shape: the leading dropped term is the ⟨4|z²|6⟩ cross term (c₄ ∝ r², the missing l = 6 part of c₆ ∝ r³), so the error grows as r⁵ — the
table follows it. Var(z) = 2.06e-2 at r = 0.5 is past the 2e-3 gate, and the gate was not widened: **the knob is capped at r = 0.33** (where the error is 2e-3
to three figures, bisected at 0.3359). The live UI sentence at the cap, read from the served tree: `Var(z) 0.2589 · e^{−2r}·Var₀ = 0.2584 · error 1.8e-3 · lost
norm 3.7e-5`. The oracle on screen is e^{−2r}·Var₀ (S†zS = e^{−r}z), so the sentence is right for any state, and e^{−2r}/2 for |0⟩.

## The cat
|α⟩ + |−α⟩, α = ik/√2: two slaps of |0⟩ along ±d at k (`applyKickAlong`), stored as A and B through `app.hooks.ab.setStores`, the register their normalised sum
(anchored at the clock's t). At k = 1: odd-l weight 1.9e-33 (even), ⟨z⟩ = −2.1e-19, Var(z) 0.231131 against the closed form ½ − k²e^{−k²}/(1 + e^{−k²}) =
0.231059 (7.2e-5, the slap's own n ≤ 6 truncation; gated at 1e-4).

## Persistence
r is `mat.bow.squeeze` — the IMPULSE row's own PROJECT record (`docs/STATE-SCOPES.md`: `mat … bow` PROJECT), absent until the knob moves; persist.js'
existing `ui.bowKnobs` loop restores the knob (`ui.bowKnobs.squeeze` maps a missing value to 0). A link (statelink) carries only gain / curve / limit, so it
drops r. The squeeze itself is a state transform: `touchState()`, one history row, like a slap. `tools/serialize-bytes.mjs`: all 11 readings (4 demos, NEW, 6
history rows) byte-identical to the base, full and edit.

## Screenshot
`research/release-0.8.0/g2/squeeze-r033-z.png` — the oscillator ground state (left) and SQUEEZE-IN at the cap r = 0.33 along z (right), headless Firefox on
the served tree (port 9431), pressed through the real knob (End) and trig. The cloud flattens along z.

## Corrections to the brief and the plan
1. **The register is not N ≤ 10.** It holds n_r + l ≤ 5 (`qho.js` l.8–10), so |0 0 n_z⟩ is whole only for n_z ≤ 5; `sonnet2-e-squeeze` assumed every n_z ≤ 10.
   Measured on the real register: lost norm 5.43e-4 at r = 0.5 (plan: 2.4e-5), Var(z) error 2.06e-2 (plan: 1.8e-3). The plan's numbers reappear at r ≈ 0.33.
2. **The cap is r ≤ 0.33, not 0.5**, so that the plan's own gate (≤ 2e-3) holds at the cap. The test prints r = 0.1 … 0.5, gates r ≤ 0.33 with tol(r), and
   asserts the cap is tight (0.4 is past 2e-3). The screenshot is at 0.33, not 0.5.
3. **The slap does not take −k.** `bessel.js` `sphericalBessel(L, x)` is wrong for x < 0 (j₁(−0.5) reads −1/6), so `applyKick(…, −k)` is not e^{−ikz} (a pre-existing
   defect, not touched here). The cat is built from two slaps at k > 0 along ±d (`applyKickAlong`), which is exact.
4. "Disabled off OSCILLATOR": the Hamiltonian switch lives in G1's `spectrum.js`; the row subscribes to `hamiltonian.js` `onHamiltonian` instead, no G1 line.
5. METERS' sentence: `meters.js` (no row's file) prints `SQUEEZE.said` under STATUS — not `rack.js`'s statusLine (G1's). The same sentence is the IMPULSE
   readout's sub. METERS ships closed on the first-run layout.

## Dropped
Anti-squeeze (r < 0) on the knob (the brief asked 0…cap); a second Var(x)/Var(y) tile (the METERS line reads Var along the axis squeezed); a warm-up slice for
the 240 ms first build (it runs on the first SQUEEZE-IN press, not at boot).

## Gates run
`./test.sh node` rc 0 (0 RED) after `node tests/pwa.test.mjs --write`; `tests/squeeze.test.mjs` 5/5; `node tools/rack-deps.mjs --classes` clean (G-A: app 30 keys,
no extension); `node tools/new-project.mjs --check` in step; `node tools/serialize-bytes.mjs` base vs g2 identical (11/11, full and edit); `kick`, `qho`,
`calculus`, `hydrogen` green inside the node gate; one headless browser check (above), `window.__e` empty.
