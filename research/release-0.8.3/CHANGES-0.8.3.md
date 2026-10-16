# 0.8.3-alpha "Breath" — what changed (Claude Yan / Fable 5.1, 2026-10-16)

The engine plan's D.15. Plan `BUILD-PLAN.md` (Yan, drafted 10-16 03:20 while 0.7.4 cut; base and cap filled at the 0.8.2 cut — see "The light check"). Three Opus
builders in parallel from the base: B1 `b1-breath`, B2 `b2-trace`, B3 `b3-ellipsoid`. Build notes: `B1-BUILD.md`, `B2-BUILD.md`, `B3-BUILD.md`.

## The shape
THE RADIAL BREATH P(r, t) = r² Σ_{l,m} |Σ_n c_nlm(t) R_nl(r)|² — a closed form diagonal in (l, m) — as CALCULUS's BREATH tile over r ∈ [0, half] at 256 points with
the time cursor; its two integrals printed as oracles (∫P dr = Σ|c|² to 1e-10; ∫rP dr = ⟨r⟩ against CALCULUS's own bilinear road); the REVIVAL tap makes the Rydberg
packet and sets RATE so T_cl = 2πn̄³ shows as one second, T_rev = (n̄/3)·T_cl from LADDER's law. THE A(t) TRACE |⟨ψ(0)|ψ(t)⟩|² over one REPEATS period as a second
CALCULUS tile with the cursor and a hover. THE UNCERTAINTY ELLIPSOID: the position covariance's three principal axes as a wireframe about the bead, from ⟨a|r_i r_j|b⟩
(the r⁴ radial integral and the l = 0, 2 Gaunt reductions), its trace ⟨r²⟩ − |⟨r⟩|² the oracle against ⟨r²⟩_nl = n²(5n² + 1 − 3l(l + 1))/2.

## B1 · THE RADIAL BREATH + REVIVAL (`lab/calculus.js:37–44` `radialBreath`; `lab/calculusview.js` the BREATH tile after RAY, `createCalculus(host, opt)`, `breath()`; `lab/windows/readouts.js:106` the REVIVAL callback (0 net lines); `lab/state.js:471–472` the `rydberg-s` preset; `lab/catalogue.js` regenerated; branch `b1-breath` tip `fec7e98`; +25 of ≤ +55)
- **The breath:** `radialBreath(reg, t, half, n = 256)` → `{ r, P, norm, rMean }` — P(r, t) = r² Σ_lm |Σ_n c R_nl|² taken in (l, m) groups with `radial` from the Hamiltonian
  in force; the 256 points spaced as r = half·s²/(1 − s) so the trapezoid integrates over the whole half-line. **The tile** BREATH in CALCULUS after RAY (RAY's `calc-ray`
  class, no CSS edit): P(r, t) over [0, half] in the kit's ink, the height scale the running maximum for the current register version (no per-frame rescale); the readout
  "∫P = 1.000000000 · ∫rP/∫P = 46.3289 = ⟨r⟩ (Δ 9e-12)", Δ against the ⟨r⟩ `stats` computes by its bilinear road; a molecule or momentum space gets one sentence.
- **REVIVAL** is one verb list run through `app.sh.verbs.run(…, { name: 'REVIVAL' })` — one history row: it loads the preset by the hand road, sets RATE through the `rate`
  verb (the flash law checked: the fastest beat shows at 2.17 Hz, under 3 a second; a refusal would print its sentence and leave RATE alone), plays, and prints n̄, T_cl
  and T_rev from LADDER's own `revivalClocks`.
- **Corrections to the brief, each the true thing:** (1) **the shipped `rydberg` preset does not breathe** — it is circular states, one n per (l, m), so P(r, t) has no cross
  terms and stands still (⟨r⟩ = 28.048137 at t = 0, 50 and 500); REVIVAL loads a new preset **`rydberg-s`**, the same Gaussian `gauss(5,1,[4,5,6])` on 4s · 5s · 6s — the
  same n̄, T_cl, T_rev and A(t), and it breathes (⟨r⟩ 25.6 → 27.1 → 42.6); (2) **T_rev = (2n̄/3)·T_cl = 4πn̄⁴/3 = 2618 a.u.**, LADDER's own law — the brief's (n̄/3)·T_cl =
  1309 is the half revival; (3) **"A(T_rev) within 2 % of A(0)" is false at n̄ = 5**: on three levels the linear phase at T_rev is not a whole turn (2n̄/3 = 10/3) and the
  cubic error β₃ = 1.68 rad is large — A(T_rev) = 0.037614, the peak within one T_cl of T_rev is 0.8867 at T_rev − 0.555 T_cl; the test prints the miss and gates the
  register's own exact recurrence at the density period 2π·7200 = 45238.93 a.u. (A = 1 to 1e-10).
- **Checked (`tests/breath.test.mjs`, 6 checks):** ∫P = Σ|c|² to 2.3e-12; ∫rP/∫P against `stats`' ⟨r⟩ to 6.0e-11 at t = 0, 50, 500 for 1s, the Stark state, `rydberg` and
  `rydberg-s`; 1s matches 4r²e^{−2r} to 1e-12; the oscillator's |0⟩ matches its Gaussian to 1e-12 with ∫P = 1 to 1e-10. calculus 8 · bead-ray · period 11 · dynamics 19
  green; frontier (which exercises `revivalClocks`) in the node gate; rack-deps holds (`app` 30, SPECTRUM 25, readouts 9 → 10); new-project in step;
  `catalogue-table --check` in step after regenerating; serialize-bytes 11 identical; browser: REVIVAL clicked, paused at t = 1.79 T_cl — preset `rydberg-s`, RATE
  785.398, exactly one history row, Δ 9e-12, no page errors; screenshot `.tmp/b1-breath-revival.png`. `app.sh.verbs` is read inside the callback (created later at
  `rack.js:827`).

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
- Node gate 0 after each merge; `pwa --write`; `new-project --check` in step; `rack-deps --classes` holds (SPECTRUM 25, readouts 10, `app` 30 keys); breath 6 · trace 6 ·
  ellipsoid 5 · bead-ray · calculus 8 · period 11 · dynamics 19 · kick 16 · equalizer 11 · catalogue + `catalogue-table --check` green on the merged tree;
  serialize-bytes identical at each row. **The merge:** B1 and B2 both touched `lab/calculusview.js` — B2's merge had one import hunk (both lines kept), B1's three
  (the imports unioned, both tile calls in `update`, B3's ELLIPSOID block and B1's `breath()` both kept); `lab/catalogue.js` regenerated after B1 (the `rydberg-s` row).
  **One merged-tree check** on 9241 (a 20-line throwaway, not committed): CALCULUS open on 1s + 2p_z shows the four tiles at once — RAY, BREATH "∫P = 1.000000000 ·
  ∫rP/∫P = 3.2500 = ⟨r⟩ (Δ 8e-13)", A(t) "16.76 a.u. · 0.405 fs · REPEATS, exact · now A = 1.0000 · 2 revivals", ELLIPSOID "σ = (1.87, 1.87, 2.99) a₀ · tr Σ = 15.945 =
  ⟨r²⟩ − |⟨r⟩|² = 15.945 (Δ 4e-15)"; `rydberg-s` breathes ("∫rP/∫P = 25.6171 = ⟨r⟩ (Δ 6e-11)"); three 240 × 56 canvases drawn, no page errors. THE LOCK ×2 at the merge tip
  with `--query gastab=0` on BOTH runs: 860 values · 0 readback · 0 record-byte · 63 s, and the 1004-value fixture · 0 · 0 · 61 s.
- **Lines:** 29,952 → 30,027 (+75 = B3 +21, B2 +29, B1 +25; cap 30,251). Merge order B3 `a23974a`, B2 `c2ce980`, B1 (this commit). The standing settings-probe closed[]
  item is unchanged (4 of 6 scenes red, the same way).

## Known, deferred (recorded)
The STATES register's autocorrelation (molecules in the A(t) tile); the momentum-space breath P(p, t); the ellipsoid for a molecule (the quadrupole of the density);
a demo project per cut (REVIVAL is the tap; the demo waits on the 0.9.0 pass); LADDER's T_rev beyond cubic order.
