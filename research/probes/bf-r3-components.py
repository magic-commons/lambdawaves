# bf-r3-components.py — settle the reconnection question by counting the nodal set's connected components in 3D.
#   ψ = (2p₊ + 3p₀ + 3d₋)/√3, τ = (E3 - E2) t.  Nodal set = unimodular roots of P(w) = f1 e^{iτ} w² + f2 w + f3 (Opus, round 2).
#   For each (r, θ) on a fine grid, keep the roots with ||w| - 1| < tol, giving points (r, θ, φ); connect points in adjacent
#   grid cells whose φ differ by less than a threshold; count components.  If Opus is right, the count is constant on (0, π)
#   and on (π, 2π) and changes only at τ = 0, π.
import math, cmath, sys
import numpy as np
from scipy import special

def R(n, l, r):
    rho = 2.0 * r / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * np.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
A = B = C = 1 / math.sqrt(3)
c11 = -math.sqrt(3 / (8 * math.pi)); c10 = math.sqrt(3 / (4 * math.pi)); c2m1 = math.sqrt(15 / (8 * math.pi))
nr, nth = 1400, 700
rs = np.linspace(0.05, 36, nr); ths = np.linspace(0.005, math.pi - 0.005, nth)
Rg, Tg = np.meshgrid(rs, ths, indexing='ij')
s, c = np.sin(Tg), np.cos(Tg)
f1 = A * R(2, 1, Rg) * c11 * s; f2 = B * R(3, 1, Rg) * c10 * c; f3 = C * R(3, 2, Rg) * c2m1 * s * c

def components(tau, tol=2e-3):
    a = f1 * np.exp(1j * tau)
    disc = f2 * f2 - 4 * a * f3
    sq = np.sqrt(disc.astype(complex))
    with np.errstate(divide='ignore', invalid='ignore'):
        w1 = (-f2 + sq) / (2 * a); w2 = (-f2 - sq) / (2 * a)
    pts = {}
    for w in (w1, w2):
        m = np.abs(np.abs(w) - 1) < tol
        for i, j in zip(*np.nonzero(m)):
            pts.setdefault((int(i), int(j)), []).append(float(np.angle(w[i, j])))
    # union-find over neighbouring cells with close φ
    parent = {}
    keys = list(pts.keys())
    idx = {}
    for k in keys:
        for q, ph in enumerate(pts[k]): idx[(k, q)] = (k, q); parent[(k, q)] = (k, q)
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    def union(x, y): parent[find(x)] = find(y)
    for (i, j) in keys:
        for di in (-2, -1, 0, 1, 2):
            for dj in (-2, -1, 0, 1, 2):
                nb = (i + di, j + dj)
                if nb == (i, j) or nb not in pts: continue
                for q, ph in enumerate(pts[(i, j)]):
                    for q2, ph2 in enumerate(pts[nb]):
                        d = abs((ph - ph2 + math.pi) % (2 * math.pi) - math.pi)
                        if d < 0.15: union(((i, j), q), (nb, q2))
    roots = set(find(x) for x in parent)
    sizes = {}
    for x in parent: sizes[find(x)] = sizes.get(find(x), 0) + 1
    big = sorted([v for v in sizes.values() if v >= 20], reverse=True)
    return len(big), big[:8], len(parent)

taus = [0.0, 0.05, 0.3, 0.7, 1.0, 1.5, 2.0, 2.5, 3.0, 3.1, math.pi, 3.2, 3.6, 4.5, 5.5, 6.2]
print('τ        components   sizes (≥ 20 points)                     nodal points')
for tau in taus:
    n, big, npts = components(tau)
    print(f'{tau:6.3f}   {n:3d}          {big}   {npts}')
