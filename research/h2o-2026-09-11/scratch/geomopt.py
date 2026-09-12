# geomopt.py — ROUND 4 · OPUS, Q17: the RHF/STO-3G stationary geometry of H2O on the pinned BSE decimals.
# Route 1: 2-D Newton on E(r, theta) with central differences.  Route 2 (independent): full 9-coordinate
# quasi-Newton on PySCF's ANALYTIC nuclear gradient, no finite differences and no C2v parameterisation.
import numpy as np, json
from pyscf import scf
from scipy.optimize import minimize
from pinned import mol_from
ANG = 1/0.52917721092
def geom(r, th):                                    # r in bohr, th in radians; O at origin, C2v about z
    s, c = np.sin(th/2), np.cos(th/2)
    return [{'Z':8,'c':[0.,0.,0.]},{'Z':1,'c':[0., r*s, r*c]},{'Z':1,'c':[0.,-r*s, r*c]}]
def E(r, th):
    mf = scf.RHF(mol_from(geom(r,th))); mf.conv_tol=1e-13; mf.conv_tol_grad=1e-10; mf.max_cycle=200; mf.run()
    if not mf.converged:
        mf = scf.RHF(mol_from(geom(r,th))); mf.conv_tol=1e-12; mf.max_cycle=500; mf.diis_space=12; mf.run()
    assert mf.converged, 'SCF failed at r=%r th=%r'%(r,th)
    return float(mf.e_tot)
# ledger geometry as (r, theta)
LO = np.array([0.,0.,0.1173])*ANG; LH = np.array([0.,0.7572,-0.4692])*ANG
r0 = np.linalg.norm(LH-LO); th0 = 2*np.arcsin(np.linalg.norm(LH[1])/r0)
Eledger = E(r0, th0)
print('ledger geometry: r_OH = %.9f bohr = %.9f A   angle = %.7f deg   E = %.12f'%(r0, r0/ANG, np.rad2deg(th0), Eledger))
x = np.array([r0, th0]); hs = np.array([2e-3, 2e-3])
for it in range(8):
    g = np.zeros(2); H = np.zeros((2,2))
    e0 = E(*x)
    for i in range(2):
        xp = x.copy(); xp[i]+=hs[i]; xm = x.copy(); xm[i]-=hs[i]
        ep, em = E(*xp), E(*xm)
        g[i] = (ep-em)/(2*hs[i]); H[i,i] = (ep-2*e0+em)/hs[i]**2
    xa = x.copy(); xa[0]+=hs[0]; xa[1]+=hs[1]
    xb = x.copy(); xb[0]+=hs[0]; xb[1]-=hs[1]
    xc = x.copy(); xc[0]-=hs[0]; xc[1]+=hs[1]
    xd = x.copy(); xd[0]-=hs[0]; xd[1]-=hs[1]
    H[0,1] = H[1,0] = (E(*xa)-E(*xb)-E(*xc)+E(*xd))/(4*hs[0]*hs[1])
    step = np.linalg.solve(H, -g); x = x + step
    print('  Newton %d: E=%.12f  |g|=(%.2e,%.2e)  step=(%.3e,%.3e)  r=%.9f bohr  th=%.7f deg'
          %(it, e0, g[0], g[1], step[0], step[1], x[0], np.rad2deg(x[1])))
    if max(abs(step[0]), abs(step[1])) < 1e-10: break
rmin, thmin = x; Emin = E(rmin, thmin)
print('\nroute 1 (2-D Newton on E): r_OH = %.9f bohr = %.9f A   angle = %.7f deg   E = %.12f'
      %(rmin, rmin/ANG, np.rad2deg(thmin), Emin))
# --- route 2: 9-coordinate quasi-Newton on the analytic gradient -------------------------------------------------
def ef(v):
    at = [{'Z':8,'c':list(v[0:3])},{'Z':1,'c':list(v[3:6])},{'Z':1,'c':list(v[6:9])}]
    mol = mol_from(at); mf = scf.RHF(mol); mf.conv_tol=1e-13; mf.conv_tol_grad=1e-10; mf.max_cycle=200; mf.run()
    g = mf.nuc_grad_method().kernel()
    return float(mf.e_tot), np.array(g).reshape(-1)
v0 = np.concatenate([a['c'] for a in geom(r0, th0)])
res = minimize(ef, v0, jac=True, method='L-BFGS-B', options=dict(ftol=1e-16, gtol=1e-11, maxiter=500))
v = res.x; e2, g2 = ef(v)
at = v.reshape(3,3)
r1 = np.linalg.norm(at[1]-at[0]); r2 = np.linalg.norm(at[2]-at[0])
cosang = np.dot(at[1]-at[0], at[2]-at[0])/(r1*r2)
print('route 2 (9-coord L-BFGS on analytic forces): E = %.12f   max |F_cart| = %.3e hartree/bohr'
      %(e2, np.abs(g2).max()))
print('   r_OH = %.9f, %.9f bohr = %.9f, %.9f A   angle = %.7f deg'
      %(r1, r2, r1/ANG, r2/ANG, np.rad2deg(np.arccos(cosang))))
print('   route1 - route2 energy difference = %.3e hartree ; r difference = %.3e bohr ; angle difference = %.3e deg'
      %(Emin-e2, rmin-r1, np.rad2deg(thmin)-np.rad2deg(np.arccos(cosang))))
# analytic force at the route-1 minimum
_, gmin = ef(np.concatenate([a['c'] for a in geom(rmin, thmin)]))
print('   analytic max |F_cart| at the route-1 minimum = %.3e hartree/bohr'%np.abs(gmin).max())
_, gled = ef(np.concatenate([a['c'] for a in geom(r0, th0)]))
print('   analytic max |F_cart| at the LEDGER geometry  = %.3e hartree/bohr'%np.abs(gled).max())
# --- symmetric-stretch curvature at the minimum, and the quench energy -----------------------------------------
for d in (0.02, 0.01, 0.005):
    ep, em, e0 = E(rmin+d, thmin), E(rmin-d, thmin), Emin
    k = (ep-2*e0+em)/d**2
    print('   symmetric-stretch curvature  d2E/dR_sym^2 at the minimum, step %.3f bohr: %.9f hartree/bohr^2  (dE/dR = %+.3e)'
          %(d, k, (ep-em)/(2*d)))
# curvature at the ledger geometry, for comparison with round 2's gradient there
for d in (0.05*ANG,):
    ep, em = E(r0+d, th0), E(r0-d, th0)
    print('   at the LEDGER geometry, step %.6f bohr: dE/dR_sym = %+.9f hartree/bohr, d2E/dR_sym^2 = %.9f'
          %(d, (ep-em)/(2*d), (ep-2*Eledger+em)/d**2))
print('\n   quench: E(ledger) - E(min) = %.12f - %.12f = %+.9f hartree = %+.4f kcal/mol = %+.5f eV'
      %(Eledger, Emin, Eledger-Emin, (Eledger-Emin)*627.5094740631, (Eledger-Emin)*27.211386245988))
json.dump(dict(r_min_bohr=float(rmin), r_min_ang=float(rmin/ANG), angle_deg=float(np.rad2deg(thmin)),
               E_min=float(Emin), E_ledger=float(Eledger), r_ledger_bohr=float(r0), angle_ledger=float(np.rad2deg(th0)),
               E_route2=float(e2), maxF_route2=float(np.abs(g2).max())), open('geomopt.json','w'), indent=1)

# --- the symmetric-stretch gradient at the ledger geometry: wide secant vs the true derivative -------------------
print()
for dd in (0.05*ANG, 0.02*ANG, 0.01*ANG, 0.002, 0.001):
    ep, em = E(r0+dd, th0), E(r0-dd, th0)
    print('   ledger dE/dR_sym by central difference, step %.8f bohr: %+.9f  (curvature %+.9f)'
          %(dd, (ep-em)/(2*dd), (ep-2*Eledger+em)/dd**2))
_, gl = ef(np.concatenate([a['c'] for a in geom(r0, th0)]))
gl = gl.reshape(3,3); u = []
for k in (1,2):
    v = np.array(geom(r0,th0)[k]['c']) - np.array(geom(r0,th0)[0]['c']); u.append(v/np.linalg.norm(v))
dEdR = float(gl[1]@u[0] + gl[2]@u[1])      # both H moved outward by 1 bohr along their own bond, O fixed
print('   ledger dE/dR_sym from the ANALYTIC gradient (both H out along their bonds, O held): %+.9f hartree/bohr'%dEdR)
