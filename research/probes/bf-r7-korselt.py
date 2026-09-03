# bf-r7-korselt.py — Round 7 (Fable): the deafness modulus of every clock in the ladder.
#
# Theorem A.5 of the print: a comb hears the CUBIC clock unless b | 6, because m³ ≡ m (mod b) for all m iff
# b ∈ {1,2,3,6} (Fermat / Korselt for exponent 3).  Claim (Theorem A.11): this is the p = 3 member of a family.
# The degree-p phase 2π(a/b)m^p is AFFINE on ℤ — hence invisible to a revival, absorbable by the classical
# phase x — iff m^p ≡ m (mod b) for every m, iff b is squarefree and (q−1) | (p−1) for every prime q | b.
# For odd p that product of primes is exactly the DENOMINATOR OF THE BERNOULLI NUMBER B_{p−1} (von Staudt–Clausen):
#     p = 3 → denom B₂ = 6    p = 5 → denom B₄ = 30    p = 7 → denom B₆ = 42    p = 9 → denom B₈ = 30
# For even p the criterion collapses to b | 2 (m² ≡ m mod 2).
# Test: the exact peak max_x |Σ_m p_m e(a m^p/b + x m)| / Σ p_m must be 1 exactly iff b divides that modulus.
import math
from fractions import Fraction
import numpy as np
from sympy import bernoulli, primefactors

ms = np.arange(-8, 9)
p_w = np.exp(-(ms ** 2) / 8.0); p_w = p_w / p_w.sum()
XS = {}
def grid(b):
    """a grid that CONTAINS the exact rationals j/b — the optimal classical phase of a deaf packet is one of them"""
    if b not in XS:
        xs = np.unique(np.concatenate([np.linspace(0, 1, 20001, endpoint=False), np.arange(b) / b]))
        XS[b] = (xs, np.exp(2j * np.pi * np.outer(xs, ms)))
    return XS[b]
def peak(a, b, p):
    ph = np.exp(2j * np.pi * ((a * ms.astype(object) ** p) % b).astype(float) / b) * p_w
    return float(np.max(np.abs(grid(b)[1] @ ph)))
def korselt(p):
    """the largest b with m^p ≡ m (mod b) for all m: squarefree, (q−1) | (p−1) for every prime q | b"""
    b = 1
    for q in range(2, 200):
        if all(q % d for d in range(2, int(q ** 0.5) + 1)) and (p - 1) % (q - 1) == 0: b *= q
    return b
print(' p   Korselt modulus K(p)   denom B_{p−1}   the b ≤ 60 with peak = 1 (measured, tol 1e-9)')
for p in [2, 3, 4, 5, 6, 7]:
    K = korselt(p)
    deaf = []
    for b in range(1, 61):
        vals = [peak(a, b, p) for a in range(1, b + 1) if math.gcd(a, b) == 1 or b == 1]
        if vals and min(vals) > 1 - 1e-9: deaf.append(b)
    bern = bernoulli(p - 1)
    dn = Fraction(int(bern.p), int(bern.q)).denominator if bern != 0 else '—  (B odd = 0)'
    ok = 'MATCHES' if deaf == [d for d in range(1, 61) if K % d == 0] else 'DIFFERS'
    print(f' {p}   {K:20d}   {str(dn):14s}  {deaf}   → {ok} the divisors of K(p)')
print()
print('the first non-deaf denominator of each clock, and its peak (the loudest packet hears it):')
for p in [2, 3, 4, 5]:
    K = korselt(p)
    firsts = [b for b in range(2, 40) if K % b != 0][:3]
    for b in firsts:
        best = max(peak(a, b, p) for a in range(1, b) if math.gcd(a, b) == 1)
        worst = min(peak(a, b, p) for a in range(1, b) if math.gcd(a, b) == 1)
        print(f'  p = {p}, b = {b:2d}: peak over a ∈ [{worst:.6f}, {best:.6f}]')
print()
print('the quintic clock in full: b ≤ 60, the peak is 1 exactly on the divisors of 30 and nowhere else')
row = []
for b in [1, 2, 3, 5, 6, 10, 15, 30, 4, 7, 9, 11, 12, 25, 60]:
    vals = [peak(a, b, 5) for a in range(1, b + 1) if math.gcd(a, b) == 1 or b == 1]
    row.append((b, round(min(vals), 6), 30 % b == 0))
print('  (b, min peak over a, 30 % b == 0):', row)
