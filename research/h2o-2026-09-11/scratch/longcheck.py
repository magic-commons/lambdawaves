# longcheck.py — the T=1500 run tests Lemma 4's gamma^4 law: tau 50 -> 125 must divide the overlap bias by 39.06.
import json, numpy as np
L = json.load(open('rt-long.json')); S = json.load(open('rt-ladder.json')); orc = json.load(open('../oracle-h2o.json'))
w = np.array(orc['tdhf']['roots_au']); mu = np.array(orc['tdhf']['transition_dipole_au'])
print('long run: T = %g  tau = %g  gamma = %.5f   (ladder: T = %g tau = %g gamma = %.5f)' % (L['T'],L['tau'],1/L['tau'],S['T'],S['tau'],1/S['tau']))
def peaks(run, q, win):
    return next(r for r in run['runs'] if r['q']==q and r['integrator']=='magnus2' and r['dt']==0.01)['spec'][0 if win=='valence' else 1]['peaks']
print('\n  pol root            Delta(tau=50)   Delta(tau=125)  ratio   Lemma-4 predicted(125)  residual')
for q in range(3):
    z2 = mu[:,q]**2
    for j in np.where(z2>1e-8)[0]:
        win = 'valence' if w[j]<2 else 'core'
        a = min(peaks(S,q,win), key=lambda p: abs(p['omega']-w[j]))['omega']-w[j]
        b = min(peaks(L,q,win), key=lambda p: abs(p['omega']-w[j]))['omega']-w[j]
        g = 1/L['tau']; A = z2[j]
        pred = -(g**4/A)*float(np.sum([z2[k]/(w[j]-w[k])**3 for k in range(len(w)) if k!=j and z2[k]>1e-12]))
        print(f"  {'xyz'[q]}  {w[j]:13.9f}  {a:+.4e}  {b:+.4e}  {a/b if b else float('nan'):7.2f}  {pred:+.4e}  {b-pred:+.2e}")
print('\n  invariants of the long run')
for r in L['runs']:
    d = r['diag']
    print(f"  {'xyz'[r['q']]}  Tr P = {d['electrons1']:.12f}  idem = {d['idem1']:.2e}  drift = {d['E1']-d['E0']:+.2e}  {r['wall']:.0f}s  ({int(L['T']/r['dt'])} steps)")
print('\n  spurious Im alpha in the x core window (no RPA-bright root there):',
      '%.2e' % max([p['imAlpha'] for p in peaks(L,0,'core')] or [0]))

# the complete two-term model: omega_peak = omega_RPA + delta_window(gamma) + C dt^2
C = {}
def getpk(run, fam, dt, q, win):
    return next(r for r in run['runs'] if r['q']==q and r['integrator']==fam and r['dt']==dt)['spec'][0 if win=='valence' else 1]['peaks']
for q in range(3):
    z2 = mu[:,q]**2
    for j in np.where(z2>1e-8)[0]:
        win = 'valence' if w[j]<2 else 'core'
        om = [min(getpk(S,'magnus2',dt,q,win), key=lambda p: abs(p['omega']-w[j]))['omega'] for dt in (0.01,0.005)]
        C[j] = (om[0]-om[1])/(0.01**2-0.005**2)
print('\n  THE MODEL, tested on the independent T=1500 / dt=0.01 run')
print('  pol root            measured Delta   delta_window   C dt^2      model sum    residual   rel')
for q in range(3):
    z2 = mu[:,q]**2
    for j in np.where(z2>1e-8)[0]:
        win = 'valence' if w[j]<2 else 'core'
        meas = min(getpk(L,'magnus2',0.01,q,win), key=lambda p: abs(p['omega']-w[j]))['omega']-w[j]
        g = 1/L['tau']; A = z2[j]
        dw = -(g**4/A)*float(np.sum([z2[k]/(w[j]-w[k])**3 for k in range(len(w)) if k!=j and z2[k]>1e-12]))
        cd = C[j]*0.01**2; tot = dw+cd
        print(f"  {'xyz'[q]}  {w[j]:13.9f}  {meas:+.4e}   {dw:+.3e}   {cd:+.3e}  {tot:+.4e}  {meas-tot:+.2e}  {abs(meas/tot-1)*100:5.1f}%")
