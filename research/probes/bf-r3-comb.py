# bf-r3-comb.py — Q13: the packet that hears the arithmetic.  A comb p_k ∝ 1[d | k] e^{-k²/2σ²} against the Gaussian.
#   Cubic phase at T_rev: (8π/(3n̄)) k³ = 2π · (4/(3n̄)) k³.  For k = d m: 2π (4 d³/(3n̄)) m³ — an INTEGER multiple of 2π iff 3n̄ | 4d³.
#   Theorem A5 (Fable): a comb of spacing d has NO cubic dephasing at T_rev when 3n̄ | 4d³ (d = 3: n̄ | 36, i.e. n̄ = 36 exactly at d = 3).
import math, cmath
import numpy as np
from fractions import Fraction

def ladder(nbar, sig, d=None, kmax=13):
    ks = np.arange(-kmax, kmax + 1)
    if d: ks = ks[ks % d == 0]
    ns = nbar + ks; keep = ns >= 1; ks = ks[keep]; ns = ns[keep]
    w = np.exp(-ks ** 2 / (2 * sig * sig)); p = w / w.sum(); E = -0.5 / ns.astype(float) ** 2
    return ks, p, E
def supA(p, E, nbar):
    Tcl = 2 * math.pi * nbar ** 3; Trev = 4 * math.pi / 3 * nbar ** 4
    xs = np.linspace(-0.5, 0.5, 8001)
    vals = [abs(np.sum(p * np.exp(-1j * E * (Trev + x * Tcl)))) for x in xs]
    k = int(np.argmax(vals)); return vals[k], xs[k]
print(' n̄    3n̄|4d³?   Gaussian σ=2: sup|A|  x*      comb d=3, same σ: sup|A|  x*     |Σ_comb p e(4k³/3n̄)|   cubic-free ladder (comb, cubic phase removed by hand)')
for nbar in [27, 30, 33, 36, 39, 42, 45, 54, 72, 108]:
    ks, p, E = ladder(nbar, 2.0); g, xg = supA(p, E, nbar)
    kc, pc, Ec = ladder(nbar, 2.0, d=3); c, xc = supA(pc, Ec, nbar)
    S = abs(np.sum(pc * np.exp(2j * math.pi * 4 * kc.astype(float) ** 3 / (3 * nbar))))
    divides = (4 * 27) % (3 * nbar) == 0
    # the comb with the cubic term of the phase subtracted (a diagnostic, not a state): remaining = quartic and higher
    Tcl = 2 * math.pi * nbar ** 3; Trev = 4 * math.pi / 3 * nbar ** 4
    xs = np.linspace(-0.5, 0.5, 8001)
    vals = [abs(np.sum(pc * np.exp(-1j * Ec * (Trev + x * Tcl) - 1j * 8 * math.pi / (3 * nbar) * kc.astype(float) ** 3))) for x in xs]
    print(f' {nbar:4d}   {str(divides):5s}     {g:.4f}          {xg:+.3f}   {c:.4f}                {xc:+.3f}    {S:.4f}                 {max(vals):.4f}')
print()
print('comb spacing d vs n̄ that kills the cubic phase (3n̄ | 4d³): d=2: n̄ | 32/3 → none;  d=3: n̄=36 (and 12, 18, 9 …);  d=6: 4·216=864 → 3n̄ | 864 → n̄ | 288: n̄ ∈ {…, 36, 48, 72, 96, 144, 288}')
print('at n̄ = 48 with d = 6, σ = 4:')
for nbar, d, sig in [(48, 6, 4.0), (72, 6, 4.0), (48, 4, 3.0), (60, 5, 3.5)]:
    ks, p, E = ladder(nbar, sig, kmax=30); g, xg = supA(p, E, nbar)
    kc, pc, Ec = ladder(nbar, sig, d=d, kmax=30); c, xc = supA(pc, Ec, nbar)
    fr = Fraction(4 * d ** 3, 3 * nbar)
    print(f'  n̄={nbar} d={d} σ={sig}: 4d³/(3n̄) = {fr}  Gaussian sup|A| {g:.4f}   comb sup|A| {c:.4f}')
