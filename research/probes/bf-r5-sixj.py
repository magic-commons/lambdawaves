# bf-r5-sixj.py — Round 5 (Fable), Q26: the corpus's diagonal 6j symbol {j j J; j j J} (YMD-DISK-01, Y-0143/0144) at its fold.
#   The isosceles tetrahedron has V² = (2 l_j² − l_J²) l_J⁴ / 72 (l = J + ½), flat at l_J = √2 l_j: a FOLD caustic.
#   Fold scaling law (DERIVED-HERE from Ponzano–Regge + the Airy boundary layer): near the fold V ≈ (2^{1/4}/3) ε^{1/2} j³ with
#   ε = (J_c − J)/j, the PR amplitude (12πV)^{-1/2} ∝ ε^{-1/4} j^{-3/2}, and the Airy layer ε ~ j^{-2/3} gives |6j|_fold ∝ j^{-4/3},
#   width ΔJ ~ j^{1/3}; hence D_j = Σ_J (2J+1)|6j| = C√j + c₀ + o(1) with the corpus's C = 0.8607 and an O(1) fold term.
#   Exact Racah evaluation in mpmath (dps 50).
import sys, math
import mpmath as mp
mp.mp.dps = 50
fact = mp.factorial
def delta(a, b, c):
    return mp.sqrt(fact(a + b - c) * fact(a - b + c) * fact(-a + b + c) / fact(a + b + c + 1))
def sixj(a, b, c, d, e, f):
    # integer arguments only (this probe)
    if (a + b < c) or (abs(a - b) > c) or (a + e < f) or (abs(a - e) > f) or (d + b < f) or (abs(d - b) > f) or (d + e < c) or (abs(d - e) > c): return mp.mpf(0)
    pre = delta(a, b, c) * delta(a, e, f) * delta(d, b, f) * delta(d, e, c)
    tmin = max(a + b + c, a + e + f, d + b + f, d + e + c); tmax = min(a + b + d + e, a + c + d + f, b + c + e + f)
    s = mp.mpf(0)
    for t in range(tmin, tmax + 1):
        s += (-1) ** t * fact(t + 1) / (fact(t - a - b - c) * fact(t - a - e - f) * fact(t - d - b - f) * fact(t - d - e - c) * fact(a + b + d + e - t) * fact(a + c + d + f - t) * fact(b + c + e + f - t))
    return pre * s
js = [int(x) for x in sys.argv[1:]] or [10, 20, 40, 80]
print('   j     D_j      D_j/√j    J_c=√2(j+½)−½   |6j| at J=⌊J_c⌋   |6j| at ⌈J_c⌉   max|6j| in [J_c−2j^{1/3}, J_c+2j^{1/3}]  (at J)   |6j|_fold·j^{4/3}')
rows = []
for j in js:
    vals = {J: sixj(j, j, J, j, j, J) for J in range(0, 2 * j + 1)}
    D = sum((2 * J + 1) * abs(v) for J, v in vals.items())
    Jc = math.sqrt(2) * (j + 0.5) - 0.5
    lo, hi = int(math.floor(Jc)), int(math.ceil(Jc))
    win = range(max(0, int(Jc - 2 * j ** (1 / 3))), min(2 * j, int(Jc + 2 * j ** (1 / 3))) + 1)
    Jm = max(win, key=lambda J: abs(vals[J])); vm = abs(vals[Jm])
    vf = (abs(vals[lo]) + abs(vals[hi])) / 2
    rows.append((j, D, vf, vm))
    print(f'  {j:4d}  {mp.nstr(D, 7)}   {mp.nstr(D / mp.sqrt(j), 6)}    {Jc:9.4f}       {mp.nstr(abs(vals[lo]), 6)}        {mp.nstr(abs(vals[hi]), 6)}        {mp.nstr(vm, 6)}   ({Jm})        {mp.nstr(vf * mp.mpf(j) ** (mp.mpf(4) / 3), 6)}')
    # the tail beyond the fold: log-slope of |6j| for J = J_c + k, k = 1..6
    tail = [abs(vals[J]) for J in range(hi, min(2 * j, hi + 6) + 1)]
    print(f'        tail beyond the fold |6j|(J_c+k): {[mp.nstr(x, 3) for x in tail]}')
print('scaling exponents from consecutive j (expect −4/3 = −1.3333 for the fold value, −1/2·… for D):')
for (j1, D1, f1, m1), (j2, D2, f2, m2) in zip(rows[:-1], rows[1:]):
    print(f'   j {j1}→{j2}: fold-value exponent {mp.nstr(mp.log(f2 / f1) / mp.log(mp.mpf(j2) / j1), 6)};  max-near-fold exponent {mp.nstr(mp.log(m2 / m1) / mp.log(mp.mpf(j2) / j1), 6)};  D exponent {mp.nstr(mp.log(D2 / D1) / mp.log(mp.mpf(j2) / j1), 6)}')
print('the O(1) term: D_j − 0.8607√j =', [mp.nstr(D - mp.mpf('0.8607') * mp.sqrt(j), 5) for j, D, f, m in rows])
