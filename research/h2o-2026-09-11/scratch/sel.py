# sel.py — ROUND 4 OPUS: B-H2O-7's selection-rule gate, from the STO-3G superoperators (no transform, no RT).
import json, numpy as np
d=json.load(open('lin-h2o.json')); orc=json.load(open('../oracle-h2o.json'))
n=d['n']; nocc=d['nocc']
h1=np.array(d['h']).reshape(n,n); eri=np.array(d['eri']).reshape(n,n,n,n)
Xl=np.array(d['X']).reshape(n,n); Wl=np.array(d['W']).reshape(n,n)
D0=np.array(d['D0']).reshape(n,n); Cao=np.array(d['C']).reshape(n,n)
Mq=[np.array(m).reshape(n,n) for m in d['M']]
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
Ct=Wl@Cao; cols=[]
for i in range(nocc):
    for a in range(nocc,n):
        ei=Ct[:,i:i+1]; ea=Ct[:,a:a+1]; r=1/np.sqrt(2)
        for M in (r*(ei@ea.conj().T+ea@ei.conj().T), 1j*r*(ei@ea.conj().T-ea@ei.conj().T)):
            cols.append(np.real(HBf.conj()@M.reshape(-1)))
Q,_=np.linalg.qr(np.array(cols).T)
ops=lambda f: Q.T@np.real(HBf.conj()@np.array([f(M).reshape(-1) for M in HB]).T)@Q
AA=ops(lambda M:-1j*(F0t@M-M@F0t)); BB=ops(lambda M:(lambda G:-1j*(G@P0-P0@G))(Xl@g2e(Xl@M@Xl)@Xl))
lam,R=np.linalg.eig(AA+BB); Li=np.linalg.inv(R)
ks=sorted([k for k in range(len(lam)) if lam[k].imag<0],key=lambda k:-lam[k].imag)
ws=np.array([-lam[k].imag for k in ks])
z2=np.zeros((len(ks),3))
for q in range(3):
    Mt=Xl@Mq[q]@Xl
    v=Q.T@np.real(HBf.conj()@(-1j*(Mt@P0-P0@Mt)).reshape(-1)); o=Q.T@np.real(HBf.conj()@(-Mt).reshape(-1))
    for j,k in enumerate(ks): z2[j,q]=np.imag((Li[k,:]@v)*(o@R[:,k]))
f=(2/3)*ws[:,None]*z2
print('B-H2O-7 gate: the ten STO-3G RPA roots, per-polarisation |mu_q|^2 and f, from the superoperators alone')
print('   omega            |mu_x|^2      |mu_y|^2      |mu_z|^2      f(total)   f_oracle   rel')
for j in range(10):
    print('  %13.9f  %+.4e  %+.4e  %+.4e   %.6f   %.6f  %+.1e'
          %(ws[j],z2[j,0],z2[j,1],z2[j,2],f[j].sum(),orc['tdhf']['oscillator_strength'][j],
            (f[j].sum()-orc['tdhf']['oscillator_strength'][j])/max(orc['tdhf']['oscillator_strength'][j],1e-30)))
print('  x-polarised strength of the two O 1s lines: %.3e and %.3e  (gate asks < 1e-12: %s)'
      %(abs(z2[8,0]),abs(z2[9,0]),'PASS' if max(abs(z2[8,0]),abs(z2[9,0]))<1e-12 else 'FAIL'))
print('  dark root %.9f: max_q |mu_q|^2 = %.3e'%(ws[1],np.abs(z2[1]).max()))
print('  bright-line count per polarisation (|mu_q|^2 > 1e-12): x %d, y %d, z %d'
      %tuple((np.abs(z2[:,q])>1e-12).sum() for q in range(3)))
