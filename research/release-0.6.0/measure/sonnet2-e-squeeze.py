# sonnet2-e: squeezed vacuum along z in the 3-D isotropic oscillator register truncated to N <= 10 (qho.js: N = 2 n_r + l <= 10, so n_z <= 10 for a |0_x 0_y n_z> state).
# Fock amplitudes c_2k = (-tanh r)^k sqrt((2k)!) / (2^k k!) / sqrt(cosh r) ; exact Var(z) = e^{-2r}/2 (S = exp[(r/2)(a^2 - a^+2)]) ; anti-squeeze: r -> -r, Var = e^{+2r}/2.
import json, math
from math import factorial, tanh, cosh, exp, sqrt
NMAX = 10
def amps(r, nmax):
    t = -tanh(r); c = {}
    for k in range(0, nmax // 2 + 1):
        c[2*k] = (t**k) * sqrt(factorial(2*k)) / (2**k * factorial(k)) / sqrt(cosh(r))
    return c
def z2_mean(c):   # <z^2> over the (unnormalised) truncated vector: z^2 = (a^2 + a+^2 + 2 a+a + 1)/2
    s = 0.0
    for n, cn in c.items():
        s += cn*cn * (2*n + 1) / 2
        m = n + 2
        if m in c:
            s += 2 * cn * c[m] * sqrt((n+1)*(n+2)) / 2
    return s
rows = []
for sign, label in ((+1, 'squeeze (Var z = e^-2r/2)'), (-1, 'anti-squeeze (Var z = e^+2r/2)')):
    for r in (0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5):
        c = amps(sign * r, NMAX); norm = sum(v*v for v in c.values()); lost = 1 - norm
        exact = exp(-2*sign*r) / 2
        un = z2_mean(c); nm = un / norm
        rows.append({'kind': label, 'r': r, 'lostNorm': lost, 'varExact': exact, 'varTruncNormalised': nm, 'relErrNormalised': nm/exact - 1, 'varTruncUnnormalised': un, 'relErrUnnormalised': un/exact - 1})
def lost(r, nm=NMAX): c = amps(r, nm); return 1 - sum(v*v for v in c.values())
def first(th):
    lo, hi = 0.0, 3.0
    for _ in range(60):
        mid = (lo+hi)/2
        if lost(mid) > th: hi = mid
        else: lo = mid
    return hi
thr = {str(th): first(th) for th in (1e-6, 1e-4, 1e-3, 1e-2, 5e-2, 0.1)}
rows_cap = [{'nmax': nm, 'r': r, 'lostNorm': lost(r, nm)} for nm in (10, 20, 40) for r in (0.5, 1.0)]
out = {'tag': 'MEASURED (python, closed-form Fock series; no app code run)', 'NMAX': NMAX, 'rows': rows, 'rAtLostNorm': thr, 'capSensitivity': rows_cap}
json.dump(out, open('sonnet2-e-squeeze.json', 'w'), indent=1)
for r in rows: print(f"{r['kind'][:12]:12s} r={r['r']:<5} lost={r['lostNorm']:.3e} exact={r['varExact']:.5f} trunc(norm)={r['varTruncNormalised']:.5f} rel={r['relErrNormalised']:+.2e} unnorm rel={r['relErrUnnormalised']:+.2e}")
print(thr); print(rows_cap)

# r at which the |relative Var(z) error| (normalised, truncated N<=10) first exceeds a tolerance, for each sign; and the ratio error/lostNorm
def relerr(r, sign):
    c = amps(sign*r, NMAX); norm = sum(v*v for v in c.values()); return abs(z2_mean(c)/norm / (exp(-2*sign*r)/2) - 1)
def firstv(tol, sign):
    lo, hi = 0.01, 3.0
    for _ in range(60):
        mid = (lo+hi)/2
        if relerr(mid, sign) > tol: hi = mid
        else: lo = mid
    return hi
vt = {f'{tol:g}': {'squeeze': firstv(tol, +1), 'anti': firstv(tol, -1)} for tol in (1e-4, 1e-3, 1e-2, 1e-1)}
amp = {str(r): relerr(r, +1) / lost(r) for r in (0.25, 0.5, 0.75, 1.0)}
out['rAtVarTolerance'] = vt; out['errorOverLostNorm_squeeze'] = amp
json.dump(out, open('sonnet2-e-squeeze.json', 'w'), indent=1)
print(vt); print(amp)
