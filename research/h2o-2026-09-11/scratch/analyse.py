# analyse.py — RT-RHF kick spectra of rt.mjs against the PySCF RPA/TDA oracle, per polarisation, with convergence.
import json, sys, numpy as np
lad = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'rt-ladder.json'))
orc = json.load(open('../oracle-h2o.json'))
tdhf, tda = orc['tdhf'], orc['tda']
mu = np.array(tdhf['transition_dipole_au'])
bright = {q: [(w, abs(mu[i, q])) for i, w in enumerate(tdhf['roots_au']) if abs(mu[i, q]) > 1e-4] for q in range(3)}
print('PySCF RPA bright roots (ω, |μ_q|) per polarisation:')
for q in range(3): print('  ', 'xyz'[q], ' '.join(f'{w:.9f}({d:.4f})' for w, d in bright[q]))
print('  dark RPA roots:', ' '.join(f'{w:.9f}' for i, w in enumerate(tdhf['roots_au']) if np.max(np.abs(mu[i])) <= 1e-4))
rows = {}
for r in lad['runs']:
    q, key = r['q'], (r['integrator'], r['dt'])
    for sp in r['spec']:
        om = np.array([s['w0'] + i*s['dwSub'] for i, s in [(i, sp) for i in range(len(sp['ImAlphaSub']))]])
        rows[(key, q, sp['name'])] = {'peaks': sp['peaks'], 'omega': om, 'ImAlpha': np.array(sp['ImAlphaSub'])}
    rows[(key, q, 'diag')] = r['diag']; rows[(key, q, 'wall')] = r['wall']
print(f"\nT = {lad['T']}  τ = {lad['tau']}  κ = {lad['kappa']}  sampling Δt_out = {lad['dtOut']}  RHF Δ vs PySCF = {lad['rhfDeltaVsPyscf']:.3e}")
keys = sorted({k[0] for k in rows}, key=lambda k: (k[0], -k[1]))
print('\n(a) peak positions against the PySCF RPA roots (Δ = ω_RT − ω_RPA); TDA distance for contrast')
for q in range(3):
    for win in ('valence','core'):
        refs = [w for w, d in bright[q] if (w < 2) == (win == 'valence')]
        if not refs: print(f"  {'xyz'[q]} {win}: no RPA-bright root; largest spurious Im α in the window ="
              f" {max(max(p['imAlpha'] for p in rows[(k,q,win)]['peaks']) if rows[(k,q,win)]['peaks'] else 0 for k in keys):.2e}"); continue
        for w in refs:
            line = f"  {'xyz'[q]} {win} ω_RPA={w:.9f}: "
            for k in keys:
                pk = rows[(k,q,win)]['peaks']
                if not pk: line += f"{k[0][:3]}{k[1]}:--  "; continue
                best = min(pk, key=lambda p: abs(p['omega']-w))
                line += f"{k[0][:3]}{k[1]}:{best['omega']-w:+.2e} "
            dtaq = min((abs(x-w), x) for x in tda['roots_au'])[1]
            print(line + f" | nearest TDA {dtaq:.6f} (Δ {dtaq-w:+.4f})")
print('\n(b) second-order convergence: sup|Im α(Δt) − Im α(Δt/2)| per window, and the peak-position error ratio')
for fam, dts in (('magnus2', [0.02,0.01,0.005]), ('mmut', [0.01,0.005,0.0025])):
    for win in ('valence','core'):
        for q in range(3):
            refs = [w for w, d in bright[q] if (w < 2) == (win == 'valence')]
            if not refs: continue
            sup = [float(np.max(np.abs(rows[((fam,dts[i]),q,win)]['ImAlpha'] - rows[((fam,dts[i+1]),q,win)]['ImAlpha']))) for i in range(len(dts)-1)]
            errs = []
            for dt in dts:
                pk = rows[((fam,dt),q,win)]['peaks']
                errs.append(max(abs(min(pk, key=lambda p: abs(p['omega']-w))['omega']-w) for w in refs) if pk else float('nan'))
            print(f"  {fam:7s} {win:7s} {'xyz'[q]}  supΔImα {sup[0]:.3e} → {sup[1]:.3e} ratio {sup[0]/sup[1]:.2f}"
                  f" | max|Δω| {errs[0]:.3e} {errs[1]:.3e} {errs[2]:.3e} ratios {errs[0]/errs[1]:.2f} {errs[1]/errs[2]:.2f}")
print('\n(c) invariants (end of run)')
for k in keys:
    for q in range(3):
        d = rows[(k,q,'diag')]
        print(f"  {k[0]:7s} dt={k[1]:<7} {'xyz'[q]}  Tr P = {d['electrons1']:.12f}  Im Tr = {d['imTr1']:.2e}  idem = {d['idem1']:.2e}"
              f"  E(0) = {d['E0']:.12f}  drift = {d['E1']-d['E0']:+.2e}  {rows[(k,q,'wall')]:.0f}s")
