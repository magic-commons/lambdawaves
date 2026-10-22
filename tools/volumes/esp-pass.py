#!/usr/bin/env python
"""tools/volumes/esp-pass.py — THE POTENTIAL PASS (iteration 014 C1): the electrostatic potential of every solved molecule on a coarse grid,
from its SAVED top rung — not a re-solve.  The rung's C (raw/<id>/<basis>.npz, the app's AO order) goes back to PySCF's order, D = C occ Cᵀ,
and φ is one integral pass over the grid:

    φ(r) = Σ_A Z_A / |r − R_A|  −  Σ_μν D_μν ∫ χ_μ(r′) χ_ν(r′) / |r − r′| dr′        (atomic units: Eh per e, i.e. hartree / e = 27.211 V)

the electron term from PySCF's int1e_grids (cart, in chunks so a 600-AO rung stays under ~0.8 GB), the nuclear term exact.

  ~/.local/share/lw-volumes/venv/bin/python tools/volumes/esp-pass.py [--raw DIR] [--only id,id] [--n 32] [--force]

THE GRID (what chain B reads; pack.mjs carries it as header.esp, lab/volumes-format.js espOf):
  the march box the app draws a volume molecule in — half = max(max|coordinate| + 6, (20/13)(R + 3)), R the farthest nucleus from the
  origin (the record's ground.half, then chemview.js framed()) — the cube [−half, half]³ about the origin, in bohr, the atoms as solved;
  n³ points at the CELL CENTRES (a texture's texel centres): x_i = −half + (i + ½)·2·half/n, the same for y_j and z_k;
  flat index i + n·(j + n·k) (x fastest); φ in Eh/e, cast to IEEE-754 binary16 (f16) after clipping to ±65504 (a point next to a nucleus).
OUTPUT: raw/<id>/esp.npz — n (i8) · half (f8) · basis (the rung) · f16 (u2: the binary16 bits) · charges (f8: Mulliken, from D and S) ·
  min / max (f8: φ over the grid before the cast).  Written to a tmp name and renamed; meta.json is never touched (the solvers own it).
  A molecule whose esp.npz already names its current top rung is skipped (--force recomputes).  Niced to 19, threads ≤ 4.
NEVER run on the live raw/ by a builder: the babysitter's finish or a night runs it (research/iteration-014/C1-BUILD.md).
"""
import argparse, json, os, sys, time
from pathlib import Path

ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
ap.add_argument('--raw', default='', help='the raw directory (default: <data>/raw)')
ap.add_argument('--only', default='', help='comma-separated ids')
ap.add_argument('--n', type=int, default=32, help='grid points per side')
ap.add_argument('--threads', type=int, default=4)
ap.add_argument('--force', action='store_true')
ap.add_argument('--data', default=os.environ.get('LW_VOLUMES', str(Path.home() / 'Documents/LAMBDAWAVES-VOLUMES')))
args = ap.parse_args()
os.environ['OMP_NUM_THREADS'] = str(max(1, min(args.threads, 4)))
try: os.nice(max(0, 19 - os.nice(0)))
except OSError: pass

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np
from pyscf import gto
from lwbasis import LADDER, record, pyscf_basis, conversion, SYMBOL

RAW = Path(args.raw).expanduser() if args.raw else Path(args.data) / 'raw'
FRAME = 20 / 13                                                   # chemview.js FRAME: the molecule at most 65 % of the box

def box_half(atoms):
    far = max(max(abs(x), abs(y), abs(z)) for _, x, y, z in atoms)
    R = max(float(np.sqrt(x * x + y * y + z * z)) for _, x, y, z in atoms)
    return max(far + 6, FRAME * (R + 3))

def grid(n, half):
    c = -half + (np.arange(n) + 0.5) * (2 * half / n)
    z, y, x = np.meshgrid(c, c, c, indexing='ij')                  # x fastest: index i + n(j + n k)
    return np.stack([x.ravel(), y.ravel(), z.ravel()], axis=1)

def one(rid):
    d = RAW / rid; mp = d / 'meta.json'
    if not mp.exists(): return f'{rid}: no meta.json'
    meta = json.loads(mp.read_text()); rs = meta.get('rungs', {})
    top = next((b for b in reversed(LADDER) if rs.get(b, {}).get('status') == 'converged' and (d / f'{b}.npz').exists()), None)
    if not top: return f'{rid}: no converged rung'
    out = d / 'esp.npz'
    if out.exists() and not args.force:
        try:
            old = np.load(out)
            if str(old['basis']) == top and int(old['n']) == args.n: return f'{rid}: kept ({top})'
        except Exception: pass
    t0 = time.perf_counter()
    atoms = meta['atomsBohr']; zs = [int(a[0]) for a in atoms]
    rec = record(top)[0]
    mol = gto.M(atom=[(SYMBOL[z], (x, y, w)) for z, x, y, w in atoms], unit='Bohr', basis=pyscf_basis(rec, zs), cart=True,
                charge=int(meta.get('charge', 0)), spin=0, verbose=0)
    z = np.load(d / f'{top}.npz'); ix, rd, _ = conversion(mol)
    C = np.zeros_like(z['C']); C[ix] = z['C'] / rd[:, None]          # back to PySCF's order and normalisation (solve.py, verbatim)
    D = (C * z['occ']) @ C.T
    S = mol.intor('int1e_ovlp')
    pop = np.einsum('ij,ji->i', D, S); q = np.array(mol.atom_charges(), dtype='f8')
    charges = q - np.bincount([int(l.split()[0]) for l in mol.ao_labels()], weights=pop, minlength=mol.natm)
    half = box_half(atoms); P = grid(args.n, half); nao = mol.nao_nr()
    chunk = max(8, int(1e8 / (nao * nao)))
    elec = np.empty(len(P))
    for s in range(0, len(P), chunk):
        V = mol.intor('int1e_grids', grids=P[s:s + chunk])          # (g, nao, nao): ∫ χμ χν / |r_g − r′|
        elec[s:s + chunk] = np.einsum('gij,ij->g', V, D)
    R = mol.atom_coords()
    nuc = np.zeros(len(P))
    for A in range(mol.natm): nuc += q[A] / np.maximum(np.linalg.norm(P - R[A], axis=1), 1e-12)
    phi = nuc - elec
    f16 = np.clip(phi, -65504, 65504).astype('<f2').view('<u2')
    tmp = out.with_name(out.name + f'.{os.getpid()}.tmp')
    with tmp.open('wb') as f:
        np.savez(f, n=np.int64(args.n), half=np.float64(half), basis=np.array(top), f16=f16, charges=charges.astype('f8'),
                 min=np.float64(phi.min()), max=np.float64(phi.max()))
    os.replace(tmp, out)
    dq = float(np.max(np.abs(charges - z['mulliken']))) if 'mulliken' in z.files else float('nan')
    return (f'{rid}: {top} {nao} AO · {args.n}³ over ±{half:.3f} bohr · φ {phi.min():.4f} … {phi.max():.4f} Eh/e · '
            f'Mulliken vs the solver\'s {dq:.1e} · {time.perf_counter() - t0:.2f} s')

ids = [s for s in args.only.split(',') if s] or sorted(p.name for p in RAW.iterdir() if (p / 'meta.json').exists())
for rid in ids:
    try: print(one(rid), flush=True)
    except Exception as e: print(f'{rid}: ERROR {type(e).__name__}: {e}', flush=True)
