/* PREFILE: K1 timing on the three heavy states, batches >= 2.5 s (Firefox's 100 ms completion tick) */
globalThis.__K_STATES = ['h91', 'box', 'gas'];
globalThis.__K_RES = [64, 96, 128];
globalThis.__K_TIME = 2500;
globalThis.__K_VARIANTS = (X) => ({ ship: X.BASE, cur: X.CUR });
