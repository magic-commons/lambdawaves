# bf-r1-probes.py — BEYOND THE FRONTIER (λWAVES), round 1 (Fable). Numbers for the position paper.
#   A  the revival-peak shift: discrete ladder vs the continuum Airy model, the first-order law x* = -4σ²/n̄ (T_cl units)
#   B  Fock's sphere: the momentum wavefunction as a hyperspherical harmonic, normalization on S³
#   C  the KS count: fibre-invariant monomials at oscillator level N = 2(n-1) number n²
#   D  the vortex line of a two-mode superposition rotates rigidly at the Bohr frequency
import math, cmath, sys
import numpy as np
from scipy import special, integrate, optimize

part = sys.argv[1] if len(sys.argv) > 1 else 'ABCD'

def R_nl(n, l, r):
    rho = 2.0 * r / n
    norm = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return norm * math.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)

def F_closed(n, l, p):
    x = (n * n * p * p - 1) / (n * n * p * p + 1)
    pref = math.sqrt(2 * math.factorial(n - l - 1) / (math.pi * math.factorial(n + l)))
    return pref * n * n * 2 ** (2 * l + 2) * math.factorial(l) * (n * p) ** l / (n * n * p * p + 1) ** (l + 2) * special.eval_gegenbauer(n - l - 1, l + 1, x)

# ── A ─────────────────────────────────────────────────────────────────────────
if 'A' in part:
    print('A · THE REVIVAL-PEAK SHIFT')
    print('   populations p_k ∝ exp(-k²/(2σ²)), k = n - n̄; x = (t - T_rev)/T_cl; β = 8πσ³/(3n̄)')
    def ladder(nbar, sig):
        ks = np.arange(-int(6 * sig + 2), int(6 * sig + 3))
        ns = nbar + ks; ns = ns[ns >= 1]; ks = ns - nbar
        w = np.exp(-ks ** 2 / (2 * sig * sig)); p = w / w.sum()
        E = -0.5 / ns.astype(float) ** 2
        return ks, p, E
    def A_at(p, E, t): return abs(np.sum(p * np.exp(-1j * E * t)))
    def cont_I(alpha, beta, gam=0.0):
        f = lambda u: np.exp(-u * u / 2) * np.exp(1j * (alpha * u + gam * u * u + beta * u ** 3))
        re = integrate.quad(lambda u: f(u).real, -12, 12, limit=400)[0]
        im = integrate.quad(lambda u: f(u).imag, -12, 12, limit=400)[0]
        return math.hypot(re, im) / math.sqrt(2 * math.pi)
    print('   n̄    σ     β      x*(ladder)   |A|max    x*(-4σ²/n̄)   x*(continuum)   |A|cont')
    rows = []
    for nbar in [30, 45, 60, 90, 150]:
        for sig in [0.8, 1.0, 1.2, 1.5, 2.0]:
            ks, p, E = ladder(nbar, sig)
            Tcl = 2 * math.pi * nbar ** 3; Trev = 4 * math.pi / 3 * nbar ** 4
            xs = np.linspace(-0.5, 0.5, 20001)
            vals = np.array([A_at(p, E, Trev + x * Tcl) for x in xs])
            k = int(np.argmax(vals)); xstar = xs[k]; amax = vals[k]
            beta = 8 * math.pi * sig ** 3 / (3 * nbar)
            xpred = -4 * sig * sig / nbar
            # continuum model with the small quadratic term kept: phase = 2πxσu + (3πxσ²/n̄)u² + βu³
            res = optimize.minimize_scalar(lambda x: -cont_I(2 * math.pi * x * sig, beta, 3 * math.pi * x * sig * sig / nbar), bounds=(-0.5, 0.5), method='bounded', options={'xatol': 1e-5})
            xc = res.x; ac = -res.fun
            rows.append((nbar, sig, beta, xstar, amax, xpred, xc, ac))
            print(f'   {nbar:3d}  {sig:4.1f}  {beta:6.3f}   {xstar:+.4f}     {amax:.4f}    {xpred:+.4f}       {xc:+.4f}        {ac:.4f}')
    print('   universal curve α*(β) of the model |∫e^{-u²/2} e^{i(αu+βu³)}du| (no quadratic term):')
    for beta in [0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0]:
        res = optimize.minimize_scalar(lambda a: -cont_I(a, beta), bounds=(-12, 2), method='bounded', options={'xatol': 1e-6})
        print(f'     β={beta:5.2f}  α*={res.x:+.5f}   α*/(-3β)={res.x / (-3 * beta):.4f}   |A|max={-res.fun:.5f}   1-|A|={1 + res.fun:.3e}')

# ── B ─────────────────────────────────────────────────────────────────────────
if 'B' in part:
    print('B · FOCK\'S SPHERE')
    def Y4(N, l, chi):
        # hyperspherical harmonic's χ-part: N_{Nl} sin^l χ C^{l+1}_{N-l}(cos χ), normalized with ∫ |.|² sin²χ dχ = 1
        norm = math.sqrt(2 ** (2 * l + 1) * (N + 1) * math.factorial(N - l) * math.factorial(l) ** 2 / (math.pi * math.factorial(N + l + 1)))
        return norm * math.sin(chi) ** l * special.eval_gegenbauer(N - l, l + 1, math.cos(chi))
    for (n, l) in [(1, 0), (2, 1), (3, 0), (3, 2), (5, 3), (6, 5)]:
        N = n - 1; p0 = 1.0 / n
        I, _ = integrate.quad(lambda c: Y4(N, l, c) ** 2 * math.sin(c) ** 2, 0, math.pi, limit=200)
        worst = 0
        for p in [0.03, 0.1, 0.3, p0, 2 * p0, 1.1, 2.5]:
            chi = math.acos((p0 * p0 - p * p) / (p0 * p0 + p * p))        # cos χ = (p0² - p²)/(p0² + p²)
            fock = 4 * p0 ** 2.5 / (p0 * p0 + p * p) ** 2 * Y4(N, l, chi)
            worst = max(worst, abs(abs(fock) - abs(F_closed(n, l, p))) / max(abs(F_closed(n, l, q)) for q in [0.03, 0.1, 0.3, p0, 2 * p0, 1.1, 2.5]))
        print(f'   n={n} l={l}: ∫|Y_χ|² sin²χ dχ = {I:.10f};  |4p0^(5/2)/(p0²+p²)² · Y_{{N l}}(χ)| vs |F_nl(p)|: worst rel {worst:.2e}')

# ── C ─────────────────────────────────────────────────────────────────────────
if 'C' in part:
    print('C · THE KS COUNT — degree-N monomials in (w1, w2, w̄1, w̄2) with #w = #w̄ (fibre-invariant), N = 2(n-1)')
    for n in range(1, 8):
        N = 2 * (n - 1); cnt = 0; harm = 0
        for a in range(N + 1):                    # #w = a, #w̄ = N - a
            if a != N - a: continue
            cnt += (a + 1) * (N - a + 1)          # monomials of degree a in (w1,w2) times degree N-a in (w̄1,w̄2)
        total = (N + 1) * (N + 2) * (N + 3) // 6
        ls = list(range(n)); byl = sum(2 * l + 1 for l in ls)
        print(f'   n={n}: level N={N} has {total} states; fibre-invariant {cnt} = n² = {n * n}; Σ_(l<n)(2l+1) = {byl}')

# ── D ─────────────────────────────────────────────────────────────────────────
if 'D' in part:
    print('D · THE VORTEX LINE OF 2p₊ + 3p₀ ROTATES RIGIDLY')
    def Ylm(l, m, th, ph): return special.sph_harm_y(l, m, th, ph)
    E2, E3 = -0.125, -1 / 18
    a, b = 1 / math.sqrt(2), 1 / math.sqrt(2)
    def psi(t, r, th, ph):
        return a * cmath.exp(-1j * E2 * t) * R_nl(2, 1, r) * Ylm(1, 1, th, ph) + b * cmath.exp(-1j * E3 * t) * R_nl(3, 1, r) * Ylm(1, 0, th, ph)
    # theory: zeros where e^{iφ} = -(b/a) e^{-i(E3-E2)t} · (R31 Y10)/(R21 |Y11|/e^{iφ}) ... i.e. φ0(t) = arg(-b/a) - (E3-E2) t + arg(R31 cosθ / (R21 sinθ)) (+ the CS sign of Y11)
    omega = E3 - E2
    def nodal_points(t, nr=400):
        # on the surface |b R31 Y10| = |a R21 Y11| find (r, θ) pairs, then φ from the phase condition; verify |ψ| there
        pts = []
        for th in np.linspace(0.05, math.pi - 0.05, 60):
            g = lambda r: abs(b * R_nl(3, 1, r) * abs(Ylm(1, 0, th, 0))) - abs(a * R_nl(2, 1, r) * abs(Ylm(1, 1, th, 0)))
            rs = np.linspace(0.05, 30, nr); gv = [g(r) for r in rs]
            for i in range(nr - 1):
                if gv[i] * gv[i + 1] < 0:
                    r0 = optimize.brentq(g, rs[i], rs[i + 1])
                    # phase condition: solve for φ minimizing |ψ|
                    res = optimize.minimize_scalar(lambda ph: abs(psi(t, r0, th, ph)), bounds=(-math.pi, math.pi), method='bounded', options={'xatol': 1e-10})
                    pts.append((r0, th, res.x, res.fun))
        return pts
    P0 = nodal_points(0.0)
    t1 = 37.0
    P1 = nodal_points(t1)
    worst0 = max(p[3] for p in P0); worst1 = max(p[3] for p in P1)
    # the φ of each nodal point at t1 minus at t0, on matching (r,θ)
    dphis = []
    for (r0, th0, ph0, _), (r1, th1, ph1, _) in zip(P0, P1):
        d = (ph1 - ph0 + math.pi) % (2 * math.pi) - math.pi
        dphis.append(d)
    print(f'   nodal points found: {len(P0)} at t=0 (worst |ψ| {worst0:.1e}), {len(P1)} at t={t1} (worst |ψ| {worst1:.1e})')
    print(f'   Δφ over the curve: mean {np.mean(dphis):+.6f}, spread {np.std(dphis):.1e};  predicted -(E3-E2)·t = {-omega * t1:+.6f}  (mod 2π: {((-omega * t1 + math.pi) % (2 * math.pi)) - math.pi:+.6f})')
    # circulation: phase winding of ψ around one nodal point, on a small circle in the (x,y) plane
    r0, th0, ph0, _ = P0[len(P0) // 2]
    x0, y0, z0 = r0 * math.sin(th0) * math.cos(ph0), r0 * math.sin(th0) * math.sin(ph0), r0 * math.cos(th0)
    eps = 1e-3; wind = 0.0; last = None
    for s in np.linspace(0, 2 * math.pi, 721):
        x, y = x0 + eps * math.cos(s), y0 + eps * math.sin(s)
        rr = math.hypot(x, y, z0); tt = math.acos(z0 / rr); pp = math.atan2(y, x)
        ph = cmath.phase(psi(0.0, rr, tt, pp))
        if last is not None: wind += (ph - last + math.pi) % (2 * math.pi) - math.pi
        last = ph
    print(f'   phase winding around the nodal point (r={r0:.3f}, θ={th0:.3f}, φ={ph0:+.3f}) on a circle in a z-plane: {wind / (2 * math.pi):+.4f} turns')
    # the same construction with Δm = 2: 3d₊₊ (m=2) + 3s: two lines, rotating at ω/2
    print('   Δm = 2 check (3d₂ + 4s): number of φ-solutions per (r,θ) and the rotation rate')
    E3, E4 = -1 / 18, -1 / 32
    def psi2(t, r, th, ph): return a * cmath.exp(-1j * E3 * t) * R_nl(3, 2, r) * Ylm(2, 2, th, ph) + b * cmath.exp(-1j * E4 * t) * R_nl(4, 0, r) * Ylm(0, 0, th, ph)
    th = 1.0
    g = lambda r: abs(b * R_nl(4, 0, r) * abs(Ylm(0, 0, th, 0))) - abs(a * R_nl(3, 2, r) * abs(Ylm(2, 2, th, 0)))
    rs = np.linspace(0.05, 40, 800); gv = [g(r) for r in rs]; roots = [optimize.brentq(g, rs[i], rs[i + 1]) for i in range(799) if gv[i] * gv[i + 1] < 0]
    r0 = roots[0]
    def zeros_phi(t):
        phs = np.linspace(-math.pi, math.pi, 3601); v = np.array([abs(psi2(t, r0, th, ph)) for ph in phs])
        idx = [i for i in range(1, 3600) if v[i] < v[i - 1] and v[i] < v[i + 1] and v[i] < 1e-3]
        return [phs[i] for i in idx], [v[i] for i in idx]
    z0, v0 = zeros_phi(0.0); z1, v1 = zeros_phi(25.0)
    print(f'   at r={r0:.3f}, θ=1: zeros at φ = {np.round(z0, 4)} (|ψ| {np.max(v0):.1e});  at t=25: φ = {np.round(z1, 4)};  Δφ = {np.round(((np.array(z1) - np.array(z0) + math.pi) % (2 * math.pi)) - math.pi, 5)};  predicted -(E4-E3)t/2 = {-(E4 - E3) * 25 / 2:+.5f}')
