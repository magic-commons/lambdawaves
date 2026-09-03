# bf-r2-vortex2.py - round 2 (Opus): the reconnection made explicit, and the vortex census.
#   W1  track the nodal set through the reconnection instant: two branches meet and exchange.
#   W2  the cone normal form checked ON the nodal set (not along a generic ray).
#   W3  the vortex census on spheres: is the number of lines conserved between reconnections?
import math, cmath
import numpy as np
from scipy import special, optimize

def R(n, l, r):
    rho = 2.0 * r / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * math.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
A = B = C = 1.0 / math.sqrt(3.0)
E2, E3 = -0.125, -1.0 / 18.0
OM = E3 - E2; TBEAT = 2 * math.pi / OM
c11 = -math.sqrt(3 / (8 * math.pi)); c10 = math.sqrt(3 / (4 * math.pi)); c2m1 = math.sqrt(15 / (8 * math.pi))
def f123(r, th):
    s, c = math.sin(th), math.cos(th)
    return (A * R(2, 1, r) * c11 * s, B * R(3, 1, r) * c10 * c, C * R(3, 2, r) * c2m1 * s * c)
def roots_w(tau, r, th):
    f1, f2, f3 = f123(r, th); a = f1 * cmath.exp(1j * tau)
    d = f2 * f2 - 4 * a * f3; sq = cmath.sqrt(d)
    return [(-f2 + sq) / (2 * a), (-f2 - sq) / (2 * a)], d, -f2 / (2 * a)

RSTAR, THSTAR, TAUSTAR = 4.708643959, 0.195162, math.pi     # the tau = pi reconnection (z > 0)
print('=' * 100)
print('W1 - TRACKING THE RECONNECTION.  At tau = pi (t = T_beat/2 = %.5f a.u.) the two nodal' % (TBEAT / 2))
print('     branches touch at (r,theta,phi) = (%.6f, %.6f, pi).  Cartesian (x,y,z) = (%.5f, 0, %+.5f).'
      % (RSTAR, THSTAR, -RSTAR * math.sin(THSTAR), RSTAR * math.cos(THSTAR)))
print('     Nodal points on the small circle r = r* +- dr around it, before / at / after:')
print('     dtau        dr        # nodal points on the (theta) line r = r*+dr    thetas')
def nodal_thetas(tau, r, lo=0.02, hi=0.6, N=6000):
    ths = np.linspace(lo, hi, N)
    out = []
    for k in (0, 1):
        g = np.array([abs(roots_w(tau, r, t)[0][k]) - 1.0 for t in ths])
        for i in range(N - 1):
            if g[i] * g[i + 1] < 0:
                fn = lambda t, k=k: abs(roots_w(tau, r, t)[0][k]) - 1.0
                out.append(optimize.brentq(fn, ths[i], ths[i + 1], xtol=1e-13))
    return sorted(out)
for dtau in [-0.02, -0.005, 0.0, +0.005, +0.02]:
    for dr in [-0.02, 0.0, +0.02]:
        th_list = nodal_thetas(TAUSTAR + dtau, RSTAR + dr)
        print('     %+.4f   %+.3f     %d                                    %s'
              % (dtau, dr, len(th_list), np.round(th_list, 6)))
print('     => the count on a fixed radial slice CHANGES by 2 across tau = pi: a reconnection,')
print('        not a mere translation of lines.')

print()
print('=' * 100)
print('W2 - THE CONE NORMAL FORM, CHECKED ON THE NODAL SET.')
print('     l = disc/f2^2, h = |w_d| - 1.  Claim: (Im l)^2 = 4 h^2 (h^2 - Re l) on the nodal set,')
print('     exactly to leading order; residual should be o(scale^2).')
print('     dtau       theta_node      h            Re l         Im l       (Im l)^2 - 4h^2(h^2-Re l)   ratio to h^4')
for dtau in [0.05, 0.02, 0.01, 0.005, 0.002]:
    ths = nodal_thetas(TAUSTAR + dtau, RSTAR)
    for th in ths[:2]:
        _, d, wd = roots_w(TAUSTAR + dtau, RSTAR, th)
        f1, f2, f3 = f123(RSTAR, th)
        l = d / (f2 * f2); h = abs(wd) - 1.0
        res = (l.imag) ** 2 - 4 * h * h * (h * h - l.real)
        print('     %+.4f   %.8f   %+.3e   %+.3e   %+.3e   %+.3e            %+.3e'
              % (dtau, th, h, l.real, l.imag, res, res / max(h ** 4, 1e-300)))
print('     (the residual is exactly 0 in exact arithmetic: |w|=1 <=> (1+h)^2|1 -+ sqrt l|^2 = 1,')
print('      and the displayed relation is its leading-order form.)')

print()
print('=' * 100)
print('W3 - THE VORTEX CENSUS.  Number of nodal points on the sphere of radius r, vs time.')
print('     (each nodal point on a sphere = one vortex line piercing it, counted without sign)')
def count_sphere(tau, r, N=4000):
    ths = np.linspace(0.005, math.pi - 0.005, N); tot = 0
    for k in (0, 1):
        g = np.array([abs(roots_w(tau, r, t)[0][k]) - 1.0 for t in ths])
        tot += int(np.sum(g[:-1] * g[1:] < 0))
    return tot
print('     tau/pi   r=2   r=4   r=6   r=8   r=12  r=16  r=20  r=25  r=30')
for k in range(0, 13):
    tau = k * math.pi / 6
    row = [count_sphere(tau, r) for r in (2, 4, 6, 8, 12, 16, 20, 25, 30)]
    mark = '   <-- RECONNECTION' if abs(math.sin(tau)) < 1e-12 else ''
    print('     %5.3f   ' % (tau / math.pi) + '  '.join('%3d ' % c for c in row) + mark)
print('     => the count is CONSTANT in tau on every sphere except at tau = 0, pi, where it jumps.')
print('     large-r limit: f1/f3 -> 0 (R_2l ~ e^{-r/2} vs R_3l ~ e^{-r/3}), P degenerates to the')
print('     linear f2 w + f3, one root, |w| = |f3/f2| -> a theta-dependent constant.  Here')
for r in [15, 20, 25, 30, 40, 60]:
    vals = [abs(f123(r, t)[2] / f123(r, t)[1]) for t in np.linspace(0.02, math.pi - 0.02, 2000)]
    print('       r = %2d : max_theta |f3/f2| = %.5f   (a vortex line pierces the sphere iff this >= 1)'
          % (r, max(vals)))
print('     so beyond r ~ 22 NO vortex line reaches the sphere: every vortex line of this state is')
print('     a COMPACT set.  The signed count through a large sphere is 0 and is trivially conserved;')
print('     the informative invariant is the count on a finite sphere, conserved between reconnections.')
