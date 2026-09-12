# mol6.py — ROUND 4 · OPUS, B-H2O-2: the six pinned RHF/STO-3G energies on the BSE decimals, PySCF side.
# Exact Cartesian placement is printed in bohr for every atom, so the NH3 and CH4 records Sol left implicit are pinned.
import json, sys, numpy as np
from pyscf import scf
from pinned import mol_from
ANG = 1/0.52917721092
def nh3(r=1.012, ang=106.7):
    c2 = (2*np.cos(np.deg2rad(ang)) + 1)/3.0            # (3cos^2 b - 1)/2 = cos(HNH)
    cb, sb = np.sqrt(c2), np.sqrt(1-c2)
    at = [{'Z':7,'c':[0.0,0.0,0.0]}]
    for k in range(3):
        p = np.deg2rad(120.0*k)
        at.append({'Z':1,'c':[r*sb*np.cos(p), r*sb*np.sin(p), -r*cb]})
    return at, dict(beta_deg=float(np.rad2deg(np.arccos(cb))), cosHNH=float(np.cos(np.deg2rad(ang))))
def ch4(r=1.087):
    d = r/np.sqrt(3.0)
    at = [{'Z':6,'c':[0.0,0.0,0.0]}]
    for s in ((1,1,1),(1,-1,-1),(-1,1,-1),(-1,-1,1)): at.append({'Z':1,'c':[d*s[0],d*s[1],d*s[2]]})
    return at, dict(d_ang=float(d))
CASES = {
 'H2O':  ([{'Z':8,'c':[0,0,0.1173]},{'Z':1,'c':[0,0.7572,-0.4692]},{'Z':1,'c':[0,-0.7572,-0.4692]}], -74.963023162862, {}),
 'LiH':  ([{'Z':3,'c':[0,0,0]},{'Z':1,'c':[0,0,1.595]}],  -7.862023874015, {}),
 'HF':   ([{'Z':9,'c':[0,0,0]},{'Z':1,'c':[0,0,0.9168]}], -98.570757663478, {}),
 'NH3':  (nh3()[0], -55.454038544351, nh3()[1]),
 'CH4':  (ch4()[0], -39.726810112299, ch4()[1]),
 'N2':   ([{'Z':7,'c':[0,0,0]},{'Z':7,'c':[0,0,1.09768]}], -107.495887883412, {}),
}
out = {}
for name,(ang_atoms, pinned, extra) in CASES.items():
    atoms = [{'Z':a['Z'],'c':[float(x)*ANG for x in a['c']]} for a in ang_atoms]
    mol = mol_from(atoms)
    mf = scf.RHF(mol).run(conv_tol=1e-13, conv_tol_grad=1e-10)
    n = mol.nao_nr()
    out[name] = dict(atoms_bohr=[[a['Z']]+list(map(float,a['c'])) for a in atoms],
                     atoms_angstrom=[[a['Z']]+[float(x) for x in a['c']] for a in ang_atoms],
                     nao=int(n), nelec=int(mol.nelectron), Enuc=float(mol.energy_nuc()),
                     E=float(mf.e_tot), eps=[float(x) for x in mf.mo_energy], pinned=pinned,
                     converged=bool(mf.converged), extra=extra)
    print(f"{name:5s} nao={n:2d} nelec={mol.nelectron:2d} Enuc={mol.energy_nuc():18.12f} E={mf.e_tot:18.12f} "
          f"pinned={pinned:18.12f} delta={mf.e_tot-pinned:+.3e} conv={mf.converged}")
    for a in atoms: print(f"        Z={a['Z']} ({a['c'][0]:+.12f}, {a['c'][1]:+.12f}, {a['c'][2]:+.12f}) bohr")
json.dump(out, open('mol6-pyscf.json','w'), indent=1)
