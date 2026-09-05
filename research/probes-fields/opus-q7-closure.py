#!/usr/bin/env python
"""OPUS — THE BIGGER IDEA, tested.  The register's 91 labels fail as a molecular basis for exactly two
reasons, and both are CLOSURE failures of the same fixed-exponent set:

  (D) DILATION.  {R_nl with zeta = Z/n} (hydrogen's BOUND states) is NOT complete in L^2 -- its closure
      misses the continuum.  The COULOMB STURMIANS  S_nl(r) = r^l L^{2l+1}_{n-l-1}(2 lambda r) e^{-lambda r}
      with ONE COMMON lambda for every n ARE a complete discrete set (a Sturm-Liouville system with
      weight 1/r).  Same labels (n,l,m), one extra number lambda.
  (T) TRANSLATION.  d/dR_C of an STO r^{n-1}e^{-zeta r}Y_lm on centre C is a combination of STOs with the
      SAME zeta and (n-1, l+-1) and (n, l+-1).  A basis closed under this makes the Hellmann-Feynman
      force EQUAL -dE/dR identically (Hurley 1954), i.e. it makes classical-electrostatic Ehrenfest
      dynamics energy-conserving.  The register's own 2p (zeta = 1/2) is not that function.

And a rigorous, computable BOUND on the price of not closing (T):
      Pulay = F_HF + dE/dR = 2 Re <dpsi/dR|(H-E)|psi>   =>   |Pulay| <= 2 ||dpsi/dR|| ||(H-E)psi||
"""
import numpy as np, os
# reuse the certified two-centre machinery from the sibling probe (everything above its section 1)
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'opus-q3-twocentre.py')).read()
exec(_src[:_src.index('# ---------------------------------------------------------------- 1. certification')])
from scipy.special import genlaguerre, roots_legendre
from scipy.optimize import minimize_scalar
from math import factorial as fac

def sturmian(centre, n, l, lam):
    """S_nl = r^l L^{2l+1}_{n-l-1}(2 lam r) e^{-lam r}: hydrogen's labels, ONE common exponent."""
    lag = genlaguerre(n-l-1, 2*l+1)
    cx = np.asarray(lag.coefficients[::-1], float)
    c = np.array([cx[j]*(2*lam)**j for j in range(len(cx))])
    return Fn(centre, l, c, lam, tag=f'S{n}{"spdfgh"[l]}(lam={lam:g})')

print('='*104)
print('(D) DILATION CLOSURE — the united-atom test that the fixed hydrogenic set fails')
print('    H = -1/2 Lap - 2/r  (He+, exact -2), inside span{ n s-functions } :')
def one_centre_generic(fns, Znuc):
    N = len(fns); S = np.zeros((N,N)); T = np.zeros((N,N)); V = np.zeros((N,N))
    for i, fi in enumerate(fns):
        for j, fj in enumerate(fns):
            b = fi.zeta + fj.zeta; li, lj = fi.l, fj.l
            s = v = 0.0
            for p, cp in enumerate(fi.c):
                for q, cq in enumerate(fj.c):
                    P = p+q+li+lj
                    s += cp*cq*fac(P+2)/b**(P+3); v += cp*cq*fac(P+1)/b**(P+2)
            t = 0.0
            di = [(li+p, cp*(li+p), -cp*fi.zeta) for p, cp in enumerate(fi.c)]
            dj = [(lj+q, cq*(lj+q), -cq*fj.zeta) for q, cq in enumerate(fj.c)]
            for (Pi, a1, a2) in di:
                for (Pj, b1, b2) in dj:
                    for (aa, pa) in ((a1, Pi-1), (a2, Pi)):
                        for (bb, pb) in ((b1, Pj-1), (b2, Pj)):
                            if aa == 0 or bb == 0: continue
                            P = pa+pb
                            if P+2 < 0: continue
                            t += aa*bb*fac(P+2)/b**(P+3)
            if li > 0:
                for p, cp in enumerate(fi.c):
                    for q, cq in enumerate(fj.c):
                        P = p+q+li+lj
                        t += li*(li+1)*cp*cq*fac(P)/b**(P+1)
            S[i,j]=s; V[i,j]=-Znuc*v; T[i,j]=0.5*t
    d = 1/np.sqrt(np.abs(np.diag(S))); S = S*np.outer(d,d); H = (T+V)*np.outer(d,d)
    w, U = np.linalg.eigh(S); keep = w > 1e-12*w.max(); X = U[:,keep]/np.sqrt(w[keep])
    return np.linalg.eigvalsh(X.T@H@X)[0]
print(f'    {"N":>4s}  {"hydrogenic zeta=1/n":>22s}  {"Sturmian lambda=1":>20s}  {"Sturmian lambda=2":>20s}')
for N in [1,2,3,4,6,8,10,12,16,20]:
    a = one_centre_generic([hydrogenic('A', n, 0) for n in range(1,N+1)], 2.0)
    b = one_centre_generic([sturmian('A', n, 0, 1.0) for n in range(1,N+1)], 2.0)
    c = one_centre_generic([sturmian('A', n, 0, 2.0) for n in range(1,N+1)], 2.0)
    print(f'    {N:4d}  {a:22.9f}  {b:20.9f}  {c:20.9f}')
print('    -> the SAME 91 labels, one common lambda instead of lambda=1/n, and the floor at -1.5585 is gone.')

print()
print('='*104)
print('(D) THE SAME SWAP ON H2+ : Sturmians with ONE common lambda per centre, n <= nmax, m = 0')
print(f'    {"nmax":>5s} {"dim":>5s} {"lambda*":>9s} {"E(R=2)":>15s} {"vs exact -0.602634214":>22s}')
for nmax in [1, 2, 3, 4]:
    mk = lambda R, lam, nmax=nmax: [sturmian(c, n, l, lam) for c in 'AB' for n in range(1, nmax+1) for l in range(n)]
    nxi = 40+10*nmax
    f = lambda lam: solve(mk(2.0, abs(lam)), 2.0, nxi, nxi, thresh=1e-10)[0][0]
    r = minimize_scalar(f, bounds=(0.7, 2.6), method='bounded', options={'xatol':1e-6})
    print(f'    {nmax:5d} {2*nmax*(nmax+1)//2:5d} {r.x:9.5f} {r.fun:15.9f} {r.fun+0.602634214:22.9f}')

print()
print('='*104)
print('(T) THE PULAY BOUND, evaluated for the lab\'s own LCAO H2+ at R = 2')
R = 2.0
S = np.exp(-R)*(1+R+R*R/3)
E = -0.5 + ((-1/R+np.exp(-2*R)*(1+1/R)) + (-np.exp(-R)*(1+R)))/(1+S) + 1/R
def grid2(nr=200, nmu=200, panels=(0,0.15,0.4,0.8,1.5,3.0,6.0,12.0,30.0,80.0)):
    mu, wmu = roots_legendre(nmu); pts = []
    for centre in ('A','B'):
        zc = -R/2 if centre=='A' else R/2
        for a_,b_ in zip(panels[:-1],panels[1:]):
            x, wx = roots_legendre(nr)
            r = 0.5*(b_-a_)*x+0.5*(b_+a_); wr = 0.5*(b_-a_)*wx
            Rr, Mu = np.meshgrid(r, mu, indexing='ij')
            z = zc + Rr*Mu; rc = Rr*np.sqrt(np.maximum(0,1-Mu*Mu))
            rA = np.hypot(rc, z+R/2); rB = np.hypot(rc, z-R/2)
            f = rA-rB
            for _ in range(3): f = 1.5*(f/R) - 0.5*(f/R)**3; f = f*R
            sA = 0.5*(1-f/R); w = sA if centre=='A' else 1-sA
            pts.append((rA, rB, z, w*2*np.pi*Rr**2*np.outer(wr,wmu)))
    return pts
G = grid2()
def psi_of(Rv, rA, rB):
    Sv = np.exp(-Rv)*(1+Rv+Rv*Rv/3)
    return (np.exp(-rA)+np.exp(-rB))/np.sqrt(np.pi)/np.sqrt(2*(1+Sv))
nrm = res = 0.0
for (rA, rB, z, w) in G:
    p = psi_of(R, rA, rB)
    Hp = (-0.5 + 1/R - E)*(np.exp(-rA)+np.exp(-rB))/np.sqrt(np.pi)/np.sqrt(2*(1+S)) \
         - (np.exp(-rA)/rB + np.exp(-rB)/rA)/np.sqrt(np.pi)/np.sqrt(2*(1+S))
    nrm += np.sum(w*p*p); res += np.sum(w*Hp*Hp)
res = np.sqrt(res)
dR = 1e-3; dn = 0.0
for (rA, rB, z, w) in G:
    rAp = np.hypot(np.sqrt(np.maximum(rA**2-(z+R/2)**2,0)), z+(R+dR)/2)
    rBp = np.hypot(np.sqrt(np.maximum(rB**2-(z-R/2)**2,0)), z-(R+dR)/2)
    rAm = np.hypot(np.sqrt(np.maximum(rA**2-(z+R/2)**2,0)), z+(R-dR)/2)
    rBm = np.hypot(np.sqrt(np.maximum(rB**2-(z-R/2)**2,0)), z-(R-dR)/2)
    d = (psi_of(R+dR, rAp, rBp) - psi_of(R-dR, rAm, rBm))/(2*dR)
    dn += np.sum(w*d*d)
dn = np.sqrt(dn)
print(f'    <psi|psi> on the grid = {nrm:.10f}   ||(H-E)psi|| = {res:.8f} Eh   ||dpsi/dR|| = {dn:.8f} /a0')
print(f'    BOUND  |Pulay| <= 2 ||dpsi/dR|| ||(H-E)psi|| = {2*dn*res:.6f} Eh/a0')
print(f'    MEASURED Pulay (F_HF + dE/dR)               = {0.11609384-0.05380439:.6f} Eh/a0'
      f'   ({100*(0.11609384-0.05380439)/(2*dn*res):.1f}% of the bound)')
print(f'    Temple: E - E_exact <= ||(H-E)psi||^2/(E_1 - E) with E_1 = E_u = -0.16085:'
      f'  {res**2/(-0.16085-E):.5f} Eh (true error {E+0.602634214:.5f})')
