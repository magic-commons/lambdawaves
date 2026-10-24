"""knots.py — knotted nodal lines of hydrogen in the λWAVES register (n ≤ 7): Berry's construction re-derived,
converted to the app's convention (lab/hydrogen.js), and verified on the expanded superposition.
Run: OMP_NUM_THREADS=2 nice -n 19 python -I knots.py [stage ...]   (no stage = all)."""
import json, sys, os, subprocess, math
import numpy as np
import sympy as sp
import mpmath as mpm

HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.normpath(os.path.join(HERE, '..', '..', '..', 'lab'))
mpm.mp.dps = 40
X = sp.Symbol('x'); RHO = sp.Symbol('rho', positive=True)

# ── Berry's unnormalised ingredients (Found. Phys. 31, 659, eq. 2): ρ^l e^{-ρ/2} L^{2l+1}_{n-l-1}(ρ) P_l^m(cos θ) e^{imφ}, ρ = 2r/n
def legendre_assoc(l, m):  # P_l^m(x) with the Condon–Shortley phase, m ≥ 0
    return sp.expand((-1) ** m * (1 - X ** 2) ** sp.Rational(m, 2) * sp.diff(sp.legendre(l, X), X, m))

def radial_poly(n, l):  # ρ^l L^{2l+1}_{n-l-1}(ρ), modern (Rodrigues 1/k!) normalisation, as hydrogen.js
    return sp.expand(RHO ** l * sp.assoc_laguerre(n - l - 1, 2 * l + 1, RHO))

def berry_loop(n, m, le, lo):
    """Second-order equatorial zero loop from l = le[0], le[1] (l-m even) and lo[0], lo[1] (l-m odd), Berry eq. (3).
    Returns every ρ* > 0 with a, b: f = F_le0 + a F_le1 has a double zero at ρ*, g = G_lo0 + b G_lo1 a simple one."""
    Pe = [legendre_assoc(l, m).subs(X, 0) for l in le]
    Po = [sp.diff(legendre_assoc(l, m), X).subs(X, 0) for l in lo]   # ∂_z ψ|_{θ=π/2} ∝ P_l^m'(0) R(r)/r
    F = [radial_poly(n, l) * p for l, p in zip(le, Pe)]
    G = [radial_poly(n, l) * p for l, p in zip(lo, Po)]
    W = sp.Poly(sp.expand(sp.cancel((F[0] * sp.diff(F[1], RHO) - sp.diff(F[0], RHO) * F[1]) / RHO ** (le[0] + le[1] - 1))), RHO)
    out = []
    for r in W.nroots(n=40, maxsteps=400):
        r = complex(r)
        if abs(r.imag) > 1e-25 or r.real <= 1e-12: continue
        rs = sp.Float(str(mpm.findroot(lambda t: mpm.mpf(str(W.eval(sp.Float(str(t), 45)))), mpm.mpf(r.real))), 40)
        a = -F[0].subs(RHO, rs) / F[1].subs(RHO, rs)
        b = -G[0].subs(RHO, rs) / G[1].subs(RHO, rs)
        out.append({'rho_star': float(rs), 'r_star_bohr': float(rs) * n / 2, 'a': float(a), 'b': float(b)})
    return sorted(out, key=lambda d: d['rho_star'])

def stage_berry():
    res = {'link_n6_m2': berry_loop(6, 2, (2, 4), (5, 3)), 'trefoil_n7_m3': berry_loop(7, 3, (3, 5), (4, 6))}
    print(json.dumps(res, indent=1))
    return res

# ── the app's convention (lab/hydrogen.js, frozen): ψ_nlm = R_nl Y_l^m, CS phase, Y_l^{-m} = (-1)^m conj Y_l^m ──
L_LETTERS = 'spdfghik'; SUBD = '₀₁₂₃₄₅₆₇₈₉'
def label(n, l, m):  # names.js atomForms(...).typeset, character for character
    return f"{n}{L_LETTERS[l]}" + ''.join('₋' if c == '-' else SUBD[int(c)] for c in str(m))

def radial_norm(n, l): return math.sqrt((2 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
def ylm_norm(l, m): return math.sqrt((2 * l + 1) / (4 * math.pi) * math.factorial(l - abs(m)) / math.factorial(l + abs(m)))

class Mode:
    """one ψ_nlm as hydrogen.js modeTable: norm · e^{-ρ/2} ρ^l L(ρ) · sin^{|m|}θ d^{|m|}P_l(cos θ) · e^{imφ}"""
    def __init__(self, n, l, m):
        am = abs(m); self.n, self.l, self.m, self.am = n, l, m, am
        self.lag = [float(c) for c in reversed(sp.Poly(sp.assoc_laguerre(n - l - 1, 2 * l + 1, RHO), RHO).all_coeffs())]
        self.leg = [float(c) for c in reversed(sp.Poly(sp.diff(sp.legendre(l, X), X, am), X).all_coeffs())]
        sign = -1.0 if (m >= 0 and am % 2 == 1) else 1.0
        self.norm = sign * radial_norm(n, l) * ylm_norm(l, am)
    def __call__(self, x, y, z):
        r = np.sqrt(x * x + y * y + z * z); rs = np.where(r < 1e-300, 1.0, r)
        rho = 2 * r / self.n; ct = np.where(r < 1e-300, 1.0, z / rs)
        L = np.polynomial.polynomial.polyval(rho, self.lag); D = np.polynomial.polynomial.polyval(ct, self.leg)
        w = ((x + 1j * np.sign(self.m) * y) / rs) ** self.am if self.am else 1.0   # sin^{|m|}θ e^{imφ}
        return self.norm * np.exp(-rho / 2) * rho ** self.l * L * D * w

class State:
    """ψ = Σ c_a ψ_a over app labels; coeffs {(n,l,m): complex}"""
    def __init__(self, coeffs):
        self.c = dict(coeffs); self.modes = {k: Mode(*k) for k in self.c}
    def __call__(self, x, y, z):
        x, y, z = np.broadcast_arrays(np.asarray(x, float), np.asarray(y, float), np.asarray(z, float))
        out = np.zeros(x.shape, complex)
        for k, c in self.c.items(): out += c * self.modes[k](x, y, z)
        return out
    def normalised(self, lead=None):
        s = math.sqrt(sum(abs(c) ** 2 for c in self.c.values())); ph = 1.0
        if lead is not None: ph = abs(self.c[lead]) / self.c[lead]
        return State({k: c * ph / s for k, c in self.c.items()})
    def table(self):
        return [{'n': n, 'l': l, 'm': m, 'label': label(n, l, m), 're': c.real, 'im': c.imag, 'amp': abs(c), 'phase': math.atan2(c.imag, c.real)}
                for (n, l, m), c in sorted(self.c.items())]
    def app_json(self): return {label(n, l, m): [c.real, c.imag] for (n, l, m), c in sorted(self.c.items())}
    def preset_modes(self): return [{'n': n, 'l': l, 'm': m, 'amp': abs(c), 'phase': math.atan2(c.imag, c.real)} for (n, l, m), c in sorted(self.c.items())]

def from_berry(terms):
    """Berry's unnormalised ψ_nlm (eq. 2, P_l^m with the CS phase) = app ψ_nlm / (N_nl K_lm), for m ≥ 0"""
    return State({(n, l, m): complex(b) / (radial_norm(n, l) * ylm_norm(l, m)) for (n, l, m), b in terms.items()})

def node_psi(state, pts):
    """the oracle: lab/hydrogen.js psiAt itself, run by node on the same coefficients"""
    code = ("import * as H from %s; let s=''; process.stdin.on('data',d=>s+=d); process.stdin.on('end',()=>{const q=JSON.parse(s);"
            "const re=new Float64Array(140), im=new Float64Array(140); for(const [id,c] of q.c){const a=H.BASIS_INDEX.get(id); re[a]=c[0]; im[a]=c[1];}"
            "const lab={}; for(const [id] of q.c) lab[id]=H.BASIS[H.BASIS_INDEX.get(id)].label;"
            "process.stdout.write(JSON.stringify({v:q.p.map(p=>{const o=H.psiAt(re,im,p[0],p[1],p[2]); return [o.re,o.im];}), lab}));});") % json.dumps(os.path.join(LAB, 'hydrogen.js'))
    inp = json.dumps({'c': [[f'h:{n}:{l}:{m}', [c.real, c.imag]] for (n, l, m), c in state.c.items()], 'p': np.asarray(pts).tolist()})
    out = json.loads(subprocess.run(['node', '--input-type=module', '-e', code], input=inp, capture_output=True, text=True, check=True).stdout)
    return np.array([complex(a, b) for a, b in out['v']]), out['lab']

def oracle_check(state, rmax, npts=2000, seed=1):
    rng = np.random.default_rng(seed); p = rng.uniform(-rmax, rmax, (npts, 3))
    v_node, lab = node_psi(state, p); v_py = state(p[:, 0], p[:, 1], p[:, 2])
    bad = [k for k in state.c if lab[f'h:{k[0]}:{k[1]}:{k[2]}'] != label(*k)]
    return {'points': npts, 'box_half_bohr': rmax, 'max_abs_diff_over_max_abs': float(np.max(np.abs(v_node - v_py)) / np.max(np.abs(v_node))),
            'labels_match_names_js': not bad}

def berry_exact_check(terms, state, rmax, npts=400, seed=2):
    """Berry's formula evaluated independently (mpmath Laguerre/Legendre, 30 digits) vs the converted app-basis sum"""
    rng = np.random.default_rng(seed); p = rng.uniform(-rmax, rmax, (npts, 3)); num = 0.0; den = 0.0
    v = state(p[:, 0], p[:, 1], p[:, 2])
    for i, (x, y, z) in enumerate(p):
        r = mpm.sqrt(x * x + y * y + z * z); th = mpm.acos(z / r); ph = mpm.atan2(y, x); s = 0
        for (n, l, m), b in terms.items():
            rho = 2 * r / n
            s += mpm.mpc(b) * rho ** l * mpm.exp(-rho / 2) * mpm.laguerre(n - l - 1, 2 * l + 1, rho) * mpm.legenp(l, m, mpm.cos(th), type=2) * mpm.expj(m * ph)   # mpmath's Ferrers P_l^m carries the CS phase
        num = max(num, abs(complex(s) - v[i])); den = max(den, abs(complex(s)))
    return {'points': npts, 'max_abs_diff_over_max_abs': num / den}

# ── the nodal curve: seeds in a half-plane, Newton onto {Re ψ = Im ψ = 0}, pseudo-arclength tracing ──────────────
H_FD = 1e-5
def jac(state, p):
    """ψ(p) and the 2×3 Jacobian [∇Re ψ; ∇Im ψ] by central differences"""
    q = np.array([p] + [p + s * H_FD * e for e in np.eye(3) for s in (1, -1)])
    v = state(q[:, 0], q[:, 1], q[:, 2]); g = (v[1::2] - v[2::2]) / (2 * H_FD)
    return v[0], np.array([g.real, g.imag])

def project(state, p, it=30, tol=1e-12):
    """minimum-norm Newton onto the zero curve"""
    for _ in range(it):
        v, J = jac(state, p); f = np.array([v.real, v.imag])
        d = -J.T @ np.linalg.solve(J @ J.T, f); p = p + d
        if np.linalg.norm(d) < tol: return p, True
    return p, False

def tangent(state, p):
    _, J = jac(state, p); t = np.cross(J[0], J[1]); return t / np.linalg.norm(t), J

def seeds_halfplane(state, phi, R0, R1, z0, z1, nR=240, nz=240):
    """every zero of ψ in the half-plane window, from plaquette phase winding, Newton-polished in (R, z)"""
    R = np.linspace(R0, R1, nR); Z = np.linspace(z0, z1, nz); RR, ZZ = np.meshgrid(R, Z, indexing='ij')
    v = state(RR * math.cos(phi), RR * math.sin(phi), ZZ); a = np.angle(v)
    w = lambda p, q: np.angle(np.exp(1j * (q - p)))
    wind = (w(a[:-1, :-1], a[1:, :-1]) + w(a[1:, :-1], a[1:, 1:]) + w(a[1:, 1:], a[:-1, 1:]) + w(a[:-1, 1:], a[:-1, :-1])) / (2 * math.pi)
    out = []
    for i, j in zip(*np.nonzero(np.abs(wind) > 0.5)):
        p = np.array([(R[i] + R[i + 1]) / 2, (Z[j] + Z[j + 1]) / 2])
        for _ in range(40):
            P = np.array([p[0] * math.cos(phi), p[0] * math.sin(phi), p[1]]); v0, J = jac(state, P)
            J2 = np.array([[J[0] @ [math.cos(phi), math.sin(phi), 0], J[0][2]], [J[1] @ [math.cos(phi), math.sin(phi), 0], J[1][2]]])
            d = -np.linalg.solve(J2, [v0.real, v0.imag]); p = p + d
            if np.linalg.norm(d) < 1e-13: break
        if all(np.linalg.norm(p - q) > 1e-7 for q, _ in out): out.append((p, int(round(wind[i, j]))))
    return [(np.array([p[0] * math.cos(phi), p[0] * math.sin(phi), p[1]]), s) for p, s in out]

def trace(state, p0, step=0.02, maxlen=2000.0, rbox=np.inf):
    """follow the oriented zero line (tangent ∇Re ψ × ∇Im ψ) from p0 until it closes (or leaves the ball |p| < rbox);
    returns the polyline (closed, first point not repeated)"""
    p, ok = project(state, p0); t, _ = tangent(state, p); pts = [p]; L = 0.0; h = step
    while L < maxlen and np.linalg.norm(p) < rbox:
        q, ok = project(state, p + h * t)
        if not ok or np.linalg.norm(q - p) > 1.5 * h: h /= 2; continue
        tq, J = tangent(state, q)
        if tq @ t < math.cos(0.15): h /= 2; continue
        L += np.linalg.norm(q - p); p, t = q, tq; pts.append(p); h = min(step, h * 1.5)
        if L > 20 * step and np.linalg.norm(p - pts[0]) < 0.75 * step: return np.array(pts[:-1]), True, L
    return np.array(pts), False, L

def curve_quality(state, C):
    """|ψ| on the curve relative to max|ψ| nearby, transversality sin∠(∇Re, ∇Im), phase winding on small loops"""
    vals, sines = [], []
    for p in C[:: max(1, len(C) // 400)]:
        v, J = jac(state, p); vals.append(abs(v)); sines.append(np.linalg.norm(np.cross(J[0], J[1])) / (np.linalg.norm(J[0]) * np.linalg.norm(J[1])))
    winds = []
    for k in np.linspace(0, len(C) - 1, 12).astype(int):
        t, J = tangent(state, C[k]); e1 = np.cross(t, [0.3, 0.5, 0.8]); e1 /= np.linalg.norm(e1); e2 = np.cross(t, e1)
        s = np.linspace(0, 2 * math.pi, 65); ring = C[k] + 0.01 * (np.outer(np.cos(s), e1) + np.outer(np.sin(s), e2))
        a = np.unwrap(np.angle(state(ring[:, 0], ring[:, 1], ring[:, 2]))); winds.append(int(round((a[-1] - a[0]) / (2 * math.pi))))
    scale = np.max(np.abs(state(*(C[::max(1, len(C) // 50)] + 0.5).T)))
    return {'max_abs_psi_on_curve_over_nearby': float(max(vals) / scale), 'min_sin_angle_gradRe_gradIm': float(min(sines)),
            'phase_winding_about_oriented_tangent_at_12_points': winds}

def components(state, seeds, step, rbox=np.inf):
    """trace from each seed; seeds on an already traced curve are merged"""
    comps = []
    for p, s in seeds:
        if any(np.min(np.linalg.norm(C - p, axis=1)) < 2 * step for C, _, _ in comps): continue
        comps.append(trace(state, p, step, rbox=rbox))
    return comps

# ── knot invariants from a generic planar projection of the traced polylines ────────────────────────────────────
def rotation(seed):
    q = np.random.default_rng(seed).normal(size=4); q /= np.linalg.norm(q); a, b, c, d = q
    return np.array([[a*a+b*b-c*c-d*d, 2*(b*c-a*d), 2*(b*d+a*c)], [2*(b*c+a*d), a*a-b*b+c*c-d*d, 2*(c*d-a*b)], [2*(b*d-a*c), 2*(c*d+a*b), a*a-b*b-c*c+d*d]])

def resample(C, n):
    """n points equally spaced in arclength along the closed polyline"""
    P = np.vstack([C, C[:1]]); s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))])
    u = np.linspace(0, s[-1], n, endpoint=False)
    return np.array([np.interp(u, s, P[:, k]) for k in range(3)]).T

def crossings(curves, Rm):
    """crossings of the projection onto the plane ⊥ Rm[2] (viewer at +Rm[2]); each: (comp_over, s_over, comp_under, s_under, sign)"""
    segs = []
    for ci, C in enumerate(curves):
        P = C @ Rm.T; Q = np.roll(P, -1, axis=0)
        for k in range(len(P)): segs.append((ci, k, P[k], Q[k]))
    A = np.array([s[2] for s in segs]); B = np.array([s[3] for s in segs]); out = []
    for i in range(len(segs)):
        d1 = B[i, :2] - A[i, :2]; d2 = B[:, :2] - A[:, :2]; r = A[:, :2] - A[i, :2]
        den = d1[0] * d2[:, 1] - d1[1] * d2[:, 0]
        with np.errstate(divide='ignore', invalid='ignore'):
            u = (r[:, 0] * d2[:, 1] - r[:, 1] * d2[:, 0]) / den; v = (r[:, 0] * d1[1] - r[:, 1] * d1[0]) / den
        for j in np.nonzero((u > 0) & (u < 1) & (v > 0) & (v < 1) & (np.arange(len(segs)) > i))[0]:
            ci, ki, cj, kj = segs[i][0], segs[i][1], segs[j][0], segs[j][1]
            if ci == cj and (abs(ki - kj) <= 1 or abs(ki - kj) == len(curves[ci]) - 1): continue
            zi = A[i, 2] + u[j] * (B[i, 2] - A[i, 2]); zj = A[j, 2] + v[j] * (B[j, 2] - A[j, 2])
            (co, so, do), (cu, su, du) = ((ci, ki + u[j], d1), (cj, kj + v[j], d2[j])) if zi > zj else ((cj, kj + v[j], d2[j]), (ci, ki + u[j], d1))
            out.append((co, so, cu, su, int(np.sign(do[0] * du[1] - do[1] * du[0])), abs(zi - zj)))
    return out

def alexander(curves, X):
    """Alexander polynomial of the diagram (Fox calculus rows), normalised: lowest power t^0, positive constant term"""
    arcs = []                                   # an arc runs from one undercrossing to the next along its component
    for ci, C in enumerate(curves):
        unders = sorted(su for co, so, cu, su, sg, dz in X if cu == ci)
        if not unders: arcs.append((ci, None, None)); continue
        for k in range(len(unders)): arcs.append((ci, unders[k - 1], unders[k]))   # (comp, start, end) cyclic
    def arc_of(ci, s):
        mine = [i for i, a in enumerate(arcs) if a[0] == ci]
        if arcs[mine[0]][1] is None: return mine[0]
        for i in mine:
            _, a, b = arcs[i]
            if (a < b and a < s <= b) or (a >= b and (s > a or s <= b)): return i
    t = sp.Symbol('t'); N = len(arcs)
    if len(X) == 0: return sp.Integer(1) if len(curves) == 1 else sp.Integer(0)
    M0 = np.zeros((len(X), N), dtype=object); M1 = np.zeros((len(X), N), dtype=object); M0[:] = 0; M1[:] = 0   # row = M0 + t M1
    for r, (co, so, cu, su, sg, dz) in enumerate(X):
        o = arc_of(co, so); i_in = arc_of(cu, su - 1e-9); i_out = arc_of(cu, su + 1e-9)
        M0[r, o] += 1; M1[r, o] -= 1
        if sg > 0: M1[r, i_in] += 1; M0[r, i_out] -= 1
        else: M0[r, i_in] -= 1; M1[r, i_out] += 1
    if N == 1: return sp.Integer(1)
    if N != len(X): return sp.Symbol('split')   # a component with no undercrossing: the diagram splits it off, Δ = 0
    pts =[(tv, sp.Matrix((M0 + tv * M1)[1:, 1:].tolist()).det(method='bareiss')) for tv in range(2, N + 2)]   # exact integers
    D = sp.Poly(sp.expand(sp.interpolate(pts, t)), t)
    if D.is_zero: return sp.Integer(0)
    c = D.all_coeffs()[::-1]; k = next(i for i, v in enumerate(c) if v != 0); c = c[k:]
    while c and c[-1] == 0: c.pop()
    if c[0] < 0: c = [-v for v in c]
    return sp.expand(sum(v * t ** i for i, v in enumerate(c)))

def torus_alexander(p, q):
    """KNOWN: Δ_{T(p,q)}(t) = (t^{pq}-1)(t-1)/((t^p-1)(t^q-1)) for coprime p, q"""
    t = sp.Symbol('t'); return sp.expand(sp.cancel((t ** (p * q) - 1) * (t - 1) / ((t ** p - 1) * (t ** q - 1))))

def tilt(seed, ang=0.07):
    """a view a small angle off the z axis (the braid axis): the diagram is then the closed braid"""
    a = np.random.default_rng(seed).uniform(0, 2 * math.pi); u = np.array([math.cos(a), math.sin(a), 0.0])
    K = np.array([[0, -u[2], u[1]], [u[2], 0, -u[0]], [-u[1], u[0], 0]])
    return (np.eye(3) + math.sin(ang) * K + (1 - math.cos(ang)) * K @ K).T

def invariants(curves, seeds=(11, 12, 13), npts=400, axial=(21, 22)):
    """for random generic projections (seeds) and near-axial ones: crossing count, Alexander polynomial, writhe per component, linking numbers"""
    cs = [resample(C, npts) for C in curves]; out = []
    for sd in list(seeds) + [('axial', s) for s in axial]:
        Rm = tilt(sd[1]) if isinstance(sd, tuple) else rotation(sd); X = crossings(cs, Rm)
        lk = {}
        for co, so, cu, su, sg, dz in X:
            if co != cu: key = f'{min(co, cu)}-{max(co, cu)}'; lk[key] = lk.get(key, 0) + sg / 2
        wr = [sum(sg for co, so, cu, su, sg, dz in X if co == cu == i) for i in range(len(cs))]
        al = alexander(cs, X); alc = [alexander([C], [(0, x[1], 0, x[3], x[4], x[5]) for x in X if x[0] == x[2] == i]) if len(cs) > 1 else None for i, C in enumerate(cs)]
        out.append({'projection': f'near-axial (0.07 rad), seed {sd[1]}' if isinstance(sd, tuple) else f'random rotation, seed {sd}', 'crossings': len(X), 'min_height_gap_at_crossings_bohr': float(min([x[5] for x in X], default=float('nan'))),
                    'alexander': str(al), 'alexander_per_component': [str(a) for a in alc] if len(cs) > 1 else None,
                    'self_writhe_per_component': wr, 'linking_numbers': lk})
    return out

def gauss_linking(A, B):
    """Gauss linking integral of two closed polylines (midpoint rule)"""
    a = np.vstack([A, A[:1]]); b = np.vstack([B, B[:1]]); da = np.diff(a, axis=0); db = np.diff(b, axis=0)
    ma = (a[:-1] + a[1:]) / 2; mb = (b[:-1] + b[1:]) / 2; tot = 0.0
    for i in range(len(ma)):
        r = ma[i] - mb; tot += np.sum(np.einsum('ij,ij->i', np.cross(da[i], db), r) / np.linalg.norm(r, axis=1) ** 3)
    return tot / (4 * math.pi)

def braid_word(curves, npts=600):
    """if every component winds monotonically about the z axis, the top view (viewer at +z) is a closed braid: the word in
    σ_i^{±1} (i counted outward from the axis, exponent = crossing sign), read in order of increasing azimuth"""
    cs = []
    for C in curves:
        C = resample(C, npts); ph = np.unwrap(np.arctan2(C[:, 1], C[:, 0]))
        if ph[-1] < ph[0]: C = C[::-1]; ph = np.unwrap(np.arctan2(C[:, 1], C[:, 0]))
        if not (np.all(np.diff(ph) > 0) and np.angle(np.exp(1j * (ph[0] - ph[-1]))) > 0): return {'monotone_in_azimuth': False}
        cs.append(C)
    X = crossings(cs, np.eye(3)); word = []
    for co, so, cu, su, sg, dz in X:
        k = int(su); f = su - k; C = cs[cu]; pt = C[k] * (1 - f) + C[(k + 1) % len(C)] * f; phc = math.atan2(pt[1], pt[0]); Rs = []
        for D in cs:
            a = np.angle(np.exp(1j * (np.arctan2(D[:, 1], D[:, 0]) - phc))); b = np.roll(a, -1)
            for j in np.nonzero((a < 0) & (b >= 0) & (b - a < 1))[0]:
                g = -a[j] / (b[j] - a[j]); E = D[j] * (1 - g) + D[(j + 1) % len(D)] * g; Rs.append(math.hypot(E[0], E[1]))
        Rs = sorted(Rs); Rc = math.hypot(pt[0], pt[1]); i = int(np.argsort(np.abs(np.array(Rs) - Rc))[:2].min())
        word.append(((phc % (2 * math.pi)), i + 1, sg))
    word.sort(); strands = len(Rs) if X else None
    return {'monotone_in_azimuth': True, 'strands': strands, 'word': ' '.join(f"s{i}{'+' if s > 0 else '-'}" for _, i, s in word),
            'all_same_sign': len(set(s for _, _, s in word)) <= 1, 'crossings': len(word)}

def sign_convention_check():
    """the crossing sign used here is pinned to the Gauss linking integral on a standard Hopf pair (same sign required)"""
    s = np.linspace(0, 2 * math.pi, 400, endpoint=False)
    A = np.c_[np.cos(s), np.sin(s), 0 * s]; B = np.c_[1 + np.cos(s), 0 * s, np.sin(s)]
    lk = invariants([A, B], seeds=(5,), axial=())[0]['linking_numbers']['0-1']; gl = gauss_linking(A, B)
    return {'hopf_crossing_linking': lk, 'hopf_gauss_integral': gl}

# ── the global nodal set on a grid: phase winding on every plaquette (independent of the tracer) ─────────────────
def nodal_scan(state, L, h, curves, zL=None):
    """pierced plaquettes of a cubic grid [-L, L]^2 × [-zL, zL]; cells grouped into components (26-connectivity).
    Returns the census, which components the traced curves fall in, and the distance from the curves to every other component."""
    from scipy import ndimage
    from scipy.spatial import cKDTree
    zL = L if zL is None else zL
    g = np.arange(-L, L + 1e-9, h); gz = np.arange(-zL, zL + 1e-9, h); n, nz = len(g), len(gz)
    XX, YY = np.meshgrid(g, g, indexing='ij'); w = lambda p, q: np.angle(np.exp(1j * (q - p)))
    cell = np.zeros((n - 1, n - 1, nz - 1), bool); prev = None
    for k in range(nz):
        a = np.angle(state(XX, YY, np.full_like(XX, gz[k])))
        fxy = np.abs(w(a[:-1, :-1], a[1:, :-1]) + w(a[1:, :-1], a[1:, 1:]) + w(a[1:, 1:], a[:-1, 1:]) + w(a[:-1, 1:], a[:-1, :-1])) > math.pi
        if k < nz - 1: cell[:, :, k] |= fxy
        if k > 0: cell[:, :, k - 1] |= fxy
        if prev is not None:
            fxz = np.abs(w(prev[:-1, :], prev[1:, :]) + w(prev[1:, :], a[1:, :]) + w(a[1:, :], a[:-1, :]) + w(a[:-1, :], prev[:-1, :])) > math.pi
            fyz = np.abs(w(prev[:, :-1], prev[:, 1:]) + w(prev[:, 1:], a[:, 1:]) + w(a[:, 1:], a[:, :-1]) + w(a[:, :-1], prev[:, :-1])) > math.pi
            cell[:, :, k - 1] |= fxz[:, :-1] | fxz[:, 1:] | fyz[:-1, :] | fyz[1:, :]
        prev = a
    lab, ncomp = ndimage.label(cell, structure=np.ones((3, 3, 3)))
    idx = np.argwhere(lab > 0); centers = np.c_[g[idx[:, 0]] + h / 2, g[idx[:, 1]] + h / 2, gz[idx[:, 2]] + h / 2]; labs = lab[idx[:, 0], idx[:, 1], idx[:, 2]]
    P = np.vstack(curves); ii = np.clip(((P[:, :2] + L) / h).astype(int), 0, n - 2); kk = np.clip(((P[:, 2] + zL) / h).astype(int), 0, nz - 2)
    own = sorted(set(int(v) for v in np.unique(lab[ii[:, 0], ii[:, 1], kk]) if v > 0))
    tree = cKDTree(P); d_own = tree.query(centers[np.isin(labs, own)])[0] if own else np.array([np.nan])
    others = ~np.isin(labs, own)
    d_other = float(cKDTree(centers[others]).query(P)[0].min()) if others.any() else float('inf')
    census = []
    for c in range(1, ncomp + 1):
        sel = labs == c; C = centers[sel]
        census.append({'cells': int(sel.sum()), 'own': c in own, 'touches_box': bool((np.abs(C[:, :2]).max() > L - 1.5 * h) or (np.abs(C[:, 2]).max() > zL - 1.5 * h)),
                       'R_range': [float(np.hypot(C[:, 0], C[:, 1]).min()), float(np.hypot(C[:, 0], C[:, 1]).max())], 'z_range': [float(C[:, 2].min()), float(C[:, 2].max())]})
    return {'box': [L, L, zL], 'h': h, 'components': ncomp, 'traced_curves_lie_in_components': own,
            'max_dist_own_cells_to_traced_curve': float(d_own.max()), 'min_dist_traced_curve_to_other_components': d_other,
            'census': sorted(census, key=lambda d: -d['cells'])[:12]}

# ── the states ────────────────────────────────────────────────────────────────────────────────────────────────────
BERRY_TREFOIL = dict(a=-0.008644144572508686, b=0.021905464881382643, rstar=23.03016837326312)
BERRY_LINK = dict(a=-0.01560129657316942, b=1 / 19.335422091332187, rstar=14.475593688190804)   # b: coefficient of ψ_652 in ψ_632 + b ψ_652

def trefoil_terms(C=0.1, eps=400.0, k=BERRY_TREFOIL):   # Berry eqs. (6)–(8)
    return {(7, 3, 3): 1.0, (7, 5, 3): k['a'], (7, 4, 3): 1j * C, (7, 6, 3): 1j * C * k['b'], (7, 0, 0): eps}

def link_terms(C=0.1, eps=10.0, k=BERRY_LINK, printed=False):   # Berry eqs. (4), (5), (8); printed=True reads eq. (4) literally
    odd = {(6, 5, 2): 1j * C, (6, 3, 2): 1j * C * 0.0517186} if printed else {(6, 3, 2): 1j * C, (6, 5, 2): 1j * C * k['b']}
    return {(6, 2, 2): 1.0, (6, 4, 2): k['a'], **odd, (6, 0, 0): eps}

def unknot_state():   # (ψ_200 + i ψ_210)/√2 in the app's basis: zero set exactly {r = 2, z = 0}
    return State({(2, 0, 0): 1 / math.sqrt(2), (2, 1, 0): 1j / math.sqrt(2)})

# ── the generalised recipe (ours): an order-p loop in the m0 sector, the twist carried by a perturbation in the m1 sector ──
def equator_polys(n, m, ls, odd):
    """ψ_nlm on the equator (or ∂_z ψ there) without the common factor e^{-ρ/2}(1/R) e^{imφ} and without the app's norm: exact polynomials in ρ"""
    return [sp.expand(RHO ** l * sp.assoc_laguerre(n - l - 1, 2 * l + 1, RHO) * sp.diff(sp.legendre(l, X), X, abs(m) + (1 if odd else 0)).subs(X, 0)) for l in ls]

def loop_coeffs(n, m, p, le, lo):
    """every ρ* where Σ a_l u_l has a p-fold zero (Wronskian root) and Σ b_l v_l a (p-1)-fold one;
    a, b are APP-basis coefficients (the norms put back), normalised to a_0 = b_0 = 1"""
    u = equator_polys(n, m, le, False); v = equator_polys(n, m, lo, True)
    nu = [Mode(n, l, m).norm for l in le]; nv = [Mode(n, l, m).norm for l in lo]
    Wm = sp.Matrix([[sp.diff(f, RHO, j) for f in u] for j in range(p)]); W = sp.Poly(sp.expand(Wm.det()), RHO)
    res = []
    for r in W.nroots(n=40, maxsteps=500):
        if abs(sp.im(r)) > 1e-30 or sp.re(r) <= 1e-9: continue
        rs = sp.re(r)
        A = np.array(Wm.subs(RHO, rs).evalf(30).tolist(), dtype=float); a = np.linalg.svd(A)[2][-1] / np.array(nu); a = a / a[0]
        if p > 1:
            B = np.array(sp.Matrix([[sp.diff(f, RHO, j) for f in v] for j in range(p - 1)]).subs(RHO, rs).evalf(30).tolist(), dtype=float)
            b = np.linalg.svd(B)[2][-1] / np.array(nv); b = b / b[0]
        else: b = np.array([1.0])
        res.append({'rho_star': float(rs), 'r_star_bohr': float(rs) * n / 2, 'a': a.tolist(), 'b': b.tolist()})
    return res

def loop_state(n, m0, p, le, lo, root, C=1.0):
    return State({**{(n, l, m0): complex(x) for l, x in zip(le, root['a'])}, **{(n, l, m0): 1j * C * x for l, x in zip(lo, root['b'])}})

def local_K(state0, n, m0, rstar, p):
    """K± of the order-p loop of ψ0 = e^{i m0 φ}F: F ≈ K+ w^p + K- w̄^p on a small circle w = s e^{iγ}, w = (R - r*) + i z"""
    s = 1e-3 * rstar; g = np.linspace(0, 2 * math.pi, 64, endpoint=False)
    F = state0(rstar + s * np.cos(g), 0 * g, s * np.sin(g)) / s ** p
    return complex(np.mean(F * np.exp(-1j * p * g))), complex(np.mean(F * np.exp(1j * p * g)))

def circular_C(n, m0, p, le, lo, root):
    """the C that makes K- = 0 (a pure w^p loop, round cross-section): K± are affine in C"""
    Kp0, Km0 = local_K(loop_state(n, m0, p, le, lo, root, 0.0), n, m0, root['r_star_bohr'], p)
    Kp1, Km1 = local_K(loop_state(n, m0, p, le, lo, root, 1.0), n, m0, root['r_star_bohr'], p)
    return float((-Km0 / (Km1 - Km0)).real)

def knot_state(n, m0, p, le, lo, root, pert, delta, C=None):
    """ψ0 + ε ψ_pert with ε set so the predicted tube radius is delta·r* (from |K+| δ^p = ε |ψ_pert| on the loop)"""
    C = circular_C(n, m0, p, le, lo, root) if C is None else C
    s0 = loop_state(n, m0, p, le, lo, root, C); rs = root['r_star_bohr']
    Kp, Km = local_K(s0, n, m0, rs, p); g = abs(Mode(*pert)(np.array(rs), np.array(0.0), np.array(0.0)))
    eps = (abs(Kp) + abs(Km)) * (delta * rs) ** p / g
    return State({**s0.c, pert: s0.c.get(pert, 0) + eps}), {'C': C, 'eps': eps, 'K_plus': [Kp.real, Kp.imag], 'K_minus': [Km.real, Km.imag]}

def quick(st, rs, w, step):
    sd = seeds_halfplane(st, 0.1234, max(0.05, rs - w), rs + w, -w, w, 160, 160)
    comps = components(st, sd, step)
    print(' seeds', len(sd), 'components', [(len(C), closed, round(L, 2)) for C, closed, L in comps])
    if all(c for _, c, _ in comps) and comps:
        inv = invariants([C for C, _, _ in comps], seeds=(11, 12, 13))
        print(' ', [(d['crossings'], d['alexander'], d['self_writhe_per_component'], d['linking_numbers']) for d in inv])

def verify(state, rs, w, step, scan=None, phi0=0.1234, nseed=200):
    """the full check on the expanded superposition: seeds in a meridian half-plane window around the loop circle (R = rs, z = 0),
    tracing, components inside the torus of radius w, invariants, quality, Gauss linking, and (optionally) the global plaquette scan"""
    sd = seeds_halfplane(state, phi0, max(0.05, rs - w), rs + w, -w, w, nseed, nseed)
    comps = components(state, sd, step, rbox=rs + 3 * w); torus, other = [], []
    for C, closed, L in comps:
        d = np.hypot(np.hypot(C[:, 0], C[:, 1]) - rs, C[:, 2]).max()
        (torus if (closed and d < w) else other).append((C, closed, L))
    curves = [C for C, _, _ in torus]
    out = {'seed_halfplane_phi': phi0, 'seed_window': {'R': [max(0.05, rs - w), rs + w], 'z': [-w, w], 'grid': nseed}, 'seeds': len(sd),
           'step_bohr': step, 'components_in_torus': [], 'components_leaving_torus': len(other)}
    for C, closed, L in torus:
        R = np.hypot(C[:, 0], C[:, 1]); phi = np.unwrap(np.arctan2(C[:, 1], C[:, 0]))
        out['components_in_torus'].append({'points': len(C), 'closed': closed, 'length_bohr': L, 'R_range': [float(R.min()), float(R.max())],
                                           'z_range': [float(C[:, 2].min()), float(C[:, 2].max())],
                                           'turns_about_z_axis': float((phi[-1] - phi[0] + np.angle(np.exp(1j * (phi[0] - phi[-1])))) / (2 * math.pi)),
                                           'quality': curve_quality(state, C)})
    if curves:
        out['invariants'] = invariants(curves); out['braid'] = braid_word(curves)
        if len(curves) > 1: out['gauss_linking'] = {f'{i}-{j}': gauss_linking(curves[i], curves[j]) for i in range(len(curves)) for j in range(i + 1, len(curves))}
    if scan: out['scan'] = nodal_scan(state, *scan, curves=curves)
    return out, curves

def light(state, rs, delta, p):
    """a lighter check for scans: components in the torus, closed, near-axial crossings / Alexander / writhe / linking"""
    w = max(0.6, 2.5 * delta * rs) if delta else 0.3 * rs; step = max(0.004 * rs, 0.005)
    sd = seeds_halfplane(state, 0.1234, max(0.05, rs - w), rs + w, -w, w, 160, 160)
    comps = components(state, sd, step, rbox=rs + 3 * w); torus = [(C, c, L) for C, c, L in comps if c and np.hypot(np.hypot(C[:, 0], C[:, 1]) - rs, C[:, 2]).max() < w]
    res = {'seeds': len(sd), 'traced': len(comps), 'in_torus': len(torus), 'all_closed': all(c for _, c, _ in comps)}
    if torus:
        inv = invariants([C for C, _, _ in torus], seeds=(11,), axial=(21,))
        res.update({'crossings': [d['crossings'] for d in inv], 'alexander': [d['alexander'] for d in inv], 'per_component': inv[1]['alexander_per_component'],
                    'lengths': [round(L, 2) for _, _, L in torus], 'writhe': inv[0]['self_writhe_per_component'],
                    'linking': inv[0]['linking_numbers'], 'tube_R': [float(min(np.hypot(C[:, 0], C[:, 1]).min() for C, _, _ in torus)), float(max(np.hypot(C[:, 0], C[:, 1]).max() for C, _, _ in torus))],
                    'tube_z': float(max(np.abs(C[:, 2]).max() for C, _, _ in torus))})
    light.curves = [C for C, _, _ in torus]
    if torus: res['braid'] = braid_word(light.curves)
    return res

# the generalised recipe's entries: (name, p, q, n, m0, le, lo, perturbation (n, l1, m1))
RECIPES = [('Hopf link T(2,2)', 2, 2, 4, 0, (0, 2), (1, 3), (4, 2, 2)), ('trefoil T(2,3)', 2, 3, 4, 0, (0, 2), (1, 3), (4, 3, 3)),
           ('Solomon link T(2,4)', 2, 4, 5, 0, (0, 2), (1, 3), (5, 4, 4)), ('cinquefoil T(2,5)', 2, 5, 5, -1, (1, 3), (2, 4), (5, 4, 4)),
           ('T(2,6) link', 2, 6, 6, -1, (1, 3), (2, 4), (6, 5, 5)), ('7_1 = T(2,7)', 2, 7, 6, -2, (2, 4), (3, 5), (6, 5, 5)),
           ('T(2,8) link', 2, 8, 7, -2, (2, 4), (3, 5), (7, 6, 6)), ('9_1 = T(2,9)', 2, 9, 7, -3, (3, 5), (4, 6), (7, 6, 6)),
           ('8_19 = T(3,4)', 3, 4, 6, 0, (0, 2, 4), (1, 3, 5), (6, 4, 4)), ('10_124 = T(3,5)', 3, 5, 6, 0, (0, 2, 4), (1, 3, 5), (6, 5, 5)),
           ('T(3,7)', 3, 7, 7, -1, (1, 3, 5), (2, 4, 6), (7, 6, 6))]

def stage_explore():
    rs = BERRY_TREFOIL['rstar']; s0 = from_berry({k: v for k, v in trefoil_terms().items() if k != (7, 0, 0)})
    Kp, Km = local_K(s0, 7, 3, rs, 2); g = abs(Mode(7, 0, 0)(np.array(rs), np.array(0.0), np.array(0.0))) * 400 / (radial_norm(7, 0) * ylm_norm(0, 0))
    print('Berry fig 2: K+', Kp, 'K-', Km, '|K-/K+|', abs(Km / Kp), 'delta_Berry', math.sqrt(g / (abs(Kp) + abs(Km))) / rs)
    root = {'r_star_bohr': rs, 'rho_star': rs * 2 / 7, 'a': [1.0, None], 'b': [1.0, None]}
    for name, n, m0, le, lo, pert, root in [('n4 trefoil', 4, 0, (0, 2), (1, 3), (4, 3, 3), loop_coeffs(4, 0, 2, (0, 2), (1, 3))[0]),
                                            ('n4 hopf', 4, 0, (0, 2), (1, 3), (4, 2, 2), loop_coeffs(4, 0, 2, (0, 2), (1, 3))[0])]:
        print(name, 'C_circ', circular_C(n, m0, 2, le, lo, root))
        for delta in (0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5):
            st, info = knot_state(n, m0, 2, le, lo, root, pert, delta)
            print(' delta', delta, 'eps', round(float(info['eps']), 5), light(st, root['r_star_bohr'], delta, 2))

def stage_table():
    for name, p, q, n, m0, le, lo, pert in RECIPES:
        roots = loop_coeffs(n, m0, p, le, lo)
        print(name, 'n', n, 'roots', [round(r['r_star_bohr'], 4) for r in roots], 'expected Alexander', torus_alexander(p, q) if math.gcd(p, q) == 1 else 'link')
        for root in roots:
            g = abs(Mode(*pert)(np.array(root['r_star_bohr']), np.array(0.0), np.array(0.0)))
            for delta in (0.1, 0.05):
                st, info = knot_state(n, m0, p, le, lo, root, pert, delta)
                r = light(st, root['r_star_bohr'], delta, p); print('  r*', round(root['r_star_bohr'], 4), 'pert on loop', f'{g:.3e}', 'delta', delta, r)
                if r.get('alexander'): break

def stage_explore_old():
    for name, n, m0, le, lo, pert in [('trefoil n4', 4, 0, (0, 2), (1, 3), (4, 3, 3)), ('hopf n4', 4, 0, (0, 2), (1, 3), (4, 2, 2)),
                                      ('cinquefoil n5', 5, 1, (1, 3), (2, 4), (5, 4, -4))]:
        roots = loop_coeffs(n, m0, 2, le, lo); print(name, roots)
        for root in roots:
            for delta in (0.05, 0.1, 0.2):
                st, info = knot_state(n, m0, 2, le, lo, root, pert, delta); print(name, 'r*', round(root['r_star_bohr'], 4), 'delta', delta, info)
                quick(st, root['r_star_bohr'], max(1.0, 3 * delta * root['r_star_bohr']), 0.01 * root['r_star_bohr'])

# ── exact forms, time dependence, figures, the record ─────────────────────────────────────────────────────────────
def exact_loop(n, m, le, lo):
    """sympy: the Wronskian polynomial (factored), its positive real roots in radicals where sympy finds them, and a, b (app basis) exactly"""
    u = equator_polys(n, m, le, False); v = equator_polys(n, m, lo, True)
    norm = lambda l: (2 / sp.Integer(n)) ** sp.Rational(3, 2) * sp.sqrt(sp.factorial(n - l - 1) / (2 * n * sp.factorial(n + l))) * sp.sqrt((2 * l + 1) / (4 * sp.pi) * sp.factorial(l - abs(m)) / sp.factorial(l + abs(m)))
    sgn = lambda l: -1 if (m >= 0 and abs(m) % 2 == 1) else 1
    W = sp.factor(sp.cancel((u[0] * sp.diff(u[1], RHO) - sp.diff(u[0], RHO) * u[1]) / RHO ** (le[0] + le[1] - 1)))
    out = []
    for r in sp.solve(sp.numer(sp.together(W)), RHO):
        if not (r.is_real and r > 0): continue
        a = sp.nsimplify(sp.simplify(-(u[0] / u[1]).subs(RHO, r) * (sgn(le[0]) * norm(le[0])) / (sgn(le[1]) * norm(le[1]))))
        b = sp.simplify(-(v[0] / v[1]).subs(RHO, r) * (sgn(lo[0]) * norm(lo[0])) / (sgn(lo[1]) * norm(lo[1])))
        out.append({'rho_star': str(sp.simplify(r)), 'r_star_bohr': str(sp.simplify(n * r / 2)), 'a': str(a), 'b': str(sp.radsimp(b)), 'b_float': float(b), 'a_float': float(a), 'r_float': float(n * r / 2)})
    return {'wronskian_over_rho_power': str(W), 'roots': out}

def time_dependence(st7, eta, nphase=16):
    """ψ7 + η e^{iα} ψ(6s₀), α = (E7 − E6) t over one beat T = 2π/(E7 − E6): the knot at each phase"""
    T = 2 * math.pi / (-0.5 / 49 + 0.5 / 36); rows = []; ref = None
    for k in range(nphase):
        al = 2 * math.pi * k / nphase
        st = State({**st7.c, (6, 0, 0): eta * complex(math.cos(al), math.sin(al))})
        rs = 23.03; w = 8.0; sd = seeds_halfplane(st, 0.1234, rs - w, rs + w, -w, w, 160, 160)
        comps = components(st, sd, 0.05, rbox=rs + 3 * w); tor =[C for C, c, L in comps if c and np.hypot(np.hypot(C[:, 0], C[:, 1]) - rs, C[:, 2]).max() < w]
        row = {'phase_over_2pi': k / nphase, 't_au': T * k / nphase, 'components_in_torus': len(tor)}
        if tor:
            inv = invariants(tor, seeds=(), axial=(21,))[0]; K = tor[int(np.argmax([len(C) for C in tor]))]
            top = K[np.argmax(K[:, 2])]; row.update({'alexander': inv['alexander'], 'crossings': inv['crossings'], 'writhe': inv['self_writhe_per_component'],
                                                      'azimuth_of_highest_point_deg': math.degrees(math.atan2(top[1], top[0])), 'z_max': float(K[:, 2].max()),
                                                      'R_range': [float(np.hypot(K[:, 0], K[:, 1]).min()), float(np.hypot(K[:, 0], K[:, 1]).max())]})
        rows.append(row)
    return {'eta': eta, 'admixture': '6s₀', 'beat_period_au': T, 'beat_period_fs': T * 0.024188843265857, 'phases': rows}

def vortex_spheres(rr, half):
    """how many of VORTEX's sampled spheres (lab/vortex.js: r_k = rMin + (rMax − rMin)(k + ½)/nr, rMin = 0.05·half, rMax = 0.98·half) cut [rr0, rr1]"""
    out = {}
    for name, nr in (('coarse', 20), ('fine', 40), ('dense', 72)):
        r = 0.05 * half + (0.93 * half) * (np.arange(nr) + 0.5) / nr; out[name] = int(((r >= rr[0]) & (r <= rr[1])).sum())
    return out

def domain_for(n): return 2 * n * n + 3 * n + 2   # lab/hydrogen.js domainFor

def figures(rec, curves, states):
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    def tube3d(ax, Cs, cols, lw=2.6, lim=None, chain=None):
        for C, col in zip(Cs, cols):
            P = np.vstack([C, C[:1]]); ax.plot(P[:, 0], P[:, 1], P[:, 2], color=col, lw=lw)
        if chain is not None: ax.scatter(chain[:, 0], chain[:, 1], chain[:, 2], s=0.3, color='0.6', alpha=0.5)
        L = lim or 1.15 * max(np.abs(np.vstack(Cs)).max(), 1); ax.set_xlim(-L, L); ax.set_ylim(-L, L); ax.set_zlim(-L, L); ax.set_box_aspect((1, 1, 1))
        ax.set_xlabel('x (bohr)'); ax.set_ylabel('y (bohr)'); ax.set_zlabel('z (bohr)'); ax.view_init(28, -60)
    fig = plt.figure(figsize=(12, 5.6))
    for i, (key, title) in enumerate((('trefoil_n7_recommended', 'n = 7 trefoil (Berry loop, round cross-section, δ = 0.1)'), ('trefoil_n4', 'n = 4 trefoil (twist carried by 4f₃)'))):
        ax = fig.add_subplot(1, 2, i + 1, projection='3d'); tube3d(ax, curves[key], ['#b2182b']); ax.set_title(title, fontsize=10)
    fig.tight_layout(); fig.savefig(os.path.join(HERE, 'fig_trefoils_3d.png'), dpi=150); plt.close(fig)
    # the planar projection with its crossings
    C = resample(curves['trefoil_n7_recommended'][0], 400); Rm = tilt(21); X = crossings([C], Rm); P = C @ Rm.T
    fig, ax = plt.subplots(figsize=(6, 6)); Q = np.vstack([P, P[:1]]); ax.plot(Q[:, 0], Q[:, 1], color='#b2182b', lw=2)
    for k in range(0, len(P), 25): ax.annotate('', xy=P[(k + 1) % len(P), :2], xytext=P[k, :2], arrowprops=dict(arrowstyle='->', color='#b2182b', lw=1.2))
    for co, so, cu, su, sg, dz in X:
        k = int(su); f = su - k; pt = P[k, :2] * (1 - f) + P[(k + 1) % len(P), :2] * f
        ax.plot(*pt, 'o', ms=14, mfc='white', mec='k'); ax.text(*pt, '+' if sg > 0 else '−', ha='center', va='center', fontsize=12)
    ax.set_aspect('equal'); ax.set_xlabel("x' (bohr)"); ax.set_ylabel("y' (bohr)")
    ax.set_title(f"n = 7 trefoil, view 0.07 rad off +z: {len(X)} crossings, writhe {sum(x[4] for x in X):+d}", fontsize=10)
    fig.tight_layout(); fig.savefig(os.path.join(HERE, 'fig_trefoil_projection.png'), dpi=150); plt.close(fig)
    # the Hopf links
    fig = plt.figure(figsize=(12, 5.6))
    for i, (key, title) in enumerate((('hopf_n4', 'n = 4 Hopf link (twist carried by 4d₂)'), ('hopf_n6_berry', 'n = 6 Hopf link (Berry 2001, eq. 4 corrected)'))):
        ax = fig.add_subplot(1, 2, i + 1, projection='3d'); tube3d(ax, curves[key], ['#b2182b', '#2166ac']); ax.set_title(title, fontsize=10)
    fig.tight_layout(); fig.savefig(os.path.join(HERE, 'fig_hopf_3d.png'), dpi=150); plt.close(fig)
    # the radial profile: P(r) = r² Σ |c_l|² R_nl(r)² exactly (angular orthonormality within one n)
    fig, axs = plt.subplots(1, 2, figsize=(12, 4.2))
    for ax, key, n in ((axs[0], 'trefoil_n7_recommended', 7), (axs[1], 'trefoil_n4', 4)):
        r = np.linspace(1e-6, 2.4 * n * n, 2000); P = np.zeros_like(r)
        for (nn, l, m), c in states[key].c.items(): P += abs(c) ** 2 * (Mode(nn, l, 0)(0 * r, 0 * r, r) / ylm_norm(l, 0)) ** 2 * r * r   # R_nl on the +z axis
        ax.plot(r, P, color='k', lw=1.4, label='radial density P(r) = r² ∫|ψ|² dΩ')
        R0, R1 = rec['states'][key]['verification']['knot_r_range']; ax.axvspan(R0, R1, color='#b2182b', alpha=0.25, label='radii met by the knot')
        ax.axvline(rec['states'][key]['r_star_bohr'], color='#b2182b', lw=1, ls='--', label=f"loop radius r* = {rec['states'][key]['r_star_bohr']:.3f}")
        ax.axvline(domain_for(n), color='0.5', lw=1, ls=':', label=f'DOMAIN AUTO half-width {domain_for(n)}')
        ax.set_xlabel('r (bohr)'); ax.set_ylabel('P(r) (1/bohr)'); ax.set_title(key.replace('_', ' '), fontsize=10); ax.legend(fontsize=8)
    fig.tight_layout(); fig.savefig(os.path.join(HERE, 'fig_radial_profile.png'), dpi=150); plt.close(fig)
    # the table's knots
    keys = [k for k in curves if k.startswith('T(')]; fig = plt.figure(figsize=(3.2 * min(4, len(keys)), 3.4 * math.ceil(len(keys) / 4)))
    for i, k in enumerate(keys):
        ax = fig.add_subplot(math.ceil(len(keys) / 4), 4, i + 1, projection='3d'); tube3d(ax, curves[k], ['#b2182b', '#2166ac', '#1b7837'], lw=1.8)
        ax.set_title(k, fontsize=9); ax.set_xlabel(''); ax.set_ylabel(''); ax.set_zlabel(''); ax.tick_params(labelsize=6)
    fig.tight_layout(); fig.savefig(os.path.join(HERE, 'fig_table_knots.png'), dpi=130); plt.close(fig)

def radial_stats(st, r0, r1, rs):
    """P(r) = r² Σ|c|² R_nl(r)² (exact within one n): P(r*)/max P and the probability in the shell r0 ≤ r ≤ r1 the knot spans"""
    n = max(k[0] for k in st.c); r = np.linspace(1e-9, 6 * n * n, 60001); P = np.zeros_like(r)
    for (nn, l, m), c in st.c.items(): P += abs(c) ** 2 * (Mode(nn, l, 0)(0 * r, 0 * r, r) / ylm_norm(l, 0)) ** 2 * r * r
    tot = np.trapezoid(P, r); sel = (r >= r0) & (r <= r1)
    return {'norm_from_radial_integral': float(tot), 'P_at_rstar_over_max_P': float(np.interp(rs, r, P) / P.max()), 'r_of_max_P': float(r[np.argmax(P)]),
            'probability_in_knot_shell': float(np.trapezoid(P[sel], r[sel]) / tot)}

def stage_final():
    rec = {'meta': {'author': 'Claude (proving lab), for Josh', 'date': '2026-10-24', 'script': 'knots.py', 'python': sys.version.split()[0], 'numpy': np.__version__, 'sympy': sp.__version__},
           'convention': {}, 'berry_constants': {}, 'states': {}, 'table': [], 'time_dependence': [], 'exact': {}}
    curves, states = {}, {}
    rec['convention'] = {'crossing_sign_check': sign_convention_check(),
                         'stage_view': 'lab/field.js cameraBasis at the home pose: right = ŷ, up = ẑ, back = x̂, so right × up = back (a non-mirrored view); CAMERA FLIP (setParity) mirrors it'}
    rec['berry_constants'] = {'trefoil n=7 m=3 (ψ733 + a ψ753; ψ743 + b ψ763)': berry_loop(7, 3, (3, 5), (4, 6)),
                              'link n=6 m=2, eq. (4) as printed (ψ652 + b ψ632)': berry_loop(6, 2, (2, 4), (5, 3)),
                              'link n=6 m=2, corrected (ψ632 + b ψ652)': berry_loop(6, 2, (2, 4), (3, 5))}
    print('berry constants done', flush=True)

    def deliver(key, st, rs, w, step, scan, lead, construction, berry_terms=None):
        st = st.normalised(lead=lead); n = max(k[0] for k in st.c)
        ver, cs = verify(st, rs, w, step, scan=scan)
        P = np.vstack(cs) if cs else np.zeros((1, 3)); rr = np.linalg.norm(P, axis=1)
        ver['knot_r_range'] = [float(rr.min()), float(rr.max())]
        ver['radial'] = radial_stats(st, rr.min(), rr.max(), rs)
        ver['app_box'] = {'domain_auto_half_bohr': domain_for(n), 'voxel_at_128_bohr': 2 * domain_for(n) / 128, 'vortex_spheres_cutting_knot': vortex_spheres(ver['knot_r_range'], domain_for(n))}
        ver['oracle_lab_hydrogen_js'] = oracle_check(st, 3 * rs)
        if berry_terms: ver['berry_formula_vs_app_sum'] = berry_exact_check(berry_terms, State({k: v for k, v in from_berry(berry_terms).c.items()}), 3 * rs)
        rec['states'][key] = {'n': n, 'r_star_bohr': rs, 'construction': construction, 'coeffs_app': st.app_json(), 'table': st.table(), 'preset_modes': st.preset_modes(),
                              'sum_abs_c2': float(sum(abs(c) ** 2 for c in st.c.values())), 'verification': ver}
        curves[key] = cs; states[key] = st
        print(key, 'done', {k: ver.get(k) for k in ('seeds',)}, [c['length_bohr'] for c in ver['components_in_torus']], ver['invariants'][0]['alexander'] if cs else None, flush=True)

    bt = trefoil_terms()
    deliver('trefoil_n7_berry_fig2', from_berry(bt), BERRY_TREFOIL['rstar'], 6.0, 0.04, (48, 0.4), (7, 3, 3),
            {'source': 'Berry 2001 eqs. (6)-(8), Fig. 2: ψ733 + a ψ753 + iC(ψ743 + b ψ763) + ε ψ700 in his unnormalised basis (eq. 2)', 'a': BERRY_TREFOIL['a'], 'b': BERRY_TREFOIL['b'], 'C': 0.1, 'eps': 400.0}, berry_terms=bt)
    r7 = loop_coeffs(7, 3, 2, (3, 5), (4, 6))[0]; st, info = knot_state(7, 3, 2, (3, 5), (4, 6), r7, (7, 0, 0), 0.1)
    deliver('trefoil_n7_recommended', st, r7['r_star_bohr'], 8.0, 0.05, (48, 0.4), (7, 3, 3),
            {'source': "Berry's loop (same four states and r*), C set so K- = 0 (round cross-section), ε so the predicted tube radius is 0.1 r*", 'loop_app_basis': r7, **info})
    r4 = loop_coeffs(4, 0, 2, (0, 2), (1, 3))[0]
    st, info = knot_state(4, 0, 2, (0, 2), (1, 3), r4, (4, 3, 3), 0.15)
    deliver('trefoil_n4', st, r4["r_star_bohr"], 1.4, 0.01, (9, 0.06), (4, 0, 0), {'source': 'generalised recipe: m0 = 0 loop from 4s₀, 4d₀ | 4p₀, 4f₀; twist from 4f₃', 'loop_app_basis': r4, **info})
    st, info = knot_state(4, 0, 2, (0, 2), (1, 3), r4, (4, 2, 2), 0.15)
    deliver('hopf_n4', st, r4["r_star_bohr"], 1.4, 0.01, (9, 0.06), (4, 0, 0), {'source': 'generalised recipe: the same loop; twist from 4d₂', 'loop_app_basis': r4, **info})
    lt = link_terms()
    deliver('hopf_n6_berry', from_berry(lt), BERRY_LINK['rstar'], 4.0, 0.03, (40, 0.3), (6, 2, 2),
            {'source': 'Berry 2001 eqs. (4), (5), (8), Fig. 1, with eq. (4) read as ψ622 + a ψ642 + iC(ψ632 + b ψ652) (the printed b fits this order)', 'a': BERRY_LINK['a'], 'b': BERRY_LINK['b'], 'C': 0.1, 'eps': 10.0}, berry_terms=lt)
    deliver('unknot_n2', unknot_state(), 2.0, 0.8, 0.01, (6, 0.04), (2, 0, 0), {'source': '(ψ200 + i ψ210)/√2: Re ψ ∝ (2 − r) vanishes on r = 2, Im ψ ∝ z on z = 0'})
    pr = from_berry(link_terms(printed=True)).normalised(lead=(6, 2, 2))
    rec['states']['hopf_n6_berry_as_printed'] = {'construction': 'eq. (4) read literally: ψ622 + a ψ642 + iC(ψ652 + 0.0517186 ψ632) + 10 ψ600', 'light_check': light(pr, BERRY_LINK['rstar'], 0.15, 2)}
    mir = knot_state(7, 3, 2, (3, 5), (4, 6), r7, (7, 0, 0), 0.1, C=-circular_C(7, 3, 2, (3, 5), (4, 6), r7))[0].normalised(lead=(7, 3, 3))
    rec['states']['trefoil_n7_recommended_mirror_C_to_minus_C'] = {'light_check': light(mir, r7['r_star_bohr'], 0.1, 2)}
    print('controls done', flush=True)

    for name, p, q, n, m0, le, lo, pert in RECIPES:
        row = {'name': name, 'p': p, 'q': q, 'n_generalised': n, 'n_berry_recipe': min(q + 2 * p, p + 2 * q), 'm0': m0, 'loop_l_even': le, 'loop_l_odd': lo,
               'perturbation': label(*pert), 'expected_alexander': str(torus_alexander(p, q)) if math.gcd(p, q) == 1 else f'link of {math.gcd(p, q)} components'}
        for root in loop_coeffs(n, m0, p, le, lo):
            for delta in (0.1, 0.05):
                st, info = knot_state(n, m0, p, le, lo, root, pert, delta); st = st.normalised()
                chk = light(st, root['r_star_bohr'], delta, p)
                ok = chk.get('in_torus') == math.gcd(p, q) and (math.gcd(p, q) > 1 or all(a == row['expected_alexander'] for a in chk.get('alexander', [])))
                if ok: break
            if ok: break
        row.update({'verified': bool(ok), 'r_star_bohr': root['r_star_bohr'], 'delta': delta, 'eps': float(info['eps']), 'C': info['C'], 'check': chk, 'coeffs_app': st.app_json(),
                    'oracle_lab_hydrogen_js': oracle_check(st, 3 * root['r_star_bohr'], npts=300)})
        rec['table'].append(row); curves[f'T({p},{q}) n={n}'] = light.curves
        print(name, 'verified', ok, chk.get('alexander'), chk.get('linking'), flush=True)

    for eta in (0.02, 0.1, 0.3):
        rec['time_dependence'].append(time_dependence(states['trefoil_n7_recommended'], eta)); print('time dependence', eta, flush=True)
    rec['exact'] = {'n4_m0_loop': exact_loop(4, 0, (0, 2), (1, 3))}
    figures(rec, curves, states)
    with open(os.path.join(HERE, 'knots.json'), 'w') as f: json.dump(rec, f, indent=1, ensure_ascii=False, default=lambda o: o.tolist() if hasattr(o, 'tolist') else str(o))
    print('written', flush=True)

def selftest():
    """the invariant machinery on parametrised torus knots and links ((2 + cos qs) e^{ips}, sin qs): braid word, Alexander, linking"""
    s = np.linspace(0, 2 * math.pi, 900, endpoint=False); out = []
    for p, q in [(2, 3), (3, 4), (2, 5), (3, 5)]:
        C = np.c_[(2 + np.cos(q * s)) * np.cos(p * s), (2 + np.cos(q * s)) * np.sin(p * s), np.sin(q * s)]
        inv = invariants([C], seeds=(11,), axial=(21,))
        out.append({'curve': f'T({p},{q})', 'braid': braid_word([C]), 'alexander': [d['alexander'] for d in inv], 'expected': str(torus_alexander(p, q))})
    A = np.c_[np.cos(s), np.sin(s), 0 * s]; B = np.c_[1 + np.cos(s), 0 * s, np.sin(s)]
    out.append({'curve': 'Hopf pair', 'invariants': invariants([A, B], seeds=(11,), axial=())[0], 'gauss': gauss_linking(A, B)})
    return out

def stage_md():
    """print the markdown tables of KNOTS.md from knots.json"""
    rec = json.load(open(os.path.join(HERE, 'knots.json')))
    for key, s in rec['states'].items():
        if 'coeffs_app' not in s: print(key, json.dumps(s, ensure_ascii=False)[:600]); continue
        print(f"\n{key}: " + ' '.join(f"{t['label']} {t['re']:+.10f}{t['im']:+.10f}i" for t in s['table']))
        v = s['verification']; inv = v.get('invariants', [])
        print('  comps', [(c['closed'], round(c['length_bohr'], 3), [round(x, 3) for x in c['R_range']], [round(x, 3) for x in c['z_range']], c['turns_about_z_axis'],
                          f"{c['quality']['max_abs_psi_on_curve_over_nearby']:.1e}", round(c['quality']['min_sin_angle_gradRe_gradIm'], 3), set(c['quality']['phase_winding_about_oriented_tangent_at_12_points'])) for c in v['components_in_torus']])
        print('  crossings', [d['crossings'] for d in inv], 'alex', set(d['alexander'] for d in inv), 'per comp', inv[0]['alexander_per_component'] if inv else None,
              'writhe', [d['self_writhe_per_component'] for d in inv][:2], 'lk', [d['linking_numbers'] for d in inv][:2], 'gauss', v.get('gauss_linking'), 'braid', v.get('braid'))
        sc = v.get('scan', {}); print('  scan', {k: sc.get(k) for k in ('box', 'h', 'components', 'max_dist_own_cells_to_traced_curve', 'min_dist_traced_curve_to_other_components')})
        print('  r', [round(x, 3) for x in v['knot_r_range']], v['radial'], v['app_box'], v['oracle_lab_hydrogen_js'], v.get('berry_formula_vs_app_sum'))
        print('  construction', {k: (round(x, 8) if isinstance(x, float) else x) for k, x in s['construction'].items() if k != 'loop_app_basis'}, s['construction'].get('loop_app_basis'))
    print('\n| knot | $p$ | $q$ | $n_B$ | $n_G$ | loop ($m_0$; $l$ even / odd) | twist from | $r^*$ (bohr) | $\\delta$ | braid word | Alexander | verified |')
    for t in rec['table']:
        c = t['check']; b = c.get('braid', {})
        print(f"| {t['name']} | {t['p']} | {t['q']} | {t['n_berry_recipe']} | {t['n_generalised']} | {t['m0']}; {t['loop_l_even']} / {t['loop_l_odd']} | {t['perturbation']} | {t['r_star_bohr']:.4f} | {t['delta']} | {b.get('word', '—')} | {c.get('alexander')} lk {c.get('linking')} | {t['verified']} |")
    for td in rec['time_dependence']:
        print('\neta', td['eta'], 'T', td['beat_period_au'], td['beat_period_fs'])
        for r in td['phases']: print('  ', round(r['phase_over_2pi'], 4), r['components_in_torus'], r.get('alexander'), r.get('writhe'), round(r.get('azimuth_of_highest_point_deg', float('nan')), 2), round(r.get('z_max', float('nan')), 3), [round(x, 3) for x in r.get('R_range', [])])
    print('\nexact', json.dumps(rec['exact'], ensure_ascii=False, indent=1)); print('convention', rec['convention']); print('berry', json.dumps(rec['berry_constants'], indent=1))

STAGES = {'berry': stage_berry, 'explore': stage_explore, 'table': stage_table, 'final': stage_final, 'md': stage_md,
          'selftest': lambda: print(json.dumps(selftest(), indent=1, default=str))}
if __name__ == '__main__':
    for s in (sys.argv[1:] or list(STAGES)): STAGES[s]()
