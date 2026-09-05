#!/usr/bin/env python
"""OPUS Q1 — the closed-form Coulomb potential of a hydrogenic PAIR density, and Phi on the axis
for the superposition (1s + 2p_z)/sqrt(2) at r = 1, 3, 8 to six digits.

GENERAL LAW.  For a register state  psi = sum_a c_a R_{n_a l_a}(r) Y_{l_a m_a}, the density is
    rho = sum_{a,b} c_a c_b^*  R_a R_b  Y_{l_a m_a} Y*_{l_b m_b}
and the product of two spherical harmonics is a FINITE sum (Gaunt):
    Y_{l1 m1} Y*_{l2 m2} = sum_L G^L_{ab} Y_{L, m1-m2},
    G^L_{ab} = (-1)^{m2} sqrt((2l1+1)(2l2+1)(2L+1)/4pi) * (l1 l2 L / 0 0 0) * (l1 l2 L / m1 -m2 -(m1-m2))
with the 3j symbols, so L runs over |l1-l2| .. l1+l2 with l1+l2+L EVEN (parity) -- at most l1+l2+1 terms.
The radial factor R_a R_b is a POLYNOMIAL times exp(-beta r), beta = 1/n_a + 1/n_b, so every shell
integral is an INCOMPLETE GAMMA OF INTEGER ORDER, i.e. polynomial x exponential:
    int_0^r r'^k e^{-beta r'} dr' = k!/beta^{k+1} [1 - e^{-beta r} sum_{j<=k} (beta r)^j/j!]
    int_r^inf r'^k e^{-beta r'} dr' = k!/beta^{k+1} e^{-beta r} sum_{j<=k} (beta r)^j/j!
Hence  Phi(r,theta,phi) = sum_{L,M} Phi_LM(r) Y_LM  with every Phi_LM a finite closed form:
    Phi_LM(r) = 4pi/(2L+1) [ r^{-L-1} int_0^r rho_LM r'^{L+2} dr' + r^L int_r^inf rho_LM r'^{1-L} dr' ].
This file derives it symbolically with sympy for 1s+2p_z and checks it against two independent
numerical routes (a 1-D shell quadrature and a full 3-D quadrature).
"""
import sympy as sp
import numpy as np
from mpmath import mp, mpf, quad, exp as mexp, inf, cos, sin, pi as mpi, sqrt as msqrt
mp.dps = 30

r, rp, th, u = sp.symbols('r rp theta u', positive=True)

# --- the three Legendre components of rho for psi = (psi_1s + psi_2pz)/sqrt(2)
# rho = 1/2 [ rho_1s + rho_2p + rho_cross ]
g0_a = sp.exp(-2*rp)/sp.pi                                   # |1s|^2 : L=0
g0_b = rp**2*sp.exp(-rp)/(32*sp.pi)*sp.Rational(1,3)         # |2pz|^2 : L=0 part
g2_b = rp**2*sp.exp(-rp)/(32*sp.pi)*sp.Rational(2,3)         # |2pz|^2 : L=2 part
g1_c = rp*sp.exp(-3*rp/2)/(2*sp.sqrt(2)*sp.pi)               # 2 psi_1s psi_2pz : L=1
comps = [(0, sp.Rational(1,2)*g0_a, '1s^2 (L=0)'),
         (0, sp.Rational(1,2)*g0_b, '2pz^2 (L=0)'),
         (2, sp.Rational(1,2)*g2_b, '2pz^2 (L=2)'),
         (1, sp.Rational(1,2)*g1_c, 'cross 1s*2pz (L=1)')]

def PhiL(L, g):
    inner = sp.integrate(g*rp**(L+2), (rp, 0, r))
    outer = sp.integrate(g*rp**(1-L), (rp, r, sp.oo))
    return sp.simplify(4*sp.pi/(2*L+1)*(inner/r**(L+1) + outer*r**L))

print('='*104)
print('CLOSED FORMS (the potential of a UNIT POSITIVE charge density; the electron potential is minus this)')
tot = 0
for L, g, tag in comps:
    P = PhiL(L, g)
    tot += P                                    # on the axis P_L(1) = 1 for every L
    print(f'  {tag:22s}  Phi_L(r) = {sp.simplify(P)}')
tot = sp.simplify(tot)
print()
print('  ON THE AXIS (theta = 0, all P_L(1)=1) the electron potential is  Phi_e(z) = -[ sum_L Phi_L(z) ]:')
print('   ', sp.simplify(-tot))
f = sp.lambdify(r, -tot, 'mpmath')

print()
print('='*104)
print('Phi_e ON THE AXIS for (1s + 2p_z)/sqrt(2)   [electron charge -1; add +1/r for the proton]')
print(f'  {"z":>4s} {"Phi_e closed form":>22s} {"1-D shell quadrature":>22s} {"3-D quadrature":>20s} {"Phi_total=1/r+Phi_e":>22s}')

# --- independent route 1: 1-D shell quadrature of the same Legendre components
def phi_shell(L, gf, R):
    inner = quad(lambda t: gf(t)*t**(L+2), [0, R])
    outer = quad(lambda t: gf(t)*t**(1-L), [R, 20, 60])
    return 4*mpi/(2*L+1)*(inner/R**(L+1) + outer*R**L)
gfs = [(L, sp.lambdify(rp, g, 'mpmath'), tag) for L, g, tag in comps]

# --- independent route 2: brute 3-D quadrature of rho(x')/|x-x'|
def psi1s(R): return mexp(-R)/msqrt(mpi)
def psi2p(R, c): return R*mexp(-R/2)*c/(4*msqrt(2*mpi))
def phi3d(Z):
    def integrand(t, c):
        # t = r', c = cos theta'  ; |x - x'| with x = (0,0,Z) on the axis
        d = msqrt(Z*Z + t*t - 2*Z*t*c)
        p = (psi1s(t) + psi2p(t, c))/msqrt(2)
        return p*p*t*t/d*2*mpi
    return -quad(lambda t: quad(lambda c: integrand(t, c), [-1, 1]), [0, Z, 2*Z, 20, 60])

for Z in [mpf(1), mpf(3), mpf(8)]:
    cf = f(Z)
    sh = -sum(phi_shell(L, gf, Z) for L, gf, tag in gfs)
    d3 = phi3d(Z)
    print(f'  {float(Z):4.0f} {mp.nstr(cf, 12):>22s} {mp.nstr(sh, 12):>22s} {mp.nstr(d3, 10):>20s} {mp.nstr(1/Z + cf, 12):>22s}')

print()
print('  the same for the two PURE states (Round 1 A.2 quotes only these):')
f1s = sp.lambdify(r, -PhiL(0, g0_a), 'mpmath')
f2p = sp.lambdify(r, -sp.simplify(PhiL(0, g0_b) + PhiL(2, g2_b)), "mpmath")
for Z in [mpf(1), mpf(3), mpf(8), mpf(20)]:
    print(f'    z = {float(Z):4.0f}   |1s|^2: {mp.nstr(f1s(Z), 12):>18s}   |2pz|^2 on the axis: {mp.nstr(f2p(Z), 12):>18s}'
          f'   (2pz tail -1/z - Q/2z^3, Q=24: {mp.nstr(-1/Z - 24/(2*Z**3), 12)})')
print()
print('  A.2 quotes Phi_e(1s) = -[1-(1+r)e^{-2r}]/r  -> CONFIRMED, it is the L=0 closed form above.')
print('  A.2 gives NO closed form for the cross term, which is the only new object in Q1; it is')
print('  L = 1 with beta = 3/2 and it is the term that carries the state\'s DIPOLE.')
d = sp.integrate(sp.Rational(1,2)*g1_c*rp**3, (rp, 0, sp.oo))*4*sp.pi/3
print(f'  dipole of the pair density  d_z = int rho z d^3x = {sp.simplify(d)} = {float(d):.6f} a0'
      f'   (= <1s|z|2p0> = 128 sqrt(2)/243 = {128*np.sqrt(2)/243:.6f})')
