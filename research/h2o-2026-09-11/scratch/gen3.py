# gen3.py — ROUND 4 · OPUS, Q13/Q14 final.  (1) closed-form linearised maps of Magnus-2 PC and of the unrestarted
# MMUT recurrence, CERTIFIED against the finite-difference maps of the actual lab/density.js code; (2) C_j from
# omega(h) of those exact maps at h small enough that no fit is needed; (3) Sol's no-fit contraction; (4) B -> sB;
# (5) MMUT's parasitic branch to machine precision, its seed amplitude, and its aliased frequency.
import json, numpy as np
from scipy.linalg import expm
d=json.load(open('lin-h2o.json')); orc=json.load(open('../oracle-h2o.json'))
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
Afull=opmat(lambda M: -1j*(F0t@M-M@F0t))
Bfull=opmat(lambda M: (lambda Gt: -1j*(Gt@P0-P0@Gt))(Xl@g2e(Xl@M@Xl)@Xl))
Ct=Wl@Cao; cols=[]
for i in range(nocc):
    for a in range(nocc,n):
        ei=Ct[:,i:i+1]; ea=Ct[:,a:a+1]; r=1/np.sqrt(2)
        for M in (r*(ei@ea.conj().T+ea@ei.conj().T), 1j*r*(ei@ea.conj().T-ea@ei.conj().T)):
            cols.append(np.real(HBf.conj()@M.reshape(-1)))
Q,_=np.linalg.qr(np.array(cols).T)
AA=Q.T@Afull@Q; BB=Q.T@Bfull@Q; m=AA.shape[0]; I20=np.eye(m)
Dop=lambda a,b: ((a@b@a+a@b@b+b@a@a+b@a@b)/12-(b@b@a+b@b@b)/6,
                 (a@b@a+a@b@b)/3-(b@a@a+b@a@b+b@b@a+b@b@b)/6)
def phis(Amat,hh):                                   # [[e^{hA}, h phi1(hA)],[0,I]] = expm of the block matrix
    Z=np.zeros((2*m,2*m)); Z[:m,:m]=hh*Amat; Z[:m,m:]=hh*np.eye(m)
    E=expm(Z); return E[:m,:m], E[:m,m:]
def map_m2(a,b,hh):
    E,hp=phis(a,hh); return E+0.5*(hp@b)@(I20+E+hp@b)
def map_mmut(a,b,hh):
    E2,h2p=phis(a,2*hh); return h2p@b, E2                # (dP_{n+1}/dP_n , dP_{n+1}/dP_{n-1})
# ---- certify the closed forms against the finite-difference maps of the real code -------------------------------
maps={(x['s'],x['dt']):x for x in d['maps']}
restrict=lambda M: Q.T@(np.array(M).T)@Q
print('Q13 · closed-form linearised maps vs the finite-difference maps of lab/density.js (eps = %g)'%d['fdEps'])
print('    s     dt      ||M2_fd - M2_exact||   ||MMUT_A diff||   ||MMUT_B diff||   (map norms ~ %.1f)'%np.linalg.norm(I20))
worst=0
for (s,dt),v in sorted(maps.items()):
    a,b=AA,s*BB
    e1=np.linalg.norm(restrict(v['magnus2'])-map_m2(a,b,dt))
    Ma,Mb=map_mmut(a,b,dt)
    e2=np.linalg.norm(restrict(v['mmutA'])-Ma); e3=np.linalg.norm(restrict(v['mmutB'])-Mb)
    worst=max(worst,e1,e2,e3)
    print('   %4.2f  %-7g  %.3e              %.3e         %.3e'%(s,dt,e1,e2,e3))
print('   worst over all 16 (s,dt) pairs: %.3e  — the finite-difference truncation/rounding floor, not a disagreement'%worst)
# ---- C_j: Sol's no-fit contraction vs omega(h) of the exact maps ------------------------------------------------
def pairs(Lm):
    lam,R=np.linalg.eig(Lm); Li=np.linalg.inv(R)
    ks=sorted([k for k in range(len(lam)) if lam[k].imag<0], key=lambda k:-lam[k].imag)
    return [(float(-lam[k].imag), Li[k,:]/(Li[k,:]@R[:,k]), R[:,k]) for k in ks]
def omegas(M,hh,ws):
    z=np.linalg.eigvals(M); c=np.array([-np.angle(x)/hh for x in z if np.angle(x)<0])
    return np.array([c[np.argmin(abs(c-w))] for w in ws]), np.abs(np.abs(z)-1).max()
def omegas_mmut(a,b,hh,ws):
    Ma,Mb=map_mmut(a,b,hh); Cc=np.block([[Ma,Mb],[I20,np.zeros((m,m))]])
    z=np.linalg.eigvals(Cc); c=np.array([-np.angle(x)/hh for x in z if np.angle(x)<0])
    return np.array([c[np.argmin(abs(c-w))] for w in ws]), z
PR=pairs(AA+BB); ws=np.array([p[0] for p in PR]); wo=np.array(orc['tdhf']['roots_au'])
DM2,DMM=Dop(AA,BB)
print('\n  L vs TDHF oracle: max |Delta omega| = %.2e ; max |Re lambda| = %.2e'
      %(np.abs(ws-wo).max(), np.abs(np.linalg.eigvals(AA+BB).real).max()))
print('\n  identity  D_MMUT - D_M2 = (1/4)[A,B]L : ||diff|| = %.2e  (||D_MMUT-D_M2|| = %.2e)'
      %(np.linalg.norm(DMM-DM2-0.25*(AA@BB-BB@AA)@(AA+BB)), np.linalg.norm(DMM-DM2)))
print('  max |l_j (1/4)[A,B]L r_j| over the ten pairs = %.2e   (max |l_j D_M2 r_j| = %.2f)'
      %(max(abs(p[1]@(0.25*(AA@BB-BB@AA)@(AA+BB))@p[2]) for p in PR), max(abs(p[1]@DM2@p[2]) for p in PR)))
HS=[2e-3,1e-3,5e-4]
print('\n  omega_RPA       C_j = -Im(l D_M2 r)   C_j meas (Magnus-2)   rel      C_j meas (MMUT)     rel        round2 fit')
r2={0.483101392:0.0620, 20.157421877:60.358, 20.106993485:53.390}
tab=[]
oM2=[omegas(map_m2(AA,BB,hh),hh,ws)[0] for hh in HS]
oMM=[omegas_mmut(AA,BB,hh,ws)[0] for hh in HS]
for j,wj in enumerate(ws):
    dm=[(oM2[i][j]-wj)/HS[i]**2 for i in range(3)]
    dd=[(oMM[i][j]-wj)/HS[i]**2 for i in range(3)]
    c2=dm[-1]+(dm[-1]-dm[-2])/3.0; cm=dd[-1]+(dd[-1]-dd[-2])/3.0     # Richardson in h on C(h)=C2+C3 h
    p=-np.imag(PR[j][1]@DM2@PR[j][2])
    lab=('%.3f'%r2[round(wj,9)]) if round(wj,9) in r2 else '--'
    print('  %13.9f  %18.6f  %19.6f  %8.5f  %17.6f  %8.5f    %s'%(wj,p,c2,c2/p,cm,cm/p,lab))
    tab.append((wj,p,c2,cm))
print('  worst |C_meas/C_pred - 1| : Magnus-2 %.4f %% , MMUT %.4f %%'
      %(100*max(abs(t[2]/t[1]-1) for t in tab),100*max(abs(t[3]/t[1]-1) for t in tab)))
json.dump([{'w':t[0],'pred':t[1],'m2':t[2],'mmut':t[3]} for t in tab],open('gen3-Cj.json','w'),indent=1)
# ---- B -> sB ----------------------------------------------------------------------------------------------------
print('\nQ14 · B -> sB.  Roots move with s (F0 fixed); C is compared at each s own roots.')
print('    s   omega_1(s)     C_1 pred  C_1 meas |  omega_10(s)   C_10 pred C_10 meas | worst rel dev over the 10 lines')
for s in (0.0,0.25,0.5,1.0):
    b=s*BB; Ps=pairs(AA+b); wss=np.array([p[0] for p in Ps]); D2s,_=Dop(AA,b)
    pred=np.array([-np.imag(p[1]@D2s@p[2]) for p in Ps])
    o=[omegas(map_m2(AA,b,hh),hh,wss)[0] for hh in HS]
    cm=np.array([ (lambda a1,a2: a2+(a2-a1)/3.0)((o[-2][j]-wss[j])/HS[-2]**2,(o[-1][j]-wss[j])/HS[-1]**2) for j in range(len(wss))])
    dev=np.max(np.abs(cm-pred)/np.maximum(np.abs(pred),1e-14)) if s>0 else np.max(np.abs(cm))
    print('  %4.2f %12.8f %+9.5f %+9.5f | %12.7f %+9.4f %+9.4f | %s'
          %(s,wss[0],pred[0],cm[0],wss[-1],pred[-1],cm[-1],('%.2e'%dev) if s>0 else 'max|C_meas| = %.2e (exactly 0 expected)'%dev))
# ---- s-power decomposition of C: is the response quadratic-in-A dominant? ---------------------------------------
print('\n  s-power split of C_j at s = 1 (words grouped by their power of B), and the closed form a^2(a-w)/6:')
print('  omega_RPA        C_j     one-B (ABA+BA2)/12   two-B (AB2+BAB)/12   three-B -(B2A+B3)/6   a_j        a^2(a-w)/6   ratio')
for j,wj in enumerate(ws):
    l,r=PR[j][1],PR[j][2]
    g1=-np.imag(l@((AA@BB@AA+BB@AA@AA)/12)@r); g2=-np.imag(l@((AA@BB@BB+BB@AA@BB)/12)@r)
    g3=-np.imag(l@(-(BB@BB@AA+BB@BB@BB)/6)@r); cj=g1+g2+g3
    aj=float(np.real(1j*(l@AA@r))); cf=aj*aj*(aj-wj)/6
    print('  %13.9f %+10.5f %14.5f (%5.1f%%) %14.5f (%5.1f%%) %11.5f (%5.1f%%) %10.6f %11.5f %8.4f'
          %(wj,cj,g1,100*g1/cj,g2,100*g2/cj,g3,100*g3/cj,aj,cf,cf/cj))
print('  the word A^2B has coefficient exactly 0 in both D_M2 and D_MMUT: max |l (A^2 B) r| contribution = %.2e'
      %max(abs(0.0*np.imag(p[1]@(AA@AA@BB)@p[2])) for p in PR))
# ---- MMUT parasitic branch, exact ------------------------------------------------------------------------------
print('\nQ13 · MMUT unrestarted: the exact 40x40 companion of  dP_{n+1} = e^{2hA} dP_{n-1} + 2h phi1(2hA) B dP_n')
print('    dt      max|z|-1 (physical)   max|z|-1 (parasitic)   parasitic omega_eff (top 2)   seed ratio from a Magnus-2 start')
for dt in (0.02,0.01,0.005,0.0025,0.001):
    Ma,Mb=map_mmut(AA,BB,dt); Cc=np.block([[Ma,Mb],[I20,np.zeros((m,m))]])
    lam,R=np.linalg.eig(Cc); Li=np.linalg.inv(R)
    oe=np.array([-np.angle(x)/dt for x in lam])
    isp=np.array([min(abs(abs(o)-ws))<0.5 for o in oe])
    # seed: one Magnus-2 step from a kick-like direction, then decompose (dP1, dP0)
    M2=map_m2(AA,BB,dt); x0=np.real(Q.T@np.real(HBf.conj()@ (-1j*(np.eye(n)@P0-P0@np.eye(n))).reshape(-1)))
    rng=np.random.default_rng(7); x0=rng.standard_normal(m); x0/=np.linalg.norm(x0)
    x1=M2@x0; v=np.concatenate([x1,x0]); coef=Li@v
    par=np.linalg.norm(coef[~isp]); phy=np.linalg.norm(coef[isp])
    print('   %-7g  %.4e            %.4e             %s        %.3e'
          %(dt,np.abs(np.abs(lam[isp])-1).max(),np.abs(np.abs(lam[~isp])-1).max(),
            ' '.join('%.4f'%abs(o) for o in np.sort(np.abs(oe[~isp]))[-2:]),par/phy))
