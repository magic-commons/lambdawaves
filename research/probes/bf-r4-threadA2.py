# bf-r4-threadA2.py — Round 4 (Opus).  (A) Theorem A2's alias law, attacked.  (B) Q20: the comb bound by Weil.
import math, cmath
import numpy as np
import mpmath as mp
mp.mp.dps = 30
np.seterr(all='ignore')

# ---------- (A) Theorem A2: the alias weights Delta n_j = sqrt(n bar j)/2, weight e^{-n bar j / 8 sigma^2} ----------
def I(alpha, beta):
    """(1/sqrt(2pi)) int e^{-u^2/2} e^{i(alpha u + beta u^3)} du, in exact Airy form."""
    a, b = mp.mpf(alpha), mp.mpf(beta)
    z = (a + 1 / (12 * b)) * (3 * b) ** mp.mpf(-1) / (3 * b) ** mp.mpf(-2) / 0 if False else None
    z = (a + 1 / (12 * b)) / (3 * b) ** (mp.mpf(1) / 3)
    return mp.sqrt(2 * mp.pi) * (3 * b) ** (-mp.mpf(1) / 3) * mp.e ** (a / (6 * b) + 1 / (108 * b ** 2)) * mp.airyai(z)
def ladder(nbar, sigma, xs=None):
    ks = np.arange(-int(12 * sigma), int(12 * sigma) + 1)
    p = np.exp(-ks ** 2 / (2 * sigma ** 2)); p /= p.sum()
    n = nbar + ks
    if xs is None: xs = np.linspace(-0.5, 0.5, 200001)
    Trev = 4 * math.pi * nbar ** 4 / 3; Tcl = 2 * math.pi * nbar ** 3
    best = 0.0; bx = 0.0
    for x in xs:
        t = Trev + x * Tcl
        A = np.abs(np.sum(p * np.exp(-1j * (-0.5 / n ** 2) * t)))
        if A > best: best, bx = A, x
    return best, bx
print('=' * 96)
print('(A) Theorem A2 — the Poisson-Airy alias law, tested where Round 3 did not: at FIXED beta_3, varying sigma.')
print('  A2 predicts  Delta n_j = sqrt(nbar j)/2 (independent of sigma) and alias weight a = e^{-nbar/(8 sigma^2)},')
print('  so the alias structure depends on (beta_3, s) with s = sigma/sqrt(nbar).  beta_3 = 8 pi sigma^3/(3 nbar).')
print('   nbar   sigma   beta_3    s      |I_0|      |I_1|/|I_0|   pred a=e^{-nbar/8sig^2}   ladder max   Poisson sum')
rows = [(30, 2.0), (24, 2.0), (60, 2.0), (150, 2.0), (30, 3.0), (120, 4.0), (240, 4.0), (15, 1.5)]
for nbar, sigma in rows:
    b3 = 8 * math.pi * sigma ** 3 / (3 * nbar)
    terms = [abs(I(2 * math.pi * sigma * (0 - j), b3)) for j in range(-2, 7)]
    Z = np.exp(-np.arange(-int(12 * sigma), int(12 * sigma) + 1) ** 2 / (2 * sigma ** 2)).sum()
    # the Poisson sum at the optimal x, scanned
    bestP = 0.0
    for x in np.linspace(-0.6, 0.6, 4001):
        S = sum(I(2 * math.pi * sigma * (x - j), b3) for j in range(-3, 9))
        v = abs(sigma * math.sqrt(2 * math.pi) / Z * S)
        bestP = max(bestP, v)
    I0 = abs(I(0.0, b3)); I1 = abs(I(2 * math.pi * sigma * (-1), b3))
    lm, lx = ladder(nbar, sigma, np.linspace(-0.6, 0.6, 40001))
    print(f'  {nbar:5d}  {sigma:5.2f}  {b3:7.3f}  {sigma/math.sqrt(nbar):5.3f}  {I0:9.6f}   {I1/I0:9.6f}    '
          f'{math.exp(-nbar/(8*sigma**2)):14.6e}    {lm:9.6f}    {bestP:9.6f}')
print('  the alias-weight prediction is e^{-nbar j/8 sigma^2}; the MEASURED |I_1|/|I_0| is the Airy ratio, not that')
print('  Gaussian — A2\'s "weight" is the population at Delta n_1, NOT the alias amplitude.  Both are printed above.')

# ---------- (B) Q20: the comb, Weil, and whether b = 5 is the worst denominator ----------
print()
print('=' * 96)
print('(B) Q20 — the arithmetic comb: exact peak heights, the Weil bound, and the worst denominator')
d, sig = 30, 60
ms = np.arange(-8, 9)
p = np.exp(-(ms * d) ** 2 / (2 * sig ** 2)); p /= p.sum()
print(f'  teeth m = -8..8 at spacing d = {d}, Gaussian sigma = {sig}: weights p_m/p_0 = '
      f'{[round(float(x),4) for x in (p/p[8])[8:13]]} ...')
def peak(a, b, weights, ms):
    best = 0.0
    for x in np.linspace(0, 1, 20001):
        v = abs(np.sum(weights * np.exp(2j * np.pi * ((a * ms ** 3) % b / b + x * ms))))
        best = max(best, v)
    return best
print('  nbar    4d^3/3nbar    a/b      exact peak    Round 3      complete cubic sum |S(a,b)|   Weil 2 sqrt b')
tab = [(36000, 1, 1), (24000, 3, 2), (27000, 4, 3), (32400, 10, 9), (40500, 8, 9), (34000, 18, 17),
       (45000, 4, 5), (30000, 6, 5)]
r3 = {36000: 0.966, 24000: 0.938, 27000: 0.932, 32400: 0.811, 40500: 0.819, 34000: 0.821, 45000: 0.729, 30000: 0.760}
for nbar, a, b in tab:
    pk = peak(a, b, p, ms)
    S = abs(sum(cmath.exp(2j * math.pi * a * x ** 3 / b) for x in range(b)))
    print(f'  {nbar:6d}   {4*d**3}/{3*nbar}   {a:2d}/{b:2d}    {pk:9.6f}     {r3[nbar]:.3f}      {S:12.6f}'
          f'            {2*math.sqrt(b):8.4f}')
print('  now the worst denominator at fixed (d, sigma): scan every reduced a/b with b <= 40')
worst = []
for b in range(1, 41):
    for a in range(1, b + 1):
        if math.gcd(a, b) != 1 and b != 1: continue
        worst.append((peak(a, b, p, ms), a, b))
worst.sort()
print('   the ten LOWEST peaks (the packets that hear the arithmetic most):')
for pk, a, b in worst[:10]:
    S = abs(sum(cmath.exp(2j * math.pi * a * x ** 3 / b) for x in range(b)))
    print(f'    a/b = {a:2d}/{b:2d}   peak = {pk:.6f}   |complete cubic sum| = {S:9.5f}   2 sqrt b = {2*math.sqrt(b):7.4f}')
print('   the ten HIGHEST peaks (the deaf packets):')
for pk, a, b in worst[-10:]:
    print(f'    a/b = {a:2d}/{b:2d}   peak = {pk:.6f}')
print('  Fermat check: b | 6 gives m^3 = m mod b for every m, so the cubic is affine and the peak is 1.')
for b in (1, 2, 3, 6):
    print(f'    b = {b}: max over a of the peak = {max(peak(a,b,p,ms) for a in range(1,b+1)):.8f}')
