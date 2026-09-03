# bf-r3-far.py — the far field of the Q11 state: exact unimodular-root count on spheres r = 15…30 (settles Opus §5.4's table vs Theorem 7),
#   and Theorem C3 (Fable): outside the core the nodal set is the highest shell's own, and it is stationary.
import math, cmath
import numpy as np
from scipy import special, optimize

def R(n, l, r):
    rho = 2.0 * r / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * math.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
A = B = C = 1 / math.sqrt(3)
c11 = -math.sqrt(3 / (8 * math.pi)); c10 = math.sqrt(3 / (4 * math.pi)); c2m1 = math.sqrt(15 / (8 * math.pi))
E2, E3 = -0.125, -1 / 18; OM = E3 - E2
def f123(r, th):
    s, c = math.sin(th), math.cos(th)
    return A * R(2, 1, r) * c11 * s, B * R(3, 1, r) * c10 * c, C * R(3, 2, r) * c2m1 * s * c
def roots(tau, r, th):
    f1, f2, f3 = f123(r, th); a = f1 * cmath.exp(1j * tau)
    if abs(a) < 1e-300: return [-f3 / f2] if abs(f2) > 0 else []
    sq = cmath.sqrt(f2 * f2 - 4 * a * f3)
    return [(-f2 + sq) / (2 * a), (-f2 - sq) / (2 * a)]
def count_on_sphere(tau, r, nth=20000):
    ths = np.linspace(1e-4, math.pi - 1e-4, nth)
    cnt = 0; where = []
    for which in (0, 1):
        g = [abs(roots(tau, r, th)[which]) - 1 for th in ths]
        for i in range(nth - 1):
            if g[i] * g[i + 1] < 0 and abs(g[i]) < 0.5 and abs(g[i + 1]) < 0.5:
                th0 = optimize.brentq(lambda t: abs(roots(tau, r, t)[which]) - 1, ths[i], ths[i + 1], xtol=1e-12)
                w = roots(tau, r, th0)[which]
                cnt += 1; where.append((round(th0, 5), round(cmath.phase(w), 5)))
    return cnt, where
print('exact unimodular-root count on spheres (each crossing counted once per root branch):')
print('   τ/π     r=15  r=18  r=20  r=20.4  r=20.5  r=22  r=25  r=30')
for tau in [0.0, math.pi / 3, math.pi / 2, math.pi]:
    row = [count_on_sphere(tau, r)[0] for r in [15, 18, 20, 20.4, 20.5, 22, 25, 30]]
    print(f'  {tau / math.pi:5.3f}     ' + '     '.join(f'{c:2d}' for c in row))
print('max_θ |f3/f2| at r = 20, 20.4, 20.5, 22, 25, 30:', [round(max(abs(f123(r, th)[2] / f123(r, th)[1]) for th in np.linspace(0.01, math.pi - 0.01, 4000)), 5) for r in [20, 20.4, 20.5, 22, 25, 30]])
print('the far-field root of the highest shell alone, w = -f3/f2 (no τ): unimodular where |f3| = |f2|; at r = 15 and 18 the nodal points and their φ:')
for r in [15.0, 18.0]:
    c0, w0 = count_on_sphere(0.0, r); c1, w1 = count_on_sphere(2.0, r)
    print(f'  r={r}: τ=0 → {w0}   τ=2 → {w1}')
