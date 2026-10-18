"""research/iteration-007/codon/contacts.py — a sanity check of the built models: bonds by covalent radii, then the closest NON-bonded
contacts beyond 1-4 (H..H, X..H, heavy..heavy) and the Na+ distances.   python -I contacts.py name ...   (run in this folder)"""
import sys, numpy as np
R = {'H': .31, 'C': .76, 'N': .71, 'O': .66, 'P': 1.07, 'Na': 1.66}
for name in sys.argv[1:]:
    L = open(f'{name}.xyz').read().splitlines()[2:]
    el = [l.split()[0] for l in L]; X = np.array([list(map(float, l.split()[1:4])) for l in L])
    d = np.linalg.norm(X[:, None] - X[None], axis=2); r = np.array([R[e] for e in el])
    B = (d < 1.25 * (r[:, None] + r[None])) & (d > 0)
    if any(e == 'Na' for e in el): B[[i for i, e in enumerate(el) if e == 'Na']] = False; B[:, [i for i, e in enumerate(el) if e == 'Na']] = False
    B2 = (B.astype(int) @ B.astype(int)) > 0
    nb = ~B & ~B2 & ~np.eye(len(el), dtype=bool)
    nb3 = nb & ~((B.astype(int) @ B2.astype(int)) > 0)   # beyond 1-4
    H = np.array([e == 'H' for e in el])
    val = B.sum(1); bad_val = {e: 0 for e in R}
    exp = {'H': 1, 'C': 4, 'N': (2, 3), 'O': (1, 2), 'P': 4}
    vb = [(el[i], int(val[i])) for i in range(len(el)) if el[i] in exp and val[i] not in (exp[el[i]] if isinstance(exp[el[i]], tuple) else (exp[el[i]],))]
    def mn(mask):
        m = np.where(mask, d, 99); i, j = np.unravel_index(m.argmin(), m.shape); return round(float(m[i, j]), 2), el[i], el[j]
    print(f'{name:18s} bonds {int(B.sum()//2)}  odd valences {vb[:6]}  min non-bonded(1-4+) H..H {mn(nb3 & H[:,None] & H[None])}  X..H {mn(nb3 & (H[:,None] ^ H[None]))}  heavy..heavy {mn(nb3 & ~H[:,None] & ~H[None])}', end='')
    na = [i for i, e in enumerate(el) if e == 'Na']
    if na: print(f'  Na..O min {d[np.ix_(na, [i for i,e in enumerate(el) if e=="O"])].min():.2f}  Na..Na min {np.where(np.eye(len(na),dtype=bool),99,d[np.ix_(na,na)]).min():.2f}', end='')
    print()
