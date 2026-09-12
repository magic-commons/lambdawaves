# fit.py — ROUND 4 · OPUS, Q15: Sol's exact-kernel variable-projection fit.
#   I_M(x) = h sum_{n=1}^{M-1} q^n cos(x n h),  K_M(w,W) = I_M(w-W) - I_M(w+W),  q = exp(-gamma h)
# (a) the kernel identity is checked against the literal lab/absorb.js transform; (b) the fit is run on noiseless
# oracle traces and on the actual RT traces; (c) sigma_min(J), eps, an L_J surrogate, and the 4 eps/sigma bound.
import json, os, numpy as np
from scipy.optimize import nnls, least_squares
orc = json.load(open('../oracle-h2o.json'))
W = np.array(orc['tdhf']['roots_au']); MU = np.array(orc['tdhf']['transition_dipole_au'])
H = 0.02; T = 600.0; TAU = 50.0; GAM = 1.0/TAU; M = int(round(T/H))+1
KAP = 1e-3

def IM(x):
    q = np.exp(-GAM*H); z = q*np.exp(1j*H*np.atleast_1d(np.asarray(x, dtype=float)))
    return H*np.real(z*(1-z**(M-1))/(1-z))

def KM(w, Om):
    w = np.asarray(w, dtype=float)[:, None]; Om = np.asarray(Om, dtype=float)[None, :]
    return (IM((w-Om).ravel())-IM((w+Om).ravel())).reshape(w.shape[0], Om.shape[1])

def transform(tr, wg, kap):
    n = np.arange(len(tr)); dmp = (tr-tr[0])*np.exp(-n*H/TAU); t = n[1:]*H; out = np.empty(len(wg))
    for i in range(0, len(wg), 256):
        wc = wg[i:i+256]; out[i:i+256] = np.sin(np.outer(wc, t))@dmp[1:]
    return (H/kap)*out

def synth(amps, oms, kap):
    n = np.arange(M); return 2*kap*(np.sin(np.outer(n*H, oms))@amps)

def localmax(wg, y, near, rad=0.06):
    lo = max(1, int(np.searchsorted(wg, near-rad))); hi = min(len(wg)-1, int(np.searchsorted(wg, near+rad)))
    best = None
    for i in range(lo, hi):
        if y[i] > y[i-1] and y[i] >= y[i+1]:
            y0, y1, y2 = y[i-1], y[i], y[i+1]; den = y0-2*y1+y2
            wr = wg[i]+(0.5*(y0-y2)/den if den else 0)*(wg[1]-wg[0])
            if best is None or abs(wr-near) < abs(best-near): best = wr
    return best if best is not None else near

def varpro(wg, y, om0, label, truth):
    amps = lambda om: (lambda Kk: (nnls(Kk, y)[0], Kk))(KM(wg, om))
    res = lambda om: (lambda t: t[1]@t[0]-y)(amps(om))
    sol = least_squares(res, om0, method='trf', xtol=3e-16, ftol=3e-16, gtol=3e-16,
                        bounds=(np.maximum(om0-0.02, 1e-6), om0+0.02))
    om = np.sort(sol.x); a, Kk = amps(om); r = Kk@a-y; eps = float(np.linalg.norm(r))
    dw = 1e-7
    JO = np.column_stack([a[k]*(KM(wg, [om[k]+dw])[:, 0]-KM(wg, [om[k]-dw])[:, 0])/(2*dw) for k in range(len(om))])
    al = np.array([np.linalg.norm(JO[:, k])/max(np.linalg.norm(Kk[:, k]), 1e-300) for k in range(len(om))])
    J = np.hstack([JO, Kk*al]); sig = float(np.linalg.svd(J, compute_uv=False)[-1])
    rng = np.random.default_rng(3); LJ = 0.0
    for _ in range(5):
        dv = rng.standard_normal(len(om)); dv *= (1e-5/np.linalg.norm(dv))
        a2, K2 = amps(om+dv)
        JO2 = np.column_stack([a2[k]*(KM(wg, [om[k]+dv[k]+dw])[:, 0]-KM(wg, [om[k]+dv[k]-dw])[:, 0])/(2*dw) for k in range(len(om))])
        LJ = max(LJ, float(np.linalg.norm(np.hstack([JO2, K2*al])-J, 2)/np.linalg.norm(dv)))
    print('\n%s' % label)
    print('   sigma_min(J) = %.4e   eps = %.4e   L_J = %.4e   sigma^2/(8 L_J) = %.4e -> %s   4 eps/sigma = %.4e'
          % (sig, eps, LJ, sig*sig/(8*LJ), 'HOLDS' if eps <= sig*sig/(8*LJ) else 'FAILS', 4*eps/sig))
    for k in range(len(om)):
        print('   pole %d  raw max %.12f (%+.3e)   fitted %.12f   target %.12f   fit error %+.3e   A %.6e'
              % (k+1, om0[k], om0[k]-truth[k], om[k], truth[k], om[k]-truth[k], a[k]))
    return om, a, eps, sig, LJ

SKIP_A = os.environ.get('SKIP_A')
IY = [3, 4, 7, 9]; Ay = MU[IY, 1]**2; Wy = W[IY]
print('Q15 · noiseless y-polarised oracle trace, A_k = mu_y,k^2 =', ' '.join('%.8f' % x for x in Ay))
print('   A(0.807034854)/A(0.702205382) = %.4f  (round 2: 16.46)' % (Ay[1]/Ay[0]))
wg = np.arange(0.05, 21.0001, 1e-3)
tr = synth(Ay, Wy, KAP); yd = transform(tr, wg, KAP)
print('   kernel identity over [0.05,21], %d grid points: max |absorb.js transform - sum_k A_k K_M| = %.3e  (signal scale %.4f)'
      % (len(wg), np.abs(yd-KM(wg, Wy)@Ay).max(), np.abs(yd).max()))
om0 = np.array([localmax(wg, yd, w) for w in Wy])
print('   raw parabolic maxima: '+'  '.join('%.9f (%+.4e)' % (om0[k], om0[k]-Wy[k]) for k in range(4)))
(None if SKIP_A else varpro(wg, yd, om0, '   (a1) noiseless four-line y trace, T = 600, tau = 50 (T/tau = 12)', Wy))
IB = [i for i in range(10) if orc['tdhf']['oscillator_strength'][i] > 1e-8]
Ab = (MU[IB]**2).sum(axis=1); Wb = W[IB]
trb = synth(Ab, Wb, KAP); ydb = transform(trb, wg, KAP)
print('\n   nine-bright-line trace: kernel identity max |diff| = %.3e' % np.abs(ydb-KM(wg, Wb)@Ab).max())
om0b = np.array([localmax(wg, ydb, w) for w in Wb])
print('   raw maxima displacement: '+' '.join('%+.2e' % (om0b[k]-Wb[k]) for k in range(len(Wb))))
(None if SKIP_A else varpro(wg, ydb, om0b, '   (a2) noiseless nine-line oracle trace', Wb))
if not os.path.exists('rt-y.json'):
    print('\n   (b) rt-y.json missing'); raise SystemExit
rt = json.load(open('rt-y.json')); CJ = json.load(open('gen3-Cj.json'))
wall = np.array([c['w'] for c in CJ]); Cy = np.array([c['pred'] for c in CJ])
Cfor = lambda w: float(Cy[int(np.argmin(np.abs(wall-w)))])
for run in rt['runs']:
    trc = np.array(run['trace']); dt = run['dt']; kap = run['kappa']
    y = transform(trc, wg, kap)
    om0 = np.array([localmax(wg, y, w) for w in Wy])
    tgt = np.array([Wy[k]+Cfor(Wy[k])*dt*dt for k in range(4)])
    o, a, eps, sig, LJ = varpro(wg, y, om0, '   (b) RT-RHF trace, %s, Delta t = %g, kappa = %g, T = 600, tau = 50; target = omega_RPA + C_j Delta t^2'
                                % (run['integrator'], dt, kap), tgt)
    for k in range(4):
        print('       line %d  omega_RPA %.9f : raw max %+.3e , fitted %+.3e ; C_j dt^2 = %+.3e ; fitted - (RPA + C dt^2) = %+.3e'
              % (k+1, Wy[k], om0[k]-Wy[k], o[k]-Wy[k], tgt[k]-Wy[k], o[k]-tgt[k]))
