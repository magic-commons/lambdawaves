"""Independent analytic 1s-LCAO H2+ pulse oracle; SciPy DOP853, no lab imports.
Run: ~/miniforge3/envs/sci/bin/python research/astra-2026-09-05/reference-drive.py
"""
import json
from pathlib import Path
import numpy as np
import scipy
from scipy.integrate import solve_ivp

R = 2.0
S = np.exp(-R) * (1 + R + R*R/3)
J = -1/R + np.exp(-2*R)*(1+1/R)
K = -np.exp(-R)*(1+R)
Eg, Eu = -.5+(J+K)/(1+S), -.5+(J-K)/(1-S)  # electronic only
d = -R/(2*np.sqrt(1-S*S))
duration, amplitude, omega, end = 48., .02, Eu-Eg, 96.
def field(t):
    return amplitude*np.sin(np.pi*t/duration)**2*np.cos(omega*t) if 0<t<duration else 0.
def rhs(t,c):
    return -1j*np.array([[Eg,field(t)*d],[field(t)*d,Eu]]) @ c

times = np.arange(0,end+1,4.)
def run(rtol,atol):
    # Segment at the pulse boundary; no adaptive step may silently skip the whole pulse.
    first=solve_ivp(rhs,(0,duration),[1+0j,0j],method='DOP853',rtol=rtol,atol=atol,max_step=.25,dense_output=True)
    second=solve_ivp(rhs,(duration,end),first.y[:,-1],method='DOP853',rtol=rtol,atol=atol,max_step=.25,dense_output=True)
    assert first.success and second.success
    return np.array([first.sol(t) if t<=duration else second.sol(t) for t in times])
c=run(2e-13,2e-14); fine=run(3e-14,3e-15)
ao=np.array([[1/np.sqrt(2*(1+S)),1/np.sqrt(2*(1-S))],[1/np.sqrt(2*(1+S)),-1/np.sqrt(2*(1-S))]])
rows=[]
for t,cm in zip(times,fine):
    v=ao @ cm
    rows.append(dict(t=float(t),re=v.real.tolist(),im=v.imag.tolist(),popU=float(abs(cm[1])**2),z=float(2*d*(cm[0].conjugate()*cm[1]).real)))
out=dict(provenance=dict(method='analytic 1s LCAO + scipy DOP853',scipy=scipy.__version__,rtol=3e-14,atol=3e-15,
    refinementMaxAmplitudeDifference=float(abs(c-fine).max())),R=R,S=float(S),electronicEnergies=[float(Eg),float(Eu)],dipoleGU=float(d),
    pulse=dict(amplitude=amplitude,omega=float(omega),duration=duration),end=end,samples=rows)
path=Path(__file__).with_name('reference-drive.json');path.write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k!='samples'},indent=2))
