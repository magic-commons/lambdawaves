# fix-mol8.py — B-H2O-2's oracle, EXTENDED to eight: C2H4 and C6H6 on the same VENDORED BSE STO-3G decimals,
# at the geometries lab/chemview.js pins, with the first eight singlet RPA and TDA roots beside the ground state.
# ADDITIVE: the six records fix-mol6.py wrote are read back and kept byte-for-byte; only `molecules_extended`
# and an `appended` provenance block are written.  Run:  ~/miniforge3/envs/sci/bin/python fix-mol8.py
#
# WHY A SIBLING KEY AND NOT `molecules`.  tests/rhf-molecules.test.mjs:25 asserts the EXACT six-key list, and its
# per-molecule loop (line 71) runs moleculeRHF on every entry and holds each against `m.ledger_pin` -- so putting
# benzene in `molecules` both breaks that assertion and puts a 40-second McMurchie-Davidson integral pass inside a
# node unit test.  `molecules_extended` adds the two records to the same oracle file, with the same provenance and
# the same vendored decimals, and disturbs nothing that reads the six.
import json, os, hashlib, numpy as np
from pyscf import gto, scf, ao2mo, tdscf
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
SYM = {1: 'H', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F'}
ANG = 1/0.52917721092
RAW = open(os.path.join(ROOT, 'lab', 'vendor', 'bse', 'sto-3g-v1.json'), 'rb').read()
REC, SHA = json.loads(RAW), hashlib.sha256(RAW).hexdigest()
NROOT = 8

def pinned_basis(zs):
    """the vendored record as a PySCF basis dict — the DECIMALS, never PySCF's own internal table"""
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

def hessian_eigs(mol, mf):
    """lowest eigenvalues of the singlet orbital-rotation Hessian blocks A+B and A-B (as fix-mol6.py)"""
    mo, e = mf.mo_coeff, mf.mo_energy
    no = mol.nelectron//2; nv = mo.shape[1] - no
    o, v = mo[:, :no], mo[:, no:]
    g = ao2mo.general(mol, (o, v, o, v), compact=False).reshape(no, nv, no, nv)      # (ia|jb)
    q = ao2mo.general(mol, (o, o, v, v), compact=False).reshape(no, no, nv, nv)      # (ij|ab)
    d = np.zeros((no, nv, no, nv))
    for i in range(no):
        for a in range(nv): d[i, a, i, a] = e[no+a] - e[i]
    ib_ja = g.transpose(0, 3, 2, 1)
    ApB = (d + 4*g - q.transpose(0, 2, 1, 3) - ib_ja).reshape(no*nv, no*nv)
    AmB = (d - q.transpose(0, 2, 1, 3) + ib_ja).reshape(no*nv, no*nv)
    lo = lambda M: float(np.linalg.eigvalsh(0.5*(M + M.T))[0])
    return {'n_ov': no*nv, 'lowest_A_plus_B': lo(ApB), 'lowest_A_minus_B': lo(AmB)}

def response(mf, cls, n):
    td = cls(mf); td.nstates = n; td.singlet = True; td.conv_tol = 1e-12; td.max_cycle = 500; td.kernel()
    mu = np.asarray(td.transition_dipole())
    return {'roots_au': [float(x) for x in td.e[:n]],
            'oscillator_strength': [float(x) for x in np.asarray(td.oscillator_strength())[:n]],
            'transition_dipole_au': [[float(q) for q in row] for row in mu[:n]],
            'abs_mu_per_axis': [[abs(float(q)) for q in row] for row in mu[:n]],
            'converged': bool(np.all(td.converged)) if td.converged is not None else None}

def blocks(mol, mf):
    """the singlet A and B blocks in the occupied-virtual pair basis, and the MO dipoles <i|q|a> (Casida 1995)"""
    mo, e = mf.mo_coeff, mf.mo_energy
    no = mol.nelectron//2; nv = mo.shape[1] - no
    o, v = mo[:, :no], mo[:, no:]
    g = ao2mo.general(mol, (o, v, o, v), compact=False).reshape(no, nv, no, nv)      # (ia|jb)
    q = ao2mo.general(mol, (o, o, v, v), compact=False).reshape(no, no, nv, nv)      # (ij|ab)
    d = np.zeros((no, nv, no, nv))
    for i in range(no):
        for a in range(nv): d[i, a, i, a] = e[no+a] - e[i]
    A = (d + 2*g - q.transpose(0, 2, 1, 3)).reshape(no*nv, no*nv)
    B = (2*g - g.transpose(0, 3, 2, 1)).reshape(no*nv, no*nv)
    dip = mol.intor('int1e_r', comp=3)                                              # <chi_u| r |chi_w>, three components
    muMO = np.einsum('ui,quw,wa->qia', o, dip, v).reshape(3, no*nv)
    return 0.5*(A + A.T), 0.5*(B + B.T), muMO

def tda_dense(mol, mf, n):
    """TDA by DENSE diagonalisation of A.  Davidson is not reliable on benzene's degenerate TDA spectrum: with
    nstates 8, conv_tol 1e-12 and max_cycle 500 PySCF returned 0.0017 ... 0.0081 for the six lowest roots, which
    are residuals rather than eigenvalues.  A is 315 x 315 there — eigh is exact and costs milliseconds."""
    A, _B, muMO = blocks(mol, mf)
    w, X = np.linalg.eigh(A)
    mu = np.sqrt(2.0) * (muMO @ X)                                                  # mu_q(k) = sqrt2 sum_ia X_ia <i|q|a>
    f = (2.0/3.0) * w * np.sum(mu**2, axis=0)
    return {'roots_au': [float(x) for x in w[:n]],
            'oscillator_strength': [float(x) for x in f[:n]],
            'transition_dipole_au': [[float(mu[q, k]) for q in range(3)] for k in range(n)],
            'abs_mu_per_axis': [[abs(float(mu[q, k])) for q in range(3)] for k in range(n)],
            'method': 'dense eigh(A); Davidson is unreliable on a degenerate TDA spectrum', 'converged': True}

# ── the two geometries, EXACTLY as lab/chemview.js builds them (ångström, × ANG for bohr) ─────────────────────
def c2h4(r_cc=1.339, r_ch=1.087, hch=117.4):
    """D2h in the yz plane: C on the z axis, the HCH bisector at each C pointing away from the other C"""
    d = r_cc/2.0; h = np.deg2rad(hch/2.0)
    sy, sz = r_ch*np.sin(h), r_ch*np.cos(h)
    at = [(6, (0.0, 0.0, d)), (6, (0.0, 0.0, -d)),
          (1, (0.0, sy, d + sz)), (1, (0.0, -sy, d + sz)),
          (1, (0.0, sy, -d - sz)), (1, (0.0, -sy, -d - sz))]
    return at, {'geometry': 'D2h ethene, experimental-fixed', 'r_CC_angstrom': r_cc, 'r_CH_angstrom': r_ch,
                'angle_HCH_deg': hch, 'plane': 'yz', 'placement': 'C at (0,0,+-r_CC/2); each C-H at HCH/2 from the outward C-C axis'}

def c6h6(r_cc=1.39, r_ch=1.09):
    """D6h in the xy plane: carbons at angle k*pi/3 radius r_CC, hydrogens at the same angles, radius r_CC + r_CH"""
    rh = r_cc + r_ch
    at = []
    for k in range(6):
        t = k*np.pi/3.0
        at.append((6, (r_cc*np.cos(t), r_cc*np.sin(t), 0.0)))
        at.append((1, (rh*np.cos(t), rh*np.sin(t), 0.0)))
    return at, {'geometry': 'D6h benzene, experimental-fixed', 'r_CC_angstrom': r_cc, 'r_CH_angstrom': r_ch,
                'carbon_radius_angstrom': r_cc, 'hydrogen_radius_angstrom': rh, 'plane': 'xy',
                'placement': 'carbons at k*pi/3 radius 1.39; hydrogens at the same angles, radius 2.48'}

CASES = [('C2H4',) + c2h4(), ('C6H6',) + c6h6()]

path = os.path.join(ROOT, 'lab', 'oracles', 'sto-3g-v1.json')
out = json.load(open(path))
prov = out['provenance']
assert abs(prov['ang_to_bohr'] - ANG) < 1e-15, 'the record was written with a different ang_to_bohr'
assert prov['bse_sha256'] == SHA, 'the vendored STO-3G record has changed since the six were written'

for name, atoms_ang, extra in CASES:
    atoms_bohr = [(z, tuple(float(x)*ANG for x in c)) for z, c in atoms_ang]
    spec = [[SYM[z], c] for z, c in atoms_bohr]
    mol = gto.M(atom=spec, unit='Bohr', basis=pinned_basis(sorted({z for z, _ in atoms_ang})), cart=True, verbose=0)
    mf = scf.RHF(mol).run(conv_tol=1e-13, conv_tol_grad=1e-10)
    rec = {'atoms_bohr': [[z] + list(c) for z, c in atoms_bohr],
           'atoms_angstrom': [[z] + [float(x) for x in c] for z, c in atoms_ang],
           'nao': int(mol.nao_nr()), 'nelec': int(mol.nelectron), 'charge': 0,
           'Enuc': float(mol.energy_nuc()), 'energy': float(mf.e_tot),
           'orbital_energies': [float(x) for x in mf.mo_energy], 'converged': bool(mf.converged),
           'dipole_au': [float(x) for x in mf.dip_moment(unit='AU', verbose=0)],
           'ao_labels': [l.strip() for l in mol.ao_labels()], 'geometry': extra,
           'stability_hessian': hessian_eigs(mol, mf),
           'rpa': response(mf, tdscf.rhf.TDHF, NROOT),
           'tda': tda_dense(mol, mf, NROOT),
           'tda_davidson': response(mf, tdscf.rhf.TDA, NROOT)}
    nocc = mol.nelectron//2
    rec['eps_homo'] = float(mf.mo_energy[nocc-1]); rec['eps_lumo'] = float(mf.mo_energy[nocc])
    f = np.asarray(rec['rpa']['oscillator_strength']); k = int(np.argmax(f))
    rec['brightest_rpa'] = {'index': k, 'omega': rec['rpa']['roots_au'][k], 'f': float(f[k]),
                            'mu': rec['rpa']['transition_dipole_au'][k]}
    out.setdefault('molecules_extended', {})[name] = rec
    out['molecules'].pop(name, None)                    # idempotent: undo an earlier run that wrote into `molecules`
    print('%-5s nao=%2d nelec=%2d Enuc=%18.12f E=%18.12f  HOMO=%+.9f LUMO=%+.9f'
          % (name, mol.nao_nr(), mol.nelectron, mol.energy_nuc(), mf.e_tot, rec['eps_homo'], rec['eps_lumo']))
    print('      brightest RPA root %d: omega=%.9f  f=%.6f' % (k, rec['brightest_rpa']['omega'], rec['brightest_rpa']['f']))
    for i in range(NROOT):
        print('      %d  RPA %.9f  TDA %.9f  f %.6f  |mu| %s' % (i, rec['rpa']['roots_au'][i], rec['tda']['roots_au'][i],
              rec['rpa']['oscillator_strength'][i], np.array2string(np.array(rec['rpa']['abs_mu_per_axis'][i]), precision=6)))

prov['appended'] = {'written_by': 'research/h2o-2026-09-11/scratch/fix-mol8.py',
                    'molecules': [c[0] for c in CASES],
                    'response': 'RPA: tdscf.rhf.TDHF, singlet, nstates %d, conv_tol 1e-12.  TDA: DENSE eigh(A) -- PySCF\'s TDA Davidson returned residuals (0.0017...0.0081) for benzene\'s six lowest degenerate roots; `tda_davidson` keeps that unconverged reading for the record.' % NROOT,
                    'pyscf': __import__('pyscf').__version__, 'numpy': np.__version__,
                    'key': 'molecules_extended (NOT molecules: tests/rhf-molecules.test.mjs pins the six-key list and runs RHF on every entry of it)',
                    'note': 'the six records under `molecules` are fix-mol6.py\'s, unchanged; C2H4 and C6H6 carry rpa/tda blocks the six do not'}
json.dump(out, open(path, 'w'), indent=1)
print('wrote', path, '-', len(out['molecules']), 'in molecules,', len(out['molecules_extended']), 'in molecules_extended')
