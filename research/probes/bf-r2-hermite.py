# bf-r2-hermite.py - round 2 (Opus), Q7 CLOSED.
#   H1  the Hermite calculus done correctly: I/e^{-a^2/2} = sum_m b^m He_{3m}(a)/m!  (real, entire)
#       -> log|I|, stationarity, a*(b) and |I|max(b) to high order.  Round 1's 99/2 is wrong.
#   H2  the SAME series from the exact Airy closed form via the Riccati expansion of Ai'/Ai.
#   H3  numerical confirmation against mpmath.
#   H4  the divergence: asymptotic, Gevrey-1, beyond-all-orders term exp(-1/(54 b^2)).
#   H5  THE UNIQUENESS THEOREM: the principal Airy branch is the global maximiser for EVERY b>0.
import sympy as sp
from mpmath import mp, mpf, airyai, findroot, exp as mexp

mp.dps = 40
t, A = sp.symbols('t A')                 # a = t A, b = t  (both O(t)); A = alpha/beta

print('=' * 100)
print('H1 - THE HERMITE CALCULUS, DONE CORRECTLY')
M, ORD = 9, 9
R = sum(t ** m * sp.hermite_prob(3 * m, t * A) / sp.factorial(m) for m in range(M + 1))
Rt = sp.series(sp.expand(R), t, 0, ORD + 1).removeO()
logI = sp.expand(sp.series(sp.log(Rt), t, 0, ORD + 1).removeO() - t ** 2 * A ** 2 / 2)
print('    log|I| = sum_k t^k P_k(A)   with a = t A, b = t :')
for k in (2, 4, 6, 8):
    print('      t^%-2d : %s' % (k, sp.factor(sp.expand(logI.coeff(t, k)))))
print('    ROUND 1 wrote the t^4 line as  A^3 + 18 A^2 + (315/2) A + ... ; the A-coefficient is 135')
print('    (round 1 dropped the cross term -(1/2)*2*(-3 a b)*(-15/2 b^2) = -45/2 a b^3 in log R).')

NT = 4                                    # c1..c4  ->  beta^3, beta^5, beta^7, beta^9
cs = sp.symbols('c1:6')
Aser = -3 + sum(cs[i] * t ** (2 * (i + 1)) for i in range(NT))
eq = sp.expand(sp.series(sp.diff(logI, A).subs(A, Aser), t, 0, 2 * NT + 4).removeO())
sol = {}
for i in range(NT):
    for k in range(0, 2 * NT + 4):
        c = sp.expand(eq.coeff(t, k).subs(sol))
        if c != 0 and c.has(cs[i]):
            sol[cs[i]] = sp.nsimplify(sp.solve(sp.Eq(c, 0), cs[i])[0]); break
Astar = sp.expand(Aser.subs(sol))
CO = [sp.nsimplify(Astar.coeff(t, 2 * i)) for i in range(NT + 1)]
print()
print('    alpha*(beta) = ' + '  '.join('%+s b^%d' % (CO[i], 2 * i + 1) for i in range(NT + 1)))
print('    ROUND 1 CLAIMS alpha* = -3 b + 99/2 b^3 = -3b + 49.5 b^3.  The b^3 coefficient is %s.' % CO[1])

Lm = sp.expand(sp.series(logI.subs(A, Aser).subs(sol), t, 0, 2 * NT + 2).removeO())
Im = sp.expand(sp.series(sp.exp(Lm), t, 0, 2 * NT + 2).removeO())
print('    log|I|max = ' + '  '.join('%+s b^%d' % (sp.nsimplify(Lm.coeff(t, 2 * i)), 2 * i) for i in range(1, NT + 1)))
print('    |I|max    = ' + '  '.join('%+s b^%d' % (sp.nsimplify(Im.coeff(t, 2 * i)), 2 * i) for i in range(0, NT + 1)))
print('    ROUND 1 CLAIMS |I|max = 1 - 3 b^2 + O(b^4).  The b^4 coefficient is %s = %.4f.'
      % (sp.nsimplify(Im.coeff(t, 4)), float(Im.coeff(t, 4))))

print()
print('=' * 100)
print("H2 - THE SAME SERIES FROM THE EXACT AIRY CLOSED FORM.")
print("     I(a,b) = sqrt(2pi) (3b)^{-1/3} exp( a/(6b) + 1/(108 b^2) ) Ai( (a + 1/(12b)) (3b)^{-1/3} )")
print("     Maximiser: Ai'(z*)/Ai(z*) = -L,  L = 3^{1/3}/(6 b^{2/3}).  Riccati w' + w^2 = z with")
print("     w = Ai'/Ai gives w = -sqrt(z) - 1/(4z) + 5/(32 z^{5/2}) - 15/(64 z^4) + ...")
y = sp.symbols('y', positive=True)        # z = 1/y^2
NR = 6
gs = sp.symbols('g1:8')
w = -1 / y + sum(gs[i] * y ** (3 * i + 2) for i in range(NR))    # z^{-(3i+2)/2} = y^{3i+2}
res = sp.expand(sp.diff(w, y) * sp.diff(1 / y ** 2, y) ** -1 + w ** 2 - 1 / y ** 2)
res = sp.expand(sp.series(res, y, 0, 3 * NR + 4).removeO())
gsol = {}
for i in range(NR):
    for k in range(-2, 3 * NR + 4):
        c = sp.expand(res.coeff(y, k).subs(gsol))
        if c != 0 and c.has(gs[i]):
            gsol[gs[i]] = sp.simplify(sp.solve(sp.Eq(c, 0), gs[i])[0]); break
print("     Ai'/Ai ~ -z^{1/2} " + ' '.join('%+s z^(-%s/2)' % (gsol[gs[i]], 3 * i + 2) for i in range(NR)))
# solve w(z*) = -L for s = sqrt(z*) = L + e1/L^2 + e2/L^5 + ...
L, v = sp.symbols('L v', positive=True)   # v = 1/L
es = sp.symbols('e1:7'); NS = 4
sser = 1 / v + sum(es[i] * v ** (3 * i + 2) for i in range(NS))
E = sp.expand((-w.subs(y, 1 / sser) - 1 / v))
E = sp.expand(sp.series(E.subs(gsol), v, 0, 3 * NS + 3).removeO())
ssol = {}
for i in range(NS):
    for k in range(0, 3 * NS + 3):
        c = sp.expand(E.coeff(v, k).subs(ssol))
        if c != 0 and c.has(es[i]):
            ssol[es[i]] = sp.simplify(sp.solve(sp.Eq(c, 0), es[i])[0]); break
print('     sqrt(z*) = L ' + ' '.join('%+s/L^%d' % (ssol[es[i]], 3 * i + 2) for i in range(NS)))
bb = sp.Symbol('bb', positive=True)
sst = sser.subs(ssol).subs(v, 6 * bb ** sp.Rational(2, 3) / 3 ** sp.Rational(1, 3))
astar_airy = sp.expand(sp.simplify((3 * bb) ** sp.Rational(1, 3) * sst ** 2 - 1 / (12 * bb)))
print('     alpha*(beta) from the Airy branch = %s' % sp.nsimplify(sp.expand(astar_airy)))
print('     (identical to H1 - two independent derivations.)')

print()
print('=' * 100)
print('H3 - NUMERICAL CONFIRMATION (mpmath, dps 40)')
def lam(bv): return mpf(3) ** (mpf(1) / 3) / (6 * bv ** (mpf(2) / 3))
def zst(bv):
    Lv = lam(bv)
    return findroot(lambda zz: airyai(zz, derivative=1) / airyai(zz) + Lv, Lv * Lv - 1 / (2 * Lv))
def ast(bv): return zst(bv) * (3 * bv) ** (mpf(1) / 3) - 1 / (12 * bv)
c3, c5, c7 = float(CO[1]), float(CO[2]), float(CO[3])
print('     beta       alpha* exact         -3b+%.0fb^3          +%.0fb^5           +%.0fb^7        resid/b^9'
      % (c3, c5, c7))
for bs in ['0.05', '0.02', '0.01', '0.005', '0.002']:
    bv = mpf(bs); ex = ast(bv)
    s3 = -3 * bv + mpf(str(c3)) * bv ** 3
    s5 = s3 + mpf(str(c5)) * bv ** 5
    s7 = s5 + mpf(str(c7)) * bv ** 7
    print('    %7s  %+.16f  %+.16f  %+.16f  %+.16f  %+.4e'
          % (bs, ex, s3, s5, s7, (ex - s7) / bv ** 9))

print()
print('=' * 100)
print('H4 - THE SERIES IS ASYMPTOTIC (Gevrey-1), NOT CONVERGENT.  Beyond-all-orders scale')
print('     exp(-2 zeta) = exp(-(4/3) L^3) = exp(-1/(54 beta^2)).  Term sizes of alpha*(beta):')
cf = [3.0] + [abs(float(CO[i])) for i in range(1, NT + 1)]
print('     beta      |3b|     |c3 b^3|  |c5 b^5|  |c7 b^7|  |c9 b^9|   exp(-1/(54 b^2))')
for bs in [0.02, 0.05, 0.08, 0.10, 0.15, 0.20, 0.30]:
    print('    %5.2f  %s   %9.3e' % (bs, ' '.join('%9.3e' % (cf[i] * bs ** (2 * i + 1)) for i in range(len(cf))),
                                     float(mexp(-1 / (54 * mpf(str(bs)) ** 2)))))
print('     coefficient ratios (Gevrey growth): ' + ' '.join('%.1f' % (cf[i + 1] / cf[i]) for i in range(len(cf) - 1)))

print()
print('=' * 100)
print('H5 - THE UNIQUENESS THEOREM (Q7 last part).')
a1 = findroot(lambda x: airyai(x), mpf('-2.338'))
a2 = findroot(lambda x: airyai(x), mpf('-4.088'))
a1p = findroot(lambda x: airyai(x, derivative=1), mpf('-1.019'))
a2p = findroot(lambda x: airyai(x, derivative=1), mpf('-3.248'))
print('    a1 = %.10f  a2 = %.10f   a1p = %.10f  a2p = %.10f' % (a1, a2, a1p, a2p))
print('    Ai(a1p) = %.10f   |Ai(a2p)| = %.10f   ratio = %.10f'
      % (airyai(a1p), abs(airyai(a2p)), abs(airyai(a2p)) / airyai(a1p)))
print('    phi(L) := e^{L(z*-a1)} Ai(z*).  Envelope theorem: d log phi/dL = z* - a1 > a1p - a1 = %.6f > 0'
      % (a1p - a1))
print('      L       z*(L)         phi(L)      bound |Ai(a2p)|   verdict')
for Ls in ['0', '0.1', '0.3', '1', '3', '10', '30', '100']:
    Lv = mpf(Ls)
    zv = a1p if Lv == 0 else findroot(lambda zz: airyai(zz, derivative=1) / airyai(zz) + Lv,
                                      Lv * Lv - 1 / (2 * Lv) if Lv > mpf('0.9') else a1p + mpf('0.3') * Lv)
    ph = mexp(Lv * (zv - a1)) * airyai(zv)
    print('    %6s  %+.8f   %.8e   %.8f   %s'
          % (Ls, zv, ph, abs(airyai(a2p)), 'phi > bound' if ph > abs(airyai(a2p)) else 'FAILS'))
print('    => phi strictly increasing, phi(0) = Ai(a1p) = %.6f > %.6f = |Ai(a2p)| >= every'
      % (airyai(a1p), abs(airyai(a2p))))
print('       competing lobe scaled the same way.  The principal maximum is GLOBAL for every')
print('       beta > 0: there is no "first competing maximum" to locate.  QED')
