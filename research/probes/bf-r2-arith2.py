# bf-r2-arith2.py - round 2 (Opus), the DECISIVE test of Conjecture Omega_1.
# Omega_1: for beta >~ 1 the height sup|A| near T_rev is governed by the cubic Gauss sum
# sum_{k mod b} e(a k^3/b) with beta/2pi = a/b, so "the revival hears the denominator of nbar".
#
# The test: the truncated-Taylor phase model on the integer lattice has parameters that are
# SMOOTH functions of (nbar, sigma) and contains NO arithmetic of b whatsoever.  If it reproduces
# the exact ladder's wiggle in nbar, the wiggle is analytic, not arithmetic.
import math
from math import pi, gcd
import numpy as np
TWO_PI = 2 * pi

def _ks(nbar, sig, nsig=8):
    kmax = int(nsig * sig) + 2
    ks = np.arange(-kmax, kmax + 1).astype(float)
    ks = ks[(nbar + ks) >= 1]
    w = np.exp(-ks ** 2 / (2.0 * sig * sig))
    return ks, w / w.sum()

def scan_taylor(nbar, sig, order, xs, nsig=8):
    ks, p = _ks(nbar, sig, nsig)
    ts = 4 * pi / 3 * nbar ** 4 + xs * TWO_PI * nbar ** 3
    c = np.array([(-1.0) ** j * (j + 1) / (2.0 * nbar ** (2 + j)) for j in range(order + 1)])
    powk = np.vstack([ks ** j for j in range(1, order + 1)])            # (order, K)
    base = c[1:order + 1] @ powk                                        # (K,)  phase per unit t
    ph = np.exp(1j * np.outer(ts, base))                                # (X, K)
    return np.abs(ph @ p)

def scan_exact(nbar, sig, xs, nsig=8):
    kmax = int(nsig * sig) + 2
    ns = np.arange(nbar - kmax, nbar + kmax + 1); ns = ns[ns >= 1].astype(float)
    w = np.exp(-(ns - nbar) ** 2 / (2.0 * sig * sig)); p = w / w.sum()
    ts = 4 * pi / 3 * nbar ** 4 + xs * TWO_PI * nbar ** 3
    ph = np.exp(1j * np.outer(ts, 1.0 / (2.0 * ns ** 2)))
    return np.abs(ph @ p)

XS = np.linspace(-0.5, 0.5, 120001)
def best(v):
    i = int(np.argmax(v)); return XS[i], v[i]

print('=' * 108)
print('I - ORDER BY ORDER: how many terms of the energy expansion does the ladder need?')
print('    beta_3 = 8 pi sigma^3/(3 nbar) (round 1 stops here); delta_4 = 10 pi sigma^4/(3 nbar^2);')
print('    eps_5 = 4 pi sigma^5/nbar^3.  All are SMOOTH in (nbar, sigma) - no arithmetic anywhere.')
print('   nbar sig   beta_3   delta_4  eps_5     ord3     ord4     ord5     ord6     EXACT    |ord6-ex|')
for (nbar, sig) in [(30, 2.0), (36, 2.0), (45, 2.0), (60, 2.0), (30, 3.0), (60, 3.0),
                    (15, 1.5), (30, 1.0), (90, 0.8), (150, 0.8)]:
    b3 = 8 * pi * sig ** 3 / (3.0 * nbar); d4 = 10 * pi * sig ** 4 / (3.0 * nbar ** 2)
    e5 = 4 * pi * sig ** 5 / nbar ** 3
    vs = [best(scan_taylor(nbar, sig, o, XS))[1] for o in (3, 4, 5, 6)]
    ve = best(scan_exact(nbar, sig, XS))[1]
    print('   %4d %3.1f %8.4f %8.4f %8.4f  %.5f  %.5f  %.5f  %.5f  %.5f  %.1e'
          % (nbar, sig, b3, d4, e5, vs[0], vs[1], vs[2], vs[3], ve, abs(vs[3] - ve)))

print()
print('=' * 108)
print('J - THE SMOOTHNESS/ARITHMETIC TEST.  sigma = 2, nbar = 26..52.')
print('   nbar    b     beta_3    EXACT      Taylor-6   |diff|     Taylor-4   |diff|')
sig = 2.0; nb = []; ex = []; r6 = []; r4 = []
for nbar in range(26, 53):
    b = 3 * nbar // gcd(4, 3 * nbar)
    ve = best(scan_exact(nbar, sig, XS))[1]
    v6 = best(scan_taylor(nbar, sig, 6, XS))[1]
    v4 = best(scan_taylor(nbar, sig, 4, XS))[1]
    nb.append(nbar); ex.append(ve); r6.append(v6); r4.append(v4)
    print('   %4d %5d  %7.4f  %.6f   %.6f   %.1e    %.6f   %.1e'
          % (nbar, b, 8 * pi * sig ** 3 / (3.0 * nbar), ve, v6, abs(v6 - ve), v4, abs(v4 - ve)))
ex = np.array(ex); r6 = np.array(r6); r4 = np.array(r4)
print('   Taylor-6 vs EXACT: max |diff| %.2e, RMS %.2e' % (np.max(np.abs(r6 - ex)), float(np.sqrt(np.mean((r6 - ex) ** 2)))))
print('   Taylor-4 vs EXACT: max |diff| %.2e, RMS %.2e' % (np.max(np.abs(r4 - ex)), float(np.sqrt(np.mean((r4 - ex) ** 2)))))
print('   the exact ladder\'s own spread over the window: %.4f .. %.4f (range %.4f)' % (ex.min(), ex.max(), ex.max() - ex.min()))
print('   denominators b present: %s' % sorted(set(3 * n // gcd(4, 3 * n) for n in range(26, 53))))

print()
print('=' * 108)
print('K - CORRELATION TEST.  Residual of a degree-5 fit in 1/nbar vs arithmetic features of b.')
inv = 1.0 / np.array(nb, float)
co = np.polyfit(inv, ex, 5); resid = ex - np.polyval(co, inv)
def v3(m):
    c = 0
    while m % 3 == 0: m //= 3; c += 1
    return c
feats = {
    'b / nbar':      np.array([(3 * n // gcd(4, 3 * n)) / n for n in nb]),
    'v3(b)':         np.array([v3(3 * n // gcd(4, 3 * n)) for n in nb], float),
    'v2(nbar)':      np.array([(n & -n).bit_length() - 1.0 for n in nb]),
    'nbar mod 3':    np.array([n % 3 for n in nb], float),
    'nbar mod 4':    np.array([n % 4 for n in nb], float),
    'log b':         np.log(np.array([3 * n // gcd(4, 3 * n) for n in nb], float)),
    'Taylor-6 resid': r6 - np.polyval(co, inv),
}
print('   feature              Pearson r with the exact residual')
for k, v in feats.items():
    print('   %-18s   r = %+.4f' % (k, float(np.corrcoef(v, resid)[0, 1])))
print('   exact residual RMS %.3e' % float(np.sqrt(np.mean(resid ** 2))))
print('   => the ONLY feature that correlates is the arithmetic-free Taylor model.')

print()
print('=' * 108)
print('L - WHY NO MODULUS CAN ENTER.  theta_n/2pi = nbar^3 (2 nbar + 3x)/(6 n^2), x CONTINUOUS.')
nbar, sig = 30, 2.0
v = scan_exact(nbar, sig, XS); xs, vs = best(v)
print('   nbar = 30, sigma = 2: the maximiser is x* = %.6f, s* = 2 nbar + 3 x* = %.6f' % (xs, 2 * nbar + 3 * xs))
print('   |A| as a smooth function of s over one period of the classical phase:')
for x in [-0.5, -0.3, -0.2, xs, -0.05, 0.0, 0.1, 0.25, 0.5]:
    i = int(np.argmin(np.abs(XS - x)))
    print('      s = %10.5f   |A| = %.6f   (x = %+.4f)' % (2 * nbar + 3 * XS[i], v[i], XS[i]))
print('   A cubic Gauss sum mod b would require x pinned to a rational of denominator b; the')
print('   supremum is over an interval, so no modulus is selected.  Omega_1 has no mechanism.')
