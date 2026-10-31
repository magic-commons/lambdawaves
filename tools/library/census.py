#!/usr/bin/env python
"""Measure all census rows on pinned decimals. Each row is checkpointed with exclusive creation.
Run: ~/bin/scipython -I tools/library/census.py
No lab writes, no new basis definitions, no server, no density fitting.
"""
import json,time,math,hashlib,platform,importlib.util,warnings,sys,builtins
from pathlib import Path
from collections import Counter
import numpy as np
from scipy.optimize import minimize,minimize_scalar
from threadpoolctl import threadpool_limits,threadpool_info
import pyscf
from pyscf import gto,scf,symm,lib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'tools/library/census';ROW=OUT/'rows';ROW.mkdir(exist_ok=True)
REC=json.loads((ROOT/'lab/vendor/bse/sto-3g-v1.json').read_text());REC631=json.loads((ROOT/'lab/vendor/bse/6-31+g-star-v1.json').read_text())
INPUT=json.loads((OUT/'census-input.json').read_text());META=json.loads((OUT/'present-input.json').read_text());lib.num_threads(2)
blas_limits=threadpool_limits(limits=1,user_api='blas')
benchmark=json.loads((ROOT/'tools/library/benchmark-reference-geometries.json').read_text())
s66=json.loads((ROOT/'tools/library/s66-reference-geometries.json').read_text())
reference_overrides={
    'uracil':(benchmark['uracil'],[0]),
    'adenine':(benchmark['adenine-thymine'],[0]),
    'thymine':(benchmark['adenine-thymine'],[1]),
    'A-T':(benchmark['adenine-thymine'],[0,1]),
    'indole':(benchmark['indole-benzene'],[1]),
    'neopentane':(s66['neopentane'],[0]),
    'N-methylacetamide':(s66['N-methylacetamide'],[0]),
}
for r in INPUT['rows']:
    if r['id'] in reference_overrides:
        ref,fragments=reference_overrides[r['id']]
        atoms=[[gto.charge(a[0]),*a[1:]] for i in fragments for a in ref['fragments'][i]]
        assert Counter(a[0] for a in atoms)==Counter(int(a[0]) for a in r['geometry']['atomsAngstrom'])
        r['geometry']={'atomsAngstrom':atoms,'source':ref['source']+'; '+ref['entry']+'; published computed benchmark reference; fragment(s) '+str(fragments)+'; UNVERIFIED against experiment','status':'MEASURED','experimentalStatus':'UNVERIFIED','why':'Copied benchmark reference coordinates; this does not claim an experimental geometry or an RHF minimum.'}
        r['optimise']=False;r['optimisationMode']=None;r.pop('monomers',None)
BOHR=.52917721092
def log(*args,**kwargs):
    try:builtins.print(*args,**kwargs)
    except BrokenPipeError:raise SystemExit(130)
def save(path,obj):
    with path.open('x') as f:json.dump(obj,f,indent=2,allow_nan=False);f.write('\n')
def pinned(zs,rec=REC):
    return {gto.mole._symbol(z):[[l]+[[float(e),float(sh['coefficients'][col][k])] for k,e in enumerate(sh['exponents'])] for sh in rec['elements'][str(z)]['electron_shells'] for col,l in enumerate(sh['angular_momentum'])] for z in set(zs)}
def mol_for(ang,charge,symmetry=True):
    return gto.M(atom=[(gto.mole._symbol(int(z)),tuple(xyz)) for z,*xyz in ang],basis=pinned([int(a[0]) for a in ang]),unit='Angstrom',cart=True,charge=charge,spin=0,symmetry=symmetry,verbose=0,max_memory=2048)
def mf_for(mol,tol=1e-13,grad=1e-10):
    mf=scf.RHF(mol);mf.chkfile=None;mf.max_memory=2048;mf.max_cycle=200;mf.conv_tol=tol;mf.conv_tol_grad=grad;mf.direct_scf_tol=1e-13;return mf
def bond_angle_inverse(pos,z):
    # Initial curvature only; every objective/gradient remains exact pinned RHF.
    p=pos/BOHR;n=len(p);h=np.eye(3*n)*.02
    radii={1:.31,5:.84,6:.76,7:.71,8:.66,9:.57,14:1.11,15:1.07,16:1.05,17:1.02}
    neighbors=[[] for _ in p]
    for i in range(n):
        for j in range(i):
            v=p[i]-p[j];d=np.linalg.norm(v)
            if d*BOHR<1.3*(radii.get(int(z[i]),1.4)+radii.get(int(z[j]),1.4)):
                neighbors[i].append(j);neighbors[j].append(i)
                b=np.zeros((n,3));b[i]=v/d;b[j]=-v/d;h+=.4*np.outer(b.ravel(),b.ravel())
    import itertools
    for j,nb in enumerate(neighbors):
        for i,k in itertools.combinations(nb,2):
            u=p[i]-p[j];v=p[k]-p[j];du=np.linalg.norm(u);dv=np.linalg.norm(v);u/=du;v/=dv;c=np.clip(u@v,-1,1);s=math.sqrt(max(1-c*c,1e-8))
            b=np.zeros((n,3));b[i]=(c*u-v)/(du*s);b[k]=(c*v-u)/(dv*s);b[j]=-b[i]-b[k]
            h+=.15*np.outer(b.ravel(),b.ravel())
    inv=np.linalg.inv(h);return (inv+inv.T)/2
def optimise(row):
    ang=row['geometry']['atomsAngstrom'];z=np.array([a[0] for a in ang]);pos=np.array([a[1:] for a in ang]);charge=row['charge'];mode=row['optimisationMode'];start=time.perf_counter();calls=0;lastdm=None;lastxyz=None
    work=OUT/'geometry-work'/row['id'];work.mkdir(parents=True,exist_ok=True)
    checkpoint_offset=max([int(p.stem.split('-')[-1]) for p in work.glob('evaluation-*.json')]+[0])
    if '--resume-best' in sys.argv and checkpoint_offset and mode not in ['pair','scale','ligand-scale']:
        prior=json.loads((work/('evaluation-'+str(checkpoint_offset)+'.json')).read_text())
        pos=np.array([a[1:] for a in prior['bestAtomsAngstrom']]);ang=prior['bestAtomsAngstrom']
    if mode=='pair':
        monomers=[json.loads((ROW/(id+'.json')).read_text())['geometry']['atomsAngstrom'] for id in row['monomers']]
        a=np.array(monomers[0]);b=np.array(monomers[1]);a[:,1:]-=a[:,1:].mean(axis=0);b[:,1:]-=b[:,1:].mean(axis=0)
        # Assemble separated neutral monomers; the final orientation/topology remains explicitly unverified.
        b[:,1]+=max(a[:,1])+abs(min(b[:,1]))+2.6;ang=a.tolist()+b.tolist();pos=np.array([a[1:] for a in ang]);z=np.array([a[0] for a in ang])
    best={'energy':float('inf')}
    def eval_pos(p,need_grad=True):
        nonlocal calls,lastdm,lastxyz
        mol=mol_for([[int(Z),*v] for Z,v in zip(z,p)],charge,False);mf=mf_for(mol,1e-10,1e-6)
        mf.kernel(dm0=lastdm);calls+=1
        if not mf.converged:
            mf=mf.newton();mf.chkfile=None;mf.max_cycle=60;mf.conv_tol=1e-10;mf.kernel()
        if not mf.converged:raise RuntimeError('unconverged SCF during geometry optimisation')
        if calls%20==0:log(json.dumps({'optimising':row['id'],'evaluations':calls,'energyEh':float(mf.e_tot)}),flush=True)
        lastdm=mf.make_rdm1();lastxyz=p
        energy=float(mf.e_tot)
        if energy<best['energy']:best.update(energy=energy,p=p.copy())
        if calls%20==0:
            save(work/('evaluation-'+str(checkpoint_offset+calls)+'.json'),{'status':'MEASURED','experimentalStatus':'UNVERIFIED','why':'Intermediate pinned RHF geometry optimisation checkpoint, not a converged geometry record; indices and atomic numbers DERIVED','evaluationsThisAttempt':calls,'bestEnergyEh':best['energy'],'bestAtomsAngstrom':[[int(Z),*v] for Z,v in zip(z,best['p'].tolist())]})
        return (energy,mf.nuc_grad_method().kernel()) if need_grad else energy
    try:
        if mode=='pair':
            na=len(monomers[0]);acore=pos[:na].copy();bcore=pos[na:].copy()
            acore-=acore.mean(axis=0);bcore-=bcore.mean(axis=0)
            # G O6,N1,N2 face C N4,N3,O2 in Watson-Crick contact order.
            # Atom indices refer to the explicit canonical SMILES build, whose order is retained during relaxation.
            gsites=acore[[9,10,0]];csites=bcore[[0,7,6]]
            gc=gsites.mean(axis=0);cc=csites.mean(axis=0)
            contactaxis=gsites[2]-gsites[0];contactaxis/=np.linalg.norm(contactaxis)
            direction=gc-acore.mean(axis=0);direction-=contactaxis*(direction@contactaxis);direction/=np.linalg.norm(direction)
            if '--geometry-refine' in sys.argv:
                # Contact triples are almost collinear: use complete ring planes to fix the remaining rotation.
                def frame(core,sites):
                    axis=sites[2]-sites[0];axis/=np.linalg.norm(axis)
                    normal=np.linalg.svd(core-core.mean(axis=0),full_matrices=False)[2][-1]
                    side=np.cross(axis,normal);side/=np.linalg.norm(side)
                    if side@(sites.mean(axis=0)-core.mean(axis=0))<0:side*=-1
                    return axis,side,np.cross(axis,side)
                ca,cv,cn=frame(bcore[:8],csites)
                ga,gv,gn=frame(acore[:11],gsites)
                # Outward directions from opposite base edges must face each other.
                rotation=np.column_stack([ca,cv,cn])@np.column_stack([ga,-gv,-gn]).T
                direction=gv
            else:
                target=gsites-gc
                u,_,vt=np.linalg.svd((csites-cc).T@target);rotation=u@vt
                if np.linalg.det(rotation)<0:u[:,-1]*=-1;rotation=u@vt
            bcore=(bcore-cc)@rotation+gc
            def pair_position(gap):
                return np.vstack([acore,bcore+direction*gap])
            opt=minimize_scalar(lambda gap:eval_pos(pair_position(gap),False),bounds=(2.3,3.5),method='bounded',options={'xatol':2e-5,'maxiter':80})
            final=pair_position(opt.x);converged=bool(opt.success);gradient=None
            detail='rigid separately relaxed G/C monomers; donor/acceptor triple G(O6,N1,N2)-C(N4,N3,O2) Kabsch aligned, fixed orientation, constrained contact-separation optimisation; hydrogen-bond angles, Watson-Crick topology and unconstrained minimum UNVERIFIED'
            row['geometry']['source']+='; Watson-Crick donor/acceptor triple aligned, rigid-monomer constrained separation optimisation, fixed orientation'
            if '--geometry-refine' in sys.argv:
                detail+='; refined orientation from complete heavy-atom ring planes, outward base edges facing each other'
                row['geometry']['source']+='; orientation refined from ring-plane frames'
        elif row['id'] in ['C20H20','B12H12--']:
            nh=len(pos)//2;core=pos[:nh];radii=np.linalg.norm(core,axis=1);directions=core/radii[:,None]
            def constrained(v):
                p=np.vstack([core*v[0],core*v[0]+directions*v[1]])
                energy,grad=eval_pos(p)
                jac=np.array([np.sum((grad[:nh]+grad[nh:])*core),np.sum(grad[nh:]*directions)])/BOHR
                return energy,jac
            init=np.array([1.,np.mean(np.linalg.norm(pos[nh:]-core,axis=1))])
            opt=minimize(constrained,init,jac=True,method='L-BFGS-B',bounds=[(.7,1.4),(.8,1.5)],options={'maxiter':100,'gtol':1e-5,'ftol':1e-12})
            final=np.vstack([core*opt.x[0],core*opt.x[0]+directions*opt.x[1]]);converged=bool(opt.success);gradient=float(np.max(abs(opt.jac)))
            detail='Ih-constrained cage radius and radial X-H distance optimisation; experimental geometry and unconstrained minimum UNVERIFIED'
        elif mode in ['scale','ligand-scale']:
            anchor=np.zeros(3) if mode=='scale' else pos[0]
            def fun(scale):return eval_pos(anchor+(pos-anchor)*scale,False)
            opt=minimize_scalar(fun,bounds=(.65,1.5),method='bounded',options={'xatol':2e-5,'maxiter':80})
            final=anchor+(pos-anchor)*opt.x;converged=bool(opt.success);gradient=None
            detail='constrained common-distance optimisation preserving initial point symmetry; not an unconstrained minimum proof'
        else:
            def fun(v):
                energy,grad=eval_pos(v.reshape(pos.shape)*BOHR)
                return energy,grad.ravel()
            if '--bfgs' in sys.argv or '--precondition' in sys.argv:
                # Full Cartesian BFGS retains all curvature; accuracy criterion unchanged.
                opts={'maxiter':200,'gtol':1e-4,'xrtol':1e-9}
                if '--precondition' in sys.argv:opts['hess_inv0']=bond_angle_inverse(pos,z)
                opt=minimize(fun,(pos/BOHR).ravel(),method='BFGS',jac=True,options=opts)
            else:
                opt=minimize(fun,(pos/BOHR).ravel(),method='L-BFGS-B',jac=True,options={'maxiter':300,'gtol':1e-4,'ftol':1e-11,'maxls':25,'maxcor':20})
            final=opt.x.reshape(pos.shape)*BOHR;gradient=float(np.max(abs(opt.jac)));converged=bool(opt.success and gradient<5e-4)
            detail=str(opt.message)+'; '+('bond-angle preconditioned Cartesian BFGS' if '--precondition' in sys.argv else 'Cartesian BFGS' if '--bfgs' in sys.argv else 'Cartesian L-BFGS-B')+'; one conformer, no vibrational Hessian or experimental comparison'
        row['geometry']['atomsAngstrom']=[[int(Z),*v] for Z,v in zip(z,final.tolist())]
        row['geometry']['status']='MEASURED';row['geometry']['experimentalStatus']='UNVERIFIED'
        row['geometry']['optimisation']={'status':'MEASURED','converged':converged,'objectiveEvaluations':calls,'wallSeconds':time.perf_counter()-start,'maxGradientEhPerBohr':None if row['id'] in ['C20H20','B12H12--'] else gradient,'details':detail}
        if row['id'] in ['C20H20','B12H12--']:
            row['geometry']['optimisation']['coordinateGradient']=opt.jac.tolist()
            row['geometry']['optimisation']['coordinateGradientUnits']=['Eh per dimensionless cage-radius scale','Eh per Angstrom radial X-H distance']
        if not converged:row['geometry']['source']+='; optimisation convergence UNVERIFIED (see optimisation diagnostics)'
    except Exception as ex:
        if 'p' in best:row['geometry']['atomsAngstrom']=[[int(Z),*v] for Z,v in zip(z,best['p'].tolist())]
        row['geometry']['optimisation']={'status':'MEASURED','converged':False,'objectiveEvaluations':calls,'wallSeconds':time.perf_counter()-start,'details':str(ex)}
        row['geometry']['source']+='; optimisation FAILED, best visited geometry only, UNVERIFIED'
    return row
def widths(z,rec):
    return [(l+1)*(l+2)//2 for sh in rec['elements'][str(z)]['electron_shells'] for l in sh['angular_momentum']]
def count631(zs):
    na=0;source={};missing=[]
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        for z in zs:
            if str(z) in REC631['elements']:
                na+=sum(widths(z,REC631));source[str(z)]='vendored 6-31+G* decimals'
            else:
                try:
                    shells=gto.basis.load('6-31+g*',gto.mole._symbol(z))
                    na+=sum((sh[0]+1)*(sh[0]+2)//2*len(sh[1][1:]) for sh in shells);source[str(z)]='installed PySCF 6-31+G* table, count only, not vendored or solved'
                except Exception:missing.append(gto.mole._symbol(z))
    return (None if missing else na),source,sorted(set(missing))
def model(w,nocc):
    n=sum(w);sp=(n*n+sum(x*x for x in w))/2;sp2=(sum(x*x for x in w)**2+sum(x**4 for x in w))/2;ew=81*(sp*sp+sp2)/2;rw=(nocc*(n-nocc))**2*n*n
    c=META['COST'];return int(round(c['a']*ew+c['b']*rw+c['c']))
def measure(row):
    if row['optimise']:log('OPTIMISE '+row['id'],flush=True);row=optimise(row)
    zs=[int(a[0]) for a in row['geometry']['atomsAngstrom']];nocc=(sum(zs)-row['charge'])//2;row['nocc']=nocc;row['nElectrons']=sum(zs)-row['charge'];assert row['nElectrons']%2==0
    n631,source,missing=count631(zs);row['nAO_631plusGstar']=n631;row['basis631CountSource']=source;row['basis631MissingElements']=missing
    if row.get('conditionalBasisBlocked'):
        row.update(nAO_STO3G=None,energyEh=None,wallSeconds=None,converged=None,gapEh=None,predictedRecordBytes=None,predictedRecordBytes631=None,appPredictedMs=None,overLiveBudget=None,renderTier='BLOCKED basis',topgroup=None,computedGroup=None)
        row['solveStatus']='UNVERIFIED: required vendored STO-3G lacks iodine/xenon; no solve attempted'
        row['geometry']['why']='Unoptimised conditional MODEL seed only; missing pinned basis prevents the required fallback optimisation.'
        try:row['seedTopgroup']=symm.geom.detect_symm([(gto.mole._symbol(z),tuple(p)) for z,*p in row['geometry']['atomsAngstrom']],verbose=0)[0]
        except Exception:row['seedTopgroup']=None
        return row
    w=[x for z in zs for x in widths(z,REC)];n=sum(w);row['nAO_STO3G']=n;row['predictedRecordBytes']=8*(n*n+2*n)+2000;row['predictedRecordBytes631']=None if n631 is None else 8*(n631*n631+2*n631)+2000
    row['appPredictedMs']=model(w,nocc);row['overLiveBudget']=row['appPredictedMs']>META['CAP_MS']*1.02;row['renderTier']='existing <=64 AO' if n<=64 else 'S4c 128-AO density tier' if n<=128 else 'S4c orbital-only; density over 128 AO'
    if row['optimisationMode']=='frontier':
        front=json.loads((OUT/'c60-frontier.json').read_text());data=front['solver'];row.update(energyEh=data['energyEh'],wallSeconds=data['wallSeconds'],converged=data['converged'],gapEh=front['frontier']['gapEh'],topgroup=data['topgroup'],computedGroup=data['computedGroup'],cycles=data['cycles']);row['solveStatus']='MEASURED: same direct solve as c60-frontier.json';return row
    mol=mol_for(row['geometry']['atomsAngstrom'],row['charge']);assert mol.nao==n;mf=mf_for(mol);t=time.perf_counter();mf.kernel();attempts=[{'status':'MEASURED','method':'DIIS RHF','converged':bool(mf.converged),'cycles':mf.cycles}]
    if not mf.converged:
        mf=mf.newton();mf.chkfile=None;mf.max_cycle=60;mf.conv_tol=1e-13;mf.conv_tol_grad=1e-8;mf.kernel();attempts.append({'status':'MEASURED','method':'Newton RHF rescue','converged':bool(mf.converged),'cycles':mf.cycles,'convTolGrad':mf.conv_tol_grad})
    wall=time.perf_counter()-t;row['solverAttempts']=attempts
    row.update(energyEh=float(mf.e_tot),wallSeconds=wall,converged=bool(mf.converged),gapEh=float(mf.mo_energy[nocc]-mf.mo_energy[nocc-1]) if nocc<n else None,topgroup=mol.topgroup,computedGroup=mol.groupname,cycles=mf.cycles)
    row['solveStatus']='MEASURED: fresh pinned-decimal RHF kernel (DIIS, plus explicit Newton rescue if needed), molecule/basis build and geometry optimisation excluded from wallSeconds'
    if 'd-block' in row['motifs'] and mf.converged:
        try:
            _,_,internal,external=mf.stability(internal=True,external=True,return_status=True);row['pyscfStability']={'status':'MEASURED','internalStable':bool(internal),'externalStable':bool(external),'meaning':'PySCF internal RHF orbital rotation and external RHF->UHF/complex probes; convergence alone does not certify stability'}
        except Exception as ex:row['pyscfStability']={'status':'UNVERIFIED','why':str(ex)}
    return row
rows=[]
priority={'alanine':0,'Li4F4':1,'TiCl4':2}
if '--wait-for-row' in sys.argv:
    waiting=ROW/(sys.argv[sys.argv.index('--wait-for-row')+1]+'.json')
    log('Waiting for the preceding geometry checkpoint: '+waiting.name,flush=True)
    while not waiting.exists():time.sleep(.25)
shard=None
if '--shard' in sys.argv:
    shard=tuple(map(int,sys.argv[sys.argv.index('--shard')+1].split('/')))
inputorder={r['id']:i for i,r in enumerate(INPUT['rows'])}
for row in sorted(INPUT['rows'],key=lambda r:priority.get(r['id'],3)):
    if '--only' in sys.argv and row['id'] not in sys.argv[sys.argv.index('--only')+1].split(','):continue
    if '--exclude' in sys.argv and row['id'] in sys.argv[sys.argv.index('--exclude')+1].split(','):continue
    if shard and (row['id']=='arginine' or row.get('monomers') or inputorder[row['id']]%shard[1]!=shard[0]):continue
    path=ROW/(row['id']+'.json')
    if path.exists():
        loaded=json.loads(path.read_text());refined=ROW/(row['id']+'-refined.json');geometry_refined=ROW/(row['id']+'-geometry-refined.json')
        if geometry_refined.exists():loaded=json.loads(geometry_refined.read_text())
        elif '--geometry-refine' in sys.argv or (loaded.get('optimise') and not loaded['geometry'].get('optimisation',{}).get('converged')):
            loaded['geometry']['source']+='; current refinement supersedes the preceding incomplete optimisation attempt'
            loaded=measure(loaded);save(geometry_refined,loaded)
        elif refined.exists():loaded=json.loads(refined.read_text())
        elif loaded.get('converged') is False:
            log('REFINE '+row['id'],flush=True);loaded=measure(loaded);save(refined,loaded)
        rows.append(loaded);continue
    if row['optimisationMode']=='frontier' and not (OUT/'c60-frontier.json').exists():
        log('C60 frontier pending: run this script again after frontier.py completes',flush=True);continue
    result=measure(row)
    result['numericStatus']={'geometry.atomsAngstrom':result['geometry']['status'],'charge':'DERIVED','multiplicity':'DERIVED','nocc':'DERIVED','nElectrons':'DERIVED','nAO_STO3G':'DERIVED' if result['nAO_STO3G'] is not None else 'UNVERIFIED: pinned basis absent','nAO_631plusGstar':'DERIVED' if result['nAO_631plusGstar'] is not None else 'UNVERIFIED: basis unavailable for '+','.join(result['basis631MissingElements']),'energyEh':'MEASURED' if result['energyEh'] is not None else result['solveStatus'],'wallSeconds':'MEASURED' if result['wallSeconds'] is not None else result['solveStatus'],'gapEh':'DERIVED from MEASURED orbital energies' if result['gapEh'] is not None else result['solveStatus'],'predictedRecordBytes':'DERIVED: 8*(nAO^2+2*nAO)+2000' if result['predictedRecordBytes'] is not None else 'UNVERIFIED: nAO unavailable','predictedRecordBytes631':'DERIVED: 8*(nAO^2+2*nAO)+2000' if result['predictedRecordBytes631'] is not None else 'UNVERIFIED: nAO unavailable','appPredictedMs':'DERIVED from present COST; timing prediction UNVERIFIED after N2 refit','cycles':'MEASURED'}
    save(path,result);rows.append(result);log(json.dumps({k:result.get(k) for k in ['id','formula','nAO_STO3G','nAO_631plusGstar','energyEh','wallSeconds','converged','topgroup']}),flush=True)
if shard or '--only' in sys.argv:raise SystemExit(0)
if len(rows)!=len(INPUT['rows']):raise SystemExit('Rows checkpointed; census assembly waits for frontier')
order={r['id']:i for i,r in enumerate(INPUT['rows'])};rows.sort(key=lambda r:order[r['id']])
# Mechanical, order-dependent dry run. Only accepted rows seed novelty.
seenformula=set();elements=set();groups=set();motifs=set()
for r in rows:
    # The authoritative census uses decimal 2 KB, consistent with the read cache-budget plan.
    # Early raw checkpoints used 2 KiB; retain that alternative explicitly without changing measurements.
    for countfield,bytefield in [('nAO_STO3G','predictedRecordBytes'),('nAO_631plusGstar','predictedRecordBytes631')]:
        n=r[countfield]
        r[bytefield]=None if n is None else 8*(n*n+2*n)+2000
        r[bytefield+'2KiB']=None if n is None else 8*(n*n+2*n)+2048
        r['numericStatus'][bytefield]='DERIVED: 8*(nAO^2+2*nAO)+2000; decimal 2 KB metadata' if n is not None else 'UNVERIFIED: nAO unavailable'
        r['numericStatus'][bytefield+'2KiB']='DERIVED: binary 2 KiB alternative adds 48 bytes' if n is not None else 'UNVERIFIED: nAO unavailable'
    opt=r['geometry'].get('optimisation')
    if r['id']=='ice-hexamer':
        r['motifs']=[m for m in r['motifs'] if m!='ring:6']
        r['motifCorrection']='DERIVED: a hydrogen-bonded water ring is a cluster; the fixed ring-size motif denotes covalent cycles only.'
    if r['id'] in ['arginine','lysine']:
        r['geometry']['source']=r['geometry']['source'].replace('coordinate downloads inaccessible','downloaded wwPDB reference had cationic protonation; neutral census connectivity built here instead')
    if r['id']=='C60':
        r['geometry']['status']='DERIVED'
        r['numericStatus']['geometry.atomsAngstrom']='DERIVED: Round 2 ideal equal-edge reference fixture; UNVERIFIED against experiment'
    if r['id'] in ['NiCO4','FeCO5','CrCO6']:
        r['geometry']['source']=r['geometry']['source'].replace('RHF optimisation with retained point symmetry','unconstrained Cartesian RHF optimisation from the initial ideal symmetry; final detected group reported')
        r['geometry']['sourceCorrection']='DERIVED: the initial source wording incorrectly implied a symmetry constraint; these carbonyls were fully relaxed in Cartesian coordinates.'
    if r['id'] in ['C20H20','B12H12--'] and opt and opt.get('maxGradientEhPerBohr') is not None:
        opt['maxMixedCoordinateGradient']=opt.pop('maxGradientEhPerBohr')
        opt['mixedGradientMeaning']='Maximum numerical component of the two constrained derivatives: Eh per dimensionless cage-radius scale and Eh/Angstrom radial X-H distance; not a Cartesian Eh/Bohr force. Raw checkpoint legacy label corrected here.'
        opt['maxGradientEhPerBohr']=None
    key=r['formula']+(('+' if r['charge']>0 else '-')+str(abs(r['charge'])) if r['charge'] else '')
    zs={a[0] for a in r['geometry']['atomsAngstrom']};freshz=sorted(zs-elements);pg=r.get('topgroup');freshg=pg and pg not in groups;freshtags=sorted(set(r['motifs'])-motifs);unique=key not in seenformula
    fam=r['family'] in ['amino-acids','nucleobases'];passed=fam or (unique and bool(freshz or freshg or freshtags))
    why=[]
    if fam:why.append('declared '+r['family']+' family; formula/novelty exception')
    elif not unique:why.append('duplicate formula with charge '+key)
    elif passed:
        if freshz:why.append('new elements '+','.join(gto.mole._symbol(z) for z in freshz))
        if freshg:why.append('new measured point group '+pg)
        if freshtags:why.append('new motifs '+','.join(freshtags))
    else:why.append('unique formula, but no new element, measured point group or fixed-list motif')
    r['diversityGate']={'status':'DERIVED','pass':passed,'why':'; '.join(why),'formulaUniqueBefore':unique,'newElements':freshz,'newMeasuredPointGroup':pg if freshg else None,'newMotifs':freshtags,'scientificallyBlocked':bool(r.get('conditionalBasisBlocked'))}
    if passed:seenformula.add(key);elements|=zs;motifs|=set(r['motifs']);groups.add(pg) if pg else None
    r['libraryReady']=bool(passed and r.get('converged') and not r.get('conditionalBasisBlocked') and (not r['optimise'] or r['geometry'].get('optimisation',{}).get('converged')))
    if r.get('pyscfStability',{}).get('internalStable') is False or r.get('pyscfStability',{}).get('externalStable') is False:r['libraryReady']=False
    if r.get('presentInstability'):r['libraryReady']=False
sections={}
for s in ['DIATOMICS','HYDRIDES','ORGANIC','BIO','LATTICE','HEAVY']:
    rr=[r for r in rows if r['section']==s];sections[s]={'status':'DERIVED','rows':len(rr),'stoBytes':sum(r['predictedRecordBytes'] or 0 for r in rr),'six31BytesWhereDefined':sum(r['predictedRecordBytes631'] or 0 for r in rr),'gatePass':sum(r['diversityGate']['pass'] for r in rr),'gateFail':sum(not r['diversityGate']['pass'] for r in rr),'need128':sum(64<(r['nAO_STO3G'] or 0)<=128 for r in rr),'over128':sum((r['nAO_STO3G'] or 0)>128 for r in rr),'basisBlocked':sum(bool(r.get('conditionalBasisBlocked')) for r in rr),'overLiveBudget':sum(bool(r['overLiveBudget']) for r in rr)}
bse_available=importlib.util.find_spec('basis_set_exchange') is not None
coverage={'status':'MEASURED','python':'~/bin/scipython -I','basisSetExchangeImportable':bse_available,'vendoredStoElements':sorted(map(int,REC['elements'])),'vendoredStoMaxZ':max(map(int,REC['elements'])),'iodineVendored':str(53) in REC['elements'],'xenonVendored':str(54) in REC['elements'],'packageCoverageIodineXenon':None,'packageCoverageStatus':'UNVERIFIED: basis_set_exchange is not importable in the requested interpreter; no package coverage claim and no vendoring'}
if bse_available:
    import basis_set_exchange as bse
    cov={}
    for z in [53,54]:
        try:cov[str(z)]=str(z) in bse.get_basis('STO-3G',elements=[z])['elements']
        except Exception:cov[str(z)]=False
    coverage['packageCoverageIodineXenon']=cov;coverage['packageCoverageStatus']='MEASURED: package query only, no vendoring'
result={'status':'DRAFT research census; S4a production schema pending','date':'2026-10-07','numericTagging':'Every numeric measurement is tagged by row.numericStatus or its nearest containing status block. Atomic numbers, array indices, formula subscripts, charges and unit definitions are DERIVED identifiers/conventions. Version and date strings identify provenance. Null means unavailable; never a fabricated zero.','method':{'status':'MEASURED','pyscf':pyscf.__version__,'numpy':np.__version__,'threads':lib.num_threads(),'machine':platform.platform(),'cpu':next((l.split(":",1)[1].strip() for l in Path('/proc/cpuinfo').read_text().splitlines() if l.startswith('model name')),'unknown'),'basisSha256':hashlib.sha256((ROOT/'lab/vendor/bse/sto-3g-v1.json').read_bytes()).hexdigest(),'basis631Sha256':hashlib.sha256((ROOT/'lab/vendor/bse/6-31+g-star-v1.json').read_bytes()).hexdigest(),'cart':True,'scfConvTol':1e-13,'scfConvTolGrad':1e-10,'wallTiming':'Single fresh final RHF kernel call; excludes molecule build, geometry optimisation, stability probes. C60 uses frontier.py timing. Runs may share CPU with frontier solve or geometry preparation; wall times are observations, not isolated performance claims.'},'scope':{'presentEntries':len(META['molecules']),'presentCountStatus':'MEASURED','interpretation':'F5 names no extra DIATOMICS/HYDRIDES/ORGANIC roster; populate from present rows. Include every S4b name, S4c named molecule, conditional iodine/xenon candidate; carbonyls instantiated as Ni(CO)4, Fe(CO)5, Cr(CO)6, explicitly class representatives. Twenty amino acids and five nucleobases declared families; glycine merged once; original app groups preserved. A-T uses a published benchmark reference; the built G-C topology and constrained minimum remain unverified.','recordBytes':{'status':'DERIVED','formula':'8*(nAO*nAO+nAO+nAO)+2000','metadataBytes':2000,'why':'Full square float64 C, full epsilon and occupation vectors plus decimal 2 KB allowance. Decimal 2 KB is 2000 bytes, consistent with the read cache-budget plan. Explicit binary 2 KiB alternatives add 48 bytes per defined record. Early raw/app checkpoints used the binary allowance; census.json normalises estimates only, without changing measurements. Excludes JSON text expansion, names above allowance, response arrays, grids, transport overhead.'},'gate':'In census-input roster order (present app order first, then named candidates); unique Hill composition+charge AND newly introduced element/topgroup/fixed motif; OR declared family. Only passing rows seed novelty. Gate pass does not certify scientific readiness.','fixedMotifs':['ring:size','peptide bond','d-block','cluster','cage','nucleobase']},'basisCoverage':coverage,'costModel':{'status':'DERIVED','capMs':META['CAP_MS'],'model':META['COST'],'why':'Existing pre-N2-refit COST read only; predicts whole worker path including response, not this RHF-only timing. Over-budget uses the app 2 percent margin. Desktop/iPad measured live eligibility after S4a refit UNVERIFIED.'},'sections':sections,'totals':{'status':'DERIVED','rows':len(rows),'predictedStoBytes':sum(r['predictedRecordBytes'] or 0 for r in rows),'predictedSix31BytesWhereDefined':sum(r['predictedRecordBytes631'] or 0 for r in rows),'gatePass':sum(r['diversityGate']['pass'] for r in rows),'gateFail':sum(not r['diversityGate']['pass'] for r in rows),'basisBlocked':sum(bool(r.get('conditionalBasisBlocked')) for r in rows),'convergedRHF':sum(r['converged'] is True for r in rows),'unconvergedRHF':sum(r['converged'] is False for r in rows),'optimisationFailures':sum(r['optimise'] and not r['geometry'].get('optimisation',{}).get('converged',False) for r in rows),'gatePassStoBytes':sum((r['predictedRecordBytes'] or 0) for r in rows if r['diversityGate']['pass'])},'appSizingFiles':['app-alanine.json','app-Li4F4.json','app-TiCl4.json'],'rows':rows}
coverage['interpreterImportProofs']=[json.loads((OUT/name).read_text()) for name in ['bse-coverage-plain.json','bse-coverage-isolated.json']]
save(OUT/'census.json',result);log(json.dumps(result['totals']),flush=True)
