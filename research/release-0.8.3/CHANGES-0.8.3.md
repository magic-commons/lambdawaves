# 0.8.3-alpha "Breath" — what changed (Claude Yan / Fable 5.1, 2026-10-16)

The engine plan's D.15. Plan `BUILD-PLAN.md` (Yan, drafted 10-16 03:20 while 0.7.4 cut; base and cap filled at the 0.8.2 cut — see "The light check"). Three Opus
builders in parallel from the base: B1 `b1-breath`, B2 `b2-trace`, B3 `b3-ellipsoid`. Build notes: `B1-BUILD.md`, `B2-BUILD.md`, `B3-BUILD.md`.

## The shape
THE RADIAL BREATH P(r, t) = r² Σ_{l,m} |Σ_n c_nlm(t) R_nl(r)|² — a closed form diagonal in (l, m) — as CALCULUS's BREATH tile over r ∈ [0, half] at 256 points with
the time cursor; its two integrals printed as oracles (∫P dr = Σ|c|² to 1e-10; ∫rP dr = ⟨r⟩ against CALCULUS's own bilinear road); the REVIVAL tap makes the Rydberg
packet and sets RATE so T_cl = 2πn̄³ shows as one second, T_rev = (n̄/3)·T_cl from LADDER's law. THE A(t) TRACE |⟨ψ(0)|ψ(t)⟩|² over one REPEATS period as a second
CALCULUS tile with the cursor and a hover. THE UNCERTAINTY ELLIPSOID: the position covariance's three principal axes as a wireframe about the bead, from ⟨a|r_i r_j|b⟩
(the r⁴ radial integral and the l = 0, 2 Gaunt reductions), its trace ⟨r²⟩ − |⟨r⟩|² the oracle against ⟨r²⟩_nl = n²(5n² + 1 − 3l(l + 1))/2.

## B1 · THE RADIAL BREATH + REVIVAL
(filled at B1's merge)

## B2 · THE A(t) TRACE (`lab/calculusview.js` +19 — one import, the tile and its `trace()`, one call; `lab/period.js:102–110` `traceOf`; `lab/windows/readouts.js` +1 the source line; branch `b2-trace` tip `ca0bb45`; +29 of ≤ +30)
- **The tile** A(t) = |⟨ψ(0)|ψ(t)⟩|² in CALCULUS from 512 samples of `reg.autocorrelation(t)` over ONE REPEATS period — the transport's own (`app.hooks.period()`, the value
  REPEATS prints; the 2e4 a.u. horizon when there is none, and it says so); t = 0 is the anchor REPEATS counts its laps from, the cursor is `clock.t mod T`; revivals
  (local maxima above half the top) are dots, the hover gives t (and t/T) and A and snaps to a revival within 6 px. Rebuilt only when the register version, Fz, Bz,
  P.T, the operator or the equalizer table changes — never in a frame — under LIVE and the `may('calculus')` tick; nothing runs while CALCULUS is closed; no field
  write. Stands down with one sentence for a molecule and for an A ↔ B transition; when the fastest beat turns more than 128 times over the span the sub says "512
  samples alias it".
- **The equalizer, corrected:** its table Γ does not decay the envelope in time — it is a fixed point, each pair's coherence scaled by a constant, and a spread of
  clock offsets leaves the pure A(t) unchanged. So the tile draws the MIXED-STATE trace Tr ρ(0)ρ(t) = Σ p_a p_b |Γ_ab|² cos ω_ab t, which equals A(t) at Γ = 1: under a
  mixture table (the jitters, COMB, gains below 1) the beats scale down and every revival reaches the PURITY the BEAT EQUALIZER card already prints ("coherences
  damped: the envelope is the model's · A(0) = PURITY …"); PHASE PULSE keeps the state pure, so the pure trace; a signed table is not a state, so the register's own
  trace, said. "exact" is said whenever no table damps the curve (the drawn curve is always the closed-form normal-mode sum; whether the period is exact rides in the
  source string). The tile lives in `calculusview.js`, not `readouts.js` (as P3 found).
- **Checked (`tests/trace.test.mjs`, 6 laws):** A(0) = 1 to 1e-12; 1s + 2s: T = 2π/(E₂ − E₁) = 16π/3 exactly, A(T) = 1 to 1e-10, the trace equals cos² pointwise (worst
  6.7e-16); 512 samples, source 'REPEATS, exact', revivals at samples 0 and 511 only; the damped trace A(0) = purity 0.625 and ½ + ⅛cos(ΔE t) to 1e-12; the horizon
  fallback says so. calculus 8 · period 11 · bead-ray green; rack-deps holds (SPECTRUM 25, readouts 9); new-project in step; serialize-bytes byte-identical against
  `f3f4ccb` (no PROJECT key). Browser (CHORD, t = 600): "1810 a.u. · 43.8 fs" · "REPEATS, exact · exact |Σ p e^{−iEt}|² · now A = 0.2992 · 16 revivals" — A(600) = 0.2992
  by a separate calculation; the hover at T "A = 1.000000 · a revival"; screenshot `.tmp/b2-chord-trace.png`. **Left out:** damping under Fz ≠ 0 (the pure trace is
  drawn), per-label rates, molecules. The period read takes the transport's forced road (free when REPEATS is fresh; a scan once per rebuild key while settling).

## B3 · THE UNCERTAINTY ELLIPSOID (`lab/calculus.js:144–155` `covariance(reg, t)` + the `rotorsToZ` import; `lab/dynamics.js` `radialObservables` returns `r2`; `lab/skeleton.js:24, 46–47` the ellipses; `lab/calculusview.js:9, 44, 51–53` the readout; `lab/rack.js:27, 506–507`; the ELLIPSOID switch beside BEAD in `lab/windows/molecules.js:59–61`; PREFERENCE in `lab/shell/settings.js:37, 107`; `docs/STATE-SCOPES.md` one row; branch `b3-ellipsoid` tip `df9463b`; +21 of ≤ +50)
- **The covariance** Σ = ⟨r_i r_j⟩ − ⟨r_i⟩⟨r_j⟩ with its eigenvalues and principal axes (six Jacobi sweeps), the bead and an independently computed ⟨r²⟩, cached per
  register version · t · Hamiltonian so the skeleton and CALCULUS share one computation a frame. **No 91 × 91 × 6 table of matrix elements** (a correction): the exact
  Var(z) the tree already has (`varianceZ` — the l = 0 and l = 2 angular pieces and the cached r⁴ radial integral) is turned by the slap's `rotorsToZ` along six
  directions — x̂, ŷ, ẑ give the diagonal and the diagonals between them give Σ_ij = Var((e_i + e_j)/√2) − (Σ_ii + Σ_jj)/2. **The oracle** is the trace: ⟨r²⟩ from the
  plain l = l′, m = m′ sum with no angular algebra (`radialObservables(...).r2`); `stats` is untouched, so `calculus.test`'s shapes and B1's seat stay.
- **The picture:** three principal ellipses about the bead, semi-axes √λ_k, in the accent, the far half dimmed with `angular-nodes.js`' two alphas. The ELLIPSOID switch
  sits beside BEAD; on, it draws the bead and its trail too; it stands down for a molecule, under a Sturmian and in momentum space (there the bead is ⟨p⟩ and Σ is a
  position covariance). PREFERENCE `ellipsoid`, off by default, absent while off. **The CALCULUS line:** for 2p₀ "σ = (2.45, 2.45, 4.24) a₀" over "tr Σ = 30.000 =
  ⟨r²⟩ − |⟨r⟩|² = 30.000 (Δ 4e-15) · exact 30" — the exact n²(5n² + 1 − 3l(l + 1))/2k² only for a single hydrogen label.
- **Checked (`tests/ellipsoid.test.mjs`, 5 laws):** 1s: Σ = I and ⟨r²⟩ = 3 by both routes, σ = 1 a₀ on every axis to 1e-12 (**the plan's "σ² = 3 − 2.25 = 0.75" was
  wrong** — it subtracted the square of the scalar ⟨|r|⟩ = 1.5; the covariance subtracts |⟨r⃗⟩|², which is 0 for 1s); 2p₀: diag(6, 6, 18) = ⟨r²⟩ = 30 × (1/5, 1/5, 3/5)
  to 5e-15; (2s + 2p₀)/√2: σ² = (10, 10, 7), the trace gap ≤ 9e-15 at t = 0, 50, 500; 1s + 2s + 2p₀: the trace law holds at t = 0, 3, 7 while tr Σ moves 20.753 →
  20.954; the Stark state turned to x̂ by the slap's rotor moves its one distinct axis from ẑ to x̂ with the same σ. dynamics 19 · calculus 8 · bead-ray · kick 16 ·
  period 11 green; rack-deps holds (SPECTRUM 25, `app` 30); new-project in step; serialize-bytes byte-identical against `f3f4ccb`; screenshot `.tmp/b3-2p0-ellipsoid.png`
  (the prolate ellipsoid along z about the bead, the CALCULUS line, Var(z) = 18 on its tile, no page errors). With ELLIPSOID off `bead.ell` is null and the 0.8.2 paint
  is unchanged. settings-probe 4/6 red as at the base (the standing closed[] item).

## The light check (existing gates only) and the cut
(filled at the cut)

## Known, deferred (recorded)
The STATES register's autocorrelation (molecules in the A(t) tile); the momentum-space breath P(p, t); the ellipsoid for a molecule (the quadrupole of the density);
a demo project per cut (REVIVAL is the tap; the demo waits on the 0.9.0 pass); LADDER's T_rev beyond cubic order.
