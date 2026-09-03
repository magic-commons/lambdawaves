# bf-r3-recon5.py — Q15: a reconnection without a symmetry.  ψ = (3d₊₂ + 4p₊₁ + 2s + 4p₋₁ + 5d₋₂)/√5: m = 2,1,0,-1,-2 with
#   energies E3, E4, E2, E4, E5 — three independent Bohr frequencies.  P(w) = w²ψ is a quartic in w = e^{iφ}.
#   A reconnection is a double root on |w| = 1: three real conditions in (r, θ, t) → isolated events.  Search, then refine.
import math, cmath
import numpy as np
from scipy import special, optimize

def R(n, l, r):
    rho = 2.0 * r / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * np.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
# Condon–Shortley Y_l^m without the e^{imφ}: real profiles Θ(θ)
def prof(l, m, th):   # returns the real θ-profile of Y_l^m (including the CS sign and norm), m may be negative
    am = abs(m)
    val = special.sph_harm_y(l, m, th, 0.0).real
    return val
modes = [(3, 2, 2, -1 / 18), (4, 1, 1, -1 / 32), (5, 0, 0, -0.02)]
amp = 1 / math.sqrt(3)
def coeffs(r, th, t):
    # P(w) = Σ_m g_m e^{-iE_m t} w^{m+2}: return highest-first for numpy.roots
    c = np.zeros(3, dtype=complex)
    for (n, l, m, E) in modes:
        c[2 - m] = amp * R(n, l, r) * prof(l, m, th) * cmath.exp(-1j * E * t)
    return c
def score(v):
    r, th, t = v
    if r < 0.2 or r > 40 or th < 0.02 or th > math.pi - 0.02: return 10.0
    w = np.roots(coeffs(r, th, t))
    best = 10.0
    for i in range(len(w)):
        for j in range(i + 1, len(w)):
            s = abs(w[i] - w[j]) + abs(abs(w[i]) - 1) + abs(abs(w[j]) - 1)
            best = min(best, s)
    return best
# coarse search over a grid, then refine the best candidates
rs = np.linspace(2, 40, 60); ths = np.linspace(0.05, math.pi - 0.05, 45); ts = np.arange(0.0, 2400.0, 4.0)
cands = []
for t in ts:
    for r in rs:
        for th in ths:
            s = score((r, th, t))
            if s < 0.08: cands.append((s, r, th, t))
cands.sort()
print(f'coarse candidates (score < 0.08): {len(cands)}')
seen = []
for s, r, th, t in cands[:400]:
    if any(abs(t - u[2]) < 12 and abs(r - u[0]) < 2 and abs(th - u[1]) < 0.4 for u in seen): continue
    res = optimize.minimize(score, [r, th, t], method='Nelder-Mead', options={'xatol': 1e-10, 'fatol': 1e-12, 'maxiter': 4000})
    if res.fun < 1e-7:
        rr, tt, t0 = res.x
        w = np.roots(coeffs(rr, tt, t0)); w = sorted(w, key=lambda z: abs(abs(z) - 1))
        wd = w[0]
        seen.append((rr, tt, t0, res.fun, cmath.phase(wd)))
seen.sort(key=lambda u: u[2])
print('reconnection events (r, θ, t, residual, φ):')
for rr, tt, t0, f, ph in seen[:12]:
    x, y, z = rr * math.sin(tt) * math.cos(ph), rr * math.sin(tt) * math.sin(ph), rr * math.cos(tt)
    # piercing count on the circle just before and after
    def count(tq):
        w = np.roots(coeffs(rr, tt, tq)); return int(sum(1 for z in w if abs(abs(z) - 1) < 1e-3))
    print(f'  t = {t0:10.4f}  r = {rr:8.5f}  θ = {tt:7.5f}  φ = {ph:+8.5f}  (x,y,z) = ({x:+.4f}, {y:+.4f}, {z:+.4f})  residual {f:.1e}  unimodular roots on the circle at t∓0.5: {count(t0 - 0.5)} → {count(t0 + 0.5)}')
print('piercing bound 2M = 2 on every circle: max over the search grid =', max(int(sum(1 for z in np.roots(coeffs(r, th, t)) if abs(abs(z) - 1) < 1e-3)) for t in ts[::40] for r in rs[::5] for th in ths[::5]))
