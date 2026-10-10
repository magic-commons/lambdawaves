/* .tmp/gasro.mjs — one reading: the axial gas through kepler.js' enterBox, then the worker-painted ⟨z⟩ · σ_z line once the loop asks (K5w) */
import { open } from '../tools/gate/gatekit.mjs';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT}/lab/?preset=1s%2B2pz`);
try {
  await g.ev('await window.__LW.ready; return true;');
  const r = await g.ev(`try { const LW = __LW; LW.pause(); LW.setHamiltonian('well'); LW.setGasBasis('axial'); await LW.settle(); LW.enterBox();
    const ro = () => [...document.querySelectorAll('.dev[data-id="spectrum"] .ro-val')].map((e) => e.textContent).join(' | ');
    const first = ro(); let seen = null; const t0 = performance.now();
    while (performance.now() - t0 < 20000) { await new Promise((r) => setTimeout(r, 250)); if (/σ_z/.test(ro())) { seen = ro(); break; } }
    LW.pause(); return { first, seen, ms: Math.round(performance.now() - t0), t: LW.clock.t, errs: window.__e.length };
  } catch (e) { return { error: String(e && e.message || e) }; }`);
  console.log(JSON.stringify(r));
} finally { await g.close?.(); }
