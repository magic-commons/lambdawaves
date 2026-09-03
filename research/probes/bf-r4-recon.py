# bf-r4-recon.py — Round 4 (Opus).
#   PART A: Theorem C5's census made COMPLETE (one equation in r alone), and its completeness audited.
#   PART B: Q22 — the genuinely generic reconnection of the CUBIC 3d₊₂ + 4p₊₁ + 5s + 6p₋₁, reduced to a 2-D system.
#
# THE REDUCTION (DERIVED-HERE).  For a superposition of STRETCHED modes (l = |m| for every mode) the angular profile
# of the m-th mode is exactly Θ_m ∝ sin^{|m|}θ, so with ξ = sinθ and W = ξ w (w = e^{iφ}) the azimuthal polynomial
#     P(w) = Σ_m A_m(r,θ,t) w^{m−m_min},   A_m = Â_m(r,t)·ξ^{|m|}
# becomes, after clearing ξ, a polynomial Q(W) whose coefficients depend on r and t ONLY, with μ = ξ² entering
# linearly in exactly one coefficient.  A reconnection is Q(W)=Q'(W)=0 with |W|² = μ ∈ (0,1].
#   • quadratic (C5, m = 2,1,0):  Q = Â₂W² + Â₁W + Â₀ — μ does not enter at all; disc = 0 is ONE equation in r
#     plus the two-phase law, and the census is a ROOT COUNT of a single function of r.  No grid, no missed points.
#   • cubic (Q22, m = 2,1,0,−1):  Q = Â₂W³ + Â₁W² + Â₀W + μÂ₋₁ ; Q'(W) = 0 is μ-free, so W = W±(r,t) and
#     μ = −(Â₂W³+Â₁W²+Â₀W)/Â₋₁ must be real, in (0,1], and equal to |W|².  Two real equations in (r,t).
import math, cmath, sys
import numpy as np
from scipy import special, optimize

def R(n, l, r):
    rho = 2.0 * np.asarray(r, float) / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * np.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
def stretched_const(m):
    """Θ_m(θ) / sin^{|m|}θ for the stretched harmonic Y_{|m|}^{m}(θ,0) — a constant (Condon–Shortley, scipy)."""
    l = abs(m); vals = []
    for th in (0.3, 0.7, 1.1, 2.0):
        vals.append(special.sph_harm_y(l, m, th, 0.0).real / math.sin(th) ** l)
    assert max(vals) - min(vals) < 1e-12, (m, vals)
    return vals[0]
E = {n: -0.5 / n ** 2 for n in range(1, 8)}

# ============================================================ PART A — C5, complete census
print('=' * 100)
print('PART A — Theorem C5 (ψ = (3d₊₂ + 4p₊₁ + 5s)/√3): the census as a ROOT COUNT in r alone')
print('=' * 100)
c = 1 / math.sqrt(3)
gp = lambda r: c * R(3, 2, r) * stretched_const(2)      # Â₊ : m = +2, l = 2
g0 = lambda r: c * R(4, 1, r) * stretched_const(1)      # Â₀ : m = +1, l = 1
gm = lambda r: c * R(5, 0, r) * stretched_const(0)      # Â₋ : m =  0, l = 0
om = E[3] + E[5] - 2 * E[4]; Td = 2 * math.pi / abs(om)
# disc(Q) = Â₀²e^{−2iE₄t} − 4Â₊Â₋e^{−i(E₃+E₅)t} = 0  ⇒  e^{iωt} = ±1 and Φ(r) := Â₀² − 4|Â₊Â₋| = 0,
# with ξ = |Â₀| / (2|Â₊|) = sinθ ≤ 1.
Phi = lambda r: g0(r) ** 2 - 4 * abs(gp(r) * gm(r))
xi  = lambda r: abs(g0(r)) / (2 * abs(gp(r)))
rr = np.linspace(1e-4, 200.0, 4000000)
Pv = Phi(rr)
sgn = np.where(np.abs(Pv) < 1e-300, 0.0, np.sign(Pv))
idx = np.where(sgn[:-1] * sgn[1:] < 0)[0]
print(f'  Φ(r) = Â₀(r)² − 4|Â₊(r)Â₋(r)| scanned on r ∈ (0, 200] with 4·10⁶ samples: {len(idx)} sign changes')
roots = []
for i in idx:
    r0 = optimize.brentq(Phi, rr[i], rr[i + 1], xtol=1e-14, rtol=1e-15)
    roots.append(r0)
print('   root r          ξ = sinθ      θ            π−θ          admissible (ξ≤1)?    ρ = r sinθ    z = r cosθ')
admissible = []
for r0 in roots:
    x = xi(r0)
    ok = x <= 1.0
    th = math.asin(min(x, 1.0))
    print(f'  {r0:11.7f}   {x:11.8f}   {th:9.6f}   {math.pi-th:9.6f}    {"YES" if ok else "no  (ξ>1)"}'
          + (f'      {r0*math.sin(th):8.4f}   {r0*math.cos(th):+9.4f}' if ok else ''))
    if ok: admissible.append((r0, th))
print(f'  ⇒ {len(admissible)} admissible radii × 2 (θ, π−θ) = {2*len(admissible)} reconnection points.  '
      f'Fable\'s bf-r3-recon6 reported 6.')
print(f'  T_d = {Td:.4f} a.u.; firing phase: t ≡ 0 if Â₊Â₋ > 0, t ≡ T_d/2 if Â₊Â₋ < 0.')
for r0, th in admissible:
    s = gp(r0) * gm(r0)
    t0 = 0.0 if s > 0 else Td / 2
    Wd = -g0(r0) * cmath.exp(-1j * E[4] * t0) / (2 * gp(r0) * cmath.exp(-1j * E[3] * t0))
    print(f'   r={r0:10.6f}  θ={th:8.5f}  sgn(Â₊Â₋)={"+" if s>0 else "−"}  t₀={t0:9.4f}  |W_d|={abs(Wd):.10f} '
          f'(=sinθ={math.sin(th):.10f})  φ_d = arg(W_d/ξ) = {cmath.phase(Wd):+8.5f}')
# asymptotic audit: is anything missed at small r or large r?
print('  ASYMPTOTIC AUDIT (why the list above is COMPLETE):')
for r0 in [1e-4, 1e-3, 1e-2, 0.1]:
    print(f'    r={r0:7.4g}: Φ={Phi(r0):+.6e}, ξ={xi(r0):.4g}')
for r0 in [60, 80, 100, 150, 200, 300]:
    print(f'    r={r0:7.4g}: Φ={Phi(r0):+.6e}, ξ={xi(r0):.4g}   (Â₀²∼e^{{−r/2}}, 4|Â₊Â₋|∼e^{{−8r/15}}: Φ<0 for large r)')
print('    small r: Â₋∼r⁰, Â₀∼r, Â₊∼r² ⇒ Φ ∼ (a₀²−4a₊a₋)r² and ξ ∼ const/r → ∞: the constraint ξ≤1 fails.')
print('    large r: Â₀²∼e^{−r/2} beats 4|Â₊Â₋|∼e^{−(1/3+1/5)r}=e^{−8r/15}, so Φ>0 eventually and ξ∼e^{r/12}→∞.')

# ============================================================ PART B — Q22, the cubic
print()
print('=' * 100)
print('PART B — Q22: ψ = (3d₊₂ + 4p₊₁ + 5s + 6p₋₁)/2, the cubic P(w).  Reduced system in (r,t).')
print('=' * 100)
cc = 0.5
A2 = lambda r: cc * R(3, 2, r) * stretched_const(2)     # m = +2
A1 = lambda r: cc * R(4, 1, r) * stretched_const(1)     # m = +1
A0 = lambda r: cc * R(5, 0, r) * stretched_const(0)     # m =  0
Am = lambda r: cc * R(6, 1, r) * stretched_const(-1)    # m = −1
ph = lambda n, t: np.exp(-1j * E[n] * np.asarray(t, float))
# fundamental period: energies in units of 1/7200 are −400,−225,−144,−100; differences 300,125,44 → gcd 1
Tper = 2 * math.pi * 7200.0
print(f'  energies (×7200): E3,E4,E5,E6 = {-400},{-225},{-144},{-100};  gcd of differences 300,125,44 = '
      f'{math.gcd(math.gcd(300,125),44)} ⇒ fundamental period T = 2π·7200 = {Tper:.2f} a.u.')
print(f'  discriminant of the cubic is a FIVE-term exponential sum in t: the five phase sums (×7200) are')
print(f'    a₃a₂a₁a₀ : {-(400+225+144+100)},  a₂³a₀ : {-(3*225+100)},  a₂²a₁² : {-(2*225+2*144)},'
      f'  a₃a₁³ : {-(400+3*144)},  a₃²a₀² : {-(2*400+2*100)}   — all distinct ⇒ no single-phase factorisation.')

def branches(r, t):
    """the two roots of Q'(W) = 3a W² + 2b W + c, with a=Â₂e^{−iE₃t}, b=Â₁e^{−iE₄t}, c=Â₀e^{−iE₅t}."""
    a = A2(r) * ph(3, t); b = A1(r) * ph(4, t); cq = A0(r) * ph(5, t)
    disc = np.sqrt((2 * b) ** 2 - 4 * (3 * a) * cq + 0j)
    return (-2 * b + disc) / (6 * a), (-2 * b - disc) / (6 * a)
def mu_of(r, t, W):
    a = A2(r) * ph(3, t); b = A1(r) * ph(4, t); cq = A0(r) * ph(5, t); d = Am(r) * ph(6, t)
    return -(a * W ** 3 + b * W ** 2 + cq * W) / d

NR, NT = 700, 30000
rs = np.linspace(0.4, 45.0, NR)
ts = np.linspace(0.0, Tper, NT, endpoint=False)
cands = []
for i, r0 in enumerate(rs):
    for W in branches(r0, ts):
        m = mu_of(r0, ts, W)
        F1 = m.imag
        F2 = m.real - np.abs(W) ** 2
        s1 = np.sign(F1); s2 = np.sign(F2)
        hit = (s1[:-1] * s1[1:] < 0) & (np.abs(F2[:-1]) < 3.0) & (m.real[:-1] > 0) & (m.real[:-1] < 1.5)
        for j in np.where(hit)[0]:
            mu = max(min(m.real[j], 1.0), 1e-9)
            th_seed = math.asin(math.sqrt(mu)); ph_seed = float(np.angle(W[j]))
            cands.append((r0, float(ts[j]), th_seed, ph_seed))
            cands.append((r0, float(ts[j]), math.pi - th_seed, ph_seed))
print(f'  2-D scan {NR}×{NT}×2 branches: {len(cands)} seeds where Im μ changes sign with Re μ ∈ (0,1.5) nearby')

# full 4-D Newton on (r, θ, t, φ):  P(w)=0 and P'(w)=0 with w = e^{iφ}
def Pfun(r, th, t, phi):
    x = math.sin(th); w = cmath.exp(1j * phi)
    a = A2(r) * complex(ph(3, t)) * x ** 2
    b = A1(r) * complex(ph(4, t)) * x
    cq = A0(r) * complex(ph(5, t))
    d = Am(r) * complex(ph(6, t)) * x
    return d + cq * w + b * w ** 2 + a * w ** 3, cq + 2 * b * w + 3 * a * w ** 2
def Fsys(v):
    P, Pp = Pfun(v[0], v[1], v[2], v[3])
    return [P.real, P.imag, Pp.real, Pp.imag]
events = []
for (r0, t0, th0, phi0) in cands:
    try:
        sol, info, ier, msg = optimize.fsolve(Fsys, [r0, th0, t0, phi0], full_output=True, xtol=1e-13)
    except Exception:
        continue
    if ier != 1: continue
    r1, th1, t1, p1 = sol
    if not (0.3 < r1 < 60 and 1e-3 < th1 < math.pi - 1e-3): continue
    t1 = t1 % Tper; p1 = p1 % (2 * math.pi)
    P, Pp = Pfun(r1, th1, t1, p1)
    scale = abs(A0(r1)) + abs(A1(r1)) + abs(A2(r1)) + abs(Am(r1))
    if abs(P) / scale > 1e-11 or abs(Pp) / scale > 1e-11: continue
    if not any(abs(r1 - e[0]) < 1e-5 and abs(th1 - e[1]) < 1e-5 and
               min(abs(t1 - e[2]), Tper - abs(t1 - e[2])) < 1e-3 for e in events):
        events.append((r1, th1, t1, p1, abs(P) / scale, abs(Pp) / scale))
events.sort(key=lambda e: e[2])
print(f'  {len(events)} distinct reconnection events found in one full period')
print('      r          θ          t (a.u.)      t/T_d(3,5,4)   φ           ρ          z        |P|/s     |P\'|/s')
Tdq = 2 * math.pi / abs(E[3] + E[5] - 2 * E[4])
for r1, th1, t1, p1, e1, e2 in events[:40]:
    print(f'  {r1:9.6f}  {th1:9.6f}  {t1:12.5f}  {t1/Tdq:11.6f}  {p1:8.5f}  {r1*math.sin(th1):9.5f} '
          f'{r1*math.cos(th1):+9.5f}  {e1:.1e}  {e2:.1e}')
if events:
    r1, th1, t1, p1 = events[0][:4]
    print(f'\n  FIRST EVENT: t = {t1:.6f} a.u., (ρ,z) = ({r1*math.sin(th1):.6f}, {r1*math.cos(th1):+.6f}), φ = {p1:.6f}')
    for nm, per in [('T_cl(3)', 2*math.pi*27), ('beat 3-4', 2*math.pi/abs(E[3]-E[4])), ('beat 4-5', 2*math.pi/abs(E[4]-E[5])),
                    ('beat 5-6', 2*math.pi/abs(E[5]-E[6])), ('beat 3-5', 2*math.pi/abs(E[3]-E[5])),
                    ('beat 3-6', 2*math.pi/abs(E[3]-E[6])), ('beat 4-6', 2*math.pi/abs(E[4]-E[6]))]:
        f = (t1 % per) / per
        print(f'    t mod {nm:9s} (T={per:11.4f}) = {t1%per:11.5f}  → phase {f:.6f} of the period '
              f'({"≡0 or 1/2" if min(f, abs(f-0.5), 1-f) < 1e-4 else "GENERIC"})')
    # local normal form: the two roots near the event
    for dt in (-0.5, 0.5):
        x = math.sin(th1); tt = t1 + dt
        co = [A2(r1)*complex(ph(3,tt))*x**2, A1(r1)*complex(ph(4,tt))*x, A0(r1)*complex(ph(5,tt)), Am(r1)*complex(ph(6,tt))*x]
        rts = np.roots(co)
        rts = sorted(rts, key=lambda z: abs(abs(z) - 1))
        print(f'    τ={dt:+.1f}: the three roots |w| = {[round(abs(z),6) for z in rts]}, '
              f'|w₁−w₂| = {abs(rts[0]-rts[1]):.6f}')
