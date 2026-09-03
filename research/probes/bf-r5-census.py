# bf-r5-census.py — Round 5 (Fable).  (a) Theorem C6's one-variable census re-run independently for (3d₊₂,4p₊₁,5s):
#   Φ(r) = Â₀² − 4|Â₊Â₋| with the stretched angular constants folded in; roots on (0, 60]; admissibility ξ = |Â₀|/(2|Â₊|) ≤ 1.
#   (b) Q27: the same for (3d₊₂,4p₊₁,6s) — the prediction from the node rule is printed BEFORE the count.
#   (c) Opus's first generic cubic event, verified on the full ψ = (3d₊₂+4p₊₁+5s+6p₋₁)/2 at his (ρ,z,t).
import math, cmath
import numpy as np
from scipy import special, optimize
def R(n, l, r):
    rho = 2.0 * r / n
    Nn = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return Nn * np.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
def prof(l, m, th): return special.sph_harm_y(l, m, th, 0.0).real
# stretched modes: Θ_{|m|,m}(θ) = ς_m sin^{|m|}θ; extract ς_m at θ = π/2
def sigma(l, m): return prof(l, m, math.pi / 2)
def census(ns, label):
    (n2, n1, n0) = ns                    # shells of the m = +2, +1, 0 modes (l = 2, 1, 0)
    s2, s1, s0 = sigma(2, 2), sigma(1, 1), sigma(0, 0)
    Ap = lambda r: R(n2, 2, r) * s2; A0 = lambda r: R(n1, 1, r) * s1; Am = lambda r: R(n0, 0, r) * s0
    Phi = lambda r: A0(r) ** 2 - 4 * abs(Ap(r) * Am(r))
    xi = lambda r: abs(A0(r)) / (2 * abs(Ap(r)))
    # nodes of the lowest-|m| mode (radial nodes of R_{n0,0})
    rs = np.linspace(1e-3, 80, 800001)
    vals = np.array([Am(r) for r in rs]); nodes = []
    for i in np.where(vals[:-1] * vals[1:] < 0)[0]:
        nodes.append(optimize.brentq(Am, rs[i], rs[i + 1], xtol=1e-13))
    win = [r for r in nodes if Phi(r - 0.05) < 0 and Phi(r + 0.05) < 0]   # node inside the dominance window (Φ<0 on both sides)
    adm = [r for r in win if xi(r - 0.05) <= 1 and xi(r + 0.05) <= 1]
    print(f'{label}: radial nodes of the lowest-|m| mode at r = {[round(x, 5) for x in nodes]}')
    print(f'   nodes inside the dominance window: {[round(x, 5) for x in win]};  of these admissible (ξ ≤ 1 on both sides): {[round(x, 5) for x in adm]}')
    print(f'   node-rule PREDICTION: 2ν + ε with ν = {len(adm)} → {2 * len(adm)} or {2 * len(adm) + 1} admissible roots, census {4 * len(adm)} or {4 * len(adm) + 2} points')
    pv = np.array([Phi(r) for r in rs]); roots = []
    for i in np.where(pv[:-1] * pv[1:] < 0)[0]:
        roots.append(optimize.brentq(Phi, rs[i], rs[i + 1], xtol=1e-13))
    print(f'   roots of Φ on (0, 80]: {len(roots)}')
    nadm = 0
    for r0 in roots:
        x0 = xi(r0); ok = x0 <= 1
        nadm += ok
        th = math.asin(min(x0, 1.0)) if ok else float('nan')
        sgn = '+' if Ap(r0) * Am(r0) > 0 else '−'
        print(f'      r = {r0:.8f}   ξ = {x0:.9f}   {"admissible" if ok else "INADMISSIBLE"}   θ = {th:.6f}   (ρ,z) = ({r0 * x0 if ok else float("nan"):.5f}, ±{r0 * math.cos(th) if ok else float("nan"):.5f})   sgn(Â₊Â₋) = {sgn}')
    print(f'   ⇒ admissible roots {nadm}, reconnection points {2 * nadm}')
    # the dominance crossover (largest r with Φ < 0)
    neg = rs[pv < 0]
    if len(neg): print(f'   dominance window ends at r = {neg[-1]:.4f}')
census((3, 4, 5), '(a) (3d₊₂, 4p₊₁, 5s)')
census((3, 4, 6), '(b) (3d₊₂, 4p₊₁, 6s)')
# (c) Opus's first generic event
E = {3: -1 / 18, 4: -1 / 32, 5: -0.02, 6: -1 / 72}
rho, z, t, phi = 0.925147, -14.159404, 113.526579, 2.515863
r = math.hypot(rho, z); th = math.atan2(rho, z)
modes = [(3, 2, 2), (4, 1, 1), (5, 0, 0), (6, 1, -1)]
coef = {}
for (n, l, m) in modes:
    coef[m] = 0.5 * R(n, l, r) * prof(l, m, th) * cmath.exp(-1j * E[n] * t)
P = [coef[2], coef[1], coef[0], coef[-1]]        # highest power first: P(w) = Σ coef[m] w^{m+1}
w = np.roots(P)
best = min(((abs(w[i] - w[j]) + abs(abs(w[i]) - 1) + abs(abs(w[j]) - 1)), i, j) for i in range(3) for j in range(i + 1, 3))
print(f'(c) Opus event: r = {r:.6f}, θ = {th:.6f}, t = {t}; roots |w| = {[round(abs(x), 7) for x in w]}, args = {[round(cmath.phase(x), 6) for x in w]}')
print(f'    closest pair score |w_i−w_j| + ||w_i|−1| + ||w_j|−1| = {best[0]:.2e};  his φ = {phi}')
psi = sum(coef[m] * cmath.exp(1j * m * phi) for m in coef)
scale = sum(abs(coef[m]) for m in coef)
print(f'    |ψ(r,θ,φ,t)|/scale at his point = {abs(psi) / scale:.2e}')
# the local splitting κ√|τ| and the reciprocal-pair test
for tau in (-2.0, -0.5, 0.5, 2.0):
    c2 = {m: 0.5 * R(n, l, r) * prof(l, m, th) * cmath.exp(-1j * E[n] * (t + tau)) for (n, l, m) in modes}
    ww = np.roots([c2[2], c2[1], c2[0], c2[-1]])
    pair = min(((abs(ww[i] - ww[j])), i, j) for i in range(3) for j in range(i + 1, 3))
    print(f'    τ = {tau:+.1f}: |w1−w2| = {pair[0]:.5f}, |w1 w2| = {abs(ww[pair[1]] * ww[pair[2]]):.6f}, third root |w| = {abs([x for k, x in enumerate(ww) if k not in (pair[1], pair[2])][0]):.4f}')
