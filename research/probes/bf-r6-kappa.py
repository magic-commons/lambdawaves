#!/usr/bin/env python
"""bf-r6-kappa.py — Q30: the gain kappa = inf_{a/b} A(p;a/b) / (||p||_2/||p||_1) for uniform combs.
A(p;a/b) = max_x |sum_m p_m e(a m^3/b + x m)| / sum p_m ; max over x by zero-padded FFT (N = 16384).
Reproduces Fable's b<=60 row, then runs T = 129 with b <= 300, split by régime (b < T vs b > T)."""
import numpy as np, sys, time
from math import gcd, log, sqrt

N = 16384                       # x-grid; T <= 129 so ~127 samples per lobe

def fractions(B, half=True):
    out = []
    for b in range(1, B + 1):
        for a in range(1, b + 1) if b > 1 else [1]:
            if gcd(a, b) != 1: continue
            if b == 1 and a != 1: continue
            if half and b > 2 and a > b // 2: continue     # A(a/b) = A((b-a)/b) by conjugation
            out.append((a, b))
    return out

def kappa(T, B, bmin=1, bmax=None, chunk=192):
    ms = np.arange(-(T // 2), T // 2 + 1)
    assert len(ms) == T
    m3 = (ms.astype(np.int64) ** 3)
    fr = [(a, b) for (a, b) in fractions(B) if bmin <= b <= (bmax or B)]
    best = (2.0, None)
    for i in range(0, len(fr), chunk):
        blk = fr[i:i + chunk]
        buf = np.zeros((len(blk), N), dtype=np.complex128)
        for r, (a, b) in enumerate(blk):
            ph = ((a * m3) % b + b) % b
            buf[r, ms % N] = np.exp(2j * np.pi * ph / b)
        F = np.abs(np.fft.fft(buf, axis=1)).max(axis=1) / T
        j = int(np.argmin(F))
        if F[j] < best[0]: best = (float(F[j]), blk[j])
    A, frac = best
    return A, frac, A * sqrt(T)

if __name__ == '__main__':
    print("== reproduction of Fable's bf-r5-comb (uniform combs, b <= 60) ==")
    print(f"{'T':>5} {'inf A':>12} {'at a/b':>10} {'kappa':>9} {'kappa^2-lnT':>12}")
    for T in (5, 9, 17, 33, 65):
        A, f, k = kappa(T, 60)
        print(f"{T:5} {A:12.6f} {str(f[0])+'/'+str(f[1]):>10} {k:9.4f} {k*k-log(T):12.3f}")
    sys.stdout.flush()

    print("\n== Q30: T = 129, b <= 300 ==")
    t0 = time.time()
    for label, lo, hi in (('all b <= 300', 1, 300), ('incomplete only, b > T', 130, 300),
                          ('complete only, b <= T', 1, 129), ('b <= 60 (Fable window)', 1, 60)):
        A, f, k = kappa(129, 300, lo, hi)
        print(f"  {label:24} inf A = {A:.6f}  at {f[0]}/{f[1]}   kappa = {k:.4f}   kappa^2 - ln T = {k*k-log(129):+.3f}")
        sys.stdout.flush()
    print(f"  ({time.time()-t0:.1f} s)")

    print("\n== the same split for every T, to see c0 as a function of the regime ==")
    print(f"{'T':>5} {'B':>5} {'regime':>16} {'inf A':>11} {'a/b':>10} {'kappa':>8} {'k^2-lnT':>9}")
    for T in (5, 9, 17, 33, 65, 129):
        for label, lo, hi in (('all b<=300', 1, 300), ('b > T', T + 1, 300)):
            A, f, k = kappa(T, 300, lo, hi)
            print(f"{T:5} {300:5} {label:>16} {A:11.6f} {str(f[0])+'/'+str(f[1]):>10} {k:8.4f} {k*k-log(T):+9.3f}")
            sys.stdout.flush()

    print("\n== how the minimiser's denominator moves with B (T = 129) ==")
    for B in (60, 100, 150, 200, 300, 500):
        A, f, k = kappa(129, B)
        print(f"  B = {B:4}   inf A = {A:.6f} at {f[0]}/{f[1]}   kappa = {k:.4f}   kappa^2 - ln T = {k*k-log(129):+.3f}")
        sys.stdout.flush()
