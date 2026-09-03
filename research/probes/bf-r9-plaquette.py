#!/usr/bin/env python
"""BF Round 9 (Opus, QCD) — probe 2: the plaquette integral.

(a) sigma_0(beta) = -log(I_2/I_1) IS the leading strong-coupling string tension a^2 sigma.
(b) A = 2 is the Z_2 centre-flip action of one plaquette: S(-1) - S(+1) = 2 beta EXACTLY.
(c) Theorem A.9 (Fable R7) does NOT govern it: the p=4 truncation gives 1.5 beta (25% low),
    the p=6 truncation has NO real competing saddle.
(d) radius of convergence of the strong-coupling expansion.
(e) Riccati (corpus Y-0128) re-check + s_k against Theorem S1 (Opus R4).
"""
import mpmath as mp
import sympy as sp

mp.mp.dps = 60
print("="*78); print("BF R9 probe 2 — the plaquette"); print("="*78)

# ---------------------------------------------------------------- (a) tension
b = sp.symbols('beta', positive=True)
ratio = sp.series(sp.besseli(2, b)/sp.besseli(1, b), b, 0, 10).removeO()
ratio = sp.simplify(sp.expand(ratio))
print("\n(a) I_2/I_1 small-beta:", sp.nsimplify(sp.expand(ratio)))
s0 = sp.series(-sp.log(sp.besseli(2, b)/sp.besseli(1, b)) - sp.log(4/b), b, 0, 9)
print("    a^2 sigma = -log(I_2/I_1) = log(4/beta) + ", sp.simplify(s0))

print("\n    LEADING strong-coupling string tension, SU(N), S = (beta/N) sum Re tr U_p:")
for N in (2, 3, 4):
    fac = 4 if N == 2 else 2*N*N          # SU(2) pseudo-real: tr U = tr U^dagger
    print(f"      SU({N}):  W_plaq = beta/{fac}   ->  a^2 sigma = log({fac}/beta)")
for bb in (1.0, 2.0, 2.5):
    print("      SU(2) numeric  beta=%.2f : -log(I2/I1) = %.8f ,  log(4/beta) = %.8f"
          % (bb, -mp.log(mp.besseli(2,bb)/mp.besseli(1,bb)), mp.log(4/bb)))

# ---------------------------------------------------------------- (b) centre flip
print("\n(b) THE SECOND SADDLE IS THE CENTRE ELEMENT.")
print("    Single-plaquette weight  exp((beta/2) tr U),  U = exp(i theta n.sigma):")
print("      tr U = 2 cos theta ;  S(theta) = -beta cos theta")
print("      saddles: theta = 0  (U = +1, S = -beta)   and   theta = pi  (U = -1, S = +beta)")
print("      Delta S = S(pi) - S(0) = 2 beta      <-- EXACT, the Borel constant A = 2")
for bb in (5, 10, 20, 40, 80):
    v = -mp.log(mp.besselk(1, bb)/mp.besseli(1, bb))/bb
    print("      -log(K_1/I_1)/beta at beta=%3d : %.12f" % (bb, v))
print("      K_nu/I_nu ~ pi e^{-2 beta}:  beta=40 ->",
      mp.nstr(mp.besselk(1,40)/mp.besseli(1,40)/mp.exp(-80), 12))

# ---------------------------------------------------------------- (c) A.9
print("\n(c) DOES A.9 APPLY?  cos theta expanded, u = sqrt(beta) theta:")
print("    exp(beta cos theta) = e^beta exp(-u^2/2 + u^4/(24 beta) - u^6/(720 beta^2) + ...)")
print("    -> A.9 family exp(-u^2/2 + i gamma u^p) with p=4, i gamma = 1/(24 beta).")
g = sp.symbols('gamma')
p = 4
print("    A.9:  |Delta S_p| = ((p-2)/2p)(p gamma)^(-2/(p-2)) ; p=4 -> 1/(16 gamma)")
gam = sp.Rational(1,24)/sp.I          # i*gamma = 1/(24 beta) -> gamma = -i/(24 beta)
val = sp.simplify(1/(16*(-sp.I/24)))
print("    with gamma = -i/(24 beta):  |Delta S_4| =", sp.simplify(sp.Abs(val)), "* beta")
th = sp.symbols('theta', positive=True)
for M, lab in ((2, "quadratic"), (4, "quartic"), (6, "sextic"), (8, "octic")):
    S = sum((-1)**(k//2+1)*th**k/sp.factorial(k) for k in range(2, M+1, 2))
    roots = sp.solve(sp.diff(S, th), th)
    real = [sp.nsimplify(r) for r in roots if r.is_real and r > 0]
    if real:
        r0 = min(real, key=lambda z: abs(complex(z)))
        print("    %-9s truncation of beta(1-cos th): saddle th=%.6f  Delta S = %.6f beta"
              % (lab, float(r0), float(S.subs(th, r0))))
    else:
        cr = [complex(r) for r in roots if abs(complex(r)) > 1e-9]
        print("    %-9s truncation: NO real competing saddle; nearest complex |th| = %s"
              % (lab, ", ".join("%.4f" % abs(c) for c in sorted(cr, key=abs)[:2])))
print("    EXACT (untruncated): theta = pi, Delta S = 2 beta.")

# ---------------------------------------------------------------- (d) radius
print("\n(d) RADIUS OF CONVERGENCE of the strong-coupling series.")
print("    sigma_0 = log(4/beta) + analytic; nearest singularity where I_1 or I_2 vanishes.")
j11 = mp.findroot(lambda x: mp.besselj(1, x), 3.8)
j21 = mp.findroot(lambda x: mp.besselj(2, x), 5.1)
print("    I_1(beta)=0 at beta = i*j_{1,1}, j_{1,1} =", mp.nstr(j11, 10))
print("    I_2(beta)=0 at beta = i*j_{2,1}, j_{2,1} =", mp.nstr(j21, 10))
print("    => R_conv = %s  (in |beta|)" % mp.nstr(j11, 10))
print("    contrast: Theorem S1's A = 2 is the BOREL singularity of the LARGE-beta")
print("    asymptotic series in 1/beta -- a different plane. Both are real; not the same object.")

print("\n(e) Riccati / s_k / Theorem S1 dictionary: see bf-r9-plaq2.py")
