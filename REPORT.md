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

### wave 50: W-CAMERA — NEBULA's motion as ONE law with a friction constant, and the four rack leftovers

**THE LAW (design choice; the integration is EXACT).** The camera had two booleans and a speed; NEBULA has four Auto-Rotate × Momentum states and a fling that fights whichever is on. Both are replaced by one first-order law with one constant: **ω̇ = −μ(ω − ω_amb)**, i.e. **ω(t) = ω_amb + (ω₀ − ω_amb)e^{−μt}**, with ω_amb = (AUTO-ROTATE ? SPIN : 0, 0) a yaw drive and μ = **FRICTION**. A fling therefore COMPOSES with the ambient spin and relaxes TO it (NEBULA's N7 as an equation, not a state machine): μ large is "no momentum", μ moderate is momentum, **μ = 0 is no decay at all — the view spins forever** — crossed with the ambient switch, and every combination is reachable. Each frame integrates the closed form, not ω·dt: Δyaw = ω_amb·dt + d_y(1 − e^{−μdt})/μ. **Constants:** μ ∈ [0, 12] /s in steps of 0.05 (so 0 is exactly reachable by the dial, and reads **∞ · forever**), **default 2.5** — τ = 0.4 s, a 3 rad/s flick coasts ln(ω₀/ω_rest)/μ ≈ 2.8 s and turns through exactly ω₀/μ = 1.2 rad = 69°, two flicks round the cloud, where μ = 12 gives 14° and μ = 1 most of a half turn; **REST = 0.003 rad/s** (half a pixel a second at the drag's own 0.0065 rad/px) below which the residual is set to zero and **the loop stops scheduling**; |ω| capped at 12 rad/s; pitch clamped at ±1.52, and a fling into the pole loses its pitch and keeps its yaw. The camera schedules PRESENT only, is not on the undo stack, and cannot move `reg.version`. The fling is measured from the drag's own POSE history over 80 ms; **Shift is the fine drag** (a quarter of the gain) and pressing or releasing it mid-drag **clutches** — the history is cleared, the pose never jumps (N1, N2).

**THE WINDOW.** AUTO-ROTATE · SPIN · FRICTION · ZOOM · FOV · RESET VIEW · SET Δρ REF, all in the existing kit. ZOOM, the wheel, a pinch and the arrow keys are ONE road (`setDist`), so the dial cannot lie; every wheel modifier zooms and adds no rotation (N8). Double-click resets the view, and so does a **double-tap** — built, because `dblclick` is a mouse affordance an iPad may never raise. **SEED is dropped:** NEBULA's is its point-bank RNG, ours is the particle cloud, which already has RESEED and Ctrl+R in DYNAMICS — a second copy in CAMERA would be a duplicate control in the wrong window, so the note sends the reader there instead.

**THE LEFTOVERS.** (1) `may()` never re-measured a parked reader, so a window that got cheap stayed parked for the session: a parked reader is now let through **once every 3 s** — the governor's own recovery cadence, ≤ 1 % of the wall — with its stale EMA cleared first so the probe writes a fresh number. (2) `api.energyOf` dropped the RATE that the register actually evolves with; it is `energyOf` now, and the two places that painted a lane by hand (WELL RADIUS, `switchHamiltonian`) go through it. (3) The comment on the WIGNER reader's throttle (rack.js:488, line 413 before this wave) named the SLICE; it names WIGNER. (4) MOLECULE: **CONNECTION** (default ON, Ehrenfest only) reaches `mo.js`'s moving-basis transport at last, with the **dt ceiling** beside it — amber above 2.5 a.u., because the carried generator is R-dependent (mo.test W49-6: excess electronic energy 3.08e-5 · 2.14e-6 · 1.19e-6 at dt = 5 · 2.5 · 1.25) and the shipped dt = 5 said nothing.

**PROOFS.** B65 the law: decay against e^{−μt} on the camera's own clock to **better than 1e-15** relative — 5.6e-16 and, in the gate run, exactly 0, because the step IS the closed form and not an Euler step — with that clock the wall clock to 17 ms; the travel identity ∫ω dt = ω₀/μ = 2.4 rad to **1.15e-3**, inside the REST/μ = 1.2e-3 the threshold is allowed to discard; at rest **0 frames in 300 ms**, `scheduled` false; μ = 0 holds |ω| to 0 over 2.2 s with Δyaw = ω₀Δt exactly; ambient + fling settles to 0.5011 against the closed form 0.5012; version, digest and undo depth unmoved and not one RECONSTRUCT. B66 the window (μ = 0 by the dial, the wheel under four modifiers, both resets, no SEED). B67 the drag: 0.390 / 0.0975 / 0.390 rad over default → Shift → default, no move bigger than one coarse step, the clutch flinging the fine way at 0.81 rad/s where the coarse would have been 32.5. B68 the four leftovers. `./test.sh`: **node: 0   browser: 0** — 84 judged browser lines, 0 RED. LESSON: two wall-clock judges on this box are thin — B64's hidden-vs-shown median and mo.test's T WALL TIME each went red once on load alone (ten stale headless Firefoxes from earlier days, load 5.6 of 12 cores), and both are green on a quiet machine; neither touches anything this wave changed. The re-probe now takes at most ONE probe per frame, since a probe is by definition a reader over budget and the law exists so that no frame carries two.

### wave 51: W-MOBILE — one rack on the left, a 44-px finger on 22-px ink, and the low-power path

**THE BREAKPOINT (design choice, stated honestly).** A phone is not a narrow desktop, so width alone cannot name one: the query is a **POINTER / SIZE pair**, and the pointer half is `(hover: none)` — the house's own touch idiom (skin.css §13 already reveals with it everything the desktop hides behind hover), and the one pointer feature a headless proof can reach. **Arm 1, portrait:** no hover and ≤ 700 px wide — every phone portrait today is ≤ 440 CSS px (673 on an unfolded Fold) and the narrowest tablet, the iPad mini, is 744, so 700 sits in that gap with room on both sides. **Arm 2, landscape:** no hover, ≤ 520 px tall and ≤ 1000 px wide — a phone on its side is 440 tall at the largest and every iPad in landscape is 744 tall or more. A desktop window dragged down to 390 px keeps `hover: hover` and keeps the desktop layout, which is what "what the desktop keeps" means. **THE IPAD IS UNTOUCHED:** it clears both arms, so it keeps the `max-width: 860px` bottom rack it has today — that rule was left exactly as written, with a comment added saying whose it is. The query is written **once**, in skin.css, and raises `--phone: 1`; rack.js reads that sentinel back out of the computed style (as the peek handler already reads `--rack-w`) instead of carrying a second copy of the query in script.

**ONE RACK, ON THE LEFT, portrait and landscape both.** `#rackL` and both hover-peek strips stand down; every card the mirror rack held joins the one rack, each remembering the rack it came from, so crossing back restores the desktop exactly (SPECTRUM to the left, the transport out of its dock, 96³, DPR cap 2). The **transport docks as the first card** and is **hideable, never closable** — no × at this breakpoint, ▾ is the hide, and which way it was left rides in the settings key as `phoneTr`. The **hide toggle follows the rack**: 310 px of travel when the rack leaves, parked in the thumb zone at the rack's outer edge, and still the topmost thing at its own centre with the rack gone. `--rack-w` becomes `min(300px, 100vw − 76px)` — the designed density, clamped only under 376 px. The masthead (logo, which opens the menus, and the status tags) is a 46-px strip the rack starts below; the keyboard hint bar goes, because a phone has no keys.

**OPAQUE (the token, never a colour on a component).** `--glass-opacity` **.84 → 1** at this breakpoint on `:root` **and** on `body[data-theme]`, because the LIGHT theme redefines it on `body` and would otherwise outrank `:root`. Every unconditional `backdrop-filter` — the notebook's, the graph tip's — goes; the notebook becomes a full-screen sheet. CARD STYLE stays a setting and its **default** is now the device's: a new `cardSet` flag separates "this browser has SAID tinted" from "this browser has never said", which is what the old code lacked — the first `saveSettings()` of any session froze whatever the default happened to be.

**THE LOW-POWER PATH — and both numbers.** A device-pixel ceiling is a number the caller owns now (`field.setDprCap`, live getter, not through `Object.assign`): **2 → 1.5** on a phone, which on a real 3× screen is 0.56 of the canvas pixels. Grid **64³ / 110 steps / render scale 0.75**, GOVERNOR on, FROST off, KEEP FRAMES off — every one a **default, not an override**: a value SETTINGS has stored still wins, and the grid is restored on the way out. Measured at 500 × 844 with every window open and every reader awake, governor and auto-scale off in both arms, over 6 s of transport: **23.62 ms / 42.3 fps before → 20.03 ms / 49.9 fps after**. The field's own work falls further than that number shows — **67.5 → 26.1 M ray samples per frame (2.59×)** and **884 736 → 262 144 voxels (3.38×)** — because on this software adapter the frame is dominated by twenty readers on the main thread, not by the field; `gpuFrameMs` could not separate the arms at all here (every arm returns the queue's encode latency), so it is not the instrument that was used.

**TOUCH TARGETS WITHOUT INFLATION.** 461 controls, both orientations, **every one ≥ 44 × 44**. The ink is untouched: the k-dial's own trick ("the 44-px finger, the 34-px ink") is generalised — 22-px pucks painted into the **content box** of a 44-px button (same fill, same 1-px rim, same place), a 24-px status chip inside the 46-px masthead, 17-px lane knobs with a 45-px halo, ±8 px pseudo-elements on the two 30-px rack buttons. Only two **seats** grew: the card header 34 → 44 and a segment 38 → 44 (their glyphs did not). Two header buttons stand down instead of shrinking the window's own name on a 300-px card: **⇄ SWAP**, which would move a card to a rack that no longer exists (ANTI-PATTERN 7), and **⧉ COPY** (`LW.layout.copyDigest(id)` still answers). SPECTRUM's lane is the one interior re-flowed — seven controls in one 274-px row overrun 44 px by 20, so the lane becomes two rows of 44, same seven controls, same order.

**PROOFS.** **B69** portrait 500 × 844 — the sentinel, one rack at x = 0, both peeks down, the transport first with no ×, `--glass-opacity` 1 and zero backdrop-filters, 64³/110/0.75/1.5, the toggle's 310 px of travel and its reachability with the rack hidden, `phoneTr` round-tripping, nothing spilling. **B70 / B71** the hit walk: `elementFromPoint` answers ONE owner per point, so walking out from each control's centre measures the finger it actually has, clipped by whichever neighbour got there first — **every control clearing 44 simultaneously IS the non-overlap proof**, since an overlap would truncate the loser. **B71** also landscape 844 × 390 and a **real WebDriver touch tap** on the ORBIT canvas. **B72** the crossing undoing itself — judged against the layout THIS RUN was in, since earlier blocks move windows between racks — plus the two media queries read out of the stylesheets and pinned, so the iPad's fate is a fact about the text. **B73** the second rider: μ = 6.5 and SPIN = 1.25 written, both returned by the same `applySettings` boot makes, to the camera and to the two knobs' own readouts, with AUTO-ROTATE absent from the key and coming back off. `./test.sh`: **node: 0   browser: 0** — 89 judged browser lines, 0 RED.

**A REAL DEFECT, FOUND BY THE FINGER.** `graphHover`'s touch pin (wave 48) had **never worked on a touch screen**. Every engine destroys a touch pointer the instant it lifts and fires `pointerout` + `pointerleave` for it, so the pin `pointerdown` had just set was torn down about a millisecond later. Nothing had ever driven it with a real pointer — only through `__lwHover`. One line: a touch pointer never "leaves"; `pointercancel` still clears, because a cancelled gesture really is gone. This is ANTI-PATTERN 4 with its own mechanism already built and silently dead.

**THE RIDERS.** `BUILD_LINE` reads **waves 5–51** and is published as `LW.build`; the two gate assertions that pinned the number now **read it out of the page** and index.html's hand-written version markup is gone — one constant, no second copy anywhere (ANTI-PATTERN 6, which is why the constant exists). **FRICTION and SPIN** persist beside FROST and the GOVERNOR, saved on the knob's `onChange` (the release of a drag, so a sweep costs one localStorage write, not sixty); **AUTO-ROTATE deliberately does not** — a lab that starts turning by itself when you open it is a surprise, not a setting.

**LESSONS.** Twice this wave a block was green alone and red in the suite, both times for the same reason: it assumed the SHIPPED state where an earlier block had legitimately changed it (SPECTRUM's rack, and whether this browser had *chosen* a card). A block that measures a default must first make the default true, and one that measures reversibility must compare against what was there, not against the shipped layout. And `Object.assign` copies a getter's VALUE once — `field.dprCap` read 2 forever until it moved into `defineProperties`, which is the trap the very next comment in field.js already names (B10 caught it in wave 24 and it was re-earned here in ten minutes). `mo.test`'s T WALL TIME judge went red once at load 2.5 (median 61.4 ms against 60, samples 35.6 / 61.4 / 89.4) and is green on a quiet box — the same flake wave 50 recorded, and it touches nothing this wave changed.

**NOT DONE, ON PURPOSE.** The portrait proof runs at 500 × 844 rather than 390: headless Firefox floors its window at 500 CSS px wide and no pref reaches past it. The phone arm's only width-dependent quantity is the `--rack-w` clamp, which is inert at every width from 376 px up, so what is measured is what a 390-px phone gets — and the block asserts the clamp arithmetic rather than assuming it. `(pointer: coarse)` is never true in a headless browser, which is the second reason the breakpoint is written with the hover feature. The photosensitivity notice keeps its `backdrop-filter` (it is a once-per-browser modal whose legibility depends on the frost); `body.frost` keeps its blur if a phone user asks for FROST, so the switch stays honest.

### W-MIR (unnumbered; it ran beside board #33 and was forbidden to write its own block) — the modulation model, vendored BY DIFF

**WHAT WAS TAKEN, AND WHAT IT COST.** `lab/mir/mod.js` (2978 lines) and `lab/mir/curve.js` (416) were vendored on 2026-09-05 from the MANDELBROT app, sha256 recorded in `lab/mir/PORT-NOTES.md`. **ONE forced edit in ~3400 lines:** `PRESET_LS`, `'mandel.modpresets'` → `'lambdawaves.q0.modpresets'`, because it is a live `localStorage` key and an exported `const` string — the one thing in the file a host cannot inject, and left alone a λWAVES build would read and write BASINS's preset store. `curve.js` has **zero** content edits. Both carry a provenance header, and **that is the whole diff**: the gate strips the headers, undoes the marked line, and hashes both files against their sources — mod.js is 2 hunks, curve.js is 1, so an upstream fix stays a three-line patch a year from now instead of archaeology. What was deliberately left foreign is left foreign: `FACTORY_PRESETS` route to BASINS target ids and go **dormant** by the model's own law on the first `targets.sync()`, keeping their settings and moving nothing, and `PRESET_FOLDER_FACTORY` still says **MANDELBROT**, which is the honest provenance of the presets it names. `anim.js` (9573 lines — their modulation window), `window.js` (4727 — their WindowKit) and `audio.js` were **not** taken: our rack is our window kit, and wave 52 writes our own face.

**WHAT IS OURS.** `registry.js` (438 lines, **zero imports**, no DOM, no globals, no lab identity) — MIR edge 1. It names the **five maps** a `kit.js` control has always been and never had a word for: *linear · log · wrap · integer · bipolar* are `knob({min,max})`, `log: true`, `wrap: true`, `step: 1`, and a signed range. The law each obeys is `fromNorm(toNorm(v)) === snap(v)` to 1e-12 — across the wrap map's **seam**, through the integer map's grid, and on the bipolar map, whose 0.5 is **exactly** zero even on a lopsided range (a centre detent that is only nearly centred is a bug you find six months later in a screenshot). And it owns the distinction the whole architecture rests on: **BASE vs CURRENT**, with the base stored in VALUE space and never round-tripped through the normalised form, so `restoreBase` hands the user's number back **bit for bit** (`Object.is`). `write` and `setBase` are one function, which is why turning a knob under a running LFO moves the base and leaves the picture alone. A malformed id **throws at registration** (a control registered under a typo is a ghost: it takes routes, it saves into presets, and it moves nothing); `get()` is called once, at registration, to seed the base; hot re-registration keeps the base, the order and the subscribers; a throwing **subscriber** is caught and counted, a throwing **setter** is not swallowed. `host.js` (515 lines) is edges 2, 3 and 4 — the target host with its dormancy law (uninstall lets go of the modulated value **first**: abandoning a parameter with an LFO's number still in it leaves the instrument holding a value nobody set), the clock, and presentation callbacks that default to counted no-ops, which is what lets the whole thing run under node with no DOM, no renderer and no GPU.

**THE CLOCK IS THE RISK, AND IT IS NOT lab/clock.js.** Two logical times over one wall clock: ours is physics time *t* in atomic units at RATE, this one is **beats**. If they were one clock, pausing ψ would freeze an LFO animating the camera, and `transport.rate` — itself a shipped modulation TARGET — would be setting the speed of the thing modulating it. Six behaviours read the same two numbers and mean different things by them, and all six are ported with the source's own numbers: under **wall sync** the beat is DERIVED from the absolute stamp (so **clamping dt does not slow a wall-synced LFO**; only a re-anchor moves it), under **free sync** it is accumulated from dt (where the 0.25 s clamp is exactly right), **envelope time** is dt in both, a **hold** folds the beat into one bar and keeps a shadow the release rejoins, **visibility** re-anchors rather than jumping, and a **deterministic step** gives bit-identical results with no realtime anywhere near it. The **pause law** is four lines and all four matter: NaN → back to the knob · a hand macro holds even stopped · running → the modulated value · stopped and source-driven → HOLD freezes, **BASE returns it to the knob, and BASE ships**. `mod.js` is a module **singleton** — one rack per page. A rack serialized **mid-run** is idempotent but not byte-identical (a source-driven macro's value is a live read-out), so no "modulation is dirty" check may ever compare serializations of a running rack; at rest it round-trips byte for byte.

**PROOF.** `node tests/mir.test.mjs` — **53 gates, 0 failing**, headless, no DOM, 0.15 s of node wall time. Wave 52 adopts it into `test.sh` (`MI_RC`, folded into `NODE_RC`).

### wave 52: W-MODWINDOW — the modulation window replaces the playhead, and the playhead becomes its minimised mode

**THE FACE OF A MODEL THAT WAS ALREADY PROVED.** `lab/modview.js` (424 lines) is the window; `lab/rack.js` wires the four MIR edges and drives the clock. Nothing in the face computes a modulation — every number on it is read back out of the model — and there is **not one target id written down in it**.

**WHICH CONTROLS ARE OFFERED, and the line the choice draws (design decision, stated).** **MODULATION IS AN OBSERVER INSTRUMENT.** Eleven targets ship: `observer.yaw · pitch · dist · fov` (the camera), `material.exposure · softness · hue · iso · grain · knee`, and `transport.rate` — the physics rate, which is the clearest possible demonstration that the two clocks cannot be one. Nothing else, for three reasons that are all the same reason. (1) **Every offered setter is a PRESENT.** The contract forbids more, so `field.resolution` and `field.steps` — in `host.js`'s `labParameters` as the *shape* of a catalogue — are not targets: an LFO on the grid would rebuild an N³ volume sixty times a second, and the GOVERNOR owns that number anyway. (2) **`state.mode.<n:l:m>.amp/.phase` are not offered**, and the reason is a real one found here: every register write bumps `reg.version`, which is the **undo ring's trigger** and the recurrence scan's cache key — an LFO on an amplitude would push an undo entry every 400 ms and re-run `densityPeriod` on every frame. §14 read literally: the register is the hand's, the observer is the modulator's. (3) **The ranges are the dials' own** — ZOOM really is [1.2, 8] and EXPOSURE really is [0.08, 12], not `host.js`'s illustrative numbers, because a registry whose range disagrees with the knob lies about where the parameter is the moment either end is reached. Each adapter also moves the control's **real dial** (and skips it while a finger is on that dial), because a knob that does not follow the value it owns is a knob that lies; the six anonymous material knobs got `ui.*` names so it could.

**THE PICKER IS THE REGISTRY'S CATALOGUE.** Built from `describe()`, grouped by the registry's own groups, rebuilt on the registry's `register` / `unregister` events. The proof is not that the list looks right: it is that a control **registered at runtime** appears in the picker at runtime, takes a route and is actually driven, with no edit to `modview.js` (B74).

**A MODULATED PARAMETER IS READABLE WHILE IT MOVES.** Every routed target carries a **STRIP** — a well with the user's base as a `--fg` tick, the sweep as an ACCENT B band, and the current value as an ACCENT A dot — and three tabular numbers under it: **BASE · NOW · RANGE**. On the card, not in a hover tip (ANTI-PATTERN 4). The band is Σ(max − min) × DEPTH over every **live** route into that target, so a stacked target says what the whole stack can reach; a sweep that goes all the way round a wrapped dial prints the domain and a ⟳ rather than printing one number twice. A dial the modulator is holding wears **ACCENT B wherever in the rack it lives**, and keeps wearing it with this window shut.

**THE MACRO SURFACE IS REDESIGNED, NOT COPIED** (Josh: theirs is buggy). The structural bug in a surface of this shape is that a macro is two things at once — a hand knob and a socket for a source — so four things changed. **(a) DRIVE is one control**: a `<select>` reading HAND or a source, and that single choice decides what the value row *is* — a real fader, or a **meter** with no fader in it at all. You cannot fight a modulator for a number, because there is nothing there to grab. **(b) DEPTH is on its own line**, never a second dial beside the value: two identical knobs, one of which is "how much of everything", is how people turn the wrong one. **(c) A re-bind always works**: `setMacro` **refuses** a source change on a macro already bound to a live source (it counts `macroRefusals` and returns null), which from a face that just calls `setMacro` reads as a dead menu — so this one unbinds first, then binds. **(d) Nothing is behind a modal**: the route count is on the macro row and every routed target is listed in full below it.

**IT REPLACES THE PLAYHEAD.** The transport pill is untouched — `glass mini`, 520 × 32 at bottom 60 px on a 999-px pill, the same seats — and **⤢ EXPAND takes a seat beside the ⇱ send-to-rack button**, in the same flex row, with **no bottom-left button** (BASINS has one; Josh does not want it). The geometry is proved by subtraction: take EXPAND out of the DOM and the pill's box is the same four numbers, because the scrub bar is the `flex: 1` that pays for the seat. The window ships **closed** and is a `control` card, so ⤢ is how it opens; the card's × closes it again, and both round-trip. **On a phone** the transport is docked at the top of the one rack and stays there: EXPAND opens the window **directly beneath it** rather than above it (`layout.raise` would have pushed the transport to second), it is a rack card so the rack toggle still clears the field, and its two round 22-px buttons take a 44-px seat by the same content-box trick ⏻ ⓘ ⇱ already use.

**CLOSING THE WINDOW DOES NOT STOP THE MODULATION.** The clock is the rack's, not the card's: one call per frame, `clock.advanceTo(performance.now()/1000)`, above the read of `pending` so this frame's output is presented on this frame, and the loop's tail keeps asking for frames while `clock.isRunning()`. Nothing in `modview.js` reaches the clock or the model, and the **EXPAND button lights ACCENT B while modulation time runs** — the boundary law, made visible to a user who has shut the window. **The cadence cap** is in that one place: 60 or 120 Hz, never the display's rate, this browser's setting (`modCadence`) and absent from every project. Skipping a frame costs nothing, because under wall sync the beat is derived from the absolute stamp.

**TWO DEFECTS FOUND AND FIXED, both the same shape.** Every transport **edge** calls the host's `applyAll(force)`, which hands each un-routed target back to its registry **base** — and the base was seeded once, at registration. So pressing RUN on a route that had nothing to do with the camera snapped a hand-orbited yaw 1.85 / ZOOM 6.4 / EXPOSURE 3.7 back to 0.65 / 3.3 / 1.0. The registry's own `resync()` is the wrong tool (it writes the base of **modulated** parameters too, ratcheting the base up to wherever the LFO is), so `modSyncBases()` is `resync()` minus that: re-read the Card's adapter for everything **not** held, once a frame, never for one that is — eleven property reads on a frame that was going to run anyway, and it asks for no frame of its own (§45: idle stays zero work). The two wrapped setters write only when the **angle** differs, so an un-modulated `obs.yaw` is never quietly re-based out of the unwrapped value the camera law integrates. The second is the same fault one level up, and B52 caught it: `restore()` writes `obs` / `mat` / `quality` from the file and *then* loads the modulation rack, whose `applyAll(true)` handed every target back to the base the PREVIOUS project had left in the registry — so a project's camera was restored and immediately undone (yaw 1.234 → 0.2). The bases are re-read from the instrument between the two, and the file wins.

**A PRE-EXISTING FLAKE, NAMED AND HARDENED.** B8's "a STATE ROTATE costs a RECONSTRUCT" read `stats.lastTier`, and that made it a race it lost about twice in three runs: wave 45 moved the recurrence scan into a worker whose answer calls `schedule(TIER.PRESENT)` when it lands, and `settle()` resolves two rAFs later, so an unrelated readout repaint could be the *last* tier. It was proved pre-existing by running the same block with the **whole modulation host switched off** — still 2 of 3 — and the stack was traced to `periodNow`'s `.then()`. Nothing in the app was changed for it (that scan is wave 45's and it is right); the block's claim is unchanged and is now **counted rather than remembered**: exactly one RECONSTRUCT frame, no EVOLVE, no REBUILD.

**PROOFS.** **B74** the minimised mode (the pill by subtraction, EXPAND beside the dock button, every button in the one row, three EXPAND/collapse round-trips with the pill unmoved, the × as a collapse) and the picker (it *is* `describe()`, in order, grouped; a runtime registration appears, routes, moves, and leaves). **B75** base · now · range agreeing with the model to 5e-3 with the current value inside the range and the strip's band starting at the base tick; the driven macro's row is a meter and the hand macro's is a fader; a **real drag** on the EXPOSURE dial under a running LFO moves the BASE and leaves the modulated value alone without touching `reg.version`; the base follows the hand for everything not held; the window CLOSED with the modulation still running, still moving, lamp lit; the base back **bit for bit** (`Object.is`) when the transport stops; the project carrying the rack and a load coming back stopped. **B76** the cadence capped at 60 and at 120 and again under 28 ms of forced burn per frame, never past the cap and never past the frames the browser gave (in the gate run the 60 Hz cap **refused 20 of the 63 frames the browser gave**, and the 120 Hz setting refused none of 103 — that is the cap, working, on a 60 Hz panel); **zero RECONSTRUCTs, zero EVOLVEs, zero REBUILDs** across all three windows with the physics stopped; and the two clocks staying two — *t* not moving by a nanosecond while the modulator turns the camera and sweeps the physics RATE itself. `tests/mir.test.mjs` joins `test.sh` (53 gates, 0.15 s). `./test.sh`: **node: 0   browser: 0** — **92 judged browser lines, 0 RED**, and `mir.test — 0 failing of 53` newly in the suite list.

**FOUND, AND DELIBERATELY NOT FIXED.** `registry.resync()` re-bases modulated parameters (see above) — worked around in the rack rather than edited, because `registry.js` is MIR's file and 53 gates pin its behaviour; changing it is a MIR change with its own gate. **AUDIO** is offered as a **disabled** chip that says why: the follower model is in `mod.js` and inert, its capture half (`audio.js`) was deliberately not ported, and a control that changes nothing is ANTI-PATTERN 7. **Trigger macros** (`kind: 'trigger'`, `setSourceTrigger`, `fireMacro`) are in the model and not in the face; ENV gets a **FIRE** button instead, which is the same chain without a second macro kind on the surface. **Curve sources** (`shapeMode: 'curve'` and the whole of `curve.js`) are live in the model and unreachable from the window: a breakpoint editor is a canvas view of its own and a wave of its own; the seven WAVES are offered. **A/B banks**, the STEPS ladder, `anchor`, triplet/dotted and the **preset store** (`presetList` / `presetSave`, and that MANDELBROT factory folder) are all present in the model and unsurfaced — the project file carries the rack instead. `lab.css:252` sets `#transport.mini { width: min(560px, …); height: 34px }` and skin.css §12 overrides both with 520 / 32: a dead declaration, left alone because this wave is not allowed to restyle material it did not need to touch (ANTI-PATTERN 11).

**LESSONS.** A test that remembers "the last thing that happened" is a race as soon as anything in the program is allowed to happen off the frame; a test that COUNTS what happened is not. A control that *looks* grabbable and refuses the finger is worse than no control: the driven macro row started as a `.fd` fader with `pointer-events: none`, and the phone hit-walk found it immediately — `elementFromPoint` answers the parent, so a disabled fader is invisible to a hit test and reads as a covered control. Second: **the hit-walk opens every closed window**, so a window that ships closed is still on the phone's 44-px hook, and designing for that from the first line was cheaper than discovering it in the gate. Third: the sharpest proof of a rate cap is not the count — it is that the count is **strictly below the frames the browser gave**, which is the cap actually refusing work.

### wave 53: W-ASKS-I — the six visible asks from Josh's phone, and a logo that turns its palette instead of itself

**MODE: STRUCTURE then BEHAVIOUR.** No aesthetic invention beyond what the six asks name; no widget added (the '?' sheet is `#sheet`'s glass and `.keys-list`'s row, in a second seat).

**THE AXIS IS ITS OWN OBJECT** (board #40). One FRAME switch drew the cube AND the xyz axes, so neither could be seen without the other. Two switches now, side by side in OBSERVER, with `mat.frame` and `mat.axis`. **The split is in the GPU, not in a flag**: `field.js` keeps its one line buffer with the layout unmoved — box 0…23, axes 24…29, slice rectangle 30…37, which is exactly what `lineColors()` reads and what B63 pins — and `drawChrome()` issues two draws into it. The slice rectangle stays with FRAME, because it *is* a frame. Both ride in the settings key, both are in a project, H hides both, neither touches ψ.

**SLAP → IMPULSE, BOW → IMPULSE VECTOR** (board #44). **19 user-visible strings** changed: 17 in `rack.js` (the trigger, the group, the readout label and its sub, the impulse note, three segment tooltips, three notes, the GOVERNOR's note and its readout sub, the in-flight status line, the landing sub at both the hydrogen and BOX sites, the K-key action's own name), the stage readout in `keplerview.js`, and the hint bar in `index.html`. **182 occurrences in `lab/` are deliberately left** (and 125 more in the suites): every identifier and every code comment — `slap`, `slapAlong(Async)`, `bow`, `bowStart/Move/Release/Cancel`, `bowChain`, `bowInFlight`, `bowPrevView`, `setBow`, `__LW_hooks.slap`, `__LW.bow`, `LW.kickAlong`, the worker's op docs and the module headers of `kick.js` / `qho.js` / `well.js` / `state.js`. Renaming a word on the screen is not a reason to churn an API twelve gates already speak. Two gates asserted user-visible strings and were updated (B27's `.ro-sub`, B44's `.trig` label), and B24 / B27 were re-titled.

**THE LOGO** (board #45), the item that needed reading twice. **Every rotation is gone** — the boot 360°, the busy mark's spin and its hue cycle; `lw-mark-spin`, `lw-busy-spin` and `lw-busy-hue` are not in any stylesheet, and the only transform left in the logo is the resting 45° on the `<g>` inside the SVG, which reads identically at rest, mid-turn, busy, and 500 ms later. **What moves is the PALETTE, through the mark, and it is not a hue offset.** Square *i* rests at the wheel's colour at *i*·40° and a TURN walks it from *i*·40° all the way round to *i*·40° again, so all nine squares march the **same** 36 palette samples, each rotated by four places — which is the exact statement of "the palette itself rotating 360". `rack.js` GENERATES nine `@keyframes` from the same `wheelColor()` the static fills come from and injects them as `<style id="lwTurn">`; on a four-stop palette the nine squares are that palette's four colours and its stops land on the mark at φ = 0, 90, 180, 270 exactly. It is CSS and not JS for wave 48's reason, and it is rebuilt only when a turn STARTS — a HUE drag would otherwise rewrite eight kilobytes of stylesheet sixty times a second and restart the animation with it. The BOOT gets one turn (the rare tier keeps its delight budget); BUSY gets the turn on a loop **plus a breath in opacity** (`lw-busy-breathe`, 1.1 s, linear, alternate) — no rotation, no hue cycle, no filter, no shadow. And the λWAVES logo **enlarges with the menu**: `scale(1.04)` over `--t-fast` on `ease` about `left center`, written in the one place `bar.hidden` is written, so it comes back when the chips go and not merely when the pointer leaves. The menubar is placed from the two quantities a left-center scale cannot move.

**THE WARNING MARK IS A CUTOUT** (board #41). The "!" and its dot are the same two `.warn-bang` shapes, moved into an SVG luminance **mask** on the `<image>` — white keeps the orbital, black cuts the hole — so nothing in the sign reads the pane's background or the theme.

**THE '?' KEY** (board #46) opens a sheet **built from the live binding table** on every open, and hooked to `ui.keysRefresh` — the one call every rebind already ends in — so a rebind lands on it whether the sheet is up or down. No hand-written list exists for anything to go stale (ANTI-PATTERN 6). `?` again or Escape closes it; it cannot fire in a field; H takes it with the interface. `keyName()` spells Shift+/ as **?**.

**THE OBSERVABLES ARE 3 WIDE × 2 TALL** (board #50) — `grid-template-columns: repeat(3, 1fr)`, one number, no `rack.js` change, because the DOM order already **is** ρ · arg ψ · Re ψ / Im ψ · Δρ · Re+Im. The labels stay plain text nodes on purpose: the mathematical typography Josh wants here is the font wave's, and it can have it without a re-lay.

**PROOFS.** **B77** the two objects, judged off the rendered chrome (chroma and darkest-luminance with each switch alone), the hand road, the settings key, a project, H, and ψ untouched. **B78** a sweep of every text node, title, aria-label and placeholder in the live document: zero old words left, and the new ones in every seat. **B79** no rotation anywhere, the generated turn *being* the live palette, the four-stop case, the boot turn ending, the busy breath. **B80** the enlarge and its return, by `pointerenter` and by `pointerleave`. **B81** the cutout in PIXELS on the driver's screenshot, with a nameable colour put behind the pane — stroke and dot read that colour exactly, the triangle beside them does not — in both themes. **B82** the sheet against the live table, with a rebind proved both ways. **B83** three lefts, two tops, six equal cells. B61's 2 × 3 assertion is the one this wave was asked to change and now asks only for one equal grid; B64's two animation strings likewise. `./test.sh`: **node: 0   browser: 0** — **99 judged browser lines, 0 RED**.

**FOUND, AND DELIBERATELY NOT FIXED.** `kit.js`'s `sw()` ignores an `o.title`, so six switches built with one (`STATUS TAGS`, `HINT BAR`, `STAGE CAPTIONS`, `FROST 20px`, `KEEP FRAMES`, …) have had a dead tooltip since they were written; the FRAME and AXIS switches set `.root.title` by hand the way `AUTO-ROTATE` already does. One line in `kit.js` would fix it for all of them, and it is a widget change six windows would inherit — not a rename wave's to make. Also: a palette changed **while the mark is turning** keeps the old keyframes until the turn restarts, which is the price of not rebuilding the stylesheet on every frame of a HUE drag.

**LESSONS.** Gating an animation on `[hidden]` to save a compositor a frame saves nothing — a `display:none` element animates nothing anyway — and it turned an existing gate's read of `animationName` into a race it could lose. And a block that *restores* a palette must restore **the one it found**, not the one it assumes: B79 passed alone and failed in the suite for exactly that, because a block twenty ahead of it leaves the HSV wheel loaded.

### wave 54: W-ASKS-II — the machinery behind four more asks, and three places where the obvious build was the wrong one

**MODE: BEHAVIOUR.** No aesthetic invention; no widget added — the ☆ dropdown is the `+` list's own `.glass` + `.mb-item`, the two new segments are `seg`, the two new dials are `knob`. Two of the seven items are performance work and carry numbers.

**THE BACKGROUNDED TAB** (board #42) — *and the study this wave was handed was wrong about the biggest part of it.* The study said `requestAnimationFrame` is skipped entirely when hidden and that there was therefore no win at the render loop. Measured here, with a bare rAF chain beside ours in a genuinely hidden tab: **Gecko THROTTLES a background document's refresh driver to ≈1 Hz, it does not abort the callback.** Three of our frames ran across three seconds of absence, and because each may integrate a whole `MAX_WALL_STEP` the transport walked **1.2 a.u. of logical time forward in a tab nobody was looking at**. So the wave took the win the study said was not there: `schedule()` refuses to ask for a frame while hidden and `loop()` returns at once if one arrives anyway, while `pending` still rises so nothing asked for is lost. The study was right about the workers: a dedicated worker owns its own event loop on its own OS thread and is throttled by nothing at all, so `mathworker.js` gained a **park protocol** and the rule for what parks is not "all of it" but **who asked** — work the user asked for FINISHES (`kick`, `packet`, `period` — each bounded, each with an answer someone wants), speculative work WAITS (`warm`, a table built early that only pays off while there is a finger on the instrument). A parked worker queues the speculative job and answers it once, on resume. `park`/`resume`/`stat` are bookkeeping: answered while parked, and excluded from the `busyMs` ledger, so that ledger is the honest number. **ONE AUTHORITY** — `visibilitychange` decides, with `freeze`/`resume` and `pagehide`/`pageshow` funnelled into the same function so there can never be two answers; `blur` is deliberately NOT bound (DevTools and a second monitor blur a visible window). The modulation clock's own second listener was deleted rather than left beside it. **RESUMING RE-ANCHORS AND DOES NOT JUMP**, by the two mechanisms that already solved this rather than a third: `clock._wall = null` (clock.js's own "the next dt is not a dt", what `pause()` leaves behind) and `lastWall = now` (what `camera.wake()` does), plus the modulation cadence, the FIELD clock, the auto-scale window and the governor's ring. **THE GPU KEEPS EVERYTHING**, and the reason is said out loud rather than left as a silence: the 96³ rgba16float cache is 13.5 MB and `texture.destroy()` invalidates every pipeline and bind group that references it — freeing it buys back memory the OS was going to page anyway and costs a 50–200 ms rebuild on the first frame back, on unified-memory hardware (the iPad is a target) where the "saving" is not a saving at all.

**THE CAMERA'S SECOND MODE** (board #43). CAMERA carries **TURNTABLE · FREE** and the trade is one sentence on the card, because it is a real trade: *a level horizon with poles, or no poles with a horizon that rolls*. TURNTABLE is untouched. FREE stores **one unit quaternion** and right-multiplies a rotor built in the camera's own frame, so the axes are the screen's at every pose and there is no clamp to hit. **THE CONVERSION IS Z-UP AND WAS DERIVED, NOT COPIED** — the whole reason the study exists. Its formulas assume a Y-up world whose home camera is the identity quaternion; ours is not, because *z* is the quantization axis and at yaw = pitch = 0 our basis is the cyclic permutation x → y → z → x. So

> **q(ψ, θ) = q_z(ψ) · q₀ · q_x(−θ)**, q₀ = ½(1 + i + j + k)  ·  and back: **θ = asin b_z**, **ψ = atan2(b_y, b_x)**

— the extra q₀ is exactly the term a transplanted Y-up formula has no reason to carry, the minus on θ is the second (turning about +right *lowers* the pitch), and the inverse reads two different components of **b** than the Y-up pair does. Copying would have looked almost right. It is judged over 400 poses against `cameraBasis` itself and agrees to **5.6e-16**, so the switch into FREE moves **no pixel** (1.1e-16). Coming back **slerps the roll level over 150 ms**, never snaps. **Wave 50's law works unchanged in both modes** because it is arithmetic on two scalars and only their *axes* changed: the ambient stays a world-z drive (AUTO-ROTATE turns the cloud about the quantization axis — physics), the residual becomes screen-relative, and a fling of ω₀ = 1.2 rad/s at μ = 2.5 turns through the closed form ω₀/μ = 0.480 rad to 2e-3. `rotor4.js` did all the quaternion work; no second library. `cameraKey(obs)` replaces the two `(yaw, pitch)` cache keys in `orbit.js` and `vortex.js`, because **a FREE camera can roll with both angles standing still** and a stale bitmap is what a two-angle key would have handed back.

**FAVOURITE LAYOUTS** (board #48). A ☆ button 36 px under the `+`, in the same column, on the same geometry rule — and on a phone it joins the same thumb stack that follows the rack (wave 51's law is one rule, not three copies). Its dropdown is the `+` list's own idiom. **A layout is the arrangement and nothing else**: which windows exist, in what order, in which rack, folded / closed / powered down, the transport's dock, the rack's visibility, and the one size a hand can set here (the notebook's — rack cards are sized by content, by law; there is no per-window size to save, and that is a finding, not an omission). **STOOD-DOWN is deliberately not in it**: `w.root.hidden` is set by the Hamiltonian and by the molecule / helium / H₂ models, not by a hand, and restoring it from a saved arrangement would have a layout argue with the physics about which windows apply. Fold and power are restored **through their buttons**, because the glyph and `aria-pressed` live in `device()`'s closure and only the click keeps all three in step. **Numbered, not named** — four slots, each wearing an auto-description (how many windows, which racks, the time), which is the information a name would have carried; the alternatives were a modal `prompt()` in an instrument that has spent fifty waves not being a web page, or a text field inside the dropdown, which is the second menu idiom the paragraph above refused.

**DITHERING** (board #49) — **ORDERED (Bayer 8×8)**, and the choice is not aesthetic. The threshold is a closed form in six shifts and five xors: no table, no texture, no bind group. It is **fixed in screen space**, so a paused field is perfectly still where a per-frame blue noise would make a state nobody is changing shimmer — and a pixel gate stays reproducible. Error diffusion was never a candidate (inherently sequential; a fragment shader is not). It is added to the **final** colour, *after* the output gamma, because the quantiser it defeats is the 8-bit swapchain; and it rides at **p2.w**, beside `p0.w`'s ray-march jitter seed and not on top of it. **THE COST, in two numbers**: at 96³ / 160 steps / 990 × 607, median over five runs of 240 frames — **off 3.767 ms/frame, on 3.771 ms/frame, Δ = +0.004 ms**, against a run-to-run spread of 0.04 ms. It is below the measurement's own noise. OFF is the default and OFF adds exactly zero: with it off the picture is bit-reproducible and identical to what it always was; with it on the mean luminance moves by **0.0017 of one code**, the Bayer matrix being exactly zero-mean.

**THE PALETTE MENU GROUPS BY STOP COUNT** (board #47) — real `<optgroup>`s, ascending, built from `PRESET_GROUPS`, which is the catalogue's own grouping, so the menu cannot drift from the data and a palette added to `palette.js` arrives in the right group with no edit in the view. 23 palettes in five groups (3·3, 4·9, 5·5, 6·4, 8·2); ember under **4 points**, which is Josh's own reading. `tests/palette.test.mjs` is now in `test.sh` (15 judged claims, 0.1 s). **PRISM IS THE DEFAULT** (board #51, Josh's ruling) — because every accent is an angle on the live wheel, a fresh profile now boots with `--acc` at prism's own 0° (#813ae6). λWAVES is one click away in the 6-point group. **A default is for a first visit**: naming a palette from the menu IS this browser saying which it wants, that choice rides in the settings key, and a reload comes back on it.

**THE COLOUR GAMUT** (board #52) — **the honest version.** Josh asked for P3 and asked whether we could default to it. We cannot, on this browser, and SETTINGS says so instead of quietly doing nothing: a GAMUT segment whose DISPLAY-P3 position is **disabled and carries the reason**. **THE FEATURE TEST IS A REAL PROBE, NOT A VERSION SNIFF** — and it had to be, because a WebIDL dictionary silently ignores a member it does not declare, so passing `colorSpace: 'display-p3'` throws nothing, warns nothing, and leaves the swapchain sRGB. `configure()` is handed an object whose `colorSpace` is a **getter**, and whether Gecko *calls* it is exactly whether the member exists in this build. Measured: **canvas false, CSS `color(display-p3 …)` true** — which is precisely the trap, because a P3 interface over an sRGB canvas puts the same accent in two different colours. Hence **THE LAW, enforced in one place rather than asserted in a note: the DOM and the canvas are in the same colour space, or the feature is off.** `field.setGamut()` refuses what the canvas cannot honour and returns what is actually in force; `applyAccent()` and the palette LUT go through the *same* map, so they cannot diverge. Where a canvas can honour it, the two things it can do are built and named apart — **CONVERT** (colorimetric, the 0.822/0.178 matrix in linear light: identical colours, better banding) and **VIVID** (a deliberate OkLCh-style chroma expansion — more saturated than the palette says, a design choice, and it says so). The display media query is reported and never used as a gate, because `privacy.resistFingerprinting` makes Firefox answer false to it unconditionally.

**PROOFS.** **B84** the backgrounded tab, hidden by WebDriver's `window/new` + switch — the honest method, because redefining `document.visibilityState` leaves Gecko's own visibility untouched and proves nothing — with Δframes = 0, Δpresents = 0, Δt = 0 **to the last bit**, Δcamera-t = 0, first dt after the resume = 0, the worker ledger read *from inside* the absence (parked, +0 ms) and moving *after* it (deferred, not discarded), and the bounded scan finishing while hidden. **B85** the Z-up conversion over 400 poses, the pole crossed in FREE and hit in TURNTABLE, the closed loop's roll, the 150 ms levelling caught mid-slerp, the friction law's closed form, a project round trip. **B86** save · derange · load with the state digest identical at all three. **B87** the two frame times, OFF bit-reproducible, ON zero-mean. **B88** the optgroups, prism fresh, λWAVES kept across two reloads. **B89** the probe, the disabled segment with its reason, and the law holding through three attempts to break it. `./test.sh`: **node: 0   browser: 0** — **105 judged browser lines, 0 RED**.

**FOUND, AND FIXED BECAUSE IT WAS LOAD-BEARING.** (i) `saveSettings()` rebuilt the settings object **from scratch**, so every key written by anyone else was dropped on the next call — the notebook's remembered size (`nbW`/`nbH`, written by `nbSaveSize`'s own merge) did not survive so much as a fold. The three keys it does not own are now carried through. (ii) `const SETTINGS_KEY` sat **ninety lines below** the first `readSettings()` call, and `readSettings`' own `try/catch` swallowed the TDZ `ReferenceError` and returned `{}` — a silent `{}` is the exact shape of "this browser has never said anything", so an early read of a saved preference could only ever see the default. The declaration moved above its first reader.

**FOUND, AND DELIBERATELY NOT FIXED.** `layout.moveCard(id, index)` reorders **only** within `#rack` — it hard-codes that rack's own query — so a card in the mirror rack cannot be reordered through the API (the pointer drag can). Favourite layouts do not need it, because restoring appends in array order, which reproduces both racks exactly. And in FREE mode `obs.yaw` / `obs.pitch` become a **readout** of the look direction: they still move every dial, digest and cache key, but they cannot carry the roll, so a modulated YAW writes a *delta* through the one road rather than an absolute angle. That is stated rather than hidden.

**LESSONS.** Read a study, then re-measure the one claim your build depends on: "rAF is skipped entirely when hidden" was false here, and believing it would have shipped a lab that quietly advances its physics in a tab you left open. A test that reads a counter "after" is not the same test as one that reads it *during* — the worker ledger only became falsifiable when the block learned to read it from inside the absence. And a blanket rename inside a test region will happily rename a property that merely shares its name: `camT` on the page's own mark became `cmodeT` and evaluated to `NaN`, which JSON prints as `null` and a `Math.abs` would have caught.

### wave 55: W-FLOAT — the transport's dock, widened until any window can come off the rack

**MODE: STRUCTURE then BEHAVIOUR.** No aesthetic invention and no new widget: a floating window is the same `device()` card in a new layer, COMPACT is the same header re-flowed by CSS, and the two new chips are drawings that already existed. Josh: *"I was hoping the modulation window was going to be a floating draggable regular window like a VST plugin"* — and then, choosing the capability over the one-off, *"yes! I was also thinking this idea where any window can be taken off the rack."*

**IT IS THE TRANSPORT'S OWN MECHANISM, WIDENED — NOT A SECOND ONE BESIDE IT.** `dockTransport()` moves one element between a rack card and the stage and remembers the slot it left (`dockIndex`); `popOut`/`dockWindow` move a `.dev` between a rack and `#floats` and remember the slot it left (`home`). The transport now carries **the same `.dev-pop` chip every other window carries**, and pressing it calls `dockTransport()`, so the pill *is* the transport's floating mode and the lab has one idea of what floating means rather than two. `#floats` is one absolutely-positioned layer, pointer-transparent so the canvas gestures underneath are untouched, above both racks and **below the notebook and the menus** so a menu can always be opened over a window; `H` takes it out of paint with the rest of the interface. **A FLOATING WINDOW IS NOT RESIZABLE, AND THAT IS THE DESIGN**: STYLE-LOCK's law is *freedom outside, discipline inside*, and a corner grip is precisely the control that breaks it — it would reflow every row in the card and spend the muscle memory the law protects. So a floating window is exactly as wide as a rack card (`--float-w`, measured from the rack's own content box) and is pixel-identical on the stage and in the rack, which is also Josh's own request: *"Let it use the same dimensions or layout as it."* The one thing that changes the box is COMPACT, and compact is a mode, not a reflow.

**COMPACT IS NOT FOLD, AND THE WIDTH IS WHAT SAYS SO.** Fold already existed and it is a **height** act: the body goes, the card keeps the rack's width, and what is left is a horizontal title bar — right for a rack, where the width is the rack's and the vertical space is the scarce thing. COMPACT is a **width** act *a rack card cannot perform*: the window narrows to a 46-px vertical rail carrying the three things the reference keeps — its NAME (the eyebrow, set vertically), its POWER switch, its CLOSE — plus the way back. They are therefore kept apart rather than collapsed into one control, and both are available on a floating window. What we did **not** steal from BASINS is the rail's mini curve: no window here publishes a one-line summary of itself, and inventing one per window is a design decision, not a port — it is named here so a later wave can take it deliberately. Because compact *hides* the body rather than re-laying it out, the interior is bit-identical before and after: B91 measures the offset and width of every knob, switch, segment, trigger, fader and readout in the card and the two strings are equal.

**THE THREE THINGS THAT DECIDE WHETHER THIS LANDS.** (i) **Dragging is by the header alone** — not one pixel of the body, and not even all of the header, since the chips keep their own clicks. B90 drags the header 110 px across and 90 px down and the window follows; then drags a **knob** inside it 130 px and the window moves by exactly (0, 0) *while the knob's own value changes*, because a window that did not move for want of a pointer would prove nothing. Pointer events throughout, so mouse, pen and touch are one code path. The clamp keeps 120 px of header across and all 44 of it down, and re-runs on every resize so a rotated tablet can never strand a window; the *landing* rule is separate and stricter — a window pops out fully on the screen when it fits, because a card at the bottom of a scrolled rack would otherwise arrive with nothing but its header showing. (ii) **THE TAB ORDER, STATED: the mirror rack top to bottom, then the right rack top to bottom, then whatever is floating, back-most first.** It is frozen at the first TAB of the session and never rebuilt — the act itself prepends a card, so a re-read order would bounce between two windows for ever — and because the cycle holds the *elements*, **a window keeps its seat when it pops out or docks back**. "To the top" means the top of its rack for a docked window and the **front of the stack** for a floating one; either way it is unfolded and a rail is opened back to full, because what TAB promises is that the window it names is the one you can now read. (iii) **THE PHONE (wave 51) HAS NO FLOATING.** Crossing the breakpoint docks every floating window *before* the mirror rack is folded into the one rack, so a window whose home is the left rack still makes the trip, and it is **remembered**, because wave 51's law is that the crossing is reversible in both directions. The chip stands down in CSS and `popOut()` refuses in script — the control and the act agree — and the four header seats stay ⓘ ⏻ ▾ × at their 44-px pitch.

**MODULATION OPENS FLOATING, AND IT IS THE ONLY WINDOW THAT DEFAULTS TO IT.** ⤢ on the playhead pill now opens it over the stage at the rack card's width; every other window still ships docked and is popped out by a hand. Collapsing does **not** dock it — the pill and the × only hide it, so reopening puts it back where you left it, which is what a plug-in window does. **THE OUTLIER STAYS SELF-CONTAINED, and that is a stated organisational law, not an accident** (Josh, 2026-09-05: *"Modulation related stuff stays with modulation. It must be treated like the outlier and it's okay. It's an organization thing."*): B93 sweeps the live document for modulation furniture outside the modulation window and its own pill and finds none, and the single modulation-shaped thing elsewhere is ACCENT B on a dial a modulator is holding — a **read-only signal**, carrying no control. **NOTHING HERE TOUCHES ψ**: floating is chrome, the state digest is identical across every act in every block, and B93 forces a floating window's reader over `READER_LAW.park` and watches the governor park it and unpark it on exactly the law a docked window obeys.

**THE CHIPS ARE JOSH'S OWN DRAWINGS, VENDORED.** `lab/mir/glyph.js` — the whole 453-line library, taken by sha256, **two forced edits, both the M4 overlay sink, and not one path, viewBox, stroke weight or name touched** — maintained by diff like `mod.js` beside it (`lab/mir/PORT-NOTES.md`). Sizing is the caller's by the module's own design, so `lab.css §55b` owns it and no call site passes a pixel count. **Marks that became chips:** `×` → `close`, `▾/▸` → `chevronDown` (**one** drawing turned a quarter turn by `.folded`, which is the caret's own idiom, not one glyph rotated into another's meaning), `⇄` → `swap` (which replaces exactly the U+21C4 we were spelling), `i` → `info`, `+` → `plus`, `⇱` → `reopen`, `⤢` → `north`; and the two new chips are `north`/`reopen` for POP OUT / DOCK and `compact`/`expand` for the rail. **Marks that did not, because the library offers no equivalent:** ⏻ POWER (already a CSS drawing, never a character), ⧉ COPY, ◧ the rack toggle, ☆ favourite layouts, the notebook's ◐ ▤ and the modulation rows' own ×. `north` is the one solid mark in a header of hairline outlines — it is drawn that way at source, so its **box** is two pixels smaller and its optical mass matches; redrawing it is not ours to do.

**LAYOUTS (#48) CARRY THE STAGE.** One optional key per card — `float`, with the position, width, compact flag, z-order and **home** slot — so `v: 2` is a superset and a **v1 layout saved before this wave still loads**, meaning exactly what it says: nothing floats. It is still the arrangement and nothing else; no physics is in the record. On a phone the float pass never runs, so a desktop layout carrying three floating windows loads there with all three docked.

**THE RIDERS.** **(A, board #54)** The ABOUT menu says two things — ABOUT λWAVES and SETTINGS… — because NOTEBOOK duplicated the WINDOW menu and LICENCES merely opened the ABOUT face that already names the licence. The three **site-root** file links went with them, and that is not tidying: `/LICENSE`, `/NOTICE` and `/REPORT.md` are exactly the three paths that 404 the moment `lab/` is the Cloudflare Pages root, so the rider closes a ship snag as a side effect. **(B, board #58)** Josh, throwing the bow: *"It seems to accumulate speed … and there's no way to reset it other than refresh page."* **The creep is correct physics** — an impulse multiplies ψ by e^{ik·x}, adding momentum *and* energy, so repeated throws populate higher shells and the beats quicken. The **bug** was the absence of a way back: a preset loads on the select's `change` event, and assigning the value already selected fires **no change event at all**, which B95 demonstrates with a counting listener rather than asserting. **RELOAD** beside the select calls the same loader unconditionally, register, clock and scrub. It is deliberately **not** a "remove the momentum" control: you cannot subtract momentum without applying the opposite boost, and a button that pretended otherwise would be a lie about the physics. **Two answers the rider asked for.** **Ctrl+Z does capture an impulse** — measured, not read: the register's `version` setter arms `history.js`'s 400 ms quiet window, the async landing dirties the baseline *after* the pointer released without dirtying it before, and the pre-image on the ring is the state before the throw (depth 1, and undo returns the digest exactly). **Six `<select>`s exist in the lab and a second one wears the same trap**: `lab/paletteview.js:38` reloads a palette's stops on `change`, so after ROTATE / REVERSE / ADD / REMOVE you cannot re-pick the palette you are on to get it back. The other four (modulation's macro, target, wave and drive) are pure assignments where the value *is* the state and re-picking means nothing. The palette one is left for the owner of that file with the fix named: a RELOAD trigger beside it, or `sel.addEventListener('click', …)` re-applying the current id.

**PROOFS.** **B90** pop out · the rack closes up and every other window keeps its order · same width as the card · header drag (110, 90) · knob drag (0, 0) with the knob turning · a press raises it over a second floating window · the chip docks it between the two neighbours it left · digest and reconstructs unmoved. **B91** fold keeps the width, compact narrows to the 46-px rail with power, rail and close and the name still legible, the interior string identical across compact → full, and the chip sweep: 193 header buttons, 156 drawings, **zero text characters left**, every one on the 24-unit grid, the only two without a drawing named. **B92** the stated order, read off the DOM before the first press freezes it; a lap that visits every open window once; the floats last; the order unchanged when a window docks back; TAB raising a floating window to the front. **B93** modulation floating from ⤢ at the rack width, the collapse that keeps its place, the containment sweep, the held dial, and a floating window's reader parked and unparked by the governor. **B94** layout `v: 2` with the float rows, the phone with the chips gone and `popOut()` refusing, a three-float desktop layout loading docked, and the crossing back restoring place, rail and home rack. **B95** both riders. `./test.sh`: **node: 0   browser: 0** — **111 judged browser lines, 0 RED**.

**FOUND, AND FIXED BECAUSE THE GATE CAUGHT IT.** (i) **`applyLayout` sent a card into a hidden rack on a phone** — a record marked `side: 'L'` was appended to `#rackL`, which is `display: none !important` at that breakpoint, so the window simply vanished. This predates the wave (it was wave 54's loader) and it is now the one rack with `data-phone-from` set, so the crossing back still returns it. (ii) **The house form for hiding a header chip is the child combinator.** `lab.css §55b` sets `display: inline-flex` on `.dev-util > button` so a drawing centres in its seat, and that selector is (0,1,1): a bare `.dev-swap { display: none }` at (0,1,0) loses to it *whatever the source order*, which is how ⇄ and ⧉ came back on the phone and how the rail chip appeared on every docked card. Both rules now use `>`, and both files say why. (iii) `layout.side(id)` read the DOM parent, so it answered 'R' for a floating window whose home is the mirror rack; it asks the float record first.

(iv) **B75 was flaky, and had been all along.** It failed once in the gate and then failed one run in four when replayed alone on a fresh page with nothing else running, so it is not this wave's doing — but it is a real defect in the block: `read()` hands back the model's LIVE numbers beside the card's LAST-PAINTED strings, the card is painted from the frame loop, and the two can therefore be up to one frame apart while that LFO sweeps EXPOSURE 1.0 → 2.72. Measured at the failure: the printed value was 0.016 off the model's (tolerance 5e-3) and the strip's dot 0.27 % off its own (tolerance 0.05 %). Forcing the paint immediately before the read puts both on the same instant — which is exactly the claim the block makes, that the face shows what the model says — and no tolerance was loosened. Five replays after the fix: 0.0004 and 0.004 at the worst.

**FOUND, AND DELIBERATELY NOT FIXED.** The mirror rack is a legal drop target even when it is empty and invisible on a wide desktop — dragging a window into the left column docks it there, which is the ⇄ button's own behaviour and useful, but it is reachable by accident. And a floating window taller than the viewport scrolls its **body** (`max-height: calc(100dvh - 16px)`): that moves no control relative to any other and is what the rack already does, but it is the one place a floating window is not pixel-identical to its card.

**LESSONS.** A gate that has been green for five waves is not the same thing as a gate that passes: B75's race was there before this wave touched anything, and it took a full run plus four replays to tell "your change broke it" from "this block fails one run in four". Specificity is a silent failure mode: three separate rules in this wave were correct, present in the file, matching their element — and outranked. The screenshot found two of them and the gate found the third, and none of them would have shown up in a diff review. And when a probe says a drag moved a window by zero, read the *other* number first: the first run's "the header drag did nothing" was a window already sitting on the clamp's own boundary, which was a bug in the landing rule and not in the drag at all.

### wave 56: W-WIRING — three finished subsystems, two of them inert, and the window Josh asked to be one

**MODE: STRUCTURE then BEHAVIOUR.** No aesthetic invention: the merged window is `device()` + `group()` + the rows that already existed, the install layer's only new surface is a fifth `badge`, and the link's only new surface is a `trig` and a `.note`. The shape of the wave is worth stating plainly, because it is unusual: an install-and-offline layer, a URL state codec and a set of vendored chips were all **built and proved a wave before anything called them**. `node tests/pwa.test.mjs` and `node tests/statelink.test.mjs` were green and `test.sh` ran neither; nothing linked the manifest, nothing anywhere in `lab/` called `navigator.serviceWorker.register`, and nothing minted or read a link. A service worker nobody registers is worth exactly nothing. This wave is mostly plugging in, and the value is in doing it exactly right rather than inventing anything.

**THE MERGED WAVE WINDOW (board #59).** Josh: *"Space and Draw windows together. Space layout up top and then the draw layout below, have invert, frame, and axis be located in the bottom of this new window. Just title this window 'wave'…"* — and, asked whether it wanted an id: ***"we don't need to make a new wave id."*** So it is a **retitle and an absorption, not a new device**. `wStyle` *is* `wObs`: the card keeps `data-id="observer"`, which is what `lab.css` and `skin.css` read to lay the six observables out as a 3 × 2 grid of equal cells and to give them a 44-px touch target, what the settings key's `closed[]` names, what a saved layout names, and what four gate blocks measure. The body is a **SPACE** group (the two exact pictures, the observable grid, EXPOSURE · SOFT · HUE) over a **DRAW** group (everything that was the `style` window, its bounded-ceiling group included), with **INVERT · FRAME · AXIS** in a row at the foot, in neither group, because the three of them are one thought — what is drawn *over* the field — and none is about ψ. The space segment lost its own "SPACE ·" prefix: the group above it says that now, and a label that repeats its heading is noise.

**AND THE MIGRATION, WHICH IS THE PART THAT COULD HAVE GONE WRONG QUIETLY.** A saved LAYOUT is a list of window ids and nothing else, so retiring one would have dropped a seat out of every layout ever saved — `applyLayout` simply `continue`d past a card it could not find, which *loads* and *silently loses the window*. `RETIRED_WINDOWS = { style: 'observer' }` now resolves a retired id to its heir, and **the heir's own record wins** when both are named (every layout saved before tonight names both): it is one window now, and one window can only be in one rack, folded or not. **Nothing bumps the version** — v1 (wave 54) and v2 (wave 55) records are read exactly as they always were. A PROJECT never named it: projects carry `serialize()`, which holds no window ids at all.

**THE INSTALL LAYER, AND FOUR DEFECTS IN THE WIRING WE WERE HANDED.** The adversarial review of 2026-09-05 was right on every count and the code follows it, not the prescription in `pwa.test.mjs`'s closing comment (now rewritten to say what actually shipped). **(1) The ONE LAW is not keepable by the worker alone.** `skipWaiting()` re-points **every** client in scope, so the tab whose user pressed RELOAD consents on behalf of a tab holding an unsaved superposition. A page cannot prevent that; it can decide what a `controllerchange` *means*, and `swClient.asked` is that decision — **the tab that asked reloads exactly once; a tab that did not ask is TOLD** ("THIS BUILD WAS REPLACED IN ANOTHER TAB · RELOAD WHEN READY") and keeps running with its state. **(2) Three holes, all silent.** Nothing listened for `LW_SW_WAITING`, so §3's announcement was dead code under the wiring its own test specified; `reg.installing` was never read at registration time, so a worker already installing was never offered; and `addEventListener('load')` after an awaited async `boot()` never fires when `load` has gone by. All three are closed, and the announcement handler waits for `registration.waiting` to catch up because the message is posted from inside `install`'s `waitUntil`, when `waiting` is still null. **(3) The manifest `id`.** `id` is the one member resolved against the **origin** of `start_url`, not the manifest URL — so `"./"` was the site root and `"lab/"` would be the dev server's path. Josh has settled the deploy at `magic-commons.com/joshs-library/lambdawaves/`, so **the member is deleted**: the identity falls back to `start_url`, which is relative to the manifest and correct at every depth. `pwa.test.mjs` now asserts the absence and says why. **(4) §1 was stale.** See below. `color-scheme` also said `dark` while the shipped theme is LIGHT; it says `light dark`, and `#themeColor` follows the *resolved* theme live, which is the one thing a manifest cannot do.

**THE AUTOMATION BYPASS, which nothing asked for and the gate needs.** `main.js` does not register under `navigator.webdriver` unless `?sw=1` says so (`?sw=0` always refuses) — the photosensitivity warning's own three-input shape. A worker installed on the gate's origin would serve every later navigation out of a cache, and **one stale §1 entry would make the whole browser suite silently measure yesterday's build**. B97 forces it with `?sw=1`, proves the real thing end to end, and unregisters and empties the cache before it leaves.

**SHAREABLE LINKS (board #55).** COPY LINK sits beside SAVE · LOAD · COPY JSON and in the FILE menu; the state rides in the **fragment**, never the query. **A link that opens must not silently drop what it could not carry**: v1 carries neither the MOLECULE panel nor the MODULATION rack, `encodeState` names them in `notCarried`, and the mint puts the count in the status line and the names in a `.note` **on the card** — not a hover (ANTI-PATTERNS 4), and not the console. When the browser refuses the clipboard the note carries the href itself, because a link the reader cannot reach is not a link. Opening reads `?preset=`-style at boot but **after** `applySettings()`, deliberately: a link is somebody else's picture and the browser's preferences are the reader's furniture, and four of the link's own choices would otherwise have been overwritten by the reader's. It clears the undo ring, because a link is the bottom of the stack, and it listens on `hashchange` so the fragment is a live address. `serialize()` gained `presentation.paletteId` and `experiment.damping`; `restore()` reads neither, so the project format is unchanged in both directions and the link-open road is the only place they land. **Two defects found while wiring:** `statelink.js`'s decoder dropped a damping of **zero** (`if (damping)`), so a link minted with DRAG γ off could not turn a reader's drag off — zero is a value, not an absence; and the codec is **lossy by design**, so the contract's "same state digest" cannot be asked of the first trip. What is true is measured instead: the same labels with no coefficient off by more than 7.4e-7 here, and then **exact ever after** — re-minting what a link produced is byte-identical text and reopening the same link lands on the same digest.

**THE SECOND RE-PICK TRAP, CLOSED (ANTI-PATTERNS 12).** Wave 55 fixed this class on the preset select and named `paletteview.js` without fixing it. Same class, same fix: one `pickPalette(id)` loader, called by `change` and unconditionally by a **RELOAD** trigger beside the select. B100 demonstrates the trap with a counting listener rather than asserting it.

**THE PRECACHE, WHICH IS THE ONE THING IN THIS WAVE THAT COULD HAVE SHIPPED A PERMANENT SILENT FAILURE.** `sw.js` names its cache from a digest of its own §1 table, and **§1 was stale when this wave opened** — `rack.js` and `skin.css` had moved and `capture.js` had been added, so the name would not have moved when the files did and a returning visitor would have been stranded on the old build for ever, with no error anywhere (ANTI-PATTERN 14). `node tests/pwa.test.mjs --write` was run **once, at the very end, after the last edit to `lab/`**, and `test.sh` now runs `statelink`, `capture` and `pwa` so the gate catches it next time instead of a reviewer.

**PROOFS.** **B96** the WAVE card: eyebrow, both group labels in order, SPACE and DRAW contents, the three switches together at the foot and in neither group, the 3 × 2 grid measured on the cells (so the `observer` selector is proved to still bite), and both migrations — v1 naming both ids, v2 naming only the retired one. **B97** the head (manifest, three icon links, both capable metas, title and status bar, `light dark`, the theme colour following the live theme, every URL 200, no `id` member), then the worker for real: registered at scope `/lab/`, the **first** visit uncontrolled as the no-claim law requires, the second controlled, the §6 handshake answering with a build whose name *is* its cache over 107 files, the offer that does not take itself, the press that posts exactly one `LW_SW_SKIP_WAITING`, one reload for the tab that asked and none for the tab that did not, and nothing left behind. **B98** mint and reopen. **B99** three damaged links — a flipped character inside the payload, a fragment that is not base64url, one cut short — each refused with its own code and its own sentence in the interface, each changing nothing, with the intact link still opening so the refusals are the CRC and not a broken codec. **B100** the palette re-pick. `./test.sh`: **node: 0   browser: 0** — 116 judged browser lines, 0 RED.

**FOUND, AND DELIBERATELY NOT FIXED.** `lab/capture.js` (56 KB) and `tests/capture.test.mjs` (26 green checks) are a **fourth** finished subsystem that nothing imports; the suite is wired into `test.sh`, the module is not wired into the lab, and that is a wave of its own. `paletteview.js` puts **no cap on stop count** and the link format writes the count as a `u8`, so ~180 presses of ADD mints a 3995-character link — `encodeState` reports `fits: false` honestly and the interface now says so out loud, but the cap belongs to the palette's owner. An unedited catalogue palette travels **by name**, so editing a shipped palette silently re-colours every link ever minted against it: `lab/palette.js` is now frozen, or old links change meaning, and that promise is nowhere in writing. And `notCarried` is a hard-coded whitelist, not a diff of what `serialize()` emits — correct today, and the next presentation key added will be dropped *and* unreported. **And B58 is not reliable under load**: it failed its `fpsRun > 15` arm once in the first full run of this wave and passed on replay at 24.2 fps and in the second full run — an absolute frame-rate threshold on a shared machine, pre-dating this wave and touching nothing it changed.

**LESSONS.** A subsystem that passes its own suite is not a subsystem that is in the product, and the failure mode of "built but not called" is silence in both directions — nothing breaks, nothing works, and the suite is green. When the code you are handed and the instructions for wiring it disagree, the code is the fact: `pwa.test.mjs`'s prescription would have shipped an orphaned message channel, a lost update and a lost registration, all of them invisible. And a harness that extracts a `g.ev` template out of the source file as raw text is not the gate — the gate lets Node collapse `\\d` to `\d` first, and reading the file instead sends the doubled form and quietly fails every regex in the block.


### wave 57: W-HONEST — four things two audits found that are not matters of taste, and one ruling that says which

**MODE: BEHAVIOUR.** No redesign, no new widget, no restyling. Two audits ran the night before — one on the accent's legibility across the 23 palettes, one on keyboard and assistive-technology access — and between them they found a great deal. This wave fixes the four items that are **correctness**, and the first thing on the record is the one that is not.

**JOSH'S RULING, FIRST, SO THE RECORD SHOWS IT WAS A DECISION.** The accent audit's headline is that **the LIGHT theme cannot reach 4.5 : 1 at any angle on any of the 23 palettes**, because `legible()` uses one constant — 0.62 — as both the dark floor and the light ceiling, and a neutral at OKLab L = 0.62 on the light card is 3.22 : 1 by arithmetic; chroma moves it between 2.62 and 3.63 and nothing in a 23 × 360 × 12-surface sweep ever exceeds 3.63. Josh has read it and **ruled that the vividness stays**: *"the legibility is fine to me, you can customize vividness as I like all of that. That can stay."* So nothing in this wave touches the clamp, VIVID, or any accent's contrast, and no later wave should treat the numbers as a defect list without asking him again. The audit is on file with every measurement if it is ever revisited — including the two structural notes worth keeping in view: the shipped desktop card is REFRACTIVE, i.e. `background: transparent`, so `--glass-opacity`'s "the field cannot pull text under 4.5 : 1" guarantee protects a surface most users never see; and `--acc-soft` puts the accent on 16 % of itself, which cannot separate far on any palette or either theme.

**1 · THE λ WAS NOT FAINT, IT WAS ABSENT.** `paintMarks()` set `#title .lam` inline from raw `wheelColor(0)`, bypassing every legibility term in the app, while its sibling `.word` has had a light-theme override to `#000` since wave 23. Swept over 23 palettes × 360° of HUE the λ reaches **1.00 : 1 on BOTH stages** — `ember` @0° on light (`#fff0c8` on `#eef1f6`) and `aurora` @6° on dark (`#01051b` on `#070a0f`), the second of which the audit did not measure. **The mark is TYPE and the nine squares are the PALETTE, and they are not the same object.** The λ is a letterform, the only coloured half of a two-part wordmark, and it now goes through `visibleInk` (`lab/palette.js`) — the smallest thing that guarantees it can be seen: the colour's own OKLab **a and b are handed straight through**, only L moves, only when the colour is under the floor, and only as far as the floor demands, so it is a **no-op on 47 % of the light wheel and 66 % of the dark one** and a vivid λ stays exactly as vivid as it was. **The floor is 3 : 1**, WCAG's non-text / graphical-object ratio — 1.4.11 exempts logotypes outright, so it is a floor the lab *chooses*, and it is the same one the audit holds every other mark in the interface to. It is applied against the **harder** of the two grounds the λ sits on (the card, i.e. the notebook's ABOUT face) so the stage clears **3.06 : 1 on light and 4.29 : 1 on dark**. Where the new lightness leaves sRGB the encoder clamps — the same clamp every palette colour already goes through — and that is the only thing that moves the colour at all: hue holds to 7.8°, chroma is never raised. **The nine squares are left exactly as the palette paints them**, and the price is measured rather than assumed: on the light stage `opal` can put all nine under 3 : 1 with the best at **1.59 : 1**, so on a pale palette the ornament goes quiet while the wordmark beside it stays. They are a **swatch grid** — the palette showing itself, beside an editor that draws the same stops — and a swatch corrected for its ground lies about the colour it is a swatch of. The fix if it is ever wanted is an **edge**, not a recolour: a hairline stroke in the theme's ink gives every cell a border and changes no fill by one bit. That is a design decision and it is Josh's.

**2 · SIX CANVAS VIEWS WOULD HAVE DRAWN LAST YEAR'S ACCENT, BY DESIGN.** `fieldview`, `moview`, `radiationview`, `wignerview` and `atomsview` each carried a **private copy** of one CSS-colour reader, every one of them matching exactly three forms — `#rrggbb`, `#rgb`, `rgb()/rgba()` — with the pre-wheel house cyan `#78e1f0` and magenta `#d97ce8` written in as the fallback, and `atomsview` held a **second** copy of the cyan as `return [120, 225, 240]`. That fallback is not dead code waiting for a bad day: **it fires by design under DISPLAY-P3.** `applyAccent()` writes `color(display-p3 …)`, a 2-D context serialises it back in that form, none of the three regexes match, and six views draw the wave-23 accent while the DOM around them wears the chosen palette, silently. There is **one reader now**, `parseCssColor` in `lab/kit.js`, and it knows the fourth form — the P3 → sRGB map is the inverse of `field.js`'s own matrix applied in linear light, proved against the forward map rather than against itself. And the accents no longer travel as a string at all: `applyAccent` **publishes** its sRGB triples through `setAccentRGB`, and the views draw the same array the DOM was painted from, so a gamut round-trip cannot come between them. A colour space the app does not write is **refused** rather than guessed, and the last resort is this theme's foreground — ink that is merely the wrong grey is honest; a plausible-looking cyan is not.

**3 · THE FIELD MOVED UNDER THE PHOTOSENSITIVITY NOTICE.** `?play=1` started the transport **seventy-five lines above** the pane, so a shared link animated the field while the warning was being read — which defeats the pane entirely, and wave 56's shareable links made that likelier rather than rarer. The transport is now armed at the **foot** of boot and waits on the CONTINUE button; `warning.onAccept(fn)` fires immediately when the pane is not up, so a browser that accepted before loses nothing. **And what "reduced motion" means for a strobing volumetric render is this wave's judgement call, so it is stated.** It does not mean **frozen**: this is a time-evolution instrument, a frozen field is not a reduced λWAVES but a broken one, and the preference asks for less motion, not for the physics to stop. What makes a strobe dangerous is the **rate of luminance change**, and the rate is exactly the quantity the clock already owns. So: **(a) nothing moves unasked** — `?play=1`, the one thing in the lab that starts the field without a press, is refused, and the PLAY button is untouched; **(b) a rate nobody chose moves at a quarter speed** — a preset's, a project's or a link's is divided by four, while a rate the RATE knob was dragged to is not touched at all, because a default is for a first visit and the hand always wins. Before this wave the app's entire answer to `prefers-reduced-motion` was to disable a 120 ms scale on the logo. `?motion=reduce` / `?motion=full` name the input the way `?warn=` does, so a gate can ask without a browser profile.

**4 · THE KEYBOARD TRAP, AND ONLY THE TRAP.** Tab and Shift+Tab were bound as **application keys** and `preventDefault()`ed on every match, with the dispatcher exempting only INPUT / TEXTAREA / SELECT. Every one of this lab's 461 controls is a `<button>` or a `<div>`, so **focus could not move at all**: reach the notebook by pointer, press Tab once to leave it, and you were stuck for the session — WCAG 2.1.2 in the literal sense, and in forty suites nothing had ever pressed Tab, which is how it reached wave 56. **THE RULE: TAB cycles windows only while the STAGE has focus.** That is narrower than the brief's own suggestion of "body or canvas", deliberately, because a rule that eats the press on `<body>` leaves the trap standing at the door — a keyboard user lands there at load and would never get *in*. The stage is a focus target **for the pointer only** (`tabIndex = -1`, focused on `pointerdown`), which is exactly the case the shortcut is used in — a hand already on the world — and **Escape lets go of it**. So every state has a keyboard way out: from the stage Escape, from `<body>` Tab walks in, from any control Tab walks on. The cost, stated: a keyboard user who has never touched the stage does not get the window cycle until they press it once, or rebind it (the table is rebindable and `Backquote` is free).

**WHAT REMAINS OF KEYBOARD OPERABILITY — NOT BUILT, BECAUSE IT IS A PROJECT AND IT IS JOSH'S CALL.** In the audit's order: **Space and every bare printable key still fire globally while a control has focus**, so Space on a focused MUTE plays the transport instead of pressing the button (the fix is one guard, or a `{ global: true }` flag on the actions that should reach the world); **the 67 knobs and 8 faders are pointer-only `<div>`s** with no `role="slider"`, no `tabindex`, no arrow keys and no `aria-valuenow` — and `skin.css` already carries a `.k:focus-within .k-val` rule that has never had a focusable knob to bite on; **35 segmented controls announce no selection** (the state is a CSS class and nothing else); **the FILE/EDIT/VIEW/WINDOW/ABOUT menubar is unreachable**, because its opener is a `<div>` and the bar is `hidden` until a pointer has already opened it — THEME · LIGHT and the per-window `raise` exist nowhere else; **IMPORT is a `<label>` wrapping a `hidden` file input**, so it can only be clicked; **a powered-off window's controls stay tabbable but inert** (`inert` appears nowhere in the codebase); and **the racks cannot be scrolled by keyboard**. None of that is touched here.

**PROOFS.** New node suite **`tests/ink.test.mjs`** (0.4 s, in `test.sh`): the reader across all four colour forms, a refusal for a space we do not write, and a **P3 round trip exact to one 8-bit level over 6568 colours** (a 17³ lattice of the whole sRGB cube plus every palette's LUT) against field.js's forward matrix as an independent oracle; then the λ swept **exhaustively** — 23 palettes × 360° × both grounds, 8280 samples each — for the floor, the direction of the walk, the no-op fraction and the hue/chroma bound; and the nine squares' cost measured rather than assumed. **B101** the λ on the 46 palette × theme pairs the DOM actually resolves, read off `getComputedStyle` and not off the code, with the raw colour measured beside it. **B102** the accent road: the published triple and the DOM agree on three palettes, the P3 form parses, and the five modules are checked **as the server serves them** for the shared call and the absent literals. **B103** the notice with 600 ms of real wall time under it and the clock not advanced by one atomic unit, then the button, then the transport; and reduced motion refusing the autoplay, quartering the preset's rate, and still yielding to a hand. **B104** presses a **real Tab through the driver** — the first key event in this suite's history — three times from the notebook, and every press lands on a different seat with none of them `defaultPrevented`; then a press with the stage focused raises a window, is prevented, and leaves focus where it was; then Escape lets go and the next Tab walks in. **B28 was updated and it is the one block whose old expectation this wave was asked to change**: it now focuses the stage before its TAB presses and proves the off-stage case beside them. `./test.sh`: **node: 0   browser: 0**.

**FOUND, AND DELIBERATELY NOT FIXED.** Beside the ruling and the keyboard project: **`prefers-reduced-motion` still covers 9 of 33 `transition:` sites** — the rack's 310 px slide loses on specificity (`body.rack-hidden #rack` is (1,1,1); the media block's `#rack` is (1,0,0)), and the fold chevron's quarter turn, the card's raise/press transform, the rack-chip opacity fades and `.dev.dragging` are simply never named. This wave took the preference to the *content*, which is where it was doing nothing at all; the chrome half is five selectors and a specificity fix. `#busyMark`'s 0.9 Hz breathe and the logo's colour keyframes are kept on purpose and trip nothing (WCAG 2.3.1 wants 3 Hz over a large area; a 22-px mark is neither). **There is no `aria-live` anywhere and that is right**, but the FIELD canvas has an `aria-label` that never changes and no `role="img"`, so a screen-reader user is told the window's name and nothing about what is in it — one string written from `badges.update()`'s existing throttle would fix it. **`inert` appears nowhere in the codebase**, so a powered-off window's controls are pointer-dead and still tabbable — which only starts to cost anything now that Tab works. And `kit.js`'s reader still ends in `[255, 255, 255]` for a token it cannot parse at all: correct for `--dim` and `--fg`, and the accents no longer reach it. **B58 remains flaky under load** (an absolute `fpsRun > 15` on a shared machine) — unchanged by this wave and untouched by it.

**TWO LINES IN `docs/ui/STYLE-LOCK.md` WERE CORRECTED RATHER THAN LEFT WRONG, and both are flagged here because that doc says to ask.** Its **TAB order** bullet described a window-raise cycle in language that reads as a focus order (the access audit said so), and it now says which it is and when it fires. And **Josh's accent ruling is written into the Accent section**, with the audit's arithmetic and the instruction not to chase the threshold — it is the single most likely thing a later wave would "fix" by accident, and the doc is where a wave looks before it starts. The λ's floor, the nine squares' rule and the one-reader rule are recorded beside them.

**LESSONS.** A fallback that the system *reaches on a supported configuration* is not a fallback, it is a second code path nobody tests — and five copies of one function is five chances for the fourth case to be missing from all of them. A protection that runs after the thing it protects against is not a protection, and the only reliable way to know is to read the **order** rather than the presence. And an accessibility preference that reaches only the chrome, while the content it exists for goes on moving, is worse than none: it reads as compliance. The general shape of all four: **each one was a thing the code said it did, in a place where nothing had ever checked whether it did it.**

### wave 58: W-PULSE + W-H2CI-UI + THE TWO DIALS + THE CAMERA BUTTONS — two proved maths contracts get a face, and the planner one of them stands on gets corrected first

**THE PULSE (board #24, ledger C1). THE NUMBERS ARE THE OTHER LAB'S AND ARE ASSERTED, NOT RE-DERIVED.** `lab/modrive.js` is Astra's (GPT-6): a length-gauge H₂⁺, iSċ = (H₀ + E_z(t)Z)c, exponential midpoint with the FULL matrix re-solved at every distinct field value, no renormalisation anywhere — **NUMERICAL** propagation (second order in Δt, S-unitary) of a **VARIATIONAL** two-centre model with **EXACT** integrals, exact in the basis at constant field, and the tail's length a **DESIGN CHOICE**. Nothing reached it. `lab/pulse.js` (110 lines) adds the four things a face and a proof need — Ė(t) in closed form, the running work integral, "the population that left the ground state" for a basis with more than two functions, and the RWA yardstick — and `lab/pulseview.js` (200) is the segment on the MOLECULE card: BASIS (1s LCAO · Sturmian n ≤ 3), R, Δt, AMPLITUDE, ω, DURATION, PHASE, FIRE · HOLD · RESET · RESONANT, a live trace, and the three readouts the contract asks for. **At R = 2, Δt = 0.05, t = 96: popU 0.0852227 and ⟨z⟩ −0.0170653, both within 1e-6 of Astra's DOP853 trace; S-norm 1 to 1.4e-13.** Against that oracle the amplitude error is **9.2733e-5 · 2.3185e-5 · 5.7963e-6 at Δt = 0.2 · 0.1 · 0.05 — ratios 3.9997 and 3.9999, i.e. 4.00 ± 0.05**, which is the claim that decides whether this works or merely moves. The Sturmian n ≤ 3 run (12 functions, g and u coupled every step) holds the S-norm to **1.4e-14** against the contract's 2e-10. ⟨g|z|u⟩ = **−1.2345933017**, Astra's own dipole to 1e-12; the RWA area is 0.29630 rad and sin² of it 0.085256 against the propagated 0.0852252.

**THE ABSORBED ENERGY IS A WORK INTEGRAL AND IT CLOSES.** d⟨H₀⟩/dt = −E d⟨z⟩/dt makes ⟨H₀⟩(t) − ⟨H₀⟩(0) = ∫Ė⟨z⟩dt exact; both sides are computed on the SAME discrete trace by different routes, so the difference measures the scheme: **5.40e-7 · 1.35e-7 · 3.38e-8 · 8.44e-9** at Δt = 0.05 · 0.025 · 0.0125 · 0.00625 — second order, and **inside the contract's ±1e-8** at the finest step. The VALUE there is 3.34865257e-2 and its own Richardson limit **3.3486542e-2 = the ledger's 3.3487e-2**, matching the oracle's 3.348654e-2 to 2.1e-9 — one unit in the last digit that number is quoted to. The raw number sits 1.4e-8 under it because the absorbed energy converges at the same second order as everything else; it is stated as a limit rather than stretched to fit.

**THE CLOCK IS THE LAB'S AND THERE IS NO THIRD ONE.** FIRE remembers t₀; the drive's time is t_lab − t₀ in the same atomic units, in whole Δt, floored so it never reads ahead of the clock (it lags by under one step, measured 0.028 a.u.). RATE decides how fast you WATCH; Δt decides how accurately it is SOLVED. Pausing stops it; scrubbing FORWARD runs it on; scrubbing BACK **holds and says so**, because a driven state cannot be un-integrated. 6 ms of frame budget, and the readout says when the drive is behind. The field sign is `kick.js`'s own (V = +E z for a charge of −1, the impulsive Stark limit Δp = −∫E dt). It touches no ψ: `reg.version` and the state digest are unmoved.

**THE H₂ CI CARD (board #35, ledger C3) — WHAT WAS ALREADY THERE, AND WHAT WAS MISSING.** `lab/h2ci.js` and `lab/h2view.js` already drew RHF and FCI, cached the 221-point pair and printed the correlated readout at the marker (wave 49), so this wave added only the four things that were not there: a **CORRELATED PAIR** switch that takes the pair and its own limit down TOGETHER (the distance between them IS the correlation energy, and either half alone is not the point); **WEINBAUM in its own readout beside the STO-3G one** rather than buried in its sub-line, since the two are the same 2 × 2 CI fed by Slater orbitals with ζ free and by three fixed Gaussians; **the dissociation limit drawn as what it is** — the dashed rule at −1 is two REAL hydrogen atoms and the STO-3G curves are not going there, so a second rule at 2E(H, STO-3G) = **−0.933164** is drawn in FCI's own colour, the line that curve actually reaches while RHF leaves the top of the box; and a note that says **plainly** which is which. Asserted: **Weinbaum −1.147777 at ζ = 1.2005 (−1.1478 ± 2e-3 at the tabulated ζ = 1.193) · RHF −1.116759307 and FCI −1.137283834 at 0.74 Å · FCI −0.933631845 at 3.00 Å · RHF − FCI there 0.277584 = the ledger's 0.2776** — a restricted determinant cannot break a bond and the CI can.

**THE TWO DIALS JOSH ASKED FOR (board #63): THE RANGE IS NEBULA'S, THE UNIT IS OURS.** Their gain is radians per SCREEN WIDTH (3.14 = a full-width drag turns π), a quantity that means nothing at a rack's width, and a dial whose default silently retunes the shipped camera is the wrong port. **DRAG GAIN 0.2 … 8, step 0.01, default ×1.00, scaling `CAM.SENS`: rad/px = GAIN × 0.0065** — ×1.00 IS the camera that shipped, and their 3.14 in our units would be ≈ 0.34 on a 1400-px stage. Measured with real pointer events: a 100-px drag turns **0.0065 · 0.0130 · 0.00325 rad/px** at ×1 · ×2 · ×0.5, exactly, in TURNTABLE and in FREE (the rotor's own angle, since FREE has no Euler angles to read), with SHIFT still taking a quarter. **FLING 0 … 2, step 0.01, default ×1.00, multiplying the released ω₀ before the law sees it — so it COMPOSES rather than competes: FLING decides how much velocity you get, μ decides how fast it decays.** ω₀ = 1.2 gives a residual of exactly 0 · 1.2 · 2.4 at ×0 · ×1 · ×2, and wave 50's closed form survives both extremes (μ = 4, FLING 2, ω₀ = 1 → travel 0.4993 against 2ω₀/μ = 0.5; FLING 0 → exactly nothing, while the drag still turns the view — a thing no value of μ can be). Both ride in this browser's settings beside FRICTION and SPIN and come back through `applySettings`. The mapping is a **sentence on the card**, not a knob value: a `.k-val` is a floating tooltip and "×1.00 · 0.0065 rad/px" spills off a 300-px card.

**THE CAMERA AND RECORD BUTTONS (board #57) — AND THE PLANNER THEY STAND ON, CORRECTED FIRST.** `lab/capture.js` is 1033 lines with thirty node gates and **nothing imported it**, so an adversarial review found three defects no browser had ever run into. A button that says EXACT LOOP over a half-turn seam is worse than no button, so they were fixed before the buttons went on, and each is gated in `tests/capture.test.mjs §12` (30 → **33 GREEN**). **(1)** `planPeriodRecording` believed the ψ period without checking that the DENSITY period was exact. The implication holds in exact arithmetic; both verdicts are numerical and `planLoop` was computing them from two DIFFERENT energy sets, so **under STURMIAN a state with no period at all came back `kind:'exact'`, `closes:true`, `seamError:0`, `laps:0`, with a true seam of 0.49 of a turn — antiphase, the worst there is.** The guard is now `D.exact === true`, and `rack.js` hands capture its OWN energy expression (`periodEnergies()`, one function, used by `periodNow()` too) — because two of them is exactly how this happened: under a propagator `reg.Ediag` is the label's ⟨H⟩ and not an eigenvalue, which `rack.js:1948` and `state.js:83` both already said. Driven end to end in the browser, 1s+2s at λ = 1.4 now answers **NEAR, T = 2988.24**. **(2)** The stationary branch fired ABOVE the line that reads the observable, so `2p₊` — which ships in the PHASE view and whose own note says the picture lives in arg ψ — was told "every frame is the same picture" while its hue turned 0.95° a frame; it now loops at **T_ψ = 2π/|E| = 50.265482 a.u.**, a number `state.js` already carried as that preset's own `visual.window`. **(3)** `laps` was unbounded, so an exact loop could be a picture of nothing (7998 density periods in 180 frames at ZEEMAN 0.05); it stays `ok` — it IS a loop, and refusing a theorem would be the wrong lie — and now carries `framesPerDensityPeriod`, an `undersampled` flag and a sentence, because the only defect was silence.

**THE BUTTONS THEMSELVES.** A CAPTURE group in the CAMERA window: PICTURE ×1…×4 and TAKE A PICTURE, SECONDS · FPS · RECORD, **ONE PERIOD gated by `plan.ok`**, a PLAN trigger, and a `wide` readout carrying **`plan.message` verbatim** — the interface re-derives nothing. The plan is **never computed on a frame** (a scan of 56 incommensurate energies measured 1.2 s in wave 45): it runs on a press, on a control change and on the pointer entering the group, and a plan whose state or view has moved reads **STALE with the button down**, because a stale plan is not an ok plan. In the shipped PHASE view it reads EXACT LOOP, 180 frames, **3 laps of T_ρ**; a Stark field is refused with its near-recurrence and the button goes down; a real picture comes off the GPU at 1400 × 814 in 91 kB and puts the canvas, the clock and ψ back exactly. **And the ceiling is real now:** `field.js` called `requestDevice()` with no `requiredLimits`, so the device took WebGPU's DEFAULT 8192 on an adapter reporting **32767** — the largest picture this build could take was a line of `field.js`, not the GPU. It now asks for the adapter's own limit (with a fallback to the plain request, because a device that does not come up is the whole application), and the ceiling is the rack's `canvasCap` **16384** — four times the pixels.

**FRAME TIME, AGAINST WAVE 51's RECORDED NUMBERS — NO REGRESSION.** Eight waves had landed since anyone measured. Repeating wave 51's own conditions exactly (500 × 844, every window open and every reader awake, GOVERNOR and auto-scale off, 6 s of transport): **19.42 · 19.13 · 19.42 ms → median 19.42 ms / 51.5 fps**, against wave 51's **20.03 ms / 49.9 fps**. **3.0 % faster**, with a 0.3 ms spread across the three runs — the frame time has not moved outside the measurement's own noise, and if anything it is marginally better. Main-thread work per frame: 3.8 ms total, of which the pulse's own tick reads 6e-8 ms when nothing is armed.

**PROOFS.** `tests/pulse.test.mjs` — **8 GREEN, 0.29 s**, every contract number a judged line with its tolerance (P1 Ė is the closed-form derivative to 1.6e-11 · P2 the field sign is kick.js's · P3a Astra's trace · P3b second order, the ratios · P4 the work balance and its Richardson limit · P5 the Sturmian · P6 the RWA · P7 the schedule and five refusals), in `test.sh` as `PU_RC`. `tests/capture.test.mjs` §12, three regressions driven into the state that produced the wrong answer rather than asserting the fix is present. Browser: **B105** the pulse (the trace, the second order measured through the interface with **no oracle fetched** — successive differences quarter — the clock law, the digest unmoved), **B106** the H₂ CI additions with the ledger's numbers and the switch measured as real ink on the canvas, **B107** the two dials with real pointer events, **B108** the buttons and all three planner corrections end to end. **B66 was updated and this says so**: its knob list was pinned exactly as `SPIN|FRICTION|ZOOM|FOV` and the two dials Josh asked for are precisely what the wave was asked to add, so the list is now `SPIN|FRICTION|DRAG GAIN|FLING|ZOOM|FOV|SECONDS` — still exact, because pinning what the window contains is the point. `./test.sh`: **node: 0   browser: 0** — **124 judged browser blocks, 0 RED**.

**FOUND, AND DELIBERATELY NOT FIXED.** The same review's §4 — `captureLayout()` reads `d.parentElement === rackL` and never `data-phone-from`, so **a layout saved on a phone records every window as `'R'`** and SPECTRUM never comes home; and `applyLayout()` never clears `phone.floats`, so loading a layout on a phone is half-undone by the next rotation. Real, and a layout wave's, not this one's: nothing here touches layouts, and B94 tests the neighbouring ordering that works. **`lab/render-exact.js` appeared in `lab/` from another hand while this wave ran** (92 kB, "stage two of the capture work"); nothing imports it, `pwa.test.mjs --write` has precached it by its own law, and it moved twice mid-gate — which is what a shared `lab/` costs. **Two flakes, both pre-existing and both on a loaded box** (load average 4.7 while another agent worked): `mo.test`'s T WALL TIME judge went red once at medianMs 62.4 against its 60 ms threshold, samples 34.7 / 62.4 / 97.1 — the exact flake wave 51 recorded — and is 32/32 GREEN alone in 13.5 s; and **B28** went red once with `particles.state.count` 0 after Ctrl+R and replayed green (count 160) in isolation. Neither touches anything this wave changed. `docs/ui/STYLE-LOCK.md`'s camera bullet gained the two dials **and this flags it, because that doc says to ask**: the sentence records that they compose with the friction law and that a control duplicating μ's job would be the wrong port.

**LESSONS.** A number quoted to seven figures is a LIMIT, not a value at a step: the absorbed energy is second order like everything else, and the honest move was Richardson on the sequence rather than a tolerance widened until the raw number fit. **Two expressions for one quantity is a defect waiting for a switch to be thrown** — capture and rack each computed "the energies" and the answer differed only under STURMIAN, which is exactly where nobody looked; the fix was one function, not two corrections. And a subsystem with thirty green gates that nothing imports has been proved against its author's imagination, not against the app: three of the four defects this wave met were in code no browser had ever executed.

### wave 59: W-AUDITS — the harvest of four audits, in which almost nothing was this wave's idea and the whole job was doing each one exactly and proving it

**THE LICENCE DEFECT WITH REAL CONSEQUENCES, AND RENAMING IS THE FIX (board #64a).** Our wordmark face is a five-glyph subset of gluk's **Spinwerad 0.3**, converted TTF → WOFF2 — a **Modified Version** in the SIL OFL's own words ("adding to, deleting, or substituting … or by changing formats"). `spinwerad` is a **Reserved Font Name**, declared twice independently (`fonts/Spinwerad-OFL.txt:2` and the original binary's own nameID 13), OFL §3 forbids a Modified Version from using one "as the primary font name as presented to the users", and the **TERMINATION** clause makes the licence "null and void if any of the above conditions are not met" — so the grant that let the file ship at all had lapsed. **Un-subsetting does not fix it** (a WOFF2 conversion is still a Modified Version, and the original is 695 KB). The derivative is now **`LW Title`**: nameID 1 / 3 / 4 / 6 rewritten, gluk's nameID 0 / 13 / 14 kept **verbatim** (OFL §4 expressly permits acknowledging the author, and the acknowledgement should exist), a new nameID 10 saying what it derives from and why it was renamed, and the CSS family in `skin.css` and `lab.css` changed with it — the rename had to happen in **both** places OFL §3 talks about. **695 184 → 3 176 bytes, and the wordmark did not move a pixel**: every one of the five outlines is byte-identical to the pre-rename subset, as are `glyf loca hmtx cmap OS/2 GSUB GPOS GDEF post hhea maxp gasp` — only `head`'s checksum and `name` differ. `fonts/Spinwerad-SOURCE.txt` records the derivation and carries gluk's own FontLog forward, which is the OFL FAQ's recommended way for a modifier to say what changed.

**AND THE TWENTY KATEX FACES WERE NEVER MIT (board #64b).** All twenty carry nameID 13 and 14 naming **SIL OFL 1.1** and **two** copyright holders — Design Science, Inc. and Khan Academy — and twelve Reserved Font Names between them; NOTICE said they were MIT and carried "no separate notice", **both false**, and no OFL text shipped for them at all while all twenty **were** precached, so an offline install held twenty fonts with no licence. `lab/vendor/katex/fonts/OFL.txt` (4 776 bytes) now ships, built from the OFL body already byte-identical in the tree with a header transcribed from the faces' own name tables. NOTICE's third-party block is rewritten whole: it named three deleted `.ttf` files, omitted STIX Two Math entirely, and nowhere said the faces are **modified**, which is the fact §3 turns on. ABOUT's fine print named two typefaces where three ship and pointed at `lab/fonts/`, a path the deploy does not have — it is six `./`-relative links now, gated at the real depth by `build-deploy` §V2 (232 references, all resolve). **The licence texts are precached** (6 files, 22 217 bytes): OFL §2 says each copy must *contain* the licence, and an app that makes zero network requests on its second launch was holding twenty-three font files it could not show one for. The three places that must agree — `sw.js` §NEVER_PRECACHE's prose, `build-deploy`'s predicate, `pwa.test`'s — were changed together, which is what that gate exists to force. **Roboto keeps its name** (its licence declares no RFN; grep-verified) and **STIX keeps its name** (its RFN is `"TM Math"`, which `STIX Two Math` does not contain) — the difference is the RFN, not the amount of modification, and `Roboto-SOURCE.txt` says so in the file a future wave would read before "fixing" it. Roboto's stripped licence metadata was put back by hand — nameIDs 7, 8, 9, 11, 13, 14 copied verbatim from the original, **all 17 other tables byte-identical, +300 bytes**.

**THE ONE MESSAGE A BROKEN BROWSER GETS (board #65a).** `lab.css` had no `#banner p` rule, so the paragraph inherited `body { color: var(--fg) }` — near-black on the shipped LIGHT theme, over the dark maroon the pane paints for itself: **1.19 : 1, measured in the page**. And worse than a plain miss, because `showBanner()` runs three thousand lines *before* `applySettings()`: it appeared white-on-maroon and went dark a second later. The ink is written **unconditionally** now, because this is the one pane that does not follow the theme — one string of ink on both themes, **13.69 : 1**, heading 6.64 : 1 — and it has a × at last (26 px of ink in a 44-px finger; it sat at z-index 60 for the whole session with no way down). **`onLost` was never passed** to `createField`, so a driver reset or a reclaimed mobile tab froze the picture in silence; it now says what happened and offers a reload.

**THE FIRST SCREEN'S LEGEND (board #65).** The hint bar's nine seconds were counted **under the photosensitivity notice** — armed inside `boot()` seven hundred lines above `warning.show()` — so a stranger who actually read a 26-word notice about epilepsy watched the only legend in the app fade one second after pressing CONTINUE, or never saw it. It goes through `warning.onAccept` now, which is where ANTI-PATTERN 18 says anything of this shape belongs: measured in wall time, still there at 9.6 s with the pane up, gone ten seconds after the press. `shift+click = place electron 1` is **deleted** — it is guarded on `helium && helium.on` and HELIUM ships folded and off, so one of seven advertised things did nothing on the screen advertising it. `lab.css`'s `#title .ms { display: none !important }` beat `skin.css`'s hover reveal regardless of specificity, so **`QWAVE-0 · HYDROGEN SHADOW LAB`** — the only on-screen string containing the word *hydrogen* — could never render; the sledgehammer is gone and a real pointer is driven onto the masthead in the gate. And the document had **no description, no og:*, no twitter card**, so every shared link unfurled bare: the sentence is the manifest's own `description` and the ABOUT tagline character for character, with `og:title` the manifest's `name`, all four asserted equal (ANTI-PATTERN 6), and the one absolute URL the lab contains — `og:image`, which a crawler cannot resolve relatively — is checked against `BASE_PATH` at build time.

**THE PHONE MEETS THE FIELD, AND THAT WAS THE JUDGEMENT CALL (board #65c).** At the phone breakpoint the rack is 300 of 390 px, **opaque** by wave 51's own rule, and nothing hid it at boot — while `#field` is a full-stage canvas, so the volume rendered **centred behind it** and the 90-px strip showed the far corner of an empty domain box. **The rack now starts hidden there**, and it is a DEFAULT rather than a rule: `phoneRack` is the same kind of key as `card` and `phoneTr`, and pressing ◧ *is* this browser saying which it wants — proved in both directions. Measured: the whole width is canvas and the centre of the screen hit-tests to `#field`. **What was deliberately NOT done:** the transport stays **docked at the top of the rack**, because that is Josh's wave-51 instruction and undocking it into a floating pill would contradict it; and the volume is **not offset** to dodge the rack, because moving the camera to make room for furniture is a lie about where the origin is, and a 90-px picture is not the cure for a 90-px picture. The phone gets the **legend** instead — the keyboard line stands down, a touch line takes its seat naming the ◧ and the ▶ — and that took **one more rule than expected**: `lab.css` fades the hint out with `body.rack-hidden`, which is right on a desktop and would have switched off the touch legend at exactly the moment it is the only thing on the screen. Found by looking at the picture, not at the gate, and the gate now asserts the opacity.

**THE SAFETY ITEMS ARE NOT TASTE ITEMS (board #66).** `saveSettings()` rebuilt its object from scratch and carried three foreign keys — the wave-54 bug its own comment describes — and `warned`, added by wave 48 *afterwards*, was not among them: accept the notice, then change the theme or load a layout or open a link naming a palette, and **the acceptance was erased**, in the same session, before `needed()` reads it. One word. And **`?warn=0` was a third door, in the URL**: `needed()` answered false before `seen()` was consulted, so `remember(true)` never ran and `onAccept` fired synchronously — `…/?play=1&warn=0#s=…` started the field at full rate for a first-time visitor with the pane never shown. `navigator.webdriver` already covers every test, so the query bought the gate nothing; **both `?warn` arms and both `?motion` arms are behind the driver check now**, `?warn=1` too, because a gate with one arm reachable from a public URL is not one rule. `?motion=full` overrode an **operating-system** `prefers-reduced-motion`, which is the strongest thing a person can say about movement — a link is somebody else's picture, and it does not get to answer that for the reader.

**THE λ'S THIRD SURFACE IS A KNOB (board #67).** Wave 57 corrected both λ copies against `MARK_GROUND`, two constants — right for the notebook's, which is on a card, and wrong for the header's, which is `background: none` over the canvas whose clear colour is the shipped **STAGE** knob. Swept in node over 23 palettes × 360 hues × 11 stage values × 2 themes = **91 080 samples**: correcting against the live ground and nothing else still left **7 416 under 3 : 1, worst 1.686 : 1**, because `visibleInk` chose its walk direction at relative luminance **0.5** — the midpoint of the *scale*, not the break-even of the *ratio* — so for a ground in (0.179, 0.5), which is exactly where the knob's travel passes, it climbed toward a white that is itself too dark and returned a colour under the floor **in silence**. The constant is **√0.0525 − 0.05 = 0.1791287847**, where white and black both give 4.583 : 1: with it, **0 of 91 080 are under the floor and the worst is 3.000 : 1**. Two further things had to be true: `markInk` reads `mat.bg` for `#title` and keeps the card for `.nb-logo` (one call site, two grounds — the two λ copies are no longer the same ink, and B101's old assertion that they were is the one expectation this wave changed on purpose), and the floor is applied to the **8-bit colour the browser draws** rather than the float, which was worth a real 2.988 → **3.001** in the DOM.

**LAYOUTS SAVED ON A PHONE (board #68).** `captureLayout()` read `d.parentElement === rackL` and nothing else — and on a phone `#rackL` is empty, so **every** card was saved `side: 'R'`; with SPECTRUM on the left rack out of the box that meant rotate, save, rotate back, load, and the mirror rack is empty for ever. Wave 51 created `data-phone-from` for exactly this and `applyLayout` already read it; only the capture did not, and **the asymmetry was the bug**. And `phone.floats` — the record of what was on the stage at the crossing — survived a load, so rotating back popped the *pre-crossing* windows out on top of the layout just loaded. **The fix is not to forget but to make the record describe the arrangement that IS loaded**: a load on a phone replaces `phone.floats` with the loaded layout's own float block, so crossing back reproduces the layout in full — which is also why B94 stays green for a better reason than before. `layoutLabel` now counts the windows that will actually restore.

**PROOFS.** `tests/ink.test.mjs` §3 adds STAGE as a third axis — 17 GREEN, 2.6 s — and drives wave 57's own 0.5 threshold beside the new one rather than describing it (ANTI-PATTERN 13). `tests/pwa.test.mjs` gains **§A2**, the four-way equality of the link preview with the manifest, and **§F**, which decodes every shipped WOFF2's `name` table by hand — WOFF2 header, table directory, UIntBase128 lengths, brotli, the name records — gathers every Reserved Font Name declared anywhere in the tree (13 across 6 licence texts and 20 vendored faces), and asserts that **no subset face uses one in any user-facing name** and that **`skin.css`'s three `@font-face` families are those same three strings**. Renaming the CSS family back to `spinwerad` was tried and the gate refused it. Browser: **B109** the banner and the lost device, **B110** the legend's clock in real wall time, the dead clause, the subtitle under a real pointer and the link preview, **B111** the phone's first screen, **B112** the acceptance through five ordinary writes and the six `?warn` combinations in value space, **B113** the λ at seven values of the knob on both themes, **B114** a layout saved on a phone with two *different* stage arrangements so the two cannot be confused. **B39 · B47** take the new font name, **B69** takes the phone's hidden default (and says so), **B101** takes the split ground. `./test.sh`: **node: 0   browser: 0** — **130 judged browser blocks, 0 RED**.

**FOUND, AND DELIBERATELY NOT FIXED.** The geometric UI glyphs — ◧ ▶ ☆ ▾ ⇄ ⓘ ⏻ ⧉ ◐ ▤ — are in **neither** shipped face, and never were: the *original* Roboto has none of them, so the subset dropped nothing and they have always come from a system fallback. A machine with no font covering U+25xx shows tofu for the transport's own play button. Wave 55 turned some header marks into drawings from `lab/mir/glyph.js` for this class of problem and STYLE-LOCK says not to invent more; the touch legend uses the same two characters the buttons beside it already use, so it is no worse and it is consistent. AUDIT-FIRSTRUN's R5 (a `title` on the four badges), R9 (the manifest's dark splash against a light theme) and R10 (a `?` chip beside ◧ · + · ☆) are real and are outside this contract's five sections.

**LESSONS.** A rename is not a label: **the same string has to change in the binary and in the stylesheet**, because OFL §3 is about the name *presented to the users* and a CSS `font-family` is exactly that — which is why the gate reads the WOFF2's own name table rather than a filename or the `.txt` beside it, the pair that had drifted. **Fixing the ground exposed the direction**: correcting the λ against the live STAGE was necessary and not sufficient, and the second half was a constant that had been wrong since wave 57 and harmless only because both real grounds sat far from the band the knob's travel runs through. **A geometry test passes on an invisible element** — B111 was green on a legend at opacity 0, and only the screenshot showed it. And the general shape of all four audits: every one of these was a thing the code *said* it did, in a place where the thing that would have contradicted it had never been looked at.

### wave 60: W-MODSHAPE — the modulation window's missing half is one idea: a picture per source, and the six controls that picture makes meaningful

**MODE: STRUCTURE, then BEHAVIOUR.** No aesthetic invention: the chips are `sw`, the shape buttons are plain buttons carrying a sampled path, and the picture is an `<svg>` in a div — **no new widget** (STYLE-LOCK).

**WHY, IN JOSH'S WORDS.** *"It seems like the modulation window still hasn't started yet."* He is right and it is measurable: `modview.js` surfaced **23 of the model's ~95 controllable facts**, and what it surfaced was the **wiring** — sources, macros, routes, a modulated number readable while it moves — all of it correct and proved (B74 · B75 · B76). What it lacked was the **shape**: you could add an LFO and not see what it did. A modulation window whose central object is a `<select>` of seven words has not started. The missing half is one idea — **give each source a picture, and put the controls that picture makes meaningful beside it** — and the picture is the same renderer for both kinds, because `envPoints(s)` hands back the identical `{t,v,tension}` list the LFO draws.

**THE RANKING, AND ITS ARGUMENT (this is the part worth keeping).** **λWAVES has no tempo and no audience, but it does have a camera and a recorder.** Nothing in a hydrogen atom has a beat, and nobody performs with this — but `lab/capture.js` records loops, and a loop that **closes** requires every modulator to be an exact integer division of one period, which is precisely what BPM sync + `LFO_MULTS` + `ANCHOR` provide. So the six musical controls are **reframed rather than deleted** — *BPM is not tempo here, it is the LOOP CLOCK* — and the window says so on the card. Therefore: **shape first, loop clock second, performance never.**

**WHAT SHIPPED.** Every source is a **card**: header (power · an editable `label` · ◀ ▶ order · fold · ×), then a **286→226 px SVG** carrying the shape, the stairs, the points, the tension handles, a playhead and a dot; a caption saying what the picture IS; a **status capsule** `● RUN 0.42 · 3 OUT` on the card rather than in a hover (ANTI-PATTERN 4); a **WAVE / CURVE** segment and the seven-wave menu; **six shape buttons whose glyphs are sampled from their own presets**, so a button can never draw a shape the engine would not produce; **TRIG/OFF · FLIP · INVERT** and **BPM · ANCHOR · TRIPLET · DOTTED** (five of them one generic loop that uses the object key as the model field name); **RATE · PHASE · SMOOTH · STEPS**; and an **A/B** pair with a cross-device patch clipboard. The ENV gets the same picture with a completely different door — point drags write `{a} {hold} {d,s} {r}`, handles write `{ta} {td} {tr}`, and a tap on empty space **refuses in a sentence** — plus the missing **HOLD** stage, the three tensions, and **×0.5 · FIT · ×2**. `moveSource`, `label`, `minimized`, `shapeMode`, `steps`, `invert`, `anchor`, `triplet`, `dotted`, `trig`, `hold`, `ta/td/tr`, `timeScale` and both banks were all in the model and unreachable; they are reachable now.

**THE RISK, HANDLED IN THE DESIGN RATHER THAN RETROFITTED.** `mod.js` is a module singleton and this window already paints the whole target list at 30 Hz. The renderer rebuilds **only on a signature** (`width | shape hash | steps | which four cycles`), and the frame paint moves **exactly four attributes**: the playhead's `x1`/`x2` and the dot's `cx`/`cy`. A card with no width (closed, folded, not yet laid out) renders nothing and says so by clearing its signature; a **ResizeObserver** is the trigger for the first paint, because the rack has no frame loop while nothing runs.

**THREE DEFECTS, ALL ARITHMETIC, ALL ONE EXPRESSION.** (a) **The SMOOTH readout was wrong by up to 4×**: the card printed `v · SMOOTH_TAU_MAX · 1000` where the model's law is `tau = 0.5v²`, so knob 0.25 said **125 ms** and the truth is **31.25 ms** — right only at the two ends. It calls `M.smoothTau()` now, and the card prints **31 ms**. (b) **The ENV time knobs could not reach their own defaults**: linear over 0 … 8 s on kit.js's 220-px travel is **36.4 ms per pixel** and the default attack is **10 ms**, so the smallest adjustment the control could make was nearly four times the value it started on. The square law (`get √(v/8)`, `set p²·8`) makes one pixel **0.165 ms** at the bottom and 72.6 ms at the top; measured through a real 3-pixel drag, ATT now moves **9.2 ms** where it would have moved **109**. (c) **`curve.js` had no behavioural gate in this repo at all** — 430 correct lines, an importer, and the only thing `mir.test.mjs` asserted about it was that its bytes match its source, which is a *provenance* claim. That is our own ANTI-PATTERN 17 inside the file Josh asked to be copied.

**AND FIT IS NOT POLISH.** Measured on the drawing this window actually renders: a default envelope over its default 4 s window puts its breakpoints on pixels **0 · 1 · 21 · 60** of 265 — the whole shape in the left quarter and **the attack one pixel wide**. After FIT (`clamp(0.25, 8, duration × 1.15)`) they are **0 · 3 · 78 · 230**. Without it the ENV display is not ugly, it is unreadable.

**THE `<select>` AUDIT (ANTI-PATTERN 12), answered.** The wave menu is an **assignment** — the value IS the state. The one case that would have needed a second road is re-picking the wave you are already on in order to come *back* from curve mode; that is the **WAVE / CURVE segment's** job, not a hidden re-pick that fires nothing. Without a way back, tapping a shape would be a one-way door and **S&H and DRIFT would be stranded**, because no preset can draw a per-cycle stochastic wave — which is also why the picture draws **four cycles** of those two and says so in the caption.

**PROOFS.** `mir.test.mjs` gains **§19 · the breakpoint curve's five laws** and **§20 · the two arithmetic defects** — exact at every point (40 breakpoints across all seven presets and hand-drawn curves, the duplicate-`t` tie rule included); `bend(x,0)` bitwise `x`; monotone with no overshoot over **80 601 readings** and no segment escape in value space; C0 with the one deliberate jump; the antisymmetry to **1.2e-16**, `flip∘flip` bit-identical on all seven and the −0 normalisation making symmetric shapes invariant *to the bit*; the preset↔wave exactness table (three bit-exact, TRI 5.6e-17, SINE 0.008759 and stated); the tap-again-to-flip law; the four editor doors' refusals and the one thing `curveEdit` adds over the bare `movePoint`; and that `envPoints` agrees with `envAt` to 1e-12. **57 → 71 gates, 0 failing.** Browser: **B115** the curve display and its editor under real pointer events (wave mode read-only and saying so, the sampled glyphs, the polyline equal to `evaluate` to 1e-12, a drag moving exactly one point and keeping its index, a handle moving exactly one tension, tap-to-add and double-tap-to-remove, the playhead to half a pixel, the dot leaving the line under SMOOTH, the ladder's levels, the way back to a wave); **B116** the envelope (FIT's pixels before and after, the point→knob map with and without HOLD, the two refusals leaving every stage bit-identical, the square law under a 3-pixel drag); **B117** the loop clock (two anchored LFOs at 1/4 and 1/8 back on the same phase pair after exactly one beat; TRIPLET/DOTTED exclusive **on the card as well as in the model**), INVERT, the ladder's log-space rung (100 → 96), an A/B round trip exact on every scalar and point with phase, cycles and power untouched, the patch clipboard and its cross-kind refusal, reorder, label and a folded card surviving `serialize → deserialize`. **B70/B71's 44-px walk now creates one source of each kind**, so the shape half is measured rather than merely looked at — and it found the one real layout bug in this wave: `.mod-srch` had never wrapped, and six chips in a 250-px phone card overflowed the rack with two × buttons where `elementFromPoint` answers `#rack`. `./test.sh`: **node: 0   browser: 0** — **133 judged browser blocks, 0 RED**.

**WHAT WAS LEFT OUT, EACH WITH ITS REASON.** **AUDIO**, still the disabled chip and its sentence: the model half is complete and free, the capture half is `app/audio.js` — `getUserMedia`, a device picker, a permission surface and a second consent story in an app that already has a photosensitivity gate. **Trigger macros and the pad rail**: a second macro kind, a second meaning for every row and an auto-built envelope, for a gesture nobody performs here; ENV's FIRE is the same chain without it. **TAP TEMPO**: the engine is lovely (nine 500-ms taps → exactly 120.000 BPM) and it is the one musical control the loop-clock reframe cannot save. **BASINS' QUARTER chip**: a paint-cadence divisor, and we already have CADENCE 60/120 Hz, which is the same idea as a rate. **Their compact device rail with its mini curve**: `REFERENCES.md` forbids it by name. **`ext` sync** and **`materialize`/`legacyOf`**: no external clock and no v2. **Drag-the-grip patching** works by lighting every registered control on the screen as a drop target, and STYLE-LOCK's modulation-outlier ruling is that nothing modulation-shaped may appear outside this window; Josh has approved it and it has its own research map, so it is the **next wave** and it wanted this window to exist first.

**FOUND, AND DELIBERATELY NOT FIXED.** **The preset store cannot ship as it stands** (Tier C, not built): all three `FACTORY_PRESETS` route exclusively to `freq`, `phase`, `bright`, `pal.e1.phase`, `pal.e2.phase` — **measured, every one loads 100 % dormant here**, so the MANDELBROT folder would offer three presets that load and do exactly nothing. The fix is host-side and is two moves (filter `presetList()` on `factory: 1`, and write our own three against `observer.*` and `material.*`), neither an edit to `mod.js`; it is ~40 lines of data and a judgement, and it belongs with C2's dead-send chip or not at all. **The map's density budget was 286 px of body and the real number is 226**: `--float-w` is the rack's *content box less its scrollbar* (274, not 300), and the group and the card each take their own padding — so six 44-px shape buttons in one row (279) do not fit and are three to a row at 74 px, and four 62-px knobs (257) wrap to 3 + 1 rather than being shrunk into each other's hit areas. **`skin.css` §5 still names `.mod-wave`** in its 44-px phone list; the element came back in this wave, so the rule is live again rather than dead. **The ENV status capsule prints `REL 0.00` for a released one-shot even after it has finished**, because `envAt` and the marker are both correct and there is no *finished* state in the model to read.

**LESSONS.** A picture is not a decoration: the one thing that made the whole window legible was putting the dot on **`s.out`** rather than on the drawn line, because SMOOTH, INVERT and STEPS then *visibly* pull it off the shape — the control explains itself and nothing had to be written down. **A polyline built from segments is exact and a uniform sweep is not** (a duplicate `t` becomes a true vertical instead of a smeared diagonal) — but the stairs are computed from the same samples, so a two-sample linear ramp gave two stairs instead of four, and "sample only the bent segments" was an optimisation that broke a *different* reader. And the oldest one, again: **a widget that stretched to the whole row is what CSS specificity looks like from the outside** — `.row > .sw` is two classes and beat a one-class rule, measured as a DOTTED chip 226 px wide.

### wave 61: W-MACRO-ROUTER — the macro becomes the router, and the arc reaches out onto the knob it holds

**MODE: BEHAVIOUR.** One new gesture, one new mark on an existing control, one vendored model edit and two existing defects. No aesthetic invention: every colour is `--acc2` (ACCENT B, which is what *relationship* already means), the popover is built from `seg` and `trig`, and **no new widget** (STYLE-LOCK).

**WHY, IN JOSH'S WORDS.** *"The macro is essentially the router that brings it into the app. Otherwise the modulation is useless… A glowing bar with the second accent color can show the range of the modulation… Whenever a macro is routed to a knob, there should be an indicator or miniknob or drag space where the colored arc around the knob changes the arc length."* Wave 52 built the model and wave 60 built the shape; a route could still only be made by picking two `<select>`s and pressing ROUTE. **The model was never the missing part — the router was.**

**THIS AMENDS THE CONTAINMENT LAW, and the amendment is written into `docs/ui/STYLE-LOCK.md`.** Modulation's own *controls* still stay in its window; exactly **two** things now cross the boundary, by Josh's instruction — **the route gesture while it is live**, and **the arc once a route exists**. A law that contradicts the build is worse than no law.

**WHAT SHIPPED.** Each macro row carries a **GRIP** (its ordinal; the row beside it holds a text field and a menu, so a draggable row would steal the caret) with **two roads decided by 4 px of slop**: **DRAG** — Serum's road, on the house pointer pattern — and **a tap that ARMS it**, which is Bitwig's routing mode and **the only road that works when the macro and the knob are never on screen together, which on a phone is always**. Both ship at **every size**; a gesture that exists on one breakpoint is one nobody learns, and Logic for iPad — the only touch-native reference of the four — dropped dragging entirely. While the gesture is live all nine drop targets light and everything else recedes to .45, because with no hover, validity cannot be reported at the pointer and has to be a state of the SURFACE (ANTI-PATTERNS 4); the one under the finger is driven by `elementFromPoint` on every move, never by `pointerenter`/`pointerleave`. A **ghost** rides 44 px above a fingertip. Once routed the dial wears a **RING**: the selected macro's route at r = 21.5 (the one you grab), every other live route's summed reach at r = 18. **Depth is a VERTICAL drag over the card** on kit.js's own ladder (220 px full scale, 900 with shift, 320 for a finger) — never along the arc, which is 101 px of travel for a 44-px fingertip. **Press and hold 450 ms** (or right-click) opens a popover carrying RANGE · CENTRE / UP / DOWN, REMOVE, REMOVE ALL, RESET, and — **the half Serum is missing** — the list of which route the outer arc edits, *on the control* instead of in another window.

**FOUR THINGS SETTLED AGAINST THE REFERENCES.** (1) **The drop depth, where we beat Serum.** Serum infers polarity from where the control is standing and then assigns a **full-scale** depth, which is why its own author tells people on his forum to park base controls at 0 or 50 % first. We know `baseNorm` at the instant of the drop, so every drop **fills exactly the room the knob has left, in the direction it has room**: SOFT at 0.700 of 0.300 … 2.200 lands a route reaching **exactly 2.200**. Nothing clips on the first frame at any base, and the first act is to *reduce* a depth that already means something. (2) **Clipping is Massive's answer, not Serum's**: the model clamps (it always did), the arc stops at the end, and a radial **SPUR** runs outward at the overflowing end — Massive's *"small break at the limit of the modulation range"*, inverted — with only the clipped **number** in `--warn`. **Never a red arc**: `--bad` is spoken for and ACCENT B is a colour the user can move. (3) **Zero depth is a real state and keeps its handle** — a 4-px tick at the base; dragging to zero is **not** removal and must never be. (4) **The arc is anchored to the BASE, never the current value**, so a hand on a dial under a running LFO **slides the arc with the needle and keeps its width to 1e-9** — the synth law made visible, and the best argument for the whole feature.

**THE VENDORED EDIT, and why it was worth it.** *"Clicking can choose 'center of dial' or 'highest dial'."* UP and DOWN were already expressible; **CENTRE was not** — `influence = lerped − r.min` makes the offset **always zero when the macro reads zero**, and all three workarounds fail honestly (inverting the source still yields 0…1, two opposed routes both start at 0, and shifting the base would **destroy the user's number**, which is what `registry.js` exists to prevent). So `lab/mir/mod.js` gains **four touches, in five new marked hunks**: a `bi` field, a **midpoint** anchor in `routeInfluence`, `setRouteRange`, and both ends of the serializer. **`diff -u` against the source goes from two hunks to seven — the provenance header plus six marked ones, measured — and an upstream fix is still a patch** — `mir.test.mjs §16` now undoes all six by their **exact text** and re-proves byte-identity, which is a stronger claim than counting lines. `PORT-NOTES.md` carries all of it. Per-route **BYPASS** was refused: it would have been a fifth touch bought for a convenience, where `bi` bought a mode Josh named.

**TWO EXISTING DEFECTS, both found by the map and both fixed here.** (a) **`modview.sync()` never refreshed a route's MIN/MAX faders** — bpm, sync, pause, cadence and every source, and not those two — so a range changed from anywhere but the fader itself went stale for ever, with no event to correct it. True since wave 52 (a preset load, an undo, a project restore); the arc only makes it *visible*, because the arc changes the same two numbers. (b) **`spanOf()` sliced the whole route list per call** and every routed target plus every ring asked it once per tick. `routeIndex()` builds the answer for every target in **one pass**, `paint()` calls it once and hands it on, and the rings never touch the field's frame loop: they ride the 30 Hz modulation paint and the registry's own events, **filtered so `'modulated'` — the reason that fires sixty times a second — does nothing**, because the arc is anchored to the base.

**PROOFS.** `mir.test.mjs` gains **§21** (a bipolar route puts the base in the middle of the swing and a macro at 0.5 moves the target by exactly nothing, `Object.is`, not a tolerance; a unipolar route is bit-for-bit what it was; the drop rule fills the room at seven bases with **zero clipping**; and `bi` round-trips as `1` and is **absent** when clear, so a unipolar rack is byte-identical on the wire to one written before the edit existed) — **71 → 75 gates, 0 failing**. Browser: **B118** the gesture (both roads under real pointer events, nine lit targets and the rest dimmed, the room filled exactly, the duplicate refusal, a drop on nothing, arm-and-tap surviving a scroll and a window raise, Escape, and the runtime door stamping a control registered *now*); **B119** the arc (no route → no ring; the two radii; 44 px = 0.200 and shift = 0.050; the tick, the spur, the `--warn` end; a wrap target's **360°** ring and no spur; the arc following the base and keeping its width; double-tap removal bit-exact; and the fader defect reading 0 %/60 % where it used to read 40 %); **B120** a **real WebDriver finger** for drag→drop, arm→tap and the 450 ms hold, then CENTRE through the real popover with its `Object.is` and its project round trip. `./test.sh`: **node: 0   browser: 0** — **136 judged browser blocks, 0 RED**.

**THE GEOMETRY CORRECTION THE MAP DID NOT HAVE.** The spec gave one arc law — 270° from 7:30 — and **kit.js has two**: `--turn = −135 + p·270` for an ordinary dial and `p·360` for a **wrap** dial. HUE and YAW are wrap targets, so a 270° ring on one would have put the modulation somewhere the needle never goes. The ring reads `registry.isWrap(id)` and uses the needle's own law. The second measured correction: at the map's radii (20.5 and 18) the 2.5-px and 1.5-px strokes leave **half a pixel** between them and read as one thick arc — the whole point of two radii is lost. They are 21.5 and 18 now.

**WHAT WAS NOT BUILT, EACH WITH ITS REASON.** **Yaw and pitch are not drop targets**: `defs[]` has eleven targets and only **nine** carry a knob accessor — the camera is dragged, not dialled — so they stay picker-only until someone gives them a dial, and the gesture is exactly as large as the registry's dials and no larger. **Per-route BYPASS** (above). **The `⟳` mark on a full-turn wrap ring**: the full circle *is* the statement, and a glyph inside a 46-px SVG would be a font request `STIXTwoMath-SOURCE.txt` does not carry — the window's own RANGE readout still prints it. **`fmtVal` was not lifted to `kit.js`** as the map suggested: it is a modulation-currency formatter with one caller, and moving it into the shared kit would put a modulation decision in the widget vocabulary for nothing.

**FOUND, AND DELIBERATELY NOT FIXED.** **The grips live only inside the modulation window**, which is *"the playhead expanded"* — so routing requires opening it, every time. Putting the eight grips on the minimised transport beside the `⤢` is the obvious answer and it is a **separate decision** about the transport's box, not part of this gesture. **The ring owns an 8-px annulus of the dial's 44-px finger** (11 px on a phone), so a press between r = 17.5 and r = 25.5 edits the DEPTH rather than the VALUE; the dial's own 34-px face still turns everywhere it always did, and because the ring is a child of `.k-dial` the 44-px walk still measures the dial as one owner. That is the trade Serum makes with `alt`+drag and we make with geometry, and it wants one pass on a real iPad — as do the **450 ms** hold and the **320** touch constant, which are judgements and not measurements.

**LESSONS.** **A drop that fills the room is a different feature from a drop that assigns full scale**, and the difference is one line of arithmetic and the whole first impression. **The parent you choose is the hit-test you get**: putting the ring's SVG inside `.k-dial` rather than beside it meant `elementFromPoint` still answers *the dial* for B70's 44-px walk, and the alternative would have failed nine controls for a decoration. And the oldest one, again in a new place: **`color: var(--glass-well)` is not a text colour** — it is a translucent well, and on an accent ground the ghost's own name was invisible until it was measured in a screenshot rather than reasoned about.

### wave 62: W-KEYBOARD — the instrument becomes operable from a keyboard, and the law it needed was already written inside `knob()`

**MODE: BEHAVIOUR.** No aesthetic invention, no new widget, no colour, no shortcut removed and no shortcut renamed. One CSS selector added (`.fd:focus-within .fd-val`), one CSS rule added (`.skip` / `.vh`), and everything else is roles, names, key handlers and one `inert`.

**WHAT WAVE 57 LEFT.** Wave 57 gave Tab back to the browser and said so in its own block: *"the rest of keyboard operability is NOT built — focusable knobs, arrow-key values, the menubar, segmented state, and the bare printable keys that still fire while a control has focus."* Before this wave the tabbable set contained **zero sliders and zero radiogroups**; 461 controls, every one a `<div>` or an unnamed `<button>`.

**THE LAW, AND IT WAS ALREADY IN THE FILE.** `knob()`'s pointer drag moves normalized **travel** and then denormalizes. So: **an arrow moves a knob's travel by a fixed fraction, never its value by a fixed amount** — one rule for a linear and a logarithmic dial, with **no new mathematics, no new option and no per-knob tuning**. On GAMMA (0.5 … 2.4) an arrow is 0.019 everywhere; on RATE (log, 0.1 … 3000) it is a constant **ratio** `(hi/lo)^0.01 = ×1.10859`, the same 10.9 % at both ends, where a fixed additive step would have been a 40 000-press crawl at the bottom and invisible at the top. **1/100** because that is `<input type=range>`'s own unset-step resolution and the muscle memory AT users arrive with; **Shift is ×0.25**, inherited from the pointer's fine drag (220/900) and the dispatcher's own `e.shiftKey ? 0.25 : 1`, never re-invented.

**THREE RULINGS INSIDE THAT ONE RULE, each a one-line trap.** **Shift on a stepped knob is IGNORED** — `o.step` quantizes with `Math.round(nv/step)*step`, so a quarter-step lands off the lattice, rounds straight back, and Shift+Arrow becomes a **dead key**; one arrow is one step and Shift changes nothing. **`log` + `step` step in VALUE space** (denorm first, quantize second), because that is what the pointer does: COUNT goes 160 → 170. **A wrap knob does not clamp, at the seam or anywhere** — one ArrowLeft from HUE = 0 lands at 0.99 and the needle has gone the short way round, with `v` folded back into `[lo, hi)` so `aria-valuenow` stays inside `[valuemin, valuemax]`; on a wrap knob **Home and End name the same point**, and that is correct.

**A CONTROL ANNOUNCES ITSELF THROUGH ITS OWN `fmt`.** Not a preference — a correctness matter in this codebase: DRAG γ formats 0 as `off`, FRICTION formats 0 as `∞ · forever`, ELEMENT Z formats 10 as `Z = 10  Ne`. `aria-valuetext` is character-for-character the string the eye reads and `aria-valuenow` keeps the tree numerically honest underneath it; a bare number would lie about all three. `o.unit` stays dead (0 call sites); the units are in the 60 `fmt`s. `o.title`, silently dropped at **ten** call sites, is now written to `root.title`.

**THE HAZARD, AND THE BOOLEAN THAT ANSWERS IT.** `paint()` runs from the frame loop — for the scrub, for every `[data-live]` dial and for every modulated target — and a screen reader announces a **focused** slider's value change. Writing `aria-valuetext` at 60 Hz on a focused control is **a live region built by accident**: a hundred readouts speaking ten times a second. So the value is written when the **user** moved it, or when nobody is sitting on the control, and never in the one case that would speak. `paint(fromUser)`, one argument, both writers. Measured: a focused scrub is **silent** for two seconds of playback and speaks **exactly once** when the user's own arrow moves it.

**THE SINGLE-KEY LAW, checked against the real dispatcher rather than invented beside it.** *A key belongs to the focused control when that control's role would use it; every other key is the app's, including the bare letters and including Space on a slider.* Not "a control swallows everything" (which takes H, N, B and ? away the moment a knob is touched) and not a `{global:true}` flag on 38 actions (annotation to maintain, forgotten on the 39th). One `Set` lookup on **key and role**, sitting **below** the `capturing` block — a KEYS chip is a focused `<button>`, so above it no capture could ever bind Space — and it **returns without `preventDefault()`**, which is the whole point: what runs next is the button's native activation or the slider's own handler. So **Space on MUTE presses MUTE and does not touch the transport**, **Space on a knob still plays**, **ArrowRight on a knob turns the knob**, and **ArrowRight on a switch still steps time**. Modifiers are never owned; Shift is let through, because Shift+Arrow is the fine step.

**THE ONE-WORD DEFECT, found while checking.** `if (a.stage && !stageHasFocus()) return;` should be `continue`: a `return` abandoned the whole ACTIONS loop rather than skipping one action. Harmless only while Tab is the sole `stage: true` binding, and wrong the moment a second one lands.

**WHAT ELSE SHIPPED.** `seg()` becomes a **radiogroup with a roving tab stop** — 38 groups, ~100 radios, **the one place this interface presented state it did not expose**, and the rare accessibility change that makes the app *smaller* (one stop per group instead of a hundred). `aria-checked` is pinned **to the `.on` class**, which is what stops them drifting apart later. `device()` gives its `<h2>` an id and its `<section>` an `aria-labelledby`: **25 named regions**, the real answer to four hundred tab stops for anyone who navigates by landmark, plus `aria-label="power"` on a button whose 90-character `title` was its accessible name. Two **skip links**, and both racks get `tabindex="-1"` — a fragment target, never a stop. The **menubar** becomes an operable disclosure (`#title` gets `role="button"` and Enter/Space; the bar takes focus on open, which is what makes its DOM position irrelevant; `aria-expanded` written in the one function that writes `bar.hidden`; Escape closes and hands focus back). IMPORT's file input leaves `hidden` (which is `display:none !important` — out of the tab order *and* out of the tree) for a visually-hidden class. Names for the five transport buttons, `⧉ COPY`, `◧`, `☆`, the notebook chips, the 91 spectrum lanes and the preset picker.

**THE ONE `inert`, and it is exactly one.** The audit asked for three; the map measured that `.dev.closed`, `.folded .dev-body`, a railed body, `body.ui-hidden` and a hidden rack are **already** out of the tree. Only `.dev.off .dev-body` is `opacity:.38; pointer-events:none` — visible to Tab, dead to the hand. The **focus rescue** is not garnish: the spec sends focus to `<body>` when its ancestor becomes inert, so a user who powered a window off from inside it was silently teleported to the top of the document.

**WHAT THE CANVAS SAYS, AND HOW RARELY.** `#field` gets `role="img"` and a sentence built in `badges.update()` from the state — the populated labels, the observable, the style, the grid, the half-width, the mode count, the norm fraction, the operator, and whether it is playing. It does **not** describe the ray-marched volume: a density isosurface, a phase hue field and a nodal reconstruction are not text at any useful fidelity, and describing the picture would be fabrication. The honest, measured claim: **the instrument's state is fully readable; the rendering is not.** The cadence is the design — the answer to "a description that updates ten times a second is unusable" is a sentence containing nothing that changes on its own, so **the clock appears only when paused**. **The measurement caught one more:** the grid had to become `quality.res` and not `field.resolution`, because the quality governor drops 96³ to 64³ under load and puts it back on pause, entirely by itself, and the sentence rewrote itself twice in three seconds with nobody touching anything. Armed after the play edge: **zero** mutations across three seconds, **exactly one** on pause.

**THE CEILING ON SPEECH, asserted twice so a later wave cannot lift it.** At most **three** live regions in the whole document; there are **two** — `#banner` as `role="alert"` and `.pj-status` as `role="status"`, both changing once per user act. The 107 readouts are **never** live regions: they rewrite on a 10 Hz change-guard and a polite region on one of them queues an utterance per change on a queue that does not drop.

**PROOFS.** Browser: **B121** focus moves and the order is the DOM's (40 presses → 40 distinct seats, `defaultPrevented` false on every one, monotone; Shift+Tab back; the skip links first and visible and landing on `#rack` **with no fragment written**; no positive tabindex anywhere; `#field` and both racks at −1). **B122** the knob in the right units, including *the ratio measured after Home equals the ratio measured after End*, Shift-on-a-step being **+1 and not a dead key**, the wrap seam surviving thirty-two presses, and all 80 sliders announcing through their own `fmt`. **B123** the radiogroup, its roving seat and the **model** moving with it. **B124** the single-key law, all seven clauses. **B125** no trap (60 presses, six surfaces walked, the powered-off window's real Tab, the photosensitivity trap still intact). **B126** the menubar by keyboard end to end, plus the theme by the **second road** (the SETTINGS radiogroup) which is what makes refusing an ARIA menubar defensible. **B127** the canvas sentence, the cadence, the chatter guard and the ceiling. Node: **`tests/access.test.mjs`**, 7 checks in 40 ms on the source, so the three regressions that matter fail in the fast half. `./test.sh`: **node: 0   browser: 0** — **143 judged browser blocks, 0 RED**.

**TWO RIDERS, AND THEY ARE ANTI-PATTERN 17 POINTED AT THE GATE ITSELF.** `tests/wiring.test.mjs` and `tests/render-exact.test.mjs` both existed, both passed, and **neither was in `test.sh`** — a proof nothing invokes is worth exactly what an unregistered service worker is worth. Both are wired now, before the `pwa.test.mjs` block, which stays last. (`lab/render-exact.js` itself is still not wired into the app; that is a later wave, and the wiring gate's allowlist entry for it is deliberate and dated.) 39 → 42 node suites.

**WHAT THE MAP RANKED "POLITE" AND WAS TAKEN BECAUSE IT WAS FREE.** `aria-pressed` in `trig()`'s `on` setter and on SPECTRUM's mute/solo; `aria-expanded` on `.dev-fold`, `#rackAdd`, `#rackFav` and the badges → sheet toggle; `role="group"` on `#floats`; names for the preset and palette `<select>`s (the other four already name themselves through a `title`) and for the 91 spectrum lanes. **REFUSED, with its reason:** `inert` on `#lab` while `#warnPane` is up — **`#warnPane` is a child of `#lab`**, so that would have made the CONTINUE button of the photosensitivity notice inert, which is the one control that must never be. And the `:focus-visible` rule was **not** shipped: the map says ship it only alongside its contrast measurement or leave the UA ring, and the UA ring survives both themes.

**LESSONS.** **The escape, not the character** — a WebDriver key pasted as a literal is a silent empty string, and \uE006 is Return (`code: 'Enter'`) while \uE007 is the **keypad's** (`'NumpadEnter'`): the first draft of B126 pressed the wrong one and opened no menu at all, so the app now takes either and the gate presses the one a hand has. **A test that opens a window before measuring it** (ANTI-PATTERN 3) is the same lesson in a new place: GAMMA lives in a closed SETTINGS card, `.focus()` on a `display:none` element silently does nothing, and two clauses measured a knob nobody was sitting on. And **a cadence claim has to be measured, not reasoned**: the sentence was correct by design and wrong by one term, and only a `MutationObserver` across three seconds of real playback could tell the difference.

### wave 63: W-MODFIX — four defects the third review measured, and in three of the four the fix is that a law finally reaches the case it was written for

**MODE: BEHAVIOUR.** No architectural restructuring, no new window, no new control, no colour. Two constants in a vendored file, one CSS inset, one CSS radius, one registry short-circuit, one argument on an existing function, and four proofs that now cover the case they used to step around.

**SCOPE, AND HALF THE LIST IS DELIBERATELY NOT HERE.** The third review found seven defects. Josh has ruled that the modulation window is to be **ported as an artifact from BASINS**, layout and dimensions copied rather than re-implemented (`STYLE-LOCK.md`, THE PORTED-WINDOW EXCEPTION), and that port replaces the window's DOM and stylesheet wholesale. So **items 1 (the ENV drag that destroys two stages), 2 (the double-tap reset that takes three taps) and 7 (FIT on a GATE envelope, and the stale caption) are LEFT FOR THE PORT WAVE** — building them is work thrown away, and the port must prove they do not survive it. They are recorded, **with their measurements**, at the foot of `docs/ui/STYLE-LOCK.md`'s PORTED-WINDOW EXCEPTION — where the port wave will actually be reading — so they cannot be lost with the job directory that holds the review. **Item 4's B70 extension stayed here**, because the proof must cover a routed dial whatever the window looks like.

**A LINK THREW ITS OWN MATERIAL AWAY, SILENTLY, AND THE CARD SAID OTHERWISE.** `restore()` reached `modSyncBases()` only inside `restoreModulation`, behind `if (pr.modulation !== undefined)` — a key **a link never sets and an undo record deliberately never sets** — while the frame loop's own `modSyncBases()` **skips modulated ids by design**, because per frame the Card of a modulated parameter is showing the *modulator's* output and reading it back would ratchet the base up to wherever the LFO is. A restore is the one instant when that premise is false: `Object.assign` has just put somebody else's numbers straight into `mat`/`obs`, and they are the only copy in the program. Measured before: a link carrying **exposure 6.5** was discarded **16 ms** after it opened, the base stayed the receiver's 1, and pulling the route off later handed back 1. `modSyncBases(true)` includes the modulated ids and runs **first** in `restore()` — before `restoreModulation`'s own `restoreAll()` can write the registry's stale bases back over the file's. `setBase` under modulation moves only the base and leaves `current` to the modulator, which is exactly the law wanted. **B128**: base 6.5 one frame later, 6.5 a second later with the LFO still sweeping on it, the unrouted softness carried as always, the route untouched, and `restoreBase()` handing back 6.5 to the bit. The same line fixes an undo of a camera move on a modulated camera parameter.

**THE RING TOOK FIFTEEN PIXELS OF THE DIAL AND OUR OWN 44-PX PROOF COULD NOT SEE IT.** `.k-ring-hit` owned an annulus and called `stopPropagation`, so a **routed** dial's turn target through its own centre was **33 × 33 px** against a 44-px law — and B70 could not fail it twice over: it opens with `mod.reset()` so no ring exists while it walks, and `own()` climbs `parentElement` while the ring svg is a **child of `.k-dial`**, so ownership answered 61 px where the finger had 33. Worse than the number: **the two gestures share an axis** — the ring's depth drag is `ns-resize` on `(y0 − y)/K` and the dial's turn is `((y0 − y) + (x − x0))/220` — so a finger aiming at a routed dial and landing 20 px high set the modulation depth, not the value, on what still looks like the knob. **The decision was to move the band out rather than bend the law.** The ring box was never 1 : 1 (a 46-unit viewBox in a 44-px box, so every radius drew at 0.957 of what it said and the "8 px" band was 7.65); it is 60 units over 60 px now, and the grab band moved from r ∈ [17, 24] to **r ∈ [24, 32]** — 28 ± 4, and **28 rather than 26.5 because there are two strokes**: `skin.css` widens the band to 11 px under a finger, and 26.5 − 11/2 = 21 put it straight back inside the dial's 44-px core at the one breakpoint where the 44-px law is measured. The inner edge is what the law needs, so the radius is set for the wider stroke and the extra three pixels grow *outward*. Measured with the listener probe the review left written, at the phone breakpoint: **all nine dials 48 × 56 bare → 45 × 45 routed**, band 9–11 px; 47 px on a fine pointer. A press reaches the ring only outside the knob's rim, where `ns-resize` is the only cursor on the screen. `vector-effect: non-scaling-stroke` went on `.k-ring-hit` beside the four paths that already had it, which closes the latent `.k-lg` case the review named.

**AND THE PROOF IS RELATIVE, WHICH IS WHAT CAUGHT THE SECOND CASE.** B70's new pass measures every knobbed dial **twice — bare, then routed — in the same run**, and asserts *a dial that had 44 keeps 44 with a ring on it*. An absolute floor would have been measuring something else: the **20-px RATE dial in the floating transport strip** measures **34 × 42 before any ring exists**, which is a real thing to fix and is not this ring's doing (the ring costs it one pixel there, where wave 61's cost it eleven); it is invisible at the phone breakpoint where B70 runs, because the strip stands down and the transport becomes a card, and there the same dial measures 48 × 56 bare and 45 × 45 routed like every other. **Recorded, not fixed, because it is not this wave's defect.**

**A BIT-EXACTNESS CLAIM WAS PROVED ONLY WHERE IT IS EASY.** B119's *"`current` is `Object.is`-equal to `base`"* at zero depth was **false on five of the eleven** registered targets — every `log` map, by up to **2.2e-16** — and the block gated it on `material.softness`, the one `linear` map among the visible dials. The registry's own correspondence law is stated to 1e-12 and cannot be stronger: a modulated write is a round trip through the normalised currency and log/exp is not exact. **But a modulator whose summed influence is exactly zero has not asked for a round trip — it has asked for the base.** `applyModulatedNorm` now hands back `r.base` **itself** when the normalised position is `Object.is`-equal to the base's own normalised form, which is the zero-influence case and no other; no modulated output moves by it. **11 of 11 exact, both roads** (depth to zero, and the range dragged to `min = max`), and B119 sweeps all eleven instead of asserting one.

**THE VENDORED HEADER LIED IN THE ONE PLACE THE GATE IS BLIND.** `mod.js:7` still said *"Forced 1 edit … Every other byte below this header is the source, unmodified"* with six in the file — and `mir.test.mjs §16` strips **exactly that block** before it diffs, so the one sentence that tells a maintainer how to read the file was the one sentence no proof could see. It is corrected, and **the count is now gated**: §16 reads the number out of the header and fails unless it equals the `λWAVES: forced edit` markers in the body and the entries in its own undo table. Three numbers, one claim (ANTI-PATTERN 6, pointed at a vendored file).

**THE VERSION: BUMPED, AND THEN GIVEN A ROAD IT DID NOT HAVE.** Edits 2/8 and 6/8 changed what a stored route *means* — a rack carrying `bi`, read by a build that lost those markers to an upstream re-take, drops the flag and the base walks from the centre of the swing to its floor, **30 % of scale at the macro's middle**, in silence, on the second open. A version stamp is the only thing such a build already reads, and at `MOD_STATE_V = 4` the change was **version-indistinguishable**. It is **104** — forced edits 7/8 and 8/8, with `MOD_STATE_READS = [3, 4, 104]` — and **104 rather than 5 on purpose**: the λWAVES model-version namespace is `100 + the upstream version this model is derived from`, so ours can never be mistaken for an upstream 5, and an upstream 5 we have never seen is refused rather than half-read. **The bump alone would have been half a fix**, because `mod.js` stamps `modV` on a *preset* record only: the model's own `serialize()` emits no version and `deserialize()` checks none, so a project file and this browser's `localStorage` — the road the lab uses every session — were version-blind. `rack.js` stamps `v` onto the rack it writes (additive, ignored by the model in both directions) and `restoreModulation()` **refuses a stamp it cannot honour**, saying both numbers on the card; an **absent** `v` is not a refusal, because every rack written before this wave has none and means "predates the stamp". `rack.js` is ours, so that guard survives the upstream re-take PORT-NOTES warns about.

**THE FLAKES, MEASURED RATHER THAN ADOPTED.** `MAP-FLAKES`'s principle is that a relative comparison against a baseline taken in the same run beats an absolute constant, and that a judge waiting for a condition should poll for it. **B58**'s `fpsRun > 15` flaked twice in six runs and did no work the ratio beside it was not already doing better — deleted, and the rate is still *printed* so a ratio drifting across waves stays visible; measured in isolation across two runs, **0.562 and 0.612 against a 0.35 floor — 1.61× and 1.75× margin**, against the 1.58× the deleted constant had. **B55**'s `fps > 6` went the same way (its own comment refuted it in the line above); **0.890 in isolation and 1.008 inside the full suite, against a 0.72 floor** — and the pair of numbers is the argument: the box runs the same window at 52.8 fps alone and 19.8 fps in the suite, so an absolute floor is measuring the machine and the ratio is measuring the window. **B30**'s two `frames > 10` guards were a 6.7 fps floor wearing a sample-size hat and are gone, because **the sample is counted now**: `rateN(n)` is one page-side definition in the harness used by all three, counting to *n* frames with a 12 s ceiling and reporting fps from the **measured** wall time, with `short` true when the ceiling ran out first — so a starved run goes red with a reason instead of deciding on a third of the sample. **And the ratio is printed where it can be read**: gatekit prints the first 300 characters of a payload, so B58's `fps` block was past the cut and "we still print it" was not true; it comes second now. **B64**'s recorded race is a poll: `getComputedStyle` of a host that is still `[hidden]` returns `animationName: none`, and the block now waits for `!bm.hidden && __LW.busy.visible` and **judges** that wait.

**PROOFS.** **B128** the link on a routed control (new). **B70** the routed-dial listener walk, at both orientations. **B119** the zero-depth law over all eleven maps. **`mir.test.mjs`** 86 → **87**: the vendored header counts its own edits, and §16 undoes eight rather than six. `./test.sh`: **node: 0   browser: 0** — **144 judged browser blocks, 0 RED**, 42 node suites, `node tests/pwa.test.mjs --write` last (cache name unchanged, which is the check that nothing under `lab/` moved after it).

**WHAT THE FIRST GATE RUN CAUGHT, AND IT IS THE POINT OF RUNNING ONE.** Three RED, and all three the same shape — a number that was only ever right for the old geometry. `skin.css`'s touch override takes the grab band to **11 px** (*"thicker under a finger, and it still never eats the dial's own face"* — true of the 34-px face, false of the 44-px target), which at a 26.5 centre put the inner edge back at 21 and a routed dial at **42 × 41** on the phone: B70 and B71 both red, and the radius went to 28. And **B120 pressed the ring at `kb.top − 4`** — 21 px above the dial's centre, a coordinate that worked only *because* the ring was eating the dial. It is derived from the dial's own centre and the band's radius now, so it moves with the geometry instead of being a fossil of it.

**LESSONS.** **A skip that is right per frame is wrong at a restore** — `modSyncBases`'s modulated-id skip is correct sixty times a second and exactly wrong at the one instant the Card holds a number nobody else has; the bug was not the skip, it was that the exception had only one door and a link never walks through it. **A proof that asks who OWNS a point cannot see who ANSWERS it** — the ring is a child of the dial, so B70's ownership walk was structurally blind to a control eating its parent's finger, and only a probe that instruments the two *listeners* could measure it. **A relative claim finds what an absolute one hides**: measuring each dial bare and routed in the same run caught a 20-px dial with a 34 × 42 finger that no floor would have attributed correctly. And **a gate that strips a block before comparing cannot see that block** — the byte-identity proof was honest and complete about every byte it looked at, and the sentence it skipped had been false for a whole wave.

### wave 64: W-MOUNT — the modulation window arrives as an ARTIFACT, and the only thing this wave designed is the four edges it plugs into

**MODE: MOUNT.** Nothing here was designed. `lab/mir/modwindow/` is BASINS' modulation window — 2019 lines of stylesheet whose 667 declaration blocks are byte-identical to the source's, and a 1474-line builder that emits its DOM and wires nothing — moved into the tree **as-is** (`diff -rq` against the staging directory: identical) under `docs/ui/STYLE-LOCK.md`'s PORTED-WINDOW EXCEPTION. **This is the fourth attempt and the first that did not re-implement.** The three before it converted the window's FUNCTIONS into the house idiom and threw its layout, material and dimensions away — reasonable engineering for a component, the destruction of the artifact for a plug-in. Josh, on why it matters: *"I'm making an EMPIRE of apps and I think it's dumb asfuck to keep remaking and coming up with the same couple of prompts when I could just make one GOOD UI from Basins and move it to all my science apps."*

**WHAT THE PORT COST, AGAINST WHAT THE THREE THAT FAILED COST.** A re-implementation is the whole window: layout, material, every control, and a fresh argument about each. This was **two files of host code and eleven edits elsewhere**. `lab/modhost.css` (178 lines) is the six host items — the tokens the plugin reads and declares nothing of. `lab/modwindow.js` (1868 lines) is behaviour only: it attaches listeners to elements the artifact built and paints numbers into them, and it does not create one styled node. `lab/rack.js` gained nine edits and lost a window; `lab/index.html` gained two `<link>`s. **`lab/modview.js` — 1705 lines — is DELETED**, and the port's host file is not its replacement so much as its behaviour re-aimed: the ring geometry, the router gesture, the curve renderer and the envelope map came across verbatim in substance, and every line that drew a control did not.

**THE ONE THING host-contract.md GOT WRONG ABOUT THIS HOST, AND IT IS THE HOST'S FAULT.** PART 2 says: paste its 67-token block into your `:root`. **λWAVES cannot.** It already declares **47 of those 69 names** on `:root` with its own meanings — `--glass-blur: 18px` against BASINS' 8, a completely different `--glass-shadow`, `--font-num: var(--font-ui)` where the plugin wants a monospace — so the paste would restyle the entire instrument and break the token law. The block is **SCOPED** instead, onto `.mir-modwindow`, `.kwin-chiprail` and `.m2ghost`: nothing in the artifact changes, because where a host's own tokens live is the host's business. **The sixteen geometry names that decide the acceptance table already agree, value for value** — `--ui-scale: 1`, `--touch: 44px`, `--r-sm/md/lg: 5/8/12`, `--sp-1…5: 3/5/7/10/14`, `--fs-lead/small/tiny: 13/10/9`, `--w-bold: 650`, `--tr-wide/wider: .12/.14em` — λWAVES and BASINS chose the same ladder independently, which is why the table measures the same numbers here as on the staging rig. **One glass token takes the HOUSE's answer and not BASINS'**, because the house measured it: `--glass-filter: none` (lab.css:21 — *"the frosted blur cost 26 fps over a live WebGPU canvas (32 → 58 measured)"*), and this plug-in floats over exactly that canvas. It loses nothing: its four surfaces are the `--m2-mat-*` ladder's own alphas, which A1 measures unchanged, and BASINS' value sits beside it commented so the swap is one line. One input the scope cannot reach: the material ladder is declared on `:root` by the plugin's own sheet and resolves `--m2-mat-hue: var(--glass-hue, 212)` there, against the house's locked 214 — a **one-channel** difference on the darkest of the four surfaces (`rgba(10, 12, 15)` where the source reads `rgba(10, 13, 15)`), so the derived name is supplied at `:root` at two-class specificity and A1 reads the source's four values exactly.

**THE ACCEPTANCE TABLE, MEASURED IN THE REAL HOST (B129).** 708 CSS rules parse (44 chrome + 661 flat + 3 `@media`). Material: pane `rgba(31, 35, 41, .68)` · chassis `rgba(42, 48, 55, .712)` · control `rgba(22, 25, 29, .552)` · hero `rgba(10, 13, 15, .777)`. Frame 12 px radius, a 0.6 px hairline the engine reports as 1, `overflow: visible` + `contain: layout`, body padding `5px 10px 9px`, a 62 px chip disc and exactly nine 2 × 2 grip dots. Lane 52 with two boxes in it, preset bar 294, timing bar 450, core and name field 44. Rail 224 · slot 64 · row 62 · grip and numbered seat 44 · numeral 24 · depth ring 34. Card **360 × 368 / 320 / 64 × 368**, radius 16, head 48 by computed height, body 216. Knobs LFO 48 with RATE 56, ENV 42 with A/D/R 48, every arc `rotate(-240 50 50)`, `.m2kends` never painting. Folded strip: meter 11, vertical-rl name, 22-wide shape, numeral 44. The size laws are arithmetic and the built window equals them. **Two rows of the table are base values no FULL card uses and the block measures the card instead** — the ENV `.m2rt` is 90 where the table says 104 (MANIFEST §6 already warned), and the check lamp `.m2dot` is 7 on an LFO and an ENV where the base rule says 9. **The 44 px law**: 135 occurrences of `44px` in the window's own half of the sheet and **137 in the file**, because two of the 44 chrome rules the port brought carry one each; 33 `min-height: 44px`; nine `::before` hit bands; every seat ≥ 44 live and the three small-ink controls at 40, which is the point. **`_build/smoke.mjs` was re-run rather than replaced — 32 of 32 GREEN against the files at `lab/mir/modwindow/`.** **AND THE STRING, PROVED BY BREAKING IT:** the chip rail's material hangs off `aria-label="MODULATION window controls"`, which the selector text matches 27 times across 23 rules. Asserting the label is right proves nothing about the trap, so B129 **sentence-cases it by one byte** and measures the chip's `::before` go `rgba(0, 0, 0, 0)` — no error, no console line — then puts the byte back and measures it return exactly. That is the one failure mode with no visual hint beyond *"the chips look wrong"*.

**THE ONE REAL DECISION: WHICH ROUTING OVERLAYS SURVIVE (B131), AND IT IS A MEASUREMENT.** The artifact's overlays are the only part of its sheet that is not the window — they attach into HOST controls in other windows, which is why the stager left their 39 rules unscoped. **One of the four travels.** `.m2ghost` does: it is `position: fixed` at the pointer, needs no room beside anything, and λWAVES' own `.mod-ghost` is deleted rather than shipped beside it. **`.m2ring` and `.m2clr` do not, and the reason is a number**: both are `left: 100%; margin-left: 3px` with a 44 px `::before` band, which is right in a window with room to the right of its controls and wrong on a 34-px dial in a 62-px cell packed three and four across a 286-px rack row — **built on a real λWAVES dial the ring lands 14 px past the cell's right edge and its band 23 px past, on a neighbouring knob**, and the clear button does the same. On top of the geometry, wave 61's arc says three things a 300° badge cannot: **CENTRE** (Josh's *"center of dial"*, the bipolar route that cost five forced edits in `mod.js`), the overflow **SPUR**, and **360° on a WRAP dial**. `.m2span` goes with them: our arc already draws the excursion on the dial and two bands on one dial is the failure this wave was warned about. **The drop marks split the other way on purpose** — the artifact's WORD is stamped (`data-m2target` on every routable control, so nothing is renamed) and the PAINT is ours, because two outline rules cannot say what a touch screen needs. Every rule named is still in the sheet, and `.m2clr`'s copied-broken transparency is proved on a host control on the way past.

**THE THREE INHERITED DEFECTS DO NOT SURVIVE, AND EACH IS DRIVEN (B130).** (1) The ENV drag latched the point's INDEX while re-reading the map every move, so the instant a drag took `hold` to zero the list shortened and index 2 stopped meaning `hold` — measured, `d` 0.8 s → 0 and the sustain 0.5 → 1, untouched, outside the undo ring. The **KEY** is latched now, and the drag that zeroes `hold` writes `hold` and nothing else: `d`, `s` and `r` come back `Object.is`-identical. (2) The advertised double-tap fired **zero** times, because the arm/disarm branch returned before the tap watcher and the gesture that fired it was a triple. The watcher runs on **every** lift and before anything decides what the press meant: two taps 40 ms apart put value 0.7 → 0 and depth 0.3 → 1, and a pair 460 ms apart still does nothing. (3) FIT framed **0.3565 s of a 0.910 s picture** under GATE, because `envDuration` drops `r` and `envPoints` draws it. FIT frames what is DRAWN, and the caption prints the drawn span — so it is **identical** across a GATE toggle rather than merely refreshed, and `gateMode` is in the render signature anyway. **And the fourth, beside them: the ENV inverse was ABSOLUTE** — pointer `t` × the window minus the earlier stages — which cannot express a stage longer than the window, so a two-pixel twitch on a 6.5 s release inside a 1 s window wrote 0.682 and threw **5.818 s** away. It is RELATIVE now (the stage's seconds and the finger's `t` latched at pointerdown, the stage moved by the difference): the same twitch moves it 0.008 s, exactly the seconds the finger travelled, and it is identical to the absolute inverse wherever the point is not clamped. **AND THE THREE COPIED-BROKEN ITEMS TRAVEL, BY JOSH'S RULING** (*"let's travel as they are and we can fix later"*), with B129 asserting all three are still wrong: `.m2pick` renders transparent, a `.m2clr` on a host control renders transparent for the same reason, and the ◂ ▸ reorder buttons are `display: none` in both modes — built and wired here exactly as BASINS wires them, and driven through their listeners in B117 rather than pretended away.

**WHAT WAS LOST WITH `modview.js`, NAMED RATHER THAN SMUGGLED.** Three λWAVES seats have no place in the ported card and are gone: the **BASE / NOW / RANGE strip** (the three facts are on the DIAL now — the arc is anchored at the base and spans the range, the dial's own value line prints NOW, the depth drag prints the range; B75 asserts all three against the model), the **device RENAME** (the label still travels in the model and prints in the macro's DRIVE line), and the **reframe paragraph**, which is the tempo button's own title now, on the control it describes. The **target `<select>` picker** went with them and nothing was lost: `registry.describe()` is still the catalogue, `LW.mod.picker()` still reads it, and a control registered at runtime is still routable at runtime — B74 proves it end to end.

**WHAT THE PLUGIN GAINED, because the model already had it.** `mod.js` is BASINS' own, so every control the artifact draws had a model behind it that `modview.js` never surfaced: **rack PRESETS** with folders, save, delete and the model's own version refusal; the **dead-send** census and its inspector; **HOLD 1/4 and HOLD 1**; **TAP TEMPO** (wave 60 refused it — *"nobody taps a fractal"* — and the artifact ships the button, so the refusal is reversed rather than left as a dead 44-px seat: BPM is the LOOP CLOCK here and tapping four bars names a loop period); **A/B, COPY and PASTE** on every device; the **F / C / M** presentation tri-state; the **ribbon** form, whose 21 rules and 58-px rail travelled complete and which only BASINS' own caller had stopped reaching. AUDIO is offered and **refused out loud**: the follower is in the model and its capture half was never ported, so the button is disabled with the reason on it.

**THE SKIN SEAT, for the wave after this one.** `lab/modhost.css` is one delimited unit — every value in it is BASINS' shipping number and a host replaces the whole block and changes nothing else. **And one measurement that wave needs**: the plugin's stylesheet carries **170 literal colour values in 91 distinct strings, of which 158 are WHITE AT AN ALPHA** and 12 are black at an alpha — not one is a hue. Its whole relief and ink ladder is *white over a dark ground*, written as literals with no token to turn, so inverting its brightness against a light host is not a matter of replacing the token block. There is exactly **one literal font family** in the sheet and it is on the chip rail (`.crail…crail-chip { font: 700 var(--fs-small)/1 ui-monospace, SFMono-Regular, Menlo, monospace }` — the size reads a token, the family does not); the other 75 font declarations all read `--font-sans` or `--font-num`.

**WHAT THE GATE CAUGHT, AND ONE OF THE THREE WAS A REAL DEFECT.** (1) **A MODE OUTLIVED ITS SOURCE.** `modReset()` recycles source ids, so a presentation mode kept by id and never pruned put a brand-new LFO on the screen FOLDED because something called `s1` was folded last session — measured in the suite, where B129 and B130 both went red on a card that booted at 64 px instead of 360. A stored mode is adopted ONCE now, by the first source to bear the id, and `rebuildDevices` drops the mode of every id the rack no longer has: fold, reset, add — 360 px. (2) **THREE BACKDROP FILTERS APPEARED WHERE THE HOUSE HAS NONE** (B69, which sweeps `#notebook, #rack .dev, .glass` and matched the plug-in's own `.glass` surfaces) — the `--glass-filter` decision above. (3) **THE PLUGIN'S THREE `role="slider"` KINDS WERE NAMELESS** to B122's document-wide sweep. That is host wiring the artifact explicitly asks for — `buildMacroSlot`'s own comment says *"role=slider because that is what it is; the host's registry writes the aria range and value"* — so `.m2kd`, `.m2numseat` and `.m2val` carry label, min, max, now and valuetext, live on every paint, and the sweep's rule generalised from "equals what it prints" to "carries what it prints", because the plugin's in-dial chip holds the magnitude while the reading carries the unit.

**PROOFS.** **B129** the acceptance table and the string trap (new). **B130** the three inherited defects, driven (new). **B131** the overlay split, measured (new). **B74 · B75 · B93 · B115 · B116 · B117 · B118 · B119 · B120** rewritten against the plugin's DOM — the claims are the same and the selectors are the artifact's. **B70**'s prose corrected: the plugin is not walked at the phone breakpoint, deliberately, and its 44-px law is B129's at the size it is built for. `_build/smoke.mjs` re-run against the mounted files, **32/32**. `./test.sh`: **node: 0   browser: 0** — **147 judged browser blocks, 0 RED**, 42 node suites, `node tests/pwa.test.mjs --write` last (119 precache entries, cache name `lw-lab-1rasbnmt7vg9u` re-derived).

**LESSONS.** **A host contract can be right and inapplicable at the same time** — "paste this into your `:root`" is correct for a host with no such names and catastrophic for one with 24 of them, and the fix was not to edit the artifact but to decide where the host's own tokens live. **A silent failure has to be proved by breaking it**: asserting the aria-label is correct says nothing; sentence-casing it and watching the chips go transparent is the proof. **The house's own global `* { box-sizing: border-box }` reaches inside a ported subtree**, and undoing it was tried and REVERTED — it fixed one row of the table and broke five, because the artifact's twenty-two explicit `border-box` declarations are written against a document that is already border-box for everything they do not name. **An inverse that cannot express its own state is a bug waiting for a clamp**: the ENV drag was correct for every stage that fits in the window and threw away 5.8 seconds for the one that does not. And **an id that is recycled is not an identity** — the mode that outlived its source was invisible in isolation and obvious the moment two blocks ran in the same session, which is the whole argument for running the gate rather than the block.

### wave 65: W-MODKEY — one key for two clocks, an arm that is not a pause, and three resume laws that were already drawn on the card

**MODE: BEHAVIOUR.** Josh's spec named its own controls: *"the play/pause button should have a small 'MOD' button that glows on or off… Space bar will affect everything — play and pause for modulation plugin and λWAVES. HOWEVER, inside the modulation window there are already useful buttons to link these behaviours to: ANCH, TRIG, and BPM."* So the wave's whole job was to **wire what exists** and to invent exactly one control. Nothing was added inside the ported window — its timing bar is still `modxport|modtempo|modtempoin|modtap|modsync|modcad|m2hold|m2hold` in install order and carries no button of ours (STYLE-LOCK, THE PORTED-WINDOW EXCEPTION) — and the wave's own containment is the law's: the arm lives on `#transport`, which wave 52 made the modulation window's **minimised mode**, so "modulation's own controls live in the modulation window and its transport pill" is satisfied as written rather than stretched.

**THE MOD ARM IS ONE BUTTON ON TWO FACES, because `#transport` is one element in two placements** — the card `dockTransport()` puts in the rack and the pill on the stage. It measures **44 × 44 docked and 26 × 24 on the pill**: the `.tbtn` seat is kept WHOLE (B70 walks it at the phone breakpoint and a 40 would have failed the 44-px law) and only the INK narrows, to hold a word instead of a dingbat. It glows in **ACCENT B**, resolved live from the page and never a hex, because modulation is a *relationship* and that is the colour it already wears two seats away on the ⤢ lamp and out in the rack on every held dial. **ARMED is the shipped default** and that is deliberate: `anyRouted()` already refuses a transport with nothing routed, so an armed rack behaves exactly as every build before this one did, and the switch is a way to take modulation OFF rather than a gate to be found before it goes on. It is this browser's preference (`modArm`), never a project's, and `m` is a rebindable key on it.

**OFF IS NOT A PAUSE, AND LINE 2 OF THE PAUSE LAW IS THE WHOLE REASON IT CANNOT BE.** *"A hand does not let go because the clock did"* — so with the transport merely stopped, a hand macro at 0.7 is still holding its target 0.7 of the way off the user's number, and only the source-driven ones came back. `clock.setEnabled(false)` therefore sits ABOVE all four lines of the ported `livePos()` and returns the base for **every** target, `Object.is`, hand macros included; it deliberately does not touch `playing`, so the modulation transport keeps its position through a disarm and re-arming picks up the rack the user left. **THE ONE EXEMPTION IS `stepping`, AND IT IS THE RECORDER'S**: `render-exact.js`'s `modulation: 'drive'` pin stops the clock and steps it 1/fps per frame through mir's deterministic door, which applies *as though running*. An arm that reached inside `step()` would have rendered an exact-period take with every modulator flat while every witness the renderer checks — `LW.mod.running` false throughout — still passed. §23b proves 40 steps **byte-identical** armed and disarmed, and that a 120-frame bar still closes to 1e-9 either way.

**ONE PRESS, TWO CLOCKS — and they are still two, which is a law and not a convenience.** Physics time is analytic and SET; modulation time is STEPPED in beats; and `transport.rate` is itself a modulation TARGET, so merging them would let an LFO decide how fast its own modulator runs. B133 measures exactly that in value space: a macro takes the physics clock from 4 to 3000 a.u./s and the modulation beat goes on advancing at the same beats per wall second, **to 1e-9, over two 600 ms laps**. The window's own play button still stops the modulation ALONE (Josh: *"two play heads are considered different"*) and the next space re-joins them.

**THE THREE RESUME LAWS, AND THE ONE THING THAT MADE IT HARD: THE BEAT IS GLOBAL.** `transport` carries one beat accumulator, and under a bar sync mode every synced source's phase IS `frac(beats / beatsPerCycle)` — so "jump back to the note boundary just passed" cannot be done per source. `host.js`'s new `resumeGrid()` is a PURE read of the rack that says which chip claims the edge. **Two of the three were already built** and this file only had to stop standing in their way: **ANCH** is `modPlayEdge`'s middle branch plus the re-anchor, so the beat is continuous and the curve resumes exactly where the pause caught it; **TRIG** is its first branch. **BPM** is the one that is new — the beat floored to the **coarsest live note**, which is the only grid on which every faster note also has a boundary. **ANCH outranks it** (a rack with one anchored source has asked for a continuous beat, and a quantised beat is not one). **TRIG on a SYNCED source claims the grid at its own note**, because there the beat owns the phase and a rewind the next frame overwrites is a control that changes nothing — and the note boundary is where *"start over"* and *"the truncated note"* turn out to be the same number. **And Josh's own parenthesis, "BPM has WALL/FREE", is one behaviour reached two ways**: under FREE a synced source accumulates its own phase, the beat is not its position, and `modPlayEdge` already floors it — so the beat is left alone there.

**FOUND WHILE BUILDING IT, AND FIXED: THE FIRST PAINT AFTER A RESUME WAS A LIE.** `modPlayEdge` rewinds every un-anchored source to a transient phase 0 that the next frame overwrites from the beat — so the resume's own `applyAll(true)` pushed that 0 onto every routed control and the frame after it corrected them: one frame of a number nobody asked for, on every dial the rack holds. `placeOnResume()` runs a `dt = 0` EDIT (the model's own word for "no time passed, re-read everything") before anything is applied.

**AND THE PILL WAS ALREADY OVER ITS WIDTH BUDGET, which only adding a seat revealed.** At 520 px the eleven fixed items and their gaps wanted 542, so `play` was rendering at **20.3 px of its 26** and each step button at **18.9 of its 24** — every one of them silently flex-shrunk, on the shipped default, since wave 52. Four measured numbers close it: the pill takes lab.css's **own 560** in skin.css (where a 520 had been contradicting it), MOD is 26 in the pill, the `t` readout gives up 8 px and REPEATS takes 12 — and each is measured against the LONGEST string its readout can hold (`fmtPeriod`'s worst, "≈ 123456 a.u. · 2.987 ps", is 106.5 px, which the old 132 cleared and a naive trim would have clipped). The row now wants 556 in 560 and the SCRUB absorbs the rest; nothing in it is shrunk.

**THE LOOP CLOCK'S GLOBAL GRID IS THE INSTRUMENT'S OWN.** Josh's BPM sentence says the divisors line up with *"an existing global clock"*, so `g` locks it: `barTempo({T, rate})` over `period.js`'s exact recurrence makes **one bar one repeat of the density** — 57.30 BPM for 1s+2p at rate 4, a bar and a recurrence the same 4.18875 s to 1e-9 — and it never guesses: under a static field there is no exact period, so it refuses by name, keeps the tempo it had, and prints the reason on the window's own line. It is a **key** rather than a control because the artifact's timing bar is not ours to grow, and the key sheet is the visible seat.

**PROOFS.** **B132** the arm, its two faces and the base restore (new). **B133** one key, two clocks, and the rate target that forbids the merge (new). **B134** the three laws, driven by the REAL Space key with the curve's phase measured on both sides, plus the bar lock (new). `mir.test.mjs` **§23**, eleven node gates on the arm, the recorder's exemption, the three laws and the grid's purity — 98 of 98. **Two pre-existing blocks changed because their expectation is what this wave changed**: B74's pill is 560 × 32 with twelve seats, and B82 counts 40 rebindable actions and moved its own rebind fixture from G and M to I and O, because aiming a rebind at a key that is now BOUND tests a collision rather than a rebind. **B126**'s five transport buttons are six. `./test.sh`: **node: 0   browser: 0** — **150 judged browser blocks**, 42 node suites, `node tests/pwa.test.mjs --write` last.

**LESSONS.** **A control that is "not a pause" has to be built above the pause law, not beside it** — the arm looked like `pause()` for an hour, and the hand macro is the one measurement that shows it is not. **A deterministic door must be exempt from every switch a user can flip**, and the way to know is to name the caller: `render-exact.js` stops the clock and then steps it, so "stopped" and "off" cannot be the same state. **When one number is global, the laws over it have to be RANKED and the ranking has to be written down** — ANCH over the grid is a real decision and a rack with both chips would otherwise have been a coin toss. **A wave that adds one seat should measure the row it joins**: the pill had been shrinking every button in it for thirteen waves and nothing said so, because a flex row that overflows does not complain. And **a fixture that rebinds onto a key is choosing a free one** — B82 picked G and M when they were free, and a wave that binds them turns that fixture from a rebind test into a collision test without failing.

### wave 66: W-GLASS — the MIR plugin puts on our glass, and the finding is that the glass was already built and switched off

**MODE: MATERIAL.** Josh: *"let's also use our glass man 😭 remove the old tints and try to make it purely glass and pretty textures"*, plus our fonts and buttons that invert against the host brightness. This is the ported window, so `docs/ui/STYLE-LOCK.md`'s PORTED-WINDOW EXCEPTION governs it and the wave may not move one pixel: **B129's whole acceptance table passes unmoved**, `lab/mir/modwindow/` is byte-for-byte the five files wave 64 mounted (sha256 unchanged, and B135 re-reads modwindow.css at 129 441 characters and modwindow.js at 63 798 off the wire), and the ONE file this wave wrote is the `⟪ SKIN SEAT ⟫` in `lab/modhost.css`, which the sheet's own header says a host replaces wholesale. **Zero forced edits.**

**THE FINDING IS THE WHOLE WAVE: THE GLASS WAS ALREADY BUILT AND SWITCHED OFF; THE TINT WAS WHAT WAS SWITCHED ON.** The pane's 67.7 % was never a tint — solved against the plugin's own plate colour over a worst-case WHITE field (the light stage really does approach one), `#fff` body ink needs **α ≥ 0.619** for 4.5 : 1, so *"make it more transparent"*, read literally, is refused by a measurement. What made it a grey box was the **four more semi-opaque grey plates stacked inside it** — chassis .712, control .552, recess-deep .777, status .742 — so the live field was **32 % visible at the window edge, 9.3 % in a device, 4.2 % in a control and 0.5 % in the status capsule**. Depth was being paid for in opacity.

**ONE TINT, FIVE DEPTHS, AND THE DEPTHS ARE MADE OF LIGHT.** The pane goes **denser** (.677 → **.80**) while everything inside it becomes a **shade** — pure black at an alpha, subtractive, so the field's hue and structure come through where a grey plate killed both — plus a hairline edge and an inner top light. Measured in the built window, both themes: all six depths below the pane are `rgb(0, 0, 0)` at an alpha, and the field is **20 % visible at the edge, 18 % in a device, 16.9 % in a control** on dark (14.8 % on light) against **4.16 %** before, while the worst-case white-ink contrast **rises** on every tier because the one surface carrying the contract got stronger. The five-tier opacity spread collapses from 32 points to 12. `--m2-mat-inner`, the faintest value in the artifact and the one doing the most work, nearly doubles (.069 → .11), and `--ink-shadow` gains a third term, which is the cheap 80 % of the artifact's 52-rung ink problem in one token.

**THE TEXTURE IS THE EIGHT `--gl-*` TOKENS THE ARTIFACT DECLARES AND SHIPPED INERT.** BASINS' `glasslight.js` probes the picture behind each surface and writes them inline; we have no probe, so they were `transparent` and both the four-colour Fresnel rim and the two-stop vertical wash were wired up and painting nothing. Static values cost **one raster and nothing per frame** and are the highest-value thing in the sheet: four one-sided 1.04 px inner edges with the top brightest and **the bottom lip dark rather than white** — that asymmetry is what makes a surface read as a material — a 14 px outer spill of Accent B, and a wash that says the light behind this surface is not uniform. `backdrop-filter` stays off and the reason is structural rather than a tuning problem: it re-captures its backdrop into a texture whenever the backdrop changes, and ours is a 60 fps WebGPU canvas (`lab.css:21`, −26 fps measured), which is also why our tint is .80 where every glassmorphism source says .08–.25 — they all assume a static background.

**THE WASH WAS FOUND DEAD BY MEASURING IT, AND THAT IS A HOST DEFECT THE PORT INHERITED.** `body[data-card="refractive"] .glass { background: transparent }` (`skin.css:279`) is (0,2,1); the artifact's own `.glass` recipe is (0,2,0). So **the house was winning on every `.glass` surface inside the plugin** and, being the `background` SHORTHAND, taking the background-IMAGE down with the colour. `#modwin` kept its pane only because the officiation rule sets the COLOUR longhand at (1,4,0); **the two floating chooser sheets, `.m2ppick` and `.m2deadpick`, had been painting fully transparent since the port**. Reach-list item 15 restores the artifact's own recipe above the card switch.

**THE INVERSION IS ONE TOKEN, and it is Josh's ruling: dark-on-light only.** `--m2-mat-control` and `--glass-raise` go **.06 → .16** on the light host — 2.7× the shade of their own chassis — so a button is unmistakably a **dark button**, darker than the device it sits in, which is darker again than the pale stage. On dark the rim and the density carry it, and they carry it further than a polarity would: on a stage where every house window is literally `background: transparent`, **the one opaque, lit-rimmed slab is the device**. No accent-B chip fills (the artifact's own law is *"selection is an underline, never a filled accent chip"*, and Accent B says only live modulation) and no full ink inversion (~50 forced edits against a vendored law that says spend a forced edit on a capability, never on a nicety).

**WHERE THE LADDER IS DECLARED, and it is not where the research map put it.** The obvious lever is re-pointing the twenty `--m2-mat-*` at `:root:root`, which is what wave 64 did for the one input it could reach. **Measured, that lever loses the light theme**: λWAVES carries its theme on `body`, so `body[data-theme="light"] :root:root` matches nothing — `:root` is `<html>` and can never be a descendant of `<body>` — and a light override written on `.mir-modwindow` cannot reach a `--m2-mat-pane` already substituted up at the root. The whole ladder is therefore declared in the seat's own three-selector scope, where every token substitutes on the element that declares it; all 24 consuming rules in the artifact match inside one of the three. Three names are **deliberately not** declared there — `--m2-plate`, `--m2-recess`, `--m2-recess-deep` are `.m2root`-local aliases, and two of the port's three COPIED DEFECTS exist precisely because `.m2pick` and a host `.m2clr` sit outside `.m2root`; declaring them would have silently "fixed" a defect Josh ruled travels as-is.

**`:root.fr-light` WAS TRIED AND DROPPED, because supplying the derived names makes it inert by construction** — its two rules move only the `--m2-mat-*-lum` and `-alpha` INPUTS, so all four surfaces read identically with the class on and off (B135 §6 drives it). The disagreement about whether it was worth 3.59 : 1 over our light stage is moot: the light theme now has a host-owned seat instead.

**OUR FONTS REACH IT.** `--font-sans` and `--font-num` both point at the house face (`lab.css:8` already says the house numeral face IS the house UI face), tabular figures are on for the whole window, and the sheet's **one literal font family**, on the chip rail, is item 14 of the reach list. Type SIZES are untouched, because a type scale is geometry: the swap moves exactly **two label-sized boxes and neither is a table row** — `.m2hold` 55.9 → 53.2 px against its stated min-width of 46, and `.modtempo` 110.9 → 98.6 px at its stated height of 22.

**THE REACH LIST IS FIFTEEN, NAMED AND COUNTED IN THE FILE** so a later wave can see whether it grew, and it is the only place this sheet paints inside the plugin. Two things are deliberately NOT in it: `.kctl.ctl-frozen` already ships a 135° hatch at a **6 px pitch**, which is what the design asked for and is chosen so it cannot beat with the field's 8 px Bayer dither lattice; and the **eight signal literals** — the track, the value fill, the meters, the lamps, the progress bars and the audio LEDs — are readouts, and restyling a meter is restyling the data. One free repair fell out: `--m2-signal-glow` was substituted at `:root`, where `--hue-acc2` is not declared, so it had been frozen on the 288 fallback; declared in the seat it follows the palette wheel like everything else.

**PROOFS.** **B135** (new): the ladder in both themes with its composited field percentages; the no-new-plate walk over every element and every `::before`/`::after` in the window, which finds the two chooser sheets wearing the pane and `.m2vedge`, the 7 px white value handle, and nothing else; the bevel's five insets, four one-sided edges and 14 px spill; the two-stop wash; the inversion; the accent wheel turned 137° with `--acc`, `--acc2`, the outer spill and the signal glow all following and coming back; `fr-light` inert; and the artifact re-read off the wire. **B129's §A1 changed and only §A1**, because those four material colours are exactly what the wave was asked to change — the pane is `rgba(29, 33, 38, .80)` on dark and every geometry row of the acceptance table is untouched; the block now states its theme, because wave 66 gave the plugin one it did not have. `./test.sh`: **node: 0   browser: 0** — **151 judged browser blocks**, 42 node suites, `node tests/pwa.test.mjs --write` last. The appearance is deliberately **not** gated: it is screenshotted in both themes over a running field and Josh looks at it.

**LESSONS.** **When a brief says "more transparent", solve the contrast before you thin anything** — the one surface Josh was pointing at was the only one that could not move, and the four behind it were free. **Depth is not opacity**: a shade plus an edge plus an inner light says the same four levels for zero field, and a black scrim is subtractive where a grey plate is destructive. **A token that ships `transparent` is not a token that does nothing** — eight of them were wired into a box-shadow and a background-image and had been painting air since the port, and giving them values was the cheapest thing in the wave. **Substitution happens where a property is DECLARED, and that decides your theming**: the research map's own §1.3 warned it and its own §4.2 was bitten by it, and the tell was a selector that cannot match. And **measure the host reaching into the guest** — the wash looked wrong for twenty minutes before `getComputedStyle` said `background-image: none`, and the answer was a house rule two files away with one more attribute in it.

### wave 67: W-FROST — the disconnected window, a vividness with its price on the label, and a drag that writes once a frame

**MODE: MATERIAL + MOTION.** Josh: *"The behaviour is so bad on the existing windows, can you make it like the webm where the window is disconnected? … look up 'Frost', 'Light mode', and 'Lite Glass'."* **The reframe is the wave: "DISCONNECTED" IS BASINS' OWN WORD FOR THE FROST SKIN, NOT FOR DRAG MECHANICS** — their DESIGN.md law 3 quotes him verbatim, *"I love that disconnected look, it allows for more of the background to show"* — so the main job is a LOOK, and the drag defect found beside it is a separate, smaller wave inside this one.

**THE CONSTELLATION, REBUILT AGAINST OUR OWN DOM AND PROVED BY GEOMETRY.** Under `body.disconnected` (SETTINGS · DISCONNECTED, **default ON** — he asked for it twice, and the switch is the way back rather than the way in) a window stops being one slab: the mapping is one-to-one, their `.kwin` is our `.dev`, their `.kwin-bar`/`.fr-chip` is our `.dev-head`, their `.fr-card` is our `.dev-body`. **The rows do NOT become cards** — a card per row is the "stacking" BASINS' own adversarial review filed as flaw #1, and our `.grp` hairlines already say what they say. Numbers: gap **7 px** (their `--fr-sep`, and ours is `--sp-3`, the same 7), radius **12 px** (the card's 14 taken one rung down, on their reasoning that the cards are the visible surface now and the window is not), against **10 px** between windows — the gap inside a window is SMALLER than the gap between them, which is what makes a chip and its body read as one object with air in it rather than as two neighbours.

**FOUR DECLARATIONS ON THE ROOT AND EVERY ONE IS A BUG SOMEBODY ALREADY FOUND.** `visibility: hidden` with `> * { visible }` (the box still lays out, drags and clamps, and paints nothing — `display` and `opacity` cannot do that); `contain: layout` where the joined card runs `layout paint`, plus `isolation: auto`, because a paint root or an isolated group between a card and the canvas leaves the card's own backdrop-filter nothing to blur — **releasing it is what lets FROST reach the constellation at all**; `border-radius: 0`, since a rounded ancestor clip is a known WebKit killer of a descendant's backdrop-filter; and `pointer-events: none` with the children `auto`, **so the gap is a real hole**. `.dev` also drops its own `backdrop-filter` for the same reason as the containment.

**THE HOLE IS REAL ON THE LAYER WHERE A HOLE MEANS SOMETHING, AND THE FINDING IS SPECIFICITY.** The rule has to name `#floats > .dev`, `#rack > .dev` and `#rackL > .dev` explicitly: `#floats > .dev { pointer-events: auto }` and `#rack > *` are ID rules a class-only selector loses to however many classes it stacks, and the first build read back `auto` on a rack card — the hole silently was not one. On the float layer the fall-through reaches the canvas (`#floats` is already pointer-transparent): B136 dispatches a real `pointerdown` in the 7-px slot, the field takes it, the yaw moves and the window under it does not shift a pixel. In a RACK the fall-through reaches the rack, which is a scroll container the finger still needs and which does nothing with the press — deliberate, and stated. **Four things the hidden root used to paint moved outward onto the two surfaces, three of them found by arithmetic on the cascade**: `.dev > *` at (0,3,1) outranks `.dev.off .dev-body` (0,3,0) and `.dev.dragging *` (0,2,0), so a powered-off body would have taken the pointer back and a carried window would have caught presses inside it; the TAB-cycle outline and the drag lift moved too, and read better for it — the whole constellation lights, which is what "this window" means when there is no slab.

**ONE OF BASINS' LAWS WE DO NOT NEED, AND ONE WE DO.** They DELETE the outer drop shadow in FROST because `.kwin` is `overflow: hidden` + `contain: layout paint` and slices it flat; we released paint above and have no overflow clip, so our two surfaces keep the house shadow and read as objects rather than outlines. The one we take whole is the **automatic fuse below `FR_COMPACT_W`**: the phone is `:not(.phone)`-fused, because a constellation needs air and 390 px has none — and `body.phone` is raised from the `--phone` sentinel skin.css declares once, so it is still one breakpoint read back, not a second copy of the query.

**THE VIVIDNESS IS THREE THINGS AND TWO OF THEM WERE ALREADY OURS, OVER-DELIVERED.** (1) THE FILTER was the whole gap: `--frost-filter: blur(var(--glass-blur)) saturate(188%) brightness(108%)`, BASINS' numbers exactly, against our `saturate(115%)`. The RADIUS stays **ours** — the GLASS BLUR knob's 18 px, not their 8 — on their own reasoning that `--fr-blur` is an alias of the Blur row so retuning the frost retunes it everywhere, and because blur(18px) and blur(8px) measured identical once the capture is paid for. (2) A THIN PLATE: theirs is 0.46 of a dark slate with the tint's own saturation halved to 12 %, *"so what comes through the frost is the PICTURE'S colour rather than the panel's opinion of it"* — **ours is a 10 % veil of pure white or pure black, a tint saturation of ZERO. The panel has no opinion at all.** Nothing to take away. (3) FROST + LIGHT swapping the dark plate for a 5 % white veil — ours is white at 10 % in the light theme already, the same move one step heavier, and the step is worth more to the ink than to the picture. Left alone.

**THE COST IS MEASURED, AND IT DECIDES THE DESIGN.** 360 rAF intervals per arm over a live field, 1400 × 900, grid 96³, governor off, AUTO SCALE pinned, paint verified by screenshot hash: **none 17.10 ms / 58.5 fps · `saturate(1.8)` alone 50.32 · `blur(8px)` 50.30 · the full BASINS recipe 50.30**. Identical — **the cost is the backdrop CAPTURE, not the kernel** (a 100 × 100 px overlay already buys the whole +33 ms), so there is no cheap half and the saturate-is-free hypothesis is refuted on our own rig. **But with the field PAUSED every arm reads 17.10 ms: free.** So the only lever that exists is WHEN, and FROST becomes a policy with three seats — **OFF · STILL · ALWAYS**.

**THE DEFAULT IS OFF, and it is a ruling rather than timidity.** The capture is paid for ANY canvas that changes, so a camera orbit or a knob drag over a paused field costs the same 33 ms as playback — a default of STILL would either take a third of the frame rate off a gesture Josh performs a hundred times a day, or twitch the material under his hand every time he touched it, and he has ruled against both. It is one press away, the seg's own titles carry the numbers, and there are screenshots. **STILL is the seat to point him at.**

**AND THE ECONOMY CAN NEVER BECOME THE BUG HE FILED, because the class is SPLIT.** `body.frost` is the MATERIAL and belongs to the policy; `body.frost-hold` is the MOMENT and may take the FILTER off and nothing else. B139 reads the fill, the border, the shadow and the radius of both surfaces either side of a play/pause under STILL and they are byte-identical — which is BASINS' Appearance Contract (*"`glass-live` MAY ECONOMISE THE BACKDROP BLUR. IT MAY NOT CHANGE THE APPEARANCE"*) kept rather than quoted. **The governor's own FROST lever is GONE**: wave 45 had it strip `body.frost` under load, which took the fill with the filter and is exactly the grey Josh reported — *"It returns to grey whenever I tap the screen"* — and the grid notch it still has changes no appearance at all. `frostSync()` rides the LOOP and not the play button, because there are seven ways to start this transport and a policy wired to one of them is wrong six times. The phone fuse is now UNCONDITIONAL with a restore on the way out: it used to be `if nothing stored`, which stopped protecting anything the moment the policy began persisting a value.

**THE DRAG WRITES ONCE A FRAME AND FORCES NO LAYOUT IN A POINTER HANDLER.** Both window drags did their whole job synchronously inside `pointermove`: the float wrote `style.left/top` after `getBoundingClientRect()` on BOTH racks, and the rack reorder measured every other card and then `insertBefore`d — several forced style recalculations per DISPLAYED frame, each thrown away, plus a DOM mutation per event. The mechanism is BASINS' `dragHandle` taken as a **REFERENCE** (their 4 727-line window kit is not an artifact we want for a 20-line write path): a move stores a delta and schedules, one rAF does the geometry, and a **32 ms `setTimeout` floor** flushes anyway when rAF is starved — which is precisely what a busy WebGPU canvas does to rAF. The rack rects are hoisted to the press and to `resize`, since a rack column does not move while a window is carried over it. **MEASURED (B137, by patching `Element.prototype.getBoundingClientRect` and counting): 40 synchronous moves force ZERO layout reads and write nothing at all** (they used to force 40+ and write 40 times); one frame later the window has moved exactly once; and five more moves plus the `pointerup` in a single task land it on the last pointer position to within a pixel, which only `flush()` can have done. `lostpointercapture` is deliberately NOT added: our listeners are on `window`, so the stuck-drag hazard BASINS handles does not exist here.

**AND THE PICK-UP STOPS BREAKING OUR OWN LAW.** `MOTION-LAW.md` gate 1 files window drag under 100+/day ⇒ **no animation**; `.dev` carried `box-shadow`, `transform` AND `opacity` at `--t-soft` (.35 s), so picking a window up started a 350-ms cross-fade at the moment the compositor was trying to follow a finger — over the law's own 300-ms ceiling, on the one class the law says may not animate. It was also a live landmine, since `transform` in that list means the day positioning moves to transform the drag becomes 350 ms lagged. Now: `box-shadow` only, at `--t-fast`, and `.dev.dragging { transition: none }` — **0 s in the hand, 120 ms on release.**

**`:root.fr-light` WAS TRIED AND DROPPED, settled by a picture in one minute rather than a measurement campaign:** with the modulation window open, the screenshots with the class on and off are **byte-identical — diff bbox `None`, max channel difference 0** — because wave 66 supplies the derived `--m2-mat-*` names and `fr-light`'s two rules only move the inputs. It stays inert, B135's `frLight.inert` arm stays green, and the light treatment comes from our own theme.

**PROOFS.** **B136** the constellation: the four root declarations, the 7/12/10 geometry with four edges that line up, JOINED still one slab, the hit-test walk, and a real press in the gap that reaches the canvas and moves no card. **B137** the drag: the forced-layout count, the coalescing, and the flush on the end. **B138** the pick-up against the motion law, read off the computed style. **B139** the policy: the recipe, ALWAYS through playback, STILL dropping and returning, the material byte-identical either side, `.dev` never a backdrop root, and no `frost` left in the governor's state. Two pre-existing probes MOVED and nothing else — the FROST arms of the theme and notebook blocks now read the surface the skin paints, because "the pane is on `.dev`" is exactly the expectation this wave changes. `./test.sh`: **node: 0   browser: 0** — 155 judged browser blocks, 42 node suites, `node tests/pwa.test.mjs --write` last. **The appearance is deliberately NOT gated**: four screenshots, both themes × FROST off and ALWAYS, plus joined-vs-disconnected, and Josh looks at them.

**LESSONS.** **Read the user's word in the source it came from** — "disconnected" cost a whole wave's aim until BASINS' own charter turned out to quote him defining it as the SKIN. **A hidden root paints nothing, including the things you forgot it was painting**: the outline, the lift, and two `pointer-events` rules the new selector silently outranked — the cascade arithmetic found all four and the eye would have found one. **When a measurement refutes the cheap arm, the design becomes a policy, not a tuning**: there was no filter to buy less of, only a moment to spend it in. **Split the class before you economise** — the difference between BASINS' bug and BASINS' feature is entirely whether the fill moves with the filter. And **count the forced layouts rather than describing them**: patching `getBoundingClientRect` turned "this feels bad" into 40 → 0 in one line of instrument.

### wave 68: W-KEYFIX + W-DEPLOY — a stale number is worse than silence, and a rule enforced by a coincidence of the address is not a rule

**MODE: BEHAVIOUR.** Two independent fix lists in one wave because they touch different halves of the tree and both stood between this lab and shipping. Seven keyboard defects the fourth review measured with real driver presses; eight deploy findings, one of them a blocker.

**THE WORST ONE WAS NOT THE ONE THAT MADE A NOISE.** Wave 62's headline holds and is re-measured here: a live LFO on the dial under the user's own finger makes **0** aria mutations across three seconds while the eye moves through 30+ strings. What that silence LEFT in the tree was the string from the moment focus arrived — **ear 1.00 · eye 9.33 · model 10.27**, wrong by 9.3× for exactly the user the attribute exists for, and the user's own arrow announced 10.80 while the instrument was at 12.00. A screen reader reads `aria-valuetext` **on demand**, so "nothing is spoken" and "what is there is true" are two promises and only the first was kept. **THE LAW: a control the app is DRIVING under a focused user announces THE BASE — the number the user's own hand owns — and says the word** (`1.00 · base · modulated`). It cannot go stale, because the base moves only when the user moves it, so the mutation count stays at 0; and it is never a claim about the moving value. One wire, `knob().setBase(fn)`, handed to the eleven modulation targets by the loop that already stamps them — and it is honest by construction rather than by care, because on a routed parameter the hand's write **is** `setBase` (`modHand`), so the arrow's own announcement and the frame loop's agree. **B140 gates the ear, the eye and the model together**, which is what B127 could not see: it counted mutations and never asked what the number was.

**FOUR MORE KEYBOARD DEFECTS, EACH A LAW THAT WAS TRUE IN ONE PLACE AND FALSE IN ANOTHER.** *Space on the logo* ran two handlers — `#title` is the one `<div role="button">` wave 62 created and the guard's selector named the TAG `button`, so one press opened the menu **and started the clock** (t 0 → 1.863 s). The guard reads roles now, and the ACTIONS loop honours `e.defaultPrevented` as the net under it. *The Tab trap came back*: wave 62's `continue` is correct and stays, but it let a later action reached by the same key claim it, so two clicks in the shipped KEYS panel (bind NOTES to Tab) rebuilt wave 57's trap and persisted it to storage. **Wave 57's rule was never a property of those two actions — it is a property of THE KEY**, and it now sits above the loop where no binding can get underneath it; the panel also refuses the binding and says why. *A slider that will not act swallowed the keys*: with KEEP FRAMES off — the shipped default — the scrub is `aria-disabled` and its own keydown returns, and the role-keyed guard had already taken ArrowRight, ArrowUp and Home from the app, so three presses reached **nobody**. A dead control owns nothing now, `setDisabled` writes `aria-disabled` (it wrote a class and a tabIndex, so three knobs mounted as operable sliders holding a live value), and disabling a knob under a focused user moves the seat instead of leaving them in a dead zone. *`Z (ion)`* was the one rounding dial with no `step`, so an arrow moved a **twentieth of an integer** and published Z values the register cannot hold: `step: 1`.

**AND TWO LAWS THAT NEEDED ONE IMPLEMENTATION INSTEAD OF TWO.** The wrap fold lived in the keydown handler alone, so `kit.js`'s own sentence — *"`v` is folded back into [lo, hi) so `aria-valuenow` stays inside [valuemin, valuemax]"* — was true of the keyboard and false of the hand: one mouse drag on ACCENT A left `aria-valuenow="654.5"` against a declared max of 360. `settle()` is the one quantiser, fold and clamp and **both roads take it** (ANTI-PATTERN 20). **`End` is ruled**: it used to be `Home`, so a dial published an `aria-valuemax` it could never announce — on a circle `hi` and `lo` are the same POINT and two different NUMBERS, so End reaches 360° unfolded, Home reaches 0°, and both are the seam. The roving tab stop was seated on `on` while `onKey` filtered on `disabled` — **IN P3 shipped on Firefox with zero reachable seats** — and the half that mattered was not the predicate but the RE-SEAT: all three call sites disable an option *after* `seg()` has painted, so a MutationObserver on `disabled` keeps the law without asking the callers for discipline. `kit.js:12–13`'s RATE ratio is **×1.1085907**, twice; it read ×1.1053, which is e^0.1.

**THE DEPLOY BLOCKER IS THE SAME SHAPE AS THE 307 TRAP, AND IT WAS INVISIBLE FOR THE SAME REASON.** `sw.js` §5 refused everything above the mount with `startsWith(SCOPE)`. At `/lab/` that did the work; at the origin root `SCOPE === '/'` and **`startsWith('/')` refuses nothing**, so from the second launch onward every navigation on the hostname was answered from the precache with the lab's own `index.html` — the nine `target="_blank"` licence links in ABOUT each opening a second copy of λWAVES, which is an Apache-2.0 §4 and OFL §2 **reachability** failure and not a cosmetic one, and `not_found_handling: "404-page"` defeated for every controlled visitor. **The policy was already right in the file's own prose; only the mechanism became a no-op.** The rule is on the path now: a navigation is answered only when it names the app entry (`SCOPE` or `SCOPE + index.html`), and the app has no path routing at all — state travels in the fragment — so nothing is lost and the real 404 comes back. **The half that closes the class is the test**: `pwa.test.mjs` hard-coded `origin + '/lab/sw.js'`, so forty-one asserts could only ever prove the worker correct at the mount production does not use, and it named this exact hazard as a case. `loadWorker(mount)` takes the mount and the whole fetch matrix runs at **both** — 13 refusals and 2 entry navigations at each — so a refusal that stops refusing is a red gate rather than a comment.

**AND THE SEVEN SMALLER ONES, EACH DECIDED RATHER THAN NOTED.** `og:image` still named the abandoned `/joshs-library/lambdawaves/` path and **two comments claimed a §V3 build check that did not exist** (`grep -c "og:" tools/build-deploy.mjs` → 0): the URL is the custom domain, `DEPLOY_ORIGIN` is the constant, and §V3 checks it — a claim like that only stays true if something runs. `.wrangler/` is gitignored (step 6 creates it, step 8 is `git add -A`, and the document reassured you about the two directories that were already there). `"workers_dev": false`, because a staging origin is a second permanent root-scoped worker, a second `localStorage` and a second installed PWA identity on an address you stop using — the `OWN_ORIGIN` argument one level up — and V6 notes it either way. DEPLOY.md: the opener is **three commands** and the third is the gate; the rollback section gains the check you can run at midnight (the ETag, the version id, the precache hashes) and the half it omitted — **rolling back the edge does not reach installed clients**, because the One Law keeps them on the build they took until they accept a new one; the payload figures now defer to the tool that prints the truth on every run; and "those three links were deliberately removed by wave 55" was wrong about two of the three — they were made **relative**, which is precisely why blocker A broke them. Five shipped `lab/mir/` files leaked `/home/joshua-hosain/…`; the provenance is unchanged and the diff command takes `$MB` from the environment.

**THE XSS IS THIS WAVE'S, and the decision is worth stating.** The notebook's sanitiser was two regexes over a string and **7 of 8 payloads went through** — unquoted, single-quoted, newline-separated, `<svg onload>`, an unclosed `<script>`, `javascript:` in an `<iframe>` and in an `<a>`. It is reachable through `projects.importText`, which is dossier §27 in as many words; it is **not** link-borne (`statelink.js` does not carry notebook text), which caps it at "a project file somebody chose to import" and is worth saying so nobody later assumes the state link is a safe carrier for prose. It is closed here rather than named as a follow-up because the alpha is one where people trade project files and the fix is a seam that already existed: marked's output parses into an **inert `<template>`** (an `<img>` there never loads, a `<script>` there never runs) and is walked against an allowlist of tags and per-tag attributes, `href`/`src` scheme-checked after control characters are stripped — so a handler nobody has thought of yet is refused **by construction**. The KaTeX substitution stays after the walk, because that output is ours and is full of `<span style>`; its placeholders moved off U+0000, which the HTML tokenizer turns into U+FFFD.

**PROOFS.** **B140** the ear, the eye and the model at one instant, plus the arrow's single utterance. **B141** a real driver Space on the logo, on a real `<button>` and on an anchor. **B142** the KEYS panel refusing Tab, then the binding FORCED through the API and the dispatcher refusing it anyway. **B143** three real arrows at a disabled scrub reaching the app, the disabled knobs saying so, and the seat leaving a dead zone. **B144** two arrows on `Z (ion)`, a real WebDriver mouse drag of ~1.9 turns on ACCENT A staying inside its declared range, End reaching 360°, and the roving seat surviving a disable. **B145** sixteen payloads refused, the prose and both KaTeX modes intact, and the same payload through a real project import. Node: `access.test.mjs` grew A8–A11 (11 clauses), `pwa.test.mjs` runs at both mounts. **One pre-existing expectation was changed and it is the one the wave was asked to change**: B123's seat clause pinned the stop to the checked option full stop — the very predicate that let IN P3 ship with no reachable seat. `./test.sh`: **node: 0   browser: 0** — 161 judged browser blocks, 43 node suites, `node tests/pwa.test.mjs --write` last.

**LESSONS.** **Silence and truth are two promises.** A guard that stops speaking does not make what it stopped saying correct, and `aria-valuetext` is read on demand — count the mutations AND read the number. **A rule enforced by a coincidence of the address stops being a rule when the address changes**, silently, with its own comment still standing over it; ask of every refusal whether it still refuses anything at the new address, and make the harness run at the address that ships. **A law that lives in one of two roads is a law with one implementation missing** — the fold, and the ratio in the comment, were the same failure at different scales. **The predicate was not the fix**: seating the radiogroup on `!disabled` changed nothing about the group that actually shipped broken, because every caller disables after the paint — fix the module so it needs no discipline. And **a comment that promises a check is a debt**: two files claimed §V3 pinned `og:image` for two waves while the URL rotted, and the cheapest way to keep a sentence true is to make something run it.

### wave 69: W-POLISH — the math face goes to work, three numbers earn the right to move, and the plugin stops being made of different stuff

**MODE: POLISH** (no new features) with one declared exception: the dynamic mathematics, which Josh asked for by name. Nothing was restyled that the wave was not sent to restyle.

**THE MATH FACE, IN USE.** `STIXTwoMath-subset.woff2` has shipped since wave 59 and rescued exactly one glyph — the title's λ. It now sets the mathematics, and the rule that shaped the whole mechanism is Josh's: **mathematics only, never chrome.** That rules out a selector (a seg label is chrome in one window and an operator in the next) *and* a tokenizer (`Re ψ` is mathematics, `SLICE / CLIP` is furniture, and no regex over the characters can tell them apart), so it is **declared** — one marker, `<m>…</m>`, in the string itself. It is an unknown element, so a note written with innerHTML gets the face from ONE CSS rule and needs no code; every plain-text call site goes through `kit.js`'s `mathText()`, which SPLITS the string and builds nodes — never innerHTML, so the marker opens no road anything could be injected down — and `mathPlain()` strips it wherever a string must stay a string. 98 runs: **the observables** (Josh chose them: the 3 × 2 grid is six pure runs), eleven window titles carrying their operator and nothing else, the LADDER and SPECTRUM labels, IMPULSE VECTOR's readout and sub-lines, and the formulas in the notes and the EXACT/NUMERICAL sheet. **`sw()` ignored `o.title` since it was written**, so fifteen switches had tooltips nobody could ever see; wave 53 found it and left it here.

**AND THE SILENT FALLBACK IS A GATE NOW.** `fonts/STIXTwoMath-SOURCE.txt` has always said a glyph outside the subset falls back silently to a serif and looks *almost* right. `tests/pwa.test.mjs §G` reads the face's own cmap out of the WOFF2 (brotli by hand, the road §F already takes for the `name` table) and fails on any marked character it does not carry. It found **nine**, `−` U+2212 the worst of them — every "−1/(2n²)" in the tree is that character and every one of them was falling back. The face is re-cut: **194 codepoints, 40 288 bytes, +1 200 for 19 glyphs**, and the glyph list is now a FILE (`STIXTwoMath-glyphs.txt`) that IS the subsetter's `--text-file`, because the prose list had already drifted — it claimed `'`, `"` and the Latin subscripts ₓₙₗₘₖ and the shipped binary carried none of the five.

**DIGITS DO NOT MOVE, AND THE RULE WAS DECIDED BY MEASUREMENT, NOT BY TASTE.** The brief's condition was *if the face lacks real tabular figures, numbers keep the UI font*. It does not lack them: all ten figures are **495/1000 em**, measured in the binary before a line was written and re-measured in the browser by B147. So a formula keeps its own numbers and reads as one expression — and `--font-num` did **not** move: every value field, knob readout and the transport clock is still Roboto with `tabular-nums`, and so is a live formula SLOT, because a slot is where the digits are.

**THREE NUMBERS MOVE, AND THE ANGLE IS BETTER THAN THE MIMICRY.** Josh: *"3Blue1Brown's … showing math numbers moving dynamically."* There the motion is illustration, so it is a TWEEN. Here the register's law is `c(t) = e^{−iEt}c(0)`, so a number crossing a formula is **the true value at every intermediate frame** — and B148 is that claim driven: each site is read off the DOM and recomputed from the model at the same instant, and they agree to the character. **(1) TRANSPORT** — `T = 2π/gcd{|ΔE|}` substituted, with the lap decomposition `t = lap·T + φ·T`. **(2) LADDER** — the three clocks are closed forms in n̄ alone, so the line is exact at every pixel of a drag and **lands instantly while the 400-period revival scan behind it is still on its way**, which is the whole reason the print derived them. **(3) SPECTRUM** — the law itself, with the selected label's `E`, `arg c` and `|c|` read out of the coefficient vector the frame is drawing from. **The other hundred-odd readouts were left still on purpose**: a number that is not a closed form of something the hand or the clock is turning has nothing true to say between two states. Nothing announces — no `aria-live` near a formula, and the cadence is the transport's own 5 Hz law rather than a second one. **A highlight-on-change was refused** under gate 3: a term pulsing five times a second beside the live field is decorative motion in the signal register. The two FACES do that job with no motion at all.

**THE MOTION PASS: ONE ENTRANCE, AND THE HALF THE LAW SAID WAS UNFINISHED.** `window open/close` is the OCCASIONAL tier, the one tier that gets a standard animation, so the lab now has exactly one: 220 ms, inside the 300 ms ceiling, the law's entrance easing verbatim, opacity and a 7-px slide, one iteration, chrome, no accent colour. **It is on `reopen()` alone**: `raise()` also clears `.closed`, TAB reaches it, and a keyboard-initiated action is never animated — two real driver Tabs raise two windows and start zero animations. The second half is MOTION-LAW's own outstanding list, which it predicted would keep growing: the preference reached 9 of 34 transition sites because `body.rack-hidden #rack` is (1,1,1) and the media block named `#rack` at (1,0,0), so the 310-px slide it was written for **never heard it**. The chevrons, the drag transform, the press transform and the plugin's own motion tokens are named now. The OS preference cannot be driven from this harness, so B149 lifts the block out of its `@media` wrapper and injects it as written — which measures the SELECTORS against the elements that carry the transforms, and is the only thing that could have caught the specificity bug. **What was refused**: a fold animation (tens/day, near-imperceptible only, and the chevron already is one), a rack-reorder FLIP (the reorder happens *during* a 100+/day drag), and a preset-load bridge (the jarring change is in the FIELD, which is signal, and bridging signal with a fade lies about the state).

**THE PLUGIN'S THREE DEFECTS ARE THE THREE DIVERGENCES.** Josh: *"whatever problem it has we will try to fix here."* `.m2pick` and `.m2clr` read `.m2root`-local aliases from outside `.m2root`, so both painted transparent; the ◂ ▸ reorder arrows are built and wired and were `display: none` in **every** mode. All three are fixed in `lab/modhost.css`, which is ours — the artifact's `modwindow.js` and `modwindow.css` are byte-identical to the staged copy, so the port back is a diff of three reach-list lines (`PORT-NOTES.md § THE THREE DIVERGENCES`). **`MANIFEST.md`'s one-word prescription is wrong for this mount and that is written down**: `glass` works for `.m2ppick` because it carries no background of its own; `.m2pick` does, at (0,2,0), and **an invalid-at-computed-value-time declaration still wins the cascade first and only then computes to `unset`**. Give the var a reachable value instead. B129's `copiedBroken` arm is `fixed` and asserts the opposite — a gate that pins a defect is the defect, and you retire it by inverting it in the wave that fixes it.

**AND THE PLUGIN STOPPED BEING MADE OF DIFFERENT STUFF** (Josh, three times, against his own recordings). It was never a colour mismatch: wave 66's `hsl(212 14% 13%)` and the house's `hsl(214 16% 13%)` are `rgb(28, 33, 38)` either way. **Reach-list 15 pinned the window opaque at a specificity CARD STYLE cannot reach**, so every other card in the lab went REFRACTIVE and this one stayed a plate. The private glass tokens are deleted, `--m2-mat-pane` is `hsl(var(--glass-tint) / var(--m2-scrim))` with the house's own tokens, and `#modwin` answers the card switch like `.dev` does — B129 now measures the plugin's pane **equal to a rack card's** on both settings. Wave 66's error was applying Josh's button inversion to the whole device; the BUTTONS keep it. One exception, stated in the sheet: on the LIGHT theme the pane stays, because the artifact's ink is 52 white-alpha rungs on both themes by the port's own standing decision, and white ink on a transparent card over a near-white stage is not a style. Flip the ink and the exception goes.

**AND THE REVERT, WHICH TOOK PRIORITY OVER THE REST OF THE WAVE.** Wave 67 read two sentences of Josh's — *"I love that disconnected look, it allows for more of the background to show"* and *"can you make it like the webm where the window is disconnected"* — as being about λWAVES' own rack, and shipped **every** window as a constellation. They were about the MODULATION window. Josh, this wave: *"Why was the design of our own UI changed?? Please Claude I meant the design of the Modulation window only."* So `body.disconnected` is **off by default** and our rack is one card with its header attached, exactly as before wave 67. It stays as a SETTINGS switch because twenty-one CSS rules and one class cost nothing while they are off. **Both roads flipped together, because a default that disagrees with itself is how it happened**: `setDisconnected` reads `!!v` (nothing said = joined) and `applySettings` reads `s.disc === true`, so a profile predating the switch opens joined. **What wave 67 did that was a FIX and not a design change is kept and untouched**: the drag rewrite (40 forced layouts and 40 synchronous writes per drag down to one write per frame) and the pick-up transition at the 120 ms rung instead of 350. FROST is unchanged and still defaults OFF. **B136 owns the revert** — it forces the constellation on for its own geometry and hit-testing, so it was the block whose *first* clause had to become the default, and both roads are asserted there.

**PROOFS.** **B146** the face is loaded, every live `<m>` resolves to it, and it PAINTED — the probe string measured on a canvas differs from both fallbacks the stack names, which a silent fall-through could not do; no `title` or `aria-label` in the app contains a literal marker. **B147** the ten figures at one width, the five value columns still Roboto + tabular, no marked run inside any of them. **B148** the three moving sites read off the DOM and recomputed from the model at the same instant. **B149** the entrance, two REAL driver Tabs animating nothing, and reduced motion applied at real specificity on the real elements. **§G** in `pwa.test.mjs` is the coverage gate. Updated because the wave was asked to change exactly what they pinned: **B129** (the pane, and the three defects inverted) and **B131** (the clear button's plate). One free fix on the way past: `ui.tsr` was assigned twice in `ladder.js`, so the CLOCKS `T_sr` has printed an em dash since it was written. `./test.sh`: **node: 0   browser: 0** — 165 judged browser blocks and 42 node suites, all green, `node tests/pwa.test.mjs --write` last.

**LESSONS.** **A convention beats a heuristic when the categories are semantic.** No amount of Unicode cleverness can tell an operator from a label; one marker in the string can, and it costs less. **A .txt beside a binary drifts, and the pair that drifts is exactly the pair nobody re-reads** — the glyph list is the subsetter's own input file now, gated against the cmap. **The obvious one-word fix was wrong for a reason worth knowing**: an invalid `var()` substitution wins the cascade before it computes to `unset`, so adding a lower-specificity class under it changes nothing, silently. **A defect fixed while the gate that pinned it stays green is not fixed**; invert the gate in the same wave. And **the plugin looked wrong because it answered nothing** — not because its colour was wrong. Ask what a surface RESPONDS to before you re-tune what it is.


### wave 107: W-FINISH — the rates turn the state, the keyboard manual gets its model, and saved projects acquire a boundary

The remaining Claude board was reconciled against the shipped source, not restarted. Josh's current
rulings are **keep the resting hint hidden** and **keep verification focused; Josh will verify the UI**.
The frozen `lab/mir/modwindow/` bytes have not been edited. Host behavior and skin remain outside them.

**Three rates, no fictional angles (#79).** The existing ROTATE z, STARK K_z and DEFECT L² wheels are
relative gestures; registering their permanently-zero getters would invent an absolute state. Their new
SPIN controls hold signed rad/s, with limits derived from the operators' periods: one turn per second
for z and K_z, one π-period per second for L². The registry and dials read the same constants. A cadence
tick integrates the raw wall interval, capped after a stall, and applies z, K_z, then L². Each operator
is exact; simultaneous noncommuting drives use that ordered splitting, not a claimed joint exponential.
Zero writes nothing and does not keep the frame loop alive. Sturmian disables K_z and L² in the setter
as well as the UI. Files carry the rates; v1 links name nonzero rotation rates among settings not carried.
Restore applies the destination scale before its rates, so the departing project's scale cannot clamp
away the arriving project's controls.

History treats a running drive as one held gesture: `dirty()` avoids hashing it and `note()` does not
schedule commits while it runs. Stopping banks the result as one edit. This preserves redo and avoids
incidental pointer clicks banking continuously moving coefficients. The expensive recurrence scan also
waits through a drive. The new history test measures the omitted hashing, preserved redo and one final
undoable entry, rather than just checking a flag.

**The Kepler controls read the state.** SPIN ω, TILT ν and TURN Ω derive their axes from the selected
shell's current orbit and apply the existing SO(4) rotor path. There is no remembered orbit angle to go
stale. Missing and isotropic shells disable the controls with a reason; low coherence remains an honest
picture limitation, not a ban on the exact operator. Static-field time participates in the readout cache.
A measured turn and inverse returned coefficients within 5.6e-16; this checks the shared operator seam,
not every possible orbit a user can draw.

**The keyboard manual had three real defects.** The outer host opened while the editor's own hidden
root and recording guard stayed closed. The model argument captured `undefined` before the action table
was installed, so even an opened editor had no actions. Its HSL background supplied a hue without a
saturation or lightness, so the declaration was invalid and the stage showed through. The host now uses
the editor's lifecycle, a live adapter to the one key table, the existing full tint token, and the overlay
stack level. Focus returns to the opener. The measured list contains every one of the table's 43 actions;
Escape closes it. Its recorder respects the same Tab reservation as the settings recorder.

**Projects now distinguish an unsaved document from playback (#85).** A baseline combines the saved
experiment, presentation and notebook. Clock position and adaptive render scale do not dirty it;
modulated parameters compare their hand bases. An edit to material or notebook does. New/open/recent
UI actions ask before discarding, cancellation leaves the project alone, and beforeunload protects the
same boundary. Successful save/open/new establishes the baseline; storage failure never claims a save.
The comparison runs at the destructive boundary, not on every display frame. This is deliberately a
project model: the register-only undo flag could not protect a notebook or a camera edit.

**The deterministic renderer is reachable (#57).** `createExactRenderer` already existed with its own
suite but no app importer. CAPTURE now offers EXPORT FRAMES beside the recorder, reports progress, and
lets the same button stop the run. It downloads a PNG sequence and manifest in a ZIP. The existing size,
FPS and duration controls supply the plan; refusal is shown when no exact period exists. Live modulation
and operator rates are frozen during this export and restored afterwards, while the renderer pins the
camera, GPU jitter and clock. This exports the current state's evolution; it does not claim a recurrence
of a live driven operator. The dormant-module allowlist entry is removed. A small real GPU export
produced three scheduled frames with no page errors; the module's numerical suite remains the fuller law.

**The gate reconciliation, by verdict.** B131 was measured first: `getComputedStyle(null)` threw because
wave 106 removed the OBSERVER switch the probe selected. The surviving SPACE segment supplies the opacity
measurement. This is a STALE LAW selector, not a boot exception or a ghost cache.

| Blocks | Verdict and reason |
|---|---|
| B40 | STALE LAW probe mechanics: template-literal escaping destroyed its transparent-color regex. Compare the actual computed transparent value. |
| B62 | STALE LAW fixture: applying saved settings re-enabled FROST after the probe disabled it. Establish the intended OFF condition after restoration. |
| B74 | STALE LAW: prose already specified the newer 46 px transport, assertion still required 32. |
| B98 | REAL DEFECT: the free-camera pitch adapter called `orbitBy(0, 0)` when restoring an unchanged pitch, re-deriving yaw and shifting a minted link by one f32 unit. Equal pitch now returns before rotating. Byte-identical re-mint measured. |
| B118/B119/B131 target counts | STALE LAW: the new rate targets extend the registry; counts are derived from the actual target/dial catalogue. |
| B123/B124/B141 | STALE LAW: Josh assigned Space to transport; Enter activates the focused control. Update both the keys pressed and the sentences describing them. |
| B129 | STALE LAW: later waves deliberately detached surfaces, shortened cards, unified knobs, moved ADD onto the rail and made fold binary. Measure those dimensions from the artifact and host tokens; unrelated house stylesheet rule counts are not a design contract. The frozen artifact still parses intact. |
| B132 | STALE LAW: mini transport geometry and accent changed; Ctrl+Space arms modulation, M opens its window; resting hint remains hidden by Josh's current ruling. The off/base and pause/hold behavior stays measured. |
| B134 | STALE LAW fixture: the chip selector clicked an older persisted source while the probe read a newly added one. Reset the fixture and read its source by id. The actual ANCHOR/BPM/TRIG clock laws pass. |
| B135 | STALE LAW for removed stacked shade/bevel layers; REAL DEFECT for CARD STYLE becoming inert under default FROST. The filter now remains independent of the pane. House, macro rail, workbar and devices agree for both themes, both pane styles, and frost off/on. |
| B139 | STALE LAW: the later frosted recipe uses the shared blur token and separate header treatment. Read the actual token rather than reinstate the discarded saturation/brightness recipe. |

`.m2add` being zero-sized is deliberate: ADD moved to `.m2addchip` on the rail. The hidden reorder arrows
were superseded by the later layout ruling; source moves remain wired. The resting helper was dead code
and is removed; temporary operation/status messages retain their existing behavior. No hidden control
was resurrected to satisfy an obsolete probe.

GitHub authentication and Cloudflare deployment remain account boundaries. The local source, branches,
ark and deploy payload can be prepared here; an unauthenticated CLI cannot create the remote, and this
handoff explicitly forbids touching Cloudflare. `TASKS.md` records that remaining external task without
calling it shipped.


**Continuation: B139's final failure was lexical, not material.** The first full gate ended node 0,
browser 1/165. Its body filter was `blur(22px)` and its token, after saved settings passed through
`toFixed(1)`, was `blur(22.0px)`. Reproduced directly in Firefox. Both are the same CSS value; the probe now
resolves the token through computed style before comparing. All policy/material arms stay unchanged.
The interim closing review's reopened task conclusions are reconciled in WAVE-107-CLOSING.md's addendum
with earlier source and the actual passing browser blocks, rather than assuming a feature must appear
in the newest commit to exist.


**Final validation and local delivery.** The corrected full browser run passed **165/165** with zero
page errors and no uncaptured GPU errors. The node suite passed before the test-only B139 correction;
it was not rerun redundantly. `node tools/build-deploy.mjs` verifies the deploy payload. `main` receives
the verified `dev` history by fast-forward; `dev` remains the working checkout. The ark is refreshed to
that history and builds independently. GitHub/Cloudflare remain the explicit account boundary, not a
reason to leave local source unfinished.
# Final II continuation — 2026-09-08

The interrupted UI/render/matrix work is continued in the working tree. See
[FINAL-II-HANDOFF.md](FINAL-II-HANDOFF.md) for the board-to-code map, focused validation,
intentional style-rule changes and implementation boundaries; see
[Serum/MASSIVE architecture](research/SERUM-MASSIVE-MATRIX-2026-09-08.md) for primary-source
guidance and unavailable historical evidence. Existing wave reports follow unchanged.

## 2026-09-10 · Senior review pass: the gate is green, the cascade is pruned, the hot paths are cold

A one-session review of the whole tree as it stood after the September 7–10 commits, done as a senior
engineer would read a repository handed over by iterative prompting: measure first, cut what is provably
dead, fix what is provably wrong, leave the physics alone. Every removal here was proved neutral before it
was kept.

**The gate.** `./test.sh` now means something: 58 node suites plus the two shipped browser suites
(`tests/current.browser-test.mjs`, `tests/gpu-recovery.browser-test.mjs`) all pass. The historical
wave-by-wave gate (`boot.browser-test.mjs`, 8 172 lines, waves 1–143) moved to `tests/legacy/` and runs
with `./test.sh legacy`; it stood at 83 green / 76 red and its reds were triaged: 17 read windows the
visibility scheduler of `f2b4929` keeps idle (METERS, ORBIT, DYNAMICS, KEPLER, CALCULUS ship closed or
below a 900-px fold), 6 matched on-screen copy that `a526bda` reworded, 1 was the harness returning
nothing, and 52 were unreadable because every `catch` logged Firefox's `e.stack`, which carries no
message. That logging now prints the message; `judge()` keeps 600 characters of payload instead of 300;
and `__LW.windowActivity.presentOffscreen(true)` lets a proof present below-the-fold windows without
lifting the structural gates (closed, folded, off, ui-hidden) — asserted in `tests/window-activity.test.mjs`.
`tests/current.browser-test.mjs` carried one stale law from `a5c0863` (the macro seat edits depth whether
the rail is folded or not); it is restated, not weakened. No red was traced to broken physics or a broken
shipped control.

**The cascade.** A pruner (`same selector, same @media context, later declaration wins, !important-aware`)
removed 66 dead declarations from `lab.css`, `skin.css` and `modhost.css` — the residue of waves
re-declaring `#transport.mini .ro`, `.ro-val`, `.k-val`, the modulation rail and the phone breakpoints on
top of each other. Neutrality was proved, not argued: 3 285 elements × 50 computed properties with all
25 windows open, dark and light, hash-identical before and after. The wave-53 `?` keysheet, which wave 106
replaced with the drawn keyboard and then deleted from the DOM on every boot, no longer gets built at all
(rack.js, ~30 lines; lab.css/skin.css, 16 rules).

**The hot paths.** `field.resize()` read `canvas.clientWidth` every presented frame after the loop had
written body attributes — a forced synchronous layout per frame; it now reads a ResizeObserver-kept size.
DYNAMICS ran a Schmidt decomposition per populated shell on every CPU tick for a quantity that depends only
on the anchor coefficients; it runs per edit. The quality governor's median no longer copies through a plain
array; SPECTRUM's caption walks `groupByN` once; SHADOW and KEPLER drop three per-frame array allocations.
Exact physics results are untouched (37/37 hydrogen, all suites).

**The repository.** Nine handoff and task-board documents moved from the root to `docs/history/`
(REPORT, CHANGELOG, DEPLOY, README, CONTRIBUTING remain). `CONTRIBUTING.md` is new. The three test scripts
that carried this machine's home directory now derive it from `import.meta.url`
(`tests/mir.test.mjs` takes `LW_MIR_SRC`). `tools/gate/drv.js` is `drv.mjs`, which is what it was.
`package.json` names the project, the licence, the homepage, Node ≥ 22 and `npm run serve|test|test:browser|test:all|build`.
What remains open is off this machine: iPad/phone acceptance, installed-PWA update, a real microphone, and the deploy.

## 2026-09-10 · Real-time pass: steps before grid, a clean GPU exit, and the transport's second face

**The governor caps ray steps before it drops the grid.** The quality governor's only lever was the
resolution ladder 128³ → 96³ → 64³, and a rung is a `setResolution()`: two rgba16float N³ textures
destroyed and recreated (32 MiB at 128³) — the costliest thing the renderer does and the allocation
pattern a WebGPU driver under load likes least. `field.setStepCap()` already existed for tablet motion.
The governor now walks a STEP ladder first (×0.7, ×0.5 of `mat.steps`, present-time, nothing rebuilt)
and only then the grid; recovery returns the grid first, then the steps. METERS reads `STEPS ×0.7` /
`GRID −1 · STEPS ×0.5`. Ray-march cost is linear in the step count, so this is the largest single
frame-time lever the audit found; the renderer's frame path itself was already tight — one submit per
frame, no readbacks on the frame path, camera-only frames skip the reconstruct compute, persistent typed
scratch everywhere (audited 2026-09-10; the 2026-09-09 claims held).

**A real unload releases the GPU in order.** `field.dispose()` destroys the two textures, the five
buffers, unconfigures the context and destroys the device; `rack.js` calls it on `pagehide` when the page
is not entering the back-forward cache. Backgrounding is untouched (the textures stay warm on purpose).
This is the mitigation for Firefox occasionally crashing whole on a reload of the lab: the driver was
reaping 13–32 MiB of textures and a live device behind a navigation. If it still happens, it is
Firefox's WebGPU on this driver, not the page — `about:support` → Graphics → WebGPU has the failure.

**Three.js, and what transfers.** Nothing specifically Japanese surfaced (the nearest: takahirox's
original experimental `THREE.WebGPURenderer`, and the Expo 2025 Osaka "Waves of Connection" million-
particle installation). The 2025–26 advances that do transfer to a raw-WGSL ray marcher: GPU timestamp
queries for per-pass ms instead of wall-clock; a compute-pass brick-occupancy grid so rays skip regions
whose contribution cannot change an 8-bit output level (the empty-space-skipping pattern behind
three.js's compute-node work); WebGPU now default in iPadOS 26 Safari. Subgroup ops are Chrome-only
(Firefox blocked, Safari absent) and are not worth a branch. The brick skip is the next renderer wave;
the timestamp query is how to measure it.

**The transport's second face (Josh).** The expanded bar is two panes of square tiles: MACROS — the
model's first four macros as named knobs, written through `setMacro` + `applyAll`, the window still the
only place that builds them — and CLOCK: one BPM field (the pill carries the readout; the second BPM/Hz
line is gone), TAP, WALL/FREE, the DJ bends ÷2 / ×2 (hold to bend, release returns the base exactly; a
tap under 240 ms latches, a second tap releases; one base is remembered so ×2 then ÷2 does not compound),
HOLD 1/4, HOLD 1, cadence. Measured: 60 → 120 held → 60 released → 120 latched → 60.

**Shipped defaults and small laws (Josh).** TINTED is the card style (`--card-opacity: .76`, a little
more of the field through it): the look of frost with no backdrop filter, so no compositor cost on the
iPad. Control hints at 600 ms. SPECTRUM's NORMALIZE reads NORM with the hint "Normalize"; its live law
`c(t) = e^{−iE t} c(0)` no longer reflows the card (nowrap, fixed slot widths for t and arg c). ISO,
GRAIN and KNEE sit under EXPOSURE, SOFT and HUE as one material row. **Two bugs in SLICE / CLIP:** the
plane model was repainted only while the *other* SLICE window presented (`canPresent(wSlice)` gating a
control that lives in `wClip`), so a drag changed the normal and nothing on screen moved; and its
azimuth/elevation parametrisation was degenerate at the pole, which is where the plane starts, so a
horizontal drag did nothing there. It repaints on its own window and turns by two axis tilts.

## 2026-09-10 · The transport's second face, second pass: a miniature rail, the law of the two clocks, hints that step aside

**What Josh asked, in his words:** keep the expanded bar's dimensions; put a miniature of the modulation
window's MACROS rail in it, not knobs; remove the BPM field (the pill already has it) and put in its
place a toggle for the two clocks — synced or separate — because "the app sort of functions in between
and gets buggy because of the lack of law"; make the rail's COMPACT cut information instead of moving
it; and make control hints get out of the way of a hand on a control.

**The miniature rail** (`lab/native-ui.js`, `.tm-*` in `skin.css`): number badge, name, value and the
same thin fader as the window, at two-thirds scale, one row per macro (four at most) in the 72 px the
two tile rows take. It reads and writes the model (`macroOf`, `setMacro` + `applyAll`), so it IS the
macro, not a copy; a driven macro shows its accent fill; a trigger macro shows TRIG and no fader. The
window remains the only place that builds macros (STYLE-LOCK). Drag sets it; arrows step it; Home/End.

**The law of the two clocks.** `clockLink` (this browser's, persisted beside the arm; LINKED is the
default). LINKED: the modulation clock is a follower of the transport, held there by the frame loop on
every play-edge of the physics clock — a scrub, a preset, a project open, a HOLD can no longer leave one
clock running and the other stopped. A refused play (the host's own "nothing-to-run": no route and no
open window) is retried once a second, so a source routed later joins within a second. SEPARATE: the
transport does not touch the modulation clock; MOD ▶ / MOD ❚❚ runs it alone. The tile reads
LINKED / SEPARATE; MOD ▶ is disabled while linked. Measured with a live LFO and the window open: app
play → both run; app pause → both stop; SEPARATE + app play → the modulation clock stays; MOD ▶ starts
it alone. **A latent bug went with it:** MOD PLAY did `arm(true)` and then a blind `toggle()`, and
arming while the transport plays starts the clock by itself, so the toggle stopped it again — pressing
MOD PLAY while playing did nothing. It now decides before it arms.

**The clock pane** is two rows of 34 px tiles, the bar's original height (89 px measured): LINKED · MOD ▶
· TAP · WALL · 60 Hz / ÷2 · ×2 · HOLD ¼ · HOLD 1 · ⓘ (the repeat mathematics). The BPM field is gone.

**COMPACT cuts, it does not reflow** (`modhost.css`): the rail narrows to 144 px and clips; every row keeps
the full rail's grid at its full width, so the badge, the seat and the start of the name stay exactly
where they were (measured: seat at 50 → 51 px, value at 94 → 95, tools at 175 → 179, all clipped by the
edge rather than moved). What it costs: the tool seat is behind the edge while compact. Josh's
screencast of the old behaviour could not be decoded (VP8 stream reports invalid packets), so this is
the reading of his words and the measured old layout, in which the tools jumped 81 px left.

**Hints step aside** (`installControlHelp`): a press, a wheel, or any key that operates the control closes
the hint, and it does not reopen until the pointer leaves and returns; a drag never opens one.

## 2026-09-10 · Third pass on the transport: the window's own rows, not a likeness of them

Josh: "The modulation window already has features that you can just copy. COPY THE LOOK, THE FUNCTIONS,
THE DETAILS, THE SPACING." The previous pass drew a likeness; this one reuses the thing itself.

**The transport's macro tiles are the window's rows.** `buildMacroSlot` — the ported window's own slot
builder — builds each tile, so the routing grip, the numbered depth seat with its ring, and the reorder
tool are the same nodes the window builds; the name face, the delete and the rename row are hidden. The
window's API now exposes its own gestures (`wireGrip`, `wireDepth`, `paintDepth`, `moveMacro`,
`rebuildMacros`) and the tiles are wired through them: one code path, two faces. Its rules for those
nodes (modwindow.css 583–607, modhost.css 1037–1038, 1204, 1847–1848, 1865) are copied to the rail's
scope, not restyled. Two tiles to a row — A B / C D — and past two rows the rail scrolls on its own
while the clock tiles stay. Reorder: the rail's tool, dragged across the two-column grid or stepped with
the arrows, moves the macro in the model and both views follow. The ⓘ sits in the panel's corner, not
a tile. Measured: five macros → five 44-px tiles (0,0 · 139,0 · 0,48 · 139,48 …), rail 140 px tall in
92 visible, a vertical drag on seat 1 took depth 1.000 → 0.782 and both arcs read `0.7818 1`, a grip tap
armed macro m1 in the window's own arming state, a handle drag put m1 after m2 in the model and the
window's first row became m2.

**The window's compact rail, as specified:** each row is the routing grip, the depth seat with its
number, and the tool seat — the name face is hidden (not clipped), the rows keep the full rail's
vertical metrics so the rail head and rows 3–4 no longer move. The tool seat's divider is gone: reorder
reads in accent B, delete in faint ink, with a hair of air between them.

## 2026-09-10 · Fourth pass on the transport: the dot grip, ×4, digits under the pointer, one pane law

- **The MACROS head no longer moves on compact.** The compact head had its own padding and font size
  (modhost.css entry, now deleted); it keeps the full head's metrics — measured identical left, top,
  height, font and padding across the toggle.
- **The reorder handle is the dot grip** — Josh's 5×5 pixel art, dots on rows 1/3/5 × columns 1/3/5 —
  in the window's rail and on the transport tiles (`gripDots` in kit.js, swapped onto the ported rows by
  the host). The four-way cross stays the ROUTING grip.
- **The transport is a pane like the windows.** It had kept a transparent surface from an old wave; it
  now follows CARD STYLE (tinted / refractive), theme and FROST exactly as `.dev` does. The tempo pill
  is a rounded rectangle (10 px), not the seats' 50 %.
- **×4** fills the clock's empty fifth tile: ÷2 · ×2 · ×4 · HOLD ¼ · HOLD 1, all on the one-base bend law.
- **The digit under the pointer is the step** (FL Studio's law): dragging on the tens moves tens, on the
  ones moves ones, on a visible decimal moves tenths; the wheel steps by the digit it is over; a touch
  moves ones. Measured from 60.0: tens drag → 80.0, ones → 82.0, tenths → 82.2, wheel on tens → 92.2.

## 2026-09-10 · MIR: the interface becomes a kit, and λWAVES becomes its first reader

Josh: "I've learned my mistakes because agents would keep copying instead of taking a kit." So the kit
exists now, as its own repository (`~/Documents/MIR`, v1.0.0), and this tree adopts it.

**What moved into MIR** — `kit.js` (with `glyph.js`), `slider-keys.js`, `window-activity.js`, and two
modules cut out of `native-ui.js`: `control-help.js` (hints that step aside, the ⓘ panel, one help
surface per window) and `plane-model.js`; the modulation system whole (`mir/modulation/`: BASINS' window,
byte-frozen, with the host, model, registry, curves and `modhost.css`); the fonts with their licences;
the four UI laws from `docs/ui/`. **The sheets were split** by selector: every rule naming an app id or
class (`#transport`, `.sp-`, `.nb-`, `data-id=`, …) stayed in `lab.css` / `skin.css`; every generic rule
(tokens, `.k`, `.seg`, `.trig`, `.fd`, `.ro`, `.fx`, `.dev`, the materials and themes) became
`mir/css/base.css` and `mir/css/skin.css`, loaded first. The split is a script (`.tmp/splitcss.mjs`,
kept in this entry's spirit: same selector, same @media context, comments travel with their rule).

**Proved, not argued.** 3 292 elements × 50 computed properties with all 25 windows open, dark and light,
before and after. The only differences: the two new `<link>`s; the intended dot grip on the modulation
device cards (`.m2head::before`, `.m2headl` padding 18 → 22); and **one latent cascade bug the split
fixed** — HISTORY's action row was written as a two-column grid but a later `.row { display: flex }` in
the same sheet had beaten it since it was written; with the kit's `.row` now loading first the grid is
live and the window is 94 px shorter. The light run also showed one SPECTRUM lane fewer, traced to the
probe's own settle time, not the sheets (see the follow-up line below).

**One mark for "drag me."** The rack windows' header grip (`.dev-head::before`) and the modulation device
cards' headers (compact, full and the rotated minimised bar) wear the same 3 × 3 dot grip as the rail's
reorder handle and the transport tiles. The four-way cross remains the routing grip. BASINS' own
chip-rail grip was already this mark; the kit takes it as the law.

**The layout law of an adopting app:** `lab/mir/` ≡ MIR's `mir/`, `lab/fonts/` ≡ MIR's `fonts/`,
`MIR-MANIFEST.json` names the bytes; `node ../MIR/tools/adopt.mjs . --check` reads "in step". The gallery
(`MIR/gallery/`) shows every token, material and widget built by the kit itself, with the theme, card
style, frost and disconnected seats live.

## 2026-09-10 · The DAW law: a project carries everything a demo shows

Josh, about to make demos: "treat this like a DAW and check if every observable thing is kept in the
project files." Audited against `serialize()`: the register, material, camera pose, quality, domain,
palette, hamiltonian, field lines, Wigner, MO, rates, Sturmian and the modulation rack were already
there. What was not, and is now, each an additive key under `presentation` (an old file opens as before;
an UNDO record never carries them):

- **`ui`** — theme (dark / light / system), card style, frost policy, disconnected, the accents, and the
  **stage**: the knob's mix plus a **custom stage colour**. The palette's own swatch now sits left of the
  STAGE knob; pick a colour and the stage stops following the theme (that colour is the dark end of the
  same mix, and a theme flip keeps it); FOLLOW THEME clears it. Untouched, the stage follows the theme
  exactly as before.
- **`layout`** — the arrangement as it stands: every window's side, order, folded / closed / off, floats
  with their positions (the favourites' own record, reused). "Random windows are open as they are."
- **`modwin`** — the modulation window's placement, lane, ribbon, device modes, folder, macro side and
  fold.
- **`camera`** — auto-rotate, friction, spin, drag gain, fling.
- **`overlays`** — VORTEX on / overlay, KEPLER, particles (on and count, re-seeded on open), and SPECTRUM's
  DIALS fold.
- **`ab`** — the A/B transition's two stored states, Ω and whether it was running (the block's private
  stores now have a project road; Josh: "state transitions don't keep").
- **`notebook`** — its size, only when it was resized from the default (the ABOUT face and the notebook
  share the default).

Proved in the shipped gate (`tests/current.browser-test.mjs`, the DAW law): arrange a demo — a route with
its own range, the opposite theme, a custom stage, auto-rotate, KEPLER, VORTEX, DIALS, A and B stored, the
notebook at 520 × 380 — save, disturb everything, restore, and read every value back equal. One bug found
on the way: `restore()`'s catch said "restore failed" and nothing else, which hid a scope error for an
afternoon; it now says why in the console.

On the macros "moving the entire region": that is the pause law working as designed — a hand on a routed
knob moves its BASE and the ring is the range; the route's `min`/`max` and the base are in the file and
round-trip (the proof routes `material.exposure` over 0.5…4). If a demo shows otherwise, a screenshot of
the route and the knob before/after the save will find it.

## 2026-09-10 · The hand on a routed knob, and a stage with two ends

**The bug Josh saw.** A click on a macro'd dial "teleported the entire range" to where the needle was.
Cause: the registry drove the knob through `set()`, so the knob's own value became the modulated one, and
a drag — or a click that ended in `onChange` — started from THAT and wrote it back as the base. The kit's
`knob` now keeps two numbers (MIR 1.0.1): the base the hand owns (`set`, `get`, where a drag starts) and a
painted value (`show`) the modulator writes over it; `setKnob` in rack.js paints routed ids and sets
unrouted ones. Measured with EXPOSURE routed 0.5…1 at macro 0.8: the needle showed 7.42 over a base of
1.000; a click left base and range at 1.000 / 0.5…1; a 30-px drag put the base at 0.505 — the base moved
by the drag, and the range with it. In the shipped gate as "the hand on a routed knob".

**The stage has two ends.** A is the knob at 0, B at 1. Unnamed, A is this theme's ground and B the
other theme's, so DARK runs black → light and LIGHT runs white → dark, and a theme flip swaps both
(before, the mix always ran dark → light whatever the theme, which is why it "went to white"). Each end
has its swatch; a named end is kept across flips and travels in the project (`ui.stage.{mix,a,b}`; a
file that still says `custom` reads as B). FOLLOW THEME forgets both. Measured: LIGHT → DARK gave the
dark ground; naming B kept it across the flip back; the DAW law in the gate reads B back from the file.

## 2026-09-11 · Second optimisation pass: the side channels, the routing verdict, two materials

**What the audit found.** The frame loop, its reader governor and the hidden-tab law are sound (the
2026-09-09 pass holds); the waste was in side channels. Fixed: the tempo panel's 200-ms timer rewrote
~15 DOM fields and every macro tile blind — it now writes only when a signature of its inputs changes;
the modulation window's ResizeObserver force-painted every device row on any resize — a forced repaint
now needs a moved lane edge, otherwise the throttled paint; the notebook's title, subtitle and text wrote
localStorage synchronously on every keystroke — one write 300 ms after the last key, flushed on pagehide;
the fader's fine drag read its rect per move — once per drag (MIR 1.1.2); the audio device's analysis
latency had two copies of one formula — one; a pasted book in the notebook previews its first 200 000
characters instead of one huge innerHTML. Left as documented, not changed: feedAudio fans out to every
audio source per tick while the mic is live (by wave 105's design); the corner-axis transition runs its
own 500-ms rAF chain.

**What the last twelve GPT-team commits left.** Two dead CSS rules from the audio device's old cycling
design (removed in MIR 1.1.2); no half-finished code. But those commits edited five MIR-owned files in
place, including the "byte-frozen" window: the kit takes the work back (MIR 1.1.0 — the audio device
redesign, the routing/compact layouts, the label pass) and the byte-frozen law is retired: MIR is the
source of the window, the provenance patch records the delta from BASINS. Their `projectSnapshot()` also
broke `tests/project-storage.test.mjs` (the suite slices rack.js by marker and the new helper sat outside
the slice) — the slice now carries it; the gate had reported it red under the pwa hash message.

**Saved projects, re-verified:** the DAW law and the routed-knob law both pass on the new tree; the
storage suite is green again. Note: the GPT team replaced the two-end stage (A / B) with a single custom
colour plus FOLLOW; the file carries theirs, and the DAW law reads it back.

**The modulation system against industry practice** (research: CLAP `param_mod`, VST3 automation vs
modulation, Bitwig's unified modulation, Live's envelopes, one-pole smoothing): the core is right by
those standards — base and heard value are separate in the registry, modulation is an additive offset
over the base (unipolar from `min`, bipolar from the midpoint, scaled by master depth), clamped or wrapped
per map, never persisted into the base, released bit-exact on stop; sources are one-pole smoothed at
block rate. Two conventions taken: the knob keeps its base visible under a modulator (a tick at the rim,
MIR 1.1.1 — Bitwig shows the setting under the modulation, never hides it), and the hand law from
yesterday (a drag moves the base by the drag). Not taken, on purpose: smoothing at the target on
route enable/disable and on release (it would soften the "what the file says is what you see" law;
these are visual parameters at 60 Hz, a one-frame step), and per-voice modulation (no voices here).

**Two materials (Josh).** `--card-opacity` .76 → .88: the tinted pane keeps a faint breath of the field.
The photosensitivity pane: blur at .55 of the glass blur with a faint ground (white .34 / near-black .42),
so the field reads through as shapes and the text stays strong.

**Audit close-out (2026-09-11, later).** The remaining three findings, applied or answered: the
notebook's move and resize now write style once per frame through a rAF coalescer (a header drag of
+60 / +30 and a grip drag of +60 / +40 measured after); the audio feed keeps feeding every audio device
on purpose — an unrouted device's minimised meter is that signal, so skipping it would freeze the meter;
the corner-axis "second animation chain" only sets a flag and schedules the main loop for 500 ms, there is
no second render. The reader governor's `canPresent` already excludes folded and compact windows, so a
minimised METERS does not compute its autocorrelation.

## 2026-09-11 · Ink stays under glass

Josh: a vertical line "cutting right down the LFO title and plaguing the entire devices." Investigated
in the page, not by eye: a scan of the LFO card for hairline-thin tall elements found only the graph's
own playhead (inside its SVG, clipped, innocent); switching the field's FRAME off made the line vanish.
It was the stage's frame and axis ink — 1-px lines at 42 % alpha in light theme — showing through the
.88 tinted pane, exactly where a cube edge happened to cross a window. Every window is translucent by
Josh's choice, so the fix is neither opacity nor blur: **the line pass skips the pixels a window covers.**
`field.setOcclusion(rects)` takes up to 32 window rectangles into a uniform block and the line
fragment shader discards inside them (the corner-axis HUD binds an empty block); `rack.js` gathers the
rectangles — each open card on both racks, every float and the modulation window, the transport, the
notebook, the sheets and menus; past 32 the two rack columns stand in for their cards — in one layout
burst at the top of a frame before any DOM write, at most every 300 ms while a frame runs and at once
when a float is dragged, the modulation window is placed, a rack scrolls, the body's class changes or
a window opens or closes. Measured: the cube edge that crossed the LFO's title now ends at the card's
border. Cost: one uniform write when a rectangle moved, a 32-iteration loop per line fragment (a few
thousand fragments).

## 2026-09-11 · THE CHRONUSQ PORTS — the mathematics comes in as headless modules with proofs

Josh: "I do want to synthesize mathematics out of it and not let anything they have go to waste, incorporate anything you see makes our vision possible." The credit line stays as it is, by his choice. What came in, each a pure module with a node proof and no DOM: `lab/gaussian.js` (s-type contracted Gaussian integrals for any centres and exponents on the axis: S, T, V, dipole, the full (ij|kl) tensor, nuclear repulsion; held against h2ci.js's closed loop to 1e-12), `lab/scf.js` (restricted Hartree–Fock with Pulay's commutator DIIS and Fock damping; H₂ −1.116714325 and HeH⁺ −2.8606585 against Szabo–Ostlund and against PySCF on the same primitives to 1e-9; DIIS 6 cycles vs plain 10 vs damped 15; the DIIS system drops collinear error vectors, which in a two-function basis is every vector past the first), `lab/density.js` (the density matrix in the Löwdin frame, Hermitian eigenproblems by realification, Magnus-2 predictor–corrector and MMUT, the idempotency and trace diagnostics that report and never repair, ChronusQ's four field shapes, and `createRTHF` for one electron or a closed shell; one electron reproduces modrive.js exactly for a constant field and to O(Δt²) for the pulse with ratios 4.00/4.00; two electrons keep Tr = 2 to 4e-13 and idempotency to 9e-14 through a near-resonant pulse, with energy drift and reversal residue falling 8× per halving), `lab/absorb.js` (the δ-kick, the closed-form field-free dipole trace, the damped sine transform by recurrence, peak finding on Im α, line strengths; H₂⁺ peak on the gap to 2e-6, amplitude 2κz² to 1e-9, Sturmian lines carrying 2ωz² to 6 %). The crown proof: the two-electron kick spectrum peaks at 0.930087 against PySCF's RPA 0.929922, away from TDA 0.947 and FCI 0.968 — the linear response of RT-RHF IS the random-phase approximation, measured. THE CATCH: pairing D_kl instead of D_lk with (μl|kν) conjugates the exchange for a complex density; every ground-state anchor passed with it and the spectrum peaked at 1.3975 = √((Δε+K)² − (2K−J)²), the wrong closed form the same slip produces by hand. Only the oracle saw it. The independent oracle is `research/chronusq-2026-09-11/oracle-pyscf.py` (PySCF installed into the sci conda env for it; its JSON is committed and read by the gates). The mathematics, with theorems, proofs and the measured numbers, is `research/MATH-CHRONUSQ-PORTS-2026-09-11.md`. The four modules are staged in tests/wiring.test.mjs's allowlist (warns at 14 days, fails at 60): their caller is the ABSORB / RT-HF card of the K wave, to be built from moview.js's nodes with Josh's eyes on it; that card is the next step, not this one. Laws learned: read peak positions from Im α, not S (the ω prefactor skews a Lorentzian by γ²/ω); damp a kicked trace to e^{−T/τ} ≲ 1e-5 or the window's sinc ripple (spacing 2π/T) is a forest of false lines; Magnus-2 is not time-symmetric, so forward-then-backward leaves an O(Δt²) residue — assert the ratio, not a number.

## 2026-09-12 · THE H₂O PROGRAM — two labs, four rounds, one oracle, and water in the tree

Josh: "Do an Opus 5 @ xhigh vs GPT-Sol @ high collaborative mathematicians going back and forth … reach all the way to at least an H2O model." The ledger is `research/MATH-H2O-2026-09-11.md` (Sol rounds 1 and 3 theorising on short briefs; Opus rounds 2 and 4 proving, computing and refuting by number; the lead's JUDGE and SYNTHESIS). What survived and what died is the synthesis's table; the headline: McMurchie–Davidson as Sol wrote it, proved and measured at 1e-14 against PySCF; the Boys tail replaced by a proved bound; real-time RHF on H₂O reproducing PySCF's RPA spectrum in all three polarisations with second-order convergence on nine lines; Sol's modified generators for Magnus-2 and MMUT confirmed, giving a closed-form timestep coefficient C_j that matches every measured line to 0.005 % and a core-line law a²(a−ω)/6; an exact-kernel pole fit whose certificate recovers a crowded line to 1e-15 on a clean trace and correctly refuses precision it cannot back on a real one; the model's own minimum geometry (r = 0.9894 Å, 100.03°); l = 2 already holding at 6-31+G* (23 Cartesian AOs, −76.017441376748 to 3e-14). Kills by number, both directions: the ledger's baseline energy (PySCF's internal STO-3G is eight digits; the pinned BSE decimals are the reference), Sol's timestep triple and A²B explanation, Opus's own secant derivative, and twice the lead's `eigSym` stop (the working constant is 1e-30‖A‖_F²). BUILT from the corrected contracts, each with a node proof against PySCF fixtures: `lab/md.js` (the engine, l ≤ 2, vendored BSE records under `lab/vendor/bse/` with SHA-256s), `lab/rhf-molecule.js` (SAD guess, aufbau, the A±B stability Hessian — N₂ lands on −107.495887883413 and its second aufbau solution at −106.766097415129 is reported by name), `lab/rpa-inspector.js` (ten roots to 8e-14, the 1/4/4 bright count, forbidden strengths at 1e-34), `lab/response-fit.js` (K_M, variable projection, the 4ε/σ certificate with refusal), `lab/molecular-field.js` (ρ(O) = 193.313905, twelve exponentials per point, Becke ∫ρ = 9.99999992, the 96³ sum 9.662692 asserted not a quadrature). Six molecules pass the suite: H₂O, LiH, HF, NH₃, CH₄, N₂. All five modules sit in the wiring allowlist dated 2026-09-12; their caller is B-H2O-8, the ABSORB / RT-HF card, which is the visual step and needs Josh's eyes. Corpus candidates CAND-07…14 are in the synthesis, unbanked.

## 2026-09-12 · CHEMISTRY — benzene on the screen

Josh: "It's a go, don't feel restricted by the frozen environment … Do whatever you must to get accurate Benzene on the screen." Two builders on one API contract, in parallel. BACKEND (`lab/field.js` +293, `lab/mathworker.js` +165, `lab/molecule-state.js`, `lab/molecular-field.js` `fieldShells`, `lab/density.js` `kickAlong`): a second WGSL compute kernel, MOL_WGSL, evaluates every contracted Gaussian shell per voxel (one exp per primitive per shell, reused across its Cartesian components: 12 for water, 54 for benzene) and contracts either the density matrix or one orbital column into the SAME rgba16float texture the ray-marcher already presents — texel (√ρ,0,0,0) for a density so `phase` reads flat, (ψ,0,0,0) for an orbital so `real` shows the signed lobes and `phase` reads 0/π; three pipelines by AO cap (16/40/64) with the χ tile in workgroup memory; benzene at 96³ dispatches in 2.88 ms, water in 0.51 ms (800 dispatches per measurement, because Firefox polls queue completion at ~100 ms and a 40-dispatch average is the poll). Worker ops `chem.solve` / `chem.rt.init` / `chem.rt.run` / `chem.rt.reset` / `chem.rt.spectrum` keep the ground state and the live propagator inside the worker (a fourth queue with a 300 s cap: the 8 s default would have handed benzene to the frame thread). WINDOW (`lab/chemview.js` 553 lines, `lab/rack.js` +65, `lab.css` +3): id `chem`, eyebrow CHEMISTRY, title "RHF · real time"; eight pinned presets H₂O NH₃ CH₄ HF LiH N₂ C₂H₄ C₆H₆ (6-31+G* for water); DENSITY / ORBITAL / Δρ on the field; kick axis, κ (registered `chem.kick`), KICK, RUN, SPEED (registered `chem.speed`), Δt, MMUT/MAGNUS-2, TDA and CORE switches; the spectrum canvas (Im α with RPA sticks, hover inspector, fitted poles only when certified); readouts; save/restore under `presentation.instruments.chem` (presentation only — the validated record is `__LW.chem.record()`). GATE `tests/chem.browser-test.mjs` (28 laws) + `tests/field-molecule.browser-test.mjs` (8): water −74.963023162862 in 308 ms off-thread, GPU ρ = CPU ρ at the same voxel to 0.03 %; BENZENE −227.891006464 on 36 AOs, the bright RPA pair 0.360792 with f 0.8127, the frame thread never blocked (2306 frames during the solve, worst gap 48 ms); 200 MMUT steps keep Tr(DS) = 42 and idempotency 1e-13; round-trip deep-equal; a screenshot. Then the integral rewrite (`lab/md.js`, mathematics unchanged): shell-pair tables built once, typed scratch, bra half-transform, one contraction per unique shell quartet with the 8-fold fill, primitive screening with proved Cauchy–Schwarz bounds (worst 3e-14, forty times under the gate), Boys by a Taylor grid that is MORE accurate than the series (6.19e-16 vs 7.19e-16): benzene integrals 40.06 s → 0.561 s, water 52.6 → 3.7 ms, fixtures to 1e-15 of the old module. Schwarz at the shell-quartet level kills NOTHING on benzene (42,486 of 42,486 survive at 1e-15) — all the screening gain is primitive-level. Seams the lead closed: the field's observable now follows the card (density → ρ, orbital → real, handed back on release; before this the density drew through the phase palette as one flat cyan); the phone top bar (menu words overprinting the mode pill at 375 px, rect 124,10,210,24 per Gemini) — `body.phone #badges` drops to a second row; `eigSym`'s stop 1e-30‖A‖_F². Gemini (agy, one image per call, `--print-timeout 8m`) passed the unfolded desktop shot on every law and gave the phone collision its rects. Known and open: benzene's whole `moleculeRHF` is now 5.6 s in node, SCF + stability Hessian, no longer integrals; idempotency reaches 8e-8 after 400 MMUT steps on benzene (Jacobi's eigenvectors at n = 72 — a Householder+QL path would cut it); the instrument cards open folded by the app's own convention.

## 2026-09-12 · MOLECULES and ORBITALS — the dropdown, the cap, and arg for a molecule

Josh: "What other molecules can we add? … this should be a dropdown menu … Have Benzene be the size cap, include large atoms as well … I want to be able to mess with LUMO and HOMO on a similar 91 thing spectrum … Chemistry can come with two windows … How can I get arg into molecules?" Two builders in parallel on one seam (the CHEMISTRY card's `solution()/subscribe()` hook, added by the lead first). LIBRARY (`lab/molecules.js`, `lab/vendor/bse/sto-3g-v1.json` now H–Kr with the superseded hash kept, `lab/oracles/sto-3g-v1.json` +54): 54 closed-shell molecules and ions in seven groups, every geometry with a named source (CCCBDB or a named gas-phase measurement; AlH₃ declared NOT A MEASUREMENT — it is this repo's own RHF/STO-3G scan), PySCF energies for all, and a cost model fitted by non-negative least squares to 54 measured solves: ms = 1.204e-4·(quartet-primitive trips) + 5.666e-5·(nocc·nvirt)²·nAO² + 10.8. THE FINDING: the model the lead named (AO count cubed) is wrong because it cannot see occupation — Br₂ at 38 AOs has 3 virtuals to benzene's 15, so its RPA costs 0.42 s to benzene's 4.2 s, and Br₂ is UNDER the benzene cap (4.0 s vs 10.1 s); the rejected fit is kept in the file so the finding is checkable. Nothing in the 54 is over the cap; CuH and ZnH₂ converge to RHF solutions whose singlet stability Hessian is negative (A+B −6.97e-3 and −1.88e-2), so they are listed and refused with the reason, PySCF agreeing on the sign. The MOLECULE control is paletteview's `<select class="sel">` with optgroups and rows like "C₅H₅N · 35 AO · ~8.1 s"; charge is wired through solve, rt.init and the worker cache key for the four ions. Out-of-lane edits, both forced: `rhf-molecule.js`'s AUFBAU table now runs Madelung order through 4p (it stopped at argon), and `scf.js` exits on a round-off floor (the absolute commutator residual scales with |F|, 485 on Br against 20 on H₂O, so Br₂ bottomed at 8e-12 and burned 200 iterations "unconverged"). REGISTER (`lab/orbitalsview.js`, `lab/field.js` complex orbital, `lab/rack.js` seams): the ORBITALS window is hydrogen's SPECTRUM for a molecule — the MO ladder (order-exact, gaps drawn to scale up to 3× the median so the O 1s at −20 hartree does not squeeze six levels into four pixels), click a level into the register, |c| and arg c dials per orbital, NORM, CLEAR, REGISTER ON takes the field and sets the phase observable; ψ(t) = Σ c_k e^{−iε_k t} φ_k is pushed as a complex AO vector each frame (the kernel writes (ψ_re, ψ_im)), so PLAY animates the beat at 2π/Δε; every readout says "frozen orbitals · beats at Δε, not at ω_RPA". Gates: chem 49/49, orbitals 24/24, molecules 8/8, field-molecule green; H₂O's HOMO+LUMO register measured on the GPU: arg ψ = 173.5° at t = 1 and the cross term flips at t + π/Δε (ρ 0.3846 → 0.1139, CPU 0.3849 → 0.1139). THE DISK: `research/DISK.md`, every research document in one markdown (38 documents, 1.38 MB, 215 artefacts indexed), built by `tools/disk.mjs`, rebuilt with every research commit; the disk-writer skill is now that format spec and nothing more.


## 2026-09-15 · Pointer ownership and final-frame persistence

Repository review assisted by OpenAI Codex. Six new browser regressions first reproduced:
a foreign pointer could steer/release an impulse; pointer cancellation applied that impulse
to the register; lost capture left the stage dragging; secondary mouse buttons rotated;
wheel line/page units were interpreted as pixels; and a notebook resize saved its old size
when release beat the next animation frame. Stage gesture ownership now lives in
`lab/stage-gestures.js`, while the rack retains camera/physics operations. Cancel, lost
capture, blur and hidden-page paths end a gesture without committing an impulse or fling.
Undo holds use pointer IDs so duplicate and unrelated releases cannot end another finger's
edit. Pinch handoff, fine drag, stale flings and intentional double-taps have executable laws.

Notebook and rack drags share `lab/frame-coalescer.js`: a burst of 40 moves applies the last
value once; release flushes before saving; a 32 ms fallback keeps a stalled frame from
stranding the hand. This measures scheduling, not a GPU frame-rate improvement. Explicit
ES-module metadata removes Node format re-detection, with a CommonJS boundary for the
prebuilt UMD vendor scripts. Offline hashes were regenerated. The review and remaining
MIR provenance/device-matrix findings are in `docs/REVIEW-2026-09-15.md`.


## 2026-09-15 · MIR adoption restored

Assisted by OpenAI Codex. Re-adopted MIR 1.1.3 from its clean source checkout at
`05155da7e5ca0d2a85383242722db1b84a774e1f` using `tools/adopt.mjs`. Only `lab/mir/kit.js`
differed: upstream adds configurable knob travel/fine sensitivity and logarithmic
faders with a displayed modulation value separate from the hand-owned value. The
adoption tool restored `MIR-MANIFEST.json`, covering all 29 toolkit/font files;
`--check` now reports "in step with MIR 1.1.3". No source changes in MIR were needed.

Added `tests/mir-manifest.test.mjs` to prove the exact inventory and content hashes
in every Node gate, including CI without a sibling checkout. It first failed on the
missing manifest. `tests/mir-controls.browser-test.mjs` measures the adopted controls
in Firefox: default knob drag 55 px = 0.25 travel, fine 90 px = 0.10; fine fader drag
half its width = 0.10; arrow = 0.01 and Shift+arrow = 0.0025. Those defaults passed
before and after adoption. The configured 110 px knob travel test failed before
adoption and now passes; a logarithmic 1–100 fader reaches 10 at its midpoint, and
show(20) keeps its base at 10. Reset defaults and clearing the display override pass.
The browser checks use synthetic control events; the existing input gate separately
exercises real WebDriver mouse and touch. The PWA hashes were regenerated.

## 2026-09-18 · MOLECULAR WAVES — the molecule becomes playable

A rival plan (`research/astra-2026-09-18/`) was judged and refined (`research/molecular-waves-2026-09-18/JUDGMENT.md`), the mathematics was certified by a proving lab against PySCF (`proving/LEDGER.md`), and five stages landed in one day, each behind the full gate.

- Stage 0, truth: the card's MMUT runs are really unrestarted and say so; the second integral pass and the duplicate stability Hessian are gone; the TDA ladder is its own list.
- Stage 2, preparation: a Householder–QL eigensolver (`lab/linalg.js`), stability by Cholesky, RPA by one eigenproblem ($A-B=LL^{T}$, $W=L^{T}(A+B)L$), a staged solve. Benzene cold 9.27 s → 2.8–3.1 s in the browser. A Hermitian eigensolver that failed on degenerate spectra was found and rewritten: the shipped benzene z-kick run reached 54.26 electrons; it now holds 42.000000000001.
- Stage 1, the funnel: `lab/molecular-session.js` is the one owner of the molecular volume; a `signed` kernel kind; CHEMISTRY's DIFF is formed in double precision (the old two-volume road returned zero at the peak voxel).
- Stages 3 and 4, the REGISTER window (`lab/registerview.js`): one window, an ORBITAL | STATES switch. STATES (`lab/statesview.js`, `lab/molecular-register.js`) is a register over the many-electron states $S_0$ and the singlet CIS states in a canonical gauge (`lab/canon-gauge.js`, the worker's `chem.states`), exact in closed form and $N$-representable at any amplitude. Hydrogen's lanes, a dipole scope, presets by rule (BEAT, RING, LISSAJOUS, DARK, KICK X/Y/Z; HOMO + LUMO and WINDING in ORBITAL), A/B stores with a geodesic MORPH, CHANGE and DENSITY views against a GROUND or MEAN reference, nine-plus-eight modulation targets (`reg.morph`, `reg.amp1…8`, `reg.ph1…8`). A TDA stick clicked in CHEMISTRY is played. Benzene's RING is a dipole of constant length turning once every 389 attoseconds.

Not built: the TD-CIS drive (stage 5) and FLOW from $\operatorname{Im}D$ (stage 6). Carry-overs still open: `rack.js` passes `molecule: chem.on` beside the session; `chem.run(n)` never sets `running`; CuH and ZnH₂'s non-convergence is unspoken; the AO → MO transform is the next preparation cost. Degenerate ORBITAL pairs are not yet in the canonical gauge, so WINDING's starting phase depends on the eigensolver (its winding does not).

Gate: `./test.sh all` — node 0, browser 0, 1048 passing lines, 0 red.

## 2026-09-18 · MOLECULAR WAVES, stages 5 and 6 — the drive and the flow

- THE DRIVE (`chem.drive.*` in `lab/mathworker.js`, the DRIVE controls in `lab/statesview.js`): TD-CIS in the length gauge on the whole singles space, $i\dot b=[\operatorname{diag}(0,\omega_K)+E(t)R]b$, by a Strang step with $R$ diagonalised once per axis. Unitary to $10^{-12}$, second order (halving ratio 4.03), and a negative step is the inverse, so a scrub backwards un-propagates. It resonates where the sticks stand: water's bright line reaches 0.99975 at $\pi/\Omega$ with $\Omega=E_0\mu$; a circular field fills benzene's bright pair equally, a quarter turn apart. $\omega\to$ LANE tunes it; $E_0$ and $\omega$ are live modulation targets (`reg.e0`, `reg.w`). Benzene's 316-state drive costs 0.3 s to prepare and about 1 ms a step.
- FLOW (`lab/molecular-flow.js`, the particle overlay generalised to a pluggable source, a `#flow` stage canvas): 220 tracers ride $\mathbf v=\mathbf j/\rho$ with $\mathbf j=\sum\operatorname{Im}D_{pq}\chi_p\nabla\chi_q$. Gated: analytic AO gradients, the sign against $\operatorname{Im}\bar\psi\nabla\psi$, the ring's sense and its reversal, zero angular momentum for a linear slosh. MEASURED and not hidden: continuity is violated at order one in STO-3G (1.19), and the integrated current is parallel to the dipole's rate of change but 0.15 of its size for benzene. FLOW's sense is exact; its magnitude is qualitative in a minimal basis, and the stage caption says so.
- Carry-overs closed: one owner flag for the molecular volume; a scripted `chem.run(n)` is the `tdhf` model; CuH and ZnH₂'s refusal names their non-convergence.

Gate: `./test.sh all` — node 0, browser 0, 1061 passing lines, 0 red.

## 2026-09-18 · MOLECULAR WAVES — the orbitals' gauge and the transform

- `canonicalOrbitals` (`lab/rhf-molecule.js`): every degenerate orbital level and every sign is fixed by the same rule as the states, with one family (the Löwdin coordinates of $S^{1/2}C$). The node gate rotates and sign-flips benzene's twelve degenerate pairs and recovers the solver's own $C$ to $3\times10^{-16}$; the density does not move. WINDING's starting phase and a saved ORBITAL register are now reproducible across solves and eigensolvers.
- The AO → MO transform inside `hessianBlocks` runs over contiguous memory: 581 ms → 178 ms on benzene, checksum identical to ten decimals. Benzene cold in the browser, solve and state ladder together: 2.24 s.

Gate: `./test.sh all` — node 0, browser 0, 1062 passing lines, 0 red.

## 2026-09-18 · MOLECULAR WAVES — the last open items

- FLOW follows whichever model is playing: the STATES register, the ORBITAL packet, or CHEMISTRY's real-time run (the worker ships $\operatorname{Im}D$, negated on the way in because `density.js` keeps the transpose-conjugate convention; the node gate holds the sign and a run's tracers ride the run's own clock).
- Excited-state absorption: `chem.drive.coupling` gives $\langle A\vert\mathbf r\vert B\rangle$ between any two lanes and $\omega\to$ LANE tunes to the gap between the selected lane and the most populated other one. Water, from a pure $S_3$: 0.999 into $S_4$ at $\pi/\Omega$, $S_0$ untouched.
- 6-31+G\* widened from H, O to H, C, N, O, F (byte-identical H and O shells, both hashes named); nineteen molecules agree with PySCF to $3\times10^{-12}$; the card offers it for the eighteen at or under 46 Cartesian AOs. The register runs in it (ammonia: 100 states in 0.28 s, its E pair rings).
- MEASURED, and against the expectation recorded that morning: the larger basis does not close FLOW's magnitude gap (ratios 0.57–1.54 in STO-3G, 0.60–1.43 in 6-31+G\* for water's lowest bright states). It is the TDA's own length and velocity gauge disagreement.
- The README's limitations table now separates the release from this branch.

Gate: `./test.sh all` — node 0, browser 0, 1067 passing lines, 0 red.

## 2026-09-18 · A knob with a macro on it

The commissioner's report: the arc is not aligned with the knob, small dials are everywhere, and there is no easy way to take a macro off. Cause: the kit seats a range dial beside every routed dial and slides the dial 10 px left to make room (`lab/mir/modulation/modhost.css`), so the dial and its arc sat off-centre under the label and the small dial covered the right of the arc; removal was a double-tap or a 450 ms hold on an 8-px ring band. The kit is not edited. `lab/lab.css` out-ranks it by one `:root` and `lab/modwindow.js` adds the behaviour: a routed dial stays centred; only the control the hand last touched wears its range dial and a ×; a held press or a right-click on the dial itself opens the pop-over (REMOVE, REMOVE ALL, RESET); the × removes the selected macro's route. The REGISTER's lane phase needles are re-tagged as drop targets whenever lanes are rebuilt. Gate: `tests/routed-knob.browser-test.mjs`, real pointer events. The upstream home of this fix is MIR.

Gate: `./test.sh all` — node 0, browser 0, 1072 passing lines, 0 red.

### wave 108: MOLECULAR WAVES becomes the 0.2.0 alpha release, with one visible molecule window

The newer RHF and real-time card is named MOLECULES. The ORBITAL | STATES window is
MO-REGISTRY. Their saved window IDs (`chem`, `orbitals`), modulation target IDs,
`reg-*` and `mol-*` CSS hooks, and project records stay in place. The earlier H₂⁺
card is hidden from the ordinary window pickers; a project that saved it as the
active field owner reveals its controls on load, even if its layout had the card
closed. The longer MO-REGISTRY switch has its own row at rack width. The browser
gate checks the visible names, the retired card, and a legacy save round trip.

### wave 109: The frame follows painted windows, not invisible layout boxes

The modulation window's outer `#modwin` box is transparent, but the stage's
WebGPU line pass treated its whole 1083 × 440 rectangle as opaque. That cut
LATTICE, BOX, DOTS and the axes out of the gaps between devices, below the
work bars, and wherever the window was moved. The floating chip rail and
disconnected rack cards had the same rectangular-mask error. Occlusion now
uses the actual modulation rail, source cards, work bars and individual chips;
disconnected rack windows use their head and body surfaces, while joined cards
still use their one pane. Scrolled-away modulation cards are clipped to the
run. Movement and scrolling schedule a PRESENT frame even when paused, so the
mask cannot trail the window. `tests/frame-occlusion.browser-test.mjs` checks
all three frame modes, a real mouse drag, and detached versus joined cards.

### wave 110: The LFO is editable when it opens

A new LFO now starts on MIR's actual editable SINE breakpoint preset, with its
SINE button and label selected; it no longer displays an analytic sine while
asking for a preset before editing. Explicitly selected analytic waves and old
saved `shapeMode` values remain intact. MIR 1.4.3 also makes a double-click on
a tension handle reset that segment to zero, for both LFO and ENV, alongside
right-click. The host asks MIR's shared gesture interpreter, hit-tests in SVG
coordinates, and repaints immediately while paused. The browser gate drives
real mouse double-clicks on both kinds of handle; the model gate checks the
default and a saved-shape round trip.

### wave 111: Official first-run defaults and palette-aware WAVE colours

Fresh desktop profiles now open with STATUS TAGS, STAGE CAPTIONS, HELP and
window notes off, but CONTROL HINTS, AUTO SCALE, DOMAIN AUTO and GOVERNOR on.
The appearance defaults are LIGHT, REFRACTIVE, FROST ALWAYS, 22 px blur and
50% VIVID. The phone's existing reversible frost-off rule still protects its
render budget. Saved explicit browser choices retain their meanings, including
older TINTED/OFF/10%-vivid combinations and per-window note visibility.

In WAVE, ρ=|ψ|² now takes the palette colour at θ=0 (after HUE rotation),
while Δρ gain/loss take −π/2 and +π/2, as Re/Im already do. With PALETTE
off, both retain their original colours. A real Firefox/WebGPU proof varies
those three palette seats independently and checks the rendered image hashes,
then reloads an explicitly customized profile to check preference preservation.

### wave 112: A floating MIR keyboard and collision-safe camera controls

The keyboard manual is a 1080 × 590 draggable glass window with the app's
light/dark and card/frost tokens, a layered five-row keyboard, Shift/Ctrl
badges, and a searchable, categorized action catalog. Its position is a local
preference, not part of a project save. The stage's frame occlusion follows
the painted keyboard pane on open, drag and close, including while paused.

Q/E dolly the camera; Shift+Q/E changes field of view without translating the
camera; Ctrl+Shift+Q/E counterchanges distance and field of view so apparent
scale is held (a dolly zoom). WASD orbit deltas ease to their target over
successive presentation frames, without moving the simulation clock. The
single binding law rejects reserved keys and overlapping shortcuts, including
an unspecified Shift binding overlapping both Shift states. The settings
capture and keyboard manual share that law; explicit steal atomically unbinds
the old action. Old saved bindings are validated on load. The browser gate
checks drag, occlusion, all Q/E layers, easing and rebinding; the Node gate
exercises the binding law without a browser. Design draft:
https://www.figma.com/design/RLCuo7Pb6ikE0RqTGqGIoZ

### wave 113: The keyboard gives its editor the space, not a footer

The keyboard window keeps the drawn board, platform switch, modifier legend,
searchable actions and collision-safe rebinding. The eyebrow, redundant column
headings, binding count, drag instruction and persistent footer help are gone.
RECORD INPUT and RESET TO DEFAULT sit together above the action search where
the screenshot's arrows pointed; feedback appears there only while an action
needs it. The pane is 60 px shorter, follows the existing MIR skin and
occlusion law, and remains a one-column action editor on narrow screens.
The browser gate checks the absent chrome, relocated working controls, drag,
rebinding and reset.

### wave 114: The keyboard takes the shape of its keys

The desktop keyboard pane is 440 px tall instead of 530 px. Its five key rows
now sit within about 15 px of the modifier legend and the well's lower edge,
without shrinking their 52 px targets. The window, keycaps, search, action
list, chips and editor controls have no hard borders: the existing glass tint
and raised/inset skin tokens carry their depth, with visible focus glows still
available for keyboard navigation. The phone keeps its taller action-only
editor. The browser gate checks the spacing and zero-width borders as well as
the controls and light/dark render.

### wave 115: The keyboard's legend and switch share a row

The active/unbound/modifier legend and the platform switch now share the same
top line; the switch uses a Command mark and a four-pane Windows mark instead
of long labels, while accessible names retain the full platform meaning. The
desktop pane is 416 px tall, and its five key rows retain full-size targets.
RECORD INPUT and RESET TO DEFAULT sit centered above search with no always-on
subtitles; recording guidance remains in the contextual status line. Keyboard
ink uses the house `--ink-key`/`--fg-soft` colors, and dark wells/keycaps use
the charcoal-blue glass tint rather than near-black overlays. The browser
gate checks the one-row arrangement, centered subtitle-free buttons, compact
geometry and the existing rebind/reset flow.

## 2026-09-24 · THE OPTIMIZATION RUN — buttery smooth, without changing anything

The commissioner's ask, on the frozen v0.2.3-alpha.3: "make it buttery smooth and usable **without changing or bugging
anything**" — window loading, resources when features are off, the engine, the refactors the old sessions left behind
(history checked before intent is inferred), boot, projects, stutters and breaks, the BOX at 256 axial modes, the
64³/96³/128³ grids and the other QUALITY options, and the display options that were said to be expensive. The run:
six Opus 5.5 audits (one lane each, every file read whole, every finding a number), a cross-refutation round where
each auditor read the other five, Sol's law check per plan item, the lead's rulings, six builders in isolated
worktrees with a gate on every commit, the lead's merges with the lock re-run after each. The record is
`research/optimization-2026-09-24/` (BRIEF, AUDIT-A…F, REFUTE-A…F, SOL-REVIEW, PLAN, BUILD-BRIEF, the probes, the
baselines and the after-benches); the summary and the commissioner's decision list are `docs/OPTIMIZATION-2026-09-24.md`.

The law of the run was kept by construction: every change is bit-identical (texels, DOM, saved bytes), or identical
output one thread or one round trip later, or a proven defect with its proof in the commit, or tooling. Two "almost
neutral" roads were rejected on the way (a factored `gas.stats` that flips a displayed `-0.00`; an autoScale reset on
pause that changes the paused image) and the one change inside fp16 precision but not bit-identical — the gas table —
ships opt-in, default off, for the commissioner's eyes. Everything that would move a pixel of the glass, a physics
number, a saved byte or a control is priced on his list, not built.

What the audits established: hiding the UI already reached the display cap at 96³; the Gecko frame under the default
rack is the compositor's 18 backdrop layers (≈ 7.4 ms, per layer, not per pixel — a look decision), the BOX at 256
axial modes was the compute kernel's Miller recurrence per voxel per mode (112.6 ms per reconstruct at 128³), the boot
was the serial GPU adapter request (415 ms) behind the module graph, every project open was a synchronous LADDER solve
for a closed card (0.46–1.5 s), and the loop's JavaScript was small everywhere but one 9–17 ms `gas.stats` frame every
24th. And ten defects with proofs: the no-GPU boot crashed; a device lost before the field existed was reported alive
or crashed the boot; a failed project open was half-applied, marked clean, and a plain SAVE overwrote the file; a GRID
change during an export was dropped; one thrown reader froze the loop for the session; three menubar rows did the wrong
thing; ABOUT's size was erased by the next preference; the occlusion mask ignored the canvas scale; the period-scan
worker could be jammed for minutes; and `perf.median` reported the last frame, so every earlier "loop median" was one frame.

Measured on the merged tree (RTX 3070; the exact numbers first, the compositor's after): the 128³ axial-gas
reconstruct 118.3 → 50.1 ms (→ 8.35 ms with the opt-in table); the present pass at 96³ 3.76 → 2.32 ms and at 128³
5.51 → 3.28; the BOX packet 11.3 → 6.0 ms at 128³; a LAUNCH press 182 → 36 ms; a project open 490 → 69 ms and a restore
463 → 43; cold boot ready 975 → 794 ms headless and 1055 → 812 headed; the WELL RADIUS drag 13 → 0.04 ms per move; a
HELIUM basis change while playing 254 → 7 ms; CHEMISTRY at 125 k samples 27 → 335 steps/s; the scan storm's jam 153 → 3 s;
the CAPTURE hover on the BOX 355–1274 → < 2 ms; idle timers 5 → 0 per 10 s. Electron: the default rack 92 → 116 fps, the
modulation window open 83 → 118, the 128³ axial gas 6.7 → 30 fps. Headed Firefox (the commissioner's compositor, ± 10 fps
run to run): the default rack 80.5 → 88–99, the 128³ axial gas 8.3 → 17.3, everything else at or above its baseline
within the spread; the rest of that frame is the glass, priced on his list.

Gate: THE DIGEST LOCK (1004 values) GREEN after every lane and every merge; `bash test.sh node` 77/77 after every
commit; the browser gate 119 GREEN / 0 RED on the merged tree (one timing-flaky suite, `current`, green on its solo
rerun as on the untouched base); `adopt --check` in step with MIR 1.4.3 throughout.

### wave 116: THE DIGEST LOCK — 1004 pinned readbacks prove the kernel, the present pass and the lines bit-identical

`tools/perf/digest-lock.mjs --write|--check`: 13 states × 3 grids of `fieldDigest` + `readPixels` at two sizes + the
packed-record hash, 120 view × style × flag rows and 26 FRAME rows, every input pinned (the jitter seed on the
synchronous half of each readback, governor and AUTO SCALE off, the clock frozen, occlusion explicit), recorded on the
base tree and asserted equal after every change. The fixture is this machine's; the tool is the gate. It caught one
thing on the way: the plain geometry memo let the compiler fold `length(q)²` back to `dot(q,q)` and moved 194 texels
of the oscillator — the memo re-derives r in its old form and 0 texels differ on 12 states × 3 grids in both browsers.

### wave 117: The kernel remembers — bit-identical memos, the well's wall as a branch, persistent gas records, a 3× wellPacket

`COMPUTE_WGSL` memoises the geometry per centre, P_l per l and e^{imφ} per m across the modes that share them, and
tests the well's wall with a branch instead of a `select` that ran the recurrence for the 58 % of the volume outside
it: the axial gas 112.6 → 46.8 ms at 128³, the BOX packet 5.67 → 2.74, 91 labels 4.32 → 3.40, 0 texels differ. The gas
keeps its 256 records for the session (178 KB → 72 B of heap per reconstruct), builds its f64 tables on first use with a
one-shot idle warm, and marks them stale on a radius change instead of rebuilding on every pointermove of the WELL
RADIUS knob (13 → 0.04 ms per move). `wellPacket` computes each of its 21 distinct Bessel and 21 Legendre factors once
per point (182 → 36 ms per LAUNCH or OPERATOR → BOX press, `Object.is` on every output; the worker's bow inherits it).
The FRAME's lattice and dots carry a 16-byte vertex with the ink in a uniform, and the box, axes and slice lines leave
the camera out of their cache key (300 → 1 chrome uploads per 300 camera turns). `throughput({ targetMs })` sizes a
batch so Firefox's 100 ms completion tick cannot be read as a sub-millisecond GPU number.

### wave 118: The present pass specialised by view and style, exports pinned to the generic pipeline

`RENDER_WGSL` carried six views × eight styles × finish × bow as uniform branches inside a 160–240-step loop. A pipeline
per (view, style) with the bow and glass-finish branches removed by selection — 48 at most, compiled asynchronously,
the generic one drawing until each lands, a failed compile failed for good — renders the same bytes in 3.25 ms instead of
4.87 on the boot's phase/cloud view at 96³ (density/cloud 3.67 → 2.10, real/cloud 3.52 → 1.90; grain, dust and bands
−28…−35 %); every one of the 48 pairs is bit-exact in both browsers. render-exact and capture pin the generic pipeline
for a whole run, so an export can never straddle a compile: two exports of one state stay byte-identical, as Final II
promised.

### wave 119: The axial gas's Hermite table, opt-in and default off

j_l(k r) = j_l(z u) with u = r/a is a fixed function of (l, n_r) on [0, 1]: 256 rows × 256 samples of (j_l, its
derivative), cubic Hermite in the kernel, built once per session in idle slices and uploaded once, each record carrying
its row (l·16 + n_r, encoded row+1 so the flag-off bytes are today's). ON, the 128³ reconstruct is 8.35 ms instead of
46.7 (96³ 3.76, 64³ 1.17), every texel at most 1 fp16 ulp from the f64 value where the recurrence was 17–41, and at most
0.022 % of pixels move by one level (one present's jitter moves 2.4 %). It is not bit-identical, so it ships OFF:
`?gastab=1` or `__LW.gasTable(true)`; the lock proves OFF is today's picture to the bit.

### wave 120: The GPU is asked for from the head of the page, and a lost device says so

`lab/gpu-boot.js`, an async module script before the stylesheets, requests the adapter and the device with wave 58's
limits while the 104-module graph loads; createField takes that one request (single-use, so a second field can never
share a device another disposes). Cold headed Firefox: ready 1180 → 817 ms; the run's own measure 1055 → 812; headless
975 → 794; Chromium ~−50. With it, two latent defects: a device lost before the field existed was reported alive by
Chromium (the final `ok: true` overwrote the loss) and crashed Firefox's boot through the WGSL-error return, and the
"WebGPU unavailable" banner overwrote a lost device's own — all three roads now say `device lost`, and the no-GPU boot
that threw at `setDprCap` shows the banner it was designed to show (the method-form guard, byte-identical after a loss).

### wave 121: A project opens without solving the ladder, and a failed open leaves the instrument as it was

`ladder.load()` seats the card's params on restore and schedules the worker instead of solving on the frame thread
(`set()` untouched for its callers): a project open 1479 → 38 ms at n̄ 42, the quick LOAD 1473 → 37, the default file
490 → 69. A malformed project used to half-apply, mark itself clean and let a plain SAVE overwrite the stored file — or
the previously current good one; open() now snapshots, rolls back on failure, keeps the current project and notebook
and the dirty state, and says "open failed". The ABOUT face keeps its size across a preference change (the fourth
instance of one carried-keys hole, named in the comment). paintMarks runs once per boot and once per open instead of 7
and 11. chemview fetches its record module on the first solve, the PySCF oracles live under tests/, and modules that
wiring proves unreachable are left out of the precache by a rule derived from wiring's own allowlist (201 → 190 files,
5.26 → 4.49 MiB per new visitor).

### wave 122: The loop cannot be frozen by one throw, and the readers stop hitching

`loop()` runs in try/catch/finally, reporting once per distinct message and never hot-looping while paused; the perf
ring holds a median again (`LW.perf.loopMedian` times the whole loop). The export lock records a REBUILD it used to
drop. The transport's link retry keeps its law but no longer repaints the closed modulation window once a second; under
H the occlusion burst reads nothing and sends `[]` once; the kick warm chain stops when warm and re-arms on an
OPERATOR switch (idle is now literally zero); the period scan runs one at a time to the latest key and tracks a timed-out
scan to its late reply (a 153 s worker jam → 3 s; scans over 8 s land at all); the CAPTURE hover asks the worker and
paints when the plan lands (355–1274 → < 2 ms on the BOX; ⟳ and G stay forced); CALCULUS updates its rows in place. The
occlusion mask follows the canvas scale (it was 2.9× too large after AUTO SCALE, and stale at every boot).

### wave 123: The windows and the workers — the closed modulation window asks for no layout, the cards solve off-thread

The closed modulation window's paint and place answer their rect reads with the zero rect `display:none` already gave
(the compact ENV's time-scale fit kept; the house-knob rings kept), `expand()` opens once (33.6 → 23.2 ms), paint writes
only the words that changed, and the grip places once per frame (14 → 0 rect reads per pointermove). HELIUM's basis is
solved by the worker only, the field keeping the last basis meanwhile and exports forcing the fresh one (254 → 7 ms
stall). CHEMISTRY RT keeps one spectrum in flight paced by its own cost and fits its poles in the chem worker (27 → 335
steps/s at 125 k samples). kick.js memoises its radial integrals per (n, l) pair (the K key 13.7 → 1.7 ms warm, 1104
`Object.is` checks). `gas.stats` runs in the maths worker on its own tables and paints when it lands (the BOX's 9–17 ms
frame every 24th → none; 61/61 readout strings identical).

### wave 124: The menubar calls its functions, and the code the waves left behind is gone

Three menubar rows reached their controls by label text and key code and did the wrong thing (RESEED reset the camera,
RESET KEYS clicked a trigger deleted on 2026-09-08, CLEAR pressed whichever of five CLEARs came first in the DOM — the
undo ring's, with HISTORY floated); every row now calls its function, its key hint comes from `keyFor`, CLEAR is
STATE's, and a throwing row still closes the bar — `tests/menubar.browser-test.mjs` clicks every row and, run against
the old rack, catches every one of those defects. The build line says what it is. 134 CSS selectors that no code could
ever match (98 of them the wave-52 modulation card whose JavaScript wave 64 deleted) are gone with 0 stylehash
changes over 4 607 elements × 4 states; the five live second-tier selectors lane C found were kept. The SETTINGS-KEYS
remnants left the dispatcher (the `keysheet` alias and action id stay for their readers); seven write-only bindings
went after a fresh reader search (`LW.version` stays: an export reads it). The app imports the kit's palette and
notebook modules instead of its byte-identical copies, and wiring's allowlist shrinks by three. The last closed-card
construction reads (h2view, chemview, and modDodge's pill read) are guarded like the others: forced layout reads
before ready 33.2 → 0 ms. And nine low-coupling blocks left `boot()` for their own modules — motion-pref, busy-mark,
worker-pool, accent-wheel, sw-client, badges, rack-menus, menubar, window-chrome — one commit each with the lock, the
node suites, the serialize bytes and the stylehash green after every one: rack.js 6238 → 5635 lines, no new globals.

### wave 125: The commissioner's three rulings — the gas table by default, AUTO SCALE home on pause, tinted glass for a phone's first visit

Josh read the run and ruled (2026-09-25 morning): the Hermite gas table becomes the default, since it touches only the
BOX's axial-gas basis and nothing a first visit shows (`?gastab=0` and `__LW.gasTable(false)` opt out; the table is armed
at boot but built only at the first AXIAL launch, in idle slices, and an export in flight defers its landing so a
render-exact run never switches kernels midway). The BOX at 128³ runs at 73.5 fps in Electron where it ran at 28 after
the exact trims and 6.7 before the run; the first AXIAL press costs 19 ms, the same as before; the lock has a second
fixture with the table on, and the old fixture with `--query gastab=0` still proves everything else exact. AUTO SCALE
returns to 1 on the playing→paused edge, once, with a PRESENT — and its measurement window restarts on that edge, because
a paused pointer drag presents frames without new intervals and would otherwise walk the scale from 0.85 to 0.35 on the
stale playing average; a 3 s paused drag now stays at 1. And a NEW user on a phone or a tablet meets tinted glass with
frost OFF (`lab/first-run.js`, a pure function of the app's own phone/tablet predicate; the desktop's refractive frost
ALWAYS is unchanged; stored choices win, and the phone's frost override at the crossing stays) — proven in headless
Firefox with its own touch prefs, no stubs: tablet and phone newcomers tinted/off, a returning refractive choice kept.
CLEAR stays STATE's. The glass on the desktop stays exactly as it is.

### wave 126: The iPad afternoon — the loop paced to the GPU, AUTO SCALE as one rule, the tablet's own quality

The commissioner opened the release on his M5 iPad Pro over the LAN and it "lagged like hell", was fine after a toggle,
and collapsed to ~5 fps every few seconds during play. No Mac, so the app measured itself: `?report=1&post=1` loads
`tools/perf/device-report.js` (one dynamic-import line in rack.js, nothing precached), plays scripted scenes with
250 ms bins, and posts the JSON to `serve-lan.py` (`research/device-reports/`). Two reports said what a desktop could
not: Safari's rAF runs at 58.8 Hz whatever the GPU does (a WebKit preference caps it near 60), while the present pass at
the stored quality (64³ at the boot seed's 160 steps and scale 1, 2400×1671 device pixels) costs 28 ms — the loop
submitted 60 frames a second against a GPU finishing 35, the queue ran 313 ms deep, and the page stalled while it
drained. AUTO SCALE and the governor read rAF intervals, so on Safari they were blind. And AUTO SCALE's own controller
was paced in frames (a decision per 24 loop frames, ±0.1 fixed steps, from scale 1 at every play), so on a slow device
its ramp took 10–30 s.

Three subtractions, under the commissioner's rule that nothing is added to go faster. AUTO SCALE is ONE inline rule:
every 250 ms of presented frames, outside the band it jumps once to the scale that meets the budget
(scale·√(target/median), ≤ ×0.5 down, ×1.15 up, on the 0.05 grid rounded toward the current scale) and then holds; the
two counters, two branches and fixed steps are gone (rack.js one line shorter; convergence 12.6 s → 1.05 s in
simulation, 10.3 s → 0.87 s on the 128³ gas in Firefox; canvas resizes 37 → ≤ 3, which matters because WebKit
reallocates the canvas on every resize). The loop is paced to the GPU where completion is prompt: createField probes an
empty submit at a drained moment (Firefox's 100 ms completion tick reads as not prompt and is left alone), field.js
counts frames in flight, and the rAF path holds a present at four in flight (Chromium runs four on its own; holding
lower cost it 1–8 %), carrying the tier whole to the next frame — presents equal completions, rAF intervals become
honest, and the two controllers see the GPU on Safari (on a Safari-like loop: queue 20–26 → ≤ 4, AUTO SCALE steps at
0.55 s where it never moved). Exports are untouched; the desktop's lock stays GREEN. And quality belongs to the device:
a tablet's first run is the GRID pairing's 64³ (110 steps, scale 0.75 — the report measured it at 11–13 ms, ~80 fps
GPU-bound on the M5, where the desktop seed's 160/1 was 28 ms), a file cannot push a tablet past 96³ or a phone past 64³
or switch AUTO SCALE off anywhere, and the bundled WAVE DANCER demo carries no quality (it shipped a desktop's 128³ with
AUTO SCALE off, so every iPad that opened it lagged). The desktop's first run is unchanged.

Also from the research (`WEBKIT-FPS-RESEARCH.md`, sourced): 120 Hz needs Safari's "Prefer Page Rendering Updates
near 60fps" feature flag off; Safari 26 stalls ~220–270 ms on a render pipeline's first use (measured on the iPad per
new view or style; a warm-up at idle is the pixel-identical remedy, the commissioner's call); each backdrop-filter
panel is its own Core Animation blur. Playable snapshots of every release now live in `~/Documents/LAMBDAWAVES-RELEASES/`
(`tools/snapshot-release.mjs`, a RELEASING.md step).
