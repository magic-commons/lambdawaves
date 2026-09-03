#!/usr/bin/env python
"""bf-r6-kappa2.py — Q30 continued: convergence of the infimum in B, the law across T,
and the MOMENT LADDER lower bound  kappa^2 >= M_{2k}/(M_{2k-2} T)  (exact, N-point average is exact
because |S|^{2k} is a trig polynomial of degree k(T-1) < N/2)."""
import numpy as np, sys, time
from math import gcd, log, sqrt

def fractions(B, half=True):
    out = []
    for b in range(1, B + 1):
        for a in range(1, b + 1) if b > 1 else [1]:
            if gcd(a, b) != 1: continue
            if b == 1 and a != 1: continue
            if half and b > 2 and a > b // 2: continue
            out.append((a, b))
    return out

def scan(T, B, N, chunk=128):
    ms = np.arange(-(T // 2), T // 2 + 1); m3 = ms.astype(object) ** 3
    fr = fractions(B); best = (2.0, None)
    for i in range(0, len(fr), chunk):
        blk = fr[i:i + chunk]
        buf = np.zeros((len(blk), N), dtype=np.complex128)
        for r, (a, b) in enumerate(blk):
            ph = np.array([int((a * int(x)) % b) for x in m3])
            buf[r, ms % N] = np.exp(2j * np.pi * ph / b)
        F = np.abs(np.fft.fft(buf, axis=1)).max(axis=1) / T
        j = int(np.argmin(F))
        if F[j] < best[0]: best = (float(F[j]), blk[j])
    return best

def moments(T, a, b, N, K=8):
    ms = np.arange(-(T // 2), T // 2 + 1); m3 = ms.astype(object) ** 3
    buf = np.zeros(N, dtype=np.complex128)
    ph = np.array([int((a * int(x)) % b) for x in m3])
    buf[ms % N] = np.exp(2j * np.pi * ph / b)
    S2 = np.abs(np.fft.fft(buf)) ** 2
    return [float(np.mean(S2 ** k)) for k in range(0, K + 1)]

if __name__ == '__main__':
    print("== convergence of inf_{a/b, b<=B} A in B ==")
    print(f"{'T':>5} " + "".join(f"{'B='+str(B):>12}" for B in (2, 4, 8, 16)) + "     (B = cT)")
    rows = {}
    for T in (5, 9, 17, 33, 65, 129):
        N = 1 << max(13, int(np.ceil(np.log2(8 * T))) + 6)
        line = f"{T:5} "
        for c in (2, 4, 8, 16):
            B = c * T
            if B > 1200: line += f"{'-':>12}"; continue
            A, f = scan(T, B, N)
            line += f"{A:12.6f}"
            rows[(T, c)] = (A, f, A * sqrt(T))
        print(line + f"   last a/b = {rows[(T,8)][1] if (T,8) in rows else rows[(T,4)][1]}")
        sys.stdout.flush()

    print("\n== the law, at the converged budget B = 8T ==")
    print(f"{'T':>5} {'inf A':>11} {'a/b':>12} {'kappa':>9} {'kappa^2':>9} {'lnT':>8} {'k^2-lnT':>9} {'k^2/lnT':>9}")
    for T in (5, 9, 17, 33, 65, 129):
        key = (T, 8) if (T, 8) in rows else (T, 4)
        A, f, k = rows[key]
        print(f"{T:5} {A:11.6f} {str(f[0])+'/'+str(f[1]):>12} {k:9.4f} {k*k:9.4f} {log(T):8.4f} {k*k-log(T):+9.3f} {k*k/log(T):9.4f}")

    print("\n== the moment ladder at the minimising fraction:  kappa^2 >= M_{2k}/(M_{2k-2} T) ==")
    print("   (M_{2k} = int_0^1 |S|^{2k} dx, exact; the Gaussian model gives M_{2k} = k! T^k so the bound -> k)")
    print(f"{'T':>5} {'a/b':>12} {'kappa^2':>9} " + "".join(f"{'k='+str(k):>9}" for k in range(2, 9)))
    for T in (5, 9, 17, 33, 65, 129):
        key = (T, 8) if (T, 8) in rows else (T, 4)
        A, f, k = rows[key]
        N = 1 << max(14, int(np.ceil(np.log2(20 * T))) + 1)
        M = moments(T, f[0], f[1], N, K=8)
        bnds = [M[j] / (M[j - 1] * T) for j in range(2, 9)]
        print(f"{T:5} {str(f[0])+'/'+str(f[1]):>12} {k*k:9.4f} " + "".join(f"{b:9.4f}" for b in bnds))
        sys.stdout.flush()
    print("\n== the same, but M_{2k}/(k! T^k) — how long the diagonal dominates ==")
    from math import factorial
    print(f"{'T':>5} " + "".join(f"{'k='+str(k):>9}" for k in range(1, 9)))
    for T in (5, 9, 17, 33, 65, 129):
        key = (T, 8) if (T, 8) in rows else (T, 4)
        A, f, k = rows[key]
        N = 1 << max(14, int(np.ceil(np.log2(20 * T))) + 1)
        M = moments(T, f[0], f[1], N, K=8)
        print(f"{T:5} " + "".join(f"{M[j]/(factorial(j)*T**j):9.4f}" for j in range(1, 9)))
