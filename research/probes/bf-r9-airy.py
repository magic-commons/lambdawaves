#!/usr/bin/env python
"""BF Round 9 (Opus, QCD) — probe 1: the Airy bridge.

Pure linear potential  V = sigma r   -> Airy equation, E_n = (sigma^2/2mu)^(1/3)|a_n|  EXACT.
Cornell  V = -(4/3)alpha_s/r + sigma r  -> Numerov shooting + independent matrix
diagonalisation.  Charmonium / bottomonium S-wave splittings vs PDG.

Units: GeV, hbar = c = 1.
"""
import numpy as np
from scipy.special import ai_zeros
from scipy.linalg import eigh_tridiagonal

ALPHA_S = 0.39
SIGMA   = 0.18          # GeV^2
MC      = 1.5           # GeV
MB      = 4.8           # GeV
A_COUL  = 4.0/3.0*ALPHA_S

# ---------------------------------------------------------------- exact Airy
def linear_levels(mu, n=6, sigma=SIGMA):
    a = ai_zeros(n)[0]                      # negative Airy zeros a_1..a_n
    return (sigma**2/(2*mu))**(1.0/3.0)*np.abs(a), a

# ---------------------------------------------------------------- Numerov
def numerov_shoot(E, mu, l, V, rmax, N):
    """Outward Numerov u'' = Q u, Q = 2mu(V-E) + l(l+1)/r^2. Return (u_end, nodes)."""
    h = rmax/N
    r = np.arange(1, N+1)*h
    Q = 2*mu*(V(r) - E) + (l*(l+1))/r**2
    f = 1.0 - h*h*Q/12.0
    u = np.empty(N)
    u[0] = r[0]**(l+1)
    u[1] = r[1]**(l+1)
    nodes = 0
    for i in range(1, N-1):
        u[i+1] = ((12.0 - 10.0*f[i])*u[i] - f[i-1]*u[i-1])/f[i+1]
        if u[i+1]*u[i] < 0:
            nodes += 1
        if abs(u[i+1]) > 1e250:             # renormalise
            u[:i+2] /= 1e250
    return u[-1], nodes, r, u

def numerov_level(mu, l, V, nrad, rmax, N, Elo, Ehi):
    """nrad = number of nodes wanted (0 = 1S). Bisect on node count then on u_end."""
    for _ in range(200):
        Em = 0.5*(Elo+Ehi)
        _, nd, _, _ = numerov_shoot(Em, mu, l, V, rmax, N)
        if nd > nrad:
            Ehi = Em
        else:
            Elo = Em
        if Ehi-Elo < 1e-12:
            break
    return 0.5*(Elo+Ehi)

# ---------------------------------------------------------------- matrix
def matrix_levels(mu, l, V, rmax, N, k=6):
    h = rmax/(N+1)
    r = np.arange(1, N+1)*h
    diag = 1.0/(mu*h*h) + V(r) + l*(l+1)/(2*mu*r**2)
    off  = -1.0/(2*mu*h*h)*np.ones(N-1)
    w = eigh_tridiagonal(diag, off, select='i', select_range=(0, k-1))[0]
    return w

def V_lin(r):     return SIGMA*r
def V_cornell(r): return -A_COUL/r + SIGMA*r

print("="*78)
print("BF R9 probe 1 — the Airy bridge")
print("="*78)

az = ai_zeros(6)[0]
print("\nAiry zeros a_n:", np.array2string(az, precision=8))
print("|a_2|/|a_1| =", abs(az[1]/az[0]), "  (pure-linear E2/E1, mass- and sigma-INDEPENDENT)")
print("asymptotic  a_n ~ -[3pi(4n-1)/8]^(2/3):",
      np.array2string(-(3*np.pi*(4*np.arange(1,7)-1)/8)**(2/3), precision=6))

for name, m in (("charm", MC), ("bottom", MB)):
    mu = m/2.0
    E, _ = linear_levels(mu)
    scale = (SIGMA**2/(2*mu))**(1/3)
    print(f"\n--- {name}: mu = {mu} GeV, (sigma^2/2mu)^(1/3) = {scale:.6f} GeV")
    print("   pure-LINEAR E_n (GeV):", np.array2string(E[:4], precision=6))
    print("   pure-LINEAR 2S-1S     :", f"{E[1]-E[0]:.6f} GeV")

print("\nPure-linear splitting ratio (b/c) = (mu_c/mu_b)^(1/3) =",
      f"{(MC/MB)**(1/3):.6f}")
print("MEASURED  (Ups2S-Ups1S)/(psi2S-Jpsi) = (10.023-9.460)/(3.686-3.097) =",
      f"{(10.023-9.460)/(3.686-3.097):.6f}")

# ---------------------------------------------------------------- Cornell
print("\n" + "="*78)
print("CORNELL  V(r) = -(4/3)alpha_s/r + sigma r,  alpha_s=%.2f sigma=%.2f" %
      (ALPHA_S, SIGMA))
print("="*78)
res = {}
for name, m, rmax in (("charm", MC, 40.0), ("bottom", MB, 30.0)):
    mu = m/2.0
    lev_n = []
    for nrad in range(4):
        E = numerov_level(mu, 0, V_cornell, nrad, rmax, 200000, -3.0, 6.0)
        lev_n.append(E)
    lev_m1 = matrix_levels(mu, 0, V_cornell, rmax, 120000)
    lev_m2 = matrix_levels(mu, 0, V_cornell, rmax, 240000)
    rich = (4*lev_m2 - lev_m1)/3.0            # Richardson on O(h^2)
    res[name] = (np.array(lev_n), lev_m1[:4], rich[:4])
    print(f"\n--- {name} (mu={mu}):")
    print("   Numerov  E_nS  :", np.array2string(np.array(lev_n), precision=6))
    print("   matrix   E_nS  :", np.array2string(lev_m1[:4], precision=6))
    print("   Richardson     :", np.array2string(rich[:4], precision=6))
    print("   2S-1S = %.6f  3S-2S = %.6f  ratio = %.4f" %
          (rich[1]-rich[0], rich[2]-rich[1], (rich[2]-rich[1])/(rich[1]-rich[0])))

dc = res["charm"][2][1]-res["charm"][2][0]
db = res["bottom"][2][1]-res["bottom"][2][0]
print("\nCORNELL   2S-1S:  charm %.6f   bottom %.6f   ratio b/c = %.6f" % (dc, db, db/dc))
print("MEASURED  2S-1S:  charm %.6f   bottom %.6f   ratio b/c = %.6f"
      % (0.589, 0.563, 0.563/0.589))
print("PURE-LINEAR ratio b/c = %.6f ;  PURE-COULOMB ratio b/c = %.6f"
      % ((MC/MB)**(1/3), MB/MC))

# absolute masses with one additive constant fixed on the 1S of each system
for name, m, meas1, meas2 in (("charm", MC, 3.097, 3.686), ("bottom", MB, 9.460, 10.023)):
    E = res[name][2]
    V0 = meas1 - 2*m - E[0]
    print(f"\n{name}: V0 fixed on 1S = {V0:+.4f} GeV -> "
          f"M(2S) = {2*m+E[1]+V0:.4f} (meas {meas2}),  "
          f"M(3S) = {2*m+E[2]+V0:.4f}")

# ---------------------------------------------------------------- crossover
rstar = np.sqrt(A_COUL/SIGMA)
print("\nCoulomb/linear crossover  r* = sqrt((4 alpha_s/3)/sigma) = %.5f GeV^-1 = %.4f fm"
      % (rstar, rstar*0.1973269804))
for name, m in (("charm", MC), ("bottom", MB)):
    mu = m/2.0
    E, _ = linear_levels(mu)
    kap = (2*mu*SIGMA)**(1/3)
    print("   pure-linear classical turning radius r_n = |a_n|/(2 mu sigma)^(1/3) [%s]:"
          % name, np.array2string(np.abs(ai_zeros(3)[0])/kap, precision=4), "GeV^-1")

# ---------------------------------------------------------------- log potential
print("\n--- the Quigg-Rosner logarithm: V = C ln(r/r0) gives mu-INDEPENDENT spacings")
def make_log(C): return lambda r: C*np.log(np.maximum(r,1e-12))
for C in (0.733,):
    for name, m in (("charm", MC), ("bottom", MB)):
        mu = m/2.0
        lv = matrix_levels(mu, 0, make_log(C), 60.0, 200000)
        print("   C=%.3f %-7s 2S-1S = %.6f GeV   3S-2S = %.6f" %
              (C, name, lv[1]-lv[0], lv[2]-lv[1]))

# effective power law:  splitting ~ mu^{-p}
p_meas = -np.log(0.563/0.589)/np.log(MB/MC)
print("\nMEASURED effective exponent: splitting ~ mu^{-p} with p = %.4f" % p_meas)
print("   pure linear p = 1/3 = 0.3333 ; pure Coulomb p = -1 ; logarithm p = 0")
