// VERIFIER PROBE · wave 133 — who wins elementFromPoint where the pane and the + / ☆ column overlap (1024 × 1366 and 1000 × 700).
//   LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/plus-star-hit.mjs
import { open } from '../../../../tools/gate/gatekit.mjs';
const URL_ = `https://127.0.0.1:${process.env.LW_PORT || 8732}/lab/?preset=1s%2B2pz`;
for (const [W, H] of [[1024, 1366], [1000, 700]]) {
  const g = await open(URL_, { width: W, height: H });
  try {
    await g.waitFor('window.__LW && __LW.ready', 400, 100);
    const r = await g.ev(`try { await __LW.settle(); } catch (e) {} __LW.loadPreset('2pz'); __LW.history.flush(); const sw = __LW.sw; sw.reload = () => {}; sw.state = 'idle'; sw.offered = null; sw.pending = { build: 'x' };
      sw.buildReady(() => {}); await new Promise((q) => setTimeout(q, 300));
      const at = (id) => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); const h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return { winner: h === e || e.contains(h) ? id : (h.closest('#offer') ? 'offer' : (h.id || h.className)), z: getComputedStyle(e).zIndex }; };
      const p = document.getElementById('offer'); return { paneShown: !p.hidden, paneZ: getComputedStyle(p).zIndex, stageZ: getComputedStyle(document.getElementById('stage')).zIndex, plus: at('rackAdd'), star: at('rackFav'), toggle: at('rackToggle') };`);
    console.log(W + '×' + H, JSON.stringify(r));
  } finally { await g.close(); }
}
