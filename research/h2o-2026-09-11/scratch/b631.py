# b631.py — ROUND 4 · OPUS, Q16 (oracle only): BSE 6-31+G* pinned decimals, H2O at the ledger geometry,
# PySCF with cart=True -> 23 Cartesian AOs, RHF energy, orbital energies, and the first five singlet RPA roots.
import json, hashlib, os, numpy as np
from pyscf import gto, scf, tdscf
ANG = 1/0.52917721092
SYM = {1:'H',8:'O'}
BSE = os.path.join(os.path.dirname(__file__),'..','6-31+gs.bse.json')
bse = json.load(open(BSE))
print('BSE record: name=%r version=%r revision=%r'%(bse.get('name'),bse.get('version'),bse.get('revision_date')))
print('URL  : https://www.basissetexchange.org/api/basis/6-31%2Bg_st_/format/json?elements=1,8&version=1')
print('       (308-redirects to .../format/json/?elements=1,8&version=1)')
print('SHA-256 of the stored bytes: %s'%hashlib.sha256(open(BSE,'rb').read()).hexdigest())
def basis(zs):
    out={}
    for z in zs:
        sh=[]
        for s in bse['elements'][str(z)]['electron_shells']:
            e=[float(x) for x in s['exponents']]
            for col,l in enumerate(s['angular_momentum']):
                c=[float(x) for x in s['coefficients'][col]]
                sh.append([l]+[[e[i],c[i]] for i in range(len(e))])
        out[SYM[z]]=sh
    return out
GEOM=[(8,(0.,0.,0.1173)),(1,(0.,0.7572,-0.4692)),(1,(0.,-0.7572,-0.4692))]
spec=[[SYM[z],tuple(np.array(c)*ANG)] for z,c in GEOM]
for cart in (True, False):
    mol=gto.M(atom=spec,unit='Bohr',basis=basis([1,8]),cart=cart,verbose=0)
    mf=scf.RHF(mol); mf.conv_tol=1e-13; mf.run()
    print('\ncart=%s  nao=%d  nelec=%d  Enuc=%.12f  E=%.12f  conv=%s'%(cart,mol.nao_nr(),mol.nelectron,mol.energy_nuc(),mf.e_tot,mf.converged))
    print('  eps[0:8] =', ' '.join('%.6f'%x for x in mf.mo_energy[:8]))
    td=tdscf.rhf.TDHF(mf); td.nstates=6; td.singlet=True; td.conv_tol=1e-11; td.max_cycle=500; td.kernel()
    tdip=td.transition_dipole()
    print('  first five singlet RPA roots / f / transition dipole:')
    for i in range(5):
        print('   %d  w=%.9f  f=%.6f  mu=(%+.6f,%+.6f,%+.6f)'%(i+1,td.e[i],td.oscillator_strength()[i],*tdip[i]))
    if cart:
        S=mol.intor('int1e_ovlp'); d=np.diag(S)
        labs=mol.ao_labels()
        print('  Cartesian d self-overlaps (4pi/5 = %.9f, 4pi/15 = %.9f):'%(4*np.pi/5,4*np.pi/15))
        for i,(lab,v) in enumerate(zip(labs,d)):
            if 'd' in lab.split()[-1]: print('    %2d %-12s %.9f'%(i,lab,v))
        json.dump(dict(E=float(mf.e_tot),Enuc=float(mol.energy_nuc()),nao=int(mol.nao_nr()),
                       eps=[float(x) for x in mf.mo_energy],
                       roots=[float(x) for x in td.e[:5]],f=[float(x) for x in td.oscillator_strength()[:5]],
                       tdip=[[float(v) for v in r] for r in tdip[:5]],
                       ao_labels=[l.strip() for l in labs], S_diag=[float(x) for x in d]),
                  open('b631-pyscf.json','w'),indent=1)
