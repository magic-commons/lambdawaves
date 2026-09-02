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

**`tests/boot.browser-test.mjs` — headless Firefox WebGPU — 23/23 GREEN** (~70 s). Boots without errors,
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

## What QWAVE-0.x should add (in order)

1. **Probability current** as a third field product (compute ∇ψ on the grid, render as flow lines or as a coloured quiver on the slab) — the honest way to *see* the 2p₊ current and the dipole's charge sloshing.
2. **Rydberg revivals** — raise the basis ceiling for a Rydberg-only register (the exact core costs nothing; the kernel already takes tables) and show T_cl, spreading, fractional revivals, T_rev = 4πn̄⁴/3 with the spectral origin highlighted on the ladder.
3. **KS 4D shadow / Fock S³** — the second exact representation family (§15): a `KS OSCILLATOR` view with its own status label and fictitious time clearly not the lab time.
4. Packet launch by projection, general D^l(R) state rotation, rack drag-reorder, MIR descriptors for the existing parameters (ids are already stable: `observer.*`, `material.*`, `state.mode.h:n:l:m.*`, `transport.*`, `field.resolution`).
