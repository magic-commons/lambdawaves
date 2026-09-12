# fixgen-field.py — tests/fixtures/h2o-field.json: the normalised contracted shell list for H2O/STO-3G plus every
# density number B-H2O-4 gates, each computed by PySCF (mol.eval_gto / dft.numint.eval_rho) at the same points.
import json, hashlib, os, numpy as np
from pyscf import gto, scf, dft
from pinned import mol_from
HERE = os.path.dirname(os.path.abspath(__file__))
ANG = 1/0.52917721092
GEOM_ANG = [(8, (0.0, 0.0, 0.1173)), (1, (0.0, 0.7572, -0.4692)), (1, (0.0, -0.7572, -0.4692))]
atoms = [{'Z': z, 'c': [v*ANG for v in c]} for z, c in GEOM_ANG]
mol = mol_from(atoms)
mf = scf.RHF(mol).run(conv_tol=1e-13)
n = mol.nao_nr(); D = mf.make_rdm1()
bse = json.load(open(os.path.join(HERE, '..', 'sto-3g.bse.json')))
df = lambda k: np.prod([x for x in range(k, 0, -2)]) if k > 0 else 1        # (k)!!, (-1)!! = 1
CART = [[(0, 0, 0)], [(1, 0, 0), (0, 1, 0), (0, 0, 1)]]
def prim_norm(al, l, m, k):
    return (2*al/np.pi)**0.75 * np.sqrt((4*al)**(l+m+k)/(df(2*l-1)*df(2*m-1)*df(2*k-1)))
def self_overlap(a, b, l, m, k):
    p = a + b; ax = lambda t: df(2*t-1)/(2*p)**t * np.sqrt(np.pi/p)
    return ax(l)*ax(m)*ax(k)
shells, labels = [], []
for at in atoms:
    for sh in bse['elements'][str(at['Z'])]['electron_shells']:
        e = [float(x) for x in sh['exponents']]
        for col, l in enumerate(sh['angular_momentum']):
            c = [float(x) for x in sh['coefficients'][col]]
            bfs = []
            for (lx, ly, lz) in CART[l]:
                d = [c[i]*prim_norm(e[i], lx, ly, lz) for i in range(len(e))]
                ss = sum(d[i]*d[j]*self_overlap(e[i], e[j], lx, ly, lz) for i in range(len(e)) for j in range(len(e)))
                bfs.append({'l': [lx, ly, lz], 'd': [float(v/np.sqrt(ss)) for v in d]})
                labels.append('%d %s l=%d%d%d' % (at['Z'], 'xyz', lx, ly, lz))
            shells.append({'c': [float(v) for v in at['c']], 'l': int(l), 'exps': e, 'bfs': bfs})
assert sum(len(s['bfs']) for s in shells) == n, (sum(len(s['bfs']) for s in shells), n)
O, H1, H2 = [np.array(a['c']) for a in atoms]
named = [('O nucleus', O), ('H1 nucleus', H1), ('H2 nucleus', H2), ('O-H1 midpoint', 0.5*(O+H1)),
         ('O-H2 midpoint', 0.5*(O+H2)), ('H-H midpoint', 0.5*(H1+H2)),
         ('12 bohr above O', O + np.array([0., 0., 12.])), ('2 bohr along x from O', O + np.array([2., 0., 0.])),
         ('off-axis (0.7, -1.1, 0.4)', np.array([0.7, -1.1, 0.4])), ('lone-pair side (0, 0, 1.6)', np.array([0., 0., 1.6]))]
pts = np.array([p for _, p in named])
ao = mol.eval_gto('GTOval', pts)
rho = dft.numint.eval_rho(mol, ao, D)                                      # PySCF's own density evaluator
rho2 = np.einsum('pi,ij,pj->p', ao, D, ao)
assert np.abs(rho - rho2).max() < 1e-12
# the 96^3 display grid on the +-10.3 bohr box, midpoint sampled: a SUM, not a quadrature
N96, L96 = 96, 10.3
ax = -L96 + (np.arange(N96) + 0.5)*2*L96/N96
tot = 0.0
for i in range(N96):
    P = np.stack(np.meshgrid(ax[i:i+1], ax, ax, indexing='ij'), -1).reshape(-1, 3)
    a = mol.eval_gto('GTOval', P)
    tot += float(np.einsum('pi,ij,pj->p', a, D, a).sum())
grid96 = tot*(2*L96/N96)**3
# an independent Becke quadrature, PySCF's own grid and its own AO evaluation
becke = {}
for lev in (1, 2, 3):
    g = dft.gen_grid.Grids(mol); g.level = lev; g.build()
    a = mol.eval_gto('GTOval', g.coords)
    becke[str(lev)] = {'points': int(len(g.weights)), 'integral': float(dft.numint.eval_rho(mol, a, D) @ g.weights)}
out = {
 'provenance': {'written_by': 'research/h2o-2026-09-11/scratch/fixgen-field.py', 'pyscf': __import__('pyscf').__version__,
   'basis': 'STO-3G, BSE v1 decimals', 'ang_to_bohr': ANG,
   'bse_sha256': hashlib.sha256(open(os.path.join(HERE, '..', 'sto-3g.bse.json'), 'rb').read()).hexdigest(),
   'shells': 'per-Cartesian-component primitive norm N_lmn(alpha), each contracted component renormalised to unit '
             'self-overlap; shell order = atom, BSE electron_shell, angular-momentum column (md.mjs buildBasis shape)',
   'rho': 'mol.eval_gto("GTOval", points) contracted with scf.RHF.make_rdm1(), cross-checked against dft.numint.eval_rho',
   'grid96': 'midpoint sum of rho over 96^3 cells on [-10.3, 10.3]^3 times the cell volume; NOT a quadrature',
   'becke': "dft.gen_grid.Grids(mol) at the stated level, PySCF's own AO evaluation"},
 'ao_order': [l.strip() for l in mol.ao_labels()],
 'atoms': [{'Z': a['Z'], 'c': [float(v) for v in a['c']]} for a in atoms],
 'n': int(n), 'nocc': int(mol.nelectron//2), 'nElectrons': int(mol.nelectron),
 'shells': shells,
 'exponentials': {'sharedPerPoint': 12, 'naivePerComponent': 21,
   'note': 'O 2s and 2p share one three-exponent sp shell, so 3 + 3 + 3 + 3 = 12 exponentials per point, not 7 x 3 = 21'},
 'C': [float(x) for x in mf.mo_coeff.ravel()], 'D': [float(x) for x in D.ravel()],
 'eps': [float(x) for x in mf.mo_energy], 'E': float(mf.e_tot),
 'points': [{'name': nm, 'r': [float(v) for v in p], 'rho': float(r), 'ao': [float(v) for v in row]}
            for (nm, p), r, row in zip(named, rho, ao)],
 'grid96': {'N': N96, 'L': L96, 'sum': grid96, 'cells': N96**3, 'bytesSevenLayers': 7*N96**3*4},
 'becke': becke,
 'TrDS': float(np.einsum('ij,ji->', D, mol.intor('int1e_ovlp'))),
}
json.dump(out, open(os.path.join(HERE, '..', '..', '..', 'tests', 'fixtures', 'h2o-field.json'), 'w'))
print('n =', n, ' shells =', len(shells), ' components =', sum(len(s['bfs']) for s in shells))
for (nm, p), r in zip(named, rho): print('  rho(%-26s) = %.9g' % (nm, r))
print('  96^3 midpoint sum on +-10.3 = %.6f electrons (exact 10)' % grid96)
print('  Becke:', becke)
print('  Tr(DS) =', out['TrDS'])
print('wrote tests/fixtures/h2o-field.json')
