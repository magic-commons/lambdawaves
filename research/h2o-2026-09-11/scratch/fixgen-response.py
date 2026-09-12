# fixgen-response.py — tests/fixtures/h2o-response.json: the AO integrals, converged RHF and the RPA/TDA oracle
# for H2O/STO-3G at the ledger geometry, all from PySCF (external to lab/), plus the round-4 C_j column.
import json, hashlib, os, numpy as np
from pyscf import gto, scf, tdscf
from pinned import mol_from
HERE = os.path.dirname(os.path.abspath(__file__))
ANG = 1/0.52917721092
GEOM_ANG = [(8, (0.0, 0.0, 0.1173)), (1, (0.0, 0.7572, -0.4692)), (1, (0.0, -0.7572, -0.4692))]
O = np.array(GEOM_ANG[0][1])
atoms = [{'Z': 8, 'c': list(O*ANG)}]
for Z, c in GEOM_ANG[1:]:
    v = np.array(c) - O
    atoms.append({'Z': Z, 'c': list((O + v)*ANG)})
mol = mol_from(atoms)
mf = scf.RHF(mol).run(conv_tol=1e-13)
n = mol.nao_nr()
S = mol.intor('int1e_ovlp'); T = mol.intor('int1e_kin'); V = mol.intor('int1e_nuc')
eri = mol.intor('int2e')                                       # chemist (ij|kl)
R = mol.intor('int1e_r')                                       # <chi| r |chi>, position
orc = json.load(open(os.path.join(HERE, '..', 'oracle-h2o.json')))
Cj = json.load(open(os.path.join(HERE, 'gen3-Cj.json')))
out = {
 'provenance': {
   'written_by': 'research/h2o-2026-09-11/scratch/fixgen-response.py',
   'pyscf': __import__('pyscf').__version__,
   'basis': 'STO-3G, BSE v1 decimals (research/h2o-2026-09-11/sto-3g.bse.json)',
   'bse_sha256': hashlib.sha256(open(os.path.join(HERE, '..', 'sto-3g.bse.json'), 'rb').read()).hexdigest(),
   'ang_to_bohr': ANG,
   'integrals': "mol.intor int1e_ovlp/int1e_kin/int1e_nuc/int2e/int1e_r; h = T + V; eri row-major (((i n + j) n + k) n + l) = (ij|kl)",
   'rhf': 'scf.RHF(mol).run(conv_tol=1e-13); C[ao][mo] ascending, D = 2 sum_occ c c^T',
   'response': "tdscf.rhf.TDHF / TDA, singlet, nstates 10, conv_tol 1e-12 (identical to ../oracle-h2o.json)",
   'Cj': 'research/h2o-2026-09-11/scratch/gen3-Cj.json, ROUND 4 OPUS pred = -Im(l_j^dag D_M2 r_j)',
 },
 'ao_order': [l.strip() for l in mol.ao_labels()],
 'geometry': {'coords_bohr': [a['c'] for a in atoms], 'charges': [a['Z'] for a in atoms], 'Enuc': float(mol.energy_nuc())},
 'n': int(n), 'nocc': int(mol.nelectron//2), 'nElectrons': int(mol.nelectron),
 'S': [float(x) for x in S.ravel()],
 'T': [float(x) for x in T.ravel()],
 'V': [float(x) for x in V.ravel()],
 'h': [float(x) for x in (T+V).ravel()],
 'eri': [float(x) for x in eri.reshape(n, n, n, n).ravel()],
 'dipole': {q: [float(x) for x in R[i].ravel()] for i, q in enumerate('xyz')},
 'E': float(mf.e_tot),
 'eps': [float(x) for x in mf.mo_energy],
 'C': [float(x) for x in mf.mo_coeff.ravel()],          # C[ao*n + mo]
 'D': [float(x) for x in mf.make_rdm1().ravel()],
 'rpa': {'roots': orc['tdhf']['roots_au'], 'f': orc['tdhf']['oscillator_strength'],
         'mu': orc['tdhf']['transition_dipole_au']},
 'tda': {'roots': orc['tda']['roots_au'], 'f': orc['tda']['oscillator_strength'],
         'mu': orc['tda']['transition_dipole_au']},
 'Cj': [{'omega': c['w'], 'pred': c['pred'], 'magnus2': c['m2'], 'mmut': c['mmut']} for c in Cj],
}
# the fixture's own RPA/TDA must be this run's too, not only the round-2 file's
for name, cls in [('tda', tdscf.rhf.TDA), ('rpa', tdscf.rhf.TDHF)]:
    td = cls(mf); td.nstates = 10; td.singlet = True; td.conv_tol = 1e-12; td.max_cycle = 500; td.kernel()
    assert all(np.atleast_1d(td.converged)), name
    d = np.abs(np.array(td.e) - np.array(out[name]['roots'])).max()
    df = np.abs(np.array(td.oscillator_strength()) - np.array(out[name]['f'])).max()
    print('%s re-run vs oracle-h2o.json: max |dw| = %.2e  max |df| = %.2e' % (name, d, df))
    assert d < 1e-11 and df < 1e-10
print('E = %.12f  Enuc = %.12f  n = %d' % (mf.e_tot, mol.energy_nuc(), n))
print('ao_order', out['ao_order'])
json.dump(out, open(os.path.join(HERE, '..', '..', '..', 'tests', 'fixtures', 'h2o-response.json'), 'w'))
print('wrote tests/fixtures/h2o-response.json')
