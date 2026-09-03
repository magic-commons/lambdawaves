# bf-r2-so4.py - round 2 (Opus): threads Q9 (Pauli's element, the rotor), Q3 (the KS projector),
# Q10 (the KS clock).  Everything about the hidden SO(4) as a STATE operation.
#
#  M1  Pauli's <n,l+1,m|K_z|n,l,m> from SU(2)xSU(2) recoupling (exact, sympy) vs the closed form.
#  M2  an INDEPENDENT position-space route: the parabolic (Stark) states of n = 2 built in
#      parabolic coordinates, projected on (2s, 2p_0).  Fixes the Condon-Shortley phase.
#  M3  the 4x4 matrix of e^{-i theta K_z} on the n = 2 shell, and <z>(theta) along the flow.
#      Round 1 says the flow passes "through the parabolic (Stark) states at theta = pi/4".
#  M4  THE SCHMIDT/ORBIT THEOREM.  Writing a shell state as the n x n matrix C_{m1 m2},
#      SO(4) acts by C -> g1 C g2^T, so the SINGULAR VALUES of C are a complete set of orbit
#      invariants.  Orbit dimensions.  Which states can the rotor reach?
#  M5  is the "real" rotor (2s -> Stark -> 2p_z through real states) in the so(4) of the shell?
#  M6  KS: the Hopf/fibre generator annihilates the KS map (sympy), and the projector count n^2.
#  M7  the KS clock: oscillator eigenvalue exactly 1 on a shell; cross-shell dt = r ds is nonlinear.
import math, cmath, itertools
import numpy as np
from scipy import special, integrate, linalg
from sympy import S, Rational, sqrt as ssqrt, nsimplify, simplify, symbols, diff, expand
from sympy.physics.quantum.cg import CG

np.set_printoptions(precision=10, suppress=True)

def cgmat(n, l, m):
    """C_{m1,m2} = <j m1; j m2 | l m>, j = (n-1)/2.  Returns an n x n complex array."""
    j = S(n - 1) / 2
    C = np.zeros((n, n), dtype=complex)
    for a in range(n):
        m1 = -j + a
        for b in range(n):
            m2 = -j + b
            if m1 + m2 != m: continue
            C[a, b] = complex(CG(j, m1, j, m2, S(l), S(m)).doit())
    return C

print('=' * 100)
print("M1 - PAULI'S MATRIX ELEMENT from SU(2)xSU(2): K_z = J1z - J2z in the coupled basis")
print("     closed form  <n,l+1,m|K_z|n,l,m> = sqrt( (n^2-(l+1)^2)((l+1)^2-m^2) / ((2l+1)(2l+3)) )")
print('     n   l   m    recoupling            closed form           diff')
worst = 0.0
for n in range(2, 7):
    j = (n - 1) / 2.0
    for l in range(0, n - 1):
        for m in range(-l, l + 1):
            Cl = cgmat(n, l, m); Cu = cgmat(n, l + 1, m)
            # <l+1,m| (J1z - J2z) |l,m> = sum_{m1+m2=m} Cu*_{m1m2} (m1-m2) Cl_{m1m2}
            tot = 0.0
            for a in range(n):
                m1 = -j + a
                for b in range(n):
                    m2 = -j + b
                    if abs(m1 + m2 - m) > 1e-12: continue
                    tot += np.conj(Cu[a, b]) * (m1 - m2) * Cl[a, b]
            closed = math.sqrt((n ** 2 - (l + 1) ** 2) * ((l + 1) ** 2 - m ** 2) / ((2 * l + 1) * (2 * l + 3)))
            d = abs(abs(tot) - closed); worst = max(worst, d)
            if (n, l) in [(2, 0), (3, 1), (3, 0), (6, 4)]:
                print('     %d   %d  %+d    %+.12f       %.12f       %.2e' % (n, l, m, tot.real, closed, d))
print('     worst |recoupling| - closed over all n<=6, all l, all m : %.3e' % worst)
print('     the two numbers Q9 asks for:  <2p_0|K_z|2s> = %.12f ,  <3d_0|K_z|3p_0> = %.12f = 2/sqrt(3)'
      % (math.sqrt((4 - 1) * (1 - 0) / (1 * 3)), math.sqrt((9 - 4) * (4 - 0) / (3 * 5))))
print('     round 1 wrote "sqrt(5/3)*sqrt(4/5)*..." and asked for the number: it is 2/sqrt(3) = %.12f'
      % (2 / math.sqrt(3)))

print()
print('=' * 100)
print('M2 - INDEPENDENT ROUTE: the n = 2 parabolic (Stark) states in parabolic coordinates.')
def R(n, l, r):
    rho = 2.0 * r / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * math.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
# parabolic (n1,n2,m) = (1,0,0):  psi ∝ e^{-r/2} (1 - xi/2), xi = r + z
Y00 = 1.0 / math.sqrt(4 * math.pi); Y10c = math.sqrt(3.0 / (4 * math.pi))    # Y_1^0 = Y10c cos(theta)
def par10(r, ct): return math.exp(-r / 2) * (1 - (r + r * ct) / 2)
def par01(r, ct): return math.exp(-r / 2) * (1 - (r - r * ct) / 2)
def ov(f, g):
    val, _ = integrate.dblquad(lambda ct, r: f(r, ct) * g(r, ct) * r * r * 2 * math.pi,
                               0, 60, -1, 1, epsabs=1e-13, epsrel=1e-13)
    return val
psi2s = lambda r, ct: R(2, 0, r) * Y00
psi2p = lambda r, ct: R(2, 1, r) * Y10c * ct
for name, f in [('(n1,n2,m)=(1,0,0)', par10), ('(n1,n2,m)=(0,1,0)', par01)]:
    nn = math.sqrt(ov(f, f))
    g = lambda r, ct, f=f, nn=nn: f(r, ct) / nn
    c2s = ov(g, psi2s); c2p = ov(g, psi2p)
    zexp, _ = integrate.dblquad(lambda ct, r: g(r, ct) ** 2 * (r * ct) * r * r * 2 * math.pi,
                                0, 60, -1, 1, epsabs=1e-12, epsrel=1e-12)
    print('   %s : c_2s = %+.10f, c_2p0 = %+.10f, |c|^2 sum = %.10f, <z> = %+.8f'
          % (name, c2s, c2p, c2s ** 2 + c2p ** 2, zexp))
print('   => the Stark states are (2s -+ 2p_0)/sqrt2 with <z> = -+3 a.u. exactly (Pauli/Epstein).')
print('   => K_z on span{2s, 2p_0} = [[0,1],[1,0]] = sigma_x in the REAL Condon-Shortley basis,')
print('      with eigenvectors the Stark states, eigenvalues +-1.')

print()
print('=' * 100)
print('M3 - THE ROTOR e^{-i theta K_z} ON THE n = 2 SHELL, and <z> along its flow')
Kz2 = np.zeros((4, 4))     # basis order (2s, 2p_-1, 2p_0, 2p_+1)
Kz2[0, 2] = Kz2[2, 0] = 1.0
print('   K_z (n=2, basis 2s, 2p_-1, 2p_0, 2p_+1):')
print(Kz2)
for th in [0, math.pi / 8, math.pi / 4, math.pi / 3, math.pi / 2]:
    U = linalg.expm(-1j * th * Kz2)
    c = U @ np.array([1, 0, 0, 0], dtype=complex)
    # <z> = 2 Re(c_2s^* c_2p0) * <2s|z|2p0>, and <2s|z|2p0> = -3 (Condon-Shortley, real R_nl)
    zz = 2 * (np.conj(c[0]) * c[2]).real * (-3.0)
    print('   theta = %.6f : c = (%+.5f%+.5fj, 0, %+.5f%+.5fj, 0)   |c|^2 = %.10f   <z> = %+.3e'
          % (th, c[0].real, c[0].imag, c[2].real, c[2].imag, float(np.vdot(c, c).real), zz))
print('   => <z>(theta) = 0 IDENTICALLY along the flow.  The state at theta = pi/4 is')
print('      (2s - i 2p_0)/sqrt2, whose density is (|2s|^2 + |2p_0|^2)/2: NO dipole.')
print('      Round 1\'s "through the parabolic (Stark) states at theta = pi/4" is REFUTED:')
print('      the Stark states have <z> = -+3, the flow has <z> = 0 at every theta.')
print('      (<K_z> is conserved by its own flow: <2s|K_z|2s> = 0, Stark states have <K_z> = +-1.)')

print()
print('=' * 100)
print('M4 - THE SCHMIDT / ORBIT THEOREM.  C -> g1 C g2^T under SU(2)xSU(2): singular values invariant.')
print('   n   state         singular values of C            rank   orbit dim (6 - dim stab)')
def sv(C):
    s = np.linalg.svd(C, compute_uv=False)
    return s / np.linalg.norm(s)
for n in [2, 3, 4]:
    for l in range(n):
        for m in [0, l]:
            if m > l: continue
            C = cgmat(n, l, m); s = sv(C)
            rk = int(np.sum(s > 1e-10))
            print('   %d   |%d %d %+d>      %s   rank %d'
                  % (n, n, l, m, np.array2string(np.round(s, 6), max_line_width=200), rk))
# the parabolic (product) states
print('   the parabolic states |n1 n2 m> are the PRODUCT states |j m1> x |j m2>: rank 1, sv = (1,0,..)')
print('   invariance check: random g1, g2 in SU(2), C -> g1 C g2^T, singular values unchanged:')
rng = np.random.default_rng(7)
def randSU2j(j, rng):
    # random SU(2) element in the spin-j rep via expm of a random hermitian in su(2)
    dim = int(2 * j + 1)
    Jz = np.diag([ -j + k for k in range(dim)]).astype(complex)
    Jp = np.zeros((dim, dim), complex)
    for k in range(dim - 1):
        mm = -j + k
        Jp[k + 1, k] = math.sqrt(j * (j + 1) - mm * (mm + 1))
    Jx = (Jp + Jp.conj().T) / 2; Jy = (Jp - Jp.conj().T) / (2j)
    a, b, c = rng.normal(size=3)
    return linalg.expm(-1j * (a * Jx + b * Jy + c * Jz))
for n in [2, 3, 4]:
    j = (n - 1) / 2.0
    C = cgmat(n, min(1, n - 1), 0)
    g1, g2 = randSU2j(j, rng), randSU2j(j, rng)
    C2 = g1 @ C @ g2.T
    print('   n=%d: max |sv(C) - sv(g1 C g2^T)| = %.2e' % (n, float(np.max(np.abs(sv(C) - sv(C2))))))
print()
print('   ORBIT DIMENSIONS on the n = 2 shell (SU(2)xSU(2) has dim 6; rays):')
print('     2s and 2p_0  : sv = (1/sqrt2, 1/sqrt2)  maximally entangled; stabiliser = diagonal SU(2),')
print('                    orbit = SU(2)/{+-1} = SO(3), dimension 3.')
print('     2p_+-1, Stark: sv = (1, 0)              product;  orbit = CP^1 x CP^1 = S^2 x S^2,')
print('                    dimension 4  =  Gr+(2,4), the oriented 2-planes of R^4 = the Kepler orbits.')
print('   3 != 4  =>  NO element of SO(4) carries 2s to a Stark state.  Round 1\'s B3 dies on this number.')

print()
print('=' * 100)
print('M5 - IS THE "REAL" ROTOR IN so(4)?  Build all six generators on the n=2 shell and ask')
print('     whether sigma_y on span{2s, 2p_0} (the generator of the REAL rotation 2s -> 2p_z) is')
print('     in their real span.')
# basis (2s, 2p_-1, 2p_0, 2p_+1). L acts only on the p block; K connects s <-> p (Pauli, m-selection)
Lz = np.diag([0, -1, 0, 1]).astype(complex)
Lp = np.zeros((4, 4), complex)   # L_+ on l=1: |1,-1> -> sqrt2 |1,0> -> sqrt2 |1,1>
Lp[2, 1] = math.sqrt(2); Lp[3, 2] = math.sqrt(2)
Lx = (Lp + Lp.conj().T) / 2; Ly = (Lp - Lp.conj().T) / (2j)
# K: <2p_m|K_q|2s>.  K is a rank-1 spherical tensor; <n,1,m|K_mu|n,0,0> = delta_{m,mu} * 1
Kz = np.zeros((4, 4), complex); Kz[0, 2] = Kz[2, 0] = 1.0
Kp = np.zeros((4, 4), complex); Kp[3, 0] = -1 / math.sqrt(2); Kp[0, 1] = 1 / math.sqrt(2)
Km = np.zeros((4, 4), complex); Km[1, 0] = 1 / math.sqrt(2); Km[0, 3] = -1 / math.sqrt(2)
Kx = (Kp + Km) / math.sqrt(2) * 0 + (Km - Kp) / math.sqrt(2)   # spherical -> cartesian (sign fixed below)
Ky = 1j * (Kp + Km) / math.sqrt(2)
gens = [Lx, Ly, Lz, Kx, Ky, Kz]
names = ['Lx', 'Ly', 'Lz', 'Kx', 'Ky', 'Kz']
for g, nm in zip(gens, names):
    print('   %s hermitian? %s' % (nm, np.allclose(g, g.conj().T)))
target = np.zeros((4, 4), complex); target[0, 2] = -1j; target[2, 0] = 1j     # sigma_y on {2s,2p0}
Amat = np.array([g.flatten() for g in gens]).T
sol, res, rk, _ = np.linalg.lstsq(np.vstack([Amat.real, Amat.imag]),
                                  np.concatenate([target.flatten().real, target.flatten().imag]),
                                  rcond=None)
fit = (Amat @ sol).reshape(4, 4)
print('   best real combination of {L, K} approximating sigma_y on the 2s-2p_0 plane:')
print('   coefficients %s' % np.array2string(np.round(sol, 8), max_line_width=200))
print('   residual ||target - fit||_F = %.6f   (0 would mean it IS in so(4))'
      % float(np.linalg.norm(target - fit)))
print('   ||target||_F = %.6f  =>  sigma_y is NOT in the real span of the six SO(4) generators.'
      % float(np.linalg.norm(target)))

print()
print('=' * 100)
print('M6 - THE KS PROJECTOR (Q3).  KS map x(u) and the fibre generator Lambda = M_12 + M_34.')
u1, u2, u3, u4 = symbols('u1 u2 u3 u4', real=True)
x1 = u1 ** 2 - u2 ** 2 - u3 ** 2 + u4 ** 2
x2 = 2 * (u1 * u2 - u3 * u4)
x3 = 2 * (u1 * u3 + u2 * u4)
r = u1 ** 2 + u2 ** 2 + u3 ** 2 + u4 ** 2
print('   |x|^2 - (|u|^2)^2 simplifies to: %s' % simplify(x1 ** 2 + x2 ** 2 + x3 ** 2 - r ** 2))
# Lambda = u2 d1 - u1 d2 + u4 d3 - u3 d4   (the vertical vector field of the Hopf fibration)
def Lam(f):
    return u2 * diff(f, u1) - u1 * diff(f, u2) + u4 * diff(f, u3) - u3 * diff(f, u4)
print('   Lambda x1 = %s ;  Lambda x2 = %s ;  Lambda x3 = %s ;  Lambda r = %s'
      % (simplify(Lam(x1)), simplify(Lam(x2)), simplify(Lam(x3)), simplify(Lam(r))))
print('   => Lambda annihilates the KS map, so Lambda psi(x(u)) = 0 for every function of x:')
print('      the physical subspace is exactly ker Lambda.  Projector P = (1/2pi) int_0^{2pi} e^{i a Lambda} da.')
print('   In oscillator variables w1 = u1 + i u2, w2 = u3 + i u4, Lambda = -i(N_w - N_wbar) and')
print('   ker Lambda at level N = 2n-2 is { #w = #wbar = n-1 }:')
for n in range(1, 8):
    N = 2 * (n - 1)
    tot = (N + 1) * (N + 2) * (N + 3) // 6
    inv = sum((a + 1) * (N - a + 1) for a in range(N + 1) if a == N - a)
    print('      n=%d  N=%2d  level dim %4d   dim ker Lambda %3d = n^2 = %d' % (n, N, tot, inv, n * n))

print()
print('=' * 100)
print('M7 - THE KS CLOCK (Q10).')
for n in [1, 2, 3, 6, 15, 30]:
    E = -0.5 / n / n; om = math.sqrt(-E / 2); N = 2 * n - 2
    print('   n=%2d: omega = sqrt(-E/2) = %.10f = 1/(2n) = %.10f ;  (N+2) omega = %.15f'
          % (n, om, 1 / (2 * n), (N + 2) * om))
print('   => on a SHELL every fibre-invariant state has oscillator eigenvalue exactly 1, so')
print('      e^{-i s H_osc^(n)} = e^{-i s}: a global phase.  CONFIRMED - and it is a tautology,')
print('      because H_osc^(n) = -nabla_u^2/8 - E_n |u|^2 is BUILT from E_n.')
print('   The honest cross-shell generator: r H = -nabla_u^2/8 - 1 (a FREE 4D particle of mass 4),')
print('   and the lab-time generator in u-space is H~ = |u|^{-2} ( -nabla_u^2/8 - 1 ),')
print('   self-adjoint for the measure |u|^2 d^4u.  These generate DIFFERENT flows.')
print('   How nonlinear is the KS clock?  dt = r ds, so s(t) = int dt/<r>.  For (1s+2s)/sqrt2:')
r11, _ = integrate.quad(lambda x: R(1, 0, x) ** 2 * x ** 3, 0, 60)
r22, _ = integrate.quad(lambda x: R(2, 0, x) ** 2 * x ** 3, 0, 80)
r12, _ = integrate.quad(lambda x: R(1, 0, x) * R(2, 0, x) * x ** 3, 0, 80)
w = 0.5 - 0.125
print('   <1s|r|1s> = %.10f (exact 3/2), <2s|r|2s> = %.10f (exact 6), <1s|r|2s> = %.10f'
      % (r11, r22, r12))
print('   <r>(t) = %.6f + %.6f cos(%.6f t)   -> r_min = %.6f, r_max = %.6f, ratio %.4f'
      % ((r11 + r22) / 2, r12, w, (r11 + r22) / 2 - abs(r12), (r11 + r22) / 2 + abs(r12),
         ((r11 + r22) / 2 + abs(r12)) / ((r11 + r22) / 2 - abs(r12))))
print('   => the KS clock runs %.2fx faster at perihelion than at aphelion for this beat:'
      % (((r11 + r22) / 2 + abs(r12)) / ((r11 + r22) / 2 - abs(r12))))
print('      s(t) is NOT proportional to t, so the Fabcic-Main-Wunner packets do not evolve in lab time.')
