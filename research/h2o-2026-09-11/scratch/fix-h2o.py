# fix-h2o.py — B-H2O-1 gates (b) and (d): PySCF integral fixtures for H2O on the VENDORED BSE decimals.
# Writes tests/fixtures/h2o-sto3g-integrals.json (every class, 7 AOs) and tests/fixtures/h2o-631pgs-cart.json
# (23 AOs: S, T, V, the d self-overlaps, 1296 selected ERI elements, RHF energy and eps).  cart=True throughout.
import json, os, hashlib, numpy as np
from pyscf import gto, scf
HERE = os.path.dirname(__file__)
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
SYM = {1: 'H', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F'}
ANG = 1/0.52917721092
H2O_ANG = [(8, (0.0, 0.0, 0.1173)), (1, (0.0, 0.7572, -0.4692)), (1, (0.0, -0.7572, -0.4692))]

def vendored(fname):
    p = os.path.join(ROOT, 'lab', 'vendor', 'bse', fname)
    raw = open(p, 'rb').read()
    return json.loads(raw), hashlib.sha256(raw).hexdigest()

def pinned_basis(rec, zs):
    """the record's decimal strings as a PySCF basis dict, SP shells split in column order"""
    out = {}
    for z in zs:
        shells = []
        for sh in rec['elements'][str(z)]['electron_shells']:
            e = [float(x) for x in sh['exponents']]
            for col, l in enumerate(sh['angular_momentum']):
                c = [float(x) for x in sh['coefficients'][col]]
                shells.append([l] + [[e[i], c[i]] for i in range(len(e))])
        out[SYM[z]] = shells
    return out

def build(rec, atoms_ang):
    spec = [[SYM[z], tuple(x*ANG for x in c)] for z, c in atoms_ang]
    zs = sorted({z for z, _ in atoms_ang})
    return gto.M(atom=spec, unit='Bohr', basis=pinned_basis(rec, zs), cart=True, verbose=0)

def coords_bohr(atoms_ang):
    return [[z] + [float(x*ANG) for x in c] for z, c in atoms_ang]

# ── STO-3G, 7 AOs: every class in full ────────────────────────────────────────────────────────────────────────
rec, sha = vendored('sto-3g-v1.json')
mol = build(rec, H2O_ANG); n = mol.nao_nr()
r = mol.intor('int1e_r').reshape(3, n, n)
out = {'provenance': {'written_by': 'research/h2o-2026-09-11/scratch/fix-h2o.py', 'pyscf': __import__('pyscf').__version__,
                      'numpy': np.__version__, 'basis': 'lab/vendor/bse/sto-3g-v1.json', 'bse_sha256': sha,
                      'cart': True, 'ang_to_bohr': ANG,
                      'geometry': 'ROUND 2 ledger H2O: O (0,0,0.1173), H (0,+-0.7572,-0.4692) angstrom',
                      'dipole_convention': 'M[q]_ab = <chi_a| q |chi_b>, position not -position (PySCF int1e_r)'},
       'n': n, 'ao_labels': [l.strip() for l in mol.ao_labels()], 'atoms_bohr': coords_bohr(H2O_ANG),
       'Enuc': float(mol.energy_nuc()),
       'S': mol.intor('int1e_ovlp').ravel().tolist(), 'T': mol.intor('int1e_kin').ravel().tolist(),
       'V': mol.intor('int1e_nuc').ravel().tolist(),
       'Mx': r[0].ravel().tolist(), 'My': r[1].ravel().tolist(), 'Mz': r[2].ravel().tolist(),
       'eri': mol.intor('int2e').ravel().tolist()}
mf = scf.RHF(mol).run(conv_tol=1e-13, conv_tol_grad=1e-10)
out['rhf'] = {'energy': float(mf.e_tot), 'orbital_energies': [float(x) for x in mf.mo_energy],
              'converged': bool(mf.converged), 'nelec': int(mol.nelectron)}
out['dipole_au'] = [float(x) for x in mf.dip_moment(unit='AU', verbose=0)]
p = os.path.join(ROOT, 'tests', 'fixtures', 'h2o-sto3g-integrals.json')
json.dump(out, open(p, 'w'))
print('STO-3G  n=%d  Enuc=%.12f  E=%.12f  eri=%d values -> %s' % (n, mol.energy_nuc(), mf.e_tot, n**4, p))

# ── 6-31+G*, 23 AOs: the l = 2 rung ───────────────────────────────────────────────────────────────────────────
rec2, sha2 = vendored('6-31+g-star-v1.json')
mol2 = build(rec2, H2O_ANG); m = mol2.nao_nr()
S2 = mol2.intor('int1e_ovlp')
sel = [0, 4, 13, 14, 18, 19]                                      # O 1s, O 2px, O 3dxx, O 3dxy, O 3dzz, H 1s
g2 = mol2.intor('int2e')
mf2 = scf.RHF(mol2).run(conv_tol=1e-13, conv_tol_grad=1e-10)
out2 = {'provenance': dict(out['provenance'], basis='lab/vendor/bse/6-31+g-star-v1.json', bse_sha256=sha2,
                           note='PySCF cart=True leaves Cartesian d components at 4pi/5 (xx,yy,zz) and 4pi/15 '
                                '(xy,xz,yz) self-overlap; md.js normalises every component to 1, so M_pyscf = Rd M Rd'),
        'n': m, 'ao_labels': [l.strip() for l in mol2.ao_labels()], 'atoms_bohr': coords_bohr(H2O_ANG),
        'Enuc': float(mol2.energy_nuc()), 'S': S2.ravel().tolist(),
        'T': mol2.intor('int1e_kin').ravel().tolist(), 'V': mol2.intor('int1e_nuc').ravel().tolist(),
        'self_overlap_diag': [float(x) for x in np.diag(S2)],
        'eri_selected_indices': sel,
        'eri_selected': [float(g2[i, j, k, l]) for i in sel for j in sel for k in sel for l in sel],
        'rhf': {'energy': float(mf2.e_tot), 'orbital_energies': [float(x) for x in mf2.mo_energy],
                'converged': bool(mf2.converged), 'nelec': int(mol2.nelectron)},
        'four_pi_over_5': float(4*np.pi/5), 'four_pi_over_15': float(4*np.pi/15)}
p2 = os.path.join(ROOT, 'tests', 'fixtures', 'h2o-631pgs-cart.json')
json.dump(out2, open(p2, 'w'))
print('6-31+G* n=%d  E=%.12f  d diag = %.9f / %.9f  (4pi/5 = %.9f, 4pi/15 = %.9f) -> %s'
      % (m, mf2.e_tot, S2[13, 13], S2[14, 14], 4*np.pi/5, 4*np.pi/15, p2))
