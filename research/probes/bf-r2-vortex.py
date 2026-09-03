# bf-r2-vortex.py - round 2 (Opus): thread Q11 (three modes, reconnection) and Q4 (the axis).
#
# THE UNIMODULAR-ROOT THEOREM.  Let psi = sum_a c_a R_{n_a l_a}(r) Y_{l_a}^{m_a}(theta,phi) with
# the m's running over -M..M and, for each m, ONE angular-radial profile.  Write w = e^{i phi}.
# Then  w^M psi = P(w) := sum_{q=0}^{2M} A_q(r,theta,t) w^q,  a polynomial of degree 2M whose
# coefficients are (time-dependent, complex) multiples of REAL functions of (r,theta).
#   * the nodal set of psi is exactly the locus where P has a root ON THE UNIT CIRCLE;
#   * the number of vortex lines threading the circle {r,theta} = const is the number of
#     unimodular roots, at most 2M;
#   * a RECONNECTION is a double unimodular root, i.e. disc(P) = 0 together with |w_double| = 1.
# For M = 1 (the Q11 state) P is a QUADRATIC and everything is closed-form.
#
# Q11 state: psi = (2p_+ + 3p_0 + 3d_-)/sqrt3.  E(3p_0) = E(3d_-) exactly, so only ONE phase
# tau = (E_3 - E_2) t moves.  P(w) = f1 e^{i tau} w^2 + f2 w + f3, f_i REAL.
import math, cmath
import numpy as np
from scipy import special, optimize
np.set_printoptions(precision=8, suppress=True)

def R(n, l, r):
    rho = 2.0 * r / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * math.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)

A = B = C = 1.0 / math.sqrt(3.0)
E2, E3 = -0.125, -1.0 / 18.0
OM = E3 - E2                                  # = 1/8 - 1/18 = 5/72
TBEAT = 2 * math.pi / OM

# Condon-Shortley:  Y_1^1 = -sqrt(3/8pi) sin th e^{i ph};  Y_1^0 = sqrt(3/4pi) cos th;
#                   Y_2^-1 = +sqrt(15/8pi) sin th cos th e^{-i ph}
c11 = -math.sqrt(3 / (8 * math.pi)); c10 = math.sqrt(3 / (4 * math.pi)); c2m1 = math.sqrt(15 / (8 * math.pi))
def f123(r, th):
    s, c = math.sin(th), math.cos(th)
    return (A * R(2, 1, r) * c11 * s,
            B * R(3, 1, r) * c10 * c,
            C * R(3, 2, r) * c2m1 * s * c)

def psi(t, r, th, ph):
    s, c = math.sin(th), math.cos(th)
    return (A * cmath.exp(-1j * E2 * t) * R(2, 1, r) * c11 * s * cmath.exp(1j * ph)
            + B * cmath.exp(-1j * E3 * t) * R(3, 1, r) * c10 * c
            + C * cmath.exp(-1j * E3 * t) * R(3, 2, r) * c2m1 * s * c * cmath.exp(-1j * ph))

def roots_w(t, r, th):
    f1, f2, f3 = f123(r, th)
    a = f1 * cmath.exp(1j * OM * t)
    if abs(a) < 1e-300: return []
    disc = f2 * f2 - 4 * a * f3
    sq = cmath.sqrt(disc)
    return [(-f2 + sq) / (2 * a), (-f2 - sq) / (2 * a)]

print('=' * 100)
print('V1 - THE QUADRATIC.  Verify that the zeros of psi are exactly the unimodular roots of P.')
print('     T_beat = 2 pi / (E_3 - E_2) = %.6f a.u.  (E_3 - E_2 = 5/72 = %.10f)' % (TBEAT, OM))
print('     t        r      theta    |w| of the two roots         |psi| at the unimodular root')
rng = np.random.default_rng(3)
worst = 0.0
for _ in range(6):
    t = float(rng.uniform(0, TBEAT)); r = float(rng.uniform(1, 14)); th = float(rng.uniform(0.2, 2.9))
    ws = roots_w(t, r, th)
    line = '   %8.3f %6.3f  %6.3f   ' % (t, r, th) + ' '.join('%.6f' % abs(w) for w in ws)
    for w in ws:
        if abs(abs(w) - 1) < 1e-9:
            v = abs(psi(t, r, th, cmath.phase(w))); worst = max(worst, v)
            line += '   |psi| = %.2e' % v
    print(line)
# force a unimodular root: solve |w_+| = 1 in r at fixed (t, theta), then evaluate psi
print('     forced-unimodular checks (solve |w_+(r)| = 1 for r):')
for (t, th) in [(0.0, 1.0), (17.0, 0.8), (37.0, 2.0), (61.0, 1.6)]:
    for which in (0, 1):
        g = lambda rr: abs(roots_w(t, rr, th)[which]) - 1.0
        rs = np.linspace(0.4, 25, 900); gv = [g(x) for x in rs]
        for i in range(len(rs) - 1):
            if gv[i] * gv[i + 1] < 0:
                r0 = optimize.brentq(g, rs[i], rs[i + 1], xtol=1e-14)
                w = roots_w(t, r0, th)[which]
                v = abs(psi(t, r0, th, cmath.phase(w))); worst = max(worst, v)
                print('       t=%6.2f th=%.2f root %d: r = %10.6f  phi = %+.6f  |psi| = %.3e'
                      % (t, th, which, r0, cmath.phase(w), v))
                break
print('     worst |psi| at a computed unimodular root: %.2e' % worst)

print()
print('=' * 100)
print('V2 - RECONNECTION: a DOUBLE unimodular root.  disc = f2^2 - 4 f1 f3 e^{i tau} = 0 with')
print('     |w_d| = |f2| / (2|f1|) = 1.  Since f1,f2,f3 are REAL this forces e^{i tau} = +-1,')
print('     i.e. tau = 0 (mod 2pi) or tau = pi (mod 2pi): RECONNECTIONS HAPPEN TWICE PER BEAT,')
print('     at t = 0, T_beat/2, T_beat, ... and nowhere else.  The spatial conditions are')
print('       tau = 0 :  f3 = +f1  and  f2 = +-2 f1        tau = pi:  f3 = -f1  and  f2 = +-2 f1')
def solve_pair(sgn3, sgn2):
    """solve f3 = sgn3 f1 and f2 = sgn2 * 2 f1 for (r, theta)."""
    def F(v):
        r, th = v
        if r <= 0.05 or th <= 0.01 or th >= math.pi - 0.01: return [1e3, 1e3]
        f1, f2, f3 = f123(r, th)
        return [f3 - sgn3 * f1, f2 - sgn2 * 2 * f1]
    sols = []
    for r0 in np.linspace(0.5, 20, 40):
        for t0 in np.linspace(0.15, math.pi - 0.15, 25):
            try:
                s = optimize.fsolve(F, [r0, t0], full_output=True)
                v, info, ier, _ = s
                if ier == 1 and 0.05 < v[0] < 40 and 0.02 < v[1] < math.pi - 0.02:
                    if max(abs(np.array(F(v)))) < 1e-11:
                        if not any(abs(v[0] - u[0]) < 1e-6 and abs(v[1] - u[1]) < 1e-6 for u in sols):
                            sols.append((v[0], v[1]))
            except Exception:
                pass
    return sols
print('     tau  sgn(f3/f1) sgn(f2/2f1)   r*          theta*        z*=r cos th   |psi| at the double root')
found = []
for tau, s3 in [(0.0, +1), (math.pi, -1)]:
    for s2 in (+1, -1):
        for (r0, t0) in solve_pair(s3, s2):
            tt = tau / OM
            f1, f2, f3 = f123(r0, t0)
            wd = -f2 / (2 * f1 * cmath.exp(1j * tau))
            v = abs(psi(tt, r0, t0, cmath.phase(wd)))
            disc = f2 * f2 - 4 * f1 * f3 * cmath.exp(1j * tau)
            found.append((tau, r0, t0, tt, v))
            print('     %4.2f     %+d          %+d       %10.6f  %10.6f   %+9.5f    |psi| = %.2e  |disc| = %.1e  |w_d| = %.10f'
                  % (tau, s3, s2, r0, t0, r0 * math.cos(t0), v, abs(disc), abs(wd)))
if found:
    tmin = min(f[3] for f in found if f[3] >= 0)
    print('     => THE FIRST RECONNECTION IS AT t = %.6f a.u. (tau = %.4f), i.e. at t = 0 itself'
          % (tmin, tmin * OM))
    print('        and thereafter every T_beat/2 = %.4f a.u.' % (TBEAT / 2))

print()
print('=' * 100)
print('V3 - THE LOCAL NORMAL FORM.  Write l = disc / f2^2 (complex) and h = |w_d| - 1 (real);')
print('     both vanish at the reconnection and are smooth in (r, theta, tau).  The two roots are')
print('     w_+- = w_d (1 -+ sqrt(l)), so |w_+-| = 1 becomes  (Re sqrt(l))^2 = h^2, i.e.')
print('        (Im l)^2 = 4 h^2 ( h^2 - Re l )        -> to leading order   (Im l)^2 + 4 h^2 Re l = 0,')
print('     a QUADRATIC CONE in (h, Re l, Im l): two nodal branches that meet and exchange as Re l')
print('     changes sign.  This is the hyperbolic reconnection of Bialynicki-Birula et al 2000.')
if found:
    tau0, r0, th0, t0, _ = found[0]
    def hl(r, th, tau):
        f1, f2, f3 = f123(r, th)
        a = f1 * cmath.exp(1j * tau)
        disc = f2 * f2 - 4 * a * f3
        wd = -f2 / (2 * a)
        return abs(wd) - 1.0, disc / (f2 * f2)
    print('     numerical check of the cone at the reconnection (r*, th*, tau*) = (%.5f, %.5f, %.4f):'
          % (r0, th0, tau0))
    print('       eps        h            Re l         Im l        (Im l)^2 + 4h^2 Re l   / eps^3')
    for eps in [1e-2, 5e-3, 2e-3, 1e-3]:
        # walk along a generic direction and re-solve |w|=1 to stay ON the nodal set
        h, l = hl(r0 + eps, th0 + 0.7 * eps, tau0 + 1.3 * eps)
        val = (l.imag) ** 2 + 4 * h * h * l.real
        print('       %.1e   %+.3e   %+.3e   %+.3e     %+.3e            %+.3e'
              % (eps, h, l.real, l.imag, val, val / eps ** 3))

print()
print('=' * 100)
print('V4 - HOW MANY VORTEX LINES?  The number of unimodular roots of P as a function of r,')
print('     and the large-r limit.  |w_+ w_-| = |f3 / f1|, so BOTH roots can be unimodular only')
print('     where |f1| = |f3| (the self-inversive locus; Schur-Cohn).')
print('     t         r      #unimodular roots along theta = 1.0     |f3/f1|')
for t in [0.0, 10.0, TBEAT / 4, TBEAT / 2, 3 * TBEAT / 4]:
    row = []
    for r in [1, 2, 4, 6, 9, 12, 16, 22, 30]:
        ws = roots_w(t, r, 1.0)
        row.append(sum(1 for w in ws if abs(abs(w) - 1) < 1e-3))
    f1, f2, f3 = f123(12.0, 1.0)
    print('     %8.3f   %s      |f3/f1|(r=12) = %.4f' % (t, row, abs(f3 / f1)))
print('     asymptotics: R_2l ~ e^{-r/2}, R_3l ~ e^{-r/3}, so f1/f3 -> 0 as r -> infinity;')
print('     the quadratic degenerates to f2 w + f3 = 0 -> ONE root, |w| = |f3/f2|.')
print('     Number of nodal points on a large sphere r = const (solving |f3| = |f2| in theta):')
for r in [20.0, 30.0, 40.0]:
    g = lambda th: abs(f123(r, th)[2]) - abs(f123(r, th)[1])
    ths = np.linspace(0.02, math.pi - 0.02, 4000); gv = [g(x) for x in ths]
    roots = [optimize.brentq(g, ths[i], ths[i + 1]) for i in range(len(ths) - 1) if gv[i] * gv[i + 1] < 0]
    print('     r = %5.1f : theta solutions of |f3| = |f2| -> %s  (=> %d vortex lines pierce the sphere)'
          % (r, np.round(roots, 5), len(roots)))

print()
print('=' * 100)
print('V5 - Q4: IS j FINITE ON THE z-AXIS?   j_phi = Im(psi* d_phi psi)/(r sin th).')
print('     For a superposition, the phi-component near theta -> 0 behaves as')
print('        j_phi ~ sum_{m,m\'} (m-m\')/2 * (coef) sin^{|m|+|m\'|-1} theta,')
print('     so it is FINITE for every pair, and NONZERO in the limit only when {|m|,|m\'|} = {0,1}.')
print('     numerical: |j_phi| as theta -> 0 for the Q11 state (which contains |m| = 0 and 1):')
def jphi(t, r, th, ph, h=1e-6):
    p0 = psi(t, r, th, ph)
    dp = (psi(t, r, th, ph + h) - psi(t, r, th, ph - h)) / (2 * h)
    return (np.conj(p0) * dp).imag / (r * math.sin(th))
for th in [0.3, 0.1, 0.03, 0.01, 0.003, 0.001]:
    print('       theta = %.4f : j_phi(r=4, phi=0.7, t=5) = %+.10e' % (th, jphi(5.0, 4.0, th, 0.7)))
print('     and for a state with only |m| >= 1 (2p_+ + 3d_+, both m = +1) j_phi -> 0 like sin theta:')
def jphi2(t, r, th, ph, h=1e-6):
    f = lambda p: (R(2, 1, r) * c11 * math.sin(th) * cmath.exp(-1j * E2 * t)
                   + R(3, 2, r) * (-math.sqrt(15 / (8 * math.pi))) * math.sin(th) * math.cos(th)
                   * cmath.exp(-1j * E3 * t)) * cmath.exp(1j * p)
    p0 = f(ph); dp = (f(ph + h) - f(ph - h)) / (2 * h)
    return (np.conj(p0) * dp).imag / (r * math.sin(th))
for th in [0.3, 0.1, 0.03, 0.01]:
    print('       theta = %.4f : j_phi = %+.10e   (ratio to sin theta: %.6f)'
          % (th, jphi2(5.0, 4.0, th, 0.7), jphi2(5.0, 4.0, th, 0.7) / math.sin(th)))
print()
print('     the f16 gate: j = Im(psi* grad psi) is a CANCELLING difference.  With half precision')
print('     (eps = 2^-11 = %.3e) the absolute error of each product is ~ eps |psi| |grad psi|,' % (2 ** -11))
print('     so the RELATIVE error of j exceeds 1e-3 wherever')
print('        |j| < 2 eps |psi||grad psi| / 1e-3 = %.3f |psi| |grad psi|,' % (2 * 2 ** -11 / 1e-3))
print('     i.e. wherever sin(angle between psi and grad psi) < %.3f. That set is NOT small:' % (2 * 2 ** -11 / 1e-3))
print('     by Theorem C2 of round 1 it CONTAINS the still-frame surfaces where j vanishes')
print('     identically, so the relative error of a f16 FLOW view is unbounded there.')
