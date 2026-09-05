# λWAVES · QWAVE-0 — HYDROGEN SHADOW LAB · report

Built 2026-09-02, one evening, vanilla: ES modules, no build step, no dependencies. The constitution is
`OBSIDIAN/LAMBDAWAVES CLAUDE MASTER GOAL SPEC:2026-09-02.md`; this build takes §9's scope and §9.3's
exclusions as its boundary.

## Open it

```
cd ~/Documents/LAMBDAWAVES
./serve.sh              # → https://127.0.0.1:8700/lab/   (self-signed cert: accept it once)
```
Firefox or Chrome with WebGPU. Query flags: `?preset=rydberg`, `&view=phase`, `&play=1`.
Without WebGPU the FIELD shows a banner; SPECTRUM, SHADOW and METERS still run (they are CPU).

Keys: **space** play/pause · **home** t→0 · **← →** step. Drag the FIELD to orbit, pinch/wheel to zoom,
double-click to reset the view. Touch and mouse both drive every control (44 px seats, `touch-action: none`).

## What exists

| file | what | status label |
|---|---|---|
| `lab/hydrogen.js` | 91 states n ≤ 6 (`h:n:l:m`), R_nl by Laguerre, complex Y_l^m with Condon–Shortley phase, E_n = −1/(2n²); two evaluators (recurrence oracle, polynomial tables for the GPU) | **EXACT ANALYTIC** |
| `lab/state.js` | the register: anchor c(0), c(t) = e^{−iE t}c(0), set-at-time edits, explicit NORMALIZE, mute/solo mask, render set with truncation report, STATE ROTATE R_z, serialize/restore, 9 presets | **EXACT ANALYTIC** (DIAGONAL) |
| `lab/clock.js` | one logical time (a.u.), rate, scrub, step, pause/resume with re-anchoring and a 0.1 s wall cap (no giant first step) | — |
| `lab/shadow.js` | c = (q+ip)/√2, generator [[B,A],[−A,B]], H_C = ½qᵀAq + ½pᵀAp + pᵀBq = c†Hc, RK4 for the test only | **EXACT REAL REPRESENTATION** |
| `lab/field.js` | WebGPU: compute ψ = Σ c_a φ_a on an N³ `rgba16float` grid straight from the mode tables (no basis textures, ≤ 32 modes/kernel), raymarch presenter: ρ, arg ψ, Re, Im, Δρ vs a captured reference; slice/clip; box + axes; readbacks and a throughput measure for proofs | **NUMERICAL** |
| `lab/spectrum.js` | the SPECTRUM rail: physical eigenvalue ladder (bunching to E = 0 is the point), a lane per populated mode: E, colour = n, population fader, live phase needle (drag adds phase), M/S, remove; the 91-state picker | — |
| `lab/shadowview.js` | SHADOW: PHASORS / OSCILLATORS / LISSAJOUS of the same c(t) — reads, never integrates | — |
| `lab/meters.js` | norm, ⟨E⟩ (hartree, eV), t (a.u., attoseconds), \|⟨ψ(0)\|ψ(t)⟩\|, modes rendered/populated/91, cache, clocks, last tier, status | — |
| `lab/rack.js` | the instrument: windows STATE · SPECTRUM · OBSERVER · SHADOW · METERS, the tier router, four clocks, transport, gestures, badges + explanation sheet, `window.__LW` | — |
| `lab/kit.js`, `lab/lab.css` | knob (conic-tick rim, needle, double-tap reset, 44 px finger over 34 px ink), switch, segmented select, trigger, fader, readout, device chassis with a three-zone head; the token ladder in the MANDELBROT/BASINS family | — |
| `lab/smoke.html`, `tests/peek.mjs` | a field-only diagnostic page and a screenshot tool (not the lab) | — |
| `lab/frontier.js` *(0.1)* | the mathematics of the print BEYOND THE FRONTIER (2026-09-03), DOM-free: Airy Ai (series + asymptotics), the revival envelope I(α,β), the integer series of the maximiser α*(β) and the rational series of the height, clocks, packets, the exact ladder autocorrelation, the Poisson sum of Airy envelopes, the comb verdict (deaf iff b \| 6) and the cubic-level height with its Parseval floor; Clebsch–Gordan, the shell matrix with the l-phase fixed by Pauli's K_z, Schmidt spectra, rotor expectations, e^{−iθK_z} and e^{iαL²}; complex polynomial roots, the vortex locator, the stretched reconnection census | **EXACT ANALYTIC** |
| `lab/ladder.js` *(0.1)* | LADDER: a Rydberg-only register (populations on any n, Gaussian or comb), the exact revival landscape and the fine structure at T_rev with the Airy–Poisson PREDICTION dashed over it, the three clocks, β₃/β₄, the measured and the predicted peak, the arithmetic verdict | **EXACT ANALYTIC · SPECTRAL** (no field) |
| `lab/orbit.js` *(0.1)* | ORBIT: per populated shell the Schmidt spectrum (SO(4)-orbit invariants), ⟨J₊⟩ and ⟨J₋⟩ on two spheres in the FIELD's camera, ⟨L⟩, ⟨K⟩, eccentricity e = \|⟨K⟩\|/n, ⟨z⟩, the COHERENT flag and the Kepler ellipse | **EXACT ANALYTIC** |
| `lab/vortex.js` *(0.1)* | VORTEX: the nodal lines of ψ(t) as unimodular roots of P(w) on sampled coaxial circles (tracked across θ, refined by bisection), drawn over the FIELD through its own camera; the degree bound, the dominance count, the axis charge; the reconnection census and JUMP TO EVENT for stretched three-mode states | **EXACT** on the sampled circles |

Presets (§18): `1s`, `2p_z`, `1s+2s beat`, `1s+2p_z dipole`, `2p₊ = (2p_x + i·2p_y)/√2` (stationary torus; the circular
current lives in arg ψ = φ — visible in the PHASE view), `2s+2p_z (degenerate → no motion)`, `3d_z²`,
`Rydberg packet n = 4…6` (circular states |n,n−1,n−1⟩, Gaussian in n about n̄ = 5, σ = 1: a lump orbiting in
the xy plane, T_cl = 2πn̄³ ≈ 785 a.u.), `1s+2s+3s shadow trio`. Each stores exact coefficients, the basis
convention and its status; visual defaults (rate, scrub window, view) are stored apart and applied only when
PRESET VISUALS is on.

## What is exact, what is numerical, what is a design choice

**EXACT ANALYTIC.** The basis, the energies, the evolution, and every meter:
c_a(t) = e^{−iE_a t} c_a(0) is evaluated in closed form from the anchor c(0) (the same law as
c(t+Δt) = e^{−iEΔt}c(t), with no accumulated rounding and an exact scrub); norm, ⟨H⟩ = c†Hc, and
A(t) = Σ|c_a|² e^{−iE_a t} come from the coefficients, never from the grid. Convention, frozen and tested:
Y_l^m = √((2l+1)/4π · (l−m)!/(l+m)!) P_l^m(cos θ) e^{imφ} with P_l^m carrying (−1)^m, Y_l^{−m} = (−1)^m conj Y_l^m
(the physics convention: Jackson, Sakurai, Mathematica). Complex Y_lm were chosen because the PHASE view needs
arg ψ; real orbitals are coefficient presets, never a second basis. Atomic units; 1 a.u. of time = 24.1888 as.

**EXACT REAL REPRESENTATION OF FINITE UNITARY AMPLITUDE DYNAMICS.** SHADOW reads q = √2 Re c, p = √2 Im c
from the same c(t) the field is built from. With this √2 normalisation H_C equals c†Hc exactly (the test
checks it to 1e-14), and for diagonal H every mode is an uncoupled oscillator with angular velocity −E_a.
Equation-level identity; not an ontological claim (§42.1). The complex-coupling path (B ≠ 0) is tested against
a Pauli closed form even though hydrogen never exercises it.

**NUMERICAL.** The FIELD cache: ψ sampled at voxel centres of an N³ grid over [−L, L]³, stored as f16,
trilinearly filtered, ray-marched with S steps and a front-to-back emission/absorption composite. Measured:
GPU voxels agree with the CPU closed form to 2·10⁻⁵ relative (single state) and 2·10⁻⁴ (superposition at
t = T/4, f16 storage); the midpoint-rule integral of ρ over the grid is 0.9990 (96³) and 0.9973 (64³) for a
normalized state. The cache is a rendering product; quality (64³/96³/128³, ray steps, render scale) changes
only this estimate — the browser proof checks the state digest survives a 64³ rebuild.

**DESIGN CHOICES (not physics — say so if you change them).** The transfer function (opacity
1 − exp(−w·σ·Δs) with w = ρ̂^γ, σ = 24·EXPOSURE), the palettes (density teal→white; phase = hue, density =
opacity; Re/Im diverging orange/blue; Δρ yellow gain / blue loss, per §20), the auto domain L = 2n² + 3n + 2
(the classical turning point 2n² plus margin), the 32-mode kernel cap, the 0.1 s wall-step cap, the
population fader semantics (|c_a| ← √v · ‖c‖ before the edit, so the fraction re-reads after), the 44 px seats.

**POLICIES (deterministic, documented in `state.js`).** Edits happen at the current logical time and re-anchor
c(0). Nothing is silently renormalized: NORMALIZE is a trigger, presets are stored normalized, the NORM meter
shows the truth after an edit. MUTE/SOLO are a reconstruction mask: c is untouched, the field is rebuilt from
the unmuted set, and the badge and METERS say "RENDERED 1/2 · 50% OF NORM". More than 32 eligible modes:
the largest populations render and the truncation is reported. The camera, slice, clip, palette, exposure and
quality never touch c (OBSERVER); STATE ROTATE (D(R_z(α)): c_nlm → e^{−imα}c_nlm) does, and lives in STATE.

## The tier router and the clocks

`PRESENT < RECONSTRUCT < EVOLVE < REBUILD`. Every cause asks for a tier; one animation frame coalesces to the
strongest and does that much: PRESENT re-renders the last valid cache (camera, slice, palette, exposure),
RECONSTRUCT rebuilds ψ from the current c (amplitude/phase edit, mute, state rotate), EVOLVE advances the
clock then reconstructs, REBUILD reallocates the grid or changes the domain. **Idle is zero work**: paused,
still, nothing pending → no `requestAnimationFrame` is scheduled (METERS says "IDLE · zero work"; the proof
counts zero frames over 500 ms). Four clocks: physics (the Clock, exact), field (a cappable reconstruction
cadence — OBSERVER › FIELD CLOCK cap — the coefficients still advance every frame and the SHADOW keeps moving
at display rate while the field lags), camera (AUTO-ROTATE, observer only), presentation (display rate).
The proof caps the field clock to 4 Hz and checks Δt = rate · wall while reconstructs fall to a handful.

## Proofs

`./test.sh` runs both (the browser proof starts its own HTTPS server on 8701 and geckodriver on 5202 and
stops them). The lab itself has zero dependencies; the browser proof borrows the MANDELBROT kit's
`mbgate/server2.py` (HTTPS with the house cert) and `mbgate/gatekit.mjs` + `drv.js` (headless Firefox WebGPU).

**`tests/hydrogen.test.mjs` — node — 37/37 GREEN** (0.4 s). Q0: 91 unique ids; E_n; Lyman-α 10.204 eV;
∫|R_nl|² r² dr = 1 for all 21 (n,l) (worst 2.7e-9); ⟨Y|Y⟩ = 1 for all 36 (l,m) (worst 2.1e-8, 2-D Simpson);
radial and angular orthogonality samples; hand-typed anchors R_10…R_32 and Y_00…Y_33 with the CS phase
(worst 2.2e-16); the GPU polynomial tables equal the recurrence oracle for all 91 states at holdout points
(1.8e-13); analytic nodes. Q1: unitarity, phase advance −E_a t, ⟨E⟩ invariance, set-at-time round trip,
eigenstates stationary, 1s+2s |A(T)| = 1 at T = 2π/(E₂−E₁) = 16.7552 a.u., |A(T/2)| = 0, |A(T/4)| = 1/√2,
degenerate 2s+2p_z never moves. Q2: RK4 of the real system vs the closed form (6e-15 over 40 a.u.),
H_C = c†Hc, antisymmetric generator, complex coupling vs the Pauli closed form (4e-15), H_C conserved.
Q5: R_z(π/2) takes 2p_x to 2p_y. Q6: the clock's cap and re-anchoring. Q7: serialize/restore. Mask and
truncation reporting; all presets load normalized.

**`tests/boot.browser-test.mjs` — headless Firefox WebGPU — 27/27 GREEN** (~75 s; 23 of QWAVE-0 plus the four B14 FRONTIER checks). Boots without errors,
banner or shader messages; the FIELD is lit both by a GPU readback of the render pass and by decoding the
driver's composited screenshot in node (a WebGPU canvas lies to a 2-D readback); NORM reads 1.000 in the DOM;
1s+2s autocorrelation returns above 0.99 at T = 16.755 a.u. and vanishes at T/2 (a beat, not a cross-fade);
five GPU voxels of the superposition at T/4 match the CPU closed form; muting 2s changes the cache
(∫ρ 1.00 → 0.50) and the picture, leaves the state digest, and is SAID by badge and meters; SHADOW's drawn
(q,p) equals √2·c(t) at the same logical time and H_C = ⟨E⟩; camera orbit and clip change the picture, not
the state or time, at PRESENT cost, while STATE ROTATE changes the digest at RECONSTRUCT; play advances at
the rate, pause holds through camera motion, IDLE ZERO, resume never steps more than 0.1 s of wall; capping
the field clock leaves physics alone; a 64³ REBUILD keeps the digest and still integrates ρ to 1; a real
TOUCH drag (WebDriver touch pointer) orbits the camera; mouse taps on PLAY and on a lane's M go through the
same road; serialize → other preset → restore reproduces state and time.

## Measured performance (headless Firefox, RTX 3070, 2026-09-02)

GPU throughput: 600 frames encoded back-to-back into an offscreen target of the stage's size, one completion
wait, wall ÷ 600 (Firefox zeroes timestamp queries and polls completion at 100 ms, so this is the honest
measure; quantization ±0.17 ms/frame, and the first run of a sequence may sit at lower GPU clocks).

| grid · rays · stage | modes | frame (reconstruct + present) | reconstruct | present |
|---|---|---|---|---|
| 64³ · 110 · 771×611 (0.75 scale) | 3 (Rydberg, L = ±92) | **1.22 ms** | 0.34 ms | 1.18 ms |
| 96³ · 160 · 1028×814 | 3 (Rydberg) | **3.06 ms** | 0.34 ms | 2.84 ms |
| 128³ · 240 · 1028×814 | 3 (Rydberg) | **3.57 ms** | 0.35 ms | 2.01 ms |
| 96³ · 160 · 1028×814 | 16 (n ≤ 4 mix, L = ±46) | **3.20 ms** | 0.69 ms | 2.85 ms |
| 128³ · 240 · 1028×814 | 16 | **3.89 ms** | 1.17 ms | 2.51 ms |

So the GPU cost of a full frame at the default 96³ is ~3 ms — five times inside a 60 Hz budget — and the
reconstruction of 16 modes on 128³ (33 M basis evaluations) is ~1.2 ms. The headless page loop itself ran at
38–40 Hz while playing (software compositing of a 1400×900 headless window; not the GPU). Per §44 these are
the numbers actually measured; the real-window desktop frame rate and the iPad are Josh's to confirm —
nothing here claims 60 Hz in a real window until it is read off the METERS' CLOCKS tile there.

## Honest gaps (QWAVE-0 as built)

- **Rack laws (§24)** — windows fold, they do not drag-reorder; FULL/COMPACT/MINIMIZED is only fold/unfold. Layout never touches the state, as required.
- **MIR (§26–27)** — no parameter descriptors, no modulation routing, no LFOs. Deliberate: nothing here owns a private wall-clock animation; AUTO-ROTATE is the only observer motion and is labelled as such.
- **State rotation** is R_z only (exact). A general D^l(R) (Wigner-d for l ≤ 5) is the next state operation.
- **KICK / packet launch (§17)** — absent. A projection-based launch into the n ≤ 6 basis with a reported truncation loss is the natural QWAVE-0.1 entry.
- **Recording/export (§47)** — SAVE/LOAD (localStorage, experiment and presentation separately) and COPY JSON only; no replay timeline, no frame export.
- **Probability current j = Im(ψ*∇ψ)** — not rendered; the circular current of 2p₊ is visible only as the phase gradient.
- **The Rydberg packet** uses three n's (4,5,6) because the ceiling is n = 6; it orbits but does not show a clean spreading/fractional-revival sequence (that needs ~10 n's around n̄ ≈ 20: a basis-ceiling decision, not a renderer one).
- **f16 cache** — fine for pictures (2·10⁻⁵ … 2·10⁻⁴), not for measurement; all meters come from the coefficients.
- **Firefox GPU timing** — timestamp queries return zero and completion polls at 100 ms; the throughput numbers above are the honest measure.
- **The 91-state picker** is a chip grid; adding a mode takes the mean amplitude of the populated set with phase 0.
- **Native `<select>` for presets** — the one control that is not the kit's own.
- iPad/touch was checked only through the WebDriver touch pointer and the 820×1180 layout in headless; not on the device.

## QWAVE-0.1 · FRONTIER (2026-09-03): the print in the instrument

Five adversarial rounds (`research/adversarial-2026-09-02/`, print `PRINT-BEYOND-THE-FRONTIER-LAMBDAWAVES-2026-09-03.md`)
produced theorems; the synthesis `research/SYNTHESIS-APP-2026-09-03.md` maps them to contracts; this wave builds
three windows and two state operations, all exact, without touching the WebGPU kernel or the tier router.

**`tests/frontier.test.mjs` — node — 37/37 GREEN.** Ai at eleven DLMF anchors (1e-8); I(α,β) = quadrature (1e-9);
the integer series −3β + 54β³ − … and the rational height series against the numerical maximiser (1e-7, 1e-9),
their Gevrey-1 error at β = 0.05; α*(3) = −1.89744 (Round 3's probe); the Poisson sum of Airy envelopes reproduces
the exact ladder sum to 1.1e-4 at n̄ = 600 (the quartic, 2e-2 at n̄ = 150, is the neglected term); the n̄ = 30, σ = 2
revival peaks at 0.9943 T_rev with |A| = 0.805 against 0.356 at T_rev; the deaf comb (b | 6 → 1.000000) and Opus's
cubic-level heights 0.744456 (4/5), 0.844052 (10/9), the Parseval floor 0.375570; nine CG table anchors and the
orthonormality of the j = 5/2 coupling; Pauli's K_z reproduced both by the coupled picture (1e-15) and by quadrature
of ⟨n l+1 m|z|n l m⟩ (3e-12); Schmidt spectra 2s → (1/√2, 1/√2), Stark and circular → (1, 0); ⟨K⟩ = ẑ, e = ½, ⟨z⟩ = −3;
invariance under R_z and K_z, change under the DEFECT WAIT; Opus's B5 gate end to end; Durand–Kerner on w⁴ − 1;
2p_x's lines in x = 0; the degree bound; the print's census — six roots of Φ at the print's radii to 1e-8, five
admissible, ten points, T_d = 481.265, the two firing phases, and a double unimodular root (8e-8 apart) at the
first event. The browser proof gained four B14 checks (windows present; ORBIT reads the Stark state; STARK ROTATE
at RECONSTRUCT keeps the spectrum while DEFECT WAIT moves it; LADDER's peak on the page; VORTEX census and overlay).

### wave 2 (Round 7 of the programme): the cusp, the Korselt law, the whole of SO(4)

The checkpoint after wave 1 was "pause and think math before continuing building". Four theorems came out of it and
went straight in (`research/adversarial-2026-09-02/07-fable.md`; probes `bf-r7-*`):

- **A.9 the saddle ladder.** The singulant of the revival envelope is the action difference between the Gaussian
  saddle and the competing one: |ΔS_p| = ((p−2)/2p)(pγ)^{−2/(p−2)}. At p = 3 that is **1/(54β²)** — the print's
  Borel pole, derived in one line instead of fitted — and at p = 4 it is i/(16γ). It also explains why every
  observable of the same integral shares a singulant (the print's conjecture Ω₄′).
- **A.10 the superrevival is a CUSP.** At T_sr = πn̄⁵ the cubic phase vanishes for every integer k and the quartic
  is what is left, so the envelope is a Pearcey function where the revival's is Airy — fold, then cusp. Which kind
  is decided by **n̄ mod 4**: 0 → full, 2 → the same cusp shifted half a classical period, odd → a two-lobed
  fractional revival whose taller lobe is chosen by 3n̄ mod 4. Measured against the exact ladder sum in all four
  classes, worst error 8×10⁻⁴, tracking the neglected quintic over three decades.
- **A.11 the Korselt law.** The print's "deaf iff b | 6" is the p = 3 member of a family: the degree-p phase is
  invisible iff m^p ≡ m (mod b), and for odd p that modulus is the **denominator of the Bernoulli number B_{p−1}**
  (2, 6, 30, 42 for p = 2, 3, 5, 7). Measured exactly for p ≤ 7 over every reduced a/b with b ≤ 60. The p = 2
  member *is* A.10's half-shift: the programme's two arithmetic laws are one law at two clocks.
- **B.7 the whole of SO(4).** Every group element acts on a shell as M ↦ U M Vᵀ on the Clebsch matrix, U and V the
  spin-j Wigner matrices. The diagonal case is the general spatial rotation D^l(R) the register lacked; the
  opposite pair reproduces the existing e^{−iθK_z} **by a computation sharing no code with it** (agreement 6×10⁻¹⁶),
  which is the dossier's §18.1 law satisfied on the l-phase convention all of Thread B rests on.

Also: **the clocks are now evaluated exactly.** Every clock is a rational multiple of πn̄^m and every energy a
rational multiple of 1/n², so t/(4πn²) is rational and its fractional part is exact in integer arithmetic —
`clockAutocorr` loses no phase even at n̄ = 200000, where the argument is 1.6×10¹⁹ rad and a double retains nothing.

And one **kill**: adding β₄ to the fold prediction does *not* improve it (the series is asymptotic, not convergent;
the two-term error is worse than the one-term error in every case measured). β₄ is an error estimate, not a
correction — so the dashed curve stays one-term and carries a régime badge instead (tight to 4×10⁻⁶ at β₃ ≤ 0.11,
out of régime beyond β₃ ≈ 0.8).

In the instrument: LADDER gained a SUPERREVIVAL panel (T_sr, γ_sr, the n̄ mod 4 class and its note, the exact
|A(T_sr)| beside the cusp law) and a régime badge; ORBIT's two rotor spheres became **controls** — dragging ⟨J₊⟩
alone is an SO(4) move that is not a spatial rotation, dragging the Kepler panel is the ordinary rotation;
`Register.rotor({which, axis, angle})` is the one road. Proofs: node 37/37 + **48/48**, browser **29/29**.

### the rival's audit (Round 6) and what it changed

The programme's second lab then audited `lab/frontier.js` **as mathematics** (`06-opus.md`, 563 lines) and did what
the protocol exists for: it found a state where the instrument prints something false. Verified, fixed, gated
(`08-fable.md`):

- **The census printed 0 where the truth is 8.** For (3d₊₂, 4p₊₁, 5s) with moduli (1, 76241.394354, 3.7179689892)
  the roots of Φ hide in a dip 1.4×10⁻⁴ wide at the **middle** mode's radial nodes — Φ = −4|Â₊Â₋| < 0 there — and
  the old scan refined only around the *outer* modes' nodes. Reproduced independently at 10⁻⁶ (his four radii to
  eight digits). The law is corrected: **every** radial node of **any** of the three modes is straddled by a pair
  of roots, so #{Φ = 0} = 2(ν₊ + ν₀ + ν₋) + 2c and the census is never zero when a node lies in the window. The
  finder is now node-aware on all three modes, clusters its samples toward the nodes, and walks out from each node
  geometrically to 10⁻⁹. Both his state and the print's are permanent test anchors.
- **The Airy claim was wrong and unattainable.** "Better than 1e-8 on both sides" fails at 1.06×10⁻⁷ near x = 6,
  and 10⁻⁸ *cannot* be reached by this pair of representations; the optimum is 1.05×10⁻⁸ at x* = 5.746. The switch
  moved there and the claim is now ≈1.1×10⁻⁸, anchored at five points straddling it against mpmath.
- **The neglected term of the fold prediction is the chirp, not β₄.** δ = 3πxσ²/n̄ is 67× β₄ at (600, 2, 0.5).
  This completes wave 2's own kill, which showed β₄ makes things worse without saying what the right term was.
  Restoring the chirp cuts the total error 2.15× (9.3× at one point); LADDER now draws the chirped curve.
- Also fixed: `peakLaw`'s "series usable" boundary (0.32 → the measured 0.0555) and a degenerate beat reporting
  NaN for its firing time (three modes of one shell now report T_d = ∞ and no firing time).
- **Independently derived, twice:** the second lab reached the superrevival's mod-4 arithmetic from the Pearcey
  side while wave 2 reached it from the surviving-phase table. The structures agree; the two numerical tables use
  different packet conventions and cannot yet be compared digit for digit (that is Q46).

Proofs after the audit: node 37/37 + **54/54**, browser 30/30.

**A defect the new window found, in the old code.** Adding ORBIT downstream of SHADOW in the render loop exposed a
QWAVE-0 bug: a **folded** window has no size, so SHADOW's phasor radius `min(W·0.32, H/2 − 14)` went negative and
`canvas.arc` threw — killing the rest of the loop, so every window after it silently stopped updating. Layout is
supposed never to affect the instrument (§24). Fixed with a size guard in SHADOW, SPECTRUM, ORBIT and LADDER, and
B16 now folds every window, drives the state behind the fold, and checks that no error is thrown and the invariants
still recompute. Proofs: node 37/37 + 48/48, browser **30/30**.

### wave 3: DYNAMICS — the Lagrangian picture, the action–angle chart, the dipole, and a particle view

`lab/dynamics.js` (DOM-free), `lab/particles.js`, `lab/dynamicsview.js`, proof `tests/dynamics.test.mjs` (18/18).

- **The Lagrangian is exact and it is already here.** The Schrödinger field Lagrangian restricted to this basis
  collapses to the shadow's L = Σp_a q̇_a − H_C: uncoupled oscillators of mass 1/E_a and stiffness E_a, **both
  negative** for a bound state, whose ratio is the physical ω² = E_a². Euler–Lagrange gives q̈ = −E²q, which is the
  Schrödinger equation and nothing else (checked by RK4 of the second-order equation against the closed form to
  1e-9 over 30 a.u.). Along the true motion L(t) = −Σ E_a|c_a|² cos 2θ_a and the action has a **closed form**,
  S(t) = ½Σ|c_a|²[sin 2θ_a(t) − sin 2θ_a(0)] — bounded and periodic, verified against ∫L dt′ at four times.
- **The action–angle chart is the SPECTRUM rail.** J_a = (1/2π)∮p dq = |c_a|², the population, with conjugate angle
  arg c_a. So the rail the user has been dragging all along *is* the action–angle chart of the shadow's phase
  space, and every population being constant is Liouville's theorem for this system.
- **Two virial theorems, both true, saying different things.** The shadow's harmonic one (⟨T⟩ = ⟨V⟩ = ½⟨H⟩, ⟨L⟩ = 0
  over a period — measured to 1e-9) and the atom's Coulomb one (2⟨T⟩ = −⟨V⟩, ⟨T⟩ = −E). Both are on the window.
- **The dipole.** ⟨z⟩ = Σ c*_a c_b ⟨a|z|b⟩ with the exact selection rule (l → l ± 1, fixed m) and Simpson radial
  integrals, anchored on the hand-typed ⟨1s|z|2p_z⟩ = 128√2/243. The flagship preset's dipole is
  ⟨z⟩(t) = 0.7449 cos(0.375 t) — the beat the lab is named for, now readable as a number — with its emission line
  (ω, period, amplitude, and the power a classical dipole of that size *would* radiate; this lab has no radiation
  reaction and the state never decays). A state built from one l has no dipole however it is prepared.
- **New exact moments:** ⟨L_z⟩, ⟨L²⟩ (diagonal, no cross terms), ⟨r⟩, ⟨1/r⟩, and the **entanglement entropy of the
  two SO(4) rotors** — ln 2 for 2s (maximally entangled), 0 for a Stark state (a product). That last one is the
  print's Theorem B.1 read as information rather than geometry.
- **PARTICLES — the particle view.** de Broglie–Bohm trajectories of the same ψ: v = Im(∇ψ/ψ) with **∇ψ analytic**
  (the GPU's own polynomial tables, differentiated; checked against central differences on the recurrence oracle to
  4e-10 over 40 holdout points), integrated by RK4 in the logical clock, so the cloud stands still when the
  transport is paused and scrubs with it. Seeded by rejection sampling from |ψ|², which is the equilibrium
  distribution — a cloud that starts as |ψ|² stays |ψ|², so the cloud *is* the density drawn one trajectory at a
  time. Anchors: the field of 2p₊ is exactly φ̂/(r sinθ) (1e-16) and an integrated orbit closes on itself after
  2πρ²; a **real stationary state has velocity identically zero** (the Bohmian particle of 1s or 2p_z sits still);
  and a trajectory never crosses a persistent nodal surface. It is an observer product: ψ is never touched.

Proofs after wave 3: node 37/37 + 54/54 + **18/18**, browser **32/32**.

### wave 4: STATIC FIELDS, and a palette for the complex plane

`tests/fields.test.mjs` (13/13), `lab/palette.js`, `lab/paletteview.js`, browser checks B19–B20.

**The Hamiltonian is now something you can change, and the instrument says which one is in force.**

- **ZEEMAN** H = H₀ + (B/2)L_z stays diagonal, so it is exact with no caveat (orbital only — this register has no
  spin, hence no anomalous term and no fine structure). It splits m, and 2p₊ + 2p₋ acquires a Larmor beat at
  T = 2π/B that simply does not exist at B = 0.
- **STARK** H = H₀ + F·z is exact **within each shell**: on a shell z = −(3n/2)K_z, whose eigenvectors are the
  parabolic states and are *field-independent*, so they are diagonalised once and the eigenvalues scale with F.
  The n = 2 splitting comes out at the textbook ±3F. Inter-shell coupling is neglected, which needs F ≪ 1/(3n⁵);
  the badge says EXACT WITHIN EACH SHELL, the status line drops from EXACT ANALYTIC, and the bound is printed.
- Two facts worth the price of admission, both proved: **turn the field on and the Stark state stops moving** —
  it has become an eigenstate, and its dipole ⟨z⟩ = −3 a₀ freezes; while **2s Rabi-oscillates fully into 2p_z at
  the splitting 6F yet has an identically zero dipole throughout**, because the transferred amplitude stays in
  quadrature. The state that carries the dipole is the one the field holds still.
- The register keeps its design: it still stores the anchor c(0) and evaluates c(t) in closed form — with a field
  it propagates per (n, m) block instead of per mode, so scrub, edit-at-time and serialisation all still hold
  (an edit at time t still reads back at t, now through the block propagator). Zero field reproduces the
  field-free register bit for bit. DYNAMICS follows: with a field on, the action–angle chart is the **Stark
  basis**, because those are the normal modes.

**The phase palette.** The colouring of the complex plane is now the user's. A palette is a list of stops around
the phase circle, interpolated **in OKLab** to a 256-entry lookup table which the shader samples for the arg ψ
view. OKLab and not RGB because a straight RGB blend between two saturated hues passes through a muddy grey and
paints a false dark band at a phase where nothing is happening. The editor is a strip that *is* the phase circle
(left edge −π, centre 0, right edge +π, wrapping): click to add a stop, drag to move, double-click to remove,
recolour the selected one, rotate or reverse the whole cycle. A ring beside it shows the same palette laid on the
complex plane, and a **seam** readout measures how far the cycle is from closing at ±π — a palette that does not
close there draws a nodal line that is not in the physics. Six presets ship, including the built-in HSV wheel, so
turning the palette off restores exactly the old picture. It lives in OBSERVER and is labelled a DESIGN CHOICE:
ψ is never touched.

Proofs after wave 4: node 37/37 + 54/54 + 18/18 + **13/13**, browser **35/35**.

### wave 5: draw styles with a ceiling, keyboard control, and the 4D ENGINE rotor port

**DRAW STYLES.** The same observable can now be drawn three ways, and all three pass their weight through a
**saturation knee** w ↦ w/(1+kw) so the opacity of a ray step tends to a finite ceiling: cranking EXPOSURE
deepens the blob instead of glowing the whole field. **SOLID** draws the plateau ρ ≈ ISO as a lit surface,
shaded by the density gradient (six texture taps), so EXPOSURE moves the surface inward rather than flooding the
box; **GRAIN** stipples the same field into noisy particles with a per-voxel hash; **CLOUD** is the original
integral. Measured at exposure 12 on 3d_z²: the cloud covers 62% of the frame at mean luminance 56, the solid
plateau holds at 14.5% and luminance 23 — the bound is real, and B21 checks it.

**KEYS.** WASD orbits and QE zooms the camera (never touching ψ); R resets the view; X/Y/Z pick the **rotation
axis** and `[` `]` turn the STATE about it; 1–4 choose which rotor the brackets drive (both = an ordinary
rotation, + or − alone = a genuine SO(4) move, K = the Stark rotation); C cycles the draw style, V the
observable, P the palette; arrows scrub and zoom, shift is a fine step.

**THE 4D ENGINE PORT.** Josh's own 4D ENGINE (`~/Documents/4D ENGINE`, a Rust workspace) and its WebGPU
grand-tour lab (`MANDELBROT/project/research/lab/4dgrand`, live on 8445) carry a mature rotor library,
`tour4.mjs`, built on exactly the group this instrument lives in. Ported to `lab/rotor4.js` with the conventions
kept identical, and gated by their own laws (`tests/rotor4.test.mjs`, 15/15):

- 4D rotations as **quaternion pairs** x ↦ q_L x conj(q_R) — orthogonal and norm-preserving to 4e-16.
- The plane the pair looks at is a point of **Gr⁺(2,4) ≅ S²×S²**, reached two independent ways — from the rotors
  as Ad(q̄_L)ê₁ and −Ad(q̄_R)ê₁, and from the self-dual split of the visible plane's bivector — agreeing to 1e-14.
  Those two spheres are the same ⟨J₊⟩ and ⟨J₋⟩ that ORBIT has been drawing since wave 1.
- The **angle law**: for q_L = exp(Aû), q_R = exp(Bv̂) the principal angles are A ± B while the spheres turn by
  2A and 2B, with the isoclinic cases named (STILL / LEFT- / RIGHT-ISOCLINIC / SIMPLE / DOUBLE).
- **The holomorphy law**, and it is the one that matters here: a motion is U(2) ⊂ SO(4) — complex-linear — iff
  q_L commutes with i, iff **n₊ never moves**. In this instrument's own terms: *driving the minus rotor alone is
  a holomorphic motion of the shell.* Measured: moving the minus rotor leaves n₊ fixed to exactly 0.
- Their design note carried over: dim SO(4) = 6 = 4 (the plane) + 1 visible roll + **1 angle that changes nothing
  you can see**, so the control surface belongs on S²×S², which is what ORBIT and SLICE both use.

**SLICE — a rotatable complex plane.** `lab/slice.js` + `lab/sliceview.js`: ψ sampled on a 2-plane and
**domain-coloured** with the phase palette (hue = arg ψ, brightness = |ψ| through the same bounded knee, faint
bands = contours of |ψ|). Two planes, and they are different objects: **ℝ³**, an ordinary slice through space;
and **KS ℝ⁴**, a 2-plane in hydrogen's own Kustaanheimo–Stiefel 4-space mapped down by the quadratic KS map
(|x| = |u|² exactly, checked to 1e-15, two-to-one). *Correction from Round 10:* this paragraph first claimed the
plane "folds like the Buddhabrot's caustics"; the round proved it does not — the image is a cone over a circle
(see wave 9 below), and the wording here is left corrected rather than erased. Drag to turn it: plain drag moves the minus rotor and is therefore a
holomorphic motion, shift-drag moves the plus rotor and is not; HOLO U(2) snaps to the holomorphic sheet; the
named planes are reached by the **two-slerp geodesic**. The domain colouring is bounded: a gain of a million
still clips at 255.

Proofs after wave 5: node 37 + 54 + 18 + 13 + **15**, browser **37**.

### wave 6: the confining side (QCD), and what the round refuted

Round 9 of the programme (`research/adversarial-2026-09-02/09-opus-qcd.md`, 51 KB) audited a seed of mine and
killed half of it. `lab/qcd.js` + `tests/qcd.test.mjs` (14/14) hold what survived.

**The Airy bridge: the operator is exact, the spectroscopy is refuted.** For a purely linear potential V = σr the
l = 0 radial equation *is* Airy's equation, with no approximation — so the levels are E_n = (σ²/2μ)^{1/3}|a_n|,
the same function that governs the revival envelope in Thread A of the print. Our Numerov solver reproduces those
closed-form levels to 1e-9. But the ratio E₂/E₁ = |a₂|/|a₁| = 1.7484 is **rigid**, so every splitting scales as
μ^{−1/3} and bottomonium should sit at 0.679 of charmonium — where the measurement is 0.956. **41% wrong on the
one test with no free parameter.** Fitting Δ ∝ μ^{−p} to the data gives p = 0.039: not a power law at all but a
**logarithm**, and indeed a logarithmic potential gives the two systems the *same* splitting to a part in 10¹²,
which is the flavour independence the data actually shows. The Coulomb term does not shift the Airy zeros — it
removes the boundary condition that selected them.

**Cornell, checked both ways.** With α_s = 0.39, σ = 0.18 GeV², m_c = 1.5, m_b = 4.8 GeV the 2S−1S splittings
come out 0.6036 and 0.5810 GeV, agreeing with Round 9's independent Numerov *and* matrix diagonalisation to six
digits, and their ratio 0.9625 sits 0.7% from the measured 0.9559. A potential model predicts **splittings**;
absolute masses need the constant V₀ every such model carries, so the instrument fits V₀ to the ground state and
then the 2S mass is a genuine prediction: 15 MeV out of 3.7 GeV for ψ(2S), 22 MeV out of 10 GeV for Υ(2S).

**The string, exactly.** The Regge slope of the relativistic string α′ = 1/(2πσ) = 0.8842 GeV⁻², within 3.4% of
the measured ρ-trajectory slope — and the non-relativistic linear potential gives E ∝ L^{2/3}, no trajectory at
all, so the number supports the string and not the potential. The Lüscher term −π(d−2)/24r is universal, and the
flux tube widens logarithmically with coefficient (d−2)/2πσ = 0.0689 fm² per e-fold. Those four are exact; a
drawn tube interior would be a **model** (dual-abelian-Higgs vortex profile) and must say so.

**What the round also did to the corpus and to my own theorems.** It showed that the saddle ladder (A.9) does
**not** apply to the plaquette integral — its saddle is a truncation artifact where the plaquette's is global —
and it found that the corpus's constant C = 3/(16b₀) is off by exactly 3/8, which makes a celebrated 0.94%
near-miss there evaporate. It also gave the corpus's own measured 6j constant 0.87√j a closed form,
8√2/Γ(1/4)² = 0.8606822.

The QCD window (`lab/qcdview.js`) draws the predicted ladder beside the PDG levels, prints the splitting, the bb̄/cc̄ ratio and the V₀-fitted 2S mass with their labels, and under the LINEAR potential prints the Airy spectroscopy as REFUTED with its rigid 0.679 ratio (B22).

Proofs after wave 6: node 37 + 54 + 18 + 13 + 15 + **14**, browser **38**.

### wave 7: momentum space — the same state, two exact pictures

`lab/momentum.js` + `tests/momentum.test.mjs` (9/9) + browser B23. The OBSERVER window gained a SPACE switch:
**POSITION ψ(x)** or **MOMENTUM φ(p)**, and the GPU grid then holds the Fourier transform of the state, exactly.

**Closed form.** Hydrogen's momentum wavefunctions are closed-form (Podolsky–Pauling 1929): φ_nlm = (−i)^l F_nl(p)
Y_lm(p̂) with F_nl a Gegenbauer polynomial in (n²p²−1)/(n²p²+1) over a rational envelope. Writing t = n²p² and
clearing the denominator, F_nl = N·t^{l/2}·P_nl(t)/(1+t)^{n+1} with P_nl of degree n−l−1 ≤ 5 — **the same
polynomial-times-envelope record the kernel already evaluates**, so momentum space cost the shader one branch
(a different envelope) and the CPU one table builder. The (−i)^l is a per-mode phase folded into the coefficient.

**The oracle is the Fourier transform itself.** The closed form was checked against the Hankel transform
√(2/π)∫j_l(pr)R_nl(r)r²dr of the lab's *own* position-space radial functions for eight (n,l): they agree to
**1e-11 of the peak, with the same sign**, so the phase convention is pinned with no extra (−1) anywhere. All
21 (n,l) with n ≤ 6 are normalised to 1e-7 and orthogonal across n; the table twin equals the closed form to
1e-15. On the GPU, **Parseval holds on the grid**: for 2p₊ the position box integrates to 0.9992 and the momentum
box to 0.9973 (96³, f16), and switching back restores the position integral to the last digit.

**Fock's map**, ξ = (2p₀p, p₀²−p²)/(p₀²+p²) with p₀ = 1/n, lands on the unit S³ and inverts (1e-14); p = 0 is
the north pole and p = p₀ the equator. Under it each shell becomes the hyperspherical harmonics of one degree, on
which SO(4) acts by **rigid rotation** — the hidden symmetry made literal: the rotors that reshape the position
picture merely turn the momentum one. Round 10 (running) is deriving the exact quaternion action so that
statement can be gated on the instrument.

The vortex and particle overlays are position-space objects and are cleared in momentum space; the badge reads
`±h a₀⁻¹ · MOMENTUM` and the box auto-scales to 2.6/n_min.

Proofs after wave 7: node 37 + 54 + 18 + 13 + 15 + 14 + **9**, browser **39**.

### wave 8: the SLAP — a sudden impulse, exactly, with the loss reported as physics

`lab/kick.js` + `tests/kick.test.mjs` (11/11) + browser B24; STATE gained a SLAP group (impulse k, axis, SLAP)
and the K key slaps along the X/Y/Z axis.

**The operator.** A sudden impulse k is ψ ↦ e^{ik·x}ψ — a boost, which in momentum space is a shift φ(p) ↦
φ(p−k). It is also exactly what a delta-pulse electric field does (Δp = −∫E dt), so the slap is the impulsive
Stark limit; a *magnetic* slap is a rotation of the state, which the rotor drive already is. On the register the
boost is the matrix ⟨a|e^{ikz}|b⟩ = Σ_L i^L(2L+1)·A_L(a,b)·∫R_aR_b j_L(kr)r²dr — the plane wave's multipole
expansion — so every element is a k-independent angular integral (built once) times a one-dimensional radial
integral per kick. A kick along x or y is the z-kick conjugated by a spatial rotation, R⁻¹e^{ikz}R = e^{ik(R⁻¹ẑ)·x}.

**Two routes to every element.** The multipole route was checked against the momentum-space *shift* overlap
∫φ_a*(p)φ_1s(p−kẑ)d³p built from wave 7's closed-form momentum functions, for all 21 m = 0 states at k = 0.3:
they agree to 3e-5, with the oracle's own grid converging onto the multipole value from below. As k → 0 the
1s→2p₀ element over k goes to the dipole 128√2/243 to 1e-5, and the 1s diagonal to 1 − k²⟨z²⟩/2 with ⟨z²⟩ = 1.

**The loss is physics.** The boost is unitary on the full space, but the register holds n ≤ 6, so |Mc|² < |c|²:
a slap of k = 0.1 on 1s knocks **0.31%** of the electron out of the register — k²·(⟨z²⟩ − Σ_{n≤6}|⟨np|z|1s⟩|²)
= k²·0.303, the continuum-plus-n>6 share of the sum rule — and the instrument prints ESCAPED rather than
renormalising it away. **Ehrenfest with a deficit:** the register's ⟨p_z⟩ after the slap is 0.546·k, the bound
share of the Thomas–Reiche–Kuhn sum rule (Σf_{1s→np}, n ≤ 6 = 0.4162+0.0791+0.0290+0.0139+0.0078); the missing
45% is the continuum a six-shell register cannot hold. ⟨p_z⟩ by Heisenberg's p = i[H,z] agrees with a direct
∫p|φ|²d³p on a 44³ momentum grid to 2%; a slap along x gives ⟨p_x⟩ > 0, ⟨p_z⟩ = 0 by the same integral, which
also fixed the sign of the rotation conjugation.

**Then it jiggles.** The slapped state is a superposition (|c_{2p₀}|² = k²·0.555 at small k) and rings at its
beats by the exact evolution — DYNAMICS' dipole shows the Lyman-α ringing. Two things learned on the way: a
readout that rotates a copy of the state must sum over the *whole* register, because a rotation moves amplitude
between m; and the box scale now ignores populations below 1e-3 of the norm, since a slap's 1e-4 tails in n = 6
otherwise blow the box up to ±92 a₀ and hide the jiggle.

Proofs after wave 8: node 37 + 54 + 18 + 13 + 15 + 14 + 9 + **11**, browser **40**.

### wave 9: Round 10 — the hidden symmetry gated, the slice corrected, the rival's theorem bounded

`research/adversarial-2026-09-02/10-fable.md` (Fable, lead; probes `bf-r10-*`). Three results went straight into
the gates, and one of them corrected this report.

**The rigid-rotation gate (§1.4).** The round found, by exhaustive search over the eight candidate conventions,
the *unique* identification under which every rotor drive of a shell is a rigid rotation of Fock's sphere:
identify ξ ∈ S³ with the quaternion x = [ξ₄, ξ₁, ξ₂, ξ₃]; a drive of angle θ about â is h = exp(θâ/2); the plus
rotor is (h, 1), the minus rotor (1, h), a spatial rotation (h, h), the Runge–Lenz boost (h, h̄); then
φ′(p)(p₀²+p²)² = φ(p_back)(p₀²+p_back²)² with ξ(p_back) = q̄_L ξ(p) q_R. Only one of the eight closes (and its
mirror, which is the same map); the other six fail at order one. **Gated in `tests/momentum.test.mjs`: 576
momenta, shells 2/3/4/6, all four drives, three axes, two angles — 1e-13.** So the momentum panel is the one on
which *every* SO(4) control of the print is a visible rigid rotation, exactly as Theorem B.2 promised and the
position panel cannot show. The Fock identity itself (F_nl Y_lm = (−1)^{n−l−1}·4p₀^{5/2}/(p₀²+p²)²·𝒴_{n−1,l,m}(ξ))
was measured to 1e-14 on ten states, the sign traced to Podolsky–Pauling's Gegenbauer argument being −cos χ.

**The KS-slice theorem (§2) — and a correction.** Lemma: the lab's KS map is KS(u) = A·(u k ū) with A a fixed
half-turn, so its fibres are RIGHT multiplication by k (computed, not assumed: the five other unit-imaginary
multiplications fail at order one). Theorem: the image of a 2-plane through the origin is a **cone over a
circle** — axis A·n₊ on the plus sphere, half-angle arccos|n₋z| from the minus sphere — with Jacobian singular
values 2ρ and 2ρ√(1−n₋z²) at *every* point. Therefore the slice **never folds**: no caustic at any rotor. It
collapses to a single ray iff n₋ = ±ê₃ (the minus sphere at a pole, the plus sphere free) and flattens to a whole
plane at the minus sphere's equator. The posed corollary ("a holomorphic drag never changes the degeneracy") is
**refuted**: the lab's holomorphy law lives on the plus sphere (left-i structure) and the KS fibres on the minus
sphere (right-k structure); the two commute and live on opposite factors, and a minus-rotor drag from a
degenerate plane gives σ₂/σ₁ = sin θ exactly. Wave 5's paragraph claimed the plane "folds like the Buddhabrot's
caustics"; that was wrong and is corrected above rather than erased, the header comment of `lab/slice.js` is
rewritten, and the SLICE readout now prints the cone's half-angle, FLAT or COLLAPSED. **Gated in
`tests/rotor4.test.mjs`: σ₂/σ₁ = √(1−n₋z²) to 1e-12 over 60 random rotors and points, the axis identity to
1e-15, the collapse at both poles to 1e-15.**

**Q52 — the rival's Theorem Q1 is a two-colour accident.** With 44 exact strong-coupling coefficients of the
SU(3) plaquette (Weyl integration, tensor Gauss–Hermite, rationals recognised to 1e-20) the Borel constant is
bracketed by monotone two-sided Richardson sequences: **A₃ = 4/3**, the involution class diag(1,−1,−1), not the
centre's 3/2. So "the Borel constant is the action of a centre flip" is true at N = 2 and false at N = 3; what
survives is *the nearest real critical value of Re tr U*. Corpus consequence: Y-0111's C₃ = 3π²/11 is off by
exactly 16/9; the constant that closes is C₃ = 16π²/33. Q49, Q50, Q51, Q53, Q54 answered with numbers; Q55–Q60
posed; NOT CERTIFIED lists ten items, the first being that the rotor law is measured, not derived from the
Clebsch matrix.

Proofs after wave 9: node 37 + 54 + 18 + 13 + **17** + 14 + **10** + 11, browser 40.

### wave 10: the Kepler orbit — the quantum/classical boundary inside the machinery

`lab/kepler.js` + `lab/keplerview.js` + `tests/kepler.test.mjs` (9/9) + browser B25; ORBIT gained a KEPLER
ORBIT switch and the stage a third overlay.

**The two sphere points ARE a classical orbit.** On a shell n, J± = (L ± K)/2 with K the Runge–Lenz vector scaled
to the shell (Pauli: K² + L² = n² − 1). Classically a Kepler orbit of energy −1/(2n²) has a = n² from the energy
alone, e = |K|/n, K̂ toward the perihelion, L̂ its normal, and T = 2πa^{3/2} = 2πn³ — Kepler's third law is the
revival clock T_cl. So the orbit window's n₊ and n₋ determine the ellipse: the angle between them is the
eccentricity, their sum is the angular momentum, the shell is the size. A coherent state (the print's Gr⁺(2,4)) is
the state that sits on its ellipse; any other shell state carries the orbit of its mean vectors, drawn dashed.

**Gated facts.** The circular state |n, n−1, n−1⟩ carries a circle of radius n² in the plane ⟂ ẑ with L = n − 1
(1e-12) — slightly sub-classical, since the angular momentum alone implies e_L = √(2n−1)/n = 0.553 at n = 6,
which vanishes only as n → ∞. **The Stark rotation e^{−iθK_x} turns that circle into an ellipse of eccentricity
sin θ** — |K| = (n−1) sin θ, |L| = (n−1) cos θ exactly (1e-15) — which is precisely what it does classically.

**The boundary, exact.** Pauli's replacement ⟨x⟩ = −(3n/2)⟨K⟩ was gated against the exact dipole on fifteen random
single-shell states (quadrature-limited at 3e-8), and the classical orbit's **time-averaged position** by the area
law — the body lingers at aphelion, at −(3/2)·a·e·K̂ — equals that quantum centroid to 1e-13. So the quantum
centroid of a shell state *is* where the classical body spends its time, with no limit taken. The overlay draws
the ellipse over the cloud with the perihelion dotted and that shared point crossed.

Proofs after wave 10: node 37 + 54 + 18 + 13 + 17 + 14 + 10 + 11 + **9**, browser **41**.

### wave 11: the Hamiltonian selector, and the harmonic oscillator

`lab/qho.js` + `lab/hamiltonian.js` + `tests/qho.test.mjs` (11/11) + browser B26; SPECTRUM gained a HAMILTONIAN
eigen-selector. The register's 91 labels (n, l, m) now name eigenstates OF a chosen operator.

**The oscillator, exactly.** ψ = N·r^l e^{−r²/2} L^{(l+½)}_{n_r}(r²) Y_lm with E = N + 3/2, N = 2n_r + l — a
polynomial in r² times a Gaussian times the same spherical harmonics, i.e. the kernel's own record with a third
envelope (e^{−r²/2} beside e^{−ρ/2} and (1+t)^{−(n+1)}). The 91 labels are reused through n_r = n − l − 1, a
truncation n_r + l ≤ 5 complete in m. Momentum space is the same picture with the phase (−i)^N per mode: no new
table. Gated against **the Schrödinger equation itself**: a fourth-order finite-difference Laplacian on the closed
forms returns (N + 3/2)ψ to 1e-7 for half the register at random points; normalisation and orthogonality to
1e-14; the virial ⟨½r²⟩ = E/2 to 1e-14; Γ(m+½) and the half-integer Laguerre coefficients in closed form.

**Ehrenfest, exact.** A slap on the oscillator's ground state is an exact coherent state, and a coherent state
moves like a classical particle without dispersing. Gated: e^{ikz}|0⟩ at k = 0.5, evolved with the register's
energies, has |ψ(x,t)|² equal to the ground-state Gaussian translated to k·sin t at five times and four points to
4e-6 of the peak — and that residual is the register's edge (n_r + l ≤ 5 lacks the l = 6 piece of N = 6; captured
1 − 1e-9). At k = 0.8 the same test reads 7e-5, which is exactly √(9e-8) of the norm truncated. On the instrument
(B26): a slap of k = 0.5 on the oscillator loses **3e-10** of the norm and the register's ⟨p⟩ reads **0.5000** —
where hydrogen's slap lost 0.3% and kept 0.546k. That is the sharpest quantum/classical contrast the lab holds:
the same button, a quadratic Hamiltonian and a Coulomb one.

**The selector.** `hamiltonian.js` is the single source of the operator in force: energies, radial functions,
kernel tables and envelope code, momentum tables, the box, Stark availability, and whether the hydrogen theorems
apply. Windows that are theorems about hydrogen (ORBIT, LADDER, VORTEX, DYNAMICS, SLICE, and the KEPLER and
particle overlays) stand down when the operator is the oscillator; the Stark field is off there (a displaced
oscillator is exact too, but is not built). The SPECTRUM ladder draws the oscillator's levels N = 0…10 with no
continuum, and every per-state energy label re-reads from the operator in force.

**A register bug the oscillator found.** The operator hook `_op` took a fast path for operators that commute with
H — true of every rotor, false of a slap — so a slap "at t" acted on the anchor at t = 0. The oscillator exposed
it at once: a slap at clock time 4 read ⟨p⟩ = k·cos 4 = −0.65k. Fixed (a slap always acts on c(t) and re-anchors)
and gated in `tests/kick.test.mjs`.

Proofs after wave 11: node 37 + 54 + 18 + 13 + 17 + 14 + 10 + **12** + 9 + **11**, browser **42**.

### wave 12: the BOW — pull the wave like drawing a bow, and see the exact boosted state while you pull

Josh's gesture (with a Falstad-applet screencast as the reference): hold CTRL, press on the atom, pull away; the
wave shows a rising frequency in the pull direction; release fires, releasing CTRL first cancels. Built so that
what you see while pulling is not a mock-up but the true boosted state.

**The preview is exact and free.** A boost multiplies ψ by a plane wave e^{ik·x}, which leaves the density alone
and puts fringes of wavelength 2π/k into the phase. The renderer now carries a preview-boost uniform and
multiplies the sampled field by that phase at draw time — no recompute, so the pull runs at the presentation
rate — and the picture switches to the phase view while the bow is drawn, so the fringes tightening as you pull
are literally the boosted state's phase (λ = 2π/k is printed on the bowstring). 120 px of pull is 1 a.u. of
momentum, capped at 3; the arrow flies opposite the pull, in the screen plane (orbit the camera to aim out of
it). Release commits the slap to the register at the current logical time; the register's image loses the escaped
fraction, which the readout prints beside the momentum gained — the difference between the preview and the
committed state is exactly the continuum.

**Any direction.** The slap now goes along any unit vector by two rotations (about z by −φ, about y by −θ) onto
ẑ, the z-kick, and back. Gated by the momentum-space integral: a kick along (1,1,1)/√3 gives ⟨p⟩ along that
direction to cos = 1.000 with the bound-share magnitude 0.546k.

**The DRAG toy, labelled.** A knob γ makes excited amplitudes decay as e^{−γ(E_a−E_0)t}, forward in time only:
the wave settles to the ground state and the norm it loses is what the toy radiated away. It is NOT physics and
the instrument says so everywhere — the knob reads TOY, the status line reads TOY DRAG · NON-UNITARY while it is
on, and γ = 0 is the exact unitary register again (gated: the 2p population of 1s+2p at γ = 0.1 is exactly
e^{−0.75} at t = 10, 1s untouched, nothing backwards in time). With the oscillator selected and γ on, a slapped
atom bounces in its bowl and settles; with γ off it bounces forever and, for hydrogen, revives.

Browser B27: a 240 px pull draws k = 2.0 with the boost on and the phase view up; CTRL-release cancels with ψ
untouched; a 120 px pull and release slaps k = 1 and drops the norm; the toy bleeds norm and announces itself.

Proofs after wave 12: node 37 + 54 + 18 + 13 + 17 + 14 + 10 + **16** + 9 + 11, browser **43**.

### wave 13: keys you can rebind, and the first molecule

**KEYS.** The key switch is now an action table (`ACTIONS` in `lab/rack.js`), every entry rebindable from a
KEYS panel in OBSERVER (click the chip, press the new key; Esc cancels; RESET KEYS restores) and remembered in
localStorage. Josh's three: **H** hides the interface — rack, badges, title, hint, transport, sheet and the
frame — and brings it back; **TAB** brings the next window to the top of the rack and unfolds it (Shift+TAB the
previous), cycling in the windows' original order; **Ctrl+R** reseeds the particles (the browser reload is
suppressed). Shift stays the fine step for the stepping keys. Browser B28 exercises all of it, including a
rebinding of the camera reset from R to T that takes effect at once and is saved.

**H₂⁺ — the first molecular orbital.** `lab/molecule.js` + `lab/moleculeview.js` + `tests/molecule.test.mjs`
(9/9) + browser B29. Two protons at ±R/2 on the z-axis, one electron in the 1s LCAO basis. The three two-centre
integrals are closed-form — S = e^{−R}(1+R+R²/3), J = −1/R + e^{−2R}(1+1/R), K = −e^{−R}(1+R) — and **gated by
direct quadrature** of the 1s orbitals (2e-5; K carries the 1/r cusp and converges slowest, 5e-5). The two
molecular orbitals σg = (a+b)/√(2(1+S)) and σu = (a−b)/√(2(1−S)) are the **variational** solutions of the 2×2
secular problem, E_g = −½ + (J+K)/(1+S) + 1/R and E_u = −½ + (J−K)/(1−S) + 1/R: an upper bound at every R,
gated against the **exact** Bates–Ledsham–Stewart energies at R = 1, 2, 3, 4 (above by 0.163 at R = 1, where
frozen 1s orbitals are worst, down to 0.009 at R = 4), drawn as dots on the potential curves. The textbook
numbers come out: R_e = 2.49 a₀ and D_e = 1.76 eV against the exact 2.00 a₀ and 2.79 eV — the bound is honest
about the contraction the frozen orbitals cannot do. σu has its nodal plane at z = 0 (1e-15); every state stays
normalised in the non-orthogonal basis (1e-14); at R = 30 both orbitals dissociate to −½.

**The first molecular dynamics.** The electron placed on A — (σg√(1+S) + σu√(1−S))/√2 — evolves exactly within
the space and **tunnels to B and back** with period 2π/(E_u − E_g) = 16.0 a.u. at R = 2: population 1 on A at
t = 0, 0 at T/2, 1 at T (1e-12). Hydrogen's electron hopping between two protons, and the MOLECULE window's
live Mulliken population shows it.

**The kernel learned centres.** The mode record gained a centre (7 vec4, 112 bytes) and the compute pass takes
its geometry relative to it, so an orbital can sit on a nucleus off the origin. B29 is the GPU gate: with the
molecule holding the field, σg and σu — two 1s functions centred at ±1 — integrate to 1 on the grid, exactly as
the non-orthogonal normalisation says they must; the atom's windows stand down while the molecule holds the
field, and OFF gives the atom back.

Proofs after wave 13: node 37 + 54 + 18 + 13 + 17 + 14 + 10 + 16 + 9 + 11 + **9**, browser **45**.

### wave 14: the optimisation round, measured, and the box

**Measure first.** The render loop now times every stage (an exponential average of milliseconds per frame) and
METERS prints the FRAME PROFILE beside a PERFORMANCE switch. The first reading, in headless Firefox with the
software WebGPU the gate runs on, was decisive: with the reconnection preset playing, the SLICE window cost
**6–8 ms every frame** — it re-sampled a 128² plane through every populated mode each frame because its cache key
carries the time — and with particles on, the overlays cost **20 ms** for 160 particles.

**Then change what the numbers say.** The slice re-samples at most eight times a second while playing and never
when folded; the particle integrator asked the register for fresh coefficient arrays at every substep of every
particle (about two thousand register evaluations a frame) and now evaluates each substep time once, shared by
all particles; the slice's per-paint offscreen canvas is allocated once. **120 Hz mode** updates the CPU windows
(spectrum, shadow, orbit, dynamics, slice, meters) every fourth frame and steps the particles every other frame
(the integrator uses the logical dt, so nothing is skipped) while the FIELD and the overlays present every
frame. Before/after on the same headless machine, reconnection preset, playing:

| case | before | after |
|---|---|---|
| standard picture, JS per frame | 12.5 ms | **5.9 ms** (slice 2.2, overlays 1.6, shadow 0.8) |
| 160 particles on, JS per frame | 29.3 ms | **16.0 ms** (12.4 in 120 Hz mode) |
| 160 particles on, frames/s | 28 | **49** |

The GPU encode is 0.2 ms throughout. 5.9 ms is inside a 120 Hz frame (8.33 ms) on the CPU side; the display's
refresh rate caps what the browser will deliver, and METERS says so. B30 gates the profile and the mode.

**The box.** `lab/well.js` + `tests/well.test.mjs` (6/6) + browser B31: the infinite spherical well as the third
Hamiltonian. ψ = N j_l(kr) Y_lm inside r < a and 0 outside, with ka the (n_r+1)-th zero of j_l and E = z²/(2a²);
the 91 labels reused through n_r = n − l − 1; a WELL RADIUS knob (3–30 a₀, default 10). The zeros are found by
bracketing and bisection (j₁ at 4.493409, 7.725252; j₂ at 5.763459; j₅ at 9.355812, all to 1e-6 against the
tables); every radial function is normalised and orthogonal to 1e-14; the wall is hard (ψ(a) = 0 to 1e-12); and
**the Schrödinger oracle** — a fourth-order finite-difference Laplacian on the closed forms — returns z²/(2a²)·ψ
to 1e-8 inside the well. On the GPU the kernel gained a fourth envelope branch with **its own spherical Bessel**
by Miller's downward recurrence in WGSL; B31 integrates both the ground state (j₀) and a d state (j₂) to 1 on
the grid. A slapped packet bounces off the wall and disperses — the box is not quadratic, so there is no
Ehrenfest miracle here — and with the DRAG toy it settles. Momentum space of the well is not built; the selector
forces position space. `sphericalBessel` moved to `lab/bessel.js` so that well → kick → hamiltonian → well is
no longer an import cycle.

Proofs after wave 14: node 37 + 54 + 18 + 13 + 17 + 14 + 10 + 16 + 9 + 11 + 9 + **6**, browser **47**.

### wave 15: the hydrogen-like ion — the periodic table's first column, by exact scaling

`tests/zion.test.mjs` (7/7) + browser B32; SPECTRUM gained a **Z** knob (1–6) beside the Hamiltonian selector.

He⁺, Li²⁺, … are hydrogen with lengths divided by Z, energies multiplied by Z², momenta multiplied by Z — and
nothing else. The instrument does exactly that: ψ_Z(x) = Z^{3/2}ψ(Zx), E → Z²E, φ_Z(p) = Z^{−3/2}φ(p/Z). The
kernel tables keep their polynomials and change their scale (n → n/Z, so ρ = 2Zr/n) and norm (×Z^{3/2}); the
momentum tables keep the envelope exponent n+1 explicitly (a new slot in the record, since the scale n/Z would
otherwise leak into the exponent — the CPU twin had to learn the same slot). Gated: the scaled radial functions
stay normalised (1e-8) with ⟨r⟩_1s = 1.5/Z; the kernel tables equal Z^{3/2}ψ(Zx) and Z^{−3/2}φ(p/Z) at random
points to 1e-16; on the GPU the scaled 2p₊ of He⁺ integrates to 1 in position space (0.9992) and in momentum
space (0.9972), the box halves to ±8 and the momentum box doubles. The hydrogen-theorem windows are written in
hydrogen's own units and stand down for Z ≠ 1 (ORBIT's invariants are dimensionless and stay); the Stark blocks
assume Z = 1 and are off there. Z = 1 restores everything bit for bit.

Proofs after wave 15: node 37 + 54 + 18 + 13 + 17 + 14 + 10 + 16 + 9 + 11 + 9 + 6 + **7**, browser **48**.

### wave 16: HELIUM — the first many-body atom, the hard way, and electron correlation on screen

`lab/helium.js` + `lab/heliumview.js` + `tests/helium.test.mjs` (13/13) + browser B33.

**Hylleraas, algebraically.** Two electrons, a nucleus of charge 2, no mean field. In s = r₁+r₂, t = r₁−r₂,
u = r₁₂ the singlet ground state is ψ = e^{−ζs}Σc·s^a t^b u^c (b even), the volume element is ∝ u(s²−t²), the
potential is V·u(s²−t²) = −8su + (s²−t²), and the kinetic energy is the functional
∫[u(s²−t²)(ψ_s²+ψ_t²+ψ_u²) + 2s(u²−t²)ψ_sψ_u + 2t(s²−u²)ψ_tψ_u]. Every integral that appears is
∫e^{−2ζs}s^a t^b u^c over the wedge = [2/(b+1)]·[1/(b+c+2)]·(a+b+c+2)!/(2ζ)^{a+b+c+3}, so the whole problem
is polynomial algebra (a small symbolic engine over monomials, with derivatives) plus a generalised eigenproblem
(Cholesky + Jacobi), with ζ optimised by golden section. **Exact integrals, variational energy.**

**The ladder, reproduced.** One term: ⟨T⟩ = ζ² and ⟨V⟩ = −27ζ/8 fall out of the algebra to 1e-12, so ζ = 27/16 and
E = −2.847656, the textbook screened helium. Hylleraas's three terms {1, u, t²}: **−2.902432** (1929: −2.90243).
Six terms: −2.903329. Ten terms: **−2.903523, 0.2 millihartree above the exact −2.903724** — and every step is a
rigorous upper bound, ordered one > three > six > ten > exact. The monomial integral was checked against a
brute-force triple quadrature (1e-6); ψ(x₁,x₂) = ψ(x₂,x₁) to 1e-15; the Kato cusp ∂ψ/∂u = ψ/2 at coalescence
reads 0.34 with six or ten terms (the basis carries no cusp constraint, and the instrument says so).

**Electron correlation, made visible.** Fix electron 1 at a point and the conditional amplitude ψ(x₂ | x₁) is a
closed-form function of x₂ — s = r₁+r₂, t = r₁−r₂, u = |x₂−x₁| — which the kernel now draws with **one record per
Hylleraas term** (a fifth branch: nlm = (a, b, c, ζ), the centre = x₁). The HELIUM window places electron 1 with
two knobs and hands the field to the conditional density ρ(x₂ | x₁) ∝ |ψ(x₁,x₂)|²: the Born rule and nothing
else. Move electron 1 and electron 2's cloud moves away from it — the correlation hole readout gives ρ at
electron 1's own position over ρ at the opposite point, 0.26 at r₁ = 0.8 — which is the entanglement of the
singlet pair on screen with no interpretation added. This is the object the EPR layer will be built on.

Proofs after wave 16: node 37 + 54 + 18 + 13 + 17 + 14 + 10 + 16 + 9 + 11 + 9 + 6 + 7 + **13**, browser **49**.

### wave 17: the box as a one-atom gas

`wellPacket` / `wellCentroid` in `lab/well.js`, three gates in `tests/well.test.mjs` (9/9), browser B34; SPECTRUM
gained a GAS row (σ, |k|, LAUNCH, and a readout of how much of the packet the box holds) and the BOW launches a
packet in the box.

**Why the box showed a huge blob.** Selecting the well left the register on its ground state, and the well's
ground state fills the well. A gas needs a **packet**: a Gaussian of width σ at x₀ with momentum k, projected
onto the well's 91 eigenstates on a grid and normalised as a *new* state. The box resolves nothing sharper than
≈ a/6 — the wavelength of its highest state — so the projection cannot hold an arbitrarily tight packet, and the
readout says how much it holds (a σ = 1.6 packet in a radius-10 box: 97%, spread over 27 states).

**It flies and it bounces, by the exact evolution.** Gated: the packet starts where it was put (centroid at
z = −3.87 for a launch at −4), moves 2.3 in three time units for k = 0.8 (Ehrenfest, until the wall), and at
t = 14 sits at z = +4.7 with unit norm — back from the wall, where free flight would have put it at 7.2. On the
GPU (B34) the launched packet integrates to 1 before and after the flight and the grid changes as it moves.

**The bow in the box.** In BOX mode a bow release does not slap the ground state; it launches a packet *where you
pressed* (the press point unprojected onto the plane through the origin facing the camera, kept inside the wall),
flying along the arrow at the pull's momentum. Josh asked whether a harder pull could make the packet tighter: a
boost by itself never changes a width, so the tightening is a **launch parameter** — σ shrinks slightly with the
pull — and the note says it is a design choice, not physics. The GAS row's LAUNCH button puts a packet at −a/2 on
the chosen axis with the |k| knob's speed.

Proofs after wave 17: node 37 + 54 + 18 + 13 + 17 + 14 + 10 + 16 + 9 + 11 + 9 + **9** + 7 + 13, browser **50**.

### wave 18: H₂ — the bond, the collision, and a density that is not an orbital squared

`lab/h2.js` + `lab/h2view.js` + `tests/h2.test.mjs` (8/8) + browser B35; the render cap raised from 32 to the
whole 91-state register.

**Heitler–London, exactly.** Ψ± = [a(1)b(2) ± b(1)a(2)]/√(2(1±S²)) with energies E± = −1 + 1/R +
[2J + J′ ± (2SK + K′)]/(1 ± S²). The one-electron integrals are H₂⁺'s; the two-electron Coulomb integral
J′ = 1/R − e^{−2R}(1/R + 11/8 + 3R/4 + R²/6) is **gated by direct quadrature** of one 1s density against the
exact potential of the other (3e-5); the exchange integral K′ is Sugiura's closed form with the exponential
integral E₁, which is gated against the tables at 0.5, 1 and 4 (1e-8) with its series/continued-fraction seam
checked. The textbook comes out: **R_e = 1.64 a₀ and D_e = 3.16 eV** against the exact 1.40 a₀ and 4.75 eV, a
variational bound; the **triplet is repulsive at every R** — Pauli repulsion is the electrostatics of the exchange
density; both curves reach two free atoms at −1.

**The collision.** Two atoms thrown at each other from R = 8 with 0.02 hartree of relative kinetic energy, the
nuclei classical on the curve (Born–Oppenheimer; μ = m_p/2 = 918.08; velocity Verlet). On the triplet they
**bounce**: the exchange repulsion turns them around at R = 3.44, and they leave with the speed reversed, energy
conserved to two parts in ten thousand. On the singlet they fall into the bond well below R = 1 and, with nothing
to carry the energy away, climb back out. The H₂ window runs it on a **nuclear clock** that ticks faster than the
electron clock (×300 by default, a display choice, labelled) and prints R, the turning point and the spin state.

**A density the kernel could not draw before.** The Heitler–London one-electron density
ρ = [a² + b² ± 2S·ab]/(1 ± S²) is not the square of any single orbital — that is correlation — but it is an
incoherent sum of two: w_g|σg|² + w_u|σu|² with w_g = (1+S)²/(1+S²), w_u = (1−S)²/(1+S²) for the singlet and
1, 1 for the triplet (so w_g + w_u = 2 electrons). The kernel gained a sixth branch: two coherent groups (a
group id in the record's spare slot) summed incoherently and stored as √ρ. **B35: the GPU integrates that density
to 1.998 electrons at R = 6 (triplet) and at R = 1.4 (singlet)**, the collision on the triplet turns at 3.44 with
the nuclei mid-flight at 5.06 a time-and-a-half later, and OFF gives the atom back.

**The render cap.** A gas packet launched off-axis populates all 91 states; the renderer capped at 32 and drew
72% of the norm. The cap is now the whole register (MAX_MODES 96). Measured with a 91-state packet: the GPU
encode stays negligible; the SHADOW window, which draws every populated mode, becomes the CPU hotspot at 12 ms
when unfolded — the 120 Hz mode's every-fourth-frame cadence covers it, and it is noted for the audit.

Proofs after wave 18: node … + **8**, browser **51**.

### wave 19: the CALCULUS engine — the stats, derived live, with their laws and residuals

`lab/calculus.js` + `lab/calculusview.js` + `tests/calculus.test.mjs` (5/5) + browser B36; a CALCULUS window.

Josh asked for an engine that "explicitly shows the stats". Every row of the new table is an expectation value
computed from the register with exact matrix elements, the **law** that constrains it, the value the law
**predicts**, and the **residual** the law leaves. Time derivatives are centred differences of the *exact*
evolution (c(t ± h) = e^{∓iEh}c(t), h = 10⁻³), so a residual is quadrature and truncation, never integration error.

**The laws checked live.** Conservation of the norm and the energy (zero, unless the DRAG toy is on, and then the
rows show what the toy takes). **Ehrenfest I**, d⟨z⟩/dt = ⟨p_z⟩, with ⟨a|p_z|b⟩ = i(E_a−E_b)⟨a|z|b⟩. **Ehrenfest
II**, d⟨p_z⟩/dt = ⟨−∂V/∂z⟩: for hydrogen −Z⟨z/r³⟩ (a new matrix element, cos θ/r², whose radial part is
∫R_aR_b dr), for the oscillator −⟨z⟩, which is Newton; in the box the wall is not an operator the register
holds, so the residual there *is* the wall's force, and the row says so. The hydrogen virial 2⟨T⟩ + ⟨V⟩, which
vanishes on time average.

**Why II is exact within the register.** For eigenstates (E_a − E_b)²⟨a|z|b⟩ = ⟨a|∂V/∂z|b⟩ — the
dipole-acceleration identity — so both sides of Ehrenfest II are the same bilinear form. Gated to 3e-6 across
five pairs up to n = 6 (quadrature-limited; the shared radial quadrature went from 4000 to 12000 panels for it,
which tightened the Pauli gate too). On a four-state hydrogen superposition at four times the live residuals of
I and II are 1e-7 and 8e-7 relative; on the oscillator's coherent state the table reads Newton directly —
d⟨p⟩/dt = −⟨z⟩ to 8e-8, with ⟨z⟩ = k·sin t and ⟨p_z⟩ = k·cos t to 8e-9. In the browser (B36) 1s + 2p_z at
t = 1.3 shows five rows, both Ehrenfest residuals at 3e-9 and 2e-9 marked ok, and the law switches to −⟨z⟩ when
the oscillator is selected.

Proofs after wave 19: node … + **5**, browser **52** — 302 checks.

### wave 20: THE MATH AUDIT (Round 11) — what it found, and what changed

`research/adversarial-2026-09-02/11-opus-audit.md` (Opus, 727 lines, probes `bf-r11-*`). Every claim since the
freeze was re-derived or re-measured by the rival, ranked A (false numbers on screen), B (wrong wording), C
(loosened tolerances), D (confirmed and understated). All of A, B and C are applied below; D is now gated.

**(A) False numbers, fixed.**
- **A1/A2** The radial quadratures behind ⟨r⟩, ⟨1/r⟩ and the dipole were blind to Z: cache keys without Z, the raw
  hydrogen radial function, and ⟨V⟩ = −⟨1/r⟩ hardcoding charge 1 against a Z²-scaled energy. At Z = 2 the
  CALCULUS window printed a *negative* kinetic energy and an Ehrenfest II residual of 0.40 in a row built to show
  1e-9. Every radial quadrature now carries Z in its key, uses the Hamiltonian's radial function, scales its
  range, and ⟨V⟩ = −Z⟨1/r⟩.
- **A7** The SPECTRUM ladder drew Z = 1 hydrogen at every Z, contradicting the lane four pixels away. `setZ` now
  installs a scaled ladder (E_n = −Z²/(2n²), the footer names Z).
- **A3** The DRAG toy was silently inert under any Stark field while the status line said NON-UNITARY. The
  block propagator now applies the same factor; and the exponent is clamped at zero so a Zeeman shift can never
  make the toy amplify (B6).
- **A4** `h2.js` printed D_e = 3.14 eV; its own formulas give 3.156. Header and anchor corrected; the test
  tolerance that hid it (±0.05 eV) is 1e-4.
- **A5** The Kepler ellipse's angular momentum is not the state's: L_orbit = n√(1−e²) exceeds |⟨L⟩| always
  (K² + L² ≤ n² − 1), by 1 for the circular state and by 661% on a random shell state that was still drawn. The
  orbit now returns and the overlay prints L_orbit beside |⟨L⟩|; below coherence ½ no orbit is drawn.
- **A6** Ehrenfest II omitted the Stark force −F. Added.

**(B) Wording, corrected.** The drag toy is the no-jump branch of H − iγ(H−E₀): the ground-state population is
invariant and nothing is emitted anywhere — "radiated away" is gone. The Kepler "boundary, exact" is an identity
by construction once a = n², e = |K|/n are read off the state; the physics is Pauli's replacement, which the
audit confirmed holds for every shell state to 1e-14, not just coherent ones. Helium's conditional picture: its
*shape* is the Born rule; its brightness is normalised to the frame's peak, a rendering choice. The cusp gate no
longer allows itself to get worse: six terms 0.3373, ten 0.3381, a polynomial in u cannot make a linear cusp.
METERS no longer prints eV and attoseconds under an operator with no fixed ω; CALCULUS stands down when a
molecule or helium holds the field; new SPECTRUM lanes carry the operator's unit and names.

**(C) Tolerances, tightened.** The gas packet's 0.85 became |captured − 0.96683| < 5e-4; the Pauli gate's
fabricated "3e-8 limit" became the measured 1e-9; the slap's 0.546 ± 9% became 0.5446 ± 0.3% with the 40³ grid
named; the α* gate no longer grants itself its own tolerance; a vacuous "a byte never exceeds 255" judge is
gone; the log-potential judge asserts the splitting (0.5887 GeV for both systems) instead of a bit-identical
ratio; the momentum box grew from 2.6/n to 4/n so it cuts ≈ 0.1% of ‖φ‖² instead of 1–3%.

**(D) The strongest thing in the instrument, now gated.** "In the box the residual IS the wall" had been written
as an excuse. The audit proved it exact: the register's own d⟨p_z⟩/dt = −ΣRe(c_a*c_b)(E_a−E_b)²z_ab equals the
hard-wall pressure −½a²∮|∂_rψ|²cosθ dΩ (with R′(a) = −N k j_{l+1}(z), so R′(a)² = 2k²/a³) to 4e-16 through a
bounce. The box's Ehrenfest II row now *predicts* the wall's force instead of reporting zero, and the gate holds
at 1e-10 by the dipole route (the audit's closed-form route reaches 4e-16). Also confirmed and now stated: Pauli's
replacement for non-coherent states (1.2e-14); the helium kinetic functional derives coefficient by coefficient;
⟨p⟩ = 0.5446k is the TRK share identically (0.0190 in n > 6, 0.4350 in the continuum); Sugiura's K′ verified
independently (K′(1.4) = 0.32329).

A closed-form anchor now sits in the calculus proof (C6): on (1s + 2p₀)/√2 the live table's ⟨z⟩, ⟨p_z⟩ and
d⟨p_z⟩/dt equal z₁₂cos(3t/8), −(3/8)z₁₂sin(3t/8), −(9/64)z₁₂cos(3t/8), z₁₂ = 128√2/243, to 2e-9.

Open from the audit: Q61–Q66; the regression-style judges in `frontier.test.mjs` that cite earlier rounds'
numbers (B7) are still labelled as theorem checks; the brittle judges near their thresholds (C11) are noted.

### wave 21: what the interface was costing, and a sweep for bugs

**The interface's frame cost, measured.** With the reconnection preset playing in headless Firefox the JavaScript
loop costs about the same whether every window is open, every window is folded, or the interface is hidden —
3 ms — yet the frame rate is 31 with the interface shown and 57 with it hidden. The cost was not the code. It
was the browser compositing frosted glass over a canvas that changes every frame: with `backdrop-filter` set to
none and nothing else changed, 32 fps became 58, the same as hidden. **The blur is gone**; the glass now comes
from tint, hairlines and shadow, and the skin that follows is designed blur-free from the start.

| headless Firefox, reconnection preset playing | fps |
|---|---|
| interface shown, frosted blur on | 32 |
| interface shown, blur off | 58 |
| interface hidden (H) | 57 |

**A sweep for bugs.** A scripted pass exercised every control the instrument exposes — twelve presets, play, the
five observables, both spaces, three draw styles, the palette, every rotor, the defect wait, both static fields
with play, slap and drag under Stark, the bow, particles, the slice's two planes and its tour, Z = 3 in both
spaces, the oscillator with a slap and momentum space, the box with a launched packet and a bow, H₂⁺ tunnelling,
helium with placement and every basis size, H₂ with a collision, the H key, TAB, both performance modes — and
scanned every readout for NaN, Infinity, undefined and null, every step for console errors, and the norm and
grid integral at the end. Result: **zero console errors, unit norm, unit integral, and one textual bug**: the
DYNAMICS emission lines printed `T = Infinity` for a degenerate pair (2s ↔ 2p in hydrogen), because a static
dipole is not a line. Fixed: degenerate pairs are excluded and the readout says why; the same fix made the lines
read the operator in force instead of hydrogen's static energies.

### wave 22: the shell — a floating rack over a full-screen stage, and a blur-free skin

Josh's brief: the draw space is the whole screen and the rack floats over it as disconnected windows that can be
dragged and shuffled; a slightly narrower rack; a much smaller, subtitle-sized transport that can also dock into
the rack; all explanatory text behind hint icons; a hide button top-right and hover-reveal; a skin fusing glass
morphism and neumorphism, minimal, values appearing when a parameter moves; a logo of his own to come.

**Structure (`lab/index.html`, `lab/lab.css`, `lab/kit.js`, `lab/rack.js`; browser B38).** The stage is absolute
over the whole window; the rack is an absolute, transparent, scrollable column of cards on the right whose width
is the one layout variable `--rack-w`. Cards drag by their header and reorder live as the pointer passes the
midpoint of a neighbour (TAB's cycle still runs in the original order). A ◧ button top-right slides the rack out
(B for the key); when hidden, a 16 px strip on the right edge peeks it back on hover. The transport is a 34 px
pill at the bottom centre — play, rewind, step, a thin scrub line, the rate knob, the time — with a ⇱ button
that docks it into the rack as a TRANSPORT card and back (T). Every `.note` in the rack is folded behind an ⓘ:
hover or click opens one, N opens them all. Knobs mark themselves `active` while dragged so a skin can show the
value only then.

**Skin (`lab/skin.css`, `lab/skin-notes.md`, by a Fable design agent).** No `backdrop-filter` anywhere — the
frosted blur was measured at −26 fps over the live canvas — so the glass is tint, a top lip, a sheen gradient and
a deep float shadow; every control is neumorphic (raised pucks for knobs and triggers, inset wells for faders,
readouts and groups; ON is pressed-in with a cyan rim); the accent is kept for live/active state only; `--rack-w`
is 300. Contrast on the card tint is computed in the notes (primary ink 10–15:1; one faint token reaches 4.46:1
only with a bright cloud directly behind a card). Values fade in on hover, drag, active or focus and linger
700 ms.

| headless Firefox, reconnection preset playing | before | after |
|---|---|---|
| every window open | 31 fps | **55 fps** |
| rack hidden | — | 62 fps |
| interface hidden (H) | 57 fps | 62 fps |

Remaining from the brief: Josh's logo for the top-left; the ⓘ icons sit in the card body rather than the header
(the skin's own placement is the header — a follow-up); the transport readouts' units in the mini bar.

**Labels.** LADDER is EXACT · SPECTRAL and says on its face that the FIELD cannot draw n > 6; its dashed curve is a
PREDICTION at cubic order with the neglected quartic printed. ORBIT is EXACT. VORTEX is EXACT on the sampled
circles and claims nothing between them; the census is offered only for stretched three-mode states and refuses
everything else. STARK ROTATE and DEFECT WAIT live in STATE and change c (the badge says so); the camera never does.

**Honest gaps of 0.1.** STARK ROTATE is about z only (K_x, K_y would give the full SO(4)); the vortex overlay is a
point cloud, not connected curves; the ladder's prediction neglects the chirp off x = 0 and the quartic; the
census does not cover non-stretched or four-mode states (the print's generic reconnection is in the research
probes, not in the instrument); the F_q shell law is a sheet paragraph.

### wave 23: DARK and LIGHT, the surface controls, the mirror rack, the frost trial, and the logo

Josh's brief: a light mode, with the one so far named DARK; the layer underneath adapting, or at least a way to
change the render of the object itself (hue, exposure, gain, gamma, invert); a second rack on the LEFT that
mirrors the right one — the same windows, and all it does is let any window move left or right; a trial of a
20 px pale-blue frosted glass; and the logo — the Spinwerad face (gluk, 2009, SIL OFL; `lab/fonts/`) with the
λ beside it and, right of WAVES, a square turned 45° as tall as the text carrying a 3 × 3 pattern in the
λWAVES palette.

**THEME and SURFACE (`lab/field.js`, `lab/rack.js` OBSERVER, `lab/skin.css`; browser B39).** The render pass
gains one uniform, `View.p5`: the stage background colour and the output gamma, so the layer underneath is the
theme's, not the shader's. THEME DARK / LIGHT swaps the skin's token set (`body[data-theme]`) and adapts the
stage: LIGHT sets a light background and turns INVERT on, so the cloud is drawn as ink on paper — the frame's
mean luminance rises from 41 to 213 in the check. SURFACE is the render of the object: STAGE (the background's
lightness between the two themes), GAMMA (the output curve, 0.5–2.4), with EXPOSURE (the gain), HUE and INVERT
already there — all presentation, none of it touches ψ. `__LW.setTheme(id)` and `__LW.theme` drive it.

**The mirror rack (`lab/index.html` `#rackL`, `lab/lab.css`, `lab/rack.js`).** A second absolute column on
the left with the same width and rules. Every card header gains a ⇄ that sends the card to the other rack;
dragging a card by its header across the window's midline moves it too, and it keeps reordering in whichever
rack it is over. TAB cycles over both racks; the hide button and the peek strips take both out and back; the
stage captions (KEPLER, VORTEX) step right when the left rack holds cards. The layout API grows
`moveToRack(id, 'L'|'R')`, `side(id)`, `orderAll()`.

**FROST (a switch in OBSERVER, off by default).** `body.frost` puts `backdrop-filter: blur(20px) saturate(130%)`
with a pale-blue tint behind every card. It is the effect wave 22 removed for its cost (≈ 26 fps over the live
field), so it is a look to try rather than a default; the note beside the switch says so.

**The logo (`lab/index.html` `#title`, `lab/skin.css`).** λ and WAVES in Spinwerad, and an inline SVG mark:
a square rotated 45°, 1.05 em tall, nine squares in the palette (#5ee7d8, #78e1f0, #f5f7fa / #d97ce8, #2b3f7a,
#5ee7d8 / #ffbe5a, #d97ce8, #78e1f0). The font is loaded by `@font-face` from `lab/fonts/Spinwerad.ttf`, with
its licence beside it; B39 checks the face reports loaded.

**The wheel as the accent (Josh's follow-up; `lab/rack.js`, `lab/skin.css`, `lab/lab.css`; browser B40).** The
palette editor's wheel — its current stops whether or not the phase view uses them, shifted by HUE — becomes the
interface's colour source. ACCENT A and ACCENT B in OBSERVER are two angles on it; the body's `--acc` and `--acc2`
are set from them, and every derived tint in both stylesheets was rewritten from literal hues to
`color-mix(in srgb, var(--acc) N%, transparent)`, so turning either knob, changing the palette preset or shifting
HUE recolours the whole UI at once. The two UI accents have their OKLab lightness held to the theme's legible
range (≥ 0.62 on DARK, ≤ 0.62 on LIGHT); the PLAY button's ink flips with the accent's lightness. The logo takes
the wheel verbatim: the λ is a bold italic serif in the wheel's 0° colour, the nine squares are the wheel at
0°, 40°, … 320° in reading order, the wordmark is white on DARK and black on LIGHT, and the title has no glass
behind it — λ, WAVES and the diamond sit as one word on the stage. `__LW.accent.set(a, b)` and `colorAt(deg)`.

Gate: 251 node + 56 browser (B39, B40).

### wave 24: the iPad round — Safari's black box, the auto render scale, a rack that scrolls, and the bounce

Josh opened the LAN link (`serve-lan.sh`, all interfaces, port 8710) on an M5 iPad Pro: very low fps; the rack
would not scroll by touch or by the Magic Keyboard trackpad; the PALETTE switch turned the whole box black; and
the BOX still had no small atom bouncing in it.

**The black box (`lab/field.js`).** In the phase view a voxel with ψ = 0 asks `atan2(0, 0)`; Metal returns NaN
where Vulkan returns 0, and a single NaN sample poisons the whole ray, so every pixel through the cube went
black. The phase is now `select(0, atan2, |s|² > 0)` and the output is scrubbed (`select(o, bg, o != o)`).
Firefox never showed it, and a headless proof cannot: Josh's next reload on the iPad is the test.

**AUTO SCALE (`lab/rack.js` FIELD CACHE).** The iPad's device-pixel ratio 2 put ~12 M ray-marched pixels per
frame in front of the same 96³ field. The canvas backing resolution now follows the measured frame interval:
while presented frames run slower than 45 fps the scale steps down by 0.1 (floor 0.35), above 80 fps it climbs
back by 0.05; a RENDER SCALE readout says where it sits; the switch turns it off. The estimate on screen, never
the state.

**The rack scrolls (`lab/lab.css`).** WebKit's scrolling tree does not scroll a container that is
`pointer-events: none`, which the floating rack was (so the stage could take drags through its gaps). The rack
is now a real scroller sized to its content (`bottom: auto; max-height`), `touch-action: pan-y` on the column and
the cards, `none` on the card headers so a header drag still reorders.

**The bounce (`lab/rack.js`).** Choosing BOX launches the gas at once and plays. And the packet Josh asked for —
small, rigid, bouncing — is the OSCILLATOR's: COHERENT BOUNCE slaps the ground state with |k|, which is exactly
the Glauber coherent state α = ik/√2 (⟨z⟩ = k sin t, ⟨p⟩ = k cos t, width constant, 99.99 % of the norm within
N ≤ 10 at k = 2). In the BOX the same packet disperses because a hard wall has no equally spaced ladder — physics,
not a defect — and the BOX's 91-state basis (six radial zeros, l ≤ 5) bounds compactness: σ/a ≳ 1/6 for 95 %
capture (σ = 1.4, k = 1.2 is held only 73 %), so a smaller box atom needs a larger well basis (a QWAVE-0.x item).

Gate: 251 node + 57 browser (B41 added).

### wave 25: the second UX round — overlay shading, the wave as ±1, ⓘ outside the rack, the logo menu

From Josh's iPad video and notes. **Shading (`lab/field.js`).** The SOLID plateau was lit by multiplying the colour
by 0.35–1, which reads as a grey cast; it is now an OVERLAY — the dark side is the colour burnt into itself (c²,
darker and more saturated), the lit side the colour lifted toward white — so the 3-D geometry stays and the hue
does not go grey. **THEME never touches INVERT.** **Two draw styles for the wave itself:** SIGNED draws flat ±1
lobes meeting at a hard nodal surface (opacity saturates just above the node; best in REAL/IMAG), BANDS draws the
amplitude's own level lines as a cosine comb (GRAIN sets 2–16 bands) — an interference-fringe reading of the
field; C cycles all five. **ⓘ (`lab/rack.js`, `lab/lab.css`).** One ⓘ per card in its header; its panel opens
OUTSIDE the rack on the stage side, aligned with the card, and clicks cycle the card's notes (1 / n in the foot);
N still shows every note inline. **The chrome.** Both racks run to the top; the logo sits at the left rack's
inner edge, the hide button at the right rack's, the badges centred between; the transport floats 60 px up and
docks into the LEFT rack at its remembered slot (`layout.dockIndex`); a hidden rack peeks when the pointer reaches
its edge and goes when it leaves the column. **The logo menu.** Hover or tap λWAVES: FILE (save, load, copy JSON)
· EDIT (normalize, clear, reset view, reseed, reset keys) · WINDOW (rack, transport, interface, notes, theme, and
every window to raise). No undo history yet. **Double-tap or double-click resets a knob or fader** (`lab/kit.js`).
TAB now skips a window already at the top of its own rack. Browser B42 (with a real driver drag on GAMMA and a
double-click); B21/B28/B38/B39 adjusted to the new shapes.

### wave 26: defaults, the window taxonomy, SETTINGS, and the interface face

Josh's third UX round. **Defaults.** LIGHT theme, arg ψ as the observable, the VORTEX census and its overlay off
(a CPU reader should not run unasked); the proof reads these on the fresh page (B43) before setting its own
baseline. **Every window** now carries ⏻ (its reader stops computing — the loop guards each CPU tick by the
card's `off` class and clears the vortex overlay), ▾ fold, and × close; a + at the top of each rack lists the
closed windows and reopens one at the top, as does the WINDOW menu (⊕). **The taxonomy** (`KIND` in rack.js):
CORE — PREPARE, EIGENVALUE, VIEW·CAMERA, TRANSPORT — opens; INFORMATION panels — SHADOW, VORTEX, SLICE, CALCULUS,
METERS, LADDER — keep their captions visible and carry ⧉ COPY, a text digest of every readout plus the module's
own table (METERS: the frame profile; SPECTRUM: label/E/|c|²/arg; SHADOW: q,p; VORTEX: the nodal points;
CALCULUS: its stats) for the notebook; CONTROL surfaces — ORBIT, DYNAMICS — and OTHER models — QCD, H₂⁺, HELIUM,
H₂, SETTINGS — start folded, × still in reach. **SETTINGS** is a window of its own (after the Mandelbrot
mockups' settings panel): INTERFACE (STATUS TAGS, HINT BAR, RESET LAYOUT, FORGET), THEME · SURFACE and the
accent wheel (moved from OBSERVER), FIELD CACHE · QUALITY (moved), and every KEY binding (moved); theme, tags,
hint, frost, accents, auto-scale and the closed windows are remembered in this browser (`lambdawaves.q0.settings`).
**Chrome.** FILE · EDIT · WINDOW are flat text to the right of the logo (the subtitle retired; an ABOUT comes with
the settings later); EDIT gained SETTINGS…; the shadows are tighter and quieter in both themes; the veil under the
racks is gone (`#rack, #rackL { opacity: 1 }`); the interface face is Roboto (variable, SIL OFL, `lab/fonts/`),
numerals tabular, the logo unchanged. Browser B43 + B44.

**Josh's questions, answered in the reply:** QCD belongs in the HAMILTONIAN selector as a fourth entry (Cornell)
with its spectroscopy as an information panel; KEPLER is worth keeping as a control surface — the SO(4) rotors
already turn the hidden 4-D degrees of freedom, and dragging the orbit's perihelion or eccentricity is the same
rotor with a handle (a next wave).

### wave 27: the + leaves the rack, VIEW and ABOUT, window names as hints, stage captions, the compaction pass

The + that reopened closed windows sat inside the rack as a sticky first child and read as a bar above the cards;
it now sits under the hide button, in that button's style (`#rackAdd`, `#rackAddList`), and reopens a window into
the rack it came from. The logo menu gained **VIEW** (the five observables, the five draw styles, the captions,
tags and hint switches, hide interface) and **ABOUT** (an ABOUT window — what the register is, what the field is,
the labels, version, credits, the two type licences — plus REPORT.md, licences and SETTINGS…). The windows' long
titles are now the header's hover hint; the short eyebrow (STATE, SPECTRUM, OBSERVER, …) is the name, and lists name
a window as `EYEBROW · title`. A **STAGE CAPTIONS** switch (SETTINGS · INTERFACE, also in VIEW) hides the KEPLER
and VORTEX lines at the foot of the stage and is remembered. The compaction pass: rows justify across the card and
their triggers, switches, segments, readouts and selects flex to fill it; segments centre their labels; groups sit
tighter. Proofs B42–B44 adjusted to the five menus, the single +, and ABOUT shipping closed.

### wave 28: RATE per channel, A/B and the Rabi TRANSITION, the spectrum's own buttons, and the layout fixes

**RATE (`lab/spectrum.js`, `lab/rack.js`).** Every channel now has two knobs: its phase, and a RATE — a multiplier on
that label's own E. The energy in force is `energyOf(a) = H.energy(a)·rate[a]`, fed to the register through the one
`setEnergies` path every feature already uses, so the slap, the bow, the fields and the rotors are untouched. A rate
change re-anchors the channel at the current time (c(t) is continuous to 1e-16 in the proof; only its speed changes),
and any rate ≠ 1 flags the SPECTRUM status TOY, cleared when the rates return to 1.

**A / B · TRANSITION (`lab/state.js`, the STATE window).** STORE A and STORE B keep the register's anchor; A and B
recall. TRANSITION plays c(t) = cos(Ω(t−t₀)/2)·A(t) + sin(Ω(t−t₀)/2)·B(t) with A(t), B(t) the exact evolutions of
the two anchors — for two eigenstates under a resonant drive this is the exact two-level Rabi solution in the
rotating-wave approximation, and the density breathes at E_B − E_A: the radiating dipole of Falstad's "atom
radiative transitions" applet, here as an exact superposition every window can read. Composite A or B make it a
TOY, and the readout says which, with |⟨A|B⟩|. The proof stores 1s and 2p_z, plays to θ = π/2 and finds unit norm
with all the weight on B (4e-33 left on A). Edits during a transition act on the anchors; off freezes the mix.

**The rest.** SPECTRUM's head row is HIDE · +MODE · CLEAR · NORMALIZE (HIDE folds the channels away); NORMALIZE
now says what it did ("‖c‖ was 1 already" is why it seemed inert). The bow, or SLAP, on an empty box conjures the
ground state first. Groups match their card (no dark well), the ladder and readouts use the theme's well tint. The
play bar keeps its length across rates (the readouts beside it are fixed-width). H hides the whole chrome, the
toggles, the menubar and the left rack included. Menu items show their keys at the right, Mac-style. With the
PALETTE on, the REAL and IMAG views go polar: + and − take opposite points of the wheel (¼ and ¾ turn, HUE-shifted).
The + reopens into the right rack only; drag a window across to the left. Browser B45.

### wave 29: the OBSERVER split, the spectrum's order, stacked knobs, VIVID accents, accent scrollbars, Re+Im, full screen

**OBSERVER became five windows**, in Josh's order: PALETTE (the editor, now with a 360° ROTATE wheel instead of
+60°), SPACE (position/momentum and the observable — the card keeps the id `observer`), DRAW STYLE, CAMERA, and
SLICE/CLIP. The groups moved as they were; the shipped order is recorded at boot (`__LW.bootOrder`) so the proof can
check it after other checks have raised windows. **SPECTRUM** now opens with the ladder and the channels; the
Hamiltonian selector, the well and Z knobs, the gas and COHERENT BOUNCE sit below the +MODE picker. **The channel
knobs** (phase, RATE) are half-size and stacked; alternate rows step 3 px right and left — Josh's readability motif.
**VIVID** (SETTINGS · THEME) pushes both accents toward neon: more OKLab chroma and a wider `--acc-glow`, remembered
with the accents. **Scrollbars**: 2 px, accent-coloured (thin + accent on Firefox); the right rack scrolls on its
LEFT edge by `direction: rtl` on the container alone, every card reset to `ltr`, so the controls read and drag as
before; the ⓘ panel now clears the rack's edge rather than the card's. **Re+Im** is a sixth observable — both parts
superposed in one volume, orange/blue for Re and green/violet for Im, a heuristic placement and labelled so; V
cycles six. **Full screen**: F, and VIEW → FULL SCREEN / back, through the Fullscreen API. **Shift = fine** now
holds on faders too (a fifth of the travel; knobs already had it). Browser B46; B42 re-anchored to the SPECTRUM
card's notes.

**The synthesis Josh asked for — three superpositions, queued as a round, not faked:** (1) position + momentum in
one volume needs a second reconstructed field and a two-texture ray march; (2) Re + Im is built above; (3) E and B
of the atom — the honest analogue of Falstad's 3-D waveguide (`falstad.com/embox/guide.html`, the video) is the
radiation field of the transition dipole ⟨d⟩(t) that the A/B TRANSITION now produces: near-field E and B of an
oscillating dipole, equipotentials of the retarded potentials, labelled HEURISTIC (classical field of the quantum
dipole). A maths round first; then a RADIATION window.

### wave 30: the NOTEBOOK glass and the ABOUT face, FROST as a blur, and the playhead that follows the rack

**NOTEBOOK (`lab/index.html` `#notebook`, `lab/lab.css`, `lab/rack.js`).** A free window over the stage — a real
backdrop blur with no colour behind it (a hairline, a top sheen, a soft float), draggable by its header, J to
toggle, WINDOW → NOTEBOOK. The title is set in the logo's face (Spinwerad); the notes are Roboto in a plain
textarea kept in this browser (`lambdawaves.q0.notebook`), with a word count and COPY. Josh writes the prompting of
the notebook himself; this is the glass. Its ⓘ flips the same glass into the **ABOUT face**, after the Mandelbrot
app's About: the logo on top, the version line, the tagline, © 2026 Joshua Hosain, SPECIAL THANKS — *Team @ Chronus
Quantum for the Molecular Orbital Model · 'Electron Orbitals' Google Play Store App by Brian Johnson · Paul
Falstad's Math & Physics Java Applets @ falstad.com* — the team line exactly as the Mandelbrot app carries it
(*Seth Shultz · Beatriz Erranté · independent research, the JSY / Finite Field programme*), the two "Made with"
lines, the type licences, REPORT.md, and a COPY dump (the about text, the remembered settings, the field's
adapter, the user agent). The rack's ABOUT window retired. **GLASS BLUR** (SETTINGS · THEME, 0–30 px, remembered)
sets the radius for the notebook and for **FROST**, which is now a blur with a whisper of white (or black on DARK)
rather than a pale-blue overlay. The +MODE picker lost its slab. **The playhead** slides down and fades when the
rack is hidden, and fades back when the pointer nears its place at the foot of the stage; the rack itself now peeks
within 60 px of its edge. Browser B47. No licence line is claimed for λWAVES itself — Josh has not named one.

### wave 31: QUARKONIUM in the HAMILTONIAN selector — the first item of the long queue

**`lab/cornell.js` (NUMERICAL).** The Cornell potential −4α_s/3r + σr + V₀ for a heavy pair of reduced mass m_q/2,
solved by the QCD panel's own Numerov shooting for all thirty-six (n_r, l) the 91 labels name (n_r = n − l − 1 ≤ 5,
l ≤ 5), in GeV and GeV⁻¹; the register's energies are the masses M = 2m_q + E, V₀ fitted so the 1S sits on J/ψ or
Υ(1S). One lesson paid for: a shooter's outward integration diverges past the outer turning point, so the raw u is a
spike at r_max even when E is right to 1e-12 — each solution is now cut where |u| stops falling and renormalised,
after which 1S·2S·3S are orthonormal to 1e-9 and every u_{n_r l} has exactly n_r nodes. **The kernel** gained a
tabulated-radial branch (space 6): 256 samples per row in a storage buffer, linear interpolation, the angular part
as the well's. **The selector** has a fourth entry, QUARKONIUM; the QCD panel is now the information panel whose
system (cc̄ / bb̄) and α_s, σ knobs drive the entry live; the channel labels read 1S, 1P, 2S… with masses in GeV;
momentum space is not built (position forced, as for the box). Proofs: `tests/cornell.test.mjs` (8: masses equal
the panel's to 1e-9; 2S predicted within 25 MeV of PDG, 3S within 120 — above the open-charm threshold, where a
potential model overshoots; orthonormality; nodes; order 1S < 1P < 2S; the table; ψ at a point; bottomonium) and
browser B48 (the same 1s+2pz register drawn under Cornell with no shader or GPU error, GeV in the channels).

### wave 32: NOTEBOOK II — a typeable title, markdown + LaTeX, and PROJECTS

Josh, mid-queue: "make the notebook title typeable and MUCH larger (hidden on the about page) … markdown and proper
LaTeX support $ and $$ … each saved project in a subfolder system, a last opened/saved list under FILE, the notebook
as each project's landing page."

**The title** is an input in the logo's face at 30 px, kept in the browser and in the project; it hides on the
ABOUT and PROJECTS faces. **Markdown + LaTeX.** The notebook is an edit / preview pair (◐, or ctrl+enter): marked
(MIT) renders GFM markdown and KaTeX (MIT) renders `$…$` and `$$…$$`, lifted out before the markdown pass and set
after it; both are bundled under `lab/vendor/` with their licences and the twenty KaTeX fonts, so nothing loads
from a CDN. The glass is 640 px wide by default, resizable, capped by the racks. The maths face is KaTeX's own
(Computer Modern); a lighter face such as Fira Math would need a MathJax build — noted, not done. **PROJECTS.**
`lambdawaves.q0.projects` holds sessions by path `folder/name`: the experiment and presentation (the same
`serialize()` the quick save uses) plus the notebook's title and text, with saved / opened stamps and a recent
list. The ▤ face lists them by folder with open and delete, SAVE AS, EXPORT (a `.lambdawaves.json` download) and
IMPORT (a file picker); FILE carries NEW, SAVE, SAVE AS…, OPEN…, the five most recent (↺), EXPORT / IMPORT, and the
old quick save. **The landing page:** opening a project restores it and shows its notebook in preview, capped at
14 lines / 140 words with a "…" line; ◐ opens the whole. Browser B49 (title kept and hidden on ABOUT; h1, list, two
KaTeX spans incl. a display one; save → replace → open restores register and notes and lands; recent; export
imports as another path; FILE lists the recent entry; delete cleans up).

### wave 33: KEPLER as the SO(4) control surface — queue item 2

**The perihelion dot is a handle (`lab/keplerview.js`, `lab/rack.js`).** Hover it and the cursor says so; drag it
and the state follows. Dragging it AROUND the orbit applies the spatial rotor D(R) about L̂ (the `both` rotor,
which = L and K together) by the angle from the perihelion to the pointer; dragging it IN or OUT applies the
rotor e^{−iθ â·K} about the in-plane axis ⟂ the perihelion, with θ chosen so the perihelion distance a(1 − e) meets
the pointer. Both are the exact unitary rotors the ORBIT window already turns, so the orbit you draw is the state
you get — norm kept to 1e-14, the shell mixed as it must be (2p₊ becomes 2s + 2p). Two honest mechanics: the rotor
convention is checked rather than assumed (if a turn goes the wrong way it is undone twice over; if the
eccentricity lands on the far side, half a turn about L̂ brings it round), and e(θ) is scanned over the whole turn
and refined, because |L|² + |K|² is a shell invariant — a 2p₊ state, |L| = 1, can reach e = 0.5 and no more, and an
out-of-reach drag lands on that maximum instead of running past it. Arbitrary axes come from conjugation: carry the
axis to z with spatial rotors, turn about z, carry it back. A drag to the focus is refused. `__LW.keplerDrag(n, w)`.
**A bug it exposed:** the VORTEX census caption called `.toFixed` on a null reconnection time for any state that
is not a stretched three-mode one, throwing inside the overlay tick and freezing every overlay after it. Guarded.
**Also this wave:** the notebook follows DARK (tokens for its lines and buttons, a shade behind the blur) and its
panes fill the glass so the resize handle sizes the notes and the preview. Browser B50 (e 0 → 0.400 with the
perihelion on +y, then the 0.5 ceiling on +x, unit norm, refusal at the focus, a handle exposed).

### wave 34: THE AXIAL GAS — the box's second register (queue item 3), and a Bessel bug older than the box

**Why a second register (`lab/gas.js`).** The instrument's 91 labels stop at l = 5, and no reinterpretation of
them puts more than six angular waves into the box, so its packet was never smaller than about a/6. The axial gas
is a register built for the box alone: the well's eigenstates with m = 0 about the z axis, n_r ≤ 15 and l ≤ 15 —
256 modes. A packet is the NUMERICAL projection of a Gaussian (centre on the axis, momentum along it, width σ) on a
(r, θ) quadrature grid, capture reported; its evolution is EXACT in the well's own basis. The kernel's well branch
now builds P_l(cos θ) by Bonnet's recurrence when a record asks (the six-coefficient table stops at l = 5), and
MAX_MODES grew to 320. In the BOX, GAS BASIS chooses 91 or AXIAL 256; LAUNCH, the bow and entering the box use it,
along z only; the readout shows held / ⟨z⟩ / σ_z live from ψ on the grid. What it buys: σ down to ≈ 0.6 a₀ (k to
≈ 5) and a real reflection at the wall. What it cannot buy: a packet that keeps its width — the proof measures the
free-Gaussian spreading σ√(1 + (t/2σ²)²) to 10 % — that is physics, and the oscillator's coherent state remains the
one packet that does not spread. Proof `tests/gas.test.mjs` (6: the zeros of j_l, Legendre, 256 orthonormal modes,
a σ = 0.8 / k = 2 packet held > 95 % with ⟨z⟩ = z₀ + kt and the spreading law, the turn-around at the wall, the
records) and browser B51 (256 modes rendered through the recurrence branch, no shader or GPU error).

**The bug it found.** Miller's downward recurrence for j_l was normalised on j₀(x) — which is exactly zero at
x = nπ, the very points where the well's l = 0 norms are evaluated. Every l = 0 mode of the gas had a garbage norm
(captures above 1), and the kernel's WGSL `sphj` produced a thin shell of wrong values at every radius k r = nπ. Both
now normalise on j₁ where j₀ vanishes. The l ≥ 1 rows had been exactly orthonormal all along, which is how the
culprit was isolated. Also this wave: hiding the rack fades the + button with it.

### the FIELDS AND MOLECULES maths round (2026-09-04) — two labs, three rounds, a synthesis

Josh asked for the queued maths (the radiation field, position + momentum) and a new push: "a more general molecular
orbital theory model … integration of other atoms … dynamics based on real physics on classical electrostatics",
plus a sweep of the frontier literature. Ledger `research/MATH-FIELDS-AND-MOLECULES-2026-09-04.md` (Round 1 Fable,
Round 2 Sol, Round 3 Fable + synthesis), rival file `research/RIVAL-FIELDS-AND-MOLECULES-OPUS.md` (Opus 5, written
blind), digest `research/LIT-FIELDS-AND-MOLECULES-2026-09-04.md`, probes `research/probes-fields/` (Fable p1–p8,
Sol sol-*, Opus opus-*), decisions `research/FOR-JOSH-FIELDS-AND-MOLECULES-2026-09-04.md`.

What stands across labs: the lobe theorem (harmonics = pairwise |Δm|; a k-fold pattern turns at (E_a − E_b)/k; the
density period is 2π/gcd(ΔE) — 67.02 a.u. for Josh's state, at most 45 239 a.u. = 1.09 ps for any register state);
the standing three-fold of 4d₊2 × 4p₋1 owning the outer cloud (what Josh filmed); the stage as the near zone with the
register's Coulomb potential in closed form (Sol's Gaunt/gamma formula, ≤ 121 slots); the magnetic field of the
2p₊1 current 0.43 T at 1 a₀ and 0.52 T at the nucleus (the hyperfine field) by three routes; the Hellmann–Feynman
force on LCAO H₂⁺ −0.13391 with a Pulay term 0.0623 under Opus's per-frame bound 0.102; Hartree helium on
Hartree–Fock (−2.86168); exchange-only Xα neon 0.82 % above HF with Δ-SCF ionisation 21.09 eV; the 1s Wigner minimum
−3.097 × 10⁻⁴ at r = 1.33, p = 1.38. What died: the 201 a.u. period (a third recurrence), the 0.5 % neon gate, the
register's fixed-exponent 2p_z "improving" H₂⁺ (it moves the bond outward; the register floors at He⁺ −1.5585
because 23 % of the united atom lives in hydrogen's continuum), the digest's 6.3 T, "one part in 144", the
Dahl–Springborg closed form, "exactly the Kepler frequency". The bigger idea (Opus): the register lacks two closures —
dilation (Coulomb Sturmians, one common λ, same 91 labels: H₂⁺ to 1e-5 with twenty functions) and translation (a
shell rule, and the Pulay bound as a gate the app can evaluate every frame). Seven contracts, ordered: W-CLOCK,
W-FIELD, W-STURMIAN, W-ATOMS, W-MO, W-RADIATION, W-WIGNER — awaiting Josh's decisions.

### wave 35: Josh's rulings after the round — the project file, the official layout, Kepler off

Josh agreed to every decision of the FIELDS AND MOLECULES round (the Sturmian scale as a HYDROGEN / STURMIAN switch,
"I don't want to lose any of the features we currently have"), and ruled three things at once. **The project file**
now carries the PALETTE (on and its stops), the SPACE, the CAMERA, the STATE, the SPECTRUM (the Hamiltonian in
force with Z, the well radius and the gas basis, and every channel's RATE) and the DRAW STYLE — and never the theme:
the bug he saw was `mat.bg` and `mat.gamma`, which the theme sets, riding along inside `mat`; they are stripped on
save and on restore, so a project saved under DARK opens under whatever theme the browser has. **KEPLER ORBIT** is
off by default (the handle still works the moment it is on). **The official layout:** SPECTRUM on the left rack with
MODE open at boot. Browser B52 (a project saved under DARK with SOLID, the palette, the OSCILLATOR and a rate of 1.7,
opened under LIGHT after everything was changed, brings all of it back with the theme untouched); B43 asserts the
layout and the Kepler default; B39 follows the new side.

### wave 36: W-CLOCK — the transport says when the density repeats (the first contract of the round)

**The law (`lab/period.js`, EXACT).** The density of Σ c_a ψ_a e^{−iE_a t} repeats when every |E_a − E_b|·T is a
multiple of 2π: T = 2π/gcd{|ΔE|} whenever the differences are commensurate. For hydrogen every ΔE is a multiple of
1/7200 (lcm(1…6)² = 3600), so the period is exact and at most 2π·7200 = 45 238.93 a.u. = 1.094 ps (any set of shells
whose differences share no factor, e.g. {3, 4, 5}); {2, 4} gives 64π/3 = 67.021 (Josh's four-channel state), {1, 2}
16.755 (the Lyman-α beat); Z divides it by Z²; the oscillator's integer ladder gives 2π. The commensurability test is
a continued-fraction rational test stricter than Dirichlet's bound (denominators ≤ 2·10⁴, tolerance 1e-10 — any real
is within 1/q² of a fraction, so the tolerance must sit well below that), and the energies are compared unrounded (a
12-digit rounding once broke the {3,4,5} case). Where the energies are incommensurate — the box, quarkonium, three or
more levels of anything numerical — it says NO EXACT PERIOD and gives the best near-recurrence within 2·10⁴ a.u.
with its error; under a Stark field it says so; a two-level state is always periodic (2π/ΔE), which a proof briefly
mistook for a bug. **The readout** REPEATS EVERY … sits on the transport (docked and mini) with the lap and the
percentage through the period in its caption; ⟳ jumps to the next exact repeat; the METERS digest carries the value.
Proofs: `tests/period.test.mjs` (7: the rational lesson, the shell table against the closed form, Z = 2, the ring
returning at T and not at T/2, the oscillator, an incommensurate triple refused, formatting) and browser B53.

### wave 37: W-ATOMS — the periodic table as one central field, and the four things it must not claim

**The maths in force (`lab/atoms.js`, NUMERICAL, 27/27 in `tests/atoms.test.mjs`).** Every element H … Kr is ONE
self-consistent central potential shared by all its shells: −Z/r + V_H + V_x with Xα, α = 2/3 (not Slater's 1) and the
LATTER TAIL V ← min(V, −(Z−N+1)/r), without which an LDA potential dies exponentially and a valence electron has no
Coulomb tail to define a defect against. On a log mesh as a symmetric tridiagonal pencil, twice, Richardson-extrapolated:
Ne −127.476, Kr −2746.855 Eh in 109 ms — SOLVED LIVE.

**The UI.** ATOM joins the eigen-selector as a fifth operator on kernel space 6, quarkonium's tabulated radial path (row =
6l + n − l − 1); momentum space is not built, so the selector forces ψ(x). An ELEMENT knob picks Z = 1 … 36 and re-reads
the register in that atom (≈ 0.2 s, then cached). The 91 labels become its shells: ε_nl where the ground configuration
occupies the shell, the SAME frozen field's eigenvalue where it does not — a **virtual** shell, marked ° in the channel
name, carrying an energy and drawing nothing, because atoms.js refuses to invent a radial for a shell the atom does not
have. A new ATOMS window (`lab/atomsview.js`, info, copyable digest, shipped CLOSED and last on the right rack) prints the
element, its configuration, the model, E_total, the shell ladder (ε in hartree and eV, a log bar), the radials u_nl =
r·R_nl on a √r axis, and FILL THE VALENCE — every m of the outermost occupied shell, equal and in phase. The project file
carries `hamiltonian.atomZ`; the theme still never.

**What it must not claim, and says so on the card.** −ε stands beside the Δ-SCF, labelled NOT the IP (Ne: 15.078 against
21.088, measured 21.56). The quantum defect travels with its α (Na 3s: 1.32656 at α = 2/3, 1.37323 at α = 1, spectra
1.3730). When the two least-bound shells lie within 0.1 Eh the card says the ORDER IS α-DEPENDENT and asserts none — Sc's
4s and 3d differ by 0.0452 Eh and cross at α* = 0.839, the whole transition row in that band.

**Proofs.** `tests/atoms.test.mjs` in test.sh (AT_RC) and browser **B54** — 70 blocks. **Lesson:** a maths module's
refusal ("the table of an unoccupied shell is refused rather than invented") is a UI contract, not a gap: the honest
answer is a marked label that draws nothing, never a fabricated radial.

### wave 38: W-FIELD — the classical field of the register's own charge, in closed form, on the stage

**The maths in force (`lab/electrostatics.js`, EXACT ANALYTIC, 36/36 in `tests/electrostatics.test.mjs`).** ρ = |ψ|² is expanded on Y_LM by exact
Gaunt coefficients and **Poisson is solved slot by slot in closed form** (finite polynomials × e^{−βr} through the incomplete Γ's), so Φ = Z/r + Φ_e,
**E = −∇Φ** and **j = Im(ψ*∇ψ)** are analytic and this wave only *samples* them. B is a quadrature centred on the observation point, which is what
makes 1/|x−x′|² integrable: −0.521534 T at 2p₊1's nucleus, −0.429533 T at 1 a₀ — the ledger's two certified numbers.

**The UI.** An ELECTROSTATICS window (`lab/fieldview.js`, control, copyable digest, CLOSED and last on the right rack — ATOMS is now last but one):
OVERLAY [OFF | Φ | E | j], LINES (4…24), SOURCE [ρ + nucleus | ρ only]. The lines go on a new canvas over the stage (`#fieldlines`), cut through the
nucleus in the plane **facing the camera at the moment of the rebuild** (the same `cameraBasis` keplerview uses) and afterwards only re-projected, so
orbiting shows that one fixed slice from a new angle; rebuilt from `reg.populated()` + `coeffAt` at `clock.t`, ≤ 5 Hz playing, at once on pause or edit.
Φ = equipotentials log-spaced in |Φ| between 0.9·half and 0.25 a₀ and signed there (a neutral atom's potential has no one sign: its monopole cancels
and a quadrupole is left); E = lines seeded round the nucleus, which **end on the electron density**; j = current streamlines, in the second accent.
Readouts: the monopole against ‖c‖², Φ_e(0) in a.u. and volts, |E|(0,0,1) in a.u. and V/m, and B at the nucleus and at 1 a₀ — **off the axis B is not
certified, so it is never drawn**. Projects carry `field: {overlay, lines, source}`; the theme still never.

**MOLECULE and ATOMS.** H₂⁺ now prints F_elec + 1/R² = F_HF beside the variational −dE/dR with the Pulay term and its Cauchy–Schwarz bound: in a finite
basis Hellmann–Feynman is not the force. And wave 37's refusal is repealed — `atoms.js` gained `virtualOrbital(Z, n, l)`, `atomRadialTable` returns an
unoccupied shell's row, and all 91 labels hand the kernel a real row (Ne 3s°: normalised, two nodes, ε = −0.16236); ° never meant more than "not in the
ground configuration", but it had also come to mean "draws nothing", and that part was a gap, not honesty.

**Proofs.** `tests/electrostatics.test.mjs` in test.sh (EL_RC), a judged line in `tests/atoms.test.mjs` (28/28), browser **B55** — 71 blocks.
**Lessons:** (i) `performance.now()` is coarsened to 1 ms in a browser, so a 3 µs call cannot be timed inside a frame — budget the sampling by
structure (slots, lines), never by stopwatch; (ii) an ABSOLUTE frame rate is the machine's, not a window's, so B55 counts frames against the wall clock
three times back to back — shut, open and idle, drawing Φ (fresh 58.7 / 56.5 / 50.8, five minutes into the suite 20.0 / 20.5 / 20.5): Φ costs 13 % at
worst; (iii) `LW.field` was already the GPU field, so the overlay's API is `LW.fieldlines` (+ `LW.electrostatics`, the live object).

### wave 39: W-STURMIAN — the scale is a switch: hydrogen untouched, and one exponent λ for all 91 radials beside it

**The maths in force (`lab/sturmian.js` 16/16, EXACT closed forms / VARIATIONAL eigenvalues; `lab/sturmianreg.js` 14/14, DERIVED-HERE bookkeeping).**
The Coulomb Sturmians S_nlm(λ) are the register's own Laguerre and Legendre tables drawn at n = 1/λ; S is tridiagonal in n at fixed (l, m) and
λ-independent, ⟨1/r⟩ is diagonal (λ/n), H = −(λ²/2)S + diag(λ² − Zλ/n), and the evolution is the exact law in the basis c(t) = C e^{−iEt} CᵀS c(0)
with H C = S C E, CᵀSC = I. The register's propagator is assembled **block by block in (l, m)** (36 blocks through createSturmian, 0.5 ms): the
unblocked 91 × 91 solve is free to mix the exactly degenerate ±m pairs, and the instrument needs every eigenvector to carry one (l, m) — for the
exact Zeeman shift E_k + Bm_k/2, for the ladder's names, and so that "load eigenstate k" loads a state of definite m. Facts the proofs hold:
λ = 1/n makes label n exact again (−Z²/2n²), λ = Z makes the 1s Sturmian the exact ion ground state (He⁺ at λ = 2: −2), and at λ = 1.4 the s-block
reproduces −0.5 to 1.8e-8 from above (Hylleraas–Undheim–MacDonald: every E_k is an upper bound on level k of its symmetry).

**The register (`lab/state.js`).** `setPropagator(P | null)`: under P, at(t) is P.evolve(anchor, t); set/coeffAt/_op take the re-anchoring path (edits
still happen AT time t, by P.evolve(·, −t)); norm2() is ⟨c|S|c⟩; Ediag(a) is the label's ⟨a|H|a⟩, **not an eigenvalue**; normalAmplitudes are the
S-projections onto the eigenvectors (so energy() and the autocorrelation follow); the Zeeman term is the per-label phase after evolve (exact — it
commutes with a block-diagonal P); the Stark field is refused; the DRAG toy acts in the eigenbasis. null restores the diagonal law bit for bit.

**The UI (Josh's ruling: a SWITCH).** SPECTRUM gains a SCALE row: seg [HYDROGEN 1/n | STURMIAN λ], a λ knob (0.25 … 3, shift = fine, double-tap = 1,
hydrogen operator only, Z honoured), and a readout (E₀, occupied count, ⟨c|S|c⟩, ⟨H⟩, build time). HYDROGEN is today's code path. STURMIAN: the kernel
draws sturmianRecord(n, l, m, λ) through the hydrogen branch unchanged (the λ = 1 1s field is the hydrogen field **to the hash**); the state is
continuous across every λ or Z change (re-anchored at the current time, as a RATE change is); the ladder becomes the eigen-decomposition — rank
eigenvalues at physical height, the occupied ones lit with their population (S-metric projections, constants of the motion), the pseudo-continuum
compressed above E = 0, a click loads that eigenvector; the lanes keep the labels' coefficients under the caption *non-orthogonal basis: populations are
projections*; NORMALIZE normalises in the S metric; THE CLOCK reads the OCCUPIED eigenvalues (populations > 1e-6) and says NO EXACT PERIOD for a
mixed state; RATE, A / B TRANSITION and the Stark knob stand down with one-line notes, momentum space is forced off with a note, ELECTROSTATICS and the
hydrogen-theorem windows stand down — all back on HYDROGEN. Projects carry `sturmian: { on, lambda }` (a file without it means HYDROGEN); the theme
still never. `LW.sturmian = { set, setLambda, on, lambda, active, eigen(t) → {E, pop, l, m, n}, select(k), norm(t) = ⟨c|S|c⟩, expect(a), records }`.

**Proofs.** `tests/sturmian.test.mjs` (ST_RC), `tests/twocentre.test.mjs` (TC_RC) and `tests/sturmianreg.test.mjs` (SR_RC) in test.sh; browser **B56** —
72 blocks, every earlier one untouched. **Lessons:** (i) a degenerate eigen-solver is a UI hazard: ±m pairs are always degenerate, so the propagator
must be built block-pure or "eigenstate k" has no definite m; (ii) period.js's near-recurrence scan accepts its own first step when the spectrum is
wide (every phase < 1/64 turn is "near" an integer) — the transport now refuses a recurrence shorter than one turn of the fastest beat under the
scale, and the search should start at k = 64 (`for (let k = 64; …)` in densityPeriod) for every operator; (iii) the ⓘ sweep folds every `.note` away
at boot, so a caption that must stay visible needs its own class; (iv) `performance.now()` reads 0 ms for a 0.5 ms build in Firefox — say "< 1 ms".

### wave 40: W-WIGNER + W-RADIATION — the one joint object of x and p, cut through the axis, and what the pair would radiate

**The maths in force (`lab/wigner.js` 14/14, NUMERICAL quadrature on EXACT analytic inputs; `lab/radiation.js` 17/17, EXACT angular algebra + KNOWN A formula, NUMERICAL radial).** On the axis of the slice
the azimuth of W(r, p) = π⁻³∫ψ*(r+s)ψ(r−s)e^{2ip·s}d³s is analytic and **only equal-m pairs radiate into W**, leaving one chord integral per (z, s_z) and a Fourier integral — a 64 × 64 map in tens of
milliseconds. 1s: W(0,0) = 1/π³ = 0.0322515344, minimum −3.09725752e-4 at (1.3295, 1.3791), and **∫∫ over the slice is 1/π², not 1** — a SLICE, not a marginal, and the card says so in a line of its own
that the digest carries. Radiation: A = (4/3)α³ω³|⟨a|r|b⟩|²/t_au × μ/m gives 2p → 1s = **6.2649e8 s⁻¹** (NIST's reduced mass; the ledger's 6.2646e8 was low), τ = 1.596 ns, λ = 2296 a₀, and the coherent
pair radiates **P = |c₁|²|c₂|² ħωA**, certified by the Poynting integral of the actual fields, not by the algebra that produced it.

**The UI.** Two INFO windows after ELECTROSTATICS on the right rack, both shipping **CLOSED** with a ⧉ COPY digest. **WIGNER** (`lab/wignerview.js`) draws the (z, p_z) slice as a signed map — zero is the
card's own ground, positive the first accent, negative the second, opacity |W/W_max|^0.35 (a display law, so that a lobe 1 % of the peak is visible; the readouts print the true numbers) — with axes, ticks
and the zero cross; knobs Z RANGE (2…40 a₀, following the domain half until touched) and P RANGE (0.5…4, default 2); readouts W(0, 0) evaluated AT the origin (an even grid has no point there), the minimum
**refined off the grid** by a budgeted compass search (which is how it prints the certified −3.0973e-4 and not the grid's −3.02e-4), the maximum, the compute time — at ≤ 2 Hz while playing, at once on
pause, scrub or edit, per unit norm, capped at six labels. **RADIATION** (`lab/radiationview.js`) takes the A/B TRANSITION pair when one is set, else the two most populated labels with a non-zero dipole —
saying which — and prints A, τ, λ, ħω in eV, |⟨a|r|b⟩| and P with its law as the caption; its canvas is the far-field pattern **at its own scale** (λ = 2296 a₀ can never be drawn over an 8 a₀ stage), the
instantaneous dipole's 1 − (n̂·û)², so Δm = 0 stands still and Δm = ±1 **turns with clock.t·ω**. No allowed pair ⇒ "no dipole in this state"; not hydrogen, Z ≠ 1, the Sturmian scale or another model
holding the field ⇒ the ELECTROSTATICS stand-down. Projects carry `wigner: { zmax, pmax }`, the theme still never. `LW.wigner = { slice(), setRange(z, p), stats }`, `LW.radiation = { pair(), A, tau, power
}`.

**Three fixes.** (a) `period.js`'s near-recurrence scan started at k = 1 and **accepted its own first step** for a wide spectrum: {0, 1, e, π, 50} reported T = 1.96e-3 a.u. with err = 1/64 exactly, a
"recurrence" at which the slow pairs have turned a thousandth of a cycle. It starts at one full turn of the fastest beat now (wave 39's own lesson (ii)) and answers 3770 a.u. (b) `dynamics.js`'s radial
quadrature took its RANGE from the larger n (40n²) and its STEP from a fixed 12000 panels, so at n ≠ n′ the smaller shell's cusp was under-resolved by (n_max/n_min)² — 1.4e-9 on 1s–4p. The count carries
that ratio now (192000 panels there): **2.2e-14 against mpmath**, cached, integrated once. (c) STARK K_z and DEFECT L² are moves inside a Coulomb shell, so they stand down under STURMIAN with the wave-39
note.

**Proofs.** `tests/wigner.test.mjs` (WI_RC) and `tests/radiation.test.mjs` (RA_RC) in test.sh, with new judged lines in `tests/period.test.mjs` (8/8) and `tests/radiation.test.mjs` (17/17); browser **B57**
— **73 blocks**, every earlier one untouched except the tail indices of B54/B55, which pinned ELECTROSTATICS as the last window and now pin it third from last. **Lessons:** (i) a grid minimum is not a
minimum — the certified −3.097e-4 lives between grid lines, so a map that prints extremes must refine them, and one costing a z-row per evaluation needs a wall budget, not an iteration count; (ii) the
signed map needs no new colour — the card's ground IS the neutral midpoint — but `getImageData` un-premultiplies, so a proof counting "pixels of each hue" must classify by distance to the two accents, or
it scores the grey tick labels as negative ink.

### wave 41: W-MO — the general basis on two centres, the force it really exerts, and the nuclei it drives

**The maths in force (`lab/mo.js`, 22/22 in 5.0 s; EXACT integrals, VARIATIONAL energies, NUMERICAL eigen-solver and integrator, CLASSICAL nuclei).** One one-centre set on *both* protons — {1s}, the Coulomb
Sturmians n ≤ 4 at a common λ, or the register's own σ functions n ≤ 6 at the fixed exponents ζ = 1/n — with S and H from twocentre.js's prolate quadrature and H C = S C E split into the gerade and ungerade
blocks. For **any** coefficient vector it returns the electrostatic force F_elec, F_nuc = Z_AZ_B/R², their sum F_HF, Pulay's term 2Re⟨∂_Rψ|(H−E)ψ⟩ — so that F_HF − Pulay = −dE/dR exactly (Hurley) — and the
Cauchy–Schwarz bound 2‖∂_Rψ‖‖(H−E)ψ‖ ≥ |Pulay| computed **from the state alone**, which is what turns a run on the electrostatic force into a run with its own error bar: |drift| ≤ ∫bound·|Ṙ|dt.

**The UI (`lab/moview.js`, 300 lines, in the MOLECULE window under the 1s LCAO block).** A **BASIS** segment (1s LCAO · STURMIAN n ≤ 4 · REGISTER n ≤ 6) with a λ knob live only for the Sturmian; the window's
existing R knob now drives both blocks, and the wave-38 Hellmann–Feynman line is the **general** one — at the 1s LCAO the general machinery reproduces electrostatics.js's closed forms to 1e-9, so the card
still reads F_elec −0.133906, Pulay 0.0623, bound 0.102024 against F_exact 0.053804, and roF/roU left moleculeview.js rather than being printed twice. Readouts: E_total(R) with the exact number beside it
when R sits on a Bates point, R_e · D_e · ω · T from a golden section on this basis's own curve, and the force line. **NUCLEI** (HOLD · BO · EHRENFEST) × **FORCE** (−dE/dR · HELLMANN–FEYNMAN) with R₀, v₀,
dt and RUN / HOLD / RESET; R(t), v, E_total, drift, ∫bound and a badge that reads "drift ≤ ∫bound" and honestly turns over when it fails. The canvas is E(R) for the chosen basis (40 points, cached) with the
Bates dots in the same frame — on the register the exact point at R = 2 sits visibly *below* the curve, which is the bound's cost — the R_e line, the current R, and the run's total energy as a dotted level.
**The honest finding is the point of the block:** on the frozen 1s LCAO the Hellmann–Feynman force is repulsive at *every* R (F_HF → ½/R²: a frozen 1s cannot polarise), so that basis ships on −dE/dR and
carries the sentence "frozen 1s: the HF force is repulsive at every R — the exact force or a bigger basis binds"; the Sturmian, nearly translation-closed, vibrates under the electrostatic force itself.

**Cost, and what was done about it.** The register's curve is 440 ms and its equilibrium 430 ms, so both go through a **job queue that hands the frame loop back the wall every 24 ms** (`LW.mo.whenReady()`
resolves when it drains); a run takes one step per frame, or one per **other** frame once a step measures over half the 30 ms budget — which the 42-function register's 31 ms Ehrenfest step always does. 30
frames of that hold 30 fps against 45 with the card shut. `lab/twocentre.js`'s `prepare()` is exported and `mo.js` imports it instead of re-deriving the Laplacian's regular/singular split (17/17 and 22/22
unchanged). Projects carry `mo: { kind, lambda, R, electron, force }`; the theme still never. `LW.mo = { setBasis, setLambda, setR, setDynamics, setForce, run, hold, reset, step, force, state, curve }`.

**Proofs.** `tests/mo.test.mjs` joins test.sh as `MX_RC` (MO_RC was already momentum's); browser **B58** — **74 blocks**, every earlier one untouched, B55's molecule expectations included. **Lessons:** (i) a
readout is a promise about *when*, not only about what — the second a card's number costs a second to compute, the honest shape is a queue plus a `whenReady()` the proof can await, not a synchronous stall
the frame loop pays for; (ii) a rack card is 240 px wide and a canvas caption does not ellipsis — the sentence that carries the wave's whole claim has to be word-wrapped and measured, or the proof reads it
in `state()` while the user never sees its second half; (iii) let the reference points set the plot frame, not the curve: clamping the exact Bates dot to the axis hides exactly the gap the card exists to show.


### wave 42: THE AUDIT — eleven findings of the read-only review, fixed and gated

The reviewer's read-only pass over the maths modules found eleven defects; every one is fixed in its module and gated
in its test with the reviewer's own failing input. mo.js: the force machinery was blind beyond R ≈ 35/ζ_min (F_elec
on the 1s pair read −4.9e-8 at R = 40 for a closed-form −3.125e-4) — the spheres now reach max(35/ζ_min, 2.5R) with a
radial ladder about r = R, the prolate η rule carries ⌈2ζ_max R⌉ points, and the stepper clamps R into [0.2, 60] and
says so (dt = 500 used to throw at step 2 from R = 6648). twocentre.js: S and H were NaN past R ≈ 450 (e^{−α}·e^{−βη}
under/overflow) — one exponential e^{−α−βη} now, finite at R = 1000. period.js: a relative tolerance called Ne's three
ε "exact" with T = 153 295 a.u. (true error 2e-5) — the gcd is verified to 1e-9 of a turn before it is believed.
wigner.js: a 17th term overran a fixed Float64Array(16) (NaN); the s_z rule is cut at the state's extent and holds
only s_z > 0 (W is real): the six-term slice at the knob's extreme fell from 306 ms to 69. dynamics.js: the radial
integrals are Gauss–Legendre on doubling panels (a 16-label first frame 1.4 s → 11 ms, still 1e-14 on mpmath), and ∇ψ
keeps its φ-gradient on the axis (2p₊1 read g_y = 0 for −0.04277i). atoms.js: u₀ is written, so R_1s(0) = u₁/r₁
instead of a one-bin hole. electrostatics.js: the two B readouts cost 31 ms instead of 200 with B_z unchanged to
1e-13 T, and ⟨1s_A|1/r_B²|1s_A⟩ sees its support at t ≈ √R (the Pulay bound at R = 60 is 1.6048e-4, not 0 — the law
bound → 1/(√3R²)). radiation.js: ω follows the Hamiltonian in force, so a Z = 2 ion radiates Z⁴ times faster
(1.002e10 s⁻¹, it read 1.566e8). Node proof: 28 suites, 0 failing of 462.

### wave 43: UNDO / REDO — a ring over the register side alone, in which one whole drag is one step

**The law in force (`lab/history.js`, 108 lines; STATUS: DETERMINISTIC — no maths, no DOM, no register).** A snapshot has to be taken *before* a mutation, which nothing can do after the fact, so what the ring keeps is a **baseline**: the state as of the last commit. A commit compares a cheap live key against the baseline's and, when they differ, pushes the **baseline** — the pre-image — and re-baselines on what is live. Commits are held off while a pointer is down and for 400 ms after the last edit, so a knob drag, a bow or a scrub is **one** entry however many hundred mutations it made; a commit clears the redo stack; `undo()` and `redo()` force a commit first, so an edit is undoable the instant it happens and never waits out the window. The ring keeps 60 and the oldest falls off the bottom. It reaches the instrument only through a port — `read` / `write` / `liveKey` — which is why the whole law can be judged in node against one integer.

**What is remembered, and what must never be.** The register side only: the anchor c(0) with its mask and its static field, the DRAG γ, the Hamiltonian selection (id, Z, well radius, gas basis, element), the SCALE (on, λ), the 91 RATEs and the two A / B stores — the things that change ψ or the law it moves under. **Not** the camera, the palette, the draw style, the layout, the theme or the transport's play state: those are the observer's (§14), and a picture that only *looks* different is not a step. The trigger is `reg.version`, intercepted with an accessor because every register mutation already bumps it, plus an `hNote()` at the four register-side setters that bump nothing at all — STORE A / B, ELEMENT, GAS BASIS, WELL RADIUS.

**The UI.** `restore()` gained one option, `keepTime`, and UNDO writes through it: the same road a project LOAD takes, so the kernel, the spectrum lanes, the knobs, the Sturmian ladder and the ATOMS card all follow — while the transport is left exactly where it is. The anchor is what travels, so the state is continuous the way a RATE change is and the picture moves only if the coefficients did. **EDIT** carries UNDO (Ctrl/⌘+Z) and REDO (Ctrl/⌘+Shift+Z, with Ctrl+Y as an alias off the table so the key list stays two lines) at its top, each greyed at its end of the stack — a menu item may now carry a third element, a predicate — and SETTINGS' key list gains the two rebindable rows. `matches()` now reads ⌘ as ctrl and, for an action that wants no ctrl, refuses **both** modifiers. Loading a project is itself one step, no project file carries a history, RESET LAYOUT never touches it, and the shipped boot is the bottom of the stack rather than a step in it. `LW.history = { undo, redo, canUndo, canRedo, depth, redoDepth, limit, clear, flush, note }`.

**Proofs.** `tests/history.test.mjs` joins test.sh as `HI_RC` — 10/10 GREEN in 0.4 s: the pre-image, one drag of thirty-nine mutations as one entry, the quiet window, the ring's 60 with the oldest five gone, an undo that is not itself an edit, a held pointer that never came up and does not wedge the stack. Browser **B59** — **75 blocks**, every earlier one untouched. **Lessons:** (i) `setPointerCapture` throws `NotFoundError` on a synthetic pointer in Firefox, which silently killed every simulated drag *and* logged two page errors — kit.js's knob and fader now guard it, which is also what a real pointer that vanishes mid-gesture has always needed; (ii) the honest key for "has anything changed" is a string over the *remembered* fields, never a version counter — a mute and an unmute leave the counter two higher and the state identical, and only the key knows it; (iii) a proof that edits the same label to the same value twice proves nothing: the second is a no-op the ring rightly refuses, and it was the block's arithmetic that was wrong, not the ring's.

### wave 44: THE WALK — what the proofs did not see

A real browser over waves 37–43: both themes, 1400×900 · 1180×820 (the iPad's Safari viewport) · 1024×768, every new window opened one at a time, and every interaction no block covers. **Zero page errors throughout**, the shipped layout untouched (SPECTRUM left with MODE open; ATOMS, ELECTROSTATICS, WIGNER and RADIATION still CLOSED and listed in the +), the LAN server on 8710 serving all thirteen new files. Eleven findings, all fixed; the files are `spectrum.js`, `rack.js`, `kit.js`, `moview.js`, `moleculeview.js`, `radiationview.js`, `orbit.js`, `lab.css`, `skin.css`.

**The eigen ladder collided with itself** (`spectrum.js` `paintEigen`). The E > 0 pseudo-continuum is compressed into ~16 px and a generic λ occupies three or four levels *inside* it — the ordinary case, not an edge one — while the declutter nudged a colliding label by 8 px, exactly the face's own size, so rows touched; the nudge had no clamp, so a third marched out of the box; and the eigenvalues arrive in the propagator's BLOCK order, not energy order. LEAD is the real line box now, the nudge is clamped, a level with no room keeps its line and its bar and loses its text (the `faint` branch's own precedent), a nudged label is tied back by a hairline leader, and `lit` is sorted.

**And the ladder had no theme at all.** Every rule in it was written `rgba(255,255,255,…)`, so on the LIGHT theme "E = 0", the footer and every population value were white on white — on the *shipped hydrogen ladder* as much as on wave 39's. It reads `--dim` and `--fg` off the body now, the same way radiationview.js reads its accents. Worse and older: the value was drawn in the level's own colour **on the level's own 2 px line of that colour**, which is illegible in BOTH themes (`11% −0.0215` on magenta was simply absent). One treatment now — the theme's foreground over a halo of the theme's ground — and "E = 0" yields the gutter when a level's label has taken its row. **The same white was in both molecule canvases** (`moleculeview.js`, `moview.js`: the dissociation line, its H + H⁺ label, the exact Bates dots, the R marker, the captions), and **three canvases still carried a hardcoded 30 % BLACK background** — `.slice-c`, `.mol-c`, `.qcd-c`, which every newer view (`.ladder`, `.atm-c`, `.wig-c`, `.rad-c`) already draws as `var(--glass-well)`: a dark-grey slab on the light theme, under ink that had nowhere to go. All of it reads the theme now.

**Five more clips.** ELECTROSTATICS' × sat **8.3 px outside its own card** and its status measured **0 px wide** (a 14-character eyebrow beside six utility buttons): the header grid could not shrink and its column gaps stole the width, so the grid shrinks and the spacing moved into the status's own padding — and `device()`'s hover hint carries the status now, whatever the width. MOLECULE's Hellmann–Feynman line was **333 px of nowrap text in a 230 px box with no ellipsis**, so "= F_HF 0.116094" — the claim the line exists to make — was hard-clipped; it is `wide`. The HAMILTONIAN segment is 342 px in a 258 px row, so **QUARKONIUM read as a bare "Q"**, and the SCALE row's label ran off the edge: a segment wraps now instead of being clipped. The **mini transport covered 520 × 20 px of the hint bar** at every size. And ORBIT's `|⟨L⟩|·|⟨K⟩|·e` was 118 px in 75. MOLECULE's own E(R) caption was 380 px of type on a 264 px canvas, cut mid-word at "· do" — wave 41's lesson (ii) applied in `moview.js` and never in `moleculeview.js`; it is measured and wrapped, and it SETS the plot's floor rather than landing on the curve (lesson (iii)).

**RADIATION on a lone 1s was a blank slab** — 0 of 43 492 pixels lit — *and* every readout's sub-line still printed the PREVIOUS state's ω, its A and its |c₁|²: a card asserting numbers about a state that has no dipole at all. It draws its empty frame now (the ring, the z and x axes, "no dipole — nothing radiates") and the subs are cleared with the values.

**UNDO followed the state but not every card**: `specStatus()` dropped the element, so undoing an ELEMENT change or FILL THE VALENCE left "ATOM Xα(2/3) + Latter tail" with no atom named — one sentence now, shared with `switchHamiltonian`. The A/B readout was spelled two ways. ATOMS' ⓘ opened a **blank page 1 of 2** (its α-warning ships hidden and empty); a note with nothing in it is not a page. The + and WINDOW lists carry hover hints. Preset, SCALE, FILL THE VALENCE, ELEMENT, SLAP and a project load all undo and redo exactly.

**The λ knob was unusable, and it was not the maths.** `sturmianRecord` is 2 ms and a rebuild 18 — but the transport's `densityPeriod` scan is O(pairs × 2·10⁶), a generic λ occupies **eleven** eigenvalues (55 pairs, **594 ms**), and it is reached once per register *version*, which a drag bumps on every pointermove: 34 frames of 74 over 100 ms, the worst 650. The scan waits out a live pointer now — the law history.js already applies to its commits — while every reader outside the frame loop (`LW.period`, ⟳, the digest) forces it, so no proof and no button sees a settling answer. Dragging λ while playing: **0 of 40 frames over 100 ms (worst 55)**, one 636 ms scan when the gesture ends. The ELEMENT knob was already honest: a real drag 1 → 36 is 672 ms with a worst frame of 150.

**fps**, ELECTROSTATICS Φ + WIGNER + RADIATION + MOLECULE (the 42-function REGISTER basis, EHRENFEST running) all open and playing, 3 s at 1400×900: **28.0 light, 28.0 dark** (60 shipped, 50 on the 1s LCAO) — above the floor, so nothing was throttled for it. The budget is molecule 18.0 ms, overlays 4.1, wigner 4.4.

**One proof updated, and why.** B57 asserted the RADIATION canvas `ink === 0` with no pair and under a stood-down Hamiltonian — the blank slab this wave was *asked* to judge. The clause reads "the frame and nothing more" now: 1228 px against 6899 for a real pattern, under a third of `patInk`. Every other block is untouched.

**Left for Josh.** (i) A MOLECULE **BASIS** change is not an undo step — wave 43's law keeps the register side alone and the MO basis changes no ψ — so UNDO after one silently undoes the *previous* register edit; widening the law is his call, not a bug I should decide. (ii) `--n1…--n6` are ONE palette, chosen against a dark ground and used unchanged on the light theme, so the shell colours are pale there wherever they are ink rather than graphics. **Lesson:** the expensive thing in a frame is rarely the thing the wave built — a knob that stalled a Sturmian drag was paying for the *transport's* recurrence scan, and only an instrumented rAF callback said so; a per-frame readout cached on a version counter is not cached at all while a gesture is bumping it.

### wave 45: THE PERFORMANCE WAVE — the frame measured, the maths taken off it, and the blur named

Josh's words (M5 iPad Pro over the LAN, Linux Firefox): laggy with some features on, RAM crashes, the bow "waits a few seconds", the playhead "keeping frames", a freeze "at a consistent rate" on idle. Method: rAF-timestamp histograms over 30 s (Firefox has no `performance.memory`), one headless peek per scenario, bytes counted structurally. Everything below is before → after on the same machine, shipped layout unless said; the tools are `tmp/f15-perf/probe*.mjs`.

**FREEZES — attributed, not guessed.** Shipped layout, 12 s of idle play, windows powered off one set at a time: with only SLICE off, *no frame over 20 ms* (p95 17.1, max 17.4); with it on, 9 frames in 50–100 ms and 14 in 34–50. The consistent-rate freeze is SLICE's 128² resample of every populated mode at 8 Hz — 20–100 ms each here, 134 ms after a bow (91 labels). `sliceview.js` is the UI's; the instrument's answer is **THE READER LAW** (rack.js `may()`): while the transport plays, a window whose update was *measured* over a frame's budget (16 ms) is PARKED — it runs on pause, on an edit that shrank the state, and its status says so — one over half a frame runs at most every 6 × its cost, and a scrolling rack makes every reader yield 150 ms; paused, every reader runs on every frame exactly as before (no proof after `settle()` changed). 30 s idle, shipped: **before 1684 frames, median 17.1 ms, p95 33.2, max 117, 7 frames over 3 × median; after 1770 frames, median 17.08, p95 17.12, max 50.3, 0 over 3 ×**; the loop's own work 5.5 → 3.4 ms. Left for the UI: SLICE's resample chunked over frames (a few rows per frame) and SPECTRUM's 91-lane DOM rebuild on a landing (one 449 ms frame while playing).

**THE BOW — three blocks, all on the pointer.** kick.js built its angular table on the first slap (127 ms), a BOX bow projected the packet on a 36³ grid × 91 Bessel modes (191 ms, `wellPacket`), and the seconds were the transport's density-period scan on the first frame after the finger lifted — 56 incommensurate well energies, **1.2 s** (wave 44's law only waited out a *held* pointer). Now: `kick.js warmStep()` builds the same tables (bit-identical, kick.test 16/16) 8 ms at a time in idle; **`lab/mathworker.js`** — two module Workers importing the same pure modules — runs the bow's slap (`applyKickAlong` + ⟨p⟩ before/after on a snapshot of c(t), landed by `Register.setAnchorAt`, `_op`'s exact road), the BOX packet, and the frame path's period scan; `LW.bow.landed` resolves when the queue is empty; a worker that fails or times out (8 s) hands back to the synchronous road, which SLAP, the K key, LAUNCH and every forced `LW.period` reader still take. Measured: hydrogen bow **127 ms (first) / 19 ms sync → 0 ms, lands in 25 ms**; BOX bow **191 ms + a 1.2 s frame → 0 ms, lands in 243 ms**, REPEATS settles off the frame to the forced reader's value (7893.69 a.u.); playing, the median frame after a bow **199 → 17 ms**. At Josh's 128³: hydrogen 22 → 0 ms, BOX 200 + 377 → 0 ms.

**RAM — the audit.** The field is two `rgba16float` 3-D textures (the only filterable storage format: f16 is already the floor), 2 × res³ × 8 B = 13.5 MB at 96³, 33.6 at 128³; every readback (`readPixels`, `sampleVoxel`, `fieldDigest`, `readStats`) destroys its staging buffer and none is on the frame path. What churned: `packModes` (a fresh 36 KB Float32Array per reconstruct, the whole 320-record buffer uploaded), the params/stats/view/matrix/line arrays, `modesAt`'s record objects, `energy()`/`autocorrelation()`/`normalAmplitudes()` (two Float64Array(91) + four arrays, several times a frame), the particles' Map, string keys, `slice()`s and trail arrays — ≈ 60 KB of garbage per frame at 60 Hz, gone: every one is a persistent scratch (field.js, state.js, particles.js ring trails) and only the records in use are uploaded. The KEPLER overlay canvas was sized full-stage on every frame while OFF (4.35 MB here, **22 MB at the iPad's DPR 2**) — 1 px until it is on, one clearing draw after; the particles' canvas is released when off. Page canvases 11.5 → 7.1 MB; GPU peak at the iPad, 128³, all overlays off: ≈ 129 → 108 MB, and the steady allocation rate ≈ 3.6 MB/s → ≈ 0.

**KEEP FRAMES.** The playhead stored nothing: it *wrote* — the scrub fader's `--fill` and value on the transport's `.glass` (a backdrop-filter surface) plus the t and REPEATS strings, on every frame. A SETTINGS switch, **off by default**: the bar is disabled (dimmed, pointer-events none, fill 0), the t readout runs at 5 Hz while playing, RATE and play / pause are untouched; on restores every frame; remembered in `lambdawaves.q0.settings`, never in a project.

**THE GOVERNOR** extends `autoQ`: the median of the last 60 presented frames against 28 ms, judged every 30 frames while playing → the FIELD grid one notch down (128 → 96 → 64, `quality.res` stays the user's) and the READER LAW's tighter budgets; 3 s under 22 ms steps back up; pausing restores everything at once. Its own SETTINGS switch, on by default, **independent of AUTO SCALE — Josh's `auto: false` leaves it on**; METERS carries `GOVERNOR state · median · grid` with what is parked. Forced 40 ms per frame: 96³ → 64³ in 1.5 s, METERS "STEPPED −1 · 66.4 ms · 64³", back in 7.7 s.

**FROST, measured on Josh's own settings** (dark, 128³, half 4, AUTO SCALE off, the new windows closed, FROST 21 px): **13.3 fps, median 82.5 ms per frame with FROST; 52.8 fps, 17.1 ms without** — the loop's own work 3–7 ms either way. The backdrop blur of both racks is recomposited on every frame the field changes; no grid notch touches it (64³ + SLICE parked: still 67 ms). So the governor *diagnoses*: a frame far longer than the maths in it is the compositor's, and with FROST on it SUSPENDS the blur while the transport plays and brings it back on pause (switch on, setting kept, the governor switch holds it off): median 83 → 17 ms within 2 s. The FROST hint and the SETTINGS note now say what it costs (≈ 25 fps on a GPU-composited desktop, an earlier wave's number). **Found on the way:** a `schedule()` from inside the frame loop registered a second rAF callback (rafId is 0 while the loop runs) — every in-loop schedule (H₂ running, a governor step) added a loop call per frame for good, and METERS read 300 "fps" at 58 Hz; `inLoop` guards it. The REPEATS readout did not repaint when the off-frame scan answered a paused instrument (no frame is scheduled when paused): the answer schedules a PRESENT.

**Proofs.** `tests/perf.test.mjs` (5 judged lines, 0.4 s): the incremental SLAP tables give the identity at k = 0 and the dipole 128√2/243, `packModes` packs into one persistent buffer with the right count, the scratch observables equal the direct sums (1e-14), `setAnchorAt` reproduces `kickAlong` (1e-13), the ring trails cap and the canvas releases. **B60**: KEEP FRAMES off by default with the bar disabled while play / pause and a RATE drag work, on restores it, remembered and not in a project; the bow returns in < 5 ms with a macrotask pointer event handled in < 50 ms and the slap landed in < 2 s, the BOX packet and the off-frame scan the same; the governor under a forced 40 ms load steps 96³ → 64³ and lifts back, its switch holds it off; zero errors. **One proof updated, and why:** B27 asserted the slap's result synchronously after `release()` — the very thing this wave was asked to change; it awaits `LW.bow.landed` now. Every other block is untouched. Gate: `./test.sh` → `node: 0   browser: 0` — 29 node suites and 76 browser blocks (B1–B60), every earlier block unchanged but B27.

**On the iPad** (M5, Safari): open SETTINGS → METERS; play 1s + 2p_z and watch `GOVERNOR` read `nominal · ≈ 8–17 ms · 128³`; draw a bow and watch the STATE window say "the bow is in flight…" then "changes c" with the pointer never waiting; turn FROST on and watch the governor hold it while playing; open SLICE and watch it read PARKED while playing and resample on pause.

## What QWAVE-0.x should add (in order)

1. **Probability current** as a third field product (compute ∇ψ on the grid, render as flow lines or as a coloured quiver on the slab) — the honest way to *see* the 2p₊ current and the dipole's charge sloshing.
2. **Rydberg revivals** — raise the basis ceiling for a Rydberg-only register (the exact core costs nothing; the kernel already takes tables) and show T_cl, spreading, fractional revivals, T_rev = 4πn̄⁴/3 with the spectral origin highlighted on the ladder.
3. **KS 4D shadow / Fock S³** — the second exact representation family (§15): a `KS OSCILLATOR` view with its own status label and fictitious time clearly not the lab time.
4. Packet launch by projection, general D^l(R) state rotation, rack drag-reorder, MIR descriptors for the existing parameters (ids are already stable: `observer.*`, `material.*`, `state.mode.h:n:l:m.*`, `transport.*`, `field.resolution`).

### wave 46: MINIMAL GRAPHS — nothing floats inside a plot, one tip answers for the object under the pointer, and the light theme gets its own vivid shell set
Josh: "all of the random floating colored texts in the graphs … a minimalist graph with no text and subtle information, and hovering over the corresponding object like a line/curve/dot will reveal that specific object's information"; "make the colored indicators more vivid and not have any overwrite/overflow"; and the OBSERVABLE as "a 6x2 grid instead of 5 buttons and a 6th one taking the entire bottom row".
THE GRID is CSS only — the OBSERVER window holds exactly one seg with six segments, so `:has(> .seg-b:nth-child(6))` names it and `display: grid; grid-template-columns: 1fr 1fr` gives six EQUAL cells over three rows. No rack.js change.
THE LAW OF THE PLOT: a plot rectangle carries lines, curves, dots and bars — never a word. Names live in the gutter, the two END values of an axis live under it or beside it, and the law lives in the caption; everything else is on the object. `graphHover(canvas, {objects, plot, repaint, draw})` in kit.js finds the nearest object within 8 px (distance to the polyline for a line or a curve, to the centre for a dot or a bar), highlights it 2 px brighter over a halo of its own colour, and shows ONE glass tip `#graphTip` — fixed on the body, clamped to the viewport, the card's ink and no colour overlay — carrying exactly the text the floating label used to carry. A tap toggles it on touch. A raster (WIGNER) registers one `quiet` object whose info is a FUNCTION of the pointer, so the map reads (z, p_z) and W with its sign where the finger is. Every view re-registers its objects at the end of every redraw; the plot rectangle is parked on `canvas.__lwPlot`, which is what the proof asks.
WHAT WENT: the ladder's "50%  −0.1250" stroked on its own bar; SHADOW's stacked phasor legend and the ω under every bead; ORBIT's per-shell "n2 e=0.834 (rank > 1)" corner stack; DYNAMICS' "L(t)"/"S(t)"; QCD's masses beside every rung and its header; MOLECULE's and MO's "R_e" and their in-frame "R a₀"; ATOMS' names stacked over its radial curves; WIGNER's two coloured sign glyphs; RADIATION's "dP/dΩ" and its dipole legend; the SLICE's frame caption and its cyan "HOLOMORPHIC U(2)"; KEPLER's whole per-orbit numbers line, now on its perihelion handle (that canvas is pointer-events: none, so it drives the same tip through the rack's own hit()/setHover() — again no rack.js change).
VIVID: --n1…--n6 were chosen on the dark ground and measure 1.25 : 1 … 2.19 : 1 against the light card. The light set keeps every hue, pushes the chroma up (+12 saturation) and walks the lightness down until the WCAG ratio clears 3 : 1 against BOTH grounds the app renders — the card, MEASURED in the page at 236,239,243, and the well every plot sits in, 220,225,232: n1 3.45/3.03 · n2 3.50/3.07 · n3 3.42/3.00 · n4 3.43/3.01 · n5 3.47/3.05 · n6 3.47/3.05. Computed, not eyeballed. The dark set is untouched; `nRGB(n)` and `vividInk(rgb)` carry the same walk to the canvases.
NO OVERFLOW: every glyph left in a canvas goes through `fitText`, which measures it and either nudges it wholly inside its rectangle or drops it (a caption is clipped with an ellipsis instead — better short than gone). The ladder's gutter now places a name only when its row is free, lit levels first and by population, because E_n = −1/(2n²) bunches n3…n6 inside 6 px of E = 0 and they used to print as one smear. WIGNER's bottom row was the same collision: the x ticks and "z a₀" shared it, so MB is two rows now.
TWO THINGS A CANVAS DOES NOT KNOW: it has no theme, and it has no size when it is folded. `themeInk(g)` reads --dim and --fg from the body for the five views still written in rgba(255,255,255,…); `onThemeChange` repaints every registered view on the flip; and a ResizeObserver repaints one that had NO size when the flip happened — MOLECULE held the dark theme's cyan on the light card until its R moved. `.orbit-c`, `.shadow-c` and `.dyn-c` now take `var(--glass-well)` instead of a hard black (identical on dark, correct on light).
PROOF: B61 — the six cells over three tops and two lefts; one ladder redraw under a proxy on CanvasRenderingContext2D.prototype.fillText with not one glyph inside cv.__lwPlot; a pointermove on the n2 lane raising exactly one #graphTip with that level's own line, and pointerleave taking it away; --n2 measured against the ground the card renders at 3.57 : 1 where the dark set gives 1.40 : 1; zero errors.
LESSON: `background: <color>, <color>` is valid at parse time and INVALID at computed-value time, so it falls back to `initial` and takes the card's tint with it — `.dev` in skin.css has been fully transparent, which is why the light card reads as the stage. The fix is one line (wrap the sheen in a `linear-gradient()`), it restyles every card in the app, and it is Josh's call, not a UI wave's.


### wave 47: CARD STYLE — the refractive glass was an accident; it is now a setting, and the default
Josh: "can it be an option in the window for the card style? I love that refractive glass effect."
THE BUG WAVE 46 NAMED, MEASURED. Three declarations dressed the glass — `.dev` (skin.css §3), the open hint panel (§4) and `.glass` (§10) — and all three read `background: var(--glass-sheen), hsl(var(--glass-tint) / …)`. That parses, but it only COMPUTES where `--glass-sheen` is an IMAGE. In the DARK theme the token is a 160° gradient and the rule worked: the card computed to rgba(28, 32, 38, 0.84). In the LIGHT theme — the shipped default — the token was the COLOUR `hsl(0 0% 100% / .55)`, and a colour is legal only as the LAST background layer, so the whole declaration was invalid at computed-value time, fell back to `initial`, and every card, popover and chrome pane rendered rgba(0, 0, 0, 0): the backdrop alone. Twenty-four waves of a look nobody wrote.
THE SWITCH. SETTINGS · THEME · SURFACE gains a CARD STYLE seg beside FROST and GLASS BLUR. REFRACTIVE (default) says `background: transparent` on purpose, in BOTH themes — the accident, promoted to a decision. TINTED is the rule the author meant, and it now computes in both themes because the light `--glass-sheen` is the same flat white wash written as a (flat) gradient, so it is a legal layer whatever the theme. Measured: TINTED light card = tint 233,237,241 under the .55 wash = 245,247,249 — exactly the numbers §14b predicted from the tokens and could not find on the screen. The choice rides in the settings key beside theme/frost/blur, never in a project, and it is on `document.body.dataset.card` before a single window is built, so the FIRST paint is already this browser's glass.
WHAT ELSE SHARED IT: `.glass` (the badges, the sheet, the info popover, both rack buttons, the docked transport) and the open `.note.hinted` panel — the same declaration, the same collapse, so they answer the same switch. What did NOT share it, checked with getComputedStyle and left alone: the notebook (its own transparent+blur rule), the menus `.mb-list`, `#graphTip`, `#transport.mini`'s .72 pill (an id outranks the switch) and every neumorphic puck — none of them ever carried the sheen layer. FROST is untouched: the card-style rules sit BEFORE it on purpose, so its whisper of white still wins.
THE STAMP: the ABOUT face's version line was hand-written markup, three waves stale. It is now `BUILD_LINE` in rack.js — one constant, written into `.ab-version` at boot, and the copy dump quotes the face, so both read `PRE-ALPHA · waves 5–47 · 2026-09-05` from the same place. Every wave updates that line and nothing else.
PROOF: B62 — with no `card` remembered, applySettings lands on REFRACTIVE from a body wearing the other one; `.dev` and `.glass` compute to rgba(0, 0, 0, 0) with no image in both themes; TINTED gives a pane whose RGB is exactly the theme's own `--glass-tint` with 0 < α < 1, different in the two themes; the choice survives the readSettings/applySettings round trip; the seg has its two seats and its one-line hint in the row with THEME, FROST and GLASS BLUR; ABOUT and the dump both carry waves 5–47; zero errors.
LESSON: invalid-at-computed-value-time does not fall back to the previous cascade winner — it falls back to `initial`, silently, in one theme only. The tell was in the file all along: §14b's comment computed the light card at 245,247,249 and then measured 236,239,243 and shrugged. A token that is a COLOUR in one theme and an IMAGE in another is the whole bug; making both an image is the whole fix.

### wave 48: THE FINAL STRETCH OPENS — the GPU's chrome learns the theme, the mark tiles and turns, and a hidden interface is finally the fastest one
Josh, seven asks. THE GPU'S CHROME. The domain cube and the three axes are drawn by the line pipeline, so no CSS token could ever reach them — they were the one part of the lab the theme could not touch. `setTheme` now resolves a theme and hands it down as `mat.lightUI`; field.js keeps one ink palette per theme. LIGHT paints the box #05080d at α .42 (matched CONTRAST would be .14 — Josh asked for a line that READS black, and the rendered frame comes back at luminance 88 against a ground of 243, achromatic) and keeps the shipped warm/cool axes. DARK keeps the shipped white box at .13 and takes vivid CMY: x cyan, y magenta, z yellow, measured off the rendered image at [6,223,224], [223,6,224], [230,230,2] with not one warm, green or blue pixel between them.
THE THEME HAS THREE SEATS AND TWO VALUES. `themeChoice` (LIGHT / DARK / SYSTEM) is what the settings key remembers; `theme` is the resolved one — always light or dark — and is what the body, the accents, the GPU chrome and the notice read. SYSTEM follows `prefers-color-scheme` through a matchMedia listener that re-resolves without touching the choice. The shipped default is still LIGHT. A project carries none of it: `lightUI` joins `bg` and `gamma` outside the file.
THE MARK. The nine squares stepped 2.25 but were 2.1 wide, so the logo was a grid of gutters; step now equals width and the colours touch. And there were three copies of the wheel — the header's, the ABOUT clone's, the new busy mark's — but only `#title .mark rect` was ever repainted, so the clone froze at whatever it was cloned from. One `paintMarks()` now paints all three from the same nine samples (`i % 9`), and the header turns one full 360° on boot, resting at 45° (that angle lives in the SVG's `<g>`, so the element's own transform rests at none).
THE BUSY MARK. `LW.busy` is a nesting counter, not a flag: `begin()`/`end()` bracket every Worker job (one wrapper in `makeWorker.call` catches the bow's slap, the BOX packet and the period scan), every atom solve, every project load and every field rebuild — plus a rule that needs no instrumentation, a frame gap over 250 ms raising it for 600 ms, which is how it stays honest about freezes nobody wrapped. It rides the pointer through `--cx`/`--cy` written as custom properties (a write, never a layout read, and only while it is up) and it spins and hue-cycles PURELY in CSS, because a thread that is stuck cannot animate anything from JS. No shadow of any kind.
HIDDEN IS NOW THE FASTEST STATE. Measured, budget-independently, as the median of the loop's OWN main-thread ms with nine readers live, the notebook open and the clock playing: BEFORE 2.76 / 2.46 ms shown against 0.83 / 0.75 hidden; AFTER 2.67 / 2.68 shown against 0.29 / 0.35 hidden. Three things were still running behind a hidden interface — every reader writing strings into `display:none` cards, the peek handler resolving the root's computed style on EVERY pointer move to read a constant, and the notebook's backdrop-filter being recomposited on every frame the field changed. The readers are gated, `--rack-w` is read once and on resize, and §48a takes the notebook and both peek strips out of paint: blurred panes still composited while hidden went 1 → 0, and with FROST on 27 → 0. What is NOT gated is anything the stage shows or anything with physics behind it — the molecule and H₂ integrators were lifted out of the gate, because they are the picture, not the chrome. A rack slid away by B now goes `visibility: hidden` after its slide: out of paint, scrollTop kept (display:none would have thrown it away).
THE GRIP. CSS `resize` is a mouse affordance no touch pointer reaches, so the notebook's corner got a 22 px element with real pointer events; `resize: both` stays for the desktop and both roads end in the same inline size, the same 320 × 240 floor and the same two numbers in the settings key. The faces still fill the glass by flex — the wave-24 law is why sizing the shell is the whole job.
THE NOTICE. MANDELBROT's photosensitivity warning, carried over verbatim in text, caution triangle, 34em card and focus trap (no Escape, no click-outside), with three things ours by instruction: a frost-glass ground over the RUNNING lab instead of solid black, since λWAVES has no menu to stand in front of (blur at the `--glass-blur` token, no colour tint, desaturated — which adds no colour); ink BLACK or WHITE by the resolved theme; and a memory in the settings key with SETTINGS · SHOW THE WARNING AGAIN as the way back. The triangle is filled with the orbital Josh sent, clipped and zoomed so the lobes fill it, with the exclamation cut in the theme's ink. MANDELBROT's automation bypass came too (`navigator.webdriver`, `?warn=0/1`) or a modal would stand in front of every screenshot the gate takes. ABOUT carries Josh's new blurb, Magic Commons, Apache 2.0, ChronusQ and the thanks in his order; LICENSE (Apache 2.0, Copyright 2026 Joshua Hosain) and NOTICE (Spinwerad 0.3, Roboto 3.015, marked 12.0.2 + Markdown BSD-3, KaTeX 0.16.11) are new at the root.
PROOF: B63 — the ink per theme and the rendered pixels that classify it, the three seats, SYSTEM resolving to matchMedia, a project carrying no theme, and the notice's text / symbol / ink / ground / memory / SETTINGS row. B64 — the nine rects tiling with zero step-minus-width, all three marks moving together when the wheel turns and returning together, the ABOUT face and its dump, the grip dragged by synthetic pointer events with the size round-tripping the settings key, the busy counter up on a Worker job and down after it with `--cx`/`--cy` following a move and no shadow, hidden ≤ shown on both samples, zero blurred panes while hidden, and a slid-away rack keeping its scrollTop. Zero errors.
LESSON, twice. `Array.map(fn, x)` takes a thisArg, not a second value — a second `Math.abs(...)` there is evaluated with the arrow's parameter out of scope, and the ReferenceError arrives with an empty message. And a 600 ms "flash" window has to close itself: nothing else will ask again, so the mark went up on the first long boot frame and stayed up forever until `busyFlash` scheduled its own re-sync.
NOT PROVEN HERE: this headless Firefox reports `backdrop-filter` as supported and never paints it — a bare control div does not blur either — so the frost is verified by computed value (`blur(18px) saturate(0.5)`), not by pixels; it is why lab.css already ships `--glass-filter: none`. A `@supports not (backdrop-filter)` fallback gives an ACHROMATIC veil to browsers that genuinely lack it, so a safety notice is never unreadable.


## 2026-09-05 · Astra math audit and molecular roadmap

The [audit](research/astra-2026-09-05/MATH-AUDIT.md) corrects the rank-one/SO(4) coherent-state claim, scopes the Pulay energy comparison, and demonstrates the missing moving-basis transport term. A new headless H₂⁺ electric-pulse module is checked against an independent analytic/SciPy oracle with second-order timestep convergence. The [implementation plan](research/astra-2026-09-05/MOLECULAR-PLAN.md) covers correlated H₂, an arbitrary-atom builder, density-matrix response and eventual moving nuclei/benzene. Independent PySCF H₂ and static benzene fixtures, a plotted pulse trace and source/coverage records accompany it. All 31 Node suites pass; browser/UI verification was unavailable. The full research corpus is indexed and selectively audited, not blanket-certified.

### wave 49: THE LEFTOVERS AND THE THIRD LAB'S CONTRACTS

**SLICE runs live again.** `sliceview.js` samples the 128² plane in ROW CHUNKS under a measured 2.2 ms/frame budget (always ≥ 1 row, so any machine makes progress), with a generation counter on `version|t|mode|half|res` + both rotors that drops a stale partial, and partial sweeps normalised by the PREVIOUS sweep's absMax so the picture does not re-brighten every frame; the completed job repaints through `paintSlice` itself, bit-identical to the unchunked image. Peek, playing, 13 modes, 120 frames: median gap 49.6 / 33.3 ms, max 83.5 / 66.6, **ratio 1.69 and 2.00** (gate ≤ 3), canvas different at t, t+2 s, t+4 s, `slice.update()` 3.0–3.9 ms, and SLICE is no longer in `governor.parked`.

**SPECTRUM lands a packet in one frame.** `spectrum.js` splits `rebuild()` into the exact cheap half (lane diff, removals, order, chips, caption, ladder) and a PENDING QUEUE of lane CONSTRUCTION drained from `update()` under 6 ms/frame; every DOM write is dirty-checked against a cached last-applied value. The spectrum's own worst landing frame **28–34 ms → 6–7 ms**, the longest whole rAF callback **84 → 32 ms** (gate < 60), 85 lanes settled in 9–10 frames, and the settled lane DOM is **byte-identical** to the stashed original's single full rebuild — including a stress run with mute/solo/select, nine dropped and eight added labels and a second kick landing mid-drain.

**W-ORBIT-GATE.** Coherence is now ONE SO(4)-invariant scalar: |⟨L⟩|² + |⟨K⟩|² = 2(|⟨J₊⟩|² + |⟨J₋⟩|²) saturates its ceiling (n−1)² **only** at a coherent state. `frontier.js`'s `shellCharacter` gates it at 1e-9 absolute and ORBIT prints "**rank one · not coherent**" for −0.5774·3s + 0.8165·3d₀ — Schmidt (1,0,0), ⟨L⟩ = ⟨K⟩ = 0, scalar 0 of 4 — which the old `S[0] > 0.9995` called a Kepler ellipse with e = 0. `math-audit.test.mjs` is judged now (6 GREEN, 0.03 s): the counterexample, the regression guard on both witnesses, saturation to 7.1e-15 on 18 true coherent states (n = 2…4, built by rotating the extremal one), the n = 1, 2 and empty limits, the label read out of orbit.js's own source, and Astra's −0.170613679949 kept. Verified in the browser: the card prints the string.

**W-CONNECTION.** The moving-basis connection is in `mo.js`'s Ehrenfest branch and **nothing is renormalised**. It is ONE-CENTRE: D = S′/2 + ½diag(P, −P) exactly, because the cross-centre blocks are symmetric and therefore pure metric — no new two-centre integral exists. `oneCentreP` is a closed form (finite Γ sums off the ledger's translation closure): **P(S1s,S2p₀; λ=1.7611) = 0.880550**, hydrogen **0.279350827 = (3/8)(128√2/243)** to 1e-9, antisymmetric to 2e-16, **exactly 0 on lcao1s** — so renormalisation there IS the exact transport, to 1e-15, and mo.js:57–67 now says so (Astra's sentence was true of the operator, the lab's of the observable; both are stated). The step does not SPLIT: the whole generator goes into one exponential in the S^{1/2} frame, exp(Ẑ) = cos M + J sin M with M real symmetric 2n × 2n — exactly S-unitary, exact in dt for the H part. Splitting it cost 2.4e-4 of the norm at dt = 5. Gates: metric term −0.170613679949; transport Richardson ratios 3.99/4.00/4.00 against dc/dR = −S⁻¹Dc; **the Ṙ² law 3.99 twice** on a ballistic sweep with the S-norm at 2.3e-14 and no rescaling; the Ehrenfest–BO gap **2.23e-5 → 5.15e-7** once resolved. The catch, judged: the generator is now R-dependent, so dt = 5 is 26× off and dt ≤ 2.5 is resolved. What it does NOT repair is the basis — ⟨S1s|∂_z|S2p₀⟩ = 0.8806 survives at R → ∞, the ETF defect (ledger Q2). `moview.js` gives BO runs their green back when |drift| ≤ ∫bound with no clamp; Ehrenfest is never green. `mo.test.mjs` **32 GREEN** (26 + 6), 13.2 s.

**W-H2CI.** New `lab/h2ci.js` (298 lines, no deps): Weinbaum's covalent + ionic 1s-STO function — which is exactly the minimal-basis FCI in ¹Σg⁺ — on exact integrals, with (aa|aa) = 5ζ/8 and Slater's hybrid (aa|ab) added to h2.js's J′, K′; and STO-3G RHF + FCI from s-Gaussians with a Boys function summed as a positive-term series. **E(1.40, ζ=1.193) = −1.147720, D_e = 4.020 eV, λ = 0.260**; curve minimum R_e = 1.430, 4.026 eV. **RHF −1.116714325, FCI −1.137275944** at R = 1.4; against **PySCF 2.14.0 at 3.00 Å the agreement is 7e-12 and 3e-13**. At R = 8 RHF sits 0.3231 hartree above FCI while FCI has reached 2E(H, STO-3G) = −0.933164 to 3e-6 — a closed shell cannot dissociate. The oracle that matters: the M_s = 0 triplet is an exact CI eigenvector, and at ζ = 1 it equals h2.js's Heitler–London triplet **to 4.4e-16** at five separations, files written months apart. Two symmetry traps are documented because both bite: a localised SCF guess lands 0.32 hartree above σg, and σg is an UNSTABLE fixed point of the undamped map at large R (asymmetry × 2.13 per cycle), so F is projected. `h2ci.test.mjs` 8 GREEN, 0.62 s. `h2view.js` draws the two curves beside Heitler–London — broken, not clipped, where RHF leaves the box — with a readout of the correlation energy at the marker.

`./test.sh node`: **exit 0 — 487 judged GREEN gates in 31 suites, 0 RED**, plus Astra's 3 assert PASS lines.
