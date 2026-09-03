#!/usr/bin/env python
"""BF R9 probe 6b — characterise the oscillation of D_j about c sqrt(j+1/2)."""
import mpmath as mp
import numpy as np
mp.mp.dps = 30

c = 4*mp.sqrt(2)*mp.gamma(mp.mpf(3)/4)**2/mp.pi**2

def logfact(n): return mp.loggamma(n+1)
def sixj_iso(j, J):
    def delta(a, b, cc):
        return mp.mpf('0.5')*(logfact(a+b-cc)+logfact(a-b+cc)+logfact(-a+b+cc)-logfact(a+b+cc+1))
    a=b=d=e=j; cc=f=J
    pref = delta(a,b,cc)+delta(a,e,f)+delta(d,b,f)+delta(d,e,cc)
    lo = max(a+b+cc, a+e+f, d+b+f, d+e+cc); hi = min(a+b+d+e, b+cc+e+f, a+cc+d+f)
    tot = mp.mpf(0)
    for t in range(int(lo), int(hi)+1):
        lg = (logfact(t+1)-logfact(t-a-b-cc)-logfact(t-a-e-f)-logfact(t-d-b-f)
              -logfact(t-d-e-cc)-logfact(a+b+d+e-t)-logfact(b+cc+e+f-t)-logfact(a+cc+d+f-t))
        tot += (-1)**t*mp.e**(lg+pref)
    return tot
def D(j):
    return sum((2*J+1)*abs(sixj_iso(j, J)) for J in range(0, 2*j+1))

print("c = 4 sqrt2 Gamma(3/4)^2/pi^2 =", mp.nstr(c, 12))
for block in ((60, 80), (100, 120), (180, 200)):
    lo, hi = block
    r = []
    for j in range(lo, hi+1):
        r.append(float(D(j)/(c*mp.sqrt(j+mp.mpf('0.5')))))
    r = np.array(r)
    print("j in [%3d,%3d]: mean D/(c sqrt(j+1/2)) = %.6f   sd = %.6f   min %.4f max %.4f"
          % (lo, hi, r.mean(), r.std(), r.min(), r.max()))
