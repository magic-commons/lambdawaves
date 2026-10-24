"""figure.py — the carrying figure of THE LEAK AND THE REPAIR from fields_N<N>.npz (leak_repair.py).
Section y = 0 (the plane through O perpendicular to the molecular plane; the H nuclei lie at y = ±1.43 bohr outside it), as Paper 2's Figure 6.
Top: the leak s and its two parts, exchange e and basis b, one signed scale, zero black.  Bottom: the current j, the Neumann repair c*, and j + c*.
Run: /home/joshua-hosain/miniforge3/envs/sci/bin/python -I figure.py [N]"""
import os, sys, json
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

HERE = os.path.dirname(os.path.abspath(__file__)); N = int(sys.argv[1]) if len(sys.argv) > 1 else 160
F = np.load(os.path.join(HERE, f'fields_N{N}.npz')); x = F['x']; n = len(x); k = n // 2
sec = lambda f: 0.5 * (f[..., k - 1, :] + f[..., k, :])          # average of the two slabs straddling y = 0; axes left: (x, z)
s, e, b = sec(F['s']), sec(F['e']), sec(F['b']); j = sec(F['j']); c = sec(F['c']); R = F['atoms']
Lw = 3.0; m = np.abs(x) <= Lw; xs = x[m]
X, Zc = np.meshgrid(xs, xs, indexing='ij')
cmap = LinearSegmentedColormap.from_list('leak', [(0.0, '#ff9f43'), (0.5, '#000000'), (1.0, '#48dbfb')])
plt.rcParams.update({'figure.facecolor': 'black', 'axes.facecolor': 'black', 'axes.edgecolor': '#888', 'text.color': 'white',
                     'axes.labelcolor': 'white', 'xtick.color': '#aaa', 'ytick.color': '#aaa', 'font.family': 'serif', 'font.size': 9})
fig, ax = plt.subplots(2, 3, figsize=(9.6, 6.4), dpi=200); ax = ax.ravel()
vmax = np.percentile(np.abs(s[np.ix_(m, m)]), 99.5)
for i, (f, name) in enumerate(((s, r'$s=\partial_t\rho+\nabla\cdot\mathbf{j}$  (the leak)'), (e, r'$e$  (frozen exchange)'), (b, r'$b$  (finite basis)'))):
    im = ax[i].pcolormesh(X, Zc, f[np.ix_(m, m)], cmap=cmap, vmin=-vmax, vmax=vmax, shading='nearest', rasterized=True); ax[i].set_title(name, pad=4)
def stream(a, v, title, ref):
    vx, vz = v[0][np.ix_(m, m)], v[2][np.ix_(m, m)]; sp = np.sqrt(vx ** 2 + vz ** 2)
    a.pcolormesh(X, Zc, sp, cmap='gray', vmin=0, vmax=ref, shading='nearest', rasterized=True)
    a.streamplot(xs, xs, vx.T, vz.T, color='#48dbfb', density=1.3, linewidth=0.6 + 1.6 * np.minimum(sp.T / ref, 1), arrowsize=0.7)
    a.set_title(title, pad=4)
ref = np.percentile(np.sqrt((j[np.ix_([0, 2], m, m)] ** 2).sum(0)), 99.5)
stream(ax[3], j, r'$\mathbf{j}$, the current', ref)
stream(ax[4], c, r'$\mathbf{c}^*=\nabla\varphi$, the repair (closed walls)', ref)
stream(ax[5], j + c, r'$\mathbf{j}+\mathbf{c}^*$, the repaired current', ref)
for a in ax:
    a.set_aspect('equal'); a.set_xlim(-Lw, Lw); a.set_ylim(-Lw, Lw); a.axvline(0, color='#777', ls=':', lw=0.7)
    a.plot(R[0, 0], R[0, 2], 'o', color='white', ms=3.5); a.plot(R[1:, 0], R[1:, 2], '+', color='white', ms=6, mew=0.8)
    a.set_xlabel('$x$ (bohr)'); a.set_ylabel('$z$ (bohr)'); a.tick_params(length=2)
cb = fig.colorbar(im, ax=ax[:3].tolist(), fraction=0.02, pad=0.01); cb.set_label(r'per unit $\sin\Delta\varepsilon t$  (a.u.)', color='white'); cb.ax.yaxis.set_tick_params(color='#aaa'); plt.setp(cb.ax.get_yticklabels(), color='#aaa')
fig.suptitle(f'Water, STO-3G, the HOMO + LUMO packet: section $y=0$; dot O, crosses the H nuclei projected, dotted line the molecular plane; grid {N}³', y=0.995, fontsize=9)
fig.savefig(os.path.join(HERE, f'leak_repair_N{N}.png'), facecolor='black', bbox_inches='tight'); print('wrote', f'leak_repair_N{N}.png')
