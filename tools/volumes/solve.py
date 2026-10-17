#!/usr/bin/env python
"""tools/volumes/solve.py — THE SOLVER of the volume engine (iteration 004 V1, research/iteration-004/PLAN.md THE PIPELINE step 2).

Every candidate molecule, smallest first, up THE BASIS LADDER — STO-3G → STO-6G → 3-21G → 6-31G → 6-31G* → 6-31+G* — in PySCF RHF on
the VENDORED decimals (lab/vendor/bse, read through tools/volumes/lwbasis.py exactly as tools/library/frontier.py reads them),
cart=True, every AO kept (lab/md.js keeps them; PySCF's default drops overlap eigenvectors below 1e-6), conv_tol 1e-9.

  ~/.local/share/lw-volumes/venv/bin/python tools/volumes/solve.py --candidates ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json
  … --app H2O,NH3          the app's own molecules by id, at their pinned atoms (tools/volumes/app-atoms.mjs)
  … --only id,id           only these ids of the queue      … --bases sto-3g,6-31g   only these rungs
  … --max-nao N            skip a molecule whose largest rung passes N AOs (stated in STATUS, never solved)
  … --guess-study          ALSO solve every projected rung from PySCF's minao guess, recording its cycles beside the projected
                           guess's (a measurement: V1-BUILD.md "the effect of the projected guess"); the minao run writes nothing else
  … --status               rewrite raw/STATUS.json from the queue and the metas on disk, and exit
  … --raw DIR              write (and lock) the rungs in DIR instead of <data>/raw — a scratch catalogue for a measurement
  … --gpu                  THE GPU SOLVER (iteration 005 G, research/iteration-005/G-BUILD.md): the same ladder in gpu4pyscf on the card,
                           every AO kept (gpu4pyscf.scf.hf.remove_overlap_zero_eigenvalue = False, its own copy of PySCF's flag), the
                           projected guess built on the CPU and handed over, DIIS → level shift → newton all on the card; a rung the card
                           cannot finish (an exception: out of memory …) is solved on the CPU instead and says so (rung.gpu.fallback).
                           The npz is the same fields in the same AO order; rung.solver.engine names the solver. --gpu-memory GB caps the
                           CuPy pool (default 6: the card is shared).  The flock queue is the same, so a GPU and a CPU solver share one raw.
  … --largest-first        take the queue from its costliest end (the GPU's half: the card is slower than the CPU on small molecules —
                           the oracle's 7–37 AO rungs took 1.6–29 s against ≤ 0.2 s — and 1.7–2.7× faster at 371–624 AO, so the GPU
                           works down from the top while the CPU works up from the bottom; they meet once)

THE CONVERSION TRICK: a rung starts from the rung below's converged density, projected (scf.addons.project_dm_nr2nr) — the guess
is recorded; STO-3G starts from minao.  Every rung is still its own converged RHF.  A rung whose basis lacks an element, or gives one
an f shell (6-31G* on Sc–Zn: the app is l ≤ 2), is SKIPPED with the reason; the next rung projects from the last converged one.
CONVERGENCE: DIIS (max 100) → DIIS with a 0.5 Eh level shift (max 150) → second-order (newton, max 60); a rung none of them
converges is recorded FAILED with the reason and its attempts, never written as converged.

OUTPUT (~/Documents/LAMBDAWAVES-VOLUMES/raw, or $LW_VOLUMES/raw):
  raw/<id>/<basis>.npz   eps f64 · C f64 n × n ALREADY IN THE APP'S AO ORDER AND NORMALISATION (lwbasis.conversion) · occ · energy ·
                         enuc · dipole (Debye, origin 0) · mulliken (charges, f64) · ao (PySCF's labels in the app's order) · perm · scale
  raw/<id>/meta.json     the candidate (every field it carries), the atoms in bohr the rungs were solved at, and per rung: status,
                         energy, nAO, cycles, guess, attempts, seconds, S's smallest eigenvalue, the basis file's sha-256, the solver
  raw/STATUS.json        done / failed / remaining, per-rung timings, the rate and an ETA      raw/solve.log   one line per event
Clocks go into meta, STATUS and the log only — never into a .lwm (tools/volumes/pack.mjs writes none).
PROCESS: niced to 19 by itself, threads ≤ 10, max_memory ≤ 12000 MB (incore ERIs when they fit, else direct); a per-molecule flock
so two solvers share one queue (each takes the next unlocked molecule); SIGTERM/SIGINT-safe — every file is written to a tmp name
and renamed, a stopped rung is simply not written, and the lock dies with the process.
"""
import argparse, fcntl, json, os, signal, socket, subprocess, sys, time, traceback
from pathlib import Path

ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
ap.add_argument('--candidates', action='append', default=[], help='a candidate JSON file { molecules: [...] } (repeatable)')
ap.add_argument('--app', default='', help='comma-separated ids of the app\'s own molecules')
ap.add_argument('--only', default='', help='comma-separated ids: solve only these of the queue')
ap.add_argument('--bases', default='', help='comma-separated rungs (default: the whole ladder)')
ap.add_argument('--threads', type=int, default=10)
ap.add_argument('--max-memory', type=int, default=12000, help='MB')
ap.add_argument('--max-nao', type=int, default=0, help='skip a molecule whose largest rung passes this many AOs (0: no cap)')
ap.add_argument('--limit', type=int, default=0, help='stop after this many molecules solved by this process')
ap.add_argument('--guess-study', action='store_true')
ap.add_argument('--retry-failed', action='store_true', help='solve again a rung recorded as failed')
ap.add_argument('--status', action='store_true', help='rewrite STATUS.json and exit')
ap.add_argument('--raw', default='', help='the raw directory (default: <data>/raw)')
ap.add_argument('--gpu', action='store_true', help='solve on the GPU (gpu4pyscf)')
ap.add_argument('--largest-first', action='store_true', help='take the queue from its costliest end')
ap.add_argument('--gpu-memory', type=float, default=6.0, help='GB: the CuPy memory pool limit')
ap.add_argument('--data', default=os.environ.get('LW_VOLUMES', str(Path.home() / 'Documents/LAMBDAWAVES-VOLUMES')))
args = ap.parse_args()
args.threads = max(1, min(args.threads, 10)); args.max_memory = min(args.max_memory, 12000)
os.environ['OMP_NUM_THREADS'] = str(args.threads)               # before numpy / PySCF load their thread pools
try: os.nice(max(0, 19 - os.nice(0)))                            # the machine is shared: always the lowest priority
except OSError: pass

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np
import pyscf
from pyscf import gto, scf, lib
from lwbasis import ROOT, LADDER, record, coverage, pyscf_basis, conversion, nao_cart, SYMBOL, ANGSTROM
lib.num_threads(args.threads)
scf.hf.remove_overlap_zero_eigenvalue = False                    # THE WHOLE AO SPACE, as lab/md.js keeps it (lwbasis / oracle-ladder.py)
ENGINE, GPU = f'PySCF {pyscf.__version__} (CPU)', None
if args.gpu:
    import ctypes, importlib.util
    _ct = importlib.util.find_spec('cutensor')                     # the cutensor-cu12 wheel's libraries, which CuPy 14 does not find by itself
    for _lib in ('libcutensor.so.2', 'libcutensorMg.so.2') if _ct else ():
        try: ctypes.CDLL(str(Path(list(_ct.submodule_search_locations)[0]) / 'lib' / _lib), mode=ctypes.RTLD_GLOBAL)
        except OSError: pass
    import cupy, gpu4pyscf, gpu4pyscf.scf.hf
    from gpu4pyscf import scf as gscf
    gpu4pyscf.scf.hf.remove_overlap_zero_eigenvalue = False       # gpu4pyscf keeps its own copy of the flag (default True, 1e-6)
    cupy.get_default_memory_pool().set_limit(size=int(args.gpu_memory * 2 ** 30))    # after gpu4pyscf's import, which sets 90 % of the card
    _dev = cupy.cuda.runtime.getDeviceProperties(0)['name'].decode()
    ENGINE = f'gpu4pyscf {gpu4pyscf.__version__} (CuPy {cupy.__version__}, CUDA runtime {cupy.cuda.runtime.runtimeGetVersion()}) on {_dev}'
    GPU = {'device': _dev, 'gpu4pyscf': gpu4pyscf.__version__, 'cupy': cupy.__version__, 'memoryLimitGB': args.gpu_memory,
           'contraction': 'cutensor' if gpu4pyscf.lib.cutensor.contract_engine is None else gpu4pyscf.lib.cutensor.contract_engine}

CONV_TOL, CONV_TOL_GRAD = 1e-9, 1e-6
DATA = Path(args.data); RAW = Path(args.raw).expanduser() if args.raw else DATA / 'raw'; RAW.mkdir(parents=True, exist_ok=True)
BASES = [b for b in LADDER if not args.bases or b in args.bases.split(',')]
LOG = RAW / 'solve.log'
PID, HOST = os.getpid(), socket.gethostname()

class Stop(Exception): pass
def _stop(signum, frame): raise Stop(signal.Signals(signum).name)
signal.signal(signal.SIGTERM, _stop); signal.signal(signal.SIGINT, _stop)

def now(): return time.strftime('%Y-%m-%dT%H:%M:%S%z')
def log(msg):
    line = f'{now()} [{PID}] {msg}'
    print(line, flush=True)
    with LOG.open('a') as f: f.write(line + '\n')
def write_json(path, obj):
    tmp = path.with_name(path.name + f'.{PID}.tmp')
    tmp.write_text(json.dumps(obj, indent=1, allow_nan=False) + '\n'); os.replace(tmp, path)
def write_npz(path, **arrays):
    tmp = path.with_name(path.name + f'.{PID}.tmp')
    with tmp.open('wb') as f: np.savez(f, **arrays)
    os.replace(tmp, path)

# ── THE QUEUE ───────────────────────────────────────────────────────────────────────────────────────────────────────
ID_OK = lambda s: isinstance(s, str) and 0 < len(s) <= 80 and all(c.isalnum() or c in '._+-' for c in s) and not s.startswith('.')
def queue():
    mols, order = {}, []
    def take(m, src):
        if not ID_OK(m.get('id')): raise SystemExit(f'solve: {src}: the id {m.get("id")!r} is not a file name ([A-Za-z0-9._+-], ≤ 80)')
        if m['id'] in mols: return
        mols[m['id']] = m; order.append(m['id'])
    want_app, by_app = [s for s in args.app.split(',') if s], {}
    for f in args.candidates:
        for m in json.loads(Path(f).expanduser().read_text())['molecules']:
            if 'atomsAng' not in m and 'atomsBohr' not in m and m.get('app'): want_app.append(m['app']); by_app[m['app']] = m
            else: take(m, f)
    if want_app:                                                   # the app's pinned atoms; the candidate's own fields (identifiers, tags …) kept
        r = subprocess.run(['node', str(ROOT / 'tools/volumes/app-atoms.mjs'), *dict.fromkeys(want_app)], check=True, capture_output=True, text=True)
        for a in json.loads(r.stdout)['molecules']:
            c = by_app.get(a['id'], {})
            take({**a, **c, **{k: a[k] for k in ('app', 'atomsBohr', 'charge', 'multiplicity', 'symmetry', 'geometrySource', 'geometryMethod')}, 'id': c.get('id', a['id'])}, 'app-atoms.mjs')
    if args.only: order = [i for i in order if i in set(args.only.split(','))]
    out = []
    for i in order:
        m = mols[i]
        if 'atomsBohr' in m: atoms = [[int(a[0]), float(a[1]), float(a[2]), float(a[3])] for a in m['atomsBohr']]
        else: atoms = [[int(a[0]), float(a[1]) * ANGSTROM, float(a[2]) * ANGSTROM, float(a[3]) * ANGSTROM] for a in m['atomsAng']]
        zs = [a[0] for a in atoms]
        bad = None
        if any(z < 1 or z > 36 for z in zs): bad = 'an element past Kr (the ladder is H–Kr)'
        elif (sum(zs) - int(m.get('charge', 0))) % 2 or int(m.get('multiplicity', 1)) != 1: bad = 'an open shell: RHF holds closed shells only'
        rungs = {}
        for b in BASES:
            rec = record(b)[0]; why = coverage(rec, zs)
            rungs[b] = {'skip': why} if why else {'nAO': nao_cart(rec, zs)}
        naos = [r['nAO'] for r in rungs.values() if 'nAO' in r]
        if not bad and args.max_nao and naos and max(naos) > args.max_nao: bad = f'its largest rung is {max(naos)} AOs, past --max-nao {args.max_nao}'
        out.append({'id': i, 'm': m, 'atoms': atoms, 'zs': zs, 'rungs': rungs, 'bad': bad,
                    'cost': sum(n ** 4 for n in naos) / 1e8, 'heavy': sum(1 for z in zs if z > 1)})
    out.sort(key=lambda q: (q['cost'], q['id']), reverse=args.largest_first)   # smallest first (or largest), by the estimated cost (Σ nAO⁴ over the rungs)
    return out

# ── ONE RUNG ────────────────────────────────────────────────────────────────────────────────────────────────────────
def build(q, b):
    rec = record(b)[0]
    return gto.M(atom=[(SYMBOL[z], (x, y, w)) for z, x, y, w in q['atoms']], unit='Bohr', basis=pyscf_basis(rec, q['zs']), cart=True,
                 charge=int(q['m'].get('charge', 0)), spin=0, verbose=0, max_memory=args.max_memory)
def rhf(mol, h1e=None, **kw):
    """h1e (a CuPy array): the rung is solved on the card, with the CPU's core Hamiltonian (see converge_gpu)"""
    mf = scf.RHF(mol) if h1e is None else gscf.RHF(mol); mf.chkfile = None; mf.conv_tol = CONV_TOL; mf.conv_tol_grad = CONV_TOL_GRAD
    if h1e is not None: mf.get_hcore = lambda *a, **k: h1e
    for k, v in kw.items(): setattr(mf, k, v)
    return mf
def attempt(mf, dm0, method):
    t = time.perf_counter(); mf.kernel(dm0); s = time.perf_counter() - t
    return mf, {'method': method, 'converged': bool(mf.converged), 'cycles': int(getattr(mf, 'cycles', -1)), 'seconds': round(s, 3),
                'energy': float(mf.e_tot) if np.isfinite(mf.e_tot) else None}
def converge(mol, dm0, h1e=None):
    """DIIS → DIIS + level shift → second order; the first that converges is the rung's solution"""
    tries = []
    mf, a = attempt(rhf(mol, h1e, max_cycle=100), dm0, 'diis'); tries.append(a)
    if mf.converged: return mf, tries
    mf, a = attempt(rhf(mol, h1e, max_cycle=150, level_shift=0.5), dm0, 'diis + level shift 0.5'); tries.append(a)
    if mf.converged: return mf, tries
    C = mf.mo_coeff if h1e is None else cupy.asnumpy(mf.mo_coeff)
    start = mf.make_rdm1() if np.all(np.isfinite(C)) else dm0
    nt = rhf(mol, h1e, max_cycle=60).newton(); nt.conv_tol = CONV_TOL; nt.conv_tol_grad = CONV_TOL_GRAD
    mf, a = attempt(nt, start, 'second order (newton)'); tries.append(a)
    return mf, tries
def on_cpu(mol, g, h1e):
    """the card's converged solution as a PySCF CPU RHF (no SCF is run): the rest of the rung — the npz, dipole, Mulliken — is the CPU's
    code.  The energy is evaluated afresh at the final density (one full J/K build on the card): gpu4pyscf's SCF energy is built
    incrementally (vhf += vhf(ΔD), each screened), and its sum drifts 1–2e-9 Eh from the density's own energy (G-BUILD.md)"""
    mf = rhf(mol); mf.mo_coeff, mf.mo_energy, mf.mo_occ = (cupy.asnumpy(x).astype('f8') for x in (g.mo_coeff, g.mo_energy, g.mo_occ))
    dm = cupy.asarray(mf.make_rdm1())
    e = float(cupy.vdot(dm, h1e + .5 * gscf.hf.get_veff(g, mol, dm)).real) + mol.energy_nuc() if g.converged else float(g.e_tot)
    mf.e_tot, mf.converged, mf.cycles = e, bool(g.converged), int(getattr(g, 'cycles', -1))
    return mf
def converge_gpu(mol, dm0):
    """the ladder on the card; an exception (out of memory …) sends the rung to the CPU, recorded.  The core Hamiltonian is the CPU's
    (PySCF's int1e, cheap): gpu4pyscf's nuclear attraction differs by up to 1.3e-10 per element on Br, 2.9e-10 Eh in HBr's energy"""
    pool = cupy.get_default_memory_pool()
    try:
        h1e = cupy.asarray(scf.hf.get_hcore(mol))
        mf, tries = converge(mol, dm0, h1e); peak = pool.total_bytes()
        return on_cpu(mol, mf, h1e), tries, {**GPU, 'poolMB': round(peak / 2 ** 20)}
    except Stop: raise
    except Exception as e:
        why = f'{type(e).__name__}: {str(e)[:200]}'; log(f'GPU → CPU for this rung: {why}')
        pool.free_all_blocks()
        mf, tries = converge(mol, dm0)
        return mf, tries, {**GPU, 'fallback': why}
    finally: pool.free_all_blocks()

def solve_molecule(q):
    d = RAW / q['id']; d.mkdir(exist_ok=True)
    for t in d.glob('*.tmp'): t.unlink()                          # a stopped writer's leftovers (we hold the lock: none is live)
    mp = d / 'meta.json'
    meta = json.loads(mp.read_text()) if mp.exists() else {}
    if meta.get('atomsBohr') not in (None, q['atoms']):
        log(f'{q["id"]}: the atoms moved since the last solve — every rung is solved again'); meta = {}
    meta.update({'schema': 1, 'id': q['id'], 'candidate': q['m'], 'atomsBohr': q['atoms'], 'charge': int(q['m'].get('charge', 0)), 'multiplicity': 1,
                 'heavy': q['heavy'], 'nAtoms': len(q['atoms'])})
    if 'detectedGroup' not in meta:                                # PySCF's own detection at its default tolerance — recorded, never a name
        try:
            sm = gto.M(atom=[(SYMBOL[z], (x, y, w)) for z, x, y, w in q['atoms']], unit='Bohr', basis=pyscf_basis(record('sto-3g')[0], q['zs']),
                       charge=int(q['m'].get('charge', 0)), spin=0, symmetry=True, verbose=0)
            meta['detectedGroup'] = sm.topgroup; meta['detectedGroupMethod'] = 'PySCF ' + pyscf.__version__ + ' topgroup at its default tolerance (pyscf.symm.geom.TOLERANCE)'
        except Exception as e: meta['detectedGroup'] = None; meta['detectedGroupMethod'] = 'PySCF detection failed: ' + str(e)[:120]
    rungs = meta.setdefault('rungs', {})
    prev = None                                                    # (basis, mol, dm) of the last converged rung
    for b in BASES:
        rec, sha, file = record(b); r = rungs.get(b, {})
        if 'skip' in q['rungs'][b]:
            rungs[b] = {'status': 'skipped', 'why': q['rungs'][b]['skip']}; continue
        npz = d / f'{b}.npz'
        if r.get('status') == 'converged' and npz.exists() and r.get('basisSha256') == sha:
            z = np.load(npz); mol = build(q, b); ix, rd, _ = conversion(mol)
            C = np.zeros_like(z['C']); C[ix] = z['C'] / rd[:, None]      # back to PySCF's order and normalisation
            occ = z['occ']; prev = (b, mol, (C * occ) @ C.T); continue
        if r.get('status') == 'failed' and not args.retry_failed: continue
        mol = build(q, b); n = mol.nao_nr()
        dm0, guess = (scf.addons.project_dm_nr2nr(prev[1], prev[2], mol), 'projected from ' + prev[0]) if prev else (None, 'minao')
        t0 = time.perf_counter(); mf, tries, gpu = converge_gpu(mol, dm0) if args.gpu else (*converge(mol, dm0), None); sec = time.perf_counter() - t0
        base = {'basis': b, 'basisFile': file, 'basisSha256': sha, 'nAO': n, 'guess': guess, 'attempts': tries, 'seconds': round(sec, 3),
                'solver': {'pyscf': pyscf.__version__, 'engine': ENGINE if not (gpu and gpu.get('fallback')) else f'PySCF {pyscf.__version__} (CPU, the GPU fell back)', 'method': 'RHF', 'cart': True, 'convTol': CONV_TOL, 'convTolGrad': CONV_TOL_GRAD,
                           'threads': lib.num_threads(), 'maxMemoryMB': args.max_memory, 'incoreERI': getattr(mf, '_eri', None) is not None,
                           'everyAO': 'scf.hf.remove_overlap_zero_eigenvalue = False' + (' (and gpu4pyscf\'s own)' if gpu else '')},
                **({'gpu': gpu} if gpu else {}), 'solved': now(), 'pid': PID, 'host': HOST}
        if not mf.converged:
            rungs[b] = {**base, 'status': 'failed', 'why': f'no convergence after {", ".join(a["method"] + " (" + str(a["cycles"]) + " cycles)" for a in tries)}'}
            log(f'{q["id"]} {b} FAILED {rungs[b]["why"]}'); write_json(mp, meta); continue
        nocc = int(round(mol.nelectron / 2)); occ = mf.mo_occ
        assert mf.mo_coeff.shape == (n, n) and int(np.sum(occ == 2)) == nocc and np.all(occ[:nocc] == 2), 'not an aufbau closed shell'
        ix, rd, labs = conversion(mol)
        C = rd[:, None] * mf.mo_coeff[ix]                          # the app's AO order and normalisation (frontier.py)
        S = mol.intor('int1e_ovlp'); smin = float(np.linalg.eigvalsh(S)[0])
        dip = mf.dip_moment(unit='Debye', verbose=0); chg = mf.mulliken_pop(verbose=0)[1]
        write_npz(d / f'{b}.npz', eps=np.asarray(mf.mo_energy, dtype='f8'), C=np.ascontiguousarray(C, dtype='f8'), occ=np.asarray(occ, dtype='f8'),
                  energy=np.float64(mf.e_tot), enuc=np.float64(mol.energy_nuc()), dipole=np.asarray(dip, dtype='f8'), mulliken=np.asarray(chg, dtype='f8'),
                  ao=np.array(labs), perm=ix.astype('i4'), scale=rd.astype('f8'))
        study = None
        if args.guess_study and prev:
            sm = rhf(mol, max_cycle=200); sm._eri = getattr(mf, '_eri', None)         # the same incore ERIs (or direct): the clocks then differ by the cycles alone
            mfm, a = attempt(sm, None, 'diis from minao (guess study)')
            study = {**a, 'sameState': bool(mfm.converged and abs(mfm.e_tot - mf.e_tot) < 1e-7), 'deltaE': float(mfm.e_tot - mf.e_tot) if mfm.converged else None}
        rungs[b] = {**base, 'status': 'converged', 'file': f'{b}.npz', 'energy': float(mf.e_tot), 'cycles': sum(a['cycles'] for a in tries),
                    'nocc': nocc, 'gapEh': float(mf.mo_energy[nocc] - mf.mo_energy[nocc - 1]), 'dipoleDebye': [float(v) for v in dip],
                    'minEigS': smin, **({'guessStudy': study} if study else {})}
        log(f'{q["id"]} {b} {n} AO E {mf.e_tot:.10f} {rungs[b]["cycles"]} cycles ({guess}) {sec:.1f} s' + (' GPU' if gpu and not gpu.get('fallback') else '') + (f' · minao {study["cycles"]} cycles {study["seconds"]:.1f} s' if study else ''))
        write_json(mp, meta)
        prev = (b, mol, mf.make_rdm1())
    meta['updated'] = now(); write_json(mp, meta)
    return meta

# ── THE STATUS ──────────────────────────────────────────────────────────────────────────────────────────────────────
def status(Q, working=None):
    with (RAW / '.status.lock').open('a') as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        st = {'updated': now(), 'queue': len(Q), 'bases': BASES, 'molecules': {}}
        rate_s = rate_c = 0.0; remaining_cost = 0.0; counts = {'done': 0, 'failed': 0, 'refused': 0, 'remaining': 0}
        for q in Q:
            mp = RAW / q['id'] / 'meta.json'; meta = json.loads(mp.read_text()) if mp.exists() else {}
            rs = meta.get('rungs', {})
            if q['bad']: state = 'refused'
            else:
                need = [b for b in BASES if 'skip' not in q['rungs'][b]]
                got = [rs.get(b, {}).get('status') for b in need]
                state = 'done' if all(s == 'converged' for s in got) else 'failed' if all(s in ('converged', 'failed') for s in got) else 'remaining'
            counts[state] += 1
            row = {'state': state, 'cost': round(q['cost'], 6), 'heavy': q['heavy'],
                   'rungs': {b: {k: v for k, v in rs[b].items() if k in ('status', 'seconds', 'nAO', 'cycles', 'why', 'guess')} for b in rs}}
            if q['bad']: row['why'] = q['bad']
            st['molecules'][q['id']] = row
            if state in ('done', 'failed'):
                rate_s += sum(r.get('seconds', 0) for r in rs.values()); rate_c += q['cost']
            elif state == 'remaining': remaining_cost += q['cost']
        st.update(counts)
        rate = rate_s / rate_c if rate_c else None
        st['rate'] = {'secondsPerCostUnit': rate, 'cost': 'Σ over the rungs of (nAO/100)⁴ — the ERI work, a rough clock; measured over the molecules finished'}
        st['etaSeconds'] = round(remaining_cost * rate) if rate else None
        st['etaNote'] = 'one solver process at the threads below; two processes sharing the queue roughly halve it (the machine permitting)'
        st['threads'] = args.threads
        if working: st['working'] = working
        write_json(RAW / 'STATUS.json', st)
        return st

def main():
    Q = queue()
    if args.status: st = status(Q); print(json.dumps({k: st[k] for k in ('queue', 'done', 'failed', 'refused', 'remaining', 'etaSeconds')})); return
    log(f'start: {len(Q)} molecules in the queue, rungs {",".join(BASES)}, {args.threads} threads, max_memory {args.max_memory} MB, {ENGINE}' + (f', pool ≤ {args.gpu_memory} GB' if args.gpu else '') + f', raw {RAW}')
    solved = 0
    for q in Q:
        if q['bad']: continue
        d = RAW / q['id']; d.mkdir(exist_ok=True)
        fd = os.open(d / '.lock', os.O_CREAT | os.O_RDWR, 0o644)
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            os.close(fd); continue                                  # another solver has it
        try:
            os.ftruncate(fd, 0); os.write(fd, f'{PID} {HOST} {now()}\n'.encode())
            mp = d / 'meta.json'
            if mp.exists():
                meta = json.loads(mp.read_text()); rs = meta.get('rungs', {})
                need = [b for b in BASES if 'skip' not in q['rungs'][b]]
                if meta.get('atomsBohr') == q['atoms'] and all(rs.get(b, {}).get('status') == 'converged' or (rs.get(b, {}).get('status') == 'failed' and not args.retry_failed) for b in need):
                    continue                                        # done (or failed and not retried)
            status(Q, {'id': q['id'], 'pid': PID, 'since': now()})
            solve_molecule(q); solved += 1
        except Stop as e:
            log(f'{q["id"]}: stopped by {e} — no rung was half-written; the molecule resumes from its last finished rung'); status(Q); sys.exit(143)
        except Exception:
            log(f'{q["id"]}: ERROR\n' + traceback.format_exc())
        finally:
            try: fcntl.flock(fd, fcntl.LOCK_UN); os.close(fd)
            except OSError: pass
        if args.limit and solved >= args.limit: break
    st = status(Q)
    log(f'end: done {st["done"]}, failed {st["failed"]}, refused {st["refused"]}, remaining {st["remaining"]}')

if __name__ == '__main__':
    try: main()
    except Stop as e: log(f'stopped by {e}'); sys.exit(143)
