# bf-r2-fock.py - round 2 (Opus): Q2 (Fock's constant, and what it really is), Q5 (the torus
# knot and its "caustic"), Q6 (the launch loss), Q1 (where the textbook T_rev marker is honest).
import math, cmath
import numpy as np
import sys
from scipy import special, integrate
from numpy.polynomial.legendre import leggauss
_p = print
def print(*a, **k):
    k['flush'] = True
    _p(*a, **k)

def R(n, l, r):
    rho = 2.0 * r / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * math.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)

def F_closed(n, l, p):
    x = (n * n * p * p - 1) / (n * n * p * p + 1)
    pref = math.sqrt(2 * math.factorial(n - l - 1) / (math.pi * math.factorial(n + l)))
    return (pref * n * n * 2 ** (2 * l + 2) * math.factorial(l) * (n * p) ** l
            / (n * n * p * p + 1) ** (l + 2) * special.eval_gegenbauer(n - l - 1, l + 1, x))

def Ychi(N, l, chi):
    norm = math.sqrt(2 ** (2 * l + 1) * (N + 1) * math.factorial(N - l) * math.factorial(l) ** 2
                     / (math.pi * math.factorial(N + l + 1)))
    return norm * math.sin(chi) ** l * special.eval_gegenbauer(N - l, l + 1, math.cos(chi))

print('=' * 100)
print("Q2 - FOCK'S CONSTANT.  The Jacobian of xi = (2 p0 p, p^2 - p0^2)/(p^2 + p0^2) is")
print('     dOmega_3 / d^3p = (2 p0 / (p0^2 + p^2))^3  (from p = p0 tan(chi/2)).  Check:')
for p0 in [1.0, 0.5, 1 / 3.0]:
    I, _ = integrate.quad(lambda p: (2 * p0 / (p0 ** 2 + p ** 2)) ** 3 * 4 * math.pi * p * p, 0, np.inf)
    print('     p0 = %.5f : int J d^3p = %.12f   vs vol(S^3) = 2 pi^2 = %.12f' % (p0, I, 2 * math.pi ** 2))
print()
print('     BUT the Fock weight is W(p) = 4 p0^{5/2} / (p0^2 + p^2)^2, NOT J^{1/2}.  Ratio:')
print('     n  l   p       W(p)          J^{1/2}       W / J^{1/2}     sqrt2 p0 / sqrt(p0^2+p^2)')
for (n, l) in [(1, 0), (2, 1), (3, 2)]:
    p0 = 1.0 / n
    for p in [0.0, 0.5 * p0, p0, 3 * p0]:
        W = 4 * p0 ** 2.5 / (p0 ** 2 + p ** 2) ** 2
        J = (2 * p0 / (p0 ** 2 + p ** 2)) ** 3
        print('     %d  %d  %.4f  %12.6f  %12.6f   %10.6f      %10.6f'
              % (n, l, p, W, math.sqrt(J), W / math.sqrt(J), math.sqrt(2) * p0 / math.sqrt(p0 ** 2 + p ** 2)))
print('     => W/J^{1/2} = sqrt2 p0 / sqrt(p0^2 + p^2) exactly, NOT 1.  The Fock map is not the')
print('        measure pullback: it is unitary L^2(R^3, w d^3p) -> L^2(S^3) with the STURMIAN weight')
print('           w(p) = (p^2 + p0^2) / (2 p0^2),   because W^2 = w * J  identically.')
print('     numerical: W^2/(J w) and the normalisations')
for (n, l) in [(1, 0), (2, 1), (3, 0), (3, 2), (5, 3), (6, 5)]:
    p0 = 1.0 / n
    chk = max(abs((4 * p0 ** 2.5 / (p0 ** 2 + p ** 2) ** 2) ** 2
                  / ((2 * p0 / (p0 ** 2 + p ** 2)) ** 3 * (p ** 2 + p0 ** 2) / (2 * p0 ** 2)) - 1)
              for p in [0.03, 0.2, p0, 2 * p0, 1.3, 4.0])
    nrm, _ = integrate.quad(lambda p: F_closed(n, l, p) ** 2 * p * p, 0, 300, limit=500)
    stu, _ = integrate.quad(lambda p: F_closed(n, l, p) ** 2 * p * p * (p * p + p0 * p0) / (2 * p0 ** 2),
                            0, 300, limit=500)
    p2, _ = integrate.quad(lambda p: F_closed(n, l, p) ** 2 * p ** 4, 0, 300, limit=500)
    print('     n=%d l=%d : max|W^2/(J w) - 1| = %.2e ; int|Phi|^2 d^3p = %.10f ; int|Phi|^2 w d^3p = %.10f ; <p^2> = %.10f = 1/n^2 = %.10f'
          % (n, l, chk, nrm, stu, p2, 1.0 / n ** 2))
print('     => BOTH integrals are 1, and they agree ONLY because of the virial theorem <p^2> = p0^2.')
print('     Q2 as asked (exact match of |Phi| to the hyperspherical harmonic) at (2,1,0),(3,2,1):')
for (n, l) in [(2, 1), (3, 2)]:
    p0 = 1.0 / n; worst = 0
    for p in [0.05, 0.2, p0, 1.7 * p0, 2.0]:
        chi = math.acos((p0 * p0 - p * p) / (p0 * p0 + p * p))
        fock = 4 * p0 ** 2.5 / (p0 * p0 + p * p) ** 2 * Ychi(n - 1, l, chi)
        worst = max(worst, abs(abs(fock) - abs(F_closed(n, l, p))))
    print('     (n,l) = (%d,%d): worst |Fock form| - |F_nl| = %.3e' % (n, l, worst))
print('     THE INSTRUMENT CONSEQUENCE: p0 = 1/n, so each SHELL sits on a sphere of a different')
print('     radius. A superposition across n has NO common Fock sphere - the same defect as the KS')
print('     oscillator (C7).  Fock radius p0 = 1/n and KS frequency omega = 1/(2n) = p0/2.')

print()
print('=' * 100)
print('Q5 - THE TORUS KNOT AND ITS "CAUSTIC".')
print('   (i) winding numbers.  E_n = -1/(2n^2) so E_1/E_2 = n_2^2/n_1^2; in LOWEST TERMS the')
print('       winding is (n_2^2, n_1^2)/gcd(n_1,n_2)^2.  Round 1 omitted the gcd:')
from math import gcd
for (a, b) in [(1, 2), (2, 3), (1, 3), (2, 4), (3, 6), (4, 6), (2, 6)]:
    g = gcd(a, b) ** 2
    print('       %ds + %ds : round 1 says %d:%d ; correct (lowest terms) %d:%d %s'
          % (a, b, b * b, a * a, b * b // g, a * a // g, '  <-- differs' if g > 1 else ''))
print('   (ii) the "caustic J = |u|^2 - |v|^2 = 0".  Under diagonal H the MODULI |c_a| are')
print('        constants of the motion, so J(t) = |c_1|^2 - |c_2|^2 is constant along the orbit.')
E1, E2 = -0.5, -0.125
for (w1, w2) in [(0.5, 0.5), (0.7, 0.3)]:
    c1 = math.sqrt(w1); c2 = math.sqrt(w2)
    ts = np.linspace(0, 400, 9)
    Js = [(abs(c1 * cmath.exp(-1j * E1 * t)) ** 2 - abs(c2 * cmath.exp(-1j * E2 * t)) ** 2) for t in ts]
    print('       |c1|^2=%.2f |c2|^2=%.2f : J(t) over t = 0..400  ->  %s  (spread %.2e)'
          % (w1, w2, np.round(Js, 12)[:5], float(np.ptp(Js))))
print('       => for EQUAL weights J == 0 on the WHOLE orbit, not on an envelope;')
print('          for unequal weights J == const != 0 and the set {J=0} is EMPTY.')
print('       REFUTED: {J = 0} is never the envelope of the Lissajous figure of a hydrogen pair.')
print('   (iii) the true envelope.  The orbit fills the 2-torus |c_1|,|c_2| = const; the')
print('       orthogonal projection to the (q_1,q_2) plane folds where sin(E_a t) = 0, giving the')
print('       RECTANGLE |q_1| <= sqrt2|c_1|, |q_2| <= sqrt2|c_2| (the lab uses q = sqrt2 Re c).')
c1 = c2 = 1 / math.sqrt(2)
ts = np.linspace(0, 6000, 400001)
q1 = math.sqrt(2) * c1 * np.cos(E1 * ts); q2 = math.sqrt(2) * c2 * np.cos(E2 * ts)
print('       1s + 2s equal weights: max|q1| = %.10f, max|q2| = %.10f, envelope |q1| = |q2| = 1'
      % (np.max(np.abs(q1)), np.max(np.abs(q2))))
print('       closure: E_1/E_2 = %.6f = 4/1, orbit closes after T = 2 pi / |E_2| = %.6f a.u.'
      % (E1 / E2, 2 * math.pi / abs(E2)))
d = abs(q1[0] - q1[int(2 * math.pi / abs(E2) / (6000 / 400000))]) if True else 0
print('       |q(T) - q(0)| = %.3e' % (abs(math.sqrt(2) * c1 * math.cos(E1 * 2 * math.pi / abs(E2)) - math.sqrt(2) * c1)
                                       + abs(math.sqrt(2) * c2 * math.cos(E2 * 2 * math.pi / abs(E2)) - math.sqrt(2) * c2)))

print()
print('=' * 100)
print('Q6 - THE LAUNCH LOSS.  Gaussian packet w = 2 a0 at r0 = 8 a0 with p0 = 0.3 a.u. along phi-hat.')
W_, R0, P0 = 2.0, 8.0, 0.3
NR, NT, NP = 400, 64, 96
rq, rw = leggauss(NR); rq = 0.5 * (rq + 1) * 50.0; rw = rw * 25.0
cq, cw = leggauss(NT); th = np.arccos(cq)
ph = 2 * math.pi * np.arange(NP) / NP; pw = 2 * math.pi / NP
Tg, Pg = np.meshgrid(th, ph, indexing='ij')
sT, cT = np.sin(Tg), np.cos(Tg)
# G(r, theta, phi) factorises as exp(-(r^2 + R0^2)/(2w^2)) * exp(r R0 sinT cosP / w^2) * exp(i P0 r sinT sinP)
angw = (cw[:, None] * pw) * np.ones_like(Pg)
Alm = {}
LMAX = 14
Yc = {}
for l in range(LMAX + 1):
    for m in range(-l, l + 1):
        Yc[(l, m)] = np.conj(special.sph_harm_y(l, m, Tg, Pg))
pref = (math.pi * W_ ** 2) ** (-0.75)
Gr = np.exp(-(rq ** 2 + R0 ** 2) / (2 * W_ ** 2))
for key in Yc:
    Alm[key] = np.zeros(NR, dtype=complex)
for i, r in enumerate(rq):
    ang = pref * Gr[i] * np.exp(r * R0 * sT * np.cos(Pg) / W_ ** 2) * np.exp(1j * P0 * r * sT * np.sin(Pg))
    wa = ang * angw
    for key, Yk in Yc.items():
        Alm[key][i] = np.sum(Yk * wa)
# quadrature check: int |G|^2 d^3x = sum_lm int |A_lm(r)|^2 r^2 dr
norm = sum(float(np.sum(np.abs(Alm[k]) ** 2 * rw * rq ** 2)) for k in Alm)
print('   quadrature check (Parseval over l <= %d): int |G|^2 d^3x = %.8f' % (LMAX, norm))
tot6 = tot15 = totNC = 0.0; rows = []
for n in range(1, 16):
    for l in range(0, min(n, LMAX + 1)):
        Rn = np.array([R(n, l, x) for x in rq])
        for m in range(-l, l + 1):
            c = float(np.sum(rw * rq ** 2 * Rn * Alm[(l, m)].real)) + 1j * float(np.sum(rw * rq ** 2 * Rn * Alm[(l, m)].imag))
            pr = abs(c) ** 2
            if n <= 6: tot6 += pr
            tot15 += pr
            if (n - l - 1) <= 5 and (l - abs(m)) <= 5: totNC += pr
            if pr > 0.004: rows.append((n, l, m, pr))
print('   sum_{n<=6}  |<nlm|G>|^2 = %.6f      (loss %.4f)' % (tot6, 1 - tot6))
print('   sum_{n<=15} |<nlm|G>|^2 = %.6f      (loss %.4f)' % (tot15, 1 - tot15))
print('   near-circular subset (n-l-1<=5, l-|m|<=5), n<=15: %.6f' % totNC)
print('   the largest single contributions:')
for r_ in sorted(rows, key=lambda z: -z[3])[:12]:
    print('      |%d %d %+d>  %.5f' % r_)
KE = 0.5 * (3.0 / (2 * W_ ** 2) + P0 ** 2)
PEint = 0.0
for i, r in enumerate(rq):
    ang = pref * Gr[i] * np.exp(r * R0 * sT * np.cos(Pg) / W_ ** 2)
    PEint += float(np.sum(np.abs(ang) ** 2 * angw)) * rw[i] * r ** 2 * (-1.0 / r)
print('   <T> = %.6f, <V> = %.6f, <H> = %+.6f a.u.  (a bound projection needs <H> < 0)' % (KE, PEint, KE + PEint))

print()
print('=' * 100)
print('Q1 - WHERE IS THE TEXTBOOK T_rev MARKER HONEST?   |t* - T_rev| < 0.01 T_rev.')
print('     x* = -4 sigma^2/nbar (T_cl units) and T_rev = (2 nbar/3) T_cl, so the criterion is')
print('        4 sigma^2/nbar < 0.01 * 2 nbar/3  <=>  sigma < nbar/sqrt(600) = nbar/24.495.')
print('     nbar   sigma_max (1%)   measured |x*|     0.01 T_rev/T_cl   verdict')
TWO_PI = 2 * math.pi
def xstar(nbar, sig):
    kmax = int(8 * sig) + 2
    ns = np.arange(nbar - kmax, nbar + kmax + 1); ns = ns[ns >= 1].astype(float)
    w = np.exp(-(ns - nbar) ** 2 / (2.0 * sig * sig)); p = w / w.sum()
    xs = np.linspace(-0.5, 0.5, 60001)
    ts = 4 * math.pi / 3 * nbar ** 4 + xs * TWO_PI * nbar ** 3
    v = np.abs(np.exp(1j * np.outer(ts, 1.0 / (2 * ns ** 2))) @ p)
    return xs[int(np.argmax(v))]
for (nbar, sig) in [(30, 1.0), (30, 1.2), (30, 2.0), (60, 2.0), (60, 2.4), (90, 3.0), (150, 6.0), (150, 8.0)]:
    lim = nbar / math.sqrt(600.0); xs_ = abs(xstar(nbar, sig)); thr = 0.01 * 2 * nbar / 3
    print('     %4d   %10.3f      %10.5f       %10.5f       %s'
          % (nbar, lim, xs_, thr, 'OK' if xs_ < thr else 'MARKER IS WRONG BY MORE THAN 1%'))
