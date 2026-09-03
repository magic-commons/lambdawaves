# bf-r3-comb2.py — the packet that hears the arithmetic, done where it can be heard: many teeth inside the cubic regime.
#   d = 12, σ = 14, n̄ near 1152 (where 4d³/(3n̄) = 2 exactly).  β₃ = 8πσ³/(3n̄) ≈ 20 (the Gaussian revival is dead),
#   β₄ = (10π/3)(σ²/n̄)² ≈ 0.3.  A comb of spacing d has cubic phases 2π (4d³/(3n̄)) m³ — integral iff 3n̄ | 4d³.
import math
import numpy as np
from fractions import Fraction

def packet(nbar, sig, d, kmax):
    ks = np.arange(-kmax, kmax + 1)
    if d: ks = ks[ks % d == 0]
    ns = nbar + ks; ks = ks.astype(float); ns = ns.astype(float)
    w = np.exp(-ks ** 2 / (2 * sig * sig)); p = w / w.sum(); E = -0.5 / ns ** 2
    return ks, p, E
def supA(p, E, nbar, half=0.5, N=20001):
    Tcl = 2 * math.pi * nbar ** 3; Trev = 4 * math.pi / 3 * nbar ** 4
    xs = np.linspace(-half, half, N)
    vals = np.abs(np.exp(-1j * np.outer(xs * Tcl + Trev, E)) @ p)
    k = int(np.argmax(vals)); return vals[k], xs[k]
d, sig = 12, 14.0
print(f'd = {d}, σ = {sig}: teeth m = ±1, ±2, ±3 carry weights {[round(math.exp(-(d * m) ** 2 / (2 * sig ** 2)), 3) for m in (1, 2, 3)]} relative to m = 0')
print('  n̄     4d³/(3n̄)      β₃      β₄     Gaussian sup|A|   comb sup|A|   x*(comb)')
for nbar in [1152, 1104, 1128, 1176, 1200, 1140, 1164, 1116, 1188, 1080, 1224]:
    fr = Fraction(4 * d ** 3, 3 * nbar)
    b3 = 8 * math.pi * sig ** 3 / (3 * nbar); b4 = 10 * math.pi / 3 * (sig * sig / nbar) ** 2
    kg, pg, Eg = packet(nbar, sig, None, 84); g, _ = supA(pg, Eg, nbar)
    kc, pc, Ec = packet(nbar, sig, d, 84); c, xc = supA(pc, Ec, nbar)
    print(f' {nbar:5d}   {str(fr):>9}   {b3:6.2f}   {b4:5.3f}     {g:.4f}           {c:.4f}       {xc:+.3f}')
print('reading: the comb revives only where 4d³/(3n̄) is an integer or nearly one; the Gaussian never does at this β₃.')
