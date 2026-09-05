"""Plot actual JS solver output. Run drive-trace.mjs first. Requires matplotlib and numpy."""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
p=Path(__file__).parent
d=json.loads((p/'drive-trace.json').read_text());r=d['rows'];t=np.array([v['t'] for v in r])
plt.rcParams.update({'font.size':11,'axes.spines.top':False,'axes.spines.right':False})
fig,axs=plt.subplots(4,1,figsize=(10,10),layout='constrained')
fig.suptitle('Field-driven H₂⁺: a reproducible first molecular experiment',fontsize=16)
for ax,key,label,color in zip(axs[:3],['field','popU','dipole'],['Applied field (a.u.)','Antibonding population','Total dipole (e a₀)'],['#54616e','#a73637','#286685']):
    ax.plot(t,[v[key] for v in r],color=color,lw=1.7);ax.set_ylabel(label);ax.set_xlim(0,96);ax.axvline(48,color='gray',ls=':',lw=1);ax.grid(alpha=.2)
axs[0].set_title('Fixed nuclei R = 2 a₀ · one electron · two 1s functions · length gauge · Δt = 0.05 a.u.',fontsize=11)
axs[2].set_xlabel('Time (atomic units; 1 a.u. ≈ 24.19 attoseconds)')
for s in d['slices'][2:6]:
    a=np.array(s['values']);axs[3].plot(a[:,0],a[:,1],label=f"t = {s['t']:.0f}")
axs[3].axhline(0,color='gray',lw=.7)
for z in [-1,1]:axs[3].axvline(z,color='gray',ls=':',lw=1)
axs[3].set_xlabel('Position along bond z (a₀); dotted lines mark nuclei')
axs[3].set_ylabel('Δ electron density (a₀⁻³)');axs[3].legend(ncol=4,fontsize=9);axs[3].grid(alpha=.2)
fig.savefig(p/'driven-h2plus.png',dpi=165)
fig.savefig(p/'driven-h2plus.pdf')
print('Wrote driven-h2plus.png and .pdf; this is finite-basis dynamics, not converged molecular spectroscopy.')
