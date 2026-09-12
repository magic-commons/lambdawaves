# sumrules.py — amplitude-level certification of the RT-RHF kick against the RPA oracle:
#   (i)  post-kick energy  E(0+) - E_RHF  =  kappa^2 * sum_k omega_k z_k^2   (exact, no transform involved)
#   (ii) Im alpha peak heights against sum_k z_k^2 [L_g(w-w_k) - L_g(w+w_k)], L_g(x)=g/(x^2+g^2), g = 1/tau
#   (iii) the Lorentzian-overlap peak shift  delta_j = -(g^4/A_j) sum_{k!=j} A_k/(w_j-w_k)^3
import json, sys, numpy as np
lad = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'rt-ladder.json'))
orc = json.load(open('../oracle-h2o.json'))
w = np.array(orc['tdhf']['roots_au']); mu = np.array(orc['tdhf']['transition_dipole_au'])
E0 = orc['rhf']['energy']; kap = lad['kappa']; g = 1.0/lad['tau']
print('(i) post-kick energy against kappa^2 sum_k omega_k z_k^2   (kappa = %g)' % kap)
for q in range(3):
    z2 = mu[:, q]**2; pred = kap**2 * float(np.sum(w*z2))
    meas = [r['diag']['E0'] - E0 for r in lad['runs'] if r['q'] == q]
    print(f"   {'xyz'[q]}  predicted {pred:.6e}   measured {np.mean(meas):.6e}   rel {abs(np.mean(meas)/pred-1):.2e}   (spread over runs {np.ptp(meas):.1e})")
print('\n(ii) Im alpha peak heights, valence window, against the damped-sine model (gamma = %.4f)' % g)
def model(x, q):
    z2 = mu[:, q]**2
    return float(np.sum(z2*(g/(g**2+(x-w)**2) - g/(g**2+(x+w)**2))))
for r in lad['runs']:
    if (r['integrator'], r['dt']) != ('magnus2', 0.005): continue
    q = r['q']
    for p in r['spec'][0]['peaks']:
        if p['imAlpha'] < 1e-3: continue
        m = model(p['omega'], q)
        print(f"   {'xyz'[q]} peak {p['omega']:.6f}  Im alpha measured {p['imAlpha']:.5f}  model {m:.5f}  rel {abs(p['imAlpha']/m-1):.2e}")
print('\n(iii) Lorentzian-overlap shift, predicted vs measured (magnus2 dt=0.005, the finest Magnus run)')
for r in lad['runs']:
    if (r['integrator'], r['dt']) != ('magnus2', 0.005): continue
    q = r['q']; z2 = mu[:, q]**2
    for j in np.where(z2 > 1e-8)[0]:
        if w[j] > 2: continue
        A = z2[j]; sh = -(g**4/A)*float(np.sum([z2[k]/(w[j]-w[k])**3 for k in range(len(w)) if k != j and z2[k] > 1e-12]))
        pk = min(r['spec'][0]['peaks'], key=lambda p: abs(p['omega']-w[j]))
        print(f"   {'xyz'[q]} root {w[j]:.9f}: predicted shift {sh:+.3e}  measured {pk['omega']-w[j]:+.3e}  residual {pk['omega']-w[j]-sh:+.2e}")
