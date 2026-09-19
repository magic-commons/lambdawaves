# The register window — specification, draft 0

Fable · 18 September 2026 · commissioned by Josh · companion to `JUDGMENT.md` (stages 3 to 5 of its §7)
Status: draft 1. The four open items of draft 0 were settled by the commissioner on 2026-09-18 (§11); "OPEN n" marks in the text are resolved there.

## 0 · What it is

One window, the molecular counterpart of hydrogen's SPECTRUM rail, with a two-position switch:

- ORBITAL: the one-electron packet over canonical orbitals that ships today as ORBITALS. It has a phase, beats at orbital gaps $\Delta\varepsilon$, and is labelled as such.
- STATES: the many-electron register of `JUDGMENT.md` §3 over the ground determinant $S_0$ and the singlet excited states $S_K$. It beats at the excitation energies the spectrum shows, and is a valid $N$-electron state at any amplitude.

The two modes share every control: ladder, lanes, NORM, CLEAR, A/B stores, MORPH, presets, modulation slots. Each mode keeps its own register; the switch chooses which one the molecular session plays. Window id stays `orbitals` so saved layouts survive; the eyebrow becomes REGISTER (OPEN 1).

## 1 · Layout

```
┌ REGISTER · benzene ───────────────────── TD-CIS · frozen nuclei · STO-3G ┐
│ [ ORBITAL | STATES ]      PRESET ▾      A   B   MORPH ◔     REGISTER ON ◉ │
│ ┌ ladder ─────────────────────────────────┐  ┌ dipole scope ───────────┐ │
│ │ 0.41 ─ ─                                │  │          ·  ·           │ │
│ │ 0.39 ━━ ━━    bright pair  f 1.28       │  │       ·        ·        │ │
│ │ 0.31 ─                                  │  │       ·        ·        │ │
│ │ 0.28 ─                                  │  │          ·  ·           │ │
│ │ 0    ━━━━━    S₀                        │  │  μ(t) traced in plane   │ │
│ └─────────────────────────────────────────┘  └─────────────────────────┘ │
│ HIDE   + STATE   CLEAR   NORM                                            │
│ S₀    ground            |b|² ▮▮▮▮▮▯▯▯   φ ◔            M  S              │
│ S₄x   0.3903  f 1.28    |b|² ▮▮▯▯▯▯▯▯   φ ◑            M  S  ×           │
│ S₄y   0.3903  f 1.28    |b|² ▮▮▯▯▯▯▯▯   φ ◕  (quarter turn = ring)  ×    │
│ VIEW [ CHANGE | DENSITY | FLOW ]        REF [ GROUND | MEAN ]            │
│ Σ|b|² 1.000    BEAT 16.10 a.u. = 389 as    μ ( 0.30, 1.87, 0.00 )        │
└──────────────────────────────────────────────────────────────────────────┘
```

Every node is an existing kit node (`device`, `sw`, `knob`, `fader`, `readout`, the SPECTRUM lane), reused and never copied. The lane is hydrogen's lane: energy, population fader, a live phase needle that keeps turning while the clock plays and takes a drag as an added phase, MUTE and SOLO as reconstruction masks, remove.

## 2 · The ladder

- ORBITAL: the MO ladder as today ($\varepsilon_k$, occupied filled, virtual hollow, order-exact compressed axis).
- STATES: $S_0$ at zero and the excitation ladder above it. Stick weight encodes oscillator strength, so bright states read at a glance and dark ones sit dim; hue encodes the transition-dipole direction ($x$, $y$, $z$ mixed as three hues), which is the molecular stand-in for hydrogen's colour by $n$. Degenerate levels are drawn side by side. The same compressed axis absorbs the core excitations near 10 to 20 hartree. A BRIGHT ONLY filter keeps benzene's 315 states navigable.
- Click adds or removes a state. Clicking a stick in CHEMISTRY's absorption spectrum does the same, and populations $\lvert b_K\rvert^2$ light the sticks there, so the two windows are linked the way hydrogen's STATE and SPECTRUM are.
- One law for coherence: the sticks on screen belong to the model that is playing. STATES shows the TDA ladder; a real-time TDHF run shows the RPA ladder.

## 3 · Lanes, and how a ring is made

Up to eight lanes, because eight is the number of modulation slots (§6). In STATES mode the $S_0$ lane is pinned first: without it a single excited state is stationary, and the slosh of a bright line is the $S_0$–$S_K$ cross term.

Degenerate levels are given a canonical gauge so that a lane means the same thing on every solve and with every eigensolver (§7): inside a bright degenerate pair the basis is rotated until the transition dipoles lie along fixed axes, and the lanes are named by that axis, $S_{4x}$ and $S_{4y}$. Then the physics is on the phase knob:

| phase of the $y$ lane relative to the $x$ lane | motion of the charge |
|---|---|
| $0^\circ$ | linear slosh along the diagonal |
| $90^\circ$ | ring current, one sense |
| $180^\circ$ | linear slosh along the other diagonal |
| $270^\circ$ | ring current, the other sense |

Measured on benzene (`probe-fable.mjs`): at $90^\circ$ the dipole keeps constant magnitude to $4\times10^{-12}$ and turns uniformly at $\omega_K$. An LFO on that one knob sweeps linear to circular to counter-circular. The alternative, a single pair lane with dedicated ELLIPTICITY and TILT knobs, is OPEN 2; the recommendation is the uniform lanes above, because they are hydrogen's lanes unchanged and they teach the mechanism.

The same holds in ORBITAL mode for a degenerate orbital pair (benzene's HOMO and LUMO are both pairs): a quarter turn gives an angular-momentum orbital whose phase winds around the ring under a stationary density.

## 4 · What the field shows

| VIEW | product to the field | note |
|---|---|---|
| CHANGE (default in STATES) | `signed`: $\operatorname{Re}D(t)-D_{\rm ref}$ | two-colour lobes, like an orbital's REAL view |
| DENSITY | `density`: $\operatorname{Re}D(t)$ | honest but quiet: the carbon $1s$ cores set the scale, and one moving electron in 42 is a small change |
| FLOW (stage 6) | current $\mathbf j$ from $\operatorname{Im}D(t)$ | feeds the existing streamline and particle overlays |
| PHASE (ORBITAL mode only) | `orbital`: $c(t)$ | as today |

REF chooses the reference of CHANGE: GROUND is $D_0$; MEAN is the stationary part $\sum_{E_A=E_B}\overline{b_A}b_B\gamma^{AB}$, which leaves exactly the interference terms on screen, the pure dance. The default view is OPEN 3; the recommendation is CHANGE against GROUND.

Rendering always uses the normalised register $b/\lVert b\rVert$, so Proposition 1's guarantees hold on screen; the readout shows the raw $\sum\lvert b\rvert^2$ and NORM remains an explicit act, as in hydrogen.

## 5 · A, B and MORPH

A and B store whole registers (state identities, complex amplitudes, epoch). MORPH $s\in[0,1]$ plays the normalised geodesic between them: align phases so $\langle A\vert B\rangle\ge0$, $\theta=\arccos\lvert\langle A\vert B\rangle\rvert$, and

$$
\Psi_s(t)=\frac{\sin((1-s)\theta)\,A(t)+\sin(s\theta)\,B(t)}{\sin\theta},
$$

with $A(t)$, $B(t)$ the exact evolutions of the anchors and the limit $\theta\to0$ handled explicitly. Because both anchors evolve under the same generator, $\langle A(t)\vert B(t)\rangle$ is constant, so $\theta$ and the alignment are computed once. For orthogonal anchors this is $\cos(s\pi/2)A+\sin(s\pi/2)B$, which is hydrogen's TRANSITION envelope; MORPH with a rate $\Omega$ therefore reproduces hydrogen's Rabi cycling and extends it to non-orthogonal anchors. The window labels MORPH a performance path. Stage 5's drive is where populations move for a physical reason.

## 6 · Modulation

Fixed target ids, present-only setters, in the existing registry: `reg.morph`, and per lane slot `reg.amp1…8`, `reg.ph1…8`. Slots follow lane order. No other new targets in this stage.

## 7 · Identity, gauge and saving

A saved register must restore on a fresh page before the molecule has finished preparing, and must mean the same thing after the eigensolver changes. Index alone is not an identity inside a degenerate cluster. The worker therefore publishes states in a canonical gauge:

1. Cluster states by consecutive gaps $\lvert\Delta\omega\rvert<10^{-8}$, maximal runs only.
2. Scan fixed linear functionals in a fixed order: the three lab transition-dipole functionals $x$, $y$, $z$ (threshold $10^{-3}$ a.u.), then the amplitude coordinates in the project's pair order (adaptive threshold $\tfrac12\sqrt{(g-j)/d}$). Project each on the cluster's span, Gram–Schmidt against the vectors already accepted, skip residuals under threshold, stop at $g$ vectors.
3. Normalise each accepted residual with a positive pivot. That fixes the rotation and every sign, the non-degenerate case $g=1$ included.
4. Orbital clusters use the same rule with one family, the Löwdin coordinates of $S^{1/2}C$ in AO order.
5. Publish the pivot list and the smallest pivot norm $\delta$ with the state; a small $\delta$ is a warning that the identity is ill-conditioned.

△ Correction, 2026-09-18: draft 0's rule 2 ("rotate so the dipoles are mutually orthogonal, the first with the largest component along the first axis") constrains nothing. For a cluster spanning one E or T irreducible representation the dipoles are mutually orthogonal and of equal length in every gauge (Schur; measured on 45 bright clusters). The identity comes entirely from the ordered functionals and the positive pivot. The rule is a function of the cluster's projector and fixed data only, so no scrambling can enter it, and the result is unique by uniqueness of QR (`proving/LEDGER.md`, Definition 8, Propositions 9 and 10, Lemma 13; reference implementation `proving/canon-gauge.mjs`, 11 of 11 tests). A consequence worth having: the RING preset's centre, radius, plane, sense and rate are the same in every gauge; only its starting phase is gauge-dependent, and the canonical gauge fixes that too. Not certified: continuity of the gauge across a geometry change.

Gate: scramble each cluster by a random orthogonal matrix, canonicalise, and recover the same vectors to $10^{-10}$; repeat with the Jacobi and the QL solver. The same rule applies to degenerate orbital pairs for ORBITAL mode. The record carries mode, both registers, A, B, morph, view, reference, the energy reference and the epoch.

## 8 · Readouts

$\sum\lvert b\rvert^2$; the strongest beats present, $\lvert E_A-E_B\rvert$ weighted by $\lvert b_Ab_B\rvert$, each as a period in atomic units and in attoseconds (1 a.u. $=24.19$ as; benzene's bright slosh is 389 as); the live dipole vector; and the dipole scope, a goniometer that traces $\boldsymbol\mu(t)$ in its dominant plane: a line for BEAT, a circle for RING, a Lissajous figure for two lines of different colour. The scope is OPEN 4; it costs $n^2$ multiply–adds a frame.

## 9 · Presets, defined by rule so they exist for every molecule

| Preset | Rule | Mode |
|---|---|---|
| BEAT | $S_0$ plus the brightest state below the core window | STATES |
| RING | $S_0$ plus the lowest bright degenerate pair at a quarter turn; disabled with a reason when the molecule has none | STATES |
| LISSAJOUS | $S_0$ plus the two brightest states of different axis and different $\omega$ | STATES |
| BREATHE | $S_0$ plus the lowest dark totally symmetric state, if the ladder has one | STATES |
| HOMO + LUMO | the orbital beat that ships today | ORBITAL |
| WINDING | a degenerate orbital pair at a quarter turn | ORBITAL |

## 10 · Where the numbers are computed

The excitation vectors are small: $X^K$ is $n_on_v$ numbers, 315 for benzene. On selection the main thread asks the worker for one canonical $X^K$, $\omega_K$ and its dipoles. Per frame it forms $Z(t)=\sum_Kb_Ke^{-i\omega_Kt}X^K$, the MO blocks $D_{ov}=\sqrt2\,\overline{b_0}Z$, $D_{vv}=Z^\dagger Z$, $D_{oo}=2\cdot\mathbb 1-ZZ^\dagger$, and $CDC^T$: about $10^5$ multiply–adds, far under a millisecond, then one $n^2$ upload through the molecular session. Time is evaluated in closed form, so scrubbing and reversal are exact.

## 11 · Decisions (commissioner, 2026-09-18)

All four open items are settled as recommended.

1. The eyebrow is REGISTER; the window id stays `orbitals`.
2. Degenerate pairs get uniform $x$/$y$ lanes in the canonical gauge; the phase knob of the second lane makes the ring. No dedicated pair lane.
3. STATES opens on CHANGE against GROUND, with MEAN one click away.
4. The dipole scope is included.

## 12 · Carry-overs into the stage 3 and 4 build (from the stage 1 report, 2026-09-18)

1. The session hosts STATES with one row in `MODEL_RANK` and one `register()` call; CHANGE, DENSITY and PHASE are already its three product kinds.
2. The signed texel holds $\Delta\rho$ absolutely, so a field whose peak is under about $6\times10^{-5}$ sits in half-precision subnormals (measured: relative $L^2$ $4.9\times10^{-3}$ at $\kappa=10^{-4}$ against $6.0\times10^{-4}$ at $10^{-3}$). The weak-kick replay of stage 3 will live there. Cure: upload $\Delta D/\max\lvert\Delta D\rvert$ and carry the scale beside it; the picture is identical because the `real` view divides by the volume's own maximum, and the readouts multiply the scale back.
3. `rack.js` still passes `molecule: chem.on` to `field.frame`, a second owner flag beside the session. It must read the session.
4. `chem.run(n)`, the scripted road, never sets `running`, so a scripted run is the `ground` model and the register would out-rank it. The flag now means "the tdhf model claims the field" and both roads must set it.
5. CuH and ZnH₂ no longer converge in 200 cycles and the interface does not say so; they are refused for a different sentence. The refusal should name both facts.
6. Benzene's remaining preparation cost is the AO to MO transform inside `hessianBlocks`, 0.6 s of 2.5 s. It is the next optimisation, separate from the register.

## 13 · As built, stages 5 and 6 (2026-09-18)

- THE DRIVE. A DRIVE switch, a polarisation menu (three axes, six circular senses), $\omega$ and $E_0$ knobs (both live: `chem.drive.set`, no restart), a CW or $\sin^2$ PULSE envelope, and $\omega\to$ LANE, which tunes to the selected lane's stick and its dipole's axis, or to the pair's plane for a degenerate level. The worker propagates the whole singles space by a Strang step with the position operator diagonalised once per axis: unitary to $10^{-12}$, second order (halving ratio $4.03$), and a negative step is its inverse, so scrubbing backwards un-propagates. Water's bright line reaches $0.99975$ at $\pi/\Omega$ with $\Omega=E_0\mu$; a circular field fills benzene's two lanes equally, a quarter turn apart. While it runs the lanes are read-outs; DRIVE OFF freezes the state back into them and says how much had leaked to states without a lane. Modulation targets `reg.e0`, `reg.w`.
- FLOW. A FLOW switch puts 220 tracers on the stage riding $\mathbf v=\mathbf j/\rho$ of the register's density matrix (`lab/molecular-flow.js`, the particle overlay generalised to a pluggable source). Seeded by $\lvert\mathbf j\rvert$ and reborn where the current still runs. See `JUDGMENT.md` §8.2 for what is exact and what is qualitative.
- Carry-overs closed: the frame loop asks the session whether the volume is molecular; a scripted `chem.run(n)` claims the field as the `tdhf` model and publishes as it; the refusal of CuH and ZnH₂ names their non-convergence.
- Still open: the AO to MO transform (0.6 s of benzene's preparation); the canonical gauge for degenerate ORBITAL pairs; FLOW for the ORBITAL mode and for a TDHF run; the drive's excited-state absorption is unexplored; larger bases.

## 14 · As built, the last open items (2026-09-18)

- FLOW follows the model that is playing: the STATES register, the ORBITAL packet ($D_{\mu\nu}=\overline{c_\mu}c_\nu$, so the tracers ride the gradient of the very phase on screen), or CHEMISTRY's real-time run (the worker ships $\operatorname{Im}D$; it is negated on the way in, because `density.js` keeps the transpose-conjugate convention, and the node gate holds the sign). A real-time run's tracers ride the run's own clock.
- Excited-state absorption. `chem.drive.coupling` returns $\langle A\vert\mathbf r\vert B\rangle$ between any two register keys, and $\omega\to$ LANE now tunes to the gap between the selected lane and the most populated other lane. From a pure $S_3$ of water a field at the $S_3\to S_4$ gap ($0.0887$ hartree, $\langle 3\vert y\vert 4\rangle=-1.196$) moves $0.999$ of the population at $\pi/\Omega$ and leaves $S_0$ untouched: a line no absorption spectrum from the ground state contains.
- The larger basis. 6-31+G\* is vendored for H, C, N, O, F (the record widened from H, O with byte-identical H and O shells, both hashes named). Nineteen library molecules agree with PySCF `cart=True` on the same decimals to $3\times10^{-12}$ (`basis/oracle-631.py`, `lab/oracles/6-31+g-star-v1.json`); the card offers it for the eighteen that stay at or under 46 Cartesian AOs and says why not for the rest. The whole register runs in it: ammonia's 100 states arrive in 0.28 s and its E pair rings.
- Not done here, because it needs the device: the iPad frame measurement. The METERS window reads the frame time; serve the dev tree on the local network with `LW_HOST=0.0.0.0 ./serve.sh 8712` and open `https://<this machine's LAN address>:8712/lab/` on the iPad (accept the self-signed certificate). That address is reachable on the home network only.
