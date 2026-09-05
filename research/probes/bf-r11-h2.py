#!/usr/bin/env python
"""bf-r11-h2.py — Round 11 audit §5: verify Sugiura's exchange integral K' INDEPENDENTLY,
and recompute the Heitler-London R_e, D_e and the triplet turning point.

INDEPENDENT ROUTE FOR K'.  With a = (1/sqrt(pi)) e^{-r_A}, b = (1/sqrt(pi)) e^{-r_B} and prolate
spheroidal coordinates xi = (r_A+r_B)/R in [1,inf), eta = (r_A-r_B)/R in [-1,1], phi:

    rho_ab(r) = a(r) b(r) = (1/pi) e^{-R xi}          <- a function of xi ALONE
    dV = (R^3/8)(xi^2 - eta^2) dxi deta dphi

and the Neumann expansion
    1/r12 = (2/R) sum_l sum_m (-1)^m (2l+1)[(l-|m|)!/(l+|m|)!]^2
              P_l^|m|(xi_<) Q_l^|m|(xi_>) P_l^|m|(eta1)P_l^|m|(eta2) e^{im(phi1-phi2)}.

The phi integrations kill every m != 0.  Since rho depends on xi only, the eta integral for each
particle is A_l(xi) = int_{-1}^{1}(xi^2-eta^2)P_l(eta)deta, which is nonzero ONLY for l = 0 and l = 2:
    A_0 = 2 xi^2 - 2/3,   A_2 = -4/15.
So
    K' = (R^3/8)^2 (2pi)^2 (2/R) sum_{l in {0,2}} (2l+1) * I_l,
    I_l = int int rho(xi1)rho(xi2) A_l(xi1) A_l(xi2) P_l(xi_<) Q_l(xi_>) dxi1 dxi2.
Nothing from the lab is used.
"""
import numpy as np
from scipy import integrate, optimize, special

R_SYM = None

def Pl(l, x):  # Legendre P_l for argument >= 1
    return special.eval_legendre(l, x)

def Ql(l, x):  # Legendre Q_l of the second kind, argument > 1
    x = np.asarray(x, dtype=float)
    Q0 = 0.5*np.log((x+1)/(x-1))
    if l == 0: return Q0
    Q1 = 0.5*x*np.log((x+1)/(x-1)) - 1.0
    if l == 1: return Q1
    Qm1, Qm = Q0, Q1
    for k in range(1, l):
        Qp = ((2*k+1)*x*Qm - k*Qm1)/(k+1)
        Qm1, Qm = Qm, Qp
    return Qm

def A_l(l, xi):
    if l == 0: return 2*xi**2 - 2.0/3.0
    if l == 2: return -4.0/15.0*np.ones_like(np.asarray(xi, dtype=float))
    return np.zeros_like(np.asarray(xi, dtype=float))

def Kprime_independent(R, n=220):
    """double Gauss-Legendre on xi in [1,inf) via xi = 1 + y/(1-y)"""
    y, wy = np.polynomial.legendre.leggauss(n)
    y = 0.5*(y+1); wy = 0.5*wy
    xi = 1.0 + y/(1.0-y); jac = 1.0/(1.0-y)**2
    rho = np.exp(-R*xi)/np.pi
    tot = 0.0
    for l in (0, 2):
        Al = A_l(l, xi)
        f = rho*Al*jac*wy                     # per-variable weight
        X1, X2 = np.meshgrid(xi, xi, indexing='ij')
        lo, hi = np.minimum(X1, X2), np.maximum(X1, X2)
        Kern = Pl(l, lo)*Ql(l, hi)
        tot += (2*l+1)*np.einsum('i,ij,j->', f, Kern, f)
    return (R**3/8)**2 * (2*np.pi)**2 * (2.0/R) * tot

# --- the lab's closed forms, retyped from lab/h2.js (NOT imported) --------------
GAMMA = 0.5772156649015329
def S(R):  return np.exp(-R)*(1+R+R*R/3)
def J(R):  return -1/R + np.exp(-2*R)*(1+1/R)
def K(R):  return -np.exp(-R)*(1+R)
def Jp(R): return 1/R - np.exp(-2*R)*(1/R + 11/8 + 3*R/4 + R*R/6)
def E1(x): return special.exp1(x)
def Ei_neg(x):  # Ei(-x) = -E1(x) for x > 0
    return -special.exp1(x)
def Kp(R):
    Sp = np.exp(R)*(1 - R + R*R/3)
    return (1.0/5.0)*( -np.exp(-2*R)*(-25.0/8 + 23*R/4 + 3*R*R + R**3/3)
                       + (6.0/R)*( S(R)**2*(GAMMA + np.log(R)) + Sp**2*Ei_neg(4*R) - 2*S(R)*Sp*Ei_neg(2*R) ) )

print("=== K' : Sugiura closed form vs the INDEPENDENT Neumann/prolate quadrature ===")
print("  R      K'(Sugiura)        K'(independent)     |diff|        rel")
for R in [0.5, 1.0, 1.4, 1.64, 2.0, 3.0, 4.0, 6.0]:
    a = Kp(R); b = Kprime_independent(R)
    print(f"{R:5.2f}   {a: .12f}    {b: .12f}    {abs(a-b):.3e}   {abs(a-b)/abs(b):.2e}")

print("\n=== J' : closed form vs direct 2-centre quadrature (a^2 against b^2's exact potential) ===")
def Jp_direct(R, n=400):
    # J' = int a(r)^2 * V_b(r) d^3r,  V_b(r) = 1/r_B - e^{-2 r_B}(1 + 1/r_B)
    # prolate: r_A = R(xi+eta)/2, r_B = R(xi-eta)/2, dV = (R^3/8)(xi^2-eta^2) dxi deta dphi
    y, wy = np.polynomial.legendre.leggauss(n); y = 0.5*(y+1); wy = 0.5*wy
    xi = 1.0 + y/(1.0-y); jac = 1.0/(1.0-y)**2
    eta, we = np.polynomial.legendre.leggauss(n)
    XI, ET = np.meshgrid(xi, eta, indexing='ij')
    rA = R*(XI+ET)/2; rB = R*(XI-ET)/2
    a2 = np.exp(-2*rA)/np.pi
    Vb = 1/rB - np.exp(-2*rB)*(1+1/rB)
    W = (jac*wy)[:, None]*we[None, :]
    return 2*np.pi*(R**3/8)*np.sum(W*(XI**2-ET**2)*a2*Vb)
for R in [1.0, 1.4, 2.0, 4.0]:
    print(f"{R:5.2f}   closed {Jp(R): .12f}   direct {Jp_direct(R): .12f}   diff {abs(Jp(R)-Jp_direct(R)):.2e}")

EV = 27.211386
def Eplus(R):   # singlet
    s = S(R); return -1 + 1/R + (2*J(R) + Jp(R) + 2*s*K(R) + Kp(R))/(1 + s*s)
def Eminus(R):  # triplet
    s = S(R); return -1 + 1/R + (2*J(R) + Jp(R) - 2*s*K(R) - Kp(R))/(1 - s*s)

print("\n=== HEITLER-LONDON: the singlet minimum ===")
res = optimize.minimize_scalar(Eplus, bracket=(1.2, 1.6, 2.2), method='brent', options={'xtol':1e-12})
Re, Emin = res.x, res.fun
print(f"R_e = {Re:.8f} a0     E_min = {Emin:.10f} hartree")
print(f"D_e = -(E_min + 1) = {-(Emin+1):.10f} hartree = {-(Emin+1)*EV:.6f} eV")
print(f"   -> rounds to R_e = {Re:.2f}, D_e = {-(Emin+1)*EV:.2f} eV")
print(f"   REPORT.md wave 18 says 3.16 eV ; lab/h2.js header says 3.14 eV")
# also with the K' from the INDEPENDENT quadrature, to be sure the closed form is not the culprit
def Eplus_ind(R):
    s = S(R); return -1 + 1/R + (2*J(R) + Jp(R) + 2*s*K(R) + Kprime_independent(R, 160))/(1 + s*s)
res2 = optimize.minimize_scalar(Eplus_ind, bracket=(1.2, 1.6, 2.2), method='brent', options={'xtol':1e-10})
print(f"with the independent K': R_e = {res2.x:.8f}, D_e = {-(res2.fun+1)*EV:.6f} eV")

print("\n=== the triplet turning point at 0.02 hartree of relative kinetic energy from R = 8 ===")
E8 = Eminus(8.0)
Etot = E8 + 0.02
print(f"E_triplet(8) = {E8:.10f} ; total energy = {Etot:.10f}")
f = lambda R: Eminus(R) - Etot
Rt = optimize.brentq(f, 1.0, 7.9, xtol=1e-13)
print(f"turning point R* (E_triplet(R*) = E_tot) = {Rt:.8f} a0   -> REPORT says 3.44")
for R in [3.2, 3.3, 3.4, 3.44, 3.5, 3.6]:
    print(f"   E_triplet({R}) = {Eminus(R):.8f}   E_triplet - E_tot = {Eminus(R)-Etot:+.3e}")
print("\nasymptote check: E_singlet(inf), E_triplet(inf) -> -1 ?")
for R in [20.0, 40.0]:
    print(f"   R={R}: E+ = {Eplus(R):.10f}   E- = {Eminus(R):.10f}")

print("\n=== the density weights w_g = (1+S)^2/(1+S^2), w_u = (1-S)^2/(1+S^2)  [DERIVED-HERE] ===")
for R in [1.0, 1.4, 2.0]:
    s = S(R); wg = (1+s)**2/(1+s*s); wu = (1-s)**2/(1+s*s)
    # check numerically that wg|sg|^2 + wu|su|^2 == (a^2+b^2+2S ab)/(1+S^2) pointwise
    # sample points along the axis
    ok = True
    for z in np.linspace(-3, 3, 25):
        rA = abs(z-R/2); rB = abs(z+R/2)
        A = np.exp(-rA)/np.sqrt(np.pi); B = np.exp(-rB)/np.sqrt(np.pi)
        sg = (A+B)/np.sqrt(2*(1+s)); su = (A-B)/np.sqrt(2*(1-s))
        lhs = wg*sg**2 + wu*su**2
        rhs = (A*A + B*B + 2*s*A*B)/(1+s*s)
        ok &= abs(lhs-rhs) < 1e-12*max(1, abs(rhs))
    print(f"   R={R}: S={s:.8f} w_g={wg:.8f} w_u={wu:.8f} w_g+w_u={wg+wu:.12f}  identity holds pointwise: {ok}")
    wgT, wuT = 1.0, 1.0
    okT = True
    for z in np.linspace(-3, 3, 25):
        rA = abs(z-R/2); rB = abs(z+R/2)
        A = np.exp(-rA)/np.sqrt(np.pi); B = np.exp(-rB)/np.sqrt(np.pi)
        sg = (A+B)/np.sqrt(2*(1+s)); su = (A-B)/np.sqrt(2*(1-s))
        okT &= abs(wgT*sg**2 + wuT*su**2 - (A*A+B*B-2*s*A*B)/(1-s*s)) < 1e-12
    print(f"        triplet weights 1,1 reproduce the triplet density pointwise: {okT}")

print("\n=== H2+ LCAO: R_e and D_e (molecule.js header claims 2.49 a0 and 1.76 eV) ===")
def Eg(R):
    s = S(R); return -0.5 + (J(R)+K(R))/(1+s) + 1/R
r = optimize.minimize_scalar(Eg, bracket=(2.0, 2.5, 3.2), method='brent', options={'xtol':1e-12})
print(f"R_e = {r.x:.8f}   E = {r.fun:.10f}   D_e = {-(r.fun+0.5)*EV:.6f} eV")
