# rich.py — ROUND 4 OPUS: how wrong is a two-point Richardson on peak positions, with the EXACT maps (no noise)?
import json, numpy as np
exec(open('gen3.py').read().split("# ---- certify")[0])
def pairs(Lm):
    lam,R=np.linalg.eig(Lm); Li=np.linalg.inv(R)
    ks=sorted([k for k in range(len(lam)) if lam[k].imag<0],key=lambda k:-lam[k].imag)
    return [(float(-lam[k].imag),Li[k,:]/(Li[k,:]@R[:,k]),R[:,k]) for k in ks]
PR=pairs(AA+BB); ws=np.array([p[0] for p in PR]); DM2,DMM=Dop(AA,BB)
def om(mapf,hh):
    z=np.linalg.eigvals(mapf(AA,BB,hh)); c=np.array([-np.angle(x)/hh for x in z if np.angle(x)<0])
    return np.array([c[np.argmin(abs(c-w))] for w in ws]), np.abs(np.abs(z)-1).max()
def om_mm(hh):
    Ma,Mb=map_mmut(AA,BB,hh); Cc=np.block([[Ma,Mb],[I20,np.zeros((m,m))]])
    z=np.linalg.eigvals(Cc); c=np.array([-np.angle(x)/hh for x in z if np.angle(x)<0])
    return np.array([c[np.argmin(abs(c-w))] for w in ws])
print('non-unitarity of the exact linearised Magnus-2 PC map, max | |zeta| - 1 |:')
for hh in (0.02,0.01,0.005,0.0025,0.00125):
    print('   dt=%-8g %.4e'%(hh,om(map_m2,hh)[1]))
print('\ntwo-point Richardson  C = [w(dt)-w(dt/2)] / (dt^2 - dt^2/4)  from the EXACT maps, vs the asymptotic C_j')
print('  omega_RPA        C_j exact   M2 (0.02,0.01)  (0.01,0.005)  (0.005,0.0025)  | MMUT (0.01,0.005)  (0.005,0.0025)')
o=lambda hh:om(map_m2,hh)[0]
a,b,c,d=o(0.02),o(0.01),o(0.005),o(0.0025)
p,q,r=om_mm(0.01),om_mm(0.005),om_mm(0.0025)
for j,wj in enumerate(ws):
    C=-np.imag(PR[j][1]@DM2@PR[j][2])
    r1=(a[j]-b[j])/(0.02**2-0.01**2); r2=(b[j]-c[j])/(0.01**2-0.005**2); r3=(c[j]-d[j])/(0.005**2-0.0025**2)
    m1=(p[j]-q[j])/(0.01**2-0.005**2); m2=(q[j]-r[j])/(0.005**2-0.0025**2)
    print('  %13.9f %+11.5f  %+9.5f(%+6.1f%%) %+9.5f(%+6.1f%%) %+9.5f(%+6.1f%%) | %+9.5f(%+6.1f%%) %+9.5f(%+6.1f%%)'
          %(wj,C,r1,100*(r1/C-1),r2,100*(r2/C-1),r3,100*(r3/C-1),m1,100*(m1/C-1),m2,100*(m2/C-1)))
print('\nis there an h^3 term in omega(h)?  (omega(h) - omega - C h^2)/h^3 for the two extreme lines:')
for j in (0,9):
    C=-np.imag(PR[j][1]@DM2@PR[j][2])
    for hh in (0.01,0.005,0.0025,0.00125):
        w=om(map_m2,hh)[0][j]
        print('   line %.9f  dt=%-8g  (w-w0-C h^2)/h^3 = %+.4e   (w-w0-C h^2)/h^4 = %+.4e'%(ws[j],hh,(w-ws[j]-C*hh*hh)/hh**3,(w-ws[j]-C*hh*hh)/hh**4))
