/* la6-radius.mjs — find a road to a > 8 s scan: the well radius (smaller box → wider spectrum → more scan steps). */
import { page } from './lib.mjs';
const g = await page();
try {
  const r = await g.ev(`const ids = __LW.mod.targets().map((d) => d.id || d).filter((id) => /well|radius/i.test(String(id)));
    const H = __LW.history; return { ids, hist: !!H };`);
  console.log(JSON.stringify(r));
  const c = await g.ev(`__LW.setHamiltonian('well'); __LW.setGasBasis('reg');
    const S = __LW.serialize(); S.presentation.hamiltonian = Object.assign({}, S.presentation.hamiltonian, { id: 'well', well: 7 });
    __LW.restore({ experiment: S.experiment, presentation: { hamiltonian: S.presentation.hamiltonian } }, { keepTime: true });
    __LW.launchPacket([-2.3, 0.5, 0.2], [1.1, 0.1, 0], 1.0); __LW.pause(); await __LW.settle();
    __LW.reg.setField({ Bz: 0.003 }); const t0 = performance.now(); const P = __LW.period; const ms = performance.now() - t0; __LW.reg.setField({ Bz: 0 });
    return { radius: __LW.api && __LW.api.hamiltonian ? null : null, well: S.presentation.hamiltonian.well, ms: +ms.toFixed(0), populated: __LW.reg.populated().length, P: { count: P.count, pairs: P.pairs } };`);
  console.log(JSON.stringify(c));
} finally { await g.close(); }
