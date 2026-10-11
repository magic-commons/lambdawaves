# sonnet2-s1: check the single-impurity transmission T = 4 t^2 sin^2 k / (4 t^2 sin^2 k + eps^2) on H = -t sum |n><n+1| + h.c. + eps |0><0| by solving the scattering state numerically (open chain, plane wave in, solve linear system).
import cmath, math, json
def T_num(k, eps, t=1.0, L=400):
    # sites -L..L ; incoming e^{ikn} + r e^{-ikn} left, tau e^{ikn} right ; E = -2 t cos k ; solve for psi on the 3 central sites by matching
    E = -2*t*math.cos(k)
    # unknowns r, tau ; use psi_n = e^{ikn} + r e^{-ikn} (n<=0), tau e^{ikn} (n>=0) ; continuity at n=0: 1 + r = tau
    # equation at site 0: -t(psi_1 + psi_-1) + eps psi_0 = E psi_0
    r, tau = None, None
    # psi_0 = tau ; psi_1 = tau e^{ik} ; psi_-1 = e^{-ik} + r e^{ik}, with r = tau - 1
    # -t(tau e^{ik} + e^{-ik} + (tau-1) e^{ik}) + eps tau = E tau
    # tau( -t e^{ik} - t e^{ik} + eps - E ) = t(e^{-ik} - e^{ik})
    tau = t*(cmath.exp(-1j*k) - cmath.exp(1j*k)) / (-2*t*cmath.exp(1j*k) + eps - E)
    return abs(tau)**2
rows=[]
for k in (0.3, 1.0, 1.5):
    for eps in (0.5, 1.0, 2.0):
        closed = 4*math.sin(k)**2/(4*math.sin(k)**2 + eps**2)
        rows.append({'k':k,'eps':eps,'T_numeric':T_num(k,eps),'T_closed':closed,'diff':abs(T_num(k,eps)-closed)})
json.dump(rows, open('sonnet2-s1-chain-check.json','w'), indent=1)
print(max(r['diff'] for r in rows)); print(rows[:3])
