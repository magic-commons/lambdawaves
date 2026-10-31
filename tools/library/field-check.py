#!/usr/bin/env python
"""Independent PySCF CPU signed-field samples from the exported coefficient record."""
import json,math
from pathlib import Path
import numpy as np
from pyscf import gto,lib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'tools/library/census'
lib.num_threads(2);front=json.loads((OUT/'c60-frontier.json').read_text());rec=json.loads((ROOT/'lab/vendor/bse/sto-3g-v1.json').read_text())
basis=[[l]+[[float(e),float(sh['coefficients'][col][k])] for k,e in enumerate(sh['exponents'])] for sh in rec['elements']['6']['electron_shells'] for col,l in enumerate(sh['angular_momentum'])]
mol=gto.M(atom=[('C',tuple(a[1:])) for a in front['geometry']['atomsAngstrom']],basis={'C':basis},unit='Angstrom',cart=True,verbose=0)
perm=np.array(front['aoConversion']['permutationAppToPySCF']);scale=np.array(front['aoConversion']['rowScalePySCFToApp']);C=np.array(front['frontier']['HOMO']['coefficientColumns']+front['frontier']['LUMO']['coefficientColumns']).T;CP=np.zeros_like(C);CP[perm]=C/scale[:,None]
points=np.random.default_rng(6040706).uniform(-9,9,(80,3));points=np.vstack([points,mol.atom_coords()[::5]+np.array([.13,.24,.35])])
ao=mol.eval_gto('GTOval_cart',points);values=ao@CP
result={'status':'MEASURED','meaning':'Independent libcint Cartesian AO evaluation at fixed Bohr points, signed frontier orbital values; indices/counts/points DERIVED, values MEASURED','pointsBohr':points.tolist(),'orbitalIndices':front['frontier']['HOMO']['indices']+front['frontier']['LUMO']['indices'],'signedValues':values.tolist(),'source':'c60-frontier.json coefficients mapped back into PySCF; GTOval_cart; no fresh SCF','tolerance':1e-10}
with (OUT/'c60-pyscf-samples.json').open('x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
