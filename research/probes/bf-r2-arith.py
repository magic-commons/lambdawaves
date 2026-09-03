# bf-r2-arith.py - BEYOND THE FRONTIER (lambdaWAVES) round 2 (Opus), thread Q8 / Conjecture Omega_1.
# Is the Rydberg revival "arithmetic"?  Round 1 conjectures that for beta >~ 1 the height
# sup|A| near T_rev is governed by the cubic Gauss sum sum_{k mod b} e(a k^3 / b), beta/2pi = a/b.
#
# What is computed here:
#   A  the EXACT phase law.  theta_n(t)/2pi = nbar^3 (2 nbar + 3x) / (6 n^2)  at t = T_rev + x T_cl.
#      Hence at t = 4 pi Q (Q integer) the ladder amplitude is EXACTLY  A = sum_n p_n e(Q/n^2).
#   B  the denominator b of beta/2pi = 4/(3 nbar): b = 3 nbar / gcd(4, 3 nbar) >= 3 nbar / 4 * 3.
#      Does the Gaussian packet ever SAMPLE the residues mod b?  (sigma vs b)
#   C  model ladder: exact vs cubic-truncated vs cubic+quartic vs continuum.  Which explains 0.806?
#   D  POISSON-AIRY law: A_cubic(alpha) = sum_m I(alpha - 2 pi m sigma, beta) / sum_m e^{-2 pi^2 m^2 sigma^2}
#      with I the exact Airy closed form of bf-r2-airy.py.  This replaces the Gauss-sum story.
#   E  the smoothness scan: |A|max vs nbar at fixed sigma.  Arithmetic would make it JUMP with b.
#   F  the Omega_1 falsifier: two ladders with equal beta and (near-)coprime b.
#   G  predictions for (nbar,sigma) = (30,3) and (36,2), demanded by Q8.
import math, cmath
from math import gcd, pi
import numpy as np
import functools
print = functools.partial(__builtins__.print, flush=True) if hasattr(__builtins__,'print') else print

TWO_PI = 2 * pi

# ---------- exact ladder ----------
def packet(nbar, sig, nsig=8):
    kmax = int(nsig * sig) + 2
    ns = np.arange(nbar - kmax, nbar + kmax + 1)
    ns = ns[ns >= 1]
    w = np.exp(-(ns - nbar) ** 2 / (2.0 * sig * sig))
    return ns.astype(float), w / w.sum()

def A_exact(ns, p, t):
    return abs(np.sum(p * np.exp(1j * t / (2.0 * ns ** 2))))

def scan_exact(nbar, sig, xlo=-0.5, xhi=0.5, N=200001):
    ns, p = packet(nbar, sig)
    Tcl = TWO_PI * nbar ** 3; Trev = 4 * pi / 3 * nbar ** 4
    xs = np.linspace(xlo, xhi, N)
    ts = Trev + xs * Tcl
    # vectorised
    ph = np.exp(1j * np.outer(ts, 1.0 / (2.0 * ns ** 2)))
    vals = np.abs(ph @ p)
    i = int(np.argmax(vals))
    return xs[i], vals[i], vals

# ---------- truncated polynomial models on the integer lattice ----------
def A_poly(nbar, sig, x, order):
    """order = 3 (cubic) or 4 (cubic+quartic) or 5; phase from the Taylor expansion of t/(2n^2)."""
    kmax = int(8 * sig) + 2
    ks = np.arange(-kmax, kmax + 1)
    ks = ks[(nbar + ks) >= 1]
    w = np.exp(-ks ** 2 / (2.0 * sig * sig)); p = w / w.sum()
    th = -TWO_PI * x * ks + (3 * pi * x / nbar) * ks ** 2 - (8 * pi / (3.0 * nbar)) * ks ** 3 \
         - (4 * pi * x / nbar ** 2) * ks ** 3
    if order >= 4: th = th + (10 * pi / 3.0) * ks ** 4 / nbar ** 2
    if order >= 5: th = th - (4 * pi) * ks ** 5 / nbar ** 3
    return abs(np.sum(p * np.exp(1j * th)))

def best_poly(nbar, sig, order, N=40001):
    xs = np.linspace(-0.5, 0.5, N)
    v = np.array([A_poly(nbar, sig, x, order) for x in xs])
    i = int(np.argmax(v)); return xs[i], v[i]

# ---------- continuum + Poisson-Airy ----------
from scipy import special as _sp
def I_airy(a, b):
    """(1/sqrt 2pi) int e^{-u^2/2} e^{i(a u + b u^3)} du, exact closed form (real).
    float64 is safe for beta >~ 0.02 (lambda^3/3 <= 12); Ai is evaluated in scaled form."""
    k = (3.0 * b) ** (-1.0 / 3.0); L = 3.0 ** (1.0 / 3.0) / (6.0 * b ** (2.0 / 3.0))
    z = k * (a + 1.0 / (12.0 * b))
    if z > 0.0:                      # use the scaled Airy to avoid overflow x underflow
        aie = _sp.airye(z)[0]        # Ai(z) e^{+2/3 z^{3/2}}
        ex = L * z - L ** 3 / 3.0 - (2.0 / 3.0) * z ** 1.5
        return math.sqrt(2 * pi) * k * math.exp(ex) * aie
    return math.sqrt(2 * pi) * k * math.exp(L * z - L ** 3 / 3.0) * _sp.airy(z)[0]

def I_airy_vec(alphas, b):
    k = (3.0 * b) ** (-1.0 / 3.0); L = 3.0 ** (1.0 / 3.0) / (6.0 * b ** (2.0 / 3.0))
    z = k * (np.asarray(alphas) + 1.0 / (12.0 * b))
    out = np.empty_like(z)
    pos = z > 0
    if pos.any():
        out[pos] = np.sqrt(2*pi)*k*np.exp(L*z[pos] - L**3/3.0 - (2.0/3.0)*z[pos]**1.5)*_sp.airye(z[pos])[0]
    if (~pos).any():
        out[~pos] = np.sqrt(2*pi)*k*np.exp(L*z[~pos] - L**3/3.0)*_sp.airy(z[~pos])[0]
    return out

def poisson_airy(alpha, beta, sigma, M=4):
    num = sum(I_airy(alpha - TWO_PI * m * sigma, beta) for m in range(-M, M + 1))
    den = sum(math.exp(-2 * pi * pi * m * m * sigma * sigma) for m in range(-M, M + 1))
    return num / den

def best_poisson(nbar, sig, N=20001, M=4):
    beta = 8 * pi * sig ** 3 / (3.0 * nbar)
    xs = np.linspace(-0.5, 0.5, N); al = TWO_PI * xs * sig
    num = np.zeros_like(al)
    for m in range(-M, M + 1): num = num + I_airy_vec(al - TWO_PI * m * sig, beta)
    den = sum(math.exp(-2 * pi * pi * m * m * sig * sig) for m in range(-M, M + 1))
    v = np.abs(num / den); i = int(np.argmax(v)); return xs[i], v[i]

def best_continuum(nbar, sig, N=20001):
    beta = 8 * pi * sig ** 3 / (3.0 * nbar)
    xs = np.linspace(-0.5, 0.5, N)
    v = np.abs(I_airy_vec(TWO_PI * xs * sig, beta)); i = int(np.argmax(v)); return xs[i], v[i]

print('=' * 100)
print('A - THE EXACT PHASE LAW.  theta_n / 2pi = nbar^3 (2 nbar + 3x) / (6 n^2)   at t = T_rev + x T_cl')
print('    check against the direct exponential, and the t = 4 pi Q rational form')
for (nbar, sig, x) in [(30, 2.0, 0.0), (30, 2.0, -0.113), (15, 1.5, 0.25), (36, 2.0, 0.0)]:
    ns, p = packet(nbar, sig)
    Tcl = TWO_PI * nbar ** 3; Trev = 4 * pi / 3 * nbar ** 4; t = Trev + x * Tcl
    direct = abs(np.sum(p * np.exp(1j * t / (2 * ns ** 2))))
    law = abs(np.sum(p * np.exp(2j * pi * nbar ** 3 * (2 * nbar + 3 * x) / (6 * ns ** 2))))
    print('   nbar=%3d sig=%.1f x=%+.3f : direct %.12f  phase-law %.12f  diff %.2e'
          % (nbar, sig, x, direct, law, abs(direct - law)))
print('   at x = 0 and 3 | nbar:  Q = nbar^4/3 is an INTEGER and A(T_rev) = sum_n p_n e(Q/n^2) exactly')
for nbar in [15, 30, 36, 45]:
    Q = nbar ** 4 // 3
    ns, p = packet(nbar, 2.0)
    v1 = abs(np.sum(p * np.exp(1j * (4 * pi * Q) / (2 * ns ** 2))))
    fr = np.array([(Q % int(n ** 2)) / (n ** 2) for n in ns])
    v2 = abs(np.sum(p * np.exp(2j * pi * fr)))
    zero = [int(n) for n in ns if Q % int(n ** 2) == 0]
    print('   nbar=%2d  Q = nbar^4/3 = %-10d |A| %.12f vs residue form %.12f ; in-phase modes n^2 | Q : %s'
          % (nbar, Q, v1, v2, zero))

print()
print('=' * 100)
print('B - DOES THE PACKET EVER SAMPLE THE CUBIC RESIDUES mod b?   beta/2pi = 4/(3 nbar) = a/b')
print('   nbar    a/b (lowest terms)      b        b/nbar    sigma needed (>~ b)   sigma allowed (<< nbar)')
for nbar in [15, 21, 30, 31, 32, 36, 45, 60, 90, 150]:
    g = gcd(4, 3 * nbar); a, b = 4 // g, 3 * nbar // g
    print('   %4d    %2d/%-6d          %6d   %6.2f    sigma >= %6d          sigma <= ~%4.1f'
          % (nbar, a, b, b, b / nbar, b, nbar / 5.0))
print('   => b >= 3 nbar / 4 * ... in fact b = 3 nbar / gcd(4, 3 nbar) in {3 nbar, 3 nbar/2, 3 nbar/4}')
print('   => b / nbar in {0.75, 1.5, 3}. A Rydberg packet needs sigma << nbar, so sigma << b ALWAYS.')
print('   Also: 3 | b for every nbar (gcd(4, 3 nbar) is never divisible by 3), so two ladders can')
print('   never have COPRIME denominators - the falsifier of Omega_1 as stated is unsatisfiable.')

print()
print('=' * 100)
print('C - WHICH MODEL REPRODUCES THE LADDER?   sup |A| over |x| <= 1/2')
print('   nbar  sig   beta     EXACT            cubic-lattice     +quartic          continuum(Airy)   Poisson-Airy')
rows = []
for (nbar, sig) in [(30, 2.0), (45, 2.0), (30, 3.0), (36, 2.0), (60, 2.0), (90, 0.8), (150, 0.8),
                    (15, 1.5), (60, 3.0), (30, 1.0)]:
    beta = 8 * pi * sig ** 3 / (3.0 * nbar)
    xe, ve, _ = scan_exact(nbar, sig)
    x3, v3 = best_poly(nbar, sig, 3)
    x4, v4 = best_poly(nbar, sig, 4)
    xc, vc = best_continuum(nbar, sig)
    xp, vp = best_poisson(nbar, sig)
    rows.append((nbar, sig, beta, xe, ve, v3, v4, vc, vp))
    print('   %4d %4.1f %7.4f  %.5f@%+.4f  %.5f@%+.4f  %.5f@%+.4f  %.5f@%+.4f  %.5f@%+.4f'
          % (nbar, sig, beta, ve, xe, v3, x3, v4, x4, vc, xc, vp, xp))

print()
print('=' * 100)
print('D - THE POISSON IMAGES.  A_cubic(alpha) = sum_m I(alpha - 2 pi m sigma, beta) / theta-norm')
print('   the m != 0 terms ARE the ladder excess over the continuum.  Their size:')
for (nbar, sig) in [(30, 2.0), (45, 2.0), (30, 3.0), (36, 2.0)]:
    beta = 8 * pi * sig ** 3 / (3.0 * nbar)
    xp, vp = best_poisson(nbar, sig)
    a0 = TWO_PI * xp * sig
    terms = [(m, I_airy(a0 - TWO_PI * m * sig, beta)) for m in range(-2, 3)]
    s = ', '.join('m=%+d: %+.5f' % t for t in terms)
    print('   nbar=%3d sig=%.1f beta=%.4f at x*=%+.4f -> %s   sum %.5f' % (nbar, sig, beta, xp, s, sum(t[1] for t in terms)))

print()
print('=' * 100)
print('E - THE SMOOTHNESS SCAN (the kill).  sup|A| vs nbar at FIXED sigma = 2.0.')
print('   Omega_1 predicts jumps with the denominator b; the Poisson-Airy law predicts a smooth')
print('   function of beta = 8 pi sigma^3/(3 nbar) alone.')
print('   nbar   b      beta      sup|A| exact   Poisson-Airy   diff      |A| interp. in 1/nbar (resid)')
sig = 2.0
data = []
for nbar in range(26, 49):
    g = gcd(4, 3 * nbar); b = 3 * nbar // g
    beta = 8 * pi * sig ** 3 / (3.0 * nbar)
    xe, ve, _ = scan_exact(nbar, sig, N=60001)
    xp, vp = best_poisson(nbar, sig, N=2001)
    data.append((nbar, b, beta, ve, vp))
inv = np.array([1.0 / d[0] for d in data]); vals = np.array([d[3] for d in data])
co = np.polyfit(inv, vals, 4); fit = np.polyval(co, inv)
for (d, f) in zip(data, fit):
    print('   %4d %6d  %7.4f   %.6f      %.6f    %+.4f    resid %+.2e'
          % (d[0], d[1], d[2], d[3], d[4], d[4] - d[3], f - d[3]))
print('   RMS residual of a degree-4 polynomial in 1/nbar: %.3e  (max |resid| %.3e)'
      % (float(np.sqrt(np.mean((fit - vals) ** 2))), float(np.max(np.abs(fit - vals)))))

print()
print('=' * 100)
print('F - THE OMEGA_1 FALSIFIER.  Equal beta, different (nbar, b).  beta = 8 pi sigma^3/(3 nbar)')
print('   pick nbar_2 and sigma_2 = sigma_1 (nbar_2/nbar_1)^(1/3) so beta matches exactly.')
print('   nbar   sigma      b     gcd(b,b1)   beta        sup|A| exact   Poisson-Airy')
base = (30, 2.0); beta0 = 8 * pi * base[1] ** 3 / (3.0 * base[0])
g0 = gcd(4, 3 * base[0]); b0 = 3 * base[0] // g0
for nbar in [30, 31, 32, 35, 40, 44, 49, 55]:
    s2 = base[1] * (nbar / base[0]) ** (1.0 / 3.0)
    g = gcd(4, 3 * nbar); b = 3 * nbar // g
    beta = 8 * pi * s2 ** 3 / (3.0 * nbar)
    xe, ve, _ = scan_exact(nbar, s2, N=60001)
    xp, vp = best_poisson(nbar, s2, N=2001)
    print('   %4d  %.5f  %6d   %5d      %.6f    %.6f       %.6f' % (nbar, s2, b, gcd(b, b0), beta, ve, vp))

print()
print('=' * 100)
print('G - THE PREDICTIONS Q8 DEMANDS')
for (nbar, sig) in [(30, 3.0), (36, 2.0), (30, 2.0)]:
    beta = 8 * pi * sig ** 3 / (3.0 * nbar)
    xe, ve, _ = scan_exact(nbar, sig, N=400001)
    xp, vp = best_poisson(nbar, sig, N=8001)
    xc, vc = best_continuum(nbar, sig, N=8001)
    print('   nbar=%2d sigma=%.1f  beta=%.4f :  EXACT sup|A| = %.6f at x = %+.5f'
          % (nbar, sig, beta, ve, xe))
    print('        Poisson-Airy prediction %.6f at x = %+.5f  (error %+.2e) ; bare continuum %.6f'
          % (vp, xp, vp - ve, vc))

print()
print('=' * 100)
print('H - THE EXACT REVIVAL.  |A| = 1 exactly at T = 4 pi L^2, L = lcm{n : n in supp p}.')
for (nbar, sig) in [(5, 1.0), (6, 0.6)]:
    ns, p = packet(nbar, sig, nsig=2)
    ints = [int(n) for n in ns]
    L = 1
    for n in ints: L = L * n // gcd(L, n)
    T = 4 * pi * L * L
    print('   nbar=%d sig=%.1f  support %s  L = lcm = %d  T_exact = 4 pi L^2 = %.6e'
          % (nbar, sig, ints, L, T))
    print('        |A(T_exact)| = %.15f   (T_exact / T_rev = %.4e)'
          % (A_exact(ns, p, T), T / (4 * pi / 3 * nbar ** 4)))
