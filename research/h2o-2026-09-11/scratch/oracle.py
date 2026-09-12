# oracle.py — the independent PySCF oracle for H2O/STO-3G at the ledger geometry -> ../oracle-h2o.json
# Pinned primitives (the BSE decimals, not PySCF's 8-digit internal table); coordinates in bohr at 1/0.52917721092.
import json, hashlib, os, numpy as np
from pyscf import gto, scf, tdscf
from pinned import mol_from, pinned_basis
ANG = 1/0.52917721092
GEOM_ANG = [(8, (0.0, 0.0, 0.1173)), (1, (0.0, 0.7572, -0.4692)), (1, (0.0, -0.7572, -0.4692))]
def atoms_of(ds=0.0):
    O = np.array(GEOM_ANG[0][1]); out = [{'Z': 8, 'c': list(O*ANG)}]
    for Z, c in GEOM_ANG[1:]:
        v = np.array(c) - O; r = np.linalg.norm(v); out.append({'Z': Z, 'c': list((O + v*(r+ds)/r)*ANG)})
    return out
mol = mol_from(atoms_of(0.0))
mf = scf.RHF(mol).run(conv_tol=1e-13)
n = mol.nao_nr()
D = mf.make_rdm1()
r2 = mol.intor('int1e_r2')
pop, chg = mf.mulliken_pop(verbose=0)
out = {
 'provenance': {'written_by': 'research/h2o-2026-09-11/scratch/oracle.py (ROUND 2 OPUS)',
   'pyscf': __import__('pyscf').__version__, 'basis': 'STO-3G, BSE version 1 decimals (research/h2o-2026-09-11/sto-3g.bse.json)',
   'bse_sha256': hashlib.sha256(open(os.path.join(os.path.dirname(__file__),'..','sto-3g.bse.json'),'rb').read()).hexdigest(),
   'ang_to_bohr': ANG, 'note': 'PySCF internal sto-3g is truncated to 8 significant digits; this run uses the BSE decimals'},
 'geometry': {'unit_angstrom': [[z, list(c)] for z, c in GEOM_ANG], 'coords_bohr': [a['c'] for a in atoms_of(0.0)],
   'charges': [a['Z'] for a in atoms_of(0.0)], 'Enuc': float(mol.energy_nuc())},
 'ao_order': [l.strip() for l in mol.ao_labels()],
 'rhf': {'energy': float(mf.e_tot), 'electronic': float(mf.e_tot - mol.energy_nuc()),
   'orbital_energies': [float(x) for x in mf.mo_energy],
   'C': [[float(mf.mo_coeff[i, j]) for j in range(n)] for i in range(n)],
   'C_layout': 'C[ao][mo], AO order as ao_order, MOs ascending in energy', 'nocc': int(mol.nelectron//2)},
 'properties': {'dipole_au': [float(x) for x in mf.dip_moment(unit='AU', verbose=0)],
   'dipole_debye': [float(x) for x in mf.dip_moment(unit='Debye', verbose=0)],
   'r2_electronic_au': float(np.einsum('ij,ji->', D, r2)),
   'mulliken_charges': [float(x) for x in chg], 'mulliken_pop_per_ao': [float(x) for x in pop]},
}
for name, cls in [('tda', tdscf.rhf.TDA), ('tdhf', tdscf.rhf.TDHF)]:
    td = cls(mf); td.nstates = 10; td.singlet = True; td.conv_tol = 1e-12; td.max_cycle = 500; td.kernel()
    tdip = td.transition_dipole()
    out[name] = {'converged': [bool(x) for x in np.atleast_1d(td.converged)],
      'roots_au': [float(x) for x in td.e], 'oscillator_strength': [float(x) for x in td.oscillator_strength()],
      'transition_dipole_au': [[float(v) for v in row] for row in tdip]}
disp = {}
for ds in (+0.05, -0.05):
    m2 = mol_from(atoms_of(ds)); f2 = scf.RHF(m2).run(conv_tol=1e-13)
    disp[f'{ds:+.2f}'] = {'energy': float(f2.e_tot), 'Enuc': float(m2.energy_nuc()),
      'coords_bohr': [a['c'] for a in atoms_of(ds)], 'note': 'both O-H bonds stretched by this many angstrom, angle fixed'}
out['displaced_symmetric_OH_stretch'] = disp
dE = disp['+0.05']['energy'] - disp['-0.05']['energy']
out['displaced_symmetric_OH_stretch']['central_dEdR_au_per_bohr'] = float(dE/(2*0.05*ANG))
json.dump(out, open(os.path.join(os.path.dirname(__file__),'..','oracle-h2o.json'),'w'), indent=1)
print('E(RHF) = %.12f  Enuc = %.12f' % (mf.e_tot, mol.energy_nuc()))
print('eps =', ' '.join('%.6f' % x for x in mf.mo_energy))
print('dipole a.u. =', ' '.join('%.8f' % x for x in out['properties']['dipole_au']), ' |mu| = %.8f' % np.linalg.norm(out['properties']['dipole_au']))
print('<r2> elec =', '%.8f' % out['properties']['r2_electronic_au'], ' Mulliken q =', ' '.join('%.6f' % x for x in chg))
for name in ('tda','tdhf'):
    print(name.upper(), 'conv', all(out[name]['converged']))
    for i,(e,f,td_) in enumerate(zip(out[name]['roots_au'], out[name]['oscillator_strength'], out[name]['transition_dipole_au'])):
        print('  %2d  w=%.9f  f=%.6f  mu=(%+.6f,%+.6f,%+.6f)' % (i+1, e, f, *td_))
print('E(+0.05) = %.12f  E(-0.05) = %.12f  dE/dR = %+.9f' % (disp['+0.05']['energy'], disp['-0.05']['energy'], out['displaced_symmetric_OH_stretch']['central_dEdR_au_per_bohr']))
