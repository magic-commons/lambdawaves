"""figure_any.py — the six-panel figure of figure.py for any fields_<tag>_N<N>.npz written by leak_any.py.
    python -I figure_any.py fields_<tag>_N<N>.npz [--axis y] [--at 0.0] [--lw 3.0] [--out name.png] [--title '...']
The section is the plane <axis> = <at>; the in-section coordinates are the other two axes in order. Nuclei within h of the plane are drawn as dots,
the rest as crosses at their projection. The dipole axis (the packet's transition-moment component) is reported in the suptitle."""
import os, sys, argparse
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

ap = argparse.ArgumentParser(); ap.add_argument('npz'); ap.add_argument('--axis', default='y'); ap.add_argument('--at', type=float, default=0.0)
ap.add_argument('--lw', type=float, default=3.0); ap.add_argument('--out', default=None); ap.add_argument('--title', default=''); ap.add_argument('--vmax', type=float, default=None); args = ap.parse_args()
F = np.load(args.npz); x = F['x']; n = len(x); h = x[1] - x[0]; ax_i = 'xyz'.index(args.axis); keep = [q for q in range(3) if q != ax_i]
k = int(np.clip(np.searchsorted(x, args.at), 1, n - 1))          # the two slabs straddling the plane
def sec(f):
    f = np.moveaxis(f, ax_i - 3, -1) if f.ndim == 3 else np.moveaxis(f, ax_i - 3, -1)   # move the section axis last (works for (N,N,N) and (3,N,N,N))
    return 0.5 * (f[..., k - 1] + f[..., k])
s, e, b = sec(F['s']), sec(F['e']), sec(F['b']); j = sec(F['j']); c = sec(F['c']); R = F['atoms']; comp = int(F['comp']) if 'comp' in F else 0
Lw = args.lw; m = np.abs(x) <= Lw; xs = x[m]; A, B = np.meshgrid(xs, xs, indexing='ij')
cmap = LinearSegmentedColormap.from_list('leak', [(0.0, '#ff9f43'), (0.5, '#000000'), (1.0, '#48dbfb')])
plt.rcParams.update({'figure.facecolor': 'black', 'axes.facecolor': 'black', 'axes.edgecolor': '#888', 'text.color': 'white', 'axes.labelcolor': 'white',
                     'xtick.color': '#aaa', 'ytick.color': '#aaa', 'font.family': 'serif', 'font.size': 9})
fig, ax = plt.subplots(2, 3, figsize=(9.6, 6.4), dpi=200); ax = ax.ravel()
vmax = args.vmax or np.percentile(np.abs(s[np.ix_(m, m)]), 99.5)
for i, (f, name) in enumerate(((s, r'$s=\partial_t\rho+\nabla\cdot\mathbf{j}$  (the leak)'), (e, r'$e$  (frozen exchange)'), (b, r'$b$  (finite basis)'))):
    im = ax[i].pcolormesh(A, B, f[np.ix_(m, m)], cmap=cmap, vmin=-vmax, vmax=vmax, shading='nearest', rasterized=True); ax[i].set_title(name, pad=4)
def stream(a, v, title, ref):
    va, vb = v[keep[0]][np.ix_(m, m)], v[keep[1]][np.ix_(m, m)]; sp = np.sqrt(va ** 2 + vb ** 2)
    a.pcolormesh(A, B, sp, cmap='gray', vmin=0, vmax=ref, shading='nearest', rasterized=True)
    a.streamplot(xs, xs, va.T, vb.T, color='#48dbfb', density=1.3, linewidth=0.6 + 1.6 * np.minimum(sp.T / ref, 1), arrowsize=0.7); a.set_title(title, pad=4)
ref = np.percentile(np.sqrt((j[np.ix_(keep, m, m)] ** 2).sum(0)), 99.5)
stream(ax[3], j, r'$\mathbf{j}$, the current', ref); stream(ax[4], c, r'$\mathbf{c}^*=\nabla\varphi$, the repair (closed walls)', ref); stream(ax[5], j + c, r'$\mathbf{j}+\mathbf{c}^*$, the repaired current', ref)
labels = 'xyz'
for a in ax:
    a.set_aspect('equal'); a.set_xlim(-Lw, Lw); a.set_ylim(-Lw, Lw)
    for A_ in range(len(R)):
        inplane = abs(R[A_, ax_i] - args.at) < h
        a.plot(R[A_, keep[0]], R[A_, keep[1]], 'o' if inplane else '+', color='white', ms=3.5 if inplane else 6, mew=0.8)
    a.set_xlabel(f'${labels[keep[0]]}$ (bohr)'); a.set_ylabel(f'${labels[keep[1]]}$ (bohr)'); a.tick_params(length=2)
cb = fig.colorbar(im, ax=ax[:3].tolist(), fraction=0.02, pad=0.01); cb.set_label(r'per unit $\sin\Delta\varepsilon t$  (a.u.)', color='white'); cb.ax.yaxis.set_tick_params(color='#aaa'); plt.setp(cb.ax.get_yticklabels(), color='#aaa')
fig.suptitle(args.title or f'section ${args.axis}={args.at:g}$; dots nuclei in the section, crosses the others projected; dipole axis ${labels[comp]}$; grid {n}³', y=0.995, fontsize=9)
out = args.out or os.path.splitext(os.path.basename(args.npz))[0].replace('fields_', 'leak_') + '.png'
fig.savefig(os.path.join(os.path.dirname(os.path.abspath(args.npz)), out), facecolor='black', bbox_inches='tight'); print('wrote', out)
