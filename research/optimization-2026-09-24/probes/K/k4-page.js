/* probes/K/k4-page.js — K4 gate in the page (run with probes/K/run.mjs, µs timers).  PRE sets globalThis.__K4 = 'cold' | 'warm'.
 *  cold: the first AXIAL press straight after ready (before the idle warm) — pays the build it used to pay at boot.
 *  warm: 4.5 s after ready (the warm has run): `gas.modes` is already built, and the first AXIAL press pays the launch only.
 *  both: 60 WELL RADIUS pointermoves through LW.gas.setRadius, against the base gas.js imported into the same page. */
const LW = __LW, mode = globalThis.__K4 || 'warm';
const out = { mode };
const now = () => performance.now();
if (mode === 'warm') { await new Promise((r) => setTimeout(r, 4500)); const t0 = now(); LW.gas.modes; out.modesGetterMs = +(now() - t0).toFixed(3); }
LW.pause(); LW.setHamiltonian('well');
{ const t0 = now(); LW.setGasBasis('axial'); LW.enterBox(); out.firstAxialPressMs = +(now() - t0).toFixed(2); }
{ const t0 = now(); LW.enterBox(); out.secondPressMs = +(now() - t0).toFixed(2); }
const drag = (G) => { const ms = []; for (let i = 0; i < 60; i++) { const t0 = now(); G.setRadius(10 + 0.05 * (i + 1)); ms.push(now() - t0); } ms.sort((x, y) => x - y); return { median: +ms[30].toFixed(4), max: +ms[59].toFixed(4) }; };
const { createGas: baseGas } = await import('/research/optimization-2026-09-24/probes/K/gas-base.js');
const B = baseGas(10);
out.setRadiusBase = drag(B);
out.setRadiusBuilt = drag(LW.gas);
LW.gas.setRadius(10); LW.setGasBasis('reg'); LW.setHamiltonian('hydrogen');
return out;
