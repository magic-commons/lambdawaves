# bf-r4-comb.py — Round 4 (Opus).  Q20: the arithmetic comb, the Weil bound, and the worst denominator.
# max_x |sum_m p_m e(a m^3 / b + x m)| for a Gaussian-weighted comb; vectorised.
import math, cmath
import numpy as np
np.seterr(all='ignore')
d, sig = 30, 60
ms = np.arange(-8, 9)
p = np.exp(-(ms * d) ** 2 / (2 * sig ** 2)); p = p / p.sum()
xs = np.linspace(0, 1, 20001)
PH = np.exp(2j * np.pi * np.outer(xs, ms))            # 20001 x 17
print(f'comb: teeth m = -8..8, spacing d = {d}, Gaussian sigma = {sig}; p_m/p_0 (m=0..4) = '
      f'{[round(float(x),4) for x in (p/p[8])[8:13]]}')
def peak(a, b):
    ph = np.exp(2j * np.pi * ((a * ms ** 3) % b) / b) * p
    return float(np.max(np.abs(PH @ ph)))
def cubicsum(a, b):
    return abs(sum(cmath.exp(2j * math.pi * a * x ** 3 / b) for x in range(b)))
print()
print('  Round 3 Theorem A5 table, recomputed exactly:')
print('   nbar     a/b     exact peak   Round 3   |S(a,b)| complete   Weil 2 sqrt b   1-(1-b^-1/2)')
tab = [(36000, 1, 1, .966), (24000, 3, 2, .938), (27000, 4, 3, .932), (32400, 10, 9, .811),
       (40500, 8, 9, .819), (34000, 18, 17, .821), (45000, 4, 5, .729), (30000, 6, 5, .760)]
for nbar, a, b, r3 in tab:
    print(f'  {nbar:6d}   {a:2d}/{b:2d}    {peak(a,b):9.6f}    {r3:.3f}     {cubicsum(a,b):10.6f}'
          f'         {2*math.sqrt(b):8.4f}        {1-(1-b**-0.5):.4f}')
print()
print('  every reduced a/b with b <= 60: the ten lowest peaks (packets that hear the arithmetic most)')
allp = []
for b in range(1, 61):
    for a in range(1, b + 1):
        if b > 1 and math.gcd(a, b) != 1: continue
        allp.append((peak(a, b), a, b))
allp.sort()
for pk, a, b in allp[:12]:
    print(f'    a/b = {a:2d}/{b:2d}   peak = {pk:.6f}   |S| = {cubicsum(a,b):9.5f}   |S|/b = {cubicsum(a,b)/b:.4f}'
          f'   2/sqrt(b) = {2/math.sqrt(b):.4f}')
print('  the ten highest (deaf packets):')
for pk, a, b in allp[-10:]:
    print(f'    a/b = {a:2d}/{b:2d}   peak = {pk:.6f}')
print()
print('  Fermat: b | 6  =>  m^3 = m (mod b) for all m  =>  the cubic phase is affine  =>  peak = 1 exactly')
for b in (1, 2, 3, 6):
    print(f'    b = {b}: max_a peak = {max(peak(a,b) for a in range(1,b+1)):.10f}')
print()
print('  is b = 5 the worst?  minimum peak over a, as a function of b:')
byb = {}
for pk, a, b in allp: byb.setdefault(b, []).append((pk, a))
for b in sorted(byb):
    if b > 40: break
    pk, a = min(byb[b])
    print(f'    b = {b:2d}:  min peak {pk:.6f} at a = {a:2d}   (mean over a: {np.mean([q for q,_ in byb[b]]):.6f})')
