# fix-molecules.py -- THE LIBRARY'S ORACLE.  PySCF cart=True RHF for every entry of lab/molecules.js, on the
# VENDORED BSE STO-3G decimals (H-Kr, sha256 22ce59b9...), at the geometries lab/molecules.js pins -- appended to
# lab/oracles/sto-3g-v1.json under the key `library`.  Run:
#     ~/miniforge3/envs/sci/bin/python research/h2o-2026-09-11/scratch/fix-molecules.py
#
# ADDITIVE.  `molecules` (fix-mol6.py's six) and `molecules_extended` (fix-mol8.py's two) are read back and kept
# byte-for-byte; only `library`, `library_d_probe`, `library_alh3_scan` and a `library` provenance block are written.
#
# THE GEOMETRIES COME FROM lab/molecules.js AND NOWHERE ELSE.  This script shells out to node to dump the library,
# rather than re-deriving the Z-matrices in Python: two implementations of the same geometry is two geometries, and
# the whole point of a pinned structure is that there is one.  The dump carries the ANGSTROM arrays and the charges;
# the bohr conversion here uses the same 1/0.52917721092 that lab/md.js's ANGSTROM is.
#
# WHAT ELSE IT WRITES, and why each belongs here rather than in its own script:
#   `library_d_probe`      S, T, V and a selected ERI block for HBr and Br2 -- the two entries whose Br carries an
#                          angular_momentum [0, 1, 2] shell, so lab/md.js's shared-exponent s+p+d split can be held
#                          against PySCF to 1e-12 RELATIVE (V and the ERI on Br run to |500| and |1e3|, so an
#                          absolute 1e-12 is below the round-off of the reference itself and would be a false gate).
#   `library_alh3_scan`    monomeric AlH3 has no measured gas-phase structure, so lab/molecules.js uses THIS scan's
#                          RHF/STO-3G minimum and says so; the scan is here so the claim is checkable.
import json, os, hashlib, subprocess, sys
import numpy as np
from pyscf import gto, scf, ao2mo, tdscf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
ANG = 1 / 0.52917721092
NROOT = 5
RPA_MAX_AO = 20                                    # the roots are for the small entries only; 5 singlet RPA roots
SYM = {1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne', 11: 'Na', 12: 'Mg',
       13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar', 19: 'K', 20: 'Ca', 21: 'Sc', 22: 'Ti', 23: 'V',
       24: 'Cr', 25: 'Mn', 26: 'Fe', 27: 'Co', 28: 'Ni', 29: 'Cu', 30: 'Zn', 31: 'Ga', 32: 'Ge', 33: 'As',
       34: 'Se', 35: 'Br', 36: 'Kr'}

RAW = open(os.path.join(ROOT, 'lab', 'vendor', 'bse', 'sto-3g-v1.json'), 'rb').read()
REC, SHA = json.loads(RAW), hashlib.sha256(RAW).hexdigest()


def pinned_basis(zs):
    """the vendored record as a PySCF basis dict -- the DECIMALS, never PySCF's own internal table.
    A BSE shell with angular_momentum [0, 1, 2] (Br, Kr) is ONE exponent list and THREE coefficient columns, and
    becomes three PySCF shells over those same exponents -- exactly what lab/md.js's shellSpecs does."""
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


def library():
    """lab/molecules.js, dumped by node -- the single source of truth for every geometry and charge"""
    js = ('import("file://' + os.path.join(ROOT, 'lab', 'molecules.js') + '").then((M) => {'
          'console.log(JSON.stringify({ cap: M.CAP_ID, capMs: M.CAP_MS, cost: M.COST, rings: M.RING_RESIDUALS,'
          ' entries: M.MOLECULES.map((m) => ({ id: m.id, name: m.name, group: m.group, charge: m.charge,'
          ' ang: m.ang, source: m.source, nAO: m.nAO, nShell: m.nShell, nElectrons: m.nElectrons,'
          ' predictedMs: m.predictedMs, disabled: m.disabled, reason: m.reason })) }));'
          '}).catch((e) => { console.error(String(e)); process.exit(1); });')
    r = subprocess.run(['node', '--input-type=module', '-e', js], capture_output=True, text=True, cwd=ROOT)
    if r.returncode:
        sys.exit('cannot dump lab/molecules.js: ' + r.stderr)
    return json.loads(r.stdout)


def hessian_eigs(mol, mf):
    """lowest eigenvalues of the singlet orbital-rotation Hessian blocks A+B and A-B (as fix-mol6.py)"""
    mo, e = mf.mo_coeff, mf.mo_energy
    no = (mol.nelectron) // 2
    nv = mo.shape[1] - no
    if nv < 1:
        return {'n_ov': 0, 'lowest_A_plus_B': None, 'lowest_A_minus_B': None}
    o, v = mo[:, :no], mo[:, no:]
    g = ao2mo.general(mol, (o, v, o, v), compact=False).reshape(no, nv, no, nv)
    q = ao2mo.general(mol, (o, o, v, v), compact=False).reshape(no, no, nv, nv)
    d = np.zeros((no, nv, no, nv))
    for i in range(no):
        for a in range(nv):
            d[i, a, i, a] = e[no + a] - e[i]
    ib_ja = g.transpose(0, 3, 2, 1)
    ApB = (d + 4 * g - q.transpose(0, 2, 1, 3) - ib_ja).reshape(no * nv, no * nv)
    AmB = (d - q.transpose(0, 2, 1, 3) + ib_ja).reshape(no * nv, no * nv)
    lo = lambda M: float(np.linalg.eigvalsh(0.5 * (M + M.T))[0])
    return {'n_ov': no * nv, 'lowest_A_plus_B': lo(ApB), 'lowest_A_minus_B': lo(AmB)}


def rpa_roots(mf, n):
    """the first n singlet RPA (TDHF) roots with their oscillator strengths; None where the reference is a saddle"""
    try:
        td = tdscf.rhf.TDHF(mf)
        td.nstates = n; td.singlet = True; td.conv_tol = 1e-10; td.max_cycle = 500
        td.kernel()
        mu = np.asarray(td.transition_dipole())
        return {'roots_au': [float(x) for x in td.e[:n]],
                'oscillator_strength': [float(x) for x in np.asarray(td.oscillator_strength())[:n]],
                'transition_dipole_au': [[float(q) for q in row] for row in mu[:n]],
                'converged': bool(np.all(td.converged)) if td.converged is not None else None}
    except Exception as err:                       # a negative A-B has no real RPA solution; say so, do not fudge
        return {'refused': str(err)}


def build(entry):
    zs = sorted({int(a[0]) for a in entry['ang']})
    ab = [(int(a[0]), tuple(float(x) * ANG for x in a[1:])) for a in entry['ang']]
    mol = gto.M(atom=[[SYM[z], c] for z, c in ab], unit='Bohr', basis=pinned_basis(zs),
                cart=True, charge=entry['charge'], verbose=0)
    return mol, ab


def alh3_scan():
    """monomeric AlH3: r(Al-H) by an RHF/STO-3G scan of the planar D3h ring, since no measurement exists"""
    B = pinned_basis([1, 13])
    def E(r):
        at = [['Al', (0, 0, 0)]] + [['H', (r * np.cos(k * 2 * np.pi / 3), r * np.sin(k * 2 * np.pi / 3), 0.0)] for k in range(3)]
        return float(scf.RHF(gto.M(atom=at, unit='Angstrom', basis=B, cart=True, verbose=0)).run(conv_tol=1e-13).e_tot)
    rs = [round(1.45 + 0.02 * k, 3) for k in range(16)]
    es = [E(r) for r in rs]
    k = int(np.argmin(es))
    p = np.polyfit(rs[max(0, k - 2):k + 3], es[max(0, k - 2):k + 3], 2)
    rmin = float(-p[1] / (2 * p[0]))
    return {'grid_angstrom': rs, 'energies': es, 'r_min_angstrom': rmin, 'E_at_min': E(round(rmin, 4)),
            'method': 'RHF/STO-3G on the vendored decimals, cart=True, planar D3h, parabola through the three points about the grid minimum',
            'note': 'lab/molecules.js pins r = 1.4769 A from this scan and says it is NOT a measurement'}


def d_probe(lib):
    """S, T, V and a selected ERI block for the two entries with a [0, 1, 2] Br shell, for tests/md-style gating"""
    out = {}
    for eid in ('HBr', 'Br2'):
        e = next(x for x in lib['entries'] if x['id'] == eid)
        mol, ab = build(e)
        mf = scf.RHF(mol).run(conv_tol=1e-13, conv_tol_grad=1e-10)
        n = int(mol.nao_nr())
        labels = [l.strip() for l in mol.ao_labels()]
        d = [i for i, l in enumerate(labels) if 'd' in l.split()[-1]]
        sel = sorted(set([0, 1, 4] + d))[:9]       # a 1s, a 4s, a 2p and every d component: the quartets that matter
        eri = mol.intor('int2e')
        out[eid] = {'atoms_bohr': [[z] + list(c) for z, c in ab], 'nao': n, 'ao_labels': labels,
                    'S': mol.intor('int1e_ovlp').ravel().tolist(), 'T': mol.intor('int1e_kin').ravel().tolist(),
                    'V': mol.intor('int1e_nuc').ravel().tolist(),
                    'self_overlap_diag': np.diag(mol.intor('int1e_ovlp')).tolist(),
                    'eri_selected_indices': sel,
                    'eri_selected': eri[np.ix_(sel, sel, sel, sel)].ravel().tolist(),
                    'energy': float(mf.e_tot)}
        print('  d-probe %-4s nao=%2d  %d d components, %d selected indices' % (eid, n, len(d), len(sel)))
    return out


lib = library()
path = os.path.join(ROOT, 'lab', 'oracles', 'sto-3g-v1.json')
out = json.load(open(path))
assert out['provenance']['bse_sha256'] == SHA, 'the oracle names a different STO-3G record than lab/vendor has'
print('library: %d entries, cap %s (%d ms predicted)' % (len(lib['entries']), lib['cap'], lib['capMs']))

records = {}
for e in lib['entries']:
    mol, ab = build(e)
    mf = scf.RHF(mol).run(conv_tol=1e-13, conv_tol_grad=1e-10)
    nocc = (mol.nelectron) // 2
    rec = {'name': e['name'], 'group': e['group'], 'charge': e['charge'],
           'atoms_bohr': [[z] + list(c) for z, c in ab],
           'atoms_angstrom': [[int(a[0])] + [float(x) for x in a[1:]] for a in e['ang']],
           'nao': int(mol.nao_nr()), 'nelec': int(mol.nelectron), 'nocc': nocc,
           'Enuc': float(mol.energy_nuc()), 'energy': float(mf.e_tot), 'converged': bool(mf.converged),
           'orbital_energies': [float(x) for x in mf.mo_energy],
           'eps_homo': float(mf.mo_energy[nocc - 1]),
           'eps_lumo': float(mf.mo_energy[nocc]) if nocc < mol.nao_nr() else None,
           'dipole_au': [float(x) for x in mf.dip_moment(unit='AU', verbose=0)],
           'ao_labels': [l.strip() for l in mol.ao_labels()],
           'source': e['source'], 'predicted_ms': e['predictedMs'],
           'disabled': e['disabled'], 'disabled_reason': e['reason'],
           'stability_hessian': hessian_eigs(mol, mf)}
    if mol.nao_nr() <= RPA_MAX_AO:
        rec['rpa'] = rpa_roots(mf, NROOT)
    records[e['id']] = rec
    h = rec['stability_hessian']
    flag = '' if (h['lowest_A_plus_B'] or 0) > 0 and (h['lowest_A_minus_B'] or 0) > 0 else '   <-- NOT A MINIMUM'
    print('%-8s nao=%2d nelec=%2d q=%+d Enuc=%16.9f E=%18.9f conv=%s  A+B %11.3e  A-B %11.3e%s'
          % (e['id'], rec['nao'], rec['nelec'], rec['charge'], rec['Enuc'], rec['energy'],
             'y' if rec['converged'] else 'N', h['lowest_A_plus_B'] or float('nan'),
             h['lowest_A_minus_B'] or float('nan'), flag))
    if 'rpa' in rec and 'roots_au' in rec['rpa']:
        print('         RPA %s  f %s' % (' '.join('%.6f' % x for x in rec['rpa']['roots_au']),
                                         ' '.join('%.4f' % x for x in rec['rpa']['oscillator_strength'])))
    elif 'rpa' in rec:
        print('         RPA REFUSED: %s' % rec['rpa']['refused'][:110])

print('the AlH3 scan (no measured structure exists):')
scan = alh3_scan()
print('  r_min = %.5f A, E = %.9f' % (scan['r_min_angstrom'], scan['E_at_min']))
print('the d-shell probe (Br carries an angular_momentum [0, 1, 2] shell):')
probe = d_probe(lib)

out['library'] = records
out['library_alh3_scan'] = scan
out['library_d_probe'] = probe
out['provenance']['library'] = {
    'written_by': 'research/h2o-2026-09-11/scratch/fix-molecules.py',
    'pyscf': __import__('pyscf').__version__, 'numpy': np.__version__,
    'bse_sha256': SHA, 'bse_elements': 'H-Kr (1-36)', 'cart': True, 'unit': 'bohr', 'ang_to_bohr': ANG,
    'conv_tol': 1e-13, 'conv_tol_grad': 1e-10,
    'geometry_source': 'lab/molecules.js, dumped by node inside this script -- every geometry and charge comes from '
                       'there and from nowhere else; each record carries the entry\'s own `source` string verbatim',
    'geometry_role': 'experimental-fixed, except AlH3 (this repo\'s RHF/STO-3G scan, see library_alh3_scan) and the '
                     'stated idealisations inside individual `source` strings',
    'rpa': 'tdscf.rhf.TDHF, singlet, nstates %d, conv_tol 1e-10, for every entry with nao <= %d; `refused` where '
           'A - B is not positive definite (CuH and ZnH2 -- the RHF reference is not a minimum)' % (NROOT, RPA_MAX_AO),
    'cap': {'id': lib['cap'], 'predicted_ms': lib['capMs'], 'cost_model': lib['cost']},
    'ring_closure_residuals_angstrom': lib['rings'],
}
json.dump(out, open(path, 'w'), indent=1)
print('wrote %s -- %d in library, %d in library_d_probe' % (path, len(records), len(probe)))
