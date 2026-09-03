#!/usr/bin/env python
"""bf-r6-stokes.py — Q32: the b_r of alpha* and of |I|max DERIVED from the dictionary (exact rationals),
not from Richardson.  Route: Ai -> Ai + eps Bi is the only exponentially small freedom; push it through
the peak law with the Wronskian Ai Bi' - Ai' Bi = 1/pi.

    z* = lambda^2 h^2,  lambda^3 = 1/w,  w = 72 beta^2,  x* = 3w/(2 h^3),  h = Psi(x*),  Psi = U/Vt
    alpha* = (h^2 - 1)/(12 beta)        so  A(w) := beta alpha* = (h^2-1)/12,  C_k = 72^k [w^k] A
    |I|max = h^{-1/2} U(x*) exp(-(3 eta^2 + 2 eta^3)/(3w)),   D_k = 72^k [w^k] D

    delta A  = -(eps/3) w h e^{2 zeta*} / (U(x*)^2 (h^2-1))          [Wronskian + dG/dz = z - lambda^2]
    delta D  =  2 eps D e^{2 zeta*} Uhat(x*) / U(x*)                 [Bi/Ai = 2 e^{2 zeta} Uhat/U]
    2 zeta* = (4/3) h^3 / w = 4/(3w) + (-1 + g(w)),  g = O(w)

  Late terms  f_k = S chi^{-k} [Gamma(k) + b_1 Gamma(k-1) + ...]  <->  F(w) = S e^{-chi/w}(1 + p_1 w + ...)
  with chi = -4/3 and  b_r = p_r chi^r.
"""
from sympy import Rational as R, nsimplify, exp, series, symbols, Poly, factorial, gamma, simplify, pprint, srepr, Integer

NW = 9                                   # order in w

def trunc(a):  return a[:NW + 1] + [R(0)] * max(0, NW + 1 - len(a))
def add(a, b): a, b = trunc(a), trunc(b); return [a[i] + b[i] for i in range(NW + 1)]
def smul(c, a): return [c * x for x in trunc(a)]
def mul(a, b):
    a, b = trunc(a), trunc(b); o = [R(0)] * (NW + 1)
    for i in range(NW + 1):
        if a[i] == 0: continue
        for j in range(NW + 1 - i): o[i + j] += a[i] * b[j]
    return o
def inv(a):
    a = trunc(a); assert a[0] != 0
    o = [R(0)] * (NW + 1); o[0] = 1 / a[0]
    for k in range(1, NW + 1):
        s = R(0)
        for j in range(1, k + 1): s += a[j] * o[k - j]
        o[k] = -s / a[0]
    return o
def powr(a, e):                            # a^e for rational e, a[0] = 1 required
    a = trunc(a); assert a[0] == 1
    o = [R(0)] * (NW + 1); o[0] = R(1)
    for k in range(1, NW + 1):             # (a^e)' a = e a' a^e  ->  recursion
        s = R(0)
        for j in range(1, k + 1): s += (e * j - (k - j)) * a[j] * o[k - j]
        o[k] = s / k
    return o
def compose(f, g):                          # f(g(w)), g[0] must be 0
    assert trunc(g)[0] == 0
    o = [R(0)] * (NW + 1); p = [R(0)] * (NW + 1); p[0] = R(1)
    for k in range(NW + 1):
        o = add(o, smul(f[k] if k < len(f) else R(0), p))
        p = mul(p, g)
    return o
def expser(a):                              # exp of a series with a[0] = 0
    assert trunc(a)[0] == 0
    e = [R(0)] * (NW + 1); e[0] = R(1)
    for k in range(1, NW + 1):
        s = R(0)
        for j in range(1, k + 1): s += j * trunc(a)[j] * e[k - j]
        e[k] = s / k
    return e

# ── the Airy coefficient dictionary ────────────────────────────────────────
M = 2 * NW + 6
u = [R(1)]
for k in range(1, M): u.append(u[-1] * R((6 * k - 1) * (6 * k - 3) * (6 * k - 5), 216 * k * (2 * k - 1)))
v = [R(1)] + [-R(6 * k + 1, 6 * k - 1) * u[k] for k in range(1, M)]
U    = [(-1) ** k * u[k] for k in range(M)]          # Ai  series  U(x)  = sum (-1)^k u_k x^k
Uhat = [u[k] for k in range(M)]                      # Bi  series
Vt   = [(-1) ** k * v[k] for k in range(M)]          # Ai' series
print("u_1..u_4 =", u[1:5])
print("v_1..v_4 =", v[1:5])

# sanity on the dictionary itself: u_k = (1/2pi) 2^{-k} [ Gamma(k) + b1^U Gamma(k-1) + ... ], b_r^U = u_r (-2)^r
from mpmath import mp, mpf, gammaprod, gamma as mpgamma
mp.dps = 40
def Rk(k): return mpgamma(k + mpf(1)/6) * mpgamma(k + mpf(5)/6) / (mpgamma(k) * mpgamma(k + 1))
for k in (20, 40, 80):
    pred = 1 + sum(float((-2) ** r * u[r]) * float(mpgamma(k - r) / mpgamma(k)) for r in range(1, 6))
    print(f"  dictionary check  R({k}) = {float(Rk(k)):.14f}   sum_r u_r(-2)^r Gamma(k-r)/Gamma(k) = {pred:.14f}"
          f"   diff {float(Rk(k)) - pred:.2e}")

# ── h: the inversion series, h = Psi(3w/(2h^3)) ────────────────────────────
Psi = mul(U[:NW + 1], inv(Vt[:NW + 1]))
print("\nPsi(x) = U/Vt =", Psi[:4])
h = [R(0)] * (NW + 1); h[0] = R(1)
for _ in range(NW + 2):
    xstar = smul(R(3, 2), mul([R(0), R(1)] + [R(0)] * (NW - 1), powr(h, R(-3))))   # (3/2) w h^{-3}
    h = compose(Psi, xstar)
xstar = smul(R(3, 2), mul([R(0), R(1)] + [R(0)] * (NW - 1), powr(h, R(-3))))
h2 = mul(h, h); h3 = mul(h2, h); eta = add(h, [R(-1)] + [R(0)] * NW)
print("h  =", h[:5])
print("h² =", h2[:5])

# ── the two observables, and their exact series ────────────────────────────
A = smul(R(1, 12), add(h2, [R(-1)] + [R(0)] * NW))
C = [A[k] * 72 ** k for k in range(NW + 1)]
print("\nC_k (should be -3, 54, -4860, 769824, -169746192, 47259985248, ...):")
print("  ", C[1:8])

shift = lambda a: a[1:] + [R(0)]                      # divide a series by w (a[0] must be 0)
Dexp = smul(R(-1, 3), shift(add(smul(R(3), mul(eta, eta)), smul(R(2), h3 := mul(mul(eta, eta), eta)))))
D = mul(mul(powr(h, R(-1, 2)), compose(U[:NW + 1], xstar)), expser(Dexp))
Dk = [D[k] * 72 ** k for k in range(NW + 1)]
print("D_k (should be 1, -3, 279/2, -29331/2, 19280619/8, -21368014569/40, ...):")
print("  ", Dk[:7])

# ── the exponentially small companions ─────────────────────────────────────
h3full = mul(h2, h)
g = add(smul(R(4, 3), shift(add(h3full, [R(-1)] + [R(0)] * NW))), [R(1)] + [R(0)] * NW)  # 4(h^3-1)/(3w) + 1
print("\n4(h³−1)/(3w) = −1 +", g[:4], " (the e^{-1} of the composition lemma)")
Eg = expser(g)

Ux  = compose(U[:NW + 1], xstar)
Uhx = compose(Uhat[:NW + 1], xstar)
den = add(h2, [R(-1)] + [R(0)] * NW)                  # h^2 - 1, starts at O(w)
Falpha = mul(mul(smul(R(-1, 3), h), Eg), inv(mul(mul(Ux, Ux), shift(den))))   # (w h)/(h^2-1) = h / ((h^2-1)/w)
# w*(...)/(h^2-1): both numerator and denominator start at O(w) -> a clean series
Fa = [Falpha[k] for k in range(NW + 1)]
Fd = mul(smul(R(2), mul(D, Eg)), mul(Uhx, inv(Ux)))

pa = [Fa[k] / Fa[0] for k in range(NW + 1)]
pd = [Fd[k] / Fd[0] for k in range(NW + 1)]
chi = R(-4, 3)
print("\nStokes prefactor ratio  F_D(0)/F_alpha(0) =", Fd[0] / Fa[0], "   (the factor 3 of Theorem A.7)")
print("\n r |        p_r (alpha*)        |        b_r = p_r chi^r        |        p_r (|I|max)        |        b_r'")
for r in range(0, 6):
    print(f" {r} | {str(pa[r]):>26} | {str(pa[r]*chi**r):>28} | {str(pd[r]):>26} | {str(pd[r]*chi**r):>26}")
print("\nprint's b_r for alpha*:  -7/9, -137/162, -10729/4374")
print("Fable's Richardson b_1' for |I|max:  -13/18 = ", float(R(-13, 18)))
print("\nb_1' - b_1 =", pd[1] * chi - pa[1] * chi, "   (Q32's 1/18)")
