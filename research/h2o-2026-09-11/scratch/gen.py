# gen.py — ROUND 4 · OPUS, questions 13 and 14.
# Builds the RPA superoperators A, B in the SAME orthonormal Hermitian basis of the Löwdin frame that lin.mjs used,
# restricts to the L-invariant occupied-virtual subspace, and (1) checks L's spectrum against the PySCF TDHF oracle,
# (2) verifies Sol's D_M2 and D_MMUT against the modified generator of the ACTUAL lab/density.js integrator maps,
# (3) checks D_MMUT - D_M2 = (1/4)[A,B]L and its vanishing RPA projection, (4) computes the no-fit C_j and compares
# with the measured discrete-map eigenvalues, (5) runs the B -> sB experiment, (6) decomposes C_j by word.
import json, numpy as np, scipy.linalg as sla
np.set_printoptions(linewidth=200, precision=6, suppress=False)
d = json.load(open('lin-h2o.json')); orc = json.load(open('../oracle-h2o.json'))
n = d['n']; nocc = d['nocc']; N2 = n*n
S = np.array(d['S']).reshape(n,n); h1 = np.array(d['h']).reshape(n,n); eri = np.array(d['eri']).reshape(n,n,n,n)
Xl = np.array(d['X']).reshape(n,n); Wl = np.array(d['W']).reshape(n,n)
D0 = np.array(d['D0']).reshape(n,n); Cao = np.array(d['C']).reshape(n,n); eps = np.array(d['eps'])
P0 = Wl@D0@Wl
def g2e(D):   # the lab/density.js convention exactly: J pairs D_kl with (ij|kl), K pairs D_lk with (il|kj)
    return np.einsum('kl,ijkl->ij', D, eri) - 0.5*np.einsum('lk,ilkj->ij', D, eri)
F0ao = h1 + g2e(D0); F0t = Xl@F0ao@Xl
# --- the Hermitian basis, in lin.mjs's order -------------------------------------------------------------------
HB = []
for a in range(n):
    M = np.zeros((n,n), complex); M[a,a] = 1; HB.append(M)
for a in range(n):
    for b in range(a+1,n):
        r = 1/np.sqrt(2)
        R = np.zeros((n,n), complex); R[a,b] = r; R[b,a] = r; HB.append(R)
        I = np.zeros((n,n), complex); I[a,b] = 1j*r; I[b,a] = -1j*r; HB.append(I)
assert len(HB) == N2
HBf = np.array([M.reshape(-1) for M in HB])                       # N2 x N2
def opmat(f):                                                      # matrix of a real-linear operator on Herm
    cols = np.array([f(M).reshape(-1) for M in HB])                # cols[q] = f(H_q) flattened
    return np.real(HBf.conj() @ cols.T)                            # [p,q] = Tr(H_p f(H_q))
A = opmat(lambda M: -1j*(F0t@M - M@F0t))
def Bop(M):
    Gt = Xl@g2e(Xl@M@Xl)@Xl
    return -1j*(Gt@P0 - P0@Gt)
B = opmat(Bop)
L = A + B
# --- the occupied-virtual invariant subspace (real dimension 2*nocc*nvir) ---------------------------------------
Ct = Wl@Cao                                                        # MO vectors in the Löwdin frame, orthonormal
nvir = n-nocc; cols = []
for i in range(nocc):
    for a in range(nocc,n):
        ei = Ct[:,i:i+1]; ea = Ct[:,a:a+1]; r = 1/np.sqrt(2)
        for M in (r*(ei@ea.conj().T + ea@ei.conj().T), 1j*r*(ei@ea.conj().T - ea@ei.conj().T)):
            cols.append(np.real(HBf.conj() @ M.reshape(-1)))
Q = np.array(cols).T                                               # N2 x 20
Q,_ = np.linalg.qr(Q)
P_ = np.eye(N2) - Q@Q.T
print('invariance of the ov subspace:  ||(I-QQ^T)AQ|| = %.2e   ||(I-QQ^T)BQ|| = %.2e   ||B(I-QQ^T)... range|| ok'
      % (np.linalg.norm(P_@A@Q), np.linalg.norm(P_@B@Q)))
a20, b20 = Q.T@A@Q, Q.T@B@Q; l20 = a20+b20
ev = np.linalg.eigvals(l20); w = np.sort(np.abs(ev.imag))[::-1][::2]
w = np.sort(np.array([x.imag for x in ev if x.imag > 0]))
wo = np.array(orc['tdhf']['roots_au'])
print('\nRPA roots from L restricted to the ov subspace vs the PySCF TDHF oracle:')
for k in range(len(w)): print('  %2d  L: %.9f   oracle: %.9f   delta %+.2e' % (k+1, w[k], wo[k], w[k]-wo[k]))
print('  max |delta| = %.3e   (max |Re lambda| = %.2e, should be 0)' % (np.abs(w-wo).max(), np.abs(ev.real).max()))
# --- Sol's D operators, and the two identities -----------------------------------------------------------------
AA, BB = a20, b20; LL = l20
D_M2   = (AA@BB@AA + AA@BB@BB + BB@AA@AA + BB@AA@BB)/12 - (BB@BB@AA + BB@BB@BB)/6
D_MMUT = (AA@BB@AA + AA@BB@BB)/3 - (BB@AA@AA + BB@AA@BB + BB@BB@AA + BB@BB@BB)/6
com = 0.25*(AA@BB - BB@AA)@LL
print('\nidentity  D_MMUT - D_M2 = (1/4)[A,B]L :  ||lhs-rhs|| = %.3e   (||lhs|| = %.3e)'
      % (np.linalg.norm(D_MMUT-D_M2-com), np.linalg.norm(D_MMUT-D_M2)))
print('identity  (1/4)[A,B]L = (1/4)[A,L]L  :  ||diff|| = %.3e' % np.linalg.norm(com - 0.25*(AA@LL-LL@AA)@LL))
# left/right eigenpairs of the 20x20 RPA operator
lam, R = np.linalg.eig(LL); Linv = np.linalg.inv(R)
order = np.argsort(-lam.imag)                                       # positive frequencies first, descending
pos = [k for k in order if lam[k].imag > 0]
pos.sort(key=lambda k: lam[k].imag)
print('\nprojection of the difference on each RPA left/right eigenpair (must be 0):')
mx = 0
for k in pos:
    r = R[:,k]; l = Linv[k,:]
    v = l@com@r; mx = max(mx, abs(v))
print('   max |l_j^dag (1/4)[A,B]L r_j| over the 10 pairs = %.3e   (scale max |l_j^dag D_M2 r_j| = %.3e)'
      % (mx, max(abs(Linv[k,:]@D_M2@R[:,k]) for k in pos)))
# --- C_j, no fit ------------------------------------------------------------------------------------------------
WORDS = {'ABA':AA@BB@AA, 'AB2':AA@BB@BB, 'BA2':BB@AA@AA, 'BAB':BB@AA@BB, 'B2A':BB@BB@AA, 'B3':BB@BB@BB, 'A2B':AA@AA@BB}
COEF_M2 = {'ABA':1/12,'AB2':1/12,'BA2':1/12,'BAB':1/12,'B2A':-1/6,'B3':-1/6,'A2B':0.0}
rows = []
for k in pos:
    r = R[:,k]; l = Linv[k,:]; l = l/(l@r)
    c2 = -np.imag(l@D_M2@r); cm = -np.imag(l@D_MMUT@r)
    wd = {name: -np.imag(COEF_M2[name]*(l@M@r)) for name,M in WORDS.items()}
    rows.append(dict(w=float(lam[k].imag), C_M2=float(c2), C_MMUT=float(cm), words=wd))
print('\n  omega_RPA        C_j (D_M2)     C_j (D_MMUT)   diff        | word contributions to C_j(D_M2)')
for rr in rows:
    wd = rr['words']
    print('  %13.9f  %+12.6f  %+12.6f  %+.2e  | ' % (rr['w'], rr['C_M2'], rr['C_MMUT'], rr['C_MMUT']-rr['C_M2'])
          + '  '.join('%s %+9.4f' % (k, wd[k]) for k in ('ABA','BA2','AB2','BAB','B2A','B3','A2B')))
json.dump(rows, open('gen-Cj.json','w'), indent=1)
# --- the measured side: eigenvalues of the ACTUAL integrator maps -----------------------------------------------
def restrict(Mjs): return Q.T@(np.array(Mjs).T)@Q
maps = {(m['s'], m['dt']): m for m in d['maps']}
DTS = sorted({m['dt'] for m in d['maps']}, reverse=True); SS = sorted({m['s'] for m in d['maps']})
def m2_freqs(s, dt):
    M = restrict(maps[(s,dt)]['magnus2']); z = np.linalg.eigvals(M)
    f = np.sort(np.array([-np.angle(x)/dt for x in z if np.angle(x) < 0]))
    return f, np.abs(np.abs(z)-1).max()
def mmut_branches(s, dt):
    Ma = restrict(maps[(s,dt)]['mmutA']); Mb = restrict(maps[(s,dt)]['mmutB'])
    m = Ma.shape[0]; Cm = np.block([[Ma, Mb],[np.eye(m), np.zeros((m,m))]])
    z = np.linalg.eigvals(Cm)
    return z, Ma, Mb
print('\nMagnus-2: unitarity of the linearised map (max | |zeta| - 1 |) and omega(dt) at s=1')
for dt in DTS:
    f, u = m2_freqs(1.0, dt); print('  dt=%-7g  max||z|-1| = %.2e   omega = %s' % (dt, u, ' '.join('%.7f'%x for x in f)))
wr = np.array([rr['w'] for rr in rows])
print('\nQ14 · C_j measured from the discrete-map eigenvalues (Richardson on dt) vs the no-fit prediction, s = 1')
print('  omega_RPA       C pred(M2)   C meas(M2)   ratio    C pred(MMUT)  C meas(MMUT)  ratio    round2 fit')
r2 = {0.483101392:0.0620, 20.157421877:60.358, 20.106993485:53.390}
res = []
for j,wj in enumerate(wr):
    fa,_ = m2_freqs(1.0, DTS[1]); fb,_ = m2_freqs(1.0, DTS[2]); fc,_ = m2_freqs(1.0, DTS[3])
    ia = np.argmin(abs(fa-wj)); ib = np.argmin(abs(fb-wj)); ic = np.argmin(abs(fc-wj))
    Cm2 = (fb[ib]-fc[ic])/(DTS[2]**2 - DTS[3]**2)
    za,Ma,Mb = mmut_branches(1.0, DTS[2]); zb,_,_ = mmut_branches(1.0, DTS[3])
    def phys(z, dt, wj):
        cands = np.array([-np.angle(x)/dt for x in z if np.angle(x) < 0])
        return cands[np.argmin(abs(cands-wj))]
    Cmm = (phys(za,DTS[2],wj)-phys(zb,DTS[3],wj))/(DTS[2]**2 - DTS[3]**2)
    pj = rows[j]
    lab = ('%.3f'%r2[round(wj,9)]) if round(wj,9) in r2 else '--'
    print('  %13.9f %+11.5f %+11.5f  %7.4f %+12.5f %+12.5f  %7.4f   %s'
          % (wj, pj['C_M2'], Cm2, Cm2/pj['C_M2'] if pj['C_M2'] else np.nan, pj['C_MMUT'], Cmm,
             Cmm/pj['C_MMUT'] if pj['C_MMUT'] else np.nan, lab))
    res.append((wj, pj['C_M2'], Cm2, pj['C_MMUT'], Cmm))
np.save('gen-res.npy', np.array(res))
