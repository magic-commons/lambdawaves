# bf-r4-c5census.py — Round 4 (Opus).  Theorem C5's census, made COMPLETE: one equation in r alone.
# Also: the same reduction applied to the C3 escape (Theorem C3's exponent), measured.
import math, cmath, sys
import numpy as np
from scipy import special, optimize
np.seterr(all='ignore')

def R(n, l, r):
    rho = 2.0 * np.asarray(r, float) / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * np.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
def sc(m):
    l = abs(m); v = [special.sph_harm_y(l, m, th, 0.0).real / math.sin(th) ** l for th in (0.3, 0.7, 1.1, 2.0)]
    assert max(v) - min(v) < 1e-12
    return v[0]
E = {n: -0.5 / n ** 2 for n in range(1, 8)}
c = 1 / math.sqrt(3)
gp = lambda r: c * R(3, 2, r) * sc(2)
g0 = lambda r: c * R(4, 1, r) * sc(1)
gm = lambda r: c * R(5, 0, r) * sc(0)
om = E[3] + E[5] - 2 * E[4]; Td = 2 * math.pi / abs(om)
Phi = lambda r: g0(r) ** 2 - 4 * np.abs(gp(r) * gm(r))
xi = lambda r: np.abs(g0(r)) / (2 * np.abs(gp(r)))
print('THEOREM C5 CENSUS AS A ROOT COUNT (all three modes are stretched, l = |m|, so the census separates)')
print('  reconnection  <=>  Phi(r) := A0(r)^2 - 4|A+(r) A-(r)| = 0   AND   xi(r) := |A0|/(2|A+|) = sin(theta) <= 1')
rr = np.linspace(1e-5, 400.0, 8000000)
Pv = Phi(rr); s = np.sign(Pv)
idx = np.where(s[:-1] * s[1:] < 0)[0]
print(f'  scan r in (0, 400], 8e6 samples: {len(idx)} sign changes of Phi')
print('     root r         xi = sin(theta)     theta        pi-theta      admissible?    rho        z')
adm = []
for i in idx:
    r0 = optimize.brentq(lambda r: float(Phi(np.array([r]))[0]), rr[i], rr[i + 1], xtol=1e-14, rtol=8.9e-16)
    x = float(xi(np.array([r0]))[0]); ok = x <= 1.0
    th = math.asin(min(x, 1.0))
    print(f'  {r0:12.8f}   {x:14.9f}   {th:9.6f}   {math.pi-th:9.6f}    {"YES" if ok else "no (xi>1)":10s}'
          + (f'  {r0*math.sin(th):9.5f} {r0*math.cos(th):+9.5f}' if ok else ''))
    if ok: adm.append((r0, th))
print(f'  => {len(adm)} admissible radii x 2 (theta, pi-theta) = {2*len(adm)} reconnection points.  Fable reported 6.')
print(f'  T_d = {Td:.4f} a.u.')
for r0, th in adm:
    sg = float(gp(np.array([r0]))[0] * gm(np.array([r0]))[0])
    t0 = 0.0 if sg > 0 else Td / 2
    Wd = -float(g0(np.array([r0]))[0]) * cmath.exp(-1j * E[4] * t0) / (2 * float(gp(np.array([r0]))[0]) * cmath.exp(-1j * E[3] * t0))
    print(f'   r={r0:11.7f} theta={th:8.5f} sgn(A+A-)={"+" if sg>0 else "-"} t0={t0:9.4f} '
          f'|W_d|={abs(Wd):.12f} (sin theta={math.sin(th):.12f}) phi_d={cmath.phase(Wd):+9.6f}')
print('  ASYMPTOTIC AUDIT (why the list is COMPLETE, no grid involved):')
for r0 in [1e-5, 1e-3, 1e-2, 0.1, 0.5]:
    print(f'    r={r0:8.4g}: Phi={float(Phi(np.array([r0]))[0]):+.6e}  xi={float(xi(np.array([r0]))[0]):.5g}')
for r0 in [40, 60, 100, 200, 400]:
    print(f'    r={r0:8.4g}: Phi={float(Phi(np.array([r0]))[0]):+.6e}  xi={float(xi(np.array([r0]))[0]):.5g}')
print('    small r: A- ~ r^0, A0 ~ r, A+ ~ r^2 => Phi ~ (const) r^2 and xi ~ const/r -> inf: xi<=1 fails.')
print('    large r: A0^2 ~ e^{-r/2} vs 4|A+A-| ~ e^{-(1/3+1/5)r} = e^{-8r/15}; 1/2 < 8/15 so Phi > 0 for large r,')
print('             and xi ~ e^{r/12} -> inf: xi<=1 fails.  Both ends are excluded ANALYTICALLY.')

# ---------------- Theorem C3's exponent, measured ----------------
print()
print('THEOREM C3: the escaping pair of the Q11 state 2p_+ + 3p_0 + 3d_- (Round 2 section 5.4 / Round 3 section 3.2)')
print('  Fable: two lines escape at |cos theta| = |c11 R21| / |c2,-1 R32| ~ e^{-r/6}, "asserted, not fitted".')
f1 = lambda r, th: R(2, 1, r) * special.sph_harm_y(1, 1, th, 0.0).real      # m = +1, from 2p_+
f2 = lambda r, th: R(3, 1, r) * special.sph_harm_y(1, 0, th, 0.0).real      # m =  0, from 3p_0
f3 = lambda r, th: R(3, 2, r) * special.sph_harm_y(2, -1, th, 0.0).real     # m = -1, from 3d_-
print('   r      theta_root (near pi/2)   |cos theta|      -ln|cos| / r     model 1/6 = 0.166667')
prev = None
for r0 in [10, 15, 20, 25, 30, 40, 50, 60, 80, 100]:
    # near the equator, P(w) = f1 e^{i tau} w^2 + f2 w + f3 with f2 ~ 0: solve |f1| = |f3| on the equator side
    F = lambda th: abs(f1(r0, th)) - abs(f3(r0, th))
    lo, hi = math.pi / 2 - 1e-12, math.pi / 2
    # bracket by scanning outward from pi/2
    th_lo, th_hi = None, None
    for d in np.logspace(-14, -0.05, 4000):
        a1, b1 = math.pi / 2 - d, math.pi / 2 - d * 1.01
        if F(a1) * F(b1) < 0: th_lo, th_hi = b1, a1; break
    if th_lo is None:
        print(f'  {r0:5.1f}   (no |f1|=|f3| crossing found on the polar side of the equator)')
        continue
    th0 = optimize.brentq(F, th_lo, th_hi, xtol=1e-16, rtol=8.9e-16)
    ct = abs(math.cos(th0))
    print(f'  {r0:5.1f}      {th0:.12f}       {ct:.6e}      {-math.log(ct)/r0:.8f}       0.16666667')
print('  the true exponent: |f1/f3| = |R21/R32| x (angular) ~ e^{-r/2}/e^{-r/3} = e^{-r/6} => -ln|cos theta|/r -> 1/6.')
