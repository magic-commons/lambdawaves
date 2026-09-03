# bf-r3-airy.py — the revival envelope in closed form (Fable, for round 3).
#   I(α,β) = (1/√2π) ∫ exp(-u²/2 + iαu + iβu³) du
#   complete the cube with u = v - i/(6β):  I = √(2π)/(3β)^{1/3} · exp(1/(108β²) + α/(6β)) · Ai((α + 1/(12β)) / (3β)^{1/3})
#   the peak in α:  Ai'(z)/Ai(z) = -(3β)^{1/3}/(6β),  z = (α + 1/(12β))/(3β)^{1/3}
import mpmath as mp
mp.mp.dps = 60

def I_airy(alpha, beta):
    b = mp.mpf(beta); a = mp.mpf(alpha)
    c = (3 * b) ** (mp.mpf(1) / 3)
    z = (a + 1 / (12 * b)) / c
    return mp.sqrt(2 * mp.pi) / c * mp.exp(1 / (108 * b * b) + a / (6 * b)) * mp.airyai(z)

def I_quad(alpha, beta):
    f = lambda u: mp.exp(-u * u / 2 + 1j * alpha * u + 1j * beta * u ** 3)
    return mp.quad(f, [-14, 14]) / mp.sqrt(2 * mp.pi)

print('closed form vs quadrature (|I|):')
for (a, b) in [(-0.06, 0.02), (-0.14437, 0.05), (-0.45774, 0.2), (-0.81673, 0.5), (0.3, 0.5), (-1.41263, 1.5), (-1.89744, 3.0)]:
    ia = I_airy(a, b); iq = I_quad(a, b)
    print(f'  α={a:+.5f} β={b:4.2f}: Airy {mp.nstr(abs(ia), 12)}  quad {mp.nstr(abs(iq), 12)}  diff {mp.nstr(abs(abs(ia) - abs(iq)), 3)}')

print('the peak law Ai\'(z)/Ai(z) = -(3β)^{1/3}/(6β):')
for b in [0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0]:
    b = mp.mpf(b); c = (3 * b) ** (mp.mpf(1) / 3)
    g = lambda z: mp.airyai(z, derivative=1) / mp.airyai(z) + c / (6 * b)
    # start from the small-β guess z0 = (α0 + 1/(12β))/c with α0 = -3β + 49.5β³
    a0 = -3 * b + mp.mpf(99) / 2 * b ** 3
    z0 = (a0 + 1 / (12 * b)) / c
    z = mp.findroot(g, z0)
    alpha = z * c - 1 / (12 * b)
    val = abs(I_airy(alpha, b))
    print(f'  β={float(b):5.2f}: z*={mp.nstr(z, 10)}  α*={mp.nstr(alpha, 10)}  α*/(-3β)={mp.nstr(alpha / (-3 * b), 8)}  |I|max={mp.nstr(val, 10)}  1-|I|={mp.nstr(1 - val, 6)}  3β²={mp.nstr(3 * b * b, 6)}  1-16.5β²={mp.nstr(1 - mp.mpf(33) / 2 * b * b, 6)}')
