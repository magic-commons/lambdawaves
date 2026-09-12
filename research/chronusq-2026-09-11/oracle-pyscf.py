#!/usr/bin/env python
"""Independent oracle for lab/scf.js, lab/density.js and lab/absorb.js — PySCF, same primitives as lab/gaussian.js.
Run: ~/miniforge3/envs/sci/bin/python research/chronusq-2026-09-11/oracle-pyscf.py  → oracle-pyscf.json beside it.
Imports no app code.  Exponents: STO-3G 1s at Slater ζ (α_i(ζ) = α_i(1.24) (ζ/1.24)²), H ζ = 1.24, He ζ = 2.0925 (Szabo–Ostlund)."""
import json, sys, numpy as np, pyscf
from pyscf import gto, scf, tdscf, fci, ao2mo

A124 = [3.42525091, 0.62391373, 0.16885540]; C = [0.15432897, 0.53532814, 0.44463454]
def sto3g(zeta):
    return [[0] + [[a * (zeta / 1.24) ** 2, c] for a, c in zip(A124, C)]]
def mol(atoms, basis, charge=0):
    m = gto.M(atom=atoms, basis=basis, charge=charge, unit='Bohr', verbose=0, symmetry=False); return m

out = {'pyscf': pyscf.__version__}
# H2 at R = 1.4: RHF, RPA (TDHF) singlet, TDA, FCI singlets
m = mol('H 0 0 -0.7; H 0 0 0.7', {'H': sto3g(1.24)}); mf = scf.RHF(m).run(conv_tol=1e-13)
td = tdscf.TDHF(mf); td.nstates = 1; td.singlet = True; td.kernel()
tda = tdscf.TDA(mf); tda.nstates = 1; tda.kernel()
cisolver = fci.FCI(mf); cisolver.nroots = 4; e_fci = cisolver.kernel()[0]
mo = mf.mo_coeff; h_mo = mo.T @ mf.get_hcore() @ mo; eri_mo = ao2mo.restore(1, ao2mo.kernel(m, mo), 2)
out['H2'] = {'R': 1.4, 'E_rhf': float(mf.e_tot), 'mo_energy': [float(x) for x in mf.mo_energy], 'omega_rpa': float(td.e[0]), 'omega_tda': float(tda.e[0]),
             'E_fci': [float(x) for x in e_fci], 'h_mo': h_mo.tolist(), 'gu_gu': float(eri_mo[0, 1, 0, 1]), 'gg_uu': float(eri_mo[0, 0, 1, 1]), 'gg_gg': float(eri_mo[0, 0, 0, 0]), 'uu_uu': float(eri_mo[1, 1, 1, 1])}
# HeH+ at R = 1.4632 (Szabo–Ostlund §3.5.2)
m2 = mol('He 0 0 0; H 0 0 1.4632', {'He': sto3g(2.0925), 'H': sto3g(1.24)}, charge=1); mf2 = scf.RHF(m2).run(conv_tol=1e-13)
S = m2.intor('int1e_ovlp'); D = mf2.make_rdm1()
out['HeH+'] = {'R': 1.4632, 'E_rhf': float(mf2.e_tot), 'E_elec': float(mf2.e_tot - m2.energy_nuc()), 'mo_energy': [float(x) for x in mf2.mo_energy], 'S_ab': float(S[0, 1]),
               'trDS': float(np.trace(D @ S)), 'dipole_z_electron': float(-np.einsum('ij,ji', D, m2.intor('int1e_r')[2]))}
json.dump(out, open(__file__.replace('.py', '.json'), 'w'), indent=1); print(json.dumps(out, indent=1))
