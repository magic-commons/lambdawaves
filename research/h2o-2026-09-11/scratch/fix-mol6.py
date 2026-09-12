# fix-mol6.py — B-H2O-2's oracle: the six pinned RHF/STO-3G fixtures on the VENDORED BSE decimals, in bohr.
# Geometries are ROUND 4 · OPUS §5's placements, bit-for-bit as scratch/mol6.py built them.  Writes lab/oracles/sto-3g-v1.json.
import json, os, hashlib, numpy as np
from pyscf import gto, scf, ao2mo
HERE = os.path.dirname(__file__)
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
SYM = {1: 'H', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F'}
ANG = 1/0.52917721092
RAW = open(os.path.join(ROOT, 'lab', 'vendor', 'bse', 'sto-3g-v1.json'), 'rb').read()
REC, SHA = json.loads(RAW), hashlib.sha256(RAW).hexdigest()

def pinned_basis(zs):
    out = {}
    for z in zs:
        shells = []
        for sh in REC['elements'][str(z)]['electron_shells']:
            e = [float(x) for x in sh['exponents']]
            for col, l in enumerate(sh['angular_momentum']):
                c = [float(x) for x in sh['coefficients'][col]]
                shells.append([l] + [[e[i], c[i]] for i in range(len(e))])
        out[SYM[z]] = shells
    return out

def nh3(r=1.012, ang=106.7):
    c2 = (2*np.cos(np.deg2rad(ang)) + 1)/3.0                     # (3cos^2 b - 1)/2 = cos(HNH)
    cb, sb = np.sqrt(c2), np.sqrt(1-c2)
    at = [(7, (0.0, 0.0, 0.0))]
    for k in range(3):
        p = np.deg2rad(120.0*k)
        at.append((1, (r*sb*np.cos(p), r*sb*np.sin(p), -r*cb)))
    return at, {'r_NH_angstrom': r, 'angle_HNH_deg': ang, 'beta_deg': float(np.rad2deg(np.arccos(cb)))}

def ch4(r=1.087):
    d = r/np.sqrt(3.0)
    at = [(6, (0.0, 0.0, 0.0))]
    for s in ((1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)): at.append((1, (d*s[0], d*s[1], d*s[2])))
    return at, {'r_CH_angstrom': r, 'd_angstrom': float(d), 'd_bohr': float(d*ANG)}

def hessian_eigs(mol, mf):
    """lowest eigenvalues of the singlet orbital-rotation Hessian blocks A+B (real RHF->RHF stability) and A-B.
    A_ia,jb = d_ij d_ab (e_a - e_i) + 2(ia|jb) - (ij|ab),  B_ia,jb = 2(ia|jb) - (ib|ja)."""
    mo, e = mf.mo_coeff, mf.mo_energy
    no = mol.nelectron//2; nv = mo.shape[1] - no
    o, v = mo[:, :no], mo[:, no:]
    g = ao2mo.general(mol, (o, v, o, v), compact=False).reshape(no, nv, no, nv)      # (ia|jb)
    q = ao2mo.general(mol, (o, o, v, v), compact=False).reshape(no, no, nv, nv)      # (ij|ab)
    d = np.zeros((no, nv, no, nv))
    for i in range(no):
        for a in range(nv): d[i, a, i, a] = e[no+a] - e[i]
    ib_ja = g.transpose(0, 3, 2, 1)                                                 # (ib|ja)
    ApB = (d + 4*g - q.transpose(0, 2, 1, 3) - ib_ja).reshape(no*nv, no*nv)
    AmB = (d - q.transpose(0, 2, 1, 3) + ib_ja).reshape(no*nv, no*nv)
    lo = lambda M: float(np.linalg.eigvalsh(0.5*(M + M.T))[0])
    return {'n_ov': no*nv, 'lowest_A_plus_B': lo(ApB), 'lowest_A_minus_B': lo(AmB)}

CASES = [
  ('H2O', [(8, (0, 0, 0.1173)), (1, (0, 0.7572, -0.4692)), (1, (0, -0.7572, -0.4692))], -74.963023162862,
   {'geometry': 'ROUND 2 ledger H2O, experimental-fixed', 'r_OH_angstrom': 0.957775595, 'angle_HOH_deg': 104.4798388}),
  ('LiH', [(3, (0, 0, 0)), (1, (0, 0, 1.595))], -7.862023874015, {'r_angstrom': 1.595}),
  ('HF',  [(9, (0, 0, 0)), (1, (0, 0, 0.9168))], -98.570757663478, {'r_angstrom': 0.9168}),
  ('NH3', nh3()[0], -55.454038544351, nh3()[1]),
  ('CH4', ch4()[0], -39.726810112299, ch4()[1]),
  ('N2',  [(7, (0, 0, 0)), (7, (0, 0, 1.09768))], -107.495887883412, {'r_angstrom': 1.09768}),
]
out = {'provenance': {'written_by': 'research/h2o-2026-09-11/scratch/fix-mol6.py',
                      'pyscf': __import__('pyscf').__version__, 'numpy': np.__version__,
                      'basis': 'lab/vendor/bse/sto-3g-v1.json', 'bse_sha256': SHA, 'bse_version': '1',
                      'cart': True, 'unit': 'bohr', 'ang_to_bohr': ANG,
                      'geometry_role': 'experimental-fixed', 'conv_tol': 1e-13,
                      'dipole_convention': 'sum_A Z_A R_A - Tr(D M), M_ab = <a|q|b>; PySCF dip_moment(unit=AU)',
                      'placements': 'ROUND 4 OPUS section 5: NH3 beta from cos^2 b = (2 cos HNH + 1)/3; CH4 d = r/sqrt(3)'},
       'molecules': {}}
for name, atoms_ang, pin, extra in CASES:
    atoms_bohr = [(z, tuple(float(x)*ANG for x in c)) for z, c in atoms_ang]
    spec = [[SYM[z], c] for z, c in atoms_bohr]
    mol = gto.M(atom=spec, unit='Bohr', basis=pinned_basis(sorted({z for z, _ in atoms_ang})), cart=True, verbose=0)
    mf = scf.RHF(mol).run(conv_tol=1e-13, conv_tol_grad=1e-10)
    rec = {'atoms_bohr': [[z] + list(c) for z, c in atoms_bohr],
           'atoms_angstrom': [[z] + [float(x) for x in c] for z, c in atoms_ang],
           'nao': int(mol.nao_nr()), 'nelec': int(mol.nelectron), 'charge': 0,
           'Enuc': float(mol.energy_nuc()), 'energy': float(mf.e_tot), 'ledger_pin': pin,
           'orbital_energies': [float(x) for x in mf.mo_energy], 'converged': bool(mf.converged),
           'dipole_au': [float(x) for x in mf.dip_moment(unit='AU', verbose=0)],
           'ao_labels': [l.strip() for l in mol.ao_labels()], 'geometry': extra,
           'stability_hessian': hessian_eigs(mol, mf)}
    if name == 'N2':                                                # the second aufbau RHF solution, ROUND 4 section 5
        mh = scf.RHF(mol); mh.init_guess = 'hcore'; mh.run(conv_tol=1e-13, conv_tol_grad=1e-10)
        rec['second_solution'] = {'name': 'core-guess second aufbau RHF solution',
                                  'guess': 'core', 'pyscf_init_guess': 'hcore', 'energy': float(mh.e_tot),
                                  'ledger_pin': -106.766097415129, 'converged': bool(mh.converged),
                                  'orbital_energies': [float(x) for x in mh.mo_energy],
                                  'stability_hessian': hessian_eigs(mol, mh),
                                  'note': 'aufbau-obeying, Tr(DS) = 14, pi_u degeneracy broken; 0.7298 hartree above the ground state'}
    out['molecules'][name] = rec
    print('%-4s nao=%2d nelec=%2d Enuc=%18.12f E=%18.12f pin delta=%+.3e dip=%s'
          % (name, mol.nao_nr(), mol.nelectron, mol.energy_nuc(), mf.e_tot, mf.e_tot - pin,
             np.array2string(np.array(rec['dipole_au']), precision=9)))
    print('      Hessian: lowest A+B = %+.9f  lowest A-B = %+.9f  (n_ov = %d)'
          % (rec['stability_hessian']['lowest_A_plus_B'], rec['stability_hessian']['lowest_A_minus_B'], rec['stability_hessian']['n_ov']))
    if name == 'N2':
        h = rec['second_solution']['stability_hessian']
        print('      second solution Hessian: lowest A+B = %+.9f  lowest A-B = %+.9f' % (h['lowest_A_plus_B'], h['lowest_A_minus_B']))
p = os.path.join(ROOT, 'lab', 'oracles', 'sto-3g-v1.json')
json.dump(out, open(p, 'w'), indent=1)
print('wrote', p)
print('NH3 H1 bohr', out['molecules']['NH3']['atoms_bohr'][1], ' CH4 d bohr', out['molecules']['CH4']['geometry']['d_bohr'])
print('N2 second solution', out['molecules']['N2']['second_solution']['energy'])
