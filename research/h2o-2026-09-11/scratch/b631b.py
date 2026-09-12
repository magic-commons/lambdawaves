# b631b.py — ROUND 4 · OPUS, Q16: the engine's own 6-31+G* RPA roots and oscillator strengths from the same
# superoperator machinery as gen3.py, against the PySCF cart=True oracle; then the R_d mutation test.
import json, numpy as np
d=json.load(open('b631-engine.json')); orc=json.load(open('b631-pyscf.json'))
n=d['n']; nocc=5
S=np.array(d['S']).reshape(n,n); h1=np.array(d['h']).reshape(n,n); eri=np.array(d['eri']).reshape(n,n,n,n)
D0=np.array(d['D0']).reshape(n,n) if 'D0' in d else np.array(d['D']).reshape(n,n)
Cao=np.array(d['C']).reshape(n,n); Mq=[np.array(m).reshape(n,n) for m in d['M']]
w_,U=np.linalg.eigh(S); Xl=U@np.diag(w_**-0.5)@U.T; Wl=U@np.diag(w_**0.5)@U.T
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
def opsub(f): return Q.T@np.real(HBf.conj()@np.array([f(M).reshape(-1) for M in HB]).T)@Q
AA=opsub(lambda M: -1j*(F0t@M-M@F0t))
BB=opsub(lambda M: (lambda Gt:-1j*(Gt@P0-P0@Gt))(Xl@g2e(Xl@M@Xl)@Xl))
LL=AA+BB
lam,R=np.linalg.eig(LL); Li=np.linalg.inv(R)
ks=sorted([k for k in range(len(lam)) if lam[k].imag<0], key=lambda k:-lam[k].imag)
ws=np.array([-lam[k].imag for k in ks])
print('engine RHF E = %.12f   PySCF cart=True E = %.12f   delta = %.3e'%(d['E'],orc['E'],d['E']-orc['E']))
print('max |eps_engine - eps_pyscf| = %.3e'%np.abs(np.array(d['eps'])-np.array(orc['eps'])).max())
print('\nfirst five singlet RPA roots, engine superoperator vs PySCF TDHF:')
for i in range(5): print('  %d  %.9f   %.9f   delta %+.2e'%(i+1,ws[i],orc['roots'][i],ws[i]-orc['roots'][i]))
print('  max |delta| over the first five = %.2e ; max |Re lambda| = %.2e'%(np.abs(ws[:5]-np.array(orc['roots'][:5])).max(),np.abs(lam.real).max()))
def strengths(Mlist):
    z2=np.zeros((len(ks),3))
    for q in range(3):
        Mt=Xl@Mlist[q]@Xl
        v=Q.T@np.real(HBf.conj()@(-1j*(Mt@P0-P0@Mt)).reshape(-1))
        o=Q.T@np.real(HBf.conj()@(-Mt).reshape(-1))            # mu = -Tr(P M): functional o.x = -Tr(x M) uses Tr(H_p x)
        for j,k in enumerate(ks):
            c=(Li[k,:]@v)*(o@R[:,k]); z2[j,q]=np.imag(c)
    return z2
z2=strengths(Mq); f=(2.0/3.0)*ws[:,None]*z2
print('\noscillator strengths from the engine response (f = 2/3 w |mu|^2) vs the PySCF oracle:')
for i in range(5):
    print('  %d  w=%.9f  f_engine=%.6f  f_pyscf=%.6f  rel %+.2e   |mu|_eng=(%.6f,%.6f,%.6f)'
          %(i+1,ws[i],f[i].sum(),orc['f'][i],(f[i].sum()-orc['f'][i])/max(orc['f'][i],1e-12),*np.sqrt(np.abs(z2[i]))))
# --- the R_d mutation: use PySCF cart=True's UNRESCALED dipole matrix, i.e. M -> R M R on the d block ------------
labs=d['order']                                            # [lx,ly,lz] per AO in the engine order
Rd=np.ones(n)
for i,(lx,ly,lz) in enumerate(labs):
    if lx+ly+lz==2: Rd[i]=np.sqrt(4*np.pi/5) if max(lx,ly,lz)==2 else np.sqrt(4*np.pi/15)
print('\nR_d diagonal (engine order), non-unit entries:', {i:float(Rd[i]) for i in range(n) if abs(Rd[i]-1)>1e-12})
Mmut=[np.diag(Rd)@m@np.diag(Rd) for m in Mq]
z2m=strengths(Mmut); fm=(2.0/3.0)*ws[:,None]*z2m
print('mutation: the R_d congruence omitted on the DIPOLE class only — the one class that never enters the RHF energy')
print('  E, eps and all 90 RPA roots are bit-identical (the dipole tensor does not appear in any of them).')
for i in range(5):
    print('  %d  w=%.9f  f_correct=%.6f  f_mutated=%.6f  relative error %+.4f'
          %(i+1,ws[i],f[i].sum(),fm[i].sum(),(fm[i].sum()-f[i].sum())/max(abs(f[i].sum()),1e-14)))
print('  worst relative f error over the first five = %.4f'%max(abs((fm[i].sum()-f[i].sum())/max(abs(f[i].sum()),1e-14)) for i in range(5)))
# and the mutation applied to a class that DOES enter the energy
for name,mut in (('S',None),):
    pass
Sm=np.diag(Rd)@S@np.diag(Rd)
print('  by contrast, omitting R_d on the overlap class changes Tr(D S): %.12f -> %.12f (electron count broken)'
      %(np.trace(D0@S),np.trace(D0@Sm)))
