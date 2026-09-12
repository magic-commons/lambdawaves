# gen2.py — ROUND 4 · OPUS, questions 13/14 continued: Sol's sign convention (lambda_j = -i omega_j), the h^3
# contamination of a two-point Richardson on a NON-symmetric Magnus-2 predictor-corrector, the B -> sB scan, the
# closed-form Delta^2 (Delta - omega)/6 law behind the C spread, and MMUT's parasitic branch.
import json, numpy as np
d = json.load(open('lin-h2o.json')); orc = json.load(open('../oracle-h2o.json'))
n=d['n']; nocc=d['nocc']; N2=n*n
h1=np.array(d['h']).reshape(n,n); eri=np.array(d['eri']).reshape(n,n,n,n)
Xl=np.array(d['X']).reshape(n,n); Wl=np.array(d['W']).reshape(n,n)
D0=np.array(d['D0']).reshape(n,n); Cao=np.array(d['C']).reshape(n,n); eps=np.array(d['eps'])
P0=Wl@D0@Wl
g2e=lambda D: np.einsum('kl,ijkl->ij',D,eri)-0.5*np.einsum('lk,ilkj->ij',D,eri)
F0t=Xl@(h1+g2e(D0))@Xl
HB=[]
for a in range(n):
    M=np.zeros((n,n),complex); M[a,a]=1; HB.append(M)
for a in range(n):
    for b in range(a+1,n):
        r=1/np.sqrt(2)
        R=np.zeros((n,n),complex); R[a,b]=r; R[b,a]=r; HB.append(R)
        I=np.zeros((n,n),complex); I[a,b]=1j*r; I[b,a]=-1j*r; HB.append(I)
HBf=np.array([M.reshape(-1) for M in HB])
opmat=lambda f: np.real(HBf.conj()@np.array([f(M).reshape(-1) for M in HB]).T)
A=opmat(lambda M: -1j*(F0t@M-M@F0t))
B=opmat(lambda M: (lambda Gt: -1j*(Gt@P0-P0@Gt))(Xl@g2e(Xl@M@Xl)@Xl))
Ct=Wl@Cao; cols=[]
for i in range(nocc):
    for a in range(nocc,n):
        ei=Ct[:,i:i+1]; ea=Ct[:,a:a+1]; r=1/np.sqrt(2)
        for M in (r*(ei@ea.conj().T+ea@ei.conj().T), 1j*r*(ei@ea.conj().T-ea@ei.conj().T)):
            cols.append(np.real(HBf.conj()@M.reshape(-1)))
Q,_=np.linalg.qr(np.array(cols).T)
AA=Q.T@A@Q; BB=Q.T@B@Q; LL=AA+BB
DM2  =(AA@BB@AA+AA@BB@BB+BB@AA@AA+BB@AA@BB)/12-(BB@BB@AA+BB@BB@BB)/6
DMM  =(AA@BB@AA+AA@BB@BB)/3-(BB@AA@AA+BB@AA@BB+BB@BB@AA+BB@BB@BB)/6
def pairs(Lm):
    lam,R=np.linalg.eig(Lm); Li=np.linalg.inv(R)
    ks=[k for k in range(len(lam)) if lam[k].imag<0]                     # Sol's branch: lambda = -i omega, omega>0
    ks.sort(key=lambda k:-lam[k].imag)
    out=[]
    for k in ks:
        r=R[:,k]; l=Li[k,:]; l=l/(l@r); out.append((float(-lam[k].imag), l, r))
    return out
PR=pairs(LL)
wo=np.array(orc['tdhf']['roots_au'])
print('Q14 · A and B from the converged integrals; L restricted to the ov subspace.  max |omega_L - omega_TDHF| = %.2e'
      % max(abs(PR[j][0]-wo[j]) for j in range(10)))
# --- omega(dt) from the ACTUAL integrator maps, fitted with h^2..h^5 ---------------------------------------------
maps={(m['s'],m['dt']):m for m in d['maps']}
DTS=sorted({m['dt'] for m in d['maps']})
def restrict(M): return Q.T@(np.array(M).T)@Q
def om_m2(s,dt):
    z=np.linalg.eigvals(restrict(maps[(s,dt)]['magnus2']))
    return np.sort(np.array([-np.angle(x)/dt for x in z if np.angle(x)<0])), np.abs(np.abs(z)-1).max()
def companion(s,dt):
    Ma=restrict(maps[(s,dt)]['mmutA']); Mb=restrict(maps[(s,dt)]['mmutB']); m=Ma.shape[0]
    return np.linalg.eigvals(np.block([[Ma,Mb],[np.eye(m),np.zeros((m,m))]]))
def om_mmut(s,dt,ws):
    z=companion(s,dt); c=np.array([-np.angle(x)/dt for x in z if np.angle(x)<0])
    return np.array([c[np.argmin(abs(c-w))] for w in ws])
def fitC(hs, dom):        # dom = omega(h) - omega_exact = C2 h^2 + C3 h^3 + C4 h^4 + C5 h^5
    V=np.array([[hh**p for p in (2,3,4,5)] for hh in hs]); return np.linalg.solve(V,dom)
ws=np.array([p[0] for p in PR])
print('\n  omega_RPA      C_j pred (M2)  C_j meas (M2)  rel     C_j pred(MMUT) C_j meas(MMUT) rel     C3(M2)     round2')
r2={0.483101392:0.0620, 20.157421877:60.358, 20.106993485:53.390}
rows=[]
oM2=[om_m2(1.0,dt)[0] for dt in DTS]; oMM=[om_mmut(1.0,dt,ws) for dt in DTS]
for j,wj in enumerate(ws):
    idx=[np.argmin(abs(o-wj)) for o in oM2]
    c2m=fitC(DTS,[oM2[i][idx[i]]-wj for i in range(len(DTS))])
    cmm=fitC(DTS,[oMM[i][j]-wj for i in range(len(DTS))])
    l,r=PR[j][1],PR[j][2]
    p2=-np.imag(l@DM2@r); pm=-np.imag(l@DMM@r)
    lab=('%.3f'%r2[round(wj,9)]) if round(wj,9) in r2 else '--'
    print('  %13.9f %+13.6f %+13.6f %7.4f %+13.6f %+13.6f %7.4f %+10.3f   %s'
          %(wj,p2,c2m[0],c2m[0]/p2,pm,cmm[0],cmm[0]/pm,c2m[1],lab))
    rows.append(dict(w=float(wj),pred=float(p2),meas_m2=float(c2m[0]),meas_mmut=float(cmm[0]),C3=float(c2m[1])))
print('  worst |meas/pred - 1| : Magnus-2 %.3f %%   MMUT %.3f %%'
      %(100*max(abs(r['meas_m2']/r['pred']-1) for r in rows),100*max(abs(r['meas_mmut']/r['pred']-1) for r in rows)))
# --- the closed form: C = Delta^2 (Delta - omega)/6 --------------------------------------------------------------
print('\nQ9 answer · the two quadratic-in-A words carry C.  a_j = i l_j^dag A r_j (the mode-projected orbital gap):')
print('  omega_RPA      a_j        a_j^2(a_j-w)/6   C_j(exact)   ratio    share of ABA+BA2   C_j/omega^2')
for j,wj in enumerate(ws):
    l,r=PR[j][1],PR[j][2]
    aj=float(np.real(1j*(l@AA@r)))
    two=-np.imag((l@(AA@BB@AA+BB@AA@AA)@r))/12
    cj=-np.imag(l@DM2@r); cf=aj*aj*(aj-wj)/6
    print('  %13.9f %10.6f %15.6f %12.6f %8.4f %12.1f %%   %10.5f'%(wj,aj,cf,cj,cf/cj,100*two/cj,cj/wj**2))
# --- B -> sB ----------------------------------------------------------------------------------------------------
print('\nQ14 · the B -> sB experiment (the two-electron response only; F0 fixed, so the roots move with s)')
print('   s     omega_1(s)      C_1 pred   C_1 meas   |  omega_10(s)    C_10 pred  C_10 meas  | worst rel dev')
for s in sorted({m['s'] for m in d['maps']}):
    Ls=AA+s*BB
    Ds=(AA@(s*BB)@AA+AA@(s*BB)@(s*BB)+(s*BB)@AA@AA+(s*BB)@AA@(s*BB))/12-((s*BB)@(s*BB)@AA+(s*BB)@(s*BB)@(s*BB))/6
    Ps=pairs(Ls); wss=np.array([p[0] for p in Ps])
    pred=np.array([-np.imag(p[1]@Ds@p[2]) for p in Ps])
    om=[om_m2(s,dt)[0] for dt in DTS]
    meas=[]
    for j,wj in enumerate(wss):
        idx=[np.argmin(abs(o-wj)) for o in om]
        meas.append(fitC(DTS,[om[i][idx[i]]-wj for i in range(len(DTS))])[0])
    meas=np.array(meas)
    dev=np.max(np.abs(meas-pred)/np.maximum(np.abs(pred),1e-12)) if s>0 else np.max(np.abs(meas))
    print('  %4.2f  %12.8f %+10.5f %+10.5f  | %12.7f %+10.4f %+10.4f  | %s'
          %(s,wss[0],pred[0],meas[0],wss[-1],pred[-1],meas[-1], ('%.4f'%dev) if s>0 else 'max|C_meas| = %.2e'%dev))
# --- MMUT parasitic branch ---------------------------------------------------------------------------------------
print('\nQ13 · the unrestarted-MMUT recurrence  dP_{n+1} = e^{2hA} dP_{n-1} + 2h phi1(2hA) B dP_n  (40 x 40 companion)')
print('   dt      max|zeta|-1     physical max|z|-1   parasitic max|z|-1   growth/step   e-folding steps   parasitic omega_eff')
for dt in DTS:
    z=companion(1.0,dt); om=np.array([-np.angle(x)/dt for x in z])
    isphys=np.array([min(abs(abs(o)-ws)) < 0.5 for o in om])
    gp=np.abs(z[~isphys]).max()-1; gph=np.abs(z[isphys]).max()-1
    ef=(np.log(1+gp) and 1/np.log(1+gp)) if gp>0 else np.inf
    print('  %-7g  %.4e      %.4e          %.4e        %+.3e   %s      %s'
          %(dt,np.abs(np.abs(z)-1).max(),gph,gp,gp,('%.3g'%ef) if gp>0 else 'stable',
            ' '.join('%.3f'%abs(o) for o in np.sort(np.abs(om[~isphys]))[-3:])))
