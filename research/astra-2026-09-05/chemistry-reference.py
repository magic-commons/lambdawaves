"""Independent small-molecule feasibility benchmarks. Not part of the browser runtime.
Requires PySCF, NumPy. Run with OMP_NUM_THREADS=2 for reproducible modest resource use.
Geometries are fixed inputs, not optimisations; energies include nuclear repulsion.
"""
import json, math, time
from pathlib import Path
import numpy as np
import pyscf
from pyscf import gto, scf, fci, lib
from pyscf.tools import molden

lib.num_threads(2)
root = Path(__file__).parent
rows = []
for distance in [0.74, 3.0]:
    mol = gto.M(atom=f'H 0 0 0; H 0 0 {distance}', basis='sto-3g', unit='Angstrom', verbose=0)
    mf = scf.RHF(mol).run(conv_tol=1e-12)
    efci, ci = fci.FCI(mf).kernel()
    rows.append(dict(molecule='H2',distanceAngstrom=distance,nao=mol.nao_nr(),electrons=mol.nelectron,
        rhf=float(mf.e_tot),fci=float(efci),rhfConverged=bool(mf.converged)))

atoms=[]
for element, radius in [('C',1.397),('H',1.397+1.08)]:
    atoms += [(element,(radius*math.cos(k*math.pi/3),radius*math.sin(k*math.pi/3),0)) for k in range(6)]
mol=gto.M(atom=atoms,basis='sto-3g',unit='Angstrom',verbose=0)
t=time.perf_counter()
mf=scf.RHF(mol).run(conv_tol=1e-11)
elapsed=time.perf_counter()-t
S=mf.get_ovlp();D=mf.make_rdm1();F=mf.get_fock(dm=D)
rows.append(dict(molecule='benzene',geometry='regular planar hexagon; C-C 1.397 A; C-H 1.080 A; not optimised',
    nao=mol.nao_nr(),electrons=mol.nelectron,occupiedSpatial=int(sum(mf.mo_occ>0)),rhf=float(mf.e_tot),
    rhfConverged=bool(mf.converged),seconds=elapsed,electronTrace=float(np.trace(D@S)),
    orthogonalityMax=float(abs(mf.mo_coeff.T@S@mf.mo_coeff-np.eye(mol.nao_nr())).max()),
    scfCommutatorMax=float(abs(F@D@S-S@D@F).max()),
    closedShellIdempotencyMax=float(abs(D@S@D-2*D).max()),
    warning='STO-3G RHF feasibility fixture, not accurate excitation or dissociation data'))
molden.from_scf(mf,str(root/'benzene-sto3g.molden'))
payload=dict(pyscf=pyscf.__version__,basis='sto-3g',energyUnit='hartree',threads=2,results=rows)
(root/'chemistry-reference.json').write_text(json.dumps(payload,indent=2)+'\n')
print(json.dumps(payload,indent=2))
