#!/usr/bin/env python
"""BF R9 (Opus, QCD) — probe 4: the flux tube.

(A) Abrikosov-Nielsen-Olesen / dual abelian Higgs vortex: profile ODEs, BPS bound,
    tension for kappa = m_s/m_v.  Dimensionless (x = m_v rho):
        f'' + f'/x - n^2 (1-a)^2 f/x^2 = (kappa^2/2) f (f^2 - 1)
        a'' - a'/x + (1-a) f^2 = 0
        f(0)=a(0)=0, f(inf)=a(inf)=1
        E/L = 2 pi v^2 * Int dx [ n^2 a'^2/x + x f'^2 + n^2 (1-a)^2 f^2/x
                                  + (kappa^2/4) x (f^2-1)^2 ]  >= 2 pi n v^2 (eq at kappa=1)
(B) Luscher term, Arvis/Nambu-Goto ground state, critical radius.
(C) Logarithmic broadening w^2(r) = ((d-2)/(2 pi sigma)) ln(r/r0).
"""
import numpy as np
from scipy.integrate import solve_bvp, quad

SIGMA = 0.18
HBARC = 0.1973269804

print("="*78); print("BF R9 probe 4 — the flux tube"); print("="*78)

# ------------------------------------------------------------------ (A) ANO
def ano(kappa, n=1, xmax=30.0, M=4000):
    def rhs(x, y):
        f, fp, a, ap = y
        return np.vstack([fp,
                          -fp/x + n*n*(1-a)**2*f/x**2 + 0.5*kappa**2*f*(f*f-1),
                          ap,
                          ap/x - (1-a)*f*f])
    def bc(ya, yb):
        return np.array([ya[0], ya[2], yb[0]-1.0, yb[2]-1.0])
    x = np.linspace(1e-6, xmax, M)
    y = np.vstack([np.tanh(x/2)**n, 0.5/np.cosh(x/2)**2,
                   np.tanh(x/2)**2, np.tanh(x/2)/np.cosh(x/2)**2])
    s = solve_bvp(rhs, bc, x, y, tol=1e-10, max_nodes=400000)
    return s

def tension_int(s, kappa, n=1):
    xs = np.linspace(s.x[0], s.x[-1], 400001)
    f, fp, a, ap = s.sol(xs)
    integ = n*n*ap**2/xs + xs*fp**2 + n*n*(1-a)**2*f**2/xs + (kappa**2/4)*xs*(f**2-1)**2
    return np.trapezoid(integ, xs)      # E/L in units of 2 pi v^2

print("\n(A) ANO vortex.  E/L / (2 pi v^2)  vs the Bogomolny bound n:")
for kap in (0.5, 0.8, 1.0, 1.25, 2.0, 4.0):
    s = ano(kap)
    E = tension_int(s, kap)
    print("    kappa = m_s/m_v = %.2f  ->  E/(2 pi v^2) = %.8f   (bound n=1; %s)"
          % (kap, E, "type I" if kap < 1 else ("BPS" if abs(kap-1) < 1e-12 else "type II")))
s1 = ano(1.0)
xs = np.array([0.0, 0.25, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0, 8.0])
f, fp, a, ap = s1.sol(np.maximum(xs, 1e-8))
print("\n    BPS (kappa=1) profile, x = m_v rho:")
print("      x   :", np.array2string(xs, precision=3))
print("      f(x):", np.array2string(f, precision=5))
print("      a(x):", np.array2string(a, precision=5))
print("      B(x) ~ a'(x)/x:", np.array2string(ap/np.maximum(xs,1e-8), precision=5))
print("    flux is quantised EXACTLY: Phi = oint A.dl = 2 pi n / e  (a(inf)=1). MEASURED a(30) = %.10f"
      % s1.sol(np.array([s1.x[-1]]))[2][0])
print("    tails: 1-f ~ K_0(kappa x) [scalar, mass m_s];  1-a ~ x K_1(x) [gauge, mass m_v].")

# n = 2, 3 at BPS
for n in (2, 3):
    s = ano(1.0, n=n, xmax=40.0)
    print("    n=%d at kappa=1: E/(2 pi v^2) = %.8f  (bound %d)" % (n, tension_int(s, 1.0, n), n))

# ------------------------------------------------------------------ (B) Luscher
print("\n(B) LUSCHER TERM and the Nambu-Goto (Arvis) ground state, d = 4:")
print("    V(r) = sigma r + mu - pi (d-2)/(24 r)  ->  d=4:  -pi/(12 r)  (UNIVERSAL)")
print("    Arvis: V(r) = sigma r sqrt(1 - pi(d-2)/(12 sigma r^2)) = sigma r sqrt(1 - pi/(6 sigma r^2))")
rc = np.sqrt(np.pi/(6*SIGMA))
print("    critical radius r_c = sqrt(pi/(6 sigma)) = %.5f GeV^-1 = %.4f fm" % (rc, rc*HBARC))
print("    %-10s %-12s %-12s %-12s %-12s" % ("r [fm]", "sigma r", "-pi/12r", "|ratio|", "Arvis"))
for rfm in (0.2, 0.3, 0.4, 0.5, 0.7, 1.0, 1.5):
    r = rfm/HBARC
    lin = SIGMA*r; lus = -np.pi/(12*r)
    arv = SIGMA*r*np.sqrt(max(1-np.pi/(6*SIGMA*r*r), 0.0)) if r > rc else float('nan')
    print("    %-10.2f %-12.5f %-12.5f %-12.4f %-12.5f" % (rfm, lin, lus, abs(lus/lin), arv))
print("    NG expansion: sigma r - pi/(12 r) - pi^2/(288 sigma r^3) - ...")
for rfm in (0.5, 1.0):
    r = rfm/HBARC
    print("      r=%.1f fm: order-3 term = %.6f GeV (%.2f%% of sigma r)"
          % (rfm, -np.pi**2/(288*SIGMA*r**3), 100*abs(np.pi**2/(288*SIGMA*r**3))/(SIGMA*r)))

# ------------------------------------------------------------------ (C) width
print("\n(C) LOGARITHMIC BROADENING (Luscher-Munster-Weisz 1981), d = 4:")
c = 1.0/(np.pi*SIGMA)
print("    w^2(r) = ((d-2)/(2 pi sigma)) ln(r/r_0) = (1/(pi sigma)) ln(r/r_0)")
print("    coefficient 1/(pi sigma) = %.5f GeV^-2 = %.6f fm^2  per e-fold of r" % (c, c*HBARC**2))
for r0fm in (0.25, 0.30, 0.35):
    row = []
    for rfm in (0.5, 0.8, 1.0, 1.5, 2.0):
        w2 = c*HBARC**2*np.log(rfm/r0fm)
        row.append("%.3f" % (np.sqrt(max(w2, 0.0))))
    print("    r_0 = %.2f fm -> w(r) [fm] at r = 0.5,0.8,1.0,1.5,2.0 fm:" % r0fm, row)
print("    lattice (Bali et al; Gliozzi-Pepe-Wiese): w ~ 0.3 fm near r ~ 1 fm. ")

# the coincidence
alp = 0.39
rstar = np.sqrt((4*alp/3)/SIGMA)
print("\n    NOTE (flagged, not claimed): r_c = sqrt(pi/(6 sigma)) = %.5f GeV^-1 and the Cornell"
      % rc)
print("    Coulomb/linear crossover r* = sqrt((4 alpha_s/3)/sigma) = %.5f GeV^-1 coincide iff"
      % rstar)
print("    alpha_s = pi/8 = %.6f ; the standard value is 0.39 -- a %.2f%% coincidence."
      % (np.pi/8, 100*abs(np.pi/8-alp)/alp))
print("    Matching -pi/(12r) to -(4/3)alpha_s/r instead gives alpha_s = pi/16 = %.4f (factor 2 off)."
      % (np.pi/16))
