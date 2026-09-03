# bf-r3-morse.py — two-term superpositions: the nodal set is {|f| = |b/a|} ∩ {arg f = φ0 - ωt}, f = φ1/φ2.
#   Reconnections / creations happen when φ0 - ωt crosses a critical value of arg f restricted to the surface S = {|f| = |b/a|}.
#   Example: φ1 = 2p₊, φ2 = (3p₀ + 3d₋)/√2 (the two n = 3 states are degenerate, so this is a two-term beat at ω = E3 - E2).
#   We sample S by shooting rays in (θ, φ), find every r with |f| = 1, evaluate c = arg f there, and count the critical points
#   of c on each sheet by finite differences; the number of distinct critical values is the number of topology changes per turn.
import math
import numpy as np
from scipy import special, optimize

def R_nl(n, l, r):
    rho = 2.0 * r / n
    norm = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return norm * np.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
def phi1(r, th, ph): return R_nl(2, 1, r) * special.sph_harm_y(1, 1, th, ph)
def phi2(r, th, ph): return (R_nl(3, 1, r) * special.sph_harm_y(1, 0, th, ph) + R_nl(3, 2, r) * special.sph_harm_y(2, -1, th, ph)) / math.sqrt(2)
def f(r, th, ph): return phi1(r, th, ph) / phi2(r, th, ph)

nth, nph = 181, 360
ths = np.linspace(0.02, math.pi - 0.02, nth); phs = np.linspace(0, 2 * math.pi, nph, endpoint=False)
rs = np.linspace(0.05, 40, 1200)
# sheets: for each (θ, φ) the list of radii where log|f| = 0
sheets = {}
maxsheets = 0
for i, th in enumerate(ths):
    for j, ph in enumerate(phs):
        vals = np.log(np.abs(f(rs, th, ph)) + 1e-300)
        roots = []
        for k in range(len(rs) - 1):
            if np.isfinite(vals[k]) and np.isfinite(vals[k + 1]) and vals[k] * vals[k + 1] < 0 and abs(vals[k] - vals[k + 1]) < 5:
                try: roots.append(optimize.brentq(lambda r: math.log(abs(f(r, th, ph))), rs[k], rs[k + 1]))
                except Exception: pass
        sheets[(i, j)] = roots
        maxsheets = max(maxsheets, len(roots))
counts = {}
for v in sheets.values(): counts[len(v)] = counts.get(len(v), 0) + 1
print(f'sheets of S = {{|φ1| = |φ2|}}: number of radii per direction: {dict(sorted(counts.items()))} (max {maxsheets})')
# take the innermost and the second sheet where present; compute c = arg f and its critical points on the (θ, φ) grid
for s in range(min(maxsheets, 3)):
    C = np.full((nth, nph), np.nan)
    Rr = np.full((nth, nph), np.nan)
    for (i, j), roots in sheets.items():
        if len(roots) > s:
            r0 = roots[s]; Rr[i, j] = r0
            C[i, j] = np.angle(f(r0, ths[i], phs[j]))
    # unwrap along φ then θ where defined
    crit = []
    for i in range(1, nth - 1):
        for j in range(nph):
            jm, jp = (j - 1) % nph, (j + 1) % nph
            if np.isnan(C[i, j]) or np.isnan(C[i - 1, j]) or np.isnan(C[i + 1, j]) or np.isnan(C[i, jm]) or np.isnan(C[i, jp]): continue
            d = lambda a, b: (b - a + math.pi) % (2 * math.pi) - math.pi
            gth = d(C[i - 1, j], C[i + 1, j]); gph = d(C[i, jm], C[i, jp])
            # a critical point: both one-sided differences change sign
            if d(C[i - 1, j], C[i, j]) * d(C[i, j], C[i + 1, j]) < 0 and d(C[i, jm], C[i, j]) * d(C[i, j], C[i, jp]) < 0:
                crit.append((round(math.degrees(ths[i]), 1), round(math.degrees(phs[j]), 1), round(float(Rr[i, j]), 3), round(float(C[i, j]), 4)))
    vals = sorted(set(round(c[3], 3) for c in crit))
    print(f'sheet {s}: {int(np.sum(~np.isnan(C)))} of {nth * nph} directions; critical points of arg f on it: {len(crit)}; distinct critical values (rad): {vals[:12]}')
    for c in crit[:12]: print('    ', c)
print('reading: each distinct critical value is a time (mod the beat) at which the nodal curve changes topology; none means the vortex lines only sweep.')
