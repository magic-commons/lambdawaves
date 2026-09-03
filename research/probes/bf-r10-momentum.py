"""bf-r10-momentum.py — Round 10 (Fable), Task 1 (a)-(c): hydrogen in momentum space.

(a) normalisation of the Podolsky–Pauling F_nl(p) as written in the brief, all (n,l) with n <= 6;
(b) F_nl is the Hankel transform of the lab's R_nl (hydrogen.js conventions), with the phase (-i)^l made explicit;
(c) F_nl(p) = p^l P_nl(p^2) / (n^2 p^2 + 1)^(n+1), P_nl of degree n-l-1 in p^2 — exact rational tables.
Run: ~/miniforge3/envs/sci/bin/python bf-r10-momentum.py
"""
import sys
import numpy as np
from math import factorial, pi, sqrt
from scipy.integrate import quad
from scipy.special import eval_gegenbauer, spherical_jn, eval_genlaguerre
import sympy as sp

NMAX = 6

def F(n, l, p):
    """the Podolsky–Pauling radial momentum function exactly as the brief writes it"""
    x = (n * n * p * p - 1.0) / (n * n * p * p + 1.0)
    pref = sqrt(2.0 / pi * factorial(n - l - 1) / factorial(n + l)) * n * n * 2.0 ** (2 * l + 2) * factorial(l)
    return pref * n ** l * p ** l / (n * n * p * p + 1.0) ** (l + 2) * eval_gegenbauer(n - l - 1, l + 1, x)

def R(n, l, r):
    """the lab's R_nl: sqrt((2/n)^3 (n-l-1)!/(2n (n+l)!)) e^{-rho/2} rho^l L^{2l+1}_{n-l-1}(rho), rho = 2r/n"""
    rho = 2.0 * r / n
    norm = sqrt((2.0 / n) ** 3 * factorial(n - l - 1) / (2 * n * factorial(n + l)))
    return norm * np.exp(-rho / 2) * rho ** l * eval_genlaguerre(n - l - 1, 2 * l + 1, rho)

print("== (a) normalisation  int_0^inf F_nl^2 p^2 dp  (n <= 6) ==")
worst = 0.0
for n in range(1, NMAX + 1):
    row = []
    for l in range(n):
        val, err = quad(lambda p: F(n, l, p) ** 2 * p * p, 0, np.inf, limit=400)
        row.append(val)
        worst = max(worst, abs(val - 1))
    print(f"n={n}: " + "  ".join(f"{v:.12f}" for v in row))
print(f"WORST |norm-1| over all (n,l), n<=6: {worst:.3e}")

print("\n== (b) Hankel transform of the lab's R_nl vs F_nl: phi(p) = (-i)^l sqrt(2/pi) int R_nl(r) j_l(pr) r^2 dr * Y_lm ==")
print("   (from e^{-ip.x} = 4pi sum (-i)^l j_l(pr) Y_lm(p^) Y*_lm(r^) and (2pi)^{-3/2} * 4pi = sqrt(2/pi))")
ps = np.linspace(0.05, 3.0, 20)
for (n, l) in [(1, 0), (2, 1), (3, 2), (2, 0), (3, 0), (3, 1), (4, 0), (4, 3), (5, 2), (6, 5), (6, 0)]:
    maxerr = 0.0
    signs = set()
    for p in ps:
        H, _ = quad(lambda r: R(n, l, r) * spherical_jn(l, p * r) * r * r, 0, 60 * n, limit=800)
        H *= sqrt(2 / pi)
        f = F(n, l, p)
        signs.add(np.sign(H * f) if abs(f) > 1e-8 else 0)
        maxerr = max(maxerr, abs(abs(H) - abs(f)))
    signs.discard(0)
    print(f"  (n,l)=({n},{l}): max | |Hankel| - |F| | = {maxerr:.2e}   relative sign Hankel/F = {sorted(signs)}   (-1)^(n-l-1) = {(-1)**(n-l-1)}")

print("\n== (c) exact tables: F_nl(p) = p^l P_nl(p^2) / (n^2 p^2 + 1)^(n+1),  P_nl = sum_k c_k (p^2)^k ==")
p, s = sp.symbols('p s', positive=True)   # s = p^2
tables = {}
for n in range(1, NMAX + 1):
    for l in range(n):
        x = (n ** 2 * s - 1) / (n ** 2 * s + 1)
        pref = sp.sqrt(sp.Rational(2) / sp.pi * sp.factorial(n - l - 1) / sp.factorial(n + l)) * n ** 2 * 2 ** (2 * l + 2) * sp.factorial(l)
        C = sp.gegenbauer(n - l - 1, l + 1, x)
        # F = pref * n^l p^l / (n^2 s + 1)^(l+2) * C ;  P_nl(s) = F * (n^2 s+1)^(n+1) / p^l
        P = sp.simplify(pref * n ** l * C * (n ** 2 * s + 1) ** (n - l - 1))
        P = sp.expand(sp.nsimplify(P))
        Ppoly = sp.Poly(sp.expand(P / sp.sqrt(sp.Rational(2) / sp.pi)), s)   # P~ = P / sqrt(2/pi): the printed tables are P~; the kernel multiplies by sqrt(2/pi)
        # write P = sqrt(2/pi) * sqrt(q) * (integer-ish polynomial): find the square-root-free rational factor
        coeffs = Ppoly.all_coeffs()[::-1]
        # each coeff is (rational)*sqrt(rational); extract the common sqrt
        c0 = [sp.nsimplify(c) for c in coeffs]
        # find the largest |c| to normalise
        lead = c0[-1]
        ratio = [sp.nsimplify(c / lead) for c in c0]
        assert all(r.is_rational for r in ratio), (n, l, ratio)
        tables[(n, l)] = (lead, ratio, coeffs)
        deg = Ppoly.degree()
        assert deg == n - l - 1, (n, l, deg)
        print(f"  P_{n}{l}(s): degree {deg};  leading coefficient {sp.nsimplify(lead)} = {float(lead):.12g};  P/lead = {ratio}")
        print(f"        floats: {[float(c) for c in coeffs]}")

print("\n== (c') cross-check tables against F at p = 0.7 ==")
worst = 0
for (n, l), (lead, ratio, coeffs) in tables.items():
    pv = 0.7
    Pv = sqrt(2 / pi) * sum(float(c) * (pv * pv) ** k for k, c in enumerate(coeffs))
    fv = pv ** l * Pv / (n * n * pv * pv + 1) ** (n + 1)
    worst = max(worst, abs(fv - F(n, l, pv)))
print(f"max |table - F| at p=0.7 over all 21 states: {worst:.2e}")

print("\n== (c'') the same tables as JSON-ish float rows for the kernel ==")
for (n, l), (lead, ratio, coeffs) in sorted(tables.items()):
    print(f"  [{n},{l}]: {[float(c) for c in coeffs]}")
