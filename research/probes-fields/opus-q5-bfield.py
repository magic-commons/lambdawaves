#!/usr/bin/env python
"""OPUS Q5 — the Biot-Savart field of the 2p_{+1} probability current, settled.

P5 says 0.43 T at 1 a0 on the axis (extended current).  The LIT digest says 6.3 T ("B of one mu_B at
1 a0 (2p+1) = 6.26 T = alpha^2/2 a.u.").  Both are answers to different questions and the digest's is
wrong for the axis by a factor 2 as well.

EXACT SETUP.  For an axially symmetric charge current J_phi(rho,z) the ON-AXIS field is a ring integral
    B_z(Z) = (mu_0/2) int int J_phi(rho,z) rho^2 / (rho^2 + (Z-z)^2)^{3/2} drho dz     (SI, exact)
For |n l m> the probability current is j = (m/(r sin th))|psi|^2 phi_hat and the CHARGE current is
J = -e j.  For 2p_{+1}: |psi|^2 = rho^2 e^{-r}/(64 pi) (rho = r sin th), so j_phi = rho e^{-r}/(64 pi).
In atomic units the SI prefactor is  mu_0 e / (2 a0 t_au) = 78.6480 T, so  B_z(Z) = -78.6480 * I(Z) with
    I(Z) = int_0^inf drho int_-inf^inf dz  [rho e^{-r}/(64 pi)] rho^2/(rho^2+(Z-z)^2)^{3/2}.
INDEPENDENT CHECK: at Z=0 this must equal the textbook ORBITAL HYPERFINE FIELD
    B(0) = (mu_0/4pi) 2 mu_B <r^-3>,  <r^-3>_{2p} = 1/(24 a0^3).
"""
from mpmath import mp, mpf, quad, exp, sqrt, inf, pi, sin, cos
mp.dps = 25
MU0 = mpf('1.25663706212e-6'); E_C = mpf('1.602176634e-19')
A0 = mpf('5.29177210903e-11'); TAU = mpf('2.4188843265857e-17')
MU_B = mpf('9.2740100783e-24')
PRE = MU0*E_C/(2*A0*TAU)
print(f'  SI prefactor  mu_0 e /(2 a0 t_au) = {mp.nstr(PRE, 10)} T')

def I(Z, m=1):
    f = lambda rho, z: (rho*exp(-sqrt(rho*rho+z*z))/(64*pi))*rho*rho/(rho*rho+(Z-z)**2)**mpf('1.5')
    return quad(lambda rho: quad(lambda z: f(rho, z), [-inf, Z-1, Z, Z+1, inf]), [0, 1, 3, 8, 20, inf])

print()
print('='*100)
print('  ON-AXIS B_z of the 2p_{+1} current (the electron charge makes it ANTIPARALLEL to L)')
print(f'  {"Z / a0":>8s} {"B_z / T (exact extended current)":>34s} {"point dipole 2mu_B/Z^3 / T":>28s} {"ratio":>8s}')
for Z in ['0', '0.25', '0.5', '1', '2', '5', '10', '30']:
    z = mpf(Z); Iz = I(z)
    B = -PRE*Iz
    dip = -(MU0/(4*pi))*2*MU_B/(z*A0)**3 if z > 0 else None
    print(f'  {Z:>8s} {mp.nstr(B, 8):>34s} {("%s" % mp.nstr(dip, 8)) if dip is not None else "  (divergent)":>28s} '
          f'{("%.4f" % float(B/dip)) if dip is not None else "":>8s}')
Ihf = I(mpf(0))
Bhf_text = (MU0/(4*pi))*2*MU_B/(24*A0**3)
print()
print(f'  CHECK at Z = 0:  quadrature {mp.nstr(PRE*Ihf, 10)} T   vs the textbook orbital hyperfine field')
print(f'  (mu_0/4pi) 2 mu_B <r^-3>_2p with <r^-3> = 1/(24 a0^3):  {mp.nstr(Bhf_text, 10)} T   ->  agree to '
      f'{float(abs(PRE*Ihf-Bhf_text)/Bhf_text):.2e}')
print()
print('  SETTLEMENT.  A point dipole of one Bohr magneton gives  2 mu_B/r^3 on its AXIS = 12.5168 T at 1 a0')
print('  and  mu_B/r^3 in its EQUATORIAL plane = 6.2584 T.  The digest\'s "6.3 T at 1 a0" is the EQUATORIAL')
print('  number quoted for an axial question, and BOTH are meaningless at 1 a0 because <r>_2p = 5 a0: the')
print('  field point is deep INSIDE the current.  The true on-axis value is 0.43 T, and the field never')
print('  exceeds its value AT THE NUCLEUS, 0.5216 T, which is a real, measured quantity (orbital hyperfine).')
print()
print('='*100)
print('  IS IT WORTH A PICTURE?  the ratio of the magnetic to the electric force on a 1-a.u.-fast electron')
for Z in ['1', '5', '30']:
    z = mpf(Z); B = abs(PRE*I(z))
    Efield = mpf(1)/(z*z)*mpf('5.14220675112e11')     # ~ the proton's field at Z, V/m (upper bound on E)
    v = A0/TAU
    print(f'   Z = {Z:>3s} a0:  B = {mp.nstr(B,6):>12s} T,  E <= {mp.nstr(Efield,6)} V/m,  F_B/F_E = v B/E = {mp.nstr(v*B/Efield, 6)}')
print('   Round 1 A.1 says the magnetic field is "smaller than the electric by alpha^2 v^2 ~ 1e-5".')
print('   alpha^2 = 5.325e-5; the measured ratio at 1 a0 is 1.8e-6 -- 29x smaller, because the current is')
print('   spread over ~5 a0 and the dipole law over-counts by exactly that factor inside the cloud.')
