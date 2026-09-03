# (d) Wigner d^l against sympy, (e) KS numbers — split out of lw_verify.py
import math
from sympy.physics.quantum.spin import Rotation
from sympy import N as sN

def wigner_d(l, mp, m, beta):
    s = 0.0
    for k in range(0, 2 * l + 1):
        a, b, c, d = l + m - k, k, mp - m + k, l - mp - k
        if min(a, b, c, d) < 0: continue
        s += (-1) ** (mp - m + k) * math.sqrt(math.factorial(l + m) * math.factorial(l - m) * math.factorial(l + mp) * math.factorial(l - mp)) \
             / (math.factorial(a) * math.factorial(b) * math.factorial(c) * math.factorial(d)) \
             * math.cos(beta / 2) ** (2 * l + m - mp - 2 * k) * math.sin(beta / 2) ** (mp - m + 2 * k)
    return s

print("(d) Wigner d^l_{m'm}(beta): explicit sum vs sympy Rotation.d")
worst = 0; worstIm = 0; count = 0
for l in range(1, 6):
    for beta in [0.3, 1.1, 2.7]:
        for mp in range(-l, l + 1):
            for m in range(-l, l + 1):
                ref = complex(sN(Rotation.d(l, mp, m, beta).doit()))
                worst = max(worst, abs(wigner_d(l, mp, m, beta) - ref.real)); worstIm = max(worstIm, abs(ref.imag)); count += 1
print(f'  l = 1..5, three angles, {count} entries: worst |d_here - Re d_sympy| = {worst:.2e}, worst |Im d_sympy| = {worstIm:.1e}')
# unitarity: sum_m d(l,mp,m)^2 = 1
u = max(abs(sum(wigner_d(l, mp, m, 0.77) ** 2 for m in range(-l, l + 1)) - 1) for l in range(1, 6) for mp in range(-l, l + 1))
print(f'  row norms of d^l(0.77) for l = 1..5: worst |sum - 1| = {u:.1e}')
cp = [wigner_d(1, mp, 0, math.pi / 2) for mp in (-1, 0, 1)]
print(f'  R_y(pi/2) p_z -> (c_-1, c_0, c_1) = ({cp[0]:+.6f}, {cp[1]:+.6f}, {cp[2]:+.6f});  p_x = (Y_1^-1 - Y_1^1)/sqrt2 is (+{1 / math.sqrt(2):.6f}, 0, -{1 / math.sqrt(2):.6f})')

print('(e) KS: H_u = -(1/8) lap_u + (-E)|u|^2 with eigenvalue 1 => M = 4, (1/2) M w^2 = -E => w = sqrt(-E/2); (N+2) w = 1 => N = 2n - 2')
for n in [1, 2, 6, 15]:
    E = -0.5 / n / n; om = math.sqrt(-E / 2)
    print(f'  n={n}: w = {om:.6f} = 1/(2n) = {1 / (2 * n):.6f};  N = 1/w - 2 = {1 / om - 2:.6f}')
