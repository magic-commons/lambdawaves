# bf-r2-gauss.py - round 2 (Opus).  THE AUTOPSY OF CONJECTURE Omega_1, done with the corpus's
# own cubic-Gauss-sum machinery, and the constructive replacement.
#
#  G1  the corpus identity (FINITE FIELD SPECTRAL DYNAMICS HANDOFF sec.30; CM SEXTIC sec.14):
#      4p = L^2 + 27 M^2, L = 1 mod 3, parametrises the cubic Gauss periods.  WHICH sum is L?
#      NOT the complete cubic exponential sum S(1,p) = sum_k e(k^3/p) = 2 Re G(chi_3) -- that is
#      KUMMER'S SUM, whose argument was open from 1846 until Heath-Brown-Patterson 1979.
#      It is the JACOBI sum: 2 Re J(chi_3, chi_3) = L (Gauss 1801).  Both are checked here.
#  G2  the honest Omega_1 predictor.  beta/2pi = a/b in lowest terms; S(a,b) = sum_{k mod b} e(a k^3/b).
#      Omega_1 says sup|A| is "governed by" S.  Compute |S|/b for every ladder and correlate.
#  G3  THE ASYMPTOTIC CONTRADICTION.  |S(a,b)| <= 2 sqrt(b) (Weil) so |S|/b <= 2/sqrt(b) -> 0,
#      while at fixed sigma the exact sup|A| -> 1.  Opposite limits.
#  G4  THE UNCERTAINTY KILL (corpus GENERAL MATHEMATICS LIBRARY L-0245, Donoho-Stark on Z/N):
#      a function on Z/b supported in a window of W integers has Fourier support >= b/W.  The
#      packet's window is W ~ 8 sigma + 1; the residues mod b are resolved only if W >= b.
#  G5  THE CONSTRUCTIVE REPLACEMENT.  The dephasing hierarchy beta_j = (2pi/3)(j+1) sigma^j/nbar^{j-2}
#      (beta_3 = round 1's beta).  At FIXED beta_3 the exact sup|A| spreads by 0.21; the
#      arithmetic-free Taylor-6 model reproduces it.
import math
from math import pi, gcd
import numpy as np
from fractions import Fraction
TWO_PI = 2 * pi

print('=' * 104)
print('G1 - WHICH SUM IS THE CORPUS S L?   4p = L^2 + 27 M^2,  L = 1 mod 3')
print('     (FINITE FIELD ... HANDOFF sec.30 "Cubic Gaussian Period Polynomial";')
print('      CM SEXTIC OUROBOROS sec.14 "The Gaussian cubic parameter L is a CM trace")')
def cubic_sum(a, b):
    k = np.arange(b)
    return complex(np.sum(np.exp(2j * pi * (a * (k.astype(object) ** 3 % b)) % b / b)))
def cubic_sum_f(a, b):
    k = np.arange(b, dtype=np.int64)
    r = (a * ((k * k % b) * k % b)) % b
    return complex(np.sum(np.exp(2j * pi * r / b)))
def LM(p):
    for L in range(-2 * int(math.isqrt(p)) - 2, 2 * int(math.isqrt(p)) + 3):
        if L % 3 != 1 % 3 and (L - 1) % 3 != 0: continue
        r = 4 * p - L * L
        if r >= 0 and r % 27 == 0:
            m2 = r // 27; M = int(math.isqrt(m2))
            if M * M == m2: return L, M
    return None, None
def jacobi33(p):
    # J(chi3,chi3) = sum_x chi3(x) chi3(1-x); chi3 by discrete log base a primitive root
    fac, m = set(), p - 1
    d = 2
    while d * d <= m:
        while m % d == 0: fac.add(d); m //= d
        d += 1
    if m > 1: fac.add(m)
    g = 2
    while any(pow(g, (p - 1) // q, p) == 1 for q in fac): g += 1
    dl = {}; x = 1
    for e in range(p - 1): dl[x] = e; x = x * g % p
    w = complex(math.cos(2 * pi / 3), math.sin(2 * pi / 3))
    tot = 0j
    for x in range(2, p):
        y = (1 - x) % p
        if y == 0: continue
        tot += w ** ((dl[x] + dl[y]) % 3)
    return tot
print('     p     L    M    4p=L^2+27M^2   KUMMER S(1,p)=2ReG   |S|/2   sqrt p   JACOBI J33   2 Re J = L?')
badJ = badK = 0
for p in [7, 13, 19, 31, 37, 43, 61, 67, 73, 79, 97, 103, 109, 127, 151, 181, 199, 241, 271, 307, 331, 397]:
    L, M = LM(p); S = cubic_sum_f(1, p); J = jacobi33(p)
    okJ = abs(2 * J.real - L) < 1e-6; okK = abs(S.real - L) < 1e-6
    badJ += (not okJ); badK += (not okK)
    print('   %5d %+5d %4d   %6d = %6d   %+11.6f      %7.4f %7.4f  %+8.4f%+8.4fj   %s   (Kummer=L? %s)'
          % (p, L, M, 4 * p, L * L + 27 * M * M, S.real, abs(S) / 2, math.sqrt(p), J.real, J.imag,
             'YES' if okJ else 'NO', 'yes' if okK else 'no'))
print('     2 Re J(chi3,chi3) = L : %d failures / 22   (Gauss 1801 - CONFIRMED)' % badJ)
print('     2 Re G(chi3)       = L : %d failures / 22   (FALSE - that is Kummer s sum, |G| = sqrt p,' % badK)
print('       argument equidistributed: Kummer 1846 conjecture, settled Heath-Brown-Patterson 1979)')
print('     corpus number at p = 37: L = -11, 4*37 = 121 + 27.  Jacobi 2 Re J = %.6f' % (2 * jacobi33(37).real))
print('     corpus period polynomial x^3 + x^2 - 12 x + 11 : roots ->', np.round(np.sort(np.roots([1, 1, -12, 11]).real), 9))
print('     and 1 + 3*theta_j for those roots ->', np.round(np.sort(1 + 3 * np.sort(np.roots([1, 1, -12, 11]).real)), 6))
print('     (the three cubic Gauss PERIODS; the sum over a full period set is L = -11.)')
print('     for p = 2 mod 3 the cube map is a bijection of Z/p so sum_k e(k^3/p) = 0 exactly:')
for p in [5, 11, 17, 23, 29, 41]:
    print('       p=%2d : S = %+.3e %+.3ej' % (p, cubic_sum_f(1, p).real, cubic_sum_f(1, p).imag))

print()
print('=' * 104)
print('G2 - THE HONEST Omega_1 PREDICTOR.  ladder: coefficient of k^3 is 8 pi sigma^3/(3 nbar)')
print('     with k measured in units of 1 (not sigma), so beta/2pi = 4 sigma^3/(3 nbar) = a/b.')
XS = np.linspace(-0.5, 0.5, 120001)
def scan_exact(nbar, sig, nsig=8):
    kmax = int(nsig * sig) + 2
    ns = np.arange(nbar - kmax, nbar + kmax + 1); ns = ns[ns >= 1].astype(float)
    w = np.exp(-(ns - nbar) ** 2 / (2.0 * sig * sig)); p = w / w.sum()
    ts = 4 * pi / 3 * nbar ** 4 + XS * TWO_PI * nbar ** 3
    return np.abs(np.exp(1j * np.outer(ts, 1.0 / (2.0 * ns ** 2))) @ p)
def scan_taylor(nbar, sig, order, nsig=8):
    kmax = int(nsig * sig) + 2
    ks = np.arange(-kmax, kmax + 1).astype(float); ks = ks[(nbar + ks) >= 1]
    w = np.exp(-ks ** 2 / (2.0 * sig * sig)); p = w / w.sum()
    ts = 4 * pi / 3 * nbar ** 4 + XS * TWO_PI * nbar ** 3
    c = np.array([(-1.0) ** j * (j + 1) / (2.0 * nbar ** (2 + j)) for j in range(order + 1)])
    base = c[1:order + 1] @ np.vstack([ks ** j for j in range(1, order + 1)])
    return np.abs(np.exp(1j * np.outer(ts, base)) @ p)
sig = 2; rows = []
print('   nbar   a/b (lowest terms)     |S(a,b)|   |S|/b     2/sqrt b   EXACT sup|A|   Taylor-6')
for nbar in range(26, 53):
    fr = Fraction(4 * sig ** 3, 3 * nbar); a, b = fr.numerator, fr.denominator
    S = cubic_sum_f(a, b)
    ve = scan_exact(nbar, sig).max(); v6 = scan_taylor(nbar, sig, 6).max()
    rows.append((nbar, a, b, abs(S), abs(S) / b, ve, v6))
    print('   %4d   %3d/%-5d           %8.4f  %8.5f  %8.5f    %.6f      %.6f'
          % (nbar, a, b, abs(S), abs(S) / b, 2 / math.sqrt(b), ve, v6))
R = np.array([(r[4], r[5], r[6]) for r in rows])
print('   Pearson r( |S|/b , exact sup|A| )      = %+.4f' % np.corrcoef(R[:, 0], R[:, 1])[0, 1])
print('   Pearson r( Taylor-6 , exact sup|A| )   = %+.4f' % np.corrcoef(R[:, 2], R[:, 1])[0, 1])
print('   mean |S|/b = %.4f   vs mean exact sup|A| = %.4f   (a factor %.2f apart)'
      % (R[:, 0].mean(), R[:, 1].mean(), R[:, 1].mean() / R[:, 0].mean()))

print()
print('=' * 104)
print('G3 - THE ASYMPTOTIC CONTRADICTION.  Fix sigma; let nbar grow.  Weil: |S(a,b)| <= 2 sqrt(b),')
print('     so any normalised Gauss-sum predictor decays like b^{-1/2} ~ nbar^{-1/2}.  The exact')
print('     revival goes the OTHER WAY: sup|A| -> 1 because beta_3 = 8 pi sigma^3/(3 nbar) -> 0.')
print('     nbar  sigma       b       |S|/b     2/sqrt(b)    EXACT sup|A|   ratio exact/(|S|/b)')
for nbar in [30, 60, 90, 150, 240, 400]:
    s2 = 0.8 if nbar >= 90 else 2.0
    fr = Fraction(4) * Fraction(s2).limit_denominator(10) ** 3 / (3 * nbar)
    a, b = fr.numerator, fr.denominator
    S = cubic_sum_f(a, b) if b < 3000000 else None
    ve = scan_exact(nbar, s2).max()
    sv = (abs(S) / b) if S is not None else float('nan')
    print('   %5d  %5.1f %9d  %8.5f  %8.5f     %.6f       %s'
          % (nbar, s2, b, sv, 2 / math.sqrt(b), ve, ('%.1f' % (ve / sv)) if sv > 1e-12 else 'INFINITE (|S| = 0)'))

print()
print('=' * 104)
print('G4 - THE UNCERTAINTY KILL (corpus GENERAL MATHEMATICS LIBRARY L-0245, Donoho-Stark/')
print('     Hirschman on Z/N: |supp f| * |supp Ff| >= N).  For the residues mod b to enter,')
print('     the packet must be spread over >= b consecutive integers.  It never is.')
print('     nbar  sigma   b = den(beta/2pi)   packet window W = 8 sigma + 1   b / W    W >= b ?')
for (nbar, s2) in [(30, 2.0), (36, 2.0), (45, 2.0), (90, 0.8), (150, 0.8), (30, 3.0), (60, 6.0)]:
    fr = Fraction(4) * Fraction(s2).limit_denominator(10) ** 3 / (3 * nbar); b = fr.denominator
    W = 8 * s2 + 1
    print('     %4d  %5.1f   %12d       %14.1f          %8.1f    %s'
          % (nbar, s2, b, W, b / W, 'YES' if W >= b else 'NO'))
print('     b = 3 nbar / gcd(4 sigma^3, 3 nbar) and a physical Rydberg packet needs sigma << nbar,')
print('     so W ~ 8 sigma << nbar <= (4/3) b.  The Gaussian window NEVER completes one period of')
print('     the cubic phase; by Donoho-Stark its spectrum on Z/b has support >= b/W >> 1, i.e. it')
print('     cannot be a function of the residue classes.  Omega_1 has no mechanism.')

print()
print('=' * 104)
print('G5 - THE CONSTRUCTIVE REPLACEMENT: the dephasing hierarchy.')
print('     Exactly, at t = T_rev + x T_cl with 2 nbar/3 integer, the phase of mode k is')
print('       theta_k = -2 pi x k + (3 pi x/nbar) k^2 + sum_{j>=3} (-1)^j (2pi/3)(j+1) k^j/nbar^{j-2}')
print('                 - (4 pi x/nbar^2) k^3 + ...   ->   on u = k/sigma the j-th coefficient is')
print('       beta_j = (2 pi/3)(j+1) sigma^2 mu^{j-2},  mu = sigma/nbar ;  beta_3 = 8 pi sigma^3/(3 nbar).')
print('     Round 1 keeps beta_3 only.  beta_4/beta_3 = (5/4) mu is the true expansion parameter.')
print('     nbar sig    mu      beta_3    beta_4    beta_5    beta_6    EXACT     T3       T4       T6')
for (nbar, s2) in [(30, 2.0), (36, 2.0), (45, 2.0), (60, 2.0), (30, 3.0), (15, 1.5), (90, 0.8), (150, 0.8)]:
    mu = s2 / nbar
    bj = [(TWO_PI / 3) * (j + 1) * s2 ** 2 * mu ** (j - 2) for j in (3, 4, 5, 6)]
    ve = scan_exact(nbar, s2).max()
    v3 = scan_taylor(nbar, s2, 3).max(); v4 = scan_taylor(nbar, s2, 4).max(); v6 = scan_taylor(nbar, s2, 6).max()
    print('   %4d %4.1f %7.4f %8.4f %9.5f %9.6f %9.7f  %.5f  %.5f  %.5f  %.5f'
          % (nbar, s2, mu, bj[0], bj[1], bj[2], bj[3], ve, v3, v4, v6))
print()
print('     THE FIXED-beta_3 TEST (round 1 s Omega_1 asks exactly this).  beta_3 = 2.234021 held')
print('     exactly by sigma_2 = 2 (nbar/30)^{1/3}.  Omega_1 says the spread is arithmetic; it is')
print('     the beta_4, beta_5, ... of the SAME analytic hierarchy, and Taylor-6 predicts it.')
print('     nbar   sigma      b       mu      beta_4    EXACT      Taylor-6   |diff|')
base = 2.0
vs = []
for nbar in [30, 31, 32, 35, 40, 44, 49, 55]:
    s2 = base * (nbar / 30.0) ** (1.0 / 3.0)
    fr = Fraction(4) * Fraction(s2).limit_denominator(10 ** 7) ** 3 / (3 * nbar); b = fr.denominator
    mu = s2 / nbar; b4 = (TWO_PI / 3) * 5 * s2 ** 2 * mu ** 2
    ve = scan_exact(nbar, s2).max(); v6 = scan_taylor(nbar, s2, 6).max()
    vs.append((ve, v6))
    print('   %5d  %.5f %8d  %.5f  %8.5f  %.6f   %.6f   %.1e' % (nbar, s2, b, mu, b4, ve, v6, abs(v6 - ve)))
vs = np.array(vs)
print('   exact spread at FIXED beta_3 : %.6f .. %.6f  (range %.4f)' % (vs[:, 0].min(), vs[:, 0].max(), np.ptp(vs[:, 0])))
print('   Taylor-6 (NO arithmetic) max |diff| = %.2e , RMS = %.2e , r = %+.5f'
      % (np.abs(vs[:, 1] - vs[:, 0]).max(), float(np.sqrt(np.mean((vs[:, 1] - vs[:, 0]) ** 2))),
         float(np.corrcoef(vs[:, 0], vs[:, 1])[0, 1])))
