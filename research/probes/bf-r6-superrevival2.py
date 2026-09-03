#!/usr/bin/env python
"""bf-r6-superrevival2.py — the superrevival, done properly: a POISSON SUM of Pearcey envelopes
(the quartic analogue of print Theorem A.4), with the coefficients reduced mod 2pi first.

  A(T_sr) = sum_j I4(alpha - 2 pi sigma j, delta, beta4, eps5, eps6) / sum_j e^{-2 pi^2 sigma^2 j^2}
  alpha = C1red sigma, delta = C2red sigma^2, beta4 = C4 sigma^4, eps5 = C5 sigma^5, eps6 = C6 sigma^6
  C_k = (-1)^k (k+1) t / (2 nbar^{k+2}) ; at t = T_sr = pi nbar^5 :
     C1 = -pi nbar^2 -> 0 (nbar even) or pi (odd)
     C2 =  3 pi nbar / 2 -> (pi/2)(3 nbar mod 4)          <-- THE MOD-4 BOOLEAN
     C3 = -2 pi -> 0
     C4 =  5 pi / (2 nbar),  C5 = -3 pi / nbar^2,  C6 = 7 pi / (2 nbar^3)
"""
from mpmath import mp, mpf, mpc, exp, sqrt, pi, quad, fabs, j as I
mp.dps = 30

def Ienv(alpha, delta, b4, e5=0, e6=0, L=13):
    f = lambda u: exp(-u**2/2 + I*(alpha*u + delta*u**2 + b4*u**4 + e5*u**5 + e6*u**6))
    return quad(f, [-L, 0, L]) / sqrt(2*pi)

def poisson_env(sigma, alpha, delta, b4, e5=0, e6=0, J=6):
    s = mpc(0); Z = mpf(0)
    for jj in range(-J, J+1):
        s += Ienv(alpha - 2*pi*sigma*jj, delta, b4, e5, e6)
        Z += exp(-2*pi**2*sigma**2*jj**2)
    return fabs(s)/Z

def ladder_abs(nbar, sigma, t, K=9):
    lo, hi = max(1, nbar - K*sigma), nbar + K*sigma
    s = mpc(0); Z = mpf(0)
    for n in range(int(lo), int(hi)+1):
        p = exp(-mpf(n-nbar)**2/(2*mpf(sigma)**2)); Z += p
        s += p*exp(I*t/(2*mpf(n)**2))
    return fabs(s)/Z

print("=== the superrevival as a Poisson sum of Pearcey envelopes, sigma = 1 ===")
print(f"{'nbar':>6}{'%4':>4}{'beta4':>9}{'delta':>9}{'alpha':>8}{'|A| exact':>13}"
      f"{'Poisson(4)':>13}{'rel':>10}{'+e5':>13}{'rel':>10}{'+e5+e6':>13}{'rel':>10}{'delta=0':>12}")
for nbar in (60, 61, 62, 63, 100, 101, 200, 201, 400, 401):
    sigma = 1
    t = pi*mpf(nbar)**5
    A = ladder_abs(nbar, sigma, t)
    C1 = (-pi*mpf(nbar)**2) % (2*pi)
    C2 = (3*pi*mpf(nbar)/2) % (2*pi)
    b4 = 5*pi/(2*mpf(nbar)); e5 = -3*pi/mpf(nbar)**2; e6 = 7*pi/(2*mpf(nbar)**3)
    al = C1*sigma; de = C2*sigma**2
    p0 = poisson_env(sigma, al, de, b4)
    p1 = poisson_env(sigma, al, de, b4, e5)
    p2 = poisson_env(sigma, al, de, b4, e5, e6)
    pz = poisson_env(sigma, al, 0, b4, e5, e6)
    print(f"{nbar:6}{nbar%4:4}{float(b4):9.4f}{float(de):9.4f}{float(al):8.4f}{float(A):13.9f}"
          f"{float(p0):13.9f}{float(abs(A-p0)/A):10.2e}{float(p1):13.9f}{float(abs(A-p1)/A):10.2e}"
          f"{float(p2):13.9f}{float(abs(A-p2)/A):10.2e}{float(pz):12.8f}")

print("\n=== the mod-4 ceiling: |A(T_sr)| for a run of consecutive nbar, sigma = 1 ===")
print(f"{'nbar':>6}{'nbar%4':>8}{'|A(T_sr)|':>14}{'pure Pearcey (delta=0)':>26}")
for nbar in range(200, 216):
    t = pi*mpf(nbar)**5
    A = ladder_abs(nbar, 1, t)
    b4 = 5*pi/(2*mpf(nbar)); e5 = -3*pi/mpf(nbar)**2; e6 = 7*pi/(2*mpf(nbar)**3)
    pz = poisson_env(1, 0, 0, b4, e5, e6)
    print(f"{nbar:6}{nbar%4:8}{float(A):14.9f}{float(pz):26.9f}")
