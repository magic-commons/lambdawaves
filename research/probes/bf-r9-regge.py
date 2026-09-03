#!/usr/bin/env python
"""BF R9 (Opus, QCD) — probe 3: Regge.

Two derivations of the slope from a linear potential:
  (NR)  non-relativistic Schrodinger with V = sigma r at large l  -> E ~ l^{2/3}, NO Regge line
  (RS)  rotating relativistic string, massless ends -> J = M^2/(2 pi sigma), alpha' = 1/(2 pi sigma)
Compare with the measured rho/a2/rho3/a4 trajectory.
"""
import numpy as np
from scipy.linalg import eigh_tridiagonal

SIGMA = 0.18
HBARC = 0.1973269804          # GeV fm

def levels(mu, l, V, rmax, N, k=3):
    h = rmax/(N+1); r = np.arange(1, N+1)*h
    d = 1.0/(mu*h*h) + V(r) + l*(l+1)/(2*mu*r**2)
    o = -1.0/(2*mu*h*h)*np.ones(N-1)
    return eigh_tridiagonal(d, o, select='i', select_range=(0, k-1))[0]

print("="*78); print("BF R9 probe 3 — Regge"); print("="*78)

print("\n(RS) rotating relativistic string, tension sigma, massless ends:")
print("     M = pi sigma R,  J = (pi/2) sigma R^2  =>  J = M^2/(2 pi sigma)")
ap = 1.0/(2*np.pi*SIGMA)
print("     alpha' = 1/(2 pi sigma) = %.6f GeV^-2   at sigma = %.2f GeV^2" % (ap, SIGMA))
for a in (0.88, 0.90, 0.93):
    print("     inverted: alpha' = %.2f  ->  sigma = 1/(2 pi alpha') = %.5f GeV^2 = (%.4f GeV)^2"
          % (a, 1/(2*np.pi*a), np.sqrt(1/(2*np.pi*a))))

print("\n(NR) non-relativistic, V = sigma r, equal masses m (mu = m/2):")
print("     circular orbit: sigma = L^2/(mu R^3) -> E = (3/2)(sigma^2 L^2/mu)^(1/3) ~ L^(2/3)")
print("     => M = 2m + c L^(2/3):  M^2 is NOT linear in L.  Effective d ln E/d ln l:")
for m in (1.5, 4.8):
    mu = m/2
    ls = np.array([4, 8, 16, 32, 64])
    Es = np.array([levels(mu, int(l), lambda r: SIGMA*r, 200.0, 240000, 1)[0] for l in ls])
    Ecl = 1.5*(SIGMA**2*ls*(ls+1)/mu)**(1/3)
    p = np.diff(np.log(Es))/np.diff(np.log(ls))
    print("     m=%.1f  E(l)=%s" % (m, np.array2string(Es, precision=5)))
    print("            semiclassical (3/2)(sigma^2 l(l+1)/mu)^{1/3} = %s"
          % np.array2string(Ecl, precision=5))
    print("            local exponent d lnE/d ln l = %s   (2/3 = %.4f)"
          % (np.array2string(p, precision=5), 2/3))
    M = 2*m + Es
    print("            M^2 vs l  slope dl/dM^2 (would be alpha'): %s"
          % np.array2string(np.diff(ls)/np.diff(M**2), precision=5))

print("\nMEASURED rho trajectory (PDG central masses):")
states = [("rho(770)", 0.77526, 1), ("a2(1320)", 1.3182, 2),
          ("rho3(1690)", 1.6888, 3), ("a4(1970)", 1.967, 4)]
M2 = np.array([s[1]**2 for s in states]); J = np.array([float(s[2]) for s in states])
A = np.vstack([M2, np.ones_like(M2)]).T
sl, ic = np.linalg.lstsq(A, J, rcond=None)[0]
for n, m, j in states:
    print("   %-11s M = %.4f  M^2 = %.4f  J = %d" % (n, m, m*m, j))
print("   linear fit J = alpha' M^2 + alpha_0 :  alpha' = %.5f GeV^-2, alpha_0 = %.4f"
      % (sl, ic))
print("   residuals:", np.array2string(J - (sl*M2+ic), precision=4))
print("   sigma implied by the fitted slope = 1/(2 pi alpha') = %.5f GeV^2" % (1/(2*np.pi*sl)))
print("\n   VERDICT: alpha'(sigma=0.18) = %.4f vs measured %.4f  ->  %.2f%% apart."
      % (ap, sl, 100*abs(ap-sl)/sl))
print("   The NR linear potential gives no linear Regge line at all (exponent 2/3).")
print("   The relativistic-string derivation is the one the number supports.")

print("\nAside: string tension in fm units:  sqrt(sigma) = %.4f GeV = %.4f fm^-1;"
      % (np.sqrt(SIGMA), np.sqrt(SIGMA)/HBARC))
print("       sigma = %.4f GeV/fm = %.3f tonnes-force." %
      (SIGMA/HBARC, SIGMA/HBARC*1.602e-10/9.81/1000))
