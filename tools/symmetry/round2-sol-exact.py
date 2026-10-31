#!/usr/bin/env python
"""Exact ring arithmetic, C60 geometry, and bounded-memory direct RHF; lab is read-only.
~/bin/scipython -I tools/symmetry/round2-sol-exact.py --out tools/library/census/round2-sol-exact.json
"""
import argparse
import json
import math
import resource
import time
from pathlib import Path
import numpy as np
import sympy as s
import pyscf
from pyscf import gto, scf, lib
parser = argparse.ArgumentParser()
parser.add_argument('--out', required=True)
parser.add_argument('--algebra-only', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
dest = root / args.out
assert str(dest).startswith(str(root / 'research/release-0.4.0/measure'))
assert not dest.exists()
lib.num_threads(2)
result = {'date': '2026-10-07', 'sympy': s.__version__, 'pyscf': pyscf.__version__, 'threads': lib.num_threads()}
rings = {}
for n in [5, 6, 10]:
    f = s.symbols(f'f0:{n//2+1}')
    ov = s.symbols(f's0:{n//2+1}')
    x = s.symbols('x')
    coeffs = []
    fs, ss = [], []
    for k in range(n//2+1):
        co = [s.Integer(1)] + [s.simplify(2*s.cos(2*s.pi*k*j/n)) for j in range(1, (n+1)//2)]
        if n % 2 == 0:
            co += [s.Integer((-1)**k)]
        coeffs.append([str(v) for v in co])
        fs.append(sum(a*b for a,b in zip(co,f)))
        ss.append(sum(a*b for a,b in zip(co,ov)))
    # Check every Fourier vector symbolically, including paired partners; no numeric roots of unity.
    F = s.Matrix(n,n,lambda i,j:f[min((i-j)%n,(j-i)%n)])
    S = s.Matrix(n,n,lambda i,j:ov[min((i-j)%n,(j-i)%n)])
    residual = []
    zeta = s.symbols('zeta')
    modulus = s.cyclotomic_poly(n,zeta)
    for k in range(n):
        v = s.Matrix([zeta**((k*j)%n) for j in range(n)])
        ff = sum(F[0,j]*v[j] for j in range(n))
        sf = sum(S[0,j]*v[j] for j in range(n))
        r = F*v-ff*v
        rS = S*v-sf*v
        residual.extend([s.rem(s.expand(z),modulus,zeta) for z in list(r)+list(rS)])
    assert all(v == 0 for v in residual)
    rings[str(n)] = {'coefficientRows':coeffs, 'multiplicities':[1]+[2]*((n-1)//2)+([1] if n%2==0 else []),
                    'symbolicResidualEntries':len(residual),'nonzeroResidualEntries':0,
                    'numerators':[str(v) for v in fs],'denominators':[str(v) for v in ss]}
result['rings'] = rings
result['blockCirculantCounterexample'] = {'sites':6,'functionsPerSite':2,'onSiteBlock':[[0,1],[1,1]],
                                        'eigenvalues':[str(x) for x in s.Matrix([[0,1],[1,1]]).eigenvals()]}
result['primitiveSelfERI'] = {'alpha':1,'boysAtZero':'F_m(0)=1/(2*m+1)',
                             'normalisedSSSS':'2/sqrt(pi)','value':float(2/s.sqrt(s.pi)),
                             'fourDFTCoefficient':'1/n**2'}
# Frobenius reciprocity for the permutation representation Ind_Cs^Ih 1.
atom_irreps=[]
for label,d,t in [('A',1,1),('T1',3,-1),('T2',3,-1),('G',4,0),('H',5,1)]:
    for par in [1,-1]:
        atom_irreps.append({'irrep':label+('g' if par==1 else 'u'),'dimension':d,'multiplicity':(d+par*t)//2})
assert sum(v['dimension']*v['multiplicity'] for v in atom_irreps)==60
result['c60AtomRepresentation']={'irreps':atom_irreps,'commutantDimension':sum(v['multiplicity']**2 for v in atom_irreps),
                                 'sumMultiplicities':sum(v['multiplicity'] for v in atom_irreps)}
# Truncate the icosahedron: the 30 edges give 60 directed-edge vertices.
phi=(1+math.sqrt(5))/2
ico=[]
for a in [-1,1]:
    for b in [-phi,phi]:
        ico.extend([(0,a,b),(b,0,a),(a,b,0)])
ico=np.array(ico)
verts=[]
for i,u in enumerate(ico):
    for j,v in enumerate(ico):
        if i!=j and abs(np.linalg.norm(u-v)-2)<1e-10:
            verts.append((2*u+v)/3*2.1) # Both edge kinds are 1.4 Angstrom.
verts=np.array(verts)
assert verts.shape==(60,3)
dist=np.linalg.norm(verts[:,None]-verts[None,:],axis=2)
adj=(abs(dist-1.4)<1e-9).astype(int)
assert np.all(adj.sum(axis=1)==3)
record=json.loads((root/'lab/vendor/bse/sto-3g-v1.json').read_text())
basis=[]
for sh in record['elements']['6']['electron_shells']:
    for col,l in enumerate(sh['angular_momentum']):
        basis.append([l]+[[float(e),float(sh['coefficients'][col][i])] for i,e in enumerate(sh['exponents'])])
mol=gto.M(atom=[('C',tuple(v)) for v in verts],unit='Angstrom',basis={'C':basis},cart=True,symmetry=True,verbose=0,max_memory=128)
assert mol.nao_nr()==300
if args.algebra_only:
    result['c60GeometryBuild']={'nao':mol.nao_nr(),'topgroup':mol.topgroup,'groupname':mol.groupname,'coordinatesAngstrom':verts.tolist()}
    with dest.open('x') as f:
        json.dump(result,f,indent=2)
        f.write('\n')
    print(json.dumps({'rings':rings,'c60AtomRepresentation':result['c60AtomRepresentation'],'c60GeometryBuild':{'nao':300,'topgroup':mol.topgroup,'groupname':mol.groupname}}))
    raise SystemExit(0)
mf=scf.RHF(mol)
mf.max_memory=128
mf.chkfile=None
mf.max_cycle=60
mf.conv_tol=1e-10
mf.conv_tol_grad=1e-7
mf.direct_scf_tol=1e-13
start=time.perf_counter()
energy=mf.kernel()
result['directC60']={'geometry':'ideal truncated icosahedron, both C-C edge kinds 1.400 Angstrom; feasibility fixture, not a library record',
                     'nao':mol.nao_nr(),'nocc':mol.nelectron//2,'topgroup':mol.topgroup,'groupname':mol.groupname,
                     'maxMemoryMB':mf.max_memory,'directScf':mf.direct_scf,'eriIsNone':mf._eri is None,
                     'converged':bool(mf.converged),'cycles':mf.cycles,'energyEh':float(energy),
                     'solveSeconds':time.perf_counter()-start,'processPeakRssKiB':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                     'homoLumoGapEh':float(mf.mo_energy[180]-mf.mo_energy[179]),
                     'coefficientsBytes':mf.mo_coeff.nbytes,'occupiedDensityBytes':300*300*8,
                     'coordinatesAngstrom':verts.tolist()}
with dest.open('x') as f:
    json.dump(result,f,indent=2)
    f.write('\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['rings']},default=str))
