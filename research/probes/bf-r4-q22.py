# bf-r4-q22.py — Round 4 (Opus).  Q22: the first genuinely generic reconnection.
# State  psi = (3d_{+2} + 4p_{+1} + 5s + 6p_{-1})/2  (m = 2,1,0,-1; every mode stretched, l = |m|).
#
# THE REDUCTION.  With xi = sin(theta), mu = xi^2, w = e^{i phi}, W = xi w:
#     P(w) = A_{-1} + A_0 w + A_1 w^2 + A_2 w^3,   A_m = Ahat_m(r,t) xi^{|m|}
#  =>  xi P = Q(W) = a W^3 + b W^2 + c W + mu d,   a = Ahat_2 e^{-iE3 t}, b = Ahat_1 e^{-iE4 t},
#                                                   c = Ahat_0 e^{-iE5 t}, d = Ahat_{-1} e^{-iE6 t}.
# A reconnection is Q = Q' = 0 with |W|^2 = mu in (0,1].  Q'(W) = 3aW^2 + 2bW + c does NOT contain mu,
# so W = W_pm(r,t) and mu = -(aW^3+bW^2+cW)/d ; the conditions collapse to TWO real equations in (r,t):
#     F1 = Im mu = 0,   F2 = Re mu - |W|^2 = 0.
# Detection is by the WINDING NUMBER of G = (F1^+ + i F2^+)(F1^- + i F2^-) — a symmetric function of the
# unordered root pair, hence single-valued in (r,t) — around every cell of an (r,t) grid.  No branch tracking.
import math, cmath, sys
import numpy as np
from scipy import special, optimize
np.seterr(all='ignore')

def Rrad(n, l, r):
    rho = 2.0 * np.asarray(r, float) / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * np.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
def sc(m):
    l = abs(m)
    v = [special.sph_harm_y(l, m, th, 0.0).real / math.sin(th) ** l for th in (0.3, 0.9, 2.0)]
    assert max(v) - min(v) < 1e-12, (m, v)
    return v[0]
S2, S1, S0, Sm = sc(2), sc(1), sc(0), sc(-1)
E = {n: -0.5 / n ** 2 for n in range(1, 8)}
cw = 0.5
h2 = lambda r: cw * Rrad(3, 2, r) * S2       # m = +2  (3d_{+2})
h1 = lambda r: cw * Rrad(4, 1, r) * S1       # m = +1  (4p_{+1})
h0 = lambda r: cw * Rrad(5, 0, r) * S0       # m =  0  (5s)
hm = lambda r: cw * Rrad(6, 1, r) * Sm       # m = -1  (6p_{-1})
Tper = 2 * math.pi * 7200.0
print(f'stretched constants: Y22/sin^2 = {S2:.10f}, Y11/sin = {S1:.10f}, Y00 = {S0:.10f}, Y1,-1/sin = {Sm:.10f}')
print(f'energies x7200: E3,E4,E5,E6 = -400,-225,-144,-100 ; gcd(300,125,44) = 1 => T = 2pi*7200 = {Tper:.3f} a.u.')
print('discriminant of the cubic = 5-term exponential sum; phase sums x7200: -869, -775, -738, -832, -1000 (all distinct)')

def coeffs(r, t):
    a = h2(r) * np.exp(-1j * E[3] * t)
    b = h1(r) * np.exp(-1j * E[4] * t)
    c = h0(r) * np.exp(-1j * E[5] * t)
    d = hm(r) * np.exp(-1j * E[6] * t)
    return a, b, c, d
def Grow(r, t):
    a, b, c, d = coeffs(r, t)
    disc = np.sqrt((2 * b) ** 2 - 4 * (3 * a) * c + 0j)
    out = np.ones_like(t, dtype=complex)
    for W in ((-2 * b + disc) / (6 * a), (-2 * b - disc) / (6 * a)):
        mu = -(a * W ** 3 + b * W ** 2 + c * W) / d
        out = out * (mu.imag + 1j * (mu.real - np.abs(W) ** 2))
    return out

NR, NT = 1200, 90000
rs = np.linspace(0.4, 45.0, NR)
ts = np.linspace(0.0, Tper, NT, endpoint=False)
def quad(z):
    q = np.zeros(z.shape, dtype=np.int8)
    q[(z.real >= 0) & (z.imag >= 0)] = 0
    q[(z.real < 0) & (z.imag >= 0)] = 1
    q[(z.real < 0) & (z.imag < 0)] = 2
    q[(z.real >= 0) & (z.imag < 0)] = 3
    return q
def step(q1, q2):
    d = (q2.astype(np.int16) - q1.astype(np.int16)) % 4
    return np.where(d == 3, -1, np.where(d == 2, 0, d))
prev = Grow(rs[0], ts); qprev = quad(prev)
cands = []
for i in range(1, NR):
    cur = Grow(rs[i], ts); qcur = quad(cur)
    # winding around the cell [r_{i-1},r_i] x [t_j,t_{j+1}] : corners A=prev[j], B=prev[j+1], C=cur[j+1], D=cur[j]
    A, B, C, D = qprev[:-1], qprev[1:], qcur[1:], qcur[:-1]
    wnd = step(A, B) + step(B, C) + step(C, D) + step(D, A)
    for j in np.where(wnd != 0)[0]:
        cands.append((0.5 * (rs[i - 1] + rs[i]), 0.5 * (ts[j] + ts[j + 1])))
    prev, qprev = cur, qcur
print(f'grid {NR} x {NT} (dr = {rs[1]-rs[0]:.4f}, dt = {ts[1]-ts[0]:.4f} a.u.): {len(cands)} cells with nonzero winding')

def Fsys(v):
    r, th, t, phi = v
    x = math.sin(th); w = cmath.exp(1j * phi)
    a = float(h2(r)) * cmath.exp(-1j * E[3] * t) * x ** 2
    b = float(h1(r)) * cmath.exp(-1j * E[4] * t) * x
    c = float(h0(r)) * cmath.exp(-1j * E[5] * t)
    d = float(hm(r)) * cmath.exp(-1j * E[6] * t) * x
    P = d + c * w + b * w ** 2 + a * w ** 3
    Pp = c + 2 * b * w + 3 * a * w ** 2
    return [P.real, P.imag, Pp.real, Pp.imag]
def seed(r, t):
    a, b, c, d = coeffs(np.array([r]), np.array([t]))
    a, b, c, d = a[0], b[0], c[0], d[0]
    disc = cmath.sqrt((2 * b) ** 2 - 4 * (3 * a) * c)
    for W in ((-2 * b + disc) / (6 * a), (-2 * b - disc) / (6 * a)):
        mu = -(a * W ** 3 + b * W ** 2 + c * W) / d
        m = max(min(mu.real, 1.0), 1e-12)
        yield [r, math.asin(math.sqrt(m)), t, cmath.phase(W)]
        yield [r, math.pi - math.asin(math.sqrt(m)), t, cmath.phase(W)]
events = []
for (r0, t0) in cands:
    for v0 in seed(r0, t0):
        sol, info, ier, msg = optimize.fsolve(Fsys, v0, full_output=True, xtol=1e-13)
        if ier != 1: continue
        r1, th1, t1, p1 = sol
        if not (0.3 < r1 < 60 and 1e-4 < th1 < math.pi - 1e-4): continue
        t1 %= Tper; p1 %= 2 * math.pi
        res = Fsys([r1, th1, t1, p1])
        s = abs(float(h0(r1))) + abs(float(h1(r1))) + abs(float(h2(r1))) + abs(float(hm(r1)))
        if max(abs(x) for x in res) / s > 1e-11: continue
        if not any(abs(r1 - e[0]) < 1e-6 and abs(th1 - e[1]) < 1e-6 and
                   min(abs(t1 - e[2]), Tper - abs(t1 - e[2])) < 1e-4 for e in events):
            events.append((r1, th1, t1, p1, max(abs(x) for x in res) / s))
events.sort(key=lambda e: e[2])
print(f'\n{len(events)} distinct reconnection events in one full period T = {Tper:.1f} a.u.')
print('      r          theta          t (a.u.)        phi          rho          z        residual')
for r1, th1, t1, p1, rr_ in events[:60]:
    print(f'  {r1:9.6f}  {th1:10.7f}  {t1:13.6f}  {p1:9.6f}  {r1*math.sin(th1):9.5f} {r1*math.cos(th1):+9.5f}  {rr_:.2e}')
if events:
    r1, th1, t1, p1, _ = events[0]
    print(f'\nFIRST EVENT  t = {t1:.6f} a.u.,  (rho, z) = ({r1*math.sin(th1):.6f}, {r1*math.cos(th1):+.6f}),  phi = {p1:.6f}')
    print('  is it at a special phase of any single beat?')
    for lab, per in [('3-4', 2*math.pi/abs(E[3]-E[4])), ('3-5', 2*math.pi/abs(E[3]-E[5])), ('3-6', 2*math.pi/abs(E[3]-E[6])),
                     ('4-5', 2*math.pi/abs(E[4]-E[5])), ('4-6', 2*math.pi/abs(E[4]-E[6])), ('5-6', 2*math.pi/abs(E[5]-E[6])),
                     ('disc 3+5-2*4', 2*math.pi/abs(E[3]+E[5]-2*E[4]))]:
        f = (t1 % per) / per
        tag = 'AT 0 or 1/2' if min(f, abs(f - 0.5), 1 - f) < 1e-5 else 'GENERIC'
        print(f'    beat {lab:12s} T = {per:12.5f}   t/T mod 1 = {f:.8f}   {tag}')
    # PT mirror and the local normal form
    print('  PT mirror (t -> -t, phi -> -phi) should also be an event:')
    v = optimize.fsolve(Fsys, [r1, th1, (Tper - t1) % Tper, (2*math.pi - p1) % (2*math.pi)], xtol=1e-13)
    print(f'    ({v[0]:.6f}, {v[1]:.7f}, {v[2]%Tper:.6f}, {v[3]%(2*math.pi):.6f})   residual '
          f'{max(abs(x) for x in Fsys(v))/ (abs(float(h0(v[0])))+abs(float(h1(v[0])))+abs(float(h2(v[0])))+abs(float(hm(v[0])))):.2e}')
    print('  local normal form: the three roots of P as t passes the event (r, theta, phi frozen):')
    for dt in (-2.0, -0.5, 0.0, 0.5, 2.0):
        x = math.sin(th1); tt = t1 + dt
        co = [float(h2(r1))*cmath.exp(-1j*E[3]*tt)*x**2, float(h1(r1))*cmath.exp(-1j*E[4]*tt)*x,
              float(h0(r1))*cmath.exp(-1j*E[5]*tt), float(hm(r1))*cmath.exp(-1j*E[6]*tt)*x]
        rt = sorted(np.roots(co), key=lambda z: abs(abs(z) - 1))
        print(f'    tau = {dt:+5.1f}:  |w| = {[round(abs(z),8) for z in rt]},  |w1 - w2| = {abs(rt[0]-rt[1]):.6e}')
