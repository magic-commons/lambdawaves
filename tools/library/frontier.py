#!/usr/bin/env python
"""Pinned-decimal C60 frontier and independent water AO-conversion proof. Exclusive output.
Run: ~/bin/scipython -I tools/library/frontier.py
     ~/bin/scipython -I tools/library/frontier.py --occupied   (0.6.1 F1: the same C60 RHF, every occupied column + the LUMO set)
"""
import json, math, time, hashlib, itertools, resource, sys
from pathlib import Path
import numpy as np
import pyscf
from pyscf import gto,scf,lib
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'research/release-0.4.0/library-census'
REC=json.loads((ROOT/'lab/vendor/bse/sto-3g-v1.json').read_text())
lib.num_threads(2)
def save(name,obj):
    with (OUT/name).open('x') as f: json.dump(obj,f,indent=2,allow_nan=False);f.write('\n')
def basis(zs):
    return {gto.mole._symbol(z):[[l]+[[float(e),float(sh['coefficients'][col][k])] for k,e in enumerate(sh['exponents'])] for sh in REC['elements'][str(z)]['electron_shells'] for col,l in enumerate(sh['angular_momentum'])] for z in set(zs)}
def conversion(mol):
    # Stable l sorting within each atom, then xx,xy,xz,yy,yz,zz.
    loc=mol.ao_loc_nr(); ix=[]; factors=[]; descriptors=[]
    labels=mol.ao_labels()
    for ia in range(mol.natm):
        shells=sorted([k for k in range(mol.nbas) if mol.bas_atom(k)==ia],key=mol.bas_angular)
        for k in shells:
            l=mol.bas_angular(k)
            for j in range(loc[k],loc[k+1]):
                ix.append(j); lab=labels[j].split()[-1]
                factors.append(1. if l<2 else math.sqrt(4*math.pi/(5 if lab.endswith(('xx','yy','zz')) else 15)))
                descriptors.append(labels[j])
    return np.array(ix),np.array(factors),descriptors
def solve(mol,tol=1e-13,grad=1e-10):
    mf=scf.RHF(mol);mf.chkfile=None;mf.max_cycle=200;mf.conv_tol=tol;mf.conv_tol_grad=grad;mf.direct_scf_tol=1e-13;mf.max_memory=128
    t=time.perf_counter();mf.kernel();return mf,time.perf_counter()-t
def occupied():
    # 0.6.1 F1: re-run the frontier dump's C60 RHF (same geometry, basis, tolerances) on 12 threads and keep columns 0..182 in the
    # app's AO order and normalisation, with PySCF's own GTOval_cart values of a sample of them at the frontier dump's 92 points.
    lib.num_threads(12)
    verts=np.array(json.loads((ROOT/'research/release-0.4.0/measure/round2-sol-exact.json').read_text())['directC60']['coordinatesAngstrom'])
    mol=gto.M(atom=[('C',tuple(v)) for v in verts],unit='Angstrom',basis=basis([6]),cart=True,symmetry=True,verbose=0,max_memory=128)
    mf,secs=solve(mol,1e-11,1e-8);assert mf.converged
    ix,rd,labs=conversion(mol);C=rd[:,None]*mf.mo_coeff[ix];nocc=int(np.sum(mf.mo_occ==2));cols=list(range(nocc+3))
    pts=np.array(json.loads((OUT/'c60-pyscf-samples.json').read_text())['pointsBohr']);sample=list(range(0,nocc,9))+[nocc-1,nocc,nocc+2]
    vals=mol.eval_gto('GTOval_cart',pts)@mf.mo_coeff[:,sample]
    S=mol.intor('int1e_ovlp')[np.ix_(ix,ix)]/rd[:,None]/rd[None,:];V=C[:,cols]
    save('c60-occupied.json',{'status':'MEASURED','meaning':'C60 direct RHF re-run for 0.6.1 F1: every occupied column and the LUMO set, each nAO coefficients in the app AO order and normalisation (c60-frontier.json aoConversion); samples are PySCF GTOval_cart values in its own AO order, no conversion','basisSha256':hashlib.sha256((ROOT/'lab/vendor/bse/sto-3g-v1.json').read_bytes()).hexdigest(),
      'solver':{'pyscf':pyscf.__version__,'threads':lib.num_threads(),'converged':bool(mf.converged),'energyEh':float(mf.e_tot),'wallSeconds':secs,'cycles':mf.cycles,'convTolEh':mf.conv_tol,'convTolGrad':mf.conv_tol_grad,'orbitalEnergiesEh':mf.mo_energy.tolist(),'nocc':nocc},
      'indices':cols,'coefficientColumns':V.T.tolist(),'maxOrthonormalityError':float(np.max(abs(V.T@S@V-np.eye(len(cols))))),
      'samples':{'pointsBohr':pts.tolist(),'indices':sample,'signedValues':vals.tolist(),'tolerance':1e-10}})
    print(json.dumps({'energyEh':mf.e_tot,'wallSeconds':secs,'threads':lib.num_threads()}),flush=True)
if '--occupied' in sys.argv: occupied(); sys.exit()
water=json.loads((OUT/'water-app.json').read_text())
atoms=[(gto.mole._symbol(a['Z']),(a['x'],a['y'],a['z'])) for a in water['atomsBohr']]
mol=gto.M(atom=atoms,unit='Bohr',basis=basis([8,1]),cart=True,symmetry=True,verbose=0,max_memory=128)
mf,secs=solve(mol);ix,rd,labs=conversion(mol);C=rd[:,None]*mf.mo_coeff[ix]
A=np.array(water['C']).reshape(C.shape);S=np.array(water['S']).reshape(C.shape)
sign=np.sign(np.sum(C*(S@A),axis=0));sign[sign==0]=1
errors=np.max(abs(C*sign-A),axis=0)
watercheck={'status':'MEASURED','pass':bool(max(errors)<1e-8),'tolerance':1e-8,'maxCoefficientErrorUpToSign':float(max(errors)),'perOrbitalMaxError':errors.tolist(),'signs':sign.tolist(),'maxEnergyDifferenceEh':float(max(abs(mf.mo_energy-np.array(water['orbitalEnergies'])))),'maxOverlapDifference':float(np.max(abs(mol.intor('int1e_ovlp')[np.ix_(ix,ix)]/rd[:,None]/rd[None,:]-S))),'pyscfConverged':bool(mf.converged),'appConverged':water['converged'],'appBasisHash':water['basisHash'],'appAOOrder':water['order'],'permutationAppToPySCF':ix.tolist(),'rowScalePySCFToApp':rd.tolist(),'pyscfWallSeconds':secs,'geometrySource':'lab/molecules.js H2O, exact app bohr coordinates; water-app.json contains the native solve','comparison':'All occupied AND virtual coefficient columns, in the same fixed Cartesian frame, up to independent signs; no density-only or subspace-only substitution.'}
save('water-conversion.json',watercheck)
print(json.dumps(watercheck),flush=True)
assert watercheck['pass'],'Water conversion must pass before C60 export'
old=json.loads((ROOT/'research/release-0.4.0/measure/round2-sol-exact.json').read_text())['directC60']
verts=np.array(old['coordinatesAngstrom']);mol=gto.M(atom=[('C',tuple(v)) for v in verts],unit='Angstrom',basis=basis([6]),cart=True,symmetry=True,verbose=0,max_memory=128)
print('Starting direct C60 RHF, two threads, no stored ERI',flush=True)
mf,secs=solve(mol,1e-11,1e-8);assert mf.converged
ix,rd,labs=conversion(mol);C=rd[:,None]*mf.mo_coeff[ix];S=mol.intor('int1e_ovlp')[np.ix_(ix,ix)]/rd[:,None]/rd[None,:]
hidx=np.arange(175,180);lidx=np.arange(180,183)
assert max(np.ptp(mf.mo_energy[hidx]),np.ptp(mf.mo_energy[lidx]))<1e-8
# Independently verify the full Ih characters, rather than treating Ci labels as Ih.
phi=(1+math.sqrt(5))/2;ico=np.array([(0,a,b) for a in [-1,1] for b in [-phi,phi]]+[(b,0,a) for a in [-1,1] for b in [-phi,phi]]+[(a,b,0) for a in [-1,1] for b in [-phi,phi]])
ref=ico[[0,1,4]].T;gram=ref.T@ref;rot=[]
for inds in itertools.permutations(range(12),3):
    w=ico[list(inds)].T
    if np.max(abs(w.T@w-gram))>1e-9:continue
    R=w@np.linalg.inv(ref)
    if np.linalg.det(R)<0:continue
    if np.max(np.min(np.linalg.norm(ico@R.T-ico[:,None,:],axis=2),axis=0))<1e-8:rot.append(R)
assert len(rot)==60
def representation(R):
    xyz=verts@R.T;dist=np.linalg.norm(xyz[:,None]-verts[None,:],axis=2);perm=dist.argmin(axis=1)
    assert np.max(dist[np.arange(60),perm])<1e-8
    T=np.zeros((300,300))
    for i,j in enumerate(perm):
        T[5*j:5*j+2,5*i:5*i+2]=np.eye(2);T[5*j+2:5*j+5,5*i+2:5*i+5]=R
    return T
checks=[]
expected={'E':(5.,3.),'C5':(0.,phi),'C5^2':(0.,1-phi),'C3':(-1.,0.),'C2':(1.,-1.)}
counts={k:0 for k in expected};worst=0.;leak=0.
for R in rot:
    angle=math.acos(np.clip((np.trace(R)-1)/2,-1,1)); cls=min({'E':0.,'C5':2*math.pi/5,'C5^2':4*math.pi/5,'C3':2*math.pi/3,'C2':math.pi}.items(),key=lambda kv:abs(angle-kv[1]))[0]
    counts[cls]+=1;T=representation(R);chars=[]
    for ids in [hidx,lidx]:
        V=C[:,ids];B=V.T@S@T@V;chars.append(float(np.trace(B)));leak=max(leak,float(np.max(abs(T@V-V@B))))
    worst=max(worst,max(abs(np.array(chars)-expected[cls])))
    if counts[cls]==1:checks.append({'class':cls,'traceHOMO':chars[0],'traceLUMO':chars[1],'expectedHOMO':expected[cls][0],'expectedLUMO':expected[cls][1]})
T=representation(-np.eye(3));par=[float(np.trace(C[:,ids].T@S@T@C[:,ids])) for ids in [hidx,lidx]]
assert worst<1e-6 and leak<1e-6 and max(abs(np.array(par)-[-5,-3]))<1e-6
front={'status':'DRAFT','schemaNote':'DRAFT research record; S4a fixes the production schema later. No record has been installed.','numericTagging':'Numeric arrays inherit the status of their containing block; AO/index counts are DERIVED, solver and checks MEASURED. Geometry is DERIVED from the cited fixture and UNVERIFIED against experiment.','basis':{'name':'STO-3G','kind':'cartesian','source':'lab/vendor/bse/sto-3g-v1.json','sha256':hashlib.sha256((ROOT/'lab/vendor/bse/sto-3g-v1.json').read_bytes()).hexdigest()},'geometry':{'status':'DERIVED','experimentalStatus':'UNVERIFIED','why':'Equal-edge ideal truncated icosahedron from Round 2; both edge kinds are equal, unlike experimental C60. This is a reference feasibility fixture, not experimental geometry.','source':'tools/symmetry/round2-sol-exact.py; research/release-0.4.0/measure/round2-sol-exact.json directC60.coordinatesAngstrom','atomsAngstrom':[[6,*v] for v in verts.tolist()],'charge':0,'multiplicity':1},'solver':{'status':'MEASURED','pyscf':pyscf.__version__,'threads':lib.num_threads(),'method':'direct RHF; pinned vendored decimals; cart=True; symmetry=True; no density fitting','converged':bool(mf.converged),'energyEh':float(mf.e_tot),'wallSeconds':secs,'cycles':mf.cycles,'eriIsNone':mf._eri is None,'processPeakRssKiB':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,'convTolEh':mf.conv_tol,'convTolGrad':mf.conv_tol_grad,'topgroup':mol.topgroup,'computedGroup':mol.groupname,'orbitalEnergiesEh':mf.mo_energy.tolist(),'occupations':mf.mo_occ.tolist()},'aoConversion':{'status':'DERIVED','formula':'C_app[i,j] = R[i] * C_pyscf[permutationAppToPySCF[i],j]; chi_pyscf = R * chi_app; S_app = R^-1 S_pyscf R^-1','appOrder':'atom, stable l ascending, s; x,y,z; xx,xy,xz,yy,yz,zz','appNormalisation':'Each contracted Cartesian component has unit self-overlap (lab/md.js). R=1 for s,p; sqrt(4*pi/5) for axial d, sqrt(4*pi/15) for mixed d. C60 only has s,p.','permutationAppToPySCF':ix.tolist(),'rowScalePySCFToApp':rd.tolist(),'appAODescriptors':labs,'basisUnit':'Bohr','angstromToBohr':1/0.52917721092},'waterProof':watercheck,'frontier':{'status':'MEASURED','indexConvention':'zero-based MO indices; columns each contain nAO coefficients in app order','HOMO':{'irrep':'h_u','indices':hidx.tolist(),'energySpreadEh':float(np.ptp(mf.mo_energy[hidx])),'coefficientColumns':C[:,hidx].T.tolist()},'LUMO':{'irrep':'t1u','indices':lidx.tolist(),'energySpreadEh':float(np.ptp(mf.mo_energy[lidx])),'coefficientColumns':C[:,lidx].T.tolist()},'gapEh':float(mf.mo_energy[180]-mf.mo_energy[179]),'gauge':'PySCF eigenbasis within each degenerate set; independent column signs unpinned; S4a canonical gauge pending. Complete degenerate subspaces retained.'},'validation':{'status':'MEASURED','fullIhProperOperationCount':len(rot),'classCounts':counts,'characters':checks,'inversionTraces':par,'maxCharacterError':worst,'maxCoefficientSubspaceLeakage':leak,'maxFullMOOrthonormalityError':float(np.max(abs(C.T@S@C-np.eye(300)))),'fullGroupLabelsVerified':True,'scope':'CPU AO convention, coefficient orthonormality, Ih character proof. No GPU/render/device verification or RHF stability minimum certification.'}}
save('c60-frontier.json',front)
print(json.dumps({'converged':bool(mf.converged),'wallSeconds':secs,'energyEh':mf.e_tot,'waterPass':watercheck['pass'],'charactersMaxError':worst}),flush=True)
