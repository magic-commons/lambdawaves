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

## B2 · THE A(t) TRACE
(filled at B2's merge)

## B3 · THE UNCERTAINTY ELLIPSOID
(filled at B3's merge)

## The light check (existing gates only) and the cut
(filled at the cut)

## Known, deferred (recorded)
The STATES register's autocorrelation (molecules in the A(t) tile); the momentum-space breath P(p, t); the ellipsoid for a molecule (the quadrupole of the density);
a demo project per cut (REVIVAL is the tap; the demo waits on the 0.9.0 pass); LADDER's T_rev beyond cubic order.
