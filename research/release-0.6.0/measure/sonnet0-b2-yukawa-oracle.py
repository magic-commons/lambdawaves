# (b2) oracle for the RC road: Yukawa V=-exp(-lam r)/r, mu=1, by a fine uniform-grid tridiagonal eigensolve (scipy eigh_tridiagonal), vs the numerov E1s in sonnet0-b-rc-numerov.json
import json, numpy as np
from scipy.linalg import eigh_tridiagonal
def levels(lam, l, h=0.002, rmax=120.0, k=6):
    N=int(rmax/h); r=(np.arange(N)+1)*h
    V=-np.exp(-lam*r)/r + l*(l+1)/(2*r*r)
    d=1.0/h**2+V; e=-0.5/h**2*np.ones(N-1)
    w=eigh_tridiagonal(d,e,select='i',select_range=(0,k-1),eigvals_only=True)
    return w
res={}
b=json.load(open('sonnet0-b-rc-numerov.json'))
rows=[]
for y in b['yukawa']:
    lam=y['lam']; w=levels(lam,0,h=0.002,rmax=150)
    rows.append({'lam':lam,'numerov':y['E1s'],'fd':float(w[0]),'abs_diff':abs(y['E1s']-float(w[0]))})
res['yukawa_1s']=rows
# hydrogen check of FD itself
res['fd_hydrogen_1s_vs_-0.5']=float(eigh_tridiagonal(1/0.002**2-1/((np.arange(60000)+1)*0.002),-0.5/0.002**2*np.ones(59999),select='i',select_range=(0,0),eigvals_only=True)[0])+0.5
# number of bound (E<0) rows among the 36 (n_r 0..5, l 0..5) for several screening lengths
cnt={}
for lam in [0.02,0.05,0.1,0.2,0.3,0.5,1.0]:
    n=0
    for l in range(6):
        w=levels(lam,l,h=0.004,rmax=200,k=6); n+=int(np.sum(w<-1e-9))
    cnt[str(lam)]=n
res['bound_rows_of_36']=cnt
# critical screening for 1s by FD bisection
lo,hi=0.8,1.6
for _ in range(30):
    mid=(lo+hi)/2; w=levels(mid,0,h=0.004,rmax=400,k=1)
    if w[0]<-1e-9: lo=mid
    else: hi=mid
res['lam_c_fd']=(lo+hi)/2; res['lam_c_known']=1.19061
json.dump(res,open('sonnet0-b2-yukawa-oracle.json','w'),indent=1); print(json.dumps(res,indent=1))
