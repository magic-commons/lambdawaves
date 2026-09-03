#!/usr/bin/env python
"""bf-r6-superrevival.py — the exact ladder sum at t = T_sr = pi nbar^5, against the Pearcey envelope.
Claim: reducing each Taylor coefficient of t/2n^2 modulo 2pi (legitimate, s integral) gives at T_sr
   C1 = -pi nbar^2      -> 0 or pi  (a half shift of x)
   C2 = 3 pi nbar / 2   -> (pi/2)(3 nbar mod 4)         <-- the QUARTIC-LEVEL ARITHMETIC
   C3 = -2 pi           -> 0                            <-- why T_sr is the superrevival
   C4 = 5 pi / (2 nbar) -> beta4 = 5 pi sigma^4 / (2 nbar)
so nbar even  =>  pure Pearcey at X = 0;  nbar odd  =>  an extra quadratic Gauss phase e^{+- i pi s^2/2} (mod 4).
"""
from mpmath import mp, mpf, mpc, exp, sqrt, pi, quad, fabs, j as I, nstr
mp.dps = 45

def ladder_abs(nbar, sigma, t, K=8):
    """|sum_n p_n e^{i t/(2 n^2)}| with p_n Gaussian, phases in exact high precision, max over a global phase."""
    lo, hi = max(1, nbar - K*sigma), nbar + K*sigma
    s = mpc(0); Z = mpf(0)
    for n in range(int(lo), int(hi) + 1):
        p = exp(-mpf(n - nbar)**2 / (2 * mpf(sigma)**2)); Z += p
        s += p * exp(I * t / (2 * mpf(n)**2))
    return fabs(s) / Z

def I4(alpha, delta, b4, L=16):
    f = lambda u: exp(-u**2/2 + I*(alpha*u + delta*u**2 + b4*u**4))
    return quad(f, [-L, 0, L]) / sqrt(2*pi)

def envelope_max(delta, b4, xs=None):
    """max over the linear offset alpha of |I4|, on a grid + refinement."""
    best = mpf(0); ab = mpf(0)
    for k in range(-40, 41):
        a = mpf(k) / 8
        v = fabs(I4(a, delta, b4))
        if v > best: best, ab = v, a
    for it in range(30):
        h = mpf(1)/8/mpf(2)**it
        for a in (ab - h, ab + h):
            v = fabs(I4(a, delta, b4))
            if v > best: best, ab = v, a
    return best, ab

print("=== the superrevival at t = T_sr = pi nbar^5, exact ladder vs the quartic envelope ===")
print("  prediction: nbar even -> delta = 0 (pure Pearcey);  nbar odd -> delta = (pi/2) sigma^2 * (3 nbar mod 4)")
print(f"{'nbar':>6}{'nbar%4':>7}{'sigma':>6}{'beta4':>10}{'|A| exact':>13}{'delta pred':>12}{'|I4| max':>12}{'rel':>10}{'|I4| d=0':>11}")
for nbar in (28, 29, 30, 31, 60, 61, 62, 63, 100, 101):
    for sigma in (1, 2):
        t = pi * mpf(nbar)**5
        A = ladder_abs(nbar, sigma, t)
        b4 = 5 * pi * mpf(sigma)**4 / (2 * mpf(nbar))
        c2 = (3 * pi * mpf(nbar) / 2) % (2*pi)
        delta = c2 * mpf(sigma)**2
        m, ab = envelope_max(delta, b4)
        m0, _ = envelope_max(mpf(0), b4)
        print(f"{nbar:6}{nbar%4:7}{sigma:6}{float(b4):10.4f}{float(A):13.8f}{float(c2):12.5f}{float(m):12.8f}"
              f"{float(abs(A-m)/A):10.2e}{float(m0):11.8f}")

print("\n=== the same at the REVIVAL, for contrast (C3 = -8 pi/3 nbar is NOT trivial there) ===")
print(f"{'nbar':>6}{'sigma':>6}{'beta3':>10}{'beta4':>10}{'|A| at T_rev':>15}")
for nbar in (28, 29, 30, 31):
    for sigma in (1, 2):
        t = 4 * pi * mpf(nbar)**4 / 3
        A = ladder_abs(nbar, sigma, t)
        print(f"{nbar:6}{sigma:6}{float(8*pi*mpf(sigma)**3/(3*nbar)):10.4f}{float(10*pi*mpf(sigma)**4/(3*mpf(nbar)**2)):10.4f}{float(A):15.9f}")

print("\n=== the leading quartic law:  |I4(0,0;b4)| = 1 - 48 b4^2 + O(b4^4) ===")
print(f"{'b4':>10}{'|I4| exact':>16}{'1 - 48 b4^2':>16}{'diff':>12}")
for b4 in [mpf(x) for x in ('0.001','0.003','0.01','0.03','0.1')]:
    v = fabs(I4(0, 0, b4))
    print(f"{float(b4):10.4f}{float(v):16.10f}{float(1-48*b4**2):16.10f}{float(v-(1-48*b4**2)):12.2e}")
print("  => the Airy/cubic envelope height is accurate to eps iff beta4 <= sqrt(eps/48):")
for eps in (1e-2, 1e-3, 1e-4):
    b = (eps/48)**0.5
    print(f"     eps = {eps:.0e}:  beta4 <= {b:.5f}   =>  sigma <= {(b*3/(10*3.14159265358979))**0.25:.4f} sqrt(nbar) at T_rev,"
          f"   sigma <= {(b*2/(5*3.14159265358979))**0.25:.4f} nbar^(1/4) at T_sr")
