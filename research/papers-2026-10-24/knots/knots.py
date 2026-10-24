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

def trace(state, p0, step=0.02, maxlen=2000.0):
    """follow the oriented zero line (tangent ∇Re ψ × ∇Im ψ) from p0 until it closes; returns the polyline (closed, first point not repeated)"""
    p, ok = project(state, p0); t, _ = tangent(state, p); pts = [p]; L = 0.0; h = step; res = []
    while L < maxlen:
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

def components(state, seeds, step):
    """trace from each seed; seeds on an already traced curve are merged"""
    comps = []
    for p, s in seeds:
        if any(np.min(np.linalg.norm(C - p, axis=1)) < 2 * step for C, _, _ in comps): continue
        comps.append(trace(state, p, step))
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
    t = sp.Symbol('t'); N = len(arcs); M = sp.zeros(len(X), N)
    for r, (co, so, cu, su, sg, dz) in enumerate(X):
        o = arc_of(co, so); i_in = arc_of(cu, su - 1e-9); i_out = arc_of(cu, su + 1e-9)
        M[r, o] += 1 - t
        if sg > 0: M[r, i_in] += t; M[r, i_out] += -1
        else: M[r, i_in] += -1; M[r, i_out] += t
    if len(X) == 0: return sp.Integer(1) if len(curves) == 1 else sp.Integer(0)
    D = sp.factor(M[1:, 1:].det(method='berkowitz')) if N > 1 else sp.Integer(1)
    D = sp.Poly(sp.expand(D), t)
    if D.is_zero: return sp.Integer(0)
    c = D.all_coeffs()[::-1]; k = next(i for i, v in enumerate(c) if v != 0); c = c[k:]
    while c and c[-1] == 0: c.pop()
    if c[0] < 0: c = [-v for v in c]
    return sp.expand(sum(v * t ** i for i, v in enumerate(c)))

def invariants(curves, seeds=(11, 12, 13, 14, 15), npts=400):
    """for several random generic projections: crossing count, Alexander polynomial, writhe per component, linking numbers"""
    cs = [resample(C, npts) for C in curves]; out = []
    for sd in seeds:
        Rm = rotation(sd); X = crossings(cs, Rm)
        lk = {}
        for co, so, cu, su, sg, dz in X:
            if co != cu: key = f'{min(co, cu)}-{max(co, cu)}'; lk[key] = lk.get(key, 0) + sg / 2
        wr = [sum(sg for co, so, cu, su, sg, dz in X if co == cu == i) for i in range(len(cs))]
        al = alexander(cs, X); alc = [alexander([C], [x for x in X if x[0] == x[2] == i]) if len(cs) > 1 else None for i, C in enumerate(cs)]
        out.append({'projection_seed': sd, 'crossings': len(X), 'min_height_gap_at_crossings_bohr': float(min([x[5] for x in X], default=float('nan'))),
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

# ── the states ────────────────────────────────────────────────────────────────────────────────────────────────────
BERRY_TREFOIL = dict(a=-0.008644144572508686, b=0.021905464881382643, rstar=23.03016837326312)
BERRY_LINK = dict(a=-0.01560129657316942, b=1 / 19.335422091332187, rstar=14.475593688190804)   # b: coefficient of ψ_652 in ψ_632 + b ψ_652

def trefoil_terms(C=0.1, eps=400.0, k=BERRY_TREFOIL):   # Berry eqs. (6)–(8)
    return {(7, 3, 3): 1.0, (7, 5, 3): k['a'], (7, 4, 3): 1j * C, (7, 6, 3): 1j * C * k['b'], (7, 0, 0): eps}

def link_terms(C=0.1, eps=10.0, k=BERRY_LINK, printed=False):   # Berry eqs. (4), (5), (8); printed=True reads eq. (4) literally
    odd = {(6, 5, 2): 1j * C, (6, 3, 2): 1j * C * 0.0517186} if printed else {(6, 3, 2): 1j * C, (6, 5, 2): 1j * C * k['b']}
    return {(6, 2, 2): 1.0, (6, 4, 2): k['a'], **odd, (6, 0, 0): eps}

def unknot_terms():   # ψ_200 + i ψ_210 (app-normalised): zero set {r = 2, z = 0}
    return None

def stage_explore():
    st = from_berry(trefoil_terms()).normalised(lead=(7, 3, 3))
    print(st.table()); print(oracle_check(st, 60))
    sd = seeds_halfplane(st, 0.1234, 17, 29, -6, 6)
    print('seeds', [(p.round(4).tolist(), s) for p, s in sd])
    comps = components(st, sd, 0.02)
    for C, closed, L in comps: print('comp', len(C), closed, L)
    print(invariants([C for C, _, _ in comps]))

STAGES = {'berry': stage_berry, 'explore': stage_explore}
if __name__ == '__main__':
    for s in (sys.argv[1:] or list(STAGES)): STAGES[s]()
