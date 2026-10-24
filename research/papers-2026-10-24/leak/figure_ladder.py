"""figure_ladder.py — water up the basis ladder: the leak s (top) and its basis part b (bottom) in the section y = 0 for STO-3G, 6-31G and 6-31G*,
each column on its own signed scale (the scales differ by an order of magnitude; the number in each title is the column's full scale).
Run: python -I figure_ladder.py  (reads fields_N224.npz, fields_water_6-31g_N224.npz, fields_water_6-31gd_N224.npz)"""
import os, json
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
HERE = os.path.dirname(os.path.abspath(__file__))
cols = [('fields_N224.npz', 'leak_repair_N224.json', 'STO-3G'), ('fields_water_6-31g_N224.npz', 'leak_water_6-31g_N224.json', '6-31G'), ('fields_water_6-31gd_N224.npz', 'leak_water_6-31gd_N224.json', '6-31G*')]
cmap = LinearSegmentedColormap.from_list('leak', [(0.0, '#ff9f43'), (0.5, '#000000'), (1.0, '#48dbfb')])
plt.rcParams.update({'figure.facecolor': 'black', 'axes.facecolor': 'black', 'axes.edgecolor': '#888', 'text.color': 'white', 'axes.labelcolor': 'white',
                     'xtick.color': '#aaa', 'ytick.color': '#aaa', 'font.family': 'serif', 'font.size': 9})
fig, ax = plt.subplots(2, 3, figsize=(9.6, 6.2), dpi=200); Lw = 3.0
for ci, (fz, js, name) in enumerate(cols):
    F = np.load(os.path.join(HERE, fz)); d = json.load(open(os.path.join(HERE, js))); x = F['x']; n = len(x); k = n // 2; m = np.abs(x) <= Lw; xs = x[m]; X, Z = np.meshgrid(xs, xs, indexing='ij')
    sec = lambda f: 0.5 * (f[:, k - 1, :] + f[:, k, :]); R = F['atoms']
    q = d['q']; qq = d['repair']['neumann']['q_repaired']; sh = d['first_moment_share']
    for ri, (key, label) in enumerate((('s', 's'), ('b', 'b'))):
        f = sec(F[key])[np.ix_(m, m)]; v = np.percentile(np.abs(f), 99.5); a = ax[ri, ci]
        a.pcolormesh(X, Z, f, cmap=cmap, vmin=-v, vmax=v, shading='nearest', rasterized=True); a.set_aspect('equal'); a.set_xlim(-Lw, Lw); a.set_ylim(-Lw, Lw)
        a.axvline(0, color='#777', ls=':', lw=0.7); a.plot(R[0, 0], R[0, 2], 'o', color='white', ms=3.5); a.plot(R[1:, 0], R[1:, 2], '+', color='white', ms=6, mew=0.8)
        a.set_xlabel('$x$ (bohr)'); a.set_ylabel('$z$ (bohr)'); a.tick_params(length=2)
        a.set_title((f'{name}:  $s$, scale $\\pm{v:.2f}$;  $q={q:+.2f}$, $q\'={qq:+.4f}$' if ri == 0 else f'$b$ (basis), scale $\\pm{v:.2f}$;  basis share of $\\int x\\,s$: ${sh["basis"]:+.2f}$'), pad=4, fontsize=8.5)
fig.tight_layout()
fig.savefig(os.path.join(HERE, 'leak_ladder.png'), facecolor='black', bbox_inches='tight'); print('wrote leak_ladder.png')
