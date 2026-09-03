# bf-r3-probes.py — Fable's preparation for round 3.
#   A  the Airy peak law: principal branch by continuation, the global maximum by scan, where they part
#   B  the arithmetic revival: |A|max near T_rev for σ = 2 against the denominator b of the cubic phase 4/(3n̄) = a/b
#   C  Pauli's Runge–Lenz element: A_z on the n = 2 shell, symbolically
import sys, math
part = sys.argv[1] if len(sys.argv) > 1 else 'ABC'

if 'A' in part:
    import mpmath as mp
    mp.mp.dps = 50
    def I_airy(alpha, beta):
        b = mp.mpf(beta); a = mp.mpf(alpha); c = (3 * b) ** (mp.mpf(1) / 3)
        return mp.sqrt(2 * mp.pi) / c * mp.exp(1 / (108 * b * b) + a / (6 * b)) * mp.airyai((a + 1 / (12 * b)) / c)
    print('A · the Airy peak law — principal branch (continued from small β) vs the global maximum (scan α ∈ [-8, 1])')
    print('    β      z*(principal)   α*(principal)   |I|(principal)   α*(global)   |I|(global)   same?')
    z_prev = None
    for beta in [0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0]:
        b = mp.mpf(beta); c = (3 * b) ** (mp.mpf(1) / 3)
        g = lambda z: mp.airyai(z, derivative=1) / mp.airyai(z) + c / (6 * b)
        if z_prev is None:
            a0 = -3 * b + mp.mpf(99) / 2 * b ** 3; z0 = (a0 + 1 / (12 * b)) / c
        else:
            z0 = z_prev
        z = mp.findroot(g, z0); z_prev = z
        alpha = z * c - 1 / (12 * b); val = abs(I_airy(alpha, b))
        best = (None, -1)
        for k in range(0, 1801):
            a = -8 + 9 * k / 1800
            v = abs(I_airy(a, b))
            if v > best[1]: best = (a, v)
        # refine the global maximum
        ag = mp.findroot(lambda a: mp.diff(lambda x: abs(I_airy(x, b)), a), mp.mpf(best[0]))
        vg = abs(I_airy(ag, b))
        print(f'  {beta:5.2f}   {mp.nstr(z, 8):>13}   {mp.nstr(alpha, 8):>12}   {mp.nstr(val, 8):>12}   {mp.nstr(ag, 8):>10}   {mp.nstr(vg, 8):>10}   {"yes" if abs(ag - alpha) < 1e-6 else "NO"}')

if 'B' in part:
    import numpy as np
    from fractions import Fraction
    from scipy import integrate, optimize
    print('B · the arithmetic revival at σ = 2: the ladder\'s best |A| within ±T_cl/2 of T_rev, vs the continuum at the same β, vs the denominator b')
    def ladder(nbar, sig):
        ks = np.arange(-int(6 * sig + 2), int(6 * sig + 3)); ns = nbar + ks; ns = ns[ns >= 1]; ks = ns - nbar
        w = np.exp(-ks ** 2 / (2 * sig * sig)); p = w / w.sum(); E = -0.5 / ns.astype(float) ** 2
        return ks, p, E
    def cont_I(alpha, beta):
        f = lambda u: np.exp(-u * u / 2) * np.exp(1j * (alpha * u + beta * u ** 3))
        re = integrate.quad(lambda u: f(u).real, -12, 12, limit=400)[0]; im = integrate.quad(lambda u: f(u).imag, -12, 12, limit=400)[0]
        return math.hypot(re, im) / math.sqrt(2 * math.pi)
    sig = 2.0
    print('    n̄    b     β      |A|max(ladder)  x*     |I|max(continuum)   excess')
    for nbar in [21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 54, 60, 72, 90]:
        ks, p, E = ladder(nbar, sig)
        Tcl = 2 * math.pi * nbar ** 3; Trev = 4 * math.pi / 3 * nbar ** 4
        xs = np.linspace(-0.5, 0.5, 20001)
        vals = np.array([abs(np.sum(p * np.exp(-1j * E * (Trev + x * Tcl)))) for x in xs])
        k = int(np.argmax(vals))
        beta = 8 * math.pi * sig ** 3 / (3 * nbar)
        fr = Fraction(4, 3 * nbar)
        res = optimize.minimize_scalar(lambda a: -cont_I(a, beta), bounds=(-8, 1), method='bounded', options={'xatol': 1e-5})
        # the bounded optimizer can miss; scan too
        grid = np.linspace(-8, 1, 361); cv = max(cont_I(a, beta) for a in grid)
        cbest = max(-res.fun, cv)
        print(f'  {nbar:4d}  {fr.denominator:4d}  {beta:6.3f}   {vals[k]:.4f}        {xs[k]:+.3f}   {cbest:.4f}            {vals[k] - cbest:+.4f}')

if 'C' in part:
    import sympy as sp
    print('C · Pauli\'s element: the Runge–Lenz vector on the n = 2 shell, symbolically')
    x, y, z = sp.symbols('x y z', real=True)
    r = sp.sqrt(x * x + y * y + z * z)
    # real orbitals of the n = 2 shell (Condon–Shortley Y_1^0 = sqrt(3/4π) cosθ; Y_0^0 = 1/sqrt(4π))
    R20 = (1 / (2 * sp.sqrt(2))) * (2 - r) * sp.exp(-r / 2)
    R21 = r * sp.exp(-r / 2) / (2 * sp.sqrt(6))
    s2 = R20 / sp.sqrt(4 * sp.pi)
    pz2 = R21 * sp.sqrt(sp.Rational(3, 4) / sp.pi) * z / r
    def grad(f): return [sp.diff(f, v) for v in (x, y, z)]
    def p_op(f): return [-sp.I * g for g in grad(f)]
    def L_op(f):   # L = r × p
        px, py, pz = p_op(f)
        return [y * pz - z * py, z * px - x * pz, x * py - y * px]
    def cross(a, b): return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
    def pxL(f):    # (p × L) f : apply L first then p componentwise
        Lf = L_op(f)
        # p × (L f) = [p_y (L f)_z - p_z (L f)_y, ...] with p_i acting on the components
        Lx, Ly, Lz = Lf
        py_Lz = -sp.I * sp.diff(Lz, y); pz_Ly = -sp.I * sp.diff(Ly, z)
        pz_Lx = -sp.I * sp.diff(Lx, z); px_Lz = -sp.I * sp.diff(Lz, x)
        px_Ly = -sp.I * sp.diff(Ly, x); py_Lx = -sp.I * sp.diff(Lx, y)
        return [py_Lz - pz_Ly, pz_Lx - px_Lz, px_Ly - py_Lx]
    def Lxp(f):    # (L × p) f : apply p first, then L on components
        pf = p_op(f)
        def Lc(g): return L_op(g)
        # L × (p f) = [L_y (p f)_z - L_z (p f)_y, ...]
        Lpx, Lpy, Lpz = Lc(pf[0]), Lc(pf[1]), Lc(pf[2])   # each is [L_x g, L_y g, L_z g]
        return [Lpz[1] - Lpy[2], Lpx[2] - Lpz[0], Lpy[0] - Lpx[1]]
    def A_op(f):   # Hermitian Runge–Lenz: ½(p×L − L×p) − r̂
        a = pxL(f); b = Lxp(f)
        return [sp.Rational(1, 2) * (a[i] - b[i]) - [x, y, z][i] / r * f for i in range(3)]
    Az_s = sp.simplify(A_op(s2)[2]); Az_p = sp.simplify(A_op(pz2)[2])
    # decompose A_z|2s> = c1 |2s> + c2 |2p_z>, A_z|2p_z> = d1 |2s> + d2 |2p_z> by inner products (numerical quadrature is heavy; use the ratio at points)
    for name, expr in [('A_z 2s  / 2p_z', Az_s / pz2), ('A_z 2p_z / 2s', Az_p / s2)]:
        vals = [sp.N(expr.subs({x: xx, y: yy, z: zz}), 12) for (xx, yy, zz) in [(0.3, 0.2, 0.7), (1.1, -0.4, 0.5), (2.5, 1.0, -1.3)]]
        print(f'   {name} at three points: {vals}')
    # K = A/sqrt(-2E) with E = -1/8 → sqrt(-2E) = 1/2 → K = 2A
    print('   so K_z = 2 A_z:  K_z|2s> = (ratio·2)|2p_z>,  K_z|2p_z> = (ratio·2)|2s>  — Pauli says both coefficients are 1 (up to the phase convention)')
