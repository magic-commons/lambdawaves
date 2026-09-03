#!/usr/bin/env python
"""BF R9 (Opus, QCD) — probe 2b: the Riccati recursion, exact s_k, and the S1 dictionary.

Corpus Y-0128 (YMD-DISK-01, l.477):  eta = I_2/I_1 obeys eta' = 1 - 3 eta/beta - eta^2,
equivalently  sigma_0' = 3/beta - 2 sinh(sigma_0)  with sigma_0 = -log eta.
Generate s_k exactly in Q, to k = 60, and test Theorem S1 (Opus R4):
    s_k = -(2/pi)[ G(k)/2^k + (9/4)G(k-1)/2^{k-1} + (117/32)G(k-2)/2^{k-2}
                   + (633/128)G(k-3)/2^{k-3} + ... ]
"""
from fractions import Fraction as F
import mpmath as mp
mp.mp.dps = 80

K = 62
# sigma_0 = sum_{k>=1} s_k x^k ,  x = 1/beta.  d/dbeta = -x^2 d/dx.
# -x^2 sigma' = 3 x - 2 sinh(sigma)
# order x^{k+1}:   -k s_k = 3 [k==0] - 2 * [sinh(sigma)]_{k+1}
# [sinh(sigma)]_{m} = s_m + (sigma^3)_m/6 + (sigma^5)_m/120 + ...
s = [F(0)]*(K+3)

def mul(a, b, n):
    """truncated series product, lists indexed by power, up to n"""
    out = [F(0)]*(n+1)
    for i, ai in enumerate(a):
        if ai == 0 or i > n:
            continue
        for j, bj in enumerate(b):
            if i+j > n:
                break
            if bj:
                out[i+j] += ai*bj
    return out

for k in range(0, K):
    m = k+1
    # build sinh(sigma) up to order m using the s already known (s_m unknown, appears linearly
    # only in the first term since sigma^3 starts at x^3 and needs s_j with j <= m-2)
    sig = s[:m+1] + [F(0)]*(m+1-len(s[:m+1]))
    sig = list(s[:m+1])
    sig[m] = F(0)                      # exclude the unknown
    p = list(sig); tot = list(sig)     # sinh = sigma + sigma^3/6 + sigma^5/120 + ...
    fact = F(1); pw = 1
    cur = list(sig)
    term = list(sig)
    r = 3
    while True:
        term = mul(mul(term, sig, m), sig, m)
        if all(t == 0 for t in term):
            break
        f = F(1)
        for i in range(2, r+1):
            f *= i
        tot = [a+b/f for a, b in zip(tot, term)]
        r += 2
        if r > m+2:
            break
    known = tot[m]                     # [sinh]_m without the s_m contribution
    if k == 0:
        # -0*s_0 = 3 - 2(s_1 + ...) at order x^1
        s[1] = F(3, 2)
        continue
    # -k s_k = -2 (known + s_{k+1}? ) : careful -- [sinh]_{k+1} contains s_{k+1}
    # -k s_k = -2 [known_{k+1} + s_{k+1}]  =>  s_{k+1} = (k s_k)/2 - known_{k+1}
    s[k+1] = F(k, 1)*s[k]/2 - known

print("="*78)
print("BF R9 probe 2b — Riccati s_k (exact rationals) and Theorem S1")
print("="*78)
print("\ns_1..s_8 =", [str(s[k]) for k in range(1, 9)])
print("corpus Y-0128: 3/2, 3/4, 3/16, -9/16   (and Y-0128 EXTENDS the disk by s_4=-9/16)")
print("s_9..s_12   =", [str(s[k]) for k in range(9, 13)])

# --- Gevrey ratio |s_{k+1}|/((k+1)|s_k|)  -> 1/A = 1/2
print("\nGevrey ratio |s_{k+1}|/((k+1)|s_k|) -> 1/A:")
for k in (10, 20, 30, 40, 50, 60):
    r = abs(F(s[k+1], 1))/((k+1)*abs(s[k]))
    print("   k=%2d : %.10f   (A_eff = %.8f)" % (k, float(r), 1/float(r)))

# --- Theorem S1 dictionary
co = [mp.mpf(1), mp.mpf(9)/4, mp.mpf(117)/32, mp.mpf(633)/128]
def s_pred(k, nterm=4):
    tot = mp.mpf(0)
    for r in range(min(nterm, k)):
        tot += co[r]*mp.gamma(k-r)/mp.mpf(2)**(k-r)
    return -2/mp.pi*tot
print("\nTheorem S1 dictionary  s_k^pred / s_k^exact  (4 terms of the companion series):")
for k in (10, 20, 30, 40, 50, 60):
    ex = mp.mpf(s[k].numerator)/mp.mpf(s[k].denominator)
    print("   k=%2d : ratio = %.12f" % (k, float(s_pred(k)/ex)))
print("\nStokes constant  lim s_k * pi 2^k / (-2 Gamma(k)) -> 1:")
for k in (20, 40, 60):
    ex = mp.mpf(s[k].numerator)/mp.mpf(s[k].denominator)
    print("   k=%2d : %.10f" % (k, float(ex*mp.pi*mp.mpf(2)**k/(-2*mp.gamma(k)))))
print("   S_sigma = -2/pi =", mp.nstr(-2/mp.pi, 12))

# --- the leading strong-coupling tension:  a^2 sigma = -log(I2/I1) small beta
print("\n" + "="*78)
print("STRONG COUPLING: a^2 sigma = -log(I_2(beta)/I_1(beta))")
print("="*78)
def tension(b):
    return -mp.log(mp.besseli(2, b)/mp.besseli(1, b))
for b in (0.5, 1.0, 1.5, 2.0, 2.5, 3.0):
    print("   beta=%.1f : a^2 sigma = %.10f ,  log(4/beta) = %.10f , diff = %+.3e"
          % (b, tension(b), mp.log(4/b), tension(b)-mp.log(4/b)))
# series of  -log(I2/I1) - log(4/beta)  in beta
print("\n   -log(I2/I1) = log(4/beta) + c2 beta^2 + c4 beta^4 + ...")
bs = [mp.mpf('0.01')*j for j in range(1, 9)]
import numpy as np
A = np.array([[float(b)**(2*j) for j in range(1, 5)] for b in bs])
y = np.array([float(tension(b)-mp.log(4/b)) for b in bs])
c, *_ = np.linalg.lstsq(A, y, rcond=None)
print("   fitted c2,c4,c6,c8 =", np.array2string(c, precision=8),
      "  (c2 = 1/16 =", 1/16, ", c4 = ?)")
