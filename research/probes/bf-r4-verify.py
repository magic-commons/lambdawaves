# bf-r4-verify.py — Round 4 (Opus).  (i) direct verification of the two reconnection pairs Round 3's tracer missed;
# (ii) a tangency-proof scan of Phi (local minima as well as sign changes); (iii) the C3 prefactor.
import math, cmath
import numpy as np
from scipy import special, optimize
np.seterr(all='ignore')
def R(n, l, r):
    rho = 2.0 * np.asarray(r, float) / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * np.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
def Y(l, m, th): return special.sph_harm_y(l, m, th, 0.0).real
E = {n: -0.5 / n ** 2 for n in range(1, 8)}
c = 1 / math.sqrt(3)
gp = lambda r, th: c * R(3, 2, r) * Y(2, 2, th)
g0 = lambda r, th: c * R(4, 1, r) * Y(1, 1, th)
gm = lambda r, th: c * R(5, 0, r) * Y(0, 0, th)
om = E[3] + E[5] - 2 * E[4]; Td = 2 * math.pi / abs(om)

print('(i) DIRECT VERIFICATION — the full three-mode wavefunction at each event')
pts = [(2.75347965, 0.837645), (6.36762188, 0.091027), (6.51013250, 0.103577),
       (14.32627490, 0.014789), (14.32954540, 0.014463)]
print('       r          theta      t0        |w1-w2|      ||w|-1|       |psi| at the double root   status')
for r0, th0 in pts:
    # polish on the two exact conditions |g0| = 2|g+| and |g-| = |g+|
    F = lambda v: [abs(g0(v[0], v[1])) - 2 * abs(gp(v[0], v[1])), abs(gm(v[0], v[1])) - abs(gp(v[0], v[1]))]
    sol = optimize.fsolve(F, [r0, th0], xtol=1e-14)
    r1, th1 = sol
    sg = gp(r1, th1) * gm(r1, th1)
    t0 = 0.0 if sg > 0 else Td / 2
    a = gp(r1, th1) * cmath.exp(-1j * E[3] * t0)
    b = g0(r1, th1) * cmath.exp(-1j * E[4] * t0)
    d = gm(r1, th1) * cmath.exp(-1j * E[5] * t0)
    w = np.roots([a, b, d])
    wd = -b / (2 * a)
    psi = a * wd ** 2 + b * wd + d
    scale = abs(a) + abs(b) + abs(d)
    new = ' <-- MISSED BY ROUND 3' if r1 > 10 else ''
    print(f'  {r1:11.7f}  {th1:9.6f}  {t0:8.3f}   {abs(w[0]-w[1]):.3e}    {abs(abs(wd)-1):.3e}    '
          f'{abs(psi)/scale:.3e}          {"OK" if abs(psi)/scale < 1e-12 else "??"}{new}')
print('  the two new events sit at (rho, z) = (%.5f, %+.5f) and (%.5f, %+.5f), i.e. within 0.0033 a.u. of each other'
      % (14.32627490*math.sin(0.014789), 14.32627490*math.cos(0.014789),
         14.32954540*math.sin(0.014463), 14.32954540*math.cos(0.014463)))
print('  Round 3 traced 1200 meridians on theta in [0.01, pi-0.01]: spacing 0.00262 rad, cutoff 0.01.')
print('  The two events lie at theta = 0.014789 and 0.014463 — 0.00033 apart, INSIDE ONE CELL, two cells above the cutoff.')

print()
print('(ii) TANGENCY AUDIT of Phi(r) = A0^2 - 4|A+ A-| : local minima of |Phi| as well as sign changes')
gpr = lambda r: c * R(3, 2, r) * Y(2, 2, math.pi/2)   # stretched: theta-independent after dividing by sin^|m|
gp0 = lambda r: c * R(3, 2, r) * special.sph_harm_y(2, 2, 1.0, 0.0).real / math.sin(1.0)**2
g00 = lambda r: c * R(4, 1, r) * special.sph_harm_y(1, 1, 1.0, 0.0).real / math.sin(1.0)
gm0 = lambda r: c * R(5, 0, r) * special.sph_harm_y(0, 0, 1.0, 0.0).real
Phi = lambda r: g00(r) ** 2 - 4 * np.abs(gp0(r) * gm0(r))
rr = np.linspace(1e-5, 60.0, 6000000)
P = Phi(rr)
lo = np.where((np.abs(P[1:-1]) < np.abs(P[:-2])) & (np.abs(P[1:-1]) < np.abs(P[2:])))[0] + 1
print(f'  {len(lo)} local minima of |Phi| on (0,60]:')
for i in lo:
    r0 = rr[i]
    xi = abs(g00(r0)) / (2 * abs(gp0(r0)))
    print(f'    r = {r0:10.6f}   Phi = {P[i]:+.6e}   |Phi|/(A0^2) = {abs(P[i])/g00(r0)**2:.3e}   xi = {xi:.6f}'
          f'   {"(a root)" if abs(P[i])/g00(r0)**2 < 1e-4 else "(not a root: no near-tangency)"}')
print('  radial nodes: 5s at 2r/5 = zeros of L_4^1 ; 4p at 2r/4 = zeros of L_2^3 ; 3d has none.')
for (n, l, lab) in [(5, 0, '5s'), (4, 1, '4p')]:
    z = np.sort(np.roots(np.polyfit(np.linspace(0.01, 40, 400),
                                    special.eval_genlaguerre(n-l-1, 2*l+1, 2*np.linspace(0.01, 40, 400)/n), n-l-1)))
    rs = [x for x in z.real if 0 < x < 60 and abs(x.imag if hasattr(x,'imag') else 0) < 1e-8]
    print(f'    {lab} nodes at r = {[round(float(x),5) for x in rs]}')

print()
print('(iii) THEOREM C3 — the escape law with its algebraic prefactor')
f1 = lambda r, th: R(2, 1, r) * Y(1, 1, th)
f3 = lambda r, th: R(3, 2, r) * Y(2, -1, th)
print('   r      |cos theta|        K := |cos theta| * r * e^{r/6}')
for r0 in [20, 30, 40, 60, 80, 100, 150, 200]:
    F = lambda th: abs(f1(r0, th)) - abs(f3(r0, th))
    th_lo = th_hi = None
    for d in np.logspace(-16, -0.05, 6000):
        a1, b1 = math.pi/2 - d, math.pi/2 - d*1.01
        if F(a1) * F(b1) < 0: th_lo, th_hi = b1, a1; break
    if th_lo is None: continue
    th0 = optimize.brentq(F, th_lo, th_hi, xtol=1e-17, rtol=8.9e-16)
    ct = abs(math.cos(th0))
    print(f'  {r0:5.1f}   {ct:.10e}    {ct * r0 * math.exp(r0/6):.8f}')
print('  exact:  |cos theta| = |R21(r)| |Y11(pi/2)| / (|R32(r)| |dY2,-1/d(cos)|) ; R21/R32 = K r^{-1} e^{-r/6}.')
K = (math.sqrt((2/2)**3*math.factorial(0)/(2*2*math.factorial(3)))) / \
    (math.sqrt((2/3)**3*math.factorial(0)/(2*3*math.factorial(5)))*(2/3)**2)
print(f'  radial part alone: |R21/R32| * r * e^(r/6) -> {K:.8f} ; angular ratio |Y11|/(sin th |dY2,-1|) at pi/2 = '
      f'{abs(Y(1,1,math.pi/2)) / abs(special.sph_harm_y(2,-1,math.pi/2+1e-6,0.0).real/math.cos(math.pi/2+1e-6)):.8f}')
