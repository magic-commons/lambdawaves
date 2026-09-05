#!/usr/bin/env python
"""bf-r11-box.py — Round 11 audit
   §2  does domainForP = 2.6/n_min cut a tail?  (norm outside the box for 1s and 6s)
   §4  the well: N^2 = 2/(a^3 j_{l+1}(z)^2) derived; the gas packet's CAPTURED fraction computed
       far more finely than the lab's G = 36 midpoint cube.
All from scipy, nothing from the lab.
"""
import numpy as np
from scipy import special, integrate

# ---------------------------------------------------------------- §2 momentum tail
def F(n, l, p):
    """Podolsky-Pauling radial momentum function, normalised int F^2 p^2 dp = 1"""
    from math import factorial, pi, sqrt
    N = sqrt((2/pi)*factorial(n-l-1)/factorial(n+l)) * n**2 * 2**(2*l+2) * factorial(l)
    t = n*n*p*p
    x = (t-1)/(t+1)
    C = special.eval_gegenbauer(n-l-1, l+1, x)
    return N * (n*p)**l / (n*n*p*p+1)**(l+2) * C

print("=== §2  is int F^2 p^2 dp = 1, and what lies OUTSIDE the lab's momentum box? ===")
print("lab: domainForP(n_min) = min(4, max(0.35, 2.6/n_min))   (a CUBE half-width in p)")
for (n, l) in [(1,0),(2,0),(2,1),(3,0),(6,0),(6,5)]:
    tot,_ = integrate.quad(lambda p: F(n,l,p)**2*p*p, 0, np.inf, limit=400)
    P = min(4.0, max(0.35, 2.6/n))
    inside,_ = integrate.quad(lambda p: F(n,l,p)**2*p*p, 0, P, limit=400)
    # the box is a CUBE of half-width P; the inscribed sphere has radius P, the circumscribed P*sqrt(3)
    ins3,_ = integrate.quad(lambda p: F(n,l,p)**2*p*p, 0, P*np.sqrt(3), limit=400)
    print(f"  |{n}{'spdfgh'[l]}>  norm = {tot:.10f}   P = {P:.4f}   norm inside |p|<P: {inside:.8f}"
          f"  -> OUTSIDE the inscribed sphere: {tot-inside:.3e}   outside |p|<P*sqrt3: {tot-ins3:.3e}")

print("\n  (n_min is the SMALLEST n populated, so a 1s state gets P = 2.6 and a pure 6s gets P = 0.4333)")
for n in [1,2,3,4,5,6]:
    P = min(4.0, max(0.35, 2.6/n))
    tot,_ = integrate.quad(lambda p: F(n,0,p)**2*p*p, 0, np.inf, limit=400)
    ins,_ = integrate.quad(lambda p: F(n,0,p)**2*p*p, 0, P, limit=400)
    print(f"   pure {n}s : P = {P:.4f}, fraction of |phi|^2 outside |p| < P = {(tot-ins)/tot:.4e}")
# the worst case: a superposition 1s + 6s gets P from n_min = 1 -> 2.6, fine.  What about 6s ALONE?
print("\n  worst single state for the CUT: the one whose momentum spread is largest relative to P.")
for n in [1,2,3,4,5,6]:
    P = min(4.0, max(0.35, 2.6/n))
    tot,_ = integrate.quad(lambda p: F(n,n-1,p)**2*p*p, 0, np.inf, limit=400)
    ins,_ = integrate.quad(lambda p: F(n,n-1,p)**2*p*p, 0, P, limit=400)
    print(f"   pure |{n},{n-1}> : P = {P:.4f}, outside = {(tot-ins)/tot:.4e}")

# ---------------------------------------------------------------- §4 the well
print("\n=== §4  the well's normalisation N^2 = 2/(a^3 j_{l+1}(z)^2)  [DERIVED-HERE] ===")
def jl(l, x):
    return special.spherical_jn(l, x)
def zeros_jl(l, count):
    # bracket on a fine grid then brentq
    from scipy.optimize import brentq
    out=[]; x=l+1e-6; h=1e-3
    f0=jl(l,x)
    while len(out)<count:
        x1=x+h; f1=jl(l,x1)
        if f0*f1<0: out.append(brentq(lambda t: jl(l,t), x, x1, xtol=1e-15))
        x,f0=x1,f1
        if x>500: break
    return out
a=10.0
worst=0
for l in range(0,6):
    zs = zeros_jl(l, 6-l)
    for z in zs:
        k=z/a
        I,_ = integrate.quad(lambda r: jl(l,k*r)**2*r*r, 0, a, limit=400)
        pred = a**3/2*jl(l+1,z)**2
        worst=max(worst, abs(I-pred)/pred)
print(f"  int_0^a j_l(kr)^2 r^2 dr  ==  (a^3/2) j_(l+1)(z)^2  to relative {worst:.3e}  -> N^2 = 2/(a^3 j_(l+1)(z)^2) CONFIRMED")

print("\n=== §4  the GAS PACKET's captured fraction, computed properly ===")
print("packet: g(x) = (2 pi s^2)^{-3/4} exp(-|x-x0|^2/(4 s^2)) e^{i k.x}, x0 = (0,0,-4), k = (0,0,0.8), a = 10")
print("(this is a normalised Gaussian in the WHOLE of R^3; part of it lies OUTSIDE the wall r<a)")
# the 91 register labels (n,l,m) with n<=6 ; only m = 0 couples to an on-axis packet with k || z
# <q|packet> = int psi_q* g d^3x.  psi_q = N j_l(kr) Y_lm.  Use 2-D quadrature in (r, cos theta).
from math import pi, sqrt, factorial
sigma, x0z, kz, aR = 1.6, -4.0, 0.8, 10.0
A = (2*pi*sigma**2)**-0.75

def Ylm0(l, ct):   # real Y_l0
    return sqrt((2*l+1)/(4*pi))*special.eval_legendre(l, ct)

Zcache={}
def wz(n,l):
    key=(n,l)
    if key not in Zcache: Zcache[key]=zeros_jl(l, n-l)[n-l-1]
    return Zcache[key]

# Gauss-Legendre in r on [0,a] and in ct on [-1,1]
NR, NC = 900, 900
rr, wr = np.polynomial.legendre.leggauss(NR); rr = 0.5*aR*(rr+1); wr = 0.5*aR*wr
cc, wc = np.polynomial.legendre.leggauss(NC)
Rg, Cg = np.meshgrid(rr, cc, indexing='ij')
Wg = wr[:,None]*wc[None,:]
zc = Rg*Cg
d2 = Rg**2 + x0z**2 - 2*Rg*x0z*Cg          # |x - x0|^2 with x0 on the z axis
gauss = A*np.exp(-d2/(4*sigma**2))
phase_r = np.cos(kz*zc); phase_i = np.sin(kz*zc)

captured = 0.0; nstates = 0; contrib=[]
for n in range(1,7):
    for l in range(0,n):
        z = wz(n,l); k = z/aR
        N = sqrt(2/(aR**3*jl(l+1,z)**2))
        psi = N*jl(l, k*Rg)*Ylm0(l, Cg)
        # <q|packet> = 2 pi int r^2 dr dct psi (gauss)(cos + i sin)
        cr = 2*pi*np.sum(Wg*Rg**2*psi*gauss*phase_r)
        ci = 2*pi*np.sum(Wg*Rg**2*psi*gauss*phase_i)
        p = cr*cr+ci*ci
        captured += p
        if p > 1e-6: nstates += 1; contrib.append((n,l,p))
print(f"  captured (exact 2-D quadrature, m = 0 only, 91-label register) = {captured:.6f}")
print(f"  states carrying > 1e-6 of the norm: {nstates}")
for n,l,p in sorted(contrib, key=lambda z:-z[2])[:8]:
    print(f"     |{n}{'spdfgh'[l]}0> : {p:.6f}")
# how much of the Gaussian is outside the wall at all?
out,_ = integrate.quad(lambda r: r*r*np.exp(-(r*r)/(2*sigma**2)), 0, np.inf)
# do it properly: fraction of |g|^2 with |x| > a
def frac_outside():
    f = lambda r, ct: r*r*(A**2)*np.exp(-(r*r + x0z**2 - 2*r*x0z*ct)/(2*sigma**2))
    tot,_ = integrate.dblquad(lambda ct, r: 2*pi*f(r,ct), 0, 60, -1, 1)
    ins,_ = integrate.dblquad(lambda ct, r: 2*pi*f(r,ct), 0, aR, -1, 1)
    return tot, 1-ins/tot
tot, fo = frac_outside()
print(f"  (sanity) total |g|^2 over R^3 = {tot:.8f} ; fraction lying OUTSIDE the wall r < 10 = {fo:.3e}")
print("\n  REPORT wave 17 says '97%'; the well test asserts only > 0.85; the brief quotes 0.967.")
