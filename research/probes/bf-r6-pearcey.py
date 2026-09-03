#!/usr/bin/env python
"""bf-r6-pearcey.py — the quartic: the superrevival envelope is a PEARCEY function at complex Y,
its singulant is -i/16 (imaginary axis, unlike the revival's -1/54 on the negative real axis),
and the regime boundary is Im Y = (1/2) beta4^{-1/2} = O(1).

  I4(alpha, delta; b4) = (1/sqrt(2pi)) int exp(-u^2/2 + i alpha u + i delta u^2 + i b4 u^4) du
                       = (1/(sqrt(2pi) b4^{1/4})) Pe( alpha b4^{-1/4}, (delta + i/2) b4^{-1/2} )
  with Pe(X,Y) = int exp(i(v^4 + Y v^2 + X v)) dv.
"""
from mpmath import mp, mpf, mpc, quad, exp, sqrt, pi, inf, gamma, factorial, j as I, fabs, mpmathify
import mpmath
mp.dps = 40

TWO = mpf(2)

def I4(alpha, delta, b4, L=14):
    f = lambda u: exp(-u**2/2 + I*(alpha*u + delta*u**2 + b4*u**4))
    return quad(f, [-L, 0, L]) / sqrt(2*pi)

def Pe(X, Y, L=None):
    # int exp(i(v^4 + Y v^2 + X v)) dv with Im Y > 0 : converges because e^{-Im Y v^2}
    L = L or mpf(30)/mp.sqrt(max(mpf('0.05'), Y.imag if hasattr(Y,'imag') else 0))
    f = lambda v: exp(I*(v**4 + Y*v**2 + X*v))
    return quad(f, [-L, 0, L])

print("=== 1 · the Pearcey identity, checked at five points ===")
print(f"{'alpha':>8}{'delta':>8}{'beta4':>10}   {'I4 (quadrature)':>40}   {'Pearcey form':>40}   rel")
for (a, d, b4) in [(0, 0, mpf('0.3')), (mpf('0.7'), 0, mpf('0.3')), (mpf('0.7'), mpf('0.4'), mpf('0.3')),
                   (mpf('-1.3'), mpf('0.2'), mpf('1.0')), (mpf('0.5'), mpf('-0.6'), mpf('2.5'))]:
    lhs = I4(a, d, b4)
    Y = (d + I/2) / mp.sqrt(b4); X = a / b4**mpf('0.25')
    rhs = Pe(X, Y) / (sqrt(2*pi) * b4**mpf('0.25'))
    print(f"{float(a):8.2f}{float(d):8.2f}{float(b4):10.3f}   {mp.nstr(lhs,14):>40}   {mp.nstr(rhs,14):>40}   {float(abs(lhs-rhs)/abs(lhs)):.2e}")

print("\n=== 2 · the singulant: G_k = i^k (4k-1)!! / k!  ~  (16 i)^k Gamma(k) / (pi sqrt 2) ===")
def dfact(n):                       # (n)!! for odd n
    r = mpf(1)
    while n > 1: r *= n; n -= 2
    return r
G = [mpc(1)]
for k in range(1, 121):
    G.append((I**k) * dfact(4*k-1) / factorial(k))
S_pred = 1/(pi*sqrt(2))
print(f"  predicted Stokes constant 1/(pi sqrt2) = {mp.nstr(S_pred, 12)}")
print(f"{'k':>5}{'G_k / ((16i)^k Gamma(k))':>32}{'ratio to 1/(pi sqrt2)':>26}")
ser = []
for k in (5, 10, 20, 40, 80, 120):
    r = G[k] / ((16*I)**k * gamma(k))
    ser.append(r)
    print(f"{k:5}{mp.nstr(r, 14):>32}{mp.nstr(r/S_pred, 14):>26}")
# Richardson on S_k = G_k/((16i)^k Gamma(k)) to get the constant and the b_1 analogue
def richardson(f, kk, order):
    v = [f(kk + i) for i in range(order + 1)]
    for m in range(1, order + 1):
        v = [((kk + i + m) * v[i+1] - (kk + i) * v[i]) / m for i in range(len(v)-1)]
    return v[0]
Sk = lambda k: G[k] / ((16*I)**k * gamma(k))
Sinf = richardson(Sk, 100, 6)
print(f"  Richardson-6 at k=100:  S = {mp.nstr(Sinf, 14)}   S*pi*sqrt2 = {mp.nstr(Sinf*pi*sqrt(2), 12)}")
b1 = richardson(lambda k: (Sk(k)/S_pred - 1)*(k-1), 90, 5)
print(f"  b_1 analogue (Richardson-5): {mp.nstr(b1, 10)}   candidates: -1/4 = -0.25, -3/8, -1/2, -5/8, -3/4")

print("\n=== 3 · the same for the CUBIC, to show where the e^{-1} of Theorem A.2 comes from ===")
Gc = []
for k in range(0, 121):
    Gc.append(((-1)**k) * dfact(6*k-1) / factorial(2*k) if k else mpf(1))
Sc = lambda k: Gc[k] / ((-54)**k * gamma(k))
print(f"  bare moment I(0,beta): S = {mp.nstr(richardson(Sc, 100, 6), 14)}   vs 1/(2 pi) = {mp.nstr(1/(2*pi), 14)}")
print("  (the maximiser's 1/(6 pi e) carries an e^{-1} from the COMPOSITION h; the bare moment has none)")

print("\n=== 4 · the regime boundary: Im Y = (1/2) beta4^{-1/2} ===")
print("  beta4 at T_rev  = 10 pi sigma^4 / (3 nbar^2)      beta4 at T_sr = 5 pi sigma^4 / (2 nbar)")
print("  ratio beta4(T_sr)/beta4(T_rev) = 3 nbar / 4")
print(f"{'nbar':>8}{'sigma_c at T_sr':>18}{'sigma_c at T_rev':>18}   (beta4 = 1/4, i.e. Im Y = 1)")
for nb in (30, 100, 150, 300, 600, 1200, 6000):
    s_sr = (mpf(nb)/(10*pi))**mpf('0.25')
    s_rev = (3*mpf(nb)**2/(40*pi))**mpf('0.25')
    print(f"{nb:8}{float(s_sr):18.4f}{float(s_rev):18.4f}")

print("\n=== 5 · how far the Airy (cubic) envelope survives as beta4 grows, at alpha = 0 ===")
print(f"{'beta4':>9}{'ImY':>9}{'|I4| exact':>16}{'|I3| cubic-only':>18}{'rel err':>11}{'|I2| Gaussian':>16}{'rel err':>11}")
for b4 in [mpf(x) for x in ('0.005','0.02','0.05','0.1','0.25','0.5','1','2','4')]:
    ex = abs(I4(0, 0, b4)); g = mpf(1)
    print(f"{float(b4):9.3f}{float(1/(2*mp.sqrt(b4))):9.3f}{float(ex):16.9f}{float(g):18.9f}{float(abs(ex-g)/ex):11.2e}"
          f"{float(g):16.9f}{float(abs(ex-g)/ex):11.2e}")

print("\n=== 6 · the peak law at the cusp:  Re(Pe_X / Pe) = 0  (vs Airy's Ai'/Ai = -lambda) ===")
print("  Pearcey ODE: 4 i Pe_XXX - 2 i Y Pe_X + X Pe = 0 ;  heat equation Pe_Y = -i Pe_XX ;  caustic 27X^2 + 8Y^3 = 0")
print(f"{'beta4':>9}{'argmax_alpha |I4|':>22}{'d/dalpha ln|I4| at it':>26}")
for b4 in [mpf(x) for x in ('0.05','0.25','1','4')]:
    f = lambda a: -abs(I4(a, 0, b4))
    aopt = mp.findroot(lambda a: (abs(I4(a+mpf('1e-8'),0,b4)) - abs(I4(a-mpf('1e-8'),0,b4)))/mpf('2e-8'), mpf('0.0001'))
    d = (abs(I4(aopt+mpf('1e-8'),0,b4)) - abs(I4(aopt-mpf('1e-8'),0,b4)))/mpf('2e-8')
    print(f"{float(b4):9.3f}{mp.nstr(aopt,12):>22}{mp.nstr(d,6):>26}")
