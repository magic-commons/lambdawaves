# richardson.py — the constant transform bias cancels in successive differences of the peak positions:
# omega_peak(dt) = omega_RPA + delta_window + C dt^2 + O(dt^4), so |w(dt)-w(dt/2)| must fall by 4.
import json, numpy as np
lad = json.load(open('rt-ladder.json')); orc = json.load(open('../oracle-h2o.json'))
w = np.array(orc['tdhf']['roots_au']); mu = np.array(orc['tdhf']['transition_dipole_au'])
get = lambda fam, dt, q, win: next(r for r in lad['runs'] if r['integrator'] == fam and r['dt'] == dt and r['q'] == q)['spec'][0 if win == 'valence' else 1]['peaks']
print('  family   pol root            w(dt1)-w(dt2)   w(dt2)-w(dt3)   ratio   C (dt^2 coefficient)')
for fam, dts in (('magnus2', [0.02, 0.01, 0.005]), ('mmut', [0.01, 0.005, 0.0025])):
    for q in range(3):
        z2 = mu[:, q]**2
        for j in np.where(z2 > 1e-8)[0]:
            win = 'valence' if w[j] < 2 else 'core'
            om = [min(get(fam, dt, q, win), key=lambda p: abs(p['omega']-w[j]))['omega'] for dt in dts]
            d1, d2 = om[0]-om[1], om[1]-om[2]
            C = d2/(dts[1]**2 - dts[2]**2)
            print(f'  {fam:8s} {"xyz"[q]}  {w[j]:13.9f}  {d1:+.4e}  {d2:+.4e}  {d1/d2:6.3f}   {C:+.4f}')
