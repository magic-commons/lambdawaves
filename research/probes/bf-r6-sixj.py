#!/usr/bin/env python
"""bf-r6-sixj.py — Q34: the fold constant of the diagonal 6j, the Airy PROFILE across the layer,
the O(1) term c0 of D_j, and a check of the corpus's own Y-0143 numbers (D_50, D_100)."""
from mpmath import mp, mpf, mpc, sqrt, pi, gamma, factorial, airyai, fabs, nstr, findroot
import mpmath
mp.dps = 60

def delta_coef(a, b, c):
    return sqrt(factorial(a+b-c)*factorial(a-b+c)*factorial(-a+b+c)/factorial(a+b+c+1))

def sixj(j1, j2, j3, j4, j5, j6):
    def tri(a, b, c):
        return (a+b >= c) and (b+c >= a) and (c+a >= b) and ((a+b+c) % 1 == 0)
    for t in ((j1,j2,j3),(j1,j5,j6),(j4,j2,j6),(j4,j5,j3)):
        if not tri(*t): return mpf(0)
    pre = delta_coef(j1,j2,j3)*delta_coef(j1,j5,j6)*delta_coef(j4,j2,j6)*delta_coef(j4,j5,j3)
    a = [j1+j2+j3, j1+j5+j6, j4+j2+j6, j4+j5+j3]
    b = [j1+j2+j4+j5, j2+j3+j5+j6, j3+j1+j6+j4]
    lo, hi = int(max(a)), int(min(b))
    s = mpf(0)
    for t in range(lo, hi+1):
        term = factorial(t+1)/(factorial(t-a[0])*factorial(t-a[1])*factorial(t-a[2])*factorial(t-a[3])
                               *factorial(b[0]-t)*factorial(b[1]-t)*factorial(b[2]-t))
        s += (-1)**t * term
    return pre*s

def diag(j, J): return sixj(j, j, J, j, j, J)

print("=== 1 · the fold layer: the Airy PROFILE of |{j j J; j j J}| near J_c = sqrt2 (j+1/2) - 1/2 ===")
print("   claim:  {j j J; j j J} ~ A j^{-4/3} Ai( -(J_c - J)/ell ),  ell ~ c j^{1/3}")
print(f"{'j':>5}{'J_c':>11}{'|6j| at nearest J':>20}{'x j^{4/3}':>13}{'layer width est':>17}")
rows = {}
for j in (20, 40, 80, 160, 320):
    Jc = sqrt(2)*(j+mpf(1)/2) - mpf(1)/2
    prof = []
    W = max(6, int(4*j**mpf(1)/3))
    for J in range(int(Jc)-40, int(Jc)+12):
        if J < 0 or J > 2*j: continue
        v = diag(mpf(j), mpf(J))
        prof.append((J, v))
    rows[j] = (Jc, prof)
    near = min(prof, key=lambda t: abs(t[0]-Jc))
    print(f"{j:5}{float(Jc):11.4f}{float(fabs(near[1])):20.10e}{float(fabs(near[1])*mpf(j)**(mpf(4)/3)):13.6f}"
          f"{float(mpf(j)**(mpf(1)/3)):17.4f}")

print("\n=== 2 · fit  6j(J) = A j^{-4/3} Ai( (J - J_c)/ell )  on the layer (least squares in A, ell) ===")
for j in (40, 80, 160, 320):
    Jc, prof = rows[j]
    # use the 26 values just below J_c (the oscillatory side) and 6 above (the decaying side)
    pts = [(mpf(J)-Jc, v) for (J, v) in prof if -26 <= float(mpf(J)-Jc) <= 6]
    def resid(par):
        A, ell = par
        return sum((A*mpf(j)**(-mpf(4)/3)*airyai(d/ell) - v)**2 for d, v in pts)
    best = None
    for ell0 in [mpf(j)**(mpf(1)/3)*mpf(c)/10 for c in range(4, 24)]:
        num = sum(mpf(j)**(-mpf(4)/3)*airyai(d/ell0)*v for d, v in pts)
        den = sum((mpf(j)**(-mpf(4)/3)*airyai(d/ell0))**2 for d, v in pts)
        A0 = num/den
        r = resid((A0, ell0))
        if best is None or r < best[0]: best = (r, A0, ell0)
    r, A0, ell0 = best
    print(f"  j={j:4}  A = {float(A0):10.5f}   ell = {float(ell0):8.4f} = {float(ell0/mpf(j)**(mpf(1)/3)):6.4f} j^(1/3)"
          f"   C_fold = A*Ai(0) = {float(A0*airyai(0)):8.5f}   rms = {float(sqrt(r/len(pts))):.3e}")

print("\n=== 3 · D_j = sum_J (2J+1)|6j| : the corpus's Y-0143 values checked, and c0 ===")
print(f"{'j':>5}{'D_j':>16}{'D_j/sqrt j':>13}{'D_j - 0.8607 sqrt j':>22}{'corpus Y-0143':>16}")
CORPUS = {50: '6.2177', 100: '8.6029', 200: '12.1501', 400: '17.1244'}
for j in (10, 20, 40, 50, 80, 100, 160):
    D = mpf(0)
    for J in range(0, 2*j+1):
        D += (2*J+1)*fabs(diag(mpf(j), mpf(J)))
    c = CORPUS.get(j, '-')
    print(f"{j:5}{float(D):16.6f}{float(D/sqrt(j)):13.6f}{float(D - mpf('0.8607')*sqrt(j)):22.6f}{c:>16}")
print("  (Y-0143 also lists D_800 ~ 27.4 with D/sqrt(j) = 0.866; 0.866*sqrt(800) = 24.50, not 27.4 --")
print("   the compendium's own two numbers for j = 800 disagree by 12%.)")
