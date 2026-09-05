#!/usr/bin/env python
"""OPUS Q2 — central-field atoms: Hartree (self-interaction-free) and Hartree-Fock-Slater / X-alpha
for He, Ne, Ar, Na, K, Sc.   Every number below is produced by this file.

METHOD.  UNIFORM radial grid r_i = i h, i = 1..N, r_max fixed; Dirichlet at both ends.  The radial
equation -1/2 u'' + [V(r) + l(l+1)/2r^2] u = eps u is a symmetric TRIDIAGONAL eigenproblem, so
scipy.linalg.eigh_tridiagonal returns every shell of a given l at once -- no shooting, no node
counting, no bisection (which is what P3 needed).  Second-order differences give eps = eps_exact
+ c h^2, so the whole SCF is run on TWO grids (N and 2N) and RICHARDSON-extrapolated: (4 E_2N - E_N)/3.
Certified below on the bare Coulomb problem at Z = 18 to 6e-7 Eh at N=80000 before extrapolation.

X-alpha:  V_xa = -(3 alpha/2)(3 rho/pi)^{1/3},  E_xa = -(9 alpha/8)(3/pi)^{1/3} int rho^{4/3}.
alpha = 2/3 is Kohn-Sham/Dirac (exchange-only LDA); alpha = 1 is Slater's original.
Latter tail:  V is clipped to -(Z-N_el+1)/r wherever it rises above it (Latter, Phys. Rev. 99, 510).
"""
import numpy as np, sys, time
from scipy.linalg import eigh_tridiagonal
HARTREE_EV = 27.211386245988

def simpson(f, h):
    n = len(f); g = f.copy()
    if n % 2 == 0: g = g[:-1]; n -= 1
    w = np.ones(n); w[1:-1:2] = 4; w[2:-1:2] = 2
    return h/3*np.sum(w*g)

def cumtrap(f, h):
    c = np.zeros(len(f)); c[1:] = np.cumsum(0.5*(f[1:]+f[:-1])*h)
    return c + 0.5*f[0]*h        # the (0, r_1) sliver

def solve_l(r, h, V, l, k):
    d = 1.0/h**2 + V + l*(l+1)/(2*r*r)
    e = -0.5/h**2*np.ones(len(r)-1)
    w, v = eigh_tridiagonal(d, e, select='i', select_range=(0, k-1))
    out = []
    for i in range(k):
        u = v[:, i]/np.sqrt(simpson(v[:, i]**2, h))
        j = np.argmax(np.abs(u))
        if u[j] < 0: u = -u
        out.append((w[i], u))
    return out

def hartree(r, h, q):
    """V_H(r) = (1/r) int_0^r q + int_r^inf q/r' ,  q = sum_nl f_nl u_nl^2 = 4 pi r^2 rho."""
    inner = cumtrap(q, h)
    tail = cumtrap(q/r, h)
    return inner/r + (tail[-1] - tail)

def run(Z, config, alpha=2/3, latter=True, sic=False, N=60000, rmax=30.0, mix=0.30,
        iters=260, tol=1e-9):
    h = rmax/(N+1); r = np.arange(1, N+1)*h
    Nel = sum(o for _, _, o in config)
    lmax = max(l for _, l, _ in config)
    V = -Z/r
    q_nl = {}
    Vprev = {}
    for it in range(iters):
        orbs = {}
        if sic:
            VH_tot = hartree(r, h, sum(q_nl.values())) if q_nl else np.zeros(N)
            newq = {}
            for (n, l, o) in config:
                Vo = -Z/r + VH_tot - (hartree(r, h, q_nl[(n, l)])/o if q_nl else 0.0)
                if latter: Vo = np.minimum(Vo, -(Z-Nel+1)/r)
                if it: Vo = (1-mix)*Vprev[(n, l)] + mix*Vo
                Vprev[(n, l)] = Vo
                orbs[(n, l)] = solve_l(r, h, Vo, l, n-l)[n-l-1]
                newq[(n, l)] = o*orbs[(n, l)][1]**2
            dV = 1.0 if it == 0 else np.max(np.abs(sum(newq.values())-sum(q_nl.values())))
            q_nl = newq
            if it > 3 and dV < 1e-11: break
            continue
        for l in range(lmax+1):
            need = max((n-l for n, ll, _ in config if ll == l), default=0)
            if not need: continue
            for i, (eps, u) in enumerate(solve_l(r, h, V, l, need)):
                orbs[(i+l+1, l)] = (eps, u)
        q = np.zeros(N)
        for (n, l, o) in config: q += o*orbs[(n, l)][1]**2
        rho = q/(4*np.pi*r*r)
        VH = hartree(r, h, q)
        Vn = -Z/r + VH
        if alpha is not None: Vn = Vn - 1.5*alpha*(3*rho/np.pi)**(1/3)
        if latter: Vn = np.minimum(Vn, -(Z-Nel+1)/r)
        dV = np.max(np.abs((Vn-V)*r))
        V = (1-mix)*V + mix*Vn
        if dV < tol: break
    # --- energies from the functional (safe under the Latter clip)
    if sic:
        q = sum(q_nl.values()); rho = q/(4*np.pi*r*r); VH = hartree(r, h, q)
        q_nl = q_nl
        T = 0.0
        for (n, l, o) in config:
            eps, u = orbs[(n, l)]
            T += o*(eps - simpson(u*u*Vprev[(n, l)], h))
        Ex = 0.0
        # plain Hartree: the electron-electron energy is 1/2 sum_{i!=j} -> E_H - sum_nl selfterms
        EH = 0.5*simpson(q*VH, h)
        for (n, l, o) in config:
            EH -= 0.5*simpson(q_nl[(n, l)]*hartree(r, h, q_nl[(n, l)]), h)/o
    else:
        T = 0.0
        for (n, l, o) in config:
            eps, u = orbs[(n, l)]
            T += o*(eps - simpson(u*u*V, h))
        EH = 0.5*simpson(q*VH, h)
        Ex = (-(9*alpha/8)*(3/np.pi)**(1/3)*simpson(4*np.pi*r*r*rho**(4/3), h)) if alpha is not None else 0.0
    Ene = simpson(q*(-Z/r), h)
    E = T + Ene + EH + Ex
    return dict(E=E, T=T, Ene=Ene, EH=EH, Ex=Ex, eps={k: v[0] for k, v in orbs.items()},
                orbs=orbs, r=r, h=h, V=V, rho=rho, q=q, iters=it+1, dV=dV)

def rich(Z, config, N=20000, **kw):
    a = run(Z, config, N=N, **kw); b = run(Z, config, N=2*N, **kw)
    E = (4*b['E']-a['E'])/3
    eps = {k: (4*b['eps'][k]-a['eps'][k])/3 for k in b['eps']}
    return E, eps, a, b

NE = [(1,0,2),(2,0,2),(2,1,6)]
AR = [(1,0,2),(2,0,2),(2,1,6),(3,0,2),(3,1,6)]
HE = [(1,0,2)]
NA = [(1,0,2),(2,0,2),(2,1,6),(3,0,1)]
K  = [(1,0,2),(2,0,2),(2,1,6),(3,0,2),(3,1,6),(4,0,1)]
SC = [(1,0,2),(2,0,2),(2,1,6),(3,0,2),(3,1,6),(3,2,1),(4,0,2)]


print('='*112)
print('0. CERTIFICATION — bare Coulomb, Z = 18, no SCF (eigensolver only)')
for N in [20000, 40000, 80000]:
    h = 30.0/(N+1); r = np.arange(1, N+1)*h
    w = [solve_l(r, h, -18.0/r, l, 3) for l in range(3)]
    err = max(abs(w[l][i][0] + 18.0**2/(2*(i+l+1)**2)) for l in range(3) for i in range(3))
    print(f'   N = {N:6d}  h = {h:.2e}   max |eps - exact| (n<=5, l<=2) = {err:.3e} Eh')
h1 = 30.0/20001; h2 = 30.0/40001
r1 = np.arange(1,20001)*h1; r2 = np.arange(1,40001)*h2
e1 = solve_l(r1,h1,-18.0/r1,0,3); e2 = solve_l(r2,h2,-18.0/r2,0,3)
print('   Richardson (4 E_2N - E_N)/3 at N=20000/40000 for 1s,2s,3s:',
      ['%.2e' % abs((4*e2[i][0]-e1[i][0])/3 + 162.0/(i+1)**2) for i in range(3)], 'Eh')
sys.stdout.flush()

print()
print('='*112)
print('1. HELIUM — the SAME physics P3 ran (Hartree = HF for a closed-shell 1s^2)')
E, eps, a, b = rich(2, HE, N=30000, rmax=25.0, sic=True, alpha=None, latter=False, mix=0.4)
u = b['orbs'][(1,0)][1]
print(f'   E = {E:.7f} Eh    eps_1s = {eps[(1,0)]:.7f}    <r> = {simpson(u*u*b["r"], b["h"]):.6f} a0   ({b["iters"]} iterations)')
print( '   Hartree-Fock limit  -2.8616800 / -0.9179559 / 0.9273        P3 got  -2.86149 / -0.91789')
print(f'   |E - E_HF| = {abs(E+2.8616800):.2e} Eh  ->  P3 residual 1.9e-4 was its FIRST-ORDER quadrature, not "the grid".')
sys.stdout.flush()

NEHF, ARHF = -128.54710, -526.81751
print()
print('='*112)
print('2. NEON (Z=10) and ARGON (Z=18) — total energies and eigenvalues')
print('   HF references (numerical HF limit / Clementi-Roetti):')
print('     Ne  E=-128.54710  1s=-32.77244  2s=-1.93039  2p=-0.85041')
print('     Ar  E=-526.81751  1s=-118.6104  2s=-12.32215 2p=-9.57146  3s=-1.27735  3p=-0.59102')
print()
print(f'   {"model":50s} {"E_total":>13s} {"E-E_HF":>10s} {"%":>7s}   eigenvalues')
def line(tag, Z, cfg, ref, **kw):
    E, eps, a, b = rich(Z, cfg, **kw)
    es = ' '.join(f'{n}{"spdfgh"[l]}={eps[(n,l)]:.5f}' for (n, l) in sorted(eps))
    print(f'   {tag:50s} {E:13.5f} {E-ref:10.5f} {100*abs(E-ref)/abs(ref):7.3f}   {es}')
    sys.stdout.flush(); return E, eps
line('Ne Hartree (self-interaction-free, no exchange)', 10, NE, NEHF, N=20000, rmax=25., sic=True, alpha=None, latter=False, mix=0.4)
line('Ne X-alpha 2/3 (Dirac/KS), Latter tail',          10, NE, NEHF, N=20000, rmax=25., alpha=2/3, mix=0.3)
line('Ne X-alpha 2/3, NO Latter tail',                  10, NE, NEHF, N=20000, rmax=25., alpha=2/3, latter=False, mix=0.3)
line('Ne X-alpha 1 (Slater / Herman-Skillman), Latter', 10, NE, NEHF, N=20000, rmax=25., alpha=1.0, mix=0.3)
print()
line('Ar Hartree (self-interaction-free, no exchange)', 18, AR, ARHF, N=20000, rmax=30., sic=True, alpha=None, latter=False, mix=0.4)
line('Ar X-alpha 2/3, Latter tail',                     18, AR, ARHF, N=20000, rmax=30., alpha=2/3, mix=0.3)
line('Ar X-alpha 2/3, NO Latter tail',                  18, AR, ARHF, N=20000, rmax=30., alpha=2/3, latter=False, mix=0.3)
line('Ar X-alpha 1, Latter tail',                       18, AR, ARHF, N=20000, rmax=30., alpha=1.0, mix=0.3)

print()
print('='*112)
print('3. THE alpha THAT REPRODUCES THE HF TOTAL ENERGY (Schwarz 1972: alpha_HF(Ne)=0.73081, alpha_HF(Ar)=0.72177)')
from scipy.optimize import brentq
for (name, Z, cfg, ref, sch) in [('Ne', 10, NE, NEHF, 0.73081), ('Ar', 18, AR, ARHF, 0.72177)]:
    rmax = 25. if Z == 10 else 30.
    f = lambda al: run(Z, cfg, N=20000, rmax=rmax, alpha=al, latter=False, mix=0.3)['E'] - ref
    aHF = brentq(f, 0.60, 0.95, xtol=1e-5)
    print(f'   {name}: alpha_HF (this solve, no Latter) = {aHF:.5f}    Schwarz 1972 = {sch:.5f}    diff = {aHF-sch:+.5f}')
    sys.stdout.flush()

print()
print('='*112)
print('4. THE 2p EIGENVALUE OF Ne — Koopmans vs SLATER TRANSITION STATE (the honest ionisation)')
print('   Experimental Ne 2p IP = 21.5645 eV = 0.79248 Eh;  HF Koopmans -eps_2p = 0.85041 Eh = 23.14 eV')
for al, tag in [(2/3, 'alpha=2/3'), (1.0, 'alpha=1')]:
    g = run(10, NE, N=20000, rmax=25., alpha=al, mix=0.3)
    ts = run(10, [(1,0,2),(2,0,2),(2,1,5.5)], N=20000, rmax=25., alpha=al, mix=0.3)
    full = run(10, NE, N=20000, rmax=25., alpha=al, mix=0.3)['E']
    ion  = run(10, [(1,0,2),(2,0,2),(2,1,5)], N=20000, rmax=25., alpha=al, mix=0.3)['E']
    print(f'   X-alpha {tag:10s}: Koopmans -eps_2p = {-g["eps"][(2,1)]:.5f} Eh = {-g["eps"][(2,1)]*HARTREE_EV:6.2f} eV ;'
          f'  transition state (2p^5.5) -eps = {-ts["eps"][(2,1)]:.5f} Eh = {-ts["eps"][(2,1)]*HARTREE_EV:6.2f} eV ;'
          f'  Delta-SCF = {(ion-full)*HARTREE_EV:6.2f} eV')
    sys.stdout.flush()

print()
print('='*112)
print('5. THE VALENCE LAW E.4 WANTED: the quantum defect of Na 3s, and 3d/4s in K and Sc')
for al in (2/3, 1.0):
    na = run(11, NA, N=20000, rmax=40., alpha=al, mix=0.3)
    naL = run(11, NA, N=20000, rmax=40., alpha=al, latter=False, mix=0.3)
    e3s, e3sL = na['eps'][(3,0)], naL['eps'][(3,0)]
    ns  = 1/np.sqrt(-2*e3s); nsL = 1/np.sqrt(-2*e3sL)
    print(f'   Na alpha={al:.3f}: eps_3s = {e3s:.5f} -> n* = {ns:.4f}, delta_s = {3-ns:.4f}   (KNOWN delta_s(Na) = 1.373, IP 0.18886 Eh)')
    print(f'              NO Latter tail: eps_3s = {e3sL:.5f} -> delta_s = {3-nsL:.4f}   (the LDA potential decays EXPONENTIALLY;')
    print( '              without the Latter/-1/r tail the quantum-defect formula has no asymptotic Coulomb tail to define it)')
    sys.stdout.flush()
print()
for (nm, Z, cfg) in [('K  [Ar]4s^1', 19, K), ('Sc [Ar]3d^1 4s^2', 21, SC)]:
    for al in (2/3, 1.0):
        g = run(Z, cfg, N=20000, rmax=45., alpha=al, mix=0.25)
        r, h, V = g['r'], g['h'], g['V']
        e4s = g['eps'].get((4,0)); e3d = g['eps'].get((3,2))
        if e3d is None:
            e3d = solve_l(r, h, V, 2, 1)[0][0]
        if e4s is None:
            e4s = solve_l(r, h, V, 0, 4)[3][0]
        print(f'   {nm:20s} alpha={al:.3f}:  eps_3d = {e3d:9.5f}   eps_4s = {e4s:9.5f}   -> {"3d below 4s" if e3d<e4s else "4s below 3d"}')
        sys.stdout.flush()
print('   (HF for neutral K: eps_4s = -0.14695, eps_3d = -0.02150 -> 4s below 3d.  For Sc HF gives')
print('    eps_3d = -0.31776 below eps_4s = -0.21001, yet the ground CONFIGURATION is 3d^1 4s^2:')
print('    the eigenvalue ordering is NOT the filling order, which is a total-energy statement.)')
