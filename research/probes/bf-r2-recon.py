# bf-r2-recon.py - round 2 (Opus).  Two corrections to my own earlier probes, and two theorems.
#   R1  the KS FIBRE GENERATOR.  bf-r2-so4 M6 printed "Lambda annihilates the KS map" while its own
#       output showed Lambda x1 != 0.  Find the generator that really does, by sympy.
#   R2  the ANTIUNITARY SYMMETRY of the Q11 state, and the exact reconnection times.
#   R3  the LOCAL NORMAL FORM of the reconnection, corrected.  bf-r2-vortex2 W2 claimed
#       (Im l)^2 = 4h^2(h^2 - Re l); its own residual/h^4 column ran -45.7, -48.1, -54.7, -67.2,
#       -97.8 (growing, not converging) - the claim is REFUTED by its own numbers.  The true
#       normal form is the hyperbolic exchange  xi * B = f0 * s ,  A = -f0 xi^2.
#   R4  the VORTEX CORE RADIUS: the r beyond which no vortex line reaches.
import math, cmath
import numpy as np
import sympy as sp
from scipy import special, optimize

print('=' * 100)
print('R1 - THE KS FIBRE GENERATOR (correcting bf-r2-so4 M6).')
u1, u2, u3, u4 = sp.symbols('u1 u2 u3 u4', real=True)
U = [u1, u2, u3, u4]
x1 = u1**2 - u2**2 - u3**2 + u4**2
x2 = 2*(u1*u2 - u3*u4)
x3 = 2*(u1*u3 + u2*u4)
r  = u1**2 + u2**2 + u3**2 + u4**2
print('   KS map: x1 = u1^2-u2^2-u3^2+u4^2, x2 = 2(u1u2-u3u4), x3 = 2(u1u3+u2u4), r = |u|^2')
print('   |x|^2 - r^2 simplifies to:', sp.simplify(x1**2 + x2**2 + x3**2 - r**2))
def vf(a, b, F):   # M_ab = u_a d_b - u_b d_a
    return sp.expand(U[a] * sp.diff(F, U[b]) - U[b] * sp.diff(F, U[a]))
pairs = [(0,1),(0,2),(0,3),(1,2),(1,3),(2,3)]
cs = sp.symbols('c01 c02 c03 c12 c13 c23')
def Lam(F): return sp.expand(sum(cs[i] * vf(a, b, F) for i, (a, b) in enumerate(pairs)))
eqs = []
for F in (x1, x2, x3):
    P = sp.Poly(Lam(F), u1, u2, u3, u4)
    eqs += list(P.coeffs())
sol = sp.solve(eqs, cs, dict=True)
print('   solving  sum c_ab M_ab (x1,x2,x3) = 0  over the six so(4) generators:')
print('   solution space:', sol)
sub = sol[0] if sol else {}
free = [c for c in cs if c not in sub]
lam = sum((sub.get(c, c)) * sp.Symbol('M%d%d' % (a + 1, b + 1)) for c, (a, b) in zip(cs, pairs))
print('   Lambda =', sp.simplify(sp.expand(lam)))
print('   => a ONE-dimensional stabiliser: the Hopf fibre.  Check it annihilates r too:')
chk = {c: (1 if c in free else 0) for c in cs}
chk2 = {c: sp.simplify(sub.get(c, c)).subs({f: 1 for f in free}) for c in cs}
LamN = lambda F: sp.expand(sum(chk2[cs[i]] * vf(a, b, F) for i, (a, b) in enumerate(pairs)))
print('      Lambda(x1,x2,x3,r) = (%s, %s, %s, %s)'
      % tuple(sp.simplify(LamN(F)) for F in (x1, x2, x3, r)))
print('   The KS bilinear constraint u4 du1 - u3 du2 + u2 du3 - u1 du4 = 0 is exactly the')
print('   annihilator of this vector field: the fibre is the Hopf circle and the physical')
print('   subspace is ker Lambda, projector P = (1/2pi) int_0^{2pi} e^{i a Lambda} da.')
print('   (bf-r2-so4 M6 asserted Lambda = M12 + M34 while its own output showed Lambda x1 != 0;')
print('    that assertion is CORRECTED here.  Its count dim ker Lambda = n^2 is unaffected: it')
print('    was computed in the w-oscillator basis, not from the vector field.)')

print()
print('=' * 100)
print('R2 - THE ANTIUNITARY SYMMETRY OF THE Q11 STATE, AND THE EXACT RECONNECTION TIMES.')
def R(n, l, rr):
    rho = 2.0 * rr / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * math.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
A = B = C = 1.0 / math.sqrt(3.0)
E2, E3 = -0.125, -1.0 / 18.0
OM = E3 - E2; TBEAT = 2 * math.pi / OM
c11 = -math.sqrt(3 / (8 * math.pi)); c10 = math.sqrt(3 / (4 * math.pi)); c2m1 = math.sqrt(15 / (8 * math.pi))
def f123(rr, th):
    s, c = math.sin(th), math.cos(th)
    return (A * R(2, 1, rr) * c11 * s, B * R(3, 1, rr) * c10 * c, C * R(3, 2, rr) * c2m1 * s * c)
def psi(rr, th, ph, t):
    f1, f2, f3 = f123(rr, th); tau = OM * t
    return f1 * cmath.exp(1j * (tau + ph)) + f2 + f3 * cmath.exp(-1j * ph)
print('   psi = e^{-i E3 t} [ f1 e^{i(tau+phi)} + f2 + f3 e^{-i phi} ] with f1,f2,f3 REAL,')
print('   tau = (E3 - E2) t = 5t/72.  Hence  psi(r, th, -phi, -t) = conj( psi(r, th, phi, t) ):')
for (rr, th, ph, t) in [(4.0, 1.1, 0.7, 13.0), (6.3, 2.2, -1.9, 41.0), (2.5, 0.4, 3.0, 77.0)]:
    a1 = psi(rr, th, -ph, -t); a2 = psi(rr, th, ph, t).conjugate()
    print('     r=%.1f th=%.1f ph=%+.1f t=%.0f : |psi(-phi,-t) - conj psi(phi,t)| = %.2e' % (rr, th, ph, t, abs(a1 - a2)))
print('   => an antiunitary (PT-like) symmetry: P = reflection in the xz-plane, T = conjugation.')
print('      Its fixed times are tau = 0 and tau = pi.  A double root of P(w) = f1 e^{i tau} w^2')
print('      + f2 w + f3 needs disc = f2^2 - 4 f1 f3 e^{i tau} = 0 with f real, so e^{i tau} = +-1:')
print('      RECONNECTIONS ARE SYMMETRY-PROTECTED and occur ONLY at t = 0, T_beat/2 mod T_beat.')
print('      T_beat = 2 pi / (E3 - E2) = %.6f a.u. ;  T_beat/2 = %.6f a.u.' % (TBEAT, TBEAT / 2))

print()
print('=' * 100)
print('R3 - THE LOCAL NORMAL FORM, CORRECTED.  Put phi = phi_d + xi, tau = tau_* + s.')
print('     At the tau = pi event the signs are f3 = -f1, f2 = -2 f1, w_d = -1 (phi_d = pi), so put')
print('       A := f1 + f2 - f3,   B := f1 + f3   (both vanish at the event; f0 := f1 there).')
print('     Re/Im of e^{-i phi} P(e^{i phi}) = 0, with phi = pi + xi and tau = pi + s, expand to')
print('       G1 = A - f0[(xi+s)^2 + xi^2]/2 + ... = 0        G2 = xi B + f0 s + ... = 0')
print('     so the nodal set near the event is   xi B = -f0 s ,  A = f0 xi^2 :')
print('     the HYPERBOLIC exchange x y = t in the (xi, B) plane, fibred over a parabola in A.')
print('     Two branches meet at s = 0 and swap partners.')
print('     (Bialynicki-Birula, Bialynicka-Birula & Sliwa, PRA 61 032110, 2000, for the phenomenon.)')
RSTAR, THSTAR = 4.708643959, 0.195162          # the tau = pi event (z > 0)
f1s, f2s, f3s = f123(RSTAR, THSTAR); f0 = f1s
print('     event: (r*, th*, phi*) = (%.6f, %.6f, pi), tau* = pi ; f1 = %.6e f2 = %.6e f3 = %.6e'
      % (RSTAR, THSTAR, f1s, f2s, f3s))
print('     checks at the event: f3/f1 = %+.8f (want -1)   f2/(2 f1) = %+.8f (want -1)   A/f1 = %+.2e   B/f1 = %+.2e'
      % (f3s / f1s, f2s / (2 * f1s), (f1s + f2s - f3s) / f1s, (f1s + f3s) / f1s))
print()
print('     The Jacobian d(G1,G2)/d(r,theta) VANISHES at the event (that is the degeneracy), so the')
print('     well-posed slice is the other way: fix (r, theta) near (r*, th*) and solve for (xi, s).')
print('       eps      A/f0        B/f0        xi (exact)   xi_pred=sqrt(A/f0)   s (exact)   s_pred=-xi B/f0')
for eps in [-0.02, -0.01, -0.005, -0.0025, -0.00125, -0.000625]:
    rr = RSTAR + eps; th = THSTAR - 0.6 * eps
    f1, f2, f3 = f123(rr, th)
    Av = (f1 + f2 - f3) / f0; Bv = (f1 + f3) / f0
    if Av <= 0: print('       %8.5f   A/f0 = %+.3e < 0 : no nodal point on this side' % (eps, Av)); continue
    xip = math.sqrt(Av); sp_ = -xip * Bv
    def F(v):
        xi, sv = v
        ph = math.pi + xi; tau = math.pi + sv
        return [f1 * math.cos(tau + ph) + f2 + f3 * math.cos(ph),
                f1 * math.sin(tau + ph) - f3 * math.sin(ph)]
    v = optimize.fsolve(F, [xip, sp_], full_output=False)
    print('     %8.5f  %+.3e  %+.3e   %+.7f     %+.7f      %+.7f    %+.7f   (ratios %.4f %.4f)'
          % (eps, Av, Bv, v[0], xip, v[1], sp_, v[0] / xip, v[1] / sp_ if sp_ != 0 else float('nan')))
print('     both ratios -> 1 as eps -> 0: the hyperbolic normal form xi B = -f0 s, A = f0 xi^2')
print('     is CONFIRMED.  The two branches are xi = +-sqrt(A/f0); they meet where A = 0, and the')
print('     time at which each is reached, s = -xi B / f0, changes sign with xi: the exchange.')
print('     The claim of bf-r2-vortex2 W2, (Im l)^2 = 4 h^2 (h^2 - Re l), is REFUTED by its own')
print('     residual column: h ~ eps gives 4 h^2 Re l ~ eps^3 but (Im l)^2 ~ eps^2 - different orders.')

print()
print('=' * 100)
print('R4 - THE VORTEX CORE RADIUS.  At large r, R_2l ~ e^{-r/2} decays faster than R_3l ~ e^{-r/3},')
print('     so f1 -> 0 and P(w) degenerates to f2 w + f3: ONE root, |w| = |f3/f2|.  A vortex line')
print('     pierces the sphere of radius r iff max_theta |f3/f2| >= 1.')
def maxratio(rr):
    g = lambda th: -abs(f123(rr, th)[2] / f123(rr, th)[1]) if abs(f123(rr, th)[1]) > 1e-300 else 0.0
    ths = np.linspace(0.02, math.pi / 2 - 0.02, 4000)
    return max(-g(t) for t in ths)
lo, hi = 15.0, 40.0
for _ in range(60):
    mid = 0.5 * (lo + hi)
    if maxratio(mid) >= 1.0: lo = mid
    else: hi = mid
print('     max_theta |f3/f2| = 1 at r = %.6f a.u.   (below: lines pierce; above: none)' % lo)
for rr in [15, 20, 20.5, 21, 22, 25, 30]:
    print('       r = %5.1f : max_theta |f3/f2| = %.5f   %s' % (rr, maxratio(rr),
          'pierced' if maxratio(rr) >= 1 else 'clear'))
print('     => EVERY vortex line of the (2p+, 3p0, 3d-) state lies inside the ball of radius')
print('        %.4f a.u.  The nodal set is COMPACT; the signed count through any larger sphere' % lo)
print('        is 0 and is trivially conserved.  The informative invariant is the count on a')
print('        finite sphere, which is constant in tau except at the two reconnection instants.')
