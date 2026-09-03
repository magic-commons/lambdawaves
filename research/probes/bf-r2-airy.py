# bf-r2-airy.py - BEYOND THE FRONTIER (lambdaWAVES) round 2 (Opus), thread Q7.
# The continuum revival model I(a,b) = (1/sqrt(2pi)) int e^{-u^2/2} e^{i(a u + b u^3)} du
#   (1) I is REAL (odd phase, even weight) - so no modulus is needed.
#   (2) CLOSED FORM by completing the cube:
#       I = sqrt(2pi) kap e^{-lam^3/3} e^{lam z} Ai(z),
#       z = kap (a + 1/(12b)), kap = (3b)^{-1/3}, lam = 3^{1/3}/(6 b^{2/3}).
#       The Airy argument is REAL for real (a,b) - not complex.
#   (3) EXACT stationarity: d/dz [e^{lam z} Ai(z)] = 0  <=>  -Ai'(z)/Ai(z) = lam.
#   (4) series: a* = -3b + C3 b^3 + ... (round 1 claims 99/2 = 49.5); |I|max = 1 - 3b^2 + ...
#   (5) global-max uniqueness: does the principal lobe always win?
#   (6) radius of convergence of a*(b): complex degeneracy F = lam, F' = 0.
from mpmath import mp, mpf, mpc, airyai, quad, exp, sqrt, pi, findroot, cos
mp.dps = 40

def I_num(a, b):
    f = lambda u: exp(-u * u / 2) * cos(a * u + b * u ** 3)
    return quad(f, [-mp.inf, 0, mp.inf]) / sqrt(2 * pi)

def kappa(b): return (3 * b) ** (-mpf(1) / 3)
def lam(b):   return mpf(3) ** (mpf(1) / 3) / (6 * b ** (mpf(2) / 3))

def I_closed(a, b):
    k = kappa(b); L = lam(b)
    z = k * (a + 1 / (12 * b))
    return sqrt(2 * pi) * k * exp(-L ** 3 / 3) * exp(L * z) * airyai(z)

print('=== (1)(2) CLOSED FORM vs QUADRATURE   (mp.dps = %d) ===' % mp.dps)
print('    beta     alpha       I(quad)                  I(closed)                rel diff')
for b in [mpf('0.02'), mpf('0.1'), mpf('0.5'), mpf(1), mpf('2.234'), mpf(5)]:
    for a in [mpf(0), mpf('-0.3'), mpf('1.7'), -3 * b]:
        q = I_num(a, b); c = I_closed(a, b)
        print('  %7s %9s  %+.18f  %+.18f  %.2e'
              % (mp.nstr(b, 5), mp.nstr(a, 4), q, c, abs(q - c) / max(abs(q), mpf('1e-40'))))

print()
print("=== (3) EXACT MAXIMISER via -Ai'(z)/Ai(z) = lambda ===")
def zstar(b):
    L = lam(b)
    seed = L * L - 1 / (2 * L) if L > mpf('0.9') else mpf('-0.5')
    g = lambda z: airyai(z, derivative=1) / airyai(z) + L
    return findroot(g, seed)
def astar(b): return zstar(b) / kappa(b) - 1 / (12 * b)
def Imax(b):
    a = astar(b); return I_closed(a, b), a

print('    beta      alpha*(exact)        alpha*/(-3beta)      |I|max               1-|I|max')
for b in ['0.001', '0.002', '0.005', '0.01', '0.02', '0.05', '0.1', '0.2', '0.3',
          '0.5', '0.75', '1', '1.5', '2', '2.234', '3', '5', '10']:
    b = mpf(b); v, a = Imax(b)
    print('  %8s %+.14f  %.14f  %.14f  %.6e' % (mp.nstr(b, 6), a, a / (-3 * b), v, 1 - v))

print()
print('=== (4) SERIES COEFFICIENTS by Richardson extraction from the exact curve ===')
def ratio_def(b): return 1 - astar(b) / (-3 * b)     # = C b^2 - D b^4 + ...
def defect(b):    return 1 - Imax(b)[0]              # = A2 b^2 + A4 b^4 + ...
bs = [mpf('0.02') / 2 ** k for k in range(7)]
print("  alpha*/( -3b) = 1 - C b^2 + D b^4 :")
for i in range(len(bs) - 1):
    b1, b2 = bs[i], bs[i + 1]
    r1, r2 = ratio_def(b1), ratio_def(b2)
    C = (r1 * b2 ** 4 - r2 * b1 ** 4) / (b1 ** 2 * b2 ** 4 - b2 ** 2 * b1 ** 4)
    D = -(r1 * b2 ** 2 - r2 * b1 ** 2) / (b1 ** 4 * b2 ** 2 - b2 ** 4 * b1 ** 2)
    print('    b = %-9s %-9s  C = %.12f   D = %.6f' % (mp.nstr(b1, 4), mp.nstr(b2, 4), C, D))
print("  1 - |I|max = A2 b^2 + A4 b^4 :")
for i in range(len(bs) - 1):
    b1, b2 = bs[i], bs[i + 1]
    d1, d2 = defect(b1), defect(b2)
    A2 = (d1 * b2 ** 4 - d2 * b1 ** 4) / (b1 ** 2 * b2 ** 4 - b2 ** 2 * b1 ** 4)
    A4 = (d1 * b2 ** 2 - d2 * b1 ** 2) / (b1 ** 4 * b2 ** 2 - b2 ** 4 * b1 ** 2)
    print('    b = %-9s %-9s  A2 = %.12f  A4 = %.6f' % (mp.nstr(b1, 4), mp.nstr(b2, 4), A2, A4))

print()
print('=== (5) IS THE PRINCIPAL MAXIMUM ALWAYS GLOBAL?  lobe 0 vs lobe 1 of |e^{lam z} Ai(z)| ===')
ai0 = mpf('-2.33810741045976703849')   # first Airy zero
ai1 = mpf('-4.08794944413097061664')   # second
print('    beta      lambda      z0          val0             z1           |val1|           ratio')
for b in ['0.05', '0.2', '0.5', '1', '2', '5', '20', '100', '1000', '100000']:
    b = mpf(b); L = lam(b)
    z0 = zstar(b); v0 = exp(L * z0) * airyai(z0)
    h = lambda z: L * airyai(z) + airyai(z, derivative=1)
    zl, zh = ai1 + mpf('1e-12'), ai0 - mpf('1e-12'); fl = h(zl)
    for _ in range(200):
        zm = (zl + zh) / 2
        if h(zm) * fl > 0: zl = zm
        else: zh = zm
    z1 = (zl + zh) / 2; v1 = exp(L * z1) * airyai(z1)
    print('  %8s %10s %+.8f  %.9e  %+.8f  %.9e  %.6f'
          % (mp.nstr(b, 5), mp.nstr(L, 6), z0, v0, z1, abs(v1), abs(v1) / v0))

print()
print("=== (6) radius of convergence of alpha*(beta): solve -Ai'(z)/Ai(z) = sqrt(z) in C ===")
def eqn(z): return airyai(z, derivative=1) / airyai(z) + sqrt(z)
seen = []
for seed in [mpc('-1.2', '1.5'), mpc('-2.5', '2.0'), mpc('0.5', '2.0'), mpc('-1.0', '-1.5'),
             mpc('-4.0', '3.0'), mpc('-0.5', '0.8')]:
    try:
        z = findroot(eqn, seed)
        L = sqrt(z)
        bb = (mpf(3) ** (mpf(1) / 3) / (6 * L)) ** mpf('1.5')
        key = mp.nstr(abs(bb), 6)
        if key in seen: continue
        seen.append(key)
        print('   z = %-28s lam = %-24s beta = %-26s |beta| = %s'
              % (mp.nstr(z, 8), mp.nstr(L, 8), mp.nstr(bb, 8), mp.nstr(abs(bb), 8)))
    except Exception as e:
        print('   seed %s failed: %s' % (seed, e))
