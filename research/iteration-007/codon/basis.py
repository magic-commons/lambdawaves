"""research/iteration-007/codon/basis.py — the pipeline's own rungs (tools/volumes/lwbasis.py: the vendored BSE decimals, cart=True,
every AO kept) on the codon geometries: nAO, electrons, occupied orbitals, λmin(S) against solve.py's SMIN_REFUSE = 1e-9. NO SCF.

  OMP_NUM_THREADS=4 nice -n 19 python -I basis.py [--smin] name[,name] ...      (writes basis.json beside itself)
"""
import sys, json, time
from pathlib import Path
import numpy as np
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / 'tools/volumes'))
from lwbasis import LADDER, record, coverage, pyscf_basis, nao_cart, SYMBOL
from pyscf import gto
SMIN_REFUSE = 1e-9
Z = {s: i for i, s in enumerate(SYMBOL)}

def load(name):
    L = (HERE / f'{name}.xyz').read_text().splitlines()
    q = int(L[1].split()[0].split('=')[1])
    atoms = [(l.split()[0], tuple(map(float, l.split()[1:4]))) for l in L[2:2 + int(L[0])]]
    return atoms, q

out = json.loads((HERE / 'basis.json').read_text()) if (HERE / 'basis.json').exists() else {}
smin = '--smin' in sys.argv
for name in [n for a in sys.argv[1:] if not a.startswith('--') for n in a.split(',')]:
    atoms, q = load(name); zs = [Z[e] for e, _ in atoms]
    ne = sum(zs) - q
    row = out.setdefault(name, {})
    row.update({'atoms': len(atoms), 'heavy': sum(1 for e, _ in atoms if e != 'H'), 'H': sum(1 for e, _ in atoms if e == 'H'),
                'charge': q, 'electrons': ne, 'closedShell': ne % 2 == 0, 'nOcc': ne // 2})   # contacts: contacts.py
    rungs = row.setdefault('rungs', {})
    for b in LADDER:
        rec = record(b)[0]; why = coverage(rec, zs)
        if why: rungs[b] = {'skip': why}; continue
        n = nao_cart(rec, zs); r = rungs.setdefault(b, {})
        r.update({'nAO': n, 'nOcc': ne // 2, 'nVirt': n - ne // 2, 'MB_f64_nAO2': round(8 * n * n / 2**20, 1), 'MB_f32_nAO2': round(4 * n * n / 2**20, 1)})
        if smin and 'minEigS' not in r:
            mol = gto.M(atom=atoms, unit='Angstrom', basis=pyscf_basis(rec, zs), cart=True, charge=q, spin=0, verbose=0)
            assert mol.nao_nr() == n
            t = time.perf_counter(); S = mol.intor('int1e_ovlp'); t1 = time.perf_counter()
            w = np.linalg.eigvalsh(S); t2 = time.perf_counter(); del S
            r.update({'minEigS': float(w[0]), 'cond': float(w[-1] / w[0]), 'nBelow1e-6': int((w < 1e-6).sum()), 'nBelow1e-9': int((w < 1e-9).sum()),
                      'refused': bool(w[0] < SMIN_REFUSE), 'secondsOverlap': round(t1 - t, 1), 'secondsEigh': round(t2 - t1, 1)})
        print(f'{name:18s} {b:12s} nAO {n:5d} nOcc {ne // 2:4d}' + (f"  λmin(S) {r['minEigS']:.3e}  {'REFUSED' if r['refused'] else 'ok'}  ({r['secondsEigh']} s)" if 'minEigS' in r else ''), flush=True)
    (HERE / 'basis.json').write_text(json.dumps(out, indent=1))
    print(name, {k: v for k, v in row.items() if k != 'rungs'}, flush=True)
