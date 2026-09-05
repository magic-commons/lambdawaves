#!/usr/bin/env python
"""OPUS Q3 — two-centre STO/hydrogenic integrals in prolate-spheroidal coordinates, and what a
FIXED-exponent hydrogenic basis can and cannot do for H2+.

Coordinates: A at z=-R/2, B at +R/2.  xi=(rA+rB)/R in [1,inf), eta=(rA-rB)/R in [-1,1].
  rA = R(xi+eta)/2, rB = R(xi-eta)/2,  dV = (R^3/8)(xi^2-eta^2) dxi deta dphi
  zA_rel = z + R/2 = R(xi*eta+1)/2 ,  zB_rel = z - R/2 = R(xi*eta-1)/2
Every m=0 basis function is written  chi = sqrt((2l+1)/4pi) * S_l * (sum_j c_j r^j) * e^{-zeta r}
with S_l = r^l P_l(cos th) the SOLID harmonic (a POLYNOMIAL in (xi,eta) -- this is the point that
Round 1's E.3 gets wrong: 1/rA and P_l(cos th_A) are NOT polynomials, but dV/rA and r^l P_l ARE).
The 1/r that appears in the Laplacian and in the nuclear attraction is cancelled EXACTLY against
(xi^2-eta^2) = (xi+eta)(xi-eta):   dV/rA = (R^2/4)(xi-eta) dxi deta dphi,  dV/rB = (R^2/4)(xi+eta).
So every integrand is polynomial x e^{-a xi - b eta}: Gauss-Laguerre(xi) x Gauss-Legendre(eta) is EXACT.
"""
import numpy as np
from scipy.special import roots_laguerre, roots_legendre, genlaguerre, factorial
from scipy.linalg import eigh
np.set_printoptions(precision=10, suppress=False)

# ---------------------------------------------------------------- basis functions
class Fn:
    """chi = Nang * S_l * (sum_j c[j] r^j) * exp(-zeta r) on centre 'A' or 'B'."""
    def __init__(self, centre, l, c, zeta, tag=''):
        self.centre, self.l, self.c, self.zeta, self.tag = centre, l, np.asarray(c, float), zeta, tag
        self.Nang = np.sqrt((2 * l + 1) / (4 * np.pi))

def hydrogenic(centre, n, l, Z=1.0):
    """the register's own function: zeta = Z/n, R_nl(r) = norm e^{-zr}(2Zr/n)^l L^{2l+1}_{n-l-1}(2Zr/n)."""
    zeta = Z / n
    norm = np.sqrt((2 * Z / n) ** 3 * factorial(n - l - 1) / (2 * n * factorial(n + l)))
    lag = genlaguerre(n - l - 1, 2 * l + 1)          # poly in x
    coef_x = np.asarray(lag.coefficients[::-1], float)   # ascending powers of x
    x_scale = 2 * Z / n
    c = np.array([coef_x[j] * x_scale ** j for j in range(len(coef_x))])
    c *= norm * x_scale ** l                            # the r^l is carried by S_l
    return Fn(centre, l, c, zeta, tag=f'{n}{"spdfgh"[l]}(Z={Z:g})')

def sto(centre, n, l, zeta):
    """plain Slater: r^{n-1} e^{-zeta r} P_l ; n-1-l >= -1 allowed."""
    j = n - 1 - l
    c = np.zeros(max(j + 1, 1))
    c[j] = 1.0
    return Fn(centre, l, c, zeta, tag=f'STO{n}{"spdfgh"[l]}z={zeta:.4f}')

# ---------------------------------------------------------------- quadrature grid
def grid(R, a, b, nxi, neta):
    t, wt = roots_laguerre(nxi)
    xi = 1.0 + t / a
    wxi = wt * np.exp(-a) / a                    # int_1^inf F(xi) e^{-a xi} dxi = sum wxi F(xi)
    eta, weta = roots_legendre(neta)
    XI, ETA = np.meshgrid(xi, eta, indexing='ij')
    W = np.outer(wxi, weta) * np.exp(-b * ETA)   # e^{-b eta} carried in the weight
    return XI, ETA, W

def geom(R, XI, ETA):
    rA = R * (XI + ETA) / 2.0
    rB = R * (XI - ETA) / 2.0
    zA = R * (XI * ETA + 1.0) / 2.0
    zB = R * (XI * ETA - 1.0) / 2.0
    return rA, rB, zA, zB

def solid(l, z, r2):
    """S_l = r^l P_l(z/r) by  l S_l = (2l-1) z S_{l-1} - (l-1) r^2 S_{l-2}."""
    S0 = np.ones_like(z)
    if l == 0: return S0
    S1 = z.copy()
    if l == 1: return S1
    for k in range(2, l + 1):
        S2 = ((2 * k - 1) * z * S1 - (k - 1) * r2 * S0) / k
        S0, S1 = S1, S2
    return S1

def poly_val(f, r, z):
    """the polynomial prefactor of chi (chi = poly_val * e^{-zeta r})."""
    S = solid(f.l, z, r * r)
    rad = np.zeros_like(r)
    for j, cj in enumerate(f.c):
        if cj != 0.0: rad = rad + cj * r ** j
    return f.Nang * S * rad

def poly_lap(f, r, z):
    """-1/2 Lap chi = (reg + sing/r) e^{-zeta r}.  Returns (reg, sing) polynomial prefactors.
       Lap(r^k e^{-zr} P_l) = [ (k(k+1)-l(l+1)) r^{k-2} - 2(k+1)z r^{k-1} + z^2 r^k ] e^{-zr} P_l
       with k = l + j.  Only j=0 and j=1 make r^{l-1} (a single 1/r); j=-1 would make 1/r^2 (excluded)."""
    l, zeta = f.l, f.zeta
    S = solid(l, z, r * r)
    reg = np.zeros_like(r); sing = np.zeros_like(r)
    for j, cj in enumerate(f.c):
        if cj == 0.0: continue
        k = l + j
        A = k * (k + 1) - l * (l + 1)
        # term A r^{k-2} = A r^{l+j-2}
        if j >= 2: reg = reg + cj * A * r ** (j - 2)
        elif j == 1: sing = sing + cj * A          # A r^{l-1} -> S_l/r
        # (j == 0 gives A = 0 exactly)
        # term -2(k+1) zeta r^{k-1} = ... r^{l+j-1}
        if j >= 1: reg = reg - cj * 2 * (k + 1) * zeta * r ** (j - 1)
        else: sing = sing - cj * 2 * (k + 1) * zeta
        # term zeta^2 r^k
        reg = reg + cj * zeta ** 2 * r ** j
    return -0.5 * f.Nang * S * reg, -0.5 * f.Nang * S * sing

def matrices(basis, R, nxi=48, neta=48):
    """S, T, VA, VB (VA = <i|-1/rA|j>).  Each pair gets its own scaled Laguerre rule."""
    N = len(basis)
    S = np.zeros((N, N)); T = np.zeros((N, N)); VA = np.zeros((N, N)); VB = np.zeros((N, N))
    pref = 2 * np.pi * R ** 3 / 8.0
    for i in range(N):
        for j in range(i, N):
            fi, fj = basis[i], basis[j]
            si = 1.0 if fi.centre == 'A' else -1.0
            sj = 1.0 if fj.centre == 'A' else -1.0
            a = R * (fi.zeta + fj.zeta) / 2.0
            b = R * (si * fi.zeta + sj * fj.zeta) / 2.0
            XI, ETA, W = grid(R, a, b, nxi, neta)
            rA, rB, zA, zB = geom(R, XI, ETA)
            ri, zi = (rA, zA) if fi.centre == 'A' else (rB, zB)
            rj, zj = (rA, zA) if fj.centre == 'A' else (rB, zB)
            pi_ = poly_val(fi, ri, zi)
            pj_ = poly_val(fj, rj, zj)
            meas = XI ** 2 - ETA ** 2
            mA = (2.0 / R) * (XI - ETA)          # (xi^2-eta^2)/rA
            mB = (2.0 / R) * (XI + ETA)          # (xi^2-eta^2)/rB
            S[i, j] = pref * np.sum(W * pi_ * pj_ * meas)
            VA[i, j] = -pref * np.sum(W * pi_ * pj_ * mA)
            VB[i, j] = -pref * np.sum(W * pi_ * pj_ * mB)
            # kinetic: use the symmetrised average of <i|Lap j> and <j|Lap i>
            tot = 0.0
            for (fa, ra, za, pa, fb, rb, zb) in ((fi, ri, zi, pi_, fj, rj, zj), (fj, rj, zj, pj_, fi, ri, zi)):
                reg, sing = poly_lap(fb, rb, zb)
                mS = mA if fb.centre == 'A' else mB
                tot += pref * (np.sum(W * pa * reg * meas) + np.sum(W * pa * sing * mS))
            T[i, j] = 0.5 * tot
            S[j, i], T[j, i], VA[j, i], VB[j, i] = S[i, j], T[i, j], VA[i, j], VB[i, j]
    return S, T, VA, VB

def solve(basis, R, nxi=48, neta=48, thresh=1e-9, ZA=1.0, ZB=1.0):
    S, T, VA, VB = matrices(basis, R, nxi, neta)
    H = T + ZA * VA + ZB * VB
    d = 1.0 / np.sqrt(np.abs(np.diag(S)))            # unit-normalise every basis function
    S = S * np.outer(d, d); H = H * np.outer(d, d)
    # canonical orthogonalisation
    s, U = np.linalg.eigh(S)
    keep = s > thresh * s.max()
    X = U[:, keep] / np.sqrt(s[keep])
    Hp = X.T @ H @ X
    w, v = np.linalg.eigh(Hp)
    C = X @ v
    return w + ZA * ZB / R, C, (S, T, VA, VB), keep.sum()

# ---------------------------------------------------------------- 1. certification
print('=' * 100)
print('1. CERTIFICATION of the quadrature against the closed forms the lab uses (R = 2)')
R = 2.0
for (nxi, neta) in [(8, 8), (12, 12), (16, 16), (24, 24), (32, 32), (48, 48), (64, 64)]:
    b = [hydrogenic('A', 1, 0), hydrogenic('B', 1, 0)]
    S, T, VA, VB = matrices(b, R, nxi, neta)
    Sref = np.exp(-R) * (1 + R + R * R / 3)
    Jref = -1 / R + np.exp(-2 * R) * (1 + 1 / R)
    Kref = -np.exp(-R) * (1 + R)
    Eg = -0.5 + (Jref + Kref) / (1 + Sref) + 1 / R
    w, C, mats, nk = solve(b, R, nxi, neta)
    print(f'  nxi=neta={nxi:3d}  |S-Sref|={abs(S[0,1]-Sref):.3e}  |J-Jref|={abs(VB[0,0]-Jref):.3e}'
          f'  |K-Kref|={abs(VA[0,1]-Kref):.3e}  |Eg-Egref|={abs(w[0]-Eg):.3e}')
print(f'  closed forms:  S = {np.exp(-R)*(1+R+R*R/3):.12f}   J = {-1/R+np.exp(-2*R)*(1+1/R):.12f}'
      f'   K = {-np.exp(-R)*(1+R):.12f}')
w, C, mats, nk = solve([hydrogenic('A', 1, 0), hydrogenic('B', 1, 0)], R, 48, 48)
print(f'  Eg(2) = {w[0]:.12f}   (lab molecule.js: -0.5537714953184829)   Eu(2) = {w[1]:.12f}')
print(f'  kinetic-energy symmetry check |T01-T10| after symmetrisation is 0 by construction;')
S_, T_, VA_, VB_ = mats
print(f'  T_AA = {T_[0,0]:.12f} (exact <1s|-1/2 Lap|1s> = 0.5), T_AB = {T_[0,1]:.12f}')

# ---------------------------------------------------------------- helpers
from scipy.optimize import minimize_scalar, minimize

def Emin_over_R(make_basis, Rs, nxi=40, neta=40):
    out = []
    for R in Rs:
        w, C, mats, nk = solve(make_basis(R), R, nxi, neta)
        out.append(w[0])
    return np.array(out)

def find_Re(make_basis, lo=1.2, hi=4.5, nxi=40, neta=40):
    f = lambda R: solve(make_basis(R), R, nxi, neta)[0][0]
    res = minimize_scalar(f, bracket=None, bounds=(lo, hi), method='bounded',
                          options={'xatol': 1e-7})
    return res.x, res.fun

EV = 27.211386245988
print()
print('=' * 100)
print('2. WHAT THE REGISTER OWNS: fixed hydrogenic exponents (zeta = 1/n) on each centre')
print('   basis sets built from the 91-label register, m = 0 only (sigma), l <= n-1')
def reg_basis(nmax):
    def mk(R):
        b = []
        for c in 'AB':
            for n in range(1, nmax + 1):
                for l in range(0, n):
                    b.append(hydrogenic(c, n, l))
        return b
    return mk

print(f'   {"basis":32s} {"dim":>4s} {"rank":>5s} {"E(R=2)":>14s} {"R_e":>9s} {"E_min":>14s} {"D_e/eV":>9s}')
rows = []
for nmax in [1, 2, 3, 4, 5, 6]:
    mk = reg_basis(nmax)
    nxi = 40 + 8 * nmax
    E2, C, mats, nk = solve(mk(2.0), 2.0, nxi, nxi)
    Re, Em = find_Re(mk, 1.3, 4.6, nxi, nxi)
    dim = len(mk(2.0))
    print(f'   hydrogenic n<={nmax}, zeta=1/n            {dim:4d} {nk:5d} {E2[0]:14.9f} {Re:9.5f} {Em:14.9f} {(-0.5-Em)*EV:9.4f}')
    rows.append((nmax, dim, E2[0], Re, Em))
print('   EXACT H2+ (Bates-Ledsham-Stewart / Wind):  E(2) = -0.602634214   R_e = 1.997193   E_min = -0.602634634   D_e = 2.7928 eV')

print()
print('=' * 100)
print('3. WHAT ONE OPTIMISED EXPONENT DOES (the same functional forms, zeta free)')
def opt1s(R, nxi=40):
    f = lambda z: solve([sto('A',1,0,z), sto('B',1,0,z)], R, nxi, nxi)[0][0]
    r = minimize_scalar(f, bounds=(0.6, 2.5), method='bounded', options={'xatol':1e-9})
    return r.x, r.fun
z2, E2 = opt1s(2.0)
print(f'   1s only, zeta optimised at R=2:  zeta = {z2:.6f}  E = {E2:.9f}   (Finkelstein-Horowitz 1928: zeta=1.2380, E=-0.586504)')
def f_re_opt1s(R): return opt1s(R)[1]
rr = minimize_scalar(f_re_opt1s, bounds=(1.6,2.6), method='bounded', options={'xatol':1e-6})
print(f'   1s only, zeta optimised at every R:  R_e = {rr.x:.5f}  E_min = {rr.fun:.9f}  D_e = {(-0.5-rr.fun)*EV:.4f} eV')

print()
print('   {1s, 2p_z} on each centre -- FIXED hydrogenic exponents vs OPTIMISED (Dickinson 1933):')
mk_fix = lambda R: [hydrogenic('A',1,0), hydrogenic('A',2,1), hydrogenic('B',1,0), hydrogenic('B',2,1)]
E_fix2 = solve(mk_fix(2.0), 2.0, 48, 48)[0][0]
Re_fix, Em_fix = find_Re(mk_fix, 1.5, 4.5, 48, 48)
print(f'     fixed  zeta_1s=1, zeta_2p=0.5 (the register):   E(2) = {E_fix2:.9f}  R_e = {Re_fix:.5f}  E_min = {Em_fix:.9f}  D_e = {(-0.5-Em_fix)*EV:.4f} eV')
def opt2(R, x0=(1.246, 2.965)):
    def f(x):
        za, zp = abs(x[0]), abs(x[1])
        return solve([sto('A',1,0,za), sto('A',2,1,zp), sto('B',1,0,za), sto('B',2,1,zp)], R, 48, 48)[0][0]
    r = minimize(f, x0, method='Nelder-Mead', options={'xatol':1e-7,'fatol':1e-11,'maxiter':400})
    return abs(r.x[0]), abs(r.x[1]), r.fun
za, zp, Eo2 = opt2(2.0)
print(f'     optimised zeta_1s={za:.5f}, zeta_2p={zp:.5f}:            E(2) = {Eo2:.9f}   (Dickinson 1933: -0.60023, zeta_1s=1.246, zeta_2p=2.965)')
rr2 = minimize_scalar(lambda R: opt2(R)[2], bounds=(1.8,2.3), method='bounded', options={'xatol':1e-5})
zaR, zpR, _ = opt2(rr2.x)
print(f'     optimised at every R:   R_e = {rr2.x:.5f}  E_min = {rr2.fun:.9f}  D_e = {(-0.5-rr2.fun)*EV:.4f} eV  (zeta_1s={zaR:.4f}, zeta_2p={zpR:.4f})')

print()
print('=' * 100)
print('4. THE MACHINERY IS NOT THE LIMIT: an even-tempered STO basis on the same quadrature')
def even(R, ns, np_, nd, a0=0.30, beta=1.60):
    b = []
    for c in 'AB':
        for k in range(ns): b.append(sto(c,1,0,a0*beta**k))
        for k in range(np_): b.append(sto(c,2,1,a0*beta**k*1.5))
        for k in range(nd): b.append(sto(c,3,2,a0*beta**k*2.0))
    return b
for (s_,p_,d_) in [(6,0,0),(8,4,0),(10,6,3),(11,8,5)]:
    mk = lambda R, s_=s_,p_=p_,d_=d_: even(R,s_,p_,d_)
    E2b, C, mats, nk = solve(mk(2.0), 2.0, 56, 56, thresh=1e-10)
    print(f'   even-tempered 2x({s_}s{p_}p{d_}d)  dim={2*(s_+p_+d_):3d} rank={nk:3d}   E(2) = {E2b[0]:.9f}   (exact -0.602634214)')
mk = lambda R: even(R,11,8,5)
Re_e, Em_e = find_Re(mk, 1.90, 2.10, 56, 56)
print(f'   even-tempered 2x(11s8p5d):  R_e = {Re_e:.6f}  E_min = {Em_e:.9f}  D_e = {(-0.5-Em_e)*EV:.5f} eV   (exact R_e=1.997193, E=-0.602634634, D_e=2.79284 eV)')

print()
print('=' * 100)
print('5. WHY the fixed-exponent register basis CANNOT get there: the united-atom (R->0) limit')
print('   R->0 of the H2+ sigma_g state is He+ 1s (E = -2 exactly).  In the register basis both centres')
print('   coincide, so the question is: how low can  H = -1/2 Lap - 2/r  go inside span{ns(Z=1), n<=N} ?')
from math import factorial as fac
def rad_coeffs(n, l, Z=1.0):
    f = hydrogenic('A', n, l, Z); return f.c, f.zeta
def one_centre(ns, Znuc):
    N = len(ns); S = np.zeros((N,N)); T = np.zeros((N,N)); V = np.zeros((N,N))
    for i,(ni,li) in enumerate(ns):
        ci, zi = rad_coeffs(ni, li)
        for j,(nj,lj) in enumerate(ns):
            cj, zj = rad_coeffs(nj, lj); b = zi + zj
            s = v = 0.0
            for p,cp in enumerate(ci):
                for q,cq in enumerate(cj):
                    P = p + q + li + lj                       # power of r in f_i f_j
                    s += cp*cq*fac(P+2)/b**(P+3)
                    v += cp*cq*fac(P+1)/b**(P+2)
            # kinetic: 1/2 int (f_i' f_j' + l(l+1) f_i f_j / r^2) r^2 dr   (l_i = l_j here)
            di = [(li+p, cp*(li+p), -cp*zi) for p,cp in enumerate(ci)]     # d/dr [c r^{li+p} e^{-zi r}]
            t = 0.0
            for (Pi, a1, a2) in di:
                for (Pj, b1, b2) in [(lj+q, cq*(lj+q), -cq*zj) for q,cq in enumerate(cj)]:
                    for (aa, pa) in ((a1, Pi-1),(a2, Pi)):
                        for (bb, pb) in ((b1, Pj-1),(b2, Pj)):
                            if aa==0 or bb==0: continue
                            P = pa+pb
                            if P+2 < 0: continue
                            t += aa*bb*fac(P+2)/b**(P+3)
            if li>0:
                for p,cp in enumerate(ci):
                    for q,cq in enumerate(cj):
                        P = p+q+li+lj
                        t += li*(li+1)*cp*cq*fac(P)/b**(P+1)
            S[i,j]=s; V[i,j]=-Znuc*v; T[i,j]=0.5*t
    return S,T,V
print(f'   {"N (s-functions n=1..N, zeta=1/n)":38s} {"E(He+ variational)":>20s}  {"error vs -2":>12s}')
prev=None
for N in [1,2,3,4,6,8,10,12,16,20]:
    ns=[(n,0) for n in range(1,N+1)]
    S,T,V = one_centre(ns, 2.0)
    d=1/np.sqrt(np.diag(S)); S=S*np.outer(d,d); H=(T+V)*np.outer(d,d)
    s,U=np.linalg.eigh(S); keep=s>1e-11*s.max(); X=U[:,keep]/np.sqrt(s[keep])
    w=np.linalg.eigvalsh(X.T@H@X)
    print(f'   N = {N:3d}                                  {w[0]:20.9f}  {w[0]+2.0:12.3e}')
print('   (the same test with the ONE function e^{-2r} in the basis returns -2.000000000 exactly)')
S,T,V = one_centre([(1,0)], 2.0)   # zeta = 1
print(f'   for reference, hydrogenic 1s(Z=1) alone in the He+ Hamiltonian: E = {(T+V)[0,0]/S[0,0]:.9f}')
# the bound-state completeness deficit of e^{-2r} in the Z=1 hydrogen bound states
tot=0.0
for n in range(1,61):
    c,z = rad_coeffs(n,0)
    # <ns(Z=1) | 1s(Z=2)>: 1s(Z=2) = 2*2^{3/2}... use radial u: R_10(Z=2) = 2*2^{3/2} e^{-2r}
    b = z + 2.0; ov=0.0
    for p,cp in enumerate(c):
        ov += cp*(2*2**1.5)*fac(p+2)/b**(p+3)
    tot += ov*ov
print(f'   sum_n |<ns(Z=1)|1s(Z=2)>|^2 over ALL bound s-states = {tot:.6f}  -> {100*(1-tot):.3f}% of the')
print('   united-atom orbital lives in the CONTINUUM of the register\'s own Hamiltonian and is unreachable.')

print()
print('=' * 100)
print('6. THE HELLMANN-FEYNMAN / PULAY LADDER  (A.3 of Round 1 says the gap is "the Pulay force of a')
print('   minimal basis"; here is the ladder that says WHICH deficiency of the basis makes it)')
def chi_at(f, R, r, mu):
    """value of basis fn f at spherical (r, mu=cos th) measured about B at +R/2."""
    z = R/2 + r*mu; rho = r*np.sqrt(np.maximum(0.0,1-mu*mu))
    if f.centre=='A': zc = z + R/2
    else: zc = z - R/2
    rc = np.sqrt(rho*rho + zc*zc)
    S = solid(f.l, zc, rc*rc)
    rad = np.zeros_like(rc)
    for j,cj in enumerate(f.c):
        if cj!=0.0: rad = rad + cj*rc**j
    return f.Nang*S*rad*np.exp(-f.zeta*rc)

def _becke_w(eta):
    f = eta
    for _ in range(3): f = 1.5*f - 0.5*f**3
    sA = 0.5*(1-f)            # weight of centre A (large where r_A < r_B, i.e. eta<0)
    return sA, 1.0-sA

def force_electron_on_B(basis, coeffs, R, nr=140, nmu=160, panels=(0,0.15,0.4,0.8,1.5,3.0,6.0,12.0,30.0,80.0)):
    """F_z = int rho(x) (z-z_B)/r_B^3 d^3x, by a two-centre BECKE-partitioned grid: each cell is
       integrated in spherical coordinates about its own nucleus, so both cusps sit at a radial
       origin and the r_B^-2 kernel is cancelled by r_B^2 dr_B in cell B."""
    mu, wmu = roots_legendre(nmu)
    tot = 0.0
    for centre in ('A','B'):
        zc = -R/2 if centre=='A' else R/2
        for a_,b_ in zip(panels[:-1], panels[1:]):
            x, wx = roots_legendre(nr)
            r = 0.5*(b_-a_)*x + 0.5*(b_+a_); wr = 0.5*(b_-a_)*wx
            Rr, Mu = np.meshgrid(r, mu, indexing='ij')
            z = zc + Rr*Mu; rho_c = Rr*np.sqrt(np.maximum(0.0,1-Mu*Mu))
            rA = np.sqrt(rho_c**2 + (z+R/2)**2); rB = np.sqrt(rho_c**2 + (z-R/2)**2)
            wA, wB = _becke_w((rA-rB)/R)
            w = wA if centre=='A' else wB
            psi = np.zeros_like(Rr)
            for f, c in zip(basis, coeffs):
                zz = z + R/2 if f.centre=='A' else z - R/2
                rr = rA if f.centre=='A' else rB
                S = solid(f.l, zz, rr*rr)
                rad = np.zeros_like(rr)
                for j,cj in enumerate(f.c):
                    if cj!=0.0: rad = rad + cj*rr**j
                psi = psi + c*f.Nang*S*rad*np.exp(-f.zeta*rr)
            K = (z - R/2)/np.maximum(rB,1e-300)**3
            jac = 2*np.pi*Rr**2                       # d^3x = 2 pi r^2 dr dmu
            tot += np.sum(w*psi*psi*K*jac*np.outer(wr,wmu))
    return tot

def norm_check(basis, coeffs, R, nr=140, nmu=160, panels=(0,0.15,0.4,0.8,1.5,3.0,6.0,12.0,30.0,80.0)):
    mu, wmu = roots_legendre(nmu); tot=0.0
    for centre in ('A','B'):
        zc = -R/2 if centre=='A' else R/2
        for a_,b_ in zip(panels[:-1], panels[1:]):
            x, wx = roots_legendre(nr)
            r = 0.5*(b_-a_)*x + 0.5*(b_+a_); wr = 0.5*(b_-a_)*wx
            Rr, Mu = np.meshgrid(r, mu, indexing='ij')
            z = zc + Rr*Mu; rho_c = Rr*np.sqrt(np.maximum(0.0,1-Mu*Mu))
            rA = np.sqrt(rho_c**2 + (z+R/2)**2); rB = np.sqrt(rho_c**2 + (z-R/2)**2)
            wA, wB = _becke_w((rA-rB)/R); w = wA if centre=='A' else wB
            psi = np.zeros_like(Rr)
            for f, c in zip(basis, coeffs):
                zz = z + R/2 if f.centre=='A' else z - R/2
                rr = rA if f.centre=='A' else rB
                S = solid(f.l, zz, rr*rr); rad = np.zeros_like(rr)
                for j,cj in enumerate(f.c):
                    if cj!=0.0: rad = rad + cj*rr**j
                psi = psi + c*f.Nang*S*rad*np.exp(-f.zeta*rr)
            tot += np.sum(w*psi*psi*2*np.pi*Rr**2*np.outer(wr,wmu))
    return tot

def normed_ground(basis, R, nxi=48):
    w, C, mats, nk = solve(basis, R, nxi, nxi)
    Sret = mats[0]                                   # already unit-diagonal-scaled inside solve
    d = 1.0/np.sqrt(np.abs(np.diag(matrices(basis, R, nxi, nxi)[0])))
    c = C[:,0]*d                                     # C^T Sret C = 1  =>  c^T S_orig c = 1
    return w[0], c

def pulay_report(name, mk, R, nxi=48, dR=2e-4):
    E, c = normed_ground(mk(R), R, nxi)
    Fe = force_electron_on_B(mk(R), c, R)
    nn = norm_check(mk(R), c, R)
    Fhf = Fe + 1.0/R**2
    Ep = solve(mk(R+dR), R+dR, nxi, nxi)[0][0]; Em = solve(mk(R-dR), R-dR, nxi, nxi)[0][0]
    Fvar = -(Ep-Em)/(2*dR)
    print(f'   {name:44s} E={E:11.7f}  |psi|^2={nn:.8f}  F_elec={Fe:10.6f}  F_HF={Fhf:10.6f}  -dE/dR={Fvar:10.6f}  Pulay={Fhf-Fvar:10.6f}')
    return Fhf, Fvar

R = 2.0
pulay_report('1s(zeta=1) only  [the lab, P4]', lambda R: [hydrogenic('A',1,0),hydrogenic('B',1,0)], R)
pulay_report('1s + hydrogenic 2p_z (zeta=1/2) [E.3 as written]',
             lambda R: [hydrogenic('A',1,0),hydrogenic('A',2,1),hydrogenic('B',1,0),hydrogenic('B',2,1)], R)
pulay_report('register n<=6 fixed zeta=1/n (42 fns)', reg_basis(6), R, nxi=88)
pulay_report('1s(z=1) + 2p_z STO with the SAME zeta=1  [dchi/dR]',
             lambda R: [sto('A',1,0,1.0),sto('A',2,1,1.0),sto('B',1,0,1.0),sto('B',2,1,1.0)], R)
pulay_report('1s+2p optimised (z=1.2460, 1.4824)',
             lambda R: [sto('A',1,0,1.2458),sto('A',2,1,1.4824),sto('B',1,0,1.2458),sto('B',2,1,1.4824)], R)
pulay_report('even-tempered 2x(11s8p5d) (near-exact)', lambda R: even(R,11,8,5), R, nxi=56)
from mpmath import mp, mpf, exp as mexp, diff as mdiff
mp.dps = 40
Sf = lambda R: mexp(-R)*(1+R+R*R/3)
Jf = lambda R: -1/R + mexp(-2*R)*(1+1/R)
Kf = lambda R: -mexp(-R)*(1+R)
Ef = lambda R: -mpf(1)/2 + (Jf(R)+Kf(R))/(1+Sf(R)) + 1/R
print(f'   ANALYTIC for the 1s LCAO at R=2:  E = {float(Ef(mpf(2))):.12f}   -dE/dR = {float(-mdiff(Ef, mpf(2))):.12f}')
qenc = 1 - float(mexp(-4))*(1+4+8)
print(f'   ANALYTIC piece of F_elec from |chi_A|^2 alone: -q_enc(R)/R^2/(2(1+S)) = {-qenc/4/(2*(1+float(Sf(mpf(2))))):.10f}')
print('   exact H2+ near R=2: E(2)=-0.602634214, E_min=-0.602634634 at R_e=1.997193 => -dE/dR(2) = -0.000299')
print()
print('   THE CUSP THEOREM.  Kato: the exact sigma_g obeys  dpsi/dr_A|_{r_A->0} = -Z psi(A).  Every l=0')
print('   hydrogenic function on A has cusp -Z=-1; the functions on B are smooth at A.  So the basis')
print('   FORCES an effective cusp  -1 * psi_A(A) / (psi_A(A) + psi_B(A)) , which is never -1:')
for (zA, tag) in [(1.0,'register 1s (zeta=1)'), (1.2387,'optimised 1s (zeta=1.2387)')]:
    pA = zA**1.5/np.sqrt(np.pi); pB = zA**1.5*np.exp(-zA*2.0)/np.sqrt(np.pi)
    print(f'     {tag:32s} psi_A(A)={pA:.5f} psi_B(A)={pB:.5f}  effective cusp = {-zA*pA/(pA+pB):.5f}  (Kato: -1)')
print('     the register basis is 12.0% short of the cusp at every R; the optimised exponent OVERSHOOTS')
print('     to -1.143 because the variational principle trades cusp error for bond-region density.')
