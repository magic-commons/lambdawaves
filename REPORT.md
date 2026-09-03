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

**Labels.** LADDER is EXACT · SPECTRAL and says on its face that the FIELD cannot draw n > 6; its dashed curve is a
PREDICTION at cubic order with the neglected quartic printed. ORBIT is EXACT. VORTEX is EXACT on the sampled
circles and claims nothing between them; the census is offered only for stretched three-mode states and refuses
everything else. STARK ROTATE and DEFECT WAIT live in STATE and change c (the badge says so); the camera never does.

**Honest gaps of 0.1.** STARK ROTATE is about z only (K_x, K_y would give the full SO(4)); the vortex overlay is a
point cloud, not connected curves; the ladder's prediction neglects the chirp off x = 0 and the quartic; the
census does not cover non-stretched or four-mode states (the print's generic reconnection is in the research
probes, not in the instrument); the F_q shell law is a sheet paragraph.

## What QWAVE-0.x should add (in order)

1. **Probability current** as a third field product (compute ∇ψ on the grid, render as flow lines or as a coloured quiver on the slab) — the honest way to *see* the 2p₊ current and the dipole's charge sloshing.
2. **Rydberg revivals** — raise the basis ceiling for a Rydberg-only register (the exact core costs nothing; the kernel already takes tables) and show T_cl, spreading, fractional revivals, T_rev = 4πn̄⁴/3 with the spectral origin highlighted on the ladder.
3. **KS 4D shadow / Fock S³** — the second exact representation family (§15): a `KS OSCILLATOR` view with its own status label and fictitious time clearly not the lab time.
4. Packet launch by projection, general D^l(R) state rotation, rack drag-reorder, MIR descriptors for the existing parameters (ids are already stable: `observer.*`, `material.*`, `state.mode.h:n:l:m.*`, `transport.*`, `field.resolution`).
