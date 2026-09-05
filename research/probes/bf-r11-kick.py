#!/usr/bin/env python
"""bf-r11-kick.py — Round 11 audit, §1: the SLAP's anchors, exactly (sympy).

Checks, independently of the lab:
  (1) bound oscillator strengths f_{1s->np}, n<=6, against the literature
      (0.4162, 0.0791, 0.0290, 0.0139, 0.0078)
  (2) the escaped-fraction coefficient 1 - sum_{reg}|z_{1s,a}|^2  (claimed 0.303)
  (3) the Ehrenfest deficit <p_z> = (sum_{reg} f) * k  (claimed 0.546 k)
  (4) the TRK sum rule and how much of it the register holds
  (5) the O(k^4) correction: is 0.303 k^2 honest at the lab's k = 0.3?
"""
import sympy as sp

r, k = sp.symbols('r k', positive=True)

def Rnl(n, l):
    """hydrogen radial function, Z=1, normalised: int R^2 r^2 dr = 1"""
    rho = 2*r/n
    L = sp.assoc_laguerre(n-l-1, 2*l+1, rho)
    N = sp.sqrt((sp.Rational(2,n))**3 * sp.factorial(n-l-1)/(2*n*sp.factorial(n+l)))
    return sp.simplify(N * sp.exp(-rho/2) * rho**l * L)

# sanity: normalisation
for n in range(1,7):
    for l in range(0,n):
        v = sp.integrate(Rnl(n,l)**2 * r**2, (r,0,sp.oo))
        assert sp.simplify(v-1)==0, (n,l,v)
print("radial normalisation: exact 1 for all 21 (n,l)  [DERIVED-HERE]")

# <1s|z|np0> = <R10|r|Rn1> * <Y00|cos t|Y10> ; <Y00|cos|Y10> = 1/sqrt(3)
print()
print(" n   <1s|z|np>            |z|^2          dE            f = 2 dE |z|^2   lit")
lit = {2:0.4162, 3:0.0791, 4:0.0290, 5:0.0139, 6:0.0078}
sum_f = sp.Integer(0); sum_z2 = sp.Integer(0)
rows=[]
for n in range(2,7):
    rad = sp.integrate(Rnl(1,0)*Rnl(n,1)*r**3, (r,0,sp.oo))
    z = sp.simplify(rad/sp.sqrt(3))
    z2 = sp.simplify(z**2)
    dE = sp.Rational(1,2) - sp.Rational(1,2*n*n)
    f = sp.simplify(2*dE*z2)
    sum_f += f; sum_z2 += z2
    rows.append((n,z,z2,dE,f))
    print(f"{n:2d}  {sp.nsimplify(z)}   {float(z2):.10f}  {float(dE):.8f}  {float(f):.10f}   {lit[n]}")
print()
print("sum f (n<=6, bound, register)  =", sp.nsimplify(sum_f), "=", float(sum_f))
print("sum |z|^2 (n<=6)               =", sp.nsimplify(sum_z2), "=", float(sum_z2))
# <1s|z^2|1s> = <r^2>/3 = 3/3 = 1
z2_full = sp.integrate(Rnl(1,0)**2*r**4,(r,0,sp.oo))/3
print("<1s|z^2|1s> = <r^2>/3          =", z2_full, "=", float(z2_full))
esc = sp.simplify(z2_full - sum_z2)
print("escaped coefficient 1 - sum|z|^2 =", sp.nsimplify(esc), "=", float(esc), "  (lab claims 0.303)")
print()
# TRK: sum over ALL bound states of f_{1s->np}
# closed form (Bethe-Salpeter): f_{1s->np} = 256 n^5 (n-1)^{2n-4} / (3 (n+1)^{2n+4})
n_ = sp.symbols('n', positive=True, integer=True)
fclosed = 256*n_**5*(n_-1)**(2*n_-4)/(3*(n_+1)**(2*n_+4))
print("closed form check f_{1s->np} = 256 n^5 (n-1)^{2n-4} / (3 (n+1)^{2n+4}):")
for n in range(2,7):
    print(f"   n={n}: {float(fclosed.subs(n_,n)):.10f}")
tot = sum(float(fclosed.subs(n_,n)) for n in range(2,2000))
print(f"sum over ALL bound n (to 2000) = {tot:.6f}   -> continuum share = {1-tot:.6f}")
print(f"register share (n<=6)          = {float(sum_f):.6f}")
print(f"bound n>6 share                = {tot-float(sum_f):.6f}")
print()
# (5) the exact escape at finite k: 1 - sum_{a in reg} |<a|e^{ikz}|1s>|^2 is NOT k^2*0.303.
# leading behaviour: escape(k) = k^2*C2 + k^4*C4 + ...
# C4 term: expand e^{ikz} = 1 + ikz - k^2 z^2/2 - i k^3 z^3/6 + k^4 z^4/24
# norm captured = sum_a |<a|e^{ikz}|1s>|^2 ; full norm 1.
# <1s|z^4|1s> etc needed; do it numerically instead in the mjs probe against the lab.
print("O(k^4): see bf-r11-kick.mjs, which measures the LAB's own escape at k=0.1..1.0")
