# SYNTHESIS · the print into the instrument — QWAVE-0.1 "FRONTIER"

*Fable, 2026-09-03. Source: `research/adversarial-2026-09-02/PRINT-BEYOND-THE-FRONTIER-LAMBDAWAVES-2026-09-03.md` (five rounds, two labs). Target: `~/Documents/LAMBDAWAVES/lab` (QWAVE-0 as built, `REPORT.md`). Laws kept: the dossier's "state / representation / observer" (§7.4), "cull the observation, never the state" (§18.3), "an implementation must not be its own only oracle" (§18.1); the instrument's one-road mutation policy, explicit NORMALIZE, tier router with idle zero, EXACT / NUMERICAL / DESIGN-CHOICE labels; the two proofs stay green and every new law gets its own node proof with anchors from the print (numbers the other lab produced).*

## 0 · What the print gives the instrument, contract by contract

| # | theorem (print §) | what the instrument gets | window | label | the gate (node proof) | the oracle |
|---|---|---|---|---|---|---|
| A | A.1 Airy envelope; A.2 peak law $\alpha^*(\beta)$ (integer series); A.3 height $|I|_{\max}(\beta)$; A.4 Poisson sum of Airy envelopes; A.5 deaf comb $b\mid6$; A.6 Parseval floor | a Rydberg-only **LADDER** register (populations over any $n$, exact $E_n$), the exact autocorrelation on the revival scale (the FIELD cannot draw $n>6$ and the window says so), clocks $T_{\rm cl},T_{\rm rev},T_{\rm sr}$, $\beta_3,\beta_4$, the Airy–Poisson prediction drawn over the exact fine structure at $T_{\rm rev}$, the predicted and the measured peak, the comb verdict (DEAF iff $b\mid6$), the cubic-level height and the floor | LADDER | EXACT ANALYTIC (SPECTRAL) — no field | $\mathrm{Ai}$ anchors from tables; $I(\alpha,\beta)$ vs quadrature; series vs numerical maximiser; Poisson–Airy vs the exact sum at $\bar n=150$; the $\bar n=30,\sigma=2$ peak at $0.994\,T_{\rm rev}$; deaf $=1$; $4/5\to0.744456$ (Opus's number) | mpmath probes `bf-r3-airy`, `bf-r3-poisson`, `bf-r4-comb`, `bf-r5-stokes` |
| B | B.1 orbit theorem (Schmidt spectrum = SO(4) invariants; coherent states = Kepler ellipses = camera sphere pair; $e=\frac{n-1}n\sin\frac\gamma2$); B.3 DEFECT WAIT $e^{i\alpha\mathbf L^2}$ and universality | per shell: the Clebsch matrix, its Schmidt spectrum, $\langle\mathbf L\rangle,\langle\mathbf K\rangle$ drawn on **two spheres**, eccentricity and the COHERENT flag; two new STATE operations — **STARK ROTATE** $e^{-i\theta K_z}$ (an SO(4) rotation, invariants unchanged) and **DEFECT WAIT** $e^{i\alpha\mathbf L^2}$ (not SO(4): invariants change); badges say STATE | ORBIT + STATE | EXACT ANALYTIC | CG anchors from tables; Pauli's $\langle n\,l{+}1\,m|z|n\,l\,m\rangle$ by quadrature vs closed form; $2s\to(\tfrac1{\sqrt2},\tfrac1{\sqrt2})$, Stark $\to(1,0)$, $\langle z\rangle=-3$; B5 end-to-end $e^{i\frac\pi4\mathbf L^2}e^{-i\frac\pi4K_z}|2s\rangle=(2s+2p_0)/\sqrt2$; invariance under $R_z$ and $K_z$; change under the wait | Opus `bf-r4-corpus.py`, Fable `bf-r5-lie2.py` |
| C | C.1 unimodular-root theorem, degree bound, dominance lemma; C.2 two curves, two phases; C.3 census law; C.4 generic event | **VORTEX**: the nodal lines of $\psi(t)$ located on every coaxial circle as unimodular roots of $P(w)$, drawn over the FIELD in the same camera; meters $M$ (max lines per circle), circles solved / skipped by dominance; for stretched three-mode states the reconnection census (points, $T_d$, firing phases) and a JUMP-TO-EVENT | VORTEX | EXACT ANALYTIC (points on the exact nodal set; the drawing is a sampling) | $2p_x$ lines lie in $x=0$; $m$-only states give $M=0$; the $(3d_{+2},4p_{+1},5s)$ census reproduces the print's five radii and ten points, $T_d=481.265$; a double unimodular root at the first event | Fable `bf-r5-census.py`, `bf-r3-recon6.py`; Opus `bf-r4-c5census.py` |
| D | F.1/F.2 (the shell over $\mathbb F_q$) | a sheet paragraph only — no arithmetic engine this wave | sheet | — | — | — |

Not built this wave, by the dossier's own priorities: the probability-current field product (needs the WGSL kernel), the KS/Fock view, packet launch, MIR descriptors. The LADDER is the honest form of REPORT item 2 ("raise the ceiling for a Rydberg-only register"): the revival is a spectral observable and needs no field.

## 1 · Architecture (what changes, what does not)

- `lab/frontier.js` — **new, DOM-free**: Airy $\mathrm{Ai}$ (series + asymptotics), $I(\alpha,\beta)$, the two exact series, clocks, packet populations, exact autocorrelation, revival scans, the Poisson–Airy prediction, comb verdict and cubic-level height, Clebsch–Gordan, shell matrix with the $l$-phase fixed by Pauli's $K_z$, Schmidt spectrum (Jacobi), rotor expectations, $K_z$ matrix and its exponential, the defect wait, complex polynomial roots (Durand–Kerner), the vortex locator, the stretched census. Every function is pure and testable in node.
- `lab/state.js` — two mutations on the one road: `rotateK(theta)` and `defectWait(alpha)`; three presets (`stark`, `recon`, `2px`).
- `lab/ladder.js`, `lab/orbit.js`, `lab/vortex.js` — the windows (canvas + kit widgets), each fed by the router at display rate, each with an on/off switch so idle stays zero.
- `lab/rack.js` — wire the windows, the two knobs in STATE, the vortex overlay on the stage (a 2-D canvas above the WebGPU canvas, projecting with `cameraBasis`), `__LW.ladder/orbit/vortex` for the proofs.
- `lab/field.js`, the WGSL, the tier router, the clock — **untouched**.
- `tests/frontier.test.mjs` — the third proof; `test.sh` runs it; `REPORT.md` and the sheet updated.

## 2 · Build order and gates

1. `frontier.js` + `tests/frontier.test.mjs` until GREEN (the mathematics before any pixel).
2. `state.js` operations + presets; the existing 37 stay GREEN.
3. LADDER, ORBIT, VORTEX windows; rack wiring; overlay.
4. `./test.sh` — node 37/37 + frontier proof + browser 23/23 (plus new B-checks: the three windows exist, the overlay draws, STARK ROTATE and DEFECT WAIT change the digest at RECONSTRUCT).
5. REPORT.md: the new rows, labels, honest gaps.

## 3 · Exactness statements the windows must print

- LADDER: "EXACT ANALYTIC · SPECTRAL — this window has its own register (populations over n); the FIELD cannot draw n > 6". The Airy–Poisson curve is "PREDICTION (cubic order; quartic $\beta_4$ = …)", the exact curve is "EXACT". The peak law series is shown only where its optimal truncation is tighter than $10^{-3}$ ($\beta_3\lesssim0.3$); beyond it the numerical Airy maximiser is used and labelled.
- ORBIT: "EXACT ANALYTIC — invariants of the SO(4) orbit; unchanged by time, R_z and K_z; changed by DEFECT WAIT".
- VORTEX: "EXACT ANALYTIC on the sampled circles — lines are the unimodular roots of P(w); between samples nothing is claimed"; the census: "stretched three-mode states only".
