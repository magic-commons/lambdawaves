"""bf-r10-sixj.py — Round 10 (Fable), Q49 + Q51: the fold at the edge of the isosceles 6j, and the constant term of D_j.

D_j = Σ_J (2J+1) |{j j J; j j J}|, exact by Racah's formula in integer arithmetic (no precision loss at any j).
Theory (DERIVED-HERE, §3 of 10-fable.md):  a = j+½, b = J+½, b_c = a√2.  Near the fold, with
    ζ = 2^{11/6} (b_c − b) / a^{1/3},        {6j} ≈ 2^{−2/3} a^{−4/3} Ai(−ζ),
the layer width is Δb = 2^{−11/6} a^{1/3} = 0.2806 a^{1/3} and the layer's contribution to D_j is O(a^0):
    d_fold = lim_Z [ ½ ∫_{−∞}^{Z} |Ai(−ζ)| dζ − (4/3) π^{−3/2} Z^{3/4} ].
Run: ~/miniforge3/envs/sci/bin/python bf-r10-sixj.py
"""
import sys, math
from fractions import Fraction
from mpmath import mp, mpf, airyai, quad, gamma, pi, sqrt, inf, findroot

mp.dps = 30
c_PR = 8 * sqrt(2) / gamma(mpf(1) / 4) ** 2         # Opus's Theorem Q3 constant 0.8606822
print(f"c = 8√2/Γ(1/4)² = {c_PR}")

def sixj_iso(j, J, fact):
    """{j j J; j j J} exact (Fraction), j, J integers"""
    if J > 2 * j: return Fraction(0)
    # Δ(jjJ)^4 = [(2j−J)! (J!)² / (2j+J+1)!]²
    D = Fraction(fact[2 * j - J] * fact[J] ** 2, fact[2 * j + J + 1]) ** 2
    zmin, zmax = 2 * j + J, min(4 * j, 2 * j + 2 * J)
    S = Fraction(0)
    for z in range(zmin, zmax + 1):
        num = fact[z + 1]
        den = fact[z - 2 * j - J] ** 4 * fact[4 * j - z] * fact[2 * j + 2 * J - z] ** 2
        S += Fraction((-1) ** z * num, den)
    return D * S

def D_exact(j):
    fact = [1] * (4 * j + 3)
    for i in range(1, 4 * j + 3): fact[i] = fact[i - 1] * i
    tot = Fraction(0); vals = []
    for J in range(0, 2 * j + 1):
        v = sixj_iso(j, J, fact)
        vals.append(v)
        tot += (2 * J + 1) * abs(v)
    return tot, vals

# ── (i) the fold layer: check {6j} ≈ 2^{−2/3} a^{−4/3} Ai(−ζ) near J_c at j = 200 ─────────────────────────────
print("\n== fold layer at j = 200: exact |6j| vs 2^{-2/3} a^{-4/3} |Ai(−ζ)|, ζ = 2^{11/6}(b_c − b)/a^{1/3} ==")
j = 200; a = mpf(j) + mpf(1) / 2; bc = a * sqrt(2)
tot, vals = D_exact(j)
Jc = int(bc - mpf(1) / 2)
amp = mpf(2) ** (-mpf(2) / 3) * a ** (-mpf(4) / 3)
width = mpf(2) ** (-mpf(11) / 6) * a ** (mpf(1) / 3)
print(f"  a = {a}, b_c = {bc}, J_c ≈ {Jc};  predicted amplitude 2^(-2/3) a^(-4/3) = {amp};  layer width Δb = 2^(-11/6) a^(1/3) = {width}")
for J in range(Jc - 12, min(2 * j, Jc + 6) + 1):
    b = mpf(J) + mpf(1) / 2
    zeta = mpf(2) ** (mpf(11) / 6) * (bc - b) / a ** (mpf(1) / 3)
    pred = amp * airyai(-zeta)
    ex = mpf(vals[J].numerator) / mpf(vals[J].denominator)
    print(f"  J={J}: ζ = {mp.nstr(zeta, 6):>9}  exact 6j = {mp.nstr(ex, 8):>14}  Airy = {mp.nstr(pred, 8):>14}  ratio = {mp.nstr(ex / pred, 6) if abs(pred) > 1e-12 else '—'}")

# ── (ii) d_fold ─────────────────────────────────────────────────────────────
print("\n== d_fold = lim_Z [ ½∫_{−∞}^{Z}|Ai(−ζ)|dζ − (4/3)π^{−3/2} Z^{3/4} ] ==")
# zeros of Ai(−ζ) for ζ>0 to split the integral
from mpmath import airyaizero
tail = quad(lambda z: abs(airyai(-z)), [-inf, 0])
zeros = [-airyaizero(k) for k in range(1, 400)]
acc = tail
prev = mpf(0)
pts = [mpf(0)] + zeros
running = []
for i in range(len(pts) - 1):
    acc += quad(lambda z: abs(airyai(-z)), [pts[i], pts[i + 1]])
    Z = pts[i + 1]
    running.append((Z, acc / 2 - mpf(4) / 3 * pi ** (-mpf(3) / 2) * Z ** (mpf(3) / 4)))
for Z, v in running[::40] + [running[-1]]:
    print(f"  Z = {mp.nstr(Z, 8):>10}:  {mp.nstr(v, 12)}")
# the oscillating remainder: average consecutive zero-to-zero values (the sawtooth has zero mean at the zeros of Ai only approximately)
d_fold = (running[-1][1] + running[-2][1]) / 2
print(f"  d_fold (mean of last two) = {mp.nstr(d_fold, 10)}")

# ── (iii) the measured D_j − c√a ─────────────────────────────────────────────
print("\n== D_j exact, D_j − c√a, and the small-J end ==")
rows = []
for j in list(range(20, 101, 10)) + list(range(120, 301, 20)) + [350, 400]:
    a = mpf(j) + mpf(1) / 2
    tot, vals = D_exact(j)
    Dj = mpf(tot.numerator) / mpf(tot.denominator)
    d = Dj - c_PR * sqrt(a)
    # the small-J end: exact contribution of J <= J0 = floor(2 a^{1/2}) minus the PR-bulk integral there
    J0 = int(2 * math.sqrt(j))
    small = sum((2 * J + 1) * abs(mpf(vals[J].numerator) / mpf(vals[J].denominator)) for J in range(J0 + 1))
    bulk_small = quad(lambda b: 2 * b * (2 / pi) / sqrt(12 * pi * b * b * sqrt(a * a - b * b / 2) / 6), [0, mpf(J0) + 1])
    rows.append((j, Dj, d, small - bulk_small))
    print(f"  j={j:4d}: D_j = {mp.nstr(Dj, 12)}  D_j − c√a = {mp.nstr(d, 8):>12}   D_j/(c√a) = {mp.nstr(Dj/(c_PR*sqrt(a)), 8)}   small-J excess (J≤{J0}) = {mp.nstr(small - bulk_small, 6)}")
ds = [r[2] for r in rows]
print(f"  mean of D_j − c√a over j≥100: {mp.nstr(sum(r[2] for r in rows if r[0] >= 100) / len([r for r in rows if r[0] >= 100]), 6)};  spread (max−min) over j≥100: {mp.nstr(max(r[2] for r in rows if r[0] >= 100) - min(r[2] for r in rows if r[0] >= 100), 6)}")

# ── (iv) a dense block to see whether the fluctuation decays: j = 150..170 every j ─────────────────────────────
print("\n== dense block j = 150..170 and 250..262: D_j − c√a every j ==")
for lo, hi in [(150, 170), (250, 262)]:
    blk = []
    for j in range(lo, hi + 1):
        a = mpf(j) + mpf(1) / 2
        tot, _ = D_exact(j)
        Dj = mpf(tot.numerator) / mpf(tot.denominator)
        blk.append(Dj - c_PR * sqrt(a))
    m = sum(blk) / len(blk); sd = sqrt(sum((v - m) ** 2 for v in blk) / len(blk))
    print(f"  j∈[{lo},{hi}]: mean D_j − c√a = {mp.nstr(m, 6)}, s.d. = {mp.nstr(sd, 6)}, values: {[mp.nstr(v, 4) for v in blk]}")
