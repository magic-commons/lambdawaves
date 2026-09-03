# bf-r5-comb.py — Round 5 (Fable).  Ω₃'s weakest joint: is κ = inf_{a,b} A(p; a/b) / (‖p‖₂/‖p‖₁) an absolute constant, or does it
#   grow with the effective tooth count like √(2 ln T_eff)?  A(p; a/b) = max_x |Σ_m p_m e(a m³/b + x m)| / ‖p‖₁ at the cubic level.
#   Envelopes: Gaussian tapers of several widths, uniform combs of several lengths; all reduced a/b with b ≤ B.
import math, sys
import numpy as np
from math import gcd
B = int(sys.argv[1]) if len(sys.argv) > 1 else 60
NX = 4001
xs = np.linspace(0, 1, NX, endpoint=False)
def peaks(p, ms, B):
    p = p / p.sum()
    l2 = math.sqrt((p ** 2).sum())
    ph_lin = np.exp(2j * math.pi * np.outer(xs, ms))            # NX × T
    res = {}
    for b in range(1, B + 1):
        for a in range(0, b):
            if gcd(a, b) != 1: continue
            cub = np.exp(2j * math.pi * (a * ms ** 3 % b) / b)
            vals = np.abs(ph_lin @ (p * cub))
            res[(a, b)] = vals.max()
    return res, l2
envelopes = []
for s in [1.0, 1.5, 2.0, 3.0, 4.0, 6.0, 8.0]:
    M = int(math.ceil(4 * s)); ms = np.arange(-M, M + 1)
    envelopes.append((f'gauss σ={s}', ms, np.exp(-ms ** 2 / (2 * s * s))))
for T in [5, 9, 17, 33, 65]:
    M = T // 2; ms = np.arange(-M, M + 1)
    envelopes.append((f'uniform T={T}', ms, np.ones(T)))
print(f'b ≤ {B}, x on {NX} points.  A = max_x|Σ p_m e(am³/b + xm)|/‖p‖₁ at the cubic level.')
print(' envelope           T   T_eff    ‖p‖₂/‖p‖₁   min A (all b)  at a/b    min A (prime b)  at a/b    κ=min/ratio   κ_prime   √(2 ln T_eff)   b|6 peaks (min)')
for label, ms, p in envelopes:
    res, l2 = peaks(p, ms, B)
    pn = p / p.sum(); Teff = 1.0 / (pn ** 2).sum()
    allmin = min(res.items(), key=lambda kv: kv[1])
    primes = [b for b in range(2, B + 1) if all(b % d for d in range(2, int(b ** 0.5) + 1))]
    pmin = min(((k, v) for k, v in res.items() if k[1] in primes and k[1] >= 5), key=lambda kv: kv[1])
    deaf = min(v for k, v in res.items() if 6 % k[1] == 0)
    print(f' {label:16s} {len(ms):3d}  {Teff:6.2f}   {l2:.6f}    {allmin[1]:.6f}   {allmin[0][0]}/{allmin[0][1]:<3d}   {pmin[1]:.6f}      {pmin[0][0]}/{pmin[0][1]:<3d}   {allmin[1] / l2:.4f}     {pmin[1] / l2:.4f}     {math.sqrt(2 * math.log(Teff)):.4f}        {deaf:.6f}')
# the complete-sum regime: uniform T = 65 > b = 37 — peak vs the closed form from the cubic Gaussian periods
ms = np.arange(-32, 33); p = np.ones(65)
res, l2 = peaks(p, ms, 37)
print('complete-sum regime (uniform T=65 teeth, b=37): min over a of A =', round(min(v for k, v in res.items() if k[1] == 37), 6), ' max over a =', round(max(v for k, v in res.items() if k[1] == 37), 6))
# closed form: for T ≥ b and uniform p, Σ_m e(am³/b + xm) over a full period is b·[S(a,b; x)]/... print the complete cubic sums for reference
for a in [1, 2, 4]:
    S = sum(np.exp(2j * math.pi * (a * m ** 3 % 37) / 37) for m in range(37))
    print(f'   complete cubic sum |Σ_(m mod 37) e(a m³/37)| for a={a}: {abs(S):.6f}  (Weil bound 2√37 = {2 * math.sqrt(37):.4f})')
