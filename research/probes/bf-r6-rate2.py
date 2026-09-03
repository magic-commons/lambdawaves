#!/usr/bin/env python
"""bf-r6-rate2.py — Q31 by a CONVERGENT count: for each r, find the roots tau of the theta-eliminated
resultant F1, keep those with admissible u, and count how many have |w0| < 1.  Each reconnection is a
crossing of |w0| = 1 along a branch, so the number of events over an r-interval is the total variation
of m(r) = #{admissible roots with |w0| < 1}."""
import numpy as np
from math import pi, factorial, sqrt
from scipy.special import genlaguerre, sph_harm_y
import sys

def Rnl(n, l, r):
    r = np.asarray(r, float)
    norm = sqrt((2.0/n)**3 * factorial(n-l-1) / (2*n*factorial(n+l)))
    x = 2*r/n
    return norm*np.exp(-r/n)*x**l*genlaguerre(n-l-1, 2*l+1)(x)
def sig(l, m): return float(np.real(sph_harm_y(l, m, pi/2, 0.0)))
MODES = [(3,2,2),(4,1,1),(5,0,0),(6,1,-1)]
def profiles(r):
    A = {}
    for (n,l,m) in MODES:
        A[m] = 0.5*Rnl(n,l,r)*sig(l,abs(m))*(1 if m>=0 else (-1)**abs(m))
    return A
def fields(r, tau):
    A = profiles(r)
    A2,A1,A0,Am = A[2][:,None],A[1][:,None],A[0][:,None],A[-1][:,None]
    t = tau[None,:]
    Xr = A1**2*A0**2*np.cos(-262*t) - 4*A2*A0**3*np.cos(-168*t)
    Xi = A1**2*A0**2*np.sin(-262*t) - 4*A2*A0**3*np.sin(-168*t)
    Yr = 18*A2*A1*A0*Am*np.cos(-131*t) - 4*A1**3*Am*np.cos(-225*t)
    Yi = 18*A2*A1*A0*Am*np.sin(-131*t) - 4*A1**3*Am*np.sin(-225*t)
    Z  = -27*A2**2*Am**2*np.ones_like(t)
    F1 = Z*Xi**2 - Yr*Xi*Yi + Xr*Yi**2
    with np.errstate(divide='ignore', invalid='ignore'):
        u = -Xi/Yi
    s = np.sqrt(np.clip(u,0,None))
    a = A2*s**2; b = A1*s; c = A0*np.ones_like(t); d = Am*s
    pa = np.exp(-1j*300*t); pb = np.exp(-1j*125*t); pc = np.exp(-1j*44*t)
    aa,bb,cc,dd = a*pa, b*pb, c*pc, d
    w0 = (9*aa*dd - bb*cc)/(2*(bb**2 - 3*aa*cc))
    return F1, u, np.abs(w0)
def m_of_r(rs, Nt=40000, chunk=40):
    tau = np.linspace(0, 2*pi, Nt, endpoint=False)
    out = np.zeros(len(rs), dtype=np.int64)
    for i0 in range(0, len(rs), chunk):
        r = rs[i0:i0+chunk]
        F1, u, aw = fields(r, tau)
        s = np.sign(F1)
        cross = (s*np.roll(s,-1,axis=1) < 0)
        good = (u>0)&(u<=1)&np.isfinite(u)&np.isfinite(aw)&(aw<1)
        out[i0:i0+len(r)] = (cross & good).sum(axis=1)
        sys.stdout.flush()
    return out
if __name__ == '__main__':
    for Nr, Nt in ((1500,20000),(3000,40000),(6000,60000)):
        rs = np.linspace(0.3, 25.0, Nr)
        m = m_of_r(rs, Nt)
        tv = int(np.abs(np.diff(m)).sum())
        print(f"  Nr={Nr:5} Ntau={Nt:6}  total variation of m(r) = {tv:7}   x2 (z-mirror) = {2*tv:8}"
              f"   Delta t = {2*pi*7200/max(1,2*tv):9.4f}   max m = {m.max()}")
        sys.stdout.flush()
