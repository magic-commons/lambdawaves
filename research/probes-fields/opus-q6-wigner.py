#!/usr/bin/env python
"""OPUS Q6 — the Wigner function of the hydrogen 1s (Dahl-Springborg 1982 / Praxmeyer 2006):
its MINIMUM VALUE and WHERE, and whether an (r, p_r) slice is the honest joint picture.

W(r,p) = (2 pi)^{-3} int psi*(r+s/2) psi(r-s/2) e^{i p.s} d^3 s.  With psi = e^{-r}/sqrt(pi) and s = 2u,
    W(r,p) = pi^{-4} int e^{2 i p.u} e^{-|r+u| - |r-u|} d^3u.
The exponent is CONSTANT on prolate spheroids with foci at +-r, so use them: with the polar axis along
r_hat, xi = (|u+r|+|u-r|)/(2r), eta = (|u+r|-|u-r|)/(2r),  u_z = r xi eta,  u_perp = r sqrt((xi^2-1)(1-eta^2)),
d^3u = r^3 (xi^2-eta^2) dxi deta dphi, and the phi integral is a Bessel J0:

    W(r,p) = (2 r^3/pi^3) int_1^inf dxi int_-1^1 deta (xi^2-eta^2) e^{-2 r xi}
                            cos(2 p_par r xi eta) J0(2 p_perp r sqrt((xi^2-1)(1-eta^2)))

so W depends on r, p and the angle between them ONLY -- three numbers, exactly as it must.
Gauss-Laguerre(xi, scaled by 2r) x Gauss-Legendre(eta).  Certified below on three exact identities.
"""
import numpy as np
from scipy.special import roots_laguerre, roots_legendre, j0
from scipy.optimize import minimize
NL, NG = 140, 160
tl, wl = roots_laguerre(NL)
xg, wg = roots_legendre(NG)

def W(r, ppar, pperp):
    if r <= 0: r = 1e-12
    a = 2.0*r
    xi = 1.0 + tl/a
    wxi = wl*np.exp(-a)/a
    XI, ETA = np.meshgrid(xi, xg, indexing='ij')
    Wt = np.outer(wxi, wg)
    s = np.sqrt(np.maximum(0.0, (XI*XI-1.0)*(1.0-ETA*ETA)))
    f = (XI*XI-ETA*ETA)*np.cos(2*ppar*r*XI*ETA)*j0(2*pperp*r*s)
    return 2*r**3/np.pi**3*np.sum(Wt*f)

print('='*100)
print('CERTIFICATION')
for p in [0.0, 0.5, 1.0, 2.0]:
    num = W(1e-6, p, 0.0); ex = 1/(np.pi**3*(1+p*p)**2)
    print(f'   W(r->0, p={p}) = {num:.12f}   exact 1/(pi^3(1+p^2)^2) = {ex:.12f}')
# marginals with fixed Gauss rules
xc, wc = roots_legendre(48)
def marg_p(pv, nr=200, rmax=45.0):
    xr, wr = roots_legendre(nr)
    r = 0.5*rmax*(xr+1); wrr = 0.5*rmax*wr
    tot = 0.0
    for ri, wi in zip(r, wrr):
        s_ = sum(wj*W(ri, pv*cj, pv*np.sqrt(max(0.0,1-cj*cj))) for cj, wj in zip(xc, wc))
        tot += wi*2*np.pi*ri*ri*s_
    return tot
def marg_r(rv, npt=220, pmax=30.0):
    xp, wp = roots_legendre(npt)
    pv = 0.5*pmax*(xp+1); wpp = 0.5*pmax*wp
    tot = 0.0
    for pi_, wi in zip(pv, wpp):
        s_ = sum(wj*W(rv, pi_*cj, pi_*np.sqrt(max(0.0,1-cj*cj))) for cj, wj in zip(xc, wc))
        tot += wi*2*np.pi*pi_*pi_*s_
    return tot
for p in [0.0, 1.0]:
    print(f'   int W d^3r at p={p}: {marg_p(p):.10f}   exact |phi(p)|^2 = {8/(np.pi**2*(1+p*p)**4):.10f}')
print('   (the POSITION marginal int W d^3p = |psi(r)|^2 is exact by construction: the p-integration')
print('    collapses e^{2ip.u} to delta^3(u), i.e. xi=1 and eta=+-1, giving e^{-2r}/pi.  A numerical')
print('    check of it needs an oscillatory-integral rule, not Gauss-Legendre, so it is not run here.)')

print()
print('='*100)
print('THE MINIMUM OF W_1s')
best = None
for r0 in np.linspace(0.4, 9.0, 30):
    for pp in np.linspace(-3, 3, 25):
        for pq in np.linspace(0, 3, 10):
            v = W(r0, pp, pq)
            if best is None or v < best[0]: best = (v, r0, pp, pq)
res = minimize(lambda x: W(abs(x[0]), x[1], abs(x[2])), [best[1], best[2], best[3]],
               method='Nelder-Mead', options={'xatol':1e-10,'fatol':1e-18,'maxiter':4000})
r_, pp_, pq_ = abs(res.x[0]), res.x[1], abs(res.x[2])
p_ = np.hypot(pp_, pq_)
print(f'   grid seed: W = {best[0]:.6e} at r={best[1]:.3f}, p_par={best[2]:.3f}, p_perp={best[3]:.3f}')
print(f'   MINIMUM   W = {res.fun:.10e}  a.u.   at r = {r_:.6f} a0,  p_par = {pp_:.6f},  p_perp = {pq_:.6f}')
print(f'             |p| = {p_:.6f} a.u.,  cos(r,p) = {pp_/p_ if p_>0 else 0:.6f},  r.p = {r_*pp_:.6f}')
print(f'   maximum W(0,0) = 1/pi^3 = {1/np.pi**3:.8f}; |W_min|/W_max = {abs(res.fun)/(1/np.pi**3)*100:.4f}%')
print(f'   convergence in the quadrature: NL,NG = 140,160 vs 220,260 ->')
NL2, NG2 = 220, 260
tl2, wl2 = roots_laguerre(NL2); xg2, wg2 = roots_legendre(NG2)
def W2(r, ppar, pperp):
    a = 2.0*r; xi = 1.0 + tl2/a; wxi = wl2*np.exp(-a)/a
    XI, ETA = np.meshgrid(xi, xg2, indexing='ij'); Wt = np.outer(wxi, wg2)
    s = np.sqrt(np.maximum(0.0, (XI*XI-1.0)*(1.0-ETA*ETA)))
    return 2*r**3/np.pi**3*np.sum(Wt*(XI*XI-ETA*ETA)*np.cos(2*ppar*r*XI*ETA)*j0(2*pperp*r*s))
print(f'     W_min = {W2(r_, pp_, pq_):.10e} (finer rule) -> {abs(W2(r_,pp_,pq_)-res.fun):.1e}')
print()
print('   W along the axis p_perp = 0 at the optimal p_par:')
for rr in [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 6.0]:
    print(f'     r = {rr:4.1f}:  W = {W(rr, pp_, 0.0):+.6e}')
print()
print('   the sign is controlled by r.p: at r = %.4f,' % r_)
for pv in [0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0]:
    print(f'     |p| = {pv:4.2f}:  W(p antiparallel) = {W(r_, -pv, 0.0):+.6e}   W(p parallel) = {W(r_, +pv, 0.0):+.6e}'
          f'   W(p perpendicular) = {W(r_, 0.0, pv):+.6e}')
