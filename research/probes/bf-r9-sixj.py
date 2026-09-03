#!/usr/bin/env python
"""BF R9 (Opus, QCD) — probe 6: a CLOSED FORM for the corpus's D_j ~ 0.87 sqrt(j).

Corpus Y-0143 (YMD-DISK-01 l.607) MEASURED, for the diagonal isosceles 6j,
    D_j = sum_J (2J+1) |{j j J ; j j J}| ~ 0.87 sqrt(j)
    (D/sqrt j = 0.879, 0.860, 0.859, 0.856, 0.866 at j = 50,100,200,400,800)
and Y-0141/Y-0143 MEASURED  rho beta^{1/4} in the band 1.29-1.43.
Y-0143's own stated upgrade residue: "a uniform fold/Airy asymptotic of the diagonal
isosceles |6j| is needed to upgrade rho -> 0 to PROVED."

DERIVED HERE from Ponzano-Regge:
    {j j J; j j J} ~ cos(S + pi/4)/sqrt(12 pi V),  V = b^2 sqrt(a^2 - b^2/2)/6,
    a = j+1/2, b = J+1/2, allowed for b <= a sqrt 2.
    <|cos|> = 2/pi  =>  D_j ~ c sqrt(a),
        c = (4/pi)(2pi)^{-1/2} sqrt2 * Int_0^1 (1-s^2)^{-1/4} ds
          = 4 sqrt2 Gamma(3/4)^2 / pi^2 = 8 sqrt2 / Gamma(1/4)^2 = 4/(sqrt(pi) varpi).
"""
import numpy as np
import mpmath as mp
mp.mp.dps = 40

print("="*78); print("BF R9 probe 6 — closed form for Y-0143's D_j constant"); print("="*78)

I = mp.quad(lambda s: (1-s**2)**mp.mpf('-0.25'), [0, 1])
c1 = (4/mp.pi)*(2*mp.pi)**mp.mpf('-0.5')*mp.sqrt(2)*I
c2 = 4*mp.sqrt(2)*mp.gamma(mp.mpf(3)/4)**2/mp.pi**2
c3 = 8*mp.sqrt(2)/mp.gamma(mp.mpf(1)/4)**2
varpi = mp.gamma(mp.mpf(1)/4)**2/(2*mp.sqrt(2*mp.pi))
c4 = 4/(mp.sqrt(mp.pi)*varpi)
print("\nInt_0^1 (1-s^2)^{-1/4} ds = (1/2)B(1/2,3/4) =", mp.nstr(I, 15))
print("c  (quadrature)              =", mp.nstr(c1, 15))
print("c = 4 sqrt2 Gamma(3/4)^2/pi^2 =", mp.nstr(c2, 15))
print("c = 8 sqrt2 / Gamma(1/4)^2    =", mp.nstr(c3, 15))
print("c = 4/(sqrt(pi) * varpi)      =", mp.nstr(c4, 15), "  [varpi = lemniscate const =",
      mp.nstr(varpi, 12), "]")
print("all four agree:", mp.nstr(max(abs(c1-c2), abs(c2-c3), abs(c3-c4)), 5))
print("\ncorpus Y-0143 MEASURED D_j/sqrt(j): 0.879, 0.860, 0.859, 0.856, 0.866 "
      "(j=50,100,200,400,800)")

# --- exact / high-precision D_j from the Racah formula (log-domain, mpmath)
def logfact(n): return mp.loggamma(n+1)

def sixj_iso(j, J):
    """{j j J ; j j J} via the Racah sum, all arguments integer or half-integer."""
    def delta(a, b, c):
        return mp.mpf('0.5')*(logfact(a+b-c)+logfact(a-b+c)+logfact(-a+b+c)-logfact(a+b+c+1))
    a, b, c = j, j, J
    d, e, f = j, j, J
    pref = delta(a,b,c)+delta(a,e,f)+delta(d,b,f)+delta(d,e,c)
    lo = max(a+b+c, a+e+f, d+b+f, d+e+c)
    hi = min(a+b+d+e, b+c+e+f, a+c+d+f)
    tot = mp.mpf(0)
    for t in range(int(lo), int(hi)+1):
        lg = (logfact(t+1) - logfact(t-a-b-c) - logfact(t-a-e-f) - logfact(t-d-b-f)
              - logfact(t-d-e-c) - logfact(a+b+d+e-t) - logfact(b+c+e+f-t)
              - logfact(a+c+d+f-t))
        tot += (-1)**t*mp.e**(lg+pref)
    return tot

print("\n%-6s %-16s %-16s %-16s %-10s" % ("j", "D_j (exact sum)", "c*sqrt(j+1/2)", "ratio", "D/sqrt(j)"))
for j in (10, 20, 40, 60, 100, 150):
    D = mp.mpf(0)
    for twoJ in range(0, 4*j+1, 2):
        J = twoJ//2
        D += (2*J+1)*abs(sixj_iso(j, J))
    pred = c2*mp.sqrt(j+mp.mpf('0.5'))
    print("%-6d %-16s %-16s %-16s %-10s" %
          (j, mp.nstr(D, 10), mp.nstr(pred, 10), mp.nstr(D/pred, 8),
           mp.nstr(D/mp.sqrt(j), 8)))

# --- the rho constant
print("\nrho = 1/D_j at j = j_max = floor(sqrt(beta/2)) (Y-0143 Def 2.4.1, S_j = 1 for integer j):")
print("   rho ~ 1/(c sqrt j) with j = sqrt(beta/2)  =>  rho beta^{1/4} -> 2^{1/4}/c")
K = 2**mp.mpf('0.25')/c2
print("   DERIVED constant  2^{1/4}/c = %s" % mp.nstr(K, 12))
print("   corpus Y-0143 MEASURED band: 1.29 - 1.43, 'no drift' over beta = 4 .. 3.2e5")
print("   -> the derived constant sits at %.1f%% of the band width from its centre."
      % (100*abs(float(K)-1.36)/(1.43-1.29)))
print("\n   closed form:  lim_{beta->inf} rho(beta) beta^{1/4} = 2^{1/4} Gamma(1/4)^2/(8 sqrt2)")
print("                                                       = Gamma(1/4)^2/(2^{9/4} * 2)")
alt = 2**mp.mpf('0.25')*mp.gamma(mp.mpf(1)/4)**2/(8*mp.sqrt(2))
print("   check:", mp.nstr(alt, 12), " == ", mp.nstr(K, 12))
