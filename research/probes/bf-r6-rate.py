#!/usr/bin/env python
"""bf-r6-rate.py — Q31: the reconnection rate of the cubic state (3d+2 + 4p+1 + 5s + 6p-1)/2
from the theta-elimination + a 2-D crossing count.

All four modes are stretched (l = |m|), so with s = sin(theta), Theta_lm ~ s^{|m|}:
   a = A2 s^2 e^{iw3 t},  b = A1 s e^{iw4 t},  c = A0 e^{iw5 t},  d = A-1 s e^{iw6 t}
and disc(aw^3+bw^2+cw+d) = 18abcd - 4b^3 d + b^2 c^2 - 4ac^3 - 27a^2 d^2 becomes, with u = s^2,
   disc = u * [ X(t) + Y(t) u + Z(t) u^2 ],
   X = A1^2 A0^2 e^{i 738 tau} - 4 A2 A0^3 e^{i 832 tau}          (gap 94)
   Y = 18 A2 A1 A0 A-1 e^{i 869 tau} - 4 A1^3 A-1 e^{i 775 tau}   (gap 94)
   Z = -27 A2^2 A-1^2 e^{i 1000 tau}                              (one term)
tau = t/7200.  So the FIVE Polya frequencies reorganise as 2 + 2 + 1 by the power of sin^2(theta),
and the only internal beats are 94 and 94 -- NOT the adjacent gaps 37, 57, 37, 131.

A reconnection needs a REAL u in (0,1] and |w0| = 1 for the double root w0 = (9ad - bc)/(2(b^2 - 3ac)).
"""
import numpy as np
from math import pi, factorial, sqrt
from scipy.special import genlaguerre, sph_harm_y

def Rnl(n, l, r):
    r = np.asarray(r, float)
    norm = sqrt((2.0/n)**3 * factorial(n-l-1) / (2*n*factorial(n+l)))
    x = 2*r/n
    return norm * np.exp(-r/n) * x**l * genlaguerre(n-l-1, 2*l+1)(x)

def sig(l, m):     # Y_lm(pi/2, 0), real
    return float(np.real(sph_harm_y(l, m, pi/2, 0.0)))

MODES = [(3,2,2), (4,1,1), (5,0,0), (6,1,-1)]          # m = 2, 1, 0, -1 ; coefficient 1/2 each
W = {3:400, 4:225, 5:144, 6:100}                        # -E_n * 7200
C = 0.5

def profiles(r):
    A = {}
    for (n,l,m) in MODES:
        A[m] = C * Rnl(n,l,r) * sig(l,abs(m)) * (1 if m>=0 else (-1)**abs(m))
    return A

def fields(r, tau):
    """returns F1 (the real resultant condition), u, and g = |w0| - 1, on the (r x tau) grid."""
    A = profiles(r)
    A2, A1, A0, Am = A[2][:,None], A[1][:,None], A[0][:,None], A[-1][:,None]
    t = tau[None,:]
    # divide everything by e^{i 1000 tau}: Z becomes real
    Xr = A1**2*A0**2*np.cos(-262*t) - 4*A2*A0**3*np.cos(-168*t)
    Xi = A1**2*A0**2*np.sin(-262*t) - 4*A2*A0**3*np.sin(-168*t)
    Yr = 18*A2*A1*A0*Am*np.cos(-131*t) - 4*A1**3*Am*np.cos(-225*t)
    Yi = 18*A2*A1*A0*Am*np.sin(-131*t) - 4*A1**3*Am*np.sin(-225*t)
    Z  = -27*A2**2*Am**2 * np.ones_like(t)
    F1 = Z*Xi**2 - Yr*Xi*Yi + Xr*Yi**2
    with np.errstate(divide='ignore', invalid='ignore'):
        u = -Xi/Yi
    s = np.sqrt(np.clip(u, 0, None))
    # the cubic coefficients at this (r, u), with the common phase e^{i w6 t} removed
    a = A2*s**2; b = A1*s; c = A0*np.ones_like(t); d = Am*s
    pa = np.exp(1j*(400-100)*(-t)); pb = np.exp(1j*(225-100)*(-t)); pc = np.exp(1j*(144-100)*(-t))
    aa = a*pa; bb = b*pb; cc = c*pc; dd = d
    num = 9*aa*dd - bb*cc
    den = 2*(bb**2 - 3*aa*cc)
    w0 = num/den
    g = np.abs(w0) - 1.0
    ok = (u > 0) & (u <= 1.0) & np.isfinite(u) & np.isfinite(g)
    return F1, u, g, ok

def count(rmin=0.3, rmax=25.0, Nr=4000, Nt=8192, chunk=200):
    tau = np.linspace(0, 2*pi, Nt, endpoint=False)
    rs = np.linspace(rmin, rmax, Nr)
    total = 0; per_r = np.zeros(Nr-1)
    prevF1 = prevG = prevOK = None
    for i0 in range(0, Nr, chunk):
        r = rs[i0:i0+chunk]
        F1, u, g, ok = fields(r, tau)
        if prevF1 is not None:
            F1 = np.vstack([prevF1, F1]); g = np.vstack([prevG, g]); ok = np.vstack([prevOK, ok])
            base = i0-1
        else:
            base = i0
        s1 = np.sign(F1); s2 = np.sign(g)
        # a cell (i, j) : corners (i,j),(i+1,j),(i,j+1),(i+1,j+1) with tau periodic
        def cellvary(s):
            a1 = s[:-1,:]; a2 = s[1:,:]; a3 = np.roll(s, -1, axis=1)[:-1,:]; a4 = np.roll(s, -1, axis=1)[1:,:]
            mn = np.minimum(np.minimum(a1,a2), np.minimum(a3,a4))
            mx = np.maximum(np.maximum(a1,a2), np.maximum(a3,a4))
            return (mn < 0) & (mx > 0)
        okc = ok[:-1,:] & ok[1:,:] & np.roll(ok,-1,axis=1)[:-1,:] & np.roll(ok,-1,axis=1)[1:,:]
        hit = cellvary(s1) & cellvary(s2) & okc
        cnt = hit.sum(axis=1)
        total += int(hit.sum())
        per_r[base:base+len(cnt)] += cnt
        prevF1 = F1[-1:,:]; prevG = g[-1:,:]; prevOK = ok[-1:,:]
    return total, rs, per_r

if __name__ == '__main__':
    print("theta-elimination: the five Polya frequencies 738, 775, 832, 869, 1000 group as")
    print("   u^1 : {738, 832}  gap 94       u^2 : {775, 869}  gap 94       u^3 : {1000}")
    print("so the eliminated discriminant has TWO internal beats, both 94/7200, not the")
    print("adjacent gaps 37, 57, 37, 131 that Polya's fixed-position count uses.\n")
    for Nr, Nt in ((2000, 4096), (4000, 8192), (6000, 12288)):
        tot, rs, per = count(Nr=Nr, Nt=Nt)
        # events come in +-z mirror pairs and +-phi mirror pairs; the count above is over
        # (r, tau) with theta in (0, pi/2] and one phi branch
        print(f"  Nr={Nr:5} Ntau={Nt:6}  raw (r,tau) crossings = {tot:6}   x4 (z-mirror x phi-mirror) = {4*tot:7}"
              f"   Opus R4 lower bound 1480   Delta t = {2*pi*7200/max(1,4*tot):8.4f}")
        top = np.argsort(per)[::-1][:12]
        print("     densest radii:", np.round(np.sort(rs[top]), 3))
